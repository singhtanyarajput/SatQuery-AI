import React, { useState } from "react";
import {
  X,
  Maximize2,
  MapPin,
  Calendar,
  FileText,
  Trash2,
  CheckCircle2,
  Clock,
  Sparkles,
  Info,
  ExternalLink,
  ChevronRight,
  Droplets,
  Waves,
  Leaf,
  RefreshCw,
  AlertTriangle,
  Building,
  Building2,
  Eye,
  Layers,
  ArrowDown,
  ArrowRight,
} from "lucide-react";
import StatusBadge from "./StatusBadge";

export default function AnalysisDetailsPanel({
  analysis,
  onClose,
  onViewReport,
  onOpenWorkspace,
  onDelete,
}) {
  const [activeTab, setActiveTab] = useState("summary"); // 'summary' | 'findings' | 'trace' | 'notes'
  const [imageMode, setImageMode] = useState("overlay"); // 'original' | 'overlay' | 'sar'

  if (!analysis) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 p-8 text-center dark:border-dark-border dark:bg-dark-card/50">
        <Info className="h-8 w-8 text-slate-400" />
        <p className="mt-2 text-xs font-semibold text-slate-600 dark:text-slate-300">
          No report selected
        </p>
        <p className="mt-1 text-[11px] text-slate-400">
          Select any report card from the archive to view its multimodal remote-sensing details.
        </p>
      </div>
    );
  }

  const getTypeIcon = () => {
    switch (analysis.typeColor) {
      case "cyan":
        return <Droplets className="h-5 w-5 text-cyan-400" />;
      case "green":
        return <Leaf className="h-5 w-5 text-emerald-400" />;
      case "amber":
        return <RefreshCw className="h-5 w-5 text-amber-400" />;
      case "red":
        return <AlertTriangle className="h-5 w-5 text-rose-400" />;
      case "purple":
      default:
        return <Eye className="h-5 w-5 text-purple-400" />;
    }
  };

  const isOpticalSar = analysis.category === "OPTICAL + SAR";
  const isChangeDetection = analysis.category === "CHANGE DETECTION";

  // Select appropriate active preview image based on imageMode
  const getActiveMainImage = () => {
    if (imageMode === "original") {
      return analysis.originalImage || analysis.beforeImage || analysis.thumbnail;
    }
    if (imageMode === "sar" && analysis.sarImage) {
      return analysis.sarImage;
    }
    // Default: overlay or result image
    return analysis.resultImage || analysis.overlayImage || analysis.thumbnail;
  };

  const traceSteps = analysis.executionTrace || [];

  return (
    <div className="flex flex-col rounded-2xl border border-slate-200/80 bg-white shadow-xl dark:border-dark-border dark:bg-dark-card overflow-hidden">
      {/* Panel Header */}
      <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3 dark:border-dark-border bg-slate-50/50 dark:bg-dark-sidebar/50">
        <div className="flex items-center space-x-2">
          <Sparkles className="h-4 w-4 text-brand-500" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">
            Report Details
          </h3>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="rounded-lg p-1 text-slate-400 hover:bg-slate-200/60 hover:text-slate-700 dark:hover:bg-dark-hover dark:hover:text-slate-200 transition"
          title="Close details"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Main Scrollable Area */}
      <div className="flex-1 space-y-4 overflow-y-auto p-4 max-h-[calc(100vh-220px)]">
        {/* Large Top-Down Remote-Sensing Image Preview */}
        <div className="space-y-1.5">
          <div className="relative aspect-[16/10] w-full overflow-hidden rounded-xl bg-slate-900 group shadow-md border border-slate-200/60 dark:border-dark-border">
            <img
              src={getActiveMainImage() || "/satellite/water-result.jpg"}
              alt={analysis.title}
              className="h-full w-full object-cover transition-all duration-300"
              onError={(e) => {
                e.currentTarget.src = "/satellite/water-result.jpg";
              }}
            />

            {/* Top Left: Expand Modal */}
            <button
              type="button"
              onClick={() => onViewReport(analysis)}
              className="absolute left-2.5 top-2.5 z-10 flex h-7 w-7 items-center justify-center rounded-lg bg-black/60 text-white backdrop-blur-md hover:bg-black/80 transition"
              title="View Full Resolution Dossier"
            >
              <Maximize2 className="h-3.5 w-3.5" />
            </button>

            {/* Top Right: Status Badge */}
            <div className="absolute right-2.5 top-2.5 z-10">
              <StatusBadge status={analysis.status} variant="pill" />
            </div>

            {/* Bottom Overlays: Location and Date */}
            <div className="absolute bottom-2.5 left-2.5 right-2.5 z-10 flex items-center justify-between text-[11px] font-medium text-slate-200">
              <div className="flex items-center space-x-1 truncate max-w-[65%]">
                <MapPin className="h-3.5 w-3.5 text-brand-400 flex-shrink-0" />
                <span className="truncate">{analysis.location}</span>
              </div>
              <div className="flex items-center space-x-1 flex-shrink-0 text-slate-300">
                <Calendar className="h-3 w-3 text-slate-400" />
                <span>{analysis.date}</span>
              </div>
            </div>
          </div>

          {/* Interactive Layer Switcher: [Original] | [Detected Overlay] | [SAR] */}
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center space-x-1 rounded-lg border border-slate-200 bg-slate-50/70 p-0.5 dark:border-dark-border dark:bg-dark-sidebar/60">
              <button
                type="button"
                onClick={() => setImageMode("original")}
                className={`rounded px-2 py-1 text-[10px] font-semibold transition ${
                  imageMode === "original"
                    ? "bg-white text-brand-600 shadow-sm dark:bg-dark-card dark:text-brand-400"
                    : "text-slate-500 hover:text-slate-800 dark:text-slate-400"
                }`}
              >
                Original Image
              </button>

              <button
                type="button"
                onClick={() => setImageMode("overlay")}
                className={`rounded px-2 py-1 text-[10px] font-semibold transition ${
                  imageMode === "overlay"
                    ? "bg-white text-brand-600 shadow-sm dark:bg-dark-card dark:text-brand-400"
                    : "text-slate-500 hover:text-slate-800 dark:text-slate-400"
                }`}
              >
                Detected Overlay
              </button>

              {analysis.sarImage && (
                <button
                  type="button"
                  onClick={() => setImageMode("sar")}
                  className={`rounded px-2 py-1 text-[10px] font-semibold transition ${
                    imageMode === "sar"
                      ? "bg-white text-brand-600 shadow-sm dark:bg-dark-card dark:text-brand-400"
                      : "text-slate-500 hover:text-slate-800 dark:text-slate-400"
                  }`}
                >
                  SAR Radar
                </button>
              )}
            </div>

            <span className="font-mono text-[9px] text-slate-400">
              {imageMode === "original"
                ? "Raw Acquisition"
                : imageMode === "sar"
                ? "Radar Backscatter"
                : "AI Delineation Mask"}
            </span>
          </div>
        </div>

        {/* Title & Type Header */}
        <div className="flex items-start space-x-3 pt-0.5">
          <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-slate-100 dark:bg-dark-sidebar border border-slate-200 dark:border-dark-border">
            {getTypeIcon()}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-2">
              <h4 className="text-base font-bold text-slate-900 dark:text-white leading-snug truncate">
                {analysis.title}
              </h4>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5">
              {analysis.location} · {analysis.coordinates}
            </p>
          </div>
        </div>

        {/* Telemetry Metadata Grid */}
        <div className="grid grid-cols-2 gap-2.5 rounded-xl border border-slate-100 bg-slate-50/60 p-3 text-xs dark:border-dark-border dark:bg-dark-sidebar/40">
          <div>
            <span className="text-[10px] uppercase font-semibold tracking-wider text-slate-400 dark:text-slate-500">
              Analysis Type
            </span>
            <p className="font-semibold text-slate-800 dark:text-slate-200 mt-0.5">
              {analysis.type}
            </p>
          </div>

          <div>
            <span className="text-[10px] uppercase font-semibold tracking-wider text-slate-400 dark:text-slate-500">
              Confidence
            </span>
            <p className="font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">
              {analysis.confidence}%
            </p>
          </div>

          <div>
            <span className="text-[10px] uppercase font-semibold tracking-wider text-slate-400 dark:text-slate-500">
              Imagery
            </span>
            <p className="font-medium text-slate-800 dark:text-slate-200 mt-0.5 truncate" title={analysis.sensor}>
              {analysis.sensor}
            </p>
          </div>

          <div>
            <span className="text-[10px] uppercase font-semibold tracking-wider text-slate-400 dark:text-slate-500">
              Resolution
            </span>
            <p className="font-medium text-slate-800 dark:text-slate-200 mt-0.5">
              {analysis.resolution}
            </p>
          </div>

          <div>
            <span className="text-[10px] uppercase font-semibold tracking-wider text-slate-400 dark:text-slate-500">
              Cloud Cover
            </span>
            <p className="font-medium text-slate-800 dark:text-slate-200 mt-0.5">
              {analysis.cloudCover}
            </p>
          </div>

          <div>
            <span className="text-[10px] uppercase font-semibold tracking-wider text-slate-400 dark:text-slate-500">
              Area Analyzed
            </span>
            <p className="font-medium text-slate-800 dark:text-slate-200 mt-0.5">
              {analysis.areaAnalyzed}
            </p>
          </div>
        </div>

        {/* Visual Evidence Section */}
        {analysis.visualEvidence && (
          <div className="space-y-2 rounded-xl border border-slate-200/80 bg-slate-50/50 p-3 dark:border-dark-border dark:bg-dark-sidebar/30">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Visual Evidence: {analysis.visualEvidence.title}
              </span>
              <span className="rounded bg-brand-50 px-1.5 py-0.5 text-[9px] font-semibold text-brand-600 dark:bg-brand-950 dark:text-brand-400">
                {analysis.visualEvidence.step3Metric}
              </span>
            </div>

            {/* Optical + SAR Specific Side-by-Side Presentation */}
            {isOpticalSar && analysis.opticalImage && analysis.sarImage ? (
              <div className="space-y-2 pt-1">
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1 text-center">
                    <div className="aspect-[4/3] w-full overflow-hidden rounded-lg bg-slate-900 border border-slate-200 dark:border-dark-border">
                      <img
                        src={analysis.opticalImage || "/satellite/water-optical.jpg"}
                        alt="Optical"
                        className="h-full w-full object-cover"
                        onError={(e) => {
                          e.currentTarget.src = "/satellite/water-optical.jpg";
                        }}
                      />
                    </div>
                    <span className="rounded bg-sky-500/10 px-2 py-0.5 text-[9px] font-mono font-bold text-sky-600 dark:text-sky-400">
                      OPTICAL (Cartosat-3)
                    </span>
                  </div>

                  <div className="space-y-1 text-center">
                    <div className="aspect-[4/3] w-full overflow-hidden rounded-lg bg-slate-900 border border-slate-200 dark:border-dark-border">
                      <img
                        src={analysis.sarImage || "/satellite/water-sar.jpg"}
                        alt="SAR"
                        className="h-full w-full object-cover"
                        onError={(e) => {
                          e.currentTarget.src = "/satellite/water-sar.jpg";
                        }}
                      />
                    </div>
                    <span className="rounded bg-slate-500/10 px-2 py-0.5 text-[9px] font-mono font-bold text-slate-600 dark:text-slate-300">
                      SAR (Sentinel-1 VV)
                    </span>
                  </div>
                </div>

                <div className="flex justify-center text-slate-400">
                  <ArrowDown className="h-4 w-4" />
                </div>

                <div className="space-y-1 text-center">
                  <div className="relative aspect-[16/9] w-full overflow-hidden rounded-lg bg-slate-900 border border-cyan-500/40">
                    <img
                      src={analysis.resultImage || "/satellite/water-result.jpg"}
                      alt="Combined Analysis"
                      className="h-full w-full object-cover"
                      onError={(e) => {
                        e.currentTarget.src = "/satellite/water-result.jpg";
                      }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent pointer-events-none" />
                    <span className="absolute bottom-1.5 left-2 rounded bg-cyan-950/80 px-2 py-0.5 text-[9px] font-mono font-bold text-cyan-300 border border-cyan-500/40">
                      COMBINED ANALYSIS (Water Mask)
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              /* Standard 3-Step Visual Pipeline */
              <div className="grid grid-cols-3 gap-2 items-center pt-1">
                <div className="space-y-1 text-center">
                  <div className="aspect-square w-full overflow-hidden rounded-lg bg-slate-900 border border-slate-200 dark:border-dark-border">
                    <img
                      src={analysis.visualEvidence?.step1Image || "/satellite/water-optical.jpg"}
                      alt={analysis.visualEvidence?.step1Label || "Step 1"}
                      className="h-full w-full object-cover"
                      onError={(e) => {
                        e.currentTarget.src = "/satellite/water-optical.jpg";
                      }}
                    />
                  </div>
                  <p className="text-[9px] font-medium text-slate-500 dark:text-slate-400 truncate">
                    {analysis.visualEvidence?.step1Label}
                  </p>
                </div>

                <div className="space-y-1 text-center">
                  <div className="aspect-square w-full overflow-hidden rounded-lg bg-slate-900 border border-slate-200 dark:border-dark-border">
                    <img
                      src={analysis.visualEvidence?.step2Image || "/satellite/water-optical.jpg"}
                      alt={analysis.visualEvidence?.step2Label || "Step 2"}
                      className="h-full w-full object-cover"
                      onError={(e) => {
                        e.currentTarget.src = "/satellite/water-optical.jpg";
                      }}
                    />
                  </div>
                  <p className="text-[9px] font-medium text-slate-500 dark:text-slate-400 truncate">
                    {analysis.visualEvidence?.step2Label}
                  </p>
                </div>

                <div className="space-y-1 text-center">
                  <div className="aspect-square w-full overflow-hidden rounded-lg bg-slate-900 border border-brand-500/40">
                    <img
                      src={analysis.visualEvidence?.step3Image || analysis.resultImage || "/satellite/water-result.jpg"}
                      alt={analysis.visualEvidence?.step3Label || "Result"}
                      className="h-full w-full object-cover"
                      onError={(e) => {
                        e.currentTarget.src = "/satellite/water-result.jpg";
                      }}
                    />
                  </div>
                  <p className="text-[9px] font-semibold text-brand-600 dark:text-brand-400 truncate">
                    {analysis.visualEvidence?.step3Label}
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* 4 Detail Tabs Navigation */}
        <div className="flex border-b border-slate-100 dark:border-dark-border gap-1">
          {[
            { id: "summary", label: "Summary" },
            { id: "findings", label: "Key Findings" },
            { id: "trace", label: "Execution Trace" },
            { id: "notes", label: "AI Notes" },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 pb-2 pt-1 text-center text-xs font-semibold transition-all border-b-2 ${
                activeTab === tab.id
                  ? "border-brand-500 text-brand-600 dark:text-brand-400"
                  : "border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content Panels */}
        <div className="space-y-3">
          {/* TAB 1: SUMMARY */}
          {activeTab === "summary" && (
            <div className="space-y-3 text-xs leading-relaxed text-slate-600 dark:text-slate-300 animate-fadeIn">
              <p className="rounded-xl border border-slate-100 bg-white p-3 dark:border-dark-border dark:bg-dark-sidebar/30">
                {analysis.summary}
              </p>

              {analysis.userQuery && (
                <div className="rounded-xl border border-brand-500/20 bg-brand-50/50 p-2.5 dark:bg-brand-950/20">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-brand-600 dark:text-brand-400">
                    Input Query
                  </span>
                  <p className="mt-0.5 text-[11px] text-slate-700 dark:text-slate-300 italic">
                    "{analysis.userQuery}"
                  </p>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: KEY FINDINGS */}
          {activeTab === "findings" && (
            <div className="space-y-2 text-xs animate-fadeIn">
              <ul className="space-y-2">
                {analysis.keyFindings?.map((finding, idx) => (
                  <li
                    key={idx}
                    className="flex items-start space-x-2.5 rounded-xl border border-slate-100 bg-slate-50/50 p-2.5 dark:border-dark-border dark:bg-dark-sidebar/30 text-slate-700 dark:text-slate-300"
                  >
                    <CheckCircle2 className="h-4 w-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                    <span className="leading-snug">{finding}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* TAB 3: EXECUTION TRACE */}
          {activeTab === "trace" && (
            <div className="space-y-2 text-xs animate-fadeIn">
              <div className="mb-2 flex items-center justify-between text-[11px] text-slate-400">
                <span>Agentic Orchestration Pipeline</span>
                <span className="font-mono text-emerald-500">Observable Trace</span>
              </div>

              <div className="relative pl-4 space-y-3 before:absolute before:left-1.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200 dark:before:bg-slate-800">
                {traceSteps.map((step) => (
                  <div key={step.step} className="relative group">
                    <div
                      className={`absolute -left-4 top-1 h-3 w-3 rounded-full border-2 ${
                        step.status === "completed"
                          ? "border-emerald-500 bg-emerald-500"
                          : step.status === "in-progress"
                          ? "border-amber-400 bg-amber-400 animate-pulse"
                          : "border-slate-600 bg-slate-800"
                      }`}
                    />

                    <div className="rounded-lg border border-slate-100 bg-slate-50/70 p-2.5 dark:border-dark-border dark:bg-dark-sidebar/40">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-800 dark:text-slate-200">
                          {step.step}. {step.name}
                        </span>
                        <span className="font-mono text-[10px] text-slate-400">
                          {step.timestamp}
                        </span>
                      </div>
                      <p className="mt-1 text-[11px] text-slate-600 dark:text-slate-300">
                        {step.detail}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 4: AI NOTES */}
          {activeTab === "notes" && (
            <div className="space-y-3 text-xs leading-relaxed text-slate-600 dark:text-slate-300 animate-fadeIn">
              <div className="rounded-xl border border-brand-500/20 bg-brand-950/20 p-3 text-slate-300">
                <div className="flex items-center space-x-2 text-brand-400 font-semibold mb-1">
                  <Sparkles className="h-3.5 w-3.5" />
                  <span>AI Grounding & Calibration</span>
                </div>
                <p className="text-[11px] text-slate-300 leading-normal">
                  {analysis.aiNotes}
                </p>
              </div>

              {analysis.sensors && (
                <div className="space-y-1.5 pt-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                    Active Sensor Constellations
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {analysis.sensors.map((sensor, i) => (
                      <span
                        key={i}
                        className="rounded-md border border-slate-200 bg-white px-2 py-0.5 text-[10px] font-medium text-slate-700 dark:border-dark-border dark:bg-dark-card dark:text-slate-300"
                      >
                        {sensor}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Action Buttons at Bottom */}
      <div className="space-y-2 border-t border-slate-100 p-4 dark:border-dark-border bg-slate-50/50 dark:bg-dark-sidebar/50">
        <button
          type="button"
          onClick={() => onViewReport(analysis)}
          className="flex w-full items-center justify-center space-x-2 rounded-xl bg-brand-600 py-2.5 text-xs font-semibold text-white shadow-lg shadow-brand-600/30 transition hover:bg-brand-700 active:scale-[0.99]"
        >
          <FileText className="h-4 w-4" />
          <span>View Full Report</span>
        </button>

        <button
          type="button"
          onClick={() => onOpenWorkspace(analysis)}
          className="flex w-full items-center justify-center space-x-2 rounded-xl border border-slate-200 bg-white py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 dark:border-dark-border dark:bg-dark-card dark:text-slate-200 dark:hover:bg-dark-hover"
        >
          <MapPin className="h-4 w-4 text-slate-400" />
          <span>Open in Geospatial Workspace</span>
        </button>

        <button
          type="button"
          onClick={() => onDelete(analysis)}
          className="flex w-full items-center justify-center space-x-1.5 py-1 text-xs font-medium text-red-500 transition hover:text-red-600 dark:text-red-400 dark:hover:text-red-300"
        >
          <Trash2 className="h-3.5 w-3.5" />
          <span>Delete Report</span>
        </button>
      </div>
    </div>
  );
}
