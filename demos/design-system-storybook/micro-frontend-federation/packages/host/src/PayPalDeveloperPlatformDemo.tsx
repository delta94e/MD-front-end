/**
 * PayPalDeveloperPlatformDemo.tsx
 *
 * PayPal — Senior/Staff Full-Stack Engineer
 * GraphQL DX · JS@PayPal Conference · Partner Onboarding · Leadership & Mentorship
 *
 * TABS
 *   ⚡ GraphQL DX          — Schema stitching, before/after, DataLoader, Apollo Federation
 *   🎤 JS @ PayPal         — Conference: 3,000 attendees, 10 organizers, roadblock stories
 *   🤝 Partner Onboarding  — Full-stack flow: React form → Node.js → Java microservices
 *   🌟 Leadership          — Awards, promotions, mentorship programme, DEI impact
 */

import React, { useState, useEffect, useRef, useCallback } from "react";

// ─────────────────────────────────────────────────────────────────
// Design tokens — PayPal
// ─────────────────────────────────────────────────────────────────
const P = {
  bg:         "#080e1c",
  surface:    "#0d1628",
  surface2:   "#132035",
  surface3:   "#1a2d4a",
  border:     "#1e3557",
  blue:       "#0070ba",
  blueLight:  "#009cde",
  blueDark:   "#003087",
  gold:       "#f5a623",
  goldLight:  "#ffc240",
  green:      "#1ac567",
  red:        "#d64f23",
  purple:     "#7b3fe4",
  text:       "#94afc8",
  textBright: "#e8f0f8",
  textMuted:  "#3d5a7a",
  mono:       "'JetBrains Mono', monospace",
};

// ─────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────

interface GqlField { name: string; type: string; selected: boolean; }
interface PartnerStep { id: string; label: string; status: "done" | "active" | "pending" | "error"; detail: string; }
interface OrgRole { name: string; owner: string; status: "done" | "active" | "pending"; detail: string; }
interface MenteeCard { name: string; level: string; achievement: string; domain: string; color: string; }

// ─────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────

function CodeSnip({ code, label, color = P.blueLight }: { code: string; label?: string; color?: string }) {
  return (
    <div style={{ background: "#040810", border: `1px solid ${P.border}`, borderRadius: 6, overflow: "hidden" }}>
      {label && <div style={{ padding: "4px 12px", borderBottom: `1px solid ${P.border}`, fontSize: 9, color, fontFamily: P.mono }}>{label}</div>}
      <pre style={{ margin: 0, padding: 12, fontSize: 8.5, fontFamily: P.mono, color: "#6a8fad", lineHeight: 1.7, overflow: "auto", maxHeight: 360, whiteSpace: "pre-wrap" }}>{code}</pre>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
// Live query latency comparison
// ─────────────────────────────────────────────────────────────────

function LatencyBar({ label, ms, max, color }: { label: string; ms: number; max: number; color: string }) {
  return (
    <div style={{ marginBottom: 6 }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 2 }}>
        <span style={{ fontSize: 8, color: P.text }}>{label}</span>
        <span style={{ fontSize: 8, fontFamily: P.mono, color, fontWeight: 700 }}>{ms}ms</span>
      </div>
      <div style={{ background: P.surface2, borderRadius: 3, height: 10, overflow: "hidden" }}>
        <div style={{ width: `${(ms / max) * 100}%`, height: "100%", background: color, borderRadius: 3, transition: "width 0.6s ease" }} />
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
// Main component
// ─────────────────────────────────────────────────────────────────

export function PayPalDeveloperPlatformDemo() {
  const [tab, setTab] = useState<"graphql" | "conf" | "onboarding" | "lead">("graphql");

  // GraphQL state
  const [queryMode, setQueryMode] = useState<"rest" | "graphql">("rest");
  const [fields, setFields] = useState<GqlField[]>([
    { name: "user { id name email }", type: "User", selected: true },
    { name: "balance { available currency }", type: "Balance", selected: true },
    { name: "transactions(first:5) { id amount status }", type: "Transaction[]", selected: false },
    { name: "subscriptions { plan status nextBilling }", type: "Subscription[]", selected: false },
    { name: "limits { daily monthly }", type: "Limits", selected: false },
  ]);
  const [queryRunning, setQueryRunning] = useState(false);
  const [queryResult, setQueryResult] = useState<string | null>(null);
  const [fedStep, setFedStep] = useState(-1);

  // Conference state
  const [confPhase, setConfPhase] = useState<"pre" | "event" | "post">("pre");
  const [roadblockShown, setRoadblockShown] = useState<number | null>(null);
  const [confStep, setConfStep] = useState(-1);

  // Onboarding state
  const [partnerSteps, setPartnerSteps] = useState<PartnerStep[]>([
    { id: "s1", label: "Business Verification",   status: "done",    detail: "EIN validated · Entity type confirmed · State registration checked" },
    { id: "s2", label: "KYC Identity Check",      status: "done",    detail: "Beneficial owner verified · AML screening passed · Risk score: LOW" },
    { id: "s3", label: "Agreement Signing",        status: "active",  detail: "PayPal Partner Agreement sent → awaiting e-signature (DocuSign)" },
    { id: "s4", label: "API Credential Provision", status: "pending", detail: "Client ID + Secret issued after agreement signed" },
    { id: "s5", label: "Sandbox Integration Test", status: "pending", detail: "Partner runs integration tests against PayPal sandbox environment" },
    { id: "s6", label: "Compliance Review",        status: "pending", detail: "Final AML/fraud risk review before production access" },
    { id: "s7", label: "Go-Live",                  status: "pending", detail: "Production credentials issued · Partner live on PayPal platform" },
  ]);
  const [onboardingBefore, setOnboardingBefore] = useState(true);

  const advancePartner = () => {
    setPartnerSteps(steps => {
      const activeIdx = steps.findIndex(s => s.status === "active");
      if (activeIdx === -1 || activeIdx === steps.length - 1) return steps;
      return steps.map((s, i) => {
        if (i === activeIdx)     return { ...s, status: "done" };
        if (i === activeIdx + 1) return { ...s, status: "active" };
        return s;
      });
    });
  };

  // Lead state
  const [awardShown, setAwardShown] = useState<number | null>(null);
  const [menteeShown, setMenteeShown] = useState<number | null>(null);

  const MENTEES: MenteeCard[] = [
    { name: "Sarah L.",   level: "Mid → Senior", achievement: "First conference talk at JSConf",     domain: "React performance",     color: P.purple  },
    { name: "Priya K.",   level: "Junior → Mid", achievement: "Published open-source GraphQL tool", domain: "GraphQL / Node.js",     color: P.blue    },
    { name: "Wei T.",     level: "Senior → Lead", achievement: "Promoted to Tech Lead",              domain: "Full-stack architecture", color: P.gold  },
    { name: "Maria G.",   level: "Mid → Senior", achievement: "Accepted to OSCON speakers roster",  domain: "Developer tooling",     color: P.green   },
  ];

  const AWARDS = [
    { name: "PayPal Innovation Award",       year: "Q3", reason: "GraphQL developer platform architecture: reduced API latency 60% across developer domain" },
    { name: "Customer Champion Award",       year: "Q1", reason: "Partner onboarding app: reduced onboarding time from 3 weeks to 4 days" },
    { name: "Community Builder Recognition", year: "Q4", reason: "Launched JS@PayPal conference · 3,000 attendees · PayPal's first public developer conference" },
    { name: "Engineering Excellence Award",  year: "Q2", reason: "Technical mentorship programme: 4 women engineers promoted or gave first conference talks" },
  ];

  const CONF_ROADBLOCKS = [
    { issue: "Venue cancellation (6 weeks before)", resolution: "Pivoted to secondary venue option held in reserve from the start. Always have a backup." },
    { issue: "Keynote speaker withdrew (2 weeks before)", resolution: "Tapped our speaker network — promoted a strong internal PayPal engineer to keynote slot. Revealed their story was more compelling." },
    { issue: "Registration system crashed on launch day (sold 1,400 tickets in 1 hour)", resolution: "Rolled back to manual waitlist flow. Coordinated with IT to scale infrastructure. Full system back in 90 minutes." },
    { issue: "Legal approval delayed (PayPal's first public event)", resolution: "Engaged legal 4 months earlier than standard. Created a risk acceptance document. Got SVP sign-off to unblock." },
  ];

  const ORG_ROLES: OrgRole[] = [
    { name: "Programme",     owner: "Me (Lead)",     status: "done",    detail: "Speaker CFP, selection, schedule, tracks" },
    { name: "Venue & Logistics", owner: "Organizer 2", status: "done",    detail: "Venue, catering, AV, production" },
    { name: "Sponsors",      owner: "Organizer 3",   status: "done",    detail: "Sponsorship packages, 12 sponsors" },
    { name: "Website",       owner: "Organizer 4",   status: "done",    detail: "React site, CFP portal, registration" },
    { name: "Volunteers",    owner: "Organizer 5",   status: "done",    detail: "60 volunteers recruited and trained" },
    { name: "Social & PR",   owner: "Organizer 6",   status: "done",    detail: "Twitter, LinkedIn, press coverage" },
    { name: "Registration",  owner: "Organizer 7",   status: "done",    detail: "Ticketing, check-in system, badges" },
    { name: "Speakers",      owner: "Organizer 8",   status: "done",    detail: "Travel, hotel, green room, coaching" },
    { name: "Workshops",     owner: "Organizer 9",   status: "done",    detail: "4 half-day workshops, 200 seats each" },
    { name: "Diversity",     owner: "Organizer 10",  status: "done",    detail: "Travel grants, scholarship tickets, CoC" },
  ];

  const REST_CALLS = [
    { endpoint: "GET /v1/identity/users/{id}",              ms: 180, service: "Identity Service"     },
    { endpoint: "GET /v1/payments/balance",                 ms: 140, service: "Payments Service"    },
    { endpoint: "GET /v1/reporting/transactions?page=1",    ms: 320, service: "Reporting Service"   },
    { endpoint: "GET /v1/billing/subscriptions",            ms: 210, service: "Billing Service"     },
    { endpoint: "GET /v1/risk/limits/{id}",                 ms: 155, service: "Risk Service"        },
  ];

  const gqlMs = Math.max(...REST_CALLS.filter((_, i) => fields[i]?.selected).map(r => r.ms)) + 15;
  const restMs = REST_CALLS.filter((_, i) => fields[i]?.selected).reduce((a, r) => a + r.ms, 0);

  const runQuery = () => {
    setQueryRunning(true);
    setQueryResult(null);
    setTimeout(() => {
      setQueryRunning(false);
      setQueryResult(JSON.stringify({
        data: {
          user:      fields[0].selected ? { id: "U-4821", name: "Merchant Corp", email: "api@merchant.io" } : undefined,
          balance:   fields[1].selected ? { available: "14,302.50", currency: "USD" } : undefined,
          transactions: fields[2].selected ? [{ id: "TXN-001", amount: "250.00", status: "COMPLETED" }] : undefined,
          subscriptions: fields[3].selected ? [{ plan: "Business Pro", status: "ACTIVE" }] : undefined,
          limits:    fields[4].selected ? { daily: "10000.00", monthly: "50000.00" } : undefined,
        }
      }, null, 2));
    }, queryMode === "graphql" ? gqlMs : restMs);
  };

  const FED_STEPS = [
    { label: "Developer sends GraphQL query",          icon: "💻", detail: "Apollo Client: `const { data } = useQuery(DASHBOARD_QUERY)` — one request" },
    { label: "Apollo Gateway receives query",          icon: "🌐", detail: "Apollo Federation gateway: parses query, plans execution across subgraphs" },
    { label: "Query planning across subgraphs",        icon: "📋", detail: "Which subgraph owns each field? Identity? Payments? Risk? Gateway resolves ownership" },
    { label: "Parallel subgraph requests",             icon: "⚡", detail: "Gateway fires requests to all subgraphs in parallel (Promise.all)" },
    { label: "Response merged + returned",             icon: "✅", detail: "Gateway merges responses into one GraphQL result. Developer gets exactly the shape they asked for" },
  ];

  const TABS = [
    { id: "graphql"    as const, label: "⚡ GraphQL DX"        },
    { id: "conf"       as const, label: "🎤 JS @ PayPal"       },
    { id: "onboarding" as const, label: "🤝 Partner Onboarding" },
    { id: "lead"       as const, label: "🌟 Leadership"         },
  ];

  return (
    <div style={{ background: P.bg, color: P.text, fontFamily: "'Inter', system-ui, sans-serif", minHeight: "100vh", padding: 24 }}>

      {/* Header */}
      <div style={{ marginBottom: 18 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
          <div style={{ width: 42, height: 42, borderRadius: 10, background: `linear-gradient(135deg, ${P.blue}, ${P.blueLight})`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22 }}>💙</div>
          <div>
            <h1 style={{ margin: 0, fontSize: 20, fontWeight: 900, color: P.textBright, letterSpacing: "-0.02em" }}>PayPal — Senior Full-Stack Engineer · Developer Platform</h1>
            <p style={{ margin: 0, fontSize: 11, color: P.textMuted }}>GraphQL DX · JS@PayPal Conference · Partner Onboarding · Mentorship · ReactJS · Redux · Node.js · Java</p>
          </div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8 }}>
          {[
            { v: "GraphQL",  l: "Developer platform DX",  c: P.blueLight, sub: "Schema stitching · Apollo Federation · 60% latency ↓" },
            { v: "3,000",    l: "JS@PayPal attendees",     c: P.gold,      sub: "PayPal's 1st public conference · 10 organizers · 2 tracks" },
            { v: "4 days",   l: "Partner onboarding",      c: P.green,     sub: "Down from 3 weeks · full-stack Node.js/React/Java app" },
            { v: "Awards",   l: "Excellence & leadership", c: P.purple,    sub: "4 awards · promotions · VP recognition · DEI mentoring" },
          ].map(m => (
            <div key={m.l} style={{ background: P.surface, border: `1px solid ${P.border}`, borderLeft: `3px solid ${m.c}`, borderRadius: 8, padding: "8px 12px" }}>
              <div style={{ fontSize: 13, fontWeight: 900, color: m.c }}>{m.v}</div>
              <div style={{ fontSize: 8, fontWeight: 700, color: P.textBright }}>{m.l}</div>
              <div style={{ fontSize: 7, color: P.textMuted, marginTop: 2 }}>{m.sub}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Tab bar */}
      <div style={{ display: "flex", gap: 4, marginBottom: 18, borderBottom: `1px solid ${P.border}`, paddingBottom: 4 }}>
        {TABS.map(tb => (
          <button key={tb.id} onClick={() => setTab(tb.id)} style={{ background: tab === tb.id ? P.surface2 : "transparent", color: tab === tb.id ? P.textBright : P.textMuted, border: tab === tb.id ? `1px solid ${P.border}` : "1px solid transparent", borderRadius: "8px 8px 0 0", padding: "8px 20px", cursor: "pointer", fontSize: 11, fontWeight: 600 }}>{tb.label}</button>
        ))}
      </div>

      {/* ── GRAPHQL DX ── */}
      {tab === "graphql" && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
          <div>
            <div style={{ fontSize: 10, fontWeight: 700, color: P.textMuted, marginBottom: 8, letterSpacing: "0.08em" }}>GRAPHQL DEVELOPER PLATFORM — BEFORE/AFTER</div>

            {/* Mode toggle */}
            <div style={{ display: "flex", gap: 5, marginBottom: 10 }}>
              <button onClick={() => setQueryMode("rest")} style={{ flex: 1, fontSize: 9, background: queryMode === "rest" ? `${P.red}20` : "transparent", color: queryMode === "rest" ? P.red : P.textMuted, border: `1px solid ${queryMode === "rest" ? P.red : P.border}`, borderRadius: 5, padding: "6px 0", cursor: "pointer", fontWeight: queryMode === "rest" ? 700 : 400 }}>❌ Before: {REST_CALLS.filter((_, i) => fields[i]?.selected).length} REST calls</button>
              <button onClick={() => setQueryMode("graphql")} style={{ flex: 1, fontSize: 9, background: queryMode === "graphql" ? `${P.green}20` : "transparent", color: queryMode === "graphql" ? P.green : P.textMuted, border: `1px solid ${queryMode === "graphql" ? P.green : P.border}`, borderRadius: 5, padding: "6px 0", cursor: "pointer", fontWeight: queryMode === "graphql" ? 700 : 400 }}>✓ After: 1 GraphQL query</button>
            </div>

            {/* Field selector */}
            <div style={{ background: P.surface, border: `1px solid ${P.border}`, borderRadius: 10, padding: 12, marginBottom: 10 }}>
              <div style={{ fontSize: 8, fontWeight: 700, color: P.textMuted, marginBottom: 6 }}>SELECT FIELDS — see how the query/latency changes</div>
              {fields.map((f, i) => (
                <div key={f.name} onClick={() => setFields(fs => fs.map((ff, j) => j === i ? { ...ff, selected: !ff.selected } : ff))} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "5px 8px", borderRadius: 5, marginBottom: 3, cursor: "pointer", background: f.selected ? `${P.blueLight}12` : "transparent", border: `1px solid ${f.selected ? P.blueLight + "30" : "transparent"}` }}>
                  <div style={{ display: "flex", gap: 7, alignItems: "center" }}>
                    <span style={{ fontSize: 10 }}>{f.selected ? "☑" : "☐"}</span>
                    <span style={{ fontSize: 8, fontFamily: P.mono, color: f.selected ? P.blueLight : P.textMuted }}>{f.name}</span>
                  </div>
                  <span style={{ fontSize: 7, color: P.textMuted }}>{REST_CALLS[i].ms}ms ({REST_CALLS[i].service})</span>
                </div>
              ))}
            </div>

            {/* Latency comparison */}
            <div style={{ background: P.surface, border: `1px solid ${P.border}`, borderRadius: 10, padding: 12, marginBottom: 10 }}>
              <div style={{ fontSize: 8, fontWeight: 700, color: P.textMuted, marginBottom: 8 }}>LATENCY COMPARISON</div>
              {queryMode === "rest" ? (
                <div>
                  {REST_CALLS.filter((_, i) => fields[i]?.selected).map((r, i) => (
                    <LatencyBar key={r.endpoint} label={r.endpoint.split("?")[0].slice(-30)} ms={r.ms} max={1200} color={P.red} />
                  ))}
                  <div style={{ marginTop: 6, padding: "5px 8px", background: `${P.red}10`, borderRadius: 5, fontSize: 8, color: P.red, fontWeight: 700 }}>Sequential total: {restMs}ms (each waits for the previous)</div>
                </div>
              ) : (
                <div>
                  <LatencyBar label="1× GraphQL query (parallel resolvers)" ms={gqlMs} max={1200} color={P.green} />
                  <div style={{ marginTop: 6, padding: "5px 8px", background: `${P.green}10`, borderRadius: 5, fontSize: 8, color: P.green, fontWeight: 700 }}>Parallel: max({REST_CALLS.filter((_, i) => fields[i]?.selected).map(r => r.ms).join(", ")}) + 15ms overhead = {gqlMs}ms · {Math.round((1 - gqlMs / restMs) * 100)}% faster</div>
                </div>
              )}
            </div>

            {/* Run button + result */}
            <button onClick={runQuery} style={{ width: "100%", background: `linear-gradient(135deg, ${P.blue}, ${P.blueLight})`, border: "none", borderRadius: 7, padding: "10px 0", color: "#fff", fontSize: 10, fontWeight: 700, cursor: "pointer", marginBottom: 8 }}>
              {queryRunning ? "⟳ Running…" : `▶ Run ${queryMode === "graphql" ? "GraphQL" : "REST"} query`}
            </button>
            {queryResult && (
              <div style={{ background: P.surface, border: `1px solid ${P.border}`, borderRadius: 8, padding: 10, fontSize: 8, fontFamily: P.mono, color: "#6a8fad", maxHeight: 130, overflow: "auto", whiteSpace: "pre-wrap" }}>{queryResult}</div>
            )}

            {/* Apollo Federation steps */}
            <div style={{ background: P.surface, border: `1px solid ${P.border}`, borderRadius: 10, padding: 12, marginTop: 10 }}>
              <div style={{ fontSize: 8, fontWeight: 700, color: P.textMuted, marginBottom: 6 }}>APOLLO FEDERATION FLOW — click to walk through</div>
              {FED_STEPS.map((s, i) => (
                <div key={i} onClick={() => setFedStep(i)} style={{ display: "flex", gap: 8, alignItems: "flex-start", padding: "5px 8px", borderRadius: 6, marginBottom: 3, cursor: "pointer", borderLeft: `2px solid ${fedStep >= i ? P.blueLight : P.border}`, background: fedStep === i ? `${P.blueLight}08` : "transparent" }}>
                  <span style={{ fontSize: 12, flexShrink: 0 }}>{s.icon}</span>
                  <div>
                    <div style={{ fontSize: 8.5, fontWeight: 600, color: fedStep >= i ? P.textBright : P.textMuted }}>{s.label}</div>
                    {fedStep === i && <div style={{ fontSize: 8, color: P.blueLight, marginTop: 2 }}>{s.detail}</div>}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <div style={{ fontSize: 10, fontWeight: 700, color: P.textMuted, marginBottom: 8, letterSpacing: "0.08em" }}>IMPLEMENTATION DEPTH</div>
            <CodeSnip color={P.blueLight} label="GraphQL developer platform — full architecture, DataLoader, Federation, DX wins" code={
`// CONTEXT: PAYPAL'S DEVELOPER DOMAIN:
// PayPal has a public developer portal (developer.paypal.com).
// External developers: get API credentials, manage apps, view transactions,
// read docs, test in sandbox, handle compliance.
//
// THE PROBLEM BEFORE GRAPHQL:
// Each page on the developer portal called 5-8 separate REST APIs.
// These APIs: 5 different Java microservices, maintained by different teams.
// Sequential calls: each awaited the previous → page load: 800-1200ms.
// Over-fetching: REST returns full objects, UI needs 3 fields.
// Under-fetching: had to make additional calls to get related data.
// "The developer portal was the slowest surface of PayPal.
//  The people most likely to evaluate our API had the worst experience."
//
// THE SOLUTION: APOLLO FEDERATION + NODE.JS BFF LAYER:
//
// ARCHITECTURE:
// Developer Browser
//   → Apollo Client (React)
//   → Apollo Gateway (Node.js) ← federation gateway
//   → [Identity Subgraph][Payments Subgraph][Risk Subgraph][Billing Subgraph]
//   → Java microservices (existing PayPal backend)
//
// WHY FEDERATION (not schema stitching):
// Schema stitching: one big schema, monolithic gateway.
// Federation: each team owns their subgraph.
// Identity team: owns @key(fields: "id") on User type.
// Payments team: extends User type with { balance, transactions }.
// Teams work independently. Gateway: queries them as one coherent schema.
//
// SUBGRAPH EXAMPLE (Identity Subgraph):
// type User @key(fields: "id") {
//   id:    ID!
//   email: String!
//   name:  String!
//   tier:  AccountTier!
// }
//
// type Query {
//   me: User
// }
//
// // Resolver (Node.js calling PayPal Java Identity API):
// const resolvers = {
//   Query: {
//     me: async (_, __, { token }) => {
//       const identity = await identityService.getUser(token);
//       return { id: identity.accountId, email: identity.email, name: identity.fullName };
//     },
//   },
//   User: {
//     __resolveReference: async ({ id }) => identityService.getUserById(id),
//   },
// };
//
// PAYMENTS SUBGRAPH EXTENSION:
// extend type User @key(fields: "id") {
//   id:           ID! @external
//   balance:      Balance
//   transactions: [Transaction!]!
//   limits:       AccountLimits
// }
//
// THE DATALOADER PATTERN (critical for N+1):
// A developer portal page shows a list of 20 sandbox apps.
// Each app: needs the owner's profile (from Identity service).
// Naive: 20 separate identity API calls.
// DataLoader: batches all 20 into one call → one identity service request.
//
// const userLoader = new DataLoader(async (userIds: readonly string[]) => {
//   // ONE batch call to Identity service:
//   const users = await identityService.getUsersByIds(userIds);
//   return userIds.map(id => users.find(u => u.id === id));
// });
//
// DX IMPROVEMENTS DELIVERED:
// ✓ Query exactly the fields you need: no over-fetching
// ✓ Self-documenting: GraphQL introspection → GraphiQL playground in portal
// ✓ Type safety: schema = shared contract between frontend/backend teams
// ✓ Latency: sequential REST (800-1200ms) → parallel GraphQL (180-340ms)
// ✓ Developer happiness: portal NPS improved from 42 to 71 (from annual survey)
//
// SPECIFIC WINS:
// Developer Dashboard page: was 7 REST calls, avg 1,100ms.
// After: 1 GraphQL query, avg 280ms. Improvement: 75%.
// "The developer portal went from the slowest PayPal surface
//  to the fastest. That changed how developers perceived our API quality."`} />
          </div>
        </div>
      )}

      {/* ── JS @ PAYPAL ── */}
      {tab === "conf" && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
          <div>
            <div style={{ fontSize: 10, fontWeight: 700, color: P.textMuted, marginBottom: 8, letterSpacing: "0.08em" }}>JS @ PAYPAL — 3,000 ATTENDEES · 10 ORGANIZERS</div>

            {/* Stats */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 6, marginBottom: 12 }}>
              {[
                { v: "3,000", l: "Attendees",   c: P.gold      },
                { v: "45+",   l: "Speakers",    c: P.blueLight },
                { v: "10",    l: "Organizers",  c: P.purple    },
                { v: "2",     l: "Main tracks", c: P.green     },
              ].map(s => (
                <div key={s.l} style={{ background: P.surface, border: `1px solid ${P.border}`, borderRadius: 8, padding: "8px 10px", textAlign: "center" }}>
                  <div style={{ fontSize: 18, fontWeight: 900, color: s.c }}>{s.v}</div>
                  <div style={{ fontSize: 8, color: P.textMuted }}>{s.l}</div>
                </div>
              ))}
            </div>

            {/* Timeline phase */}
            <div style={{ display: "flex", gap: 4, marginBottom: 10 }}>
              {(["pre", "event", "post"] as const).map(ph => (
                <button key={ph} onClick={() => setConfPhase(ph)} style={{ flex: 1, fontSize: 9, background: confPhase === ph ? `${P.gold}20` : "transparent", color: confPhase === ph ? P.gold : P.textMuted, border: `1px solid ${confPhase === ph ? P.gold : P.border}`, borderRadius: 5, padding: "5px 0", cursor: "pointer" }}>
                  {ph === "pre" ? "📋 Pre-Event" : ph === "event" ? "🎤 Event Day" : "✅ Post-Event"}
                </button>
              ))}
            </div>

            <div style={{ background: P.surface, border: `1px solid ${P.border}`, borderRadius: 10, padding: 10, marginBottom: 10 }}>
              {confPhase === "pre" && [
                "Month -8: Venue secured (convention center, 3,500 capacity)",
                "Month -7: CFP opens — 180 submissions received",
                "Month -6: 45 speakers selected · travel/hotel coordinated",
                "Month -5: 12 sponsors signed · sponsorship portal built",
                "Month -4: Website + registration live (React app, 2,200 early tickets)",
                "Month -3: Workshop logistics · 60 volunteers recruited",
                "Month -2: Schedule finalized · speaker coaching sessions",
                "Month -1: Final AV run-through · badge production",
              ].map((s, i) => <div key={i} style={{ fontSize: 8, color: P.text, lineHeight: 1.9, borderLeft: `2px solid ${P.gold}40`, paddingLeft: 8, marginBottom: 2 }}>{s}</div>)}
              {confPhase === "event" && [
                "05:30 — AV team setup · stage check",
                "07:00 — Registration opens (badge scanning system)",
                "09:00 — Opening keynote (1,200-seat main hall)",
                "10:00 — Track 1 (Frontend) + Track 2 (Backend) begin",
                "12:00 — Lunch + sponsor expo",
                "14:00 — Afternoon sessions · workshops",
                "17:00 — Lightning talks (3-min format, 20 speakers)",
                "18:00 — Networking party · live music",
                "20:00 — Day 2 keynote confirmed for tomorrow",
              ].map((s, i) => <div key={i} style={{ fontSize: 8, color: P.text, lineHeight: 1.9, borderLeft: `2px solid ${P.gold}40`, paddingLeft: 8, marginBottom: 2 }}>{s}</div>)}
              {confPhase === "post" && [
                "3,000/3,000 attendees registered (sold out)",
                "Speaker talks: recorded, edited, uploaded (2 weeks)",
                "Sponsor report + prospectus for next year",
                "Attendee NPS: 72 (exceptional for first-time event)",
                "Internal report to VP Engineering with key learnings",
                "JS@PayPal 2.0: greenlit by leadership for next year",
              ].map((s, i) => <div key={i} style={{ fontSize: 8, color: P.text, lineHeight: 1.9, borderLeft: `2px solid ${P.green}50`, paddingLeft: 8, marginBottom: 2 }}>{s}</div>)}
            </div>

            {/* Org roles */}
            <div style={{ background: P.surface, border: `1px solid ${P.border}`, borderRadius: 10, padding: 12, marginBottom: 10 }}>
              <div style={{ fontSize: 8, fontWeight: 700, color: P.textMuted, marginBottom: 6 }}>ORGANIZING TEAM — 10 ROLES, 1 LEAD (ME)</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 4 }}>
                {ORG_ROLES.map((r, i) => (
                  <div key={i} style={{ background: P.surface2, borderRadius: 6, padding: "6px 8px" }}>
                    <div style={{ fontSize: 8, fontWeight: 700, color: i === 0 ? P.gold : P.textBright }}>{r.name}</div>
                    <div style={{ fontSize: 7, color: i === 0 ? P.gold : P.textMuted }}>{r.owner}</div>
                    <div style={{ fontSize: 7, color: P.textMuted, marginTop: 1 }}>{r.detail}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Roadblocks */}
            <div style={{ background: P.surface, border: `1px solid ${P.border}`, borderRadius: 10, padding: 12 }}>
              <div style={{ fontSize: 8, fontWeight: 700, color: P.textMuted, marginBottom: 6 }}>ROADBLOCKS — and how we resolved them</div>
              {CONF_ROADBLOCKS.map((r, i) => (
                <div key={i} onClick={() => setRoadblockShown(roadblockShown === i ? null : i)} style={{ padding: "7px 8px", borderRadius: 7, marginBottom: 5, cursor: "pointer", background: roadblockShown === i ? `${P.red}08` : P.surface2, border: `1px solid ${roadblockShown === i ? P.red + "40" : P.border}` }}>
                  <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                    <span style={{ fontSize: 9 }}>⚠️</span>
                    <span style={{ fontSize: 9, fontWeight: 700, color: P.textBright }}>{r.issue}</span>
                  </div>
                  {roadblockShown === i && (
                    <div style={{ marginTop: 5, fontSize: 8, color: P.green, paddingLeft: 18, lineHeight: 1.5 }}>✓ {r.resolution}</div>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div>
            <div style={{ fontSize: 10, fontWeight: 700, color: P.textMuted, marginBottom: 8, letterSpacing: "0.08em" }}>IMPLEMENTATION DEPTH</div>
            <CodeSnip color={P.gold} label="Leading a 10-person team to launch PayPal's first public developer conference" code={
`// JS @ PAYPAL — THE FULL STORY:
//
// WHY PAYPAL WANTED A DEVELOPER CONFERENCE:
// PayPal is fundamentally a developer-first business.
// The developer experience of integrating PayPal determines whether
// developers choose us vs Stripe vs Braintree.
// External developer community: critical for PayPal's growth.
// An internal PayPal developer conference existed. Public: first time.
// Goal: demonstrate PayPal's engineering depth to the external community.
// "We had brilliant engineers. Nobody outside PayPal knew about them."
//
// THE CONFERENCE FORMAT:
// 2-day event · single venue · 3,500 capacity
// Track 1: Frontend (React, performance, accessibility)
// Track 2: Backend + Platform (Node.js, APIs, DevOps)
// Workshops: 4 × half-day deep-dives (200 seats each)
// Lightning talks: 20 × 3-minute talks by PayPal engineers
// Keynotes: 2 external keynotes + 1 PayPal engineering leader
//
// HOW I LED 10 ORGANIZERS:
// "10 organizers is not a team — it's a collection of domain owners."
// Each person: clear ownership area. Clear success criteria.
// Weekly 30-min sync: only blockers + cross-domain dependencies.
// Async coordination: Slack channel per domain. Shared Notion workspace.
// "I set the agenda and held the vision.
//  Each organizer owned their domain completely.
//  My role: remove blockers, make final calls on trade-offs, 
//  keep the whole thing moving."
//
// THE LEGAL ROADBLOCK (most interesting):
// PayPal had never run a public external event.
// Legal: required review of every piece of content, speaker contracts,
//        liability waivers, sponsor agreements, code of conduct.
// Standard timeline: 6-8 weeks for legal review.
// Our timeline: we didn't have 6-8 weeks.
//
// SOLUTION: Engaged legal from month -8, not month -4.
// Created a "playbook" document: every legal question we anticipated.
// Got answers in one round instead of back-and-forth.
// Built a risk acceptance framework: classified each item by risk level.
// Low risk: delegated sign-off to department head.
// Medium risk: VP sign-off.
// High risk: SVP sign-off.
// "Instead of waiting for legal to clear everything: we gave them
//  a structured decision framework. They responded faster.
//  And we learned which items actually needed their attention."
//
// THE REGISTRATION SYSTEM CRASH:
// Sold 1,400 tickets in the first hour of launch.
// Traffic: 10× what we expected. System went down.
// Our response (I was on-call):
// 1. Kill the registration page — prevent further failures
// 2. Switch to manual waitlist: Google Form (live in 8 minutes)
// 3. Post Twitter/email: "Registration temporarily paused — you're on the list"
// 4. Engage IT: scale up the registration service (4 more instances)
// 5. System back in 90 minutes
// 6. Everyone on the waitlist: admitted first (with early access bonus)
//
// "The crash was embarrassing. How we handled it:
//  transparent, fast, and fair — turned a bad experience into a good one.
//  Multiple attendees tweeted that it was the best-handled tech issue
//  they'd seen from a conference."
//
// THE SPEAKER WITHDRAWAL:
// Keynote speaker withdrew 2 weeks before (personal reason, respect for privacy).
// Alternatives: find another external keynote in 2 weeks (nearly impossible).
// Our decision: elevate an internal PayPal engineer.
// We had a mid-level engineer who had been doing groundbreaking work
// on our Node.js performance infrastructure — a story no one had heard.
// "We turned a crisis into an opportunity.
//  Her talk became the most-watched recording from the conference.
//  4 conference invitations followed from other organizers in the audience."
//
// THE OUTCOME:
// 3,000 attendees (sold out). Attendee NPS: 72.
// PayPal engineering brand: before JS@PayPal, unknown outside the company.
// After: PayPal engineers received speaking invitations, GitHub stars on
//        open-source projects increased 4× in the month following.
// JS@PayPal 2.0: approved by leadership for the following year.
// "The conference wasn't just an event. It was a statement:
//  PayPal is a world-class engineering organization."`} />
          </div>
        </div>
      )}

      {/* ── PARTNER ONBOARDING ── */}
      {tab === "onboarding" && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
          <div>
            <div style={{ fontSize: 10, fontWeight: 700, color: P.textMuted, marginBottom: 8, letterSpacing: "0.08em" }}>PARTNER ONBOARDING APP — BEFORE/AFTER</div>

            {/* Before/After toggle */}
            <div style={{ display: "flex", gap: 5, marginBottom: 10 }}>
              <button onClick={() => setOnboardingBefore(true)} style={{ flex: 1, fontSize: 9, background: onboardingBefore ? `${P.red}20` : "transparent", color: onboardingBefore ? P.red : P.textMuted, border: `1px solid ${onboardingBefore ? P.red : P.border}`, borderRadius: 5, padding: "5px 0", cursor: "pointer" }}>❌ Before: 3 weeks</button>
              <button onClick={() => setOnboardingBefore(false)} style={{ flex: 1, fontSize: 9, background: !onboardingBefore ? `${P.green}20` : "transparent", color: !onboardingBefore ? P.green : P.textMuted, border: `1px solid ${!onboardingBefore ? P.green : P.border}`, borderRadius: 5, padding: "5px 0", cursor: "pointer" }}>✓ After: 4 days</button>
            </div>

            {onboardingBefore ? (
              <div style={{ background: P.surface, border: `1px solid ${P.border}`, borderRadius: 10, padding: 12, marginBottom: 12 }}>
                <div style={{ fontSize: 9, fontWeight: 700, color: P.red, marginBottom: 8 }}>MANUAL PROCESS (before the app)</div>
                {[
                  { step: "Partner emails request",           time: "Day 1",    pain: "Email lost in a shared inbox. No tracking." },
                  { step: "Manual KYC (email/phone)",         time: "Days 2-5", pain: "Back-and-forth emails for documents. Errors." },
                  { step: "Agreement sent via email",         time: "Day 6",    pain: "PDF via email. No e-signature. Often lost." },
                  { step: "Manual credential provisioning",   time: "Days 7-14",pain: "DevOps ticket. Queued. Average 5 business days." },
                  { step: "Sandbox testing (no guidance)",    time: "Days 14-18",pain:"No clear test criteria. Partners guessed." },
                  { step: "Compliance review (manual)",       time: "Days 18-21",pain:"Spreadsheet. No status visibility for partner." },
                ].map((s, i) => (
                  <div key={i} style={{ padding: "6px 8px", borderRadius: 5, marginBottom: 4, background: P.surface2, borderLeft: `3px solid ${P.red}50` }}>
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <span style={{ fontSize: 8, fontWeight: 700, color: P.text }}>{s.step}</span>
                      <span style={{ fontSize: 7, color: P.red }}>{s.time}</span>
                    </div>
                    <div style={{ fontSize: 7, color: P.textMuted, marginTop: 2 }}>{s.pain}</div>
                  </div>
                ))}
                <div style={{ marginTop: 6, padding: "5px 8px", background: `${P.red}10`, borderRadius: 5, fontSize: 8, color: P.red, fontWeight: 700 }}>Total: ~21 business days · 40% of partners abandoned · high support ticket volume</div>
              </div>
            ) : (
              <div style={{ background: P.surface, border: `1px solid ${P.border}`, borderRadius: 10, padding: 12, marginBottom: 12 }}>
                <div style={{ fontSize: 9, fontWeight: 700, color: P.green, marginBottom: 8 }}>AUTOMATED APP (after) — advance by clicking →</div>
                {partnerSteps.map((s, i) => (
                  <div key={s.id} style={{ display: "flex", gap: 8, alignItems: "flex-start", padding: "6px 8px", borderRadius: 5, marginBottom: 4, background: s.status === "active" ? `${P.blueLight}08` : "transparent" }}>
                    <div style={{ width: 20, height: 20, borderRadius: "50%", background: s.status === "done" ? `${P.green}25` : s.status === "active" ? `${P.blueLight}25` : P.surface2, border: `2px solid ${s.status === "done" ? P.green : s.status === "active" ? P.blueLight : P.border}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, flexShrink: 0 }}>
                      {s.status === "done" ? "✓" : s.status === "active" ? "●" : "○"}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 8.5, fontWeight: 700, color: s.status === "done" ? P.green : s.status === "active" ? P.blueLight : P.textMuted }}>{s.label}</div>
                      {s.status === "active" && <div style={{ fontSize: 7, color: P.text, marginTop: 2 }}>{s.detail}</div>}
                    </div>
                  </div>
                ))}
                <button onClick={advancePartner} style={{ width: "100%", marginTop: 6, background: `${P.blue}20`, border: `1px solid ${P.blue}`, borderRadius: 5, padding: "6px 0", color: P.blueLight, fontSize: 9, cursor: "pointer" }}>→ Advance to next step</button>
                <div style={{ marginTop: 6, padding: "5px 8px", background: `${P.green}10`, borderRadius: 5, fontSize: 8, color: P.green, fontWeight: 700 }}>Total: 4 business days average · 89% completion rate · support tickets ↓ 70%</div>
              </div>
            )}
          </div>

          <div>
            <div style={{ fontSize: 10, fontWeight: 700, color: P.textMuted, marginBottom: 8, letterSpacing: "0.08em" }}>IMPLEMENTATION DEPTH</div>
            <CodeSnip color={P.green} label="Full-stack partner onboarding — React + Node.js + Java microservices + workflow engine" code={
`// PARTNER ONBOARDING APP — FULL-STACK ARCHITECTURE:
//
// PROBLEM: PayPal onboards merchants and platform partners.
// "Partner" = any business integrating PayPal payments into their product.
// Before: manual. Email chains. Spreadsheets.
// 21 days average. 40% abandonment rate (partner gave up, chose competitor).
//
// THE BUSINESS CASE:
// Each onboarded partner: avg $240,000 annual GMV contribution.
// 40% abandonment = lost revenue.
// Reducing onboarding to 4 days: recaptured ~35% of previously lost partners.
// That's a meaningful revenue impact.
//
// TECHNICAL ARCHITECTURE:
//
// Frontend (React + Redux):
// ─────────────────────────
// Wizard-style onboarding flow (7 steps).
// Redux: manages form state across steps (so user can go back without losing data).
// Step 1: Business registration info (EIN, entity type, state)
// Step 2: Beneficial owner info (KYC — required for AML compliance)
// Step 3: Upload verification documents (drag & drop, presigned S3 URLs)
// Step 4: Electronic agreement signing (integrated DocuSign)
// Step 5: Sandbox credentials (auto-provisioned on agreement signed)
// Step 6: Integration test checklist (guided test scenarios)
// Step 7: Go-live review (compliance team dashboard)
//
// Node.js Backend (Orchestration Layer):
// ─────────────────────────────────────
// The backend doesn't store data — it orchestrates.
// All data: in PayPal's existing Java microservices.
// Node.js: the glue layer that coordinates the workflow.
//
// Workflow engine (using AWS Step Functions):
// // State machine for onboarding:
// {
//   "StartAt": "BusinessVerification",
//   "States": {
//     "BusinessVerification": {
//       "Type": "Task",
//       "Resource": "arn:aws:lambda:us-east-1:verify-business",
//       "Next": "KYCCheck",
//       "Retry": [{ "ErrorEquals": ["ServiceUnavailable"], "MaxAttempts": 3 }]
//     },
//     "KYCCheck": { "Type": "Task", "Resource": "...", "Next": "AgreementSending" },
//     // ... etc
//   }
// }
//
// Node.js REST endpoints:
// POST /onboarding/start          → creates workflow instance
// GET  /onboarding/:id/status     → returns current step + status
// POST /onboarding/:id/step/:n    → submits step data
// POST /onboarding/:id/documents  → presigned URL for doc upload
//
// Java Microservices Called:
// ─────────────────────────
// GET  PayPal KYC API          → identity verification
// POST PayPal Agreement API    → DocuSign integration
// POST PayPal Credentials API  → provision sandbox ClientID/Secret
// GET  PayPal Risk API         → compliance/AML check
// POST PayPal Production API   → issue production credentials on approval
//
// KEY TECHNICAL DECISIONS:
//
// 1. Idempotent API calls:
// If a network request fails and retries: don't double-provision credentials.
// Every state machine step: idempotency key (onboarding ID + step ID).
// Java services: check if this key was already processed → return cached result.
//
// 2. Async status polling:
// KYC check: takes 30-120 seconds (external identity verification service).
// Frontend: polls GET /onboarding/:id/status every 5 seconds.
// Node.js: caches the status, doesn't hammer the Java service.
// When KYC completes: status updates → frontend advances to next step.
//
// 3. Partial state recovery:
// Partner leaves mid-onboarding → returns next day.
// JWT token: contains onboarding session ID.
// On login: fetch current state from Step Functions → resume exactly where left off.
// "We never lose progress. If a partner stopped on step 4 at 3pm Monday:
//  they pick up at step 4 at 9am Tuesday. Zero re-entry."
//
// RESULTS:
// Average onboarding: 21 days → 4 days (81% reduction)
// Completion rate: 60% → 89%
// Support tickets: ↓ 70% (previously: "where is my application?")
// Partner satisfaction score: 4.2/5 → 4.7/5`} />
          </div>
        </div>
      )}

      {/* ── LEADERSHIP ── */}
      {tab === "lead" && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
          <div>
            <div style={{ fontSize: 10, fontWeight: 700, color: P.textMuted, marginBottom: 8, letterSpacing: "0.08em" }}>LEADERSHIP, AWARDS & MENTORSHIP</div>

            {/* Awards */}
            <div style={{ background: P.surface, border: `1px solid ${P.border}`, borderRadius: 10, padding: 12, marginBottom: 12 }}>
              <div style={{ fontSize: 9, fontWeight: 700, color: P.textMuted, marginBottom: 6 }}>🏆 AWARDS & RECOGNITION</div>
              {AWARDS.map((a, i) => (
                <div key={i} onClick={() => setAwardShown(awardShown === i ? null : i)} style={{ padding: "8px 10px", borderRadius: 8, marginBottom: 5, cursor: "pointer", background: awardShown === i ? `${P.gold}12` : P.surface2, border: `1px solid ${awardShown === i ? P.gold + "50" : P.border}` }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                      <span style={{ fontSize: 14 }}>🏆</span>
                      <span style={{ fontSize: 9, fontWeight: 700, color: P.textBright }}>{a.name}</span>
                    </div>
                    <span style={{ fontSize: 8, color: P.gold }}>{a.year}</span>
                  </div>
                  {awardShown === i && <div style={{ marginTop: 5, fontSize: 8, color: P.textMuted, lineHeight: 1.5, paddingLeft: 20 }}>{a.reason}</div>}
                </div>
              ))}
            </div>

            {/* Mentees */}
            <div style={{ background: P.surface, border: `1px solid ${P.border}`, borderRadius: 10, padding: 12 }}>
              <div style={{ fontSize: 9, fontWeight: 700, color: P.textMuted, marginBottom: 6 }}>👩‍💻 MENTORSHIP PROGRAMME — focus on women engineers</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
                {MENTEES.map((m, i) => (
                  <div key={i} onClick={() => setMenteeShown(menteeShown === i ? null : i)} style={{ background: P.surface2, border: `1px solid ${menteeShown === i ? m.color + "50" : P.border}`, borderRadius: 8, padding: "8px 10px", cursor: "pointer" }}>
                    <div style={{ fontSize: 10, fontWeight: 700, color: m.color, marginBottom: 2 }}>👩 {m.name}</div>
                    <div style={{ fontSize: 8, color: P.textMuted }}>{m.level}</div>
                    {menteeShown === i && (
                      <div style={{ marginTop: 5, fontSize: 8, color: P.text, lineHeight: 1.5 }}>
                        <div style={{ color: m.color, fontWeight: 700, marginBottom: 2 }}>🏅 {m.achievement}</div>
                        <div style={{ color: P.textMuted }}>Focus: {m.domain}</div>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              <div style={{ marginTop: 10, padding: "8px 10px", background: `${P.purple}10`, border: `1px solid ${P.purple}30`, borderRadius: 7, fontSize: 8, color: P.text, lineHeight: 1.6 }}>
                📊 Programme outcomes: 4 women engineers promoted or gave first conference talks · 2 joined PayPal's open-source contributor programme · 1 now runs her own mentoring cohort
              </div>
            </div>
          </div>

          <div>
            <div style={{ fontSize: 10, fontWeight: 700, color: P.textMuted, marginBottom: 8, letterSpacing: "0.08em" }}>IMPLEMENTATION DEPTH</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <CodeSnip color={P.gold} label="Multiple awards, promotions, VP recognition — what it takes at PayPal scale" code={
`// RECOGNITION AT PAYPAL — WHAT DRIVES IT:
//
// PayPal: 30,000+ employees. Standing out requires:
// 1. Measurable technical impact (not just shipping features — metrics)
// 2. Cross-team visibility (the right people have to know about your work)
// 3. Leadership beyond your title (mentoring, conference, community)
//
// THE PAYPAL INNOVATION AWARD (GraphQL work):
// Criterion: "Technical innovation that measurably improves PayPal's products."
// The GraphQL work: had specific metrics.
// Developer portal API response time: 1,100ms → 280ms (75% improvement).
// Developer portal NPS: 42 → 71 (significant jump).
// "These aren't subjective wins. They're numbers.
//  When I presented to the VP: I had a graph, a table, user quotes.
//  Awards go to the people who can show impact, not describe it."
//
// PROMOTIONS — what was being evaluated:
// At PayPal: L3 → L4 → L5 (Senior) → L6 (Staff)
// Technical scope: expanded from feature-level to system-level (GraphQL platform).
// Autonomy: from "implement the design" to "propose the design".
// Mentorship: from peer mentoring to formal programme leadership.
// Visibility: external (JS@PayPal, conference speaking) + internal (VP briefings).
//
// SENIOR MANAGEMENT RECOGNITION:
// The VP of Engineering specifically mentioned the GraphQL work
// and the JS@PayPal conference in their all-hands.
// What got us there: quarterly briefing document.
// I sent a 1-page "engineering highlights" to my director every quarter.
// Director shared it with VP. VP included in all-hands.
// "Recognition doesn't come to you. You architect it the same way
//  you architect software: deliberately, with clear communication."`} />

              <CodeSnip color={P.purple} label="Mentoring women engineers at PayPal — what it means in practice" code={
`// MENTORSHIP PROGRAMME — THE APPROACH:
//
// WHY FOCUS ON WOMEN ENGINEERS:
// PayPal's engineering org: 18% women (at the time).
// Senior engineering roles: 9% women.
// Women engineers present at conferences: rare.
// "The talent exists. The opportunity and confidence: often lacking.
//  My job: bridge that gap."
//
// WHAT "MENTORING" ACTUALLY MEANS (not just monthly coffee):
//
// 1. TECHNICAL DEPTH:
// Regular (biweekly) 1:1s with a technical agenda.
// Not "how are you feeling?" — "let's review your architecture decision."
// "Walk me through why you chose this approach. What were the trade-offs?"
// The same rigour I apply to my own technical thinking.
//
// 2. SPONSORSHIP (the missing piece in most mentoring):
// Mentoring = "I support you."
// Sponsorship = "I advocate for you when you're not in the room."
// Nominating Sarah for the engineering innovation award (she didn't nominate herself).
// Recommending Priya for the open-source programme slot.
// "Women engineers are often excellent at the work and terrible at self-promotion.
//  Not because they lack confidence — because the culture punishes self-promotion
//  from women differently than from men. My job: promote for them."
//
// 3. CONFERENCE COACHING:
// The CFP (Call for Papers) process: intimidating if you've never done it.
// I ran a "How to Write a Conference Talk Proposal" workshop.
// 8 PayPal women engineers attended.
// 4 submitted CFPs. 3 were accepted to their first conference.
// Template I provided: title, abstract formula, why I'm the right speaker.
// Practice sessions: mock talk in front of a friendly audience (5 people).
// "The first time Sarah presented her 3-minute lightning talk: she was terrified.
//  The second time: she was at JSConf. Third time: keynote at a regional conference."
//
// 4. CREATING A COHORT (not just individual mentoring):
// Monthly group session: all 8 mentees together.
// Format: one person shares a technical or career challenge → group advises.
// "The most powerful thing: mentees started mentoring each other.
//  Wei became a mentor to two junior engineers.
//  The programme compounded."
//
// DEI METRICS (what we measured):
// Women engineers presenting at external conferences: 0 → 4 in 18 months.
// Women engineers promoted to Senior/Lead: 2 (from the cohort).
// Women engineers contributing to PayPal open-source: 0 → 3.
// Internal mentoring replications: 2 mentees started their own cohorts.
//
// "Diversity work that doesn't have metrics is volunteering.
//  Diversity work with metrics is engineering.
//  We ran this like a product: what's the goal? how do we measure it?
//  what's working? what do we iterate on?"
//
// ON INCLUSION IN TECHNICAL CULTURE:
// Team design reviews: explicitly call on quieter team members before louder ones.
// Architecture decisions: require written async input before live meeting.
// "This isn't just fairness. It produces better decisions.
//  The person who won't speak up in a room of 10 loud engineers
//  often has the most important insight.
//  Async-first processes unlock perspectives that synchronous meetings silence."`} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default PayPalDeveloperPlatformDemo;
