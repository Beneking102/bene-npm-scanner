# ⬡ bene-npm-scanner

> A polished, open-source CVE vulnerability scanner for npm dependencies — powered by [OSV.dev](https://osv.dev).

![License: BUSL-1.1](https://img.shields.io/badge/License-BUSL--1.1-green.svg)
![Next.js](https://img.shields.io/badge/Next.js-14-black)
![TypeScript](https://img.shields.io/badge/TypeScript-Strict-blue)

## Features

- ✅ Scans `dependencies`, `devDependencies`, `peerDependencies`, `optionalDependencies`
- ✅ Also accepts `package-lock.json` (v1, v2, v3)
- ✅ Severity levels: CRITICAL / HIGH / MEDIUM / LOW
- ✅ CVE IDs, CWE IDs, and fix-version suggestions per vulnerability
- ✅ Expandable vulnerability details + reference links
- ✅ Filter by severity
- ✅ Paste, drag & drop, or file upload
- ✅ No login, no tracking, no data stored

## Security design

This tool practices what it preaches:

| Measure | Implementation |
|---------|---------------|
| Strict CSP | `next.config.js` — blocks XSS, only whitelists `api.osv.dev` as connect target |
| HSTS | `max-age=63072000; includeSubDomains; preload` |
| Rate limiting | 10 scans / minute per IP (sliding window) |
| Input validation | Strict TypeScript + schema validation before any external call |
| No data persistence | Uploaded JSON is parsed in memory and discarded immediately |
| Method allowlist | API route returns `405` for GET, PUT, DELETE, PATCH |
| Error sanitization | Stack traces never reach the client |
| Strict TypeScript | `strict`, `noImplicitAny`, `strictNullChecks`, `noUncheckedIndexedAccess` |

## Tech stack

| Layer | Choice |
|-------|--------|
| Framework | Next.js 14 (App Router) |
| Language | TypeScript (strict mode) |
| Styling | Tailwind CSS |
| CVE data | [OSV.dev](https://api.osv.dev) — free, no API key required |
| Fonts | Syne + JetBrains Mono |

## Running locally

```bash
git clone https://github.com/Beneking102/bene-npm-scanner.git
cd bene-npm-scanner
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Deploy to Vercel

```bash
npx vercel
```

No environment variables required. OSV.dev is a free public API.

## API reference

```
POST /api/scan
Content-Type: application/json

{ "packageJson": { ...your package.json content... } }
```

**Success response:**
```json
{
  "ok": true,
  "report": {
    "scannedAt": "2024-01-01T00:00:00.000Z",
    "totalPackages": 42,
    "affectedCount": 3,
    "counts": { "critical": 1, "high": 2, "medium": 0, "low": 0, "unknown": 0 },
    "packages": [...]
  }
}
```

**Rate limit:** 10 requests/minute per IP → `429 Too Many Requests`
**Max payload:** 1 MB → `413 Payload Too Large`
**Max packages:** 500 per scan → `400 Validation Error`

## Related Tools

| Tool | Description |
|---|---|
| [bene-version checker](https://github.com/Beneking102/bene-version-checker) | Insert your Package and Version and find known CVEs and Versions |

## License

[Business Source License 1.1](./LICENSE) © 2024 Benedikt Pankratz  
Free for personal & non-commercial use. Converts to MIT on 2028-01-01.

## Author

**Benedikt Pankratz**
GitHub: [@Beneking102](https://github.com/Beneking102)
