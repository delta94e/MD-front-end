# permanentRedirect() — Deep Dive!

> **Nguồn**: https://nextjs.org/docs/app/api-reference/functions/permanentRedirect
> **Ngôn ngữ**: Tiếng Việt — giải thích cực kỳ chi tiết!
> **Trang này KHÔNG có hình/diagram** — chỉ có text + code blocks!
> **import**: `next/navigation`

---

## §1. permanentRedirect() Là Gì?

```
  permanentRedirect() — TỔNG QUAN:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  WHAT:                                                        │
  │  → Redirect VĨNH VIỄN user tới URL mới! ★                   │
  │  → HTTP 308 (Permanent Redirect)! ★                          │
  │  → Server Action → HTTP 303! ★                               │
  │  → Streaming context → meta tag redirect! ★                 │
  │                                                              │
  │  DÙNG TRONG:                                                  │
  │  → Server Components ✅                                      │
  │  → Client Components ✅                                      │
  │  → Route Handlers ✅                                         │
  │  → Server Functions (Server Actions) ✅                      │
  │                                                              │
  │  FLOW:                                                        │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │                                                       │    │
  │  │  permanentRedirect('/new-url')                        │    │
  │  │    │                                                  │    │
  │  │    ▼                                                  │    │
  │  │  Throw NEXT_REDIRECT error! ★                         │    │
  │  │    │                                                  │    │
  │  │    ▼                                                  │    │
  │  │  CONTEXT?                                              │    │
  │  │  ├── Server Action → 303 redirect! ★                  │    │
  │  │  ├── Streaming    → <meta> tag redirect! ★            │    │
  │  │  └── Otherwise    → 308 redirect! ★                   │    │
  │  │    │                                                  │    │
  │  │    ▼                                                  │    │
  │  │  Terminate rendering! ★                               │    │
  │  │                                                       │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```

---

## §2. Parameters + Returns!

```
  PARAMETERS:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  permanentRedirect(path, type?)                               │
  │                                                              │
  │  ┌───────────┬──────────┬────────────────────────────────┐   │
  │  │ Param      │ Type     │ Mô tả                          │   │
  │  ├───────────┼──────────┼────────────────────────────────┤   │
  │  │ path       │ string   │ URL đích! ★                     │   │
  │  │ type       │ 'replace'│ Cách thêm vào browser history! │   │
  │  │            │ | 'push' │ ★                               │   │
  │  └───────────┴──────────┴────────────────────────────────┘   │
  │                                                              │
  │  type BEHAVIOR:                                               │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ Context        │ Default │ Effect                     │    │
  │  ├──────────────────────────────────────────────────────┤    │
  │  │ Server Actions │ 'push'  │ New entry in history! ★    │    │
  │  │ Everywhere else│ 'replace'│ Replace current URL! ★    │    │
  │  │ Server Comp.   │ —       │ type IGNORED! ★★★          │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  RedirectType enum:                                           │
  │  import { permanentRedirect, RedirectType } from 'next/nav'  │
  │  permanentRedirect('/url', RedirectType.replace)             │
  │  permanentRedirect('/url', RedirectType.push)                │
  │                                                              │
  │  RETURNS: không return gì! (never type!) ★                   │
  │  → KHÔNG cần: return permanentRedirect()! ★                 │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```

---

## §3. permanentRedirect vs redirect — So Sánh!

```
  COMPARISON:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  ┌──────────────────┬─────────────────┬───────────────────┐  │
  │  │                   │ permanentRedirect│ redirect          │  │
  │  ├──────────────────┼─────────────────┼───────────────────┤  │
  │  │ HTTP Status       │ 308 (Permanent) │ 307 (Temporary) ★│  │
  │  │ Server Action     │ 303             │ 303               │  │
  │  │ SEO impact         │ VĨNH VIỄN! ★★★ │ Tạm thời! ★     │  │
  │  │ Browser cache      │ YES! Cached! ★  │ NO! Not cached!  │  │
  │  │ Search engine      │ Update index! ★ │ Keep old index!  │  │
  │  │ Method preserved   │ YES! ★          │ YES! ★           │  │
  │  │ TypeScript type    │ never           │ never             │  │
  │  │ Throws             │ NEXT_REDIRECT   │ NEXT_REDIRECT     │  │
  │  └──────────────────┴─────────────────┴───────────────────┘  │
  │                                                              │
  │  KHI NÀO DÙNG:                                                │
  │  → URL đổi VĨNH VIỄN (rebrand, restructure) → 308! ★       │
  │  → URL đổi TẠM THỜI (maintenance, A/B test) → 307! ★       │
  │  → Resource không tồn tại → notFound()! ★                   │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```

---

## §4. Tự Viết — PermanentRedirectEngine!

```javascript
var PermanentRedirectEngine = (function () {
  // ═══════════════════════════════════
  // 1. REDIRECT SIMULATOR
  // ═══════════════════════════════════
  function permanentRedirect(path, type, context) {
    context = context || "server-component";
    var status;
    if (context === "server-action") status = 303;
    else status = 308;

    var historyAction;
    if (type) {
      historyAction = type;
    } else {
      historyAction = context === "server-action" ? "push" : "replace";
    }

    return {
      error: "NEXT_REDIRECT",
      path: path,
      status: status,
      permanent: true,
      historyAction: historyAction,
      typeIgnored: context === "server-component",
      headers: { Location: path },
    };
  }

  // ═══════════════════════════════════
  // 2. REDIRECT vs PERMANENT REDIRECT
  // ═══════════════════════════════════
  function compare() {
    return {
      redirect: {
        status: 307,
        permanent: false,
        seo: "Tạm thời, search engine giữ old URL! ★",
        browserCache: false,
      },
      permanentRedirect: {
        status: 308,
        permanent: true,
        seo: "VĨNH VIỄN, search engine update! ★★★",
        browserCache: true,
      },
    };
  }

  // ═══════════════════════════════════
  // 3. USE CASE ADVISOR
  // ═══════════════════════════════════
  function advise(scenario) {
    var map = {
      rebrand: { fn: "permanentRedirect", reason: "URL đổi vĩnh viễn! 308! ★" },
      restructure: {
        fn: "permanentRedirect",
        reason: "Route structure thay đổi! 308! ★",
      },
      maintenance: { fn: "redirect", reason: "Tạm thời! 307! ★" },
      "ab-test": { fn: "redirect", reason: "Temporary redirect! 307! ★" },
      "not-found": { fn: "notFound", reason: "Resource không tồn tại! 404! ★" },
      auth: { fn: "redirect", reason: "Login redirect! Tạm thời! 307! ★" },
    };
    return map[scenario] || { fn: "redirect", reason: "Default: temporary! ★" };
  }

  // ═══════════════════════════════════
  // 4. DEMO
  // ═══════════════════════════════════
  function demo() {
    console.log("═══ PermanentRedirect Engine ═══");

    console.log("\n── Redirect ──");
    console.log(permanentRedirect("/new-page", null, "server-component"));
    console.log(permanentRedirect("/new-page", "push", "server-action"));

    console.log("\n── Compare ──");
    console.log(compare());

    console.log("\n── Advise ──");
    console.log("rebrand:", advise("rebrand"));
    console.log("maintenance:", advise("maintenance"));
    console.log("not-found:", advise("not-found"));
  }

  return { demo: demo };
})();
// Chạy: PermanentRedirectEngine.demo();
```

---

## §5. Câu Hỏi Phỏng Vấn!

```
  CÂU HỎI:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  ❓ 1: permanentRedirect vs redirect — khác gì?                │
  │  → permanentRedirect: 308 (Permanent)! ★                    │
  │  → redirect: 307 (Temporary)! ★                             │
  │  → 308: browser CACHE, search engine UPDATE index! ★★★     │
  │  → 307: KHÔNG cache, search engine GIỮ old URL! ★          │
  │                                                              │
  │  ❓ 2: Tại sao Server Action dùng 303?                          │
  │  → 303 "See Other": sau POST → redirect GET! ★              │
  │  → Prevent form resubmission! ★                             │
  │  → Cả redirect lẫn permanentRedirect đều 303! ★            │
  │                                                              │
  │  ❓ 3: type parameter hoạt động thế nào?                        │
  │  → 'push': thêm entry mới vào history! ★                    │
  │  → 'replace': thay thế entry hiện tại! ★                   │
  │  → Server Actions: default 'push'! ★                        │
  │  → Everywhere else: default 'replace'! ★                   │
  │  → Server Components: type BỊ IGNORE! ★★★                   │
  │                                                              │
  │  ❓ 4: permanentRedirect có return không?                       │
  │  → KHÔNG! TypeScript never type! ★                           │
  │  → Throw NEXT_REDIRECT → terminate rendering! ★            │
  │  → Không cần: return permanentRedirect()! ★                 │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```
