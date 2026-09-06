import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Menu,
  ShieldCheck,
  Activity,
  Calendar,
  Sun,
  Moon,
  Bell,
  User,
  ChevronDown,
  Server,
  HardDrive,
  Cpu,
  CheckCircle2,
  X,
  ExternalLink,
  AlertTriangle
} from "lucide-react";
import { useTheme } from "../../context/ThemeContext";
import { MOCK_ALERTS } from "../../mock/mockData";

export default function TopNavbar({ onToggleSidebar, isSidebarCollapsed }) {
  const { theme, toggleTheme } = useTheme();
  const [currentTime, setCurrentTime] = useState(new Date());

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

  return (
    <>
      <header className="sticky top-0 z-30 flex h-16 w-full flex-shrink-0 items-center justify-between border-b border-slate-200 bg-white/95 px-4 backdrop-blur-md transition-colors duration-200 dark:border-dark-border dark:bg-dark-card/95">
        {/* Left Side: Collapse Toggle & Branding */}
        <div className="flex items-center space-x-3 sm:space-x-4">
          <button
            type="button"
            onClick={onToggleSidebar}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-600 transition hover:bg-slate-100 hover:text-slate-900 dark:border-dark-border dark:text-slate-300 dark:hover:bg-dark-hover dark:hover:text-white"
            title={isSidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            aria-label="Toggle sidebar"
          >
            <Menu className="h-5 w-5" />
          </button>

          <Link to="/workspace" className="flex items-center space-x-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-tr from-brand-600 to-cyan-500 shadow-sm shadow-brand-500/20 text-white">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-5 w-5"
              >
                <path d="M13 2 3 14h9l-1 8 10-12h-9l1-8z" />
              </svg>
            </div>
            <div>
              <div className="flex items-center space-x-1.5">
                <span className="text-base font-bold tracking-tight text-slate-900 dark:text-white">
                  SatQuery AI
                </span>
              </div>
              <p className="text-[11px] font-medium text-slate-400 dark:text-slate-400">
                Satellite Intelligence
              </p>
            </div>
          </Link>
        </div>

        {/* Center / Date & Time */}
        <div className="hidden items-center space-x-3 md:flex">
          <div className="flex items-center space-x-1.5 rounded-lg border border-slate-200/80 bg-slate-50/80 px-3 py-1.5 text-xs font-medium text-slate-600 dark:border-dark-border dark:bg-dark-bg/60 dark:text-slate-300">
            <Calendar className="h-3.5 w-3.5 text-slate-400" />
            <span>{formattedDateTime}</span>
          </div>
        </div>

        {/* Right Side: Theme Switch */}
        <div className="flex items-center space-x-2 sm:space-x-3">
          {/* Dark / Light Mode Toggle */}
          <button
            type="button"
            onClick={toggleTheme}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-600 transition hover:bg-slate-100 dark:border-dark-border dark:text-slate-300 dark:hover:bg-dark-hover"
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
    </>
  );
}
