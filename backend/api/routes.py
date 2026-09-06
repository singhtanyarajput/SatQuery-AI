"""POST /api/v1/query — multipart images + NL query through LangGraph."""

from __future__ import annotations

import uuid
from pathlib import Path
from typing import Any

import numpy as np
from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile
from fastapi.responses import Response
from sqlalchemy.orm import Session

from app.core.config import settings
from app.database.session import get_optional_db
from app.schemas.trace import AuditableTraceLogSchema
from app.schemas.validation import QueryResponseEnvelope, TaskType
from app.services.agent import SatQueryController
from app.utils.logger import get_logger
from app.utils.report_generator import build_audit_summary, generate_audit_report
from app.utils.trace_store import remember_trace

try:
    from rasterio.transform import from_bounds
    import rasterio
except ImportError:  # pragma: no cover
    rasterio = None
    from_bounds = None

logger = get_logger(__name__)
router = APIRouter()

GEOTIFF_SUFFIXES = {".tif", ".tiff", ".gtiff"}
RASTER_SUFFIXES = GEOTIFF_SUFFIXES | {".png", ".jpg", ".jpeg", ".webp", ".bmp"}
DEFAULT_SCENE_BOUNDS = (77.0, 28.0, 77.2, 28.2)  # demo CRS for non-georeferenced rasters


async def _persist_raster(upload: UploadFile, dest_dir: Path) -> Path:
    suffix = Path(upload.filename or "scene.tif").suffix.lower() or ".png"
    if suffix not in RASTER_SUFFIXES:
        raise HTTPException(status_code=400, detail=f"Unsupported image suffix: {suffix}")
    dest_dir.mkdir(parents=True, exist_ok=True)
    raw = bytearray()
    while True:
        chunk = await upload.read(1024 * 1024)
        if not chunk:
            break
        raw.extend(chunk)
        if len(raw) > settings.MAX_UPLOAD_BYTES:
            raise HTTPException(status_code=413, detail="Upload exceeds MAX_UPLOAD_BYTES")
    if not raw:
        raise HTTPException(status_code=400, detail="Empty image upload")

    if suffix in GEOTIFF_SUFFIXES:
        target = dest_dir / f"{uuid.uuid4().hex}{suffix}"
        target.write_bytes(bytes(raw))
        return target
    return _png_to_geotiff(bytes(raw), dest_dir, suffix)


def _png_to_geotiff(payload: bytes, dest_dir: Path, suffix: str) -> Path:
    if rasterio is None or from_bounds is None:
        raise HTTPException(status_code=503, detail="rasterio is required to ingest imagery")
    try:
        import cv2
    except ImportError as extra:
        raise HTTPException(status_code=503, detail="OpenCV is required to ingest PNG/JPEG") from extra

    array = cv2.imdecode(np.frombuffer(payload, dtype=np.uint8), cv2.IMREAD_UNCHANGED)
    if array is None:
        raise HTTPException(status_code=400, detail=f"Could not decode raster{suffix}")
    if array.ndim == 2:
        array = np.stack([array, array, array], axis=0)
    elif array.ndim == 3:
        array = np.transpose(array[:, :, :3][:, :, ::-1], (2, 0, 1))
    else:
        raise HTTPException(status_code=400, detail="Unsupported image rank")
    array = array.astype(np.uint8)
    bands, height, width = array.shape
    west, south, east, north = DEFAULT_SCENE_BOUNDS
    transform = from_bounds(west, south, east, north, width, height)
    target = dest_dir / f"{uuid.uuid4().hex}.tif"
    with rasterio.open(
        target,
        "w",
        driver="GTiff",
        height=height,
        width=width,
        count=bands,
        dtype="uint8",
        crs="EPSG:4326",
        transform=transform,
    ) as dst:
        dst.write(array)
    return target


def _collect_uploads(
    files: list[UploadFile],
    extras: list[UploadFile | None],
) -> list[UploadFile]:
    valid_files: list[UploadFile] = []
    seen: set[int] = set()
    for item in list(files or []):
        if item is None:
            continue
        marker = id(item)
        if marker in seen:
            continue
        if not getattr(item, "filename", None) and not getattr(item, "size", None):
            continue
        seen.add(marker)
        valid_files.append(item)
    if valid_files:
        return valid_files

    collected: list[UploadFile] = []
    for item in extras:
        if item is None:
            continue
        marker = id(item)
        if marker in seen:
            continue
        if not getattr(item, "filename", None) and not getattr(item, "size", None):
            continue
        seen.add(marker)
        collected.append(item)
    return collected


def _geometry_payload(
    controller: SatQueryController,
    trace: AuditableTraceLogSchema,
) -> tuple[dict[str, Any] | None, list[float] | None, dict[str, Any] | None]:
    from app.services.geospatial.vector import standardize_feature_collection

    bounds = list(trace.input_metadata.bounds)
    bbox = [float(v) for v in bounds] if len(bounds) >= 4 else getattr(controller, "last_bbox", None)
    geojson = controller.last_geojson
    if geojson is None and bbox is not None and len(bbox) >= 4:
        minx, miny, maxx, maxy = bbox[:4]
        geojson = {
            "type": "FeatureCollection",
            "crs": {"type": "name", "properties": {"name": trace.input_metadata.crs}},
            "features": [
                {
                    "type": "Feature",
                    "properties": {
                        "id": 1,
                        "label": "Scene AOI",
                        "confidence": float(trace.confidence_score or 0.85),
                        "class": "infrastructure",
                    },
                    "geometry": {
                        "type": "Polygon",
                        "coordinates": [[
                            [minx, miny],
                            [maxx, miny],
                            [maxx, maxy],
                            [minx, maxy],
                            [minx, miny],
                        ]],
                    },
                }
            ],
        }

    if geojson:
        geojson = standardize_feature_collection(geojson, task_type=trace.task)

    change_mask = None
    overlay_uri = controller.last_overlay_uri
    if overlay_uri or trace.task == "bi_temporal_change_analysis" or geojson:
        change_mask = {
            "uri": overlay_uri,
            "bbox": bbox,
            "coordinates": _coordinates_from_geojson(geojson),
        }
    return geojson, bbox, change_mask


def _coordinates_from_geojson(geojson: dict[str, Any] | None) -> list[Any]:
    if not geojson:
        return []
    if geojson.get("type") == "Feature":
        geom = geojson.get("geometry") or {}
        return list(geom.get("coordinates") or [])
    coords: list[Any] = []
    for feature in geojson.get("features") or []:
        geom = feature.get("geometry") or {}
        if "coordinates" in geom:
            coords.append(geom["coordinates"])
    return coords


@router.post("/query", response_model=QueryResponseEnvelope)
async def query_pipeline(
    query: str = Form(..., min_length=3),
    files: list[UploadFile] = File(default=[]),
    images: list[UploadFile] = File(default=[]),
    file: UploadFile | None = File(default=None),
    image: UploadFile | None = File(default=None),
    optical: UploadFile | None = File(default=None),
    optical_t2: UploadFile | None = File(default=None),
    sar: UploadFile | None = File(default=None),
    image_before: UploadFile | None = File(default=None),
    image_after: UploadFile | None = File(default=None),
    image_t1: UploadFile | None = File(default=None),
    image_t2: UploadFile | None = File(default=None),
    force_task: str | None = Form(default=None),
    use_mobilesam: bool = Form(default=True),
    db: Session | None = Depends(get_optional_db),
) -> QueryResponseEnvelope:
    """Accept multipart imagery, run the Phase 5 LangGraph orchestrator, return map-ready JSON."""
    uploads = _collect_uploads(
        files + images,
        [file, image, optical, optical_t2, sar, image_before, image_after, image_t1, image_t2],
    )
    if not uploads:
        raise HTTPException(status_code=400, detail="At least one image file is required")

    logger.info("Received %d uploaded image(s) for query: '%s'", len(uploads), query[:100])

    forced: TaskType | None = None
    if force_task:
        try:
            forced = TaskType(force_task)
        except ValueError as extra:
            raise HTTPException(status_code=422, detail="Unknown force_task") from extra

    trace_dir = settings.UPLOAD_DIR / uuid.uuid4().hex
    filepaths: list[str] = []
    for upload in uploads:
        saved = await _persist_raster(upload, trace_dir)
        filepaths.append(str(saved))

    logger.info("Persisted %d raster image(s) for execution: %s", len(filepaths), filepaths)

    logger.info(
        "query_received",
        extra={
            "query": query[:200],
            "image_count": len(uploads),
            "files": filepaths,
            "models_dir": str(settings.LOCAL_MODELS_DIR),
        },
    )

    controller = SatQueryController(db=db)
    try:
        trace = controller.execute_workflow(
            query=query,
            filepaths=filepaths,
            force_task=forced.value if forced else None,
            use_mobilesam=use_mobilesam,
        )
    except ValueError as extra:
        raise HTTPException(status_code=400, detail=str(extra)) from extra
    except FileNotFoundError as extra:
        raise HTTPException(status_code=503, detail=str(extra)) from extra
    except Exception as extra:  # noqa: BLE001
        logger.exception("query_pipeline_failed")
        raise HTTPException(status_code=500, detail="Workflow failed") from extra

    geojson, bbox, change_mask = _geometry_payload(controller, trace)
    trace_dict = trace.model_dump()
    audit_summary = build_audit_summary(
        trace,
        geojson=geojson,
        change_overlay_uri=controller.last_overlay_uri,
    )
    remember_trace(
        trace.trace_id,
        {
            **trace_dict,
            "geojson": geojson,
            "change_overlay_uri": controller.last_overlay_uri,
            "audit_summary": audit_summary,
        },
    )
    report_dir = settings.ARTIFACT_DIR / "reports"
    report_dir.mkdir(parents=True, exist_ok=True)
    json_body, _, json_name = generate_audit_report(
        langgraph_state={"trace": trace_dict, "geojson": geojson},
        geojson=geojson,
        change_overlay_uri=controller.last_overlay_uri,
        fmt="json",
    )
    (report_dir / json_name).write_bytes(json_body)

    std_task = trace.task_type or getattr(trace, "task", "single_vqa")
    models_executed = trace.models_executed or [step.model for step in trace.registry_execution if step.model]
    input_meta = trace.input_metadata.model_dump()
    conf = float(trace.confidence if trace.confidence is not None else trace.confidence_score)

    return QueryResponseEnvelope(
        status="ok",
        answer=trace.output,
        task_type=std_task,
        models_executed=models_executed,
        input_metadata=input_meta,
        confidence=conf,
        geojson=geojson,
        bbox=bbox,
        change_mask=change_mask,
        change_overlay_uri=controller.last_overlay_uri,
        audit_summary=audit_summary,
        trace=trace_dict,
        report={
            "json": f"/api/v1/reports/{trace.trace_id}?format=json",
            "pdf": f"/api/v1/reports/{trace.trace_id}?format=pdf",
        },
    )


@router.get("/reports/{trace_id}")
async def download_audit_report(
    trace_id: str,
    format: str = "json",
    db: Session | None = Depends(get_optional_db),
) -> Response:
    """Download the JSON or PDF audit report for a completed workflow."""
    try:
        body, media_type, filename = generate_audit_report(
            db=db,
            trace_id=trace_id,
            fmt=format,
        )
    except KeyError as extra:
        raise HTTPException(status_code=404, detail=str(extra)) from extra
    return Response(
        content=body,
        media_type=media_type,
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )
