/**
 * CorePlatformDemo.tsx
 *
 * Frontend Platform Engineering — React / Next.js role
 *
 * Achievements covered:
 *   1. Core platform  — React Query (cache/staleness/mutations) + Recoil (atoms/selectors)
 *   2. CMS website    — Reusable components (Antd + TailwindCSS), React Hook Form + Zod
 *   3. SEO + API      — Next.js SEO practices, OG preview, API integration patterns
 *   4. Code review    — Review philosophy, what "best practices" actually means in code
 *
 * TABS
 *   🔄 Data Layer   — React Query cache demo, Recoil atom diagram, query lifecycle
 *   📋 CMS & Forms  — Blog post editor, real-time validation, form state inspector
 *   🔍 SEO + API    — SEO audit panel, OG preview, Core Web Vitals, API patterns
 */

import React, { useState, useEffect, useCallback, useRef } from "react";

// ─────────────────────────────────────────────────────────────────
// Data Layer types / mock data
// ─────────────────────────────────────────────────────────────────

type QueryStatus = "fresh" | "stale" | "fetching" | "error" | "idle";

interface QueryEntry {
  key: string; label: string; icon: string;
  status: QueryStatus; lastFetched: number;
  staleTime: number; cacheTime: number;
  data?: string; color: string;
}

const INITIAL_QUERIES: QueryEntry[] = [
  { key: "posts",    label: "Blog Posts",     icon: "📝", status: "idle", lastFetched: 0, staleTime: 30000,  cacheTime: 300000, color: "#0ea5e9" },
  { key: "products", label: "Products",       icon: "📦", status: "idle", lastFetched: 0, staleTime: 60000,  cacheTime: 600000, color: "#22c55e" },
  { key: "user",     label: "User Profile",   icon: "👤", status: "idle", lastFetched: 0, staleTime: 10000,  cacheTime: 120000, color: "#a855f7" },
];

const RECOIL_ATOMS = [
  { name: "filterAtom",    type: "atom",     value: '{ status: "published" }',      desc: "User's active filter state"    },
  { name: "pageAtom",      type: "atom",     value: "1",                            desc: "Current pagination page"       },
  { name: "sidebarAtom",   type: "atom",     value: "true",                         desc: "Sidebar collapsed/expanded"    },
  { name: "filteredPosts", type: "selector", value: "posts.filter(p => p.status…)", desc: "Derived: filter × page × posts" },
  { name: "totalPages",    type: "selector", value: "Math.ceil(total / pageSize)",  desc: "Derived: pagination computed"  },
];

// ─────────────────────────────────────────────────────────────────
// CMS / Form types
// ─────────────────────────────────────────────────────────────────

interface FormData {
  title: string; slug: string; category: string;
  tags: string; content: string; published: boolean;
}
type FormErrors = Partial<Record<keyof FormData, string>>;

const CATEGORIES = ["Technology", "Marketing", "Design", "Product", "Engineering"];

// ─────────────────────────────────────────────────────────────────
// SEO data
// ─────────────────────────────────────────────────────────────────

interface SeoCheck { id: string; label: string; status: "pass" | "warn" | "fail"; detail: string }

const SEO_CHECKS: SeoCheck[] = [
  { id: "title",       label: "Title tag (50-60 chars)",      status: "pass", detail: "58 chars: 'Best CMS Platform for Growing Teams | Acme Corp'" },
  { id: "meta",        label: "Meta description (120-160 ch)", status: "pass", detail: "142 chars: compelling description with target keywords" },
  { id: "og-title",    label: "Open Graph title",             status: "pass", detail: "og:title set, matches page title" },
  { id: "og-image",    label: "Open Graph image (1200×630)",  status: "warn", detail: "Image found but size is 1024×512 — suboptimal for LinkedIn" },
  { id: "canonical",   label: "Canonical URL",                status: "pass", detail: "Self-referencing canonical set correctly" },
  { id: "h1",          label: "Single H1 tag",                status: "pass", detail: "One H1 found: 'Scale Your Content Operations'" },
  { id: "alt-text",    label: "Image alt attributes",         status: "fail", detail: "3 of 12 images missing alt text — screen reader / SEO issue" },
  { id: "schema",      label: "Structured data (JSON-LD)",    status: "pass", detail: "Organization schema + BreadcrumbList detected" },
  { id: "canonical2",  label: "robots.txt + sitemap",         status: "pass", detail: "sitemap.xml submitted to Search Console" },
  { id: "lcp",         label: "LCP < 2.5s",                   status: "pass", detail: "LCP: 1.8s — next/image with priority prop on hero" },
];

// ─────────────────────────────────────────────────────────────────
// Helper
// ─────────────────────────────────────────────────────────────────

function CodeBlock({ code, label, color = "#64748b" }: { code: string; label?: string; color?: string }) {
  return (
    <div style={{ background: "#0a0a14", borderRadius: 8, overflow: "hidden", border: "1px solid #1e293b" }}>
      {label && <div style={{ padding: "5px 12px", borderBottom: "1px solid #1e293b", fontSize: 10, color }}>{label}</div>}
      <pre style={{ margin: 0, padding: 12, fontSize: 9, fontFamily: "monospace", color: "#94a3b8", lineHeight: 1.7, overflow: "auto", maxHeight: 280 }}>{code}</pre>
    </div>
  );
}

function Badge({ text, color }: { text: string; color: string }) {
  return <span style={{ fontSize: 7, background: color + "20", color, borderRadius: 4, padding: "1px 6px", fontWeight: 700 }}>{text}</span>;
}

// ─────────────────────────────────────────────────────────────────
// Main
// ─────────────────────────────────────────────────────────────────

export function CorePlatformDemo() {
  const [activeTab, setActiveTab] = useState<"data" | "cms" | "seo">("data");

  // ── Data Layer state
  const [queries, setQueries] = useState<QueryEntry[]>(INITIAL_QUERIES);
  const [selectedAtom, setSelectedAtom] = useState<string | null>(null);
  const [mutationLog, setMutationLog] = useState<string[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchQuery = useCallback(async (key: string, simulateError = false) => {
    setQueries(prev => prev.map(q => q.key === key ? { ...q, status: "fetching" } : q));
    await new Promise(r => setTimeout(r, 900 + Math.random() * 400));
    if (simulateError) {
      setQueries(prev => prev.map(q => q.key === key ? { ...q, status: "error" } : q));
      return;
    }
    const samples: Record<string, string> = {
      posts: "12 posts fetched (3 drafts, 9 published)",
      products: "47 products fetched (5 out of stock)",
      user: "User: Jane Doe <jane@acme.com> · role: admin",
    };
    setQueries(prev => prev.map(q => q.key === key ? { ...q, status: "fresh", lastFetched: Date.now(), data: samples[key] } : q));
  }, []);

  const invalidate = (key: string) => setQueries(prev => prev.map(q => q.key === key ? { ...q, status: "stale" } : q));
  const fetchAll = () => INITIAL_QUERIES.forEach(q => fetchQuery(q.key));

  const addMutationLog = (msg: string) => setMutationLog(prev => [`[${new Date().toLocaleTimeString()}] ${msg}`, ...prev].slice(0, 8));

  const runMutation = async () => {
    addMutationLog("POST /api/posts — creating new post…");
    await new Promise(r => setTimeout(r, 700));
    addMutationLog("✓ Post created (id: 99)");
    addMutationLog("Invalidating ['posts'] query…");
    invalidate("posts");
    await new Promise(r => setTimeout(r, 300));
    addMutationLog("Refetching posts query (cache invalidated)…");
    fetchQuery("posts");
  };

  // Stale timer — mark fresh queries as stale after their staleTime
  useEffect(() => {
    timerRef.current = setInterval(() => {
      setQueries(prev => prev.map(q => {
        if (q.status === "fresh" && Date.now() - q.lastFetched > q.staleTime) return { ...q, status: "stale" };
        return q;
      }));
    }, 2000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, []);

  // ── CMS / Form state
  const [form, setForm] = useState<FormData>({ title: "", slug: "", category: "", tags: "", content: "", published: false });
  const [errors, setErrors] = useState<FormErrors>({});
  const [isDirty, setIsDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const slugify = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

  const updateField = <K extends keyof FormData>(field: K, value: FormData[K]) => {
    setForm(prev => {
      const updated = { ...prev, [field]: value };
      if (field === "title") updated.slug = slugify(value as string);
      return updated;
    });
    setIsDirty(true); setSaved(false);
    setErrors(prev => { const next = { ...prev }; delete next[field]; return next; });
  };

  const validate = (): boolean => {
    const newErrors: FormErrors = {};
    if (!form.title.trim()) newErrors.title = "Title is required";
    else if (form.title.length < 5) newErrors.title = "Title must be at least 5 characters";
    else if (form.title.length > 100) newErrors.title = "Title must be ≤ 100 characters";
    if (!form.category) newErrors.category = "Please select a category";
    if (!form.content.trim()) newErrors.content = "Content is required";
    else if (form.content.length < 50) newErrors.content = "Content must be at least 50 characters";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;
    setSaving(true);
    await new Promise(r => setTimeout(r, 1000));
    setSaving(false); setSaved(true); setIsDirty(false);
  };

  // ── SEO state
  const [activeCheck, setActiveCheck] = useState<SeoCheck | null>(null);
  const [ogTab, setOgTab]             = useState<"twitter" | "linkedin" | "facebook">("twitter");

  const score = Math.round((SEO_CHECKS.filter(c => c.status === "pass").length / SEO_CHECKS.length) * 100);
  const scoreColor = score >= 80 ? "#22c55e" : score >= 60 ? "#f59e0b" : "#ef4444";

  const statusIcon = (s: "pass" | "warn" | "fail") => s === "pass" ? "✓" : s === "warn" ? "⚠" : "✗";
  const statusColor = (s: "pass" | "warn" | "fail") => s === "pass" ? "#22c55e" : s === "warn" ? "#f59e0b" : "#ef4444";

  const TABS = [
    { id: "data" as const, label: "🔄 Data Layer"   },
    { id: "cms"  as const, label: "📋 CMS & Forms"  },
    { id: "seo"  as const, label: "🔍 SEO + API"    },
  ];

  const queryStatusColor = (s: QueryStatus) =>
    s === "fresh" ? "#22c55e" : s === "stale" ? "#f59e0b" : s === "fetching" ? "#0ea5e9" : s === "error" ? "#ef4444" : "#475569";

  return (
    <div style={{ background: "#0f172a", color: "#f1f5f9", fontFamily: "'Inter', system-ui, sans-serif", minHeight: "100vh", padding: 24 }}>
      {/* Header */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
          <div style={{ width: 36, height: 36, borderRadius: 8, background: "linear-gradient(135deg,#3b82f6,#8b5cf6)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>⚛</div>
          <div>
            <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800 }}>Frontend Platform Engineering</h1>
            <p style={{ margin: 0, color: "#64748b", fontSize: 13 }}>React · Next.js · Recoil · React Query · React Hook Form · Antd · TailwindCSS</p>
          </div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8 }}>
          {[
            { v: "React Query",   l: "Server State",          c: "#f59e0b", sub: "Cache · Staleness · Mutations"   },
            { v: "Recoil",        l: "Client State",          c: "#a855f7", sub: "Atoms · Selectors · Families"    },
            { v: "RHF + Zod",     l: "Form Validation",       c: "#0ea5e9", sub: "Uncontrolled · Schema · Perf"    },
            { v: "SEO A+",        l: "Marketing Website",     c: "#22c55e", sub: "OG · JSON-LD · Core Web Vitals"  },
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
          <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{ background: activeTab === tab.id ? "#1e293b" : "transparent", color: activeTab === tab.id ? "#f1f5f9" : "#64748b", border: activeTab === tab.id ? "1px solid #334155" : "1px solid transparent", borderRadius: "8px 8px 0 0", padding: "8px 24px", cursor: "pointer", fontSize: 13, fontWeight: 600 }}>{tab.label}</button>
        ))}
      </div>

      {/* ── DATA LAYER ── */}
      {activeTab === "data" && (
        <div style={{ display: "grid", gridTemplateColumns: "350px 1fr", gap: 14 }}>
          {/* Query cache panel */}
          <div>
            <div style={{ fontSize: 10, fontWeight: 700, color: "#64748b", marginBottom: 8, letterSpacing: "0.08em" }}>REACT QUERY — CACHE LIFECYCLE</div>

            <div style={{ display: "flex", gap: 5, marginBottom: 8 }}>
              <button onClick={fetchAll} style={{ flex: 1, background: "#0066ff20", border: "1px solid #3b82f6", borderRadius: 6, padding: "5px", cursor: "pointer", color: "#60a5fa", fontSize: 8, fontWeight: 700 }}>▶ Fetch All</button>
              <button onClick={runMutation} style={{ flex: 1, background: "#a855f720", border: "1px solid #a855f7", borderRadius: 6, padding: "5px", cursor: "pointer", color: "#c084fc", fontSize: 8, fontWeight: 700 }}>➕ Mutate + Invalidate</button>
            </div>

            {/* Query cards */}
            <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 10 }}>
              {queries.map(q => (
                <div key={q.key} style={{ background: "#1e293b", border: `1px solid ${queryStatusColor(q.status)}30`, borderRadius: 9, padding: 10 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 5 }}>
                    <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                      <span style={{ fontSize: 12 }}>{q.icon}</span>
                      <div>
                        <div style={{ fontSize: 9, fontWeight: 700 }}>{q.label}</div>
                        <div style={{ fontSize: 7, fontFamily: "monospace", color: "#475569" }}>useQuery(['{q.key}'])</div>
                      </div>
                    </div>
                    <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
                      <div style={{ width: 6, height: 6, borderRadius: "50%", background: queryStatusColor(q.status) }} />
                      <span style={{ fontSize: 7, color: queryStatusColor(q.status), fontWeight: 700 }}>{q.status.toUpperCase()}</span>
                    </div>
                  </div>

                  {q.data && <div style={{ fontSize: 7, color: "#64748b", background: "#0f172a", borderRadius: 4, padding: "3px 6px", marginBottom: 5 }}>{q.data}</div>}

                  <div style={{ display: "flex", gap: 3 }}>
                    <button onClick={() => fetchQuery(q.key)} style={{ flex: 1, background: q.color + "15", border: `1px solid ${q.color}30`, borderRadius: 4, padding: "3px", cursor: "pointer", color: q.color, fontSize: 7 }}>Refetch</button>
                    <button onClick={() => invalidate(q.key)} style={{ flex: 1, background: "#f59e0b15", border: "1px solid #f59e0b30", borderRadius: 4, padding: "3px", cursor: "pointer", color: "#fbbf24", fontSize: 7 }}>Invalidate</button>
                    <button onClick={() => fetchQuery(q.key, true)} style={{ flex: 1, background: "#ef444415", border: "1px solid #ef444430", borderRadius: 4, padding: "3px", cursor: "pointer", color: "#f87171", fontSize: 7 }}>Sim Error</button>
                  </div>

                  {q.lastFetched > 0 && (
                    <div style={{ display: "flex", gap: 6, marginTop: 4 }}>
                      <span style={{ fontSize: 6, color: "#475569" }}>staleTime: {q.staleTime / 1000}s</span>
                      <span style={{ fontSize: 6, color: "#475569" }}>cacheTime: {q.cacheTime / 1000}s</span>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Mutation log */}
            <div style={{ background: "#0a0a14", border: "1px solid #1e293b", borderRadius: 8, padding: 10, minHeight: 70 }}>
              <div style={{ fontSize: 8, color: "#64748b", marginBottom: 4 }}>Mutation + Query Invalidation Log</div>
              {mutationLog.length === 0 ? (
                <div style={{ fontSize: 7, color: "#334155" }}>Click "Mutate + Invalidate" to see the flow…</div>
              ) : (
                mutationLog.map((l, i) => (
                  <div key={i} style={{ fontSize: 7, fontFamily: "monospace", color: l.includes("✓") ? "#4ade80" : l.includes("Refetching") ? "#60a5fa" : "#94a3b8", lineHeight: 1.8 }}>{l}</div>
                ))
              )}
            </div>

            {/* Recoil atoms */}
            <div style={{ marginTop: 10 }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: "#64748b", marginBottom: 6, letterSpacing: "0.08em" }}>RECOIL — ATOM / SELECTOR MAP</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                {RECOIL_ATOMS.map(a => (
                  <div key={a.name} onClick={() => setSelectedAtom(selectedAtom === a.name ? null : a.name)} style={{ background: selectedAtom === a.name ? "#1e3a5f" : "#1e293b", border: `1px solid ${selectedAtom === a.name ? "#3b82f6" : a.type === "selector" ? "#a855f730" : "#334155"}`, borderRadius: 7, padding: "6px 9px", cursor: "pointer" }}>
                    <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                      <Badge text={a.type} color={a.type === "atom" ? "#0ea5e9" : "#a855f7"} />
                      <span style={{ fontSize: 8, fontFamily: "monospace", fontWeight: 700 }}>{a.name}</span>
                    </div>
                    {selectedAtom === a.name && (
                      <div style={{ marginTop: 5 }}>
                        <div style={{ fontSize: 7, color: "#64748b" }}>{a.desc}</div>
                        <div style={{ fontSize: 7, fontFamily: "monospace", color: "#60a5fa", marginTop: 2 }}>= {a.value}</div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Code */}
          <div>
            <div style={{ fontSize: 10, fontWeight: 700, color: "#64748b", marginBottom: 8, letterSpacing: "0.08em" }}>IMPLEMENTATION DEPTH</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <CodeBlock label="React Query — staleTime vs cacheTime, mutations, query invalidation" color="#f59e0b" code={
`// REACT QUERY: SERVER STATE MANAGEMENT
// React Query solves: "where do I put data that comes from the server?"
// The answer: in a query cache, not in component state or global store.
//
// staleTime vs cacheTime — the most common interview question:
//
// staleTime (default: 0):
//   How long until data is considered "stale" (i.e., might need a fresh fetch).
//   While data is "fresh": no background refetch even if the component remounts.
//   staleTime = 0: data is stale IMMEDIATELY after fetch. Every component mount → refetch.
//   staleTime = 30000: data stays "fresh" for 30 seconds. No refetch within that window.
//
// cacheTime (default: 5 minutes):
//   How long INACTIVE (no subscribers) data stays in the cache at all.
//   When a component unmounts: the query becomes inactive.
//   After cacheTime: the cache entry is garbage collected (deleted).
//   If the user navigates back before cacheTime: instant data (from cache).
//   After cacheTime: no cached data. Shows loading state on re-mount.
//
// CONFIGURATION (QueryClient):
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60_000,      // 1 minute: good for mostly-static data
      cacheTime: 5 * 60_000,  // 5 minutes: keep unused data available
      retry: 2,               // retry failed requests 2 times
      refetchOnWindowFocus: true, // refetch when user tabs back to the app
    },
  },
});

// USAGE — useQuery:
function PostList({ status }: { status: string }) {
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["posts", { status }],  // cache key: must include all variables
    queryFn: () => api.posts.list({ status }),
    staleTime: 30_000,
  });
  // queryKey INCLUDES the filter: ["posts", { status: "published" }]
  // and ["posts", { status: "draft" }] are DIFFERENT cache entries.
  // React Query: tracks them independently. No manual cache keying needed.
  if (isLoading) return <PostListSkeleton />;
  if (isError) return <ErrorBoundary error={error} />;
  return <PostGrid posts={data} />;
}

// MUTATION + INVALIDATION (the real power):
function CreatePostButton() {
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: (data: CreatePostInput) => api.posts.create(data),
    onSuccess: () => {
      // When post is created: the posts list is now stale.
      // Invalidate forces a background refetch.
      queryClient.invalidateQueries({ queryKey: ["posts"] });
      // invalidateQueries({ queryKey: ["posts"] }) matches:
      //   ["posts"], ["posts", { status: "published" }], ["posts", { status: "draft" }]
      // All are refetched. Correct, with one line.
    },
    onMutate: async (newPost) => {
      // OPTIMISTIC UPDATE: update cache before the server responds.
      // If server fails: rollback (see onError below).
      await queryClient.cancelQueries({ queryKey: ["posts"] });
      const previousPosts = queryClient.getQueryData(["posts"]);
      queryClient.setQueryData(["posts"], (old: Post[]) => [newPost, ...old]);
      return { previousPosts }; // context for onError
    },
    onError: (err, newPost, context) => {
      // Rollback optimistic update if server rejects:
      queryClient.setQueryData(["posts"], context?.previousPosts);
    },
  });
}`} />

              <CodeBlock label="Recoil — atoms vs selectors, why Recoil over Redux for this use case" color="#a855f7" code={
`// RECOIL: CLIENT STATE MANAGEMENT
// Recoil: React-native state management by Facebook.
// Design goal: atoms are just state nodes that React components subscribe to.
// Only components using a given atom re-render when that atom changes.
//
// WHY RECOIL INSTEAD OF REDUX FOR THIS PROJECT:
// Redux: global store, actions, reducers, selectors. Great for complex state transitions.
// Overhead: action types, reducers, selectors — 3 files for one state value.
// Recoil: one atom = one state value. Selector = derived value. No reducers.
// Good fit: "I need client-side state that isn't the server response."
//   Examples: filter state, selected row, sidebar open/closed, modal state.
//
// ATOM EXAMPLE:
const filterAtom = atom<FilterState>({
  key: "filterAtom",
  default: { status: "published", page: 1 },
  // key: unique within the Recoil root. Usually "{component}.{state}".
});

// USAGE:
function FilterBar() {
  const [filter, setFilter] = useRecoilState(filterAtom);
  return (
    <Select value={filter.status} onChange={status => setFilter(f => ({ ...f, status }))}>
      <Option value="published">Published</Option>
      <Option value="draft">Drafts</Option>
    </Select>
  );
}

// SELECTOR (derived state):
// Never store derived state in atoms. Compute it in selectors.
const filteredPostsSelector = selector({
  key: "filteredPostsSelector",
  get: ({ get }) => {
    const filter = get(filterAtom);      // subscribes to filterAtom
    const posts = get(allPostsAtom);     // subscribes to allPostsAtom
    return posts
      .filter(p => p.status === filter.status)
      .slice((filter.page - 1) * 10, filter.page * 10);
  },
  // When filterAtom OR allPostsAtom changes: selector recomputes.
  // Components using this selector re-render ONLY when the output changes.
  // This is memoization for free.
});

// ATOMFAMILY (dynamic atoms):
// For a list of items where each item has its own selected state:
const rowSelectedFamily = atomFamily<boolean, string>({
  key: "rowSelected",
  default: false,
});
// rowSelectedFamily("post-1"), rowSelectedFamily("post-2") = independent atoms.
// Selecting row 1 does NOT cause row 2 to re-render.
// With Redux: a selectedRows: string[] array. Selecting any row re-renders all rows.`} />
            </div>
          </div>
        </div>
      )}

      {/* ── CMS & FORMS ── */}
      {activeTab === "cms" && (
        <div style={{ display: "grid", gridTemplateColumns: "360px 1fr", gap: 14 }}>
          {/* Form */}
          <div>
            <div style={{ fontSize: 10, fontWeight: 700, color: "#64748b", marginBottom: 8, letterSpacing: "0.08em" }}>CMS EDITOR — REACT HOOK FORM</div>

            <div style={{ background: "#1e293b", border: "1px solid #334155", borderRadius: 10, padding: 14 }}>
              {/* Title */}
              <div style={{ marginBottom: 10 }}>
                <label style={{ fontSize: 8, fontWeight: 700, display: "block", marginBottom: 3 }}>Title *</label>
                <input value={form.title} onChange={e => updateField("title", e.target.value)} placeholder="Enter post title…" style={{ width: "100%", background: "#0f172a", border: `1px solid ${errors.title ? "#ef4444" : "#334155"}`, borderRadius: 6, padding: "7px 10px", color: "#f1f5f9", fontSize: 11, boxSizing: "border-box", outline: "none" }} />
                {errors.title && <div style={{ fontSize: 7, color: "#f87171", marginTop: 2 }}>⚠ {errors.title}</div>}
                <div style={{ fontSize: 7, color: form.title.length > 90 ? "#f87171" : "#475569", marginTop: 2, textAlign: "right" }}>{form.title.length}/100</div>
              </div>

              {/* Slug (auto-generated) */}
              <div style={{ marginBottom: 10 }}>
                <label style={{ fontSize: 8, fontWeight: 700, display: "block", marginBottom: 3 }}>Slug <span style={{ color: "#475569", fontWeight: 400 }}>(auto-generated)</span></label>
                <div style={{ background: "#0a0a14", border: "1px solid #1e293b", borderRadius: 6, padding: "7px 10px", fontSize: 9, fontFamily: "monospace", color: "#475569" }}>
                  /{form.slug || "your-post-title"}
                </div>
              </div>

              {/* Category */}
              <div style={{ marginBottom: 10 }}>
                <label style={{ fontSize: 8, fontWeight: 700, display: "block", marginBottom: 3 }}>Category *</label>
                <select value={form.category} onChange={e => updateField("category", e.target.value)} style={{ width: "100%", background: "#0f172a", border: `1px solid ${errors.category ? "#ef4444" : "#334155"}`, borderRadius: 6, padding: "7px 10px", color: form.category ? "#f1f5f9" : "#475569", fontSize: 11, outline: "none" }}>
                  <option value="">Select category…</option>
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
                {errors.category && <div style={{ fontSize: 7, color: "#f87171", marginTop: 2 }}>⚠ {errors.category}</div>}
              </div>

              {/* Tags */}
              <div style={{ marginBottom: 10 }}>
                <label style={{ fontSize: 8, fontWeight: 700, display: "block", marginBottom: 3 }}>Tags <span style={{ color: "#475569", fontWeight: 400 }}>(comma separated)</span></label>
                <input value={form.tags} onChange={e => updateField("tags", e.target.value)} placeholder="react, nextjs, tutorial…" style={{ width: "100%", background: "#0f172a", border: "1px solid #334155", borderRadius: 6, padding: "7px 10px", color: "#f1f5f9", fontSize: 11, boxSizing: "border-box", outline: "none" }} />
                {form.tags && (
                  <div style={{ display: "flex", gap: 4, marginTop: 4, flexWrap: "wrap" }}>
                    {form.tags.split(",").map(t => t.trim()).filter(Boolean).map(t => (
                      <span key={t} style={{ fontSize: 7, background: "#0ea5e920", border: "1px solid #0ea5e930", borderRadius: 10, padding: "1px 7px", color: "#38bdf8" }}>#{t}</span>
                    ))}
                  </div>
                )}
              </div>

              {/* Content */}
              <div style={{ marginBottom: 10 }}>
                <label style={{ fontSize: 8, fontWeight: 700, display: "block", marginBottom: 3 }}>Content *</label>
                <textarea value={form.content} onChange={e => updateField("content", e.target.value)} placeholder="Write your post content here…" rows={4} style={{ width: "100%", background: "#0f172a", border: `1px solid ${errors.content ? "#ef4444" : "#334155"}`, borderRadius: 6, padding: "7px 10px", color: "#f1f5f9", fontSize: 10, boxSizing: "border-box", outline: "none", resize: "vertical", fontFamily: "inherit" }} />
                {errors.content && <div style={{ fontSize: 7, color: "#f87171", marginTop: 2 }}>⚠ {errors.content}</div>}
                <div style={{ fontSize: 7, color: "#475569", marginTop: 2 }}>{form.content.length} chars {form.content.length < 50 && form.content.length > 0 ? "· need 50+ for publish" : ""}</div>
              </div>

              {/* Publish toggle + save */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <div onClick={() => updateField("published", !form.published)} style={{ width: 32, height: 16, borderRadius: 8, background: form.published ? "#22c55e" : "#334155", cursor: "pointer", position: "relative", transition: "background 0.2s" }}>
                    <div style={{ width: 12, height: 12, borderRadius: "50%", background: "#fff", position: "absolute", top: 2, left: form.published ? 18 : 2, transition: "left 0.2s" }} />
                  </div>
                  <span style={{ fontSize: 8, color: form.published ? "#4ade80" : "#64748b" }}>{form.published ? "Published" : "Draft"}</span>
                </div>
                <button onClick={handleSave} disabled={saving} style={{ background: saving ? "#334155" : saved ? "#22c55e20" : "#0066ff20", border: `1px solid ${saving ? "#334155" : saved ? "#22c55e" : "#3b82f6"}`, borderRadius: 6, padding: "6px 14px", cursor: saving ? "not-allowed" : "pointer", color: saving ? "#475569" : saved ? "#4ade80" : "#60a5fa", fontSize: 9, fontWeight: 700 }}>
                  {saving ? "Saving…" : saved ? "✓ Saved" : "Save Post"}
                </button>
              </div>
            </div>

            {/* Form state inspector */}
            <div style={{ marginTop: 8, background: "#0a0a14", border: "1px solid #1e293b", borderRadius: 8, padding: 10 }}>
              <div style={{ fontSize: 8, color: "#64748b", marginBottom: 6 }}>Form State Inspector <span style={{ color: "#475569" }}>(React Hook Form equivalent)</span></div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 4 }}>
                {[
                  { label: "isDirty",   value: isDirty.toString(),                        c: isDirty ? "#f59e0b" : "#475569" },
                  { label: "isValid",   value: (Object.keys(errors).length === 0 && form.title.length >= 5 && !!form.category && form.content.length >= 50).toString(), c: Object.keys(errors).length === 0 && form.title.length >= 5 ? "#22c55e" : "#ef4444" },
                  { label: "errors",    value: Object.keys(errors).length > 0 ? JSON.stringify(Object.keys(errors)) : "[]", c: Object.keys(errors).length > 0 ? "#ef4444" : "#22c55e" },
                  { label: "saved",     value: saved.toString(),                           c: saved ? "#22c55e" : "#475569" },
                ].map(item => (
                  <div key={item.label} style={{ background: "#1e293b", borderRadius: 5, padding: "4px 7px" }}>
                    <div style={{ fontSize: 7, color: "#475569" }}>{item.label}</div>
                    <div style={{ fontSize: 8, fontFamily: "monospace", color: item.c, wordBreak: "break-all" }}>{item.value}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Code */}
          <div>
            <div style={{ fontSize: 10, fontWeight: 700, color: "#64748b", marginBottom: 8, letterSpacing: "0.08em" }}>IMPLEMENTATION DEPTH</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <CodeBlock label="React Hook Form + Zod — why uncontrolled, schema validation, Controller" color="#0ea5e9" code={
`// REACT HOOK FORM: WHY NOT useState() FOR EVERY FIELD?
//
// The naive approach:
// const [title, setTitle] = useState("");
// const [content, setContent] = useState("");
// const [category, setCategory] = useState("");
//
// Problem: every keystroke → setState → re-render of the ENTIRE form component.
// A form with 10 fields: 10× the re-renders per keystroke.
// On a mobile device or slow connection: noticeable input lag.
//
// React Hook Form: uses UNCONTROLLED inputs.
// Input values live in the DOM (input.value), not in React state.
// React state is only used for form-level metadata: errors, isSubmitting, isDirty.
// Per-keystroke re-renders: ZERO (until validation triggers).
//
// SETUP:
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

const postSchema = z.object({
  title:     z.string().min(5, "Title must be at least 5 chars").max(100),
  slug:      z.string().optional(),
  category:  z.string().min(1, "Select a category"),
  tags:      z.string().optional(),
  content:   z.string().min(50, "Content must be at least 50 chars"),
  published: z.boolean().default(false),
});
type PostFormValues = z.infer<typeof postSchema>;

function PostEditor() {
  const { register, handleSubmit, watch, setValue, formState: { errors, isDirty, isValid } } = useForm<PostFormValues>({
    resolver: zodResolver(postSchema), // schema-based validation (vs manual validate)
    mode: "onBlur",     // validate on field blur, not on every keystroke
  });

  // Auto-slug: watch the title, derive slug:
  const title = watch("title");
  useEffect(() => {
    setValue("slug", slugify(title), { shouldDirty: false });
  }, [title]);

  // CONTROLLER: for Antd components (controlled components like Select, DatePicker):
  // Antd's Select doesn't expose a native ref. Use Controller to bridge RHF and Antd:
  return (
    <Controller
      name="category"
      control={control}
      render={({ field }) => (
        <Select {...field} options={CATEGORIES} status={errors.category ? "error" : undefined} />
        // field: { value, onChange, onBlur, ref } — RHF manages the state.
        // Antd Select: uses onChange to notify RHF of the new value.
      )}
    />
  );
}

// VALIDATION MODE STRATEGY:
// mode: "onBlur":  validates when user leaves the field. Good for short forms.
// mode: "onChange": validates on every keystroke. Good for real-time feedback.
// mode: "onSubmit": validates only on submit. Good for simple forms.
// We used "onBlur": user gets feedback after completing each field, not while typing.
// Prevents the "error flashing while typing" antipattern.`} />

              <CodeBlock label="CMS reusable components — Antd + TailwindCSS, component API design" color="#22c55e" code={
`// CHALLENGE: ANTD + TAILWINDCSS TOGETHER
// Antd: component library with its own style system (CSS-in-JS / Less).
// TailwindCSS: utility-first CSS classes.
// Problem: Antd's global styles can conflict with Tailwind's reset (preflight).
//
// SOLUTION: Separation of concerns.
// Antd: provides COMPONENT-LEVEL styles (button states, dropdown animations).
// TailwindCSS: provides LAYOUT and SPACING (grid, flex, padding, margin).
//
// Tailwind preflight conflicts with Antd's base styles:
// Fix: disable Tailwind preflight for the CMS package.
// tailwind.config.js:
// corePlugins: { preflight: false }
// Instead: Antd's cssVar mode + tokens for theming.
//
// REUSABLE CMS COMPONENTS (DataTable, PageHeader, FilterBar):
// Principle: each component has ONE job. Props are explicit. No magic behavior.
//
// BAD: a "smart" table that fetches its own data.
// GOOD: a "dumb" table that receives data and callbacks as props.
//
// DataTable (reusable):
interface DataTableProps<T extends Record<string, unknown>> {
  data: T[];
  columns: ColumnDef<T>[];
  isLoading?: boolean;        // renders skeleton rows
  emptyState?: ReactNode;     // custom empty state (not just "No data")
  onRowClick?: (row: T) => void;
  pagination?: { total: number; page: number; onChange: (page: number) => void };
  rowKey: keyof T;            // required: for React keys (no index)
}
// This DataTable: used for Posts, Products, Users, Orders pages.
// Zero business logic inside it. All data fetching: outside.
// If requirements change: change the consumer, not the component.
//
// PageHeader (reusable):
interface PageHeaderProps {
  title: string;
  breadcrumb?: BreadcrumbItem[];
  actions?: ReactNode;       // slot for buttons (Create, Export, etc.)
  extra?: ReactNode;         // secondary actions or status indicators
}
// Using slots (ReactNode props) instead of booleans:
// NOT: showCreateButton={true} — this couples the header to create logic.
// YES: actions={<Button onClick={onCreate}>Create Post</Button>} — decoupled.
// The header doesn't know what buttons exist. The page knows.
//
// FilterBar (reusable):
interface FilterBarProps {
  filters: FilterDef[];      // { key, label, type: "select"|"date"|"search", options? }
  value: Record<string, unknown>;
  onChange: (newFilter: Record<string, unknown>) => void;
}
// FilterBar: renders different filter controls based on type.
// Consumer: provides the filter definition. FilterBar: handles the UI.
//
// Result: the CMS for 8+ different entity types (Posts, Products, Users, Tags,
// Categories, Media, Comments, Settings) uses the SAME 5 reusable components.
// A new entity type: create a page, compose the components, no new component needed.`} />
            </div>
          </div>
        </div>
      )}

      {/* ── SEO + API ── */}
      {activeTab === "seo" && (
        <div style={{ display: "grid", gridTemplateColumns: "350px 1fr", gap: 14 }}>
          {/* SEO audit */}
          <div>
            <div style={{ fontSize: 10, fontWeight: 700, color: "#64748b", marginBottom: 8, letterSpacing: "0.08em" }}>SEO AUDIT — MARKETING WEBSITE</div>

            {/* Score */}
            <div style={{ background: "#1e293b", border: "1px solid #334155", borderRadius: 10, padding: 12, marginBottom: 8, display: "flex", gap: 12, alignItems: "center" }}>
              <div style={{ width: 56, height: 56, borderRadius: "50%", border: `3px solid ${scoreColor}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <span style={{ fontSize: 18, fontWeight: 900, color: scoreColor }}>{score}</span>
              </div>
              <div>
                <div style={{ fontSize: 11, fontWeight: 700 }}>SEO Score</div>
                <div style={{ fontSize: 8, color: "#64748b" }}>{SEO_CHECKS.filter(c => c.status === "pass").length} pass · {SEO_CHECKS.filter(c => c.status === "warn").length} warn · {SEO_CHECKS.filter(c => c.status === "fail").length} fail</div>
                <div style={{ fontSize: 7, color: "#475569", marginTop: 3 }}>Collaborated with SEO specialist to implement all items</div>
              </div>
            </div>

            {/* Checks */}
            <div style={{ display: "flex", flexDirection: "column", gap: 4, marginBottom: 8 }}>
              {SEO_CHECKS.map(check => (
                <div key={check.id} onClick={() => setActiveCheck(activeCheck?.id === check.id ? null : check)} style={{ background: activeCheck?.id === check.id ? "#1e3a5f" : "#1e293b", border: `1px solid ${activeCheck?.id === check.id ? "#3b82f6" : statusColor(check.status) + "30"}`, borderRadius: 7, padding: "6px 9px", cursor: "pointer" }}>
                  <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                    <span style={{ color: statusColor(check.status), fontSize: 9, fontWeight: 800 }}>{statusIcon(check.status)}</span>
                    <span style={{ fontSize: 8, flex: 1 }}>{check.label}</span>
                    <span style={{ fontSize: 7, color: statusColor(check.status), background: statusColor(check.status) + "20", borderRadius: 3, padding: "0 5px" }}>{check.status}</span>
                  </div>
                  {activeCheck?.id === check.id && (
                    <div style={{ marginTop: 5, fontSize: 7, color: "#94a3b8", lineHeight: 1.5 }}>{check.detail}</div>
                  )}
                </div>
              ))}
            </div>

            {/* OG Preview */}
            <div style={{ fontSize: 10, fontWeight: 700, color: "#64748b", marginBottom: 6, letterSpacing: "0.08em" }}>OPEN GRAPH PREVIEW</div>
            <div style={{ display: "flex", gap: 4, marginBottom: 6 }}>
              {(["twitter", "linkedin", "facebook"] as const).map(p => (
                <button key={p} onClick={() => setOgTab(p)} style={{ flex: 1, background: ogTab === p ? "#1e3a5f" : "#1e293b", border: `1px solid ${ogTab === p ? "#3b82f6" : "#334155"}`, borderRadius: 5, padding: "3px", cursor: "pointer", color: ogTab === p ? "#60a5fa" : "#64748b", fontSize: 7, textTransform: "capitalize" }}>{p}</button>
              ))}
            </div>
            <div style={{ background: "#1e293b", border: "1px solid #334155", borderRadius: 10, overflow: "hidden" }}>
              <div style={{ background: "#334155", height: 80, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}>🌐</div>
              <div style={{ padding: 10 }}>
                <div style={{ fontSize: 7, color: "#475569", marginBottom: 2 }}>acmecorp.io</div>
                <div style={{ fontSize: 9, fontWeight: 700, marginBottom: 2 }}>Best CMS Platform for Growing Teams | Acme Corp</div>
                <div style={{ fontSize: 7, color: "#64748b" }}>Scale your content operations with our all-in-one CMS. Trusted by 2,000+ teams worldwide. Start free today.</div>
                {ogTab !== "twitter" && <div style={{ fontSize: 7, color: "#f59e0b", marginTop: 4 }}>⚠ Image 1024×512 — optimal is 1200×630 for {ogTab}</div>}
              </div>
            </div>
          </div>

          {/* Code */}
          <div>
            <div style={{ fontSize: 10, fontWeight: 700, color: "#64748b", marginBottom: 8, letterSpacing: "0.08em" }}>IMPLEMENTATION DEPTH</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <CodeBlock label="Next.js SEO — meta tags, OG, structured data, next/image for LCP" color="#22c55e" code={
`// NEXT.JS SEO IMPLEMENTATION
// Working with an SEO specialist: they tell me WHAT to optimise.
// I tell them WHAT'S TECHNICALLY POSSIBLE. We meet in the middle.
//
// THREE LAYERS OF SEO IMPLEMENTATION:
//
// LAYER 1: META TAGS (per-page in App Router or pages/_document)
// Using next-seo for declarative, reusable SEO across pages:
import { NextSeo } from "next-seo";

function MarketingPage({ page }: { page: CMSPage }) {
  return (
    <>
      <NextSeo
        title={page.seoTitle || page.title}
        description={page.metaDescription}
        canonical={\`https://acmecorp.io\${page.slug}\`}
        openGraph={{
          title: page.ogTitle || page.seoTitle,
          description: page.ogDescription,
          images: [{ url: page.ogImage.url, width: 1200, height: 630, alt: page.ogImage.alt }],
          type: "website",
          site_name: "Acme Corp",
        }}
        twitter={{ cardType: "summary_large_image", handle: "@acmecorp" }}
      />
      {/* Page content */}
    </>
  );
}
// Collaborating with SEO specialist: they review title/description copy.
// I implement. They test in Google Search Console + social validators.
//
// LAYER 2: STRUCTURED DATA (JSON-LD) for rich results in SERPs:
function OrganizationSchema() {
  return (
    <script type="application/ld+json" dangerouslySetInnerHTML={{
      __html: JSON.stringify({
        "@context": "https://schema.org",
        "@type": "Organization",
        "name": "Acme Corp",
        "url": "https://acmecorp.io",
        "logo": "https://acmecorp.io/logo.png",
        "sameAs": ["https://twitter.com/acmecorp", "https://linkedin.com/company/acme"],
        "contactPoint": { "@type": "ContactPoint", "contactType": "customer service" }
      })
    }} />
  );
}
// LAYER 3: PERFORMANCE FOR SEO (Core Web Vitals directly affect ranking):
// LCP (Largest Contentful Paint): the hero image is usually the LCP element.
// Next.js next/image with priority prop: preloaded in <head>. LCP improves.
import Image from "next/image";

function HeroSection({ hero }: { hero: HeroImage }) {
  return (
    <Image
      src={hero.url}
      alt={hero.alt}          // required for accessibility and SEO
      width={1440}
      height={600}
      priority={true}         // preloads in <head>: critical for LCP
      sizes="100vw"           // responsive: serves the right size per device
      // Without sizes: next/image downloads the largest version for all devices.
      // With sizes: mobile downloads 768px version, desktop downloads 1440px version.
    />
  );
}
// CLS (Cumulative Layout Shift): next/image requires width/height.
// Reserves exact space. Image loads into reserved space. CLS = 0.
// TTFB (Time to First Byte): use Next.js SSG or ISR for marketing pages.
// SSG: pre-rendered at build time. Edge-cached. Fastest possible TTFB.
// ISR: revalidate=3600: like SSG but updates hourly. Good for CMS content.`} />

              <CodeBlock label="API integration — React Query + Axios interceptors + error handling" color="#0ea5e9" code={
`// API INTEGRATION PATTERN: WORKING WITH BACKEND TEAM
//
// THE DISCUSSION WITH BACKEND TEAM:
// I initiated: "Let's agree on a few things before you write the API."
// 1. Error format: { error: { code: string, message: string, field?: string } }
//    Consistent format → I can write ONE error handler for ALL endpoints.
// 2. Pagination: cursor-based or offset? We chose offset: { data, total, page, limit }
// 3. Date format: ISO 8601 always. I parse on the client with date-fns.
// 4. Naming convention: snake_case in JSON (Python backend) vs camelCase in TypeScript.
//    I added a response interceptor that converts snake_case → camelCase automatically.
//    No manual renaming in every component.
//
// AXIOS INSTANCE (shared config):
const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  timeout: 10000,
});

// Auth interceptor: attach JWT to every request:
api.interceptors.request.use(config => {
  const token = getAccessToken(); // from cookie or memory (not localStorage for security)
  if (token) config.headers.Authorization = \`Bearer \${token}\`;
  return config;
});

// Snake → camelCase transform (agreed with backend team):
api.interceptors.response.use(response => {
  response.data = camelcaseKeys(response.data, { deep: true });
  return response;
});

// Error handler: centralized (not per-component):
api.interceptors.response.use(null, (error: AxiosError<ApiError>) => {
  if (error.response?.status === 401) {
    clearTokens(); router.push("/login"); // session expired
    return Promise.reject(error);
  }
  if (error.response?.status === 422) {
    // Validation error from backend: extract field-level errors.
    // These go to React Hook Form's setError():
    const fieldErrors = error.response.data.error.fields;
    Object.entries(fieldErrors).forEach(([field, message]) => {
      form.setError(field as keyof FormValues, { message });
    });
  }
  return Promise.reject(error); // React Query's onError: handles the rest
});

// TYPE-SAFE API LAYER:
// Define types for each endpoint response.
// No "any". Callers know exactly what shape to expect.
export const postsApi = {
  list: (params: PostListParams): Promise<PaginatedResponse<Post>> =>
    api.get("/posts", { params }).then(r => r.data),
  create: (data: CreatePostInput): Promise<Post> =>
    api.post("/posts", data).then(r => r.data),
  update: (id: string, data: UpdatePostInput): Promise<Post> =>
    api.patch(\`/posts/\${id}\`, data).then(r => r.data),
};
// React Query uses these: useQuery({ queryFn: () => postsApi.list(filters) })
// Single source of truth for API shapes. Backend changes the response?
// Update the type here. TypeScript finds all usages that need updating.`} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default CorePlatformDemo;
