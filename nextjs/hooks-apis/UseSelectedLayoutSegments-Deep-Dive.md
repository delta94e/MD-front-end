# useSelectedLayoutSegments() — Deep Dive!

> **Nguồn**: https://nextjs.org/docs/app/api-reference/functions/use-selected-layout-segments
> **Ngôn ngữ**: Tiếng Việt — giải thích cực kỳ chi tiết!
> **Trang này KHÔNG có hình/diagram** — chỉ có text + code blocks!
> **import**: `next/navigation`
> **Since**: v13.0.0!

---

## §1. useSelectedLayoutSegments() Là Gì?

```
  useSelectedLayoutSegments() — TỔNG QUAN:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  WHAT:                                                        │
  │  → Client Component hook! ★                                  │
  │  → Đọc TẤT CẢ active route segments BÊN DƯỚI Layout! ★★★  │
  │  → import { useSelectedLayoutSegments }                      │
  │    from 'next/navigation'! ★                                │
  │  → Trả ARRAY! (khác segment — trả string/null)! ★★★       │
  │  → Hữu ích cho BREADCRUMBS! ★                              │
  │                                                              │
  │  SO SÁNH — Segment vs Segments:                               │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │                                                       │    │
  │  │  useSelectedLayoutSegment()   → string | null! ★      │    │
  │  │  → CHỈ 1 level dưới! ★                                │    │
  │  │  → Active TABS, navigation UI! ★                      │    │
  │  │                                                       │    │
  │  │  useSelectedLayoutSegments()  → string[]! ★★★          │    │
  │  │  → TẤT CẢ levels dưới! ★★★                          │    │
  │  │  → BREADCRUMBS, deep navigation! ★                    │    │
  │  │                                                       │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```

---

## §2. Parameters + Returns!

```
  SIGNATURE:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  const segments = useSelectedLayoutSegments(                 │
  │    parallelRoutesKey?: string  ← OPTIONAL! ★                │
  │  )                                                           │
  │                                                              │
  │  PARAMETERS:                                                  │
  │  → parallelRoutesKey (optional): đọc segments trong         │
  │    parallel route slot! ★                                    │
  │                                                              │
  │  RETURNS: string[] — ARRAY of segments! ★★★                │
  │  → Tất cả active segments dưới layout! ★                   │
  │  → [] empty array nếu ở page trực tiếp! ★                 │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```

---

## §3. Return Values — Bảng Chi Tiết!

```
  BẢNG RETURN VALUES:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  REGULAR ROUTES:                                              │
  │  ┌──────────────────────────┬───────────────┬────────────┐   │
  │  │ Layout gọi từ              │ URL             │ Segments    │   │
  │  ├──────────────────────────┼───────────────┼────────────┤   │
  │  │ app/layout.js             │ /              │ []! ★       │   │
  │  │ app/layout.js             │ /dashboard     │ ['dashboard']   │
  │  │ app/layout.js             │ /dashboard/    │ ['dashboard',   │
  │  │                           │ settings       │  'settings']★   │
  │  │ app/dashboard/layout.js   │ /dashboard     │ []! ★       │   │
  │  │ app/dashboard/layout.js   │ /dashboard/    │ ['settings']│   │
  │  │                           │ settings       │ ★            │   │
  │  └──────────────────────────┴───────────────┴────────────┘   │
  │                                                              │
  │  CATCH-ALL ROUTES:                                            │
  │  ┌──────────────────────────┬───────────────┬────────────┐   │
  │  │ Layout gọi từ              │ URL             │ Segments    │   │
  │  ├──────────────────────────┼───────────────┼────────────┤   │
  │  │ app/layout.js             │ /blog/a/b/c   │ ['blog',    │   │
  │  │ (catch-all [...slug])     │               │  'a/b/c']   │   │
  │  │                           │               │ ★★★          │   │
  │  │ app/blog/layout.js        │ /blog/a/b/c   │ ['a/b/c']   │   │
  │  │                           │               │ ★★★          │   │
  │  └──────────────────────────┴───────────────┴────────────┘   │
  │                                                              │
  │  ⚠️ CATCH-ALL:                                                │
  │  → KHÔNG trả ['blog','a','b','c']! ★★★                     │
  │  → MÀ trả ['blog','a/b/c']! ★★★                           │
  │  → Catch-all segment joined thành 1 string! ★★★            │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```

---

## §4. Good to Know!

```
  RULES:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  ① Client Component hook! ★                                  │
  │  → Layout = SC by default → tạo CC riêng! ★                │
  │  → Import CC vào Layout (SC)! ★                             │
  │                                                              │
  │  ② Route Groups SẼ BỊ INCLUDED! ★★★                         │
  │  → segments có thể chứa (group-name)! ★                    │
  │  → FILTER BỎ: segments.filter(s =>                           │
  │    !s.startsWith('('))! ★★★                                 │
  │  → Route Groups NÊN bị loại khỏi UI! ★                    │
  │                                                              │
  │  ③ Catch-all → joined string TRONG ARRAY! ★★★               │
  │  → ['blog', 'a/b/c'] — KHÔNG ['blog','a','b','c']! ★★★   │
  │  → Phần catch-all join thành 1 string! ★                   │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```

---

## §5. Example — Breadcrumbs!

```
  BREADCRUMBS — USE CASE CHÍNH:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  // components/breadcrumbs.tsx                                │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ 'use client'                                          │    │
  │  │ import { useSelectedLayoutSegments }                   │    │
  │  │   from 'next/navigation'                               │    │
  │  │                                                       │    │
  │  │ export default function Breadcrumbs() {                │    │
  │  │   const segments = useSelectedLayoutSegments()        │    │
  │  │                                                       │    │
  │  │   // Filter Route Groups! ★                           │    │
  │  │   const filtered = segments.filter(                    │    │
  │  │     s => !s.startsWith('(')  ← filter groups! ★      │    │
  │  │   )                                                    │    │
  │  │                                                       │    │
  │  │   return (                                             │    │
  │  │     <nav>                                              │    │
  │  │       <ol>                                             │    │
  │  │         <li><a href="/">Home</a></li>                  │    │
  │  │         {filtered.map((seg, i) => {                    │    │
  │  │           const href = '/' +                           │    │
  │  │             filtered.slice(0, i+1).join('/')          │    │
  │  │           return (                                     │    │
  │  │             <li key={i}>                               │    │
  │  │               <a href={href}>{seg}</a>                 │    │
  │  │             </li>                                      │    │
  │  │           )                                            │    │
  │  │         })}                                            │    │
  │  │       </ol>                                            │    │
  │  │     </nav>                                             │    │
  │  │   )                                                    │    │
  │  │ }                                                      │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  URL: /dashboard/settings/profile                            │
  │  → segments = ['dashboard','settings','profile']! ★         │
  │  → Breadcrumbs: Home > dashboard > settings > profile! ★   │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```

---

## §6. Tự Viết — UseSelectedLayoutSegmentsEngine!

```javascript
var UseSelectedLayoutSegmentsEngine = (function () {
  // ═══════════════════════════════════
  // 1. SEGMENTS EXTRACTOR
  // ═══════════════════════════════════
  function useSelectedLayoutSegments(layoutPath, currentUrl) {
    var layoutParts = layoutPath
      .replace(/\/layout\.js$/, "")
      .split("/")
      .filter(Boolean);
    var urlParts = currentUrl.split("/").filter(Boolean);

    // Segments = ALL parts BELOW layout level
    var segments = urlParts.slice(layoutParts.length);

    if (segments.length === 0) {
      return { segments: [], note: "At layout level! Empty array! ★" };
    }

    return { segments: segments, note: "All active segments below layout! ★" };
  }

  // ═══════════════════════════════════
  // 2. CATCH-ALL SIMULATOR
  // ═══════════════════════════════════
  function withCatchAll(layoutPath, currentUrl, catchAllStart) {
    var layoutParts = layoutPath
      .replace(/\/layout\.js$/, "")
      .split("/")
      .filter(Boolean);
    var urlParts = currentUrl.split("/").filter(Boolean);
    var below = urlParts.slice(layoutParts.length);

    // Find where catch-all starts
    var catchIndex = -1;
    for (var i = 0; i < below.length; i++) {
      if (below[i] === catchAllStart || i >= 1) {
        if (catchIndex === -1) catchIndex = i;
      }
    }

    if (catchIndex > 0) {
      // Join catch-all segments into single string
      var before = below.slice(0, catchIndex);
      var catchAll = below.slice(catchIndex).join("/");
      return {
        segments: before.concat([catchAll]),
        note: "Catch-all joined as single string! ★★★",
      };
    }

    return { segments: below };
  }

  // ═══════════════════════════════════
  // 3. ROUTE GROUP FILTER
  // ═══════════════════════════════════
  function filterRouteGroups(segments) {
    var filtered = segments.filter(function (s) {
      return s.charAt(0) !== "(";
    });
    var removed = segments.filter(function (s) {
      return s.charAt(0) === "(";
    });
    return {
      original: segments,
      filtered: filtered,
      removed: removed,
      note: "Route Groups filtered out! ★",
    };
  }

  // ═══════════════════════════════════
  // 4. BREADCRUMB BUILDER
  // ═══════════════════════════════════
  function buildBreadcrumbs(segments) {
    var crumbs = [{ label: "Home", href: "/" }];
    var filtered = segments.filter(function (s) {
      return s.charAt(0) !== "(";
    });
    for (var i = 0; i < filtered.length; i++) {
      crumbs.push({
        label: filtered[i],
        href: "/" + filtered.slice(0, i + 1).join("/"),
      });
    }
    return crumbs;
  }

  // ═══════════════════════════════════
  // 5. COMPARISON: Segment vs Segments
  // ═══════════════════════════════════
  function compare(layoutPath, currentUrl) {
    var segments = useSelectedLayoutSegments(layoutPath, currentUrl).segments;
    var segment = segments.length > 0 ? segments[0] : null;
    return {
      "useSelectedLayoutSegment()": segment,
      "useSelectedLayoutSegments()": segments,
      note: "segment = first item only! segments = ALL! ★★★",
    };
  }

  // ═══════════════════════════════════
  // 6. DEMO
  // ═══════════════════════════════════
  function demo() {
    console.log("═══ UseSelectedLayoutSegments Engine ═══");

    console.log("\n── 1. Segments ──");
    console.log(
      "app/layout + /:",
      useSelectedLayoutSegments("app/layout.js", "/"),
    );
    console.log(
      "app/layout + /dashboard:",
      useSelectedLayoutSegments("app/layout.js", "/dashboard"),
    );
    console.log(
      "app/layout + /dashboard/settings:",
      useSelectedLayoutSegments("app/layout.js", "/dashboard/settings"),
    );
    console.log(
      "app/dashboard/layout + /dashboard:",
      useSelectedLayoutSegments("app/dashboard/layout.js", "/dashboard"),
    );
    console.log(
      "app/dashboard/layout + /dashboard/settings:",
      useSelectedLayoutSegments(
        "app/dashboard/layout.js",
        "/dashboard/settings",
      ),
    );

    console.log("\n── 2. Route Groups ──");
    console.log(filterRouteGroups(["(marketing)", "blog", "post-1"]));

    console.log("\n── 3. Breadcrumbs ──");
    console.log(buildBreadcrumbs(["dashboard", "settings", "profile"]));

    console.log("\n── 4. Compare ──");
    console.log(compare("app/layout.js", "/dashboard/settings/profile"));
  }

  return { demo: demo };
})();
// Chạy: UseSelectedLayoutSegmentsEngine.demo();
```

---

## §7. Câu Hỏi Phỏng Vấn!

```
  CÂU HỎI:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  ❓ 1: useSelectedLayoutSegment vs Segments?                   │
  │  → Segment: string | null — CHỈ 1 level! ★                 │
  │  → Segments: string[] — TẤT CẢ levels! ★★★                │
  │  → Segment → tabs! Segments → breadcrumbs! ★               │
  │                                                              │
  │  ❓ 2: Catch-all trả gì?                                       │
  │  → /blog/a/b/c → ['blog','a/b/c']! ★★★                    │
  │  → KHÔNG phải ['blog','a','b','c']! ★★★                   │
  │  → Catch-all joined thành 1 string! ★                      │
  │                                                              │
  │  ❓ 3: Route Groups bị included?                               │
  │  → ĐÚNG! (group-name) xuất hiện trong array! ★★★           │
  │  → Filter: segments.filter(s => !s.startsWith('('))! ★     │
  │                                                              │
  │  ❓ 4: Tại sao tách Client Component?                          │
  │  → Hook = Client Component only! ★                          │
  │  → Layout = Server Component by default! ★                  │
  │  → Tạo Breadcrumbs CC → import vào Layout SC! ★           │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```
