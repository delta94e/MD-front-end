/**
 * PlatformEngineeringDemo.tsx
 *
 * Platform / Frontend Infrastructure Engineering
 *
 * Four key achievements:
 *   1. Shared Front-End Component Library — led development + adoption across teams
 *   2. CI Reliability/Performance Check System — 30+ projects improved
 *   3. Data Reporting System — load times + bundle sizes reduced across projects
 *   4. Scaffolding Tool — streamlined MVP development for web projects
 *
 * TABS
 *   📦 Component Library  — interactive showcase, adoption timeline, issue resolution
 *   🔍 CI Checks          — 30+ project reliability dashboard, performance budgets
 *   🛠 Scaffold + 📊 Data  — CLI simulator + reporting metrics dashboard
 */

import React, { useState, useEffect, useRef, useCallback } from "react";

// ─────────────────────────────────────────────────────────────────
// Component Library data
// ─────────────────────────────────────────────────────────────────

const ADOPTION_QUARTERS = [
  { q: "Q1",  teams: 3,  components: 12, prs: 18 },
  { q: "Q2",  teams: 11, components: 28, prs: 64 },
  { q: "Q3",  teams: 22, components: 41, prs: 133 },
  { q: "Q4",  teams: 34, components: 58, prs: 209 },
];

const CHANGELOG = [
  { ver: "3.2.1", type: "fix",    desc: "Button: disabled state missing focus ring",         projects: 34, color: "#22c55e" },
  { ver: "3.2.0", type: "feat",   desc: "DataTable: added sortable + pagination support",    projects: 34, color: "#0ea5e9" },
  { ver: "3.1.2", type: "fix",    desc: "Input: password toggle icon misaligned on iOS",     projects: 34, color: "#22c55e" },
  { ver: "3.1.0", type: "feat",   desc: "Toast: new positions (top-center, bottom-center)",  projects: 28, color: "#0ea5e9" },
  { ver: "3.0.0", type: "break",  desc: "Button: size prop renamed sm/md/lg (codemod avail.)",projects: 22, color: "#f59e0b" },
];

// ─────────────────────────────────────────────────────────────────
// CI check data
// ─────────────────────────────────────────────────────────────────

type CheckStatus = "pass" | "warn" | "fail" | "pending";
interface Project {
  name: string; team: string;
  bundle: { size: number; limit: number };
  coverage: number;
  perf: number;
  status: CheckStatus;
}

const PROJECTS: Project[] = [
  { name: "hotel-search",       team: "Supply",      bundle: { size: 248, limit: 300 }, coverage: 88, perf: 94, status: "pending" },
  { name: "partner-portal",     team: "Supply",      bundle: { size: 294, limit: 300 }, coverage: 82, perf: 79, status: "pending" },
  { name: "booking-flow",       team: "Demand",      bundle: { size: 186, limit: 250 }, coverage: 91, perf: 96, status: "pending" },
  { name: "payment-widget",     team: "Payments",    bundle: { size: 98,  limit: 120 }, coverage: 95, perf: 98, status: "pending" },
  { name: "review-service",     team: "Trust",       bundle: { size: 142, limit: 150 }, coverage: 76, perf: 88, status: "pending" },
  { name: "cms-editor",         team: "Content",     bundle: { size: 412, limit: 400 }, coverage: 61, perf: 71, status: "pending" },
  { name: "analytics-dash",     team: "Data",        bundle: { size: 338, limit: 350 }, coverage: 84, perf: 87, status: "pending" },
  { name: "notification-hub",   team: "Platform",    bundle: { size: 88,  limit: 100 }, coverage: 92, perf: 97, status: "pending" },
  { name: "auth-service",       team: "Security",    bundle: { size: 64,  limit: 80  }, coverage: 97, perf: 99, status: "pending" },
  { name: "activity-feed",      team: "Social",      bundle: { size: 196, limit: 200 }, coverage: 79, perf: 83, status: "pending" },
  { name: "search-filters",     team: "Search",      bundle: { size: 276, limit: 280 }, coverage: 85, perf: 91, status: "pending" },
  { name: "mobile-checkout",    team: "Demand",      bundle: { size: 174, limit: 180 }, coverage: 88, perf: 93, status: "pending" },
];

function resolveStatus(p: Project): CheckStatus {
  const bundleOk = p.bundle.size <= p.bundle.limit;
  const covOk    = p.coverage >= 80;
  const perfOk   = p.perf >= 85;
  if (!bundleOk || (!covOk && !perfOk)) return "fail";
  if (!covOk || !perfOk || p.bundle.size > p.bundle.limit * 0.95) return "warn";
  return "pass";
}

// ─────────────────────────────────────────────────────────────────
// Data Reporting + Scaffolding data
// ─────────────────────────────────────────────────────────────────

const PERF_PROJECTS = [
  { name: "hotel-search",    lcp: { before: 3.8, after: 1.6 }, bundle: { before: 1240, after: 412 }, fid: { before: 280, after: 80  } },
  { name: "partner-portal",  lcp: { before: 4.2, after: 1.9 }, bundle: { before: 980,  after: 294 }, fid: { before: 310, after: 95  } },
  { name: "booking-flow",    lcp: { before: 2.9, after: 1.3 }, bundle: { before: 640,  after: 186 }, fid: { before: 210, after: 60  } },
  { name: "analytics-dash",  lcp: { before: 5.1, after: 2.4 }, bundle: { before: 1480, after: 338 }, fid: { before: 450, after: 120 } },
];

const CLI_LINES = [
  { text: "$ npx create-fe-app my-dashboard --template react-ts", color: "#f1f5f9" },
  { text: "", color: "" },
  { text: "🚀  Scaffolding my-dashboard...", color: "#22c55e" },
  { text: "📁  Creating project structure", color: "#94a3b8" },
  { text: "    ├── src/components/", color: "#475569" },
  { text: "    ├── src/pages/", color: "#475569" },
  { text: "    ├── src/store/", color: "#475569" },
  { text: "    ├── .github/workflows/", color: "#475569" },
  { text: "    │   └── ci.yml  ← pre-configured checks", color: "#0ea5e9" },
  { text: "    ├── tsconfig.json", color: "#475569" },
  { text: "    └── vite.config.ts", color: "#475569" },
  { text: "", color: "" },
  { text: "📦  Installing dependencies", color: "#94a3b8" },
  { text: "    + @company/ui@3.2.1          (component library)", color: "#a855f7" },
  { text: "    + react@18.2.0", color: "#64748b" },
  { text: "    + typescript@5.3.3", color: "#64748b" },
  { text: "    + vite@5.0.0", color: "#64748b" },
  { text: "    + vitest@1.3.0", color: "#64748b" },
  { text: "", color: "" },
  { text: "⚙️   Configuring CI performance gates", color: "#94a3b8" },
  { text: "    ✓  Bundle budget: 300KB", color: "#22c55e" },
  { text: "    ✓  Coverage threshold: 80%", color: "#22c55e" },
  { text: "    ✓  Lighthouse CI: perf > 85", color: "#22c55e" },
  { text: "    ✓  Data reporting: enabled", color: "#22c55e" },
  { text: "    ✓  @company/ui already installed & configured", color: "#22c55e" },
  { text: "", color: "" },
  { text: "✅  Done! Scaffolded in 11s", color: "#22c55e" },
  { text: "    cd my-dashboard && npm run dev", color: "#64748b" },
];

const TEMPLATES = [
  { id: "react-ts",    name: "React + TypeScript", desc: "Standard web app. Vite, Vitest, @company/ui.", icon: "⚛", time: "~12s" },
  { id: "next-ts",     name: "Next.js + TypeScript", desc: "SSR app. App router, tRPC ready.", icon: "▲", time: "~18s" },
  { id: "lib",         name: "Library", desc: "Publishable package. Rollup + TypeDoc.", icon: "📦", time: "~8s"  },
  { id: "micro-fe",   name: "Micro-Frontend", desc: "Module Federation remote. Host-ready.", icon: "🧩", time: "~20s" },
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

const STATUS_COLOR: Record<CheckStatus, string> = { pass: "#22c55e", warn: "#f59e0b", fail: "#ef4444", pending: "#475569" };
const STATUS_ICON:  Record<CheckStatus, string> = { pass: "✓", warn: "⚠", fail: "✗", pending: "○" };

// ─────────────────────────────────────────────────────────────────
// Main
// ─────────────────────────────────────────────────────────────────

export function PlatformEngineeringDemo() {
  const [activeTab, setActiveTab] = useState<"library" | "ci" | "scaffold">("library");

  // ── Component library state
  const [activeVariant, setActiveVariant] = useState("primary");
  const [activeInput, setActiveInput] = useState("default");
  const [showChangelog, setShowChangelog] = useState(false);

  // ── CI state
  const [projects, setProjects] = useState<(Project & { resolvedStatus: CheckStatus })[]>(
    PROJECTS.map(p => ({ ...p, resolvedStatus: "pending" }))
  );
  const [running, setRunning] = useState(false);
  const ciRef = useRef(false);

  const runChecks = useCallback(async () => {
    if (ciRef.current) return;
    ciRef.current = true;
    setRunning(true);
    setProjects(PROJECTS.map(p => ({ ...p, resolvedStatus: "pending" })));
    for (let i = 0; i < PROJECTS.length; i++) {
      await new Promise(r => setTimeout(r, 220));
      setProjects(prev => {
        const next = [...prev];
        next[i] = { ...next[i], resolvedStatus: resolveStatus(PROJECTS[i]) };
        return next;
      });
    }
    setRunning(false);
    ciRef.current = false;
  }, []);

  // ── CLI state
  const [cliLines, setCliLines] = useState<typeof CLI_LINES>([]);
  const [cliRunning, setCliRunning] = useState(false);
  const [selectedTpl, setSelectedTpl] = useState("react-ts");
  const cliRef = useRef(false);

  const runCLI = useCallback(async () => {
    if (cliRef.current) return;
    cliRef.current = true;
    setCliRunning(true);
    setCliLines([]);
    for (const line of CLI_LINES) {
      await new Promise(r => setTimeout(r, line.text === "" ? 100 : 140));
      setCliLines(prev => [...prev, line]);
    }
    setCliRunning(false);
    cliRef.current = false;
  }, []);

  // CI summary
  const ciSummary = {
    pass: projects.filter(p => p.resolvedStatus === "pass").length,
    warn: projects.filter(p => p.resolvedStatus === "warn").length,
    fail: projects.filter(p => p.resolvedStatus === "fail").length,
  };

  const TABS = [
    { id: "library"  as const, label: "📦 Component Library" },
    { id: "ci"       as const, label: "🔍 CI Check System"    },
    { id: "scaffold" as const, label: "🛠 Scaffolding + 📊 Data" },
  ];

  const BUTTON_VARIANTS = [
    { k: "primary",   label: "Primary",   bg: "#0066ff",   tc: "#fff",    bc: "transparent" },
    { k: "secondary", label: "Secondary", bg: "transparent", tc: "#0066ff", bc: "#0066ff" },
    { k: "ghost",     label: "Ghost",     bg: "transparent", tc: "#94a3b8", bc: "#334155" },
    { k: "danger",    label: "Danger",    bg: "#ef4444",   tc: "#fff",    bc: "transparent" },
    { k: "loading",   label: "Loading…",  bg: "#334155",   tc: "#64748b", bc: "transparent" },
  ];

  const INPUT_STATES = [
    { k: "default",  label: "Default Input",   bc: "#334155", tc: "#f1f5f9", err: false, ph: "Search hotels..." },
    { k: "focus",    label: "Focused",          bc: "#0066ff", tc: "#f1f5f9", err: false, ph: "Search hotels..." },
    { k: "error",    label: "Error State",      bc: "#ef4444", tc: "#f1f5f9", err: true,  ph: "Invalid email" },
    { k: "disabled", label: "Disabled",         bc: "#1e293b", tc: "#475569", err: false, ph: "Disabled" },
  ];

  return (
    <div style={{ background: "#0f172a", color: "#f1f5f9", fontFamily: "'Inter', system-ui, sans-serif", minHeight: "100vh", padding: 24 }}>

      {/* Header */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
          <div style={{ width: 36, height: 36, borderRadius: 8, background: "linear-gradient(135deg,#7c3aed,#0066ff)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>🔧</div>
          <div>
            <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800 }}>Platform / Frontend Infrastructure</h1>
            <p style={{ margin: 0, color: "#64748b", fontSize: 13 }}>
              Component Library · CI Check System (30+ projects) · Data Reporting · Scaffolding Tool
            </p>
          </div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8, marginBottom: 10 }}>
          {[
            { v: "34",    l: "Teams Adopted",       c: "#a855f7", sub: "Component library" },
            { v: "58",    l: "UI Components",        c: "#0ea5e9", sub: "Shared + documented" },
            { v: "30+",   l: "Projects in CI check", c: "#22c55e", sub: "Reliability enforced" },
            { v: "~60%",  l: "Avg Bundle Reduction", c: "#f59e0b", sub: "Via data reporting" },
          ].map(m => (
            <div key={m.l} style={{ background: "#1e293b", border: `1px solid ${m.c}20`, borderRadius: 10, padding: "10px 12px" }}>
              <div style={{ fontSize: 22, fontWeight: 900, color: m.c }}>{m.v}</div>
              <div style={{ fontSize: 9, fontWeight: 700 }}>{m.l}</div>
              <div style={{ fontSize: 8, color: "#475569", marginTop: 2 }}>{m.sub}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 4, marginBottom: 20, borderBottom: "1px solid #1e293b", paddingBottom: 4 }}>
        {TABS.map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{ background: activeTab === tab.id ? "#1e293b" : "transparent", color: activeTab === tab.id ? "#f1f5f9" : "#64748b", border: activeTab === tab.id ? "1px solid #334155" : "1px solid transparent", borderRadius: "8px 8px 0 0", padding: "8px 20px", cursor: "pointer", fontSize: 13, fontWeight: 600 }}>{tab.label}</button>
        ))}
      </div>

      {/* ── COMPONENT LIBRARY ── */}
      {activeTab === "library" && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
          {/* Showcase */}
          <div>
            <div style={{ fontSize: 10, fontWeight: 700, color: "#64748b", marginBottom: 8, letterSpacing: "0.08em" }}>
              @COMPANY/UI — INTERACTIVE COMPONENT SHOWCASE
            </div>

            {/* Buttons */}
            <div style={{ background: "#1e293b", border: "1px solid #334155", borderRadius: 10, padding: 14, marginBottom: 10 }}>
              <div style={{ fontSize: 9, color: "#64748b", marginBottom: 10 }}>&lt;Button&gt; — 5 variants · 3 sizes · loading state · icon support</div>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 10 }}>
                {BUTTON_VARIANTS.map(v => (
                  <button key={v.k} onClick={() => setActiveVariant(v.k)} style={{ background: v.bg, color: v.tc, border: `1px solid ${v.bc || v.bg}`, borderRadius: 8, padding: "8px 14px", cursor: v.k === "loading" ? "not-allowed" : "pointer", fontSize: 11, fontWeight: 600, outline: activeVariant === v.k ? `2px solid #0066ff` : "none", outlineOffset: 2 }}>
                    {v.k === "loading" && <span style={{ display: "inline-block", width: 8, height: 8, borderRadius: "50%", border: "2px solid #64748b", borderTopColor: "transparent", animation: "spin 0.8s linear infinite", marginRight: 6 }} />}
                    {v.label}
                  </button>
                ))}
              </div>
              <div style={{ background: "#0f172a", borderRadius: 6, padding: 8, fontFamily: "monospace", fontSize: 9, color: "#94a3b8" }}>
                {`<Button variant="${activeVariant}" size="md" onClick={handleClick}>\n  ${BUTTON_VARIANTS.find(v => v.k === activeVariant)?.label}\n</Button>`}
              </div>
            </div>

            {/* Inputs */}
            <div style={{ background: "#1e293b", border: "1px solid #334155", borderRadius: 10, padding: 14, marginBottom: 10 }}>
              <div style={{ fontSize: 9, color: "#64748b", marginBottom: 10 }}>&lt;Input&gt; — 4 states · validation · icon prefix/suffix</div>
              <div style={{ display: "flex", gap: 6, marginBottom: 10, flexWrap: "wrap" }}>
                {INPUT_STATES.map(s => (
                  <button key={s.k} onClick={() => setActiveInput(s.k)} style={{ background: activeInput === s.k ? "#1e3a5f" : "#0f172a", border: `1px solid ${activeInput === s.k ? "#3b82f6" : "#334155"}`, borderRadius: 5, padding: "3px 8px", cursor: "pointer", color: activeInput === s.k ? "#60a5fa" : "#64748b", fontSize: 8 }}>{s.label}</button>
                ))}
              </div>
              {INPUT_STATES.filter(s => s.k === activeInput).map(s => (
                <div key={s.k}>
                  <div style={{ background: "#0f172a", border: `1px solid ${s.bc}`, borderRadius: 6, padding: "8px 12px", fontSize: 11, color: s.tc, opacity: s.k === "disabled" ? 0.5 : 1, marginBottom: 4 }}>
                    {s.ph}
                  </div>
                  {s.err && <div style={{ fontSize: 8, color: "#ef4444", marginTop: 2 }}>✗ Please enter a valid email address.</div>}
                </div>
              ))}
            </div>

            {/* Badges */}
            <div style={{ background: "#1e293b", border: "1px solid #334155", borderRadius: 10, padding: 14, marginBottom: 10 }}>
              <div style={{ fontSize: 9, color: "#64748b", marginBottom: 10 }}>&lt;Badge&gt; · &lt;Toast&gt; · &lt;Avatar&gt; · &lt;Card&gt; · &lt;Modal&gt; · &lt;DataTable&gt;</div>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                {[
                  { l: "Success", bg: "#22c55e" }, { l: "Warning", bg: "#f59e0b" },
                  { l: "Error",   bg: "#ef4444" }, { l: "Info",    bg: "#0ea5e9" },
                  { l: "New",     bg: "#a855f7" }, { l: "Beta",    bg: "#f97316" },
                ].map(b => (
                  <span key={b.l} style={{ background: b.bg + "20", color: b.bg, border: `1px solid ${b.bg}40`, borderRadius: 20, padding: "3px 10px", fontSize: 9, fontWeight: 600 }}>{b.l}</span>
                ))}
              </div>
            </div>
          </div>

          {/* Adoption + changelog */}
          <div>
            <div style={{ fontSize: 10, fontWeight: 700, color: "#64748b", marginBottom: 8, letterSpacing: "0.08em" }}>
              ADOPTION TIMELINE
            </div>
            <div style={{ background: "#1e293b", border: "1px solid #334155", borderRadius: 10, padding: 14, marginBottom: 10 }}>
              {ADOPTION_QUARTERS.map(q => (
                <div key={q.q} style={{ marginBottom: 8 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 8, marginBottom: 3 }}>
                    <span style={{ color: "#94a3b8", fontWeight: 700 }}>{q.q}</span>
                    <span style={{ color: "#64748b" }}>{q.teams} teams · {q.components} components · {q.prs} PRs</span>
                  </div>
                  <div style={{ background: "#0f172a", borderRadius: 3, height: 8, overflow: "hidden" }}>
                    <div style={{ background: `linear-gradient(90deg, #7c3aed, #0066ff)`, height: "100%", width: `${(q.teams / 34) * 100}%`, borderRadius: 3, transition: "width 0.6s" }} />
                  </div>
                </div>
              ))}
              <div style={{ marginTop: 8, fontSize: 8, color: "#475569" }}>
                Growing organically: teams adopted after seeing productivity gains in early adopters.
              </div>
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: "#64748b", letterSpacing: "0.08em" }}>CHANGELOG — ISSUE RESOLUTION</div>
              <button onClick={() => setShowChangelog(v => !v)} style={{ background: "#1e293b", border: "1px solid #334155", borderRadius: 5, padding: "3px 8px", color: "#64748b", cursor: "pointer", fontSize: 8 }}>{showChangelog ? "Collapse" : "Expand"}</button>
            </div>
            {CHANGELOG.slice(0, showChangelog ? undefined : 3).map((c, i) => (
              <div key={c.ver} style={{ display: "flex", gap: 8, alignItems: "flex-start", background: "#1e293b", borderRadius: 8, padding: "8px 10px", marginBottom: 5, borderLeft: `3px solid ${c.color}` }}>
                <div style={{ fontSize: 8, fontFamily: "monospace", color: c.color, flexShrink: 0, marginTop: 1 }}>v{c.ver}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 8, background: c.color + "20", color: c.color, borderRadius: 3, padding: "0 4px", display: "inline-block", marginBottom: 2 }}>{c.type}</div>
                  <div style={{ fontSize: 9 }}>{c.desc}</div>
                </div>
                <div style={{ textAlign: "right", flexShrink: 0 }}>
                  <div style={{ fontSize: 7, color: "#64748b" }}>auto-delivered to</div>
                  <div style={{ fontSize: 10, fontWeight: 800, color: c.color }}>{c.projects} projects</div>
                </div>
              </div>
            ))}

            <div style={{ marginTop: 8 }}>
              <CodeBlock label="Component Library — adoption strategy" color="#a855f7" code={
`// ADOPTION IS HARDER THAN BUILDING.
// Built a great library ≠ teams will use it.
// Key strategies that drove 3 → 34 teams:

// 1. DOGFOOD FIRST:
//    Own team adopted it for their project first.
//    Worked out rough edges before other teams saw it.
//    "We use this ourselves" = credibility.

// 2. STORYBOOK AS THE PITCH:
//    Every component: Storybook stories with live examples.
//    Teams evaluate the library by seeing it run, not reading docs.
//    "Just go to storybook.company.com and click around."

// 3. MIGRATION SUPPORT:
//    For early adopters: pair programming sessions.
//    Helped them migrate their first 3 components.
//    After 3: they understood the patterns and migrated the rest independently.

// 4. CODEMOD FOR BREAKING CHANGES:
//    v3.0.0: renamed Button size prop (small → sm, medium → md, large → lg).
//    Without codemod: teams must manually find+replace across their codebase.
//    With codemod: npx @company/ui-codemod v3 ./src → automated migration.
//    Barrier to adopting a new major version: nearly zero.

// 5. ISSUE RESOLUTION EFFICIENCY:
//    Bug fixed in @company/ui → all 34 teams get fix on next version bump.
//    Without a shared library: same bug exists independently in 34 codebases.
//    Each team finds it separately, fixes it separately, at different times.
//    With the library: found once, fixed once, deployed everywhere.`} />
            </div>
          </div>
        </div>
      )}

      {/* ── CI CHECK SYSTEM ── */}
      {activeTab === "ci" && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 280px", gap: 14 }}>
          {/* Project grid */}
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: "#64748b", letterSpacing: "0.08em" }}>
                CI RELIABILITY/PERFORMANCE CHECK — {PROJECTS.length} PROJECTS
              </div>
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                {projects.some(p => p.resolvedStatus !== "pending") && (
                  <>
                    <span style={{ fontSize: 8, color: "#22c55e" }}>✓ {ciSummary.pass}</span>
                    <span style={{ fontSize: 8, color: "#f59e0b" }}>⚠ {ciSummary.warn}</span>
                    <span style={{ fontSize: 8, color: "#ef4444" }}>✗ {ciSummary.fail}</span>
                  </>
                )}
                <button onClick={runChecks} disabled={running} style={{ background: running ? "#334155" : "#22c55e20", border: `1px solid ${running ? "#334155" : "#22c55e"}`, borderRadius: 6, padding: "4px 14px", color: running ? "#64748b" : "#4ade80", cursor: running ? "not-allowed" : "pointer", fontSize: 9 }}>
                  {running ? "⏳ Checking..." : "▶ Run All Checks"}
                </button>
              </div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 8 }}>
              {projects.map((p, i) => {
                const st = p.resolvedStatus;
                const bundlePct = Math.round((p.bundle.size / p.bundle.limit) * 100);
                return (
                  <div key={p.name} style={{ background: "#1e293b", border: `1px solid ${STATUS_COLOR[st]}30`, borderRadius: 10, padding: 12, borderLeft: `3px solid ${STATUS_COLOR[st]}` }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                      <div>
                        <div style={{ fontSize: 9, fontWeight: 700, fontFamily: "monospace" }}>{p.name}</div>
                        <div style={{ fontSize: 7, color: "#475569" }}>{p.team} team</div>
                      </div>
                      <div style={{ fontSize: 14, color: STATUS_COLOR[st] }}>{STATUS_ICON[st]}</div>
                    </div>
                    {/* Metrics */}
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 4 }}>
                      {/* Bundle */}
                      <div style={{ background: "#0f172a", borderRadius: 5, padding: "4px 6px" }}>
                        <div style={{ fontSize: 7, color: "#475569", marginBottom: 2 }}>Bundle</div>
                        <div style={{ background: "#1e293b", borderRadius: 2, height: 4, overflow: "hidden", marginBottom: 2 }}>
                          <div style={{ background: bundlePct > 100 ? "#ef4444" : bundlePct > 90 ? "#f59e0b" : "#22c55e", height: "100%", width: `${Math.min(bundlePct, 100)}%` }} />
                        </div>
                        <div style={{ fontSize: 7, color: bundlePct > 100 ? "#ef4444" : bundlePct > 90 ? "#f59e0b" : "#22c55e" }}>{p.bundle.size}KB</div>
                      </div>
                      {/* Coverage */}
                      <div style={{ background: "#0f172a", borderRadius: 5, padding: "4px 6px" }}>
                        <div style={{ fontSize: 7, color: "#475569", marginBottom: 2 }}>Coverage</div>
                        <div style={{ background: "#1e293b", borderRadius: 2, height: 4, overflow: "hidden", marginBottom: 2 }}>
                          <div style={{ background: p.coverage < 80 ? "#ef4444" : p.coverage < 90 ? "#f59e0b" : "#22c55e", height: "100%", width: `${p.coverage}%` }} />
                        </div>
                        <div style={{ fontSize: 7, color: p.coverage < 80 ? "#ef4444" : "#22c55e" }}>{p.coverage}%</div>
                      </div>
                      {/* Perf */}
                      <div style={{ background: "#0f172a", borderRadius: 5, padding: "4px 6px" }}>
                        <div style={{ fontSize: 7, color: "#475569", marginBottom: 2 }}>Perf</div>
                        <div style={{ background: "#1e293b", borderRadius: 2, height: 4, overflow: "hidden", marginBottom: 2 }}>
                          <div style={{ background: p.perf < 85 ? "#ef4444" : p.perf < 90 ? "#f59e0b" : "#22c55e", height: "100%", width: `${p.perf}%` }} />
                        </div>
                        <div style={{ fontSize: 7, color: p.perf < 85 ? "#ef4444" : "#22c55e" }}>{p.perf}</div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Checks config */}
          <div>
            <div style={{ fontSize: 10, fontWeight: 700, color: "#64748b", marginBottom: 8, letterSpacing: "0.08em" }}>CHECK GATES & THRESHOLDS</div>
            {[
              { label: "Bundle Size",    icon: "📦", pass: "≤ defined limit", warn: "90-100% of limit", fail: "> limit", color: "#0ea5e9" },
              { label: "Test Coverage",  icon: "🧪", pass: "≥ 80%",            warn: "70-79%",           fail: "< 70%",  color: "#22c55e" },
              { label: "Perf Score",     icon: "⚡", pass: "≥ 85 (Lighthouse)", warn: "75-84",          fail: "< 75",   color: "#f59e0b" },
            ].map(c => (
              <div key={c.label} style={{ background: "#1e293b", border: `1px solid ${c.color}20`, borderRadius: 8, padding: 10, marginBottom: 8 }}>
                <div style={{ fontSize: 9, fontWeight: 700, marginBottom: 6 }}>{c.icon} {c.label}</div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 4 }}>
                  {[{ l: "PASS", v: c.pass, co: "#22c55e" }, { l: "WARN", v: c.warn, co: "#f59e0b" }, { l: "FAIL", v: c.fail, co: "#ef4444" }].map(r => (
                    <div key={r.l} style={{ background: r.co + "10", border: `1px solid ${r.co}30`, borderRadius: 5, padding: "4px 6px" }}>
                      <div style={{ fontSize: 7, color: r.co, fontWeight: 700 }}>{r.l}</div>
                      <div style={{ fontSize: 7, color: "#64748b" }}>{r.v}</div>
                    </div>
                  ))}
                </div>
              </div>
            ))}

            <CodeBlock label="CI check system — what it does and why it matters" color="#22c55e" code={
`// BEFORE THE SYSTEM:
// Each team manually decides their own quality thresholds.
// Some teams: no coverage requirement. Bundle grows unchecked.
// A team ships a 2MB bundle. "Works on my machine."
// Production: slow page loads. Performance regression unnoticed.
//
// AFTER — CENTRALIZED CI CHECKS:
// Every project pulls the shared CI template.
// The template defines: bundle limit, coverage %, Lighthouse gate.
// FAIL: PR is blocked. Team must fix before merging.
// WARN: PR comment highlighting the metric. Not blocked.
//       (Warn → prevent alert fatigue. Fail → prevent regressions.)
//
// IMPLEMENTATION:
// Shared GitHub Action workflow called by all 30+ project CI configs:
//
// # .github/workflows/ci.yml (in each project)
// jobs:
//   quality-checks:
//     uses: org/shared-workflows/.github/workflows/quality.yml@main
//     with:
//       bundle-limit: 300 # KB
//       coverage-threshold: 80
//       lighthouse-threshold: 85
//
// The shared workflow (org/shared-workflows):
// - Runs build → measures bundle size vs limit
// - Runs tests → measures coverage vs threshold
// - Runs Lighthouse CI → measures performance score
// - Posts results as PR comment with color-coded summary
// - Posts to data reporting dashboard
//
// WHY A SHARED WORKFLOW:
// 30+ projects, one change to improve all of them.
// Update the shared workflow → all 30+ projects get the improvement.
// Same leverage principle as the component library.`} />
          </div>
        </div>
      )}

      {/* ── SCAFFOLDING + DATA REPORTING ── */}
      {activeTab === "scaffold" && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
          {/* Scaffolding */}
          <div>
            <div style={{ fontSize: 10, fontWeight: 700, color: "#64748b", marginBottom: 8, letterSpacing: "0.08em" }}>
              SCAFFOLDING TOOL — create-fe-app
            </div>
            {/* Templates */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6, marginBottom: 10 }}>
              {TEMPLATES.map(t => (
                <div key={t.id} onClick={() => setSelectedTpl(t.id)} style={{ background: selectedTpl === t.id ? "#1e3a5f" : "#1e293b", border: `1px solid ${selectedTpl === t.id ? "#3b82f6" : "#334155"}`, borderRadius: 8, padding: 10, cursor: "pointer" }}>
                  <div style={{ display: "flex", gap: 6, alignItems: "center", marginBottom: 3 }}>
                    <span style={{ fontSize: 16 }}>{t.icon}</span>
                    <div style={{ fontSize: 9, fontWeight: 700, color: selectedTpl === t.id ? "#60a5fa" : "#f1f5f9" }}>{t.name}</div>
                  </div>
                  <div style={{ fontSize: 7, color: "#475569" }}>{t.desc}</div>
                  <div style={{ fontSize: 7, color: "#22c55e", marginTop: 3 }}>⚡ {t.time}</div>
                </div>
              ))}
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
              <div style={{ fontSize: 9, fontFamily: "monospace", color: "#64748b" }}>$ npx create-fe-app my-dashboard --template {selectedTpl}</div>
              <button onClick={runCLI} disabled={cliRunning} style={{ background: cliRunning ? "#334155" : "#7c3aed20", border: `1px solid ${cliRunning ? "#334155" : "#7c3aed"}`, borderRadius: 6, padding: "4px 12px", color: cliRunning ? "#64748b" : "#c084fc", cursor: cliRunning ? "not-allowed" : "pointer", fontSize: 9 }}>
                {cliRunning ? "⏳ Scaffolding..." : cliLines.length > 0 ? "↺ Replay" : "▶ Run"}
              </button>
            </div>

            {/* Terminal */}
            <div style={{ background: "#020617", border: "1px solid #1e293b", borderRadius: 10, padding: 12, height: 280, overflow: "auto", fontFamily: "monospace" }}>
              <div style={{ display: "flex", gap: 6, marginBottom: 10 }}>
                <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#ef4444" }} />
                <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#f59e0b" }} />
                <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#22c55e" }} />
              </div>
              {cliLines.length === 0 && !cliRunning && (
                <div style={{ fontSize: 9, color: "#334155" }}>Click "Run" to simulate scaffolding...</div>
              )}
              {cliLines.map((line, i) => (
                <div key={i} style={{ fontSize: 9, color: line.color || "#0f172a", lineHeight: 1.7 }}>{line.text || "\u00a0"}</div>
              ))}
              {cliRunning && <div style={{ fontSize: 9, color: "#475569" }}>▌</div>}
            </div>

            <div style={{ marginTop: 8 }}>
              <CodeBlock label="Scaffolding tool — what it configures automatically" color="#7c3aed" code={
`// BEFORE THE SCAFFOLDING TOOL:
// New project setup: 3-5 days of boilerplate work.
// Engineer copies from an old project → includes that project's quirks.
// Inconsistencies: different ESLint configs, different tsconfig settings.
// Missing: CI/CD pipeline (added later, after the rush to launch).
// Result: each project is a unique snowflake.
//
// AFTER — create-fe-app:
// npx create-fe-app my-dashboard --template react-ts
// 12 seconds → a production-ready project.
//
// WHAT IS PRE-CONFIGURED:
// ✓ Build: Vite + TypeScript (or Next.js for SSR template)
// ✓ Testing: Vitest + React Testing Library + MSW
// ✓ Code quality: ESLint (shared config) + Prettier + Husky pre-commit
// ✓ CI/CD: GitHub Actions workflow (quality checks from day 1)
//     - Bundle size check: limit defined in scaffold config
//     - Coverage threshold: 80% (matches CI check system)
//     - Lighthouse CI: performance gate
//     - Data reporting: metrics sent to the dashboard automatically
// ✓ Component library: @company/ui pre-installed + configured
// ✓ Path aliases: @/components → src/components (no ../../../)
// ✓ Env handling: .env.local for local, .env.production for prod
//
// HOW IT STREAMLINES MVP DEVELOPMENT:
// Day 0: project scaffolded. Team writes features, not config.
// Day 0: CI is running. Bundle size is measured. Tests run automatically.
// Sprint 1 end: deploy to staging. No "we need to set up CI" delay.
//
// The scaffolding tool encodes all best practices into a template.
// New teams get the benefit of 2 years of learning without reading any of it.`} />
            </div>
          </div>

          {/* Data Reporting */}
          <div>
            <div style={{ fontSize: 10, fontWeight: 700, color: "#64748b", marginBottom: 8, letterSpacing: "0.08em" }}>
              DATA REPORTING SYSTEM — LOAD TIMES + BUNDLE SIZES
            </div>
            {PERF_PROJECTS.map(p => {
              const lcpImp = Math.round(((p.lcp.before - p.lcp.after) / p.lcp.before) * 100);
              const bundleImp = Math.round(((p.bundle.before - p.bundle.after) / p.bundle.before) * 100);
              const maxLCP = 6;
              const maxBundle = 1600;
              return (
                <div key={p.name} style={{ background: "#1e293b", border: "1px solid #334155", borderRadius: 10, padding: 12, marginBottom: 8 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                    <div style={{ fontSize: 10, fontWeight: 700, fontFamily: "monospace" }}>{p.name}</div>
                    <div style={{ display: "flex", gap: 6 }}>
                      <span style={{ fontSize: 8, color: "#0ea5e9" }}>LCP −{lcpImp}%</span>
                      <span style={{ fontSize: 8, color: "#22c55e" }}>Bundle −{bundleImp}%</span>
                    </div>
                  </div>
                  {/* LCP */}
                  <div style={{ marginBottom: 6 }}>
                    <div style={{ fontSize: 7, color: "#475569", marginBottom: 3 }}>LCP (Largest Contentful Paint)</div>
                    <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
                      <div style={{ width: 30, fontSize: 7, color: "#475569" }}>Before</div>
                      <div style={{ flex: 1, background: "#0f172a", borderRadius: 2, height: 8, overflow: "hidden" }}>
                        <div style={{ background: "#ef4444", height: "100%", width: `${(p.lcp.before / maxLCP) * 100}%`, borderRadius: 2 }} />
                      </div>
                      <div style={{ fontSize: 7, color: "#ef4444", width: 32, textAlign: "right" }}>{p.lcp.before}s</div>
                    </div>
                    <div style={{ display: "flex", gap: 4, alignItems: "center", marginTop: 2 }}>
                      <div style={{ width: 30, fontSize: 7, color: "#475569" }}>After</div>
                      <div style={{ flex: 1, background: "#0f172a", borderRadius: 2, height: 8, overflow: "hidden" }}>
                        <div style={{ background: "#22c55e", height: "100%", width: `${(p.lcp.after / maxLCP) * 100}%`, borderRadius: 2 }} />
                      </div>
                      <div style={{ fontSize: 7, color: "#22c55e", width: 32, textAlign: "right" }}>{p.lcp.after}s</div>
                    </div>
                  </div>
                  {/* Bundle */}
                  <div>
                    <div style={{ fontSize: 7, color: "#475569", marginBottom: 3 }}>Bundle Size</div>
                    <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
                      <div style={{ width: 30, fontSize: 7, color: "#475569" }}>Before</div>
                      <div style={{ flex: 1, background: "#0f172a", borderRadius: 2, height: 8, overflow: "hidden" }}>
                        <div style={{ background: "#f59e0b", height: "100%", width: `${(p.bundle.before / maxBundle) * 100}%`, borderRadius: 2 }} />
                      </div>
                      <div style={{ fontSize: 7, color: "#f59e0b", width: 40, textAlign: "right" }}>{p.bundle.before}KB</div>
                    </div>
                    <div style={{ display: "flex", gap: 4, alignItems: "center", marginTop: 2 }}>
                      <div style={{ width: 30, fontSize: 7, color: "#475569" }}>After</div>
                      <div style={{ flex: 1, background: "#0f172a", borderRadius: 2, height: 8, overflow: "hidden" }}>
                        <div style={{ background: "#22c55e", height: "100%", width: `${(p.bundle.after / maxBundle) * 100}%`, borderRadius: 2 }} />
                      </div>
                      <div style={{ fontSize: 7, color: "#22c55e", width: 40, textAlign: "right" }}>{p.bundle.after}KB</div>
                    </div>
                  </div>
                </div>
              );
            })}

            <CodeBlock label="Data reporting system — how it works and why it matters" color="#0ea5e9" code={
`// THE PROBLEM BEFORE THE REPORTING SYSTEM:
// Each team measures performance on their own laptop.
// No centralized view: "which projects have a bundle size problem?"
// Regressions unnoticed until users complain.
// No baseline: "was this page always slow, or did something we shipped cause it?"
//
// THE DATA REPORTING SYSTEM:
// Every CI run (every PR + main branch) publishes metrics to a central store.
// Metrics collected:
//   - Bundle size: total JS, total CSS, per-chunk breakdown
//   - Lighthouse: LCP, CLS, FID, TBT, performance score
//   - Build time (as a developer productivity metric)
//   - Test coverage percentage
//   - Dependency count + vulnerability count
//
// HOW IT REDUCED LOAD TIMES + BUNDLE SIZES:
// The reporting system is not a fix — it is a mirror.
// Teams saw: "Our bundle is 1.2MB? The limit is 300KB?"
// Without the reporting: no visibility. Problem invisible.
// With the reporting: problem becomes undeniable.
//
// Once visible: teams took action:
//   - Code splitting (dynamic import) for large routes
//   - Tree-shaking: removing unused imports
//   - Image optimization: next/image, lazy loading
//   - Dependency audit: removing unused packages
//
// The reporting system provides the BEFORE.
// Teams make changes. The system shows the AFTER.
// −60% average bundle size: not from one fix. From each team fixing their own.
// The reporting system created the accountability.`} />
          </div>
        </div>
      )}
    </div>
  );
}

export default PlatformEngineeringDemo;
