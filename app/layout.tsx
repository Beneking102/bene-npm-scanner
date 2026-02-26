// Copyright (c) 2024 Benedikt Pankratz — BUSL-1.1
import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title:       "bene-npm-scanner | CVE Vulnerability Scanner",
  description: "Scan your npm dependencies for known CVE vulnerabilities using OSV.dev. No login, no tracking, no data stored.",
  authors:     [{ name: "Benedikt Pankratz", url: "https://github.com/Beneking102" }],
  keywords:    ["npm", "CVE", "vulnerability", "security", "scanner", "OSV", "cybersecurity"],
  robots:      { index: true, follow: true },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body className="min-h-screen bg-[#030804] text-[#c8ffd4] antialiased">{children}</body>
    </html>
  );
}
