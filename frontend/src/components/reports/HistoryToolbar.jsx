import React from "react";
import { Search, RotateCcw, ArrowUpDown, LayoutGrid, List } from "lucide-react";
import FilterDropdown from "./FilterDropdown";
import {
  ANALYSIS_TYPES,
  LOCATIONS,
  STATUS_OPTIONS,
} from "../../mock/reportsData";

export default function HistoryToolbar({
  searchQuery,
  onSearchChange,
  analysisType,
  onAnalysisTypeChange,
  location,
  onLocationChange,
  status,
  onStatusChange,
  sortBy,
  onSortByChange,
  viewMode,
  onViewModeChange,
  onClearFilters,
  hasActiveFilters,
  totalMatching,
}) {
  const sortOptions = ["Newest First", "Oldest First", "Highest Confidence"];

  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-slate-200/80 bg-white p-3.5 shadow-sm dark:border-dark-border dark:bg-dark-card">
      <div className="flex flex-wrap items-center justify-between gap-3">
        {/* Search Input */}
        <div className="relative flex-1 min-w-[240px] max-w-md">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5">
            <Search className="h-4 w-4 text-slate-400 dark:text-slate-500" />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search reports by title, location, sensor, query..."
            className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-2 pl-10 pr-4 text-xs text-slate-900 placeholder-slate-400 transition focus:border-brand-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-brand-500 dark:border-dark-border dark:bg-dark-bg/60 dark:text-white dark:placeholder-slate-500 dark:focus:bg-dark-card"
          />
        </div>

        {/* View Switcher (Grid vs Table) */}
        <div className="flex items-center space-x-1 rounded-xl border border-slate-200 bg-slate-50/70 p-1 dark:border-dark-border dark:bg-dark-bg/60">
          <button
            type="button"
            onClick={() => onViewModeChange("grid")}
            className={`flex items-center space-x-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold transition ${
              viewMode === "grid"
                ? "bg-white text-brand-600 shadow-sm dark:bg-dark-card dark:text-brand-400"
                : "text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200"
            }`}
            title="Grid View (Visual Cards)"
          >
            <LayoutGrid className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Visual Cards</span>
          </button>

          <button
            type="button"
            onClick={() => onViewModeChange("table")}
            className={`flex items-center space-x-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold transition ${
              viewMode === "table"
                ? "bg-white text-brand-600 shadow-sm dark:bg-dark-card dark:text-brand-400"
                : "text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200"
            }`}
            title="Table View"
          >
            <List className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Table</span>
          </button>
        </div>
      </div>

      {/* Filter Dropdowns + Clear Filters */}
      <div className="flex flex-wrap items-center justify-between gap-2.5 border-t border-slate-100 pt-3 dark:border-dark-border">
        <div className="flex flex-wrap items-center gap-2">
          <FilterDropdown
            label="Location"
            value={location}
            options={LOCATIONS}
            onChange={onLocationChange}
          />

          <FilterDropdown
            label="Analysis Type"
            value={analysisType}
            options={ANALYSIS_TYPES}
            onChange={onAnalysisTypeChange}
          />

          <FilterDropdown
            label="Status"
            value={status}
            options={STATUS_OPTIONS}
            onChange={onStatusChange}
          />

          <FilterDropdown
            label="Sort"
            value={sortBy}
            options={sortOptions}
            onChange={onSortByChange}
            icon={ArrowUpDown}
          />

          {hasActiveFilters && (
            <button
              type="button"
              onClick={onClearFilters}
              className="flex items-center space-x-1 rounded-xl border border-brand-300 bg-brand-50/60 px-3 py-1.5 text-xs font-semibold text-brand-700 transition hover:bg-brand-100/70 dark:border-brand-800 dark:bg-brand-950/40 dark:text-brand-300"
              title="Reset all filters"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              <span>Clear</span>
            </button>
          )}
        </div>

        <div className="text-[11px] text-slate-400">
          Showing <span className="font-bold text-slate-700 dark:text-slate-200">{totalMatching}</span> reports
        </div>
      </div>
    </div>
  );
}
