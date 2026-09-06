import React, { useState } from "react";
import { useTheme } from "../context/ThemeContext";
import { resolveAnalysisRouting } from "../mock/geospatialAnalyses";
import AgenticRoutingModal from "../components/geospatial/AgenticRoutingModal";
import AnalysisResultWorkspace from "../components/geospatial/AnalysisResultWorkspace";
import ExampleChips from "../components/geospatial/ExampleChips";
import GeospatialHero from "../components/geospatial/GeospatialHero";
import QueryComposer from "../components/geospatial/QueryComposer";

export default function GeospatialAnalysis() {
  const { theme } = useTheme();
  const [pageState, setPageState] = useState("idle"); // "idle" | "analyzing" | "result"
  const [query, setQuery] = useState("");
  const [attachedFiles, setAttachedFiles] = useState([]);
  const [currentAnalysis, setCurrentAnalysis] = useState(null);

  const handleAddFiles = (files) => {
    setAttachedFiles((prev) => [...prev, ...files]);
  };

  const handleRemoveFile = (identifier) => {
    setAttachedFiles((files) =>
      files.filter((f) => f.id !== identifier && f.name !== identifier)
    );
  };

  const handleSubmitAnalysis = () => {
    if (!query.trim() && attachedFiles.length === 0) return;
    const routingResult = resolveAnalysisRouting(query, attachedFiles);
    setCurrentAnalysis(routingResult);
    setPageState("analyzing");
  };

  const handleResetToNewChat = () => {
    setPageState("idle");
    setQuery("");
    setAttachedFiles([]);
    setCurrentAnalysis(null);
  };

  const handleSelectExample = (example) => {
    setQuery(example.text);
    if (example.sampleImages && example.sampleImages.length > 0) {
      setAttachedFiles(example.sampleImages.filter(Boolean));
    } else if (example.pairPreset) {
      const pair = example.pairPreset;
      setAttachedFiles([
        {
          id: `${pair.id}-1`,
          name: pair.file1.name,
          size: pair.file1.size,
          modality: pair.file1.type,
          baseImage: pair.baseImage,
        },
        {
          id: `${pair.id}-2`,
          name: pair.file2.name,
          size: pair.file2.size,
          modality: pair.file2.type,
          baseImage: pair.resultImage,
        },
      ]);
    }
  };


  const isDark = theme === "dark";
  const earthImageSrc = isDark
    ? "/satellite/earth_night_curve.jpg"
    : "/satellite/earth_globe_curve.jpg";

  return (
    <div className="relative flex min-h-[calc(100vh-4rem)] w-full flex-col items-center overflow-x-hidden">
      {/* 1. IDLE STATE: Clean Modern AI New-Chat Screen */}
      {pageState === "idle" && (
        <div className="relative flex w-full flex-1 flex-col items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          {/* Subtle curved Earth graphic entering from left edge */}
          <img
            src={earthImageSrc}
            alt="Earth Observation Globe"
            className="pointer-events-none absolute left-0 top-0 -z-0 h-full w-[260px] sm:w-[360px] lg:w-[480px] object-cover object-left opacity-75 dark:opacity-65 select-none [mask-image:linear-gradient(to_right,black_60%,transparent_98%)] transition-opacity duration-300"
          />

          <div className="relative z-10 w-full flex flex-col items-center">
            {/* Main Centered Hero */}
            <GeospatialHero />

            {/* Main AI Query Composer */}
            <QueryComposer
              query={query}
              onQueryChange={setQuery}
              attachedFiles={attachedFiles}
              onAddFiles={handleAddFiles}
              onRemoveFile={handleRemoveFile}
              onSubmit={handleSubmitAnalysis}
              isAnalyzing={false}
            />

            {/* Example Questions Section */}
            <ExampleChips onSelectExample={handleSelectExample} />
          </div>

        </div>
      )}

      {/* 2. ANALYZING STATE: Elegant Agentic Routing Modal */}
      {pageState === "analyzing" && (
        <AgenticRoutingModal onComplete={() => setPageState("result")} />
      )}

      {/* 3. RESULT STATE: Satellite Visual Evidence & AI Response Workspace */}
      {pageState === "result" && currentAnalysis && (
        <div className="relative z-10 w-full p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
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
