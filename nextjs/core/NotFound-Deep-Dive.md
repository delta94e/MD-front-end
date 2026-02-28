# notFound() — Deep Dive!

> **Nguồn**: https://nextjs.org/docs/app/api-reference/functions/not-found
> **Ngôn ngữ**: Tiếng Việt — giải thích cực kỳ chi tiết!
> **Trang này KHÔNG có hình/diagram** — chỉ có text + code blocks!
> **Since**: v13.0.0! (import từ `next/navigation`)

---

## §1. notFound() Là Gì?

```
  notFound() — TỔNG QUAN:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  WHAT:                                                        │
  │  → Render not-found.tsx file trong route segment! ★          │
  │  → Inject <meta name="robots" content="noindex"> ★★★       │
  │  → Throw NEXT_HTTP_ERROR_FALLBACK;404 error! ★              │
  │  → TERMINATE rendering of route segment! ★                  │
  │                                                              │
  │  FLOW:                                                        │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │                                                       │    │
  │  │  Server Component                                     │    │
  │  │    │                                                  │    │
  │  │    ▼                                                  │    │
  │  │  fetchUser(id) → null?                                │    │
  │  │    │ YES                                              │    │
  │  │    ▼                                                  │    │
  │  │  notFound()                                           │    │
  │  │    │                                                  │    │
  │  │    ▼                                                  │    │
  │  │  ① Throw NEXT_HTTP_ERROR_FALLBACK;404! ★              │    │
  │  │  ② Tìm not-found.tsx gần nhất! ★                     │    │
  │  │  ③ Render Not Found UI! ★                             │    │
  │  │  ④ <meta robots noindex>! ★                           │    │
  │  │  ⑤ HTTP 404 status! ★                                 │    │
  │  │                                                       │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  TypeScript: return type là 'never'! ★                       │
  │  → KHÔNG cần: return notFound()                              │
  │  → Chỉ cần: notFound()  ← đủ rồi! ★                       │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```

---

## §2. Example + notFound vs forbidden vs unauthorized!

```
  USAGE EXAMPLE:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  import { notFound } from 'next/navigation'                  │
  │                                                              │
  │  async function fetchUser(id) {                               │
  │    const res = await fetch('https://...')                     │
  │    if (!res.ok) return undefined                              │
  │    return res.json()                                         │
  │  }                                                           │
  │                                                              │
  │  export default async function Profile({ params }) {          │
  │    const { id } = await params                               │
  │    const user = await fetchUser(id)                          │
  │                                                              │
  │    if (!user) {                                               │
  │      notFound()  ← Không cần return! (never type!) ★        │
  │    }                                                         │
  │                                                              │
  │    return <div>{user.name}</div>                              │
  │  }                                                           │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘

  COMPARISON TABLE:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  ┌──────────────┬────────┬──────────────┬───────────────┐    │
  │  │ Function      │ Status │ File          │ Use case      │    │
  │  ├──────────────┼────────┼──────────────┼───────────────┤    │
  │  │ notFound()    │ 404    │ not-found.tsx │ Data missing! │    │
  │  │ forbidden()   │ 403    │ forbidden.tsx │ No permission!│    │
  │  │ unauthorized()│ 401    │ unauthorized  │ Not logged in!│    │
  │  │               │        │   .tsx        │               │    │
  │  └──────────────┴────────┴──────────────┴───────────────┘    │
  │                                                              │
  │  → notFound inject <meta robots noindex>! ★                  │
  │  → SEO: 404 pages auto noindex! ★                           │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```

---

## §3. Tự Viết — NotFoundEngine!

```javascript
var NotFoundEngine = (function () {
  // ═══════════════════════════════════
  // 1. NOT FOUND SIMULATOR
  // ═══════════════════════════════════
  function notFound() {
    return {
      error: "NEXT_HTTP_ERROR_FALLBACK;404",
      status: 404,
      meta: '<meta name="robots" content="noindex">',
      rendered: "not-found.tsx (nearest ancestor!)",
      terminated: true,
    };
  }

  // ═══════════════════════════════════
  // 2. ROUTE ERROR RESOLVER
  // ═══════════════════════════════════
  function resolveError(type) {
    var map = {
      "not-found": {
        status: 404,
        file: "not-found.tsx",
        meta: "noindex",
        fn: "notFound()",
      },
      forbidden: {
        status: 403,
        file: "forbidden.tsx",
        meta: null,
        fn: "forbidden()",
      },
      unauthorized: {
        status: 401,
        file: "unauthorized.tsx",
        meta: null,
        fn: "unauthorized()",
      },
    };
    return (
      map[type] || { status: 500, file: "error.tsx", meta: null, fn: "throw" }
    );
  }

  // ═══════════════════════════════════
  // 3. DATA GUARD GENERATOR
  // ═══════════════════════════════════
  function generateGuard(dataName) {
    return [
      "const " +
        dataName +
        " = await fetch" +
        dataName.charAt(0).toUpperCase() +
        dataName.slice(1) +
        "(id)",
      "if (!" + dataName + ") {",
      "  notFound()",
      "}",
      "// Continue with " + dataName + "...",
    ].join("\n");
  }

  // ═══════════════════════════════════
  // 4. DEMO
  // ═══════════════════════════════════
  function demo() {
    console.log("═══ NotFound Engine ═══");

    console.log("\n── notFound() ──");
    console.log(notFound());

    console.log("\n── Resolve ──");
    console.log("404:", resolveError("not-found"));
    console.log("403:", resolveError("forbidden"));
    console.log("401:", resolveError("unauthorized"));

    console.log("\n── Guard ──");
    console.log(generateGuard("user"));
    console.log("\n");
    console.log(generateGuard("product"));
  }

  return { demo: demo };
})();
// Chạy: NotFoundEngine.demo();
```

---

## §4. Câu Hỏi Phỏng Vấn!

```
  CÂU HỎI:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  ❓ 1: notFound() làm gì internally?                           │
  │  → Throw NEXT_HTTP_ERROR_FALLBACK;404! ★                    │
  │  → Tìm not-found.tsx GẦN NHẤT! ★                            │
  │  → Inject <meta robots noindex>! ★                          │
  │  → Terminate rendering segment! ★                           │
  │                                                              │
  │  ❓ 2: Có cần return notFound()?                                │
  │  → KHÔNG! TypeScript type = never! ★                         │
  │  → notFound() đủ, sau đó code KHÔNG execute! ★             │
  │                                                              │
  │  ❓ 3: notFound vs forbidden vs unauthorized?                   │
  │  → 404 vs 403 vs 401! ★                                      │
  │  → not-found.tsx vs forbidden.tsx vs unauthorized.tsx! ★    │
  │  → CHỈ notFound inject noindex meta! ★★★                    │
  │                                                              │
  │  ❓ 4: notFound ảnh hưởng SEO thế nào?                          │
  │  → <meta name="robots" content="noindex">! ★                │
  │  → 404 pages TỰ ĐỘNG bị noindex! ★                          │
  │  → Search engines KHÔNG index 404 pages! ★                  │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```
