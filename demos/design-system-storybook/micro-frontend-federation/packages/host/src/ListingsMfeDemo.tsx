/**
 * ListingsMfeDemo.tsx
 *
 * Tech Lead / Architect — Listings Platform
 * Focus: Micro-Frontend Architectures, "Federation One" Framework, CSS Modules Refactor, 17-Team Adoption
 *
 * Achievements covered:
 *   1. Listings application UI & architecture across platforms
 *   2. "Federation One" micro-frontend custom module loading & shared runtimes
 *   3. Resolving styling conflicts using CSS Modules (Scoped CSS hashes)
 *   4. Team alignment & federated module versioning across 17 engineering teams
 *
 * TABS:
 *   🏠 Listings Catalog — Interactive marketplace/real-estate catalog with responsive cards and fast filtering
 *   🔌 Federation One   — Dynamic module loader visualization showcasing lazy-loaded MFEs and shared singleton scopes
 *   🎨 CSS Modules Scope— Interactive visual comparison showing Global CSS style bleed (conflict) vs CSS Modules protection
 *   🤝 17-Team Rollout  — Interactive dashboard tracking migration milestones, bundle sizes, and version pinning logs
 */

import React, { useState, useEffect } from "react";

// Style tokens
const LF = {
  bg: "#0A0D14",
  surface: "#111524",
  surface2: "#191F35",
  border: "#242E47",
  text: "#A0B5E8",
  textBright: "#FFFFFF",
  textMuted: "#57678F",
  listingsGold: "#F5B041",
  listingsTeal: "#48C9B0",
  green: "#2EB67D",
  red: "#E01E5A",
  mono: "'JetBrains Mono', 'Fira Code', monospace",
};

interface ListingItem {
  id: string;
  title: string;
  price: string;
  location: string;
  category: "Home" | "Apparel" | "Electronics";
  image: string;
}

const MOCK_LISTINGS: ListingItem[] = [
  { id: "1", title: "Modern 2-Bedroom Condo", price: "$450,000", location: "San Francisco, CA", category: "Home", image: "🏢" },
  { id: "2", title: "Vintage Leather Jacket", price: "$280", location: "Seattle, WA", category: "Apparel", image: "🧥" },
  { id: "3", title: "Ultra-wide 4K Monitor", price: "$650", location: "Austin, TX", category: "Electronics", image: "🖥️" },
  { id: "4", title: "Cozy Beachfront Cottage", price: "$850,000", location: "Miami, FL", category: "Home", image: "🏖️" },
  { id: "5", title: "Noise-Cancelling Headphones", price: "$350", location: "New York, NY", category: "Electronics", image: "🎧" },
];

export function ListingsMfeDemo() {
  const [tab, setTab] = useState<"catalog" | "fedone" | "cssmodules" | "rollout">("catalog");

  // ── Listings Catalog States ──
  const [filterCategory, setFilterCategory] = useState<"All" | "Home" | "Apparel" | "Electronics">("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [favorites, setFavorites] = useState<string[]>([]);

  const toggleFavorite = (id: string) => {
    setFavorites(prev => 
      prev.includes(id) ? prev.filter(fId => fId !== id) : [...prev, id]
    );
  };

  const filteredListings = MOCK_LISTINGS.filter(item => {
    const matchesCategory = filterCategory === "All" || item.category === filterCategory;
    const matchesSearch = item.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          item.location.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  // ── Federation One States ──
  const [activeRemotes, setActiveRemotes] = useState<Record<string, { loaded: boolean; status: "unloaded" | "loading" | "ready" }>>({
    "listings-core": { loaded: true, status: "ready" },
    "listings-search": { loaded: false, status: "unloaded" },
    "listings-reviews": { loaded: false, status: "unloaded" },
    "listings-booking": { loaded: false, status: "unloaded" },
  });

  const loadRemoteModule = (key: string) => {
    if (activeRemotes[key]?.status !== "unloaded") return;
    
    // Trigger loading state
    setActiveRemotes(prev => ({
      ...prev,
      [key]: { loaded: false, status: "loading" }
    }));

    setTimeout(() => {
      setActiveRemotes(prev => ({
        ...prev,
        [key]: { loaded: true, status: "ready" }
      }));
    }, 1200);
  };

  const unloadRemoteModule = (key: string) => {
    setActiveRemotes(prev => ({
      ...prev,
      [key]: { loaded: false, status: "unloaded" }
    }));
  };

  // ── CSS Modules States ──
  const [cssMode, setCssMode] = useState<"global" | "scoped">("scoped");

  return (
    <div style={{ background: LF.bg, color: LF.text, fontFamily: "'Inter', system-ui, sans-serif", minHeight: "100vh", padding: 24 }}>

      {/* Header */}
      <div style={{ marginBottom: 18 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
          <div style={{ width: 42, height: 42, borderRadius: 10, background: `linear-gradient(135deg, ${LF.listingsGold}, ${LF.listingsTeal})`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22 }}>🏡</div>
          <div>
            <h1 style={{ margin: 0, fontSize: 20, fontWeight: 900, color: LF.textBright, letterSpacing: "-0.02em" }}>Listings Platform Architecture — Tech Lead</h1>
            <p style={{ margin: 0, fontSize: 11, color: LF.textMuted }}>Federation One MFE Framework · 17 Engineering Teams · CSS Modules Migration · Listings Catalog Platforms</p>
          </div>
        </div>

        {/* Core Stats */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8 }}>
          {[
            { v: "17 Teams", l: "Unified under Federation One", c: LF.listingsGold, sub: "Zero-dependency child builds" },
            { v: "Federation One", l: "MFE Loader Engine", c: LF.listingsTeal, sub: "Dynamic remote imports" },
            { v: "-48% CSS Weight", l: "Pruned Global Style Sheets", c: LF.green, sub: "Zero style bleed via hashes" },
            { v: "0ms Boot", l: "Shared Singleton Cache", c: LF.textBright, sub: "React, Lodash shared runtimes" },
          ].map(m => (
            <div key={m.l} style={{ background: LF.surface, border: `1px solid ${LF.border}`, borderLeft: `3px solid ${m.c}`, borderRadius: 8, padding: "8px 12px" }}>
              <div style={{ fontSize: 13, fontWeight: 900, color: m.c }}>{m.v}</div>
              <div style={{ fontSize: 8, fontWeight: 700, color: LF.textBright }}>{m.l}</div>
              <div style={{ fontSize: 7, color: LF.textMuted, marginTop: 2 }}>{m.sub}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Tab bar */}
      <div style={{ display: "flex", gap: 4, marginBottom: 18, borderBottom: `1px solid ${LF.border}`, paddingBottom: 4 }}>
        {[
          { id: "catalog" as const, label: "🏠 Listings Catalog" },
          { id: "fedone" as const, label: "🔌 Federation One Core" },
          { id: "cssmodules" as const, label: "🎨 CSS Modules vs Global" },
          { id: "rollout" as const, label: "🤝 17-Team Adoption" },
        ].map(tb => (
          <button key={tb.id} onClick={() => setTab(tb.id)} style={{ background: tab === tb.id ? LF.surface2 : "transparent", color: tab === tb.id ? LF.textBright : LF.textMuted, border: tab === tb.id ? `1px solid ${LF.border}` : "1px solid transparent", borderRadius: "8px 8px 0 0", padding: "8px 20px", cursor: "pointer", fontSize: 11, fontWeight: 600 }}>{tb.label}</button>
        ))}
      </div>

      {/* ── LISTINGS CATALOG ── */}
      {tab === "catalog" && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
          {/* Interactive Catalog Screen */}
          <div>
            <div style={{ fontSize: 10, fontWeight: 700, color: LF.textMuted, marginBottom: 8, letterSpacing: "0.08em" }}>INTERACTIVE MARKETPLACE CATALOG</div>
            <div style={{ background: LF.surface, border: `1px solid ${LF.border}`, borderRadius: 10, padding: 16, height: 460, display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
              
              {/* Filter controls */}
              <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
                <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Search location or title..." style={{ flex: 1, background: "#06080C", border: `1px solid ${LF.border}`, borderRadius: 6, padding: "5px 10px", fontSize: 9.5, color: LF.textBright, outline: "none" }} />
                
                <div style={{ display: "flex", gap: 3 }}>
                  {(["All", "Home", "Apparel", "Electronics"] as const).map(cat => (
                    <button key={cat} onClick={() => setFilterCategory(cat)} style={{ fontSize: 8.5, background: filterCategory === cat ? `${LF.listingsGold}20` : LF.surface2, border: `1px solid ${filterCategory === cat ? LF.listingsGold : "transparent"}`, color: filterCategory === cat ? LF.textBright : LF.textMuted, borderRadius: 5, padding: "4px 8px", cursor: "pointer" }}>{cat}</button>
                  ))}
                </div>
              </div>

              {/* Items List */}
              <div style={{ flex: 1, overflowY: "auto", paddingRight: 4, marginBottom: 12 }}>
                {filteredListings.length === 0 ? (
                  <div style={{ textAlign: "center", padding: 40, color: LF.textMuted, fontSize: 10 }}>No items match your criteria.</div>
                ) : (
                  filteredListings.map(item => (
                    <div key={item.id} style={{ background: LF.surface2, border: `1px solid ${LF.border}`, padding: 8, borderRadius: 8, display: "flex", gap: 10, alignItems: "center", marginBottom: 6 }}>
                      <div style={{ fontSize: 24, background: LF.surface, width: 40, height: 40, borderRadius: 6, display: "flex", alignItems: "center", justifyContent: "center" }}>{item.image}</div>
                      
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          <span style={{ fontSize: 9.5, fontWeight: 700, color: LF.textBright, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{item.title}</span>
                          <span style={{ fontSize: 9.5, fontWeight: 900, color: LF.listingsGold }}>{item.price}</span>
                        </div>
                        <div style={{ fontSize: 8, color: LF.textMuted, marginTop: 2 }}>{item.location} · {item.category}</div>
                      </div>

                      <button onClick={() => toggleFavorite(item.id)} style={{ background: "transparent", border: "none", cursor: "pointer", fontSize: 14 }}>
                        {favorites.includes(item.id) ? "★" : "☆"}
                      </button>
                    </div>
                  ))
                )}
              </div>

              <div style={{ borderTop: `1px solid ${LF.border}`, paddingTop: 8, display: "flex", justifyContent: "space-between", fontSize: 8, color: LF.textMuted }}>
                <span>Showing {filteredListings.length} listings</span>
                <span>{favorites.length} favorited items</span>
              </div>

            </div>
          </div>

          <div>
            <div style={{ fontSize: 10, fontWeight: 700, color: LF.textMuted, marginBottom: 8, letterSpacing: "0.08em" }}>IMPLEMENTATION DEPTH</div>
            <CodeBox color={LF.listingsGold} label="Listings rendering node structure configuration" code={
`// React component structure for listings catalog layout
// Optimised for cross-platform layout rendering using flex grids

interface ListingProps {
  id: string;
  title: string;
  price: string;
  location: string;
  image: string;
  isFavorited: boolean;
  onToggleFavorite: () => void;
}

export function ListingCard({
  title, price, location, image, isFavorited, onToggleFavorite
}: ListingProps) {
  return (
    <article style={styles.card}>
      <div style={styles.imageWrap}>
        <span style={styles.emojiIcon}>{image}</span>
      </div>
      <div style={styles.details}>
        <div style={styles.headerRow}>
          <h3 style={styles.titleText}>{title}</h3>
          <span style={styles.priceText}>{price}</span>
        </div>
        <div style={styles.metaRow}>
          <span style={styles.locationText}>{location}</span>
          <button style={styles.favButton} onClick={onToggleFavorite}>
            {isFavorited ? '★' : '☆'}
          </button>
        </div>
      </div>
    </article>
  );
}

// Visual performance indicators:
// - CSS layout rendering p95: 12ms.
// - Card elements lazy load on scroll via Intersection Observer hooks.`} />
          </div>
        </div>
      )}

      {/* ── FEDERATION ONE CORE ── */}
      {tab === "fedone" && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
          {/* Dynamic Module Loader Visualizer */}
          <div>
            <div style={{ fontSize: 10, fontWeight: 700, color: LF.textMuted, marginBottom: 8, letterSpacing: "0.08em" }}>FEDERATION ONE MODULE CONTROLLER</div>

            <div style={{ background: LF.surface, border: `1px solid ${LF.border}`, borderRadius: 10, padding: 16, height: 460, display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                  <div>
                    <span style={{ fontSize: 11, fontWeight: 700, color: LF.textBright, display: "block" }}>Remote micro-frontend loader</span>
                    <span style={{ fontSize: 7, color: LF.textMuted, display: "block", marginTop: 2 }}>Dynamically injects javascript bundles from independent teams</span>
                  </div>
                </div>

                {/* MFE loading grids */}
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  {Object.entries(activeRemotes).map(([key, value]) => (
                    <div key={key} style={{ background: LF.surface2, border: `1px solid ${LF.border}`, padding: 10, borderRadius: 8, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <div>
                        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                          <span style={{ fontSize: 9, fontWeight: 700, color: LF.textBright }}>{key}</span>
                          <span style={{ fontSize: 7, padding: "1px 4px", borderRadius: 3, background: value.status === "ready" ? `${LF.green}20` : value.status === "loading" ? `${LF.listingsGold}20` : `${LF.textMuted}20`, color: value.status === "ready" ? LF.green : value.status === "loading" ? LF.listingsGold : LF.textMuted, fontWeight: 700 }}>
                            {value.status.toUpperCase()}
                          </span>
                        </div>
                        <div style={{ fontSize: 7.5, color: LF.textMuted, marginTop: 4 }}>
                          {key === "listings-core" ? "Shared singletons loaded: React, react-dom" : "Imports dependencies from host runtime core"}
                        </div>
                      </div>

                      <div style={{ display: "flex", gap: 4 }}>
                        {value.status === "unloaded" && (
                          <button onClick={() => loadRemoteModule(key)} style={{ background: LF.listingsTeal, color: "#000", border: "none", borderRadius: 5, padding: "4px 10px", fontSize: 8.5, fontWeight: 700, cursor: "pointer" }}>Load MFE</button>
                        )}
                        {value.status === "ready" && key !== "listings-core" && (
                          <button onClick={() => unloadRemoteModule(key)} style={{ background: "transparent", border: `1px solid ${LF.red}`, color: LF.red, borderRadius: 5, padding: "4px 10px", fontSize: 8.5, cursor: "pointer" }}>Unload</button>
                        )}
                        {value.status === "loading" && (
                          <span style={{ fontSize: 8, color: LF.listingsGold }}>fetching chunks...</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Shared dependency singleton metrics */}
              <div style={{ background: "#06080C", borderRadius: 8, padding: 8, border: `1px solid ${LF.border}` }}>
                <div style={{ fontSize: 8, fontWeight: 700, color: LF.textMuted, marginBottom: 6 }}>SHARED DEPENDENCY SINGLETON METRICS (Active Cache)</div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 6 }}>
                  {[
                    { name: "react", size: "45 KB", sharedBy: "4 MFEs" },
                    { name: "react-dom", size: "120 KB", sharedBy: "4 MFEs" },
                    { name: "lodash-es", size: "24 KB", sharedBy: "2 MFEs" },
                  ].map((dep, idx) => (
                    <div key={idx} style={{ background: LF.surface, padding: 6, borderRadius: 5, borderLeft: `2px solid ${LF.listingsTeal}` }}>
                      <div style={{ fontSize: 8.5, fontWeight: 700, color: LF.textBright }}>{dep.name}</div>
                      <div style={{ fontSize: 7, color: LF.textMuted, marginTop: 2 }}>{dep.size} · {dep.sharedBy}</div>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          </div>

          <div>
            <div style={{ fontSize: 10, fontWeight: 700, color: LF.textMuted, marginBottom: 8, letterSpacing: "0.08em" }}>IMPLEMENTATION DEPTH</div>
            <CodeBox color={LF.listingsTeal} label="Federation One custom Webpack module federation logic" code={
`// webpack.config.js - Listings host configuration (Federation One)
// Dynamically loads remote component assets while caching singletons

const ModuleFederationPlugin = require('webpack/lib/container/ModuleFederationPlugin');

module.exports = {
  plugins: [
    new ModuleFederationPlugin({
      name: 'listingsHost',
      filename: 'remoteEntry.js',
      // Declare external entry points (fallback to production paths)
      remotes: {
        listingsCore:    'listingsCore@https://cdn.listings.slack.com/core/remoteEntry.js',
        listingsSearch:  'listingsSearch@https://cdn.listings.slack.com/search/remoteEntry.js',
        listingsReviews: 'listingsReviews@https://cdn.listings.slack.com/reviews/remoteEntry.js',
      },
      // Shared libraries resolved as singletons to prevent multiple instance loads
      shared: {
        react: {
          singleton: true,
          requiredVersion: '^18.2.0',
          eager: true, // Force bundle on initialization to reduce runtime block
        },
        'react-dom': {
          singleton: true,
          requiredVersion: '^18.2.0',
          eager: true,
        },
        '@shared/utils': {
          singleton: true,
          requiredVersion: '1.x.x',
        }
      }
    })
  ]
};

// Runtime benefit verified:
// - Eliminates script duplicates: Uniswap card doesn't download React a second time.
// - Resolves runtime namespace collisions by strict semver matching in shared scopes.`} />
          </div>
        </div>
      )}

      {/* ── CSS MODULES VS GLOBAL ── */}
      {tab === "cssmodules" && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
          {/* Visual Collisions Simulator */}
          <div>
            <div style={{ fontSize: 10, fontWeight: 700, color: LF.textMuted, marginBottom: 8, letterSpacing: "0.08em" }}>STYLING COLLISION SIMULATOR</div>

            <div style={{ background: LF.surface, border: `1px solid ${LF.border}`, borderRadius: 10, padding: 16, height: 460, display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                  <div>
                    <span style={{ fontSize: 11, fontWeight: 700, color: LF.textBright, display: "block" }}>Style Bleeding Demo</span>
                    <span style={{ fontSize: 7, color: LF.textMuted, display: "block", marginTop: 2 }}>Contrast global CSS class bleed vs scoped CSS Modules hashes</span>
                  </div>
                  <div style={{ display: "flex", gap: 4, background: "#06080C", padding: 2, borderRadius: 6, border: `1px solid ${LF.border}` }}>
                    <button onClick={() => setCssMode("global")} style={{ background: cssMode === "global" ? LF.surface : "transparent", border: "none", cursor: "pointer", color: cssMode === "global" ? LF.red : LF.textMuted, fontSize: 8, fontWeight: 700, padding: "4px 8px", borderRadius: 4 }}>Global SASS</button>
                    <button onClick={() => setCssMode("scoped")} style={{ background: cssMode === "scoped" ? LF.surface : "transparent", border: "none", cursor: "pointer", color: cssMode === "scoped" ? LF.green : LF.textMuted, fontSize: 8, fontWeight: 700, padding: "4px 8px", borderRadius: 4 }}>CSS Modules</button>
                  </div>
                </div>

                {/* Simulation Screen */}
                <div style={{ background: "#06080C", border: `1px solid ${LF.border}`, borderRadius: 8, padding: 16, height: 180, position: "relative" }}>
                  <div style={{ fontSize: 8, color: LF.textMuted, position: "absolute", top: 8, left: 10 }}>Rendered Workspace</div>
                  
                  {/* Visual components simulation */}
                  <div style={{ display: "flex", gap: 10, height: "100%", alignItems: "center", justifyContent: "center" }}>
                    
                    {/* Component A: Listing Card (Gold header) */}
                    <div style={{
                      background: LF.surface,
                      border: `1px solid ${LF.border}`,
                      borderRadius: 8,
                      width: 110,
                      padding: 8,
                      boxShadow: "0 4px 8px rgba(0,0,0,0.3)"
                    }}>
                      <div style={{
                        fontSize: 9,
                        fontWeight: "bold",
                        // Global mode: Component B overrides title colors!
                        color: cssMode === "global" ? LF.red : LF.listingsGold,
                        marginBottom: 4
                      }}>
                        ListingCard
                      </div>
                      <div style={{ fontSize: 7, color: LF.textMuted }}>$450,000</div>
                    </div>

                    {/* Component B: Reviews Card (Red title) */}
                    <div style={{
                      background: LF.surface,
                      border: `1px solid ${LF.border}`,
                      borderRadius: 8,
                      width: 110,
                      padding: 8,
                      boxShadow: "0 4px 8px rgba(0,0,0,0.3)"
                    }}>
                      <div style={{
                        fontSize: 9,
                        fontWeight: "bold",
                        color: LF.red,
                        marginBottom: 4
                      }}>
                        ReviewItem
                      </div>
                      <div style={{ fontSize: 7, color: LF.textMuted }}>"Great location!"</div>
                    </div>

                  </div>
                </div>

                {/* Explanation text */}
                <div style={{ marginTop: 12, fontSize: 8.5, color: LF.text, lineHeight: 1.5 }}>
                  {cssMode === "global" ? (
                    <span style={{ color: LF.red }}>
                      <strong>❌ STYLE BLEED:</strong> Both components used class name <code>.title</code> in global SASS files. Since ReviewItem was loaded last, its class rule <code>{`color: ${LF.red}`}</code> overwrote ListingCard's style! This visual regression broke listings layouts across product domains.
                    </span>
                  ) : (
                    <span style={{ color: LF.green }}>
                      <strong>✔ SOLVED:</strong> By migrating to CSS Modules, classes compile to unique hashes: <code>.ListingCard_title__7e3ab</code> and <code>.ReviewItem_title__9a2bc</code>. Styles can never bleed between modules, ensuring visual reliability.
                    </span>
                  )}
                </div>
              </div>

              {/* Refactor Metrics */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6, borderTop: `1px solid ${LF.border}`, paddingTop: 10 }}>
                <div>
                  <span style={{ fontSize: 7.5, color: LF.textMuted }}>Visual Regressions/Sprint</span>
                  <div style={{ fontSize: 11, fontWeight: 900, color: cssMode === "global" ? LF.red : LF.green, marginTop: 2 }}>
                    {cssMode === "global" ? "14 average" : "0 incidents"}
                  </div>
                </div>
                <div>
                  <span style={{ fontSize: 7.5, color: LF.textMuted }}>Webpack Bundle Weight</span>
                  <div style={{ fontSize: 11, fontWeight: 900, color: LF.green, marginTop: 2 }}>-48% SASS pruned</div>
                </div>
              </div>

            </div>
          </div>

          <div>
            <div style={{ fontSize: 10, fontWeight: 700, color: LF.textMuted, marginBottom: 8, letterSpacing: "0.08em" }}>IMPLEMENTATION DEPTH</div>
            <CodeBox color={LF.listingsTeal} label="CSS Modules setup and hash resolver details" code={
`// CSS MODULES MIGRATION PATH:
// Eliminating SASS import cascades in micro-frontend environments

// 1. ListingsCard.module.css
.card {
  border: 1px solid var(--border-color);
  border-radius: 8px;
  background: var(--surface-color);
}
.title {
  font-size: 14px;
  color: var(--listings-gold); /* listings page theme */
}

// ──────────────────────────────────────────────────────────

// 2. React consumer:
import styles from './ListingsCard.module.css';

export function ListingsCard({ title }) {
  // Styles translates to: styles.card = "ListingsCard_card__3a1e9"
  //                     styles.title = "ListingsCard_title__7e3ab"
  return (
    <div className={styles.card}>
      <h3 className={styles.title}>{title}</h3>
    </div>
  );
}

// ──────────────────────────────────────────────────────────

// 3. Webpack loader resolution configuration (css-loader):
// In the Webpack configuration files, we parse css modules like:
// {
//   test: /\\.css$/,
//   use: [
//     'style-loader',
//     {
//       loader: 'css-loader',
//       options: {
//         modules: {
//           // Output scoped CSS selector name pattern:
//           localIdentName: '[name]__[local]___[hash:base64:5]'
//         }
//       }
//     }
//   ]
// }`} />
          </div>
        </div>
      )}

      {/* ── 17-TEAM ROLLOUT ── */}
      {tab === "rollout" && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
          {/* Adoption Tracker */}
          <div>
            <div style={{ fontSize: 10, fontWeight: 700, color: LF.textMuted, marginBottom: 8, letterSpacing: "0.08em" }}>17-TEAM ADOPTION PROGRESS</div>

            <div style={{ background: LF.surface, border: `1px solid ${LF.border}`, borderRadius: 10, padding: 16, height: 460, display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
              <div>
                <span style={{ fontSize: 11, fontWeight: 700, color: LF.textBright, display: "block", marginBottom: 12 }}>Adoption Milestones & Metrics</span>
                
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {[
                    { team: "Discovery Team", mfe: "listings-core", status: "GA Complete", w: "100%", color: LF.green },
                    { team: "Search & Match", mfe: "listings-search", status: "GA Complete", w: "100%", color: LF.green },
                    { team: "Ratings & Reviews", mfe: "listings-reviews", status: "GA Complete", w: "100%", color: LF.green },
                    { team: "Booking & checkout", mfe: "listings-booking", status: "GA Migrated (90%)", w: "90%", color: LF.listingsTeal },
                    { team: "Seller Console", mfe: "listings-seller", status: "Beta Test (45%)", w: "45%", color: LF.listingsGold },
                    { team: "Promotions & Ads", mfe: "listings-ads", status: "Scheduled", w: "0%", color: LF.textMuted },
                  ].map((t, idx) => (
                    <div key={idx} style={{ background: LF.surface2, padding: 6, borderRadius: 6 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 8, marginBottom: 3 }}>
                        <span style={{ color: LF.textBright, fontWeight: 700 }}>{t.team} · <code>{t.mfe}</code></span>
                        <span style={{ color: t.color, fontWeight: 700 }}>{t.status}</span>
                      </div>
                      <div style={{ height: 4, background: "#06080C", borderRadius: 2, overflow: "hidden" }}>
                        <div style={{ width: t.w, height: "100%", background: t.color }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Shared runtime governance */}
              <div style={{ background: LF.surface2, border: `1px solid ${LF.border}`, borderRadius: 8, padding: 10, fontSize: 8.5 }}>
                <span style={{ fontWeight: 700, color: LF.listingsGold, display: "block", marginBottom: 4 }}>Federated Runtime Governance:</span>
                <span style={{ color: LF.text, lineHeight: 1.5 }}>
                  Wrote semantic version lock checks in the CI pipelines of all 17 teams. If a team tries to ship a build with duplicate singleton instances (e.g. including an isolated copy of React), the build is blocked automatically, maintaining performance sanity.
                </span>
              </div>

            </div>
          </div>

          <div>
            <div style={{ fontSize: 10, fontWeight: 700, color: LF.textMuted, marginBottom: 8, letterSpacing: "0.08em" }}>IMPLEMENTATION DEPTH</div>
            <CodeBox color={LF.listingsGold} label="Federated validation check in CI workflow pipelines" code={
`// scripts/validate-shared-scope.ts
// Verifies module federation shared packages to prevent duplication debt

import * as fs from 'fs';

interface WebpackConfig {
  plugins?: Array<{
    _opts?: {
      shared?: Record<string, { singleton?: boolean }>;
    };
  }>;
}

export function validateSharedConfigs(filePath: string) {
  console.log("Analyzing webpack config for runtime duplicates...");

  const configContent = fs.readFileSync(filePath, 'utf8');
  
  // 1. Scan for singleton configurations in package structures
  const requiredLibraries = ['react', 'react-dom'];
  
  requiredLibraries.forEach(lib => {
    const pattern = new RegExp(\`['"]\${lib}['"]\\s*:\\s*{\\s*[^}]*singleton\\s*:\\s*true\`);
    const isSingleton = pattern.test(configContent);

    if (!isSingleton) {
      console.error(\`❌ Build Error: Shared package "\${lib}" must be declared as a singleton!\`);
      console.error("Duplicate react instances crash state domains in micro-frontend environments.");
      process.exit(1); // Fail build
    }
  });

  console.log("✔ Validation passed. No shared package duplications detected.");
}`} />
          </div>
        </div>
      )}
    </div>
  );
}
