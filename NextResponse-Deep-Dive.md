# NextResponse — Deep Dive!

> **Nguồn**: https://nextjs.org/docs/app/api-reference/functions/next-response
> **Ngôn ngữ**: Tiếng Việt — giải thích cực kỳ chi tiết!
> **Trang này KHÔNG có hình/diagram** — chỉ có text + code blocks!
> **Since**: v12.2.0! (import từ `next/server`)

---

## §1. NextResponse Là Gì?

```
  NextResponse — TỔNG QUAN:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  WHAT:                                                        │
  │  → Extends Web Response API! ★                               │
  │  → Thêm convenience methods cho Next.js! ★                  │
  │  → import { NextResponse } from 'next/server'               │
  │                                                              │
  │  INHERITANCE:                                                 │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ Web Response API (native!)                            │    │
  │  │   ↑ extends                                           │    │
  │  │ NextResponse                                          │    │
  │  │   + cookies     ← Cookie management! ★                │    │
  │  │   + json()      ← JSON response! ★                    │    │
  │  │   + redirect()  ← Redirect! ★                         │    │
  │  │   + rewrite()   ← URL rewrite (proxy!) ★              │    │
  │  │   + next()      ← Continue middleware chain! ★        │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  DÙNG TRONG:                                                  │
  │  → Middleware (middleware.ts) ✅                              │
  │  → Route Handlers (route.ts) ✅                              │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```

---

## §2. cookies — 5 Methods!

```
  RESPONSE COOKIES API:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  response.cookies — Read/Mutate Set-Cookie header! ★         │
  │                                                              │
  │  ┌───────────┬────────────────────────────────────────────┐  │
  │  │ Method     │ Mô tả                                     │  │
  │  ├───────────┼────────────────────────────────────────────┤  │
  │  │ set(n,v)   │ Set cookie trên RESPONSE! ★               │  │
  │  │ get(n)     │ Return { name, value, Path }! ★           │  │
  │  │ getAll()   │ Trả all cookies! ★                        │  │
  │  │ has(n)     │ Cookie tồn tại? true/false! ★             │  │
  │  │ delete(n)  │ Delete! Return true/false! ★              │  │
  │  └───────────┴────────────────────────────────────────────┘  │
  │  (Giống NextRequest.cookies nhưng THIẾU clear()!)            │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```

---

## §3. Static Methods — json + redirect + rewrite + next!

```
  4 STATIC METHODS:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  ① json(body, init?):                                         │
  │  NextResponse.json({ error: 'ISE' }, { status: 500 })       │
  │  → Response với JSON body! ★                                 │
  │                                                              │
  │  ② redirect(url, status?):                                    │
  │  NextResponse.redirect(new URL('/new', request.url))         │
  │  → Redirect user! ★                                          │
  │  → Có thể modify URL trước redirect:                        │
  │    const loginUrl = new URL('/login', request.url)           │
  │    loginUrl.searchParams.set('from', pathname)               │
  │    return NextResponse.redirect(loginUrl)                    │
  │                                                              │
  │  ③ rewrite(url):                                              │
  │  NextResponse.rewrite(new URL('/proxy', request.url))        │
  │  → Proxy: serve /proxy nhưng browser vẫn thấy /about! ★    │
  │  → URL KHÔNG thay đổi trên browser! ★★★                    │
  │                                                              │
  │  ④ next(options?):                                             │
  │  NextResponse.next()                                         │
  │  → Continue middleware chain! ★                              │
  │  → Forward headers upstream:                                 │
  │    NextResponse.next({ request: { headers: newHeaders } })   │
  │  → ★★★ CẢNH BÁO:                                            │
  │    next({ headers }) → gửi headers TỚI CLIENT! ★★★         │
  │    next({ request: { headers } }) → gửi UPSTREAM! ★★★      │
  │    → TUYỆT ĐỐI KHÔNG copy all request headers! ★★★        │
  │    → Dùng ALLOW-LIST! Filter x-*, authorization, cookie! ★ │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘

  redirect() vs rewrite() — Comparison:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  ┌────────────────┬─────────────┬─────────────────────────┐  │
  │  │                 │ redirect()  │ rewrite()                │  │
  │  ├────────────────┼─────────────┼─────────────────────────┤  │
  │  │ Browser URL     │ CHANGES! ★  │ STAYS same! ★           │  │
  │  │ HTTP status     │ 307/308! ★  │ 200! ★                  │  │
  │  │ Content served  │ New URL! ★  │ Target URL! ★           │  │
  │  │ SEO impact      │ Redirect! ★ │ Transparent proxy! ★   │  │
  │  └────────────────┴─────────────┴─────────────────────────┘  │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```

---

## §4. Tự Viết — NextResponseEngine!

```javascript
var NextResponseEngine = (function () {
  // ═══════════════════════════════════
  // 1. COOKIE STORE (Response)
  // ═══════════════════════════════════
  function createResponseCookies() {
    var store = {};
    return {
      set: function (name, value) {
        store[name] = { name: name, value: value };
      },
      get: function (name) {
        return store[name] || undefined;
      },
      getAll: function (name) {
        if (name)
          return Object.values(store).filter(function (c) {
            return c.name === name;
          });
        return Object.values(store);
      },
      has: function (name) {
        return !!store[name];
      },
      delete: function (name) {
        if (store[name]) {
          delete store[name];
          return true;
        }
        return false;
      },
      toSetCookieHeaders: function () {
        return Object.values(store).map(function (c) {
          return "Set-Cookie: " + c.name + "=" + c.value + "; path=/";
        });
      },
    };
  }

  // ═══════════════════════════════════
  // 2. STATIC METHOD SIMULATORS
  // ═══════════════════════════════════
  function json(body, init) {
    return {
      type: "json",
      body: JSON.stringify(body),
      status: (init && init.status) || 200,
      headers: { "Content-Type": "application/json" },
    };
  }

  function redirect(url, status) {
    return {
      type: "redirect",
      url: url,
      status: status || 307,
      headers: { Location: url },
    };
  }

  function rewrite(url) {
    return {
      type: "rewrite",
      url: url,
      status: 200,
      note: "Browser URL KHÔNG thay đổi! Serve content từ " + url + "! ★",
    };
  }

  function next(options) {
    var result = {
      type: "next",
      status: 200,
      note: "Continue middleware chain! ★",
    };
    if (options && options.request && options.request.headers) {
      result.forwardedHeaders = options.request.headers;
      result.note += " Headers forwarded UPSTREAM! ★";
    }
    return result;
  }

  // ═══════════════════════════════════
  // 3. HEADER SAFETY CHECKER
  // ═══════════════════════════════════
  function checkHeaderSafety(headers) {
    var unsafe = [];
    var safe = [];
    for (var name in headers) {
      var lower = name.toLowerCase();
      if (
        lower.startsWith("x-") ||
        lower === "authorization" ||
        lower === "cookie"
      ) {
        unsafe.push(name);
      } else {
        safe.push(name);
      }
    }
    return {
      safe: safe,
      unsafe: unsafe,
      warning:
        unsafe.length > 0
          ? "KHÔNG forward: " + unsafe.join(", ") + "! ★★★"
          : null,
    };
  }

  // ═══════════════════════════════════
  // 4. DEMO
  // ═══════════════════════════════════
  function demo() {
    console.log("═══ NextResponse Engine ═══");

    console.log("\n── json ──");
    console.log(json({ error: "Not Found" }, { status: 404 }));

    console.log("\n── redirect ──");
    console.log(redirect("/login?from=/dashboard"));

    console.log("\n── rewrite ──");
    console.log(rewrite("/internal-api/data"));

    console.log("\n── next ──");
    console.log(next({ request: { headers: { "x-version": "123" } } }));

    console.log("\n── Header Safety ──");
    console.log(
      checkHeaderSafety({
        Accept: "application/json",
        "x-custom": "secret",
        authorization: "Bearer abc",
        "Content-Type": "text/html",
      }),
    );
  }

  return { demo: demo };
})();
// Chạy: NextResponseEngine.demo();
```

---

## §5. Câu Hỏi Phỏng Vấn!

```
  CÂU HỎI:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  ❓ 1: redirect() vs rewrite() — khác gì?                      │
  │  → redirect: browser URL THAY ĐỔI + 307/308! ★             │
  │  → rewrite: browser URL GIỮ NGUYÊN + serve target! ★       │
  │  → rewrite = transparent proxy! ★                           │
  │                                                              │
  │  ❓ 2: next({ headers }) vs next({ request: { headers } })?    │
  │  → { headers } → gửi client! ★ NGUY HIỂM! ★★★             │
  │  → { request: { headers } } → gửi upstream! ★ ĐÚNG! ★     │
  │  → Override Content-Type → broken Server Actions! ★★★      │
  │                                                              │
  │  ❓ 3: Tại sao không copy ALL request headers?                  │
  │  → Leak sensitive data (authorization, cookie)! ★★★         │
  │  → Dùng ALLOW-LIST! Filter x-*, auth! ★                    │
  │  → Defensive approach! ★                                    │
  │                                                              │
  │  ❓ 4: NextResponse.cookies thiếu gì so với NextRequest?        │
  │  → Thiếu clear()! ★                                          │
  │  → NextRequest.cookies: 6 methods (+ clear)! ★             │
  │  → NextResponse.cookies: 5 methods! ★                       │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```
