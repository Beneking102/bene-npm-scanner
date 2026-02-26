// Copyright (c) 2024 Benedikt Pankratz
// Licensed under the Business Source License 1.1

export interface PackageJson {
  dependencies?:     Record<string, string>;
  devDependencies?:  Record<string, string>;
  peerDependencies?: Record<string, string>;
  name?:    string;
  version?: string;
}

export type ScanInput =
  | { type: "packageJson"; content: PackageJson }
  | { type: "packageList"; packages: Array<{ name: string; version: string }> };

// OSV.dev API types
export interface OsvPackage {
  name:      string;
  ecosystem: "npm";
  version?:  string;
}

export interface OsvVulnerability {
  id:       string;
  aliases?: string[];
  summary?: string;
  details?: string;
  severity?: Array<{ type: string; score: string }>;
  affected?: Array<{
    package: OsvPackage;
    ranges?: Array<{
      type:   string;
      events: Array<{ introduced?: string; fixed?: string; last_affected?: string }>;
    }>;
    versions?: string[];
  }>;
  references?: Array<{ type: string; url: string }>;
  published?: string;
  modified?:  string;
  database_specific?: {
    severity?: string;
    cvss?:     string;
    cwe_ids?:  string[];
    url?:      string;
  };
}

// Result types
export type Severity = "CRITICAL" | "HIGH" | "MEDIUM" | "LOW" | "UNKNOWN";

export interface VulnerabilityEntry {
  id:          string;
  aliases:     string[];
  summary:     string;
  details:     string;
  severity:    Severity;
  cvssScore:   string | null;
  cweIds:      string[];
  fixedIn:     string | null;
  references:  Array<{ type: string; url: string }>;
  publishedAt: string | null;
}

export interface PackageResult {
  name:            string;
  version:         string;
  isDev:           boolean;
  vulnerabilities: VulnerabilityEntry[];
  highestSeverity: Severity;
}

export interface ScanReport {
  scannedAt:     string;
  totalPackages: number;
  affectedCount: number;
  counts: {
    critical: number;
    high:     number;
    medium:   number;
    low:      number;
    unknown:  number;
  };
  packages: PackageResult[];
}

export type ApiSuccess  = { ok: true;  report: ScanReport };
export type ApiError    = { ok: false; error: string; code: string };
export type ApiResponse = ApiSuccess | ApiError;
