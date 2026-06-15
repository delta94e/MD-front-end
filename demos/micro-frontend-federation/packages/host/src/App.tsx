// =============================================================
// HOST / SHELL Application
// =============================================================
// Platform team owns this
// Orchestrates remotes via Module Federation
// Handles routing, auth, error boundaries, layout
//
// STATE SHARING DEMO:
// - Host manages userStore (login/logout, theme, locale)
// - Products MFE reads userStore, writes to cartStore
// - Cart MFE reads cartStore
// - Events tab shows eventLogStore (written by all MFEs)
// - State Debug tab shows real-time store state
// =============================================================

import React, { Suspense, useState, useEffect } from "react";
import { tokens, MfeLabel, Button } from "@mfe-demo/shared-ui";
import {
  useCart, useUser, useStore,
  cartStore, userStore, eventLogStore,
  cartActions, userActions, logEvent,
  eventBus, useEventBus, useEventLog,
  type MFEEventMap,
} from "@mfe-demo/shared-ui/store";
import ErrorBoundary from "./ErrorBoundary";
import WarStoriesView from "./WarStoriesView";
import { CodeModernizationDemo } from "./CodeModernizationDemo";
import { E2EEncryptionDemo } from "./E2EEncryptionDemo";
import { ArchitectureReviewDemo } from "./ArchitectureReviewDemo";
import { OfflineAndStickerDemo } from "./OfflineAndStickerDemo";
import { AccessibleCalendarDemo } from "./AccessibleCalendarDemo";
import { SkipLinkDemo } from "./SkipLinkDemo";
import { ColumnConfigDemo } from "./ColumnConfigDemo";
import { OrgChartDemo } from "./OrgChartDemo";
import { StorybookDemo } from "./StorybookDemo";
import { CalendarTalksDemo } from "./CalendarTalksDemo";
import { A11yTrainingDemo } from "./A11yTrainingDemo";
import { LLMObservabilityDemo } from "./LLMObservabilityDemo";
import { CaseManagementDemo } from "./CaseManagementDemo";
import { CoreProductDemo } from "./CoreProductDemo";
import { EngineeringPracticesDemo } from "./EngineeringPracticesDemo";
import { ExperimentationDemo } from "./ExperimentationDemo";
import { GraphQLMigrationDemo } from "./GraphQLMigrationDemo";
import { AnsaradaWorkflowDemo } from "./AnsaradaWorkflowDemo";
import { PathwaysMarketplaceDemo } from "./PathwaysMarketplaceDemo";
import { AnsaradaCoreTeamDemo } from "./AnsaradaCoreTeamDemo";
import { AdsFEInfraDemo } from "./AdsFEInfraDemo";
import { FacebookEngineeringDemo } from "./FacebookEngineeringDemo";
import { BuildSystemDemo } from "./BuildSystemDemo";
import { FileBrowserPerfDemo } from "./FileBrowserPerfDemo";
import { MetaEngineeringDemo } from "./MetaEngineeringDemo";

// ✅ Lazy load remotes — only downloaded when rendered
const RemoteProductList = React.lazy(() => import("remoteProducts/ProductList"));
const RemoteCartButton = React.lazy(() => import("remoteCart/CartButton"));

// ---- Skeleton Components ----
const ProductsSkeleton = () => (
  <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "16px" }}>
    {[1, 2, 3].map((i) => (
      <div key={i} style={{ height: "280px", background: "#f1f5f9", borderRadius: "12px", animation: "pulse 1.5s infinite" }} />
    ))}
  </div>
);

const CartSkeleton = () => (
  <div style={{ width: "100px", height: "36px", background: "#f1f5f9", borderRadius: "8px" }} />
);

type TabKey = "demo" | "architecture" | "state" | "eventbus" | "warstories" | "events" | "modernization" | "e2e-encryption" | "arch-review" | "offline-sticker" | "a11y-calendar" | "skip-link" | "col-config" | "org-chart" | "storybook" | "cal-talks" | "a11y-training" | "llm-observability" | "case-mgmt" | "core-product" | "eng-practices" | "experimentation" | "graphql-migration" | "ansarada-workflow" | "pathways" | "ansarada-core" | "ads-infra" | "facebook" | "build-system" | "file-browser" | "meta";

// ---- Main App ----
export default function App() {
  const [activeTab, setActiveTab] = useState<TabKey>("demo");

  return (
    <div style={{ fontFamily: "'Inter', -apple-system, sans-serif", background: tokens.colors.background, minHeight: "100vh" }}>
      {/* ===== GLOBAL INLINE STYLES ===== */}
      <style>{`
        code, kbd, samp {
          font-family: 'JetBrains Mono', 'Fira Code', 'Cascadia Code', ui-monospace, monospace;
          font-size: 0.82em;
          background: #1e293b;
          color: #7dd3fc;
          border: 1px solid #334155;
          border-radius: 5px;
          padding: 1px 6px;
          white-space: nowrap;
        }
        pre code, pre kbd, pre samp {
          background: transparent;
          border: none;
          padding: 0;
          font-size: inherit;
          color: inherit;
          white-space: inherit;
        }
      `}</style>
      {/* ===== HEADER (Host-owned) ===== */}
      <header style={{
        background: tokens.colors.surface,
        borderBottom: `1px solid ${tokens.colors.border}`,
        padding: "0 24px",
        position: "sticky",
        top: 0,
        zIndex: 50,
      }}>
        <div style={{ maxWidth: "1400px", margin: "0 auto", display: "flex", justifyContent: "space-between", alignItems: "center", height: "56px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <span style={{ fontSize: "24px" }}>🧩</span>
            <h1 style={{ fontSize: tokens.fontSize.lg, fontWeight: 700, margin: 0, color: tokens.colors.text }}>
              Micro-Frontend Demo
            </h1>
            <MfeLabel name="host" port={3000} color="#6366f1" />
          </div>

          {/* Cart Button — from Remote MFE */}
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <ErrorBoundary remoteName="cart" fallback={<span style={{ color: tokens.colors.textMuted }}>Cart unavailable</span>}>
              <Suspense fallback={<CartSkeleton />}>
                <RemoteCartButton />
              </Suspense>
            </ErrorBoundary>
          </div>
        </div>
      </header>

      {/* ===== BODY: SIDEBAR + CONTENT ===== */}
      <div style={{ maxWidth: "1400px", margin: "0 auto", display: "flex", minHeight: "calc(100vh - 56px)" }}>

        {/* ── Grouped vertical sidebar ── */}
        <nav
          aria-label="Demo sections"
          style={{
            width: 216,
            flexShrink: 0,
            background: tokens.colors.surface,
            borderRight: `1px solid ${tokens.colors.border}`,
            position: "sticky",
            top: 56,
            height: "calc(100vh - 56px)",
            overflowY: "auto",
            padding: "12px 0 24px",
          }}
        >
          {([
            {
              group: "Module Federation",
              items: [
                { key: "demo",         label: "🛒 Live Demo" },
                { key: "state",        label: "🔗 Shared Store" },
                { key: "eventbus",     label: "📡 Event Bus" },
                { key: "events",       label: "📋 Event Log" },
                { key: "architecture", label: "🏗️ Architecture" },
                { key: "warstories",   label: "🐛 War Stories" },
              ],
            },
            {
              group: "Engineering",
              items: [
                { key: "modernization",   label: "🔧 Modernization" },
                { key: "e2e-encryption",  label: "🔐 E2E Encryption" },
                { key: "arch-review",     label: "📐 Arch Review" },
                { key: "offline-sticker", label: "📡 Offline + Stickers" },
                { key: "storybook",       label: "📚 Storybook" },
                { key: "graphql-migration", label: "⚡ GraphQL Migration" },
              ],
            },
            {
              group: "Accessibility",
              items: [
                { key: "a11y-calendar", label: "♿ A11y Calendar" },
                { key: "skip-link",     label: "⤵ Skip Links" },
                { key: "col-config",    label: "⊞ Column Config" },
                { key: "a11y-training", label: "🎓 A11y Training" },
                { key: "cal-talks",     label: "🎤 Cal Talks" },
              ],
            },
            {
              group: "Product Features",
              items: [
                { key: "org-chart",         label: "🏢 Org Chart" },
                { key: "llm-observability", label: "🔭 LLM Traces" },
                { key: "case-mgmt",         label: "🗂 Cases" },
                { key: "core-product",      label: "🏗 Core Product" },
                { key: "eng-practices",     label: "⚙ Eng Practices" },
                { key: "experimentation",   label: "🧪 A/B Testing" },
                { key: "ansarada-workflow", label: "📋 Ansarada Workflow" },
                { key: "pathways",          label: "🏪 Pathways MFE" },
                { key: "ansarada-core",     label: "🏢 Ansarada Core" },
                { key: "ads-infra",         label: "📡 Ads Infra" },
                { key: "facebook",          label: "👤 Facebook Eng" },
                { key: "build-system",      label: "⚡ Build System" },
                { key: "file-browser",      label: "📂 File Browser" },
                { key: "meta",              label: "🔵 Meta" },
              ],
            },
          ] as { group: string; items: { key: string; label: string }[] }[]).map(({ group, items }) => (
            <div key={group}>
              <div style={{
                padding: "12px 14px 4px",
                fontSize: "9px",
                fontWeight: 700,
                letterSpacing: "0.1em",
                color: tokens.colors.textMuted,
                textTransform: "uppercase",
                userSelect: "none",
              }}>
                {group}
              </div>
              {items.map(tab => {
                const isActive = activeTab === tab.key;
                return (
                  <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key as TabKey)}
                    style={{
                      display: "block",
                      width: "100%",
                      textAlign: "left",
                      padding: "6px 14px 6px 18px",
                      background: isActive ? `${tokens.colors.primary}14` : "transparent",
                      border: "none",
                      borderLeft: `3px solid ${isActive ? tokens.colors.primary : "transparent"}`,
                      cursor: "pointer",
                      fontSize: "12.5px",
                      fontWeight: isActive ? 600 : 400,
                      color: isActive ? tokens.colors.primary : tokens.colors.textMuted,
                      fontFamily: "inherit",
                      transition: "background 0.12s, color 0.12s",
                      lineHeight: 1.5,
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}
                  >
                    {tab.label}
                  </button>
                );
              })}
            </div>
          ))}
        </nav>

        {/* ── Main content area ── */}
        <main style={{ flex: 1, minWidth: 0, padding: "24px", overflowX: "auto" }}>
          {/* Info banner — only on demo tab */}
          {activeTab === "demo" && (
            <div style={{ background: "linear-gradient(135deg, #eef2ff, #e0e7ff)", borderRadius: "12px", border: `1px solid ${tokens.colors.border}`, padding: "20px 24px", marginBottom: "24px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "12px" }}>
                <span style={{ fontSize: "28px" }}>🏗️</span>
                <h2 style={{ fontSize: tokens.fontSize.xl, fontWeight: 700, margin: 0, color: tokens.colors.text }}>
                  Module Federation + Shared State
                </h2>
              </div>
              <p style={{ color: tokens.colors.textMuted, fontSize: tokens.fontSize.sm, margin: 0, lineHeight: 1.6, maxWidth: "680px" }}>
                This page is composed of <strong>3 independent applications</strong> sharing state via a <strong>singleton store</strong>.
                Products MFE writes to <code>cartStore</code> → Cart MFE subscribes and updates instantly.
              </p>
              <div style={{ display: "flex", gap: "12px", marginTop: "16px", flexWrap: "wrap" }}>
                {[
                  { label: "Host (Shell)",   port: 3000, color: "#6366f1", desc: "User state, theme, layout" },
                  { label: "Products MFE",   port: 3001, color: "#10b981", desc: "Reads userStore, writes cartStore" },
                  { label: "Cart MFE",       port: 3002, color: "#8b5cf6", desc: "Reads cartStore + userStore" },
                  { label: "Shared Store",   port: 0,    color: "#f59e0b", desc: "cartStore, userStore (singleton)" },
                ].map((item) => (
                  <div key={item.label} style={{ padding: "8px 14px", background: `${item.color}10`, border: `1px solid ${item.color}30`, borderRadius: tokens.borderRadius.md, fontSize: tokens.fontSize.xs }}>
                    <div style={{ fontWeight: 700, color: item.color }}>{item.label}</div>
                    <div style={{ color: tokens.colors.textMuted, marginTop: "2px" }}>{item.desc}</div>
                    {item.port > 0 && <div style={{ fontFamily: "monospace", color: tokens.colors.textMuted, marginTop: "2px" }}>localhost:{item.port}</div>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === "demo" && (
            <ErrorBoundary remoteName="products" fallback={
              <div style={{ textAlign: "center", padding: "60px 20px", background: "#fef2f2", borderRadius: "12px", border: "1px solid #fecaca" }}>
                <span style={{ fontSize: "48px" }}>⚠️</span>
                <h3 style={{ color: "#991b1b", marginTop: "12px" }}>Products MFE Unavailable</h3>
                <p style={{ color: "#b91c1c" }}>The Products remote (port 3001) is not responding.<br />This demonstrates <strong>graceful degradation</strong> — the rest of the app still works!</p>
              </div>
            }>
              <Suspense fallback={<ProductsSkeleton />}>
                <RemoteProductList />
              </Suspense>
            </ErrorBoundary>
          )}

          {activeTab === "state"             && <SharedStateView />}
          {activeTab === "eventbus"          && <EventBusView />}
          {activeTab === "warstories"        && <WarStoriesView />}
          {activeTab === "architecture"      && <ArchitectureView />}
          {activeTab === "events"            && <EventLogView />}
          {activeTab === "modernization"     && <CodeModernizationDemo />}
          {activeTab === "e2e-encryption"    && <E2EEncryptionDemo />}
          {activeTab === "arch-review"       && <ArchitectureReviewDemo />}
          {activeTab === "offline-sticker"   && <OfflineAndStickerDemo />}
          {activeTab === "a11y-calendar"     && <AccessibleCalendarDemo />}
          {activeTab === "skip-link"         && <SkipLinkDemo />}
          {activeTab === "col-config"        && <ColumnConfigDemo />}
          {activeTab === "org-chart"         && <OrgChartDemo />}
          {activeTab === "storybook"         && <StorybookDemo />}
          {activeTab === "cal-talks"         && <CalendarTalksDemo />}
          {activeTab === "a11y-training"     && <A11yTrainingDemo />}
          {activeTab === "llm-observability" && <LLMObservabilityDemo />}
          {activeTab === "case-mgmt"         && <CaseManagementDemo />}
          {activeTab === "core-product"      && <CoreProductDemo />}
          {activeTab === "eng-practices"     && <EngineeringPracticesDemo />}
          {activeTab === "experimentation"   && <ExperimentationDemo />}
          {activeTab === "graphql-migration" && <GraphQLMigrationDemo />}
          {activeTab === "ansarada-workflow" && <AnsaradaWorkflowDemo />}
          {activeTab === "pathways"          && <PathwaysMarketplaceDemo />}
          {activeTab === "ansarada-core"     && <AnsaradaCoreTeamDemo />}
          {activeTab === "ads-infra"         && <AdsFEInfraDemo />}
          {activeTab === "facebook"          && <FacebookEngineeringDemo />}
          {activeTab === "build-system"      && <BuildSystemDemo />}
          {activeTab === "file-browser"      && <FileBrowserPerfDemo />}
          {activeTab === "meta"              && <MetaEngineeringDemo />}
        </main>
      </div>
    </div>
  );
}

// ============================================================
// Shared State Tab — LIVE DEMO of cross-MFE state
// ============================================================
function SharedStateView() {
  const cartState = useCart();
  const userState = useUser();

  return (
    <div>
      <h2 style={{ fontSize: tokens.fontSize.xl, fontWeight: 700, marginBottom: "8px" }}>
        🔗 Shared State across MFEs
      </h2>
      <p style={{ color: tokens.colors.textMuted, marginBottom: "24px", fontSize: tokens.fontSize.sm, lineHeight: 1.6 }}>
        This panel shows the <strong>real-time state</strong> of all shared stores.
        Changes made in <strong>any MFE</strong> are reflected here instantly via <code>store.subscribe()</code>.
      </p>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
        {/* ---- User Store Panel ---- */}
        <div style={{
          background: tokens.colors.surface,
          border: `2px solid #6366f130`,
          borderRadius: tokens.borderRadius.lg,
          padding: tokens.spacing.lg,
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
            <h3 style={{ margin: 0, fontSize: tokens.fontSize.lg, fontWeight: 700, color: "#6366f1" }}>
              👤 userStore
            </h3>
            <span style={{ fontSize: tokens.fontSize.xs, color: tokens.colors.textMuted, fontFamily: "monospace" }}>
              Owner: Host (port 3000)
            </span>
          </div>

          {/* Controls */}
          <div style={{ display: "flex", gap: "8px", marginBottom: "16px", flexWrap: "wrap" }}>
            <Button
              size="sm"
              variant={userState.isLoggedIn ? "danger" : "primary"}
              onClick={() => {
                if (userState.isLoggedIn) {
                  userActions.logout();
                  logEvent("host", "user-logout", {});
                } else {
                  userActions.login({ name: "Trường Nguyễn", email: "truong@cake.vn", avatar: "👤" });
                  logEvent("host", "user-login", { name: "Trường Nguyễn" });
                }
              }}
            >
              {userState.isLoggedIn ? "Logout" : "Login"}
            </Button>
            <Button size="sm" variant="ghost" onClick={() => {
              userActions.toggleTheme();
              logEvent("host", "toggle-theme", { newTheme: userState.theme === "light" ? "dark" : "light" });
            }}>
              {userState.theme === "light" ? "🌙 Dark" : "☀️ Light"}
            </Button>
            <Button size="sm" variant="ghost" onClick={() => {
              const newLocale = userState.locale === "vi" ? "en" : "vi";
              userActions.setLocale(newLocale);
              logEvent("host", "set-locale", { locale: newLocale });
            }}>
              {userState.locale === "vi" ? "🇬🇧 EN" : "🇻🇳 VI"}
            </Button>
          </div>

          {/* State JSON */}
          <div style={{ background: "#1e293b", borderRadius: "8px", padding: "12px", overflow: "auto" }}>
            <pre style={{ color: "#e2e8f0", fontSize: "12px", lineHeight: 1.5, margin: 0 }}>
{JSON.stringify(userState, null, 2)}
            </pre>
          </div>

          {/* Explanation */}
          <div style={{ marginTop: "12px", fontSize: tokens.fontSize.xs, color: tokens.colors.textMuted, lineHeight: 1.5 }}>
            <strong>Who reads:</strong> Products MFE (greeting), Cart MFE (user name)<br />
            <strong>Who writes:</strong> Host only (login/logout/theme/locale)<br />
            <strong>Pattern:</strong> Host owns user state → remotes consume via <code>useUser()</code>
          </div>
        </div>

        {/* ---- Cart Store Panel ---- */}
        <div style={{
          background: tokens.colors.surface,
          border: `2px solid #8b5cf630`,
          borderRadius: tokens.borderRadius.lg,
          padding: tokens.spacing.lg,
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
            <h3 style={{ margin: 0, fontSize: tokens.fontSize.lg, fontWeight: 700, color: "#8b5cf6" }}>
              🛒 cartStore
            </h3>
            <span style={{ fontSize: tokens.fontSize.xs, color: tokens.colors.textMuted, fontFamily: "monospace" }}>
              Writer: Products MFE (port 3001)
            </span>
          </div>

          {/* Cart Summary */}
          <div style={{ display: "flex", gap: "12px", marginBottom: "16px" }}>
            <div style={{ flex: 1, padding: "10px", background: "#f5f3ff", borderRadius: "8px", textAlign: "center" }}>
              <div style={{ fontSize: tokens.fontSize["2xl"], fontWeight: 700, color: "#8b5cf6" }}>
                {cartState.items.length}
              </div>
              <div style={{ fontSize: tokens.fontSize.xs, color: tokens.colors.textMuted }}>Unique Items</div>
            </div>
            <div style={{ flex: 1, padding: "10px", background: "#f5f3ff", borderRadius: "8px", textAlign: "center" }}>
              <div style={{ fontSize: tokens.fontSize["2xl"], fontWeight: 700, color: "#8b5cf6" }}>
                {cartState.items.reduce((s: number, i: { quantity: number }) => s + i.quantity, 0)}
              </div>
              <div style={{ fontSize: tokens.fontSize.xs, color: tokens.colors.textMuted }}>Total Quantity</div>
            </div>
          </div>

          {/* Controls */}
          <div style={{ display: "flex", gap: "8px", marginBottom: "16px" }}>
            <Button size="sm" variant="danger" onClick={() => {
              cartActions.clearCart();
              logEvent("host", "clear-cart", {});
            }} disabled={cartState.items.length === 0}>
              Clear Cart
            </Button>
          </div>

          {/* State JSON */}
          <div style={{ background: "#1e293b", borderRadius: "8px", padding: "12px", overflow: "auto", maxHeight: "200px" }}>
            <pre style={{ color: "#e2e8f0", fontSize: "12px", lineHeight: 1.5, margin: 0 }}>
{JSON.stringify(cartState, null, 2)}
            </pre>
          </div>

          {/* Explanation */}
          <div style={{ marginTop: "12px", fontSize: tokens.fontSize.xs, color: tokens.colors.textMuted, lineHeight: 1.5 }}>
            <strong>Who reads:</strong> Cart MFE (popup), Host (this panel)<br />
            <strong>Who writes:</strong> Products MFE (<code>cartActions.addItem()</code>), Cart MFE (<code>removeItem</code>)<br />
            <strong>Pattern:</strong> Multiple writers, multiple readers via singleton store
          </div>
        </div>
      </div>

      {/* ---- How It Works Section ---- */}
      <div style={{
        marginTop: "24px",
        background: tokens.colors.surface,
        border: `1px solid ${tokens.colors.border}`,
        borderRadius: tokens.borderRadius.lg,
        padding: tokens.spacing.lg,
      }}>
        <h3 style={{ fontSize: tokens.fontSize.lg, fontWeight: 700, marginBottom: "16px", color: tokens.colors.text }}>
          📐 Có nên share state giữa MFEs? Khi nào? Bằng cách nào?
        </h3>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "16px", marginBottom: "24px" }}>
          {/* Option 1 */}
          <div style={{ padding: "16px", border: "1px solid #fecaca", borderRadius: "8px", background: "#fef2f2" }}>
            <h4 style={{ color: "#dc2626", margin: "0 0 8px", fontSize: tokens.fontSize.sm }}>❌ KHÔNG share — keep isolated</h4>
            <ul style={{ margin: 0, paddingLeft: "16px", fontSize: tokens.fontSize.xs, color: "#991b1b", lineHeight: 1.6 }}>
              <li>State chỉ dùng trong 1 MFE (form state, UI state)</li>
              <li>MFE có thể fetch data riêng từ API</li>
              <li>Không ảnh hưởng MFE khác</li>
            </ul>
          </div>

          {/* Option 2 */}
          <div style={{ padding: "16px", border: "1px solid #fcd34d", borderRadius: "8px", background: "#fffbeb" }}>
            <h4 style={{ color: "#d97706", margin: "0 0 8px", fontSize: tokens.fontSize.sm }}>⚡ CustomEvent — fire-and-forget</h4>
            <ul style={{ margin: 0, paddingLeft: "16px", fontSize: tokens.fontSize.xs, color: "#92400e", lineHeight: 1.6 }}>
              <li>Thông báo "something happened" (analytics, logging)</li>
              <li>Listener có thể miss nếu chưa mount</li>
              <li>Không có "current state" concept</li>
            </ul>
          </div>

          {/* Option 3 */}
          <div style={{ padding: "16px", border: "1px solid #86efac", borderRadius: "8px", background: "#ecfdf5" }}>
            <h4 style={{ color: "#059669", margin: "0 0 8px", fontSize: tokens.fontSize.sm }}>✅ Shared Store — subscribe pattern</h4>
            <ul style={{ margin: 0, paddingLeft: "16px", fontSize: tokens.fontSize.xs, color: "#065f46", lineHeight: 1.6 }}>
              <li>State cần đồng bộ real-time giữa MFEs (cart, auth, theme)</li>
              <li>New subscriber nhận current state ngay</li>
              <li>Single source of truth</li>
            </ul>
          </div>
        </div>

        {/* Code Comparison */}
        <h4 style={{ fontSize: tokens.fontSize.md, fontWeight: 600, margin: "0 0 12px" }}>
          Cách implement trong demo này:
        </h4>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
          <div style={{ background: "#1e293b", borderRadius: "8px", padding: "12px", overflow: "auto" }}>
            <div style={{ color: "#ef4444", fontSize: "11px", fontWeight: 700, marginBottom: "8px" }}>
              ❌ BEFORE: CustomEvent (miss events!)
            </div>
            <pre style={{ color: "#e2e8f0", fontSize: "11px", lineHeight: 1.5, margin: 0 }}>
{`// Products MFE — fire event
window.dispatchEvent(
  new CustomEvent("mfe:cart:add", {
    detail: { id, name, price }
  })
);

// Cart MFE — listen (may MISS!)
useEffect(() => {
  const handler = (e) => {
    setItems(prev => [...prev, e.detail]);
  };
  window.addEventListener("mfe:cart:add", handler);
  return () => window.removeEventListener(...);
}, []);

// ❌ Cart MFE mount SAU event fire → miss!
// ❌ Không có "current cart" khi mount`}
            </pre>
          </div>

          <div style={{ background: "#1e293b", borderRadius: "8px", padding: "12px", overflow: "auto" }}>
            <div style={{ color: "#10b981", fontSize: "11px", fontWeight: 700, marginBottom: "8px" }}>
              ✅ AFTER: Shared Store (always in sync)
            </div>
            <pre style={{ color: "#e2e8f0", fontSize: "11px", lineHeight: 1.5, margin: 0 }}>
{`// Products MFE — direct store action
import { cartActions } from "shared-ui/store";
cartActions.addItem({ id, name, price });

// Cart MFE — subscribe (NEVER miss!)
import { useCart } from "shared-ui/store";
const { items } = useCart();
// ✅ Gets CURRENT state immediately on mount
// ✅ Auto-updates on any change
// ✅ Works even if mount AFTER Products

// useCart() = useStore(cartStore) internally
// → subscribe() called → listener(currentState)
// → State ALWAYS in sync`}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// Architecture Tab
// ============================================================
// ============================================================
// Event Bus Tab — Live demo + Concept + Issues
// ============================================================
function EventBusView() {
  const [receivedEvents, setReceivedEvents] = useState<Array<{ event: string; data: unknown; source: string; time: string }>>([]);
  const [listenerCount, setListenerCount] = useState(0);
  const [notification, setNotification] = useState<string | null>(null);

  // ✅ Wildcard listener: catch ALL events from eventBus
  // + Replay buffered events on mount (solves tab-switch state loss)
  useEffect(() => {
    // Replay buffered events first (events that happened while this tab was unmounted)
    const buffered = eventBus.getBuffer();
    if (buffered.length > 0) {
      setReceivedEvents(
        buffered.map((entry: { event: string; data: unknown; source: string; time: number }) => ({
          event: entry.event,
          data: entry.data,
          source: entry.source,
          time: new Date(entry.time).toLocaleTimeString("vi-VN"),
        })).reverse() // newest first
      );
    }

    // Then subscribe for future events
    const unsubAll = eventBus.onAll((rawData: unknown, meta: { source: string; time: number }) => {
      const { event, data } = rawData as { event: string; data: unknown };
      setReceivedEvents((prev) => [{
        event,
        data,
        source: meta.source,
        time: new Date(meta.time).toLocaleTimeString("vi-VN"),
      }, ...prev.slice(0, 49)]);

      // Show toast for notification events
      if (event === "ui:notification") {
        const notifData = data as { message: string };
        setNotification(notifData.message);
        setTimeout(() => setNotification(null), 3000);
      }
    });

    return unsubAll;
  }, []);

  // Update debug info
  useEffect(() => {
    const interval = setInterval(() => {
      const debug = eventBus._debug();
      setListenerCount(Object.values(debug.listenerCounts).reduce((a: number, b: unknown) => a + (b as number), 0) + debug.wildcardListeners);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div>
      {/* Notification toast */}
      {notification && (
        <div style={{
          position: "fixed", top: "70px", right: "24px", zIndex: 999,
          padding: "12px 20px", background: "#10b981", color: "#fff",
          borderRadius: "8px", boxShadow: "0 4px 12px rgba(0,0,0,0.2)",
          fontSize: tokens.fontSize.sm, fontWeight: 600,
          animation: "pulse 0.3s ease",
        }}>
          📡 {notification}
        </div>
      )}

      <h2 style={{ fontSize: tokens.fontSize.xl, fontWeight: 700, marginBottom: "8px" }}>
        📡 Event Bus Pattern
      </h2>
      <p style={{ color: tokens.colors.textMuted, marginBottom: "24px", fontSize: tokens.fontSize.sm, lineHeight: 1.6 }}>
        Event Bus = <strong>trạm trung chuyển tin nhắn</strong> giữa các MFEs.
        Khác với Shared Store (quản lý <em>state</em>), Event Bus quản lý <em>events</em> (những gì đã xảy ra).
      </p>

      {/* ===== CONCEPT SECTION ===== */}
      <div style={{
        display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "24px"
      }}>
        {/* Mental Model */}
        <div style={{
          background: tokens.colors.surface,
          border: `1px solid ${tokens.colors.border}`,
          borderRadius: tokens.borderRadius.lg,
          padding: tokens.spacing.lg,
        }}>
          <h3 style={{ fontSize: tokens.fontSize.lg, fontWeight: 700, margin: "0 0 12px", color: "#6366f1" }}>
            🧠 Mental Model
          </h3>
          <div style={{ background: "#f8fafc", borderRadius: "8px", padding: "14px", fontFamily: "monospace", fontSize: "12px", lineHeight: 1.8 }}>
            <div><strong>Bưu điện trung tâm (Event Bus):</strong></div>
            <div style={{ color: "#64748b" }}>┌─────────────────────────────────────┐</div>
            <div style={{ color: "#64748b" }}>│ Products MFE  ──gửi thư──▶         │</div>
            <div style={{ color: "#64748b" }}>│                         📮 BƯU ĐIỆN│</div>
            <div style={{ color: "#64748b" }}>│ Cart MFE      ◀──nhận thư──        │</div>
            <div style={{ color: "#64748b" }}>│ Host          ◀──nhận thư──        │</div>
            <div style={{ color: "#64748b" }}>│ Analytics     ◀──nhận thư──        │</div>
            <div style={{ color: "#64748b" }}>└─────────────────────────────────────┘</div>
            <div style={{ marginTop: "8px", color: "#059669" }}>
              ✅ Ai gửi không cần biết ai nhận<br />
              ✅ Nhiều người nhận cùng 1 thư<br />
              ✅ Thư được lưu lại (buffer) cho người đến muộn
            </div>
          </div>
        </div>

        {/* Store vs Event Bus */}
        <div style={{
          background: tokens.colors.surface,
          border: `1px solid ${tokens.colors.border}`,
          borderRadius: tokens.borderRadius.lg,
          padding: tokens.spacing.lg,
        }}>
          <h3 style={{ fontSize: tokens.fontSize.lg, fontWeight: 700, margin: "0 0 12px", color: "#f59e0b" }}>
            ⚖️ Shared Store vs Event Bus
          </h3>
          <table style={{ width: "100%", fontSize: tokens.fontSize.xs, borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: `2px solid ${tokens.colors.border}` }}>
                <th style={{ padding: "6px 8px", textAlign: "left" }}></th>
                <th style={{ padding: "6px 8px", textAlign: "left", color: "#10b981" }}>Shared Store</th>
                <th style={{ padding: "6px 8px", textAlign: "left", color: "#6366f1" }}>Event Bus</th>
              </tr>
            </thead>
            <tbody>
              {[
                ["Câu hỏi", "State HIỆN TẠI là gì?", "Chuyện gì VỪA XẢY RA?"],
                ["Pattern", "Pub/Sub + State", "Pub/Sub + Buffer"],
                ["Late subscriber", "✅ Nhận state ngay", "⚡ Replay từ buffer"],
                ["Coupling", "Medium (share schema)", "Low (event strings)"],
                ["Debug", "console.log(store)", "Event log + wildcard"],
                ["Use case", "Cart, Auth, Theme", "Analytics, Notifications"],
              ].map(([label, store, bus], i) => (
                <tr key={i} style={{ borderBottom: `1px solid ${tokens.colors.border}` }}>
                  <td style={{ padding: "6px 8px", fontWeight: 600 }}>{label}</td>
                  <td style={{ padding: "6px 8px", color: "#065f46" }}>{store}</td>
                  <td style={{ padding: "6px 8px", color: "#4338ca" }}>{bus}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ===== LIVE DEMO ===== */}
      <div style={{
        background: tokens.colors.surface,
        border: `2px solid #6366f130`,
        borderRadius: tokens.borderRadius.lg,
        padding: tokens.spacing.lg,
        marginBottom: "24px",
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
          <h3 style={{ margin: 0, fontSize: tokens.fontSize.lg, fontWeight: 700, color: "#6366f1" }}>
            ⚡ Live Demo — Emit &amp; Listen
          </h3>
          <span style={{ fontSize: tokens.fontSize.xs, color: tokens.colors.textMuted, fontFamily: "monospace" }}>
            Active listeners: {listenerCount} | Buffer: {eventBus._debug().totalEvents} events
          </span>
        </div>

        {/* Emit Controls */}
        <div style={{ display: "flex", gap: "8px", marginBottom: "16px", flexWrap: "wrap" }}>
          <Button size="sm" variant="primary" onClick={() =>
            eventBus.emit("ui:notification", { message: "Hello from Host! 🎉", type: "success" }, "host")
          }>
            📡 Emit Notification
          </Button>
          <Button size="sm" variant="secondary" onClick={() =>
            eventBus.emit("ui:theme-changed", { theme: "dark" }, "host")
          }>
            🌙 Emit Theme Change
          </Button>
          <Button size="sm" variant="ghost" onClick={() =>
            eventBus.emit("mfe:loaded", { name: "test-mfe", version: "1.0.0", loadTime: 342 }, "host")
          }>
            📦 Emit MFE Loaded
          </Button>
          <Button size="sm" variant="danger" onClick={() =>
            eventBus.emit("mfe:error", { name: "products", error: "Network timeout" }, "host")
          }>
            ❌ Emit MFE Error
          </Button>
          <Button size="sm" variant="ghost" onClick={() => setReceivedEvents([])}>
            🧹 Clear
          </Button>
        </div>

        <p style={{ fontSize: tokens.fontSize.xs, color: tokens.colors.textMuted, margin: "0 0 12px" }}>
          💡 Bấm &quot;Add to Cart&quot; ở tab <strong>Live Demo</strong> để thấy event <code>cart:item-added</code> xuất hiện ở đây.
          Events từ MỌI MFE đều hiện ở đây nhờ <code>useEventBus()</code> hook.
        </p>

        {/* Event Stream */}
        <div style={{
          background: "#1e293b", borderRadius: "8px", padding: "12px",
          fontFamily: "monospace", fontSize: "12px", minHeight: "150px", maxHeight: "250px", overflow: "auto",
        }}>
          {receivedEvents.length === 0 ? (
            <div style={{ color: "#64748b", textAlign: "center", padding: "40px" }}>
              Waiting for events... Click buttons above or &quot;Add to Cart&quot; in Live Demo tab.
            </div>
          ) : (
            receivedEvents.map((evt, i) => (
              <div key={i} style={{ color: "#e2e8f0", padding: "4px 0", borderBottom: "1px solid #334155", display: "flex", gap: "10px" }}>
                <span style={{ color: "#64748b", flexShrink: 0 }}>[{evt.time}]</span>
                <span style={{ color: "#fbbf24", fontWeight: 600, flexShrink: 0, minWidth: "100px" }}>{evt.event}</span>
                <span style={{
                  color: evt.source === "products" ? "#86efac" : evt.source === "cart" ? "#c4b5fd" : "#93c5fd",
                  flexShrink: 0,
                }}>
                  {evt.source}
                </span>
                <span style={{ color: "#94a3b8" }}>{JSON.stringify(evt.data)}</span>
              </div>
            ))
          )}
        </div>
      </div>

      {/* ===== ISSUES & PITFALLS ===== */}
      <div style={{
        background: tokens.colors.surface,
        border: `1px solid ${tokens.colors.border}`,
        borderRadius: tokens.borderRadius.lg,
        padding: tokens.spacing.lg,
        marginBottom: "24px",
      }}>
        <h3 style={{ fontSize: tokens.fontSize.lg, fontWeight: 700, margin: "0 0 16px", color: "#dc2626" }}>
          ⚠️ Khó khăn &amp; Issues khi áp dụng Event Bus
        </h3>

        {[
          {
            title: "1. Memory Leak — Listener tích lũy",
            issue: "Mỗi lần MFE mount → thêm listener. Unmount mà không cleanup → listeners cũ vẫn còn. Navigate 20 lần → 20 copies handler → mỗi event fire 20 lần.",
            solution: "useEffect return cleanup function. EventBus.on() trả về unsubscribe(). Hook useEventBus() đã tự cleanup.",
            color: "#dc2626",
            code: `// ❌ Memory leak\nuseEffect(() => {\n  eventBus.on("cart:item-added", handler);\n  // Không có return cleanup!\n}, []);\n\n// ✅ Correct\nuseEffect(() => {\n  const unsub = eventBus.on("cart:item-added", handler);\n  return unsub; // Cleanup on unmount\n}, []);`,
          },
          {
            title: "2. Circular Events — Infinite loop",
            issue: "Handler A nhận event X → emit event Y → Handler B nhận Y → emit event X → Handler A nhận X → ... Stack overflow!",
            solution: "Event Bus có emitDepth counter. Vượt MAX_DEPTH=10 → auto-break + console.error. Rule: Handler KHÔNG ĐƯỢC emit event mà chính nó đang handle.",
            color: "#f59e0b",
            code: `// ❌ Circular!\neventBus.on("cart:item-added", (data) => {\n  // Process...\n  eventBus.emit("cart:item-added", data); // ← LOOP!\n});\n\n// ✅ Emit DIFFERENT event\neventBus.on("cart:item-added", (data) => {\n  // Process...\n  eventBus.emit("ui:notification", {\n    message: \`Added \${data.name}\`\n  }); // ← Different event OK\n});`,
          },
          {
            title: "3. Event Storm — Quá nhiều events",
            issue: "Scroll event → emit 60 events/giây. Mouse move → 100 events/giây. Product search với debounce kém → mỗi keystroke = 1 event.",
            solution: "Throttle/debounce trước khi emit. Middleware pipeline trong EventBus để filter. Chỉ emit business events, KHÔNG emit UI events.",
            color: "#8b5cf6",
            code: `// ❌ Event storm\ninput.addEventListener("keyup", (e) => {\n  eventBus.emit("products:search", { query: e.target.value });\n  // 50 events cho "iphone" (i, ip, iph, ipho...)\n});\n\n// ✅ Debounced\nconst debouncedEmit = debounce((q) => {\n  eventBus.emit("products:search", { query: q });\n}, 300); // 1 event cho "iphone"`,
          },
          {
            title: "4. Replay Side Effects — Duplicate API calls",
            issue: "MFE mount muộn → dùng replay() nhận events cũ → handler gọi API → API đã được gọi trước đó rồi → duplicate.",
            solution: "Replay chỉ cho idempotent handlers (UI update, state set). KHÔNG replay handlers có side effects (API calls, analytics). Dùng maxAge option.",
            color: "#0ea5e9",
            code: `// ❌ Replay gây duplicate API call\neventBus.replay("cart:item-added", (data) => {\n  fetch("/api/track", { body: JSON.stringify(data) });\n  // Replay 5 events cũ → 5 duplicate track calls!\n});\n\n// ✅ Replay chỉ cho UI updates\neventBus.replay("cart:item-added", (data) => {\n  setNotification(\`\${data.name} was added\`);\n  // UI update = idempotent, OK to replay\n}, { maxAge: 10000 }); // Chỉ replay 10s gần nhất`,
          },
          {
            title: "5. Type Safety — Typo = Silent Bug",
            issue: "Event name là string → typo không bị TypeScript catch. 'cart:item-aded' (thiếu d) → listener không bao giờ fire → debug mất nửa ngày.",
            solution: "Typed Event Registry (MFEEventMap interface). TypeScript auto-complete event names. emit() và on() generic typed.",
            color: "#10b981",
            code: `// ❌ Untyped (CustomEvent style)\nwindow.dispatchEvent(\n  new CustomEvent("cart:item-aded", {...}) // Typo!\n);\n\n// ✅ Typed Event Bus\neventBus.emit("cart:item-aded", {...}); // TypeScript error!\n// TS: Argument '"cart:item-aded"' is not\n// assignable to parameter of type 'MFEEventName'\n\neventBus.emit("cart:item-added", {...}); // ✅ Autocomplete!`,
          },
        ].map((item, i) => (
          <div key={i} style={{
            marginBottom: "16px",
            border: `1px solid ${item.color}25`,
            borderLeft: `4px solid ${item.color}`,
            borderRadius: "0 8px 8px 0",
            overflow: "hidden",
          }}>
            <div style={{ padding: "12px 16px" }}>
              <h4 style={{ margin: "0 0 6px", fontSize: tokens.fontSize.sm, fontWeight: 700, color: item.color }}>
                {item.title}
              </h4>
              <p style={{ margin: "0 0 6px", fontSize: tokens.fontSize.xs, color: tokens.colors.text, lineHeight: 1.5 }}>
                <strong>Issue:</strong> {item.issue}
              </p>
              <p style={{ margin: "0 0 8px", fontSize: tokens.fontSize.xs, color: "#059669", lineHeight: 1.5 }}>
                <strong>Fix:</strong> {item.solution}
              </p>
              <details>
                <summary style={{ cursor: "pointer", fontSize: tokens.fontSize.xs, color: tokens.colors.textMuted, fontWeight: 600 }}>
                  Code example ▸
                </summary>
                <pre style={{
                  background: "#1e293b", color: "#e2e8f0", padding: "10px", borderRadius: "6px",
                  fontSize: "11px", lineHeight: 1.5, marginTop: "8px", overflow: "auto",
                }}>
                  {item.code}
                </pre>
              </details>
            </div>
          </div>
        ))}
      </div>

      {/* ===== WHEN TO USE ===== */}
      <div style={{
        background: tokens.colors.surface,
        border: `1px solid ${tokens.colors.border}`,
        borderRadius: tokens.borderRadius.lg,
        padding: tokens.spacing.lg,
      }}>
        <h3 style={{ fontSize: tokens.fontSize.lg, fontWeight: 700, margin: "0 0 16px" }}>
          🎯 Khi nào dùng gì?
        </h3>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "12px" }}>
          <div style={{ padding: "14px", background: "#fef2f2", borderRadius: "8px", border: "1px solid #fecaca" }}>
            <h4 style={{ color: "#dc2626", margin: "0 0 8px", fontSize: tokens.fontSize.sm }}>❌ Không share gì</h4>
            <ul style={{ margin: 0, paddingLeft: "14px", fontSize: "11px", color: "#991b1b", lineHeight: 1.7 }}>
              <li>Form state (input values, validation)</li>
              <li>UI state (dropdown open, modal visible)</li>
              <li>Data mỗi MFE tự fetch từ API</li>
              <li>Pagination, sorting, local filters</li>
            </ul>
            <div style={{ marginTop: "8px", padding: "6px 8px", background: "#fff5f5", borderRadius: "4px", fontSize: "10px", color: "#b91c1c" }}>
              Rule: Nếu chỉ 1 MFE cần → KHÔNG share
            </div>
          </div>

          <div style={{ padding: "14px", background: "#ecfdf5", borderRadius: "8px", border: "1px solid #a7f3d0" }}>
            <h4 style={{ color: "#059669", margin: "0 0 8px", fontSize: tokens.fontSize.sm }}>✅ Shared Store</h4>
            <ul style={{ margin: 0, paddingLeft: "14px", fontSize: "11px", color: "#065f46", lineHeight: 1.7 }}>
              <li>Auth state (user, token, permissions)</li>
              <li>Cart state (items, total, quantity)</li>
              <li>Theme / locale / feature flags</li>
              <li>Bất kỳ state cần &quot;hiện tại là gì?&quot;</li>
            </ul>
            <div style={{ marginTop: "8px", padding: "6px 8px", background: "#f0fdf4", borderRadius: "4px", fontSize: "10px", color: "#166534" }}>
              Rule: State cần đọc bất cứ lúc nào → Store
            </div>
          </div>

          <div style={{ padding: "14px", background: "#eef2ff", borderRadius: "8px", border: "1px solid #c7d2fe" }}>
            <h4 style={{ color: "#4338ca", margin: "0 0 8px", fontSize: tokens.fontSize.sm }}>📡 Event Bus</h4>
            <ul style={{ margin: 0, paddingLeft: "14px", fontSize: "11px", color: "#3730a3", lineHeight: 1.7 }}>
              <li>Analytics tracking (page viewed, clicked)</li>
              <li>Notifications (toast, banner, alert)</li>
              <li>Orchestration (MFE loaded → show content)</li>
              <li>Cross-MFE navigation requests</li>
              <li>Error broadcasting</li>
            </ul>
            <div style={{ marginTop: "8px", padding: "6px 8px", background: "#f5f3ff", borderRadius: "4px", fontSize: "10px", color: "#5b21b6" }}>
              Rule: &quot;Chuyện gì xảy ra&quot; mà ai cũng cần biết → Bus
            </div>
          </div>
        </div>

        {/* Combined Pattern */}
        <div style={{
          marginTop: "16px",
          padding: "14px",
          background: "linear-gradient(135deg, #ecfdf5, #eef2ff)",
          borderRadius: "8px",
          border: "1px solid #c7d2fe",
        }}>
          <h4 style={{ margin: "0 0 8px", fontSize: tokens.fontSize.sm, fontWeight: 700, color: "#1e293b" }}>
            🏆 Best Practice: Kết hợp cả hai (như demo này)
          </h4>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
            <div style={{ background: "#1e293b", borderRadius: "6px", padding: "10px" }}>
              <pre style={{ color: "#e2e8f0", fontSize: "11px", lineHeight: 1.5, margin: 0 }}>
{`// Products MFE — khi user click "Add to Cart"

// 1️⃣ STORE: Cập nhật state (Cart MFE re-render)
cartActions.addItem({ id, name, price });

// 2️⃣ BUS: Thông báo event (Host, Analytics nhận)
eventBus.emit("cart:item-added", {
  id, name, price
}, "products");

// Store = WHAT (trạng thái cart hiện tại)
// Bus  = THAT (sự kiện vừa xảy ra)`}
              </pre>
            </div>
            <div style={{ fontSize: tokens.fontSize.xs, color: tokens.colors.text, lineHeight: 1.7, padding: "4px 0" }}>
              <strong>Tại sao cần cả hai?</strong><br />
              <span style={{ color: "#059669" }}>Store</span>: Cart MFE cần biết &quot;hiện tại giỏ hàng có gì?&quot; → <code>useCart()</code><br />
              <span style={{ color: "#4338ca" }}>Bus</span>: Host cần biết &quot;vừa thêm sản phẩm nào?&quot; để hiện toast notification → <code>useEventBus(&quot;cart:item-added&quot;)</code><br /><br />
              <strong>Nếu chỉ dùng Store:</strong> Host phải diff cart state để biết item nào mới → phức tạp<br />
              <strong>Nếu chỉ dùng Bus:</strong> Cart MFE mount sau event → miss, không biết cart hiện tại
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// Architecture Tab
// ============================================================
function ArchitectureView() {
  return (
    <div>
      <h2 style={{ fontSize: tokens.fontSize.xl, fontWeight: 700, marginBottom: "20px" }}>
        How Module Federation Works
      </h2>

      {[
        { step: 1, title: "Host App Loads", desc: "Browser loads Host (port 3000). Host HTML contains <script> tags but NO remote code yet.", color: "#6366f1" },
        { step: 2, title: "Remote Entry Downloaded", desc: "When Host needs <ProductList />, it downloads remoteEntry.js from port 3001. This manifest file tells Host where to find the actual component chunks.", color: "#10b981" },
        { step: 3, title: "Shared Deps Resolved", desc: "Module Federation checks: 'Does Host already have React loaded?' → YES → Remote uses Host's React instance. Store is also shared as singleton!", color: "#f59e0b" },
        { step: 4, title: "Component Chunk Downloaded", desc: "The actual ProductList component code is downloaded as a separate chunk. Only the code needed, nothing more.", color: "#8b5cf6" },
        { step: 5, title: "Component Renders", desc: "ProductList renders inside Host app. It uses shared Design System components AND shared store — same singleton instances.", color: "#10b981" },
        { step: 6, title: "Shared State Syncs", desc: "Products MFE calls cartActions.addItem() → cartStore updates → Cart MFE's useCart() re-renders automatically. Zero CustomEvent needed for state!", color: "#ef4444" },
      ].map((item) => (
        <div key={item.step} style={{ display: "flex", gap: "16px", marginBottom: "16px", alignItems: "flex-start" }}>
          <div style={{
            width: "36px", height: "36px", borderRadius: "50%",
            background: item.color, color: "#fff", display: "flex",
            alignItems: "center", justifyContent: "center",
            fontWeight: 700, fontSize: "14px", flexShrink: 0,
          }}>
            {item.step}
          </div>
          <div style={{
            flex: 1, padding: "12px 16px", background: `${item.color}08`,
            border: `1px solid ${item.color}20`, borderRadius: tokens.borderRadius.md,
          }}>
            <h3 style={{ margin: "0 0 4px", fontSize: tokens.fontSize.md, fontWeight: 700, color: item.color }}>
              {item.title}
            </h3>
            <p style={{ margin: 0, fontSize: tokens.fontSize.sm, color: tokens.colors.textMuted, lineHeight: 1.5 }}>
              {item.desc}
            </p>
          </div>
        </div>
      ))}

      <div style={{ marginTop: "32px", background: "#1e293b", borderRadius: "12px", padding: "20px", overflow: "auto" }}>
        <h3 style={{ color: "#a5b4fc", margin: "0 0 12px", fontSize: tokens.fontSize.md }}>
          shared-ui/store.ts — Mini Zustand (zero-dep)
        </h3>
        <pre style={{ color: "#e2e8f0", fontSize: "13px", lineHeight: 1.6, margin: 0 }}>
{`function createStore<T>(initialState: T) {
  let state = initialState;
  const listeners = new Set<Listener<T>>();

  return {
    getState: () => state,
    setState: (partial) => {
      state = { ...state, ...partial };
      listeners.forEach(fn => fn(state)); // Notify ALL
    },
    subscribe: (listener) => {
      listeners.add(listener);
      listener(state); // ✅ Immediate current state
      return () => listeners.delete(listener);
    },
  };
}

// Shared via Module Federation singleton:
export const cartStore = createStore({ items: [], isOpen: false });
export const userStore = createStore({ user: null, theme: "light" });`}
        </pre>
      </div>
    </div>
  );
}

// ============================================================
// Event Log Tab — Shows all cross-MFE events from shared store
// ============================================================
function EventLogView() {
  const eventLog = useStore(eventLogStore);

  return (
    <div>
      <h2 style={{ fontSize: tokens.fontSize.xl, fontWeight: 700, marginBottom: "8px" }}>
        📡 Cross-MFE Event Log
      </h2>
      <p style={{ color: tokens.colors.textMuted, marginBottom: "20px", fontSize: tokens.fontSize.sm }}>
        All actions across MFEs are logged here via <code>logEvent()</code> from the shared store.
        Go to <strong>Live Demo</strong> tab, click &quot;Add to Cart&quot;, or go to <strong>Shared State</strong> tab and toggle settings.
      </p>

      <div style={{
        background: "#1e293b", borderRadius: "12px", padding: "16px",
        fontFamily: "monospace", fontSize: "13px", minHeight: "300px",
        maxHeight: "500px", overflow: "auto",
      }}>
        {eventLog.events.length === 0 ? (
          <div style={{ color: "#64748b", textAlign: "center", padding: "60px 20px" }}>
            No events yet.<br />
            Go to <strong>Live Demo</strong> tab and click &quot;Add to Cart&quot;.
          </div>
        ) : (
          eventLog.events.map((event: { time: string; source: string; action: string; data: unknown }, i: number) => (
            <div key={i} style={{ color: "#e2e8f0", padding: "6px 0", borderBottom: "1px solid #334155", display: "flex", gap: "12px" }}>
              <span style={{ color: "#64748b", flexShrink: 0 }}>[{event.time}]</span>
              <span style={{
                color: event.source === "products" ? "#86efac" : event.source === "cart" ? "#c4b5fd" : "#93c5fd",
                fontWeight: 600,
                flexShrink: 0,
                minWidth: "70px",
              }}>
                {event.source}
              </span>
              <span style={{ color: "#fbbf24", flexShrink: 0 }}>{event.action}</span>
              <span style={{ color: "#94a3b8" }}>{typeof event.data === "object" ? JSON.stringify(event.data) : String(event.data ?? "")}</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
