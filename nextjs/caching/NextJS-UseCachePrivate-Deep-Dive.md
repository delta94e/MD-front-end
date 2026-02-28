# Next.js `use cache: private` — Deep Dive!

> **Chủ đề**: `use cache: private` — Cache With Runtime APIs!
> **Ngôn ngữ**: Tiếng Việt — giải thích cực kỳ chi tiết!
> **Phương châm**: Tự viết lại bằng tay — KHÔNG dùng thư viện!
> **Nguồn**: https://nextjs.org/docs/app/api-reference/directives/use-cache-private
> **Lưu ý**: Trang gốc KHÔNG có sơ đồ — tất cả diagrams TỰ VẼ!

---

## Mục Lục

1. [§1. Tổng Quan — use cache: private!](#1)
2. [§2. So Sánh 3 Cache Directives!](#2)
3. [§3. Usage — Enable + Basic Example!](#3)
4. [§4. Request APIs Allowed!](#4)
5. [§5. Tự Viết — PrivateCacheEngine!](#5)
6. [§6. Câu Hỏi Luyện Tập](#6)

---

## §1. Tổng Quan — use cache: private!

```
  "use cache: private":
  ┌────────────────────────────────────────────────────────────┐
  │                                                            │
  │  WHAT: Cache directive that ALLOWS runtime APIs!           │
  │                                                            │
  │  ┌──────────────────────────────────────────────────────┐  │
  │  │ 'use cache'          │ 'use cache: private'          │  │
  │  │                      │                               │  │
  │  │ cookies() → ❌ ERROR │ cookies() → ✅ ALLOWED!      │  │
  │  │ headers() → ❌ ERROR │ headers() → ✅ ALLOWED!      │  │
  │  │ searchParams → ❌    │ searchParams → ✅ ALLOWED!   │  │
  │  │                      │                               │  │
  │  │ Cache: SERVER memory! │ Cache: BROWSER memory ONLY! │  │
  │  │ Persists across      │ Does NOT persist across       │  │
  │  │ requests! ✅         │ page reloads! ❌             │  │
  │  └──────────────────────────────────────────────────────┘  │
  │                                                            │
  │  KEY BEHAVIORS:                                             │
  │  ┌──────────────────────────────────────────────────────┐  │
  │  │ ① Results NEVER stored on server! → Browser only!  │  │
  │  │ ② Executes on EVERY server render!                  │  │
  │  │ ③ Excluded from static shell generation!            │  │
  │  │ ④ Cannot configure custom cache handlers!           │  │
  │  │ ⑤ NOT available in Route Handlers!                  │  │
  │  │ ⑥ ⚠️ Experimental! (depends on runtime prefetch!) │  │
  │  └──────────────────────────────────────────────────────┘  │
  │                                                            │
  │  WHEN TO USE:                                               │
  │  ┌──────────────────────────────────────────────────────┐  │
  │  │ ① Can't refactor runtime access outside!            │  │
  │  │   (moving cookies() outside + passing as args       │  │
  │  │    is NOT practical for your code!)                  │  │
  │  │                                                      │  │
  │  │ ② Compliance requirements!                          │  │
  │  │   (Cannot store certain data on server,             │  │
  │  │    even temporarily! GDPR/HIPAA/etc!)               │  │
  │  └──────────────────────────────────────────────────────┘  │
  │                                                            │
  │  VERSION: v16.0.0 (experimental!)                          │
  │                                                            │
  └────────────────────────────────────────────────────────────┘
```

---

## §2. So Sánh 3 Cache Directives!

```
  3 CACHE DIRECTIVES COMPARISON:
  ┌──────────────────────────────────────────────────────────────────┐
  │                                                                  │
  │  ┌─────────────────┬──────────────┬──────────────┬─────────────┐│
  │  │                 │ 'use cache'  │ 'use cache:  │ 'use cache: ││
  │  │                 │              │  private'    │  remote'    ││
  │  ├─────────────────┼──────────────┼──────────────┼─────────────┤│
  │  │ Storage         │ Server       │ Browser      │ Platform    ││
  │  │                 │ in-memory    │ memory ONLY! │ handler     ││
  │  │                 │ (LRU!)       │              │ (Redis/KV!) ││
  │  │ Persist?        │ ✅ Across   │ ❌ Lost on   │ ✅ Across  ││
  │  │                 │ requests!    │ page reload! │ requests!   ││
  │  │ cookies()       │ ❌ ERROR!   │ ✅ ALLOWED! │ ❌ ERROR!  ││
  │  │ headers()       │ ❌ ERROR!   │ ✅ ALLOWED! │ ❌ ERROR!  ││
  │  │ searchParams    │ ❌ ERROR!   │ ✅ ALLOWED! │ ❌ ERROR!  ││
  │  │ connection()    │ ❌ ERROR!   │ ❌ ERROR!   │ ❌ ERROR!  ││
  │  │ Static shell?   │ ✅ Included │ ❌ Excluded! │ ✅ Included││
  │  │ Custom handlers │ ✅ Yes!     │ ❌ No!      │ ✅ Yes!    ││
  │  │ Network cost    │ None!        │ None!        │ Roundtrip!  ││
  │  │ Platform fees   │ None!        │ None!        │ $$$ Yes!    ││
  │  │ Route Handlers  │ ✅ Yes!     │ ❌ No!      │ ✅ Yes!    ││
  │  │ Use case        │ Default!     │ Compliance!  │ Scale +     ││
  │  │                 │ Most cases!  │ Can't refac! │ Persistence!││
  │  └─────────────────┴──────────────┴──────────────┴─────────────┘│
  │                                                                  │
  │  DECISION FLOW:                                                  │
  │  ┌──────────────────────────────────────────────────────┐        │
  │  │ Need to cache? → START                               │        │
  │  │   │                                                  │        │
  │  │   ├─ Can move cookies/headers OUTSIDE?              │        │
  │  │   │   YES → 'use cache' (default!) ✅              │        │
  │  │   │   NO ↓                                          │        │
  │  │   ├─ Compliance: can't store on server?             │        │
  │  │   │   YES → 'use cache: private' ✅                │        │
  │  │   │   NO ↓                                          │        │
  │  │   ├─ Need persistent cache across requests?         │        │
  │  │   │   YES → 'use cache: remote' (Redis/KV!) ✅     │        │
  │  │   │   NO ↓                                          │        │
  │  │   └─ Default → 'use cache' ✅                      │        │
  │  └──────────────────────────────────────────────────────┘        │
  │                                                                  │
  └──────────────────────────────────────────────────────────────────┘
```

---

## §3. Usage — Enable + Basic Example!

```
  SETUP:
  ┌────────────────────────────────────────────────────────────┐
  │                                                            │
  │  STEP 1: Enable cacheComponents!                           │
  │  ┌──────────────────────────────────────────────────────┐  │
  │  │ // next.config.ts                                    │  │
  │  │ const nextConfig: NextConfig = {                     │  │
  │  │   cacheComponents: true,  // ← REQUIRED!           │  │
  │  │ }                                                    │  │
  │  └──────────────────────────────────────────────────────┘  │
  │                                                            │
  │  STEP 2: Add directive + cacheLife!                        │
  │  ┌──────────────────────────────────────────────────────┐  │
  │  │ async function myFunc() {                            │  │
  │  │   'use cache: private'   // ← directive!            │  │
  │  │   cacheLife({ stale: 60 })  // ← REQUIRED config!  │  │
  │  │   // ... can use cookies()/headers()!               │  │
  │  │ }                                                    │  │
  │  └──────────────────────────────────────────────────────┘  │
  │                                                            │
  │  ⚠️ stale time MUST be ≥ 30 seconds!                    │
  │  (For runtime prefetching to work!)                        │
  │                                                            │
  └────────────────────────────────────────────────────────────┘

  FULL EXAMPLE — Personalized Product Recommendations:
  ┌────────────────────────────────────────────────────────────┐
  │                                                            │
  │  Architecture:                                              │
  │  ┌──────────────────────────────────────────────────────┐  │
  │  │ ProductPage (static params! → pre-rendered!)        │  │
  │  │   ├── ProductDetails (id) → static content!          │  │
  │  │   └── Suspense                                       │  │
  │  │       └── Recommendations (productId)                │  │
  │  │           └── getRecommendations()                   │  │
  │  │               'use cache: private'  ← HERE!         │  │
  │  │               cacheTag('recommendations-{id}')       │  │
  │  │               cacheLife({ stale: 60 })               │  │
  │  │               cookies().get('session-id') ← ALLOWED!│  │
  │  │               → personalized per user! ✅           │  │
  │  └──────────────────────────────────────────────────────┘  │
  │                                                            │
  │  CODE:                                                      │
  │  ┌──────────────────────────────────────────────────────┐  │
  │  │ import { cookies } from 'next/headers'               │  │
  │  │ import { cacheLife, cacheTag } from 'next/cache'     │  │
  │  │                                                      │  │
  │  │ // Static params for pre-rendering!                  │  │
  │  │ export async function generateStaticParams() {       │  │
  │  │   return [{ id: '1' }]                               │  │
  │  │ }                                                    │  │
  │  │                                                      │  │
  │  │ // Page: pre-rendered shell!                         │  │
  │  │ export default async function ProductPage({ params })│  │
  │  │ {                                                    │  │
  │  │   const { id } = await params                        │  │
  │  │   return (                                           │  │
  │  │     <div>                                            │  │
  │  │       <ProductDetails id={id} />                     │  │
  │  │       <Suspense fallback={                           │  │
  │  │         <div>Loading recommendations...</div>        │  │
  │  │       }>                                             │  │
  │  │         <Recommendations productId={id} />           │  │
  │  │       </Suspense>                                    │  │
  │  │     </div>                                           │  │
  │  │   )                                                  │  │
  │  │ }                                                    │  │
  │  │                                                      │  │
  │  │ // Fetcher: 'use cache: private'!                    │  │
  │  │ async function getRecommendations(productId) {       │  │
  │  │   'use cache: private'                               │  │
  │  │   cacheTag(`recommendations-${productId}`)           │  │
  │  │   cacheLife({ stale: 60 })                           │  │
  │  │                                                      │  │
  │  │   // ✅ cookies() ALLOWED inside private!           │  │
  │  │   const sessionId = (await cookies())                │  │
  │  │     .get('session-id')?.value || 'guest'             │  │
  │  │                                                      │  │
  │  │   return getPersonalizedRecommendations(             │  │
  │  │     productId, sessionId                             │  │
  │  │   )                                                  │  │
  │  │ }                                                    │  │
  │  └──────────────────────────────────────────────────────┘  │
  │                                                            │
  │  FLOW:                                                      │
  │  ┌──────────────────────────────────────────────────────┐  │
  │  │ Build time:                                          │  │
  │  │   ProductPage → static shell (ProductDetails!)      │  │
  │  │   Recommendations → SKIPPED! (private = no static!) │  │
  │  │                                                      │  │
  │  │ Runtime (user visits):                               │  │
  │  │   ① Show static shell immediately! ⚡              │  │
  │  │   ② Show Suspense fallback "Loading..."             │  │
  │  │   ③ getRecommendations() runs on SERVER!            │  │
  │  │     → reads cookies('session-id')!                  │  │
  │  │     → fetches personalized data!                    │  │
  │  │   ④ Result cached in BROWSER memory!                │  │
  │  │     → stale: 60s (within 60s = cached!)            │  │
  │  │   ⑤ Page reload → cache LOST! Re-fetch required!   │  │
  │  └──────────────────────────────────────────────────────┘  │
  │                                                            │
  └────────────────────────────────────────────────────────────┘
```

---

## §4. Request APIs Allowed!

```
  ALLOWED vs PROHIBITED APIs:
  ┌──────────────────────────────────────────────────────────┐
  │                                                          │
  │  ┌──────────────────┬─────────────┬──────────────────┐   │
  │  │ API              │ use cache   │ use cache:private │   │
  │  ├──────────────────┼─────────────┼──────────────────┤   │
  │  │ cookies()        │ ❌ ERROR!  │ ✅ ALLOWED!     │   │
  │  │ headers()        │ ❌ ERROR!  │ ✅ ALLOWED!     │   │
  │  │ searchParams     │ ❌ ERROR!  │ ✅ ALLOWED!     │   │
  │  │ connection()     │ ❌ ERROR!  │ ❌ ERROR!       │   │
  │  └──────────────────┴─────────────┴──────────────────┘   │
  │                                                          │
  │  ⚠️ connection() — PROHIBITED in BOTH!                  │
  │  → Provides connection-specific information!              │
  │  → Cannot be safely cached in ANY context!               │
  │                                                          │
  │  WHY cookies/headers ALLOWED in private?                  │
  │  ┌──────────────────────────────────────────────────────┐│
  │  │ Private cache = browser memory only!                 ││
  │  │ → Same user's browser = same cookies/headers!       ││
  │  │ → Result is personalized per THAT user!             ││
  │  │ → No risk of leaking to OTHER users! ✅            ││
  │  │ → Server never stores it! ✅                       ││
  │  └──────────────────────────────────────────────────────┘│
  │                                                          │
  └──────────────────────────────────────────────────────────┘
```

---

## §5. Tự Viết — PrivateCacheEngine!

```javascript
var PrivateCacheEngine = (function () {
  // ═══════════════════════════════════
  // 1. BROWSER MEMORY CACHE (private!)
  // ═══════════════════════════════════
  var browserCache = {};
  var serverCache = {}; // for comparison with 'use cache'
  var tagMap = {};

  // ═══════════════════════════════════
  // 2. RUNTIME APIs SIMULATOR
  // ═══════════════════════════════════
  var requestContext = {
    cookies: { "session-id": "user_abc123", theme: "dark" },
    headers: { "accept-language": "vi-VN", "user-agent": "Chrome/120" },
    searchParams: { page: "1", sort: "price" },
  };

  function cookies() {
    return requestContext.cookies;
  }
  function headers() {
    return requestContext.headers;
  }
  function searchParams() {
    return requestContext.searchParams;
  }
  function connection() {
    throw new Error("❌ connection() prohibited in ALL cache scopes!");
  }

  // ═══════════════════════════════════
  // 3. CACHE DIRECTIVE CHECK
  // ═══════════════════════════════════
  function checkApiAccess(directive, apiName) {
    var rules = {
      "use cache": {
        "cookies()": false,
        "headers()": false,
        searchParams: false,
        "connection()": false,
      },
      "use cache: private": {
        "cookies()": true,
        "headers()": true,
        searchParams: true,
        "connection()": false,
      },
      "use cache: remote": {
        "cookies()": false,
        "headers()": false,
        searchParams: false,
        "connection()": false,
      },
    };
    var allowed = rules[directive] && rules[directive][apiName];
    return {
      directive: directive,
      api: apiName,
      allowed: allowed ? "✅ ALLOWED" : "❌ ERROR",
    };
  }

  // ═══════════════════════════════════
  // 4. CACHE LIFE
  // ═══════════════════════════════════
  function cacheLife(config) {
    var stale = config.stale || 300;
    if (stale < 30) {
      console.warn("  ⚠️ stale must be ≥ 30s for runtime prefetching!");
      stale = 30;
    }
    return { stale: stale };
  }

  // ═══════════════════════════════════
  // 5. CACHE TAG
  // ═══════════════════════════════════
  function cacheTag(tag, key) {
    if (!tagMap[tag]) tagMap[tag] = [];
    tagMap[tag].push(key);
  }

  function updateTag(tag) {
    var keys = tagMap[tag] || [];
    var count = 0;
    for (var i = 0; i < keys.length; i++) {
      if (browserCache[keys[i]]) {
        delete browserCache[keys[i]];
        count++;
      }
    }
    tagMap[tag] = [];
    return { tag: tag, invalidated: count };
  }

  // ═══════════════════════════════════
  // 6. USE CACHE: PRIVATE WRAPPER
  // ═══════════════════════════════════
  function useCachePrivate(funcId, fn, args, options) {
    options = options || {};
    var life = cacheLife(options.cacheLife || { stale: 300 });
    var key = funcId + "|" + JSON.stringify(args);

    // Check browser cache!
    if (browserCache[key]) {
      var entry = browserCache[key];
      var age = (Date.now() - entry.timestamp) / 1000;

      if (age < life.stale) {
        return {
          hit: true,
          value: entry.value,
          age: Math.round(age),
          storage: "BROWSER MEMORY",
          serverStored: false,
        };
      }
      // Stale → re-execute!
      delete browserCache[key];
    }

    // Cache MISS → execute on server (every render!)
    var result = fn.apply(null, args);

    // Store in BROWSER only! NEVER server!
    browserCache[key] = { value: result, timestamp: Date.now() };

    // NOT in server cache!
    // serverCache[key] = ... ← NEVER! That's the whole point!

    if (options.tag) {
      cacheTag(options.tag, key);
    }

    return {
      hit: false,
      value: result,
      storage: "BROWSER MEMORY",
      serverStored: false,
    };
  }

  // ═══════════════════════════════════
  // 7. USE CACHE (regular) WRAPPER for comparison
  // ═══════════════════════════════════
  function useCacheRegular(funcId, fn, args) {
    var key = funcId + "|" + JSON.stringify(args);

    if (serverCache[key]) {
      return {
        hit: true,
        value: serverCache[key].value,
        storage: "SERVER MEMORY",
        serverStored: true,
      };
    }

    // Check: no runtime APIs allowed!
    var result = fn.apply(null, args);
    serverCache[key] = { value: result, timestamp: Date.now() };

    return {
      hit: false,
      value: result,
      storage: "SERVER MEMORY",
      serverStored: true,
    };
  }

  // ═══════════════════════════════════
  // 8. PAGE RELOAD SIMULATOR
  // ═══════════════════════════════════
  function simulatePageReload() {
    // Browser cache = LOST!
    var entries = Object.keys(browserCache).length;
    browserCache = {};
    // Server cache = SURVIVES!
    return {
      browserCacheLost: entries,
      serverCacheKept: Object.keys(serverCache).length,
    };
  }

  // ═══════════════════════════════════
  // 9. DEMO
  // ═══════════════════════════════════
  function demo() {
    console.log("╔══════════════════════════════════════╗");
    console.log("║  PRIVATE CACHE ENGINE DEMO            ║");
    console.log("╚══════════════════════════════════════╝");

    // API access check
    console.log("\n── API Access Rules ──");
    var apis = ["cookies()", "headers()", "searchParams", "connection()"];
    var directives = ["use cache", "use cache: private"];
    for (var d = 0; d < directives.length; d++) {
      for (var a = 0; a < apis.length; a++) {
        var check = checkApiAccess(directives[d], apis[a]);
        console.log(
          "  " + check.directive + " + " + check.api + " → " + check.allowed,
        );
      }
      if (d === 0) console.log("  ────");
    }

    // Private cache with cookies!
    console.log("\n── Private Cache (with cookies!) ──");
    function getRecommendations(productId) {
      var sessionId = cookies()["session-id"];
      return "recs_for_" + productId + "_user_" + sessionId;
    }

    var r1 = useCachePrivate(
      "getRecommendations",
      getRecommendations,
      ["product-1"],
      { cacheLife: { stale: 60 }, tag: "recommendations-product-1" },
    );
    console.log("  Call 1:", r1.hit ? "HIT" : "MISS", "→", r1.value);
    console.log("  Storage:", r1.storage, "| Server stored:", r1.serverStored);

    var r2 = useCachePrivate(
      "getRecommendations",
      getRecommendations,
      ["product-1"],
      { cacheLife: { stale: 60 } },
    );
    console.log("  Call 2:", r2.hit ? "HIT" : "MISS", "(cached!)");

    // Regular cache comparison
    console.log("\n── Regular Cache (no cookies!) ──");
    function getProductDetails(id) {
      return "details_" + id;
    }

    var r3 = useCacheRegular("getProductDetails", getProductDetails, [
      "product-1",
    ]);
    console.log("  Call 1:", r3.hit ? "HIT" : "MISS", "→", r3.value);
    console.log("  Storage:", r3.storage, "| Server stored:", r3.serverStored);

    // Page reload!
    console.log("\n── Page Reload Simulation ──");
    console.log(
      "  Before: browser=" +
        Object.keys(browserCache).length +
        ", server=" +
        Object.keys(serverCache).length,
    );
    var reload = simulatePageReload();
    console.log("  RELOAD!");
    console.log("  Browser cache LOST:", reload.browserCacheLost, "entries");
    console.log("  Server cache KEPT:", reload.serverCacheKept, "entries");

    // After reload: private cache = MISS!
    var r4 = useCachePrivate(
      "getRecommendations",
      getRecommendations,
      ["product-1"],
      { cacheLife: { stale: 60 } },
    );
    console.log(
      "  Private after reload:",
      r4.hit ? "HIT" : "MISS",
      "(re-fetched!)",
    );

    // After reload: regular cache = HIT!
    var r5 = useCacheRegular("getProductDetails", getProductDetails, [
      "product-1",
    ]);
    console.log(
      "  Regular after reload:",
      r5.hit ? "HIT" : "MISS",
      "(still cached!)",
    );

    // cacheLife minimum
    console.log("\n── cacheLife Minimum ──");
    cacheLife({ stale: 10 }); // warning!
    cacheLife({ stale: 60 }); // OK!
    console.log("  ✅ stale: 60s accepted!");

    // On-demand invalidation
    console.log("\n── On-Demand Invalidation ──");
    useCachePrivate("getRecommendations", getRecommendations, ["product-1"], {
      cacheLife: { stale: 60 },
      tag: "recs",
    });
    console.log("  Cache entries:", Object.keys(browserCache).length);
    var inv = updateTag("recs");
    console.log('  updateTag("recs") → invalidated:', inv.invalidated);
    console.log("  Cache entries:", Object.keys(browserCache).length);
  }

  return { demo: demo };
})();
// Chạy: PrivateCacheEngine.demo();
```

---

## §6. Câu Hỏi Luyện Tập!

**Câu 1**: `use cache` vs `use cache: private` — khác nhau cơ bản?

<details><summary>Đáp án</summary>

|                     | `use cache`             | `use cache: private`   |
| ------------------- | ----------------------- | ---------------------- |
| **Storage**         | Server in-memory (LRU!) | Browser memory ONLY!   |
| **Persist reload?** | ✅ Yes (server keeps!)  | ❌ No (browser loses!) |
| **cookies()**       | ❌ ERROR!               | ✅ ALLOWED!            |
| **headers()**       | ❌ ERROR!               | ✅ ALLOWED!            |
| **Static shell?**   | ✅ Included!            | ❌ Excluded!           |
| **Custom handlers** | ✅ Yes!                 | ❌ No!                 |
| **Executes**        | Once → cached!          | Every server render!   |

**Key insight**: Private = browser-only cache, so runtime data (cookies/headers) is safe — same user, same browser, no leak risk!

</details>

---

**Câu 2**: Tại sao `stale` phải ≥ 30 giây?

<details><summary>Đáp án</summary>

```
REASON: Runtime prefetching requirement!

Runtime prefetching = router prefetches past the static shell
into cached scopes!

If stale < 30s:
  → Cache expires too quickly!
  → Prefetched data becomes stale immediately!
  → Wasted network requests!
  → Poor user experience!

If stale ≥ 30s:
  → Router can prefetch + cache will still be valid!
  → User navigates → cached data ready! ⚡
  → Smooth experience! ✅

NOTE: This is the MINIMUM enforced by Next.js client router!
Even 'use cache' (regular) has 30s minimum stale time!
```

</details>

---

**Câu 3**: `connection()` — tại sao CẢ HAI directive đều cấm?

<details><summary>Đáp án</summary>

```
connection() provides CONNECTION-SPECIFIC information!

Examples:
  → IP address, TLS version, protocol details!
  → These change PER CONNECTION, not per user!

Even in private cache (browser-only):
  → Same user, same browser, DIFFERENT connections!
  → Tab A vs Tab B = different connections!
  → WiFi vs 4G = different connections!
  → Caching connection data = ALWAYS wrong! ❌

Result: connection() = PROHIBITED in ALL cache contexts!
  • 'use cache'          → ❌
  • 'use cache: private' → ❌
  • 'use cache: remote'  → ❌
```

</details>

---

**Câu 4**: Khi nào dùng `use cache: private` thay vì refactor?

<details><summary>Đáp án</summary>

```
PREFERRED: Refactor (move cookies outside, pass as args!)
  async function Page() {
    const theme = (await cookies()).get('theme')
    return <CachedComponent theme={theme} />
  }
  // → theme becomes cache key! Clean! ✅

USE PRIVATE WHEN:
  ① Can't refactor:
     → Deep call stack! cookies() used 5 levels deep!
     → Legacy code! Too many touchpoints to change!
     → Time pressure! Ship now, refactor later!

  ② Compliance:
     → GDPR: "User data must NOT be stored on server!"
     → HIPAA: "Patient data must NOT persist server-side!"
     → 'use cache: private' = browser only = compliant! ✅

  ③ Personalization:
     → Personalized recommendations per user session!
     → User-specific pricing based on cookies!
     → A/B test variants from cookies!

RULE: Try refactoring FIRST! Only use private if needed!
```

</details>
