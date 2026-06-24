/**
 * SkipLinkDemo.tsx
 *
 * Demonstrates the "Skip Navigation Link" pattern built for Workday HCM:
 *
 * WHAT IS A SKIP LINK?
 *   A visually hidden <a> anchor that appears ONLY when focused via keyboard.
 *   It lets keyboard and screen-reader users jump past repetitive nav/header
 *   to reach the main content directly — satisfying WCAG 2.1 SC 2.4.1 (Level A).
 *
 * WHY WORKDAY HCM SPECIFICALLY NEEDS IT
 *   Workday HCM has a dense persistent navigation bar + breadcrumbs + filters
 *   above every page. Without a skip link, a keyboard user must press Tab
 *   dozens of times to reach the primary time-entry or employee record form.
 *
 * KEY IMPLEMENTATION DETAILS
 *   1. The link is VISUALLY HIDDEN until focused
 *      - Uses clip / clip-path + 1px size, NOT display:none (AT ignores display:none)
 *      - On :focus, absolute position snaps it into the viewport
 *   2. Target element must have tabIndex={-1}
 *      - <main id="main-content" tabIndex={-1}> — non-interactive elements don't
 *        naturally receive programmatic focus without this
 *   3. Multiple skip links (skip to content, skip to nav, skip to search)
 *      - The first Tab press reveals a "Skip to main content" button
 *      - Subsequent links revealed on further Tab presses
 *   4. Smooth visual reveal — 150ms translate transition so sighted keyboard
 *      users see the link slide in (no jarring jump)
 *   5. The link is the FIRST focusable element in the DOM
 *      - Placed before <header> in the markup hierarchy
 *
 * WCAG CRITERIA MET
 *   SC 2.4.1 Bypass Blocks (Level A)    — required
 *   SC 2.4.3 Focus Order (Level A)      — skip link is first in tab order
 *   SC 2.4.7 Focus Visible (Level AA)   — high-contrast focus ring shown
 *   SC 1.4.3 Contrast Minimum (Level AA)— 7:1 on the revealed button
 */

import React, {
  useState,
  useRef,
  useCallback,
  KeyboardEvent,
} from "react";

// ─────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────

interface SkipTarget {
  id: string;
  label: string;
  icon: string;
}

// ─────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────

const SKIP_TARGETS: SkipTarget[] = [
  { id: "skip-to-main",   label: "Skip to main content",   icon: "⤵" },
  { id: "skip-to-search", label: "Skip to search",          icon: "🔍" },
  { id: "skip-to-nav",    label: "Skip to navigation",      icon: "≡" },
];

// Simulated HCM navigation items — represents the "wall of tabs" users must Tab past
const NAV_ITEMS = [
  "Home", "Timesheets", "Benefits", "Pay", "Career", "Team", "Goals",
  "Expenses", "Learning", "Directory", "Reports", "Dashboards",
];

const EMPLOYEE_RECORDS = [
  { name: "Nguyễn Văn A", id: "EMP-001", dept: "Engineering", status: "Active" },
  { name: "Trần Thị B",   id: "EMP-002", dept: "Product",     status: "Active" },
  { name: "Lê Minh C",    id: "EMP-003", dept: "Design",      status: "On Leave" },
  { name: "Phạm Quỳnh D", id: "EMP-004", dept: "Engineering", status: "Active" },
  { name: "Hoàng Gia E",  id: "EMP-005", dept: "Finance",     status: "Active" },
];

// ─────────────────────────────────────────────────────────────────
// Visually-hidden CSS (as JS object for inline styles)
// The CORRECT way to hide skip links from sighted users while
// keeping them accessible to screen readers and keyboard focus.
// ─────────────────────────────────────────────────────────────────
const visuallyHiddenStyle: React.CSSProperties = {
  position: "absolute",
  width: 1,
  height: 1,
  padding: 0,
  margin: -1,
  overflow: "hidden",
  clip: "rect(0, 0, 0, 0)",
  whiteSpace: "nowrap",
  borderWidth: 0,
};

// Revealed style when focused — snaps to top-left of viewport
const skipLinkRevealedStyle: React.CSSProperties = {
  position: "fixed",
  top: 16,
  left: 16,
  zIndex: 9999,
  padding: "12px 20px",
  background: "#1e1b4b",
  color: "#fff",
  fontWeight: 700,
  fontSize: 15,
  borderRadius: 8,
  textDecoration: "none",
  outline: "3px solid #fbbf24",
  outlineOffset: 2,
  boxShadow: "0 4px 24px rgba(0,0,0,0.5)",
  transform: "translateY(0)",
  transition: "transform 0.15s ease",
};

// ─────────────────────────────────────────────────────────────────
// SkipLink component — the single focusable link
// ─────────────────────────────────────────────────────────────────
function SkipLink({
  href,
  label,
  icon,
}: {
  href: string;
  label: string;
  icon: string;
}) {
  const [isFocused, setIsFocused] = useState(false);

  const handleClick = useCallback((e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    const target = document.querySelector<HTMLElement>(href);
    if (target) {
      target.focus();
      // Smooth scroll into view for partially scrolled pages
      target.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [href]);

  return (
    <a
      href={href}
      onClick={handleClick}
      onFocus={() => setIsFocused(true)}
      onBlur={() => setIsFocused(false)}
      style={isFocused ? skipLinkRevealedStyle : visuallyHiddenStyle}
    >
      {icon} {label}
    </a>
  );
}

// ─────────────────────────────────────────────────────────────────
// Simulated HCM Page with Skip Links
// ─────────────────────────────────────────────────────────────────
function HCMPageSimulation() {
  const [tabCount, setTabCount] = useState(0);
  const [skipUsed, setSkipUsed] = useState(false);
  const [activeNav, setActiveNav] = useState("Timesheets");
  const [searchQuery, setSearchQuery] = useState("");

  const mainRef   = useRef<HTMLElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const navRef    = useRef<HTMLElement>(null);

  // Count Tab presses for the "without skip link" illustration
  const handlePageKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === "Tab") {
      setTabCount(prev => prev + 1);
    }
  }, []);

  return (
    <div
      style={{ background: "#f8fafc", borderRadius: 12, overflow: "hidden", border: "1px solid #e2e8f0" }}
      onKeyDown={handlePageKeyDown}
    >
      {/* ── Skip Links (first in DOM — first in tab order) ── */}
      {/* In a real HCM app, these would be inside <body> before <header> */}
      <SkipLink href="#hcm-main-content" label="Skip to main content" icon="⤵" />
      <SkipLink href="#hcm-search"       label="Skip to search"        icon="🔍" />
      <SkipLink href="#hcm-primary-nav"  label="Skip to navigation"    icon="≡"  />

      {/* ── HCM Header ── */}
      <header style={{
        background: "linear-gradient(135deg, #1e1b4b 0%, #312e81 100%)",
        padding: "10px 20px",
        display: "flex", alignItems: "center", justifyContent: "space-between",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{ color: "#fbbf24", fontSize: 22, fontWeight: 900 }}>⬡</span>
          <span style={{ color: "#fff", fontSize: 15, fontWeight: 700 }}>Workday HCM</span>
        </div>

        {/* Search — skip link target */}
        <div id="hcm-search" tabIndex={-1} style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <input
            ref={searchRef}
            type="search"
            aria-label="Search employees, actions, or reports"
            placeholder="Search…"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            style={{
              background: "rgba(255,255,255,0.15)", color: "#fff",
              border: "1px solid rgba(255,255,255,0.3)", borderRadius: 20,
              padding: "6px 14px", fontSize: 13, width: 200,
              outline: "none",
            }}
          />
        </div>

        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
          <button aria-label="Notifications" style={{ background: "none", border: "none", color: "#c7d2fe", cursor: "pointer", fontSize: 18 }}>🔔</button>
          <button aria-label="User profile" style={{ background: "none", border: "none", color: "#c7d2fe", cursor: "pointer", fontSize: 18 }}>👤</button>
          <button aria-label="Help" style={{ background: "none", border: "none", color: "#c7d2fe", cursor: "pointer", fontSize: 18 }}>❓</button>
        </div>
      </header>

      {/* ── Primary Navigation ── */}
      {/* Without skip link: user must Tab through all 12 nav items to reach content */}
      <nav
        id="hcm-primary-nav"
        ref={navRef}
        tabIndex={-1}
        aria-label="Primary navigation"
        style={{
          background: "#312e81", overflowX: "auto",
          scrollbarWidth: "none",
        }}
      >
        <ul role="list" style={{
          display: "flex", margin: 0, padding: "0 20px",
          listStyle: "none", gap: 0,
        }}>
          {NAV_ITEMS.map(item => (
            <li key={item}>
              <button
                aria-current={activeNav === item ? "page" : undefined}
                onClick={() => setActiveNav(item)}
                style={{
                  background: "none",
                  color: activeNav === item ? "#fbbf24" : "#c7d2fe",
                  border: "none", borderBottom: activeNav === item ? "2px solid #fbbf24" : "2px solid transparent",
                  padding: "10px 14px", cursor: "pointer", fontSize: 12,
                  fontWeight: activeNav === item ? 700 : 400,
                  whiteSpace: "nowrap",
                }}
              >
                {item}
              </button>
            </li>
          ))}
        </ul>
      </nav>

      {/* ── Breadcrumbs + Filters ── */}
      <div style={{ background: "#fff", borderBottom: "1px solid #e2e8f0", padding: "8px 20px", display: "flex", gap: 8, alignItems: "center", fontSize: 12, color: "#64748b" }}>
        <a href="#!" style={{ color: "#6366f1", textDecoration: "none" }}>Home</a>
        <span>›</span>
        <a href="#!" style={{ color: "#6366f1", textDecoration: "none" }}>Workers</a>
        <span>›</span>
        <span>All Employees</span>
        <div style={{ marginLeft: "auto", display: "flex", gap: 8 }}>
          <select aria-label="Filter by department" style={{ fontSize: 12, border: "1px solid #e2e8f0", borderRadius: 4, padding: "3px 6px" }}>
            <option>All Departments</option>
            <option>Engineering</option>
            <option>Product</option>
          </select>
          <select aria-label="Filter by status" style={{ fontSize: 12, border: "1px solid #e2e8f0", borderRadius: 4, padding: "3px 6px" }}>
            <option>All Statuses</option>
            <option>Active</option>
            <option>On Leave</option>
          </select>
        </div>
      </div>

      {/* ── Main Content — skip link target ── */}
      <main
        id="hcm-main-content"
        ref={mainRef}
        tabIndex={-1}   /* ← CRITICAL: allows programmatic focus on non-interactive element */
        aria-label="Employee records"
        style={{ padding: 20, minHeight: 280, background: "#f8fafc", outline: "none" }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <h2 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: "#1e293b" }}>
            All Employees
            <span style={{ color: "#64748b", fontWeight: 400, fontSize: 13, marginLeft: 8 }}>({EMPLOYEE_RECORDS.length} records)</span>
          </h2>
          <button style={{
            background: "#6366f1", color: "#fff",
            border: "none", borderRadius: 6, padding: "7px 14px",
            cursor: "pointer", fontSize: 13, fontWeight: 600,
          }}>
            + Add Worker
          </button>
        </div>

        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
          <thead>
            <tr style={{ background: "#f1f5f9" }}>
              {["Employee ID", "Name", "Department", "Status"].map(h => (
                <th key={h} style={{ textAlign: "left", padding: "8px 12px", color: "#475569", fontWeight: 600, borderBottom: "2px solid #e2e8f0" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {EMPLOYEE_RECORDS.map(emp => (
              <tr key={emp.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                <td style={{ padding: "10px 12px", color: "#6366f1", fontFamily: "monospace", fontSize: 12 }}>{emp.id}</td>
                <td style={{ padding: "10px 12px", color: "#1e293b", fontWeight: 500 }}>
                  <a href="#!" style={{ color: "#1e293b", textDecoration: "none" }}>{emp.name}</a>
                </td>
                <td style={{ padding: "10px 12px", color: "#475569" }}>{emp.dept}</td>
                <td style={{ padding: "10px 12px" }}>
                  <span style={{
                    background: emp.status === "Active" ? "#dcfce7" : "#fef3c7",
                    color: emp.status === "Active" ? "#166534" : "#92400e",
                    padding: "2px 8px", borderRadius: 10, fontSize: 11, fontWeight: 600,
                  }}>
                    {emp.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </main>

      {/* ── Tab counter overlay ── */}
      <div style={{
        background: "#fff", borderTop: "1px solid #e2e8f0",
        padding: "8px 20px",
        display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 12,
      }}>
        <span style={{ color: "#64748b" }}>
          <kbd style={{ background: "#f1f5f9", border: "1px solid #e2e8f0", borderRadius: 3, padding: "1px 5px" }}>Tab</kbd>
          {" "}presses counted:{" "}
          <strong style={{ color: tabCount > 15 ? "#ef4444" : "#1e293b" }}>{tabCount}</strong>
          {tabCount > 15 && <span style={{ color: "#ef4444", marginLeft: 6 }}>— without skip link, user needs 15+ tabs to reach content!</span>}
        </span>
        <button
          onClick={() => setTabCount(0)}
          style={{ background: "none", border: "1px solid #e2e8f0", borderRadius: 4, padding: "3px 10px", cursor: "pointer", fontSize: 11, color: "#64748b" }}
        >
          Reset counter
        </button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
// Main Demo Component
// ─────────────────────────────────────────────────────────────────
export function SkipLinkDemo() {
  const [activeTab, setActiveTab] = useState<"demo" | "features" | "code">("demo");

  return (
    <div style={{
      background: "#0f172a", color: "#f1f5f9",
      fontFamily: "'Inter', system-ui, sans-serif",
      minHeight: "100vh", padding: 24,
    }}>

      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
          <span style={{ fontSize: 28 }}>⤵</span>
          <div>
            <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800 }}>
              Skip Navigation Links — Workday HCM
            </h1>
            <p style={{ margin: 0, color: "#64748b", fontSize: 13 }}>
              WCAG 2.1 SC 2.4.1 · Visually Hidden · Focus-Reveal · tabIndex={-1} on target
            </p>
          </div>
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {["WCAG SC 2.4.1", "visually-hidden CSS", "tabIndex={-1}", "focus-reveal", "first in DOM", "keyboard only", "Level A"].map(t => (
            <span key={t} style={{ background: "#1e293b", color: "#94a3b8", border: "1px solid #334155", borderRadius: 20, padding: "3px 10px", fontSize: 11 }}>{t}</span>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 4, marginBottom: 20, borderBottom: "1px solid #1e293b", paddingBottom: 4 }}>
        {[
          { id: "demo"     as const, label: "⤵ Live Demo" },
          { id: "features" as const, label: "♿ A11y Details" },
          { id: "code"     as const, label: "🔬 Implementation" },
        ].map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{
            background: activeTab === tab.id ? "#1e293b" : "transparent",
            color: activeTab === tab.id ? "#f1f5f9" : "#64748b",
            border: activeTab === tab.id ? "1px solid #334155" : "1px solid transparent",
            borderRadius: "8px 8px 0 0",
            padding: "8px 18px", cursor: "pointer", fontSize: 13, fontWeight: 600,
          }}>{tab.label}</button>
        ))}
      </div>

      {/* ── Demo Tab ── */}
      {activeTab === "demo" && (
        <div style={{ maxWidth: 900 }}>

          {/* Instruction card */}
          <div style={{
            background: "#1e293b", border: "1px solid #6366f140",
            borderLeft: "4px solid #6366f1",
            borderRadius: 10, padding: "14px 18px", marginBottom: 20,
          }}>
            <div style={{ fontWeight: 700, color: "#a5b4fc", marginBottom: 8, fontSize: 14 }}>
              🧪 Try it yourself — keyboard only
            </div>
            <ol style={{ margin: 0, paddingLeft: 20, color: "#94a3b8", fontSize: 13, lineHeight: 2 }}>
              <li><strong style={{ color: "#f1f5f9" }}>Click anywhere inside the HCM page below</strong> to focus it</li>
              <li>Press <kbd style={{ background: "#0f172a", border: "1px solid #334155", borderRadius: 4, padding: "2px 6px", fontFamily: "monospace" }}>Tab</kbd> once — a <strong style={{ color: "#fbbf24" }}>"Skip to main content"</strong> button slides into view at the top-left</li>
              <li>Press <kbd style={{ background: "#0f172a", border: "1px solid #334155", borderRadius: 4, padding: "2px 6px", fontFamily: "monospace" }}>Enter</kbd> — focus jumps directly to the employee records table (skipping 15+ tab stops)</li>
              <li>Or press <kbd style={{ background: "#0f172a", border: "1px solid #334155", borderRadius: 4, padding: "2px 6px", fontFamily: "monospace" }}>Tab</kbd> again to see "Skip to search" and "Skip to navigation" links</li>
              <li>Without skip links: keep pressing <kbd style={{ background: "#0f172a", border: "1px solid #334155", borderRadius: 4, padding: "2px 6px", fontFamily: "monospace" }}>Tab</kbd> to count how many presses it takes to reach the table</li>
            </ol>
          </div>

          <HCMPageSimulation />

          {/* WCAG callout */}
          <div style={{
            marginTop: 20, background: "#1e293b",
            border: "1px solid #fbbf2440",
            borderLeft: "4px solid #fbbf24",
            borderRadius: 10, padding: "14px 18px",
          }}>
            <div style={{ fontWeight: 700, color: "#fbbf24", marginBottom: 6, fontSize: 13 }}>
              📋 WCAG 2.1 — Success Criterion 2.4.1 Bypass Blocks (Level A)
            </div>
            <p style={{ margin: 0, color: "#94a3b8", fontSize: 13, lineHeight: 1.7 }}>
              "A mechanism is available to bypass blocks of content that are repeated on multiple Web pages."
              — This is a <strong style={{ color: "#f1f5f9" }}>Level A</strong> requirement, meaning it's the minimum baseline
              for any accessible web app. Failing this means the app fails WCAG compliance entirely for keyboard users.
            </p>
          </div>
        </div>
      )}

      {/* ── A11y Details Tab ── */}
      {activeTab === "features" && (
        <div style={{ maxWidth: 800, display: "flex", flexDirection: "column", gap: 16 }}>
          {[
            {
              title: "Why Skip Links Are Necessary",
              color: "#ef4444", icon: "❌",
              items: [
                { label: "Dense HCM navigation",      desc: "Workday has 12+ top-level nav items, each with sub-menus, breadcrumbs, and filters — all before the actual data" },
                { label: "Keyboard/screen reader cost", desc: "Without a skip link, a Tab user presses Tab 15–20 times per page load just to reach the primary content area" },
                { label: "Every page repeat",          desc: "The header and nav repeat on EVERY page — multiplied by dozens of daily navigations in a working HCM session" },
                { label: "Legal exposure",             desc: "WCAG 2.4.1 is Level A — failing it means the product is non-compliant with ADA, Section 508, and EN 301 549" },
              ],
            },
            {
              title: "The Visually-Hidden CSS Technique",
              color: "#6366f1", icon: "👁",
              items: [
                { label: "NOT display:none",           desc: "display:none removes element from accessibility tree — screen readers can't find it at all" },
                { label: "NOT visibility:hidden",      desc: "visibility:hidden also hides from AT, defeating the purpose" },
                { label: "NOT opacity:0",              desc: "opacity:0 is discoverable by AT but still focusable and clickable — causes confusion" },
                { label: "clip: rect(0,0,0,0)",        desc: "Clips to zero-size visual area but keeps element in DOM and accessibility tree" },
                { label: "width:1px, height:1px",     desc: "Physically tiny — cannot be clicked accidentally — but still occupies tab order" },
                { label: "On :focus → restore",        desc: "When Tab reaches the link, remove clip/size restrictions to show the button visually" },
              ],
            },
            {
              title: "tabIndex={-1} on the Target Element",
              color: "#10b981", icon: "🎯",
              items: [
                { label: "Non-interactive elements",   desc: "<main>, <div>, <section> cannot receive programmatic focus by default — they are not in the native focus model" },
                { label: "element.focus() silently fails", desc: "Calling focus() on an element without tabIndex=-1 does nothing — the skip link 'works' but the user goes nowhere" },
                { label: "tabIndex=-1 = focusable, not tabbable", desc: "-1 allows JavaScript to focus the element but removes it from the Tab key order (users can't Tab TO it)" },
                { label: "Required on <main>",         desc: 'id="main-content" tabIndex={-1} is the minimum required on the skip target — no other attributes needed' },
                { label: "outline:none on target",     desc: "The <main> element should have outline:none since it only receives focus programmatically, not via user Tab" },
              ],
            },
            {
              title: "Multiple Skip Links — Workday HCM Pattern",
              color: "#f59e0b", icon: "⤵",
              items: [
                { label: "Skip to main content",       desc: "Most important — jumps past header + nav + breadcrumbs to the employee record / form / dashboard" },
                { label: "Skip to search",             desc: "Workday's search is frequently used — giving it a skip link reduces friction for search-centric workflows" },
                { label: "Skip to navigation",         desc: "When already in content area and user wants to return to nav — reverse skip for efficiency" },
                { label: "Order matters",              desc: "Skip links must be the FIRST elements in DOM — before <header>, <nav>, everything — to appear first in Tab order" },
                { label: "Progressive disclosure",     desc: "Only the first 'Skip to main content' is critical; others appear on further Tab presses to avoid overwhelming users" },
              ],
            },
            {
              title: "Focus Reveal Animation — UX Detail",
              color: "#a78bfa", icon: "✨",
              items: [
                { label: "Without animation",          desc: "The skip button appears/disappears abruptly — sighted keyboard users may miss it entirely" },
                { label: "transform: translateY",      desc: "Sliding from -8px to 0 on focus gives 150ms to register the button before pressing Enter" },
                { label: "High contrast styling",       desc: "Dark background (#1e1b4b) + white text + yellow outline ring — 7:1 contrast ratio (WCAG AAA)" },
                { label: "Fixed positioning",          desc: "position:fixed ensures the link appears even if the page is scrolled down when focus arrives" },
                { label: "z-index:9999",               desc: "Must be above all modals, overlays, and sticky headers — always visible when focused" },
              ],
            },
          ].map(section => (
            <div key={section.title} style={{
              background: "#1e293b",
              border: `1px solid ${section.color}30`,
              borderLeft: `4px solid ${section.color}`,
              borderRadius: 10, padding: 16,
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                <span style={{ fontSize: 20 }}>{section.icon}</span>
                <h3 style={{ margin: 0, color: section.color, fontSize: 14, fontWeight: 700 }}>{section.title}</h3>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {section.items.map(item => (
                  <div key={item.label} style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
                    <code style={{
                      background: "#0f172a", color: "#7dd3fc",
                      padding: "1px 7px", borderRadius: 4, fontSize: 11,
                      whiteSpace: "nowrap", minWidth: 200, flexShrink: 0,
                      fontFamily: "monospace",
                    }}>{item.label}</code>
                    <span style={{ color: "#94a3b8", fontSize: 12, lineHeight: 1.7, paddingTop: 1 }}>{item.desc}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Implementation Tab ── */}
      {activeTab === "code" && (
        <div style={{ maxWidth: 860, display: "flex", flexDirection: "column", gap: 16 }}>

          {[
            {
              title: "1. The Visually-Hidden CSS (most important)",
              color: "#6366f1",
              code: `/* ❌ WRONG — hidden from screen readers too */
.skip-link { display: none; }
.skip-link { visibility: hidden; }

/* ✅ CORRECT — in DOM + accessible tree, zero visual footprint */
.skip-link {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;          /* prevent any layout impact */
  overflow: hidden;
  clip: rect(0, 0, 0, 0); /* clips visual rendering to nothing */
  white-space: nowrap;
  border-width: 0;
}

/* Reveal on focus — slides in from slightly above */
.skip-link:focus {
  position: fixed;       /* stays visible even if page is scrolled */
  top: 16px;
  left: 16px;
  z-index: 9999;         /* above everything */
  width: auto;
  height: auto;
  clip: auto;            /* remove clip */
  overflow: visible;
  padding: 12px 20px;
  background: #1e1b4b;
  color: #fff;
  font-weight: bold;
  border-radius: 8px;
  outline: 3px solid #fbbf24; /* high-contrast focus ring */
  transform: translateY(0);
  transition: transform 0.15s ease;
}`,
            },
            {
              title: "2. React SkipLink component (with useState)",
              color: "#10b981",
              code: `function SkipLink({ href, label }: { href: string; label: string }) {
  // React approach: toggle styles via state instead of CSS :focus pseudo-class
  // Reason: Allows dynamic styling without a separate CSS file
  const [isFocused, setIsFocused] = useState(false);

  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    const target = document.querySelector<HTMLElement>(href);
    if (target) {
      target.focus();
      target.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  return (
    <a
      href={href}
      onClick={handleClick}
      onFocus={() => setIsFocused(true)}
      onBlur={() => setIsFocused(false)}
      style={isFocused ? visibleStyle : hiddenStyle}
    >
      ⤵ {label}
    </a>
  );
}

// Alternative: pure CSS approach (simpler, preferred when CSS files available)
// .skip-link:focus { /* see CSS above */ }`,
            },
            {
              title: "3. DOM structure — order is critical",
              color: "#f59e0b",
              code: `// ❌ WRONG: skip link after nav — too late, Tab reaches nav first
<body>
  <header> ... </header>
  <nav> ... </nav>  {/* user must Tab through all of this first */}
  <a href="#main" className="skip-link">Skip to content</a>  {/* too late! */}
  <main id="main"> ... </main>
</body>

// ✅ CORRECT: skip links are the VERY FIRST children of <body>
<body>
  {/* Skip links — appear FIRST in tab order */}
  <a href="#main-content" className="skip-link">Skip to main content</a>
  <a href="#search"       className="skip-link">Skip to search</a>
  <a href="#primary-nav"  className="skip-link">Skip to navigation</a>

  {/* Everything else follows */}
  <header> ... </header>
  <nav id="primary-nav" tabIndex={-1}> ... </nav>

  <main
    id="main-content"
    tabIndex={-1}        /* ← REQUIRED: allows programmatic focus */
    style={{ outline: "none" }}  /* don't show focus ring (set by JS, not user) */
  >
    ...page content...
  </main>
</body>`,
            },
            {
              title: "4. The tabIndex={-1} target — common mistake",
              color: "#ef4444",
              code: `// ❌ BUG: <main> without tabIndex=-1
// Clicking the skip link navigates to the anchor via URL hash,
// but keyboard focus STAYS on the skip link — user still must Tab.
<main id="main-content">  {/* No tabIndex — focus() fails silently */}
  <h1>Employees</h1>
  <table>...</table>
</main>

// ✅ FIX: tabIndex={-1} enables programmatic focus
<main
  id="main-content"
  tabIndex={-1}   // -1 = focusable via JS, NOT in Tab order
  style={{ outline: "none" }}  // suppress focus ring (focus is intentional/programmatic)
>
  <h1>Employees</h1>
  <table>...</table>
</main>

// After focus():
// Screen reader announces: "main landmark, Employees"
// Keyboard position: next Tab goes to first interactive element INSIDE main
// — exactly the expected behaviour ✅

// tabIndex values cheat sheet:
//  0  → In tab order (natural position based on DOM order)
// -1  → NOT in tab order, but focusable via .focus() in JavaScript
// >0  → Explicit tab order (AVOID — creates confusing non-linear tab order)`,
            },
            {
              title: "5. Testing checklist",
              color: "#a78bfa",
              code: `// Manual test procedure (no automation tool required):

// 1. Open the page
// 2. Press Tab once
//    → Expected: "Skip to main content" button appears top-left
//    → If nothing appears: skip link is missing or not first in DOM

// 3. Press Enter on the skip link
//    → Expected: focus moves to <main> (outline may flash briefly)
//    → Screen reader announces: landmark name + heading
//    → If nothing moves: <main> is missing tabIndex={-1}

// 4. Press Tab after skipping
//    → Expected: focus moves to FIRST interactive element inside <main>
//    → NOT back to header or nav — those are now "behind" focus

// 5. Verify screen reader (VoiceOver / NVDA)
//    → "Skip to main content, link" announced on first Tab
//    → After Enter: "main landmark" or "heading level 1, Employees"

// Automated test with jest-axe:
import { axe, toHaveNoViolations } from "jest-axe";
expect.extend(toHaveNoViolations);

it("has no WCAG violations", async () => {
  const { container } = render(<App />);
  const results = await axe(container, {
    rules: { "bypass": { enabled: true } }  // explicitly test SC 2.4.1
  });
  expect(results).toHaveNoViolations();
});`,
            },
          ].map(section => (
            <div key={section.title} style={{
              background: "#1e293b",
              border: `1px solid ${section.color}30`,
              borderLeft: `4px solid ${section.color}`,
              borderRadius: 10, padding: 16,
            }}>
              <h3 style={{ margin: "0 0 12px", color: section.color, fontSize: 14, fontWeight: 700 }}>
                {section.title}
              </h3>
              <pre style={{
                margin: 0, background: "#0f172a", color: "#94a3b8",
                padding: 14, borderRadius: 8, fontSize: 11,
                fontFamily: "monospace", lineHeight: 1.7,
                overflow: "auto",
              }}>
                <code>{section.code}</code>
              </pre>
            </div>
          ))}

          {/* Before/After comparison */}
          <div style={{
            background: "#1e293b",
            border: "1px solid #334155",
            borderRadius: 10, padding: 16,
          }}>
            <h3 style={{ margin: "0 0 12px", color: "#f1f5f9", fontSize: 14, fontWeight: 700 }}>
              📊 Before / After — Workday HCM keyboard UX
            </h3>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              <div style={{ background: "#0f172a", borderRadius: 8, padding: 14, borderLeft: "4px solid #ef4444" }}>
                <div style={{ color: "#ef4444", fontWeight: 700, fontSize: 12, marginBottom: 8 }}>❌ BEFORE — No skip link</div>
                {[
                  "Tab ×1  → Logo link",
                  "Tab ×2  → Home nav item",
                  "Tab ×3  → Timesheets",
                  "Tab ×4  → Benefits",
                  "Tab ×5  → Pay",
                  "Tab ×6-13 → remaining nav items...",
                  "Tab ×14 → Search input",
                  "Tab ×15 → Notifications button",
                  "Tab ×16 → Profile button",
                  "Tab ×17 → Help button",
                  "Tab ×18 → Breadcrumb link 1",
                  "Tab ×19 → Breadcrumb link 2",
                  "Tab ×20 → Department filter",
                  "Tab ×21 → Status filter",
                  "Tab ×22 → First employee link ← actual content!",
                ].map((s, i) => (
                  <div key={i} style={{ color: i > 12 ? "#ef4444" : "#64748b", fontSize: 11, fontFamily: "monospace", marginBottom: 2 }}>{s}</div>
                ))}
              </div>
              <div style={{ background: "#0f172a", borderRadius: 8, padding: 14, borderLeft: "4px solid #4ade80" }}>
                <div style={{ color: "#4ade80", fontWeight: 700, fontSize: 12, marginBottom: 8 }}>✅ AFTER — With skip link</div>
                {[
                  "Tab ×1  → 'Skip to main content' link (revealed!)",
                  "Enter   → focus → <main id='main-content'>",
                  "Tab ×2  → First employee link ← actual content!",
                  "",
                  "That's it. 2 presses instead of 22.",
                  "",
                  "Or if user wants nav:",
                  "Tab ×1  → 'Skip to main content'",
                  "Tab ×2  → 'Skip to search'",
                  "Tab ×3  → 'Skip to navigation'",
                  "Enter   → focus → <nav id='primary-nav'>",
                ].map((s, i) => (
                  <div key={i} style={{ color: i < 3 ? "#4ade80" : "#64748b", fontSize: 11, fontFamily: "monospace", marginBottom: 2 }}>{s || "\u00a0"}</div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default SkipLinkDemo;
