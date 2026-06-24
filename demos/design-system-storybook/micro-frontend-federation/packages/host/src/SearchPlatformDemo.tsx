/**
 * SearchPlatformDemo.tsx
 *
 * TikTok Content Safety — New Search Platform (from zero to production)
 *
 * Target: Empower content reviewers to swiftly locate harmful content
 *         with multi-level filters.
 *
 * Achievements:
 *   1. Full Search Platform  — multi-level filters, results, sort, pagination
 *   2. Permission System     — frontend gate + BFF enforcement (RBAC)
 *   3. Dev Setup + Modular   — webpack/Babel/ESLint/Prettier/Jest + modular architecture
 *
 * TABS
 *   🔍 Search Platform  — live multi-filter search, result cards, reviewer UX
 *   🔐 Permission System— role matrix, route guard, BFF rejection simulation
 *   ⚙  Dev Setup        — toolchain config, lint-staged, Jest, 2-week sprint timeline
 */

import React, { useState, useEffect, useRef, useCallback } from "react";

// ─────────────────────────────────────────────────────────────────
// Search types
// ─────────────────────────────────────────────────────────────────

type ContentType = "video" | "live" | "comment" | "account";
type Category    = "violence" | "hate_speech" | "spam" | "misinformation" | "adult" | "minor_safety";
type SeverityLevel = "p0" | "p1" | "p2" | "p3";
type Region      = "US" | "EU" | "SEA" | "MENA" | "LATAM" | "APAC";
type ReviewStatus = "unreviewed" | "in_review" | "reviewed";

interface SearchFilters {
  query: string;
  contentTypes: ContentType[];
  categories: Category[];
  severity: SeverityLevel[];
  regions: Region[];
  status: ReviewStatus[];
  dateFrom: string;
  dateTo: string;
  minReporters: number;
}

interface ContentItem {
  id: string; emoji: string; title: string; type: ContentType;
  category: Category; severity: SeverityLevel; region: Region;
  status: ReviewStatus; reporters: number; date: string; creator: string;
  snippet: string;
}

const ITEMS: ContentItem[] = [
  { id: "s1",  emoji: "🎬", title: "Protest footage with weapons",       type: "video",   category: "violence",      severity: "p0", region: "US",    status: "unreviewed", reporters: 412, date: "2025-06-17", creator: "user_8841",  snippet: "Shows armed individuals near crowd. Duration 2:34. Multiple angles." },
  { id: "s2",  emoji: "💬", title: "Targeted ethnic slurs thread",       type: "comment", category: "hate_speech",   severity: "p1", region: "EU",    status: "unreviewed", reporters: 188, date: "2025-06-17", creator: "user_3320",  snippet: "Series of 14 comments targeting a creator by ethnicity." },
  { id: "s3",  emoji: "👤", title: "Bot network account cluster",        type: "account", category: "spam",          severity: "p2", region: "SEA",   status: "in_review",  reporters: 67,  date: "2025-06-16", creator: "user_9012",  snippet: "340 identical posts in 6 minutes. External link spam pattern." },
  { id: "s4",  emoji: "📡", title: "Live: false medical advice",         type: "live",    category: "misinformation", severity: "p1", region: "MENA",  status: "unreviewed", reporters: 293, date: "2025-06-18", creator: "user_1177",  snippet: "Host claiming unverified medical treatments for chronic illness." },
  { id: "s5",  emoji: "🎵", title: "Underage creator in adult context",  type: "video",   category: "minor_safety",  severity: "p0", region: "APAC",  status: "unreviewed", reporters: 534, date: "2025-06-18", creator: "user_5503",  snippet: "Creator appears under 18. Content includes adult-adjacent themes." },
  { id: "s6",  emoji: "🤬", title: "Coordinated harassment campaign",    type: "account", category: "hate_speech",   severity: "p1", region: "US",    status: "reviewed",   reporters: 89,  date: "2025-06-15", creator: "user_2209",  snippet: "Organised group targeting a journalist. 6 accounts coordinating." },
  { id: "s7",  emoji: "📱", title: "Disinformation: election results",   type: "video",   category: "misinformation", severity: "p0", region: "LATAM", status: "unreviewed", reporters: 741, date: "2025-06-18", creator: "user_6634",  snippet: "Claims incorrect election results. Viral share: 14K in 2 hours." },
  { id: "s8",  emoji: "🔞", title: "Explicit content — no age gate",     type: "video",   category: "adult",         severity: "p1", region: "EU",    status: "in_review",  reporters: 156, date: "2025-06-17", creator: "user_7720",  snippet: "Adult content without appropriate age-gate. Not behind 18+ filter." },
];

const CAT_COLORS: Record<Category, { c: string; label: string }> = {
  violence:      { c: "#ef4444", label: "Violence"        },
  hate_speech:   { c: "#f97316", label: "Hate Speech"     },
  spam:          { c: "#64748b", label: "Spam"            },
  misinformation:{ c: "#f59e0b", label: "Misinfo"         },
  adult:         { c: "#a855f7", label: "Adult"           },
  minor_safety:  { c: "#0ea5e9", label: "Minor Safety"    },
};
const SEV_COLORS: Record<SeverityLevel, string> = { p0: "#ef4444", p1: "#f97316", p2: "#f59e0b", p3: "#22c55e" };
const STATUS_COLORS: Record<ReviewStatus, string> = { unreviewed: "#64748b", in_review: "#f59e0b", reviewed: "#22c55e" };

// ─────────────────────────────────────────────────────────────────
// Permission types
// ─────────────────────────────────────────────────────────────────

type Role = "junior_reviewer" | "senior_reviewer" | "team_lead" | "admin";

interface ReviewerPermissions {
  role: Role; name: string; color: string;
  allowedCategories: Category[];
  allowedRegions: Region[];
  canBulkAction: boolean;
  canExport: boolean;
  canViewStats: boolean;
}

const REVIEWERS: ReviewerPermissions[] = [
  { role: "junior_reviewer", name: "Junior Reviewer",  color: "#64748b", allowedCategories: ["spam", "misinformation"], allowedRegions: ["US", "EU"], canBulkAction: false, canExport: false, canViewStats: false },
  { role: "senior_reviewer", name: "Senior Reviewer",  color: "#0ea5e9", allowedCategories: ["spam", "misinformation", "hate_speech", "violence"], allowedRegions: ["US", "EU", "SEA", "APAC"], canBulkAction: true, canExport: false, canViewStats: true },
  { role: "team_lead",       name: "Team Lead",        color: "#a855f7", allowedCategories: ["spam", "misinformation", "hate_speech", "violence", "adult"], allowedRegions: ["US", "EU", "SEA", "APAC", "MENA", "LATAM"], canBulkAction: true, canExport: true, canViewStats: true },
  { role: "admin",           name: "Admin",            color: "#fe2c55", allowedCategories: ["spam", "misinformation", "hate_speech", "violence", "adult", "minor_safety"], allowedRegions: ["US", "EU", "SEA", "APAC", "MENA", "LATAM"], canBulkAction: true, canExport: true, canViewStats: true },
];

const ALL_CATEGORIES: Category[] = ["violence", "hate_speech", "spam", "misinformation", "adult", "minor_safety"];
const ALL_REGIONS: Region[] = ["US", "EU", "SEA", "MENA", "LATAM", "APAC"];

interface RequestLog {
  ts: string; role: string; endpoint: string; category: Category; region: Region;
  result: "allowed" | "denied"; reason: string; color: string;
}

// ─────────────────────────────────────────────────────────────────
// Dev setup timeline
// ─────────────────────────────────────────────────────────────────

interface SprintTask { day: string; tasks: { label: string; tag: string; done: boolean; color: string }[] }
const SPRINT: SprintTask[] = [
  { day: "Day 1–2",  tasks: [{ label: "Project scaffold + webpack config", tag: "infra", done: true, color: "#f59e0b" }, { label: "Babel preset: TS + React + decorators", tag: "infra", done: true, color: "#f59e0b" }, { label: "ESLint + Prettier + lint-staged setup", tag: "infra", done: true, color: "#64748b" }] },
  { day: "Day 3–4",  tasks: [{ label: "Permission system: RBAC data model + JWT scope", tag: "security", done: true, color: "#ef4444" }, { label: "BFF permission middleware (Express)", tag: "security", done: true, color: "#ef4444" }, { label: "Frontend PermissionGate component", tag: "security", done: true, color: "#ef4444" }] },
  { day: "Day 5–7",  tasks: [{ label: "Multi-level filter panel (5 filter dimensions)", tag: "feature", done: true, color: "#0ea5e9" }, { label: "Search results grid with sort + pagination", tag: "feature", done: true, color: "#0ea5e9" }, { label: "Search debounce + query state management", tag: "feature", done: true, color: "#0ea5e9" }] },
  { day: "Day 8–10", tasks: [{ label: "Jest config + unit tests (70%+ coverage gate)", tag: "testing", done: true, color: "#22c55e" }, { label: "Module extraction: publishable npm packages", tag: "arch", done: true, color: "#a855f7" }, { label: "Staging deployment + smoke tests", tag: "deploy", done: true, color: "#475569" }] },
  { day: "Day 11–14",tasks: [{ label: "Production deployment + feature flags", tag: "deploy", done: true, color: "#475569" }, { label: "Reviewer onboarding + training docs", tag: "ops", done: true, color: "#64748b" }, { label: "Post-launch monitoring + hotfixes", tag: "ops", done: true, color: "#64748b" }] },
];

const TAG_COLORS: Record<string, string> = { infra: "#f59e0b", security: "#ef4444", feature: "#0ea5e9", testing: "#22c55e", arch: "#a855f7", deploy: "#475569", ops: "#64748b" };

// ─────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────

function Tag({ text, color }: { text: string; color: string }) {
  return <span style={{ fontSize: 7, background: color + "20", color, borderRadius: 4, padding: "1px 7px", fontWeight: 700, border: `1px solid ${color}30` }}>{text}</span>;
}

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

export function SearchPlatformDemo() {
  const [activeTab, setActiveTab] = useState<"search" | "perms" | "devsetup">("search");

  // ── Search state
  const [filters, setFilters] = useState<SearchFilters>({
    query: "", contentTypes: [], categories: [], severity: [],
    regions: [], status: [], dateFrom: "", dateTo: "", minReporters: 0,
  });
  const [results, setResults]     = useState<ContentItem[]>(ITEMS);
  const [searching, setSearching] = useState(false);
  const [searchTime, setSearchTime] = useState<number | null>(null);
  const [sortBy, setSortBy]       = useState<"reporters" | "date" | "severity">("reporters");
  const [activeFilters, setActiveFilters] = useState<string[]>([]);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const toggleFilter = <T extends string>(arr: T[], val: T): T[] =>
    arr.includes(val) ? arr.filter(x => x !== val) : [...arr, val];

  const applyFilters = useCallback((f: SearchFilters) => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    setSearching(true);
    debounceRef.current = setTimeout(() => {
      const t0 = Date.now();
      let res = ITEMS;
      if (f.query)            res = res.filter(i => i.title.toLowerCase().includes(f.query.toLowerCase()) || i.snippet.toLowerCase().includes(f.query.toLowerCase()));
      if (f.contentTypes.length) res = res.filter(i => f.contentTypes.includes(i.type));
      if (f.categories.length)   res = res.filter(i => f.categories.includes(i.category));
      if (f.severity.length)     res = res.filter(i => f.severity.includes(i.severity));
      if (f.regions.length)      res = res.filter(i => f.regions.includes(i.region));
      if (f.status.length)       res = res.filter(i => f.status.includes(i.status));
      if (f.minReporters > 0)    res = res.filter(i => i.reporters >= f.minReporters);
      const chips: string[] = [];
      if (f.query)               chips.push(`"${f.query}"`);
      if (f.contentTypes.length) chips.push(...f.contentTypes);
      if (f.categories.length)   chips.push(...f.categories.map(c => CAT_COLORS[c].label));
      if (f.severity.length)     chips.push(...f.severity.map(s => s.toUpperCase()));
      if (f.regions.length)      chips.push(...f.regions);
      if (f.status.length)       chips.push(...f.status);
      if (f.minReporters > 0)    chips.push(`≥${f.minReporters} reports`);
      setActiveFilters(chips);
      setResults(res);
      setSearchTime(Date.now() - t0);
      setSearching(false);
    }, 250);
  }, []);

  const updateFilter = <K extends keyof SearchFilters>(key: K, val: SearchFilters[K]) => {
    const next = { ...filters, [key]: val };
    setFilters(next);
    applyFilters(next);
  };

  const clearAll = () => {
    const blank: SearchFilters = { query: "", contentTypes: [], categories: [], severity: [], regions: [], status: [], dateFrom: "", dateTo: "", minReporters: 0 };
    setFilters(blank);
    setResults(ITEMS);
    setActiveFilters([]);
    setSearchTime(null);
  };

  const sorted = [...results].sort((a, b) => {
    if (sortBy === "reporters") return b.reporters - a.reporters;
    if (sortBy === "date")      return b.date.localeCompare(a.date);
    const sevOrder = { p0: 0, p1: 1, p2: 2, p3: 3 };
    return sevOrder[a.severity] - sevOrder[b.severity];
  });

  // ── Permission state
  const [selectedRole, setSelectedRole] = useState<ReviewerPermissions>(REVIEWERS[0]);
  const [simCategory, setSimCategory]   = useState<Category>("violence");
  const [simRegion, setSimRegion]       = useState<Region>("US");
  const [reqLogs, setReqLogs]           = useState<RequestLog[]>([]);
  const [simulating, setSimulating]     = useState(false);

  const simulateRequest = async () => {
    setSimulating(true);
    await new Promise(r => setTimeout(r, 400));
    const catOk     = selectedRole.allowedCategories.includes(simCategory);
    const regionOk  = selectedRole.allowedRegions.includes(simRegion);
    const allowed   = catOk && regionOk;
    const reason    = !catOk ? `Category "${CAT_COLORS[simCategory].label}" not in role scope` : !regionOk ? `Region "${simRegion}" not in role scope` : "Permissions verified";
    const log: RequestLog = {
      ts: new Date().toLocaleTimeString(), role: selectedRole.name,
      endpoint: "/bff/search",
      category: simCategory, region: simRegion,
      result: allowed ? "allowed" : "denied", reason,
      color: allowed ? "#22c55e" : "#ef4444",
    };
    setReqLogs(prev => [log, ...prev.slice(0, 7)]);
    setSimulating(false);
  };

  // ── Dev setup state
  const [expandedTool, setExpandedTool] = useState<string | null>("webpack");

  const TOOLS = [
    { id: "webpack",  label: "webpack 5",   icon: "📦", color: "#f59e0b" },
    { id: "babel",    label: "Babel",       icon: "🔄", color: "#f97316" },
    { id: "eslint",   label: "ESLint",      icon: "🔍", color: "#0ea5e9" },
    { id: "jest",     label: "Jest",        icon: "🧪", color: "#22c55e" },
    { id: "lint-staged", label: "lint-staged", icon: "⚡", color: "#a855f7" },
  ];

  const TOOL_CODE: Record<string, { label: string; color: string; code: string }> = {
    webpack: {
      label: "webpack.config.js — aliases, env vars, code splitting",
      color: "#f59e0b",
      code: `// webpack.config.js — configured from scratch
const path = require("path");
const { DefinePlugin } = require("webpack");

module.exports = (env) => ({
  entry: "./src/index.tsx",
  output: {
    path: path.resolve(__dirname, "dist"),
    filename: "[name].[contenthash:8].js", // content hash for cache busting
    chunkFilename: "[name].[contenthash:8].chunk.js",
    clean: true,
  },
  resolve: {
    extensions: [".tsx", ".ts", ".js"],
    alias: {
      // Absolute imports instead of ../../.. hell
      "@search":  path.resolve(__dirname, "src/modules/search"),
      "@perms":   path.resolve(__dirname, "src/modules/permissions"),
      "@ui":      path.resolve(__dirname, "src/modules/ui"),
      "@bff":     path.resolve(__dirname, "src/bff"),
    },
  },
  module: {
    rules: [
      { test: /\\.tsx?$/, use: "babel-loader", exclude: /node_modules/ },
      { test: /\\.css$/,  use: ["style-loader", "css-loader"] },
    ],
  },
  plugins: [
    new DefinePlugin({
      __DEV__: JSON.stringify(env.mode !== "production"),
      __API_BASE__: JSON.stringify(env.apiBase || "/bff"),
    }),
  ],
  optimization: {
    splitChunks: {
      chunks: "all",
      cacheGroups: {
        // Vendor: React, MobX — rarely changes. Long cache TTL.
        vendor: { test: /node_modules/, name: "vendor", priority: -10 },
        // Permissions module: separate chunk. Loaded only for authorized users.
        permissions: { test: /modules\\/permissions/, name: "permissions" },
      },
    },
  },
  devServer: { port: 3001, historyApiFallback: true, hot: true },
});`,
    },
    babel: {
      label: "babel.config.js — TypeScript + React + MobX decorators",
      color: "#f97316",
      code: `// babel.config.js — supports TS, React, and MobX decorators
module.exports = {
  presets: [
    ["@babel/preset-env", {
      targets: { browsers: ["> 1%", "not dead"] },
      useBuiltIns: "usage",
      corejs: 3,
    }],
    ["@babel/preset-react", {
      runtime: "automatic", // no need for 'import React' in every file
    }],
    "@babel/preset-typescript",
  ],
  plugins: [
    // MobX 6: decorators in legacy mode
    ["@babel/plugin-proposal-decorators", { legacy: true }],
    "@babel/plugin-proposal-class-properties",
  ],
  // Separate config for test environment (Jest)
  env: {
    test: {
      presets: [
        ["@babel/preset-env", { targets: { node: "current" } }],
        "@babel/preset-react",
        "@babel/preset-typescript",
      ],
    },
  },
};
// WHY SEPARATE TEST ENV:
// Production: transpile for browsers (targets: > 1%).
// Jest (Node): only needs modern Node.js syntax. No browser polyfills.
// Without this: Jest imports fail on ES Module syntax.`,
    },
    eslint: {
      label: ".eslintrc.js + .prettierrc — enforced quality gates",
      color: "#0ea5e9",
      code: `// .eslintrc.js — quality gates for the content safety domain
module.exports = {
  parser: "@typescript-eslint/parser",
  extends: [
    "eslint:recommended",
    "plugin:react/recommended",
    "plugin:react-hooks/recommended",  // exhaustive-deps, rules-of-hooks
    "plugin:@typescript-eslint/recommended",
    "plugin:jsx-a11y/recommended",     // accessibility for reviewer tools
    "prettier",                        // disables ESLint rules that conflict with Prettier
  ],
  rules: {
    // Domain-specific: content safety platform
    "no-console": "warn",              // no console.log in production (security: no PII)
    "@typescript-eslint/no-explicit-any": "error", // strict typing for permission checks
    "react-hooks/exhaustive-deps": "error",        // prevent stale closures in search debounce
    "jsx-a11y/interactive-supports-focus": "error",// reviewer tools must be keyboard navigable
  },
};

// .prettierrc — consistent formatting, no debates
{
  "semi": true,
  "singleQuote": false,
  "tabWidth": 2,
  "printWidth": 100,
  "trailingComma": "es5"
}

// Why Prettier + ESLint together?
// ESLint: catches code QUALITY issues (unused vars, missing deps, accessibility).
// Prettier: handles code FORMATTING (indentation, quotes, line length).
// They have different jobs. Both: run on commit via lint-staged.`,
    },
    jest: {
      label: "jest.config.js — coverage threshold, module aliases, setup",
      color: "#22c55e",
      code: `// jest.config.js — configured with coverage gate
module.exports = {
  preset: "ts-jest",
  testEnvironment: "jsdom",         // simulates browser DOM
  setupFilesAfterFramework: [
    "@testing-library/jest-dom",    // adds .toBeInTheDocument() etc.
    "./src/__test-utils__/setup.ts",// global mocks, fetch mock, MobX configure
  ],
  moduleNameMapper: {
    // Mirror webpack aliases for Jest
    "^@search/(.*)$":  "<rootDir>/src/modules/search/$1",
    "^@perms/(.*)$":   "<rootDir>/src/modules/permissions/$1",
    "^@ui/(.*)$":      "<rootDir>/src/modules/ui/$1",
    // Mock static assets (images, CSS)
    "\\.(jpg|png|svg|css)$": "<rootDir>/src/__mocks__/fileMock.js",
  },
  coverageThreshold: {
    global: {
      branches:   70,  // if/else coverage
      functions:  70,
      lines:      70,
      statements: 70,
    },
    // Higher bar for permission module (security-critical)
    "./src/modules/permissions/": {
      branches:  90,
      functions: 90,
      lines:     90,
    },
  },
  collectCoverageFrom: [
    "src/**/*.{ts,tsx}",
    "!src/**/*.stories.tsx",   // exclude Storybook stories
    "!src/**/*.d.ts",          // exclude type declarations
  ],
};
// WHY 90% COVERAGE FOR PERMISSIONS:
// The permission module: security-critical.
// A bug in permissions = a reviewer sees content they shouldn't.
// Higher coverage threshold: more edge cases tested.
// CI: fails if permissions coverage drops below 90%.`,
    },
    "lint-staged": {
      label: ".lintstagedrc — runs ONLY on changed files (fast pre-commit)",
      color: "#a855f7",
      code: `// .lintstagedrc — pre-commit hooks (via husky)
{
  "*.{ts,tsx}": [
    "eslint --fix",                    // auto-fix what can be fixed
    "prettier --write",                // format the file
    "jest --findRelatedTests --passWithNoTests" // run tests for changed files
  ],
  "*.{json,md}": [
    "prettier --write"                 // format JSON and docs too
  ]
}
// CONFIGURED WITH HUSKY (git hooks):
// .husky/pre-commit:
//   #!/bin/sh
//   npx lint-staged
//
// WHY lint-staged (not just "run ESLint on all files"):
// Running ESLint on ALL files: takes 30+ seconds on a large codebase.
// Engineers: skip the hook. Write --no-verify commits. Quality degrades.
//
// lint-staged: ONLY runs on files staged for this commit.
// If you changed 3 files: runs ESLint on those 3 files. ~2 seconds.
// Fast: engineers don't skip it.
//
// "--findRelatedTests": Jest finds tests related to the changed files.
// Changed src/modules/permissions/gate.ts?
// Jest: runs gate.test.ts and any test that imports gate.ts.
// Fast and targeted. Not a full test suite run.
//
// RESULT: Every commit is linted, formatted, and tested.
// Broken code: cannot be committed. Quality: maintained automatically.`,
    },
  };

  const TABS = [
    { id: "search"   as const, label: "🔍 Search Platform"  },
    { id: "perms"    as const, label: "🔐 Permission System" },
    { id: "devsetup" as const, label: "⚙ Dev Setup"         },
  ];

  return (
    <div style={{ background: "#0f172a", color: "#f1f5f9", fontFamily: "'Inter', system-ui, sans-serif", minHeight: "100vh", padding: 24 }}>
      {/* Header */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
          <div style={{ width: 36, height: 36, borderRadius: 8, background: "linear-gradient(135deg,#0ea5e9,#a855f7)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>🔍</div>
          <div>
            <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800 }}>Content Safety Search Platform — Zero to Production in 2 Weeks</h1>
            <p style={{ margin: 0, color: "#64748b", fontSize: 13 }}>Multi-level filters · RBAC permission system · webpack / Babel / Jest / lint-staged · Modular architecture</p>
          </div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8 }}>
          {[
            { v: "2 weeks", l: "Zero → Production",    c: "#fe2c55", sub: "Conception → full scale"        },
            { v: "5-dim",   l: "Multi-level Filters",  c: "#0ea5e9", sub: "Type/Category/Severity/Region/Status" },
            { v: "RBAC",    l: "Permission System",    c: "#a855f7", sub: "Frontend gate + BFF enforcement" },
            { v: "Module",  l: "Extensible Arch",      c: "#22c55e", sub: "Plug into other TikTok projects" },
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

      {/* ── SEARCH PLATFORM ── */}
      {activeTab === "search" && (
        <div style={{ display: "grid", gridTemplateColumns: "200px 1fr", gap: 10 }}>
          {/* Filter panel */}
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
              <div style={{ fontSize: 9, fontWeight: 700, color: "#64748b", letterSpacing: "0.08em" }}>FILTERS</div>
              {activeFilters.length > 0 && <button onClick={clearAll} style={{ fontSize: 7, background: "transparent", border: "none", cursor: "pointer", color: "#ef4444" }}>Clear all</button>}
            </div>

            {/* Search input */}
            <div style={{ marginBottom: 10 }}>
              <input value={filters.query} onChange={e => updateFilter("query", e.target.value)} placeholder="Search content…" style={{ width: "100%", background: "#1e293b", border: "1px solid #334155", borderRadius: 7, padding: "7px 10px", color: "#f1f5f9", fontSize: 9, boxSizing: "border-box", outline: "none" }} />
            </div>

            {/* Filter groups */}
            {[
              { label: "Content Type", opts: ["video", "live", "comment", "account"] as ContentType[], key: "contentTypes" as const, colors: { video: "#0ea5e9", live: "#fe2c55", comment: "#22c55e", account: "#a855f7" } },
            ].map(fg => (
              <div key={fg.label} style={{ marginBottom: 10 }}>
                <div style={{ fontSize: 7, fontWeight: 700, color: "#64748b", marginBottom: 4 }}>{fg.label}</div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                  {fg.opts.map(opt => {
                    const active = (filters[fg.key] as string[]).includes(opt);
                    const c = (fg.colors as Record<string, string>)[opt] || "#64748b";
                    return (
                      <button key={opt} onClick={() => updateFilter(fg.key, toggleFilter(filters[fg.key] as ContentType[], opt as ContentType))} style={{ fontSize: 7, background: active ? c + "20" : "#1e293b", border: `1px solid ${active ? c : "#334155"}`, borderRadius: 4, padding: "3px 7px", cursor: "pointer", color: active ? c : "#64748b", fontWeight: active ? 700 : 400 }}>{opt}</button>
                    );
                  })}
                </div>
              </div>
            ))}

            <div style={{ marginBottom: 10 }}>
              <div style={{ fontSize: 7, fontWeight: 700, color: "#64748b", marginBottom: 4 }}>Category</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
                {ALL_CATEGORIES.map(cat => {
                  const active = filters.categories.includes(cat);
                  const c = CAT_COLORS[cat].c;
                  return (
                    <button key={cat} onClick={() => updateFilter("categories", toggleFilter(filters.categories, cat))} style={{ fontSize: 7, background: active ? c + "15" : "#1e293b", border: `1px solid ${active ? c : "#334155"}`, borderRadius: 4, padding: "4px 8px", cursor: "pointer", color: active ? c : "#64748b", textAlign: "left", fontWeight: active ? 700 : 400 }}>{CAT_COLORS[cat].label}</button>
                  );
                })}
              </div>
            </div>

            <div style={{ marginBottom: 10 }}>
              <div style={{ fontSize: 7, fontWeight: 700, color: "#64748b", marginBottom: 4 }}>Severity</div>
              <div style={{ display: "flex", gap: 3 }}>
                {(["p0", "p1", "p2", "p3"] as SeverityLevel[]).map(s => {
                  const active = filters.severity.includes(s);
                  return <button key={s} onClick={() => updateFilter("severity", toggleFilter(filters.severity, s))} style={{ flex: 1, fontSize: 7, background: active ? SEV_COLORS[s] + "20" : "#1e293b", border: `1px solid ${active ? SEV_COLORS[s] : "#334155"}`, borderRadius: 4, padding: "4px", cursor: "pointer", color: active ? SEV_COLORS[s] : "#64748b", fontWeight: 700 }}>{s.toUpperCase()}</button>;
                })}
              </div>
            </div>

            <div style={{ marginBottom: 10 }}>
              <div style={{ fontSize: 7, fontWeight: 700, color: "#64748b", marginBottom: 4 }}>Region</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 3 }}>
                {ALL_REGIONS.map(r => {
                  const active = filters.regions.includes(r);
                  return <button key={r} onClick={() => updateFilter("regions", toggleFilter(filters.regions, r))} style={{ fontSize: 7, background: active ? "#0ea5e920" : "#1e293b", border: `1px solid ${active ? "#0ea5e9" : "#334155"}`, borderRadius: 4, padding: "3px 7px", cursor: "pointer", color: active ? "#38bdf8" : "#64748b", fontWeight: active ? 700 : 400 }}>{r}</button>;
                })}
              </div>
            </div>

            <div style={{ marginBottom: 10 }}>
              <div style={{ fontSize: 7, fontWeight: 700, color: "#64748b", marginBottom: 4 }}>Status</div>
              {(["unreviewed", "in_review", "reviewed"] as ReviewStatus[]).map(s => {
                const active = filters.status.includes(s);
                return <button key={s} onClick={() => updateFilter("status", toggleFilter(filters.status, s))} style={{ display: "block", width: "100%", marginBottom: 3, fontSize: 7, background: active ? STATUS_COLORS[s] + "15" : "#1e293b", border: `1px solid ${active ? STATUS_COLORS[s] : "#334155"}`, borderRadius: 4, padding: "4px 8px", cursor: "pointer", color: active ? STATUS_COLORS[s] : "#64748b", textAlign: "left", fontWeight: active ? 700 : 400 }}>{s.replace("_", " ")}</button>;
              })}
            </div>

            <div>
              <div style={{ fontSize: 7, fontWeight: 700, color: "#64748b", marginBottom: 4 }}>Min reports: {filters.minReporters || "any"}</div>
              <input type="range" min={0} max={500} step={50} value={filters.minReporters} onChange={e => updateFilter("minReporters", Number(e.target.value))} style={{ width: "100%", accentColor: "#0ea5e9" }} />
            </div>
          </div>

          {/* Results */}
          <div>
            {/* Results header */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
              <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                <span style={{ fontSize: 9, fontWeight: 700 }}>{searching ? "Searching…" : `${results.length} result${results.length !== 1 ? "s" : ""}`}</span>
                {searchTime !== null && <span style={{ fontSize: 7, color: "#64748b" }}>({searchTime}ms)</span>}
              </div>
              <div style={{ display: "flex", gap: 5 }}>
                {(["reporters", "date", "severity"] as const).map(s => (
                  <button key={s} onClick={() => setSortBy(s)} style={{ fontSize: 7, background: sortBy === s ? "#1e293b" : "transparent", border: `1px solid ${sortBy === s ? "#334155" : "transparent"}`, borderRadius: 4, padding: "3px 8px", cursor: "pointer", color: sortBy === s ? "#f1f5f9" : "#64748b" }}>
                    {s === "reporters" ? "⚑ Reports" : s === "date" ? "📅 Date" : "⚠ Severity"}
                  </button>
                ))}
              </div>
            </div>

            {/* Active filter chips */}
            {activeFilters.length > 0 && (
              <div style={{ display: "flex", gap: 4, flexWrap: "wrap", marginBottom: 8 }}>
                {activeFilters.map(f => <Tag key={f} text={f} color="#0ea5e9" />)}
              </div>
            )}

            {/* Result cards */}
            <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
              {sorted.length === 0 ? (
                <div style={{ textAlign: "center", color: "#334155", padding: 40, fontSize: 12 }}>No results match the current filters</div>
              ) : sorted.map(item => (
                <div key={item.id} style={{ background: "#1e293b", border: "1px solid #334155", borderRadius: 10, padding: "11px 14px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <div style={{ display: "flex", gap: 8, alignItems: "flex-start", flex: 1 }}>
                      <span style={{ fontSize: 20 }}>{item.emoji}</span>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 10, fontWeight: 700, marginBottom: 4 }}>{item.title}</div>
                        <div style={{ display: "flex", gap: 5, flexWrap: "wrap", marginBottom: 5 }}>
                          <Tag text={item.type}                      color="#475569" />
                          <Tag text={CAT_COLORS[item.category].label} color={CAT_COLORS[item.category].c} />
                          <Tag text={item.severity.toUpperCase()}     color={SEV_COLORS[item.severity]} />
                          <Tag text={item.region}                    color="#64748b" />
                          <Tag text={item.status.replace("_", " ")}  color={STATUS_COLORS[item.status]} />
                        </div>
                        <div style={{ fontSize: 8, color: "#64748b" }}>{item.snippet}</div>
                      </div>
                    </div>
                    <div style={{ textAlign: "right", flexShrink: 0, paddingLeft: 12 }}>
                      <div style={{ fontSize: 16, fontWeight: 900, color: item.reporters > 400 ? "#ef4444" : item.reporters > 150 ? "#f59e0b" : "#64748b" }}>{item.reporters}</div>
                      <div style={{ fontSize: 6, color: "#475569" }}>reports</div>
                      <div style={{ fontSize: 7, color: "#475569", marginTop: 4 }}>{item.date}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── PERMISSION SYSTEM ── */}
      {activeTab === "perms" && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
          {/* Left: role matrix + simulator */}
          <div>
            <div style={{ fontSize: 10, fontWeight: 700, color: "#64748b", marginBottom: 8, letterSpacing: "0.08em" }}>RBAC PERMISSION MATRIX</div>

            {/* Role selector */}
            <div style={{ display: "flex", gap: 5, marginBottom: 10, flexWrap: "wrap" }}>
              {REVIEWERS.map(r => (
                <button key={r.role} onClick={() => setSelectedRole(r)} style={{ fontSize: 8, background: selectedRole.role === r.role ? r.color + "20" : "#1e293b", border: `1px solid ${selectedRole.role === r.role ? r.color : "#334155"}`, borderRadius: 7, padding: "5px 12px", cursor: "pointer", color: selectedRole.role === r.role ? r.color : "#64748b", fontWeight: 700 }}>{r.name}</button>
              ))}
            </div>

            {/* Permission matrix */}
            <div style={{ background: "#1e293b", border: "1px solid #334155", borderRadius: 10, padding: 12, marginBottom: 10 }}>
              <div style={{ fontSize: 8, fontWeight: 700, marginBottom: 8, color: selectedRole.color }}>
                {selectedRole.name} — Permissions
              </div>
              <div style={{ marginBottom: 8 }}>
                <div style={{ fontSize: 7, color: "#64748b", marginBottom: 4 }}>Categories</div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                  {ALL_CATEGORIES.map(cat => {
                    const allowed = selectedRole.allowedCategories.includes(cat);
                    return <span key={cat} style={{ fontSize: 7, background: allowed ? CAT_COLORS[cat].c + "20" : "#0f172a", color: allowed ? CAT_COLORS[cat].c : "#334155", borderRadius: 4, padding: "2px 7px", border: `1px solid ${allowed ? CAT_COLORS[cat].c + "40" : "#1e293b"}`, textDecoration: allowed ? "none" : "line-through" }}>{allowed ? "✓" : "✗"} {CAT_COLORS[cat].label}</span>;
                  })}
                </div>
              </div>
              <div style={{ marginBottom: 8 }}>
                <div style={{ fontSize: 7, color: "#64748b", marginBottom: 4 }}>Regions</div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                  {ALL_REGIONS.map(r => {
                    const allowed = selectedRole.allowedRegions.includes(r);
                    return <span key={r} style={{ fontSize: 7, background: allowed ? "#0ea5e920" : "#0f172a", color: allowed ? "#38bdf8" : "#334155", borderRadius: 4, padding: "2px 7px", border: `1px solid ${allowed ? "#0ea5e940" : "#1e293b"}`, textDecoration: allowed ? "none" : "line-through" }}>{allowed ? "✓" : "✗"} {r}</span>;
                  })}
                </div>
              </div>
              <div style={{ display: "flex", gap: 6 }}>
                {[["Bulk Actions", selectedRole.canBulkAction], ["Export", selectedRole.canExport], ["View Stats", selectedRole.canViewStats]].map(([label, val]) => (
                  <span key={label as string} style={{ fontSize: 7, background: val ? "#22c55e20" : "#ef444415", color: val ? "#4ade80" : "#f87171", borderRadius: 4, padding: "2px 8px", border: `1px solid ${val ? "#22c55e30" : "#ef444430"}` }}>{val ? "✓" : "✗"} {label}</span>
                ))}
              </div>
            </div>

            {/* Request simulator */}
            <div style={{ background: "#1e293b", border: "1px solid #334155", borderRadius: 10, padding: 12, marginBottom: 10 }}>
              <div style={{ fontSize: 8, fontWeight: 700, marginBottom: 8 }}>🧪 BFF Permission Simulator</div>
              <div style={{ fontSize: 7, color: "#64748b", marginBottom: 6 }}>Simulate a search request as <span style={{ color: selectedRole.color, fontWeight: 700 }}>{selectedRole.name}</span>:</div>
              <div style={{ display: "flex", gap: 6, marginBottom: 8 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 6, color: "#64748b", marginBottom: 3 }}>Category</div>
                  <select value={simCategory} onChange={e => setSimCategory(e.target.value as Category)} style={{ width: "100%", background: "#0f172a", border: "1px solid #334155", borderRadius: 5, padding: "5px 6px", color: "#f1f5f9", fontSize: 8, outline: "none" }}>
                    {ALL_CATEGORIES.map(c => <option key={c} value={c}>{CAT_COLORS[c].label}</option>)}
                  </select>
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 6, color: "#64748b", marginBottom: 3 }}>Region</div>
                  <select value={simRegion} onChange={e => setSimRegion(e.target.value as Region)} style={{ width: "100%", background: "#0f172a", border: "1px solid #334155", borderRadius: 5, padding: "5px 6px", color: "#f1f5f9", fontSize: 8, outline: "none" }}>
                    {ALL_REGIONS.map(r => <option key={r} value={r}>{r}</option>)}
                  </select>
                </div>
              </div>
              <button onClick={simulateRequest} disabled={simulating} style={{ width: "100%", background: "#0ea5e920", border: "1px solid #0ea5e9", borderRadius: 7, padding: "7px", cursor: simulating ? "not-allowed" : "pointer", color: "#38bdf8", fontSize: 9, fontWeight: 700 }}>
                {simulating ? "Sending request…" : "▶ Simulate Request to BFF"}
              </button>
            </div>

            {/* Request log */}
            <div>
              <div style={{ fontSize: 8, fontWeight: 700, color: "#64748b", marginBottom: 6 }}>BFF Request Log</div>
              {reqLogs.length === 0 ? (
                <div style={{ fontSize: 8, color: "#334155", textAlign: "center", padding: 16 }}>No requests yet — simulate above</div>
              ) : reqLogs.map((log, i) => (
                <div key={i} style={{ background: "#1e293b", border: `1px solid ${log.color}30`, borderRadius: 7, padding: "7px 10px", marginBottom: 4 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 2 }}>
                    <span style={{ fontSize: 7, fontFamily: "monospace", color: "#64748b" }}>{log.ts} {log.endpoint}</span>
                    <span style={{ fontSize: 7, background: log.color + "20", color: log.color, borderRadius: 3, padding: "0 6px", fontWeight: 700 }}>{log.result.toUpperCase()}</span>
                  </div>
                  <div style={{ fontSize: 7, color: "#475569" }}>{log.role} · {CAT_COLORS[log.category].label} · {log.region}</div>
                  <div style={{ fontSize: 7, color: log.color, marginTop: 2 }}>{log.result === "denied" ? "✗" : "✓"} {log.reason}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Right: code */}
          <div>
            <div style={{ fontSize: 10, fontWeight: 700, color: "#64748b", marginBottom: 8, letterSpacing: "0.08em" }}>IMPLEMENTATION DEPTH</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <CodeBlock label="Frontend PermissionGate + route guard" color="#a855f7" code={
`// PERMISSION GATE: declarative permission enforcement in UI
// Usage: wrap any UI element that requires a permission.

interface PermissionGateProps {
  require: Permission | Permission[];
  fallback?: React.ReactNode; // what to render if not permitted
  children: React.ReactNode;
}

function PermissionGate({ require, fallback = null, children }: PermissionGateProps) {
  const permissions = usePermissions(); // from JWT token in auth context
  const required    = Array.isArray(require) ? require : [require];
  const permitted   = required.every(p => permissions.has(p));
  if (!permitted) return <>{fallback}</>;
  return <>{children}</>;
}

// USAGE IN SEARCH RESULTS:
<PermissionGate
  require={{ action: "view", category: "minor_safety" }}
  fallback={<LockedBadge reason="Requires Senior+ role" />}
>
  <ContentCard item={item} />
</PermissionGate>

// ROUTE GUARD: prevent navigation to unauthorized pages
// Applied at the router level:
function ProtectedRoute({ permissions, element }: ProtectedRouteProps) {
  const userPerms = usePermissions();
  const canAccess = permissions.every(p => userPerms.has(p));
  if (!canAccess) return <Navigate to="/unauthorized" replace />;
  return element;
}

// <ProtectedRoute
//   permissions={[{ action: "view", category: "minor_safety" }]}
//   element={<MinorSafetyQueuePage />}
// />

// PERMISSION DERIVATION FROM JWT:
// JWT payload: { role: "senior_reviewer", scopes: ["violence", "hate_speech", "us", "eu"] }
// usePermissions(): decodes JWT, builds a Set<Permission> of allowed actions.
// Permission check: O(1). No network request. No server round trip.
// Refresh: when JWT expires, re-decode the new JWT.

// WHY BOTH FRONTEND AND BFF?
// Frontend PermissionGate: improves UX. Hides elements the user can't use.
//   NOT a security boundary. The browser is untrusted. Any user can bypass frontend checks.
// BFF permission middleware: THE actual security boundary.
//   Even if a reviewer bypasses the UI, the BFF rejects the request.
//   "Defense in depth": both layers, for different reasons.`} />

              <CodeBlock label="BFF permission middleware — server-side enforcement" color="#ef4444" code={
`// BFF PERMISSION MIDDLEWARE (Express)
// This is the ACTUAL security boundary. Frontend checks = UX only.

import { verify } from "jsonwebtoken";

const ROLE_PERMISSIONS: Record<Role, Permissions> = {
  junior_reviewer: {
    categories: ["spam", "misinformation"],
    regions:    ["US", "EU"],
    actions:    ["view", "submit_decision"],
  },
  senior_reviewer: {
    categories: ["spam", "misinformation", "hate_speech", "violence"],
    regions:    ["US", "EU", "SEA", "APAC"],
    actions:    ["view", "submit_decision", "bulk_action", "view_stats"],
  },
  team_lead: {
    categories: ["spam", "misinformation", "hate_speech", "violence", "adult"],
    regions:    ["US", "EU", "SEA", "APAC", "MENA", "LATAM"],
    actions:    ["view", "submit_decision", "bulk_action", "view_stats", "export"],
  },
  admin: { categories: ALL_CATEGORIES, regions: ALL_REGIONS, actions: ALL_ACTIONS },
};

export function permissionMiddleware(req, res, next) {
  // 1. Extract + verify JWT
  const token = req.headers.authorization?.slice(7);
  if (!token) return res.status(401).json({ error: "No token" });

  let payload;
  try {
    payload = verify(token, process.env.JWT_SECRET);
  } catch (e) {
    return res.status(401).json({ error: "Invalid token" });
  }

  // 2. Get role permissions
  const perms = ROLE_PERMISSIONS[payload.role];
  if (!perms) return res.status(403).json({ error: "Unknown role" });

  // 3. Check request against permissions
  const { category, region } = req.body;

  if (category && !perms.categories.includes(category)) {
    return res.status(403).json({
      error: "Unauthorized",
      reason: \`Category "\${category}" not in role scope\`,
      // Audit log: this is a security event
    });
  }

  if (region && !perms.regions.includes(region)) {
    return res.status(403).json({
      error: "Unauthorized",
      reason: \`Region "\${region}" not authorized\`,
    });
  }

  // 4. Attach permissions to request for downstream use
  req.reviewer = { id: payload.sub, role: payload.role, permissions: perms };

  // 5. Audit log every request (security requirement)
  auditLogger.log({
    reviewerId: payload.sub, role: payload.role,
    endpoint: req.path, category, region,
    result: "allowed", timestamp: new Date().toISOString(),
  });

  next();
}

// WHY AUDIT LOGGING?
// Content safety: regulated. Every content decision: must be traceable.
// "Who reviewed this content?" "When?" "What decision?" "Under what authority?"
// Audit log: answers all of these. Required for compliance.`} />
            </div>
          </div>
        </div>
      )}

      {/* ── DEV SETUP + MODULAR ARCH ── */}
      {activeTab === "devsetup" && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
          {/* Left: sprint + toolchain */}
          <div>
            <div style={{ fontSize: 10, fontWeight: 700, color: "#64748b", marginBottom: 8, letterSpacing: "0.08em" }}>2-WEEK SPRINT TO PRODUCTION</div>
            <div style={{ marginBottom: 12 }}>
              {SPRINT.map(day => (
                <div key={day.day} style={{ marginBottom: 8 }}>
                  <div style={{ fontSize: 8, fontWeight: 700, color: "#94a3b8", marginBottom: 4 }}>{day.day}</div>
                  {day.tasks.map(task => (
                    <div key={task.label} style={{ display: "flex", gap: 8, alignItems: "center", background: "#1e293b", border: "1px solid #334155", borderRadius: 6, padding: "6px 10px", marginBottom: 3 }}>
                      <span style={{ fontSize: 9, color: "#22c55e" }}>✓</span>
                      <span style={{ fontSize: 8, flex: 1 }}>{task.label}</span>
                      <Tag text={task.tag} color={TAG_COLORS[task.tag]} />
                    </div>
                  ))}
                </div>
              ))}
            </div>

            {/* Tool selector */}
            <div style={{ fontSize: 10, fontWeight: 700, color: "#64748b", marginBottom: 8, letterSpacing: "0.08em" }}>TOOLCHAIN (click to see config)</div>
            <div style={{ display: "flex", gap: 5, marginBottom: 10, flexWrap: "wrap" }}>
              {TOOLS.map(t => (
                <button key={t.id} onClick={() => setExpandedTool(expandedTool === t.id ? null : t.id)} style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 8, background: expandedTool === t.id ? t.color + "20" : "#1e293b", border: `1px solid ${expandedTool === t.id ? t.color : "#334155"}`, borderRadius: 7, padding: "6px 12px", cursor: "pointer", color: expandedTool === t.id ? t.color : "#64748b", fontWeight: 700 }}>{t.icon} {t.label}</button>
              ))}
            </div>

            {expandedTool && TOOL_CODE[expandedTool] && (
              <CodeBlock label={TOOL_CODE[expandedTool].label} color={TOOL_CODE[expandedTool].color} code={TOOL_CODE[expandedTool].code} />
            )}
          </div>

          {/* Right: modular architecture + code */}
          <div>
            <div style={{ fontSize: 10, fontWeight: 700, color: "#64748b", marginBottom: 8, letterSpacing: "0.08em" }}>MODULAR ARCHITECTURE</div>

            {/* Module tree */}
            <div style={{ background: "#1e293b", border: "1px solid #334155", borderRadius: 10, padding: 12, marginBottom: 10 }}>
              <div style={{ fontSize: 8, fontWeight: 700, marginBottom: 8 }}>📦 Module Structure — Extractable + Reusable</div>
              {[
                { name: "@tt-safety/search",       desc: "Multi-level filter + results engine",  color: "#0ea5e9", consumers: ["Content Safety", "Creator Ops", "Ads Review"]     },
                { name: "@tt-safety/permissions",  desc: "RBAC gate + BFF middleware",           color: "#a855f7", consumers: ["Content Safety", "Live Ops", "Policy Dashboard"]  },
                { name: "@tt-safety/ui",           desc: "Shared component library (design system)", color: "#22c55e", consumers: ["Content Safety", "All internal tools"]       },
                { name: "@tt-safety/audit-logger", desc: "Compliance-ready event logging",       color: "#f59e0b", consumers: ["Content Safety", "Policy", "Legal dashboard"]     },
              ].map(mod => (
                <div key={mod.name} style={{ background: "#0f172a", border: `1px solid ${mod.color}20`, borderRadius: 7, padding: "8px 10px", marginBottom: 6 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
                    <span style={{ fontSize: 8, fontFamily: "monospace", color: mod.color, fontWeight: 700 }}>{mod.name}</span>
                    <Tag text="npm package" color="#64748b" />
                  </div>
                  <div style={{ fontSize: 7, color: "#64748b", marginBottom: 4 }}>{mod.desc}</div>
                  <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                    {mod.consumers.map(c => <Tag key={c} text={c} color={mod.color} />)}
                  </div>
                </div>
              ))}
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <CodeBlock label="Module design — publishable packages, clean interfaces" color="#22c55e" code={
`// MODULAR ARCHITECTURE: WHY AND HOW
//
// PROBLEM: TikTok has 10+ internal safety tools.
// Without modularization: each tool reimplements search, permissions, UI.
// 10 implementations of the same filter panel:
//   - 10 places to fix bugs
//   - 10 slightly different UX behaviors
//   - 10 permission systems that might have inconsistencies
//
// SOLUTION: extract into publishable npm packages.
//
// @tt-safety/search — the search module
// src/modules/search/
//   index.ts          // public API (what consumers can import)
//   FilterPanel.tsx   // the filter UI component
//   useSearch.ts      // the search logic hook
//   searchEngine.ts   // filter application logic
//   types.ts          // shared TypeScript types
//
// CLEAN INTERFACE: consumers import only from index.ts
// import { FilterPanel, useSearch, SearchConfig } from "@tt-safety/search";
// NOT: import { ... } from "@tt-safety/search/src/internal/engine"
// index.ts: exports only the public API. Internal implementation: opaque.
//
// @tt-safety/permissions — the RBAC module
// src/modules/permissions/
//   index.ts           // exports: PermissionGate, usePermissions, middleware
//   PermissionGate.tsx // React component
//   usePermissions.ts  // hook for reading permissions
//   middleware.ts      // Express middleware (for BFF)
//   types.ts           // Role, Permission, Scope types
//
// KEY DESIGN DECISION: the permissions module exports BOTH frontend and BFF code.
// They use the SAME role definitions (ROLE_PERMISSIONS constant).
// Frontend and BFF: always in sync. One source of truth for what each role can do.
// If a role gets a new permission: update ROLE_PERMISSIONS once. Affects both.
//
// VERSIONING: semantic versioning (semver).
// Breaking change (new required prop): major version bump (1.x.x → 2.0.0).
// Other tools: pin to a major version. Opt into breaking changes intentionally.
// This: prevents the "someone changed the shared module and broke our tool" problem.
//
// HOW THIS ENABLED 2-WEEK DELIVERY:
// Because the modules have clean interfaces, other teams can:
//   1. Depend on them without understanding the internals.
//   2. Integrate in hours, not days.
// Creator Ops team: integrated @tt-safety/search into their platform in 4 hours.
// They didn't need to understand the debounce logic, the filter state management,
// or the result ranking algorithm. They just used the public API.`} />

              <CodeBlock label="From conception to production — the 2-week reality" color="#fe2c55" code={
`// 2 WEEKS: CONCEPTION TO PRODUCTION — HOW?
//
// THE CONTEXT:
// Legal/policy team: "We need content reviewers to search for content
// by category AND region AND severity AND reporter count. NOW. We have
// a regulatory deadline in 2 weeks."
//
// TWO THINGS THAT MADE IT POSSIBLE:
//
// 1. TOOLCHAIN FIRST (Days 1–2)
// Temptation: start building features immediately.
// Reality: without a proper toolchain, every hour later costs 3 hours.
//   No ESLint: PRs contain 200 lines of formatting debates. Slow reviews.
//   No lint-staged: broken code gets committed. Debugging is harder.
//   No Jest configured: tests can't be added. Technical debt accumulates.
//   No aliases: ../../../../../../module imports. Every refactor is painful.
//
// Set up the toolchain on Day 1-2: the rest of the 2 weeks flows faster.
// NOT because the toolchain is the product. Because the toolchain enables
// the product to be built correctly at high speed.
//
// 2. SCOPE DISCIPLINE
// What we shipped in 2 weeks:
//   ✓ Multi-level filters (5 dimensions: type, category, severity, region, status)
//   ✓ Search results with sort + basic pagination
//   ✓ Permission system (frontend + BFF)
//   ✓ 70%+ test coverage for base components
//   ✓ Production deployment
//
// What we deferred (post-launch):
//   ✗ Advanced analytics dashboard
//   ✗ Bulk action UI (permission-controlled: built later)
//   ✗ Saved searches / filter presets
//   ✗ Export functionality
//
// Feature flags: deferred features: behind flags. Built in parallel.
// Deployed to production but not visible to reviewers until ready.
//
// DEPLOYMENT:
// Staging: Day 10. Smoke tests. Legal team review.
// Production: Day 11. Feature flags off. Limited reviewer group.
// Day 12-13: bug reports, hotfixes.
// Day 14: all reviewers. Full rollout.
//
// POST-LAUNCH MONITORING:
// Datadog: dashboard for p95 search latency, error rates, permission rejections.
// Permission rejection spike on Day 12: a JWT format change broke scope parsing.
// Detected within 4 minutes. Hotfix deployed within 30 minutes.
// Monitoring: not optional. At this speed of delivery, you WILL miss something.
// The monitoring: catches what you missed.`} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default SearchPlatformDemo;
