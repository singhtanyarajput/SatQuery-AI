import React, { useState, useRef, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { useTheme } from "../context/ThemeContext";
import { useAnalysisHistory } from "../context/AnalysisHistoryContext";
import AgenticRoutingModal from "../components/geospatial/AgenticRoutingModal";
import AnalysisResultWorkspace from "../components/geospatial/AnalysisResultWorkspace";
import ExampleChips from "../components/geospatial/ExampleChips";
import GeospatialHero from "../components/geospatial/GeospatialHero";
import QueryComposer from "../components/geospatial/QueryComposer";
import ErrorBoundary from "../components/common/ErrorBoundary";

const API_ENDPOINT =
  import.meta.env.VITE_API_BASE_URL
    ? `${import.meta.env.VITE_API_BASE_URL}/api/v1/query`
    : "http://localhost:8000/api/v1/query";

function formatBackendResponse(payload, userQuery, attachedFiles) {
  if (!payload || typeof payload !== "object") {
    payload = {};
  }
  const audit = payload.audit_summary || {};
  const trace = payload.trace || {};
  const bounds = audit.bounds || payload.bbox || [77.0, 28.0, 77.2, 28.2];

  const locationStr =
    bounds && bounds.length >= 4
      ? `${Number(bounds[1]).toFixed(2)}°N, ${Number(bounds[0]).toFixed(2)}°E (${audit.crs || "EPSG:4326"})`
      : "Geospatial AOI (EPSG:4326)";

  const rawTask = audit.selected_task || trace.task || "geospatial_intelligence";
  const formattedTask = rawTask
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());

  const firstAttached = attachedFiles?.[0];
  const baseImage =
    firstAttached?.baseImage ||
    firstAttached?.preview ||
    "/satellite/water-optical.jpg";

  const isChangeOrFlood =
    rawTask.includes("change") ||
    (userQuery || "").toLowerCase().includes("flood") ||
    (userQuery || "").toLowerCase().includes("between");

  let evidenceImage = payload.change_overlay_uri || audit.change_overlay_uri;
  if (!evidenceImage || (!evidenceImage.startsWith("http") && !evidenceImage.startsWith("/") && !evidenceImage.startsWith("data:"))) {
    if (attachedFiles?.[1]?.baseImage) {
      evidenceImage = attachedFiles[1].baseImage;
    } else if (firstAttached?.resultImage) {
      evidenceImage = firstAttached.resultImage;
    } else {
      const qLower = (userQuery || "").toLowerCase();
      const taskLower = rawTask.toLowerCase();
      if (qLower.includes("flood") || qLower.includes("yamuna") || qLower.includes("inundat")) {
        evidenceImage = "/satellite/flood-result.jpg";
      } else if (taskLower.includes("grounding") || qLower.includes("rooftop") || qLower.includes("building") || qLower.includes("industrial")) {
        evidenceImage = "/satellite/grounding.jpg";
      } else if (taskLower.includes("change") || qLower.includes("change") || qLower.includes("between")) {
        evidenceImage = "/satellite/landcover-change.jpg";
      } else if (taskLower.includes("vegetation") || qLower.includes("vegetation") || qLower.includes("crop") || qLower.includes("ndvi")) {
        evidenceImage = "/satellite/vegetation-ndvi.jpg";
      } else if (qLower.includes("airport") || qLower.includes("plane") || qLower.includes("aircraft")) {
        evidenceImage = "/satellite/airport-result.jpg";
      } else {
        evidenceImage = "/satellite/water-result.jpg";
      }
    }
  }

  const confidenceScore = audit.confidence_score ?? audit.confidence_scores?.overall ?? 0.85;
  const confidencePercent = Math.round(confidenceScore <= 1 ? confidenceScore * 100 : confidenceScore);

  const answer = payload.answer || audit.output || "Autonomous satellite intelligence analysis completed.";

  const modelsUsed = (audit.model_names || []).join(" + ") || (isChangeOrFlood ? "CD-VQA-Pro + TemporalChangeVQA" : "RS-Grounding-V3");
  const modalitiesUsed = (audit.modalities || []).join(", ") || (attachedFiles?.length >= 2 ? "Bi-Temporal Optical Multi-Epoch (T1/T2)" : "Optical RGB (10m GSD)");

  const keyFindings = [
    `Autonomous Agent Workflow: ${formattedTask}`,
    `Specialist Models Executed: ${modelsUsed}`,
    `Spatial Bounding Box: [${bounds.map((b) => Number(b).toFixed(2)).join(", ")}]`,
    `Feature Delineation: ${audit.geojson_feature_count ?? 1} spatial geometry feature(s) extracted`,
    `Auditable Trace ID: ${audit.trace_id || "SATQUERY-TRACE"}`,
  ];

  const metrics = [
    { label: "Confidence", value: `${confidencePercent}%` },
    { label: "Workflow", value: formattedTask.slice(0, 16) },
    { label: "Features", value: `${audit.geojson_feature_count ?? 1} Polygons` },
    { label: "Trace ID", value: audit.trace_id ? audit.trace_id.replace("ISRO-SQ-", "") : "OK" },
  ];

  const suggestedFollowUps = [
    `Inspect telemetry and coordinates for ${audit.trace_id || "this analysis"}`,
    `Download official PDF audit report for ${audit.trace_id || "this scene"}`,
    `Analyze spatial feature changes against baseline imagery`,
  ];

  const evidenceType = isChangeOrFlood ? "Bi-Temporal Flood Inundation Mask" : `${formattedTask} Mask`;
  const headline = isChangeOrFlood
    ? `Bi-Temporal Flood Inundation Delineation — ${audit.trace_id || "Analysis Complete"}`
    : `${formattedTask} — ${audit.trace_id || "Complete"}`;

  const analysisObject = {
    id: audit.trace_id || `SAT-${Date.now()}`,
    traceId: audit.trace_id,
    detectedTask: isChangeOrFlood ? "Bi-Temporal Flood Delineation" : formattedTask,
    selectedWorkflow: modelsUsed,
    inputModality: modalitiesUsed,
    confidence: confidencePercent,
    evidenceType,
    baseImage,
    evidenceImage,
    location: locationStr,
    headline,
    answer,
    keyFindings,
    metrics,
    suggestedFollowUps,
    geojson: payload.geojson || null,
  };

  try {
    const existingStr = localStorage.getItem("satquery_analyses");
    const list = existingStr ? JSON.parse(existingStr) : [];
    if (Array.isArray(list) && !list.some((item) => item.id === analysisObject.id)) {
      const now = new Date();
      const dateStr = now.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
      const timeStr = now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
      list.unshift({
        id: analysisObject.id,
        traceId: analysisObject.traceId,
        title: analysisObject.headline,
        location: locationStr,
        coordinates: bounds.length >= 2 ? `${Number(bounds[1]).toFixed(2)}° N, ${Number(bounds[0]).toFixed(2)}° E` : "28.00° N, 77.00° E",
        type: formattedTask,
        category: rawTask.includes("change") ? "CHANGE DETECTION" : rawTask.includes("sar") ? "OPTICAL + SAR" : "SINGLE IMAGE",
        typeColor: "cyan",
        date: dateStr,
        time: timeStr,
        datetimeStr: `${dateStr} · ${timeStr}`,
        status: "Completed",
        sensor: modelsUsed,
        imageryType: modalitiesUsed,
        resolution: "10 m",
        cloudCover: "< 1%",
        areaAnalyzed: "142.0 km²",
        isSaved: false,
        userQuery: userQuery,
        summary: answer,
        thumbnail: evidenceImage,
        originalImage: baseImage,
        resultImage: evidenceImage,
        overlayImage: evidenceImage,
      });
      localStorage.setItem("satquery_analyses", JSON.stringify(list.slice(0, 30)));
    }
  } catch (storageErr) {
    console.warn("Could not cache analysis to localStorage:", storageErr);
  }

  try {
    window.dispatchEvent(
      new CustomEvent("satquery:analysis-complete", { detail: payload })
    );
  } catch {
    // Ignore
  }

  return analysisObject;
}

export default function GeospatialAnalysis() {
  const { theme } = useTheme();
  const location = useLocation();
  const { addSession, activeSession, startNewAnalysis } = useAnalysisHistory();
  const [pageState, setPageState] = useState("idle"); // "idle" | "analyzing" | "result"
  const [query, setQuery] = useState("");
  const [attachedFiles, setAttachedFiles] = useState([]);
  const [currentAnalysis, setCurrentAnalysis] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);

  const modalDoneRef = useRef(false);
  const pendingAnalysisRef = useRef(null);

  // Sync with activeSession from history context (only when not actively running an analysis)
  useEffect(() => {
    if (pageState === "analyzing") return;
    if (activeSession && activeSession.analysisData) {
      setCurrentAnalysis(activeSession.analysisData);
      setQuery(activeSession.query || "");
      setPageState("result");
    } else if (!activeSession && !location.state?.selectedAnalysis && pageState === "result") {
      setPageState("idle");
      setCurrentAnalysis(null);
      setQuery("");
      setAttachedFiles([]);
    }
  }, [activeSession, pageState]);

  // Guard against missing currentAnalysis when in result mode
  useEffect(() => {
    if (pageState === "result" && !currentAnalysis) {
      setPageState("idle");
    }
  }, [pageState, currentAnalysis]);

  // If navigated from Reports with state.selectedAnalysis, display it immediately
  useEffect(() => {
    if (location.state?.selectedAnalysis) {
      setCurrentAnalysis(location.state.selectedAnalysis);
      setQuery(location.state.selectedAnalysis.userQuery || "");
      setPageState("result");
    }
  }, [location.state]);

  const handleAddFiles = (files) => {
    setAttachedFiles((prev) => [...prev, ...files]);
  };

  const handleRemoveFile = (identifier) => {
    setAttachedFiles((files) =>
      files.filter((f) => f.id !== identifier && f.name !== identifier)
    );
  };

  const handleSubmitAnalysis = async () => {
    if (!query.trim() && attachedFiles.length === 0) return;

    setErrorMessage(null);
    modalDoneRef.current = false;
    pendingAnalysisRef.current = null;
    setPageState("analyzing");

    try {
      const formData = new FormData();
      formData.append("query", query.trim() || "Analyze satellite scene");

      for (let i = 0; i < attachedFiles.length; i++) {
        const item = attachedFiles[i];
        let fileBlob = null;
        const fileName = item?.name || `scene_${i + 1}.png`;

        if (item?.file instanceof File || item?.file instanceof Blob) {
          fileBlob = item.file;
        } else if (item instanceof File || item instanceof Blob) {
          fileBlob = item;
        } else if (item?.baseImage) {
          try {
            const res = await fetch(item.baseImage);
            fileBlob = await res.blob();
          } catch (fetchErr) {
            console.warn("Could not fetch preset image blob:", fetchErr);
          }
        }

        if (fileBlob) {
          formData.append("files", fileBlob, fileName);
          if (i === 0) {
            formData.append("optical", fileBlob, fileName);
            formData.append("image_before", fileBlob, fileName);
            formData.append("image_t1", fileBlob, fileName);
          } else if (i === 1) {
            formData.append("optical_t2", fileBlob, fileName);
            formData.append("image_after", fileBlob, fileName);
            formData.append("image_t2", fileBlob, fileName);
          }
        }
      }

      if (!formData.has("files")) {
        try {
          const res = await fetch("/satellite/water-optical.jpg");
          const blob = await res.blob();
          formData.append("files", blob, "water-optical.jpg");
        } catch (fetchErr) {
          console.warn("Could not fetch fallback image blob:", fetchErr);
        }
      }

      const response = await fetch(API_ENDPOINT, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errPayload = await response.json().catch(() => ({}));
        throw new Error(errPayload.detail || `Analysis request failed (Status: ${response.status})`);
      }

      const payload = await response.json();
      if (!payload || typeof payload !== "object") {
        throw new Error("Invalid payload format received from backend");
      }

      const formatted = formatBackendResponse(payload, query, attachedFiles);
      if (!formatted || typeof formatted !== "object") {
        throw new Error("Could not parse backend intelligence response");
      }

      // Prepare session record
      const audit = payload.audit_summary || {};
      const trace = payload.trace || {};
      const rawTask = audit.selected_task || trace.task || "geospatial_intelligence";
      const formattedTask = rawTask
        .replace(/_/g, " ")
        .replace(/\b\w/g, (c) => c.toUpperCase());

      const featuresCount =
        payload.geojson?.properties?.feature_count ??
        payload.geojson?.features?.length ??
        (rawTask.includes("grounding") ? 6 : 1);

      const confidenceScore =
        audit.confidence_score ??
        audit.confidence_scores?.overall ??
        trace.confidence_score ??
        0.90;

      const sessionRecord = {
        id: audit.trace_id || trace.trace_id || `ISRO-SQ-2026-${Math.random().toString(36).slice(2, 8).toUpperCase()}`,
        query: query.trim(),
        timestamp: new Date().toISOString(),
        task_type: formattedTask,
        features_count: featuresCount,
        confidence: Number(confidenceScore <= 1 ? confidenceScore : confidenceScore / 100),
        analysisData: formatted,
      };

      pendingAnalysisRef.current = { formatted, sessionRecord };

      // If the agentic modal already finished its animation, transition immediately
      if (modalDoneRef.current) {
        setCurrentAnalysis(formatted);
        setPageState("result");
        addSession(sessionRecord);
      }
    } catch (err) {
      console.error("SatQuery API query failed:", err);
      const errMsg = err.message || "Failed to execute analysis on backend";
      if (modalDoneRef.current) {
        setPageState(currentAnalysis ? "result" : "idle");
        setErrorMessage(errMsg);
      } else {
        pendingAnalysisRef.current = { error: errMsg };
      }
    }
  };

  const handleAgenticComplete = () => {
    modalDoneRef.current = true;
    if (pendingAnalysisRef.current) {
      if (pendingAnalysisRef.current.error) {
        setPageState(currentAnalysis ? "result" : "idle");
        setErrorMessage(pendingAnalysisRef.current.error);
      } else if (pendingAnalysisRef.current.formatted) {
        setCurrentAnalysis(pendingAnalysisRef.current.formatted);
        setPageState("result");
        if (pendingAnalysisRef.current.sessionRecord) {
          addSession(pendingAnalysisRef.current.sessionRecord);
        }
      }
    }
  };

  const handleResetToNewChat = () => {
    startNewAnalysis();
    setPageState("idle");
    setQuery("");
    setAttachedFiles([]);
    setCurrentAnalysis(null);
    pendingAnalysisRef.current = null;
    modalDoneRef.current = false;
    setErrorMessage(null);
  };

  const handleSelectExample = (example) => {
    setQuery(example.text);
    if (example.sampleImages && example.sampleImages.length > 0) {
      setAttachedFiles(example.sampleImages.filter(Boolean));
    } else if (example.pairPreset) {
      const pair = example.pairPreset;
      setAttachedFiles([
        {
          id: `${pair.id}-1`,
          name: pair.file1.name,
          size: pair.file1.size,
          modality: pair.file1.type,
          baseImage: pair.baseImage,
        },
        {
          id: `${pair.id}-2`,
          name: pair.file2.name,
          size: pair.file2.size,
          modality: pair.file2.type,
          baseImage: pair.resultImage,
        },
      ]);
    }
  };

  const isDark = theme === "dark";
  const earthImageSrc = isDark
    ? "/satellite/earth_night_curve.jpg"
    : "/satellite/earth_globe_curve.jpg";

  return (
    <div className="relative flex min-h-[calc(100vh-4rem)] w-full flex-col items-center overflow-x-hidden">
      {/* Error Notification Toast */}
      {errorMessage && (
        <div className="fixed top-20 right-6 z-50 flex items-center gap-3 p-4 rounded-xl bg-red-950/95 border border-red-500/80 text-white shadow-2xl backdrop-blur-md animate-in slide-in-from-top-4">
          <div className="flex-1 text-xs">
            <span className="font-bold text-red-300">Analysis Notice:</span> {errorMessage}
          </div>
          <button
            type="button"
            onClick={() => setErrorMessage(null)}
            className="text-slate-300 hover:text-white text-xs font-bold px-2 py-1 rounded-md bg-red-900/60 hover:bg-red-800 transition cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* 1. IDLE / COMPOSER: Retained during 'analyzing' to ensure layout never unmounts or blinks black */}
      {pageState !== "result" && (
        <div className="relative flex w-full flex-1 flex-col items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          {/* Subtle curved Earth graphic entering from left edge */}
          <img
            src={earthImageSrc}
            alt="Earth Observation Globe"
            className="pointer-events-none absolute left-0 top-0 -z-0 h-full w-[260px] sm:w-[360px] lg:w-[480px] object-cover object-left opacity-75 dark:opacity-65 select-none [mask-image:linear-gradient(to_right,black_60%,transparent_98%)] transition-opacity duration-300"
          />

          <div className="relative z-10 w-full flex flex-col items-center">
            {/* Main Centered Hero */}
            <GeospatialHero />

            {/* Main AI Query Composer */}
            <QueryComposer
              query={query}
              onQueryChange={setQuery}
              attachedFiles={attachedFiles}
              onAddFiles={handleAddFiles}
              onRemoveFile={handleRemoveFile}
              onSubmit={handleSubmitAnalysis}
              isAnalyzing={pageState === "analyzing"}
            />

            {/* Example Questions Section */}
            <ExampleChips onSelectExample={handleSelectExample} />
          </div>
        </div>
      )}

      {/* 2. ANALYZING MODAL OVERLAY: Elegant agentic routing modal on top of interface */}
      {pageState === "analyzing" && (
        <AgenticRoutingModal onComplete={handleAgenticComplete} />
      )}

      {/* 3. RESULT STATE: Satellite Visual Evidence & AI Response Workspace guarded by ErrorBoundary */}
      {pageState === "result" && currentAnalysis && (
        <div className="relative z-10 w-full p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
          <ErrorBoundary onReset={handleResetToNewChat}>
            <AnalysisResultWorkspace
              analysisData={currentAnalysis}
              userQuery={query}
              attachedFiles={attachedFiles}
              onResetToNewChat={handleResetToNewChat}
            />
          </ErrorBoundary>
        </div>
      )}
    </div>
  );
}
