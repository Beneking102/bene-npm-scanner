// Copyright (c) 2024 Benedikt Pankratz
// Licensed under the Business Source License 1.1

import type {
  OsvVulnerability,
  PackageResult,
  ScanReport,
  Severity,
  VulnerabilityEntry,
} from "@/lib/types";

const OSV_BATCH_API      = "https://api.osv.dev/v1/querybatch";
const OSV_VULN_API       = "https://api.osv.dev/v1/vulns";
const CHUNK_SIZE         = 100;  // max queries per batch request
const DETAIL_CONCURRENCY = 40;   // parallel vuln-detail fetches
const TIMEOUT_MS         = 15_000;
const USER_AGENT         = "bene-npm-scanner/1.0 (github.com/Beneking102/bene-npm-scanner)";

const SEVERITY_ORDER: Record<Severity, number> = {
  CRITICAL: 5, HIGH: 4, MEDIUM: 3, LOW: 2, UNKNOWN: 1,
};

// The querybatch endpoint only returns {id, modified} — not full vuln objects
interface OsvVulnRef { id: string; modified?: string }
interface OsvBatchResult { results: Array<{ vulns?: OsvVulnRef[] }> }

function parseCvssScore(vuln: OsvVulnerability): number | null {
  const raw = vuln.database_specific?.cvss;
  if (!raw) return null;
  const m = /(\d+\.\d+)/.exec(raw);
  if (!m?.[1]) return null;
  const n = parseFloat(m[1]);
  return isNaN(n) ? null : n;
}

function parseSeverity(vuln: OsvVulnerability): Severity {
  // 1. Prefer database_specific.severity (GitHub Advisory format)
  const dbSev = vuln.database_specific?.severity?.toUpperCase();
  if (dbSev && dbSev in SEVERITY_ORDER) return dbSev as Severity;

  // 2. Fall back to CVSS numeric score
  const score = parseCvssScore(vuln);
  if (score !== null) {
    if (score >= 9.0) return "CRITICAL";
    if (score >= 7.0) return "HIGH";
    if (score >= 4.0) return "MEDIUM";
    if (score >= 0.1) return "LOW";
  }

  // 3. Try the severity array (some ecosystems use CVSS vector strings or named levels)
  for (const s of vuln.severity ?? []) {
    const n = parseFloat(s.score);
    if (!isNaN(n)) {
      if (n >= 9.0) return "CRITICAL";
      if (n >= 7.0) return "HIGH";
      if (n >= 4.0) return "MEDIUM";
      return "LOW";
    }
    const u = s.score.toUpperCase();
    if (u in SEVERITY_ORDER) return u as Severity;
  }

  return "UNKNOWN";
}

function highestSeverity(severities: Severity[]): Severity {
  return severities.reduce<Severity>(
    (best, cur) => SEVERITY_ORDER[cur] > SEVERITY_ORDER[best] ? cur : best,
    "UNKNOWN"
  );
}

function extractFixedVersion(vuln: OsvVulnerability): string | null {
  for (const affected of vuln.affected ?? []) {
    for (const range of affected.ranges ?? []) {
      for (const event of range.events) {
        if (event.fixed) return event.fixed;
      }
    }
  }
  return null;
}

function mapVuln(vuln: OsvVulnerability): VulnerabilityEntry {
  const score = parseCvssScore(vuln);
  return {
    id:          vuln.id,
    aliases:     vuln.aliases ?? [],
    summary:     vuln.summary ?? "No summary available",
    details:     vuln.details ?? "",
    severity:    parseSeverity(vuln),
    cvssScore:   score !== null ? score.toFixed(1) : null,
    cweIds:      vuln.database_specific?.cwe_ids ?? [],
    fixedIn:     extractFixedVersion(vuln),
    references:  (vuln.references ?? [])
      .filter((r) => typeof r.url === "string" && r.url.startsWith("https://"))
      .map((r) => ({ type: r.type, url: r.url })),
    publishedAt: vuln.published ?? null,
  };
}

export interface PackageInput {
  name:    string;
  version: string;
  isDev:   boolean;
}

async function fetchWithTimeout(url: string, init: RequestInit): Promise<Response> {
  const ctrl  = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
  try {
    return await fetch(url, { ...init, signal: ctrl.signal });
  } finally {
    clearTimeout(timer);
  }
}

export async function scanPackages(packages: PackageInput[]): Promise<ScanReport> {
  if (packages.length === 0) return emptyReport();

  // ── Step 1: Batch-query OSV to get vulnerability IDs per package ──────────
  const queries = packages.map((pkg) => ({
    package: { name: pkg.name, ecosystem: "npm" as const },
    version: pkg.version,
  }));

  // Results are kept in query-order so we can map back by index
  const idResults: OsvVulnRef[][] = [];

  for (let i = 0; i < queries.length; i += CHUNK_SIZE) {
    const chunk = queries.slice(i, i + CHUNK_SIZE);
    const res = await fetchWithTimeout(OSV_BATCH_API, {
      method:  "POST",
      headers: { "Content-Type": "application/json", "User-Agent": USER_AGENT },
      body:    JSON.stringify({ queries: chunk }),
    });
    if (!res.ok) throw new Error(`OSV batch API returned ${res.status}`);
    const data = await res.json() as OsvBatchResult;
    for (const result of data.results ?? []) {
      idResults.push(result.vulns ?? []);
    }
  }

  // ── Step 2: Collect unique vuln IDs across all packages ───────────────────
  const uniqueIds = new Set<string>();
  for (const refs of idResults) {
    for (const ref of refs) uniqueIds.add(ref.id);
  }

  // ── Step 3: Fetch full vuln details in parallel ───────────────────────────
  const vulnMap = new Map<string, OsvVulnerability>();
  const idsArr  = Array.from(uniqueIds);

  for (let i = 0; i < idsArr.length; i += DETAIL_CONCURRENCY) {
    const batch   = idsArr.slice(i, i + DETAIL_CONCURRENCY);
    const settled = await Promise.allSettled(
      batch.map(async (id): Promise<{ id: string; data: OsvVulnerability } | null> => {
        try {
          const res = await fetchWithTimeout(`${OSV_VULN_API}/${encodeURIComponent(id)}`, {
            headers: { "User-Agent": USER_AGENT },
          });
          if (!res.ok) return null;
          return { id, data: await res.json() as OsvVulnerability };
        } catch {
          return null;
        }
      })
    );
    for (const r of settled) {
      if (r.status === "fulfilled" && r.value) {
        vulnMap.set(r.value.id, r.value.data);
      }
    }
  }

  // ── Step 4: Build final package results ───────────────────────────────────
  const packageResults: PackageResult[] = packages.map((pkg, i) => {
    const vulns = (idResults[i] ?? [])
      .map((ref)  => vulnMap.get(ref.id))
      .filter((v): v is OsvVulnerability => v !== undefined)
      .map(mapVuln);

    return {
      name:            pkg.name,
      version:         pkg.version,
      isDev:           pkg.isDev,
      vulnerabilities: vulns,
      highestSeverity: highestSeverity(vulns.map((v) => v.severity)),
    };
  });

  const counts = { critical: 0, high: 0, medium: 0, low: 0, unknown: 0 };
  for (const pkg of packageResults) {
    for (const v of pkg.vulnerabilities) {
      counts[v.severity.toLowerCase() as keyof typeof counts]++;
    }
  }

  return {
    scannedAt:     new Date().toISOString(),
    totalPackages: packages.length,
    affectedCount: packageResults.filter((p) => p.vulnerabilities.length > 0).length,
    counts,
    packages:      packageResults,
  };
}

function emptyReport(): ScanReport {
  return {
    scannedAt:     new Date().toISOString(),
    totalPackages: 0,
    affectedCount: 0,
    counts:        { critical: 0, high: 0, medium: 0, low: 0, unknown: 0 },
    packages:      [],
  };
}
