import React, { createContext, useContext, useState, useEffect } from "react";

const STORAGE_KEY = "satquery_history";

const AnalysisHistoryContext = createContext(null);

export function formatRelativeTime(isoString) {
  if (!isoString) return "Recently";
  const date = new Date(isoString);
  const now = new Date();
  const diffSec = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffSec < 45) return "Just now";
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHours = Math.floor(diffMin / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function sanitizeSession(s) {
  if (!s || typeof s !== "object") return null;
  try {
    const rawAnalysis = s.analysisData || {};
    const sanitizedAnalysis = {
      id: String(rawAnalysis.id || s.id || `SQ-${Date.now()}`),
      traceId: String(rawAnalysis.traceId || ""),
      detectedTask: String(rawAnalysis.detectedTask || s.task_type || "Analysis"),
      selectedWorkflow: String(rawAnalysis.selectedWorkflow || "RS-Grounding-V3"),
      inputModality: String(rawAnalysis.inputModality || "Optical RGB"),
      confidence: Number(rawAnalysis.confidence || 90),
      evidenceType: String(rawAnalysis.evidenceType || "Visual Evidence Mask"),
      baseImage: typeof rawAnalysis.baseImage === "string" ? rawAnalysis.baseImage : "/satellite/water-optical.jpg",
      evidenceImage: typeof rawAnalysis.evidenceImage === "string" ? rawAnalysis.evidenceImage : "/satellite/grounding.jpg",
      location: String(rawAnalysis.location || "Geospatial AOI"),
      headline: String(rawAnalysis.headline || "Analysis Completed"),
      answer: String(rawAnalysis.answer || "Autonomous satellite intelligence analysis completed."),
      keyFindings: Array.isArray(rawAnalysis.keyFindings) ? rawAnalysis.keyFindings.map(String) : [],
      metrics: Array.isArray(rawAnalysis.metrics)
        ? rawAnalysis.metrics.map((m) => ({
            label: String(m?.label || ""),
            value: String(m?.value || ""),
          }))
        : [],
      suggestedFollowUps: Array.isArray(rawAnalysis.suggestedFollowUps)
        ? rawAnalysis.suggestedFollowUps.map(String)
        : [],
      geojson:
        rawAnalysis.geojson && typeof rawAnalysis.geojson === "object"
          ? {
              type: String(rawAnalysis.geojson.type || "FeatureCollection"),
              properties: rawAnalysis.geojson.properties ? { ...rawAnalysis.geojson.properties } : {},
              features: Array.isArray(rawAnalysis.geojson.features)
                ? rawAnalysis.geojson.features.map((f) => ({
                    type: "Feature",
                    id: f?.id ? String(f.id) : undefined,
                    geometry: f?.geometry ? { ...f.geometry } : null,
                    properties: f?.properties ? { ...f.properties } : {},
                  }))
                : [],
            }
          : null,
    };

    return {
      id: String(s.id),
      query: String(s.query || ""),
      timestamp: String(s.timestamp || new Date().toISOString()),
      task_type: String(s.task_type || "Analysis"),
      features_count: Number(s.features_count || 0),
      confidence: Number(s.confidence || 0.9),
      analysisData: sanitizedAnalysis,
    };
  } catch (err) {
    console.warn("Error sanitizing session for storage:", err);
    return null;
  }
}

export function AnalysisHistoryProvider({ children }) {
  const [sessions, setSessions] = useState(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) return parsed.map(sanitizeSession).filter(Boolean);
      }
    } catch (err) {
      console.warn("Failed to load satquery_history from localStorage:", err);
    }
    return [];
  });

  const [activeSessionId, setActiveSessionId] = useState(null);

  // Synchronize with backend PostGIS /api/v1/history on mount
  useEffect(() => {
    let mounted = true;
    const API_BASE = import.meta.env.VITE_API_BASE_URL || "";
    const endpoint = API_BASE ? `${API_BASE}/api/v1/history` : "/api/v1/history";

    const fetchHistory = async () => {
      try {
        let res = await fetch(endpoint).catch(() => null);
        if (!res || !res.ok) {
          // Fallback to absolute localhost:8000
          res = await fetch("http://localhost:8000/api/v1/history").catch(() => null);
        }
        if (!res || !res.ok) return;

        const data = await res.json();
        if (!mounted || !data) return;

        const rawList = Array.isArray(data.sessions)
          ? data.sessions
          : Array.isArray(data)
          ? data
          : [];
        const remoteSessions = rawList.map(sanitizeSession).filter(Boolean);

        if (remoteSessions.length > 0) {
          setSessions((prev) => {
            const map = new Map();
            // Start with remote sessions from DB
            remoteSessions.forEach((s) => map.set(s.id, s));
            // Layer local sessions that might be newer or offline
            prev.forEach((s) => {
              if (!map.has(s.id)) {
                map.set(s.id, s);
              }
            });
            return Array.from(map.values()).sort(
              (a, b) => new Date(b.timestamp || 0).getTime() - new Date(a.timestamp || 0).getTime()
            );
          });
        }
      } catch (err) {
        console.warn("Could not sync with backend history:", err);
      }
    };

    fetchHistory();
    return () => {
      mounted = false;
    };
  }, []);

  // Sync to localStorage on sessions update with strict plain JSON primitive sanitization
  useEffect(() => {
    try {
      const sanitized = sessions
        .slice(0, 30)
        .map(sanitizeSession)
        .filter(Boolean);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(sanitized));
    } catch (err) {
      console.warn("Failed to save satquery_history to localStorage:", err);
    }
  }, [sessions]);

  const activeSession = sessions.find((s) => s.id === activeSessionId) || null;

  const addSession = (sessionRecord) => {
    if (!sessionRecord || !sessionRecord.id) return;
    setSessions((prev) => {
      const filtered = prev.filter((s) => s.id !== sessionRecord.id);
      return [sessionRecord, ...filtered];
    });
    setActiveSessionId(sessionRecord.id);

    // Also dispatch event for any legacy listeners
    try {
      window.dispatchEvent(
        new CustomEvent("satquery:analysis-complete", {
          detail: sessionRecord.analysisData || sessionRecord,
        })
      );
    } catch (e) {
      // ignore
    }
  };

  const selectSession = (sessionId) => {
    setActiveSessionId(sessionId);
  };

  const startNewAnalysis = () => {
    setActiveSessionId(null);
  };

  const deleteSession = (sessionId) => {
    setSessions((prev) => prev.filter((s) => s.id !== sessionId));
    if (activeSessionId === sessionId) {
      setActiveSessionId(null);
    }
    // Delete from backend in background
    try {
      const API_BASE = import.meta.env.VITE_API_BASE_URL || "";
      const endpoint = API_BASE ? `${API_BASE}/api/v1/history/${sessionId}` : `/api/v1/history/${sessionId}`;
      fetch(endpoint, { method: "DELETE" }).catch(() => {
        fetch(`http://localhost:8000/api/v1/history/${sessionId}`, { method: "DELETE" }).catch(() => {});
      });
    } catch (e) {
      // ignore
    }
  };

  const clearAllSessions = () => {
    setSessions([]);
    setActiveSessionId(null);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (e) {
      // ignore
    }
  };

  return (
    <AnalysisHistoryContext.Provider
      value={{
        sessions,
        activeSession,
        activeSessionId,
        addSession,
        selectSession,
        startNewAnalysis,
        deleteSession,
        clearAllSessions,
        formatRelativeTime,
      }}
    >
      {children}
    </AnalysisHistoryContext.Provider>
  );
}

export function useAnalysisHistory() {
  const ctx = useContext(AnalysisHistoryContext);
  if (!ctx) {
    throw new Error("useAnalysisHistory must be used within an AnalysisHistoryProvider");
  }
  return ctx;
}
