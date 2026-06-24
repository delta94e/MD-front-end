/**
 * SalesWorkflowDemo.tsx
 *
 * Sales engagement platform — workflow builder, insights, growth, and engineering quality.
 *
 * 1. WORKFLOW BUILDER
 *    Visual workflow with Email/LinkedIn/Task/Call/Condition steps.
 *    Inline sequence builder V2: React Hook Form + Zod, dynamic step schemas.
 *    Max credits / people-per-company limits.
 *
 * 2. WORKFLOW INSIGHTS
 *    Tasks, Activity, Enrollment funnel, Signals widgets.
 *    Credit-usage breakdown. Per-step email metrics.
 *
 * 3. GROWTH & ACTIVATION
 *    Starter templates, one-click creation, public sharing / cloning.
 *    AI-SDR / Outbound Copilot entry point with impression-capped auto-skip.
 *
 * 4. ENGINEERING QUALITY
 *    Unit test coverage: 38% → 65% in 3 months.
 *    AI-assisted test creation. 28 CX usability tickets closed.
 *
 * TABS
 *   🔄 Workflow Builder  — visual steps, sequence form, limits
 *   📊 Insights          — Tasks, Activity, Enrollment, Signals, metrics
 *   🚀 Growth            — templates, public sharing, AI Copilot
 *   🧪 Engineering       — coverage initiative, UX delight, CX tickets
 */

import React, { useState, useCallback, useMemo } from "react";

// ─────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────

type StepType = "email" | "linkedin" | "task" | "call" | "delay" | "condition";
type LinkedInAction = "connect" | "message" | "view";
type EmailMode = "auto" | "manual";

interface WorkflowStep {
  id: string; type: StepType; day: number;
  title: string; subtitle?: string; emailMode?: EmailMode; linkedInAction?: LinkedInAction;
}

// ─────────────────────────────────────────────────────────────────
// Seed data
// ─────────────────────────────────────────────────────────────────

const STEP_META: Record<StepType, { icon: string; color: string; label: string }> = {
  email:     { icon: "✉️",  color: "#6366f1", label: "Email"     },
  linkedin:  { icon: "💼",  color: "#0ea5e9", label: "LinkedIn"  },
  task:      { icon: "✅",  color: "#f59e0b", label: "Task"      },
  call:      { icon: "📞",  color: "#4ade80", label: "Call"      },
  delay:     { icon: "⏱",  color: "#94a3b8", label: "Wait"      },
  condition: { icon: "🔀",  color: "#a855f7", label: "Condition" },
};

const INITIAL_STEPS: WorkflowStep[] = [
  { id: "s1", type: "email",    day: 1,  title: "Intro email",              subtitle: "Auto-send · 9:00 AM", emailMode: "auto"   },
  { id: "s2", type: "delay",   day: 3,  title: "Wait 2 days",              subtitle: "No action required"                       },
  { id: "s3", type: "linkedin", day: 3,  title: "Connect on LinkedIn",     subtitle: "With note",           linkedInAction: "connect" },
  { id: "s4", type: "email",    day: 5,  title: "Follow-up: product demo", subtitle: "Manual · review first", emailMode: "manual" },
  { id: "s5", type: "task",    day: 7,  title: "Research account",         subtitle: "Due in 2 days"                             },
  { id: "s6", type: "call",    day: 9,  title: "Discovery call attempt",   subtitle: "Leave voicemail if no answer"              },
  { id: "s7", type: "email",   day: 12, title: "Break-up email",           subtitle: "Auto-send · Last touch", emailMode: "auto" },
];

const ACTIVITY_FEED = [
  { icon: "📬", event: "Email opened",              person: "Sarah K. (Acme Corp)",    time: "2m ago",  color: "#4ade80" },
  { icon: "🔗", event: "LinkedIn connection accepted", person: "James T. (Stripe)",   time: "14m ago", color: "#0ea5e9" },
  { icon: "↩️", event: "Replied to email",           person: "Maria L. (HubSpot)",    time: "1h ago",  color: "#f59e0b" },
  { icon: "🖱",  event: "Clicked CTA link",          person: "Tom R. (Salesforce)",   time: "2h ago",  color: "#a855f7" },
  { icon: "🚫", event: "Opted out",                  person: "Janet M. (Oracle)",     time: "3h ago",  color: "#ef4444" },
  { icon: "📬", event: "Email opened",               person: "Chris P. (Zendesk)",    time: "4h ago",  color: "#4ade80" },
];

const TASKS_DATA = [
  { title: "Research Acme Corp funding round",       assignee: "You",     due: "Today",      priority: "high"   },
  { title: "Personalise LinkedIn message for James", assignee: "You",     due: "Tomorrow",   priority: "medium" },
  { title: "Review pending manual emails (3)",       assignee: "You",     due: "Today",      priority: "high"   },
  { title: "Call Tom @ Salesforce — 2nd attempt",   assignee: "You",     due: "In 2 days",  priority: "low"    },
];

const SIGNALS_DATA = [
  { signal: "Visited pricing page",        company: "Acme Corp",    icon: "💰", color: "#f59e0b", strength: "High"   },
  { signal: "Viewed G2 profile",           company: "Stripe",       icon: "⭐", color: "#4ade80", strength: "Medium" },
  { signal: "Job posting: RevOps Manager", company: "HubSpot",      icon: "💼", color: "#0ea5e9", strength: "Medium" },
  { signal: "3+ email opens in 24h",       company: "Salesforce",   icon: "🔥", color: "#ef4444", strength: "High"   },
];

const ENROLLMENT_FUNNEL = [
  { label: "Enrolled",   count: 1247, pct: 100,  color: "#6366f1" },
  { label: "Active",     count:  834, pct: 66.9, color: "#0ea5e9" },
  { label: "Replied",    count:  156, pct: 12.5, color: "#4ade80" },
  { label: "Completed",  count:  412, pct: 33.0, color: "#f59e0b" },
  { label: "Converted",  count:   89, pct:  7.1, color: "#a855f7" },
  { label: "Opted Out",  count:   43, pct:  3.4, color: "#ef4444" },
];

const EMAIL_STEP_METRICS = [
  { step: "Intro email",       sent: 1247, openRate: "48%", clickRate: "12%", replyRate: "4.2%", bounceRate: "1.1%" },
  { step: "Follow-up: demo",   sent:  834, openRate: "39%", clickRate: "8%",  replyRate: "7.8%", bounceRate: "0.8%" },
  { step: "Break-up email",    sent:  412, openRate: "22%", clickRate: "3%",  replyRate: "2.1%", bounceRate: "0.5%" },
];

const CREDIT_USAGE = [
  { label: "Auto emails",    used: 2493, budget: 3000, color: "#6366f1" },
  { label: "LinkedIn steps", used:  834, budget: 1000, color: "#0ea5e9" },
  { label: "Manual tasks",   used:  412, budget:  600, color: "#f59e0b" },
  { label: "Calls logged",   used:  289, budget:  400, color: "#4ade80" },
];

const TEMPLATES = [
  { name: "Cold Outbound — SaaS",     steps: 7, days: 14, icon: "❄️",  category: "Outbound"  },
  { name: "Inbound Follow-up",         steps: 5, days: 7,  icon: "🔥",  category: "Inbound"   },
  { name: "Conference Follow-up",      steps: 4, days: 5,  icon: "🎟",  category: "Events"    },
  { name: "Re-engagement",             steps: 6, days: 21, icon: "💫",  category: "Nurture"   },
  { name: "Champion Change",           steps: 5, days: 10, icon: "🏆",  category: "Expansion" },
  { name: "Referral Request",          steps: 3, days: 7,  icon: "🤝",  category: "Referral"  },
];

const COVERAGE_MONTHS = [
  { month: "Month 1", before: 38, after: 48, delta: "+10%", focus: "Previously untested utility functions" },
  { month: "Month 2", before: 48, after: 58, delta: "+10%", focus: "Form validation & workflow step logic" },
  { month: "Month 3", before: 58, after: 65, delta: "+7%",  focus: "Complex component trees (AI-assisted)" },
];

const CX_TICKETS = [
  { area: "Filter persistence lost on navigation", count: 6, severity: "high" },
  { area: "Table sort state resets unexpectedly",  count: 5, severity: "high" },
  { area: "Empty states missing/misleading",       count: 4, severity: "medium" },
  { area: "Inline edit saves silent on error",     count: 4, severity: "medium" },
  { area: "Workflow name truncation overflow",     count: 3, severity: "low" },
  { area: "Date picker timezone misalignment",     count: 3, severity: "medium" },
  { area: "Step reorder loses config state",       count: 3, severity: "high" },
];

// ─────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────

function CodeBlock({ code, label, color = "#64748b" }: { code: string; label?: string; color?: string }) {
  return (
    <div style={{ background: "#0f172a", borderRadius: 8, overflow: "hidden" }}>
      {label && <div style={{ padding: "5px 12px", borderBottom: "1px solid #1e293b", fontSize: 10, color }}>{label}</div>}
      <pre style={{ margin: 0, padding: 12, fontSize: 10, fontFamily: "monospace", color: "#94a3b8", lineHeight: 1.7, overflow: "auto", maxHeight: 340 }}>{code}</pre>
    </div>
  );
}

let nextId = 100;
function uid() { return `step_${++nextId}`; }

// ─────────────────────────────────────────────────────────────────
// Main
// ─────────────────────────────────────────────────────────────────

export function SalesWorkflowDemo() {
  const [activeTab, setActiveTab] = useState<"builder" | "insights" | "growth" | "eng">("builder");

  // Builder state
  const [steps, setSteps]                 = useState<WorkflowStep[]>(INITIAL_STEPS);
  const [selectedStep, setSelectedStep]   = useState<WorkflowStep | null>(null);
  const [insertAfter, setInsertAfter]     = useState<string | null>(null);
  const [maxCredits, setMaxCredits]       = useState(3000);
  const [maxPerCompany, setMaxPerCompany] = useState(5);

  // Insights state
  const [insightWidget, setInsightWidget] = useState<"tasks" | "activity" | "enrollment" | "signals">("enrollment");
  const [showPerStep, setShowPerStep]     = useState(false);

  // Growth state
  const [impressions, setImpressions]     = useState(0);
  const MAX_IMPRESSIONS = 3;
  const [copilotOpen, setCopilotOpen]     = useState(false);
  const [sharedLink, setSharedLink]       = useState("");
  const [cloned, setCloned]               = useState(false);

  // Eng state
  const [coverageMonth, setCoverageMonth] = useState(2);

  const addStep = useCallback((type: StepType, afterId: string) => {
    const meta = STEP_META[type];
    const afterIdx = steps.findIndex(s => s.id === afterId);
    const afterDay = steps[afterIdx]?.day ?? 0;
    const newStep: WorkflowStep = {
      id: uid(), type, day: afterDay + 2,
      title: `New ${meta.label} step`, subtitle: "Configure me",
    };
    setSteps(prev => {
      const next = [...prev];
      next.splice(afterIdx + 1, 0, newStep);
      return next;
    });
    setInsertAfter(null);
    setSelectedStep(newStep);
  }, [steps]);

  const removeStep = useCallback((id: string) => {
    setSteps(prev => prev.filter(s => s.id !== id));
    setSelectedStep(null);
  }, []);

  const handleShare = () => {
    setSharedLink("https://app.example.com/workflows/share/cold-saas-v3?token=abc123");
  };
  const handleClone = () => { setCloned(true); setTimeout(() => setCloned(false), 2000); };

  const showCopilot = () => {
    if (impressions >= MAX_IMPRESSIONS) return;
    setImpressions(i => i + 1);
    setCopilotOpen(true);
  };

  const TABS = [
    { id: "builder"  as const, label: "🔄 Workflow Builder"  },
    { id: "insights" as const, label: "📊 Insights"          },
    { id: "growth"   as const, label: "🚀 Growth"            },
    { id: "eng"      as const, label: "🧪 Engineering"       },
  ];

  return (
    <div style={{ background: "#0f172a", color: "#f1f5f9", fontFamily: "'Inter', system-ui, sans-serif", minHeight: "100vh", padding: 24 }}>

      {/* Header */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
          <span style={{ fontSize: 28 }}>⚡</span>
          <div>
            <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800 }}>Sales Workflow Platform</h1>
            <p style={{ margin: 0, color: "#64748b", fontSize: 13 }}>
              Workflow builder · Sequence V2 · Insights · AI Copilot · Test coverage 38→65%
            </p>
          </div>
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {["Workflow Builder", "React Hook Form", "Zod", "AI-SDR", "Outbound Copilot", "Public Sharing", "Test Coverage", "UX Delight", "Sequence Builder V2", "Credits System"].map(t => (
            <span key={t} style={{ background: "#1e293b", color: "#94a3b8", border: "1px solid #334155", borderRadius: 20, padding: "3px 10px", fontSize: 11 }}>{t}</span>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 4, marginBottom: 20, borderBottom: "1px solid #1e293b", paddingBottom: 4, flexWrap: "wrap" }}>
        {TABS.map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{
            background: activeTab === tab.id ? "#1e293b" : "transparent",
            color: activeTab === tab.id ? "#f1f5f9" : "#64748b",
            border: activeTab === tab.id ? "1px solid #334155" : "1px solid transparent",
            borderRadius: "8px 8px 0 0", padding: "8px 18px", cursor: "pointer", fontSize: 13, fontWeight: 600,
          }}>{tab.label}</button>
        ))}
      </div>

      {/* ── WORKFLOW BUILDER ── */}
      {activeTab === "builder" && (
        <div style={{ display: "grid", gridTemplateColumns: "280px 1fr", gap: 16 }}>

          {/* Step list */}
          <div>
            <div style={{ fontSize: 10, fontWeight: 700, color: "#64748b", marginBottom: 10, letterSpacing: "0.1em" }}>SEQUENCE STEPS</div>
            <div style={{ display: "flex", flexDirection: "column" }}>
              {steps.map((step, i) => {
                const meta = STEP_META[step.type];
                const selected = selectedStep?.id === step.id;
                return (
                  <div key={step.id}>
                    <div
                      onClick={() => setSelectedStep(selected ? null : step)}
                      style={{
                        background: selected ? "#1e293b" : "#141a26",
                        border: `1px solid ${selected ? meta.color : "#334155"}`,
                        borderLeft: `3px solid ${meta.color}`,
                        borderRadius: 8, padding: "9px 12px", cursor: "pointer", marginBottom: 2,
                        display: "flex", gap: 8, alignItems: "center",
                      }}
                    >
                      <span style={{ fontSize: 14 }}>{meta.icon}</span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 11, fontWeight: 600, color: "#f1f5f9", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{step.title}</div>
                        <div style={{ fontSize: 9, color: "#64748b" }}>Day {step.day} · {step.subtitle}</div>
                      </div>
                      <button onClick={e => { e.stopPropagation(); removeStep(step.id); }} style={{ background: "transparent", border: "none", color: "#475569", cursor: "pointer", fontSize: 12, padding: 0 }}>✕</button>
                    </div>
                    {/* Insert between button */}
                    {i < steps.length - 1 && (
                      <div style={{ textAlign: "center", height: 20, position: "relative" }}>
                        <div style={{ position: "absolute", left: "50%", top: 0, bottom: 0, width: 1, background: "#334155" }} />
                        {insertAfter === step.id ? (
                          <div style={{ position: "absolute", left: "50%", transform: "translateX(-50%)", top: 2, background: "#1e293b", border: "1px solid #334155", borderRadius: 6, padding: "2px 0", display: "flex", gap: 2, zIndex: 10 }}>
                            {(["email", "linkedin", "task", "call", "delay"] as StepType[]).map(t => (
                              <button key={t} onClick={() => addStep(t, step.id)} title={STEP_META[t].label} style={{ background: "transparent", border: "none", cursor: "pointer", fontSize: 12, padding: "1px 4px" }}>
                                {STEP_META[t].icon}
                              </button>
                            ))}
                            <button onClick={() => setInsertAfter(null)} style={{ background: "transparent", border: "none", cursor: "pointer", fontSize: 10, color: "#64748b", padding: "1px 4px" }}>✕</button>
                          </div>
                        ) : (
                          <button onClick={() => setInsertAfter(step.id)} style={{ position: "absolute", left: "50%", transform: "translateX(-50%)", top: 3, background: "#1e293b", border: "1px solid #334155", borderRadius: 10, width: 16, height: 16, cursor: "pointer", color: "#64748b", fontSize: 10, display: "flex", alignItems: "center", justifyContent: "center", zIndex: 10 }}>+</button>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Limits */}
            <div style={{ marginTop: 14, background: "#1e293b", border: "1px solid #334155", borderRadius: 8, padding: 12 }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: "#f59e0b", marginBottom: 8 }}>⚠ Account Protection Limits</div>
              <div style={{ marginBottom: 8 }}>
                <div style={{ fontSize: 10, color: "#94a3b8", marginBottom: 4 }}>Max credits/month: {maxCredits.toLocaleString()}</div>
                <input type="range" min={500} max={10000} step={500} value={maxCredits} onChange={e => setMaxCredits(+e.target.value)}
                  style={{ width: "100%", accentColor: "#6366f1" }} />
              </div>
              <div>
                <div style={{ fontSize: 10, color: "#94a3b8", marginBottom: 4 }}>Max people/company: {maxPerCompany}</div>
                <input type="range" min={1} max={20} step={1} value={maxPerCompany} onChange={e => setMaxPerCompany(+e.target.value)}
                  style={{ width: "100%", accentColor: "#f59e0b" }} />
              </div>
              <div style={{ fontSize: 9, color: "#475569", marginTop: 6 }}>Prevents over-touching and protects sender reputation</div>
            </div>
          </div>

          {/* Right panel */}
          <div>
            {selectedStep ? (
              <div style={{ background: "#1e293b", border: `1px solid ${STEP_META[selectedStep.type].color}40`, borderRadius: 10, padding: 16 }}>
                <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 14 }}>
                  <span style={{ fontSize: 20 }}>{STEP_META[selectedStep.type].icon}</span>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: STEP_META[selectedStep.type].color }}>{selectedStep.title}</div>
                    <div style={{ fontSize: 10, color: "#64748b" }}>Day {selectedStep.day} · {STEP_META[selectedStep.type].label}</div>
                  </div>
                </div>
                {selectedStep.type === "email" && (
                  <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    <div style={{ display: "flex", gap: 6 }}>
                      {(["auto", "manual"] as EmailMode[]).map(m => (
                        <div key={m} style={{ background: selectedStep.emailMode === m ? "#6366f120" : "#0f172a", border: `1px solid ${selectedStep.emailMode === m ? "#6366f1" : "#334155"}`, borderRadius: 6, padding: "4px 12px", fontSize: 10, color: selectedStep.emailMode === m ? "#a5b4fc" : "#64748b", cursor: "pointer" }}>
                          {m === "auto" ? "⚡ Auto-send" : "👁 Manual review"}
                        </div>
                      ))}
                    </div>
                    <div style={{ background: "#0f172a", borderRadius: 6, padding: 10 }}>
                      <div style={{ fontSize: 9, color: "#64748b", marginBottom: 4 }}>SUBJECT</div>
                      <div style={{ fontSize: 11, color: "#f1f5f9" }}>Quick question, {"{{firstName}}"}</div>
                    </div>
                    <div style={{ background: "#0f172a", borderRadius: 6, padding: 10, minHeight: 80 }}>
                      <div style={{ fontSize: 9, color: "#64748b", marginBottom: 4 }}>BODY</div>
                      <div style={{ fontSize: 11, color: "#94a3b8", lineHeight: 1.6 }}>Hi {"{{firstName}}"}, I noticed {"{{company}}"} recently… <span style={{ color: "#475569" }}>[personalise]</span></div>
                    </div>
                  </div>
                )}
                {selectedStep.type === "linkedin" && (
                  <div style={{ display: "flex", gap: 6 }}>
                    {(["connect", "message", "view"] as LinkedInAction[]).map(a => (
                      <div key={a} style={{ background: selectedStep.linkedInAction === a ? "#0ea5e920" : "#0f172a", border: `1px solid ${selectedStep.linkedInAction === a ? "#0ea5e9" : "#334155"}`, borderRadius: 6, padding: "5px 12px", fontSize: 10, color: selectedStep.linkedInAction === a ? "#7dd3fc" : "#64748b" }}>
                        {a === "connect" ? "🤝 Connect" : a === "message" ? "💬 Message" : "👀 View profile"}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div>
                <CodeBlock label="Inline Sequence Builder V2 — React Hook Form + Zod (dynamic step schemas)" color="#6366f1" code={
`// Each step type has its own Zod schema.
// useFieldArray manages the dynamic step list.
// Discriminated union ensures correct validation per type.

import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

// ─── Per-step schemas ───────────────────────────────────────────
const emailStepSchema = z.object({
  type:    z.literal("email"),
  subject: z.string().min(1, "Subject required"),
  mode:    z.enum(["auto", "manual"]),
  dayOffset: z.number().min(0),
  body:    z.string().min(10, "Body too short"),
});

const linkedInStepSchema = z.object({
  type:    z.literal("linkedin"),
  action:  z.enum(["connect", "message", "view"]),
  dayOffset: z.number().min(0),
  message: z.string().optional(),   // only when action = "message"
}).refine(
  data => data.action !== "message" || (data.message && data.message.length > 0),
  { message: "Message required for message actions", path: ["message"] }
);

const taskStepSchema = z.object({
  type:       z.literal("task"),
  taskType:   z.enum(["research", "follow_up", "custom"]),
  dueOffset:  z.number().min(0),
  note:       z.string().optional(),
});

// Discriminated union — type-safe validation per step
const stepSchema = z.discriminatedUnion("type", [
  emailStepSchema, linkedInStepSchema, taskStepSchema,
]);

const sequenceSchema = z.object({
  name:      z.string().min(1),
  steps:     z.array(stepSchema).min(1, "Add at least one step"),
  maxCredits: z.number().min(100).max(50000),
  maxPerCompany: z.number().min(1).max(50),
});

// ─── Component ──────────────────────────────────────────────────
function SequenceBuilder() {
  const { register, control, watch, formState: { errors } } =
    useForm<z.infer<typeof sequenceSchema>>({
      resolver: zodResolver(sequenceSchema),
      defaultValues: { steps: [], maxCredits: 3000, maxPerCompany: 5 },
    });

  // Dynamic step list — each step has its own type-specific fields
  const { fields, append, remove, move } = useFieldArray({
    control, name: "steps",
  });

  const addStep = (type: StepType) => {
    append({ type, dayOffset: 0, ...defaultsForType(type) });
  };

  return (
    <form>
      {fields.map((field, index) => (
        // Render different fields based on field.type
        // errors.steps?.[index] is type-narrowed to the correct schema
        <StepRow key={field.id} index={index} type={field.type}
          register={register} errors={errors.steps?.[index]}
          onRemove={() => remove(index)} onMove={(from, to) => move(from, to)} />
      ))}
    </form>
  );
}`} />
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── INSIGHTS ── */}
      {activeTab === "insights" && (
        <div>
          {/* Widget selector */}
          <div style={{ display: "flex", gap: 6, marginBottom: 14 }}>
            {(["enrollment", "tasks", "activity", "signals"] as const).map(w => (
              <button key={w} onClick={() => setInsightWidget(w)} style={{
                background: insightWidget === w ? "#1e293b" : "transparent",
                border: `1px solid ${insightWidget === w ? "#334155" : "transparent"}`,
                borderRadius: 8, padding: "7px 14px", cursor: "pointer",
                color: insightWidget === w ? "#f1f5f9" : "#64748b", fontSize: 12,
              }}>
                {w === "enrollment" ? "📈 Enrollment" : w === "tasks" ? "✅ Tasks" : w === "activity" ? "📡 Activity" : "⚡ Signals"}
              </button>
            ))}
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
            {/* Left: selected widget */}
            <div style={{ background: "#1e293b", border: "1px solid #334155", borderRadius: 10, overflow: "hidden" }}>
              <div style={{ padding: "8px 14px", background: "#0f172a", borderBottom: "1px solid #334155", fontSize: 10, color: "#64748b", fontWeight: 700 }}>
                {insightWidget.toUpperCase()} WIDGET
              </div>
              <div style={{ padding: 14 }}>
                {insightWidget === "enrollment" && (
                  <div>
                    {ENROLLMENT_FUNNEL.map(row => (
                      <div key={row.label} style={{ marginBottom: 10 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, marginBottom: 4 }}>
                          <span style={{ color: "#f1f5f9" }}>{row.label}</span>
                          <span style={{ color: row.color, fontWeight: 700 }}>{row.count.toLocaleString()} ({row.pct}%)</span>
                        </div>
                        <div style={{ height: 6, background: "#0f172a", borderRadius: 3, overflow: "hidden" }}>
                          <div style={{ width: `${row.pct}%`, height: "100%", background: row.color, borderRadius: 3 }} />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                {insightWidget === "tasks" && (
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {TASKS_DATA.map(t => (
                      <div key={t.title} style={{ background: "#0f172a", borderRadius: 8, padding: "8px 10px", display: "flex", gap: 8, alignItems: "center" }}>
                        <div style={{ width: 14, height: 14, border: `2px solid ${t.priority === "high" ? "#ef4444" : t.priority === "medium" ? "#f59e0b" : "#94a3b8"}`, borderRadius: 3, flexShrink: 0 }} />
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: 11, color: "#f1f5f9" }}>{t.title}</div>
                          <div style={{ fontSize: 9, color: "#64748b" }}>Due: {t.due}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                {insightWidget === "activity" && (
                  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    {ACTIVITY_FEED.map((a, i) => (
                      <div key={i} style={{ background: "#0f172a", borderRadius: 8, padding: "7px 10px", display: "flex", gap: 8, borderLeft: `2px solid ${a.color}` }}>
                        <span style={{ fontSize: 14 }}>{a.icon}</span>
                        <div>
                          <div style={{ fontSize: 10, color: "#f1f5f9" }}>{a.event}</div>
                          <div style={{ fontSize: 9, color: "#64748b" }}>{a.person} · {a.time}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                {insightWidget === "signals" && (
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {SIGNALS_DATA.map(s => (
                      <div key={s.signal} style={{ background: "#0f172a", borderRadius: 8, padding: "9px 12px", display: "flex", gap: 8, alignItems: "center" }}>
                        <span style={{ fontSize: 18 }}>{s.icon}</span>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: 10, color: "#f1f5f9" }}>{s.signal}</div>
                          <div style={{ fontSize: 9, color: "#64748b" }}>{s.company}</div>
                        </div>
                        <span style={{ background: s.color + "20", color: s.color, borderRadius: 10, padding: "2px 8px", fontSize: 9, fontWeight: 700 }}>{s.strength}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Right: credit usage + per-step metrics */}
            <div>
              <div style={{ background: "#1e293b", border: "1px solid #334155", borderRadius: 10, padding: 14, marginBottom: 12 }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: "#f1f5f9", marginBottom: 10 }}>CREDIT USAGE BREAKDOWN</div>
                {CREDIT_USAGE.map(c => (
                  <div key={c.label} style={{ marginBottom: 8 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, marginBottom: 3 }}>
                      <span style={{ color: "#94a3b8" }}>{c.label}</span>
                      <span style={{ color: c.color, fontWeight: 700 }}>{c.used} / {c.budget}</span>
                    </div>
                    <div style={{ height: 5, background: "#0f172a", borderRadius: 3, overflow: "hidden" }}>
                      <div style={{ width: `${(c.used / c.budget) * 100}%`, height: "100%", background: c.color, borderRadius: 3 }} />
                    </div>
                  </div>
                ))}
              </div>

              <button onClick={() => setShowPerStep(v => !v)} style={{ background: "#1e293b", border: "1px solid #334155", borderRadius: 8, padding: "7px 14px", color: "#94a3b8", cursor: "pointer", fontSize: 11, marginBottom: 8 }}>
                {showPerStep ? "Hide" : "Show"} per-step email metrics
              </button>
              {showPerStep && (
                <div style={{ background: "#1e293b", border: "1px solid #334155", borderRadius: 10, overflow: "hidden" }}>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr repeat(4,auto)", gap: 0, padding: "6px 10px", borderBottom: "1px solid #334155", fontSize: 9, color: "#64748b", fontWeight: 700 }}>
                    <span>STEP</span><span style={{ textAlign: "right" }}>OPEN</span><span style={{ textAlign: "right", marginLeft: 10 }}>CLICK</span><span style={{ textAlign: "right", marginLeft: 10 }}>REPLY</span><span style={{ textAlign: "right", marginLeft: 10 }}>BOUNCE</span>
                  </div>
                  {EMAIL_STEP_METRICS.map(m => (
                    <div key={m.step} style={{ display: "grid", gridTemplateColumns: "1fr repeat(4,auto)", gap: 0, padding: "8px 10px", borderBottom: "1px solid #0f172a", alignItems: "center" }}>
                      <span style={{ fontSize: 10, color: "#f1f5f9" }}>{m.step}</span>
                      <span style={{ fontSize: 10, color: "#4ade80", textAlign: "right", marginLeft: 10 }}>{m.openRate}</span>
                      <span style={{ fontSize: 10, color: "#a5b4fc", textAlign: "right", marginLeft: 10 }}>{m.clickRate}</span>
                      <span style={{ fontSize: 10, color: "#f59e0b", textAlign: "right", marginLeft: 10 }}>{m.replyRate}</span>
                      <span style={{ fontSize: 10, color: "#ef4444", textAlign: "right", marginLeft: 10 }}>{m.bounceRate}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── GROWTH ── */}
      {activeTab === "growth" && (
        <div>
          {/* Templates */}
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: "#f1f5f9", marginBottom: 10 }}>Starter Templates — one-click workflow creation</div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10 }}>
              {TEMPLATES.map(t => (
                <div key={t.name} style={{ background: "#1e293b", border: "1px solid #334155", borderRadius: 10, padding: 14 }}>
                  <div style={{ fontSize: 22, marginBottom: 8 }}>{t.icon}</div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: "#f1f5f9", marginBottom: 4 }}>{t.name}</div>
                  <div style={{ fontSize: 9, color: "#64748b", marginBottom: 10 }}>{t.steps} steps · {t.days} days · {t.category}</div>
                  <button style={{ background: "#6366f1", border: "none", borderRadius: 6, padding: "6px 14px", color: "#fff", cursor: "pointer", fontSize: 10, fontWeight: 700 }}>
                    Use Template →
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
            {/* Public sharing */}
            <div style={{ background: "#1e293b", border: "1px solid #334155", borderRadius: 10, padding: 14 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: "#f1f5f9", marginBottom: 4 }}>Public Sharing & Cloning</div>
              <div style={{ fontSize: 11, color: "#64748b", marginBottom: 12, lineHeight: 1.6 }}>
                Share workflows publicly so prospects and partners can clone them. Reduces time-to-first-value: new users start with a working workflow, not a blank canvas.
              </div>
              <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
                <button onClick={handleShare} style={{ background: "#4f46e5", border: "none", borderRadius: 8, padding: "8px 14px", color: "#fff", cursor: "pointer", fontSize: 11 }}>
                  🔗 Get share link
                </button>
                <button onClick={handleClone} style={{ background: cloned ? "#4ade8020" : "#1e293b", border: `1px solid ${cloned ? "#4ade80" : "#334155"}`, borderRadius: 8, padding: "8px 14px", color: cloned ? "#4ade80" : "#94a3b8", cursor: "pointer", fontSize: 11 }}>
                  {cloned ? "✓ Cloned!" : "📋 Clone workflow"}
                </button>
              </div>
              {sharedLink && (
                <div style={{ background: "#0f172a", borderRadius: 6, padding: "8px 10px", fontSize: 9, color: "#a5b4fc", fontFamily: "monospace", wordBreak: "break-all" }}>
                  {sharedLink}
                </div>
              )}
            </div>

            {/* AI-SDR / Outbound Copilot */}
            <div style={{ background: "#1e293b", border: "1px solid #a855f730", borderRadius: 10, padding: 14 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: "#a855f7", marginBottom: 4 }}>🤖 AI-SDR / Outbound Copilot</div>
              <div style={{ fontSize: 11, color: "#64748b", marginBottom: 12, lineHeight: 1.6 }}>
                Impression-capped entry point on the sequence surface. After {MAX_IMPRESSIONS} impressions without engagement, auto-skips (does not interrupt the workflow).
              </div>

              {/* Impression bar */}
              <div style={{ marginBottom: 12 }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, marginBottom: 4 }}>
                  <span style={{ color: "#64748b" }}>Impressions shown</span>
                  <span style={{ color: impressions >= MAX_IMPRESSIONS ? "#ef4444" : "#a855f7", fontWeight: 700 }}>{impressions} / {MAX_IMPRESSIONS}</span>
                </div>
                <div style={{ height: 6, background: "#0f172a", borderRadius: 3, overflow: "hidden" }}>
                  <div style={{ width: `${(impressions / MAX_IMPRESSIONS) * 100}%`, height: "100%", background: impressions >= MAX_IMPRESSIONS ? "#ef4444" : "#a855f7", borderRadius: 3, transition: "width 0.3s" }} />
                </div>
                {impressions >= MAX_IMPRESSIONS && (
                  <div style={{ fontSize: 9, color: "#ef4444", marginTop: 4 }}>Auto-skip active — entry point suppressed for this user</div>
                )}
              </div>

              <button
                onClick={showCopilot}
                disabled={impressions >= MAX_IMPRESSIONS}
                style={{
                  background: impressions >= MAX_IMPRESSIONS ? "#0f172a" : "#a855f720",
                  border: `1px solid ${impressions >= MAX_IMPRESSIONS ? "#334155" : "#a855f7"}`,
                  borderRadius: 8, padding: "8px 14px", color: impressions >= MAX_IMPRESSIONS ? "#475569" : "#a855f7",
                  cursor: impressions >= MAX_IMPRESSIONS ? "not-allowed" : "pointer", fontSize: 11,
                }}
              >
                {impressions >= MAX_IMPRESSIONS ? "Entry point suppressed (auto-skip)" : "✨ Try AI-SDR Copilot"}
              </button>

              {copilotOpen && impressions <= MAX_IMPRESSIONS && (
                <div style={{ marginTop: 10, background: "#0f172a", border: "1px solid #a855f7", borderRadius: 8, padding: 12 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: "#a855f7", marginBottom: 6 }}>Outbound Copilot</div>
                  <div style={{ fontSize: 10, color: "#94a3b8", marginBottom: 8 }}>I can help you build a sequence, personalise outreach, or analyse engagement. What do you need?</div>
                  <button onClick={() => setCopilotOpen(false)} style={{ background: "transparent", border: "none", color: "#64748b", cursor: "pointer", fontSize: 10 }}>Dismiss</button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── ENGINEERING ── */}
      {activeTab === "eng" && (
        <div>
          {/* Coverage initiative */}
          <div style={{ background: "#1e293b", border: "1px solid #4ade8030", borderRadius: 10, padding: 14, marginBottom: 16 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: "#4ade80", marginBottom: 8 }}>Unit Test Coverage: 38% → 65% in 3 months</div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10, marginBottom: 12 }}>
              {COVERAGE_MONTHS.map((m, i) => (
                <div
                  key={m.month}
                  onClick={() => setCoverageMonth(i)}
                  style={{ background: "#0f172a", border: `1px solid ${coverageMonth === i ? "#4ade80" : "#334155"}`, borderRadius: 8, padding: 12, cursor: "pointer" }}
                >
                  <div style={{ fontSize: 10, color: "#64748b", marginBottom: 6 }}>{m.month}</div>
                  <div style={{ display: "flex", alignItems: "baseline", gap: 6, marginBottom: 6 }}>
                    <span style={{ fontSize: 20, fontWeight: 800, color: "#4ade80" }}>{m.after}%</span>
                    <span style={{ fontSize: 10, color: "#4ade80" }}>{m.delta}</span>
                  </div>
                  <div style={{ height: 6, background: "#1e293b", borderRadius: 3, overflow: "hidden", marginBottom: 6 }}>
                    <div style={{ width: `${m.after}%`, height: "100%", background: "#4ade80", borderRadius: 3 }} />
                  </div>
                  <div style={{ fontSize: 9, color: "#64748b" }}>{m.focus}</div>
                </div>
              ))}
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div>
              <CodeBlock label="AI-assisted test creation — how complex component tests were accelerated" color="#4ade80" code={
`// CHALLENGE: WorkflowStepForm has 8 step types, each with
// different validation and conditional rendering.
// Writing comprehensive tests manually = 3+ days.
// With AI assistance = 4 hours.

// APPROACH:
// 1. Feed the component source + Zod schema to the AI
// 2. Ask it to generate test cases covering:
//    - Each step type renders correct fields
//    - Zod validation errors display correctly
//    - Conditional fields appear/disappear correctly
//    - Form submit calls handler with correct typed data

// RESULT (AI-generated, human-reviewed):
describe("WorkflowStepForm", () => {
  describe("email step", () => {
    it("shows subject and body fields", () => {
      render(<WorkflowStepForm stepType="email" />);
      expect(screen.getByLabelText("Subject")).toBeInTheDocument();
      expect(screen.getByLabelText("Body")).toBeInTheDocument();
    });

    it("shows mode toggle: auto / manual", () => {
      render(<WorkflowStepForm stepType="email" />);
      expect(screen.getByRole("radio", { name: "Auto-send" })).toBeInTheDocument();
      expect(screen.getByRole("radio", { name: "Manual review" })).toBeInTheDocument();
    });

    it("validates: subject required", async () => {
      const { getByRole } = render(<WorkflowStepForm stepType="email" />);
      await userEvent.click(getByRole("button", { name: /save/i }));
      expect(await screen.findByText("Subject required")).toBeInTheDocument();
    });
  });

  describe("linkedin step", () => {
    it("shows message field only when action = message", async () => {
      render(<WorkflowStepForm stepType="linkedin" />);
      // message field hidden by default (action = "connect")
      expect(screen.queryByLabelText("Message")).not.toBeInTheDocument();
      // switch to "message" action
      await userEvent.click(screen.getByRole("radio", { name: "Message" }));
      expect(screen.getByLabelText("Message")).toBeInTheDocument();
    });
  });
});`} />

              <div style={{ marginTop: 10 }}>
                <CodeBlock label="Coverage strategy — focused on highest-impact untested files" color="#f59e0b" code={
`// COVERAGE INITIATIVE METHODOLOGY:

// 1. Generate coverage report → identify zero-coverage files
//    jest --coverage --coverageReporters=json
//    → 47 files at 0% coverage (utility functions, hooks, validators)

// 2. Prioritise by usage (how many components import this file)
//    High-import utility with 0% coverage = highest risk
//    Sort: uncoveredFiles.sort((a, b) => b.importCount - a.importCount)

// 3. Batch write tests for utility functions (AI-accelerated)
//    Pure functions with clear input/output → AI generates exhaustive cases
//    Focus human review on: edge cases, error paths, type coercions

// 4. Add to CI: coverage gate
//    Jest config:
coverageThreshold: {
  global: {
    branches:   60,  // will raise to 70 next quarter
    functions:  65,
    lines:      65,
    statements: 65,
  },
}
// PR blocked if coverage drops below threshold.
// Engineers cannot skip writing tests without failing CI.`} />
              </div>
            </div>

            {/* CX tickets */}
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: "#f1f5f9", marginBottom: 10 }}>Usability Sprint — 28 CX Tickets Closed</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 14 }}>
                {CX_TICKETS.map(t => (
                  <div key={t.area} style={{ background: "#1e293b", borderLeft: `3px solid ${t.severity === "high" ? "#ef4444" : t.severity === "medium" ? "#f59e0b" : "#94a3b8"}`, borderRadius: "0 8px 8px 0", padding: "7px 10px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div style={{ fontSize: 10, color: "#f1f5f9" }}>{t.area}</div>
                    <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                      <span style={{ fontSize: 9, color: t.severity === "high" ? "#ef4444" : t.severity === "medium" ? "#f59e0b" : "#94a3b8" }}>{t.severity}</span>
                      <span style={{ background: "#0f172a", borderRadius: 10, padding: "1px 7px", fontSize: 9, color: "#64748b" }}>{t.count} tickets</span>
                    </div>
                  </div>
                ))}
              </div>

              <div style={{ background: "#1e293b", border: "1px solid #334155", borderRadius: 10, padding: 14 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: "#f1f5f9", marginBottom: 10 }}>UX Delight Initiatives</div>
                {[
                  { title: "Filter & sort persistence",         detail: "Filters survive navigation via URL state. Returning to the list view restores the exact previous state." },
                  { title: "Modernised tables",                 detail: "Consistent column config, resizable columns, saved column preferences per user, empty states with CTAs." },
                  { title: "Inline edit with optimistic UI",    detail: "Edit fields inline — UI updates immediately, error toast on failure with revert. No more 'save form' round-trips." },
                  { title: "Workflow details surface revamp",   detail: "Tasks, Activity, Enrollment, and Signals as composable widgets. Teams can see their funnel without leaving the page." },
                ].map(item => (
                  <div key={item.title} style={{ borderLeft: "3px solid #6366f1", paddingLeft: 10, marginBottom: 10 }}>
                    <div style={{ fontSize: 10, fontWeight: 700, color: "#a5b4fc", marginBottom: 2 }}>{item.title}</div>
                    <div style={{ fontSize: 10, color: "#64748b" }}>{item.detail}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default SalesWorkflowDemo;
