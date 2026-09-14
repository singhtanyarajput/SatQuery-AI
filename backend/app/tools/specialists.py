"""Remote Sensing domain specialist tools for SatQuery AI.

Implements specialized tools adhering to the BaseTool interface:
1. WaterGroundingTool: NDWI/dark-pixel segmentation and contour vectorization.
2. TemporalChangeTool: CD-VQA-Pro temporal difference attention & directional delta.
3. OpticalSARFusionTool: SAR radar backscatter (sigma-0 < -18 dB) + optical texture fusion.
4. GeodesicMeasurementTool: Surface area computation (m², hectares, km²) using pyproj.
"""

from __future__ import annotations

import logging
import time
from pathlib import Path
from typing import Any, Dict, List, Optional

import numpy as np

from app.tools.base import BaseTool

logger = logging.getLogger("SatQueryTools")


class WaterGroundingTool(BaseTool):
    """Specialist tool for text-guided water and hydrological feature localization."""

    name: str = "water_grounding_tool"
    description: str = (
        "Ground and delineate water bodies, reservoirs, rivers, lakes, and flood inundations "
        "using spectral NDWI, dark-pixel segmentation, and MobileSAM contour vectorization."
    )
    parameters: Dict[str, Any] = {
        "type": "object",
        "properties": {
            "threshold": {
                "type": "number",
                "description": "Detection confidence threshold (default 0.35)",
            },
            "use_mobilesam": {
                "type": "boolean",
                "description": "Whether to utilize MobileSAM for boundary refinement",
            },
        },
    }

    def execute(self, scratchpad: Dict[str, Any], **kwargs: Any) -> Dict[str, Any]:
        start_time = time.time()
        filepaths = scratchpad.get("filepaths") or []
        if not filepaths:
            return {"status": "skipped", "reason": "No image filepaths provided"}

        query = kwargs.get("query") or scratchpad.get("query", "water body")
        image_path = Path(filepaths[0])
        use_mobilesam = kwargs.get("use_mobilesam", scratchpad.get("use_mobilesam", True))

        from app.services.models.grounding import TextGuidedGrounder
        from app.services.geospatial.vector import (
            raster_mask_to_geojson,
            standardize_feature_collection,
        )

        grounded = TextGuidedGrounder().ground(
            image_path=image_path,
            prompt=query,
            use_mobilesam=use_mobilesam,
        )

        geojson = (
            grounded.geojson
            if grounded.geojson
            else raster_mask_to_geojson(
                image_path,
                grounded.mask,
                task_type="grounding",
                label="Water Body",
                category="water",
                confidence=grounded.confidence,
            )
        )
        geojson = standardize_feature_collection(geojson, task_type="grounding")

        scratchpad["grounding_geojson"] = geojson
        scratchpad["instances"] = grounded.instances
        scratchpad["confidence"] = grounded.confidence

        duration = time.time() - start_time
        step_log = {
            "tool": self.name,
            "status": "success",
            "duration_s": round(duration, 3),
            "instances_count": len(grounded.instances),
            "confidence": grounded.confidence,
        }
        scratchpad.setdefault("intermediate_steps", []).append(step_log)
        return {
            "status": "success",
            "instances_found": len(grounded.instances),
            "geojson": geojson,
            "confidence": grounded.confidence,
        }


class TemporalChangeTool(BaseTool):
    """Specialist tool for bi-temporal satellite change analysis."""

    name: str = "temporal_change_tool"
    description: str = (
        "Analyzes bi-temporal satellite rasters (T1 baseline and T2 post-event) "
        "using CD-VQA-Pro temporal difference attention and directional delta calculation."
    )
    parameters: Dict[str, Any] = {
        "type": "object",
        "properties": {
            "query": {
                "type": "string",
                "description": "Specific change question or target feature",
            },
        },
    }

    def execute(self, scratchpad: Dict[str, Any], **kwargs: Any) -> Dict[str, Any]:
        start_time = time.time()
        filepaths = scratchpad.get("filepaths") or []
        if len(filepaths) < 2:
            raise ValueError(
                "Bi-temporal change detection requires two spatially aligned images (Before and After)."
            )

        t1_path = Path(filepaths[0])
        t2_path = Path(filepaths[1])
        query = kwargs.get("query") or scratchpad.get("query", "What has changed between these dates?")

        from app.services.models.change_vqa import TemporalChangeVQA
        from app.services.geospatial.vector import (
            raster_mask_to_geojson,
            standardize_feature_collection,
        )

        changed = TemporalChangeVQA().analyze(t1_path=t1_path, t2_path=t2_path, query=query)
        scratchpad["change_metrics"] = changed.params
        scratchpad["change_mask_path"] = changed.overlay_uri

        binary = (changed.change_mask > 0.5).astype("uint8")
        geojson = raster_mask_to_geojson(
            t1_path,
            binary,
            task_type="change_detection",
            label="Detected Surface Change",
            category="change_detection",
            confidence=changed.confidence,
        )
        geojson = standardize_feature_collection(geojson, task_type="change_detection")
        scratchpad["grounding_geojson"] = geojson

        duration = time.time() - start_time
        step_log = {
            "tool": self.name,
            "status": "success",
            "duration_s": round(duration, 3),
            "change_fraction": changed.params.get("change_fraction"),
            "directional_verdict": changed.params.get("directional_verdict"),
            "confidence": changed.confidence,
        }
        scratchpad.setdefault("intermediate_steps", []).append(step_log)
        return {
            "status": "success",
            "change_fraction": changed.params.get("change_fraction"),
            "directional_verdict": changed.params.get("directional_verdict"),
            "answer": changed.answer,
            "overlay_uri": changed.overlay_uri,
        }


class OpticalSARFusionTool(BaseTool):
    """Specialist tool for joint Optical and SAR cross-modal analysis."""

    name: str = "optical_sar_fusion_tool"
    description: str = (
        "Fuses Optical RGB and SAR C-band radar backscatter (sigma-0 < -18 dB) "
        "to delineate flood waters, impervious urban fabric, and terrain structures."
    )
    parameters: Dict[str, Any] = {
        "type": "object",
        "properties": {
            "query": {
                "type": "string",
                "description": "Specific cross-modal analysis question",
            },
        },
    }

    def execute(self, scratchpad: Dict[str, Any], **kwargs: Any) -> Dict[str, Any]:
        start_time = time.time()
        filepaths = scratchpad.get("filepaths") or []
        if len(filepaths) < 2:
            raise ValueError(
                "Cross-modal Optical+SAR joint analysis requires both Optical and SAR imagery."
            )

        optical_path = Path(filepaths[0])
        sar_path = Path(filepaths[1])
        query = kwargs.get("query") or scratchpad.get("query", "Optical SAR joint analysis")

        from app.services.models.cross_modal import CrossModalAnalysisTool as CoreCrossModalTool
        from app.services.geospatial.vector import standardize_feature_collection

        cm_result = CoreCrossModalTool().analyze(
            optical_path=optical_path,
            sar_path=sar_path,
            query=query,
        )
        geojson = standardize_feature_collection(cm_result.geojson, task_type="cross_modal")

        scratchpad["cross_modal_metrics"] = cm_result.params
        scratchpad["grounding_geojson"] = geojson
        scratchpad["fusion_map"] = getattr(cm_result, "overlay_uri", None)


        duration = time.time() - start_time
        step_log = {
            "tool": self.name,
            "status": "success",
            "duration_s": round(duration, 3),
            "builtup_features_count": cm_result.params.get("builtup_features_count", 0),
            "water_features_count": cm_result.params.get("water_features_count", 0),
            "confidence": cm_result.confidence,
        }
        scratchpad.setdefault("intermediate_steps", []).append(step_log)
        return {
            "status": "success",
            "builtup_features_count": cm_result.params.get("builtup_features_count", 0),
            "water_features_count": cm_result.params.get("water_features_count", 0),
            "answer": cm_result.answer,
            "geojson": geojson,
        }


class GeodesicMeasurementTool(BaseTool):
    """Specialist tool for calculating real-world geodesic physical measurements."""

    name: str = "geodesic_measurement_tool"
    description: str = (
        "Computes surface area in square meters (m²), hectares (ha), and square kilometers (km²) "
        "from GeoJSON geometries or raster masks using WGS84 geodesic projections via pyproj."
    )
    parameters: Dict[str, Any] = {
        "type": "object",
        "properties": {
            "unit": {
                "type": "string",
                "enum": ["all", "m2", "hectares", "km2"],
                "description": "Primary measurement unit to highlight",
            },
        },
    }

    def execute(self, scratchpad: Dict[str, Any], **kwargs: Any) -> Dict[str, Any]:
        start_time = time.time()
        geojson = scratchpad.get("grounding_geojson")
        total_m2 = 0.0

        if geojson and isinstance(geojson, dict):
            features = geojson.get("features") or []
            from app.services.geospatial.vector import _geodesic_area_m2

            for feat in features:
                props = feat.get("properties") or {}
                if "area_m2" in props and props["area_m2"] is not None:
                    total_m2 += float(props["area_m2"])
                elif "geometry" in feat:
                    total_m2 += _geodesic_area_m2(feat.get("geometry"))
        elif scratchpad.get("instances"):
            instances = scratchpad.get("instances") or []
            for inst in instances:
                if "area_m2" in inst:
                    total_m2 += float(inst["area_m2"])

        # Fallback if no specific polygons were extracted but metadata exists
        if total_m2 == 0.0 and scratchpad.get("parsed_meta"):
            meta = scratchpad["parsed_meta"][0]
            bounds = meta.get("bounds")
            if bounds and len(bounds) >= 4:
                try:
                    from pyproj import Geod
                    from shapely.geometry import box

                    b = box(*bounds[:4])
                    geod = Geod(ellps="WGS84")
                    total_m2, _ = geod.geometry_area_perimeter(b)
                    total_m2 = abs(float(total_m2))
                except Exception as exc:
                    logger.debug("bounding_box_area_calculation_failed: %s", exc)

        hectares = total_m2 / 10000.0
        sq_km = total_m2 / 1_000_000.0

        metrics = {
            "surface_area_m2": round(total_m2, 2),
            "hectares": round(hectares, 4),
            "sq_km": round(sq_km, 6),
        }
        scratchpad["geospatial_metrics"] = metrics

        duration = time.time() - start_time
        step_log = {
            "tool": self.name,
            "status": "success",
            "duration_s": round(duration, 3),
            "metrics": metrics,
        }
        scratchpad.setdefault("intermediate_steps", []).append(step_log)
        return {
            "status": "success",
            "metrics": metrics,
        }
