/**
 * EngineeringPracticesDemo.tsx
 *
 * Engineering best practices across teams:
 *   🚩 LaunchDarkly — feature flagging, gradual rollouts, A/B tests, kill switches
 *   📊 Datadog RUM  — Core Web Vitals, error tracking, session replay, dashboards
 *   🛡 Akamai WAF   — security rules, bot protection, rate limiting, IP blocking
 *   📋 Best Practices — coding standards, PR process, Definition of Done
 *
 * IMPACT
 *   Feature flagging: eliminated "big bang" deploys → zero-downtime releases
 *   Datadog RUM: reduced mean time to detect front-end incidents: 45min → <5min
 *   Akamai WAF: blocked 99.7% of malicious traffic before reaching origin
 */

import React, { useState, useEffect, useRef, useCallback } from "react";

// ─────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────

type FlagKind  = "boolean" | "multivariate" | "percentage" | "kill-switch" | "experiment";
type FlagEnv   = "production" | "staging" | "development";
type WafAction = "allow" | "block" | "challenge" | "rate-limit";
type WafThreat = "sql-injection" | "xss" | "bot" | "ddos" | "path-traversal" | "clean";
type CWVRating = "good" | "needs-improvement" | "poor";

interface FeatureFlag {
  key:         string;
  name:        string;
  kind:        FlagKind;
  description: string;
  enabled:     Record<FlagEnv, boolean>;
  percentage?: number;                         // for percentage rollouts
  variants?:   { name: string; value: string; weight: number }[];
  tags:        string[];
}

interface WafEvent {
  id:        string;
  timestamp: string;
  ip:        string;
  country:   string;
  path:      string;
  method:    string;
  action:    WafAction;
  threat:    WafThreat;
  rule?:     string;
  ua:        string;
}

interface CWVMetric {
  name:   string;
  abbr:   string;
  value:  number;
  unit:   string;
  rating: CWVRating;
  good:   number;
  poor:   number;
  desc:   string;
}

// ─────────────────────────────────────────────────────────────────
// Mock data
// ─────────────────────────────────────────────────────────────────

const INITIAL_FLAGS: FeatureFlag[] = [
  {
    key: "new-dashboard-ui", name: "New Dashboard UI", kind: "boolean",
    description: "Redesigned dashboard with React Server Components and new data visualisations.",
    enabled: { production: false, staging: true, development: true },
    tags: ["frontend", "dashboard"],
  },
  {
    key: "ai-search", name: "AI-Powered Search", kind: "percentage",
    description: "Semantic search powered by embeddings. Progressive rollout — monitor error rate.",
    enabled: { production: true, staging: true, development: true },
    percentage: 30,
    tags: ["search", "ai", "beta"],
  },
  {
    key: "checkout-v2", name: "Checkout V2", kind: "experiment",
    description: "A/B test: V2 checkout vs legacy. Primary metric: conversion rate.",
    enabled: { production: true, staging: true, development: true },
    variants: [
      { name: "control (v1)",   value: "v1", weight: 50 },
      { name: "treatment (v2)", value: "v2", weight: 50 },
    ],
    tags: ["checkout", "experiment"],
  },
  {
    key: "maintenance-mode", name: "Maintenance Mode", kind: "kill-switch",
    description: "Kill switch: when on, all users see a maintenance banner. Deploy-independent.",
    enabled: { production: false, staging: false, development: false },
    tags: ["ops", "critical"],
  },
  {
    key: "beta-features", name: "Beta Feature Set", kind: "multivariate",
    description: "Multi-variant flag targeting beta-opted-in users via attribute rule.",
    enabled: { production: true, staging: true, development: true },
    variants: [
      { name: "off",     value: "off",     weight: 70 },
      { name: "beta",    value: "beta",    weight: 20 },
      { name: "preview", value: "preview", weight: 10 },
    ],
    tags: ["beta", "targeting"],
  },
  {
    key: "price-experiment", name: "Pricing Display", kind: "experiment",
    description: "Test: $8.99 vs $9.99 price display. Tracks click-through to purchase.",
    enabled: { production: true, staging: true, development: true },
    variants: [
      { name: "$9.99 (control)",   value: "9.99", weight: 50 },
      { name: "$8.99 (treatment)", value: "8.99", weight: 50 },
    ],
    tags: ["pricing", "experiment"],
  },
];

const CWV_METRICS: CWVMetric[] = [
  { name: "Largest Contentful Paint", abbr: "LCP",  value: 1.8,  unit: "s",  rating: "good",               good: 2.5, poor: 4.0, desc: "Time until the largest visible element is painted" },
  { name: "Interaction to Next Paint", abbr: "INP",  value: 148,  unit: "ms", rating: "needs-improvement",  good: 200, poor: 500, desc: "Latency of user interactions (click, tap, key)" },
  { name: "Cumulative Layout Shift",   abbr: "CLS",  value: 0.08, unit: "",   rating: "good",               good: 0.1, poor: 0.25, desc: "Unexpected layout shifts during page lifetime" },
  { name: "First Contentful Paint",    abbr: "FCP",  value: 0.9,  unit: "s",  rating: "good",               good: 1.8, poor: 3.0, desc: "Time until first text/image content is painted" },
  { name: "Time to First Byte",        abbr: "TTFB", value: 380,  unit: "ms", rating: "needs-improvement",  good: 800, poor: 1800, desc: "Time until server starts sending response" },
];

const RATING_CFG: Record<CWVRating, { color: string; bg: string; label: string }> = {
  "good":               { color: "#4ade80", bg: "#052e16",  label: "Good" },
  "needs-improvement":  { color: "#fbbf24", bg: "#451a03",  label: "Needs Work" },
  "poor":               { color: "#ef4444", bg: "#450a0a",  label: "Poor" },
};

const WAF_EVENTS: WafEvent[] = [
  { id:"w1",  timestamp:"15:47:22", ip:"185.220.101.45", country:"TOR", path:"/api/users?id=1 OR 1=1", method:"GET",  action:"block",      threat:"sql-injection",   rule:"SQLI-001", ua:"curl/7.85" },
  { id:"w2",  timestamp:"15:47:19", ip:"134.209.82.17",  country:"DE",  path:"/api/products",          method:"GET",  action:"allow",      threat:"clean",                            ua:"Mozilla/5.0 (Windows NT)" },
  { id:"w3",  timestamp:"15:47:15", ip:"45.142.212.12",  country:"RU",  path:"/login",                 method:"POST", action:"challenge",  threat:"bot",             rule:"BOT-004",  ua:"python-requests/2.28" },
  { id:"w4",  timestamp:"15:47:11", ip:"192.168.0.1",    country:"US",  path:"/api/search?q=<script>", method:"GET",  action:"block",      threat:"xss",             rule:"XSS-002",  ua:"Mozilla/5.0 (iPhone)" },
  { id:"w5",  timestamp:"15:47:08", ip:"10.0.0.42",      country:"VN",  path:"/checkout",              method:"POST", action:"allow",      threat:"clean",                            ua:"Mozilla/5.0 (Macintosh)" },
  { id:"w6",  timestamp:"15:47:05", ip:"198.20.69.98",   country:"US",  path:"/../etc/passwd",         method:"GET",  action:"block",      threat:"path-traversal",  rule:"PT-001",   ua:"Googlebot/2.1" },
  { id:"w7",  timestamp:"15:47:02", ip:"77.83.247.81",   country:"NL",  path:"/api/orders",            method:"GET",  action:"rate-limit", threat:"ddos",            rule:"RL-10s",   ua:"fasthttp" },
  { id:"w8",  timestamp:"15:46:59", ip:"172.104.60.144", country:"SG",  path:"/api/products",          method:"GET",  action:"allow",      threat:"clean",                            ua:"Mozilla/5.0 (Linux; Android)" },
];

const ACTION_CFG: Record<WafAction, { color: string; bg: string; icon: string }> = {
  allow:      { color: "#4ade80", bg: "#052e16", icon: "✓" },
  block:      { color: "#ef4444", bg: "#450a0a", icon: "✕" },
  challenge:  { color: "#fbbf24", bg: "#451a03", icon: "?" },
  "rate-limit":{ color: "#f97316", bg: "#431407", icon: "⏳" },
};

const THREAT_CFG: Record<WafThreat, { color: string; label: string }> = {
  clean:           { color: "#4ade80", label: "Clean" },
  "sql-injection": { color: "#ef4444", label: "SQLi" },
  xss:             { color: "#f97316", label: "XSS" },
  bot:             { color: "#fbbf24", label: "Bot" },
  ddos:            { color: "#8b5cf6", label: "DDoS" },
  "path-traversal":{ color: "#ef4444", label: "Path Trav." },
};

const FLAG_KIND_CFG: Record<FlagKind, { color: string; icon: string }> = {
  boolean:      { color: "#818cf8", icon: "⚡" },
  multivariate: { color: "#22d3ee", icon: "🔀" },
  percentage:   { color: "#34d399", icon: "%" },
  "kill-switch":{ color: "#ef4444", icon: "☠" },
  experiment:   { color: "#f59e0b", icon: "🧪" },
};

const BEST_PRACTICE_SECTIONS = [
  {
    id: "pr", icon: "🔍", title: "Pull Request Standards",
    items: [
      "PRs must have ≥1 approval from a different team member",
      "No PR merges on Friday after 4pm (no YOLO deploys)",
      "PR description must include: Problem / Solution / Screenshots / Test Plan",
      "All CI checks must pass before merge (unit, e2e, lint, type-check)",
      "PR size limit: ≤400 lines diff (enforce via Danger.js bot)",
      "Squash merge to main — clean, linear history",
    ],
    code: `// .github/PULL_REQUEST_TEMPLATE.md
## What does this PR do?
<!-- Link to ticket: Closes TICKET-XXX -->

## Screenshots / recordings
<!-- Required for any UI change -->

## How to test
1. ...

## Checklist
- [ ] Tests added/updated
- [ ] Accessible (keyboard, screenreader)
- [ ] No console.log left in code
- [ ] Storybook story added/updated`,
  },
  {
    id: "dod", icon: "✅", title: "Definition of Done",
    items: [
      "Feature works across Chrome, Firefox, Safari, Edge",
      "Mobile responsive (≥320px width)",
      "WCAG 2.1 AA: keyboard navigable, screenreader tested",
      "Unit tests cover all branches (RTL for components, Jest for utils)",
      "E2E test added for critical user paths",
      "Storybook story with all states (loading, error, empty, populated)",
      "Feature flag added if risk level medium or above",
      "Datadog dashboard alert configured for new metrics",
    ],
    code: `// scripts/check-dod.ts — runs in CI as a GitHub Action check
const DOD_CHECKS = [
  checkHasTests,         // ≥1 test file changed with source
  checkA11y,             // axe-core scan passes
  checkHasStory,         // Storybook story exists
  checkNoBigBundles,     // bundle-size check (webpack-bundle-analyzer)
  checkNoConsoleLog,     // ESLint no-console rule
  checkTypeErrors,       // tsc --noEmit passes
];

for (const check of DOD_CHECKS) {
  const result = await check(changedFiles, config);
  if (!result.passed) core.setFailed(result.message);
}`,
  },
  {
    id: "branch", icon: "🌿", title: "Branching & Deployment Strategy",
    items: [
      "main → production (auto-deploy via Vercel on merge)",
      "Feature branches: feat/TICKET-description",
      "Preview deployments: every PR gets a unique Vercel URL",
      "Hotfix: hotfix/TICKET → main direct merge (skips staging)",
      "Release freeze: Friday 3pm → Monday 9am (no production deploys)",
      "Feature flag mandatory for features with >medium risk",
    ],
    code: `# Vercel project config (vercel.json)
{
  "buildCommand": "pnpm build",
  "devCommand": "pnpm dev",
  "framework": "nextjs",
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        { "key": "X-Content-Type-Options",    "value": "nosniff" },
        { "key": "X-Frame-Options",            "value": "DENY" },
        { "key": "Referrer-Policy",            "value": "strict-origin-when-cross-origin" },
        { "key": "Permissions-Policy",         "value": "camera=(), microphone=(), geolocation=()" }
      ]
    }
  ],
  "rewrites": [
    { "source": "/api/:path*", "destination": "https://api.internal/:path*" }
  ]
}`,
  },
  {
    id: "security", icon: "🔒", title: "Security Baseline",
    items: [
      "Akamai WAF in front of all Vercel origins (SQL injection, XSS, path traversal)",
      "Rate limiting: 100 req/10s per IP on API routes (Akamai RL rules)",
      "Bot management: challenge JS-incapable crawlers (Akamai Bot Manager)",
      "CSP header: strict-dynamic, nonce-based (no unsafe-inline)",
      "All secrets in Vercel env vars — never in code or .env committed",
      "Dependency audit: npm audit runs in CI, Dependabot PRs auto-merged for patch",
      "SAST: GitHub CodeQL analysis on every PR",
    ],
    code: `// next.config.ts — CSP nonce-based header
import crypto from "crypto";

export default {
  async headers() {
    const nonce = crypto.randomBytes(16).toString("base64");
    return [{
      source: "/(.*)",
      headers: [{
        key: "Content-Security-Policy",
        value: [
          \`default-src 'self'\`,
          \`script-src 'self' 'nonce-\${nonce}' 'strict-dynamic'\`,
          \`style-src  'self' 'nonce-\${nonce}'\`,
          \`img-src    'self' data: https://cdn.example.com\`,
          \`connect-src 'self' https://api.example.com https://browser-intake-datadoghq.com\`,
          \`frame-ancestors 'none'\`,
          \`upgrade-insecure-requests\`,
        ].join("; "),
      }],
    }];
  },
};`,
  },
];

// Sparkline helper — simple SVG polyline
function Sparkline({ data, color, height = 36 }: { data: number[]; color: string; height?: number }) {
  const w = 120;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const points = data.map((v, i) =>
    `${(i / (data.length - 1)) * w},${height - ((v - min) / range) * (height - 4) - 2}`
  ).join(" ");
  const lastPoint = points.split(" ").slice(-1)[0]!;
  return (
    <svg width={w} height={height} style={{ display: "block" }}>
      <polyline points={points} fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={lastPoint.split(",")[0]} cy={lastPoint.split(",")[1]} r={3} fill={color} />
    </svg>
  );
}

// CWV gauge bar
function CWVBar({ value, good, poor, unit }: { value: number; good: number; poor: number; unit: string }) {
  const max = poor * 1.4;
  const pct = Math.min((value / max) * 100, 100);
  const goodPct = (good / max) * 100;
  const poorPct = (poor / max) * 100;
  return (
    <div style={{ position: "relative", height: 8, background: "#1e293b", borderRadius: 4, overflow: "hidden", marginTop: 6 }}>
      <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: `${goodPct}%`, background: "#4ade8030" }} />
      <div style={{ position: "absolute", left: `${goodPct}%`, top: 0, bottom: 0, width: `${poorPct - goodPct}%`, background: "#fbbf2430" }} />
      <div style={{ position: "absolute", left: `${poorPct}%`, top: 0, bottom: 0, right: 0, background: "#ef444430" }} />
      <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: `${pct}%`, maxWidth: "100%", background: pct < goodPct ? "#4ade80" : pct < poorPct ? "#fbbf24" : "#ef4444", borderRadius: 4, transition: "width 0.6s ease" }} />
    </div>
  );
}

// Toggle switch component
function Toggle({ on, onChange, disabled }: { on: boolean; onChange: (v: boolean) => void; disabled?: boolean }) {
  return (
    <button
      role="switch"
      aria-checked={on}
      onClick={() => !disabled && onChange(!on)}
      style={{
        width: 40, height: 22, borderRadius: 11,
        background: on ? "#6366f1" : "#334155",
        border: "none", cursor: disabled ? "default" : "pointer",
        position: "relative", flexShrink: 0,
        transition: "background 0.2s", opacity: disabled ? 0.4 : 1,
      }}
    >
      <div style={{
        position: "absolute", top: 3, left: on ? 21 : 3,
        width: 16, height: 16, borderRadius: "50%",
        background: "#fff", transition: "left 0.2s",
      }} />
    </button>
  );
}

// ─────────────────────────────────────────────────────────────────
// Main Demo
// ─────────────────────────────────────────────────────────────────

export function EngineeringPracticesDemo() {
  const [activeTab, setActiveTab] = useState<"flags" | "rum" | "waf" | "practices">("flags");
  const [flags, setFlags]         = useState<FeatureFlag[]>(INITIAL_FLAGS);
  const [env, setEnv]             = useState<FlagEnv>("production");
  const [selectedFlag, setSelectedFlag] = useState<string | null>("new-dashboard-ui");
  const [wafSearch, setWafSearch] = useState("");
  const [practiceId, setPracticeId] = useState("pr");

  // Simulated live RUM counters
  const [activeUsers, setActiveUsers] = useState(847);
  const [errorRate, setErrorRate]     = useState(0.3);
  const [lcp, setLcp]                 = useState(1.8);
  const [rumHistory]                  = useState(() =>
    Array.from({ length: 20 }, (_, i) => 1.2 + Math.sin(i * 0.4) * 0.6 + Math.random() * 0.4)
  );

  useEffect(() => {
    const t = setInterval(() => {
      setActiveUsers(u => u + Math.floor(Math.random() * 5) - 2);
      setErrorRate(r => Math.max(0, Math.min(5, r + (Math.random() - 0.5) * 0.1)));
    }, 2000);
    return () => clearInterval(t);
  }, []);

  const toggleFlag = useCallback((key: string, e: FlagEnv) => {
    setFlags(prev => prev.map(f => f.key !== key ? f : {
      ...f, enabled: { ...f.enabled, [e]: !f.enabled[e] },
    }));
  }, []);

  const selectedFlagData = flags.find(f => f.key === selectedFlag);
  const filteredWaf = WAF_EVENTS.filter(e =>
    !wafSearch || e.ip.includes(wafSearch) || e.path.includes(wafSearch) || e.threat.includes(wafSearch)
  );
  const activePractice = BEST_PRACTICE_SECTIONS.find(s => s.id === practiceId)!;

  // Demo: maintenance mode flag affects a visible banner
  const maintenanceOn = flags.find(f => f.key === "maintenance-mode")?.enabled[env];
  const newUiOn       = flags.find(f => f.key === "new-dashboard-ui")?.enabled[env];
  const aiSearchOn    = flags.find(f => f.key === "ai-search")?.enabled[env];

  return (
    <div style={{ background: "#0f172a", color: "#f1f5f9", fontFamily: "'Inter', system-ui, sans-serif", minHeight: "100vh", padding: 24 }}>
      {/* Header */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
          <span style={{ fontSize: 28 }}>⚙</span>
          <div>
            <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800 }}>Engineering Best Practices</h1>
            <p style={{ margin: 0, color: "#64748b", fontSize: 13 }}>
              LaunchDarkly · Datadog RUM · Akamai WAF · Vercel · Security standards
            </p>
          </div>
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {["LaunchDarkly", "Datadog RUM", "Akamai WAF", "Vercel", "GitHub Actions", "CSP / Security headers", "Definition of Done", "PR standards"].map(t => (
            <span key={t} style={{ background: "#1e293b", color: "#94a3b8", border: "1px solid #334155", borderRadius: 20, padding: "3px 10px", fontSize: 11 }}>{t}</span>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 4, marginBottom: 20, borderBottom: "1px solid #1e293b", paddingBottom: 4 }}>
        {[
          { id: "flags"     as const, label: "🚩 Feature Flags" },
          { id: "rum"       as const, label: "📊 Datadog RUM" },
          { id: "waf"       as const, label: "🛡 Akamai WAF" },
          { id: "practices" as const, label: "📋 Best Practices" },
        ].map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{
            background: activeTab === tab.id ? "#1e293b" : "transparent",
            color: activeTab === tab.id ? "#f1f5f9" : "#64748b",
            border: activeTab === tab.id ? "1px solid #334155" : "1px solid transparent",
            borderRadius: "8px 8px 0 0", padding: "8px 18px",
            cursor: "pointer", fontSize: 13, fontWeight: 600,
          }}>{tab.label}</button>
        ))}
      </div>

      {/* ── Feature Flags ── */}
      {activeTab === "flags" && (
        <div>
          {/* Maintenance banner — live response to flag toggle */}
          {maintenanceOn && (
            <div style={{ background: "#431407", border: "1px solid #ef4444", borderRadius: 8, padding: "10px 16px", marginBottom: 14, display: "flex", gap: 10, alignItems: "center" }}>
              <span style={{ fontSize: 18 }}>🔧</span>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: "#f87171" }}>Scheduled Maintenance</div>
                <div style={{ fontSize: 11, color: "#fca5a5" }}>The system is undergoing maintenance. Some features may be unavailable.</div>
              </div>
            </div>
          )}

          {/* Live demo panel — shows flag effects */}
          <div style={{ background: "#1e293b", border: "1px solid #334155", borderRadius: 10, padding: 16, marginBottom: 16 }}>
            <div style={{ fontSize: 11, color: "#64748b", marginBottom: 10, fontWeight: 700 }}>LIVE PREVIEW — flag effects in current env ({env})</div>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              <div style={{ background: "#0f172a", borderRadius: 8, padding: 12, fontSize: 12, border: "1px solid #334155", flex: 1, minWidth: 160 }}>
                <div style={{ fontSize: 10, color: "#64748b", marginBottom: 4 }}>Dashboard UI</div>
                <div style={{ color: newUiOn ? "#4ade80" : "#94a3b8", fontWeight: 600 }}>
                  {newUiOn ? "✓ New design (RSC)" : "Legacy layout"}
                </div>
              </div>
              <div style={{ background: "#0f172a", borderRadius: 8, padding: 12, fontSize: 12, border: "1px solid #334155", flex: 1, minWidth: 160 }}>
                <div style={{ fontSize: 10, color: "#64748b", marginBottom: 4 }}>Search</div>
                <div style={{ color: aiSearchOn ? "#4ade80" : "#94a3b8", fontWeight: 600 }}>
                  {aiSearchOn ? "✓ AI semantic search" : "Keyword search"}
                </div>
              </div>
              <div style={{ background: "#0f172a", borderRadius: 8, padding: 12, fontSize: 12, border: "1px solid #334155", flex: 1, minWidth: 160 }}>
                <div style={{ fontSize: 10, color: "#64748b", marginBottom: 4 }}>Maintenance</div>
                <div style={{ color: maintenanceOn ? "#ef4444" : "#4ade80", fontWeight: 600 }}>
                  {maintenanceOn ? "⚠ Banner showing" : "Normal operation"}
                </div>
              </div>
            </div>
          </div>

          {/* Env selector */}
          <div style={{ display: "flex", gap: 6, marginBottom: 14 }}>
            {(["production", "staging", "development"] as FlagEnv[]).map(e => (
              <button key={e} onClick={() => setEnv(e)} style={{
                background: env === e ? "#6366f1" : "#1e293b",
                border: `1px solid ${env === e ? "#6366f1" : "#334155"}`,
                borderRadius: 6, padding: "4px 12px",
                color: env === e ? "#fff" : "#64748b", cursor: "pointer", fontSize: 12, fontWeight: 600,
              }}>
                {e === "production" ? "🔴" : e === "staging" ? "🟡" : "🟢"} {e}
              </button>
            ))}
          </div>

          <div style={{ display: "flex", gap: 16 }}>
            {/* Flag list */}
            <div style={{ flex: 1 }}>
              {flags.map(flag => {
                const kc = FLAG_KIND_CFG[flag.kind];
                const isOn = flag.enabled[env];
                return (
                  <div
                    key={flag.key}
                    onClick={() => setSelectedFlag(k => k === flag.key ? null : flag.key)}
                    style={{
                      background: selectedFlag === flag.key ? "#1e3a5f" : "#1e293b",
                      border: `1px solid ${selectedFlag === flag.key ? "#6366f1" : "#334155"}`,
                      borderRadius: 10, padding: 12, marginBottom: 8, cursor: "pointer",
                      transition: "all 0.15s",
                    }}
                  >
                    <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                      <Toggle
                        on={isOn}
                        onChange={() => toggleFlag(flag.key, env)}
                      />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap" }}>
                          <span style={{ fontSize: 13, fontWeight: 700, color: "#f1f5f9" }}>{flag.name}</span>
                          <span style={{ background: kc.color + "20", color: kc.color, fontSize: 9, fontWeight: 700, padding: "1px 6px", borderRadius: 4 }}>
                            {kc.icon} {flag.kind}
                          </span>
                          {flag.tags.map(t => (
                            <span key={t} style={{ background: "#334155", color: "#94a3b8", fontSize: 9, padding: "1px 5px", borderRadius: 3 }}>{t}</span>
                          ))}
                        </div>
                        <div style={{ fontSize: 11, color: "#64748b", marginTop: 2 }}>{flag.description}</div>
                      </div>
                      <span style={{ fontSize: 11, color: isOn ? "#4ade80" : "#475569", fontWeight: 600, flexShrink: 0 }}>
                        {isOn ? "ON" : "OFF"}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Flag detail */}
            {selectedFlagData && (
              <div style={{ width: 280, flexShrink: 0, background: "#1e293b", border: "1px solid #334155", borderRadius: 10, padding: 16, height: "fit-content" }}>
                <div style={{ fontSize: 10, color: "#64748b", fontWeight: 700, marginBottom: 4 }}>FLAG DETAIL</div>
                <div style={{ fontSize: 14, fontWeight: 800, color: "#f1f5f9", marginBottom: 8 }}>{selectedFlagData.name}</div>

                {/* Env status grid */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 6, marginBottom: 12 }}>
                  {(["production", "staging", "development"] as FlagEnv[]).map(e => (
                    <div key={e} style={{ background: "#0f172a", borderRadius: 6, padding: "6px 8px", textAlign: "center" }}>
                      <div style={{ fontSize: 9, color: "#64748b" }}>{e.slice(0,4)}</div>
                      <div style={{ fontSize: 11, fontWeight: 700, color: selectedFlagData.enabled[e] ? "#4ade80" : "#475569" }}>
                        {selectedFlagData.enabled[e] ? "ON" : "OFF"}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Variants */}
                {selectedFlagData.variants && (
                  <div style={{ marginBottom: 12 }}>
                    <div style={{ fontSize: 10, color: "#64748b", fontWeight: 700, marginBottom: 6 }}>VARIANTS</div>
                    {selectedFlagData.variants.map(v => (
                      <div key={v.value} style={{ marginBottom: 6 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "#94a3b8", marginBottom: 2 }}>
                          <span>{v.name}</span><span>{v.weight}%</span>
                        </div>
                        <div style={{ height: 4, background: "#0f172a", borderRadius: 2, overflow: "hidden" }}>
                          <div style={{ height: "100%", width: `${v.weight}%`, background: "#6366f1", borderRadius: 2 }} />
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Percentage rollout */}
                {selectedFlagData.percentage !== undefined && (
                  <div style={{ marginBottom: 12 }}>
                    <div style={{ fontSize: 10, color: "#64748b", fontWeight: 700, marginBottom: 6 }}>ROLLOUT</div>
                    <div style={{ fontSize: 20, fontWeight: 800, color: "#34d399" }}>{selectedFlagData.percentage}%</div>
                    <div style={{ height: 6, background: "#0f172a", borderRadius: 3, overflow: "hidden", marginTop: 4 }}>
                      <div style={{ height: "100%", width: `${selectedFlagData.percentage}%`, background: "#34d399", borderRadius: 3 }} />
                    </div>
                  </div>
                )}

                {/* SDK snippet */}
                <div style={{ background: "#0f172a", borderRadius: 6, padding: 8, fontSize: 10, fontFamily: "monospace", color: "#94a3b8", lineHeight: 1.6 }}>
                  {`const show = useFlags()\n  ['${selectedFlagData.key}'];\n\nreturn show\n  ? <NewFeature />\n  : <Legacy />;`}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Datadog RUM ── */}
      {activeTab === "rum" && (
        <div>
          {/* Live counters */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 20 }}>
            {[
              { label: "Active sessions",   value: activeUsers.toLocaleString(),    color: "#818cf8", sparkData: rumHistory, note: "live" },
              { label: "Error rate",        value: `${errorRate.toFixed(2)}%`,       color: errorRate > 1 ? "#ef4444" : "#4ade80", sparkData: rumHistory.map(v => v * 0.2), note: "1h avg" },
              { label: "Page views / min",  value: "1,284",                          color: "#22d3ee", sparkData: rumHistory.map(v => v * 800), note: "5m avg" },
              { label: "Frustration signals",value: "12",                            color: "#fbbf24", sparkData: rumHistory.map(v => Math.max(0, v - 1.5) * 20), note: "last hour" },
            ].map(m => (
              <div key={m.label} style={{ background: "#1e293b", border: `1px solid ${m.color}20`, borderRadius: 10, padding: 14 }}>
                <div style={{ fontSize: 10, color: "#64748b", marginBottom: 2 }}>{m.label}</div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
                  <div>
                    <div style={{ fontSize: 22, fontWeight: 800, color: m.color }}>{m.value}</div>
                    <div style={{ fontSize: 9, color: "#475569" }}>{m.note}</div>
                  </div>
                  <Sparkline data={m.sparkData} color={m.color} />
                </div>
              </div>
            ))}
          </div>

          {/* Core Web Vitals */}
          <div style={{ background: "#1e293b", border: "1px solid #334155", borderRadius: 10, padding: 16, marginBottom: 16 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: "#f1f5f9", marginBottom: 14, display: "flex", justifyContent: "space-between" }}>
              <span>Core Web Vitals — p75</span>
              <span style={{ fontSize: 10, color: "#64748b" }}>Last 24 hours · All pages</span>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(5,1fr)", gap: 12 }}>
              {CWV_METRICS.map(m => {
                const rc = RATING_CFG[m.rating];
                return (
                  <div key={m.abbr} style={{ background: "#0f172a", borderRadius: 8, padding: 12 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 4 }}>
                      <div style={{ fontSize: 18, fontWeight: 800, color: rc.color }}>
                        {m.value}{m.unit}
                      </div>
                      <span style={{ background: rc.bg, color: rc.color, fontSize: 9, padding: "2px 6px", borderRadius: 4, fontWeight: 700, border: `1px solid ${rc.color}40` }}>
                        {rc.label}
                      </span>
                    </div>
                    <div style={{ fontSize: 10, fontWeight: 700, color: "#94a3b8" }}>{m.abbr}</div>
                    <div style={{ fontSize: 9, color: "#475569", lineHeight: 1.4, marginTop: 2, marginBottom: 6 }}>{m.desc}</div>
                    <CWVBar value={m.value} good={m.good} poor={m.poor} unit={m.unit} />
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 8, color: "#475569", marginTop: 3 }}>
                      <span>Good &lt;{m.good}{m.unit}</span>
                      <span>Poor &gt;{m.poor}{m.unit}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Session replay mockup */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            <div style={{ background: "#1e293b", border: "1px solid #334155", borderRadius: 10, padding: 16 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: "#f1f5f9", marginBottom: 12 }}>Recent Errors</div>
              {[
                { msg: "TypeError: Cannot read properties of undefined (reading 'map')", count: 34, file: "ProductList.tsx:142" },
                { msg: "ChunkLoadError: Loading chunk 'checkout' failed", count: 12, file: "dynamic import" },
                { msg: "Network Error: POST /api/orders 503", count: 8, file: "api/orders.ts:89" },
                { msg: "React Error 130: Minified React error", count: 3, file: "App.tsx:67" },
              ].map((e, i) => (
                <div key={i} style={{ display: "flex", gap: 10, padding: "8px 0", borderBottom: i < 3 ? "1px solid #0f172a" : "none" }}>
                  <span style={{ background: "#450a0a", color: "#ef4444", fontSize: 10, fontWeight: 800, padding: "2px 6px", borderRadius: 4, flexShrink: 0, height: "fit-content" }}>{e.count}×</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 11, color: "#f87171", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{e.msg}</div>
                    <div style={{ fontSize: 10, color: "#475569" }}>{e.file}</div>
                  </div>
                </div>
              ))}
            </div>

            <div style={{ background: "#1e293b", border: "1px solid #334155", borderRadius: 10, padding: 16 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: "#f1f5f9", marginBottom: 12 }}>Session Replay</div>
              <div style={{ background: "#0f172a", borderRadius: 8, padding: 12, height: 160, display: "flex", flexDirection: "column", gap: 8, overflow: "hidden" }}>
                {/* Simulated timeline */}
                {[
                  { t: "0:00", action: "Page load → /dashboard",   icon: "📄", color: "#818cf8" },
                  { t: "0:04", action: "Click: Products tab",       icon: "👆", color: "#22d3ee" },
                  { t: "0:11", action: "Scroll 40%",                icon: "↕",  color: "#64748b" },
                  { t: "0:16", action: "Click: Add to cart #4421",  icon: "🛒", color: "#4ade80" },
                  { t: "0:22", action: "Error: network timeout",    icon: "⚠",  color: "#ef4444" },
                  { t: "0:28", action: "Rage click × 4 — checkout", icon: "💢", color: "#f97316" },
                ].map((s, i) => (
                  <div key={i} style={{ display: "flex", gap: 8, alignItems: "center", fontSize: 11 }}>
                    <span style={{ fontFamily: "monospace", fontSize: 9, color: "#475569", flexShrink: 0, width: 32 }}>{s.t}</span>
                    <span style={{ fontSize: 13 }}>{s.icon}</span>
                    <span style={{ color: s.color }}>{s.action}</span>
                  </div>
                ))}
              </div>
              <div style={{ marginTop: 8, fontSize: 10, color: "#475569" }}>Session replay — 6 events · 28s · rage click detected</div>
            </div>
          </div>
        </div>
      )}

      {/* ── WAF ── */}
      {activeTab === "waf" && (
        <div>
          {/* Stats */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12, marginBottom: 16 }}>
            {[
              { label: "Requests / sec", value: "2,847",  color: "#818cf8" },
              { label: "Blocked",        value: "99.7%",  color: "#ef4444" },
              { label: "Challenges",     value: "0.2%",   color: "#fbbf24" },
              { label: "Clean (passed)", value: "43.8%",  color: "#4ade80" },
            ].map(s => (
              <div key={s.label} style={{ background: "#1e293b", border: `1px solid ${s.color}20`, borderRadius: 10, padding: 14 }}>
                <div style={{ fontSize: 10, color: "#64748b", marginBottom: 2 }}>{s.label}</div>
                <div style={{ fontSize: 22, fontWeight: 800, color: s.color }}>{s.value}</div>
              </div>
            ))}
          </div>

          {/* Rule summary */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
            <div style={{ background: "#1e293b", border: "1px solid #334155", borderRadius: 10, padding: 14 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: "#f1f5f9", marginBottom: 10 }}>Active Rules</div>
              {[
                { rule: "SQLI-001", name: "SQL Injection", action: "block", hits: 1243 },
                { rule: "XSS-002",  name: "Cross-Site Scripting", action: "block", hits: 887 },
                { rule: "BOT-004",  name: "Bot Detection", action: "challenge", hits: 4521 },
                { rule: "PT-001",   name: "Path Traversal", action: "block", hits: 234 },
                { rule: "RL-10s",   name: "Rate Limit (10 req/s)", action: "rate-limit", hits: 3102 },
              ].map(r => {
                const ac = ACTION_CFG[r.action as WafAction];
                return (
                  <div key={r.rule} style={{ display: "flex", gap: 8, alignItems: "center", padding: "6px 0", borderBottom: "1px solid #0f172a" }}>
                    <code style={{ fontSize: 10, color: "#7dd3fc", whiteSpace: "nowrap" }}>{r.rule}</code>
                    <span style={{ flex: 1, fontSize: 11, color: "#94a3b8" }}>{r.name}</span>
                    <span style={{ background: ac.bg, color: ac.color, fontSize: 9, padding: "1px 5px", borderRadius: 4, fontWeight: 700 }}>{r.action}</span>
                    <span style={{ fontSize: 10, color: "#475569", fontFamily: "monospace", flexShrink: 0 }}>{r.hits.toLocaleString()}</span>
                  </div>
                );
              })}
            </div>

            <div style={{ background: "#1e293b", border: "1px solid #334155", borderRadius: 10, padding: 14 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: "#f1f5f9", marginBottom: 10 }}>Threat Distribution</div>
              {(["sql-injection", "bot", "ddos", "xss", "path-traversal", "clean"] as WafThreat[]).map(t => {
                const tc = THREAT_CFG[t];
                const pct = { "sql-injection": 22, bot: 38, ddos: 18, xss: 8, "path-traversal": 5, clean: 9 }[t];
                return (
                  <div key={t} style={{ marginBottom: 8 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "#94a3b8", marginBottom: 3 }}>
                      <span style={{ color: tc.color }}>{tc.label}</span><span>{pct}%</span>
                    </div>
                    <div style={{ height: 4, background: "#0f172a", borderRadius: 2 }}>
                      <div style={{ height: "100%", width: `${pct}%`, background: tc.color, borderRadius: 2 }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Request log */}
          <div style={{ background: "#1e293b", border: "1px solid #334155", borderRadius: 10, overflow: "hidden" }}>
            <div style={{ padding: "10px 14px", borderBottom: "1px solid #334155", display: "flex", gap: 10, alignItems: "center" }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: "#f1f5f9" }}>Request Log</span>
              <input
                type="search" placeholder="Filter IP, path, threat..."
                value={wafSearch} onChange={e => setWafSearch(e.target.value)}
                aria-label="Filter WAF events"
                style={{ background: "#0f172a", border: "1px solid #334155", borderRadius: 6, padding: "4px 10px", color: "#f1f5f9", fontSize: 11, width: 200, outline: "none", marginLeft: "auto" }}
              />
            </div>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11 }}>
              <thead>
                <tr style={{ background: "#0f172a" }}>
                  {["Time", "IP", "Method", "Path", "Threat", "Action", "Rule"].map(h => (
                    <th key={h} style={{ padding: "7px 12px", textAlign: "left", color: "#64748b", fontWeight: 700, fontSize: 10, borderBottom: "2px solid #334155", whiteSpace: "nowrap" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredWaf.map(ev => {
                  const ac = ACTION_CFG[ev.action];
                  const tc = THREAT_CFG[ev.threat];
                  return (
                    <tr key={ev.id} style={{ borderBottom: "1px solid #0f172a" }}>
                      <td style={{ padding: "6px 12px", fontFamily: "monospace", color: "#475569" }}>{ev.timestamp}</td>
                      <td style={{ padding: "6px 12px" }}>
                        <div style={{ fontFamily: "monospace", color: "#94a3b8" }}>{ev.ip}</div>
                        <div style={{ fontSize: 9, color: "#475569" }}>{ev.country}</div>
                      </td>
                      <td style={{ padding: "6px 12px", color: "#94a3b8", fontFamily: "monospace" }}>{ev.method}</td>
                      <td style={{ padding: "6px 12px", maxWidth: 200, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", color: "#94a3b8", fontFamily: "monospace", fontSize: 10 }}>{ev.path}</td>
                      <td style={{ padding: "6px 12px" }}>
                        <span style={{ color: tc.color, fontSize: 10, fontWeight: 600 }}>{tc.label}</span>
                      </td>
                      <td style={{ padding: "6px 12px" }}>
                        <span style={{ background: ac.bg, color: ac.color, fontSize: 9, fontWeight: 700, padding: "2px 6px", borderRadius: 4 }}>{ac.icon} {ev.action}</span>
                      </td>
                      <td style={{ padding: "6px 12px", fontFamily: "monospace", fontSize: 9, color: "#64748b" }}>{ev.rule ?? "—"}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Best Practices ── */}
      {activeTab === "practices" && (
        <div style={{ display: "flex", gap: 16 }}>
          {/* Sidebar */}
          <div style={{ width: 200, flexShrink: 0 }}>
            {BEST_PRACTICE_SECTIONS.map(s => (
              <button key={s.id} onClick={() => setPracticeId(s.id)} style={{
                display: "block", width: "100%", textAlign: "left",
                background: practiceId === s.id ? "#6366f120" : "#1e293b",
                border: `1px solid ${practiceId === s.id ? "#6366f1" : "#334155"}`,
                borderRadius: 8, padding: "10px 12px", marginBottom: 6,
                cursor: "pointer", color: practiceId === s.id ? "#a5b4fc" : "#94a3b8",
                fontSize: 12, fontWeight: practiceId === s.id ? 700 : 400,
              }}>
                {s.icon} {s.title}
              </button>
            ))}
          </div>

          {/* Content */}
          <div style={{ flex: 1 }}>
            <div style={{ background: "#1e293b", border: "1px solid #334155", borderRadius: 10, padding: 20, marginBottom: 16 }}>
              <div style={{ fontSize: 16, fontWeight: 800, color: "#f1f5f9", marginBottom: 14 }}>{activePractice.icon} {activePractice.title}</div>
              <ul style={{ margin: 0, padding: "0 0 0 18px", display: "flex", flexDirection: "column", gap: 8 }}>
                {activePractice.items.map((item, i) => (
                  <li key={i} style={{ fontSize: 13, color: "#94a3b8", lineHeight: 1.6 }}>{item}</li>
                ))}
              </ul>
            </div>
            <div style={{ background: "#1e293b", border: "1px solid #334155", borderRadius: 10, overflow: "hidden" }}>
              <div style={{ padding: "8px 14px", borderBottom: "1px solid #334155", fontSize: 10, color: "#64748b", background: "#0f172a" }}>
                Implementation example
              </div>
              <pre style={{ margin: 0, padding: 16, fontSize: 11, fontFamily: "monospace", color: "#94a3b8", lineHeight: 1.7, overflow: "auto", maxHeight: 360 }}>
                <code>{activePractice.code}</code>
              </pre>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default EngineeringPracticesDemo;
