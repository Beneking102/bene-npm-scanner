// Copyright (c) 2024 Benedikt Pankratz
// Licensed under the Business Source License 1.1

interface WindowEntry { timestamps: number[] }

const store = new Map<string, WindowEntry>();

// Cleanup stale entries every 5 min to prevent memory leaks
if (typeof setInterval !== "undefined") {
  setInterval(() => {
    const cutoff = Date.now() - 60_000;
    for (const [key, entry] of store.entries()) {
      entry.timestamps = entry.timestamps.filter((t) => t > cutoff);
      if (entry.timestamps.length === 0) store.delete(key);
    }
  }, 300_000);
}

export interface RateLimitResult {
  allowed:   boolean;
  remaining: number;
  resetInMs: number;
}

export function checkRateLimit(
  identifier: string,
  limit       = 10,
  windowMs    = 60_000
): RateLimitResult {
  const now    = Date.now();
  const cutoff = now - windowMs;
  const entry  = store.get(identifier) ?? { timestamps: [] };

  entry.timestamps = entry.timestamps.filter((t) => t > cutoff);

  if (entry.timestamps.length >= limit) {
    const oldest  = entry.timestamps[0] ?? now;
    store.set(identifier, entry);
    return { allowed: false, remaining: 0, resetInMs: windowMs - (now - oldest) };
  }

  entry.timestamps.push(now);
  store.set(identifier, entry);
  return { allowed: true, remaining: limit - entry.timestamps.length, resetInMs: windowMs };
}

export function getClientIp(request: Request): string {
  const cf  = request.headers.get("cf-connecting-ip");
  const fwd = request.headers.get("x-forwarded-for");
  const rl  = request.headers.get("x-real-ip");
  if (cf)  return cf.trim();
  if (fwd) return fwd.split(",")[0]?.trim() ?? "unknown";
  if (rl)  return rl.trim();
  return "unknown";
}
