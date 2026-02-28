// Copyright (c) 2024 Benedikt Pankratz
// Licensed under the Business Source License 1.1

import { NextResponse }                        from "next/server";
import { scanPackages }                        from "@/lib/osv";
import { validateRequestBody, MAX_BODY_BYTES } from "@/lib/validate";
import { checkRateLimit, getClientIp }         from "@/lib/rateLimit";
import type { ApiResponse }                    from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function err(error: string, code: string, status: number): NextResponse<ApiResponse> {
  return NextResponse.json<ApiResponse>(
    { ok: false, error, code },
    { status, headers: { "Cache-Control": "no-store" } }
  );
}

export async function POST(request: Request): Promise<NextResponse<ApiResponse>> {
  // 1. Rate limit (relaxed in local dev: all local requests share "unknown" as IP)
  const isDev     = process.env.NODE_ENV === "development";
  const ip        = getClientIp(request);
  const rateLimit = isDev ? 1000 : Math.max(1, parseInt(process.env.RATE_LIMIT_PER_MIN ?? "10", 10) || 10);
  const limit     = checkRateLimit(ip, rateLimit, 60_000);
  if (!limit.allowed) {
    return NextResponse.json<ApiResponse>(
      { ok: false, error: "Too many requests. Please wait before scanning again.", code: "RATE_LIMITED" },
      { status: 429, headers: { "Retry-After": String(Math.ceil(limit.resetInMs / 1000)), "Cache-Control": "no-store" } }
    );
  }

  // 2. Content-Type
  if (!(request.headers.get("content-type") ?? "").includes("application/json")) {
    return err("Content-Type must be application/json.", "INVALID_CONTENT_TYPE", 415);
  }

  // 2.5. Early size reject via Content-Length header (before buffering the body)
  const contentLengthHeader = request.headers.get("content-length");
  if (contentLengthHeader !== null) {
    const cl = parseInt(contentLengthHeader, 10);
    if (!isNaN(cl) && cl > MAX_BODY_BYTES) {
      return err(`Request body too large (max ${MAX_BODY_BYTES / 1000} KB).`, "PAYLOAD_TOO_LARGE", 413);
    }
  }

  // 3. Parse & size guard
  let body: unknown;
  try {
    const text = await request.text();
    if (new TextEncoder().encode(text).length > MAX_BODY_BYTES) {
      return err(`Request body too large (max ${MAX_BODY_BYTES / 1000} KB).`, "PAYLOAD_TOO_LARGE", 413);
    }
    body = JSON.parse(text);
  } catch {
    return err("Invalid JSON body.", "INVALID_JSON", 400);
  }

  // 4. Validate
  const validation = validateRequestBody(body);
  if (!validation.ok) return err(validation.error, "VALIDATION_ERROR", 400);

  // 5. Scan
  try {
    const report = await scanPackages(validation.data);
    return NextResponse.json<ApiResponse>(
      { ok: true, report },
      {
        status: 200,
        headers: {
          "Cache-Control": "no-store",
          "X-Remaining-Requests": String(limit.remaining),
        },
      }
    );
  } catch (e) {
    console.error("[scan] OSV fetch failed:", e instanceof Error ? e.message : e);
    return err("Failed to reach the vulnerability database. Please try again.", "UPSTREAM_ERROR", 502);
  }
}

// Block all other methods
const methodNotAllowed = () => NextResponse.json({ error: "Method not allowed" }, { status: 405 });
export const GET    = methodNotAllowed;
export const PUT    = methodNotAllowed;
export const DELETE = methodNotAllowed;
export const PATCH  = methodNotAllowed;
