/**
 * SurveyMonkeyFederationDemo.tsx
 *
 * Staff Engineer — Web Platform · SurveyMonkey
 * GraphQL Federation Migration: Monolith → Modular Federated Architecture
 *
 * TABS
 *   🏗️ Architecture     — Monolith vs Federation, composition, Router, subgraph extraction
 *   ⚙️  Migration Tools  — Schema analyzer, breaking change detector, subgraph generator CLI
 *   📊 Performance      — Latency budgets, subgraph isolation, cache strategy, observability
 *   🤝 Cross-Functional — RFC process, schema governance, team progress tracker
 */

import React, { useState, useEffect, useCallback, useRef } from "react";

// ─────────────────────────────────────────────────────────────────
// Design tokens — SurveyMonkey (green + dark)
// ─────────────────────────────────────────────────────────────────
const SM = {
  bg:         "#080f0d",
  surface:    "#0e1a17",
  surface2:   "#142419",
  surface3:   "#1c3028",
  border:     "#1f3d2e",
  green:      "#00BF6F",
  greenDark:  "#009955",
  greenLight: "#33d68f",
  teal:       "#00a89d",
  yellow:     "#f5c518",
  red:        "#e03a2f",
  orange:     "#f07030",
  blue:       "#3b82f6",
  purple:     "#8b5cf6",
  text:       "#8db5a1",
  textBright: "#e6f5ed",
  textMuted:  "#2d5a42",
  mono:       "'JetBrains Mono', monospace",
};

// ─────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────

interface SchemaType {
  name:       string;
  fields:     string[];
  domain:     string;
  extracted:  boolean;
  usageCount: number;
}

interface Subgraph {
  id:          string;
  name:        string;
  team:        string;
  types:       number;
  status:      "healthy" | "degraded" | "down";
  latency:     number;
  migrated:    boolean;
  progress:    number;
}

interface BreakingChange {
  type:    "breaking" | "warning" | "safe";
  field:   string;
  reason:  string;
}

// ─────────────────────────────────────────────────────────────────
// Mock data
// ─────────────────────────────────────────────────────────────────

const SCHEMA_TYPES: SchemaType[] = [
  { name: "Survey",          fields: ["id", "title", "status", "createdAt", "ownerId"],   domain: "surveys",   extracted: true,  usageCount: 1842 },
  { name: "SurveyQuestion",  fields: ["id", "text", "type", "options", "required"],       domain: "surveys",   extracted: true,  usageCount: 1204 },
  { name: "SurveyTheme",     fields: ["id", "name", "colors", "font"],                    domain: "surveys",   extracted: true,  usageCount: 431  },
  { name: "SurveyResponse",  fields: ["id", "surveyId", "answers", "completedAt"],        domain: "responses", extracted: false, usageCount: 987  },
  { name: "Answer",          fields: ["questionId", "value", "choiceId"],                 domain: "responses", extracted: false, usageCount: 987  },
  { name: "User",            fields: ["id", "email", "name", "plan", "teamId"],           domain: "users",     extracted: true,  usageCount: 2341 },
  { name: "Team",            fields: ["id", "name", "members", "plan", "seats"],          domain: "users",     extracted: true,  usageCount: 782  },
  { name: "AnalyticsSummary",fields: ["surveyId", "responseCount", "completionRate"],     domain: "analytics", extracted: false, usageCount: 654  },
  { name: "Plan",            fields: ["id", "name", "price", "features"],                 domain: "billing",   extracted: false, usageCount: 341  },
  { name: "Subscription",    fields: ["id", "planId", "status", "renewsAt"],              domain: "billing",   extracted: false, usageCount: 289  },
];

const SUBGRAPHS: Subgraph[] = [
  { id: "sg1", name: "surveys",   team: "Survey Team",    types: 3,  status: "healthy",  latency: 42,  migrated: true,  progress: 100 },
  { id: "sg2", name: "users",     team: "Auth Team",      types: 2,  status: "healthy",  latency: 28,  migrated: true,  progress: 100 },
  { id: "sg3", name: "responses", team: "Data Team",      types: 2,  status: "healthy",  latency: 68,  migrated: false, progress: 65  },
  { id: "sg4", name: "analytics", team: "Analytics Team", types: 1,  status: "degraded", latency: 210, migrated: false, progress: 40  },
  { id: "sg5", name: "billing",   team: "Billing Team",   types: 2,  status: "down",     latency: 0,   migrated: false, progress: 15  },
  { id: "sg6", name: "monolith",  team: "Platform Team",  types: 41, status: "healthy",  latency: 380, migrated: false, progress: 0   },
];

const BREAKING_BEFORE = `type Survey {
  id: ID!
  title: String!
  questions: [SurveyQuestion!]!
  status: SurveyStatus!
  createdAt: DateTime!
  theme: SurveyTheme
}

enum SurveyStatus {
  DRAFT
  OPEN
  CLOSED
}`;

const BREAKING_AFTER = `type Survey {
  id: ID!
  title: String!
  # questions field removed → BREAKING
  surveyState: String! # renamed from status → BREAKING
  createdAt: DateTime!
  theme: SurveyTheme
  isArchived: Boolean  # new field → SAFE
}

enum SurveyStatus {
  DRAFT
  OPEN
  CLOSED
  PAUSED     # new enum value → SAFE
}`;

const BREAKING_CHANGES: BreakingChange[] = [
  { type: "breaking", field: "Survey.questions",           reason: "Field removed — all queries using Survey.questions will fail" },
  { type: "breaking", field: "Survey.status → surveyState",reason: "Field renamed — all queries selecting .status will return null" },
  { type: "warning",  field: "SurveyStatus.PAUSED",        reason: "New enum value — clients that don't handle PAUSED may behave unexpectedly" },
  { type: "safe",     field: "Survey.isArchived",           reason: "New optional field — all existing queries unaffected" },
];

// ─────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────

function CodeSnip({ code, label, color = SM.green }: { code: string; label?: string; color?: string }) {
  return (
    <div style={{ background: "#030806", border: `1px solid ${SM.border}`, borderRadius: 6, overflow: "hidden" }}>
      {label && <div style={{ padding: "4px 12px", borderBottom: `1px solid ${SM.border}`, fontSize: 9, color, fontFamily: SM.mono }}>{label}</div>}
      <pre style={{ margin: 0, padding: 12, fontSize: 8.5, fontFamily: SM.mono, color: "#5a8a6e", lineHeight: 1.7, overflow: "auto", maxHeight: 360, whiteSpace: "pre-wrap" }}>{code}</pre>
    </div>
  );
}

function SubgraphCard({ sg, onClick, selected }: { sg: Subgraph; onClick: () => void; selected: boolean }) {
  const sc = sg.status === "healthy" ? SM.green : sg.status === "degraded" ? SM.yellow : SM.red;
  return (
    <div onClick={onClick} style={{ background: selected ? `${SM.green}12` : SM.surface, border: `1px solid ${selected ? SM.green + "50" : SM.border}`, borderRadius: 8, padding: "8px 10px", cursor: "pointer" }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
        <div style={{ fontSize: 9, fontWeight: 700, color: SM.textBright }}>{sg.name}</div>
        <span style={{ fontSize: 7, background: `${sc}18`, color: sc, borderRadius: 3, padding: "1px 7px", fontWeight: 700 }}>{sg.status}</span>
      </div>
      <div style={{ fontSize: 7, color: SM.textMuted, marginBottom: 5 }}>{sg.team} · {sg.types} types</div>
      <div style={{ background: SM.surface2, borderRadius: 3, height: 5, overflow: "hidden" }}>
        <div style={{ width: `${sg.progress}%`, height: "100%", background: sg.migrated ? SM.green : sc, borderRadius: 3 }} />
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 3 }}>
        <span style={{ fontSize: 7, color: SM.textMuted }}>{sg.progress}% migrated</span>
        <span style={{ fontSize: 7, color: sg.status === "down" ? SM.red : SM.textMuted, fontFamily: SM.mono }}>{sg.status === "down" ? "N/A" : `${sg.latency}ms`}</span>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
// Live latency simulation
// ─────────────────────────────────────────────────────────────────

function LatencyMeter({ target, color, label }: { target: number; color: string; label: string }) {
  const [val, setVal] = useState(target);
  useEffect(() => {
    const id = setInterval(() => setVal(Math.round(target + (Math.random() - 0.5) * target * 0.1)), 900);
    return () => clearInterval(id);
  }, [target]);
  return (
    <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
      <div style={{ width: 80, fontSize: 7, color: SM.textMuted, textAlign: "right", flexShrink: 0 }}>{label}</div>
      <div style={{ flex: 1, background: SM.surface2, borderRadius: 3, height: 14, overflow: "hidden", position: "relative" }}>
        <div style={{ width: `${Math.min((val / 500) * 100, 100)}%`, height: "100%", background: color, borderRadius: 3, transition: "width 0.4s ease" }} />
        <span style={{ position: "absolute", right: 4, top: 0, bottom: 0, display: "flex", alignItems: "center", fontSize: 7, fontFamily: SM.mono, color: SM.textBright }}>{val}ms</span>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
// Main component
// ─────────────────────────────────────────────────────────────────

export function SurveyMonkeyFederationDemo() {
  const [tab, setTab] = useState<"arch" | "tools" | "perf" | "xfn">("arch");

  // Architecture state
  const [archView, setArchView]       = useState<"before" | "after">("before");
  const [selectedSg, setSelectedSg]   = useState<string | null>("sg1");
  const [extractStep, setExtractStep] = useState(-1);
  const [billingDown, setBillingDown] = useState(false);

  // Tools state
  const [selectedDomain, setSelectedDomain] = useState<string>("surveys");
  const [schemaInput, setSchemaInput]        = useState(BREAKING_BEFORE);
  const [diffView, setDiffView]              = useState(false);
  const [cliStep, setCliStep]                = useState(-1);

  // Performance state
  const [cacheEnabled, setCacheEnabled] = useState(true);

  // XFN state
  const [rfcStep, setRfcStep]           = useState(-1);
  const [govRule, setGovRule]           = useState<number | null>(null);
  const [teamExpanded, setTeamExpanded] = useState<string | null>(null);

  const DOMAINS = ["surveys", "responses", "users", "analytics", "billing"] as const;
  const domainColors: Record<string, string> = {
    surveys: SM.green, responses: SM.teal, users: SM.blue, analytics: SM.purple, billing: SM.yellow,
  };

  const EXTRACT_STEPS = [
    { label: "Identify bounded domain",         icon: "🔍", detail: "Group types by business domain: Survey, SurveyQuestion, SurveyTheme → 'surveys' subgraph" },
    { label: "Define @key directives",          icon: "🔑", detail: "type Survey @key(fields: \"id\") — marks Survey as an entity joinable across subgraphs" },
    { label: "Implement __resolveReference",    icon: "⚙️", detail: "Each subgraph: async resolver that fetches entity by key ID from its own data store" },
    { label: "Compose with Apollo Rover",       icon: "🔀", detail: "rover subgraph check — validates no conflicts with other subgraphs before deployment" },
    { label: "Deploy subgraph + route traffic", icon: "🚦", detail: "Apollo Router: feature flag to route surveys queries to new subgraph. 1% → 10% → 100%" },
    { label: "Remove from monolith",            icon: "✂️", detail: "Once traffic 100% on subgraph: remove types from monolith. Monolith shrinks incrementally" },
  ];

  const CLI_STEPS = [
    { cmd: "$ smk-fed analyze --schema ./schema.graphql", out: "Analyzing 89 types across 47 files…\n→ Identified 5 domain boundaries\n→ surveys: 3 types · responses: 2 · users: 2 · analytics: 1 · billing: 2\n→ Unclassified: 79 types (suggest manual review)" },
    { cmd: "$ smk-fed extract --domain surveys --output ./subgraphs/surveys/", out: "Extracting 3 types: Survey, SurveyQuestion, SurveyTheme\n→ Adding @key directives…\n→ Generating resolver stubs (surveys/resolvers.ts)\n→ Generating schema file (surveys/schema.graphql)\n→ Generating subgraph server (surveys/server.ts)\n✓ Generated subgraph starter in ./subgraphs/surveys/" },
    { cmd: "$ smk-fed check --subgraph surveys", out: "Running rover subgraph check…\n→ Fetching supergraph schema from Apollo Studio…\n→ Composing: surveys ✓ users ✓ monolith ✓\n→ Checking for breaking changes: 0 found\n✓ Composition valid — safe to deploy" },
    { cmd: "$ smk-fed analyze --usage --field Survey.title", out: "Analyzing query logs (last 30 days)…\n→ Survey.title: 1,204 queries/day\n→ Used by: 8 operations (4 in web, 2 in mobile, 2 in API)\n→ TOP USERS: SurveyList.query (890/day), EditSurvey.query (314/day)\n→ Safe to remove: NO (high usage — coordinate with clients first)" },
  ];

  const RFC_STEPS = [
    "Problem statement: monolith graph has 89 types, 12 teams competing for changes",
    "Proposed solution: Apollo Federation 2 with domain-bounded subgraphs",
    "Alternatives considered: schema stitching, domain namespacing, REST fallback",
    "Migration strategy: incremental extraction, no big-bang migration",
    "Risk assessment: rollback plan, feature flags, traffic canary",
    "Team survey: gather feedback from all 12 affected teams (async, 2 weeks)",
    "Revision: address concerns, update RFC with agreed changes",
    "Sign-off: VP Engineering + infrastructure leads + product leads",
    "Execution: staff engineer leads, each team owns their subgraph",
  ];

  const GOVERNANCE = [
    { rule: "Schema changes require RFC for breaking changes", detail: "Non-breaking (new fields, new types): PR + review. Breaking (field removal, type changes): RFC process, 2-week review period, affected team sign-off required." },
    { rule: "Each subgraph must pass composition checks in CI", detail: "GitHub Actions: rover subgraph check runs on every PR. If composition fails → PR blocked. Teams cannot deploy changes that break the supergraph." },
    { rule: "No cross-domain entity ownership", detail: "A subgraph can EXTEND another subgraph's entity (add fields). It cannot REDEFINE it. Survey team owns Survey type. Response team can extend Survey but cannot change @key." },
    { rule: "Deprecation period: 60 days minimum", detail: "Before removing a field: mark @deprecated. Monitor usage for 60 days. If usage reaches 0: file removal PR. If not: work with clients to migrate." },
    { rule: "New subgraphs require onboarding session", detail: "New team extracting a subgraph: 1-hour onboarding with platform team. Covers: @key patterns, DataLoader, error handling, observability setup, CI template." },
  ];

  const TEAM_PROGRESS = [
    { team: "Survey Team",    status: "Complete",   detail: "3 types migrated · 100% traffic on subgraph · monolith types removed · writing post-migration doc", color: SM.green  },
    { team: "Auth Team",      status: "Complete",   detail: "User, Team types migrated · zero-downtime migration using blue/green deployment", color: SM.green  },
    { team: "Data Team",      status: "In Progress",detail: "Response, Answer types in subgraph · 65% traffic routed · performance testing in progress", color: SM.yellow },
    { team: "Analytics Team", status: "In Progress",detail: "Subgraph created · Blocked: AnalyticsSummary.surveyId @key conflicts with Survey subgraph key — needs RFC", color: SM.orange },
    { team: "Billing Team",   status: "Not Started",detail: "Kickoff scheduled · blocking issue: Plan type shared with 3 other teams — complex ownership negotiation needed", color: SM.red    },
    { team: "Mobile Team",    status: "Consumer",   detail: "Not extracting — consumer only. Updating operations to use federated types. 40% complete.", color: SM.teal  },
  ];

  const TABS = [
    { id: "arch"  as const, label: "🏗️ Architecture"     },
    { id: "tools" as const, label: "⚙️  Migration Tools"  },
    { id: "perf"  as const, label: "📊 Performance"       },
    { id: "xfn"   as const, label: "🤝 Cross-Functional"  },
  ];

  return (
    <div style={{ background: SM.bg, color: SM.text, fontFamily: "'Inter', system-ui, sans-serif", minHeight: "100vh", padding: 24 }}>

      {/* Header */}
      <div style={{ marginBottom: 18 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
          <div style={{ width: 42, height: 42, borderRadius: 10, background: `linear-gradient(135deg, ${SM.green}, ${SM.teal})`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22 }}>📊</div>
          <div>
            <h1 style={{ margin: 0, fontSize: 20, fontWeight: 900, color: SM.textBright, letterSpacing: "-0.02em" }}>SurveyMonkey — Staff Engineer · Web Platform</h1>
            <p style={{ margin: 0, fontSize: 11, color: SM.textMuted }}>GraphQL Federation Migration · Monolith → Modular Architecture · Migration Tooling · Cross-Functional Leadership</p>
          </div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8 }}>
          {[
            { v: "Staff Eng", l: "Web Platform role",        c: SM.green,    sub: "89 types · 12 teams · monolith → 6 federated subgraphs" },
            { v: "Federation",l: "Apollo Federation 2",       c: SM.teal,     sub: "Router + subgraphs · @key entities · composition validation" },
            { v: "Tooling",   l: "Migration CLI + dashboard", c: SM.purple,   sub: "Schema analyzer · breaking change detector · subgraph generator" },
            { v: "XFN Lead",  l: "12 teams, 1 platform",     c: SM.yellow,   sub: "RFC process · schema governance · team enablement" },
          ].map(m => (
            <div key={m.l} style={{ background: SM.surface, border: `1px solid ${SM.border}`, borderLeft: `3px solid ${m.c}`, borderRadius: 8, padding: "8px 12px" }}>
              <div style={{ fontSize: 13, fontWeight: 900, color: m.c }}>{m.v}</div>
              <div style={{ fontSize: 8, fontWeight: 700, color: SM.textBright }}>{m.l}</div>
              <div style={{ fontSize: 7, color: SM.textMuted, marginTop: 2 }}>{m.sub}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Tab bar */}
      <div style={{ display: "flex", gap: 4, marginBottom: 18, borderBottom: `1px solid ${SM.border}`, paddingBottom: 4 }}>
        {TABS.map(tb => (
          <button key={tb.id} onClick={() => setTab(tb.id)} style={{ background: tab === tb.id ? SM.surface2 : "transparent", color: tab === tb.id ? SM.textBright : SM.textMuted, border: tab === tb.id ? `1px solid ${SM.border}` : "1px solid transparent", borderRadius: "8px 8px 0 0", padding: "8px 20px", cursor: "pointer", fontSize: 11, fontWeight: 600 }}>{tb.label}</button>
        ))}
      </div>

      {/* ── ARCHITECTURE ── */}
      {tab === "arch" && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
          <div>
            <div style={{ fontSize: 10, fontWeight: 700, color: SM.textMuted, marginBottom: 8, letterSpacing: "0.08em" }}>GRAPHQL ARCHITECTURE — BEFORE vs AFTER</div>

            <div style={{ display: "flex", gap: 4, marginBottom: 10 }}>
              <button onClick={() => setArchView("before")} style={{ flex: 1, fontSize: 9, background: archView === "before" ? `${SM.red}20` : "transparent", color: archView === "before" ? SM.red : SM.textMuted, border: `1px solid ${archView === "before" ? SM.red : SM.border}`, borderRadius: 5, padding: "5px 0", cursor: "pointer" }}>❌ Monolithic graph</button>
              <button onClick={() => setArchView("after")} style={{ flex: 1, fontSize: 9, background: archView === "after" ? `${SM.green}20` : "transparent", color: archView === "after" ? SM.green : SM.textMuted, border: `1px solid ${archView === "after" ? SM.green : SM.border}`, borderRadius: 5, padding: "5px 0", cursor: "pointer" }}>✓ Federated supergraph</button>
            </div>

            {archView === "before" && (
              <div style={{ background: SM.surface, border: `1px solid ${SM.border}`, borderRadius: 10, padding: 12, marginBottom: 12 }}>
                <div style={{ textAlign: "center", marginBottom: 10 }}>
                  {/* Client */}
                  <div style={{ background: SM.surface2, border: `1px solid ${SM.border}`, borderRadius: 6, padding: "5px 12px", display: "inline-block", fontSize: 8, color: SM.textBright }}>React / Mobile Client</div>
                  <div style={{ height: 16, display: "flex", justifyContent: "center", alignItems: "center", fontSize: 12, color: SM.textMuted }}>↓</div>
                  {/* Monolith */}
                  <div style={{ background: `${SM.red}15`, border: `2px solid ${SM.red}40`, borderRadius: 8, padding: "10px 16px", margin: "0 auto", display: "inline-block" }}>
                    <div style={{ fontSize: 9, fontWeight: 700, color: SM.red, marginBottom: 4 }}>Apollo Server (Monolith)</div>
                    <div style={{ display: "flex", gap: 5, flexWrap: "wrap", justifyContent: "center" }}>
                      {["89 types", "47 files", "12 teams", "1 deploy", "1 on-call"].map(t => (
                        <span key={t} style={{ fontSize: 7, background: `${SM.red}10`, color: SM.red, padding: "1px 6px", borderRadius: 3 }}>{t}</span>
                      ))}
                    </div>
                    <div style={{ fontSize: 7, color: SM.textMuted, marginTop: 5 }}>⚠ One team's bad resolver = everyone's problem</div>
                  </div>
                  <div style={{ height: 16, display: "flex", justifyContent: "center", alignItems: "center", fontSize: 12, color: SM.textMuted }}>↓</div>
                  {/* Backend services */}
                  <div style={{ display: "flex", gap: 5, justifyContent: "center" }}>
                    {["Surveys DB", "Users DB", "Analytics DB", "Billing DB"].map(s => (
                      <div key={s} style={{ background: SM.surface2, border: `1px solid ${SM.border}`, borderRadius: 5, padding: "4px 8px", fontSize: 7, color: SM.textMuted }}>{s}</div>
                    ))}
                  </div>
                </div>
                <div style={{ padding: "6px 8px", background: `${SM.red}08`, borderRadius: 6, fontSize: 8, color: SM.red }}>
                  Problems: <strong>single point of failure · 380ms avg latency · all 12 teams blocked on one deployment pipeline · impossible to scale individual domains · any schema change = risk to entire graph</strong>
                </div>
              </div>
            )}

            {archView === "after" && (
              <div style={{ background: SM.surface, border: `1px solid ${SM.border}`, borderRadius: 10, padding: 12, marginBottom: 12 }}>
                <div style={{ textAlign: "center", marginBottom: 8 }}>
                  <div style={{ background: SM.surface2, border: `1px solid ${SM.border}`, borderRadius: 6, padding: "5px 12px", display: "inline-block", fontSize: 8, color: SM.textBright }}>React / Mobile Client</div>
                  <div style={{ height: 12, display: "flex", justifyContent: "center", alignItems: "center", fontSize: 10, color: SM.textMuted }}>↓</div>
                  <div style={{ background: `${SM.green}15`, border: `2px solid ${SM.green}40`, borderRadius: 8, padding: "7px 20px", display: "inline-block", marginBottom: 8 }}>
                    <div style={{ fontSize: 9, fontWeight: 700, color: SM.green }}>Apollo Router (Supergraph)</div>
                    <div style={{ fontSize: 7, color: SM.textMuted }}>Query planning · composition · observability</div>
                  </div>
                  <div style={{ display: "flex", gap: 5, justifyContent: "center", marginTop: 0 }}>
                    {[
                      { name: "surveys", c: SM.green, status: "healthy" },
                      { name: "users",   c: SM.blue,  status: "healthy" },
                      { name: "responses",c: SM.teal, status: "healthy" },
                      { name: "analytics",c: SM.purple,status: "degraded" },
                      { name: "billing", c: SM.yellow, status: billingDown ? "down" : "healthy" },
                    ].map(sg => (
                      <div key={sg.name} style={{ background: SM.surface2, border: `1px solid ${sg.c}40`, borderRadius: 5, padding: "5px 8px", textAlign: "center" }}>
                        <div style={{ fontSize: 7, fontWeight: 700, color: sg.c }}>{sg.name}</div>
                        <div style={{ fontSize: 6, color: sg.status === "healthy" ? SM.green : sg.status === "degraded" ? SM.yellow : SM.red }}>{sg.status}</div>
                      </div>
                    ))}
                  </div>
                </div>
                <div style={{ display: "flex", gap: 6, marginTop: 6, alignItems: "center" }}>
                  <button onClick={() => setBillingDown(b => !b)} style={{ fontSize: 8, background: `${SM.yellow}15`, border: `1px solid ${SM.yellow}40`, borderRadius: 5, padding: "4px 10px", color: SM.yellow, cursor: "pointer" }}>
                    {billingDown ? "↑ Restore billing subgraph" : "↓ Simulate billing outage"}
                  </button>
                  {billingDown && <span style={{ fontSize: 8, color: SM.green }}>✓ Survey queries still work — subgraph isolation in action</span>}
                </div>
              </div>
            )}

            {/* Subgraph status grid */}
            <div style={{ fontSize: 9, fontWeight: 700, color: SM.textMuted, marginBottom: 6, letterSpacing: "0.08em" }}>SUBGRAPH STATUS</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 6, marginBottom: 12 }}>
              {SUBGRAPHS.map(sg => <SubgraphCard key={sg.id} sg={sg} onClick={() => setSelectedSg(sg.id)} selected={selectedSg === sg.id} />)}
            </div>
            {selectedSg && (() => {
              const sg = SUBGRAPHS.find(s => s.id === selectedSg)!;
              return (
                <div style={{ background: SM.surface, border: `1px solid ${SM.border}`, borderRadius: 8, padding: 10 }}>
                  <div style={{ fontSize: 9, fontWeight: 700, color: SM.textBright, marginBottom: 5 }}>{sg.name} — {sg.team}</div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 5 }}>
                    {[
                      { l: "Status", v: sg.status, c: sg.status === "healthy" ? SM.green : sg.status === "degraded" ? SM.yellow : SM.red },
                      { l: "Latency", v: sg.status === "down" ? "N/A" : `${sg.latency}ms`, c: sg.latency < 100 ? SM.green : sg.latency < 200 ? SM.yellow : SM.red },
                      { l: "Types", v: `${sg.types} types`, c: SM.textMuted },
                    ].map(m => (
                      <div key={m.l} style={{ background: SM.surface2, borderRadius: 5, padding: "5px 8px", textAlign: "center" }}>
                        <div style={{ fontSize: 10, fontWeight: 700, color: m.c }}>{m.v}</div>
                        <div style={{ fontSize: 7, color: SM.textMuted }}>{m.l}</div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })()}

            {/* Extraction pipeline */}
            <div style={{ background: SM.surface, border: `1px solid ${SM.border}`, borderRadius: 10, padding: 12, marginTop: 10 }}>
              <div style={{ fontSize: 8, fontWeight: 700, color: SM.textMuted, marginBottom: 6 }}>EXTRACTION PIPELINE — click to walk through</div>
              {EXTRACT_STEPS.map((step, i) => (
                <div key={i} onClick={() => setExtractStep(i)} style={{ display: "flex", gap: 8, alignItems: "flex-start", padding: "5px 8px", borderRadius: 6, marginBottom: 3, cursor: "pointer", borderLeft: `2px solid ${extractStep >= i ? SM.green : SM.border}`, background: extractStep === i ? `${SM.green}08` : "transparent" }}>
                  <span style={{ fontSize: 12, flexShrink: 0 }}>{step.icon}</span>
                  <div>
                    <div style={{ fontSize: 8.5, fontWeight: 600, color: extractStep >= i ? SM.textBright : SM.textMuted }}>{step.label}</div>
                    {extractStep === i && <div style={{ fontSize: 8, color: SM.green, marginTop: 2 }}>{step.detail}</div>}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <div style={{ fontSize: 10, fontWeight: 700, color: SM.textMuted, marginBottom: 8, letterSpacing: "0.08em" }}>IMPLEMENTATION DEPTH</div>
            <CodeSnip color={SM.green} label="GraphQL Federation 2 — Staff Engineer perspective: why, how, what changes" code={
`// SURVEYMONKEY CONTEXT:
// SurveyMonkey: 20M+ users · 400M+ surveys · enterprise customers.
// The GraphQL graph: central data layer for all frontend products.
// 89 types, 47 schema files, 12 teams making changes.
//
// THE MONOLITH PROBLEMS (Staff Engineer diagnosis):
// 1. DEPLOYMENT BOTTLENECK:
//    One CI/CD pipeline for the entire graph.
//    A change to Billing types: blocked waiting for Survey team's changes to merge.
//    Average: 12 PRs queued simultaneously.
//    Time from PR open to production: 4-6 days average.
//    "12 teams sharing one deployment pipeline is not a technical problem.
//     It's an organizational problem dressed as a technical one."
//
// 2. OPERATIONAL COUPLING:
//    Billing service's resolver is slow (complex DB queries).
//    Every user who queries their Survey AND billing data: waits for billing.
//    One bad deploy by any team: potential outage for all clients.
//    On-call: one team responsible for 89 types they didn't all write.
//
// 3. SCHEMA GOVERNANCE FAILURE:
//    No clear ownership of types.
//    Type Survey: last modified by 7 different teams in 6 months.
//    Breaking changes shipped without warning (no automated detection).
//    Mobile clients broken by changes they weren't consulted on.
//
// THE SOLUTION: APOLLO FEDERATION 2:
//
// KEY CONCEPTS:
//
// 1. ENTITIES (@key):
// An entity: a type that can be fetched by a unique key,
// and extended by multiple subgraphs.
//
// // surveys subgraph — owns Survey:
// type Survey @key(fields: "id") {
//   id:        ID!
//   title:     String!
//   status:    SurveyStatus!
//   createdAt: DateTime!
//   ownerId:   ID!
// }
//
// // responses subgraph — extends Survey with response data:
// extend type Survey @key(fields: "id") {
//   id:              ID! @external
//   responseCount:   Int!
//   completionRate:  Float!
//   latestResponses: [SurveyResponse!]!
// }
// The router: when a query asks for Survey { id title responseCount }
// → fetches id, title from surveys subgraph
// → fetches responseCount from responses subgraph (using id as key)
// → merges and returns one response
//
// 2. THE APOLLO ROUTER:
// Not Apollo Server — Apollo Router (Rust-based, high performance).
// Responsibilities:
// • Query planning: which subgraphs to call, in what order
// • Parallel subgraph fetch where possible
// • Response merging
// • Persisted query lookup
// • Authorization (JWT validation at the router level)
// • Observability (OpenTelemetry export to DataDog)
//
// 3. COMPOSITION:
// Before deployment: rover supergraph compose validates all subgraphs together.
// If surveys subgraph and responses subgraph have a type conflict: compose fails.
// Nothing ships that would break the supergraph.
// This is the CI gate: no subgraph can be deployed without composition success.
//
// THE INCREMENTAL MIGRATION STRATEGY:
// "No big-bang migrations. Ever."
//
// Phase 0: Apollo Router in front of monolith (no-op).
//   Router passes all queries through to the monolith.
//   Zero client impact. We gain: observability, tracing, per-query metrics.
//   Duration: 2 weeks.
//
// Phase 1: Extract lowest-risk subgraph first (surveys).
//   Surveys team: extracted, tested in staging.
//   Feature flag: 1% of surveys traffic routed to subgraph.
//   Monitored for 1 week. No regression: 10% → 50% → 100%.
//   Monolith still runs Survey types (served by monolith as fallback).
//   When 100% on subgraph for 2 weeks: remove Survey types from monolith.
//   Duration: 4 weeks per subgraph.
//
// Phase 2: Extract 1 subgraph per quarter until monolith is empty.
//   Monolith shrinks. Eventually: monolith = 0 types → decommissioned.
//
// WHY THIS MATTERS AT STAFF ENGINEER LEVEL:
// A senior engineer can implement Federation for their team.
// A staff engineer:
// • Defines the migration strategy across 12 teams.
// • Writes the RFC that 12 teams approve.
// • Builds tooling that makes the migration possible at scale.
// • Works with infrastructure on CI/CD templates for subgraph deployment.
// • Works with security on field-level authorization in the new model.
// • Works with mobile on how their clients handle partial responses.
// "My job: make it possible for 12 teams to independently migrate
//  their part of the graph without any team blocking another."`} />
          </div>
        </div>
      )}

      {/* ── MIGRATION TOOLS ── */}
      {tab === "tools" && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
          <div>
            <div style={{ fontSize: 10, fontWeight: 700, color: SM.textMuted, marginBottom: 8, letterSpacing: "0.08em" }}>MIGRATION TOOLING — built to scale the migration</div>

            {/* Schema analyzer */}
            <div style={{ background: SM.surface, border: `1px solid ${SM.border}`, borderRadius: 10, padding: 12, marginBottom: 12 }}>
              <div style={{ fontSize: 9, fontWeight: 700, color: SM.textMuted, marginBottom: 6 }}>TOOL 1: SCHEMA DOMAIN ANALYZER</div>
              <div style={{ fontSize: 8, color: SM.textMuted, marginBottom: 8 }}>Click a domain to see which types belong to it. Usage count = queries/day from production logs.</div>
              <div style={{ display: "flex", gap: 4, marginBottom: 8, flexWrap: "wrap" }}>
                {DOMAINS.map(d => (
                  <button key={d} onClick={() => setSelectedDomain(d)} style={{ fontSize: 9, background: selectedDomain === d ? `${domainColors[d]}20` : "transparent", color: selectedDomain === d ? domainColors[d] : SM.textMuted, border: `1px solid ${selectedDomain === d ? domainColors[d] : SM.border}`, borderRadius: 5, padding: "4px 10px", cursor: "pointer" }}>{d}</button>
                ))}
              </div>
              <div style={{ background: SM.surface2, borderRadius: 8, overflow: "hidden" }}>
                {SCHEMA_TYPES.filter(t => t.domain === selectedDomain).map((t, i) => (
                  <div key={t.name} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "7px 10px", borderBottom: `1px solid ${SM.border}20`, background: i % 2 === 0 ? "transparent" : `${SM.surface3}60` }}>
                    <div>
                      <div style={{ fontSize: 9, fontWeight: 700, color: SM.textBright }}>{t.name}</div>
                      <div style={{ fontSize: 7, color: SM.textMuted, fontFamily: SM.mono }}>{t.fields.join(", ")}</div>
                    </div>
                    <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                      <span style={{ fontSize: 7, color: SM.textMuted }}>{t.usageCount}/day</span>
                      <span style={{ fontSize: 7, background: t.extracted ? `${SM.green}20` : `${SM.yellow}20`, color: t.extracted ? SM.green : SM.yellow, borderRadius: 3, padding: "1px 6px", fontWeight: 700 }}>{t.extracted ? "✓ Extracted" : "⟳ Pending"}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Breaking change detector */}
            <div style={{ background: SM.surface, border: `1px solid ${SM.border}`, borderRadius: 10, padding: 12, marginBottom: 12 }}>
              <div style={{ fontSize: 9, fontWeight: 700, color: SM.textMuted, marginBottom: 4 }}>TOOL 2: BREAKING CHANGE DETECTOR</div>
              <div style={{ display: "flex", gap: 5, marginBottom: 8 }}>
                <button onClick={() => setDiffView(false)} style={{ fontSize: 9, background: !diffView ? `${SM.green}20` : "transparent", color: !diffView ? SM.green : SM.textMuted, border: `1px solid ${!diffView ? SM.green : SM.border}`, borderRadius: 5, padding: "4px 10px", cursor: "pointer" }}>Schema input</button>
                <button onClick={() => setDiffView(true)} style={{ fontSize: 9, background: diffView ? `${SM.red}20` : "transparent", color: diffView ? SM.red : SM.textMuted, border: `1px solid ${diffView ? SM.red : SM.border}`, borderRadius: 5, padding: "4px 10px", cursor: "pointer" }}>Run detector →</button>
              </div>
              {!diffView ? (
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
                  {[{ label: "CURRENT schema", code: BREAKING_BEFORE, c: SM.green }, { label: "PROPOSED schema", code: BREAKING_AFTER, c: SM.yellow }].map(s => (
                    <div key={s.label} style={{ background: SM.surface2, borderRadius: 6, overflow: "hidden" }}>
                      <div style={{ padding: "3px 8px", fontSize: 7, color: s.c, borderBottom: `1px solid ${SM.border}` }}>{s.label}</div>
                      <pre style={{ margin: 0, padding: 8, fontSize: 7.5, fontFamily: SM.mono, color: "#5a7a6e", lineHeight: 1.6, maxHeight: 140, overflow: "auto", whiteSpace: "pre-wrap" }}>{s.code}</pre>
                    </div>
                  ))}
                </div>
              ) : (
                <div>
                  {BREAKING_CHANGES.map((c, i) => (
                    <div key={i} style={{ display: "flex", gap: 8, alignItems: "flex-start", padding: "6px 8px", borderRadius: 5, marginBottom: 4, background: c.type === "breaking" ? `${SM.red}10` : c.type === "warning" ? `${SM.yellow}10` : `${SM.green}08`, border: `1px solid ${c.type === "breaking" ? SM.red : c.type === "warning" ? SM.yellow : SM.green}30` }}>
                      <span style={{ fontSize: 7, background: c.type === "breaking" ? `${SM.red}25` : c.type === "warning" ? `${SM.yellow}25` : `${SM.green}25`, color: c.type === "breaking" ? SM.red : c.type === "warning" ? SM.yellow : SM.green, borderRadius: 3, padding: "1px 5px", fontWeight: 700, flexShrink: 0, textTransform: "uppercase" }}>{c.type}</span>
                      <div>
                        <div style={{ fontSize: 8, fontWeight: 700, color: SM.textBright, fontFamily: SM.mono }}>{c.field}</div>
                        <div style={{ fontSize: 7, color: SM.textMuted }}>{c.reason}</div>
                      </div>
                    </div>
                  ))}
                  <div style={{ padding: "5px 8px", background: `${SM.red}08`, borderRadius: 5, fontSize: 8, color: SM.red, fontWeight: 700, marginTop: 4 }}>🚫 2 breaking changes detected — PR blocked until clients notified + RFC approved</div>
                </div>
              )}
            </div>

            {/* CLI tool */}
            <div style={{ background: SM.surface, border: `1px solid ${SM.border}`, borderRadius: 10, padding: 12 }}>
              <div style={{ fontSize: 9, fontWeight: 700, color: SM.textMuted, marginBottom: 6 }}>TOOL 3: smk-fed CLI — click to run commands</div>
              {CLI_STEPS.map((s, i) => (
                <div key={i} onClick={() => setCliStep(cliStep === i ? -1 : i)} style={{ marginBottom: 6, cursor: "pointer" }}>
                  <div style={{ background: SM.surface2, borderRadius: "5px 5px 0 0", padding: "5px 10px", fontFamily: SM.mono, fontSize: 8, color: SM.green }}>{s.cmd}</div>
                  {cliStep === i && (
                    <div style={{ background: "#010504", borderRadius: "0 0 5px 5px", padding: "6px 10px", fontFamily: SM.mono, fontSize: 7.5, color: "#4a7a5a", lineHeight: 1.7, whiteSpace: "pre-wrap" }}>{s.out}</div>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div>
            <div style={{ fontSize: 10, fontWeight: 700, color: SM.textMuted, marginBottom: 8, letterSpacing: "0.08em" }}>IMPLEMENTATION DEPTH</div>
            <CodeSnip color={SM.purple} label="Migration tooling — why we built it, what each tool does, the Staff Eng view" code={
`// THE PROBLEM WITH UNASSISTED MIGRATION:
// "Here's our Federation plan. Now go migrate your subgraph."
// What happens: each team reinvents the same things.
// - How do I add @key directives? Which field?
// - How do I write __resolveReference?
// - What are the CI/CD steps for a subgraph?
// - How do I check if my change breaks the supergraph?
// Result: 12 teams × 4 weeks each = 48 weeks of migration work.
// Many mistakes. Many rollbacks.
// "The tooling multiplies the migration capacity.
//  With good tools: 12 teams × 2 weeks each = 24 weeks.
//  The time I spend building tools: recouped by every team that uses them."
//
// TOOL 1: SCHEMA DOMAIN ANALYZER (smk-fed analyze)
//
// PROBLEM IT SOLVES:
// The 89-type monolith: types grouped by accident, not by domain.
// "ResponseSummary" — is that a responses type or an analytics type?
// Without analysis: teams guess. Guesses = wrong subgraph boundaries = rework.
//
// HOW IT WORKS:
// 1. Parse the schema with graphql-js SchemaParser.
// 2. Read Apollo Studio operation metrics (via Apollo Studio API).
//    For each field: which operations use it? What's the usage count?
// 3. Cluster types by co-usage:
//    If Survey and SurveyQuestion always appear in the same queries:
//    they likely belong in the same subgraph.
//    K-means clustering on co-occurrence matrix.
// 4. Cross-reference with naming conventions + resolver file paths.
//    Resolver in /src/resolvers/surveys/: likely surveys domain.
// 5. Output: suggested subgraph boundaries + confidence score.
//
// EXAMPLE OUTPUT:
// surveys   (confidence: 94%): Survey, SurveyQuestion, SurveyTheme
// responses (confidence: 87%): SurveyResponse, Answer
// users     (confidence: 91%): User, Team, Permission
// analytics (confidence: 73%): AnalyticsSummary, ReportExport
// billing   (confidence: 66%): Plan, Subscription
// unclassified (34%): 12 types — needs manual review
//
// TOOL 2: BREAKING CHANGE DETECTOR (smk-fed check)
//
// PROBLEM IT SOLVES:
// Mobile clients break when the schema changes without notice.
// Survey team removes a field they thought was unused.
// Mobile client still using it: crashes in production.
//
// HOW IT WORKS:
// Uses graphql-inspector (or graphql-schema-diff) under the hood.
// Compares proposed schema (PR) against current published schema.
// Classifies each change:
//   BREAKING:  field removal, type change, argument removal
//   WARNING:   new required argument, enum addition, type narrowing
//   SAFE:      field addition, type description change, deprecation
//
// CI INTEGRATION:
// GitHub Action: runs on every PR that touches *.graphql files.
// If BREAKING changes detected:
//   → Requires sign-off from every team that uses the changed field
//   → Opens GitHub issue listing affected operations
//   → PR blocked until sign-offs received
//
// TOOL 3: smk-fed CLI SUBGRAPH GENERATOR
//
// PROBLEM IT SOLVES:
// Starting a subgraph from scratch: unfamiliar to most product engineers.
// @key, __resolveReference, DataLoader, health checks, CI templates.
// Without the generator: takes 2-3 days to scaffold correctly.
// With the generator: 30 minutes.
//
// WHAT IT GENERATES:
// smk-fed extract --domain surveys --types Survey,SurveyQuestion,SurveyTheme
// Output directory:
// subgraphs/surveys/
//   schema.graphql     ← types with @key, @external, @shareable directives
//   resolvers.ts       ← resolver stubs + DataLoader setup
//   server.ts          ← Apollo Subgraph server (startStandaloneServer)
//   health.ts          ← /health endpoint for load balancer
//   .github/           ← CI workflow: type-check, composition check, deploy
//   README.md          ← onboarding guide for the surveys team
//
// TOOL 4: COMPOSITION DASHBOARD (React app)
// Real-time view of all subgraph health.
// Shows: composition status, last deployment, breaking change alerts,
//        per-subgraph latency, error rates, migration progress per team.
// "The single source of truth for 'where are we in the migration?'"`} />
          </div>
        </div>
      )}

      {/* ── PERFORMANCE ── */}
      {tab === "perf" && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
          <div>
            <div style={{ fontSize: 10, fontWeight: 700, color: SM.textMuted, marginBottom: 8, letterSpacing: "0.08em" }}>PERFORMANCE — SCALABILITY — RELIABILITY</div>

            {/* Latency comparison */}
            <div style={{ background: SM.surface, border: `1px solid ${SM.border}`, borderRadius: 10, padding: 12, marginBottom: 12 }}>
              <div style={{ fontSize: 9, fontWeight: 700, color: SM.textMuted, marginBottom: 8 }}>LIVE LATENCY — before vs after (per subgraph)</div>
              <div style={{ marginBottom: 5, fontSize: 8, fontWeight: 700, color: SM.red, borderBottom: `1px solid ${SM.border}`, paddingBottom: 5, marginTop: 4 }}>BEFORE (monolith — sequential resolvers)</div>
              <LatencyMeter target={380} color={SM.red} label="All queries" />
              <div style={{ marginBottom: 5, marginTop: 10, fontSize: 8, fontWeight: 700, color: SM.green, borderBottom: `1px solid ${SM.border}`, paddingBottom: 5 }}>AFTER (federated — parallel, per-domain)</div>
              <LatencyMeter target={42}  color={SM.green}   label="surveys"   />
              <LatencyMeter target={28}  color={SM.blue}    label="users"     />
              <LatencyMeter target={68}  color={SM.teal}    label="responses" />
              <LatencyMeter target={210} color={SM.yellow}  label="analytics" />
              <div style={{ marginTop: 6, padding: "5px 8px", background: `${SM.green}10`, borderRadius: 5, fontSize: 8, color: SM.green, fontWeight: 700 }}>
                Survey page (surveys + users): max(42, 28)ms + routing = ~65ms vs 380ms. 83% improvement.
              </div>
            </div>

            {/* Cache strategy */}
            <div style={{ background: SM.surface, border: `1px solid ${SM.border}`, borderRadius: 10, padding: 12, marginBottom: 12 }}>
              <div style={{ fontSize: 9, fontWeight: 700, color: SM.textMuted, marginBottom: 6 }}>CACHE STRATEGY — Apollo Router + subgraph TTLs</div>
              <div style={{ display: "flex", gap: 5, marginBottom: 8 }}>
                <button onClick={() => setCacheEnabled(c => !c)} style={{ fontSize: 9, background: cacheEnabled ? `${SM.green}20` : `${SM.red}20`, color: cacheEnabled ? SM.green : SM.red, border: `1px solid ${cacheEnabled ? SM.green : SM.red}`, borderRadius: 5, padding: "4px 12px", cursor: "pointer" }}>
                  Cache: {cacheEnabled ? "ON" : "OFF"}
                </button>
              </div>
              {[
                { layer: "Apollo Router persisted queries",  ttl: "∞ (hash-based)", hit: 94, note: "Known queries served from cache. Unknown queries → rejected in prod" },
                { layer: "Survey type cache (@cacheControl)", ttl: "5min",           hit: cacheEnabled ? 78 : 0, note: "Survey metadata changes infrequently. Safe to cache at the router." },
                { layer: "User type cache (@cacheControl)",  ttl: "1min",           hit: cacheEnabled ? 62 : 0, note: "User plan/role can change. Short TTL." },
                { layer: "Response data — no cache",         ttl: "0 (no cache)",   hit: 0, note: "Response data: always fresh. Cache would show stale counts." },
              ].map((c, i) => (
                <div key={i} style={{ padding: "6px 8px", borderRadius: 5, marginBottom: 4, background: SM.surface2 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
                    <span style={{ fontSize: 8, fontWeight: 600, color: SM.textBright }}>{c.layer}</span>
                    <div style={{ display: "flex", gap: 5 }}>
                      <span style={{ fontSize: 7, color: SM.textMuted }}>TTL: {c.ttl}</span>
                      <span style={{ fontSize: 7, color: c.hit > 50 ? SM.green : SM.textMuted, fontWeight: 700 }}>{c.hit}% hit</span>
                    </div>
                  </div>
                  <div style={{ fontSize: 7, color: SM.textMuted }}>{c.note}</div>
                </div>
              ))}
            </div>

            {/* Reliability: partial responses */}
            <div style={{ background: SM.surface, border: `1px solid ${SM.border}`, borderRadius: 10, padding: 12 }}>
              <div style={{ fontSize: 9, fontWeight: 700, color: SM.textMuted, marginBottom: 6 }}>RELIABILITY — Partial responses (subgraph isolation)</div>
              <div style={{ fontSize: 8, color: SM.textMuted, marginBottom: 8, lineHeight: 1.5 }}>
                GraphQL partial responses: if one subgraph is unavailable, the response still returns data from healthy subgraphs. Billing subgraph down → survey creation still works.
              </div>
              <div style={{ background: "#010403", borderRadius: 7, padding: 10, fontFamily: SM.mono, fontSize: 8, color: "#4a7a5a" }}>
                <span style={{ color: SM.green }}>// Billing subgraph DOWN — partial response:</span>{"\n"}
                {`{
  "data": {
    "survey": {
      "id": "S-4821",
      "title": "Customer Feedback Q2",  `}
                <span style={{ color: SM.green }}>// ✓ from surveys subgraph</span>{"\n"}
                {`      "owner": { "name": "Maya Chen" }, `}
                <span style={{ color: SM.green }}>// ✓ from users subgraph</span>{"\n"}
                {`      "plan": null,                    `}
                <span style={{ color: SM.yellow }}>// ⚠ billing unavailable</span>{"\n"}
                {`    }
  },
  "errors": [{
    "message": "billing subgraph unavailable",
    "path": ["survey", "plan"],
    "extensions": { "code": "SUBGRAPH_UNAVAILABLE" }
  }]
}`}
              </div>
            </div>
          </div>

          <div>
            <div style={{ fontSize: 10, fontWeight: 700, color: SM.textMuted, marginBottom: 8, letterSpacing: "0.08em" }}>IMPLEMENTATION DEPTH</div>
            <CodeSnip color={SM.teal} label="Performance, scalability, reliability — the Staff Engineer view on all three" code={
`// PERFORMANCE: THE COMPOUND WIN OF FEDERATION
//
// Monolith problem: the billing resolver (complex SQL) blocks survey queries.
// They share a process. Slow billing = slow everything.
//
// Federation solution: subgraphs run in separate processes/containers.
// The Router: fetches surveys and users IN PARALLEL (Promise.all equivalent).
// Query: Survey { title owner { name } plan { name } }
//
// QUERY PLAN:
// Fetch:
//   surveys subgraph → Survey { title } (42ms)
//   users subgraph   → User  { name }  (28ms)   ← parallel with surveys
// Parallel completes: max(42, 28) = 42ms
// Then fetch (requires Survey.id and User.id from above):
//   billing subgraph → Plan { name } (180ms)  ← sequential (depends on above)
// Total: 42 + 180 + routing overhead = ~230ms
// vs monolith: 380ms (all sequential)
//
// SCALABILITY: INDEPENDENT SUBGRAPH SCALING
// During survey submission peaks (campaign launches):
// Response ingestion load: 10× normal.
// In the monolith: scale the entire server (89 types, most unrelated to responses).
// In federation: scale only the responses subgraph.
// 3 replicas normally → 30 replicas during peak → back to 3 when quiet.
// Survey creation: unaffected. Users: unaffected. Billing: unaffected.
//
// Implementation: each subgraph as a Kubernetes Deployment.
// HPA (Horizontal Pod Autoscaler): on CPU and custom metrics (query rate).
// The Router: stateless, scales independently.
// Subgraph autoscaling: isolated from other subgraphs.
//
// RELIABILITY: CIRCUIT BREAKERS + PARTIAL RESPONSES
//
// Circuit breaker at the Router level:
// If billing subgraph: 5 consecutive timeouts →  circuit opens.
// Subsequent requests: immediately return { plan: null, error: CIRCUIT_OPEN }.
// No waiting 30s for timeout. Fail fast.
// Circuit half-opens after 60s: test with one request. If OK: reclose.
//
// router.yaml configuration:
// traffic_shaping:
//   all:
//     global:
//       timeout: 30s
//   subgraph:
//     billing:
//       request_timeout: 5s         # much shorter for billing
//       connect_timeout: 500ms
// # Apollo Router: built-in circuit breaker via health checks.
//
// OBSERVABILITY — the prerequisite for reliability:
// Without observability: you don't know which subgraph is slow.
// With the monolith: one set of traces. Hard to attribute latency.
// With Federation: per-subgraph traces in DataDog via OpenTelemetry.
//
// router.yaml:
// telemetry:
//   tracing:
//     propagation:
//       jaeger: true
//     exporters:
//       otlp:
//         endpoint: "https://datadog-agent:4317"
//         protocol: grpc
//   metrics:
//     prometheus:
//       enabled: true
// # Each subgraph: automatic span for each resolver.
// # DataDog: service map shows Router → surveys → users → billing.
// # P99 per subgraph. Error rate per subgraph. Easy to isolate.
//
// @CACHEHINT DIRECTIVE STRATEGY:
// Not all types should be cached. The strategy:
//
// type Survey @cacheControl(maxAge: 300) {   # 5 minutes
//   id: ID!
//   title: String!
//   status: SurveyStatus!
// }
// # Survey metadata: 5 min cache. Fine — surveys don't change mid-session.
//
// type SurveyResponse @cacheControl(maxAge: 0, scope: PRIVATE) {  # no cache
//   id: ID!
//   answers: [Answer!]!
// }
// # Response data: no cache. Every request: fresh from DB.
// # Also: PRIVATE scope — user-specific, must not be shared across users.
//
// # The Router: respects these hints at the CDN/response-cache level.
// # Result: 78% cache hit rate on survey metadata queries.
// #         From: 42ms average → 4ms on cache hit.
//
// LATENCY BUDGETS (Staff Engineer accountability):
// Set latency SLOs per subgraph:
// surveys:   P95 < 80ms, P99 < 150ms
// users:     P95 < 50ms, P99 < 100ms
// responses: P95 < 120ms, P99 < 250ms
// analytics: P95 < 300ms, P99 < 600ms  ← complex aggregation
// billing:   P95 < 100ms, P99 < 200ms
//
// PagerDuty alert: if P99 exceeds budget for 5 minutes → on-call for that subgraph's team.
// The billing team: on call for billing. Not the platform team.
// "Distributed responsibility. Distributed accountability."`} />
          </div>
        </div>
      )}

      {/* ── CROSS-FUNCTIONAL ── */}
      {tab === "xfn" && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
          <div>
            <div style={{ fontSize: 10, fontWeight: 700, color: SM.textMuted, marginBottom: 8, letterSpacing: "0.08em" }}>CROSS-FUNCTIONAL LEADERSHIP</div>

            {/* RFC process */}
            <div style={{ background: SM.surface, border: `1px solid ${SM.border}`, borderRadius: 10, padding: 12, marginBottom: 12 }}>
              <div style={{ fontSize: 9, fontWeight: 700, color: SM.textMuted, marginBottom: 6 }}>RFC PROCESS — alignment before execution</div>
              <div style={{ fontSize: 8, color: SM.textMuted, marginBottom: 8 }}>12 teams affected. RFC = Request for Comments. Staff engineer's most important leverage.</div>
              {RFC_STEPS.map((step, i) => (
                <div key={i} onClick={() => setRfcStep(i)} style={{ display: "flex", gap: 8, alignItems: "center", padding: "5px 8px", borderRadius: 5, marginBottom: 3, cursor: "pointer", borderLeft: `2px solid ${rfcStep >= i ? SM.green : SM.border}`, background: rfcStep === i ? `${SM.green}08` : "transparent" }}>
                  <span style={{ fontSize: 9, fontWeight: 700, color: rfcStep >= i ? SM.green : SM.textMuted, flexShrink: 0 }}>{i + 1}</span>
                  <span style={{ fontSize: 8, color: rfcStep >= i ? SM.text : SM.textMuted }}>{step}</span>
                </div>
              ))}
            </div>

            {/* Schema governance */}
            <div style={{ background: SM.surface, border: `1px solid ${SM.border}`, borderRadius: 10, padding: 12, marginBottom: 12 }}>
              <div style={{ fontSize: 9, fontWeight: 700, color: SM.textMuted, marginBottom: 6 }}>SCHEMA GOVERNANCE — 5 rules, 12 teams</div>
              {GOVERNANCE.map((g, i) => (
                <div key={i} onClick={() => setGovRule(govRule === i ? null : i)} style={{ padding: "7px 8px", borderRadius: 7, marginBottom: 4, cursor: "pointer", background: govRule === i ? `${SM.green}08` : SM.surface2, border: `1px solid ${govRule === i ? SM.green + "40" : SM.border}` }}>
                  <div style={{ fontSize: 8.5, fontWeight: 700, color: SM.textBright }}>📜 {g.rule}</div>
                  {govRule === i && <div style={{ marginTop: 5, fontSize: 8, color: SM.textMuted, lineHeight: 1.5 }}>{g.detail}</div>}
                </div>
              ))}
            </div>

            {/* Team progress */}
            <div style={{ background: SM.surface, border: `1px solid ${SM.border}`, borderRadius: 10, padding: 12 }}>
              <div style={{ fontSize: 9, fontWeight: 700, color: SM.textMuted, marginBottom: 6 }}>TEAM MIGRATION PROGRESS</div>
              {TEAM_PROGRESS.map((t, i) => (
                <div key={i} onClick={() => setTeamExpanded(teamExpanded === t.team ? null : t.team)} style={{ padding: "7px 8px", borderRadius: 7, marginBottom: 4, cursor: "pointer", background: teamExpanded === t.team ? `${t.color}08` : SM.surface2, border: `1px solid ${teamExpanded === t.team ? t.color + "40" : SM.border}` }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontSize: 9, fontWeight: 700, color: SM.textBright }}>{t.team}</span>
                    <span style={{ fontSize: 7, background: `${t.color}20`, color: t.color, borderRadius: 3, padding: "1px 7px", fontWeight: 700 }}>{t.status}</span>
                  </div>
                  {teamExpanded === t.team && <div style={{ marginTop: 5, fontSize: 8, color: SM.textMuted, lineHeight: 1.5 }}>{t.detail}</div>}
                </div>
              ))}
            </div>
          </div>

          <div>
            <div style={{ fontSize: 10, fontWeight: 700, color: SM.textMuted, marginBottom: 8, letterSpacing: "0.08em" }}>IMPLEMENTATION DEPTH</div>
            <CodeSnip color={SM.yellow} label="Staff Engineer cross-functional leadership — the real job beyond the code" code={
`// THE STAFF ENGINEER'S ACTUAL JOB:
// "Writing the best federation code in the building" is table stakes.
// The real job: making it possible for 12 teams to succeed.
//
// WHAT CROSS-FUNCTIONAL ACTUALLY LOOKS LIKE:
//
// WORKING WITH PRODUCT TEAMS:
// Product engineers: want to ship features. Not learn Apollo Federation.
// Their job: add a field to the survey response.
// My job: make that as easy as adding a field to a REST endpoint was.
//
// What this means in practice:
// 1. Great documentation (the "Federation for Product Engineers" guide)
// 2. Code generators (smk-fed extract)
// 3. Office hours: weekly 45-min drop-in session. I answer federation questions.
// 4. PR review: I review all new subgraph PRs with a coaching mindset
//    (not "this is wrong" but "here's why and here's the better pattern")
//
// THE KEY INSIGHT: Most engineers don't need to understand Apollo Federation.
// They need to understand: "add this @cacheControl directive" and "use the
// DataLoader instead of calling the DB in a loop."
// The tools and templates: encode the correct patterns.
// Engineers: follow the templates. Patterns: correct by construction.
//
// WORKING WITH INFRASTRUCTURE TEAMS:
// Subgraph deployment: each team needs their own CI/CD pipeline.
// Infra team owns Kubernetes, Terraform, GitHub Actions templates.
// Without infra partnership: each team would build their own pipeline.
// 12 teams × 2 days = 24 person-days of duplicated work. Differently wrong.
//
// What we built together:
// - Standard subgraph GitHub Actions workflow template
// - Kubernetes Deployment + HPA template for subgraphs
// - Monitoring dashboard template (DataDog)
// - Health check endpoint standard (/health returns subgraph name + version)
// "Any new team extracting a subgraph: clone the template.
//  Change 3 variables (subgraph name, team, port). Done."
//
// WORKING WITH SECURITY:
// Federation changes the auth model.
// Monolith: one server, JWT validated once at the entry point.
// Federation: JWT goes through Router → Router forwards to subgraphs.
// Question: do subgraphs re-validate JWT? Trust the Router?
//
// Architecture decision (with security team):
// Apollo Router: validates JWT. Strips signature.
// Forwards: { "x-user-id": "U-123", "x-user-roles": ["admin"] } headers to subgraphs.
// Subgraphs: trust these headers (only Router can set them — internal network).
// Field-level authorization: @requiresRole directive (custom Apollo directive).
//
// type Plan @requiresRole(role: ADMIN) {  # only admins can query billing plans
//   id: ID!
//   price: Float!
// }
//
// WORKING WITH MOBILE TEAMS:
// Mobile clients: hardcoded GraphQL operation strings.
// Migration risk: mobile app version N uses Survey.status.
//              Survey team renames to Survey.surveyState.
//              Mobile app N: breaks.
//              Mobile app N+1: updated. But N is still in production.
//
// Solution: breaking change deprecation workflow.
// 1. Staff eng detects Survey.status usage by mobile (smk-fed usage analyze).
// 2. Mobile team: notified before ANY change to Survey.status.
// 3. Mobile team: ships updated app with Survey.surveyState support.
// 4. Old Survey.status: kept for 90 days (mobile release cycle).
// 5. After 90 days: usage metrics show 0. Field removed.
// "No mobile client breaks without consent. Ever.
//  The tooling makes it impossible to break clients accidentally."
//
// THE RFC OUTCOME:
// First RFC for Federation migration: 9-step process (problem, solution,
// alternatives, migration strategy, risk assessment).
// Feedback period: 2 weeks. 47 comments from 12 teams.
// Revised RFC: addressed 8 of 12 concerns. 4 required re-design.
// The re-design: better. Teams that pushed back were right.
// "The RFC process catches design mistakes before they're implemented.
//  It's the most leveraged document I write. Better RFC = less rework."
//
// ON BEING A STAFF ENGINEER (vs senior engineer):
// Senior: solves the technical problem.
// Staff: solves the organizational problem that prevents the technical solution.
// "The monolith → federation migration is 10% technical problem.
//  90% getting 12 teams to agree, learn new things, change their workflow,
//  and trust that the platform team won't leave them stranded."
// That 90% is the job.`} />
          </div>
        </div>
      )}
    </div>
  );
}

export default SurveyMonkeyFederationDemo;
