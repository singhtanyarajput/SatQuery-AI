import React from "react";

export default function GeospatialHero() {
  return (
    <div className="relative w-full pt-2 pb-5 sm:pt-4 sm:pb-7 text-center select-none">
      {/* Hand-drawn annotation: Top Right "From Earth Data to Real Insights" */}
      <div className="hidden lg:block absolute right-4 top-2 sm:right-10 sm:top-3 z-10 pointer-events-none">
        <div className="font-handwriting text-blue-600 dark:text-blue-300 text-xl sm:text-2xl font-bold rotate-2 tracking-wide drop-shadow-xs">
          From Earth<br />Data to<br />Real Insights
        </div>
        <svg
          className="w-16 h-8 text-blue-500 dark:text-blue-400 -mt-1 ml-4"
          viewBox="0 0 60 25"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        >
          <path d="M 5 18 Q 30 24 55 12" />
        </svg>
      </div>

      {/* Hand-drawn annotation: Top Left "Understand Our Planet" pointing to the Earth curve */}
      <div className="hidden xl:block absolute left-14 top-1 z-10 pointer-events-none text-left">
        <div className="font-handwriting text-blue-600 dark:text-blue-300 text-xl font-bold -rotate-6 tracking-wide drop-shadow-xs">
          Understand<br />Our Planet
        </div>
        <svg
          className="w-10 h-10 text-blue-500 dark:text-blue-400 mt-0.5 ml-4"
          viewBox="0 0 40 40"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        >
          <path d="M 10 5 Q 22 14 18 28" />
          <path d="M 12 24 L 18 28 L 22 22" />
        </svg>
      </div>

      {/* Category Pill Tag */}
      <div className="inline-flex items-center gap-2 rounded-full bg-blue-50/90 dark:bg-[#0B1528] border border-blue-200/60 dark:border-blue-900/60 px-4 py-1 text-xs font-semibold text-blue-700 dark:text-blue-300 shadow-2xs mb-3 transition hover:bg-blue-100/80 dark:hover:bg-[#101F3B]">
        <span>Explore</span>
        <span className="text-blue-400 dark:text-blue-500">•</span>
        <span>Analyze</span>
        <span className="text-blue-400 dark:text-blue-500">•</span>
        <span>Understand</span>
        <span className="text-blue-400 dark:text-blue-500">•</span>
        <span>Act</span>
      </div>

      {/* Main Page Title */}
      <h1 className="text-3xl sm:text-4xl lg:text-[42px] font-extrabold tracking-tight text-slate-950 dark:text-white">
        Geospatial AI Analysis
      </h1>

      {/* Subtitle */}
      <p className="mx-auto mt-2.5 max-w-2xl text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed font-normal">
        Upload satellite imagery and ask anything.
        <br className="hidden sm:inline" />
        {" "}SatQuery AI automatically understands your request, selects the right analysis, and delivers insights with visual evidence.
      </p>
    </div>
  );
}
