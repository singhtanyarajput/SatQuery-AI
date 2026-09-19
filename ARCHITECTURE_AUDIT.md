# SatQuery-AI: Comprehensive Architectural Audit & Onboarding Guide

**Audited Repository:** `SatQuery-AI`  
**Target Audience:** Teammate Onboarding & Sprint Planning  
**Execution Environment:** Air-gapped / Local Offline Deployment (FastAPI + PostGIS + Ollama + React)

---

## 1. System Architecture Overview

SatQuery-AI is an air-gapped geospatial intelligence system designed for remote sensing visual question answering (RS-VQA), multi-target grounding, bi-temporal change detection, and cross-modal (Optical + SAR) feature analysis. The architecture is engineered to run in completely offline environments (e.g., defense or ISRO air-gapped on-premise clusters) without external API dependencies.

```
                  +----------------------------------------------+
                  |         Client Layer (Browser / UI)          |
                  |     React 18 + Vite + TailwindCSS + Mapbox   |
                  +----------------------------------------------+
                                         |
                                         | Multipart POST /api/v1/query
                                         v
                  +----------------------------------------------+
                  |            FastAPI Backend (Port 8000)       |
                  |  +----------------------------------------+  |
                  |  |       API Router & Staging Layer       |  |
                  |  +----------------------------------------+  |
                  |                      |                       |
                  |  +----------------------------------------+  |
                  |  |      SatQueryController (LangGraph)     |  |
                  |  |  +----------------------------------+  |  |
                  |  |  | Ingest -> Inspect -> Align ->     |  |  |
                  |  |  | Infer -> Generate -> Trace       |  |  |
                  |  |  +----------------------------------+  |  |
                  |  |                   |                    |  |
                  |  |  +----------------------------------+  |  |
                  |  |  | Semantic Router & Tool Registry  |  |  |
                  |  |  +----------------------------------+  |  |
                  |  +----------------------------------------+  |
                  +----------------------------------------------+
                       /                 |                  \
                      /                  |                   \
                     v                   v                    v
         +--------------------+  +------------------+  +-------------------+
         | PostGIS 16-3.4     |  | Ollama VLM Node  |  | Local Weights &   |
         | Spatial Database   |  | (LLaVA / GeoChat)|  | Specialist Vision |
         | Port: 5432         |  | Port: 11434      |  | (SAM / CD-VQA)    |
         +--------------------+  +------------------+  +-------------------+
```

### 1.1 The Dockerized Stack
The entire system is containerized via `docker-compose.yml` into four interconnected services running within an isolated bridge network (`satquery_network`):
1. **`db` (`postgis/postgis:16-3.4`)**:
   - Manages relational session tracking and spatial GIS vector storage.
   - Automatically initializes spatial extensions and schemas via `./db/init-postgis.sh` and `./backend/app/database/init_db.sql`.
   - Persists data to the named volume `satquery_db_data`.
2. **`ollama` (`ollama/ollama:latest`)**:
   - Host-contained inference server for local Vision-Language Models (e.g., LLaVA, GeoChat, Mistral).
   - Listens on `11434`. Model checkpoints reside in the persistent volume `satquery_ollama_data`.
   - Tested through a container healthcheck (`ollama list`).
3. **`backend` (FastAPI / PyTorch)**:
   - Built from `./backend/Dockerfile` with Python 3.11, Rasterio, GDAL, PyTorch, and LangGraph.
   - Fully air-gapped configuration: `HF_HUB_OFFLINE=1`, `TRANSFORMERS_OFFLINE=1`, and local model mounts (`./local_models:/local_models:ro`).
   - Exposes REST endpoints on port `8000`.
4. **`frontend` (Vite + React)**:
   - Built from `./frontend/Dockerfile`, served on port `3000`.
   - Renders interactive map viewports, dual-split raster comparisons, agentic reasoning traces, and audit report downloads.

---

## 2. File & Directory Map

Below is the definitive breakdown of file responsibilities across the repository, focusing specifically on `/backend/app`:

```
SatQuery-AI/
├── backend/
│   ├── app/
│   │   ├── agents/
│   │   │   ├── __init__.py           # Package exports for agent routing
│   │   │   ├── router.py             # LangGraph state machine definition (nodes, edges, workflow state)
│   │   │   └── semantic_router.py    # SemanticIntentRouter, Intent schema, prompt classification
│   │   ├── api/
│   │   │   ├── __init__.py           # API package initialization
│   │   │   ├── router.py             # Aggregated FastAPI APIRouter registering all sub-endpoints
│   │   │   └── endpoints/
│   │   │       ├── __init__.py
│   │   │       ├── analyze.py        # Legacy and specialized raster analysis routes
│   │   │       ├── health.py         # Air-gap readiness, GPU availability, and model check endpoint
│   │   │       └── query.py          # Primary entrypoint for POST /api/v1/query
│   │   ├── core/
│   │   │   ├── __init__.py
│   │   │   └── config.py             # Pydantic Settings: paths, database URLs, CORS, offline flags
│   │   ├── database/
│   │   │   ├── __init__.py
│   │   │   ├── init_db.sql           # DDL schema for query_traces and query_history tables
│   │   │   ├── models.py             # SQLAlchemy models (QueryTrace, QueryHistory)
│   │   │   └── session.py            # Engine initialization, sessionmaker, and dependency injection
│   │   ├── schemas/
│   │   │   ├── __init__.py
│   │   │   ├── trace.py              # AuditableTraceLogSchema, InputMetadataSchema, RegistryExecutionSchema
│   │   │   └── validation.py         # QueryResponseEnvelope, TaskType, Request DTOs
│   │   ├── services/
│   │   │   ├── __init__.py
│   │   │   ├── agent.py              # SatQueryController: orchestrates workflow, dispatching, & state
│   │   │   ├── geo_utils.py          # Fallback coordinate georeferencing & matrix affine transforms
│   │   │   ├── grounding_service.py  # High-level grounding service wrapper
│   │   │   ├── heuristic_vlm.py      # Deterministic domain synthesis fallback for air-gapped execution
│   │   │   ├── geospatial/
│   │   │   │   ├── alignment.py      # SIFT/RANSAC sub-pixel image co-registration
│   │   │   │   ├── parser.py         # Rasterio metadata extraction (CRS, bounds, transform, GSD)
│   │   │   │   ├── spectral.py       # Normalized indices (NDVI, NDWI, MNDWI) & SAR dB calibration
│   │   │   │   └── vector.py         # Mask-to-GeoJSON polygonization, simplification, & bounding boxes
│   │   │   └── models/
│   │   │       ├── base.py           # LocalVisionLanguageClient (Ollama/vLLM HTTP client)
│   │   │       ├── bigearthnet.py    # 19-class land-cover classification model wrapper
│   │   │       ├── change_vqa.py     # CD-VQA-Pro temporal difference attention model
│   │   │       ├── cross_modal.py    # Optical-SAR joint attention & backscatter fusion
│   │   │       ├── fusion.py         # Pixel-level and feature-level spectral fusion
│   │   │       ├── grounding.py      # TextGuidedGrounder (MobileSAM / SAM ViT-B integration)
│   │   │       └── rs_vlm.py         # RemoteSensingVLMClient with GSD-aware prompt engineering
│   │   ├── tools/
│   │   │   ├── __init__.py
│   │   │   ├── base.py               # BaseTool abstract class & AgentScratchpad state definition
│   │   │   ├── registry.py           # Thread-safe ToolRegistry singleton
│   │   │   └── specialists.py        # WaterGroundingTool, TemporalChangeTool, OpticalSARFusionTool, GeodesicMeasurementTool
│   │   └── utils/
│   │       ├── __init__.py
│   │       ├── logger.py             # Structured application logging
│   │       ├── report_generator.py   # PDF and JSON ISRO audit report generation
│   │       └── trace_store.py        # In-memory LRU cache for fast trace lookup
│   ├── Dockerfile                    # Backend multi-stage build container specification
│   ├── main.py                       # FastAPI application factory and lifespan configuration
│   └── requirements.txt              # Backend Python dependencies
├── frontend/                         # React 18, Vite, Mapbox GL UI workspace
├── db/                               # PostgreSQL / PostGIS init scripts
└── docker-compose.yml                # Multi-container air-gapped orchestration
```

---

## 3. Current Capabilities vs. ISRO Requirements

SatQuery-AI fulfills key ISRO Disaster Management Support (DMS) and Earth Observation (EO) operational criteria through specialized offline algorithms:

| Capability Area | Current Software Implementation | Operational Verification |
| :--- | :--- | :--- |
| **Semantic Intent Routing** | `SemanticIntentRouter` parses natural language queries, classifies domain task (`single_grounding`, `single_vqa`, `bitemporal_change`, `cross_modal`, `domain_knowledge_qa`), extracts target objects, and dynamically formulates a deterministic tool execution chain. | Validated in `tests/test_agent_router.py` with multi-scenario benchmarks. |
| **Air-Gap Geo-Grounding** | `TextGuidedGrounder` + `MobileSAM` / `SAM-ViT-B` generate binary segmentation masks from text prompts. Masks are polygonized via `rasterio.features.shapes` into EPSG:4326 GeoJSON polygons. | Real-world coordinates extracted and verified against Cartosat / Sentinel CRS bounds. |
| **Geodesic Measurement** | `GeodesicMeasurementTool` calculates ellipsoidal surface areas (WGS84 ellipsoid via PyProj/Shapely) in $m^2$, hectares, and $km^2$ without Web Mercator distortion. | Extracted metrics returned in `envelope.geospatial_metrics`. |
| **Bi-Temporal Change** | `TemporalChangeVQA` + `SpatialAligner` (SIFT/RANSAC) aligns pre- and post-disaster rasters (T1 vs T2), computes pixel difference masks, and performs directional centroid shifts (e.g., flood expansion). | Benchmarked on Yamuna and Kosi flood scenarios. |
| **Optical-SAR Fusion** | `OpticalSARFusionTool` combines optical RGB/multispectral bands with Sentinel-1 SAR backscatter ($dB$ thresholding at $-18\text{ dB}$ for open water penetration beneath clouds). | Tested on cloud-obscured flood inundation benchmarks. |
| **Fallback Synthesis** | When rasters lack georeferencing tags or local neural weights are missing, `geo_utils.py` applies fallback affine geometry and `heuristic_vlm.py` synthesizes deterministic technical explanations. | Air-gapped fallback tested without throwing unhandled exceptions. |
| **Auditable Execution Trace** | Every request generates an immutable, unique `AuditableTraceLogSchema` (e.g., `ISRO-SQ-2026-XXXXXX`) containing exact models, input affine transforms, CRS, confidence scores, tool traces, and downloadable PDF/JSON reports. | Verified in `tests/test_trace_schema.py`. |

---

## 4. End-to-End Execution Flow

Below is the request lifecycle from user submission to GeoJSON output:

```
[User clicks "Submit" in UI]
             │
             ▼
1. Frontend Payload Construction (QueryComposer.jsx / ChatPanel.jsx)
   - Wraps query string, options (use_mobilesam, force_task), and binary raster files
   - Dispatches multipart/form-data POST to /api/v1/query
             │
             ▼
2. Ingestion & Validation (backend/api/routes.py)
   - Reads incoming files, verifies valid raster/GeoTIFF format (.tif, .png, etc.)
   - Saves files to isolated session staging in UPLOAD_DIR
   - Instantiates SatQueryController(db=db)
             │
             ▼
3. Controller LangGraph Pipeline (backend/app/services/agent.py)
   ├── A. Ingest Node:
   │      - Rasterio parses metadata (CRS, bounds, 6-parameter affine transform, bands)
   │
   ├── B. Inspect Node (SemanticIntentRouter):
   │      - Classifies intent: task_type, target_entity, confidence, required tools
   │      - Validates input constraints (e.g., 2 files required for bi-temporal change)
   │
   ├── C. Align Node (SpatialAligner):
   │      - If multi-image (bi-temporal/cross-modal), computes SIFT features & RANSAC homography
   │      - Warps moving image to reference image coordinates for sub-pixel registration
   │
   ├── D. Visual Inference Node (ToolRegistry & Specialists):
   │      - Executes tool chain (e.g. WaterGroundingTool, TemporalChangeTool, OpticalSARFusionTool)
   │      - Generates raster masks, converted to GeoJSON FeatureCollection via vector.py
   │      - Invokes GeodesicMeasurementTool to compute physical surface area (m², ha, km²)
   │      - Appends tool execution logs (.model_dump()) to scratchpad["intermediate_steps"]
   │
   ├── E. Text Generation Node:
   │      - Invokes LocalVisionLanguageClient (Ollama) or domain heuristic generator
   │      - Produces technical summary report explaining findings
   │
   └── F. Trace Synthesis Node:
          - Packages all data into AuditableTraceLogSchema
          - Persists record into PostGIS database (query_traces and query_history)
          - Exports downloadable JSON and PDF audit reports in ARTIFACT_DIR
             │
             ▼
4. Response Envelope Generation (QueryResponseEnvelope)
   - Emits HTTP 200 JSON containing:
     - status: "ok"
     - answer: Technical natural language summary
     - geojson: FeatureCollection with coordinates and properties
     - bbox: [west, south, east, north]
     - confidence: Float confidence metric
     - geospatial_metrics: Surface area and physical measurements
     - trace: Full auditable execution trace
             │
             ▼
[Frontend renders polygons on MapViewer & updates Chat / TraceViewer]
```

---

## 5. Architectural Bug Fix: Auditable Trace Pydantic Serialization

### Root Cause
During execution of multi-tool workflows (such as cross-modal analysis or bi-temporal change), `_dispatch_specialists` generates `RegistryExecutionSchema` objects representing the models executed. In `visual_inference_node`, these instances were placed into `scratchpad["intermediate_steps"]` and propagated to `state["intermediate_steps"]`.

When `AuditableTraceLogSchema` was constructed in `trace_synthesis_node`, it passed this list to `tools_executed`. However, `AuditableTraceLogSchema.tools_executed` was strictly typed as:
```python
tools_executed: Optional[List[Dict[str, Any]]] = None
```
In Pydantic v2, passing instances of `RegistryExecutionSchema` (a `BaseModel`) where a dictionary was expected triggered 3 validation errors:
```
3 validation errors for AuditableTraceLogSchema
tools_executed.0 Input should be a valid dictionary [type=dict_type, input_value=RegistryExecutionSchema...]
```

### The Solution Applied
1. **Pydantic Schema Tolerance (`backend/app/schemas/trace.py`)**:
   - Updated `tools_executed` to accept both `RegistryExecutionSchema` instances and standard dictionaries:
     ```python
     tools_executed: Optional[List[Union[RegistryExecutionSchema, Dict[str, Any]]]] = Field(
         default=None, description="Detailed trace of specialist tools executed"
     )
     ```
   - Added a resilient `.get(key, default=None)` method to `RegistryExecutionSchema` to allow consumers expecting dictionary access to safely read attributes like `.get("tool")`.
2. **Explicit `.model_dump()` Serialization (`backend/app/services/agent.py`)**:
   - In `visual_inference_node`: Wrapped `extra_steps` through `[s.model_dump() if hasattr(s, "model_dump") else s for s in extra_steps]` before populating `scratchpad["intermediate_steps"]`.
   - In `trace_synthesis_node`: Formatted `raw_tools` using `.model_dump()` before constructing `AuditableTraceLogSchema`.
   - In `_run_pipeline`: Ensured fallback linear pipeline execution also formats `tools_executed` with `.model_dump()`.
3. **Verification**:
   - Added `test_auditable_trace_log_schema_tools_executed_variants` to verify schema validation.
   - Added `test_query_endpoint_real_controller_tools_executed_serialization` to verify live `/api/v1/query` pipeline execution with real image inputs.
   - 182 test cases passed across the complete suite.
