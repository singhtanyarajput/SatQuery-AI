# SatQuery AI: Comprehensive Forensic System Analysis & Production Blueprint

**Author:** Principal Systems Architect & Geospatial AI Engineer  
**Scope:** Full repository audit (`frontend/src/`, `backend/app/`, `backend/local_models/`, `backend/api/`)  
**Objective:** Document every broken link, dropped payload, silent heuristic fallback, and weight resolution failure across the pipeline, followed by the exact rewrite blueprint for a production-ready MVP.

---

## Executive Forensic Verdict

SatQuery AI presents a polished, high-fidelity user interface and an ostensibly sophisticated multi-agent orchestration architecture. However, beneath the surface, **the end-to-end neural vision-language pipeline is currently broken in multiple critical places**. 

In the majority of runtime scenarios (especially preset selection, workspace chat interactions, and host-environment execution), **the system does not execute genuine neural inference**:
1. Image payloads are frequently dropped on the frontend due to object-wrapper impedance mismatches and failed asynchronous asset fetches.
2. The backend controller instantly bypasses the computer vision pipeline and routes to educational conversational QA (`domain_knowledge_qa`) whenever zero files are detected.
3. When files do arrive, deep learning inference frequently aborts due to missing Python dependencies (`httpx`), non-functional weight loaders, and invalid path resolution on non-Docker hosts.
4. Silent `try...except` blocks catch these fatal exceptions and substitute canned, synthetic text and simulated OpenCV contours from `heuristic_vlm.py` and `grounding_service.py`, disguising systemic execution failures as successful model inferences.

Below is the forensic breakdown of every broken link across the 4 investigated areas.

---

## 1. Forensic Audit: Frontend Payload Construction (`frontend/src/`)

### 1.1 Object Wrapper Impedance Mismatch in UI State
* **Target Files:** `frontend/src/components/geospatial/QueryComposer.jsx` (lines 98–130), `frontend/src/pages/GeospatialAnalysis.jsx` (lines 275–298), `frontend/src/components/workspace/ChatPanel.jsx` (lines 44–50).
* **The Mechanism:**
  * In `QueryComposer.jsx`, native file uploads wrap browser `File` objects inside an intermediary metadata container:
    ```javascript
    const formatted = files.map((f) => ({
      id: `user-${Date.now()}-${f.name}`,
      name: f.name,
      size: `${(f.size / (1024 * 1024)).toFixed(1)} MB`,
      modality: f.name.endsWith(".tif") ? "GeoTIFF Satellite" : "Optical Imagery",
      baseImage: f.type.startsWith("image/") ? URL.createObjectURL(f) : "/satellite/water-optical.jpg",
      file: f, // Raw File stored here
    }));
    ```
  * In `ChatPanel.jsx` (lines 44–50), the submission loop checks:
    ```javascript
    if (files && files.length > 0) {
      for (const fileItem of files) {
        if (fileItem instanceof File || fileItem instanceof Blob) {
          body.append("files", fileItem, fileItem.name);
        }
      }
    }
    ```
    * When `files` contains wrapped objects from `QueryComposer` or preset selections, `fileItem instanceof File` evaluates to **`false` 100% of the time**.
    * `body.append("files", ...)` is completely skipped.
    * The POST request to `/api/v1/query` is transmitted with **zero files attached**, silently dropping all user imagery.

### 1.2 Preset & Example Chip Asynchronous Fetch Failures
* **Target Files:** `frontend/src/mock/geospatialAnalyses.js` (lines 5–60), `frontend/src/components/geospatial/ExampleChips.jsx` (lines 15–59), `frontend/src/pages/GeospatialAnalysis.jsx` (lines 281–291).
* **The Mechanism:**
  * When a user selects a preset chip (e.g. *Godavari Basin*, *Punjab Agriculture*, or *Brahmaputra Flood*), the preset object in `SAMPLE_PRESET_IMAGES` contains only metadata and a static relative URL:
    ```javascript
    {
      id: "godavari",
      name: "godavari_optical_10m.tif",
      baseImage: "/satellite/water-optical.jpg"
      // Note: NO .file property exists!
    }
    ```
  * In `GeospatialAnalysis.jsx` (lines 281–291), `handleSubmitAnalysis` attempts to fetch the static asset on the fly:
    ```javascript
    } else if (item?.baseImage) {
      try {
        const res = await fetch(item.baseImage);
        if (res.ok) {
          const blob = await res.blob();
          fileItem = new File([blob], item.name || "preset.png", { type: blob.type || "image/png" });
        }
      } catch (fetchErr) {
        console.warn("Could not fetch preset image blob:", fetchErr);
      }
    }
    ```
  * **Failure Modes:**
    * If the application is served under a subpath, through an API reverse proxy, in SSR/test environments, or if Vite does not resolve the relative `/satellite/*.jpg` asset, `fetch(item.baseImage)` fails or returns an HTML 404 rewrite page.
    * In any failure case, `fileItem` remains a raw metadata object.
    * Line 294 (`if (fileItem instanceof File || fileItem instanceof Blob)`) evaluates to **`false`**, dropping the file.
    * The frontend proceeds to submit `POST /api/v1/query` with an empty `files` list.

### 1.3 GeoTIFF MIME-Type Invalidation
* Standard desktop browsers (Chrome, Edge, Firefox) do not recognize `.tif` or `.tiff` MIME types natively; `file.type` evaluates to `""` (empty string).
* In `QueryComposer.jsx` (line 103):
  `f.type.startsWith("image/") ? URL.createObjectURL(f) : "/satellite/water-optical.jpg"`
  * GeoTIFFs fail `f.type.startsWith("image/")`, causing `QueryComposer` to assign `/satellite/water-optical.jpg` as the preview thumbnail rather than creating an object URL.
  * When `new File([blob], ...)` is reconstructed in `GeospatialAnalysis.jsx`, a JPEG blob is given a `.tif` file extension, creating an image header / container format mismatch that later confuses backend raster decoders.

---

## 2. Forensic Audit: Backend Agentic Routing (`backend/app/agents/router.py` & `agent.py`)

### 2.1 Instant Routing Bypass to `domain_knowledge_qa`
* **Target File:** `backend/app/services/agent.py` (lines 249–267).
* **The Mechanism:**
  * When the frontend drops images (or when 0 files are submitted), `SatQueryController._run_pipeline` executes the following check at line 252:
    ```python
    if not filepaths:
        logger.info("Initiating text-only agentic workflow: Trace ID %s", trace_id)
        task = state.get("force_task") or "domain_knowledge_qa"
        std_task = STANDARDIZED_TASK_MAP.get(task, "domain_knowledge_qa")
        try:
            from app.services.models.base import LocalVisionLanguageClient
            vlm = LocalVisionLanguageClient()
            vlm_res = vlm.generate(prompt=query, image_path=None, extra_context={"task": task})
            output_desc = vlm_res.text
            confidence = vlm_res.confidence
        except Exception as exc:
            from app.services.heuristic_vlm import generate_heuristic_summary
            output_desc = generate_heuristic_summary(query=query, task=task, confidence=0.92)
    ```
  * **Critical Flaw:**
    * The entire LangGraph state machine, the `InputInspectorNode`, the spatial alignment validators, and all computer vision pipelines are **completely bypassed**.
    * If a user inputs *"Detect fuel storage tanks in this port"* or *"What is the flood inundation between T1 and T2?"* but the image payload was dropped by the frontend, the backend does **not** inform the user that imagery was missing.
    * Instead, it invisibly forces `task = "domain_knowledge_qa"`, invokes `heuristic_vlm.py`, and outputs generic educational encyclopedia paragraphs about remote sensing principles.
    * The user is left confused as to why the AI did not locate their storage tanks or flood waters.

### 2.2 Unreachable or Misaligned `InputInspectorNode` Logic
* **Target File:** `backend/app/agents/router.py` (lines 189–310).
* **The Mechanism:**
  * In `InputInspectorNode.inspect`:
    ```python
    if files is not None and len(files) == 0:
        if has_temporal:
            raise ValueError("Bi-temporal change detection requires two spatially aligned images...")
        return INTERNAL_DOMAIN_KNOWLEDGE_QA
    ```
  * However, because `SatQueryController._run_pipeline` intercepts `not filepaths` at line 252 before the LangGraph graph runs, this `ValueError` is unreachable whenever `_graph` is uninitialized.
  * When 2 images are provided, line 305 unconditionally routes to `INTERNAL_BITEMPORAL_CHANGE`, completely ignoring grounding or multi-target queries on paired imagery unless explicitly tagged as cross-modal SAR.

---

## 3. Forensic Audit: Model Inference & Synthetic Fallbacks (`backend/app/services/models/`)

### 3.1 Fatal Missing Dependency: `httpx` in Host Python Environment
* **Target File:** `backend/app/services/models/base.py` (lines 280–293).
* **The Code:**
  ```python
  def _ollama(self, prompt: str, image_path: Path | None, extra: dict[str, Any]) -> VLMResult:
      if httpx is None:
          raise RuntimeError("httpx is not installed for remote VLM calls")
  ```
* **Forensic Finding:**
  * `httpx` is **not installed** in the local Python environment (`ModuleNotFoundError: No module named 'httpx'`).
  * While `requests` and Python's built-in `urllib.request` are fully functional, `base.py` strictly relies on `httpx` for Ollama/vLLM communication.
  * Whenever `LocalVisionLanguageClient.generate()` is called, line 292 raises `RuntimeError("httpx is not installed for remote VLM calls")`.

### 3.2 Swallowed Exceptions and Silent Heuristic Masking
* **Target File:** `backend/app/services/models/base.py` (lines 263–288).
* **The Code:**
  ```python
  try:
      if self.backend == "vllm":
          return self._vllm(effective_prompt, image_path, payload_note)
      return self._ollama(effective_prompt, image_path, payload_note)
  except Exception as exc:  # Keep analyst workflow alive with high-fidelity heuristic generator
      logger.warning("vlm_service_unavailable_using_heuristic_fallback", extra={"error": str(exc)})
      try:
          from app.services.heuristic_vlm import generate_heuristic_summary
          heuristic_text = generate_heuristic_summary(
              query=prompt,
              task=payload_note.get("task") or payload_note.get("task_type"),
              geojson=payload_note.get("geojson"),
              metadata=payload_note.get("metadata") or payload_note.get("input_metadata"),
              confidence=0.88,
              models=[self.model, "Heuristic-Spatial-Synthesizer", "bigearthnet-encoder"],
              extra_context=payload_note,
          )
  ```
* **The Illusion:**
  * Real neural inference failures (missing `httpx`, Ollama container unreachable, unpulled `llava` weights, GPU out-of-memory) are **silently caught**.
  * The method returns a fabricated `VLMResult` with synthetic text and hardcoded `confidence=0.88`.
  * The frontend renders this text as if the vision-language model successfully analyzed the satellite image.

### 3.3 Docker Ollama Container Networking Mismatch
* In `docker-compose.yml`, the Ollama service is named `ollama`.
* In `backend/app/core/config.py` line 38:
  ```python
  default_docker = "http://satquery_ollama:11434" if os.path.exists("/.dockerenv") else "http://localhost:11434"
  ```
  * Notice the hostname: `satquery_ollama` vs `ollama`. Inside standard Compose networks, container DNS resolves to the service name `ollama`, causing connection timeouts if the network alias is not explicitly set.
* Furthermore, if `ollama pull llava` has not completed inside the Ollama container volume, Ollama returns `404 model 'llava' not found`, instantly tripping the fallback in line 263.

### 3.4 MobileSAM Neural Network Architecture vs. Weight Mismatch
* **Target File:** `backend/app/services/models/grounding.py` (lines 26–60, 116–145, 274–287).
* **The Forensic Truth:**
  * `backend/local_models/sam/mobile_sam.pt` (40.72 MB) is an authentic MobileSAM checkpoint containing **439 tensor weights** for TinyViT (`image_encoder`), prompt encoders, and two-way transformer decoders.
  * In `grounding.py`, lines 27–41 define `LightweightMaskDecoder`:
    ```python
    class LightweightMaskDecoder(nn.Module):
        def __init__(self, embed_dim: int = 32) -> None:
            super().__init__()
            self.stem = nn.Sequential(
                nn.Conv2d(3, embed_dim, 3, padding=1),
                nn.ReLU(inplace=True),
                nn.Conv2d(embed_dim, 1, 1),
            )
    ```
  * In `_try_load` (lines 278–283):
    `self._decoder.load_state_dict(state, strict=False)`
    * `self._decoder` only has 4 parameter tensors (`stem.0.weight`, `stem.0.bias`, `stem.2.weight`, `stem.2.bias`).
    * **Zero of the 439 MobileSAM keys match the decoder.** `strict=False` quietly discards all 439 weights without raising an error.
  * In `ZeroShotSAMGrounder.predict_instances` (lines 137–145):
    * The PyTorch decoder is **never invoked**.
    * Execution is delegated directly to `GroundingService.extract_grounded_instances(...)`.

### 3.5 Grounding is Classical OpenCV, Not Neural Vision Grounding
* **Target File:** `backend/app/services/grounding_service.py` (lines 155–200).
* **The Code:**
  ```python
  if is_tank:
      blurred = cv2.GaussianBlur(gray, (5, 5), 1.5)
      circles = cv2.HoughCircles(
          blurred,
          cv2.HOUGH_GRADIENT,
          dp=1.2,
          minDist=max(10, int(min_r * 1.5)),
          param1=50,
          param2=22,
          minRadius=int(min_r),
          maxRadius=int(max_r),
      )
  ```
* **The Finding:**
  * "Zero-shot SAM grounding" is actually **OpenCV `HoughCircles`** for storage tanks and **Sobel edge filtering** for rooftops and buildings.
  * It performs no language-vision cross-attention. If a prompt asks for *"damaged roofs"* vs *"solar panels"*, the exact same Sobel gradient contours are returned.

### 3.6 BigEarthNet LoRA Adapter: Dormant Weights and Synthetic Formulas
* **Target Files:** `backend/app/services/models/bigearthnet.py` (lines 54–207), `backend/app/services/models/base.py` (lines 42–205).
* **The Forensic Truth:**
  * `backend/local_models/bigearthnet/adapter_model.bin` (218.89 MB) is an authentic LLaVA-1.5 rank-8 LoRA adapter (`q_proj`, `k_proj`, `v_proj`, `mm_projector.weight` [4096, 1024]).
  * In `bigearthnet.py` (`BigEarthNetLandCoverClassifier`):
    * The weights are loaded into `self._state_dict` at line 88.
    * In `classify()` (lines 135–184), `self._state_dict` is **never referenced**.
    * Dominant land cover classes are classified using manual spectral heuristics:
      ```python
      if mean_ndvi > 0.35:
          probs["Broad-leaved forest"] = min(0.92, 0.45 + mean_ndvi * 0.5)
      if mean_ndwi > 0.10:
          probs["Inland waters"] = min(0.95, 0.50 + mean_ndwi * 0.8)
      if urban_contrast > 0.18:
          probs["Urban fabric"] = min(0.94, 0.40 + urban_contrast * 1.5)
      ```
  * In `base.py` (`BigEarthNetLoRAFeatureEncoder`):
    * It builds an artificial 1024-dim vector from 16x16 patch band means, applies `mm_projector.weight` and LoRA attention equations, and computes an embedding vector.
    * But that 4096-dim embedding is never fed into a generative language model decoder; it is merely placed into an audit dictionary while the actual prompt is handled by Ollama or `heuristic_vlm.py`.

---

## 4. Forensic Audit: Data & Weights Dependencies

### 4.1 Path Resolution Breakdown on Host (Windows / Local Dev)
* **Target File:** `backend/app/core/config.py` (lines 48, 77–96).
* **The Mechanism:**
  ```python
  LOCAL_MODELS_DIR: Path = Path("/local_models")
  ```
* **Live Verification Results:**
  Executing a path check against `config.settings` in the active workspace reveals:
  * `LOCAL_MODELS_DIR`: `\local_models`
  * `resolved_mobilesam_weights`: `\local_models\sam\mobile_sam.pt` &rarr; **`Exists: False`**
  * `resolved_bigearthnet`: `\local_models\bigearthnet\checkpoint.pt` &rarr; **`Exists: False`**
  * `resolved_cdvqa`: `\local_models\cdvqa\checkpoint.pt` &rarr; **`Exists: False`**
* **Root Cause:**
  * On Windows, `Path("/local_models")` resolves to `C:\local_models` (the drive root), completely bypassing the actual weights located in `backend/local_models/`.
  * As a result, every model initialization logs `grounding_weights_missing` or `change_vqa_weights_missing` and drops back to CPU fallback heuristics on any machine running outside Docker.

### 4.2 Database (PostGIS) Coupling Status
* The PostgreSQL/PostGIS connection (`self.db` in `SatQueryController`) is implemented with an optional fallback pattern (`get_optional_db`).
* When PostgreSQL is offline, `SatQueryController` executes in-memory without throwing 500 crashes.
* However, none of the spatial features extracted during inference are queried against PostGIS geometry columns (`ST_Intersects`, `ST_Within`), making the database a passive logging store rather than an active spatial intelligence engine.

---

## 5. Master Rewrite Blueprint: Production-Ready MVP

To eliminate all synthetic fallbacks, restore genuine neural model execution, and guarantee that zero payloads are dropped, the codebase must undergo a systematic refactor across four layers.

```
       [ USER / BROWSER ]
               |
    (1) Robust Normalizer (Unwraps .file, pre-caches Presets to Blobs)
               |
    (2) Multipart HTTP POST: /api/v1/query (files: [Binary Blob, ...])
               |
    (3) FastAPI Route: Persists Rasters to Temp Spool -> filepaths: [...]
               |
    (4) LangGraph Orchestrator (InputInspectorNode)
        +-- len(files) == 0  --> True Domain Knowledge QA
        +-- len(files) == 1  --> Grounding (SAM/ViT) OR Single VQA (LLaVA)
        +-- len(files) == 2  --> CD-VQA (Temporal Difference Attn) OR Optical+SAR Fusion
               |
    (5) Execution Layer:
        +-- Native MobileSAM Engine (439-key weights)
        +-- Resilient VLM Client (urllib.request / requests / Ollama API)
        +-- Genuine CORINE 19-class Classifier
```

### 5.1 Layer 1: Frontend Payload Normalization (`frontend/src/`)
1. **Create a Centralized Payload Normalizer (`prepareUploadFiles`):**
   * Before constructing `FormData`, pass all items in `attachedFiles` through an async normalizer:
     * If `item instanceof File || item instanceof Blob`: pass directly.
     * If `item.file instanceof File || item.file instanceof Blob`: extract `item.file`.
     * If `item.baseImage`: fetch the static asset via `fetch(item.baseImage)`, verify `res.ok`, and extract `await res.blob()`. Convert to `new File([blob], item.name, { type: blob.type })`.
     * If all extraction attempts fail: explicitly alert the user that the selected imagery failed to load, rather than silently omitting it.
2. **Synchronize `ChatPanel.jsx` and `GeospatialAnalysis.jsx`:**
   * Replace the fragile inline loops in both components with the shared normalizer.
   * Ensure `formData.append("files", file, file.name)` is executed identically across all query dispatch points.

### 5.2 Layer 2: Universal Path & Model Weight Resolver (`backend/app/core/config.py`)
1. **Dynamic Path Resolution:**
   * Update `LOCAL_MODELS_DIR` to search hierarchically:
     1. `os.environ.get("LOCAL_MODELS_DIR")`
     2. Path `/local_models` (if running inside Docker)
     3. Path `backend/local_models` (relative to repository root)
     4. Path `Path(__file__).resolve().parents[2] / "local_models"`
   * Guarantee that `settings.resolved_mobilesam_weights().exists()` evaluates to `True` on both Windows host workstations and Linux Docker containers.

### 5.3 Layer 3: Resilient Vision-Language Client (`backend/app/services/models/base.py`)
1. **Eliminate Missing Dependency Fatalities:**
   * Replace the strict `httpx` import with a resilient HTTP transport using `requests` or standard library `urllib.request`.
2. **Docker Hostname Auto-Detection:**
   * In `_ollama`, probe candidate hosts sequentially:
     1. `http://ollama:11434` (Docker Compose default service name)
     2. `http://satquery_ollama:11434` (Docker Compose container alias)
     3. `http://localhost:11434` (Host loopback)
     4. `http://host.docker.internal:11434` (Docker-to-host bridge)
3. **Transparent Error Propagation:**
   * Remove the silent `except Exception` block that masks VLM failures with heuristic text.
   * If the local Ollama daemon is offline or the model is missing, return an explicit diagnostic status (`"vlm_offline"`) with actionable instructions (e.g. *"Ollama model 'llava' is downloading or unavailable"*), allowing the analyst to know the exact state of the neural backend.

### 5.4 Layer 4: Real MobileSAM & Deep Learning Integration
1. **Proper MobileSAM Architecture Wiring:**
   * Replace `LightweightMaskDecoder` with the authentic MobileSAM architecture definition (TinyViT image encoder + SAM prompt encoder + mask decoder) matching the 439 keys in `mobile_sam.pt`.
   * When `mobile_sam.pt` is present, execute genuine forward passes for prompt-guided segmentation masks.
2. **Integrate BigEarthNet Domain Adapter:**
   * Connect the 218 MB `adapter_model.bin` weights to a genuine classification forward pass or directly integrate them into the VLM prompt projection pipeline so that land-cover embeddings actively shape the generative response.
3. **Transparent Routing Feedback:**
   * If a user submits a query implying temporal change (*"Show differences between T1 and T2"*) but only 0 or 1 image was attached, return a clear 400 Bad Request error explaining the requirement, rather than quietly falling back to conversational text QA.

---

## Conclusion
SatQuery AI has the necessary model weights on disk, the database models ready, and a well-structured frontend interface. The primary reason it is failing to run real neural inference is an accumulation of silent fallbacks, path misconfigurations, and wrapper mismatches that conceal bugs rather than resolving them. Implementing the 4-layer blueprint above will transform the system into an authentic, production-grade geospatial AI engine.
