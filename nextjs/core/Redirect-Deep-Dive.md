# redirect() — Deep Dive!

> **Nguồn**: https://nextjs.org/docs/app/api-reference/functions/redirect
> **Ngôn ngữ**: Tiếng Việt — giải thích cực kỳ chi tiết!
> **Trang này KHÔNG có hình/diagram** — chỉ có text + code blocks!
> **import**: `next/navigation`

---

## §1. redirect() Là Gì?

```
  redirect() — TỔNG QUAN:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  WHAT:                                                        │
  │  → Redirect TẠM THỜI user tới URL khác! ★                   │
  │  → HTTP 307 (Temporary Redirect)! ★                          │
  │  → Server Action → HTTP 303! ★                               │
  │  → Streaming → meta tag redirect! ★                         │
  │                                                              │
  │  DÙNG TRONG:                                                  │
  │  → Server Components ✅                                      │
  │  → Client Components (rendering, NOT event handlers!) ✅    │
  │  → Route Handlers ✅                                         │
  │  → Server Functions ✅                                       │
  │                                                              │
  │  FLOW:                                                        │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │  redirect('/login')                                   │    │
  │  │    │                                                  │    │
  │  │    ▼                                                  │    │
  │  │  Throw NEXT_REDIRECT! ★                               │    │
  │  │    │                                                  │    │
  │  │    ▼                                                  │    │
  │  │  CONTEXT?                                              │    │
  │  │  ├── Server Action → 303! ★                           │    │
  │  │  ├── Streaming    → <meta> tag! ★                     │    │
  │  │  └── Otherwise    → 307! ★                            │    │
  │  │    │                                                  │    │
  │  │    ▼                                                  │    │
  │  │  Terminate rendering! ★                               │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```

---

## §2. Parameters + Behavior!

```
  PARAMETERS:
  ┌──────────────────────────────────────────────────────────────┐
  │  redirect(path, type?)                                        │
  │                                                              │
  │  path:  string — URL đích! ★                                 │
  │  type:  'replace' | 'push' — browser history behavior! ★    │
  │                                                              │
  │  DEFAULT type:                                                │
  │  ┌──────────────────┬─────────┬──────────────────────────┐   │
  │  │ Context           │ Default │ Effect                    │   │
  │  ├──────────────────┼─────────┼──────────────────────────┤   │
  │  │ Server Actions    │ 'push'  │ New history entry! ★      │   │
  │  │ Everywhere else   │'replace'│ Replace current URL! ★    │   │
  │  │ Server Components │ —       │ type IGNORED! ★★★         │   │
  │  └──────────────────┴─────────┴──────────────────────────┘   │
  │                                                              │
  │  RETURNS: không return! (never type!) ★                      │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘

  BEHAVIOR — QUAN TRỌNG:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  ① PHẢI gọi NGOÀI try/catch! (throw NEXT_REDIRECT!) ★★★   │
  │  ② Client Component: CHỈ trong rendering! ★                 │
  │     Event handler → dùng useRouter().push() thay thế! ★     │
  │  ③ Chấp nhận absolute URLs → redirect external! ★           │
  │  ④ Trước render → dùng next.config.js! ★                    │
  │  ⑤ Client SSR initial load → server-side redirect! ★       │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```

---

## §3. FAQ — Tại Sao 307/308 Chứ Không Phải 301/302?

```
  WHY 307 AND 308?
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  LỊCH SỬ:                                                    │
  │  ┌──────┬────────────────┬────────────────────────────────┐  │
  │  │ Code │ Name            │ Vấn đề                         │  │
  │  ├──────┼────────────────┼────────────────────────────────┤  │
  │  │ 301  │ Moved Permanent│ Browser đổi POST → GET! ★★★    │  │
  │  │ 302  │ Found (Temp)   │ Browser đổi POST → GET! ★★★    │  │
  │  │ 307  │ Temp Redirect  │ GIỮ NGUYÊN POST method! ★      │  │
  │  │ 308  │ Perm Redirect  │ GIỮ NGUYÊN POST method! ★      │  │
  │  └──────┴────────────────┴────────────────────────────────┘  │
  │                                                              │
  │  VÍ DỤ:                                                      │
  │  POST /users → redirect → POST /people (307: giữ POST!) ★  │
  │  POST /users → redirect → GET /people (302: ĐỔI POST!) ★★★│
  │                                                              │
  │  → Next.js chọn 307 mặc định để PRESERVE method! ★         │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```

---

## §4. Examples — Server + Client!

```
  SERVER COMPONENT:
  ┌──────────────────────────────────────────────────────────────┐
  │  import { redirect } from 'next/navigation'                  │
  │  const team = await fetchTeam(id)                            │
  │  if (!team) { redirect('/login') }                           │
  └──────────────────────────────────────────────────────────────┘

  CLIENT COMPONENT — Rendering:
  ┌──────────────────────────────────────────────────────────────┐
  │  'use client'                                                │
  │  import { redirect, usePathname } from 'next/navigation'    │
  │  export function ClientRedirect() {                           │
  │    const pathname = usePathname()                            │
  │    if (pathname.startsWith('/admin')) {                       │
  │      redirect('/admin/login')  ← OK trong rendering! ★     │
  │    }                                                         │
  │  }                                                           │
  └──────────────────────────────────────────────────────────────┘

  CLIENT COMPONENT — Event Handler (Server Action):
  ┌──────────────────────────────────────────────────────────────┐
  │  // actions.ts                                                │
  │  'use server'                                                │
  │  export async function navigate(data: FormData) {             │
  │    redirect(`/posts/${data.get('id')}`)                      │
  │  }                                                           │
  │  // component.tsx                                             │
  │  <form action={navigate}>                                    │
  │    <input name="id" /> <button>Submit</button>               │
  │  </form>                                                     │
  └──────────────────────────────────────────────────────────────┘
```

---

## §5. Tự Viết — RedirectEngine!

```javascript
var RedirectEngine = (function () {
  function redirect(path, type, context) {
    context = context || "server-component";
    var status = context === "server-action" ? 303 : 307;
    var historyAction =
      type || (context === "server-action" ? "push" : "replace");
    return {
      error: "NEXT_REDIRECT",
      path: path,
      status: status,
      permanent: false,
      historyAction: historyAction,
      headers: { Location: path },
    };
  }

  function compareStatusCodes() {
    return [
      {
        code: 301,
        name: "Moved Permanently",
        preserveMethod: false,
        permanent: true,
      },
      { code: 302, name: "Found", preserveMethod: false, permanent: false },
      {
        code: 307,
        name: "Temporary Redirect",
        preserveMethod: true,
        permanent: false,
      },
      {
        code: 308,
        name: "Permanent Redirect",
        preserveMethod: true,
        permanent: true,
      },
    ];
  }

  function adviseUsage(scenario) {
    var map = {
      rendering: {
        where: "redirect()",
        note: "Trong Server/Client Component rendering! ★",
      },
      "event-handler": {
        where: "useRouter().push()",
        note: "Event handler → dùng hook! ★",
      },
      "server-action": { where: "redirect()", note: "Server Action → 303! ★" },
      "before-render": {
        where: "next.config.js redirects",
        note: "Config-level redirect! ★",
      },
    };
    return map[scenario] || { where: "redirect()", note: "Default! ★" };
  }

  function demo() {
    console.log("═══ Redirect Engine ═══");
    console.log("\n── Redirect ──");
    console.log(redirect("/login", null, "server-component"));
    console.log(redirect("/dashboard", "push", "server-action"));
    console.log("\n── Status Codes ──");
    console.log(compareStatusCodes());
    console.log("\n── Usage ──");
    console.log("rendering:", adviseUsage("rendering"));
    console.log("event-handler:", adviseUsage("event-handler"));
  }

  return { demo: demo };
})();
// Chạy: RedirectEngine.demo();
```

---

## §6. Câu Hỏi Phỏng Vấn!

```
  CÂU HỎI:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  ❓ 1: Tại sao 307 chứ không 302?                               │
  │  → 302: browser đổi POST → GET! BUG! ★★★                   │
  │  → 307: GIỮ NGUYÊN HTTP method! ★                           │
  │  → POST /users → 307 → POST /people (đúng!) ★              │
  │                                                              │
  │  ❓ 2: redirect trong Client Component — giới hạn?              │
  │  → CHỈ trong rendering process! ★                            │
  │  → Event handler → dùng useRouter().push()! ★★★             │
  │  → HOẶC Server Action! ★                                    │
  │                                                              │
  │  ❓ 3: redirect + try/catch → sao?                              │
  │  → redirect throw NEXT_REDIRECT! ★                           │
  │  → try/catch BẮT error → redirect KHÔNG WORK! ★★★          │
  │  → PHẢI gọi NGOÀI try/catch! ★                              │
  │                                                              │
  │  ❓ 4: redirect vs permanentRedirect?                            │
  │  → redirect: 307 (temporary)! ★                              │
  │  → permanentRedirect: 308 (permanent)! ★                    │
  │  → Resource not exist → notFound()! ★                       │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```
