/**
 * DocusaurusAdsDemo.tsx
 *
 * Facebook Engineering — Docusaurus & Ads Front-End Infrastructure
 *
 * 1. DOCUSAURUS — Lead maintainer + v2 alpha conceptualiser
 *    Open Source project by Facebook.
 *    v1 vs v2 comparison, MDX, plugin system, ecosystem.
 *
 * 2. ADS FRONT-END INFRA — State management tools
 *    Flux → Redux → Relay evolution at Facebook Ads scale.
 *    Campaign/AdSet/Ad hierarchy, real-time state tree,
 *    undo/redo middleware, Relay fragment colocation.
 *
 * TABS
 *   📚 Docusaurus   — architecture, MDX demo, v2 innovations, who uses it
 *   🎯 Ads State    — campaign form, live Redux state tree, action log, undo/redo
 */

import React, { useState, useCallback, useReducer, useRef } from "react";

// ─────────────────────────────────────────────────────────────────
// Docusaurus data
// ─────────────────────────────────────────────────────────────────

const DOCUSAURUS_USERS = [
  { name: "React",       logo: "⚛️",  note: "Facebook's flagship OSS project"   },
  { name: "Jest",        logo: "🃏",  note: "JavaScript testing framework"       },
  { name: "Redux",       logo: "🔄",  note: "State management library"           },
  { name: "Babel",       logo: "🐠",  note: "JavaScript compiler"               },
  { name: "Supabase",    logo: "⚡",  note: "Open source Firebase alternative"  },
  { name: "Ionic",       logo: "📱",  note: "Cross-platform mobile framework"   },
  { name: "React Native",logo: "📲",  note: "Mobile apps with React"            },
  { name: "Create React App", logo: "🏗",  note: "React bootstrapping tool"    },
  { name: "Prettier",    logo: "🎨",  note: "Opinionated code formatter"        },
  { name: "React Router",logo: "🧭",  note: "Routing for React apps"           },
  { name: "Deno",        logo: "🦕",  note: "JavaScript/TypeScript runtime"    },
  { name: "Figma Plugins",logo: "🖼",  note: "Plugin development docs"         },
];

const V1_VS_V2 = [
  { aspect: "Architecture",   v1: "Gatsby-based (indirect dependency)", v2: "Custom webpack pipeline — built from scratch" },
  { aspect: "Content format", v1: "Markdown only",                      v2: "MDX — JSX components inside Markdown" },
  { aspect: "Plugins",        v1: "Monolithic — no plugin system",       v2: "Everything is a plugin: docs, blog, search, analytics" },
  { aspect: "Theming",        v1: "Global CSS overrides (fragile)",      v2: "CSS variables + component swizzling" },
  { aspect: "TypeScript",     v1: "JavaScript only",                     v2: "First-class TypeScript support" },
  { aspect: "i18n",           v1: "Manual / DIY",                        v2: "Built-in i18n with locale routing" },
  { aspect: "Versioned docs", v1: "Separate directories (manual)",       v2: "Automated versioning via CLI" },
  { aspect: "Performance",    v1: "Gatsby overhead",                     v2: "Optimised static generation, faster builds" },
];

const PLUGINS = [
  { name: "@docusaurus/plugin-content-docs",  icon: "📖", desc: "Docs pages, versioning, sidebars" },
  { name: "@docusaurus/plugin-content-blog",  icon: "✍️",  desc: "Blog posts, authors, RSS feed"   },
  { name: "@docusaurus/plugin-sitemap",        icon: "🗺",  desc: "Auto-generated sitemap.xml"      },
  { name: "@docusaurus/plugin-google-analytics", icon: "📊", desc: "GA4 + GTM integration"         },
  { name: "@docusaurus/plugin-search-local",  icon: "🔍", desc: "Offline full-text search (Lunr)"  },
  { name: "community: plugin-typedoc",        icon: "📐", desc: "TypeDoc API reference generation" },
];

// ─────────────────────────────────────────────────────────────────
// Ads state management
// ─────────────────────────────────────────────────────────────────

type Objective = "awareness" | "traffic" | "engagement" | "leads" | "conversions" | "sales";
type BudgetType = "daily" | "lifetime";
type Placement = "feed" | "stories" | "reels" | "messenger" | "audience_network";

interface Campaign {
  name: string; objective: Objective; budgetType: BudgetType; budgetAmount: number;
}
interface AdSet {
  name: string; placements: Placement[]; audienceSize: number;
  ageMin: number; ageMax: number; genders: string[];
}
interface Ad {
  name: string; headline: string; body: string; cta: string;
}
interface AdsState {
  campaign: Campaign; adSet: AdSet; ad: Ad;
  past: { campaign: Campaign; adSet: AdSet; ad: Ad }[];
  future: { campaign: Campaign; adSet: AdSet; ad: Ad }[];
  actionLog: { type: string; timestamp: string }[];
}

type AdsAction =
  | { type: "UPDATE_CAMPAIGN"; payload: Partial<Campaign> }
  | { type: "UPDATE_ADSET"; payload: Partial<AdSet> }
  | { type: "UPDATE_AD"; payload: Partial<Ad> }
  | { type: "TOGGLE_PLACEMENT"; payload: Placement }
  | { type: "UNDO" }
  | { type: "REDO" };

const DEFAULT_CAMPAIGN: Campaign = { name: "", objective: "conversions", budgetType: "daily", budgetAmount: 50 };
const DEFAULT_ADSET: AdSet = { name: "", placements: ["feed"], audienceSize: 2400000, ageMin: 25, ageMax: 54, genders: ["M", "F"] };
const DEFAULT_AD: Ad = { name: "", headline: "Discover something new", body: "Limited time offer. Shop now.", cta: "Shop Now" };

const INITIAL_ADS_STATE: AdsState = {
  campaign: DEFAULT_CAMPAIGN, adSet: DEFAULT_ADSET, ad: DEFAULT_AD,
  past: [], future: [], actionLog: [],
};

function timestamp() { return new Date().toLocaleTimeString("en-GB", { hour12: false }); }

function snapshot(s: AdsState) { return { campaign: s.campaign, adSet: s.adSet, ad: s.ad }; }

function adsReducer(state: AdsState, action: AdsAction): AdsState {
  switch (action.type) {
    case "UPDATE_CAMPAIGN":
      return { ...state, past: [...state.past.slice(-9), snapshot(state)], future: [],
        campaign: { ...state.campaign, ...action.payload },
        actionLog: [...state.actionLog, { type: action.type, timestamp: timestamp() }].slice(-8) };
    case "UPDATE_ADSET":
      return { ...state, past: [...state.past.slice(-9), snapshot(state)], future: [],
        adSet: { ...state.adSet, ...action.payload },
        actionLog: [...state.actionLog, { type: action.type, timestamp: timestamp() }].slice(-8) };
    case "UPDATE_AD":
      return { ...state, past: [...state.past.slice(-9), snapshot(state)], future: [],
        ad: { ...state.ad, ...action.payload },
        actionLog: [...state.actionLog, { type: action.type, timestamp: timestamp() }].slice(-8) };
    case "TOGGLE_PLACEMENT": {
      const has = state.adSet.placements.includes(action.payload);
      const placements = has
        ? state.adSet.placements.filter(p => p !== action.payload)
        : [...state.adSet.placements, action.payload];
      return { ...state, past: [...state.past.slice(-9), snapshot(state)], future: [],
        adSet: { ...state.adSet, placements },
        actionLog: [...state.actionLog, { type: "TOGGLE_PLACEMENT:" + action.payload, timestamp: timestamp() }].slice(-8) };
    }
    case "UNDO": {
      if (!state.past.length) return state;
      const prev = state.past[state.past.length - 1];
      return { ...state, past: state.past.slice(0, -1), future: [snapshot(state), ...state.future],
        ...prev,
        actionLog: [...state.actionLog, { type: "UNDO", timestamp: timestamp() }].slice(-8) };
    }
    case "REDO": {
      if (!state.future.length) return state;
      const next = state.future[0];
      return { ...state, future: state.future.slice(1), past: [...state.past, snapshot(state)],
        ...next,
        actionLog: [...state.actionLog, { type: "REDO", timestamp: timestamp() }].slice(-8) };
    }
    default: return state;
  }
}

// ─────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────

function CodeBlock({ code, label, color = "#64748b" }: { code: string; label?: string; color?: string }) {
  return (
    <div style={{ background: "#0f172a", borderRadius: 8, overflow: "hidden", border: "1px solid #1e293b" }}>
      {label && <div style={{ padding: "5px 12px", borderBottom: "1px solid #1e293b", fontSize: 10, color }}>{label}</div>}
      <pre style={{ margin: 0, padding: 12, fontSize: 10, fontFamily: "monospace", color: "#94a3b8", lineHeight: 1.7, overflow: "auto", maxHeight: 340 }}>{code}</pre>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
// Main
// ─────────────────────────────────────────────────────────────────

export function DocusaurusAdsDemo() {
  const [activeTab, setActiveTab] = useState<"docusaurus" | "ads">("docusaurus");

  // Docusaurus sub-state
  const [docSection, setDocSection] = useState<"arch" | "mdx" | "ecosystem">("arch");
  const [v2Highlighted, setV2Highlighted] = useState(true);

  // Ads state
  const [adsState, dispatch] = useReducer(adsReducer, INITIAL_ADS_STATE);
  const [adsSection, setAdsSection] = useState<"form" | "state" | "tools">("form");

  const canUndo = adsState.past.length > 0;
  const canRedo = adsState.future.length > 0;

  const TABS = [
    { id: "docusaurus" as const, label: "📚 Docusaurus"   },
    { id: "ads"        as const, label: "🎯 Ads State"     },
  ];

  return (
    <div style={{ background: "#0f172a", color: "#f1f5f9", fontFamily: "'Inter', system-ui, sans-serif", minHeight: "100vh", padding: 24 }}>

      {/* Header */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
          <span style={{ fontSize: 28 }}>🔵</span>
          <div>
            <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800 }}>Facebook Engineering</h1>
            <p style={{ margin: 0, color: "#64748b", fontSize: 13 }}>
              Docusaurus Lead Maintainer · v2 Alpha · Ads Front-End Infra State Management
            </p>
          </div>
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {["Docusaurus", "Open Source", "MDX", "Plugin Architecture", "React", "Relay", "GraphQL", "Redux", "Flux", "Jest", "Flow", "Hack"].map(t => (
            <span key={t} style={{ background: "#1e293b", color: "#94a3b8", border: "1px solid #334155", borderRadius: 20, padding: "3px 10px", fontSize: 11 }}>{t}</span>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 4, marginBottom: 20, borderBottom: "1px solid #1e293b", paddingBottom: 4 }}>
        {TABS.map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{
            background: activeTab === tab.id ? "#1e293b" : "transparent",
            color: activeTab === tab.id ? "#f1f5f9" : "#64748b",
            border: activeTab === tab.id ? "1px solid #334155" : "1px solid transparent",
            borderRadius: "8px 8px 0 0", padding: "8px 20px", cursor: "pointer", fontSize: 13, fontWeight: 600,
          }}>{tab.label}</button>
        ))}
      </div>

      {/* ── DOCUSAURUS ── */}
      {activeTab === "docusaurus" && (
        <div>
          {/* Context banner */}
          <div style={{ background: "#1e293b", border: "1px solid #3b82f620", borderRadius: 10, padding: 14, marginBottom: 14, display: "flex", gap: 14 }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: "#60a5fa", marginBottom: 4 }}>Lead Maintainer · Docusaurus</div>
              <div style={{ fontSize: 11, color: "#94a3b8", lineHeight: 1.7 }}>
                Open Source project by Facebook. Thousands of teams use it to build documentation websites.
                Role: reviewing PRs, architectural decisions, community leadership, and — critically — conceptualising and building the entire v2 alpha from the ground up.
              </div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 6, minWidth: 160 }}>
              {[{ label: "GitHub stars", value: "57k+", color: "#f59e0b" }, { label: "npm downloads/week", value: "3M+", color: "#4ade80" }, { label: "OSS sites powered", value: "50k+", color: "#a855f7" }].map(m => (
                <div key={m.label} style={{ background: "#0f172a", borderRadius: 6, padding: "6px 10px" }}>
                  <div style={{ fontSize: 9, color: "#64748b" }}>{m.label}</div>
                  <div style={{ fontSize: 14, fontWeight: 800, color: m.color }}>{m.value}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Sub-nav */}
          <div style={{ display: "flex", gap: 6, marginBottom: 14 }}>
            {([["arch", "🏗 Architecture"], ["mdx", "📝 MDX Demo"], ["ecosystem", "🌐 Ecosystem"]] as const).map(([id, label]) => (
              <button key={id} onClick={() => setDocSection(id)} style={{
                background: docSection === id ? "#1e293b" : "transparent",
                border: `1px solid ${docSection === id ? "#334155" : "transparent"}`,
                borderRadius: 8, padding: "7px 14px", cursor: "pointer", color: docSection === id ? "#f1f5f9" : "#64748b", fontSize: 12,
              }}>{label}</button>
            ))}
          </div>

          {/* ARCHITECTURE */}
          {docSection === "arch" && (
            <div>
              <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 10 }}>
                <div style={{ fontSize: 10, color: "#64748b" }}>Compare:</div>
                <button onClick={() => setV2Highlighted(!v2Highlighted)} style={{ background: v2Highlighted ? "#3b82f620" : "#ef444420", border: `1px solid ${v2Highlighted ? "#3b82f6" : "#ef4444"}`, borderRadius: 20, padding: "3px 12px", color: v2Highlighted ? "#60a5fa" : "#fca5a5", cursor: "pointer", fontSize: 11 }}>
                  {v2Highlighted ? "Highlighting v2 improvements" : "Highlighting v1 pain points"}
                </button>
              </div>

              <div style={{ background: "#1e293b", border: "1px solid #334155", borderRadius: 10, overflow: "hidden", marginBottom: 12 }}>
                <div style={{ display: "grid", gridTemplateColumns: "180px 1fr 1fr", borderBottom: "1px solid #334155" }}>
                  <div style={{ padding: "8px 12px", fontSize: 9, fontWeight: 700, color: "#64748b" }}>ASPECT</div>
                  <div style={{ padding: "8px 12px", fontSize: 9, fontWeight: 700, color: "#ef4444", borderLeft: "1px solid #334155" }}>v1</div>
                  <div style={{ padding: "8px 12px", fontSize: 9, fontWeight: 700, color: "#3b82f6", borderLeft: "1px solid #334155" }}>v2 (what I built)</div>
                </div>
                {V1_VS_V2.map(row => (
                  <div key={row.aspect} style={{ display: "grid", gridTemplateColumns: "180px 1fr 1fr", borderBottom: "1px solid #0f172a" }}>
                    <div style={{ padding: "9px 12px", fontSize: 10, fontWeight: 700, color: "#94a3b8" }}>{row.aspect}</div>
                    <div style={{ padding: "9px 12px", fontSize: 10, color: v2Highlighted ? "#64748b" : "#fca5a5", borderLeft: "1px solid #1e293b" }}>{row.v1}</div>
                    <div style={{ padding: "9px 12px", fontSize: 10, color: v2Highlighted ? "#60a5fa" : "#94a3b8", fontWeight: v2Highlighted ? 600 : 400, borderLeft: "1px solid #1e293b" }}>{row.v2}</div>
                  </div>
                ))}
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div>
                  <div style={{ fontSize: 10, fontWeight: 700, color: "#64748b", marginBottom: 8, letterSpacing: "0.08em" }}>v2 PLUGIN SYSTEM</div>
                  {PLUGINS.map(p => (
                    <div key={p.name} style={{ background: "#1e293b", border: "1px solid #334155", borderRadius: 8, padding: "8px 12px", marginBottom: 5, display: "flex", gap: 8, alignItems: "center" }}>
                      <span style={{ fontSize: 16 }}>{p.icon}</span>
                      <div>
                        <div style={{ fontSize: 9, fontFamily: "monospace", color: "#3b82f6" }}>{p.name}</div>
                        <div style={{ fontSize: 9, color: "#64748b" }}>{p.desc}</div>
                      </div>
                    </div>
                  ))}
                </div>

                <div>
                  <CodeBlock label="docusaurus.config.ts — v2 config with plugin system" color="#3b82f6" code={
`import type { Config } from "@docusaurus/types";
import type * as Preset from "@docusaurus/preset-classic";

const config: Config = {
  title: "My Project",
  url: "https://myproject.io",
  baseUrl: "/",

  // v2: everything is a plugin
  plugins: [
    ["@docusaurus/plugin-content-docs", {
      sidebarPath: "./sidebars.ts",
      // v2: versioned docs via CLI — \`docusaurus docs:version 1.0\`
      includeCurrentVersion: true,
    }],
    ["@docusaurus/plugin-google-analytics", {
      trackingID: "G-XXXXXXXXXX",
    }],
  ],

  // v2: presets bundle common plugin combinations
  presets: [
    ["@docusaurus/preset-classic", {
      docs: { sidebarPath: "./sidebars.ts" },
      blog: { showReadingTime: true },
      theme: { customCss: "./src/css/custom.css" },
    } satisfies Preset.Options],
  ],

  // v2: full i18n support
  i18n: {
    defaultLocale: "en",
    locales: ["en", "fr", "ja", "zh-Hans"],
  },

  // v2: MDX-powered content + swizzleable theme
  themeConfig: { colorMode: { defaultMode: "dark" } },
};
export default config;`} />

                  <div style={{ marginTop: 10 }}>
                    <CodeBlock label="Component swizzling — v2's theming innovation" color="#a855f7" code={
`// v2's swizzling: override any theme component without forking.
// No more CSS hacks. Replace the React component itself.

// CLI: npx docusaurus swizzle @docusaurus/theme-classic NavBar
// This ejects the NavBar component into your src/theme/ directory.
// You now own that component — customise it however you need.

// Result: custom NavBar with login button and search:
// src/theme/NavBar/index.tsx (your override)
export default function NavBar(props) {
  return (
    <div className="navbar">
      <OriginalNavBar {...props} />  {/* base behaviour */}
      <LoginButton />                {/* your addition */}
    </div>
  );
}

// v1 equivalent: inspect the DOM, write overriding CSS selectors,
// pray the CSS specificity is correct.
// v2: you get the source code of any theme component
// and replace it with a React component that does exactly what you need.`} />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* MDX DEMO */}
          {docSection === "mdx" && (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
              <div>
                <div style={{ fontSize: 10, fontWeight: 700, color: "#64748b", marginBottom: 8, letterSpacing: "0.08em" }}>MDX SOURCE (Markdown + JSX)</div>
                <CodeBlock label=".mdx file — JSX components inside Markdown" color="#f59e0b" code={
`---
id: getting-started
title: Getting Started
description: Quick start guide for the SDK
sidebar_position: 1
---

import Tabs from "@theme/Tabs";
import TabItem from "@theme/TabItem";
import Admonition from "@theme/Admonition";

# Getting Started

Welcome to the SDK. This page will guide you through setup.

<Admonition type="info" title="Prerequisites">
  Node.js ≥ 18 and npm ≥ 9 required.
</Admonition>

## Installation

<Tabs groupId="package-manager">
  <TabItem value="npm" label="npm">
    \`\`\`bash
    npm install @myorg/sdk
    \`\`\`
  </TabItem>
  <TabItem value="yarn" label="Yarn">
    \`\`\`bash
    yarn add @myorg/sdk
    \`\`\`
  </TabItem>
  <TabItem value="pnpm" label="pnpm">
    \`\`\`bash
    pnpm add @myorg/sdk
    \`\`\`
  </TabItem>
</Tabs>

## Quick Start

\`\`\`typescript
import { createClient } from "@myorg/sdk";

const client = createClient({ apiKey: process.env.API_KEY });
const result = await client.query({ id: "abc123" });
console.log(result.data);
\`\`\`

import LiveDemo from "@site/src/components/LiveDemo";

<LiveDemo code="client.query({ id: 'abc123' })" />`} />

                <div style={{ marginTop: 10 }}>
                  <CodeBlock label="Why MDX was revolutionary for documentation" color="#4ade80" code={
`// BEFORE MDX (v1 / plain Markdown):
//   You could only write static text and code blocks.
//   To show a tabbed code example, you needed a plugin
//   that parsed custom Markdown syntax (fragile, non-standard).

// WITH MDX (v2):
//   Tabs, Admonitions, Live Code Editors, interactive demos,
//   API reference tables generated from TypeScript types —
//   all written as JSX directly in the Markdown file.

// REAL-WORLD IMPACT:
//   React's documentation (react.dev) uses MDX to embed
//   interactive code sandboxes in every documentation page.
//   Without MDX: the docs team would need a separate CMS
//   or a custom rendering pipeline.
//   With MDX: technical writers write .mdx files, get
//   React components for free.

// THE COMPILATION PIPELINE (what I built in v2 alpha):
//
//   .mdx file
//     ↓ @mdx-js/loader (webpack loader)
//     ↓ remark pipeline (Markdown → mdxast)
//     ↓ rehype pipeline (mdxast → hast → JSX)
//   React component (ESM module)
//     ↓ webpack bundle
//   Static HTML + JS (at build time)
//               OR
//   Client-side rendered (React hydration)
//
// The key: the output is a real React component.
// You can import it, compose it, wrap it.
// Markdown is no longer a dead end format.`} />
                </div>
              </div>

              {/* Rendered preview */}
              <div>
                <div style={{ fontSize: 10, fontWeight: 700, color: "#64748b", marginBottom: 8, letterSpacing: "0.08em" }}>RENDERED OUTPUT (simulated)</div>
                <div style={{ background: "#fff", borderRadius: 10, overflow: "hidden", color: "#1e293b" }}>
                  {/* Nav */}
                  <div style={{ background: "#1877f2", padding: "10px 16px", display: "flex", gap: 8, alignItems: "center" }}>
                    <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#fff", opacity: 0.8 }} />
                    <span style={{ color: "#fff", fontSize: 11, fontWeight: 700 }}>My Project Docs</span>
                  </div>
                  <div style={{ display: "flex" }}>
                    {/* Sidebar */}
                    <div style={{ background: "#f8fafc", borderRight: "1px solid #e2e8f0", padding: "12px 10px", width: 120, flexShrink: 0 }}>
                      <div style={{ fontSize: 9, fontWeight: 700, color: "#94a3b8", marginBottom: 6 }}>GUIDES</div>
                      <div style={{ fontSize: 10, color: "#1877f2", fontWeight: 700, padding: "3px 6px", background: "#eff6ff", borderRadius: 4, marginBottom: 3 }}>Getting Started</div>
                      <div style={{ fontSize: 10, color: "#64748b", padding: "3px 6px", marginBottom: 3 }}>Authentication</div>
                      <div style={{ fontSize: 10, color: "#64748b", padding: "3px 6px", marginBottom: 3 }}>API Reference</div>
                      <div style={{ fontSize: 10, color: "#64748b", padding: "3px 6px" }}>Migration Guide</div>
                    </div>
                    {/* Content */}
                    <div style={{ padding: "16px", flex: 1 }}>
                      <div style={{ fontSize: 18, fontWeight: 800, color: "#0f172a", marginBottom: 4 }}>Getting Started</div>
                      <div style={{ fontSize: 10, color: "#64748b", marginBottom: 10 }}>Quick start guide for the SDK</div>

                      {/* Admonition */}
                      <div style={{ background: "#eff6ff", border: "1px solid #bfdbfe", borderRadius: 6, padding: "8px 10px", marginBottom: 10, borderLeft: "4px solid #3b82f6" }}>
                        <div style={{ fontSize: 9, fontWeight: 700, color: "#3b82f6", marginBottom: 2 }}>ℹ INFO · Prerequisites</div>
                        <div style={{ fontSize: 9, color: "#1e40af" }}>Node.js ≥ 18 and npm ≥ 9 required.</div>
                      </div>

                      <div style={{ fontSize: 12, fontWeight: 700, color: "#0f172a", marginBottom: 6 }}>Installation</div>

                      {/* Tabs */}
                      <div style={{ border: "1px solid #e2e8f0", borderRadius: 6, overflow: "hidden", marginBottom: 10 }}>
                        <div style={{ display: "flex", borderBottom: "1px solid #e2e8f0" }}>
                          {["npm", "Yarn", "pnpm"].map((t, i) => (
                            <div key={t} style={{ padding: "5px 12px", fontSize: 9, fontWeight: 700, background: i === 0 ? "#fff" : "#f8fafc", color: i === 0 ? "#1877f2" : "#64748b", borderBottom: i === 0 ? "2px solid #1877f2" : "none", cursor: "default" }}>{t}</div>
                          ))}
                        </div>
                        <div style={{ padding: "8px 10px", background: "#0f172a" }}>
                          <code style={{ fontSize: 10, color: "#a5f3fc" }}>npm install @myorg/sdk</code>
                        </div>
                      </div>

                      {/* Live Demo placeholder */}
                      <div style={{ background: "#f1f5f9", borderRadius: 6, padding: "8px 10px", border: "1px dashed #94a3b8" }}>
                        <div style={{ fontSize: 9, color: "#64748b", fontStyle: "italic" }}>{"<LiveDemo code=\"client.query({ id: 'abc123' })\" />"}</div>
                        <div style={{ fontSize: 9, color: "#94a3b8", marginTop: 2 }}>↑ Custom React component, rendered inline in Markdown via MDX</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ECOSYSTEM */}
          {docSection === "ecosystem" && (
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: "#f1f5f9", marginBottom: 10 }}>Projects that trust Docusaurus for their official documentation</div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8, marginBottom: 14 }}>
                {DOCUSAURUS_USERS.map(u => (
                  <div key={u.name} style={{ background: "#1e293b", border: "1px solid #334155", borderRadius: 10, padding: 12, textAlign: "center" }}>
                    <div style={{ fontSize: 24, marginBottom: 6 }}>{u.logo}</div>
                    <div style={{ fontSize: 11, fontWeight: 700, color: "#f1f5f9", marginBottom: 2 }}>{u.name}</div>
                    <div style={{ fontSize: 9, color: "#64748b" }}>{u.note}</div>
                  </div>
                ))}
              </div>
              <CodeBlock label="Why 'Lead Maintainer' is different from 'contributor' — and why it matters in an interview" color="#f59e0b" code={
`// CONTRIBUTOR: "I opened a PR that got merged."
// LEAD MAINTAINER: "I am responsible for the project's direction, health,
//                   and the quality of every merged PR."

// WHAT BEING LEAD MAINTAINER ACTUALLY INVOLVES:
//
// 1. REVIEWING EXTERNAL PRs:
//    Thousands of developers use Docusaurus. Dozens contribute PRs.
//    Each PR: understand the change, assess correctness, API consistency,
//    backwards compatibility, documentation, tests. Merge or give feedback.
//
// 2. ARCHITECTURAL DECISIONS:
//    Should Docusaurus v2 use Gatsby (as v1 did) or build its own pipeline?
//    (Answer: build its own — Gatsby adds complexity and limits control.)
//    These decisions affect thousands of downstream users.
//    A wrong decision is hard to undo.
//
// 3. BACKWARDS COMPATIBILITY:
//    docusaurus.config.js from 2020 must still work in 2024.
//    Every API change must consider: who is using this? Can they migrate?
//    How do we communicate breaking changes? What is the migration path?
//
// 4. COMMUNITY LEADERSHIP:
//    Responding to GitHub issues. Writing decision documents.
//    Being transparent about roadmap. Setting the technical vision.
//
// 5. CONCEPTUALISING v2 alpha:
//    v2 was not an incremental update. It was a complete rethink.
//    MDX: didn't exist in v1. Plugin system: didn't exist. Swizzling: new.
//    Conceptualising means: "here is what the next generation should be,
//    and here is why." Then building it to prove the concept.`} />
            </div>
          )}
        </div>
      )}

      {/* ── ADS STATE MANAGEMENT ── */}
      {activeTab === "ads" && (
        <div>
          {/* Sub-nav */}
          <div style={{ display: "flex", gap: 6, marginBottom: 14 }}>
            {([["form", "📋 Campaign Form"], ["state", "🔄 State Tree"], ["tools", "🔧 Tech Stack"]] as const).map(([id, label]) => (
              <button key={id} onClick={() => setAdsSection(id)} style={{
                background: adsSection === id ? "#1e293b" : "transparent",
                border: `1px solid ${adsSection === id ? "#334155" : "transparent"}`,
                borderRadius: 8, padding: "7px 14px", cursor: "pointer", color: adsSection === id ? "#f1f5f9" : "#64748b", fontSize: 12,
              }}>{label}</button>
            ))}
            <div style={{ marginLeft: "auto", display: "flex", gap: 6 }}>
              <button onClick={() => dispatch({ type: "UNDO" })} disabled={!canUndo} style={{ background: canUndo ? "#1e293b" : "#0f172a", border: `1px solid ${canUndo ? "#334155" : "#1e293b"}`, borderRadius: 6, padding: "5px 12px", color: canUndo ? "#a5b4fc" : "#334155", cursor: canUndo ? "pointer" : "not-allowed", fontSize: 11 }}>
                ↩ Undo ({adsState.past.length})
              </button>
              <button onClick={() => dispatch({ type: "REDO" })} disabled={!canRedo} style={{ background: canRedo ? "#1e293b" : "#0f172a", border: `1px solid ${canRedo ? "#334155" : "#1e293b"}`, borderRadius: 6, padding: "5px 12px", color: canRedo ? "#a5b4fc" : "#334155", cursor: canRedo ? "pointer" : "not-allowed", fontSize: 11 }}>
                ↪ Redo ({adsState.future.length})
              </button>
            </div>
          </div>

          {/* FORM */}
          {adsSection === "form" && (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
              {/* Campaign */}
              <div style={{ background: "#1e293b", border: "1px solid #334155", borderRadius: 10, padding: 14 }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: "#6366f1", marginBottom: 10 }}>CAMPAIGN LEVEL</div>
                <label style={{ display: "flex", flexDirection: "column", gap: 3, marginBottom: 8 }}>
                  <span style={{ fontSize: 9, color: "#64748b" }}>Campaign name</span>
                  <input value={adsState.campaign.name} placeholder="e.g. Q4 Holiday Sale"
                    onChange={e => dispatch({ type: "UPDATE_CAMPAIGN", payload: { name: e.target.value } })}
                    style={{ background: "#0f172a", border: "1px solid #334155", borderRadius: 6, padding: "6px 8px", color: "#f1f5f9", fontSize: 11 }} />
                </label>
                <label style={{ display: "flex", flexDirection: "column", gap: 3, marginBottom: 8 }}>
                  <span style={{ fontSize: 9, color: "#64748b" }}>Objective</span>
                  <select value={adsState.campaign.objective}
                    onChange={e => dispatch({ type: "UPDATE_CAMPAIGN", payload: { objective: e.target.value as Objective } })}
                    style={{ background: "#0f172a", border: "1px solid #334155", borderRadius: 6, padding: "6px 8px", color: "#f1f5f9", fontSize: 11 }}>
                    {(["awareness", "traffic", "engagement", "leads", "conversions", "sales"] as Objective[]).map(o => (
                      <option key={o} value={o}>{o.charAt(0).toUpperCase() + o.slice(1)}</option>
                    ))}
                  </select>
                </label>
                <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
                  <label style={{ flex: 1, display: "flex", flexDirection: "column", gap: 3 }}>
                    <span style={{ fontSize: 9, color: "#64748b" }}>Budget type</span>
                    <select value={adsState.campaign.budgetType}
                      onChange={e => dispatch({ type: "UPDATE_CAMPAIGN", payload: { budgetType: e.target.value as BudgetType } })}
                      style={{ background: "#0f172a", border: "1px solid #334155", borderRadius: 6, padding: "6px 8px", color: "#f1f5f9", fontSize: 11 }}>
                      <option value="daily">Daily</option><option value="lifetime">Lifetime</option>
                    </select>
                  </label>
                  <label style={{ flex: 1, display: "flex", flexDirection: "column", gap: 3 }}>
                    <span style={{ fontSize: 9, color: "#64748b" }}>Amount ($)</span>
                    <input type="number" value={adsState.campaign.budgetAmount}
                      onChange={e => dispatch({ type: "UPDATE_CAMPAIGN", payload: { budgetAmount: +e.target.value } })}
                      style={{ background: "#0f172a", border: "1px solid #334155", borderRadius: 6, padding: "6px 8px", color: "#f1f5f9", fontSize: 11 }} />
                  </label>
                </div>
              </div>

              {/* Ad Set */}
              <div style={{ background: "#1e293b", border: "1px solid #334155", borderRadius: 10, padding: 14 }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: "#0ea5e9", marginBottom: 10 }}>AD SET LEVEL</div>
                <label style={{ display: "flex", flexDirection: "column", gap: 3, marginBottom: 8 }}>
                  <span style={{ fontSize: 9, color: "#64748b" }}>Ad set name</span>
                  <input value={adsState.adSet.name} placeholder="e.g. 25-54 US Lookalike"
                    onChange={e => dispatch({ type: "UPDATE_ADSET", payload: { name: e.target.value } })}
                    style={{ background: "#0f172a", border: "1px solid #334155", borderRadius: 6, padding: "6px 8px", color: "#f1f5f9", fontSize: 11 }} />
                </label>
                <div style={{ fontSize: 9, color: "#64748b", marginBottom: 4 }}>Placements</div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginBottom: 8 }}>
                  {(["feed", "stories", "reels", "messenger", "audience_network"] as Placement[]).map(p => {
                    const active = adsState.adSet.placements.includes(p);
                    return (
                      <button key={p} onClick={() => dispatch({ type: "TOGGLE_PLACEMENT", payload: p })} style={{
                        background: active ? "#0ea5e920" : "#0f172a",
                        border: `1px solid ${active ? "#0ea5e9" : "#334155"}`,
                        borderRadius: 6, padding: "3px 8px", color: active ? "#7dd3fc" : "#64748b", cursor: "pointer", fontSize: 9,
                      }}>{p}</button>
                    );
                  })}
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  <label style={{ flex: 1, display: "flex", flexDirection: "column", gap: 3 }}>
                    <span style={{ fontSize: 9, color: "#64748b" }}>Age min</span>
                    <input type="number" value={adsState.adSet.ageMin} min={18} max={64}
                      onChange={e => dispatch({ type: "UPDATE_ADSET", payload: { ageMin: +e.target.value } })}
                      style={{ background: "#0f172a", border: "1px solid #334155", borderRadius: 6, padding: "6px 8px", color: "#f1f5f9", fontSize: 11 }} />
                  </label>
                  <label style={{ flex: 1, display: "flex", flexDirection: "column", gap: 3 }}>
                    <span style={{ fontSize: 9, color: "#64748b" }}>Age max</span>
                    <input type="number" value={adsState.adSet.ageMax} min={19} max={65}
                      onChange={e => dispatch({ type: "UPDATE_ADSET", payload: { ageMax: +e.target.value } })}
                      style={{ background: "#0f172a", border: "1px solid #334155", borderRadius: 6, padding: "6px 8px", color: "#f1f5f9", fontSize: 11 }} />
                  </label>
                </div>
                <div style={{ marginTop: 8, fontSize: 9, color: "#64748b" }}>
                  Estimated audience: <span style={{ color: "#0ea5e9", fontWeight: 700 }}>{(adsState.adSet.audienceSize / 1_000_000).toFixed(1)}M</span>
                </div>
              </div>

              {/* Ad */}
              <div style={{ background: "#1e293b", border: "1px solid #334155", borderRadius: 10, padding: 14 }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: "#4ade80", marginBottom: 10 }}>AD LEVEL</div>
                <label style={{ display: "flex", flexDirection: "column", gap: 3, marginBottom: 8 }}>
                  <span style={{ fontSize: 9, color: "#64748b" }}>Ad name</span>
                  <input value={adsState.ad.name} placeholder="e.g. Image_V1"
                    onChange={e => dispatch({ type: "UPDATE_AD", payload: { name: e.target.value } })}
                    style={{ background: "#0f172a", border: "1px solid #334155", borderRadius: 6, padding: "6px 8px", color: "#f1f5f9", fontSize: 11 }} />
                </label>
                <label style={{ display: "flex", flexDirection: "column", gap: 3, marginBottom: 8 }}>
                  <span style={{ fontSize: 9, color: "#64748b" }}>Headline</span>
                  <input value={adsState.ad.headline}
                    onChange={e => dispatch({ type: "UPDATE_AD", payload: { headline: e.target.value } })}
                    style={{ background: "#0f172a", border: "1px solid #334155", borderRadius: 6, padding: "6px 8px", color: "#f1f5f9", fontSize: 11 }} />
                </label>
                <label style={{ display: "flex", flexDirection: "column", gap: 3, marginBottom: 8 }}>
                  <span style={{ fontSize: 9, color: "#64748b" }}>Body copy</span>
                  <input value={adsState.ad.body}
                    onChange={e => dispatch({ type: "UPDATE_AD", payload: { body: e.target.value } })}
                    style={{ background: "#0f172a", border: "1px solid #334155", borderRadius: 6, padding: "6px 8px", color: "#f1f5f9", fontSize: 11 }} />
                </label>
                {/* Ad preview */}
                <div style={{ background: "#fff", borderRadius: 8, overflow: "hidden", border: "1px solid #e2e8f0" }}>
                  <div style={{ height: 60, background: "linear-gradient(135deg, #667eea, #764ba2)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 9, opacity: 0.8 }}>Ad Creative Preview</div>
                  <div style={{ padding: 8 }}>
                    <div style={{ fontSize: 10, fontWeight: 700, color: "#0f172a" }}>{adsState.ad.headline || "Headline"}</div>
                    <div style={{ fontSize: 9, color: "#64748b", marginBottom: 6 }}>{adsState.ad.body || "Body copy"}</div>
                    <div style={{ background: "#1877f2", borderRadius: 4, padding: "4px 10px", color: "#fff", fontSize: 9, fontWeight: 700, display: "inline-block" }}>{adsState.ad.cta}</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STATE TREE */}
          {adsSection === "state" && (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div>
                <div style={{ fontSize: 10, fontWeight: 700, color: "#64748b", marginBottom: 8, letterSpacing: "0.08em" }}>LIVE REDUX STATE TREE</div>
                <CodeBlock label={`Redux store snapshot — undo stack: ${adsState.past.length}, redo: ${adsState.future.length}`} color="#6366f1" code={
`{
  campaign: {
    name:       "${adsState.campaign.name || "(empty)"}",
    objective:  "${adsState.campaign.objective}",
    budgetType: "${adsState.campaign.budgetType}",
    budgetAmount: ${adsState.campaign.budgetAmount},
  },
  adSet: {
    name:         "${adsState.adSet.name || "(empty)"}",
    placements:   [${adsState.adSet.placements.map(p => `"${p}"`).join(", ")}],
    ageMin:       ${adsState.adSet.ageMin},
    ageMax:       ${adsState.adSet.ageMax},
    audienceSize: ${adsState.adSet.audienceSize.toLocaleString()},
  },
  ad: {
    name:     "${adsState.ad.name || "(empty)"}",
    headline: "${adsState.ad.headline}",
    body:     "${adsState.ad.body}",
    cta:      "${adsState.ad.cta}",
  },

  // Undo/Redo stacks (managed by custom Redux middleware)
  _history: {
    past:   [${adsState.past.length} snapshot${adsState.past.length !== 1 ? "s" : ""}],
    future: [${adsState.future.length} snapshot${adsState.future.length !== 1 ? "s" : ""}],
  },
}`} />
                <div style={{ marginTop: 8 }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: "#64748b", marginBottom: 6, letterSpacing: "0.08em" }}>ACTION LOG</div>
                  {adsState.actionLog.length === 0 ? (
                    <div style={{ background: "#1e293b", borderRadius: 8, padding: "12px 14px", fontSize: 10, color: "#475569" }}>
                      Edit fields in the Campaign Form tab to see dispatched actions here.
                    </div>
                  ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
                      {[...adsState.actionLog].reverse().map((a, i) => (
                        <div key={i} style={{ background: "#1e293b", borderRadius: 6, padding: "5px 10px", display: "flex", justifyContent: "space-between", alignItems: "center", opacity: 1 - i * 0.1 }}>
                          <code style={{ fontSize: 9, color: i === 0 ? "#a5b4fc" : "#64748b" }}>dispatch({"{"}type: "{a.type}"{"}"})</code>
                          <span style={{ fontSize: 8, color: "#475569" }}>{a.timestamp}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              <div>
                <CodeBlock label="Undo/redo Redux middleware — custom infra tool for Ads engineers" color="#f59e0b" code={
`// The Ads Manager needs undo/redo across a deeply nested
// campaign/adset/ad hierarchy.
// React's useState cannot do this — state is scattered.
// Redux centralises it; a middleware adds undo/redo.

// CUSTOM UNDO/REDO MIDDLEWARE:
const undoable = (reducer) => {
  const initialState = {
    past:    [],       // snapshots of past states
    present: reducer(undefined, {}),
    future:  [],
  };

  return (state = initialState, action) => {
    const { past, present, future } = state;

    switch (action.type) {
      case "UNDO":
        if (!past.length) return state;
        return {
          past:    past.slice(0, -1),
          present: past[past.length - 1],
          future:  [present, ...future],
        };

      case "REDO":
        if (!future.length) return state;
        return {
          past:    [...past, present],
          present: future[0],
          future:  future.slice(1),
        };

      default:
        // Every other action: push current state to past
        const newPresent = reducer(present, action);
        if (newPresent === present) return state;  // no change
        return {
          past:    [...past.slice(-19), present],  // keep 20
          present: newPresent,
          future:  [],                             // clear redo stack
        };
    }
  };
};

// Used by Ads engineers — they do not implement undo themselves.
// They dispatch normal actions; the middleware handles history.
const adsStore = createStore(undoable(adsReducer));`} />
              </div>
            </div>
          )}

          {/* TECH STACK */}
          {adsSection === "tools" && (
            <div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
                {[
                  { tech: "Flux → Redux", icon: "🔄", color: "#6366f1",
                    what: "State management evolution at Facebook",
                    detail: "Flux was Facebook's original pattern — unidirectional data flow, stores, dispatchers. Redux simplified it: one store, pure reducer functions. The Ads FE team was an early Redux adopter at Facebook." },
                  { tech: "Relay + GraphQL", icon: "🔗", color: "#0ea5e9",
                    what: "Facebook's data fetching layer",
                    detail: "Relay colocates data requirements with components: each component declares its GraphQL fragment. The Relay runtime composes fragments into efficient queries. Engineers never write API calls — they declare what they need and Relay fetches it." },
                  { tech: "Flow (Static Types)", icon: "🔷", color: "#f59e0b",
                    what: "Facebook's TypeScript alternative",
                    detail: "Flow was Facebook's type system before TypeScript existed. Gradual typing: annotate files incrementally. The Ads team used Flow strictly — typed selectors, typed actions, typed reducers. This caught whole classes of state shape bugs before runtime." },
                  { tech: "Hack (PHP dialect)", icon: "⚙️", color: "#4ade80",
                    what: "Facebook's server language",
                    detail: "Hack is a statically-typed PHP dialect. The Ads API was written in Hack. Understanding the server-side type system helped bridge frontend state shape with backend data contracts — crucial for a consistent ads editing experience." },
                ].map(t => (
                  <div key={t.tech} style={{ background: "#1e293b", border: `1px solid ${t.color}30`, borderRadius: 10, padding: 14, borderLeft: `4px solid ${t.color}` }}>
                    <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 6 }}>
                      <span style={{ fontSize: 18 }}>{t.icon}</span>
                      <div>
                        <div style={{ fontSize: 11, fontWeight: 700, color: t.color }}>{t.tech}</div>
                        <div style={{ fontSize: 9, color: "#64748b" }}>{t.what}</div>
                      </div>
                    </div>
                    <div style={{ fontSize: 10, color: "#94a3b8", lineHeight: 1.6 }}>{t.detail}</div>
                  </div>
                ))}
              </div>

              <CodeBlock label="Relay fragment colocation — the key insight of Facebook's GraphQL client" color="#0ea5e9" code={
`// TRADITIONAL REST / REDUX APPROACH (before Relay):
//   Component mounts → dispatch fetchCampaign(id) → reducer updates store
//   → component reads state.campaigns[id]
//   Problem: every component that needs campaign data must know:
//     (a) which action to dispatch, (b) where in the store to read.
//   When data shape changes: update the fetch, the reducer, the selector.

// RELAY APPROACH — data requirements colocated with the component:
const CampaignCard = () => {
  const campaign = useFragment(
    graphql\`
      fragment CampaignCard_campaign on Campaign {
        id
        name
        objective
        status
        budget { amount currency }
        insights { spend reach impressions }
      }
    \`,
    campaignRef  // passed from parent
  );
  return <div>{campaign.name}</div>;
};

// The parent component declares it needs CampaignCard's fragment:
const CampaignList = () => {
  const data = useLazyLoadQuery(
    graphql\`
      query CampaignListQuery($accountId: ID!) {
        adAccount(id: $accountId) {
          campaigns(first: 20) {
            edges {
              node {
                id
                ...CampaignCard_campaign  # Relay composes the fragment
              }
            }
          }
        }
      }
    \`,
    { accountId }
  );
};

// WHAT RELAY DOES AUTOMATICALLY:
//   1. Composes nested fragments into one efficient query
//   2. Caches results by entity ID (normalized cache)
//   3. Re-renders only the component whose data changed
//   4. Handles optimistic updates for mutations
//   5. Handles pagination and subscriptions

// The Ads FE Infra team built state management TOOLS on top of Relay.
// Not just "use Relay" — but wrappers, patterns, and utilities that
// make it easier for Ads engineers to do the right thing consistently.`} />
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default DocusaurusAdsDemo;
