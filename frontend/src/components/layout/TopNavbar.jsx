import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Calendar,
  Sun,
  Moon,
  Plus,
} from "lucide-react";
import { useTheme } from "../../context/ThemeContext";
import { useAnalysisHistory } from "../../context/AnalysisHistoryContext";

export default function TopNavbar({ onToggleSidebar, onOpenSidebar, isSidebarCollapsed }) {
  const { theme, toggleTheme } = useTheme();
  const { startNewAnalysis } = useAnalysisHistory();
  const [currentTime, setCurrentTime] = useState(new Date());
  const navigate = useNavigate();

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formattedDateTime = `${currentTime.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  })}, ${currentTime.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  })}`;

  const handleTopLogoClick = () => {
    if (isSidebarCollapsed && onOpenSidebar) {
      onOpenSidebar();
    } else {
      navigate("/workspace");
    }
  };

  return (
    <header className="sticky top-0 z-30 flex h-16 w-full flex-shrink-0 items-center justify-between border-b border-slate-200 bg-white/95 px-3 sm:px-5 backdrop-blur-md transition-colors duration-200 dark:border-dark-border dark:bg-dark-sidebar/95">
      {/* Left Side: AI Branding */}
      <div className="flex items-center space-x-2 sm:space-x-3">
        <button
          type="button"
          onClick={handleTopLogoClick}
          className="flex items-center space-x-3 text-left group cursor-pointer focus:outline-none"
          title="SatQuery AI Workspace"
        >
          <img
            src={theme === "dark" ? "/logo-dark.png" : "/logo-light.png"}
            alt="SatQuery AI Official Logo"
            className="h-10 w-10 sm:h-11 sm:w-11 rounded-xl object-contain shadow-xs transition-transform group-hover:scale-105 flex-shrink-0"
          />
          <div className="hidden xs:block">
            <span className="text-sm sm:text-base font-bold tracking-tight text-slate-900 dark:text-white leading-tight block">
              SatQuery AI
            </span>
            <p className="text-[10px] sm:text-[10.5px] font-semibold text-cyan-600 dark:text-cyan-400 leading-tight tracking-wide">
              Satellite Intelligence
            </p>
          </div>
        </button>
      </div>

      {/* Center: Live Date & Time */}
      <div className="hidden md:flex items-center space-x-2">
        <div className="flex items-center space-x-1.5 rounded-xl border border-slate-200/80 bg-slate-50/80 px-3 py-1.5 text-xs font-medium text-slate-600 dark:border-dark-border dark:bg-dark-bg/60 dark:text-slate-300 shadow-2xs">
          <Calendar className="h-3.5 w-3.5 text-slate-400" />
          <span>{formattedDateTime}</span>
        </div>
      </div>

      {/* Right Side: Actions & Theme Toggle */}
      <div className="flex items-center space-x-2 sm:space-x-3">
        {/* New Analysis Header Button */}
        <button
          type="button"
          onClick={() => {
            startNewAnalysis();
            navigate("/workspace");
          }}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200/90 bg-white hover:bg-slate-50 text-slate-700 dark:border-dark-border dark:bg-dark-card dark:hover:bg-dark-hover dark:text-slate-200 text-xs font-semibold shadow-2xs transition cursor-pointer"
          title="Start a new analysis query"
        >
          <Plus className="w-3.5 h-3.5 text-brand-600 dark:text-cyan-400" />
          <span className="hidden sm:inline">New Analysis</span>
        </button>

        {/* Dark / Light Mode Toggle */}
        <button
          type="button"
          onClick={toggleTheme}
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-600 transition hover:bg-slate-100 dark:border-dark-border dark:text-slate-300 dark:hover:bg-dark-hover cursor-pointer"
          title={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
        >
          {theme === "dark" ? (
            <Sun className="h-4 w-4 text-amber-400" />
          ) : (
            <Moon className="h-4 w-4 text-slate-600" />
          )}
        </button>
      </div>
    </header>
  );
}
