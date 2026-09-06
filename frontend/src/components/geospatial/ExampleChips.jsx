import React from "react";
import {
  Lightbulb,
  Droplets,
  TrendingUp,
  Mountain,
  Leaf,
  Building2,
  MapPin,
  ArrowRight,
  FileText,
} from "lucide-react";
import { SAMPLE_PRESET_IMAGES, SAMPLE_PRESET_PAIRS } from "../../mock/geospatialAnalyses";

export default function ExampleChips({ onSelectExample }) {
  const examples = [
    {
      id: "flood",
      icon: Droplets,
      iconColor: "text-blue-500 bg-blue-50 dark:bg-blue-950/60 border-blue-200 dark:border-blue-900/60",
      text: "What is the flood risk in this area?",
      sampleImages: [SAMPLE_PRESET_IMAGES.find((s) => s.id === "brahmaputra")],
    },
    {
      id: "change",
      icon: TrendingUp,
      iconColor: "text-indigo-500 bg-indigo-50 dark:bg-indigo-950/60 border-indigo-200 dark:border-indigo-900/60",
      text: "Show changes between these two dates",
      pairPreset: SAMPLE_PRESET_PAIRS.find((p) => p.id === "kerala-pair"),
    },
    {
      id: "water",
      icon: Mountain,
      iconColor: "text-cyan-500 bg-cyan-50 dark:bg-cyan-950/60 border-cyan-200 dark:border-cyan-900/60",
      text: "Detect water bodies in this area",
      sampleImages: [SAMPLE_PRESET_IMAGES.find((s) => s.id === "godavari")],
    },
    {
      id: "ndvi",
      icon: Leaf,
      iconColor: "text-emerald-500 bg-emerald-50 dark:bg-emerald-950/60 border-emerald-200 dark:border-emerald-900/60",
      text: "Analyze vegetation health (NDVI)",
      sampleImages: [SAMPLE_PRESET_IMAGES.find((s) => s.id === "punjab")],
    },
    {
      id: "urban",
      icon: Building2,
      iconColor: "text-purple-500 bg-purple-50 dark:bg-purple-950/60 border-purple-200 dark:border-purple-900/60",
      text: "Identify built-up areas",
      sampleImages: [SAMPLE_PRESET_IMAGES.find((s) => s.id === "bengaluru")],
    },
    {
      id: "describe",
      icon: MapPin,
      iconColor: "text-sky-500 bg-sky-50 dark:bg-sky-950/60 border-sky-200 dark:border-sky-900/60",
      text: "Describe the land-cover and major objects visible in this image",
      sampleImages: [SAMPLE_PRESET_IMAGES.find((s) => s.id === "delhi")],
    },
  ];

  return (
    <div className="w-full max-w-3xl mx-auto mt-4 sm:mt-5 text-left">
      {/* Header Row: Try an example question + View all examples link */}
      <div className="flex items-center justify-between mb-2.5 px-1">
        <div className="flex items-center gap-2">
          <Lightbulb className="w-4 h-4 text-amber-500 fill-amber-400/20" />
          <span className="text-xs font-semibold text-slate-700 dark:text-slate-200">
            Try an example question
          </span>
        </div>

        <button
          type="button"
          onClick={() => onSelectExample(examples[0])}
          className="inline-flex items-center gap-1 text-xs font-medium text-blue-600 dark:text-blue-400 hover:underline transition"
        >
          <span>View all examples</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Grid of Chips */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
        {examples.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onSelectExample(item)}
              className="flex items-center gap-2.5 p-2.5 rounded-xl border border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-[#0A1224]/90 hover:border-blue-400 dark:hover:border-blue-500/50 hover:bg-blue-50/30 dark:hover:bg-[#0E1B36] shadow-2xs hover:shadow-sm text-left transition group cursor-pointer"
            >
              <div
                className={`flex-shrink-0 flex items-center justify-center w-7 h-7 rounded-lg border text-xs shadow-2xs ${item.iconColor}`}
              >
                <Icon className="w-3.5 h-3.5" />
              </div>
              <span className="text-xs font-medium text-slate-700 dark:text-slate-200 group-hover:text-blue-600 dark:group-hover:text-blue-300 leading-snug line-clamp-2">
                {item.text}
              </span>
            </button>
          );
        })}
      </div>

      {/* Subtle Supporting Format Note with Document icon */}
      <div className="mt-3.5 text-center flex items-center justify-center gap-1.5 text-slate-500 dark:text-slate-400">
        <FileText className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500 flex-shrink-0" />
        <p className="text-[11px] tracking-wide font-normal">
          Supports satellite imagery (GeoTIFF, TIFF, PNG, JPEG). Just upload and ask — SatQuery AI handles the rest.
        </p>
      </div>
    </div>
  );
}
