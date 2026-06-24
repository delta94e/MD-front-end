/**
 * TeraSeniorDemo.tsx
 *
 * Software Engineer II (Web) — TERA Supply + Messaging Platform
 *
 * Responsibilities ABOVE SE I:
 *   - FE Web PIC for Supply mission teams (Direct Sourcing + Biz Ops)
 *   - Engineering PIC for Messaging Platform project
 *   - Quarterly planning: project assessment + resource allocation
 *   - TERA Web release schedule (with Backend RM & QA)
 *   - District for mobile app: contributor + maintainer
 *
 * TABS
 *   📋 PIC & Planning       — project sizing, resource allocation, quarterly OKRs
 *   🚀 Release Management   — release pipeline, feature flags, QA gates, hotfix
 *   💬 Messaging Platform   — cross-product notifications + District mobile tooling
 */

import React, { useState, useEffect, useRef } from "react";

// ─────────────────────────────────────────────────────────────────
// Quarterly Planning data
// ─────────────────────────────────────────────────────────────────

type ProjectSize  = "XS" | "S" | "M" | "L" | "XL";
type ProjectStatus = "planned" | "in-progress" | "blocked" | "done";

interface Project {
  id: string; name: string; team: "direct-sourcing" | "biz-ops" | "platform";
  size: ProjectSize; weeks: number; status: ProjectStatus;
  assignees: string[]; priority: "P0" | "P1" | "P2"; risk?: string;
}

const PROJECTS: Project[] = [
  { id: "p1", name: "Direct Sourcing Onboarding Flow Revamp",    team: "direct-sourcing", size: "XL", weeks: 8, status: "done",        assignees: ["Anh", "Binh"],       priority: "P0" },
  { id: "p2", name: "Partner Contract Digital Signing",          team: "direct-sourcing", size: "L",  weeks: 5, status: "in-progress",  assignees: ["Cuong"],             priority: "P0" },
  { id: "p3", name: "BizOps Property Audit Dashboard",           team: "biz-ops",         size: "M",  weeks: 3, status: "in-progress",  assignees: ["Dung", "Em"],        priority: "P1" },
  { id: "p4", name: "Bulk Rate Update Tool",                     team: "biz-ops",         size: "M",  weeks: 3, status: "planned",      assignees: ["Anh"],               priority: "P1" },
  { id: "p5", name: "Messaging Platform — Partner Inbox",        team: "platform",        size: "XL", weeks: 7, status: "in-progress",  assignees: ["Binh", "Cuong"],     priority: "P0", risk: "Backend API delayed 2w" },
  { id: "p6", name: "Messaging Platform — Notification Centre",  team: "platform",        size: "L",  weeks: 5, status: "planned",      assignees: ["Em"],                priority: "P1" },
  { id: "p7", name: "Internal Audit Log Viewer",                 team: "biz-ops",         size: "S",  weeks: 2, status: "done",         assignees: ["Dung"],              priority: "P2" },
  { id: "p8", name: "Property Category Taxonomy Refactor",       team: "direct-sourcing", size: "S",  weeks: 2, status: "planned",      assignees: ["Binh"],              priority: "P2" },
];

const ENGINEERS = [
  { name: "Anh",   capacity: 100, allocated: 100 },
  { name: "Binh",  capacity: 100, allocated: 90  },
  { name: "Cuong", capacity: 100, allocated: 100 },
  { name: "Dung",  capacity: 80,  allocated: 75  },  // 80% because 20% on Soya/District
  { name: "Em",    capacity: 100, allocated: 80  },
];

// ─────────────────────────────────────────────────────────────────
// Release data
// ─────────────────────────────────────────────────────────────────

type ReleaseStage = "dev" | "code-freeze" | "qa" | "staging" | "canary" | "production";

interface ReleaseFeature {
  id: string; name: string; flag: string; enabled: boolean; canary: boolean;
}

const FEATURES: ReleaseFeature[] = [
  { id: "f1", name: "Partner Contract Digital Signing",    flag: "FF_DIGITAL_SIGNING",   enabled: true,  canary: true  },
  { id: "f2", name: "BizOps Property Audit Dashboard",    flag: "FF_AUDIT_DASHBOARD",   enabled: true,  canary: false },
  { id: "f3", name: "Messaging Inbox Beta",               flag: "FF_MSG_INBOX",         enabled: false, canary: false },
  { id: "f4", name: "Rate Management v2 UI",              flag: "FF_RATE_V2",           enabled: true,  canary: true  },
];

const QA_CHECKLIST = [
  { id: "qa1", label: "Unit tests: all passing",                       done: true  },
  { id: "qa2", label: "Integration tests: no regressions",             done: true  },
  { id: "qa3", label: "Accessibility audit: WCAG 2.1 AA",             done: true  },
  { id: "qa4", label: "Performance: LCP < 2.5s, CLS < 0.1",          done: true  },
  { id: "qa5", label: "Cross-browser: Chrome / Safari / Edge",        done: false },
  { id: "qa6", label: "Mobile web: iOS Safari / Android Chrome",      done: false },
  { id: "qa7", label: "Backend API contract: signed off by BE RM",    done: true  },
  { id: "qa8", label: "Rollback plan documented and tested",          done: false },
];

// ─────────────────────────────────────────────────────────────────
// Messaging Platform data
// ─────────────────────────────────────────────────────────────────

type Channel = "in-app" | "push" | "email" | "sms";
const CHANNEL_ICON: Record<Channel, string> = { "in-app": "🔔", push: "📱", email: "📧", sms: "💬" };
const CHANNEL_COLOR: Record<Channel, string> = { "in-app": "#0ea5e9", push: "#a855f7", email: "#f59e0b", sms: "#22c55e" };

interface MsgEvent { id: number; type: string; channel: Channel; recipient: string; status: "sent" | "delivered" | "failed"; ts: string }

const MSG_TYPES = [
  { type: "booking_confirmed",   channels: ["in-app", "push", "email"] as Channel[] },
  { type: "partner_action_req",  channels: ["in-app", "email"] as Channel[]         },
  { type: "payment_received",    channels: ["in-app", "push", "sms"] as Channel[]   },
  { type: "review_published",    channels: ["in-app", "email"] as Channel[]         },
];

function makeMsg(id: number): MsgEvent {
  const t = MSG_TYPES[Math.floor(Math.random() * MSG_TYPES.length)];
  const ch = t.channels[Math.floor(Math.random() * t.channels.length)];
  const s = Math.random() > 0.1 ? "delivered" : "failed";
  return { id, type: t.type, channel: ch, recipient: `partner_${Math.floor(Math.random() * 900) + 100}`, status: s, ts: new Date().toISOString() };
}

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

const SIZE_COLOR: Record<ProjectSize, string> = { XS: "#64748b", S: "#a855f7", M: "#f59e0b", L: "#0ea5e9", XL: "#ef4444" };
const STATUS_COLOR: Record<ProjectStatus, string> = { done: "#22c55e", "in-progress": "#0ea5e9", blocked: "#ef4444", planned: "#475569" };

// ─────────────────────────────────────────────────────────────────
// Main
// ─────────────────────────────────────────────────────────────────

export function TeraSeniorDemo() {
  const [activeTab, setActiveTab] = useState<"planning" | "release" | "messaging">("planning");

  // ── Planning state
  const [teamFilter, setTeamFilter] = useState<"all" | "direct-sourcing" | "biz-ops" | "platform">("all");
  const filtered = PROJECTS.filter(p => teamFilter === "all" || p.team === teamFilter);
  const doneWeeks = PROJECTS.filter(p => p.status === "done").reduce((s, p) => s + p.weeks, 0);
  const totalWeeks = PROJECTS.reduce((s, p) => s + p.weeks, 0);
  const inProgressWeeks = PROJECTS.filter(p => p.status === "in-progress").reduce((s, p) => s + p.weeks, 0);

  // ── Release state
  const [currentStage, setCurrentStage] = useState<ReleaseStage>("qa");
  const [features, setFeatures] = useState(FEATURES);
  const [qaItems, setQaItems] = useState(QA_CHECKLIST);
  const [canaryPct, setCanaryPct] = useState(5);

  const STAGES: ReleaseStage[] = ["dev", "code-freeze", "qa", "staging", "canary", "production"];
  const stageIdx = STAGES.indexOf(currentStage);
  const qaProgress = qaItems.filter(i => i.done).length;

  const toggleFlag = (id: string) =>
    setFeatures(prev => prev.map(f => f.id === id ? { ...f, enabled: !f.enabled } : f));
  const toggleQA = (id: string) =>
    setQaItems(prev => prev.map(i => i.id === id ? { ...i, done: !i.done } : i));

  // ── Messaging state
  const [msgs, setMsgs] = useState<MsgEvent[]>(() => Array.from({ length: 10 }, (_, i) => makeMsg(i)));
  const [streaming, setStreaming] = useState(false);
  const streamRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const idRef = useRef(200);

  const toggleStream = () => {
    if (streaming) { clearInterval(streamRef.current!); setStreaming(false); }
    else {
      setStreaming(true);
      streamRef.current = setInterval(() => {
        setMsgs(prev => [makeMsg(idRef.current++), ...prev.slice(0, 29)]);
      }, 900);
    }
  };
  useEffect(() => () => { if (streamRef.current) clearInterval(streamRef.current); }, []);

  const deliveryRate = Math.round((msgs.filter(m => m.status === "delivered").length / msgs.length) * 100);

  const TABS = [
    { id: "planning"  as const, label: "📋 PIC & Planning"     },
    { id: "release"   as const, label: "🚀 Release Management" },
    { id: "messaging" as const, label: "💬 Messaging Platform" },
  ];

  return (
    <div style={{ background: "#0f172a", color: "#f1f5f9", fontFamily: "'Inter', system-ui, sans-serif", minHeight: "100vh", padding: 24 }}>

      {/* Header */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
          <div style={{ width: 36, height: 36, borderRadius: 8, background: "linear-gradient(135deg,#0066ff,#003ec7)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>✈</div>
          <div>
            <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800 }}>TERA — Software Engineer II</h1>
            <p style={{ margin: 0, color: "#64748b", fontSize: 13 }}>
              FE Web PIC · Supply Mission Teams · Messaging Platform Engineering PIC · Quarterly Planning · Release Owner
            </p>
          </div>
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {["FE Web PIC", "Supply (Direct Sourcing + BizOps)", "Engineering PIC — Messaging", "Quarterly Planning", "Release Management", "District (Mobile DS)", "Soya (Web DS)"].map(t => (
            <span key={t} style={{ background: "#1e293b", color: "#94a3b8", border: "1px solid #334155", borderRadius: 20, padding: "3px 10px", fontSize: 11 }}>{t}</span>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 4, marginBottom: 20, borderBottom: "1px solid #1e293b", paddingBottom: 4 }}>
        {TABS.map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{ background: activeTab === tab.id ? "#1e293b" : "transparent", color: activeTab === tab.id ? "#f1f5f9" : "#64748b", border: activeTab === tab.id ? "1px solid #334155" : "1px solid transparent", borderRadius: "8px 8px 0 0", padding: "8px 20px", cursor: "pointer", fontSize: 13, fontWeight: 600 }}>{tab.label}</button>
        ))}
      </div>

      {/* ── PLANNING ── */}
      {activeTab === "planning" && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 260px", gap: 14 }}>
          {/* Projects */}
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: "#64748b", letterSpacing: "0.08em" }}>Q3 PROJECT BACKLOG — SUPPLY WEB</div>
              <div style={{ display: "flex", gap: 4 }}>
                {(["all", "direct-sourcing", "biz-ops", "platform"] as const).map(t => (
                  <button key={t} onClick={() => setTeamFilter(t)} style={{ background: teamFilter === t ? "#1e3a5f" : "#1e293b", border: `1px solid ${teamFilter === t ? "#3b82f6" : "#334155"}`, borderRadius: 6, padding: "3px 8px", cursor: "pointer", color: teamFilter === t ? "#60a5fa" : "#64748b", fontSize: 8 }}>
                    {t === "all" ? "All" : t === "direct-sourcing" ? "Direct Sourcing" : t === "biz-ops" ? "Biz Ops" : "Platform"}
                  </button>
                ))}
              </div>
            </div>

            {/* Quarter summary */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 6, marginBottom: 10 }}>
              {[
                { label: "Total Projects", value: PROJECTS.length, color: "#f1f5f9" },
                { label: "Completed",       value: PROJECTS.filter(p => p.status === "done").length,        color: "#22c55e" },
                { label: "In Progress",     value: PROJECTS.filter(p => p.status === "in-progress").length, color: "#0ea5e9" },
                { label: "Man-Weeks Est.",  value: `${totalWeeks}w`,                                         color: "#f59e0b" },
              ].map(m => (
                <div key={m.label} style={{ background: "#1e293b", border: "1px solid #334155", borderRadius: 8, padding: "8px 10px" }}>
                  <div style={{ fontSize: 8, color: "#64748b" }}>{m.label}</div>
                  <div style={{ fontSize: 18, fontWeight: 900, color: m.color }}>{m.value}</div>
                </div>
              ))}
            </div>

            {/* Progress bar */}
            <div style={{ background: "#1e293b", border: "1px solid #334155", borderRadius: 8, padding: 10, marginBottom: 10 }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 9, marginBottom: 6 }}>
                <span style={{ color: "#64748b" }}>Quarter progress</span>
                <span style={{ color: "#22c55e" }}>{Math.round((doneWeeks / totalWeeks) * 100)}% complete ({doneWeeks}/{totalWeeks} weeks)</span>
              </div>
              <div style={{ background: "#0f172a", borderRadius: 4, height: 12, overflow: "hidden", display: "flex" }}>
                <div style={{ background: "#22c55e", height: "100%", width: `${(doneWeeks / totalWeeks) * 100}%`, borderRadius: "4px 0 0 4px", transition: "width 0.5s" }} />
                <div style={{ background: "#0ea5e9", height: "100%", width: `${(inProgressWeeks / totalWeeks) * 100}%` }} />
              </div>
              <div style={{ display: "flex", gap: 12, marginTop: 4, fontSize: 8, color: "#475569" }}>
                <span style={{ color: "#22c55e" }}>■ Done: {doneWeeks}w</span>
                <span style={{ color: "#0ea5e9" }}>■ In Progress: {inProgressWeeks}w</span>
                <span style={{ color: "#334155" }}>■ Planned: {totalWeeks - doneWeeks - inProgressWeeks}w</span>
              </div>
            </div>

            {/* Project table */}
            <div style={{ background: "#1e293b", border: "1px solid #334155", borderRadius: 10, overflow: "hidden" }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 50px 50px 80px 70px 80px", padding: "6px 10px", borderBottom: "1px solid #0f172a", fontSize: 8, color: "#475569" }}>
                <div>Project</div><div>Size</div><div>Est</div><div>Assignee(s)</div><div>Priority</div><div>Status</div>
              </div>
              {filtered.map((p, i) => (
                <div key={p.id} style={{ display: "grid", gridTemplateColumns: "1fr 50px 50px 80px 70px 80px", padding: "8px 10px", borderBottom: i < filtered.length - 1 ? "1px solid #0f172a" : "none", alignItems: "center" }}>
                  <div>
                    <div style={{ fontSize: 9, fontWeight: 600 }}>{p.name}</div>
                    {p.risk && <div style={{ fontSize: 7, color: "#f87171", marginTop: 1 }}>⚠ {p.risk}</div>}
                  </div>
                  <div style={{ fontSize: 8, background: SIZE_COLOR[p.size] + "20", color: SIZE_COLOR[p.size], borderRadius: 3, padding: "1px 5px", textAlign: "center" }}>{p.size}</div>
                  <div style={{ fontSize: 8, color: "#64748b" }}>{p.weeks}w</div>
                  <div style={{ fontSize: 8, color: "#94a3b8" }}>{p.assignees.join(", ")}</div>
                  <div style={{ fontSize: 7, background: { P0: "#ef444420", P1: "#f59e0b20", P2: "#33415520" }[p.priority], color: { P0: "#fca5a5", P1: "#fbbf24", P2: "#64748b" }[p.priority], borderRadius: 3, padding: "1px 5px", textAlign: "center" }}>{p.priority}</div>
                  <div style={{ fontSize: 7, background: STATUS_COLOR[p.status] + "20", color: STATUS_COLOR[p.status], borderRadius: 3, padding: "1px 5px", textAlign: "center" }}>{p.status.replace("-", " ")}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Resource allocation */}
          <div>
            <div style={{ fontSize: 10, fontWeight: 700, color: "#64748b", marginBottom: 8, letterSpacing: "0.08em" }}>ENGINEER CAPACITY — Q3</div>
            {ENGINEERS.map(eng => {
              const pct = Math.round((eng.allocated / eng.capacity) * 100);
              const overloaded = pct > 95;
              return (
                <div key={eng.name} style={{ background: "#1e293b", border: `1px solid ${overloaded ? "#ef444430" : "#334155"}`, borderRadius: 8, padding: 10, marginBottom: 6 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                    <div style={{ fontSize: 10, fontWeight: 700 }}>{eng.name}</div>
                    <div style={{ fontSize: 9, color: overloaded ? "#f87171" : "#22c55e" }}>{pct}% allocated</div>
                  </div>
                  <div style={{ background: "#0f172a", borderRadius: 3, height: 8, overflow: "hidden" }}>
                    <div style={{ background: overloaded ? "#ef4444" : pct > 80 ? "#f59e0b" : "#22c55e", height: "100%", width: `${pct}%`, borderRadius: 3, transition: "width 0.5s" }} />
                  </div>
                  {eng.capacity < 100 && <div style={{ fontSize: 7, color: "#475569", marginTop: 3 }}>{100 - eng.capacity}% on DS/Soya/District duties</div>}
                </div>
              );
            })}

            <div style={{ marginTop: 8 }}>
              <CodeBlock label="PIC role — quarterly planning responsibilities" color="#0066ff" code={
`// AS FE WEB PIC FOR SUPPLY TEAMS:

// 1. PROJECT SIZING:
//    Before each quarter, PIC assesses all incoming projects.
//    Breaks each project into frontend tasks.
//    Estimates size: XS (< 1w), S (1-2w), M (2-4w), L (4-6w), XL (6w+)
//    Produces: man-week estimates per project.
//    
//    Estimation method:
//    - Decompose: screens × components × API integrations × tests
//    - Apply complexity multipliers (new API surface, regulatory, etc.)
//    - Add 20% buffer for unknowns (always)
//    - Review with team: does this feel right?

// 2. CAPACITY PLANNING:
//    Total available capacity = sum(engineer capacity - overhead)
//    Overhead: DS/Soya reviews, incidents, code review ~15-20%
//    Committed capacity = total capacity × 0.8 (safety margin)
//    Never commit 100% — incidents happen

// 3. DEPENDENCY MAPPING:
//    For each project: what does FE need from other teams?
//    - Backend API: ready date? contract signed?
//    - Design: wireframes approved?
//    - QA: test plan written?
//    Unresolved dependencies = project risk → surface early

// 4. RISK FLAGGING:
//    "Messaging Platform: backend API delayed 2 weeks."
//    → adjust timeline or descope features
//    → communicate to stakeholders immediately
//    PIC is responsible for knowing before it becomes a crisis.`} />
            </div>
          </div>
        </div>
      )}

      {/* ── RELEASE ── */}
      {activeTab === "release" && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
          {/* Pipeline */}
          <div>
            <div style={{ fontSize: 10, fontWeight: 700, color: "#64748b", marginBottom: 8, letterSpacing: "0.08em" }}>
              TERA RELEASE PIPELINE — v2.14.0
            </div>
            {/* Stage visualization */}
            <div style={{ background: "#1e293b", border: "1px solid #334155", borderRadius: 10, padding: 14, marginBottom: 10 }}>
              <div style={{ display: "flex", gap: 0, marginBottom: 10 }}>
                {STAGES.map((stage, i) => {
                  const past = i < stageIdx;
                  const current = i === stageIdx;
                  const future = i > stageIdx;
                  const bg = current ? "#0066ff" : past ? "#22c55e" : "#1e293b";
                  const tc = current || past ? "#fff" : "#475569";
                  return (
                    <React.Fragment key={stage}>
                      <div onClick={() => setCurrentStage(stage)} style={{ flex: 1, background: bg, border: `1px solid ${current ? "#0066ff" : past ? "#22c55e" : "#334155"}`, padding: "6px 4px", textAlign: "center", cursor: "pointer", fontSize: 7, color: tc, fontWeight: current ? 700 : 400 }}>
                        {current ? "▶ " : past ? "✓ " : ""}{stage.replace("-", " ").toUpperCase()}
                      </div>
                      {i < STAGES.length - 1 && <div style={{ width: 0, height: 0, borderTop: "16px solid transparent", borderBottom: "16px solid transparent", borderLeft: `8px solid ${past ? "#22c55e" : current ? "#0066ff" : "#334155"}` }} />}
                    </React.Fragment>
                  );
                })}
              </div>
              <div style={{ fontSize: 9, color: "#64748b", marginBottom: 6 }}>Click a stage to advance the pipeline</div>

              {/* Canary slider */}
              {(currentStage === "canary" || currentStage === "production") && (
                <div style={{ background: "#0f172a", borderRadius: 8, padding: 10, marginBottom: 8 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 9, marginBottom: 6 }}>
                    <span style={{ color: "#64748b" }}>Canary traffic rollout</span>
                    <span style={{ color: "#0ea5e9", fontWeight: 700 }}>{canaryPct}% of partners</span>
                  </div>
                  <input type="range" min={1} max={100} value={canaryPct} onChange={e => setCanaryPct(parseInt(e.target.value))} style={{ width: "100%", accentColor: "#0066ff" }} />
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 7, color: "#334155" }}>
                    <span>1%</span><span>25%</span><span>50%</span><span>100%</span>
                  </div>
                </div>
              )}
            </div>

            {/* Feature flags */}
            <div style={{ fontSize: 10, fontWeight: 700, color: "#64748b", marginBottom: 8, letterSpacing: "0.08em" }}>
              FEATURE FLAGS IN THIS RELEASE
            </div>
            <div style={{ background: "#1e293b", border: "1px solid #334155", borderRadius: 10, overflow: "hidden", marginBottom: 10 }}>
              {features.map((f, i) => (
                <div key={f.id} style={{ display: "flex", gap: 8, alignItems: "center", padding: "9px 12px", borderBottom: i < features.length - 1 ? "1px solid #0f172a" : "none" }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 9, fontWeight: 600 }}>{f.name}</div>
                    <div style={{ fontSize: 7, fontFamily: "monospace", color: "#475569" }}>{f.flag}</div>
                    {f.canary && <div style={{ fontSize: 7, color: "#0ea5e9" }}>Canary-only at this stage</div>}
                  </div>
                  <div onClick={() => toggleFlag(f.id)} style={{ width: 36, height: 20, borderRadius: 10, background: f.enabled ? "#22c55e" : "#334155", cursor: "pointer", display: "flex", alignItems: "center", padding: "2px", transition: "background 0.2s" }}>
                    <div style={{ width: 16, height: 16, borderRadius: "50%", background: "#fff", transform: f.enabled ? "translateX(16px)" : "translateX(0)", transition: "transform 0.2s" }} />
                  </div>
                </div>
              ))}
            </div>

            <CodeBlock label="Release management — collaborating with Backend RM & QA" color="#0066ff" code={
`// TERA RELEASE PROCESS (FE web owner responsibilities):
//
// WEEKLY SYNC WITH BACKEND RELEASE MANAGER:
//   - Confirm API versions: FE expects /api/v3/rooms, BE ships v3?
//   - Confirm DB migrations: will affect availability during deploy?
//   - Agree on deploy order: BE first, FE after (never reverse).
//   - Contingency: if BE deploy fails → FE release postponed.
//     Feature flags prevent FE code from calling unavailable APIs.
//
// FEATURE FLAG STRATEGY:
//   Every new feature is behind a flag.
//   Flags allow: shipping code before the feature is "ready",
//   canary rollout (1% → 100%), instant kill-switch.
//
//   Naming: FF_{PRODUCT}_{FEATURE} = FF_TERA_DIGITAL_SIGNING
//   Stored in: feature flag management service (Optimizely/LaunchDarkly/custom)
//   Default: false (off by default for new flags)
//
// QA GATE:
//   Release is blocked until QA team signs off.
//   FE release owner's responsibilities before QA gate:
//   - All unit tests passing (CI)
//   - No TypeScript errors (CI)
//   - Staging environment matches production config
//   - Critical user flows manually tested by FE owner
//   - Regression test: previous release's features still work
//
// HOTFIX PROCEDURE:
//   P0 in production (e.g., partners cannot update availability):
//   1. Feature flag OFF immediately (< 5 minutes) → issue isolated.
//   2. Root cause identified.
//   3. Hotfix branch from PRODUCTION tag (not from main).
//   4. Fix reviewed by ≥ 2 engineers.
//   5. Deploy to staging → canary 5% → 100% (expedited: 30 min each).
//   6. Post-mortem within 48 hours.`} />
          </div>

          {/* QA checklist */}
          <div>
            <div style={{ fontSize: 10, fontWeight: 700, color: "#64748b", marginBottom: 8, letterSpacing: "0.08em" }}>
              QA SIGN-OFF CHECKLIST — v2.14.0
            </div>
            <div style={{ background: "#1e293b", border: "1px solid #334155", borderRadius: 10, overflow: "hidden", marginBottom: 10 }}>
              <div style={{ padding: "8px 12px", borderBottom: "1px solid #0f172a", display: "flex", justifyContent: "space-between" }}>
                <div style={{ fontSize: 9, color: "#64748b" }}>QA gate progress</div>
                <div style={{ fontSize: 10, fontWeight: 700, color: qaProgress === qaItems.length ? "#22c55e" : "#f59e0b" }}>{qaProgress}/{qaItems.length} complete</div>
              </div>
              {qaItems.map((item, i) => (
                <div key={item.id} onClick={() => toggleQA(item.id)} style={{ display: "flex", gap: 10, alignItems: "center", padding: "9px 12px", borderBottom: i < qaItems.length - 1 ? "1px solid #0f172a" : "none", cursor: "pointer" }}>
                  <div style={{ width: 16, height: 16, borderRadius: 3, background: item.done ? "#22c55e" : "#334155", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, flexShrink: 0 }}>
                    {item.done && "✓"}
                  </div>
                  <div style={{ fontSize: 9, color: item.done ? "#94a3b8" : "#f1f5f9", textDecoration: item.done ? "line-through" : "none" }}>{item.label}</div>
                </div>
              ))}
            </div>

            {qaProgress < qaItems.length && (
              <div style={{ background: "#f59e0b15", border: "1px solid #f59e0b30", borderRadius: 8, padding: 10, marginBottom: 10 }}>
                <div style={{ fontSize: 9, color: "#fbbf24", fontWeight: 700, marginBottom: 3 }}>⚠ Release blocked</div>
                <div style={{ fontSize: 8, color: "#92400e" }}>{qaItems.length - qaProgress} QA items remaining. Complete all items before advancing to Staging.</div>
              </div>
            )}

            <CodeBlock label="Release schedule ownership — cross-team coordination" color="#22c55e" code={
`// RELEASE SCHEDULE RESPONSIBILITY:
// As FE Web release owner, I maintain the release calendar.
// Releases are coordinated across 3 teams:
//   - FE Web (my team)
//   - TERA Backend (their release manager)
//   - QA (shared between FE + BE)
//
// RELEASE CADENCE:
//   Regular: bi-weekly (every 2 weeks on Thursday).
//   Hotfix:  on-demand (same-day for P0, next-day for P1).
//
// MY RESPONSIBILITIES AS RELEASE OWNER:
//   Week 1 (development):
//     - Feature branches merged to main by Wednesday (code freeze).
//     - No new features after Wednesday. Bugfixes only.
//     - Communicate: "Feature X missed the cut. Goes to next release."
//
//   Week 2 (QA & release):
//     - Monday: deploy to staging. QA begins.
//     - Tuesday-Wednesday: QA testing. FE owner fixes reported issues.
//     - Thursday: QA sign-off. Canary deploy (5%).
//     - Friday: monitor canary metrics (error rates, load times).
//     - Next Monday: if canary healthy → 100% rollout.
//
// KEY SKILL: SAYING NO.
//   "We can add this feature if we skip the accessibility audit."
//   My answer: "No. The accessibility audit is not optional. 
//               Schedule the feature for the next release."
//   Release quality > release speed.
//   One bad release costs more time in hotfixes than a 2-week delay.`} />
          </div>
        </div>
      )}

      {/* ── MESSAGING ── */}
      {activeTab === "messaging" && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
          {/* Architecture + live events */}
          <div>
            <div style={{ fontSize: 10, fontWeight: 700, color: "#64748b", marginBottom: 8, letterSpacing: "0.08em" }}>
              MESSAGING PLATFORM — ENGINEERING PIC
            </div>

            {/* Architecture */}
            <div style={{ background: "#1e293b", border: "1px solid #334155", borderRadius: 10, padding: 12, marginBottom: 10 }}>
              <div style={{ fontSize: 9, color: "#64748b", marginBottom: 10 }}>Cross-product notification architecture</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {/* Producers */}
                <div style={{ display: "flex", gap: 6 }}>
                  {["TERA", "Payments", "CRM", "Ops Tools"].map(s => (
                    <div key={s} style={{ flex: 1, background: "#0f172a", border: "1px solid #334155", borderRadius: 6, padding: "5px", textAlign: "center", fontSize: 8, color: "#94a3b8" }}>{s}</div>
                  ))}
                </div>
                <div style={{ textAlign: "center", fontSize: 11, color: "#334155" }}>↓ events ↓</div>
                {/* Messaging Platform */}
                <div style={{ background: "#0066ff20", border: "1px solid #0066ff40", borderRadius: 8, padding: 8, textAlign: "center" }}>
                  <div style={{ fontSize: 10, fontWeight: 800, color: "#60a5fa" }}>Messaging Platform</div>
                  <div style={{ fontSize: 8, color: "#475569", marginTop: 2 }}>routing · templates · delivery · tracking · retry</div>
                </div>
                <div style={{ textAlign: "center", fontSize: 11, color: "#334155" }}>↓ delivers via ↓</div>
                {/* Channels */}
                <div style={{ display: "flex", gap: 6 }}>
                  {(["in-app", "push", "email", "sms"] as Channel[]).map(ch => (
                    <div key={ch} style={{ flex: 1, background: CHANNEL_COLOR[ch] + "20", border: `1px solid ${CHANNEL_COLOR[ch]}40`, borderRadius: 6, padding: "5px", textAlign: "center", fontSize: 8, color: CHANNEL_COLOR[ch] }}>
                      {CHANNEL_ICON[ch]} {ch}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Live event log */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
              <div style={{ fontSize: 9, fontWeight: 700, color: "#64748b" }}>LIVE MESSAGE DELIVERY LOG</div>
              <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                <div style={{ fontSize: 9, color: "#22c55e" }}>{deliveryRate}% delivery rate</div>
                <button onClick={toggleStream} style={{ background: streaming ? "#ef444420" : "#22c55e20", border: `1px solid ${streaming ? "#ef4444" : "#22c55e"}`, borderRadius: 6, padding: "3px 10px", color: streaming ? "#fca5a5" : "#4ade80", cursor: "pointer", fontSize: 9 }}>
                  {streaming ? "⬛ Stop" : "▶ Stream"}
                </button>
              </div>
            </div>
            <div style={{ background: "#0a0a14", border: "1px solid #1e293b", borderRadius: 10, height: 230, overflow: "auto", padding: 8, fontFamily: "monospace" }}>
              {msgs.map((m, i) => (
                <div key={m.id} style={{ display: "flex", gap: 6, alignItems: "center", padding: "3px 0", borderBottom: "1px solid #0a0a14", opacity: 1 - i * 0.03 }}>
                  <span style={{ fontSize: 10 }}>{CHANNEL_ICON[m.channel]}</span>
                  <span style={{ fontSize: 8, color: CHANNEL_COLOR[m.channel], width: 55, flexShrink: 0 }}>{m.channel}</span>
                  <span style={{ fontSize: 8, color: "#64748b", flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{m.type}</span>
                  <span style={{ fontSize: 7, color: m.status === "delivered" ? "#22c55e" : "#ef4444" }}>{m.status}</span>
                  <span style={{ fontSize: 7, color: "#334155" }}>{new Date(m.ts).toLocaleTimeString()}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Engineering PIC + District */}
          <div>
            <CodeBlock label="Engineering PIC — responsibilities beyond frontend" color="#a855f7" code={
`// "ENGINEERING PIC" = technical owner for the ENTIRE project.
// Not just "FE engineer on the messaging team."
// PIC = the single accountable person for the project's technical success.
//
// WHAT THIS MEANS IN PRACTICE:
//
// 1. TECHNICAL DESIGN OWNERSHIP:
//    Write the technical design document (TDD).
//    Define: data model, API contracts, event schema, channel routing rules.
//    Get the TDD reviewed by FE + BE + platform teams.
//    Sign off on: "This design is correct and complete."
//
// 2. CROSS-TEAM COORDINATION:
//    The messaging platform touches: TERA (partner notifications),
//    Payments (payment events), CRM (customer service), QA (delivery tracking).
//    Each team sends events TO the platform.
//    Engineering PIC: runs the alignment meetings, manages the event schema,
//    resolves conflicts ("Payments team wants eventType: PAYMENT_SUCCESS,
//    CRM team calls it ORDER_PAID — we need one canonical name").
//
// 3. DELIVERY TRACKING:
//    At every sprint review: report to stakeholders.
//    "Messaging Platform: In-app inbox delivered. Push notifications: 2w delayed
//    due to APNs certificate provisioning. Adjusted timeline communicated."
//
// 4. TECHNICAL STANDARDS:
//    Define: how events are structured (payload schema).
//    Define: retry policy (3 retries, exponential backoff, dead letter queue).
//    Define: what "delivered" means per channel (receipt vs best effort).
//    These standards apply to all teams that produce events.
//
// 5. INCIDENT OWNERSHIP:
//    Messaging platform outage → Engineering PIC is the incident commander.
//    Not just "I fix the FE." Coordinate: FE + BE + infra.
//    Communicate status every 15 minutes to stakeholders during P0.
//    Write the post-mortem. Ensure action items are assigned and tracked.

// TECHNICAL DESIGN: Event Schema
interface MessageEvent {
  eventId:      string;           // UUID v4, idempotency key
  eventType:    string;           // e.g., "BOOKING_CONFIRMED"
  producerId:   string;           // "tera" | "payments" | "crm"
  recipientId:  string;           // partner ID or user ID
  channels:     Channel[];        // ["in-app", "email"]
  payload:      Record<string, unknown>;
  templateId:   string;           // maps to template in Template Service
  priority:     "high" | "normal" | "low";
  expiresAt:    string | null;    // null = no expiry
  idempotencyKey: string;         // prevents duplicate delivery
}`} />

            <div style={{ marginTop: 10 }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: "#64748b", marginBottom: 8, letterSpacing: "0.08em" }}>
                DISTRICT — INTERNAL MOBILE TOOLING
              </div>
              <div style={{ background: "#1e293b", border: "1px solid #334155", borderRadius: 10, padding: 12, marginBottom: 8 }}>
                <div style={{ fontSize: 9, color: "#64748b", marginBottom: 8 }}>
                  District is Traveloka's internal component library for <strong style={{ color: "#94a3b8" }}>mobile apps</strong> (iOS + Android via React Native) — the mobile counterpart to Soya (web).
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 4 }}>
                  {[
                    { comp: "Button", ver: "3.2.1", breaking: false },
                    { comp: "Input",  ver: "3.1.4", breaking: false },
                    { comp: "Sheet", ver: "4.0.0", breaking: true  },  // major bump
                    { comp: "Toast",  ver: "2.8.0", breaking: false },
                    { comp: "DatePicker", ver: "3.0.2", breaking: false },
                    { comp: "Avatar", ver: "2.5.1", breaking: false },
                  ].map(c => (
                    <div key={c.comp} style={{ background: "#0f172a", borderRadius: 6, padding: "6px 8px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <div style={{ fontSize: 9, fontWeight: 600 }}>{c.comp}</div>
                      <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
                        {c.breaking && <span style={{ fontSize: 6, background: "#ef444420", color: "#f87171", borderRadius: 3, padding: "0 3px" }}>BREAKING</span>}
                        <span style={{ fontSize: 8, fontFamily: "monospace", color: "#64748b" }}>v{c.ver}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <CodeBlock label="District vs Soya — web vs mobile design systems" color="#22c55e" code={
`// SOYA (web): React components → renders to DOM.
// DISTRICT (mobile): React Native components → native UI.
//
// WHY THEY ARE SEPARATE (not a universal codebase):
// React Native components use different primitives:
//   Web:    <div>, <span>, <button>, <input>
//   Mobile: <View>, <Text>, <TouchableOpacity>, <TextInput>
// They cannot share the rendering layer.
//
// WHAT CAN BE SHARED (and IS shared):
//   - Design tokens (colors, spacing, typography scales)
//     Generated from a single source into:
//     CSS custom properties (Soya) + JS constants (District)
//   - Icon set (SVG for web, vector for native)
//   - Component API design (the prop interfaces are aligned):
//     Soya:    <Button size="md" variant="primary" />
//     District:<Button size="md" variant="primary" />
//     Same API → engineers switch between web/mobile easily.
//
// DISTRICT MAINTAINER RESPONSIBILITIES (same as Soya):
//   - Code review: accessibility on mobile (screen reader support)
//   - Platform-specific: iOS vs Android visual differences
//   - Performance: FlatList vs ScrollView for list components
//   - React Native upgrade compatibility testing
//   - Migration guides for major version bumps
//
// KEY DIFFERENCE from Soya:
//   District must handle TWO native platforms (iOS + Android).
//   A component that looks correct on iOS may need platform-specific
//   overrides on Android (shadow → elevation, fonts, tap feedback).`} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default TeraSeniorDemo;
