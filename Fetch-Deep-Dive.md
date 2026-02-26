# fetch() — Deep Dive!

> **Nguồn**: https://nextjs.org/docs/app/api-reference/functions/fetch
> **Ngôn ngữ**: Tiếng Việt — giải thích cực kỳ chi tiết!
> **Trang này KHÔNG có hình/diagram** — chỉ có text + code blocks!
> **Since**: v13.0.0!

---

## §1. fetch() Là Gì?

```
  fetch() — TỔNG QUAN:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  WHAT:                                                        │
  │  → Next.js EXTENDS Web fetch() API! ★                       │
  │  → Mỗi request server-side set riêng caching! ★             │
  │  → Tương tác với Data Cache (không phải browser cache!) ★   │
  │                                                              │
  │  Browser cache vs Next.js cache:                               │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ Browser: cache = browser HTTP cache! ★                │    │
  │  │ Next.js: cache = framework Data Cache! ★              │    │
  │  │ → Persistent! Server-side! ★                          │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  USAGE:                                                       │
  │  → Gọi trực tiếp trong Server Components! ★                 │
  │  → async/await! ★                                            │
  │                                                              │
  │  export default async function Page() {                       │
  │    let data = await fetch('https://api.vercel.app/blog')     │
  │    let posts = await data.json()                             │
  │    return <ul>{posts.map(...)}</ul>                          │
  │  }                                                           │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```

---

## §2. options.cache — 3 Giá Trị!

```
  options.cache — 3 GIÁ TRỊ:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  fetch(url, { cache: 'auto' | 'no-store' | 'force-cache' }) │
  │                                                              │
  │  ┌──────────────┬──────────────────────────────────────────┐ │
  │  │ Giá trị      │ Hành vi                                 │ │
  │  ├──────────────┼──────────────────────────────────────────┤ │
  │  │ auto         │ DEFAULT! ★                               │ │
  │  │ (no cache)   │ Dev: fetch mỗi request! ★                │ │
  │  │              │ Build: fetch 1 lần (static prerender!) ★│ │
  │  │              │ Dynamic APIs → fetch mỗi request! ★     │ │
  │  ├──────────────┼──────────────────────────────────────────┤ │
  │  │ 'no-store'   │ LUÔN fetch từ server! ★                  │ │
  │  │              │ Kể cả KHÔNG có Dynamic APIs! ★           │ │
  │  │              │ KHÔNG cache! ★                            │ │
  │  ├──────────────┼──────────────────────────────────────────┤ │
  │  │ 'force-cache'│ TÌM trong Data Cache! ★                  │ │
  │  │              │ Fresh match → return cache! ★            │ │
  │  │              │ No/stale match → fetch + update! ★       │ │
  │  └──────────────┴──────────────────────────────────────────┘ │
  │                                                              │
  │  FLOW — force-cache:                                          │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ fetch(url, { cache: 'force-cache' })                  │    │
  │  │   │                                                    │    │
  │  │   ▼                                                    │    │
  │  │ Data Cache có match?                                   │    │
  │  │   │                                                    │    │
  │  │   ├── ✅ Fresh match → Return cached! (fast!) ★       │    │
  │  │   │                                                    │    │
  │  │   └── ❌ No/stale match                                │    │
  │  │         │                                              │    │
  │  │         ▼                                              │    │
  │  │   Fetch from remote → Update Data Cache → Return! ★   │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```

---

## §3. options.next.revalidate + options.next.tags!

```
  options.next.revalidate — 3 GIÁ TRỊ:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  fetch(url, { next: { revalidate: false | 0 | number } })   │
  │                                                              │
  │  ┌──────────────┬──────────────────────────────────────────┐ │
  │  │ Giá trị      │ Hành vi                                 │ │
  │  ├──────────────┼──────────────────────────────────────────┤ │
  │  │ false        │ Cache VĨNH VIỄN! ★                       │ │
  │  │              │ = revalidate: Infinity! ★                │ │
  │  │              │ HTTP cache có thể evict! ★               │ │
  │  ├──────────────┼──────────────────────────────────────────┤ │
  │  │ 0            │ KHÔNG cache! ★                            │ │
  │  │              │ Mỗi request = fresh fetch! ★             │ │
  │  ├──────────────┼──────────────────────────────────────────┤ │
  │  │ number       │ Cache tối đa N giây! ★                   │ │
  │  │ (seconds!)   │ Sau N giây → stale → refetch! ★          │ │
  │  └──────────────┴──────────────────────────────────────────┘ │
  │                                                              │
  │  3 QUY TẮC QUAN TRỌNG:                                       │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │  ① fetch revalidate < route default revalidate       │    │
  │  │     → TOÀN BỘ route interval GIẢM! ★★★               │    │
  │  │                                                       │    │
  │  │  ② 2 fetch cùng URL, khác revalidate                  │    │
  │  │     → GIÁ TRỊ NHỎ hơn THẮNG! ★★★                     │    │
  │  │                                                       │    │
  │  │  ③ { revalidate: 3600, cache: 'no-store' }            │    │
  │  │     → CONFLICT! ★★★ Cả hai BỊ IGNORE!                 │    │
  │  │     → Dev mode: WARNING in terminal! ★                 │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘

  options.next.tags — CACHE TAGGING!
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  fetch(url, { next: { tags: ['collection'] } })              │
  │                                                              │
  │  → Gắn TAG cho cache entry! ★                               │
  │  → On-demand revalidation bằng revalidateTag()! ★           │
  │  → Max tag length: 256 characters! ★                        │
  │  → Max tag items: 128! ★                                    │
  │                                                              │
  │  FLOW:                                                        │
  │  fetch(url, { next: { tags: ['posts'] } })                   │
  │             ↓                                                │
  │  Data Cache: { url → data, tags: ['posts'] }                │
  │             ↓                                                │
  │  revalidateTag('posts')  ← Server Action!                   │
  │             ↓                                                │
  │  Cache PURGED! → Next fetch = fresh data! ★                 │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```

---

## §4. Troubleshooting — Dev Mode!

```
  TROUBLESHOOTING:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  ① HMR CACHE trong Development! ★                             │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ Next.js cache fetch responses across HMR! ★           │    │
  │  │ → Nhanh hơn! Giảm billed API calls! ★                │    │
  │  │ → NGAY CẢ no-store cũng bị HMR cache! ★★★            │    │
  │  │ → Không thấy fresh data giữa HMR refreshes! ★        │    │
  │  │                                                       │    │
  │  │ FIX:                                                   │    │
  │  │ → Navigation hoặc full-page reload → clear! ★        │    │
  │  │ → Config: serverComponentsHmrCache = false! ★         │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  ② Hard Refresh + cache-control: no-cache! ★                 │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ Dev mode + cache-control: no-cache header:            │    │
  │  │ → options.cache IGNORED! ★                             │    │
  │  │ → options.next.revalidate IGNORED! ★                   │    │
  │  │ → options.next.tags IGNORED! ★                         │    │
  │  │ → Fetch LUÔN từ source! ★                              │    │
  │  │                                                       │    │
  │  │ Browser gửi cache-control: no-cache khi:              │    │
  │  │ → DevTools disable cache! ★                            │    │
  │  │ → Hard refresh (Cmd+Shift+R)! ★                       │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```

---

## §5. Tự Viết — FetchCacheEngine!

```javascript
var FetchCacheEngine = (function () {
  // ═══════════════════════════════════
  // 1. DATA CACHE STORE
  // ═══════════════════════════════════
  var dataCache = {}; // url → { data, tags, cachedAt, revalidate }

  function getCacheKey(url) {
    return url;
  }

  // ═══════════════════════════════════
  // 2. FETCH SIMULATOR
  // ═══════════════════════════════════
  function simulateFetch(url, options) {
    options = options || {};
    var cacheMode = options.cache || "auto";
    var nextOpts = options.next || {};
    var revalidate = nextOpts.revalidate;
    var tags = nextOpts.tags || [];

    // Conflict check!
    if (
      revalidate !== undefined &&
      revalidate > 0 &&
      cacheMode === "no-store"
    ) {
      return {
        error:
          "CONFLICT! { revalidate: " +
          revalidate +
          ", cache: 'no-store' } ★ Cả hai bị IGNORE!",
        warning: true,
      };
    }

    var key = getCacheKey(url);
    var now = Date.now();

    // no-store → always fetch
    if (cacheMode === "no-store" || revalidate === 0) {
      return {
        source: "REMOTE",
        reason:
          cacheMode === "no-store"
            ? "cache: 'no-store' → KHÔNG cache! ★"
            : "revalidate: 0 → KHÔNG cache! ★",
        data: "[fresh data from " + url + "]",
      };
    }

    // force-cache → check Data Cache
    if (cacheMode === "force-cache" || revalidate === false) {
      var cached = dataCache[key];
      if (cached) {
        var age = (now - cached.cachedAt) / 1000;
        var maxAge = cached.revalidate || Infinity;
        if (age < maxAge) {
          return {
            source: "DATA_CACHE",
            reason: "Fresh match! ★",
            data: cached.data,
            age: age,
          };
        }
        // Stale → refetch + update
        var freshData = "[fresh data from " + url + "]";
        dataCache[key] = {
          data: freshData,
          tags: tags,
          cachedAt: now,
          revalidate: revalidate,
        };
        return {
          source: "REMOTE",
          reason: "Stale match → refetch + update cache! ★",
          data: freshData,
        };
      }
      // No match → fetch + cache
      var newData = "[fresh data from " + url + "]";
      dataCache[key] = {
        data: newData,
        tags: tags,
        cachedAt: now,
        revalidate: revalidate,
      };
      return {
        source: "REMOTE",
        reason: "No cache match → fetch + cache! ★",
        data: newData,
      };
    }

    // auto (default) with revalidate
    if (typeof revalidate === "number" && revalidate > 0) {
      var cached2 = dataCache[key];
      if (cached2) {
        var age2 = (now - cached2.cachedAt) / 1000;
        if (age2 < revalidate) {
          return {
            source: "DATA_CACHE",
            reason: "Within revalidate window! ★",
            data: cached2.data,
          };
        }
      }
      var data = "[fresh data from " + url + "]";
      dataCache[key] = {
        data: data,
        tags: tags,
        cachedAt: now,
        revalidate: revalidate,
      };
      return {
        source: "REMOTE",
        reason: "Auto + revalidate: " + revalidate + "s! ★",
        data: data,
      };
    }

    // auto default
    return {
      source: "REMOTE",
      reason: "Default auto → fetch from remote! ★",
      data: "[data]",
    };
  }

  // ═══════════════════════════════════
  // 3. REVALIDATE BY TAG
  // ═══════════════════════════════════
  function revalidateTag(tag) {
    var purged = [];
    for (var key in dataCache) {
      if (
        dataCache.hasOwnProperty(key) &&
        dataCache[key].tags &&
        dataCache[key].tags.indexOf(tag) !== -1
      ) {
        purged.push(key);
        delete dataCache[key];
      }
    }
    return { tag: tag, purged: purged, count: purged.length };
  }

  // ═══════════════════════════════════
  // 4. REVALIDATE RESOLVER
  // ═══════════════════════════════════
  function resolveRevalidate(fetches) {
    // Multiple fetches same URL → lowest revalidate wins!
    var byUrl = {};
    for (var i = 0; i < fetches.length; i++) {
      var f = fetches[i];
      var rev = f.revalidate;
      if (rev === undefined || rev === false) rev = Infinity;
      if (!byUrl[f.url] || rev < byUrl[f.url]) {
        byUrl[f.url] = rev;
      }
    }
    return byUrl;
  }

  // ═══════════════════════════════════
  // 5. DEMO
  // ═══════════════════════════════════
  function demo() {
    console.log("═══ FetchCache Engine ═══");

    console.log("\n── Fetch Modes ──");
    console.log("auto:", simulateFetch("/api/posts"));
    console.log(
      "no-store:",
      simulateFetch("/api/posts", { cache: "no-store" }),
    );
    console.log(
      "force-cache:",
      simulateFetch("/api/posts", { cache: "force-cache" }),
    );
    console.log(
      "force-cache (cached):",
      simulateFetch("/api/posts", { cache: "force-cache" }),
    );

    console.log("\n── Revalidate ──");
    console.log(
      "3600s:",
      simulateFetch("/api/data", { next: { revalidate: 3600 } }),
    );
    console.log("0:", simulateFetch("/api/live", { next: { revalidate: 0 } }));
    console.log(
      "false:",
      simulateFetch("/api/static", { next: { revalidate: false } }),
    );

    console.log("\n── Conflict ──");
    console.log(
      simulateFetch("/api/x", {
        cache: "no-store",
        next: { revalidate: 3600 },
      }),
    );

    console.log("\n── Tags ──");
    simulateFetch("/api/posts", {
      cache: "force-cache",
      next: { tags: ["posts"] },
    });
    console.log("Tag purge:", revalidateTag("posts"));

    console.log("\n── Resolve ──");
    console.log(
      resolveRevalidate([
        { url: "/api/posts", revalidate: 3600 },
        { url: "/api/posts", revalidate: 900 },
        { url: "/api/users", revalidate: 60 },
      ]),
    );
  }

  return { demo: demo };
})();
// Chạy: FetchCacheEngine.demo();
```

---

## §6. Câu Hỏi Phỏng Vấn!

```
  CÂU HỎI:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  ❓ 1: Next.js extend fetch() như thế nào?                     │
  │  → Thêm cache option cho Data Cache (server-side!) ★        │
  │  → Thêm next.revalidate cho time-based revalidation! ★      │
  │  → Thêm next.tags cho on-demand revalidation! ★             │
  │  → Browser cache ≠ Next.js Data Cache! ★★★                  │
  │                                                              │
  │  ❓ 2: 3 giá trị cache — kể tên + giải thích?                 │
  │  → auto (default): dev=mỗi request, build=1 lần! ★          │
  │  → 'no-store': LUÔN fetch, KHÔNG cache! ★                   │
  │  → 'force-cache': tìm Data Cache trước! ★                   │
  │                                                              │
  │  ❓ 3: { revalidate: 3600, cache: 'no-store' } → sao?         │
  │  → CONFLICT! ★★★ Cả hai BỊ IGNORE!                          │
  │  → Dev mode: warning in terminal! ★                          │
  │  → Không được dùng cùng lúc 2 options mâu thuẫn! ★         │
  │                                                              │
  │  ❓ 4: 2 fetch cùng URL khác revalidate — ai thắng?           │
  │  → Giá trị NHỎ hơn THẮNG! ★★★                               │
  │  → fetch revalidate < route default → route GIẢM! ★         │
  │                                                              │
  │  ❓ 5: Tại sao dev mode no-store không thấy fresh data?        │
  │  → HMR Cache! ★ Next.js cache fetch across HMR! ★           │
  │  → Ngay cả no-store cũng bị HMR cache! ★★★                  │
  │  → Fix: navigation/full reload hoặc tắt HMR cache! ★       │
  │  → Hard refresh → cache-control: no-cache → skip ALL! ★    │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```
