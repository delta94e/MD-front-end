/**
 * FrameIOAdobeDemo.tsx
 *
 * Front-End Engineer — Frame.io (Adobe)
 * i18n "Go Global" | Zero-Click Auth | Premiere Pro + After Effects Panels
 *
 * TABS
 *   🌐 Go Global i18n     — Locale switcher, react-intl, plural rules, date/number formatting
 *   🔐 Zero-Click Auth    — IMS token exchange state machine, edge cases, UX before/after
 *   🎬 Panel Preview      — Realistic Frame.io panel mock inside Adobe host UI
 *   ⚙️  Tech Stack         — Apollo/GraphQL, Context, CircleCI i18n lint, Storybook locale stories
 */

import React, { useState, useEffect, useCallback } from "react";

// ─────────────────────────────────────────────────────────────────
// Adobe / Frame.io design tokens — Adobe dark UI
// ─────────────────────────────────────────────────────────────────
const A = {
  bg:        "#1a1a1a",
  panel:     "#252525",
  panel2:    "#2d2d2d",
  panel3:    "#383838",
  border:    "#3d3d3d",
  blue:      "#1473E6",
  blueLight: "#4D9BFF",
  red:       "#EA3829",
  green:     "#2D9D78",
  yellow:    "#E68619",
  purple:    "#7E4CF7",
  text:      "#E0E0E0",
  textDim:   "#ABABAB",
  textMuted: "#6E6E6E",
  textBright:"#FFFFFF",
  mono:      "'JetBrains Mono', 'Fira Code', monospace",
};

// ─────────────────────────────────────────────────────────────────
// i18n message catalogue (6 locales)
// ─────────────────────────────────────────────────────────────────

type Locale = "en-US" | "ja-JP" | "de-DE" | "fr-FR" | "pt-BR" | "ko-KR";

interface Messages {
  appName:         string;
  uploadBtn:       string;
  newVersion:      string;
  projects:        string;
  recent:          string;
  shared:          string;
  comments:        string;
  commentCount:    (n: number) => string;
  reviewLink:      string;
  addComment:      string;
  version:         string;
  approved:        string;
  needsChanges:    string;
  dateFormat:      (d: Date) => string;
  bytesLabel:      (n: number) => string;
  signOut:         string;
}

const MESSAGES: Record<Locale, Messages> = {
  "en-US": {
    appName:      "Frame.io",
    uploadBtn:    "Upload to Frame.io",
    newVersion:   "New Version",
    projects:     "Projects",
    recent:       "Recent",
    shared:       "Shared with me",
    comments:     "Comments",
    commentCount: n => `${n} ${n === 1 ? "comment" : "comments"}`,
    reviewLink:   "Share review link",
    addComment:   "Add a comment…",
    version:      "Version",
    approved:     "Approved",
    needsChanges: "Needs changes",
    dateFormat:   d => d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
    bytesLabel:   n => `${(n / 1e6).toFixed(1)} MB`,
    signOut:      "Sign out",
  },
  "ja-JP": {
    appName:      "Frame.io",
    uploadBtn:    "Frame.ioにアップロード",
    newVersion:   "新しいバージョン",
    projects:     "プロジェクト",
    recent:       "最近",
    shared:       "共有中",
    comments:     "コメント",
    commentCount: n => `${n}件のコメント`,
    reviewLink:   "レビューリンクを共有",
    addComment:   "コメントを追加…",
    version:      "バージョン",
    approved:     "承認済み",
    needsChanges: "修正が必要",
    dateFormat:   d => d.toLocaleDateString("ja-JP", { year: "numeric", month: "long", day: "numeric" }),
    bytesLabel:   n => `${(n / 1e6).toFixed(1)} MB`,
    signOut:      "サインアウト",
  },
  "de-DE": {
    appName:      "Frame.io",
    uploadBtn:    "Zu Frame.io hochladen",
    newVersion:   "Neue Version",
    projects:     "Projekte",
    recent:       "Zuletzt verwendet",
    shared:       "Mit mir geteilt",
    comments:     "Kommentare",
    commentCount: n => `${n} ${n === 1 ? "Kommentar" : "Kommentare"}`,
    reviewLink:   "Review-Link teilen",
    addComment:   "Kommentar hinzufügen…",
    version:      "Version",
    approved:     "Genehmigt",
    needsChanges: "Änderungen erforderlich",
    dateFormat:   d => d.toLocaleDateString("de-DE", { day: "numeric", month: "long", year: "numeric" }),
    bytesLabel:   n => `${(n / 1e6).toFixed(1).replace(".", ",")} MB`,
    signOut:      "Abmelden",
  },
  "fr-FR": {
    appName:      "Frame.io",
    uploadBtn:    "Téléverser vers Frame.io",
    newVersion:   "Nouvelle version",
    projects:     "Projets",
    recent:       "Récents",
    shared:       "Partagés avec moi",
    comments:     "Commentaires",
    commentCount: n => `${n} commentaire${n !== 1 ? "s" : ""}`,
    reviewLink:   "Partager le lien de révision",
    addComment:   "Ajouter un commentaire…",
    version:      "Version",
    approved:     "Approuvé",
    needsChanges: "Modifications requises",
    dateFormat:   d => d.toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" }),
    bytesLabel:   n => `${(n / 1e6).toFixed(1).replace(".", ",")} Mo`,
    signOut:      "Se déconnecter",
  },
  "pt-BR": {
    appName:      "Frame.io",
    uploadBtn:    "Enviar para o Frame.io",
    newVersion:   "Nova versão",
    projects:     "Projetos",
    recent:       "Recentes",
    shared:       "Compartilhado comigo",
    comments:     "Comentários",
    commentCount: n => `${n} comentário${n !== 1 ? "s" : ""}`,
    reviewLink:   "Compartilhar link de revisão",
    addComment:   "Adicionar comentário…",
    version:      "Versão",
    approved:     "Aprovado",
    needsChanges: "Precisa de alterações",
    dateFormat:   d => d.toLocaleDateString("pt-BR", { day: "numeric", month: "long", year: "numeric" }),
    bytesLabel:   n => `${(n / 1e6).toFixed(1).replace(".", ",")} MB`,
    signOut:      "Sair",
  },
  "ko-KR": {
    appName:      "Frame.io",
    uploadBtn:    "Frame.io에 업로드",
    newVersion:   "새 버전",
    projects:     "프로젝트",
    recent:       "최근",
    shared:       "공유됨",
    comments:     "댓글",
    commentCount: n => `댓글 ${n}개`,
    reviewLink:   "검토 링크 공유",
    addComment:   "댓글 추가…",
    version:      "버전",
    approved:     "승인됨",
    needsChanges: "변경 필요",
    dateFormat:   d => d.toLocaleDateString("ko-KR", { year: "numeric", month: "long", day: "numeric" }),
    bytesLabel:   n => `${(n / 1e6).toFixed(1)} MB`,
    signOut:      "로그아웃",
  },
};

type AuthStatus = "loading" | "authenticated" | "needs_link" | "link_success" | "error";

// ─────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────

function CodeSnip({ code, label, color = A.blue }: { code: string; label?: string; color?: string }) {
  return (
    <div style={{ background: "#111111", border: `1px solid ${A.border}`, borderRadius: 6, overflow: "hidden" }}>
      {label && <div style={{ padding: "4px 12px", borderBottom: `1px solid ${A.border}`, fontSize: 9, color, fontFamily: A.mono }}>{label}</div>}
      <pre style={{ margin: 0, padding: 12, fontSize: 8.5, fontFamily: A.mono, color: "#8d9db0", lineHeight: 1.7, overflow: "auto", maxHeight: 340, whiteSpace: "pre-wrap" }}>{code}</pre>
    </div>
  );
}

function LocaleBadge({ locale, selected, onClick }: { locale: Locale; selected: boolean; onClick: () => void }) {
  const flags: Record<Locale, string> = {
    "en-US": "🇺🇸", "ja-JP": "🇯🇵", "de-DE": "🇩🇪",
    "fr-FR": "🇫🇷", "pt-BR": "🇧🇷", "ko-KR": "🇰🇷",
  };
  return (
    <button onClick={onClick} style={{ background: selected ? `${A.blue}25` : "transparent", color: selected ? A.blueLight : A.textMuted, border: `1px solid ${selected ? A.blue : A.border}`, borderRadius: 5, padding: "4px 10px", cursor: "pointer", fontSize: 9, fontWeight: selected ? 700 : 400 }}>
      {flags[locale]} {locale}
    </button>
  );
}

// ─────────────────────────────────────────────────────────────────
// Panel mock — realistic Adobe dark UI
// ─────────────────────────────────────────────────────────────────

function PanelMock({ locale, auth }: { locale: Locale; auth: AuthStatus }) {
  const t = MESSAGES[locale];
  const now = new Date("2024-06-18");
  const [activeTab, setActiveTab] = useState<"projects" | "comments">("projects");
  const [commentText, setCommentText] = useState("");

  const PROJECTS = [
    { name: "Brand Refresh 2024", count: 3, size: 2.4e8, date: new Date("2024-06-15"), status: "approved" as const },
    { name: "Product Launch v3",  count: 7, size: 8.1e8, date: new Date("2024-06-12"), status: "needs_changes" as const },
    { name: "Social Content Q2",  count: 1, size: 4.5e7, date: new Date("2024-06-10"), status: "approved" as const },
  ];

  const COMMENTS = [
    { user: "Maya Chen", time: "2:34 PM", text: "Colour grade looks great in the first act. Can we try something warmer in the final shot?", tc: "01:24:18;12" },
    { user: "Alex Kim",  time: "2:41 PM", text: "Agreed. Also check the audio sync at 00:58 — slightly off.", tc: "00:58:02;04" },
    { user: "You",       time: "2:55 PM", text: "On it — will have a new version up by EOD.", tc: null },
  ];

  if (auth === "loading") {
    return (
      <div style={{ background: A.panel, border: `1px solid ${A.border}`, borderRadius: 8, height: 360, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 10 }}>
        <div style={{ width: 32, height: 32, borderRadius: "50%", border: `3px solid ${A.border}`, borderTopColor: A.blue, animation: "spin 1s linear infinite" }} />
        <div style={{ fontSize: 10, color: A.textMuted }}>Authenticating with Adobe IMS…</div>
      </div>
    );
  }

  if (auth === "needs_link") {
    return (
      <div style={{ background: A.panel, border: `1px solid ${A.border}`, borderRadius: 8, height: 360, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 12, padding: 20 }}>
        <div style={{ fontSize: 32 }}>🔗</div>
        <div style={{ fontSize: 12, fontWeight: 700, color: A.textBright, textAlign: "center" }}>Link your Frame.io account</div>
        <div style={{ fontSize: 9, color: A.textMuted, textAlign: "center", lineHeight: 1.6, maxWidth: 220 }}>Your Adobe account was detected, but no linked Frame.io account was found. Sign in to connect them.</div>
        <button style={{ background: A.blue, border: "none", borderRadius: 5, padding: "8px 20px", color: "#fff", fontSize: 10, cursor: "pointer", fontWeight: 600 }}>Sign in to Frame.io</button>
        <div style={{ fontSize: 8, color: A.textMuted }}>Once linked, this panel will open automatically.</div>
      </div>
    );
  }

  return (
    <div style={{ background: A.panel, border: `1px solid ${A.border}`, borderRadius: 8, overflow: "hidden", height: 360, display: "flex", flexDirection: "column" }}>
      {/* Panel header */}
      <div style={{ background: A.panel2, borderBottom: `1px solid ${A.border}`, padding: "6px 10px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <div style={{ width: 16, height: 16, borderRadius: 3, background: A.blue, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 9, color: "#fff", fontWeight: 900 }}>F</div>
          <span style={{ fontSize: 10, fontWeight: 700, color: A.textBright }}>{t.appName}</span>
        </div>
        <div style={{ display: "flex", gap: 6 }}>
          <button style={{ fontSize: 8, background: A.blue, border: "none", borderRadius: 4, padding: "3px 8px", color: "#fff", cursor: "pointer" }}>{t.uploadBtn.split(" ")[0]}</button>
          <button style={{ fontSize: 8, background: A.panel3, border: `1px solid ${A.border}`, borderRadius: 4, padding: "3px 8px", color: A.textDim, cursor: "pointer" }}>⋯</button>
        </div>
      </div>

      {/* Tab bar */}
      <div style={{ display: "flex", borderBottom: `1px solid ${A.border}`, background: A.panel }}>
        {[{ id: "projects" as const, label: t.projects }, { id: "comments" as const, label: t.comments }].map(tb => (
          <button key={tb.id} onClick={() => setActiveTab(tb.id)} style={{ flex: 1, background: "transparent", border: "none", borderBottom: `2px solid ${activeTab === tb.id ? A.blue : "transparent"}`, padding: "7px 0", color: activeTab === tb.id ? A.blueLight : A.textMuted, fontSize: 9, cursor: "pointer", fontWeight: activeTab === tb.id ? 700 : 400 }}>{tb.label}</button>
        ))}
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflow: "auto" }}>
        {activeTab === "projects" && (
          <div>
            <div style={{ padding: "5px 8px", fontSize: 8, color: A.textMuted, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em" }}>{t.recent}</div>
            {PROJECTS.map((p, i) => (
              <div key={i} style={{ padding: "7px 10px", borderBottom: `1px solid ${A.border}20`, cursor: "pointer" }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
                  <span style={{ fontSize: 9, fontWeight: 600, color: A.text }}>{p.name}</span>
                  <span style={{ fontSize: 7, color: p.status === "approved" ? A.green : A.yellow, fontWeight: 700 }}>{p.status === "approved" ? t.approved : t.needsChanges}</span>
                </div>
                <div style={{ display: "flex", gap: 8, fontSize: 8, color: A.textMuted }}>
                  <span>{t.commentCount(p.count)}</span>
                  <span>{t.bytesLabel(p.size)}</span>
                  <span>{t.dateFormat(p.date)}</span>
                </div>
              </div>
            ))}
          </div>
        )}
        {activeTab === "comments" && (
          <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
            <div style={{ flex: 1 }}>
              {COMMENTS.map((c, i) => (
                <div key={i} style={{ padding: "8px 10px", borderBottom: `1px solid ${A.border}20` }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
                    <span style={{ fontSize: 8, fontWeight: 700, color: i === 2 ? A.blueLight : A.textBright }}>{c.user}</span>
                    <div style={{ display: "flex", gap: 5 }}>
                      {c.tc && <span style={{ fontSize: 7, fontFamily: A.mono, color: A.yellow }}>{c.tc}</span>}
                      <span style={{ fontSize: 7, color: A.textMuted }}>{c.time}</span>
                    </div>
                  </div>
                  <div style={{ fontSize: 8, color: A.textDim, lineHeight: 1.5 }}>{c.text}</div>
                </div>
              ))}
            </div>
            <div style={{ padding: "6px 10px", borderTop: `1px solid ${A.border}`, background: A.panel2 }}>
              <input value={commentText} onChange={e => setCommentText(e.target.value)} placeholder={t.addComment} style={{ width: "100%", background: A.panel3, border: `1px solid ${A.border}`, borderRadius: 4, padding: "5px 8px", color: A.text, fontSize: 9, boxSizing: "border-box" }} />
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div style={{ background: A.panel2, borderTop: `1px solid ${A.border}`, padding: "5px 10px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ fontSize: 8, color: A.textMuted }}>maya.chen@studio.com</span>
        <button style={{ fontSize: 8, background: "transparent", border: "none", color: A.textMuted, cursor: "pointer" }}>{t.signOut}</button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
// Main component
// ─────────────────────────────────────────────────────────────────

export function FrameIOAdobeDemo() {
  const [tab, setTab] = useState<"i18n" | "auth" | "panel" | "tech">("i18n");
  const [locale, setLocale] = useState<Locale>("en-US");
  const [authStatus, setAuthStatus] = useState<AuthStatus>("authenticated");
  const [authSimStep, setAuthSimStep] = useState(-1);
  const [strExpand, setStrExpand] = useState(false);

  const LOCALES: Locale[] = ["en-US", "ja-JP", "de-DE", "fr-FR", "pt-BR", "ko-KR"];
  const t = MESSAGES[locale];
  const now = new Date("2024-06-18");

  const simulateAuth = (scenario: AuthStatus) => {
    setAuthStatus("loading");
    setAuthSimStep(0);
    const steps = [
      () => setAuthSimStep(1),
      () => setAuthSimStep(2),
      () => { setAuthSimStep(3); setAuthStatus(scenario); },
    ];
    steps.forEach((fn, i) => setTimeout(fn, (i + 1) * 800));
  };

  const AUTH_STEPS = [
    { label: "Panel mounted → check CEP environment",          icon: "📋" },
    { label: "Call Adobe IMS → acquire access token",          icon: "🔑" },
    { label: "Exchange IMS token → Frame.io auth service",     icon: "🔄" },
    { label: "Panel authenticated → load user content",        icon: "✅" },
  ];

  const EXPANSION_STRINGS: Record<"en-US" | "de-DE" | "ja-JP", { text: string; width: number }> = {
    "en-US": { text: t.uploadBtn, width: 60 },
    "de-DE": { text: MESSAGES["de-DE"].uploadBtn, width: 85 },
    "ja-JP": { text: MESSAGES["ja-JP"].uploadBtn, width: 70 },
  };

  const TABS = [
    { id: "i18n"  as const, label: "🌐 Go Global i18n"   },
    { id: "auth"  as const, label: "🔐 Zero-Click Auth"   },
    { id: "panel" as const, label: "🎬 Panel Preview"      },
    { id: "tech"  as const, label: "⚙️  Tech Stack"         },
  ];

  return (
    <div style={{ background: A.bg, color: A.text, fontFamily: "'Inter', system-ui, sans-serif", minHeight: "100vh", padding: 24 }}>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

      {/* Header */}
      <div style={{ marginBottom: 18 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
          <div style={{ width: 42, height: 42, borderRadius: 10, background: `linear-gradient(135deg, ${A.blue}, ${A.purple})`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22 }}>🎬</div>
          <div>
            <h1 style={{ margin: 0, fontSize: 20, fontWeight: 900, color: A.textBright, letterSpacing: "-0.02em" }}>Frame.io — Premiere Pro & After Effects Integration</h1>
            <p style={{ margin: 0, fontSize: 11, color: A.textMuted }}>i18n "Go Global" · Zero-Click Auth · React · Next.js · Apollo/GraphQL · react-intl · TypeScript · CircleCI</p>
          </div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8 }}>
          {[
            { v: "Go Global",     l: "i18n initiative",         c: A.blue,   sub: "6 locales · react-intl · CI lint · string expansion" },
            { v: "Zero-click",    l: "Authentication UX",        c: A.green,  sub: "Adobe IMS → Frame.io token exchange · no user action" },
            { v: "CEP Panel",     l: "Host app integration",     c: A.yellow, sub: "Runs inside Premiere Pro & After Effects"             },
            { v: "Apollo GQL",   l: "Data layer",               c: A.purple, sub: "GraphQL · subscriptions · normalised cache"           },
          ].map(m => (
            <div key={m.l} style={{ background: A.panel, border: `1px solid ${A.border}`, borderLeft: `3px solid ${m.c}`, borderRadius: 8, padding: "8px 12px" }}>
              <div style={{ fontSize: 13, fontWeight: 900, color: m.c }}>{m.v}</div>
              <div style={{ fontSize: 8, fontWeight: 700, color: A.textBright }}>{m.l}</div>
              <div style={{ fontSize: 7, color: A.textMuted, marginTop: 2 }}>{m.sub}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Tab bar */}
      <div style={{ display: "flex", gap: 4, marginBottom: 18, borderBottom: `1px solid ${A.border}`, paddingBottom: 4 }}>
        {TABS.map(tb => (
          <button key={tb.id} onClick={() => setTab(tb.id)} style={{ background: tab === tb.id ? A.panel2 : "transparent", color: tab === tb.id ? A.textBright : A.textMuted, border: tab === tb.id ? `1px solid ${A.border}` : "1px solid transparent", borderRadius: "8px 8px 0 0", padding: "8px 20px", cursor: "pointer", fontSize: 11, fontWeight: 600 }}>{tb.label}</button>
        ))}
      </div>

      {/* ── GO GLOBAL i18n ── */}
      {tab === "i18n" && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
          <div>
            <div style={{ fontSize: 10, fontWeight: 700, color: A.textMuted, marginBottom: 8, letterSpacing: "0.08em" }}>INTERNATIONALIZATION — "GO GLOBAL" INITIATIVE</div>

            {/* Locale switcher */}
            <div style={{ background: A.panel, border: `1px solid ${A.border}`, borderRadius: 10, padding: 12, marginBottom: 12 }}>
              <div style={{ fontSize: 9, fontWeight: 700, color: A.textMuted, marginBottom: 7 }}>LOCALE SWITCHER — switch to see the panel adapt</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 5, marginBottom: 10 }}>
                {LOCALES.map(l => <LocaleBadge key={l} locale={l} selected={locale === l} onClick={() => setLocale(l)} />)}
              </div>

              {/* Live i18n preview */}
              <div style={{ background: A.panel2, borderRadius: 8, padding: 10 }}>
                <div style={{ fontSize: 8, fontWeight: 700, color: A.textMuted, marginBottom: 6 }}>LIVE PREVIEW — {locale}</div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 5 }}>
                  {[
                    { label: "Upload button",   val: t.uploadBtn       },
                    { label: "Projects",         val: t.projects        },
                    { label: "Comment (1)",      val: t.commentCount(1) },
                    { label: "Comment (12)",     val: t.commentCount(12)},
                    { label: "Date",             val: t.dateFormat(now) },
                    { label: "File size",        val: t.bytesLabel(4.5e8) },
                    { label: "Approved",         val: t.approved        },
                    { label: "Needs changes",    val: t.needsChanges    },
                  ].map(r => (
                    <div key={r.label} style={{ padding: "5px 8px", background: A.panel3, borderRadius: 5 }}>
                      <div style={{ fontSize: 7, color: A.textMuted, marginBottom: 1 }}>{r.label}</div>
                      <div style={{ fontSize: 9, color: A.textBright, fontWeight: 600 }}>{r.val}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* String expansion */}
            <div style={{ background: A.panel, border: `1px solid ${A.border}`, borderRadius: 10, padding: 12, marginBottom: 12 }}>
              <div style={{ fontSize: 9, fontWeight: 700, color: A.textMuted, marginBottom: 6 }}>STRING EXPANSION — German is 30-40% longer than English</div>
              <div style={{ fontSize: 8, color: A.textMuted, marginBottom: 8, lineHeight: 1.5 }}>English UI strings expand significantly in other languages. Buttons and labels that work in English must accommodate longer text without breaking the layout.</div>
              {(Object.entries(EXPANSION_STRINGS) as [string, { text: string; width: number }][]).map(([loc, { text, width }]) => (
                <div key={loc} style={{ marginBottom: 6 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
                    <span style={{ fontSize: 8, color: A.textMuted }}>{loc}</span>
                    <span style={{ fontSize: 8, color: loc === "de-DE" ? A.yellow : A.textMuted }}>{width}% relative</span>
                  </div>
                  <div style={{ background: A.panel2, borderRadius: 4, height: 26, overflow: "hidden", display: "flex", alignItems: "center" }}>
                    <div style={{ background: loc === "en-US" ? `${A.blue}30` : loc === "de-DE" ? `${A.yellow}30` : `${A.green}20`, border: `1px solid ${loc === "en-US" ? A.blue : loc === "de-DE" ? A.yellow : A.green}40`, borderRadius: 4, padding: "3px 8px", fontSize: 8, color: loc === "en-US" ? A.blueLight : loc === "de-DE" ? A.yellow : A.green, width: `${width}%`, boxSizing: "border-box", whiteSpace: "nowrap", overflow: "hidden" }}>
                      {text}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Plural rules */}
            <div style={{ background: A.panel, border: `1px solid ${A.border}`, borderRadius: 10, padding: 12 }}>
              <div style={{ fontSize: 9, fontWeight: 700, color: A.textMuted, marginBottom: 6 }}>PLURAL RULES — "1 comment" vs "2 comments"</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 5 }}>
                {[1, 2, 5, 12].map(n => (
                  <div key={n} style={{ background: A.panel2, borderRadius: 6, padding: "6px 8px", textAlign: "center" }}>
                    <div style={{ fontSize: 14, fontWeight: 900, color: A.blue }}>{n}</div>
                    <div style={{ fontSize: 8, color: A.textBright, marginTop: 3, lineHeight: 1.3 }}>{t.commentCount(n)}</div>
                  </div>
                ))}
              </div>
              <div style={{ marginTop: 6, fontSize: 8, color: A.textMuted, lineHeight: 1.5 }}>
                react-intl ICU syntax: <code style={{ fontFamily: A.mono, color: A.textDim, background: A.panel3, padding: "1px 4px", borderRadius: 3 }}>{'{count, plural, one {# comment} other {# comments}}'}</code>
              </div>
            </div>
          </div>

          <div>
            <div style={{ fontSize: 10, fontWeight: 700, color: A.textMuted, marginBottom: 8, letterSpacing: "0.08em" }}>IMPLEMENTATION DEPTH</div>
            <CodeSnip color={A.blue} label="react-intl 'Go Global' — full i18n implementation for Adobe panels" code={
`// THE "GO GLOBAL" INITIATIVE — what it meant technically:
//
// Frame.io's integrations into Premiere Pro and After Effects:
// Initially English-only. "Go Global" = open to 6 new regions:
// Japan, Germany, France, Brazil, Korea, + existing English markets.
//
// WHY i18n FOR AN ADOBE PANEL IS DIFFERENT:
// The panel runs inside Adobe's host application.
// Host application has its own locale (user's Premiere Pro is set to Japanese).
// The panel locale should MATCH the host application locale.
// Not the user's browser locale — the host app locale.
//
// DETECTING HOST APP LOCALE (CEP context):
// const hostLocale = window.__adobe_cep__
//   ? JSON.parse(window.cep.utils.getSystemLocale())  // Adobe's locale setting
//   : navigator.language;                              // fallback for dev mode
//
// REACT-INTL SETUP:
// import { IntlProvider, useIntl, FormattedMessage, FormattedDate } from 'react-intl';
//
// function App({ hostLocale }: { hostLocale: string }) {
//   const [messages, setMessages] = useState<Record<string, string>>({});
//
//   useEffect(() => {
//     // Lazy-load the locale's message bundle
//     import(\`../i18n/\${hostLocale}.json\`)
//       .then(m => setMessages(m.default))
//       .catch(() => import('../i18n/en-US.json').then(m => setMessages(m.default)));
//     // Graceful fallback: if ja-JP.json missing → use en-US
//   }, [hostLocale]);
//
//   return (
//     <IntlProvider locale={hostLocale} messages={messages} defaultLocale="en-US">
//       <PanelApp />
//     </IntlProvider>
//   );
// }
//
// USING MESSAGES IN COMPONENTS:
// import { FormattedMessage, FormattedDate, FormattedNumber } from 'react-intl';
//
// // Text:
// <FormattedMessage id="upload.button" defaultMessage="Upload to Frame.io" />
//
// // Plurals (ICU syntax):
// <FormattedMessage
//   id="comments.count"
//   defaultMessage="{count, plural, one {# comment} other {# comments}}"
//   values={{ count: commentCount }}
// />
//
// // Dates:
// <FormattedDate value={createdAt} month="long" day="numeric" year="numeric" />
// // Renders: "June 18, 2024" (en-US), "2024年6月18日" (ja-JP), "18. Juni 2024" (de-DE)
//
// // Numbers (bytes, file sizes):
// <FormattedNumber value={fileSizeBytes} style="decimal" />
// // "1,234.56" (en-US) vs "1.234,56" (de-DE) — comma/period swap, automatic
//
// MESSAGE EXTRACTION + CI ENFORCEMENT:
// // package.json script:
// "i18n:extract": "formatjs extract 'src/**/*.tsx' --out-file src/i18n/en-US.json"
//
// // .eslintrc.js — FORBID hardcoded user-visible strings:
// "formatjs/no-literal-string-in-jsx": "error"
//
// // This ESLint rule prevents: <button>Upload</button>
// // And requires:              <button><FormattedMessage id="upload.button" /></button>
//
// // CircleCI job — i18n lint:
// - run:
//     name: "i18n: Extract messages"
//     command: npm run i18n:extract
// - run:
//     name: "i18n: Verify no missing keys"
//     command: node scripts/check-i18n-coverage.js
//     # Checks: every key in en-US.json exists in ALL locale files.
//     # If translator hasn't translated a key: CI fails. No untranslated strings in production.
//
// STRING EXPANSION — the layout work:
// German: +30-40% longer. "Upload to Frame.io" → "Zu Frame.io hochladen"
// Our panels: fixed width (determined by Adobe's panel container).
// Solution: flex layout for buttons. Text wraps gracefully.
// Never fixed pixel widths for text containers.
// Storybook story: every button/label story renders in all 6 locales.
// Visual diff in CI (Chromatic): catches layout breaks from string expansion automatically.
//
// NEW REGIONS OPENED:
// Japan (ja-JP), Germany (de-DE), France (fr-FR),
// Brazil/Portuguese (pt-BR), Korea (ko-KR) — 5 new major markets.
// Frame.io penetration in video production markets in those regions:
// Previously 0 (English-only). After Go Global: accessible to local-language users.`} />
          </div>
        </div>
      )}

      {/* ── ZERO-CLICK AUTH ── */}
      {tab === "auth" && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
          <div>
            <div style={{ fontSize: 10, fontWeight: 700, color: A.textMuted, marginBottom: 8, letterSpacing: "0.08em" }}>ZERO-CLICK AUTHENTICATION</div>

            {/* Before/after */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 12 }}>
              {[
                { label: "BEFORE", steps: ["Open Frame.io panel", "See login screen", "Click 'Sign in'", "Browser opens", "Complete OAuth", "Copy token / return to app"], time: "~45 seconds", color: A.red },
                { label: "AFTER",  steps: ["Open Frame.io panel", "Panel loads directly ✓"], time: "~2 seconds", color: A.green },
              ].map(c => (
                <div key={c.label} style={{ background: A.panel, border: `1px solid ${c.color}30`, borderRadius: 8, padding: 10 }}>
                  <div style={{ fontSize: 9, fontWeight: 700, color: c.color, marginBottom: 6 }}>{c.label}</div>
                  {c.steps.map((s, i) => <div key={i} style={{ fontSize: 8, color: i === c.steps.length - 1 && c.label === "AFTER" ? c.color : A.textMuted, lineHeight: 1.7 }}>{i + 1}. {s}</div>)}
                  <div style={{ marginTop: 6, padding: "3px 6px", background: `${c.color}15`, borderRadius: 4, fontSize: 8, color: c.color, fontWeight: 700 }}>⏱ {c.time}</div>
                </div>
              ))}
            </div>

            {/* Auth simulation */}
            <div style={{ background: A.panel, border: `1px solid ${A.border}`, borderRadius: 10, padding: 12, marginBottom: 12 }}>
              <div style={{ fontSize: 9, fontWeight: 700, color: A.textMuted, marginBottom: 6 }}>SIMULATE AUTHENTICATION SCENARIOS</div>
              <div style={{ display: "flex", gap: 5, marginBottom: 10 }}>
                <button onClick={() => simulateAuth("authenticated")} style={{ fontSize: 9, background: `${A.green}15`, color: A.green, border: `1px solid ${A.green}40`, borderRadius: 5, padding: "5px 12px", cursor: "pointer" }}>✓ Linked account</button>
                <button onClick={() => simulateAuth("needs_link")} style={{ fontSize: 9, background: `${A.yellow}15`, color: A.yellow, border: `1px solid ${A.yellow}40`, borderRadius: 5, padding: "5px 12px", cursor: "pointer" }}>⚠ No linked account</button>
                <button onClick={() => simulateAuth("error")} style={{ fontSize: 9, background: `${A.red}15`, color: A.red, border: `1px solid ${A.red}40`, borderRadius: 5, padding: "5px 12px", cursor: "pointer" }}>✗ IMS error</button>
              </div>

              {/* Step indicator */}
              {AUTH_STEPS.map((step, i) => (
                <div key={i} style={{ display: "flex", gap: 8, alignItems: "center", padding: "5px 0", opacity: authSimStep >= i ? 1 : 0.3 }}>
                  <div style={{ width: 20, height: 20, borderRadius: "50%", background: authSimStep > i ? `${A.green}20` : authSimStep === i ? `${A.blue}20` : A.panel2, border: `1.5px solid ${authSimStep > i ? A.green : authSimStep === i ? A.blue : A.border}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, flexShrink: 0 }}>{step.icon}</div>
                  <span style={{ fontSize: 8.5, color: authSimStep > i ? A.green : authSimStep === i ? A.blueLight : A.textMuted }}>{step.label}</span>
                  {authSimStep === i && <div style={{ width: 10, height: 10, borderRadius: "50%", border: `2px solid ${A.border}`, borderTopColor: A.blue, animation: "spin 1s linear infinite", flexShrink: 0 }} />}
                  {authSimStep > i && <span style={{ fontSize: 9, color: A.green }}>✓</span>}
                </div>
              ))}

              {authStatus !== "loading" && authSimStep >= 0 && (
                <div style={{ marginTop: 8, padding: "6px 10px", background: `${authStatus === "authenticated" ? A.green : authStatus === "needs_link" ? A.yellow : A.red}15`, border: `1px solid ${authStatus === "authenticated" ? A.green : authStatus === "needs_link" ? A.yellow : A.red}40`, borderRadius: 6, fontSize: 8, color: A.textBright }}>
                  {authStatus === "authenticated" && "✓ Zero-click auth success — panel loaded with user content"}
                  {authStatus === "needs_link"    && "⚠ Adobe account found but no linked Frame.io account — show link prompt"}
                  {authStatus === "error"         && "✗ IMS token acquisition failed — fallback to manual sign-in"}
                </div>
              )}
            </div>
          </div>

          <div>
            <div style={{ fontSize: 10, fontWeight: 700, color: A.textMuted, marginBottom: 8, letterSpacing: "0.08em" }}>IMPLEMENTATION DEPTH</div>
            <CodeSnip color={A.green} label="Zero-click auth — IMS token exchange, state machine, edge cases" code={
`// ZERO-CLICK AUTHENTICATION — TECHNICAL IMPLEMENTATION:
//
// CONTEXT: Frame.io was acquired by Adobe in 2021.
// Adobe's identity system: Adobe IMS (Identity Management Service).
// All Creative Cloud users: have an Adobe IMS account.
// Frame.io: needed to accept Adobe IMS tokens.
//
// THE FLOW:
// 1. Panel mounts inside Premiere Pro / After Effects (CEP environment)
// 2. Panel silently calls Adobe IMS API to get current user's access token
// 3. Sends IMS access token to Frame.io auth service
// 4. Frame.io verifies the IMS token, finds the linked account, issues session
// 5. Panel receives Frame.io session token → loads user's projects
// 0 user interactions required.
//
// STEP 2: GETTING THE IMS TOKEN (CEP JavaScript API):
// import { adobeIMS } from "@adobe/imslib";
//
// const getIMSToken = async (): Promise<string | null> => {
//   // adobeIMS is available inside CEP panels — injected by the host app
//   if (!adobeIMS.isSignedInUser()) return null;
//   const tokenInfo = await adobeIMS.getAccessToken();
//   if (!tokenInfo) return null;
//   return tokenInfo.token;
// };
//
// STEP 3: EXCHANGE WITH FRAME.IO:
// const exchangeIMSToken = async (imsToken: string): Promise<FrameIOSession> => {
//   const response = await fetch('https://api.frame.io/v2/auth/adobe-ims', {
//     method: 'POST',
//     headers: { 'Content-Type': 'application/json' },
//     body: JSON.stringify({ ims_token: imsToken }),
//   });
//   if (!response.ok) {
//     const err = await response.json();
//     throw new AuthError(err.code, err.message);
//     // err.code: "ACCOUNT_NOT_LINKED" | "IMS_INVALID" | "ACCOUNT_SUSPENDED"
//   }
//   return response.json();  // { access_token, user, expires_in }
// };
//
// REACT HOOK — useZeroClickAuth:
//
// type AuthState =
//   | { status: "loading"       }
//   | { status: "authenticated"; user: User; token: string }
//   | { status: "needs_link"    }  // IMS OK but no Frame.io account linked
//   | { status: "error";         message: string };
//
// function useZeroClickAuth(): AuthState {
//   const [state, setState] = useState<AuthState>({ status: "loading" });
//
//   useEffect(() => {
//     async function attempt() {
//       try {
//         const imsToken = await getIMSToken();
//         if (!imsToken) {
//           setState({ status: "needs_link" }); // user not signed into CC
//           return;
//         }
//         const session = await exchangeIMSToken(imsToken);
//         setState({ status: "authenticated", user: session.user, token: session.access_token });
//       } catch (err) {
//         if (err instanceof AuthError && err.code === "ACCOUNT_NOT_LINKED") {
//           setState({ status: "needs_link" });
//         } else {
//           setState({ status: "error", message: err.message });
//         }
//       }
//     }
//     attempt();
//   }, []);
//
//   return state;
// }
//
// USAGE IN THE PANEL ROOT:
// function PanelRoot() {
//   const auth = useZeroClickAuth();
//
//   if (auth.status === "loading")       return <LoadingSpinner />;
//   if (auth.status === "needs_link")    return <LinkAccountPrompt />;
//   if (auth.status === "error")         return <ErrorState message={auth.message} />;
//   return <AuthenticatedPanel user={auth.user} token={auth.token} />;
// }
//
// EDGE CASES:
// 1. IMS token expired:
//    adobeIMS.refreshToken() → retry exchange silently. User never sees a flash.
//
// 2. Frame.io session expired (while panel is open):
//    Apollo Client: configure custom error link. On 401 → call refreshSession() → retry.
//    User: never sees logout. "Panel just keeps working."
//
// 3. Account not linked (most common non-happy-path):
//    "needs_link" state: show a prompt.
//    "Once you sign in and link your Frame.io account here, the panel will
//     open automatically every time — you'll never see this screen again."
//    After linking: token stored securely → next open = zero-click.
//
// 4. User switches Adobe accounts (e.g. personal vs work):
//    Host app fires a "user changed" event. Panel listens: re-run auth flow.
//    New IMS token → may map to different Frame.io account. Handle gracefully.
//
// IMPACT:
// Before: every new Premiere Pro session → user manually signs in.
//         ~45 seconds. Breaks creative flow. Users reported this as a major pain point.
// After:  panel opens and is already authenticated.
//         ~2 seconds. No user action. Creative flow uninterrupted.`} />
          </div>
        </div>
      )}

      {/* ── PANEL PREVIEW ── */}
      {tab === "panel" && (
        <div style={{ display: "grid", gridTemplateColumns: "360px 1fr", gap: 14 }}>
          <div>
            <div style={{ fontSize: 10, fontWeight: 700, color: A.textMuted, marginBottom: 8, letterSpacing: "0.08em" }}>FRAME.IO PANEL — INSIDE ADOBE</div>
            <div style={{ display: "flex", gap: 5, marginBottom: 8 }}>
              {LOCALES.map(l => <LocaleBadge key={l} locale={l} selected={locale === l} onClick={() => setLocale(l)} />)}
            </div>
            <div style={{ display: "flex", gap: 5, marginBottom: 10 }}>
              <button onClick={() => setAuthStatus("authenticated")} style={{ fontSize: 9, background: authStatus === "authenticated" ? `${A.green}20` : "transparent", color: authStatus === "authenticated" ? A.green : A.textMuted, border: `1px solid ${authStatus === "authenticated" ? A.green : A.border}`, borderRadius: 5, padding: "4px 10px", cursor: "pointer" }}>✓ Authenticated</button>
              <button onClick={() => setAuthStatus("loading")} style={{ fontSize: 9, background: authStatus === "loading" ? `${A.blue}20` : "transparent", color: authStatus === "loading" ? A.blue : A.textMuted, border: `1px solid ${authStatus === "loading" ? A.blue : A.border}`, borderRadius: 5, padding: "4px 10px", cursor: "pointer" }}>⟳ Loading</button>
              <button onClick={() => setAuthStatus("needs_link")} style={{ fontSize: 9, background: authStatus === "needs_link" ? `${A.yellow}20` : "transparent", color: authStatus === "needs_link" ? A.yellow : A.textMuted, border: `1px solid ${authStatus === "needs_link" ? A.yellow : A.border}`, borderRadius: 5, padding: "4px 10px", cursor: "pointer" }}>⚠ Link</button>
            </div>

            {/* Simulated Premiere Pro host */}
            <div style={{ background: "#1c1c1c", border: `2px solid #444`, borderRadius: 10, padding: 6, position: "relative" }}>
              <div style={{ background: "#141414", borderRadius: "6px 6px 0 0", padding: "4px 10px", display: "flex", gap: 6, alignItems: "center", marginBottom: 4 }}>
                <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#FF5F57" }} />
                <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#FFBD2E" }} />
                <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#28CA41" }} />
                <span style={{ fontSize: 9, color: "#888", marginLeft: 6 }}>Adobe Premiere Pro — Frame.io Panel</span>
              </div>
              <PanelMock locale={locale} auth={authStatus} />
            </div>
          </div>

          <div>
            <div style={{ fontSize: 10, fontWeight: 700, color: A.textMuted, marginBottom: 8, letterSpacing: "0.08em" }}>WHAT MAKES A CEP PANEL DIFFERENT</div>
            <CodeSnip color={A.yellow} label="Adobe CEP Panel context — constraints and integration points" code={
`// CEP = Common Extensibility Platform (Adobe's extension framework)
// Frame.io's integration: runs as a CEP extension inside Premiere Pro / After Effects.
// Technically: a Chromium web view running our React app + CEP JavaScript APIs.
//
// HOW THE PANEL IS INSTALLED:
// Extension is packaged as a .zxp file (ZXP = Zip eXtension Package).
// Installed via Adobe Exchange or ZXPInstaller.
// Adobe hosts the extension in a native panel container.
// Our React app: runs at localhost:3000 (dev) or bundled (production) inside the WebView.
//
// CONSTRAINTS WE HAD TO DESIGN AROUND:
//
// 1. FIXED PANEL WIDTH:
//    Adobe panel containers have a default width set by the user.
//    Typical: 280-360px (much narrower than a browser window).
//    Every component: must work at 280px. No horizontal overflow.
//    This is where the string expansion problem is acute.
//    "Zu Frame.io hochladen" (German) at 280px: must truncate gracefully or wrap.
//
// 2. ADOBE THEMES (dark/medium/light):
//    Adobe's host application has 3 colour themes: dark, medium light, lightest.
//    Our panel: must match the host's active theme.
//    Implementation: CSS custom properties + theme detection.
//    const theme = CSInterface.getHostEnvironment().appSkinInfo.panelBackgroundColor;
//    document.body.classList.add(\`theme-\${getThemeName(theme)}\`);
//    CSS variables: --panel-bg, --panel-text, --panel-border.
//    Styled components: use CSS variables, not hardcoded colours.
//
// 3. NO BROWSER NAVIGATION:
//    Panel has no address bar, no back/forward, no reload.
//    React Router: history mode doesn't work (no server to handle routes).
//    We use hash routing: /#/projects, /#/project/abc123, /#/comments.
//    Or: memory router (no URL at all — state managed in React only).
//
// 4. COMMUNICATION WITH PREMIERE PRO / AFTER EFFECTS:
//    CEP JavaScript ↔ Host ExtendScript (JSX) bridge:
//    // In the panel (JavaScript):
//    csInterface.evalScript('getActiveSequence()', (result) => {
//      const sequence = JSON.parse(result);
//      setCurrentTimecode(sequence.currentTime);
//    });
//    // Frame.io uses this to know what frame the user is viewing.
//    // When user scrubs timeline: panel shows comments at that timecode.
//    // "Timecode-aware comments" — the core Frame.io value in Premiere Pro.
//
// 5. PERFORMANCE IN A CONSTRAINED WEBVIEW:
//    CEP WebView: Chromium, but older version (not always latest).
//    Cannot use cutting-edge CSS or JS features without checking CEP's Chromium version.
//    Vite: fast local HMR. But in CEP: panel reloads the entire WebView on hot reload.
//    Solution: configure Vite with a custom WebSocket endpoint that CEP can reach.
//
// STORYBOOK FOR PANEL DEVELOPMENT:
// Panel UI is hard to develop inside Premiere Pro (slow launch, reload cycle).
// Storybook: lets us develop components in isolation in the browser.
// Stories capture:
//   • Every locale (6 locale variants per story)
//   • Every theme (dark, medium, lightest)
//   • Every auth state (loading, authenticated, needs_link, error)
//   • Different panel widths (280px, 320px, 360px)
// "Storybook is our 'local Premiere Pro' for UI development.
//  We build and test 90% of the UI without opening the actual Adobe app."`} />
          </div>
        </div>
      )}

      {/* ── TECH STACK ── */}
      {tab === "tech" && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
          <div>
            <div style={{ fontSize: 10, fontWeight: 700, color: A.textMuted, marginBottom: 8, letterSpacing: "0.08em" }}>TECH STACK — WHY EACH CHOICE</div>
            {[
              { tech: "Apollo + GraphQL", color: A.purple, why: "Frame.io's API is GraphQL. Apollo: normalised cache means when a comment is added anywhere, every view of that asset updates automatically. Subscriptions: real-time comment notifications without polling." },
              { tech: "react-intl (FormatJS)", color: A.blue, why: "Industry standard for React i18n. ICU message syntax handles complex plural rules for all 6 locales. formatjs CLI: extracts messages, checks coverage in CI." },
              { tech: "Vite", color: A.yellow, why: "Faster dev server than webpack. HMR in the CEP panel context required custom WebSocket config. Production builds: faster than CRA. TypeScript via esbuild: type-strip only (fast), then tsc separately for type checking." },
              { tech: "Context API",  color: A.green, why: "Auth context (user, token, permissions), Locale context (current locale, direction), Theme context (Adobe panel theme). No Redux — state is not complex enough to warrant it. Context + useMemo avoids unnecessary re-renders." },
              { tech: "Styled Components + CSS Modules", color: A.red, why: "Styled Components: dynamic theming (Adobe dark/medium/light themes via CSS custom properties). CSS Modules: component-scoped styles where dynamic theming is not needed. Both coexist — used intentionally by context." },
              { tech: "CircleCI", color: A.textDim, why: "CI pipeline: type-check (tsc), lint (ESLint + formatjs/no-literal-string), i18n coverage check (all keys translated in all locales), Storybook build, Chromatic visual diff. Merge blocked if any i18n key is missing in any locale." },
            ].map(t => (
              <div key={t.tech} style={{ background: A.panel, border: `1px solid ${A.border}`, borderLeft: `3px solid ${t.color}`, borderRadius: 8, padding: "8px 12px", marginBottom: 7 }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: t.color, marginBottom: 3 }}>{t.tech}</div>
                <div style={{ fontSize: 8, color: A.textMuted, lineHeight: 1.5 }}>{t.why}</div>
              </div>
            ))}
          </div>

          <div>
            <div style={{ fontSize: 10, fontWeight: 700, color: A.textMuted, marginBottom: 8, letterSpacing: "0.08em" }}>IMPLEMENTATION DEPTH</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <CodeSnip color={A.purple} label="Apollo + GraphQL — real-time collaboration + normalised cache" code={
`// WHY APOLLO + GRAPHQL FOR FRAME.IO:
//
// Frame.io's core value: real-time video collaboration.
// Multiple reviewers: adding comments at the same time.
// Panel must update in real-time when a teammate comments.
//
// GRAPHQL SUBSCRIPTION FOR REAL-TIME COMMENTS:
// const COMMENTS_SUBSCRIPTION = gql\`
//   subscription OnNewComment($assetId: ID!) {
//     commentAdded(assetId: $assetId) {
//       id
//       text
//       author { id name avatar }
//       timecode
//       createdAt
//     }
//   }
// \`;
//
// function CommentFeed({ assetId }: { assetId: string }) {
//   const { data } = useSubscription(COMMENTS_SUBSCRIPTION, {
//     variables: { assetId },
//     onData: ({ client, data }) => {
//       // Apollo: add new comment to the normalised cache:
//       client.cache.modify({
//         id: client.cache.identify({ __typename: 'Asset', id: assetId }),
//         fields: {
//           comments(existingRefs = []) {
//             const newRef = client.cache.writeFragment({
//               data: data.data.commentAdded,
//               fragment: COMMENT_FRAGMENT,
//             });
//             return [...existingRefs, newRef];
//           },
//         },
//       });
//     },
//   });
//   // When a new comment arrives: cache updates, UI re-renders automatically.
//   // No manual state management. Apollo handles it.
// }
//
// NORMALISED CACHE — why it matters:
// Frame.io panel: project list view + asset detail view.
// Both show the same project data.
// Without normalised cache: update project name → must update BOTH views separately.
// With Apollo normalised cache: project entity stored by ID.
// Update once: both views re-render. Automatic. Zero extra code.
//
// BFF-STYLE QUERIES (specific data per view):
// // Project list: need name, thumbnail, comment count — NOT comments array
// const PROJECT_LIST_QUERY = gql\`
//   query ProjectList {
//     projects {
//       id name thumbnail commentCount updatedAt
//     }
//   }
// \`;
//
// // Asset detail: need the comments
// const ASSET_DETAIL_QUERY = gql\`
//   query AssetDetail($id: ID!) {
//     asset(id: $id) {
//       id name comments { id text author { name } timecode }
//     }
//   }
// \`;
// "GraphQL: each view asks for exactly what it needs.
//  No over-fetching (REST: would return full project object including all comments
//  even for the list view). Bandwidth matters in a panel that's running
//  on a MacBook with a potentially slow internet connection."`} />

              <CodeSnip color={A.yellow} label="CircleCI i18n pipeline — no untranslated strings in production, ever" code={
`// CIRCLECI I18N PIPELINE — COMPLETE:
//
// .circleci/config.yml (relevant jobs):
//
// jobs:
//   type-check:
//     steps:
//       - run: npx tsc --noEmit
//       # Type errors fail the build. No 'any' — enforced by tsconfig strict mode.
//
//   lint-i18n:
//     steps:
//       - run:
//           name: "ESLint — no hardcoded strings"
//           command: npx eslint 'src/**/*.tsx' --rule '{"formatjs/no-literal-string-in-jsx": "error"}'
//           # Catches: <button>Upload</button>
//           # Requires: <button><FormattedMessage id="upload.button" /></button>
//
//       - run:
//           name: "Extract messages → en-US baseline"
//           command: npx formatjs extract 'src/**/*.tsx' --out-file /tmp/extracted.json
//
//       - run:
//           name: "Verify all keys are translated in all locales"
//           command: |
//             node -e "
//               const extracted = require('/tmp/extracted.json');
//               const locales = ['ja-JP', 'de-DE', 'fr-FR', 'pt-BR', 'ko-KR'];
//               let failed = false;
//               for (const locale of locales) {
//                 const translated = require(\`src/i18n/\${locale}.json\`);
//                 for (const key of Object.keys(extracted)) {
//                   if (!translated[key]) {
//                     console.error(\`MISSING: \${key} in \${locale}\`);
//                     failed = true;
//                   }
//                 }
//               }
//               if (failed) process.exit(1);
//             "
//           # If ANY key is missing in ANY locale: CI fails. PR cannot merge.
//           # Translators must provide all keys before a feature ships.
//
//   storybook-visual-diff:
//     steps:
//       - run: npm run build-storybook
//       - run: npx chromatic --project-token=$CHROMATIC_TOKEN
//       # Chromatic: takes screenshots of every story in every locale.
//       # PR: shows visual diff. Catches string expansion layout breaks.
//       # e.g. German text overflowing a button: caught before merge, not after.
//
// STORYBOOK LOCALE STORIES:
// // Upload button story — shows all 6 locales:
// export const AllLocales: Story = {
//   render: () => (
//     <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
//       {LOCALES.map(locale => (
//         <IntlProvider key={locale} locale={locale} messages={MESSAGES[locale]}>
//           <div>
//             <div style={{ fontSize: 10, color: '#888', marginBottom: 4 }}>{locale}</div>
//             <UploadButton />
//           </div>
//         </IntlProvider>
//       ))}
//     </div>
//   ),
// };
// "Every component: must have an AllLocales story.
//  If the German version doesn't fit in the button: we catch it in Storybook review.
//  Not in production. Not from a user report."`} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default FrameIOAdobeDemo;
