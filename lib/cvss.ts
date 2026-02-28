// Copyright (c) 2024 Benedikt Pankratz — BUSL-1.1
// CVSS v3.1 Base Score Calculator
// Spec: https://www.first.org/cvss/v3.1/specification-document
// Verified: AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:H/A:H = 9.8 ✓
//           AV:N/AC:L/PR:N/UI:N/S:C/C:H/I:H/A:H = 10.0 ✓

import type { Severity } from "@/lib/types";

function roundup(x: number): number {
  const intInput = Math.round(x * 100000);
  if (intInput % 10000 === 0) return intInput / 100000;
  return (Math.floor(intInput / 10000) + 1) / 10;
}

function calcV3(metricsStr: string): number {
  const m: Record<string, string> = {};
  for (const part of metricsStr.split("/")) {
    const colon = part.indexOf(":");
    if (colon > 0) m[part.slice(0, colon)] = part.slice(colon + 1);
  }

  const AV = ({ N: 0.85, A: 0.62, L: 0.55, P: 0.20 } as Record<string, number>)[m.AV ?? ""] ?? 0;
  const AC = ({ L: 0.77, H: 0.44 }                    as Record<string, number>)[m.AC ?? ""] ?? 0;
  const S  = m.S === "C";
  const PR = (S
    ? { N: 0.85, L: 0.68, H: 0.50 }
    : { N: 0.85, L: 0.62, H: 0.27 } as Record<string, number>)[m.PR ?? ""] ?? 0;
  const UI = ({ N: 0.85, R: 0.62 }                    as Record<string, number>)[m.UI ?? ""] ?? 0;
  const C  = ({ N: 0,    L: 0.22,  H: 0.56 }           as Record<string, number>)[m.C  ?? ""] ?? 0;
  const I  = ({ N: 0,    L: 0.22,  H: 0.56 }           as Record<string, number>)[m.I  ?? ""] ?? 0;
  const A  = ({ N: 0,    L: 0.22,  H: 0.56 }           as Record<string, number>)[m.A  ?? ""] ?? 0;

  const ISCBase = 1 - (1 - C) * (1 - I) * (1 - A);
  const ISC = S
    ? 7.52 * (ISCBase - 0.029) - 3.25 * Math.pow(ISCBase - 0.02, 15)
    : 6.42 * ISCBase;

  if (ISC <= 0) return 0;

  const Exp = 8.22 * AV * AC * PR * UI;
  const raw = S
    ? Math.min(1.08 * (ISC + Exp), 10)
    : Math.min(ISC + Exp, 10);

  return roundup(raw);
}

export function parseCvssScore(vector: string): number {
  if (!vector) return 0;
  // Plain numeric score (some sources embed it directly)
  const num = parseFloat(vector);
  if (!isNaN(num) && String(num) === vector.trim()) return num;
  // CVSS v3.x vector string
  const v3 = vector.match(/^CVSS:3\.[01]\/(.+)$/i);
  if (v3?.[1]) return calcV3(v3[1]);
  return 0;
}

export function scoreToSeverity(score: number | null): Severity {
  if (score === null) return "UNKNOWN";
  if (score >= 9.0)   return "CRITICAL";
  if (score >= 7.0)   return "HIGH";
  if (score >= 4.0)   return "MEDIUM";
  if (score > 0)      return "LOW";
  return "UNKNOWN";
}
