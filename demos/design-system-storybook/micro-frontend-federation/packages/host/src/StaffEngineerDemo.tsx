/**
 * StaffEngineerDemo.tsx
 *
 * Sr. Staff Frontend Engineer — four strategic focus areas:
 *
 * 1. AGENTS — Leading project planning for AI Agents product
 *    Architecture, step decomposition, streaming UI, run history.
 *
 * 2. TECH STACK MODERNIZATION — Upgrading core tooling
 *    Webpack→Vite, Jest→Vitest, ESLint+Prettier→Biome,
 *    TypeScript strict mode, React 17→18.
 *
 * 3. CI STRATEGY — Stability + minimal run time
 *    Test sharding, selective runs, Vitest workers, caching.
 *    Sequential 21m → parallelised 5m.
 *
 * 4. ENGINEERING CULTURE — Learning fast, radical transparency
 *    RFC process, blameless postmortems, health metrics,
 *    20% learning time, async demos.
 *
 * TABS
 *   🤖 Agents          — config, streaming execution, run history
 *   🔧 Modernization   — migration timeline + before/after metrics
 *   🧪 CI Strategy     — pipeline visualisation + optimisation breakdown
 *   🌱 Culture         — RFC, transparency metrics, learning programmes
 */

import React, { useState, useEffect, useCallback, useRef } from "react";

// ─────────────────────────────────────────────────────────────────
// Agents data
// ─────────────────────────────────────────────────────────────────

type StepStatus = "pending" | "running" | "done" | "error";

interface AgentStep { id: string; type: "think" | "tool" | "observe" | "respond"; label: string; detail: string; status: StepStatus; durationMs?: number; }
interface Agent { id: string; name: string; description: string; model: string; tools: string[]; steps: AgentStep[]; successRate: number; avgRunMs: number; lastRun: string; }

const AGENTS: Agent[] = [
  {
    id: "a1", name: "Research Agent", description: "Autonomously researches prospects, summarises findings, and prepares briefing docs.",
    model: "claude-3-5-sonnet", tools: ["web_search", "pdf_reader", "crm_lookup"],
    successRate: 94, avgRunMs: 18400, lastRun: "2m ago",
    steps: [
      { id: "r1", type: "think",   label: "Plan research",       detail: "Identify target company signals: funding, headcount, tech stack, recent news",      status: "pending" },
      { id: "r2", type: "tool",    label: "web_search()",        detail: 'Query: "Acme Corp funding 2025 site:techcrunch.com OR crunchbase.com"',              status: "pending" },
      { id: "r3", type: "observe", label: "Parse results",       detail: "Found: Series B $42M (March 2025), 180 employees, 3 open RevOps roles",             status: "pending" },
      { id: "r4", type: "tool",    label: "crm_lookup()",        detail: "Fetching existing contacts and deal history for Acme Corp",                          status: "pending" },
      { id: "r5", type: "observe", label: "CRM context",         detail: "No existing deals. 2 contacts (Dir. of Sales, VP Ops). Last touched 8 months ago",  status: "pending" },
      { id: "r6", type: "respond", label: "Generate brief",      detail: "Briefing doc ready: funding trigger, key contacts, suggested angle, email draft",   status: "pending" },
    ],
  },
  {
    id: "a2", name: "Outreach Agent", description: "Drafts and schedules personalised multi-channel outreach sequences.",
    model: "gpt-4o", tools: ["email_drafter", "linkedin_lookup", "calendar"],
    successRate: 89, avgRunMs: 12100, lastRun: "15m ago",
    steps: [
      { id: "o1", type: "think",   label: "Analyse brief",       detail: "Funding trigger + RevOps signal → personalise to hiring pain",                      status: "pending" },
      { id: "o2", type: "tool",    label: "linkedin_lookup()",   detail: "Pulling mutual connections and recent activity for Sarah K. (Dir. of Sales)",        status: "pending" },
      { id: "o3", type: "observe", label: "Social context",      detail: "Shared connection: Mike Chen. Sarah posted about RevOps tooling challenges last week",status: "pending" },
      { id: "o4", type: "tool",    label: "email_drafter()",     detail: "Composing email referencing funding + RevOps post + shared connection",              status: "pending" },
      { id: "o5", type: "respond", label: "Sequence created",    detail: "7-step sequence created. Email 1 scheduled for Tuesday 9:00 AM. Awaiting rep approval",status: "pending" },
    ],
  },
  {
    id: "a3", name: "Data Sync Agent", description: "Keeps CRM data clean by merging duplicates and filling missing fields.",
    model: "claude-3-haiku", tools: ["crm_read", "crm_write", "data_enrichment"],
    successRate: 98, avgRunMs: 4200, lastRun: "1h ago",
    steps: [
      { id: "d1", type: "think",   label: "Scope dirty records",   detail: "Identify contacts with <3 fields populated or email domains that mismatch company",  status: "pending" },
      { id: "d2", type: "tool",    label: "crm_read()",            detail: "Fetching 247 contacts flagged by data quality rules",                               status: "pending" },
      { id: "d3", type: "tool",    label: "data_enrichment()",     detail: "Enriching 247 contacts via Clearbit + LinkedIn APIs",                               status: "pending" },
      { id: "d4", type: "observe", label: "Merge candidates",      detail: "Found 14 duplicate pairs. Proposed merges: keep higher-activity record as primary",  status: "pending" },
      { id: "d5", type: "tool",    label: "crm_write()",           detail: "Writing enriched data for 233 contacts. Merging 14 duplicate pairs.",               status: "pending" },
      { id: "d6", type: "respond", label: "Sync complete",         detail: "247 contacts processed. 233 enriched, 14 merged, 0 errors. Data quality +18%",      status: "pending" },
    ],
  },
];

const STEP_TYPE_META = {
  think:   { icon: "🧠", color: "#a855f7", label: "Think"   },
  tool:    { icon: "🔧", color: "#0ea5e9", label: "Tool"    },
  observe: { icon: "👁",  color: "#f59e0b", label: "Observe" },
  respond: { icon: "✅", color: "#4ade80", label: "Respond" },
};

// ─────────────────────────────────────────────────────────────────
// Modernisation data
// ─────────────────────────────────────────────────────────────────

const MODERNISATION = [
  {
    title: "Webpack 4 → Vite 5",          icon: "⚡", color: "#f59e0b",
    before: "45s cold start",              after: "1.8s cold start",
    delta: "−96%",
    why: "Webpack bundles everything at startup. Vite serves native ES modules in dev — only the requested file is transformed. Cold start time drops from 45s to under 2s regardless of project size.",
    risk: "Module federation required a compatibility plugin; some dynamic require() calls needed rewriting to import().",
  },
  {
    title: "Jest → Vitest",               icon: "🚀", color: "#6366f1",
    before: "120s test run",              after: "22s test run",
    delta: "−82%",
    why: "Vitest shares the Vite config — no separate Babel transform, no separate module resolver. TypeScript paths, aliases, and env variables just work. Native worker threads process files in parallel by default.",
    risk: "jest.mock() patterns work but require vitest.mock() imports. A codemod handled 90% of cases automatically.",
  },
  {
    title: "ESLint + Prettier → Biome",  icon: "🎯", color: "#4ade80",
    before: "8.2s lint + format",         after: "0.4s lint + format",
    delta: "−95%",
    why: "Biome is a single Rust binary that lints AND formats. No plugin resolution, no separate Prettier process, no config conflicts. One tool, one pass, 20× faster than the ESLint + Prettier combination.",
    risk: "Some ESLint plugins we used (jsx-a11y, import order) have no Biome equivalent yet. We keep ESLint for those specific rules only.",
  },
  {
    title: "TypeScript 4.x → 5.x strict", icon: "🔒", color: "#ef4444",
    before: "234 'any' usages, strict: false", after: "0 'any', strict: true",
    delta: "800 errors → 0",
    why: "strict: true enables: noImplicitAny, strictNullChecks, exactOptionalPropertyTypes, and others. These catch entire classes of runtime bugs at compile time. The migration took 6 weeks — done gradually, file by file.",
    risk: "exactOptionalPropertyTypes broke 40+ interfaces that used optional fields as a shortcut for nullable. All required explicit | undefined handling.",
  },
  {
    title: "React 17 → 18",              icon: "⚛️", color: "#0ea5e9",
    before: "ReactDOM.render(), manual batching", after: "createRoot(), auto-batching, Concurrent",
    delta: "−2 unnecessary renders avg/interaction",
    why: "React 18's auto-batching eliminates redundant renders in async callbacks. startTransition() marks search/filter updates as non-urgent — the UI stays responsive while heavy computation runs. useId() eliminates SSR/CSR hydration mismatches.",
    risk: "act() warnings surfaced previously hidden async state update bugs in tests. Each warning indicated a real timing issue — 12 tests required refactoring.",
  },
];

// ─────────────────────────────────────────────────────────────────
// CI data
// ─────────────────────────────────────────────────────────────────

const CI_BEFORE = [
  { label: "Lint + Format",        minutes: 2.1,  sequential: true  },
  { label: "TypeScript check",     minutes: 3.4,  sequential: true  },
  { label: "Unit tests (Jest)",    minutes: 7.8,  sequential: true  },
  { label: "Integration tests",   minutes: 4.2,  sequential: true  },
  { label: "E2E tests (Cypress)", minutes: 14.0, sequential: true  },
  { label: "Build",               minutes: 3.6,  sequential: true  },
];

const CI_AFTER = [
  { label: "Biome lint",           minutes: 0.2,  shard: 1, row: 0 },
  { label: "TS check",             minutes: 1.1,  shard: 1, row: 0 },
  { label: "Unit shard 1/4",       minutes: 1.4,  shard: 1, row: 1 },
  { label: "Unit shard 2/4",       minutes: 1.4,  shard: 2, row: 1 },
  { label: "Unit shard 3/4",       minutes: 1.3,  shard: 3, row: 1 },
  { label: "Unit shard 4/4",       minutes: 1.4,  shard: 4, row: 1 },
  { label: "Integration 1/2",      minutes: 1.6,  shard: 1, row: 2 },
  { label: "Integration 2/2",      minutes: 1.5,  shard: 2, row: 2 },
  { label: "E2E shard 1/3",        minutes: 2.8,  shard: 1, row: 3 },
  { label: "E2E shard 2/3",        minutes: 2.9,  shard: 2, row: 3 },
  { label: "E2E shard 3/3",        minutes: 2.7,  shard: 3, row: 3 },
  { label: "Build (cached)",       minutes: 0.4,  shard: 1, row: 4 },
];

const CI_OPTIMISATIONS = [
  { title: "Test sharding",       impact: "−72% test time",     detail: "Split unit tests across 4 workers, E2E across 3 Playwright workers. Jest `--shard=N/4`. Total test time: 7.8m → 1.4m (critical path)." },
  { title: "Selective test run",  impact: "−60% on most PRs",   detail: "On PRs touching ≤5 files, only run tests for changed modules. nx affected --target=test detects the dependency graph and runs only what changed." },
  { title: "Vitest workers",      impact: "2× throughput",      detail: "Vitest's native worker threads process test files in parallel without overhead. No jest-worker setup, no worker thread pool tuning." },
  { title: "Turborepo cache",     impact: "0s on cache hit",    detail: "Build and lint outputs are content-hashed and cached. If the files have not changed since the last run, the output is replayed instantly. Cache hit rate: 68% on feature branch CI." },
  { title: "E2E parallelisation", impact: "14m → 2.9m",        detail: "Cypress/Playwright tests split across 3 workers with test isolation (each worker has its own test DB and auth session). Reduced flakiness by eliminating shared state between tests." },
  { title: "Biome in CI",         impact: "8s → 0.2s lint",    detail: "Single binary, no plugin resolution, parallel file processing. Lint no longer on the critical path — runs in parallel with TS check." },
];

// ─────────────────────────────────────────────────────────────────
// Culture data
// ─────────────────────────────────────────────────────────────────

const HEALTH_METRICS = [
  { label: "Deploy frequency",   value: "8× / week",   trend: "↑", color: "#4ade80", detail: "Daily deploys with feature flags — ship to prod, turn on for 10%" },
  { label: "Change failure rate",value: "1.8%",         trend: "↓", color: "#4ade80", detail: "Automated rollback on error rate spike (>0.5% 5XX in 5m)" },
  { label: "MTTR",              value: "12 min",        trend: "↓", color: "#4ade80", detail: "Runbook for every alert type. On-call engineer can resolve P1 in <15m" },
  { label: "Tech debt ratio",   value: "14%",           trend: "↓", color: "#f59e0b", detail: "Hours on debt / total hours. Target <15%. Tracked in linear, reviewed weekly." },
  { label: "FE test coverage",  value: "65%",           trend: "↑", color: "#4ade80", detail: "Raised from 38% over 3 months. CI gate prevents regression below 60%." },
  { label: "CI run time",       value: "4.8 min",       trend: "↓", color: "#4ade80", detail: "From 21m sequential to 4.8m parallel. Engineers don't wait for feedback." },
];

const RFC_EXAMPLE = `# RFC-089: Adopt Vitest to Replace Jest

## Status: Accepted  (2025-03-12)
## Author: [Sr. Staff FE]  |  Reviewers: FE team + DevX team
## RFC opened: 2025-03-01  |  Decision deadline: 2025-03-10

---

## Problem Statement
Jest test run (unit + integration) takes 7.8 minutes on CI.
Engineers wait > 15 minutes for PR feedback (lint + TS + tests).
Feedback latency reduces iteration speed and discourages writing tests.

## Proposed Solution
Replace Jest with Vitest.

Vitest reuses the Vite config — no separate transform pipeline.
Native ESM, native TypeScript, native path aliases (zero config change).
Worker threads enabled by default: 2× throughput on the same CI runner.
Measured on our repo: 7.8m → 1.6m (sample run, before sharding).

## Alternatives Considered
(a) Optimise Jest: increased --maxWorkers, enable SWC transformer.
    Result: 7.8m → 4.2m. Better, but still slow. Config complexity increases.

(b) Keep Jest + add test sharding.
    Result: 7.8m → 2.1m. Achievable, but we still maintain Jest's config.
    Sharding alone doesn't help with HMR-linked test re-runs in local dev.

(c) Move to Vitest.
    Result: 7.8m → 1.6m (CI) AND near-instant re-run in local dev.
    Best option across both dimensions.

## Migration Plan
Week 1: Add Vitest alongside Jest (dual config). Migrate utility files.
Week 2: Migrate component tests. Validate: same results, Vitest + Jest identical.
Week 3: Migrate integration tests. Remove Jest from package.json.
Week 4: Validate CI runs. Update onboarding docs and README.

## Risks
- jest.mock() → vi.mock() migration: estimated 300 files.
  Mitigation: codemod available (jest-to-vitest transformer). 90% automated.
- Timer mocking API differs (vi.useFakeTimers vs jest.useFakeTimers).
  Mitigation: grep for useFakeTimers → manual review of 12 files.

## Success Metrics
CI unit test time < 2 minutes. Local test re-run < 500ms.
No regressions in test results (Vitest green = Jest was green).`;

// ─────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────

function CodeBlock({ code, label, color = "#64748b" }: { code: string; label?: string; color?: string }) {
  return (
    <div style={{ background: "#0f172a", borderRadius: 8, overflow: "hidden" }}>
      {label && <div style={{ padding: "5px 12px", borderBottom: "1px solid #1e293b", fontSize: 10, color }}>{label}</div>}
      <pre style={{ margin: 0, padding: 12, fontSize: 10, fontFamily: "monospace", color: "#94a3b8", lineHeight: 1.7, overflow: "auto", maxHeight: 340 }}>{code}</pre>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
// Main
// ─────────────────────────────────────────────────────────────────

export function StaffEngineerDemo() {
  const [activeTab, setActiveTab] = useState<"agents" | "modern" | "ci" | "culture">("agents");

  // Agents
  const [selectedAgent, setSelectedAgent]   = useState<Agent>(AGENTS[0]);
  const [runSteps, setRunSteps]             = useState<AgentStep[]>([]);
  const [running, setRunning]               = useState(false);
  const [modernIdx, setModernIdx]           = useState(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const runAgent = useCallback(() => {
    if (running) return;
    setRunSteps([]);
    setRunning(true);
    const steps = selectedAgent.steps;
    steps.forEach((step, i) => {
      timerRef.current = setTimeout(() => {
        setRunSteps(prev => [...prev, { ...step, status: "done" }]);
        if (i === steps.length - 1) setRunning(false);
      }, (i + 1) * 700);
    });
  }, [selectedAgent, running]);

  useEffect(() => {
    setRunSteps([]);
    setRunning(false);
    if (timerRef.current) clearTimeout(timerRef.current);
  }, [selectedAgent]);

  const totalBefore = CI_BEFORE.reduce((s, j) => s + j.minutes, 0);
  const criticalAfter = Math.max(
    CI_AFTER.filter(j => j.row === 1).reduce((s, j) => s + j.minutes / 4, 0),
    CI_AFTER.filter(j => j.row === 3).reduce((s, j) => s + j.minutes / 3, 0),
    1.1,
  );

  const TABS = [
    { id: "agents"  as const, label: "🤖 Agents"        },
    { id: "modern"  as const, label: "🔧 Modernisation"  },
    { id: "ci"      as const, label: "🧪 CI Strategy"    },
    { id: "culture" as const, label: "🌱 Culture"        },
  ];

  return (
    <div style={{ background: "#0f172a", color: "#f1f5f9", fontFamily: "'Inter', system-ui, sans-serif", minHeight: "100vh", padding: 24 }}>

      {/* Header */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
          <span style={{ fontSize: 28 }}>🎯</span>
          <div>
            <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800 }}>Sr. Staff Frontend Engineer</h1>
            <p style={{ margin: 0, color: "#64748b", fontSize: 13 }}>
              Agents · Tech modernisation · CI optimisation · Engineering culture
            </p>
          </div>
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {["Agents Planning", "Vite", "Vitest", "Biome", "TypeScript Strict", "React 18", "Test Sharding", "Turborepo", "RFC Process", "Radical Transparency", "Blameless Postmortems", "DORA Metrics"].map(t => (
            <span key={t} style={{ background: "#1e293b", color: "#94a3b8", border: "1px solid #334155", borderRadius: 20, padding: "3px 10px", fontSize: 11 }}>{t}</span>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 4, marginBottom: 20, borderBottom: "1px solid #1e293b", paddingBottom: 4, flexWrap: "wrap" }}>
        {TABS.map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{
            background: activeTab === tab.id ? "#1e293b" : "transparent",
            color: activeTab === tab.id ? "#f1f5f9" : "#64748b",
            border: activeTab === tab.id ? "1px solid #334155" : "1px solid transparent",
            borderRadius: "8px 8px 0 0", padding: "8px 18px", cursor: "pointer", fontSize: 13, fontWeight: 600,
          }}>{tab.label}</button>
        ))}
      </div>

      {/* ── AGENTS ── */}
      {activeTab === "agents" && (
        <div style={{ display: "grid", gridTemplateColumns: "220px 1fr", gap: 16 }}>
          {/* Agent list */}
          <div>
            <div style={{ fontSize: 10, fontWeight: 700, color: "#64748b", marginBottom: 10, letterSpacing: "0.1em" }}>AGENTS</div>
            {AGENTS.map(agent => (
              <div
                key={agent.id}
                onClick={() => setSelectedAgent(agent)}
                style={{
                  background: selectedAgent.id === agent.id ? "#1e293b" : "#141a26",
                  border: `1px solid ${selectedAgent.id === agent.id ? "#6366f1" : "#334155"}`,
                  borderRadius: 8, padding: 12, cursor: "pointer", marginBottom: 6,
                }}
              >
                <div style={{ fontSize: 11, fontWeight: 700, color: "#f1f5f9", marginBottom: 2 }}>{agent.name}</div>
                <div style={{ fontSize: 9, color: "#64748b", marginBottom: 6, lineHeight: 1.5 }}>{agent.description}</div>
                <div style={{ display: "flex", gap: 8 }}>
                  <span style={{ background: "#4ade8020", color: "#4ade80", borderRadius: 10, padding: "1px 7px", fontSize: 9 }}>{agent.successRate}% ✓</span>
                  <span style={{ background: "#1e293b", color: "#64748b", borderRadius: 10, padding: "1px 7px", fontSize: 9 }}>{(agent.avgRunMs / 1000).toFixed(1)}s avg</span>
                </div>
              </div>
            ))}
          </div>

          {/* Agent detail */}
          <div>
            <div style={{ background: "#1e293b", border: "1px solid #6366f130", borderRadius: 10, padding: 14, marginBottom: 12 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 800, color: "#f1f5f9" }}>{selectedAgent.name}</div>
                  <div style={{ fontSize: 10, color: "#64748b" }}>Model: {selectedAgent.model} · Last run: {selectedAgent.lastRun}</div>
                </div>
                <button onClick={runAgent} disabled={running} style={{ background: running ? "#1e293b" : "#6366f1", border: "none", borderRadius: 8, padding: "8px 18px", color: running ? "#64748b" : "#fff", cursor: running ? "wait" : "pointer", fontSize: 12, fontWeight: 700 }}>
                  {running ? "▶ Running…" : "▶ Run agent"}
                </button>
              </div>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                {selectedAgent.tools.map(t => (
                  <span key={t} style={{ background: "#0f172a", color: "#a5b4fc", borderRadius: 6, padding: "3px 8px", fontSize: 9, fontFamily: "monospace" }}>{t}</span>
                ))}
              </div>
            </div>

            {/* Execution trace */}
            <div style={{ fontSize: 10, fontWeight: 700, color: "#64748b", marginBottom: 8, letterSpacing: "0.1em" }}>EXECUTION TRACE</div>
            <div style={{ display: "flex", flexDirection: "column" }}>
              {selectedAgent.steps.map((step, i) => {
                const executed = runSteps.find(s => s.id === step.id);
                const isCurrent = running && !executed && runSteps.length === i;
                const meta = STEP_TYPE_META[step.type];
                return (
                  <div key={step.id} style={{ display: "flex", gap: 10, alignItems: "flex-start", marginBottom: 8 }}>
                    {/* connector */}
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", flexShrink: 0, paddingTop: 2 }}>
                      <div style={{
                        width: 28, height: 28, borderRadius: "50%", border: `2px solid ${executed ? meta.color : isCurrent ? meta.color : "#334155"}`,
                        background: executed ? meta.color + "20" : "#0f172a",
                        display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12,
                        transition: "all 0.3s",
                      }}>{executed ? meta.icon : isCurrent ? "⟳" : "○"}</div>
                      {i < selectedAgent.steps.length - 1 && <div style={{ width: 1, height: 16, background: "#334155", marginTop: 2 }} />}
                    </div>
                    {/* content */}
                    <div style={{ flex: 1, background: executed ? "#1e293b" : "#141a26", border: `1px solid ${executed ? meta.color + "40" : "#1e293b"}`, borderRadius: 8, padding: "8px 12px", transition: "all 0.3s" }}>
                      <div style={{ display: "flex", gap: 6, alignItems: "center", marginBottom: executed ? 4 : 0 }}>
                        <span style={{ fontSize: 8, background: meta.color + "20", color: meta.color, borderRadius: 3, padding: "1px 5px", fontWeight: 700 }}>{meta.label.toUpperCase()}</span>
                        <span style={{ fontSize: 11, fontWeight: 600, color: executed ? "#f1f5f9" : "#475569" }}>{step.label}</span>
                      </div>
                      {executed && <div style={{ fontSize: 10, color: "#64748b", lineHeight: 1.6 }}>{step.detail}</div>}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Architecture note */}
            {!running && runSteps.length === 0 && (
              <CodeBlock label="Agent frontend architecture — streaming SSE + step state machine" color="#a855f7" code={
`// Agents API streams Server-Sent Events — one event per step.
// React state machine tracks the current step and accumulates history.

type AgentEvent =
  | { type: "step_start";    stepId: string; stepType: AgentStep["type"]; label: string }
  | { type: "step_done";     stepId: string; detail: string; durationMs: number }
  | { type: "step_error";    stepId: string; error: string }
  | { type: "agent_complete"; totalMs: number; summary: string };

function useAgentStream(agentId: string | null) {
  const [steps, setSteps] = useState<AgentStep[]>([]);
  const [status, setStatus] = useState<"idle" | "running" | "done" | "error">("idle");

  const run = useCallback(() => {
    if (!agentId) return;
    setSteps([]); setStatus("running");
    
    // EventSource = SSE — persistent connection, no polling
    const es = new EventSource(\`/api/agents/\${agentId}/run\`);

    es.onmessage = (e) => {
      const event: AgentEvent = JSON.parse(e.data);
      
      if (event.type === "step_start") {
        setSteps(prev => [...prev, { id: event.stepId, type: event.stepType,
          label: event.label, status: "running" }]);
      }
      if (event.type === "step_done") {
        setSteps(prev => prev.map(s => s.id === event.stepId
          ? { ...s, status: "done", detail: event.detail, durationMs: event.durationMs }
          : s));
      }
      if (event.type === "agent_complete") {
        setStatus("done"); es.close();
      }
    };

    es.onerror = () => { setStatus("error"); es.close(); };
    return () => es.close(); // cleanup on unmount
  }, [agentId]);

  return { steps, status, run };
}`} />
            )}
          </div>
        </div>
      )}

      {/* ── MODERNISATION ── */}
      {activeTab === "modern" && (
        <div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 8, marginBottom: 16 }}>
            {MODERNISATION.map((m, i) => (
              <button key={m.title} onClick={() => setModernIdx(i)} style={{
                background: modernIdx === i ? m.color + "20" : "#1e293b",
                border: `1px solid ${modernIdx === i ? m.color : "#334155"}`,
                borderRadius: 8, padding: 12, cursor: "pointer", textAlign: "center",
              }}>
                <div style={{ fontSize: 20, marginBottom: 4 }}>{m.icon}</div>
                <div style={{ fontSize: 10, fontWeight: 700, color: modernIdx === i ? m.color : "#94a3b8" }}>{m.title.split("→")[1]?.trim() ?? m.title}</div>
              </button>
            ))}
          </div>

          {(() => {
            const m = MODERNISATION[modernIdx];
            return (
              <div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginBottom: 12 }}>
                  <div style={{ background: "#1e293b", border: "1px solid #ef444430", borderRadius: 10, padding: 14 }}>
                    <div style={{ fontSize: 9, color: "#64748b", marginBottom: 4 }}>BEFORE</div>
                    <div style={{ fontSize: 16, fontWeight: 800, color: "#ef4444" }}>{m.before}</div>
                  </div>
                  <div style={{ background: "#1e293b", border: `1px solid ${m.color}50`, borderRadius: 10, padding: 14, textAlign: "center" }}>
                    <div style={{ fontSize: 9, color: "#64748b", marginBottom: 4 }}>IMPROVEMENT</div>
                    <div style={{ fontSize: 22, fontWeight: 900, color: m.color }}>{m.delta}</div>
                  </div>
                  <div style={{ background: "#1e293b", border: "1px solid #4ade8030", borderRadius: 10, padding: 14, textAlign: "right" }}>
                    <div style={{ fontSize: 9, color: "#64748b", marginBottom: 4 }}>AFTER</div>
                    <div style={{ fontSize: 16, fontWeight: 800, color: "#4ade80" }}>{m.after}</div>
                  </div>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                  <div style={{ background: "#1e293b", border: `1px solid ${m.color}20`, borderRadius: 10, padding: 14 }}>
                    <div style={{ fontSize: 10, fontWeight: 700, color: m.color, marginBottom: 8 }}>WHY IT MATTERS</div>
                    <div style={{ fontSize: 12, color: "#94a3b8", lineHeight: 1.7 }}>{m.why}</div>
                  </div>
                  <div style={{ background: "#1e293b", border: "1px solid #f59e0b20", borderRadius: 10, padding: 14 }}>
                    <div style={{ fontSize: 10, fontWeight: 700, color: "#f59e0b", marginBottom: 8 }}>RISKS + MITIGATIONS</div>
                    <div style={{ fontSize: 12, color: "#94a3b8", lineHeight: 1.7 }}>{m.risk}</div>
                  </div>
                </div>
              </div>
            );
          })()}

          <div style={{ marginTop: 12 }}>
            <CodeBlock label="Tech debt decision framework — how to prioritise what to modernise" color="#6366f1" code={
`// MODERNISATION PRIORITISATION MATRIX
// Score each candidate on three dimensions (1-5 scale each)

type ModernisationCandidate = {
  name:           string;
  painScore:      number;  // 1-5: how much this slows down engineers daily
  riskScore:      number;  // 1-5: how risky is the migration (inverted: 5 = low risk)
  impactScore:    number;  // 1-5: how much does the after state improve things
  estimateDays:   number;  // engineer-days to complete
  priorityScore:  number;  // = (pain × impact × risk) / estimateDays
};

// Example scoring:
const candidates: ModernisationCandidate[] = [
  { name: "Webpack → Vite",         pain: 5, risk: 4, impact: 5, days: 5,  priority: 20 },
  { name: "Jest → Vitest",          pain: 4, risk: 4, impact: 5, days: 4,  priority: 20 },
  { name: "TypeScript strict",      pain: 2, risk: 2, impact: 5, days: 30, priority: 0.7 },
  { name: "Biome",                  pain: 3, risk: 5, impact: 4, days: 2,  priority: 30 },
];

// Biome scores highest (30): high pain relief, very low risk, fast.
// TypeScript strict scores lowest (0.7): important but long — do last.

// RULE: Never modernise "just because it's newer."
// The question is always: "What engineer pain does this remove,
// and is the migration cost worth that pain relief?"`} />
          </div>
        </div>
      )}

      {/* ── CI STRATEGY ── */}
      {activeTab === "ci" && (
        <div>
          {/* Before/After summary */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 60px 1fr", gap: 10, marginBottom: 16, alignItems: "center" }}>
            <div style={{ background: "#1e293b", border: "1px solid #ef444430", borderRadius: 10, padding: 14 }}>
              <div style={{ fontSize: 10, color: "#64748b", marginBottom: 6 }}>BEFORE — Sequential pipeline</div>
              {CI_BEFORE.map(j => (
                <div key={j.label} style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 5 }}>
                  <div style={{ flex: 1, height: 6, background: "#ef444430", borderRadius: 3, overflow: "hidden" }}>
                    <div style={{ width: `${(j.minutes / totalBefore) * 100}%`, height: "100%", background: "#ef4444" }} />
                  </div>
                  <div style={{ fontSize: 9, color: "#94a3b8", width: 120, flexShrink: 0 }}>{j.label}</div>
                  <div style={{ fontSize: 9, color: "#ef4444", width: 30, textAlign: "right" }}>{j.minutes.toFixed(1)}m</div>
                </div>
              ))}
              <div style={{ fontSize: 14, fontWeight: 800, color: "#ef4444", marginTop: 8 }}>Total: {totalBefore.toFixed(1)} min</div>
            </div>

            <div style={{ textAlign: "center", fontSize: 20, color: "#64748b" }}>→</div>

            <div style={{ background: "#1e293b", border: "1px solid #4ade8030", borderRadius: 10, padding: 14 }}>
              <div style={{ fontSize: 10, color: "#64748b", marginBottom: 6 }}>AFTER — Parallel + sharded</div>
              {[0,1,2,3,4].map(row => {
                const rowJobs = CI_AFTER.filter(j => j.row === row);
                const labels = ["Lint + TS", "Unit tests (×4)", "Integration (×2)", "E2E (×3)", "Build"];
                return (
                  <div key={row} style={{ display: "flex", gap: 4, alignItems: "center", marginBottom: 5 }}>
                    <div style={{ flex: 1, display: "flex", gap: 2 }}>
                      {rowJobs.map(j => (
                        <div key={j.label} style={{ height: 6, borderRadius: 3, background: "#4ade80", flex: j.minutes }} />
                      ))}
                    </div>
                    <div style={{ fontSize: 9, color: "#94a3b8", width: 120, flexShrink: 0 }}>{labels[row]}</div>
                    <div style={{ fontSize: 9, color: "#4ade80", width: 30, textAlign: "right" }}>{Math.max(...rowJobs.map(j => j.minutes)).toFixed(1)}m</div>
                  </div>
                );
              })}
              <div style={{ fontSize: 14, fontWeight: 800, color: "#4ade80", marginTop: 8 }}>Critical path: ~{criticalAfter.toFixed(1)} min</div>
            </div>
          </div>

          {/* Optimisation breakdown */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 12 }}>
            {CI_OPTIMISATIONS.map(opt => (
              <div key={opt.title} style={{ background: "#1e293b", border: "1px solid #334155", borderRadius: 10, padding: 12 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: "#f1f5f9" }}>{opt.title}</div>
                  <span style={{ background: "#4ade8020", color: "#4ade80", borderRadius: 10, padding: "2px 8px", fontSize: 9, fontWeight: 700 }}>{opt.impact}</span>
                </div>
                <div style={{ fontSize: 10, color: "#64748b", lineHeight: 1.6 }}>{opt.detail}</div>
              </div>
            ))}
          </div>

          <CodeBlock label="Vitest sharding + Playwright parallelisation — CI config" color="#4ade80" code={
`# .github/workflows/ci.yml — parallelised pipeline

jobs:
  # ─── Lint + types: fast, run first ───────────────────────────
  quality:
    steps:
      - run: biome check .             # 0.2m — Biome lint + format
      - run: tsc --noEmit             # 1.1m — runs in parallel with lint

  # ─── Unit tests: sharded 4 ways ──────────────────────────────
  unit:
    strategy:
      matrix:
        shard: [1, 2, 3, 4]
    steps:
      - run: npx vitest run --shard=SHARD_NUM/4

  # ─── E2E tests: sharded 3 ways across Playwright ─────────────
  e2e:
    strategy:
      matrix:
        shard: [1, 2, 3]
    steps:
      - run: npx playwright test --shard=SHARD_NUM/3
        env:
          TEST_DB: e2e_shard_SHARD_NUM  # isolated DB per shard

  # ─── Build: uses Turborepo cache ─────────────────────────────
  build:
    needs: [quality]                  # wait for lint/types
    steps:
      - run: npx turbo run build      # cache hit = 0s; miss = 2m

# SELECTIVE TEST RUN ON PRs (nx affected):
# Only runs tests for modules affected by the PR's diff.
# Most feature PRs touch 3-5 files → run 20% of test suite.
- run: npx nx affected --target=test --base=origin/main

# NOTE: SHARD_NUM above = matrix.shard from the strategy context.
# In actual YAML: \${{ matrix.shard }} — GitHub Actions expression syntax.`} />
        </div>
      )}

      {/* ── CULTURE ── */}
      {activeTab === "culture" && (
        <div>
          {/* Health metrics */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8, marginBottom: 16 }}>
            {HEALTH_METRICS.map(m => (
              <div key={m.label} style={{ background: "#1e293b", border: `1px solid ${m.color}20`, borderRadius: 10, padding: 12, borderLeft: `3px solid ${m.color}` }}>
                <div style={{ fontSize: 9, color: "#64748b", marginBottom: 4 }}>{m.label}</div>
                <div style={{ display: "flex", alignItems: "baseline", gap: 6, marginBottom: 4 }}>
                  <span style={{ fontSize: 18, fontWeight: 800, color: m.color }}>{m.value}</span>
                  <span style={{ fontSize: 12, color: m.color }}>{m.trend}</span>
                </div>
                <div style={{ fontSize: 9, color: "#475569" }}>{m.detail}</div>
              </div>
            ))}
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            {/* RFC */}
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: "#f1f5f9", marginBottom: 8 }}>RFC Process — Radical Transparency in Technical Decisions</div>
              <div style={{ background: "#1e293b", border: "1px solid #334155", borderRadius: 10, overflow: "hidden" }}>
                <div style={{ padding: "6px 12px", background: "#0f172a", borderBottom: "1px solid #334155", fontSize: 10, color: "#64748b" }}>RFC-089 — Vitest adoption</div>
                <pre style={{ margin: 0, padding: 12, fontSize: 9, fontFamily: "monospace", color: "#94a3b8", lineHeight: 1.7, overflow: "auto", maxHeight: 360 }}>{RFC_EXAMPLE}</pre>
              </div>
            </div>

            {/* Culture practices */}
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: "#f1f5f9", marginBottom: 8 }}>Engineering Culture Practices</div>
              {[
                { title: "Radical transparency — public metrics", icon: "📊", color: "#0ea5e9",
                  detail: "DORA metrics (deploy frequency, failure rate, MTTR, lead time) published to a shared dashboard visible to everyone — including non-engineers. No 'we're doing fine' without the numbers." },
                { title: "Blameless postmortems", icon: "📝", color: "#f59e0b",
                  detail: "Every P1/P2 incident has a postmortem published within 48h. Format: timeline, root cause (5 whys), action items with owners and due dates. Focus: system improvements, not individual mistakes." },
                { title: "Weekly async demos", icon: "🎬", color: "#a855f7",
                  detail: "Every engineer ships a 3-5 min Loom recording each week: what was shipped, a demo, and one thing learned. Async = global team can engage without time zone constraints." },
                { title: "20% learning time + RFC culture", icon: "📚", color: "#4ade80",
                  detail: "One day per week for learning, experimentation, and paying tech debt. RFCs are written for all significant technical decisions — not just big migrations. Anyone can comment. Decision is public." },
              ].map(p => (
                <div key={p.title} style={{ background: "#1e293b", border: `1px solid ${p.color}20`, borderRadius: 8, padding: 12, marginBottom: 8, borderLeft: `3px solid ${p.color}` }}>
                  <div style={{ display: "flex", gap: 6, alignItems: "center", marginBottom: 4 }}>
                    <span style={{ fontSize: 16 }}>{p.icon}</span>
                    <div style={{ fontSize: 10, fontWeight: 700, color: p.color }}>{p.title}</div>
                  </div>
                  <div style={{ fontSize: 10, color: "#64748b", lineHeight: 1.6 }}>{p.detail}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default StaffEngineerDemo;
