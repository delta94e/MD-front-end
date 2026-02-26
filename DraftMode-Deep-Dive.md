# draftMode() — Deep Dive!

> **Nguồn**: https://nextjs.org/docs/app/api-reference/functions/draft-mode
> **Ngôn ngữ**: Tiếng Việt — giải thích cực kỳ chi tiết!
> **Trang này KHÔNG có hình/diagram** — chỉ có text + code blocks!
> **Since**: v13.4.0 (sync) → v15.0.0-RC (async!)

---

## §1. draftMode() Là Gì?

```
  draftMode() — TỔNG QUAN:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  WHAT:                                                        │
  │  → Toggle giữa STATIC và DYNAMIC page! ★                    │
  │  → Xem DRAFT content từ CMS trước khi publish! ★            │
  │  → Enable/disable/check draft mode! ★                       │
  │                                                              │
  │  IMPORT:                                                      │
  │  import { draftMode } from 'next/headers'                    │
  │                                                              │
  │  USE CASE — CMS PREVIEW:                                      │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │                                                       │    │
  │  │  NORMAL MODE (Draft OFF):                              │    │
  │  │  ┌─────────────────────────────────┐                  │    │
  │  │  │ User → Static Page → Published  │                  │    │
  │  │  │        content only! ★           │                  │    │
  │  │  └─────────────────────────────────┘                  │    │
  │  │                                                       │    │
  │  │  DRAFT MODE (Draft ON):                                │    │
  │  │  ┌─────────────────────────────────┐                  │    │
  │  │  │ Editor → Dynamic Page → Draft   │                  │    │
  │  │  │          content! Unpublished!   │                  │    │
  │  │  │          Preview before live! ★  │                  │    │
  │  │  └─────────────────────────────────┘                  │    │
  │  │                                                       │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  MECHANISM — __prerender_bypass COOKIE:                       │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ enable() → Set cookie __prerender_bypass! ★           │    │
  │  │ Next.js thấy cookie → SKIP static cache! ★           │    │
  │  │ → Render DYNAMIC → fetch draft content! ★             │    │
  │  │ disable() → Xóa cookie! ★                             │    │
  │  │ → Trở lại static page! ★                              │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```

---

## §2. Reference — Methods + Properties!

```
  METHODS + PROPERTIES:
  ┌──────────────────┬──────────────────────────────────────────┐
  │ API              │ Mô tả                                   │
  ├──────────────────┼──────────────────────────────────────────┤
  │ isEnabled        │ Boolean! Draft Mode đang BẬT? ★         │
  │                  │ Dùng trong Server Component! ★           │
  │ enable()         │ BẬT Draft Mode! ★                       │
  │                  │ Set cookie __prerender_bypass! ★         │
  │                  │ Dùng trong Route Handler! ★              │
  │ disable()        │ TẮT Draft Mode! ★                       │
  │                  │ Xóa cookie! ★                            │
  │                  │ Dùng trong Route Handler! ★              │
  └──────────────────┴──────────────────────────────────────────┘

  FLOW:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  ① ENABLE (Route Handler):                                    │
  │  GET /api/draft → draft.enable()                             │
  │  → Set-Cookie: __prerender_bypass=<secret> ★                 │
  │  → User now sees DRAFT content! ★                            │
  │                                                              │
  │  ② CHECK (Server Component):                                  │
  │  const { isEnabled } = await draftMode()                     │
  │  → isEnabled = true → fetch DRAFT data! ★                   │
  │  → isEnabled = false → serve PUBLISHED data! ★               │
  │                                                              │
  │  ③ DISABLE (Route Handler):                                   │
  │  GET /api/draft/disable → draft.disable()                    │
  │  → Delete cookie! ★                                          │
  │  → Back to STATIC rendering! ★                               │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```

---

## §3. "Good to Know" + Examples!

```
  "GOOD TO KNOW":
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  ① draftMode() là ASYNC! (v15+) ★                            │
  │  → const { isEnabled } = await draftMode()                   │
  │  → v14: sync → v15: async! (breaking change!) ★             │
  │                                                              │
  │  ② __prerender_bypass cookie → NEW mỗi build! ★★★            │
  │  → next build → generate NEW bypass value! ★                 │
  │  → KHÔNG đoán được! Security! ★                              │
  │                                                              │
  │  ③ HTTP local testing:                                        │
  │  → Browser cần allow third-party cookies! ★                  │
  │  → Và local storage access! ★                                │
  │                                                              │
  │  ④ <Link> + disable → prefetch={false}! ★★★                  │
  │  → Nếu dùng <Link> gọi disable route                        │
  │  → PHẢI thêm prefetch={false}! ★                             │
  │  → Tránh xóa cookie khi prefetch! ★                         │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘

  EXAMPLES — 3 PATTERNS:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  ① ENABLE (Route Handler):                                    │
  │  // app/api/draft/route.ts                                    │
  │  import { draftMode } from 'next/headers'                    │
  │  export async function GET(request) {                        │
  │    const draft = await draftMode()                           │
  │    draft.enable()                                            │
  │    return new Response('Draft mode is enabled')              │
  │  }                                                           │
  │                                                              │
  │  ② DISABLE (Route Handler):                                   │
  │  export async function GET(request) {                        │
  │    const draft = await draftMode()                           │
  │    draft.disable()                                           │
  │    return new Response('Draft mode is disabled')             │
  │  }                                                           │
  │                                                              │
  │  ③ CHECK (Server Component):                                  │
  │  import { draftMode } from 'next/headers'                    │
  │  export default async function Page() {                       │
  │    const { isEnabled } = await draftMode()                   │
  │    return (                                                   │
  │      <main>                                                  │
  │        <h1>My Blog Post</h1>                                 │
  │        <p>Draft Mode: {isEnabled ? 'ON' : 'OFF'}</p>        │
  │      </main>                                                 │
  │    )                                                         │
  │  }                                                           │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘

  DRAFT SESSION LIFECYCLE:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  Browser mở → GET /api/draft → enable()                      │
  │       │                                                      │
  │       ▼                                                      │
  │  Cookie __prerender_bypass SET! ★                             │
  │       │                                                      │
  │       ▼                                                      │
  │  Navigate pages → isEnabled = true → Draft content! ★        │
  │       │                                                      │
  │       ├── GET /api/draft/disable → disable() → Session end!  │
  │       │                                                      │
  │       └── Close browser → Session cookie expires → END! ★    │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```

---

## §4. Tự Viết — DraftModeEngine!

```javascript
var DraftModeEngine = (function () {
  // ═══════════════════════════════════
  // 1. DRAFT MODE SIMULATOR
  // ═══════════════════════════════════
  var state = {
    isEnabled: false,
    bypassCookie: null,
  };

  function generateBypassValue() {
    // Simulate unique bypass per build
    var chars = "abcdefghijklmnopqrstuvwxyz0123456789";
    var result = "";
    for (var i = 0; i < 32; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  function enable() {
    state.isEnabled = true;
    state.bypassCookie = generateBypassValue();
    return {
      status: "enabled",
      cookie: {
        name: "__prerender_bypass",
        value: state.bypassCookie,
        httpOnly: true,
        sameSite: "none",
        secure: true,
        path: "/",
      },
      effect: "Static cache SKIPPED → Dynamic rendering! ★",
    };
  }

  function disable() {
    state.isEnabled = false;
    state.bypassCookie = null;
    return {
      status: "disabled",
      cookie: { name: "__prerender_bypass", deleted: true },
      effect: "Back to STATIC rendering! ★",
    };
  }

  function check() {
    return {
      isEnabled: state.isEnabled,
      rendering: state.isEnabled ? "DYNAMIC (draft!)" : "STATIC (published!)",
      dataSource: state.isEnabled
        ? "Draft content từ CMS! ★"
        : "Published content! ★",
    };
  }

  // ═══════════════════════════════════
  // 2. CMS PREVIEW SIMULATOR
  // ═══════════════════════════════════
  function fetchContent(slug, isDraftMode) {
    var published = { slug: slug, title: "Published: " + slug, status: "live" };
    var draft = {
      slug: slug,
      title: "DRAFT: " + slug,
      status: "draft",
      preview: true,
    };
    return {
      content: isDraftMode ? draft : published,
      source: isDraftMode ? "CMS draft API! ★" : "Static cache! ★",
    };
  }

  // ═══════════════════════════════════
  // 3. ROUTE HANDLER GENERATOR
  // ═══════════════════════════════════
  function generateRouteHandler(action) {
    if (action === "enable") {
      return [
        "// app/api/draft/route.ts",
        'import { draftMode } from "next/headers"',
        "",
        "export async function GET(request: Request) {",
        "  const draft = await draftMode()",
        "  draft.enable()",
        '  return new Response("Draft mode is enabled")',
        "}",
      ].join("\n");
    }
    return [
      "// app/api/draft/disable/route.ts",
      'import { draftMode } from "next/headers"',
      "",
      "export async function GET(request: Request) {",
      "  const draft = await draftMode()",
      "  draft.disable()",
      '  return new Response("Draft mode is disabled")',
      "}",
    ].join("\n");
  }

  // ═══════════════════════════════════
  // 4. DEMO
  // ═══════════════════════════════════
  function demo() {
    console.log("═══ DraftMode Engine ═══");

    console.log("\n── Check (initial) ──");
    console.log(check());

    console.log("\n── Enable ──");
    console.log(enable());
    console.log("Check:", check());

    console.log("\n── Fetch Content ──");
    console.log("Draft:", fetchContent("my-post", true));
    console.log("Published:", fetchContent("my-post", false));

    console.log("\n── Disable ──");
    console.log(disable());
    console.log("Check:", check());

    console.log("\n── Route Handler ──");
    console.log(generateRouteHandler("enable"));
  }

  return { demo: demo };
})();
// Chạy: DraftModeEngine.demo();
```

---

## §5. Câu Hỏi Phỏng Vấn!

```
  CÂU HỎI:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  ❓ 1: draftMode() dùng để làm gì?                            │
  │  → Toggle giữa STATIC và DYNAMIC rendering! ★               │
  │  → Preview DRAFT content từ CMS trước publish! ★            │
  │  → 3 APIs: isEnabled, enable(), disable()! ★                │
  │                                                              │
  │  ❓ 2: Cơ chế hoạt động của draft mode?                        │
  │  → enable() → Set cookie __prerender_bypass! ★               │
  │  → Next.js thấy cookie → skip static cache! ★               │
  │  → Render dynamic → fetch draft data! ★                     │
  │  → Cookie value MỚI mỗi next build! ★ (security!)          │
  │                                                              │
  │  ❓ 3: Draft session kết thúc khi nào?                         │
  │  → Gọi disable() → xóa cookie! ★                            │
  │  → HOẶC đóng browser → session cookie expires! ★            │
  │                                                              │
  │  ❓ 4: Tại sao <Link> cần prefetch={false} khi disable?       │
  │  → <Link> tự động prefetch page! ★                          │
  │  → Prefetch gọi disable route → XÓA cookie sớm! ❌          │
  │  → prefetch={false} → chỉ gọi khi CLICK! ★                 │
  │                                                              │
  │  ❓ 5: enable()/disable() gọi ở đâu?                          │
  │  → Route Handler ONLY! ★                                     │
  │  → Server Component chỉ CHECK (isEnabled)! ★                │
  │  → KHÔNG enable/disable trong Server Component! ★           │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```
