/**
 * CapitalOneDesignSystemDemo.tsx
 *
 * Lead Front-End Developer — Capital One Design System
 * Enterprise-scale design system delivering accessible, performant,
 * pixel-perfect components to millions of customers.
 *
 * TABS
 *   🎨 Design Tokens   — 3-tier token architecture (primitive → semantic → component)
 *   🧩 Components      — Live component gallery: buttons, inputs, alerts, financial data
 *   ♿ Accessibility    — WCAG AA for fintech: contrast, ARIA, keyboard nav in tables
 *   🏗 Engineering     — Versioning, bundle analysis, visual regression, contribution model
 */

import React, { useState, useRef, useCallback } from "react";

// ─────────────────────────────────────────────────────────────────
// Design tokens (the real source of truth)
// ─────────────────────────────────────────────────────────────────

const PRIMITIVE_TOKENS = {
  "red-500":    "#D03027",
  "red-600":    "#B02820",
  "red-100":    "#FCE8E8",
  "navy-900":   "#002D62",
  "navy-800":   "#003D8A",
  "navy-100":   "#E5EAF3",
  "gray-900":   "#1A1A1A",
  "gray-500":   "#6B7280",
  "gray-100":   "#F5F5F5",
  "gray-50":    "#FAFAFA",
  "white":      "#FFFFFF",
  "green-500":  "#00A36C",
  "green-100":  "#E6F5F0",
  "amber-500":  "#D97706",
  "amber-100":  "#FEF3C7",
};

const SEMANTIC_TOKENS = {
  "color-action-primary":    "var(--red-500)",
  "color-action-hover":      "var(--red-600)",
  "color-action-secondary":  "var(--navy-900)",
  "color-surface-default":   "var(--gray-50)",
  "color-surface-accent":    "var(--navy-100)",
  "color-text-primary":      "var(--gray-900)",
  "color-text-inverse":      "var(--white)",
  "color-text-muted":        "var(--gray-500)",
  "color-feedback-success":  "var(--green-500)",
  "color-feedback-warning":  "var(--amber-500)",
  "color-feedback-error":    "var(--red-500)",
  "color-border-default":    "var(--gray-100)",
};

const COMPONENT_TOKENS = {
  "button-primary-bg":       "var(--color-action-primary)",
  "button-primary-text":     "var(--color-text-inverse)",
  "button-secondary-bg":     "transparent",
  "button-secondary-border": "var(--color-action-secondary)",
  "input-border":            "var(--gray-500)",
  "input-border-focus":      "var(--color-action-secondary)",
  "input-error-border":      "var(--color-feedback-error)",
  "card-bg":                 "var(--white)",
  "card-shadow":             "0 2px 8px rgba(0,0,0,0.08)",
};

// ─────────────────────────────────────────────────────────────────
// Component demo data
// ─────────────────────────────────────────────────────────────────

type ButtonVariant = "primary" | "secondary" | "ghost" | "destructive";
type AlertType = "success" | "warning" | "error" | "info";
type InputState = "default" | "error" | "disabled" | "success";

interface Transaction {
  id: string; date: string; merchant: string; category: string;
  amount: number; balance: number; status: "posted" | "pending";
}

const TRANSACTIONS: Transaction[] = [
  { id: "t1", date: "Jun 17", merchant: "Amazon",        category: "Shopping",    amount: -89.99,  balance: 3422.01, status: "posted"  },
  { id: "t2", date: "Jun 17", merchant: "Direct Deposit",category: "Income",      amount: 2500.00, balance: 3512.00, status: "posted"  },
  { id: "t3", date: "Jun 16", merchant: "Whole Foods",   category: "Groceries",   amount: -67.45,  balance: 1012.00, status: "posted"  },
  { id: "t4", date: "Jun 16", merchant: "Netflix",       category: "Streaming",   amount: -15.99,  balance: 1079.45, status: "pending" },
  { id: "t5", date: "Jun 15", merchant: "Shell Gas",     category: "Auto",        amount: -52.00,  balance: 1095.44, status: "posted"  },
  { id: "t6", date: "Jun 15", merchant: "Spotify",       category: "Streaming",   amount: -9.99,   balance: 1147.44, status: "posted"  },
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

// Capital One brand colors for demo
const C1_RED   = "#D03027";
const C1_NAVY  = "#002D62";

// Contrast ratio calculation (WCAG)
function getLuminance(hex: string): number {
  const clean = hex.replace("#", "");
  const rgb = [0, 2, 4].map(i => {
    const c = parseInt(clean.slice(i, i + 2), 16) / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * rgb[0] + 0.7152 * rgb[1] + 0.0722 * rgb[2];
}

function getContrastRatio(fg: string, bg: string): number {
  const l1 = Math.max(getLuminance(fg), getLuminance(bg));
  const l2 = Math.min(getLuminance(fg), getLuminance(bg));
  return parseFloat(((l1 + 0.05) / (l2 + 0.05)).toFixed(2));
}

function wcagLevel(ratio: number, isLargeText = false): { level: string; pass: boolean; color: string } {
  if (isLargeText) {
    if (ratio >= 4.5) return { level: "AAA", pass: true, color: "#2BAC76" };
    if (ratio >= 3.0) return { level: "AA",  pass: true, color: "#2BAC76" };
    return { level: "FAIL", pass: false, color: "#E01E5A" };
  }
  if (ratio >= 7.0)   return { level: "AAA", pass: true, color: "#2BAC76" };
  if (ratio >= 4.5)   return { level: "AA",  pass: true, color: "#2BAC76" };
  if (ratio >= 3.0)   return { level: "AA Large", pass: false, color: "#ECB22E" };
  return { level: "FAIL", pass: false, color: "#E01E5A" };
}

// ─────────────────────────────────────────────────────────────────
// Main Demo
// ─────────────────────────────────────────────────────────────────

export function CapitalOneDesignSystemDemo() {
  const [activeTab, setActiveTab] = useState<"tokens" | "components" | "a11y" | "eng">("tokens");

  // ── Token state ──────────────────────────────────────────────
  const [tokenLayer, setTokenLayer]   = useState<"primitive" | "semantic" | "component">("primitive");
  const [darkMode, setDarkMode]       = useState(false);

  // ── Component state ──────────────────────────────────────────
  const [btnVariant, setBtnVariant]   = useState<ButtonVariant>("primary");
  const [btnLoading, setBtnLoading]   = useState(false);
  const [inputState, setInputState]   = useState<InputState>("default");
  const [inputVal, setInputVal]       = useState("");
  const [alertType, setAlertType]     = useState<AlertType>("success");
  const [activeCard, setActiveCard]   = useState<string | null>(null);

  // ── A11y state ───────────────────────────────────────────────
  const [fgColor, setFgColor]         = useState("#FFFFFF");
  const [bgColor, setBgColor]         = useState(C1_RED);
  const [isLargeText, setIsLargeText] = useState(false);
  const [focusedRow, setFocusedRow]   = useState<number | null>(null);
  const [liveMsg, setLiveMsg]         = useState<string | null>(null);
  const tableRef                      = useRef<HTMLDivElement>(null);
  const liveMsgTimer                  = useRef<ReturnType<typeof setTimeout> | null>(null);

  const contrastRatio = getContrastRatio(fgColor, bgColor);
  const wcag          = wcagLevel(contrastRatio, isLargeText);

  const announce = useCallback((msg: string) => {
    setLiveMsg(msg);
    if (liveMsgTimer.current) clearTimeout(liveMsgTimer.current);
    liveMsgTimer.current = setTimeout(() => setLiveMsg(null), 3000);
  }, []);

  const handleTableKeyDown = (e: React.KeyboardEvent, idx: number) => {
    if (e.key === "ArrowDown") { e.preventDefault(); const next = Math.min(idx + 1, TRANSACTIONS.length - 1); setFocusedRow(next); announce(`Row ${next + 1}: ${TRANSACTIONS[next].merchant}, ${TRANSACTIONS[next].amount < 0 ? "debit" : "credit"} $${Math.abs(TRANSACTIONS[next].amount).toFixed(2)}`); }
    if (e.key === "ArrowUp")   { e.preventDefault(); const prev = Math.max(idx - 1, 0); setFocusedRow(prev); announce(`Row ${prev + 1}: ${TRANSACTIONS[prev].merchant}, ${TRANSACTIONS[prev].amount < 0 ? "debit" : "credit"} $${Math.abs(TRANSACTIONS[prev].amount).toFixed(2)}`); }
    if (e.key === "Escape")    { setFocusedRow(null); }
  };

  // ── Engineering state ────────────────────────────────────────
  const BUNDLE_DATA = [
    { name: "Button",    size: 2.1,  gzip: 0.9,  a11y: true, visual: true, version: "v4.2.0" },
    { name: "Input",     size: 3.4,  gzip: 1.3,  a11y: true, visual: true, version: "v4.2.0" },
    { name: "Table",     size: 8.2,  gzip: 3.1,  a11y: true, visual: false, version: "v4.1.1" },
    { name: "Modal",     size: 5.7,  gzip: 2.2,  a11y: true, visual: true, version: "v4.2.0" },
    { name: "Alert",     size: 1.8,  gzip: 0.7,  a11y: true, visual: true, version: "v4.2.0" },
    { name: "DatePicker",size: 12.4, gzip: 4.8,  a11y: false, visual: false,version: "v4.0.3" },
  ];

  const CHANGELOG = [
    { version: "v4.2.0", type: "minor",   date: "Jun 2025", note: "Added loading state to Button. New Alert variants." },
    { version: "v4.1.1", type: "patch",   date: "May 2025", note: "Fix: Table column sort aria-sort attribute missing." },
    { version: "v4.1.0", type: "minor",   date: "Apr 2025", note: "Token refresh: spacing scale updated. New card component." },
    { version: "v4.0.0", type: "major",   date: "Feb 2025", note: "BREAKING: Renamed colorPrimary → color-action-primary. Migration guide ↗" },
  ];

  const VERSION_COLOR: Record<string, string> = { minor: "#1264A3", patch: "#2BAC76", major: "#D03027" };

  const TABS = [
    { id: "tokens"     as const, label: "🎨 Design Tokens" },
    { id: "components" as const, label: "🧩 Components"    },
    { id: "a11y"       as const, label: "♿ Accessibility"  },
    { id: "eng"        as const, label: "🏗 Engineering"   },
  ];

  const ALERT_CONFIG: Record<AlertType, { icon: string; bg: string; border: string; text: string }> = {
    success: { icon: "✓", bg: "#E6F5F0", border: "#00A36C", text: "#005A3C" },
    warning: { icon: "⚠", bg: "#FEF3C7", border: "#D97706", text: "#92400E" },
    error:   { icon: "✕", bg: "#FCE8E8", border: C1_RED,    text: "#7A1A1A" },
    info:    { icon: "ℹ", bg: "#EEF2FF", border: C1_NAVY,   text: C1_NAVY   },
  };

  return (
    <div style={{ background: "#0f172a", color: "#f1f5f9", fontFamily: "'Inter', system-ui, sans-serif", minHeight: "100vh", padding: 24 }}>

      {/* Header */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
          <div style={{ width: 36, height: 36, borderRadius: 8, background: C1_RED, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, fontWeight: 900, color: "#fff" }}>C1</div>
          <div>
            <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800 }}>Capital One Design System</h1>
            <p style={{ margin: 0, color: "#64748b", fontSize: 13 }}>Lead Front-End Developer · Accessible · Performant · Pixel-Perfect · Enterprise Scale</p>
          </div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8 }}>
          {[
            { v: "150+",   l: "Components",           c: C1_RED,  sub: "Tokens → Semantic → Component"  },
            { v: "WCAG AA",l: "Accessibility",         c: C1_NAVY, sub: "Every component from day 1"     },
            { v: "3-tier", l: "Token Architecture",    c: "#2BAC76", sub: "Primitive → Semantic → Comp"  },
            { v: "3 teams",l: "Cross-functional",      c: "#ECB22E", sub: "Design · Eng · Product · A11y" },
          ].map(m => (
            <div key={m.l} style={{ background: "#1e293b", border: `1px solid ${m.c}30`, borderRadius: 10, padding: "10px 12px" }}>
              <div style={{ fontSize: 18, fontWeight: 900, color: m.c }}>{m.v}</div>
              <div style={{ fontSize: 9, fontWeight: 700 }}>{m.l}</div>
              <div style={{ fontSize: 8, color: "#475569", marginTop: 2 }}>{m.sub}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Tab bar */}
      <div style={{ display: "flex", gap: 4, marginBottom: 20, borderBottom: "1px solid #1e293b", paddingBottom: 4 }}>
        {TABS.map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{ background: activeTab === tab.id ? "#1e293b" : "transparent", color: activeTab === tab.id ? "#f1f5f9" : "#64748b", border: activeTab === tab.id ? "1px solid #334155" : "1px solid transparent", borderRadius: "8px 8px 0 0", padding: "8px 22px", cursor: "pointer", fontSize: 12, fontWeight: 600 }}>{tab.label}</button>
        ))}
      </div>

      {/* ── DESIGN TOKENS ── */}
      {activeTab === "tokens" && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
          <div>
            <div style={{ fontSize: 10, fontWeight: 700, color: "#64748b", marginBottom: 8, letterSpacing: "0.08em" }}>3-TIER TOKEN ARCHITECTURE</div>

            {/* Layer selector */}
            <div style={{ display: "flex", gap: 4, marginBottom: 10 }}>
              {(["primitive", "semantic", "component"] as const).map(layer => (
                <button key={layer} onClick={() => setTokenLayer(layer)} style={{ flex: 1, background: tokenLayer === layer ? "#1e293b" : "transparent", border: `1px solid ${tokenLayer === layer ? C1_RED : "#334155"}`, borderRadius: 7, padding: "6px", cursor: "pointer", color: tokenLayer === layer ? "#f1f5f9" : "#64748b", fontSize: 9, fontWeight: 700, textTransform: "capitalize" }}>
                  {layer === "primitive" ? "① Primitive" : layer === "semantic" ? "② Semantic" : "③ Component"}
                </button>
              ))}
            </div>

            {/* Token display */}
            {tokenLayer === "primitive" && (
              <div style={{ background: "#1e293b", border: "1px solid #334155", borderRadius: 10, padding: 12, marginBottom: 10 }}>
                <div style={{ fontSize: 8, fontWeight: 700, marginBottom: 6, color: "#64748b" }}>RAW VALUES — colours, sizes, weights. No semantic meaning yet.</div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 5 }}>
                  {Object.entries(PRIMITIVE_TOKENS).map(([name, value]) => (
                    <div key={name} style={{ display: "flex", gap: 6, alignItems: "center", background: "#0f172a", borderRadius: 5, padding: "4px 8px" }}>
                      <div style={{ width: 18, height: 18, borderRadius: 4, background: value, border: "1px solid rgba(255,255,255,0.1)", flexShrink: 0 }} />
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontSize: 7, fontFamily: "monospace", color: "#94a3b8", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>--{name}</div>
                        <div style={{ fontSize: 7, fontFamily: "monospace", color: "#475569" }}>{value}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {tokenLayer === "semantic" && (
              <div style={{ background: "#1e293b", border: "1px solid #334155", borderRadius: 10, padding: 12, marginBottom: 10 }}>
                <div style={{ fontSize: 8, fontWeight: 700, marginBottom: 6, color: "#64748b" }}>PURPOSE-DRIVEN — "what is this for?", not "what is this value?"</div>
                {Object.entries(SEMANTIC_TOKENS).map(([name, value]) => {
                  const primKey = value.replace("var(--", "").replace(")", "");
                  const hex = (PRIMITIVE_TOKENS as Record<string, string>)[primKey] || "#334155";
                  return (
                    <div key={name} style={{ display: "flex", gap: 8, alignItems: "center", padding: "4px 6px", borderBottom: "1px solid #0f172a", marginBottom: 2 }}>
                      <div style={{ width: 14, height: 14, borderRadius: 3, background: hex, border: "1px solid rgba(255,255,255,0.1)", flexShrink: 0 }} />
                      <div style={{ flex: 1, fontSize: 8, fontFamily: "monospace", color: "#94a3b8" }}>--{name}</div>
                      <div style={{ fontSize: 7, fontFamily: "monospace", color: "#475569", flexShrink: 0 }}>{value}</div>
                    </div>
                  );
                })}
              </div>
            )}

            {tokenLayer === "component" && (
              <div style={{ background: "#1e293b", border: "1px solid #334155", borderRadius: 10, padding: 12, marginBottom: 10 }}>
                <div style={{ fontSize: 8, fontWeight: 700, marginBottom: 6, color: "#64748b" }}>COMPONENT-SCOPED — individual component theming without touching semantics.</div>
                {Object.entries(COMPONENT_TOKENS).map(([name, value]) => (
                  <div key={name} style={{ display: "flex", gap: 8, alignItems: "center", padding: "4px 6px", borderBottom: "1px solid #0f172a", marginBottom: 2 }}>
                    <div style={{ flex: 1, fontSize: 8, fontFamily: "monospace", color: "#94a3b8" }}>--{name}</div>
                    <div style={{ fontSize: 7, fontFamily: "monospace", color: "#475569", flexShrink: 0 }}>{value}</div>
                  </div>
                ))}
              </div>
            )}

            {/* Dark mode toggle */}
            <div style={{ background: "#1e293b", border: "1px solid #334155", borderRadius: 10, padding: 10, display: "flex", alignItems: "center", gap: 10 }}>
              <button onClick={() => setDarkMode(d => !d)} style={{ background: darkMode ? C1_NAVY : C1_RED, border: "none", borderRadius: 20, padding: "4px 12px", cursor: "pointer", color: "#fff", fontSize: 8, fontWeight: 700 }}>
                {darkMode ? "🌙 Dark Mode" : "☀️ Light Mode"}
              </button>
              <div style={{ flex: 1, background: darkMode ? "#1A1A2E" : "#FFFFFF", borderRadius: 6, padding: "6px 10px", display: "flex", gap: 8, alignItems: "center" }}>
                <div style={{ width: 28, height: 10, background: darkMode ? "#CCCCCC" : C1_RED, borderRadius: 3 }} />
                <div style={{ width: 40, height: 10, background: darkMode ? "#334155" : "#E5EAF3", borderRadius: 3 }} />
                <div style={{ fontSize: 8, color: darkMode ? "#94A3B8" : C1_NAVY, fontFamily: "monospace" }}>Tokens resolve at runtime ✓</div>
              </div>
            </div>
          </div>

          <div>
            <div style={{ fontSize: 10, fontWeight: 700, color: "#64748b", marginBottom: 8, letterSpacing: "0.08em" }}>IMPLEMENTATION DEPTH</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <CodeBlock label="3-tier token architecture — the why and how" color={C1_RED} code={
`// WHY 3 TIERS? One change propagates through the entire system.
//
// TIER 1 — PRIMITIVE: raw named values. No context.
// Defined in: design-tokens/primitive.json (Style Dictionary source)
// Output: CSS custom properties.
${"--red-500:   #D03027;"}
${"--navy-900:  #002D62;"}
${"--spacing-4: 16px;"}

// TIER 2 — SEMANTIC: maps purpose → primitive.
// WHY: a rebrand changes ONLY this layer. Components: unchanged.
// "We rebranded Capital One's secondary color in 4 hours.
//  Changed one semantic token. 150 components updated automatically."
${"--color-action-primary:   var(--red-500);"}
${"--color-action-secondary: var(--navy-900);"}
${"--color-feedback-error:   var(--red-500);  /* same primitive, different purpose */"}

// TIER 3 — COMPONENT: scoped to a specific component.
// WHY: allows component-specific theming without touching semantics.
// A white-label bank using our system: overrides tier 3 only.
// Brand identity: intact. Our component behaviour: unchanged.
${"--button-primary-bg:    var(--color-action-primary);"}
${"--button-primary-text:  var(--color-text-inverse);"}
${"--button-border-radius: var(--radius-medium);  /* 8px */"}

// HOW THEY CONNECT: Style Dictionary transforms token JSON → CSS.
// Input (design-tokens/semantic.json):
// { "button": { "primary": { "bg": { "$value": "{color.action.primary}" } } } }
// Output (dist/tokens.css):
// --button-primary-bg: var(--color-action-primary);
//
// Figma: designers use the same token names.
// Code: references the same names.
// Single source of truth: the JSON.`} />

              <CodeBlock label="Style Dictionary pipeline — Figma → tokens → CSS → components" color={C1_NAVY} code={
`// PIPELINE: Figma Variables → JSON → Style Dictionary → CSS + JS tokens
//
// 1. Figma: designers define tokens as Figma Variables (colour, text, spacing).
//    Plugin (Tokens Studio / native Variables API): exports to JSON.
//
// 2. Style Dictionary: transforms JSON → platform-specific outputs.
//    Our outputs: CSS custom properties, ESM JS tokens, iOS Swift, Android XML.
//    One source: 4 platforms. Mobile engineers get tokens automatically.
//
// style-dictionary.config.js:
module.exports = {
  source: ["tokens/**/*.json"],
  platforms: {
    css: {
      transformGroup: "css",
      prefix: "c1",    // --c1-color-action-primary (namespaced, no collisions)
      files: [{ format: "css/variables", destination: "dist/tokens.css" }],
    },
    js: {
      transformGroup: "js",
      files: [{ format: "javascript/esm", destination: "dist/tokens.js" }],
    },
  },
};
// Output: dist/tokens.css
// :root {
//   --c1-color-action-primary: #D03027;
//   --c1-color-action-secondary: #002D62;
//   ... (150+ tokens)
// }
//
// In components: reference CSS custom properties.
// const Button = styled.button\`
//   background: var(--c1-button-primary-bg);
//   color: var(--c1-button-primary-text);
// \`;
//
// WHY CSS CUSTOM PROPERTIES OVER SCSS VARIABLES:
// SCSS variables: compiled away. Runtime theming: impossible.
// CSS custom properties: live in the browser. Dark mode: one class toggle.
// .dark-theme { --c1-color-surface-default: #1A1A2E; }
// Every component: responds automatically. Zero component changes needed.
//
// "We support 3 white-label bank partners. Each has their own --c1-color-action-primary.
//  The button renders their brand color automatically.
//  The button component: never touched for white-label customization."`} />
            </div>
          </div>
        </div>
      )}

      {/* ── COMPONENTS ── */}
      {activeTab === "components" && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
          <div>
            <div style={{ fontSize: 10, fontWeight: 700, color: "#64748b", marginBottom: 8, letterSpacing: "0.08em" }}>LIVE COMPONENT GALLERY</div>

            {/* Buttons */}
            <div style={{ background: "#1e293b", border: "1px solid #334155", borderRadius: 10, padding: 12, marginBottom: 10 }}>
              <div style={{ fontSize: 8, fontWeight: 700, marginBottom: 8 }}>Button — variant × state × size</div>
              <div style={{ display: "flex", gap: 5, marginBottom: 8, flexWrap: "wrap" }}>
                {(["primary", "secondary", "ghost", "destructive"] as ButtonVariant[]).map(v => (
                  <button key={v} onClick={() => setBtnVariant(v)} style={{ fontSize: 7, background: btnVariant === v ? "#0f172a" : "transparent", border: `1px solid ${btnVariant === v ? C1_RED : "#334155"}`, borderRadius: 5, padding: "3px 8px", cursor: "pointer", color: btnVariant === v ? C1_RED : "#64748b", fontWeight: 700 }}>{v}</button>
                ))}
                <button onClick={() => setBtnLoading(l => !l)} style={{ fontSize: 7, background: "transparent", border: "1px solid #334155", borderRadius: 5, padding: "3px 8px", cursor: "pointer", color: "#64748b" }}>Toggle loading</button>
              </div>
              <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                {(["sm", "md", "lg"] as const).map(size => {
                  const sizeMap = { sm: { padding: "5px 12px", fontSize: 9 }, md: { padding: "8px 18px", fontSize: 11 }, lg: { padding: "12px 24px", fontSize: 13 } };
                  const variantStyles: Record<ButtonVariant, React.CSSProperties> = {
                    primary:     { background: C1_RED,    color: "#fff",      border: "none" },
                    secondary:   { background: "transparent", color: C1_NAVY, border: `2px solid ${C1_NAVY}` },
                    ghost:       { background: "transparent", color: C1_RED,  border: "none" },
                    destructive: { background: "#7A1A1A", color: "#fff",      border: "none" },
                  };
                  return (
                    <button key={size} disabled={btnLoading} style={{ ...sizeMap[size], ...variantStyles[btnVariant], borderRadius: 6, cursor: btnLoading ? "not-allowed" : "pointer", opacity: btnLoading ? 0.7 : 1, display: "flex", alignItems: "center", gap: 6, fontWeight: 600 }}>
                      {btnLoading && <span style={{ width: 10, height: 10, borderRadius: "50%", border: "2px solid transparent", borderTopColor: btnVariant === "secondary" || btnVariant === "ghost" ? C1_NAVY : "#fff", animation: "spin 0.6s linear infinite" }} />}
                      {size.toUpperCase()}{btnLoading ? " …" : ""}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Inputs */}
            <div style={{ background: "#1e293b", border: "1px solid #334155", borderRadius: 10, padding: 12, marginBottom: 10 }}>
              <div style={{ fontSize: 8, fontWeight: 700, marginBottom: 8 }}>Input — state × validation</div>
              <div style={{ display: "flex", gap: 4, marginBottom: 8, flexWrap: "wrap" }}>
                {(["default", "error", "disabled", "success"] as InputState[]).map(s => (
                  <button key={s} onClick={() => setInputState(s)} style={{ fontSize: 7, background: inputState === s ? "#0f172a" : "transparent", border: `1px solid ${inputState === s ? C1_NAVY : "#334155"}`, borderRadius: 5, padding: "3px 8px", cursor: "pointer", color: inputState === s ? "#60a5fa" : "#64748b", fontWeight: 700 }}>{s}</button>
                ))}
              </div>
              <div style={{ background: "#FFFFFF", borderRadius: 8, padding: 12 }}>
                <label style={{ fontSize: 9, fontWeight: 700, color: "#1A1A1A", display: "block", marginBottom: 4 }}>
                  Account Number
                  {inputState === "error" && <span style={{ color: C1_RED, marginLeft: 4 }}>*</span>}
                </label>
                <div style={{ position: "relative" }}>
                  <input
                    value={inputVal} onChange={e => setInputVal(e.target.value)}
                    disabled={inputState === "disabled"}
                    placeholder="Enter 16-digit account number"
                    aria-invalid={inputState === "error"}
                    aria-describedby={inputState === "error" ? "acct-error" : inputState === "success" ? "acct-success" : undefined}
                    style={{
                      width: "100%", boxSizing: "border-box",
                      border: `2px solid ${inputState === "error" ? C1_RED : inputState === "success" ? "#00A36C" : inputState === "default" ? "#9CA3AF" : "#D1D5DB"}`,
                      borderRadius: 6, padding: "8px 36px 8px 10px", fontSize: 10,
                      outline: "none", background: inputState === "disabled" ? "#F9FAFB" : "#fff",
                      color: "#1A1A1A",
                    }}
                  />
                  {inputState === "success" && <span style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", color: "#00A36C", fontSize: 14 }}>✓</span>}
                </div>
                {inputState === "error"   && <div id="acct-error"   role="alert" style={{ fontSize: 8, color: C1_RED,    marginTop: 4 }}>✕ Please enter a valid 16-digit account number</div>}
                {inputState === "success" && <div id="acct-success"              style={{ fontSize: 8, color: "#00A36C", marginTop: 4 }}>✓ Account number verified</div>}
              </div>
            </div>

            {/* Alerts */}
            <div style={{ background: "#1e293b", border: "1px solid #334155", borderRadius: 10, padding: 12, marginBottom: 10 }}>
              <div style={{ fontSize: 8, fontWeight: 700, marginBottom: 8 }}>Alert — financial feedback patterns</div>
              <div style={{ display: "flex", gap: 4, marginBottom: 8 }}>
                {(["success", "warning", "error", "info"] as AlertType[]).map(t => (
                  <button key={t} onClick={() => setAlertType(t)} style={{ flex: 1, fontSize: 7, background: alertType === t ? "#0f172a" : "transparent", border: `1px solid ${alertType === t ? ALERT_CONFIG[t].border : "#334155"}`, borderRadius: 5, padding: "4px", cursor: "pointer", color: alertType === t ? ALERT_CONFIG[t].border : "#64748b", fontWeight: 700 }}>{t}</button>
                ))}
              </div>
              <div style={{ background: ALERT_CONFIG[alertType].bg, border: `1px solid ${ALERT_CONFIG[alertType].border}`, borderLeft: `4px solid ${ALERT_CONFIG[alertType].border}`, borderRadius: 6, padding: "10px 12px", display: "flex", gap: 8 }}>
                <span style={{ color: ALERT_CONFIG[alertType].border, fontSize: 14, flexShrink: 0, fontWeight: 700 }}>{ALERT_CONFIG[alertType].icon}</span>
                <div>
                  <div style={{ fontSize: 9, fontWeight: 700, color: ALERT_CONFIG[alertType].text }}>
                    {alertType === "success" ? "Payment Successful" : alertType === "warning" ? "Payment Due in 3 Days" : alertType === "error" ? "Payment Failed" : "New Account Feature"}
                  </div>
                  <div style={{ fontSize: 8, color: ALERT_CONFIG[alertType].text, marginTop: 2 }}>
                    {alertType === "success" ? "Your payment of $500.00 has been processed and will reflect in 1–2 business days." : alertType === "warning" ? "Your minimum payment of $35 is due on June 21. Avoid late fees by paying on time." : alertType === "error" ? "We couldn't process your payment. Please check your bank account balance and try again." : "You now have access to Capital One Travel portal. Book flights, hotels, and more with rewards."}
                  </div>
                </div>
              </div>
            </div>

            {/* Account Card */}
            <div style={{ background: "#1e293b", border: "1px solid #334155", borderRadius: 10, padding: 12 }}>
              <div style={{ fontSize: 8, fontWeight: 700, marginBottom: 8 }}>Financial Card — account summary</div>
              <div style={{ background: `linear-gradient(135deg, ${C1_NAVY} 0%, #003D8A 100%)`, borderRadius: 12, padding: "16px 18px", color: "#fff", cursor: "pointer", boxShadow: "0 8px 24px rgba(0,45,98,0.4)" }} onClick={() => setActiveCard(activeCard ? null : "venturex")}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
                  <div>
                    <div style={{ fontSize: 8, color: "#94A3B8", marginBottom: 2 }}>CAPITAL ONE</div>
                    <div style={{ fontSize: 11, fontWeight: 700 }}>Venture X Rewards</div>
                  </div>
                  <div style={{ fontSize: 20 }}>✦</div>
                </div>
                <div style={{ fontFamily: "monospace", fontSize: 11, letterSpacing: "0.15em", marginBottom: 16 }}>•••• •••• •••• 4521</div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
                  <div><div style={{ fontSize: 7, color: "#94A3B8" }}>AVAILABLE CREDIT</div><div style={{ fontSize: 15, fontWeight: 800 }}>$6,577.99</div></div>
                  <div><div style={{ fontSize: 7, color: "#94A3B8" }}>REWARDS MILES</div><div style={{ fontSize: 15, fontWeight: 800, color: "#ECB22E" }}>47,322</div></div>
                </div>
              </div>
              {activeCard && <div style={{ marginTop: 8, fontSize: 7, color: "#64748b", textAlign: "center" }}>Card component: keyboard accessible, focus ring visible, aria-label includes masked number</div>}
            </div>
          </div>

          <div>
            <div style={{ fontSize: 10, fontWeight: 700, color: "#64748b", marginBottom: 8, letterSpacing: "0.08em" }}>IMPLEMENTATION DEPTH</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <CodeBlock label="Component API design — flexibility without breaking changes" color={C1_RED} code={
`// CAPITAL ONE DESIGN SYSTEM BUTTON — DESIGN PRINCIPLES
//
// 1. ONE COMPONENT, ALL STATES
// Don't create ButtonLoading, ButtonIcon, ButtonDisabled.
// One Button handles all states via props.
//
// 2. PROP SURFACE AREA: as small as possible.
// Every prop: a potential breaking change.
// Rule: don't add props that can be achieved with children.
//
// 3. POLYMORPHISM: renders as <button> or <a> depending on usage.
// <Button>: submits forms. <Button as="a" href="...">: navigates.
// Browser handles semantics correctly. Screen readers: correct role.

interface ButtonProps {
  variant: "primary" | "secondary" | "ghost" | "destructive";
  size?: "sm" | "md" | "lg";
  loading?: boolean;            // shows spinner, sets aria-busy
  disabled?: boolean;           // also sets aria-disabled (not just disabled attr)
  icon?: React.ReactNode;       // leading icon slot
  iconTrailing?: React.ReactNode; // trailing icon slot
  as?: "button" | "a";         // polymorphic
  href?: string;               // only when as="a"
  onClick?: () => void;
  children: React.ReactNode;
  // NOTE: NO 'className' prop. Tokens handle all styling.
  // WHY: className escape hatch → divergence from design spec.
  // Teams style buttons inconsistently → no longer a design system.
}

// ACCESSIBILITY BUILT-IN, NOT BOLTED ON:
function Button({ variant, size = "md", loading, disabled, ...rest }: ButtonProps) {
  const Component = rest.as || "button";
  return (
    <Component
      disabled={disabled || loading}  // native disabled: removes from tab order
      aria-disabled={disabled || loading}  // screen reader: still reads the label
      aria-busy={loading}              // screen reader: "loading"
      aria-label={loading ? \`\${rest.children} loading\` : undefined}
      // Focus ring: visible by default (CSS custom property)
      // --button-focus-ring: 3px solid var(--color-action-primary)
      // Meets 3:1 contrast requirement for non-text UI components (WCAG 1.4.11)
    >
      {loading && <Spinner aria-hidden="true" />}
      {rest.icon && <span aria-hidden="true">{rest.icon}</span>}
      {rest.children}
      {rest.iconTrailing && <span aria-hidden="true">{rest.iconTrailing}</span>}
    </Component>
  );
}

// WHY aria-disabled vs disabled:
// disabled attribute: element removed from tab order.
// Screen reader user: can't discover the button exists.
// In a financial form: "why can't I submit? Is it broken?"
// aria-disabled: keeps element in tab order. Screen reader: "Submit, dimmed."
// User: knows the button is there but not yet available. They investigate why.
// "Tell users what they can't do. Don't just hide it from them."`} />

              <CodeBlock label="Token-driven component — zero hardcoded values" color={C1_NAVY} code={
`// EVERY STYLING VALUE: a CSS custom property.
// NO hardcoded colours, sizes, or radii.
//
// WHY: the entire system rebrands by changing tokens.
// In 2024: Capital One redesigned their spacing scale.
// Components: changed automatically. Zero PR needed per component.
//
// button.module.css:
.button {
  /* Typography */
  font-size: var(--c1-button-font-size-md);      /* 14px */
  font-weight: var(--c1-font-weight-semibold);   /* 600 */
  font-family: var(--c1-font-family-body);       /* Optimist */
  line-height: var(--c1-line-height-tight);      /* 1.2 */

  /* Spacing — tied to spacing scale, not px values */
  padding: var(--c1-button-padding-y-md) var(--c1-button-padding-x-md); /* 8px 18px */
  gap: var(--c1-spacing-2);                      /* 8px */

  /* Shape */
  border-radius: var(--c1-button-border-radius); /* 6px */
  border: var(--c1-button-border-width) solid transparent; /* 2px */

  /* Focus ring: WCAG 2.1 SC 2.4.7 — focus indicator */
  /* 3:1 contrast ratio against adjacent colours */
  outline-offset: 3px;
  &:focus-visible {
    outline: 3px solid var(--c1-color-focus-ring); /* navy, 3px, visible */
  }
}

.primary {
  background: var(--c1-button-primary-bg);          /* --color-action-primary */
  color: var(--c1-button-primary-text);             /* --color-text-inverse */
  border-color: var(--c1-button-primary-bg);

  &:hover:not(:disabled) {
    background: var(--c1-button-primary-hover);     /* slightly darker red */
  }
}

/* White-label override (partner bank): */
/* .partner-theme { --c1-color-action-primary: #004B87; } */
/* The .primary button: automatically renders in partner blue. */
/* Zero component changes. */

// PIXEL-PERFECT IMPLEMENTATION PROCESS:
// 1. Figma: designer exports component specs (spacing, radius, colour tokens).
// 2. Dev: component built referencing those exact token names.
// 3. Visual regression: Chromatic compares screenshot vs Figma spec.
// 4. Acceptance: designer reviews in Chromatic before merge.
// 5. Result: pixel-exact parity. "Pixel-perfect" is a process, not just effort.`} />
            </div>
          </div>
        </div>
      )}

      {/* ── ACCESSIBILITY ── */}
      {activeTab === "a11y" && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
          <div>
            <div style={{ fontSize: 10, fontWeight: 700, color: "#64748b", marginBottom: 8, letterSpacing: "0.08em" }}>ACCESSIBILITY — FINANCIAL SERVICES A11Y REQUIREMENTS</div>

            {/* ARIA live region */}
            {liveMsg && (
              <div role="status" aria-live="polite" style={{ background: "#1264A320", border: "1px solid #1264A3", borderRadius: 8, padding: "7px 12px", marginBottom: 10, fontSize: 9, color: "#60A5FA", fontWeight: 700 }}>
                📢 Screen reader announces: "{liveMsg}"
              </div>
            )}

            {/* Contrast checker */}
            <div style={{ background: "#1e293b", border: "1px solid #334155", borderRadius: 10, padding: 12, marginBottom: 10 }}>
              <div style={{ fontSize: 8, fontWeight: 700, marginBottom: 8 }}>🎨 Colour Contrast Checker — WCAG 2.1</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 8 }}>
                <div>
                  <label style={{ fontSize: 7, color: "#64748b", display: "block", marginBottom: 3 }}>Foreground</label>
                  <div style={{ display: "flex", gap: 5, alignItems: "center" }}>
                    <input type="color" value={fgColor} onChange={e => setFgColor(e.target.value)} style={{ width: 28, height: 28, border: "none", cursor: "pointer", borderRadius: 5 }} />
                    <span style={{ fontSize: 8, fontFamily: "monospace", color: "#94a3b8" }}>{fgColor}</span>
                  </div>
                </div>
                <div>
                  <label style={{ fontSize: 7, color: "#64748b", display: "block", marginBottom: 3 }}>Background</label>
                  <div style={{ display: "flex", gap: 5, alignItems: "center" }}>
                    <input type="color" value={bgColor} onChange={e => setBgColor(e.target.value)} style={{ width: 28, height: 28, border: "none", cursor: "pointer", borderRadius: 5 }} />
                    <span style={{ fontSize: 8, fontFamily: "monospace", color: "#94a3b8" }}>{bgColor}</span>
                  </div>
                </div>
              </div>
              <div style={{ background: bgColor, borderRadius: 8, padding: "10px 12px", marginBottom: 8, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <span style={{ color: fgColor, fontSize: isLargeText ? 14 : 10, fontWeight: isLargeText ? 700 : 400 }}>
                  {isLargeText ? "Large text sample" : "Normal text sample (14px)"}
                </span>
                <button onClick={() => setIsLargeText(l => !l)} style={{ fontSize: 7, background: "rgba(255,255,255,0.2)", border: "none", borderRadius: 5, padding: "3px 8px", cursor: "pointer", color: fgColor }}>Toggle large</button>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <div style={{ fontSize: 20, fontWeight: 900, color: wcag.color }}>{contrastRatio}:1</div>
                  <div style={{ fontSize: 8, color: "#64748b" }}>Contrast ratio</div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: 16, fontWeight: 700, color: wcag.color }}>{wcag.level}</div>
                  <div style={{ fontSize: 8, color: "#64748b" }}>WCAG 2.1 {isLargeText ? "(large text: ≥3:1)" : "(normal text: ≥4.5:1)"}</div>
                </div>
              </div>
              <div style={{ marginTop: 8, display: "flex", gap: 4, flexWrap: "wrap" }}>
                {[["White on Red", "#FFFFFF", C1_RED], ["Red on White", C1_RED, "#FFFFFF"], ["Navy on White", C1_NAVY, "#FFFFFF"], ["White on Navy", "#FFFFFF", C1_NAVY]].map(([label, fg, bg]) => (
                  <button key={label} onClick={() => { setFgColor(fg); setBgColor(bg); announce(`Contrast check: ${label}`); }} style={{ fontSize: 7, background: bg, color: fg, border: `1px solid ${fg}30`, borderRadius: 5, padding: "3px 8px", cursor: "pointer" }}>{label}</button>
                ))}
              </div>
            </div>

            {/* Keyboard navigation in table */}
            <div style={{ background: "#1e293b", border: "1px solid #334155", borderRadius: 10, padding: 12 }}>
              <div style={{ fontSize: 8, fontWeight: 700, marginBottom: 4 }}>⌨️ Transaction Table — Keyboard Navigation (Arrow ↑↓, Esc)</div>
              <div style={{ fontSize: 7, color: "#475569", marginBottom: 8 }}>Click a row to focus, then use Arrow keys. Screen reader announces row details.</div>
              <div ref={tableRef} role="grid" aria-label="Transaction history" style={{ borderRadius: 8, overflow: "hidden", border: "1px solid #334155" }}>
                <div role="row" style={{ display: "grid", gridTemplateColumns: "60px 1fr 80px 80px 60px", background: "#0f172a", padding: "5px 8px", fontSize: 7, fontWeight: 700, color: "#64748b" }}>
                  <span role="columnheader">Date</span><span role="columnheader">Merchant</span><span role="columnheader" style={{ textAlign: "right" }}>Amount</span><span role="columnheader" style={{ textAlign: "right" }}>Balance</span><span role="columnheader">Status</span>
                </div>
                {TRANSACTIONS.map((tx, idx) => (
                  <div key={tx.id} role="row" tabIndex={0} aria-selected={focusedRow === idx} aria-label={`${tx.date}, ${tx.merchant}, ${tx.amount < 0 ? "debit" : "credit"} ${Math.abs(tx.amount).toFixed(2)} dollars, balance ${tx.balance.toFixed(2)}`}
                    onClick={() => { setFocusedRow(idx); announce(`${tx.merchant}: ${tx.amount < 0 ? "debit" : "credit"} $${Math.abs(tx.amount).toFixed(2)}, balance $${tx.balance.toFixed(2)}`); }}
                    onKeyDown={e => handleTableKeyDown(e, idx)}
                    style={{ display: "grid", gridTemplateColumns: "60px 1fr 80px 80px 60px", padding: "6px 8px", fontSize: 8, background: focusedRow === idx ? `${C1_NAVY}30` : idx % 2 === 0 ? "#1e293b" : "#19263a", outline: focusedRow === idx ? `2px solid ${C1_NAVY}` : "none", outlineOffset: -2, cursor: "pointer" }}>
                    <span style={{ color: "#64748b" }}>{tx.date}</span>
                    <span style={{ color: "#f1f5f9" }}>{tx.merchant}</span>
                    <span style={{ textAlign: "right", color: tx.amount < 0 ? "#f87171" : "#4ade80", fontFamily: "monospace", fontWeight: 700 }}>{tx.amount < 0 ? "-" : "+"}${Math.abs(tx.amount).toFixed(2)}</span>
                    <span style={{ textAlign: "right", color: "#94a3b8", fontFamily: "monospace" }}>${tx.balance.toFixed(2)}</span>
                    <span style={{ color: tx.status === "pending" ? "#ECB22E" : "#4ade80", fontSize: 7 }}>{tx.status}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div>
            <div style={{ fontSize: 10, fontWeight: 700, color: "#64748b", marginBottom: 8, letterSpacing: "0.08em" }}>IMPLEMENTATION DEPTH</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <CodeBlock label="Financial services a11y — extra requirements beyond WCAG" color={C1_RED} code={
`// FINANCIAL SERVICES: accessibility is a legal requirement, not optional.
// ADA (Americans with Disabilities Act) + Section 508 (US federal contracts).
// Capital One: serves millions of customers. Many rely on assistive technology.
//
// WCAG 2.1 AA REQUIREMENTS WE ENFORCE IN THE DESIGN SYSTEM:
//
// 1.4.3  CONTRAST — text: ≥4.5:1 normal, ≥3:1 large
//        Financial data: ALWAYS normal-weight. NEVER use light grey for amounts.
//        "The colour of red for debit: #D03027. Contrast on white: 5.1:1. ✓"
//
// 1.4.11 NON-TEXT CONTRAST — UI components: ≥3:1
//        Button borders, input borders, icons: must meet 3:1.
//        Our input border #9CA3AF on #FFFFFF: 2.85:1. Increased to #6B7280: 4.5:1.
//        "The original design: failed non-text contrast. We caught it in review."
//
// 2.5.3  LABEL IN NAME — for voice control users (Dragon NaturallySpeaking)
//        The accessible name MUST contain the visible label text.
//        WRONG: aria-label="Submit button" on button that says "Pay Now"
//        RIGHT: aria-label="Pay Now — confirm $500 payment" (starts with visible text)
//        Voice user says "Click Pay Now" → Dragon finds the button by its label.
//
// FINANCIAL-SPECIFIC PATTERNS:
//
// A. MONETARY AMOUNTS — screen reader optimisation
// $1,234.56 → screen reader: "one thousand two hundred thirty four point fifty six"
// We WANT: "one thousand two hundred thirty-four dollars and fifty-six cents"
//
// Solution: aria-label on amount containers:
const Amount = ({ value, currency = "USD" }) => {
  const dollars = Math.floor(Math.abs(value));
  const cents   = Math.round((Math.abs(value) % 1) * 100);
  const label   = \`\${value < 0 ? "negative " : ""}\${dollars} dollars and \${cents} cents\`;
  return (
    <span aria-label={label}>
      {value < 0 ? "-" : ""}${value.toFixed(2)}
    </span>
  );
};

// B. ACCOUNT NUMBERS — never read full, masked version for security
// Displayed: **** **** **** 4521
// Screen reader reads: "account ending in 4521" — not the full number character by character
<span aria-label="Venture X Rewards card, account ending in 4521">
  •••• •••• •••• 4521
</span>

// C. LIVE BALANCE UPDATES — real-time updates announced appropriately
// Using role="status" + aria-live="polite":
// Polite: waits for screen reader to finish current task before announcing.
// NOT assertive: don't interrupt if user is in the middle of reading a form.
<div role="status" aria-live="polite" aria-atomic="true"
     aria-label="Current balance">
  $6,577.99 available credit
</div>
// When balance updates: screen reader announces "6,577.99 available credit" automatically.`} />

              <CodeBlock label="Data table keyboard navigation — WAI-ARIA grid pattern" color={C1_NAVY} code={
`// FINANCIAL DATA TABLES: the hardest accessibility challenge in fintech.
// Requirements: keyboard navigable, sortable, filterable, with live data.
//
// WAI-ARIA GRID PATTERN (not 'table' — grid allows interactive cells):
// role="grid"         — container
// role="row"          — each row
// role="columnheader" — header cells (with aria-sort)
// role="gridcell"     — data cells
// aria-rowcount, aria-colcount — for virtual/paginated tables
//
// KEYBOARD CONTRACT:
// Arrow keys:    navigate cells
// Enter/F2:      enter cell edit mode (if editable)
// Escape:        exit edit mode
// Tab:           move focus out of grid to next landmark
// Home/End:      first/last cell in row
// Ctrl+Home/End: first/last cell in grid

function TransactionTable({ transactions }) {
  const [focusedCell, setFocusedCell] = useState({ row: 0, col: 0 });
  const [sortCol, setSortCol]         = useState("date");
  const [sortDir, setSortDir]         = useState<"ascending" | "descending">("descending");

  const handleKeyDown = (e: KeyboardEvent, row: number, col: number) => {
    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setFocusedCell({ row: Math.min(row + 1, transactions.length - 1), col });
        announce(\`Row \${row + 2}: \${transactions[row + 1]?.merchant}\`);
        break;
      case "ArrowUp":
        e.preventDefault();
        setFocusedCell({ row: Math.max(row - 1, 0), col });
        break;
      case "Home":
        e.preventDefault();
        setFocusedCell({ row, col: 0 }); // first cell in row
        break;
      case "End":
        e.preventDefault();
        setFocusedCell({ row, col: COLS.length - 1 }); // last cell in row
        break;
    }
  };

  return (
    <div role="grid" aria-label="Transaction history"
         aria-rowcount={transactions.length + 1}
         aria-colcount={5}>
      <div role="row" aria-rowindex={1}>
        {COLS.map((col, i) => (
          <button role="columnheader"
            key={col.key}
            aria-sort={sortCol === col.key ? sortDir : "none"}
            onClick={() => {
              setSortDir(sortCol === col.key && sortDir === "ascending" ? "descending" : "ascending");
              setSortCol(col.key);
              announce(\`Sorted by \${col.label} \${sortDir}\`);
            }}>
            {col.label}
            {/* Visual sort indicator: aria-hidden (announced by aria-sort already) */}
            <span aria-hidden="true">
              {sortCol === col.key ? (sortDir === "ascending" ? " ↑" : " ↓") : " ↕"}
            </span>
          </button>
        ))}
      </div>
      {transactions.map((tx, row) => (
        <div key={tx.id} role="row" aria-rowindex={row + 2}>
          {COLS.map((col, colIdx) => (
            <div role="gridcell" key={col.key}
              tabIndex={focusedCell.row === row && focusedCell.col === colIdx ? 0 : -1}
              onKeyDown={e => handleKeyDown(e, row, colIdx)}
              onFocus={() => setFocusedCell({ row, col: colIdx })}>
              {col.render(tx)}
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

// "Roving tabindex" pattern: only ONE cell in the grid is tabIndex=0.
// Other cells: tabIndex=-1 (can be focused programmatically, not via Tab).
// Result: Tab enters the grid (to the focused cell) and exits it in one press.
// Arrow keys: navigate within. Tab: out. Single Tab stop for the whole table.`} />
            </div>
          </div>
        </div>
      )}

      {/* ── ENGINEERING ── */}
      {activeTab === "eng" && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
          <div>
            <div style={{ fontSize: 10, fontWeight: 700, color: "#64748b", marginBottom: 8, letterSpacing: "0.08em" }}>ENGINEERING SYSTEM — VERSIONING · BUNDLING · VISUAL REGRESSION</div>

            {/* Bundle analysis */}
            <div style={{ background: "#1e293b", border: "1px solid #334155", borderRadius: 10, padding: 12, marginBottom: 10 }}>
              <div style={{ fontSize: 8, fontWeight: 700, marginBottom: 8 }}>📦 Bundle Size Per Component (tree-shakeable)</div>
              {BUNDLE_DATA.map(c => (
                <div key={c.name} style={{ marginBottom: 7 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3, fontSize: 8 }}>
                    <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                      <span style={{ color: "#f1f5f9", fontWeight: 700, width: 80 }}>{c.name}</span>
                      <span style={{ fontSize: 7, background: c.a11y ? "#2BAC7620" : "#E01E5A20", color: c.a11y ? "#2BAC76" : "#E01E5A", borderRadius: 3, padding: "1px 5px" }}>{c.a11y ? "✓ a11y" : "⚠ a11y"}</span>
                      <span style={{ fontSize: 7, background: c.visual ? "#1264A320" : "#E01E5A20", color: c.visual ? "#60A5FA" : "#E01E5A", borderRadius: 3, padding: "1px 5px" }}>{c.visual ? "✓ visual" : "⚠ visual"}</span>
                    </div>
                    <span style={{ color: "#64748b", fontFamily: "monospace" }}>{c.gzip}KB gzip</span>
                  </div>
                  <div style={{ background: "#0f172a", borderRadius: 2, height: 6, overflow: "hidden" }}>
                    <div style={{ background: c.size > 10 ? "#ECB22E" : C1_RED, width: `${(c.size / 15) * 100}%`, height: "100%", borderRadius: 2 }} />
                  </div>
                </div>
              ))}
              <div style={{ marginTop: 6, fontSize: 7, color: "#475569", background: "#0f172a", borderRadius: 5, padding: "5px 8px" }}>
                Import only what you use: <code style={{ background: "#1e293b", borderRadius: 3, padding: "1px 5px", fontSize: 7 }}>import {"{ Button }"} from '@c1/design-system'</code> — zero penalty for unused components (tree-shaking via ESM).
              </div>
            </div>

            {/* Changelog */}
            <div style={{ background: "#1e293b", border: "1px solid #334155", borderRadius: 10, padding: 12, marginBottom: 10 }}>
              <div style={{ fontSize: 8, fontWeight: 700, marginBottom: 8 }}>📋 Semantic Versioning — Changelog</div>
              {CHANGELOG.map(entry => (
                <div key={entry.version} style={{ display: "flex", gap: 8, padding: "6px 8px", borderBottom: "1px solid #0f172a", marginBottom: 4 }}>
                  <div style={{ flexShrink: 0 }}>
                    <span style={{ fontSize: 8, fontFamily: "monospace", fontWeight: 700, color: VERSION_COLOR[entry.type] }}>{entry.version}</span>
                    <span style={{ display: "block", fontSize: 7, background: `${VERSION_COLOR[entry.type]}20`, color: VERSION_COLOR[entry.type], borderRadius: 3, padding: "1px 4px", marginTop: 1, textAlign: "center" }}>{entry.type}</span>
                  </div>
                  <div>
                    <div style={{ fontSize: 7, color: "#475569", marginBottom: 2 }}>{entry.date}</div>
                    <div style={{ fontSize: 8, color: "#94a3b8" }}>{entry.note}</div>
                  </div>
                </div>
              ))}
            </div>

            {/* Visual regression */}
            <div style={{ background: "#1e293b", border: "1px solid #334155", borderRadius: 10, padding: 10 }}>
              <div style={{ fontSize: 8, fontWeight: 700, marginBottom: 6 }}>🖼 Visual Regression — Chromatic</div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 5 }}>
                {[
                  { name: "Button/primary",   status: "approved" },
                  { name: "Button/secondary", status: "approved" },
                  { name: "Input/error",      status: "pending"  },
                  { name: "Alert/warning",    status: "approved" },
                  { name: "Card/account",     status: "change"   },
                  { name: "Table/sort",       status: "approved" },
                ].map(s => (
                  <div key={s.name} style={{ background: "#0f172a", borderRadius: 5, padding: "5px 7px" }}>
                    <div style={{ width: "100%", height: 28, background: s.status === "approved" ? "#2BAC7615" : s.status === "change" ? "#ECB22E15" : "#1264A315", borderRadius: 3, marginBottom: 4, border: `1px solid ${s.status === "approved" ? "#2BAC7630" : s.status === "change" ? "#ECB22E30" : "#1264A330"}` }} />
                    <div style={{ fontSize: 6, color: "#64748b", marginBottom: 2 }}>{s.name}</div>
                    <span style={{ fontSize: 6, background: s.status === "approved" ? "#2BAC7620" : s.status === "change" ? "#ECB22E20" : "#1264A320", color: s.status === "approved" ? "#2BAC76" : s.status === "change" ? "#ECB22E" : "#60A5FA", borderRadius: 3, padding: "1px 5px" }}>{s.status}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div>
            <div style={{ fontSize: 10, fontWeight: 700, color: "#64748b", marginBottom: 8, letterSpacing: "0.08em" }}>IMPLEMENTATION DEPTH</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <CodeBlock label="Semantic versioning — breaking change process for enterprise" color={C1_RED} code={
`// ENTERPRISE DESIGN SYSTEM VERSIONING:
// 50+ consuming teams. A breaking change: must be managed carefully.
// "We can't just change an API and tell teams to deal with it."
//
// SEMVER:
//   MAJOR (v4.0.0): breaking change — teams must update their code.
//   MINOR (v4.1.0): new features, backward compatible.
//   PATCH (v4.1.1): bug fixes, backward compatible.
//
// BREAKING CHANGE PROCESS (what I own as lead):
//
// STEP 1: RFC — propose the breaking change.
//   Document: what changes, why, migration path, timeline.
//   Review: all consuming team leads. Consensus required.
//   "We renamed colorPrimary → color-action-primary.
//    RFC: reviewed by 12 team leads. Feedback: 3 rounds.
//    Final agreement: 8 weeks migration window."
//
// STEP 2: DEPRECATION — mark old API as deprecated in MINOR.
//   v4.0.0-rc: colorPrimary still works, but logs deprecation warning.
//   Deprecation warning: includes exact replacement + documentation link.
//   console.warn(\`[c1-design-system] 'colorPrimary' is deprecated.
//     Use 'color-action-primary' instead. Migration guide: ↗ docs.c1ds.io/migration/v4\`);
//
// STEP 3: CODEMOD — automated migration tool.
//   Teams run: npx @c1/codemod v4-migration
//   Codemod: finds and replaces all usage automatically.
//   "Most teams: zero manual changes. Codemod handles 95% of cases."
//   Residual 5%: dynamic usages that can't be automated → documented in guide.
//
// STEP 4: MAJOR RELEASE — remove deprecated API.
//   v4.0.0: colorPrimary removed.
//   Migration guide: docs, codemod, before/after examples.
//   Support window: 6 months both versions co-supported.
//   "Teams that haven't migrated: still on v3.x. v3.x: still receives patches.
//    No team: forced to migrate on our schedule."
//
// WHY CODEMODS MATTER:
// A 12-member team: 200 files using colorPrimary.
// Manual: 200 find-and-replace. 2 days. Error-prone.
// Codemod: 30 seconds. Zero errors. PR created automatically.
// The design system team: provides the codemod WITH the migration.
// Not just "here's what changed" but "here's the tool to fix it."`} />

              <CodeBlock label="Contribution model — how enterprise teams contribute components" color={C1_NAVY} code={
`// CONTRIBUTION MODEL: how does a design system stay consistent
// when 50 teams want to add components?
//
// GOVERNANCE TIERS:
//
// TIER 1: CORE (owned by design system team):
//   Button, Input, Modal, Table, Alert, Badge, Card.
//   Stable API. Versioned. Fully tested. a11y-reviewed.
//   50+ teams depend on these. Change: full RFC process.
//
// TIER 2: EXTENDED (contributed by product teams, reviewed by us):
//   Components too specific for Core, but reusable.
//   Example: AccountSummaryCard, TransactionRow, PaymentForm.
//   Contribution process:
//     1. Product team: builds component, opens contribution PR.
//     2. Design system team: reviews API design, a11y, visual parity.
//     3. We: add to Storybook under "Extended" category.
//     4. Maintenance: shared. Original team + design system team.
//
// TIER 3: LOCAL (product-team-owned, not in design system):
//   One-off components. Too specific. Not worth the overhead.
//   Rule: if 3+ teams need it → promote to Tier 2.
//
// THE CONTRIBUTION CHECKLIST (we require for every PR):
// ☐ Component API documented (props, types, defaults, examples)
// ☐ Storybook story with all variants + states
// ☐ Zero aXe violations (axe-core run in story tests)
// ☐ Keyboard accessible (Tab in, Enter/Space activate, Escape dismiss)
// ☐ ARIA roles/attributes (WAI-ARIA Authoring Practices spec)
// ☐ Focus ring visible (meets 3:1 non-text contrast)
// ☐ Visual regression approved in Chromatic
// ☐ Bundle size within budget (<5KB gzip for simple components)
// ☐ i18n: no hardcoded strings (all text via props)
// ☐ RTL support (CSS logical properties where applicable)
//
// STORYBOOK AS THE DESIGN CONTRACT:
// Each component: Storybook story = the "spec" designers review.
// Designer review: happens IN Storybook (Chromatic review UI).
// If Storybook matches Figma: the component ships.
// "Pixel-perfect" means Storybook screenshot ≡ Figma frame.
// Chromatic: compares screenshots pixel by pixel. Delta highlighted.
// Designer: approves or requests changes directly in Chromatic.
//
// DOCUMENTATION PHILOSOPHY:
// "Docs closest to the code: most likely to be accurate."
// We write docs as JSDoc + MDX stories. Auto-generated from code.
// Stale docs: a team quality issue (CI fails if docs don't build).
// "A design system without accurate docs: not a design system. It's a component dump."`} />
            </div>
          </div>
        </div>
      )}

      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

export default CapitalOneDesignSystemDemo;
