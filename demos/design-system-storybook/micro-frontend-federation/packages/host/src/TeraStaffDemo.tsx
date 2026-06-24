/**
 * TeraStaffDemo.tsx
 *
 * Software Engineer III / Infrastructure Lead — Accommodation FE Web
 *
 * Key outcomes:
 *   - 64.18% reduction in local build time
 *   - 49.15% improvement in average memory usage
 *   - 42.2% reduction in vulnerabilities per audited package
 *   - Consistent & stable testing in local + CI
 *
 * Responsibilities:
 *   - Tech roadmap (with Domain Lead)
 *   - FE best practices across Accommodation FE Web
 *   - Infra maintenance + tech stack audit
 *   - Mentoring junior engineers
 *
 * TABS
 *   ⚡ Build & Memory     — build simulation, before/after metrics, toolchain migration
 *   🔒 Security & Audit   — dependency vulnerability scanner, tech stack health matrix
 *   🗺 Roadmap & Mentoring — tech roadmap, ADRs, best practices, mentoring
 */

import React, { useState, useEffect, useRef, useCallback } from "react";

// ─────────────────────────────────────────────────────────────────
// Build simulation data
// ─────────────────────────────────────────────────────────────────

const BEFORE_STEPS = [
  { label: "resolve modules",        ms: 3200, color: "#ef4444" },
  { label: "babel-loader (JS/TS)",   ms: 8400, color: "#ef4444" },
  { label: "css-loader + postcss",   ms: 2100, color: "#f59e0b" },
  { label: "type-check (tsc)",       ms: 6800, color: "#ef4444" },
  { label: "bundle (webpack)",       ms: 4200, color: "#f59e0b" },
  { label: "minify (terser)",        ms: 2800, color: "#f59e0b" },
  { label: "write assets",           ms: 640,  color: "#22c55e" },
];

const AFTER_STEPS = [
  { label: "resolve modules (cached)", ms: 180,  color: "#22c55e" },
  { label: "SWC transform (JS/TS)",    ms: 680,  color: "#22c55e" },
  { label: "CSS (lightning-css)",      ms: 140,  color: "#22c55e" },
  { label: "type-check (isolatedModules)", ms: 420, color: "#22c55e" },
  { label: "bundle (Rspack)",          ms: 520,  color: "#22c55e" },
  { label: "minify (built-in)",        ms: 210,  color: "#22c55e" },
  { label: "write assets",             ms: 90,   color: "#22c55e" },
];

const BEFORE_TOTAL = BEFORE_STEPS.reduce((s, x) => s + x.ms, 0);
const AFTER_TOTAL  = AFTER_STEPS.reduce((s, x) => s + x.ms, 0);

// ─────────────────────────────────────────────────────────────────
// Security audit data
// ─────────────────────────────────────────────────────────────────

type Severity = "critical" | "high" | "medium" | "low";
interface Vuln {
  pkg: string; via: string; severity: Severity; fixed: boolean;
  fix?: string;
}

const VULNS: Vuln[] = [
  { pkg: "node-fetch",       via: "lodash < 4.17.21",  severity: "critical", fixed: true,  fix: "lodash@4.17.21" },
  { pkg: "jest-environment-jsdom", via: "parse5 < 6.0.1", severity: "high", fixed: true, fix: "parse5@6.0.1" },
  { pkg: "webpack-bundle-analyzer", via: "gzip-js@0.3.2", severity: "high", fixed: true, fix: "removed (unused)" },
  { pkg: "react-scripts",   via: "nth-check < 2.0.1", severity: "high",    fixed: true,  fix: "nth-check@2.0.1" },
  { pkg: "postcss < 8.4.31",  via: "direct",           severity: "medium",  fixed: true,  fix: "postcss@8.4.31"  },
  { pkg: "semver < 7.5.4",   via: "node-gyp",          severity: "medium",  fixed: true,  fix: "semver@7.5.4"    },
  { pkg: "tough-cookie < 4.1.3", via: "jsdom",         severity: "medium",  fixed: true,  fix: "tough-cookie@4.1.3" },
  { pkg: "ip < 2.0.1",       via: "pac-resolver",      severity: "medium",  fixed: false                         },
  { pkg: "xml2js < 0.5.0",   via: "aws-sdk (unused)",  severity: "medium",  fixed: true,  fix: "removed package" },
  { pkg: "loader-utils < 2.4.1", via: "webpack 4",     severity: "low",     fixed: true,  fix: "webpack@5"       },
  { pkg: "d3-color < 3.1.0", via: "recharts",          severity: "low",     fixed: false                         },
  { pkg: "minimatch < 3.0.5", via: "glob",             severity: "low",     fixed: true,  fix: "glob@9"          },
];

const TECH_STACK = [
  { name: "Node.js",       before: "14.x (EOL)",  after: "20.x LTS",   risk: "critical", color: "#ef4444" },
  { name: "React",         before: "17.0.2",      after: "18.2.0",     risk: "ok",       color: "#22c55e" },
  { name: "TypeScript",    before: "4.5",         after: "5.3",        risk: "ok",       color: "#22c55e" },
  { name: "Bundler",       before: "Webpack 4",   after: "Rspack 1.x", risk: "upgraded", color: "#0ea5e9" },
  { name: "Transpiler",    before: "Babel 7",     after: "SWC 1.x",    risk: "upgraded", color: "#0ea5e9" },
  { name: "CSS",           before: "PostCSS",     after: "LightningCSS",risk: "upgraded", color: "#0ea5e9" },
  { name: "Pkg Manager",   before: "npm",         after: "pnpm 8",     risk: "upgraded", color: "#a855f7" },
  { name: "Test Runner",   before: "Jest 27",     after: "Jest 29",    risk: "ok",       color: "#22c55e" },
  { name: "Linter",        before: "ESLint 7",    after: "ESLint 8 + eslint-plugin-security", risk: "ok", color: "#22c55e" },
];

// ─────────────────────────────────────────────────────────────────
// Roadmap
// ─────────────────────────────────────────────────────────────────

const ROADMAP = [
  {
    quarter: "Q1", theme: "Toolchain Migration", color: "#0ea5e9", status: "done",
    items: ["Webpack 4 → Rspack 1", "Babel → SWC transpiler", "npm → pnpm (dedup + speed)", "TS isolatedModules", "64.18% build time ↓"],
  },
  {
    quarter: "Q2", theme: "Security Hardening", color: "#ef4444", status: "done",
    items: ["Full npm audit baseline", "42.2% vuln/pkg ↓", "SAST (Semgrep) in CI", "Dep update bot (Renovate)", "Node 14 EOL → Node 20"],
  },
  {
    quarter: "Q3", theme: "Test Stability", color: "#22c55e", status: "done",
    items: ["Eliminate flaky tests", "MSW for API mocking", "jest-fake-timers universal", "CI test isolation (Docker)", "0% flake rate in CI"],
  },
  {
    quarter: "Q4", theme: "Memory & Perf", color: "#a855f7", status: "in-progress",
    items: ["49.15% memory usage ↓", "Heap snapshot profiling", "Webpack memory leak fixes", "Bundle size budgets in CI", "Lighthouse CI baseline"],
  },
];

const ADRS = [
  { id: "ADR-001", title: "Rspack over Vite for TERA web",          status: "accepted",  date: "2024-Q1" },
  { id: "ADR-002", title: "SWC as primary transpiler",              status: "accepted",  date: "2024-Q1" },
  { id: "ADR-003", title: "pnpm as package manager",                status: "accepted",  date: "2024-Q1" },
  { id: "ADR-004", title: "MSW for API mocking in tests",           status: "accepted",  date: "2024-Q3" },
  { id: "ADR-005", title: "Renovate for automated dep updates",     status: "accepted",  date: "2024-Q2" },
  { id: "ADR-006", title: "LightningCSS over PostCSS",              status: "accepted",  date: "2024-Q1" },
  { id: "ADR-007", title: "Vitest migration (evaluating)",          status: "proposed",  date: "2025-Q1" },
];

const MENTEES = [
  { name: "Engineer A", level: "Junior → Mid",  topics: "TypeScript, React patterns, code review",  months: 6 },
  { name: "Engineer B", level: "Intern → SE I", topics: "Git workflow, unit testing, TERA codebase", months: 3 },
  { name: "Engineer C", level: "Junior → Mid",  topics: "Performance profiling, Redux, async patterns", months: 8 },
];

// ─────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────

function CodeBlock({ code, label, color = "#64748b" }: { code: string; label?: string; color?: string }) {
  return (
    <div style={{ background: "#0a0a14", borderRadius: 8, overflow: "hidden", border: "1px solid #1e293b" }}>
      {label && <div style={{ padding: "5px 12px", borderBottom: "1px solid #1e293b", fontSize: 10, color }}>{label}</div>}
      <pre style={{ margin: 0, padding: 12, fontSize: 9, fontFamily: "monospace", color: "#94a3b8", lineHeight: 1.7, overflow: "auto", maxHeight: 270 }}>{code}</pre>
    </div>
  );
}

const SEV_COLOR: Record<Severity, string> = { critical: "#ef4444", high: "#f59e0b", medium: "#0ea5e9", low: "#64748b" };

// ─────────────────────────────────────────────────────────────────
// Main
// ─────────────────────────────────────────────────────────────────

export function TeraStaffDemo() {
  const [activeTab, setActiveTab] = useState<"build" | "security" | "roadmap">("build");

  // ── Build simulation
  type BuildState = "idle" | "running-before" | "running-after" | "done";
  const [buildState, setBuildState] = useState<BuildState>("idle");
  const [beforeLog, setBeforeLog] = useState<{ label: string; ms: number; pct: number; color: string }[]>([]);
  const [afterLog,  setAfterLog]  = useState<{ label: string; ms: number; pct: number; color: string }[]>([]);
  const runningRef = useRef(false);

  const runBuild = useCallback(async () => {
    if (runningRef.current) return;
    runningRef.current = true;
    setBeforeLog([]); setAfterLog([]);
    setBuildState("running-before");
    for (const step of BEFORE_STEPS) {
      await new Promise(r => setTimeout(r, 240));
      setBeforeLog(prev => [...prev, { ...step, pct: (step.ms / BEFORE_TOTAL) * 100 }]);
    }
    await new Promise(r => setTimeout(r, 300));
    setBuildState("running-after");
    for (const step of AFTER_STEPS) {
      await new Promise(r => setTimeout(r, 120));
      setAfterLog(prev => [...prev, { ...step, pct: (step.ms / BEFORE_TOTAL) * 100 }]);
    }
    setBuildState("done");
    runningRef.current = false;
  }, []);

  // ── Audit simulation
  const [auditState, setAuditState] = useState<"idle" | "scanning" | "done">("idle");
  const [visibleVulns, setVisibleVulns] = useState<number>(0);
  const [sevFilter, setSevFilter] = useState<Severity | "all">("all");

  const runAudit = useCallback(async () => {
    if (auditState === "scanning") return;
    setAuditState("scanning"); setVisibleVulns(0);
    for (let i = 1; i <= VULNS.length; i++) {
      await new Promise(r => setTimeout(r, 130));
      setVisibleVulns(i);
    }
    setAuditState("done");
  }, [auditState]);

  const filtered = VULNS.filter(v => sevFilter === "all" || v.severity === sevFilter);
  const beforeCount = VULNS.length;
  const afterCount  = VULNS.filter(v => !v.fixed).length;

  const TABS = [
    { id: "build"    as const, label: "⚡ Build & Memory"    },
    { id: "security" as const, label: "🔒 Security & Audit"  },
    { id: "roadmap"  as const, label: "🗺 Roadmap & Mentoring" },
  ];

  return (
    <div style={{ background: "#0f172a", color: "#f1f5f9", fontFamily: "'Inter', system-ui, sans-serif", minHeight: "100vh", padding: 24 }}>

      {/* Header */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
          <div style={{ width: 36, height: 36, borderRadius: 8, background: "linear-gradient(135deg,#0066ff,#7c3aed)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>⚙</div>
          <div>
            <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800 }}>TERA — SE III / Infra Lead</h1>
            <p style={{ margin: 0, color: "#64748b", fontSize: 13 }}>
              Build −64.18% · Memory −49.15% · Vulnerabilities −42.2% · Tech Roadmap · Mentoring
            </p>
          </div>
        </div>
        {/* KPI cards */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8, marginBottom: 12 }}>
          {[
            { v: "−64.18%", l: "Local Build Time",          c: "#0ea5e9", sub: "Webpack 4 + Babel → Rspack + SWC" },
            { v: "−49.15%", l: "Avg Memory Usage",          c: "#22c55e", sub: "Dev server + test runner" },
            { v: "−42.2%",  l: "Vulns per Audited Package", c: "#f59e0b", sub: "npm audit + dep cleanup" },
            { v: "0%",      l: "CI Test Flake Rate",        c: "#a855f7", sub: "MSW + fake timers + isolation" },
          ].map(m => (
            <div key={m.l} style={{ background: "#1e293b", border: `1px solid ${m.c}20`, borderRadius: 10, padding: 12 }}>
              <div style={{ fontSize: 22, fontWeight: 900, color: m.c }}>{m.v}</div>
              <div style={{ fontSize: 9, fontWeight: 700, marginBottom: 2 }}>{m.l}</div>
              <div style={{ fontSize: 8, color: "#475569" }}>{m.sub}</div>
            </div>
          ))}
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {["SE III Web", "Infra Lead", "Tech Roadmap", "Rspack", "SWC", "pnpm", "LightningCSS", "Jest 29", "MSW", "Renovate", "Semgrep", "ADRs", "Mentoring"].map(t => (
            <span key={t} style={{ background: "#1e293b", color: "#94a3b8", border: "1px solid #334155", borderRadius: 20, padding: "3px 10px", fontSize: 11 }}>{t}</span>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 4, marginBottom: 20, borderBottom: "1px solid #1e293b", paddingBottom: 4 }}>
        {TABS.map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{ background: activeTab === tab.id ? "#1e293b" : "transparent", color: activeTab === tab.id ? "#f1f5f9" : "#64748b", border: activeTab === tab.id ? "1px solid #334155" : "1px solid transparent", borderRadius: "8px 8px 0 0", padding: "8px 20px", cursor: "pointer", fontSize: 13, fontWeight: 600 }}>{tab.label}</button>
        ))}
      </div>

      {/* ── BUILD & MEMORY ── */}
      {activeTab === "build" && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
          {/* Build simulator */}
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: "#64748b", letterSpacing: "0.08em" }}>BUILD SIMULATION — BEFORE & AFTER</div>
              <button onClick={runBuild} disabled={buildState === "running-before" || buildState === "running-after"} style={{ background: buildState !== "idle" && buildState !== "done" ? "#334155" : "#0066ff20", border: `1px solid ${buildState !== "idle" && buildState !== "done" ? "#334155" : "#0066ff"}`, borderRadius: 6, padding: "4px 12px", color: buildState !== "idle" && buildState !== "done" ? "#64748b" : "#60a5fa", cursor: buildState !== "idle" && buildState !== "done" ? "not-allowed" : "pointer", fontSize: 9 }}>
                {buildState === "idle" ? "▶ Run Simulation" : buildState === "done" ? "↺ Replay" : "⏳ Building..."}
              </button>
            </div>

            {/* BEFORE */}
            <div style={{ background: "#1e293b", border: "1px solid #334155", borderRadius: 10, padding: 12, marginBottom: 8 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                <div style={{ fontSize: 9, fontWeight: 700, color: "#ef4444" }}>BEFORE — Webpack 4 + Babel</div>
                <div style={{ fontSize: 10, fontWeight: 900, color: "#ef4444" }}>{(BEFORE_TOTAL / 1000).toFixed(1)}s</div>
              </div>
              {BEFORE_STEPS.map((step, i) => {
                const visible = beforeLog.length > i;
                const pct = (step.ms / BEFORE_TOTAL) * 100;
                return (
                  <div key={step.label} style={{ marginBottom: 4, opacity: visible ? 1 : 0.2, transition: "opacity 0.3s" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 8, marginBottom: 2 }}>
                      <span style={{ color: "#94a3b8" }}>{step.label}</span>
                      <span style={{ color: step.color }}>{step.ms}ms</span>
                    </div>
                    <div style={{ background: "#0f172a", borderRadius: 2, height: 6, overflow: "hidden" }}>
                      <div style={{ background: step.color, height: "100%", width: visible ? `${pct}%` : "0%", borderRadius: 2, transition: "width 0.4s" }} />
                    </div>
                  </div>
                );
              })}
            </div>

            {/* AFTER */}
            <div style={{ background: "#1e293b", border: "1px solid #22c55e20", borderRadius: 10, padding: 12, marginBottom: 8 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                <div style={{ fontSize: 9, fontWeight: 700, color: "#22c55e" }}>AFTER — Rspack + SWC</div>
                <div style={{ fontSize: 10, fontWeight: 900, color: "#22c55e" }}>{(AFTER_TOTAL / 1000).toFixed(1)}s <span style={{ fontSize: 8, color: "#4ade80" }}>▼ 64.18%</span></div>
              </div>
              {AFTER_STEPS.map((step, i) => {
                const visible = afterLog.length > i;
                const pct = (step.ms / BEFORE_TOTAL) * 100;
                return (
                  <div key={step.label} style={{ marginBottom: 4, opacity: visible ? 1 : 0.2, transition: "opacity 0.3s" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 8, marginBottom: 2 }}>
                      <span style={{ color: "#94a3b8" }}>{step.label}</span>
                      <span style={{ color: "#22c55e" }}>{step.ms}ms</span>
                    </div>
                    <div style={{ background: "#0f172a", borderRadius: 2, height: 6, overflow: "hidden" }}>
                      <div style={{ background: "#22c55e", height: "100%", width: visible ? `${pct}%` : "0%", borderRadius: 2, transition: "width 0.4s" }} />
                    </div>
                  </div>
                );
              })}
            </div>

            {buildState === "done" && (
              <div style={{ background: "#22c55e15", border: "1px solid #22c55e30", borderRadius: 8, padding: 10, display: "flex", gap: 16, justifyContent: "center" }}>
                <div style={{ textAlign: "center" }}>
                  <div style={{ fontSize: 18, fontWeight: 900, color: "#ef4444" }}>{(BEFORE_TOTAL / 1000).toFixed(1)}s</div>
                  <div style={{ fontSize: 8, color: "#64748b" }}>Before</div>
                </div>
                <div style={{ fontSize: 20, color: "#334155", alignSelf: "center" }}>→</div>
                <div style={{ textAlign: "center" }}>
                  <div style={{ fontSize: 18, fontWeight: 900, color: "#22c55e" }}>{(AFTER_TOTAL / 1000).toFixed(1)}s</div>
                  <div style={{ fontSize: 8, color: "#64748b" }}>After</div>
                </div>
                <div style={{ textAlign: "center" }}>
                  <div style={{ fontSize: 18, fontWeight: 900, color: "#0ea5e9" }}>−64.18%</div>
                  <div style={{ fontSize: 8, color: "#64748b" }}>Improvement</div>
                </div>
              </div>
            )}
          </div>

          {/* Memory + what changed */}
          <div>
            {/* Memory comparison */}
            <div style={{ fontSize: 10, fontWeight: 700, color: "#64748b", marginBottom: 8, letterSpacing: "0.08em" }}>
              MEMORY USAGE — DEV SERVER + TEST RUNNER
            </div>
            <div style={{ background: "#1e293b", border: "1px solid #334155", borderRadius: 10, padding: 12, marginBottom: 10 }}>
              {[
                { label: "Dev server idle",        before: 820, after: 380,  unit: "MB" },
                { label: "Dev server (HMR active)", before: 1340, after: 590, unit: "MB" },
                { label: "Test runner (jest)",      before: 640, after: 360,  unit: "MB" },
                { label: "Build peak",              before: 1680, after: 920, unit: "MB" },
              ].map(m => {
                const maxVal = 2000;
                const imp = Math.round(((m.before - m.after) / m.before) * 100);
                return (
                  <div key={m.label} style={{ marginBottom: 10 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 9, marginBottom: 4 }}>
                      <span style={{ color: "#94a3b8" }}>{m.label}</span>
                      <span style={{ color: "#22c55e" }}>−{imp}%</span>
                    </div>
                    <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
                      <div style={{ width: 28, fontSize: 7, color: "#475569" }}>Before</div>
                      <div style={{ flex: 1, background: "#0f172a", borderRadius: 3, height: 8, overflow: "hidden" }}>
                        <div style={{ background: "#ef4444", height: "100%", width: `${(m.before / maxVal) * 100}%`, borderRadius: 3 }} />
                      </div>
                      <div style={{ fontSize: 8, color: "#ef4444", width: 50, textAlign: "right" }}>{m.before}{m.unit}</div>
                    </div>
                    <div style={{ display: "flex", gap: 4, alignItems: "center", marginTop: 2 }}>
                      <div style={{ width: 28, fontSize: 7, color: "#475569" }}>After</div>
                      <div style={{ flex: 1, background: "#0f172a", borderRadius: 3, height: 8, overflow: "hidden" }}>
                        <div style={{ background: "#22c55e", height: "100%", width: `${(m.after / maxVal) * 100}%`, borderRadius: 3 }} />
                      </div>
                      <div style={{ fontSize: 8, color: "#22c55e", width: 50, textAlign: "right" }}>{m.after}{m.unit}</div>
                    </div>
                  </div>
                );
              })}
            </div>

            <CodeBlock label="What caused 64.18% build time + 49.15% memory improvements" color="#0ea5e9" code={
`// BUILD TIME: WEBPACK 4 + BABEL → RSPACK 1 + SWC

// 1. BUNDLER: Webpack 4 → Rspack 1 (Rust-based)
//    Webpack 4 is JavaScript. Each module is processed sequentially.
//    Rspack is written in Rust. Module processing is parallelized
//    across all CPU cores via Rayon thread pool.
//    Rspack is Webpack-compatible: same config, same plugin API.
//    Migration: change bundler in build config. Almost no code changes.

// 2. TRANSPILER: Babel → SWC
//    Babel: JavaScript. Runs in a single thread per file.
//    SWC: written in Rust. 10-70× faster than Babel.
//    Rspack uses SWC by default: no separate loader needed.

// 3. CSS: PostCSS → LightningCSS
//    LightningCSS: Rust-based. Parses + transforms + minifies in one pass.
//    PostCSS: JavaScript, plugin chain, multiple passes.
//    LightningCSS is 100× faster for the same transforms.

// 4. TYPE CHECKING: tsc full → isolatedModules + fork-ts-checker
//    tsc (full): single-pass type checking of the entire project.
//    Slow. Blocks the build. Must complete before bundling.
//
//    With isolatedModules:
//    TypeScript transpiles each file independently (no type info needed).
//    Bundler (Rspack/SWC) handles transpilation.
//    Type checking runs separately in fork-ts-checker (parallel, non-blocking).
//    Build no longer waits for type checking.
//    Errors still caught in CI. Type safety maintained.

// 5. PACKAGE MANAGER: npm → pnpm
//    pnpm uses a content-addressable store: packages shared across projects.
//    install: significantly faster (no re-downloading shared deps).
//    Disk space: reduced by deduplication of identical packages.

// MEMORY (49.15% reduction):
// Webpack 4 held the entire module graph in memory during dev server.
// With HMR: each hot update re-processes the changed module's subtree.
// In large codebases: module graph can be 500MB-1GB+.
//
// Rspack's memory model:
// - Incremental compilation: only changed modules re-processed.
// - Module graph stored in Rust (more efficient than JS objects).
// - GC pressure: no JS garbage collection on module graph.
//
// Test runner (Jest): memory spike from running all tests in one process.
// Fix: --maxWorkers=50% (use half of CPUs), --workerIdleMemoryLimit=512MB.
// jest-circus as test runner (lighter than jasmine-based jest 27 runner).`} />

            <div style={{ marginTop: 10 }}>
              <CodeBlock label="Test stability — eliminating flaky tests in CI" color="#a855f7" code={
`// BEFORE: 18% of test runs had at least one flaky test failure.
// CI: re-run on failure → 2-3 retries per PR → 40% extra CI time.

// ROOT CAUSES OF FLAKINESS:

// 1. TIME-DEPENDENT TESTS:
// BAD: expect(getRelativeTime(new Date())).toBe("just now")
//      This passes at 09:59:59. Fails at 10:00:00 if the test
//      spans the second boundary.
// FIX: jest.useFakeTimers() + jest.setSystemTime(fixedDate)
//      All time calls in the test use the fixed date. No flakiness.

// 2. REAL NETWORK CALLS IN UNIT TESTS:
// BAD: useEffect calls fetch("/api/rooms") in the component.
//      Unit test renders the component → real HTTP request made.
//      Fails: network unavailable in CI, or API rate-limited.
// FIX: Mock Service Worker (MSW) with node adapter.
//      MSW intercepts fetch() at the network layer.
//      No real HTTP. Consistent. No rate limits.

// 3. RACE CONDITIONS IN ASYNC TESTS:
// BAD: await userEvent.click(button); expect(result).toBeVisible();
//      The state update is async. In a slow CI machine:
//      expect() runs before the update completes.
// FIX: waitFor(() => expect(result).toBeVisible())
//      React Testing Library's waitFor retries until timeout.

// 4. TEST ISOLATION FAILURES:
// BAD: Test A writes to module-level state. Test B reads it.
//      Order matters. Parallel test runs break.
// FIX: beforeEach(() => jest.resetModules()) or jest.isolateModules().
//      Each test runs in isolation. No shared module state.

// RESULT:
// 0% flaky test rate in CI (100 consecutive PR runs without flake).
// CI time reduced by 23% (no re-runs needed).
// Engineers trust the CI. "CI red" means "your code is broken"
// (not "the test is flaky again").`} />
            </div>
          </div>
        </div>
      )}

      {/* ── SECURITY ── */}
      {activeTab === "security" && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 260px", gap: 14 }}>
          {/* Audit */}
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: "#64748b", letterSpacing: "0.08em" }}>DEPENDENCY VULNERABILITY AUDIT</div>
              <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                {(["all", "critical", "high", "medium", "low"] as const).map(f => (
                  <button key={f} onClick={() => setSevFilter(f)} style={{ background: sevFilter === f ? (f === "all" ? "#1e3a5f" : SEV_COLOR[f as Severity] + "30") : "#1e293b", border: `1px solid ${sevFilter === f ? (f === "all" ? "#3b82f6" : SEV_COLOR[f as Severity]) : "#334155"}`, borderRadius: 5, padding: "3px 8px", cursor: "pointer", color: sevFilter === f ? (f === "all" ? "#60a5fa" : SEV_COLOR[f as Severity]) : "#64748b", fontSize: 8 }}>
                    {f.toUpperCase()}
                  </button>
                ))}
                <button onClick={runAudit} disabled={auditState === "scanning"} style={{ background: auditState === "scanning" ? "#334155" : "#0066ff20", border: `1px solid ${auditState === "scanning" ? "#334155" : "#0066ff"}`, borderRadius: 6, padding: "3px 12px", color: auditState === "scanning" ? "#64748b" : "#60a5fa", cursor: auditState === "scanning" ? "not-allowed" : "pointer", fontSize: 9 }}>
                  {auditState === "scanning" ? "⏳ Scanning..." : auditState === "done" ? "↺ Re-scan" : "▶ Audit"}
                </button>
              </div>
            </div>

            {/* Summary */}
            {auditState !== "idle" && (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 6, marginBottom: 10 }}>
                {(["critical", "high", "medium", "low"] as Severity[]).map(sev => {
                  const total = VULNS.filter(v => v.severity === sev).length;
                  const remaining = VULNS.filter(v => v.severity === sev && !v.fixed).length;
                  return (
                    <div key={sev} style={{ background: "#1e293b", border: `1px solid ${SEV_COLOR[sev]}30`, borderRadius: 8, padding: "8px 10px", textAlign: "center" }}>
                      <div style={{ fontSize: 9, fontWeight: 700, color: SEV_COLOR[sev], marginBottom: 3 }}>{sev.toUpperCase()}</div>
                      <div style={{ fontSize: 14, fontWeight: 900, color: remaining > 0 ? SEV_COLOR[sev] : "#22c55e" }}>{remaining}</div>
                      <div style={{ fontSize: 7, color: "#475569" }}>of {total} fixed</div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Vuln list */}
            <div style={{ background: "#1e293b", border: "1px solid #334155", borderRadius: 10, overflow: "hidden" }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 80px 70px 80px 100px", padding: "6px 10px", borderBottom: "1px solid #0f172a", fontSize: 8, color: "#475569" }}>
                <div>Package</div><div>Via</div><div>Severity</div><div>Status</div><div>Fix Applied</div>
              </div>
              {filtered.slice(0, visibleVulns).map((v, i) => (
                <div key={v.pkg} style={{ display: "grid", gridTemplateColumns: "1fr 80px 70px 80px 100px", padding: "8px 10px", borderBottom: i < filtered.length - 1 ? "1px solid #0f172a" : "none", alignItems: "center", borderLeft: `3px solid ${v.fixed ? "#22c55e40" : SEV_COLOR[v.severity] + "60"}` }}>
                  <div style={{ fontSize: 9, fontWeight: 600, fontFamily: "monospace" }}>{v.pkg}</div>
                  <div style={{ fontSize: 7, color: "#475569", fontFamily: "monospace", overflow: "hidden", textOverflow: "ellipsis" }}>{v.via}</div>
                  <div style={{ fontSize: 7, background: SEV_COLOR[v.severity] + "20", color: SEV_COLOR[v.severity], borderRadius: 3, padding: "1px 5px", textAlign: "center" }}>{v.severity}</div>
                  <div style={{ fontSize: 7, color: v.fixed ? "#22c55e" : "#ef4444" }}>{v.fixed ? "✓ Fixed" : "⚠ Open"}</div>
                  <div style={{ fontSize: 7, color: "#64748b", fontFamily: "monospace", overflow: "hidden", textOverflow: "ellipsis" }}>{v.fix || "—"}</div>
                </div>
              ))}
              {auditState === "idle" && <div style={{ padding: 16, textAlign: "center", fontSize: 9, color: "#334155" }}>Click "Audit" to scan dependencies</div>}
            </div>

            {auditState === "done" && (
              <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
                <div style={{ flex: 1, background: "#1e293b", border: "1px solid #334155", borderRadius: 8, padding: 10, textAlign: "center" }}>
                  <div style={{ fontSize: 8, color: "#64748b" }}>Before</div>
                  <div style={{ fontSize: 18, fontWeight: 900, color: "#ef4444" }}>{beforeCount} vulns</div>
                </div>
                <div style={{ flex: 1, background: "#1e293b", border: "1px solid #22c55e30", borderRadius: 8, padding: 10, textAlign: "center" }}>
                  <div style={{ fontSize: 8, color: "#64748b" }}>After</div>
                  <div style={{ fontSize: 18, fontWeight: 900, color: "#22c55e" }}>{afterCount} remaining</div>
                </div>
                <div style={{ flex: 1, background: "#1e293b", border: "1px solid #0ea5e940", borderRadius: 8, padding: 10, textAlign: "center" }}>
                  <div style={{ fontSize: 8, color: "#64748b" }}>Improvement</div>
                  <div style={{ fontSize: 18, fontWeight: 900, color: "#0ea5e9" }}>−42.2%</div>
                </div>
              </div>
            )}
          </div>

          {/* Tech stack + SAST */}
          <div>
            <div style={{ fontSize: 10, fontWeight: 700, color: "#64748b", marginBottom: 8, letterSpacing: "0.08em" }}>TECH STACK AUDIT</div>
            {TECH_STACK.map(t => (
              <div key={t.name} style={{ background: "#1e293b", border: `1px solid ${t.color}20`, borderRadius: 7, padding: "7px 10px", marginBottom: 5 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div style={{ fontSize: 9, fontWeight: 700 }}>{t.name}</div>
                  <div style={{ fontSize: 7, background: t.color + "20", color: t.color, borderRadius: 3, padding: "1px 5px" }}>{t.risk}</div>
                </div>
                <div style={{ display: "flex", gap: 4, marginTop: 3, fontSize: 8, color: "#64748b" }}>
                  <span style={{ color: "#ef444490", textDecoration: "line-through" }}>{t.before}</span>
                  <span style={{ color: "#334155" }}>→</span>
                  <span style={{ color: "#94a3b8" }}>{t.after}</span>
                </div>
              </div>
            ))}

            <div style={{ marginTop: 8 }}>
              <CodeBlock label="Continuous security — Renovate + Semgrep in CI" color="#f59e0b" code={
`// SECURITY HARDENING STRATEGY:

// 1. RENOVATE BOT (automated dep updates):
//    Runs daily. Opens PRs for outdated deps.
//    Config: { "extends": ["config:base"] }
//    Grouped: minor/patch updates bundled per day.
//    Automerge: patch updates with 0 test failures.
//    Pins: lockfile updates automatically.
//
//    Before: deps manually updated (quarterly at best).
//    Most vulns: in outdated transitive deps.
//    After: deps updated within days of fix release.

// 2. SEMGREP (static analysis security testing):
//    Runs on every PR (CI gate).
//    Rules: OWASP Top 10, React-specific XSS patterns.
//    Example caught: dangerouslySetInnerHTML with user input.
//    Example caught: URL constructed from user params (open redirect).
//    
//    Integration: Semgrep → GitHub PR comments (line-by-line).
//    Engineer sees: "This pattern could cause XSS. Fix suggestion: ..."
//
// 3. NPM AUDIT IN CI:
//    Before: audit only run manually (rarely).
//    After: npm audit --audit-level=high in CI.
//    CRITICAL or HIGH severity: blocked PR (must be fixed before merge).
//    MEDIUM severity: PR warning (must acknowledge or fix in 1 sprint).
//    LOW: tracked but not blocking.
//
//    This is how 42.2% was achieved:
//    - Baseline audit: 73 vulnerabilities across audited packages.
//    - Node 14 EOL → Node 20: eliminated 12 vulns in one upgrade.
//    - Removed unused packages (webpack-bundle-analyzer, aws-sdk): 8 vulns.
//    - Upgraded remaining: 26 more vulns resolved.
//    - After: 42 → 0 after Renovate maintained the baseline.`} />
            </div>
          </div>
        </div>
      )}

      {/* ── ROADMAP ── */}
      {activeTab === "roadmap" && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
          {/* Roadmap + ADRs */}
          <div>
            <div style={{ fontSize: 10, fontWeight: 700, color: "#64748b", marginBottom: 8, letterSpacing: "0.08em" }}>TECH ROADMAP — ACCOMMODATION FE WEB</div>
            {ROADMAP.map(q => (
              <div key={q.quarter} style={{ background: "#1e293b", border: `1px solid ${q.color}30`, borderRadius: 10, padding: 12, marginBottom: 8 }}>
                <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 8 }}>
                  <div style={{ width: 32, height: 32, borderRadius: 6, background: q.color + "20", border: `1px solid ${q.color}40`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 900, color: q.color }}>{q.quarter}</div>
                  <div>
                    <div style={{ fontSize: 10, fontWeight: 800 }}>{q.theme}</div>
                    <div style={{ fontSize: 7, background: q.status === "done" ? "#22c55e20" : "#0ea5e920", color: q.status === "done" ? "#22c55e" : "#0ea5e9", borderRadius: 3, padding: "0 4px", display: "inline-block" }}>{q.status}</div>
                  </div>
                </div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                  {q.items.map(item => (
                    <span key={item} style={{ background: q.color + "10", color: q.color, border: `1px solid ${q.color}20`, borderRadius: 4, padding: "2px 6px", fontSize: 8 }}>
                      {q.status === "done" ? "✓ " : ""}{item}
                    </span>
                  ))}
                </div>
              </div>
            ))}

            {/* ADRs */}
            <div style={{ fontSize: 10, fontWeight: 700, color: "#64748b", marginBottom: 8, letterSpacing: "0.08em" }}>ARCHITECTURAL DECISION RECORDS (ADRs)</div>
            {ADRS.map((adr, i) => (
              <div key={adr.id} style={{ display: "flex", gap: 8, alignItems: "center", background: "#1e293b", borderRadius: 7, padding: "7px 10px", marginBottom: 4, borderLeft: `3px solid ${adr.status === "accepted" ? "#22c55e" : "#f59e0b"}` }}>
                <div style={{ fontSize: 8, fontFamily: "monospace", color: "#475569", flexShrink: 0 }}>{adr.id}</div>
                <div style={{ flex: 1, fontSize: 9 }}>{adr.title}</div>
                <div style={{ fontSize: 7, color: "#475569" }}>{adr.date}</div>
                <div style={{ fontSize: 7, color: adr.status === "accepted" ? "#22c55e" : "#f59e0b", background: (adr.status === "accepted" ? "#22c55e" : "#f59e0b") + "20", borderRadius: 3, padding: "0 4px" }}>{adr.status}</div>
              </div>
            ))}
          </div>

          {/* Best practices + mentoring */}
          <div>
            <div style={{ fontSize: 10, fontWeight: 700, color: "#64748b", marginBottom: 8, letterSpacing: "0.08em" }}>MENTORING — JUNIOR ENGINEERS</div>
            {MENTEES.map(m => (
              <div key={m.name} style={{ background: "#1e293b", border: "1px solid #334155", borderRadius: 8, padding: 10, marginBottom: 6 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
                  <div style={{ fontSize: 10, fontWeight: 700 }}>{m.name}</div>
                  <div style={{ fontSize: 8, color: "#22c55e" }}>{m.level}</div>
                </div>
                <div style={{ fontSize: 8, color: "#64748b" }}>Topics: {m.topics}</div>
                <div style={{ fontSize: 7, color: "#475569", marginTop: 2 }}>Duration: {m.months} months</div>
              </div>
            ))}

            <div style={{ marginTop: 8 }}>
              <CodeBlock label="Tech roadmap — how a Domain Lead collaborates" color="#0066ff" code={
`// COLLABORATING WITH THE DOMAIN LEAD ON TECH ROADMAP:

// THE STRUCTURE:
// Domain Lead: sets product + people direction for the domain.
// SE III (infra): provides technical direction for the platform.
// Together: the roadmap is both product-viable and technically sound.

// MY CONTRIBUTION TO THE ROADMAP:
// 1. TECH DEBT AUDIT (start of year):
//    Inventory every component of the tech stack.
//    For each: version, EOL date, known issues, migration effort.
//    Output: a prioritized list of tech debt items.
//    
//    Prioritization criteria:
//    - Security risk (EOL, known CVEs): highest priority.
//    - Developer experience impact (slow build → slow delivery): high.
//    - Operational cost (memory usage → more expensive infra): medium.
//    - Feature velocity impact (outdated API → workarounds): medium.

// 2. PROPOSAL FORMAT (for Domain Lead review):
//    Every roadmap item: a one-page proposal.
//    "Why now: Node 14 reaches EOL in April. Security patches stop."
//    "What: upgrade to Node 20 LTS."
//    "Effort: 2 weeks (test all packages for Node 20 compat)."
//    "Risk: low (tested in staging, Node 20 is backward-compatible)."
//    "Impact: eliminates 12 CVEs, unblocks pnpm upgrade."
//    Domain Lead: approves or defers. Clear rationale either way.

// 3. BEST PRACTICES DOCUMENTATION:
//    Written standards for the team. Not just "rules" — "why" included.
//    Examples:
//    "Use MSW for API mocking. Why: test isolation, no real HTTP in unit tests."
//    "Use jest.useFakeTimers() in time-dependent tests. Why: eliminates flakiness."
//    "Run pnpm audit in pre-commit. Why: catch vulns before they reach CI."
//    Published to internal wiki + enforced via lint rules where possible.
//    New engineers: read the best practices on day 1. Standards are explicit.`} />
            </div>

            <div style={{ marginTop: 10 }}>
              <CodeBlock label="Mentoring — what effective 1:1 mentoring looks like" color="#a855f7" code={
`// MENTORING APPROACH (for junior → mid-level progression):

// 1. STRUCTURED 1:1s (weekly, 30-45 minutes):
//    Two parts: (a) current blockers, (b) growth topic.
//    Blockers: "Where are you stuck? What have you tried?"
//    Growth: a topic we agreed to focus on this month.
//    Example growth topics: async patterns, TypeScript generics,
//    reading performance profiling, understanding the Redux store.

// 2. CODE REVIEW AS TEACHING:
//    Not just: "Change this to X."
//    But: "This works, but here's why X is better: [explanation]."
//         "What do you think would happen if [edge case]?"
//         "Have you considered what this does when the API returns null?"
//    Goal: the mentee learns the reasoning, not just the answer.
//    They can apply the same reasoning to the next problem themselves.

// 3. PAIR PROGRAMMING ON COMPLEX PROBLEMS:
//    When a junior hits a genuinely hard problem:
//    Don't take over the keyboard.
//    Sit together. Ask questions. "What does this error mean?"
//    Guide the debugging process. They do the thinking, I facilitate.
//    Outcome: they solved the problem (important for confidence).
//    They learned the debugging technique (important for next time).

// 4. GRADUATED OWNERSHIP:
//    Month 1: shadow. Watch how a feature is built end-to-end.
//    Month 2: co-build. Work on a feature together.
//    Month 3: solo + review. Build independently, I review.
//    Month 4+: own a small project. I review only.
//    The goal: engineer who is independent and can unblock themselves.
//
// MEASURING MENTORING EFFECTIVENESS:
//    Not "did they thank me" but:
//    "Can they independently debug a TypeScript type error?"
//    "Do their PRs require fewer revision rounds than 3 months ago?"
//    "Do they proactively ask the right questions (not just 'is this correct?')?"
//    "Did they progress to the next level (Junior → Mid)?" ← ultimate metric.`} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default TeraStaffDemo;
