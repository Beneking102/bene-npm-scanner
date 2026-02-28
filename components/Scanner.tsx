// Copyright (c) 2024 Benedikt Pankratz — BUSL-1.1
"use client";
import { useState, useCallback, useRef } from "react";
import { PackageCard } from "@/components/PackageCard";
import { ScanSummary } from "@/components/ScanSummary";
import type { ScanReport, Severity } from "@/lib/types";

const EXAMPLE_JSON = `{
  "dependencies": {
    "express": "4.17.1",
    "lodash": "4.17.20",
    "axios": "0.21.1",
    "next": "14.2.5"
  },
  "devDependencies": {
    "webpack": "4.44.2"
  }
}`;

type Filter = "ALL" | Severity | "CLEAN";
const FILTERS: Array<{ label: string; value: Filter }> = [
  { label: "All",      value: "ALL"      },
  { label: "Critical", value: "CRITICAL" },
  { label: "High",     value: "HIGH"     },
  { label: "Medium",   value: "MEDIUM"   },
  { label: "Low",      value: "LOW"      },
  { label: "Clean",    value: "CLEAN"    },
];

const SORDER: Record<string, number> = { CRITICAL: 5, HIGH: 4, MEDIUM: 3, LOW: 2, UNKNOWN: 1 };

function sortReport(report: ScanReport): ScanReport {
  return {
    ...report,
    packages: report.packages.slice().sort((a, b) => {
      if (a.vulnerabilities.length > 0 && b.vulnerabilities.length === 0) return -1;
      if (a.vulnerabilities.length === 0 && b.vulnerabilities.length > 0) return 1;
      return (SORDER[b.highestSeverity] ?? 0) - (SORDER[a.highestSeverity] ?? 0);
    }),
  };
}

export function Scanner() {
  const [input,     setInput]     = useState("");
  const [loading,   setLoading]   = useState(false);
  const [report,    setReport]    = useState<ScanReport | null>(null);
  const [error,     setError]     = useState<string | null>(null);
  const [filter,    setFilter]    = useState<Filter>("ALL");
  const [showClean, setShowClean] = useState(false);
  const [dragging,  setDragging]  = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const doScan = useCallback(async (text: string) => {
    setError(null);
    setReport(null);
    setFilter("ALL");

    let parsed: unknown;
    try {
      parsed = JSON.parse(text.trim());
    } catch {
      setError("Invalid JSON — please paste a valid package.json or package-lock.json.");
      return;
    }

    setLoading(true);
    try {
      const res  = await fetch("/api/scan", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ packageJson: parsed }),
      });
      const data = await res.json() as { ok: boolean; report?: ScanReport; error?: string };
      if (!data.ok || !data.report) {
        setError(data.error ?? "Scan failed. Please try again.");
        return;
      }
      setReport(sortReport(data.report));
    } catch (e) {
      console.error("[scanner] fetch error:", e);
      setError("Network error — could not reach the scanner API. Is the dev server running?");
    } finally {
      setLoading(false);
    }
  }, []);

  const loadExample = useCallback(() => {
    setInput(EXAMPLE_JSON);
    setError(null);
    doScan(EXAMPLE_JSON);
  }, [doScan]);

  const loadFileText = useCallback((file: File) => {
    if (!file.name.endsWith(".json")) {
      setError("Only .json files are accepted.");
      return;
    }
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = (ev.target?.result as string) ?? "";
      setInput(text);
      setError(null);
      if (text.trim()) doScan(text);
    };
    reader.onerror = () => setError("Could not read the file.");
    reader.readAsText(file);
  }, [doScan]);

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) loadFileText(file);
  }, [loadFileText]);

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) loadFileText(file);
    e.target.value = "";
  };

  const reset = () => {
    setInput(""); setReport(null); setError(null); setFilter("ALL");
    setTimeout(() => inputRef.current?.focus(), 50);
  };

  const hasInput = input.trim().length > 0;

  const displayPackages = report?.packages.filter((p) => {
    if (filter === "CLEAN") return p.vulnerabilities.length === 0;
    if (filter !== "ALL")   return p.highestSeverity === filter;
    return showClean ? true : p.vulnerabilities.length > 0;
  }) ?? [];

  return (
    <div className="w-full max-w-3xl mx-auto space-y-6">

      {/* ── Input ─────────────────────────────────────────────── */}
      {!report && (
        <div className="space-y-3">

          {/* Textarea / drop zone */}
          <div
            className={`relative rounded-xl border border-dashed transition-colors ${
              dragging
                ? "border-[#00e541]/60 bg-[#00e541]/5"
                : "border-[#0d2b0d] bg-[#080f08] hover:border-[#00e541]/20"
            }`}
            onDrop={onDrop}
            onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
          >
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => { setInput(e.target.value); setError(null); }}
              placeholder="Paste your package.json or package-lock.json here…"
              spellCheck={false}
              autoComplete="off"
              aria-label="Paste your package.json content here"
              className="w-full h-52 resize-none bg-transparent px-4 py-4 font-mono text-sm text-[#c8ffd4] placeholder-[#2a4a2a] focus:outline-none rounded-xl"
            />
            {!hasInput && (
              <div className="absolute inset-x-0 bottom-3 flex justify-center pointer-events-none">
                <p className="text-xs font-mono text-[#2a4a2a]">
                  ↑ paste · drag &amp; drop · or use the buttons below
                </p>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2.5 flex-wrap">

            {/* Primary: Scan */}
            <button
              onClick={() => doScan(input)}
              disabled={loading || !hasInput}
              title={!hasInput ? "Paste your package.json above first" : "Scan for vulnerabilities"}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-lg font-mono font-semibold text-sm transition-all duration-200 ${
                loading
                  ? "bg-[#0d2b0d] text-[#00e541] cursor-wait"
                  : !hasInput
                  ? "bg-[#0d2b0d] text-[#4a7a52] cursor-not-allowed opacity-60"
                  : "bg-[#00e541] text-[#030804] hover:bg-[#22ff6b] shadow-[0_0_16px_rgba(0,229,65,0.3)] hover:shadow-[0_0_24px_rgba(0,229,65,0.5)]"
              }`}
            >
              {loading
                ? <><span className="inline-block animate-spin">⟳</span> Scanning…</>
                : <>⬡ Scan</>
              }
            </button>

            {/* Upload file */}
            <label className="flex items-center gap-2 px-4 py-2.5 rounded-lg border border-[#0d2b0d] text-[#6aaa78] text-sm font-mono cursor-pointer hover:border-[#1a3a1a] hover:text-[#c8ffd4] transition-colors">
              <span>↑ Upload file</span>
              <input type="file" accept=".json" className="sr-only" onChange={onFileChange} aria-label="Upload package.json file" />
            </label>

            {/* Try example */}
            <button
              onClick={loadExample}
              disabled={loading}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-lg border border-dashed border-[#0d2b0d] text-[#4a7a52] text-sm font-mono hover:border-[#00e541]/30 hover:text-[#6aaa78] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              ◎ Try example
            </button>

            {/* Clear */}
            {hasInput && !loading && (
              <button
                onClick={() => { setInput(""); setError(null); }}
                className="text-xs font-mono text-[#4a7a52] hover:text-[#6aaa78] transition-colors ml-auto"
              >
                ✕ clear
              </button>
            )}
          </div>

          {/* Contextual hint */}
          {!hasInput && !error && (
            <p className="text-xs font-mono text-[#2a4a2a] px-1">
              Paste your{" "}
              <span className="text-[#4a7a52]">package.json</span> or{" "}
              <span className="text-[#4a7a52]">package-lock.json</span> into the box above,
              upload a file, or click <span className="text-[#4a7a52]">&quot;Try example&quot;</span> to see the scanner in action.
            </p>
          )}

          {/* Error */}
          {error && (
            <div role="alert" className="rounded-lg border border-red-800/40 bg-red-950/30 px-4 py-3 font-mono text-sm text-red-400">
              ⚠ {error}
            </div>
          )}

          {/* Info strip */}
          <div className="rounded-lg bg-[#0a110a] border border-[#0d2b0d] px-4 py-2.5 flex flex-wrap gap-x-6 gap-y-1">
            {["No data stored on server", "Powered by OSV.dev", "Rate limited per IP"].map((t) => (
              <span key={t} className="text-xs font-mono text-[#4a7a52] flex items-center gap-1.5">
                <span className="text-[#00e541]">✓</span> {t}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* ── Results ───────────────────────────────────────────── */}
      {report && (
        <div className="space-y-4">
          <ScanSummary report={report} />

          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex flex-wrap gap-1.5">
              {FILTERS.map(({ label, value }) => (
                <button
                  key={value}
                  onClick={() => setFilter(value)}
                  className={`px-3 py-1 rounded-full font-mono text-xs border transition-all duration-150 ${
                    filter === value
                      ? "bg-[#00e541] text-[#030804] border-[#00e541] shadow-[0_0_8px_rgba(0,229,65,0.4)]"
                      : "border-[#0d2b0d] text-[#6aaa78] hover:border-[#1a3a1a] hover:text-[#c8ffd4]"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-3">
              {filter === "ALL" && report.affectedCount < report.totalPackages && (
                <button
                  onClick={() => setShowClean((s) => !s)}
                  className="text-xs font-mono text-[#4a7a52] hover:text-[#6aaa78] transition-colors"
                >
                  {showClean ? "▾ hide clean" : "▸ show clean"}
                </button>
              )}
              <button onClick={reset} className="text-xs font-mono text-[#4a7a52] hover:text-[#00e541] transition-colors">
                ← new scan
              </button>
            </div>
          </div>

          <div className="space-y-2">
            {displayPackages.length === 0 ? (
              <p className="text-center font-mono text-sm text-[#4a7a52] py-8">
                No packages match this filter.
              </p>
            ) : (
              displayPackages.map((pkg, i) => (
                <PackageCard key={`${pkg.name}@${pkg.version}`} pkg={pkg} index={i} />
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
