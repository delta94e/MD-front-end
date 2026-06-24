/**
 * ComplianceInfraDemo.tsx
 *
 * Four engineering achievements:
 *   1. Intervention SDK        — compliance SDK (age gate, policy, feature gating)
 *   2. Content Safety Console  — real-time moderation, RBAC, 10K+ daily events
 *   3. Advanced Search Platform — Next.js/GraphQL/BigData, 2-week MVP, 2.4B records
 *   4. Frontend Infrastructure — Storybook design system, CI, −25% UI defects
 *
 * TABS
 *   🛡 Intervention SDK       — interactive age gate / policy / feature gate demo
 *   🔍 Content Safety Console — live moderation queue + role switcher + RBAC
 *   🔎 Search + 🏗 DX          — BigData search UI + design system metrics
 */

import React, { useState, useEffect, useRef, useCallback } from "react";

// ─────────────────────────────────────────────────────────────────
// Intervention SDK data
// ─────────────────────────────────────────────────────────────────

type InterventionType  = "age-gate" | "policy" | "feature-gate";
type InterventionState = "idle" | "pending" | "approved" | "denied";

const POLICIES = [
  "We have updated our Privacy Policy to comply with global regulations.",
  "By continuing, you agree to our updated Terms of Service (v4.2.0).",
  "Content monetization rules have changed. Review to continue posting.",
];

const FEATURES = [
  { name: "Advanced Analytics Dashboard", reason: "region" },
  { name: "AI-Powered Content Suggestions", reason: "subscription" },
  { name: "Bulk Export (CSV/JSON)",          reason: "tier" },
];

// ─────────────────────────────────────────────────────────────────
// Content Safety data
// ─────────────────────────────────────────────────────────────────

type ContentCategory = "hate-speech" | "spam" | "violence" | "misinformation" | "nsfw";
type ReviewAction    = "approve" | "reject" | "escalate" | "pending";

interface ModerationEvent {
  id: string; category: ContentCategory; content: string;
  source: string; risk: number; action: ReviewAction; ts: string;
}

const CONTENT_SNIPPETS: { cat: ContentCategory; text: string; risk: number }[] = [
  { cat: "spam",           text: "CLICK HERE FOR FREE GIFTCARD!!!",              risk: 92 },
  { cat: "misinformation", text: "Study shows 5G towers cause memory loss...",   risk: 78 },
  { cat: "hate-speech",   text: "A post using derogatory language against...",   risk: 95 },
  { cat: "nsfw",           text: "Image flagged by visual classifier (0.89).",   risk: 89 },
  { cat: "violence",       text: "Graphic description of self-harm methods.",    risk: 97 },
  { cat: "spam",           text: "Earn $500/day working from home! DM us now",   risk: 85 },
  { cat: "misinformation", text: "New peer-reviewed paper claiming vaccines...", risk: 71 },
  { cat: "hate-speech",   text: "Repeated racial slurs in comment thread.",      risk: 99 },
];

let evtCounter = 100;
function makeEvent(): ModerationEvent {
  const s = CONTENT_SNIPPETS[Math.floor(Math.random() * CONTENT_SNIPPETS.length)];
  return {
    id: `evt-${evtCounter++}`, category: s.cat, content: s.text,
    source: ["web", "mobile-ios", "mobile-android", "api"][Math.floor(Math.random() * 4)],
    risk: s.risk + Math.floor(Math.random() * 4 - 2), action: "pending",
    ts: new Date().toISOString(),
  };
}

type UserRole = "reviewer" | "senior-reviewer" | "admin";
const ROLE_CAPS: Record<UserRole, { canEscalate: boolean; canConfigure: boolean; seePII: boolean; canBulk: boolean }> = {
  "reviewer":        { canEscalate: false, canConfigure: false, seePII: false, canBulk: false },
  "senior-reviewer": { canEscalate: true,  canConfigure: false, seePII: true,  canBulk: true  },
  "admin":           { canEscalate: true,  canConfigure: true,  seePII: true,  canBulk: true  },
};

const CAT_COLOR: Record<ContentCategory, string> = {
  "hate-speech": "#ef4444", spam: "#f59e0b", violence: "#dc2626", misinformation: "#0ea5e9", nsfw: "#a855f7",
};

// ─────────────────────────────────────────────────────────────────
// Search data
// ─────────────────────────────────────────────────────────────────

const SAMPLE_RESULTS = [
  { id: "r1", title: "Q3 Revenue Cohort Analysis", type: "report",    rows: "2.4M", ts: "2024-06-15" },
  { id: "r2", title: "User Session Funnel — APAC", type: "dashboard", rows: "890K", ts: "2024-06-14" },
  { id: "r3", title: "Content Engagement Signals", type: "dataset",   rows: "12B",  ts: "2024-06-13" },
  { id: "r4", title: "Ad Impression Log — Jun 2024", type: "log",     rows: "4.1B", ts: "2024-06-12" },
  { id: "r5", title: "Fraud Detection Events",       type: "events",  rows: "98M",  ts: "2024-06-11" },
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
// Intervention Overlay
// ─────────────────────────────────────────────────────────────────

function InterventionOverlay({
  type, onClose,
}: { type: InterventionType; onClose: (result: "approved" | "denied") => void }) {
  const [birthYear, setBirthYear] = useState("");
  const [policyIdx]               = useState(0);
  const [featIdx]                 = useState(0);
  const [checked, setChecked]     = useState(false);

  const handleAgeSubmit = () => {
    const age = new Date().getFullYear() - parseInt(birthYear);
    onClose(age >= 18 ? "approved" : "denied");
  };

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}>
      <div style={{ background: "#1e293b", border: "1px solid #334155", borderRadius: 16, padding: 28, maxWidth: 380, width: "90%", boxShadow: "0 20px 60px rgba(0,0,0,0.5)" }}>
        {type === "age-gate" && (
          <>
            <div style={{ fontSize: 28, marginBottom: 12 }}>🔞</div>
            <h3 style={{ margin: "0 0 6px", fontSize: 16, fontWeight: 800 }}>Age Verification Required</h3>
            <p style={{ margin: "0 0 16px", fontSize: 12, color: "#64748b" }}>This content is restricted to users 18 and older.</p>
            <label style={{ fontSize: 11, color: "#94a3b8", display: "block", marginBottom: 4 }}>Your birth year</label>
            <input
              type="number" placeholder="e.g. 1995" value={birthYear}
              onChange={e => setBirthYear(e.target.value)}
              style={{ width: "100%", background: "#0f172a", border: "1px solid #334155", borderRadius: 8, padding: "8px 12px", color: "#f1f5f9", fontSize: 13, boxSizing: "border-box", marginBottom: 12 }}
            />
            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={() => onClose("denied")} style={{ flex: 1, background: "transparent", border: "1px solid #334155", borderRadius: 8, padding: "8px", color: "#64748b", cursor: "pointer", fontSize: 12 }}>Cancel</button>
              <button onClick={handleAgeSubmit} disabled={!birthYear} style={{ flex: 1, background: "#0066ff", border: "none", borderRadius: 8, padding: "8px", color: "#fff", cursor: birthYear ? "pointer" : "not-allowed", fontSize: 12, fontWeight: 700 }}>Verify Age</button>
            </div>
          </>
        )}
        {type === "policy" && (
          <>
            <div style={{ fontSize: 28, marginBottom: 12 }}>📜</div>
            <h3 style={{ margin: "0 0 6px", fontSize: 16, fontWeight: 800 }}>Policy Update</h3>
            <p style={{ margin: "0 0 16px", fontSize: 12, color: "#94a3b8", lineHeight: 1.5 }}>{POLICIES[policyIdx]}</p>
            <label style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 16, cursor: "pointer" }}>
              <input type="checkbox" checked={checked} onChange={e => setChecked(e.target.checked)} />
              <span style={{ fontSize: 11, color: "#94a3b8" }}>I have read and agree to the updated terms.</span>
            </label>
            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={() => onClose("denied")} style={{ flex: 1, background: "transparent", border: "1px solid #334155", borderRadius: 8, padding: "8px", color: "#64748b", cursor: "pointer", fontSize: 12 }}>Decline</button>
              <button onClick={() => onClose("approved")} disabled={!checked} style={{ flex: 1, background: checked ? "#0066ff" : "#1e3a5f", border: "none", borderRadius: 8, padding: "8px", color: checked ? "#fff" : "#334155", cursor: checked ? "pointer" : "not-allowed", fontSize: 12, fontWeight: 700 }}>Accept</button>
            </div>
          </>
        )}
        {type === "feature-gate" && (
          <>
            <div style={{ fontSize: 28, marginBottom: 12 }}>🔒</div>
            <h3 style={{ margin: "0 0 6px", fontSize: 16, fontWeight: 800 }}>Feature Unavailable</h3>
            <p style={{ margin: "0 0 4px", fontSize: 14, color: "#f1f5f9", fontWeight: 600 }}>{FEATURES[featIdx].name}</p>
            <p style={{ margin: "0 0 16px", fontSize: 12, color: "#64748b" }}>
              {FEATURES[featIdx].reason === "region" && "This feature is not available in your region."}
              {FEATURES[featIdx].reason === "subscription" && "Upgrade to Pro to unlock this feature."}
              {FEATURES[featIdx].reason === "tier" && "This feature is available on the Business plan."}
            </p>
            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={() => onClose("denied")} style={{ flex: 1, background: "transparent", border: "1px solid #334155", borderRadius: 8, padding: "8px", color: "#64748b", cursor: "pointer", fontSize: 12 }}>Maybe Later</button>
              <button onClick={() => onClose("approved")} style={{ flex: 1, background: "#7c3aed", border: "none", borderRadius: 8, padding: "8px", color: "#fff", cursor: "pointer", fontSize: 12, fontWeight: 700 }}>Upgrade Plan</button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
// Main
// ─────────────────────────────────────────────────────────────────

export function ComplianceInfraDemo() {
  const [activeTab, setActiveTab] = useState<"sdk" | "safety" | "search">("sdk");

  // ── SDK state
  const [activeIntervention, setActiveIntervention] = useState<InterventionType | null>(null);
  const [sdkResults, setSdkResults] = useState<Record<InterventionType, InterventionState>>({
    "age-gate": "idle", "policy": "idle", "feature-gate": "idle",
  });

  const triggerIntervention = (type: InterventionType) => setActiveIntervention(type);
  const handleClose = (result: "approved" | "denied") => {
    setSdkResults(prev => ({ ...prev, [activeIntervention!]: result }));
    setActiveIntervention(null);
  };

  // ── Safety state
  const [events, setEvents] = useState<ModerationEvent[]>(() => Array.from({ length: 6 }, makeEvent));
  const [streaming, setStreaming] = useState(false);
  const [role, setRole] = useState<UserRole>("reviewer");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const streamRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const toggleStream = () => {
    if (streaming) { clearInterval(streamRef.current!); setStreaming(false); }
    else {
      setStreaming(true);
      streamRef.current = setInterval(() => {
        setEvents(prev => [makeEvent(), ...prev.slice(0, 14)]);
      }, 1100);
    }
  };
  useEffect(() => () => { if (streamRef.current) clearInterval(streamRef.current); }, []);

  const caps = ROLE_CAPS[role];
  const reviewEvent = (id: string, action: ReviewAction) =>
    setEvents(prev => prev.map(e => e.id === id ? { ...e, action } : e));
  const bulkAction = (action: ReviewAction) => {
    setEvents(prev => prev.map(e => selected.has(e.id) ? { ...e, action } : e));
    setSelected(new Set());
  };
  const toggleSelect = (id: string) => {
    setSelected(prev => { const s = new Set(prev); s.has(id) ? s.delete(id) : s.add(id); return s; });
  };
  const throughput = events.filter(e => e.action !== "pending").length;

  // ── Search state
  const [query, setQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [searching, setSearching] = useState(false);
  const [results, setResults] = useState(SAMPLE_RESULTS);
  const searchRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleSearch = (q: string) => {
    setQuery(q); setSearching(true);
    if (searchRef.current) clearTimeout(searchRef.current);
    searchRef.current = setTimeout(() => {
      const filtered = SAMPLE_RESULTS.filter(r =>
        r.title.toLowerCase().includes(q.toLowerCase()) &&
        (typeFilter === "all" || r.type === typeFilter)
      );
      setResults(filtered); setSearching(false);
    }, 400);
  };

  const TABS = [
    { id: "sdk"    as const, label: "🛡 Intervention SDK"      },
    { id: "safety" as const, label: "🔍 Content Safety Console" },
    { id: "search" as const, label: "🔎 Search + 🏗 DX"        },
  ];

  return (
    <div style={{ background: "#0f172a", color: "#f1f5f9", fontFamily: "'Inter', system-ui, sans-serif", minHeight: "100vh", padding: 24 }}>

      {activeIntervention && <InterventionOverlay type={activeIntervention} onClose={handleClose} />}

      {/* Header */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
          <div style={{ width: 36, height: 36, borderRadius: 8, background: "linear-gradient(135deg,#7c3aed,#ef4444)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>⚡</div>
          <div>
            <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800 }}>Compliance, Safety & Search Platform</h1>
            <p style={{ margin: 0, color: "#64748b", fontSize: 13 }}>Intervention SDK · Content Safety Console · BigData Search · Frontend DX</p>
          </div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8, marginBottom: 10 }}>
          {[
            { v: "−65%",  l: "Duplicate Code",       c: "#0ea5e9", sub: "Intervention SDK across 4+ apps" },
            { v: "<2h",   l: "Integration Time",      c: "#22c55e", sub: "vs. days previously"             },
            { v: "+30%",  l: "Reviewer Throughput",   c: "#a855f7", sub: "Content Safety Console"          },
            { v: "2B+",   l: "Records Searched",      c: "#f59e0b", sub: "Advanced Search Platform"        },
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

      {/* ── INTERVENTION SDK ── */}
      {activeTab === "sdk" && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
          <div>
            <div style={{ fontSize: 10, fontWeight: 700, color: "#64748b", marginBottom: 8, letterSpacing: "0.08em" }}>
              INTERVENTION SDK — LIVE DEMO
            </div>
            <div style={{ background: "#1e293b", border: "1px solid #334155", borderRadius: 10, padding: 16, marginBottom: 10 }}>
              <div style={{ fontSize: 9, color: "#64748b", marginBottom: 12 }}>Click to trigger an intervention. The SDK handles the UX flow, state management, and resolution.</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {([
                  { type: "age-gate"     as const, icon: "🔞", label: "Age Gate",        color: "#ef4444", desc: "Verify user is 18+" },
                  { type: "policy"       as const, icon: "📜", label: "Policy Prompt",   color: "#0ea5e9", desc: "Require policy acceptance" },
                  { type: "feature-gate" as const, icon: "🔒", label: "Feature Gate",    color: "#7c3aed", desc: "Upsell / region block" },
                ]).map(i => {
                  const result = sdkResults[i.type];
                  return (
                    <div key={i.type} style={{ display: "flex", alignItems: "center", gap: 10, background: "#0f172a", borderRadius: 8, padding: "10px 14px", border: `1px solid ${i.color}20` }}>
                      <span style={{ fontSize: 20 }}>{i.icon}</span>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 11, fontWeight: 700 }}>{i.label}</div>
                        <div style={{ fontSize: 8, color: "#475569" }}>{i.desc}</div>
                      </div>
                      {result !== "idle" && (
                        <span style={{ fontSize: 9, background: (result === "approved" ? "#22c55e" : "#ef4444") + "20", color: result === "approved" ? "#22c55e" : "#ef4444", borderRadius: 4, padding: "2px 6px" }}>
                          {result === "approved" ? "✓ Approved" : "✗ Denied"}
                        </span>
                      )}
                      <button onClick={() => triggerIntervention(i.type)} style={{ background: i.color + "20", border: `1px solid ${i.color}40`, borderRadius: 6, padding: "6px 12px", color: i.color, cursor: "pointer", fontSize: 9, fontWeight: 600 }}>
                        Trigger →
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>

            <CodeBlock label="SDK usage — before vs. after integration" color="#0ea5e9" code={
`// BEFORE THE SDK (per-app custom implementation):
// Each of 4+ apps re-implemented age verification:
//
// function AgeGateModal({ onApprove, onDeny }) {
//   const [year, setYear] = useState("");
//   const [loading, setLoading] = useState(false);
//   const [error, setError] = useState(null);
//   // 60+ lines of repeated logic: state, validation,
//   // API call to verify age, error handling, analytics event,
//   // local storage persistence, modal open/close lifecycle...
// }
// Same pattern for policy prompts, feature gates.
// Total: ~400 lines per app × 4 apps = 1,600 lines of duplicated logic.

// AFTER THE SDK (< 10 lines of integration):
import { useIntervention } from "@company/intervention-sdk";

function ContentPage() {
  const ageGate = useIntervention({ type: "age-gate" });

  if (ageGate.status === "pending") {
    return <ageGate.Prompt />; // renders the UX, handles everything
  }
  if (ageGate.status === "denied") {
    return <AccessDenied />;
  }
  return <ProtectedContent />; // status === "approved"
}

// The SDK handles internally:
//   - UX rendering (modal with accessible focus trap)
//   - State persistence (sessionStorage / cookie per intervention type)
//   - Retry logic (re-check on app revisit)
//   - Analytics events (intervention_shown, intervention_completed)
//   - A/B variants (different UX designs per experiment flag)
// Integration time: days → < 2 hours (proven across 4 apps).`} />
          </div>

          <div>
            <div style={{ fontSize: 10, fontWeight: 700, color: "#64748b", marginBottom: 8, letterSpacing: "0.08em" }}>SDK ARCHITECTURE</div>
            <div style={{ background: "#1e293b", border: "1px solid #334155", borderRadius: 10, padding: 14, marginBottom: 10 }}>
              <div style={{ fontSize: 9, color: "#64748b", marginBottom: 10 }}>Cross-platform intervention lifecycle</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {[
                  { stage: "Evaluation",  desc: "Should this intervention fire? Check: user state, prior completions, experiment flags, region rules.", color: "#0ea5e9" },
                  { stage: "Rendering",   desc: "Render the correct UX variant. Handle: focus trap, keyboard nav, ARIA, responsive layout.", color: "#a855f7" },
                  { stage: "Resolution",  desc: "User approves / denies / dismisses. Record decision in persistent store.", color: "#22c55e" },
                  { stage: "Analytics",   desc: "Fire: intervention_shown, intervention_completed, time_to_complete, resolution_type.", color: "#f59e0b" },
                  { stage: "Propagation", desc: "Broadcast resolution to other interventions in the queue. Unblock dependent features.", color: "#0066ff" },
                ].map(s => (
                  <div key={s.stage} style={{ display: "flex", gap: 8, background: "#0f172a", borderRadius: 6, padding: "6px 10px" }}>
                    <div style={{ width: 70, fontSize: 8, fontWeight: 700, color: s.color, flexShrink: 0, marginTop: 1 }}>{s.stage}</div>
                    <div style={{ fontSize: 8, color: "#64748b", lineHeight: 1.5 }}>{s.desc}</div>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ background: "#1e293b", border: "1px solid #334155", borderRadius: 10, padding: 14, marginBottom: 10 }}>
              <div style={{ fontSize: 9, color: "#64748b", marginBottom: 8 }}>Adoption across 4+ apps</div>
              {[
                { app: "App A (Web)",     weeks: 0.5, reduction: "68%" },
                { app: "App B (Mobile Web)", weeks: 0.8, reduction: "71%" },
                { app: "App C (Web)",     weeks: 1.2, reduction: "62%" },
                { app: "App D (Web)",     weeks: 0.6, reduction: "59%" },
              ].map((a, i) => (
                <div key={a.app} style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 6 }}>
                  <div style={{ fontSize: 9, width: 130, flexShrink: 0 }}>{a.app}</div>
                  <div style={{ flex: 1, background: "#0f172a", borderRadius: 3, height: 8, overflow: "hidden" }}>
                    <div style={{ background: "linear-gradient(90deg, #0066ff, #7c3aed)", height: "100%", width: `${(2 - a.weeks) / 2 * 100}%` }} />
                  </div>
                  <div style={{ fontSize: 8, color: "#22c55e", width: 60, textAlign: "right" }}>−{a.reduction} code</div>
                </div>
              ))}
              <div style={{ fontSize: 7, color: "#475569", marginTop: 4 }}>Integration time: all under 2 hours (&lt; 1 business day)</div>
            </div>

            <CodeBlock label="SDK design principles that made adoption easy" color="#a855f7" code={
`// KEY DESIGN DECISION: Hooks over components.
// Exposes: useIntervention({ type, config })
// Returns: { status, Prompt, dismiss, approve, deny }
//
// Why hooks over a wrapping component:
// Apps have different layouts (drawer, modal, bottom sheet, full-screen).
// A hook lets the app own the container. The SDK owns the logic.
// { Prompt } is the content. App wraps it in whatever container it needs.

// PERSISTENCE STRATEGY:
// "Did user already complete this intervention?"
// Stored in: sessionStorage (for session-scoped interventions like policy prompts)
//             cookie with 1-year expiry (for age verification — user shouldn't re-verify daily)
//             server-side (for cross-device persistence — user approved on web, not re-asked on mobile)
//
// The SDK checks all three layers. Server state wins over local state.

// INTERVENTION QUEUE:
// Multiple interventions can be required simultaneously.
// Example: new user arrives → needs age gate AND policy acceptance.
// SDK queues them: age gate shown first (more critical), then policy.
// No double-modal. Resolved sequentially.
// useInterventionQueue() → { current, remaining, total }

// ANALYTICS:
// Every intervention fires structured events automatically.
// integrating teams don't write any analytics code for interventions.
// The SDK fires: intervention_shown, intervention_dismissed, intervention_completed.
// These events feed the compliance dashboard.`} />
          </div>
        </div>
      )}

      {/* ── CONTENT SAFETY CONSOLE ── */}
      {activeTab === "safety" && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 280px", gap: 14 }}>
          {/* Moderation queue */}
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: "#64748b", letterSpacing: "0.08em" }}>
                MODERATION QUEUE — {events.filter(e => e.action === "pending").length} PENDING
              </div>
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <div style={{ fontSize: 8, color: "#22c55e" }}>Throughput: {throughput}/{events.length}</div>
                {caps.canBulk && selected.size > 0 && (
                  <>
                    <button onClick={() => bulkAction("approve")} style={{ background: "#22c55e20", border: "1px solid #22c55e40", borderRadius: 5, padding: "3px 8px", color: "#4ade80", cursor: "pointer", fontSize: 8 }}>Bulk Approve ({selected.size})</button>
                    <button onClick={() => bulkAction("reject")} style={{ background: "#ef444420", border: "1px solid #ef444440", borderRadius: 5, padding: "3px 8px", color: "#f87171", cursor: "pointer", fontSize: 8 }}>Bulk Reject ({selected.size})</button>
                  </>
                )}
                <button onClick={toggleStream} style={{ background: streaming ? "#ef444415" : "#22c55e15", border: `1px solid ${streaming ? "#ef4444" : "#22c55e"}40`, borderRadius: 6, padding: "4px 10px", color: streaming ? "#fca5a5" : "#4ade80", cursor: "pointer", fontSize: 9 }}>
                  {streaming ? "⬛ Stop" : "▶ Stream"}
                </button>
              </div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
              {events.map(evt => (
                <div key={evt.id} style={{ background: "#1e293b", border: `1px solid ${evt.action !== "pending" ? "#334155" : CAT_COLOR[evt.category] + "30"}`, borderRadius: 8, padding: "8px 12px", display: "flex", gap: 8, alignItems: "center", opacity: evt.action !== "pending" ? 0.6 : 1, transition: "opacity 0.2s" }}>
                  {caps.canBulk && (
                    <input type="checkbox" checked={selected.has(evt.id)} onChange={() => toggleSelect(evt.id)} style={{ flexShrink: 0 }} />
                  )}
                  <div style={{ width: 6, height: 6, borderRadius: "50%", background: CAT_COLOR[evt.category], flexShrink: 0 }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 9, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{evt.content}</div>
                    <div style={{ display: "flex", gap: 6, marginTop: 2 }}>
                      <span style={{ fontSize: 7, color: CAT_COLOR[evt.category] }}>{evt.category}</span>
                      <span style={{ fontSize: 7, color: "#475569" }}>{evt.source}</span>
                      {caps.seePII && <span style={{ fontSize: 7, color: "#64748b" }}>user_id: u-{evt.id.slice(-4)}</span>}
                    </div>
                  </div>
                  <div style={{ fontSize: 9, fontWeight: 700, color: evt.risk > 90 ? "#ef4444" : "#f59e0b", flexShrink: 0 }}>{evt.risk}%</div>
                  {evt.action === "pending" ? (
                    <div style={{ display: "flex", gap: 4, flexShrink: 0 }}>
                      <button onClick={() => reviewEvent(evt.id, "approve")} style={{ background: "#22c55e20", border: "1px solid #22c55e30", borderRadius: 4, padding: "3px 8px", color: "#4ade80", cursor: "pointer", fontSize: 8 }}>✓</button>
                      <button onClick={() => reviewEvent(evt.id, "reject")} style={{ background: "#ef444420", border: "1px solid #ef444430", borderRadius: 4, padding: "3px 8px", color: "#f87171", cursor: "pointer", fontSize: 8 }}>✗</button>
                      {caps.canEscalate && (
                        <button onClick={() => reviewEvent(evt.id, "escalate")} style={{ background: "#f59e0b20", border: "1px solid #f59e0b30", borderRadius: 4, padding: "3px 8px", color: "#fbbf24", cursor: "pointer", fontSize: 8 }}>↑</button>
                      )}
                    </div>
                  ) : (
                    <span style={{ fontSize: 8, color: evt.action === "approve" ? "#22c55e" : evt.action === "reject" ? "#ef4444" : "#f59e0b", flexShrink: 0 }}>{evt.action}</span>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* RBAC + code */}
          <div>
            <div style={{ fontSize: 10, fontWeight: 700, color: "#64748b", marginBottom: 8, letterSpacing: "0.08em" }}>RBAC — ROLE-BASED ACCESS</div>
            <div style={{ background: "#1e293b", border: "1px solid #334155", borderRadius: 10, padding: 12, marginBottom: 10 }}>
              {(["reviewer", "senior-reviewer", "admin"] as UserRole[]).map(r => (
                <div key={r} onClick={() => setRole(r)} style={{ background: role === r ? "#1e3a5f" : "#0f172a", border: `1px solid ${role === r ? "#3b82f6" : "#1e293b"}`, borderRadius: 7, padding: "8px 10px", marginBottom: 6, cursor: "pointer" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                    <div style={{ fontSize: 9, fontWeight: 700, color: role === r ? "#60a5fa" : "#94a3b8" }}>{r.replace("-", " ").toUpperCase()}</div>
                    {role === r && <div style={{ fontSize: 7, color: "#3b82f6" }}>● Active</div>}
                  </div>
                  <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                    {Object.entries(ROLE_CAPS[r]).map(([cap, has]) => (
                      <span key={cap} style={{ fontSize: 7, background: has ? "#22c55e15" : "#33415530", color: has ? "#4ade80" : "#475569", borderRadius: 3, padding: "0 4px" }}>{has ? "✓" : "✗"} {cap.replace("can", "").replace("see", "see ")}</span>
                    ))}
                  </div>
                </div>
              ))}
              <div style={{ fontSize: 7, color: "#475569", marginTop: 4 }}>Switch role to see how the UI changes. Bulk select + escalate buttons appear/disappear based on role.</div>
            </div>

            <CodeBlock label="Real-time streaming UI + throughput optimization" color="#a855f7" code={
`// 10K+ DAILY EVENTS = ~7 events/minute average.
// But: spiky. Breaking news or viral content → 500+ events/minute.
// The UI must handle bursts without freezing.

// STREAMING IMPLEMENTATION (Server-Sent Events):
const eventSource = new EventSource("/api/moderation/stream");
eventSource.onmessage = (event) => {
  const evt = JSON.parse(event.data);
  // Batch incoming events. Don't update React state for every individual event.
  // At 500 events/minute: 8 per second. Each triggers a re-render.
  // Solution: buffer for 200ms, then dispatch batch.
  eventBuffer.push(evt);
};
setInterval(() => {
  if (eventBuffer.length > 0) {
    dispatch({ type: "ADD_EVENTS", payload: eventBuffer.splice(0) });
  }
}, 200);

// THROUGHPUT +30% — HOW IT WAS ACHIEVED:
// Before: reviewers clicked Approve/Reject with mouse. ~3s per event.
// After improvements:
// 1. KEYBOARD SHORTCUTS:
//    'a' = approve, 'r' = reject, 'e' = escalate, 'n' = next
//    Reviewers never touch the mouse. ~1s per event.
// 2. BATCH ACTIONS (RBAC-gated):
//    Senior reviewers: select N events → bulk approve/reject.
//    Obvious spam batch: select all low-uniqueness spam → bulk reject.
// 3. RISK SCORE SORTING:
//    High-risk events at the top. Reviewers see critical content first.
//    Low-risk events can be auto-approved by rule (risk < 40, category = spam).
// 4. OPTIMISTIC UPDATES:
//    Click Approve → event visually moves to "reviewed" immediately.
//    API call in background. If fails: rollback with toast notification.
//    No waiting for API. Reviewers keep reviewing.`} />
          </div>
        </div>
      )}

      {/* ── SEARCH + DX ── */}
      {activeTab === "search" && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
          {/* Search */}
          <div>
            <div style={{ fontSize: 10, fontWeight: 700, color: "#64748b", marginBottom: 8, letterSpacing: "0.08em" }}>
              ADVANCED SEARCH PLATFORM — 2.4B RECORDS
            </div>
            <div style={{ background: "#1e293b", border: "1px solid #334155", borderRadius: 10, padding: 14, marginBottom: 10 }}>
              {/* Search bar */}
              <div style={{ display: "flex", gap: 6, marginBottom: 10 }}>
                <div style={{ flex: 1, position: "relative" }}>
                  <input
                    value={query} onChange={e => handleSearch(e.target.value)}
                    placeholder="Search 2.4B records..."
                    style={{ width: "100%", background: "#0f172a", border: "1px solid #0066ff40", borderRadius: 8, padding: "8px 12px", color: "#f1f5f9", fontSize: 12, boxSizing: "border-box", outline: "none" }}
                  />
                  {searching && <div style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", fontSize: 9, color: "#0066ff" }}>⏳</div>}
                </div>
                <button style={{ background: "#0066ff", border: "none", borderRadius: 8, padding: "8px 14px", color: "#fff", cursor: "pointer", fontSize: 11, fontWeight: 700 }}>Search</button>
              </div>

              {/* Filters */}
              <div style={{ display: "flex", gap: 6, marginBottom: 10, flexWrap: "wrap" }}>
                <span style={{ fontSize: 8, color: "#64748b", alignSelf: "center" }}>Type:</span>
                {["all", "report", "dashboard", "dataset", "log", "events"].map(t => (
                  <button key={t} onClick={() => { setTypeFilter(t); handleSearch(query); }} style={{ background: typeFilter === t ? "#1e3a5f" : "#0f172a", border: `1px solid ${typeFilter === t ? "#3b82f6" : "#334155"}`, borderRadius: 5, padding: "3px 8px", cursor: "pointer", color: typeFilter === t ? "#60a5fa" : "#64748b", fontSize: 8 }}>{t}</button>
                ))}
              </div>

              {/* Results */}
              <div style={{ fontSize: 7, color: "#475569", marginBottom: 6 }}>
                {searching ? "Searching..." : `${results.length} results across 2.4B records`}
              </div>
              {results.map(r => (
                <div key={r.id} style={{ background: "#0f172a", border: "1px solid #1e293b", borderRadius: 7, padding: "8px 12px", marginBottom: 4 }}>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <div style={{ fontSize: 10, fontWeight: 600 }}>{r.title}</div>
                    <div style={{ fontSize: 7, background: "#1e293b", color: "#64748b", borderRadius: 3, padding: "0 5px" }}>{r.type}</div>
                  </div>
                  <div style={{ display: "flex", gap: 8, marginTop: 3, fontSize: 7, color: "#475569" }}>
                    <span>{r.rows} rows</span><span>{r.ts}</span>
                  </div>
                </div>
              ))}
            </div>

            <CodeBlock label="2-week MVP delivery — technical decisions that made it possible" color="#f59e0b" code={
`// MVP delivered in 2 weeks. How?

// DECISION 1: Next.js (not a SPA).
// Data analysts need to share links: "here's the search result I found."
// Next.js: SSR → shareable URL with query params renders correct data on load.
// React SPA: page loads, then runs query → not shareable without extra work.

// DECISION 2: GraphQL (not REST for the FE).
// Data analysts have wildly different query needs:
// Analyst A: "I need title + timestamp + row_count."
// Analyst B: "I need schema_version + data_owner + update_frequency."
// REST: multiple endpoints or over-fetching.
// GraphQL: analysts request exactly what they need. One endpoint. No versioning.
//
// Query example:
// query SearchRecords($query: String!, $type: RecordType) {
//   searchRecords(query: $query, type: $type) {
//     id title rowCount updatedAt
//     schema { version fields { name type } }
//     owner { name team }
//   }
// }

// DECISION 3: Embed-ready SDK (why 3 other teams adopted it):
// Teams wanted to add search to their own tools.
// An iframe is fragile. A React component is not composable across tech stacks.
// Built an embed SDK: a standalone JS bundle that mounts the search UI
// into any container div. No React required in the host app.
//
// <div id="advanced-search"></div>
// <script src="//cdn.company.com/search-sdk/v1/index.js"></script>
// <script>
//   AdvancedSearch.mount("#advanced-search", { apiKey: "...", filters: { type: "dataset" } });
// </script>
//
// 3 teams embedded it in their own tools within 1 week of SDK release.
// Integration time: < 30 minutes per team.`} />
          </div>

          {/* DX/Infra */}
          <div>
            <div style={{ fontSize: 10, fontWeight: 700, color: "#64748b", marginBottom: 8, letterSpacing: "0.08em" }}>
              🏗 FRONTEND INFRASTRUCTURE & DX
            </div>

            {/* Defect rate trend */}
            <div style={{ background: "#1e293b", border: "1px solid #334155", borderRadius: 10, padding: 14, marginBottom: 10 }}>
              <div style={{ fontSize: 9, color: "#64748b", marginBottom: 10 }}>UI defect rate — release-over-release −25%</div>
              {[
                { rel: "Before", defects: 42, color: "#ef4444" },
                { rel: "R1",     defects: 36, color: "#f59e0b" },
                { rel: "R2",     defects: 31, color: "#f59e0b" },
                { rel: "R3",     defects: 26, color: "#22c55e" },
                { rel: "R4",     defects: 22, color: "#22c55e" },
                { rel: "R5",     defects: 19, color: "#22c55e" },
              ].map(r => (
                <div key={r.rel} style={{ display: "flex", gap: 6, alignItems: "center", marginBottom: 5 }}>
                  <div style={{ width: 32, fontSize: 8, color: "#475569" }}>{r.rel}</div>
                  <div style={{ flex: 1, background: "#0f172a", borderRadius: 3, height: 8, overflow: "hidden" }}>
                    <div style={{ background: r.color, height: "100%", width: `${(r.defects / 42) * 100}%`, borderRadius: 3, transition: "width 0.5s" }} />
                  </div>
                  <div style={{ width: 24, fontSize: 8, color: r.color, textAlign: "right" }}>{r.defects}</div>
                </div>
              ))}
              <div style={{ fontSize: 7, color: "#475569", marginTop: 4 }}>Total: −54.8% from baseline. −25% is release-over-release compound rate.</div>
            </div>

            {/* Design system */}
            <div style={{ background: "#1e293b", border: "1px solid #334155", borderRadius: 10, padding: 14, marginBottom: 10 }}>
              <div style={{ fontSize: 9, fontWeight: 700, marginBottom: 8 }}>Storybook-driven design system</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 5 }}>
                {[
                  { icon: "🔘", name: "Button",    v: "2.4.0" },
                  { icon: "📝", name: "Input",     v: "2.1.3" },
                  { icon: "🗃", name: "DataTable", v: "1.8.2" },
                  { icon: "🔔", name: "Toast",     v: "1.5.1" },
                  { icon: "🪟", name: "Modal",     v: "2.0.0" },
                  { icon: "🏷", name: "Badge",     v: "1.3.4" },
                ].map(c => (
                  <div key={c.name} style={{ background: "#0f172a", borderRadius: 6, padding: "6px 8px", textAlign: "center" }}>
                    <div style={{ fontSize: 16 }}>{c.icon}</div>
                    <div style={{ fontSize: 8, fontWeight: 700 }}>{c.name}</div>
                    <div style={{ fontSize: 7, color: "#475569" }}>v{c.v}</div>
                  </div>
                ))}
              </div>
            </div>

            <CodeBlock label="Storybook + CI pipeline — how defects dropped 25%" color="#22c55e" code={
`// WHY "STORYBOOK-DRIVEN" (not just "we have Storybook"):
// Components are built IN Storybook before being used in the product.
// 
// Traditional workflow:
// 1. Build the component in the app context.
// 2. Render it in the real page to see if it looks right.
// 3. Need mocked data, authentication, navigation to test it.
// 
// Storybook-driven workflow:
// 1. Open Storybook. Write a story for each variant.
// 2. Component renders in isolation: no auth, no data fetching needed.
// 3. Review each story: empty state, loading, error, max content, RTL.
// 4. PR review: reviewer opens Storybook deploy (auto-deployed per PR).
//    "The error state looks wrong here." → caught before it ships.
// 
// HOW THIS REDUCED UI DEFECTS BY 25%:
// 
// 1. VISUAL REGRESSION TESTING:
//    Chromatic (or Percy) takes screenshots of every Storybook story on every PR.
//    If the screenshot changed: PR shows a visual diff. Reviewer must approve.
//    Catches: "you changed the Button's border radius and didn't realize
//    it affected the ghost variant." → caught before merge.
// 
// 2. MISSING STATES SURFACED:
//    Writing a story for the "disabled" state forces you to handle disabled.
//    If disabled looks broken in Storybook: you fix it in Storybook.
//    Not in production after a user reports it.
// 
// 3. COMPONENT CONTRACT ENFORCEMENT:
//    Storybook stories are documentation of the expected prop interface.
//    If a refactor changes the component's behavior: an existing story breaks.
//    Broken story = immediately visible. Fix before it reaches the product.
// 
// CI PIPELINE:
// Every PR:
//   - Unit tests (Vitest + React Testing Library)
//   - Visual regression (Chromatic / Percy)
//   - Accessibility audit (axe-core in Storybook)
//   - TypeScript type check (tsc --noEmit)
//   - Bundle size check
// 
// The accessibility audit in Storybook:
// Each story runs axe-core automatically.
// Missing aria-label, wrong ARIA role, insufficient color contrast: blocked.
// Accessibility is enforced at development time, not discovered in an audit.`} />
          </div>
        </div>
      )}
    </div>
  );
}

export default ComplianceInfraDemo;
