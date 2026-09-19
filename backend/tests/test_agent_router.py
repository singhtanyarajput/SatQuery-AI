"""Comprehensive verification suite for Phase 2: Dynamic Agent Router & Domain Specialist Integration.

Tests:
1. SemanticIntentRouter (LLM JSON parsing, offline fallback, input constraint validation).
2. Modular ToolRegistry (Singleton, registration, schema introspection, dispatch).
3. Specialist tools (WaterGroundingTool, TemporalChangeTool, OpticalSARFusionTool, GeodesicMeasurementTool).
4. RemoteSensingVLMClient (domain prompt adaptation, GSD awareness, fallback).
5. SatQueryController integration (AgentScratchpad, trace log enrichment, QueryResponseEnvelope).
"""

from __future__ import annotations

import json
from pathlib import Path
from typing import Any, Dict, List
from unittest.mock import MagicMock, patch

import numpy as np
import pytest
import rasterio
from rasterio.transform import from_bounds

from app.agents.semantic_router import SemanticIntent, SemanticIntentRouter
from app.schemas.trace import AuditableTraceLogSchema
from app.services.agent import SatQueryController
from app.services.models.rs_vlm import RemoteSensingVLMClient
from app.tools.base import AgentScratchpad, BaseTool
from app.tools.registry import ToolRegistry, registry
from app.tools.specialists import (
    GeodesicMeasurementTool,
    OpticalSARFusionTool,
    TemporalChangeTool,
    WaterGroundingTool,
)


@pytest.fixture
def synthetic_geotiff(tmp_path: Path) -> Path:
    """Create a valid georeferenced GeoTIFF in EPSG:4326 for testing."""
    file_path = tmp_path / "test_optical.tif"
    w, h = 64, 64
    transform = from_bounds(77.58, 12.96, 77.60, 12.98, w, h)
    arr = np.random.randint(40, 200, size=(4, h, w), dtype=np.uint8)

    with rasterio.open(
        file_path,
        "w",
        driver="GTiff",
        height=h,
        width=w,
        count=4,
        dtype=arr.dtype,
        crs="EPSG:4326",
        transform=transform,
    ) as dst:
        dst.write(arr)
    return file_path


@pytest.fixture
def synthetic_geotiff_pair(tmp_path: Path) -> tuple[Path, Path]:
    """Create a pair of aligned GeoTIFFs for temporal / cross-modal tests."""
    p1 = tmp_path / "t1_optical.tif"
    p2 = tmp_path / "t2_sar.tif"
    w, h = 64, 64
    transform = from_bounds(77.58, 12.96, 77.60, 12.98, w, h)
    arr1 = np.random.randint(40, 200, size=(3, h, w), dtype=np.uint8)
    arr2 = np.random.randint(10, 150, size=(1, h, w), dtype=np.uint8)

    for p, arr, count in [(p1, arr1, 3), (p2, arr2, 1)]:
        with rasterio.open(
            p,
            "w",
            driver="GTiff",
            height=h,
            width=w,
            count=count,
            dtype=arr.dtype,
            crs="EPSG:4326",
            transform=transform,
        ) as dst:
            dst.write(arr)
    return p1, p2


# ==============================================================================
# 1. SEMANTIC INTENT ROUTER TESTS
# ==============================================================================

def test_semantic_router_offline_fallback():
    """Verify router produces a valid SemanticIntent when Ollama is unavailable."""
    router = SemanticIntentRouter(ollama_url="http://127.0.0.1:9999")
    SemanticIntentRouter._ollama_available = False  # force offline

    # Grounding query
    intent = router.parse_intent(
        query="Highlight the water reservoir and calculate its boundary",
        filepaths=["image1.tif"],
    )
    assert isinstance(intent, SemanticIntent)
    assert intent.task in ["single_image_grounding", "single_grounding"]
    assert intent.task_type == "single_grounding"
    assert "water_grounding_tool" in intent.tool_chain
    assert "geodesic_measurement_tool" in intent.tool_chain
    assert intent.confidence >= 0.85


def test_semantic_router_llm_json_parsing():
    """Verify router correctly digests structured JSON output from Ollama /api/chat."""
    router = SemanticIntentRouter()
    SemanticIntentRouter._ollama_available = True

    mock_chat_response = {
        "task": "single_image_grounding",
        "target_features": ["water_body", "reservoir"],
        "tool_chain": ["water_grounding_tool", "geodesic_measurement_tool"],
        "confidence": 0.98,
        "reasoning": "Detected request for water boundary and geodesic area.",
    }

    with patch.object(router, "_call_ollama_chat_router", return_value=mock_chat_response):
        intent = router.parse_intent(
            query="Extract the water body and measure its area",
            filepaths=["scene.tif"],
        )
        assert intent.task == "single_image_grounding"
        assert intent.task_type == "single_grounding"
        assert intent.target_features == ["water_body", "reservoir"]
        assert intent.tool_chain == ["water_grounding_tool", "geodesic_measurement_tool"]
        assert intent.confidence == 0.98
        assert "water boundary" in intent.reasoning


def test_semantic_router_input_constraint_rejections():
    """Verify router strictly rejects input-intent mismatches with informative ValueErrors."""
    router = SemanticIntentRouter()
    SemanticIntentRouter._ollama_available = False

    # 1 Image + temporal change query -> ValueError
    with pytest.raises(ValueError, match="Bi-temporal change detection requires two spatially aligned images"):
        router.parse_intent(
            query="What changed between these two dates?",
            filepaths=["only_one_image.tif"],
        )

    # 0 Images + temporal change query -> ValueError
    with pytest.raises(ValueError, match="Bi-temporal change detection requires two spatially aligned images"):
        router.parse_intent(
            query="Has the urban area increased or decreased between dates?",
            filepaths=[],
        )

    # 1 Image + Optical+SAR query -> ValueError
    with pytest.raises(ValueError, match="Cross-modal Optical\\+SAR joint analysis requires both Optical and SAR"):
        router.parse_intent(
            query="Combine optical RGB and radar SAR for joint flood mapping",
            filepaths=["optical_only.tif"],
        )


def test_semantic_router_zero_file_text_qa():
    """Verify zero-file conversational queries route deterministically to domain_knowledge_qa."""
    router = SemanticIntentRouter()
    SemanticIntentRouter._ollama_available = False

    intent = router.parse_intent(
        query="What is the orbital revisit cycle of Cartosat-2S?",
        filepaths=[],
    )
    assert intent.task == "domain_knowledge_qa"
    assert intent.task_type == "domain_knowledge_qa"
    assert intent.tool_chain == []


# ==============================================================================
# 2. MODULAR TOOL REGISTRY TESTS
# ==============================================================================

def test_tool_registry_singleton_and_defaults():
    """Verify ToolRegistry maintains singleton lifecycle and registers required specialists."""
    reg1 = ToolRegistry()
    reg2 = ToolRegistry()
    assert reg1 is reg2

    tools = reg1.list_tools()
    assert "water_grounding_tool" in tools
    assert "temporal_change_tool" in tools
    assert "optical_sar_fusion_tool" in tools
    assert "geodesic_measurement_tool" in tools


def test_tool_registry_schemas():
    """Verify ToolRegistry generates valid OpenAI/Ollama function-calling schemas."""
    reg = ToolRegistry()
    schemas = reg.get_schemas()
    assert len(schemas) >= 4

    names = [s["function"]["name"] for s in schemas]
    assert "water_grounding_tool" in names
    assert "temporal_change_tool" in names
    assert "geodesic_measurement_tool" in names


def test_tool_registry_custom_registration():
    """Verify custom tool registration and dispatch."""
    class EchoTool(BaseTool):
        name = "echo_tool"
        description = "Echoes input query"
        def execute(self, scratchpad: Dict[str, Any], **kwargs: Any) -> Dict[str, Any]:
            scratchpad["echo"] = scratchpad.get("query")
            return {"echo": scratchpad.get("query")}

    reg = ToolRegistry()
    reg.register(EchoTool())
    assert "echo_tool" in reg.list_tools()

    scratchpad: Dict[str, Any] = {"query": "test query"}
    res = reg.execute_tool("echo_tool", scratchpad)
    assert res["echo"] == "test query"
    assert scratchpad["echo"] == "test query"


# ==============================================================================
# 3. SPECIALIST TOOLS EXECUTION
# ==============================================================================

def test_water_grounding_tool_execution(synthetic_geotiff: Path):
    """Verify WaterGroundingTool populates scratchpad with GeoJSON instances."""
    tool = WaterGroundingTool()
    scratchpad: Dict[str, Any] = {
        "query": "Ground the water body",
        "filepaths": [str(synthetic_geotiff)],
        "use_mobilesam": False,
        "intermediate_steps": [],
    }

    result = tool.execute(scratchpad)
    assert result["status"] == "success"
    assert "grounding_geojson" in scratchpad
    assert scratchpad["grounding_geojson"]["type"] == "FeatureCollection"
    assert len(scratchpad["intermediate_steps"]) == 1
    assert scratchpad["intermediate_steps"][0]["tool"] == "water_grounding_tool"


def test_temporal_change_tool_execution(synthetic_geotiff_pair: tuple[Path, Path]):
    """Verify TemporalChangeTool computes CD-VQA-Pro metrics and populates scratchpad."""
    p1, p2 = synthetic_geotiff_pair
    tool = TemporalChangeTool()
    scratchpad: Dict[str, Any] = {
        "query": "What has changed between these dates?",
        "filepaths": [str(p1), str(p2)],
        "intermediate_steps": [],
    }

    result = tool.execute(scratchpad)
    assert result["status"] == "success"
    assert "change_metrics" in scratchpad
    assert "change_mask_path" in scratchpad
    assert len(scratchpad["intermediate_steps"]) == 1
    assert scratchpad["intermediate_steps"][0]["tool"] == "temporal_change_tool"


def test_optical_sar_fusion_tool_execution(synthetic_geotiff_pair: tuple[Path, Path]):
    """Verify OpticalSARFusionTool executes cross-modal analysis."""
    p1, p2 = synthetic_geotiff_pair
    tool = OpticalSARFusionTool()
    scratchpad: Dict[str, Any] = {
        "query": "Delineate radar water and optical built-up features",
        "filepaths": [str(p1), str(p2)],
        "intermediate_steps": [],
    }

    result = tool.execute(scratchpad)
    assert result["status"] == "success"
    assert "cross_modal_metrics" in scratchpad
    assert "grounding_geojson" in scratchpad
    assert len(scratchpad["intermediate_steps"]) == 1
    assert scratchpad["intermediate_steps"][0]["tool"] == "optical_sar_fusion_tool"


def test_geodesic_measurement_tool():
    """Verify GeodesicMeasurementTool calculates m², hectares, and km² from polygon geometry."""
    tool = GeodesicMeasurementTool()

    # GeoJSON polygon covering ~1 degree box near equator
    geojson = {
        "type": "FeatureCollection",
        "features": [
            {
                "type": "Feature",
                "geometry": {
                    "type": "Polygon",
                    "coordinates": [
                        [
                            [77.58, 12.96],
                            [77.59, 12.96],
                            [77.59, 12.97],
                            [77.58, 12.97],
                            [77.58, 12.96],
                        ]
                    ],
                },
                "properties": {},
            }
        ],
    }

    scratchpad: Dict[str, Any] = {
        "grounding_geojson": geojson,
        "intermediate_steps": [],
    }

    result = tool.execute(scratchpad)
    assert result["status"] == "success"
    metrics = scratchpad["geospatial_metrics"]
    assert metrics["surface_area_m2"] > 0
    assert metrics["hectares"] == round(metrics["surface_area_m2"] / 10000.0, 4)
    assert metrics["sq_km"] == round(metrics["surface_area_m2"] / 1_000_000.0, 6)
    assert len(scratchpad["intermediate_steps"]) == 1


# ==============================================================================
# 4. REMOTE SENSING VLM SPECIALIST CLIENT
# ==============================================================================

def test_remote_sensing_vlm_client_prompt_enrichment():
    """Verify RemoteSensingVLMClient decorates prompt with GSD, sensor, and LULC context."""
    client = RemoteSensingVLMClient()
    formatted = client._format_rs_prompt(
        query="Identify runway structures",
        extra_context={
            "resolution": "0.8m/px",
            "sensor": "Cartosat-2S",
            "land_cover_classes": ["Transport infrastructure", "Bare soil"],
        },
    )
    assert "[Spatial Resolution: 0.8m/px]" in formatted
    assert "[Sensor: Cartosat-2S]" in formatted
    assert "[Surface Land Cover Context: Transport infrastructure, Bare soil]" in formatted
    assert "Overhead remote sensing query: Identify runway structures" in formatted


def test_remote_sensing_vlm_client_execution(synthetic_geotiff: Path):
    """Verify RemoteSensingVLMClient runs inference and returns structured VLMResult."""
    client = RemoteSensingVLMClient()
    result = client.describe_scene(image_path=synthetic_geotiff)
    assert result.text
    assert result.confidence >= 0.85
    assert result.params.get("domain_specialist") == "GeoChat-RS"


# ==============================================================================
# 5. CONTROLLER INTEGRATION & AUDITABLE TRACE LOG
# ==============================================================================

def test_controller_populates_intent_and_geospatial_metrics(synthetic_geotiff: Path):
    """Verify SatQueryController integrates router intent and populates geospatial metrics."""
    controller = SatQueryController()
    trace = controller.execute_workflow(
        query="Highlight the water reservoir and compute its boundary",
        filepaths=[str(synthetic_geotiff)],
    )

    assert isinstance(trace, AuditableTraceLogSchema)
    assert trace.intent_classification is not None
    assert trace.intent_classification["task_type"] == "single_grounding"
    assert "water_grounding_tool" in trace.intent_classification["tool_chain"]

    # Geospatial metrics populated
    assert trace.geospatial_metrics is not None
    assert "surface_area_m2" in trace.geospatial_metrics
    assert "hectares" in trace.geospatial_metrics
    assert "sq_km" in trace.geospatial_metrics

    # Tools executed trace populated
    assert trace.tools_executed is not None
    executed_tools = [step.get("tool") for step in trace.tools_executed]
    assert "geodesic_measurement_tool" in executed_tools


def test_controller_text_only_intent_enrichment():
    """Verify SatQueryController text-only workflow captures semantic intent without imagery."""
    controller = SatQueryController()
    trace = controller.execute_workflow(
        query="What is the orbital altitude and revisit cycle of Cartosat-2S in Sun-synchronous orbit?",
        filepaths=[],
    )

    assert isinstance(trace, AuditableTraceLogSchema)
    assert trace.task_type == "domain_knowledge_qa"
    assert trace.intent_classification is not None
    assert trace.intent_classification["task"] == "domain_knowledge_qa"
    assert trace.input_metadata.modalities == ["Text-Only"]
