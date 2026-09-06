import React, { useState, useRef, useEffect } from "react";
import {
  MapPin,
  Calendar,
  MoreVertical,
  FileText,
  ExternalLink,
  Download,
  Bookmark,
  BookmarkCheck,
  Trash2,
  Layers,
} from "lucide-react";
import StatusBadge from "./StatusBadge";

export default function ReportCard({
  report,
  isSelected,
  onSelect,
  onViewReport,
  onOpenWorkspace,
  onDownloadReport,
  onToggleSave,
  onDelete,
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setMenuOpen(false);
      }
    };
    if (menuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [menuOpen]);

  const getBadgeStyle = (type, typeColor) => {
    switch (typeColor) {
      case "cyan":
        return "bg-cyan-500/10 text-cyan-600 border-cyan-500/30 dark:bg-cyan-500/20 dark:text-cyan-400";
      case "green":
        return "bg-emerald-500/10 text-emerald-600 border-emerald-500/30 dark:bg-emerald-500/20 dark:text-emerald-400";
      case "amber":
        return "bg-amber-500/10 text-amber-600 border-amber-500/30 dark:bg-amber-500/20 dark:text-amber-400";
      case "red":
        return "bg-rose-500/10 text-rose-600 border-rose-500/30 dark:bg-rose-500/20 dark:text-rose-400";
      case "purple":
      default:
        return "bg-purple-500/10 text-purple-600 border-purple-500/30 dark:bg-purple-500/20 dark:text-purple-400";
    }
  };

  const isChangeDetection = report.category === "CHANGE DETECTION" && report.beforeImage && report.afterImage;
  const isOpticalSar = report.category === "OPTICAL + SAR" && report.opticalImage && report.sarImage;

  return (
    <div
      onClick={() => onSelect(report)}
      className={`group relative flex cursor-pointer flex-col overflow-hidden rounded-2xl border transition-all duration-300 ${
        isSelected
          ? "border-brand-500 bg-white shadow-xl shadow-brand-500/15 ring-2 ring-brand-500 dark:border-brand-500 dark:bg-dark-card"
          : "border-slate-200/80 bg-white shadow-sm hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md dark:border-dark-border dark:bg-dark-card dark:hover:border-slate-700"
      }`}
    >
      {/* Large Satellite Image Section */}
      <div className="relative aspect-[16/10] w-full overflow-hidden bg-slate-900">
        {isOpticalSar ? (
          /* Optical + SAR Split View */
          <div className="flex h-full w-full">
            <div className="relative h-full w-1/2 overflow-hidden border-r border-slate-700">
              <img
                src={report.opticalImage || "/satellite/water-optical.jpg"}
                alt="Optical"
                className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                onError={(e) => {
                  e.currentTarget.src = "/satellite/water-optical.jpg";
                }}
              />
              <span className="absolute bottom-2 left-2 z-10 rounded bg-black/70 px-1.5 py-0.5 text-[8px] font-mono font-bold text-sky-400 backdrop-blur-sm">
                OPTICAL
              </span>
            </div>
            <div className="relative h-full w-1/2 overflow-hidden">
              <img
                src={report.sarImage || "/satellite/water-sar.jpg"}
                alt="SAR"
                className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                onError={(e) => {
                  e.currentTarget.src = "/satellite/water-sar.jpg";
                }}
              />
              <span className="absolute bottom-2 right-2 z-10 rounded bg-black/70 px-1.5 py-0.5 text-[8px] font-mono font-bold text-slate-300 backdrop-blur-sm">
                SAR
              </span>
            </div>
          </div>
        ) : isChangeDetection ? (
          /* Bi-Temporal Split View: T1 | T2 */
          <div className="flex h-full w-full">
            <div className="relative h-full w-1/2 overflow-hidden border-r border-slate-700">
              <img
                src={report.beforeImage || "/satellite/landcover-before.jpg"}
                alt="T1 Baseline"
                className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                onError={(e) => {
                  e.currentTarget.src = "/satellite/landcover-before.jpg";
                }}
              />
              <span className="absolute bottom-2 left-2 z-10 rounded bg-black/70 px-1.5 py-0.5 text-[8px] font-mono font-bold text-slate-300 backdrop-blur-sm">
                T1 SATELLITE
              </span>
            </div>
            <div className="relative h-full w-1/2 overflow-hidden">
              <img
                src={report.afterImage || "/satellite/landcover-after.jpg"}
                alt="T2 Later"
                className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                onError={(e) => {
                  e.currentTarget.src = "/satellite/landcover-after.jpg";
                }}
              />
              <span className="absolute bottom-2 right-2 z-10 rounded bg-black/70 px-1.5 py-0.5 text-[8px] font-mono font-bold text-amber-400 backdrop-blur-sm">
                T2 SATELLITE
              </span>
            </div>
          </div>
        ) : (
          /* Single Remote-Sensing Satellite Image */
          <img
            src={report.thumbnail || report.resultImage || report.originalImage || "/satellite/water-result.jpg"}
            alt={report.title}
            className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
            onError={(e) => {
              e.currentTarget.src = "/satellite/water-result.jpg";
            }}
          />
        )}

        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-black/30 pointer-events-none" />

        {/* Top Badges: Category Badge + Status & Three-Dot Menu */}
        <div className="absolute left-3 top-3 right-3 z-10 flex items-center justify-between">
          <span
            className={`inline-flex items-center rounded-md border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider backdrop-blur-md ${getBadgeStyle(
              report.type,
              report.typeColor
            )}`}
          >
            {report.type}
          </span>

          <div className="flex items-center space-x-1.5">
            <StatusBadge status={report.status} variant="pill" />

            {/* Three-Dot Menu */}
            <div className="relative" ref={menuRef} onClick={(e) => e.stopPropagation()}>
              <button
                type="button"
                onClick={() => setMenuOpen((prev) => !prev)}
                className="flex h-7 w-7 items-center justify-center rounded-lg bg-black/60 text-white backdrop-blur-md transition hover:bg-black/80"
                title="Report actions"
              >
                <MoreVertical className="h-3.5 w-3.5" />
              </button>

              {menuOpen && (
                <div className="absolute right-0 top-8 z-30 w-48 overflow-hidden rounded-xl border border-slate-200 bg-white py-1 shadow-2xl dark:border-dark-border dark:bg-dark-card animate-fadeIn">
                  <button
                    type="button"
                    onClick={() => {
                      setMenuOpen(false);
                      onViewReport(report);
                    }}
                    className="flex w-full items-center space-x-2 px-3 py-2 text-left text-xs font-medium text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-dark-hover"
                  >
                    <FileText className="h-3.5 w-3.5 text-brand-500" />
                    <span>View Full Report</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setMenuOpen(false);
                      onOpenWorkspace(report);
                    }}
                    className="flex w-full items-center space-x-2 px-3 py-2 text-left text-xs font-medium text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-dark-hover"
                  >
                    <ExternalLink className="h-3.5 w-3.5 text-slate-400" />
                    <span>Open in Workspace</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setMenuOpen(false);
                      onDownloadReport(report);
                    }}
                    className="flex w-full items-center space-x-2 px-3 py-2 text-left text-xs font-medium text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-dark-hover"
                  >
                    <Download className="h-3.5 w-3.5 text-slate-400" />
                    <span>Download PDF</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setMenuOpen(false);
                      onToggleSave(report);
                    }}
                    className="flex w-full items-center space-x-2 px-3 py-2 text-left text-xs font-medium text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-dark-hover"
                  >
                    {report.isSaved ? (
                      <>
                        <BookmarkCheck className="h-3.5 w-3.5 text-brand-500" />
                        <span>Remove Bookmark</span>
                      </>
                    ) : (
                      <>
                        <Bookmark className="h-3.5 w-3.5 text-slate-400" />
                        <span>Bookmark Report</span>
                      </>
                    )}
                  </button>

                  <div className="my-1 border-t border-slate-100 dark:border-dark-border" />

                  <button
                    type="button"
                    onClick={() => {
                      setMenuOpen(false);
                      onDelete(report);
                    }}
                    className="flex w-full items-center space-x-2 px-3 py-2 text-left text-xs font-medium text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/40"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    <span>Delete Report</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Bottom Sensor Overlay on Image */}
        <div className="absolute bottom-2.5 left-3 right-3 z-10 flex items-center justify-between text-[11px] font-medium text-slate-200">
          <div className="flex items-center space-x-1 truncate max-w-[70%]">
            <Layers className="h-3 w-3 text-brand-400 flex-shrink-0" />
            <span className="truncate text-[10px] text-slate-300">
              {report.sensor || report.imageryType}
            </span>
          </div>
          <span className="rounded bg-black/50 px-1.5 py-0.5 text-[9px] font-mono text-slate-300 backdrop-blur-sm">
            {report.resolution}
          </span>
        </div>
      </div>

      {/* Card Information */}
      <div className="flex flex-1 flex-col justify-between p-4">
        <div>
          <h4 className="text-sm font-bold text-slate-900 group-hover:text-brand-600 dark:text-white dark:group-hover:text-brand-400 transition-colors line-clamp-1">
            {report.title}
          </h4>

          <div className="mt-1.5 flex items-center space-x-1.5 text-xs text-slate-500 dark:text-slate-400">
            <MapPin className="h-3.5 w-3.5 text-slate-400 flex-shrink-0" />
            <span className="truncate font-medium">{report.location}</span>
          </div>

          <div className="mt-1 flex items-center space-x-1.5 text-[11px] text-slate-400 dark:text-slate-500">
            <Calendar className="h-3 w-3 flex-shrink-0" />
            <span>{report.datetimeStr}</span>
          </div>
        </div>

        <div className="mt-3.5 flex items-center justify-between border-t border-slate-100 pt-2.5 dark:border-dark-border">
          <div className="flex items-center space-x-1.5">
            <span className="text-[10px] uppercase font-semibold text-slate-400 dark:text-slate-500">
              Confidence
            </span>
            <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
              {report.confidence}%
            </span>
          </div>

          <div className="flex items-center space-x-2">
            {report.isSaved && (
              <span title="Bookmarked">
                <BookmarkCheck className="h-3.5 w-3.5 text-brand-500" />
              </span>
            )}
            <span className="text-[11px] font-medium text-brand-600 dark:text-brand-400 group-hover:underline">
              Details →
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
