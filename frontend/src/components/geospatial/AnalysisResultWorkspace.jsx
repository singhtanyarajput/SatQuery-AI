import React, { useState } from "react";
import {
  Sparkles,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Layers,
  Eye,
  EyeOff,
  Maximize2,
  Download,
  RotateCcw,
  Send,
  Info,
  MapPin,
  Cpu,
  ArrowRight,
  ShieldCheck,
  Share2,
  FileCheck,
  Map as MapIcon,
} from "lucide-react";
import MapViewer from "../MapViewer";

export default function AnalysisResultWorkspace({
  analysisData,
  userQuery,
  attachedFiles,
  onResetToNewChat,
}) {
  const [activeView, setActiveView] = useState("map"); // 'map' | 'overlay' | 'original'
  const [overlayOpacity, setOverlayOpacity] = useState(70);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isDetailsOpen, setIsDetailsOpen] = useState(true);
  const [isTraceOpen, setIsTraceOpen] = useState(true);

  // Follow-up conversation state
  const [followUpQuery, setFollowUpQuery] = useState("");
  const [followUpMessages, setFollowUpMessages] = useState([]);
  const [isAnsweringFollowUp, setIsAnsweringFollowUp] = useState(false);

  const handleSendFollowUp = (textToSend) => {
    const q = textToSend || followUpQuery;
    if (!q.trim()) return;

    const userMsg = { role: "user", text: q, timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) };
    setFollowUpMessages((prev) => [...prev, userMsg]);
    setFollowUpQuery("");
    setIsAnsweringFollowUp(true);

    setTimeout(() => {
      let aiReply = "";
      const lower = q.toLowerCase();
      if (lower.includes("area") || lower.includes("size") || lower.includes("hectare") || lower.includes("km")) {
        aiReply = `Based on sub-pixel spatial integration, the total highlighted region encompasses approximately ${
          analysisData.metrics?.[0]?.value || "54.8 km²"
        } with a geometric confidence rating of ${analysisData.confidence}%.`;
      } else if (lower.includes("where") || lower.includes("location") || lower.includes("region")) {
        aiReply = `The most concentrated features are localized in the central and northeastern drainage sector around ${analysisData.location}, as outlined in the active evidence mask.`;
      } else if (lower.includes("change") || lower.includes("trend") || lower.includes("rate")) {
        aiReply = `Comparing against baseline archival telemetry, the seasonal anomaly delta is calculated at ${
          analysisData.metrics?.[2]?.value || "+18.4%"
        }, indicating sustained spatial transformation across monitored corridors.`;
      } else {
        aiReply = `SatQuery AI evaluated the imagery for "${q}". The visual evidence layer confirms consistent spectral signatures matching the calibrated ${analysisData.selectedWorkflow} parameters.`;
      }

      const aiMsg = {
        role: "assistant",
        text: aiReply,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setFollowUpMessages((prev) => [...prev, aiMsg]);
      setIsAnsweringFollowUp(false);
    }, 700);
  };

  const currentImage =
    activeView === "overlay"
      ? (analysisData?.evidenceImage || analysisData?.baseImage || "/satellite/grounding.jpg")
      : (analysisData?.baseImage || analysisData?.evidenceImage || "/satellite/water-optical.jpg");

  const downloadImage =
    activeView === "overlay"
      ? (analysisData?.evidenceImage || analysisData?.baseImage || "/satellite/grounding.jpg")
      : (analysisData?.baseImage || analysisData?.evidenceImage || "/satellite/water-optical.jpg");

  return (
    <div className="w-full flex flex-col gap-4 animate-in fade-in duration-300">
      {/* Top Breadcrumb & Actions Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-2 border-b border-slate-200/80 dark:border-dark-border">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800/80 text-emerald-700 dark:text-emerald-300 text-xs font-semibold">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Analysis Complete</span>
          </div>
          <span className="text-xs text-slate-400 dark:text-slate-500">•</span>
          <span className="text-xs font-medium text-slate-600 dark:text-slate-300 truncate max-w-xs sm:max-w-md">
            Query: “{userQuery || "Automated Earth Observation Analysis"}”
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onResetToNewChat}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-dark-border bg-white dark:bg-dark-card hover:bg-slate-50 dark:hover:bg-dark-hover text-xs font-semibold text-slate-700 dark:text-slate-200 shadow-2xs transition"
          >
            <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
            <span>New Analysis</span>
          </button>
        </div>
      </div>

      {/* Main Two-Panel Workspace (Left: Imagery & Visual Evidence, Right: SatQuery AI Response) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        
        {/* ============================================================ */}
        {/* LEFT PANEL: SATELLITE IMAGERY & VISUAL EVIDENCE (7 cols) */}
        {/* ============================================================ */}
        <div className="lg:col-span-7 flex flex-col gap-3">
          <div className="relative rounded-2xl border border-slate-200/90 dark:border-dark-border bg-slate-900 overflow-hidden shadow-sm">
            
            {/* Imagery / Map Viewer Container */}
            <div className="relative w-full aspect-[16/10] sm:aspect-[16/10] bg-slate-950 flex items-center justify-center overflow-hidden">
              {activeView === "map" ? (
                <div className="w-full h-full">
                  <MapViewer
                    analysisData={analysisData}
                    geojsonOverlay={analysisData.geojson || analysisData.audit_summary?.geojson}
                    bboxCoordinates={analysisData.bbox || analysisData.bounds}
                    overlayOpacity={overlayOpacity / 100}
                  />
                </div>
              ) : (
                <>
                  {/* Base Satellite Image */}
                  <img
                    src={analysisData.baseImage}
                    alt="Satellite Baseline Imagery"
                    className="w-full h-full object-cover select-none"
                  />

                  {/* Visual Evidence Layer Overlay with dynamic opacity */}
                  {activeView === "overlay" && (
                    <img
                      src={analysisData.evidenceImage}
                      alt="Satellite Visual Evidence Overlay"
                      className="absolute inset-0 w-full h-full object-cover select-none transition-opacity duration-200"
                      style={{
                        opacity: overlayOpacity / 100,
                      }}
                    />
                  )}

                  {/* HUD Coordinates / Sensor Overlay */}
                  <div className="absolute top-3 left-3 pointer-events-none z-10">
                    <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-md bg-slate-950/80 backdrop-blur-xs border border-slate-800 text-[10px] font-mono font-medium text-slate-200 shadow-sm">
                      <MapPin className="w-3 h-3 text-cyan-400" />
                      <span>{analysisData.location}</span>
                    </div>
                  </div>

                  {/* Visual Evidence Badge */}
                  {activeView === "overlay" && (
                    <div className="absolute top-3 right-3 pointer-events-none z-10">
                      <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-cyan-950/85 backdrop-blur-xs border border-cyan-700/80 text-[10px] font-semibold text-cyan-300 shadow-sm">
                        <Layers className="w-3 h-3" />
                        <span>{analysisData.evidenceType}</span>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Viewer Controls Toolbar (Requirement 16) */}
            <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-white dark:bg-dark-card border-t border-slate-200/80 dark:border-dark-border">
              {/* Evidence Layer Toggle & Opacity Slider */}
              <div className="flex items-center gap-3">
                <div className="inline-flex items-center p-0.5 rounded-lg bg-slate-100 dark:bg-dark-hover border border-slate-200 dark:border-dark-border text-xs">
                  <button
                    type="button"
                    onClick={() => setActiveView("map")}
                    className={`px-2.5 py-1 rounded-md font-medium transition cursor-pointer ${
                      activeView === "map"
                        ? "bg-cyan-600 text-white shadow-2xs font-semibold"
                        : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                    }`}
                  >
                    Map View
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveView("overlay")}
                    className={`px-2.5 py-1 rounded-md font-medium transition cursor-pointer ${
                      activeView === "overlay"
                        ? "bg-brand-600 text-white shadow-2xs font-semibold"
                        : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                    }`}
                  >
                    Overlay
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveView("original")}
                    className={`px-2.5 py-1 rounded-md font-medium transition cursor-pointer ${
                      activeView === "original"
                        ? "bg-white dark:bg-dark-card text-slate-900 dark:text-white shadow-2xs font-semibold"
                        : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                    }`}
                  >
                    Original
                  </button>
                </div>

                {activeView !== "original" && (
                  <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                    <span className="text-[11px] font-medium">Opacity:</span>
                    <input
                      type="range"
                      min="20"
                      max="100"
                      value={overlayOpacity}
                      onChange={(e) => setOverlayOpacity(Number(e.target.value))}
                      className="w-16 sm:w-24 accent-brand-600 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg cursor-pointer"
                    />
                    <span className="font-mono text-[10px] w-7">{overlayOpacity}%</span>
                  </div>
                )}
              </div>

              {/* Action Buttons: Download & Fullscreen */}
              <div className="flex items-center gap-2">
                <a
                  href={downloadImage}
                  download="satquery_evidence.jpg"
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-dark-border hover:bg-slate-100 dark:hover:bg-dark-hover text-xs font-medium text-slate-700 dark:text-slate-300 transition cursor-pointer"
                  title="Download satellite evidence"
                >
                  <Download className="w-3.5 h-3.5 text-slate-500" />
                  <span className="hidden sm:inline">Download</span>
                </a>
                <button
                  type="button"
                  onClick={() => setIsFullscreen(!isFullscreen)}
                  className="p-1.5 rounded-lg border border-slate-200 dark:border-dark-border hover:bg-slate-100 dark:hover:bg-dark-hover text-slate-600 dark:text-slate-300 transition cursor-pointer"
                  title="View fullscreen"
                >
                  <Maximize2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>

          {/* Key Metrics Strip */}
          {Array.isArray(analysisData?.metrics) && analysisData.metrics.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {analysisData.metrics.map((m, idx) => (
                <div
                  key={idx}
                  className="p-2.5 rounded-xl border border-slate-200/90 dark:border-dark-border bg-white dark:bg-dark-card shadow-2xs"
                >
                  <div className="text-[10px] uppercase tracking-wider font-semibold text-slate-400 dark:text-slate-500">
                    {m?.label || "Metric"}
                  </div>
                  <div className="text-sm font-bold text-slate-900 dark:text-white mt-0.5">
                    {m?.value || "—"}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ============================================================ */}
        {/* RIGHT PANEL: SATQUERY AI RESPONSE & DETAILS (5 cols) */}
        {/* ============================================================ */}
        <div className="lg:col-span-5 flex flex-col gap-4">
          
          {/* Main AI Response Card */}
          <div className="rounded-2xl border border-slate-200/90 dark:border-dark-border bg-white dark:bg-dark-card p-5 shadow-sm space-y-4">
            
            {/* Header with SatQuery AI Brand & Confidence */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-tr from-brand-600 to-cyan-500 text-white shadow-xs">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white leading-none">
                    SatQuery AI
                  </h3>
                  <span className="text-[10px] text-slate-400">Autonomous EO Specialist</span>
                </div>
              </div>

              <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300 text-xs font-bold font-mono">
                Confidence: {analysisData?.confidence ?? 90}%
              </div>
            </div>

            {/* Headline */}
            <h4 className="text-base font-bold text-slate-950 dark:text-white leading-snug">
              {analysisData?.headline || "Analysis Complete"}
            </h4>

            {/* Natural-Language Answer */}
            <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-200 leading-relaxed">
              {analysisData?.answer || "Autonomous satellite intelligence analysis completed."}
            </p>

            {/* Key Findings List */}
            {Array.isArray(analysisData?.keyFindings) && analysisData.keyFindings.length > 0 && (
              <div className="space-y-1.5 pt-1">
                <div className="text-[11px] font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider">
                  Key Findings
                </div>
                <ul className="space-y-1">
                  {analysisData.keyFindings.map((finding, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-xs text-slate-600 dark:text-slate-300">
                      <span className="text-brand-500 font-bold mt-0.5">•</span>
                      <span>{finding}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Important Autonomous Routing Communication Banner (Requirement 10 & 19) */}
            <div className="p-3 rounded-xl bg-blue-50/80 dark:bg-blue-950/40 border border-blue-200/80 dark:border-blue-800/60 flex items-center gap-2.5">
              <Sparkles className="w-4 h-4 text-blue-600 dark:text-blue-400 flex-shrink-0" />
              <p className="text-xs font-semibold text-blue-900 dark:text-blue-200">
                Analysis automatically selected by SatQuery AI.
              </p>
            </div>

            {/* Section 12: Collapsible "Analysis details" */}
            <div className="border-t border-slate-100 dark:border-dark-border/80 pt-3">
              <button
                type="button"
                onClick={() => setIsDetailsOpen(!isDetailsOpen)}
                className="w-full flex items-center justify-between text-xs font-bold text-slate-900 dark:text-white hover:text-brand-600 transition"
              >
                <div className="flex items-center gap-1.5">
                  <Info className="w-3.5 h-3.5 text-slate-400" />
                  <span>Analysis details</span>
                </div>
                {isDetailsOpen ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
              </button>

              {isDetailsOpen && (
                <div className="mt-3 p-3 rounded-xl bg-slate-50 dark:bg-dark-hover/40 border border-slate-200/60 dark:border-dark-border text-xs space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500 dark:text-slate-400">Detected task:</span>
                    <span className="font-semibold text-slate-900 dark:text-white">{analysisData?.detectedTask || "Geospatial Analysis"}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500 dark:text-slate-400">Input:</span>
                    <span className="font-semibold text-slate-900 dark:text-white">{analysisData?.inputModality || "Optical RGB"}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500 dark:text-slate-400">Specialist workflow:</span>
                    <span className="font-semibold text-slate-900 dark:text-white">{analysisData?.selectedWorkflow || "RS-Grounding-V3"}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500 dark:text-slate-400">Visual evidence:</span>
                    <span className="font-semibold text-slate-900 dark:text-white">{analysisData?.evidenceType || "Visual Evidence Mask"}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500 dark:text-slate-400">Confidence:</span>
                    <span className="font-semibold text-emerald-600 dark:text-emerald-400 font-mono">{analysisData?.confidence ?? 90}%</span>
                  </div>
                  <div className="pt-1.5 border-t border-slate-200/60 dark:border-dark-border/60 text-[10px] text-slate-400 italic">
                    SatQuery selected these parameters automatically based on natural language inference and sensor metadata.
                  </div>
                </div>
              )}
            </div>

            {/* Section 13: Collapsible "How SatQuery analyzed this" */}
            <div className="border-t border-slate-100 dark:border-dark-border/80 pt-3">
              <button
                type="button"
                onClick={() => setIsTraceOpen(!isTraceOpen)}
                className="w-full flex items-center justify-between text-xs font-bold text-slate-900 dark:text-white hover:text-brand-600 transition"
              >
                <div className="flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                  <span>How SatQuery analyzed this</span>
                </div>
                {isTraceOpen ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
              </button>

              {isTraceOpen && (
                <div className="mt-3 p-3 rounded-xl bg-slate-50 dark:bg-dark-hover/40 border border-slate-200/60 dark:border-dark-border text-xs space-y-1.5">
                  {[
                    "Query understood",
                    "Input validated",
                    "Analysis workflow selected",
                    "Specialist model executed",
                    "Visual evidence generated",
                    "Answer produced",
                  ].map((traceStep, idx) => (
                    <div key={idx} className="flex items-center justify-between text-slate-700 dark:text-slate-300">
                      <span>{traceStep}</span>
                      <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Follow-up Messages History */}
          {followUpMessages.length > 0 && (
            <div className="space-y-2.5 max-h-60 overflow-y-auto pr-1">
              {followUpMessages.map((msg, idx) => (
                <div
                  key={idx}
                  className={`p-3 rounded-xl text-xs leading-relaxed ${
                    msg.role === "user"
                      ? "bg-blue-50 dark:bg-blue-950/40 border border-blue-200/80 dark:border-blue-800 ml-4 text-blue-900 dark:text-blue-200"
                      : "bg-white dark:bg-dark-card border border-slate-200 dark:border-dark-border mr-4 text-slate-800 dark:text-slate-200"
                  }`}
                >
                  <div className="font-semibold mb-0.5 text-[10px] text-slate-400 uppercase">
                    {msg.role === "user" ? "You" : "SatQuery AI"} • {msg.timestamp}
                  </div>
                  {msg.text}
                </div>
              ))}
              {isAnsweringFollowUp && (
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-dark-card border border-slate-200 dark:border-dark-border text-xs text-slate-500 flex items-center gap-2">
                  <Sparkles className="w-3.5 h-3.5 text-brand-600 animate-spin" />
                  <span>SatQuery is generating response...</span>
                </div>
              )}
            </div>
          )}

          {/* Follow-up Query Composer (ChatGPT / Gemini style) */}
          <div className="rounded-2xl border border-slate-200/90 dark:border-dark-border bg-white dark:bg-dark-card p-3 shadow-sm space-y-2">
            {/* Suggested Follow-up Chips */}
            {analysisData.suggestedFollowUps && (
              <div className="space-y-1">
                <div className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                  Suggested Follow-ups
                </div>
                <div className="flex flex-col gap-1">
                  {analysisData.suggestedFollowUps.map((suggestion, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleSendFollowUp(suggestion)}
                      className="text-left text-xs text-brand-600 dark:text-brand-400 hover:text-brand-800 dark:hover:text-brand-200 hover:underline flex items-center justify-between group py-0.5"
                    >
                      <span className="truncate">“{suggestion}”</span>
                      <ArrowRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Input Row */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendFollowUp();
              }}
              className="flex items-center gap-2 pt-1 border-t border-slate-100 dark:border-dark-border/60"
            >
              <input
                type="text"
                value={followUpQuery}
                onChange={(e) => setFollowUpQuery(e.target.value)}
                placeholder="Ask a follow-up about this imagery..."
                className="flex-1 bg-transparent text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none"
              />
              <button
                type="submit"
                disabled={!followUpQuery.trim() || isAnsweringFollowUp}
                className="p-1.5 rounded-lg bg-brand-600 hover:bg-brand-700 text-white disabled:opacity-40 transition"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* Fullscreen Image Modal */}
      {isFullscreen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4 backdrop-blur-md">
          <div className="relative max-w-5xl max-h-[90vh] w-full flex flex-col items-center">
            <button
              type="button"
              onClick={() => setIsFullscreen(false)}
              className="absolute top-2 right-2 p-2 rounded-full bg-slate-800/80 text-white hover:bg-slate-700 transition"
            >
              ✕
            </button>
            <img
              src={currentImage}
              alt="Fullscreen satellite view"
              className="max-h-[85vh] max-w-full object-contain rounded-xl"
            />
          </div>
        </div>
      )}
    </div>
  );
}
