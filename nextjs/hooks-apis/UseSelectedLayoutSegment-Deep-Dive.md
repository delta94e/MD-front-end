# useSelectedLayoutSegment() — Deep Dive!

> **Nguồn**: https://nextjs.org/docs/app/api-reference/functions/use-selected-layout-segment
> **Ngôn ngữ**: Tiếng Việt — giải thích cực kỳ chi tiết!
> **Trang này KHÔNG có hình/diagram** — chỉ có text + code blocks!
> **import**: `next/navigation`
> **Since**: v13.0.0!

---

## §1. useSelectedLayoutSegment() Là Gì?

```
  useSelectedLayoutSegment() — TỔNG QUAN:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  WHAT:                                                        │
  │  → Client Component hook! ★                                  │
  │  → Đọc active route segment MỘT CẤP dưới Layout! ★★★      │
  │  → import { useSelectedLayoutSegment }                       │
  │    from 'next/navigation'! ★                                │
  │  → Hữu ích cho navigation UI (tabs, active links)! ★       │
  │                                                              │
  │  CONCEPT — "ONE LEVEL BELOW":                                 │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │                                                       │    │
  │  │  app/                                                  │    │
  │  │  ├── layout.js    ← GỌI useSelectedLayoutSegment()   │    │
  │  │  ├── page.js      → segment = null! ★                 │    │
  │  │  └── dashboard/   → segment = 'dashboard'! ★          │    │
  │  │      ├── layout.js ← GỌI useSelectedLayoutSegment()  │    │
  │  │      ├── page.js   → segment = null! ★                │    │
  │  │      ├── settings/ → segment = 'settings'! ★          │    │
  │  │      └── analytics/→ segment = 'analytics'! ★         │    │
  │  │          └── monthly/ → VẪN 'analytics'! ★★★          │    │
  │  │                        (chỉ 1 level!)                  │    │
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
  │  const segment = useSelectedLayoutSegment(                   │
  │    parallelRoutesKey?: string  ← OPTIONAL! ★                │
  │  )                                                           │
  │                                                              │
  │  PARAMETERS:                                                  │
  │  → parallelRoutesKey (optional): đọc segment trong          │
  │    parallel route slot! ★                                    │
  │                                                              │
  │  RETURNS: string | null!                                     │
  │  → string = active segment name! ★                          │
  │  → null = không có segment (ở page trực tiếp)! ★           │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```

---

## §3. Return Values — Bảng Chi Tiết!

```
  BẢNG RETURN VALUES:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  ┌──────────────────────────┬───────────────┬───────────┐    │
  │  │ Layout gọi từ              │ URL             │ Segment    │    │
  │  ├──────────────────────────┼───────────────┼───────────┤    │
  │  │ app/layout.js             │ /              │ null! ★    │    │
  │  │ app/layout.js             │ /dashboard     │ 'dashboard'│    │
  │  │ app/dashboard/layout.js   │ /dashboard     │ null! ★    │    │
  │  │ app/dashboard/layout.js   │ /dashboard/    │ 'settings' │    │
  │  │                           │ settings       │            │    │
  │  │ app/dashboard/layout.js   │ /dashboard/    │ 'analytics'│    │
  │  │                           │ analytics      │            │    │
  │  │ app/dashboard/layout.js   │ /dashboard/    │ 'analytics'│    │
  │  │                           │ analytics/     │ ← VẪN! ★★★│    │
  │  │                           │ monthly        │ (1 level!) │    │
  │  └──────────────────────────┴───────────────┴───────────┘    │
  │                                                              │
  │  KEY INSIGHT:                                                 │
  │  → CHỈ 1 level dưới! ★★★                                   │
  │  → /dashboard/analytics/monthly → VẪN 'analytics'! ★★★    │
  │  → Muốn ALL segments → useSelectedLayoutSegments! ★        │
  │    (plural — có 's'!)                                        │
  │                                                              │
  │  CATCH-ALL:                                                   │
  │  → app/blog/[...slug]/page.js! ★                            │
  │  → app/blog/layout.js gọi hook! ★                          │
  │  → URL: /blog/a/b/c → segment = 'a/b/c'! ★★★             │
  │  → Tất cả joined thành 1 string!                            │
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
  │  → Layout = Server Component by default! ★                  │
  │  → Phải tạo Client Component riêng! ★                      │
  │  → Import CC vào Layout (SC)! ★                             │
  │                                                              │
  │  ② CHỈ 1 level dưới! ★★★                                    │
  │  → useSelectedLayoutSegment → 1 segment! ★                 │
  │  → useSelectedLayoutSegments → ALL segments! ★             │
  │  → Lưu ý: segment vs segments (plural)! ★                  │
  │                                                              │
  │  ③ Catch-all → joined string! ★                              │
  │  → [...slug] → 'a/b/c' (không phải array!)! ★             │
  │  → Khác với useParams (trả array)! ★                       │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```

---

## §5. Example — Active Link Component!

```
  ACTIVE LINK — USE CASE CHÍNH:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  // components/blog-nav-link.tsx (Client Component!)          │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ 'use client'                                          │    │
  │  │ import Link from 'next/link'                          │    │
  │  │ import { useSelectedLayoutSegment }                    │    │
  │  │   from 'next/navigation'                               │    │
  │  │                                                       │    │
  │  │ export default function BlogNavLink({                  │    │
  │  │   slug, children                                       │    │
  │  │ }) {                                                   │    │
  │  │   const segment = useSelectedLayoutSegment()          │    │
  │  │   const isActive = slug === segment  ← SO SÁNH! ★    │    │
  │  │                                                       │    │
  │  │   return (                                             │    │
  │  │     <Link                                              │    │
  │  │       href={`/blog/${slug}`}                           │    │
  │  │       style={{                                          │    │
  │  │         fontWeight: isActive ? 'bold' : 'normal'      │    │
  │  │       }}                                               │    │
  │  │     >                                                  │    │
  │  │       {children}                                       │    │
  │  │     </Link>                                            │    │
  │  │   )                                                    │    │
  │  │ }                                                      │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  // app/blog/layout.tsx (Server Component!)                   │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ import { BlogNavLink } from './blog-nav-link'         │    │
  │  │ import getFeaturedPosts from './get-featured-posts'    │    │
  │  │                                                       │    │
  │  │ export default async function Layout({ children }) {   │    │
  │  │   const posts = await getFeaturedPosts()              │    │
  │  │                                                       │    │
  │  │   return (                                             │    │
  │  │     <div>                                              │    │
  │  │       {posts.map(post => (                             │    │
  │  │         <BlogNavLink slug={post.slug}>                │    │
  │  │           {post.title}                                │    │
  │  │         </BlogNavLink>                                │    │
  │  │       ))}                                              │    │
  │  │       <div>{children}</div>                            │    │
  │  │     </div>                                             │    │
  │  │   )                                                    │    │
  │  │ }                                                      │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  FLOW:                                                        │
  │  URL: /blog/hello-world                                      │
  │  → segment = 'hello-world'! ★                               │
  │  → slug === segment → isActive = true → BOLD! ★            │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```

---

## §6. Tự Viết — UseSelectedLayoutSegmentEngine!

```javascript
var UseSelectedLayoutSegmentEngine = (function () {
  // ═══════════════════════════════════
  // 1. SEGMENT EXTRACTOR
  // ═══════════════════════════════════
  function useSelectedLayoutSegment(layoutPath, currentUrl) {
    // Normalize paths
    var layoutParts = layoutPath
      .replace(/\/layout\.js$/, "")
      .split("/")
      .filter(Boolean);
    var urlParts = currentUrl.split("/").filter(Boolean);

    // The segment is ONE LEVEL BELOW the layout
    var nextIndex = layoutParts.length;

    if (nextIndex >= urlParts.length) {
      return { segment: null, note: "At layout level page! null! ★" };
    }

    // Check for catch-all: join remaining segments
    var remaining = urlParts.slice(nextIndex);
    if (remaining.length > 1) {
      return {
        segment: remaining[0],
        note: "Only 1 level! Deeper segments ignored! ★★★",
        allSegments: remaining,
        useSegmentsInstead: remaining,
      };
    }

    return { segment: remaining[0], note: "Active segment! ★" };
  }

  // ═══════════════════════════════════
  // 2. useSelectedLayoutSegments (PLURAL)
  // ═══════════════════════════════════
  function useSelectedLayoutSegments(layoutPath, currentUrl) {
    var layoutParts = layoutPath
      .replace(/\/layout\.js$/, "")
      .split("/")
      .filter(Boolean);
    var urlParts = currentUrl.split("/").filter(Boolean);
    var segments = urlParts.slice(layoutParts.length);
    return {
      segments: segments,
      note: "ALL segments below layout! ★",
    };
  }

  // ═══════════════════════════════════
  // 3. CATCH-ALL SIMULATOR
  // ═══════════════════════════════════
  function catchAllSegment(layoutPath, currentUrl) {
    var layoutParts = layoutPath
      .replace(/\/layout\.js$/, "")
      .split("/")
      .filter(Boolean);
    var urlParts = currentUrl.split("/").filter(Boolean);
    var remaining = urlParts.slice(layoutParts.length);
    return {
      segment: remaining.join("/"),
      note: "Catch-all → ALL joined as single string! ★★★",
    };
  }

  // ═══════════════════════════════════
  // 4. ACTIVE LINK CHECKER
  // ═══════════════════════════════════
  function isActiveLink(layoutPath, currentUrl, linkSlug) {
    var result = useSelectedLayoutSegment(layoutPath, currentUrl);
    return {
      segment: result.segment,
      linkSlug: linkSlug,
      isActive: result.segment === linkSlug,
      style: result.segment === linkSlug ? "bold" : "normal",
    };
  }

  // ═══════════════════════════════════
  // 5. DEMO
  // ═══════════════════════════════════
  function demo() {
    console.log("═══ UseSelectedLayoutSegment Engine ═══");

    console.log("\n── 1. Segment ──");
    console.log(
      "app/layout + /:",
      useSelectedLayoutSegment("app/layout.js", "/"),
    );
    console.log(
      "app/layout + /dashboard:",
      useSelectedLayoutSegment("app/layout.js", "/dashboard"),
    );
    console.log(
      "app/dashboard/layout + /dashboard:",
      useSelectedLayoutSegment("app/dashboard/layout.js", "/dashboard"),
    );
    console.log(
      "app/dashboard/layout + /dashboard/settings:",
      useSelectedLayoutSegment(
        "app/dashboard/layout.js",
        "/dashboard/settings",
      ),
    );
    console.log(
      "app/dashboard/layout + /dashboard/analytics/monthly:",
      useSelectedLayoutSegment(
        "app/dashboard/layout.js",
        "/dashboard/analytics/monthly",
      ),
    );

    console.log("\n── 2. Segments (plural) ──");
    console.log(
      useSelectedLayoutSegments(
        "app/dashboard/layout.js",
        "/dashboard/analytics/monthly",
      ),
    );

    console.log("\n── 3. Catch-all ──");
    console.log(catchAllSegment("app/blog/layout.js", "/blog/a/b/c"));

    console.log("\n── 4. Active Link ──");
    console.log(
      isActiveLink("app/blog/layout.js", "/blog/hello-world", "hello-world"),
    );
    console.log(
      isActiveLink("app/blog/layout.js", "/blog/hello-world", "other-post"),
    );
  }

  return { demo: demo };
})();
// Chạy: UseSelectedLayoutSegmentEngine.demo();
```

---

## §7. Câu Hỏi Phỏng Vấn!

```
  CÂU HỎI:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  ❓ 1: useSelectedLayoutSegment trả gì?                        │
  │  → string | null! ★                                          │
  │  → string = active segment MỘT CẤP dưới layout! ★★★       │
  │  → null = đang ở page trực tiếp của layout! ★              │
  │                                                              │
  │  ❓ 2: "One level below" nghĩa gì?                             │
  │  → /dashboard/analytics/monthly! ★                          │
  │  → Gọi từ app/dashboard/layout → 'analytics'! ★            │
  │  → KHÔNG trả 'monthly'! Chỉ 1 cấp! ★★★                   │
  │  → Muốn all → useSelectedLayoutSegments! ★                 │
  │                                                              │
  │  ❓ 3: Catch-all khác useParams?                               │
  │  → useSelectedLayoutSegment: 'a/b/c' (joined string!)! ★   │
  │  → useParams: ['a','b','c'] (array!)! ★                    │
  │  → Khác format! ★                                           │
  │                                                              │
  │  ❓ 4: Tại sao cần tách Client Component?                      │
  │  → Hook = Client Component only! ★                          │
  │  → Layout = Server Component by default! ★                  │
  │  → Tạo CC riêng (BlogNavLink) → import vào Layout! ★      │
  │  → Layout vẫn SC → fetch data on server! ★                │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```
