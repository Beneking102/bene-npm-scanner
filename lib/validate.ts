// Copyright (c) 2024 Benedikt Pankratz — BUSL-1.1

import type { PackageInput } from "@/lib/osv";

export const MAX_PACKAGES   = 500;
export const MAX_BODY_BYTES = 1_000_000; // 1 MB — lock files can be large

// npm scoped + unscoped package names
const PKG_NAME_RE = /^(?:@[a-z0-9_-][a-z0-9_.-]*\/)?[a-z0-9_-][a-z0-9_.-]*$/i;

function isValidPackageName(name: unknown): name is string {
  return (
    typeof name === "string" &&
    name.length > 0 &&
    name.length <= 214 &&
    PKG_NAME_RE.test(name.trim())
  );
}

function isValidVersion(v: unknown): v is string {
  if (typeof v !== "string") return false;
  const t = v.trim();
  if (t.length === 0 || t.length > 64) return false;
  // Block null bytes and shell metacharacters only
  return !/[\0`$|;&><]/.test(t);
}

export function normalizeVersion(v: string): string {
  let clean = v.replace(/^[a-z]+:/, "").trim();
  clean = clean.replace(/^[\s^~>=<!*]+/, "").trim();
  clean = clean.split(/\s/)[0]?.trim() ?? clean;
  return clean.length > 0 ? clean : v.trim() || "0.0.0";
}

export type ValidationResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: string };

export function validatePackageJson(raw: unknown): ValidationResult<PackageInput[]> {
  if (typeof raw !== "object" || raw === null || Array.isArray(raw)) {
    return { ok: false, error: "Expected a JSON object (package.json or package-lock.json)." };
  }

  const obj = raw as Record<string, unknown>;
  const packages: PackageInput[] = [];
  const seen = new Set<string>();
  const skipped: string[] = [];

  // package-lock.json v2 / v3
  const lockVer = obj["lockfileVersion"];
  if (typeof lockVer === "number" && lockVer >= 2 && typeof obj["packages"] === "object" && obj["packages"] !== null) {
    for (const [key, val] of Object.entries(obj["packages"] as Record<string, unknown>)) {
      if (!key || !key.startsWith("node_modules/")) continue;
      if (typeof val !== "object" || val === null) continue;
      const v = val as Record<string, unknown>;
      const name = key.replace(/^node_modules\//, "").replace(/\/node_modules\//g, "/");
      const version = typeof v["version"] === "string" ? v["version"] : null;
      if (version) tryAddPackage(name, version, v["dev"] === true, packages, seen, skipped);
    }
    if (packages.length === 0) return { ok: false, error: "No packages found in package-lock.json." };
    return { ok: true, data: packages.slice(0, MAX_PACKAGES) };
  }

  // package-lock.json v1
  if (typeof lockVer === "number" && lockVer === 1 && typeof obj["dependencies"] === "object" && obj["dependencies"] !== null) {
    walkLockV1(obj["dependencies"] as Record<string, unknown>, packages, seen, skipped);
    if (packages.length === 0) return { ok: false, error: "No packages found in package-lock.json v1." };
    return { ok: true, data: packages.slice(0, MAX_PACKAGES) };
  }

  // Regular package.json — all dependency field types
  const depFields: Array<[string, boolean]> = [
    ["dependencies",         false],
    ["devDependencies",      true ],
    ["peerDependencies",     false],
    ["optionalDependencies", false],
  ];

  for (const [field, isDev] of depFields) {
    const group = obj[field];
    if (group == null) continue;
    if (typeof group !== "object" || Array.isArray(group)) continue;
    for (const [name, ver] of Object.entries(group as Record<string, unknown>)) {
      if (typeof ver !== "string") continue;
      tryAddPackage(name, normalizeVersion(ver), isDev, packages, seen, skipped);
    }
  }

  if (packages.length === 0) {
    return {
      ok: false,
      error: skipped.length > 0
        ? `No valid packages found. Skipped invalid entries: ${skipped.slice(0, 3).join(", ")}${skipped.length > 3 ? "…" : ""}`
        : "No dependencies found. Make sure your package.json has a 'dependencies' or 'devDependencies' field.",
    };
  }

  return { ok: true, data: packages.slice(0, MAX_PACKAGES) };
}

function tryAddPackage(
  name: string,
  version: string,
  isDev: boolean,
  out: PackageInput[],
  seen: Set<string>,
  skipped: string[],
): void {
  const key = `${name}@${version}`;
  if (seen.has(key)) return;
  if (!isValidPackageName(name)) { skipped.push(name); return; }
  if (!isValidVersion(version))  { skipped.push(`${name}@${version}`); return; }
  seen.add(key);
  out.push({ name: name.trim(), version: version.trim(), isDev });
}

const WALK_MAX_DEPTH = 20;

function walkLockV1(
  deps: Record<string, unknown>,
  out: PackageInput[],
  seen: Set<string>,
  skipped: string[],
  depth = 0,
): void {
  if (depth > WALK_MAX_DEPTH) return;
  for (const [name, val] of Object.entries(deps)) {
    if (typeof val !== "object" || val === null) continue;
    const v = val as Record<string, unknown>;
    if (typeof v["version"] === "string") {
      tryAddPackage(name, v["version"], v["dev"] === true, out, seen, skipped);
    }
    if (typeof v["dependencies"] === "object" && v["dependencies"] !== null) {
      walkLockV1(v["dependencies"] as Record<string, unknown>, out, seen, skipped, depth + 1);
    }
  }
}

export function validateRequestBody(body: unknown): ValidationResult<PackageInput[]> {
  if (typeof body !== "object" || body === null) {
    return { ok: false, error: "Request body must be a JSON object." };
  }
  const b = body as Record<string, unknown>;
  if (!("packageJson" in b)) return { ok: false, error: 'Missing required field "packageJson".' };
  return validatePackageJson(b["packageJson"]);
}
