/**
 * ShopeeFinanceDemo.tsx
 *
 * Four FinTech/Banking engineering achievements:
 *   1. Shopee Financial App         — RN/TypeScript/Zustand, multi-lang, hot updates
 *   2. Account Opening & Loan (PIC) — full lifecycle, KYC wizard, loan calculator, 3-member team
 *   3. Bank Website + Low-Code CMS  — Next.js ISR, Nest.js CMS, CDN acceleration
 *   4. Micro-Frontend Bank BMS      — React module federation, multi-team, independent deploy
 *
 * TABS
 *   📱 Shopee Finance    — architecture, language switcher, hot update simulation
 *   🏦 Account + Loan   — KYC onboarding wizard, loan calculator, PIC leadership
 *   🌐 Website + BMS    — ISR performance, live low-code CMS editor, micro-frontend diagram
 */

import React, { useState, useEffect, useRef, useCallback } from "react";

// ─────────────────────────────────────────────────────────────────
// i18n data
// ─────────────────────────────────────────────────────────────────

type Locale = "en" | "vi" | "th" | "id" | "zh";

const STRINGS: Record<Locale, { greeting: string; balance: string; send: string; topUp: string; history: string; settings: string; flag: string; name: string }> = {
  en: { greeting: "Good morning",   balance: "Total Balance", send: "Send Money",   topUp: "Top Up",       history: "Transaction History", settings: "Settings", flag: "🇬🇧", name: "English"    },
  vi: { greeting: "Chào buổi sáng", balance: "Số dư",         send: "Chuyển tiền",  topUp: "Nạp tiền",     history: "Lịch sử giao dịch",   settings: "Cài đặt",  flag: "🇻🇳", name: "Tiếng Việt" },
  th: { greeting: "สวัสดีตอนเช้า",       balance: "ยอดรวม",        send: "โอนเงิน",       topUp: "เติมเงิน",       history: "ประวัติรายการ",         settings: "การตั้งค่า",  flag: "🇹🇭", name: "ภาษาไทย"    },
  id: { greeting: "Selamat pagi",   balance: "Total Saldo",   send: "Kirim Uang",   topUp: "Isi Ulang",    history: "Riwayat Transaksi",   settings: "Pengaturan",flag: "🇮🇩", name: "Bahasa"     },
  zh: { greeting: "早上好",             balance: "总余额",           send: "转账",            topUp: "充值",            history: "交易记录",               settings: "设置",       flag: "🇨🇳", name: "中文"        },
};

const TRANSACTIONS = [
  { id: "t1", label: { en: "Shopee Mall Purchase",    vi: "Mua Shopee Mall",      th: "ซื้อ Shopee Mall",      id: "Pembelian Mall",   zh: "购物购买"    }, amount: -128500, type: "debit"  },
  { id: "t2", label: { en: "Transfer from A. Nguyen", vi: "Nhận từ A. Nguyễn",    th: "รับจาก A. Nguyễn",      id: "Dari A. Nguyen",   zh: "A. Nguyen转入" }, amount: 500000,  type: "credit" },
  { id: "t3", label: { en: "ShopeePay Top Up",        vi: "Nạp ShopeePay",        th: "เติม ShopeePay",        id: "Isi ShopeePay",    zh: "充值"         }, amount: 1000000, type: "credit" },
  { id: "t4", label: { en: "Utility Bill Payment",    vi: "Thanh toán hóa đơn",   th: "ชำระค่าบริการ",          id: "Bayar Tagihan",    zh: "缴纳水电费"   }, amount: -235000, type: "debit"  },
];

// ─────────────────────────────────────────────────────────────────
// Account Opening wizard
// ─────────────────────────────────────────────────────────────────

type KYCState = "personal" | "identity" | "processing" | "address" | "review" | "done";

const KYC_STEPS: { id: KYCState; label: string; icon: string }[] = [
  { id: "personal",   label: "Personal Info",     icon: "👤" },
  { id: "identity",   label: "Identity Verify",   icon: "🪪" },
  { id: "processing", label: "KYC Processing",    icon: "⚙" },
  { id: "address",    label: "Address & Work",    icon: "🏠" },
  { id: "review",     label: "Review",            icon: "📋" },
  { id: "done",       label: "Account Open",      icon: "✅" },
];

// ─────────────────────────────────────────────────────────────────
// CMS content blocks
// ─────────────────────────────────────────────────────────────────

interface CMSBlock {
  id: string; type: "hero" | "rate" | "promo";
  title: string; subtitle?: string; value?: string; cta?: string; badge?: string;
}

const INITIAL_CMS: CMSBlock[] = [
  { id: "hero",  type: "hero",  title: "Grow Your Wealth", subtitle: "Smart banking designed for your future.", cta: "Get Started" },
  { id: "rate",  type: "rate",  title: "Savings Rate",   value: "6.8% p.a.",   badge: "New" },
  { id: "promo", type: "promo", title: "Zero Fee Transfers", subtitle: "All transfers free this month.", badge: "Limited" },
];

// ─────────────────────────────────────────────────────────────────
// Micro-frontend modules
// ─────────────────────────────────────────────────────────────────

const BMS_MODULES = [
  { id: "accounts",     name: "Account Management",         team: "Core Banking",   tech: "React 18",    status: "v2.4.1", color: "#0ea5e9" },
  { id: "transactions", name: "Transaction Processing",     team: "Payments",       tech: "React 18",    status: "v1.9.0", color: "#22c55e" },
  { id: "reports",      name: "Reporting & Analytics",      team: "BI Team",        tech: "React 18",    status: "v3.1.0", color: "#a855f7" },
  { id: "users",        name: "User & Role Management",     team: "Identity",       tech: "React 18",    status: "v1.2.3", color: "#f59e0b" },
];

// ─────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────

function CodeBlock({ code, label, color = "#64748b" }: { code: string; label?: string; color?: string }) {
  return (
    <div style={{ background: "#0a0a14", borderRadius: 8, overflow: "hidden", border: "1px solid #1e293b" }}>
      {label && <div style={{ padding: "5px 12px", borderBottom: "1px solid #1e293b", fontSize: 10, color }}>{label}</div>}
      <pre style={{ margin: 0, padding: 12, fontSize: 9, fontFamily: "monospace", color: "#94a3b8", lineHeight: 1.7, overflow: "auto", maxHeight: 270 }}>{code}</pre>
    </div>
  );
}

function fmt(n: number, locale: Locale) {
  const abs = Math.abs(n);
  const suffix = locale === "vi" ? " đ" : locale === "th" ? " ฿" : locale === "id" ? " Rp" : locale === "zh" ? " ¥" : "$";
  const prefix = locale === "en" ? (n < 0 ? "-$" : "$") : (n < 0 ? "-" : "+");
  return `${n > 0 ? "+" : ""}${prefix === "+" && locale !== "en" ? "" : ""}${locale !== "en" ? "" : ""}${abs.toLocaleString()}${suffix}`;
}

// ─────────────────────────────────────────────────────────────────
// Main
// ─────────────────────────────────────────────────────────────────

export function ShopeeFinanceDemo() {
  const [activeTab, setActiveTab] = useState<"shopee" | "account" | "website">("shopee");

  // ── Shopee Finance state
  const [locale, setLocale]   = useState<Locale>("en");
  const [updating, setUpdating] = useState(false);
  const [updated, setUpdated]  = useState(false);
  const [updatePct, setUpdatePct] = useState(0);
  const updateRef = useRef(false);

  const simulateHotUpdate = useCallback(async () => {
    if (updateRef.current) return;
    updateRef.current = true;
    setUpdated(false); setUpdating(true); setUpdatePct(0);
    for (let i = 0; i <= 100; i += 8) {
      await new Promise(r => setTimeout(r, 80));
      setUpdatePct(Math.min(i, 100));
    }
    setUpdating(false); setUpdated(true);
    updateRef.current = false;
  }, []);

  const t = STRINGS[locale];

  // ── Account/Loan state
  const [kycStep, setKycStep]     = useState<KYCState>("personal");
  const [kycProcessing, setKycProcessing] = useState(false);
  const kycStepIdx = KYC_STEPS.findIndex(s => s.id === kycStep);

  const [loanAmount, setLoanAmount] = useState(50000000);
  const [loanTerm, setLoanTerm]     = useState(24);
  const rate = 0.009; // 0.9% per month
  const monthly = Math.round(loanAmount * rate * Math.pow(1 + rate, loanTerm) / (Math.pow(1 + rate, loanTerm) - 1));

  const nextKYCStep = async () => {
    if (kycStep === "identity") {
      setKycStep("processing"); setKycProcessing(true);
      await new Promise(r => setTimeout(r, 2200));
      setKycProcessing(false); setKycStep("address");
    } else {
      const order: KYCState[] = ["personal", "identity", "processing", "address", "review", "done"];
      const idx = order.indexOf(kycStep);
      if (idx < order.length - 1) setKycStep(order[idx + 1]);
    }
  };

  const [loanStatus, setLoanStatus] = useState<"idle" | "applied" | "reviewing" | "approved">("idle");
  const applyLoan = async () => {
    setLoanStatus("applied"); await new Promise(r => setTimeout(r, 1000));
    setLoanStatus("reviewing"); await new Promise(r => setTimeout(r, 1800));
    setLoanStatus("approved");
  };

  // ── CMS state
  const [cmsBlocks, setCmsBlocks] = useState<CMSBlock[]>(INITIAL_CMS);
  const [editing, setEditing]     = useState<string | null>(null);
  const [editVal, setEditVal]     = useState("");
  const [published, setPublished] = useState(false);
  const [revalidating, setRevalidating] = useState(false);

  const startEdit = (block: CMSBlock) => { setEditing(block.id); setEditVal(block.title); setPublished(false); };
  const saveEdit  = async () => {
    setCmsBlocks(prev => prev.map(b => b.id === editing ? { ...b, title: editVal } : b));
    setEditing(null); setRevalidating(true);
    await new Promise(r => setTimeout(r, 1400));
    setRevalidating(false); setPublished(true);
  };

  // ── BMS module state
  const [activeModule, setActiveModule] = useState<string | null>(null);
  const [loadingModule, setLoadingModule] = useState<string | null>(null);

  const loadModule = async (id: string) => {
    if (activeModule === id) { setActiveModule(null); return; }
    setLoadingModule(id);
    await new Promise(r => setTimeout(r, 600));
    setLoadingModule(null); setActiveModule(id);
  };

  const TABS = [
    { id: "shopee"  as const, label: "📱 Shopee Finance App"   },
    { id: "account" as const, label: "🏦 Account Opening & Loan" },
    { id: "website" as const, label: "🌐 Bank Website + BMS"    },
  ];

  return (
    <div style={{ background: "#0f172a", color: "#f1f5f9", fontFamily: "'Inter', system-ui, sans-serif", minHeight: "100vh", padding: 24 }}>
      {/* Header */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
          <div style={{ width: 36, height: 36, borderRadius: 8, background: "linear-gradient(135deg,#f59e0b,#ef4444)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>🏦</div>
          <div>
            <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800 }}>FinTech & Banking Engineering</h1>
            <p style={{ margin: 0, color: "#64748b", fontSize: 13 }}>Shopee Financial · Account Opening (PIC) · Bank Website ISR · Micro-Frontend BMS</p>
          </div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8 }}>
          {[
            { v: "5",       l: "Locales Supported",   c: "#f59e0b", sub: "EN/VI/TH/ID/ZH"          },
            { v: "3",       l: "Junior Members Led",  c: "#0ea5e9", sub: "Account & Loan PIC"        },
            { v: "<50ms",   l: "TTFB via ISR + CDN",  c: "#22c55e", sub: "vs ~350ms SSR"            },
            { v: "4",       l: "Independent BMS Teams",c: "#a855f7", sub: "Micro-frontend modules"   },
          ].map(m => (
            <div key={m.l} style={{ background: "#1e293b", border: `1px solid ${m.c}20`, borderRadius: 10, padding: "10px 12px" }}>
              <div style={{ fontSize: 22, fontWeight: 900, color: m.c }}>{m.v}</div>
              <div style={{ fontSize: 9, fontWeight: 700 }}>{m.l}</div>
              <div style={{ fontSize: 8, color: "#475569", marginTop: 2 }}>{m.sub}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 4, marginBottom: 20, borderBottom: "1px solid #1e293b", paddingBottom: 4 }}>
        {TABS.map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{ background: activeTab === tab.id ? "#1e293b" : "transparent", color: activeTab === tab.id ? "#f1f5f9" : "#64748b", border: activeTab === tab.id ? "1px solid #334155" : "1px solid transparent", borderRadius: "8px 8px 0 0", padding: "8px 20px", cursor: "pointer", fontSize: 13, fontWeight: 600 }}>{tab.label}</button>
        ))}
      </div>

      {/* ── SHOPEE FINANCE ── */}
      {activeTab === "shopee" && (
        <div style={{ display: "grid", gridTemplateColumns: "280px 1fr", gap: 14 }}>
          {/* Phone mock */}
          <div>
            <div style={{ fontSize: 10, fontWeight: 700, color: "#64748b", marginBottom: 8, letterSpacing: "0.08em" }}>SHOPEE FINANCIAL APP — LIVE DEMO</div>
            {/* Language selector */}
            <div style={{ display: "flex", gap: 4, marginBottom: 10, flexWrap: "wrap" }}>
              {(Object.keys(STRINGS) as Locale[]).map(l => (
                <button key={l} onClick={() => setLocale(l)} style={{ background: locale === l ? "#1e3a5f" : "#1e293b", border: `1px solid ${locale === l ? "#3b82f6" : "#334155"}`, borderRadius: 6, padding: "3px 8px", cursor: "pointer", color: locale === l ? "#60a5fa" : "#64748b", fontSize: 9 }}>
                  {STRINGS[l].flag} {STRINGS[l].name}
                </button>
              ))}
            </div>
            {/* Phone */}
            <div style={{ background: "#1e293b", border: "2px solid #334155", borderRadius: 24, padding: "20px 14px", transition: "all 0.3s" }}>
              {/* Status bar */}
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 8, color: "#475569", marginBottom: 14 }}>
                <span>9:41</span><span>●●●●  📶 🔋</span>
              </div>
              {/* Greeting */}
              <div style={{ fontSize: 9, color: "#64748b" }}>{t.greeting}, Trung 👋</div>
              <div style={{ fontSize: 11, fontWeight: 700, marginBottom: 10 }}>ShopeePay Wallet</div>
              {/* Balance card */}
              <div style={{ background: "linear-gradient(135deg, #f59e0b, #ef4444)", borderRadius: 14, padding: "14px", marginBottom: 12 }}>
                <div style={{ fontSize: 8, color: "rgba(255,255,255,0.7)", marginBottom: 3 }}>{t.balance}</div>
                <div style={{ fontSize: 22, fontWeight: 900, color: "#fff" }}>₫ 12,480,000</div>
                <div style={{ fontSize: 7, color: "rgba(255,255,255,0.6)", marginTop: 4 }}>Updated: just now</div>
              </div>
              {/* Quick actions */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6, marginBottom: 10 }}>
                {[{ l: t.send, i: "→" }, { l: t.topUp, i: "+" }].map(a => (
                  <div key={a.l} style={{ background: "#0f172a", borderRadius: 10, padding: "8px", textAlign: "center", cursor: "pointer" }}>
                    <div style={{ fontSize: 14, marginBottom: 2 }}>{a.i}</div>
                    <div style={{ fontSize: 8 }}>{a.l}</div>
                  </div>
                ))}
              </div>
              {/* Transactions */}
              <div style={{ fontSize: 8, fontWeight: 700, color: "#64748b", marginBottom: 6 }}>{t.history}</div>
              {TRANSACTIONS.map(tx => (
                <div key={tx.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 5, background: "#0f172a", borderRadius: 7, padding: "6px 8px" }}>
                  <div style={{ fontSize: 8, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flex: 1, marginRight: 6 }}>{(tx.label as Record<string, string>)[locale]}</div>
                  <div style={{ fontSize: 8, fontWeight: 700, color: tx.type === "credit" ? "#22c55e" : "#ef4444", flexShrink: 0 }}>
                    {tx.type === "credit" ? "+" : "−"}{Math.abs(tx.amount).toLocaleString()}
                  </div>
                </div>
              ))}
            </div>

            {/* Hot update */}
            <div style={{ marginTop: 10, background: "#1e293b", border: "1px solid #334155", borderRadius: 10, padding: 12 }}>
              <div style={{ fontSize: 9, fontWeight: 700, marginBottom: 6 }}>⚡ Hot Update (CodePush)</div>
              {!updating && !updated && (
                <div>
                  <div style={{ fontSize: 8, color: "#64748b", marginBottom: 8 }}>Push a JS bundle update without App Store review.</div>
                  <button onClick={simulateHotUpdate} style={{ background: "#f59e0b20", border: "1px solid #f59e0b40", borderRadius: 6, padding: "6px 14px", color: "#fbbf24", cursor: "pointer", fontSize: 9 }}>↑ Push Update v1.4.2</button>
                </div>
              )}
              {updating && (
                <div>
                  <div style={{ fontSize: 8, color: "#64748b", marginBottom: 4 }}>Downloading patch... {updatePct}%</div>
                  <div style={{ background: "#0f172a", borderRadius: 3, height: 8, overflow: "hidden" }}>
                    <div style={{ background: "linear-gradient(90deg, #f59e0b, #22c55e)", height: "100%", width: `${updatePct}%`, transition: "width 0.1s" }} />
                  </div>
                </div>
              )}
              {updated && <div style={{ fontSize: 8, color: "#22c55e" }}>✓ v1.4.2 applied on next launch. No App Store wait.</div>}
            </div>
          </div>

          {/* Architecture + code */}
          <div>
            <div style={{ fontSize: 10, fontWeight: 700, color: "#64748b", marginBottom: 8, letterSpacing: "0.08em" }}>ARCHITECTURE — ZUSTAND + REACT NATIVE</div>

            {/* Zustand store slices */}
            <div style={{ background: "#1e293b", border: "1px solid #334155", borderRadius: 10, padding: 14, marginBottom: 10 }}>
              <div style={{ fontSize: 9, color: "#64748b", marginBottom: 10 }}>Zustand store slices — why not Redux</div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 6 }}>
                {[
                  { name: "walletStore",     desc: "Balance, accounts, virtual cards", color: "#f59e0b" },
                  { name: "transactionStore", desc: "History, pagination, filters",     color: "#0ea5e9" },
                  { name: "userStore",        desc: "Profile, KYC status, preferences", color: "#22c55e" },
                  { name: "configStore",      desc: "Locale, feature flags, A/B tests", color: "#a855f7" },
                ].map(s => (
                  <div key={s.name} style={{ background: "#0f172a", border: `1px solid ${s.color}20`, borderRadius: 7, padding: 8 }}>
                    <div style={{ fontSize: 8, fontWeight: 700, color: s.color, fontFamily: "monospace" }}>{s.name}</div>
                    <div style={{ fontSize: 7, color: "#475569", marginTop: 2 }}>{s.desc}</div>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <CodeBlock label="Zustand — why over Redux for React Native" color="#f59e0b" code={
`// WHY ZUSTAND FOR A FINANCIAL APP:
// Redux: boilerplate-heavy (action → reducer → selector → connect).
// For a 3-developer team: Redux requires consensus on patterns.
// Zustand: hook-first, minimal API.

// walletStore.ts
import { create } from "zustand";
import { persist } from "zustand/middleware";

interface WalletState {
  balance: number;
  accounts: Account[];
  fetchBalance: () => Promise<void>;
  transfer: (to: string, amount: number) => Promise<void>;
}

export const useWalletStore = create<WalletState>()(
  persist(
    (set, get) => ({
      balance: 0,
      accounts: [],
      fetchBalance: async () => {
        const data = await walletAPI.getBalance();
        set({ balance: data.balance, accounts: data.accounts });
      },
      transfer: async (to, amount) => {
        // OPTIMISTIC UPDATE:
        set(s => ({ balance: s.balance - amount }));
        try {
          await walletAPI.transfer({ to, amount });
        } catch (err) {
          // ROLLBACK on failure:
          set(s => ({ balance: s.balance + amount }));
          throw err;
        }
      },
    }),
    // persist middleware: persists to AsyncStorage (offline access to last balance)
    { name: "wallet-store", storage: asyncStorageAdapter }
  )
);

// Usage in component (no Provider, no connect, no mapStateToProps):
function WalletScreen() {
  const { balance, fetchBalance } = useWalletStore();
  useEffect(() => { fetchBalance(); }, []);
  return <Text>{balance.toLocaleString()}</Text>;
}`} />

              <CodeBlock label="Multi-language + Hot Updates — implementation" color="#0ea5e9" code={
`// MULTI-LANGUAGE (react-i18next for React Native):
// 5 locales: en, vi, th, id, zh
// Challenge: don't load all locale files at startup (increases bundle size).

// i18n.ts — lazy loading locales:
i18next.use(initReactI18next).init({
  fallbackLng: "en",
  // Don't bundle all locales:
  resources: { en: { translation: enStrings } }, // only English at startup
  partialBundledLanguages: true,
});

// When user switches to Vietnamese:
const switchLocale = async (locale: "vi" | "th" | "id" | "zh") => {
  if (!i18next.hasResourceBundle(locale, "translation")) {
    // Fetch the locale file on demand:
    const strings = await import(\`./locales/\${locale}.json\`);
    i18next.addResourceBundle(locale, "translation", strings.default);
  }
  await i18next.changeLanguage(locale);
  // Persist preference:
  await AsyncStorage.setItem("locale", locale);
  // Format numbers/dates correctly for the locale:
  setNumberFormatter(new Intl.NumberFormat(locale));
};

// HOT UPDATES (CodePush / EAS Update):
// Problem: App Store review takes 1-7 days.
// A critical bug in the transfer flow: users can't send money.
// Without hot updates: fix takes 1-7 days to reach users.
// With hot updates: patch deployed in HOURS.

// How it works:
// 1. Build: JavaScript bundle compiled (not native code).
// 2. Push: new bundle uploaded to CodePush CDN.
// 3. Check: app checks for updates on launch (or background).
// 4. Download: new bundle downloaded (delta, not full bundle).
// 5. Apply: on next launch — new JS, same native container.
// 6. Rollback: if crash rate spikes → one command to rollback.
//
// LIMITATION: hot updates only apply to JavaScript code.
//             Native code changes (new permissions, native modules): need App Store.`} />
            </div>

            <div style={{ marginTop: 10 }}>
              <CodeBlock label="Complex data operations — pagination, caching, offline" color="#22c55e" code={
`// COMPLEX DATA OPERATIONS for a financial app:

// 1. CURSOR-BASED PAGINATION for transaction history:
// Offset pagination: "get rows 1000-1020" → slow at high offsets.
// Cursor pagination: "get 20 rows after transaction_id:txn_abc123"
// The cursor points directly to the position. O(log n) via index.

const transactionStore = create((set, get) => ({
  transactions: [] as Transaction[],
  cursor: null as string | null,
  hasMore: true,
  loadMore: async () => {
    const { cursor, transactions } = get();
    const data = await api.getTransactions({ after: cursor, limit: 20 });
    set({
      transactions: [...transactions, ...data.items],
      cursor: data.nextCursor,
      hasMore: data.hasMore,
    });
  },
}));

// 2. DATA NORMALIZATION (entities stored once, referenced by ID):
// Avoid: the same user object duplicated in 50 transactions.
// Use: { users: { "u1": UserObject }, transactions: { "t1": { userId: "u1", ... } } }
// Update user profile once → all transaction displays update.
// Memory: significantly lower. No stale data.

// 3. BACKGROUND SYNC (offline-first for financial trust):
// Financial app users must trust their balance even when offline.
// persist middleware: last known balance in AsyncStorage.
// NetInfo: detect connectivity.
// When offline: show cached balance with "Last updated: X ago" indicator.
// When back online: silently sync, update, clear indicator.
// If sync fails: show a discrete banner "Sync issue – tap to retry".
// Never: show an error that makes users think money is lost.`} />
            </div>
          </div>
        </div>
      )}

      {/* ── ACCOUNT + LOAN ── */}
      {activeTab === "account" && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
          {/* KYC Wizard */}
          <div>
            <div style={{ fontSize: 10, fontWeight: 700, color: "#64748b", marginBottom: 8, letterSpacing: "0.08em" }}>
              ACCOUNT OPENING — KYC WIZARD (PIC ownership: scratch → launch)
            </div>
            {/* Step progress */}
            <div style={{ background: "#1e293b", border: "1px solid #334155", borderRadius: 10, padding: 14, marginBottom: 10 }}>
              <div style={{ display: "flex", gap: 4, marginBottom: 14 }}>
                {KYC_STEPS.map((s, i) => {
                  const done = i < kycStepIdx;
                  const active = s.id === kycStep;
                  return (
                    <div key={s.id} style={{ flex: 1, textAlign: "center" }}>
                      <div style={{ width: 24, height: 24, borderRadius: "50%", margin: "0 auto 3px", background: done ? "#22c55e" : active ? "#0066ff" : "#1e293b", border: `2px solid ${done ? "#22c55e" : active ? "#0066ff" : "#334155"}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10 }}>
                        {done ? "✓" : s.icon}
                      </div>
                      <div style={{ fontSize: 6, color: done ? "#22c55e" : active ? "#60a5fa" : "#475569", lineHeight: 1.2 }}>{s.label}</div>
                    </div>
                  );
                })}
              </div>

              {/* Step content */}
              {kycStep === "personal" && (
                <div>
                  <div style={{ fontSize: 10, fontWeight: 700, marginBottom: 8 }}>👤 Personal Information</div>
                  {[{ l: "Full Name", p: "Nguyen Van A" }, { l: "Date of Birth", p: "DD/MM/YYYY" }, { l: "Phone Number", p: "+84 912 345 678" }].map(f => (
                    <div key={f.l} style={{ marginBottom: 6 }}>
                      <div style={{ fontSize: 8, color: "#64748b", marginBottom: 2 }}>{f.l}</div>
                      <input readOnly placeholder={f.p} style={{ width: "100%", background: "#0f172a", border: "1px solid #334155", borderRadius: 6, padding: "6px 10px", color: "#94a3b8", fontSize: 10, boxSizing: "border-box" }} />
                    </div>
                  ))}
                </div>
              )}
              {kycStep === "identity" && (
                <div>
                  <div style={{ fontSize: 10, fontWeight: 700, marginBottom: 8 }}>🪪 Identity Verification</div>
                  <div style={{ background: "#0f172a", border: "2px dashed #334155", borderRadius: 8, padding: 16, textAlign: "center", marginBottom: 8 }}>
                    <div style={{ fontSize: 24, marginBottom: 4 }}>📷</div>
                    <div style={{ fontSize: 8, color: "#64748b" }}>Upload CMND/CCCD front</div>
                    <div style={{ fontSize: 7, color: "#475569" }}>JPG, PNG · max 5MB</div>
                  </div>
                  <div style={{ background: "#0f172a", border: "2px dashed #334155", borderRadius: 8, padding: 14, textAlign: "center" }}>
                    <div style={{ fontSize: 24, marginBottom: 4 }}>🤳</div>
                    <div style={{ fontSize: 8, color: "#64748b" }}>Selfie for liveness check</div>
                  </div>
                </div>
              )}
              {kycStep === "processing" && (
                <div style={{ textAlign: "center", padding: "16px 0" }}>
                  <div style={{ fontSize: 28, marginBottom: 8 }}>{kycProcessing ? "⚙" : "✅"}</div>
                  <div style={{ fontSize: 10, fontWeight: 700, marginBottom: 4 }}>{kycProcessing ? "Running AI KYC check..." : "Identity Verified!"}</div>
                  <div style={{ fontSize: 8, color: "#64748b" }}>{kycProcessing ? "Document validation · Liveness detection · Fraud check" : "Proceeding to address details."}</div>
                </div>
              )}
              {kycStep === "address" && (
                <div>
                  <div style={{ fontSize: 10, fontWeight: 700, marginBottom: 8 }}>🏠 Address & Employment</div>
                  {[{ l: "Residential Address" }, { l: "City / Province" }, { l: "Employer Name" }, { l: "Monthly Income (VND)" }].map(f => (
                    <div key={f.l} style={{ marginBottom: 5 }}>
                      <div style={{ fontSize: 8, color: "#64748b", marginBottom: 2 }}>{f.l}</div>
                      <input readOnly style={{ width: "100%", background: "#0f172a", border: "1px solid #334155", borderRadius: 6, padding: "5px 10px", color: "#94a3b8", fontSize: 10, boxSizing: "border-box" }} />
                    </div>
                  ))}
                </div>
              )}
              {kycStep === "review" && (
                <div>
                  <div style={{ fontSize: 10, fontWeight: 700, marginBottom: 8 }}>📋 Review Application</div>
                  {[{ l: "Name", v: "Nguyen Van A" }, { l: "DOB", v: "01/01/1995" }, { l: "Phone", v: "+84 912 345 678" }, { l: "KYC", v: "✓ Verified" }, { l: "Address", v: "123 Nguyễn Huệ, Q1, HCM" }].map(r => (
                    <div key={r.l} style={{ display: "flex", justifyContent: "space-between", marginBottom: 5, fontSize: 9 }}>
                      <span style={{ color: "#64748b" }}>{r.l}</span>
                      <span style={{ color: r.v.startsWith("✓") ? "#22c55e" : "#f1f5f9" }}>{r.v}</span>
                    </div>
                  ))}
                </div>
              )}
              {kycStep === "done" && (
                <div style={{ textAlign: "center", padding: "14px 0" }}>
                  <div style={{ fontSize: 36, marginBottom: 8 }}>🎉</div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: "#22c55e", marginBottom: 4 }}>Account Successfully Opened!</div>
                  <div style={{ fontSize: 8, color: "#64748b" }}>Your digital account is active. Virtual card issued.</div>
                  <div style={{ fontSize: 8, color: "#64748b", marginTop: 4 }}>Account No: ****4892 · ShopeePay linked</div>
                </div>
              )}

              <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
                {kycStep !== "personal" && kycStep !== "done" && kycStep !== "processing" && (
                  <button onClick={() => { const o: KYCState[] = ["personal","identity","processing","address","review","done"]; setKycStep(o[o.indexOf(kycStep)-1]); }} style={{ background: "transparent", border: "1px solid #334155", borderRadius: 7, padding: "7px 14px", color: "#64748b", cursor: "pointer", fontSize: 10 }}>← Back</button>
                )}
                {kycStep !== "done" && (
                  <button onClick={nextKYCStep} disabled={kycProcessing} style={{ flex: 1, background: kycProcessing ? "#334155" : "#0066ff", border: "none", borderRadius: 7, padding: "7px", color: kycProcessing ? "#475569" : "#fff", cursor: kycProcessing ? "not-allowed" : "pointer", fontSize: 10, fontWeight: 700 }}>
                    {kycProcessing ? "Verifying..." : kycStep === "review" ? "Submit Application" : "Next →"}
                  </button>
                )}
                {kycStep === "done" && (
                  <button onClick={() => setKycStep("personal")} style={{ flex: 1, background: "#22c55e20", border: "1px solid #22c55e40", borderRadius: 7, padding: "7px", color: "#4ade80", cursor: "pointer", fontSize: 10 }}>↺ Restart Demo</button>
                )}
              </div>
            </div>
          </div>

          {/* Loan module + PIC code */}
          <div>
            <div style={{ fontSize: 10, fontWeight: 700, color: "#64748b", marginBottom: 8, letterSpacing: "0.08em" }}>LOAN MODULE + PIC LEADERSHIP</div>

            {/* Loan calculator */}
            <div style={{ background: "#1e293b", border: "1px solid #334155", borderRadius: 10, padding: 14, marginBottom: 10 }}>
              <div style={{ fontSize: 9, fontWeight: 700, marginBottom: 10 }}>🏦 Loan Calculator</div>
              <div style={{ marginBottom: 8 }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 8, marginBottom: 3 }}>
                  <span style={{ color: "#64748b" }}>Loan Amount</span>
                  <span style={{ color: "#f59e0b", fontWeight: 700 }}>{loanAmount.toLocaleString()} VND</span>
                </div>
                <input type="range" min={5000000} max={200000000} step={5000000} value={loanAmount} onChange={e => setLoanAmount(+e.target.value)} style={{ width: "100%", accentColor: "#f59e0b" }} />
              </div>
              <div style={{ marginBottom: 10 }}>
                <div style={{ fontSize: 8, color: "#64748b", marginBottom: 4 }}>Loan Term</div>
                <div style={{ display: "flex", gap: 5 }}>
                  {[12, 24, 36, 48, 60].map(t => (
                    <button key={t} onClick={() => setLoanTerm(t)} style={{ flex: 1, background: loanTerm === t ? "#1e3a5f" : "#0f172a", border: `1px solid ${loanTerm === t ? "#3b82f6" : "#334155"}`, borderRadius: 5, padding: "3px", color: loanTerm === t ? "#60a5fa" : "#64748b", cursor: "pointer", fontSize: 8 }}>{t}m</button>
                  ))}
                </div>
              </div>
              <div style={{ background: "#0f172a", borderRadius: 8, padding: 12 }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 6, textAlign: "center" }}>
                  <div><div style={{ fontSize: 7, color: "#475569" }}>Monthly</div><div style={{ fontSize: 11, fontWeight: 800, color: "#22c55e" }}>{monthly.toLocaleString()}</div><div style={{ fontSize: 7, color: "#475569" }}>VND</div></div>
                  <div><div style={{ fontSize: 7, color: "#475569" }}>Interest</div><div style={{ fontSize: 11, fontWeight: 800, color: "#f59e0b" }}>10.8%</div><div style={{ fontSize: 7, color: "#475569" }}>p.a.</div></div>
                  <div><div style={{ fontSize: 7, color: "#475569" }}>Total Cost</div><div style={{ fontSize: 11, fontWeight: 800, color: "#0ea5e9" }}>{(monthly * loanTerm).toLocaleString()}</div><div style={{ fontSize: 7, color: "#475569" }}>VND</div></div>
                </div>
              </div>

              {/* Loan status */}
              <div style={{ marginTop: 10 }}>
                <div style={{ display: "flex", gap: 6, alignItems: "center", marginBottom: 6 }}>
                  {["applied", "reviewing", "approved"].map((s, i) => (
                    <React.Fragment key={s}>
                      <div style={{ textAlign: "center" }}>
                        <div style={{ width: 18, height: 18, borderRadius: "50%", background: ["applied","reviewing","approved"].indexOf(loanStatus as string) >= i ? "#22c55e" : "#334155", border: "2px solid #1e293b", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 8, margin: "0 auto 2px", transition: "background 0.4s" }}>{["applied","reviewing","approved"].indexOf(loanStatus as string) >= i ? "✓" : i + 1}</div>
                        <div style={{ fontSize: 6, color: "#475569", textTransform: "capitalize" }}>{s}</div>
                      </div>
                      {i < 2 && <div style={{ flex: 1, height: 2, background: ["applied","reviewing","approved"].indexOf(loanStatus as string) > i ? "#22c55e" : "#334155", borderRadius: 1, transition: "background 0.4s" }} />}
                    </React.Fragment>
                  ))}
                </div>
                <button onClick={applyLoan} disabled={loanStatus !== "idle" && loanStatus !== "approved"} style={{ width: "100%", background: loanStatus === "approved" ? "#22c55e" : loanStatus === "idle" ? "#0066ff" : "#334155", border: "none", borderRadius: 7, padding: "8px", color: loanStatus === "approved" || loanStatus === "idle" ? "#fff" : "#475569", cursor: loanStatus === "idle" ? "pointer" : "default", fontSize: 10, fontWeight: 700, marginTop: 4 }}>
                  {loanStatus === "idle" ? "Apply for Loan" : loanStatus === "applied" ? "Processing..." : loanStatus === "reviewing" ? "Under Review..." : "✓ Loan Approved!"}
                </button>
              </div>
            </div>

            <CodeBlock label="PIC: technical design + leading 3 junior members" color="#0ea5e9" code={
`// PIC = Person In Charge. Accountable for technical design, delivery, and the team.
// Not the manager. The technical owner.

// WHAT "FROM SCRATCH TO LAUNCH" MEANS:
// Month 0: No code. No API contracts. No design.
// Month 3: Both modules in production. Serving real customers.

// TECHNICAL DESIGN DECISIONS (PIC's job):
// 1. ONBOARDING STATE MACHINE:
//    const FLOW: Record<KYCState, KYCState[]> = {
//      personal:   ["identity"],
//      identity:   ["processing"],
//      processing: ["address"],   // async: KYC check triggers this transition
//      address:    ["review"],
//      review:     ["submitted"],
//      submitted:  ["approved", "rejected"],  // outcome depends on credit check
//    };
//    Why state machine: onboarding has conditional transitions.
//    If KYC fails: go to "kyc_failed", not "address".
//    If user quits: persist current state. Resume from the same step.
//    A simple boolean can't represent this. State machine can.

// 2. API CONTRACT DESIGN (before any backend code):
//    Defined: POST /accounts/start → returns session_id, initial_state
//             PUT  /accounts/:id/personal → validates, returns next_state
//             POST /accounts/:id/kyc     → async, returns webhook URL
//    Frontend team builds UI against mock API (MSW).
//    Backend team implements the real endpoints in parallel.
//    Integration: done in a single day. No "wait for backend" blocking.

// 3. LEADING 3 JUNIOR MEMBERS:
//    Week 1: architecture walkthrough. State machine explained. API contracts reviewed.
//    Assignment:
//      Junior A: Step 1 Personal Info + Step 2 Identity upload UI
//      Junior B: Step 3 Address + Step 4 Employment + Review UI
//      Junior C: Loan Calculator + Loan Application status tracker
//    I own: state machine logic, API integration, routing, form validation library
//
//    DAILY SYNC (15 minutes):
//      "What did you ship yesterday?" / "What are you building today?" / "What's blocking you?"
//    BLOCKING: if blocked > 2 hours without progress → escalate immediately.
//    CODE REVIEW: not just "approve" or "request changes" — explain why.
//    "The useEffect here fires on every render because deps array is missing transactionId.
//    Add transactionId to the deps array. Here's why: [link to React docs]"
//    Goal: after 3 months, juniors are unblocked on the same class of problem.`} />
          </div>
        </div>
      )}

      {/* ── BANK WEBSITE + BMS ── */}
      {activeTab === "website" && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
          {/* Website + CMS */}
          <div>
            <div style={{ fontSize: 10, fontWeight: 700, color: "#64748b", marginBottom: 8, letterSpacing: "0.08em" }}>
              BANK WEBSITE — Next.js ISR + Low-Code CMS
            </div>

            {/* Performance comparison */}
            <div style={{ background: "#1e293b", border: "1px solid #334155", borderRadius: 10, padding: 14, marginBottom: 10 }}>
              <div style={{ fontSize: 9, color: "#64748b", marginBottom: 8 }}>Time to First Byte (TTFB) — rendering strategy comparison</div>
              {[
                { label: "CSR (React SPA)",   ttfb: 18,  note: "Fast HTML, JS loads content", color: "#f59e0b", bad: false },
                { label: "SSR (per request)", ttfb: 340, note: "Server renders on every request", color: "#ef4444", bad: true },
                { label: "ISR + CDN (ours)",  ttfb: 42,  note: "Static HTML served from CDN edge", color: "#22c55e", bad: false },
              ].map(r => (
                <div key={r.label} style={{ marginBottom: 8 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 8, marginBottom: 2 }}>
                    <span style={{ color: "#94a3b8" }}>{r.label}</span>
                    <span style={{ color: r.color, fontWeight: 700 }}>{r.ttfb}ms</span>
                  </div>
                  <div style={{ background: "#0f172a", borderRadius: 3, height: 10, overflow: "hidden", position: "relative" }}>
                    <div style={{ background: r.color, height: "100%", width: `${(r.ttfb / 340) * 100}%`, borderRadius: 3 }} />
                  </div>
                  <div style={{ fontSize: 7, color: "#475569", marginTop: 1 }}>{r.note}</div>
                </div>
              ))}
              <div style={{ fontSize: 7, color: "#475569", marginTop: 4 }}>ISR pages cached at CDN edge. Revalidated on content publish. Users always get fresh static HTML.</div>
            </div>

            {/* Low-code CMS */}
            <div style={{ background: "#1e293b", border: "1px solid #334155", borderRadius: 10, padding: 14, marginBottom: 10 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                <div style={{ fontSize: 9, fontWeight: 700 }}>🖊 Low-Code CMS — click to edit</div>
                {revalidating && <div style={{ fontSize: 8, color: "#0ea5e9" }}>⟳ ISR revalidating...</div>}
                {published && !revalidating && <div style={{ fontSize: 8, color: "#22c55e" }}>✓ Published & CDN updated</div>}
              </div>
              <div style={{ fontSize: 7, color: "#64748b", marginBottom: 8 }}>Marketing team edits content without developer involvement. Triggers ISR revalidation automatically.</div>
              {cmsBlocks.map(block => (
                <div key={block.id} style={{ background: "#0f172a", border: `1px solid ${editing === block.id ? "#3b82f6" : "#1e293b"}`, borderRadius: 8, padding: 10, marginBottom: 6 }}>
                  {editing === block.id ? (
                    <div style={{ display: "flex", gap: 6 }}>
                      <input value={editVal} onChange={e => setEditVal(e.target.value)} style={{ flex: 1, background: "#1e293b", border: "1px solid #3b82f6", borderRadius: 5, padding: "4px 8px", color: "#f1f5f9", fontSize: 10 }} />
                      <button onClick={saveEdit} style={{ background: "#22c55e20", border: "1px solid #22c55e40", borderRadius: 5, padding: "4px 10px", color: "#4ade80", cursor: "pointer", fontSize: 8 }}>Publish</button>
                      <button onClick={() => setEditing(null)} style={{ background: "transparent", border: "1px solid #334155", borderRadius: 5, padding: "4px 8px", color: "#64748b", cursor: "pointer", fontSize: 8 }}>✕</button>
                    </div>
                  ) : (
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <div>
                        <div style={{ fontSize: 9, fontWeight: 700 }}>{block.title}</div>
                        {block.subtitle && <div style={{ fontSize: 7, color: "#64748b" }}>{block.subtitle}</div>}
                        {block.value && <div style={{ fontSize: 11, color: "#22c55e", fontWeight: 800 }}>{block.value}</div>}
                        {block.badge && <span style={{ fontSize: 7, background: "#f59e0b20", color: "#fbbf24", borderRadius: 3, padding: "0 4px" }}>{block.badge}</span>}
                      </div>
                      <button onClick={() => startEdit(block)} style={{ background: "#1e293b", border: "1px solid #334155", borderRadius: 5, padding: "4px 8px", color: "#64748b", cursor: "pointer", fontSize: 8 }}>✏ Edit</button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* BMS micro-frontend */}
          <div>
            <div style={{ fontSize: 10, fontWeight: 700, color: "#64748b", marginBottom: 8, letterSpacing: "0.08em" }}>
              MICRO-FRONTEND BANK MANAGEMENT SYSTEM
            </div>

            {/* Shell + modules */}
            <div style={{ background: "#1e293b", border: "1px solid #334155", borderRadius: 10, padding: 14, marginBottom: 10 }}>
              <div style={{ background: "#0066ff15", border: "1px solid #0066ff30", borderRadius: 8, padding: "8px 12px", marginBottom: 8 }}>
                <div style={{ fontSize: 9, fontWeight: 700, color: "#60a5fa" }}>🔵 Shell Application (Host)</div>
                <div style={{ fontSize: 7, color: "#475569" }}>Handles: routing, auth, global nav, shared context. Does not own business logic.</div>
              </div>
              <div style={{ fontSize: 7, color: "#64748b", marginBottom: 8 }}>Click a module to load it dynamically (Module Federation):</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
                {BMS_MODULES.map(m => (
                  <div key={m.id} onClick={() => loadModule(m.id)} style={{ background: activeModule === m.id ? m.color + "15" : "#0f172a", border: `1px solid ${activeModule === m.id ? m.color + "50" : "#1e293b"}`, borderRadius: 8, padding: 10, cursor: "pointer", transition: "all 0.2s" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
                      <div style={{ fontSize: 8, fontWeight: 700, color: activeModule === m.id ? m.color : "#94a3b8" }}>{m.name}</div>
                      {loadingModule === m.id && <div style={{ fontSize: 7, color: "#64748b" }}>↓</div>}
                      {activeModule === m.id && <div style={{ fontSize: 7, color: m.color }}>● live</div>}
                    </div>
                    <div style={{ fontSize: 7, color: "#475569" }}>{m.team}</div>
                    <div style={{ display: "flex", justifyContent: "space-between", marginTop: 3 }}>
                      <span style={{ fontSize: 6, color: "#334155" }}>{m.tech}</span>
                      <span style={{ fontSize: 6, color: m.color }}>{m.status}</span>
                    </div>
                  </div>
                ))}
              </div>

              {activeModule && (
                <div style={{ marginTop: 10, background: "#0f172a", border: `1px solid ${BMS_MODULES.find(m => m.id === activeModule)!.color}30`, borderRadius: 8, padding: 10 }}>
                  <div style={{ fontSize: 9, fontWeight: 700, color: BMS_MODULES.find(m => m.id === activeModule)!.color, marginBottom: 4 }}>
                    {BMS_MODULES.find(m => m.id === activeModule)!.name} — Loaded
                  </div>
                  {activeModule === "accounts" && (
                    <div style={{ fontSize: 8, color: "#64748b" }}>
                      3 accounts loaded · Total: ₫ 4.2B · Filters: active / frozen / closed · Bulk actions: freeze, close, export
                    </div>
                  )}
                  {activeModule === "transactions" && (
                    <div style={{ fontSize: 8, color: "#64748b" }}>
                      842 transactions today · Pending: 12 · Volume: ₫ 1.8B · Real-time updates via WebSocket
                    </div>
                  )}
                  {activeModule === "reports" && (
                    <div style={{ fontSize: 8, color: "#64748b" }}>
                      Daily P&amp;L: +12.4% · Monthly Growth: +8.2% · Active Users: 24,891 · Export: PDF, Excel
                    </div>
                  )}
                  {activeModule === "users" && (
                    <div style={{ fontSize: 8, color: "#64748b" }}>
                      48 staff users · 6 roles configured · Last audit: 2 hours ago · 3 pending role changes
                    </div>
                  )}
                </div>
              )}
            </div>

            <CodeBlock label="ISR + low-code platform + micro-frontend — key technical details" color="#22c55e" code={
`// NEXT.JS ISR — HOW IT WORKS:
// export const getStaticProps = async () => ({
//   props: { content: await cmsAPI.getContent() },
//   revalidate: 60,  // rebuild this page if requested after 60 seconds
// });
//
// First visit: Next.js builds static HTML. CDN caches it.
// Subsequent visits: CDN serves cached HTML (TTFB < 50ms).
// After 60 seconds: FIRST visitor triggers a background rebuild.
//   Rebuild in background (user sees old page, no delay).
//   SECOND visitor: gets fresh page.
//
// CDN (CloudFront / Vercel Edge):
//   Cache-Control: s-maxage=60, stale-while-revalidate
//   Edge nodes: SG, HK, TW, AU, JP — serves from nearest.
//   Latency: user in Vietnam → Singapore edge (~12ms) vs origin (~80ms).

// NEST.JS LOW-CODE CMS:
// Why Nest.js: strongly-typed services, dependency injection,
//              built-in validation (class-validator), OpenAPI auto-docs.
//
// Marketing publishes a content update:
// 1. POST /cms/blocks/:id { title: "New Savings Rate", value: "7.2% p.a." }
// 2. CMS validates: schema validation, authorization, audit log written.
// 3. CMS calls Next.js revalidation endpoint:
//    fetch(\`\${NEXTJS_URL}/api/revalidate?secret=...\`, { method: "POST" })
// 4. Next.js rebuilds the page. CDN cache invalidated.
// 5. Next visitor: gets updated content. No deployment. No developer. < 2 minutes.
//
// Marketing team: "We changed the savings rate. It's already live."
// Developer: zero involvement after the CMS was built.

// MICRO-FRONTEND (Module Federation):
// webpack.config.js (each remote):
// new ModuleFederationPlugin({
//   name: "accountModule",
//   filename: "remoteEntry.js",
//   exposes: { "./AccountDashboard": "./src/AccountDashboard" },
// });
//
// Shell loads modules dynamically:
// const AccountDashboard = React.lazy(() => import("accountModule/AccountDashboard"));
//
// KEY BENEFITS in a bank:
// INDEPENDENT DEPLOY: Core Banking team deploys AccountModule every 2 weeks.
//   Payments team deploys TransactionModule weekly (more frequent features).
//   No coordinated releases. No version lock.
// TEAM AUTONOMY: each team owns their module end-to-end.
// TECHNOLOGY ISOLATION: if one module has a React 18 experimental feature crash:
//   only that module is affected. Shell and other modules continue working.`} />
          </div>
        </div>
      )}
    </div>
  );
}

export default ShopeeFinanceDemo;
