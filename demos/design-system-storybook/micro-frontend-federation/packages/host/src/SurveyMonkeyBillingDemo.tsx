/**
 * SurveyMonkeyBillingDemo.tsx
 *
 * Staff Frontend Engineer — Billing · SurveyMonkey (2020–2023)
 * Stripe Migration · Python → React/TS/GraphQL · TypeScript Guild
 *
 * TABS
 *   💳 Stripe Migration   — In-house → Stripe: phases, data migration, Elements, dunning
 *   🐍→⚛️ Modernisation  — Legacy Python → React + TypeScript + GraphQL (strangler fig)
 *   📘 TypeScript Guild   — Co-founder: adoption metrics, patterns, tsconfig evolution
 *   🤝 Cross-Functional   — Multi-quarter project: stakeholder map, risks, comms cadence
 */

import React, { useState, useEffect, useRef } from "react";

// ─────────────────────────────────────────────────────────────────
// Design tokens — SurveyMonkey (same palette as FederationDemo)
// ─────────────────────────────────────────────────────────────────
const SM = {
  bg:         "#080f0d",
  surface:    "#0e1a17",
  surface2:   "#142419",
  surface3:   "#1c3028",
  border:     "#1f3d2e",
  green:      "#00BF6F",
  greenLight: "#33d68f",
  teal:       "#00a89d",
  yellow:     "#f5c518",
  red:        "#e03a2f",
  orange:     "#f07030",
  blue:       "#3b82f6",
  purple:     "#8b5cf6",
  stripe:     "#635bff",   // Stripe brand purple
  stripeLight:"#8a84ff",
  python:     "#3572A5",   // Python blue
  text:       "#8db5a1",
  textBright: "#e6f5ed",
  textMuted:  "#2d5a42",
  mono:       "'JetBrains Mono', monospace",
};

// ─────────────────────────────────────────────────────────────────
// Code snippet helper
// ─────────────────────────────────────────────────────────────────

function Code({ code, label, color = SM.green }: { code: string; label?: string; color?: string }) {
  return (
    <div style={{ background: "#030806", border: `1px solid ${SM.border}`, borderRadius: 6, overflow: "hidden" }}>
      {label && <div style={{ padding: "4px 12px", borderBottom: `1px solid ${SM.border}`, fontSize: 9, color, fontFamily: SM.mono }}>{label}</div>}
      <pre style={{ margin: 0, padding: 12, fontSize: 8.5, fontFamily: SM.mono, color: "#5a8a6e", lineHeight: 1.7, overflow: "auto", maxHeight: 360, whiteSpace: "pre-wrap" }}>{code}</pre>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
// Adoption chart (SVG)
// ─────────────────────────────────────────────────────────────────

function AdoptionChart() {
  // Quarterly adoption % over 3 years (12 quarters)
  const points = [
    0, 4, 9, 16, 25, 35, 44, 54, 62, 70, 77, 83
  ];
  const milestones = [
    { q: 0,  label: "Guild founded",        y: 0  },
    { q: 3,  label: "Style guide v1",       y: 16 },
    { q: 6,  label: "graphql-codegen",      y: 44 },
    { q: 9,  label: "strict mode org-wide", y: 70 },
    { q: 11, label: "83% coverage",         y: 83 },
  ];
  const W = 340, H = 130, PAD = 20;
  const x = (i: number) => PAD + (i / 11) * (W - PAD * 2);
  const y = (v: number) => H - PAD - (v / 100) * (H - PAD * 2);

  const pathD = points.map((v, i) => `${i === 0 ? "M" : "L"} ${x(i)} ${y(v)}`).join(" ");
  const areaD = pathD + ` L ${x(11)} ${H - PAD} L ${x(0)} ${H - PAD} Z`;

  return (
    <svg width={W} height={H} style={{ overflow: "visible" }}>
      {/* Grid lines */}
      {[0, 25, 50, 75, 100].map(v => (
        <g key={v}>
          <line x1={PAD} y1={y(v)} x2={W - PAD} y2={y(v)} stroke={`${SM.border}`} strokeWidth={0.5} />
          <text x={PAD - 3} y={y(v) + 3} textAnchor="end" fontSize={7} fill={SM.textMuted}>{v}%</text>
        </g>
      ))}
      {/* Area */}
      <path d={areaD} fill={`${SM.green}12`} />
      {/* Line */}
      <path d={pathD} fill="none" stroke={SM.green} strokeWidth={2} strokeLinejoin="round" />
      {/* Milestones */}
      {milestones.map(m => (
        <g key={m.q}>
          <circle cx={x(m.q)} cy={y(m.y)} r={4} fill={SM.green} />
          <text x={x(m.q)} y={y(m.y) - 7} textAnchor="middle" fontSize={6.5} fill={SM.greenLight}>{m.label}</text>
        </g>
      ))}
      {/* Quarter labels */}
      {[0, 3, 6, 9, 11].map(i => (
        <text key={i} x={x(i)} y={H - 5} textAnchor="middle" fontSize={7} fill={SM.textMuted}>Q{i + 1}</text>
      ))}
    </svg>
  );
}

// ─────────────────────────────────────────────────────────────────
// Stripe Elements mock
// ─────────────────────────────────────────────────────────────────

function StripeElementsMock({ focused }: { focused: boolean }) {
  return (
    <div style={{ background: "#fff", borderRadius: 8, padding: "14px 16px", border: `2px solid ${focused ? SM.stripe : "#ddd"}`, transition: "border-color 0.2s" }}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr auto auto", gap: 8, marginBottom: 8 }}>
        <div style={{ background: "#f8f8f8", borderRadius: 5, padding: "7px 10px", fontSize: 9, color: "#666", border: "1px solid #e0e0e0" }}>4242 4242 4242 4242</div>
        <div style={{ background: "#f8f8f8", borderRadius: 5, padding: "7px 8px", fontSize: 9, color: "#666", border: "1px solid #e0e0e0" }}>12/27</div>
        <div style={{ background: "#f8f8f8", borderRadius: 5, padding: "7px 8px", fontSize: 9, color: "#666", border: "1px solid #e0e0e0" }}>CVC</div>
      </div>
      <div style={{ textAlign: "center", fontSize: 8, color: SM.stripe, fontWeight: 600 }}>
        🔒 Secured by Stripe — PCI DSS Level 1
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
// Main component
// ─────────────────────────────────────────────────────────────────

export function SurveyMonkeyBillingDemo() {
  const [tab, setTab] = useState<"stripe" | "modern" | "ts" | "xfn">("stripe");

  // Stripe tab
  const [billingView, setBillingView] = useState<"before" | "after">("before");
  const [migPhase, setMigPhase]       = useState(0);
  const [stripeStep, setStripeStep]   = useState(-1);
  const [dunningStep, setDunningStep] = useState(-1);
  const [cardFocused, setCardFocused] = useState(false);

  // Modernisation tab
  const [modernStep, setModernStep]   = useState(-1);
  const [pageView, setPageView]       = useState<"python" | "hybrid" | "react">("python");

  // TS Guild tab
  const [tsPattern, setTsPattern]     = useState<number | null>(null);
  const [tsConfigYear, setTsConfigYear] = useState(2020);

  // XFN tab
  const [stakeholder, setStakeholder] = useState<number | null>(null);
  const [riskShown, setRiskShown]     = useState<number | null>(null);
  const [quarter, setQuarter]         = useState(0);

  const MIG_PHASES = [
    {
      label: "Phase 1 — Parallel systems (Q1–Q2)",
      color: SM.yellow,
      detail: "New signups → Stripe only. Existing subscribers → stay on in-house platform. Both systems run in parallel. Team learns Stripe's API patterns. No customer disruption.",
      metrics: "0% of ARR on Stripe. Risk: zero (existing revenue untouched).",
    },
    {
      label: "Phase 2 — Bulk migration (Q3–Q4)",
      color: SM.orange,
      detail: "Migrate existing subscribers in cohorts (by plan type: Basic → Pro → Enterprise). Each cohort: create Stripe Customer + Subscription objects mirroring current state. Payment method migration via card network token transfer (no card re-entry required for most customers).",
      metrics: "Goal: 100% of subscribers on Stripe by end of Q4. Revenue disruption SLO: 0 missed charges.",
    },
    {
      label: "Phase 3 — Decommission (Q5)",
      color: SM.green,
      detail: "Validate 100% of billing events flowing through Stripe. Decommission in-house billing service. Remove Python billing codebase (~14,000 lines). Engineering maintenance cost: eliminated.",
      metrics: "14k lines removed. 3 on-call engineers freed from billing maintenance. Stripe handles: dunning, tax, invoices, dispute management.",
    },
  ];

  const STRIPE_STEPS = [
    { icon: "🗂️", label: "Audit in-house billing surface area", detail: "Map every billing interaction: subscription creation, upgrades, downgrades, cancellations, refunds, failed payment retries, invoices, receipts. 47 unique flows identified." },
    { icon: "📐", label: "Design Stripe data model mapping", detail: "In-house: custom Subscription table. Stripe: Customer + Subscription + PaymentMethod + Invoice objects. Mapping: each in-house subscription → one Stripe Subscription with matching billing cycle, amount, trial period." },
    { icon: "🔑", label: "Implement Stripe Elements (frontend)", detail: "Replace custom payment form (in-house card tokenization) with Stripe Elements. PCI scope: dramatically reduced — card data never touches our servers. Stripe.js tokenizes on the client, sends PaymentMethod ID to our backend." },
    { icon: "🔄", label: "Build migration data pipeline", detail: "Node.js migration script: read in-house subscriber records → create Stripe Customer + Subscription. Card migration: use Stripe's card network token import (works with major issuers — Visa, MC, Amex). ~85% of cards migrate without customer action." },
    { icon: "🧪", label: "Shadow mode testing", detail: "Run Stripe billing in parallel with in-house. For each billing event: fire in-house AND Stripe. Compare results. Any discrepancy: investigation before any customer is migrated." },
    { icon: "🚦", label: "Phased rollout + monitoring", detail: "Cohort 1 (Basic plan, ~2,000 subscribers): migrate. Monitor for 2 weeks. No issues: proceed to Pro. DataDog: revenue reconciliation dashboard checking Stripe charges vs expected amounts in real-time." },
  ];

  const DUNNING_STEPS = [
    { day: "Day 0",  event: "Payment fails",                   action: "Stripe retries once immediately. In-app banner (yellow): 'Payment failed — please update your payment method'" },
    { day: "Day 1",  event: "Email sent",                      action: "Automated email: 'Your payment didn't go through.' Includes direct link to update payment method." },
    { day: "Day 3",  event: "Second retry",                    action: "Stripe Smart Retries: ML model picks optimal time. ~28% of failed payments recovered at this step." },
    { day: "Day 7",  event: "In-app warning escalates",        action: "Banner becomes red. 'Your subscription will be paused in 7 days.' Feature access: unchanged." },
    { day: "Day 14", event: "Final retry + pause warning",     action: "Last automatic retry. Email: 'Final notice — update payment to keep access.'" },
    { day: "Day 21", event: "Subscription paused (not cancelled)", action: "Data preserved. Surveys: read-only. Email: 'Your subscription is paused — no data lost, reactivate anytime.'" },
  ];

  const MODERN_STEPS = [
    { icon: "🔍", label: "Audit legacy Python billing pages",   detail: "12 Django/Jinja2 template pages. jQuery for interactivity. No type safety. 0% test coverage for frontend logic. 8,000 lines of Python view code mixed with business logic." },
    { icon: "📐", label: "Define GraphQL schema for billing data", detail: "Extract billing domain: Subscription, Plan, Invoice, PaymentMethod types. Python Django views: become GraphQL resolvers. Frontend no longer calls Django views directly." },
    { icon: "🏝️", label: "Strangler fig: React islands in Python templates", detail: "First step: embed React components inside existing Jinja2 templates via a <div id='billing-root'> + ReactDOM.render(). Python still owns routing and initial HTML. React owns interactivity. Zero user impact." },
    { icon: "📦", label: "Migrate page by page to React SPA",   detail: "One Django view at a time: move business logic to GraphQL resolver, replace Jinja2 template with React page. React Router handles client-side navigation. When all pages migrated: remove Django view." },
    { icon: "📘", label: "TypeScript from day 1 on new code",   detail: "graphql-codegen: auto-generates TypeScript types from GraphQL schema. Every new React component: strictly typed. No `any`. Gradual migration for existing JS: allowJs: true + incremental strictness." },
    { icon: "✅", label: "Decommission Django billing views",   detail: "After all pages migrated: remove Django billing views (4,200 lines). Django becomes pure API (eventually replaced by Node.js GraphQL resolvers). Frontend: fully React + TypeScript + GraphQL." },
  ];

  const TS_PATTERNS = [
    {
      name: "Branded Types / Nominal Types",
      before: `// BEFORE: plain strings — easy to mix up
function createSurvey(ownerId: string, teamId: string): Survey {
  // Bug: ownerId and teamId are both strings
  // nothing stops you passing them in the wrong order
  return surveyService.create(teamId, ownerId); // silent bug ✗
}`,
      after: `// AFTER: branded types — type-safe IDs
type UserId   = string & { readonly __brand: 'UserId'   };
type TeamId   = string & { readonly __brand: 'TeamId'   };
type SurveyId = string & { readonly __brand: 'SurveyId' };

function createSurvey(ownerId: UserId, teamId: TeamId): Survey {
  return surveyService.create(teamId, ownerId); // TypeScript ERROR ✓
  // Argument of type 'TeamId' is not assignable to parameter of type 'UserId'
}`,
      color: SM.green,
    },
    {
      name: "Discriminated Unions for Billing State",
      before: `// BEFORE: optional fields everywhere — impossible to know what's set
interface Subscription {
  status: string;       // "active" | "paused" | "cancelled"?
  pausedAt?: Date;      // only set when status = paused?
  cancelledAt?: Date;   // only set when status = cancelled?
  // TypeScript can't help: which fields are valid in each status?
}`,
      after: `// AFTER: discriminated union — correct fields per state, enforced
type Subscription =
  | { status: "active";    nextBillingDate: Date                    }
  | { status: "paused";    pausedAt: Date;   resumeDate?: Date      }
  | { status: "cancelled"; cancelledAt: Date; reason: CancelReason  };

// Usage: TypeScript narrows correctly
function handleSubscription(sub: Subscription) {
  if (sub.status === "paused") {
    console.log(sub.pausedAt);   // ✓ TypeScript knows this exists
    console.log(sub.cancelledAt); // ✗ TypeScript ERROR: doesn't exist on paused
  }
}`,
      color: SM.teal,
    },
    {
      name: "GraphQL Codegen — Zero Drift Between API and UI",
      before: `// BEFORE: manual type definitions — drift guaranteed
// GraphQL: type Survey { id: ID! title: String! responseCount: Int }
interface Survey {
  id: string;
  name: string; // BUG: should be "title" — nobody noticed until runtime
  responses: number; // BUG: should be "responseCount"
}`,
      after: `# schema.graphql:
type Survey {
  id:            ID!
  title:         String!
  responseCount: Int!
}

// codegen.yml: generates types/survey.generated.ts on every build
// __generated__/survey.ts (AUTO-GENERATED — do not edit):
export type Survey = {
  id:            string;
  title:         string;   // always in sync with schema
  responseCount: number;   // always in sync with schema
};
// If schema changes: codegen regenerates → TypeScript errors surface immediately`,
      color: SM.purple,
    },
    {
      name: "Const Assertions + Template Literal Types",
      before: `// BEFORE: magic strings everywhere
function trackEvent(event: string, plan: string) { ... }
trackEvent("upgrade_clicked", "bussines"); // typo: "bussines" not caught`,
      after: `// AFTER: type-safe event system
const PLANS = ["basic", "pro", "enterprise"] as const;
type Plan = typeof PLANS[number]; // "basic" | "pro" | "enterprise"

type BillingEvent = \`billing_\${"upgrade" | "downgrade" | "cancel" | "reactivate"}_\${"clicked" | "completed" | "failed"}\`;
// Valid: "billing_upgrade_clicked", "billing_cancel_completed"
// Invalid: "billing_bussines_clicked" → TypeScript error ✓

function trackEvent(event: BillingEvent, plan: Plan) { ... }
trackEvent("billing_upgrade_clicked", "pro");       // ✓
trackEvent("billing_upgrade_clicked", "bussines");  // ✗ TypeScript error`,
      color: SM.yellow,
    },
  ];

  const TS_CONFIGS = {
    2020: `// tsconfig.json — Guild founded (Year 1)
{
  "compilerOptions": {
    "target": "ES2018",
    "module": "ESNext",
    "jsx": "react",
    "allowJs": true,        // allow existing .js files
    "noImplicitAny": false, // too strict for year 1
    "strict": false,        // introduced gradually
    "skipLibCheck": true
  }
  // Adoption: 0% → starting with new files only
}`,
    2021: `// tsconfig.json — Year 2: ratcheting up
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "ESNext",
    "jsx": "react-jsx",
    "allowJs": true,
    "noImplicitAny": true,        // ✓ added in Year 2
    "strictNullChecks": true,     // ✓ biggest impact: catches null bugs
    "strictFunctionTypes": true,  // ✓ catches callback type errors
    "noUnusedLocals": true,       // ✓ cleans up dead code
    "skipLibCheck": false         // ✓ now checking lib types too
  }
  // Adoption: 25% → 50% (after strictNullChecks: teams converted to avoid the pain)
}`,
    2022: `// tsconfig.json — Year 3: full strict mode
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "jsx": "react-jsx",
    "strict": true,               // ✓ ALL strict checks enabled
    "exactOptionalPropertyTypes": true, // ✓ TS 4.4 feature
    "noUncheckedIndexedAccess": true,   // ✓ array[i] is T | undefined
    "allowJs": false,             // ✓ no more .js files allowed in new code
    "paths": {
      "@billing/*": ["./src/billing/*"],
      "@shared/*":  ["./src/shared/*"]
    }
  }
  // Adoption: 70% → 83%
  // noUncheckedIndexedAccess: caught 23 real bugs in billing codebase
}`,
  };

  const STAKEHOLDERS = [
    { team: "Product",          contact: "VP Product + Billing PM",    concern: "Timeline, feature parity, user experience changes", engagement: "Weekly sync · monthly OKR review", color: SM.green  },
    { team: "Design",           contact: "Design lead",                 concern: "New billing UI (payment form, invoices, upgrade flow)", engagement: "Design sprints · weekly review", color: SM.teal   },
    { team: "Customer Support", contact: "CS ops lead",                 concern: "New billing flows they'll need to support. Training.", engagement: "Monthly demo · pre-launch training session", color: SM.blue   },
    { team: "Backend Eng",      contact: "Billing service team",        concern: "API contracts, Stripe webhook handling, data migration", engagement: "Daily standup (shared), async design docs", color: SM.purple },
    { team: "Finance",          contact: "Revenue recognition lead",    concern: "Invoice format, revenue recognition timing, Stripe → accounting system", engagement: "Monthly · sign-off on invoice template", color: SM.yellow },
    { team: "Security/Legal",   contact: "CISO + Legal",                concern: "PCI scope changes, Stripe DPA, customer data handling", engagement: "Async doc review · sign-off required", color: SM.orange },
  ];

  const RISKS = [
    { risk: "Payment method migration failure (cards don't transfer)", severity: "HIGH",   mitigation: "Fallback: Stripe hosted update flow — email customers to re-enter card. Pre-agreed comms plan with CS team." },
    { risk: "Revenue recognition timing changes confuse Finance",      severity: "MEDIUM", mitigation: "Finance lead involved from day 1. Shadow mode: compare in-house vs Stripe invoice dates for 60 days before go-live." },
    { risk: "Stripe API outage during migration window",               severity: "HIGH",   mitigation: "Migration runs during off-peak hours (3–6am). Rollback: keep in-house system live until each cohort is 100% confirmed. Stripe SLA: 99.99%." },
    { risk: "Customer confusion (charges from 'Stripe' not 'SurveyMonkey')", severity: "MEDIUM", mitigation: "Stripe: configures statement descriptor as 'SURVEYMONKEY'. Pre-launch email to all subscribers explaining the change." },
    { risk: "Pricing/proration calculation differences",               severity: "HIGH",   mitigation: "Shadow mode: run both billing systems for 30 days. Automated reconciliation: any $0.01+ difference → Slack alert → manual review." },
  ];

  const QUARTERS = [
    { q: "Q1", focus: "Discovery + design",    deliverables: "Stripe architecture design · stakeholder alignment · RFC approved · Stripe Elements prototype" },
    { q: "Q2", focus: "Build + shadow mode",   deliverables: "Stripe Elements in prod (new signups only) · migration pipeline built · shadow mode: 30 days of parallel running" },
    { q: "Q3", focus: "Phased migration",       deliverables: "Basic plan migrated (2,000 subs) · Pro plan migrated (8,000 subs) · Monitoring dashboards live" },
    { q: "Q4", focus: "Enterprise + close",    deliverables: "Enterprise plan migrated · 100% on Stripe · in-house billing decommissioned · Python code removed" },
    { q: "Q5", focus: "Post-migration cleanup", deliverables: "14k lines removed · 3 engineers off billing on-call · documentation complete · retrospective" },
  ];

  const TABS = [
    { id: "stripe"  as const, label: "💳 Stripe Migration" },
    { id: "modern"  as const, label: "🐍→⚛️ Modernisation" },
    { id: "ts"      as const, label: "📘 TypeScript Guild"  },
    { id: "xfn"    as const, label: "🤝 Cross-Functional"  },
  ];

  return (
    <div style={{ background: SM.bg, color: SM.text, fontFamily: "'Inter', system-ui, sans-serif", minHeight: "100vh", padding: 24 }}>

      {/* Header */}
      <div style={{ marginBottom: 18 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
          <div style={{ width: 42, height: 42, borderRadius: 10, background: `linear-gradient(135deg, ${SM.stripe}, ${SM.green})`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22 }}>💳</div>
          <div>
            <h1 style={{ margin: 0, fontSize: 20, fontWeight: 900, color: SM.textBright, letterSpacing: "-0.02em" }}>SurveyMonkey — Staff Frontend Engineer · Billing (2020–2023)</h1>
            <p style={{ margin: 0, fontSize: 11, color: SM.textMuted }}>Stripe Migration · Python→React/TS/GraphQL · TypeScript Guild Co-founder · 3-year tenure</p>
          </div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8 }}>
          {[
            { v: "Stripe",  l: "In-house → Stripe",       c: SM.stripe,  sub: "Multi-quarter · 6 stakeholder teams · zero revenue disruption" },
            { v: "14k LOC", l: "Python code removed",      c: SM.green,   sub: "Legacy Django billing → React + TypeScript + GraphQL" },
            { v: "3 years", l: "TypeScript Guild lead",    c: SM.purple,  sub: "0% → 83% TypeScript coverage · company-wide adoption" },
            { v: "XFN",     l: "6 teams coordinated",      c: SM.yellow,  sub: "Product · Design · CS · Backend · Finance · Security" },
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

      {/* ── STRIPE MIGRATION ── */}
      {tab === "stripe" && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
          <div>
            <div style={{ fontSize: 10, fontWeight: 700, color: SM.textMuted, marginBottom: 8, letterSpacing: "0.08em" }}>IN-HOUSE → STRIPE BILLING MIGRATION</div>

            {/* Before/After toggle */}
            <div style={{ display: "flex", gap: 4, marginBottom: 10 }}>
              <button onClick={() => setBillingView("before")} style={{ flex: 1, fontSize: 9, background: billingView === "before" ? `${SM.red}20` : "transparent", color: billingView === "before" ? SM.red : SM.textMuted, border: `1px solid ${billingView === "before" ? SM.red : SM.border}`, borderRadius: 5, padding: "5px 0", cursor: "pointer" }}>❌ In-house billing</button>
              <button onClick={() => setBillingView("after")} style={{ flex: 1, fontSize: 9, background: billingView === "after" ? `${SM.stripe}20` : "transparent", color: billingView === "after" ? SM.stripeLight : SM.textMuted, border: `1px solid ${billingView === "after" ? SM.stripe : SM.border}`, borderRadius: 5, padding: "5px 0", cursor: "pointer" }}>✓ Stripe</button>
            </div>

            {billingView === "before" ? (
              <div style={{ background: SM.surface, border: `1px solid ${SM.border}`, borderRadius: 10, padding: 12, marginBottom: 10 }}>
                <div style={{ fontSize: 9, fontWeight: 700, color: SM.red, marginBottom: 6 }}>In-house billing (before)</div>
                {[
                  { label: "Subscription management",  pain: "Custom Python service · 8,000 lines · 3 engineers on-call" },
                  { label: "Payment processing",        pain: "Custom gateway integration · Visa/MC only · no Apple Pay/PayPal" },
                  { label: "Dunning (failed payments)", pain: "Manual retry logic · simple 3-retry schedule · low recovery rate" },
                  { label: "Invoices & receipts",       pain: "Custom PDF generation · no tax calculation · manual VAT for EU" },
                  { label: "PCI compliance",            pain: "Card data on our servers · annual PCI audit · expensive" },
                  { label: "New payment methods",       pain: "Each method: 2-3 weeks engineering work" },
                ].map((r, i) => (
                  <div key={i} style={{ padding: "5px 8px", borderRadius: 5, marginBottom: 3, background: SM.surface2, borderLeft: `2px solid ${SM.red}50` }}>
                    <div style={{ fontSize: 8, fontWeight: 700, color: SM.textBright }}>{r.label}</div>
                    <div style={{ fontSize: 7, color: SM.textMuted }}>{r.pain}</div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ background: SM.surface, border: `1px solid ${SM.border}`, borderRadius: 10, padding: 12, marginBottom: 10 }}>
                <div style={{ fontSize: 9, fontWeight: 700, color: SM.stripeLight, marginBottom: 6 }}>Stripe Billing (after)</div>
                {[
                  { label: "Subscription management",  win: "Stripe Subscriptions API · zero maintenance · automatic proration" },
                  { label: "Payment methods",           win: "Cards, Apple Pay, Google Pay, PayPal, SEPA, Klarna — all out-of-box" },
                  { label: "Dunning (Stripe Smart Retry)", win: "ML-based retry timing · 30%+ recovery rate vs 12% in-house" },
                  { label: "Invoices & tax",            win: "Stripe Tax: automatic tax calculation for 40+ countries. Hosted invoices." },
                  { label: "PCI compliance",            win: "Stripe Elements: card data never touches our servers. PCI scope: minimal." },
                  { label: "Payment form",              win: "Stripe Elements (React): embeds below" },
                ].map((r, i) => (
                  <div key={i} style={{ padding: "5px 8px", borderRadius: 5, marginBottom: 3, background: SM.surface2, borderLeft: `2px solid ${SM.stripe}50` }}>
                    <div style={{ fontSize: 8, fontWeight: 700, color: SM.textBright }}>{r.label}</div>
                    <div style={{ fontSize: 7, color: SM.textMuted }}>{r.win}</div>
                  </div>
                ))}
                <div style={{ marginTop: 8 }}>
                  <div style={{ fontSize: 8, color: SM.textMuted, marginBottom: 4 }}>Stripe Elements — PCI DSS compliant payment form:</div>
                  <StripeElementsMock focused={cardFocused} />
                  <button onClick={() => setCardFocused(f => !f)} style={{ width: "100%", marginTop: 5, fontSize: 8, background: `${SM.stripe}20`, border: `1px solid ${SM.stripe}40`, borderRadius: 5, padding: "4px 0", color: SM.stripeLight, cursor: "pointer" }}>
                    {cardFocused ? "Unfocus field" : "Focus card field →"}
                  </button>
                </div>
              </div>
            )}

            {/* Migration phases */}
            <div style={{ background: SM.surface, border: `1px solid ${SM.border}`, borderRadius: 10, padding: 12, marginBottom: 10 }}>
              <div style={{ fontSize: 8, fontWeight: 700, color: SM.textMuted, marginBottom: 6 }}>MIGRATION PHASES</div>
              {MIG_PHASES.map((ph, i) => (
                <div key={i} onClick={() => setMigPhase(i)} style={{ padding: "7px 8px", borderRadius: 7, marginBottom: 4, cursor: "pointer", background: migPhase === i ? `${ph.color}10` : SM.surface2, borderLeft: `3px solid ${migPhase >= i ? ph.color : SM.border}` }}>
                  <div style={{ fontSize: 8.5, fontWeight: 700, color: migPhase >= i ? SM.textBright : SM.textMuted }}>{ph.label}</div>
                  {migPhase === i && (
                    <>
                      <div style={{ fontSize: 8, color: SM.text, marginTop: 4, lineHeight: 1.5 }}>{ph.detail}</div>
                      <div style={{ fontSize: 7, color: ph.color, marginTop: 4, fontWeight: 700 }}>{ph.metrics}</div>
                    </>
                  )}
                </div>
              ))}
            </div>

            {/* Dunning flow */}
            <div style={{ background: SM.surface, border: `1px solid ${SM.border}`, borderRadius: 10, padding: 12 }}>
              <div style={{ fontSize: 8, fontWeight: 700, color: SM.textMuted, marginBottom: 6 }}>SMART DUNNING FLOW (Stripe) — click to step through</div>
              {DUNNING_STEPS.map((s, i) => (
                <div key={i} onClick={() => setDunningStep(i)} style={{ display: "flex", gap: 7, alignItems: "flex-start", padding: "4px 6px", borderRadius: 5, marginBottom: 2, cursor: "pointer", borderLeft: `2px solid ${dunningStep >= i ? SM.stripe : SM.border}`, background: dunningStep === i ? `${SM.stripe}08` : "transparent" }}>
                  <span style={{ fontSize: 7, fontFamily: SM.mono, color: dunningStep >= i ? SM.stripeLight : SM.textMuted, flexShrink: 0, minWidth: 36 }}>{s.day}</span>
                  <div>
                    <div style={{ fontSize: 8, fontWeight: 600, color: dunningStep >= i ? SM.textBright : SM.textMuted }}>{s.event}</div>
                    {dunningStep === i && <div style={{ fontSize: 7.5, color: SM.textMuted, marginTop: 2, lineHeight: 1.5 }}>{s.action}</div>}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <div style={{ fontSize: 10, fontWeight: 700, color: SM.textMuted, marginBottom: 8, letterSpacing: "0.08em" }}>IMPLEMENTATION DEPTH</div>
            <Code color={SM.stripeLight} label="Stripe migration — Staff Frontend Engineer perspective: decisions, risks, technical depth" code={
`// THE BILLING MIGRATION PROBLEM:
// SurveyMonkey had an in-house billing platform.
// Custom Python service, 8,000 lines of code, 3 engineers dedicated to it.
// Adding Apple Pay: 3 weeks. Adding PayPal: 4 weeks. SEPA direct debit: never built.
// Annual PCI audit: expensive. Failed payment recovery rate: 12%.
// "We were in the business of building surveys. Not billing platforms."
//
// THE DECISION TO MIGRATE (Staff Frontend Engineer drove this):
// Total cost of maintaining in-house billing vs Stripe fees:
// In-house: 3 engineers × salary + PCI audit + gateway fees + ongoing maintenance.
// Stripe: 2.9% + 30¢ per transaction + 0.5% for Billing (subscriptions).
// Break-even: Stripe was cheaper above ~$2M GMV/month. SurveyMonkey: well above that.
// Business case: approved. Staff engineer: owns the migration.
//
// FRONTEND ARCHITECTURE DECISIONS:
//
// 1. STRIPE ELEMENTS vs STRIPE PAYMENT ELEMENT:
// Elements: individual components (CardElement, CvcElement).
// Payment Element: single component, handles all payment methods automatically.
// Decision: Payment Element — future-proofs for new payment methods.
// As new methods appear in Stripe: automatically available. Zero frontend work.
//
// import { Elements, PaymentElement } from '@stripe/react-stripe-js';
// import { loadStripe } from '@stripe/stripe-js';
//
// const stripePromise = loadStripe(process.env.REACT_APP_STRIPE_KEY!);
//
// function BillingPage() {
//   const [clientSecret, setClientSecret] = useState<string | null>(null);
//
//   useEffect(() => {
//     // Backend: create Stripe SetupIntent, return client_secret
//     fetch('/api/billing/setup-intent')
//       .then(r => r.json())
//       .then(({ client_secret }) => setClientSecret(client_secret));
//   }, []);
//
//   if (!clientSecret) return <LoadingSpinner />;
//
//   return (
//     <Elements stripe={stripePromise} options={{ clientSecret }}>
//       <CheckoutForm />
//     </Elements>
//   );
// }
//
// 2. PAYMENT CONFIRMATION FLOW:
// const { confirmSetup, error } = useStripe();
//
// const handleSubmit = async (e: FormEvent) => {
//   e.preventDefault();
//   const { error } = await confirmSetup({
//     elements,
//     confirmParams: {
//       return_url: \`\${window.location.origin}/billing/confirmation\`,
//     },
//   });
//   // If error: Stripe returns specific error codes
//   // card_declined → "Your card was declined"
//   // insufficient_funds → "Insufficient funds"
//   // We map Stripe error codes → user-friendly messages
// };
//
// 3. MIGRATION-SPECIFIC FRONTEND WORK:
// The card migration endpoint:
// POST /api/billing/migrate-to-stripe
// Response: { result: "migrated" | "needs_reentry" | "error" }
//
// "needs_reentry": card couldn't be migrated (some older Visa cards, pre-paid)
// → Show: "Please re-enter your payment details to continue your subscription."
// → Custom Stripe Elements form with pre-filled name/email
// → ~15% of customers needed this flow
// → We sent pre-flight emails to these customers before migration night
//
// 4. DUNNING UI:
// When Stripe fires a payment_intent.payment_failed webhook:
// → Backend: update subscription status in DB
// → Frontend: React context reads subscription status from GraphQL
// → Renders dunning banner (yellow → red as deadline approaches)
//
// type DunningState =
//   | { status: "none" }
//   | { status: "payment_failed"; failedAt: Date; nextRetry: Date }
//   | { status: "paused";         pausedAt: Date                  };
// // Discriminated union: TypeScript guarantees correct field access per state
//
// 5. ZERO-DOWNTIME MIGRATION STRATEGY:
// The hardest constraint: no missed billing events.
// A missed charge = direct revenue loss.
// Mitigation:
// a) Shadow mode: fire both in-house AND Stripe for 30 days.
//    Compare: same invoice amount? Same subscription period?
//    Any diff: alert → manual investigation.
// b) Automated reconciliation: DataDog dashboard.
//    Expected revenue (from our DB) vs Stripe dashboard revenue.
//    $0.01+ discrepancy: PagerDuty alert → billing engineer investigates.
// c) Rollback plan: in-house billing NEVER decommissioned until each
//    customer cohort is 100% stable on Stripe for 2 weeks.
//
// RESULT:
// Zero missed charges during migration.
// Failed payment recovery: 12% (in-house) → 31% (Stripe Smart Retry).
// New payment methods: Apple Pay, Google Pay live within 2 weeks of migration.
// 3 engineers freed from billing maintenance.
// PCI audit: eliminated (Stripe's PCI Level 1 certification covers our scope).`} />
          </div>
        </div>
      )}

      {/* ── MODERNISATION ── */}
      {tab === "modern" && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
          <div>
            <div style={{ fontSize: 10, fontWeight: 700, color: SM.textMuted, marginBottom: 8, letterSpacing: "0.08em" }}>PYTHON → REACT + TYPESCRIPT + GRAPHQL</div>

            {/* View toggle */}
            <div style={{ display: "flex", gap: 4, marginBottom: 10 }}>
              {([["python", "🐍 Python/Django", SM.python], ["hybrid", "🔀 Strangler fig", SM.yellow], ["react", "⚛️ React/TS/GQL", SM.green]] as const).map(([v, l, c]) => (
                <button key={v} onClick={() => setPageView(v)} style={{ flex: 1, fontSize: 8.5, background: pageView === v ? `${c}20` : "transparent", color: pageView === v ? c : SM.textMuted, border: `1px solid ${pageView === v ? c : SM.border}`, borderRadius: 5, padding: "5px 0", cursor: "pointer" }}>{l}</button>
              ))}
            </div>

            {/* Page view simulation */}
            <div style={{ background: SM.surface, border: `1px solid ${SM.border}`, borderRadius: 10, overflow: "hidden", marginBottom: 10 }}>
              {pageView === "python" && (
                <div>
                  <div style={{ background: SM.python, padding: "4px 10px", fontSize: 8, color: "#fff", fontWeight: 700 }}>billing/views.py + templates/billing.html (Legacy Django)</div>
                  <div style={{ padding: 10 }}>
                    <pre style={{ margin: 0, fontSize: 7.5, fontFamily: SM.mono, color: "#5a8a6e", lineHeight: 1.6 }}>
{`# views.py (Python — 400 lines mixing data + presentation)
def billing_page(request):
    subscriptions = Subscription.objects.filter(user=request.user)
    plans = Plan.objects.all()
    invoices = Invoice.objects.filter(
        subscription__user=request.user
    ).order_by('-created_at')[:10]
    # No type hints. Any dict can be passed to template.
    return render(request, 'billing.html', {
        'subscriptions': subscriptions,
        'plans': plans,
        'invoices': invoices,
    })

# templates/billing.html (Jinja2 + jQuery)
{% for subscription in subscriptions %}
<div class="subscription-card"
     data-id="{{ subscription.id }}">
  {{ subscription.plan.name }} —
  \${{ subscription.plan.price }}/mo
  <button onclick="cancelSub('{{ subscription.id }}')">
    Cancel
  </button>
</div>
{% endfor %}`}
                    </pre>
                    <div style={{ marginTop: 6, padding: "4px 8px", background: `${SM.red}10`, borderRadius: 4, fontSize: 7.5, color: SM.red }}>
                      No type safety · jQuery interactivity · 0% test coverage · cannot be reused across pages
                    </div>
                  </div>
                </div>
              )}
              {pageView === "hybrid" && (
                <div>
                  <div style={{ background: SM.yellow, padding: "4px 10px", fontSize: 8, color: "#000", fontWeight: 700 }}>Strangler Fig — React islands inside Django templates</div>
                  <div style={{ padding: 10 }}>
                    <pre style={{ margin: 0, fontSize: 7.5, fontFamily: SM.mono, color: "#5a8a6e", lineHeight: 1.6 }}>
{`{# billing.html — Django template (still routing) #}
{% extends "base.html" %}
{% block content %}
<!-- OLD: Django renders subscription list -->
{# {% include "partials/subscriptions.html" %} #}

<!-- NEW: React component mounts here -->
<div id="billing-subscriptions-root"
     data-initial-data="{{ subscriptions_json }}">
</div>

{% block extra_scripts %}
<!-- React bundle for this page only -->
<script src="/static/js/billing-subscriptions.bundle.js">
</script>
<script>
  BillingSubscriptions.mount(
    document.getElementById('billing-subscriptions-root'),
    JSON.parse(document.querySelector(
      '[data-initial-data]').dataset.initialData)
  );
</script>
{% endblock %}
{% endblock %}`}
                    </pre>
                    <div style={{ marginTop: 6, padding: "4px 8px", background: `${SM.yellow}10`, borderRadius: 4, fontSize: 7.5, color: SM.yellow }}>
                      Strangler fig pattern: React progressively replaces Django templates. Users never notice the transition.
                    </div>
                  </div>
                </div>
              )}
              {pageView === "react" && (
                <div>
                  <div style={{ background: SM.green, padding: "4px 10px", fontSize: 8, color: "#000", fontWeight: 700 }}>SubscriptionsPage.tsx — Full React + TypeScript + GraphQL</div>
                  <div style={{ padding: 10 }}>
                    <pre style={{ margin: 0, fontSize: 7.5, fontFamily: SM.mono, color: "#5a8a6e", lineHeight: 1.6 }}>
{`// Auto-generated from GraphQL schema:
import type { GetSubscriptionsQuery } from './__generated__';
import { useGetSubscriptionsQuery } from './__generated__';

// Type-safe subscription states (discriminated union):
type SubscriptionState =
  | { status: 'active';    nextBillingDate: Date }
  | { status: 'paused';    pausedAt: Date        }
  | { status: 'cancelled'; cancelledAt: Date     };

export function SubscriptionsPage() {
  const { data, loading, error } = useGetSubscriptionsQuery();

  if (loading) return <BillingLoadingSkeleton />;
  if (error)   return <BillingError error={error} />;

  return (
    <main>
      {data?.subscriptions.map(sub => (
        <SubscriptionCard
          key={sub.id}
          subscription={sub}
          onCancel={handleCancel}
          onUpgrade={handleUpgrade}
        />
      ))}
    </main>
  );
}
// Zero jQuery · fully typed · testable · reusable`}
                    </pre>
                    <div style={{ marginTop: 6, padding: "4px 8px", background: `${SM.green}10`, borderRadius: 4, fontSize: 7.5, color: SM.green }}>
                      Full type safety · GraphQL query auto-typed · component-level tests · no Django dependency
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Migration steps */}
            <div style={{ background: SM.surface, border: `1px solid ${SM.border}`, borderRadius: 10, padding: 12 }}>
              <div style={{ fontSize: 8, fontWeight: 700, color: SM.textMuted, marginBottom: 6 }}>MIGRATION PLAYBOOK — click steps</div>
              {MODERN_STEPS.map((s, i) => (
                <div key={i} onClick={() => setModernStep(i)} style={{ display: "flex", gap: 8, alignItems: "flex-start", padding: "5px 8px", borderRadius: 6, marginBottom: 3, cursor: "pointer", borderLeft: `2px solid ${modernStep >= i ? SM.green : SM.border}`, background: modernStep === i ? `${SM.green}08` : "transparent" }}>
                  <span style={{ fontSize: 12, flexShrink: 0 }}>{s.icon}</span>
                  <div>
                    <div style={{ fontSize: 8.5, fontWeight: 600, color: modernStep >= i ? SM.textBright : SM.textMuted }}>{s.label}</div>
                    {modernStep === i && <div style={{ fontSize: 8, color: SM.green, marginTop: 2 }}>{s.detail}</div>}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <div style={{ fontSize: 10, fontWeight: 700, color: SM.textMuted, marginBottom: 8, letterSpacing: "0.08em" }}>IMPLEMENTATION DEPTH</div>
            <Code color={SM.green} label="Python → React/TS/GraphQL modernisation — the Staff Eng view" code={
`// THE LEGACY PYTHON BILLING STACK:
// 12 Django views for billing. Jinja2 templates. jQuery.
// ~8,000 lines of Python mixing data access + business logic + presentation.
// 0% frontend test coverage.
// Developers: had to understand Python ORM AND jQuery AND HTML templates.
// Onboarding: 3 weeks before a new developer could safely change billing UI.
//
// THE PROBLEM WITH A BIG REWRITE:
// "Big bang rewrite": build new system in parallel, cut over.
// Risks: scope creep, never-finished, breaks existing users, 6+ months.
// "The second system effect": rewrite often makes things worse.
// Our approach: strangler fig (from Martin Fowler).
// Gradually replace the old system. Users never notice the transition.
//
// THE STRANGLER FIG PATTERN IN PRACTICE:
//
// Step 1: GraphQL schema for billing domain.
// Not rewriting Python yet — adding a new data access layer.
// type Subscription { id: ID!, status: SubscriptionStatus!, ... }
// Django view: still renders HTML.
// GraphQL resolver: reads from same DB as Django view.
// Both exist simultaneously.
//
// Step 2: React island in the Django template.
// <div id="billing-subscriptions-root"></div>
// React mounts here. Django no longer renders the subscription list.
// Django: still owns routing (/billing/subscriptions URL).
// React: owns the UI within that page.
// User experience: identical. No URL change. No transition animation.
// "The user has no idea the tech stack changed."
//
// Step 3: React takes over routing.
// When all billing pages are React: add React Router.
// /billing/subscriptions → React route
// /billing/invoices → React route
// Django: returns HTML shell (just <div id="app">), React handles the rest.
//
// Step 4: Remove Django billing views.
// Python billing views: now empty (just return the React HTML shell).
// Business logic: moved to GraphQL resolvers (Node.js or Python, doesn't matter).
// 4,200 lines of Django view code: deleted.
//
// GRAPHQL INTEGRATION:
// The key enabler: graphql-codegen.
// Define GraphQL schema → codegen generates TypeScript types + React hooks.
// Developer workflow:
// 1. Update schema.graphql
// 2. Run: pnpm codegen → types regenerated
// 3. TypeScript: immediately errors if component uses wrong field
//
// # codegen.yml:
// schema: './src/graphql/schema.graphql'
// documents: './src/**/*.graphql'
// generates:
//   ./src/__generated__/graphql.ts:
//     plugins:
//       - 'typescript'
//       - 'typescript-operations'
//       - 'typescript-react-apollo'
//
// RESULT:
// query GetSubscriptions {    # SubscriptionsPage.graphql
//   subscriptions {
//     id title status
//     nextBillingDate
//   }
// }
// → generates: useGetSubscriptionsQuery()
//    return type: { data: GetSubscriptionsQuery | undefined, loading, error }
//    Fully typed. No manual interface maintenance.
//
// METRICS:
// Before: 8,000 Python lines + 4,200 Django view lines + jQuery.
// After: 0 Python billing lines. ~3,200 React/TypeScript lines.
// Test coverage: 0% → 74% (React Testing Library + graphql-mock).
// Onboarding time: 3 weeks → 4 days.
// "A new frontend engineer can understand and modify billing UI
//  within their first week. Previously: 3 weeks just to understand the stack."`} />
          </div>
        </div>
      )}

      {/* ── TYPESCRIPT GUILD ── */}
      {tab === "ts" && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
          <div>
            <div style={{ fontSize: 10, fontWeight: 700, color: SM.textMuted, marginBottom: 8, letterSpacing: "0.08em" }}>TYPESCRIPT GUILD — CO-FOUNDER · 3 YEARS</div>

            {/* Adoption chart */}
            <div style={{ background: SM.surface, border: `1px solid ${SM.border}`, borderRadius: 10, padding: 12, marginBottom: 12 }}>
              <div style={{ fontSize: 8, fontWeight: 700, color: SM.textMuted, marginBottom: 8 }}>COMPANY-WIDE ADOPTION (12 quarters)</div>
              <AdoptionChart />
            </div>

            {/* tsconfig evolution */}
            <div style={{ background: SM.surface, border: `1px solid ${SM.border}`, borderRadius: 10, padding: 12, marginBottom: 12 }}>
              <div style={{ fontSize: 8, fontWeight: 700, color: SM.textMuted, marginBottom: 6 }}>tsconfig EVOLUTION — strictness ratchet</div>
              <div style={{ display: "flex", gap: 5, marginBottom: 6 }}>
                {([2020, 2021, 2022] as const).map(y => (
                  <button key={y} onClick={() => setTsConfigYear(y)} style={{ flex: 1, fontSize: 9, background: tsConfigYear === y ? `${SM.purple}20` : "transparent", color: tsConfigYear === y ? SM.purple : SM.textMuted, border: `1px solid ${tsConfigYear === y ? SM.purple : SM.border}`, borderRadius: 5, padding: "4px 0", cursor: "pointer" }}>Year {y - 2019} ({y})</button>
                ))}
              </div>
              <pre style={{ margin: 0, fontSize: 7.5, fontFamily: SM.mono, color: "#5a8a6e", lineHeight: 1.6, background: "#030806", padding: 10, borderRadius: 5 }}>
                {TS_CONFIGS[tsConfigYear]}
              </pre>
            </div>

            {/* TS patterns */}
            <div style={{ background: SM.surface, border: `1px solid ${SM.border}`, borderRadius: 10, padding: 12 }}>
              <div style={{ fontSize: 8, fontWeight: 700, color: SM.textMuted, marginBottom: 6 }}>GUILD PATTERNS — click to see before/after</div>
              {TS_PATTERNS.map((p, i) => (
                <div key={i} onClick={() => setTsPattern(tsPattern === i ? null : i)} style={{ padding: "7px 8px", borderRadius: 7, marginBottom: 5, cursor: "pointer", background: tsPattern === i ? `${p.color}08` : SM.surface2, border: `1px solid ${tsPattern === i ? p.color + "50" : SM.border}` }}>
                  <div style={{ fontSize: 9, fontWeight: 700, color: tsPattern === i ? p.color : SM.textBright }}>{p.name}</div>
                  {tsPattern === i && (
                    <div style={{ marginTop: 6 }}>
                      <div style={{ fontSize: 7, color: SM.red, marginBottom: 3, fontWeight: 700 }}>BEFORE:</div>
                      <pre style={{ margin: "0 0 6px 0", fontSize: 7, fontFamily: SM.mono, color: "#5a6a60", background: "#010302", padding: 8, borderRadius: 4, lineHeight: 1.6, whiteSpace: "pre-wrap" }}>{p.before}</pre>
                      <div style={{ fontSize: 7, color: SM.green, marginBottom: 3, fontWeight: 700 }}>AFTER:</div>
                      <pre style={{ margin: 0, fontSize: 7, fontFamily: SM.mono, color: "#5a8a6e", background: "#010302", padding: 8, borderRadius: 4, lineHeight: 1.6, whiteSpace: "pre-wrap" }}>{p.after}</pre>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div>
            <div style={{ fontSize: 10, fontWeight: 700, color: SM.textMuted, marginBottom: 8, letterSpacing: "0.08em" }}>IMPLEMENTATION DEPTH</div>
            <Code color={SM.purple} label="TypeScript Guild — what co-founding a guild means and why it matters at Staff Eng level" code={
`// WHY A TYPESCRIPT GUILD?
// 2020: SurveyMonkey's frontend: ~98% JavaScript.
// Multiple teams: adding TypeScript independently, differently.
// Team A: allowJs: true, no strict. Team B: strict mode from day 1.
// Team C: using @ts-ignore everywhere. No shared tsconfig. No shared patterns.
// "Inconsistent TypeScript is worse than no TypeScript.
//  You get none of the benefits and all of the complexity."
//
// THE GUILD MODEL:
// Not a mandate. A community of practice.
// Co-founded with 2 other senior engineers from different product teams.
// Structure:
//   Bi-weekly 45-min meeting (15-20 people, cross-team)
//   Slack channel: #typescript-guild (Q&A, sharing patterns)
//   Internal wiki: TypeScript Style Guide + Migration Guide
//   Champions: one engineer per product team who promotes TS locally
//
// WHAT THE GUILD PRODUCED:
//
// 1. SHARED tsconfig BASE:
// tsconfig.base.json: maintained by the guild.
// Each team's tsconfig.json extends it:
// { "extends": "../../tsconfig.base.json", "compilerOptions": { ... } }
// Version-controlled. PRs require guild review.
// Gradual strictness increase over 3 years (see Year 1→2→3 configs).
//
// 2. THE MIGRATION GUIDE:
// "How to convert a .js file to .ts without breaking anything."
// Step 1: rename .js → .tsx
// Step 2: add // @ts-nocheck at the top
//   → file is TypeScript syntax but no checks yet
// Step 3: remove @ts-nocheck, fix errors one by one
// Step 4: run tests. Ship.
// "This made migration non-scary. Any developer: can convert one file per day."
//
// 3. THE STRICTNESS RATCHET:
// Can't add strict options all at once → too many errors.
// Can't loosen options once set → losing the benefit.
// The ratchet: add ONE new strict option per quarter.
// Q1: noImplicitAny → catches "any" creep
// Q2: strictNullChecks → biggest impact, catches most bugs
// Q3: strictFunctionTypes → catches callback type mismatches
// Q4: noUncheckedIndexedAccess → array[i] is T | undefined
//
// RESULT OF noUncheckedIndexedAccess (most impactful):
// Before:
// const plans = getPlans(); // Plan[]
// const firstPlan = plans[0]; // type: Plan (but could be undefined!)
// console.log(firstPlan.price); // runtime error if plans is empty!
//
// After (noUncheckedIndexedAccess: true):
// const firstPlan = plans[0]; // type: Plan | undefined
// console.log(firstPlan.price); // TypeScript ERROR: possibly undefined ✓
// console.log(firstPlan?.price); // correct: optional chain ✓
// "This option alone caught 23 real bugs in the billing codebase."
//
// 4. THE GRAPHQL CODEGEN INTEGRATION:
// Pattern: GraphQL schema → auto-generated TypeScript types.
// The guild: wrote the codegen.yml template, established it as the standard.
// Before: each team writing their own TypeScript interfaces for GraphQL responses.
// After: codegen generates them on every build. Schema and types: always in sync.
//
// 5. ADOPTION JOURNEY (0% → 83%):
// Year 1: guild founded. 4 teams join. Adopt for new files only.
// After strictNullChecks: teams started converting existing files
//   (the pain of fixing errors was less than the pain of undiscovered bugs).
// Year 2: graphql-codegen adopted. "Types for free" = major adoption driver.
// Year 3: strict mode org-wide. New JS files: not allowed (allowJs: false).
//   83% TypeScript coverage (remaining 17%: legacy files scheduled for migration).
//
// WHY THIS IS STAFF ENGINEER WORK:
// A senior engineer: adds TypeScript to their team's project.
// A staff engineer: creates the org-wide ecosystem that makes TypeScript
//   adoption the path of least resistance for all 12 frontend teams.
// "I didn't write most of the TypeScript at SurveyMonkey.
//  I created the conditions under which 80+ frontend engineers
//  adopted TypeScript consistently, correctly, and without being mandated.
//  That's the difference between impact and influence."`} />
          </div>
        </div>
      )}

      {/* ── CROSS-FUNCTIONAL ── */}
      {tab === "xfn" && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
          <div>
            <div style={{ fontSize: 10, fontWeight: 700, color: SM.textMuted, marginBottom: 8, letterSpacing: "0.08em" }}>MULTI-QUARTER CROSS-FUNCTIONAL LEADERSHIP</div>

            {/* Quarter timeline */}
            <div style={{ background: SM.surface, border: `1px solid ${SM.border}`, borderRadius: 10, padding: 12, marginBottom: 12 }}>
              <div style={{ fontSize: 8, fontWeight: 700, color: SM.textMuted, marginBottom: 6 }}>PROJECT TIMELINE — click to advance</div>
              <div style={{ display: "flex", gap: 5, marginBottom: 8 }}>
                {QUARTERS.map((q, i) => (
                  <button key={i} onClick={() => setQuarter(i)} style={{ flex: 1, fontSize: 8, background: quarter === i ? `${SM.green}20` : quarter > i ? `${SM.green}10` : "transparent", color: quarter >= i ? SM.green : SM.textMuted, border: `1px solid ${quarter >= i ? SM.green + "40" : SM.border}`, borderRadius: 5, padding: "4px 0", cursor: "pointer" }}>{q.q}</button>
                ))}
              </div>
              <div style={{ background: SM.surface2, borderRadius: 8, padding: 10 }}>
                <div style={{ fontSize: 9, fontWeight: 700, color: SM.green, marginBottom: 3 }}>{QUARTERS[quarter].focus}</div>
                <div style={{ fontSize: 8, color: SM.text }}>{QUARTERS[quarter].deliverables}</div>
              </div>
            </div>

            {/* Stakeholders */}
            <div style={{ background: SM.surface, border: `1px solid ${SM.border}`, borderRadius: 10, padding: 12, marginBottom: 12 }}>
              <div style={{ fontSize: 8, fontWeight: 700, color: SM.textMuted, marginBottom: 6 }}>STAKEHOLDER MAP — 6 teams, 1 staff engineer</div>
              {STAKEHOLDERS.map((s, i) => (
                <div key={i} onClick={() => setStakeholder(stakeholder === i ? null : i)} style={{ padding: "7px 8px", borderRadius: 7, marginBottom: 4, cursor: "pointer", background: stakeholder === i ? `${s.color}08` : SM.surface2, border: `1px solid ${stakeholder === i ? s.color + "40" : SM.border}` }}>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span style={{ fontSize: 9, fontWeight: 700, color: SM.textBright }}>{s.team}</span>
                    <span style={{ fontSize: 7, color: s.color }}>{s.contact}</span>
                  </div>
                  {stakeholder === i && (
                    <div style={{ marginTop: 5, fontSize: 8, color: SM.textMuted, lineHeight: 1.5 }}>
                      <div><strong style={{ color: SM.text }}>Concern:</strong> {s.concern}</div>
                      <div><strong style={{ color: SM.text }}>Engagement:</strong> {s.engagement}</div>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Risks */}
            <div style={{ background: SM.surface, border: `1px solid ${SM.border}`, borderRadius: 10, padding: 12 }}>
              <div style={{ fontSize: 8, fontWeight: 700, color: SM.textMuted, marginBottom: 6 }}>RISK REGISTER — click for mitigation</div>
              {RISKS.map((r, i) => (
                <div key={i} onClick={() => setRiskShown(riskShown === i ? null : i)} style={{ padding: "6px 8px", borderRadius: 7, marginBottom: 4, cursor: "pointer", background: riskShown === i ? `${SM.red}08` : SM.surface2, border: `1px solid ${riskShown === i ? SM.red + "40" : SM.border}` }}>
                  <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                    <span style={{ fontSize: 7, background: r.severity === "HIGH" ? `${SM.red}25` : `${SM.yellow}25`, color: r.severity === "HIGH" ? SM.red : SM.yellow, borderRadius: 3, padding: "1px 5px", fontWeight: 700, flexShrink: 0 }}>{r.severity}</span>
                    <span style={{ fontSize: 8, color: SM.textBright }}>{r.risk}</span>
                  </div>
                  {riskShown === i && <div style={{ marginTop: 5, fontSize: 7.5, color: SM.green, lineHeight: 1.5, paddingLeft: 4 }}>✓ Mitigation: {r.mitigation}</div>}
                </div>
              ))}
            </div>
          </div>

          <div>
            <div style={{ fontSize: 10, fontWeight: 700, color: SM.textMuted, marginBottom: 8, letterSpacing: "0.08em" }}>IMPLEMENTATION DEPTH</div>
            <Code color={SM.yellow} label="Multi-quarter cross-functional project leadership — the Staff Eng view" code={
`// THE CHALLENGE OF BILLING MIGRATIONS:
// "The billing migration is the most dangerous type of engineering project.
//  Any mistake: direct revenue impact. A missed charge = money not collected.
//  A double charge = immediate chargeback + customer trust loss.
//  A failed subscription migration = customer loses access → cancellation."
//
// WHY THIS REQUIRES A STAFF ENGINEER (NOT A SENIOR):
// The Stripe migration touches:
// - Product: which features of Stripe to use, which to build custom
// - Design: new payment UI, subscription management, invoices
// - Customer Support: training on new flows, new support tools
// - Backend Engineering: API design, webhooks, data migration scripts
// - Finance: revenue recognition, accounting system integration
// - Legal/Security: PCI scope, Stripe DPA, customer data handling
//
// A senior engineer: can execute one of these workstreams.
// A staff engineer: defines the project structure, coordinates all 6 teams,
//   makes the architectural decisions that affect all 6, and is accountable
//   for the overall success.
//
// HOW I STRUCTURED THE WORK:
//
// 1. THE RFC (Request for Comments):
// Before writing a line of code: a 12-page RFC.
// Sections: problem statement, proposed solution (Stripe), alternatives
//   (Recurly, Chargebee, in-house improvements), technical architecture,
//   migration strategy, risk register, rollback plan, success metrics.
// Shared with all 6 stakeholder groups. 2-week comment period.
// Revised based on feedback. Sign-off required from VP Product + VP Engineering.
//
// 2. WORKING WITH CUSTOMER SUPPORT:
// CS team: discovered that 40% of their billing-related tickets
//   were about specific in-house features that Stripe wouldn't replicate.
// Without CS involvement: we'd have shipped Stripe missing those features.
// With CS: we identified 3 features to custom-build on top of Stripe.
// "CS was the team I most needed and most frequently forgot to include
//  in previous projects. For billing: they're on the front lines of every
//  customer complaint. They know the edge cases engineering never sees."
//
// 3. WORKING WITH FINANCE:
// Finance: revenue recognition timing changes when switching to Stripe.
// In-house: revenue recognized on billing date.
// Stripe: revenue recognized when Stripe settles (T+2 business days).
// Finance: needed accounting system changes to handle this.
// Without early Finance involvement: this would have been a blocker at launch.
// With Finance: resolved during Phase 1. Revenue recognition updated before
//   any customer migrated.
//
// 4. COMMUNICATING UPWARD:
// Bi-weekly written update to VP Engineering (1 paragraph):
//   - What we completed this sprint
//   - What we're doing next sprint
//   - Any blockers that need VP attention
//   - Current risk status (green/yellow/red)
//
// Monthly dashboard: migration progress (% of subscribers on Stripe),
//   revenue reconciliation status, support ticket volume (should decrease post-migration).
//
// "Executives don't want surprises. A 1-paragraph update prevents
//  the surprise. If something is going wrong: they hear it from me first,
//  with a mitigation plan. Not from Finance noticing a reconciliation issue."
//
// 5. THE SHADOW MODE DECISION:
// Shadow mode: run both systems in parallel for 30 days before customer migration.
// Engineering team: wanted to skip shadow mode to save 4 weeks.
// My decision: shadow mode is non-negotiable.
// Reasoning: billing errors compound. A 0.5% error rate on 50,000 subscribers
//   = 250 wrong charges. Cost of fixing: CS time, Stripe dispute fees, trust damage.
// Cost of shadow mode: 4 weeks of engineering time.
// 4 weeks << cost of 250 wrong charges.
// "The faster path is always wrong for billing migrations.
//  The safe path is the only acceptable path."
//
// PROJECT RESULT:
// Zero missed charges. Zero double charges.
// Migration completed: 2 weeks ahead of schedule (Q4, not Q5).
// Support tickets related to billing: ↓ 45% post-migration
//   (Stripe's dunning UX is clearer than our custom emails).
// Engineering hours on billing maintenance: ↓ from ~0.6 FTE to ~0.1 FTE.
// "The best outcome: nobody noticed. The billing just worked better,
//  quietly, for 50,000 customers."`} />
          </div>
        </div>
      )}
    </div>
  );
}

export default SurveyMonkeyBillingDemo;
