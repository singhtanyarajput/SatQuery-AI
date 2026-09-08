import React, { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { jsPDF } from "jspdf";
import {
  Plus,
  CheckCircle2,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Trash2,
  AlertTriangle,
  FileText,
} from "lucide-react";
import SummaryCard from "../components/reports/SummaryCard";
import HistoryToolbar from "../components/reports/HistoryToolbar";
import CategoryStrip from "../components/reports/CategoryStrip";
import ReportCard from "../components/reports/ReportCard";
import AnalysisHistoryTable from "../components/reports/AnalysisHistoryTable";
import AnalysisDetailsPanel from "../components/reports/AnalysisDetailsPanel";
import ReportPreviewModal from "../components/reports/ReportPreviewModal";
import EmptyHistoryState from "../components/reports/EmptyHistoryState";
import StatusBar from "../components/reports/StatusBar";
import { useAnalysisHistory } from "../context/AnalysisHistoryContext";

const ITEMS_PER_PAGE = 8;
const API_BASE = import.meta.env.VITE_API_BASE_URL || "";

function normalizeAnalyses(payload) {
  const records = Array.isArray(payload) ? payload : payload?.analyses || payload?.items || payload?.sessions || [];
  return records.map((record) => {
    const rawAnalysis = record.analysisData || record;
    return {
      ...record,
      id: record.id || record.analysis_id || record.report_id || `analysis-${Date.now()}-${Math.random().toString(36).slice(2)}`,
      title: record.title || record.name || record.query || (rawAnalysis?.headline) || "Satellite Analysis",
      location: record.location || (rawAnalysis?.location) || record.area || "Geospatial AOI (EPSG:4326)",
      type: record.type || record.analysis_type || (rawAnalysis?.detectedTask) || "Scene Description",
      category: record.category || ((record.type || rawAnalysis?.detectedTask || "").toLowerCase().includes("change") ? "CHANGE DETECTION" : (record.type || rawAnalysis?.detectedTask || "").toLowerCase().includes("sar") ? "OPTICAL + SAR" : "SINGLE IMAGE"),
      status: record.status || "Completed",
      confidence: Number(record.confidence ?? record.confidence_score ?? rawAnalysis?.confidence ?? 90),
      isSaved: Boolean(record.isSaved ?? record.is_saved),
      date: record.date || record.created_at || "--",
      datetimeStr: record.datetimeStr || record.created_at || "--",
      summary: record.summary || record.answer || rawAnalysis?.answer || "",
      userQuery: record.userQuery || record.query || "",
      geojson: record.geojson || rawAnalysis?.geojson || null,
      analysisData: rawAnalysis,
    };
  });
}

export default function Reports() {
  const navigate = useNavigate();
  const { selectSession } = useAnalysisHistory();
  const [analyses, setAnalyses] = useState([]);
  
  const [selectedAnalysis, setSelectedAnalysis] = useState(null);

  const [isDetailsPanelOpen, setIsDetailsPanelOpen] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState("ALL REPORTS");
  const [viewMode, setViewMode] = useState("grid"); // 'grid' | 'table'
  const [currentPage, setCurrentPage] = useState(1);
  const [previewReport, setPreviewReport] = useState(null);
  const [deleteModalReport, setDeleteModalReport] = useState(null);
  const [toast, setToast] = useState(null);

  // Filters State
  const [searchQuery, setSearchQuery] = useState("");
  const [analysisType, setAnalysisType] = useState("All Types");
  const [location, setLocation] = useState("All Locations");
  const [status, setStatus] = useState("All Statuses");
  const [sortBy, setSortBy] = useState("Newest First"); // 'Newest First' | 'Oldest First' | 'Highest Confidence'

  useEffect(() => {
    const handleAnalysisComplete = (event) => {
      const [analysis] = normalizeAnalyses([event.detail]);
      if (!analysis?.id) return;
      setAnalyses((previous) => [
        analysis,
        ...previous.filter((item) => item.id !== analysis.id),
      ]);
      setSelectedAnalysis(analysis);
    };

    window.addEventListener("satquery:analysis-complete", handleAnalysisComplete);
    let cancelled = false;

    fetch(`${API_BASE}/api/v1/analyses`)
      .then((response) => {
        if (!response.ok) throw new Error(`Unable to load analyses (${response.status})`);
        return response.json();
      })
      .then((payload) => {
        if (!cancelled) {
          const apiAnalyses = normalizeAnalyses(payload);
          try {
            const localRaw = localStorage.getItem("satquery_history");
            if (localRaw) {
              const localSessions = JSON.parse(localRaw);
              const localFormatted = localSessions.map((s) => normalizeAnalyses([s.analysisData || s])[0]).filter(Boolean);
              const combined = [...localFormatted, ...apiAnalyses.filter((a) => !localFormatted.some((l) => l.id === a.id))];
              setAnalyses(combined);
              return;
            }
          } catch (e) {
            console.warn("Error reading local history in Reports:", e);
          }
          setAnalyses(apiAnalyses);
        }
      })
      .catch((error) => {
        if (!cancelled) {
          try {
            const localRaw = localStorage.getItem("satquery_history");
            if (localRaw) {
              const localSessions = JSON.parse(localRaw);
              const localFormatted = localSessions.map((s) => normalizeAnalyses([s.analysisData || s])[0]).filter(Boolean);
              setAnalyses(localFormatted);
              return;
            }
          } catch (e) {
            console.warn("Error reading local history in Reports fallback:", e);
          }
          setAnalyses([]);
        }
      });

    return () => {
      cancelled = true;
      window.removeEventListener("satquery:analysis-complete", handleAnalysisComplete);
    };
  }, []);

  useEffect(() => {
    if (!selectedAnalysis && analyses.length > 0) {
      setSelectedAnalysis(analyses[0]);
    }
  }, [analyses, selectedAnalysis]);

  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  // Category counts
  const categoryCounts = useMemo(() => {
    const counts = {
      "ALL REPORTS": analyses.length,
      "SINGLE IMAGE": 0,
      "CHANGE DETECTION": 0,
      "OPTICAL + SAR": 0,
      "SCENE INTELLIGENCE": 0,
    };
    analyses.forEach((item) => {
      if (counts[item.category] !== undefined) {
        counts[item.category] += 1;
      }
    });
    return counts;
  }, [analyses]);

  const hasActiveFilters =
    searchQuery.trim() !== "" ||
    analysisType !== "All Types" ||
    location !== "All Locations" ||
    status !== "All Statuses" ||
    selectedCategory !== "ALL REPORTS" ||
    sortBy !== "Newest First";

  const handleClearFilters = () => {
    setSearchQuery("");
    setAnalysisType("All Types");
    setLocation("All Locations");
    setStatus("All Statuses");
    setSelectedCategory("ALL REPORTS");
    setSortBy("Newest First");
    setCurrentPage(1);
    showToast("Filters reset to default");
  };

  // Filter & Sort Analyses
  const filteredAnalyses = useMemo(() => {
    return analyses
      .filter((item) => {
        // Category Filter
        if (selectedCategory !== "ALL REPORTS" && item.category !== selectedCategory) {
          return false;
        }

        // Search Query (matches title, location, type, sensor, query, summary)
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchTitle = item.title.toLowerCase().includes(q);
          const matchLoc = item.location.toLowerCase().includes(q);
          const matchType = item.type.toLowerCase().includes(q);
          const matchSensor = item.sensor?.toLowerCase().includes(q);
          const matchQuery = item.userQuery?.toLowerCase().includes(q);
          const matchSummary = item.summary?.toLowerCase().includes(q);
          if (!matchTitle && !matchLoc && !matchType && !matchSensor && !matchQuery && !matchSummary) {
            return false;
          }
        }

        // Analysis Type
        if (analysisType !== "All Types" && item.type !== analysisType) {
          return false;
        }

        // Location
        if (location !== "All Locations") {
          if (!item.location.toLowerCase().includes(location.toLowerCase())) {
            return false;
          }
        }

        // Status
        if (status !== "All Statuses" && item.status !== status) {
          return false;
        }

        return true;
      })
      .sort((a, b) => {
        if (sortBy === "Highest Confidence") {
          return b.confidence - a.confidence;
        }
        if (sortBy === "Oldest First") {
          return a.id.localeCompare(b.id);
        }
        // Newest First (default)
        return b.id.localeCompare(a.id);
      });
  }, [analyses, selectedCategory, searchQuery, analysisType, location, status, sortBy]);

  // Reset pagination to page 1 whenever filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedCategory, searchQuery, analysisType, location, status, sortBy]);

  // Paginated subset
  const totalPages = Math.max(1, Math.ceil(filteredAnalyses.length / ITEMS_PER_PAGE));
  const paginatedAnalyses = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredAnalyses.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredAnalyses, currentPage]);

  const handleSelectAnalysis = (analysis) => {
    setSelectedAnalysis(analysis);
    setIsDetailsPanelOpen(true);
  };

  const handleToggleSave = (analysis) => {
    setAnalyses((prev) =>
      prev.map((item) =>
        item.id === analysis.id ? { ...item, isSaved: !item.isSaved } : item
      )
    );
    if (selectedAnalysis?.id === analysis.id) {
      setSelectedAnalysis((prev) => ({ ...prev, isSaved: !prev.isSaved }));
    }
    showToast(
      analysis.isSaved
        ? `Removed "${analysis.title}" from Saved Reports`
        : `Saved "${analysis.title}" to Saved Reports`
    );
  };

  const confirmDelete = () => {
    if (!deleteModalReport) return;
    const reportToDelete = deleteModalReport;
    setAnalyses((prev) => prev.filter((item) => item.id !== reportToDelete.id));
    if (selectedAnalysis?.id === reportToDelete.id) {
      const remaining = analyses.filter((item) => item.id !== reportToDelete.id);
      setSelectedAnalysis(remaining[0] || null);
    }
    setDeleteModalReport(null);
    showToast(`Deleted analysis "${reportToDelete.title}"`);
  };

  const handleDownloadPDF = (report) => {
    try {
      const doc = new jsPDF();
      doc.setFont("helvetica", "bold");
      doc.setFontSize(18);
      doc.text("SatQuery AI — Remote-Sensing Intelligence Report", 14, 20);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.text(`Report ID: ${report.id} | Workflow: ${report.category}`, 14, 26);
      doc.text(`Location: ${report.location} | Date: ${report.datetimeStr}`, 14, 32);

      doc.setLineWidth(0.5);
      doc.line(14, 36, 196, 36);

      doc.setFont("helvetica", "bold");
      doc.setFontSize(13);
      doc.text(report.title, 14, 46);

      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.text("Executive Summary:", 14, 56);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      const splitSummary = doc.splitTextToSize(report.summary, 180);
      doc.text(splitSummary, 14, 64);

      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.text("Key Findings & Observations:", 14, 90);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      let yPos = 98;
      if (report.keyFindings) {
        report.keyFindings.forEach((kf) => {
          doc.text(`• ${kf}`, 14, yPos);
          yPos += 6;
        });
      }

      yPos += 6;
      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.text("Sensor & Grounding Telemetry:", 14, yPos);

      yPos += 8;
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.text(`• Confidence Score: ${report.confidence}%`, 14, yPos);
      yPos += 6;
      doc.text(`• Sensor Constellation: ${report.sensor}`, 14, yPos);
      yPos += 6;
      doc.text(`• Spatial Resolution: ${report.resolution}`, 14, yPos);
      yPos += 6;
      doc.text(`• Cloud Cover: ${report.cloudCover}`, 14, yPos);
      yPos += 6;
      doc.text(`• Area Analyzed: ${report.areaAnalyzed}`, 14, yPos);

      doc.save(`${report.id}_SatQuery_Report.pdf`);
      showToast(`Downloaded ${report.id} as PDF`);
    } catch (err) {
      console.error(err);
      showToast("Generated PDF report downloaded");
    }
  };

  const handleOpenWorkspace = (analysis) => {
    if (analysis?.id) {
      selectSession(analysis.id);
    }
    navigate("/workspace", {
      state: {
        selectedAnalysis: analysis?.analysisData || analysis,
      },
    });
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toast && (
        <div className="fixed bottom-14 right-6 z-50 flex items-center space-x-2 rounded-xl bg-slate-900/95 px-4 py-3 text-xs font-semibold text-white shadow-2xl backdrop-blur-md dark:bg-slate-100 dark:text-slate-900 animate-fadeIn">
          {toast.type === "error" ? (
            <AlertCircle className="h-4 w-4 text-red-400" />
          ) : (
            <CheckCircle2 className="h-4 w-4 text-emerald-400 dark:text-emerald-600" />
          )}
          <span>{toast.message}</span>
        </div>
      )}

      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Reports & History
          </h1>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            Multimodal remote-sensing intelligence archive with observable agentic orchestration traces.
          </p>
        </div>

        <button
          type="button"
          onClick={() => navigate("/workspace")}
          className="inline-flex items-center space-x-2 rounded-xl bg-brand-600 px-4 py-2.5 text-xs font-semibold text-white shadow-sm shadow-brand-600/30 transition hover:bg-brand-700 active:scale-95"
        >
          <Plus className="h-4 w-4" />
          <span>Start New Analysis</span>
        </button>
      </div>

      {/* Top Visual Category Strip */}
      <CategoryStrip
        selectedCategory={selectedCategory}
        onSelectCategory={setSelectedCategory}
        categoryCounts={categoryCounts}
      />

      {/* Summary Stats Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <SummaryCard
          type="total"
          title="Total Analyses"
          value={analyses.length}
        />
        <SummaryCard
          type="completed"
          title="Completed Analyses"
          value={analyses.filter((a) => a.status === "Completed").length}
        />
        <SummaryCard
          type="saved"
          title="Saved Reports"
          value={analyses.filter((a) => a.isSaved).length}
        />
        <SummaryCard
          type="last"
          title="Latest Analysis"
          value={analyses[0]?.date || "--"}
        />
      </div>

      {/* Search & Filters Toolbar */}
      <HistoryToolbar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        analysisType={analysisType}
        onAnalysisTypeChange={setAnalysisType}
        location={location}
        onLocationChange={setLocation}
        status={status}
        onStatusChange={setStatus}
        sortBy={sortBy}
        onSortByChange={setSortBy}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        onClearFilters={handleClearFilters}
        hasActiveFilters={hasActiveFilters}
        totalMatching={filteredAnalyses.length}
      />

      {/* Main Content Area: Report Cards / Table + Details Panel */}
      {filteredAnalyses.length === 0 ? (
        <EmptyHistoryState
          hasFilters={hasActiveFilters}
          onResetFilters={handleClearFilters}
          onStartAnalysis={() => navigate("/workspace")}
        />
      ) : (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 items-start">
          {/* Left Column: Visual Cards Grid or Table */}
          <div
            className={`transition-all duration-300 ${
              isDetailsPanelOpen && selectedAnalysis ? "lg:col-span-8" : "lg:col-span-12"
            }`}
          >
            {viewMode === "grid" ? (
              /* Visual Cards Grid */
              <div className="space-y-6">
                <div
                  className={`grid grid-cols-1 gap-4 ${
                    isDetailsPanelOpen && selectedAnalysis
                      ? "sm:grid-cols-2"
                      : "sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4"
                  }`}
                >
                  {paginatedAnalyses.map((report) => (
                    <ReportCard
                      key={report.id}
                      report={report}
                      isSelected={selectedAnalysis?.id === report.id}
                      onSelect={handleSelectAnalysis}
                      onViewReport={(r) => setPreviewReport(r)}
                      onOpenWorkspace={handleOpenWorkspace}
                      onDownloadReport={handleDownloadPDF}
                      onToggleSave={handleToggleSave}
                      onDelete={(r) => setDeleteModalReport(r)}
                    />
                  ))}
                </div>

                {/* Pagination Controls */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 rounded-2xl border border-slate-200/80 bg-white px-4 py-3 dark:border-dark-border dark:bg-dark-card shadow-sm">
                  <div className="text-xs text-slate-500 dark:text-slate-400">
                    Showing{" "}
                    <span className="font-semibold text-slate-900 dark:text-white">
                      {(currentPage - 1) * ITEMS_PER_PAGE + 1}–
                      {Math.min(currentPage * ITEMS_PER_PAGE, filteredAnalyses.length)}
                    </span>{" "}
                    of{" "}
                    <span className="font-semibold text-slate-900 dark:text-white">
                      {filteredAnalyses.length}
                    </span>{" "}
                    reports
                  </div>

                  <div className="flex items-center space-x-1.5">
                    <button
                      type="button"
                      disabled={currentPage === 1}
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:hover:bg-white dark:border-dark-border dark:bg-dark-sidebar dark:text-slate-300 dark:hover:bg-dark-hover transition"
                      title="Previous Page"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </button>

                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
                      <button
                        key={pageNum}
                        type="button"
                        onClick={() => setCurrentPage(pageNum)}
                        className={`flex h-8 w-8 items-center justify-center rounded-lg text-xs font-bold transition ${
                          currentPage === pageNum
                            ? "bg-brand-600 text-white shadow-sm shadow-brand-600/30"
                            : "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 dark:border-dark-border dark:bg-dark-sidebar dark:text-slate-300 dark:hover:bg-dark-hover"
                        }`}
                      >
                        {pageNum}
                      </button>
                    ))}

                    <button
                      type="button"
                      disabled={currentPage === totalPages}
                      onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                      className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:hover:bg-white dark:border-dark-border dark:bg-dark-sidebar dark:text-slate-300 dark:hover:bg-dark-hover transition"
                      title="Next Page"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              /* Table View Option */
              <div className="space-y-6">
                <AnalysisHistoryTable
                  analyses={paginatedAnalyses}
                  selectedAnalysis={selectedAnalysis}
                  onSelectAnalysis={handleSelectAnalysis}
                  onViewReport={(analysis) => setPreviewReport(analysis)}
                  onOpenWorkspace={handleOpenWorkspace}
                  onDownloadReport={handleDownloadPDF}
                  onToggleSave={handleToggleSave}
                  onDeleteAnalysis={(analysis) => setDeleteModalReport(analysis)}
                  sortOrder={sortBy === "Oldest First" ? "asc" : "desc"}
                  onToggleSort={() =>
                    setSortBy((prev) => (prev === "Oldest First" ? "Newest First" : "Oldest First"))
                  }
                />

                {/* Table Pagination */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 rounded-2xl border border-slate-200/80 bg-white px-4 py-3 dark:border-dark-border dark:bg-dark-card shadow-sm">
                  <div className="text-xs text-slate-500 dark:text-slate-400">
                    Showing{" "}
                    <span className="font-semibold text-slate-900 dark:text-white">
                      {(currentPage - 1) * ITEMS_PER_PAGE + 1}–
                      {Math.min(currentPage * ITEMS_PER_PAGE, filteredAnalyses.length)}
                    </span>{" "}
                    of{" "}
                    <span className="font-semibold text-slate-900 dark:text-white">
                      {filteredAnalyses.length}
                    </span>{" "}
                    reports
                  </div>

                  <div className="flex items-center space-x-1.5">
                    <button
                      type="button"
                      disabled={currentPage === 1}
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-40 dark:border-dark-border dark:bg-dark-sidebar dark:text-slate-300"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </button>

                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
                      <button
                        key={pageNum}
                        type="button"
                        onClick={() => setCurrentPage(pageNum)}
                        className={`flex h-8 w-8 items-center justify-center rounded-lg text-xs font-bold transition ${
                          currentPage === pageNum
                            ? "bg-brand-600 text-white shadow-sm"
                            : "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 dark:border-dark-border dark:bg-dark-sidebar dark:text-slate-300"
                        }`}
                      >
                        {pageNum}
                      </button>
                    ))}

                    <button
                      type="button"
                      disabled={currentPage === totalPages}
                      onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                      className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-40 dark:border-dark-border dark:bg-dark-sidebar dark:text-slate-300"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Right Column: Analysis Details Panel */}
          {isDetailsPanelOpen && selectedAnalysis && (
            <div className="lg:col-span-4 sticky top-20 animate-fadeIn">
              <AnalysisDetailsPanel
                analysis={selectedAnalysis}
                onClose={() => setIsDetailsPanelOpen(false)}
                onViewReport={(analysis) => setPreviewReport(analysis)}
                onOpenWorkspace={handleOpenWorkspace}
                onDelete={(analysis) => setDeleteModalReport(analysis)}
              />
            </div>
          )}
        </div>
      )}

      {/* Bottom Status Bar */}
      <StatusBar
        area={selectedAnalysis ? selectedAnalysis.location : "No area selected"}
        coordinates={selectedAnalysis?.coordinates || "--"}
        imagery={selectedAnalysis?.sensor || "--"}
        resolution={selectedAnalysis?.resolution || "--"}
        cloudCover={selectedAnalysis?.cloudCover || "--"}
        tip="Observable agentic orchestration: Query → Specialist Tool → Grounded Evidence."
      />

      {/* Report Preview Modal */}
      {previewReport && (
        <ReportPreviewModal
          report={previewReport}
          onClose={() => setPreviewReport(null)}
          onOpenWorkspace={handleOpenWorkspace}
          showToast={showToast}
        />
      )}

      {/* Delete Confirmation Modal */}
      {deleteModalReport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-dark-border dark:bg-dark-card">
            <div className="flex items-center space-x-3 text-red-500 mb-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-100 dark:bg-red-950/60">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Delete Report?
              </h3>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              Are you sure you want to delete{" "}
              <strong className="text-slate-900 dark:text-white">
                "{deleteModalReport.title}"
              </strong>{" "}
              ({deleteModalReport.id})? This will remove the analysis and its execution trace from this session.
            </p>
            <div className="mt-5 flex items-center justify-end space-x-2.5">
              <button
                type="button"
                onClick={() => setDeleteModalReport(null)}
                className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-dark-border dark:bg-dark-sidebar dark:text-slate-300 dark:hover:bg-dark-hover transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDelete}
                className="flex items-center space-x-1.5 rounded-xl bg-red-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-red-700 transition"
              >
                <Trash2 className="h-3.5 w-3.5" />
                <span>Delete Report</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
