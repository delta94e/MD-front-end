# generateStaticParams() — Deep Dive!

> **Nguồn**: https://nextjs.org/docs/app/api-reference/functions/generate-static-params
> **Ngôn ngữ**: Tiếng Việt — giải thích cực kỳ chi tiết!
> **Trang này KHÔNG có hình/diagram** — chỉ có text + code blocks!
> **Since**: v13.0.0! (Thay thế getStaticPaths!)

---

## §1. generateStaticParams() Là Gì?

```
  generateStaticParams() — TỔNG QUAN:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  WHAT:                                                        │
  │  → Static Generation cho DYNAMIC routes! ★                   │
  │  → Build time: pre-render tất cả paths! ★                   │
  │  → Thay thế getStaticPaths (Pages Router)! ★                │
  │                                                              │
  │  FLOW:                                                        │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │                                                       │    │
  │  │  next build                                           │    │
  │  │    │                                                  │    │
  │  │    ▼                                                  │    │
  │  │  generateStaticParams() → [{ slug: 'a' }, ...]       │    │
  │  │    │                                                  │    │
  │  │    ▼                                                  │    │
  │  │  Pre-render EACH param:                                │    │
  │  │  /blog/a → static HTML! ★                              │    │
  │  │  /blog/b → static HTML! ★                              │    │
  │  │  /blog/c → static HTML! ★                              │    │
  │  │    │                                                  │    │
  │  │    ▼                                                  │    │
  │  │  User request → serve pre-rendered HTML! (fast!) ★    │    │
  │  │                                                       │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  DÙNG VỚI:                                                    │
  │  → Pages (page.tsx) ✅                                       │
  │  → Layouts (layout.tsx) ✅                                   │
  │  → Route Handlers (route.ts) ✅                              │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```

---

## §2. Parameters + Returns + 3 Segment Types!

```
  PARAMETERS:
  ┌──────────────────────────────────────────────────────────────┐
  │  options.params (optional):                                  │
  │  → Parent segment đã generate trước đó! ★                   │
  │  → Child dùng parent params để generate child params! ★     │
  │  → Truyền synchronously, KHÔNG phải Promise! ★              │
  └──────────────────────────────────────────────────────────────┘

  RETURNS — 3 SEGMENT TYPES:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  ① SINGLE [id]:                                               │
  │  return [{ id: '1' }, { id: '2' }, { id: '3' }]             │
  │  → /product/1, /product/2, /product/3! ★                    │
  │                                                              │
  │  ② MULTIPLE [category]/[product]:                             │
  │  return [                                                    │
  │    { category: 'a', product: '1' },                          │
  │    { category: 'b', product: '2' },                          │
  │  ]                                                           │
  │  → /products/a/1, /products/b/2! ★                          │
  │                                                              │
  │  ③ CATCH-ALL [...slug]:                                       │
  │  return [                                                    │
  │    { slug: ['a', '1'] },                                     │
  │    { slug: ['b', '2'] },                                     │
  │  ]                                                           │
  │  → /product/a/1, /product/b/2! ★                            │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```

---

## §3. Examples — 4 Strategies!

```
  4 STRATEGIES:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  ① ALL paths at BUILD time:                                   │
  │  return posts.map(p => ({ slug: p.slug }))                   │
  │  → 100% static! Nhanh nhất! ★                               │
  │                                                              │
  │  ② SUBSET at build, rest at RUNTIME:                          │
  │  return posts.slice(0, 10).map(...)                          │
  │  → Top 10 static, còn lại SSR on-demand! ★                  │
  │  → dynamicParams = false → 404 cho unspecified! ★           │
  │                                                              │
  │  ③ ALL at RUNTIME (ISR):                                      │
  │  return []  // empty array!                                  │
  │  → HOẶC: export const dynamic = 'force-static'              │
  │  → Static render khi first visit! ★                          │
  │  → PHẢI return array (kể cả empty!) ★★★                     │
  │                                                              │
  │  ④ DISABLE unspecified paths:                                  │
  │  export const dynamicParams = false                          │
  │  → Chỉ serve paths từ generateStaticParams! ★               │
  │  → Unspecified → 404! ★                                      │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘

  MULTIPLE DYNAMIC SEGMENTS — 2 approaches:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  app/products/[category]/[product]/page.tsx                  │
  │                                                              │
  │  ① BOTTOM-UP (page.tsx generates ALL):                        │
  │  return products.map(p => ({                                 │
  │    category: p.category.slug, product: p.id                  │
  │  }))                                                         │
  │                                                              │
  │  ② TOP-DOWN (layout + page cascade):                          │
  │  Layout: return [{ category: 'a' }, { category: 'b' }]      │
  │  Page: function({ params: { category } }) {                  │
  │    return products.filter(c => c === category)               │
  │      .map(p => ({ product: p.id }))                          │
  │  }                                                           │
  │  → Child chạy 1 lần cho MỖI parent param! ★                 │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘

  "GOOD TO KNOW":
  ┌──────────────────────────────────────────────────────────────┐
  │  → next dev: gọi khi navigate! ★                             │
  │  → next build: gọi TRƯỚC generate Layouts/Pages! ★          │
  │  → ISR revalidation: KHÔNG gọi lại! ★                       │
  │  → Route Handlers: cũng support generateStaticParams! ★     │
  │  → Cache Components: PHẢI return ≥ 1 param! ★               │
  │  → Empty array + Cache Components = build error! ★★★        │
  └──────────────────────────────────────────────────────────────┘
```

---

## §4. Tự Viết — GenerateStaticParamsEngine!

```javascript
var GenerateStaticParamsEngine = (function () {
  // ═══════════════════════════════════
  // 1. STATIC PARAMS GENERATOR
  // ═══════════════════════════════════
  function generateForSegment(segmentType, data) {
    if (segmentType === "single") {
      // [id]
      return data.map(function (item) {
        return { id: String(item.id) };
      });
    }
    if (segmentType === "multiple") {
      // [category]/[product]
      return data.map(function (item) {
        return { category: item.category, product: String(item.id) };
      });
    }
    if (segmentType === "catchAll") {
      // [...slug]
      return data.map(function (item) {
        return { slug: item.slug.split("/") };
      });
    }
    return [];
  }

  // ═══════════════════════════════════
  // 2. TOP-DOWN CASCADE SIMULATOR
  // ═══════════════════════════════════
  function cascadeParams(parentParams, childGenerator) {
    var results = [];
    for (var i = 0; i < parentParams.length; i++) {
      var childParams = childGenerator(parentParams[i]);
      for (var j = 0; j < childParams.length; j++) {
        var merged = {};
        for (var k in parentParams[i]) merged[k] = parentParams[i][k];
        for (var k in childParams[j]) merged[k] = childParams[j][k];
        results.push(merged);
      }
    }
    return results;
  }

  // ═══════════════════════════════════
  // 3. PATH BUILDER
  // ═══════════════════════════════════
  function buildPaths(basePath, params) {
    return params.map(function (p) {
      var path = basePath;
      for (var key in p) {
        if (Array.isArray(p[key])) {
          path = path.replace("[..." + key + "]", p[key].join("/"));
        } else {
          path = path.replace("[" + key + "]", p[key]);
        }
      }
      return path;
    });
  }

  // ═══════════════════════════════════
  // 4. STRATEGY ADVISOR
  // ═══════════════════════════════════
  function adviseStrategy(totalPaths, updateFrequency) {
    if (totalPaths <= 100 && updateFrequency === "rare") {
      return { strategy: "ALL at build", dynamicParams: true };
    }
    if (totalPaths <= 1000) {
      return { strategy: "Subset at build (top N)", dynamicParams: true };
    }
    if (totalPaths > 1000) {
      return {
        strategy: "ALL at runtime (empty array)",
        dynamicParams: true,
        note: "ISR sẽ cache sau first visit! ★",
      };
    }
    return { strategy: "Default" };
  }

  // ═══════════════════════════════════
  // 5. DEMO
  // ═══════════════════════════════════
  function demo() {
    console.log("═══ GenerateStaticParams Engine ═══");

    console.log("\n── Single ──");
    console.log(
      generateForSegment("single", [{ id: 1 }, { id: 2 }, { id: 3 }]),
    );

    console.log("\n── Multiple ──");
    console.log(
      generateForSegment("multiple", [
        { id: 1, category: "a" },
        { id: 2, category: "b" },
      ]),
    );

    console.log("\n── Catch-all ──");
    console.log(
      generateForSegment("catchAll", [{ slug: "a/1" }, { slug: "b/2" }]),
    );

    console.log("\n── Cascade (top-down) ──");
    var parents = [{ category: "shoes" }, { category: "hats" }];
    console.log(
      cascadeParams(parents, function (parent) {
        if (parent.category === "shoes")
          return [{ product: "nike" }, { product: "adidas" }];
        return [{ product: "cap" }];
      }),
    );

    console.log("\n── Paths ──");
    console.log(
      buildPaths("/products/[category]/[product]", [
        { category: "shoes", product: "nike" },
        { category: "hats", product: "cap" },
      ]),
    );

    console.log("\n── Strategy ──");
    console.log(adviseStrategy(50, "rare"));
    console.log(adviseStrategy(500, "daily"));
    console.log(adviseStrategy(100000, "hourly"));
  }

  return { demo: demo };
})();
// Chạy: GenerateStaticParamsEngine.demo();
```

---

## §5. Câu Hỏi Phỏng Vấn!

```
  CÂU HỎI:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  ❓ 1: generateStaticParams() thay thế gì?                     │
  │  → getStaticPaths (Pages Router)! ★                          │
  │  → Static Generation cho dynamic routes! ★                   │
  │  → Build time pre-render! ★                                  │
  │                                                              │
  │  ❓ 2: 3 strategies cho static params?                          │
  │  → All at build: full list → 100% static! ★                  │
  │  → Subset: top N build, rest runtime! ★                      │
  │  → Empty []: all runtime + ISR! ★                            │
  │  → dynamicParams = false → 404 unspecified! ★               │
  │                                                              │
  │  ❓ 3: Multiple dynamic segments — 2 approaches?               │
  │  → Bottom-up: page.tsx generate ALL params! ★                │
  │  → Top-down: layout → page cascade! ★                       │
  │  → Child chạy 1 lần cho MỖI parent param! ★★★               │
  │                                                              │
  │  ❓ 4: Khi nào generateStaticParams được gọi?                   │
  │  → next dev: khi navigate! ★                                 │
  │  → next build: TRƯỚC generate Layouts/Pages! ★              │
  │  → ISR: KHÔNG gọi lại (dùng cached params)! ★              │
  │                                                              │
  │  ❓ 5: Cache Components + empty array → sao?                    │
  │  → BUILD ERROR! ★★★                                          │
  │  → Cache Components cần ≥ 1 param để validate! ★            │
  │  → Fix: placeholder param + notFound()! ★                   │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```
