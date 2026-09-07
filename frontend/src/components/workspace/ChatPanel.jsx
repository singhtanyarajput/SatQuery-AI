import { useEffect, useRef, useState } from "react";
import { Sparkles, ChevronUp, ChevronDown, MessageSquare, ArrowRight, Send, ImagePlus } from "lucide-react";
import { extractErrorMessage, prepareUploadFiles } from "../../pages/GeospatialAnalysis";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "";

export default function ChatPanel({
  externalInput = "",
  onInputChange = () => {},
  onPipelineResult = () => {},
}) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [inputValue, setInputValue] = useState(externalInput || "");
  const [files, setFiles] = useState([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const [answer, setAnswer] = useState(null);
  const [audit, setAudit] = useState(null);
  const fileRef = useRef(null);

  const examplePrompts = [
    "What is the flood risk in this area?",
    "Show changes between T1 and T2",
    "Highlight industrial rooftops",
    "Analyze vegetation health (NDVI)",
  ];

  useEffect(() => {
    setInputValue(externalInput || "");
  }, [externalInput]);

  const handleSelectExample = (prompt) => {
    setInputValue(prompt);
    onInputChange(prompt);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!inputValue.trim()) return;
    setBusy(true);
    setError(null);
    const body = new FormData();
    body.append("query", inputValue.trim());
    const normalizedFiles = await prepareUploadFiles(files);
    if (normalizedFiles && normalizedFiles.length > 0) {
      for (const fileItem of normalizedFiles) {
        body.append("files", fileItem, fileItem.name || "satellite_scene.png");
      }
    }
    try {
      const res = await fetch(`${API_BASE}/api/v1/query`, {
        method: "POST",
        body,
      });
      const payload = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(extractErrorMessage(payload) || `Query failed (${res.status})`);
      }
      setAnswer(payload.answer);
      setAudit(payload.audit_summary);
      onPipelineResult(payload);
      window.dispatchEvent(
        new CustomEvent("satquery:analysis-complete", { detail: payload })
      );
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex h-full w-full flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition-colors dark:border-dark-border dark:bg-dark-card">
      <div className="flex items-center justify-between border-b border-slate-100 p-4 dark:border-dark-border">
        <div className="flex items-center space-x-2">
          <Sparkles className="h-4 w-4 text-brand-600 dark:text-brand-400" />
          <h2 className="text-sm font-bold text-slate-900 dark:text-white">
            AI Analysis Assistant
          </h2>
        </div>
        <button
          type="button"
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-dark-hover dark:hover:text-slate-200"
          title="Toggle Assistant Panel"
        >
          {isCollapsed ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
        </button>
      </div>

      {!isCollapsed && (
        <div className="flex flex-1 flex-col justify-between overflow-y-auto p-4">
          <div className="flex flex-col items-center pt-4">
            <div className="relative mb-3 flex items-center justify-center">
              <div className="absolute h-16 w-16 rounded-full bg-brand-500/15 blur-lg dark:bg-brand-500/25" />
              <div className="relative flex h-14 w-14 items-center justify-center rounded-full border border-brand-200/80 bg-brand-50 text-brand-600 shadow-inner dark:border-brand-800/80 dark:bg-brand-950/60 dark:text-brand-400">
                <MessageSquare className="h-6 w-6 fill-brand-600/20 text-brand-600 dark:text-brand-400" />
              </div>
            </div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              {answer ? "Analysis complete" : "Start a conversation"}
            </h3>
            <p className="mt-1.5 max-w-xs text-center text-xs leading-relaxed text-slate-500 dark:text-slate-400">
              {answer
                ? answer
                : "Ask a question and attach a GeoTIFF or PNG. The LangGraph orchestrator routes SAM, CD-VQA, fusion, and VLM specialists from /local_models/."}
            </p>
            {audit && (
              <p className="mt-2 text-center text-[11px] text-slate-500 dark:text-slate-400">
                Task: {audit.selected_task} · confidence {Number(audit.confidence_score || 0).toFixed(2)}
              </p>
            )}
            {error && (
              <p className="mt-2 text-center text-xs text-red-500">{error}</p>
            )}

            <div className="mt-6 w-full space-y-2">
              <p className="text-center text-xs font-semibold text-slate-700 dark:text-slate-300">
                Try these examples
              </p>
              <div className="space-y-2 pt-1">
                {examplePrompts.map((prompt, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleSelectExample(prompt)}
                    className="group flex w-full items-center justify-between rounded-xl border border-slate-200/80 bg-white p-2.5 text-left text-xs font-medium text-slate-700 shadow-2xs transition hover:border-brand-500/60 hover:bg-brand-50/40 hover:text-brand-900 dark:border-dark-border dark:bg-dark-bg/40 dark:text-slate-300 dark:hover:border-brand-600/60 dark:hover:bg-dark-hover dark:hover:text-brand-200"
                  >
                    <span>{prompt}</span>
                    <ArrowRight className="h-3.5 w-3.5 text-slate-400 transition-transform group-hover:translate-x-0.5 group-hover:text-brand-600 dark:group-hover:text-brand-400" />
                  </button>
                ))}
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="mt-4 pt-3">
            <input
              ref={fileRef}
              type="file"
              accept=".tif,.tiff,.gtiff,.png,.jpg,.jpeg"
              multiple
              className="hidden"
              onChange={(ev) => setFiles(Array.from(ev.target.files || []))}
            />
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="mb-2 flex w-full items-center justify-center gap-1.5 rounded-xl border border-dashed border-slate-300 px-3 py-2 text-[11px] font-medium text-slate-600 hover:border-brand-500 hover:text-brand-700 dark:border-dark-border dark:text-slate-300"
            >
              <ImagePlus className="h-3.5 w-3.5" />
              {files.length ? `${files.length} scene(s) attached` : "Attach GeoTIFF / PNG (T1, T2, SAR)"}
            </button>
            <div className="flex items-center space-x-2 rounded-xl border border-slate-200 bg-slate-50/80 px-3 py-2 shadow-inner focus-within:border-brand-500 focus-within:ring-2 focus-within:ring-brand-500/20 dark:border-dark-border dark:bg-dark-bg/60">
              <input
                type="text"
                placeholder="Ask anything about this area..."
                value={inputValue}
                onChange={(e) => {
                  setInputValue(e.target.value);
                  onInputChange(e.target.value);
                }}
                className="flex-1 bg-transparent text-xs text-slate-900 placeholder-slate-400 focus:outline-none dark:text-white"
              />
              <button
                type="submit"
                disabled={busy}
                className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg bg-brand-600 text-white shadow-xs transition hover:bg-brand-700 disabled:opacity-50"
              >
                <Send className="h-3.5 w-3.5" />
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
