import React, { useState } from "react";
import GeospatialHero from "../components/geospatial/GeospatialHero";
import QueryComposer from "../components/geospatial/QueryComposer";
import ExampleChips from "../components/geospatial/ExampleChips";
import DomainGalleryStrip from "../components/geospatial/DomainGalleryStrip";
import AgenticRoutingModal from "../components/geospatial/AgenticRoutingModal";
import AnalysisResultWorkspace from "../components/geospatial/AnalysisResultWorkspace";
import { useTheme } from "../context/ThemeContext";
import { resolveAnalysisRouting } from "../mock/geospatialAnalyses";

export default function GeospatialAnalysis() {
  const { theme } = useTheme();
  const isDark = theme === "dark";

  // Application state flow: 'idle' (New Analysis) | 'analyzing' | 'result'
  const [pageState, setPageState] = useState("idle");

  // Query & attachments state
  const [query, setQuery] = useState("");
  const [attachedFiles, setAttachedFiles] = useState([]);

  // Result state
  const [currentAnalysis, setCurrentAnalysis] = useState(null);

  // File management
  const handleAddFiles = (newFiles) => {
    setAttachedFiles((prev) => {
      const existingNames = new Set(prev.map((f) => f.name));
      const filtered = newFiles.filter((f) => !existingNames.has(f.name));
      return [...prev, ...filtered];
    });
  };

  const handleRemoveFile = (fileIdentifier) => {
    setAttachedFiles((prev) =>
      prev.filter((f) => f.id !== fileIdentifier && f.name !== fileIdentifier)
    );
  };

  // Click on Example Question Chip
  const handleSelectExample = (example) => {
    setQuery(example.text);
    if (example.pairPreset) {
      setAttachedFiles([
        {
          id: `${example.pairPreset.id}-1`,
          name: example.pairPreset.file1.name,
          size: example.pairPreset.file1.size,
          modality: example.pairPreset.file1.type,
          baseImage: example.pairPreset.baseImage,
        },
        {
          id: `${example.pairPreset.id}-2`,
          name: example.pairPreset.file2.name,
          size: example.pairPreset.file2.size,
          modality: example.pairPreset.file2.type,
          baseImage: example.pairPreset.resultImage,
        },
      ]);
    } else if (example.sampleImages && example.sampleImages.length > 0) {
      setAttachedFiles(example.sampleImages);
    }
  };

  // Click on Bottom Domain Card
  const handleSelectDomain = (domain) => {
    setQuery(domain.query);
    if (domain.preset) {
      setAttachedFiles([domain.preset]);
    }
  };

  // Submit Query to run autonomous SatQuery Agent
  const handleSubmitAnalysis = () => {
    if (!query.trim() && attachedFiles.length === 0) return;

    // Transition to STATE 2: ANALYZING
    setPageState("analyzing");

    // Automatically resolve workflow using intelligent router
    const resolvedResult = resolveAnalysisRouting(query, attachedFiles);
    setCurrentAnalysis(resolvedResult);
  };

  // Completion callback from AgenticRoutingModal
  const handleAgenticComplete = () => {
    // Transition to STATE 3: RESULTS
    setPageState("result");
  };

  // Reset to clean New Chat landing screen
  const handleResetToNewChat = () => {
    setPageState("idle");
    setQuery("");
    setAttachedFiles([]);
    setCurrentAnalysis(null);
  };

  // Dynamic Earth graphic: night city lights with cyan limb in dark mode, daylight globe in light mode
  const earthImageSrc = isDark ? "/satellite/earth_night_curve.jpg" : "/satellite/earth_globe_curve.jpg";

  return (
    <div className="relative min-h-[calc(100vh-8rem)] w-full flex flex-col items-center justify-start overflow-hidden">
      
      {/* ============================================================ */}
      {/* STATE 1: CLEAN AI NEW CHAT LANDING SCREEN */}
      {/* ============================================================ */}
      {pageState === "idle" && (
        <div className="relative w-full flex flex-col items-center z-10 animate-in fade-in duration-300 py-2 sm:py-3">
          
          {/* Earth Background on the Left Edge (Dynamically adapted for Light / Dark mode) */}
          <div className="absolute -left-12 sm:-left-8 lg:left-0 top-0 bottom-0 w-[260px] sm:w-[350px] lg:w-[430px] pointer-events-none select-none overflow-hidden z-0 opacity-85 sm:opacity-95 dark:opacity-90">
            <img
              src={earthImageSrc}
              alt="Earth Observation Orbit"
              className="h-full w-full object-cover object-left [mask-image:linear-gradient(to_right,black_75%,transparent_100%)]"
            />
          </div>

          {/* Bottom Left Note matching Reference Image */}
          <div className="hidden xl:block absolute left-4 bottom-8 z-10 pointer-events-none text-left select-none">
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

            <div className="text-[11px] text-slate-500 dark:text-slate-400 font-medium leading-relaxed">
              {isDark ? (
                <>
                  Earth<br />
                  Data for a<br />
                  <span className="font-semibold text-slate-300">Brighter Tomorrow</span>
                </>
              ) : (
                <>
                  Satellite imagery.<br />
                  Smarter decisions.<br />
                  <span className="font-semibold text-slate-800">A better tomorrow.</span>
                </>
              )}
            </div>
            <svg
              className="w-14 h-2.5 text-blue-500 mt-1"
              viewBox="0 0 50 10"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            >
              <path d="M 2 7 Q 25 10 48 3" />
            </svg>
          </div>

          {/* Central Hero Section */}
          <div className="relative z-10 w-full flex flex-col items-center">
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

            {/* Example Question Suggestion Chips */}
            <ExampleChips onSelectExample={handleSelectExample} />

            {/* Bottom Domain Gallery Strip & Callout */}
            <DomainGalleryStrip onSelectDomain={handleSelectDomain} />
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
        <div className="relative w-full z-10">
          <AnalysisResultWorkspace
            analysisData={currentAnalysis}
            userQuery={query}
            attachedFiles={attachedFiles}
            onResetToNewChat={handleResetToNewChat}
          />
        </div>
      )}
    </div>
  );
}
