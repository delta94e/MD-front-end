/**
 * SGFinanceLeadDemo.tsx
 *
 * Engineering achievements:
 *   1. Led 9-engineer team building Singapore fintech app (Alipay-equivalent)
 *   2. App Store ranking lift via performance optimizations
 *   3. A/B tested UX updates → retention and conversion improvements
 *
 * TABS
 *   👥 Team Leadership   — org chart, sprint board, engineering principles
 *   🚀 Performance       — before/after metrics, live optimization simulator
 *   🧪 A/B Testing       — experiment dashboard, significance calculator
 */

import React, { useState, useEffect, useRef, useCallback } from "react";

// ─────────────────────────────────────────────────────────────────
// Team data
// ─────────────────────────────────────────────────────────────────

const ENGINEERS = [
  { id: "e1",  name: "Tech Lead (Me)",  domain: "Architecture & Platform",  level: "Staff",   icon: "⭐" },
  { id: "e2",  name: "Senior A",        domain: "Payments Core",             level: "Senior",  icon: "🔵" },
  { id: "e3",  name: "Senior B",        domain: "Auth & Security",           level: "Senior",  icon: "🔵" },
  { id: "e4",  name: "Mid A",           domain: "QR Pay & Scan",             level: "Mid",     icon: "🟢" },
  { id: "e5",  name: "Mid B",           domain: "Bill Pay & Utilities",      level: "Mid",     icon: "🟢" },
  { id: "e6",  name: "Mid C",           domain: "Wallet & Top-Up",           level: "Mid",     icon: "🟢" },
  { id: "e7",  name: "Junior A",        domain: "UI Components & Design Sys",level: "Junior",  icon: "🟡" },
  { id: "e8",  name: "Junior B",        domain: "Testing & E2E Automation",  level: "Junior",  icon: "🟡" },
  { id: "e9",  name: "QA Lead",         domain: "Test Strategy & Release",   level: "Senior",  icon: "🔵" },
];

const SPRINT_TASKS = [
  { id: "s1", title: "PayNow deep link integration",      owner: "e2", status: "done",   priority: "high" },
  { id: "s2", title: "QR code scan latency < 300ms",      owner: "e4", status: "done",   priority: "high" },
  { id: "s3", title: "Transfer flow A/B test variant B",  owner: "e3", status: "done",   priority: "med"  },
  { id: "s4", title: "FlatList virtualization (perf)",    owner: "e1", status: "done",   priority: "high" },
  { id: "s5", title: "Push notification A/B framework",   owner: "e5", status: "in-progress", priority: "med" },
  { id: "s6", title: "Cold start < 2s on Android",        owner: "e1", status: "in-progress", priority: "high" },
  { id: "s7", title: "KYC re-attempt flow (MAS req)",     owner: "e3", status: "in-progress", priority: "high" },
  { id: "s8", title: "Bill payment invoice parser",       owner: "e5", status: "todo",    priority: "med"  },
  { id: "s9", title: "Design system Button v3",           owner: "e7", status: "todo",    priority: "low"  },
];

// ─────────────────────────────────────────────────────────────────
// Performance data
// ─────────────────────────────────────────────────────────────────

interface PerfMetric { label: string; before: number; after: number; unit: string; color: string; better: "lower" | "higher"; detail: string }

const PERF_METRICS: PerfMetric[] = [
  { label: "Cold Start Time",      before: 4200, after: 1780,  unit: "ms",  color: "#0ea5e9", better: "lower",  detail: "Lazy loading screens + JS bundle splitting reduced startup parse time" },
  { label: "JS Bundle Size",       before: 8400, after: 3200,  unit: "KB",  color: "#a855f7", better: "lower",  detail: "Tree-shaking lodash, dynamic imports per route, removed unused deps" },
  { label: "Transaction List FPS", before: 42,   after: 60,    unit: "fps", color: "#22c55e", better: "higher", detail: "FlatList virtualization: renderItem memoized, keyExtractor stable, getItemLayout" },
  { label: "Memory Usage (P90)",   before: 320,  after: 175,   unit: "MB",  color: "#f59e0b", better: "lower",  detail: "Image cache LRU eviction, normalized store, removed circular references" },
  { label: "Crash-Free Sessions",  before: 96.1, after: 99.3,  unit: "%",   color: "#22c55e", better: "higher", detail: "Fixed OOM on Android 8, null-checked navigation params, fixed async race" },
  { label: "App Store Rating",     before: 4.1,  after: 4.6,   unit: "★",   color: "#f59e0b", better: "higher", detail: "Performance + ANR reduction → Play Store algorithm boost + user reviews" },
];

// ─────────────────────────────────────────────────────────────────
// A/B test data
// ─────────────────────────────────────────────────────────────────

interface ABTest {
  id: string; name: string; hypothesis: string;
  variantA: { label: string; metric: string; value: number; color: string };
  variantB: { label: string; metric: string; value: number; color: string };
  primaryMetric: string; sampleSize: number; pValue: number; status: "running" | "winner-b" | "inconclusive";
  lift: number; decision: string;
}

const AB_TESTS: ABTest[] = [
  {
    id: "ab1", name: "Home Screen Layout",
    hypothesis: "A grid of feature tiles (vs. a list) will increase feature discovery and first-week transaction rate.",
    variantA: { label: "List Layout (Control)", metric: "7-day transaction rate", value: 34.2, color: "#64748b" },
    variantB: { label: "Grid Layout (Treatment)", metric: "7-day transaction rate", value: 38.5, color: "#0ea5e9" },
    primaryMetric: "7-day transaction rate (%)", sampleSize: 24800, pValue: 0.003, status: "winner-b", lift: 12.6, decision: "Shipped grid layout. Rolled out to 100% of users.",
  },
  {
    id: "ab2", name: "Transfer Confirmation UX",
    hypothesis: "Removing the redundant review screen from transfer flow will reduce abandonment without increasing errors.",
    variantA: { label: "2-step confirm (Control)", metric: "Transfer completion rate", value: 61.8, color: "#64748b" },
    variantB: { label: "1-step confirm (Treatment)", metric: "Transfer completion rate", value: 72.9, color: "#22c55e" },
    primaryMetric: "Transfer completion rate (%)", sampleSize: 18400, pValue: 0.0008, status: "winner-b", lift: 18.0, decision: "Shipped 1-step confirm. Error rate: unchanged (0.02% delta, within noise).",
  },
  {
    id: "ab3", name: "Push Notification Timing",
    hypothesis: "Sending transaction summaries at 8pm (instead of 9am) will increase open rate for working adults.",
    variantA: { label: "9 AM (Control)", metric: "Notification open rate", value: 18.4, color: "#64748b" },
    variantB: { label: "8 PM (Treatment)", metric: "Notification open rate", value: 24.1, color: "#a855f7" },
    primaryMetric: "Notification open rate (%)", sampleSize: 31200, pValue: 0.0001, status: "winner-b", lift: 31.0, decision: "Shifted all non-urgent notifications to 8 PM. Retention improved 2.3% at 30-day mark.",
  },
  {
    id: "ab4", name: "Onboarding Flow Length",
    hypothesis: "Condensing onboarding from 5 screens to 3 screens will increase KYC completion rate for new users.",
    variantA: { label: "5-step (Control)", metric: "Onboarding completion", value: 67.3, color: "#64748b" },
    variantB: { label: "3-step (Treatment)", metric: "Onboarding completion", value: 73.1, color: "#f59e0b" },
    primaryMetric: "Onboarding completion rate (%)", sampleSize: 8900, pValue: 0.04, status: "winner-b", lift: 8.6, decision: "Condensed to 3 steps. Watched 30-day KYC fraud rate: no change. Shipped.",
  },
];

// ─────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────

function CodeBlock({ code, label, color = "#64748b" }: { code: string; label?: string; color?: string }) {
  return (
    <div style={{ background: "#0a0a14", borderRadius: 8, overflow: "hidden", border: "1px solid #1e293b" }}>
      {label && <div style={{ padding: "5px 12px", borderBottom: "1px solid #1e293b", fontSize: 10, color }}>{label}</div>}
      <pre style={{ margin: 0, padding: 12, fontSize: 9, fontFamily: "monospace", color: "#94a3b8", lineHeight: 1.7, overflow: "auto", maxHeight: 280 }}>{code}</pre>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
// Main
// ─────────────────────────────────────────────────────────────────

export function SGFinanceLeadDemo() {
  const [activeTab, setActiveTab] = useState<"team" | "perf" | "ab">("team");

  // ── Team state
  const [selectedEng, setSelectedEng] = useState<string | null>(null);

  const tasksByStatus = {
    done:        SPRINT_TASKS.filter(t => t.status === "done"),
    "in-progress": SPRINT_TASKS.filter(t => t.status === "in-progress"),
    todo:        SPRINT_TASKS.filter(t => t.status === "todo"),
  };

  // ── Performance state
  const [simulating, setSimulating]     = useState(false);
  const [simDone, setSimDone]           = useState(false);
  const [simProgress, setSimProgress]   = useState(0);
  const [selectedMetric, setSelectedMetric] = useState<PerfMetric>(PERF_METRICS[0]);
  const simRef = useRef(false);

  const runSimulation = useCallback(async () => {
    if (simRef.current) return;
    simRef.current = true; setSimDone(false); setSimulating(true); setSimProgress(0);
    for (let i = 0; i <= 100; i += 5) {
      await new Promise(r => setTimeout(r, 70));
      setSimProgress(Math.min(i, 100));
    }
    setSimulating(false); setSimDone(true); simRef.current = false;
  }, []);

  // ── A/B state
  const [selectedTest, setSelectedTest] = useState<ABTest>(AB_TESTS[0]);
  const [animatedA, setAnimatedA]       = useState(0);
  const [animatedB, setAnimatedB]       = useState(0);

  useEffect(() => {
    setAnimatedA(0); setAnimatedB(0);
    const tA = setTimeout(() => setAnimatedA(selectedTest.variantA.value), 50);
    const tB = setTimeout(() => setAnimatedB(selectedTest.variantB.value), 200);
    return () => { clearTimeout(tA); clearTimeout(tB); };
  }, [selectedTest]);

  const maxVal = Math.max(selectedTest.variantA.value, selectedTest.variantB.value) * 1.2;

  const TABS = [
    { id: "team" as const, label: "👥 Team Leadership"    },
    { id: "perf" as const, label: "🚀 Performance"        },
    { id: "ab"   as const, label: "🧪 A/B Testing"        },
  ];

  return (
    <div style={{ background: "#0f172a", color: "#f1f5f9", fontFamily: "'Inter', system-ui, sans-serif", minHeight: "100vh", padding: 24 }}>
      {/* Header */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
          <div style={{ width: 36, height: 36, borderRadius: 8, background: "linear-gradient(135deg,#0ea5e9,#7c3aed)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>🇸🇬</div>
          <div>
            <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800 }}>Singapore Financial Super-App</h1>
            <p style={{ margin: 0, color: "#64748b", fontSize: 13 }}>Engineering Lead (9 engineers) · Performance · A/B Testing · App Store Rankings</p>
          </div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8 }}>
          {[
            { v: "9",     l: "Engineers Led",      c: "#0ea5e9", sub: "Staff/Senior/Mid/Junior/QA"     },
            { v: "−57%",  l: "JS Bundle Reduction", c: "#a855f7", sub: "8.4MB → 3.2MB (tree-shaking)"  },
            { v: "4.1→4.6", l: "App Store Rating",  c: "#f59e0b", sub: "Play Store + App Store"        },
            { v: "+18%",  l: "Transfer Completion", c: "#22c55e", sub: "A/B test: 1-step confirm"       },
          ].map(m => (
            <div key={m.l} style={{ background: "#1e293b", border: `1px solid ${m.c}20`, borderRadius: 10, padding: "10px 12px" }}>
              <div style={{ fontSize: 20, fontWeight: 900, color: m.c }}>{m.v}</div>
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

      {/* ── TEAM LEADERSHIP ── */}
      {activeTab === "team" && (
        <div style={{ display: "grid", gridTemplateColumns: "260px 1fr", gap: 14 }}>
          {/* Org chart */}
          <div>
            <div style={{ fontSize: 10, fontWeight: 700, color: "#64748b", marginBottom: 8, letterSpacing: "0.08em" }}>TEAM OF 9 — DOMAIN OWNERSHIP</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
              {ENGINEERS.map(eng => {
                const levelColor = eng.level === "Staff" ? "#f59e0b" : eng.level === "Senior" ? "#0ea5e9" : eng.level === "Mid" ? "#22c55e" : "#a855f7";
                return (
                  <div key={eng.id} onClick={() => setSelectedEng(selectedEng === eng.id ? null : eng.id)} style={{ background: selectedEng === eng.id ? "#1e3a5f" : "#1e293b", border: `1px solid ${selectedEng === eng.id ? "#3b82f6" : "#334155"}`, borderRadius: 8, padding: "8px 10px", cursor: "pointer", marginLeft: eng.id === "e1" ? 0 : 12, transition: "all 0.15s" }}>
                    <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                      <span style={{ fontSize: 12 }}>{eng.icon}</span>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 9, fontWeight: 700 }}>{eng.name}</div>
                        <div style={{ fontSize: 7, color: "#64748b" }}>{eng.domain}</div>
                      </div>
                      <span style={{ fontSize: 6, background: levelColor + "20", color: levelColor, borderRadius: 3, padding: "1px 5px" }}>{eng.level}</span>
                    </div>
                  </div>
                );
              })}
            </div>

            {selectedEng && (
              <div style={{ marginTop: 8, background: "#1e293b", border: "1px solid #3b82f6", borderRadius: 8, padding: 10 }}>
                <div style={{ fontSize: 8, color: "#60a5fa", marginBottom: 4 }}>
                  {ENGINEERS.find(e => e.id === selectedEng)!.name} — {ENGINEERS.find(e => e.id === selectedEng)!.domain}
                </div>
                {selectedEng === "e1" && <div style={{ fontSize: 7, color: "#64748b" }}>Architecture decisions, technical roadmap, cross-team unblocking, code reviews, performance infra, hiring bar-raiser.</div>}
                {selectedEng === "e2" && <div style={{ fontSize: 7, color: "#64748b" }}>PayNow integration, FAST payment rail, real-time transfer logic, payment idempotency keys.</div>}
                {selectedEng === "e3" && <div style={{ fontSize: 7, color: "#64748b" }}>Biometric auth (FaceID/fingerprint), MAS KYC compliance, token refresh, jailbreak detection.</div>}
                {selectedEng === "e4" && <div style={{ fontSize: 7, color: "#64748b" }}>QR code generation/scan, merchant payment flow, deep link handling, NFC tap-to-pay.</div>}
                {selectedEng === "e5" && <div style={{ fontSize: 7, color: "#64748b" }}>SP Group / utility bill payments, recurring payments, PDF invoice parsing.</div>}
                {selectedEng === "e6" && <div style={{ fontSize: 7, color: "#64748b" }}>Wallet top-up (PayNow/card), withdrawal to bank, balance display, transaction history.</div>}
                {selectedEng === "e7" && <div style={{ fontSize: 7, color: "#64748b" }}>Design system components, accessibility (WCAG AA), animation library.</div>}
                {selectedEng === "e8" && <div style={{ fontSize: 7, color: "#64748b" }}>Detox E2E tests, Jest unit tests, test coverage tracking.</div>}
                {selectedEng === "e9" && <div style={{ fontSize: 7, color: "#64748b" }}>Release cadence, regression test suite, production monitoring, incident response.</div>}
              </div>
            )}
          </div>

          {/* Sprint board + code */}
          <div>
            <div style={{ fontSize: 10, fontWeight: 700, color: "#64748b", marginBottom: 8, letterSpacing: "0.08em" }}>CURRENT SPRINT — KANBAN</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginBottom: 12 }}>
              {(["done", "in-progress", "todo"] as const).map(col => (
                <div key={col}>
                  <div style={{ fontSize: 8, fontWeight: 700, color: col === "done" ? "#22c55e" : col === "in-progress" ? "#0ea5e9" : "#64748b", marginBottom: 5, textTransform: "uppercase", letterSpacing: "0.08em" }}>
                    {col === "in-progress" ? "In Progress" : col === "done" ? "Done ✓" : "To Do"}
                  </div>
                  {tasksByStatus[col].map(task => {
                    const eng = ENGINEERS.find(e => e.id === task.owner);
                    return (
                      <div key={task.id} style={{ background: "#1e293b", border: `1px solid ${task.priority === "high" ? "#ef4444" : task.priority === "med" ? "#f59e0b" : "#334155"}20`, borderRadius: 7, padding: "7px 9px", marginBottom: 5 }}>
                        <div style={{ fontSize: 8, lineHeight: 1.4, marginBottom: 3 }}>{task.title}</div>
                        <div style={{ display: "flex", justifyContent: "space-between" }}>
                          <span style={{ fontSize: 6, color: "#475569" }}>{eng?.name.split(" ")[0]}</span>
                          <span style={{ fontSize: 6, background: task.priority === "high" ? "#ef444415" : "#f59e0b15", color: task.priority === "high" ? "#f87171" : "#fbbf24", borderRadius: 3, padding: "0 4px" }}>{task.priority}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <CodeBlock label="Engineering leadership principles at scale" color="#0ea5e9" code={
`// LEADING 9 ENGINEERS — WHAT CHANGED FROM BEING AN IC:
// 
// AS AN IC: I write the best code.
// AS A LEAD: I set up conditions where 9 engineers write great code.
// 
// KEY PRINCIPLE: AMPLIFY, DON'T REPLACE.
// If I write the code myself: 1 person's output.
// If I unblock and raise the bar of 9 engineers: 9× output.
// A 30-min code review that teaches a senior engineer a pattern
// they'll use in every PR for the next year: that's leverage.
// 
// STRUCTURE:
// Domain ownership: each engineer owns an area end-to-end.
// No "I'll implement the backend integration for your feature."
// "You own the QR payment feature. I'll help you design the API contract.
//  You'll implement it, write the tests, handle the edge cases."
// Ownership → motivation. Motivation → quality.
// 
// WEEKLY CEREMONIES:
// Sprint planning (1hr): goals, dependencies, blockers surfaced.
// Tech sync (30min): architecture decisions, RFC review.
// 1:1s (30min each): growth, challenges, feedback. Every 2 weeks.
// Demo day: engineers demo what they shipped. Not me. Them.
// 
// RFC PROCESS (Request for Comments):
// Any decision that affects > 1 engineer: write an RFC.
// Template: Problem → Options considered → Proposed solution → Trade-offs → Decision.
// Engineers comment async. Decision logged in a shared doc.
// No "why did we do X?" 6 months later. It's written down.
// 
// HIRING AND RAISING THE BAR:
// Every candidate: I'm the bar-raiser.
// What I look for: "Can they make engineers around them better?"
// A senior engineer who makes juniors better: worth more than
// a senior engineer who is individually excellent but opaque.`} />

              <CodeBlock label="Singapore fintech: PayNow + MAS compliance architecture" color="#22c55e" code={
`// SINGAPORE MARKET SPECIFICS:
// 
// PAYNOW (national instant payment system):
// PayNow: Singapore's equivalent of India's UPI or Vietnam's VietQR.
// Transfers: by mobile number or NRIC (national ID), not bank account.
// The app must integrate with PayNow proxy registry:
//   User enters: +65 9123 4567
//   App queries: PayNow proxy API → resolves to DBS account ending 4892
//   User confirms: transfers to "DBS Bank • Account ****4892"
// 
// Transfer flow designed to prevent wrong-recipient errors:
//   1. Recipient name resolved from PayNow proxy (not user-entered).
//   2. Confirmation screen: shows resolved bank name + last 4 digits.
//   3. "This transfer cannot be cancelled." — user must re-read and confirm.
//   4. MAS requirement: large transfers (> SGD 1000) require 2FA re-auth.
// 
// MAS (MONETARY AUTHORITY OF SINGAPORE) COMPLIANCE:
// MAS Notice PSN01: Strong Customer Authentication (SCA) requirements.
// SCA required for: new payee addition, transactions > SGD 1000.
// SCA: biometric (FaceID/fingerprint) OR OTP. Not password alone.
// 
// Implementation:
// const requireSCA = (action: SensitiveAction) => {
//   if (action.amount > 1000 || action.type === "NEW_PAYEE") {
//     return biometricPrompt({ reason: "Authenticate to proceed" });
//   }
// };
// 
// AML (Anti-Money Laundering) checks:
// Transactions > SGD 5000: flagged for internal review (async).
// User sees: "Transfer submitted. Processing." (not "under review").
// Backend: checks against MAS watchlist, internal fraud model.
// If flagged: escalated to compliance team. Transfer held 24h.
// 
// DATA RESIDENCY:
// MAS: financial data must remain in Singapore.
// All databases: hosted in AWS ap-southeast-1 (Singapore).
// No cross-border data transfer for transaction data.`} />
            </div>
          </div>
        </div>
      )}

      {/* ── PERFORMANCE ── */}
      {activeTab === "perf" && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 280px", gap: 14 }}>
          {/* Metrics */}
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: "#64748b", letterSpacing: "0.08em" }}>PERFORMANCE IMPACT — BEFORE vs. AFTER</div>
              <button onClick={runSimulation} disabled={simulating} style={{ background: simulating ? "#334155" : "#0066ff20", border: `1px solid ${simulating ? "#334155" : "#0066ff"}`, borderRadius: 6, padding: "4px 12px", color: simulating ? "#475569" : "#60a5fa", cursor: simulating ? "not-allowed" : "pointer", fontSize: 9 }}>
                {simulating ? `Profiling... ${simProgress}%` : simDone ? "↺ Re-run" : "▶ Run Performance Profile"}
              </button>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {PERF_METRICS.map(m => {
                const isActive = selectedMetric.label === m.label;
                const pct = m.better === "lower"
                  ? ((m.before - m.after) / m.before) * 100
                  : ((m.after - m.before) / m.before) * 100;
                const beforeBar = m.better === "lower" ? 100 : (m.before / m.after) * 80;
                const afterBar  = m.better === "lower" ? (m.after  / m.before) * 100 : 100;
                const showAfter = simDone || m.label === "App Store Rating";
                return (
                  <div key={m.label} onClick={() => setSelectedMetric(m)} style={{ background: isActive ? "#1e3a5f" : "#1e293b", border: `1px solid ${isActive ? "#3b82f6" : "#334155"}`, borderRadius: 10, padding: 12, cursor: "pointer", transition: "all 0.2s" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                      <div style={{ fontSize: 10, fontWeight: 700 }}>{m.label}</div>
                      {showAfter && <span style={{ fontSize: 9, background: "#22c55e20", color: "#4ade80", borderRadius: 4, padding: "1px 6px" }}>−{Math.round(m.better === "lower" ? pct : -pct)}% {m.better === "lower" ? "↓" : "↑"}</span>}
                    </div>
                    <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 7, color: "#64748b", marginBottom: 2 }}>Before</div>
                        <div style={{ background: "#0f172a", borderRadius: 3, height: 8, overflow: "hidden" }}>
                          <div style={{ background: "#ef4444", height: "100%", width: `${beforeBar}%`, borderRadius: 3 }} />
                        </div>
                        <div style={{ fontSize: 8, color: "#ef4444", marginTop: 1 }}>{m.before} {m.unit}</div>
                      </div>
                      {showAfter && (
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: 7, color: "#64748b", marginBottom: 2 }}>After</div>
                          <div style={{ background: "#0f172a", borderRadius: 3, height: 8, overflow: "hidden" }}>
                            <div style={{ background: m.color, height: "100%", width: `${afterBar}%`, borderRadius: 3, transition: "width 0.8s ease-out" }} />
                          </div>
                          <div style={{ fontSize: 8, color: m.color, marginTop: 1 }}>{m.after} {m.unit}</div>
                        </div>
                      )}
                    </div>
                    {isActive && <div style={{ fontSize: 7, color: "#94a3b8", marginTop: 6, borderTop: "1px solid #1e3a5f", paddingTop: 5 }}>{m.detail}</div>}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Techniques code */}
          <div>
            <div style={{ fontSize: 10, fontWeight: 700, color: "#64748b", marginBottom: 8, letterSpacing: "0.08em" }}>OPTIMIZATION TECHNIQUES</div>
            <div style={{ background: "#1e293b", border: "1px solid #334155", borderRadius: 10, padding: 12, marginBottom: 10 }}>
              <div style={{ fontSize: 9, fontWeight: 700, marginBottom: 6 }}>🏆 Impact ranking</div>
              {[
                { label: "JS bundle splitting",   lift: 91, c: "#a855f7" },
                { label: "FlatList virtualization", lift: 78, c: "#22c55e" },
                { label: "Image LRU cache",         lift: 62, c: "#0ea5e9" },
                { label: "React.memo + stable keys",lift: 54, c: "#f59e0b" },
                { label: "AsyncStorage batching",   lift: 38, c: "#64748b" },
              ].map(r => (
                <div key={r.label} style={{ marginBottom: 6 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 7, marginBottom: 2 }}>
                    <span style={{ color: "#94a3b8" }}>{r.label}</span>
                    <span style={{ color: r.c }}>+{r.lift} pts</span>
                  </div>
                  <div style={{ background: "#0f172a", borderRadius: 3, height: 6, overflow: "hidden" }}>
                    <div style={{ background: r.c, height: "100%", width: `${r.lift}%` }} />
                  </div>
                </div>
              ))}
            </div>
            <CodeBlock label="Key optimizations — code patterns" color="#a855f7" code={
`// 1. JS BUNDLE SPLITTING (biggest single win):
// Before: one 8.4MB bundle → all screens loaded on startup.
// After: dynamic import per route.
//
// const QRPayScreen  = React.lazy(() => import("./screens/QRPay"));
// const BillPayScreen = React.lazy(() => import("./screens/BillPay"));
// On app start: only Home + Auth bundle loaded (core).
// QRPay bundle: loaded ONLY when user navigates to QR.
// Result: startup parses 3.2MB JS, not 8.4MB. Cold start −58%.
//
// 2. FLATLIST VIRTUALIZATION:
// Transaction list: 1000+ items.
// Before: all items rendered in DOM (even off-screen). High memory.
// After:
// <FlatList
//   data={transactions}
//   renderItem={renderItem}                     // memoized
//   keyExtractor={t => t.id}                    // stable string
//   getItemLayout={(_, i) => ({                 // skip measurement
//     length: ITEM_HEIGHT, offset: ITEM_HEIGHT * i, index: i
//   })}
//   maxToRenderPerBatch={10}                    // batch size
//   windowSize={5}                              // ±2 viewports
//   removeClippedSubviews={true}                // unmount off-screen
// />
// FPS: 42 → 60. Memory: reduced 35%.
//
// 3. IMAGE CACHE (LRU eviction):
// React Native doesn't cache remote images aggressively.
// Every screen mount: re-fetches profile photos and merchant logos.
// Solution: FastImage library with LRU disk cache (50MB limit).
// When cache fills: least recently used image evicted first.
// Eliminated: duplicate network requests for repeat images.
//
// 4. APP STORE RATING: HOW PERFORMANCE CONNECTS TO RATING:
// Play Store algorithm factors: ANR rate, crash rate, performance.
// An app with >2% ANR rate: suppressed in search results.
// Our ANR rate before: 1.8% (above threshold). After: 0.3%.
// Direct impact: search ranking improved → more organic installs.
// User reviews: "much smoother" and "finally fixed the lag" appeared.
// Rating lift: 4.1 → 4.6 (sustainable, driven by real improvement).`} />
          </div>
        </div>
      )}

      {/* ── A/B TESTING ── */}
      {activeTab === "ab" && (
        <div style={{ display: "grid", gridTemplateColumns: "300px 1fr", gap: 14 }}>
          {/* Test list */}
          <div>
            <div style={{ fontSize: 10, fontWeight: 700, color: "#64748b", marginBottom: 8, letterSpacing: "0.08em" }}>EXPERIMENTS SHIPPED</div>
            {AB_TESTS.map(test => (
              <div key={test.id} onClick={() => setSelectedTest(test)} style={{ background: selectedTest.id === test.id ? "#1e3a5f" : "#1e293b", border: `1px solid ${selectedTest.id === test.id ? "#3b82f6" : "#334155"}`, borderRadius: 10, padding: 12, marginBottom: 7, cursor: "pointer", transition: "all 0.15s" }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
                  <div style={{ fontSize: 10, fontWeight: 700 }}>{test.name}</div>
                  <span style={{ fontSize: 7, background: "#22c55e20", color: "#4ade80", borderRadius: 4, padding: "1px 6px" }}>+{test.lift}%</span>
                </div>
                <div style={{ fontSize: 8, color: "#64748b" }}>{test.primaryMetric}</div>
                <div style={{ display: "flex", gap: 6, marginTop: 5 }}>
                  <div style={{ flex: 1, background: "#0f172a", borderRadius: 5, padding: "4px 6px" }}>
                    <div style={{ fontSize: 6, color: "#475569" }}>A: {test.variantA.value}%</div>
                    <div style={{ background: "#334155", borderRadius: 2, height: 5, overflow: "hidden", marginTop: 2 }}>
                      <div style={{ background: "#64748b", height: "100%", width: `${(test.variantA.value / Math.max(test.variantA.value, test.variantB.value)) * 100}%` }} />
                    </div>
                  </div>
                  <div style={{ flex: 1, background: "#0f172a", borderRadius: 5, padding: "4px 6px" }}>
                    <div style={{ fontSize: 6, color: test.variantB.color }}>{test.variantB.value}%</div>
                    <div style={{ background: "#334155", borderRadius: 2, height: 5, overflow: "hidden", marginTop: 2 }}>
                      <div style={{ background: test.variantB.color, height: "100%", width: "100%" }} />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Detail + code */}
          <div>
            <div style={{ fontSize: 10, fontWeight: 700, color: "#64748b", marginBottom: 8, letterSpacing: "0.08em" }}>
              EXPERIMENT DETAIL — {selectedTest.name.toUpperCase()}
            </div>

            {/* Hypothesis */}
            <div style={{ background: "#1e293b", border: "1px solid #334155", borderRadius: 10, padding: 12, marginBottom: 10 }}>
              <div style={{ fontSize: 8, color: "#64748b", marginBottom: 4 }}>Hypothesis</div>
              <div style={{ fontSize: 10, fontStyle: "italic", color: "#94a3b8", lineHeight: 1.5 }}>"{selectedTest.hypothesis}"</div>
            </div>

            {/* Variant comparison */}
            <div style={{ background: "#1e293b", border: "1px solid #334155", borderRadius: 10, padding: 14, marginBottom: 10 }}>
              <div style={{ fontSize: 9, color: "#64748b", marginBottom: 10 }}>Results — {selectedTest.primaryMetric}</div>
              <div style={{ display: "flex", gap: 10, marginBottom: 10, height: 100, alignItems: "flex-end" }}>
                {[
                  { ...selectedTest.variantA, animated: animatedA, isWinner: false },
                  { ...selectedTest.variantB, animated: animatedB, isWinner: true },
                ].map((v, i) => (
                  <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center" }}>
                    <div style={{ fontSize: 9, fontWeight: 800, color: i === 1 ? v.color : "#64748b", marginBottom: 4 }}>{v.animated.toFixed(1)}%</div>
                    <div style={{ width: "80%", background: "#0f172a", borderRadius: "4px 4px 0 0", height: `${(v.animated / maxVal) * 80}px`, transition: "height 0.8s ease-out", position: "relative" }}>
                      <div style={{ position: "absolute", inset: 0, background: i === 1 ? v.color : "#64748b", borderRadius: "4px 4px 0 0", opacity: 0.8 }} />
                      {i === 1 && <div style={{ position: "absolute", top: -16, left: "50%", transform: "translateX(-50%)", fontSize: 10 }}>👑</div>}
                    </div>
                    <div style={{ fontSize: 7, textAlign: "center", marginTop: 4, color: i === 1 ? v.color : "#64748b" }}>{v.label}</div>
                  </div>
                ))}
              </div>

              {/* Stats */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 6 }}>
                <div style={{ background: "#0f172a", borderRadius: 6, padding: "6px 8px", textAlign: "center" }}>
                  <div style={{ fontSize: 7, color: "#475569" }}>Sample Size</div>
                  <div style={{ fontSize: 11, fontWeight: 800, color: "#f1f5f9" }}>{selectedTest.sampleSize.toLocaleString()}</div>
                  <div style={{ fontSize: 6, color: "#475569" }}>users</div>
                </div>
                <div style={{ background: "#0f172a", borderRadius: 6, padding: "6px 8px", textAlign: "center" }}>
                  <div style={{ fontSize: 7, color: "#475569" }}>p-value</div>
                  <div style={{ fontSize: 11, fontWeight: 800, color: selectedTest.pValue < 0.05 ? "#22c55e" : "#ef4444" }}>{selectedTest.pValue}</div>
                  <div style={{ fontSize: 6, color: selectedTest.pValue < 0.05 ? "#22c55e" : "#ef4444" }}>{selectedTest.pValue < 0.05 ? "✓ Significant" : "✗ Not sig."}</div>
                </div>
                <div style={{ background: "#0f172a", borderRadius: 6, padding: "6px 8px", textAlign: "center" }}>
                  <div style={{ fontSize: 7, color: "#475569" }}>Lift</div>
                  <div style={{ fontSize: 11, fontWeight: 800, color: "#22c55e" }}>+{selectedTest.lift}%</div>
                  <div style={{ fontSize: 6, color: "#475569" }}>treatment over control</div>
                </div>
              </div>

              <div style={{ marginTop: 10, background: "#0f172a", borderRadius: 6, padding: "8px 10px", border: "1px solid #22c55e20" }}>
                <div style={{ fontSize: 7, color: "#22c55e", marginBottom: 2 }}>✓ Decision</div>
                <div style={{ fontSize: 8, color: "#94a3b8" }}>{selectedTest.decision}</div>
              </div>
            </div>

            <CodeBlock label="A/B testing infrastructure — how experiments run safely in a financial app" color="#a855f7" code={
`// A/B TESTING IN A FINANCIAL APP — EXTRA CONSTRAINTS:
//
// In a regular app: incorrect variant = wrong button color. Low risk.
// In a financial app: incorrect variant = wrong transfer confirmation flow.
//   User might send money without realizing. Regulatory risk.
//
// SAFEGUARDS WE IMPLEMENTED:
//
// 1. EXPERIMENT SCOPE LIMITS:
//    Feature flags define experiment scope.
//    Scope "UI_ONLY": only visual/layout changes allowed.
//    Scope "FLOW": can modify steps in a flow, NOT amounts or recipients.
//    Scope "COPY": text changes only.
//    Backend rejects experiment configs that exceed declared scope.
//
// 2. GUARDRAIL METRICS:
//    Every experiment has PRIMARY metric (what we want to improve)
//    AND GUARDRAIL metrics (what we must NOT worsen).
//    Transfer completion A/B test:
//      Primary:   transfer completion rate (want to improve)
//      Guardrails: error rate, wrong-recipient reports, support tickets
//    If guardrail worsens by >5%: experiment auto-stops (kill switch).
//
// 3. EXPERIMENT ASSIGNMENT:
//    User is assigned to variant at login (server-side, in JWT).
//    NOT: assigned randomly on each page load (inconsistent UX).
//    Same user → same variant across sessions and devices.
//    Assignment persisted in user profile.
//
// 4. STATISTICAL RIGOR:
//    Minimum sample size: calculated before starting the experiment.
//    (Power analysis: 80% power, α=0.05, minimum detectable effect 5%)
//    Do NOT stop the experiment early based on early results.
//    (Peeking problem: stopping early inflates false positive rate)
//    Duration: run until N is reached, then analyze once.
//
// 5. LOG CONSISTENCY:
//    Every user action: tagged with experiment_id and variant.
//    Analytics query: "what was the transfer rate for variant B users?"
//    Requires: ALL events from variant B users have the variant tag.
//    Missing tags: biased analysis. We enforce tagging at the SDK level.
//
// FEATURE FLAG SYSTEM (simplified):
// const getVariant = (userId: string, experimentId: string) => {
//   const hash = murmurhash(userId + experimentId) % 100;
//   return hash < experiment.splitPct ? "treatment" : "control";
// };
// murmurhash: deterministic, same userId+experimentId → same variant.
// splitPct: 50 = 50/50 split. Can be 10/90 for riskier experiments.`} />
          </div>
        </div>
      )}
    </div>
  );
}

export default SGFinanceLeadDemo;
