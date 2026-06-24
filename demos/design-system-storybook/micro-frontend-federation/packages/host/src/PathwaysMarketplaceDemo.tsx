/**
 * PathwaysMarketplaceDemo.tsx
 *
 * Demonstrates work as a "bounty hunter" tech lead across multiple product teams:
 * - Pathways Marketplace: SEO-friendly isomorphic ReactJS app
 * - Shared front-end foundations: design system, shared component library
 * - Bounty hunter model: cross-team, high-leverage, context-switching tech leadership
 *
 * TABS
 *   🕵 Bounty Hunter     — the cross-team tech lead engagement model
 *   🏪 Marketplace       — live Pathways marketplace product UI
 *   🔍 Isomorphic / SSR  — SSR pipeline, hydration, SEO metadata
 *   🎨 Shared Foundations — shared component library, code reuse metrics
 */

import React, { useState, useMemo } from "react";

// ─────────────────────────────────────────────────────────────────
// Domain types
// ─────────────────────────────────────────────────────────────────

type Level    = "Beginner" | "Intermediate" | "Advanced";
type Format   = "Online" | "In-person" | "Hybrid";
type Category = "Technology" | "Business" | "Leadership" | "Healthcare" | "Creative";

interface Pathway {
  id: string; title: string; provider: string;
  category: Category; level: Level; format: Format;
  duration: string; cost: string; rating: number; enrolled: number;
  tags: string[]; description: string; slug: string;
}

// ─────────────────────────────────────────────────────────────────
// Pathway data
// ─────────────────────────────────────────────────────────────────

const PATHWAYS: Pathway[] = [
  { id: "p01", title: "Full-Stack Web Development", provider: "Code Academy AU",  category: "Technology",  level: "Beginner",     format: "Online",     duration: "6 months",  cost: "Free",      rating: 4.8, enrolled: 12400, tags: ["React", "Node.js", "SQL"], description: "Master modern web development from HTML basics to building full-stack applications.",      slug: "full-stack-web-development" },
  { id: "p02", title: "Cloud Architecture on AWS",  provider: "AWS Training",     category: "Technology",  level: "Advanced",     format: "Online",     duration: "3 months",  cost: "$299",      rating: 4.9, enrolled: 8200,  tags: ["AWS", "DevOps", "Cloud"], description: "Design and deploy scalable, fault-tolerant systems using AWS services.",              slug: "cloud-architecture-aws" },
  { id: "p03", title: "Data Science Fundamentals",  provider: "TAFE NSW",         category: "Technology",  level: "Intermediate", format: "Hybrid",     duration: "4 months",  cost: "$450",      rating: 4.6, enrolled: 5900,  tags: ["Python", "ML", "Statistics"], description: "Build the analytical and programming skills to launch a career in data science.", slug: "data-science-fundamentals" },
  { id: "p04", title: "Strategic Leadership",        provider: "AGSM Business",   category: "Leadership",  level: "Advanced",     format: "In-person",  duration: "2 months",  cost: "$1,200",    rating: 4.7, enrolled: 2100,  tags: ["Management", "Strategy", "Executive"], description: "Develop the strategic thinking and leadership skills to drive organisational change.", slug: "strategic-leadership" },
  { id: "p05", title: "Product Management",          provider: "Product School",  category: "Business",    level: "Intermediate", format: "Online",     duration: "8 weeks",   cost: "$799",      rating: 4.8, enrolled: 6700,  tags: ["Roadmap", "Agile", "UX"], description: "Learn to define, ship, and iterate great products from experienced PMs.",             slug: "product-management" },
  { id: "p06", title: "Digital Marketing Mastery",  provider: "HubSpot Academy", category: "Business",    level: "Beginner",     format: "Online",     duration: "10 weeks",  cost: "Free",      rating: 4.5, enrolled: 15600, tags: ["SEO", "SEM", "Analytics"], description: "Drive growth with modern digital marketing — from SEO to paid acquisition.",         slug: "digital-marketing-mastery" },
  { id: "p07", title: "UX Design & Research",       provider: "RMIT Online",     category: "Creative",    level: "Beginner",     format: "Online",     duration: "4 months",  cost: "$680",      rating: 4.7, enrolled: 4300,  tags: ["Figma", "User Research", "Prototyping"], description: "Design beautiful, human-centred products using industry-standard tools.",          slug: "ux-design-research" },
  { id: "p08", title: "Mental Health First Aid",    provider: "MHFA Australia",  category: "Healthcare",  level: "Beginner",     format: "In-person",  duration: "2 days",    cost: "$180",      rating: 4.9, enrolled: 31000, tags: ["Wellbeing", "First Aid", "Certification"], description: "Learn to recognise and respond to mental health crises in your workplace.",         slug: "mental-health-first-aid" },
  { id: "p09", title: "Agile & Scrum Certification", provider: "Scrum Alliance", category: "Business",    level: "Intermediate", format: "Online",     duration: "3 weeks",   cost: "$395",      rating: 4.6, enrolled: 9400,  tags: ["Scrum", "Agile", "Certification"], description: "Become a certified Scrum Master and transform how your team delivers value.",        slug: "agile-scrum-certification" },
  { id: "p10", title: "Motion Graphics & Animation", provider: "Adobe Education", category: "Creative",   level: "Intermediate", format: "Online",     duration: "6 weeks",   cost: "$250",      rating: 4.4, enrolled: 3800,  tags: ["After Effects", "Animation", "Adobe"], description: "Create stunning motion graphics and animations for digital and broadcast media.",   slug: "motion-graphics-animation" },
  { id: "p11", title: "Cybersecurity Essentials",   provider: "SANS Institute",  category: "Technology",  level: "Intermediate", format: "Online",     duration: "8 weeks",   cost: "$599",      rating: 4.8, enrolled: 7200,  tags: ["Security", "Networking", "Compliance"], description: "Build core cybersecurity skills to protect systems and respond to threats.",         slug: "cybersecurity-essentials" },
  { id: "p12", title: "Aged Care Certificate III",  provider: "TAFE Queensland", category: "Healthcare",  level: "Beginner",     format: "Hybrid",     duration: "12 months", cost: "Subsidised",rating: 4.7, enrolled: 8900,  tags: ["Aged Care", "Certificate", "Government-funded"], description: "Gain the skills and qualifications to work in the aged care sector.",              slug: "aged-care-certificate-iii" },
];

const CATEGORY_COLOR: Record<Category, string> = {
  Technology: "#6366f1", Business: "#0ea5e9", Leadership: "#f59e0b",
  Healthcare: "#10b981", Creative: "#ec4899",
};

const LEVEL_COLOR: Record<Level, string> = {
  Beginner: "#4ade80", Intermediate: "#fbbf24", Advanced: "#ef4444",
};

// ─────────────────────────────────────────────────────────────────
// Bounty Hunter engagement data
// ─────────────────────────────────────────────────────────────────

const ENGAGEMENTS = [
  { team: "Pathways Team",   problem: "SEO zero — React CSR app invisible to Google",            outcome: "Full SSR with isomorphic rendering; organic traffic +180% in 90 days",   duration: "6 weeks",  status: "complete" as const },
  { team: "Commerce Team",   problem: "4 different Button components, 3 modal patterns, no consistency", outcome: "Shared component library adopted by all 4 teams; onboarding -40%",    duration: "4 weeks",  status: "complete" as const },
  { team: "Data Team",       problem: "Dashboard re-rendering on every keystroke, 2s lag",       outcome: "Memoisation strategy + virtual scrolling; interaction latency → 80ms",    duration: "2 weeks",  status: "complete" as const },
  { team: "Growth Team",     problem: "A/B test infra doesn't support multi-variant; blocking 3 experiments", outcome: "Multi-variant experimentation layer; 5 tests unblocked",      duration: "3 weeks",  status: "complete" as const },
  { team: "Platform Team",   problem: "No FE standards; each team had different eslint, tsconfig, test setup", outcome: "Shared tooling package; unified DX across all teams",         duration: "2 weeks",  status: "complete" as const },
];

// ─────────────────────────────────────────────────────────────────
// Shared foundations: before vs after
// ─────────────────────────────────────────────────────────────────

const FOUNDATION_ITEMS = [
  {
    title: "Design Tokens",
    icon: "🎨",
    before: "Each team hardcoded hex values\n4 different shades of 'blue'\nNo dark-mode support",
    after:  "tokens.color.primary\ntokens.spacing.md\ntokens.radius.lg",
    impact: "Visual consistency across all products",
  },
  {
    title: "Shared Components",
    icon: "🧩",
    before: "4 × Button\n3 × Modal\n6 × Input\n2 × Tooltip\n…all slightly different",
    after:  "1 × each, versioned\nfully typed props\nStorytook stories\nRTL tests",
    impact: "Reduced total component count by 68%",
  },
  {
    title: "Shared Tooling",
    icon: "🔧",
    before: "4 different ESLint configs\n3 tsconfig.json patterns\nInconsistent jest setup",
    after:  "@company/eslint-config\n@company/tsconfig\n@company/jest-preset",
    impact: "New engineers onboard in 1 day, not 3",
  },
  {
    title: "Patterns & RFCs",
    icon: "📋",
    before: "Ad-hoc decisions in each team\nSame problems solved 4 ways\nKnowledge silos",
    after:  "Living RFC library\nADR per decision\nDecision log searchable",
    impact: "No more reinventing the wheel",
  },
];

const SSR_STEPS = [
  { step: "1", label: "Request",     icon: "🌐", detail: "User or Googlebot requests /pathways/full-stack-web-development",    color: "#6366f1" },
  { step: "2", label: "Server",      icon: "⚙️",  detail: "Express + ReactDOM.renderToString() — runs React on Node.js server", color: "#0ea5e9" },
  { step: "3", label: "Data Fetch",  icon: "📦",  detail: "getInitialProps / loader fetches pathway data from API on server",    color: "#f59e0b" },
  { step: "4", label: "HTML",        icon: "📄",  detail: "Full HTML returned — content visible before JS loads",                color: "#10b981" },
  { step: "5", label: "Hydrate",     icon: "💧",  detail: "React.hydrate() attaches event handlers — no re-render of DOM",      color: "#ec4899" },
  { step: "6", label: "Interactive", icon: "✅",  detail: "App is fully interactive — subsequent nav is client-side (SPA)",     color: "#4ade80" },
];

// ─────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────

function StarRating({ rating }: { rating: number }) {
  return (
    <span style={{ color: "#fbbf24", fontSize: 11 }}>
      {"★".repeat(Math.floor(rating))}{"☆".repeat(5 - Math.floor(rating))} {rating.toFixed(1)}
    </span>
  );
}

function Tag({ label, color = "#6366f1" }: { label: string; color?: string }) {
  return (
    <span style={{ background: color + "20", color, border: `1px solid ${color}40`, borderRadius: 4, padding: "1px 6px", fontSize: 9, fontWeight: 700, whiteSpace: "nowrap" }}>
      {label}
    </span>
  );
}

function PathwayCard({ p, onClick }: { p: Pathway; onClick: () => void }) {
  const cc = CATEGORY_COLOR[p.category];
  return (
    <div
      onClick={onClick}
      style={{ background: "#1e293b", border: "1px solid #334155", borderRadius: 10, overflow: "hidden", cursor: "pointer", transition: "border-color 0.2s", borderLeft: `3px solid ${cc}` }}
      onMouseEnter={e => (e.currentTarget.style.borderColor = cc)}
      onMouseLeave={e => (e.currentTarget.style.borderColor = "#334155")}
    >
      <div style={{ padding: "12px 14px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8, marginBottom: 6 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: "#f1f5f9", lineHeight: 1.4 }}>{p.title}</div>
          <span style={{ background: LEVEL_COLOR[p.level] + "20", color: LEVEL_COLOR[p.level], border: `1px solid ${LEVEL_COLOR[p.level]}40`, borderRadius: 4, padding: "2px 6px", fontSize: 9, fontWeight: 700, whiteSpace: "nowrap" }}>{p.level}</span>
        </div>
        <div style={{ fontSize: 10, color: "#64748b", marginBottom: 6 }}>{p.provider}</div>
        <div style={{ fontSize: 11, color: "#94a3b8", lineHeight: 1.5, marginBottom: 8 }}>{p.description}</div>
        <div style={{ display: "flex", gap: 4, flexWrap: "wrap", marginBottom: 8 }}>
          {p.tags.map(t => <Tag key={t} label={t} color={cc} />)}
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ display: "flex", gap: 10, fontSize: 10, color: "#64748b" }}>
            <span>⏱ {p.duration}</span>
            <span>📡 {p.format}</span>
            <span style={{ color: p.cost === "Free" || p.cost === "Subsidised" ? "#4ade80" : "#94a3b8" }}>{p.cost === "Free" ? "🆓 Free" : p.cost === "Subsidised" ? "🏛 Subsidised" : `💰 ${p.cost}`}</span>
          </div>
          <div style={{ fontSize: 10, color: "#64748b" }}>{p.enrolled.toLocaleString()} enrolled</div>
        </div>
        <div style={{ marginTop: 6 }}><StarRating rating={p.rating} /></div>
      </div>
      {/* URL preview — illustrating SEO slug */}
      <div style={{ padding: "6px 14px", background: "#0f172a", borderTop: "1px solid #334155", fontSize: 9, color: "#475569", fontFamily: "monospace" }}>
        /pathways/{p.slug}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
// Main Demo
// ─────────────────────────────────────────────────────────────────

const ALL = "All" as const;

export function PathwaysMarketplaceDemo() {
  const [activeTab, setActiveTab] = useState<"bounty" | "marketplace" | "ssr" | "foundations">("bounty");
  const [search, setSearch]         = useState("");
  const [catFilter, setCatFilter]   = useState<Category | typeof ALL>(ALL);
  const [levelFilter, setLevelFilter] = useState<Level | typeof ALL>(ALL);
  const [selectedPathway, setSelectedPathway] = useState<Pathway | null>(null);
  const [ssrStep, setSsrStep]       = useState(0);

  const filtered = useMemo(() => PATHWAYS.filter(p => {
    const q = search.toLowerCase();
    const matchQ = !q || p.title.toLowerCase().includes(q) || p.provider.toLowerCase().includes(q) || p.tags.some(t => t.toLowerCase().includes(q));
    const matchC = catFilter === ALL   || p.category === catFilter;
    const matchL = levelFilter === ALL || p.level === levelFilter;
    return matchQ && matchC && matchL;
  }), [search, catFilter, levelFilter]);

  return (
    <div style={{ background: "#0f172a", color: "#f1f5f9", fontFamily: "'Inter', system-ui, sans-serif", minHeight: "100vh", padding: 24 }}>
      {/* Header */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
          <span style={{ fontSize: 28 }}>🕵️</span>
          <div>
            <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800 }}>Pathways Marketplace</h1>
            <p style={{ margin: 0, color: "#64748b", fontSize: 13 }}>
              Bounty hunter tech lead · Isomorphic React SSR · Shared FE foundations
            </p>
          </div>
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {["Bounty Hunter Tech Lead", "Isomorphic React", "SSR / SSG", "SEO", "Shared Design System", "Cross-Team Platform", "Code Reuse"].map(t => (
            <span key={t} style={{ background: "#1e293b", color: "#94a3b8", border: "1px solid #334155", borderRadius: 20, padding: "3px 10px", fontSize: 11 }}>{t}</span>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 4, marginBottom: 20, borderBottom: "1px solid #1e293b", paddingBottom: 4 }}>
        {[
          { id: "bounty"      as const, label: "🕵 Bounty Hunter" },
          { id: "marketplace" as const, label: "🏪 Marketplace" },
          { id: "ssr"         as const, label: "🔍 Isomorphic / SSR" },
          { id: "foundations" as const, label: "🎨 Shared Foundations" },
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

      {/* ── BOUNTY HUNTER ── */}
      {activeTab === "bounty" && (
        <div>
          {/* Role definition */}
          <div style={{ background: "#1e293b", border: "1px solid #6366f130", borderRadius: 10, padding: 20, marginBottom: 16 }}>
            <div style={{ fontSize: 16, fontWeight: 800, marginBottom: 8 }}>🕵️ What is a "Bounty Hunter" Tech Lead?</div>
            <div style={{ fontSize: 13, color: "#94a3b8", lineHeight: 1.8, marginBottom: 16 }}>
              Unlike an embedded team lead (permanently assigned to one team), a bounty hunter tech lead operates across multiple product teams — 
              called in where the technical need is highest. The goal: identify the real problem, solve it to a high standard, 
              leave the team with the tools and knowledge to maintain it, then move on.
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 10 }}>
              {[
                { icon: "🔎", title: "Assess fast",   body: "In a new team context in ~1 week: understand the codebase, identify the real problem (often different from the stated problem), triage by impact." },
                { icon: "🏗", title: "Solve deeply",  body: "Don't patch — fix the root cause. Leave the solution in a state where the team can own it, extend it, and explain it to the next engineer." },
                { icon: "🤝", title: "Hand off well", body: "Document the decision, pair with a team member on the new pattern, and leave a clear path for what to do next. The engagement ends, the improvement stays." },
              ].map(c => (
                <div key={c.title} style={{ background: "#0f172a", borderRadius: 8, padding: 14 }}>
                  <div style={{ fontSize: 16, marginBottom: 4 }}>{c.icon} <span style={{ fontSize: 12, fontWeight: 700, color: "#f1f5f9" }}>{c.title}</span></div>
                  <div style={{ fontSize: 11, color: "#64748b", lineHeight: 1.6 }}>{c.body}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Engagements */}
          <div style={{ background: "#1e293b", border: "1px solid #334155", borderRadius: 10, padding: 16, marginBottom: 16 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: "#f1f5f9", marginBottom: 14 }}>Engagements Across Teams</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {ENGAGEMENTS.map((e, i) => (
                <div key={i} style={{ background: "#0f172a", borderRadius: 8, padding: 14, display: "flex", gap: 16, alignItems: "flex-start" }}>
                  <div style={{ width: 130, flexShrink: 0 }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: "#a5b4fc", marginBottom: 2 }}>{e.team}</div>
                    <div style={{ fontSize: 9, color: "#64748b" }}>⏱ {e.duration}</div>
                    <div style={{ fontSize: 9, color: "#4ade80", marginTop: 4 }}>● {e.status}</div>
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 10, color: "#ef4444", marginBottom: 4 }}>Problem: {e.problem}</div>
                    <div style={{ fontSize: 10, color: "#4ade80" }}>Outcome: {e.outcome}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* vs Embedded */}
          <div style={{ background: "#1e293b", border: "1px solid #334155", borderRadius: 10, padding: 16 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: "#f1f5f9", marginBottom: 12 }}>Bounty Hunter vs Embedded Tech Lead</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              {[
                { label: "Embedded Tech Lead", color: "#64748b", items: ["One team, long-term context", "Specialised in the domain", "Builds relationships over months", "Accountable for team velocity", "Risk: siloed knowledge"] },
                { label: "Bounty Hunter TL",   color: "#6366f1", items: ["Multiple teams, rotational", "Broad context, fast synthesis", "Earns trust quickly — in days", "Accountable for specific outcome", "Benefit: transfers patterns across teams"] },
              ].map(col => (
                <div key={col.label} style={{ background: "#0f172a", borderRadius: 8, padding: 14 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: col.color, marginBottom: 8 }}>{col.label}</div>
                  {col.items.map(item => (
                    <div key={item} style={{ fontSize: 11, color: "#94a3b8", marginBottom: 4, display: "flex", gap: 6 }}>
                      <span style={{ color: col.color, flexShrink: 0 }}>›</span>{item}
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── MARKETPLACE ── */}
      {activeTab === "marketplace" && (
        <div>
          {/* SEO context bar */}
          <div style={{ background: "#1e293b", border: "1px solid #0ea5e920", borderRadius: 8, padding: 10, marginBottom: 14, display: "flex", gap: 20, alignItems: "center" }}>
            <div style={{ fontSize: 10, color: "#0ea5e9", fontWeight: 700 }}>🔍 SEO: Isomorphic Rendering Active</div>
            {[{ label: "Indexed pages", value: "12,400+" }, { label: "Organic traffic", value: "+180%" }, { label: "Core Web Vitals", value: "Pass" }, { label: "Lighthouse SEO", value: "98/100" }].map(m => (
              <div key={m.label} style={{ fontSize: 10, color: "#64748b" }}>{m.label}: <span style={{ color: "#4ade80", fontWeight: 700 }}>{m.value}</span></div>
            ))}
          </div>

          {/* Search & Filters */}
          <div style={{ display: "flex", gap: 8, marginBottom: 14, flexWrap: "wrap" }}>
            <input
              placeholder="Search pathways, providers, or skills..."
              value={search} onChange={e => setSearch(e.target.value)}
              style={{ flex: 1, minWidth: 200, background: "#1e293b", border: "1px solid #334155", borderRadius: 8, padding: "8px 12px", color: "#f1f5f9", fontSize: 12, outline: "none" }}
            />
            <select value={catFilter} onChange={e => setCatFilter(e.target.value as Category | typeof ALL)} style={{ background: "#1e293b", border: "1px solid #334155", borderRadius: 8, padding: "8px 12px", color: "#94a3b8", fontSize: 12, cursor: "pointer" }}>
              <option value="All">All Categories</option>
              {(["Technology", "Business", "Leadership", "Healthcare", "Creative"] as Category[]).map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            <select value={levelFilter} onChange={e => setLevelFilter(e.target.value as Level | typeof ALL)} style={{ background: "#1e293b", border: "1px solid #334155", borderRadius: 8, padding: "8px 12px", color: "#94a3b8", fontSize: 12, cursor: "pointer" }}>
              <option value="All">All Levels</option>
              {(["Beginner", "Intermediate", "Advanced"] as Level[]).map(l => <option key={l} value={l}>{l}</option>)}
            </select>
          </div>

          {/* Category chips */}
          <div style={{ display: "flex", gap: 6, marginBottom: 14, flexWrap: "wrap" }}>
            <button onClick={() => setCatFilter(ALL)} style={{ background: catFilter === ALL ? "#6366f120" : "#1e293b", border: `1px solid ${catFilter === ALL ? "#6366f1" : "#334155"}`, borderRadius: 20, padding: "4px 12px", color: catFilter === ALL ? "#a5b4fc" : "#64748b", cursor: "pointer", fontSize: 11 }}>All</button>
            {(Object.keys(CATEGORY_COLOR) as Category[]).map(cat => (
              <button key={cat} onClick={() => setCatFilter(cat)} style={{ background: catFilter === cat ? CATEGORY_COLOR[cat] + "20" : "#1e293b", border: `1px solid ${catFilter === cat ? CATEGORY_COLOR[cat] : "#334155"}`, borderRadius: 20, padding: "4px 12px", color: catFilter === cat ? CATEGORY_COLOR[cat] : "#64748b", cursor: "pointer", fontSize: 11 }}>
                {cat} ({PATHWAYS.filter(p => p.category === cat).length})
              </button>
            ))}
          </div>

          {/* Results count */}
          <div style={{ fontSize: 11, color: "#64748b", marginBottom: 12 }}>
            {filtered.length} pathway{filtered.length !== 1 ? "s" : ""} found
            {(search || catFilter !== ALL || levelFilter !== ALL) && (
              <button onClick={() => { setSearch(""); setCatFilter(ALL); setLevelFilter(ALL); }} style={{ marginLeft: 8, color: "#6366f1", background: "none", border: "none", cursor: "pointer", fontSize: 11 }}>
                Clear filters
              </button>
            )}
          </div>

          {/* Pathway grid */}
          {selectedPathway ? (
            /* Detail panel — shows SEO metadata */
            <div>
              <button onClick={() => setSelectedPathway(null)} style={{ marginBottom: 14, color: "#6366f1", background: "#6366f115", border: "1px solid #6366f140", borderRadius: 6, padding: "6px 14px", cursor: "pointer", fontSize: 12 }}>
                ← Back to results
              </button>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 360px", gap: 16 }}>
                <div style={{ background: "#1e293b", borderRadius: 10, padding: 20 }}>
                  <div style={{ fontSize: 9, color: CATEGORY_COLOR[selectedPathway.category], fontWeight: 700, marginBottom: 4 }}>{selectedPathway.category.toUpperCase()}</div>
                  <h2 style={{ margin: "0 0 6px", fontSize: 20, fontWeight: 800 }}>{selectedPathway.title}</h2>
                  <div style={{ fontSize: 12, color: "#64748b", marginBottom: 12 }}>by {selectedPathway.provider}</div>
                  <div style={{ fontSize: 13, color: "#94a3b8", lineHeight: 1.7, marginBottom: 16 }}>{selectedPathway.description}</div>
                  <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 16 }}>
                    {selectedPathway.tags.map(t => <Tag key={t} label={t} color={CATEGORY_COLOR[selectedPathway.category]} />)}
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                    {[["Duration", selectedPathway.duration], ["Format", selectedPathway.format], ["Level", selectedPathway.level], ["Enrolled", selectedPathway.enrolled.toLocaleString()]].map(([l, v]) => (
                      <div key={l} style={{ background: "#0f172a", borderRadius: 6, padding: 10 }}>
                        <div style={{ fontSize: 9, color: "#64748b" }}>{l}</div>
                        <div style={{ fontSize: 13, fontWeight: 700, color: "#f1f5f9" }}>{v}</div>
                      </div>
                    ))}
                  </div>
                </div>
                {/* SSR-generated metadata panel */}
                <div style={{ background: "#1e293b", borderRadius: 10, overflow: "hidden" }}>
                  <div style={{ padding: "10px 14px", borderBottom: "1px solid #334155", background: "#0f172a", fontSize: 10, fontWeight: 700, color: "#a5b4fc" }}>
                    🔍 SSR-Generated SEO Metadata
                  </div>
                  <div style={{ padding: 14 }}>
                    <div style={{ fontSize: 9, color: "#64748b", marginBottom: 4 }}>Page URL</div>
                    <div style={{ fontSize: 10, color: "#4ade80", fontFamily: "monospace", marginBottom: 12 }}>/pathways/{selectedPathway.slug}</div>
                    <pre style={{ margin: 0, fontSize: 9, fontFamily: "monospace", color: "#94a3b8", lineHeight: 1.7, background: "#0f172a", borderRadius: 6, padding: 10, overflow: "auto" }}>{
`<title>
  ${selectedPathway.title} | Pathways
</title>

<meta name="description"
  content="${selectedPathway.description.slice(0, 80)}..." />

<meta property="og:title"
  content="${selectedPathway.title}" />
<meta property="og:type"
  content="article" />
<meta property="og:url"
  content="https://pathways.com/pathways/${selectedPathway.slug}" />

<link rel="canonical"
  href="https://pathways.com/pathways/${selectedPathway.slug}" />

<script type="application/ld+json">
  {
    "@type": "Course",
    "name": "${selectedPathway.title}",
    "provider": "${selectedPathway.provider}",
    "educationalLevel": "${selectedPathway.level}"
  }
</script>

<!-- All rendered server-side — visible to Googlebot
     before JavaScript loads -->`
                    }</pre>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 12 }}>
              {filtered.length === 0 ? (
                <div style={{ gridColumn: "1/-1", textAlign: "center", padding: 40, color: "#475569" }}>
                  No pathways match — try a different search or filter
                </div>
              ) : (
                filtered.map(p => <PathwayCard key={p.id} p={p} onClick={() => setSelectedPathway(p)} />)
              )}
            </div>
          )}
        </div>
      )}

      {/* ── ISOMORPHIC / SSR ── */}
      {activeTab === "ssr" && (
        <div>
          {/* CSR vs SSR comparison */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
            {[
              {
                label: "❌ Before: Client-Side Rendering (CSR)",
                color: "#ef4444",
                items: [
                  "Browser downloads empty HTML shell",
                  "Downloads JS bundle (~1.8MB)",
                  "React renders in browser",
                  "Googlebot sees: <div id=\"root\"></div>",
                  "Organic search: invisible",
                  "Time to First Contentful Paint: 3.8s",
                ],
              },
              {
                label: "✅ After: Isomorphic / SSR",
                color: "#4ade80",
                items: [
                  "Server runs React → full HTML response",
                  "Googlebot sees full pathway content",
                  "SEO metadata generated per-page",
                  "Client hydrates (no re-render)",
                  "Subsequent nav: client-side (fast SPA)",
                  "Time to First Contentful Paint: 0.9s",
                ],
              },
            ].map(col => (
              <div key={col.label} style={{ background: "#1e293b", border: `1px solid ${col.color}30`, borderRadius: 10, padding: 16 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: col.color, marginBottom: 10 }}>{col.label}</div>
                {col.items.map(item => (
                  <div key={item} style={{ display: "flex", gap: 6, fontSize: 11, color: "#94a3b8", marginBottom: 6 }}>
                    <span style={{ color: col.color, flexShrink: 0 }}>›</span>{item}
                  </div>
                ))}
              </div>
            ))}
          </div>

          {/* SSR flow — interactive */}
          <div style={{ background: "#1e293b", border: "1px solid #334155", borderRadius: 10, padding: 16, marginBottom: 16 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: "#f1f5f9", marginBottom: 14 }}>Isomorphic Request Lifecycle (click steps)</div>
            <div style={{ display: "flex", gap: 0, alignItems: "stretch", marginBottom: 16, flexWrap: "wrap" }}>
              {SSR_STEPS.map((s, i) => (
                <React.Fragment key={s.step}>
                  <button onClick={() => setSsrStep(i)} style={{
                    background: ssrStep === i ? s.color + "20" : "#0f172a",
                    border: `2px solid ${ssrStep === i ? s.color : "#334155"}`,
                    borderRadius: 8, padding: "10px 14px", cursor: "pointer", textAlign: "left", minWidth: 90,
                  }}>
                    <div style={{ fontSize: 16 }}>{s.icon}</div>
                    <div style={{ fontSize: 10, fontWeight: 700, color: ssrStep === i ? s.color : "#94a3b8", marginTop: 4 }}>{s.step}. {s.label}</div>
                  </button>
                  {i < SSR_STEPS.length - 1 && (
                    <div style={{ display: "flex", alignItems: "center", padding: "0 4px", color: "#334155", fontSize: 16 }}>→</div>
                  )}
                </React.Fragment>
              ))}
            </div>
            {ssrStep !== null && (
              <div style={{ background: "#0f172a", borderRadius: 8, padding: 14, border: `1px solid ${SSR_STEPS[ssrStep].color}30` }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: SSR_STEPS[ssrStep].color, marginBottom: 6 }}>
                  Step {SSR_STEPS[ssrStep].step}: {SSR_STEPS[ssrStep].label}
                </div>
                <div style={{ fontSize: 12, color: "#94a3b8" }}>{SSR_STEPS[ssrStep].detail}</div>
              </div>
            )}
          </div>

          {/* Code */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            {[
              { label: "server.ts — Express + renderToString", code: `import express from "express";
import { renderToString } from "react-dom/server";
import App from "./App";

const app = express();

app.get("/pathways/:slug", async (req, res) => {
  // 1. Fetch data server-side
  const pathway = await api.getPathway(req.params.slug);

  // 2. Render React to HTML string
  const html = renderToString(
    <App initialData={{ pathway }} />
  );

  // 3. Inject SEO metadata + hydration state
  res.send(\`<!DOCTYPE html>
<html>
  <head>
    <title>\${pathway.title} | Pathways</title>
    <meta name="description" content="\${pathway.description}" />
    <link rel="canonical" href="/pathways/\${pathway.slug}" />
    <script type="application/ld+json">
      \${JSON.stringify(buildSchema(pathway))}
    </script>
  </head>
  <body>
    <div id="root">\${html}</div>
    <script>
      window.__INITIAL_DATA__ = \${JSON.stringify({ pathway })};
    </script>
    <script src="/bundle.js"></script>
  </body>
</html>\`);
});` },
              { label: "client.ts — Hydration (no re-render)", code: `import { hydrateRoot } from "react-dom/client";
import App from "./App";

// Read server-injected data — no API call needed
const initialData = window.__INITIAL_DATA__;

// hydrateRoot attaches React to the server-rendered DOM.
// It does NOT re-render the HTML — it just adds event handlers.
// This is the key difference from ReactDOM.render():
// - render() would wipe and re-render (flickering, performance hit)
// - hydrate() trusts the server HTML and attaches to it

hydrateRoot(
  document.getElementById("root")!,
  <App initialData={initialData} />
);

// After hydration, the app works as a normal SPA:
// - Client-side routing (React Router / Next.js router)
// - No full page reloads for subsequent navigation
// - Only the first page request goes through the server` },
            ].map(s => (
              <div key={s.label} style={{ background: "#1e293b", borderRadius: 10, overflow: "hidden" }}>
                <div style={{ padding: "8px 12px", borderBottom: "1px solid #334155", fontSize: 10, color: "#64748b", background: "#0f172a" }}>{s.label}</div>
                <pre style={{ margin: 0, padding: 14, fontSize: 10, fontFamily: "monospace", color: "#94a3b8", lineHeight: 1.6, overflow: "auto", maxHeight: 340 }}>{s.code}</pre>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── SHARED FOUNDATIONS ── */}
      {activeTab === "foundations" && (
        <div>
          {/* Impact bar */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12, marginBottom: 16 }}>
            {[
              { label: "Components reduced", value: "-68%",    sub: "4 Buttons → 1 Button", color: "#4ade80" },
              { label: "Teams consuming",     value: "4",      sub: "shared component library", color: "#818cf8" },
              { label: "Onboarding time",     value: "-40%",   sub: "3 days → 1.8 days", color: "#22d3ee" },
              { label: "Design consistency",  value: "+85%",   sub: "audit score (before: 34%)", color: "#fbbf24" },
            ].map(m => (
              <div key={m.label} style={{ background: "#1e293b", border: `1px solid ${m.color}20`, borderRadius: 10, padding: 14 }}>
                <div style={{ fontSize: 9, color: "#64748b", marginBottom: 4, fontWeight: 700 }}>{m.label}</div>
                <div style={{ fontSize: 22, fontWeight: 800, color: m.color }}>{m.value}</div>
                <div style={{ fontSize: 10, color: "#475569", marginTop: 2 }}>{m.sub}</div>
              </div>
            ))}
          </div>

          {/* Before / After per foundation area */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
            {FOUNDATION_ITEMS.map(item => (
              <div key={item.title} style={{ background: "#1e293b", border: "1px solid #334155", borderRadius: 10, overflow: "hidden" }}>
                <div style={{ padding: "10px 14px", borderBottom: "1px solid #334155", background: "#0f172a", display: "flex", gap: 8, alignItems: "center" }}>
                  <span>{item.icon}</span>
                  <span style={{ fontSize: 12, fontWeight: 700 }}>{item.title}</span>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 0 }}>
                  <div style={{ padding: 12, borderRight: "1px solid #334155" }}>
                    <div style={{ fontSize: 9, color: "#ef4444", fontWeight: 700, marginBottom: 6 }}>BEFORE</div>
                    <pre style={{ margin: 0, fontSize: 10, color: "#64748b", fontFamily: "monospace", lineHeight: 1.7 }}>{item.before}</pre>
                  </div>
                  <div style={{ padding: 12 }}>
                    <div style={{ fontSize: 9, color: "#4ade80", fontWeight: 700, marginBottom: 6 }}>AFTER</div>
                    <pre style={{ margin: 0, fontSize: 10, color: "#94a3b8", fontFamily: "monospace", lineHeight: 1.7 }}>{item.after}</pre>
                  </div>
                </div>
                <div style={{ padding: "8px 12px", background: "#0f172a", borderTop: "1px solid #334155", fontSize: 10, color: "#a5b4fc" }}>
                  Impact: {item.impact}
                </div>
              </div>
            ))}
          </div>

          {/* Shared component code example */}
          <div style={{ background: "#1e293b", border: "1px solid #334155", borderRadius: 10, overflow: "hidden" }}>
            <div style={{ padding: "10px 14px", borderBottom: "1px solid #334155", background: "#0f172a", fontSize: 10, color: "#64748b" }}>
              Shared component — Button — consumed by all teams
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 0 }}>
              <div style={{ padding: 14, borderRight: "1px solid #334155" }}>
                <div style={{ fontSize: 9, color: "#ef4444", fontWeight: 700, marginBottom: 8 }}>BEFORE — 4 different Buttons</div>
                <pre style={{ margin: 0, fontSize: 10, fontFamily: "monospace", color: "#64748b", lineHeight: 1.7 }}>{
`// Team A: Button.tsx
<button className={styles.btn}
  disabled={loading}
  onClick={handleClick}>
  {loading ? "Loading..." : label}
</button>

// Team B: MyButton.tsx
<button style={{...}} ref={ref}
  aria-label={ariaLabel}>
  {children}
</button>

// Team C: PrimaryButton.tsx
<button type={type || "button"}
  onClick={onPress}>  ← different prop name
  {buttonText}  ← different prop name
</button>

// Team D: just a <button> with inline styles
<button style={{ background: "#1a73e8"... }}`
                }</pre>
              </div>
              <div style={{ padding: 14 }}>
                <div style={{ fontSize: 9, color: "#4ade80", fontWeight: 700, marginBottom: 8 }}>AFTER — 1 shared Button</div>
                <pre style={{ margin: 0, fontSize: 10, fontFamily: "monospace", color: "#94a3b8", lineHeight: 1.7 }}>{
`// @company/ui — packages/ui/src/Button.tsx
interface ButtonProps {
  children: React.ReactNode;
  variant?: "primary" | "secondary" | "ghost";
  size?: "sm" | "md" | "lg";
  loading?: boolean;
  disabled?: boolean;
  onClick?: () => void;
}

export const Button = React.forwardRef<
  HTMLButtonElement,
  ButtonProps
>(({ children, variant = "primary",
    size = "md", loading, ...props }, ref) => {
  return (
    <button
      ref={ref}
      disabled={loading || props.disabled}
      aria-busy={loading}         // ← a11y built-in
      className={cn(
        styles.base,
        styles[variant],
        styles[size],
      )}
      {...props}
    >
      {loading ? <Spinner /> : children}
    </button>
  );
});

// Used identically by all 4 teams:
import { Button } from "@company/ui";
<Button variant="primary" onClick={submit}>
  Enrol now
</Button>`
                }</pre>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default PathwaysMarketplaceDemo;
