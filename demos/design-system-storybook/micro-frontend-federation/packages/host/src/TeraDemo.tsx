/**
 * TeraDemo.tsx
 *
 * TERA — Traveloka Extranet for Accommodation Partners
 *
 * The "supply-side" dashboard: hotels & properties manage their
 * listings, pricing, availability, and bookings on Traveloka.
 *
 * Responsibilities:
 *   Web:     React, Next.js, TypeScript, Redux
 *   Mobile:  React Native (Android + iOS)
 *   Testing: Jest (standard, boundary, incorrect input)
 *   Infra:   Soya design system contributor
 *   Legacy:  11 pages migrated from Apache Velocity (35 man-weeks)
 *
 * TABS
 *   🏨 TERA Dashboard  — availability calendar, booking queue, analytics
 *   🔄 Migration       — Apache Velocity → React/TS, Soya design system
 *   🧪 Testing         — Jest: standard, boundary, incorrect cases
 */

import React, { useState, useMemo } from "react";

// ─────────────────────────────────────────────────────────────────
// Data — TERA Dashboard
// ─────────────────────────────────────────────────────────────────

type AvailabilityStatus = "available" | "closed" | "sold-out";

interface RoomType {
  id: string;
  name: string;
  baseRate: number;
  capacity: number;
}

const ROOM_TYPES: RoomType[] = [
  { id: "std",   name: "Standard Room",    baseRate: 550_000,   capacity: 20 },
  { id: "dlx",   name: "Deluxe Room",      baseRate: 850_000,   capacity: 12 },
  { id: "suite", name: "Junior Suite",     baseRate: 1_500_000, capacity: 5  },
];

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

const BOOKINGS = [
  { id: "BK-2841", guest: "Nguyen Van A",   room: "Deluxe Room",   checkIn: "Jun 19", checkOut: "Jun 22", nights: 3, amount: 2_550_000, status: "pending"   },
  { id: "BK-2840", guest: "Tran Thi B",     room: "Standard Room", checkIn: "Jun 18", checkOut: "Jun 20", nights: 2, amount: 1_100_000, status: "confirmed"  },
  { id: "BK-2839", guest: "Pham Minh C",    room: "Junior Suite",  checkIn: "Jun 21", checkOut: "Jun 24", nights: 3, amount: 4_500_000, status: "confirmed"  },
  { id: "BK-2838", guest: "Le Hoang D",     room: "Standard Room", checkIn: "Jun 17", checkOut: "Jun 19", nights: 2, amount: 1_100_000, status: "checked-in" },
];

const ANALYTICS = [
  { label: "Occupancy Rate",     value: "73.2%",    change: "+5.4%",    color: "#22c55e" },
  { label: "RevPAR",             value: "402K",     change: "+12.1%",   color: "#0ea5e9" },
  { label: "ADR (Avg Daily)",    value: "548K VND", change: "+2.3%",    color: "#a855f7" },
  { label: "Review Score",       value: "8.7 / 10", change: "+0.3",     color: "#f59e0b" },
];

// ─────────────────────────────────────────────────────────────────
// Data — Migration
// ─────────────────────────────────────────────────────────────────

const MIGRATION_PAGES = [
  { name: "Room List & Availability",       size: "L",  weeks: 5.0, status: "done" },
  { name: "Rate Management",                size: "L",  weeks: 4.0, status: "done" },
  { name: "Booking Management",             size: "L",  weeks: 4.5, status: "done" },
  { name: "Guest Review Dashboard",         size: "M",  weeks: 3.0, status: "done" },
  { name: "Revenue Analytics",              size: "M",  weeks: 3.0, status: "done" },
  { name: "Property Content Editor",        size: "M",  weeks: 2.5, status: "done" },
  { name: "Photo Gallery Manager",          size: "M",  weeks: 2.5, status: "done" },
  { name: "Promotion Manager",              size: "S",  weeks: 2.0, status: "done" },
  { name: "Partner Account Settings",       size: "S",  weeks: 1.5, status: "done" },
  { name: "Notification Centre",            size: "S",  weeks: 1.5, status: "done" },
  { name: "Help & Support",                 size: "XS", weeks: 1.0, status: "done" },
];

// ─────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────

function CodeBlock({ code, label, color = "#64748b" }: { code: string; label?: string; color?: string }) {
  return (
    <div style={{ background: "#0a0a14", borderRadius: 8, overflow: "hidden", border: "1px solid #1e293b" }}>
      {label && <div style={{ padding: "5px 12px", borderBottom: "1px solid #1e293b", fontSize: 10, color }}>{label}</div>}
      <pre style={{ margin: 0, padding: 12, fontSize: 9, fontFamily: "monospace", color: "#94a3b8", lineHeight: 1.7, overflow: "auto", maxHeight: 280 }}>{code}</pre>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
// Main
// ─────────────────────────────────────────────────────────────────

export function TeraDemo() {
  const [activeTab, setActiveTab] = useState<"dashboard" | "migration" | "testing">("dashboard");

  // ── Dashboard state
  const [selectedRoom, setSelectedRoom] = useState<string>("dlx");
  // availability[roomId][dayIndex] = { status, rate, inventory }
  const [availability, setAvailability] = useState<
    Record<string, { status: AvailabilityStatus; rate: number; inv: number }[]>
  >(() =>
    Object.fromEntries(
      ROOM_TYPES.map(rt => [
        rt.id,
        DAYS.map((_, i) => ({
          status: (["available", "available", "sold-out", "available", "available", "closed", "available"] as AvailabilityStatus[])[i],
          rate: rt.baseRate + (i >= 4 ? rt.baseRate * 0.2 : 0),
          inv: i === 2 ? 0 : i === 5 ? 0 : Math.floor(rt.capacity * 0.6),
        })),
      ])
    )
  );
  const [editCell, setEditCell] = useState<{ roomId: string; dayIdx: number } | null>(null);
  const [editRate, setEditRate] = useState("");

  const [bookingFilter, setBookingFilter] = useState<"all" | "pending">("all");
  const filteredBookings = BOOKINGS.filter(b => bookingFilter === "all" || b.status === "pending");

  const cycleStatus = (roomId: string, dayIdx: number) => {
    setAvailability(prev => {
      const day = prev[roomId][dayIdx];
      const next: AvailabilityStatus = day.status === "available" ? "closed" : day.status === "closed" ? "available" : "available";
      const updated = [...prev[roomId]];
      updated[dayIdx] = { ...day, status: next, inv: next === "closed" ? 0 : Math.floor(ROOM_TYPES.find(r => r.id === roomId)!.capacity * 0.6) };
      return { ...prev, [roomId]: updated };
    });
  };

  const saveRate = () => {
    if (!editCell) return;
    const val = parseInt(editRate.replace(/,/g, ""), 10);
    if (!isNaN(val) && val > 0) {
      setAvailability(prev => {
        const updated = [...prev[editCell.roomId]];
        updated[editCell.dayIdx] = { ...updated[editCell.dayIdx], rate: val };
        return { ...prev, [editCell.roomId]: updated };
      });
    }
    setEditCell(null);
  };

  // ── Migration state
  const totalWeeks = useMemo(() => MIGRATION_PAGES.reduce((s, p) => s + p.weeks, 0), []);

  // ── Testing state
  type TestStatus = "idle" | "running" | "pass" | "fail";
  const [testSuite, setTestSuite] = useState<"standard" | "boundary" | "incorrect">("standard");
  const [testStatus, setTestStatus] = useState<TestStatus>("idle");
  const [testLog, setTestLog] = useState<string[]>([]);

  const runTests = async () => {
    setTestStatus("running");
    setTestLog([]);
    const suites: Record<typeof testSuite, { msg: string; pass: boolean }[]> = {
      standard: [
        { msg: "✓ availability: 5 rooms returned for valid date range", pass: true },
        { msg: "✓ pricing: base rate + weekend surcharge applied correctly", pass: true },
        { msg: "✓ booking: status updated to CONFIRMED after payment", pass: true },
        { msg: "✓ review: response saved and published immediately", pass: true },
        { msg: "✓ analytics: revenue calculated correctly (nights × rate)", pass: true },
      ],
      boundary: [
        { msg: "✓ availability: 0 rooms (sold-out) returns empty array", pass: true },
        { msg: "✓ availability: 1 room left → inventory = 1", pass: true },
        { msg: "✓ pricing: minimum rate floor (50,000 VND) enforced", pass: true },
        { msg: "✓ booking: check-in = check-out (0 nights) → rejected", pass: true },
        { msg: "✓ booking: max 365-night stay → accepted at boundary", pass: true },
        { msg: "✓ review score: 10.0 boundary value accepted", pass: true },
      ],
      incorrect: [
        { msg: "✓ pricing: negative rate (-1) → throws RateValidationError", pass: true },
        { msg: "✓ availability: null date → throws InvalidDateError", pass: true },
        { msg: "✓ booking: check-out before check-in → throws DateRangeError", pass: true },
        { msg: "✓ booking: non-existent roomId → returns 404 NotFoundError", pass: true },
        { msg: "✓ review: rating > 10 → clamps to 10 with warning", pass: true },
        { msg: "✗ availability: empty string date → should throw, returned null", pass: false },
      ],
    };

    const cases = suites[testSuite];
    for (const c of cases) {
      await new Promise(r => setTimeout(r, 200));
      setTestLog(prev => [...prev, c.msg]);
    }
    const allPass = cases.every(c => c.pass);
    setTestStatus(allPass ? "pass" : "fail");
  };

  const statusColor: Record<string, string> = {
    available: "#22c55e", "sold-out": "#ef4444", closed: "#475569",
    pending: "#f59e0b", confirmed: "#22c55e", "checked-in": "#0ea5e9",
  };

  const TABS = [
    { id: "dashboard" as const, label: "🏨 TERA Dashboard" },
    { id: "migration" as const, label: "🔄 Migration" },
    { id: "testing"   as const, label: "🧪 Testing" },
  ];

  return (
    <div style={{ background: "#0f172a", color: "#f1f5f9", fontFamily: "'Inter', system-ui, sans-serif", minHeight: "100vh", padding: 24 }}>

      {/* Header */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
          <div style={{ width: 36, height: 36, borderRadius: 8, background: "linear-gradient(135deg,#0066ff,#003ec7)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>✈</div>
          <div>
            <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800 }}>TERA — Traveloka Extranet</h1>
            <p style={{ margin: 0, color: "#64748b", fontSize: 13 }}>
              Accommodation Partner Dashboard · Web + Mobile · 11 pages migrated (35 man-weeks) · Soya Design System
            </p>
          </div>
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {["TERA Web", "TERA Mobile", "React Native", "Next.js", "TypeScript", "Redux", "Jest", "Soya (Internal DS)", "Apache Velocity → React", "35 man-weeks"].map(t => (
            <span key={t} style={{ background: "#1e293b", color: "#94a3b8", border: "1px solid #334155", borderRadius: 20, padding: "3px 10px", fontSize: 11 }}>{t}</span>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 4, marginBottom: 20, borderBottom: "1px solid #1e293b", paddingBottom: 4 }}>
        {TABS.map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{
            background: activeTab === tab.id ? "#1e293b" : "transparent",
            color: activeTab === tab.id ? "#f1f5f9" : "#64748b",
            border: activeTab === tab.id ? "1px solid #334155" : "1px solid transparent",
            borderRadius: "8px 8px 0 0", padding: "8px 20px", cursor: "pointer", fontSize: 13, fontWeight: 600,
          }}>{tab.label}</button>
        ))}
      </div>

      {/* ── DASHBOARD ── */}
      {activeTab === "dashboard" && (
        <div>
          {/* Analytics row */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8, marginBottom: 14 }}>
            {ANALYTICS.map(a => (
              <div key={a.label} style={{ background: "#1e293b", border: `1px solid ${a.color}20`, borderRadius: 8, padding: 10 }}>
                <div style={{ fontSize: 8, color: "#64748b", marginBottom: 3 }}>{a.label}</div>
                <div style={{ fontSize: 18, fontWeight: 900, color: a.color }}>{a.value}</div>
                <div style={{ fontSize: 9, color: a.color }}>↑ {a.change} vs last month</div>
              </div>
            ))}
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 280px", gap: 12 }}>
            {/* Availability Calendar */}
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: "#64748b", letterSpacing: "0.08em" }}>AVAILABILITY & RATE MANAGEMENT — Week of Jun 16</div>
                <div style={{ display: "flex", gap: 6 }}>
                  {ROOM_TYPES.map(rt => (
                    <button key={rt.id} onClick={() => setSelectedRoom(rt.id)} style={{ background: selectedRoom === rt.id ? "#1e3a5f" : "#1e293b", border: `1px solid ${selectedRoom === rt.id ? "#3b82f6" : "#334155"}`, borderRadius: 6, padding: "4px 10px", color: selectedRoom === rt.id ? "#60a5fa" : "#64748b", cursor: "pointer", fontSize: 9 }}>
                      {rt.name.split(" ")[0]}
                    </button>
                  ))}
                </div>
              </div>

              {/* Calendar grid */}
              <div style={{ background: "#1e293b", border: "1px solid #334155", borderRadius: 10, overflow: "hidden" }}>
                {/* Day headers */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr repeat(7, 1fr)", borderBottom: "1px solid #0f172a" }}>
                  <div style={{ padding: "6px 10px", fontSize: 8, color: "#475569" }}>Room Type</div>
                  {DAYS.map((d, i) => (
                    <div key={d} style={{ padding: "6px 4px", textAlign: "center", fontSize: 8, color: i >= 5 ? "#f59e0b" : "#64748b", fontWeight: i >= 5 ? 700 : 400 }}>
                      {d}<br /><span style={{ color: "#334155" }}>{16 + i}</span>
                    </div>
                  ))}
                </div>

                {ROOM_TYPES.filter(rt => rt.id === selectedRoom).map(rt =>
                  availability[rt.id].map((cell, dayIdx) => (
                    <div key={dayIdx} style={{ display: "contents" }}>
                      {dayIdx === 0 && (
                        <div style={{ gridColumn: "1", padding: "10px 10px", borderBottom: "1px solid #0f172a", display: "flex", flexDirection: "column", justifyContent: "center" }}>
                          <div style={{ fontSize: 9, fontWeight: 700 }}>{rt.name}</div>
                          <div style={{ fontSize: 7, color: "#475569" }}>{rt.capacity} rooms total</div>
                        </div>
                      )}
                    </div>
                  ))
                )}

                {/* Actual cells row */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr repeat(7, 1fr)", padding: "4px 0" }}>
                  <div />
                  {availability[selectedRoom].map((cell, dayIdx) => {
                    const isEdit = editCell?.roomId === selectedRoom && editCell.dayIdx === dayIdx;
                    return (
                      <div key={dayIdx} style={{ padding: "4px 3px", textAlign: "center" }}>
                        {/* Status badge */}
                        <div onClick={() => cycleStatus(selectedRoom, dayIdx)} style={{ cursor: "pointer", background: statusColor[cell.status] + "20", color: statusColor[cell.status], borderRadius: 4, padding: "2px 4px", fontSize: 7, fontWeight: 700, marginBottom: 3 }}>
                          {cell.status === "available" ? `${cell.inv} avail` : cell.status.toUpperCase()}
                        </div>
                        {/* Rate */}
                        {isEdit ? (
                          <input autoFocus value={editRate} onChange={e => setEditRate(e.target.value)} onBlur={saveRate} onKeyDown={e => e.key === "Enter" && saveRate()} style={{ width: "100%", background: "#0f172a", border: "1px solid #3b82f6", borderRadius: 3, padding: "2px 3px", color: "#f1f5f9", fontSize: 8, textAlign: "center", boxSizing: "border-box" }} />
                        ) : (
                          <div onClick={() => { setEditCell({ roomId: selectedRoom, dayIdx }); setEditRate(String(cell.rate)); }} style={{ cursor: "text", fontSize: 8, color: cell.status === "available" ? "#f1f5f9" : "#334155", background: "#0f172a", borderRadius: 3, padding: "2px 3px" }}>
                            {(cell.rate / 1000).toFixed(0)}K
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                <div style={{ padding: "6px 10px", borderTop: "1px solid #0f172a", fontSize: 8, color: "#475569" }}>
                  💡 Click status badge to toggle availability · Click rate to edit · Rates in VND
                </div>
              </div>

              <div style={{ marginTop: 10 }}>
                <CodeBlock label="Redux — TERA availability state management" color="#0066ff" code={
`// TERA uses Redux to manage complex partner state:
// multiple properties × multiple room types × N days of availability.
// The state shape must support:
//   - Optimistic updates (partner clicks, sees instant feedback)
//   - Batch saves (multiple cells changed before one API call)
//   - Conflict resolution (another admin edited while you were working)

// Availability slice:
interface AvailabilityState {
  byProperty: Record<string, PropertyAvailability>;
  pendingChanges: ChangeRecord[];  // unsaved edits
  lastSyncedAt: string | null;
  syncStatus: "idle" | "saving" | "conflict" | "error";
}

const availabilitySlice = createSlice({
  name: "availability",
  initialState,
  reducers: {
    // Optimistic: update locally before server confirms
    updateCell: (state, action: PayloadAction<CellUpdate>) => {
      const { propertyId, roomId, date, rate, inventory, status } = action.payload;
      const cell = state.byProperty[propertyId]?.rooms[roomId]?.days[date];
      if (cell) {
        cell.rate = rate ?? cell.rate;
        cell.inventory = inventory ?? cell.inventory;
        cell.status = status ?? cell.status;
        cell.dirty = true;  // mark as unsaved
      }
      state.pendingChanges.push({ propertyId, roomId, date, ...action.payload });
    },
    // On server conflict: merge server version with local changes
    resolveConflict: (state, action) => {
      const { serverVersion } = action.payload;
      // Apply server changes to non-dirty cells only
      state.syncStatus = "idle";
    },
  },
});`} />
              </div>
            </div>

            {/* Bookings + Reviews */}
            <div>
              <div style={{ display: "flex", gap: 6, marginBottom: 8 }}>
                {(["all", "pending"] as const).map(f => (
                  <button key={f} onClick={() => setBookingFilter(f)} style={{ background: bookingFilter === f ? "#1e3a5f" : "#1e293b", border: `1px solid ${bookingFilter === f ? "#3b82f6" : "#334155"}`, borderRadius: 6, padding: "4px 10px", cursor: "pointer", color: bookingFilter === f ? "#60a5fa" : "#64748b", fontSize: 9 }}>
                    {f === "all" ? "All Bookings" : "⏳ Pending"}
                  </button>
                ))}
              </div>
              <div style={{ background: "#1e293b", border: "1px solid #334155", borderRadius: 10, overflow: "hidden", marginBottom: 10 }}>
                {filteredBookings.map((b, i) => (
                  <div key={b.id} style={{ padding: "9px 10px", borderBottom: i < filteredBookings.length - 1 ? "1px solid #0f172a" : "none", borderLeft: `3px solid ${statusColor[b.status]}` }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 2 }}>
                      <div style={{ fontSize: 9, fontWeight: 700 }}>{b.guest}</div>
                      <div style={{ fontSize: 7, color: statusColor[b.status] }}>{b.status.toUpperCase()}</div>
                    </div>
                    <div style={{ fontSize: 8, color: "#64748b" }}>{b.room} · {b.checkIn}→{b.checkOut} ({b.nights}N)</div>
                    <div style={{ display: "flex", justifyContent: "space-between", marginTop: 3 }}>
                      <div style={{ fontSize: 8, color: "#475569" }}>{b.id}</div>
                      <div style={{ fontSize: 9, fontWeight: 700, color: "#f1f5f9" }}>{(b.amount / 1000).toFixed(0)}K VND</div>
                    </div>
                    {b.status === "pending" && (
                      <div style={{ display: "flex", gap: 4, marginTop: 5 }}>
                        <button style={{ flex: 1, background: "#22c55e20", border: "1px solid #22c55e40", borderRadius: 4, padding: "3px", color: "#4ade80", cursor: "pointer", fontSize: 8 }}>✓ Accept</button>
                        <button style={{ flex: 1, background: "#ef444420", border: "1px solid #ef444440", borderRadius: 4, padding: "3px", color: "#fca5a5", cursor: "pointer", fontSize: 8 }}>✗ Decline</button>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              <CodeBlock label="React Native — cross-platform TERA mobile" color="#22c55e" code={
`// TERA mobile: same product on Android + iOS.
// React Native shares business logic; platform adapts UI.

// WHAT IS SHARED (> 80% of codebase):
//   - API calls (axios service layer)
//   - Redux state + selectors
//   - Business logic (rate calculation, validation)
//   - Navigation structure (React Navigation)
//   - Custom hooks (useAvailability, useBookings)

// WHAT IS PLATFORM-SPECIFIC:
//   - Push notifications: FCM (Android) vs APNs (iOS)
//   - Biometric auth: Fingerprint vs Face ID
//   - Date picker: platform native component
//   - Camera (for property photo upload)

// Platform-specific code pattern:
import { Platform } from "react-native";

const DatePickerComponent = Platform.select({
  ios:     () => require("./DatePickerIOS").default,
  android: () => require("./DatePickerAndroid").default,
})!();

// Key TERA mobile features:
// Partners check bookings on the go → push notification on new booking.
// Quick accept/decline without opening the web dashboard.
// Availability toggle: mark rooms closed for a date in 2 taps.
// Photo upload directly from camera for property content.`} />
            </div>
          </div>
        </div>
      )}

      {/* ── MIGRATION ── */}
      {activeTab === "migration" && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
          {/* Migration table */}
          <div>
            <div style={{ fontSize: 10, fontWeight: 700, color: "#64748b", marginBottom: 8, letterSpacing: "0.08em" }}>
              11 PAGES · {totalWeeks.toFixed(1)} MAN-WEEKS MIGRATED
            </div>
            <div style={{ background: "#1e293b", border: "1px solid #334155", borderRadius: 10, overflow: "hidden", marginBottom: 10 }}>
              {/* Header */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 30px 60px 50px", padding: "6px 10px", borderBottom: "1px solid #0f172a", fontSize: 8, color: "#475569" }}>
                <div>Page</div><div>Size</div><div>Est. Weeks</div><div>Status</div>
              </div>
              {MIGRATION_PAGES.map((p, i) => (
                <div key={p.name} style={{ display: "grid", gridTemplateColumns: "1fr 30px 60px 50px", padding: "7px 10px", borderBottom: i < MIGRATION_PAGES.length - 1 ? "1px solid #0f172a" : "none", alignItems: "center" }}>
                  <div style={{ fontSize: 9, fontWeight: 500 }}>{p.name}</div>
                  <div style={{ fontSize: 8, background: { L: "#0ea5e920", M: "#f59e0b20", S: "#a855f720", XS: "#64748b20" }[p.size], color: { L: "#38bdf8", M: "#fbbf24", S: "#c084fc", XS: "#94a3b8" }[p.size], borderRadius: 3, padding: "1px 4px", textAlign: "center" }}>{p.size}</div>
                  <div style={{ fontSize: 8, color: "#64748b" }}>{p.weeks}w</div>
                  <div style={{ fontSize: 8, color: "#22c55e" }}>✓ Done</div>
                </div>
              ))}
              <div style={{ padding: "8px 10px", borderTop: "1px solid #334155", display: "flex", justifyContent: "space-between" }}>
                <div style={{ fontSize: 9, color: "#64748b" }}>Total</div>
                <div style={{ fontSize: 10, fontWeight: 800, color: "#22c55e" }}>{totalWeeks.toFixed(1)} man-weeks</div>
              </div>
            </div>

            {/* Before/After code */}
            <CodeBlock label="BEFORE — Apache Velocity template (Java monorepo)" color="#ef4444" code={
`## Apache Velocity (.vm) — Room availability template
## Data bound from Java server controller at render time.
## No interactivity without a full page reload.
## No TypeScript. No components. No reusability.
## Testing: manual QA only. No unit tests possible.

#macro(renderRoomRow $room)
<tr class="room-row" data-id="$room.id">
  <td class="room-name">$room.name</td>
  #foreach($day in $days)
    #set($cell = $room.getAvailability($day))
    <td class="cell cell-$cell.status"
        onclick="updateCell('$room.id', '$day.formatted')">
      #if($cell.status == "available")
        <span class="inventory">$cell.inventory</span>
        <span class="rate">
          $velocityHelper.formatNumber($cell.rate)
        </span>
      #else
        <span class="closed-label">CLOSED</span>
      #end
    </td>
  #end
  <td>
    <a href="/tera/room/edit?id=$room.id">Edit</a>
  </td>
</tr>
#end

#foreach($room in $rooms)
  #renderRoomRow($room)
#end

## Every click → full POST → server reload → re-render.
## Any data update: full page flash.`} />

            <div style={{ marginTop: 8 }}>
              <CodeBlock label="AFTER — React + TypeScript + Next.js" color="#22c55e" code={
`// AFTER: React component — typed, testable, interactive.

interface RoomRowProps {
  room: RoomType;
  availability: DayAvailability[];
  onCellClick: (dayIndex: number) => void;
  onRateEdit:  (dayIndex: number, rate: number) => void;
}

export const RoomRow: React.FC<RoomRowProps> = ({
  room, availability, onCellClick, onRateEdit,
}) => {
  const [editIndex, setEditIndex] = useState<number | null>(null);

  return (
    <tr>
      <td className="room-name">{room.name}</td>
      {availability.map((cell, i) => (
        <td key={i} className={\`cell cell-\${cell.status}\`}>
          <StatusBadge
            status={cell.status}
            onClick={() => onCellClick(i)}
          />
          <RateInput
            value={cell.rate}
            editing={editIndex === i}
            onEdit={() => setEditIndex(i)}
            onSave={(rate) => {
              onRateEdit(i, rate);
              setEditIndex(null);
            }}
          />
        </td>
      ))}
    </tr>
  );
};

// Benefits over Velocity:
// ✓ TypeScript: compile-time error detection
// ✓ Optimistic updates: instant UI feedback
// ✓ Unit testable: Jest + React Testing Library
// ✓ Reusable: StatusBadge, RateInput used elsewhere
// ✓ Accessible: proper ARIA attributes
// ✓ No full-page reload on any interaction`} />
            </div>
          </div>

          {/* Soya + migration strategy */}
          <div>
            <div style={{ fontSize: 10, fontWeight: 700, color: "#64748b", marginBottom: 8, letterSpacing: "0.08em" }}>
              SOYA — TRAVELOKA INTERNAL DESIGN SYSTEM
            </div>
            <div style={{ background: "#1e293b", border: "1px solid #334155", borderRadius: 10, padding: 14, marginBottom: 10 }}>
              <div style={{ fontSize: 9, color: "#64748b", marginBottom: 10 }}>Component library used across all Traveloka products</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
                {[
                  { label: "Button", variants: "Primary / Secondary / Ghost / Danger" },
                  { label: "Input",  variants: "Text / Number / Date / Masked" },
                  { label: "Badge",  variants: "Success / Warning / Error / Info" },
                  { label: "Table",  variants: "Simple / Sortable / Paginated" },
                  { label: "Modal",  variants: "Alert / Form / Confirmation" },
                  { label: "Toast",  variants: "Success / Error / Loading" },
                ].map(c => (
                  <div key={c.label} style={{ background: "#0f172a", borderRadius: 6, padding: 8 }}>
                    <div style={{ fontSize: 9, fontWeight: 700, color: "#0066ff", marginBottom: 2 }}>{c.label}</div>
                    <div style={{ fontSize: 7, color: "#475569" }}>{c.variants}</div>
                  </div>
                ))}
              </div>
            </div>

            <CodeBlock label="Soya — contributing to the internal design system" color="#0066ff" code={
`// Soya is Traveloka's internal component library.
// Similar to: Shopify's Polaris, Airbnb's DLS, Ant Design.
// Used across: TERA, flights, payments, hotels consumer, etc.

// AS A CONTRIBUTOR AND MAINTAINER:
// 1. CODE REVIEW for PRs to Soya:
//    Ensure accessibility (ARIA attributes, keyboard nav).
//    Ensure TypeScript types are correct and documented.
//    Ensure visual consistency with Traveloka design tokens.
//    Ensure backward compatibility (no breaking changes without major version).

// 2. ADDING NEW COMPONENTS:
//    When TERA needs a component not in Soya:
//    Option A: build it in TERA → duplicate across products.
//    Option B: add it to Soya → shared across all Traveloka products.
//    Decision: if 2+ products need it → Soya component.

// 3. VERSIONING:
//    Soya uses semantic versioning: soya-web@2.14.0.
//    Breaking change: major version bump.
//    All consuming teams must upgrade and test.
//    Maintainer provides: migration guide + codemod where possible.

// TERA's Soya usage:
import {
  Button, Input, Badge, Table, Modal, Toast
} from "@traveloka/soya-web";

// Soya ensures: all Traveloka products look/feel consistent.
// If design system changes: update Soya once, all products get it.
// Without Soya: update 10 repositories individually.`} />

            <div style={{ marginTop: 8 }}>
              <CodeBlock label="Migration strategy — running old and new in parallel" color="#a855f7" code={
`// KEY CHALLENGE: 11 pages migrated without downtime.
// Cannot "big bang" replace: too risky. Partners would lose access.
//
// STRATEGY: Strangler Fig Pattern

// Phase 1: Shadow deployment
// New React page deployed at /v2/tera/rooms
// Old Velocity page still at /tera/rooms (primary traffic)
// QA + internal partners test the new version.

// Phase 2: Canary release (1% → 10% → 50% → 100%)
// Feature flag: ENABLE_REACT_ROOM_PAGE
// 1% of partners see the React version.
// Monitor: error rates, load times, user complaints.
// If stable: increase canary percentage.

// Phase 3: Full cutover
// 100% traffic on React page.
// Velocity page kept as fallback for 4 weeks.
// After no rollbacks needed: Velocity page removed.

// WHY THIS MATTERS:
// Partners use TERA to manage their hotel's revenue.
// A broken page at peak check-in time costs real money.
// The strangler fig approach: zero downtime migration.
// Each of the 11 pages followed this pattern.
//
// The 35 man-weeks estimate covers:
// - Understanding existing Velocity page data flow
// - Rewriting as React components with TypeScript
// - Redux state management for the page's data
// - Unit tests (standard, boundary, incorrect)
// - Canary release management
// - Post-migration monitoring and bug fixes`} />
            </div>
          </div>
        </div>
      )}

      {/* ── TESTING ── */}
      {activeTab === "testing" && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
          {/* Test runner */}
          <div>
            <div style={{ fontSize: 10, fontWeight: 700, color: "#64748b", marginBottom: 8, letterSpacing: "0.08em" }}>
              JEST TEST SUITE — AVAILABILITY SERVICE
            </div>
            <div style={{ display: "flex", gap: 6, marginBottom: 10 }}>
              {(["standard", "boundary", "incorrect"] as const).map(s => (
                <button key={s} onClick={() => { setTestSuite(s); setTestStatus("idle"); setTestLog([]); }} style={{ flex: 1, background: testSuite === s ? "#1e3a5f" : "#1e293b", border: `1px solid ${testSuite === s ? "#3b82f6" : "#334155"}`, borderRadius: 8, padding: "8px 10px", cursor: "pointer", color: testSuite === s ? "#60a5fa" : "#64748b", fontSize: 10, fontWeight: 600 }}>
                  {s === "standard" ? "🟢 Standard" : s === "boundary" ? "🟡 Boundary" : "🔴 Incorrect"}
                </button>
              ))}
            </div>

            <div style={{ background: "#0a0a14", border: "1px solid #1e293b", borderRadius: 10, padding: 12, minHeight: 220, marginBottom: 10, fontFamily: "monospace" }}>
              <div style={{ fontSize: 9, color: "#475569", marginBottom: 8 }}>
                Jest — availabilityService.{testSuite}.test.ts
              </div>
              {testLog.map((line, i) => (
                <div key={i} style={{ fontSize: 9, color: line.startsWith("✗") ? "#f87171" : "#4ade80", marginBottom: 2 }}>
                  {line}
                </div>
              ))}
              {testStatus === "idle" && testLog.length === 0 && (
                <div style={{ fontSize: 9, color: "#334155" }}>Click "Run Tests" to execute the {testSuite} test suite</div>
              )}
              {testStatus === "running" && (
                <div style={{ fontSize: 9, color: "#f59e0b", marginTop: 4 }}>⏳ Running tests...</div>
              )}
              {testStatus === "pass" && (
                <div style={{ fontSize: 10, color: "#22c55e", marginTop: 6, fontWeight: 700 }}>✅ All tests passed</div>
              )}
              {testStatus === "fail" && (
                <div style={{ fontSize: 10, color: "#ef4444", marginTop: 6, fontWeight: 700 }}>❌ 1 test failed — see details above</div>
              )}
            </div>
            <button onClick={runTests} disabled={testStatus === "running"} style={{ width: "100%", background: testStatus === "running" ? "#334155" : "#0066ff20", border: `1px solid ${testStatus === "running" ? "#334155" : "#0066ff"}`, borderRadius: 8, padding: "10px", color: testStatus === "running" ? "#64748b" : "#60a5fa", cursor: testStatus === "running" ? "not-allowed" : "pointer", fontSize: 11, fontWeight: 700 }}>
              {testStatus === "running" ? "⏳ Running..." : "▶ Run Tests"}
            </button>
          </div>

          {/* Test code examples */}
          <div>
            <CodeBlock label="Jest — standard, boundary, and incorrect input test cases" color="#22c55e" code={
`// TERA tests cover 3 categories (per Jest test strategy):

// ─── 1. STANDARD CASES ───────────────────────────────────
// Normal inputs, expected happy-path behavior.

describe("availabilityService — standard", () => {
  it("returns available rooms for a valid date range", async () => {
    const result = await getAvailability({
      propertyId: "prop-001",
      checkIn:  "2024-06-19",
      checkOut: "2024-06-22",
      roomType: "DELUXE",
    });
    expect(result.available).toBe(true);
    expect(result.rooms).toHaveLength(5);
    expect(result.rooms[0]).toMatchObject({
      roomType: "DELUXE",
      rate:     expect.any(Number),
      currency: "IDR",
    });
  });
});

// ─── 2. BOUNDARY CASES ───────────────────────────────────
// Edge values: 0, 1, max. Where behavior could break.

describe("availabilityService — boundary", () => {
  it("handles 0 available rooms (sold-out)", async () => {
    // Mock: sold-out property
    server.use(rest.get("/availability", (req, res, ctx) =>
      res(ctx.json({ rooms: [], soldOut: true }))
    ));
    const result = await getAvailability({ propertyId: "sold-out-prop" });
    expect(result.available).toBe(false);
    expect(result.rooms).toEqual([]);       // not null or undefined
    expect(result.soldOut).toBe(true);
  });

  it("accepts exact maximum stay of 365 nights", async () => {
    const result = await getAvailability({
      checkIn:  "2024-01-01",
      checkOut: "2025-01-01",  // exactly 365 nights
    });
    expect(result.error).toBeUndefined();  // no error at boundary
  });

  it("rejects stay of 366 nights (exceeds max)", async () => {
    await expect(getAvailability({
      checkIn:  "2024-01-01",
      checkOut: "2025-01-02",  // 366 nights: one past boundary
    })).rejects.toThrow("MAX_STAY_EXCEEDED");
  });
});

// ─── 3. INCORRECT INPUT CASES ────────────────────────────
// Invalid/malformed data. Should throw specific errors.

describe("availabilityService — incorrect input", () => {
  it("throws for check-out before check-in", async () => {
    await expect(getAvailability({
      checkIn:  "2024-06-22",
      checkOut: "2024-06-19",  // before check-in
    })).rejects.toThrow(DateRangeError);
  });

  it("throws InvalidDateError for null date", async () => {
    await expect(getAvailability({
      checkIn:  null as unknown as string,
      checkOut: "2024-06-22",
    })).rejects.toThrow(InvalidDateError);
  });

  it("throws RateValidationError for negative rate", async () => {
    await expect(setRate({
      roomId: "room-001",
      date:   "2024-06-19",
      rate:   -1,            // negative rate
    })).rejects.toThrow(RateValidationError);
  });
});

// WHY ALL THREE CATEGORIES MATTER:
// Standard: confirms happy path works.
// Boundary: catches off-by-one errors (common in date logic).
// Incorrect: ensures the system fails gracefully with
//            actionable error messages — not silent failures.`} />

            <div style={{ marginTop: 8 }}>
              <CodeBlock label="Testing philosophy — documentation through tests" color="#a855f7" code={
`// TERA's testing goal: tests ARE the documentation.
// A new engineer reads the test file to understand:
// "What does this function do? What are its constraints?"

// This means: test names must be full sentences.
// BAD:  it("handles error")
// GOOD: it("throws DateRangeError when check-out is before check-in")

// It also means: don't test implementation details.
// BAD:  expect(internalCache.has(key)).toBe(true)
// GOOD: expect(response.data).toEqual(expectedRoom)
//       (The cache is an implementation detail. The returned data is the contract.)

// TERA COVERAGE TARGETS:
// - Services (API layer):  > 90% branch coverage
// - Redux slices:         > 85% (reducers + selectors)
// - React components:     > 70% (critical user interactions)
// - Utility functions:    100% (pure functions → full coverage trivial)

// CI: tests run on every PR.
// Failed test → blocked PR. No exceptions.
// Coverage below threshold → blocked PR.
// This created a culture: "untested code is unfinished code."`} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default TeraDemo;
