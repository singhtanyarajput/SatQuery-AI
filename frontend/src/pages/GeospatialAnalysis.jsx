import React, { useEffect, useRef, useState } from "react";
import { Crosshair, Filter, MapPin, Search, X } from "lucide-react";
import { useTheme } from "../context/ThemeContext";
import { resolveAnalysisRouting } from "../mock/geospatialAnalyses";
import AgenticRoutingModal from "../components/geospatial/AgenticRoutingModal";
import AnalysisResultWorkspace from "../components/geospatial/AnalysisResultWorkspace";
import ExampleChips from "../components/geospatial/ExampleChips";
import GeospatialHero from "../components/geospatial/GeospatialHero";
import QueryComposer from "../components/geospatial/QueryComposer";
import ChatPanel from "../components/workspace/ChatPanel";
import EmptyStateWorkspace from "../components/workspace/EmptyStateWorkspace";
import LayerControl from "../components/workspace/LayerControl";
import MapViewer from "../components/MapViewer";

const presetLocations = [
  { id: "assam", name: "Brahmaputra Basin, Assam", coords: "26.2006 N, 92.9376 E", lon: 92.9376, lat: 26.2006 },
  { id: "kerala", name: "Western Ghats, Kerala", coords: "10.8505 N, 76.2711 E", lon: 76.2711, lat: 10.8505 },
  { id: "sundarbans", name: "Sundarbans Delta Zone", coords: "21.9497 N, 88.8056 E", lon: 88.8056, lat: 21.9497 },
  { id: "godavari", name: "Godavari River Basin", coords: "16.9891 N, 81.8040 E", lon: 81.804, lat: 16.9891 },
  { id: "karnataka", name: "Coastal Karnataka", coords: "14.5479 N, 74.5566 E", lon: 74.5566, lat: 14.5479 },
  { id: "ladakh", name: "Pangong Tso & Ladakh Glaciers", coords: "33.7595 N, 78.6674 E", lon: 78.6674, lat: 33.7595 },
];

export default function GeospatialAnalysis() {
  const { theme } = useTheme();
  const [pageState, setPageState] = useState("idle");
  const [query, setQuery] = useState("");
  const [attachedFiles, setAttachedFiles] = useState([]);
  const [currentAnalysis, setCurrentAnalysis] = useState(null);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchLocationOpen, setSearchLocationOpen] = useState(false);
  const [filterOpen, setFilterOpen] = useState(false);
  const [baseImagery, setBaseImagery] = useState("optical");
  const [indexLayers, setIndexLayers] = useState({ ndvi: false, ndwi: false, ndbi: false, ndmi: false });
  const [vectorLayers, setVectorLayers] = useState({ floodRisk: false, adminBoundary: false, roads: false, waterBodies: false });
  const [otherLayers, setOtherLayers] = useState({ cloudMask: false });
  const [assistantInput, setAssistantInput] = useState("");
  const [pipelineOverlay, setPipelineOverlay] = useState(null);
  const [pipelineBbox, setPipelineBbox] = useState(null);
  const locationRef = useRef(null);
  const filterRef = useRef(null);

  useEffect(() => {
    const closePopovers = (event) => {
      if (locationRef.current && !locationRef.current.contains(event.target)) setSearchLocationOpen(false);
      if (filterRef.current && !filterRef.current.contains(event.target)) setFilterOpen(false);
    };
    document.addEventListener("mousedown", closePopovers);
    return () => document.removeEventListener("mousedown", closePopovers);
  }, []);

  const selectedBbox = selectedLocation
    ? [selectedLocation.lon - 0.18, selectedLocation.lat - 0.18, selectedLocation.lon + 0.18, selectedLocation.lat + 0.18]
    : null;
  const selectedOverlay = selectedLocation
    ? { type: "FeatureCollection", features: [{ type: "Feature", properties: { name: selectedLocation.name }, geometry: { type: "Polygon", coordinates: [[
      [selectedLocation.lon - 0.08, selectedLocation.lat - 0.05],
      [selectedLocation.lon + 0.1, selectedLocation.lat - 0.04],
      [selectedLocation.lon + 0.12, selectedLocation.lat + 0.08],
      [selectedLocation.lon - 0.06, selectedLocation.lat + 0.07],
      [selectedLocation.lon - 0.08, selectedLocation.lat - 0.05],
    ]] } }] }
    : null;

  const handleAddFiles = (files) => setAttachedFiles((previous) => [...previous, ...files]);
  const handleRemoveFile = (identifier) => setAttachedFiles((files) => files.filter((file) => file.id !== identifier && file.name !== identifier));
  const handleSubmitAnalysis = () => {
    if (!query.trim() && attachedFiles.length === 0) return;
    setPageState("analyzing");
    setCurrentAnalysis(resolveAnalysisRouting(query, attachedFiles));
  };
  const handleResetToNewChat = () => {
    setPageState("idle");
    setQuery("");
    setAttachedFiles([]);
    setCurrentAnalysis(null);
  };
  const toggleLayer = (setter) => (key) => setter((layers) => ({ ...layers, [key]: !layers[key] }));
  const isDark = theme === "dark";
  const earthImageSrc = isDark ? "/satellite/earth_night_curve.jpg" : "/satellite/earth_globe_curve.jpg";

  return (
    <div className="relative flex min-h-[calc(100vh-4rem)] w-full flex-col items-center overflow-hidden">
      {pageState === "idle" && <div className="relative flex w-full flex-1 flex-col gap-4 px-4 py-6 sm:px-6">
        <img src={earthImageSrc} alt="Earth Observation Orbit" className="pointer-events-none absolute left-0 top-0 -z-0 h-full w-[280px] object-cover object-left opacity-80 [mask-image:linear-gradient(to_right,black_65%,transparent_98%)] sm:w-[380px] lg:w-[500px]" />
        <div className="relative z-10 flex w-full flex-wrap items-center justify-between gap-3">
          <div className="relative" ref={locationRef}>
            <button type="button" onClick={() => setSearchLocationOpen((open) => !open)} className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold shadow-2xs dark:border-dark-border dark:bg-dark-card dark:text-slate-200"><MapPin className="h-3.5 w-3.5 text-brand-600" /><span>{selectedLocation ? selectedLocation.name.split(",")[0] : "Search Location"}</span></button>
            {searchLocationOpen && <div className="absolute left-0 top-full z-30 mt-1.5 w-64 rounded-xl border border-slate-200 bg-white p-1.5 shadow-xl dark:border-dark-border dark:bg-dark-card">{presetLocations.map((location) => <button key={location.id} type="button" onClick={() => { setSelectedLocation(location); setSearchQuery(location.name); setSearchLocationOpen(false); }} className="flex w-full items-start gap-2 rounded-lg px-2.5 py-2 text-left text-xs hover:bg-slate-100 dark:hover:bg-dark-hover"><MapPin className="mt-0.5 h-3.5 w-3.5 text-brand-600" /><span><strong className="block text-slate-800 dark:text-slate-200">{location.name}</strong><small className="text-slate-400">{location.coords}</small></span></button>)}</div>}
          </div>
          <GeospatialHero />
          <div className="flex items-center gap-2"><div className="relative"><Search className="pointer-events-none absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" /><input value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)} placeholder="Search area" className="w-44 rounded-xl border border-slate-200 bg-white py-2 pl-8 pr-7 text-xs dark:border-dark-border dark:bg-dark-card dark:text-white" />{searchQuery && <button type="button" onClick={() => { setSearchQuery(""); setSelectedLocation(null); }} className="absolute right-2.5 top-2.5"><X className="h-3.5 w-3.5 text-slate-400" /></button>}</div><div className="relative" ref={filterRef}><button type="button" onClick={() => setFilterOpen((open) => !open)} className="rounded-xl border border-slate-200 bg-white p-2 dark:border-dark-border dark:bg-dark-card" title="Filter settings"><Filter className="h-3.5 w-3.5" /></button>{filterOpen && <div className="absolute right-0 top-full z-30 mt-1.5 rounded-xl border border-slate-200 bg-white p-3 text-xs shadow-xl dark:border-dark-border dark:bg-dark-card"><span className="font-semibold dark:text-white">Analysis filters</span></div>}</div></div>
        </div>
        <div className="relative z-10 flex w-full flex-col gap-5 lg:h-[540px] lg:flex-row"><div className="w-full flex-shrink-0 lg:w-80"><LayerControl baseImagery={baseImagery} onBaseImageryChange={setBaseImagery} indexLayers={indexLayers} onToggleIndexLayer={toggleLayer(setIndexLayers)} vectorLayers={vectorLayers} onToggleVectorLayer={toggleLayer(setVectorLayers)} otherLayers={otherLayers} onToggleOtherLayer={toggleLayer(setOtherLayers)} /></div><div className="relative min-w-0 flex-1 overflow-hidden rounded-2xl border border-slate-200 shadow-sm dark:border-dark-border"><MapViewer geojsonOverlay={pipelineOverlay || selectedOverlay} bboxCoordinates={pipelineBbox || selectedBbox || [68, 6.5, 97.5, 35.5]} baseImagery={baseImagery} onBaseImageryChange={setBaseImagery} />{!selectedLocation && <div className="pointer-events-none absolute inset-x-0 bottom-10 z-20 flex justify-center px-4"><div className="pointer-events-auto max-w-xl rounded-2xl shadow-xl"><EmptyStateWorkspace /></div></div>}</div></div>
        <div className="relative z-10 w-full"><ChatPanel externalInput={assistantInput} onInputChange={setAssistantInput} onPipelineResult={(payload) => { if (payload?.geojson) setPipelineOverlay(payload.geojson); if (payload?.bbox) setPipelineBbox(payload.bbox); }} /></div>
        <div className="relative z-10 flex w-full items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs shadow-2xs dark:border-dark-border dark:bg-dark-card dark:text-slate-300"><Crosshair className="h-3.5 w-3.5 text-slate-400" /><span className="font-semibold">{selectedLocation ? selectedLocation.name : "No area selected"}</span><span className="text-slate-300">|</span><span>{selectedLocation ? selectedLocation.coords : "Coordinates: --"}</span></div>
        <div className="relative z-10 w-full max-w-4xl"><QueryComposer query={query} onQueryChange={setQuery} attachedFiles={attachedFiles} onAddFiles={handleAddFiles} onRemoveFile={handleRemoveFile} onSubmit={handleSubmitAnalysis} isAnalyzing={false} /><ExampleChips onSelectExample={(example) => setQuery(example.text)} /></div>
      </div>}
      {pageState === "analyzing" && <AgenticRoutingModal onComplete={() => setPageState("result")} />}
      {pageState === "result" && currentAnalysis && <div className="relative z-10 w-full p-4 sm:p-6"><AnalysisResultWorkspace analysisData={currentAnalysis} userQuery={query} attachedFiles={attachedFiles} onResetToNewChat={handleResetToNewChat} /></div>}
    </div>
  );
}
