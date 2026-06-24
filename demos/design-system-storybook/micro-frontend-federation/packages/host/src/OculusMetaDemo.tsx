/**
 * OculusMetaDemo.tsx
 *
 * Tech lead — oculus.com / Meta Reality Labs
 *
 * 1. E-COMMERCE PLATFORM
 *    Scaling oculus.com for product launches (Quest 3, Quest Pro).
 *    ISR, edge caching, real-time inventory, cart at scale.
 *
 * 2. REACT CMS FRAMEWORK
 *    De-facto framework for CMS-backed pages at Meta.
 *    Used on meta.com, oculus.com, FB/IG/WhatsApp help centers.
 *    ComponentMapper, CMSErrorBoundary, preview mode, typed content.
 *
 * 3. OCULUS WEB DESIGN SYSTEM
 *    React component suite used across oculus.com and all subdomains.
 *    Design tokens, component variants, adoption story.
 *
 * TABS
 *   🛍 E-Commerce   — product grid, cart, perf metrics, scaling architecture
 *   📝 CMS Framework — block mapper, page types, preview mode, adoption story
 *   🎨 Design System — tokens, component playground, surfaces, adoption stats
 */

import React, { useState, useCallback } from "react";

// ─────────────────────────────────────────────────────────────────
// Design tokens (realistic Oculus/Meta Reality Labs palette)
// ─────────────────────────────────────────────────────────────────

const T = {
  bg:        "#0E0E16",
  surface:   "#17171F",
  card:      "#1F1F2D",
  border:    "#2E2E3E",
  primary:   "#0064E0",
  primaryHover: "#0057C2",
  purple:    "#7C3AED",
  purpleLight:"#A78BFA",
  green:     "#22C55E",
  orange:    "#F59E0B",
  red:       "#EF4444",
  text:      "#F5F5F7",
  muted:     "#9CA3AF",
  dim:       "#6B7280",
  white:     "#FFFFFF",
};

// ─────────────────────────────────────────────────────────────────
// Products
// ─────────────────────────────────────────────────────────────────

interface Product {
  id: string; name: string; subtitle: string; price: number; originalPrice?: number;
  badge?: string; badgeColor?: string; color: string; emoji: string;
  specs: string[]; inStock: boolean;
}

const PRODUCTS: Product[] = [
  {
    id: "q3", name: "Meta Quest 3",   subtitle: "Mixed Reality Headset",
    price: 499, badge: "New", badgeColor: T.primary,
    color: "#0064E0", emoji: "🥽",
    specs: ["Snapdragon XR2 Gen 2", "4K+ display per eye", "40% thinner pancake lenses", "Mixed Reality passthrough"],
    inStock: true,
  },
  {
    id: "q3s", name: "Meta Quest 3S", subtitle: "Affordable Mixed Reality",
    price: 299, badge: "Best value", badgeColor: T.green,
    color: "#22C55E", emoji: "🎮",
    specs: ["Snapdragon XR2 Gen 2", "2064×2208 per eye", "All-in-one design", "2,000+ titles"],
    inStock: true,
  },
  {
    id: "qp", name: "Meta Quest Pro", subtitle: "Professional-Grade VR",
    price: 999, originalPrice: 1499,  badge: "Pro", badgeColor: T.purple,
    color: "#7C3AED", emoji: "💼",
    specs: ["Snapdragon XR2+", "Eye & face tracking", "40+ colour sensors", "TruTouch haptics"],
    inStock: true,
  },
  {
    id: "rbm", name: "Ray-Ban Meta",  subtitle: "Smart Glasses",
    price: 299, badge: "Collab", badgeColor: T.orange,
    color: "#F59E0B", emoji: "🕶",
    specs: ["Built-in speakers", "12MP + video camera", "Meta AI built-in", "Up to 4h battery"],
    inStock: false,
  },
];

// ─────────────────────────────────────────────────────────────────
// CMS Framework
// ─────────────────────────────────────────────────────────────────

type BlockType = "hero" | "text" | "media" | "product_grid" | "article" | "steps" | "cta" | "callout";

interface CMSBlock { id: string; type: BlockType; label: string; content: string; icon: string; }
interface CMSPage { id: string; name: string; surface: string; blocks: CMSBlock[]; }

const CMS_PAGES: CMSPage[] = [
  {
    id: "q3-launch", name: "Quest 3 Launch Page", surface: "oculus.com/quest/3",
    blocks: [
      { id: "b1", type: "hero",         label: "Hero — Quest 3 launch visual",      content: "Full-bleed video hero with Quest 3 lifestyle imagery, launch headline, CTA",        icon: "🖼" },
      { id: "b2", type: "product_grid", label: "Product Grid — Quest 3 variants",   content: "128GB / 256GB variant cards, colour options, buy CTA, inventory status",             icon: "🛍" },
      { id: "b3", type: "media",        label: "Media — Mixed reality demo",        content: "Carousel of mixed reality use-case videos (gaming, fitness, productivity)",           icon: "🎥" },
      { id: "b4", type: "text",         label: "Rich text — Tech specs breakdown",  content: "Processor, display, optics, battery, connectivity — structured feature list",         icon: "📋" },
      { id: "b5", type: "cta",          label: "CTA — Pre-order banner",            content: "Sticky CTA: 'Pre-order now. Ships October 10.' with countdown + inventory badge",     icon: "📣" },
    ],
  },
  {
    id: "help-setup", name: "Help: Quest 3 Setup Guide", surface: "facebook.com/help",
    blocks: [
      { id: "h1", type: "hero",    label: "Article header — Setup guide",    content: "Page title, description, estimated time, last updated date, breadcrumb",            icon: "📖" },
      { id: "h2", type: "steps",   label: "Steps — Initial setup flow",      content: "1. Charge headset · 2. Download app · 3. Pair device · 4. Create Guardian boundary", icon: "🪜" },
      { id: "h3", type: "media",   label: "Media — Instructional video",     content: "Embedded YouTube: 'Set up your Quest 3 in 5 minutes'",                               icon: "🎬" },
      { id: "h4", type: "callout", label: "Callout — Important safety note", content: "Guardian boundary warning, play area requirements, proximity alerts explanation",      icon: "⚠️" },
      { id: "h5", type: "cta",     label: "CTA — Related articles",          content: "Related: 'How to adjust IPD', 'Casting to TV', 'Manage storage' — auto-suggested",  icon: "🔗" },
    ],
  },
  {
    id: "meta-corp", name: "Reality Labs — Meta.com", surface: "meta.com/reality-labs",
    blocks: [
      { id: "m1", type: "hero",    label: "Hero — Reality Labs mission",     content: "Cinematic hero: 'Connecting you to the people and experiences that matter most'",   icon: "🌐" },
      { id: "m2", type: "text",    label: "Text — Research overview",        content: "Rich text: what Reality Labs builds — VR, AR, AI, haptics, social presence research", icon: "🔬" },
      { id: "m3", type: "media",   label: "Media — Research highlights",     content: "Grid of research project cards: Codec Avatars, Project Aria, EMG wristband",          icon: "💡" },
      { id: "m4", type: "callout", label: "Callout — Careers CTA",           content: "Join the Reality Labs team — link to open roles (engineering, design, research)",      icon: "💼" },
    ],
  },
];

const BLOCK_COLORS: Record<BlockType, string> = {
  hero: "#0064E0", text: "#6B7280", media: "#7C3AED", product_grid: "#22C55E",
  article: "#F59E0B", steps: "#EC4899", cta: "#EF4444", callout: "#F97316",
};

// ─────────────────────────────────────────────────────────────────
// Design System
// ─────────────────────────────────────────────────────────────────

const DESIGN_TOKENS = {
  colours: [
    { name: "Blue 600",  value: "#0064E0", role: "Primary action"   },
    { name: "Blue 700",  value: "#0057C2", role: "Primary hover"    },
    { name: "Purple 600",value: "#7C3AED", role: "Premium / Pro"    },
    { name: "Green 500", value: "#22C55E", role: "Success / In stock"},
    { name: "Orange 400",value: "#F59E0B", role: "Warning / Sale"   },
    { name: "Red 500",   value: "#EF4444", role: "Error / Sold out" },
    { name: "Grey 900",  value: "#0E0E16", role: "Background"       },
    { name: "Grey 800",  value: "#1F1F2D", role: "Card surface"     },
    { name: "Grey 100",  value: "#F5F5F7", role: "Primary text"     },
    { name: "Grey 400",  value: "#9CA3AF", role: "Secondary text"   },
  ],
  spacing: ["4px", "8px", "12px", "16px", "24px", "32px", "48px", "64px", "96px"],
  radii: ["4px", "8px", "12px", "16px", "24px", "9999px"],
  type: [
    { name: "Display",    size: "40px / 700", usage: "Hero headlines"    },
    { name: "Heading 1",  size: "32px / 700", usage: "Page titles"       },
    { name: "Heading 2",  size: "24px / 600", usage: "Section headings"  },
    { name: "Body Large", size: "18px / 400", usage: "Lead paragraphs"   },
    { name: "Body",       size: "16px / 400", usage: "Body copy"         },
    { name: "Label",      size: "12px / 600", usage: "Badges, captions"  },
  ],
};

const DS_COMPONENTS = [
  { name: "Button",       variants: 3, count: "primary · secondary · ghost",    surfaces: 8 },
  { name: "ProductCard",  variants: 2, count: "default · compact",              surfaces: 4 },
  { name: "Badge",        variants: 4, count: "new · sale · exclusive · beta",  surfaces: 6 },
  { name: "Navigation",   variants: 2, count: "desktop · mobile",               surfaces: 5 },
  { name: "MediaCarousel",variants: 2, count: "standard · fullscreen",          surfaces: 4 },
  { name: "SizeSelector", variants: 1, count: "storage capacity selector",      surfaces: 3 },
  { name: "PriceDisplay", variants: 2, count: "current · with-original",       surfaces: 5 },
  { name: "Toast",        variants: 3, count: "success · error · info",         surfaces: 7 },
  { name: "Modal",        variants: 2, count: "standard · fullscreen",          surfaces: 6 },
  { name: "SearchBar",    variants: 1, count: "with AI suggestions",            surfaces: 3 },
];

const DS_SURFACES = [
  "oculus.com (main site)",
  "oculus.com/blog",
  "oculus.com/experiences",
  "oculus.com/accessories",
  "oculus.com/gaming",
  "developer.oculus.com",
  "support.meta.com",
];

// ─────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────

function CodeBlock({ code, label, color = T.dim }: { code: string; label?: string; color?: string }) {
  return (
    <div style={{ background: "#0A0A10", borderRadius: 8, overflow: "hidden", border: `1px solid ${T.border}` }}>
      {label && <div style={{ padding: "5px 12px", borderBottom: `1px solid ${T.border}`, fontSize: 10, color }}>{label}</div>}
      <pre style={{ margin: 0, padding: 12, fontSize: 10, fontFamily: "monospace", color: "#94a3b8", lineHeight: 1.7, overflow: "auto", maxHeight: 360 }}>{code}</pre>
    </div>
  );
}

function Tag({ children, color = T.primary }: { children: React.ReactNode; color?: string }) {
  return <span style={{ background: color + "22", color, borderRadius: 20, padding: "2px 9px", fontSize: 10, fontWeight: 700 }}>{children}</span>;
}

// ─────────────────────────────────────────────────────────────────
// Main
// ─────────────────────────────────────────────────────────────────

export function OculusMetaDemo() {
  const [activeTab, setActiveTab] = useState<"ecomm" | "cms" | "ds">("ecomm");

  // E-commerce state
  const [cart, setCart]             = useState<Record<string, number>>({});
  const [cartOpen, setCartOpen]     = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  const addToCart = useCallback((id: string) => {
    setCart(prev => ({ ...prev, [id]: (prev[id] ?? 0) + 1 }));
    setCartOpen(true);
  }, []);

  const cartCount = Object.values(cart).reduce((a, b) => a + b, 0);
  const cartTotal = Object.entries(cart).reduce((sum, [id, qty]) => {
    const p = PRODUCTS.find(p => p.id === id);
    return sum + (p?.price ?? 0) * qty;
  }, 0);

  // CMS state
  const [cmsPageIdx, setCmsPageIdx]     = useState(0);
  const [selectedBlock, setSelectedBlock] = useState<CMSBlock | null>(null);
  const [previewMode, setPreviewMode]   = useState(false);

  // DS state
  const [dsSection, setDsSection]       = useState<"tokens" | "components" | "surfaces">("tokens");
  const [btnVariant, setBtnVariant]     = useState<"primary" | "secondary" | "ghost">("primary");

  const cmsPage = CMS_PAGES[cmsPageIdx];

  const TABS = [
    { id: "ecomm" as const, label: "🛍 E-Commerce"    },
    { id: "cms"   as const, label: "📝 CMS Framework"  },
    { id: "ds"    as const, label: "🎨 Design System"  },
  ];

  return (
    <div style={{ background: T.bg, color: T.text, fontFamily: "'Inter', system-ui, sans-serif", minHeight: "100vh", padding: 24 }}>

      {/* Header */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
          <span style={{ fontSize: 28 }}>🥽</span>
          <div>
            <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800 }}>Meta Reality Labs — oculus.com</h1>
            <p style={{ margin: 0, color: T.muted, fontSize: 13 }}>
              Tech lead · CMS Framework · Oculus Web Design System
            </p>
          </div>
          {cartCount > 0 && (
            <button onClick={() => setCartOpen(v => !v)} style={{ marginLeft: "auto", background: T.primary, border: "none", borderRadius: 20, padding: "7px 16px", color: T.white, cursor: "pointer", fontSize: 13, fontWeight: 700 }}>
              🛒 Cart ({cartCount}) · ${cartTotal}
            </button>
          )}
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {["Tech Lead", "oculus.com", "E-Commerce Scaling", "React CMS Framework", "Design System", "meta.com", "Help Centers", "ISR", "ComponentMapper", "Preview Mode", "Design Tokens"].map(t => (
            <span key={t} style={{ background: T.surface, color: T.muted, border: `1px solid ${T.border}`, borderRadius: 20, padding: "3px 10px", fontSize: 11 }}>{t}</span>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 4, marginBottom: 20, borderBottom: `1px solid ${T.border}`, paddingBottom: 4 }}>
        {TABS.map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{
            background: activeTab === tab.id ? T.surface : "transparent",
            color: activeTab === tab.id ? T.text : T.dim,
            border: activeTab === tab.id ? `1px solid ${T.border}` : "1px solid transparent",
            borderRadius: "8px 8px 0 0", padding: "8px 20px", cursor: "pointer", fontSize: 13, fontWeight: 600,
          }}>{tab.label}</button>
        ))}
      </div>

      {/* ── E-COMMERCE ── */}
      {activeTab === "ecomm" && (
        <div>
          {/* Cart drawer */}
          {cartOpen && cartCount > 0 && (
            <div style={{ position: "fixed", top: 0, right: 0, bottom: 0, width: 320, background: T.surface, borderLeft: `1px solid ${T.border}`, zIndex: 100, padding: 20, display: "flex", flexDirection: "column" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                <div style={{ fontSize: 14, fontWeight: 700 }}>Cart ({cartCount})</div>
                <button onClick={() => setCartOpen(false)} style={{ background: "transparent", border: "none", color: T.muted, cursor: "pointer", fontSize: 18 }}>✕</button>
              </div>
              {Object.entries(cart).map(([id, qty]) => {
                const p = PRODUCTS.find(p => p.id === id)!;
                return (
                  <div key={id} style={{ background: T.card, borderRadius: 8, padding: 12, marginBottom: 8, display: "flex", gap: 10, alignItems: "center" }}>
                    <span style={{ fontSize: 24 }}>{p.emoji}</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 11, fontWeight: 700 }}>{p.name}</div>
                      <div style={{ fontSize: 10, color: T.muted }}>Qty: {qty}</div>
                    </div>
                    <div style={{ fontSize: 11, color: T.primary, fontWeight: 700 }}>${p.price * qty}</div>
                  </div>
                );
              })}
              <div style={{ marginTop: "auto", borderTop: `1px solid ${T.border}`, paddingTop: 14 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12, fontSize: 13, fontWeight: 700 }}>
                  <span>Total</span><span style={{ color: T.primary }}>${cartTotal}</span>
                </div>
                <button style={{ width: "100%", background: T.primary, border: "none", borderRadius: 10, padding: "13px 0", color: T.white, fontSize: 14, fontWeight: 700, cursor: "pointer" }}>
                  Proceed to Checkout →
                </button>
              </div>
            </div>
          )}

          {/* Product grid */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 16 }}>
            {PRODUCTS.map(p => (
              <div
                key={p.id}
                onClick={() => setSelectedProduct(selectedProduct?.id === p.id ? null : p)}
                style={{
                  background: T.card, border: `1px solid ${selectedProduct?.id === p.id ? p.color : T.border}`,
                  borderRadius: 12, overflow: "hidden", cursor: "pointer",
                  boxShadow: selectedProduct?.id === p.id ? `0 0 0 1px ${p.color}40` : "none",
                }}
              >
                {/* Badge */}
                {p.badge && (
                  <div style={{ background: p.badgeColor, padding: "3px 10px", fontSize: 9, fontWeight: 800, letterSpacing: "0.06em", color: T.white }}>
                    {p.badge.toUpperCase()}
                  </div>
                )}
                {/* Emoji hero */}
                <div style={{ background: p.color + "15", height: 90, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 42 }}>
                  {p.emoji}
                </div>
                <div style={{ padding: 14 }}>
                  <div style={{ fontSize: 13, fontWeight: 800, marginBottom: 2 }}>{p.name}</div>
                  <div style={{ fontSize: 10, color: T.muted, marginBottom: 8 }}>{p.subtitle}</div>
                  <div style={{ display: "flex", alignItems: "baseline", gap: 6, marginBottom: 10 }}>
                    <span style={{ fontSize: 18, fontWeight: 800, color: T.text }}>${p.price}</span>
                    {p.originalPrice && <span style={{ fontSize: 11, color: T.muted, textDecoration: "line-through" }}>${p.originalPrice}</span>}
                  </div>
                  {p.inStock ? (
                    <button
                      onClick={e => { e.stopPropagation(); addToCart(p.id); }}
                      style={{ width: "100%", background: T.primary, border: "none", borderRadius: 8, padding: "9px 0", color: T.white, fontSize: 11, fontWeight: 700, cursor: "pointer" }}
                    >
                      Add to Cart
                    </button>
                  ) : (
                    <button disabled style={{ width: "100%", background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, padding: "9px 0", color: T.dim, fontSize: 11 }}>
                      Sold Out
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Selected product specs */}
          {selectedProduct && (
            <div style={{ background: T.surface, border: `1px solid ${selectedProduct.color}40`, borderRadius: 12, padding: 16, marginBottom: 14 }}>
              <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 10 }}>
                <span style={{ fontSize: 22 }}>{selectedProduct.emoji}</span>
                <div style={{ fontSize: 13, fontWeight: 800, color: selectedProduct.color }}>{selectedProduct.name} — Key Specs</div>
              </div>
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                {selectedProduct.specs.map(s => (
                  <Tag key={s} color={selectedProduct.color}>{s}</Tag>
                ))}
              </div>
            </div>
          )}

          {/* Performance + Scaling */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div>
              <div style={{ fontSize: 10, fontWeight: 700, color: T.dim, marginBottom: 8, letterSpacing: "0.08em" }}>PERF METRICS — PRODUCT PAGES</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 10 }}>
                {[
                  { label: "LCP",       value: "1.18s",  color: T.green,  note: "< 2.5s target"    },
                  { label: "INP",       value: "42ms",   color: T.green,  note: "< 200ms target"   },
                  { label: "CLS",       value: "0.02",   color: T.green,  note: "< 0.1 target"     },
                  { label: "Lighthouse",value: "97/100", color: T.green,  note: "Performance score" },
                ].map(m => (
                  <div key={m.label} style={{ background: T.card, borderRadius: 8, padding: 12, borderLeft: `3px solid ${m.color}` }}>
                    <div style={{ fontSize: 9, color: T.muted, marginBottom: 2 }}>{m.label}</div>
                    <div style={{ fontSize: 18, fontWeight: 800, color: m.color, marginBottom: 2 }}>{m.value}</div>
                    <div style={{ fontSize: 9, color: T.dim }}>{m.note}</div>
                  </div>
                ))}
              </div>
              <CodeBlock label="Scaling strategy — Quest launch traffic" color={T.primary} code={
`// oculus.com product pages: Next.js ISR + CDN edge caching
// Quest 3 launch: millions of concurrent sessions

// 1. INCREMENTAL STATIC REGENERATION (ISR)
//    Product pages are statically generated at build time.
//    Background revalidation: page re-generated every 60s.
//    A cache miss never blocks a user — stale content served
//    while the new version is generated in the background.
export const getStaticProps: GetStaticProps = async ({ params }) => {
  const product = await getProductFromCatalogService(params.slug);
  return {
    props: { product },
    revalidate: 60,        // ISR: regenerate every 60 seconds
  };
};

// 2. REAL-TIME INVENTORY (client-side only)
//    Inventory is NOT part of the static page — it changes too fast.
//    Instead: static page loads instantly, then client fetches stock.
function InventoryBadge({ sku }: { sku: string }) {
  const { data: inventory } = useSWR(
    \`/api/inventory/\${sku}\`,
    { refreshInterval: 30_000 }   // re-check every 30s
  );
  return inventory?.inStock
    ? <Badge color="green">In Stock</Badge>
    : <Badge color="red">Sold Out</Badge>;
}

// 3. CDN EDGE CACHING (Fastly / CloudFront)
//    Cache-Control: s-maxage=60, stale-while-revalidate=3600
//    CDN serves cached page; ISR invalidates on revalidation.
//    Launch day result: origin server load < 2% of total traffic.`} />
            </div>

            <div>
              <div style={{ fontSize: 10, fontWeight: 700, color: T.dim, marginBottom: 8, letterSpacing: "0.08em" }}>E-COMMERCE SCALING STRATEGIES</div>
              {[
                { title: "ISR — Incremental Static Regeneration",   color: T.primary,  detail: "Product pages pre-rendered at build + revalidated every 60s. No server render at request time. Launch day traffic → CDN cache, not origin." },
                { title: "Real-time inventory split",                color: T.green,    detail: "Static page + client-side inventory check. Stock levels change too frequently for static generation. SWR re-polls every 30s — always accurate, never blocks page load." },
                { title: "Cart persistence — localStorage + server sync", color: T.purple, detail: "Cart stored in localStorage immediately (no round-trip on add). Synced to server session async. Survives page refresh, browser close, even checkout abandonment." },
                { title: "Skeleton loading everywhere",              color: T.orange,   detail: "Every dynamic region (inventory, price, reviews) shows a skeleton during the client fetch. Users see content immediately — no layout shift, no blank space." },
              ].map(s => (
                <div key={s.title} style={{ background: T.card, border: `1px solid ${s.color}20`, borderRadius: 8, padding: 12, marginBottom: 8, borderLeft: `3px solid ${s.color}` }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: s.color, marginBottom: 4 }}>{s.title}</div>
                  <div style={{ fontSize: 10, color: T.muted, lineHeight: 1.6 }}>{s.detail}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── CMS FRAMEWORK ── */}
      {activeTab === "cms" && (
        <div>
          {/* Surfaces used on */}
          <div style={{ display: "flex", gap: 8, marginBottom: 14, flexWrap: "wrap", alignItems: "center" }}>
            <div style={{ fontSize: 10, color: T.dim }}>Used on:</div>
            {["meta.com", "oculus.com", "facebook.com/help", "instagram.com/help", "whatsapp.com/faq"].map(s => (
              <Tag key={s} color={T.primary}>{s}</Tag>
            ))}
            <div style={{ marginLeft: "auto", display: "flex", gap: 8, alignItems: "center" }}>
              <span style={{ fontSize: 10, color: T.dim }}>Preview mode:</span>
              <button onClick={() => setPreviewMode(v => !v)} style={{ background: previewMode ? T.orange + "22" : T.surface, border: `1px solid ${previewMode ? T.orange : T.border}`, borderRadius: 20, padding: "4px 12px", color: previewMode ? T.orange : T.dim, cursor: "pointer", fontSize: 11 }}>
                {previewMode ? "🔶 PREVIEW ON" : "Preview OFF"}
              </button>
            </div>
          </div>

          {/* Page selector */}
          <div style={{ display: "flex", gap: 6, marginBottom: 14 }}>
            {CMS_PAGES.map((p, i) => (
              <button key={p.id} onClick={() => { setCmsPageIdx(i); setSelectedBlock(null); }} style={{
                background: cmsPageIdx === i ? T.surface : "transparent",
                border: `1px solid ${cmsPageIdx === i ? T.border : "transparent"}`,
                borderRadius: 8, padding: "7px 14px", cursor: "pointer", color: cmsPageIdx === i ? T.text : T.dim, fontSize: 11,
              }}>{p.name}</button>
            ))}
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
            {/* CMS content tree */}
            <div>
              <div style={{ fontSize: 10, fontWeight: 700, color: T.dim, marginBottom: 8, letterSpacing: "0.08em" }}>
                CMS CONTENT — {cmsPage.surface}
                {previewMode && <span style={{ color: T.orange, marginLeft: 8 }}>⚠ UNPUBLISHED DRAFT</span>}
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                {cmsPage.blocks.map(block => {
                  const blockColor = BLOCK_COLORS[block.type];
                  const isSelected = selectedBlock?.id === block.id;
                  return (
                    <div
                      key={block.id}
                      onClick={() => setSelectedBlock(isSelected ? null : block)}
                      style={{
                        background: T.card, border: `1px solid ${isSelected ? blockColor : T.border}`,
                        borderLeft: `4px solid ${blockColor}`, borderRadius: "0 8px 8px 0",
                        padding: "10px 14px", cursor: "pointer", display: "flex", gap: 10, alignItems: "center",
                      }}
                    >
                      <span style={{ fontSize: 16 }}>{block.icon}</span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 10, fontWeight: 700, color: T.text }}>{block.label}</div>
                        {isSelected && <div style={{ fontSize: 9, color: T.muted, marginTop: 3, lineHeight: 1.5 }}>{block.content}</div>}
                      </div>
                      <Tag color={blockColor}>{block.type}</Tag>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Framework code */}
            <div>
              <CodeBlock label="React CMS Framework — ComponentMapper pattern (de facto at Meta)" color={T.primary} code={
`// The framework's core: maps CMS content types to React components.
// Teams configure this mapping; the framework handles everything else.

import { ComponentMapper, CMSPage, useCMSContent } from "@meta/cms-framework";
import { HeroSection } from "./components/Hero";
import { ProductGrid } from "./components/ProductGrid";
import { RichText }    from "./components/RichText";
import { MediaGallery } from "./components/MediaGallery";
import { StepsGuide }  from "./components/StepsGuide";
import { CTABlock }    from "./components/CTABlock";
import { Callout }     from "./components/Callout";

// Each team registers their component map with the framework.
// Framework provides: fetching, error handling, loading, preview mode.
const COMPONENT_MAP = new ComponentMapper({
  "hero":         HeroSection,
  "product_grid": ProductGrid,
  "text":         RichText,
  "media":        MediaGallery,
  "steps":        StepsGuide,
  "cta":          CTABlock,
  "callout":      Callout,
});

// The CMSPage component renders any CMS page from its ID.
// Teams write one line per page — not per block.
function QuestLaunchPage() {
  return <CMSPage id="quest-3-launch" componentMap={COMPONENT_MAP} />;
}

// ── What the framework handles (teams do NOT write this) ────────
// 1. Content fetching + revalidation (ISR-compatible)
// 2. Loading states (skeleton for each block while fetching)
// 3. Error boundaries (block error never crashes the whole page)
// 4. Preview mode (shows unpublished content for editors)
// 5. TypeScript: content type → component props are type-safe
// 6. A/B testing integration: serve variant content per user
// 7. Analytics: automatic "block viewed" events per block type`} />

              <div style={{ marginTop: 10 }}>
                <CodeBlock label="Preview mode — how editors see unpublished content" color={T.orange} code={
`// Preview mode: editors see DRAFT content, not published.
// Activated via: ?preview=true&previewToken=<editor-jwt>

// The framework checks for preview mode on every content fetch:
const previewMode = useCMSPreviewMode();   // reads URL param + validates JWT

// Fetch function switches endpoint based on mode:
const content = await fetchCMSContent(pageId, {
  draft: previewMode.active,     // draft=true → CMS returns unpublished
  preview: previewMode.active,
});

// Why this matters: before the framework, preview mode was
// re-implemented (badly) by each team.
// oculus.com's preview broke when you added a new block type.
// help center's preview didn't work in Safari.
// meta.com had no preview at all — editors published blind.
// The framework's preview works once, works everywhere.`} />
              </div>
            </div>
          </div>

          {/* Why it became de facto */}
          <div style={{ marginTop: 12, background: T.surface, border: `1px solid ${T.primary}20`, borderRadius: 12, padding: 14 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: T.primary, marginBottom: 10 }}>Why it became the de facto framework (without a mandate)</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 10 }}>
              {[
                { icon: "🐛", title: "Better error handling",    detail: "Block-level error boundaries — one broken block doesn't crash the page. The oculus.com team had a P1 incident caused by exactly this; the framework solved it." },
                { icon: "👁", title: "Functional preview mode",  detail: "First CMS framework at Meta where editors could reliably preview before publishing. Other teams adopted it specifically for this feature." },
                { icon: "🔷", title: "TypeScript-first",         detail: "Content types from the CMS are fully typed. Passing wrong props to a CMS-backed component is a compile error, not a runtime error." },
                { icon: "📊", title: "Analytics built-in",       detail: "Automatic 'block viewed' and 'block interacted' events per block type. Each team using the framework gets block-level analytics for free." },
              ].map(r => (
                <div key={r.title} style={{ background: T.card, borderRadius: 8, padding: 12 }}>
                  <div style={{ fontSize: 18, marginBottom: 6 }}>{r.icon}</div>
                  <div style={{ fontSize: 10, fontWeight: 700, color: T.text, marginBottom: 4 }}>{r.title}</div>
                  <div style={{ fontSize: 9, color: T.muted, lineHeight: 1.6 }}>{r.detail}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── DESIGN SYSTEM ── */}
      {activeTab === "ds" && (
        <div>
          {/* Sub-nav */}
          <div style={{ display: "flex", gap: 6, marginBottom: 16 }}>
            {(["tokens", "components", "surfaces"] as const).map(s => (
              <button key={s} onClick={() => setDsSection(s)} style={{
                background: dsSection === s ? T.surface : "transparent",
                border: `1px solid ${dsSection === s ? T.border : "transparent"}`,
                borderRadius: 8, padding: "7px 16px", cursor: "pointer", color: dsSection === s ? T.text : T.dim, fontSize: 12,
              }}>{s === "tokens" ? "🎨 Tokens" : s === "components" ? "🧩 Components" : "🌐 Surfaces"}</button>
            ))}
          </div>

          {/* TOKENS */}
          {dsSection === "tokens" && (
            <div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                <div>
                  <div style={{ fontSize: 10, fontWeight: 700, color: T.dim, marginBottom: 8, letterSpacing: "0.08em" }}>COLOUR TOKENS</div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                    {DESIGN_TOKENS.colours.map(c => (
                      <div key={c.name} style={{ display: "flex", gap: 10, alignItems: "center" }}>
                        <div style={{ width: 32, height: 32, borderRadius: 6, background: c.value, border: `1px solid ${T.border}`, flexShrink: 0 }} />
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: 10, fontWeight: 700, color: T.text, fontFamily: "monospace" }}>{c.value}</div>
                          <div style={{ fontSize: 9, color: T.muted }}>{c.name} · {c.role}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: 10, fontWeight: 700, color: T.dim, marginBottom: 8, letterSpacing: "0.08em" }}>TYPOGRAPHY SCALE</div>
                  {DESIGN_TOKENS.type.map(t => (
                    <div key={t.name} style={{ background: T.card, borderRadius: 8, padding: "8px 12px", marginBottom: 4, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <div>
                        <div style={{ fontSize: 10, fontWeight: 700, color: T.text }}>{t.name}</div>
                        <div style={{ fontSize: 9, color: T.muted }}>{t.usage}</div>
                      </div>
                      <code style={{ fontSize: 9, color: T.primary, background: T.primary + "15", borderRadius: 4, padding: "2px 6px" }}>{t.size}</code>
                    </div>
                  ))}

                  <div style={{ marginTop: 10 }}>
                    <div style={{ fontSize: 10, fontWeight: 700, color: T.dim, marginBottom: 6, letterSpacing: "0.08em" }}>SPACING SCALE (4px base unit)</div>
                    <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                      {DESIGN_TOKENS.spacing.map(s => (
                        <div key={s} style={{ background: T.card, borderRadius: 4, padding: "4px 8px", fontSize: 9, fontFamily: "monospace", color: T.primary }}>{s}</div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div style={{ marginTop: 12 }}>
                <CodeBlock label="Design token implementation — CSS custom properties + TypeScript constants" color={T.purple} code={
`/* oculus-tokens.css — single source of truth */
:root {
  /* Colour */
  --ow-color-primary:          #0064E0;
  --ow-color-primary-hover:    #0057C2;
  --ow-color-pro:              #7C3AED;
  --ow-color-success:          #22C55E;
  --ow-color-warning:          #F59E0B;
  --ow-color-error:            #EF4444;
  --ow-color-bg:               #0E0E16;
  --ow-color-surface:          #1F1F2D;
  --ow-color-text-primary:     #F5F5F7;
  --ow-color-text-secondary:   #9CA3AF;

  /* Spacing (4px base) */
  --ow-space-1:  4px;   --ow-space-2:  8px;
  --ow-space-3:  12px;  --ow-space-4:  16px;
  --ow-space-6:  24px;  --ow-space-8:  32px;

  /* Typography */
  --ow-font-display: 700 40px / 1.1 "Inter", system-ui;
  --ow-font-h1:      700 32px / 1.2 "Inter", system-ui;
  --ow-font-body:    400 16px / 1.6 "Inter", system-ui;

  /* Border radius */
  --ow-radius-sm:    4px;
  --ow-radius-md:    8px;
  --ow-radius-lg:    12px;
  --ow-radius-full:  9999px;
}

// TypeScript equivalents — used in React components
export const tokens = {
  color: { primary: "var(--ow-color-primary)", ... } as const,
  space: { 4: "var(--ow-space-1)", ... } as const,
} satisfies DesignTokens;`} />
              </div>
            </div>
          )}

          {/* COMPONENTS */}
          {dsSection === "components" && (
            <div>
              {/* Interactive button playground */}
              <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 12, padding: 16, marginBottom: 14 }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: T.dim, marginBottom: 10, letterSpacing: "0.08em" }}>BUTTON COMPONENT — INTERACTIVE PLAYGROUND</div>
                <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
                  {(["primary", "secondary", "ghost"] as const).map(v => (
                    <button key={v} onClick={() => setBtnVariant(v)} style={{ background: btnVariant === v ? T.card : "transparent", border: `1px solid ${btnVariant === v ? T.border : "transparent"}`, borderRadius: 6, padding: "5px 12px", cursor: "pointer", color: btnVariant === v ? T.text : T.dim, fontSize: 11 }}>
                      {v}
                    </button>
                  ))}
                </div>
                <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
                  {/* Sizes */}
                  {["sm", "md", "lg"].map(size => (
                    <button key={size} style={{
                      background: btnVariant === "primary" ? T.primary : btnVariant === "secondary" ? "transparent" : "transparent",
                      border: `${btnVariant === "ghost" ? 0 : 2}px solid ${btnVariant === "secondary" ? T.primary : btnVariant === "ghost" ? "transparent" : T.primary}`,
                      borderRadius: 8,
                      padding: size === "sm" ? "6px 12px" : size === "md" ? "9px 18px" : "13px 28px",
                      color: btnVariant === "primary" ? T.white : T.primary,
                      fontSize: size === "sm" ? 11 : size === "md" ? 13 : 15,
                      fontWeight: 700, cursor: "pointer",
                    }}>
                      Buy now · {size.toUpperCase()}
                    </button>
                  ))}
                </div>
              </div>

              {/* Component table */}
              <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 10, overflow: "hidden" }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 60px", padding: "6px 14px", borderBottom: `1px solid ${T.border}`, fontSize: 9, fontWeight: 700, color: T.dim, letterSpacing: "0.08em" }}>
                  <span>COMPONENT</span><span>VARIANTS</span><span>VARIANT NAMES</span><span style={{ textAlign: "right" }}>SURFACES</span>
                </div>
                {DS_COMPONENTS.map(c => (
                  <div key={c.name} style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 60px", padding: "10px 14px", borderBottom: `1px solid ${T.border}40`, alignItems: "center" }}>
                    <span style={{ fontSize: 11, fontWeight: 700, color: T.text }}>{c.name}</span>
                    <span style={{ fontSize: 10, color: T.primary }}>{c.variants} variant{c.variants > 1 ? "s" : ""}</span>
                    <span style={{ fontSize: 9, color: T.muted }}>{c.count}</span>
                    <span style={{ fontSize: 10, color: T.green, textAlign: "right", fontWeight: 700 }}>{c.surfaces} ↗</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* SURFACES */}
          {dsSection === "surfaces" && (
            <div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                <div>
                  <div style={{ fontSize: 10, fontWeight: 700, color: T.dim, marginBottom: 8, letterSpacing: "0.08em" }}>SURFACES USING THE DESIGN SYSTEM</div>
                  {DS_SURFACES.map((s, i) => (
                    <div key={s} style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: "10px 14px", marginBottom: 6, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <div style={{ fontSize: 11, color: T.text }}>{s}</div>
                      <div style={{ display: "flex", gap: 4 }}>
                        {i === 0 && <Tag color={T.green}>Core</Tag>}
                        {i < 5 && <Tag color={T.primary}>Production</Tag>}
                        {i >= 5 && <Tag color={T.orange}>Adopted</Tag>}
                      </div>
                    </div>
                  ))}
                  <div style={{ background: T.surface, border: `1px solid ${T.border}40`, borderRadius: 8, padding: "10px 14px", textAlign: "center" }}>
                    <span style={{ fontSize: 10, color: T.dim }}>+ internal tooling surfaces (Content Studio, AR Studio) adopting Q3 2025</span>
                  </div>
                </div>

                <div>
                  <CodeBlock label="Adoption story — why other teams used it without being told to" color={T.green} code={
`// ADOPTION WITHOUT MANDATE — how it spread organically

// THE OCULUS.COM TEAM BUILT IT:
//   Problem: 6 engineers maintaining 6 different button implementations.
//   Quest 3 redesign required updating all of them. 2 weeks of work.
//   Solution: centralise into @oculus/design-system.
//   Future redesigns: 1 PR, all surfaces updated.

// WHY support.meta.com ADOPTED IT:
//   The help center team rebuilt their site and needed components.
//   They could: (a) build from scratch, or (b) use the design system.
//   Option (b): same components, same accessibility, same tokens.
//   They adopted it and saved ~6 weeks of component development.

// WHY developer.oculus.com ADOPTED IT:
//   Launched a new site. Design system = 3-hour setup.
//   Without it: months of component work.
//   The barrier to adoption was deliberately kept low:
//   npm install @oculus/design-system → use components → done.

// WHY ADOPTION MATTERS FOR INTERVIEWS:
//   "Used across most Oculus web surfaces" = engineers chose it,
//   not because they were told to, but because it was better
//   than the alternative. That is the best kind of adoption.

// THE CONSISTENCY PAYOFF:
//   Oculus brand redesign (2023): 1 PR to the design system.
//   All 7 surfaces updated automatically on next deploy.
//   Without the design system: 7 separate PRs, coordination nightmare,
//   inevitable inconsistencies during the transition period.`} />
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default OculusMetaDemo;
