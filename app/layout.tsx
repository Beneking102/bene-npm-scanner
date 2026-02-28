// Copyright (c) 2024 Benedikt Pankratz — BUSL-1.1
import type { Metadata } from "next";
import { JetBrains_Mono, Syne } from "next/font/google";
import "./globals.css";

const jetbrainsMono = JetBrains_Mono({
  subsets:  ["latin"],
  weight:   ["300", "400", "500", "600", "700"],
  variable: "--font-jetbrains",
  display:  "swap",
});

const syne = Syne({
  subsets:  ["latin"],
  weight:   ["400", "500", "600", "700", "800"],
  variable: "--font-syne",
  display:  "swap",
});

export const metadata: Metadata = {
  title:       "bene-npm-scanner | CVE Vulnerability Scanner",
  description: "Scan your npm dependencies for known CVE vulnerabilities using OSV.dev. No login, no tracking, no data stored.",
  authors:     [{ name: "Benedikt Pankratz", url: "https://github.com/Beneking102" }],
  keywords:    ["npm", "CVE", "vulnerability", "security", "scanner", "OSV", "cybersecurity"],
  robots:      { index: true, follow: true },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning className={`${jetbrainsMono.variable} ${syne.variable}`}>
      <body className="min-h-screen bg-[#030804] text-[#c8ffd4] antialiased">{children}</body>
    </html>
  );
}
