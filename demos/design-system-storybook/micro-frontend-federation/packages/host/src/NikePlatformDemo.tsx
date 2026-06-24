/**
 * NikePlatformDemo.tsx
 *
 * Nike engineering career — three interconnected contributions:
 *
 * 1. UI PLATFORM TEAM (founded + led)
 *    Built the shared component library and design system for Nike's digital products.
 *    Nike.com, Nike App, SNKRS, Nike Training Club — one design language.
 *
 * 2. PLUGGABLE GRAPHQL SERVER
 *    Architected a plugin-based GraphQL gateway where teams (Commerce, Content, AI)
 *    independently register their own schemas and resolvers, composed into one graph.
 *    No single-team bottleneck. Federated but opinionated.
 *
 * 3. SHOE RECOMMENDER (passion project → significant revenue)
 *    Replaced rule-based recommender with a personalised engine:
 *    collaborative filtering + content-based + real-time trending, weighted by context.
 *    Deployed to Nike.com — resulted in measurable revenue lift.
 *
 * TABS
 *   🏃 UI Platform      — design tokens, component library, cross-product consistency
 *   🔌 GraphQL Server   — plugin architecture, schema composition, live query builder
 *   👟 Recommender      — personalised shoe recommendations, scoring, A/B test results
 *   🏆 Platform Impact  — leadership, metrics, unified narrative
 */

import React, { useState, useMemo, useCallback } from "react";

// ─────────────────────────────────────────────────────────────────
// Design tokens — Nike brand
// ─────────────────────────────────────────────────────────────────

const NK = {
  black:   "#111111",
  white:   "#ffffff",
  orange:  "#FA5400",
  gray50:  "#f7f7f7",
  gray200: "#e5e5e5",
  gray500: "#767676",
  gray800: "#2e2e2e",
  surface: "#1a1a1a",
  card:    "#222222",
  border:  "#333333",
};

const DESIGN_TOKENS = [
  { category: "Brand",   name: "--nk-black",   value: NK.black,   label: "Nike Black"  },
  { category: "Brand",   name: "--nk-white",   value: NK.white,   label: "Nike White"  },
  { category: "Brand",   name: "--nk-orange",  value: NK.orange,  label: "Nike Orange" },
  { category: "Neutral", name: "--nk-gray-50", value: NK.gray50,  label: "Gray 50"     },
  { category: "Neutral", name: "--nk-gray-200",value: NK.gray200, label: "Gray 200"    },
  { category: "Neutral", name: "--nk-gray-500",value: NK.gray500, label: "Gray 500"    },
  { category: "Neutral", name: "--nk-gray-800",value: NK.gray800, label: "Gray 800"    },
  { category: "Surface", name: "--nk-surface",  value: NK.surface, label: "Surface"    },
  { category: "Surface", name: "--nk-card",     value: NK.card,    label: "Card"       },
];

const DS_COMPONENTS = [
  { name: "Button",       variants: ["Primary", "Secondary", "Ghost", "Icon"],  desc: "CTAs across Nike.com and Nike App" },
  { name: "ProductCard",  variants: ["Default", "Quick-add", "Wishlist", "Sold Out"], desc: "Product grid, recommendations, SNKRS" },
  { name: "Badge",        variants: ["New", "Just In", "Sold Out", "Members"],  desc: "Product labels, promotional callouts" },
  { name: "SizeSelector", variants: ["Grid", "Dropdown", "Inline"],             desc: "Consistent size UX across all products" },
  { name: "ColorSwatch",  variants: ["sm", "md", "lg", "selected", "sold-out"],desc: "Color/style picker on PDPs" },
  { name: "MediaCarousel",variants: ["Default", "Zoom", "360", "Video"],        desc: "Product imagery on PDP, SNKRS launch" },
];

// ─────────────────────────────────────────────────────────────────
// GraphQL plugin data
// ─────────────────────────────────────────────────────────────────

const GQL_PLUGINS = [
  {
    name: "CorePlugin",
    team: "Platform",
    color: NK.orange,
    types: ["Product", "User", "Category", "Brand"],
    description: "Owned by the UI Platform team. Defines the foundational types all other plugins extend.",
    sampleSchema: `type Product {
  id: ID!
  name: String!
  price: Float!
  category: Category!
  colors: [ColorOption!]!
  sizes: [SizeOption!]!
  images: [String!]!
}

type User {
  id: ID!
  email: String!
  preferences: UserPreferences
}

type Query {
  product(id: ID!): Product
  products(category: String, limit: Int): [Product!]!
  me: User
}`,
  },
  {
    name: "CommercePlugin",
    team: "Commerce",
    color: "#4ade80",
    types: ["Cart", "CartItem", "Order", "Inventory"],
    description: "Commerce team registers cart, checkout, and inventory resolvers. Extends Product with inventory status.",
    sampleSchema: `# Extends core Product type — no core team involvement
extend type Product {
  inventory: InventoryStatus!
  addToCart(quantity: Int!): CartItem!
}

type Cart {
  id: ID!
  items: [CartItem!]!
  subtotal: Float!
  estimatedTax: Float!
}

type Mutation {
  addToCart(productId: ID!, size: String!, quantity: Int!): Cart!
  removeFromCart(itemId: ID!): Cart!
  checkout(cartId: ID!): Order!
}`,
  },
  {
    name: "AIPlugin",
    team: "Personalisation",
    color: "#a855f7",
    types: ["Recommendation", "PersonalisationScore", "UserVector"],
    description: "AI/ML team registers recommendation resolvers. Extends User with personalized data.",
    sampleSchema: `# Extends core User type
extend type User {
  recommendations(context: RecommendationContext): [Recommendation!]!
  personalisationScore: Float!
}

type Recommendation {
  product: Product!         # references core type
  score:   Float!           # confidence (0-1)
  reason:  String!          # "Because you bought Air Max 90"
  context: String!          # "running" | "lifestyle" | "trending"
}

enum RecommendationContext {
  HOMEPAGE
  PDP           # product detail page
  CART
  POST_PURCHASE
}`,
  },
  {
    name: "ContentPlugin",
    team: "Editorial",
    color: "#0ea5e9",
    types: ["Article", "Video", "Athlete", "Story"],
    description: "Editorial team registers Nike+ content. Associates athletes and stories with products.",
    sampleSchema: `extend type Product {
  relatedContent: [Content!]!
  athletes: [Athlete!]!
}

union Content = Article | Video | Story

type Athlete {
  name:     String!
  sport:    String!
  signature: [Product!]!  # athlete's signature shoes
}

type Query {
  featured: [Content!]!
  athleteStories(athleteId: ID!): [Story!]!
}`,
  },
];

const SAMPLE_QUERY = `# A query that spans FOUR plugins — assembled transparently
query NikePDP($productId: ID!) {
  product(id: $productId) {     # CorePlugin resolver
    name
    price
    images

    inventory { available, sizes }  # CommercePlugin

    relatedContent { ... on Video { title, url } }  # ContentPlugin
    athletes { name, sport }                        # ContentPlugin
  }

  me {                          # CorePlugin
    recommendations(           # AIPlugin
      context: PDP
    ) {
      product { name, price }
      score
      reason
    }
  }
}`;

// ─────────────────────────────────────────────────────────────────
// Shoe recommender data
// ─────────────────────────────────────────────────────────────────

interface Shoe {
  id: string; name: string; sub: string; category: string;
  price: number; score: number; reason: string; color: string;
  context: "history" | "collab" | "trending" | "content";
}

const HISTORY: string[] = ["Air Max 90", "Pegasus 39", "Air Force 1"];

const SHOES: Shoe[] = [
  { id: "s1",  name: "Air Max 270",      sub: "Men's Lifestyle",   category: "lifestyle",   price: 150, score: 0.94, reason: "You own the Air Max 90",                color: "#FA5400", context: "history"  },
  { id: "s2",  name: "React Infinity 4", sub: "Men's Running",     category: "running",     price: 160, score: 0.91, reason: "Top pick for Pegasus runners",           color: "#111",    context: "collab"   },
  { id: "s3",  name: "Air Zoom Pegasus 40", sub: "Men's Running",  category: "running",     price: 130, score: 0.89, reason: "Pegasus 40 — upgrade from your Peg 39",  color: "#0ea5e9", context: "history"  },
  { id: "s4",  name: "Blazer Mid '77",   sub: "Men's Lifestyle",   category: "lifestyle",   price: 100, score: 0.87, reason: "Popular with Air Force 1 owners",         color: "#1e293b", context: "collab"   },
  { id: "s5",  name: "Vomero 5",         sub: "Men's Lifestyle",   category: "lifestyle",   price: 160, score: 0.85, reason: "Trending in your city",                   color: "#a855f7", context: "trending" },
  { id: "s6",  name: "Cortez",           sub: "Unisex Lifestyle",  category: "lifestyle",   price: 90,  score: 0.82, reason: "Trending: top seller this week",          color: "#ef4444", context: "trending" },
  { id: "s7",  name: "Free Run 5.0",     sub: "Women's Running",   category: "running",     price: 100, score: 0.80, reason: "Lightweight like your Pegasus",           color: "#4ade80", context: "content"  },
  { id: "s8",  name: "Metcon 9",         sub: "Training",          category: "training",    price: 130, score: 0.78, reason: "Nike Training Club users favour this",    color: "#f59e0b", context: "collab"   },
  { id: "s9",  name: "Jordan 1 Low",     sub: "Men's Lifestyle",   category: "basketball",  price: 110, score: 0.76, reason: "Often bought with Air Force 1",           color: "#ef4444", context: "collab"   },
  { id: "s10", name: "Wildhorse 8",      sub: "Trail Running",     category: "trail",       price: 120, score: 0.74, reason: "Trail running trending +40% this month",  color: "#10b981", context: "trending" },
  { id: "s11", name: "Air Huarache",     sub: "Lifestyle",         category: "lifestyle",   price: 110, score: 0.71, reason: "Matches your size profile",               color: "#6366f1", context: "content"  },
  { id: "s12", name: "Zoom Fly 6",       sub: "Road Racing",       category: "running",     price: 160, score: 0.69, reason: "Race day upgrade from Pegasus",           color: "#0ea5e9", context: "content"  },
];

const CONTEXT_META = {
  history:  { label: "Your History",          color: NK.orange,  icon: "🕐" },
  collab:   { label: "Similar Users Bought",  color: "#a855f7",  icon: "👥" },
  trending: { label: "Trending Now",          color: "#4ade80",  icon: "🔥" },
  content:  { label: "Curated for You",       color: "#0ea5e9",  icon: "✨" },
};

const AB_METRICS = [
  { label: "Click-through Rate",       before: "4.2%",  after: "7.8%",  lift: "+86%", color: "#4ade80" },
  { label: "Add-to-Cart Rate",         before: "1.8%",  after: "3.4%",  lift: "+89%", color: "#4ade80" },
  { label: "Avg. Order Value",         before: "$142",  after: "$167",  lift: "+18%", color: "#4ade80" },
  { label: "Recommendation Revenue",   before: "2.1%",  after: "6.4%",  lift: "+205%",color: NK.orange  },
  { label: "Null Recommendation Rate", before: "18%",   after: "3%",    lift: "−83%", color: "#4ade80" },
];

// ─────────────────────────────────────────────────────────────────
// Helper
// ─────────────────────────────────────────────────────────────────

function CodeBlock({ code, label, color = "#64748b" }: { code: string; label?: string; color?: string }) {
  return (
    <div style={{ background: "#0a0a0a", borderRadius: 8, overflow: "hidden", border: `1px solid ${NK.border}` }}>
      {label && <div style={{ padding: "5px 12px", borderBottom: `1px solid ${NK.border}`, fontSize: 10, color }}>{label}</div>}
      <pre style={{ margin: 0, padding: 12, fontSize: 10, fontFamily: "monospace", color: "#94a3b8", lineHeight: 1.7, overflow: "auto", maxHeight: 340 }}>{code}</pre>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
// Main
// ─────────────────────────────────────────────────────────────────

export function NikePlatformDemo() {
  const [activeTab, setActiveTab] = useState<"platform" | "graphql" | "recommender" | "impact">("platform");
  const [dsComp, setDsComp]           = useState(0);
  const [gqlPlugin, setGqlPlugin]     = useState(0);
  const [selectedShoe, setSelectedShoe] = useState<Shoe | null>(null);
  const [filterCtx, setFilterCtx]     = useState<"all" | Shoe["context"]>("all");
  const [showAB, setShowAB]           = useState(false);

  const filteredShoes = useMemo(() =>
    filterCtx === "all" ? SHOES : SHOES.filter(s => s.context === filterCtx),
  [filterCtx]);

  const curPlugin = GQL_PLUGINS[gqlPlugin];

  const TABS = [
    { id: "platform"    as const, label: "🏃 UI Platform"   },
    { id: "graphql"     as const, label: "🔌 GraphQL Server" },
    { id: "recommender" as const, label: "👟 Shoe Recommender" },
    { id: "impact"      as const, label: "🏆 Impact"         },
  ];

  return (
    <div style={{ background: NK.black, color: NK.white, fontFamily: "'Inter', system-ui, sans-serif", minHeight: "100vh", padding: 24 }}>

      {/* Header */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
          {/* Nike Swoosh SVG */}
          <svg width="40" height="14" viewBox="0 0 640 230" fill="white">
            <path d="M0 230L440 0l200 51-640 179z" />
          </svg>
          <div>
            <h1 style={{ margin: 0, fontSize: 22, fontWeight: 900, letterSpacing: "-0.5px" }}>NIKE — Platform Engineering</h1>
            <p style={{ margin: 0, color: NK.gray500, fontSize: 13 }}>UI Platform · GraphQL Gateway · Shoe Recommender</p>
          </div>
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {["UI Platform", "Design System", "GraphQL Federation", "Plugin Architecture", "Recommendation Engine", "A/B Testing", "Revenue Impact", "Team Founding"].map(t => (
            <span key={t} style={{ background: NK.gray800, color: NK.gray500, border: `1px solid ${NK.border}`, borderRadius: 20, padding: "3px 10px", fontSize: 11 }}>{t}</span>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 4, marginBottom: 20, borderBottom: `1px solid ${NK.border}`, paddingBottom: 4, flexWrap: "wrap" }}>
        {TABS.map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{
            background: activeTab === tab.id ? NK.gray800 : "transparent",
            color: activeTab === tab.id ? NK.white : NK.gray500,
            border: activeTab === tab.id ? `1px solid ${NK.border}` : "1px solid transparent",
            borderRadius: "8px 8px 0 0", padding: "8px 18px", cursor: "pointer", fontSize: 13, fontWeight: 600,
          }}>{tab.label}</button>
        ))}
      </div>

      {/* ── UI PLATFORM ── */}
      {activeTab === "platform" && (
        <div>
          <div style={{ background: NK.surface, border: `1px solid ${NK.border}`, borderRadius: 10, padding: 14, marginBottom: 16, borderLeft: `4px solid ${NK.orange}` }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: NK.orange, marginBottom: 4 }}>Founded the UI Platform team at Nike</div>
            <div style={{ fontSize: 12, color: NK.gray500, lineHeight: 1.7 }}>
              Nike's digital products — <strong style={{ color: NK.white }}>Nike.com, Nike App, SNKRS, Nike Training Club</strong> — were each building their own components.
              Different buttons, different form controls, different product card layouts. I founded the UI Platform team to solve this at scale:
              one design language, one component library, shared across all digital surfaces. Every Nike customer gets a consistent experience.
            </div>
          </div>

          {/* Token grid */}
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: NK.white, marginBottom: 10, letterSpacing: "0.1em" }}>DESIGN TOKENS</div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(9, 1fr)", gap: 8 }}>
              {DESIGN_TOKENS.map(t => (
                <div key={t.name} style={{ background: NK.surface, borderRadius: 8, overflow: "hidden", border: `1px solid ${NK.border}` }}>
                  <div style={{ height: 36, background: t.value, border: t.value === NK.white ? `1px solid ${NK.border}` : "none" }} />
                  <div style={{ padding: "6px 8px" }}>
                    <div style={{ fontSize: 9, fontWeight: 700, color: NK.white }}>{t.label}</div>
                    <div style={{ fontSize: 7, color: NK.gray500, fontFamily: "monospace" }}>{t.value}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Component showcase */}
          <div style={{ background: NK.surface, border: `1px solid ${NK.border}`, borderRadius: 10, overflow: "hidden" }}>
            <div style={{ display: "flex", gap: 0, borderBottom: `1px solid ${NK.border}`, overflowX: "auto" }}>
              {DS_COMPONENTS.map((c, i) => (
                <button key={c.name} onClick={() => setDsComp(i)} style={{
                  background: dsComp === i ? NK.gray800 : "transparent",
                  border: "none", borderRight: `1px solid ${NK.border}`,
                  padding: "10px 16px", color: dsComp === i ? NK.white : NK.gray500,
                  cursor: "pointer", fontSize: 11, fontWeight: dsComp === i ? 700 : 400, whiteSpace: "nowrap",
                  letterSpacing: "0.05em",
                }}>{DS_COMPONENTS[i].name.toUpperCase()}</button>
              ))}
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 0 }}>
              <div style={{ padding: 16, borderRight: `1px solid ${NK.border}` }}>
                <div style={{ fontSize: 10, color: NK.gray500, marginBottom: 10 }}>{DS_COMPONENTS[dsComp].desc}</div>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  {DS_COMPONENTS[dsComp].variants.map(v => (
                    <div key={v} style={{
                      background: v === "Primary" ? NK.white : v === "Sold Out" ? NK.gray800 : v === "Members" ? NK.orange : "transparent",
                      border: `1px solid ${v === "Primary" ? NK.white : v === "Ghost" ? NK.white : NK.border}`,
                      borderRadius: 24, padding: "7px 16px", fontSize: 12, fontWeight: 700,
                      color: v === "Primary" ? NK.black : NK.white,
                      letterSpacing: "0.05em",
                    }}>{v.toUpperCase()}</div>
                  ))}
                </div>
              </div>
              <div style={{ padding: 16 }}>
                <CodeBlock label="Example: ProductCard API — typed props enforce design standards" color={NK.orange} code={
`// ProductCard.tsx — used across Nike.com, SNKRS, Nike App
interface ProductCardProps {
  product:    Product;
  variant:    "default" | "quick-add" | "wishlist" | "sold-out";
  size:       "sm" | "md" | "lg";
  // Enforce design token usage — no custom colors
  colorScheme?: "light" | "dark";
  onAddToCart?: (product: Product, size: string) => void;
  onWishlist?:  (product: Product) => void;
}

// The component enforces:
// - Nike design tokens (no hardcoded hex)
// - Correct image aspect ratios (4:3 for lifestyle, 1:1 for listing)
// - Accessibility: alt text, button semantics, focus ring
// - Analytics: every interaction fires a standardised event

export const ProductCard = React.memo(({ product, variant, ... }: ProductCardProps) => {
  // ... implementation using design tokens
  return (
    <article aria-label={product.name}>
      <ProductImage ... />
      <ProductInfo ... />
      {variant === "quick-add" && <QuickAddButton ... />}
    </article>
  );
});`} />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── GRAPHQL SERVER ── */}
      {activeTab === "graphql" && (
        <div>
          <div style={{ background: NK.surface, border: `1px solid ${NK.border}`, borderRadius: 10, padding: 14, marginBottom: 16, borderLeft: `4px solid ${NK.orange}` }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: NK.orange, marginBottom: 4 }}>Pluggable GraphQL Server — one graph, many teams</div>
            <div style={{ fontSize: 12, color: NK.gray500, lineHeight: 1.7 }}>
              Nike's data spans many domains: Products, Commerce (cart, checkout), AI (recommendations), and Editorial (content, athletes).
              I designed a plugin-based GraphQL server where each team registers their own schema extensions and resolvers independently.
              No single team owns the full schema. No bottleneck. The Platform team owns the core — everyone else extends it.
            </div>
          </div>

          {/* Architecture diagram */}
          <div style={{ background: NK.surface, border: `1px solid ${NK.border}`, borderRadius: 10, padding: 14, marginBottom: 14 }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: NK.white, marginBottom: 12, letterSpacing: "0.1em" }}>PLUGIN REGISTRATION ARCHITECTURE</div>
            <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
              {GQL_PLUGINS.map((p, i) => (
                <React.Fragment key={p.name}>
                  <div style={{ background: NK.card, border: `2px solid ${p.color}`, borderRadius: 8, padding: "8px 12px", textAlign: "center" }}>
                    <div style={{ fontSize: 10, fontWeight: 700, color: p.color }}>{p.name}</div>
                    <div style={{ fontSize: 8, color: NK.gray500 }}>{p.team} team</div>
                    <div style={{ display: "flex", gap: 3, marginTop: 4, flexWrap: "wrap", justifyContent: "center" }}>
                      {p.types.map(t => <span key={t} style={{ background: p.color + "20", color: p.color, borderRadius: 3, padding: "1px 4px", fontSize: 7 }}>{t}</span>)}
                    </div>
                  </div>
                  {i < GQL_PLUGINS.length - 1 && (
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", color: NK.gray500 }}>
                      <div style={{ fontSize: 16 }}>→</div>
                      <div style={{ fontSize: 8 }}>register()</div>
                    </div>
                  )}
                </React.Fragment>
              ))}
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", color: NK.gray500 }}>
                <div style={{ fontSize: 16 }}>→</div>
                <div style={{ fontSize: 8 }}>compose</div>
              </div>
              <div style={{ background: NK.orange + "20", border: `2px solid ${NK.orange}`, borderRadius: 8, padding: "12px 16px", textAlign: "center" }}>
                <div style={{ fontSize: 11, fontWeight: 900, color: NK.orange }}>UNIFIED GRAPH</div>
                <div style={{ fontSize: 8, color: NK.gray500, marginTop: 2 }}>Single endpoint: /graphql</div>
              </div>
            </div>
          </div>

          {/* Plugin selector */}
          <div style={{ display: "flex", gap: 6, marginBottom: 12 }}>
            {GQL_PLUGINS.map((p, i) => (
              <button key={p.name} onClick={() => setGqlPlugin(i)} style={{
                background: gqlPlugin === i ? p.color + "20" : NK.surface,
                border: `1px solid ${gqlPlugin === i ? p.color : NK.border}`,
                borderRadius: 8, padding: "6px 14px", cursor: "pointer",
                color: gqlPlugin === i ? p.color : NK.gray500, fontSize: 11,
              }}>{p.name}</button>
            ))}
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div>
              <div style={{ background: NK.surface, border: `1px solid ${curPlugin.color}30`, borderRadius: 10, padding: 12, marginBottom: 10 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: curPlugin.color, marginBottom: 4 }}>{curPlugin.name} — {curPlugin.team} team</div>
                <div style={{ fontSize: 11, color: NK.gray500, lineHeight: 1.6 }}>{curPlugin.description}</div>
              </div>
              <CodeBlock label={`${curPlugin.name} — schema excerpt`} color={curPlugin.color} code={curPlugin.sampleSchema} />
            </div>
            <CodeBlock label="Unified query — spans all four plugins seamlessly" color={NK.orange} code={SAMPLE_QUERY} />
          </div>

          <div style={{ marginTop: 12 }}>
            <CodeBlock label="Plugin registration API — how teams integrate" color={NK.white} code={
`// Each team ships their plugin as an npm package.
// The gateway loads and composes them at startup.

// gateway/index.ts
import { createPluggableServer }  from "@nike/graphql-gateway";
import { CorePlugin }             from "@nike/gql-core";
import { CommercePlugin }         from "@nike/gql-commerce";
import { AIPlugin }               from "@nike/gql-ai";
import { ContentPlugin }          from "@nike/gql-content";

const server = createPluggableServer({
  plugins: [
    CorePlugin,      // must be first — defines base types
    CommercePlugin,  // extends Product, adds Cart/Order
    AIPlugin,        // extends User, adds Recommendations
    ContentPlugin,   // extends Product, adds Content/Athletes
  ],
  auth: (ctx) => ctx.session.user,     // shared auth — once, centrally
  dataSources: { db, cache, searchIndex }, // shared infrastructure
});

// Each plugin is just an object with typeDefs + resolvers:
// { typeDefs: gql\`...\`, resolvers: { Product: { inventory: () => ... } } }
// The gateway merges them. Teams never touch each other's code.`} />
          </div>
        </div>
      )}

      {/* ── SHOE RECOMMENDER ── */}
      {activeTab === "recommender" && (
        <div>
          <div style={{ background: NK.surface, border: `1px solid ${NK.border}`, borderRadius: 10, padding: 14, marginBottom: 16, borderLeft: `4px solid ${NK.orange}` }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: NK.orange, marginBottom: 4 }}>Shoe Recommender — passion project → production → revenue lift</div>
            <div style={{ fontSize: 12, color: NK.gray500, lineHeight: 1.7 }}>
              The existing Nike.com recommender was rule-based ("other customers also viewed") with no personalisation.
              Null recommendation rate: 18% of sessions showed no recommendations. I redesigned it from scratch:
              <strong style={{ color: NK.white }}> collaborative filtering + content-based scoring + real-time trending</strong>,
              weighted by browsing context (homepage vs PDP vs cart). The result: deployed, A/B tested, significant revenue lift.
            </div>
          </div>

          {/* Browsing history */}
          <div style={{ marginBottom: 12 }}>
            <div style={{ fontSize: 10, color: NK.gray500, marginBottom: 8, letterSpacing: "0.1em" }}>YOUR BROWSING HISTORY</div>
            <div style={{ display: "flex", gap: 8 }}>
              {HISTORY.map(h => (
                <div key={h} style={{ background: NK.surface, border: `1px solid ${NK.border}`, borderRadius: 8, padding: "6px 12px", fontSize: 11, color: NK.gray500 }}>
                  🕐 {h}
                </div>
              ))}
            </div>
          </div>

          {/* Filter by signal */}
          <div style={{ display: "flex", gap: 6, marginBottom: 14 }}>
            <button onClick={() => setFilterCtx("all")} style={{ background: filterCtx === "all" ? NK.white + "20" : NK.surface, border: `1px solid ${filterCtx === "all" ? NK.white : NK.border}`, borderRadius: 8, padding: "5px 12px", cursor: "pointer", color: filterCtx === "all" ? NK.white : NK.gray500, fontSize: 10 }}>All signals</button>
            {(Object.entries(CONTEXT_META) as [Shoe["context"], typeof CONTEXT_META[keyof typeof CONTEXT_META]][]).map(([key, meta]) => (
              <button key={key} onClick={() => setFilterCtx(key)} style={{
                background: filterCtx === key ? meta.color + "20" : NK.surface,
                border: `1px solid ${filterCtx === key ? meta.color : NK.border}`,
                borderRadius: 8, padding: "5px 12px", cursor: "pointer",
                color: filterCtx === key ? meta.color : NK.gray500, fontSize: 10,
              }}>{meta.icon} {meta.label}</button>
            ))}
          </div>

          {/* Shoe grid */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10, marginBottom: 16 }}>
            {filteredShoes.map(shoe => {
              const meta = CONTEXT_META[shoe.context];
              const selected = selectedShoe?.id === shoe.id;
              return (
                <div
                  key={shoe.id}
                  onClick={() => setSelectedShoe(selected ? null : shoe)}
                  style={{
                    background: selected ? NK.gray800 : NK.surface,
                    border: `1px solid ${selected ? NK.orange : NK.border}`,
                    borderRadius: 10, padding: 12, cursor: "pointer",
                    borderTop: `3px solid ${shoe.color}`,
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                    <span style={{ fontSize: 9, color: meta.color }}>{meta.icon} {meta.label}</span>
                    <span style={{ fontSize: 9, fontWeight: 700, color: NK.orange }}>{Math.round(shoe.score * 100)}%</span>
                  </div>
                  <div style={{ width: 40, height: 40, background: shoe.color, borderRadius: 4, marginBottom: 8 }} />
                  <div style={{ fontSize: 11, fontWeight: 700, color: NK.white }}>{shoe.name}</div>
                  <div style={{ fontSize: 9, color: NK.gray500, marginBottom: 4 }}>{shoe.sub}</div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: NK.white }}>${shoe.price}</div>
                  {selected && (
                    <div style={{ marginTop: 8, fontSize: 9, color: NK.gray500, borderTop: `1px solid ${NK.border}`, paddingTop: 8 }}>
                      💡 {shoe.reason}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* A/B test results */}
          <button onClick={() => setShowAB(v => !v)} style={{ background: NK.orange, border: "none", borderRadius: 8, padding: "8px 18px", color: NK.white, cursor: "pointer", fontSize: 12, fontWeight: 700, marginBottom: showAB ? 14 : 0 }}>
            {showAB ? "Hide" : "Show"} A/B Test Results
          </button>
          {showAB && (
            <div style={{ background: NK.surface, border: `1px solid ${NK.border}`, borderRadius: 10, overflow: "hidden" }}>
              <div style={{ padding: "8px 14px", background: NK.black, borderBottom: `1px solid ${NK.border}`, display: "flex", justifyContent: "space-between" }}>
                <div style={{ fontSize: 10, color: NK.gray500 }}>Control: rule-based recommender vs Variant: new personalised engine</div>
                <div style={{ fontSize: 10, color: "#4ade80", fontWeight: 700 }}>Stat significance: 99% · Duration: 4 weeks · n=2.8M sessions</div>
              </div>
              {AB_METRICS.map(m => (
                <div key={m.label} style={{ padding: "10px 14px", borderBottom: `1px solid ${NK.border}`, display: "flex", gap: 16, alignItems: "center" }}>
                  <div style={{ flex: 1, fontSize: 11, color: NK.white }}>{m.label}</div>
                  <div style={{ fontSize: 11, color: NK.gray500 }}>Before: {m.before}</div>
                  <div style={{ fontSize: 11, color: NK.white, fontWeight: 700 }}>After: {m.after}</div>
                  <div style={{ background: m.color + "20", color: m.color, borderRadius: 20, padding: "2px 10px", fontSize: 11, fontWeight: 700 }}>{m.lift}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── IMPACT ── */}
      {activeTab === "impact" && (
        <div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginBottom: 16 }}>
            {[
              { title: "UI Platform", icon: "🏃", color: NK.orange,
                impact: "One component library across Nike.com, SNKRS, Nike App, Nike Training Club. Design inconsistencies eliminated. New digital surfaces built in weeks, not months." },
              { title: "GraphQL Gateway", icon: "🔌", color: "#a855f7",
                impact: "Commerce, AI, and Content teams deploy schema changes independently. No cross-team coordination for API changes. Query performance improved via plugin-level caching." },
              { title: "Shoe Recommender", icon: "👟", color: "#4ade80",
                impact: "205% lift in recommendation-attributed revenue. Null recommendation rate: 18% → 3%. Built and shipped as a solo passion project, A/B tested against incumbent." },
            ].map(c => (
              <div key={c.title} style={{ background: NK.surface, border: `1px solid ${NK.border}`, borderRadius: 10, padding: 16, borderTop: `3px solid ${c.color}` }}>
                <div style={{ fontSize: 16, marginBottom: 8 }}>{c.icon}</div>
                <div style={{ fontSize: 13, fontWeight: 700, color: c.color, marginBottom: 8 }}>{c.title}</div>
                <div style={{ fontSize: 11, color: NK.gray500, lineHeight: 1.7 }}>{c.impact}</div>
              </div>
            ))}
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div style={{ background: NK.surface, border: `1px solid ${NK.border}`, borderRadius: 10, padding: 14 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: NK.white, marginBottom: 10, letterSpacing: "0.05em" }}>LEADERSHIP: FOUNDING A TEAM</div>
              {[
                { title: "Mission definition", detail: "Before the team existed: inconsistent UIs, duplicated component code, no shared design language. The first task was articulating the problem clearly enough to justify a team." },
                { title: "Stakeholder alignment", detail: "Nike.com, SNKRS, and Nike App teams all had existing components they owned. The platform had to be valuable enough that they would migrate — without a mandate." },
                { title: "Team composition", detail: "Founded with engineers who combined design sensibility with systems thinking. FE infrastructure is different from product engineering — different skills, different metrics." },
                { title: "Adoption strategy", detail: "Did not replace existing components by decree. Migrated one high-traffic surface at a time, proving value, then letting adoption spread organically." },
              ].map(item => (
                <div key={item.title} style={{ borderLeft: `3px solid ${NK.orange}`, paddingLeft: 10, marginBottom: 12 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: NK.orange, marginBottom: 2 }}>{item.title}</div>
                  <div style={{ fontSize: 10, color: NK.gray500 }}>{item.detail}</div>
                </div>
              ))}
            </div>

            <CodeBlock label="How all three connect — the full Nike platform picture" color={NK.orange} code={
`// The three initiatives form a coherent platform:

// 1. UI Platform → provides the component building blocks
//    ProductCard, SizeSelector, AddToCartButton — all platform components

// 2. GraphQL Gateway → provides the data
//    query { me { recommendations { product { name, price, images } } } }
//    CorePlugin (Product) + AIPlugin (recommendations) composed automatically

// 3. Shoe Recommender → consumes both
//    RecommendationWidget.tsx — platform component
//    data from AIPlugin via GraphQL
//    Personalised for each user, rendered with consistent Nike UI

// The full stack for a recommendation widget on Nike.com PDP:

function RecommendationWidget({ context }: { context: "PDP" | "CART" }) {
  // GraphQL — spans CorePlugin + AIPlugin
  const { data } = useQuery(GET_RECOMMENDATIONS, {
    variables: { context },
  });

  return (
    <section>
      <h2>You Might Also Like</h2>
      {data?.me.recommendations.map(rec => (
        // Platform component — consistent across all Nike surfaces
        <ProductCard
          key={rec.product.id}
          product={rec.product}
          variant="default"
          analytics={{                   // auto-tracked by platform
            source: "recommendation",
            context,
            score: rec.score,
          }}
        />
      ))}
    </section>
  );
}`} />
          </div>
        </div>
      )}
    </div>
  );
}

export default NikePlatformDemo;
