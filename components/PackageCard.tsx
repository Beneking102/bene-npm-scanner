// Copyright (c) 2024 Benedikt Pankratz — BUSL-1.1
"use client";
import { useState } from "react";
import { SeverityBadge } from "@/components/SeverityBadge";
import { VulnCard }      from "@/components/VulnCard";
import type { PackageResult } from "@/lib/types";

export function PackageCard({ pkg, index }: { pkg: PackageResult; index: number }) {
  const [open, setOpen] = useState(pkg.vulnerabilities.length > 0);
  const isClean = pkg.vulnerabilities.length === 0;

  return (
    <div
      className={`rounded-xl border transition-all duration-200 overflow-hidden opacity-0 animate-in ${isClean ? "border-[#0d2b0d] bg-[#080f08]/60" : "border-[#1a2a0d] bg-[#0a110a]"}`}
      style={{ animationDelay: `${index * 40}ms`, animationFillMode: "forwards" }}
    >
      <button
        className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-[#0d1a0d]/50 transition-colors"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        disabled={isClean}
      >
        <span className={`w-2 h-2 rounded-full flex-shrink-0 ${isClean ? "bg-[#00e541]" : "bg-red-500 animate-pulse"}`} />
        <div className="flex-1 min-w-0 flex items-baseline gap-2 flex-wrap">
          <span className="font-mono font-semibold text-sm text-[#c8ffd4] truncate">{pkg.name}</span>
          <span className="font-mono text-xs text-[#4a7a52]">v{pkg.version}</span>
          {pkg.isDev && <span className="text-[10px] font-mono text-[#6aaa78] bg-[#0d2b0d] px-1.5 py-0.5 rounded border border-[#1a3a1a]">DEV</span>}
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {isClean ? (
            <span className="text-xs font-mono text-[#00e541]">✓ CLEAN</span>
          ) : (
            <>
              <SeverityBadge severity={pkg.highestSeverity} size="sm" />
              <span className="font-mono text-xs text-[#6aaa78]">{pkg.vulnerabilities.length} vuln{pkg.vulnerabilities.length !== 1 ? "s" : ""}</span>
              <span className={`text-xs text-[#6aaa78] transition-transform duration-200 ${open ? "rotate-90" : ""}`}>▶</span>
            </>
          )}
        </div>
      </button>

      {open && !isClean && (
        <div className="border-t border-[#0d2b0d] px-4 py-3 space-y-2">
          {pkg.vulnerabilities.map((v) => <VulnCard key={v.id} vuln={v} />)}
        </div>
      )}
    </div>
  );
}
