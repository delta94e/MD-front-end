/**
 * AnsaradaWorkflowDemo.tsx
 *
 * Ansarada Workflow — greenfield project management product for financial
 * and legal advisors running M&A transactions.
 *
 * CONTEXT
 *   Led setup and delivery of a new product from scratch.
 *   Established a Microfrontend architecture using React, React Hooks,
 *   TypeScript, and MobX. Worked closely with senior engineers to enable
 *   modular development and faster release cycles. Delivered on schedule.
 *
 * TABS
 *   🏗 MFE Architecture   — the architecture established from scratch
 *   📋 Workflow Product   — live M&A deal board (the product built)
 *   🔄 MobX Store         — reactive state management pattern
 *   ⚡ Release Velocity   — modular deployment benefits & metrics
 */

import React, { useState, useReducer, useMemo, useEffect } from "react";

// ─────────────────────────────────────────────────────────────────
// Domain types
// ─────────────────────────────────────────────────────────────────

type TaskStatus   = "not-started" | "in-progress" | "review" | "complete" | "blocked";
type TaskPriority = "critical" | "high" | "medium" | "low";
type PhaseId      = "prep" | "diligence" | "negotiation" | "closing";

interface Assignee { name: string; initials: string; color: string; role: string }
interface Task {
  id: string; phaseId: PhaseId;
  title: string; workstream: string;
  assignee: Assignee; dueDate: string;
  status: TaskStatus; priority: TaskPriority;
}
interface Phase { id: PhaseId; name: string; icon: string; color: string }

// ─────────────────────────────────────────────────────────────────
// Mock data — realistic M&A advisor workflow
// ─────────────────────────────────────────────────────────────────

const TEAM: Record<string, Assignee> = {
  sarah:  { name: "Sarah Chen",    initials: "SC", color: "#6366f1", role: "M&A Lead" },
  james:  { name: "James Walker",  initials: "JW", color: "#0ea5e9", role: "Legal" },
  priya:  { name: "Priya Patel",   initials: "PP", color: "#10b981", role: "Financial" },
  miguel: { name: "Miguel Torres", initials: "MT", color: "#f59e0b", role: "Tax" },
  emma:   { name: "Emma Liu",      initials: "EL", color: "#ec4899", role: "Compliance" },
};

const PHASES: Phase[] = [
  { id: "prep",        name: "Preparation",   icon: "📂", color: "#8b5cf6" },
  { id: "diligence",   name: "Due Diligence",  icon: "🔍", color: "#0ea5e9" },
  { id: "negotiation", name: "Negotiation",    icon: "🤝", color: "#f59e0b" },
  { id: "closing",     name: "Closing",        icon: "✅", color: "#10b981" },
];

const INITIAL_TASKS: Task[] = [
  // Preparation
  { id: "t01", phaseId: "prep",        title: "NDA execution — all parties",       workstream: "Legal",     assignee: TEAM.james,  dueDate: "Jun 10", status: "complete",    priority: "critical" },
  { id: "t02", phaseId: "prep",        title: "Virtual data room setup",           workstream: "Operations",assignee: TEAM.sarah,  dueDate: "Jun 12", status: "complete",    priority: "high"     },
  { id: "t03", phaseId: "prep",        title: "Information memorandum draft",      workstream: "Financial", assignee: TEAM.priya,  dueDate: "Jun 15", status: "in-progress", priority: "critical" },
  { id: "t04", phaseId: "prep",        title: "Management presentation review",    workstream: "Legal",     assignee: TEAM.james,  dueDate: "Jun 18", status: "review",      priority: "high"     },
  { id: "t05", phaseId: "prep",        title: "Preliminary valuation model",       workstream: "Financial", assignee: TEAM.priya,  dueDate: "Jun 20", status: "not-started", priority: "medium"   },
  // Due Diligence
  { id: "t06", phaseId: "diligence",   title: "Financial statements review",       workstream: "Financial", assignee: TEAM.priya,  dueDate: "Jul 05", status: "in-progress", priority: "critical" },
  { id: "t07", phaseId: "diligence",   title: "Legal entity structure analysis",   workstream: "Legal",     assignee: TEAM.james,  dueDate: "Jul 08", status: "not-started", priority: "high"     },
  { id: "t08", phaseId: "diligence",   title: "Tax structure review",              workstream: "Tax",       assignee: TEAM.miguel, dueDate: "Jul 10", status: "not-started", priority: "high"     },
  { id: "t09", phaseId: "diligence",   title: "Regulatory compliance check",       workstream: "Compliance",assignee: TEAM.emma,   dueDate: "Jul 12", status: "blocked",     priority: "critical" },
  { id: "t10", phaseId: "diligence",   title: "IP & technology due diligence",     workstream: "Legal",     assignee: TEAM.james,  dueDate: "Jul 15", status: "not-started", priority: "medium"   },
  // Negotiation
  { id: "t11", phaseId: "negotiation", title: "Term sheet — draft & review",       workstream: "Legal",     assignee: TEAM.james,  dueDate: "Aug 01", status: "not-started", priority: "critical" },
  { id: "t12", phaseId: "negotiation", title: "Purchase price adjustment model",   workstream: "Financial", assignee: TEAM.priya,  dueDate: "Aug 05", status: "not-started", priority: "high"     },
  { id: "t13", phaseId: "negotiation", title: "Representations & warranties",      workstream: "Legal",     assignee: TEAM.james,  dueDate: "Aug 10", status: "not-started", priority: "high"     },
  // Closing
  { id: "t14", phaseId: "closing",     title: "Definitive agreement execution",    workstream: "Legal",     assignee: TEAM.james,  dueDate: "Sep 01", status: "not-started", priority: "critical" },
  { id: "t15", phaseId: "closing",     title: "Regulatory approvals filing",       workstream: "Compliance",assignee: TEAM.emma,   dueDate: "Sep 05", status: "not-started", priority: "critical" },
  { id: "t16", phaseId: "closing",     title: "Funds flow confirmation",           workstream: "Financial", assignee: TEAM.priya,  dueDate: "Sep 10", status: "not-started", priority: "high"     },
];

// ─────────────────────────────────────────────────────────────────
// Config maps
// ─────────────────────────────────────────────────────────────────

const STATUS_CFG: Record<TaskStatus, { label: string; color: string; bg: string; icon: string }> = {
  "not-started": { label: "Not started", color: "#64748b", bg: "#1e293b",  icon: "○"  },
  "in-progress": { label: "In progress", color: "#60a5fa", bg: "#1e3a5f",  icon: "◑"  },
  "review":      { label: "In review",   color: "#f59e0b", bg: "#451a03",  icon: "◎"  },
  "complete":    { label: "Complete",    color: "#4ade80", bg: "#052e16",  icon: "●"  },
  "blocked":     { label: "Blocked",     color: "#ef4444", bg: "#450a0a",  icon: "✕"  },
};

const PRIORITY_CFG: Record<TaskPriority, { color: string; label: string }> = {
  critical: { color: "#ef4444", label: "Critical" },
  high:     { color: "#f97316", label: "High" },
  medium:   { color: "#fbbf24", label: "Medium" },
  low:      { color: "#64748b", label: "Low" },
};

// ─────────────────────────────────────────────────────────────────
// Task reducer (simulated MobX action)
// ─────────────────────────────────────────────────────────────────

type TaskAction =
  | { type: "SET_STATUS"; taskId: string; status: TaskStatus }
  | { type: "SET_FILTER"; filter: TaskStatus | "all" };

interface WorkflowState { tasks: Task[]; filter: TaskStatus | "all" }

function workflowReducer(state: WorkflowState, action: TaskAction): WorkflowState {
  switch (action.type) {
    case "SET_STATUS":
      return { ...state, tasks: state.tasks.map(t => t.id === action.taskId ? { ...t, status: action.status } : t) };
    case "SET_FILTER":
      return { ...state, filter: action.filter };
    default:
      return state;
  }
}

// ─────────────────────────────────────────────────────────────────
// MFE Architecture data
// ─────────────────────────────────────────────────────────────────

const MFE_MODULES = [
  { name: "host-shell",       port: 3000, color: "#6366f1", team: "Platform",   desc: "App shell, routing, auth, shared design tokens" },
  { name: "workflow-app",     port: 3001, color: "#0ea5e9", team: "Workflow",   desc: "Deal board, phases, tasks, Gantt view" },
  { name: "documents-app",    port: 3002, color: "#10b981", team: "Documents",  desc: "VDR document tree, viewer, annotations" },
  { name: "team-app",         port: 3003, color: "#f59e0b", team: "Collab",    desc: "Team members, roles, permissions, activity" },
  { name: "analytics-app",    port: 3004, color: "#ec4899", team: "Insights",  desc: "Deal progress, risk heatmap, reporting" },
];

const MOBX_SECTIONS = [
  {
    id: "observable", icon: "👁", title: "Observable State",
    desc: "MobX tracks which components depend on which state properties. Only components that read changed data re-render.",
    code: `// dealStore.ts — MobX observable store
import { makeObservable, observable, computed, action } from "mobx";

class DealStore {
  @observable tasks: Task[] = [];
  @observable filter: TaskStatus | "all" = "all";
  @observable selectedPhase: PhaseId | null = null;

  // Computed — automatically recalculated when tasks change
  @computed get completedCount(): number {
    return this.tasks.filter(t => t.status === "complete").length;
  }

  @computed get progressByPhase(): Record<PhaseId, number> {
    const phases: PhaseId[] = ["prep", "diligence", "negotiation", "closing"];
    return Object.fromEntries(
      phases.map(id => {
        const phaseTasks = this.tasks.filter(t => t.phaseId === id);
        const done = phaseTasks.filter(t => t.status === "complete").length;
        return [id, phaseTasks.length ? (done / phaseTasks.length) * 100 : 0];
      })
    ) as Record<PhaseId, number>;
  }

  @computed get filteredTasks(): Task[] {
    if (this.filter === "all") return this.tasks;
    return this.tasks.filter(t => t.status === this.filter);
  }

  constructor() {
    makeObservable(this);
  }

  @action setTaskStatus(taskId: string, status: TaskStatus) {
    const task = this.tasks.find(t => t.id === taskId);
    if (task) task.status = status;
    // All @computed values depending on tasks auto-update
    // All observer components re-render only if their data changed
  }

  @action setFilter(filter: TaskStatus | "all") {
    this.filter = filter;
  }
}

export const dealStore = new DealStore();`,
  },
  {
    id: "observer", icon: "🔄", title: "Observer Components",
    desc: "Components decorated with observer() automatically re-render when their MobX dependencies change — no manual subscription management.",
    code: `// PhaseProgress.tsx — observer component
import { observer } from "mobx-react-lite";
import { dealStore } from "./dealStore";

// observer() wraps the component. MobX tracks which store properties
// are accessed during render. Only those trigger re-renders.
const PhaseProgress = observer(() => {
  // MobX sees these accesses:
  const progress   = dealStore.progressByPhase;  // @computed
  const completed  = dealStore.completedCount;   // @computed
  const totalTasks = dealStore.tasks.length;      // @observable

  return (
    <div>
      <span>{completed}/{totalTasks} complete</span>
      {Object.entries(progress).map(([phase, pct]) => (
        <ProgressBar key={phase} phase={phase} percent={pct} />
      ))}
    </div>
  );
});

// vs React Context / Redux approach:
// - No useSelector, no mapStateToProps
// - No manual subscription / unsubscription
// - No "structural sharing" optimisation needed — MobX does it
// - Re-render boundary is precise: only what changed`,
  },
  {
    id: "reaction", icon: "⚡", title: "Reactions & Autorun",
    desc: "Reactions run side effects whenever observed state changes — used for syncing to localStorage, triggering API calls, or logging analytics.",
    code: `// Setup automatic side effects when store changes
import { autorun, reaction, when } from "mobx";

// autorun: runs immediately, re-runs whenever accessed observables change
const disposer1 = autorun(() => {
  // Persists filter preference to localStorage
  localStorage.setItem("workflow-filter", dealStore.filter);
  console.log("[MobX] Filter changed to:", dealStore.filter);
});

// reaction: runs only when the first expression changes (not on first run)
const disposer2 = reaction(
  () => dealStore.completedCount,  // what to watch
  (count) => {                      // what to do when it changes
    analytics.track("tasks_completed", { count, dealId: currentDeal.id });
    if (count === dealStore.tasks.length) {
      notifications.show("🎉 All tasks complete — deal ready for closing!");
    }
  }
);

// when: runs once when condition becomes true (one-shot)
when(
  () => dealStore.progressByPhase["diligence"] >= 100,
  () => dealStore.unlockPhase("negotiation")
);

// Always dispose when component unmounts to prevent memory leaks
useEffect(() => () => { disposer1(); disposer2(); }, []);`,
  },
  {
    id: "why-mobx", icon: "🤔", title: "Why MobX over Redux?",
    desc: "For complex domain models like an M&A deal (deeply nested, relationship-heavy), MobX's reactive OOP model fits more naturally than Redux's normalized flat state.",
    code: `// Redux approach — complex domain requires lots of boilerplate
// Action types, action creators, reducers, selectors, normalisation...

// reducers/tasks.ts
const tasksReducer = (state = initialState, action: AnyAction) => {
  switch (action.type) {
    case UPDATE_TASK_STATUS:
      return { ...state, tasks: { ...state.tasks,
        [action.id]: { ...state.tasks[action.id], status: action.status }
      }};
    // ... 20 more cases
  }
};

// store/selectors.ts — memoised selectors for derived data
const selectProgressByPhase = createSelector(
  selectAllTasks, (tasks) => { /* ... 15 lines */ }
);

// ───────────────────────────────────────────────────────

// MobX approach — same domain, 1/3 the code, OOP model
class DealStore {
  @observable tasks: Task[] = [];

  @computed get progressByPhase() { /* 5 lines */ }

  @action setTaskStatus(id: string, status: TaskStatus) {
    this.tasks.find(t => t.id === id)!.status = status;
    // Done. Reactive graph handles the rest.
  }
}

// DECISION RATIONALE:
// - M&A deal has deeply nested, relationship-heavy data → OOP fits better
// - Multiple computed views of same data → @computed > selectors
// - Less boilerplate → smaller team (2–3 FE devs) ships faster
// - TypeScript decorators → excellent IDE support for complex domain models`,
  },
];

// ─────────────────────────────────────────────────────────────────
// Subcomponents
// ─────────────────────────────────────────────────────────────────

function Avatar({ a, size = 28 }: { a: Assignee; size?: number }) {
  return (
    <div title={`${a.name} — ${a.role}`} style={{
      width: size, height: size, borderRadius: "50%",
      background: a.color + "30", border: `2px solid ${a.color}`,
      display: "flex", alignItems: "center", justifyContent: "center",
      fontSize: size * 0.36, fontWeight: 700, color: a.color, flexShrink: 0,
    }}>{a.initials}</div>
  );
}

function ProgressBar({ pct, color = "#6366f1", height = 6 }: { pct: number; color?: string; height?: number }) {
  return (
    <div style={{ height, background: "#0f172a", borderRadius: height / 2, overflow: "hidden" }}>
      <div style={{ width: `${Math.min(100, pct)}%`, height: "100%", background: color, borderRadius: height / 2, transition: "width 0.4s ease" }} />
    </div>
  );
}

function StatusBadge({ status, onClick }: { status: TaskStatus; onClick?: () => void }) {
  const cfg = STATUS_CFG[status];
  return (
    <button onClick={onClick} title={onClick ? "Click to cycle status" : undefined} style={{
      background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.color}40`,
      borderRadius: 5, padding: "2px 7px", fontSize: 10, fontWeight: 700,
      cursor: onClick ? "pointer" : "default", whiteSpace: "nowrap",
    }}>{cfg.icon} {cfg.label}</button>
  );
}

// ─────────────────────────────────────────────────────────────────
// Main Demo
// ─────────────────────────────────────────────────────────────────

const STATUS_CYCLE: TaskStatus[] = ["not-started", "in-progress", "review", "complete", "blocked"];

export function AnsaradaWorkflowDemo() {
  const [activeTab, setActiveTab] = useState<"arch" | "workflow" | "mobx" | "velocity">("arch");
  const [{ tasks, filter }, dispatch] = useReducer(workflowReducer, { tasks: INITIAL_TASKS, filter: "all" });
  const [selectedPhase, setSelectedPhase] = useState<PhaseId | "all">("all");
  const [mobxSection, setMobxSection] = useState("observable");
  const [storeView, setStoreView] = useState(true);

  const cycleStatus = (taskId: string, current: TaskStatus) => {
    const idx = STATUS_CYCLE.indexOf(current);
    dispatch({ type: "SET_STATUS", taskId, status: STATUS_CYCLE[(idx + 1) % STATUS_CYCLE.length] });
  };

  // Computed state (simulates MobX @computed)
  const progressByPhase = useMemo(() =>
    Object.fromEntries(PHASES.map(p => {
      const pt = tasks.filter(t => t.phaseId === p.id);
      const done = pt.filter(t => t.status === "complete").length;
      return [p.id, { pct: pt.length ? (done / pt.length) * 100 : 0, done, total: pt.length }];
    })) as Record<PhaseId, { pct: number; done: number; total: number }>,
    [tasks]
  );

  const completedCount = useMemo(() => tasks.filter(t => t.status === "complete").length, [tasks]);
  const blockedCount   = useMemo(() => tasks.filter(t => t.status === "blocked").length, [tasks]);

  const filteredTasks = useMemo(() => tasks.filter(t => {
    const byPhase  = selectedPhase === "all" || t.phaseId === selectedPhase;
    const byStatus = filter === "all" || t.status === filter;
    return byPhase && byStatus;
  }), [tasks, selectedPhase, filter]);

  const activeMobx = MOBX_SECTIONS.find(s => s.id === mobxSection)!;

  // Simulated live "last updated" tick for store panel
  const [tick, setTick] = useState(0);
  useEffect(() => {
    if (activeTab !== "workflow") return;
    const t = setInterval(() => setTick(n => n + 1), 3000);
    return () => clearInterval(t);
  }, [activeTab]);

  return (
    <div style={{ background: "#0f172a", color: "#f1f5f9", fontFamily: "'Inter', system-ui, sans-serif", minHeight: "100vh", padding: 24 }}>
      {/* Header */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
          <span style={{ fontSize: 28 }}>📋</span>
          <div>
            <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800 }}>Ansarada Workflow</h1>
            <p style={{ margin: 0, color: "#64748b", fontSize: 13 }}>
              Greenfield MFE · React + TypeScript + MobX · Project management for M&A advisors
            </p>
          </div>
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {["Microfrontend", "Module Federation", "MobX", "React Hooks", "TypeScript", "Greenfield", "M&A Deal Flow", "Modular Release Cycles"].map(t => (
            <span key={t} style={{ background: "#1e293b", color: "#94a3b8", border: "1px solid #334155", borderRadius: 20, padding: "3px 10px", fontSize: 11 }}>{t}</span>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 4, marginBottom: 20, borderBottom: "1px solid #1e293b", paddingBottom: 4 }}>
        {[
          { id: "arch"     as const, label: "🏗 MFE Architecture" },
          { id: "workflow" as const, label: "📋 Workflow Product" },
          { id: "mobx"    as const, label: "🔄 MobX Store" },
          { id: "velocity" as const, label: "⚡ Release Velocity" },
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

      {/* ── MFE ARCHITECTURE ── */}
      {activeTab === "arch" && (
        <div>
          {/* Why MFE box */}
          <div style={{ background: "#1e293b", border: "1px solid #6366f130", borderRadius: 10, padding: 16, marginBottom: 16 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: "#a5b4fc", marginBottom: 8 }}>Why Microfrontend for Ansarada Workflow?</div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 10 }}>
              {[
                { icon: "🏃", title: "Independent delivery", body: "Each feature team (Workflow, Documents, Team) ships without coordinating deploys with others." },
                { icon: "🔒", title: "Fault isolation",      body: "A bug in the Documents module cannot crash the Workflow board — boundaries are hard boundaries." },
                { icon: "⚡", title: "Faster iteration",     body: "Workflow team can release daily. Platform team releases weekly. No coupling, no gatekeeping." },
              ].map(c => (
                <div key={c.title} style={{ background: "#0f172a", borderRadius: 8, padding: 12 }}>
                  <div style={{ fontSize: 16, marginBottom: 4 }}>{c.icon} <span style={{ fontSize: 12, fontWeight: 700, color: "#f1f5f9" }}>{c.title}</span></div>
                  <div style={{ fontSize: 11, color: "#64748b", lineHeight: 1.6 }}>{c.body}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Module map */}
          <div style={{ background: "#1e293b", border: "1px solid #334155", borderRadius: 10, padding: 16, marginBottom: 16 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: "#f1f5f9", marginBottom: 14 }}>Module Federation Map</div>
            {/* Host shell */}
            <div style={{ background: "#6366f115", border: "2px solid #6366f1", borderRadius: 10, padding: 14, marginBottom: 12 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: "#a5b4fc" }}>🏠 host-shell :3000 — Platform Team</span>
                <span style={{ fontSize: 10, color: "#64748b" }}>Orchestrator · Routing · Auth · Design tokens</span>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 10 }}>
                {MFE_MODULES.slice(1).map(m => (
                  <div key={m.name} style={{ background: m.color + "15", border: `1px solid ${m.color}40`, borderRadius: 8, padding: 10 }}>
                    <div style={{ fontSize: 10, fontWeight: 700, color: m.color, marginBottom: 2 }}>{m.name}</div>
                    <div style={{ fontSize: 9, color: "#64748b", marginBottom: 4 }}>:{m.port} · {m.team} team</div>
                    <div style={{ fontSize: 10, color: "#94a3b8", lineHeight: 1.5 }}>{m.desc}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Module Federation config */}
            <div style={{ background: "#0f172a", borderRadius: 8, overflow: "hidden" }}>
              <div style={{ padding: "6px 12px", fontSize: 10, color: "#64748b", borderBottom: "1px solid #1e293b" }}>
                webpack.config.ts — Module Federation plugin (host)
              </div>
              <pre style={{ margin: 0, padding: 14, fontSize: 11, fontFamily: "monospace", color: "#7dd3fc", lineHeight: 1.7 }}>{
`new ModuleFederationPlugin({
  name: "host",
  remotes: {
    workflowApp:  "workflowApp@http://localhost:3001/remoteEntry.js",
    documentsApp: "documentsApp@http://localhost:3002/remoteEntry.js",
    teamApp:      "teamApp@http://localhost:3003/remoteEntry.js",
    analyticsApp: "analyticsApp@http://localhost:3004/remoteEntry.js",
  },
  shared: {
    react:        { singleton: true, requiredVersion: "^18.0.0" },
    "react-dom":  { singleton: true, requiredVersion: "^18.0.0" },
    mobx:         { singleton: true, requiredVersion: "^6.0.0" },
    "mobx-react-lite": { singleton: true },
  },
})`}
              </pre>
            </div>
          </div>

          {/* Shared contracts */}
          <div style={{ background: "#1e293b", border: "1px solid #334155", borderRadius: 10, padding: 16 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: "#f1f5f9", marginBottom: 12 }}>Shared Contracts — What I Established from Day 1</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              {[
                { title: "Design tokens (shared)", color: "#6366f1", code: `// packages/tokens/src/index.ts
export const tokens = {
  colors: { primary: "#6366f1", bg: "#0f172a" },
  spacing: { sm: 8, md: 16, lg: 24 },
  fontSize: { sm: 11, base: 13, lg: 16 },
} as const;
// All MFEs import from @ansarada/tokens
// One source of truth for all visual consistency` },
                { title: "Shared MobX store", color: "#10b981", code: `// packages/shared-store/src/index.ts
// Singletons shared via Module Federation
export { authStore }   from "./authStore";   // current user
export { dealStore }   from "./dealStore";   // current deal
export { navStore }    from "./navStore";    // active route
// MFEs READ shared stores, never write to another's store
// Own data → own store. Cross-cutting data → shared store` },
              ].map(s => (
                <div key={s.title} style={{ background: "#0f172a", borderRadius: 8, overflow: "hidden" }}>
                  <div style={{ padding: "6px 12px", fontSize: 10, color: s.color, fontWeight: 700, borderBottom: "1px solid #1e293b" }}>{s.title}</div>
                  <pre style={{ margin: 0, padding: 12, fontSize: 10, fontFamily: "monospace", color: "#94a3b8", lineHeight: 1.6 }}>{s.code}</pre>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── WORKFLOW PRODUCT ── */}
      {activeTab === "workflow" && (
        <div style={{ display: "flex", gap: 16 }}>
          {/* Main board */}
          <div style={{ flex: 1, minWidth: 0 }}>
            {/* Deal header */}
            <div style={{ background: "#1e293b", border: "1px solid #334155", borderRadius: 10, padding: 16, marginBottom: 14 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 12 }}>
                <div>
                  <div style={{ fontSize: 10, color: "#64748b", marginBottom: 2 }}>ACTIVE DEAL</div>
                  <div style={{ fontSize: 18, fontWeight: 800 }}>Project Neptune</div>
                  <div style={{ fontSize: 11, color: "#64748b" }}>Acquisition · Technology Sector · Confidential</div>
                </div>
                <div style={{ display: "flex", gap: 10 }}>
                  {[
                    { label: "Total tasks",  value: String(tasks.length), color: "#818cf8" },
                    { label: "Complete",     value: String(completedCount), color: "#4ade80" },
                    { label: "Blocked",      value: String(blockedCount),   color: "#ef4444" },
                    { label: "Deal progress",value: `${Math.round((completedCount / tasks.length) * 100)}%`, color: "#22d3ee" },
                  ].map(m => (
                    <div key={m.label} style={{ background: "#0f172a", borderRadius: 8, padding: "8px 12px", textAlign: "center" }}>
                      <div style={{ fontSize: 9, color: "#64748b" }}>{m.label}</div>
                      <div style={{ fontSize: 18, fontWeight: 800, color: m.color }}>{m.value}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Phase progress bars */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 10, marginTop: 14 }}>
                {PHASES.map(p => {
                  const prog = progressByPhase[p.id];
                  return (
                    <div key={p.id}>
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, color: "#94a3b8", marginBottom: 4 }}>
                        <span>{p.icon} {p.name}</span>
                        <span style={{ color: p.color }}>{prog.done}/{prog.total}</span>
                      </div>
                      <ProgressBar pct={prog.pct} color={p.color} height={5} />
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Filters */}
            <div style={{ display: "flex", gap: 6, marginBottom: 12, flexWrap: "wrap" }}>
              <div style={{ display: "flex", gap: 4 }}>
                {([["all", "All phases"], ...PHASES.map(p => [p.id, p.name])] as [string, string][]).map(([id, label]) => (
                  <button key={id} onClick={() => setSelectedPhase(id as PhaseId | "all")} style={{
                    background: selectedPhase === id ? "#6366f120" : "#1e293b",
                    border: `1px solid ${selectedPhase === id ? "#6366f1" : "#334155"}`,
                    borderRadius: 6, padding: "4px 10px",
                    color: selectedPhase === id ? "#a5b4fc" : "#64748b",
                    cursor: "pointer", fontSize: 11,
                  }}>{label}</button>
                ))}
              </div>
              <div style={{ marginLeft: "auto", display: "flex", gap: 4 }}>
                {(["all", "in-progress", "review", "blocked", "complete"] as const).map(s => (
                  <button key={s} onClick={() => dispatch({ type: "SET_FILTER", filter: s })} style={{
                    background: filter === s ? STATUS_CFG[s === "all" ? "not-started" : s].bg : "#1e293b",
                    border: `1px solid ${filter === s ? "#6366f1" : "#334155"}`,
                    borderRadius: 6, padding: "4px 10px",
                    color: filter === s ? "#f1f5f9" : "#64748b",
                    cursor: "pointer", fontSize: 11,
                  }}>{s === "all" ? "All status" : STATUS_CFG[s].label}</button>
                ))}
              </div>
            </div>

            {/* Task list */}
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {filteredTasks.length === 0 && (
                <div style={{ background: "#1e293b", borderRadius: 10, padding: 24, textAlign: "center", color: "#475569" }}>
                  No tasks match the current filters
                </div>
              )}
              {filteredTasks.map(task => {
                const sc = STATUS_CFG[task.status];
                const pc = PRIORITY_CFG[task.priority];
                const phase = PHASES.find(p => p.id === task.phaseId)!;
                return (
                  <div key={task.id} style={{
                    background: "#1e293b", border: `1px solid ${task.status === "blocked" ? "#ef444430" : "#334155"}`,
                    borderRadius: 10, padding: "10px 14px",
                    borderLeft: `3px solid ${phase.color}`,
                  }}>
                    <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: "flex", gap: 6, alignItems: "center", marginBottom: 3, flexWrap: "wrap" }}>
                          <span style={{ fontSize: 12, fontWeight: 600, color: "#f1f5f9" }}>{task.title}</span>
                          <span style={{ fontSize: 9, color: "#64748b", background: "#0f172a", padding: "1px 5px", borderRadius: 3 }}>{task.workstream}</span>
                          <span style={{ fontSize: 9, color: pc.color, background: pc.color + "15", padding: "1px 5px", borderRadius: 3, fontWeight: 700 }}>
                            {task.priority}
                          </span>
                        </div>
                        <div style={{ fontSize: 10, color: "#475569" }}>
                          <span style={{ color: phase.color }}>{phase.icon} {phase.name}</span>
                          <span style={{ margin: "0 6px" }}>·</span>
                          <span>Due {task.dueDate}</span>
                        </div>
                      </div>
                      <Avatar a={task.assignee} />
                      <StatusBadge status={task.status} onClick={() => cycleStatus(task.id, task.status)} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* MobX store panel (live) */}
          {storeView && (
            <div style={{ width: 240, flexShrink: 0 }}>
              <div style={{ background: "#1e293b", border: "1px solid #6366f130", borderRadius: 10, overflow: "hidden", position: "sticky", top: 80 }}>
                <div style={{ padding: "8px 12px", borderBottom: "1px solid #334155", display: "flex", justifyContent: "space-between", alignItems: "center", background: "#0f172a" }}>
                  <span style={{ fontSize: 10, fontWeight: 700, color: "#a5b4fc" }}>🔄 MobX dealStore</span>
                  <span style={{ fontSize: 9, color: "#4ade80" }}>● live</span>
                </div>
                <div style={{ padding: 12, fontSize: 11, fontFamily: "monospace" }}>
                  <div style={{ color: "#64748b", marginBottom: 6 }}>// @observable</div>
                  <div style={{ marginBottom: 8 }}>
                    <span style={{ color: "#f97316" }}>tasks</span>
                    <span style={{ color: "#94a3b8" }}>: </span>
                    <span style={{ color: "#4ade80" }}>{tasks.length} items</span>
                  </div>
                  <div style={{ marginBottom: 12 }}>
                    <span style={{ color: "#f97316" }}>filter</span>
                    <span style={{ color: "#94a3b8" }}>: </span>
                    <span style={{ color: "#22d3ee" }}>"{filter}"</span>
                  </div>
                  <div style={{ color: "#64748b", marginBottom: 6 }}>// @computed</div>
                  <div style={{ marginBottom: 4 }}>
                    <div style={{ color: "#a5b4fc", marginBottom: 3 }}>completedCount</div>
                    <div style={{ fontSize: 18, fontWeight: 800, color: "#4ade80" }}>{completedCount}</div>
                  </div>
                  <div style={{ marginBottom: 12 }}>
                    <div style={{ color: "#a5b4fc", marginBottom: 3 }}>blockedCount</div>
                    <div style={{ fontSize: 18, fontWeight: 800, color: "#ef4444" }}>{blockedCount}</div>
                  </div>
                  <div style={{ color: "#64748b", marginBottom: 6 }}>// progressByPhase</div>
                  {PHASES.map(p => {
                    const prog = progressByPhase[p.id];
                    return (
                      <div key={p.id} style={{ marginBottom: 8 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, marginBottom: 2 }}>
                          <span style={{ color: "#94a3b8" }}>{p.name.slice(0, 10)}</span>
                          <span style={{ color: p.color }}>{prog.pct.toFixed(0)}%</span>
                        </div>
                        <ProgressBar pct={prog.pct} color={p.color} height={4} />
                      </div>
                    );
                  })}
                  <div style={{ marginTop: 10, fontSize: 9, color: "#475569" }}>
                    💡 Click task status badges to see reactive updates
                  </div>
                  <div style={{ fontSize: 9, color: "#334155", marginTop: 4 }}>tick #{tick}</div>
                </div>
              </div>
              <button onClick={() => setStoreView(false)} style={{ marginTop: 6, fontSize: 10, color: "#475569", background: "none", border: "none", cursor: "pointer" }}>
                hide store panel
              </button>
            </div>
          )}
          {!storeView && (
            <button onClick={() => setStoreView(true)} style={{ alignSelf: "flex-start", fontSize: 11, color: "#6366f1", background: "#6366f115", border: "1px solid #6366f140", borderRadius: 6, padding: "6px 12px", cursor: "pointer" }}>
              Show MobX store
            </button>
          )}
        </div>
      )}

      {/* ── MOBX STORE ── */}
      {activeTab === "mobx" && (
        <div style={{ display: "flex", gap: 16 }}>
          <div style={{ width: 200, flexShrink: 0 }}>
            {MOBX_SECTIONS.map(s => (
              <button key={s.id} onClick={() => setMobxSection(s.id)} style={{
                display: "block", width: "100%", textAlign: "left",
                background: mobxSection === s.id ? "#6366f120" : "#1e293b",
                border: `1px solid ${mobxSection === s.id ? "#6366f1" : "#334155"}`,
                borderRadius: 8, padding: "10px 12px", marginBottom: 6,
                cursor: "pointer", color: mobxSection === s.id ? "#a5b4fc" : "#94a3b8",
                fontSize: 12, fontWeight: mobxSection === s.id ? 700 : 400,
              }}>{s.icon} {s.title}</button>
            ))}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ background: "#1e293b", border: "1px solid #334155", borderRadius: 10, padding: 20, marginBottom: 14 }}>
              <div style={{ fontSize: 16, fontWeight: 800, color: "#f1f5f9", marginBottom: 6 }}>{activeMobx.icon} {activeMobx.title}</div>
              <div style={{ fontSize: 13, color: "#94a3b8", lineHeight: 1.7 }}>{activeMobx.desc}</div>
            </div>
            <div style={{ background: "#1e293b", border: "1px solid #334155", borderRadius: 10, overflow: "hidden" }}>
              <div style={{ padding: "8px 14px", borderBottom: "1px solid #334155", fontSize: 10, color: "#64748b", background: "#0f172a" }}>
                Implementation pattern
              </div>
              <pre style={{ margin: 0, padding: 16, fontSize: 11, fontFamily: "monospace", color: "#94a3b8", lineHeight: 1.7, overflow: "auto", maxHeight: 480 }}>
                <code>{activeMobx.code}</code>
              </pre>
            </div>
          </div>
        </div>
      )}

      {/* ── RELEASE VELOCITY ── */}
      {activeTab === "velocity" && (
        <div>
          {/* Metrics */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12, marginBottom: 20 }}>
            {[
              { label: "Deploy frequency", before: "2×/week (monolith)", after: "8×/week (per MFE)", color: "#4ade80" },
              { label: "Release coupling", before: "All teams wait",     after: "Teams deploy independently", color: "#22d3ee" },
              { label: "Bundle per module", before: "1 × 2.8MB",        after: "4 × 180–420KB", color: "#818cf8" },
              { label: "Rollback time",    before: "~15 min",            after: "~2 min (per MFE)", color: "#fbbf24" },
            ].map(m => (
              <div key={m.label} style={{ background: "#1e293b", border: `1px solid ${m.color}20`, borderRadius: 10, padding: 14 }}>
                <div style={{ fontSize: 10, color: "#64748b", marginBottom: 8, fontWeight: 700 }}>{m.label}</div>
                <div style={{ fontSize: 11, color: "#ef4444", marginBottom: 4 }}>Before: {m.before}</div>
                <div style={{ fontSize: 11, color: m.color, fontWeight: 700 }}>After: {m.after}</div>
              </div>
            ))}
          </div>

          {/* Bundle composition */}
          <div style={{ background: "#1e293b", border: "1px solid #334155", borderRadius: 10, padding: 16, marginBottom: 16 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: "#f1f5f9", marginBottom: 14 }}>Bundle Composition — Code Splitting per MFE</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {[
                { name: "host-shell",    kb: 68,  color: "#6366f1", note: "Auth, routing, shared tokens only" },
                { name: "workflow-app",  kb: 340, color: "#0ea5e9", note: "Deal board, Gantt, MobX store" },
                { name: "documents-app", kb: 420, color: "#10b981", note: "VDR viewer, PDF.js, annotations" },
                { name: "team-app",      kb: 180, color: "#f59e0b", note: "Team management, permissions" },
                { name: "analytics-app", kb: 290, color: "#ec4899", note: "Charts (lightweight, loaded last)" },
                { name: "shared vendors",kb: 410, color: "#334155", note: "React, MobX — cached after first load" },
              ].map(m => {
                const maxKb = 420;
                return (
                  <div key={m.name} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <span style={{ width: 130, fontSize: 11, color: m.color, fontFamily: "monospace" }}>{m.name}</span>
                    <div style={{ flex: 1, height: 16, background: "#0f172a", borderRadius: 4, overflow: "hidden" }}>
                      <div style={{ width: `${(m.kb / maxKb) * 100}%`, height: "100%", background: m.color, borderRadius: 4 }} />
                    </div>
                    <span style={{ width: 45, fontSize: 11, color: "#94a3b8", textAlign: "right", fontFamily: "monospace" }}>{m.kb}KB</span>
                    <span style={{ fontSize: 10, color: "#475569", flex: 1 }}>{m.note}</span>
                  </div>
                );
              })}
            </div>
            <div style={{ marginTop: 12, fontSize: 10, color: "#64748b" }}>
              💡 Modules are loaded on demand — if a user never visits Analytics, that 290KB is never downloaded.
            </div>
          </div>

          {/* Deployment timeline */}
          <div style={{ background: "#1e293b", border: "1px solid #334155", borderRadius: 10, padding: 16 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: "#f1f5f9", marginBottom: 14 }}>Independent Deployment — How It Works</div>
            <div style={{ background: "#0f172a", borderRadius: 8, overflow: "hidden" }}>
              <pre style={{ margin: 0, padding: 14, fontSize: 11, fontFamily: "monospace", color: "#94a3b8", lineHeight: 1.7 }}>{
`# workflow-app CI/CD (GitHub Actions)
# Runs independently — no coordination with other teams

on:
  push:
    paths: ["packages/workflow-app/**"]  # only triggers for workflow changes

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Install & build
        run: |
          pnpm --filter workflow-app install
          pnpm --filter workflow-app build
          # Output: remoteEntry.js + chunked bundles

      - name: Deploy to CDN
        run: aws s3 sync dist/ s3://ansarada-mfe/workflow-app/\${GITHUB_SHA}/

      - name: Update manifest
        run: |
          # Host shell fetches this manifest to resolve remote URLs
          # A/B rollout: canary → stable → retire old version
          aws s3 cp manifest.json s3://ansarada-mfe/workflow-app/latest/

# Result: workflow-app team ships → available to users in ~4 minutes
# Other teams: zero involvement. Zero risk of being blocked.`}
              </pre>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AnsaradaWorkflowDemo;
