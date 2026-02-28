# revalidatePath() — Deep Dive!

> **Nguồn**: https://nextjs.org/docs/app/api-reference/functions/revalidatePath
> **Ngôn ngữ**: Tiếng Việt — giải thích cực kỳ chi tiết!
> **Trang này KHÔNG có hình/diagram** — chỉ có text + code blocks!
> **import**: `next/cache`

---

## §1. revalidatePath() Là Gì?

```
  revalidatePath() — TỔNG QUAN:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  WHAT:                                                        │
  │  → Invalidate cached data cho SPECIFIC PATH! ★              │
  │  → On-demand revalidation! ★                                 │
  │  → import { revalidatePath } from 'next/cache'              │
  │                                                              │
  │  DÙNG TRONG:                                                  │
  │  → Server Functions (Server Actions) ✅                      │
  │  → Route Handlers ✅                                         │
  │  → Client Components ❌ (server only!)                      │
  │                                                              │
  │  BEHAVIOR theo context:                                       │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ Server Functions:                                     │    │
  │  │ → Update UI IMMEDIATELY! ★                            │    │
  │  │ → All prev visited pages refresh on re-nav! ★        │    │
  │  │   (temporary behavior, will be updated!) ★            │    │
  │  │                                                       │    │
  │  │ Route Handlers:                                        │    │
  │  │ → MARK path for revalidation! ★                       │    │
  │  │ → Revalidation happens on NEXT VISIT! ★              │    │
  │  │ → KHÔNG trigger ngay! ★                               │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```

---

## §2. Parameters + Invalidation Types!

```
  PARAMETERS:
  ┌──────────────────────────────────────────────────────────────┐
  │  revalidatePath(path, type?): void                            │
  │                                                              │
  │  path: string — route pattern HOẶC specific URL! ★           │
  │  type: 'page' | 'layout' — loại path (optional)! ★          │
  │                                                              │
  │  RULES:                                                       │
  │  → Specific URL (/blog/post-1): KHÔNG cần type! ★           │
  │  → Dynamic segment (/blog/[slug]): PHẢI có type! ★★★       │
  │  → path ≤ 1024 chars! Case-sensitive! ★                     │
  │  → KHÔNG thêm /page hoặc /layout vào path! ★★★             │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘

  TYPE — page vs layout:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  ┌──────────────┬────────────────────────────────────────┐   │
  │  │ Type          │ Scope                                   │   │
  │  ├──────────────┼────────────────────────────────────────┤   │
  │  │ 'page'        │ CHỈ page tại segment đó! ★             │   │
  │  │               │ /blog/[slug] ✅ nhưng KHÔNG            │   │
  │  │               │ /blog/[slug]/[author] ❌               │   │
  │  │ 'layout'      │ Layout + TẤT CẢ pages bên dưới! ★★★  │   │
  │  │               │ /blog/[slug] + /blog/[slug]/[another] │   │
  │  │ (omit)        │ Specific URL only! ★                    │   │
  │  └──────────────┴────────────────────────────────────────┘   │
  │                                                              │
  │  WHAT CAN BE INVALIDATED:                                     │
  │  → Pages: invalidate specific page! ★                        │
  │  → Layouts: layout.tsx + all nested layouts + all pages! ★  │
  │  → Route Handlers: Data Cache entries! ★                     │
  │                                                              │
  │  REVALIDATE ALL: revalidatePath('/', 'layout')! ★★★         │
  │  → Purge Client Router Cache + invalidate ALL Data Cache! ★ │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```

---

## §3. Relationship — revalidatePath vs revalidateTag vs updateTag!

```
  COMPARISON:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  ┌──────────────────┬────────────────────────────────────┐   │
  │  │ Function          │ Scope                               │   │
  │  ├──────────────────┼────────────────────────────────────┤   │
  │  │ revalidatePath    │ Specific PATH! ★                    │   │
  │  │ revalidateTag     │ Specific TAG (across ALL pages)! ★ │   │
  │  │ updateTag         │ Expire TAG immediately! ★           │   │
  │  └──────────────────┴────────────────────────────────────┘   │
  │                                                              │
  │  VÍ DỤ:                                                      │
  │  Page A (/blog): fetch('...', { next: { tags: ['posts'] } })  │
  │  Page B (/dashboard): fetch('...', { next: { tags: ['posts']}} │
  │                                                              │
  │  revalidatePath('/blog'):                                     │
  │  → Page A: fresh data! ★                                    │
  │  → Page B: STILL STALE! ★★★ (tag not invalidated!)         │
  │                                                              │
  │  BEST PRACTICE: dùng CẢ HAI cùng lúc!                        │
  │  revalidatePath('/blog')   ← refresh page! ★                │
  │  updateTag('posts')        ← refresh all tag users! ★       │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```

---

## §4. Examples — 5 Patterns!

```
  5 PATTERNS:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  ① Specific URL:                                              │
  │  revalidatePath('/blog/post-1')                              │
  │                                                              │
  │  ② Page path (dynamic):                                       │
  │  revalidatePath('/blog/[slug]', 'page')                      │
  │  revalidatePath('/(main)/blog/[slug]', 'page')  ← route grp │
  │                                                              │
  │  ③ Layout path:                                               │
  │  revalidatePath('/blog/[slug]', 'layout')                    │
  │  → Invalidates layout + ALL nested pages! ★                 │
  │                                                              │
  │  ④ ALL data:                                                   │
  │  revalidatePath('/', 'layout')  ← NUCLEAR OPTION! ★★★      │
  │                                                              │
  │  ⑤ Route Handler (on-demand):                                 │
  │  export async function GET(request) {                         │
  │    const path = request.nextUrl.searchParams.get('path')     │
  │    revalidatePath(path)                                      │
  │    return Response.json({ revalidated: true })               │
  │  }                                                           │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```

---

## §5. Tự Viết — RevalidatePathEngine!

```javascript
var RevalidatePathEngine = (function () {
  function revalidatePath(path, type) {
    var isDynamic = path.indexOf("[") >= 0;
    if (isDynamic && !type) {
      return {
        error: "Dynamic segment PHẢI có type ('page' | 'layout')! ★★★",
        valid: false,
      };
    }
    if (path.length > 1024) {
      return { error: "Path > 1024 chars! ★", valid: false };
    }

    var scope;
    if (!type) {
      scope = "specific URL only: " + path;
    } else if (type === "page") {
      scope = "page at " + path + " (NOT nested!)";
    } else if (type === "layout") {
      scope = "layout at " + path + " + ALL nested pages!";
    }

    return {
      path: path,
      type: type || "url",
      scope: scope,
      invalidates:
        type === "layout"
          ? ["layout.tsx", "nested layouts", "all pages below"]
          : type === "page"
            ? ["page only"]
            : ["specific URL"],
      valid: true,
    };
  }

  function revalidateAll() {
    return revalidatePath("/", "layout");
  }

  function advise(scenario) {
    var map = {
      "single-post-update": {
        call: "revalidatePath('/blog/post-1')",
        note: "Specific URL! ★",
      },
      "all-blog-posts": {
        call: "revalidatePath('/blog/[slug]', 'page')",
        note: "All blog pages! ★",
      },
      "entire-blog-section": {
        call: "revalidatePath('/blog/[slug]', 'layout')",
        note: "Layout + all nested! ★",
      },
      nuclear: {
        call: "revalidatePath('/', 'layout')",
        note: "EVERYTHING! ★★★",
      },
    };
    return (
      map[scenario] || { call: "revalidatePath(path)", note: "Check scope! ★" }
    );
  }

  function demo() {
    console.log("═══ RevalidatePath Engine ═══");
    console.log(revalidatePath("/blog/post-1"));
    console.log(revalidatePath("/blog/[slug]", "page"));
    console.log(revalidatePath("/blog/[slug]", "layout"));
    console.log(revalidatePath("/blog/[slug]")); // error!
    console.log("\n── All ──");
    console.log(revalidateAll());
    console.log("\n── Advise ──");
    console.log(advise("single-post-update"));
    console.log(advise("nuclear"));
  }

  return { demo: demo };
})();
// Chạy: RevalidatePathEngine.demo();
```

---

## §6. Câu Hỏi Phỏng Vấn!

```
  CÂU HỎI:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  ❓ 1: revalidatePath('page') vs ('layout') — khác gì?        │
  │  → 'page': CHỈ page tại segment! ★                          │
  │  → 'layout': layout + ALL nested layouts + ALL pages! ★★★  │
  │  → Dynamic segment PHẢI có type! ★                          │
  │                                                              │
  │  ❓ 2: revalidatePath vs revalidateTag?                         │
  │  → Path: invalidate specific page/layout! ★                 │
  │  → Tag: invalidate across ALL pages with that tag! ★        │
  │  → Dùng cả 2 để comprehensive consistency! ★               │
  │                                                              │
  │  ❓ 3: Server Function vs Route Handler behavior?               │
  │  → Server Function: UI update IMMEDIATELY! ★                 │
  │  → Route Handler: mark for revalidation, NEXT VISIT! ★     │
  │                                                              │
  │  ❓ 4: Revalidate TOÀN BỘ app?                                  │
  │  → revalidatePath('/', 'layout')! ★★★                       │
  │  → Purge Client Router Cache! ★                              │
  │  → Invalidate ALL Data Cache! ★                              │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```
