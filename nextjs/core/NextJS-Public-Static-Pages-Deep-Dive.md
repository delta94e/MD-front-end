# Next.js Public Static Pages — Deep Dive!

> **Chủ đề**: Xây Dựng Trang Public — Shared Data Cho Mọi User!
> **Ngôn ngữ**: Tiếng Việt — giải thích cực kỳ chi tiết!
> **Phương châm**: Tự viết lại bằng tay — KHÔNG dùng thư viện!
> **Nguồn**: https://nextjs.org/docs/app/guides/public-static-pages
> **Lưu ý**: Trang gốc KHÔNG có sơ đồ — tất cả diagrams TỰ VẼ!

---

## Mục Lục

1. [§1. Tổng Quan — Public Pages Là Gì?](#1)
2. [§2. 3 Loại Component — Static, Dynamic, Cache!](#2)
3. [§3. 3-Step Example — Progressive Build!](#3)
4. [§4. Partial Prerendering (PPR)!](#4)
5. [§5. Tự Viết — PublicPageEngine!](#5)
6. [§6. Câu Hỏi Luyện Tập](#6)

---

## §1. Tổng Quan — Public Pages Là Gì?

```
  PUBLIC PAGES = SAME CONTENT CHO MỌI USER!
  ┌────────────────────────────────────────────────────────────┐
  │                                                            │
  │  PUBLIC PAGES:              PRIVATE PAGES:                  │
  │  ┌──────────────┐          ┌──────────────┐                │
  │  │ Landing page │          │ Dashboard    │                │
  │  │ Product list │          │ Profile      │                │
  │  │ Blog posts   │          │ Settings     │                │
  │  │ Marketing    │          │ Cart         │                │
  │  │ News/Docs    │          │ Orders       │                │
  │  └──────┬───────┘          └──────┬───────┘                │
  │         │                         │                         │
  │         ▼                         ▼                         │
  │  SHARED data!              USER-SPECIFIC data!              │
  │  → Mọi user thấy giống!  → Mỗi user khác nhau!         │
  │  → Có thể PRERENDER!    → Phải render per request!       │
  │  → CACHE được! ⚡        → KHÔNG cache! 🐌               │
  │                                                            │
  │  BENEFITS CỦA PUBLIC PAGES:                                │
  │  ① Faster page loads (prerendered → CDN serve!)          │
  │  ② Lower server costs (KHÔNG render mỗi request!)       │
  │  ③ Better SEO (content có sẵn cho crawlers!)            │
  │  ④ Scalable (CDN handles traffic, server nhẹ!)          │
  │                                                            │
  └────────────────────────────────────────────────────────────┘
```

---

## §2. 3 Loại Component — Static, Dynamic, Cache!

```
  3 COMPONENT TYPES:
  ┌────────────────────────────────────────────────────────────┐
  │                                                            │
  │  ① STATIC COMPONENT:                                      │
  │  ┌──────────────────────────────────────────────────────┐  │
  │  │ function Header() {                                  │  │
  │  │   return <h1>Shop</h1>                               │  │
  │  │ }                                                    │  │
  │  │                                                      │  │
  │  │ → KHÔNG phụ thuộc data, params, headers, time!     │  │
  │  │ → Output LUÔN giống! Có thể xác định trước!     │  │
  │  │ → Prerender tại BUILD TIME! ○                       │  │
  │  └──────────────────────────────────────────────────────┘  │
  │                                                            │
  │  ② DYNAMIC COMPONENT:                                     │
  │  ┌──────────────────────────────────────────────────────┐  │
  │  │ async function ProductList() {                       │  │
  │  │   const products = await db.product.findMany()       │  │
  │  │   return <List items={products} />                   │  │
  │  │ }                                                    │  │
  │  │                                                      │  │
  │  │ → Phụ thuộc EXTERNAL DATA! (db, API, etc.)        │  │
  │  │ → Data thay đổi → output thay đổi!              │  │
  │  │ → Default: render MỖI REQUEST! 🐌                  │  │
  │  │ → ⚠️ BLOCKS toàn bộ response!                    │  │
  │  │ → Warning: "Blocking data outside of Suspense"      │  │
  │  └──────────────────────────────────────────────────────┘  │
  │                                                            │
  │  ③ CACHE COMPONENT ('use cache'):                          │
  │  ┌──────────────────────────────────────────────────────┐  │
  │  │ async function ProductList() {                       │  │
  │  │   'use cache'   // ← cache directive!               │  │
  │  │   const products = await db.product.findMany()       │  │
  │  │   return <List items={products} />                   │  │
  │  │ }                                                    │  │
  │  │                                                      │  │
  │  │ → Output CACHED sau lần chạy đầu!                │  │
  │  │ → Reuse cho requests tiếp theo!                    │  │
  │  │ → Inputs known trước request → PRERENDERABLE!     │  │
  │  │ → Page vẫn STATIC! ○ ⚡                           │  │
  │  └──────────────────────────────────────────────────────┘  │
  │                                                            │
  │  SO SÁNH:                                                   │
  │  ┌──────────────┬──────────┬──────────┬──────────────┐     │
  │  │              │ Static   │ Dynamic  │ Cache        │     │
  │  ├──────────────┼──────────┼──────────┼──────────────┤     │
  │  │ Data?        │ Không   │ Có      │ Có (cached) │     │
  │  │ Render when? │ Build    │ Per req  │ First run    │     │
  │  │ Output       │ Stable   │ Changes  │ Stable       │     │
  │  │ Performance  │ ⚡ Best  │ 🐌 Slow │ ⚡ Fast     │     │
  │  │ Blocking?    │ No       │ YES! ⚠️ │ No           │     │
  │  │ Build symbol │ ○        │ λ        │ ○            │     │
  │  └──────────────┴──────────┴──────────┴──────────────┘     │
  │                                                            │
  └────────────────────────────────────────────────────────────┘
```

---

## §3. 3-Step Example — Progressive Build!

```
  STEP 1: STATIC PAGE (Header only!)
  ┌──────────────────────────────────────────────────────────┐
  │                                                          │
  │  function Header() { return <h1>Shop</h1> }             │
  │                                                          │
  │  export default async function Page() {                  │
  │    return <><Header /></>                                │
  │  }                                                       │
  │                                                          │
  │  next build output:                                      │
  │  ┌──────────────────────────────────────────────────┐    │
  │  │ Route (app)     Revalidate  Expire               │    │
  │  │ ┌ ○ /products   15m         1y                   │    │
  │  │ └ ○ /_not-found                                  │    │
  │  │ ○ (Static) prerendered as static content         │    │
  │  └──────────────────────────────────────────────────┘    │
  │  → ○ = STATIC! Prerendered at build time!               │
  │  → Không config gì! Next.js tự phát hiện!            │
  │                                                          │
  └──────────────────────────────────────────────────────────┘
```

```
  STEP 2: ADD PRODUCT LIST (Dynamic → Blocking!)
  ┌──────────────────────────────────────────────────────────┐
  │                                                          │
  │  async function ProductList() {                          │
  │    const products = await db.product.findMany()          │
  │    return <List items={products} />                      │
  │  }                                                       │
  │                                                          │
  │  export default async function Page() {                  │
  │    return (                                              │
  │      <>                                                  │
  │        <Header />        // render instantly!            │
  │        <ProductList />   // await data... BLOCKING! ⚠️ │
  │      </>                                                 │
  │    )                                                     │
  │  }                                                       │
  │                                                          │
  │  VẤN ĐỀ:                                                │
  │  ┌──────────┐ wait ┌──────────┐ wait ┌──────────┐       │
  │  │ Header   │ ════►│ Product  │ ════►│ Response │       │
  │  │ (0ms)    │      │ List     │      │ sent!    │       │
  │  │ ✅ done │      │ (3000ms) │      │ 🐌 slow │       │
  │  └──────────┘      │ 🔄 fetch│      └──────────┘       │
  │                    └──────────┘                          │
  │  Header XỎN nhưng KHÔNG GỬI ĐƯỢC vì ProductList        │
  │  chưa xong → ENTIRE route blocked!                      │
  │                                                          │
  │  Warning: "Blocking data was accessed outside Suspense"  │
  │                                                          │
  │  2 CHOICES:                                               │
  │  ┌────────────────┬──────────────────────────────────┐   │
  │  │ Option         │ Khi nào dùng?                   │   │
  │  ├────────────────┼──────────────────────────────────┤   │
  │  │ ① CACHE        │ Data SHARED (same cho mọi user!)│   │
  │  │ 'use cache'    │ → Cache + prerender!            │   │
  │  │ ② STREAM       │ Data PER-USER (unique!)         │   │
  │  │ <Suspense>     │ → Stream, không block!         │   │
  │  └────────────────┴──────────────────────────────────┘   │
  │                                                          │
  └──────────────────────────────────────────────────────────┘
```

```
  STEP 2b: CACHE IT! ('use cache')
  ┌──────────────────────────────────────────────────────────┐
  │                                                          │
  │  async function ProductList() {                          │
  │    'use cache'    // ← ADD THIS!                        │
  │    const products = await db.product.findMany()          │
  │    return <List items={products} />                      │
  │  }                                                       │
  │                                                          │
  │  RESULT:                                                  │
  │  ① First run: fetch data + cache output!                 │
  │  ② Subsequent: serve from cache instantly!               │
  │  ③ Inputs known → PRERENDERABLE at build time!          │
  │                                                          │
  │  next build output:                                      │
  │  ○ /products   15m   1y   ← STILL STATIC! ⚡          │
  │                                                          │
  │  ┌──────────┐      ┌──────────┐ instant ┌──────────┐    │
  │  │ Header   │      │ Product  │ ═══════►│ Response │    │
  │  │ (0ms)    │ ════►│ List     │         │ sent!    │    │
  │  │ ✅ done │      │ (CACHED!)│         │ ⚡ fast  │    │
  │  └──────────┘      │ ✅ 0ms  │         └──────────┘    │
  │                    └──────────┘                          │
  │                                                          │
  └──────────────────────────────────────────────────────────┘
```

```
  STEP 3: DYNAMIC PROMOTION BANNER (per-user!)
  ┌──────────────────────────────────────────────────────────┐
  │                                                          │
  │  async function PromotionContent() {                     │
  │    const promotion = await getPromotion()                │
  │    // → Depends on: user location, A/B test!           │
  │    // → CANNOT cache! Different per user!               │
  │    return <Promotion data={promotion} />                 │
  │  }                                                       │
  │                                                          │
  │  VẤN ĐỀ:                                                │
  │  → Data PER-USER → không cache được!                  │
  │  → Blocking: Header + ProductList chờ Promotion!       │
  │                                                          │
  │  FIX: STREAM WITH SUSPENSE!                               │
  │  export default async function Page() {                  │
  │    return (                                              │
  │      <>                                                  │
  │        <Suspense fallback={<PromotionSkeleton />}>       │
  │          <PromotionContent />                            │
  │        </Suspense>                                       │
  │        <Header />                                        │
  │        <ProductList />                                   │
  │      </>                                                 │
  │    )                                                     │
  │  }                                                       │
  │                                                          │
  │  FLOW:                                                    │
  │  ┌──────────────────────────────────────────────────┐    │
  │  │ BUILD TIME (prerender):                          │    │
  │  │ → PromotionSkeleton (fallback) ✅              │    │
  │  │ → Header ✅                                    │    │
  │  │ → ProductList (cached) ✅                      │    │
  │  │                                                  │    │
  │  │ REQUEST TIME (stream):                           │    │
  │  │ → CDN serves static shell + skeleton INSTANTLY! │    │
  │  │ → Server renders PromotionContent in parallel!  │    │
  │  │ → Stream result → swap skeleton! 🎉           │    │
  │  └──────────────────────────────────────────────────┘    │
  │                                                          │
  └──────────────────────────────────────────────────────────┘
```

---

## §4. Partial Prerendering (PPR)!

```
  PARTIAL PRERENDERING:
  ┌────────────────────────────────────────────────────────────┐
  │                                                            │
  │  next build output:                                        │
  │  ┌──────────────────────────────────────────────────────┐  │
  │  │ Route (app)     Revalidate  Expire                   │  │
  │  │ ┌ ◐ /products   15m         1y                       │  │
  │  │ └ ◐ /_not-found                                      │  │
  │  │ ◐ (Partial Prerender) Prerendered as static HTML     │  │
  │  │   with dynamic server-streamed content                │  │
  │  └──────────────────────────────────────────────────────┘  │
  │                                                            │
  │  BUILD SYMBOLS:                                            │
  │  ○ = STATIC (fully prerendered!)                           │
  │  λ = DYNAMIC (fully server-rendered per request!)          │
  │  ◐ = PARTIAL PRERENDER (static + streamed dynamic!) 🎉   │
  │                                                            │
  │  PAGE COMPOSITION:                                          │
  │  ┌────────────────────────────────────────────────────┐    │
  │  │                                                    │    │
  │  │  ┌──────────────────────────────────────────┐      │    │
  │  │  │ STATIC SHELL (prerendered + CDN!) ⚡    │      │    │
  │  │  │ ┌────────────────┐ ┌──────────────────┐ │      │    │
  │  │  │ │ Header         │ │ ProductList      │ │      │    │
  │  │  │ │ (static!)      │ │ (cached!)        │ │      │    │
  │  │  │ └────────────────┘ └──────────────────┘ │      │    │
  │  │  │ ┌──────────────────────────────────────┐│      │    │
  │  │  │ │ PromotionSkeleton (fallback!)        ││      │    │
  │  │  │ └──────────────────────────────────────┘│      │    │
  │  │  └──────────────────────────────────────────┘      │    │
  │  │                                                    │    │
  │  │  ┌──────────────────────────────────────────┐      │    │
  │  │  │ DYNAMIC STREAM (server → client!) 🔄  │      │    │
  │  │  │ ┌──────────────────────────────────────┐│      │    │
  │  │  │ │ PromotionContent (per-user data!)    ││      │    │
  │  │  │ │ → Replaces skeleton when ready!     ││      │    │
  │  │  │ └──────────────────────────────────────┘│      │    │
  │  │  └──────────────────────────────────────────┘      │    │
  │  │                                                    │    │
  │  └────────────────────────────────────────────────────┘    │
  │                                                            │
  │  TIMELINE:                                                  │
  │  ┌──────────┐      ┌──────────┐      ┌──────────┐         │
  │  │ t=0ms    │      │ t=50ms   │      │ t=800ms  │         │
  │  │ CDN      │ ═══►│ User     │ ═══►│ Stream   │         │
  │  │ serves   │      │ sees     │      │ replaces │         │
  │  │ static   │      │ Header + │      │ skeleton │         │
  │  │ shell!   │      │ Products │      │ with     │         │
  │  │          │      │ + Skel!  │      │ Promo!   │         │
  │  └──────────┘      └──────────┘      └──────────┘         │
  │  ⚡ INSTANT!       ⚡ VISIBLE!       🔄 COMPLETE!        │
  │                                                            │
  └────────────────────────────────────────────────────────────┘
```

---

## §5. Tự Viết — PublicPageEngine!

```javascript
var PublicPageEngine = (function () {
  // ═══════════════════════════════════
  // 1. COMPONENT TYPES
  // ═══════════════════════════════════
  var STATIC = "STATIC";
  var DYNAMIC = "DYNAMIC";
  var CACHE = "CACHE";

  var components = {};

  function registerComponent(name, config) {
    components[name] = {
      name: name,
      type: config.type || STATIC,
      fetchFn: config.fetchFn || null,
      renderFn: config.renderFn,
      cachedOutput: null,
      renderTime: config.renderTime || 0,
    };
  }

  // ═══════════════════════════════════
  // 2. RENDER ENGINE
  // ═══════════════════════════════════
  function renderComponent(name) {
    var comp = components[name];
    if (!comp) return { error: "Component not found!" };

    var start = Date.now();

    // Static: always instant
    if (comp.type === STATIC) {
      return {
        name: name,
        type: STATIC,
        output: comp.renderFn(),
        time: 0,
        blocking: false,
      };
    }

    // Cache: first run slow, then cached
    if (comp.type === CACHE) {
      if (comp.cachedOutput) {
        return {
          name: name,
          type: CACHE,
          output: comp.cachedOutput,
          time: 0,
          fromCache: true,
          blocking: false,
        };
      }
      // First run: fetch + cache
      var data = comp.fetchFn ? comp.fetchFn() : null;
      comp.cachedOutput = comp.renderFn(data);
      return {
        name: name,
        type: CACHE,
        output: comp.cachedOutput,
        time: comp.renderTime,
        fromCache: false,
        blocking: false,
      };
    }

    // Dynamic: always fetch, always slow
    if (comp.type === DYNAMIC) {
      var dynData = comp.fetchFn ? comp.fetchFn() : null;
      return {
        name: name,
        type: DYNAMIC,
        output: comp.renderFn(dynData),
        time: comp.renderTime,
        blocking: true,
      };
    }
  }

  // ═══════════════════════════════════
  // 3. PAGE RENDERER
  // ═══════════════════════════════════
  function renderPage(componentNames, suspenseMap) {
    suspenseMap = suspenseMap || {};
    var results = [];
    var totalBlockingTime = 0;
    var hasPartialPrerender = false;

    for (var i = 0; i < componentNames.length; i++) {
      var name = componentNames[i];

      // Wrapped in Suspense?
      if (suspenseMap[name]) {
        hasPartialPrerender = true;
        results.push({
          name: name,
          streamed: true,
          fallback: suspenseMap[name],
          actualResult: renderComponent(name),
        });
      } else {
        var result = renderComponent(name);
        if (result.blocking) {
          totalBlockingTime += result.time;
        }
        results.push(result);
      }
    }

    // Determine build symbol
    var symbol;
    if (hasPartialPrerender) symbol = "◐ (Partial Prerender)";
    else if (totalBlockingTime === 0) symbol = "○ (Static)";
    else symbol = "λ (Dynamic)";

    return {
      symbol: symbol,
      results: results,
      totalBlockingTime: totalBlockingTime,
      hasStreaming: hasPartialPrerender,
    };
  }

  // ═══════════════════════════════════
  // 4. BUILD OUTPUT SIMULATOR
  // ═══════════════════════════════════
  function simulateBuild(route, page) {
    var output = [];
    output.push("Route (app)     Revalidate  Expire");
    output.push(
      "┌ " + page.symbol.charAt(0) + " " + route + "   15m         1y",
    );
    output.push("└ " + page.symbol.charAt(0) + " /_not-found");
    output.push(
      page.symbol +
        " prerendered as " +
        (page.hasStreaming
          ? "static HTML with dynamic server-streamed content"
          : "static content"),
    );
    return output;
  }

  // ═══════════════════════════════════
  // 5. DEMO
  // ═══════════════════════════════════
  function demo() {
    console.log("╔════════════════════════════════════╗");
    console.log("║  PUBLIC PAGE ENGINE DEMO            ║");
    console.log("╚════════════════════════════════════╝");

    // Register components
    registerComponent("Header", {
      type: STATIC,
      renderFn: function () {
        return "<h1>Shop</h1>";
      },
    });
    registerComponent("ProductList", {
      type: CACHE,
      renderTime: 500,
      fetchFn: function () {
        return [
          { id: 1, name: "Widget", price: 29 },
          { id: 2, name: "Gadget", price: 49 },
        ];
      },
      renderFn: function (data) {
        return (
          "<ul>" +
          data
            .map(function (p) {
              return "<li>" + p.name + " $" + p.price + "</li>";
            })
            .join("") +
          "</ul>"
        );
      },
    });
    registerComponent("PromotionBanner", {
      type: DYNAMIC,
      renderTime: 800,
      fetchFn: function () {
        return { text: "20% off!", variant: "A" };
      },
      renderFn: function (data) {
        return "<banner>" + data.text + "</banner>";
      },
    });

    // Scenario 1: Static page (Header only)
    console.log("\n── Scenario 1: Static Page ──");
    var page1 = renderPage(["Header"]);
    console.log("  Symbol: " + page1.symbol);
    console.log("  Blocking: " + page1.totalBlockingTime + "ms");

    // Scenario 2: With cached ProductList
    console.log("\n── Scenario 2: + Cached Products ──");
    var page2 = renderPage(["Header", "ProductList"]);
    console.log("  Symbol: " + page2.symbol);
    for (var i = 0; i < page2.results.length; i++) {
      var r = page2.results[i];
      console.log(
        "  " +
          r.name +
          ": " +
          r.type +
          (r.fromCache ? " (CACHED!)" : "") +
          " " +
          r.time +
          "ms",
      );
    }

    // Second render: cached!
    console.log("\n── Scenario 2b: Second Render ──");
    var page2b = renderPage(["Header", "ProductList"]);
    for (var j = 0; j < page2b.results.length; j++) {
      var r2 = page2b.results[j];
      console.log(
        "  " +
          r2.name +
          ": " +
          (r2.fromCache ? "⚡ FROM CACHE 0ms" : r2.time + "ms"),
      );
    }

    // Scenario 3: PPR with streamed Promotion
    console.log("\n── Scenario 3: Partial Prerender ──");
    var page3 = renderPage(["PromotionBanner", "Header", "ProductList"], {
      PromotionBanner: "<PromotionSkeleton />",
    });
    console.log("  Symbol: " + page3.symbol);
    for (var k = 0; k < page3.results.length; k++) {
      var r3 = page3.results[k];
      if (r3.streamed) {
        console.log(
          "  " + r3.name + ": STREAMED! " + "(fallback: " + r3.fallback + ")",
        );
      } else {
        console.log("  " + r3.name + ": " + r3.type + " " + r3.time + "ms");
      }
    }

    // Build output
    console.log("\n── Build Output ──");
    var buildOutput = simulateBuild("/products", page3);
    for (var l = 0; l < buildOutput.length; l++) {
      console.log("  " + buildOutput[l]);
    }
  }

  return { demo: demo };
})();
// Chạy: PublicPageEngine.demo();
```

---

## §6. Câu Hỏi Luyện Tập!

**Câu 1**: 3 loại component — Static, Dynamic, Cache — so sánh?

<details><summary>Đáp án</summary>

|                  | Static                 | Dynamic                        | Cache                             |
| ---------------- | ---------------------- | ------------------------------ | --------------------------------- |
| **Ví dụ**        | `<Header />` (no data) | `<ProductList />` (fetch DB)   | `<ProductList />` + `'use cache'` |
| **Data**         | Không! Output cố định  | Có! Fetch mỗi request          | Có! Fetch 1 lần, cache output     |
| **Render khi**   | Build time             | Request time                   | First run, rồi cache              |
| **Blocking?**    | Không                  | **CÓ! ⚠️** Blocks entire route | Không (cached instant!)           |
| **Build symbol** | ○                      | λ                              | ○ (vẫn static!)                   |
| **Performance**  | ⚡ Best                | 🐌 Slowest                     | ⚡ Fast                           |

**Key insight**: `'use cache'` biến Dynamic → cacheable → page vẫn Static!

</details>

---

**Câu 2**: "Blocking data was accessed outside of Suspense" warning — nghĩa gì?

<details><summary>Đáp án</summary>

**Nghĩa**: Component `await` data (DB, API) mà KHÔNG wrap trong `<Suspense>` hoặc `'use cache'` → **BLOCKS toàn bộ route response!**

```
Page gồm: Header (0ms) + ProductList (3000ms fetch!)
→ Header DONE nhưng KHÔNG GỬI vì ProductList chưa xong
→ User chờ 3000ms mới thấy GÌ! 😱

2 cách fix:
① 'use cache' → data shared → cache output → instant!
② <Suspense> → stream → gửi skeleton trước, data sau!
```

**Rule**: Mỗi `await` trong Server Component phải hoặc cached hoặc wrapped in Suspense!

</details>

---

**Câu 3**: Khi nào Cache vs Stream? Decision rule?

<details><summary>Đáp án</summary>

|                | Cache (`'use cache'`)           | Stream (`<Suspense>`)                |
| -------------- | ------------------------------- | ------------------------------------ |
| **Data type**  | **SHARED** (same cho mọi user!) | **PER-USER** (unique, personalized!) |
| **Ví dụ**      | Product list, blog posts, docs  | Promotion banner, cart, dashboard    |
| **Mechanism**  | Cache output, reuse             | Fallback skeleton, stream later      |
| **Page stays** | Static (○)                      | Partial Prerender (◐)                |

**Decision tree**:

```
Data thay đổi giữa users?
  ├─ NO → 'use cache' (Cache Component!)
  └─ YES → <Suspense> (Stream Component!)
```

</details>

---

**Câu 4**: Build output symbols — ○ λ ◐ nghĩa gì?

<details><summary>Đáp án</summary>

| Symbol | Name              | Nghĩa                                               |
| ------ | ----------------- | --------------------------------------------------- |
| **○**  | Static            | Prerendered HOÀN TOÀN tại build time! CDN serve!    |
| **λ**  | Dynamic           | Server renders TOÀN BỘ mỗi request!                 |
| **◐**  | Partial Prerender | Static shell + dynamic streaming! **Best of both!** |

**Example build output**:

```
Route (app)     Revalidate  Expire
┌ ◐ /products   15m         1y
└ ◐ /_not-found
◐ (Partial Prerender) Prerendered as static HTML
  with dynamic server-streamed content
```

**◐ = Mục tiêu tối ưu!** Static shell (CDN instant!) + dynamic data (stream when ready!).

</details>
