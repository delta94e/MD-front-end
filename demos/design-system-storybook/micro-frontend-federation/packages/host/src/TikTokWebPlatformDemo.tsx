/**
 * TikTokWebPlatformDemo.tsx
 *
 * TikTok Web Platform — Legal Compliance · i18n / RTL / Dark Mode · LB Docs · FMP Performance
 *
 * Achievements:
 *   1. URL Compliance   — legal-driven URL restructuring + internal LB traffic redirection
 *   2. i18n · RTL · DM  — multi-language, right-to-left layouts, dark mode (80K+ DAU page)
 *   3. FMP Optimisation — First Meaningful Paint reduction, 50K+ daily views
 *
 * TABS
 *   🔀 URL Compliance   — redirect rule manager, URL tester, LB config, stakeholder flow
 *   🌐 i18n · RTL · Dark — live language switcher (RTL flip for AR), dark mode toggle
 *   ⚡ FMP Performance  — before/after metrics, resource waterfall, technique breakdown
 */

import React, { useState, useEffect, useRef } from "react";

// ─────────────────────────────────────────────────────────────────
// URL Compliance types
// ─────────────────────────────────────────────────────────────────

type RedirectType = "301" | "302" | "rewrite";
type RuleStatus   = "active" | "staging" | "deprecated";

interface RedirectRule {
  id: string; pattern: string; destination: string;
  type: RedirectType; status: RuleStatus;
  reason: string; owner: string; deployedAt: string;
}

const REDIRECT_RULES: RedirectRule[] = [
  {
    id: "r1", pattern: "/live/:username",
    destination: "/creator/:username/live",
    type: "301", status: "active",
    reason: "Legal: separate creator namespace for GDPR deletion requests",
    owner: "Legal / Platform", deployedAt: "2024-02-14",
  },
  {
    id: "r2", pattern: "/t/:shortcode",
    destination: "/video/:shortcode",
    type: "301", status: "active",
    reason: "Legal: short-link scheme deprecated per data minimisation policy",
    owner: "Legal / SEO", deployedAt: "2024-03-01",
  },
  {
    id: "r3", pattern: "/user/:uid/privacy",
    destination: "/settings/privacy",
    type: "302", status: "active",
    reason: "Regulatory: GDPR Art.13 disclosure must be at canonical settings URL",
    owner: "Legal / Compliance", deployedAt: "2024-03-18",
  },
  {
    id: "r4", pattern: "/ads/transparency/:id",
    destination: "/about/ads/:id",
    type: "301", status: "staging",
    reason: "EU DSA: Ads transparency registry must use /about namespace",
    owner: "Legal / EU Policy", deployedAt: "staging",
  },
  {
    id: "r5", pattern: "/shop/product/:id",
    destination: "/shop/p/:id",
    type: "rewrite", status: "deprecated",
    reason: "Shop URL shortening — superseded by canonical /shop/p/:id",
    owner: "Shop Platform", deployedAt: "2023-11-01",
  },
];

const typeColor = (t: RedirectType) => t === "301" ? "#22c55e" : t === "302" ? "#f59e0b" : "#0ea5e9";
const statusColor = (s: RuleStatus) => s === "active" ? "#22c55e" : s === "staging" ? "#f59e0b" : "#475569";

const matchRule = (url: string, rules: RedirectRule[]): { rule: RedirectRule | null; matched: string } => {
  for (const rule of rules.filter(r => r.status !== "deprecated")) {
    const regexStr = rule.pattern.replace(/:[\w]+/g, "([^/]+)").replace(/\//g, "\\/");
    const regex = new RegExp("^" + regexStr + "(/.*)?$");
    if (regex.test(url)) {
      const dest = rule.destination.replace(/:[\w]+/g, (ph) => {
        const idx = ((rule.pattern.match(/:[\w]+/g) ?? []) as string[]).indexOf(ph);
        const match = url.match(regex);
        return match ? (match[idx + 1] || ph.slice(1)) : ph.slice(1);
      });
      return { rule, matched: dest };
    }
  }
  return { rule: null, matched: url };
};

// ─────────────────────────────────────────────────────────────────
// i18n / RTL / Dark Mode types
// ─────────────────────────────────────────────────────────────────

interface LangConfig { code: string; label: string; flag: string; rtl: boolean; greeting: string; subline: string; cta: string; navItems: string[] }
const LANGS: LangConfig[] = [
  { code: "en", label: "English", flag: "🇺🇸", rtl: false, greeting: "Welcome to TikTok", subline: "Videos that inspire the world", cta: "Explore Now", navItems: ["Home", "Discover", "Create", "Inbox", "Profile"] },
  { code: "ar", label: "العربية", flag: "🇸🇦", rtl: true,  greeting: "مرحبًا بك في تيك توك", subline: "مقاطع فيديو تُلهم العالم", cta: "استكشف الآن", navItems: ["الرئيسية", "اكتشف", "أنشئ", "صندوق الوارد", "ملفي"] },
  { code: "ja", label: "日本語", flag: "🇯🇵", rtl: false, greeting: "TikTokへようこそ", subline: "世界にインスピレーションを与える動画", cta: "今すぐ探索", navItems: ["ホーム", "発見", "作成", "受信箱", "プロフィール"] },
  { code: "ko", label: "한국어", flag: "🇰🇷", rtl: false, greeting: "틱톡에 오신 것을 환영합니다", subline: "세상에 영감을 주는 동영상", cta: "지금 탐색", navItems: ["홈", "탐색", "만들기", "받은 편지함", "프로필"] },
  { code: "de", label: "Deutsch", flag: "🇩🇪", rtl: false, greeting: "Willkommen bei TikTok", subline: "Videos, die die Welt inspirieren", cta: "Jetzt erkunden", navItems: ["Startseite", "Entdecken", "Erstellen", "Posteingang", "Profil"] },
];

// ─────────────────────────────────────────────────────────────────
// Performance types
// ─────────────────────────────────────────────────────────────────

interface PerfMetric { label: string; before: number; after: number; unit: string; icon: string; color: string; goodThreshold: number }
const PERF_METRICS: PerfMetric[] = [
  { label: "FMP",  before: 4.2,  after: 1.8,  unit: "s", icon: "🖼",  color: "#fe2c55", goodThreshold: 2.0 },
  { label: "FCP",  before: 3.1,  after: 1.1,  unit: "s", icon: "⚡",  color: "#f59e0b", goodThreshold: 1.8 },
  { label: "LCP",  before: 5.8,  after: 2.4,  unit: "s", icon: "🏆",  color: "#0ea5e9", goodThreshold: 2.5 },
  { label: "TBT",  before: 840,  after: 120,  unit: "ms",icon: "🔒",  color: "#a855f7", goodThreshold: 200 },
  { label: "CLS",  before: 0.28, after: 0.04, unit: "",  icon: "📏",  color: "#22c55e", goodThreshold: 0.1 },
];

interface WaterfallItem { label: string; start: number; dur: number; color: string; beforeStart: number; beforeDur: number }
const WATERFALL: WaterfallItem[] = [
  { label: "HTML Document",       start: 0,    dur: 12,  color: "#3b82f6", beforeStart: 0,    beforeDur: 28  },
  { label: "Critical CSS",        start: 12,   dur: 18,  color: "#22c55e", beforeStart: 28,   beforeDur: 45  },
  { label: "Preloaded Hero Font", start: 14,   dur: 20,  color: "#a855f7", beforeStart: 73,   beforeDur: 60  },
  { label: "JS Bundle (main)",    start: 30,   dur: 40,  color: "#f59e0b", beforeStart: 73,   beforeDur: 180 },
  { label: "Hero Image",          start: 32,   dur: 25,  color: "#fe2c55", beforeStart: 253,  beforeDur: 180 },
  { label: "JS Bundle (vendor)",  start: 0,    dur: 0,   color: "#64748b", beforeStart: 73,   beforeDur: 240 },
  { label: "Lazy: Comments",      start: 320,  dur: 30,  color: "#0ea5e9", beforeStart: 433,  beforeDur: 80  },
];

interface Technique { icon: string; label: string; description: string; impact: string; color: string }
const TECHNIQUES: Technique[] = [
  { icon: "✂", label: "Code Splitting",  color: "#f59e0b", impact: "JS: 4.8MB → 420KB initial", description: "Route-level dynamic import. Only load the code the current page needs. Vendor bundle moved to lazy." },
  { icon: "🎨", label: "Critical CSS",   color: "#22c55e", impact: "Render-blocking CSS eliminated", description: "Extract above-the-fold CSS. Inline it in <head>. Move non-critical styles to async load." },
  { icon: "🖼", label: "Image Optimisation", color: "#0ea5e9", impact: "Hero image: 2.4MB → 180KB", description: "WebP conversion + srcset for device pixel ratios. Avoids serving 2× images to 1× screens." },
  { icon: "⏩", label: "Preload Hints",  color: "#a855f7", impact: "Font/hero: discovered earlier", description: "<link rel=preload> for hero font and LCP image. Browser fetches them during HTML parse." },
  { icon: "💤", label: "Lazy Loading",   color: "#fe2c55", impact: "Below-fold deferred by 300ms+", description: "IntersectionObserver: load comments, related videos, and ads only when approaching viewport." },
  { icon: "🗜", label: "Bundle Analysis", color: "#64748b", impact: "moment.js, lodash removed", description: "webpack-bundle-analyzer: found 3 unused libraries (280KB). Replaced with lighter alternatives." },
];

// ─────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────

function CodeBlock({ code, label, color = "#64748b" }: { code: string; label?: string; color?: string }) {
  return (
    <div style={{ background: "#0a0a14", borderRadius: 8, overflow: "hidden", border: "1px solid #1e293b" }}>
      {label && <div style={{ padding: "5px 12px", borderBottom: "1px solid #1e293b", fontSize: 10, color }}>{label}</div>}
      <pre style={{ margin: 0, padding: 12, fontSize: 9, fontFamily: "monospace", color: "#94a3b8", lineHeight: 1.7, overflow: "auto", maxHeight: 260 }}>{code}</pre>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
// Main
// ─────────────────────────────────────────────────────────────────

export function TikTokWebPlatformDemo() {
  const [activeTab, setActiveTab] = useState<"compliance" | "i18n" | "perf">("compliance");

  // ── Compliance
  const [testUrl, setTestUrl]       = useState("/live/johndoe");
  const [testResult, setTestResult] = useState<{ rule: RedirectRule | null; matched: string } | null>(null);
  const [selectedRule, setSelectedRule] = useState<RedirectRule | null>(REDIRECT_RULES[0]);
  const [deploying, setDeploying]   = useState(false);
  const [deployStep, setDeployStep] = useState(-1);

  const testUrlMatch = () => setTestResult(matchRule(testUrl, REDIRECT_RULES));

  const simulateDeploy = async () => {
    setDeploying(true); setDeployStep(0);
    const steps = 5;
    for (let i = 0; i < steps; i++) {
      await new Promise(r => setTimeout(r, 500));
      setDeployStep(i + 1);
    }
    setDeploying(false); setDeployStep(-1);
  };

  const DEPLOY_STEPS = ["Validate rule syntax", "Dry-run against staging LB", "Legal sign-off", "Deploy to edge nodes", "Verify redirects live"];

  // ── i18n / RTL / Dark
  const [lang, setLang]       = useState<LangConfig>(LANGS[0]);
  const [darkMode, setDarkMode] = useState(false);
  const [fontSize, setFontSize] = useState(14);

  const bg     = darkMode ? "#0f172a" : "#f8fafc";
  const card   = darkMode ? "#1e293b" : "#ffffff";
  const text   = darkMode ? "#f1f5f9" : "#1e293b";
  const muted  = darkMode ? "#64748b" : "#94a3b8";
  const border = darkMode ? "#334155" : "#e2e8f0";
  const accent = "#fe2c55";

  // ── Performance
  const [perfMode, setPerfMode]     = useState<"before" | "after">("before");
  const [animating, setAnimating]   = useState(false);
  const [wfProgress, setWfProgress] = useState<number[]>([]);
  const animRef = useRef(false);

  const runWaterfall = async (mode: "before" | "after") => {
    if (animRef.current) return; animRef.current = true;
    setAnimating(true); setWfProgress([]);
    const totalMs = mode === "before" ? 600 : 400;
    const items = WATERFALL.filter(w => mode === "before" || w.dur > 0);
    for (let i = 0; i < items.length; i++) {
      await new Promise(r => setTimeout(r, 50));
      setWfProgress(prev => [...prev, 1]);
    }
    setAnimating(false); animRef.current = false;
  };

  useEffect(() => { runWaterfall("before"); }, []);

  const TABS = [
    { id: "compliance" as const, label: "🔀 URL Compliance"   },
    { id: "i18n"       as const, label: "🌐 i18n · RTL · Dark" },
    { id: "perf"       as const, label: "⚡ FMP Performance"   },
  ];

  return (
    <div style={{ background: "#0f172a", color: "#f1f5f9", fontFamily: "'Inter', system-ui, sans-serif", minHeight: "100vh", padding: 24 }}>
      {/* Header */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
          <div style={{ width: 36, height: 36, borderRadius: 8, background: "linear-gradient(135deg,#fe2c55,#25f4ee)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>♪</div>
          <div>
            <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800 }}>TikTok Web Platform — Compliance · i18n · Performance</h1>
            <p style={{ margin: 0, color: "#64748b", fontSize: 13 }}>URL restructuring · Multi-language / RTL / Dark mode · FMP optimisation · LB onboarding docs</p>
          </div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8 }}>
          {[
            { v: "301/302",   l: "Legal URL Compliance",  c: "#22c55e", sub: "Internal LB · SEO preserved"       },
            { v: "5 Locales", l: "i18n + RTL + Dark",     c: "#f59e0b", sub: "80K+ DAU · AR/HE RTL support"      },
            { v: "−57%",      l: "FMP Reduction",         c: "#0ea5e9", sub: "4.2s → 1.8s · 50K+ daily views"    },
            { v: "Docs",      l: "LB Onboarding Guide",   c: "#a855f7", sub: "Developer ramp-up accelerated"      },
          ].map(m => (
            <div key={m.l} style={{ background: "#1e293b", border: `1px solid ${m.c}20`, borderRadius: 10, padding: "10px 12px" }}>
              <div style={{ fontSize: 18, fontWeight: 900, color: m.c }}>{m.v}</div>
              <div style={{ fontSize: 9, fontWeight: 700 }}>{m.l}</div>
              <div style={{ fontSize: 8, color: "#475569", marginTop: 2 }}>{m.sub}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 4, marginBottom: 20, borderBottom: "1px solid #1e293b", paddingBottom: 4 }}>
        {TABS.map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{ background: activeTab === tab.id ? "#1e293b" : "transparent", color: activeTab === tab.id ? "#f1f5f9" : "#64748b", border: activeTab === tab.id ? "1px solid #334155" : "1px solid transparent", borderRadius: "8px 8px 0 0", padding: "8px 28px", cursor: "pointer", fontSize: 13, fontWeight: 600 }}>{tab.label}</button>
        ))}
      </div>

      {/* ── URL COMPLIANCE ── */}
      {activeTab === "compliance" && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
          {/* Left: rule manager + URL tester */}
          <div>
            <div style={{ fontSize: 10, fontWeight: 700, color: "#64748b", marginBottom: 8, letterSpacing: "0.08em" }}>REDIRECT RULE MANAGER — 5 ACTIVE RULES</div>

            {/* URL tester */}
            <div style={{ background: "#1e293b", border: "1px solid #334155", borderRadius: 10, padding: 12, marginBottom: 10 }}>
              <div style={{ fontSize: 8, color: "#64748b", marginBottom: 6 }}>🔍 URL Tester — enter a URL to see which rule matches</div>
              <div style={{ display: "flex", gap: 6 }}>
                <input value={testUrl} onChange={e => { setTestUrl(e.target.value); setTestResult(null); }} onKeyDown={e => e.key === "Enter" && testUrlMatch()} placeholder="/live/username or /t/abc123" style={{ flex: 1, background: "#0f172a", border: "1px solid #334155", borderRadius: 6, padding: "6px 10px", color: "#f1f5f9", fontSize: 10, outline: "none", fontFamily: "monospace" }} />
                <button onClick={testUrlMatch} style={{ background: "#22c55e20", border: "1px solid #22c55e40", borderRadius: 6, padding: "6px 14px", cursor: "pointer", color: "#4ade80", fontSize: 9, fontWeight: 700 }}>Test</button>
              </div>
              {testResult && (
                <div style={{ marginTop: 8, background: "#0f172a", borderRadius: 7, padding: "8px 10px" }}>
                  {testResult.rule ? (
                    <>
                      <div style={{ display: "flex", gap: 6, alignItems: "center", marginBottom: 4 }}>
                        <span style={{ fontSize: 7, background: typeColor(testResult.rule.type) + "20", color: typeColor(testResult.rule.type), borderRadius: 3, padding: "0 6px", fontWeight: 800 }}>{testResult.rule.type}</span>
                        <span style={{ fontSize: 8, color: "#22c55e" }}>✓ Rule matched: {testResult.rule.id}</span>
                      </div>
                      <div style={{ fontSize: 8, fontFamily: "monospace" }}>
                        <span style={{ color: "#ef4444" }}>{testUrl}</span>
                        <span style={{ color: "#64748b" }}> → </span>
                        <span style={{ color: "#4ade80" }}>{testResult.matched}</span>
                      </div>
                      <div style={{ fontSize: 7, color: "#475569", marginTop: 3 }}>{testResult.rule.reason}</div>
                    </>
                  ) : (
                    <div style={{ fontSize: 8, color: "#64748b" }}>No rule matched. Request passes through unchanged.</div>
                  )}
                </div>
              )}
            </div>

            {/* Rules list */}
            <div style={{ display: "flex", flexDirection: "column", gap: 5, marginBottom: 10 }}>
              {REDIRECT_RULES.map(rule => (
                <div key={rule.id} onClick={() => setSelectedRule(rule)} style={{ background: selectedRule?.id === rule.id ? "#1e3a5f" : "#1e293b", border: `1px solid ${selectedRule?.id === rule.id ? "#3b82f6" : statusColor(rule.status) + "30"}`, borderRadius: 9, padding: "9px 12px", cursor: "pointer" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                    <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                      <span style={{ fontSize: 7, background: typeColor(rule.type) + "20", color: typeColor(rule.type), borderRadius: 3, padding: "0 6px", fontWeight: 800 }}>{rule.type}</span>
                      <span style={{ fontSize: 8, fontFamily: "monospace", fontWeight: 700 }}>{rule.pattern}</span>
                    </div>
                    <span style={{ fontSize: 7, background: statusColor(rule.status) + "20", color: statusColor(rule.status), borderRadius: 3, padding: "0 6px" }}>{rule.status}</span>
                  </div>
                  <div style={{ display: "flex", gap: 4, alignItems: "center", fontSize: 7, color: "#64748b" }}>
                    <span>→</span>
                    <span style={{ fontFamily: "monospace", color: "#94a3b8" }}>{rule.destination}</span>
                  </div>
                  <div style={{ fontSize: 7, color: "#475569", marginTop: 3 }}>{rule.reason}</div>
                </div>
              ))}
            </div>

            {/* Deploy simulation */}
            <div style={{ background: "#1e293b", border: "1px solid #334155", borderRadius: 10, padding: 12 }}>
              <div style={{ fontSize: 8, fontWeight: 700, marginBottom: 8 }}>🚀 Deploy to Internal LB — Simulation</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 5, marginBottom: 10 }}>
                {DEPLOY_STEPS.map((step, i) => {
                  const done = deployStep > i;
                  const active = deployStep === i;
                  return (
                    <div key={step} style={{ display: "flex", gap: 7, alignItems: "center" }}>
                      <div style={{ width: 16, height: 16, borderRadius: "50%", background: done ? "#22c55e" : active ? "#f59e0b" : "#1e293b", border: `2px solid ${done ? "#22c55e" : active ? "#f59e0b" : "#334155"}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 7, flexShrink: 0 }}>{done ? "✓" : i + 1}</div>
                      <span style={{ fontSize: 8, color: done ? "#4ade80" : active ? "#fbbf24" : "#475569" }}>{step}</span>
                    </div>
                  );
                })}
              </div>
              <button onClick={simulateDeploy} disabled={deploying} style={{ width: "100%", background: deploying ? "#334155" : "#22c55e20", border: `1px solid ${deploying ? "#334155" : "#22c55e"}`, borderRadius: 7, padding: "7px", cursor: deploying ? "not-allowed" : "pointer", color: deploying ? "#64748b" : "#4ade80", fontSize: 9, fontWeight: 700 }}>
                {deploying ? `Deploying… (Step ${deployStep}/${DEPLOY_STEPS.length})` : "Simulate Deployment"}
              </button>
            </div>
          </div>

          {/* Right: code */}
          <div>
            <div style={{ fontSize: 10, fontWeight: 700, color: "#64748b", marginBottom: 8, letterSpacing: "0.08em" }}>IMPLEMENTATION DEPTH</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <CodeBlock label="Legal URL compliance — why, how, and what makes it hard" color="#22c55e" code={
`// LEGAL URL RESTRUCTURING: THE CONTEXT
//
// WHY URLS MATTER FOR LEGAL COMPLIANCE:
// Regulations don't just dictate content. They dictate URL STRUCTURE.
//
// GDPR RIGHT TO ERASURE (Art. 17):
// When a user requests account deletion, TikTok must delete ALL their data.
// This includes: removing their content from the platform.
// Problem: /live/:username — the username IS in the URL.
// If a user deletes their account, URLs containing their username remain indexed.
// Google: shows cached pages with their username even after deletion.
// Legal requirement: restructure to /creator/:username/live.
// Why? The new structure allows serving a 410 Gone (content deleted) on a namespace basis.
// The redirect: tells Google to update its index (301 = permanent, follow the new URL).
//
// EU DIGITAL SERVICES ACT (DSA):
// Art. 39: Advertising transparency. TikTok must maintain a searchable ads registry.
// Legal: "The ads transparency pages must be reachable under /about/."
// Why /about/?: regulatory precedent. Other platforms (Meta, Google) use /about/ for compliance.
// Legal inspectors: know to look there.
// The redirect: /ads/transparency/:id → /about/ads/:id.
// 302 (temporary) not 301: the ads transparency feature is still evolving.
// We might restructure again. 301 would be premature.
//
// 301 vs 302 — WHY THIS MATTERS (the SEO + legal intersection):
// 301 = Permanent redirect.
//   Search engines: transfer ~90% of link equity to the new URL.
//   Old URL: eventually deindexed.
//   Use when: the old URL is gone forever. The new URL is canonical.
//
// 302 = Temporary redirect.
//   Search engines: keep the old URL in the index (they'll come back to it).
//   Link equity: NOT transferred.
//   Use when: the redirect might change. Or when legal requires the old URL to persist.
//
// REWRITE vs REDIRECT:
// Redirect (301/302): the browser receives a new URL. Address bar changes.
//   User: sees the new URL. Bookmark: will save the new URL.
//   Search engines: update their index.
// Rewrite: the URL stays the same in the browser. The server internally maps it.
//   User: never sees the internal URL. Transparent.
//   Use for: internal URL normalisation that should be invisible to users and search.`} />

              <CodeBlock label="TikTok internal LB — config syntax, deployment process, docs" color="#0ea5e9" code={
`// TIKTOK'S INTERNAL LOAD BALANCER — HOW IT WORKS
// (simplified representation; actual internal details confidential)
//
// TikTok's internal LB sits in front of all web traffic.
// It handles: routing, redirects, rewrites, A/B traffic splits, rate limiting.
// It is NOT nginx. It is a custom system optimised for TikTok's scale.
//
// RULE CONFIGURATION (conceptual schema):
{
  "id": "legal-live-namespace-2024",
  "match": {
    "path_pattern": "/live/:username",
    "methods": ["GET", "HEAD"]
  },
  "action": {
    "type": "redirect",
    "status_code": 301,
    "destination": "/creator/{username}/live",
    "preserve_query": true  // keeps ?share=... UTM params
  },
  "metadata": {
    "owner": "platform-team@",
    "legal_ticket": "LEGAL-2024-0312",
    "stakeholders": ["legal@", "product@", "seo@"],
    "deployed": "2024-02-14T09:00:00Z"
  }
}
//
// THE DEPLOYMENT PROCESS (why it's careful):
// 1. VALIDATE: rule syntax checked against the LB config validator.
//    Invalid rules: caught before they touch production.
// 2. DRY RUN: the LB simulates the rule against live traffic (shadow mode).
//    Confirms: the rule matches what we expect and ONLY what we expect.
//    Critical: a poorly written regex could match URLs we didn't intend.
// 3. LEGAL SIGN-OFF: the legal team confirms the rule satisfies the requirement.
//    Not just "it redirects". "It satisfies Art.17 / DSA Art.39 as written."
// 4. DEPLOY TO EDGE NODES:
//    TikTok operates in multiple regions. Rules: deployed to all edge nodes.
//    Rollout: staged (10% → 50% → 100%) to catch unexpected behaviour.
// 5. VERIFY:
//    Automated: hit the old URLs, confirm redirect to new URLs, confirm status codes.
//    Manual: legal team verifies the end-to-end user journey.
//
// WHY I WROTE THE ONBOARDING DOCS:
// After my first compliance redirect: I needed to understand the LB config format.
// Spent 3 days reverse-engineering examples. Asked 5 different engineers.
// After completing the feature: documented everything I learned.
// The docs: covered config schema, deployment steps, common mistakes, and debugging.
// Next engineer who needed to do a compliance redirect: used the docs.
// They completed it in 4 hours (vs my 3 days). That's the value of documentation.
// "The best time to write docs: right after you finish the task.
//  You remember everything. The pain is fresh. You know exactly what was unclear."`} />
            </div>
          </div>
        </div>
      )}

      {/* ── i18n / RTL / DARK MODE ── */}
      {activeTab === "i18n" && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
          {/* Left: live demo */}
          <div>
            <div style={{ fontSize: 10, fontWeight: 700, color: "#64748b", marginBottom: 8, letterSpacing: "0.08em" }}>LIVE DEMO — 80K+ DAU PAGE (SELECT LANGUAGE TO SEE RTL FLIP)</div>

            {/* Controls */}
            <div style={{ display: "flex", gap: 6, marginBottom: 10, flexWrap: "wrap" }}>
              {LANGS.map(l => (
                <button key={l.code} onClick={() => setLang(l)} style={{ display: "flex", alignItems: "center", gap: 4, background: lang.code === l.code ? "#fe2c5520" : "#1e293b", border: `1px solid ${lang.code === l.code ? "#fe2c55" : "#334155"}`, borderRadius: 7, padding: "5px 10px", cursor: "pointer", color: lang.code === l.code ? "#fe2c55" : "#64748b", fontSize: 9, fontWeight: 600 }}>
                  <span>{l.flag}</span> <span>{l.label}</span>
                  {l.rtl && <span style={{ fontSize: 6, background: "#f59e0b20", color: "#f59e0b", borderRadius: 2, padding: "0 4px" }}>RTL</span>}
                </button>
              ))}
              <button onClick={() => setDarkMode(d => !d)} style={{ background: darkMode ? "#f1f5f920" : "#1e293b", border: `1px solid ${darkMode ? "#f1f5f9" : "#334155"}`, borderRadius: 7, padding: "5px 10px", cursor: "pointer", color: darkMode ? "#f1f5f9" : "#64748b", fontSize: 9 }}>
                {darkMode ? "☀ Light" : "🌙 Dark"}
              </button>
            </div>

            {/* Simulated TikTok page */}
            <div dir={lang.rtl ? "rtl" : "ltr"} style={{ background: bg, border: `1px solid ${border}`, borderRadius: 12, overflow: "hidden", transition: "background 0.3s, color 0.3s", color: text, fontFamily: lang.code === "ja" ? "'Noto Sans JP', sans-serif" : lang.code === "ar" ? "'Noto Sans Arabic', sans-serif" : "inherit" }}>
              {/* Navbar */}
              <div style={{ background: darkMode ? "#1e293b" : "#fff", borderBottom: `1px solid ${border}`, padding: "10px 16px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ fontWeight: 900, fontSize: 14, color: "#fe2c55", fontFamily: lang.rtl ? "serif" : "inherit" }}>TikTok</div>
                <div style={{ display: "flex", gap: 14 }}>
                  {lang.navItems.map((item, i) => (
                    <span key={i} style={{ fontSize: 9, color: i === 0 ? "#fe2c55" : muted, fontWeight: i === 0 ? 700 : 400 }}>{item}</span>
                  ))}
                </div>
                <div style={{ width: 28, height: 28, borderRadius: "50%", background: "#fe2c55", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, color: "#fff" }}>T</div>
              </div>

              {/* Hero */}
              <div style={{ padding: "20px 20px 16px", background: darkMode ? "linear-gradient(135deg,#1e293b,#0f172a)" : "linear-gradient(135deg,#fff5f5,#fff)" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 5 }}>
                  {lang.rtl && <div style={{ fontSize: 7, background: "#f59e0b20", color: "#f59e0b", borderRadius: 3, padding: "1px 6px", fontWeight: 700 }}>RTL ⟵</div>}
                  <div style={{ fontSize: 7, background: "#0ea5e920", color: "#38bdf8", borderRadius: 3, padding: "1px 6px" }}>{lang.flag} {lang.label}</div>
                  {darkMode && <div style={{ fontSize: 7, background: "#1e293b", color: "#64748b", borderRadius: 3, padding: "1px 6px", border: "1px solid #334155" }}>🌙 Dark</div>}
                </div>
                <h2 style={{ margin: "0 0 6px", fontSize: 18, fontWeight: 900, color: text, direction: lang.rtl ? "rtl" : "ltr", transition: "all 0.3s" }}>{lang.greeting}</h2>
                <p style={{ margin: "0 0 12px", fontSize: 10, color: muted }}>{lang.subline}</p>
                <button style={{ background: "#fe2c55", border: "none", borderRadius: 6, padding: "8px 20px", cursor: "pointer", color: "#fff", fontSize: 10, fontWeight: 700 }}>{lang.cta}</button>
              </div>

              {/* Content grid */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, padding: "12px 16px" }}>
                {["🎵", "💃", "🤣"].map((emoji, i) => (
                  <div key={i} style={{ background: darkMode ? "#334155" : "#f1f5f9", borderRadius: 8, padding: "10px", textAlign: "center" }}>
                    <div style={{ fontSize: 22, marginBottom: 4 }}>{emoji}</div>
                    <div style={{ fontSize: 7, color: muted, direction: lang.rtl ? "rtl" : "ltr" }}>{lang.navItems[1]}</div>
                    <div style={{ fontSize: 8, fontWeight: 700, color: text }}>1.{i + 2}M</div>
                  </div>
                ))}
              </div>

              {/* RTL indicator */}
              {lang.rtl && (
                <div style={{ background: "#f59e0b10", borderTop: `1px solid ${border}`, padding: "8px 16px", fontSize: 7, color: "#f59e0b", textAlign: lang.rtl ? "right" : "left" }}>
                  ⚠ RTL layout active — all layout is mirrored: text, icons, scroll direction, padding/margin
                </div>
              )}
            </div>

            {/* CSS logical properties demo */}
            <div style={{ marginTop: 10, background: "#1e293b", border: "1px solid #334155", borderRadius: 10, padding: 12 }}>
              <div style={{ fontSize: 8, fontWeight: 700, marginBottom: 8 }}>CSS Logical Properties — RTL-safe vs Physical</div>
              <div style={{ display: "flex", gap: 8 }}>
                <div style={{ flex: 1, background: "#ef444415", border: "1px solid #ef444430", borderRadius: 6, padding: "8px 10px" }}>
                  <div style={{ fontSize: 7, color: "#f87171", fontWeight: 700, marginBottom: 4 }}>❌ Physical (RTL-broken)</div>
                  {["margin-left: 16px", "padding-right: 8px", "border-left: 2px solid", "text-align: left", "float: left"].map(p => <div key={p} style={{ fontSize: 7, fontFamily: "monospace", color: "#94a3b8" }}>{p}</div>)}
                </div>
                <div style={{ flex: 1, background: "#22c55e15", border: "1px solid #22c55e30", borderRadius: 6, padding: "8px 10px" }}>
                  <div style={{ fontSize: 7, color: "#4ade80", fontWeight: 700, marginBottom: 4 }}>✓ Logical (RTL-safe)</div>
                  {["margin-inline-start: 16px", "padding-inline-end: 8px", "border-inline-start: 2px solid", "text-align: start", "float: inline-start"].map(p => <div key={p} style={{ fontSize: 7, fontFamily: "monospace", color: "#94a3b8" }}>{p}</div>)}
                </div>
              </div>
            </div>
          </div>

          {/* Right: code */}
          <div>
            <div style={{ fontSize: 10, fontWeight: 700, color: "#64748b", marginBottom: 8, letterSpacing: "0.08em" }}>IMPLEMENTATION DEPTH</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <CodeBlock label="RTL layout — dir attribute, logical properties, icon mirroring" color="#f59e0b" code={
`// RTL SUPPORT: NOT JUST "ADD dir=rtl"
// RTL languages: Arabic, Hebrew, Farsi, Urdu.
// TikTok's Arabic market: significant and growing.
// Getting RTL wrong: feels deeply disrespectful to Arabic-speaking users.
// Getting it right: requires understanding HOW Arabic speakers read.
//
// STEP 1: HTML dir attribute
// Set dir="rtl" on the root container (or <html>).
// This: flips the browser's inline direction.
// Text: flows right-to-left.
// Flex rows: start from the right.
// Input cursor: appears on the right.
// THIS IS NOT ENOUGH. Read on.
//
// STEP 2: CSS LOGICAL PROPERTIES (the critical part)
// Physical properties: assume LTR.
//   margin-left: 16px  →  in RTL: this is now on the END side. Wrong.
//   padding-right: 8px →  in RTL: this is now on the START side. Wrong.
//
// Logical properties: relative to the inline direction.
//   margin-inline-start: 16px  →  always the START of text flow.
//   padding-inline-end:  8px   →  always the END of text flow.
//   border-inline-start: ...   →  left in LTR, right in RTL.
//   text-align: start          →  left in LTR, right in RTL.
//
// Every time I wrote a physical property (margin-left): potential RTL bug.
// Migration: replaced all physical spacing properties with logical equivalents.
// Added ESLint rule: warn on margin-left / padding-right / float: left in shared components.
//
// STEP 3: ICON MIRRORING
// Some icons: directional. They need to flip in RTL.
// Back arrow (←): in RTL, becomes (→).
// Checkmark, close, play: NOT directional. Do NOT flip.
// Rule: flip icons that indicate direction. Don't flip icons that don't.
// CSS: [dir="rtl"] .icon-directional { transform: scaleX(-1); }
// OR: use separate icon assets for LTR and RTL.
// We used CSS transform: simpler. One asset. Two presentations.
//
// STEP 4: BIDIRECTIONAL TEXT (BIDI)
// Mixed content: Arabic text with English product names.
// "أشترِ iPhone 15 الآن" — "iPhone 15" should stay LTR within the RTL sentence.
// Unicode Bidi algorithm: handles this automatically.
// BUT: you must use <bdi> tag or dir="auto" on inline elements.
// Without it: numbers or English words can appear in the wrong position.
//
// STEP 5: DARK MODE
// Strategy: CSS custom properties (variables) on :root.
// Separate values per theme, applied by adding a class to <html>.
//
// :root {
//   --bg-primary:   #ffffff;
//   --text-primary: #1e293b;
//   --border:       #e2e8f0;
// }
// [data-theme="dark"] {
//   --bg-primary:   #0f172a;
//   --text-primary: #f1f5f9;
//   --border:       #334155;
// }
//
// Components: use var(--bg-primary) not hardcoded #ffffff.
// Theme switch: change data-theme on <html>. All variables: update.
// No JS required for the color changes. Pure CSS.
//
// USER PREFERENCE:
// prefers-color-scheme media query: detect OS dark mode setting.
// Initialize the theme from the user's OS setting.
// Allow manual override: store in localStorage.
// Priority: localStorage > OS preference.`} />

              <CodeBlock label="i18n architecture — translation loading, locale detection, pluralization" color="#0ea5e9" code={
`// i18n: MULTI-LANGUAGE SUPPORT ARCHITECTURE
//
// THE PROBLEM: TikTok operates in 150+ markets. 40+ languages.
// Each language: different text. Different number formats. Different date formats.
// Pluralization rules: radically different per language.
//
// TOOLING: react-i18next (wrapper over i18next)
//
// TRANSLATION FILE STRUCTURE:
// public/locales/
//   en/            common.json, creator.json, video.json...
//   ar/            common.json, creator.json, video.json...
//   ja/            common.json...
//
// LAZY LOADING TRANSLATIONS:
// Don't load all 40 language files on page load.
// Only load the user's language. On language change: load the new one.
// i18next backend plugin: fetches /locales/{lang}/{namespace}.json on demand.
//
// LOCALE DETECTION (priority order):
// 1. User's saved preference (localStorage: "preferred_lang")
// 2. URL path segment (/ar/ prefix → Arabic)
// 3. Accept-Language HTTP header (sent by browser)
// 4. Default: "en"
//
// PLURALIZATION: the subtlety that trips up most engineers
// English: 1 video, 2 videos. Simple.
// Arabic: 6 plural forms (zero, one, two, few, many, other).
//   0 videos:    "لا توجد مقاطع فيديو"
//   1 video:     "مقطع فيديو واحد"
//   2 videos:    "مقطعان فيديو"
//   3-10 videos: "3 مقاطع فيديو"
//   11+ videos:  "11 مقطع فيديو"
//
// i18next + Intl.PluralRules: handles this automatically.
// You define translation keys for each plural form.
// The library: selects the correct form based on the count.
//
// WHAT I IMPLEMENTED ON THE 80K DAU PAGE:
// The page: TikTok's creator discovery/ranking page.
// Traffic: 80,000+ daily active users, multiple regions.
// Languages added: Arabic (RTL), Japanese, Korean, German.
// RTL: entire page layout flips. Sidebar: moves to the right.
// Numbers: formatted per locale (German: 1.234.567 not 1,234,567).
// Dates: "June 18" in English, "18. Juni" in German, "6月18日" in Japanese.
// Currency: different per region (some pages show creator earnings in local currency).
//
// TESTING RTL:
// Cannot just eyeball it. Checked with native Arabic speakers.
// Found: icon mirroring missed on the share button.
// Found: notification dot appeared on wrong side.
// Fix: systematic audit of every directional visual element.`} />
            </div>
          </div>
        </div>
      )}

      {/* ── FMP PERFORMANCE ── */}
      {activeTab === "perf" && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
          {/* Left: metrics + waterfall */}
          <div>
            <div style={{ fontSize: 10, fontWeight: 700, color: "#64748b", marginBottom: 8, letterSpacing: "0.08em" }}>FMP OPTIMISATION — 50K+ DAILY VIEWS</div>

            {/* Before/After toggle */}
            <div style={{ display: "flex", gap: 5, marginBottom: 10 }}>
              {(["before", "after"] as const).map(m => (
                <button key={m} onClick={() => { setPerfMode(m as "before" | "after"); setWfProgress([]); runWaterfall(m); }} style={{ flex: 1, background: perfMode === m ? (m === "before" ? "#ef444420" : "#22c55e20") : "#1e293b", border: `1px solid ${perfMode === m ? (m === "before" ? "#ef4444" : "#22c55e") : "#334155"}`, borderRadius: 7, padding: "7px", cursor: "pointer", color: perfMode === m ? (m === "before" ? "#f87171" : "#4ade80") : "#64748b", fontSize: 9, fontWeight: 700 }}>
                  {m === "before" ? "🔴 Before optimisation" : "🟢 After optimisation"}
                </button>
              ))}
            </div>

            {/* Metrics grid */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 6, marginBottom: 10 }}>
              {PERF_METRICS.map(m => {
                const val = perfMode === "before" ? m.before : m.after;
                const good = val <= m.goodThreshold;
                const reduction = ((m.before - m.after) / m.before * 100).toFixed(0);
                return (
                  <div key={m.label} style={{ background: "#1e293b", border: `1px solid ${good ? "#22c55e30" : "#ef444430"}`, borderRadius: 9, padding: "10px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 8, color: "#64748b", marginBottom: 3 }}>
                      <span>{m.icon} {m.label}</span>
                    </div>
                    <div style={{ fontSize: 18, fontWeight: 900, color: good ? "#22c55e" : "#ef4444", transition: "all 0.5s" }}>{val}{m.unit}</div>
                    {perfMode === "after" && (
                      <div style={{ fontSize: 7, color: "#4ade80", marginTop: 2 }}>−{reduction}% ↓</div>
                    )}
                    {perfMode === "before" && (
                      <div style={{ fontSize: 7, color: "#64748b", marginTop: 2 }}>threshold: {m.goodThreshold}{m.unit}</div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Resource waterfall */}
            <div style={{ background: "#1e293b", border: "1px solid #334155", borderRadius: 10, padding: 12, marginBottom: 10 }}>
              <div style={{ fontSize: 8, fontWeight: 700, marginBottom: 8 }}>Resource Waterfall ({perfMode})</div>
              {(() => {
                const totalWidth = perfMode === "before" ? 600 : 420;
                const items = WATERFALL.filter(w => perfMode === "before" || w.dur > 0);
                return items.map((w, i) => {
                  const start = perfMode === "before" ? w.beforeStart : w.start;
                  const dur   = perfMode === "before" ? w.beforeDur   : w.dur;
                  const show  = wfProgress.length > i;
                  return (
                    <div key={w.label} style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
                      <div style={{ width: 120, fontSize: 6, color: "#64748b", textAlign: "right", flexShrink: 0 }}>{w.label}</div>
                      <div style={{ flex: 1, height: 10, background: "#0f172a", borderRadius: 2, position: "relative" }}>
                        {show && (
                          <div style={{ position: "absolute", left: `${(start / totalWidth) * 100}%`, width: `${(dur / totalWidth) * 100}%`, height: "100%", background: w.color, borderRadius: 2, transition: "width 0.3s" }} />
                        )}
                      </div>
                      {show && <div style={{ fontSize: 6, color: "#475569", width: 35, flexShrink: 0 }}>{start}–{start + dur}ms</div>}
                    </div>
                  );
                });
              })()}
              <div style={{ display: "flex", justifyContent: "space-between", marginTop: 6 }}>
                <span style={{ fontSize: 7, color: "#475569" }}>0ms</span>
                <span style={{ fontSize: 7, color: perfMode === "before" ? "#ef4444" : "#22c55e", fontWeight: 700 }}>FMP: {perfMode === "before" ? "4,200ms" : "1,800ms"}</span>
                <span style={{ fontSize: 7, color: "#475569" }}>{perfMode === "before" ? "600ms scale" : "420ms scale"}</span>
              </div>
            </div>

            {/* Techniques grid */}
            <div>
              <div style={{ fontSize: 8, fontWeight: 700, color: "#64748b", marginBottom: 6 }}>OPTIMISATION TECHNIQUES APPLIED</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                {TECHNIQUES.map(t => (
                  <div key={t.label} style={{ background: "#1e293b", border: `1px solid ${t.color}20`, borderRadius: 7, padding: "8px 10px", display: "flex", gap: 8 }}>
                    <div style={{ width: 22, height: 22, borderRadius: 5, background: t.color + "20", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, flexShrink: 0 }}>{t.icon}</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: "flex", justifyContent: "space-between" }}>
                        <span style={{ fontSize: 8, fontWeight: 700 }}>{t.label}</span>
                        <span style={{ fontSize: 7, color: t.color }}>{t.impact}</span>
                      </div>
                      <div style={{ fontSize: 7, color: "#475569", marginTop: 2 }}>{t.description}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right: code */}
          <div>
            <div style={{ fontSize: 10, fontWeight: 700, color: "#64748b", marginBottom: 8, letterSpacing: "0.08em" }}>IMPLEMENTATION DEPTH</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <CodeBlock label="FMP — what it measures, why it matters, how to improve it" color="#0ea5e9" code={
`// FIRST MEANINGFUL PAINT: WHAT ENGINEERS OFTEN GET WRONG
//
// FMP: the moment when the primary content of the page becomes visible.
// NOT: the first pixel (FCP — First Contentful Paint).
// NOT: the page is fully interactive (TTI — Time To Interactive).
// YES: the specific content the user came for is visible.
//
// EXAMPLE: TikTok's creator discovery page (50K+ daily views).
// Primary content: the video grid / creator ranking list.
// Before FMP: user sees a white screen. Or a loading spinner.
// At FMP: the first meaningful grid of content is visible.
//
// WHY FMP AT 4.2s IS CATASTROPHIC:
// User expectation on web: content in <2s.
// If FMP > 3s: bounce rate spikes. Users leave.
// At 50K daily views: every second of FMP delay costs meaningful engagement.
// 1-second improvement in FMP: correlates with conversion uplift.
// Google's research: 1s → 3s load time = 32% increase in bounce probability.
//
// HOW WE DIAGNOSED 4.2s FMP:
// Tool: Chrome DevTools Performance panel + WebPageTest.
// Found: JavaScript was render-blocking. ALL JS loaded before ANY content rendered.
// Found: the main bundle: 4.8MB. Included: the entire component library,
//         moment.js (280KB), lodash (72KB), multiple chart libraries.
// Found: the hero image: 2.4MB JPEG, no compression, no srcset.
// Found: web fonts: loaded late (FOUT — Flash Of Unstyled Text during load).
//
// IMPROVEMENT 1: CODE SPLITTING (JS: 4.8MB → 420KB initial)
// Before: ONE bundle. Everything.
// After: Dynamic import for non-critical routes.
//   import(/* webpackChunkName: "comments" */ "./Comments")
//   import(/* webpackChunkName: "sidebar" */ "./Sidebar")
// Initial bundle: only the above-the-fold content.
// Comments, related videos, sidebar: loaded after FMP. Not blocking it.
// Impact: initial JS dropped 91%. Browser parses 420KB, not 4.8MB.
//
// IMPROVEMENT 2: CRITICAL CSS INLINING
// Before: <link href="styles.css"> — browser must download the full CSS before rendering.
// After:  <style>/* above-fold CSS only, ~8KB */</style> — inlined in HTML.
//         <link href="styles.css" media="print" onload="this.media='all'"> — async rest.
// Browser: renders above-the-fold content with inlined CSS immediately.
// Full CSS: loads async. Does not block FMP.
//
// IMPROVEMENT 3: PRELOAD HINTS
// <link rel="preload" href="/hero.webp" as="image">
// <link rel="preload" href="/fonts/inter.woff2" as="font" crossorigin>
// Browser: starts fetching these during HTML parse. Not after CSS → JS → page render.
// Hero image: discovered 200ms earlier.
// Font: no FOUT (text displays correctly from first render).
//
// IMPROVEMENT 4: IMAGE OPTIMISATION (2.4MB → 180KB)
// Converted: JPEG → WebP (same quality, 60-80% smaller).
// Added: srcset for responsive images.
//   <img srcset="hero-480.webp 480w, hero-1024.webp 1024w, hero-2048.webp 2048w"
//        sizes="(max-width: 640px) 480px, (max-width: 1200px) 1024px, 2048px"
//        src="hero-1024.webp" loading="lazy" (for below-fold images)>
// Users on mobile (480px): receive 480px image, not 2048px.
// Result: 93% image size reduction for mobile users.`} />

              <CodeBlock label="Onboarding docs — what good engineering documentation looks like" color="#a855f7" code={
`// INTERNAL LB ONBOARDING DOCUMENTATION
// Written AFTER completing the legal compliance redirect feature.
//
// WHY I WROTE IT:
// My onboarding experience with TikTok's internal LB system:
// - No docs. Just a Confluence page from 2021 that was 60% outdated.
// - Spent 3 days figuring out the config syntax.
// - Asked 5 different engineers (interrupting their work).
// - Made 2 mistakes in staging that required rollbacks.
//
// After I finished: I had the knowledge. The cost: 3 days.
// For the next engineer: I could eliminate that cost.
// Writing the docs: 4 hours. Return: every engineer who used them.
//
// WHAT GOOD ONBOARDING DOCS INCLUDE:
//
// 1. MENTAL MODEL (the "why" before the "how")
//   "The LB sits in front of all web traffic. Before a request reaches
//    any TikTok server: the LB decides where to send it.
//    Rules: evaluated top-to-bottom. First match wins. Be specific before general."
//
// 2. CONFIG REFERENCE (the exact schema, annotated)
//   Every field: explained with an example.
//   Common mistakes: documented ("if you forget preserve_query: true,
//   users lose their UTM params on redirect").
//
// 3. DEPLOYMENT GUIDE (step-by-step)
//   Exact commands. In order. With expected output.
//   What to do if step 3 fails: documented.
//
// 4. DEBUGGING GUIDE
//   "How do I know if my rule is matching?"
//   "The dry-run says it works but production doesn't — why?"
//   Common causes: regex escaping, path vs full URL matching.
//
// 5. STAKEHOLDER CHECKLIST
//   For legal compliance redirects specifically:
//   □ Get legal ticket number (required for rule metadata)
//   □ Confirm: 301 or 302 with legal team
//   □ Confirm: SEO impact with growth team
//   □ Get legal sign-off on staging before production deploy
//   □ Verify with legal team post-deploy
//
// OUTCOME:
// The docs: used by 3 engineers in the following 6 months.
// Each reported: completed in hours, not days.
// One engineer: caught a 302 vs 301 mistake using the checklist.
// Would have been a bug in production without the docs.
//
// THE PRINCIPLE:
// "Write docs right after you finish the task.
//  You remember everything. The pain is fresh.
//  You know exactly what was unclear.
//  6 months later: you've forgotten half of it."`} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default TikTokWebPlatformDemo;
