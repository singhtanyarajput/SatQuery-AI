import React from "react";
import { CATEGORIES } from "../../mock/reportsData";
import { Layers, Sparkles } from "lucide-react";

export default function CategoryStrip({
  selectedCategory,
  onSelectCategory,
  categoryCounts,
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Layers className="h-4 w-4 text-brand-500" />
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-400">
            Analysis Modality & Workflow Categories
          </span>
        </div>
        <span className="text-[11px] text-slate-500 dark:text-slate-400">
          Click category to filter workflows
        </span>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {CATEGORIES.map((cat) => {
          const isSelected = selectedCategory === cat.id;
          const count = categoryCounts[cat.id] || 0;

          return (
            <button
              key={cat.id}
              type="button"
              onClick={() => onSelectCategory(cat.id)}
              className={`group relative flex flex-col overflow-hidden rounded-2xl border text-left transition-all duration-300 ${
                isSelected
                  ? "border-brand-500 bg-brand-950/20 shadow-lg shadow-brand-500/10 ring-2 ring-brand-500/60 dark:bg-brand-950/30"
                  : "border-slate-200/80 bg-white hover:border-slate-300 hover:shadow-md dark:border-dark-border dark:bg-dark-card dark:hover:border-slate-700"
              }`}
            >
              {/* Thumbnail Container */}
              <div className="relative aspect-[16/9] w-full overflow-hidden bg-slate-900">
                <img
                  src={cat.thumbnail}
                  alt={cat.label}
                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                  loading="lazy"
                  onError={(e) => {
                    e.currentTarget.src = "/satellite/category-all.jpg";
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/30 to-transparent" />

                {/* Report Count Pill */}
                <div className="absolute bottom-2 left-2 z-10">
                  <span
                    className={`inline-flex items-center space-x-1 rounded-md px-2 py-0.5 text-[10px] font-bold backdrop-blur-md ${
                      isSelected
                        ? "bg-brand-600 text-white shadow-sm"
                        : "bg-slate-900/80 text-slate-300 border border-slate-700/60"
                    }`}
                  >
                    <span>{count} {count === 1 ? "report" : "reports"}</span>
                  </span>
                </div>

                {isSelected && (
                  <div className="absolute right-2 top-2 z-10 flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-brand-500"></span>
                  </div>
                )}
              </div>

              {/* Text Information */}
              <div className="p-3">
                <h3
                  className={`text-xs font-bold tracking-tight transition-colors ${
                    isSelected
                      ? "text-brand-600 dark:text-brand-400"
                      : "text-slate-900 group-hover:text-brand-500 dark:text-white"
                  }`}
                >
                  {cat.label}
                </h3>
                <p className="mt-0.5 text-[10px] text-slate-500 dark:text-slate-400 line-clamp-1">
                  {cat.description}
                </p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
