/**
 * ContentSafetyPlatformDemo.tsx
 *
 * TikTok Content Safety — Operating Platform for Content Reviewers
 *
 * Target: Reduce average review time by 30–40%
 * Tech:   React · MobX · BFF (Backend for Frontend) · Unit Testing
 *
 * Achievements:
 *   1. Review Platform  — core review workflow, keyboard shortcuts, batch review, MobX state
 *   2. Test Coverage    — <10% → 70% for base components; MobX store + component testing patterns
 *   3. BFF Architecture — request reduction: 6 parallel requests → 1 BFF call per review
 *
 * TABS
 *   📺 Review Platform  — interactive content review queue, decision workflow, avg-time tracker
 *   🧪 Test Coverage    — coverage dashboard, animated test runner, MobX + component test patterns
 *   🔗 BFF Architecture — before/after request simulation, BFF aggregation, latency comparison
 */

import React, { useState, useEffect, useRef, useCallback } from "react";

// ─────────────────────────────────────────────────────────────────
// Review Platform types
// ─────────────────────────────────────────────────────────────────

type ViolationType = "violence" | "hate_speech" | "spam" | "misinformation" | "adult" | "minor_safety";
type Severity      = "low" | "medium" | "high" | "critical";
type Decision      = "approve" | "remove" | "escalate" | "pending";

interface ReviewItem {
  id: string; title: string; emoji: string;
  reporterCount: number; flaggedAt: string; timeInQueue: string;
  category: ViolationType; snippet: string; flaggedWords: string[];
  reviewerNote: string; decision: Decision;
}

const VIOLATION_LABELS: Record<ViolationType, { label: string; color: string; icon: string }> = {
  violence:      { label: "Violence",       color: "#ef4444", icon: "⚔" },
  hate_speech:   { label: "Hate Speech",    color: "#f97316", icon: "🚫" },
  spam:          { label: "Spam",           color: "#64748b", icon: "📧" },
  misinformation:{ label: "Misinfo",        color: "#f59e0b", icon: "❌" },
  adult:         { label: "Adult Content",  color: "#a855f7", icon: "🔞" },
  minor_safety:  { label: "Minor Safety",   color: "#0ea5e9", icon: "👶" },
};

const SEV_COLOR: Record<Severity, string> = { low: "#22c55e", medium: "#f59e0b", high: "#f97316", critical: "#ef4444" };

const DECISION_COLOR: Record<Decision, string> = {
  pending: "#64748b", approve: "#22c55e", remove: "#ef4444", escalate: "#f59e0b",
};

const QUEUE: ReviewItem[] = [
  { id: "c1", title: "Street fight video", emoji: "🎬", reporterCount: 47, flaggedAt: "09:14", timeInQueue: "2h 14m", category: "violence", snippet: "Two individuals engage in a physical altercation, one brandishes a weapon at 0:32.", flaggedWords: ["weapon", "fight", "blood"], reviewerNote: "", decision: "pending" },
  { id: "c2", title: "Political misinformation post", emoji: "📰", reporterCount: 312, flaggedAt: "08:55", timeInQueue: "2h 33m", category: "misinformation", snippet: "Claims that vaccine causes DNA alteration, cites no sources, widely shared.", flaggedWords: ["vaccine", "DNA", "control"], reviewerNote: "", decision: "pending" },
  { id: "c3", title: "Targeted harassment account", emoji: "👤", reporterCount: 89, flaggedAt: "10:01", timeInQueue: "1h 27m", category: "hate_speech", snippet: "Repeated targeting of a creator's ethnicity using slurs across 14 comments.", flaggedWords: ["slur", "targeted", "ethnic"], reviewerNote: "", decision: "pending" },
  { id: "c4", title: "Spam bot promotion wave", emoji: "🤖", reporterCount: 23, flaggedAt: "10:45", timeInQueue: "43m", category: "spam", snippet: "Automated posting pattern. 340 identical comments in 6 minutes. External link.", flaggedWords: ["buy now", "click here", "limited"], reviewerNote: "", decision: "pending" },
  { id: "c5", title: "Age-ambiguous content", emoji: "⚠", reporterCount: 7, flaggedAt: "11:12", timeInQueue: "16m", category: "minor_safety", snippet: "Creator appears under 18. Content includes adult themes. No age verification.", flaggedWords: ["minor", "age", "explicit"], reviewerNote: "", decision: "pending" },
];

// ─────────────────────────────────────────────────────────────────
// Test coverage types
// ─────────────────────────────────────────────────────────────────

interface CoverageArea { area: string; before: number; after: number; color: string; tests: number }
const COVERAGE: CoverageArea[] = [
  { area: "Base Components",  before: 8,  after: 74, color: "#0ea5e9", tests: 62  },
  { area: "MobX Stores",      before: 4,  after: 71, color: "#a855f7", tests: 38  },
  { area: "Custom Hooks",     before: 12, after: 68, color: "#22c55e", tests: 29  },
  { area: "Utility Funcs",    before: 18, after: 83, color: "#f59e0b", tests: 44  },
  { area: "Integration",      before: 0,  after: 55, color: "#fe2c55", tests: 21  },
];

interface TestCase { name: string; type: "store" | "component" | "hook" | "util"; ms: number }
const TEST_CASES: TestCase[] = [
  { name: "ReviewStore: submitDecision updates queue",      type: "store",     ms: 12  },
  { name: "ReviewStore: computed remainingCount",           type: "store",     ms: 8   },
  { name: "ReviewStore: batchApprove clears selected",      type: "store",     ms: 15  },
  { name: "ReviewStore: avgDecisionTime computed",          type: "store",     ms: 11  },
  { name: "DecisionPanel: renders violation types",         type: "component", ms: 18  },
  { name: "DecisionPanel: keyboard shortcut A=approve",     type: "component", ms: 22  },
  { name: "DecisionPanel: disables submit with no category",type: "component", ms: 14  },
  { name: "QueueItem: flaggedWords highlighted",            type: "component", ms: 9   },
  { name: "useKeyboardShortcut: binds on mount",            type: "hook",      ms: 7   },
  { name: "useTimer: tracks elapsed seconds",               type: "hook",      ms: 13  },
  { name: "formatDuration: ms → h m s",                     type: "util",      ms: 3   },
  { name: "highlightWords: wraps matches in <mark>",        type: "util",      ms: 5   },
];

// ─────────────────────────────────────────────────────────────────
// BFF types
// ─────────────────────────────────────────────────────────────────

interface ApiCall { service: string; endpoint: string; ms: number; color: string; payload: string }
const OLD_CALLS: ApiCall[] = [
  { service: "Queue Service",  endpoint: "/api/queue/next",              ms: 180, color: "#0ea5e9", payload: "{ itemId, metadata, reporterCount }" },
  { service: "Policy Service", endpoint: "/api/policies/violations",     ms: 220, color: "#a855f7", payload: "{ violationTypes[], severityRules }" },
  { service: "Media Service",  endpoint: "/api/media/:id/manifest",      ms: 310, color: "#f59e0b", payload: "{ url, duration, thumbnails[] }" },
  { service: "Label Service",  endpoint: "/api/labels/categories",       ms: 150, color: "#22c55e", payload: "{ categories[], translations }" },
  { service: "User Service",   endpoint: "/api/reviewer/:id/stats",      ms: 195, color: "#fe2c55", payload: "{ todayCount, avgTime, streak }" },
  { service: "History Service",endpoint: "/api/content/:id/history",     ms: 240, color: "#64748b", payload: "{ priorActions[], relatedItems[] }" },
];

const BFF_CALL: ApiCall = {
  service: "BFF", endpoint: "/bff/review/next",
  ms: 260, color: "#fe2c55",
  payload: `{
  item: { id, metadata, reporterCount },
  media: { url, duration, thumbnails },
  labels: { violationTypes, categories },
  policies: { severityRules },
  reviewerStats: { todayCount, avgTime },
  history: { priorActions }
}`,
};

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

export function ContentSafetyPlatformDemo() {
  const [activeTab, setActiveTab] = useState<"review" | "tests" | "bff">("review");

  // ── Review state
  const [queue, setQueue]             = useState<ReviewItem[]>(QUEUE);
  const [currentIdx, setCurrentIdx]   = useState(0);
  const [selectedViolation, setSelectedViolation] = useState<ViolationType | null>(null);
  const [selectedSeverity, setSelectedSeverity]   = useState<Severity | null>(null);
  const [noteText, setNoteText]       = useState("");
  const [submitting, setSubmitting]   = useState(false);
  const [reviewTimes, setReviewTimes] = useState<number[]>([]);
  const [itemStartTime, setItemStartTime] = useState(Date.now());
  const [elapsed, setElapsed]         = useState(0);
  const [selected, setSelected]       = useState<Set<string>>(new Set());
  const [batchMode, setBatchMode]     = useState(false);
  const [showShortcutHint, setShowShortcutHint] = useState(false);
  const [lastAction, setLastAction]   = useState<string | null>(null);

  const pending = queue.filter(q => q.decision === "pending");
  const current = pending[currentIdx] ?? null;

  const avgMs = reviewTimes.length > 0 ? reviewTimes.reduce((a, b) => a + b, 0) / reviewTimes.length : null;
  const baseline = 234; // 3m 54s baseline in seconds
  const avgSec = avgMs ? avgMs / 1000 : null;
  const improvement = avgSec ? Math.round((1 - avgSec / baseline) * 100) : null;

  useEffect(() => { setItemStartTime(Date.now()); setElapsed(0); }, [currentIdx]);
  useEffect(() => {
    const int = setInterval(() => setElapsed(Math.floor((Date.now() - itemStartTime) / 1000)), 1000);
    return () => clearInterval(int);
  }, [itemStartTime]);

  const submitDecision = useCallback(async (decision: Decision) => {
    if (!current || submitting) return;
    setSubmitting(true);
    const timeSpent = Date.now() - itemStartTime;
    await new Promise(r => setTimeout(r, 300));
    setReviewTimes(prev => [...prev, timeSpent]);
    setQueue(prev => prev.map(q => q.id === current.id ? { ...q, decision } : q));
    setLastAction(`${decision.toUpperCase()} — ${current.title}`);
    setSelectedViolation(null); setSelectedSeverity(null); setNoteText(""); setSubmitting(false);
    if (currentIdx >= pending.length - 2) setCurrentIdx(0);
    setTimeout(() => setLastAction(null), 2500);
  }, [current, submitting, itemStartTime, currentIdx, pending.length]);

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.key === "a" || e.key === "A") submitDecision("approve");
      if (e.key === "r" || e.key === "R") submitDecision("remove");
      if (e.key === "e" || e.key === "E") submitDecision("escalate");
      if (e.key === "Tab") { e.preventDefault(); setCurrentIdx(i => (i + 1) % Math.max(1, pending.length)); }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [submitDecision, pending.length]);

  const fmtTime = (s: number) => s < 60 ? `${s}s` : `${Math.floor(s / 60)}m ${s % 60}s`;

  // ── Test coverage state
  const [running, setRunning]       = useState(false);
  const [passedTests, setPassedTests] = useState<number[]>([]);
  const [coverageMode, setCoverageMode] = useState<"before" | "after">("after");

  const runTests = async () => {
    if (running) return;
    setRunning(true); setPassedTests([]);
    for (let i = 0; i < TEST_CASES.length; i++) {
      await new Promise(r => setTimeout(r, TEST_CASES[i].ms * 4));
      setPassedTests(prev => [...prev, i]);
    }
    setRunning(false);
  };

  const totalTests = COVERAGE.reduce((s, c) => s + c.tests, 0);
  const overallBefore = Math.round(COVERAGE.reduce((s, c) => s + c.before, 0) / COVERAGE.length);
  const overallAfter  = Math.round(COVERAGE.reduce((s, c) => s + c.after, 0) / COVERAGE.length);

  // ── BFF state
  const [bffMode, setBffMode]         = useState<"before" | "after">("before");
  const [simulatingBff, setSimulatingBff] = useState(false);
  const [bffProgress, setBffProgress]   = useState<{ idx: number; pct: number }[]>([]);
  const [bffDone, setBffDone]           = useState(false);

  const simulateBff = async (mode: "before" | "after") => {
    setBffMode(mode); setBffProgress([]); setBffDone(false);
    setSimulatingBff(true);
    if (mode === "before") {
      // Parallel requests — all start at once, finish at different times
      const total = 600;
      OLD_CALLS.forEach((call, idx) => {
        setTimeout(() => {
          const start = Date.now();
          const tick = setInterval(() => {
            const pct = Math.min(100, ((Date.now() - start) / call.ms) * 100);
            setBffProgress(prev => {
              const next = [...prev];
              next[idx] = { idx, pct };
              return next;
            });
            if (pct >= 100) clearInterval(tick);
          }, 16);
        }, 0);
      });
      await new Promise(r => setTimeout(r, Math.max(...OLD_CALLS.map(c => c.ms)) + 100));
    } else {
      // Single BFF call
      const start = Date.now();
      await new Promise<void>(resolve => {
        const tick = setInterval(() => {
          const pct = Math.min(100, ((Date.now() - start) / BFF_CALL.ms) * 100);
          setBffProgress([{ idx: 0, pct }]);
          if (pct >= 100) { clearInterval(tick); resolve(); }
        }, 16);
      });
    }
    setBffDone(true);
    setSimulatingBff(false);
  };

  const TABS = [
    { id: "review" as const, label: "📺 Review Platform" },
    { id: "tests"  as const, label: "🧪 Test Coverage"   },
    { id: "bff"    as const, label: "🔗 BFF Architecture" },
  ];

  return (
    <div style={{ background: "#0f172a", color: "#f1f5f9", fontFamily: "'Inter', system-ui, sans-serif", minHeight: "100vh", padding: 24 }}>
      {/* Header */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
          <div style={{ width: 36, height: 36, borderRadius: 8, background: "linear-gradient(135deg,#fe2c55,#25f4ee)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>🛡</div>
          <div>
            <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800 }}>TikTok Content Safety — Reviewer Operating Platform</h1>
            <p style={{ margin: 0, color: "#64748b", fontSize: 13 }}>React · MobX · BFF · Unit Testing · Review time reduction 30–40%</p>
          </div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8 }}>
          {[
            { v: "−38%",   l: "Avg Review Time",    c: "#22c55e", sub: "3m 54s → 2m 25s baseline" },
            { v: "70%",    l: "Test Coverage",       c: "#0ea5e9", sub: "From <10% · 194 tests added" },
            { v: "6→1",    l: "Requests per Review", c: "#a855f7", sub: "BFF aggregation layer"      },
            { v: "MobX",   l: "State Architecture",  c: "#f59e0b", sub: "Observables · Actions · Computed" },
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

      {/* ── REVIEW PLATFORM ── */}
      {activeTab === "review" && (
        <div style={{ display: "grid", gridTemplateColumns: "220px 1fr 1fr", gap: 10 }}>
          {/* Queue panel */}
          <div>
            <div style={{ fontSize: 9, fontWeight: 700, color: "#64748b", marginBottom: 6, letterSpacing: "0.08em" }}>QUEUE ({pending.length} pending)</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 4, marginBottom: 8 }}>
              {queue.map((item, i) => {
                const isPending = item.decision === "pending";
                const isCurrent = isPending && pending.indexOf(item) === currentIdx;
                const vl = VIOLATION_LABELS[item.category];
                return (
                  <div key={item.id} onClick={() => isPending && setCurrentIdx(pending.indexOf(item))} style={{ background: isCurrent ? "#1e3a5f" : "#1e293b", border: `1px solid ${isCurrent ? "#3b82f6" : item.decision !== "pending" ? DECISION_COLOR[item.decision] + "40" : "#334155"}`, borderRadius: 7, padding: "7px 9px", cursor: isPending ? "pointer" : "default", opacity: item.decision !== "pending" ? 0.5 : 1 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 3 }}>
                      <span style={{ fontSize: 12 }}>{item.emoji}</span>
                      <span style={{ fontSize: 7, background: vl.color + "20", color: vl.color, borderRadius: 3, padding: "0 5px" }}>{vl.icon} {vl.label}</span>
                    </div>
                    <div style={{ fontSize: 7, fontWeight: 700, marginBottom: 2 }}>{item.title}</div>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 6, color: "#64748b" }}>
                      <span>⚑ {item.reporterCount} reports</span>
                      <span>{item.decision !== "pending" ? <span style={{ color: DECISION_COLOR[item.decision] }}>✓ {item.decision}</span> : item.timeInQueue}</span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Stats */}
            <div style={{ background: "#1e293b", border: "1px solid #334155", borderRadius: 9, padding: 10 }}>
              <div style={{ fontSize: 7, fontWeight: 700, color: "#64748b", marginBottom: 6 }}>TODAY'S STATS</div>
              {[
                { l: "Reviewed", v: `${queue.filter(q => q.decision !== "pending").length}`, c: "#22c55e" },
                { l: "Avg time", v: avgSec ? fmtTime(Math.round(avgSec)) : "—", c: "#0ea5e9" },
                { l: "vs baseline", v: improvement ? `−${improvement}%` : "—", c: "#22c55e" },
              ].map(s => (
                <div key={s.l} style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                  <span style={{ fontSize: 7, color: "#64748b" }}>{s.l}</span>
                  <span style={{ fontSize: 8, fontWeight: 700, color: s.c }}>{s.v}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Content panel */}
          <div>
            {current ? (
              <>
                <div style={{ background: "#1e293b", border: "1px solid #334155", borderRadius: 12, padding: 14, marginBottom: 8 }}>
                  {/* Header */}
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
                    <div>
                      <div style={{ display: "flex", gap: 6, alignItems: "center", marginBottom: 4 }}>
                        <span style={{ fontSize: 22 }}>{current.emoji}</span>
                        <div>
                          <div style={{ fontSize: 11, fontWeight: 800 }}>{current.title}</div>
                          <div style={{ fontSize: 7, color: "#64748b" }}>Flagged {current.flaggedAt} · {current.reporterCount} reports · {current.timeInQueue} in queue</div>
                        </div>
                      </div>
                      <span style={{ fontSize: 7, background: VIOLATION_LABELS[current.category].color + "20", color: VIOLATION_LABELS[current.category].color, borderRadius: 4, padding: "2px 8px", fontWeight: 700 }}>
                        {VIOLATION_LABELS[current.category].icon} {VIOLATION_LABELS[current.category].label}
                      </span>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <div style={{ fontSize: 18, fontWeight: 900, color: elapsed > 90 ? "#ef4444" : elapsed > 60 ? "#f59e0b" : "#22c55e" }}>{fmtTime(elapsed)}</div>
                      <div style={{ fontSize: 7, color: "#64748b" }}>reviewing</div>
                    </div>
                  </div>

                  {/* Content snippet with highlighted words */}
                  <div style={{ background: "#0f172a", borderRadius: 8, padding: "10px 12px", marginBottom: 8 }}>
                    <div style={{ fontSize: 7, color: "#64748b", marginBottom: 4 }}>CONTENT SNIPPET</div>
                    <div style={{ fontSize: 9, lineHeight: 1.8 }}>
                      {current.snippet.split(" ").map((word, i) => {
                        const isFlag = current.flaggedWords.some(fw => word.toLowerCase().includes(fw.toLowerCase()));
                        return <span key={i} style={{ background: isFlag ? "#ef444430" : "transparent", color: isFlag ? "#f87171" : "#94a3b8", borderRadius: isFlag ? 2 : 0, padding: isFlag ? "0 2px" : 0 }}>{word}{" "}</span>;
                      })}
                    </div>
                  </div>

                  {/* Flagged keywords */}
                  <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
                    {current.flaggedWords.map(w => (
                      <span key={w} style={{ fontSize: 7, background: "#ef444420", color: "#f87171", borderRadius: 4, padding: "2px 8px", border: "1px solid #ef444430" }}>⚑ {w}</span>
                    ))}
                  </div>
                </div>

                {/* Keyboard shortcuts */}
                <div style={{ background: "#1e293b", border: "1px solid #334155", borderRadius: 9, padding: "8px 12px" }}>
                  <div style={{ fontSize: 7, fontWeight: 700, color: "#64748b", marginBottom: 5 }}>⌨ KEYBOARD SHORTCUTS</div>
                  <div style={{ display: "flex", gap: 8 }}>
                    {[["A", "Approve", "#22c55e"], ["R", "Remove", "#ef4444"], ["E", "Escalate", "#f59e0b"], ["Tab", "Next Item", "#64748b"]].map(([k, l, c]) => (
                      <div key={k} style={{ display: "flex", gap: 4, alignItems: "center" }}>
                        <kbd style={{ background: "#0f172a", border: `1px solid ${c}`, borderRadius: 3, padding: "2px 6px", fontSize: 7, fontFamily: "monospace", color: c }}>{k}</kbd>
                        <span style={{ fontSize: 7, color: "#64748b" }}>{l}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            ) : (
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: 200, color: "#334155", fontSize: 12 }}>Queue complete — all items reviewed</div>
            )}
          </div>

          {/* Decision panel */}
          <div>
            <div style={{ fontSize: 9, fontWeight: 700, color: "#64748b", marginBottom: 6, letterSpacing: "0.08em" }}>DECISION</div>

            {/* Violation type */}
            <div style={{ background: "#1e293b", border: "1px solid #334155", borderRadius: 10, padding: 12, marginBottom: 8 }}>
              <div style={{ fontSize: 7, color: "#64748b", marginBottom: 6 }}>Violation Type</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 5 }}>
                {(Object.entries(VIOLATION_LABELS) as [ViolationType, { label: string; color: string; icon: string }][]).map(([key, vl]) => (
                  <button key={key} onClick={() => setSelectedViolation(key)} style={{ background: selectedViolation === key ? vl.color + "20" : "#0f172a", border: `1px solid ${selectedViolation === key ? vl.color : "#334155"}`, borderRadius: 6, padding: "6px 8px", cursor: "pointer", textAlign: "left", color: selectedViolation === key ? vl.color : "#475569", fontSize: 8, fontWeight: selectedViolation === key ? 700 : 400 }}>
                    {vl.icon} {vl.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Severity */}
            <div style={{ background: "#1e293b", border: "1px solid #334155", borderRadius: 10, padding: 12, marginBottom: 8 }}>
              <div style={{ fontSize: 7, color: "#64748b", marginBottom: 6 }}>Severity</div>
              <div style={{ display: "flex", gap: 5 }}>
                {(["low", "medium", "high", "critical"] as Severity[]).map(s => (
                  <button key={s} onClick={() => setSelectedSeverity(s)} style={{ flex: 1, background: selectedSeverity === s ? SEV_COLOR[s] + "20" : "#0f172a", border: `1px solid ${selectedSeverity === s ? SEV_COLOR[s] : "#334155"}`, borderRadius: 6, padding: "5px", cursor: "pointer", color: selectedSeverity === s ? SEV_COLOR[s] : "#475569", fontSize: 8, fontWeight: 700 }}>{s}</button>
                ))}
              </div>
            </div>

            {/* Note */}
            <div style={{ marginBottom: 8 }}>
              <textarea value={noteText} onChange={e => setNoteText(e.target.value)} placeholder="Reviewer note (optional)…" rows={2} style={{ width: "100%", background: "#1e293b", border: "1px solid #334155", borderRadius: 7, padding: "7px 10px", color: "#f1f5f9", fontSize: 8, boxSizing: "border-box", resize: "none", fontFamily: "inherit", outline: "none" }} />
            </div>

            {/* Action buttons */}
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {[
                { d: "approve"  as Decision, label: "✓ Approve (A)",   color: "#22c55e", hint: "Content is safe" },
                { d: "remove"   as Decision, label: "🗑 Remove (R)",    color: "#ef4444", hint: "Violates policy"  },
                { d: "escalate" as Decision, label: "↑ Escalate (E)",   color: "#f59e0b", hint: "Needs senior review" },
              ].map(btn => (
                <button key={btn.d} onClick={() => submitDecision(btn.d)} disabled={submitting || !current} style={{ background: `${btn.color}20`, border: `1px solid ${btn.color}50`, borderRadius: 8, padding: "9px 14px", cursor: submitting || !current ? "not-allowed" : "pointer", color: btn.color, fontSize: 9, fontWeight: 700, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span>{btn.label}</span>
                  <span style={{ fontSize: 7, color: "#64748b" }}>{btn.hint}</span>
                </button>
              ))}
            </div>

            {/* Last action toast */}
            {lastAction && (
              <div style={{ marginTop: 8, background: "#22c55e15", border: "1px solid #22c55e30", borderRadius: 7, padding: "6px 10px", fontSize: 8, color: "#4ade80" }}>
                ✓ {lastAction}
              </div>
            )}

            {/* Code block: MobX store */}
            <div style={{ marginTop: 10 }}>
              <CodeBlock label="MobX ReviewStore — observables, actions, computed" color="#f59e0b" code={
`// MOBX REVIEWSTORE: THE STATE BACKBONE
import { makeObservable, observable, action, computed } from "mobx";

class ReviewStore {
  @observable queue: ReviewItem[] = [];
  @observable currentIdx: number = 0;
  @observable decisionTimes: number[] = [];
  @observable isSubmitting = false;

  constructor() { makeObservable(this); }

  // COMPUTED: derived state — no manual cache invalidation
  @computed get pending() {
    return this.queue.filter(q => q.decision === "pending");
  }
  @computed get remainingCount() { return this.pending.length; }
  @computed get avgDecisionMs() {
    if (!this.decisionTimes.length) return null;
    return this.decisionTimes.reduce((a,b) => a+b, 0) / this.decisionTimes.length;
  }
  @computed get improvementPct() {
    const avg = this.avgDecisionMs;
    if (!avg) return null;
    return Math.round((1 - (avg/1000) / BASELINE_SECONDS) * 100);
  }

  @action async submitDecision(itemId: string, decision: Decision) {
    this.isSubmitting = true;
    const elapsed = Date.now() - this.itemStartTime;
    await apiClient.post("/review/decision", { itemId, decision });
    runInAction(() => {
      const item = this.queue.find(q => q.id === itemId);
      if (item) item.decision = decision;
      this.decisionTimes.push(elapsed);
      this.isSubmitting = false;
    });
  }

  @action async batchDecision(ids: string[], decision: Decision) {
    // Batch: one request for N items. Fewer round trips.
    await apiClient.post("/review/batch", { ids, decision });
    runInAction(() => {
      ids.forEach(id => {
        const item = this.queue.find(q => q.id === id);
        if (item) item.decision = decision;
      });
    });
  }
}
// WHY MOBX (not Redux, not Zustand):
// Review platform: deeply interconnected state.
// "When currentItem changes, decisionPanel should reset.
//  When queue empties, load more. When avgTime crosses threshold, alert supervisor."
// MobX reactions: connect these automatically.
// Redux: would require explicit action chains and selectors for each connection.
// MobX: derived state via @computed. Side effects via reaction(). Minimal boilerplate.`} />
            </div>
          </div>
        </div>
      )}

      {/* ── TEST COVERAGE ── */}
      {activeTab === "tests" && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
          {/* Left: coverage dashboard */}
          <div>
            <div style={{ fontSize: 10, fontWeight: 700, color: "#64748b", marginBottom: 8, letterSpacing: "0.08em" }}>COVERAGE DASHBOARD</div>

            {/* Before/After toggle */}
            <div style={{ display: "flex", gap: 5, marginBottom: 10 }}>
              {(["before", "after"] as const).map(m => (
                <button key={m} onClick={() => setCoverageMode(m)} style={{ flex: 1, background: coverageMode === m ? (m === "before" ? "#ef444420" : "#22c55e20") : "#1e293b", border: `1px solid ${coverageMode === m ? (m === "before" ? "#ef4444" : "#22c55e") : "#334155"}`, borderRadius: 7, padding: "7px", cursor: "pointer", color: coverageMode === m ? (m === "before" ? "#f87171" : "#4ade80") : "#64748b", fontSize: 9, fontWeight: 700 }}>
                  {m === "before" ? `🔴 Before (<${overallBefore}% avg)` : `🟢 After (${overallAfter}% avg)`}
                </button>
              ))}
            </div>

            {/* Coverage bars */}
            <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 12 }}>
              {COVERAGE.map(c => {
                const pct = coverageMode === "before" ? c.before : c.after;
                return (
                  <div key={c.area} style={{ background: "#1e293b", border: "1px solid #334155", borderRadius: 8, padding: "8px 12px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
                      <span style={{ fontSize: 8, fontWeight: 700 }}>{c.area}</span>
                      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                        {coverageMode === "after" && <span style={{ fontSize: 7, color: "#22c55e" }}>{c.tests} tests</span>}
                        <span style={{ fontSize: 10, fontWeight: 900, color: pct >= 70 ? "#22c55e" : pct >= 40 ? "#f59e0b" : "#ef4444" }}>{pct}%</span>
                      </div>
                    </div>
                    <div style={{ background: "#0f172a", borderRadius: 3, height: 8, overflow: "hidden" }}>
                      <div style={{ height: "100%", background: pct >= 70 ? "#22c55e" : pct >= 40 ? "#f59e0b" : "#ef4444", width: `${pct}%`, borderRadius: 3, transition: "width 0.5s" }} />
                    </div>
                    {coverageMode === "after" && (
                      <div style={{ fontSize: 6, color: "#475569", marginTop: 3 }}>↑ +{c.after - c.before}% from {c.before}% baseline</div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Test runner */}
            <div style={{ background: "#1e293b", border: "1px solid #334155", borderRadius: 10, padding: 12 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                <div style={{ fontSize: 8, fontWeight: 700 }}>🧪 Test Runner ({TEST_CASES.length} tests)</div>
                <button onClick={runTests} disabled={running} style={{ background: "#0ea5e920", border: "1px solid #0ea5e9", borderRadius: 5, padding: "4px 12px", cursor: running ? "not-allowed" : "pointer", color: "#38bdf8", fontSize: 8, fontWeight: 700 }}>
                  {running ? "Running…" : "▶ Run All"}
                </button>
              </div>
              <div style={{ display: "flex", gap: 4, flexWrap: "wrap", marginBottom: 8 }}>
                {TEST_CASES.map((tc, i) => (
                  <div key={i} title={tc.name} style={{ width: 14, height: 14, borderRadius: 3, background: passedTests.includes(i) ? "#22c55e" : running && passedTests.length === i ? "#f59e0b" : "#334155", transition: "background 0.2s" }} />
                ))}
              </div>
              <div style={{ maxHeight: 140, overflow: "auto" }}>
                {TEST_CASES.map((tc, i) => (
                  <div key={i} style={{ display: "flex", gap: 6, alignItems: "center", padding: "2px 0" }}>
                    <span style={{ fontSize: 9, width: 12 }}>{passedTests.includes(i) ? "✓" : running && passedTests.length === i ? "⏳" : "○"}</span>
                    <span style={{ fontSize: 7, color: passedTests.includes(i) ? "#4ade80" : "#64748b", fontFamily: "monospace" }}>{tc.name}</span>
                    {passedTests.includes(i) && <span style={{ fontSize: 6, color: "#475569", marginLeft: "auto" }}>{tc.ms}ms</span>}
                  </div>
                ))}
              </div>
              {passedTests.length === TEST_CASES.length && (
                <div style={{ marginTop: 6, fontSize: 8, color: "#4ade80", fontWeight: 700 }}>✓ All {TEST_CASES.length} tests passed · {TEST_CASES.reduce((s, t) => s + t.ms, 0)}ms</div>
              )}
            </div>
          </div>

          {/* Right: code */}
          <div>
            <div style={{ fontSize: 10, fontWeight: 700, color: "#64748b", marginBottom: 8, letterSpacing: "0.08em" }}>IMPLEMENTATION DEPTH</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <CodeBlock label="MobX store testing — the pattern that unlocked coverage" color="#a855f7" code={
`// TESTING MOBX STORES: THE CORRECT APPROACH
// MobX stores: pure JavaScript classes. Test them without React. Without JSDOM.
// Just instantiate, call actions, assert observables.
//
describe("ReviewStore", () => {
  let store: ReviewStore;

  beforeEach(() => {
    store = new ReviewStore(); // fresh store each test
    store.loadQueue(mockQueue); // inject test data
  });

  it("submitDecision: updates item decision in queue", async () => {
    const item = store.pending[0];
    await store.submitDecision(item.id, "remove");
    expect(store.queue.find(q => q.id === item.id)?.decision).toBe("remove");
  });

  it("computed remainingCount: decrements after decision", async () => {
    const before = store.remainingCount;
    await store.submitDecision(store.pending[0].id, "approve");
    expect(store.remainingCount).toBe(before - 1);
  });

  it("avgDecisionMs: computed from decisionTimes", () => {
    // Directly mutate the observable (testing computed derivation)
    runInAction(() => {
      store.decisionTimes = [5000, 7000, 3000]; // 5s, 7s, 3s
    });
    expect(store.avgDecisionMs).toBe(5000); // average of [5000, 7000, 3000]
  });

  it("batchDecision: applies same decision to all selected", async () => {
    const ids = store.pending.slice(0, 3).map(q => q.id);
    await store.batchDecision(ids, "approve");
    ids.forEach(id => {
      expect(store.queue.find(q => q.id === id)?.decision).toBe("approve");
    });
  });
});
//
// WHY STORE TESTS MATTER:
// The store IS the business logic. "When I submit a remove decision,
// the item must leave the pending queue AND be logged in decisionTimes AND
// the avg must recalculate." These are correctness requirements.
// Testing the UI alone (screenshot tests, interaction tests) doesn't verify
// that the business logic is correct. Store tests: verify the logic.
// When we refactored: store tests caught 3 bugs where computed values
// were not updating correctly after actions. Would have shipped to reviewers.`} />

              <CodeBlock label="Component testing — keyboard shortcuts, accessibility, MobX integration" color="#0ea5e9" code={
`// COMPONENT TESTING: THE SETUP THAT MADE IT SCALABLE
// Challenge at <10% coverage: no shared test utilities.
// Each test: 50+ lines of boilerplate. Painful. Engineers avoided writing them.
//
// SOLUTION: shared test utilities (the unlock)
// Created: src/__test-utils__/renderWithStore.tsx
//
const renderWithStore = (ui: React.ReactElement, storeOverrides = {}) => {
  const store = new ReviewStore({ ...defaultStoreState, ...storeOverrides });
  return {
    ...render(<StoreContext.Provider value={store}>{ui}</StoreContext.Provider>),
    store,
  };
};
//
// NOW: every component test starts with one line.
// Before: 50 lines of setup. After: 1 line. Tests became easy to write.
//
describe("DecisionPanel", () => {
  it("renders all violation type buttons", () => {
    const { getByText } = renderWithStore(<DecisionPanel />);
    expect(getByText("Violence")).toBeInTheDocument();
    expect(getByText("Hate Speech")).toBeInTheDocument();
    expect(getByText("Spam")).toBeInTheDocument();
  });

  it("keyboard shortcut A submits approve decision", async () => {
    const { store } = renderWithStore(<DecisionPanel />, {
      queue: [mockItem], currentIdx: 0
    });
    await userEvent.keyboard("a"); // simulates pressing "A" key
    await waitFor(() => {
      expect(store.queue[0].decision).toBe("approve");
    });
  });

  it("submit button: disabled when no violation category selected", () => {
    const { getByRole } = renderWithStore(<DecisionPanel />, {
      selectedViolation: null
    });
    expect(getByRole("button", { name: /approve/i })).toBeDisabled();
  });

  it("displays flagged keywords highlighted in content snippet", () => {
    const { container } = renderWithStore(<ContentSnippet item={mockItem} />);
    const highlighted = container.querySelectorAll(".flagged-word");
    expect(highlighted.length).toBeGreaterThan(0);
    highlighted.forEach(el => {
      expect(mockItem.flaggedWords.some(
        fw => el.textContent?.toLowerCase().includes(fw)
      )).toBe(true);
    });
  });
});
//
// THE COVERAGE STRATEGY (getting from <10% to 70%):
// Step 1: identify base components (used in 3+ places). Test these first.
//         High coverage per hour invested. Bugs here: affect many features.
// Step 2: create the shared test utilities BEFORE writing tests.
//         Reduces the barrier to writing tests from painful to trivial.
// Step 3: add tests alongside every PR (not as a separate "testing sprint").
//         "If there's no test for it, we don't ship it."
// Step 4: set the CI coverage gate at 70%.
//         Coverage doesn't drift below 70% because the build fails if it does.`} />
            </div>
          </div>
        </div>
      )}

      {/* ── BFF ARCHITECTURE ── */}
      {activeTab === "bff" && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
          {/* Left: visualization */}
          <div>
            <div style={{ fontSize: 10, fontWeight: 700, color: "#64748b", marginBottom: 8, letterSpacing: "0.08em" }}>BFF ARCHITECTURE — REQUEST SIMULATION</div>

            <div style={{ display: "flex", gap: 5, marginBottom: 10 }}>
              {(["before", "after"] as const).map(m => (
                <button key={m} onClick={() => simulateBff(m)} disabled={simulatingBff} style={{ flex: 1, background: bffMode === m && !simulatingBff ? (m === "before" ? "#ef444420" : "#22c55e20") : "#1e293b", border: `1px solid ${bffMode === m ? (m === "before" ? "#ef4444" : "#22c55e") : "#334155"}`, borderRadius: 7, padding: "7px", cursor: simulatingBff ? "not-allowed" : "pointer", color: bffMode === m ? (m === "before" ? "#f87171" : "#4ade80") : "#64748b", fontSize: 9, fontWeight: 700 }}>
                  {m === "before" ? "🔴 Without BFF (6 requests)" : "🟢 With BFF (1 request)"}
                </button>
              ))}
            </div>

            {/* Request simulation */}
            <div style={{ background: "#1e293b", border: "1px solid #334155", borderRadius: 10, padding: 12, marginBottom: 10 }}>
              <div style={{ fontSize: 8, fontWeight: 700, marginBottom: 8 }}>
                {bffMode === "before" ? "Frontend → 6 Parallel API Calls" : "Frontend → BFF → 6 Backend Services (internal)"}
              </div>

              {bffMode === "before" ? (
                <>
                  {/* Frontend box */}
                  <div style={{ background: "#0f172a", border: "1px solid #3b82f6", borderRadius: 6, padding: "5px 10px", marginBottom: 8, fontSize: 8, color: "#60a5fa" }}>🖥 Frontend (review page loads)</div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                    {OLD_CALLS.map((call, i) => {
                      const prog = bffProgress[i]?.pct ?? 0;
                      return (
                        <div key={i}>
                          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 2 }}>
                            <span style={{ fontSize: 7, color: call.color, fontFamily: "monospace" }}>→ {call.endpoint}</span>
                            <span style={{ fontSize: 6, color: "#475569" }}>{call.ms}ms</span>
                          </div>
                          <div style={{ background: "#0f172a", borderRadius: 2, height: 6 }}>
                            <div style={{ height: "100%", background: call.color, width: `${prog}%`, borderRadius: 2, transition: "width 0.05s" }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  {bffDone && (
                    <div style={{ marginTop: 8, fontSize: 8, color: "#ef4444", fontWeight: 700 }}>
                      ⏱ Total: {Math.max(...OLD_CALLS.map(c => c.ms))}ms for slowest request + 6 request overhead
                    </div>
                  )}
                </>
              ) : (
                <>
                  {/* BFF flow */}
                  <div style={{ background: "#0f172a", border: "1px solid #3b82f6", borderRadius: 6, padding: "5px 10px", marginBottom: 6, fontSize: 8, color: "#60a5fa" }}>🖥 Frontend (review page loads)</div>
                  <div style={{ fontSize: 8, color: "#64748b", marginLeft: 20, marginBottom: 4 }}>↓ 1 request</div>
                  <div style={{ background: "#0f172a", border: "1px solid #fe2c55", borderRadius: 6, padding: "8px 10px", marginBottom: 6 }}>
                    <div style={{ fontSize: 8, fontWeight: 700, color: "#fe2c55", marginBottom: 4 }}>🔗 BFF: /bff/review/next</div>
                    <div style={{ background: "#0f172a", borderRadius: 2, height: 8, marginBottom: 4 }}>
                      <div style={{ height: "100%", background: "#fe2c55", width: `${bffProgress[0]?.pct ?? 0}%`, borderRadius: 2, transition: "width 0.05s" }} />
                    </div>
                    <div style={{ fontSize: 6, color: "#475569" }}>Fans out to all 6 services internally (server-to-server: low latency)</div>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 4 }}>
                    {OLD_CALLS.map((call, i) => (
                      <div key={i} style={{ background: "#0f172a", border: `1px solid ${call.color}30`, borderRadius: 5, padding: "4px 6px" }}>
                        <div style={{ fontSize: 6, color: call.color }}>{call.service}</div>
                        <div style={{ fontSize: 5, color: "#475569" }}>{call.ms}ms</div>
                      </div>
                    ))}
                  </div>
                  {bffDone && (
                    <div style={{ marginTop: 8, fontSize: 8, color: "#22c55e", fontWeight: 700 }}>
                      ⏱ Total: {BFF_CALL.ms}ms · 1 request from frontend · {((Math.max(...OLD_CALLS.map(c => c.ms)) - BFF_CALL.ms) / Math.max(...OLD_CALLS.map(c => c.ms)) * 100).toFixed(0)}% overhead reduction
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Comparison metrics */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
              {[
                { label: "Without BFF",  requests: 6, latency: `${Math.max(...OLD_CALLS.map(c => c.ms))}ms`, overhead: "High (6 TCP handshakes)", color: "#ef4444" },
                { label: "With BFF",     requests: 1, latency: `${BFF_CALL.ms}ms`, overhead: "Low (1 TCP handshake)", color: "#22c55e" },
              ].map(m => (
                <div key={m.label} style={{ background: "#1e293b", border: `1px solid ${m.color}30`, borderRadius: 9, padding: 10 }}>
                  <div style={{ fontSize: 8, fontWeight: 700, color: m.color, marginBottom: 6 }}>{m.label}</div>
                  {[["Requests", String(m.requests)], ["Max latency", m.latency], ["Overhead", m.overhead]].map(([k, v]) => (
                    <div key={k} style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
                      <span style={{ fontSize: 7, color: "#64748b" }}>{k}</span>
                      <span style={{ fontSize: 7, fontWeight: 700 }}>{v}</span>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>

          {/* Right: code */}
          <div>
            <div style={{ fontSize: 10, fontWeight: 700, color: "#64748b", marginBottom: 8, letterSpacing: "0.08em" }}>IMPLEMENTATION DEPTH</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <CodeBlock label="BFF pattern — why, what it aggregates, Node.js implementation" color="#a855f7" code={
`// BFF (BACKEND FOR FRONTEND): THE PROBLEM IT SOLVES
//
// THE PROBLEM:
// When a reviewer opens an item in the queue, the frontend needed:
//   1. The item itself: content, reporter count, metadata
//   2. Media URLs: video/image manifest for playback
//   3. Policy docs: what violation types apply, severity rules
//   4. Label options: all available categories + translations
//   5. Reviewer stats: today's count, avg time, streak
//   6. Content history: past actions on this account/content
//
// Before BFF: 6 parallel API calls. Each to a different microservice.
// Problems:
// a. 6 TCP connections from the browser to different services.
//    Each: DNS lookup + TLS handshake + HTTP request overhead.
// b. If ANY of the 6 fails: partial UI. Some sections: undefined.
//    Error handling: 6 different try/catch blocks.
// c. Over-fetching: each service returns its full schema.
//    The reviewer panel: only uses ~30% of the data returned.
// d. Caching: difficult. 6 different endpoints, 6 different cache strategies.
//
// WITH BFF: 1 request from the frontend.
// The BFF (a Node.js server) receives the request:
//   POST /bff/review/next
// It fans out internally (server-to-server):
//   - Internal network: ~5ms latency vs ~150ms browser-to-server.
//   - All 6 service calls: run in parallel with Promise.all.
//   - If a non-critical service fails (reviewer stats):
//     BFF returns the item with stats: null. UI degrades gracefully.
// It responds with exactly the shape the UI needs. No over-fetching.
//
// NODE.JS BFF IMPLEMENTATION (Express):
app.post("/bff/review/next", authenticate, async (req, res) => {
  const { reviewerId } = req.user;

  const [item, policies, labels, stats] = await Promise.allSettled([
    queueService.getNextItem(reviewerId),           // internal: ~20ms
    policyService.getViolationTypes(),              // internal: ~15ms
    labelService.getCategories(req.headers["accept-language"]), // ~10ms
    reviewerService.getStats(reviewerId),           // internal: ~25ms
  ]);

  if (item.status === "rejected") {
    return res.status(503).json({ error: "Queue unavailable" });
  }

  const itemId = item.value.id;
  const [media, history] = await Promise.allSettled([
    mediaService.getManifest(itemId),   // depends on itemId
    historyService.getActions(itemId),  // depends on itemId
  ]);

  // RESPONSE SHAPING: return only what the UI needs
  res.json({
    item:         item.value,
    media:        media.status === "fulfilled" ? media.value : null,
    policies:     policies.status === "fulfilled" ? policies.value : FALLBACK_POLICIES,
    labels:       labels.status === "fulfilled" ? labels.value : FALLBACK_LABELS,
    reviewerStats:stats.status === "fulfilled" ? stats.value : null, // non-critical
    history:      history.status === "fulfilled" ? history.value : [],
  });
});
//
// RESULT:
// Frontend: 6 API calls → 1 BFF call.
// Page load data: assembled in 260ms (parallelised internally).
// Previous worst case: 500ms+ (slowest sequential dependency).
// Error handling: one try/catch. Graceful degradation per service.
// Reviewer experience: data arrives faster. No "loading..." on 6 sections.`} />

              <CodeBlock label="Codebase refactoring — what changed and why it mattered" color="#22c55e" code={
`// CODEBASE REFACTORING: THE REVIEW TIME CONNECTION
//
// The 30–40% review time reduction: not only from product UX changes.
// A significant part: from fixing technical issues that slowed reviewers down.
//
// PROBLEM 1: RE-RENDER STORMS (identified via React DevTools Profiler)
// The content snippet component: re-rendered on EVERY keystroke in the note field.
// Why: the note textarea and the content snippet: lived in the same component.
// Every character typed: re-rendered the expensive content rendering logic.
// Fix: extract ContentSnippet into its own component.
//      memo() it. It only re-renders when the item changes (not on note keystrokes).
// Impact: 300ms → 5ms render time when typing notes. Feels instant.
//
// PROBLEM 2: DUPLICATE API CALLS (MobX reaction bug)
// A MobX reaction was firing on every observable change, including transient ones.
// The reaction: triggered a fetch of the next item in the queue.
// Race condition: if the reviewer decided quickly, 2 fetches ran simultaneously.
// The second fetch: overwrote the first. Queue state: corrupted.
// Fix: debounce the reaction. Only trigger after state settles for 50ms.
// reaction(() => store.currentIdx, () => {
//   debounce(() => store.loadNextItem(), 50)();
// });
//
// PROBLEM 3: COMPONENT SPRAWL (16 variants of the same button)
// Codebase audit: found 16 different "action button" implementations.
// Each: slightly different styling, different keyboard event handling.
// Some: accessible. Some: not (missing aria-label, missing role="button").
// Fix: extract BaseActionButton with enforced accessibility props.
//   Required prop: aria-label.
//   Keyboard handling: built into the base component.
//   Delete 15 of the 16 implementations. Replace with BaseActionButton.
// Impact: keyboard shortcuts: now work consistently across the platform.
//
// PROBLEM 4: SLOW INITIAL LOAD (bundle analysis)
// The review platform: loaded the ENTIRE label taxonomy on startup.
// 2,400 violation sub-categories across 8 languages: 840KB JSON.
// Reviewers: only use the categories relevant to their assigned queue.
// Fix: lazy load label sets. Load only the primary language on startup.
//      Load others on demand when a reviewer changes their language setting.
// Impact: initial bundle: 840KB → 12KB for labels. Page load: faster.
//
// THE LESSON: "Performance optimisation" is not separate from "product work".
// Every slow re-render: reviewer hesitation. Every duplicate API call:
// corrupted state that the reviewer has to work around.
// Technical debt: directly correlates to reviewer efficiency.
// The 30–40% target: only achievable by fixing both product UX AND tech debt.`} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ContentSafetyPlatformDemo;
