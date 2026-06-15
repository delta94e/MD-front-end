/**
 * AnsaradaCoreTeamDemo.tsx
 *
 * Career journey: Interface Engineer (Core/Collectives) → Cross-team Tech Lead
 *
 * ACHIEVEMENTS
 *   - Built custom component frameworks + established CI/CD for SPAs
 *   - Introduced & led Microfrontend adoption: monolith → 4 independent apps
 *   - Cross-team frontend specialist supporting multiple teams
 *   - Speaker at Ansarada Tech Meetup 2017: ReactJS vs AngularJS
 *
 * TABS
 *   📈 Evolution      — IC → TL career growth timeline
 *   🧩 Component FW   — custom component framework + CI/CD for SPAs
 *   🏗 Monolith → MFE — splitting the monolith into 4 independent apps (pre-Module Federation)
 *   🎤 React vs Angular — 2017 tech talk: why React over AngularJS
 */

import React, { useState } from "react";

// ─────────────────────────────────────────────────────────────────
// Data
// ─────────────────────────────────────────────────────────────────

const EVOLUTION_STEPS = [
  {
    phase: "Interface Engineer",
    period: "Year 1-2",
    icon: "💻",
    color: "#64748b",
    team: "Core (Collectives) Team",
    focus: "Shipping product features as an individual contributor",
    skills: ["React", "CSS Modules", "REST APIs", "Unit testing"],
    keyWin: "Became the go-to person for React patterns and component design within the team",
  },
  {
    phase: "Platform Builder",
    period: "Year 2-3",
    icon: "🧩",
    color: "#6366f1",
    team: "Core Team (expanded scope)",
    focus: "Built shared component framework and CI/CD pipeline adopted across all teams",
    skills: ["Component API design", "Webpack", "Jenkins/CI", "Cross-team coordination"],
    keyWin: "Eliminated duplicate UI work across 4 teams — one component library, consistent product",
  },
  {
    phase: "Architect",
    period: "Year 3",
    icon: "🏗",
    color: "#0ea5e9",
    team: "All teams",
    focus: "Designed and led the monolith to MFE migration — 1 large app into 4 independent apps",
    skills: ["MFE architecture", "Nginx routing", "SPA bundling", "Team alignment"],
    keyWin: "Teams shipped independently for the first time — no more release coordination blockage",
  },
  {
    phase: "Cross-team TL",
    period: "Year 3+",
    icon: "🚀",
    color: "#10b981",
    team: "Multiple product teams",
    focus: "Floating tech lead — unblocking teams, elevating FE quality across the org",
    skills: ["Technical leadership", "Mentoring", "RFC writing", "Cross-functional communication"],
    keyWin: "Spoke at Ansarada Tech Meetup — external recognition of internal technical leadership",
  },
];

const COMPONENTS = [
  { name: "Button",    variants: ["primary", "secondary", "ghost", "danger"],    note: "Owned by platform — one API, all teams" },
  { name: "Input",     variants: ["text", "number", "date", "password"],         note: "Controlled + uncontrolled, full validation props" },
  { name: "Modal",     variants: ["sm", "md", "lg", "fullscreen"],               note: "Focus trap, ESC close, scroll lock built-in" },
  { name: "DataTable", variants: ["sortable", "filterable", "paginated"],        note: "Virtualised rows for large datasets" },
  { name: "Dropdown",  variants: ["select", "multi-select", "combobox"],         note: "ARIA roles + keyboard nav built-in" },
  { name: "Toast",     variants: ["success", "error", "warning", "info"],        note: "Portal-based, stack-aware, auto-dismiss" },
];

const CI_STAGES = [
  { step: "1", label: "Push",           icon: "📤", detail: "Developer pushes branch — webhook triggers CI pipeline",                              color: "#6366f1" },
  { step: "2", label: "Lint + Types",   icon: "✔️",  detail: "ESLint + TSC run in parallel — fast feedback, fail early",                           color: "#0ea5e9" },
  { step: "3", label: "Unit Tests",     icon: "🧪",  detail: "Jest unit tests with coverage threshold gate (80% branches)",                        color: "#f59e0b" },
  { step: "4", label: "Build",          icon: "📦",  detail: "Webpack production build — tree-shaking, code-split bundles, asset hashing",          color: "#10b981" },
  { step: "5", label: "Staging",        icon: "🚧",  detail: "Auto-deployed to staging — shareable URL for QA and design review",                  color: "#ec4899" },
  { step: "6", label: "E2E Tests",      icon: "🤖",  detail: "Cypress smoke tests against staging — critical user journeys validated",              color: "#8b5cf6" },
  { step: "7", label: "Production",     icon: "✅",  detail: "Manual approval gate then deploy to CDN (S3 + CloudFront) with cache invalidation",  color: "#4ade80" },
];

const FOUR_APPS = [
  {
    name: "Core Shell",    color: "#6366f1", route: "/",
    owns: ["Navigation", "Auth", "Global notifications", "User preferences"],
    team: "Platform", deploy: "Weekly", size: "~320KB",
    problem: "Auth + nav was duplicated in every part of the monolith",
  },
  {
    name: "Data Rooms",    color: "#0ea5e9", route: "/rooms/*",
    owns: ["VDR file tree", "Document viewer", "Permissions", "Activity feed"],
    team: "Documents", deploy: "Daily", size: "~780KB",
    problem: "The heaviest feature caused slow builds and deploy fear for all other teams",
  },
  {
    name: "Bidder Portal", color: "#f59e0b", route: "/bidder/*",
    owns: ["Bid submission", "Q&A workflow", "NDA management"],
    team: "Bidder", deploy: "Daily", size: "~410KB",
    problem: "Bidder-side features were locked behind Data Rooms release cadence",
  },
  {
    name: "Analytics",     color: "#10b981", route: "/analytics/*",
    owns: ["Activity reports", "Engagement heatmaps", "Export tools"],
    team: "Insights", deploy: "Weekly", size: "~290KB",
    problem: "Analytics experiments needed their own pace — 2-week release cycle was too slow",
  },
];

const REACT_VS_ANGULAR_POINTS = [
  {
    dimension: "Learning curve",
    react:   { verdict: "Advantage", text: "React is just JavaScript + JSX. If you know JS, you can be productive in React in 2-3 days. AngularJS requires learning scope, http, directives, apply, digest cycle — a parallel vocabulary on top of JS." },
    angular: { verdict: "Steeper",   text: "AngularJS has significant conceptual overhead — the magic of scope two-way binding is convenient until it is not, and then you need to understand the digest cycle to debug it." },
  },
  {
    dimension: "Performance",
    react:   { verdict: "Advantage", text: "Virtual DOM diffs minimise real DOM mutations. Unidirectional data flow makes performance predictable — you always know what triggers a re-render." },
    angular: { verdict: "Watcher cost", text: "AngularJS dirty-checking runs all scope watchers on every digest cycle. With a large application (hundreds of watchers), this degrades noticeably." },
  },
  {
    dimension: "Ecosystem stability",
    react:   { verdict: "Advantage", text: "React is a small, stable view library. Facebook uses it in production at massive scale. The community was growing fast in 2017." },
    angular: { verdict: "Risk",      text: "AngularJS 1.x was being abandoned by Google in favour of Angular 2 — a complete rewrite with a different API. Betting on 1.x meant inheriting a technology with a known end-of-life." },
  },
  {
    dimension: "Component model",
    react:   { verdict: "Advantage", text: "React components are functions that take props and return JSX. The mental model is simple: f(props) = UI. Composition is natural." },
    angular: { verdict: "Directive complexity", text: "AngularJS directives are powerful but complex — compile vs link functions, scope true/false, transclusion, DDO pattern. The API surface is much larger and harder to teach." },
  },
  {
    dimension: "Testing",
    react:   { verdict: "Advantage", text: "React components are easy to test: render them, assert on output. Jest + Enzyme (2017) made unit testing fast and reliable." },
    angular: { verdict: "More ceremony", text: "AngularJS tests require bootstrapping the full Angular app or mocking scope and services. More ceremony per test means fewer tests get written." },
  },
  {
    dimension: "Architecture fit",
    react:   { verdict: "Advantage", text: "For an SPA with a custom API: you do not need a full framework. React + React Router + Redux gives exactly what you need with no unnecessary opinions." },
    angular: { verdict: "Over-engineered", text: "AngularJS as a full framework is excellent for server-rendered MVC apps. For a modern SPA, much of it is machinery you do not need." },
  },
];

const VERDICT_COLOR: Record<string, string> = {
  "Advantage": "#4ade80", "Steeper": "#f97316", "Watcher cost": "#f97316",
  "Risk": "#ef4444", "Directive complexity": "#f97316", "More ceremony": "#f97316",
  "Over-engineered": "#ef4444",
};

// ─────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────

function CodeBlock({ code, label }: { code: string; label?: string }) {
  return (
    <div style={{ background: "#1e293b", borderRadius: 10, overflow: "hidden" }}>
      {label && (
        <div style={{ padding: "6px 12px", background: "#0f172a", borderBottom: "1px solid #334155", fontSize: 10, color: "#64748b" }}>
          {label}
        </div>
      )}
      <pre style={{ margin: 0, padding: 14, fontSize: 10, fontFamily: "monospace", color: "#94a3b8", lineHeight: 1.7, overflow: "auto" }}>
        {code}
      </pre>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
// Main
// ─────────────────────────────────────────────────────────────────

export function AnsaradaCoreTeamDemo() {
  const [activeTab, setActiveTab]     = useState<"evolution" | "component" | "mfe" | "talk">("evolution");
  const [ciStep, setCiStep]           = useState(0);
  const [selectedApp, setSelectedApp] = useState<number | null>(null);
  const [reactPoint, setReactPoint]   = useState(0);
  const [showMonolith, setShowMonolith] = useState(true);

  const TABS = [
    { id: "evolution"  as const, label: "📈 Evolution" },
    { id: "component"  as const, label: "🧩 Component FW" },
    { id: "mfe"        as const, label: "🏗 Monolith → MFE" },
    { id: "talk"       as const, label: "🎤 React vs Angular" },
  ];

  const curPoint = REACT_VS_ANGULAR_POINTS[reactPoint];

  return (
    <div style={{ background: "#0f172a", color: "#f1f5f9", fontFamily: "'Inter', system-ui, sans-serif", minHeight: "100vh", padding: 24 }}>

      {/* Header */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
          <span style={{ fontSize: 28 }}>🏢</span>
          <div>
            <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800 }}>Ansarada Core Team</h1>
            <p style={{ margin: 0, color: "#64748b", fontSize: 13 }}>
              Interface Engineer to Cross-team Tech Lead · Component Framework · Monolith to 4 MFEs · Tech Meetup 2017
            </p>
          </div>
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {["IC to Tech Lead", "Custom Component Framework", "CI/CD for SPAs", "Monolith Decomposition", "MFE Pioneer (2017)", "Tech Speaker", "React vs Angular"].map(t => (
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
            borderRadius: "8px 8px 0 0", padding: "8px 18px",
            cursor: "pointer", fontSize: 13, fontWeight: 600,
          }}>{tab.label}</button>
        ))}
      </div>

      {/* ── EVOLUTION ── */}
      {activeTab === "evolution" && (
        <div>
          <div style={{ background: "#1e293b", border: "1px solid #6366f130", borderRadius: 10, padding: 16, marginBottom: 20 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: "#a5b4fc", marginBottom: 6 }}>IC to Platform Builder to Architect to Cross-team TL</div>
            <div style={{ fontSize: 12, color: "#94a3b8", lineHeight: 1.7 }}>
              This evolution is not a formal promotion path — it is a pattern of expanding impact. Starting by shipping features for one team,
              noticing cross-team problems, solving them with platform investment, earning the trust to make architectural decisions,
              and eventually leading across teams without a dedicated team. Each phase unlocked the next.
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
            {EVOLUTION_STEPS.map((step, i) => (
              <div key={step.phase} style={{ display: "flex", gap: 0 }}>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", width: 44, flexShrink: 0 }}>
                  <div style={{ width: 36, height: 36, borderRadius: "50%", background: step.color + "20", border: `2px solid ${step.color}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, zIndex: 1 }}>
                    {step.icon}
                  </div>
                  {i < EVOLUTION_STEPS.length - 1 && (
                    <div style={{ width: 2, flex: 1, minHeight: 24, background: `linear-gradient(to bottom, ${step.color}, ${EVOLUTION_STEPS[i + 1].color})` }} />
                  )}
                </div>
                <div style={{ flex: 1, paddingLeft: 16, paddingBottom: 28 }}>
                  <div style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 4, flexWrap: "wrap" }}>
                    <span style={{ fontSize: 14, fontWeight: 800, color: step.color }}>{step.phase}</span>
                    <span style={{ fontSize: 10, color: "#64748b", background: "#1e293b", border: "1px solid #334155", borderRadius: 20, padding: "1px 8px" }}>{step.period}</span>
                    <span style={{ fontSize: 10, color: "#64748b" }}>— {step.team}</span>
                  </div>
                  <div style={{ fontSize: 12, color: "#94a3b8", marginBottom: 8 }}>{step.focus}</div>
                  <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 8 }}>
                    {step.skills.map(s => (
                      <span key={s} style={{ background: step.color + "15", color: step.color, border: `1px solid ${step.color}30`, borderRadius: 4, padding: "2px 8px", fontSize: 10 }}>{s}</span>
                    ))}
                  </div>
                  <div style={{ background: "#1e293b", borderLeft: `3px solid ${step.color}`, borderRadius: "0 8px 8px 0", padding: "8px 12px", fontSize: 11, color: "#f1f5f9" }}>
                    🏆 {step.keyWin}
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div style={{ background: "#1e293b", border: "1px solid #334155", borderRadius: 10, padding: 16 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: "#f1f5f9", marginBottom: 10 }}>Why this growth path is unusual — and valuable</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              {[
                { label: "Most ICs",        text: "Deepen in one domain — become an expert in their team's problem space" },
                { label: "This path",       text: "Breadth first — invested in cross-team impact — became the person who makes everyone faster" },
                { label: "Typical TL path", text: "Formal promotion — handed a team — figure out how to lead" },
                { label: "This path",       text: "Earned leadership informally through platform work — formal recognition followed organic impact" },
              ].map((r, i) => (
                <div key={String(i)} style={{ background: "#0f172a", borderRadius: 8, padding: 10 }}>
                  <div style={{ fontSize: 9, fontWeight: 700, color: i % 2 === 0 ? "#64748b" : "#6366f1", marginBottom: 4 }}>{r.label}</div>
                  <div style={{ fontSize: 11, color: "#94a3b8" }}>{r.text}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── COMPONENT FW + CI/CD ── */}
      {activeTab === "component" && (
        <div>
          <div style={{ background: "#1e293b", border: "1px solid #6366f130", borderRadius: 10, padding: 16, marginBottom: 16 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: "#a5b4fc", marginBottom: 6 }}>Context — 2016/17, before npm Component Libraries were Ubiquitous</div>
            <div style={{ fontSize: 12, color: "#94a3b8", lineHeight: 1.7 }}>
              This was before Material-UI, Ant Design, or Chakra dominated. Teams either used Bootstrap (jQuery-based, not React)
              or built their own components ad-hoc. At Ansarada, 4 product teams each had their own Button, Modal, and Input —
              slightly different APIs, styling, and accessibility behaviour. Building a shared React component library
              unified all of this, and the CI/CD pipeline made it safe and fast to ship.
            </div>
          </div>

          <div style={{ background: "#1e293b", border: "1px solid #334155", borderRadius: 10, padding: 16, marginBottom: 16 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: "#f1f5f9", marginBottom: 14 }}>Component Library — Shared Across All 4 Teams</div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10, marginBottom: 14 }}>
              {COMPONENTS.map(c => (
                <div key={c.name} style={{ background: "#0f172a", borderRadius: 8, padding: 12 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: "#a5b4fc", marginBottom: 6 }}>{c.name}</div>
                  <div style={{ display: "flex", gap: 4, flexWrap: "wrap", marginBottom: 6 }}>
                    {c.variants.map(v => (
                      <span key={v} style={{ background: "#1e293b", color: "#64748b", border: "1px solid #334155", borderRadius: 4, padding: "1px 5px", fontSize: 9 }}>{v}</span>
                    ))}
                  </div>
                  <div style={{ fontSize: 10, color: "#475569" }}>{c.note}</div>
                </div>
              ))}
            </div>
            <CodeBlock label="Design principle: consistent, typed API for every component" code={
`// Before: each team had their own Button — different every time
// Team A: <PrimaryButton label="Save" loading />
// Team B: <Btn type="submit" isLoading text="Save" />
// Team C: <button className="btn btn-primary">Save</button>
// Team D: <button style={{ background: "#1a73e8"... }}>Save</button>

// After: one Button — one API, all teams
interface ButtonProps {
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
  loading?: boolean;
  disabled?: boolean;
  icon?: React.ReactNode;
  iconPosition?: "left" | "right";
  children: React.ReactNode;
  onClick?: () => void;
  type?: "button" | "submit" | "reset";
}

// Key decisions:
// 1. children, not label — composable by default
// 2. variant, not className — prevents one-off styling
// 3. loading built-in — replaces the spinner wrapper anti-pattern
// 4. Accessible by default: aria-busy, disabled propagation, focus ring`} />
          </div>

          <div style={{ background: "#1e293b", border: "1px solid #334155", borderRadius: 10, padding: 16 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: "#f1f5f9", marginBottom: 14 }}>CI/CD Pipeline for SPAs (Jenkins + Webpack era, 2016-2017)</div>
            <div style={{ display: "flex", gap: 4, alignItems: "stretch", marginBottom: 14, flexWrap: "wrap" }}>
              {CI_STAGES.map((s, i) => (
                <React.Fragment key={s.step}>
                  <button onClick={() => setCiStep(i)} style={{
                    background: ciStep === i ? s.color + "20" : "#0f172a",
                    border: `2px solid ${ciStep === i ? s.color : "#334155"}`,
                    borderRadius: 8, padding: "8px 10px", cursor: "pointer", textAlign: "center", minWidth: 68, flexShrink: 0,
                  }}>
                    <div style={{ fontSize: 15 }}>{s.icon}</div>
                    <div style={{ fontSize: 9, fontWeight: 700, color: ciStep === i ? s.color : "#64748b", marginTop: 4, lineHeight: 1.3 }}>{s.step}. {s.label}</div>
                  </button>
                  {i < CI_STAGES.length - 1 && (
                    <div style={{ display: "flex", alignItems: "center", color: "#334155", fontSize: 14, padding: "0 2px" }}>→</div>
                  )}
                </React.Fragment>
              ))}
            </div>
            <div style={{ background: "#0f172a", borderRadius: 8, padding: 14, border: `1px solid ${CI_STAGES[ciStep].color}30`, marginBottom: 14 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: CI_STAGES[ciStep].color, marginBottom: 4 }}>Step {CI_STAGES[ciStep].step}: {CI_STAGES[ciStep].label}</div>
              <div style={{ fontSize: 12, color: "#94a3b8" }}>{CI_STAGES[ciStep].detail}</div>
            </div>
            <CodeBlock label="Jenkinsfile — the pipeline established for all SPA teams" code={
`pipeline {
  agent any
  stages {
    stage("Install")     { steps { sh "npm ci" } }
    stage("Lint + Types") {
      parallel {
        stage("Lint")  { steps { sh "npm run lint" } }
        stage("Types") { steps { sh "npm run tsc -- --noEmit" } }
      }
    }
    stage("Test") {
      steps { sh "npm test -- --coverage --ci" }
      post { always { junit "test-results.xml" } }
    }
    stage("Build") {
      steps { sh "NODE_ENV=production npm run build" }
      // Output: /dist with hashed filenames for cache busting
    }
    stage("Deploy Staging") {
      steps { sh "aws s3 sync dist/ s3://ansarada-staging-\${env.BRANCH_NAME}/" }
    }
    stage("E2E") {
      steps { sh "cypress run --env baseUrl=https://staging-\${BRANCH}.ansarada.com" }
    }
    stage("Deploy Production") {
      when { branch "main" }
      input { message "Deploy to production?" }
      steps {
        sh "aws s3 sync dist/ s3://ansarada-app/ --delete"
        sh "aws cloudfront create-invalidation --paths '/*'"
      }
    }
  }
}`} />
          </div>
        </div>
      )}

      {/* ── MONOLITH → MFE ── */}
      {activeTab === "mfe" && (
        <div>
          <div style={{ background: "#1e293b", border: "1px solid #f59e0b30", borderRadius: 10, padding: 16, marginBottom: 16 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: "#fbbf24", marginBottom: 6 }}>Historical Context — 2017, before Webpack Module Federation existed</div>
            <div style={{ fontSize: 12, color: "#94a3b8", lineHeight: 1.7 }}>
              Module Federation (the modern MFE standard) shipped with Webpack 5 in 2020.
              In 2017, splitting a monolith into independent front-end apps required different techniques:
              separate Webpack builds, Nginx reverse-proxy routing, and explicit shared state via localStorage or CustomEvents.
              This was harder, more manual, and more impressive to have pioneered at that time.
            </div>
          </div>

          {/* Toggle */}
          <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
            <button onClick={() => setShowMonolith(true)} style={{ background: showMonolith ? "#ef444420" : "#1e293b", border: `1px solid ${showMonolith ? "#ef4444" : "#334155"}`, borderRadius: 8, padding: "8px 18px", color: showMonolith ? "#ef4444" : "#64748b", cursor: "pointer", fontSize: 12, fontWeight: 600 }}>
              Before: Monolith
            </button>
            <button onClick={() => setShowMonolith(false)} style={{ background: !showMonolith ? "#4ade8020" : "#1e293b", border: `1px solid ${!showMonolith ? "#4ade80" : "#334155"}`, borderRadius: 8, padding: "8px 18px", color: !showMonolith ? "#4ade80" : "#64748b", cursor: "pointer", fontSize: 12, fontWeight: 600 }}>
              After: 4 Independent Apps
            </button>
          </div>

          {showMonolith ? (
            <div style={{ background: "#1e293b", border: "2px solid #ef444440", borderRadius: 10, padding: 16, marginBottom: 16 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: "#ef4444", marginBottom: 12 }}>The Monolith — One Giant React App</div>
              <div style={{ background: "#ef444410", border: "1px solid #ef444430", borderRadius: 8, padding: 16, marginBottom: 12 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: "#f1f5f9", marginBottom: 8, textAlign: "center" }}>ansarada-app (1 repo, 1 build, 1 deploy)</div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                  {["Core Shell + Auth", "Data Rooms (VDR)", "Bidder Portal", "Analytics"].map(area => (
                    <div key={area} style={{ background: "#1e293b", border: "1px solid #ef444430", borderRadius: 6, padding: 10, textAlign: "center", fontSize: 11, color: "#ef4444" }}>{area}</div>
                  ))}
                </div>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {[
                  "Build time: 18+ minutes for any change in any area",
                  "Release coupling: all 4 teams must coordinate every deployment",
                  "Data Rooms bug — rollback affects Bidder Portal and Analytics too",
                  "Bundle: 2.6MB — user downloads everything, even features they never use",
                  "Teams blocked: nobody ships until everyone is ready",
                  "Deploy fear: nobody deploys on Fridays. Or before 11am.",
                ].map(p => (
                  <div key={p} style={{ background: "#0f172a", borderRadius: 6, padding: "8px 12px", fontSize: 11, color: "#ef4444" }}>⚠ {p}</div>
                ))}
              </div>
            </div>
          ) : (
            <div style={{ marginBottom: 16 }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
                {FOUR_APPS.map((app, i) => (
                  <button key={app.name} onClick={() => setSelectedApp(selectedApp === i ? null : i)} style={{
                    background: selectedApp === i ? app.color + "15" : "#1e293b",
                    border: `2px solid ${selectedApp === i ? app.color : "#334155"}`,
                    borderRadius: 10, padding: 14, textAlign: "left", cursor: "pointer",
                  }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                      <span style={{ fontSize: 13, fontWeight: 700, color: app.color }}>{app.name}</span>
                      <span style={{ fontSize: 9, color: "#64748b", fontFamily: "monospace" }}>{app.route}</span>
                    </div>
                    <div style={{ fontSize: 10, color: "#64748b", marginBottom: 6 }}>{app.team} team · deploys {app.deploy} · {app.size}</div>
                    <div style={{ fontSize: 10, color: "#64748b" }}>Solved: {app.problem}</div>
                  </button>
                ))}
              </div>
              {selectedApp !== null && (
                <div style={{ background: "#1e293b", border: `1px solid ${FOUR_APPS[selectedApp].color}40`, borderRadius: 10, padding: 14, marginBottom: 12 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: FOUR_APPS[selectedApp].color, marginBottom: 8 }}>{FOUR_APPS[selectedApp].name} owns:</div>
                  <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                    {FOUR_APPS[selectedApp].owns.map(o => (
                      <span key={o} style={{ background: FOUR_APPS[selectedApp].color + "15", color: FOUR_APPS[selectedApp].color, border: `1px solid ${FOUR_APPS[selectedApp].color}30`, borderRadius: 4, padding: "3px 8px", fontSize: 11 }}>{o}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <CodeBlock label="Nginx routing — proxy rules per SPA (2017 approach)" code={
`# Each app built separately, deployed to own S3 path
# Nginx routes by URL prefix to the right bundle

server {
  listen 443 ssl;
  server_name app.ansarada.com;

  # Core shell — always loaded first
  location / {
    proxy_pass http://s3/core-shell/;
  }

  # Data Rooms — separate bundle, separate team deploy
  location /rooms/ {
    proxy_pass http://s3/data-rooms/;
  }

  # Bidder Portal
  location /bidder/ {
    proxy_pass http://s3/bidder-portal/;
  }

  # Analytics
  location /analytics/ {
    proxy_pass http://s3/analytics/;
  }
}

# Each team has their own CI pipeline.
# Each deploy touches only their S3 path.
# Other apps are unaffected.`} />
            <CodeBlock label="Shared state between SPAs (pre-Module Federation)" code={
`// In 2017 there was no runtime module sharing.
// Shared state between SPAs was handled explicitly:

// 1. Auth token — shared via httpOnly cookie
//    All apps on *.ansarada.com share the same cookie

// 2. Current deal context — URL-based
//    /rooms/deal-123 — Data Rooms reads deal-123 from URL

// 3. Cross-app events — Custom Events API
window.dispatchEvent(new CustomEvent("ansarada:notification", {
  detail: { type: "success", message: "File uploaded" }
}));
// Core shell listens and renders global notifications

// 4. User preferences — localStorage (same origin)
localStorage.setItem("ansarada:userId", userId);
localStorage.setItem("ansarada:orgId", orgId);

// 5. Navigation — full page load on cross-app transition
//    /bidder/* loads Bidder Portal bundle via Nginx
//    Each app is a SPA within its own route prefix

// This is why Module Federation (2020) was a leap:
// it solved shared runtime properly.
// We solved it manually — which is why doing it in 2017
// required more architecture thinking and team alignment.`} />
          </div>
        </div>
      )}

      {/* ── TECH TALK ── */}
      {activeTab === "talk" && (
        <div>
          <div style={{ background: "#1e293b", border: "1px solid #6366f130", borderRadius: 10, padding: 16, marginBottom: 16 }}>
            <div style={{ display: "flex", gap: 14, alignItems: "flex-start" }}>
              <div style={{ fontSize: 40, lineHeight: 1 }}>🎤</div>
              <div>
                <div style={{ fontSize: 16, fontWeight: 800, marginBottom: 4 }}>Ansarada Tech Meetup — 2017</div>
                <div style={{ fontSize: 13, color: "#94a3b8", lineHeight: 1.6 }}>
                  Talk: <strong style={{ color: "#f1f5f9" }}>"Choosing ReactJS over AngularJS"</strong> — a technical deep-dive on why our team chose React
                  as the foundation for all new frontend development at Ansarada, presented to an audience of engineers from across Sydney.
                </div>
                <div style={{ display: "flex", gap: 12, marginTop: 8, fontSize: 10, color: "#64748b", flexWrap: "wrap" }}>
                  <span>📍 Sydney, Australia</span>
                  <span>🗓 2017</span>
                  <span>⏱ 30-min talk + Q&A</span>
                </div>
              </div>
            </div>
          </div>

          {/* 2017 ecosystem */}
          <div style={{ background: "#1e293b", border: "1px solid #334155", borderRadius: 10, padding: 14, marginBottom: 16 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: "#f1f5f9", marginBottom: 10 }}>The Frontend Landscape in 2017</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
              {[
                { label: "AngularJS (1.x)", color: "#ef4444", points: ["Mature, widely adopted", "Google backing — but...", "Angular 2 released 2016 — a complete REWRITE", "1.x end-of-life signalled", "Two-way binding, dirty checking", "Directive complexity"] },
                { label: "React (15/16 era)", color: "#61dafb", points: ["Facebook production-scale", "Virtual DOM — novel at the time", "JSX — controversial, then loved", "Growing fast (npm downloads)", "Just a view library — BYORS/state", "Function components gaining traction"] },
                { label: "Angular 2",         color: "#dd0031", points: ["TypeScript-first", "Complete rewrite of AngularJS", "Community fragmented (1.x vs 2)", "Steep learning curve", "RxJS everywhere", "Not yet proven at scale in 2017"] },
              ].map(col => (
                <div key={col.label} style={{ background: "#0f172a", borderRadius: 8, padding: 12 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: col.color, marginBottom: 8 }}>{col.label}</div>
                  {col.points.map(p => (
                    <div key={p} style={{ fontSize: 10, color: "#64748b", marginBottom: 4, display: "flex", gap: 4 }}>
                      <span style={{ color: col.color, flexShrink: 0 }}>›</span>{p}
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>

          {/* Dimension comparison */}
          <div style={{ background: "#1e293b", border: "1px solid #334155", borderRadius: 10, overflow: "hidden", marginBottom: 14 }}>
            <div style={{ padding: "10px 14px", background: "#0f172a", borderBottom: "1px solid #334155", display: "flex", gap: 6, flexWrap: "wrap" }}>
              {REACT_VS_ANGULAR_POINTS.map((p, i) => (
                <button key={p.dimension} onClick={() => setReactPoint(i)} style={{
                  background: reactPoint === i ? "#6366f120" : "transparent",
                  border: `1px solid ${reactPoint === i ? "#6366f1" : "#334155"}`,
                  borderRadius: 6, padding: "4px 10px",
                  color: reactPoint === i ? "#a5b4fc" : "#64748b",
                  cursor: "pointer", fontSize: 11,
                }}>{p.dimension}</button>
              ))}
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr" }}>
              <div style={{ padding: 16, borderRight: "1px solid #334155" }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: "#61dafb", marginBottom: 6 }}>React</div>
                <div style={{ fontSize: 11, color: "#4ade80", marginBottom: 8, fontWeight: 700 }}>✅ {curPoint.react.verdict}</div>
                <div style={{ fontSize: 12, color: "#94a3b8", lineHeight: 1.7 }}>{curPoint.react.text}</div>
              </div>
              <div style={{ padding: 16 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: "#ef4444", marginBottom: 6 }}>AngularJS</div>
                <div style={{ fontSize: 11, color: VERDICT_COLOR[curPoint.angular.verdict] ?? "#f97316", marginBottom: 8, fontWeight: 700 }}>⚠ {curPoint.angular.verdict}</div>
                <div style={{ fontSize: 12, color: "#94a3b8", lineHeight: 1.7 }}>{curPoint.angular.text}</div>
              </div>
            </div>
          </div>

          <CodeBlock label="Talk conclusion — The recommendation made" code={
`// CHOOSE REACT BECAUSE:
// 1. You learn JavaScript, not Angular's framework —
//    investment that transfers to any future library
// 2. AngularJS 1.x is end-of-life — do not bet on a dying platform
// 3. Angular 2 is a full rewrite — means learning AngularJS
//    buys you nothing when you migrate to Angular 2
// 4. React's component model is simpler to reason about at scale
// 5. Virtual DOM performance is measurable and predictable
// 6. React ecosystem (Router, Redux) growing fast — community momentum

// THE RISK ACKNOWLEDGED HONESTLY:
// React is just a view library — you are responsible for choosing
// a router, state management, and data fetching.
// More decisions upfront.
// Recommendation: React + React Router + Redux (standard 2017 stack)
// This is EXPLICIT complexity — better than AngularJS IMPLICIT complexity.

// THE OUTCOME:
// Team adopted React. By 2018, the whole frontend org was React-first.
// The component library, CI pipeline, and MFE architecture were all
// built on React — each decision compounding on the previous one.
// Looking back: React is still the primary UI library at most companies
// that adopted it in 2017. The bet paid off.`} />
        </div>
      )}
    </div>
  );
}

export default AnsaradaCoreTeamDemo;
