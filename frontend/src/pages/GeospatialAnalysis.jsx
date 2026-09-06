import React, { useState, useRef, useEffect } from "react";
import LayerControl from "../components/workspace/LayerControl";
import EmptyStateWorkspace from "../components/workspace/EmptyStateWorkspace";
import ChatPanel from "../components/workspace/ChatPanel";
import MapViewer from "../components/MapViewer";
import GeospatialHero from "../components/geospatial/GeospatialHero";
import QueryComposer from "../components/geospatial/QueryComposer";
import ExampleChips from "../components/geospatial/ExampleChips";
import AgenticRoutingModal from "../components/geospatial/AgenticRoutingModal";
import AnalysisResultWorkspace from "../components/geospatial/AnalysisResultWorkspace";
import { useTheme } from "../context/ThemeContext";
import { resolveAnalysisRouting } from "../mock/geospatialAnalyses";
import {
  Maximize2,
  Minimize2,
  ChevronDown,
  Search,
  Filter,
  Calendar,
  Sparkles,
  Crosshair,
  Info,
  MapPin,
  X,
} from "lucide-react";

export default function GeospatialAnalysis() {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [searchLocationOpen, setSearchLocationOpen] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterOpen, setFilterOpen] = useState(false);

  // Date selection states
  const [t1Date, setT1Date] = useState("");
  const [t2Date, setT2Date] = useState("");
  const [showT1Picker, setShowT1Picker] = useState(false);
  const [showT2Picker, setShowT2Picker] = useState(false);

  // Layer states
  const [baseImagery, setBaseImagery] = useState("optical");
  const [indexLayers, setIndexLayers] = useState({
    ndvi: false,
    ndwi: false,
    ndbi: false,
    ndmi: false,
  });
  const [vectorLayers, setVectorLayers] = useState({
    floodRisk: false,
    adminBoundary: false,
    roads: false,
    waterBodies: false,
  });
  const [otherLayers, setOtherLayers] = useState({
    cloudMask: false,
  });

  // Assistant Query Input & Pipeline Results
  const [assistantInput, setAssistantInput] = useState("");
  const [pipelineOverlay, setPipelineOverlay] = useState(null);
  const [pipelineBbox, setPipelineBbox] = useState(null);

  // Dropdown & popover refs for outside click dismissal
  const locationDropdownRef = useRef(null);
  const t1PickerRef = useRef(null);
  const t2PickerRef = useRef(null);
  const filterRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (locationDropdownRef.current && !locationDropdownRef.current.contains(event.target)) {
        setSearchLocationOpen(false);
      }
      if (t1PickerRef.current && !t1PickerRef.current.contains(event.target)) {
        setShowT1Picker(false);
      }
      if (t2PickerRef.current && !t2PickerRef.current.contains(event.target)) {
        setShowT2Picker(false);
      }
      if (filterRef.current && !filterRef.current.contains(event.target)) {
        setFilterOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const presetLocations = [
    { id: "assam", name: "Brahmaputra Basin, Assam", coords: "26.2006° N, 92.9376° E", lon: 92.9376, lat: 26.2006 },
    { id: "kerala", name: "Western Ghats, Kerala", coords: "10.8505° N, 76.2711° E", lon: 76.2711, lat: 10.8505 },
    { id: "sundarbans", name: "Sundarbans Delta Zone", coords: "21.9497° N, 88.8056° E", lon: 88.8056, lat: 21.9497 },
    { id: "godavari", name: "Godavari River Basin", coords: "16.9891° N, 81.8040° E", lon: 81.8040, lat: 16.9891 },
    { id: "karnataka", name: "Coastal Karnataka", coords: "14.5479° N, 74.5566° E", lon: 74.5566, lat: 14.5479 },
    { id: "ladakh", name: "Pangong Tso & Ladakh Glaciers", coords: "33.7595° N, 78.6674° E", lon: 78.6674, lat: 33.7595 },
  ];

  const pad = 0.18;
  const selectedBbox = selectedLocation
    ? [
        selectedLocation.lon - pad,
        selectedLocation.lat - pad,
        selectedLocation.lon + pad,
        selectedLocation.lat + pad,
      ]
    : null;

  const selectedOverlay = selectedLocation
    ? {
        type: "FeatureCollection",
        features: [
          {
            type: "Feature",
            properties: { name: selectedLocation.name, mask: "change-vector" },
            geometry: {
              type: "Polygon",
              coordinates: [[
                [selectedLocation.lon - 0.08, selectedLocation.lat - 0.05],
                [selectedLocation.lon + 0.1, selectedLocation.lat - 0.04],
                [selectedLocation.lon + 0.12, selectedLocation.lat + 0.08],
                [selectedLocation.lon - 0.06, selectedLocation.lat + 0.07],
                [selectedLocation.lon - 0.08, selectedLocation.lat - 0.05],
              ]],
            },
          },
        ],
      }
    : null;

  const handleToggleIndexLayer = (key) => {
    setIndexLayers((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleToggleVectorLayer = (key) => {
    setVectorLayers((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleToggleOtherLayer = (key) => {
    setOtherLayers((prev) => ({ ...prev, [key]: !prev[key] }));
  };

const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
      }
      setIsFullscreen(false);
    }
  };

  // Submit Query to run autonomous SatQuery Agent
  const handleSubmitAnalysis = () => {
    if (!query.trim() && attachedFiles.length === 0) return;

        {/* Open in Fullscreen Button */}
        <button
          type="button"
          onClick={toggleFullscreen}
          className="flex items-center space-x-2 rounded-xl border border-slate-200 bg-white px-3.5 py-1.5 text-xs font-semibold text-slate-700 shadow-2xs transition hover:border-slate-300 hover:bg-slate-50 dark:border-dark-border dark:bg-dark-card dark:text-slate-200 dark:hover:bg-dark-hover"
        >
          {isFullscreen ? (
            <>
              <Minimize2 className="h-3.5 w-3.5 text-slate-500 dark:text-slate-400" />
              <span>Exit Fullscreen</span>
            </>
          ) : (
            <>
              <Maximize2 className="h-3.5 w-3.5 text-slate-500 dark:text-slate-400" />
              <span>Open in Fullscreen</span>
            </>
          )}
        </button>
      </div>

      {/* 2. Map and Search Interface (middle) */}
      <div className="flex flex-col gap-4 w-full">
        {/* Search & Analysis Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Left Toolbar Controls: Location Dropdown + Search Input + Filter */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Location Dropdown */}
            <div className="relative" ref={locationDropdownRef}>
              <button
                type="button"
                onClick={() => setSearchLocationOpen(!searchLocationOpen)}
                className="flex items-center space-x-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 shadow-2xs transition hover:bg-slate-50 dark:border-dark-border dark:bg-dark-card dark:text-slate-200 dark:hover:bg-dark-hover"
              >
                <span>{selectedLocation ? selectedLocation.name.split(",")[0] : "Search Location"}</span>
                <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
              </button>

              {searchLocationOpen && (
                <div className="absolute left-0 top-full z-30 mt-1.5 w-64 rounded-xl border border-slate-200 bg-white p-1.5 shadow-xl ring-1 ring-black/5 dark:border-dark-border dark:bg-dark-card">
                  <div className="px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                    Select Preset Location
                  </div>
                  <div className="max-h-56 overflow-y-auto space-y-1">
                    {presetLocations.map((loc) => (
                      <button
                        key={loc.id}
                        type="button"
                        onClick={() => {
                          setSelectedLocation(loc);
                          setSearchQuery(loc.name);
                          setSearchLocationOpen(false);
                        }}
                        className="flex w-full items-start space-x-2 rounded-lg px-2.5 py-2 text-left text-xs transition hover:bg-slate-100 dark:hover:bg-dark-hover"
                      >
                        <MapPin className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-brand-600 dark:text-brand-400" />
                        <div>
                          <p className="font-medium text-slate-800 dark:text-slate-200">{loc.name}</p>
                          <p className="text-[10px] text-slate-400">{loc.coords}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Search Input Field */}
            <div className="relative flex w-64 items-center sm:w-80">
              <input
                type="text"
                placeholder="Search for a place or area..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white py-2 pl-3.5 pr-8 text-xs text-slate-800 placeholder-slate-400 shadow-2xs transition focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 dark:border-dark-border dark:bg-dark-card dark:text-slate-100"
              />
              {searchQuery ? (
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery("");
                    setSelectedLocation(null);
                  }}
                  className="absolute right-2.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              ) : (
                <Search className="pointer-events-none absolute right-2.5 h-3.5 w-3.5 text-slate-400" />
              )}
            </div>

            {/* Filter Button */}
            <div className="relative" ref={filterRef}>
              <button
                type="button"
                onClick={() => setFilterOpen(!filterOpen)}
                className="flex h-8.5 w-8.5 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 shadow-2xs transition hover:bg-slate-50 dark:border-dark-border dark:bg-dark-card dark:text-slate-300 dark:hover:bg-dark-hover"
                title="Filter Settings"
              >
                <Filter className="h-3.5 w-3.5" />
              </button>

  return (
    <div className="relative min-h-[calc(100vh-4rem)] flex-1 w-full flex flex-col items-center justify-center overflow-hidden">
      
      {/* ============================================================ */}
      {/* STATE 1: CLEAN AI NEW CHAT LANDING SCREEN */}
      {/* ============================================================ */}
      {pageState === "idle" && (
        <div className="relative w-full min-h-[calc(100vh-4rem)] flex-1 flex flex-col items-center justify-center z-10 animate-in fade-in duration-300 py-6 px-4 sm:px-6">
          
          {/* Earth Background on the Left Edge (Dynamically adapted for Light / Dark mode) */}
          <div className="absolute left-0 top-0 bottom-0 w-[280px] sm:w-[380px] md:w-[450px] lg:w-[500px] xl:w-[540px] pointer-events-none select-none overflow-hidden z-0 opacity-90 sm:opacity-95 dark:opacity-90">
            <img
              src={earthImageSrc}
              alt="Earth Observation Orbit"
              className="h-full w-full object-cover object-left [mask-image:linear-gradient(to_right,black_65%,transparent_98%)]"
            />
          </div>

          {/* Bottom Left Note matching Reference Image */}
          <div className="hidden xl:block absolute left-6 bottom-6 z-10 pointer-events-none text-left select-none">
            {/* Mountain wireframe vector in dark mode */}
            {isDark && (
              <div className="mb-2 opacity-35">
                <svg className="w-24 h-8 text-blue-400" viewBox="0 0 100 35" fill="none" stroke="currentColor" strokeWidth="1">
                  <path d="M 0 32 L 20 12 L 35 24 L 55 4 L 75 22 L 90 14 L 100 32" />
                  <path d="M 12 24 L 20 12 L 28 24" />
                  <path d="M 45 18 L 55 4 L 65 18" />
                </svg>
              </div>
            )}

              {showT1Picker && (
                <div className="absolute right-0 top-full z-30 mt-1.5 w-48 rounded-xl border border-slate-200 bg-white p-2 shadow-xl dark:border-dark-border dark:bg-dark-card">
                  <p className="mb-1 text-[10px] font-semibold text-slate-400">Select T1 Date</p>
                  <input
                    type="date"
                    onChange={(e) => {
                      setT1Date(e.target.value);
                      setShowT1Picker(false);
                    }}
                    className="w-full rounded border border-slate-200 p-1 text-xs dark:border-dark-border dark:bg-dark-bg dark:text-white"
                  />
                </div>
              )}
            </div>

            <span className="text-xs font-bold text-slate-400 dark:text-slate-500">
              vs
            </span>

            {/* T2 Date Selector */}
            <div className="relative flex items-center rounded-xl border border-slate-200 bg-white px-2.5 py-1.5 shadow-2xs dark:border-dark-border dark:bg-dark-card" ref={t2PickerRef}>
              <span className="mr-2 rounded bg-brand-600 px-1.5 py-0.5 text-[10px] font-bold text-white shadow-xs">
                T2
              </span>
              <input
                type="text"
                readOnly
                value={t2Date || "Select date"}
                onClick={() => setShowT2Picker(!showT2Picker)}
                className="w-20 cursor-pointer bg-transparent text-xs font-medium text-slate-700 focus:outline-none dark:text-slate-200"
              />
              <button
                type="button"
                onClick={() => setShowT2Picker(!showT2Picker)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <Calendar className="h-3.5 w-3.5" />
              </button>

              {showT2Picker && (
                <div className="absolute right-0 top-full z-30 mt-1.5 w-48 rounded-xl border border-slate-200 bg-white p-2 shadow-xl dark:border-dark-border dark:bg-dark-card">
                  <p className="mb-1 text-[10px] font-semibold text-slate-400">Select T2 Date</p>
                  <input
                    type="date"
                    onChange={(e) => {
                      setT2Date(e.target.value);
                      setShowT2Picker(false);
                    }}
                    className="w-full rounded border border-slate-200 p-1 text-xs dark:border-dark-border dark:bg-dark-bg dark:text-white"
                  />
                </div>
              )}
            </div>

            {/* Compare Button */}
            <button
              type="button"
              className="flex items-center space-x-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-2xs transition hover:bg-slate-50 dark:border-dark-border dark:bg-dark-card dark:text-slate-200 dark:hover:bg-dark-hover"
            >
              <Sparkles className="h-3.5 w-3.5 text-brand-600 dark:text-brand-400" />
              <span>Compare</span>
            </button>
          </div>
        </div>

        {/* Map Workspace with LayerControl */}
        <div className="flex flex-col lg:flex-row gap-5 h-auto lg:h-[540px] w-full">
          {/* Left Column: Data & Layers (~320px) */}
          <div className="w-full flex-shrink-0 lg:w-80 h-[540px]">
            <LayerControl
              baseImagery={baseImagery}
              onBaseImageryChange={setBaseImagery}
              indexLayers={indexLayers}
              onToggleIndexLayer={handleToggleIndexLayer}
              vectorLayers={vectorLayers}
              onToggleVectorLayer={handleToggleVectorLayer}
              otherLayers={otherLayers}
              onToggleOtherLayer={handleToggleOtherLayer}
            />
          </div>

          {/* Center Column: OpenLayers GIS client */}
          <div className="relative flex-1 min-w-0 h-[540px] rounded-2xl overflow-hidden border border-slate-200 dark:border-dark-border shadow-sm">
            <MapViewer
              geojsonOverlay={pipelineOverlay || selectedOverlay}
              bboxCoordinates={pipelineBbox || selectedBbox || [68.0, 6.5, 97.5, 35.5]}
              baseImagery={baseImagery}
              onBaseImageryChange={setBaseImagery}
            />
            {!selectedLocation && (
              <div className="pointer-events-none absolute inset-x-0 bottom-10 z-20 flex justify-center px-4">
                <div className="pointer-events-auto max-h-[70%] max-w-xl overflow-y-auto rounded-2xl shadow-xl">
                  <EmptyStateWorkspace />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 3. AI Analysis Assistant chat panel (bottom) */}
      <div className="w-full">
        <ChatPanel
          externalInput={assistantInput}
          onInputChange={setAssistantInput}
          onPipelineResult={(payload) => {
            if (payload?.geojson) setPipelineOverlay(payload.geojson);
            if (payload?.bbox) setPipelineBbox(payload.bbox);
          }}
        />
      </div>

      {/* 4. Bottom Status Bar */}
      <div className="flex flex-col items-start justify-between gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs shadow-2xs transition-colors dark:border-dark-border dark:bg-dark-card sm:flex-row sm:items-center">
        {/* Left Status Items */}
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-slate-600 dark:text-slate-400">
          <div className="flex items-center space-x-1.5">
            <Crosshair className="h-3.5 w-3.5 text-slate-400 dark:text-slate-500" />
            <span className="font-semibold text-slate-800 dark:text-slate-200">
              {selectedLocation ? selectedLocation.name : "No area selected"}
            </span>
          </div>

          <span className="hidden sm:inline text-slate-300 dark:text-slate-700">|</span>

          <div>
            <span>Coordinates: </span>
            <span className="font-mono text-slate-800 dark:text-slate-200">
              {selectedLocation ? selectedLocation.coords : "--"}
            </span>
          </div>

          <span className="hidden sm:inline text-slate-300 dark:text-slate-700">|</span>

          <div>
            <span>Imagery: </span>
            <span className="font-medium text-slate-800 dark:text-slate-200">
              {baseImagery === "optical" ? "Sentinel-2 (Optical)" : "Sentinel-1 (SAR)"}
            </span>
          </div>

          {/* Central Hero Section */}
          <div className="relative z-10 w-full max-w-4xl flex flex-col items-center my-auto">
            <GeospatialHero />

            {/* Main Query Composer Hero Card */}
            <QueryComposer
              query={query}
              onQueryChange={setQuery}
              attachedFiles={attachedFiles}
              onAddFiles={handleAddFiles}
              onRemoveFile={handleRemoveFile}
              onSubmit={handleSubmitAnalysis}
              isAnalyzing={false}
            />

          <span className="hidden sm:inline text-slate-300 dark:text-slate-700">|</span>

          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* STATE 2: AGENTIC ROUTING PROGRESS MODAL */}
      {/* ============================================================ */}
      {pageState === "analyzing" && (
        <AgenticRoutingModal onComplete={handleAgenticComplete} />
      )}

      {/* ============================================================ */}
      {/* STATE 3: RESULTS WORKSPACE */}
      {/* ============================================================ */}
      {pageState === "result" && currentAnalysis && (
        <div className="relative w-full z-10 p-4 sm:p-6 lg:p-8">
          <AnalysisResultWorkspace
            analysisData={currentAnalysis}
            userQuery={query}
            attachedFiles={attachedFiles}
            onResetToNewChat={handleResetToNewChat}
          />
        </div>
      </div>
    </div>
  );
}
