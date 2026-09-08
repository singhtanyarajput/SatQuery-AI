import React, { useEffect, useState } from "react";
import { CheckCircle2, Loader2 } from "lucide-react";
import { useTheme } from "../../context/ThemeContext";

export default function AgenticRoutingModal({ onComplete }) {
  const { theme } = useTheme();
  const [currentStepIndex, setCurrentStepIndex] = useState(0);

  const steps = [
    { label: "Understanding your question...", sub: "Natural language query semantics parsing" },
    { label: "Checking imagery & modality...", sub: "Validating GeoTIFF metadata & spectral bands" },
    { label: "Selecting the appropriate analysis...", sub: "Agentic model routing & workflow assignment" },
    { label: "Analyzing satellite data...", sub: "Running specialist Earth Observation pipeline" },
    { label: "Generating visual evidence...", sub: "Synthesizing spatial segmentation masks & overlays" },
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentStepIndex((prev) => {
        if (prev < steps.length - 1) {
          return prev + 1;
        } else {
          clearInterval(timer);
          setTimeout(() => {
            onComplete();
          }, 450);
          return prev;
        }
      });
    }, 550);

    return () => clearInterval(timer);
  }, [onComplete, steps.length]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 dark:border-dark-border bg-white dark:bg-dark-card shadow-2xl p-6 relative overflow-hidden">
        
        {/* Subtle Top Accent Glow */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 via-cyan-400 to-indigo-500" />

        {/* Header with Logo */}
        <div className="flex items-center space-x-3 mb-5">
          <div className="relative flex items-center justify-center w-10 h-10 rounded-xl overflow-hidden shadow-xs">
            <img
              src={theme === "dark" ? "/logo-dark.png" : "/logo-light.png"}
              alt="SatQuery AI"
              className="w-full h-full object-contain rounded-xl"
            />
            <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-blue-500" />
            </span>
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              SatQuery AI Agent
            </h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Autonomous satellite intelligence execution
            </p>
          </div>
        </div>

        {/* Observable Execution Stages List */}
        <div className="space-y-3 my-2">
          {steps.map((step, idx) => {
            const isDone = idx < currentStepIndex;
            const isCurrent = idx === currentStepIndex;

            return (
              <div
                key={idx}
                className={`flex items-start gap-3 p-2.5 rounded-xl transition-all ${
                  isCurrent
                    ? "bg-blue-50/80 dark:bg-blue-950/40 border border-blue-200/80 dark:border-blue-800/80"
                    : isDone
                    ? "bg-slate-50/60 dark:bg-dark-hover/30 border border-slate-100 dark:border-dark-border/40"
                    : "opacity-40"
                }`}
              >
                <div className="mt-0.5 flex-shrink-0">
                  {isDone ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 fill-emerald-500/20" />
                  ) : isCurrent ? (
                    <Loader2 className="w-4 h-4 text-brand-600 dark:text-brand-400 animate-spin" />
                  ) : (
                    <div className="w-4 h-4 rounded-full border border-slate-300 dark:border-slate-600" />
                  )}
                </div>
                <div className="flex-1">
                  <div
                    className={`text-xs font-semibold ${
                      isCurrent
                        ? "text-blue-900 dark:text-blue-200"
                        : isDone
                        ? "text-slate-800 dark:text-slate-200"
                        : "text-slate-400 dark:text-slate-500"
                    }`}
                  >
                    {step.label}
                  </div>
                  <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                    {step.sub}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Progress Bar Footer */}
        <div className="mt-5 pt-3 border-t border-slate-100 dark:border-dark-border/60 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
          <span>Processing Earth Observation data...</span>
          <span className="font-mono font-medium text-slate-700 dark:text-slate-300">
            {Math.min(100, Math.round(((currentStepIndex + 1) / steps.length) * 100))}%
          </span>
        </div>
      </div>
    </div>
  );
}
