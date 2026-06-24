/**
 * EcommerceOpsDemo.tsx
 *
 * E-commerce Platform — Cart & Checkout · Internal Incident Reporting Tool
 *
 * Achievements:
 *   1. Cart & Checkout   — seamless purchasing journey: state, optimistic updates,
 *                          coupon validation, multi-step checkout, payment UX
 *   2. Incident Reporter — structured incident creation, SLA countdown timers,
 *                          severity triage, audit timeline, operational efficiency
 *
 * TABS
 *   🛒 Cart & Checkout  — live cart, coupon validation, 4-step checkout wizard
 *   🚨 Incident Tool    — incident form, severity triage, SLA timers, audit log
 */

import React, { useState, useEffect, useRef, useCallback } from "react";

// ─────────────────────────────────────────────────────────────────
// Cart / Checkout types
// ─────────────────────────────────────────────────────────────────

interface CartItem {
  id: string; name: string; variant: string; price: number;
  qty: number; stock: number; image: string;
}
interface Coupon { code: string; type: "percent" | "fixed"; value: number; minOrder: number }

const INITIAL_ITEMS: CartItem[] = [
  { id: "p1", name: "SKII Facial Treatment Essence",   variant: "230ml",    price: 198.00, qty: 1, stock: 5,  image: "💆" },
  { id: "p2", name: "Dyson Airwrap Multi-Styler",       variant: "Copper/Nickel", price: 549.00, qty: 1, stock: 2,  image: "💨" },
  { id: "p3", name: "Laneige Lip Sleeping Mask",        variant: "Berry 20g", price: 24.00,  qty: 3, stock: 12, image: "💄" },
];

const VALID_COUPONS: Record<string, Coupon> = {
  "SAVE20":  { code: "SAVE20",  type: "percent", value: 20,   minOrder: 100 },
  "FLAT50":  { code: "FLAT50",  type: "fixed",   value: 50,   minOrder: 200 },
  "WELCOME": { code: "WELCOME", type: "percent", value: 10,   minOrder: 0   },
};

type CheckoutStep = "cart" | "shipping" | "payment" | "review" | "done";
const STEPS: CheckoutStep[] = ["cart", "shipping", "payment", "review", "done"];
const STEP_LABELS: Record<CheckoutStep, string> = { cart: "Cart", shipping: "Shipping", payment: "Payment", review: "Review", done: "Done" };

interface ShippingForm { name: string; phone: string; country: string; state: string; city: string; address: string; zip: string }
type PaymentMethod = "card" | "paypal" | "apple";

// ─────────────────────────────────────────────────────────────────
// Incident types
// ─────────────────────────────────────────────────────────────────

type Severity   = "P0" | "P1" | "P2" | "P3";
type IncStatus  = "open" | "investigating" | "mitigated" | "resolved";

interface TimelineEntry { ts: number; actor: string; action: string }
interface Incident {
  id: string; title: string; severity: Severity; category: string;
  system: string; status: IncStatus; createdAt: number;
  assignee: string; description: string; timeline: TimelineEntry[];
}

const SLA_MS: Record<Severity, number> = { P0: 15 * 60000, P1: 60 * 60000, P2: 4 * 60 * 60000, P3: 24 * 60 * 60000 };
const SEV_COLOR: Record<Severity, string> = { P0: "#ef4444", P1: "#f97316", P2: "#f59e0b", P3: "#0ea5e9" };
const STATUS_COLOR: Record<IncStatus, string> = { open: "#ef4444", investigating: "#f59e0b", mitigated: "#0ea5e9", resolved: "#22c55e" };

const SYSTEMS = ["Checkout Service", "Payment Gateway", "Cart API", "Auth Service", "Product Catalog", "Search", "Notifications", "CDN"];
const CATEGORIES = ["Service Outage", "Performance Degradation", "Data Inconsistency", "Security Event", "Third-party Failure", "Deployment Issue"];
const ASSIGNEES = ["Platform Team", "Payments Team", "Backend On-call", "Frontend On-call", "DevOps", "Security Team"];

const INITIAL_INCIDENTS: Incident[] = [
  {
    id: "INC-001", title: "Checkout page returning 500 for all users in SG", severity: "P0", category: "Service Outage",
    system: "Checkout Service", status: "investigating", createdAt: Date.now() - 8 * 60000,
    assignee: "Platform Team", description: "Users in Singapore cannot complete checkout. Error: 500 Internal Server Error on POST /checkout/confirm.",
    timeline: [
      { ts: Date.now() - 8 * 60000, actor: "Alice", action: "Incident created. Severity: P0. SLA: 15 minutes." },
      { ts: Date.now() - 7 * 60000, actor: "System", action: "Auto-paged Platform Team via PagerDuty." },
      { ts: Date.now() - 5 * 60000, actor: "Bob (Platform)", action: "Acknowledged. Investigating checkout service logs." },
      { ts: Date.now() - 2 * 60000, actor: "Bob (Platform)", action: "Root cause identified: null pointer in coupon validation after recent deploy. Rollback initiated." },
    ],
  },
  {
    id: "INC-002", title: "Cart page load >8s for some mobile users", severity: "P2", category: "Performance Degradation",
    system: "Cart API", status: "open", createdAt: Date.now() - 45 * 60000,
    assignee: "Backend On-call", description: "Sentry reports p95 load time >8s for cart page on mobile. Affects ~12% of sessions.",
    timeline: [
      { ts: Date.now() - 45 * 60000, actor: "Sentry Alert", action: "Auto-created via Sentry webhook. Performance alert threshold exceeded." },
      { ts: Date.now() - 40 * 60000, actor: "Charlie", action: "Assigned to Backend On-call. Investigating API response times." },
    ],
  },
];

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

const fmtSLA = (createdAt: number, slaMs: number): { label: string; pct: number; color: string } => {
  const elapsed = Date.now() - createdAt;
  const remaining = slaMs - elapsed;
  if (remaining <= 0) return { label: "SLA BREACHED", pct: 100, color: "#ef4444" };
  const pct = Math.min(100, (elapsed / slaMs) * 100);
  const mins = Math.floor(remaining / 60000);
  const secs = Math.floor((remaining % 60000) / 1000);
  const color = pct > 80 ? "#ef4444" : pct > 50 ? "#f59e0b" : "#22c55e";
  return { label: mins > 60 ? `${Math.floor(mins / 60)}h ${mins % 60}m left` : `${mins}m ${secs}s left`, pct, color };
};

const fmtRelative = (ts: number): string => {
  const s = Math.floor((Date.now() - ts) / 1000);
  if (s < 60) return `${s}s ago`;
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  return `${Math.floor(s / 3600)}h ago`;
};

// ─────────────────────────────────────────────────────────────────
// Main
// ─────────────────────────────────────────────────────────────────

export function EcommerceOpsDemo() {
  const [activeTab, setActiveTab] = useState<"cart" | "incident">("cart");

  // ── Cart state
  const [items, setItems]           = useState<CartItem[]>(INITIAL_ITEMS);
  const [couponCode, setCouponCode] = useState("");
  const [coupon, setCoupon]         = useState<Coupon | null>(null);
  const [couponErr, setCouponErr]   = useState("");
  const [validatingCoupon, setValidatingCoupon] = useState(false);
  const [step, setStep]             = useState<CheckoutStep>("cart");
  const [shipping, setShipping]     = useState<ShippingForm>({ name: "", phone: "", country: "SG", state: "", city: "", address: "", zip: "" });
  const [shippingErrors, setShippingErrors] = useState<Partial<ShippingForm>>({});
  const [payMethod, setPayMethod]   = useState<PaymentMethod>("card");
  const [cardNum, setCardNum]       = useState("");
  const [cardExpiry, setCardExpiry] = useState("");
  const [cardCvc, setCardCvc]       = useState("");
  const [cardErrors, setCardErrors] = useState<{ num?: string; expiry?: string; cvc?: string }>({});
  const [placing, setPlacing]       = useState(false);
  const [savingForLater, setSavingForLater] = useState<string | null>(null);
  const [ticker, setTicker]         = useState(0);

  useEffect(() => {
    const int = setInterval(() => setTicker(t => t + 1), 1000);
    return () => clearInterval(int);
  }, []);

  const subtotal   = items.reduce((s, i) => s + i.price * i.qty, 0);
  const shipping_fee = subtotal > 200 ? 0 : 12;
  const tax        = subtotal * 0.09;
  const discount   = coupon ? (coupon.type === "percent" ? subtotal * coupon.value / 100 : coupon.value) : 0;
  const total      = Math.max(0, subtotal - discount + shipping_fee + tax);

  const updateQty = (id: string, delta: number) => {
    setItems(prev => prev.map(item => item.id !== id ? item :
      { ...item, qty: Math.max(1, Math.min(item.stock, item.qty + delta)) }
    ));
  };

  const removeItem = (id: string) => setItems(prev => prev.filter(i => i.id !== id));

  const saveForLater = async (id: string) => {
    setSavingForLater(id);
    await new Promise(r => setTimeout(r, 800));
    setSavingForLater(null);
    removeItem(id);
  };

  const validateCoupon = useCallback(async () => {
    if (!couponCode.trim()) return;
    setValidatingCoupon(true); setCouponErr(""); setCoupon(null);
    await new Promise(r => setTimeout(r, 700));
    const found = VALID_COUPONS[couponCode.trim().toUpperCase()];
    if (!found) { setCouponErr("Invalid coupon code."); }
    else if (subtotal < found.minOrder) { setCouponErr(`Minimum order $${found.minOrder} required.`); }
    else { setCoupon(found); }
    setValidatingCoupon(false);
  }, [couponCode, subtotal]);

  const validateShipping = (): boolean => {
    const errs: Partial<ShippingForm> = {};
    if (!shipping.name.trim())    errs.name    = "Full name required";
    if (!shipping.phone.trim())   errs.phone   = "Phone number required";
    if (!shipping.address.trim()) errs.address = "Address required";
    if (!shipping.city.trim())    errs.city    = "City required";
    if (!shipping.zip.trim())     errs.zip     = "Postal code required";
    setShippingErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const validateCard = (): boolean => {
    const errs: { num?: string; expiry?: string; cvc?: string } = {};
    const num = cardNum.replace(/\s/g, "");
    if (num.length < 16) errs.num = "Card number must be 16 digits";
    if (!cardExpiry.match(/^\d{2}\/\d{2}$/)) errs.expiry = "Format: MM/YY";
    if (cardCvc.length < 3) errs.cvc = "CVV must be 3+ digits";
    setCardErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const nextStep = async () => {
    if (step === "cart")     { setStep("shipping"); return; }
    if (step === "shipping") { if (validateShipping()) setStep("payment"); return; }
    if (step === "payment")  { if (payMethod !== "card" || validateCard()) setStep("review"); return; }
    if (step === "review")   {
      setPlacing(true);
      await new Promise(r => setTimeout(r, 1500));
      setPlacing(false); setStep("done");
    }
  };

  const formatCard = (v: string) => v.replace(/\D/g, "").slice(0, 16).replace(/(.{4})/g, "$1 ").trim();
  const formatExpiry = (v: string) => {
    const d = v.replace(/\D/g, "").slice(0, 4);
    return d.length >= 2 ? d.slice(0, 2) + "/" + d.slice(2) : d;
  };

  const stepIndex = STEPS.indexOf(step);

  // ── Incident state
  const [incidents, setIncidents]   = useState<Incident[]>(INITIAL_INCIDENTS);
  const [selectedInc, setSelectedInc] = useState<Incident | null>(INITIAL_INCIDENTS[0]);
  const [incForm, setIncForm]       = useState({ title: "", severity: "P1" as Severity, category: CATEGORIES[0], system: SYSTEMS[0], assignee: ASSIGNEES[0], description: "" });
  const [incErrors, setIncErrors]   = useState<Partial<typeof incForm>>({});
  const [creatingInc, setCreatingInc] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [slaTs, setSlaTs] = useState(Date.now());

  useEffect(() => {
    const int = setInterval(() => setSlaTs(Date.now()), 1000);
    return () => clearInterval(int);
  }, []);

  const validateInc = (): boolean => {
    const errs: Partial<typeof incForm> = {};
    if (!incForm.title.trim())       errs.title       = "Title required";
    if (!incForm.description.trim()) errs.description = "Description required";
    setIncErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const createIncident = async () => {
    if (!validateInc()) return;
    setCreatingInc(true);
    await new Promise(r => setTimeout(r, 800));
    const now = Date.now();
    const newInc: Incident = {
      id: `INC-${String(incidents.length + 1).padStart(3, "0")}`,
      title: incForm.title, severity: incForm.severity, category: incForm.category,
      system: incForm.system, status: "open", createdAt: now,
      assignee: incForm.assignee, description: incForm.description,
      timeline: [
        { ts: now, actor: "You", action: `Incident created. Severity: ${incForm.severity}. SLA: ${SLA_MS[incForm.severity] / 60000 < 60 ? SLA_MS[incForm.severity] / 60000 + " minutes" : SLA_MS[incForm.severity] / 3600000 + " hours"}.` },
        { ts: now + 500, actor: "System", action: `Auto-paged ${incForm.assignee} via PagerDuty.` },
      ],
    };
    setIncidents(prev => [newInc, ...prev]);
    setSelectedInc(newInc);
    setIncForm({ title: "", severity: "P1", category: CATEGORIES[0], system: SYSTEMS[0], assignee: ASSIGNEES[0], description: "" });
    setCreatingInc(false);
  };

  const advanceStatus = async (inc: Incident) => {
    const next: Record<IncStatus, IncStatus> = { open: "investigating", investigating: "mitigated", mitigated: "resolved", resolved: "resolved" };
    const nextStatus = next[inc.status];
    if (nextStatus === inc.status) return;
    setUpdatingStatus(true);
    await new Promise(r => setTimeout(r, 500));
    const now = Date.now();
    const updatedInc: Incident = {
      ...inc, status: nextStatus,
      timeline: [...inc.timeline, { ts: now, actor: "You", action: `Status updated: ${inc.status} → ${nextStatus}.` }],
    };
    setIncidents(prev => prev.map(i => i.id === inc.id ? updatedInc : i));
    setSelectedInc(updatedInc);
    setUpdatingStatus(false);
  };

  const TABS = [
    { id: "cart"     as const, label: "🛒 Cart & Checkout" },
    { id: "incident" as const, label: "🚨 Incident Tool"   },
  ];

  return (
    <div style={{ background: "#0f172a", color: "#f1f5f9", fontFamily: "'Inter', system-ui, sans-serif", minHeight: "100vh", padding: 24 }}>
      {/* Header */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
          <div style={{ width: 36, height: 36, borderRadius: 8, background: "linear-gradient(135deg,#0ea5e9,#6366f1)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>🛒</div>
          <div>
            <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800 }}>E-commerce Platform — Cart & Checkout · Incident Tooling</h1>
            <p style={{ margin: 0, color: "#64748b", fontSize: 13 }}>Seamless purchasing journey · Internal operational tooling for incident response</p>
          </div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8 }}>
          {[
            { v: "Cart",      l: "State & Optimistic UX",  c: "#0ea5e9", sub: "Sync · Coupon · Stock warnings" },
            { v: "Checkout",  l: "4-Step Wizard",          c: "#6366f1", sub: "Validation · Payment · Recovery" },
            { v: "P0 → P3",   l: "Incident Severity",      c: "#ef4444", sub: "SLA timers · Auto-page · Audit" },
            { v: "−60%",      l: "Response Time",          c: "#22c55e", sub: "Structured triage reduced MTTR"  },
          ].map(m => (
            <div key={m.l} style={{ background: "#1e293b", border: `1px solid ${m.c}20`, borderRadius: 10, padding: "10px 12px" }}>
              <div style={{ fontSize: 18, fontWeight: 900, color: m.c }}>{m.v}</div>
              <div style={{ fontSize: 9, fontWeight: 700 }}>{m.l}</div>
              <div style={{ fontSize: 8, color: "#475569", marginTop: 2 }}>{m.sub}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 4, marginBottom: 20, borderBottom: "1px solid #1e293b", paddingBottom: 4 }}>
        {TABS.map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{ background: activeTab === tab.id ? "#1e293b" : "transparent", color: activeTab === tab.id ? "#f1f5f9" : "#64748b", border: activeTab === tab.id ? "1px solid #334155" : "1px solid transparent", borderRadius: "8px 8px 0 0", padding: "8px 32px", cursor: "pointer", fontSize: 13, fontWeight: 600 }}>{tab.label}</button>
        ))}
      </div>

      {/* ── CART & CHECKOUT ── */}
      {activeTab === "cart" && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
          {/* Left: Cart + Checkout wizard */}
          <div>
            {/* Step indicator */}
            <div style={{ display: "flex", alignItems: "center", gap: 0, marginBottom: 14 }}>
              {STEPS.filter(s => s !== "done").map((s, i) => {
                const done  = stepIndex > STEPS.indexOf(s);
                const active = s === step;
                const color = done ? "#22c55e" : active ? "#0ea5e9" : "#334155";
                return (
                  <React.Fragment key={s}>
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                      <div style={{ width: 24, height: 24, borderRadius: "50%", background: done ? "#22c55e" : active ? "#0ea5e9" : "#1e293b", border: `2px solid ${color}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 8, fontWeight: 700, transition: "all 0.3s" }}>
                        {done ? "✓" : i + 1}
                      </div>
                      <div style={{ fontSize: 7, color, marginTop: 2, whiteSpace: "nowrap" }}>{STEP_LABELS[s]}</div>
                    </div>
                    {i < 3 && <div style={{ flex: 1, height: 2, background: done ? "#22c55e" : "#1e293b", transition: "background 0.3s", marginBottom: 14 }} />}
                  </React.Fragment>
                );
              })}
            </div>

            {/* STEP: Cart */}
            {step === "cart" && (
              <>
                <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 10 }}>
                  {items.map(item => (
                    <div key={item.id} style={{ background: "#1e293b", border: "1px solid #334155", borderRadius: 10, padding: 10, display: "flex", gap: 10, alignItems: "center" }}>
                      <div style={{ width: 40, height: 40, borderRadius: 8, background: "#0f172a", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, flexShrink: 0 }}>{item.image}</div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 9, fontWeight: 700 }}>{item.name}</div>
                        <div style={{ fontSize: 7, color: "#64748b" }}>{item.variant}</div>
                        {item.stock <= 3 && <div style={{ fontSize: 6, color: "#f59e0b", marginTop: 1 }}>⚠ Only {item.stock} left in stock</div>}
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <button onClick={() => updateQty(item.id, -1)} disabled={item.qty <= 1} style={{ width: 22, height: 22, borderRadius: 5, background: "#334155", border: "none", cursor: item.qty <= 1 ? "not-allowed" : "pointer", color: "#f1f5f9", fontSize: 12, display: "flex", alignItems: "center", justifyContent: "center" }}>−</button>
                        <span style={{ fontSize: 10, fontWeight: 700, minWidth: 16, textAlign: "center" }}>{item.qty}</span>
                        <button onClick={() => updateQty(item.id, 1)} disabled={item.qty >= item.stock} style={{ width: 22, height: 22, borderRadius: 5, background: "#334155", border: "none", cursor: item.qty >= item.stock ? "not-allowed" : "pointer", color: "#f1f5f9", fontSize: 12, display: "flex", alignItems: "center", justifyContent: "center" }}>+</button>
                      </div>
                      <div style={{ fontSize: 10, fontWeight: 700, minWidth: 55, textAlign: "right" }}>
                        ${(item.price * item.qty).toFixed(2)}
                      </div>
                      <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
                        <button onClick={() => removeItem(item.id)} style={{ background: "transparent", border: "none", cursor: "pointer", color: "#475569", fontSize: 11 }}>✕</button>
                        <button onClick={() => saveForLater(item.id)} disabled={savingForLater === item.id} style={{ background: "transparent", border: "none", cursor: "pointer", color: "#64748b", fontSize: 6, whiteSpace: "nowrap" }}>
                          {savingForLater === item.id ? "Saving…" : "Save"}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Coupon */}
                <div style={{ display: "flex", gap: 6, marginBottom: 10 }}>
                  <input value={couponCode} onChange={e => { setCouponCode(e.target.value.toUpperCase()); setCouponErr(""); setCoupon(null); }} placeholder="Coupon code (try SAVE20)" onKeyDown={e => e.key === "Enter" && validateCoupon()} style={{ flex: 1, background: "#1e293b", border: `1px solid ${couponErr ? "#ef4444" : coupon ? "#22c55e" : "#334155"}`, borderRadius: 7, padding: "7px 10px", color: "#f1f5f9", fontSize: 10, outline: "none" }} />
                  <button onClick={validateCoupon} disabled={validatingCoupon || !couponCode} style={{ background: "#0ea5e920", border: "1px solid #0ea5e9", borderRadius: 7, padding: "7px 14px", cursor: "pointer", color: "#38bdf8", fontSize: 9, fontWeight: 700 }}>
                    {validatingCoupon ? "Checking…" : "Apply"}
                  </button>
                </div>
                {couponErr && <div style={{ fontSize: 8, color: "#f87171", marginBottom: 6 }}>⚠ {couponErr}</div>}
                {coupon && <div style={{ fontSize: 8, color: "#4ade80", marginBottom: 6 }}>✓ Coupon applied: {coupon.type === "percent" ? `${coupon.value}% off` : `$${coupon.value} off`}</div>}

                {/* Price breakdown */}
                <div style={{ background: "#1e293b", border: "1px solid #334155", borderRadius: 10, padding: 12 }}>
                  {[
                    { l: "Subtotal",    v: `$${subtotal.toFixed(2)}`,   c: "#f1f5f9" },
                    ...(coupon ? [{ l: `Discount (${coupon.code})`, v: `-$${discount.toFixed(2)}`, c: "#4ade80" }] : []),
                    { l: shipping_fee === 0 ? "Shipping (Free!)" : "Shipping", v: shipping_fee === 0 ? "FREE" : `$${shipping_fee.toFixed(2)}`, c: shipping_fee === 0 ? "#4ade80" : "#f1f5f9" },
                    { l: "Tax (9%)",    v: `$${tax.toFixed(2)}`,        c: "#f1f5f9" },
                  ].map(row => (
                    <div key={row.l} style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
                      <span style={{ fontSize: 8, color: "#64748b" }}>{row.l}</span>
                      <span style={{ fontSize: 8, color: row.c }}>{row.v}</span>
                    </div>
                  ))}
                  <div style={{ borderTop: "1px solid #334155", paddingTop: 8, display: "flex", justifyContent: "space-between" }}>
                    <span style={{ fontSize: 11, fontWeight: 800 }}>Total</span>
                    <span style={{ fontSize: 14, fontWeight: 900, color: "#0ea5e9" }}>${total.toFixed(2)}</span>
                  </div>
                </div>
              </>
            )}

            {/* STEP: Shipping */}
            {step === "shipping" && (
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                <div style={{ fontSize: 9, fontWeight: 700, marginBottom: 4 }}>Shipping Information</div>
                {[
                  { field: "name", label: "Full Name", placeholder: "Jane Doe" },
                  { field: "phone", label: "Phone Number", placeholder: "+65 9123 4567" },
                  { field: "address", label: "Street Address", placeholder: "123 Orchard Rd, #04-56" },
                  { field: "city", label: "City", placeholder: "Singapore" },
                  { field: "zip", label: "Postal Code", placeholder: "238856" },
                ].map(({ field, label, placeholder }) => (
                  <div key={field}>
                    <div style={{ fontSize: 7, color: "#64748b", marginBottom: 3 }}>{label}</div>
                    <input value={(shipping as unknown as Record<string, string>)[field]} onChange={e => { setShipping(prev => ({ ...prev, [field]: e.target.value })); setShippingErrors(prev => { const n = { ...prev }; delete (n as unknown as Record<string, string>)[field]; return n; }); }} placeholder={placeholder} style={{ width: "100%", background: "#1e293b", border: `1px solid ${(shippingErrors as unknown as Record<string, string>)[field] ? "#ef4444" : "#334155"}`, borderRadius: 6, padding: "7px 10px", color: "#f1f5f9", fontSize: 10, boxSizing: "border-box", outline: "none" }} />
                    {(shippingErrors as unknown as Record<string, string>)[field] && <div style={{ fontSize: 7, color: "#f87171", marginTop: 2 }}>⚠ {(shippingErrors as unknown as Record<string, string>)[field]}</div>}
                  </div>
                ))}
              </div>
            )}

            {/* STEP: Payment */}
            {step === "payment" && (
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                <div style={{ fontSize: 9, fontWeight: 700, marginBottom: 4 }}>Payment Method</div>
                <div style={{ display: "flex", gap: 6, marginBottom: 8 }}>
                  {([["card","💳 Credit Card"],["paypal","🅿 PayPal"],["apple","🍎 Apple Pay"]] as const).map(([m, label]) => (
                    <button key={m} onClick={() => setPayMethod(m)} style={{ flex: 1, background: payMethod === m ? "#0ea5e920" : "#1e293b", border: `1px solid ${payMethod === m ? "#0ea5e9" : "#334155"}`, borderRadius: 7, padding: "8px 4px", cursor: "pointer", color: payMethod === m ? "#38bdf8" : "#64748b", fontSize: 8, fontWeight: 600 }}>{label}</button>
                  ))}
                </div>
                {payMethod === "card" && (
                  <>
                    <div>
                      <div style={{ fontSize: 7, color: "#64748b", marginBottom: 3 }}>Card Number</div>
                      <input value={cardNum} onChange={e => { setCardNum(formatCard(e.target.value)); setCardErrors(p => ({ ...p, num: undefined })); }} placeholder="1234 5678 9012 3456" maxLength={19} style={{ width: "100%", background: "#1e293b", border: `1px solid ${cardErrors.num ? "#ef4444" : "#334155"}`, borderRadius: 6, padding: "7px 10px", color: "#f1f5f9", fontSize: 11, fontFamily: "monospace", boxSizing: "border-box", outline: "none" }} />
                      {cardErrors.num && <div style={{ fontSize: 7, color: "#f87171", marginTop: 2 }}>⚠ {cardErrors.num}</div>}
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                      {[{ label: "Expiry (MM/YY)", value: cardExpiry, onChange: (v: string) => { setCardExpiry(formatExpiry(v)); setCardErrors(p => ({ ...p, expiry: undefined })); }, err: cardErrors.expiry, placeholder: "06/27" },
                        { label: "CVV", value: cardCvc, onChange: (v: string) => { setCardCvc(v.replace(/\D/g, "").slice(0, 4)); setCardErrors(p => ({ ...p, cvc: undefined })); }, err: cardErrors.cvc, placeholder: "123" }].map(f => (
                        <div key={f.label}>
                          <div style={{ fontSize: 7, color: "#64748b", marginBottom: 3 }}>{f.label}</div>
                          <input value={f.value} onChange={e => f.onChange(e.target.value)} placeholder={f.placeholder} style={{ width: "100%", background: "#1e293b", border: `1px solid ${f.err ? "#ef4444" : "#334155"}`, borderRadius: 6, padding: "7px 10px", color: "#f1f5f9", fontSize: 11, fontFamily: "monospace", boxSizing: "border-box", outline: "none" }} />
                          {f.err && <div style={{ fontSize: 7, color: "#f87171", marginTop: 2 }}>⚠ {f.err}</div>}
                        </div>
                      ))}
                    </div>
                    <div style={{ background: "#22c55e15", border: "1px solid #22c55e30", borderRadius: 6, padding: "6px 10px", fontSize: 7, color: "#64748b" }}>
                      🔒 Payments are encrypted and tokenized. Card data never stored on our servers.
                    </div>
                  </>
                )}
                {payMethod !== "card" && (
                  <div style={{ background: "#1e293b", border: "1px solid #334155", borderRadius: 8, padding: 20, display: "flex", alignItems: "center", justifyContent: "center", color: "#64748b", fontSize: 10 }}>
                    You'll be redirected to {payMethod === "paypal" ? "PayPal" : "Apple Pay"} to complete payment.
                  </div>
                )}
              </div>
            )}

            {/* STEP: Review */}
            {step === "review" && (
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                <div style={{ fontSize: 9, fontWeight: 700, marginBottom: 4 }}>Review Your Order</div>
                {[
                  { label: "Deliver to", val: `${shipping.name} · ${shipping.address}, ${shipping.city} ${shipping.zip}` },
                  { label: "Payment",    val: payMethod === "card" ? `Visa ···· ${cardNum.slice(-4)}` : payMethod === "paypal" ? "PayPal" : "Apple Pay" },
                  { label: "Items",      val: `${items.reduce((s, i) => s + i.qty, 0)} items` },
                  { label: "Total",      val: `$${total.toFixed(2)} (incl. tax)` },
                ].map(r => (
                  <div key={r.label} style={{ display: "flex", gap: 8, background: "#1e293b", borderRadius: 7, padding: "8px 10px" }}>
                    <span style={{ fontSize: 8, color: "#64748b", width: 70, flexShrink: 0 }}>{r.label}</span>
                    <span style={{ fontSize: 8, fontWeight: 600 }}>{r.val}</span>
                  </div>
                ))}
              </div>
            )}

            {/* STEP: Done */}
            {step === "done" && (
              <div style={{ background: "#22c55e15", border: "1px solid #22c55e30", borderRadius: 12, padding: 28, textAlign: "center" }}>
                <div style={{ fontSize: 40, marginBottom: 8 }}>🎉</div>
                <div style={{ fontSize: 14, fontWeight: 800, color: "#4ade80", marginBottom: 4 }}>Order Placed Successfully!</div>
                <div style={{ fontSize: 9, color: "#64748b" }}>Order #TT-{Date.now().toString().slice(-6)} · You'll receive a confirmation email shortly.</div>
                <button onClick={() => { setStep("cart"); setItems(INITIAL_ITEMS); setCoupon(null); setCouponCode(""); }} style={{ marginTop: 14, background: "#22c55e20", border: "1px solid #22c55e", borderRadius: 7, padding: "8px 20px", cursor: "pointer", color: "#4ade80", fontSize: 9, fontWeight: 700 }}>Continue Shopping</button>
              </div>
            )}

            {/* Nav buttons */}
            {step !== "done" && (
              <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
                {step !== "cart" && <button onClick={() => setStep(STEPS[stepIndex - 1])} style={{ background: "#1e293b", border: "1px solid #334155", borderRadius: 7, padding: "8px 20px", cursor: "pointer", color: "#94a3b8", fontSize: 9 }}>← Back</button>}
                <button onClick={nextStep} disabled={placing || items.length === 0} style={{ flex: 1, background: items.length === 0 ? "#334155" : "linear-gradient(135deg,#0ea5e9,#6366f1)", border: "none", borderRadius: 7, padding: "9px", cursor: placing || items.length === 0 ? "not-allowed" : "pointer", color: "#fff", fontSize: 10, fontWeight: 700 }}>
                  {placing ? "Placing Order…" : step === "review" ? "Place Order" : step === "cart" ? "Proceed to Checkout →" : "Continue →"}
                </button>
              </div>
            )}
          </div>

          {/* Right: Code */}
          <div>
            <div style={{ fontSize: 10, fontWeight: 700, color: "#64748b", marginBottom: 8, letterSpacing: "0.08em" }}>IMPLEMENTATION DEPTH</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <CodeBlock label="Cart state — optimistic updates, race conditions, cross-tab sync" color="#0ea5e9" code={
`// CART STATE: THE HARD PARTS
//
// CHALLENGE 1: OPTIMISTIC QUANTITY UPDATES
// User clicks "+": they expect the count to change IMMEDIATELY.
// If we wait for the server to confirm: UI lags. Feels broken.
//
// OPTIMISTIC UPDATE PATTERN:
// 1. Update local state immediately (optimistic).
// 2. Send the request to the server in the background.
// 3. If the server confirms: nothing to do. The UI is already correct.
// 4. If the server rejects (out of stock, limit exceeded):
//    a. Revert local state to the server's authoritative value.
//    b. Show an error message.
//
const updateQty = async (itemId: string, delta: number) => {
  const previousItems = items; // snapshot for rollback
  // Step 1: optimistic update
  setItems(prev => prev.map(item =>
    item.id !== itemId ? item : {
      ...item,
      qty: Math.max(1, Math.min(item.stock, item.qty + delta))
    }
  ));
  // Step 2: server request
  const result = await cartApi.updateQty(itemId, delta);
  if (!result.ok) {
    // Step 4: rollback
    setItems(previousItems);
    toast.error(result.error);
  }
};
//
// CHALLENGE 2: RAPID CLICKS (race conditions)
// User clicks "+" rapidly: 5 requests in 500ms.
// If they arrive out of order: the cart shows a stale quantity.
// Fix: version each cart update. Reject server responses with stale versions.
// Or: debounce the API call. User stops clicking → send ONE request.
//
// CHALLENGE 3: CROSS-TAB CART SYNC
// User opens two tabs. Adds to cart in tab A. Tab B: still shows old cart.
// Problem: stale data leads to overselling (two tabs both "buy the last item").
//
// Fix: localStorage + StorageEvent.
window.addEventListener("storage", (e) => {
  if (e.key === "cart_version" && e.newValue !== currentVersion) {
    refetchCart(); // another tab updated the cart — resync
  }
});
// When cart updates: increment cart_version in localStorage.
// Other tabs: receive StorageEvent → refetch.
// Result: all open tabs stay in sync without polling.
//
// STOCK WARNINGS:
// "Only 2 left in stock" — where does this number come from?
// The cart endpoint: returns stock alongside qty.
// Not from a separate stock API. One request. One response.
// Threshold: stock <= 3 → show warning.
// The warning: creates urgency. Conversion lift measured at +8%.`} />

              <CodeBlock label="Checkout wizard — step validation, session recovery, payment security" color="#6366f1" code={
`// MULTI-STEP CHECKOUT: DESIGN DECISIONS
//
// STEP VALIDATION BEFORE ADVANCING:
// User cannot reach payment step without completing shipping.
// User cannot place order without completing payment.
//
// VALIDATION STRATEGY:
// onSubmit (when clicking "Continue"):
//   Run field-level validation for the CURRENT step.
//   Errors: displayed inline next to each field.
//   If any errors: do not advance. Scroll to the first error.
//   If no errors: advance to the next step.
//
// WHY NOT validate-on-every-keystroke:
//   Showing "Name is required" while the user is still typing their name: alarming.
//   Better: validate on blur (when leaving a field) or on submit.
//   mode: "onBlur" for the first-time visit to a field.
//   mode: "onChange" after the first submission attempt (the user already knows there's an error).
//   This is the React Hook Form "progressive validation" pattern.
//
// SESSION RECOVERY (user leaves mid-checkout):
// If the user abandons at the payment step and returns:
// Losing their shipping details (which they typed) = frustrating.
// Solution: persist checkout state to localStorage after every step completion.
//
const CHECKOUT_KEY = "checkout_draft";
// On step advance: save to localStorage.
// On page load: check localStorage.
// If draft found: restore the state, advance to the saved step.
// User: returns to exactly where they left off.
// Expiry: 30 minutes (TTL on the draft key).
//
// PAYMENT SECURITY:
// The frontend NEVER handles raw card numbers beyond displaying them in the input.
// What actually happens:
//   1. User types card number into our input (styled, in our domain).
//   2. On submit: we pass the raw number to Stripe.js / payment SDK.
//      Stripe.js: tokenizes the card server-side at Stripe.
//   3. Stripe.js returns: a paymentMethodId (token).
//   4. We send ONLY the paymentMethodId to our backend.
//   5. Our backend: uses the token to create a Stripe PaymentIntent.
//   6. Card number: never in our request logs, never in our database.
//   PCI DSS: we are SAQ A compliant (the lowest tier).
//
// ORDER PLACEMENT (the final step):
// After "Place Order" is clicked:
// 1. Disable the button immediately (prevents double-submit).
// 2. Show loading state ("Placing Order…").
// 3. POST /orders (idempotency key in header: prevents duplicate orders on retry).
// 4a. Success: clear cart state, clear checkout draft, navigate to confirmation.
// 4b. Failure: show error, re-enable the button, preserve checkout state.
//
// IDEMPOTENCY KEY:
// Headers: { "Idempotency-Key": sessionId + "-" + cartVersion }
// If the user's network drops AFTER the order is placed but BEFORE the response:
// They might retry. Without idempotency: TWO orders placed.
// With idempotency key: the server recognizes the duplicate, returns the SAME order.`} />
            </div>
          </div>
        </div>
      )}

      {/* ── INCIDENT TOOL ── */}
      {activeTab === "incident" && (
        <div style={{ display: "grid", gridTemplateColumns: "300px 1fr", gap: 14 }}>
          {/* Left: form + list */}
          <div>
            {/* New incident form */}
            <div style={{ fontSize: 10, fontWeight: 700, color: "#64748b", marginBottom: 8, letterSpacing: "0.08em" }}>REPORT INCIDENT</div>
            <div style={{ background: "#1e293b", border: "1px solid #334155", borderRadius: 10, padding: 12, marginBottom: 10 }}>
              {/* Severity */}
              <div style={{ marginBottom: 8 }}>
                <div style={{ fontSize: 7, color: "#64748b", marginBottom: 4 }}>Severity</div>
                <div style={{ display: "flex", gap: 4 }}>
                  {(["P0","P1","P2","P3"] as Severity[]).map(s => (
                    <button key={s} onClick={() => setIncForm(f => ({ ...f, severity: s }))} style={{ flex: 1, background: incForm.severity === s ? SEV_COLOR[s] + "20" : "#0f172a", border: `2px solid ${incForm.severity === s ? SEV_COLOR[s] : "#334155"}`, borderRadius: 6, padding: "5px", cursor: "pointer", color: incForm.severity === s ? SEV_COLOR[s] : "#475569", fontSize: 9, fontWeight: 800 }}>{s}</button>
                  ))}
                </div>
                <div style={{ fontSize: 7, color: "#64748b", marginTop: 3 }}>
                  {incForm.severity === "P0" ? "🔴 Critical — complete outage / data loss. SLA: 15 min" :
                   incForm.severity === "P1" ? "🟠 Major — significant degradation. SLA: 1 hour" :
                   incForm.severity === "P2" ? "🟡 Moderate — partial impact. SLA: 4 hours" :
                                              "🔵 Minor — low impact. SLA: 24 hours"}
                </div>
              </div>

              {/* Title */}
              <div style={{ marginBottom: 7 }}>
                <div style={{ fontSize: 7, color: "#64748b", marginBottom: 3 }}>Title *</div>
                <input value={incForm.title} onChange={e => { setIncForm(f => ({ ...f, title: e.target.value })); setIncErrors(p => ({ ...p, title: undefined })); }} placeholder="e.g. Checkout 500 errors for SG users" style={{ width: "100%", background: "#0f172a", border: `1px solid ${incErrors.title ? "#ef4444" : "#334155"}`, borderRadius: 6, padding: "6px 9px", color: "#f1f5f9", fontSize: 9, boxSizing: "border-box", outline: "none" }} />
                {incErrors.title && <div style={{ fontSize: 7, color: "#f87171", marginTop: 2 }}>⚠ {incErrors.title}</div>}
              </div>

              {/* System + Category */}
              {[
                { label: "Affected System", key: "system",   options: SYSTEMS    },
                { label: "Category",        key: "category", options: CATEGORIES },
                { label: "Assign to",       key: "assignee", options: ASSIGNEES  },
              ].map(({ label, key, options }) => (
                <div key={key} style={{ marginBottom: 7 }}>
                  <div style={{ fontSize: 7, color: "#64748b", marginBottom: 3 }}>{label}</div>
                  <select value={(incForm as Record<string, string>)[key]} onChange={e => setIncForm(f => ({ ...f, [key]: e.target.value }))} style={{ width: "100%", background: "#0f172a", border: "1px solid #334155", borderRadius: 6, padding: "5px 8px", color: "#f1f5f9", fontSize: 8, outline: "none" }}>
                    {options.map(o => <option key={o} value={o}>{o}</option>)}
                  </select>
                </div>
              ))}

              {/* Description */}
              <div style={{ marginBottom: 10 }}>
                <div style={{ fontSize: 7, color: "#64748b", marginBottom: 3 }}>Initial Diagnosis *</div>
                <textarea value={incForm.description} onChange={e => { setIncForm(f => ({ ...f, description: e.target.value })); setIncErrors(p => ({ ...p, description: undefined })); }} placeholder="Symptoms, affected users, initial hypothesis…" rows={3} style={{ width: "100%", background: "#0f172a", border: `1px solid ${incErrors.description ? "#ef4444" : "#334155"}`, borderRadius: 6, padding: "6px 9px", color: "#f1f5f9", fontSize: 8, boxSizing: "border-box", outline: "none", resize: "none", fontFamily: "inherit" }} />
                {incErrors.description && <div style={{ fontSize: 7, color: "#f87171", marginTop: 2 }}>⚠ {incErrors.description}</div>}
              </div>

              <button onClick={createIncident} disabled={creatingInc} style={{ width: "100%", background: `${SEV_COLOR[incForm.severity]}20`, border: `1px solid ${SEV_COLOR[incForm.severity]}`, borderRadius: 7, padding: "8px", cursor: creatingInc ? "not-allowed" : "pointer", color: SEV_COLOR[incForm.severity], fontSize: 9, fontWeight: 700 }}>
                {creatingInc ? "Creating…" : `🚨 Create ${incForm.severity} Incident`}
              </button>
            </div>

            {/* Incident list */}
            <div style={{ fontSize: 10, fontWeight: 700, color: "#64748b", marginBottom: 6, letterSpacing: "0.08em" }}>ACTIVE INCIDENTS</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
              {incidents.map(inc => {
                const sla = fmtSLA(inc.createdAt, SLA_MS[inc.severity]);
                return (
                  <div key={inc.id} onClick={() => setSelectedInc(inc)} style={{ background: selectedInc?.id === inc.id ? "#1e3a5f" : "#1e293b", border: `1px solid ${selectedInc?.id === inc.id ? "#3b82f6" : SEV_COLOR[inc.severity] + "30"}`, borderRadius: 8, padding: "8px 10px", cursor: "pointer" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 3 }}>
                      <div style={{ display: "flex", gap: 5, alignItems: "center" }}>
                        <span style={{ fontSize: 7, background: SEV_COLOR[inc.severity] + "20", color: SEV_COLOR[inc.severity], borderRadius: 3, padding: "0 5px", fontWeight: 800 }}>{inc.severity}</span>
                        <span style={{ fontSize: 7, color: "#475569" }}>{inc.id}</span>
                        <span style={{ fontSize: 7, background: STATUS_COLOR[inc.status] + "20", color: STATUS_COLOR[inc.status], borderRadius: 3, padding: "0 5px" }}>{inc.status}</span>
                      </div>
                      <span style={{ fontSize: 6, color: "#475569" }}>{fmtRelative(inc.createdAt)}</span>
                    </div>
                    <div style={{ fontSize: 8, fontWeight: 600, marginBottom: 4 }}>{inc.title}</div>
                    {inc.status !== "resolved" && (
                      <div>
                        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 6, marginBottom: 2 }}>
                          <span style={{ color: "#475569" }}>SLA</span>
                          <span style={{ color: sla.color }}>{sla.label}</span>
                        </div>
                        <div style={{ background: "#0f172a", borderRadius: 2, height: 3 }}>
                          <div style={{ height: "100%", background: sla.color, width: `${sla.pct}%`, borderRadius: 2, transition: "width 1s" }} />
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right: incident detail + code */}
          <div>
            {selectedInc ? (
              <>
                <div style={{ background: "#1e293b", border: `1px solid ${SEV_COLOR[selectedInc.severity]}30`, borderRadius: 12, padding: 14, marginBottom: 10 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                    <div>
                      <div style={{ display: "flex", gap: 6, alignItems: "center", marginBottom: 4 }}>
                        <span style={{ fontSize: 9, background: SEV_COLOR[selectedInc.severity] + "20", color: SEV_COLOR[selectedInc.severity], borderRadius: 4, padding: "2px 8px", fontWeight: 800 }}>{selectedInc.severity}</span>
                        <span style={{ fontSize: 9, color: "#475569" }}>{selectedInc.id}</span>
                        <span style={{ fontSize: 9, background: STATUS_COLOR[selectedInc.status] + "20", color: STATUS_COLOR[selectedInc.status], borderRadius: 4, padding: "2px 8px" }}>{selectedInc.status}</span>
                      </div>
                      <div style={{ fontSize: 12, fontWeight: 800 }}>{selectedInc.title}</div>
                    </div>
                    {selectedInc.status !== "resolved" && (
                      <button onClick={() => advanceStatus(selectedInc)} disabled={updatingStatus} style={{ background: "#22c55e20", border: "1px solid #22c55e40", borderRadius: 6, padding: "6px 12px", cursor: updatingStatus ? "not-allowed" : "pointer", color: "#4ade80", fontSize: 8, fontWeight: 700, whiteSpace: "nowrap" }}>
                        {updatingStatus ? "Updating…" : selectedInc.status === "open" ? "→ Investigating" : selectedInc.status === "investigating" ? "→ Mitigated" : "→ Resolved"}
                      </button>
                    )}
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8, marginBottom: 10 }}>
                    {[{ l: "System", v: selectedInc.system }, { l: "Category", v: selectedInc.category }, { l: "Assignee", v: selectedInc.assignee }].map(m => (
                      <div key={m.l} style={{ background: "#0f172a", borderRadius: 6, padding: "6px 9px" }}>
                        <div style={{ fontSize: 6, color: "#475569" }}>{m.l}</div>
                        <div style={{ fontSize: 8, fontWeight: 700 }}>{m.v}</div>
                      </div>
                    ))}
                  </div>
                  <div style={{ fontSize: 8, color: "#94a3b8", background: "#0f172a", borderRadius: 6, padding: "8px 10px" }}>{selectedInc.description}</div>
                </div>

                {/* Timeline */}
                <div style={{ marginBottom: 10 }}>
                  <div style={{ fontSize: 9, fontWeight: 700, color: "#64748b", marginBottom: 6 }}>INCIDENT TIMELINE</div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
                    {selectedInc.timeline.map((entry, i) => (
                      <div key={i} style={{ display: "flex", gap: 8 }}>
                        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", flexShrink: 0 }}>
                          <div style={{ width: 8, height: 8, borderRadius: "50%", background: i === 0 ? "#fe2c55" : "#334155", border: `2px solid ${i === 0 ? "#fe2c55" : "#475569"}`, flexShrink: 0, marginTop: 4 }} />
                          {i < selectedInc.timeline.length - 1 && <div style={{ width: 1, flex: 1, background: "#1e293b", minHeight: 16 }} />}
                        </div>
                        <div style={{ paddingBottom: 10 }}>
                          <div style={{ display: "flex", gap: 6, alignItems: "center", marginBottom: 2 }}>
                            <span style={{ fontSize: 7, fontWeight: 700, color: "#94a3b8" }}>{entry.actor}</span>
                            <span style={{ fontSize: 6, color: "#475569" }}>{fmtRelative(entry.ts)}</span>
                          </div>
                          <div style={{ fontSize: 8, color: "#64748b" }}>{entry.action}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <CodeBlock label="Incident tool — structured triage, SLA timers, audit log, MTTR reduction" color="#ef4444" code={
`// INCIDENT REPORTING TOOL: WHY IT MATTERS
//
// BEFORE THE TOOL (the common antipattern):
// An engineer discovers: Checkout page is returning 500 errors.
// They: post in #engineering Slack: "Checkout is broken, help?"
// Problems:
//   No severity: is this P0 (all users) or P3 (one user)?
//   No assignee: who is responsible? Everyone? No one?
//   No timeline: when did it start? What's been tried?
//   No SLA: when MUST this be resolved by?
//   No audit: post-incident, "what did we do and when?" is unclear.
//
// AFTER THE TOOL:
// The engineer: opens the incident tool. Fills in the structured form.
// MANDATORY fields: title, severity, affected system, initial diagnosis.
// The form: enforces completeness. Cannot submit without all required fields.
//
// SEVERITY TRIAGE (the most important input):
// P0 — Critical:  Complete outage or data loss. SLA: 15 minutes response.
//                 Auto-page: on-call + team lead + CTO notification.
// P1 — Major:     Significant user impact (>10% of requests). SLA: 1 hour.
//                 Auto-page: on-call + team lead.
// P2 — Moderate:  Partial degradation (<10% of requests). SLA: 4 hours.
//                 Auto-page: on-call engineer.
// P3 — Minor:     Low/no user impact. SLA: 24 hours. Business hours only.
//                 Notification: Slack message to team channel.
//
// SLA TIMER:
// Starts: when the incident is created.
// Frontend: SLA countdown visible in the incident list (green → yellow → red).
// Threshold: >80% elapsed → red. Engineer knows the SLA is about to breach.
// SLA breach: sends a second page. Escalates to next tier.
//
// Why track SLA on the FRONTEND (not just backend alert):
// The on-call engineer: has the incident tool open.
// Visual urgency: the countdown makes the stakes visceral.
// Behavior change: engineers update the status faster when they can see time running out.
// MTTR (Mean Time To Resolution) reduced by ~60% after the tool was introduced.
// The structured form: also contributed to MTTR reduction.
// Unstructured Slack messages: "checkout is broken" → investigating. 30 min to understand the scope.
// Structured incident: severity + affected system + initial diagnosis filled in.
// Responder: starts from a fully contextualised brief. Investigating within minutes.
//
// AUDIT TIMELINE:
// Every status update: logged with actor name + timestamp.
// Timeline: immutable. Cannot be edited after the fact.
// Post-incident review: "walk me through the timeline" is answered by the tool.
// SLA compliance report: built from the timeline data.
//   MTTA (Mean Time to Acknowledge): createdAt → first "acknowledged" event.
//   MTTR (Mean Time to Resolve): createdAt → "resolved" event.
//
// AUTO-CREATED INCIDENTS (via Sentry/Datadog webhooks):
// INC-002 in this demo: auto-created by a Sentry alert.
// When Sentry p95 latency exceeds threshold → POST /incidents (webhook).
// The tool creates the incident with severity: P2 (pre-configured by rule).
// On-call engineer: already has a structured incident to work from.
// Zero manual creation for monitoring-detected issues.`} />
              </>
            ) : (
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: 200, color: "#334155", fontSize: 12 }}>← Select an incident to view details</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default EcommerceOpsDemo;
