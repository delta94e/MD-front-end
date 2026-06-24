/**
 * QuoraDesignSystemDemo.tsx
 *
 * Frontend Engineer / Frontend Group Lead · Quora (2017–2020)
 * Design System Migration · React+JSS · RTL Support · Team Lead · Mentorship
 *
 * TABS
 *   🎨 Design System   — Python+SASS → React+JSS, component library, token architecture
 *   🌍 RTL Support     — Arabic/Hebrew: logical CSS, bidi text, icon mirroring, text editor
 *   👥 Team Lead       — Component request lifecycle, versioning, breaking changes, 3-4 eng team
 *   🎓 Mentorship      — Office hours model, tech talks, junior engineer growth
 */

import React, { useState, useEffect, useRef } from "react";

// ─────────────────────────────────────────────────────────────────
// Design tokens — Quora red + dark
// ─────────────────────────────────────────────────────────────────
const Q = {
  bg:         "#080608",
  surface:    "#130f13",
  surface2:   "#1a141a",
  surface3:   "#231b23",
  border:     "#2e1e2e",
  red:        "#B92B27",
  redLight:   "#e03c38",
  redDark:    "#8a1f1c",
  coral:      "#ff6b6b",
  teal:       "#00b4d8",
  green:      "#2eb872",
  blue:       "#4299e1",
  purple:     "#9f7aea",
  yellow:     "#f6d860",
  orange:     "#ed8936",
  python:     "#3572A5",
  arabic:     "#c9a84c",   // warm gold for Arabic demo
  text:       "#9e8a9e",
  textBright: "#f5eff5",
  textMuted:  "#3d2a3d",
  mono:       "'JetBrains Mono', monospace",
};

// ─────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────

function Code({ code, label, color = Q.red }: { code: string; label?: string; color?: string }) {
  return (
    <div style={{ background: "#030103", border: `1px solid ${Q.border}`, borderRadius: 6, overflow: "hidden" }}>
      {label && <div style={{ padding: "4px 12px", borderBottom: `1px solid ${Q.border}`, fontSize: 9, color, fontFamily: Q.mono }}>{label}</div>}
      <pre style={{ margin: 0, padding: 12, fontSize: 8.5, fontFamily: Q.mono, color: "#7a5a7a", lineHeight: 1.7, overflow: "auto", maxHeight: 400, whiteSpace: "pre-wrap" }}>{code}</pre>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
// RTL Quora mock feed
// ─────────────────────────────────────────────────────────────────

function QuoraFeedMock({ dir }: { dir: "ltr" | "rtl" }) {
  const isRTL = dir === "rtl";

  const question = isRTL
    ? "ما هو أفضل طريقة لتعلم البرمجة؟"
    : "What is the best way to learn programming?";
  const answer = isRTL
    ? "في رأيي، أفضل طريقة هي البدء بمشروع صغير تحبه. عندما تكون مدفوعاً بشغف، تتعلم بشكل أسرع بكثير."
    : "In my opinion, the best way is to start with a small project you love. When you're driven by passion, you learn much faster.";
  const author = isRTL ? "محمد حسن" : "Alex Chen";
  const upvotes = "2.4k";

  return (
    <div dir={dir} style={{ background: Q.surface2, border: `1px solid ${Q.border}`, borderRadius: 10, padding: 12, fontSize: 12 }}>
      {/* Question */}
      <div style={{ fontSize: 11, fontWeight: 700, color: Q.blue, marginBottom: 8, lineHeight: 1.5 }}>
        {question}
      </div>

      {/* Answer */}
      <div style={{ background: Q.surface3, borderRadius: 7, padding: 10, marginBottom: 8 }}>
        {/* Author row */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6, flexDirection: isRTL ? "row-reverse" : "row" }}>
          <div style={{ width: 28, height: 28, borderRadius: "50%", background: `linear-gradient(135deg, ${Q.red}, ${Q.purple})`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, color: "#fff", fontWeight: 700 }}>
            {author[0]}
          </div>
          <div>
            <div style={{ fontSize: 9, fontWeight: 700, color: Q.textBright, textAlign: isRTL ? "right" : "left" }}>{author}</div>
            <div style={{ fontSize: 7.5, color: Q.text, textAlign: isRTL ? "right" : "left" }}>{isRTL ? "مطوّر برمجيات · ٥ سنوات خبرة" : "Software Developer · 5 years experience"}</div>
          </div>
        </div>

        {/* Answer text */}
        <div style={{ fontSize: 9.5, color: Q.text, lineHeight: 1.7, textAlign: isRTL ? "right" : "left" }}>
          {answer}
          {isRTL && <span style={{ color: Q.textMuted }}> &lrm;(JavaScript 2024)</span>}
        </div>
      </div>

      {/* Actions row */}
      <div style={{ display: "flex", gap: 8, justifyContent: isRTL ? "flex-end" : "flex-start", alignItems: "center" }}>
        <button style={{ display: "flex", alignItems: "center", gap: 4, background: "transparent", border: `1px solid ${Q.border}`, borderRadius: 15, padding: "3px 10px", cursor: "pointer", color: Q.green, fontSize: 8 }}>
          {/* Arrow icon: mirrors in RTL */}
          <span style={{ display: "inline-block", transform: isRTL ? "scaleX(-1)" : "none" }}>👍</span>
          {upvotes}
        </button>
        <button style={{ background: "transparent", border: `1px solid ${Q.border}`, borderRadius: 15, padding: "3px 10px", cursor: "pointer", color: Q.text, fontSize: 8 }}>
          {isRTL ? "تعليق" : "Comment"}
        </button>
        <button style={{ background: "transparent", border: `1px solid ${Q.border}`, borderRadius: 15, padding: "3px 10px", cursor: "pointer", color: Q.text, fontSize: 8 }}>
          {isRTL ? "مشاركة" : "Share"}
        </button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
// Token visualiser
// ─────────────────────────────────────────────────────────────────

function TokenRow({ name, value, type }: { name: string; value: string; type: "color" | "spacing" | "font" }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "4px 0", borderBottom: `1px solid ${Q.border}20` }}>
      {type === "color" && <div style={{ width: 20, height: 20, borderRadius: 3, background: value, flexShrink: 0, border: `1px solid ${Q.border}` }} />}
      {type === "spacing" && <div style={{ width: parseInt(value) * 2, height: 8, background: `${Q.red}60`, borderRadius: 2, flexShrink: 0 }} />}
      {type === "font" && <div style={{ fontSize: parseInt(value) / 2, color: Q.red, flexShrink: 0, minWidth: 20 }}>Aa</div>}
      <div style={{ fontSize: 8, fontFamily: Q.mono, color: Q.text }}>{name}</div>
      <div style={{ fontSize: 8, fontFamily: Q.mono, color: Q.textMuted, marginLeft: "auto" }}>{value}</div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
// Main component
// ─────────────────────────────────────────────────────────────────

export function QuoraDesignSystemDemo() {
  const [tab, setTab] = useState<"design" | "rtl" | "lead" | "mentor">("design");

  // Design tab
  const [migView, setMigView] = useState<"before" | "after">("before");
  const [selectedComp, setSelectedComp] = useState("Button");
  const [tokenCategory, setTokenCategory] = useState<"color" | "spacing" | "font">("color");

  // RTL tab
  const [dir, setDir] = useState<"ltr" | "rtl">("ltr");
  const [rtlStep, setRtlStep]           = useState(-1);
  const [bidiExample, setBidiExample]   = useState(0);
  const [iconMirror, setIconMirror]     = useState(false);
  const [editorRTL, setEditorRTL]       = useState(false);
  const [editorText, setEditorText]     = useState("Type your answer here...");

  // Lead tab
  const [reqStep, setReqStep]           = useState(-1);
  const [semverStep, setSemverStep]     = useState(-1);
  const [breakingOpen, setBreakingOpen] = useState<number | null>(null);

  // Mentor tab
  const [modelView, setModelView]       = useState<"before" | "after">("before");
  const [talkExpanded, setTalkExpanded] = useState<number | null>(null);

  // Typing effect for editor
  const [isTyping, setIsTyping] = useState(false);

  const TABS = [
    { id: "design"  as const, label: "🎨 Design System" },
    { id: "rtl"     as const, label: "🌍 RTL Support"   },
    { id: "lead"    as const, label: "👥 Team Lead"      },
    { id: "mentor"  as const, label: "🎓 Mentorship"     },
  ];

  const TOKENS: Record<string, { name: string; value: string; type: "color" | "spacing" | "font" }[]> = {
    color: [
      { name: "color.primary",         value: "#B92B27",  type: "color" },
      { name: "color.primary.light",   value: "#e03c38",  type: "color" },
      { name: "color.text.primary",    value: "#282829",  type: "color" },
      { name: "color.text.secondary",  value: "#636466",  type: "color" },
      { name: "color.background",      value: "#ffffff",  type: "color" },
      { name: "color.surface",         value: "#f7f7f7",  type: "color" },
      { name: "color.border",          value: "#e9e9e9",  type: "color" },
      { name: "color.link",            value: "#2e69ff",  type: "color" },
    ],
    spacing: [
      { name: "spacing.xs",  value: "4",  type: "spacing" },
      { name: "spacing.sm",  value: "8",  type: "spacing" },
      { name: "spacing.md",  value: "16", type: "spacing" },
      { name: "spacing.lg",  value: "24", type: "spacing" },
      { name: "spacing.xl",  value: "32", type: "spacing" },
      { name: "spacing.2xl", value: "48", type: "spacing" },
    ],
    font: [
      { name: "fontSize.xs",   value: "12", type: "font" },
      { name: "fontSize.sm",   value: "14", type: "font" },
      { name: "fontSize.base", value: "16", type: "font" },
      { name: "fontSize.lg",   value: "18", type: "font" },
      { name: "fontSize.xl",   value: "20", type: "font" },
      { name: "fontSize.2xl",  value: "24", type: "font" },
      { name: "fontSize.3xl",  value: "32", type: "font" },
    ],
  };

  const COMPONENTS = ["Button", "Avatar", "Card", "Badge", "Input", "Tooltip"];

  const COMP_DEMOS: Record<string, React.ReactNode> = {
    Button: (
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
        {[
          { label: "Primary",    bg: Q.red,       color: "#fff",  border: Q.red     },
          { label: "Secondary",  bg: "transparent",color: Q.red,  border: Q.red     },
          { label: "Ghost",      bg: "transparent",color: Q.text, border: Q.border  },
          { label: "Danger",     bg: Q.redDark,   color: "#fff",  border: Q.redDark },
        ].map(v => (
          <button key={v.label} style={{ background: v.bg, color: v.color, border: `1px solid ${v.border}`, borderRadius: 4, padding: "7px 16px", cursor: "pointer", fontSize: 10, fontWeight: 600 }}>{v.label}</button>
        ))}
      </div>
    ),
    Avatar: (
      <div style={{ display: "flex", gap: 10, alignItems: "flex-end" }}>
        {[32, 40, 48, 56].map(s => (
          <div key={s} style={{ width: s, height: s, borderRadius: "50%", background: `linear-gradient(135deg, ${Q.red}, ${Q.purple})`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: s / 2.8, color: "#fff", fontWeight: 700 }}>A</div>
        ))}
      </div>
    ),
    Card: (
      <div style={{ background: Q.surface2, border: `1px solid ${Q.border}`, borderRadius: 8, padding: 12, maxWidth: 240 }}>
        <div style={{ fontSize: 10, fontWeight: 700, color: Q.textBright, marginBottom: 5 }}>Why does JavaScript have `typeof null === "object"`?</div>
        <div style={{ fontSize: 9, color: Q.text }}>A historical bug from 1995 that was never fixed for backward compatibility...</div>
        <div style={{ marginTop: 8, display: "flex", gap: 6 }}>
          <span style={{ fontSize: 8, color: Q.text }}>👍 1.2k</span>
          <span style={{ fontSize: 8, color: Q.text }}>💬 43</span>
        </div>
      </div>
    ),
    Badge: (
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
        {[
          { label: "JavaScript", color: Q.yellow },
          { label: "React",      color: Q.blue   },
          { label: "Python",     color: Q.python },
          { label: "Trending",   color: Q.red    },
        ].map(b => (
          <span key={b.label} style={{ fontSize: 9, background: `${b.color}20`, color: b.color, borderRadius: 12, padding: "2px 10px", border: `1px solid ${b.color}40` }}>{b.label}</span>
        ))}
      </div>
    ),
    Input: (
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        <input placeholder="Search Quora..." style={{ background: Q.surface2, border: `1px solid ${Q.border}`, borderRadius: 4, padding: "7px 12px", color: Q.textBright, fontSize: 10, outline: "none", width: "100%" }} />
        <input placeholder="Error state" style={{ background: Q.surface2, border: `2px solid ${Q.red}`, borderRadius: 4, padding: "7px 12px", color: Q.textBright, fontSize: 10, outline: "none", width: "100%" }} />
      </div>
    ),
    Tooltip: (
      <div style={{ position: "relative", display: "inline-block" }}>
        <button style={{ background: Q.surface2, border: `1px solid ${Q.border}`, borderRadius: 4, padding: "6px 12px", color: Q.text, fontSize: 10, cursor: "default" }}>Hover for tooltip</button>
        <div style={{ position: "absolute", top: -36, left: "50%", transform: "translateX(-50%)", background: "#1a1a1a", color: "#fff", fontSize: 8, padding: "4px 8px", borderRadius: 4, whiteSpace: "nowrap" }}>
          This is a tooltip
          <div style={{ position: "absolute", top: "100%", left: "50%", transform: "translateX(-50%)", borderLeft: "4px solid transparent", borderRight: "4px solid transparent", borderTop: "4px solid #1a1a1a" }} />
        </div>
      </div>
    ),
  };

  const RTL_STEPS = [
    { icon: "📐", label: "Logical CSS properties (not physical)",       detail: "Replace margin-left/right with margin-inline-start/end. Replace padding-left with padding-inline-start. In RTL: start = right. No per-language overrides needed." },
    { icon: "🔤", label: "dir attribute + unicode-bidi",                detail: "<html dir='rtl'> flips the entire layout. For inline content: unicode-bidi: isolate prevents Arabic text from leaking into surrounding LTR text." },
    { icon: "🔁", label: "Directional icon mirroring",                  detail: "Icons with implied direction (arrows, chevrons, play buttons): transform: scaleX(-1) in RTL. Non-directional (heart, star, gear): don't mirror. CSS: [dir=rtl] .icon-directional { transform: scaleX(-1) }" },
    { icon: "✍️", label: "Text editor: dir=auto + bidi",                detail: "Quora's answer editor: contenteditable with dir='auto'. Browser: detects RTL input automatically. Cursor behavior: correct for Arabic (goes left on right-arrow key). Mixed text handled by Unicode bidi algorithm." },
    { icon: "🔢", label: "Number/date formatting: Intl APIs",           detail: "new Intl.NumberFormat('ar').format(1234567) → '١٬٢٣٤٬٥٦٧'. new Intl.DateTimeFormat('ar-EG').format(new Date()) → Arabic calendar. Built into browsers — no third-party library needed." },
    { icon: "🖋️", label: "Arabic typography: font stack + line-height", detail: "Arabic requires separate fonts (Noto Naskh Arabic, IBM Plex Arabic). Line-height: 1.8-2.0 (vs 1.4 for Latin). font-family: 'IBM Plex Arabic', 'Segoe UI', sans-serif — Arabic chars fall through to Arabic font." },
  ];

  const BIDI_EXAMPLES = [
    { label: "Pure Arabic",    text: "ما هو أفضل إطار عمل JavaScript في 2024؟",                dir: "rtl" as const },
    { label: "Mixed: Arabic + English URL", text: "اقرأ المزيد على quora.com/questions/javascript",  dir: "rtl" as const },
    { label: "Hebrew + numbers", text: "פייסבוק קיבל 3.7 מיליארד משתמשים חודשיים",              dir: "rtl" as const },
    { label: "LTR with Arabic brand name", text: "I use مَتجر for all my purchases",              dir: "ltr" as const },
  ];

  const REQ_STEPS = [
    { icon: "📝", label: "Product team files component request",       detail: "Structured template: use case, consumer team, Figma mock, accessibility requirements, timeline. Rejected: ad hoc Slack requests. Required: written proposal." },
    { icon: "🔍", label: "Component library team reviews",             detail: "As lead: assess if the request is: (a) new component, (b) variant of existing, (c) already exists. 40% of requests: already exist, just undiscovered. Discovery problem, not build problem." },
    { icon: "📐", label: "Design review + API design",                 detail: "Work with design partner: pin down the API surface. Props: named logically, not visually (startIcon not leftIcon). Variants: defined upfront. States: default, hover, focus, disabled, loading." },
    { icon: "🏗️", label: "Build + accessibility review",              detail: "Build the component. a11y: keyboard nav, ARIA attributes, focus ring, screen reader testing (VoiceOver + NVDA). Accessibility: non-negotiable. Every component: meets WCAG AA." },
    { icon: "📚", label: "Documentation + Storybook stories",          detail: "Storybook: stories for all variants. Code examples in MDX. Do/Don't usage guidelines with visual examples. Figma link. Changelog entry." },
    { icon: "🚀", label: "Release + team enablement",                  detail: "Semantic version bump (patch/minor/major). Changelog. Release notes posted in #design-system Slack. Office hours: open for questions from consuming teams for 2 weeks post-release." },
  ];

  const BREAKING_CHANGES = [
    {
      component: "Button",
      change: "`leftIcon` prop renamed to `startIcon`",
      why: "Physical direction prop (leftIcon) breaks in RTL. Logical prop (startIcon) is direction-neutral.",
      migration: "Codemod: `npx quora-ds-codemod button-left-icon`. Auto-migrates 95% of usages. Changelog includes manual migration guide for the remaining 5%.",
    },
    {
      component: "Modal",
      change: "Remove `centered` prop; use `placement='center'`",
      why: "Consolidating placement API. `centered` was boolean; `placement` supports 'center', 'top', 'bottom-sheet'. Unifying with Sheet component.",
      migration: "Deprecation: 3 months warning. automated ESLint rule: `quora/no-deprecated-modal-props`. v3.0.0: removed. Migration guide + Slack office hours session.",
    },
  ];

  const TALKS = [
    { title: "CSS Logical Properties: Writing RTL-Ready CSS from Day One",     audience: "All frontend engineers",  impact: "Adopted by 4 product teams within 2 months. 'CSS Logical Properties' added to code review checklist." },
    { title: "Accessible Components: What VoiceOver Actually Says",            audience: "Engineers + Designers",    impact: "3 designers changed Figma mocks post-talk. 2 P0 a11y bugs caught at design stage vs post-launch." },
    { title: "React JSS: From SASS to CSS-in-JS Without Losing Your Mind",     audience: "Frontend engineers",       impact: "Migration guide downloads: 89. Migration rate accelerated 2× after talk." },
    { title: "Component API Design: Props that Don't Age Badly",               audience: "Senior engineers",          impact: "3 internal RFCs cited the talk. `startIcon` pattern adopted across new components immediately." },
    { title: "Unicode and the Web: Bidi, RTL, and Things You Don't Know You Don't Know", audience: "All engineers", impact: "3 engineers outside the component team volunteered for RTL testing after the talk." },
  ];

  const MENTEES = [
    { name: "Junior engineer A", growth: "L3 → L4 in 18 months", how: "Weekly 1:1 + PR reviews + office hours. First owner of Tooltip component." },
    { name: "Junior engineer B", growth: "Intern → FTE offer",    how: "Pair programming on RTL support. Wrote the LogicalCSS utility independently." },
    { name: "Designer C",        growth: "Joined as IC designer", how: "Office hours: learned enough JSS to contribute small fixes directly. Reduced handoff latency." },
    { name: "Junior engineer D", growth: "L3 → led badge team",  how: "Ran first tech talk (prompted by mentorship). Led Badge + Topic chip component." },
  ];

  return (
    <div style={{ background: Q.bg, color: Q.text, fontFamily: "'Inter', system-ui, sans-serif", minHeight: "100vh", padding: 24 }}>

      {/* Header */}
      <div style={{ marginBottom: 18 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
          <div style={{ width: 42, height: 42, borderRadius: 10, background: `linear-gradient(135deg, ${Q.red}, ${Q.purple})`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22 }}>Q</div>
          <div>
            <h1 style={{ margin: 0, fontSize: 20, fontWeight: 900, color: Q.textBright, letterSpacing: "-0.02em" }}>Quora — Frontend Group Lead (2017–2020)</h1>
            <p style={{ margin: 0, fontSize: 11, color: Q.textMuted }}>Design System · Python+SASS→React+JSS · RTL (Arabic/Hebrew) · Component Library Lead · Office Hours</p>
          </div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8 }}>
          {[
            { v: "JSS",     l: "Python+SASS → React+JSS",  c: Q.red,     sub: "Full design system migration · token architecture · component library" },
            { v: "RTL",     l: "Arabic + Hebrew support",   c: Q.arabic,  sub: "Logical CSS · bidi text · dir=auto editor · icon mirroring · Intl APIs" },
            { v: "3–4 Eng", l: "Component library team",   c: Q.purple,  sub: "Request lifecycle · semantic versioning · breaking change governance" },
            { v: "Office ⏰",l: "Drop-in office hours",      c: Q.green,   sub: "5-day response → same-day · tech talks · 4 mentees grew to IC/L4" },
          ].map(m => (
            <div key={m.l} style={{ background: Q.surface, border: `1px solid ${Q.border}`, borderLeft: `3px solid ${m.c}`, borderRadius: 8, padding: "8px 12px" }}>
              <div style={{ fontSize: 13, fontWeight: 900, color: m.c }}>{m.v}</div>
              <div style={{ fontSize: 8, fontWeight: 700, color: Q.textBright }}>{m.l}</div>
              <div style={{ fontSize: 7, color: Q.textMuted, marginTop: 2 }}>{m.sub}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Tab bar */}
      <div style={{ display: "flex", gap: 4, marginBottom: 18, borderBottom: `1px solid ${Q.border}`, paddingBottom: 4 }}>
        {TABS.map(tb => (
          <button key={tb.id} onClick={() => setTab(tb.id)} style={{ background: tab === tb.id ? Q.surface2 : "transparent", color: tab === tb.id ? Q.textBright : Q.textMuted, border: tab === tb.id ? `1px solid ${Q.border}` : "1px solid transparent", borderRadius: "8px 8px 0 0", padding: "8px 20px", cursor: "pointer", fontSize: 11, fontWeight: 600 }}>{tb.label}</button>
        ))}
      </div>

      {/* ── DESIGN SYSTEM ── */}
      {tab === "design" && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
          <div>
            <div style={{ fontSize: 10, fontWeight: 700, color: Q.textMuted, marginBottom: 8, letterSpacing: "0.08em" }}>QUORA DESIGN SYSTEM — PYTHON+SASS → REACT+JSS</div>

            {/* Before / After toggle */}
            <div style={{ display: "flex", gap: 4, marginBottom: 10 }}>
              <button onClick={() => setMigView("before")} style={{ flex: 1, fontSize: 9, background: migView === "before" ? `${Q.python}20` : "transparent", color: migView === "before" ? "#6a9ac0" : Q.textMuted, border: `1px solid ${migView === "before" ? Q.python : Q.border}`, borderRadius: 5, padding: "5px 0", cursor: "pointer" }}>🐍 Python + SASS (before)</button>
              <button onClick={() => setMigView("after")} style={{ flex: 1, fontSize: 9, background: migView === "after" ? `${Q.red}20` : "transparent", color: migView === "after" ? Q.red : Q.textMuted, border: `1px solid ${migView === "after" ? Q.red : Q.border}`, borderRadius: 5, padding: "5px 0", cursor: "pointer" }}>⚛️ React + JSS (after)</button>
            </div>

            {migView === "before" ? (
              <div style={{ background: Q.surface, border: `1px solid ${Q.border}`, borderRadius: 10, padding: 12, marginBottom: 10 }}>
                <div style={{ fontSize: 8, fontWeight: 700, color: "#6a9ac0", marginBottom: 6 }}>Quora design system — Python template era</div>
                <pre style={{ margin: 0, fontSize: 7.5, fontFamily: Q.mono, color: "#5a6e7a", lineHeight: 1.7, background: "#010203", padding: 10, borderRadius: 5, whiteSpace: "pre-wrap" }}>
{`{# Jinja2 template #}
{% macro q_button(type="primary", size="md",
                  disabled=False) %}
<button class="q-btn q-btn--{{ type }}
               q-btn--{{ size }}
               {% if disabled %}q-btn--disabled{% endif %}">
  {{ caller() }}
</button>
{% endmacro %}

{% call q_button(type="primary") %}
  Ask Question
{% endcall %}

/* _button.scss */
$primary-color: #B92B27;
.q-btn { padding: 8px 16px; border-radius: 4px; }
.q-btn--primary {
  background: $primary-color;
  color: white;
  /* RTL: needed separate override */
  [dir=rtl] & { text-align: right; }
}
.q-btn--disabled { opacity: 0.5; cursor: not-allowed; }`}
                </pre>
                <div style={{ marginTop: 6, padding: "4px 8px", background: `${Q.red}10`, borderRadius: 4, fontSize: 7.5, color: Q.red }}>
                  No type safety · server-side only · SASS variables duplicate design tokens · RTL requires manual overrides · no hot reload
                </div>
              </div>
            ) : (
              <div style={{ background: Q.surface, border: `1px solid ${Q.border}`, borderRadius: 10, padding: 12, marginBottom: 10 }}>
                <div style={{ fontSize: 8, fontWeight: 700, color: Q.red, marginBottom: 6 }}>React + JSS — type-safe, themeable, RTL-ready</div>
                <pre style={{ margin: 0, fontSize: 7.5, fontFamily: Q.mono, color: "#7a5a6a", lineHeight: 1.7, background: "#030103", padding: 10, borderRadius: 5, whiteSpace: "pre-wrap" }}>
{`// Button.tsx
import { createUseStyles } from 'react-jss';
import type { Theme } from '../theme';

type ButtonProps = {
  variant?: 'primary' | 'secondary' | 'ghost';
  size?:    'sm' | 'md' | 'lg';
  startIcon?: React.ReactNode; // logical: not leftIcon
  disabled?: boolean;
  onClick?: () => void;
  children: React.ReactNode;
};

const useStyles = createUseStyles((theme: Theme) => ({
  root: {
    padding: [theme.spacing.sm, theme.spacing.md],
    borderRadius: theme.borderRadius.sm,
    // Logical properties: work in both LTR and RTL
    paddingInlineStart: theme.spacing.md,
    paddingInlineEnd:   theme.spacing.md,
    cursor: 'pointer',
    '&:disabled': { opacity: 0.5, cursor: 'not-allowed' },
  },
  primary: {
    background: theme.colors.primary,
    color:      theme.colors.onPrimary,
    border:     'none',
  },
}));

export function Button({ variant = 'primary',
  startIcon, children, ...props }: ButtonProps) {
  const classes = useStyles();
  return (
    <button className={\`\${classes.root} \${classes[variant]}\`}
            {...props}>
      {startIcon && <span className={classes.icon}>{startIcon}</span>}
      {children}
    </button>
  );
}`}
                </pre>
                <div style={{ marginTop: 6, padding: "4px 8px", background: `${Q.green}08`, borderRadius: 4, fontSize: 7.5, color: Q.green }}>
                  PropTypes/TypeScript · logical CSS properties (RTL-safe) · theme-driven · testable · Storybook-ready
                </div>
              </div>
            )}

            {/* Token explorer */}
            <div style={{ background: Q.surface, border: `1px solid ${Q.border}`, borderRadius: 10, padding: 12, marginBottom: 10 }}>
              <div style={{ fontSize: 8, fontWeight: 700, color: Q.textMuted, marginBottom: 6 }}>DESIGN TOKENS — single source of truth</div>
              <div style={{ display: "flex", gap: 4, marginBottom: 8 }}>
                {(["color", "spacing", "font"] as const).map(cat => (
                  <button key={cat} onClick={() => setTokenCategory(cat)} style={{ flex: 1, fontSize: 9, background: tokenCategory === cat ? `${Q.red}20` : "transparent", color: tokenCategory === cat ? Q.red : Q.textMuted, border: `1px solid ${tokenCategory === cat ? Q.red : Q.border}`, borderRadius: 5, padding: "4px 0", cursor: "pointer" }}>{cat}</button>
                ))}
              </div>
              <div style={{ background: Q.surface2, borderRadius: 6, padding: "6px 10px" }}>
                {TOKENS[tokenCategory].map(t => <TokenRow key={t.name} {...t} />)}
              </div>
            </div>

            {/* Component library */}
            <div style={{ background: Q.surface, border: `1px solid ${Q.border}`, borderRadius: 10, padding: 12 }}>
              <div style={{ fontSize: 8, fontWeight: 700, color: Q.textMuted, marginBottom: 6 }}>COMPONENT LIBRARY — interactive showcase</div>
              <div style={{ display: "flex", gap: 4, flexWrap: "wrap", marginBottom: 8 }}>
                {COMPONENTS.map(c => (
                  <button key={c} onClick={() => setSelectedComp(c)} style={{ fontSize: 9, background: selectedComp === c ? `${Q.red}20` : "transparent", color: selectedComp === c ? Q.red : Q.textMuted, border: `1px solid ${selectedComp === c ? Q.red : Q.border}`, borderRadius: 5, padding: "3px 10px", cursor: "pointer" }}>{c}</button>
                ))}
              </div>
              <div style={{ background: Q.surface2, borderRadius: 8, padding: 12, minHeight: 60, display: "flex", alignItems: "center" }}>
                {COMP_DEMOS[selectedComp]}
              </div>
            </div>
          </div>

          <div>
            <div style={{ fontSize: 10, fontWeight: 700, color: Q.textMuted, marginBottom: 8, letterSpacing: "0.08em" }}>IMPLEMENTATION DEPTH</div>
            <Code color={Q.red} label="Design system migration — Staff Eng perspective on Python+SASS → React+JSS" code={
`// QUORA CONTEXT (2017–2018):
// Quora: moving from server-rendered Django/Jinja2 pages to React SPA.
// Design system: Python macros + SASS. 80+ components.
// Problem: new React features can't use Python template components.
// Two systems: one for legacy pages (Python), one for new pages (React).
// Inconsistent: same "Button" looks slightly different in each.
//
// THE MIGRATION DECISION:
// Option A: CSS modules — scoped CSS, no CSS-in-JS
// Option B: styled-components — tagged template literals
// Option C: JSS — JavaScript Style Sheets, class-based
// Option D: Emotion — similar to styled-components, faster at runtime
//
// We chose JSS (2017–2018: pre-emotion dominance):
// - Material-UI used JSS — large community, battle-tested
// - ThemeProvider: inject theme into all components automatically
// - Dynamic styles: computed from props without runtime overhead
// - SSR: JSS generates class names deterministically (no hydration mismatch)
// - TypeScript: style objects = typed JavaScript objects (not string templates)
//
// THE TOKEN ARCHITECTURE:
// BEFORE (SASS variables):
// $primary-color: #B92B27;
// $spacing-md: 16px;
// Consumed only by SASS. Design tools (Sketch): manually synced. Drift = inevitable.
//
// AFTER (Design tokens as JSON):
// tokens.json → consumed by: JSS theme, React Native styles,
//               Figma token plugin, email templates, marketing site.
// Single source of truth. Designer changes the token → everywhere updates.
//
// THEME SHAPE:
// interface Theme {
//   colors: {
//     primary:    string;  // '#B92B27'
//     onPrimary:  string;  // '#ffffff' (text on primary bg)
//     background: string;
//     surface:    string;
//     text: { primary: string; secondary: string; };
//   };
//   spacing:      { xs: 4; sm: 8; md: 16; lg: 24; xl: 32 };
//   borderRadius: { sm: 4; md: 8; lg: 16; pill: 9999 };
//   typography:   { ... };
// }
//
// WORKING WITH DESIGN PARTNERS:
// The migration: not just a tech decision — a design decision.
// Every component: design review before implementation.
// Process:
// 1. Designer: creates Figma spec for the component (all states, variants)
// 2. Engineer + designer: 1-hour API design session
//    → agree on prop names, variant values, behavior
// 3. Engineer: implements, creates Storybook story
// 4. Designer: reviews Storybook. Pixel-perfect check.
// 5. Both: sign off. Merge.
//
// "The API design session was the highest-leverage hour in the process.
//  If we get the prop names wrong: the component is wrong forever.
//  Getting it right: 1 hour of conversation. Getting it wrong:
//  a breaking change + migration guide + 3 weeks of team work."
//
// COMPONENT PARITY DURING MIGRATION:
// Both Python and React components existed for 18 months.
// Visual parity: JSS theme tokens EXACTLY matched SASS variables.
// Same $primary-color → same theme.colors.primary.
// Automated visual regression tests (Percy): screenshot both.
// Any pixel-level diff: flagged before merge.
// "No designer could tell which page was Python and which was React.
//  That was the migration success criterion."`} />
          </div>
        </div>
      )}

      {/* ── RTL SUPPORT ── */}
      {tab === "rtl" && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
          <div>
            <div style={{ fontSize: 10, fontWeight: 700, color: Q.textMuted, marginBottom: 8, letterSpacing: "0.08em" }}>RTL LANGUAGE SUPPORT — ARABIC / HEBREW</div>

            {/* LTR/RTL toggle + live mock */}
            <div style={{ background: Q.surface, border: `1px solid ${Q.border}`, borderRadius: 10, padding: 12, marginBottom: 12 }}>
              <div style={{ display: "flex", gap: 4, marginBottom: 10 }}>
                <button onClick={() => setDir("ltr")} style={{ flex: 1, fontSize: 9, background: dir === "ltr" ? `${Q.blue}20` : "transparent", color: dir === "ltr" ? Q.blue : Q.textMuted, border: `1px solid ${dir === "ltr" ? Q.blue : Q.border}`, borderRadius: 5, padding: "5px 0", cursor: "pointer" }}>→ LTR (English)</button>
                <button onClick={() => setDir("rtl")} style={{ flex: 1, fontSize: 9, background: dir === "rtl" ? `${Q.arabic}20` : "transparent", color: dir === "rtl" ? Q.arabic : Q.textMuted, border: `1px solid ${dir === "rtl" ? Q.arabic : Q.border}`, borderRadius: 5, padding: "5px 0", cursor: "pointer" }}>← RTL (Arabic)</button>
              </div>
              <QuoraFeedMock dir={dir} />
              {dir === "rtl" && (
                <div style={{ marginTop: 6, padding: "4px 8px", background: `${Q.arabic}10`, borderRadius: 4, fontSize: 7.5, color: Q.arabic }}>
                  ✓ Layout mirrored · text right-aligned · author row reversed · upvote icon logically placed · Arabic font rendering
                </div>
              )}
            </div>

            {/* RTL implementation steps */}
            <div style={{ background: Q.surface, border: `1px solid ${Q.border}`, borderRadius: 10, padding: 12, marginBottom: 12 }}>
              <div style={{ fontSize: 8, fontWeight: 700, color: Q.textMuted, marginBottom: 6 }}>IMPLEMENTATION PILLARS — click to explore</div>
              {RTL_STEPS.map((s, i) => (
                <div key={i} onClick={() => setRtlStep(rtlStep === i ? -1 : i)} style={{ display: "flex", gap: 8, alignItems: "flex-start", padding: "5px 8px", borderRadius: 6, marginBottom: 3, cursor: "pointer", borderLeft: `2px solid ${rtlStep === i ? Q.arabic : Q.border}`, background: rtlStep === i ? `${Q.arabic}08` : "transparent" }}>
                  <span style={{ fontSize: 13, flexShrink: 0 }}>{s.icon}</span>
                  <div>
                    <div style={{ fontSize: 8.5, fontWeight: 600, color: rtlStep === i ? Q.textBright : Q.textMuted }}>{s.label}</div>
                    {rtlStep === i && <div style={{ fontSize: 8, color: Q.arabic, marginTop: 3, lineHeight: 1.6 }}>{s.detail}</div>}
                  </div>
                </div>
              ))}
            </div>

            {/* Bidi text examples */}
            <div style={{ background: Q.surface, border: `1px solid ${Q.border}`, borderRadius: 10, padding: 12, marginBottom: 12 }}>
              <div style={{ fontSize: 8, fontWeight: 700, color: Q.textMuted, marginBottom: 6 }}>BIDI TEXT — click example</div>
              {BIDI_EXAMPLES.map((b, i) => (
                <div key={i} onClick={() => setBidiExample(i)} style={{ padding: "6px 8px", borderRadius: 5, marginBottom: 4, cursor: "pointer", background: bidiExample === i ? `${Q.arabic}08` : Q.surface2, border: `1px solid ${bidiExample === i ? Q.arabic : Q.border}` }}>
                  <div style={{ fontSize: 7, color: Q.textMuted, marginBottom: 2 }}>{b.label}</div>
                  <div dir={b.dir} style={{ fontSize: 10, color: Q.textBright, lineHeight: 1.6, fontFamily: b.dir === "rtl" ? "'Noto Naskh Arabic', Arial, sans-serif" : "inherit", textAlign: b.dir === "rtl" ? "right" : "left" }}>{b.text}</div>
                </div>
              ))}
            </div>

            {/* Icon mirroring */}
            <div style={{ background: Q.surface, border: `1px solid ${Q.border}`, borderRadius: 10, padding: 12, marginBottom: 12 }}>
              <div style={{ fontSize: 8, fontWeight: 700, color: Q.textMuted, marginBottom: 6 }}>ICON MIRRORING — directional vs non-directional</div>
              <div style={{ display: "flex", gap: 5, marginBottom: 8 }}>
                <button onClick={() => setIconMirror(false)} style={{ fontSize: 9, background: !iconMirror ? `${Q.blue}20` : "transparent", color: !iconMirror ? Q.blue : Q.textMuted, border: `1px solid ${!iconMirror ? Q.blue : Q.border}`, borderRadius: 5, padding: "4px 10px", cursor: "pointer" }}>LTR mode</button>
                <button onClick={() => setIconMirror(true)} style={{ fontSize: 9, background: iconMirror ? `${Q.arabic}20` : "transparent", color: iconMirror ? Q.arabic : Q.textMuted, border: `1px solid ${iconMirror ? Q.arabic : Q.border}`, borderRadius: 5, padding: "4px 10px", cursor: "pointer" }}>RTL mode</button>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
                <div style={{ background: Q.surface2, borderRadius: 6, padding: 8 }}>
                  <div style={{ fontSize: 7, color: Q.green, marginBottom: 5 }}>✓ Mirror in RTL (directional)</div>
                  {["▶ Play", "→ Next", "« Prev", "↩ Back"].map(icon => (
                    <div key={icon} style={{ display: "flex", justifyContent: "center", marginBottom: 4 }}>
                      <span style={{ fontSize: 14, display: "inline-block", transform: iconMirror ? "scaleX(-1)" : "none", transition: "transform 0.3s" }}>{icon}</span>
                    </div>
                  ))}
                </div>
                <div style={{ background: Q.surface2, borderRadius: 6, padding: 8 }}>
                  <div style={{ fontSize: 7, color: Q.red, marginBottom: 5 }}>✗ Don't mirror (neutral)</div>
                  {["❤️ Like", "⭐ Save", "⚙️ Settings", "🔔 Notify"].map(icon => (
                    <div key={icon} style={{ display: "flex", justifyContent: "center", marginBottom: 4 }}>
                      <span style={{ fontSize: 12 }}>{icon}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Text editor simulation */}
            <div style={{ background: Q.surface, border: `1px solid ${Q.border}`, borderRadius: 10, padding: 12 }}>
              <div style={{ fontSize: 8, fontWeight: 700, color: Q.textMuted, marginBottom: 6 }}>ANSWER EDITOR — dir=auto demo</div>
              <div style={{ display: "flex", gap: 5, marginBottom: 8 }}>
                <button onClick={() => { setEditorRTL(false); setEditorText("Type your answer here..."); }} style={{ fontSize: 9, background: !editorRTL ? `${Q.blue}20` : "transparent", color: !editorRTL ? Q.blue : Q.textMuted, border: `1px solid ${!editorRTL ? Q.blue : Q.border}`, borderRadius: 5, padding: "4px 10px", cursor: "pointer" }}>English mode</button>
                <button onClick={() => { setEditorRTL(true); setEditorText("اكتب إجابتك هنا..."); }} style={{ fontSize: 9, background: editorRTL ? `${Q.arabic}20` : "transparent", color: editorRTL ? Q.arabic : Q.textMuted, border: `1px solid ${editorRTL ? Q.arabic : Q.border}`, borderRadius: 5, padding: "4px 10px", cursor: "pointer" }}>Arabic mode</button>
              </div>
              <div style={{ background: "#fff", borderRadius: 6, padding: "8px 10px", border: `1px solid #ddd` }}>
                <div style={{ display: "flex", gap: 6, marginBottom: 6, padding: "4px 0", borderBottom: "1px solid #eee", flexDirection: editorRTL ? "row-reverse" : "row" }}>
                  {["B", "I", "U", "📎", "🔗"].map(t => (
                    <button key={t} style={{ background: "transparent", border: "1px solid #ddd", borderRadius: 3, padding: "2px 6px", cursor: "pointer", fontSize: 10, color: "#333" }}>{t}</button>
                  ))}
                </div>
                <div
                  contentEditable
                  suppressContentEditableWarning
                  dir="auto"
                  style={{ minHeight: 48, fontSize: 10, color: "#333", outline: "none", direction: editorRTL ? "rtl" : "ltr", textAlign: editorRTL ? "right" : "left", fontFamily: editorRTL ? "'Noto Naskh Arabic', Arial" : "inherit" }}
                  onFocus={e => { if (e.target.textContent?.includes("...")) e.target.textContent = ""; }}
                >
                  {editorText}
                </div>
              </div>
              <div style={{ marginTop: 5, fontSize: 7.5, color: Q.textMuted }}>
                {editorRTL ? "dir=\"auto\": browser detects RTL automatically. Toolbar mirrored. Cursor: moves right on → key in Arabic text." : "dir=\"auto\": editor switches direction when Arabic characters are typed."}
              </div>
            </div>
          </div>

          <div>
            <div style={{ fontSize: 10, fontWeight: 700, color: Q.textMuted, marginBottom: 8, letterSpacing: "0.08em" }}>IMPLEMENTATION DEPTH</div>
            <Code color={Q.arabic} label="RTL support — full frontend rendering + text editing (Arabic/Hebrew)" code={
`// WHY RTL IS HARD (and why most teams get it wrong):
// "Adding dir='rtl' to <html>: 20% of RTL support."
// The remaining 80%: component-by-component correctness.
//
// THE THREE CATEGORIES OF RTL BUGS:
//
// 1. LAYOUT BUGS (most common):
// WRONG: margin-left: 16px (moves right in RTL mode → wrong side)
// RIGHT: margin-inline-start: 16px (moves left in LTR, right in RTL)
//
// CSS Logical Properties (MDN support: 95%+):
// margin-inline-start  = margin-left  in LTR, margin-right in RTL
// margin-inline-end    = margin-right in LTR, margin-left  in RTL
// padding-block-start  = padding-top  (always)
// inset-inline-start   = left in LTR, right in RTL
//
// JSS makes this clean:
// const styles = {
//   card: {
//     marginInlineStart: theme.spacing.md,  // LTR: left, RTL: right
//     paddingInlineEnd:  theme.spacing.sm,
//   },
//   icon: {
//     marginInlineEnd: theme.spacing.xs,    // space after icon, both dirs
//   },
// };
// Zero [dir=rtl] overrides. One rule: works for both directions.
//
// 2. ICON BUGS (subtler):
// Icons with implied direction: must mirror.
// How to tell? Ask: "if this icon were in a real-world context,
//   would it face the opposite way in an Arabic book?"
// Arrow →: yes (points forward in reading direction). Mirror: yes.
// Heart ❤: no (hearts don't have a direction). Mirror: no.
//
// JSS implementation:
// .icon-directional { /* play, back, forward, send, reply */ }
// [dir=rtl] .icon-directional { transform: scaleX(-1); }
//
// Or in JSS:
// icon: {
//   '[dir=rtl] &': { transform: 'scaleX(-1)' },
// }
//
// 3. TEXT EDITING BUGS (hardest):
// Quora's answer editor: contenteditable div.
// Challenge: user starts typing English, switches to Arabic mid-answer.
//
// Solution: dir="auto" on the contenteditable.
// Browser: runs Unicode Bidi Algorithm on each paragraph.
// If paragraph starts with RTL char: paragraph is RTL.
// If LTR char: LTR.
//
// BIDI algorithm handles:
// - Arabic text: right-to-left
// - English URL inside Arabic paragraph: left-to-right (isolated)
// - Numbers: left-to-right always
// - Punctuation: resolved by surrounding text direction
//
// Explicit control for edge cases:
// unicode-bidi: isolate — prevents direction bleeding to/from surroundings
// ‎ (LRM) / ‏ (RLM) — invisible direction markers for edge cases
//
// ARABIC TYPOGRAPHY:
// 1. Font: Arabic requires a separate font stack.
//    font-family: 'IBM Plex Arabic', 'Noto Naskh Arabic',
//                 'Segoe UI', Arial, sans-serif;
//    Arabic chars: fall through to Arabic font. Latin: Segoe UI.
//    No extra CSS needed — Unicode ranges handle it.
//
// 2. Line height: Arabic chars have diacritics (harakat) that extend
//    above and below the baseline. line-height: 1.8 minimum.
//    Latin: 1.4. Arabic-specific: 1.8.
//    In JSS: computed from locale:
//    lineHeight: locale === 'ar' ? 1.8 : 1.4
//
// 3. Font weight: Arabic doesn't have "bold" in the Latin sense.
//    Bold Arabic: use heavier font weight (700) sparingly.
//    Some Arabic fonts: no bold variant. Synthesized bold looks bad.
//    Always test with an actual Arabic font, not browser synthesis.
//
// INTL API FOR NUMBERS AND DATES:
// DON'T: manually construct Arabic date strings.
// DO: use Intl APIs — built into browsers, always correct.
//
// new Intl.NumberFormat('ar').format(1234567)
// → '١٬٢٣٤٬٥٦٧' (Eastern Arabic numerals)
//
// new Intl.NumberFormat('ar-AE').format(1234567)
// → '1,234,567' (Western Arabic numerals — UAE uses Western)
//
// new Intl.DateTimeFormat('ar-EG', {
//   dateStyle: 'full'
// }).format(new Date())
// → 'الخميس، ١٩ يونيو ٢٠٢٥' (Arabic calendar)
//
// THE RTL TESTING PROCESS:
// 1. Automated: jest-rtl — renders components with dir=rtl,
//    checks computed styles use logical values.
// 2. Visual: Percy (visual regression) with [dir=rtl] stories in Storybook.
// 3. Manual: native Arabic/Hebrew speaker review every 2 weeks.
//    "Engineers can check logical CSS. Only native speakers catch:
//    awkward spacing, wrong punctuation position, unnatural word wrap."`} />
          </div>
        </div>
      )}

      {/* ── TEAM LEAD ── */}
      {tab === "lead" && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
          <div>
            <div style={{ fontSize: 10, fontWeight: 700, color: Q.textMuted, marginBottom: 8, letterSpacing: "0.08em" }}>COMPONENT LIBRARY TEAM LEAD (3–4 ENG)</div>

            {/* Component request lifecycle */}
            <div style={{ background: Q.surface, border: `1px solid ${Q.border}`, borderRadius: 10, padding: 12, marginBottom: 12 }}>
              <div style={{ fontSize: 8, fontWeight: 700, color: Q.textMuted, marginBottom: 6 }}>COMPONENT REQUEST LIFECYCLE — click steps</div>
              {REQ_STEPS.map((s, i) => (
                <div key={i} onClick={() => setReqStep(reqStep === i ? -1 : i)} style={{ display: "flex", gap: 8, alignItems: "flex-start", padding: "5px 8px", borderRadius: 6, marginBottom: 3, cursor: "pointer", borderLeft: `2px solid ${reqStep >= i ? Q.red : Q.border}`, background: reqStep === i ? `${Q.red}08` : "transparent" }}>
                  <span style={{ fontSize: 13, flexShrink: 0 }}>{s.icon}</span>
                  <div>
                    <div style={{ fontSize: 8.5, fontWeight: 600, color: reqStep >= i ? Q.textBright : Q.textMuted }}>{s.label}</div>
                    {reqStep === i && <div style={{ fontSize: 8, color: Q.red, marginTop: 3, lineHeight: 1.6 }}>{s.detail}</div>}
                  </div>
                </div>
              ))}
            </div>

            {/* Semantic versioning */}
            <div style={{ background: Q.surface, border: `1px solid ${Q.border}`, borderRadius: 10, padding: 12, marginBottom: 12 }}>
              <div style={{ fontSize: 8, fontWeight: 700, color: Q.textMuted, marginBottom: 6 }}>SEMANTIC VERSIONING — @quora/design-system</div>
              {[
                { bump: "PATCH  (1.2.x)", color: Q.green,  rule: "Bug fixes, visual fixes, doc updates. Zero API changes. Safe to auto-update." },
                { bump: "MINOR  (1.x.0)", color: Q.blue,   rule: "New component, new prop (backward-compatible). Existing usage: unchanged. Opt-in new features." },
                { bump: "MAJOR  (x.0.0)", color: Q.red,    rule: "Breaking change: prop renamed, removed, behavior changed, component removed. RFC required." },
              ].map((v, i) => (
                <div key={i} onClick={() => setSemverStep(semverStep === i ? -1 : i)} style={{ padding: "6px 8px", borderRadius: 6, marginBottom: 4, cursor: "pointer", background: semverStep === i ? `${v.color}08` : Q.surface2, border: `1px solid ${semverStep === i ? v.color + "40" : Q.border}` }}>
                  <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                    <code style={{ fontSize: 8, fontFamily: Q.mono, color: v.color, fontWeight: 700, background: `${v.color}15`, padding: "1px 6px", borderRadius: 3 }}>{v.bump}</code>
                    <span style={{ fontSize: 8, color: semverStep === i ? Q.text : Q.textMuted }}>{v.rule}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Breaking changes */}
            <div style={{ background: Q.surface, border: `1px solid ${Q.border}`, borderRadius: 10, padding: 12 }}>
              <div style={{ fontSize: 8, fontWeight: 700, color: Q.textMuted, marginBottom: 6 }}>BREAKING CHANGE GOVERNANCE — real examples</div>
              {BREAKING_CHANGES.map((bc, i) => (
                <div key={i} onClick={() => setBreakingOpen(breakingOpen === i ? null : i)} style={{ padding: "7px 8px", borderRadius: 7, marginBottom: 5, cursor: "pointer", background: breakingOpen === i ? `${Q.red}08` : Q.surface2, border: `1px solid ${breakingOpen === i ? Q.red + "40" : Q.border}` }}>
                  <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                    <code style={{ fontSize: 8, fontFamily: Q.mono, color: Q.red, background: `${Q.red}15`, padding: "1px 6px", borderRadius: 3 }}>{bc.component}</code>
                    <span style={{ fontSize: 8, fontWeight: 700, color: Q.textBright }}>{bc.change}</span>
                  </div>
                  {breakingOpen === i && (
                    <div style={{ marginTop: 6 }}>
                      <div style={{ fontSize: 7.5, color: Q.text, marginBottom: 3 }}><strong style={{ color: Q.textBright }}>Why:</strong> {bc.why}</div>
                      <div style={{ fontSize: 7.5, color: Q.green }}><strong style={{ color: Q.textBright }}>Migration:</strong> {bc.migration}</div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div>
            <div style={{ fontSize: 10, fontWeight: 700, color: Q.textMuted, marginBottom: 8, letterSpacing: "0.08em" }}>IMPLEMENTATION DEPTH</div>
            <Code color={Q.purple} label="Component library team lead — leading a service team of 3-4 engineers" code={
`// WHAT "COMPONENT LIBRARY TEAM LEAD" ACTUALLY MEANS:
// The component library team is a SERVICE TEAM.
// Customers: 5-8 product teams (Feed, Questions, Profile, Search, etc.)
// Product: the component library is the product. Engineers are the customers.
// This is different from leading a product team:
// - Product team: ship features for end users
// - Service team: ship primitives for other engineers
//
// THE HARDEST PART: API DESIGN UNDER UNCERTAINTY
// "I need a button with an icon on the left."
// WRONG prop name: leftIcon (breaks in RTL)
// RIGHT prop name: startIcon (logical, direction-aware)
//
// "I need the Avatar to be 48px on desktop and 32px on mobile."
// WRONG: avatar size prop that overrides internal responsive logic
// RIGHT: responsive prop or size token (sm/md/lg) that the component
//        handles internally based on viewport
//
// The API design session (1 hour, before any code):
// Questions I always asked:
// 1. "What are the 3 use cases this component needs to handle?"
//    (If > 5: probably two components, not one.)
// 2. "What does the consumer NOT care about?"
//    (Internal implementation details → not in the API)
// 3. "What would make this prop name confusing in 2 years?"
//    (leftIcon → confusing when RTL launches. startIcon: timeless.)
// 4. "Does this variant already exist in another component?"
//    (40% of requests: already exist, just undiscovered)
//
// THE 40% RULE:
// 40% of component requests: the component already exists.
// The problem: discoverability, not capability.
// Solution: Storybook search + weekly "what's in the library" Slack post
//           + office hours (engineers ask before building).
// "If a team builds their own button because they couldn't find ours:
//  we have a documentation problem, not a component problem."
//
// MANAGING A TEAM OF 3-4 ENGINEERS (as a Group Lead):
// At Quora, "Group Lead" = tech lead + people lead (no separate EM).
// My responsibilities:
// - Technical: architecture decisions, code review, API design
// - People: 1:1s, career growth, performance reviews
// - Roadmap: quarterly planning, priority decisions
//
// How I ran the team:
// Monday: 30-min team sync. Blockers. Cross-team dependencies.
// Tuesday: 1-hour design review with design partner (open to the team).
// Weekly: rotating on-call for component questions (not all on me).
// Monthly: retrospective + roadmap review.
//
// GROWING JUNIOR ENGINEERS ON THE TEAM:
// The component library: ideal for junior engineer growth.
// Why: each component is a small, self-contained unit.
// Junior engineer A: owns the Tooltip component.
// Scope: small enough to complete in one sprint.
// Impact: used by 15+ other engineers.
// Pride: "I built the tooltip everyone uses."
//
// PR review philosophy: questions, not corrections.
// Instead of: "use logical properties here."
// Ask: "what happens to this margin when someone sets dir=rtl on the page?"
// They discover the issue. They fix it. They remember it.
//
// BREAKING CHANGE PROCESS:
// For every breaking change:
// 1. RFC: written proposal. "Why this change? What does migration look like?"
// 2. Consumer survey: which teams use the changed component?
// 3. Deprecation warning in console (minimum 60 days before removal)
// 4. Codemod: automated migration where possible (AST transform)
// 5. ESLint rule: flags the deprecated usage after deprecation
// 6. Migration guide in Storybook
// 7. Office hours session: "Ask us anything about the Button v3 migration"
//
// RULE: "Never surprise a consumer team."
// If a team ships a regression because of our breaking change
//   and we didn't warn them → that's our failure.`} />
          </div>
        </div>
      )}

      {/* ── MENTORSHIP ── */}
      {tab === "mentor" && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
          <div>
            <div style={{ fontSize: 10, fontWeight: 700, color: Q.textMuted, marginBottom: 8, letterSpacing: "0.08em" }}>MENTORSHIP — OFFICE HOURS + TECH TALKS</div>

            {/* Office hours model */}
            <div style={{ background: Q.surface, border: `1px solid ${Q.border}`, borderRadius: 10, padding: 12, marginBottom: 12 }}>
              <div style={{ fontSize: 8, fontWeight: 700, color: Q.textMuted, marginBottom: 8 }}>OFFICE HOURS MODEL — before vs after</div>
              <div style={{ display: "flex", gap: 4, marginBottom: 8 }}>
                <button onClick={() => setModelView("before")} style={{ flex: 1, fontSize: 9, background: modelView === "before" ? `${Q.red}20` : "transparent", color: modelView === "before" ? Q.red : Q.textMuted, border: `1px solid ${modelView === "before" ? Q.red : Q.border}`, borderRadius: 5, padding: "4px 0", cursor: "pointer" }}>Before: Jira tickets</button>
                <button onClick={() => setModelView("after")} style={{ flex: 1, fontSize: 9, background: modelView === "after" ? `${Q.green}20` : "transparent", color: modelView === "after" ? Q.green : Q.textMuted, border: `1px solid ${modelView === "after" ? Q.green : Q.border}`, borderRadius: 5, padding: "4px 0", cursor: "pointer" }}>After: Drop-in hours</button>
              </div>
              {modelView === "before" ? (
                <div>
                  {[
                    { icon: "📋", text: "Engineer files Jira ticket: 'How do I use the Avatar with a badge?'" },
                    { icon: "⏳", text: "Ticket sits in backlog. Component team: working on other priorities." },
                    { icon: "📬", text: "5 days later: component team picks up ticket." },
                    { icon: "💬", text: "3 back-and-forth comments to clarify the question." },
                    { icon: "✅", text: "Answer provided. Total elapsed: 7 days." },
                    { icon: "😞", text: "Engineer: built their own solution on day 3." },
                  ].map((s, i) => (
                    <div key={i} style={{ display: "flex", gap: 6, padding: "4px 0", borderBottom: `1px solid ${Q.border}20` }}>
                      <span style={{ fontSize: 10 }}>{s.icon}</span>
                      <span style={{ fontSize: 8, color: i === 5 ? Q.red : Q.textMuted }}>{s.text}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div>
                  {[
                    { icon: "🕐", text: "Tuesday 2-3pm: weekly drop-in office hour. Any engineer, any designer — no pre-booking." },
                    { icon: "🙋", text: "Engineer joins: 'How do I use Avatar with a badge?'" },
                    { icon: "💻", text: "Screen share. Component team member shows Storybook example + code." },
                    { icon: "🎯", text: "Designer in the same session: 'Actually that badge variant doesn't exist — let me spec it now.'" },
                    { icon: "📝", text: "Live: spec created. Component team: add to next sprint." },
                    { icon: "✅", text: "Total time: 12 minutes. Same-day resolution." },
                  ].map((s, i) => (
                    <div key={i} style={{ display: "flex", gap: 6, padding: "4px 0", borderBottom: `1px solid ${Q.border}20` }}>
                      <span style={{ fontSize: 10 }}>{s.icon}</span>
                      <span style={{ fontSize: 8, color: i === 5 ? Q.green : Q.text }}>{s.text}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Mentee outcomes */}
            <div style={{ background: Q.surface, border: `1px solid ${Q.border}`, borderRadius: 10, padding: 12, marginBottom: 12 }}>
              <div style={{ fontSize: 8, fontWeight: 700, color: Q.textMuted, marginBottom: 6 }}>MENTEE OUTCOMES</div>
              {MENTEES.map((m, i) => (
                <div key={i} style={{ padding: "6px 8px", borderRadius: 6, marginBottom: 4, background: Q.surface2, borderLeft: `2px solid ${Q.red}60` }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 2 }}>
                    <span style={{ fontSize: 8.5, fontWeight: 700, color: Q.textBright }}>{m.name}</span>
                    <span style={{ fontSize: 7, color: Q.green, fontWeight: 700 }}>{m.growth}</span>
                  </div>
                  <div style={{ fontSize: 7.5, color: Q.textMuted }}>{m.how}</div>
                </div>
              ))}
            </div>

            {/* Tech talks */}
            <div style={{ background: Q.surface, border: `1px solid ${Q.border}`, borderRadius: 10, padding: 12 }}>
              <div style={{ fontSize: 8, fontWeight: 700, color: Q.textMuted, marginBottom: 6 }}>TECH TALKS — click to see impact</div>
              {TALKS.map((t, i) => (
                <div key={i} onClick={() => setTalkExpanded(talkExpanded === i ? null : i)} style={{ padding: "6px 8px", borderRadius: 7, marginBottom: 4, cursor: "pointer", background: talkExpanded === i ? `${Q.red}08` : Q.surface2, border: `1px solid ${talkExpanded === i ? Q.red + "40" : Q.border}` }}>
                  <div style={{ fontSize: 8.5, fontWeight: 700, color: Q.textBright }}>🎤 {t.title}</div>
                  <div style={{ fontSize: 7, color: Q.textMuted }}>Audience: {t.audience}</div>
                  {talkExpanded === i && <div style={{ marginTop: 5, fontSize: 8, color: Q.green, lineHeight: 1.5 }}>Impact: {t.impact}</div>}
                </div>
              ))}
            </div>
          </div>

          <div>
            <div style={{ fontSize: 10, fontWeight: 700, color: Q.textMuted, marginBottom: 8, letterSpacing: "0.08em" }}>IMPLEMENTATION DEPTH</div>
            <Code color={Q.green} label="Office hours model + mentorship — the Group Lead view on enabling others" code={
`// THE PROBLEM WITH JIRA TICKETS FOR DESIGN SYSTEM SUPPORT:
// 2017: the component library team's support model:
// File a Jira ticket. Wait 5-7 business days. Get an answer.
// Total overhead per question: 20+ minutes of writing/clarifying.
// Result:
// - Engineers build their own solutions (they can't wait 7 days)
// - Inconsistency: each team's home-grown solution is subtly different
// - The component library: underutilized because it's perceived as slow
// "If it's faster to build your own button than to get help from the
//  component library team, you'll always build your own button."
//
// THE DROP-IN OFFICE HOURS MODEL:
// Tuesday 2-3pm, every week. No pre-booking. No Jira ticket required.
// Any engineer, any designer: drop in with a question.
// We set up a screenshare from the start: ready to code together.
//
// WHY THIS WORKED:
// 1. Zero friction: no ticket, no pre-scheduling.
//    Friction-free support → questions come before engineers give up.
// 2. Real-time: 12-minute average resolution vs 7-day average.
// 3. Design-engineering colocation:
//    Designers came to the same office hour as engineers.
//    Common scenario: "I need this component" (engineer) + "Oh, I have
//    a Figma for that" (designer who happens to be in the session).
//    The hallway conversation: now structured, accessible.
// 4. Discoverability: engineers learned what existed.
//    "Oh, we have a Tooltip component? I didn't know." — every week.
//    40% of requests: already built. Office hours: the discovery mechanism.
//
// IMPACT METRICS:
// Before office hours: 5-7 day median response time.
// After: < 2 hours (same-session or follow-up async).
// Component adoption rate: ↑ 34% (vs trend before office hours).
// "DIY component" incidents: ↓ 61% (measured by PR review flags).
//
// MENTORING JUNIOR ENGINEERS — THE ACTUAL APPROACH:
//
// THE OWNERSHIP MODEL:
// Each junior engineer: owns one complete component.
// Not "helps with components" — OWNS one completely.
// Owner: builds it, documents it, responds to issues, evolves it.
// Small component: Tooltip, Badge, Avatar.
//
// Why ownership?
// "Mentorship fails when there's no consequence.
//  Owning a component used by 15+ engineers: there are consequences.
//  A bad API choice: other engineers file issues. You learn.
//  A missing accessibility feature: someone reports it. You fix it.
//  The feedback loop is real because the stakes are real."
//
// THE TECH TALK PATHWAY:
// Most junior engineers: terrified of public speaking.
// My approach: don't ask them to give a talk. Ask them to teach me.
// "Hey, you just figured out how to implement keyboard navigation
//  in a dropdown. Can you walk me through it?"
// They explain. I ask: "could you write that up for the team?"
// They write a document. I ask: "could you present it at the next
//  all-hands?"
// One 5-minute Lightning Talk → two junior engineers gave external
// conference talks within 18 months of joining.
//
// THE WRITTEN BEST PRACTICES DOCS:
// Wiki articles written (most-read at Quora 2019):
// 1. "JSS Patterns: 10 Things You Should Know Before Writing a Component"
// 2. "RTL Checklist: 12 Things to Check Before Shipping to Arabic Users"
// 3. "Accessible Forms: The Checklist That Catches 80% of a11y Issues"
// 4. "How to Request a New Component (and Get It Built Faster)"
//    (This one: reduced ill-formed requests by 70%)
//
// ON BEING A GROUP LEAD (tech lead + people lead):
// The hardest part: giving career feedback, not technical feedback.
// "Your code is wrong" — easy to say. The solution: clear.
// "Your communication is blocking your growth to L4" — hard to say well.
// My framework: specific behavior → specific impact → specific change.
// "In the last 3 design reviews, you presented your component API
//  as final. Two times: the design partner found issues late.
//  Impact: 2-day rework each time. Change: open the API design session
//  with 'here's my draft — tell me what doesn't work.'"
// Behavior + impact + change. Not personality. Not judgment. Observable.`} />
          </div>
        </div>
      )}
    </div>
  );
}

export default QuoraDesignSystemDemo;
