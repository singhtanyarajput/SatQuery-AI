import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Calendar,
  Sun,
  Moon,
} from "lucide-react";
import { useTheme } from "../../context/ThemeContext";

export default function TopNavbar({ onToggleSidebar, onOpenSidebar, isSidebarCollapsed }) {
  const { theme, toggleTheme } = useTheme();
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
          className="flex items-center space-x-2.5 text-left group cursor-pointer focus:outline-none"
          title="SatQuery AI Workspace"
        >
          <div className="flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-brand-600 to-cyan-500 shadow-sm shadow-brand-500/20 text-white group-hover:scale-105 transition-transform">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-4.5 w-4.5"
            >
              <path d="M13 2 3 14h9l-1 8 10-12h-9l1-8z" />
            </svg>
          </div>
          <div className="hidden xs:block">
            <span className="text-sm font-bold tracking-tight text-slate-900 dark:text-white leading-tight block">
              SatQuery AI
            </span>
            <p className="text-[10px] font-medium text-slate-400 dark:text-slate-400 leading-tight">
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

      {/* Right Side: Theme Toggle */}
      <div className="flex items-center space-x-2 sm:space-x-3">
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
