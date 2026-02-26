# cacheComponents — Deep Dive!

> **Nguồn**: https://nextjs.org/docs/app/api-reference/config/next-config-js/cacheComponents
> **Ngôn ngữ**: Tiếng Việt — giải thích cực kỳ chi tiết!
> **Trang này KHÔNG có hình/diagram** — chỉ có text + code blocks!

---

## §1. cacheComponents Là Gì?

```
  cacheComponents — TỔNG QUAN:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  WHAT:                                                        │
  │  → Flag trong next.config! ★                                │
  │  → Data fetching trong App Router SẼ BỊ LOẠI KHỎI          │
  │    pre-renders — TRỪ KHI explicitly cached! ★★★            │
  │  → Tối ưu performance cho DYNAMIC data! ★                  │
  │  → App cần FRESH data runtime! ★                            │
  │                                                              │
  │  TRIẾT LÝ:                                                    │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │                                                       │    │
  │  │  MẶC ĐỊNH (không cacheComponents):                     │    │
  │  │  → Data fetching = pre-rendered! ★                    │    │
  │  │  → Cached sẵn lúc build! ★                           │    │
  │  │  → Nhanh nhưng CÓ THỂ stale! ★                      │    │
  │  │                                                       │    │
  │  │  VỚI cacheComponents: true:                            │    │
  │  │  → Data fetching = RUNTIME by default! ★★★            │    │
  │  │  → FRESH data mỗi request! ★★★                       │    │
  │  │  → Chỉ cache khi dùng 'use cache'! ★★★               │    │
  │  │                                                       │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```

---

## §2. Cấu Hình + Usage!

```
  CONFIG:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │  // next.config.ts                                    │    │
  │  │  import type { NextConfig } from 'next'               │    │
  │  │  const nextConfig: NextConfig = {                     │    │
  │  │    cacheComponents: true  ← ENABLE! ★★★              │    │
  │  │  }                                                     │    │
  │  │  export default nextConfig                            │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  ENABLES 3 TÍNH NĂNG:                                         │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │  ① 'use cache' directive! ★★★                         │    │
  │  │    → Đánh dấu page/component/function cần cache! ★  │    │
  │  │                                                       │    │
  │  │  ② cacheLife function! ★                               │    │
  │  │    → Config lifetime cho cache! ★                     │    │
  │  │    → Dùng cùng 'use cache'! ★                        │    │
  │  │                                                       │    │
  │  │  ③ cacheTag function! ★                                │    │
  │  │    → Tag cache entries để revalidate! ★               │    │
  │  │    → revalidateTag('tag') → invalidate! ★            │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```

---

## §3. Flow — Với vs Không cacheComponents!

```
  FLOW SO SÁNH:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  ❌ KHÔNG cacheComponents (mặc định):                          │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │                                                       │    │
  │  │  Build time:                                           │    │
  │  │  Component → fetch() → pre-render → HTML cached! ★   │    │
  │  │                                                       │    │
  │  │  Runtime request:                                      │    │
  │  │  User → Server → return cached HTML! (stale?) ★      │    │
  │  │                                                       │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  ✅ VỚI cacheComponents: true:                                 │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │                                                       │    │
  │  │  Build time:                                           │    │
  │  │  Component → fetch() EXCLUDED from pre-render! ★★★   │    │
  │  │                                                       │    │
  │  │  Runtime request:                                      │    │
  │  │  User → Server → fetch() FRESH data → render! ★★★   │    │
  │  │                                                       │    │
  │  │  VỚI 'use cache':                                      │    │
  │  │  User → Server → check cache → HIT? return! ★       │    │
  │  │                    → MISS? fetch + cache + return! ★  │    │
  │  │                                                       │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  OPT-IN CACHING PATTERN:                                      │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │                                                       │    │
  │  │  // Page KHÔNG cache — fresh mỗi request! ★           │    │
  │  │  async function DashboardPage() {                      │    │
  │  │    const data = await fetch('/api/stats')             │    │
  │  │    return <Dashboard data={data} />                   │    │
  │  │  }                                                     │    │
  │  │                                                       │    │
  │  │  // Component CÓ cache — opt-in! ★★★                  │    │
  │  │  async function ProductList() {                        │    │
  │  │    'use cache'  ← OPT-IN cache! ★★★                  │    │
  │  │    const products = await fetch('/api/products')      │    │
  │  │    return <ul>...</ul>                                 │    │
  │  │  }                                                     │    │
  │  │                                                       │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```

---

## §4. Notes — Trade-offs!

```
  TRADE-OFFS:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  ✅ LỢI ÍCH:                                                   │
  │  → Data LUÔN FRESH runtime! ★★★                            │
  │  → Kiểm soát cache ở MỨC COMPONENT! ★                     │
  │  → Opt-in thay vì opt-out! ★                               │
  │                                                              │
  │  ⚠️ NHƯỢC ĐIỂM:                                                │
  │  → THÊM LATENCY so với pre-rendered! ★★★                  │
  │  → Mỗi request = fetch mới! ★                              │
  │  → Cần dùng 'use cache' cho phần static! ★                 │
  │                                                              │
  │  KHI NÀO DÙNG:                                                │
  │  → Dashboard realtime! ★                                    │
  │  → E-commerce pricing (giá thay đổi liên tục)! ★          │
  │  → Social feed (content mới liên tục)! ★                   │
  │  → Auth-dependent content! ★                                │
  │                                                              │
  │  KHI NÀO KHÔNG DÙNG:                                          │
  │  → Blog, docs (content ít thay đổi)! ★                    │
  │  → Marketing pages! ★                                       │
  │  → Static content! ★                                        │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```

---

## §5. Tự Viết — CacheComponentsEngine!

```javascript
var CacheComponentsEngine = (function () {
  // ═══════════════════════════════════
  // 1. CACHE STORE
  // ═══════════════════════════════════
  var cache = {};
  var tags = {};

  // ═══════════════════════════════════
  // 2. RENDER SIMULATOR
  // ═══════════════════════════════════
  function renderComponent(name, fetchFn, options) {
    var cacheEnabled = options && options.useCache;
    var cacheLifetime = (options && options.cacheLife) || 60;
    var cacheTagName = options && options.cacheTag;

    if (!cacheEnabled) {
      // No 'use cache' → ALWAYS fetch fresh
      var data = fetchFn();
      return {
        component: name,
        data: data,
        source: "FRESH FETCH (runtime)! ★★★",
        cached: false,
      };
    }

    // With 'use cache' → check cache first
    var now = Date.now();
    var entry = cache[name];

    if (entry && now - entry.timestamp < cacheLifetime * 1000) {
      return {
        component: name,
        data: entry.data,
        source: "CACHE HIT! ★",
        cached: true,
        age: Math.round((now - entry.timestamp) / 1000) + "s",
        maxAge: cacheLifetime + "s",
      };
    }

    // Cache MISS or expired → fetch + cache
    var freshData = fetchFn();
    cache[name] = { data: freshData, timestamp: now };

    // Register tag
    if (cacheTagName) {
      if (!tags[cacheTagName]) tags[cacheTagName] = [];
      tags[cacheTagName].push(name);
    }

    return {
      component: name,
      data: freshData,
      source: entry
        ? "CACHE EXPIRED → refetched! ★"
        : "CACHE MISS → fetched! ★",
      cached: true,
      tag: cacheTagName || null,
    };
  }

  // ═══════════════════════════════════
  // 3. REVALIDATE TAG
  // ═══════════════════════════════════
  function revalidateTag(tagName) {
    var entries = tags[tagName];
    if (!entries || entries.length === 0) {
      return { tag: tagName, invalidated: 0, note: "No entries for tag! ★" };
    }
    var count = 0;
    for (var i = 0; i < entries.length; i++) {
      if (cache[entries[i]]) {
        delete cache[entries[i]];
        count++;
      }
    }
    return {
      tag: tagName,
      invalidated: count,
      note: "Cache entries invalidated! Next render = fresh! ★★★",
    };
  }

  // ═══════════════════════════════════
  // 4. COMPARISON: WITH vs WITHOUT
  // ═══════════════════════════════════
  function compareMode(componentName, fetchFn) {
    // Without cacheComponents (default)
    var withoutCC = {
      mode: "DEFAULT (no cacheComponents)",
      behavior: "Pre-rendered at build time! ★",
      freshness: "Potentially stale! ★",
      latency: "LOW (cached HTML)! ★",
    };

    // With cacheComponents: true, no 'use cache'
    var withCCNoCache = {
      mode: "cacheComponents: true, NO 'use cache'",
      behavior: "Fresh fetch every request! ★★★",
      freshness: "ALWAYS FRESH! ★★★",
      latency: "HIGHER (runtime fetch)! ★",
    };

    // With cacheComponents: true, WITH 'use cache'
    var withCCAndCache = {
      mode: "cacheComponents: true, WITH 'use cache'",
      behavior: "Cached with opt-in control! ★★★",
      freshness: "Fresh within cacheLife! ★",
      latency: "LOW on cache hit, HIGH on miss! ★",
    };

    return {
      component: componentName,
      modes: [withoutCC, withCCNoCache, withCCAndCache],
    };
  }

  // ═══════════════════════════════════
  // 5. DEMO
  // ═══════════════════════════════════
  function demo() {
    console.log("═══ CacheComponents Engine ═══");
    var fetchCount = 0;
    var mockFetch = function () {
      fetchCount++;
      return { id: fetchCount, time: new Date().toISOString() };
    };

    console.log("\n── 1. No 'use cache' (always fresh) ──");
    console.log(renderComponent("Dashboard", mockFetch, { useCache: false }));
    console.log(renderComponent("Dashboard", mockFetch, { useCache: false }));

    console.log("\n── 2. With 'use cache' ──");
    console.log(
      renderComponent("ProductList", mockFetch, {
        useCache: true,
        cacheLife: 60,
        cacheTag: "products",
      }),
    );
    console.log(
      renderComponent("ProductList", mockFetch, {
        useCache: true,
        cacheLife: 60,
        cacheTag: "products",
      }),
    );

    console.log("\n── 3. Revalidate tag ──");
    console.log(revalidateTag("products"));
    console.log(
      renderComponent("ProductList", mockFetch, {
        useCache: true,
        cacheLife: 60,
        cacheTag: "products",
      }),
    );

    console.log("\n── 4. Compare modes ──");
    console.log(compareMode("MyComponent", mockFetch));
  }

  return { demo: demo };
})();
// Chạy: CacheComponentsEngine.demo();
```

---

## §6. Câu Hỏi Phỏng Vấn!

```
  CÂU HỎI:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  ❓ 1: cacheComponents thay đổi gì?                            │
  │  → Data fetching EXCLUDED from pre-renders! ★★★            │
  │  → Trừ khi explicitly cached bằng 'use cache'! ★★★        │
  │  → Runtime fetch by default! ★                              │
  │                                                              │
  │  ❓ 2: cacheComponents enables gì?                             │
  │  → 'use cache' directive! ★★★                              │
  │  → cacheLife function (cache lifetime)! ★                   │
  │  → cacheTag function (tag-based invalidation)! ★           │
  │                                                              │
  │  ❓ 3: Trade-off là gì?                                        │
  │  → Fresh data nhưng THÊM LATENCY! ★★★                     │
  │  → Pre-rendered nhanh hơn nhưng có thể stale! ★           │
  │  → Dùng 'use cache' cho phần ít thay đổi! ★               │
  │                                                              │
  │  ❓ 4: Khi nào nên dùng?                                       │
  │  → Dashboard realtime, e-commerce pricing! ★               │
  │  → Auth-dependent content! ★                                │
  │  → KHÔNG dùng cho blog, static docs! ★                     │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```
