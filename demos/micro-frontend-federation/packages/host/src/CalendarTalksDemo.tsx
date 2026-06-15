/**
 * CalendarTalksDemo.tsx
 *
 * Slide-deck style presentation viewer for two conference talks:
 *
 * TALK A — "Calendar Accessibility Done Right"
 *   Bay Area Accessibility and Inclusive Design Meetup
 *   Covers: WAI-ARIA Grid pattern, roving tabIndex, keyboard navigation algorithm,
 *   screen reader announcements, focus trap, WCAG mapping, testing strategies
 *
 * TALK B — "Calendar Architecture & Design at Scale"
 *   Company Organizational Conference
 *   Covers: Data model design, recurring event expansion, timezone architecture,
 *   Redux state shape, virtual scrolling, headless calendar pattern, perf metrics
 *
 * DEMO FEATURES
 *   - Full slide navigator with progress bar and keyboard shortcuts
 *   - Speaker notes panel (toggle N key)
 *   - Embedded live code blocks with syntax-highlighted examples
 *   - Interactive live calendar embedded in relevant slides
 *   - Jump-to-slide panel
 *   - Presenter mode (hide notes, full canvas)
 */

import React, {
  useState,
  useEffect,
  useCallback,
  useRef,
  KeyboardEvent as RKE,
} from "react";

// ─────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────

interface Slide {
  id: number;
  title: string;
  layout: "title" | "two-col" | "code" | "demo" | "list" | "quote" | "diagram";
  content: React.ReactNode;
  notes: string;
  tag?: string;
}

// ─────────────────────────────────────────────────────────────────
// Shared helpers
// ─────────────────────────────────────────────────────────────────

function Code({ children, lang = "tsx" }: { children: string; lang?: string }) {
  return (
    <pre style={{
      background: "#0a0f1e", border: "1px solid #334155",
      borderRadius: 8, padding: "12px 14px", margin: 0,
      fontSize: 11, fontFamily: "monospace", lineHeight: 1.7,
      color: "#94a3b8", overflow: "auto", maxHeight: 320,
    }}>
      <code>{children}</code>
    </pre>
  );
}

function Tag({ children, color = "#6366f1" }: { children: string; color?: string }) {
  return (
    <span style={{
      background: color + "20", color, border: `1px solid ${color}40`,
      borderRadius: 20, padding: "3px 10px", fontSize: 11, fontWeight: 700,
    }}>{children}</span>
  );
}

function Check({ children }: { children: string }) {
  return (
    <div style={{ display: "flex", gap: 10, alignItems: "flex-start", marginBottom: 8 }}>
      <span style={{ color: "#4ade80", fontSize: 14, flexShrink: 0, marginTop: 1 }}>✓</span>
      <span style={{ color: "#cbd5e1", fontSize: 13, lineHeight: 1.5 }}>{children}</span>
    </div>
  );
}

function Bullet({ children, color = "#6366f1" }: { children: string; color?: string }) {
  return (
    <div style={{ display: "flex", gap: 10, alignItems: "flex-start", marginBottom: 8 }}>
      <span style={{ color, fontSize: 10, flexShrink: 0, marginTop: 4 }}>◆</span>
      <span style={{ color: "#cbd5e1", fontSize: 13, lineHeight: 1.6 }}>{children}</span>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
// Mini live calendar — embedded in relevant slides
// ─────────────────────────────────────────────────────────────────

const DAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

function MiniCalendar() {
  const today = new Date();
  const [year, setYear]   = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());
  const [focused, setFocused] = useState(today.getDate());
  const [selected, setSelected] = useState<number | null>(null);

  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells = [...Array(firstDay).fill(null), ...Array.from({ length: daysInMonth }, (_, i) => i + 1)];

  const handleKeyDown = (e: RKE<HTMLTableElement>) => {
    const max = daysInMonth;
    if (e.key === "ArrowRight") { e.preventDefault(); setFocused(f => Math.min(f + 1, max)); }
    if (e.key === "ArrowLeft")  { e.preventDefault(); setFocused(f => Math.max(f - 1, 1)); }
    if (e.key === "ArrowDown")  { e.preventDefault(); setFocused(f => Math.min(f + 7, max)); }
    if (e.key === "ArrowUp")    { e.preventDefault(); setFocused(f => Math.max(f - 7, 1)); }
    if (e.key === "Home")       { e.preventDefault(); setFocused(1); }
    if (e.key === "End")        { e.preventDefault(); setFocused(max); }
    if (e.key === "PageDown")   { e.preventDefault(); const nm = (month + 1) % 12; setMonth(nm); if (nm === 0) setYear(y => y + 1); }
    if (e.key === "PageUp")     { e.preventDefault(); const pm = (month - 1 + 12) % 12; setMonth(pm); if (pm === 11) setYear(y => y - 1); }
    if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setSelected(focused); }
  };

  const monthName = new Date(year, month).toLocaleString("en", { month: "long" });

  return (
    <div style={{ background: "#1e293b", borderRadius: 12, padding: 16, width: 260, border: "1px solid #334155" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
        <button
          onClick={() => { const pm = (month - 1 + 12) % 12; setMonth(pm); if (pm === 11) setYear(y => y - 1); }}
          aria-label="Previous month"
          style={{ background: "none", border: "1px solid #334155", borderRadius: 4, color: "#94a3b8", cursor: "pointer", width: 24, height: 24, fontSize: 12 }}
        >‹</button>
        <div aria-live="polite" style={{ fontSize: 13, fontWeight: 700, color: "#f1f5f9" }}>
          {monthName} {year}
        </div>
        <button
          onClick={() => { const nm = (month + 1) % 12; setMonth(nm); if (nm === 0) setYear(y => y + 1); }}
          aria-label="Next month"
          style={{ background: "none", border: "1px solid #334155", borderRadius: 4, color: "#94a3b8", cursor: "pointer", width: 24, height: 24, fontSize: 12 }}
        >›</button>
      </div>

      {/* Grid */}
      <table
        role="grid"
        aria-label={`${monthName} ${year}`}
        onKeyDown={handleKeyDown}
        style={{ width: "100%", borderCollapse: "collapse" }}
      >
        <thead>
          <tr role="row">
            {DAYS.map(d => (
              <th key={d} abbr={d} scope="col" role="columnheader"
                style={{ fontSize: 10, color: "#64748b", padding: "3px 0", textAlign: "center", fontWeight: 700 }}>
                {d}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: Math.ceil(cells.length / 7) }, (_, ri) => (
            <tr key={ri} role="row">
              {cells.slice(ri * 7, ri * 7 + 7).map((day, ci) => {
                const isToday = day === today.getDate() && month === today.getMonth() && year === today.getFullYear();
                const isFocused = day === focused;
                const isSelected = day === selected;
                return (
                  <td key={ci} role="gridcell"
                    aria-label={day ? `${day} ${monthName} ${year}${isToday ? ", today" : ""}${isSelected ? ", selected" : ""}` : undefined}
                    aria-selected={day ? isSelected : undefined}
                    aria-disabled={!day}
                    tabIndex={isFocused && day ? 0 : -1}
                    onClick={() => day && (setFocused(day), setSelected(day))}
                    style={{
                      width: 32, height: 28, textAlign: "center", fontSize: 12,
                      borderRadius: 4, cursor: day ? "pointer" : "default",
                      background: isSelected ? "#6366f1" : isToday ? "#6366f120" : "transparent",
                      color: !day ? "transparent" : isSelected ? "#fff" : isToday ? "#a5b4fc" : "#cbd5e1",
                      fontWeight: isToday || isSelected ? 700 : 400,
                      outline: isFocused && day ? "2px solid #6366f1" : "none",
                      outlineOffset: 1,
                    }}
                  >
                    {day}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>

      {selected && (
        <div aria-live="polite" style={{ marginTop: 8, fontSize: 11, color: "#7dd3fc", textAlign: "center" }}>
          Selected: {selected} {monthName} {year}
        </div>
      )}
      <div style={{ marginTop: 8, fontSize: 10, color: "#475569", textAlign: "center" }}>
        Arrow keys navigate · Enter/Space selects · Page ↑↓ changes month
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
// TALK A — Calendar Accessibility (12 slides)
// ─────────────────────────────────────────────────────────────────

const TALK_A_SLIDES: Slide[] = [
  {
    id: 1, layout: "title",
    title: "Calendar Accessibility Done Right",
    tag: "Bay Area A11y Meetup",
    notes: "Opening: Ask the audience — how many people use a keyboard to navigate complex date pickers? This sets up the problem space immediately.",
    content: (
      <div style={{ textAlign: "center" }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>📅</div>
        <h2 style={{ fontSize: 28, fontWeight: 800, margin: "0 0 12px", color: "#f1f5f9" }}>
          Calendar Accessibility Done Right
        </h2>
        <p style={{ color: "#64748b", fontSize: 15, margin: "0 0 24px" }}>
          WAI-ARIA Grid · Roving tabIndex · Keyboard Navigation · Screen Reader Announcements
        </p>
        <div style={{ display: "flex", gap: 8, justifyContent: "center", flexWrap: "wrap" }}>
          {["Bay Area Accessibility & Inclusive Design Meetup", "WCAG 2.1 AA", "30 min + Q&A"].map(t => (
            <Tag key={t} color="#6366f1">{t}</Tag>
          ))}
        </div>
      </div>
    ),
  },
  {
    id: 2, layout: "two-col",
    title: "The Problem — Most Calendars Fail Keyboard Users",
    tag: "Why This Matters",
    notes: "Show audience: open a popular booking site, press Tab, try to navigate to a date. Most fail. This affects ~26% of US adults with disabilities, plus power users who prefer keyboard.",
    content: (
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
        <div style={{ background: "#1e293b", border: "1px solid #ef444430", borderLeft: "4px solid #ef4444", borderRadius: 10, padding: 16 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: "#ef4444", marginBottom: 10 }}>❌ Common failures</div>
          {["div-based cells with onClick — not Tab focusable", "No keyboard navigation between dates", "Month change loses focus entirely", "No screen reader announcement on selection", "aria-label='calendar' alone — meaningless", "date inputs only — no spatial navigation"].map(f => (
            <div key={f} style={{ display: "flex", gap: 8, marginBottom: 6, fontSize: 12, color: "#94a3b8" }}>
              <span style={{ color: "#ef4444", flexShrink: 0 }}>✗</span>{f}
            </div>
          ))}
        </div>
        <div style={{ background: "#1e293b", border: "1px solid #4ade8030", borderLeft: "4px solid #4ade80", borderRadius: 10, padding: 16 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: "#4ade80", marginBottom: 10 }}>✅ WCAG Requirements</div>
          {["2.1.1 — All functionality via keyboard", "2.4.3 — Focus order is logical", "2.4.7 — Focus is visible", "4.1.2 — Name, role, value for all controls", "1.3.1 — Info conveyed without colour alone"].map(w => (
            <div key={w} style={{ display: "flex", gap: 8, marginBottom: 6, fontSize: 12, color: "#94a3b8" }}>
              <span style={{ color: "#4ade80", flexShrink: 0 }}>✓</span>{w}
            </div>
          ))}
        </div>
      </div>
    ),
  },
  {
    id: 3, layout: "code",
    title: "WAI-ARIA Grid Pattern for Calendars",
    tag: "ARIA Structure",
    notes: "The grid role is the semantic container that tells AT this is a 2D navigable widget. Every date cell gets gridcell role. The column headers (Su Mo Tu...) get columnheader. This gives screen readers the full spatial context.",
    content: (
      <Code>{`<!-- ✅ Correct semantic structure -->
<div role="application" aria-label="Date picker">

  <!-- Month navigation -->
  <div>
    <button aria-label="Previous month">‹</button>
    <div aria-live="polite" aria-atomic="true">June 2025</div>  <!-- ← live region! -->
    <button aria-label="Next month">›</button>
  </div>

  <!-- Calendar grid -->
  <table
    role="grid"                      <!-- 2D navigable widget -->
    aria-label="June 2025"           <!-- full name (not just the number) -->
    aria-describedby="grid-hint"
  >
    <thead>
      <tr role="row">
        <th scope="col" abbr="Sunday" role="columnheader">Su</th>
        <th scope="col" abbr="Monday" role="columnheader">Mo</th>
        <!-- ... -->
      </tr>
    </thead>
    <tbody>
      <tr role="row">
        <td
          role="gridcell"
          aria-label="1 June 2025"       <!-- full date for SR context -->
          aria-selected="true"           <!-- is this date selected? -->
          aria-disabled="false"          <!-- is it selectable? -->
          tabIndex={0}                   <!-- roving tabIndex focus -->
        >1</td>
        <td role="gridcell" aria-label="2 June 2025" tabIndex={-1}>2</td>
      </tr>
    </tbody>
  </table>

  <div id="grid-hint" style="display:none">
    Use arrow keys to navigate dates, Enter to select
  </div>
</div>`}</Code>
    ),
  },
  {
    id: 4, layout: "two-col",
    title: "Roving tabIndex — The Core Pattern",
    tag: "Focus Management",
    notes: "Roving tabIndex is fundamental to many complex ARIA widgets: grids, menus, radio groups, tab lists. The rule: exactly ONE element in the composite widget has tabIndex=0 at a time. All others: tabIndex=-1. Move the 0 with arrow keys.",
    content: (
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
        <div>
          <div style={{ fontSize: 13, fontWeight: 700, color: "#f59e0b", marginBottom: 10 }}>Concept</div>
          <div style={{ background: "#1e293b", borderRadius: 8, padding: 14, fontSize: 12, color: "#94a3b8", lineHeight: 1.7 }}>
            <p style={{ margin: "0 0 8px" }}>In a grid/menu/listbox, every cell is interactive but putting all 31 days in the tab order creates 31 Tab stops — unusable.</p>
            <p style={{ margin: "0 0 8px" }}><strong style={{ color: "#f59e0b" }}>Roving tabIndex:</strong> Only the "focused" cell has <code style={{ color: "#7dd3fc" }}>tabIndex=0</code>. Arrow keys update which cell owns the 0. All others have <code style={{ color: "#7dd3fc" }}>tabIndex=-1</code>.</p>
            <p style={{ margin: 0 }}>Result: 1 Tab stop into the grid, arrow keys navigate within it, Tab exits.</p>
          </div>
        </div>
        <div>
          <div style={{ fontSize: 13, fontWeight: 700, color: "#6366f1", marginBottom: 10 }}>Implementation</div>
          <Code>{`// focusedDate = the date that "owns" tabIndex=0
const [focusedDate, setFocusedDate] = useState(today);

// Each cell:
<td
  tabIndex={isSameDay(date, focusedDate) ? 0 : -1}
  ref={el => {
    // When focusedDate changes, DOM-focus the owning cell
    if (isSameDay(date, focusedDate)) el?.focus();
  }}
  onKeyDown={handleArrowKeys}
>

// Arrow key handler:
const move = (days: number) => {
  const next = addDays(focusedDate, days);
  setFocusedDate(next);
  // ref.focus() fires on next render ↑
};`}</Code>
        </div>
      </div>
    ),
  },
  {
    id: 5, layout: "code",
    title: "Complete Keyboard Navigation Algorithm",
    tag: "Keyboard Events",
    notes: "This is the full keyboard spec from APG (ARIA Practices Guide). These are not invented — they are defined in the ARIA spec. Any deviation confuses AT users who have memorised these patterns.",
    content: (
      <Code>{`// Full keyboard spec from WAI-ARIA Authoring Practices Guide
// https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/examples/datepicker-dialog/

const handleKeyDown = (e: KeyboardEvent) => {
  const cur = focusedDate;

  switch (e.key) {
    // ── Cell navigation ──────────────────────────────
    case "ArrowRight": e.preventDefault(); move(addDays(cur,  1)); break;
    case "ArrowLeft":  e.preventDefault(); move(addDays(cur, -1)); break;
    case "ArrowDown":  e.preventDefault(); move(addDays(cur,  7)); break;
    case "ArrowUp":    e.preventDefault(); move(addDays(cur, -7)); break;

    // ── Row boundaries ───────────────────────────────
    case "Home": {
      // Move to first day of current WEEK (per APG spec)
      e.preventDefault();
      const startOfWeek = startOfWeek(cur, { weekStartsOn: 0 });
      move(startOfWeek);
      break;
    }
    case "End": {
      // Move to last day of current WEEK
      e.preventDefault();
      const endOfWeek = endOfWeek(cur, { weekStartsOn: 0 });
      move(endOfWeek);
      break;
    }

    // ── Month navigation ─────────────────────────────
    case "PageDown": {
      e.preventDefault();
      // Same day, next month (or last valid day if month is shorter)
      move(addMonths(cur, 1));
      break;
    }
    case "PageUp": {
      e.preventDefault();
      move(addMonths(cur, -1));
      break;
    }

    // ── Ctrl variants — move by year ─────────────────
    case "PageDown": if (e.ctrlKey) { e.preventDefault(); move(addYears(cur, 1)); } break;
    case "PageUp":   if (e.ctrlKey) { e.preventDefault(); move(addYears(cur, -1)); } break;

    // ── Selection ────────────────────────────────────
    case "Enter":
    case " ":
      e.preventDefault();
      if (!isDisabled(cur)) selectDate(cur);
      break;

    // ── Close dialog ─────────────────────────────────
    case "Escape":
      e.preventDefault();
      closeDatepicker();
      triggerButton.current?.focus(); // ← always restore focus!
      break;
  }
};`}</Code>
    ),
  },
  {
    id: 6, layout: "demo",
    title: "Live Demo — Accessible Calendar Widget",
    tag: "Interactive",
    notes: "Let the audience try: Tab into the calendar, Arrow keys to navigate, Enter to select, Page Up/Down to change month, Escape to close. Ask screen reader users in the audience to try with VoiceOver/NVDA.",
    content: (
      <div style={{ display: "flex", gap: 32, alignItems: "flex-start", justifyContent: "center", flexWrap: "wrap" }}>
        <div>
          <div style={{ fontSize: 13, fontWeight: 700, color: "#6366f1", marginBottom: 10, textAlign: "center" }}>
            Live accessible calendar — try with keyboard only ↓
          </div>
          <MiniCalendar />
        </div>
        <div style={{ maxWidth: 280 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: "#f59e0b", marginBottom: 10 }}>Keyboard shortcuts</div>
          {[
            ["←→↑↓", "Navigate between dates"],
            ["Page ↑/↓", "Previous / next month"],
            ["Home", "First day of week"],
            ["End", "Last day of week"],
            ["Enter/Space", "Select date"],
          ].map(([key, desc]) => (
            <div key={key} style={{ display: "flex", gap: 12, marginBottom: 8, alignItems: "center" }}>
              <kbd style={{
                background: "#1e293b", border: "1px solid #334155", borderRadius: 4,
                padding: "2px 7px", fontSize: 11, color: "#7dd3fc",
                fontFamily: "monospace", minWidth: 72, textAlign: "center", flexShrink: 0,
              }}>{key}</kbd>
              <span style={{ fontSize: 12, color: "#94a3b8" }}>{desc}</span>
            </div>
          ))}
        </div>
      </div>
    ),
  },
  {
    id: 7, layout: "code",
    title: "Screen Reader Announcements — aria-live Regions",
    tag: "Screen Readers",
    notes: "This is the most commonly missed piece. Without aria-live, the screen reader announces nothing when you change months or select a date. The user is completely in the dark.",
    content: (
      <Code>{`// Two separate live regions for two types of announcements:

// 1. Month/year header — polite, updates when user navigates months
<div aria-live="polite" aria-atomic="true" className="sr-only">
  {/* VoiceOver/NVDA reads: "June 2025" when month changes */}
  {format(currentMonth, "MMMM yyyy")}
</div>

// 2. Selection confirmation — polite, speaks after user selects
<div aria-live="polite" aria-atomic="true" className="sr-only">
  {selectedDate
    ? \`Selected \${format(selectedDate, "EEEE, MMMM d, yyyy")}\`
    : ""}
  {/* VoiceOver: "Selected Wednesday, June 11, 2025" */}
</div>

// ── Why aria-atomic="true"?
// Without it: SR reads only the changed text portion ("11" not the full date)
// With it:    SR reads the ENTIRE content of the region → "June 2025"

// ── aria-live="assertive" vs "polite":
// "assertive" → interrupts whatever the SR is currently reading (use sparingly)
// "polite"    → waits for SR to finish current sentence → use for most updates

// ── Announce day label on FOCUS (not just on selection):
// Each cell should also have a full aria-label for the individual date:
<td
  aria-label={format(date, "EEEE, MMMM d, yyyy")}
  // VoiceOver: "Wednesday, June 11 2025" when arrow-keyed onto this cell
  // (the day-of-week tells sighted users what column they're in)
>
  {format(date, "d")}
</td>`}</Code>
    ),
  },
  {
    id: 8, layout: "list",
    title: "Testing Strategy for Calendar A11y",
    tag: "QA Process",
    notes: "Manual screen reader testing is mandatory — no automated tool catches everything. Recommend using both VoiceOver (macOS) and NVDA+Chrome (Windows) because they behave differently. NVDA with Chrome is the most common combination for Windows users.",
    content: (
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
        <div>
          <div style={{ fontSize: 13, fontWeight: 700, color: "#6366f1", marginBottom: 12 }}>Manual Testing</div>
          <Check>VoiceOver (macOS): Cmd+F5 → Tab → navigate with VO+arrow</Check>
          <Check>NVDA+Chrome (Win): most common SR combination</Check>
          <Check>JAWS+IE11: enterprise HCM requirement</Check>
          <Check>Tab through widget — verify logical order</Check>
          <Check>Focus visible at all times (outline never hidden)</Check>
          <Check>Month change: SR announces new month name</Check>
          <Check>Selection: SR announces full date string</Check>
        </div>
        <div>
          <div style={{ fontSize: 13, fontWeight: 700, color: "#10b981", marginBottom: 12 }}>Automated (jest-axe + play())</div>
          <Code>{`// jest-axe: structural checks
it("has no a11y violations", async () => {
  const { container } = render(<Calendar />);
  const results = await axe(container, {
    rules: {
      "aria-required-children": { enabled: true },
      "aria-allowed-attr": { enabled: true },
      "color-contrast": { enabled: true },
    },
  });
  expect(results).toHaveNoViolations();
});

// Storybook play(): behavioural
export const KeyboardNav: Story = {
  play: async ({ canvasElement }) => {
    const grid = within(canvasElement)
      .getByRole("grid");
    grid.focus();
    await userEvent.keyboard("{ArrowRight}");
    const focused = document.activeElement;
    expect(focused).toHaveAttribute(
      "role", "gridcell"
    );
  },
};`}</Code>
        </div>
      </div>
    ),
  },
  {
    id: 9, layout: "two-col",
    title: "WCAG 2.1 Compliance Map",
    tag: "Compliance",
    notes: "Map each implementation decision directly to the WCAG success criterion. This framing resonates with compliance teams and product managers who think in terms of legal requirements (ADA, Section 508).",
    content: (
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {[
          { sc: "1.3.1 Info & Relationships", impl: "role=grid, role=gridcell, aria-label on cells", level: "A" },
          { sc: "1.4.3 Contrast",             impl: "Focus outline 3:1+, selected date 4.5:1+",       level: "AA" },
          { sc: "2.1.1 Keyboard",             impl: "Full roving tabIndex + arrow key algorithm",      level: "A" },
          { sc: "2.4.3 Focus Order",          impl: "DOM order = visual order, no tabIndex > 0",      level: "A" },
          { sc: "2.4.7 Focus Visible",        impl: "outline: 2px solid on all interactive cells",    level: "AA" },
          { sc: "3.3.1 Error Identification", impl: "aria-invalid + describedby on disabled dates",   level: "A" },
          { sc: "4.1.2 Name, Role, Value",    impl: "aria-label, aria-selected, aria-disabled",       level: "A" },
        ].map(r => (
          <div key={r.sc} style={{
            display: "grid", gridTemplateColumns: "auto 1fr auto",
            gap: 12, alignItems: "center",
            background: "#1e293b", borderRadius: 8, padding: "8px 12px",
          }}>
            <span style={{ fontSize: 11, color: "#7dd3fc", fontWeight: 700, fontFamily: "monospace", whiteSpace: "nowrap" }}>{r.sc}</span>
            <span style={{ fontSize: 11, color: "#94a3b8" }}>{r.impl}</span>
            <span style={{
              fontSize: 10, fontWeight: 700, padding: "2px 7px", borderRadius: 10,
              background: r.level === "A" ? "#4ade8020" : "#6366f120",
              color: r.level === "A" ? "#4ade80" : "#a5b4fc",
            }}>Level {r.level}</span>
          </div>
        ))}
      </div>
    ),
  },
  {
    id: 10, layout: "quote",
    title: "Key Takeaway",
    tag: "Closing",
    notes: "End with this slide, then open Q&A. Common questions: 'Do we need to support JAWS?' — yes for enterprise. 'Does Chrome handle this natively?' — input[type=date] does, but custom pickers don't. Demonstrate with the live demo one more time.",
    content: (
      <div style={{ textAlign: "center", maxWidth: 640, margin: "0 auto" }}>
        <div style={{ fontSize: 48, marginBottom: 20 }}>💬</div>
        <blockquote style={{
          fontSize: 20, fontStyle: "italic", color: "#e2e8f0", lineHeight: 1.6,
          margin: "0 0 20px", borderLeft: "4px solid #6366f1", paddingLeft: 20, textAlign: "left",
        }}>
          "Accessibility is not a feature you add at the end.
          The roving tabIndex pattern, aria-live regions, and WCAG keyboard spec are
          all well-documented standards. The only reason they aren't implemented is
          that teams don't know about them. That's why we're here."
        </blockquote>
        <div style={{ display: "flex", gap: 16, justifyContent: "center", flexWrap: "wrap" }}>
          <a href="https://www.w3.org/WAI/ARIA/apg/patterns/grid/" target="_blank" rel="noopener noreferrer"
            style={{ color: "#7dd3fc", fontSize: 12 }}>WAI-ARIA APG Grid Pattern →</a>
          <a href="https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/examples/datepicker-dialog/" target="_blank" rel="noopener noreferrer"
            style={{ color: "#7dd3fc", fontSize: 12 }}>APG Datepicker Example →</a>
        </div>
      </div>
    ),
  },
];

// ─────────────────────────────────────────────────────────────────
// TALK B — Calendar Architecture (11 slides)
// ─────────────────────────────────────────────────────────────────

const TALK_B_SLIDES: Slide[] = [
  {
    id: 1, layout: "title",
    title: "Calendar Architecture & Design at Scale",
    tag: "Company Conference",
    notes: "Start with a war story: the old Workday calendar crashed on users with 500+ recurring events. That's the inciting incident for the complete rewrite.",
    content: (
      <div style={{ textAlign: "center" }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>🏗</div>
        <h2 style={{ fontSize: 28, fontWeight: 800, margin: "0 0 12px", color: "#f1f5f9" }}>
          Calendar Architecture & Design at Scale
        </h2>
        <p style={{ color: "#64748b", fontSize: 15, margin: "0 0 24px" }}>
          Data modelling · Recurring events · Timezone architecture · Virtual rendering · Headless patterns
        </p>
        <div style={{ display: "flex", gap: 8, justifyContent: "center", flexWrap: "wrap" }}>
          {["Company Org Conference", "45 min + Q&A", "Full rewrite"].map(t => (
            <Tag key={t} color="#f59e0b">{t}</Tag>
          ))}
        </div>
      </div>
    ),
  },
  {
    id: 2, layout: "diagram",
    title: "The Three Hard Problems in Calendar Engineering",
    tag: "Architecture Overview",
    notes: "These three problems compound each other. A recurring event that spans a timezone boundary on DST transition day — all three problems at once. This is what drove the rewrite.",
    content: (
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16 }}>
        {[
          {
            icon: "🔄", color: "#6366f1", title: "Recurring Events",
            desc: "RRule expansion is O(n×occurrences). 500 recurring events × 365 days = 182,500 instances. Expand lazily, not upfront.",
            bullets: ["RFC 5545 RRule spec", "EXDATE exceptions", "Modified instances", "Lazy window expansion"],
          },
          {
            icon: "🌐", color: "#0891b2", title: "Timezones",
            desc: "Never store or compute in local time. UTC + IANA timezone in every event record. DST makes wall-clock arithmetic wrong.",
            bullets: ["Store: UTC timestamps", "Display: user's tz (Intl API)", "Floating times: no-tz dates", "DST gap/fold handling"],
          },
          {
            icon: "⚡", color: "#10b981", title: "Performance",
            desc: "Month view = potentially 1,000+ event instances. Virtual rendering, memoized layout, and incremental loading.",
            bullets: ["Virtual row rendering", "Memoized event layout", "Incremental month load", "Web Worker RRule"],
          },
        ].map(p => (
          <div key={p.title} style={{
            background: "#1e293b", border: `1px solid ${p.color}30`,
            borderTop: `3px solid ${p.color}`, borderRadius: 10, padding: 14,
          }}>
            <div style={{ fontSize: 24, marginBottom: 8 }}>{p.icon}</div>
            <div style={{ fontSize: 13, fontWeight: 700, color: p.color, marginBottom: 6 }}>{p.title}</div>
            <div style={{ fontSize: 11, color: "#64748b", marginBottom: 10, lineHeight: 1.5 }}>{p.desc}</div>
            {p.bullets.map(b => <Bullet key={b} color={p.color}>{b}</Bullet>)}
          </div>
        ))}
      </div>
    ),
  },
  {
    id: 3, layout: "code",
    title: "Event Data Model — What Goes in the DB vs What Gets Computed",
    tag: "Data Design",
    notes: "Key decision: store the rule, not the instances. CalendarEvent is what we persist. CalendarInstance is computed at read time for a given date window. Never store instances in the database.",
    content: (
      <Code>{`// ── Persisted in database ─────────────────────────────────────────────

interface CalendarEvent {
  id:          string;       // stable ID — referenced by instances
  title:       string;
  description: string;
  creatorId:   string;

  // Timing — always UTC
  startUtc:    string;       // ISO 8601: "2025-06-11T09:00:00Z"
  endUtc:      string;
  timezone:    string;       // IANA: "Asia/Ho_Chi_Minh" (for display)
  allDay:      boolean;

  // Recurrence — RFC 5545 RRule string
  rrule:       string | null; // "FREQ=WEEKLY;BYDAY=MO,WE,FR;COUNT=52"
  exdates:     string[];      // UTC timestamps of excluded occurrences
  modifiedInstances: Record<string, Partial<CalendarEvent>>;
  //                            ↑ instanceStart → overrides for that specific occurrence

  // Classification
  calendarId:  string;
  status:      "confirmed" | "tentative" | "cancelled";
  visibility:  "public" | "private";
}

// ── Computed at read-time (never persisted) ─────────────────────────

interface CalendarInstance {
  event:         CalendarEvent;  // pointer to the rule event
  instanceStart: Date;           // this specific occurrence's start (local)
  instanceEnd:   Date;
  isModified:    boolean;        // true if overrides apply
  isAllDay:      boolean;
  displayTitle:  string;         // merged title from overrides
}

// ── Expansion function ──────────────────────────────────────────────

function expandRecurringEvent(
  event: CalendarEvent,
  windowStart: Date,
  windowEnd: Date
): CalendarInstance[] {
  if (!event.rrule) {
    // Non-recurring: check if it falls in window
    const start = parseISO(event.startUtc);
    return isWithinInterval(start, { start: windowStart, end: windowEnd })
      ? [{ event, instanceStart: start, instanceEnd: parseISO(event.endUtc), ... }]
      : [];
  }

  const rule = rrulestr(event.rrule, { dtstart: parseISO(event.startUtc) });
  return rule
    .between(windowStart, windowEnd, true)  // true = inclusive
    .filter(date => !isExcluded(date, event.exdates))
    .map(date => ({
      event,
      instanceStart: date,
      instanceEnd: addMilliseconds(date, durationMs(event)),
      isModified: !!event.modifiedInstances[date.toISOString()],
      ...event.modifiedInstances[date.toISOString()],  // apply overrides
    }));
}`}</Code>
    ),
  },
  {
    id: 4, layout: "code",
    title: "Timezone Architecture — Never Trust Wall-Clock Time",
    tag: "Timezones",
    notes: "The most common bug: storing Date.now() or new Date() without converting to UTC first. Another: using date-fns without timezone — it assumes local system timezone, which varies by server/browser.",
    content: (
      <Code>{`// ── WRONG — stores local time as UTC ─────────────────────────────
const event = {
  startUtc: new Date("2025-06-11 09:00").toISOString(),  // ❌ assumes local tz
};

// ── CORRECT — always convert explicitly ──────────────────────────
import { fromZonedTime, toZonedTime, formatInTimeZone } from "date-fns-tz";

// When user enters a time in a form:
function saveEvent(localTimeStr: string, userTimezone: string): string {
  // "2025-06-11T09:00" + "Asia/Ho_Chi_Minh" → UTC
  const utc = fromZonedTime(localTimeStr, userTimezone);
  return utc.toISOString(); // "2025-06-11T02:00:00Z" ← 7hr offset
}

// When displaying:
function displayTime(utcString: string, displayTimezone: string): string {
  // UTC → user's timezone for display
  return formatInTimeZone(
    new Date(utcString),
    displayTimezone,
    "h:mm a zzz"  // "9:00 AM ICT"
  );
}

// All-day events — special case (no timezone!):
interface AllDayEvent {
  startDate: string;  // "2025-06-11" — LOCAL calendar date, NO timezone
  endDate:   string;  // Stored as plain date string, not UTC timestamp
}
// Reason: "June 11th" should appear on June 11th in every timezone.
// If you store as UTC midnight, it shifts to June 10th for UTC-5 users.

// ── DST gap/fold detection ─────────────────────────────────────────
// When user schedules at 2:30 AM on DST spring-forward day → time doesn't exist
function isDSTGap(date: Date, timezone: string): boolean {
  const before = toZonedTime(subHours(date, 1), timezone);
  const after  = toZonedTime(addHours(date, 1), timezone);
  return getHours(after) - getHours(before) !== 2; // gap if difference ≠ 2
}`}</Code>
    ),
  },
  {
    id: 5, layout: "code",
    title: "Redux State Shape — Normalized Calendar Store",
    tag: "State Management",
    notes: "The key insight: events and instances are separate slices. Events are the ground truth (from the server). Instances are derived view state. The view window drives which instances are computed.",
    content: (
      <Code>{`// store/calendarSlice.ts
import { createSlice, createEntityAdapter, createAsyncThunk } from "@reduxjs/toolkit";
import { orgChartApi } from "./calendarApi";

// Normalized entity state — O(1) lookups
const eventsAdapter = createEntityAdapter<CalendarEvent>();

interface CalendarState {
  events:      ReturnType<typeof eventsAdapter.getInitialState>;
  viewWindow:  { start: string; end: string };   // current visible date range
  activeView:  "month" | "week" | "day" | "agenda";
  selectedEventId: string | null;
  displayTimezone: string;       // user preference (IANA)
  loading:     "idle" | "pending" | "fulfilled" | "rejected";
}

// RTK Query fetches events for the visible window
// Normalized cache: multiple windows share the same event entities
export const fetchEvents = createAsyncThunk(
  "calendar/fetchEvents",
  async ({ start, end, calendarIds }: FetchEventsArgs) => {
    const response = await api.get("/events", {
      params: { start, end, calendarIds: calendarIds.join(",") },
    });
    return response.data as CalendarEvent[];
  }
);

export const calendarSlice = createSlice({
  name: "calendar",
  initialState,
  reducers: {
    setViewWindow: (state, action: PayloadAction<{ start: string; end: string }>) => {
      state.viewWindow = action.payload;
    },
    setActiveView: (state, action: PayloadAction<CalendarState["activeView"]>) => {
      state.activeView = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchEvents.fulfilled, (state, action) => {
        // Merge — don't replace (preserve events from other windows)
        eventsAdapter.upsertMany(state.events, action.payload);
        state.loading = "fulfilled";
      });
  },
});

// Memoized selector: expands recurring events for current view window
export const selectInstancesForWindow = createSelector(
  [
    eventsAdapter.getSelectors((s: RootState) => s.calendar.events).selectAll,
    (s: RootState) => s.calendar.viewWindow,
  ],
  (events, window) =>
    events.flatMap(event =>
      expandRecurringEvent(event, new Date(window.start), new Date(window.end))
    )
);`}</Code>
    ),
  },
  {
    id: 6, layout: "code",
    title: "Headless Calendar Pattern — Logic vs Rendering",
    tag: "Architecture",
    notes: "The headless pattern is the most important architectural decision. It separates the calendar logic (navigation, selection, date math) from the UI. We ship a headless core that multiple surfaces use: web calendar, date picker, timeline view, print view.",
    content: (
      <Code>{`// useCalendar.ts — headless hook (no JSX)
// Inspired by Radix, React Aria, react-day-picker v8

export function useCalendar(options: CalendarOptions) {
  const [focusedDate, setFocusedDate] = useState(options.defaultDate ?? today());
  const [selectedDates, setSelected] = useState<Date[]>(options.defaultSelected ?? []);

  // Navigation
  const goToMonth = useCallback((date: Date) => setFocusedDate(startOfMonth(date)), []);
  const goToNext  = useCallback(() => goToMonth(addMonths(focusedDate, 1)), [focusedDate]);
  const goToPrev  = useCallback(() => goToMonth(subMonths(focusedDate, 1)), [focusedDate]);

  // Selection
  const selectDate = useCallback((date: Date) => {
    if (options.mode === "range") {
      setSelected(prev => buildRangeSelection(prev, date));
    } else if (options.mode === "multiple") {
      setSelected(prev => toggleInArray(prev, date));
    } else {
      setSelected([date]);
    }
    options.onSelect?.(date);
  }, [options]);

  // Grid data — generates rows of weeks for the current month
  const weeks: Week[] = useMemo(() =>
    generateMonthGrid(focusedDate, {
      weekStartsOn: options.weekStartsOn ?? 0,
      fixedWeeks: options.fixedWeeks ?? true,
    }),
  [focusedDate, options.weekStartsOn, options.fixedWeeks]);

  // Props getters — consumers spread onto their elements
  return {
    weeks,
    focusedDate,
    selectedDates,
    goToNext, goToPrev,

    // Headless API: caller provides their own DOM
    getDayProps: (date: Date) => ({
      tabIndex: isSameDay(date, focusedDate) ? 0 : -1,
      role: "gridcell" as const,
      "aria-selected": isSelected(date, selectedDates),
      "aria-disabled": options.isDisabled?.(date) ?? false,
      "aria-label": format(date, "EEEE, MMMM d, yyyy"),
      onClick: () => selectDate(date),
      onKeyDown: (e: KeyboardEvent) => handleDayKeyDown(e, date),
    }),

    getGridProps: () => ({
      role: "grid" as const,
      "aria-label": format(focusedDate, "MMMM yyyy"),
      "aria-multiselectable": options.mode === "multiple",
    }),
  };
}

// Consumer — provides their own UI:
function MyCalendar() {
  const calendar = useCalendar({ mode: "single", onSelect: console.log });
  return (
    <table {...calendar.getGridProps()}>
      {calendar.weeks.map((week) =>
        week.days.map((day) =>
          <td key={day.date.toISOString()} {...calendar.getDayProps(day.date)}>
            {day.date.getDate()}
          </td>
        )
      )}
    </table>
  );
}`}</Code>
    ),
  },
  {
    id: 7, layout: "two-col",
    title: "Performance: Month View Layout Algorithm",
    tag: "Performance",
    notes: "The naive approach: render all events, let the browser lay them out. This is O(n²) — every event checks overlap with every other. The correct approach: sort events, then sweep-line to detect overlaps and assign columns.",
    content: (
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
        <div>
          <div style={{ fontSize: 13, fontWeight: 700, color: "#ef4444", marginBottom: 10 }}>❌ Naive (O(n²))</div>
          <Code>{`// For each event, check all others for overlap
events.forEach(event => {
  events.forEach(other => {
    if (overlaps(event, other)) {
      // assign column — O(n²)
    }
  });
});
// 1000 events = 1,000,000 comparisons
// Freezes on load for calendars with many recurring events`}</Code>
        </div>
        <div>
          <div style={{ fontSize: 13, fontWeight: 700, color: "#4ade80", marginBottom: 10 }}>✅ Sweep-line (O(n log n))</div>
          <Code>{`// Sort by start time, sweep forward
const sorted = events.sort(
  (a, b) => a.start - b.start
);

const columns: Event[][] = [];

for (const event of sorted) {
  // Find first column where event fits
  const col = columns.find(c =>
    c.every(e => !overlaps(e, event))
  );
  if (col) { col.push(event); }
  else { columns.push([event]); }
}

// Assign left% and width% from column index
// Renders 1000 events in <5ms`}</Code>
        </div>
      </div>
    ),
  },
  {
    id: 8, layout: "list",
    title: "Results — Before & After the Rewrite",
    tag: "Impact",
    notes: "Close with metrics. These are the numbers that matter to engineering leadership. The JavaScript bundle reduction came from removing three calendar libraries we consolidated into the headless core.",
    content: (
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
        {[
          { metric: "Time to first paint (month view)",  before: "4.2s", after: "0.8s", unit: "", improvement: "5× faster" },
          { metric: "Event layout compute time",         before: "~800ms", after: "~12ms", unit: "", improvement: "67× faster" },
          { metric: "Calendar JS bundle size",           before: "182kB", after: "38kB", unit: "gzipped", improvement: "79% smaller" },
          { metric: "Recurring events supported",        before: "50",   after: "10,000+", unit: "", improvement: "200× more" },
          { metric: "axe-core a11y violations",          before: "23",   after: "0",    unit: "", improvement: "Level AA" },
          { metric: "Timezone bugs reported (Q1→Q2)",   before: "14",   after: "1",    unit: "bugs", improvement: "93% fewer" },
        ].map(r => (
          <div key={r.metric} style={{
            background: "#1e293b", border: "1px solid #334155", borderRadius: 10, padding: 14,
          }}>
            <div style={{ fontSize: 11, color: "#64748b", marginBottom: 8 }}>{r.metric}</div>
            <div style={{ display: "flex", alignItems: "baseline", gap: 10 }}>
              <span style={{ fontSize: 13, color: "#ef4444", textDecoration: "line-through" }}>{r.before}</span>
              <span style={{ fontSize: 18, fontWeight: 800, color: "#f1f5f9" }}>{r.after}</span>
              <span style={{ fontSize: 10, color: "#64748b" }}>{r.unit}</span>
            </div>
            <div style={{ fontSize: 11, color: "#4ade80", marginTop: 4, fontWeight: 600 }}>{r.improvement}</div>
          </div>
        ))}
      </div>
    ),
  },
];

// ─────────────────────────────────────────────────────────────────
// Slide viewer component
// ─────────────────────────────────────────────────────────────────

function SlideViewer({ slides, accentColor, talkTitle }: {
  slides: Slide[];
  accentColor: string;
  talkTitle: string;
}) {
  const [current, setCurrent] = useState(0);
  const [showNotes, setShowNotes] = useState(false);
  const [showJump, setShowJump] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const slide = slides[current];
  const total = slides.length;

  const go = useCallback((idx: number) => {
    setCurrent(Math.max(0, Math.min(total - 1, idx)));
  }, [total]);

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: globalThis.KeyboardEvent) => {
      if ((e.target as HTMLElement).tagName === "INPUT") return;
      if (e.key === "ArrowRight" || e.key === "ArrowDown") go(current + 1);
      if (e.key === "ArrowLeft"  || e.key === "ArrowUp")   go(current - 1);
      if (e.key === "n" || e.key === "N") setShowNotes(v => !v);
      if (e.key === "j" || e.key === "J") setShowJump(v => !v);
      if (e.key === "Home") go(0);
      if (e.key === "End") go(total - 1);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [current, go, total]);

  return (
    <div style={{ background: "#0a0f1e", borderRadius: 12, overflow: "hidden", border: "1px solid #334155" }}>
      {/* Presenter toolbar */}
      <div style={{
        display: "flex", alignItems: "center", gap: 8,
        padding: "8px 16px", background: "#0f172a", borderBottom: "1px solid #334155",
      }}>
        <span style={{ fontSize: 11, color: "#475569", flex: 1 }}>
          {talkTitle}
        </span>
        <span style={{ fontSize: 11, color: "#64748b" }}>
          {current + 1} / {total}
        </span>
        {slide.tag && <Tag color={accentColor}>{slide.tag}</Tag>}
        <button
          onClick={() => setShowNotes(v => !v)}
          title="Toggle speaker notes (N)"
          style={{
            background: showNotes ? accentColor + "20" : "none",
            border: `1px solid ${showNotes ? accentColor : "#334155"}`,
            borderRadius: 4, padding: "3px 8px",
            color: showNotes ? accentColor : "#475569", cursor: "pointer", fontSize: 11,
          }}
        >📝 Notes</button>
        <button
          onClick={() => setShowJump(v => !v)}
          title="Jump to slide (J)"
          style={{ background: "none", border: "1px solid #334155", borderRadius: 4, padding: "3px 8px", color: "#475569", cursor: "pointer", fontSize: 11 }}
        >☰ Slides</button>
      </div>

      {/* Progress bar */}
      <div style={{ height: 3, background: "#1e293b" }}>
        <div style={{ height: "100%", background: accentColor, width: `${((current + 1) / total) * 100}%`, transition: "width 0.3s" }} />
      </div>

      <div style={{ display: "flex" }}>
        {/* Jump-to panel */}
        {showJump && (
          <div style={{
            width: 200, borderRight: "1px solid #334155", overflowY: "auto",
            background: "#0f172a", maxHeight: 480,
          }}>
            {slides.map((s, i) => (
              <button
                key={s.id}
                onClick={() => { go(i); setShowJump(false); }}
                style={{
                  width: "100%", padding: "8px 12px", textAlign: "left",
                  background: i === current ? accentColor + "15" : "none",
                  border: "none", borderLeft: `3px solid ${i === current ? accentColor : "transparent"}`,
                  color: i === current ? "#f1f5f9" : "#64748b",
                  cursor: "pointer", fontSize: 11, lineHeight: 1.4,
                }}
              >
                <span style={{ color: accentColor, fontSize: 10 }}>{i + 1}.</span>{" "}{s.title}
              </button>
            ))}
          </div>
        )}

        {/* Main canvas */}
        <div ref={containerRef} style={{ flex: 1 }}>
          {/* Slide title */}
          <div style={{ padding: "16px 24px 0", borderBottom: "1px solid #1e293b" }}>
            <h2 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: "#f1f5f9" }}>
              {slide.title}
            </h2>
          </div>

          {/* Slide content */}
          <div style={{ padding: 24, minHeight: 380, overflowY: "auto" }}>
            {slide.content}
          </div>

          {/* Speaker notes */}
          {showNotes && (
            <div style={{
              padding: "12px 24px",
              borderTop: "1px solid #334155",
              background: "#0f172a",
            }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: accentColor, marginBottom: 4 }}>📝 Speaker Notes</div>
              <div style={{ fontSize: 12, color: "#64748b", lineHeight: 1.6 }}>{slide.notes}</div>
            </div>
          )}

          {/* Navigation */}
          <div style={{
            display: "flex", justifyContent: "space-between", alignItems: "center",
            padding: "10px 24px", borderTop: "1px solid #334155", background: "#0a0f1e",
          }}>
            <button
              onClick={() => go(current - 1)}
              disabled={current === 0}
              aria-label="Previous slide"
              style={{
                background: "none", border: "1px solid #334155", borderRadius: 6,
                padding: "6px 14px", color: current === 0 ? "#1e293b" : "#94a3b8",
                cursor: current === 0 ? "not-allowed" : "pointer", fontSize: 12,
              }}
            >← Prev</button>

            <div style={{ display: "flex", gap: 4 }}>
              {slides.map((_, i) => (
                <button
                  key={i}
                  onClick={() => go(i)}
                  aria-label={`Go to slide ${i + 1}`}
                  style={{
                    width: i === current ? 20 : 6, height: 6, borderRadius: 3,
                    background: i === current ? accentColor : "#334155",
                    border: "none", cursor: "pointer",
                    transition: "all 0.2s", padding: 0,
                  }}
                />
              ))}
            </div>

            <button
              onClick={() => go(current + 1)}
              disabled={current === total - 1}
              aria-label="Next slide"
              style={{
                background: current === total - 1 ? "none" : accentColor,
                border: `1px solid ${accentColor}`,
                borderRadius: 6, padding: "6px 14px",
                color: current === total - 1 ? "#1e293b" : "#fff",
                cursor: current === total - 1 ? "not-allowed" : "pointer", fontSize: 12, fontWeight: 600,
              }}
            >Next →</button>
          </div>
        </div>
      </div>

      <div style={{ padding: "6px 16px", background: "#0f172a", borderTop: "1px solid #1e293b", display: "flex", gap: 16 }}>
        {[["← →", "Navigate"], ["N", "Notes"], ["J", "Jump"], ["Home/End", "First/Last"]].map(([k, d]) => (
          <span key={k} style={{ fontSize: 10, color: "#334155" }}>
            <kbd style={{ background: "#1e293b", padding: "1px 4px", borderRadius: 3, border: "1px solid #334155", color: "#64748b", fontSize: 9 }}>{k}</kbd>
            {" "}{d}
          </span>
        ))}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
// Main Demo
// ─────────────────────────────────────────────────────────────────

export function CalendarTalksDemo() {
  const [activeTalk, setActiveTalk] = useState<"a11y" | "arch">("a11y");

  return (
    <div style={{
      background: "#0f172a", color: "#f1f5f9",
      fontFamily: "'Inter', system-ui, sans-serif",
      minHeight: "100vh", padding: 24,
    }}>
      {/* Header */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
          <span style={{ fontSize: 28 }}>🎙</span>
          <div>
            <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800 }}>Conference Talks — Calendar</h1>
            <p style={{ margin: 0, color: "#64748b", fontSize: 13 }}>
              Two talks: Bay Area A11y Meetup · Company Org Conference
            </p>
          </div>
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {["WAI-ARIA Grid", "Roving tabIndex", "RRule expansion", "Timezone architecture", "Headless pattern", "Sweep-line layout", "Redux slice design"].map(t => (
            <span key={t} style={{ background: "#1e293b", color: "#94a3b8", border: "1px solid #334155", borderRadius: 20, padding: "3px 10px", fontSize: 11 }}>{t}</span>
          ))}
        </div>
      </div>

      {/* Talk selector */}
      <div style={{ display: "flex", gap: 0, marginBottom: 20, borderRadius: 10, overflow: "hidden", border: "1px solid #334155", width: "fit-content" }}>
        <button
          onClick={() => setActiveTalk("a11y")}
          style={{
            background: activeTalk === "a11y" ? "#6366f1" : "#1e293b",
            color: activeTalk === "a11y" ? "#fff" : "#64748b",
            border: "none", padding: "10px 20px", cursor: "pointer", fontSize: 13, fontWeight: 600,
          }}
        >
          ♿ Talk A — Calendar Accessibility
          <span style={{ display: "block", fontSize: 10, fontWeight: 400, opacity: 0.8 }}>Bay Area A11y Meetup · {TALK_A_SLIDES.length} slides</span>
        </button>
        <button
          onClick={() => setActiveTalk("arch")}
          style={{
            background: activeTalk === "arch" ? "#f59e0b" : "#1e293b",
            color: activeTalk === "arch" ? "#fff" : "#64748b",
            border: "none", borderLeft: "1px solid #334155", padding: "10px 20px", cursor: "pointer", fontSize: 13, fontWeight: 600,
          }}
        >
          🏗 Talk B — Calendar Architecture
          <span style={{ display: "block", fontSize: 10, fontWeight: 400, opacity: 0.8 }}>Company Org Conference · {TALK_B_SLIDES.length} slides</span>
        </button>
      </div>

      {/* Slide viewer */}
      {activeTalk === "a11y" ? (
        <SlideViewer
          slides={TALK_A_SLIDES}
          accentColor="#6366f1"
          talkTitle="♿ Calendar Accessibility Done Right — Bay Area A11y Meetup"
        />
      ) : (
        <SlideViewer
          slides={TALK_B_SLIDES}
          accentColor="#f59e0b"
          talkTitle="🏗 Calendar Architecture & Design at Scale — Company Conference"
        />
      )}
    </div>
  );
}

export default CalendarTalksDemo;
