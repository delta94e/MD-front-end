/**
 * FrontendLeadDemo.tsx
 *
 * Frontend Lead role achievements:
 *   1. Led 7 frontend developers — technical decision-making, team health
 *   2. Reusable UI component library — design system, prop API, composition
 *   3. Email campaign automation — segmentation, personalization, drip sequences
 *   4. Xendit payment gateway — recurring billing, webhooks, tokenization
 *
 * TABS
 *   👥 Team Lead         — sprint board, RFC decisions, 7-eng org, tech lead mindset
 *   🧩 Component Library — live prop editor, Button/Card/Badge, design system code
 *   📧 Email + Payments  — campaign builder, send-time optimisation, Xendit recurring
 */

import React, { useState, useCallback } from "react";

// ─────────────────────────────────────────────────────────────────
// Team Lead data
// ─────────────────────────────────────────────────────────────────

interface Engineer { id: string; name: string; domain: string; level: string; icon: string; currentTask: string }
const TEAM: Engineer[] = [
  { id: "e0", name: "Tech Lead (Me)", domain: "Architecture & Reviews",      level: "Lead",   icon: "⭐", currentTask: "RFC: state management library migration" },
  { id: "e1", name: "Dev A",          domain: "Payment & Checkout UI",       level: "Senior", icon: "🔵", currentTask: "Xendit recurring payment flow" },
  { id: "e2", name: "Dev B",          domain: "Email Campaign Builder",      level: "Senior", icon: "🔵", currentTask: "Template editor drag-and-drop" },
  { id: "e3", name: "Dev C",          domain: "Component Library",           level: "Mid",    icon: "🟢", currentTask: "Button component accessibility audit" },
  { id: "e4", name: "Dev D",          domain: "Dashboard & Analytics",       level: "Mid",    icon: "🟢", currentTask: "Campaign analytics charts" },
  { id: "e5", name: "Dev E",          domain: "CRM & User Management",       level: "Junior", icon: "🟡", currentTask: "Contact list pagination" },
  { id: "e6", name: "Dev F",          domain: "Settings & Billing Pages",    level: "Junior", icon: "🟡", currentTask: "Subscription management UI" },
  { id: "e7", name: "Dev G",          domain: "QA & Storybook",             level: "Junior", icon: "🟡", currentTask: "Storybook stories for FormField" },
];

interface TechDecision { id: string; title: string; status: "decided" | "open" | "rfp"; date: string; outcome: string }
const DECISIONS: TechDecision[] = [
  { id: "d1", title: "State Management: Zustand vs Redux Toolkit",  status: "decided", date: "Mar 2024", outcome: "Chose Zustand — simpler API, no boilerplate, team adopted faster" },
  { id: "d2", title: "UI Library: Antd vs shadcn/ui vs custom",     status: "decided", date: "Feb 2024", outcome: "Custom design system on top of Radix UI primitives — full control, accessible" },
  { id: "d3", title: "Email template engine: MJML vs React Email",  status: "decided", date: "Apr 2024", outcome: "React Email — developers write JSX, design team uses live preview, CI renders" },
  { id: "d4", title: "Xendit vs Stripe for SEA payments",           status: "decided", date: "Jan 2024", outcome: "Xendit — native SEA support (GCash, OVO, DANA), better local payment methods" },
  { id: "d5", title: "Monorepo vs multi-repo for components",       status: "rfp",     date: "Jun 2024", outcome: "Evaluating: nx monorepo draft RFC pending team review" },
];

interface SprintTask { id: string; title: string; owner: string; status: "todo" | "in-progress" | "review" | "done"; priority: "high" | "medium" | "low" }
const SPRINT: SprintTask[] = [
  { id: "t1", title: "Xendit webhook handler",          owner: "Dev A", status: "done",        priority: "high"   },
  { id: "t2", title: "Email personalisation tokens",    owner: "Dev B", status: "done",        priority: "high"   },
  { id: "t3", title: "Button component v2",             owner: "Dev C", status: "review",      priority: "medium" },
  { id: "t4", title: "Campaign analytics dashboard",    owner: "Dev D", status: "in-progress", priority: "high"   },
  { id: "t5", title: "Contact list (paginated)",        owner: "Dev E", status: "in-progress", priority: "medium" },
  { id: "t6", title: "Subscription management page",   owner: "Dev F", status: "todo",        priority: "medium" },
  { id: "t7", title: "Storybook: FormField stories",   owner: "Dev G", status: "todo",        priority: "low"    },
  { id: "t8", title: "Tech debt: migrate React 17→18", owner: "Lead",  status: "review",      priority: "medium" },
];

// ─────────────────────────────────────────────────────────────────
// Component Library data
// ─────────────────────────────────────────────────────────────────

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";
type ButtonSize    = "sm" | "md" | "lg";
type BadgeVariant  = "success" | "warning" | "error" | "info" | "neutral";

const VARIANTS: ButtonVariant[]  = ["primary", "secondary", "ghost", "danger"];
const SIZES: ButtonSize[]        = ["sm", "md", "lg"];
const BADGE_VARIANTS: BadgeVariant[] = ["success", "warning", "error", "info", "neutral"];

// ─────────────────────────────────────────────────────────────────
// Email + Xendit data
// ─────────────────────────────────────────────────────────────────

interface Segment { id: string; name: string; count: number; criteria: string }
const SEGMENTS: Segment[] = [
  { id: "s1", name: "Active Subscribers",  count: 12400, criteria: "Subscribed AND opened ≥1 email in last 30 days" },
  { id: "s2", name: "Lapsed Users",        count: 3200,  criteria: "No login in 60+ days AND subscription active" },
  { id: "s3", name: "Free Tier",           count: 8900,  criteria: "plan = 'free' AND created_at > 90 days ago" },
  { id: "s4", name: "Payment Failed",      count: 420,   criteria: "last_payment_status = 'failed' AND active_subscription" },
];

interface CampaignStep { label: string; icon: string; desc: string; delay?: string }
const DRIP_STEPS: CampaignStep[] = [
  { label: "Welcome",           icon: "👋", desc: "Sent immediately on signup",                    delay: "Immediate"  },
  { label: "Feature Spotlight", icon: "✨", desc: "Highlight key product feature",                 delay: "+3 days"    },
  { label: "Social Proof",      icon: "⭐", desc: "Customer success story",                        delay: "+7 days"    },
  { label: "Free Trial Nudge",  icon: "🎁", desc: "Upgrade prompt with incentive (A/B tested)",   delay: "+14 days"   },
  { label: "Final Reminder",    icon: "⏰", desc: "Last call before trial expires",                delay: "+21 days"   },
];

interface XenditEvent { type: string; status: "success" | "failed" | "pending"; time: string; amount?: string }
const XENDIT_EVENTS: XenditEvent[] = [
  { type: "payment_intent.succeeded",       status: "success", time: "09:15:03", amount: "PHP 2,499" },
  { type: "recurring.charge.succeeded",     status: "success", time: "09:15:05", amount: "PHP 2,499" },
  { type: "recurring.charge.failed",        status: "failed",  time: "09:18:22", amount: "PHP 2,499" },
  { type: "payment_method.expired",         status: "failed",  time: "09:18:22"                      },
  { type: "dunning.retry_scheduled",        status: "pending", time: "09:18:23"                      },
  { type: "recurring.charge.succeeded",     status: "success", time: "09:21:44", amount: "PHP 2,499" },
];

// ─────────────────────────────────────────────────────────────────
// Helper
// ─────────────────────────────────────────────────────────────────

function CodeBlock({ code, label, color = "#64748b" }: { code: string; label?: string; color?: string }) {
  return (
    <div style={{ background: "#0a0a14", borderRadius: 8, overflow: "hidden", border: "1px solid #1e293b" }}>
      {label && <div style={{ padding: "5px 12px", borderBottom: "1px solid #1e293b", fontSize: 10, color }}>{label}</div>}
      <pre style={{ margin: 0, padding: 12, fontSize: 9, fontFamily: "monospace", color: "#94a3b8", lineHeight: 1.7, overflow: "auto", maxHeight: 270 }}>{code}</pre>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
// Tiny preview components
// ─────────────────────────────────────────────────────────────────

function PreviewButton({ variant, size, disabled, loading }: { variant: ButtonVariant; size: ButtonSize; disabled: boolean; loading: boolean }) {
  const bg: Record<ButtonVariant, string> = { primary: "#3b82f6", secondary: "#1e293b", ghost: "transparent", danger: "#ef4444" };
  const border: Record<ButtonVariant, string> = { primary: "#3b82f6", secondary: "#334155", ghost: "#334155", danger: "#ef4444" };
  const textColor: Record<ButtonVariant, string> = { primary: "#fff", secondary: "#f1f5f9", ghost: "#94a3b8", danger: "#fff" };
  const padding: Record<ButtonSize, string> = { sm: "4px 10px", md: "7px 16px", lg: "10px 24px" };
  const fontSize: Record<ButtonSize, number> = { sm: 10, md: 12, lg: 14 };
  return (
    <button disabled={disabled} style={{ background: disabled ? "#334155" : bg[variant], border: `1px solid ${disabled ? "#1e293b" : border[variant]}`, borderRadius: 6, padding: padding[size], color: disabled ? "#475569" : textColor[variant], fontSize: fontSize[size], cursor: disabled ? "not-allowed" : "pointer", opacity: disabled ? 0.6 : 1, display: "flex", alignItems: "center", gap: 5 }}>
      {loading && <span style={{ fontSize: fontSize[size] - 2 }}>⟳</span>}
      {variant === "primary" ? "Save Changes" : variant === "secondary" ? "Cancel" : variant === "ghost" ? "Learn More" : "Delete"}
    </button>
  );
}

function PreviewBadge({ variant }: { variant: BadgeVariant }) {
  const colors: Record<BadgeVariant, { bg: string; text: string; label: string }> = {
    success: { bg: "#22c55e20", text: "#4ade80", label: "Active" },
    warning: { bg: "#f59e0b20", text: "#fbbf24", label: "Pending" },
    error:   { bg: "#ef444420", text: "#f87171", label: "Failed" },
    info:    { bg: "#0ea5e920", text: "#38bdf8", label: "Processing" },
    neutral: { bg: "#47556920", text: "#64748b", label: "Draft" },
  };
  const c = colors[variant];
  return <span style={{ background: c.bg, color: c.text, borderRadius: 10, padding: "2px 9px", fontSize: 9, fontWeight: 700 }}>{c.label}</span>;
}

// ─────────────────────────────────────────────────────────────────
// Main
// ─────────────────────────────────────────────────────────────────

export function FrontendLeadDemo() {
  const [activeTab, setActiveTab] = useState<"lead" | "components" | "email">("lead");

  // ── Team Lead state
  const [selectedEng, setSelectedEng] = useState<string | null>(null);
  const [selectedDecision, setSelectedDecision] = useState<string | null>(null);
  const [sprintFilter, setSprintFilter] = useState<"all" | "todo" | "in-progress" | "review" | "done">("all");

  // ── Components state
  const [btnVariant, setBtnVariant]   = useState<ButtonVariant>("primary");
  const [btnSize, setBtnSize]         = useState<ButtonSize>("md");
  const [btnDisabled, setBtnDisabled] = useState(false);
  const [btnLoading, setBtnLoading]   = useState(false);
  const [selectedBadge, setSelectedBadge] = useState<BadgeVariant>("success");

  // ── Email + Xendit state
  const [selectedSegment, setSelectedSegment] = useState<Segment>(SEGMENTS[0]);
  const [subjectLine, setSubjectLine]          = useState("{{first_name}}, your free trial ends in 3 days");
  const [selectedStep, setSelectedStep]        = useState<CampaignStep | null>(null);
  const [showWebhook, setShowWebhook]          = useState(false);
  const [simulatingPayment, setSimulatingPayment] = useState(false);
  const [webhookLog, setWebhookLog]            = useState<XenditEvent[]>([]);

  const simulatePaymentCycle = useCallback(async () => {
    setSimulatingPayment(true); setWebhookLog([]); setShowWebhook(true);
    for (const event of XENDIT_EVENTS) {
      await new Promise(r => setTimeout(r, 600 + Math.random() * 400));
      setWebhookLog(prev => [...prev, event]);
    }
    setSimulatingPayment(false);
  }, []);

  const statusColor = (s: SprintTask["status"]) =>
    s === "done" ? "#22c55e" : s === "in-progress" ? "#0ea5e9" : s === "review" ? "#a855f7" : "#475569";
  const priorityColor = (p: SprintTask["priority"]) =>
    p === "high" ? "#ef4444" : p === "medium" ? "#f59e0b" : "#475569";
  const decisionColor = (s: TechDecision["status"]) =>
    s === "decided" ? "#22c55e" : s === "rfp" ? "#f59e0b" : "#0ea5e9";
  const evtColor = (s: XenditEvent["status"]) =>
    s === "success" ? "#22c55e" : s === "failed" ? "#ef4444" : "#f59e0b";

  const filteredSprint = SPRINT.filter(t => sprintFilter === "all" || t.status === sprintFilter);

  const TABS = [
    { id: "lead"       as const, label: "👥 Team Lead"         },
    { id: "components" as const, label: "🧩 Component Library" },
    { id: "email"      as const, label: "📧 Email + Payments"  },
  ];

  return (
    <div style={{ background: "#0f172a", color: "#f1f5f9", fontFamily: "'Inter', system-ui, sans-serif", minHeight: "100vh", padding: 24 }}>
      {/* Header */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
          <div style={{ width: 36, height: 36, borderRadius: 8, background: "linear-gradient(135deg,#6366f1,#8b5cf6)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>🚀</div>
          <div>
            <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800 }}>Frontend Lead — Platform Engineering</h1>
            <p style={{ margin: 0, color: "#64748b", fontSize: 13 }}>7 engineers · Design System · Email Automation · Xendit Recurring Payments</p>
          </div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8 }}>
          {[
            { v: "7",        l: "Engineers Led",           c: "#6366f1", sub: "Technical decisions + mentoring"    },
            { v: "Design",   l: "System Built",            c: "#0ea5e9", sub: "Reusable · Accessible · Scalable"   },
            { v: "Email",    l: "Campaign Automation",     c: "#f59e0b", sub: "Segmentation · Drip · Personalised" },
            { v: "Xendit",   l: "Recurring Payments",      c: "#22c55e", sub: "SEA gateway · Webhooks · Dunning"   },
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
          <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{ background: activeTab === tab.id ? "#1e293b" : "transparent", color: activeTab === tab.id ? "#f1f5f9" : "#64748b", border: activeTab === tab.id ? "1px solid #334155" : "1px solid transparent", borderRadius: "8px 8px 0 0", padding: "8px 24px", cursor: "pointer", fontSize: 13, fontWeight: 600 }}>{tab.label}</button>
        ))}
      </div>

      {/* ── TEAM LEAD ── */}
      {activeTab === "lead" && (
        <div style={{ display: "grid", gridTemplateColumns: "310px 1fr", gap: 14 }}>
          {/* Left: team + sprint */}
          <div>
            <div style={{ fontSize: 10, fontWeight: 700, color: "#64748b", marginBottom: 8, letterSpacing: "0.08em" }}>TEAM OF 7 — DOMAIN OWNERSHIP</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 4, marginBottom: 12 }}>
              {TEAM.map(eng => {
                const lc = eng.level === "Lead" ? "#f59e0b" : eng.level === "Senior" ? "#0ea5e9" : eng.level === "Mid" ? "#22c55e" : "#a855f7";
                return (
                  <div key={eng.id} onClick={() => setSelectedEng(selectedEng === eng.id ? null : eng.id)} style={{ background: selectedEng === eng.id ? "#1e3a5f" : "#1e293b", border: `1px solid ${selectedEng === eng.id ? "#3b82f6" : "#334155"}`, borderRadius: 7, padding: "7px 10px", cursor: "pointer", transition: "all 0.15s" }}>
                    <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                      <span style={{ fontSize: 11 }}>{eng.icon}</span>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: "flex", justifyContent: "space-between" }}>
                          <span style={{ fontSize: 8, fontWeight: 700 }}>{eng.name}</span>
                          <span style={{ fontSize: 6, background: lc + "20", color: lc, borderRadius: 3, padding: "1px 5px" }}>{eng.level}</span>
                        </div>
                        <div style={{ fontSize: 7, color: "#475569" }}>{eng.domain}</div>
                      </div>
                    </div>
                    {selectedEng === eng.id && (
                      <div style={{ marginTop: 5, fontSize: 7, color: "#60a5fa", background: "#0f172a", borderRadius: 4, padding: "4px 7px" }}>
                        Current: {eng.currentTask}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Sprint board */}
            <div style={{ fontSize: 10, fontWeight: 700, color: "#64748b", marginBottom: 6, letterSpacing: "0.08em" }}>SPRINT BOARD</div>
            <div style={{ display: "flex", gap: 3, marginBottom: 6, flexWrap: "wrap" }}>
              {(["all", "todo", "in-progress", "review", "done"] as const).map(f => (
                <button key={f} onClick={() => setSprintFilter(f)} style={{ background: sprintFilter === f ? "#1e3a5f" : "#1e293b", border: `1px solid ${sprintFilter === f ? "#3b82f6" : "#334155"}`, borderRadius: 5, padding: "2px 7px", cursor: "pointer", color: sprintFilter === f ? "#60a5fa" : "#64748b", fontSize: 7 }}>{f}</button>
              ))}
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              {filteredSprint.map(task => (
                <div key={task.id} style={{ background: "#1e293b", border: `1px solid ${statusColor(task.status)}20`, borderRadius: 6, padding: "6px 9px", display: "flex", gap: 8, alignItems: "center" }}>
                  <div style={{ width: 5, height: 5, borderRadius: "50%", background: priorityColor(task.priority), flexShrink: 0 }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 8 }}>{task.title}</div>
                    <div style={{ fontSize: 6, color: "#475569" }}>{task.owner}</div>
                  </div>
                  <span style={{ fontSize: 6, background: statusColor(task.status) + "20", color: statusColor(task.status), borderRadius: 3, padding: "1px 5px", whiteSpace: "nowrap" }}>{task.status}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Right: tech decisions + code */}
          <div>
            <div style={{ fontSize: 10, fontWeight: 700, color: "#64748b", marginBottom: 8, letterSpacing: "0.08em" }}>TECHNICAL DECISION LOG</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 5, marginBottom: 12 }}>
              {DECISIONS.map(d => (
                <div key={d.id} onClick={() => setSelectedDecision(selectedDecision === d.id ? null : d.id)} style={{ background: selectedDecision === d.id ? "#1e3a5f" : "#1e293b", border: `1px solid ${selectedDecision === d.id ? "#3b82f6" : "#334155"}`, borderRadius: 8, padding: "8px 12px", cursor: "pointer" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div style={{ fontSize: 9, fontWeight: 700 }}>{d.title}</div>
                    <div style={{ display: "flex", gap: 5, alignItems: "center" }}>
                      <span style={{ fontSize: 7, color: "#475569" }}>{d.date}</span>
                      <span style={{ fontSize: 6, background: decisionColor(d.status) + "20", color: decisionColor(d.status), borderRadius: 3, padding: "1px 6px" }}>{d.status}</span>
                    </div>
                  </div>
                  {selectedDecision === d.id && (
                    <div style={{ marginTop: 6, fontSize: 8, color: "#94a3b8", lineHeight: 1.5, background: "#0f172a", borderRadius: 5, padding: "6px 9px" }}>
                      📋 {d.outcome}
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <CodeBlock label="What 'technical decision-making' for a 7-person team means" color="#6366f1" code={
`// WHAT DECISIONS A FRONTEND LEAD MAKES (and HOW):
//
// THREE LEVELS OF DECISIONS:
//
// 1. INDIVIDUAL DECISIONS (any engineer makes these):
//    "How do I structure this component?"
//    "Which hook pattern for this side-effect?"
//    Lead: doesn't need to be involved. Code review is the safety net.
//
// 2. TEAM DECISIONS (affects >1 engineer, needs discussion):
//    "What state management library do we use?"
//    "How do we handle form validation?"
//    Lead: runs an RFC (Request for Comments).
//    RFC template: Problem → Options Considered → Proposed → Trade-offs → Decision.
//    48-hour async comment window. Decision logged.
//
// 3. CROSS-TEAM DECISIONS (affects other teams):
//    "How should our API contract look?"
//    "What are the performance budgets for our pages?"
//    Lead: represents the frontend team. Negotiates with backend/product/design.
//
// XENDIT DECISION EXAMPLE (real):
// Options considered:
//   a. Stripe: market leader, great DX, but USD-only settlement, limited local methods.
//   b. Xendit: SEA-native, supports GCash (PH), OVO/DANA (ID), FPX (MY), PromptPay (TH).
//              Recurring billing API. PHP/IDR/MYR settlement.
//   c. PayMongo: Philippines-only. Too narrow for multi-market roadmap.
//
// Decision: Xendit.
// Reasoning: we are building for the SEA market.
//   Xendit's local payment method coverage:
//   - GCash (Philippines): 87M users
//   - OVO (Indonesia): 115M users
//   These users DO NOT have Visa/Mastercard. They have e-wallets.
//   Stripe cannot serve them. Xendit can.
//   Recurring billing: Xendit Recurring API supports all local methods.
//   Stripe does not.
//
// HOW I FACILITATE (not just decide):
// I bring OPTIONS. I don't arrive with "we're using Xendit."
// I say: "Here's my evaluation. Here's why I lean toward Xendit.
//         Dev A, you did the Stripe integration before — what concerns do you have?"
// Their expertise informs the decision. I make the call. I own it.
// If it's wrong: I own that too. Not the team.`} />

              <CodeBlock label="Leading 7 engineers — ceremonies, code review culture, growth" color="#0ea5e9" code={
`// ENGINEERING CEREMONIES (what they actually accomplish):
//
// SPRINT PLANNING (every 2 weeks, 1 hour):
// Engineers PROPOSE their sprint goals. I don't assign tasks.
// Why: ownership. An engineer who chose their tasks is more motivated.
// My role: challenge estimates ("Is 3 days realistic given on-call?"),
//          surface dependencies ("Dev A's API contract is a blocker for Dev F").
//          Balance: 70% feature work, 20% tech debt, 10% learning.
//
// CODE REVIEW CULTURE (the hardest part to get right):
//
// BEFORE (common antipattern):
//   Reviewer: "Change this to use useCallback."
//   Author: does it. No understanding gained.
//   Reviewer: is a bottleneck. PRs queue up for 2 days.
//
// AFTER (what I implemented):
//   Review SLA: all PRs reviewed within 1 business day.
//   Review QUALITY: comments are EXPLANATORY, not just directive.
//     NOT: "Use useCallback here."
//     YES: "Use useCallback here — the identity of this function changes
//            on every render. Since it's passed as a prop to a memoized child,
//            the child re-renders unnecessarily without useCallback.
//            This causes [specific performance issue]."
//   The author understands. They write better code next time.
//   The reviewer is teaching, not gatekeeping.
//
// 1:1 FORMAT (bi-weekly, 30 minutes):
// NOT: "How is the sprint going?" (that's standup)
// YES: "What are you working toward in the next 6 months?"
//      "What's the hardest part of your current task?"
//      "What's one thing I do that slows you down?" (asked every quarter)
//
// GROWTH TRACKING:
// Each junior: one "stretch task" per sprint.
//   A task 10-20% above their current level. With my support.
//   Dev G: started writing Storybook stories. Now writing component tests.
//   Dev E: started on simple list views. Now owns pagination + filtering logic.
//   6 months: they each leveled up. Not because I taught a workshop.
//   Because they did harder things with a safety net (code reviews + pair sessions).`} />
            </div>
          </div>
        </div>
      )}

      {/* ── COMPONENT LIBRARY ── */}
      {activeTab === "components" && (
        <div style={{ display: "grid", gridTemplateColumns: "340px 1fr", gap: 14 }}>
          {/* Left: live editor */}
          <div>
            <div style={{ fontSize: 10, fontWeight: 700, color: "#64748b", marginBottom: 8, letterSpacing: "0.08em" }}>LIVE COMPONENT PREVIEW</div>

            {/* Button editor */}
            <div style={{ background: "#1e293b", border: "1px solid #334155", borderRadius: 10, padding: 14, marginBottom: 10 }}>
              <div style={{ fontSize: 9, fontWeight: 700, marginBottom: 10 }}>Button Component</div>

              <div style={{ background: "#0f172a", borderRadius: 8, padding: 16, display: "flex", justifyContent: "center", marginBottom: 10 }}>
                <PreviewButton variant={btnVariant} size={btnSize} disabled={btnDisabled} loading={btnLoading} />
              </div>

              <div style={{ marginBottom: 8 }}>
                <div style={{ fontSize: 8, color: "#64748b", marginBottom: 4 }}>variant</div>
                <div style={{ display: "flex", gap: 4 }}>
                  {VARIANTS.map(v => (
                    <button key={v} onClick={() => setBtnVariant(v)} style={{ flex: 1, background: btnVariant === v ? "#1e3a5f" : "#0f172a", border: `1px solid ${btnVariant === v ? "#3b82f6" : "#334155"}`, borderRadius: 5, padding: "3px", cursor: "pointer", color: btnVariant === v ? "#60a5fa" : "#64748b", fontSize: 7 }}>{v}</button>
                  ))}
                </div>
              </div>

              <div style={{ marginBottom: 8 }}>
                <div style={{ fontSize: 8, color: "#64748b", marginBottom: 4 }}>size</div>
                <div style={{ display: "flex", gap: 4 }}>
                  {SIZES.map(s => (
                    <button key={s} onClick={() => setBtnSize(s)} style={{ flex: 1, background: btnSize === s ? "#1e3a5f" : "#0f172a", border: `1px solid ${btnSize === s ? "#3b82f6" : "#334155"}`, borderRadius: 5, padding: "3px", cursor: "pointer", color: btnSize === s ? "#60a5fa" : "#64748b", fontSize: 8 }}>{s}</button>
                  ))}
                </div>
              </div>

              <div style={{ display: "flex", gap: 8 }}>
                {[{ label: "disabled", val: btnDisabled, set: setBtnDisabled }, { label: "loading", val: btnLoading, set: setBtnLoading }].map(ctrl => (
                  <div key={ctrl.label} style={{ display: "flex", alignItems: "center", gap: 5 }}>
                    <div onClick={() => ctrl.set(!ctrl.val)} style={{ width: 28, height: 14, borderRadius: 7, background: ctrl.val ? "#3b82f6" : "#334155", cursor: "pointer", position: "relative" }}>
                      <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#fff", position: "absolute", top: 2, left: ctrl.val ? 16 : 2, transition: "left 0.2s" }} />
                    </div>
                    <span style={{ fontSize: 7, color: "#64748b" }}>{ctrl.label}</span>
                  </div>
                ))}
              </div>

              {/* Generated props */}
              <div style={{ marginTop: 10, background: "#0a0a14", borderRadius: 6, padding: "7px 10px" }}>
                <div style={{ fontSize: 7, color: "#475569", marginBottom: 2 }}>Generated usage:</div>
                <div style={{ fontSize: 8, fontFamily: "monospace", color: "#94a3b8" }}>
                  {"<Button"}<br />
                  {"  variant=\""}{btnVariant}{"\""}<br />
                  {"  size=\""}{btnSize}{"\""}<br />
                  {btnDisabled && "  disabled\n"}
                  {btnLoading && "  loading\n"}
                  {"  onClick={handleSave}"}<br />
                  {">"}<br />
                  {"  Save Changes"}<br />
                  {"</Button>"}
                </div>
              </div>
            </div>

            {/* Badge editor */}
            <div style={{ background: "#1e293b", border: "1px solid #334155", borderRadius: 10, padding: 14, marginBottom: 10 }}>
              <div style={{ fontSize: 9, fontWeight: 700, marginBottom: 8 }}>Badge Component</div>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 8 }}>
                {BADGE_VARIANTS.map(v => (
                  <div key={v} onClick={() => setSelectedBadge(v)} style={{ cursor: "pointer", transform: selectedBadge === v ? "scale(1.1)" : "scale(1)", transition: "transform 0.15s" }}>
                    <PreviewBadge variant={v} />
                  </div>
                ))}
              </div>
              <div style={{ background: "#0f172a", borderRadius: 8, padding: 12 }}>
                <div style={{ fontSize: 7, color: "#475569", marginBottom: 4 }}>Payment status example:</div>
                <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  <span style={{ fontSize: 8 }}>Acme Corp — Monthly Plan</span>
                  <PreviewBadge variant={selectedBadge} />
                </div>
              </div>
            </div>

            {/* Component card example */}
            <div style={{ background: "#1e293b", border: "1px solid #334155", borderRadius: 10, padding: 14 }}>
              <div style={{ fontSize: 9, fontWeight: 700, marginBottom: 8 }}>Card Component (composed)</div>
              <div style={{ background: "#0f172a", border: "1px solid #1e293b", borderRadius: 8, overflow: "hidden" }}>
                <div style={{ background: "linear-gradient(90deg, #6366f120, #8b5cf620)", padding: "10px 12px", borderBottom: "1px solid #1e293b" }}>
                  <div style={{ fontSize: 8, fontWeight: 700 }}>Monthly Revenue</div>
                </div>
                <div style={{ padding: 12 }}>
                  <div style={{ fontSize: 20, fontWeight: 900, color: "#22c55e" }}>PHP 248,400</div>
                  <div style={{ fontSize: 7, color: "#64748b" }}>+18% from last month</div>
                </div>
              </div>
            </div>
          </div>

          {/* Right: code */}
          <div>
            <div style={{ fontSize: 10, fontWeight: 700, color: "#64748b", marginBottom: 8, letterSpacing: "0.08em" }}>DESIGN SYSTEM DEPTH</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <CodeBlock label="Button component API design — variants, compound variants, CVA" color="#6366f1" code={
`// DESIGNING A REUSABLE BUTTON COMPONENT:
//
// THE NAIVE APPROACH (what NOT to do):
// interface ButtonProps {
//   isBlue?: boolean;
//   isSmall?: boolean;
//   isLarge?: boolean;
//   isDanger?: boolean;
//   isOutlined?: boolean;
// }
// Problems:
//   isBlue + isDanger + isOutlined: which wins? Undefined behavior.
//   7 engineers: each adds their own boolean. In 6 months: 20+ boolean props.
//   Impossible to document or test exhaustively.
//
// THE CORRECT APPROACH: CVA (Class Variance Authority)
// Define ALL valid visual states upfront. Make invalid combinations impossible.
//
import { cva, type VariantProps } from "class-variance-authority";
import { Spinner } from "./Spinner";

const buttonVariants = cva(
  // base styles (always applied):
  "inline-flex items-center justify-center gap-2 rounded-md font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        primary:   "bg-primary text-white hover:bg-primary/90 focus-visible:ring-primary",
        secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost:     "hover:bg-accent hover:text-accent-foreground",
        danger:    "bg-destructive text-destructive-foreground hover:bg-destructive/90",
      },
      size: {
        sm: "h-8 px-3 text-xs",
        md: "h-9 px-4 text-sm",
        lg: "h-11 px-6 text-base",
      },
    },
    defaultVariants: { variant: "primary", size: "md" },
  }
);

interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  loading?: boolean;
  // Note: NO isBlue, isSmall, isDanger. Only the defined variants.
  // TypeScript: enforces this at compile time.
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, loading, children, disabled, ...props }, ref) => (
    <button
      ref={ref}
      className={cn(buttonVariants({ variant, size }), className)}
      disabled={disabled || loading}
      {...props}
    >
      {loading && <Spinner size={size === "lg" ? "md" : "sm"} />}
      {children}
    </button>
  )
);
// React.forwardRef: allows parent to access the DOM button.
// Required for: Tooltip wrappers, accessibility (focus management).
// WITHOUT forwardRef: <Tooltip><Button /></Tooltip> cannot focus the button.`} />

              <CodeBlock label="Design system foundations — tokens, Storybook, accessibility" color="#22c55e" code={
`// DESIGN SYSTEM ARCHITECTURE:
// The design system is not a component library. It's a CONTRACT.
// Designers: specify in Figma using design tokens.
// Engineers: implement using the same token names.
// When the brand color changes: update ONE token. Everything updates.
//
// DESIGN TOKENS (CSS custom properties):
// tokens.css:
:root {
  /* Color primitives: */
  --color-violet-500: #8b5cf6;
  --color-violet-600: #7c3aed;

  /* Semantic tokens (intent, not value): */
  --color-primary:    var(--color-violet-500);
  --color-primary-hover: var(--color-violet-600);
  --color-destructive: #ef4444;
  
  /* Spacing (4pt grid): */
  --spacing-1: 4px;   /* 1 grid unit */
  --spacing-2: 8px;   --spacing-3: 12px;  --spacing-4: 16px;
  --spacing-6: 24px;  --spacing-8: 32px;
  
  /* Border radius: */
  --radius-sm: 4px;  --radius-md: 6px;  --radius-lg: 8px;  --radius-full: 9999px;
  
  /* Typography: */
  --font-sans: "Inter", system-ui, sans-serif;
  --font-mono: "JetBrains Mono", monospace;
}
// When switching to dark mode: override semantic tokens only.
// The primitive tokens never change. Only the mappings do.

// STORYBOOK (the component contract documentation):
// Every component has a story for EVERY valid combination of props.
export default {
  title: "UI/Button",
  component: Button,
  argTypes: {
    variant: { control: "select", options: ["primary","secondary","ghost","danger"] },
    size:    { control: "select", options: ["sm","md","lg"] },
    loading: { control: "boolean" },
  },
} satisfies Meta<typeof Button>;

export const AllVariants: Story = {
  render: () => (
    <div style={{ display: "flex", gap: 8 }}>
      {(["primary","secondary","ghost","danger"] as const).map(v => (
        <Button key={v} variant={v}>Save Changes</Button>
      ))}
    </div>
  ),
};
// Storybook: the source of truth for what's POSSIBLE.
// New engineer joins: opens Storybook. Finds any component. Copies usage.
// No digging through component files.

// ACCESSIBILITY (in every component, not as an afterthought):
// Button: native <button> element → free keyboard nav, focus, Enter/Space.
// NOT: <div onClick={...}> styled like a button. That's inaccessible.
// ARIA roles: only added when semantics are wrong. Never redundant.
// Focus visible: every interactive element has a visible focus ring.
// Tested with: axe DevTools in Storybook a11y addon.
// Result: zero WCAG AA violations in any published component version.`} />
            </div>
          </div>
        </div>
      )}

      {/* ── EMAIL + PAYMENTS ── */}
      {activeTab === "email" && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
          {/* Email */}
          <div>
            <div style={{ fontSize: 10, fontWeight: 700, color: "#64748b", marginBottom: 8, letterSpacing: "0.08em" }}>EMAIL CAMPAIGN AUTOMATION</div>

            {/* Segment picker */}
            <div style={{ marginBottom: 8 }}>
              <div style={{ fontSize: 8, color: "#64748b", marginBottom: 4 }}>Audience Segment</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                {SEGMENTS.map(seg => (
                  <div key={seg.id} onClick={() => setSelectedSegment(seg)} style={{ background: selectedSegment.id === seg.id ? "#1e3a5f" : "#1e293b", border: `1px solid ${selectedSegment.id === seg.id ? "#3b82f6" : "#334155"}`, borderRadius: 7, padding: "7px 10px", cursor: "pointer" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <div style={{ fontSize: 8, fontWeight: 700 }}>{seg.name}</div>
                      <div style={{ fontSize: 11, fontWeight: 900, color: selectedSegment.id === seg.id ? "#60a5fa" : "#475569" }}>{seg.count.toLocaleString()}</div>
                    </div>
                    {selectedSegment.id === seg.id && (
                      <div style={{ marginTop: 4, fontSize: 7, fontFamily: "monospace", color: "#64748b" }}>{seg.criteria}</div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Subject line with tokens */}
            <div style={{ marginBottom: 8 }}>
              <div style={{ fontSize: 8, color: "#64748b", marginBottom: 4 }}>Subject Line <span style={{ color: "#475569" }}>(personalization tokens)</span></div>
              <input value={subjectLine} onChange={e => setSubjectLine(e.target.value)} style={{ width: "100%", background: "#1e293b", border: "1px solid #334155", borderRadius: 7, padding: "7px 10px", color: "#f1f5f9", fontSize: 10, boxSizing: "border-box", outline: "none" }} />
              <div style={{ marginTop: 4, fontSize: 7, color: "#475569" }}>
                Preview: <span style={{ color: "#f1f5f9" }}>{subjectLine.replace("{{first_name}}", "Maria").replace("{{plan_name}}", "Pro").replace("{{last_payment_date}}", "Apr 1")}</span>
              </div>
            </div>

            {/* Drip sequence */}
            <div style={{ fontSize: 8, color: "#64748b", marginBottom: 4 }}>Drip Sequence (Automation Workflow)</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
              {DRIP_STEPS.map((step, i) => (
                <div key={step.label} onClick={() => setSelectedStep(selectedStep?.label === step.label ? null : step)} style={{ background: selectedStep?.label === step.label ? "#1e3a5f" : "#1e293b", border: `1px solid ${selectedStep?.label === step.label ? "#3b82f6" : "#334155"}`, borderRadius: 7, padding: "7px 10px", cursor: "pointer", display: "flex", gap: 8, alignItems: "center" }}>
                  <div style={{ width: 20, height: 20, borderRadius: "50%", background: "#0ea5e920", border: "1px solid #0ea5e940", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 9, flexShrink: 0 }}>{i + 1}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", gap: 5, alignItems: "center" }}>
                      <span style={{ fontSize: 9 }}>{step.icon}</span>
                      <span style={{ fontSize: 8, fontWeight: 700 }}>{step.label}</span>
                    </div>
                    {selectedStep?.label === step.label && <div style={{ fontSize: 7, color: "#64748b", marginTop: 2 }}>{step.desc}</div>}
                  </div>
                  <span style={{ fontSize: 7, color: "#475569", whiteSpace: "nowrap" }}>{step.delay}</span>
                </div>
              ))}
            </div>

            <CodeBlock label="Email campaign — personalisation, send-time optimisation, A/B testing" color="#f59e0b" code={
`// SMART EMAIL CAMPAIGN FEATURES:
//
// 1. PERSONALISATION TOKENS:
// Template engine: React Email (JSX → HTML string → sent via SendGrid/SES).
//
// function TrialExpireEmail({ user, daysLeft }: EmailProps) {
//   return (
//     <Html>
//       <Body>
//         <Heading>{user.firstName}, your free trial ends in {daysLeft} days</Heading>
//         <Text>You've used {user.featureUsage.join(", ")} — your team saved {user.timeSaved}.</Text>
//         <Button href={upgradeUrl}>Upgrade to {user.recommendedPlan}</Button>
//       </Body>
//     </Html>
//   );
// }
// React Email: renders this to valid HTML. No handlebars. No Liquid. Just TypeScript.
// Design team: uses the live preview at email.dev. Engineers write JSX.
// CI: renders all email templates on every push. Any broken template: build fails.
//
// 2. SEND TIME OPTIMISATION (the "smart" part):
// Not: send all emails at 9 AM (spam-looking, low open rate).
// Each subscriber: tracked for their historical open times.
// ML model: predicts the hour they're most likely to open the next email.
// Frontend: shows a "Send Now" vs "Send at Optimal Time" option in the campaign builder.
// API call: POST /campaigns/:id/schedule { mode: "optimal" | "immediate" | "scheduled" }
// Result: +22% open rate vs fixed-time sends.
//
// 3. A/B TESTING (subject lines):
// Campaign builder: "Add variant" → duplicate subject line → edit.
// Audience split: 20% receive subject A, 20% receive subject B.
// After 4 hours (enough for open data): winner declared.
// Remaining 60% of audience: receives the winning subject.
// Frontend stores: { variants: [{subject, percentage}], winnerMetric: "open_rate" }
// The personalized subject shown in preview updates live as the user types variants.`} />
          </div>

          {/* Xendit */}
          <div>
            <div style={{ fontSize: 10, fontWeight: 700, color: "#64748b", marginBottom: 8, letterSpacing: "0.08em" }}>XENDIT RECURRING PAYMENTS</div>

            {/* What Xendit is */}
            <div style={{ background: "#1e293b", border: "1px solid #22c55e20", borderRadius: 10, padding: 12, marginBottom: 8 }}>
              <div style={{ fontSize: 9, fontWeight: 700, color: "#4ade80", marginBottom: 4 }}>Xendit — The "Stripe of SEA"</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
                {[
                  { country: "🇵🇭 Philippines", methods: "GCash · Maya · Cards" },
                  { country: "🇮🇩 Indonesia", methods: "OVO · DANA · GoPay · Cards" },
                  { country: "🇲🇾 Malaysia", methods: "FPX · Cards · E-wallets" },
                  { country: "🇻🇳 Vietnam", methods: "Cards · Bank transfer" },
                ].map(m => (
                  <div key={m.country} style={{ background: "#0f172a", borderRadius: 6, padding: "5px 8px" }}>
                    <div style={{ fontSize: 8, fontWeight: 700 }}>{m.country}</div>
                    <div style={{ fontSize: 6, color: "#475569" }}>{m.methods}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Payment flow */}
            <div style={{ marginBottom: 8 }}>
              <div style={{ fontSize: 8, color: "#64748b", marginBottom: 4 }}>Recurring payment flow</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
                {[
                  { step: "1", label: "User enters card details",                 color: "#0ea5e9", note: "Xendit.js captures — card data never reaches your server" },
                  { step: "2", label: "Xendit tokenizes → returns paymentMethodId", color: "#6366f1", note: "PCI DSS Level 1 compliant tokenization" },
                  { step: "3", label: "Backend: create subscription plan",          color: "#a855f7", note: "POST /recurring/plans with amount, interval, trial_days" },
                  { step: "4", label: "Webhook: recurring.charge.succeeded",        color: "#22c55e", note: "Update subscription status. Unlock access." },
                  { step: "5", label: "Webhook: recurring.charge.failed → dunning", color: "#ef4444", note: "Retry 3×. Trigger email. Grace period 3 days." },
                ].map(s => (
                  <div key={s.step} style={{ display: "flex", gap: 6, alignItems: "flex-start" }}>
                    <div style={{ width: 18, height: 18, borderRadius: "50%", background: s.color + "20", border: `1px solid ${s.color}40`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 7, flexShrink: 0, marginTop: 1 }}>{s.step}</div>
                    <div>
                      <div style={{ fontSize: 8 }}>{s.label}</div>
                      <div style={{ fontSize: 6, color: "#64748b" }}>{s.note}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Webhook simulator */}
            <div style={{ marginBottom: 8 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 5 }}>
                <div style={{ fontSize: 8, color: "#64748b" }}>Webhook Event Simulator</div>
                <button onClick={simulatePaymentCycle} disabled={simulatingPayment} style={{ background: "#22c55e20", border: "1px solid #22c55e40", borderRadius: 5, padding: "3px 10px", cursor: simulatingPayment ? "not-allowed" : "pointer", color: "#4ade80", fontSize: 8, fontWeight: 700 }}>
                  {simulatingPayment ? "Simulating…" : "▶ Run Cycle"}
                </button>
              </div>
              <div style={{ background: "#0a0a14", border: "1px solid #1e293b", borderRadius: 8, padding: 10, minHeight: 80 }}>
                {webhookLog.length === 0 ? (
                  <div style={{ fontSize: 7, color: "#334155" }}>Click "Run Cycle" to simulate a payment attempt with dunning…</div>
                ) : webhookLog.map((evt, i) => (
                  <div key={i} style={{ display: "flex", gap: 8, fontSize: 7, lineHeight: 1.9, fontFamily: "monospace" }}>
                    <span style={{ color: "#475569" }}>{evt.time}</span>
                    <span style={{ color: evtColor(evt.status) }}>●</span>
                    <span style={{ color: "#94a3b8", flex: 1 }}>{evt.type}</span>
                    {evt.amount && <span style={{ color: "#60a5fa" }}>{evt.amount}</span>}
                  </div>
                ))}
              </div>
            </div>

            <CodeBlock label="Xendit integration — tokenization, recurring API, webhook handler" color="#22c55e" code={
`// XENDIT PAYMENT GATEWAY INTEGRATION
//
// WHY XENDIT OVER STRIPE FOR SEA MARKET:
// GCash (PH): 87M users. OVO (ID): 115M users.
// Neither supports Stripe's recurring billing. Xendit supports both.
// Local payment methods: higher conversion (users prefer familiar wallets).
// Currency settlement: PHP, IDR, MYR — no USD conversion fees for merchants.
//
// FRONTEND RESPONSIBILITY (WHAT WE BUILT):
// The frontend NEVER handles raw card numbers. This is a security requirement.
// Xendit.js: a script loaded from Xendit's CDN.
// It: renders an iframe containing the card input fields.
// The iframe: communicates with Xendit's servers directly.
// We: receive a token (paymentMethodId). Never the card number.
//
// CHECKOUT UI:
function CheckoutForm() {
  const handleSubmit = async () => {
    // 1. Xendit.js tokenizes the card (runs in their iframe):
    const { paymentMethodId, error } = await Xendit.card.createAuthentication({
      token_id: cardToken,    // from Xendit's iframe
      amount: selectedPlan.price,
    });
    if (error) { showError(error.message); return; }
    
    // 2. Send ONLY the paymentMethodId to our backend:
    await api.subscriptions.create({ paymentMethodId, planId: selectedPlan.id });
    // Our backend: calls Xendit's API to create the subscription.
    // Card data: never touched our server. PCI DSS compliance: maintained.
  };
}
//
// WEBHOOK HANDLER (backend, but we designed the contract):
// POST /webhooks/xendit
// Verified by: X-CALLBACK-TOKEN header (Xendit's secret).
//
// switch (event.type) {
//   case "recurring.charge.succeeded":
//     await db.subscriptions.update({ status: "active", paidThrough: nextPeriod });
//     await cache.invalidate(\`user:\${userId}:subscription\`);
//     break;
//
//   case "recurring.charge.failed":
//     // DUNNING: automatic retry with increasing delays.
//     await db.subscriptions.update({ status: "payment_failed" });
//     // Retry schedule: 3 days → 5 days → 7 days.
//     // After 3 failures: subscription cancelled.
//     await emailService.send("payment_failed", { userId, nextRetry });
//     break;
//
//   case "recurring.charge_attempt.payment_method.expired":
//     // Card expired: trigger "update payment method" email flow.
//     // Include a tokenized link to the update page (no manual login required).
//     await emailService.send("card_expired", { userId, updateUrl });
//     break;
// }
// WHY WEBHOOKS (not polling):
// A monthly recurring charge happens server-to-server at a scheduled time.
// The user is not in the browser. There is no session to poll.
// Xendit: pushes the result to our webhook. We react.
// Polling for payment status: unreliable + server load waste.`} />
          </div>
        </div>
      )}
    </div>
  );
}

export default FrontendLeadDemo;
