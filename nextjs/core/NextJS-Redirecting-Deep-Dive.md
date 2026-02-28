# Next.js Redirecting — Deep Dive!

> **Chủ đề**: Redirect — Điều Hướng URL!
> **Ngôn ngữ**: Tiếng Việt — giải thích cực kỳ chi tiết!
> **Phương châm**: Tự viết lại bằng tay — KHÔNG dùng thư viện!
> **Nguồn**: https://nextjs.org/docs/app/guides/redirecting
> **Lưu ý**: Trang gốc KHÔNG có sơ đồ — tất cả diagrams TỰ VẼ!

---

## Mục Lục

1. [§1. Tổng Quan — 5 Cách Redirect!](#1)
2. [§2. redirect() và permanentRedirect()](#2)
3. [§3. useRouter() Hook — Client Side!](#3)
4. [§4. next.config.js redirects — Static Rules!](#4)
5. [§5. NextResponse.redirect — Proxy/Middleware!](#5)
6. [§6. Managing Redirects At Scale — Bloom Filter!](#6)
7. [§7. Tự Viết — RedirectEngine!](#7)
8. [§8. Câu Hỏi Luyện Tập](#8)

---

## §1. Tổng Quan — 5 Cách Redirect!

```
  5 REDIRECT METHODS IN NEXT.JS:
  ┌────────────────────────────────────────────────────────────┐
  │                                                            │
  │  REQUEST FLOW:                                             │
  │                                                            │
  │  Browser → ① next.config.js redirects (trước hết!)     │
  │           → ② Proxy/Middleware (NextResponse.redirect)   │
  │           → ③ Server Component / Route Handler           │
  │                 → redirect()                              │
  │                 → permanentRedirect()                     │
  │           → ④ Client Component                            │
  │                 → useRouter().push()                      │
  │                                                            │
  │  ┌───────────────────┬────────┬──────────┬─────────────┐  │
  │  │ Method            │ Status │ Where    │ Use Case    │  │
  │  ├───────────────────┼────────┼──────────┼─────────────┤  │
  │  │ redirect()        │ 307    │ Server   │ After       │  │
  │  │                   │ (303)  │ Component│ mutation!   │  │
  │  │ permanentRedirect │ 308    │ Server   │ URL changed │  │
  │  │ ()                │        │ Component│ permanently!│  │
  │  │ useRouter()       │ —      │ Client   │ Event       │  │
  │  │ .push()           │        │ Component│ handlers!   │  │
  │  │ redirects in      │ 307/   │ Config   │ Known URL   │  │
  │  │ next.config.js    │ 308    │ (static) │ changes!    │  │
  │  │ NextResponse      │ 307/   │ Proxy/   │ Conditional │  │
  │  │ .redirect()       │ 308    │ Middleware│ (auth,etc)! │  │
  │  └───────────────────┴────────┴──────────┴─────────────┘  │
  │                                                            │
  │  EXECUTION ORDER:                                          │
  │  next.config.js → Proxy → Render (SC/RH → Client)      │
  │                                                            │
  └────────────────────────────────────────────────────────────┘
```

---

## §2. redirect() và permanentRedirect()

```
  redirect() — TEMPORARY REDIRECT!
  ┌──────────────────────────────────────────────────────────┐
  │                                                          │
  │  import { redirect } from 'next/navigation'              │
  │                                                          │
  │  // Dùng trong: Server Component, Route Handler,        │
  │  //             Server Actions (Server Functions)        │
  │                                                          │
  │  'use server'                                            │
  │  export async function createPost(id: string) {          │
  │    try {                                                 │
  │      // Call database                                    │
  │    } catch (error) {                                     │
  │      // Handle errors                                    │
  │    }                                                     │
  │    revalidatePath('/posts')                              │
  │    redirect(`/post/${id}`)  // ← REDIRECT SAU MUTATION! │
  │  }                                                       │
  │                                                          │
  │  STATUS CODES:                                            │
  │  ┌────────────────────┬──────────────────────────────┐   │
  │  │ Context            │ Status Code                  │   │
  │  ├────────────────────┼──────────────────────────────┤   │
  │  │ Default            │ 307 (Temporary Redirect)     │   │
  │  │ Trong Server Action│ 303 (See Other)              │   │
  │  │                    │ → Standard sau POST request!│   │
  │  └────────────────────┴──────────────────────────────┘   │
  │                                                          │
  │  ⚠️ IMPORTANT RULES:                                    │
  │  ① redirect() THROWS error!                              │
  │     → Gọi NGOÀI try/catch block!                       │
  │                                                          │
  │     ❌ WRONG:                                             │
  │     try {                                                │
  │       redirect('/path')  // Error bị catch bởi catch!  │
  │     } catch(e) { }                                       │
  │                                                          │
  │     ✅ CORRECT:                                           │
  │     try { /* db */ } catch(e) { /* handle */ }           │
  │     redirect('/path')   // Ngoài try block!             │
  │                                                          │
  │  ② Client Components: CHỈDÙNG render time!             │
  │     → KHÔNG dùng trong event handlers!                  │
  │     → Dùng useRouter().push() thay thế!                │
  │                                                          │
  │  ③ Accepts absolute URLs → redirect tới external!      │
  │  ④ Before render? Dùng next.config.js hoặc Proxy!     │
  │                                                          │
  └──────────────────────────────────────────────────────────┘
```

```
  permanentRedirect() — PERMANENT REDIRECT!
  ┌──────────────────────────────────────────────────────────┐
  │                                                          │
  │  import { permanentRedirect } from 'next/navigation'     │
  │                                                          │
  │  'use server'                                            │
  │  export async function updateUsername(                    │
  │    username: string, formData: FormData                  │
  │  ) {                                                     │
  │    try { /* update DB */ }                               │
  │    catch (error) { /* handle */ }                        │
  │    revalidateTag('username')                             │
  │    permanentRedirect(`/profile/${username}`)             │
  │    // ← PERMANENT! Browser + search engines CACHE this! │
  │  }                                                       │
  │                                                          │
  │  → Returns 308 (Permanent Redirect)!                    │
  │  → Browser CACHES! Subsequent requests go directly!     │
  │  → Search engines UPDATE index!                          │
  │  → Use case: canonical URL changed!                      │
  │                                                          │
  │  redirect() vs permanentRedirect():                       │
  │  ┌───────────────────┬───────────┬──────────────────┐    │
  │  │                   │ redirect  │ permanentRedirect│    │
  │  ├───────────────────┼───────────┼──────────────────┤    │
  │  │ Status            │ 307 (303) │ 308              │    │
  │  │ Browser caches?   │ NO!       │ YES!             │    │
  │  │ SEO indexes?      │ Keeps old │ Updates to new!  │    │
  │  │ Use when          │ After     │ URL changed      │    │
  │  │                   │ mutation  │ permanently!      │    │
  │  │ Example           │ create    │ change username   │    │
  │  │                   │ post →   │ old → new       │    │
  │  │                   │ view post │ profile URL       │    │
  │  └───────────────────┴───────────┴──────────────────┘    │
  │                                                          │
  └──────────────────────────────────────────────────────────┘
```

---

## §3. useRouter() Hook — Client Side!

```
  useRouter() — CLIENT-SIDE REDIRECT!
  ┌──────────────────────────────────────────────────────────┐
  │                                                          │
  │  'use client'                                            │
  │  import { useRouter } from 'next/navigation'             │
  │                                                          │
  │  export default function Page() {                        │
  │    const router = useRouter()                            │
  │    return (                                              │
  │      <button onClick={() => router.push('/dashboard')}>  │
  │        Dashboard                                         │
  │      </button>                                           │
  │    )                                                     │
  │  }                                                       │
  │                                                          │
  │  KHI NÀO DÙNG:                                          │
  │  → Event handlers (onClick, onChange...)!                │
  │  → Client Components mà cần programmatic navigation!   │
  │  → Khi redirect() KHÔNG dùng được (event handlers!)    │
  │                                                          │
  │  ⚠️ TIP:                                                │
  │  Nếu KHÔNG cần programmatic navigation                  │
  │  → Dùng <Link> component! (auto prefetch!)             │
  │                                                          │
  │  router METHODS:                                          │
  │  ┌──────────────┬──────────────────────────────────┐     │
  │  │ Method       │ Action                           │     │
  │  ├──────────────┼──────────────────────────────────┤     │
  │  │ .push(url)   │ Navigate + add to history!       │     │
  │  │ .replace(url)│ Navigate + REPLACE history!      │     │
  │  │ .back()      │ Go back in history!              │     │
  │  │ .forward()   │ Go forward in history!           │     │
  │  │ .refresh()   │ Refresh current route!           │     │
  │  │ .prefetch()  │ Prefetch route for fast nav!     │     │
  │  └──────────────┴──────────────────────────────────┘     │
  │                                                          │
  └──────────────────────────────────────────────────────────┘
```

---

## §4. next.config.js redirects — Static Rules!

```
  next.config.js redirects — BUILD TIME RULES!
  ┌──────────────────────────────────────────────────────────┐
  │                                                          │
  │  // next.config.ts                                       │
  │  import type { NextConfig } from 'next'                  │
  │                                                          │
  │  const nextConfig: NextConfig = {                        │
  │    async redirects() {                                   │
  │      return [                                            │
  │        // Basic redirect                                 │
  │        {                                                 │
  │          source: '/about',                               │
  │          destination: '/',                               │
  │          permanent: true,     // 308!                    │
  │        },                                                │
  │        // Wildcard path matching                         │
  │        {                                                 │
  │          source: '/blog/:slug',                          │
  │          destination: '/news/:slug',                     │
  │          permanent: true,                                │
  │        },                                                │
  │      ]                                                   │
  │    },                                                    │
  │  }                                                       │
  │                                                          │
  │  SUPPORTS:                                                │
  │  → Path matching: /blog/:slug → /news/:slug!           │
  │  → Header matching: redirect based on request headers!  │
  │  → Cookie matching: redirect based on cookies!          │
  │  → Query matching: redirect based on query params!      │
  │                                                          │
  │  permanent: true  → 308 Permanent Redirect!              │
  │  permanent: false → 307 Temporary Redirect!              │
  │                                                          │
  │  ⚠️ LIMITS:                                              │
  │  → Vercel: max 1,024 redirects!                         │
  │  → 1000+? → Use Proxy + custom solution!               │
  │  → Runs BEFORE Proxy!                                   │
  │                                                          │
  │  EXECUTION ORDER:                                         │
  │  ┌──────────────┐     ┌──────────────┐     ┌─────────┐  │
  │  │ next.config.js│ ══►│ Proxy/       │ ══►│ Render  │  │
  │  │ redirects    │     │ Middleware   │     │ (SC/CC) │  │
  │  │ (FIRST!)     │     │ (SECOND!)    │     │ (THIRD!)│  │
  │  └──────────────┘     └──────────────┘     └─────────┘  │
  │                                                          │
  └──────────────────────────────────────────────────────────┘
```

---

## §5. NextResponse.redirect — Proxy/Middleware!

```
  NextResponse.redirect IN PROXY:
  ┌──────────────────────────────────────────────────────────┐
  │                                                          │
  │  // proxy.ts (middleware/proxy file)                     │
  │  import { NextResponse, NextRequest } from 'next/server' │
  │  import { authenticate } from 'auth-provider'            │
  │                                                          │
  │  export function proxy(request: NextRequest) {           │
  │    const isAuthenticated = authenticate(request)          │
  │                                                          │
  │    if (isAuthenticated) {                                │
  │      return NextResponse.next()  // Continue normally!   │
  │    }                                                     │
  │                                                          │
  │    // Redirect to login if not authenticated!            │
  │    return NextResponse.redirect(                         │
  │      new URL('/login', request.url)                      │
  │    )                                                     │
  │  }                                                       │
  │                                                          │
  │  export const config = {                                 │
  │    matcher: '/dashboard/:path*',                         │
  │  }                                                       │
  │                                                          │
  │  USE CASES:                                               │
  │  → Auth-based redirects (login/logout!)                 │
  │  → Geolocation-based redirects (country → locale!)      │
  │  → Feature flag redirects (A/B testing!)                │
  │  → Large-scale redirects (1000+!)                       │
  │                                                          │
  │  FLOW:                                                    │
  │  ┌─────────┐   ┌──────────┐   ┌──────────────────────┐  │
  │  │ User    │   │ Proxy    │   │ Outcome              │  │
  │  │ /dash   │──►│ Auth     │──►│ Authenticated?       │  │
  │  │ board   │   │ check    │   │ ✅ → NextResponse   │  │
  │  │         │   │          │   │       .next()        │  │
  │  │         │   │          │   │ ❌ → NextResponse   │  │
  │  │         │   │          │   │       .redirect(     │  │
  │  │         │   │          │   │       '/login')      │  │
  │  └─────────┘   └──────────┘   └──────────────────────┘  │
  │                                                          │
  └──────────────────────────────────────────────────────────┘
```

---

## §6. Managing Redirects At Scale — Bloom Filter!

```
  1000+ REDIRECTS → CUSTOM SOLUTION!
  ┌────────────────────────────────────────────────────────────┐
  │                                                            │
  │  VẤN ĐỀ:                                                 │
  │  next.config.js redirects giới hạn (Vercel = 1024)      │
  │  Reading large dataset EVERY request = SLOW + EXPENSIVE!  │
  │                                                            │
  │  SOLUTION: REDIRECT MAP + BLOOM FILTER!                    │
  │                                                            │
  │  ── Step 1: Redirect Map (DB/JSON) ──                     │
  │  {                                                         │
  │    "/old": { "destination": "/new", "permanent": true },   │
  │    "/blog/post-old": {                                     │
  │      "destination": "/blog/post-new", "permanent": true    │
  │    }                                                       │
  │  }                                                         │
  │  → Store in: Edge Config, Redis, JSON file, Database!    │
  │                                                            │
  │  ── Step 2: Bloom Filter Optimization ──                   │
  │                                                            │
  │  BLOOM FILTER = Cấu trúc dữ liệu xác suất!            │
  │  → "Có thể có" hoặc "CHẮC CHẮN không có"!            │
  │  → Size rất nhỏ! Lookup = O(1)!                        │
  │  → False positives có thể xảy ra (nhưng hiếm!)       │
  │  → False negatives KHÔNG BAO GIỜ xảy ra!               │
  │                                                            │
  │  2-TIER ARCHITECTURE:                                       │
  │  ┌──────────────────────────────────────────────────────┐  │
  │  │                                                      │  │
  │  │  TIER 1: PROXY (mỗi request!)                      │  │
  │  │  ┌─────────┐    ┌──────────────┐                     │  │
  │  │  │ Request │───►│ Bloom Filter │                     │  │
  │  │  │ /path   │    │ (tiny! fast!)│                     │  │
  │  │  └─────────┘    └──────┬───────┘                     │  │
  │  │                        │                              │  │
  │  │              ┌─────────┴─────────┐                    │  │
  │  │              ▼                   ▼                    │  │
  │  │        "MIGHT EXIST"      "DEFINITELY NOT"            │  │
  │  │              │                   │                    │  │
  │  │              ▼                   ▼                    │  │
  │  │        Go to TIER 2!     NextResponse.next()          │  │
  │  │        (check DB!)       (skip! no redirect!)         │  │
  │  │                                                      │  │
  │  │  TIER 2: ROUTE HANDLER (only when Bloom says yes!)   │  │
  │  │  ┌──────────────┐    ┌──────────────┐                 │  │
  │  │  │ /api/redirect│───►│ JSON/DB      │                 │  │
  │  │  │ ?pathname=   │    │ Lookup       │                 │  │
  │  │  │ /old-path    │    │ (exact!)     │                 │  │
  │  │  └──────────────┘    └──────┬───────┘                 │  │
  │  │                             │                          │  │
  │  │                   ┌─────────┴─────────┐                │  │
  │  │                   ▼                   ▼                │  │
  │  │             FOUND!              NOT FOUND!              │  │
  │  │             Redirect!           (false positive!)       │  │
  │  │             308/307             NextResponse.next()     │  │
  │  │                                                      │  │
  │  └──────────────────────────────────────────────────────┘  │
  │                                                            │
  │  PERFORMANCE:                                               │
  │  ┌──────────────────────┬──────────────────────────────┐   │
  │  │ Approach             │ Cost per request             │   │
  │  ├──────────────────────┼──────────────────────────────┤   │
  │  │ Read ALL redirects   │ O(n) 🐌 (read 10K entries!) │   │
  │  │ Bloom Filter first   │ O(1) ⚡ (tiny bit check!)  │   │
  │  │ DB lookup if needed  │ O(1) (only when bloom=yes!) │   │
  │  └──────────────────────┴──────────────────────────────┘   │
  │                                                            │
  └────────────────────────────────────────────────────────────┘
```

---

## §7. Tự Viết — RedirectEngine!

```javascript
var RedirectEngine = (function () {
  // ═══════════════════════════════════
  // 1. REDIRECT MAP (simulates DB)
  // ═══════════════════════════════════
  var redirectMap = {};

  function addRedirect(source, destination, permanent) {
    redirectMap[source] = {
      destination: destination,
      permanent: !!permanent,
    };
  }

  function removeRedirect(source) {
    delete redirectMap[source];
  }

  // ═══════════════════════════════════
  // 2. BLOOM FILTER (simplified)
  // ═══════════════════════════════════
  var BLOOM_SIZE = 256;
  var bloomBits = new Array(BLOOM_SIZE);
  for (var b = 0; b < BLOOM_SIZE; b++) bloomBits[b] = 0;

  function hash1(str) {
    var h = 0;
    for (var i = 0; i < str.length; i++) {
      h = (h * 31 + str.charCodeAt(i)) % BLOOM_SIZE;
    }
    return h;
  }

  function hash2(str) {
    var h = 0;
    for (var i = 0; i < str.length; i++) {
      h = (h * 37 + str.charCodeAt(i)) % BLOOM_SIZE;
    }
    return h;
  }

  function bloomAdd(path) {
    bloomBits[hash1(path)] = 1;
    bloomBits[hash2(path)] = 1;
  }

  function bloomMightContain(path) {
    return bloomBits[hash1(path)] === 1 && bloomBits[hash2(path)] === 1;
  }

  // Build bloom from redirect map
  function buildBloomFilter() {
    for (var b2 = 0; b2 < BLOOM_SIZE; b2++) bloomBits[b2] = 0;
    for (var source in redirectMap) {
      bloomAdd(source);
    }
  }

  // ═══════════════════════════════════
  // 3. REDIRECT RESOLVER (2-tier!)
  // ═══════════════════════════════════
  function resolve(pathname) {
    // Tier 1: Bloom filter check (O(1)!)
    var bloomResult = bloomMightContain(pathname);

    if (!bloomResult) {
      return {
        pathname: pathname,
        bloomCheck: false,
        dbLookup: false,
        action: "PASS (definitely no redirect!)",
        redirect: null,
      };
    }

    // Tier 2: Actual DB/JSON lookup
    var entry = redirectMap[pathname];

    if (entry) {
      var statusCode = entry.permanent ? 308 : 307;
      return {
        pathname: pathname,
        bloomCheck: true,
        dbLookup: true,
        action: "REDIRECT " + statusCode + " → " + entry.destination,
        redirect: {
          destination: entry.destination,
          statusCode: statusCode,
        },
      };
    }

    // False positive!
    return {
      pathname: pathname,
      bloomCheck: true,
      dbLookup: true,
      action: "PASS (bloom false positive!)",
      redirect: null,
    };
  }

  // ═══════════════════════════════════
  // 4. REDIRECT FUNCTION SIMULATOR
  // ═══════════════════════════════════
  function simulateRedirect(url, context) {
    context = context || "default";
    var statusCode;
    if (context === "server-action") statusCode = 303;
    else statusCode = 307;

    return {
      type: "redirect()",
      url: url,
      statusCode: statusCode,
      context: context,
      throwsError: true,
      note: "Call OUTSIDE try/catch!",
    };
  }

  function simulatePermanentRedirect(url) {
    return {
      type: "permanentRedirect()",
      url: url,
      statusCode: 308,
      browserCaches: true,
      seoUpdates: true,
    };
  }

  // ═══════════════════════════════════
  // 5. DEMO
  // ═══════════════════════════════════
  function demo() {
    console.log("╔════════════════════════════════════╗");
    console.log("║  REDIRECT ENGINE DEMO               ║");
    console.log("╚════════════════════════════════════╝");

    // Setup redirects
    addRedirect("/old-about", "/about", true);
    addRedirect("/blog/post-1", "/news/post-1", true);
    addRedirect("/legacy/docs", "/documentation", false);
    buildBloomFilter();

    // Test redirect functions
    console.log("\n── redirect() Simulator ──");
    var r1 = simulateRedirect("/post/123", "server-action");
    console.log(
      "  " +
        r1.type +
        " → " +
        r1.url +
        " (" +
        r1.statusCode +
        " " +
        r1.context +
        ")",
    );
    console.log("  ⚠️ " + r1.note);

    var r2 = simulatePermanentRedirect("/profile/newname");
    console.log("  " + r2.type + " → " + r2.url + " (" + r2.statusCode + ")");
    console.log("  Browser caches: " + r2.browserCaches);

    // Test Bloom Filter resolver
    console.log("\n── Bloom Filter Resolver ──");
    var paths = [
      "/old-about", // exists!
      "/blog/post-1", // exists!
      "/random/page", // doesn't exist!
      "/legacy/docs", // exists!
    ];

    for (var i = 0; i < paths.length; i++) {
      var result = resolve(paths[i]);
      console.log("  " + result.pathname + ":");
      console.log(
        "    Bloom: " + (result.bloomCheck ? "MIGHT EXIST" : "NOT FOUND"),
      );
      console.log("    Action: " + result.action);
    }

    // Stats
    console.log("\n── Stats ──");
    var totalRedirects = Object.keys(redirectMap).length;
    console.log("  Redirects: " + totalRedirects);
    console.log("  Bloom size: " + BLOOM_SIZE + " bits");
    console.log(
      "  Bloom usage: " +
        bloomBits.filter(function (b) {
          return b === 1;
        }).length +
        "/" +
        BLOOM_SIZE +
        " bits set",
    );
  }

  return { demo: demo };
})();
// Chạy: RedirectEngine.demo();
```

---

## §8. Câu Hỏi Luyện Tập!

**Câu 1**: 5 redirect methods — khi nào dùng cái nào?

<details><summary>Đáp án</summary>

| Method                      | Khi nào dùng?                                                     | Status             | Where  |
| --------------------------- | ----------------------------------------------------------------- | ------------------ | ------ |
| **`redirect()`**            | Sau mutation (create/update) trong Server Component/Server Action | 307 (303 trong SA) | Server |
| **`permanentRedirect()`**   | URL thay đổi vĩnh viễn (username change)                          | 308                | Server |
| **`useRouter().push()`**    | Event handlers (onClick) trong Client Component                   | — (client-side)    | Client |
| **`next.config.js`**        | Known URL changes, static redirect rules                          | 307/308            | Config |
| **`NextResponse.redirect`** | Conditional (auth, geo, A/B), large-scale (1000+)                 | 307/308            | Proxy  |

**Execution order**: `next.config.js` → Proxy → Render (server → client)

</details>

---

**Câu 2**: redirect() throws error — tại sao gọi ngoài try/catch?

<details><summary>Đáp án</summary>

`redirect()` internally **throws một error đặc biệt** (NEXT_REDIRECT). Next.js catch error này ở higher level để thực hiện redirect.

```
❌ WRONG:
try {
  await db.createPost(data)
  redirect('/posts')  // Error bị catch → redirect KHÔNG hoạt động!
} catch (e) {
  // NEXT_REDIRECT error bị catch ở đây! 💥
}

✅ CORRECT:
try {
  await db.createPost(data)
} catch (e) {
  // Handle DB errors only!
}
redirect('/posts')  // Ngoài try → Next.js catches NEXT_REDIRECT! ✅
```

**Tương tự**: `permanentRedirect()` cũng throws error!

</details>

---

**Câu 3**: 307 vs 308 — khác gì? Ảnh hưởng SEO thế nào?

<details><summary>Đáp án</summary>

|                     | 307 Temporary                         | 308 Permanent                          |
| ------------------- | ------------------------------------- | -------------------------------------- |
| **Browser caches?** | KHÔNG! Mỗi lần vẫn tới server         | CÓ! Lần sau browser redirect trực tiếp |
| **SEO**             | Search engine GIỮ old URL trong index | Search engine CẬP NHẬT sang new URL    |
| **HTTP method**     | GIỮ method (POST→POST)                | GIỮ method (POST→POST)                 |
| **Use case**        | Tạm thời: maintenance, A/B test       | Vĩnh viễn: URL renamed, domain change  |

**So với 301/302**: 307/308 GIỮ HTTP method (POST vẫn là POST), còn 301/302 có thể đổi thành GET!

</details>

---

**Câu 4**: Bloom Filter — tại sao dùng cho redirect at scale?

<details><summary>Đáp án</summary>

**Vấn đề**: 10,000 redirects → đọc TẤT CẢ mỗi request = O(n) = SLOW!

**Bloom Filter giải quyết**:

```
Bloom Filter = cấu trúc xác suất:
→ Size CỰC NHỎ (vài KB cho 10K entries!)
→ Lookup = O(1) INSTANT!
→ "DEFINITELY NOT" = 100% chính xác (no false negatives!)
→ "MIGHT EXIST" = có thể false positive (nhưng hiếm!)

2-tier flow:
Request → Bloom check O(1)
  → NOT FOUND → PASS! (skip DB!) ⚡
  → MIGHT EXIST → DB lookup O(1)
    → FOUND → Redirect 308!
    → NOT FOUND → False positive, PASS!

Result: 99% requests skip DB entirely!
Only ~1% false positives cần DB lookup!
```

</details>
