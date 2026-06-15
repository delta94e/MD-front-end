/**
 * CRMPlatformDemo.tsx
 *
 * CRM platform engineering — four interconnected achievements:
 *
 * 1. CORE CRM MODULES
 *    Lead, Contact, Deals pipeline, Users, Territory.
 *    User-centric design: clear state machines, bulk actions, inline editing.
 *
 * 2. MICROFRONTEND MIGRATION
 *    Ember.js monolith → React MFE per module.
 *    Strangler-fig pattern: migrate module by module without downtime.
 *
 * 3. FRAMEWORK UPGRADES
 *    Ember (Classic → Octane), Node (LTS cadence), React (15→16→17→18).
 *    Codemods, compatibility layers, phased rollout.
 *
 * 4. BEST PRACTICES & GUIDELINES
 *    ADRs, code review standards, component design rules,
 *    performance budgets, a culture of documentation.
 *
 * TABS
 *   📊 CRM Modules    — live pipeline board + territory + users
 *   🔀 MFE Migration  — architecture diagram + migration timeline
 *   ⬆ Upgrades        — Ember / Node / React upgrade stories
 *   📋 Best Practices — ADR, review checklist, guidelines
 */

import React, { useState, useMemo, useCallback } from "react";

// ─────────────────────────────────────────────────────────────────
// CRM Data Model
// ─────────────────────────────────────────────────────────────────

type Stage = "lead" | "qualified" | "proposal" | "negotiation" | "won" | "lost";

interface Deal {
  id: string; name: string; company: string; value: number;
  stage: Stage; rep: string; territory: string;
  probability: number; closeDate: string; source: string;
}

const REPS       = ["Alice Chen", "Bob Park", "Carol Smith", "Dave Jones", "Eve Wang"];
const TERRITORIES = ["North America", "EMEA", "APAC", "LATAM"];
const SOURCES    = ["Inbound", "Cold Call", "Referral", "Partner", "Event"];

const INITIAL_DEALS: Deal[] = [
  { id: "d1",  name: "Enterprise License",    company: "Acme Corp",       value: 120000, stage: "lead",         rep: REPS[0], territory: TERRITORIES[0], probability: 10, closeDate: "Q3 2025", source: "Inbound"    },
  { id: "d2",  name: "SaaS Platform Renewal", company: "BetaCo",          value:  48000, stage: "lead",         rep: REPS[1], territory: TERRITORIES[1], probability: 10, closeDate: "Q4 2025", source: "Referral"   },
  { id: "d3",  name: "Analytics Module",      company: "GammaTech",       value:  72000, stage: "qualified",    rep: REPS[0], territory: TERRITORIES[2], probability: 30, closeDate: "Q3 2025", source: "Cold Call"  },
  { id: "d4",  name: "API Integration Pack",  company: "DeltaSoft",       value:  35000, stage: "qualified",    rep: REPS[2], territory: TERRITORIES[0], probability: 35, closeDate: "Q3 2025", source: "Event"      },
  { id: "d5",  name: "Security Add-on",       company: "EpsilonInc",      value:  29000, stage: "proposal",     rep: REPS[1], territory: TERRITORIES[1], probability: 55, closeDate: "Q2 2025", source: "Partner"    },
  { id: "d6",  name: "White-label Deal",      company: "ZetaGroup",       value:  95000, stage: "proposal",     rep: REPS[3], territory: TERRITORIES[3], probability: 60, closeDate: "Q2 2025", source: "Inbound"    },
  { id: "d7",  name: "Pro Seats × 500",       company: "EtaCorp",         value:  64000, stage: "negotiation",  rep: REPS[4], territory: TERRITORIES[0], probability: 80, closeDate: "Q2 2025", source: "Referral"   },
  { id: "d8",  name: "Custom Dev Contract",   company: "ThetaBuilders",   value: 145000, stage: "negotiation",  rep: REPS[0], territory: TERRITORIES[2], probability: 85, closeDate: "Q2 2025", source: "Partner"    },
  { id: "d9",  name: "Annual CRM Suite",      company: "IotaFinancial",   value:  88000, stage: "won",          rep: REPS[2], territory: TERRITORIES[1], probability: 100,closeDate: "Q1 2025", source: "Inbound"    },
  { id: "d10", name: "Growth Package",        company: "KappaRetail",     value:  52000, stage: "won",          rep: REPS[3], territory: TERRITORIES[3], probability: 100,closeDate: "Q1 2025", source: "Cold Call"  },
];

const STAGE_META: Record<Stage, { label: string; color: string; next?: Stage }> = {
  lead:         { label: "New Lead",     color: "#64748b", next: "qualified"    },
  qualified:    { label: "Qualified",    color: "#6366f1", next: "proposal"     },
  proposal:     { label: "Proposal",    color: "#f59e0b", next: "negotiation"  },
  negotiation:  { label: "Negotiation", color: "#0ea5e9", next: "won"          },
  won:          { label: "Won ✓",       color: "#4ade80"                       },
  lost:         { label: "Lost",        color: "#ef4444"                       },
};

const TERRITORY_DATA = [
  { name: "North America", rep: "Alice Chen",  leads: 142, deals: 38, pipeline: "$1.24M", quota: 78 },
  { name: "EMEA",          rep: "Bob Park",    leads: 118, deals: 29, pipeline: "$980K",  quota: 62 },
  { name: "APAC",          rep: "Carol Smith", leads:  89, deals: 21, pipeline: "$720K",  quota: 84 },
  { name: "LATAM",         rep: "Dave Jones",  leads:  64, deals: 14, pipeline: "$340K",  quota: 55 },
];

// ─────────────────────────────────────────────────────────────────
// MFE Migration timeline
// ─────────────────────────────────────────────────────────────────

const MIGRATION_MODULES = [
  { name: "Lead Management",      pct: 100, ember: "EmberJS 3.x view + controller", react: "React 17 MFE (route: /leads/*)",     quarter: "Q1 2021", bundleKb: 180, notes: "First migration — established the pattern" },
  { name: "Contact Module",       pct: 100, ember: "Ember Data model + template",   react: "React SPA + React Query",            quarter: "Q2 2021", bundleKb: 210, notes: "Introduced React Query for server state" },
  { name: "Deals Pipeline",       pct: 100, ember: "Ember + D3 charts",            react: "React + Recharts + drag-and-drop",   quarter: "Q3 2021", bundleKb: 320, notes: "Most complex — custom kanban board" },
  { name: "Territory Management", pct: 100, ember: "Ember Data + maps lib",        react: "React + Leaflet (lighter weight)",   quarter: "Q3 2021", bundleKb: 145, notes: "Ran parallel with Deals migration" },
  { name: "Users & Admin",        pct: 100, ember: "Ember auth + role system",     react: "React + RBAC hooks",                 quarter: "Q4 2021", bundleKb: 160, notes: "Last — most sensitive, most carefully planned" },
  { name: "Reporting",            pct:  70, ember: "Ember + legacy chart lib",     react: "React + Recharts (partial)",         quarter: "Q1 2022", bundleKb: 290, notes: "In progress — two sub-modules remaining" },
];

// ─────────────────────────────────────────────────────────────────
// Framework upgrades
// ─────────────────────────────────────────────────────────────────

const UPGRADES = [
  {
    fw: "Ember.js",   icon: "🐹", color: "#e04e39",
    title: "Ember Classic → Octane (3.28→4.x)",
    challenge: "Ember Octane introduced a completely different programming model: native ES classes instead of Ember.Object, @tracked properties instead of computed properties, @action instead of actions hash, Glimmer components instead of Ember Components. Existing code needed to be rewritten, not just updated.",
    approach: [
      "Audited all 200+ components — categorised by migration complexity (simple / medium / complex)",
      "Used ember-cli-update and ember-codemods for mechanical transformations (action → @action, set → @tracked)",
      "Created a migration guide with before/after code examples for common patterns",
      "Established a 'Octane-only' rule for all new code — no new classic syntax",
      "Migrated module by module over 3 months — each module was independently testable",
      "Added ESLint rules to prevent regression to classic syntax after migration",
    ],
    code: `// BEFORE — Ember Classic
import Component from "@ember/component";
import { computed } from "@ember/object";

export default Component.extend({
  firstName: "",
  lastName:  "",

  // Computed property — recomputes when deps change
  fullName: computed("firstName", "lastName", function () {
    return \`\${this.firstName} \${this.lastName}\`;
  }),

  actions: {
    updateName(value) {
      this.set("firstName", value); // mutation via .set()
    },
  },
});

// AFTER — Ember Octane (native JS class)
import Component from "@glimmer/component";
import { tracked } from "@glimmer/tracking";
import { action } from "@ember/object";

export default class NameComponent extends Component {
  @tracked firstName = "";
  @tracked lastName  = "";

  // Getter auto-tracks — recomputes when @tracked props change
  get fullName() {
    return \`\${this.firstName} \${this.lastName}\`;
  }

  @action
  updateName(value) {
    this.firstName = value; // native assignment — no .set()
  }
}`,
  },
  {
    fw: "Node.js",   icon: "🟢", color: "#417e38",
    title: "Node LTS Upgrade Cadence (v12→v14→v16→v18)",
    challenge: "Node upgrades are often deceptively risky. Native modules (node-gyp compiled), deprecated APIs, and npm package compatibility issues cause silent failures. Production Node upgrades need careful validation.",
    approach: [
      "Adopted a strict LTS-only policy — no odd-numbered Node versions in production",
      "Built a CI matrix: run tests against current Node LTS and next LTS simultaneously",
      "Automated npm audit on every PR — flag packages incompatible with the target Node version",
      "Created a 'Node compatibility table' for all native dependencies",
      "Staged rollout: staging for 2 weeks, canary 5% for 1 week, then full production",
      "Added Node version to the application's /health endpoint for monitoring",
    ],
    code: `// package.json — specify engine constraint to catch local dev mismatches
{
  "engines": {
    "node": ">=18.0.0 <19.0.0"  // LTS range — fail fast if wrong version
  }
}

// .nvmrc — lock all developers to the same Node version
v18.18.0

// CI matrix (GitHub Actions) — test against current + next LTS
strategy:
  matrix:
    node-version: ["18.x", "20.x"]  # current LTS + next LTS

steps:
  - uses: actions/setup-node@v3
    with:
      node-version: \${{ matrix.node-version }}
  - run: npm ci
  - run: npm test

# If tests pass on 20.x: we are ready for the next upgrade.
# If tests fail on 20.x: we know NOW, not when we need to upgrade.

// Node 16→18 breaking change example:
// fetch() is now global (no node-fetch needed)
// Before: const { default: fetch } = require("node-fetch");
// After:  fetch(...) // global — remove the import`,
  },
  {
    fw: "React",     icon: "⚛️", color: "#0ea5e9",
    title: "React 16→17→18 (Concurrent, Auto-batching)",
    challenge: "React 18's Concurrent rendering changed when and how components render. Existing code that relied on synchronous render behaviour (flushSync assumed synchronous DOM updates) could behave differently. The biggest risk: third-party libraries that had not yet updated.",
    approach: [
      "React 17 first — new JSX transform (no import React needed), gradual upgrade",
      "Audited all dependencies for React 18 Concurrent mode compatibility",
      "Used React 18's createRoot on new code only (opt-in Concurrent) while legacy ReactDOM.render was in use for stable modules",
      "Fixed all act() warnings in tests before upgrading — they are symptoms of state update timing issues",
      "Added startTransition() for expensive state updates (search, filter, sort) to keep the UI responsive",
      "Established useEffect dependency array lint rule (react-hooks/exhaustive-deps) across the codebase",
    ],
    code: `// React 16: ReactDOM.render (synchronous)
ReactDOM.render(<App />, document.getElementById("root"));

// React 18: createRoot (concurrent-capable)
import { createRoot } from "react-dom/client";
const root = createRoot(document.getElementById("root")!);
root.render(<App />);

// React 18: auto-batching — state updates in async context
// are now batched (they were NOT in React 17):
// Before (React 17): 2 separate renders
setTimeout(() => {
  setLoading(false);    // render 1
  setData(result);      // render 2
}, 100);

// React 18: batched automatically — 1 render only ✓
// Use flushSync() to opt-out when needed (rare)

// New: startTransition — mark non-urgent updates
import { startTransition } from "react";

function SearchBar() {
  const [query, setQuery]   = useState("");
  const [results, setResults] = useState([]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value);          // urgent — typed text
    startTransition(() => {
      setResults(search(e.target.value)); // non-urgent — can be interrupted
    });
  };
}`,
  },
];

// ─────────────────────────────────────────────────────────────────
// Best practices data
// ─────────────────────────────────────────────────────────────────

const ADR_EXAMPLE = `# ADR-014: Adopt React Query for Server State Management

## Status: Accepted  (2021-08-15)

## Context
With the MFE migration underway, each React module needed its own
data-fetching layer. We had three options:
(a) Redux Toolkit with RTK Query
(b) React Query (TanStack Query)
(c) Custom hooks with useEffect + local state

The modules had consistent needs: loading states, caching, background
refetch, and optimistic updates for CRM mutations (edit deal, reassign lead).

## Decision
Adopt React Query (now TanStack Query) for all React MFE modules.

## Rationale
- React Query separates "server state" from "UI state" explicitly.
  CRM data (leads, contacts, deals) is server state — it belongs in React Query.
  UI state (selected tab, modal open) belongs in useState/useContext.

- Built-in cache with configurable staleTime: contact data can be cached
  for 60 seconds; deal pipeline (more volatile) for 10 seconds.

- Optimistic updates are first-class: mutate the local cache immediately,
  revert on error. Feels instant to users.

- Background refetch: when the user returns to a tab, React Query
  automatically revalidates stale data. CRM data is always fresh.

- DevTools: React Query DevTools lets engineers inspect the cache in browser.
  Invaluable for debugging cache invalidation issues.

## Consequences
+ Consistent data-fetching pattern across all modules.
+ No duplicate API calls (React Query deduplicates concurrent requests).
+ Significantly less boilerplate than useEffect + useState for async data.
- Engineers must learn the query key pattern (cache invalidation by key).
- React Query's defaults (staleTime=0) cause more refetches than expected.
  We set global defaults in QueryClient config.

## Migration
All NEW React modules use React Query from day one.
Existing modules migrated opportunistically (when they have major changes).`;

const REVIEW_CHECKLIST = [
  { cat: "Code Quality",     items: ["Variable/function names are descriptive", "No commented-out code (use TODO comments if temporary)", "Functions have a single responsibility (< 30 lines)", "Magic numbers are constants with names"] },
  { cat: "React Specific",   items: ["useEffect has correct dependency array (lint rule enabled)", "Lists have stable keys (not array index for dynamic lists)", "Expensive computations use useMemo", "Event handlers use useCallback when passed to children"] },
  { cat: "TypeScript",       items: ["No 'any' type without a comment explaining why", "Props interface is defined for every component", "API responses have typed interfaces (not inferred from JSON)", "No non-null assertions (!) without null check"] },
  { cat: "Performance",      items: ["Large lists use virtualisation", "Images have dimensions to prevent layout shift", "No unnecessary re-renders (check with React DevTools)", "Bundle impact considered for new dependencies"] },
  { cat: "Testing",          items: ["New behaviour has a test", "Test is readable without reading the implementation", "No setTimeout in tests (use proper async helpers)", "Edge cases: empty state, loading state, error state"] },
];

// ─────────────────────────────────────────────────────────────────
// Code block helper
// ─────────────────────────────────────────────────────────────────

function CodeBlock({ code, label, color = "#64748b" }: { code: string; label?: string; color?: string }) {
  return (
    <div style={{ background: "#0f172a", borderRadius: 8, overflow: "hidden" }}>
      {label && <div style={{ padding: "5px 12px", borderBottom: "1px solid #1e293b", fontSize: 10, color }}>{label}</div>}
      <pre style={{ margin: 0, padding: 12, fontSize: 10, fontFamily: "monospace", color: "#94a3b8", lineHeight: 1.7, overflow: "auto", maxHeight: 360 }}>{code}</pre>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
// Main
// ─────────────────────────────────────────────────────────────────

export function CRMPlatformDemo() {
  const [activeTab, setActiveTab] = useState<"crm" | "mfe" | "upgrades" | "practices">("crm");
  const [deals, setDeals]         = useState<Deal[]>(INITIAL_DEALS);
  const [selectedDeal, setSelectedDeal] = useState<Deal | null>(null);
  const [upgradeIdx, setUpgradeIdx]     = useState(0);
  const [reviewCat, setReviewCat]       = useState(0);

  const stages: Stage[] = ["lead", "qualified", "proposal", "negotiation", "won"];

  const advanceDeal = useCallback((deal: Deal) => {
    const next = STAGE_META[deal.stage].next;
    if (!next) return;
    setDeals(prev => prev.map(d => d.id === deal.id ? { ...d, stage: next } : d));
    setSelectedDeal(prev => prev?.id === deal.id ? { ...prev, stage: next } : prev);
  }, []);

  const pipelineValue = useMemo(() =>
    deals.filter(d => d.stage !== "won" && d.stage !== "lost")
         .reduce((s, d) => s + d.value, 0),
  [deals]);
  const wonValue = useMemo(() =>
    deals.filter(d => d.stage === "won").reduce((s, d) => s + d.value, 0), [deals]);

  const curUpgrade = UPGRADES[upgradeIdx];
  const curReview  = REVIEW_CHECKLIST[reviewCat];

  const TABS = [
    { id: "crm"       as const, label: "📊 CRM Modules" },
    { id: "mfe"       as const, label: "🔀 MFE Migration" },
    { id: "upgrades"  as const, label: "⬆ Upgrades" },
    { id: "practices" as const, label: "📋 Best Practices" },
  ];

  return (
    <div style={{ background: "#0f172a", color: "#f1f5f9", fontFamily: "'Inter', system-ui, sans-serif", minHeight: "100vh", padding: 24 }}>

      {/* Header */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
          <span style={{ fontSize: 28 }}>🗂</span>
          <div>
            <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800 }}>CRM Platform Engineering</h1>
            <p style={{ margin: 0, color: "#64748b", fontSize: 13 }}>
              Core modules · Ember→React MFE migration · Framework upgrades · Engineering practices
            </p>
          </div>
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {["CRM", "Lead Management", "Deal Pipeline", "Territory", "Ember.js", "React MFE", "Framework Migration", "Engineering Culture", "ADR", "Code Review"].map(t => (
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

      {/* ── CRM MODULES ── */}
      {activeTab === "crm" && (
        <div>
          {/* Summary stats */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10, marginBottom: 16 }}>
            {[
              { label: "Pipeline Value",  value: `$${(pipelineValue / 1000).toFixed(0)}K`,  color: "#0ea5e9" },
              { label: "Won This Quarter", value: `$${(wonValue / 1000).toFixed(0)}K`,       color: "#4ade80" },
              { label: "Open Deals",      value: deals.filter(d => !["won","lost"].includes(d.stage)).length.toString(), color: "#a5b4fc" },
              { label: "Win Rate",        value: `${Math.round((deals.filter(d => d.stage==="won").length / deals.length)*100)}%`, color: "#f59e0b" },
            ].map(s => (
              <div key={s.label} style={{ background: "#1e293b", border: `1px solid ${s.color}20`, borderRadius: 10, padding: 14, borderLeft: `4px solid ${s.color}` }}>
                <div style={{ fontSize: 10, color: "#64748b", marginBottom: 4 }}>{s.label}</div>
                <div style={{ fontSize: 22, fontWeight: 800, color: s.color }}>{s.value}</div>
              </div>
            ))}
          </div>

          {/* Kanban pipeline */}
          <div style={{ display: "flex", gap: 8, overflowX: "auto", paddingBottom: 8, marginBottom: 16 }}>
            {stages.map(stage => {
              const stageDeals = deals.filter(d => d.stage === stage);
              const meta = STAGE_META[stage];
              return (
                <div key={stage} style={{ minWidth: 180, flex: 1 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                    <div style={{ fontSize: 10, fontWeight: 700, color: meta.color }}>{meta.label}</div>
                    <div style={{ background: meta.color + "20", color: meta.color, borderRadius: 10, padding: "1px 7px", fontSize: 9, fontWeight: 700 }}>{stageDeals.length}</div>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    {stageDeals.map(deal => (
                      <div
                        key={deal.id}
                        onClick={() => setSelectedDeal(deal)}
                        style={{
                          background: selectedDeal?.id === deal.id ? "#1e293b" : "#141a26",
                          border: `1px solid ${selectedDeal?.id === deal.id ? meta.color : "#334155"}`,
                          borderRadius: 8, padding: "9px 10px", cursor: "pointer",
                          borderLeft: `3px solid ${meta.color}`,
                        }}
                      >
                        <div style={{ fontSize: 10, fontWeight: 700, color: "#f1f5f9", marginBottom: 3, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{deal.name}</div>
                        <div style={{ fontSize: 9, color: "#64748b" }}>{deal.company}</div>
                        <div style={{ fontSize: 10, fontWeight: 700, color: "#4ade80", marginTop: 4 }}>${(deal.value / 1000).toFixed(0)}K</div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Deal detail + Territory */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            {/* Deal detail */}
            <div style={{ background: "#1e293b", border: "1px solid #334155", borderRadius: 10, padding: 14 }}>
              {selectedDeal ? (
                <>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 2 }}>{selectedDeal.name}</div>
                      <div style={{ fontSize: 11, color: "#64748b" }}>{selectedDeal.company} · {selectedDeal.territory}</div>
                    </div>
                    <div style={{ fontSize: 18, fontWeight: 800, color: "#4ade80" }}>${(selectedDeal.value / 1000).toFixed(0)}K</div>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 12 }}>
                    {[
                      { label: "Stage",       value: STAGE_META[selectedDeal.stage].label, color: STAGE_META[selectedDeal.stage].color },
                      { label: "Probability", value: `${selectedDeal.probability}%`,        color: "#a5b4fc" },
                      { label: "Rep",         value: selectedDeal.rep,                      color: "#f1f5f9" },
                      { label: "Source",      value: selectedDeal.source,                   color: "#f59e0b" },
                      { label: "Close Date",  value: selectedDeal.closeDate,                color: "#f1f5f9" },
                    ].map(r => (
                      <div key={r.label} style={{ background: "#0f172a", borderRadius: 6, padding: "7px 10px" }}>
                        <div style={{ fontSize: 9, color: "#64748b" }}>{r.label}</div>
                        <div style={{ fontSize: 11, fontWeight: 700, color: r.color }}>{r.value}</div>
                      </div>
                    ))}
                  </div>
                  {STAGE_META[selectedDeal.stage].next && (
                    <button onClick={() => advanceDeal(selectedDeal)} style={{ background: "#4f46e5", border: "none", borderRadius: 8, padding: "8px 16px", color: "#fff", cursor: "pointer", fontSize: 12, fontWeight: 700 }}>
                      Advance → {STAGE_META[STAGE_META[selectedDeal.stage].next!].label}
                    </button>
                  )}
                </>
              ) : (
                <div style={{ fontSize: 11, color: "#334155", textAlign: "center", padding: "20px 0" }}>Click a deal to view details</div>
              )}
            </div>

            {/* Territory */}
            <div style={{ background: "#1e293b", border: "1px solid #334155", borderRadius: 10, overflow: "hidden" }}>
              <div style={{ padding: "8px 12px", background: "#0f172a", borderBottom: "1px solid #334155", fontSize: 10, fontWeight: 700, color: "#f59e0b" }}>TERRITORY MODULE</div>
              <div>
                {TERRITORY_DATA.map(t => (
                  <div key={t.name} style={{ padding: "10px 12px", borderBottom: "1px solid #1e293b" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
                      <div>
                        <div style={{ fontSize: 11, fontWeight: 700, color: "#f1f5f9" }}>{t.name}</div>
                        <div style={{ fontSize: 9, color: "#64748b" }}>{t.rep} · {t.leads} leads · {t.deals} deals · {t.pipeline}</div>
                      </div>
                      <div style={{ fontSize: 10, fontWeight: 700, color: t.quota >= 80 ? "#4ade80" : t.quota >= 60 ? "#f59e0b" : "#ef4444" }}>{t.quota}% quota</div>
                    </div>
                    <div style={{ height: 4, background: "#0f172a", borderRadius: 2, overflow: "hidden" }}>
                      <div style={{ width: `${t.quota}%`, height: "100%", background: t.quota >= 80 ? "#4ade80" : t.quota >= 60 ? "#f59e0b" : "#ef4444", transition: "width 0.5s" }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── MFE MIGRATION ── */}
      {activeTab === "mfe" && (
        <div>
          <div style={{ background: "#1e293b", border: "1px solid #6366f130", borderRadius: 10, padding: 14, marginBottom: 16 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: "#a5b4fc", marginBottom: 6 }}>Ember.js Monolith → React Microfrontend — Strangler Fig Pattern</div>
            <div style={{ fontSize: 12, color: "#94a3b8", lineHeight: 1.7 }}>
              The monolith served all modules from one Ember.js SPA. The migration used the
              <strong style={{ color: "#f1f5f9" }}> strangler fig pattern</strong>: Nginx was configured to route each module's path prefix
              to an independently deployed React MFE, while the Ember shell continued serving unmigratedmodules.
              No single "big bang" migration — each module was migrated, tested, and shipped independently.
            </div>
          </div>

          {/* Module progress */}
          <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 16 }}>
            {MIGRATION_MODULES.map(mod => (
              <div key={mod.name} style={{ background: "#1e293b", border: "1px solid #334155", borderRadius: 10, padding: 12 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                  <div>
                    <span style={{ fontSize: 11, fontWeight: 700, color: "#f1f5f9" }}>{mod.name}</span>
                    <span style={{ fontSize: 9, color: "#64748b", marginLeft: 10 }}>{mod.quarter} · {mod.bundleKb}KB bundle · {mod.notes}</span>
                  </div>
                  <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                    <span style={{ fontSize: 9, color: "#f97316" }}>Ember: {mod.ember}</span>
                    <span style={{ color: "#334155" }}>→</span>
                    <span style={{ fontSize: 9, color: "#4ade80" }}>React: {mod.react}</span>
                    <span style={{ fontSize: 10, fontWeight: 700, color: mod.pct === 100 ? "#4ade80" : "#f59e0b", marginLeft: 6 }}>{mod.pct}%</span>
                  </div>
                </div>
                <div style={{ height: 6, background: "#0f172a", borderRadius: 3, overflow: "hidden" }}>
                  <div style={{ width: `${mod.pct}%`, height: "100%", background: mod.pct === 100 ? "#4ade80" : "#f59e0b", borderRadius: 3 }} />
                </div>
              </div>
            ))}
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <CodeBlock label="Nginx routing — strangler fig implementation" color="#a5b4fc" code={
`# nginx.conf — routes each module path to its own React MFE
# The Ember shell continues handling unrecognised routes.

server {
  listen 443 ssl;
  server_name crm.company.com;

  # React MFEs — served by independent node servers
  location /leads/ {
    proxy_pass http://leads-mfe:3001;    # React MFE
  }
  location /contacts/ {
    proxy_pass http://contacts-mfe:3002; # React MFE
  }
  location /deals/ {
    proxy_pass http://deals-mfe:3003;    # React MFE
  }
  location /territory/ {
    proxy_pass http://territory-mfe:3004; # React MFE
  }

  # Everything else → Ember monolith (unmigratedmodules)
  location / {
    proxy_pass http://ember-app:4200;    # Ember — shrinking
  }
}

# As each module migrates:
#   1. Add a location block for the new React MFE
#   2. Remove Ember's handling of that route
#   3. Ember gets smaller. React grows. Zero downtime.`} />

            <CodeBlock label="Shared session — cross-MFE auth without re-login" color="#10b981" code={
`// Shared httpOnly cookie — set once by auth server,
// readable by all MFEs on crm.company.com

// Auth flow:
// 1. User logs in → auth server sets:
//    Set-Cookie: crm_session=<token>; HttpOnly; Secure;
//                Path=/; Domain=.crm.company.com; SameSite=Lax
//
// 2. Every MFE (leads, contacts, deals, territory) sends
//    the cookie automatically on every request.
//
// 3. No explicit token management in any MFE — the browser
//    handles it.

// React MFE auth check — runs on mount
async function useAuthGuard() {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    // GET /api/auth/me — sends session cookie automatically
    api.getMe()
      .then(setUser)
      .catch(() => {
        // Redirect to auth server — works across all MFEs
        window.location.href = "/auth/login?next=" +
          encodeURIComponent(window.location.pathname);
      });
  }, []);

  return user;
}

// Cross-MFE navigation — use regular <a> tags, not React Router Link
// Each MFE has its own router. Navigation between modules
// is a full page load (cross-origin in routing terms).
<a href="/contacts/123">View Contact</a> // crosses MFE boundary`} />
          </div>
        </div>
      )}

      {/* ── FRAMEWORK UPGRADES ── */}
      {activeTab === "upgrades" && (
        <div>
          <div style={{ display: "flex", gap: 6, marginBottom: 14 }}>
            {UPGRADES.map((u, i) => (
              <button key={u.fw} onClick={() => setUpgradeIdx(i)} style={{
                background: upgradeIdx === i ? u.color + "20" : "#1e293b",
                border: `1px solid ${upgradeIdx === i ? u.color : "#334155"}`,
                borderRadius: 8, padding: "8px 16px", cursor: "pointer",
                color: upgradeIdx === i ? u.color : "#64748b", fontSize: 12, fontWeight: 700,
              }}>{u.icon} {u.fw}</button>
            ))}
          </div>

          <div style={{ background: "#1e293b", border: `1px solid ${curUpgrade.color}30`, borderRadius: 10, padding: 14, marginBottom: 12 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: curUpgrade.color, marginBottom: 8 }}>{curUpgrade.title}</div>
            <div style={{ fontSize: 12, color: "#94a3b8", lineHeight: 1.7, marginBottom: 12 }}>{curUpgrade.challenge}</div>
            <div style={{ fontSize: 11, fontWeight: 700, color: "#f1f5f9", marginBottom: 8 }}>Upgrade approach:</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
              {curUpgrade.approach.map((step, i) => (
                <div key={i} style={{ display: "flex", gap: 8, fontSize: 11, color: "#94a3b8" }}>
                  <span style={{ color: curUpgrade.color, fontWeight: 700, flexShrink: 0 }}>{i + 1}.</span>{step}
                </div>
              ))}
            </div>
          </div>
          <CodeBlock label={`${curUpgrade.fw} — before/after code`} color={curUpgrade.color} code={curUpgrade.code} />
        </div>
      )}

      {/* ── BEST PRACTICES ── */}
      {activeTab === "practices" && (
        <div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
            {/* ADR */}
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: "#f1f5f9", marginBottom: 8 }}>Architecture Decision Records (ADRs)</div>
              <div style={{ background: "#1e293b", border: "1px solid #334155", borderRadius: 10, overflow: "hidden" }}>
                <div style={{ padding: "6px 12px", background: "#0f172a", borderBottom: "1px solid #334155", fontSize: 10, color: "#64748b" }}>ADR-014 — example of the process</div>
                <pre style={{ margin: 0, padding: 14, fontSize: 9, fontFamily: "monospace", color: "#94a3b8", lineHeight: 1.7, overflow: "auto", maxHeight: 420 }}>{ADR_EXAMPLE}</pre>
              </div>
              <div style={{ fontSize: 10, color: "#64748b", marginTop: 8, lineHeight: 1.6 }}>
                💡 Every significant architecture decision is documented as an ADR — committed to Git alongside the code.
                New engineers read ADRs to understand WHY the system is built the way it is, not just what it does.
              </div>
            </div>

            {/* Code review checklist */}
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: "#f1f5f9", marginBottom: 8 }}>Code Review Checklist</div>
              <div style={{ display: "flex", gap: 6, marginBottom: 10, flexWrap: "wrap" }}>
                {REVIEW_CHECKLIST.map((cat, i) => (
                  <button key={cat.cat} onClick={() => setReviewCat(i)} style={{
                    background: reviewCat === i ? "#6366f120" : "#1e293b",
                    border: `1px solid ${reviewCat === i ? "#6366f1" : "#334155"}`,
                    borderRadius: 6, padding: "4px 10px", cursor: "pointer",
                    color: reviewCat === i ? "#a5b4fc" : "#64748b", fontSize: 10,
                  }}>{cat.cat}</button>
                ))}
              </div>
              <div style={{ background: "#1e293b", border: "1px solid #334155", borderRadius: 10, padding: 14 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: "#a5b4fc", marginBottom: 10 }}>{curReview.cat}</div>
                {curReview.items.map((item, i) => (
                  <div key={i} style={{ display: "flex", gap: 8, marginBottom: 10, fontSize: 11, color: "#94a3b8", alignItems: "flex-start" }}>
                    <div style={{ width: 16, height: 16, border: "2px solid #6366f1", borderRadius: 3, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", marginTop: 1 }}>
                      <div style={{ width: 8, height: 8, background: "#6366f1", borderRadius: 1 }} />
                    </div>
                    {item}
                  </div>
                ))}
              </div>
              <div style={{ marginTop: 10 }}>
                <CodeBlock label="ESLint rules that automate the checklist" color="#6366f1" code={
`// .eslintrc — rules that encode the review checklist as automated checks
{
  "plugins": ["react-hooks", "jsx-a11y", "@typescript-eslint"],
  "rules": {
    // React specific — from checklist
    "react-hooks/exhaustive-deps": "error",       // correct dep arrays
    "react-hooks/rules-of-hooks": "error",        // no conditional hooks

    // TypeScript — prevent lazy types
    "@typescript-eslint/no-explicit-any": "warn",
    "@typescript-eslint/no-non-null-assertion": "warn",

    // Accessibility — built into review
    "jsx-a11y/alt-text": "error",                 // images need alt
    "jsx-a11y/no-autofocus": "warn",              // no autofocus

    // Code quality
    "no-console": ["warn", { allow: ["error"] }], // no console.log
    "no-magic-numbers": ["warn", { ignore: [0, 1, -1] }],

    // Performance
    "react/jsx-no-bind": ["warn", {               // no new fn in JSX
      "allowArrowFunctions": false
    }],
  }
}

# CI: eslint is a required check — PR cannot merge with lint errors.
# This makes the checklist items binary: they either pass or they don't.`} />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default CRMPlatformDemo;
