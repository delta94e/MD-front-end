# Next.js Single-Page Applications — Deep Dive!

> **Chủ đề**: SPA — Single-Page Applications Với Next.js!
> **Ngôn ngữ**: Tiếng Việt — giải thích cực kỳ chi tiết!
> **Phương châm**: Tự viết lại bằng tay — KHÔNG dùng thư viện!
> **Nguồn**: https://nextjs.org/docs/app/guides/single-page-applications
> **Lưu ý**: Trang gốc KHÔNG có sơ đồ — tất cả diagrams TỰ VẼ!

---

## Mục Lục

1. [§1. Tổng Quan — SPA Là Gì?](#1)
2. [§2. Tại Sao Next.js Cho SPA?](#2)
3. [§3. Pattern: Server Promise → Context → use()!](#3)
4. [§4. SWR + React Query Integration!](#4)
5. [§5. Browser-Only Rendering + Shallow Routing!](#5)
6. [§6. Server Actions Trong Client Components!](#6)
7. [§7. Static Export — output: 'export'!](#7)
8. [§8. Tự Viết — SPAEngine!](#8)
9. [§9. Câu Hỏi Luyện Tập](#9)

---

## §1. Tổng Quan — SPA Là Gì?

```
  SPA — SINGLE-PAGE APPLICATION:
  ┌────────────────────────────────────────────────────────────┐
  │                                                            │
  │  "STRICT" SPA:                                              │
  │  ┌──────────────────────────────────────────────────────┐  │
  │  │ ① 1 HTML duy nhất (index.html)                      │  │
  │  │ ② TOÀN BỘ routing bằng JavaScript!                 │  │
  │  │ ③ KHÔNG full-page reload!                            │  │
  │  │ ④ JS manipulates DOM + fetch data as needed!         │  │
  │  └──────────────────────────────────────────────────────┘  │
  │                                                            │
  │  TRADITIONAL SPA:        NEXT.JS SPA:                      │
  │  ┌──────────────┐        ┌──────────────┐                  │
  │  │ 1 index.html │        │ Multiple HTML│                  │
  │  │ HUGE JS      │        │ per route!   │                  │
  │  │ bundle!      │        │ Code-split!  │                  │
  │  │ Long load!   │        │ Fast load!   │                  │
  │  │ Client       │        │ Prefetch!    │                  │
  │  │ waterfalls!  │        │ Progressive! │                  │
  │  └──────────────┘        └──────────────┘                  │
  │  😱 Slow initial!       ⚡ Best of both!                 │
  │                                                            │
  │  SPA PROBLEMS:                                              │
  │  ① Large JS bundles → slow initial load!                 │
  │  ② Client data waterfalls → multiple roundtrips!         │
  │  ③ Can't SEO (single HTML!)                               │
  │  → Next.js FIXES ALL OF THESE! ✅                        │
  │                                                            │
  └────────────────────────────────────────────────────────────┘
```

---

## §2. Tại Sao Next.js Cho SPA?

```
  NEXT.JS SPA ADVANTAGES:
  ┌────────────────────────────────────────────────────────────┐
  │                                                            │
  │  ① AUTO CODE-SPLITTING!                                    │
  │  ┌──────────────────────────────────────────────────────┐  │
  │  │ Strict SPA:                                          │  │
  │  │ ┌────────────────────────────────┐                   │  │
  │  │ │ bundle.js (2MB!) — ALL routes  │                   │  │
  │  │ └────────────────────────────────┘                   │  │
  │  │                                                      │  │
  │  │ Next.js SPA:                                         │  │
  │  │ ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐                │  │
  │  │ │ / JS │ │/dash │ │/prof │ │/api  │                │  │
  │  │ │200KB │ │180KB │ │150KB │ │120KB │                │  │
  │  │ └──────┘ └──────┘ └──────┘ └──────┘                │  │
  │  │ → Load CHỈ JS cần cho route hiện tại!             │  │
  │  └──────────────────────────────────────────────────────┘  │
  │                                                            │
  │  ② PREFETCH + FAST TRANSITIONS!                            │
  │  ┌──────────────────────────────────────────────────────┐  │
  │  │ <Link href="/dashboard">                             │  │
  │  │   → Auto-prefetch dashboard JS!                     │  │
  │  │   → Click → INSTANT transition (like strict SPA!)  │  │
  │  │   → URL state persisted! (linkable, shareable!)     │  │
  │  └──────────────────────────────────────────────────────┘  │
  │                                                            │
  │  ③ PROGRESSIVE ADOPTION!                                   │
  │  ┌──────────────────────────────────────────────────────┐  │
  │  │ Start: Static site / Strict SPA (100% client!)       │  │
  │  │   │                                                  │  │
  │  │   ▼ Project grows...                                 │  │
  │  │ Add: React Server Components!                        │  │
  │  │   │                                                  │  │
  │  │   ▼ Need mutations...                                │  │
  │  │ Add: Server Actions!                                 │  │
  │  │   │                                                  │  │
  │  │   ▼ Need auth...                                     │  │
  │  │ Add: Middleware, SSR!                                 │  │
  │  │                                                      │  │
  │  │ → KHÔNG rebuild from scratch! Additive! ✅          │  │
  │  └──────────────────────────────────────────────────────┘  │
  │                                                            │
  └────────────────────────────────────────────────────────────┘
```

---

## §3. Pattern: Server Promise → Context → use()!

```
  DATA FETCHING — ELIMINATE CLIENT WATERFALLS!
  ┌────────────────────────────────────────────────────────────┐
  │                                                            │
  │  STRICT SPA (waterfall):         NEXT.JS SPA (parallel!): │
  │  ┌──────────────────┐           ┌──────────────────┐      │
  │  │ 1. Download HTML │           │ 1. Server starts │      │
  │  │ 2. Download JS   │           │    data fetch!   │      │
  │  │ 3. JS runs       │           │ 2. Stream HTML + │      │
  │  │ 4. THEN fetch!   │           │    JS in parallel│      │
  │  │ 5. THEN render!  │           │ 3. use() unwraps │      │
  │  │ (WATERFALL!) 😱 │           │    Promise! ⚡  │      │
  │  └──────────────────┘           └──────────────────┘      │
  │                                                            │
  │  3-LAYER PATTERN:                                           │
  │                                                            │
  │  Layer 1: ROOT LAYOUT (Server Component!)                  │
  │  ┌──────────────────────────────────────────────────────┐  │
  │  │ // app/layout.tsx (Server Component!)                │  │
  │  │ import { UserProvider } from './user-provider'       │  │
  │  │ import { getUser } from './user'                     │  │
  │  │                                                      │  │
  │  │ export default function RootLayout({ children }) {   │  │
  │  │   let userPromise = getUser() // do NOT await!       │  │
  │  │   return (                                           │  │
  │  │     <html><body>                                     │  │
  │  │       <UserProvider userPromise={userPromise}>       │  │
  │  │         {children}                                   │  │
  │  │       </UserProvider>                                │  │
  │  │     </body></html>                                   │  │
  │  │   )                                                  │  │
  │  │ }                                                    │  │
  │  │ → Server starts fetch EARLY! Pass Promise down!     │  │
  │  └──────────────────────────────────────────────────────┘  │
  │            │ Promise (not awaited!)                        │
  │            ▼                                               │
  │  Layer 2: CONTEXT PROVIDER (Client Component!)             │
  │  ┌──────────────────────────────────────────────────────┐  │
  │  │ 'use client'                                         │  │
  │  │ const UserContext = createContext(null)               │  │
  │  │                                                      │  │
  │  │ export function useUser() {                          │  │
  │  │   const ctx = useContext(UserContext)                 │  │
  │  │   if (!ctx) throw new Error('Need UserProvider!')    │  │
  │  │   return ctx                                         │  │
  │  │ }                                                    │  │
  │  │                                                      │  │
  │  │ export function UserProvider({ children, userPromise │  │
  │  │ }) {                                                 │  │
  │  │   return (                                           │  │
  │  │     <UserContext.Provider value={{ userPromise }}>    │  │
  │  │       {children}                                     │  │
  │  │     </UserContext.Provider>                           │  │
  │  │   )                                                  │  │
  │  │ }                                                    │  │
  │  │ → Pass Promise through context! Any child can use!  │  │
  │  └──────────────────────────────────────────────────────┘  │
  │            │ Promise (via context!)                        │
  │            ▼                                               │
  │  Layer 3: CONSUMER (Client Component!)                     │
  │  ┌──────────────────────────────────────────────────────┐  │
  │  │ 'use client'                                         │  │
  │  │ import { use } from 'react'                          │  │
  │  │ import { useUser } from './user-provider'            │  │
  │  │                                                      │  │
  │  │ export function Profile() {                          │  │
  │  │   const { userPromise } = useUser()                  │  │
  │  │   const user = use(userPromise) // SUSPENDS here!    │  │
  │  │   return <div>{user.name}</div>                      │  │
  │  │ }                                                    │  │
  │  │ → use() unwraps Promise → component suspended!     │  │
  │  │ → Partial hydration: HTML visible before JS loads! │  │
  │  └──────────────────────────────────────────────────────┘  │
  │                                                            │
  │  FLOW:                                                      │
  │  Server ──fetch──► Promise ──pass──► Context ──use()──►   │
  │  Data!              (not await!)       Provider     render! │
  │                                                            │
  └────────────────────────────────────────────────────────────┘
```

---

## §4. SWR + React Query Integration!

```
  SWR 2.3.0 — GRADUAL SERVER ADOPTION!
  ┌────────────────────────────────────────────────────────────┐
  │                                                            │
  │  3 MODES:                                                   │
  │  ┌──────────────────┬──────────────────────────────────┐   │
  │  │ Mode             │ Code                             │   │
  │  ├──────────────────┼──────────────────────────────────┤   │
  │  │ Client-only      │ useSWR(key, fetcher)             │   │
  │  │ Server-only      │ useSWR(key) + RSC fallback       │   │
  │  │ Mixed!           │ useSWR(key, fetcher) + fallback  │   │
  │  └──────────────────┴──────────────────────────────────┘   │
  │                                                            │
  │  SERVER SIDE (Root Layout):                                 │
  │  ┌──────────────────────────────────────────────────────┐  │
  │  │ import { SWRConfig } from 'swr'                      │  │
  │  │ import { getUser } from './user'                     │  │
  │  │                                                      │  │
  │  │ export default function RootLayout({ children }) {   │  │
  │  │   return (                                           │  │
  │  │     <SWRConfig value={{                              │  │
  │  │       fallback: {                                    │  │
  │  │         '/api/user': getUser(), // NOT awaited!      │  │
  │  │       },                                             │  │
  │  │     }}>                                              │  │
  │  │       {children}                                     │  │
  │  │     </SWRConfig>                                     │  │
  │  │   )                                                  │  │
  │  │ }                                                    │  │
  │  │                                                      │  │
  │  │ → getUser() runs on SERVER!                         │  │
  │  │ → Can read cookies, headers, DB directly!           │  │
  │  │ → No separate API route needed!                     │  │
  │  └──────────────────────────────────────────────────────┘  │
  │                                                            │
  │  CLIENT SIDE (NO CHANGES from existing SWR code!):         │
  │  ┌──────────────────────────────────────────────────────┐  │
  │  │ 'use client'                                         │  │
  │  │ import useSWR from 'swr'                             │  │
  │  │                                                      │  │
  │  │ export function Profile() {                          │  │
  │  │   const fetcher = (url) => fetch(url).then(r=>r.json │  │
  │  │())                                                   │  │
  │  │   const { data, error } = useSWR('/api/user', fetcher│  │
  │  │)                                                     │  │
  │  │   return '...'                                       │  │
  │  │ }                                                    │  │
  │  │                                                      │  │
  │  │ → SAME CODE! No changes! 👍                        │  │
  │  │ → fallback data prerendered in initial HTML!        │  │
  │  │ → Polling + revalidation still client-side!         │  │
  │  │ → Suspense boundary handles loading! <Suspense>     │  │
  │  └──────────────────────────────────────────────────────┘  │
  │                                                            │
  │  REACT QUERY: Also supports client + server!               │
  │  → tanstack.com/query/latest/docs/framework/react/         │
  │    guides/advanced-ssr                                     │
  │                                                            │
  └────────────────────────────────────────────────────────────┘
```

---

## §5. Browser-Only Rendering + Shallow Routing!

```
  BROWSER-ONLY RENDERING:
  ┌──────────────────────────────────────────────────────────┐
  │                                                          │
  │  VẤN ĐỀ: Client Component vẫn PRERENDER lúc build!   │
  │  → window, document KHÔNG tồn tại trên server!        │
  │  → 3rd party libs dùng browser APIs → lỗi!           │
  │                                                          │
  │  FIX: next/dynamic + ssr: false!                          │
  │  ┌──────────────────────────────────────────────────────┐│
  │  │ import dynamic from 'next/dynamic'                   ││
  │  │                                                      ││
  │  │ const ClientOnlyComponent = dynamic(                 ││
  │  │   () => import('./component'),                       ││
  │  │   { ssr: false }  // ← SKIP SERVER PRERENDER!      ││
  │  │ )                                                    ││
  │  │                                                      ││
  │  │ → Component CHỈ render trong BROWSER!              ││
  │  │ → Useful: maps, charts, canvas libraries!          ││
  │  └──────────────────────────────────────────────────────┘│
  │                                                          │
  │  ALT: useEffect check!                                    │
  │  if (typeof window === 'undefined') return null           │
  │                                                          │
  └──────────────────────────────────────────────────────────┘
```

```
  SHALLOW ROUTING — UPDATE URL WITHOUT RELOAD!
  ┌──────────────────────────────────────────────────────────┐
  │                                                          │
  │  window.history.pushState / replaceState!                 │
  │  → Integrates with Next.js Router!                      │
  │  → Syncs with usePathname + useSearchParams!            │
  │                                                          │
  │  EXAMPLE: Sort Products!                                  │
  │  ┌──────────────────────────────────────────────────────┐│
  │  │ 'use client'                                         ││
  │  │ import { useSearchParams } from 'next/navigation'    ││
  │  │                                                      ││
  │  │ export default function SortProducts() {             ││
  │  │   const searchParams = useSearchParams()             ││
  │  │                                                      ││
  │  │   function updateSorting(sortOrder) {                ││
  │  │     const params = new URLSearchParams(              ││
  │  │       searchParams.toString()                        ││
  │  │     )                                                ││
  │  │     params.set('sort', sortOrder)                    ││
  │  │     window.history.pushState(                        ││
  │  │       null, '', `?${params.toString()}`              ││
  │  │     )                                                ││
  │  │   }                                                  ││
  │  │                                                      ││
  │  │   return (                                           ││
  │  │     <>                                               ││
  │  │       <button onClick={() => updateSorting('asc')}>  ││
  │  │         Sort Ascending                               ││
  │  │       </button>                                      ││
  │  │       <button onClick={() => updateSorting('desc')}> ││
  │  │         Sort Descending                              ││
  │  │       </button>                                      ││
  │  │     </>                                              ││
  │  │   )                                                  ││
  │  │ }                                                    ││
  │  └──────────────────────────────────────────────────────┘│
  │                                                          │
  │  FLOW:                                                    │
  │  Click ─► pushState ─► URL update ─► useSearchParams   │
  │           (no reload!)  (?sort=asc)    re-reads! ✅      │
  │                                                          │
  └──────────────────────────────────────────────────────────┘
```

---

## §6. Server Actions Trong Client Components!

```
  SERVER ACTIONS — NO API ROUTES NEEDED!
  ┌──────────────────────────────────────────────────────────┐
  │                                                          │
  │  TRADITIONAL SPA:        NEXT.JS SPA:                    │
  │  ┌──────────────────┐    ┌──────────────────┐            │
  │  │ Client Component │    │ Client Component │            │
  │  │ ↓ fetch()       │    │ ↓ import action │            │
  │  │ API Route        │    │ Server Action    │            │
  │  │ ↓               │    │ (direct call!)   │            │
  │  │ Database         │    │ ↓               │            │
  │  │                  │    │ Database          │            │
  │  │ BOILERPLATE! 😱 │    │ SIMPLE! ✅       │            │
  │  └──────────────────┘    └──────────────────┘            │
  │                                                          │
  │  Server Action:                                           │
  │  ┌──────────────────────────────────────────────────────┐│
  │  │ // actions.ts                                        ││
  │  │ 'use server'                                         ││
  │  │                                                      ││
  │  │ export async function create() {                     ││
  │  │   // Access DB, send email, etc!                     ││
  │  │ }                                                    ││
  │  └──────────────────────────────────────────────────────┘│
  │                                                          │
  │  Client Component:                                        │
  │  ┌──────────────────────────────────────────────────────┐│
  │  │ 'use client'                                         ││
  │  │ import { create } from './actions'                   ││
  │  │                                                      ││
  │  │ export function Button() {                           ││
  │  │   return (                                           ││
  │  │     <button onClick={() => create()}>                ││
  │  │       Create                                         ││
  │  │     </button>                                        ││
  │  │   )                                                  ││
  │  │ }                                                    ││
  │  │                                                      ││
  │  │ → Import like a JS function!                        ││
  │  │ → No API endpoint manually!                         ││
  │  │ → useActionState for loading/error! 🎉             ││
  │  └──────────────────────────────────────────────────────┘│
  │                                                          │
  └──────────────────────────────────────────────────────────┘
```

---

## §7. Static Export — output: 'export'!

```
  STATIC EXPORT:
  ┌────────────────────────────────────────────────────────────┐
  │                                                            │
  │  STRICT SPA:             NEXT.JS STATIC EXPORT:            │
  │  ┌──────────────┐       ┌──────────────┐                   │
  │  │ 1 index.html │       │ HTML per     │                   │
  │  │ for ALL      │       │ route!       │                   │
  │  │ routes!      │       │ /index.html  │                   │
  │  │              │       │ /dash.html   │                   │
  │  │              │       │ /prof.html   │                   │
  │  └──────────────┘       └──────────────┘                   │
  │  Slow first paint!      ⚡ Content FAST!                  │
  │                                                            │
  │  BENEFITS:                                                  │
  │  ① Auto code-split per route!                             │
  │  ② Fully rendered HTML per route! (no skeleton!)           │
  │  ③ Client-side nav still INSTANT (SPA-like!)               │
  │                                                            │
  │  CONFIG:                                                    │
  │  ┌──────────────────────────────────────────────────────┐  │
  │  │ // next.config.ts                                    │  │
  │  │ const nextConfig = {                                 │  │
  │  │   output: 'export',  // ← Static export!           │  │
  │  │ }                                                    │  │
  │  │ export default nextConfig                            │  │
  │  └──────────────────────────────────────────────────────┘  │
  │                                                            │
  │  BUILD:                                                     │
  │  next build → out/ folder!                                │
  │  ┌──────────────────────────────────────────────────────┐  │
  │  │ out/                                                 │  │
  │  │ ├── index.html        (/ route!)                    │  │
  │  │ ├── dashboard.html    (/dashboard route!)           │  │
  │  │ ├── profile.html      (/profile route!)             │  │
  │  │ ├── _next/                                           │  │
  │  │ │   ├── static/       (JS bundles!)                 │  │
  │  │ │   └── chunks/       (code-split!)                 │  │
  │  │ └── ...                                              │  │
  │  └──────────────────────────────────────────────────────┘  │
  │                                                            │
  │  ⚠️ Server features NOT supported with static export!    │
  │  → No Server Components, Server Actions, Middleware!      │
  │  → No ISR, no dynamic rendering!                          │
  │                                                            │
  │  MIGRATION:                                                 │
  │  → From CRA: nextjs.org/docs/.../migrating/from-cra      │
  │  → From Vite: nextjs.org/docs/.../migrating/from-vite    │
  │  → From Pages Router: incremental App Router adoption!    │
  │                                                            │
  └────────────────────────────────────────────────────────────┘
```

---

## §8. Tự Viết — SPAEngine!

```javascript
var SPAEngine = (function () {
  // ═══════════════════════════════════
  // 1. PROMISE CONTEXT PATTERN
  // ═══════════════════════════════════
  var contexts = {};

  function createServerPromise(key, fetchFn) {
    // Server starts data fetch EARLY — NOT awaited!
    var promise = new Promise(function (resolve) {
      setTimeout(function () {
        resolve(fetchFn());
      }, 100); // simulate server fetch
    });
    contexts[key] = { promise: promise, resolved: false, value: null };
    return promise;
  }

  function usePromise(key) {
    var ctx = contexts[key];
    if (!ctx) throw new Error('Context "' + key + '" not found!');

    if (ctx.resolved) return ctx.value;

    // Simulate React use() — suspend until resolved!
    throw ctx.promise.then(function (val) {
      ctx.resolved = true;
      ctx.value = val;
    });
  }

  // ═══════════════════════════════════
  // 2. SWR FALLBACK SIMULATOR
  // ═══════════════════════════════════
  var swrCache = {};
  var swrFallback = {};

  function setSWRFallback(key, serverFn) {
    // Server provides fallback (NOT awaited!)
    swrFallback[key] = { promise: serverFn, resolved: false };
  }

  function useSWR(key, fetcher) {
    // Check fallback first (server-provided!)
    if (swrFallback[key] && !swrFallback[key].resolved) {
      var val = swrFallback[key].promise();
      swrCache[key] = val;
      swrFallback[key].resolved = true;
      return { data: val, source: "SERVER fallback!" };
    }

    // Check cache
    if (swrCache[key]) {
      return { data: swrCache[key], source: "CACHE!" };
    }

    // Client fetch
    if (fetcher) {
      var data = fetcher(key);
      swrCache[key] = data;
      return { data: data, source: "CLIENT fetch!" };
    }

    return { data: null, source: "NO DATA!" };
  }

  // ═══════════════════════════════════
  // 3. SHALLOW ROUTER
  // ═══════════════════════════════════
  var currentPath = "/";
  var searchParams = {};
  var historyStack = ["/"];

  function pushState(path, params) {
    currentPath = path || currentPath;
    if (params) {
      for (var key in params) searchParams[key] = params[key];
    }
    var url = currentPath;
    var paramStr = [];
    for (var k in searchParams) {
      paramStr.push(k + "=" + searchParams[k]);
    }
    if (paramStr.length) url += "?" + paramStr.join("&");
    historyStack.push(url);

    return {
      url: url,
      method: "pushState",
      reload: false,
      note: "NO page reload! URL updated only!",
    };
  }

  function useSearchParams() {
    return Object.assign({}, searchParams);
  }

  // ═══════════════════════════════════
  // 4. CODE SPLITTER
  // ═══════════════════════════════════
  function codeSplit(routes) {
    var chunks = {};
    var totalSize = 0;

    for (var i = 0; i < routes.length; i++) {
      var r = routes[i];
      chunks[r.path] = {
        path: r.path,
        size: r.size,
        loaded: false,
      };
      totalSize += r.size;
    }

    return {
      strictSPA: { bundleSize: totalSize + "KB", files: 1 },
      nextSPA: {
        chunks: Object.keys(chunks).length,
        perRoute: chunks,
        note: "Load ONLY current route chunk!",
      },
    };
  }

  // ═══════════════════════════════════
  // 5. STATIC EXPORT GENERATOR
  // ═══════════════════════════════════
  function staticExport(routes) {
    var output = { files: [] };
    for (var i = 0; i < routes.length; i++) {
      var r = routes[i];
      var filename =
        r === "/" ? "index.html" : r.slice(1).replace(/\//g, "-") + ".html";
      output.files.push({
        route: r,
        file: "out/" + filename,
        type: "HTML (prerendered!)",
      });
    }
    output.files.push({ file: "out/_next/static/", type: "JS bundles" });
    return output;
  }

  // ═══════════════════════════════════
  // 6. DEMO
  // ═══════════════════════════════════
  function demo() {
    console.log("╔════════════════════════════════════╗");
    console.log("║  SPA ENGINE DEMO                    ║");
    console.log("╚════════════════════════════════════╝");

    // Code splitting
    console.log("\n── Code Splitting ──");
    var split = codeSplit([
      { path: "/", size: 200 },
      { path: "/dashboard", size: 180 },
      { path: "/profile", size: 150 },
    ]);
    console.log("  Strict SPA:", split.strictSPA);
    console.log("  Next.js:", split.nextSPA);

    // SWR fallback
    console.log("\n── SWR Fallback ──");
    setSWRFallback("/api/user", function () {
      return { name: "Jun", role: "admin" };
    });
    console.log("  First call:", useSWR("/api/user"));
    console.log("  Cached call:", useSWR("/api/user"));
    console.log(
      "  Client fetch:",
      useSWR("/api/posts", function () {
        return [{ id: 1, title: "Post 1" }];
      }),
    );

    // Shallow routing
    console.log("\n── Shallow Routing ──");
    console.log("  Push:", pushState("/products", { sort: "asc" }));
    console.log("  Push:", pushState(null, { page: "2" }));
    console.log("  Params:", useSearchParams());
    console.log("  History:", historyStack);

    // Static export
    console.log("\n── Static Export ──");
    var exported = staticExport(["/", "/dashboard", "/profile", "/settings"]);
    for (var i = 0; i < exported.files.length; i++) {
      console.log(
        "  " + (exported.files[i].route || "") + " → " + exported.files[i].file,
      );
    }
  }

  return { demo: demo };
})();
// Chạy: SPAEngine.demo();
```

---

## §9. Câu Hỏi Luyện Tập!

**Câu 1**: Strict SPA vs Next.js SPA — 3 vấn đề chính Next.js giải quyết?

<details><summary>Đáp án</summary>

| Vấn đề Strict SPA                             | Next.js Fix                                                     |
| --------------------------------------------- | --------------------------------------------------------------- |
| **Large JS bundle** (1 file cho ALL routes!)  | Auto **code-splitting** per route! Load chỉ cần!                |
| **Client waterfalls** (HTML→JS→fetch→render!) | Server starts fetch **EARLY** → pass Promise → `use()` unwraps! |
| **No SEO** (1 empty HTML!)                    | Multiple HTML per route! Prerendered content!                   |

**Bonus**: Next.js giữ SPA feel (instant transitions, prefetch) + thêm server power (RSC, Server Actions) khi cần!

</details>

---

**Câu 2**: Promise→Context→use() pattern — tại sao KHÔNG await Promise trong layout?

<details><summary>Đáp án</summary>

**Nếu `await`**: Server **BLOCKS** cho đến khi data ready → client chờ → CHẬM!

**Nếu KHÔNG `await`** (pass Promise!):

1. Server **starts** fetch immediately (early!)
2. Server **streams** HTML + JS **in parallel** with data fetch!
3. Client component `use(promise)` → **Suspense** handles loading!
4. Component **suspended** cho đến khi Promise resolves!
5. → **Partial hydration**: HTML visible BEFORE JS loads!

```
await:   Server ──[wait 500ms]──► Send HTML ──► Client sees content
         ⚠️ Blocked!

No await: Server ──► Send HTML+JS immediately! ──► Stream data later!
          ⚡ Fast!  Client sees skeleton → then real content!
```

</details>

---

**Câu 3**: SWR fallback — tại sao existing client code KHÔNG cần thay đổi?

<details><summary>Đáp án</summary>

```
Existing code:
  const { data } = useSWR('/api/user', fetcher)
  // Works exactly the same! ✅

What happens behind the scenes:
1. Server: SWRConfig fallback provides data for '/api/user'
2. Initial HTML: fallback data PRERENDERED! (no skeleton!)
3. Client: useSWR reads fallback → data immediately available!
4. Client: polling, revalidation, caching still CLIENT-SIDE!

Before: data could be undefined initially → conditional checks!
After:  fallback handles initial state → delete conditional checks!
```

→ **Zero client code changes!** SWR 2.3.0 abstraction of `use()` pattern!

</details>

---

**Câu 4**: `ssr: false` trong next/dynamic — khi nào dùng?

<details><summary>Đáp án</summary>

**Khi nào**: Component dùng **browser-only APIs** (`window`, `document`, `navigator`):

- Map libraries (Leaflet, Mapbox!)
- Canvas/WebGL (Three.js!)
- Browser storage (localStorage!)
- 3rd party scripts (editor, rich text!)

**Cách hoạt động**:

```tsx
const MapComponent = dynamic(
  () => import("./Map"),
  { ssr: false }, // ← Skip server prerender!
);
```

→ Component **KHÔNG render** lúc `next build` (server!)
→ CHỈ render khi **browser** loads JS!
→ Alt: `useEffect` + `typeof window !== 'undefined'` check!

</details>
