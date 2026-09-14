"""Central Tool Registry for SatQuery AI remote sensing specialists.

Maintains registered specialist tools, supports schema generation for LLM tool calling,
and provides unified synchronous and asynchronous dispatch.
"""

from __future__ import annotations

import logging
from typing import Any, Dict, List, Optional

from app.tools.base import BaseTool
from app.tools.specialists import (
    GeodesicMeasurementTool,
    OpticalSARFusionTool,
    TemporalChangeTool,
    WaterGroundingTool,
)

logger = logging.getLogger("SatQueryToolRegistry")


class ToolRegistry:
    """Singleton registry holding specialist domain tools."""

    _instance: Optional[ToolRegistry] = None

    def __new__(cls) -> ToolRegistry:
        if cls._instance is None:
            cls._instance = super().__new__(cls)
            cls._instance._tools: Dict[str, BaseTool] = {}
            cls._instance._init_default_tools()
        return cls._instance

    def _init_default_tools(self) -> None:
        """Register default remote sensing tools."""
        self.register(WaterGroundingTool())
        self.register(TemporalChangeTool())
        self.register(OpticalSARFusionTool())
        self.register(GeodesicMeasurementTool())

    def register(self, tool: BaseTool) -> None:
        """Register a new specialist tool."""
        self._tools[tool.name] = tool
        logger.debug("Registered tool: %s", tool.name)

    def get(self, name: str) -> Optional[BaseTool]:
        """Retrieve a registered tool by name."""
        return self._tools.get(name)

    def list_tools(self) -> List[str]:
        """List names of all registered tools."""
        return list(self._tools.keys())

    def get_schemas(self) -> List[Dict[str, Any]]:
        """Return JSON schemas of all registered tools for LLM tool calling."""
        return [tool.get_schema() for tool in self._tools.values()]

    def execute_tool(self, name: str, scratchpad: Dict[str, Any], **kwargs: Any) -> Dict[str, Any]:
        """Execute a tool by name and update the shared scratchpad."""
        tool = self.get(name)
        if tool is None:
            raise KeyError(f"Tool '{name}' is not registered in ToolRegistry. Available: {self.list_tools()}")
        return tool.execute(scratchpad, **kwargs)

    async def aexecute_tool(self, name: str, scratchpad: Dict[str, Any], **kwargs: Any) -> Dict[str, Any]:
        """Asynchronously execute a tool by name and update the shared scratchpad."""
        tool = self.get(name)
        if tool is None:
            raise KeyError(f"Tool '{name}' is not registered in ToolRegistry. Available: {self.list_tools()}")
        return await tool.aexecute(scratchpad, **kwargs)


# Global singleton helper
registry = ToolRegistry()
