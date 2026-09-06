import React from "react";
import { SAMPLE_PRESET_IMAGES } from "../../mock/geospatialAnalyses";

export default function DomainGalleryStrip({ onSelectDomain }) {
  const domains = [
    {
      id: "rivers",
      title: "Rivers & Water Bodies",
      desc: "Monitor and extract water regions",
      image: "/satellite/water-optical.jpg",
      query: "Detect water bodies in this area",
      preset: SAMPLE_PRESET_IMAGES.find((s) => s.id === "godavari"),
    },
    {
      id: "vegetation",
      title: "Vegetation & Agriculture",
      desc: "Assess crop and vegetation health",
      image: "/satellite/punjab_agriculture.jpg",
      query: "Analyze vegetation health (NDVI)",
      preset: SAMPLE_PRESET_IMAGES.find((s) => s.id === "punjab"),
    },
    {
      id: "urban",
      title: "Urban & Infrastructure",
      desc: "Analyze built-up areas and assets",
      image: "/satellite/bengaluru_urban.jpg",
      query: "Identify built-up areas",
      preset: SAMPLE_PRESET_IMAGES.find((s) => s.id === "bengaluru"),
    },
    {
      id: "disaster",
      title: "Disaster & Environmental",
      desc: "Assess risks and monitor changes",
      image: "/satellite/drought-result.jpg",
      query: "What is the flood risk in this area?",
      preset: SAMPLE_PRESET_IMAGES.find((s) => s.id === "brahmaputra"),
    },
  ];

  return (
    <div className="w-full max-w-6xl mx-auto mt-6 pt-5 pb-8 px-2 select-none">
      <div className="flex flex-col lg:flex-row items-center justify-between gap-5">
        {/* Left Decorative Quote */}
        <div className="hidden xl:flex flex-col items-start text-left flex-shrink-0 w-44">
          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 leading-snug">
            Satellite imagery.
            <br />
            Smarter decisions.
            <br />
            <span className="text-slate-700 dark:text-slate-200">A better tomorrow.</span>
          </p>
          <svg
            className="w-14 h-3.5 text-blue-500 dark:text-blue-400 mt-1"
            viewBox="0 0 60 15"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
          >
            <path d="M 4 8 Q 28 14 56 4" />
          </svg>
        </div>

        {/* Four Real Satellite Category Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 flex-1 w-full">
          {domains.map((domain) => (
            <button
              key={domain.id}
              type="button"
              onClick={() => onSelectDomain && onSelectDomain(domain)}
              className="group flex flex-col rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-[#0A1224]/90 p-2 text-left shadow-2xs hover:shadow-md hover:border-blue-400 dark:hover:border-blue-500/50 transition-all duration-200 cursor-pointer overflow-hidden"
              title={`Explore ${domain.title}`}
            >
              <div className="relative w-full h-20 rounded-lg overflow-hidden bg-slate-900">
                <img
                  src={domain.image}
                  alt={domain.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-60 group-hover:opacity-40 transition-opacity" />
              </div>

              <div className="mt-2 px-1 pb-0.5">
                <div className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors truncate">
                  {domain.title}
                </div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                  {domain.desc}
                </div>
              </div>
            </button>
          ))}
        </div>

        {/* Right Decorative Quote */}
        <div className="hidden xl:flex flex-col items-start text-left flex-shrink-0 w-44 pl-2 border-l border-slate-200/60 dark:border-slate-800/60 relative">
          {/* Subtle Satellite SVG icon */}
          <svg
            className="absolute top-0 right-2 w-7 h-7 text-blue-400/40 dark:text-blue-400/30 -rotate-12"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M13 7 9 3 5 7l4 4" />
            <path d="m17 11 4 4-4 4-4-4" />
            <path d="m8 12 4 4 6-6-4-4Z" />
            <path d="m16 8 3-3" />
            <path d="M9 21a6 6 0 0 0-6-6" />
          </svg>

          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 leading-snug">
            One question.
            <br />
            Multiple possibilities.
            <br />
            <span className="text-slate-700 dark:text-slate-200">Real-world impact.</span>
          </p>
          <svg
            className="w-14 h-3.5 text-blue-500 dark:text-blue-400 mt-1"
            viewBox="0 0 60 15"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
          >
            <path d="M 4 10 Q 30 15 54 4" />
          </svg>
        </div>
      </div>
    </div>
  );
}
