import React from "react";
import { ArrowRight, CornerDownRight } from "lucide-react";
import { SAMPLE_PRESET_IMAGES } from "../../mock/geospatialAnalyses";

export default function DomainGalleryStrip({ onSelectDomain }) {
  const domains = [
    {
      id: "rivers",
      title: "Rivers & Water Bodies",
      subtitle: "Monitor and extract water regions",
      image: "/satellite/water-optical.jpg",
      query: "Detect water bodies and estimate reservoir surface area",
      preset: SAMPLE_PRESET_IMAGES.find((s) => s.id === "godavari"),
    },
    {
      id: "vegetation",
      title: "Vegetation & Agriculture",
      subtitle: "Assess crop and vegetation health",
      image: "/satellite/vegetation-optical.jpg",
      query: "Analyze vegetation health (NDVI) and crop stress",
      preset: SAMPLE_PRESET_IMAGES.find((s) => s.id === "punjab"),
    },
    {
      id: "urban",
      title: "Urban & Infrastructure",
      subtitle: "Analyze built-up areas and assets",
      image: "/satellite/bengaluru_urban.jpg",
      query: "Identify built-up areas and infrastructure expansion",
      preset: SAMPLE_PRESET_IMAGES.find((s) => s.id === "bengaluru"),
    },
    {
      id: "disaster",
      title: "Disaster & Environmental",
      subtitle: "Assess risks and monitor changes",
      image: "/satellite/flood.jpg",
      query: "What is the flood risk and inundation extent in this area?",
      preset: SAMPLE_PRESET_IMAGES.find((s) => s.id === "brahmaputra"),
    },
  ];

  return (
    <div className="w-full max-w-5xl mx-auto mt-6 sm:mt-7 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 bg-white/70 dark:bg-[#070E1C]/90 backdrop-blur-sm p-3.5 sm:p-4 shadow-sm">
      
      {/* Section Header: Explore what you can do */}
      <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800 dark:text-slate-200 mb-3 px-1">
        <CornerDownRight className="w-3.5 h-3.5 text-blue-500" />
        <span>Explore what you can do</span>
      </div>

      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
        
        {/* Domain Cards Strip (4 items) */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 flex-1">
          {domains.map((d) => (
            <button
              key={d.id}
              type="button"
              onClick={() => onSelectDomain(d)}
              className="flex flex-col overflow-hidden rounded-xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-[#0A1224] hover:border-blue-500/60 dark:hover:border-blue-500/60 shadow-2xs hover:shadow-sm transition text-left group cursor-pointer"
            >
              {/* Thumbnail Container */}
              <div className="h-16 w-full overflow-hidden bg-slate-100 dark:bg-slate-800 relative">
                <img
                  src={d.image}
                  alt={d.title}
                  className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/25 via-transparent to-transparent pointer-events-none" />
              </div>

              {/* Title & Subtitle */}
              <div className="p-2 sm:p-2.5">
                <div className="flex items-center justify-between">
                  <h4 className="text-[11px] font-bold text-slate-800 dark:text-slate-200 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors truncate">
                    {d.title}
                  </h4>
                  <ArrowRight className="w-3 h-3 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
                </div>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 line-clamp-1 mt-0.5">
                  {d.subtitle}
                </p>
              </div>
            </button>
          ))}
        </div>

        {/* Right Callout Note: "One question. Multiple possibilities. Real-world impact." */}
        <div className="flex items-center gap-3 lg:pl-5 lg:border-l lg:border-slate-200/70 dark:lg:border-slate-800/80 py-1 select-none flex-shrink-0">
          <div className="text-left">
            <div className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 leading-tight">
              One question.
              <br />
              Multiple possibilities.
              <br />
              <span className="text-slate-900 dark:text-white font-bold">Real-world impact.</span>
            </div>
            {/* Blue flourish underline */}
            <svg
              className="w-14 h-3 text-blue-500 mt-1"
              viewBox="0 0 60 12"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            >
              <path d="M 3 8 Q 28 11 55 4" />
            </svg>
          </div>

          {/* Tilted Satellite Icon (matching dark mode reference) */}
          <div className="p-2 rounded-xl bg-blue-50/80 dark:bg-blue-950/60 text-blue-500 dark:text-blue-400 rotate-12 flex-shrink-0">
            <svg
              viewBox="0 0 24 24"
              fill="currentColor"
              className="w-6 h-6"
            >
              <path d="M14.5 2.5 12 5l2.5 2.5 2.5-2.5L14.5 2.5zM8 7 3.5 11.5l2 2L10 9 8 7zm11 5-4.5 4.5 2 2L21 14l-2-2zm-7.5-1.5L9 13l2 2 2.5-2.5-2-2zM3 21a6 6 0 0 1 6-6l-1.5-1.5A8 8 0 0 0 1.5 19.5L3 21z" />
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
}
