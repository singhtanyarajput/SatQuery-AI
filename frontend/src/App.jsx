import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ThemeProvider } from "./context/ThemeContext";
import { AnalysisHistoryProvider } from "./context/AnalysisHistoryContext";
import AppLayout from "./components/layout/AppLayout";
import GeospatialAnalysis from "./pages/GeospatialAnalysis";
import Reports from "./pages/Reports";
import Settings from "./pages/Settings";
import HelpSupport from "./pages/HelpSupport";

export default function App() {
  return (
    <ThemeProvider>
      <AnalysisHistoryProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<AppLayout />}>
              <Route index element={<Navigate to="/workspace" replace />} />
              <Route path="workspace" element={<GeospatialAnalysis />} />
              <Route path="reports" element={<Reports />} />
              <Route path="settings" element={<Settings />} />
              <Route path="help" element={<HelpSupport />} />
              <Route path="*" element={<Navigate to="/workspace" replace />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </AnalysisHistoryProvider>
    </ThemeProvider>
  );
}
