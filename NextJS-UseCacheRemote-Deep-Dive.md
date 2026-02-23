# Next.js `use cache: remote` — Deep Dive!

> **Chủ đề**: `use cache: remote` — Persistent, Shared Caching!
> **Ngôn ngữ**: Tiếng Việt — giải thích cực kỳ chi tiết!
> **Phương châm**: Tự viết lại bằng tay — KHÔNG dùng thư viện!
> **Nguồn**: https://nextjs.org/docs/app/api-reference/directives/use-cache-remote
> **Lưu ý**: Trang gốc KHÔNG có sơ đồ — tất cả diagrams TỰ VẼ!

---

## Mục Lục

1. [§1. Tổng Quan — Tại sao cần Remote?](#1)
2. [§2. When to Avoid vs When to Use!](#2)
3. [§3. So Sánh 3 Directives — FINAL!](#3)
4. [§4. Cache Key Considerations!](#4)
5. [§5. Nesting Rules!](#5)
6. [§6. Examples — 5 Patterns!](#6)
7. [§7. Tự Viết — RemoteCacheEngine!](#7)
8. [§8. Câu Hỏi Luyện Tập](#8)

---

## §1. Tổng Quan — Tại sao cần Remote?

```
  PROBLEM WITH 'use cache' (in-memory):
  ┌────────────────────────────────────────────────────────────┐
  │                                                            │
  │  In-memory cache (LRU) has LIMITATIONS:                    │
  │  ┌──────────────────────────────────────────────────────┐  │
  │  │ ① Entries EVICTED to make room for new ones!        │  │
  │  │ ② Memory CONSTRAINTS in deployment!                 │  │
  │  │ ③ NOT persistent across requests/restarts!           │  │
  │  │ ④ Serverless: memory NOT shared between instances!  │  │
  │  │   → Each instance has EPHEMERAL memory!             │  │
  │  │   → Destroyed after serving request!                │  │
  │  │   → Frequent cache MISSES! ❌                      │  │
  │  └──────────────────────────────────────────────────────┘  │
  │                                                            │
  │  SOLUTION: 'use cache: remote'!                            │
  │  ┌──────────────────────────────────────────────────────┐  │
  │  │                                                      │  │
  │  │  ┌─────────────┐   ┌─────────────┐   ┌──────────┐  │  │
  │  │  │ Instance A  │   │ Instance B  │   │Instance C│  │  │
  │  │  │ (serverless)│   │ (serverless)│   │(serverl.)│  │  │
  │  │  └──────┬──────┘   └──────┬──────┘   └────┬─────┘  │  │
  │  │         │                 │                │         │  │
  │  │         └─────────────┬───┘────────────────┘         │  │
  │  │                       │                              │  │
  │  │              ┌────────▼────────┐                     │  │
  │  │              │ REMOTE CACHE    │                     │  │
  │  │              │ (Redis / KV DB) │                     │  │
  │  │              │ SHARED! DURABLE!│                     │  │
  │  │              │ All instances!  │                     │  │
  │  │              └─────────────────┘                     │  │
  │  │                                                      │  │
  │  └──────────────────────────────────────────────────────┘  │
  │                                                            │
  │  TRADEOFFS:                                                 │
  │  ┌──────────┬──────────────────────────────────────────┐   │
  │  │ Benefit  │ Cost                                     │   │
  │  ├──────────┼──────────────────────────────────────────┤   │
  │  │ Durable! │ Infrastructure cost (Redis/KV fees!)     │   │
  │  │ Shared!  │ Network latency (cache lookup roundtrip!)│   │
  │  └──────────┴──────────────────────────────────────────┘   │
  │                                                            │
  │  SETUP:                                                     │
  │  ┌──────────────────────────────────────────────────────┐  │
  │  │ // next.config.ts                                    │  │
  │  │ const nextConfig: NextConfig = {                     │  │
  │  │   cacheComponents: true,  // ← enable!              │  │
  │  │ }                                                    │  │
  │  │                                                      │  │
  │  │ // Handler: configured via cacheHandlers!            │  │
  │  │ // → Hosting providers provide automatically!       │  │
  │  │ // → Self-hosting: configure cacheHandlers manually!│  │
  │  └──────────────────────────────────────────────────────┘  │
  │                                                            │
  │  NOTE: use cache STILL provides value!                     │
  │  → Informs Next.js what can be prefetched!                │
  │  → Defines stale times for client-side navigation!        │
  │                                                            │
  └────────────────────────────────────────────────────────────┘
```

---

## §2. When to Avoid vs When to Use!

```
  DECISION GUIDE:
  ┌────────────────────────────────────────────────────────────┐
  │                                                            │
  │  ❌ AVOID remote caching when:                            │
  │  ┌──────────────────────────────────────────────────────┐  │
  │  │ ① Already have KV store wrapping data layer!        │  │
  │  │   → use cache sufficient! No extra layer needed!    │  │
  │  │                                                      │  │
  │  │ ② Operations already FAST (<50ms)!                  │  │
  │  │   → Remote lookup might be SLOWER than source!      │  │
  │  │                                                      │  │
  │  │ ③ Cache keys mostly UNIQUE per request!             │  │
  │  │   → Search filters, price ranges, user-specific!    │  │
  │  │   → Cache utilization = near ZERO! Waste of $$$!    │  │
  │  │                                                      │  │
  │  │ ④ Data changes FREQUENTLY (seconds-minutes)!        │  │
  │  │   → Cache goes stale quickly!                       │  │
  │  │   → Frequent misses! Wait for revalidation!         │  │
  │  └──────────────────────────────────────────────────────┘  │
  │                                                            │
  │  ✅ USE remote caching when:                              │
  │  ┌──────────────────────────────────────────────────────┐  │
  │  │ COMPELLING SCENARIOS:                                │  │
  │  │ ┌──────────────────┬────────────────────────────┐   │  │
  │  │ │ Scenario         │ Why remote helps!          │   │  │
  │  │ ├──────────────────┼────────────────────────────┤   │  │
  │  │ │ Rate-limited APIs│ Avoid hitting quotas!      │   │  │
  │  │ │ Slow backends    │ Backend = bottleneck!      │   │  │
  │  │ │ Expensive ops    │ Costly DB/compute! $$$ !   │   │  │
  │  │ │ Flaky services   │ External fails sometimes!  │   │  │
  │  │ │ Serverless env   │ Ephemeral memory!          │   │  │
  │  │ │                  │ Low in-memory hit rates!   │   │  │
  │  │ └──────────────────┴────────────────────────────┘   │  │
  │  │                                                      │  │
  │  │ BEST FIT: Content deferred to request time!          │  │
  │  │ → Component accesses cookies/headers/searchParams!  │  │
  │  │ → Inside Suspense boundary!                         │  │
  │  │ → Each request looks up cache!                      │  │
  │  │ → Remote = shared across ALL serverless instances!  │  │
  │  └──────────────────────────────────────────────────────┘  │
  │                                                            │
  │  PATTERN: Same as putting KV store in front of DB!        │
  │  But DECLARED IN CODE! ✅                                 │
  │                                                            │
  └────────────────────────────────────────────────────────────┘
```

---

## §3. So Sánh 3 Directives — FINAL!

```
  3 CACHE DIRECTIVES — COMPLETE COMPARISON:
  ┌──────────────────────────────────────────────────────────────────┐
  │                                                                  │
  │  ┌─────────────────┬──────────────┬──────────────┬─────────────┐│
  │  │                 │ 'use cache'  │ 'use cache:  │ 'use cache: ││
  │  │                 │              │  remote'     │  private'   ││
  │  ├─────────────────┼──────────────┼──────────────┼─────────────┤│
  │  │ Storage         │ In-memory    │ Platform     │ Browser     ││
  │  │                 │ (LRU!)       │ handler!     │ memory!     ││
  │  │                 │              │ (Redis/KV!)  │             ││
  │  │ Location        │ Server node  │ Remote store │ Client      ││
  │  │ Shared?         │ Per-instance │ ALL instances│ Per-user    ││
  │  │ Persist?        │ ❌ Ephemeral│ ✅ Durable! │ ❌ Reload= ││
  │  │                 │              │              │    lost!    ││
  │  │ cookies()       │ ❌ ERROR!   │ ❌ ERROR!   │ ✅ YES!    ││
  │  │ headers()       │ ❌ ERROR!   │ ❌ ERROR!   │ ✅ YES!    ││
  │  │ searchParams    │ ❌ ERROR!   │ ❌ ERROR!   │ ✅ YES!    ││
  │  │ connection()    │ ❌ ERROR!   │ ❌ ERROR!   │ ❌ ERROR!  ││
  │  │ Static shell?   │ ✅ Yes!     │ ✅ Yes!     │ ❌ No!     ││
  │  │ cacheHandlers   │ ✅ Custom!  │ ✅ Custom!  │ ❌ No!     ││
  │  │ Network cost    │ None!        │ Roundtrip!   │ None!       ││
  │  │ Platform fees   │ None!        │ $$$ Yes!     │ None!       ││
  │  │ Serverless      │ Low hit rate!│ HIGH hit rate│ Per-user!   ││
  │  │                 │ (ephemeral!) │ (shared!) ✅│             ││
  │  │ Best for        │ Default!     │ Scale!       │ Compliance! ││
  │  │                 │ Most cases!  │ High traffic!│ Can't refac!││
  │  └─────────────────┴──────────────┴──────────────┴─────────────┘│
  │                                                                  │
  │  Runtime data pattern (for use cache + remote):                  │
  │  ┌──────────────────────────────────────────────────────┐        │
  │  │ // Read OUTSIDE → pass as ARGUMENT!                 │        │
  │  │ const lang = (await cookies()).get('language')       │        │
  │  │ const data = await getCMSContent(lang)               │        │
  │  │                                                      │        │
  │  │ async function getCMSContent(language) {             │        │
  │  │   'use cache: remote'                                │        │
  │  │   return cms.getContent(language)                    │        │
  │  │ }                                                    │        │
  │  └──────────────────────────────────────────────────────┘        │
  │                                                                  │
  └──────────────────────────────────────────────────────────────────┘
```

---

## §4. Cache Key Considerations!

```
  CACHE KEY OPTIMIZATION:
  ┌────────────────────────────────────────────────────────────┐
  │                                                            │
  │  PRINCIPLE: Choose dimension with FEWER unique values!     │
  │                                                            │
  │  ❌ BAD: Cache per price filter (10,000+ values!)         │
  │  ┌──────────────────────────────────────────────────────┐  │
  │  │ cache(category='shoes', minPrice='10.00')  → entry 1│  │
  │  │ cache(category='shoes', minPrice='10.50')  → entry 2│  │
  │  │ cache(category='shoes', minPrice='11.00')  → entry 3│  │
  │  │ ... 10,000 entries! Near-zero hit rate! ❌          │  │
  │  └──────────────────────────────────────────────────────┘  │
  │                                                            │
  │  ✅ GOOD: Cache per category (10-50 values!)              │
  │  ┌──────────────────────────────────────────────────────┐  │
  │  │ cache(category='shoes')     → entry 1 (all shoes!)  │  │
  │  │ cache(category='shirts')    → entry 2 (all shirts!) │  │
  │  │ ... 10-50 entries! HIGH hit rate! ✅                │  │
  │  │                                                      │  │
  │  │ → Then filter price IN MEMORY! (cheap!)             │  │
  │  └──────────────────────────────────────────────────────┘  │
  │                                                            │
  │  CODE PATTERN:                                              │
  │  ┌──────────────────────────────────────────────────────┐  │
  │  │ async function ProductList({ params, searchParams }) {│  │
  │  │   const { category } = await params                  │  │
  │  │   const { minPrice } = await searchParams            │  │
  │  │                                                      │  │
  │  │   // Cache on CATEGORY (few values!)                 │  │
  │  │   const products = await getByCategory(category)     │  │
  │  │                                                      │  │
  │  │   // Filter price IN MEMORY (not in cache key!)      │  │
  │  │   const filtered = minPrice                          │  │
  │  │     ? products.filter(p => p.price >= minPrice)      │  │
  │  │     : products                                       │  │
  │  │   return ...                                         │  │
  │  │ }                                                    │  │
  │  │                                                      │  │
  │  │ async function getByCategory(category) {             │  │
  │  │   'use cache: remote'                                │  │
  │  │   return db.products.findByCategory(category)        │  │
  │  │ }                                                    │  │
  │  └──────────────────────────────────────────────────────┘  │
  │                                                            │
  │  SAME PATTERN FOR USER DATA:                                │
  │  ┌──────────────────────────────────────────────────────┐  │
  │  │ ❌ getUserProfile(sessionID) → 1 entry PER USER!   │  │
  │  │    → 100,000 users = 100,000 entries!               │  │
  │  │                                                      │  │
  │  │ ✅ getCMSContent(language) → 1 entry PER LANGUAGE! │  │
  │  │    → 10-50 languages = 10-50 entries!               │  │
  │  │    → ALL users with same lang share entry! ✅       │  │
  │  └──────────────────────────────────────────────────────┘  │
  │                                                            │
  └────────────────────────────────────────────────────────────┘
```

---

## §5. Nesting Rules!

```
  NESTING RULES:
  ┌────────────────────────────────────────────────────────────┐
  │                                                            │
  │  ┌───────────────────┬──────────┬──────────┬──────────┐   │
  │  │ Inner ↓ Outer →   │ use cache│ remote   │ private  │   │
  │  ├───────────────────┼──────────┼──────────┼──────────┤   │
  │  │ use cache         │ ✅       │ ✅       │ ✅       │   │
  │  │ remote            │ ✅       │ ✅       │ ❌       │   │
  │  │ private           │ ✅       │ ❌       │ ✅       │   │
  │  └───────────────────┴──────────┴──────────┴──────────┘   │
  │                                                            │
  │  KEY RULES:                                                 │
  │  ✅ remote inside remote → OK!                            │
  │  ✅ remote inside regular (use cache) → OK!               │
  │  ❌ remote inside private → ERROR!                        │
  │  ❌ private inside remote → ERROR!                        │
  │                                                            │
  │  WHY remote ↔ private CAN'T mix?                          │
  │  ┌──────────────────────────────────────────────────────┐  │
  │  │ remote = shared across ALL users (server-side!)      │  │
  │  │ private = per-user (browser-only, uses cookies!)     │  │
  │  │                                                      │  │
  │  │ If remote inside private:                            │  │
  │  │   private accesses cookies → remote can't cache     │  │
  │  │   with cookie data safely!                           │  │
  │  │                                                      │  │
  │  │ If private inside remote:                            │  │
  │  │   remote is shared → private's per-user data        │  │
  │  │   would leak to shared cache!                        │  │
  │  └──────────────────────────────────────────────────────┘  │
  │                                                            │
  └────────────────────────────────────────────────────────────┘
```

---

## §6. Examples — 5 Patterns!

```
  5 REMOTE CACHE PATTERNS:
  ┌────────────────────────────────────────────────────────────┐
  │                                                            │
  │  ① USER PREFERENCES (currency cookie!):                   │
  │  ┌──────────────────────────────────────────────────────┐  │
  │  │ async function ProductPrice({ productId }) {         │  │
  │  │   const currency = (await cookies())                 │  │
  │  │     .get('currency')?.value ?? 'USD'                 │  │
  │  │   const price = await getPrice(productId, currency)  │  │
  │  │   return <div>Price: {price} {currency}</div>        │  │
  │  │ }                                                    │  │
  │  │ async function getPrice(productId, currency) {       │  │
  │  │   'use cache: remote'                                │  │
  │  │   cacheTag(`product-price-${productId}`)             │  │
  │  │   cacheLife({ expire: 3600 })  // 1 hour!           │  │
  │  │   return db.products.getPrice(productId, currency)   │  │
  │  │ }                                                    │  │
  │  │ // Key: (productId, currency) → few currencies!    │  │
  │  │ // All users with same currency SHARE entry! ✅     │  │
  │  └──────────────────────────────────────────────────────┘  │
  │                                                            │
  │  ② REDUCING DATABASE LOAD (connection()!):                │
  │  ┌──────────────────────────────────────────────────────┐  │
  │  │ async function DashboardStats() {                    │  │
  │  │   await connection()  // defer to request time!     │  │
  │  │   const stats = await getGlobalStats()               │  │
  │  │   return <StatsDisplay stats={stats} />              │  │
  │  │ }                                                    │  │
  │  │ async function getGlobalStats() {                    │  │
  │  │   'use cache: remote'                                │  │
  │  │   cacheTag('global-stats')                           │  │
  │  │   cacheLife({ expire: 60 })  // 1 minute!           │  │
  │  │   return db.analytics.aggregate({                    │  │
  │  │     total_users: 'count',                            │  │
  │  │     active_sessions: 'count',                        │  │
  │  │     revenue: 'sum',                                  │  │
  │  │   })                                                 │  │
  │  │ }                                                    │  │
  │  │ // DB sees MAX 1 request per minute! ✅             │  │
  │  │ // Regardless of how many users visit!               │  │
  │  └──────────────────────────────────────────────────────┘  │
  │                                                            │
  │  ③ API STREAMING (external service!):                     │
  │  ┌──────────────────────────────────────────────────────┐  │
  │  │ async function FeedItems() {                         │  │
  │  │   await connection()                                 │  │
  │  │   const items = await getFeedItems()                 │  │
  │  │   return items.map(item => <FeedItem item={item} />) │  │
  │  │ }                                                    │  │
  │  │ async function getFeedItems() {                      │  │
  │  │   'use cache: remote'                                │  │
  │  │   cacheTag('feed-items')                             │  │
  │  │   cacheLife({ expire: 120 })  // 2 minutes!         │  │
  │  │   return (await fetch('https://api.example.com/feed')│  │
  │  │   ).json()                                           │  │
  │  │ }                                                    │  │
  │  │ // Reduces external API calls dramatically! ✅      │  │
  │  └──────────────────────────────────────────────────────┘  │
  │                                                            │
  │  ④ COMPUTED DATA AFTER SECURITY CHECK:                    │
  │  ┌──────────────────────────────────────────────────────┐  │
  │  │ async function ReportsPage() {                       │  │
  │  │   await connection()  // security check!            │  │
  │  │   const report = await generateReport()              │  │
  │  │   return <ReportViewer report={report} />            │  │
  │  │ }                                                    │  │
  │  │ async function generateReport() {                    │  │
  │  │   'use cache: remote'                                │  │
  │  │   cacheLife({ expire: 3600 })  // 1 hour!           │  │
  │  │   const data = await db.transactions.findMany()      │  │
  │  │   return {                                           │  │
  │  │     totalRevenue: calculateRevenue(data),            │  │
  │  │     topProducts: analyzeProducts(data),              │  │
  │  │     trends: calculateTrends(data),                   │  │
  │  │   }                                                  │  │
  │  │ }                                                    │  │
  │  │ // Expensive computation cached 1 hour! ✅          │  │
  │  │ // All authorized users share same report!           │  │
  │  └──────────────────────────────────────────────────────┘  │
  │                                                            │
  │  ⑤ MIXED STRATEGIES (ALL 3 together!):                    │
  │  ┌──────────────────────────────────────────────────────┐  │
  │  │ ProductPage architecture:                            │  │
  │  │                                                      │  │
  │  │ ┌─── 'use cache' ──────────────────────────┐        │  │
  │  │ │ getProduct(id)                            │        │  │
  │  │ │ → Static! Build time! Shared ALL users!  │        │  │
  │  │ └──────────────────────────────────────────┘        │  │
  │  │                                                      │  │
  │  │ ┌─── 'use cache: remote' ──────────────────┐        │  │
  │  │ │ getProductPrice(id)                       │        │  │
  │  │ │ → Runtime! Remote handler! Shared ALL!   │        │  │
  │  │ │ → expire: 5 minutes!                     │        │  │
  │  │ └──────────────────────────────────────────┘        │  │
  │  │                                                      │  │
  │  │ ┌─── 'use cache: private' ─────────────────┐        │  │
  │  │ │ getRecommendations(productId)             │        │  │
  │  │ │ → Runtime! Browser only! Per-user!       │        │  │
  │  │ │ → cookies('session-id')! expire: 1 min! │        │  │
  │  │ └──────────────────────────────────────────┘        │  │
  │  │                                                      │  │
  │  │ → Each layer optimized for its data pattern! ✅     │  │
  │  └──────────────────────────────────────────────────────┘  │
  │                                                            │
  └────────────────────────────────────────────────────────────┘
```

---

## §7. Tự Viết — RemoteCacheEngine!

```javascript
var RemoteCacheEngine = (function () {
  // ═══════════════════════════════════
  // 1. THREE CACHE STORES
  // ═══════════════════════════════════
  var inMemoryCache = {}; // 'use cache' → per instance!
  var remoteCache = {}; // 'use cache: remote' → shared!
  var browserCache = {}; // 'use cache: private' → per user!

  var stats = { inMemoryHits: 0, remoteHits: 0, misses: 0 };

  // ═══════════════════════════════════
  // 2. NESTING RULES
  // ═══════════════════════════════════
  var nestingRules = {
    "use cache": { parent: ["use cache", "remote", "private"], valid: true },
    "use cache: remote": { parent: ["use cache", "remote"], valid: true },
    "use cache: private": { parent: ["use cache", "private"], valid: true },
  };

  function canNest(innerDirective, outerDirective) {
    var inner =
      innerDirective === "use cache: remote"
        ? "remote"
        : innerDirective === "use cache: private"
          ? "private"
          : "use cache";
    var outer =
      outerDirective === "use cache: remote"
        ? "remote"
        : outerDirective === "use cache: private"
          ? "private"
          : "use cache";
    var rules = nestingRules[innerDirective];
    if (!rules) return false;
    return rules.parent.indexOf(outer) !== -1;
  }

  // ═══════════════════════════════════
  // 3. CACHE KEY ANALYZER
  // ═══════════════════════════════════
  function analyzeCacheKey(args) {
    var uniqueValues = {};
    for (var key in args) {
      var val = args[key];
      if (typeof val === "string") {
        // Estimate uniqueness
        if (key === "category" || key === "language" || key === "currency") {
          uniqueValues[key] = { type: "LOW cardinality", recommended: true };
        } else if (
          key === "userId" ||
          key === "sessionId" ||
          key === "minPrice"
        ) {
          uniqueValues[key] = { type: "HIGH cardinality", recommended: false };
        } else {
          uniqueValues[key] = { type: "UNKNOWN", recommended: null };
        }
      }
    }
    return uniqueValues;
  }

  // ═══════════════════════════════════
  // 4. REMOTE CACHE WRAPPER
  // ═══════════════════════════════════
  function useCacheRemote(funcId, fn, args, options) {
    options = options || {};
    var expire = (options.cacheLife && options.cacheLife.expire) || 300;
    var key = funcId + "|" + JSON.stringify(args);

    // Check remote cache (network roundtrip simulated!)
    if (remoteCache[key]) {
      var entry = remoteCache[key];
      var age = (Date.now() - entry.timestamp) / 1000;

      if (age < expire) {
        stats.remoteHits++;
        return {
          hit: true,
          value: entry.value,
          age: Math.round(age),
          storage: "REMOTE (Redis/KV)",
          shared: true,
          networkCost: "~5ms roundtrip",
        };
      }
      delete remoteCache[key];
    }

    // Cache MISS → execute!
    stats.misses++;
    var result = fn.apply(null, args);

    // Store in REMOTE (shared across ALL instances!)
    remoteCache[key] = { value: result, timestamp: Date.now() };

    if (options.tag) {
      if (!remoteCache._tags) remoteCache._tags = {};
      if (!remoteCache._tags[options.tag]) remoteCache._tags[options.tag] = [];
      remoteCache._tags[options.tag].push(key);
    }

    return {
      hit: false,
      value: result,
      storage: "REMOTE (Redis/KV)",
      shared: true,
    };
  }

  // ═══════════════════════════════════
  // 5. IN-MEMORY CACHE WRAPPER (comparison)
  // ═══════════════════════════════════
  function useCacheInMemory(funcId, fn, args) {
    var key = funcId + "|" + JSON.stringify(args);
    if (inMemoryCache[key]) {
      stats.inMemoryHits++;
      return {
        hit: true,
        value: inMemoryCache[key].value,
        storage: "IN-MEMORY (per instance)",
      };
    }
    stats.misses++;
    var result = fn.apply(null, args);
    inMemoryCache[key] = { value: result, timestamp: Date.now() };
    return { hit: false, value: result, storage: "IN-MEMORY" };
  }

  // ═══════════════════════════════════
  // 6. SERVERLESS INSTANCE SIMULATOR
  // ═══════════════════════════════════
  function simulateServerlessRestart() {
    var inMemCount = Object.keys(inMemoryCache).length;
    inMemoryCache = {}; // DESTROYED!
    // remoteCache SURVIVES!
    return {
      inMemoryLost: inMemCount,
      remoteKept: Object.keys(remoteCache).length,
    };
  }

  // ═══════════════════════════════════
  // 7. DEMO
  // ═══════════════════════════════════
  function demo() {
    console.log("╔══════════════════════════════════════╗");
    console.log("║  REMOTE CACHE ENGINE DEMO             ║");
    console.log("╚══════════════════════════════════════╝");

    // Nesting rules
    console.log("\n── Nesting Rules ──");
    var combos = [
      ["use cache: remote", "use cache: remote"],
      ["use cache: remote", "use cache"],
      ["use cache: remote", "use cache: private"],
      ["use cache: private", "use cache: remote"],
    ];
    for (var i = 0; i < combos.length; i++) {
      var inner = combos[i][0],
        outer = combos[i][1];
      var ok = canNest(inner, outer);
      console.log(
        "  " + inner + " inside " + outer + " → " + (ok ? "✅ OK" : "❌ ERROR"),
      );
    }

    // Cache key analysis
    console.log("\n── Cache Key Analysis ──");
    var analysis = analyzeCacheKey({
      category: "shoes",
      minPrice: "10.00",
      language: "en",
    });
    for (var k in analysis) {
      console.log(
        "  " +
          k +
          ": " +
          analysis[k].type +
          (analysis[k].recommended
            ? " → ✅ Use as key!"
            : analysis[k].recommended === false
              ? " → ❌ Filter in memory!"
              : " → ? Evaluate!"),
      );
    }

    // Remote vs in-memory: DB query
    console.log("\n── Remote Cache (DB query) ──");
    function getGlobalStats() {
      return { users: 10000, sessions: 500 };
    }

    var r1 = useCacheRemote("getGlobalStats", getGlobalStats, [], {
      cacheLife: { expire: 60 },
      tag: "global-stats",
    });
    console.log("  Call 1:", r1.hit ? "HIT" : "MISS", "| Storage:", r1.storage);
    var r2 = useCacheRemote("getGlobalStats", getGlobalStats, []);
    console.log("  Call 2:", r2.hit ? "HIT" : "MISS", "(shared!)");

    // Serverless restart!
    console.log("\n── Serverless Restart ──");
    useCacheInMemory(
      "inMemFunc",
      function () {
        return "cached";
      },
      [],
    );
    console.log(
      "  Before: inMemory=" +
        Object.keys(inMemoryCache).length +
        ", remote=" +
        Object.keys(remoteCache).length,
    );
    var restart = simulateServerlessRestart();
    console.log("  RESTART!");
    console.log("  In-memory LOST:", restart.inMemoryLost);
    console.log("  Remote KEPT:", restart.remoteKept);

    // After restart: in-memory = MISS, remote = HIT!
    var r3 = useCacheInMemory(
      "inMemFunc",
      function () {
        return "cached";
      },
      [],
    );
    console.log("  In-memory after restart:", r3.hit ? "HIT" : "MISS");
    var r4 = useCacheRemote("getGlobalStats", getGlobalStats, []);
    console.log("  Remote after restart:", r4.hit ? "HIT" : "MISS", "✅");

    // Mixed strategy
    console.log("\n── Mixed Strategy ──");
    function getProduct(id) {
      return "product_" + id;
    }
    function getPrice(id) {
      return 99.99;
    }

    useCacheInMemory("getProduct", getProduct, ["prod-1"]);
    console.log("  getProduct → use cache (static!)");
    useCacheRemote("getPrice", getPrice, ["prod-1"], {
      cacheLife: { expire: 300 },
      tag: "price",
    });
    console.log("  getPrice → use cache: remote (shared!)");
    console.log("  getRecs → use cache: private (per-user!)");

    // Stats
    console.log("\n── Stats ──");
    console.log("  In-memory hits:", stats.inMemoryHits);
    console.log("  Remote hits:", stats.remoteHits);
    console.log("  Total misses:", stats.misses);
  }

  return { demo: demo };
})();
// Chạy: RemoteCacheEngine.demo();
```

---

## §8. Câu Hỏi Luyện Tập!

**Câu 1**: `use cache` vs `use cache: remote` — khi nào chọn remote?

<details><summary>Đáp án</summary>

```
CHOOSE REMOTE WHEN:
  ① Serverless environment!
     → In-memory = ephemeral! Destroyed per request!
     → Remote = shared across ALL instances! ✅

  ② Rate-limited APIs!
     → Remote cache absorbs ALL requests!
     → Upstream sees only 1 request per TTL! ✅

  ③ Expensive DB queries!
     → db.analytics.aggregate() = costly!
     → Cache 1 minute → DB sees 1 req/min! ✅

  ④ Flaky external services!
     → Service fails sometimes?
     → Cached result = fallback! ✅

STAY WITH use cache WHEN:
  → Already have KV store wrapping data!
  → Operations < 50ms (remote lookup = slower!)
  → Cache keys mostly unique per request!
  → Data changes every few seconds!
```

</details>

---

**Câu 2**: Cache key optimization — tại sao cache `category` thay vì `minPrice`?

<details><summary>Đáp án</summary>

```
CARDINALITY matters!

category: 10-50 unique values
  → 10-50 cache entries
  → HIGH hit rate! (many users browse same category!)
  → Storage: small!

minPrice: 10,000+ unique values
  → $10.00, $10.50, $11.00, $11.50...
  → EACH creates separate cache entry!
  → Near-ZERO hit rate! (few users use exact same price!)
  → Storage: wasted!

SOLUTION:
  Cache on LOW cardinality dimension (category!)
  Filter on HIGH cardinality dimension in MEMORY (price!)
  → Larger entries (all products) but MUCH higher hit rate!
  → Cost of miss (hitting DB) >> cost of larger storage!

SAME PATTERN:
  ❌ cache(userId)   → 100,000 entries!
  ✅ cache(language) → 10-50 entries! All same-lang users share!
```

</details>

---

**Câu 3**: Nesting rules — tại sao remote ↔ private KHÔNG mix được?

<details><summary>Đáp án</summary>

```
FUNDAMENTAL CONFLICT:
  remote = SERVER-SIDE, shared across ALL users!
  private = BROWSER-ONLY, per-user with cookies!

Remote inside private (❌):
  → Private scope already has cookies data!
  → Remote tries to store on server!
  → Cookie-specific data would be in shared cache!
  → User A's data visible to User B! SECURITY RISK! ❌

Private inside remote (❌):
  → Remote scope is shared!
  → Private tries to access cookies()!
  → Remote can't provide request-specific context!
  → Would break private's per-user guarantee! ❌

VALID combinations:
  remote inside remote → ✅ Both shared! Compatible!
  remote inside regular → ✅ Regular can defer to remote!
  regular inside any → ✅ Regular is most basic!
```

</details>

---

**Câu 4**: Mixed caching strategies — giải thích flow?

<details><summary>Đáp án</summary>

```
MIXED STRATEGY FLOW:

ProductPage:
  ┌────────────────────────────────────────────────┐
  │ BUILD TIME:                                    │
  │ getProduct(id)  'use cache'                    │
  │   → Prerendered! Static shell!                │
  │   → Cached at build! Shared all users!        │
  │                                                │
  │ RUNTIME (Suspense boundary):                   │
  │ getProductPrice(id)  'use cache: remote'       │
  │   → connection() defers to request time!      │
  │   → Remote Redis/KV lookup!                   │
  │   → Shared across all serverless instances!   │
  │   → expire: 5 min!                            │
  │                                                │
  │ getRecommendations(productId)  'use cache: private'│
  │   → cookies('session-id') for personalization!│
  │   → Browser memory only!                      │
  │   → Per-user, never shared!                   │
  │   → expire: 1 min!                            │
  └────────────────────────────────────────────────┘

WHY mix? Each data type has DIFFERENT requirements!
  Static = build time (cheapest!)
  Shared dynamic = remote (best hit rate!)
  Per-user dynamic = private (safe + compliant!)
```

</details>
