# ⬡ bene-npm-scanner

> Paste your `package.json` or `package-lock.json` — scan every npm dependency for CVEs in seconds.
> **Bulk scanning · CVSS v3.1 · powered by OSV.dev · no login · no tracking · no data stored.**

![License](https://img.shields.io/badge/license-BUSL--1.1-blue)
![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-strict-3178c6?logo=typescript&logoColor=white)
![Powered by OSV](https://img.shields.io/badge/Powered%20by-OSV.dev-4caf50)
![0 prod CVEs](https://img.shields.io/badge/prod%20CVEs-0-brightgreen)

---

## Overview

**bene-npm-scanner** is an open-source bulk CVE scanner for npm projects. Paste any `package.json` or `package-lock.json` to instantly audit every dependency at once:

- All known CVEs per package, with CVSS v3.1 base scores and severity levels
- Fix-version suggestions where available
- CVE IDs and OSV reference links per vulnerability
- A full severity summary across the entire scan (CRITICAL / HIGH / MEDIUM / LOW)

No API keys. No accounts. All calls to OSV.dev happen **server-side** — your browser only ever contacts this app.

---

## Features

- **Bulk CVE scanning** — scans all packages in a single `package.json` or lock file at once
- **Lock file support** — accepts `package-lock.json` v1, v2, and v3
- **All dependency types** — `dependencies`, `devDependencies`, `peerDependencies`, `optionalDependencies`
- **CVSS v3.1 base score** — calculated directly from vector strings (spec-verified, no external library)
- **Severity filter** — filter results by CRITICAL / HIGH / MEDIUM / LOW / CLEAN
- **Fix suggestions** — shows the exact version that resolves each CVE where OSV provides one
- **Expandable details** — CVE summary, full description, aliases (CVE/GHSA), CWE IDs, reference links
- **Drag & drop + file upload** — drop a JSON file directly onto the input area
- **Per-IP rate limiting** — configurable via environment variable
- **No login · No tracking · No data stored**

---

## Security Architecture

Security was a primary design concern for public deployment.

| Protection | Implementation |
|---|---|
| **Content Security Policy** | `default-src 'none'` — strict deny-by-default; `connect-src 'self'` — browser contacts nothing except this app |
| **HSTS** | `max-age=63072000; includeSubDomains; preload` — enforces HTTPS at the transport layer |
| **X-Frame-Options** | `DENY` — prevents clickjacking in legacy browsers |
| **X-Content-Type-Options** | `nosniff` — prevents MIME-type sniffing |
| **CORP / COOP** | `same-origin` — cross-origin isolation headers |
| **Rate limiting** | Per-IP sliding window, configurable via `RATE_LIMIT_PER_MIN` (default: 10/min) |
| **Input validation** | Strict TypeScript + schema validation before any external call; max 500 packages, 1 MB payload |
| **URL sanitization** | `safeUrl()` rejects non-`https:` URIs from OSV reference data before rendering links |
| **Server-side API calls** | OSV.dev is called on the server — not from the browser |
| **Error sanitization** | Stack traces and upstream error details never reach the client |
| **Method restriction** | `/api/scan` returns `405` for all non-POST methods |
| **Self-hosted fonts** | Fonts loaded via `next/font/google` — no requests to `fonts.googleapis.com` or `fonts.gstatic.com` |
| **External links** | All CVE and reference links use `rel="noopener noreferrer"` |
| **No external scripts** | Zero third-party JavaScript loaded in the browser |

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript 5.8 (strict mode) |
| Styling | Tailwind CSS 4 |
| Fonts | Syne + JetBrains Mono (self-hosted via `next/font/google`) |
| CVE data | [OSV.dev](https://osv.dev) — free, no API key required |
| CVSS scoring | Implemented inline to CVSS v3.1 spec (`lib/cvss.ts`) |

---

## Getting Started

```bash
git clone https://github.com/Beneking102/bene-npm-scanner.git
cd bene-npm-scanner
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Available scripts

| Command | Description |
|---|---|
| `npm run dev` | Development server with hot reload |
| `npm run build` | Production build |
| `npm run start` | Serve the production build |
| `npm run type-check` | TypeScript check without emitting files |
| `npm run lint` | ESLint |

---

## Environment Variables

No API keys required. Copy `.env.local` and adjust the rate limit if needed.

```env
# Maximum scan requests per IP per minute (default: 10)
RATE_LIMIT_PER_MIN=10
```

> **Serverless note:** The rate limiter is in-memory and resets on cold starts (Vercel, Netlify). For persistent rate limiting, replace the store in `lib/rateLimit.ts` with [Upstash Redis](https://upstash.com/), which has a generous free tier and a Next.js SDK.

---

## Deployment

### Vercel (recommended)

```bash
npx vercel
```

No environment variables required for basic use. Set `RATE_LIMIT_PER_MIN` to override the default 10 requests/minute per IP.

### Self-hosted (VPS / Docker)

```bash
npm run build
npm start        # runs on port 3000 by default
```

Place the app behind a reverse proxy that handles TLS termination. **Caddy** is the easiest option:

```
# /etc/caddy/Caddyfile
example.com {
    reverse_proxy localhost:3000
}
```

With **nginx + Certbot**:

```bash
sudo certbot --nginx -d example.com
```

> **Certificate note:** HTTPS/TLS certificates are managed at the reverse-proxy layer, not inside Next.js. Platforms like Vercel and Netlify provision them automatically.

---

## API Reference

### `POST /api/scan`

All OSV.dev calls happen server-side. The browser only posts to this endpoint.

**Request body**

```json
{ "packageJson": { ...your package.json or package-lock.json... } }
```

Accepts any of:
- `package.json` with `dependencies`, `devDependencies`, `peerDependencies`, `optionalDependencies`
- `package-lock.json` v1, v2, or v3

**Success response — `200 OK`**

```json
{
  "ok": true,
  "report": {
    "scannedAt": "2026-02-28T14:30:00.000Z",
    "totalPackages": 42,
    "affectedCount": 3,
    "counts": { "critical": 1, "high": 2, "medium": 0, "low": 0, "unknown": 0 },
    "packages": [
      {
        "name": "lodash",
        "version": "4.17.20",
        "isDev": false,
        "highestSeverity": "HIGH",
        "vulnerabilities": [
          {
            "id": "GHSA-35jh-r3h4-6jhm",
            "aliases": ["CVE-2021-23337"],
            "summary": "Command Injection in lodash",
            "severity": "HIGH",
            "cvssScore": "7.2",
            "cweIds": ["CWE-77"],
            "fixedIn": "4.17.21",
            "references": [{ "type": "ADVISORY", "url": "https://osv.dev/vulnerability/GHSA-35jh-r3h4-6jhm" }],
            "publishedAt": "2021-02-15T00:00:00Z"
          }
        ]
      }
    ]
  }
}
```

**Response headers**

| Header | Description |
|---|---|
| `X-Remaining-Requests` | Requests remaining in the current window |
| `Retry-After` | Seconds until the window resets (only on `429`) |

**Error codes**

| HTTP | `code` | Meaning |
|---|---|---|
| `400` | `INVALID_JSON` | Body is not valid JSON |
| `400` | `VALIDATION_ERROR` | No valid packages found, or input exceeds limits |
| `413` | `PAYLOAD_TOO_LARGE` | Body exceeds 1 MB |
| `415` | `INVALID_CONTENT_TYPE` | Missing `Content-Type: application/json` |
| `429` | `RATE_LIMITED` | Too many requests — check `Retry-After` |
| `502` | `UPSTREAM_ERROR` | OSV.dev temporarily unavailable |

---

## Related Tools

| Tool | Description |
|---|---|
| [bene-version checker](https://github.com/Beneking102/bene-version-checker) | Insert your Package and Version and find known CVEs and Versions |

## License

```
Business Source License 1.1

Licensor:       Benedikt Pankratz
Licensed Work:  bene-npm-scanner
Change Date:    January 1, 2028
Change License: MIT
```

**In plain English:**

- ✓ Free to use for **personal and non-commercial** purposes, right now
- ✓ The source code converts to the **MIT license on January 1, 2028**
- ✗ Commercial use before that date requires a separate written agreement

For the full license text see [BUSL-1.1](https://spdx.org/licenses/BUSL-1.1.html).

---

## Related Tools

| Tool | Description |
|---|---|
| **bene-npm-scanner** | ← this repo — paste a full `package.json` for bulk CVE scanning |
| [bene-version-checker](https://github.com/Beneking102/bene-version-checker) | Single-package CVE audit across 8 ecosystems (npm, PyPI, Maven, Go, Rust, Ruby, NuGet, PHP) |

---

© 2026 Benedikt Pankratz · [@Beneking102](https://github.com/Beneking102)

