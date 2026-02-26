// Copyright (c) 2024 Benedikt Pankratz — BUSL-1.1
"use client";
import { useState } from "react";
import { SeverityBadge } from "@/components/SeverityBadge";
import type { VulnerabilityEntry } from "@/lib/types";

export function VulnCard({ vuln }: { vuln: VulnerabilityEntry }) {
  const [open, setOpen] = useState(false);
  const displayId = vuln.aliases.find((a) => a.startsWith("CVE-")) ?? vuln.id;

  return (
    <div className="border border-[#0d2b0d] bg-[#0a110a] rounded-lg overflow-hidden hover:border-[#1a3a1a] transition-colors">
      <button className="w-full flex items-start gap-3 p-4 text-left hover:bg-[#0d1a0d] transition-colors" onClick={() => setOpen((o) => !o)} aria-expanded={open}>
        <span className={`mt-0.5 text-[#00e541] text-xs transition-transform duration-200 flex-shrink-0 ${open ? "rotate-90" : ""}`}>▶</span>
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <SeverityBadge severity={vuln.severity} size="sm" />
            <span className="font-mono text-xs text-[#6aaa78]">{displayId}</span>
            {vuln.cvssScore && (
              <span className="font-mono text-xs bg-[#0d2b0d] text-[#c8ffd4] px-1.5 py-0.5 rounded border border-[#1a3a1a]">
                CVSS {vuln.cvssScore}
              </span>
            )}
            {vuln.cweIds.map((c) => <span key={c} className="font-mono text-xs text-[#6aaa78]">{c}</span>)}
          </div>
          <p className="text-sm text-[#c8ffd4] leading-snug">{vuln.summary}</p>
          {vuln.fixedIn && <p className="text-xs text-[#00e541] mt-1 font-mono">✓ Fix available in v{vuln.fixedIn}</p>}
        </div>
      </button>

      {open && (
        <div className="border-t border-[#0d2b0d] px-4 py-3 space-y-3">
          {vuln.details && (
            <div>
              <p className="text-xs font-mono text-[#6aaa78] uppercase tracking-widest mb-1">Details</p>
              <p className="text-sm text-[#a0d4a8] leading-relaxed whitespace-pre-wrap">
                {vuln.details.slice(0, 800)}{vuln.details.length > 800 && "…"}
              </p>
            </div>
          )}
          {vuln.aliases.length > 0 && (
            <div>
              <p className="text-xs font-mono text-[#6aaa78] uppercase tracking-widest mb-1">Aliases</p>
              <div className="flex flex-wrap gap-1.5">
                {vuln.aliases.map((a) => (
                  <span key={a} className="font-mono text-xs bg-[#0d2b0d] text-[#c8ffd4] px-2 py-0.5 rounded border border-[#1a3a1a]">{a}</span>
                ))}
              </div>
            </div>
          )}
          {vuln.references.length > 0 && (
            <div>
              <p className="text-xs font-mono text-[#6aaa78] uppercase tracking-widest mb-1">References</p>
              <ul className="space-y-1">
                {vuln.references.slice(0, 5).map((r) => (
                  <li key={r.url}>
                    <a href={r.url} target="_blank" rel="noopener noreferrer" className="text-xs font-mono text-[#00e541] hover:text-[#6aff8a] underline underline-offset-2 break-all">
                      {r.url}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          )}
          {vuln.publishedAt && (
            <p className="text-xs font-mono text-[#4a7a52]">Published: {new Date(vuln.publishedAt).toLocaleDateString("en-GB")}</p>
          )}
        </div>
      )}
    </div>
  );
}
