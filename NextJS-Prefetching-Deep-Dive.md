# Next.js Prefetching — Deep Dive!

> **Chủ đề**: Prefetching — Navigation Tức Thì!
> **Ngôn ngữ**: Tiếng Việt — giải thích cực kỳ chi tiết!
> **Phương châm**: Tự viết lại bằng tay — KHÔNG dùng thư viện!
> **Nguồn**: https://nextjs.org/docs/app/guides/prefetching
> **Lưu ý**: Trang gốc KHÔNG có sơ đồ — tất cả diagrams TỰ VẼ!

---

## Mục Lục

1. [§1. Tổng Quan — Prefetching Là Gì?](#1)
2. [§2. Static vs Dynamic Routes — Prefetch Khác Nhau!](#2)
3. [§3. 5 Prefetch Patterns!](#3)
4. [§4. Optimizations — Cache + Scheduling + PPR!](#4)
5. [§5. Troubleshooting — Side Effects + Too Many Prefetches!](#5)
6. [§6. Tự Viết — PrefetchEngine!](#6)
7. [§7. Câu Hỏi Luyện Tập](#7)

---

## §1. Tổng Quan — Prefetching Là Gì?

```
  PREFETCHING = LOAD TRƯỚC KHI NAVIGATE!
  ┌────────────────────────────────────────────────────────────┐
  │                                                            │
  │  KHÔNG PREFETCH (truyền thống):                            │
  │  ┌──────────┐  Click  ┌──────────┐  Wait  ┌──────────┐    │
  │  │ Page A   │ ═══════►│ Loading  │ ═════►│ Page B   │    │
  │  │          │         │ ⏳ ...   │        │ ✓ Done  │    │
  │  └──────────┘         └──────────┘        └──────────┘    │
  │  User thấy: spinner + delay 1-3 giây! 😩                │
  │                                                            │
  │  CÓ PREFETCH (Next.js!):                                  │
  │  ┌──────────┐  View  ┌──────────┐  Click  ┌──────────┐   │
  │  │ Page A   │ ══════►│ Prefetch │ ═════►│ Page B   │   │
  │  │ <Link>   │  link  │ (nền!)   │ instant│ ✓ Done  │   │
  │  │ visible! │        │ JS+RSC   │  ⚡   │          │   │
  │  └──────────┘        └──────────┘        └──────────┘   │
  │  User thấy: chuyển trang TỨC THÌ! 🎉                  │
  │                                                            │
  │  CƠ CHẾ:                                                  │
  │  ① Code Splitting: Chia app thành JS chunks per route!   │
  │  ② Only load current route code (không load tất cả!)   │
  │  ③ Background prefetch: load routes khác ngầm!          │
  │  ④ Click → resources ĐÃ TRONG CACHE → instant!        │
  │  ⑤ Client-side transition: không full page reload!        │
  │                                                            │
  └────────────────────────────────────────────────────────────┘
```

```
  INITIAL vs SUBSEQUENT NAVIGATION:
  ┌──────────────────────────────────────────────────────────┐
  │                                                          │
  │  INITIAL NAVIGATION (lần đầu vào site):                │
  │  Browser tải: HTML + JavaScript + RSC Payload            │
  │                                                          │
  │  SUBSEQUENT NAVIGATION (chuyển trang trong site):        │
  │  Browser chỉ tải:                                      │
  │  → RSC Payload (Server Components)                      │
  │  → JS Bundle (Client Components)                        │
  │  → KHÔNG tải lại HTML! (client-side transition!)       │
  │                                                          │
  │  ┌───────────────────┬────────────────────────────────┐  │
  │  │                   │ Tải gì?                       │  │
  │  ├───────────────────┼────────────────────────────────┤  │
  │  │ Initial           │ HTML + JS + RSC Payload        │  │
  │  │ Subsequent        │ RSC Payload + JS Bundle only   │  │
  │  │ (prefetched!)     │ (đã cache → instant!)        │  │
  │  └───────────────────┴────────────────────────────────┘  │
  │                                                          │
  └──────────────────────────────────────────────────────────┘
```

---

## §2. Static vs Dynamic Routes — Prefetch Khác Nhau!

```
  STATIC vs DYNAMIC PREFETCHING:
  ┌────────────────────────────────────────────────────────────┐
  │                                                            │
  │  ┌─────────────────┬──────────────────────────────────┐    │
  │  │                 │ Static Route    │ Dynamic Route  │    │
  │  ├─────────────────┼─────────────────┼────────────────┤    │
  │  │ Prefetch gì?   │ FULL page!      │ Chỉ tới      │    │
  │  │                 │ Toàn bộ route  │ loading.js!   │    │
  │  │                 │ được prefetch  │ (shared layout │    │
  │  │                 │                 │ + loading      │    │
  │  │                 │                 │ boundary!)     │    │
  │  │ Tốc độ nav    │ Instant! ⚡    │ Loading state  │    │
  │  │                 │                 │ → data load  │    │
  │  │ Cache TTL       │ Configurable    │ N/A           │    │
  │  │                 │ (staleTimes)    │                │    │
  │  │ Ví dụ          │ /about          │ /products/[id] │    │
  │  │                 │ /contact        │ /dashboard     │    │
  │  └─────────────────┴─────────────────┴────────────────┘    │
  │                                                            │
  │  STATIC ROUTE — PREFETCH TIMELINE:                          │
  │  ┌───────┐ viewport ┌──────────┐ click ┌──────────┐       │
  │  │<Link> │ ═══════►│ Prefetch │ ════►│ Page B   │       │
  │  │ về   │  auto   │ FULL     │  ⚡  │ ✅ Done  │       │
  │  │ /about│  fetch  │ /about   │ 0ms! │ (cached!)│       │
  │  └───────┘         └──────────┘      └──────────┘       │
  │                                                            │
  │  DYNAMIC ROUTE — PREFETCH TIMELINE:                         │
  │  ┌───────┐ viewport ┌──────────┐ click ┌──────────┐       │
  │  │<Link> │ ═══════►│ Prefetch │ ════►│ Loading  │       │
  │  │  về  │  auto   │ layout + │  ⚡  │ skeleton │       │
  │  │/dash  │  fetch  │ loading  │ fast │ → data  │       │
  │  └───────┘         └──────────┘      │ → Page! │       │
  │                                       └──────────┘       │
  │                                                            │
  └────────────────────────────────────────────────────────────┘
```

---

## §3. 5 Prefetch Patterns!

```
  PATTERN 1: AUTOMATIC PREFETCH (default!)
  ┌──────────────────────────────────────────────────────────┐
  │                                                          │
  │  import Link from 'next/link'                            │
  │                                                          │
  │  export default function Nav() {                         │
  │    return <Link href="/about">About</Link>               │
  │  }                                                       │
  │                                                          │
  │  BEHAVIOR:                                                │
  │  → <Link> vào viewport → TỰ ĐỘNG prefetch!           │
  │  → Static routes: prefetch FULL page!                   │
  │  → Dynamic routes: prefetch tới loading.js boundary!  │
  │  → Cache TTL: configurable (staleTimes!)                 │
  │  → CHỈ chạy trong PRODUCTION!                          │
  │  → Development: KHÔNG prefetch!                         │
  │                                                          │
  └──────────────────────────────────────────────────────────┘
```

```
  PATTERN 2: MANUAL PREFETCH (router.prefetch!)
  ┌──────────────────────────────────────────────────────────┐
  │                                                          │
  │  'use client'                                            │
  │  import { useRouter } from 'next/navigation'             │
  │  import { CustomLink } from '@components/link'           │
  │                                                          │
  │  export function PricingCard() {                         │
  │    const router = useRouter()                            │
  │    return (                                              │
  │      <div onMouseEnter={                                 │
  │        () => router.prefetch('/pricing')                 │
  │      }>                                                  │
  │        <CustomLink href="/pricing">                      │
  │          View Pricing                                    │
  │        </CustomLink>                                     │
  │      </div>                                              │
  │    )                                                     │
  │  }                                                       │
  │                                                          │
  │  KHI NÀO DÙNG:                                           │
  │  → Custom components (không phải <Link>!)              │
  │  → Prefetch on hover, scroll, analytics events          │
  │  → Routes ngoài viewport!                              │
  │                                                          │
  └──────────────────────────────────────────────────────────┘
```

```
  PATTERN 3: HOVER-TRIGGERED PREFETCH!
  ┌──────────────────────────────────────────────────────────┐
  │                                                          │
  │  'use client'                                            │
  │  import Link from 'next/link'                            │
  │  import { useState } from 'react'                        │
  │                                                          │
  │  export function HoverPrefetchLink({ href, children }) { │
  │    const [active, setActive] = useState(false)           │
  │    return (                                              │
  │      <Link                                               │
  │        href={href}                                       │
  │        prefetch={active ? null : false}                  │
  │        onMouseEnter={() => setActive(true)}              │
  │      >                                                   │
  │        {children}                                        │
  │      </Link>                                             │
  │    )                                                     │
  │  }                                                       │
  │                                                          │
  │  FLOW:                                                    │
  │  ┌─────────┐ render ┌──────────┐ hover ┌──────────┐     │
  │  │ Link    │ ═════►│ prefetch │ ════►│ prefetch │     │
  │  │ render  │       │ = false  │      │ = null   │     │
  │  │         │       │ (OFF!)   │      │ (DEFAULT │     │
  │  │         │       │          │      │  restored│     │
  │  │         │       │          │      │  → fetch!)│    │
  │  └─────────┘       └──────────┘      └──────────┘     │
  │                                                          │
  │  KEY:                                                     │
  │  → prefetch={false}: KHÔNG prefetch khi viewport!      │
  │  → prefetch={null}: RESTORE default behavior!           │
  │  → Hover → setActive(true) → null → prefetch!       │
  │  → Tiết kiệm bandwidth: chỉ prefetch links có ý định! │
  │                                                          │
  └──────────────────────────────────────────────────────────┘
```

```
  PATTERN 4: EXTENDING/EJECTING LINK!
  ┌──────────────────────────────────────────────────────────┐
  │                                                          │
  │  'use client'                                            │
  │  import { useRouter } from 'next/navigation'             │
  │  import { useEffect } from 'react'                       │
  │                                                          │
  │  function ManualPrefetchLink({ href, children }) {       │
  │    const router = useRouter()                            │
  │                                                          │
  │    useEffect(() => {                                     │
  │      let cancelled = false                               │
  │      const poll = () => {                                │
  │        if (!cancelled)                                   │
  │          router.prefetch(href, {                         │
  │            onInvalidate: poll  // ← Re-prefetch!       │
  │          })                                              │
  │      }                                                   │
  │      poll()                                              │
  │      return () => { cancelled = true }                   │
  │    }, [href, router])                                    │
  │                                                          │
  │    return (                                              │
  │      <a href={href}                                      │
  │         onClick={(e) => {                                │
  │           e.preventDefault()                             │
  │           router.push(href)                              │
  │         }}                                               │
  │      >                                                   │
  │        {children}                                        │
  │      </a>                                                │
  │    )                                                     │
  │  }                                                       │
  │                                                          │
  │  FEATURES:                                                │
  │  → onInvalidate: khi data STALE → re-prefetch!        │
  │  → Polling pattern: luôn giữ cache fresh!              │
  │  → <a> + onClick + e.preventDefault() + router.push()  │
  │    = giả lập <Link> behavior!                         │
  │  → ⚠️ CAUTION: phải tự maintain prefetch + cache     │
  │    invalidation + accessibility!                         │
  │                                                          │
  └──────────────────────────────────────────────────────────┘
```

```
  PATTERN 5: DISABLED PREFETCH!
  ┌──────────────────────────────────────────────────────────┐
  │                                                          │
  │  'use client'                                            │
  │  import Link, { LinkProps } from 'next/link'             │
  │                                                          │
  │  function NoPrefetchLink({                               │
  │    prefetch, ...rest                                     │
  │  }: LinkProps & { children: React.ReactNode }) {         │
  │    return <Link {...rest} prefetch={false} />            │
  │  }                                                       │
  │                                                          │
  │  KHI NÀO DÙNG:                                           │
  │  → Footer links (ít khi navigate!)                     │
  │  → Infinite scroll tables (hàng trăm links!)           │
  │  → Links ít quan trọng!                                │
  │                                                          │
  │  ⚠️ TRADEOFF:                                           │
  │  → Static routes: chỉ fetch KHI CLICK (chậm hơn!)   │
  │  → Dynamic routes: wait server render rồi navigate!   │
  │  → Tốt cho resource savings, xấu cho perceived speed! │
  │                                                          │
  └──────────────────────────────────────────────────────────┘
```

```
  SO SÁNH 5 PATTERNS:
  ┌────────────────────────────────────────────────────────────┐
  │                                                            │
  │  ┌────────────┬────────────┬────────────┬───────────────┐  │
  │  │ Pattern    │ Trigger    │ Resource   │ Speed         │  │
  │  ├────────────┼────────────┼────────────┼───────────────┤  │
  │  │ Automatic  │ Viewport   │ Cao       │ Instant ⚡   │  │
  │  │ Manual     │ Code       │ Controlled │ Custom        │  │
  │  │ Hover      │ Mouse      │ Thấp     │ Fast          │  │
  │  │ Extending  │ Mount      │ Medium     │ Always fresh  │  │
  │  │ Disabled   │ Click only │ Rất thấp│ Chậm nhất   │  │
  │  └────────────┴────────────┴────────────┴───────────────┘  │
  │                                                            │
  └────────────────────────────────────────────────────────────┘
```

---

## §4. Optimizations — Cache + Scheduling + PPR!

```
  OPTIMIZATION 1: CLIENT CACHE!
  ┌──────────────────────────────────────────────────────────┐
  │                                                          │
  │  Next.js cache RSC Payloads trong MEMORY!                │
  │  Key: route segments!                                     │
  │                                                          │
  │  VÍ DỤ: /dashboard/settings → /dashboard/analytics     │
  │  ┌──────────────────────────────────────────────────┐    │
  │  │                                                  │    │
  │  │  /dashboard (SHARED LAYOUT!)                     │    │
  │  │  ├── /settings (leaf page)                       │    │
  │  │  └── /analytics (leaf page)                      │    │
  │  │                                                  │    │
  │  │  Navigate: /settings → /analytics                │    │
  │  │  → REUSE: /dashboard layout (cached!)           │    │
  │  │  → FETCH: chỉ /analytics leaf page!            │    │
  │  │  → Giảm network traffic!                       │    │
  │  │  → Tăng tốc navigation!                        │    │
  │  │                                                  │    │
  │  └──────────────────────────────────────────────────┘    │
  │                                                          │
  └──────────────────────────────────────────────────────────┘
```

```
  OPTIMIZATION 2: PREFETCH SCHEDULING!
  ┌──────────────────────────────────────────────────────────┐
  │                                                          │
  │  Next.js dùng TASK QUEUE để quản lý prefetch!           │
  │                                                          │
  │  PRIORITY ORDER:                                          │
  │  ┌──────┬──────────────────────────────────────────┐     │
  │  │ #    │ Rule                                     │     │
  │  ├──────┼──────────────────────────────────────────┤     │
  │  │ 1st  │ Links TRONG viewport!                    │     │
  │  │ 2nd  │ Links showing user INTENT (hover/touch!) │     │
  │  │ 3rd  │ NEWER links replace OLDER ones!          │     │
  │  │ 4th  │ Links SCROLLED OFF-SCREEN → DISCARD!   │     │
  │  └──────┴──────────────────────────────────────────┘     │
  │                                                          │
  │  → Prioritize: likely navigations!                      │
  │  → Minimize: unused downloads!                          │
  │  → Smart: scroll away → cancel prefetch → save BWs!  │
  │                                                          │
  └──────────────────────────────────────────────────────────┘
```

```
  OPTIMIZATION 3: PARTIAL PRERENDERING (PPR)!
  ┌──────────────────────────────────────────────────────────┐
  │                                                          │
  │  PPR = Static Shell + Dynamic Streaming!                  │
  │                                                          │
  │  ┌──────────────────────────────────────────────────┐    │
  │  │  Page with PPR:                                  │    │
  │  │  ┌──────────────────────────────────────────┐    │    │
  │  │  │ STATIC SHELL (prefetchable!)             │    │    │
  │  │  │ → Header, nav, layout, static content   │    │    │
  │  │  │ → Streams IMMEDIATELY!                   │    │    │
  │  │  ├──────────────────────────────────────────┤    │    │
  │  │  │ DYNAMIC SECTION (streamed later!)        │    │    │
  │  │  │ → User-specific data, real-time content  │    │    │
  │  │  │ → Streams WHEN READY!                    │    │    │
  │  │  └──────────────────────────────────────────┘    │    │
  │  └──────────────────────────────────────────────────┘    │
  │                                                          │
  │  PREFETCH + PPR:                                          │
  │  → Shell ĐÃ prefetch → navigate = INSTANT shell!     │
  │  → Dynamic data stream vào sau → progressive render!  │
  │  → Data invalidations (revalidateTag, revalidatePath)   │
  │    → SILENTLY refresh prefetches! (user không biết!)  │
  │                                                          │
  └──────────────────────────────────────────────────────────┘
```

---

## §5. Troubleshooting — Side Effects + Too Many Prefetches!

```
  PROBLEM 1: SIDE EFFECTS DURING PREFETCH!
  ┌──────────────────────────────────────────────────────────┐
  │                                                          │
  │  VẤN ĐỀ: Analytics tracking trong layout/page          │
  │  → Layout/Page render → side effect chạy!             │
  │  → NHƯNG prefetch CŨNG render → tracking chạy nhầm! │
  │  → User chưa visit page mà analytics đã ghi lại! 😱 │
  │                                                          │
  │  ❌ TRƯỚC (side effect trong Server Component!):        │
  │  ┌──────────────────────────────────────────────────┐    │
  │  │ // layout.tsx                                    │    │
  │  │ import { trackPageView } from '@/lib/analytics'  │    │
  │  │                                                  │    │
  │  │ export default function Layout({ children }) {   │    │
  │  │   trackPageView()  // ← CHẠY KHI PREFETCH! 💥 │    │
  │  │   return <div>{children}</div>                   │    │
  │  │ }                                                │    │
  │  └──────────────────────────────────────────────────┘    │
  │                                                          │
  │  ✅ SAU (useEffect = chỉ chạy khi MOUNT!):            │
  │  ┌──────────────────────────────────────────────────┐    │
  │  │ // analytics-tracker.tsx ('use client')          │    │
  │  │ 'use client'                                     │    │
  │  │ import { useEffect } from 'react'                │    │
  │  │ import { trackPageView } from '@/lib/analytics'  │    │
  │  │                                                  │    │
  │  │ export function AnalyticsTracker() {             │    │
  │  │   useEffect(() => {                              │    │
  │  │     trackPageView() // ← CHỈ khi user VISIT!  │    │
  │  │   }, [])                                         │    │
  │  │   return null                                    │    │
  │  │ }                                                │    │
  │  │                                                  │    │
  │  │ // layout.tsx                                    │    │
  │  │ export default function Layout({ children }) {   │    │
  │  │   return (                                       │    │
  │  │     <div>                                        │    │
  │  │       <AnalyticsTracker />                       │    │
  │  │       {children}                                 │    │
  │  │     </div>                                       │    │
  │  │   )                                              │    │
  │  │ }                                                │    │
  │  └──────────────────────────────────────────────────┘    │
  │                                                          │
  │  RULE: Components phải PURE!                            │
  │  → Side effects → useEffect hoặc Server Action!       │
  │                                                          │
  └──────────────────────────────────────────────────────────┘
```

```
  PROBLEM 2: TOO MANY PREFETCHES!
  ┌──────────────────────────────────────────────────────────┐
  │                                                          │
  │  VẤN ĐỀ: Large list = hundreds of <Link>s!             │
  │  → Infinite scroll table: 500 rows, mỗi row = <Link> │
  │  → ALL 500 links trong viewport → 500 prefetches! 😱 │
  │  → Bandwidth explosion!                                 │
  │                                                          │
  │  SOLUTION 1: prefetch={false} (đơn giản!)             │
  │  <Link prefetch={false} href={`/blog/${post.id}`}>      │
  │    {post.title}                                          │
  │  </Link>                                                 │
  │  → Chỉ fetch KHI CLICK! Nhưng chậm hơn...           │
  │                                                          │
  │  SOLUTION 2: HoverPrefetchLink (balanced!)               │
  │  → Prefix only ON HOVER! (user shows intent!)          │
  │  → Code: xem Pattern 3 ở §3!                          │
  │  → Best of both worlds: save bandwidth + fast nav!      │
  │                                                          │
  │  ┌────────────┬──────────┬──────────┬───────────────┐    │
  │  │ Approach   │ Prefetch │ Speed    │ Bandwidth     │    │
  │  ├────────────┼──────────┼──────────┼───────────────┤    │
  │  │ Default    │ ALL 500  │ Instant  │ ❌ Huge!     │    │
  │  │ Disabled   │ 0        │ Slow     │ ✅ Minimal   │    │
  │  │ Hover-only │ ~5-10    │ Fast     │ ✅ Optimal!  │    │
  │  └────────────┴──────────┴──────────┴───────────────┘    │
  │                                                          │
  └──────────────────────────────────────────────────────────┘
```

---

## §6. Tự Viết — PrefetchEngine!

```javascript
var PrefetchEngine = (function () {
  // ═══════════════════════════════════
  // 1. ROUTE REGISTRY
  // ═══════════════════════════════════
  var routes = {};

  function registerRoute(path, config) {
    routes[path] = {
      path: path,
      type: config.type || "static",
      hasLoading: config.hasLoading || false,
      segments: path.split("/").filter(Boolean),
      size: config.size || 50,
    };
  }

  // ═══════════════════════════════════
  // 2. CLIENT CACHE (in-memory!)
  // ═══════════════════════════════════
  var cache = {};

  function cacheSet(key, data) {
    cache[key] = {
      data: data,
      timestamp: Date.now(),
      stale: false,
    };
  }

  function cacheGet(key) {
    var entry = cache[key];
    if (!entry) return null;
    if (entry.stale) return null;
    return entry.data;
  }

  function invalidateCache(key) {
    if (cache[key]) cache[key].stale = true;
  }

  // ═══════════════════════════════════
  // 3. PREFETCH SCHEDULER
  // ═══════════════════════════════════
  var queue = [];
  var QUEUE_MAX = 5;

  function schedulePrefetch(path, priority) {
    // priorities: 1=viewport, 2=hover, 3=manual
    // Remove if already queued
    queue = queue.filter(function (q) {
      return q.path !== path;
    });
    queue.push({ path: path, priority: priority });
    // Sort by priority (lower = higher priority)
    queue.sort(function (a, b) {
      return a.priority - b.priority;
    });
    // Limit queue size
    if (queue.length > QUEUE_MAX) {
      queue = queue.slice(0, QUEUE_MAX);
    }
  }

  function processQueue() {
    var results = [];
    for (var i = 0; i < queue.length; i++) {
      var item = queue[i];
      var result = prefetchRoute(item.path);
      results.push(result);
    }
    queue = [];
    return results;
  }

  // ═══════════════════════════════════
  // 4. PREFETCH LOGIC
  // ═══════════════════════════════════
  function prefetchRoute(path) {
    var route = routes[path];
    if (!route) {
      return { path: path, status: "NOT_FOUND" };
    }

    // Check cache
    if (cacheGet(path)) {
      return { path: path, status: "CACHED", fetched: false };
    }

    // Static: prefetch FULL page
    if (route.type === "static") {
      cacheSet(path, {
        type: "full",
        rscPayload: "RSC:" + path,
        jsBundle: "JS:" + path,
        size: route.size,
      });
      return {
        path: path,
        status: "PREFETCHED_FULL",
        type: "static",
        size: route.size + "KB",
      };
    }

    // Dynamic: prefetch only up to loading.js
    if (route.type === "dynamic") {
      var prefetchedData = {
        type: "partial",
        layout: "Layout:" + path,
        size: Math.round(route.size * 0.3),
      };
      if (route.hasLoading) {
        prefetchedData.loading = "Loading:" + path;
      }
      cacheSet(path, prefetchedData);
      return {
        path: path,
        status: "PREFETCHED_PARTIAL",
        type: "dynamic",
        hasLoading: route.hasLoading,
        size: prefetchedData.size + "KB (partial)",
      };
    }

    return { path: path, status: "UNKNOWN_TYPE" };
  }

  // ═══════════════════════════════════
  // 5. NAVIGATION TYPE CHECKER
  // ═══════════════════════════════════
  function getNavigationType(fromPath, toPath) {
    var fromRoute = routes[fromPath];
    var toRoute = routes[toPath];
    if (!fromRoute || !toRoute) return { type: "FULL_RELOAD" };

    // Check shared segments (layout reuse!)
    var sharedSegments = [];
    var minLen = Math.min(fromRoute.segments.length, toRoute.segments.length);
    for (var i = 0; i < minLen; i++) {
      if (fromRoute.segments[i] === toRoute.segments[i]) {
        sharedSegments.push(fromRoute.segments[i]);
      } else break;
    }

    return {
      type: "CLIENT_TRANSITION",
      sharedLayout: "/" + sharedSegments.join("/"),
      reusedSegments: sharedSegments.length,
      fetchedSegments: toRoute.segments.length - sharedSegments.length,
      cached: !!cacheGet(toPath),
    };
  }

  // ═══════════════════════════════════
  // 6. LINK COMPONENT SIMULATOR
  // ═══════════════════════════════════
  function simulateLink(href, options) {
    options = options || {};
    var mode = options.prefetch;
    // undefined/null = automatic (viewport)
    // false = disabled
    // 'hover' = hover-triggered

    if (mode === false) {
      return {
        href: href,
        prefetch: "DISABLED",
        trigger: "click_only",
      };
    }

    if (mode === "hover") {
      return {
        href: href,
        prefetch: "HOVER",
        trigger: "mouseenter",
        action: function () {
          return prefetchRoute(href);
        },
      };
    }

    // Default: auto prefetch on viewport
    var result = prefetchRoute(href);
    return {
      href: href,
      prefetch: "AUTOMATIC",
      trigger: "viewport",
      result: result,
    };
  }

  // ═══════════════════════════════════
  // 7. DEMO
  // ═══════════════════════════════════
  function demo() {
    console.log("╔════════════════════════════════════╗");
    console.log("║  PREFETCH ENGINE DEMO               ║");
    console.log("╚════════════════════════════════════╝");

    // Register routes
    registerRoute("/about", { type: "static", size: 30 });
    registerRoute("/contact", { type: "static", size: 20 });
    registerRoute("/pricing", { type: "static", size: 45 });
    registerRoute("/dashboard", {
      type: "dynamic",
      hasLoading: true,
      size: 80,
    });
    registerRoute("/dashboard/settings", {
      type: "dynamic",
      hasLoading: true,
      size: 60,
    });
    registerRoute("/dashboard/analytics", {
      type: "dynamic",
      hasLoading: true,
      size: 70,
    });
    registerRoute("/blog/post-1", {
      type: "dynamic",
      hasLoading: false,
      size: 50,
    });

    // Prefetch scenarios
    console.log("\n── Prefetch: Static vs Dynamic ──");
    var scenarios = ["/about", "/dashboard", "/blog/post-1", "/pricing"];
    for (var i = 0; i < scenarios.length; i++) {
      var r = prefetchRoute(scenarios[i]);
      console.log("  " + r.path + " → " + r.status + " (" + r.size + ")");
    }

    // Scheduling
    console.log("\n── Prefetch Scheduling ──");
    schedulePrefetch("/about", 1);
    schedulePrefetch("/pricing", 1);
    schedulePrefetch("/dashboard", 2);
    schedulePrefetch("/blog/post-1", 3);
    console.log(
      "  Queue: " +
        queue
          .map(function (q) {
            return q.path + "(p" + q.priority + ")";
          })
          .join(", "),
    );

    // Navigation with cache reuse
    console.log("\n── Navigation: Layout Reuse ──");
    var nav = getNavigationType("/dashboard/settings", "/dashboard/analytics");
    console.log("  /dashboard/settings → /dashboard/analytics");
    console.log("  Shared: " + nav.sharedLayout);
    console.log("  Reused segments: " + nav.reusedSegments);
    console.log("  Fetched segments: " + nav.fetchedSegments);
    console.log("  Cached: " + nav.cached);

    // Link modes
    console.log("\n── Link Modes ──");
    var modes = [
      { href: "/about", opts: {} },
      { href: "/contact", opts: { prefetch: false } },
      { href: "/pricing", opts: { prefetch: "hover" } },
    ];
    for (var j = 0; j < modes.length; j++) {
      var link = simulateLink(modes[j].href, modes[j].opts);
      console.log(
        "  " + link.href + " → " + link.prefetch + " (" + link.trigger + ")",
      );
    }
  }

  return { demo: demo };
})();
// Chạy: PrefetchEngine.demo();
```

---

## §7. Câu Hỏi Luyện Tập!

**Câu 1**: Prefetch static route vs dynamic route khác gì?

<details><summary>Đáp án</summary>

|              | Static Route                           | Dynamic Route                              |
| ------------ | -------------------------------------- | ------------------------------------------ |
| **Prefetch** | **FULL page!** RSC Payload + JS Bundle | **Partial!** Chỉ tới `loading.js` boundary |
| **Navigate** | **Instant!** Tất cả đã cached          | **Loading state** → data load → render     |
| **Cache**    | Configurable TTL (`staleTimes`)        | Không cache dynamic data                   |
| **Ví dụ**    | `/about`, `/contact`                   | `/dashboard`, `/products/[id]`             |

**Lý do**: Dynamic routes cần data từ server (database, API...), không thể prefetch data chưa biết. Nên chỉ prefetch phần static (layout + loading skeleton).

</details>

---

**Câu 2**: 5 Prefetch patterns — liệt kê và khi nào dùng?

<details><summary>Đáp án</summary>

| #   | Pattern       | Trigger                      | Khi nào dùng                                                           |
| --- | ------------- | ---------------------------- | ---------------------------------------------------------------------- |
| 1   | **Automatic** | Viewport                     | Default cho mọi `<Link>`! Production only                              |
| 2   | **Manual**    | `router.prefetch()`          | Custom components, analytics triggers, non-`<Link>` elements           |
| 3   | **Hover**     | `onMouseEnter`               | Large lists, save bandwidth, balance speed/resources                   |
| 4   | **Extending** | `useEffect` + `onInvalidate` | Custom prefetch strategy, always-fresh cache, third-party integrations |
| 5   | **Disabled**  | Click only                   | Footer links, infinite scroll, rarely visited routes                   |

**Key value**: `prefetch={false}` = off, `prefetch={null}` = restore default, `prefetch={true}` = force full prefetch.

</details>

---

**Câu 3**: Client cache layout reuse hoạt động thế nào?

<details><summary>Đáp án</summary>

Next.js cache RSC Payloads **keyed by route segments**:

```
/dashboard/settings → /dashboard/analytics

Cache key: /dashboard (shared layout!)

Khi navigate:
→ /dashboard layout: REUSE từ cache (đã prefetch!)
→ /dashboard/analytics: chỉ FETCH leaf page mới!
→ Network: 1 request thay vì 2! (tiết kiệm ~50%!)
```

**Mechanism**: Route segments = `/dashboard` + `/settings`. Khi navigate sang `/analytics`, segment `/dashboard` GIỐNG → reuse layout payload. Chỉ fetch segment khác (`/analytics`).

</details>

---

**Câu 4**: Side effects during prefetch — vấn đề gì và cách fix?

<details><summary>Đáp án</summary>

**Vấn đề**: Server Component render khi prefetch → side effects (analytics tracking, logging) chạy ngay khi user CHƯA VISIT page!

```typescript
// ❌ BAD: trackPageView() chạy khi PREFETCH!
export default function Layout({ children }) {
  trackPageView() // ← Runs during prefetch!
  return <div>{children}</div>
}
```

**Fix**: Move side effects vào `useEffect` (Client Component) — chỉ chạy khi component MOUNT (= user thật sự visit!):

```typescript
// ✅ GOOD: useEffect chỉ chạy khi MOUNT!
"use client";
export function AnalyticsTracker() {
  useEffect(() => {
    trackPageView(); // ← Only when user visits!
  }, []);
  return null;
}
```

**Rule**: Components phải **PURE** (no side effects during render). Side effects → `useEffect` hoặc Server Action triggered from Client Component.

</details>
