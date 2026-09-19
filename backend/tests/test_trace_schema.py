"""Phase 5 Step 10 — strict Pydantic auditable trace schemas."""

from __future__ import annotations

from app.schemas.trace import AuditableTraceLogSchema


def test_auditable_trace_log_schema_constructs() -> None:
    data = {
        "trace_id": "TEST-123",
        "task": "single_image_vqa",
        "query": "Is there vegetation?",
        "input_metadata": {
            "crs": "EPSG:4326",
            "bounds": [0.0, 0.0, 1.0, 1.0],
            "affine_transform": [1.0, 0.0, 0.0, 0.0, 1.0, 0.0],
            "modalities": ["Optical"],
        },
        "registry_execution": [{"model": "VQA-Model", "params": {}}],
        "confidence_score": 0.95,
        "output": "Yes, dense vegetation is present.",
    }
    log = AuditableTraceLogSchema(**data)
    assert log.trace_id == "TEST-123"
    assert log.task == "single_image_vqa"
    assert log.input_metadata.crs == "EPSG:4326"
    assert log.registry_execution[0].model == "VQA-Model"
    assert log.confidence_score == 0.95


def test_auditable_trace_log_schema_tools_executed_variants() -> None:
    from app.schemas.trace import RegistryExecutionSchema

    tool1 = RegistryExecutionSchema(model="CD-VQA-Pro", params={"epoch_difference": True})
    tool2 = RegistryExecutionSchema(model="Opt-SAR-Fusion-Net", params={"cross_attention": True})
    tool3 = {"tool": "geodesic_measurement_tool", "status": "success", "metrics": {"surface_area_m2": 1200.0}}

    data = {
        "trace_id": "TEST-456",
        "task": "cross_modal_joint_analysis",
        "query": "Detect water extent",
        "input_metadata": {
            "crs": "EPSG:4326",
            "bounds": [0.0, 0.0, 1.0, 1.0],
            "affine_transform": [1.0, 0.0, 0.0, 0.0, 1.0, 0.0],
            "modalities": ["Optical", "SAR"],
        },
        "registry_execution": [tool1, tool2],
        "confidence_score": 0.92,
        "output": "Water extent mapped.",
        "tools_executed": [tool1, tool2, tool3],
    }
    log = AuditableTraceLogSchema(**data)
    assert log.tools_executed is not None
    assert len(log.tools_executed) == 3
    assert log.tools_executed[0].get("tool") == "CD-VQA-Pro"
    assert log.tools_executed[1].get("tool") == "Opt-SAR-Fusion-Net"
    assert log.tools_executed[2].get("tool") == "geodesic_measurement_tool"

