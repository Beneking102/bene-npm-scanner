// Copyright (c) 2024 Benedikt Pankratz — BUSL-1.1
import type { Severity } from "@/lib/types";

const CFG: Record<Severity, { label: string; cls: string; dot: string }> = {
  CRITICAL: { label: "CRITICAL", cls: "bg-red-950/60 text-red-400 border-red-700/50",       dot: "bg-red-400"    },
  HIGH:     { label: "HIGH",     cls: "bg-orange-950/60 text-orange-400 border-orange-700/50", dot: "bg-orange-400" },
  MEDIUM:   { label: "MEDIUM",  cls: "bg-yellow-950/60 text-yellow-400 border-yellow-700/50", dot: "bg-yellow-400" },
  LOW:      { label: "LOW",     cls: "bg-blue-950/60 text-blue-400 border-blue-700/50",       dot: "bg-blue-400"   },
  UNKNOWN:  { label: "UNKNOWN", cls: "bg-gray-900/60 text-gray-400 border-gray-700/50",       dot: "bg-gray-400"   },
};

export function SeverityBadge({ severity, size = "md" }: { severity: Severity; size?: "sm" | "md" }) {
  const { label, cls, dot } = CFG[severity];
  const px = size === "sm" ? "px-1.5 py-0.5 text-[10px]" : "px-2.5 py-1 text-xs";
  return (
    <span className={`inline-flex items-center gap-1.5 rounded border font-mono font-semibold tracking-widest ${px} ${cls}`} aria-label={`Severity: ${label}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${dot}`} />
      {label}
    </span>
  );
}
