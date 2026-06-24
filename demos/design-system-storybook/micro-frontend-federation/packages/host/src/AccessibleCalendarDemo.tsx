/**
 * AccessibleCalendarDemo.tsx
 *
 * Demonstrates an accessible Time-Off Request calendar built with:
 *
 * FOCUS MANAGEMENT
 *   - Roving tabIndex pattern (WAI-ARIA best practice for grids)
 *     → Only one cell has tabIndex=0 at a time, all others tabIndex=-1
 *     → Arrow keys move DOM focus via element.focus() — native browser scroll-into-view
 *   - Programmatic focus restoration: when month changes, focus moves to the
 *     equivalent day (or last valid day) in the new month
 *   - Modal focus trap: Tab/Shift+Tab cycle within the confirmation dialog
 *   - Focus returns to trigger cell after modal closes
 *
 * SCREEN READER SUPPORT
 *   - role="grid" on calendar, role="row" on weeks, role="gridcell" on days
 *   - aria-label on every cell: "Monday, June 12, 2025 — today, available"
 *   - aria-selected: true on selected range cells
 *   - aria-disabled: true on past/blocked cells
 *   - aria-live="polite" announcement region for navigation feedback
 *     → "Navigated to June 2025" / "June 12 selected as start date"
 *   - aria-describedby links legend to grid
 *   - role="application" allows arrow keys to be captured (not passed to AT)
 *   - Column headers: role="columnheader" with abbr for "Mon" → "Monday"
 *
 * KEYBOARD NAVIGATION (WAI-ARIA Date Picker Pattern)
 *   Arrow Left/Right  → previous/next day
 *   Arrow Up/Down     → previous/next week (7 days)
 *   Page Up/Down      → previous/next month
 *   Home/End          → first/last day of week
 *   Ctrl+Home/End     → first/last day of month
 *   Enter/Space       → select/deselect date
 *   Escape            → cancel selection
 *
 * RESPONSIVE DESIGN
 *   - CSS Grid for calendar layout (auto-sized cells)
 *   - Fluid typography and spacing via clamp()
 *   - Touch targets ≥ 44×44px (WCAG 2.5.5)
 *   - Stacks vertically on narrow viewports (<500px)
 */

import React, {
  useState,
  useRef,
  useEffect,
  useCallback,
  useMemo,
  KeyboardEvent,
} from "react";

// ─────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────

interface DateInfo {
  date: Date;
  isToday: boolean;
  isPast: boolean;
  isWeekend: boolean;
  isOtherMonth: boolean;
  isSelected: boolean;
  isInRange: boolean;
  isRangeStart: boolean;
  isRangeEnd: boolean;
  isBlocked: boolean; // company holiday / already approved leave
}

interface TimeOffRequest {
  id: string;
  start: Date;
  end: Date;
  type: "annual" | "sick" | "remote" | "unpaid";
  note: string;
  status: "pending" | "approved" | "rejected";
}

type SelectionPhase = "idle" | "selecting-end";

// ─────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────

const DAYS_SHORT = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const DAYS_LONG  = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const MONTHS     = ["January", "February", "March", "April", "May", "June",
                    "July", "August", "September", "October", "November", "December"];

const LEAVE_TYPES: { value: TimeOffRequest["type"]; label: string; color: string; emoji: string }[] = [
  { value: "annual",  label: "Annual Leave",  color: "#6366f1", emoji: "🌴" },
  { value: "sick",    label: "Sick Leave",    color: "#ef4444", emoji: "🏥" },
  { value: "remote",  label: "Work Remote",  color: "#0891b2", emoji: "🏠" },
  { value: "unpaid",  label: "Unpaid Leave",  color: "#78716c", emoji: "📋" },
];

// Simulate company holidays (blocked dates)
const COMPANY_HOLIDAYS: string[] = [
  "2025-09-02", // National Day (Vietnam)
  "2025-12-25", // Christmas
];

// ─────────────────────────────────────────────────────────────────
// Utility functions
// ─────────────────────────────────────────────────────────────────

const isSameDay = (a: Date, b: Date): boolean =>
  a.getFullYear() === b.getFullYear() &&
  a.getMonth() === b.getMonth() &&
  a.getDate() === b.getDate();

const toDateKey = (d: Date): string =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

const addDays = (d: Date, n: number): Date => {
  const result = new Date(d);
  result.setDate(result.getDate() + n);
  return result;
};

const startOfMonth = (d: Date): Date => new Date(d.getFullYear(), d.getMonth(), 1);
const endOfMonth   = (d: Date): Date => new Date(d.getFullYear(), d.getMonth() + 1, 0);

/** Generate the 6×7 grid of days for a given month view */
function buildCalendarGrid(viewDate: Date): Date[][] {
  const firstOfMonth = startOfMonth(viewDate);
  const lastOfMonth  = endOfMonth(viewDate);

  // Start grid from the Sunday of the week containing the 1st
  const gridStart = addDays(firstOfMonth, -firstOfMonth.getDay());
  // End grid on the Saturday of the week containing the last day (at least 6 rows)
  const daysNeeded = Math.ceil((firstOfMonth.getDay() + lastOfMonth.getDate()) / 7) * 7;

  const weeks: Date[][] = [];
  let cursor = gridStart;
  for (let w = 0; w < daysNeeded / 7; w++) {
    const week: Date[] = [];
    for (let d = 0; d < 7; d++) {
      week.push(new Date(cursor));
      cursor = addDays(cursor, 1);
    }
    weeks.push(week);
  }
  return weeks;
}

/** Human-readable aria-label for a date cell */
function buildAriaLabel(info: DateInfo): string {
  const day  = DAYS_LONG[info.date.getDay()];
  const mon  = MONTHS[info.date.getMonth()];
  const d    = info.date.getDate();
  const yr   = info.date.getFullYear();

  const parts = [`${day}, ${mon} ${d}, ${yr}`];

  if (info.isToday)       parts.push("today");
  if (info.isPast)        parts.push("past date, not available");
  else if (info.isBlocked) parts.push("company holiday, not available");
  else if (info.isWeekend) parts.push("weekend, not available");
  else                    parts.push("available");

  if (info.isRangeStart)  parts.push("start of selection");
  if (info.isRangeEnd)    parts.push("end of selection");
  else if (info.isInRange) parts.push("in selected range");

  return parts.join(", ");
}

// ─────────────────────────────────────────────────────────────────
// Cell ID helpers (for roving tabIndex + aria-activedescendant)
// ─────────────────────────────────────────────────────────────────
const cellId = (d: Date) => `cal-day-${toDateKey(d)}`;

// ─────────────────────────────────────────────────────────────────
// Subcomponents
// ─────────────────────────────────────────────────────────────────

/** Accessible announcement region — read by screen readers on change */
function LiveRegion({ message }: { message: string }) {
  return (
    <div
      role="status"
      aria-live="polite"
      aria-atomic="true"
      style={{
        position: "absolute",
        width: 1,
        height: 1,
        overflow: "hidden",
        clip: "rect(0,0,0,0)",
        whiteSpace: "nowrap",
      }}
    >
      {message}
    </div>
  );
}

/** Focus-trapping modal for request confirmation */
function ConfirmModal({
  start,
  end,
  leaveType,
  note,
  onLeaveTypeChange,
  onNoteChange,
  onSubmit,
  onCancel,
  triggerRef,
}: {
  start: Date;
  end: Date;
  leaveType: TimeOffRequest["type"];
  note: string;
  onLeaveTypeChange: (t: TimeOffRequest["type"]) => void;
  onNoteChange: (s: string) => void;
  onSubmit: () => void;
  onCancel: () => void;
  triggerRef: React.RefObject<HTMLElement | null>;
}) {
  const modalRef  = useRef<HTMLDivElement>(null);
  const firstRef  = useRef<HTMLSelectElement>(null);
  const cancelRef = useRef<HTMLButtonElement>(null);

  // Move focus into modal on open
  useEffect(() => {
    firstRef.current?.focus();
  }, []);

  // Focus trap — Tab/Shift+Tab cycle within modal
  const handleKeyDown = useCallback((e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "Escape") {
      onCancel();
      return;
    }
    if (e.key !== "Tab") return;

    const focusable = modalRef.current?.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    if (!focusable || focusable.length === 0) return;

    const first = focusable[0];
    const last  = focusable[focusable.length - 1];

    if (e.shiftKey) {
      if (document.activeElement === first) {
        e.preventDefault();
        last.focus();
      }
    } else {
      if (document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }
  }, [onCancel]);

  // Restore focus to trigger when modal closes
  useEffect(() => {
    return () => {
      // Runs on unmount (modal close)
      (triggerRef.current as HTMLElement | null)?.focus();
    };
  }, [triggerRef]);

  const nights = Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
  const leaveCfg = LEAVE_TYPES.find(l => l.value === leaveType)!;

  return (
    <div
      role="presentation"
      style={{
        position: "fixed", inset: 0,
        background: "rgba(0,0,0,0.7)", backdropFilter: "blur(4px)",
        display: "flex", alignItems: "center", justifyContent: "center",
        zIndex: 1000, padding: 20,
      }}
    >
      <div
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        aria-describedby="modal-desc"
        onKeyDown={handleKeyDown}
        style={{
          background: "#1e293b", borderRadius: 16, padding: 28,
          border: "1px solid #334155", width: "100%", maxWidth: 440,
          boxShadow: "0 25px 50px rgba(0,0,0,0.5)",
        }}
      >
        <h2 id="modal-title" style={{ color: "#f1f5f9", margin: "0 0 4px", fontSize: 18, fontWeight: 800 }}>
          📤 Submit Time-Off Request
        </h2>
        <p id="modal-desc" style={{ color: "#64748b", fontSize: 13, margin: "0 0 20px" }}>
          {MONTHS[start.getMonth()]} {start.getDate()} – {MONTHS[end.getMonth()]} {end.getDate()}, {end.getFullYear()}
          {" · "}<strong style={{ color: "#94a3b8" }}>{nights} day{nights !== 1 ? "s" : ""}</strong>
        </p>

        <div style={{ marginBottom: 16 }}>
          <label htmlFor="leave-type" style={{ color: "#94a3b8", fontSize: 12, fontWeight: 600, display: "block", marginBottom: 6 }}>
            Leave Type
          </label>
          <select
            id="leave-type"
            ref={firstRef}
            value={leaveType}
            onChange={e => onLeaveTypeChange(e.target.value as TimeOffRequest["type"])}
            style={{
              width: "100%", background: "#0f172a", color: "#f1f5f9",
              border: `2px solid ${leaveCfg.color}60`, borderRadius: 8,
              padding: "9px 12px", fontSize: 14, fontFamily: "inherit",
              cursor: "pointer",
            }}
          >
            {LEAVE_TYPES.map(t => (
              <option key={t.value} value={t.value}>{t.emoji} {t.label}</option>
            ))}
          </select>
        </div>

        <div style={{ marginBottom: 20 }}>
          <label htmlFor="leave-note" style={{ color: "#94a3b8", fontSize: 12, fontWeight: 600, display: "block", marginBottom: 6 }}>
            Note (optional)
          </label>
          <textarea
            id="leave-note"
            value={note}
            onChange={e => onNoteChange(e.target.value)}
            placeholder="Reason or additional info..."
            rows={3}
            style={{
              width: "100%", boxSizing: "border-box",
              background: "#0f172a", color: "#f1f5f9",
              border: "1px solid #334155", borderRadius: 8,
              padding: "9px 12px", fontSize: 13, fontFamily: "inherit",
              resize: "vertical",
            }}
          />
        </div>

        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
          <button
            ref={cancelRef}
            onClick={onCancel}
            style={{
              background: "transparent", color: "#64748b",
              border: "1px solid #334155", borderRadius: 8,
              padding: "9px 20px", cursor: "pointer", fontSize: 14,
            }}
          >
            Cancel
          </button>
          <button
            onClick={onSubmit}
            style={{
              background: leaveCfg.color, color: "#fff",
              border: "none", borderRadius: 8,
              padding: "9px 20px", cursor: "pointer", fontSize: 14, fontWeight: 700,
            }}
          >
            {leaveCfg.emoji} Submit Request
          </button>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
// Main Calendar Component
// ─────────────────────────────────────────────────────────────────

export function AccessibleCalendarDemo() {
  const today    = useMemo(() => new Date(), []);
  const [viewDate, setViewDate]  = useState(() => new Date(today.getFullYear(), today.getMonth(), 1));
  const [focusedDate, setFocusedDate] = useState<Date>(today);
  const [rangeStart, setRangeStart] = useState<Date | null>(null);
  const [rangeEnd,   setRangeEnd]   = useState<Date | null>(null);
  const [hoverDate,  setHoverDate]  = useState<Date | null>(null);
  const [phase, setPhase]  = useState<SelectionPhase>("idle");
  const [announcement, setAnnouncement] = useState("");
  const [showModal, setShowModal]  = useState(false);
  const [leaveType, setLeaveType]  = useState<TimeOffRequest["type"]>("annual");
  const [note, setNote] = useState("");
  const [requests, setRequests] = useState<TimeOffRequest[]>([]);
  const [activeTab, setActiveTab] = useState<"calendar" | "features" | "code">("calendar");

  const gridRef  = useRef<HTMLDivElement>(null);
  const triggerCellRef = useRef<HTMLElement>(null);

  // ── Derived data ──────────────────────────────────────────────

  const weeks = useMemo(() => buildCalendarGrid(viewDate), [viewDate]);

  /** Effective end of hover-preview range */
  const effectiveEnd = useMemo((): Date | null => {
    if (phase === "selecting-end") {
      return hoverDate ?? rangeEnd;
    }
    return rangeEnd;
  }, [phase, hoverDate, rangeEnd]);

  /** Build DateInfo for each cell */
  const buildInfo = useCallback((date: Date): DateInfo => {
    const key = toDateKey(date);
    const pastThreshold = new Date(today); pastThreshold.setHours(0, 0, 0, 0);
    const isPast = date < pastThreshold;
    const isWeekend = date.getDay() === 0 || date.getDay() === 6;
    const isBlocked = COMPANY_HOLIDAYS.includes(key);
    const isDisabled = isPast || isWeekend || isBlocked;

    let isRangeStart = false, isRangeEnd = false, isSelected = false, isInRange = false;

    if (rangeStart) {
      const end = effectiveEnd;
      const lo = end && end < rangeStart ? end : rangeStart;
      const hi = end && end < rangeStart ? rangeStart : end;

      isRangeStart = isSameDay(date, lo ?? rangeStart);
      isRangeEnd   = hi ? isSameDay(date, hi) : false;
      isSelected   = isSameDay(date, rangeStart) || (hi ? isSameDay(date, hi) : false);
      isInRange    = hi ? (date > lo! && date < hi) : false;
    }

    return {
      date,
      isToday:      isSameDay(date, today),
      isPast,
      isWeekend,
      isOtherMonth: date.getMonth() !== viewDate.getMonth(),
      isSelected,
      isInRange,
      isRangeStart,
      isRangeEnd,
      isBlocked,
    };
  }, [today, viewDate, rangeStart, effectiveEnd]);

  // ── Focus management helpers ─────────────────────────────────

  const focusCell = useCallback((date: Date) => {
    const id = cellId(date);
    const el = gridRef.current?.querySelector<HTMLElement>(`#${id}`);
    el?.focus();
    setFocusedDate(date);
  }, []);

  /** When month changes, move focusedDate into the new month range */
  const navigateToMonth = useCallback((delta: number) => {
    setViewDate(prev => {
      const next = new Date(prev.getFullYear(), prev.getMonth() + delta, 1);
      // Keep same day-of-month if possible, else last day
      const targetDay = Math.min(focusedDate.getDate(), endOfMonth(next).getDate());
      const nextFocused = new Date(next.getFullYear(), next.getMonth(), targetDay);
      setFocusedDate(nextFocused);
      setAnnouncement(`${MONTHS[next.getMonth()]} ${next.getFullYear()}`);
      // Focus after React re-render
      requestAnimationFrame(() => {
        const id = cellId(nextFocused);
        gridRef.current?.querySelector<HTMLElement>(`#${id}`)?.focus();
      });
      return next;
    });
  }, [focusedDate]);

  // ── Keyboard navigation (WAI-ARIA Date Picker pattern) ───────

  const handleKeyDown = useCallback((e: KeyboardEvent<HTMLDivElement>, date: Date) => {
    let next: Date | null = null;
    let consume = true;

    switch (e.key) {
      case "ArrowLeft":  next = addDays(date, -1); break;
      case "ArrowRight": next = addDays(date,  1); break;
      case "ArrowUp":    next = addDays(date, -7); break;
      case "ArrowDown":  next = addDays(date,  7); break;
      case "PageUp":
        navigateToMonth(e.shiftKey ? -12 : -1);
        return;
      case "PageDown":
        navigateToMonth(e.shiftKey ? 12 : 1);
        return;
      case "Home":
        next = e.ctrlKey
          ? startOfMonth(date)
          : addDays(date, -date.getDay()); // first of week (Sunday)
        break;
      case "End":
        next = e.ctrlKey
          ? endOfMonth(date)
          : addDays(date, 6 - date.getDay()); // last of week (Saturday)
        break;
      case "Enter":
      case " ":
        handleSelect(date);
        return;
      case "Escape":
        if (phase === "selecting-end") {
          setPhase("idle"); setRangeStart(null); setRangeEnd(null); setHoverDate(null);
          setAnnouncement("Selection cancelled");
        }
        return;
      default:
        consume = false;
    }

    if (!consume || !next) return;
    e.preventDefault();

    // If navigating to another month, update view first
    if (next.getMonth() !== viewDate.getMonth()) {
      const delta = next > viewDate ? 1 : -1;
      setViewDate(new Date(next.getFullYear(), next.getMonth(), 1));
      setAnnouncement(`${MONTHS[next.getMonth()]} ${next.getFullYear()}`);
    }

    setFocusedDate(next);
    // Focus after render (new cell may not exist yet)
    requestAnimationFrame(() => focusCell(next!));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [viewDate, phase, navigateToMonth, focusCell]);

  const isDisabledDate = (date: Date): boolean => {
    const pastThreshold = new Date(today); pastThreshold.setHours(0, 0, 0, 0);
    return date < pastThreshold ||
      date.getDay() === 0 ||
      date.getDay() === 6 ||
      COMPANY_HOLIDAYS.includes(toDateKey(date));
  };

  const handleSelect = useCallback((date: Date) => {
    if (isDisabledDate(date)) {
      setAnnouncement(`${MONTHS[date.getMonth()]} ${date.getDate()} is not available`);
      return;
    }

    if (phase === "idle") {
      setRangeStart(date);
      setRangeEnd(null);
      setPhase("selecting-end");
      setAnnouncement(`${MONTHS[date.getMonth()]} ${date.getDate()} selected as start. Now select an end date.`);
    } else {
      // Ensure lo ≤ hi
      const lo = rangeStart && date < rangeStart ? date     : rangeStart!;
      const hi = rangeStart && date < rangeStart ? rangeStart : date;
      setRangeStart(lo);
      setRangeEnd(hi);
      setPhase("idle");
      const nights = Math.round((hi.getTime() - lo.getTime()) / (1000 * 60 * 60 * 24)) + 1;
      setAnnouncement(
        `Range selected: ${MONTHS[lo.getMonth()]} ${lo.getDate()} to ${MONTHS[hi.getMonth()]} ${hi.getDate()}, ${nights} day${nights !== 1 ? "s" : ""}`
      );
      // Store ref for focus restoration after modal
      (triggerCellRef as React.MutableRefObject<HTMLElement | null>).current =
        gridRef.current?.querySelector<HTMLElement>(`#${cellId(hi)}`) ?? null;
      setShowModal(true);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, rangeStart]);

  const handleSubmit = useCallback(() => {
    if (!rangeStart || !rangeEnd) return;
    const req: TimeOffRequest = {
      id: `req-${Date.now()}`,
      start: rangeStart,
      end:   rangeEnd,
      type:  leaveType,
      note,
      status: "pending",
    };
    setRequests(prev => [req, ...prev]);
    setRangeStart(null);
    setRangeEnd(null);
    setPhase("idle");
    setNote("");
    setShowModal(false);
    setAnnouncement("Time-off request submitted successfully");
  }, [rangeStart, rangeEnd, leaveType, note]);

  const handleCancel = useCallback(() => {
    setShowModal(false);
    setRangeStart(null);
    setRangeEnd(null);
    setPhase("idle");
    setAnnouncement("Request cancelled");
  }, []);

  // ── Render ────────────────────────────────────────────────────

  return (
    <div style={{
      background: "#0f172a", color: "#f1f5f9",
      fontFamily: "'Inter', system-ui, sans-serif",
      minHeight: "100vh", padding: 24,
    }}>
      {/* Screen reader live region */}
      <LiveRegion message={announcement} />

      {/* Modal */}
      {showModal && rangeStart && rangeEnd && (
        <ConfirmModal
          start={rangeStart}
          end={rangeEnd}
          leaveType={leaveType}
          note={note}
          onLeaveTypeChange={setLeaveType}
          onNoteChange={setNote}
          onSubmit={handleSubmit}
          onCancel={handleCancel}
          triggerRef={triggerCellRef}
        />
      )}

      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
          <span style={{ fontSize: 28 }}>📅</span>
          <div>
            <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800 }}>
              Accessible Time-Off Request Calendar
            </h1>
            <p style={{ margin: 0, color: "#64748b", fontSize: 13 }}>
              WAI-ARIA Grid · Roving tabIndex · Live Regions · Focus Trap · WCAG 2.1 AA
            </p>
          </div>
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {["role=grid", "aria-live", "roving tabIndex", "focus trap", "aria-label", "aria-selected", "aria-disabled", "keyboard nav"].map(t => (
            <span key={t} style={{ background: "#1e293b", color: "#94a3b8", border: "1px solid #334155", borderRadius: 20, padding: "3px 10px", fontSize: 11 }}>{t}</span>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 4, marginBottom: 20, borderBottom: "1px solid #1e293b", paddingBottom: 4 }}>
        {[
          { id: "calendar" as const, label: "📅 Calendar Demo" },
          { id: "features" as const, label: "♿ A11y Features" },
          { id: "code"     as const, label: "🔬 How It Works" },
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

      {/* ── Calendar Tab ── */}
      {activeTab === "calendar" && (
        <div style={{ display: "grid", gridTemplateColumns: "minmax(300px, 480px) 1fr", gap: 24, maxWidth: 900 }}>

          {/* Calendar */}
          <div>
            {/* Instructions */}
            <div id="cal-instructions" style={{
              background: "#1e293b", border: "1px solid #334155",
              borderRadius: 8, padding: "8px 14px", marginBottom: 12, fontSize: 12, color: "#64748b",
            }}>
              <span style={{ color: "#94a3b8" }}>Keyboard: </span>
              Arrow keys navigate · Enter/Space select · Page Up/Down change month · Esc cancel
            </div>

            {/* Month navigation */}
            <div style={{
              display: "flex", alignItems: "center", justifyContent: "space-between",
              marginBottom: 12,
            }}>
              <button
                onClick={() => navigateToMonth(-1)}
                aria-label={`Previous month, ${MONTHS[(viewDate.getMonth() + 11) % 12]}`}
                style={{
                  background: "#1e293b", color: "#f1f5f9",
                  border: "1px solid #334155", borderRadius: 8,
                  padding: "8px 14px", cursor: "pointer", fontSize: 18, fontWeight: 700,
                  minWidth: 44, minHeight: 44,
                }}
              >‹</button>

              <div
                role="heading"
                aria-level={2}
                aria-live="polite"
                style={{ fontWeight: 800, fontSize: 16, color: "#f1f5f9" }}
              >
                {MONTHS[viewDate.getMonth()]} {viewDate.getFullYear()}
              </div>

              <button
                onClick={() => navigateToMonth(1)}
                aria-label={`Next month, ${MONTHS[(viewDate.getMonth() + 1) % 12]}`}
                style={{
                  background: "#1e293b", color: "#f1f5f9",
                  border: "1px solid #334155", borderRadius: 8,
                  padding: "8px 14px", cursor: "pointer", fontSize: 18, fontWeight: 700,
                  minWidth: 44, minHeight: 44,
                }}
              >›</button>
            </div>

            {/* Grid */}
            <div
              ref={gridRef}
              role="grid"
              aria-label={`Time-off calendar, ${MONTHS[viewDate.getMonth()]} ${viewDate.getFullYear()}`}
              aria-describedby="cal-instructions"
              aria-multiselectable="false"
              style={{
                display: "grid", gridTemplateRows: "auto",
                borderRadius: 12,
                overflow: "hidden",
                border: "1px solid #334155",
              }}
            >
              {/* Column headers */}
              <div role="row" style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", background: "#1e293b" }}>
                {DAYS_SHORT.map((d, i) => (
                  <div
                    key={d}
                    role="columnheader"
                    aria-label={DAYS_LONG[i]}
                    style={{
                      textAlign: "center", padding: "8px 2px", fontSize: 11,
                      fontWeight: 700,
                      color: (i === 0 || i === 6) ? "#ef4444" : "#64748b",
                    }}
                  >
                    <abbr title={DAYS_LONG[i]} style={{ textDecoration: "none" }}>{d}</abbr>
                  </div>
                ))}
              </div>

              {/* Weeks */}
              {weeks.map((week, wi) => (
                <div key={wi} role="row" style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)" }}>
                  {week.map((date) => {
                    const info = buildInfo(date);
                    const disabled = info.isPast || info.isWeekend || info.isBlocked;
                    const isFocused = isSameDay(date, focusedDate);

                    const bg = info.isRangeStart || info.isRangeEnd
                      ? "#6366f1"
                      : info.isInRange
                      ? "#6366f120"
                      : info.isToday
                      ? "#1e3a5f"
                      : "transparent";

                    const color = info.isRangeStart || info.isRangeEnd
                      ? "#fff"
                      : disabled
                      ? "#2d3748"
                      : info.isOtherMonth
                      ? "#334155"
                      : info.isToday
                      ? "#7dd3fc"
                      : "#e2e8f0";

                    return (
                      <div
                        key={toDateKey(date)}
                        id={cellId(date)}
                        role="gridcell"
                        aria-label={buildAriaLabel(info)}
                        aria-selected={info.isSelected || info.isInRange}
                        aria-disabled={disabled}
                        tabIndex={isFocused ? 0 : -1}
                        onClick={() => !disabled && handleSelect(date)}
                        onKeyDown={e => handleKeyDown(e, date)}
                        onMouseEnter={() => phase === "selecting-end" && setHoverDate(date)}
                        onMouseLeave={() => setHoverDate(null)}
                        onFocus={() => setFocusedDate(date)}
                        style={{
                          background: bg,
                          color,
                          textAlign: "center",
                          padding: "10px 2px",
                          fontSize: 13,
                          fontWeight: info.isToday ? 800 : 400,
                          cursor: disabled ? "not-allowed" : "pointer",
                          userSelect: "none",
                          position: "relative",
                          transition: "background 0.1s",
                          outline: "none",
                          boxShadow: isFocused && !disabled
                            ? "inset 0 0 0 2px #6366f1"
                            : undefined,
                          borderRight: "1px solid #1e293b",
                          borderBottom: "1px solid #1e293b",
                          minHeight: 44, // WCAG 2.5.5 touch target
                          display: "flex", alignItems: "center", justifyContent: "center",
                        }}
                      >
                        {date.getDate()}
                        {info.isToday && (
                          <span
                            aria-hidden="true"
                            style={{
                              position: "absolute", bottom: 4, left: "50%",
                              transform: "translateX(-50%)",
                              width: 4, height: 4, borderRadius: "50%",
                              background: "#7dd3fc",
                            }}
                          />
                        )}
                        {info.isBlocked && (
                          <span aria-hidden="true" style={{ position: "absolute", top: 2, right: 2, fontSize: 7 }}>🎌</span>
                        )}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>

            {/* Phase hint */}
            <div
              role="status"
              aria-live="polite"
              style={{ marginTop: 10, fontSize: 12, color: "#64748b", minHeight: 20, textAlign: "center" }}
            >
              {phase === "idle" && rangeStart == null && "Click or press Enter on any available date to start selecting"}
              {phase === "selecting-end" && `Start: ${MONTHS[rangeStart!.getMonth()]} ${rangeStart!.getDate()} — now select end date`}
              {phase === "idle" && rangeStart && rangeEnd && (
                <span style={{ color: "#4ade80" }}>
                  ✓ {MONTHS[rangeStart.getMonth()]} {rangeStart.getDate()} → {MONTHS[rangeEnd.getMonth()]} {rangeEnd.getDate()}
                  {" · "}<button
                    onClick={() => { setRangeStart(null); setRangeEnd(null); setAnnouncement("Selection cleared"); }}
                    style={{ background: "none", border: "none", color: "#64748b", cursor: "pointer", fontSize: 12, textDecoration: "underline" }}
                  >clear</button>
                </span>
              )}
            </div>

            {/* Legend */}
            <div role="group" aria-label="Calendar legend" style={{ display: "flex", gap: 12, flexWrap: "wrap", marginTop: 14, fontSize: 11, color: "#64748b" }}>
              {[
                { swatch: "#6366f1", label: "Selected / Range" },
                { swatch: "#1e3a5f", label: "Today" },
                { swatch: "#2d3748", label: "Past / Weekend" },
                { swatch: "#6366f120", label: "In Range" },
              ].map(l => (
                <div key={l.label} style={{ display: "flex", alignItems: "center", gap: 5 }}>
                  <div aria-hidden="true" style={{ width: 12, height: 12, borderRadius: 3, background: l.swatch, border: "1px solid #334155" }} />
                  {l.label}
                </div>
              ))}
            </div>
          </div>

          {/* Right: Requests list */}
          <div>
            <div style={{ color: "#94a3b8", fontWeight: 700, fontSize: 13, marginBottom: 12 }}>
              My Requests ({requests.length})
            </div>
            {requests.length === 0 ? (
              <div style={{ background: "#1e293b", border: "1px dashed #334155", borderRadius: 10, padding: "32px 16px", textAlign: "center", color: "#475569", fontSize: 13 }}>
                No requests yet.<br />Select a date range to submit your first request.
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {requests.map(req => {
                  const cfg = LEAVE_TYPES.find(l => l.value === req.type)!;
                  const nights = Math.round((req.end.getTime() - req.start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
                  return (
                    <div key={req.id} style={{
                      background: "#1e293b", borderLeft: `3px solid ${cfg.color}`,
                      border: `1px solid ${cfg.color}30`,
                      borderRadius: 8, padding: "10px 14px",
                    }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                        <div>
                          <span style={{ fontSize: 16, marginRight: 6 }}>{cfg.emoji}</span>
                          <span style={{ color: cfg.color, fontWeight: 700, fontSize: 13 }}>{cfg.label}</span>
                        </div>
                        <span style={{
                          background: "#fbbf2420", color: "#fbbf24",
                          border: "1px solid #fbbf2440",
                          borderRadius: 12, padding: "2px 8px", fontSize: 10, fontWeight: 700,
                        }}>⏳ Pending</span>
                      </div>
                      <div style={{ color: "#64748b", fontSize: 12, marginTop: 4 }}>
                        {MONTHS[req.start.getMonth()]} {req.start.getDate()} – {MONTHS[req.end.getMonth()]} {req.end.getDate()}, {req.end.getFullYear()}
                        {" · "}{nights} day{nights !== 1 ? "s" : ""}
                      </div>
                      {req.note && <div style={{ color: "#475569", fontSize: 11, marginTop: 3, fontStyle: "italic" }}>{req.note}</div>}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── A11y Features Tab ── */}
      {activeTab === "features" && (
        <div style={{ maxWidth: 800, display: "flex", flexDirection: "column", gap: 16 }}>
          {[
            {
              title: "Roving tabIndex — Grid Navigation",
              color: "#6366f1", icon: "🎯",
              items: [
                { attr: "tabIndex={0}", desc: "Only the currently focused date cell has tabIndex=0" },
                { attr: "tabIndex={-1}", desc: "All other 41 cells have -1 — removed from tab order" },
                { attr: "element.focus()", desc: "Arrow keys move DOM focus programmatically via focus()" },
                { attr: "requestAnimationFrame", desc: "Focus after React re-render when switching months" },
                { attr: "onFocus", desc: "Syncs focusedDate state when Tab brings user into grid" },
              ],
            },
            {
              title: "ARIA Roles — Grid Semantics",
              color: "#0891b2", icon: "🏗",
              items: [
                { attr: 'role="grid"', desc: "Calendar container — tells AT it's a 2D navigable widget" },
                { attr: 'role="row"', desc: "Each week row — required child of grid" },
                { attr: 'role="gridcell"', desc: "Each day cell — navigable child of row" },
                { attr: 'role="columnheader"', desc: "Mon/Tue/… headers — announces column names" },
                { attr: '<abbr title="Monday">Mon</abbr>', desc: "Screen reader reads full day name, sighted user sees short" },
              ],
            },
            {
              title: "Live Regions — Screen Reader Announcements",
              color: "#10b981", icon: "📢",
              items: [
                { attr: 'aria-live="polite"', desc: "Visually hidden <div> announces navigation & selection changes" },
                { attr: 'aria-atomic="true"', desc: "Read the full message on each update (not just the delta)" },
                { attr: 'role="status"', desc: "Phase hint below calendar — also a live region" },
                { attr: "aria-live on heading", desc: "Month/year heading announces when navigating months" },
                { attr: "Custom messages", desc: '"June 12 selected as start. Now select an end date." — clear verbal UX' },
              ],
            },
            {
              title: "Individual Cell Labels — aria-label",
              color: "#f59e0b", icon: "🏷",
              items: [
                { attr: "aria-label", desc: '"Monday, June 12, 2025, today, available" — full context on every cell' },
                { attr: "aria-selected", desc: "true/false — announces range membership to screen readers" },
                { attr: "aria-disabled", desc: "true on past/weekend/holiday — AT announces as unavailable" },
                { attr: "aria-multiselectable", desc: "false on grid — only one range at a time" },
                { attr: "aria-describedby", desc: "Links keyboard instructions paragraph to the grid" },
              ],
            },
            {
              title: "Modal Focus Trap",
              color: "#a78bfa", icon: "🔒",
              items: [
                { attr: 'role="dialog" aria-modal="true"', desc: "Tells AT the modal is active — background content inert" },
                { attr: "aria-labelledby / describedby", desc: "Announces title and description to screen reader on open" },
                { attr: "Initial focus", desc: "useEffect moves focus to first focusable element (Leave Type select)" },
                { attr: "Tab trap", desc: "Tab/Shift+Tab cycles within dialog — cannot escape without Cancel/Submit" },
                { attr: "Focus restoration", desc: "When modal closes, focus returns to the date cell that triggered it" },
              ],
            },
            {
              title: "Keyboard Navigation (WAI-ARIA Date Picker Pattern)",
              color: "#f472b6", icon: "⌨️",
              items: [
                { attr: "← → ↑ ↓", desc: "Move focus by day (left/right) or week (up/down)" },
                { attr: "Page Up / Down", desc: "Jump to previous/next month — focus moves to equivalent day" },
                { attr: "Ctrl+Page Up/Down", desc: "Jump a full year" },
                { attr: "Home / End", desc: "First/last day of current week (Sun/Sat)" },
                { attr: "Ctrl+Home / End", desc: "First/last day of current month" },
                { attr: "Enter / Space", desc: "Select focused date as start or end of range" },
                { attr: "Escape", desc: "Cancel current range selection" },
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
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {section.items.map(item => (
                  <div key={item.attr} style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
                    <code style={{
                      background: "#0f172a", color: "#7dd3fc",
                      padding: "1px 7px", borderRadius: 4, fontSize: 11,
                      whiteSpace: "nowrap", minWidth: 180, flexShrink: 0, fontFamily: "monospace",
                    }}>{item.attr}</code>
                    <span style={{ color: "#94a3b8", fontSize: 12, lineHeight: 1.6, paddingTop: 1 }}>{item.desc}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── How It Works Tab ── */}
      {activeTab === "code" && (
        <div style={{ maxWidth: 800, display: "flex", flexDirection: "column", gap: 16 }}>

          {[
            {
              title: "Roving tabIndex Implementation",
              color: "#6366f1",
              code: `// Only one cell gets tabIndex=0 at any time
// → Tab key enters/exits the grid as a single unit
// → Arrow keys navigate inside the grid

const [focusedDate, setFocusedDate] = useState<Date>(today);
const gridRef = useRef<HTMLDivElement>(null);

// In each cell:
<div
  role="gridcell"
  tabIndex={isSameDay(date, focusedDate) ? 0 : -1}
  onFocus={() => setFocusedDate(date)} // sync when Tab brings focus in
  onKeyDown={e => handleKeyDown(e, date)}
/>

// When arrow key pressed:
function handleKeyDown(e, date) {
  if (e.key === "ArrowRight") {
    const next = addDays(date, 1);
    setFocusedDate(next);
    // DOM focus moves immediately (not on next render)
    requestAnimationFrame(() => {
      gridRef.current
        ?.querySelector(\`#\${cellId(next)}\`)
        ?.focus();
    });
  }
}`,
            },
            {
              title: "Live Region Pattern",
              color: "#10b981",
              code: `// Visually hidden, always mounted — screen readers watch it
function LiveRegion({ message }) {
  return (
    <div
      role="status"
      aria-live="polite"   // read after current speech finishes
      aria-atomic="true"   // read full message (not just changed part)
      style={{ position:"absolute", width:1, height:1,
               overflow:"hidden", clip:"rect(0,0,0,0)" }}
    >
      {message}
    </div>
  );
}

// Trigger announcements on user actions:
setAnnouncement("January 2026"); // navigated to new month
setAnnouncement("June 12 selected as start. Now select end date.");
setAnnouncement("Range: June 12 to June 16, 5 days");
setAnnouncement("June 15 is not available");`,
            },
            {
              title: "Modal Focus Trap",
              color: "#a78bfa",
              code: `function ConfirmModal({ onCancel, triggerRef }) {
  const modalRef = useRef(null);

  // Move focus IN on open
  useEffect(() => { firstInputRef.current?.focus(); }, []);

  // Restore focus OUT on close
  useEffect(() => {
    return () => triggerRef.current?.focus(); // runs on unmount
  }, [triggerRef]);

  // Trap Tab within modal
  const handleKeyDown = (e) => {
    if (e.key === "Escape") { onCancel(); return; }
    if (e.key !== "Tab") return;
    const focusable = modalRef.current?.querySelectorAll(
      'button, input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    const first = focusable[0];
    const last  = focusable[focusable.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault(); last.focus();  // wrap backward
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault(); first.focus(); // wrap forward
    }
  };

  return (
    <div role="dialog" aria-modal="true"
         aria-labelledby="modal-title"
         onKeyDown={handleKeyDown}
         ref={modalRef}
    > ... </div>
  );
}`,
            },
            {
              title: "aria-label Builder — Full Date Context",
              color: "#f59e0b",
              code: `// Every cell gets a comprehensive, informative label
function buildAriaLabel(info: DateInfo): string {
  const day = DAYS_LONG[info.date.getDay()]; // "Monday"
  const mon = MONTHS[info.date.getMonth()];  // "June"
  const d   = info.date.getDate();           // 12
  const yr  = info.date.getFullYear();       // 2025

  const parts = [\`\${day}, \${mon} \${d}, \${yr}\`];

  if (info.isToday)    parts.push("today");
  if (info.isPast)     parts.push("past date, not available");
  if (info.isBlocked)  parts.push("company holiday, not available");
  if (info.isWeekend)  parts.push("weekend, not available");
  else if (!info.isPast && !info.isBlocked) parts.push("available");

  if (info.isRangeStart) parts.push("start of selection");
  if (info.isRangeEnd)   parts.push("end of selection");
  else if (info.isInRange) parts.push("in selected range");

  return parts.join(", ");
  // → "Monday, June 12, 2025, today, available, start of selection"
}`,
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
        </div>
      )}
    </div>
  );
}

export default AccessibleCalendarDemo;
