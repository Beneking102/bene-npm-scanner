// Copyright (c) 2024 Benedikt Pankratz — BUSL-1.1
import { Scanner } from "@/components/Scanner";

export default function Home() {
  return (
    <main className="relative min-h-screen flex flex-col">

      {/* Background grid */}
      <div className="fixed inset-0 pointer-events-none" style={{
        backgroundImage: `linear-gradient(rgba(0,229,65,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(0,229,65,0.03) 1px, transparent 1px)`,
        backgroundSize: "48px 48px",
      }} />

      {/* Ambient corner glows */}
      <div className="fixed top-0 left-0 w-48 h-48 pointer-events-none" style={{ background: "radial-gradient(circle at 0 0, rgba(0,229,65,0.08), transparent 70%)" }} />
      <div className="fixed bottom-0 right-0 w-48 h-48 pointer-events-none" style={{ background: "radial-gradient(circle at 100% 100%, rgba(0,229,65,0.08), transparent 70%)" }} />

      {/* Header */}
      <header className="relative z-10 border-b border-[#0d2b0d] bg-[#030804]/80 backdrop-blur-sm px-6 py-4">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 rounded-md bg-[#00e541]/10 border border-[#00e541]/30 flex items-center justify-center">
              <span className="text-[#00e541] text-xs font-mono font-bold">⬡</span>
            </div>
            <div>
              <h1 className="font-mono font-bold text-sm text-[#c8ffd4] tracking-tight">bene-npm-scanner</h1>
              <p className="font-mono text-[10px] text-[#4a7a52] tracking-widest uppercase">CVE Scanner</p>
            </div>
          </div>
          <nav className="flex items-center gap-4">
            <a href="https://github.com/Beneking102/bene-npm-scanner" target="_blank" rel="noopener noreferrer"
              className="font-mono text-xs text-[#6aaa78] hover:text-[#00e541] transition-colors flex items-center gap-1.5" aria-label="View source on GitHub">
              <svg viewBox="0 0 24 24" className="w-4 h-4" fill="currentColor" aria-hidden="true">
                <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
              </svg>
              GitHub
            </a>
            <a href="https://osv.dev" target="_blank" rel="noopener noreferrer" className="font-mono text-xs text-[#4a7a52] hover:text-[#6aaa78] transition-colors">OSV.dev ↗</a>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <section className="relative z-10 px-6 pt-12 pb-8 text-center">
        <div className="max-w-3xl mx-auto">
          <p className="font-mono text-xs text-[#00e541] tracking-[0.3em] uppercase mb-4 animate-in">
            Open Source · Powered by OSV.dev · No Login Required
          </p>
          <h2 className="font-mono text-3xl sm:text-4xl font-bold text-[#c8ffd4] mb-3 animate-in" style={{ animationDelay: "50ms" }}>
            npm CVE Scanner
          </h2>
          <p className="text-[#6aaa78] text-sm leading-relaxed max-w-lg mx-auto animate-in" style={{ animationDelay: "100ms" }}>
            Paste your{" "}
            <code className="font-mono text-[#c8ffd4] bg-[#0d2b0d] px-1.5 py-0.5 rounded text-xs">package.json</code>
            {" "}and instantly scan all dependencies against the OSV.dev vulnerability database.
            Nothing is stored. Nothing is logged.
          </p>
        </div>
      </section>

      {/* Scanner */}
      <section className="relative z-10 flex-1 px-4 sm:px-6 pb-16 animate-in" style={{ animationDelay: "150ms" }}>
        <Scanner />
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-[#0d2b0d] px-6 py-4">
        <div className="max-w-3xl mx-auto flex flex-wrap items-center justify-between gap-2 text-xs font-mono text-[#4a7a52]">
          <span>
            © {new Date().getFullYear()}{" "}
            <a href="https://github.com/Beneking102" target="_blank" rel="noopener noreferrer" className="hover:text-[#6aaa78] transition-colors">
              Benedikt Pankratz
            </a>{" "}
            · BUSL-1.1
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-[#00e541] animate-pulse" />
            Vulnerability data: OSV.dev
          </span>
        </div>
      </footer>
    </main>
  );
}
