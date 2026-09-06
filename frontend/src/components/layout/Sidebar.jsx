import React, { useState, useRef, useEffect } from "react";
import { NavLink, Link, useLocation, useNavigate } from "react-router-dom";
import {
  Map,
  FileText,
  Settings,
  HelpCircle,
  Server,
  LogOut,
  ChevronUp,
  Cpu,
  Activity,
  X,
  Menu,
  Plus,
  Clock,
  Trash2,
  Crosshair,
  Waves,
  Radio,
  MessageSquare,
} from "lucide-react";
import { useAnalysisHistory } from "../../context/AnalysisHistoryContext";

export default function Sidebar({ isCollapsed, onToggle, onClose }) {
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showSystemModal, setShowSystemModal] = useState(false);
  const profileMenuRef = useRef(null);
  const location = useLocation();
  const navigate = useNavigate();
  const {
    sessions,
    activeSessionId,
    selectSession,
    startNewAnalysis,
    deleteSession,
    formatRelativeTime,
  } = useAnalysisHistory();

  // Close profile menu on outside click
  useEffect(() => {
    function handleClickOutside(event) {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target)) {
        setShowProfileMenu(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const mainNavItems = [
    {
      name: "Geospatial AI Analysis",
      path: "/workspace",
      icon: Map,
      highlight: true,
    },
    {
      name: "Reports & History",
      path: "/reports",
      icon: FileText,
    },
  ];

  return (
    <>
      <aside
        className={`relative z-40 flex flex-col h-full flex-shrink-0 border-r border-slate-200 bg-white transition-all duration-300 dark:border-dark-border dark:bg-dark-sidebar ${
          isCollapsed ? "w-20" : "w-64"
        }`}
      >
        {/* Top Branding Area inside sidebar */}
        <div className="flex h-16 items-center justify-between border-b border-slate-100 px-3.5 dark:border-dark-border">
          {isCollapsed ? (
            <button
              type="button"
              onClick={onToggle}
              className="mx-auto flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-brand-600 to-cyan-500 shadow-md shadow-brand-500/20 text-white transition-transform hover:scale-105 cursor-pointer"
              title="Open sidebar"
              aria-label="Open sidebar"
            >
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
            </button>
          ) : (
            <>
              <NavLink to="/workspace" className="flex items-center space-x-2.5 overflow-hidden">
                <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-tr from-brand-600 to-cyan-500 shadow-md shadow-brand-500/20 text-white">
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
                <div className="flex flex-col">
                  <span className="text-sm font-bold tracking-tight text-slate-900 dark:text-white leading-tight">
                    SatQuery AI
                  </span>
                  <span className="text-[10px] font-medium text-slate-400 leading-tight">
                    Satellite Intelligence
                  </span>
                </div>
              </NavLink>

              {/* Mark symbol (Hamburger menu icon) to close sidebar */}
              <button
                type="button"
                onClick={onClose || onToggle}
                className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg border border-slate-200 text-slate-600 transition hover:bg-slate-100 hover:text-slate-900 dark:border-dark-border dark:text-slate-300 dark:hover:bg-dark-hover dark:hover:text-white cursor-pointer"
                title="Close sidebar"
                aria-label="Close sidebar"
              >
                <Menu className="h-4.5 w-4.5" />
              </button>
            </>
          )}
        </div>

        {/* Main Nav Items & Recent Sessions */}
        <div className="flex flex-1 flex-col justify-between p-3.5 overflow-hidden">
          <nav className="space-y-1">
            {mainNavItems.map((item) => {
              const Icon = item.icon;
              // If this is Geospatial AI Analysis on /workspace or /, mark active
              const isGeospatial = item.name === "Geospatial AI Analysis";
              const isActive = isGeospatial
                ? location.pathname === "/workspace" || location.pathname === "/"
                : location.pathname === item.path && item.name !== "Dashboard";

              return (
                <NavLink
                  key={item.name}
                  to={item.path}
                  className={`group flex items-center rounded-xl px-3.5 py-2.5 text-xs font-semibold transition-all duration-150 ${
                    isActive
                      ? "bg-brand-600 text-white shadow-sm shadow-brand-600/30 dark:bg-brand-600 dark:text-white"
                      : "text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-dark-hover dark:hover:text-white"
                  } ${isCollapsed ? "justify-center px-2" : "justify-between"}`}
                  title={isCollapsed ? item.name : undefined}
                >
                  <div className="flex items-center space-x-3">
                    <Icon className="h-4.5 w-4.5 flex-shrink-0" />
                    {!isCollapsed && <span>{item.name}</span>}
                  </div>

                  {!isCollapsed && item.badge && (
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold text-white shadow-2xs">
                      {item.badge}
                    </span>
                  )}
                </NavLink>
              );
            })}
          </nav>

          {/* New Analysis Quick Action */}
          <div className="py-2">
            {isCollapsed ? (
              <button
                type="button"
                onClick={() => {
                  startNewAnalysis();
                  navigate("/workspace");
                }}
                className="mx-auto flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200/90 bg-white hover:bg-slate-100 text-slate-700 dark:border-dark-border dark:bg-dark-card dark:hover:bg-dark-hover dark:text-slate-200 transition cursor-pointer"
                title="New Analysis"
              >
                <Plus className="h-4 w-4 text-brand-600 dark:text-cyan-400" />
              </button>
            ) : (
              <button
                type="button"
                onClick={() => {
                  startNewAnalysis();
                  navigate("/workspace");
                }}
                className="flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200/90 bg-white hover:bg-slate-50 text-slate-800 dark:border-dark-border dark:bg-dark-card dark:hover:bg-dark-hover dark:text-slate-100 px-3 py-2 text-xs font-semibold shadow-2xs transition cursor-pointer group"
              >
                <Plus className="w-3.5 h-3.5 text-brand-600 dark:text-cyan-400 group-hover:rotate-90 transition-transform" />
                <span>New Analysis</span>
              </button>
            )}
          </div>

          {/* ChatGPT / Gemini-Style Recent Sessions Drawer */}
          {!isCollapsed && (
            <div className="flex flex-col flex-1 min-h-0 pt-2 border-t border-slate-100 dark:border-dark-border">
              <div className="flex items-center justify-between px-2 pb-1.5 text-[11px] font-semibold tracking-wider text-slate-400 uppercase">
                <div className="flex items-center gap-1.5">
                  <Clock className="w-3 h-3 text-slate-400" />
                  <span>Recent Analyses</span>
                </div>
                {sessions.length > 0 && (
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-full bg-slate-100 dark:bg-dark-hover text-slate-500">
                    {sessions.length}
                  </span>
                )}
              </div>

              <div className="flex-1 overflow-y-auto space-y-1 pr-1 custom-scrollbar">
                {sessions.length === 0 ? (
                  <div className="px-2 py-4 text-center text-xs text-slate-400 dark:text-slate-500">
                    No recent analyses yet.
                  </div>
                ) : (
                  sessions.map((session) => {
                    const isSelected = activeSessionId === session.id;
                    const taskLower = (session.task_type || "").toLowerCase();

                    let TaskIcon = MessageSquare;
                    let iconColor = "text-slate-400";
                    if (taskLower.includes("grounding")) {
                      TaskIcon = Crosshair;
                      iconColor = "text-cyan-500";
                    } else if (taskLower.includes("flood") || taskLower.includes("change")) {
                      TaskIcon = Waves;
                      iconColor = "text-rose-500";
                    } else if (taskLower.includes("cross") || taskLower.includes("sar")) {
                      TaskIcon = Radio;
                      iconColor = "text-amber-500";
                    }

                    return (
                      <div
                        key={session.id}
                        onClick={() => {
                          selectSession(session.id);
                          navigate("/workspace");
                        }}
                        className={`group relative flex items-start gap-2 rounded-xl px-2.5 py-2 text-xs transition cursor-pointer ${
                          isSelected
                            ? "bg-slate-100 text-slate-900 font-semibold dark:bg-dark-hover dark:text-white"
                            : "text-slate-600 hover:bg-slate-50 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-dark-hover/60 dark:hover:text-slate-200"
                        }`}
                      >
                        <TaskIcon className={`w-3.5 h-3.5 mt-0.5 flex-shrink-0 ${iconColor}`} />
                        <div className="flex-1 min-w-0">
                          <p className="truncate text-xs leading-snug">
                            {session.query || "Satellite Analysis"}
                          </p>
                          <span className="text-[10px] text-slate-400 font-mono">
                            {formatRelativeTime(session.timestamp)}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteSession(session.id);
                          }}
                          className="opacity-0 group-hover:opacity-100 p-0.5 hover:text-rose-500 text-slate-400 transition"
                          title="Delete session"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}
        </div>

        {/* Operator Profile Widget at Bottom of Sidebar */}
        <div className="relative border-t border-slate-100 p-3 dark:border-dark-border" ref={profileMenuRef}>
          {/* Popover Menu */}
          {showProfileMenu && (
            <div
              className={`absolute bottom-full mb-2 ${
                isCollapsed ? "left-full ml-2 w-64" : "left-2 right-2"
              } rounded-2xl border border-slate-200 bg-white p-2 shadow-2xl dark:border-dark-border dark:bg-dark-card z-50 animate-in fade-in zoom-in-95 duration-150`}
            >
              {/* Profile Header */}
              <div className="border-b border-slate-100 p-2.5 dark:border-dark-border">
                <div className="flex items-center justify-between text-xs font-bold text-slate-900 dark:text-white">
                  <span>Operator</span>
                  <span className="rounded bg-blue-100 px-1.5 py-0.5 font-mono text-[10px] text-blue-700 dark:bg-blue-950 dark:text-blue-300">
                    Air-Gapped
                  </span>
                </div>
                <div className="mt-0.5 text-[11px] text-slate-400">analyst@isro.gov.in</div>
              </div>

              {/* Menu Links */}
              <div className="mt-1 space-y-0.5">
                <Link
                  to="/settings"
                  onClick={() => setShowProfileMenu(false)}
                  className="flex w-full items-center space-x-2.5 rounded-xl px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-dark-hover transition"
                >
                  <Settings className="h-4 w-4 text-slate-500 dark:text-slate-400" />
                  <span>Settings</span>
                </Link>

                <Link
                  to="/help"
                  onClick={() => setShowProfileMenu(false)}
                  className="flex w-full items-center space-x-2.5 rounded-xl px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-dark-hover transition"
                >
                  <HelpCircle className="h-4 w-4 text-slate-500 dark:text-slate-400" />
                  <span>Help & Support</span>
                </Link>

                <button
                  type="button"
                  onClick={() => {
                    setShowProfileMenu(false);
                    setShowSystemModal(true);
                  }}
                  className="flex w-full items-center space-x-2.5 rounded-xl px-3 py-2 text-left text-xs font-medium text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-dark-hover transition cursor-pointer"
                >
                  <Server className="h-4 w-4 text-brand-600 dark:text-brand-400" />
                  <span>System Status & Nodes</span>
                </button>

                <div className="my-1 border-t border-slate-100 dark:border-dark-border" />

                <button
                  type="button"
                  onClick={() => setShowProfileMenu(false)}
                  className="flex w-full items-center space-x-2.5 rounded-xl px-3 py-2 text-left text-xs font-medium text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/40 transition cursor-pointer"
                >
                  <LogOut className="h-4 w-4 text-red-500" />
                  <span>Log out</span>
                </button>
              </div>
            </div>
          )}

          {/* Trigger Button */}
          <button
            type="button"
            onClick={() => setShowProfileMenu(!showProfileMenu)}
            className={`flex w-full items-center rounded-xl p-2 text-left transition hover:bg-slate-100 dark:hover:bg-dark-hover cursor-pointer ${
              isCollapsed ? "justify-center" : "justify-between space-x-3"
            }`}
            title={isCollapsed ? "Operator (Settings & Help)" : undefined}
          >
            <div className="flex min-w-0 items-center space-x-3">
              <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-brand-600 text-xs font-bold text-white shadow-xs">
                OP
              </div>
              {!isCollapsed && (
                <div className="min-w-0 flex-1">
                  <div className="truncate text-xs font-semibold text-slate-900 dark:text-white">
                    Operator
                  </div>
                  <div className="truncate text-[10px] text-slate-400">
                    Lead EO Analyst
                  </div>
                </div>
              )}
            </div>
            {!isCollapsed && (
              <ChevronUp
                className={`h-4 w-4 text-slate-400 transition-transform ${
                  showProfileMenu ? "rotate-180" : ""
                }`}
              />
            )}
          </button>
        </div>
      </aside>

      {/* System Status Modal */}
      {showSystemModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-dark-border dark:bg-dark-card">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4 dark:border-dark-border">
              <div className="flex items-center space-x-2.5">
                <div className="rounded-lg bg-emerald-100 p-2 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400">
                  <Activity className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    Air-Gapped System Diagnostics
                  </h3>
                  <p className="text-xs text-slate-500">Autonomous Edge Node Telemetry</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowSystemModal(false)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-dark-hover cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-5 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-xl border border-slate-100 bg-slate-50/50 p-3 dark:border-dark-border dark:bg-dark-bg/40">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-slate-500">Node Cluster</span>
                    <span className="flex h-2 w-2 rounded-full bg-emerald-500 ring-4 ring-emerald-500/20" />
                  </div>
                  <p className="mt-1 text-sm font-bold text-slate-900 dark:text-white">Active (3/3)</p>
                  <p className="text-[11px] text-slate-400">ISRO Ground Stn Alpha</p>
                </div>

                <div className="rounded-xl border border-slate-100 bg-slate-50/50 p-3 dark:border-dark-border dark:bg-dark-bg/40">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-slate-500">GPU VRAM</span>
                    <Cpu className="h-3.5 w-3.5 text-brand-600" />
                  </div>
                  <p className="mt-1 text-sm font-bold text-slate-900 dark:text-white">18.4 / 24 GB</p>
                  <p className="text-[11px] text-slate-400">NVIDIA RTX 4090 D</p>
                </div>
              </div>

              <div className="rounded-xl border border-slate-100 p-3 dark:border-dark-border dark:bg-dark-bg/20">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-700 dark:text-slate-300">Local Cache</span>
                  <span className="font-mono text-slate-500">78.5 GB / 500 GB</span>
                </div>
                <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-dark-border">
                  <div className="h-full w-[16%] rounded-full bg-brand-600" />
                </div>
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <button
                type="button"
                onClick={() => setShowSystemModal(false)}
                className="rounded-xl bg-brand-600 px-4 py-2 text-xs font-semibold text-white transition hover:bg-brand-700 shadow-sm cursor-pointer"
              >
                Close Diagnostics
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
