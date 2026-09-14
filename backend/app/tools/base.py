"""Base tool abstraction and agent scratchpad for SatQuery AI.

Provides the foundational interface for specialist remote sensing tools and the shared
scratchpad state passed between semantic routing, tool execution, and vision synthesis.
"""

from __future__ import annotations

import abc
import asyncio
from typing import Any, Dict, List, Optional, TypedDict


class AgentScratchpad(TypedDict, total=False):
    """Shared state tracking during autonomous agentic execution."""

    query: str
    filepaths: List[str]
    parsed_meta: List[Dict[str, Any]]
    intent: Dict[str, Any]
    intermediate_steps: List[Dict[str, Any]]
    grounding_geojson: Optional[Dict[str, Any]]
    instances: Optional[List[Dict[str, Any]]]
    change_metrics: Optional[Dict[str, Any]]
    change_mask_path: Optional[str]
    cross_modal_metrics: Optional[Dict[str, Any]]
    fusion_map: Optional[str]
    geospatial_metrics: Optional[Dict[str, Any]]
    final_answer: Optional[str]
    confidence: float
    output_desc: Optional[str]


class BaseTool(abc.ABC):
    """Abstract base class for all remote-sensing specialist tools."""

    name: str = "base_tool"
    description: str = "Base remote sensing specialist tool."
    parameters: Dict[str, Any] = {}

    @abc.abstractmethod
    def execute(self, scratchpad: Dict[str, Any], **kwargs: Any) -> Dict[str, Any]:
        """Synchronously execute the tool and return updated scratchpad diff or results."""
        raise NotImplementedError

    async def aexecute(self, scratchpad: Dict[str, Any], **kwargs: Any) -> Dict[str, Any]:
        """Asynchronously execute the tool (defaults to executing synchronously)."""
        loop = asyncio.get_running_loop()
        return await loop.run_in_executor(None, lambda: self.execute(scratchpad, **kwargs))

    def get_schema(self) -> Dict[str, Any]:
        """Return JSON-schema descriptor for LLM tool calling."""
        return {
            "type": "function",
            "function": {
                "name": self.name,
                "description": self.description,
                "parameters": self.parameters,
            },
        }
