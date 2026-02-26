// Copyright (c) 2024 Benedikt Pankratz — BUSL-1.1

/** @type {import('next').NextConfig} */
const isDev = process.env.NODE_ENV === "development";

const nextConfig = {
  poweredByHeader: false,
  reactStrictMode: true,

  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "Strict-Transport-Security",        value: "max-age=63072000; includeSubDomains; preload" },
          { key: "X-Frame-Options",                  value: "DENY" },
          { key: "X-Content-Type-Options",           value: "nosniff" },
          { key: "Referrer-Policy",                  value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy",               value: "camera=(), microphone=(), geolocation=()" },
          { key: "X-DNS-Prefetch-Control",           value: "on" },
          { key: "X-Permitted-Cross-Domain-Policies",value: "none" },
          { key: "Cross-Origin-Opener-Policy",       value: "same-origin" },
          { key: "Cross-Origin-Resource-Policy",     value: "same-origin" },
          {
            key: "Content-Security-Policy",
            value: [
              "default-src 'self'",
              // Dev: Next.js webpack bundles use eval() for HMR source maps
              isDev
                ? "script-src 'self' 'unsafe-inline' 'unsafe-eval'"
                : "script-src 'self' 'unsafe-inline'",
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              "font-src 'self' https://fonts.gstatic.com",
              "img-src 'self' data:",
              // Dev: also allow WebSocket connections for HMR
              isDev
                ? "connect-src 'self' https://api.osv.dev ws://localhost:* wss://localhost:*"
                : "connect-src 'self' https://api.osv.dev",
              "frame-ancestors 'none'",
              "base-uri 'self'",
              "form-action 'self'",
            ].join("; "),
          },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
