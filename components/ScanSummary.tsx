// Copyright (c) 2024 Benedikt Pankratz — BUSL-1.1
import type { ScanReport } from "@/lib/types";

const SEVERITY_CFG = [
  { key: "critical", label: "CRITICAL", color: "text-red-400",    bg: "bg-red-950/40",    border: "border-red-800/40"    },
  { key: "high",     label: "HIGH",     color: "text-orange-400", bg: "bg-orange-950/40", border: "border-orange-800/40" },
  { key: "medium",   label: "MEDIUM",   color: "text-yellow-400", bg: "bg-yellow-950/40", border: "border-yellow-800/40" },
  { key: "low",      label: "LOW",      color: "text-blue-400",   bg: "bg-blue-950/40",   border: "border-blue-800/40"   },
] as const;

/** Returns "28 Feb 2026 · 14:30 CET / 08:30 ET" */
function formatDualTimezone(iso: string): { date: string; times: string } {
  const d = new Date(iso);
  const date = d.toLocaleDateString("en-GB", {
    timeZone: "Europe/Berlin",
    day: "2-digit", month: "short", year: "numeric",
  });
  const cet = d.toLocaleTimeString("en-GB", {
    timeZone: "Europe/Berlin",
    hour: "2-digit", minute: "2-digit", timeZoneName: "short",
  });
  const et = d.toLocaleTimeString("en-US", {
    timeZone: "America/New_York",
    hour: "2-digit", minute: "2-digit", timeZoneName: "short",
  });
  return { date, times: `${cet} / ${et}` };
}

export function ScanSummary({ report }: { report: ScanReport }) {
  const isClean    = report.affectedCount === 0;
  const totalVulns = Object.values(report.counts).reduce((a, b) => a + b, 0);
  const { date, times } = formatDualTimezone(report.scannedAt);

  return (
    <div className="rounded-xl border border-[#0d2b0d] bg-[#0a110a] p-5 space-y-4">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <p className="font-mono text-xs text-[#6aaa78] uppercase tracking-widest mb-1">Scan Complete</p>
          <h2 className={`text-2xl font-bold font-mono ${isClean ? "text-[#00e541]" : "text-red-400"}`}>
            {isClean ? "✓ All Clear" : `${report.affectedCount} Package${report.affectedCount !== 1 ? "s" : ""} Affected`}
          </h2>
          <p className="text-sm text-[#6aaa78] mt-1">
            {report.totalPackages} package{report.totalPackages !== 1 ? "s" : ""} scanned
            {!isClean && ` · ${totalVulns} total vulnerabilit${totalVulns !== 1 ? "ies" : "y"} found`}
          </p>
        </div>
        <div className="text-right">
          <p className="font-mono text-xs text-[#4a7a52]">{date}</p>
          <p className="font-mono text-xs text-[#4a7a52]">{times}</p>
          <p className="font-mono text-xs text-[#3a5a3a] mt-0.5">via OSV.dev</p>
        </div>
      </div>

      {!isClean && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {SEVERITY_CFG.map(({ key, label, color, bg, border }) => (
            <div key={key} className={`rounded-lg border ${border} ${bg} px-3 py-2.5 text-center`}>
              <p className={`font-mono text-lg font-bold ${color}`}>{report.counts[key]}</p>
              <p className={`font-mono text-[10px] tracking-widest ${color} opacity-80`}>{label}</p>
            </div>
          ))}
        </div>
      )}

      {isClean && (
        <div className="rounded-lg border border-[#0d3a0d] bg-[#071207] px-4 py-3">
          <p className="text-sm text-[#6aaa78] font-mono">No known vulnerabilities found. Keep dependencies up to date and re-scan regularly.</p>
        </div>
      )}
    </div>
  );
}
