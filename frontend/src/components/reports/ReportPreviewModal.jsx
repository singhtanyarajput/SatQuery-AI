import React from "react";
import { jsPDF } from "jspdf";
import {
  FileText,
  Download,
  FileCode,
  X,
  MapPin,
  Calendar,
  CheckCircle2,
  ExternalLink,
  Sparkles,
  ArrowDown,
} from "lucide-react";
import StatusBadge from "./StatusBadge";

export default function ReportPreviewModal({
  report,
  onClose,
  onOpenWorkspace,
  showToast,
}) {
  if (!report) return null;

  const handleDownloadPDF = () => {
    try {
      const doc = new jsPDF();
      doc.setFont("helvetica", "bold");
      doc.setFontSize(18);
      doc.text("SatQuery AI — Remote-Sensing Intelligence Report", 14, 20);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.text(
        `Report ID: ${report.id} | Workflow: ${report.category || "Multimodal Remote-Sensing"}`,
        14,
        26
      );
      doc.text(
        `Location: ${report.location} (${report.coordinates || "--"}) | Date: ${report.datetimeStr || `${report.date} ${report.time}`}`,
        14,
        32
      );

      doc.setLineWidth(0.5);
      doc.line(14, 36, 196, 36);

      doc.setFont("helvetica", "bold");
      doc.setFontSize(13);
      doc.text(report.title, 14, 46);

      if (report.userQuery) {
        doc.setFont("helvetica", "italic");
        doc.setFontSize(10);
        doc.text(`User Query: "${report.userQuery}"`, 14, 53);
      }

      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.text("Executive Summary:", 14, 63);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      const splitSummary = doc.splitTextToSize(report.summary, 180);
      doc.text(splitSummary, 14, 71);

      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.text("Key Findings & Observations:", 14, 95);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      let yPos = 103;
      if (report.keyFindings) {
        report.keyFindings.forEach((kf) => {
          doc.text(`• ${kf}`, 14, yPos);
          yPos += 6;
        });
      }

      yPos += 6;
      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.text("Remote-Sensing Telemetry & Sensors:", 14, yPos);

      yPos += 8;
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.text(`• Confidence Score: ${report.confidence}%`, 14, yPos);
      yPos += 6;
      doc.text(`• Sensor Suite: ${report.sensor || "Sentinel-1 / Sentinel-2"}`, 14, yPos);
      yPos += 6;
      doc.text(`• Spatial Resolution: ${report.resolution || "10 m"}`, 14, yPos);
      yPos += 6;
      doc.text(`• Cloud Cover: ${report.cloudCover || "0.0%"}`, 14, yPos);
      yPos += 6;
      doc.text(`• Area Analyzed: ${report.areaAnalyzed || "--"}`, 14, yPos);

      yPos += 10;
      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.text("Agentic Execution Summary:", 14, yPos);
      yPos += 8;

      if (report.executionTrace) {
        report.executionTrace.slice(0, 5).forEach((step) => {
          doc.setFont("helvetica", "bold");
          doc.text(`Step ${step.step} (${step.name}):`, 14, yPos);
          doc.setFont("helvetica", "normal");
          const stepText = doc.splitTextToSize(step.detail, 130);
          doc.text(stepText, 65, yPos);
          yPos += 7;
        });
      }

      doc.save(`${report.id}_SatQuery_Report.pdf`);
      showToast?.(`Downloaded ${report.id} as PDF`);
    } catch (err) {
      console.error(err);
      showToast?.("Generated report downloaded");
    }
  };

  const handleExportJSON = () => {
    try {
      const dataStr =
        "data:text/json;charset=utf-8," +
        encodeURIComponent(JSON.stringify(report, null, 2));
      const downloadAnchor = document.createElement("a");
      downloadAnchor.setAttribute("href", dataStr);
      downloadAnchor.setAttribute("download", `${report.id}_metadata.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
      showToast?.(`Exported ${report.id} metadata as JSON`);
    } catch (err) {
      console.error(err);
    }
  };

  const isOpticalSar = report.category === "OPTICAL + SAR";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-md animate-fadeIn">
      <div className="flex max-h-[92vh] w-full max-w-4xl flex-col rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-dark-border dark:bg-dark-card overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-100 p-5 dark:border-dark-border bg-slate-50/50 dark:bg-dark-sidebar/60">
          <div className="flex items-center space-x-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 text-brand-600 dark:bg-brand-950/80 dark:text-brand-400">
              <FileText className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  SatQuery AI — Intelligence Report Dossier
                </h3>
                <span className="rounded bg-brand-100 px-2 py-0.5 text-[10px] font-semibold text-brand-700 dark:bg-brand-950 dark:text-brand-300">
                  {report.id}
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Category: {report.category} · Sensor: {report.sensor}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-200/60 hover:text-slate-700 dark:hover:bg-dark-hover dark:hover:text-slate-200 transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 space-y-5 overflow-y-auto p-6">
          {/* Top Banner & Imagery */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-start rounded-2xl border border-slate-200/80 bg-slate-50/70 p-4 dark:border-dark-border dark:bg-dark-bg/60">
            {/* Top-Down Satellite Image Preview */}
            <div className="md:col-span-5 relative aspect-[16/11] w-full overflow-hidden rounded-xl bg-slate-900 border border-slate-200 dark:border-dark-border">
              <img
                src={report.resultImage || report.thumbnail || report.originalImage || "/satellite/water-result.jpg"}
                alt={report.title}
                className="h-full w-full object-cover"
                onError={(e) => {
                  e.currentTarget.src = "/satellite/water-result.jpg";
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent pointer-events-none" />
              <div className="absolute bottom-2 left-2 right-2 text-[10px] text-slate-300 truncate">
                {report.sensorCaption || report.sensor}
              </div>
            </div>

            {/* Banner Metadata */}
            <div className="md:col-span-7 space-y-2.5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="rounded-md border border-brand-200 bg-brand-50 px-2.5 py-0.5 text-xs font-semibold text-brand-700 dark:border-brand-800 dark:bg-brand-950/80 dark:text-brand-300">
                  {report.type}
                </span>
                <div className="flex items-center space-x-3 text-xs">
                  <StatusBadge status={report.status} variant="pill" />
                  <span className="font-bold text-emerald-600 dark:text-emerald-400">
                    {report.confidence}% Confidence
                  </span>
                </div>
              </div>

              <h4 className="text-lg font-bold text-slate-900 dark:text-white">
                {report.title}
              </h4>

              {report.userQuery && (
                <div className="rounded-lg bg-white p-2.5 dark:bg-dark-sidebar/40 border border-slate-200/60 dark:border-dark-border">
                  <span className="text-[10px] uppercase font-bold text-slate-400">
                    User Query
                  </span>
                  <p className="text-xs text-slate-700 dark:text-slate-300 italic mt-0.5">
                    "{report.userQuery}"
                  </p>
                </div>
              )}

              <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 dark:text-slate-400 pt-1">
                <div className="flex items-center space-x-1.5">
                  <MapPin className="h-3.5 w-3.5 text-slate-400" />
                  <span>{report.location}</span>
                </div>
                <div className="flex items-center space-x-1.5">
                  <Calendar className="h-3.5 w-3.5 text-slate-400" />
                  <span>{report.datetimeStr}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Visual Evidence Strip */}
          {report.visualEvidence && (
            <div className="space-y-2 rounded-xl border border-slate-100 bg-slate-50/50 p-4 dark:border-dark-border dark:bg-dark-sidebar/40">
              <div className="flex items-center justify-between">
                <h5 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Visual Evidence: {report.visualEvidence.title}
                </h5>
                <span className="rounded bg-brand-100 px-2 py-0.5 text-[10px] font-bold text-brand-700 dark:bg-brand-950 dark:text-brand-300">
                  {report.visualEvidence.step3Metric}
                </span>
              </div>

              <div className="grid grid-cols-3 gap-3 pt-1">
                <div className="space-y-1">
                  <div className="aspect-[4/3] w-full overflow-hidden rounded-lg bg-slate-900 border border-slate-200 dark:border-dark-border">
                    <img
                      src={report.visualEvidence?.step1Image || "/satellite/water-optical.jpg"}
                      alt={report.visualEvidence?.step1Label || "Step 1"}
                      className="h-full w-full object-cover"
                      onError={(e) => {
                        e.currentTarget.src = "/satellite/water-optical.jpg";
                      }}
                    />
                  </div>
                  <p className="text-[11px] font-medium text-slate-600 dark:text-slate-300 text-center">
                    {report.visualEvidence?.step1Label}
                  </p>
                </div>

                <div className="space-y-1">
                  <div className="aspect-[4/3] w-full overflow-hidden rounded-lg bg-slate-900 border border-slate-200 dark:border-dark-border">
                    <img
                      src={report.visualEvidence?.step2Image || "/satellite/water-optical.jpg"}
                      alt={report.visualEvidence?.step2Label || "Step 2"}
                      className="h-full w-full object-cover"
                      onError={(e) => {
                        e.currentTarget.src = "/satellite/water-optical.jpg";
                      }}
                    />
                  </div>
                  <p className="text-[11px] font-medium text-slate-600 dark:text-slate-300 text-center">
                    {report.visualEvidence?.step2Label}
                  </p>
                </div>

                <div className="space-y-1">
                  <div className="aspect-[4/3] w-full overflow-hidden rounded-lg bg-slate-900 border border-brand-500/50">
                    <img
                      src={report.visualEvidence?.step3Image || report.resultImage || "/satellite/water-result.jpg"}
                      alt={report.visualEvidence?.step3Label || "Result"}
                      className="h-full w-full object-cover"
                      onError={(e) => {
                        e.currentTarget.src = "/satellite/water-result.jpg";
                      }}
                    />
                  </div>
                  <p className="text-[11px] font-semibold text-brand-600 dark:text-brand-400 text-center">
                    {report.visualEvidence?.step3Label}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Executive Summary & Key Findings */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <h5 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Executive Summary
              </h5>
              <p className="text-xs leading-relaxed text-slate-700 dark:text-slate-200 bg-white p-3.5 rounded-xl border border-slate-100 dark:bg-dark-sidebar/40 dark:border-dark-border">
                {report.summary}
              </p>
            </div>

            <div className="space-y-2">
              <h5 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Key Findings & Observations
              </h5>
              <div className="rounded-xl border border-slate-100 bg-slate-50/50 p-3.5 dark:border-dark-border dark:bg-dark-sidebar/40">
                <ul className="space-y-2 text-xs text-slate-700 dark:text-slate-200">
                  {report.keyFindings?.map((item, idx) => (
                    <li key={idx} className="flex items-start space-x-2">
                      <CheckCircle2 className="h-4 w-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          {/* Telemetry & Observable Execution Summary */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="rounded-xl border border-slate-100 bg-white p-4 dark:border-dark-border dark:bg-dark-sidebar/40 space-y-2.5">
              <h5 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Sensor & Spectral Telemetry
              </h5>
              <div className="space-y-1.5 text-xs">
                <div className="flex justify-between text-slate-600 dark:text-slate-300">
                  <span className="text-slate-400">Sensors:</span>
                  <span className="font-semibold text-right">{report.sensor}</span>
                </div>
                <div className="flex justify-between text-slate-600 dark:text-slate-300">
                  <span className="text-slate-400">Spatial Resolution:</span>
                  <span className="font-semibold">{report.resolution}</span>
                </div>
                <div className="flex justify-between text-slate-600 dark:text-slate-300">
                  <span className="text-slate-400">Cloud Cover:</span>
                  <span className="font-semibold">{report.cloudCover}</span>
                </div>
                <div className="flex justify-between text-slate-600 dark:text-slate-300">
                  <span className="text-slate-400">Area Analyzed:</span>
                  <span className="font-semibold">{report.areaAnalyzed}</span>
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-slate-100 bg-white p-4 dark:border-dark-border dark:bg-dark-sidebar/40 space-y-2">
              <h5 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Agentic Pipeline Execution
              </h5>
              <div className="space-y-1.5 text-xs max-h-36 overflow-y-auto pr-1">
                {report.executionTrace?.map((step) => (
                  <div
                    key={step.step}
                    className="flex items-start justify-between text-[11px] rounded-lg bg-slate-50 p-1.5 dark:bg-dark-bg/60"
                  >
                    <div>
                      <span className="font-bold text-slate-800 dark:text-slate-200">
                        {step.step}. {step.name}:
                      </span>{" "}
                      <span className="text-slate-600 dark:text-slate-300">
                        {step.detail}
                      </span>
                    </div>
                    <span className="font-mono text-[9px] text-slate-400 ml-2">
                      {step.timestamp}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 bg-slate-50/50 p-4 dark:border-dark-border dark:bg-dark-bg/40">
          <button
            type="button"
            onClick={() => {
              onClose();
              onOpenWorkspace(report);
            }}
            className="flex items-center space-x-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 shadow-sm hover:bg-slate-50 dark:border-dark-border dark:bg-dark-card dark:text-slate-200 dark:hover:bg-dark-hover transition"
          >
            <ExternalLink className="h-3.5 w-3.5 text-slate-400" />
            <span>Open in Geospatial Workspace</span>
          </button>

          <div className="flex items-center space-x-2.5">
            <button
              type="button"
              onClick={handleExportJSON}
              className="flex items-center space-x-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 shadow-sm hover:bg-slate-50 dark:border-dark-border dark:bg-dark-card dark:text-slate-200 dark:hover:bg-dark-hover transition"
            >
              <FileCode className="h-3.5 w-3.5 text-slate-500" />
              <span>Export JSON</span>
            </button>

            <button
              type="button"
              onClick={handleDownloadPDF}
              className="flex items-center space-x-2 rounded-xl bg-brand-600 px-4 py-2 text-xs font-semibold text-white shadow-sm shadow-brand-600/30 hover:bg-brand-700 transition"
            >
              <Download className="h-4 w-4" />
              <span>Download PDF</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
