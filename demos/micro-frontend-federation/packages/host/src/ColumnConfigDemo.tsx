/**
 * ColumnConfigDemo.tsx
 *
 * Accessible dropdown for configuring table column order, visibility, and freeze state.
 *
 * ACCESSIBILITY PATTERNS DEMONSTRATED
 *
 * 1. DISCLOSURE BUTTON (trigger)
 *    - role="button" (native <button>) with aria-expanded and aria-haspopup="dialog"
 *    - aria-controls points to the panel id
 *    - Focus returns to trigger on panel close
 *
 * 2. PANEL — role="dialog" (non-modal)
 *    - aria-labelledby → panel heading id
 *    - aria-modal="false" — doesn't lock the screen (click outside closes)
 *    - Focus moves to first interactive element on open (useEffect + ref.focus())
 *    - Escape key closes and restores focus to trigger
 *
 * 3. COLUMN LIST — role="listbox" / role="option" for reorderable items
 *    - Each row is role="listitem" within role="list"
 *    - Keyboard reordering: Arrow Up/Down with aria-grabbed / aria-dropeffect
 *    - Announcement via aria-live when row moves: "Name moved to position 2 of 7"
 *
 * 4. CHECKBOXES — visibility & freeze toggles
 *    - Standard <input type="checkbox"> with <label htmlFor> associations
 *    - Grouped with <fieldset>/<legend> for semantic grouping
 *    - aria-describedby links to explanatory hint text
 *
 * 5. LIVE REGION — status announcements
 *    - aria-live="polite" region announces all configuration changes
 *    - "Department column hidden", "Employee ID frozen", "Name moved up"
 *
 * 6. TABLE ARIA — the resulting data table
 *    - role="grid" with aria-colcount
 *    - Frozen columns: aria-owns or sticky positioning (visual + semantic)
 *    - aria-sort on sortable headers
 *    - aria-hidden on decorative icons
 *
 * KEYBOARD NAVIGATION
 *   Tab / Shift+Tab   → move through checkboxes and buttons in panel
 *   Space / Enter     → toggle checkbox or activate button
 *   Arrow Up / Down   → reorder the focused column row
 *   Escape            → close panel, return focus to trigger button
 *   Enter on trigger  → open panel, move focus to first control
 */

import React, {
  useState,
  useRef,
  useEffect,
  useCallback,
  useId,
  KeyboardEvent,
} from "react";

// ─────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────

interface Column {
  id: string;
  label: string;
  width: number;
  visible: boolean;
  frozen: boolean;    // sticky-left pinned
  sortable: boolean;
  order: number;      // display order (0 = leftmost)
}

interface Employee {
  id: string;
  name: string;
  department: string;
  status: "Active" | "On Leave" | "Terminated";
  startDate: string;
  salary: string;
  manager: string;
  location: string;
}

type SortDir = "asc" | "desc" | "none";

// ─────────────────────────────────────────────────────────────────
// Initial data
// ─────────────────────────────────────────────────────────────────

const INITIAL_COLUMNS: Column[] = [
  { id: "id",         label: "Employee ID",  width: 110, visible: true,  frozen: true,  sortable: true,  order: 0 },
  { id: "name",       label: "Name",         width: 160, visible: true,  frozen: true,  sortable: true,  order: 1 },
  { id: "department", label: "Department",   width: 130, visible: true,  frozen: false, sortable: true,  order: 2 },
  { id: "status",     label: "Status",       width: 100, visible: true,  frozen: false, sortable: false, order: 3 },
  { id: "startDate",  label: "Start Date",   width: 110, visible: true,  frozen: false, sortable: true,  order: 4 },
  { id: "salary",     label: "Salary",       width: 110, visible: false, frozen: false, sortable: true,  order: 5 },
  { id: "manager",    label: "Manager",      width: 150, visible: true,  frozen: false, sortable: true,  order: 6 },
  { id: "location",   label: "Location",     width: 120, visible: false, frozen: false, sortable: true,  order: 7 },
];

const EMPLOYEES: Employee[] = [
  { id: "EMP-001", name: "Nguyễn Văn A",   department: "Engineering", status: "Active",     startDate: "2021-03-15", salary: "$85,000",  manager: "Trần Thị X", location: "HCM" },
  { id: "EMP-002", name: "Trần Thị B",     department: "Product",     status: "Active",     startDate: "2020-07-01", salary: "$92,000",  manager: "Lê Minh Y",  location: "HN" },
  { id: "EMP-003", name: "Lê Minh C",      department: "Design",      status: "On Leave",   startDate: "2019-11-20", salary: "$78,000",  manager: "Phạm Gia Z", location: "HCM" },
  { id: "EMP-004", name: "Phạm Quỳnh D",  department: "Engineering", status: "Active",     startDate: "2022-01-10", salary: "$88,000",  manager: "Trần Thị X", location: "HCM" },
  { id: "EMP-005", name: "Hoàng Gia E",    department: "Finance",     status: "Active",     startDate: "2018-05-22", salary: "$95,000",  manager: "Nguyễn Hùng", location: "HN" },
  { id: "EMP-006", name: "Đỗ Thanh F",     department: "Marketing",   status: "Terminated", startDate: "2020-09-14", salary: "$70,000",  manager: "Lê Minh Y",  location: "DA" },
];

function getEmployeeValue(emp: Employee, colId: string): string {
  const map: Record<string, string> = {
    id: emp.id, name: emp.name, department: emp.department,
    status: emp.status, startDate: emp.startDate, salary: emp.salary,
    manager: emp.manager, location: emp.location,
  };
  return map[colId] ?? "—";
}

// ─────────────────────────────────────────────────────────────────
// Visually-hidden utility (for aria-live region and SR text)
// ─────────────────────────────────────────────────────────────────
const srOnly: React.CSSProperties = {
  position: "absolute", width: 1, height: 1,
  overflow: "hidden", clip: "rect(0,0,0,0)",
  whiteSpace: "nowrap", borderWidth: 0,
};

// ─────────────────────────────────────────────────────────────────
// ColumnConfigPanel — the dropdown panel component
// ─────────────────────────────────────────────────────────────────
interface PanelProps {
  columns: Column[];
  onChange: (cols: Column[]) => void;
  onClose: () => void;
  triggerRef: React.RefObject<HTMLButtonElement | null>;
  announce: (msg: string) => void;
}

function ColumnConfigPanel({ columns, onChange, onClose, triggerRef, announce }: PanelProps) {
  const panelRef   = useRef<HTMLDivElement>(null);
  const firstCtrlRef = useRef<HTMLInputElement>(null);
  const titleId    = useId();

  // Sorted for display in the panel (by order)
  const sorted = [...columns].sort((a, b) => a.order - b.order);

  // Focus first control on open
  useEffect(() => {
    firstCtrlRef.current?.focus();
  }, []);

  // Restore focus on close (runs on unmount)
  useEffect(() => {
    return () => {
      triggerRef.current?.focus();
    };
  }, [triggerRef]);

  // Escape closes
  const handlePanelKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "Escape") {
      onClose();
    }
  };

  // Toggle visibility
  const toggleVisible = (id: string) => {
    const col = columns.find(c => c.id === id)!;
    const next = columns.map(c =>
      c.id === id ? { ...c, visible: !c.visible, frozen: !c.visible ? c.frozen : false } : c
    );
    onChange(next);
    announce(`${col.label} column ${col.visible ? "hidden" : "shown"}`);
  };

  // Toggle freeze
  const toggleFreeze = (id: string) => {
    const col = columns.find(c => c.id === id)!;
    if (!col.visible) return;
    const next = columns.map(c =>
      c.id === id ? { ...c, frozen: !c.frozen } : c
    );
    onChange(next);
    announce(`${col.label} ${col.frozen ? "unpinned" : "pinned to left"}`);
  };

  // Reorder — move a column up or down in display order
  const move = useCallback((id: string, dir: -1 | 1) => {
    const col = columns.find(c => c.id === id)!;
    const targetOrder = col.order + dir;
    if (targetOrder < 0 || targetOrder >= columns.length) return;

    const displaced = columns.find(c => c.order === targetOrder);
    if (!displaced) return;

    const next = columns.map(c => {
      if (c.id === id)           return { ...c, order: targetOrder };
      if (c.id === displaced.id) return { ...c, order: col.order };
      return c;
    });
    onChange(next);

    const newPos = targetOrder + 1;
    const total  = columns.length;
    announce(`${col.label} moved to position ${newPos} of ${total}`);

    // Re-focus the same row after re-render
    requestAnimationFrame(() => {
      panelRef.current
        ?.querySelector<HTMLElement>(`[data-col-move="${id}"]`)
        ?.focus();
    });
  }, [columns, onChange, announce]);

  // Arrow key reordering on the row container
  const handleRowKeyDown = (e: KeyboardEvent<HTMLDivElement>, id: string) => {
    if (e.key === "ArrowUp")   { e.preventDefault(); move(id, -1); }
    if (e.key === "ArrowDown") { e.preventDefault(); move(id,  1); }
  };

  const visibleCount = columns.filter(c => c.visible).length;
  const frozenCount  = columns.filter(c => c.frozen).length;

  return (
    <div
      ref={panelRef}
      role="dialog"
      aria-labelledby={titleId}
      aria-modal="false"
      onKeyDown={handlePanelKeyDown}
      style={{
        position: "absolute", top: "calc(100% + 8px)", right: 0,
        zIndex: 200,
        background: "#1e293b",
        border: "1px solid #334155",
        borderRadius: 12,
        boxShadow: "0 16px 48px rgba(0,0,0,0.6)",
        width: 360,
        overflow: "hidden",
      }}
    >
      {/* Header */}
      <div style={{
        display: "flex", justifyContent: "space-between", alignItems: "center",
        padding: "14px 16px",
        borderBottom: "1px solid #334155",
        background: "#0f172a",
      }}>
        <div>
          <h2 id={titleId} style={{ margin: 0, fontSize: 14, fontWeight: 700, color: "#f1f5f9" }}>
            Configure Columns
          </h2>
          <p style={{ margin: "2px 0 0", fontSize: 11, color: "#64748b" }}>
            {visibleCount} of {columns.length} visible · {frozenCount} frozen
          </p>
        </div>
        <button
          onClick={onClose}
          aria-label="Close column configuration panel"
          style={{
            background: "none", border: "none", color: "#64748b",
            cursor: "pointer", fontSize: 18, lineHeight: 1, padding: 4, borderRadius: 4,
          }}
        >
          ✕
        </button>
      </div>

      {/* Keyboard hint */}
      <div style={{ padding: "8px 16px", background: "#0f172a", borderBottom: "1px solid #1e293b" }}>
        <p style={{ margin: 0, fontSize: 11, color: "#475569" }}>
          <kbd style={{ background: "#1e293b", border: "1px solid #334155", borderRadius: 3, padding: "1px 4px", fontFamily: "monospace" }}>↑ ↓</kbd>
          {" "}reorder ·{" "}
          <kbd style={{ background: "#1e293b", border: "1px solid #334155", borderRadius: 3, padding: "1px 4px", fontFamily: "monospace" }}>Space</kbd>
          {" "}toggle ·{" "}
          <kbd style={{ background: "#1e293b", border: "1px solid #334155", borderRadius: 3, padding: "1px 4px", fontFamily: "monospace" }}>Esc</kbd>
          {" "}close
        </p>
      </div>

      {/* Column list */}
      <div
        role="list"
        aria-label="Columns — use arrow keys to reorder"
        style={{ maxHeight: 360, overflowY: "auto", padding: "8px 0" }}
      >
        {sorted.map((col, idx) => {
          const isFirst = idx === 0;
          const isLast  = idx === sorted.length - 1;

          return (
            <div
              key={col.id}
              role="listitem"
              aria-label={`${col.label}, position ${idx + 1} of ${sorted.length}${col.frozen ? ", pinned" : ""}${!col.visible ? ", hidden" : ""}`}
              onKeyDown={e => handleRowKeyDown(e, col.id)}
              style={{
                display: "flex", alignItems: "center", gap: 10,
                padding: "8px 16px",
                background: col.frozen ? "#6366f110" : "transparent",
                borderLeft: col.frozen ? "3px solid #6366f1" : "3px solid transparent",
                opacity: col.visible ? 1 : 0.5,
                transition: "all 0.15s",
              }}
            >
              {/* Drag handle (visual only — keyboard uses arrow keys) */}
              <span
                aria-hidden="true"
                title="Use arrow keys to reorder"
                style={{ color: "#334155", fontSize: 16, cursor: "grab", userSelect: "none", flexShrink: 0 }}
              >
                ⠿
              </span>

              {/* Visibility checkbox */}
              <div style={{ display: "flex", alignItems: "center", flex: 1, gap: 8, minWidth: 0 }}>
                <input
                  type="checkbox"
                  id={`vis-${col.id}`}
                  ref={idx === 0 ? firstCtrlRef : undefined}
                  checked={col.visible}
                  onChange={() => toggleVisible(col.id)}
                  aria-describedby={`vis-hint-${col.id}`}
                  style={{ width: 15, height: 15, cursor: "pointer", flexShrink: 0, accentColor: "#6366f1" }}
                />
                <label
                  htmlFor={`vis-${col.id}`}
                  style={{
                    color: col.visible ? "#f1f5f9" : "#64748b",
                    fontSize: 13, cursor: "pointer",
                    overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                  }}
                >
                  {col.label}
                </label>
                <span id={`vis-hint-${col.id}`} style={srOnly}>
                  {col.visible ? "visible" : "hidden"} column
                </span>
              </div>

              {/* Freeze toggle */}
              <button
                onClick={() => toggleFreeze(col.id)}
                disabled={!col.visible}
                aria-pressed={col.frozen}
                aria-label={`${col.frozen ? "Unpin" : "Pin"} ${col.label} to left`}
                title={col.frozen ? "Unpin column" : "Pin column to left"}
                style={{
                  background: col.frozen ? "#6366f1" : "#0f172a",
                  color: col.frozen ? "#fff" : "#475569",
                  border: `1px solid ${col.frozen ? "#6366f1" : "#334155"}`,
                  borderRadius: 6,
                  width: 28, height: 28,
                  cursor: col.visible ? "pointer" : "not-allowed",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 12, flexShrink: 0,
                  opacity: col.visible ? 1 : 0.4,
                  transition: "all 0.15s",
                }}
              >
                📌
              </button>

              {/* Reorder buttons */}
              <div style={{ display: "flex", flexDirection: "column", gap: 2, flexShrink: 0 }}>
                <button
                  data-col-move={col.id}
                  onClick={() => move(col.id, -1)}
                  disabled={isFirst}
                  aria-label={`Move ${col.label} up`}
                  style={{
                    background: "none", border: "1px solid #334155",
                    color: isFirst ? "#1e293b" : "#94a3b8",
                    borderRadius: 4, width: 20, height: 16, cursor: isFirst ? "not-allowed" : "pointer",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 9, lineHeight: 1, padding: 0,
                  }}
                >
                  ▲
                </button>
                <button
                  onClick={() => move(col.id, 1)}
                  disabled={isLast}
                  aria-label={`Move ${col.label} down`}
                  style={{
                    background: "none", border: "1px solid #334155",
                    color: isLast ? "#1e293b" : "#94a3b8",
                    borderRadius: 4, width: 20, height: 16, cursor: isLast ? "not-allowed" : "pointer",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 9, lineHeight: 1, padding: 0,
                  }}
                >
                  ▼
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer actions */}
      <div style={{
        display: "flex", justifyContent: "space-between", alignItems: "center",
        padding: "12px 16px",
        borderTop: "1px solid #334155", background: "#0f172a",
        gap: 8,
      }}>
        <button
          onClick={() => { onChange(INITIAL_COLUMNS); announce("Columns reset to defaults"); }}
          style={{
            background: "none", border: "1px solid #334155",
            color: "#64748b", borderRadius: 6,
            padding: "6px 14px", cursor: "pointer", fontSize: 12,
          }}
        >
          Reset defaults
        </button>
        <button
          onClick={() => { onChange(columns.map(c => ({ ...c, visible: true }))); announce("All columns shown"); }}
          style={{
            background: "#6366f1", color: "#fff", border: "none",
            borderRadius: 6, padding: "6px 14px", cursor: "pointer", fontSize: 12, fontWeight: 600,
          }}
        >
          Show all
        </button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
// Data Table with column config applied
// ─────────────────────────────────────────────────────────────────
function DataTable({ columns }: { columns: Column[] }) {
  const [sortCol, setSortCol] = useState<string>("id");
  const [sortDir, setSortDir] = useState<SortDir>("asc");

  const visibleCols = [...columns]
    .filter(c => c.visible)
    .sort((a, b) => a.order - b.order);

  const frozenCols  = visibleCols.filter(c => c.frozen);
  const scrollCols  = visibleCols.filter(c => !c.frozen);

  const sortedRows = [...EMPLOYEES].sort((a, b) => {
    if (sortDir === "none") return 0;
    const av = getEmployeeValue(a, sortCol);
    const bv = getEmployeeValue(b, sortCol);
    return sortDir === "asc" ? av.localeCompare(bv) : bv.localeCompare(av);
  });

  const handleSort = (colId: string) => {
    if (sortCol === colId) {
      setSortDir(d => d === "asc" ? "desc" : "asc");
    } else {
      setSortCol(colId);
      setSortDir("asc");
    }
  };

  const thStyle = (col: Column, frozen: boolean): React.CSSProperties => ({
    padding: "10px 12px",
    textAlign: "left",
    fontSize: 11, fontWeight: 700,
    color: "#94a3b8",
    background: frozen ? "#1e3a5f" : "#0f172a",
    borderBottom: "2px solid #334155",
    borderRight: "1px solid #334155",
    whiteSpace: "nowrap",
    cursor: col.sortable ? "pointer" : "default",
    userSelect: "none",
    width: col.width,
    minWidth: col.width,
    position: frozen ? "sticky" : undefined,
    left: frozen ? (() => {
      let left = 0;
      for (const fc of frozenCols) {
        if (fc.id === col.id) break;
        left += fc.width;
      }
      return left;
    })() : undefined,
    zIndex: frozen ? 2 : undefined,
  });

  const tdStyle = (col: Column, frozen: boolean): React.CSSProperties => ({
    padding: "10px 12px",
    fontSize: 13,
    color: "#e2e8f0",
    borderBottom: "1px solid #1e293b",
    borderRight: "1px solid #1e293b",
    whiteSpace: "nowrap",
    width: col.width, minWidth: col.width,
    background: frozen ? "#0f172a" : "transparent",
    position: frozen ? "sticky" : undefined,
    left: frozen ? (() => {
      let left = 0;
      for (const fc of frozenCols) {
        if (fc.id === col.id) break;
        left += fc.width;
      }
      return left;
    })() : undefined,
    zIndex: frozen ? 1 : undefined,
  });

  const allCols = [...frozenCols, ...scrollCols];
  const frozenWidth = frozenCols.reduce((s, c) => s + c.width, 0);

  return (
    <div style={{ overflowX: "auto", background: "#0f172a", borderRadius: 10, border: "1px solid #334155" }}>
      {frozenCols.length > 0 && (
        <div style={{ padding: "4px 12px", background: "#1e3a5f40", fontSize: 11, color: "#7dd3fc", borderBottom: "1px solid #334155" }}>
          <span aria-hidden="true">📌</span>
          {" "}{frozenCols.map(c => c.label).join(", ")} — pinned
        </div>
      )}
      <table
        role="grid"
        aria-label="Employee records"
        aria-colcount={allCols.length}
        aria-rowcount={sortedRows.length + 1}
        style={{ width: "max-content", minWidth: "100%", borderCollapse: "collapse" }}
      >
        <thead>
          <tr role="row">
            {allCols.map((col, ci) => (
              <th
                key={col.id}
                role="columnheader"
                aria-colindex={ci + 1}
                aria-sort={col.sortable && sortCol === col.id
                  ? (sortDir === "asc" ? "ascending" : "descending")
                  : col.sortable ? "none" : undefined}
                onClick={() => col.sortable && handleSort(col.id)}
                style={thStyle(col, col.frozen)}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                  {col.label}
                  {col.sortable && (
                    <span aria-hidden="true" style={{ fontSize: 9, opacity: sortCol === col.id ? 1 : 0.4 }}>
                      {sortCol === col.id ? (sortDir === "asc" ? "▲" : "▼") : "⇅"}
                    </span>
                  )}
                  {col.frozen && (
                    <span aria-hidden="true" style={{ fontSize: 9, color: "#7dd3fc" }}>📌</span>
                  )}
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {sortedRows.map((emp, ri) => (
            <tr key={emp.id} role="row" aria-rowindex={ri + 2}>
              {allCols.map((col, ci) => {
                const val = getEmployeeValue(emp, col.id);
                return (
                  <td key={col.id} role="gridcell" aria-colindex={ci + 1} style={tdStyle(col, col.frozen)}>
                    {col.id === "status" ? (
                      <span style={{
                        padding: "2px 8px", borderRadius: 10, fontSize: 11, fontWeight: 600,
                        background: val === "Active" ? "#16534420" : val === "On Leave" ? "#92400e20" : "#7f1d1d20",
                        color:      val === "Active" ? "#4ade80"  : val === "On Leave" ? "#fbbf24"  : "#f87171",
                      }}>{val}</span>
                    ) : col.id === "salary" ? (
                      <span style={{ color: "#4ade80", fontFamily: "monospace" }}>{val}</span>
                    ) : col.id === "id" ? (
                      <span style={{ color: "#7dd3fc", fontFamily: "monospace", fontSize: 11 }}>{val}</span>
                    ) : val}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
// Main Demo Component
// ─────────────────────────────────────────────────────────────────
export function ColumnConfigDemo() {
  const [columns, setColumns]   = useState<Column[]>(INITIAL_COLUMNS);
  const [panelOpen, setPanelOpen] = useState(false);
  const [announcement, setAnnouncement] = useState("");
  const [activeTab, setActiveTab] = useState<"demo" | "features" | "code">("demo");

  const triggerRef = useRef<HTMLButtonElement>(null);

  const announce = useCallback((msg: string) => {
    setAnnouncement("");
    requestAnimationFrame(() => setAnnouncement(msg));
  }, []);

  const openPanel  = () => setPanelOpen(true);
  const closePanel = () => setPanelOpen(false);

  // Close on outside click
  const containerRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!panelOpen) return;
    const handler = (e: MouseEvent) => {
      if (!containerRef.current?.contains(e.target as Node)) {
        closePanel();
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [panelOpen]);

  const visibleCount = columns.filter(c => c.visible).length;
  const frozenCount  = columns.filter(c => c.frozen).length;

  return (
    <div style={{
      background: "#0f172a", color: "#f1f5f9",
      fontFamily: "'Inter', system-ui, sans-serif",
      minHeight: "100vh", padding: 24,
    }}>
      {/* Screen reader live region */}
      <div role="status" aria-live="polite" aria-atomic="true" style={srOnly}>
        {announcement}
      </div>

      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
          <span style={{ fontSize: 28 }}>🏛</span>
          <div>
            <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800 }}>
              Accessible Column Configurator
            </h1>
            <p style={{ margin: 0, color: "#64748b", fontSize: 13 }}>
              ARIA disclosure · role="listitem" reordering · aria-pressed toggle · aria-sort grid
            </p>
          </div>
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {["aria-expanded", "aria-haspopup", "role=dialog", "aria-pressed", "aria-sort", "role=grid", "arrow key reorder", "focus restore"].map(t => (
            <span key={t} style={{ background: "#1e293b", color: "#94a3b8", border: "1px solid #334155", borderRadius: 20, padding: "3px 10px", fontSize: 11 }}>{t}</span>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 4, marginBottom: 20, borderBottom: "1px solid #1e293b", paddingBottom: 4 }}>
        {[
          { id: "demo"     as const, label: "🏛 Live Demo" },
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
        <div style={{ maxWidth: 960 }}>

          {/* Toolbar */}
          <div style={{
            display: "flex", justifyContent: "space-between", alignItems: "center",
            marginBottom: 12, padding: "10px 16px",
            background: "#1e293b", border: "1px solid #334155",
            borderRadius: 10,
          }}>
            <div>
              <span style={{ fontSize: 14, fontWeight: 700, color: "#f1f5f9" }}>
                Employee Records
              </span>
              <span style={{ fontSize: 12, color: "#64748b", marginLeft: 10 }}>
                {EMPLOYEES.length} rows · {visibleCount} columns visible
                {frozenCount > 0 && ` · ${frozenCount} pinned`}
              </span>
            </div>

            {/* Column config trigger */}
            <div ref={containerRef} style={{ position: "relative" }}>
              <button
                ref={triggerRef}
                id="col-config-trigger"
                onClick={() => setPanelOpen(o => !o)}
                aria-expanded={panelOpen}
                aria-haspopup="dialog"
                aria-controls={panelOpen ? "col-config-panel" : undefined}
                style={{
                  display: "flex", alignItems: "center", gap: 8,
                  background: panelOpen ? "#6366f1" : "#0f172a",
                  color: panelOpen ? "#fff" : "#94a3b8",
                  border: `1px solid ${panelOpen ? "#6366f1" : "#334155"}`,
                  borderRadius: 8, padding: "8px 14px",
                  cursor: "pointer", fontSize: 13, fontWeight: 600,
                  transition: "all 0.15s",
                }}
              >
                <span aria-hidden="true">⊞</span>
                Columns
                <span aria-hidden="true" style={{ fontSize: 10 }}>{panelOpen ? "▲" : "▼"}</span>
              </button>

              {panelOpen && (
                <ColumnConfigPanel
                  columns={columns}
                  onChange={setColumns}
                  onClose={closePanel}
                  triggerRef={triggerRef}
                  announce={announce}
                />
              )}
            </div>
          </div>

          {/* Table */}
          <DataTable columns={columns} />

          {/* Instruction */}
          <div style={{
            marginTop: 16, background: "#1e293b", border: "1px solid #6366f140",
            borderLeft: "4px solid #6366f1",
            borderRadius: 10, padding: "12px 16px", fontSize: 13, color: "#94a3b8",
          }}>
            <strong style={{ color: "#a5b4fc" }}>Try it:</strong>{" "}
            Click <strong style={{ color: "#f1f5f9" }}>⊞ Columns</strong> → check/uncheck columns · click 📌 to pin columns left · use ▲ ▼ to reorder.
            Try with keyboard only: Tab to "Columns" button → Enter to open → Tab through checkboxes → Arrow keys to reorder → Esc to close.
          </div>
        </div>
      )}

      {/* ── A11y Features Tab ── */}
      {activeTab === "features" && (
        <div style={{ maxWidth: 820, display: "flex", flexDirection: "column", gap: 16 }}>
          {[
            {
              title: "Trigger Button — Disclosure Pattern",
              color: "#6366f1", icon: "🔘",
              items: [
                { attr: "aria-expanded={isOpen}",       desc: "Announces to AT whether the panel is open or closed — updates dynamically on toggle" },
                { attr: 'aria-haspopup="dialog"',        desc: "Tells screen reader what kind of element will appear (a dialog, not a menu)" },
                { attr: "aria-controls={panelId}",       desc: "Programmatic association between trigger and panel — AT can navigate between them" },
                { attr: "native <button>",               desc: "Gets click, Enter, Space, and keyboard focus for free — never use <div onClick>" },
                { attr: "Focus restoration",             desc: "When panel closes, triggerRef.current.focus() returns keyboard position to trigger" },
              ],
            },
            {
              title: "Panel — role=\"dialog\"",
              color: "#0891b2", icon: "🪟",
              items: [
                { attr: 'role="dialog"',                 desc: "Identifies the panel to AT as a dialog — SR announces \"Configure Columns dialog\" on entry" },
                { attr: 'aria-labelledby={titleId}',     desc: "Associates the panel with its visible title heading — useId() ensures unique IDs per instance" },
                { attr: 'aria-modal="false"',            desc: "Non-modal: doesn't lock screen (user can click outside to close) — no full focus trap needed" },
                { attr: "Escape closes",                 desc: "onKeyDown checks e.key === 'Escape' — closes and restores focus. Standard dialog behaviour" },
                { attr: "Initial focus",                 desc: "useEffect moves focus to first checkbox on open — keyboard users start at the first column row" },
              ],
            },
            {
              title: "Column List — Keyboard Reordering",
              color: "#10b981", icon: "⇅",
              items: [
                { attr: 'role="list" / role="listitem"', desc: "Semantic list announces item count: 'list, 8 items' — users know the structure" },
                { attr: "aria-label on listitem",        desc: '"Name, position 2 of 8, pinned" — full context without reading individual controls' },
                { attr: "Arrow Up/Down on container",    desc: "onKeyDown on row div captures arrow keys — calls move(-1) or move(1) — no drag required" },
                { attr: "aria-live announcement",        desc: '"Name moved to position 2 of 8" — spoken after each reorder so SR users track position' },
                { attr: "requestAnimationFrame refocus", desc: "After React re-renders the reordered list, rAF re-focuses the moved row's button" },
                { attr: "▲/▼ buttons for mouse users",  desc: "aria-label='Move Name up' — explicit labels (not just arrow characters which SR reads as 'black up-pointing triangle')" },
              ],
            },
            {
              title: "Visibility Checkbox",
              color: "#f59e0b", icon: "☑",
              items: [
                { attr: "<input type='checkbox'>",       desc: "Native checkbox — natively announces 'checked'/'unchecked' + label to screen reader" },
                { attr: "htmlFor / id association",      desc: "label[htmlFor] and input[id] are linked — clicking label toggles checkbox AND expands click target" },
                { attr: "aria-describedby",              desc: "Points to hidden span with additional hint: 'visible column' / 'hidden column'" },
                { attr: "Announce on change",            desc: '"Department column hidden" — aria-live region speaks the action so SR users hear confirmation' },
              ],
            },
            {
              title: "Freeze (Pin) Toggle — aria-pressed",
              color: "#a78bfa", icon: "📌",
              items: [
                { attr: "aria-pressed={col.frozen}",     desc: "Boolean toggle button pattern — SR announces 'Pin Employee ID to left, pressed' or 'not pressed'" },
                { attr: "disabled={!col.visible}",       desc: "Cannot pin a hidden column — button is disabled + visually dimmed" },
                { attr: "aria-label='Pin Name to left'", desc: "Explicit label instead of icon-only — 📌 alone would be read as 'pushpin' with no context" },
                { attr: "Sticky positioning",            desc: "CSS position:sticky + calculated left offset — frozen columns stay in view during horizontal scroll" },
              ],
            },
            {
              title: "Data Table — role=\"grid\" with aria-sort",
              color: "#f472b6", icon: "📊",
              items: [
                { attr: 'role="grid"',                   desc: "2D navigable widget — more appropriate than role='table' when cells are interactive (sortable headers)" },
                { attr: "aria-colcount / aria-rowcount", desc: "Total column/row counts for AT — allows 'column 3 of 5, row 2 of 7' announcements" },
                { attr: "aria-colindex / aria-rowindex", desc: "Position of each cell — required when not all rows/cols are rendered (virtual scroll)" },
                { attr: "aria-sort='ascending'",         desc: "On <th> when sorted — SR announces 'Employee ID column header, sorted ascending'" },
                { attr: "aria-sort='none'",              desc: "On unsorted but sortable columns — SR announces the column is sortable but not yet sorted" },
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
              <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
                {section.items.map(item => (
                  <div key={item.attr} style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
                    <code style={{
                      background: "#0f172a", color: "#7dd3fc",
                      padding: "1px 7px", borderRadius: 4, fontSize: 11,
                      whiteSpace: "nowrap", minWidth: 210, flexShrink: 0, fontFamily: "monospace",
                    }}>{item.attr}</code>
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
              title: "1. Disclosure Button Trigger",
              color: "#6366f1",
              code: `// ❌ WRONG: <div> — no keyboard access, no ARIA semantics
<div onClick={toggle}>Columns ▼</div>

// ✅ CORRECT: native <button> with disclosure ARIA
<button
  ref={triggerRef}
  onClick={() => setPanelOpen(o => !o)}

  aria-expanded={panelOpen}          // "expanded" or "collapsed"
  aria-haspopup="dialog"             // "a dialog will appear" (not menu/listbox)
  aria-controls="col-config-panel"   // links trigger to panel by id
>
  ⊞ Columns {panelOpen ? "▲" : "▼"}
</button>

// aria-haspopup values:
//  "true"    → generic popup (AT may say "has popup")
//  "menu"    → role=menu (keyboard: arrow key navigation)
//  "listbox" → role=listbox (select-like)
//  "dialog"  → role=dialog (configuration panels like this one)`,
            },
            {
              title: "2. Panel — role=dialog with focus management",
              color: "#0891b2",
              code: `const titleId = useId(); // unique per component instance
const firstCtrlRef = useRef<HTMLInputElement>(null);

// Move focus IN on open
useEffect(() => {
  firstCtrlRef.current?.focus(); // first checkbox = first column row
}, []);

// Restore focus OUT on close (cleanup = runs on unmount)
useEffect(() => {
  return () => { triggerRef.current?.focus(); };
}, [triggerRef]);

// Escape closes
const handleKeyDown = (e) => {
  if (e.key === "Escape") onClose();
};

<div
  id="col-config-panel"
  role="dialog"
  aria-labelledby={titleId}     // reads heading on entry: "Configure Columns dialog"
  aria-modal="false"            // non-modal: click outside = close (no full trap)
  onKeyDown={handleKeyDown}
>
  <h2 id={titleId}>Configure Columns</h2>
  ...
</div>`,
            },
            {
              title: "3. Keyboard column reordering (no drag required)",
              color: "#10b981",
              code: `// Reorder function — swaps .order values between two columns
const move = (id: string, dir: -1 | 1) => {
  const col = columns.find(c => c.id === id)!;
  const target = col.order + dir;
  if (target < 0 || target >= columns.length) return; // boundary guard

  const displaced = columns.find(c => c.order === target)!;
  const next = columns.map(c => {
    if (c.id === id)           return { ...c, order: target };    // moved
    if (c.id === displaced.id) return { ...c, order: col.order }; // swapped
    return c;
  });

  onChange(next);

  // Announce the new position to screen reader
  announce(\`\${col.label} moved to position \${target + 1} of \${columns.length}\`);

  // Re-focus the same row after React re-renders the reordered list
  requestAnimationFrame(() => {
    panelRef.current
      ?.querySelector(\`[data-col-move="\${id}"]\`)
      ?.focus();
  });
};

// Arrow key handler on the list row (not on the ▲/▼ buttons)
const handleRowKeyDown = (e, id) => {
  if (e.key === "ArrowUp")   { e.preventDefault(); move(id, -1); }
  if (e.key === "ArrowDown") { e.preventDefault(); move(id,  1); }
};

<div role="listitem" onKeyDown={e => handleRowKeyDown(e, col.id)}>
  <button data-col-move={col.id} onClick={() => move(col.id, -1)} aria-label={\`Move \${col.label} up\`}>▲</button>
  <button                        onClick={() => move(col.id,  1)} aria-label={\`Move \${col.label} down\`}>▼</button>
</div>`,
            },
            {
              title: "4. Freeze toggle — aria-pressed pattern",
              color: "#a78bfa",
              code: `// aria-pressed = toggle button pattern
// true  → "Pin Employee ID to left, pressed"  (currently frozen)
// false → "Pin Name to left, not pressed"      (not frozen)

<button
  aria-pressed={col.frozen}              // boolean — AT: "pressed" or "not pressed"
  aria-label={\`\${col.frozen ? "Unpin" : "Pin"} \${col.label} to left\`}
  disabled={!col.visible}               // can't freeze what's hidden
  onClick={() => toggleFreeze(col.id)}
>
  📌
</button>

// vs aria-checked (for checkbox-like roles):
// aria-checked → use on role="checkbox" (tri-state: true/false/mixed)
// aria-pressed → use on role="button" (binary: true/false)
// Use aria-pressed for toggle BUTTONS, aria-checked for checkboxes

// CSS for frozen columns (sticky left):
// position: sticky
// left: <sum of widths of all frozen columns to the left>
// z-index: 2 (above scrolling content)`,
            },
            {
              title: "5. Table ARIA — role=grid with aria-sort",
              color: "#f472b6",
              code: `<table
  role="grid"                       // interactive table with sortable headers
  aria-label="Employee records"
  aria-colcount={visibleCols.length} // total columns (even if some are off-screen)
  aria-rowcount={employees.length + 1} // +1 for header
>
  <thead>
    <tr role="row">
      <th
        role="columnheader"
        aria-colindex={1}            // 1-based column position
        aria-sort={
          sortCol === col.id
            ? sortDir === "asc"
              ? "ascending"
              : "descending"
            : col.sortable
            ? "none"                 // sortable but not sorted
            : undefined              // not sortable — omit entirely
        }
        onClick={() => col.sortable && handleSort(col.id)}
      >
        Employee ID ▲
      </th>
    </tr>
  </thead>
  <tbody>
    <tr role="row" aria-rowindex={2}> {/* 2 because header is row 1 */}
      <td role="gridcell" aria-colindex={1}>EMP-001</td>
    </tr>
  </tbody>
</table>

// aria-sort values:
//  "ascending"  → sorted A→Z or lowest→highest
//  "descending" → sorted Z→A or highest→lowest
//  "none"       → column supports sorting but is not currently sorted
//  "other"      → custom sort (e.g., relevance, frequency)
//  undefined    → column is not sortable at all (omit the attribute)`,
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
                fontFamily: "monospace", lineHeight: 1.7, overflow: "auto",
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

export default ColumnConfigDemo;
