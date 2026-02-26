# NextRequest — Deep Dive!

> **Nguồn**: https://nextjs.org/docs/app/api-reference/functions/next-request
> **Ngôn ngữ**: Tiếng Việt — giải thích cực kỳ chi tiết!
> **Trang này KHÔNG có hình/diagram** — chỉ có text + code blocks!
> **Since**: v12.2.0! (import từ `next/server`)

---

## §1. NextRequest Là Gì?

```
  NextRequest — TỔNG QUAN:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  WHAT:                                                        │
  │  → Extends Web Request API! ★                                │
  │  → Thêm convenience methods cho Next.js! ★                  │
  │  → import { NextRequest } from 'next/server'                │
  │                                                              │
  │  INHERITANCE:                                                 │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ Web Request API (native browser!)                     │    │
  │  │   ↑ extends                                           │    │
  │  │ NextRequest                                           │    │
  │  │   + cookies  ← Cookie management! ★                   │    │
  │  │   + nextUrl  ← Enhanced URL parsing! ★                │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  DÙNG TRONG:                                                  │
  │  → Middleware (middleware.ts) ✅                              │
  │  → Route Handlers (route.ts) ✅                              │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```

---

## §2. cookies — 6 Methods!

```
  COOKIES API:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  request.cookies — Read/Mutate Set-Cookie header! ★          │
  │                                                              │
  │  ┌───────────┬────────────────────────────────────────────┐  │
  │  │ Method     │ Mô tả                                     │  │
  │  ├───────────┼────────────────────────────────────────────┤  │
  │  │ set(n,v)   │ Set cookie trên request! ★                │  │
  │  │ get(n)     │ Return { name, value, Path }! ★           │  │
  │  │            │ Không tìm thấy → undefined! ★             │  │
  │  │ getAll()   │ Trả all cookies (hoặc by name)! ★        │  │
  │  │ delete(n)  │ Delete cookie! Return true/false! ★       │  │
  │  │ has(n)     │ Cookie tồn tại? true/false! ★             │  │
  │  │ clear()    │ Remove ALL cookies! ★                     │  │
  │  └───────────┴────────────────────────────────────────────┘  │
  │                                                              │
  │  VÍ DỤ:                                                      │
  │  request.cookies.set('show-banner', 'false')                 │
  │  → Set-Cookie: show-banner=false;path=/home                  │
  │                                                              │
  │  request.cookies.get('show-banner')                          │
  │  → { name: 'show-banner', value: 'false', Path: '/home' }   │
  │                                                              │
  │  request.cookies.getAll('experiments')                       │
  │  → [{ name: 'experiments', value: 'new-pricing-page' }, ...] │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```

---

## §3. nextUrl — Enhanced URL!

```
  nextUrl — Extends native URL API:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  request.nextUrl — Next.js specific URL properties! ★        │
  │                                                              │
  │  ┌───────────────┬────────────────────────────────────────┐  │
  │  │ Property       │ Mô tả                                 │  │
  │  ├───────────────┼────────────────────────────────────────┤  │
  │  │ basePath       │ Base path config! ★                    │  │
  │  │ buildId        │ Build ID (undefined nếu default)! ★   │  │
  │  │ pathname       │ URL pathname! ★                        │  │
  │  │ searchParams   │ URLSearchParams object! ★              │  │
  │  └───────────────┴────────────────────────────────────────┘  │
  │                                                              │
  │  VÍ DỤ:                                                      │
  │  // Request: /home                                           │
  │  request.nextUrl.pathname → '/home'                          │
  │                                                              │
  │  // Request: /home?name=lee                                  │
  │  request.nextUrl.searchParams → { 'name': 'lee' }           │
  │                                                              │
  │  "Good to know":                                              │
  │  → v15: ip và geo đã bị REMOVE! ★★★                        │
  │  → Pages Router i18n KHÔNG có trong App Router! ★           │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```

---

## §4. Tự Viết — NextRequestEngine!

```javascript
var NextRequestEngine = (function () {
  // ═══════════════════════════════════
  // 1. COOKIES SIMULATOR
  // ═══════════════════════════════════
  function createCookieStore() {
    var store = {};
    return {
      set: function (name, value) {
        store[name] = { name: name, value: value };
      },
      get: function (name) {
        return store[name] || undefined;
      },
      getAll: function (name) {
        if (name) {
          return Object.values(store).filter(function (c) {
            return c.name === name;
          });
        }
        return Object.values(store);
      },
      delete: function (name) {
        if (store[name]) {
          delete store[name];
          return true;
        }
        return false;
      },
      has: function (name) {
        return !!store[name];
      },
      clear: function () {
        store = {};
      },
      _store: function () {
        return store;
      },
    };
  }

  // ═══════════════════════════════════
  // 2. NEXT URL SIMULATOR
  // ═══════════════════════════════════
  function createNextUrl(urlString, basePath) {
    var url;
    try {
      url = new URL(urlString, "http://localhost");
    } catch (e) {
      url = { pathname: urlString, searchParams: new URLSearchParams() };
    }
    return {
      basePath: basePath || "",
      buildId: undefined,
      pathname: url.pathname,
      searchParams: url.searchParams,
      toString: function () {
        return url.toString();
      },
    };
  }

  // ═══════════════════════════════════
  // 3. NEXT REQUEST BUILDER
  // ═══════════════════════════════════
  function createNextRequest(urlString, options) {
    var cookies = createCookieStore();
    var nextUrl = createNextUrl(urlString);
    // Parse existing cookie header
    if (options && options.cookieHeader) {
      options.cookieHeader.split("; ").forEach(function (pair) {
        var parts = pair.split("=");
        cookies.set(parts[0], parts[1] || "");
      });
    }
    return {
      url: urlString,
      method: (options && options.method) || "GET",
      cookies: cookies,
      nextUrl: nextUrl,
      headers: (options && options.headers) || {},
    };
  }

  // ═══════════════════════════════════
  // 4. DEMO
  // ═══════════════════════════════════
  function demo() {
    console.log("═══ NextRequest Engine ═══");

    var req = createNextRequest("/home?name=lee", {
      cookieHeader: "theme=dark; lang=vi",
    });

    console.log("\n── Cookies ──");
    console.log("get theme:", req.cookies.get("theme"));
    console.log("has lang:", req.cookies.has("lang"));
    console.log("getAll:", req.cookies.getAll());
    req.cookies.set("show-banner", "false");
    console.log("after set:", req.cookies.getAll());
    req.cookies.delete("theme");
    console.log("after delete:", req.cookies.getAll());

    console.log("\n── nextUrl ──");
    console.log("pathname:", req.nextUrl.pathname);
    console.log("searchParams name:", req.nextUrl.searchParams.get("name"));
  }

  return { demo: demo };
})();
// Chạy: NextRequestEngine.demo();
```

---

## §5. Câu Hỏi Phỏng Vấn!

```
  CÂU HỎI:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  ❓ 1: NextRequest vs Request — khác gì?                       │
  │  → NextRequest extends Web Request API! ★                    │
  │  → Thêm cookies (6 methods) + nextUrl! ★                    │
  │  → import từ 'next/server'! ★                               │
  │                                                              │
  │  ❓ 2: cookies.get() return gì?                                 │
  │  → { name, value, Path }! ★                                  │
  │  → Không tìm thấy → undefined! ★                            │
  │  → Multiple cùng tên → trả FIRST one! ★                     │
  │                                                              │
  │  ❓ 3: nextUrl có gì đặc biệt?                                  │
  │  → Extends native URL API! ★                                 │
  │  → basePath, buildId, pathname, searchParams! ★              │
  │  → v15: ip + geo đã bị REMOVE! ★★★                          │
  │                                                              │
  │  ❓ 4: Dùng NextRequest ở đâu?                                  │
  │  → Middleware (middleware.ts)! ★                              │
  │  → Route Handlers (route.ts)! ★                              │
  │  → KHÔNG dùng trong Server Components! ★                    │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```
