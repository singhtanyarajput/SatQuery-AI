"""Semantic Intent Router for SatQuery AI.

Autonomous tool-calling and intent classification engine powered by fast LLMs via Ollama (/api/chat).
Parses analyst queries, input raster modalities, and temporal relationships into structured execution plans:
{
    "task": "single_image_grounding" | "single_image_vqa" | "bi_temporal_change_analysis" | "cross_modal_joint_analysis" | "domain_knowledge_qa",
    "target_features": ["water_body", "reservoir", ...],
    "tool_chain": ["water_grounding_tool", "geodesic_measurement_tool"],
    "confidence": 0.95
}

Maintains deterministic fallback to InputInspectorNode when offline or air-gapped.
"""

from __future__ import annotations

import json
import logging
import re
from dataclasses import dataclass, field
from typing import Any, Dict, List, Optional

from app.agents.router import (
    INTERNAL_BITEMPORAL_CHANGE,
    INTERNAL_CROSS_MODAL,
    INTERNAL_DOMAIN_KNOWLEDGE_QA,
    INTERNAL_SINGLE_GROUNDING,
    INTERNAL_SINGLE_VQA,
    STANDARDIZED_TASK_MAP,
    TASK_BITEMPORAL_CHANGE,
    TASK_CROSS_MODAL,
    TASK_DOMAIN_KNOWLEDGE_QA,
    TASK_SINGLE_GROUNDING,
    TASK_SINGLE_VQA,
    InputInspectorNode,
)
from app.core.config import settings

logger = logging.getLogger("SemanticIntentRouter")


@dataclass
class SemanticIntent:
    """Structured decision output from the Semantic Intent Router."""

    task: str
    task_type: str
    target_features: List[str] = field(default_factory=list)
    tool_chain: List[str] = field(default_factory=list)
    confidence: float = 0.90
    reasoning: Optional[str] = None

    def to_dict(self) -> Dict[str, Any]:
        return {
            "task": self.task,
            "task_type": self.task_type,
            "target_features": self.target_features,
            "tool_chain": self.tool_chain,
            "confidence": round(self.confidence, 4),
            "reasoning": self.reasoning,
        }


ROUTER_SYSTEM_PROMPT = """You are the Semantic Intent & Specialist Tool Router for SatQuery AI, an Earth Observation intelligence system.
Analyze the user's query and input image metadata, then output a single JSON object with the following schema:

{
  "task": "single_image_grounding" | "single_image_vqa" | "bi_temporal_change_analysis" | "cross_modal_joint_analysis" | "domain_knowledge_qa",
  "target_features": ["list", "of", "features"],
  "tool_chain": ["list", "of", "tool_names"],
  "confidence": 0.95,
  "reasoning": "brief explanation"
}

Available Specialist Tools:
- "water_grounding_tool": Delineate and segment water bodies, lakes, rivers, reservoirs, and inundated zones.
- "temporal_change_tool": Bi-temporal change detection (T1 baseline vs T2 post-event) and directional delta.
- "optical_sar_fusion_tool": Cross-modal Optical RGB and SAR C-band radar backscatter fusion.
- "geodesic_measurement_tool": Calculates physical surface area (m², hectares, km²) from detected features.

Tool Chain Rules:
1. Water / Flood grounding queries -> ["water_grounding_tool", "geodesic_measurement_tool"]
2. Bi-temporal change queries -> ["temporal_change_tool", "geodesic_measurement_tool"]
3. Optical+SAR cross-modal queries -> ["optical_sar_fusion_tool", "geodesic_measurement_tool"]
4. VQA / Scene description queries -> []
5. Zero-image domain queries -> []

Output ONLY the raw JSON object. Do not include markdown formatting or commentary."""


class SemanticIntentRouter:
    """Autonomous tool-calling and semantic routing engine."""

    _ollama_available: Optional[bool] = None

    def __init__(self, ollama_url: Optional[str] = None, model: Optional[str] = None) -> None:
        self.ollama_url = ollama_url or settings.resolved_ollama_url
        self.model = model or settings.VLM_MODEL_NAME

    def parse_intent(
        self,
        query: str,
        filepaths: Optional[List[str]] = None,
        parsed_meta: Optional[List[Dict[str, Any]]] = None,
        force_task: Optional[str] = None,
    ) -> SemanticIntent:
        """Parse analyst intent into a structured SemanticIntent plan.

        Enforces strict input-intent validation (raising ValueError for mismatched inputs)
        and attempts fast LLM-based structured JSON parsing with deterministic fallback.
        """
        files = list(filepaths) if filepaths is not None else []
        meta = list(parsed_meta or [])

        # Step 1: Enforce deterministic input constraints (rejection of mismatches)
        task_fallback = InputInspectorNode.inspect(
            query=query,
            filepaths=filepaths,
            parsed_meta=parsed_meta,
            force_task=force_task,
        )

        if force_task:
            return self._build_plan_from_task(
                task=task_fallback,
                query=query,
                confidence=1.0,
                reasoning="Forced task override specified by caller.",
            )

        # Step 2: Attempt LLM-based structured intent extraction via Ollama /api/chat
        if self._ollama_available is not False:
            try:
                llm_plan = self._call_ollama_chat_router(query=query, num_files=len(files), meta=meta)
                if llm_plan and self._validate_llm_plan(llm_plan, len(files)):
                    SemanticIntentRouter._ollama_available = True
                    task_cand = llm_plan.get("task", task_fallback)
                    std_task = STANDARDIZED_TASK_MAP.get(task_cand, STANDARDIZED_TASK_MAP.get(task_fallback, task_fallback))
                    from app.agents.router import INTERNAL_TASK_MAP
                    internal_task = INTERNAL_TASK_MAP.get(std_task, task_fallback)

                    return SemanticIntent(
                        task=internal_task,
                        task_type=std_task,
                        target_features=list(llm_plan.get("target_features") or self._extract_features(query)),
                        tool_chain=list(llm_plan.get("tool_chain") or self._default_tool_chain(internal_task)),
                        confidence=float(llm_plan.get("confidence", 0.92)),
                        reasoning=llm_plan.get("reasoning", "Autonomous LLM router execution."),
                    )
            except Exception as exc:
                SemanticIntentRouter._ollama_available = False
                logger.debug("Ollama chat router invocation skipped/failed: %s; falling back to heuristic routing", exc)


        # Step 3: Fallback heuristic plan
        return self._build_plan_from_task(
            task=task_fallback,
            query=query,
            confidence=0.92,
            reasoning="Deterministic heuristic router fallback.",
        )

    def _call_ollama_chat_router(
        self,
        query: str,
        num_files: int,
        meta: List[Dict[str, Any]],
    ) -> Optional[Dict[str, Any]]:
        """Invokes Ollama /api/chat with structured JSON prompt."""
        from app.services.models.base import _http_post_json

        endpoint = f"{self.ollama_url.rstrip('/')}/api/chat"
        meta_summary = [
            {"sensor": m.get("sensor"), "modalities": m.get("modalities")}
            for m in meta
        ]
        user_message = (
            f"Query: \"{query}\"\n"
            f"Number of uploaded images: {num_files}\n"
            f"Raster metadata: {json.dumps(meta_summary)}\n"
            f"Classify the task, target features, and optimal tool chain."
        )

        body = {
            "model": self.model,
            "messages": [
                {"role": "system", "content": ROUTER_SYSTEM_PROMPT},
                {"role": "user", "content": user_message},
            ],
            "stream": False,
            "format": "json",
            "options": {"temperature": 0.0, "num_predict": 150},
        }

        resp = _http_post_json(endpoint, body, connect_timeout=0.8, read_timeout=5.0)
        content = resp.get("message", {}).get("content", "").strip()
        if not content:
            return None

        # Parse JSON content from LLM response
        try:
            return json.loads(content)
        except json.JSONDecodeError:
            match = re.search(r"\{.*\}", content, re.DOTALL)
            if match:
                return json.loads(match.group(0))
        return None

    def _validate_llm_plan(self, plan: Dict[str, Any], num_files: int) -> bool:
        """Validate that LLM plan does not violate fundamental file-count constraints."""
        task = plan.get("task", "")
        std = STANDARDIZED_TASK_MAP.get(task, task)

        if num_files == 0 and std != TASK_DOMAIN_KNOWLEDGE_QA:
            return False
        if num_files == 1 and std in [TASK_BITEMPORAL_CHANGE, TASK_CROSS_MODAL]:
            return False
        return True

    def _build_plan_from_task(
        self,
        task: str,
        query: str,
        confidence: float = 0.92,
        reasoning: Optional[str] = None,
    ) -> SemanticIntent:
        """Constructs a deterministic plan based on the verified task."""
        std_task = STANDARDIZED_TASK_MAP.get(task, task)
        features = self._extract_features(query)
        tool_chain = self._default_tool_chain(task, features)

        return SemanticIntent(
            task=task,
            task_type=std_task,
            target_features=features,
            tool_chain=tool_chain,
            confidence=confidence,
            reasoning=reasoning,
        )

    def _extract_features(self, query: str) -> List[str]:
        """Extract candidate target features from the query."""
        q = query.lower()
        candidates = [
            ("water body", ["water", "lake", "river", "reservoir", "pond", "canal", "wetland"]),
            ("storage tank", ["tank", "storage", "silo", "fuel depot", "petroleum"]),
            ("urban built-up", ["built-up", "building", "urban", "construction", "settlement"]),
            ("runway / airport", ["runway", "airport", "airfield", "aircraft", "airplane"]),
            ("vegetation / canopy", ["vegetation", "forest", "crop", "agriculture", "trees"]),
            ("flood inundation", ["flood", "flooded", "inundat", "overflow"]),
            ("transport infrastructure", ["bridge", "road", "highway", "rail"]),
        ]
        found = []
        for feature_label, terms in candidates:
            if any(t in q for t in terms):
                found.append(feature_label)
        return found if found else ["general_terrain"]

    def _default_tool_chain(self, task: str, features: Optional[List[str]] = None) -> List[str]:
        """Assign default specialist tool chain for a task."""
        std_task = STANDARDIZED_TASK_MAP.get(task, task)
        feats = features or []

        if std_task == TASK_BITEMPORAL_CHANGE:
            return ["temporal_change_tool", "geodesic_measurement_tool"]
        if std_task == TASK_CROSS_MODAL:
            return ["optical_sar_fusion_tool", "geodesic_measurement_tool"]
        if std_task == TASK_SINGLE_GROUNDING:
            return ["water_grounding_tool", "geodesic_measurement_tool"]
        return []

    def __call__(self, state: Dict[str, Any]) -> Dict[str, Any]:
        """LangGraph callable node interface."""
        query = state.get("query", "")
        filepaths = state.get("filepaths")
        parsed_meta = state.get("parsed_meta")
        force_task = state.get("force_task")

        intent = self.parse_intent(
            query=query,
            filepaths=filepaths,
            parsed_meta=parsed_meta,
            force_task=force_task,
        )
        return {
            **state,
            "task": intent.task,
            "task_type": intent.task_type,
            "intent": intent.to_dict(),
            "target_features": intent.target_features,
            "tool_chain": intent.tool_chain,
        }
