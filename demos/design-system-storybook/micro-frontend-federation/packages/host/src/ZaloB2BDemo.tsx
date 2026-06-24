/**
 * ZaloB2BDemo.tsx
 *
 * Zalo B2B Products — Frontend Engineer
 *
 * Management tools for Zalo's B2B products generating millions of dollars/year:
 *
 * 1. ZNS (Zalo Notification Service) — template builder, delivery analytics, API keys.
 * 2. ZBA (Zalo Business Account)     — follower analytics, message inbox, content publishing.
 * 3. ZCC (Zalo Cloud Connect)         — webhook management, real-time event log, integrations.
 *
 * Stack: ReactJS, Next.js, TypeScript, Ant Design (themed with Less), Redux.
 *
 * TABS
 *   💬 ZNS Templates   — notification template builder + delivery report dashboard
 *   🏢 Business Account — follower analytics + message management
 *   ☁️ Cloud Connect    — webhook monitor + real-time event stream + Ant Design/Less theming
 */

import React, { useState, useEffect, useRef } from "react";

// ─────────────────────────────────────────────────────────────────
// ZNS types & data
// ─────────────────────────────────────────────────────────────────

type TemplateStatus = "APPROVED" | "PENDING_REVIEW" | "REJECTED";
type TemplateCategory = "OTP" | "ORDER" | "SHIPPING" | "TRANSACTION" | "PROMOTION";

interface ZNSTemplate {
  id: string; name: string; category: TemplateCategory;
  status: TemplateStatus; content: string; variables: string[];
  sentToday: number; deliveredToday: number;
}

const STATUS_COLOR: Record<TemplateStatus, string> = {
  APPROVED: "#22c55e", PENDING_REVIEW: "#f59e0b", REJECTED: "#ef4444",
};

const TEMPLATES: ZNSTemplate[] = [
  { id: "tpl-001", name: "Order Confirmation",   category: "ORDER",       status: "APPROVED",       content: "Xin chào {{customer_name}}, đơn hàng {{order_id}} của bạn đã được xác nhận. Tổng tiền: {{amount}} VND.", variables: ["customer_name", "order_id", "amount"],   sentToday: 82_400, deliveredToday: 80_310 },
  { id: "tpl-002", name: "OTP Authentication",   category: "OTP",         status: "APPROVED",       content: "Mã OTP của bạn là {{otp_code}}. Có hiệu lực trong {{expiry_minutes}} phút. Không chia sẻ mã này cho bất kỳ ai.", variables: ["otp_code", "expiry_minutes"],           sentToday: 214_800, deliveredToday: 213_200 },
  { id: "tpl-003", name: "Shipping Update",      category: "SHIPPING",    status: "APPROVED",       content: "Đơn hàng {{order_id}} đang được giao đến {{address}}. Dự kiến nhận hàng: {{delivery_date}}.", variables: ["order_id", "address", "delivery_date"], sentToday: 45_100,  deliveredToday: 43_800 },
  { id: "tpl-004", name: "Payment Success",      category: "TRANSACTION", status: "PENDING_REVIEW", content: "Giao dịch {{transaction_id}} thành công. Số tiền: {{amount}} VND. Số dư tài khoản: {{balance}} VND.", variables: ["transaction_id", "amount", "balance"],  sentToday: 0,      deliveredToday: 0 },
  { id: "tpl-005", name: "Flash Sale Alert",     category: "PROMOTION",   status: "REJECTED",       content: "🔥 Flash Sale! Giảm giá {{discount}}% cho tất cả sản phẩm đến hết {{end_time}}.", variables: ["discount", "end_time"],                sentToday: 0,      deliveredToday: 0 },
];

// ─────────────────────────────────────────────────────────────────
// Business Account data
// ─────────────────────────────────────────────────────────────────

const FOLLOWER_DATA = [
  { month: "Jan", followers: 142_000 }, { month: "Feb", followers: 158_000 },
  { month: "Mar", followers: 179_000 }, { month: "Apr", followers: 201_000 },
  { month: "May", followers: 238_000 }, { month: "Jun", followers: 271_000 },
];

const MESSAGES = [
  { id: 1, user: "Nguyễn Văn An", avatar: "A", msg: "Tôi chưa nhận được đơn hàng của mình, đơn #VN12345",          time: "2m ago",  unread: true  },
  { id: 2, user: "Trần Thị Bích",  avatar: "B", msg: "Cảm ơn shop đã xử lý nhanh! Sản phẩm rất tốt 👍",           time: "15m ago", unread: true  },
  { id: 3, user: "Lê Minh Châu",   avatar: "C", msg: "Shop có còn hàng áo size L không ạ?",                         time: "1h ago",  unread: false },
  { id: 4, user: "Phạm Thị Dung",  avatar: "D", msg: "Khi nào đơn hàng của tôi được giao vậy shop?",               time: "3h ago",  unread: false },
];

// ─────────────────────────────────────────────────────────────────
// Cloud Connect events
// ─────────────────────────────────────────────────────────────────

const WEBHOOK_ENDPOINTS = [
  { id: "wh-001", name: "CRM Integration",     url: "https://crm.company.com/zalo/webhook",      status: "active",   lastPing: "2s ago",  events: ["message", "follow", "unfollow"] },
  { id: "wh-002", name: "Order System",         url: "https://orders.company.com/zalo/hook",      status: "active",   lastPing: "5s ago",  events: ["message", "payment"] },
  { id: "wh-003", name: "Analytics Pipeline",  url: "https://analytics.company.com/zalo/events", status: "warning",  lastPing: "12m ago", events: ["follow", "message"] },
  { id: "wh-004", name: "Support Ticketing",   url: "https://support.company.com/zalo/hook",     status: "inactive", lastPing: "2h ago",  events: ["message"] },
];

const EVENT_TYPES = [
  { type: "follow",    icon: "👤", color: "#22c55e" },
  { type: "message",   icon: "💬", color: "#3b82f6" },
  { type: "unfollow",  icon: "🚫", color: "#ef4444" },
  { type: "reaction",  icon: "❤️",  color: "#f59e0b" },
  { type: "zns_sent",  icon: "📤", color: "#6366f1" },
];

function makeEvent(id: number) {
  const et = EVENT_TYPES[Math.floor(Math.random() * EVENT_TYPES.length)];
  return { id, type: et.type, icon: et.icon, color: et.color, userId: `user_${Math.floor(Math.random() * 9000) + 1000}`, ts: new Date().toISOString() };
}

// ─────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────

function CodeBlock({ code, label, color = "#64748b" }: { code: string; label?: string; color?: string }) {
  return (
    <div style={{ background: "#0a0a14", borderRadius: 8, overflow: "hidden", border: "1px solid #1e293b" }}>
      {label && <div style={{ padding: "5px 12px", borderBottom: "1px solid #1e293b", fontSize: 10, color }}>{label}</div>}
      <pre style={{ margin: 0, padding: 12, fontSize: 9, fontFamily: "monospace", color: "#94a3b8", lineHeight: 1.7, overflow: "auto", maxHeight: 260 }}>{code}</pre>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
// Main
// ─────────────────────────────────────────────────────────────────

export function ZaloB2BDemo() {
  const [activeTab, setActiveTab] = useState<"zns" | "zba" | "zcc">("zns");

  // ZNS state
  const [selectedTpl, setSelectedTpl] = useState<ZNSTemplate>(TEMPLATES[0]);
  const [previewVars, setPreviewVars] = useState<Record<string, string>>({});
  const [showNewTpl, setShowNewTpl] = useState(false);
  const [newTplContent, setNewTplContent] = useState("Xin chào {{customer_name}}, đơn hàng {{order_id}} của bạn đã sẵn sàng.");

  const renderPreview = (content: string, vars: Record<string, string>) =>
    content.replace(/\{\{(\w+)\}\}/g, (_, key) => vars[key] ? `[${vars[key]}]` : `{{${key}}}`);

  // ZBA state
  const [selectedMsg, setSelectedMsg] = useState<number | null>(null);
  const maxFollowers = Math.max(...FOLLOWER_DATA.map(d => d.followers));

  // ZCC state
  const [events, setEvents] = useState(() => Array.from({ length: 8 }, (_, i) => makeEvent(i)));
  const [streaming, setStreaming] = useState(false);
  const streamRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const eventIdRef = useRef(100);

  const toggleStream = () => {
    if (streaming) {
      clearInterval(streamRef.current!);
      setStreaming(false);
    } else {
      setStreaming(true);
      streamRef.current = setInterval(() => {
        setEvents(prev => [makeEvent(eventIdRef.current++), ...prev.slice(0, 19)]);
      }, 800);
    }
  };
  useEffect(() => () => { if (streamRef.current) clearInterval(streamRef.current); }, []);

  const TABS = [
    { id: "zns" as const, label: "💬 ZNS Templates" },
    { id: "zba" as const, label: "🏢 Business Account" },
    { id: "zcc" as const, label: "☁️ Cloud Connect" },
  ];

  const deliveryRate = Math.round((selectedTpl.deliveredToday / (selectedTpl.sentToday || 1)) * 100);

  return (
    <div style={{ background: "#0f172a", color: "#f1f5f9", fontFamily: "'Inter', system-ui, sans-serif", minHeight: "100vh", padding: 24 }}>

      {/* Header */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
          <div style={{ width: 36, height: 36, borderRadius: 8, background: "linear-gradient(135deg, #0068ff, #0044cc)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}>💙</div>
          <div>
            <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800 }}>Zalo B2B Products</h1>
            <p style={{ margin: 0, color: "#64748b", fontSize: 13 }}>
              Zalo Notification Service · Business Account · Cloud Connect · $M+ revenue/year
            </p>
          </div>
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {["ZNS", "ZBA", "ZCC", "Next.js", "ReactJS", "TypeScript", "Ant Design", "Less", "Redux", "74M+ Zalo Users"].map(t => (
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

      {/* ── ZNS ── */}
      {activeTab === "zns" && (
        <div style={{ display: "grid", gridTemplateColumns: "220px 1fr 260px", gap: 12 }}>
          {/* Template list */}
          <div>
            <div style={{ fontSize: 10, fontWeight: 700, color: "#64748b", marginBottom: 8, letterSpacing: "0.08em" }}>
              NOTIFICATION TEMPLATES
            </div>
            {TEMPLATES.map(tpl => (
              <button key={tpl.id} onClick={() => { setSelectedTpl(tpl); setPreviewVars({}); }} style={{
                width: "100%", textAlign: "left", background: selectedTpl.id === tpl.id ? "#1e3a5f" : "#1e293b",
                border: `1px solid ${selectedTpl.id === tpl.id ? "#3b82f6" : "#334155"}`,
                borderRadius: 8, padding: "9px 10px", cursor: "pointer", color: "#f1f5f9", marginBottom: 5,
              }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 3 }}>
                  <div style={{ fontSize: 10, fontWeight: 700 }}>{tpl.name}</div>
                  <div style={{ fontSize: 7, background: STATUS_COLOR[tpl.status] + "20", color: STATUS_COLOR[tpl.status], borderRadius: 4, padding: "1px 5px" }}>{tpl.status.replace("_", " ")}</div>
                </div>
                <div style={{ fontSize: 8, color: "#475569" }}>{tpl.category} · {tpl.variables.length} vars</div>
                {tpl.sentToday > 0 && <div style={{ fontSize: 8, color: "#64748b" }}>{tpl.sentToday.toLocaleString()} sent today</div>}
              </button>
            ))}
            <button onClick={() => setShowNewTpl(v => !v)} style={{ width: "100%", background: "#1e3a5f20", border: "1px dashed #3b82f640", borderRadius: 8, padding: "8px", cursor: "pointer", color: "#3b82f6", fontSize: 10, marginTop: 4 }}>
              + New Template
            </button>
          </div>

          {/* Template editor / preview */}
          <div>
            <div style={{ fontSize: 10, fontWeight: 700, color: "#64748b", marginBottom: 8, letterSpacing: "0.08em" }}>
              {showNewTpl ? "TEMPLATE EDITOR" : `TEMPLATE: ${selectedTpl.name.toUpperCase()}`}
            </div>
            {showNewTpl ? (
              <div style={{ background: "#1e293b", border: "1px solid #334155", borderRadius: 10, padding: 14 }}>
                <div style={{ fontSize: 10, color: "#64748b", marginBottom: 8 }}>Template content — use {"{{variable_name}}"} for dynamic values</div>
                <textarea
                  value={newTplContent}
                  onChange={e => setNewTplContent(e.target.value)}
                  style={{ width: "100%", background: "#0f172a", border: "1px solid #334155", borderRadius: 6, padding: 10, color: "#f1f5f9", fontSize: 11, fontFamily: "monospace", lineHeight: 1.6, resize: "vertical", minHeight: 80, boxSizing: "border-box" }}
                />
                <div style={{ marginTop: 8, background: "#0f172a", borderRadius: 8, padding: 10 }}>
                  <div style={{ fontSize: 9, color: "#64748b", marginBottom: 4 }}>Live preview:</div>
                  <div style={{ fontSize: 11, color: "#f1f5f9", lineHeight: 1.6 }}>
                    {newTplContent.replace(/\{\{(\w+)\}\}/g, (_, k) => `[${k}]`)}
                  </div>
                </div>
                <div style={{ display: "flex", gap: 6, marginTop: 10 }}>
                  <button style={{ background: "#3b82f6", border: "none", borderRadius: 6, padding: "7px 16px", color: "#fff", cursor: "pointer", fontSize: 10 }}>Submit for Review</button>
                  <button onClick={() => setShowNewTpl(false)} style={{ background: "#334155", border: "none", borderRadius: 6, padding: "7px 12px", color: "#94a3b8", cursor: "pointer", fontSize: 10 }}>Cancel</button>
                </div>
              </div>
            ) : (
              <div>
                <div style={{ background: "#1e293b", border: "1px solid #334155", borderRadius: 10, padding: 14, marginBottom: 10 }}>
                  <div style={{ fontSize: 9, color: "#64748b", marginBottom: 6 }}>Template content</div>
                  <div style={{ background: "#0f172a", borderRadius: 8, padding: 10, fontSize: 11, color: "#f1f5f9", lineHeight: 1.7, marginBottom: 10 }}>
                    {selectedTpl.content}
                  </div>
                  <div style={{ fontSize: 9, color: "#64748b", marginBottom: 6 }}>Fill variables to preview:</div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
                    {selectedTpl.variables.map(v => (
                      <div key={v}>
                        <div style={{ fontSize: 8, color: "#475569", marginBottom: 2 }}>{"{{" + v + "}}"}</div>
                        <input
                          value={previewVars[v] ?? ""}
                          onChange={e => setPreviewVars(prev => ({ ...prev, [v]: e.target.value }))}
                          placeholder={v}
                          style={{ width: "100%", background: "#1e293b", border: "1px solid #334155", borderRadius: 4, padding: "4px 6px", color: "#f1f5f9", fontSize: 10, boxSizing: "border-box" }}
                        />
                      </div>
                    ))}
                  </div>
                </div>
                {/* Zalo message preview */}
                <div style={{ background: "#1e293b", border: "1px solid #334155", borderRadius: 10, padding: 14 }}>
                  <div style={{ fontSize: 9, color: "#64748b", marginBottom: 8 }}>Zalo message preview</div>
                  <div style={{ display: "flex", gap: 8 }}>
                    <div style={{ width: 30, height: 30, borderRadius: "50%", background: "linear-gradient(135deg,#0068ff,#0044cc)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, flexShrink: 0 }}>💙</div>
                    <div style={{ background: "#f0f4ff", borderRadius: "0 12px 12px 12px", padding: "8px 12px", maxWidth: "85%" }}>
                      <div style={{ fontSize: 8, color: "#0068ff", fontWeight: 700, marginBottom: 3 }}>Official Business Name</div>
                      <div style={{ fontSize: 10, color: "#1e293b", lineHeight: 1.6 }}>
                        {renderPreview(selectedTpl.content, previewVars)}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Delivery dashboard */}
          <div>
            <div style={{ fontSize: 10, fontWeight: 700, color: "#64748b", marginBottom: 8, letterSpacing: "0.08em" }}>
              DELIVERY REPORT — TODAY
            </div>
            {selectedTpl.sentToday > 0 ? (
              <>
                {[
                  { label: "Sent",      value: selectedTpl.sentToday,      color: "#6366f1" },
                  { label: "Delivered", value: selectedTpl.deliveredToday, color: "#22c55e" },
                  { label: "Failed",    value: selectedTpl.sentToday - selectedTpl.deliveredToday, color: "#ef4444" },
                ].map(m => (
                  <div key={m.label} style={{ background: "#1e293b", border: "1px solid #334155", borderRadius: 8, padding: 10, marginBottom: 6 }}>
                    <div style={{ fontSize: 9, color: "#64748b" }}>{m.label}</div>
                    <div style={{ fontSize: 18, fontWeight: 800, color: m.color }}>{m.value.toLocaleString()}</div>
                    <div style={{ background: "#0f172a", borderRadius: 3, height: 6, marginTop: 4, overflow: "hidden" }}>
                      <div style={{ background: m.color, height: "100%", width: `${(m.value / selectedTpl.sentToday) * 100}%`, borderRadius: 3 }} />
                    </div>
                  </div>
                ))}
                <div style={{ background: "#1e293b", border: "1px solid #334155", borderRadius: 8, padding: 10, marginBottom: 10 }}>
                  <div style={{ fontSize: 9, color: "#64748b" }}>Delivery Rate</div>
                  <div style={{ fontSize: 22, fontWeight: 900, color: deliveryRate > 95 ? "#22c55e" : "#f59e0b" }}>{deliveryRate}%</div>
                </div>
              </>
            ) : (
              <div style={{ background: "#1e293b", border: "1px solid #334155", borderRadius: 8, padding: 16, textAlign: "center", color: "#475569", fontSize: 10, marginBottom: 10 }}>
                {selectedTpl.status === "PENDING_REVIEW" ? "⏳ Awaiting Zalo approval" : "🚫 Template rejected — fix issues to re-submit"}
              </div>
            )}
            <CodeBlock label="Redux slice — ZNS state management" color="#6366f1" code={
`// Redux Toolkit slice for ZNS management
interface ZNSState {
  templates: Template[];
  selectedId: string | null;
  deliveryReports: Record<string, DeliveryReport>;
  apiKeys: ApiKey[];
  filter: { status: TemplateStatus | "ALL"; category: TemplateCategory | "ALL" };
  ui: { submitting: boolean; error: string | null };
}

const znsSlice = createSlice({
  name: "zns",
  initialState,
  reducers: {
    selectTemplate: (state, action: PayloadAction<string>) => {
      state.selectedId = action.payload;
    },
    setFilter: (state, action) => {
      state.filter = action.payload;
    },
  },
  extraReducers: builder => {
    builder
      .addCase(fetchTemplates.pending, s => { s.ui.submitting = true; })
      .addCase(fetchTemplates.fulfilled, (s, a) => {
        s.templates = a.payload;
        s.ui.submitting = false;
      })
      .addCase(submitTemplate.fulfilled, (s, a) => {
        s.templates.push({ ...a.payload, status: "PENDING_REVIEW" });
      });
  },
});`} />
          </div>
        </div>
      )}

      {/* ── BUSINESS ACCOUNT ── */}
      {activeTab === "zba" && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
          {/* Analytics */}
          <div>
            {/* Profile header */}
            <div style={{ background: "linear-gradient(135deg, #0068ff20, #0044cc10)", border: "1px solid #0068ff30", borderRadius: 10, padding: 14, marginBottom: 12 }}>
              <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                <div style={{ width: 44, height: 44, borderRadius: "50%", background: "linear-gradient(135deg,#0068ff,#0044cc)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}>🏪</div>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 800 }}>Official Business Account</div>
                  <div style={{ fontSize: 9, color: "#64748b" }}>✅ Verified · Business Category: E-commerce</div>
                  <div style={{ display: "flex", gap: 12, marginTop: 4 }}>
                    <div style={{ fontSize: 10 }}><span style={{ fontWeight: 700, color: "#0068ff" }}>271,000</span> <span style={{ color: "#64748b" }}>followers</span></div>
                    <div style={{ fontSize: 10 }}><span style={{ fontWeight: 700, color: "#22c55e" }}>98.2%</span> <span style={{ color: "#64748b" }}>response rate</span></div>
                    <div style={{ fontSize: 10 }}><span style={{ fontWeight: 700, color: "#f59e0b" }}>&lt; 2h</span> <span style={{ color: "#64748b" }}>avg response</span></div>
                  </div>
                </div>
              </div>
            </div>

            {/* Follower growth chart */}
            <div style={{ background: "#1e293b", border: "1px solid #334155", borderRadius: 10, padding: 14, marginBottom: 12 }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: "#64748b", marginBottom: 12 }}>FOLLOWER GROWTH — 2024</div>
              <div style={{ display: "flex", alignItems: "flex-end", gap: 8, height: 80 }}>
                {FOLLOWER_DATA.map((d, i) => (
                  <div key={d.month} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                    <div style={{ fontSize: 7, color: "#64748b" }}>{(d.followers / 1000).toFixed(0)}k</div>
                    <div style={{
                      height: `${(d.followers / maxFollowers) * 80}px`, width: "100%",
                      background: i === FOLLOWER_DATA.length - 1 ? "#0068ff" : "#0068ff50",
                      borderRadius: "3px 3px 0 0", transition: "height 0.5s",
                    }} />
                    <div style={{ fontSize: 8, color: "#475569" }}>{d.month}</div>
                  </div>
                ))}
              </div>
              <div style={{ marginTop: 8, fontSize: 9, color: "#22c55e" }}>↑ +90.8% YTD growth (142k → 271k)</div>
            </div>

            <CodeBlock label="Next.js — SSR for ZBA dashboard (SEO + first-load performance)" color="#0068ff" code={
`// Zalo Business Account dashboard uses Next.js.
// WHY NEXT.JS for an admin/management tool?
//
// 1. SSR for the initial data load:
//    Admin opens dashboard → server pre-fetches follower stats.
//    Page loads with data already present. No loading spinner.
//    Critical for operations teams who open the dashboard frequently.
//
// 2. API routes for BFF (Backend for Frontend):
//    /api/zba/followers → proxies to Zalo Open API with auth.
//    Keeps API keys server-side (never exposed to browser).
//    Handles token refresh transparently.
//
// 3. Incremental Static Regeneration for public pages:
//    Business profile pages can be statically generated
//    and revalidated every 60 seconds.
//    CDN-cached for unauthenticated visitors.

// pages/dashboard/index.tsx
export const getServerSideProps: GetServerSideProps = async (ctx) => {
  const session = await getServerSession(ctx);
  if (!session) return { redirect: { destination: "/login" } };

  const [followers, messages, znsStats] = await Promise.all([
    zaloAPI.getFollowerStats(session.oaId),
    zaloAPI.getRecentMessages(session.oaId, { limit: 20 }),
    znsAPI.getDailyStats(session.oaId),
  ]);

  return {
    props: {
      initialFollowers: followers,
      initialMessages: messages,
      initialZNSStats: znsStats,
    },
  };
};`} />
          </div>

          {/* Messages */}
          <div>
            <div style={{ fontSize: 10, fontWeight: 700, color: "#64748b", marginBottom: 8, letterSpacing: "0.08em" }}>
              MESSAGE MANAGEMENT
            </div>
            <div style={{ background: "#1e293b", border: "1px solid #334155", borderRadius: 10, overflow: "hidden", marginBottom: 12 }}>
              {MESSAGES.map((msg, i) => (
                <div key={msg.id} onClick={() => setSelectedMsg(msg.id === selectedMsg ? null : msg.id)} style={{
                  display: "flex", gap: 10, padding: "10px 12px", cursor: "pointer",
                  background: selectedMsg === msg.id ? "#1e3a5f" : "transparent",
                  borderBottom: i < MESSAGES.length - 1 ? "1px solid #0f172a" : "none",
                  borderLeft: `3px solid ${msg.unread ? "#0068ff" : "transparent"}`,
                }}>
                  <div style={{ width: 30, height: 30, borderRadius: "50%", background: "#0068ff30", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, flexShrink: 0, color: "#60a5fa" }}>{msg.avatar}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <div style={{ fontSize: 10, fontWeight: msg.unread ? 700 : 400, color: msg.unread ? "#f1f5f9" : "#94a3b8" }}>{msg.user}</div>
                      <div style={{ fontSize: 8, color: "#475569" }}>{msg.time}</div>
                    </div>
                    <div style={{ fontSize: 9, color: "#64748b", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{msg.msg}</div>
                  </div>
                </div>
              ))}
            </div>
            {selectedMsg !== null && (
              <div style={{ background: "#1e293b", border: "1px solid #0068ff30", borderRadius: 10, padding: 12, marginBottom: 12 }}>
                <div style={{ fontSize: 9, color: "#64748b", marginBottom: 6 }}>Reply to {MESSAGES.find(m => m.id === selectedMsg)?.user}</div>
                <div style={{ display: "flex", gap: 6 }}>
                  <input placeholder="Type a reply..." style={{ flex: 1, background: "#0f172a", border: "1px solid #334155", borderRadius: 6, padding: "6px 10px", color: "#f1f5f9", fontSize: 10 }} />
                  <button style={{ background: "#0068ff", border: "none", borderRadius: 6, padding: "6px 12px", color: "#fff", cursor: "pointer", fontSize: 10 }}>Send</button>
                </div>
              </div>
            )}
            <CodeBlock label="Ant Design + Less — theming Zalo's design system" color="#f59e0b" code={
`// Ant Design uses Less for theming.
// Override design tokens in less variables.
// One change propagates to ALL components.

// theme/zalo.less — Zalo brand theming
@primary-color:          #0068ff;  // Zalo blue
@primary-color-hover:    #0056cc;
@link-color:             #0068ff;
@success-color:          #22c55e;
@warning-color:          #f59e0b;
@error-color:            #ef4444;

// Layout
@border-radius-base:     8px;
@border-radius-sm:       4px;
@font-size-base:         14px;
@font-size-sm:           12px;

// Navigation
@menu-bg:                #001529;  // dark sidebar
@menu-item-active-bg:    #0068ff;
@menu-item-color:        rgba(255,255,255,0.65);
@menu-highlight-color:   #fff;

// Table (heavily used in management tools)
@table-header-bg:        #1e293b;
@table-header-color:     #94a3b8;
@table-row-hover-bg:     #1e3a5f;

// In webpack/next.config.js:
// modifyVars: { "@primary-color": "#0068ff" }
// This compiles the entire Ant Design Less source
// with overridden variables → single CSS bundle.
// No runtime CSS-in-JS overhead. Pure CSS output.`} />
          </div>
        </div>
      )}

      {/* ── CLOUD CONNECT ── */}
      {activeTab === "zcc" && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
          {/* Webhooks */}
          <div>
            <div style={{ fontSize: 10, fontWeight: 700, color: "#64748b", marginBottom: 8, letterSpacing: "0.08em" }}>
              WEBHOOK ENDPOINTS
            </div>
            {WEBHOOK_ENDPOINTS.map(wh => {
              const statusColor = wh.status === "active" ? "#22c55e" : wh.status === "warning" ? "#f59e0b" : "#ef4444";
              return (
                <div key={wh.id} style={{ background: "#1e293b", border: `1px solid ${statusColor}20`, borderRadius: 8, padding: 12, marginBottom: 8 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 5 }}>
                    <div style={{ fontSize: 11, fontWeight: 700 }}>{wh.name}</div>
                    <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                      <div style={{ width: 7, height: 7, borderRadius: "50%", background: statusColor }} />
                      <span style={{ fontSize: 8, color: statusColor }}>{wh.status}</span>
                    </div>
                  </div>
                  <div style={{ fontSize: 8, fontFamily: "monospace", color: "#475569", marginBottom: 4 }}>{wh.url}</div>
                  <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                    {wh.events.map(e => (
                      <span key={e} style={{ fontSize: 7, background: "#334155", borderRadius: 4, padding: "1px 5px", color: "#94a3b8" }}>{e}</span>
                    ))}
                    <span style={{ fontSize: 7, color: "#475569", marginLeft: "auto" }}>Last ping: {wh.lastPing}</span>
                  </div>
                </div>
              );
            })}

            <CodeBlock label="Zalo Cloud Connect — webhook + event architecture" color="#0068ff" code={
`// ZCC: the integration layer between Zalo and businesses' systems.
// Events from Zalo → ZCC → business CRM/ERP/support systems.

// 1. WEBHOOK DELIVERY:
// When a user sends a message to a ZBA:
// Zalo fires a POST to the configured webhook URL.
// ZCC delivers the event with retry logic (3 retries, exponential backoff).

// 2. MANAGEMENT UI RESPONSIBILITIES:
// - Configure webhook endpoints per event type
// - View delivery status (delivered, failed, retrying)
// - Real-time event log for debugging
// - API key generation and rotation
// - Rate limit monitoring (Zalo API quotas)
// - Signature verification for security:

// Webhook payload verification:
const verifyZaloSignature = (payload: string, signature: string, secret: string): boolean => {
  const expected = crypto
    .createHmac("sha256", secret)
    .update(payload)
    .digest("hex");
  // Constant-time comparison to prevent timing attacks
  return crypto.timingSafeEqual(
    Buffer.from(expected, "hex"),
    Buffer.from(signature.replace("sha256=", ""), "hex")
  );
};

// 3. EVENT FILTERING:
// Businesses only want specific events.
// UI: per-webhook event type configuration.
// ZCC routes: only send events the webhook is subscribed to.
// Reduces noise. Reduces webhook processing load.`} />
          </div>

          {/* Real-time event stream */}
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: "#64748b", letterSpacing: "0.08em" }}>
                REAL-TIME EVENT STREAM
              </div>
              <button onClick={toggleStream} style={{
                background: streaming ? "#ef444420" : "#22c55e20",
                border: `1px solid ${streaming ? "#ef4444" : "#22c55e"}`,
                borderRadius: 6, padding: "4px 12px", color: streaming ? "#fca5a5" : "#4ade80",
                cursor: "pointer", fontSize: 10,
              }}>
                {streaming ? "⬛ Stop" : "▶ Start Stream"}
              </button>
            </div>
            <div style={{ background: "#0a0a14", border: "1px solid #1e293b", borderRadius: 10, padding: 10, height: 280, overflow: "auto", fontFamily: "monospace" }}>
              {events.map((evt, i) => (
                <div key={evt.id} style={{ display: "flex", gap: 8, alignItems: "center", padding: "4px 0", borderBottom: "1px solid #0f172a", opacity: i === 0 && streaming ? 1 : (1 - i * 0.04), transition: "opacity 0.3s" }}>
                  <span style={{ fontSize: 12, flexShrink: 0 }}>{evt.icon}</span>
                  <span style={{ fontSize: 9, color: evt.color, width: 70, flexShrink: 0 }}>{evt.type}</span>
                  <span style={{ fontSize: 8, color: "#475569", fontFamily: "monospace" }}>{evt.userId}</span>
                  <span style={{ fontSize: 7, color: "#334155", marginLeft: "auto" }}>{new Date(evt.ts).toLocaleTimeString()}</span>
                </div>
              ))}
            </div>
            {!streaming && <div style={{ fontSize: 9, color: "#475569", marginTop: 4, textAlign: "center" }}>Click "Start Stream" to see live events from Zalo</div>}

            <div style={{ marginTop: 12 }}>
              <CodeBlock label="API Key management — Redux + Ant Design Table" color="#a855f7" code={
`// ZCC API Key management: create, rotate, revoke.
// Displayed in an Ant Design Table with custom rendering.

// Redux state:
interface ApiKey {
  id: string;
  name: string;
  key: string;          // masked: "zcc_sk_...abc123"
  permissions: string[];
  createdAt: string;
  lastUsedAt: string;
  status: "active" | "revoked";
}

// Ant Design Table columns:
const columns: ColumnsType<ApiKey> = [
  {
    title: "Name",
    dataIndex: "name",
    render: (name, record) => (
      <Space>
        <KeyOutlined />
        <span>{name}</span>
        {record.status === "revoked" && <Tag color="error">Revoked</Tag>}
      </Space>
    ),
  },
  {
    title: "API Key",
    dataIndex: "key",
    render: (key) => (
      <Space>
        <code>{key}</code>
        <Button
          size="small" icon={<CopyOutlined />}
          onClick={() => navigator.clipboard.writeText(key)}
        />
      </Space>
    ),
  },
  {
    title: "Last Used",
    dataIndex: "lastUsedAt",
    render: (ts) => <TimeAgo date={ts} />,
  },
  {
    title: "Actions",
    render: (_, record) => (
      <Button
        danger size="small"
        onClick={() => dispatch(revokeApiKey(record.id))}
        disabled={record.status === "revoked"}
      >
        Revoke
      </Button>
    ),
  },
];`} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ZaloB2BDemo;
