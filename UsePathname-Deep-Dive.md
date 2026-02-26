# usePathname() — Deep Dive!

> **Nguồn**: https://nextjs.org/docs/app/api-reference/functions/use-pathname
> **Ngôn ngữ**: Tiếng Việt — giải thích cực kỳ chi tiết!
> **Trang này KHÔNG có hình/diagram** — chỉ có text + code blocks!
> **import**: `next/navigation`
> **Since**: Next.js v13.0.0!

---

## §1. usePathname() Là Gì?

```
  usePathname() — TỔNG QUAN:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  WHAT:                                                        │
  │  → Client Component hook! ★                                  │
  │  → Đọc PATHNAME hiện tại từ URL! ★                          │
  │  → import { usePathname } from 'next/navigation'! ★         │
  │  → CHỈ pathname! KHÔNG bao gồm query string! ★★★           │
  │                                                              │
  │  VÍ DỤ NHANH:                                                 │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │                                                       │    │
  │  │  ┌──────────────────────┬──────────────────────┐      │    │
  │  │  │ URL                   │ usePathname()         │      │    │
  │  │  ├──────────────────────┼──────────────────────┤      │    │
  │  │  │ /                     │ '/'                   │      │    │
  │  │  │ /dashboard            │ '/dashboard'          │      │    │
  │  │  │ /dashboard?v=2        │ '/dashboard' ★★★      │      │    │
  │  │  │ /blog/hello-world     │ '/blog/hello-world'   │      │    │
  │  │  └──────────────────────┴──────────────────────┘      │    │
  │  │                                                       │    │
  │  │  → /dashboard?v=2 → trả '/dashboard'! ★★★            │    │
  │  │  → Query string v=2 KHÔNG có! ★                      │    │
  │  │  → Muốn query → dùng useSearchParams()! ★            │    │
  │  │                                                       │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  TẠI SAO CLIENT COMPONENT?                                    │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │                                                       │    │
  │  │  ① "use client" là intentional design! ★               │    │
  │  │  ② Client Components = INTEGRAL part! ★                │    │
  │  │     (Không phải de-optimization!)                      │    │
  │  │  ③ Initial page load → render HTML trên server! ★     │    │
  │  │  ④ Navigate sang route mới → KHÔNG re-fetch! ★        │    │
  │  │     Component download 1 lần → re-render client! ★    │    │
  │  │  ⑤ Server Component KHÔNG đọc URL! ★★★                │    │
  │  │     → Design để preserve layout state! ★               │    │
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
  │  const pathname = usePathname()                              │
  │                                                              │
  │  PARAMETERS: KHÔNG CÓ! ★                                    │
  │                                                              │
  │  RETURNS: string — pathname hiện tại! ★                     │
  │                                                              │
  │  ┌──────────────────────┬──────────────────────┐             │
  │  │ URL                   │ Return value           │             │
  │  ├──────────────────────┼──────────────────────┤             │
  │  │ /                     │ '/'                   │             │
  │  │ /dashboard            │ '/dashboard'          │             │
  │  │ /dashboard?v=2        │ '/dashboard'          │             │
  │  │ /blog/hello-world     │ '/blog/hello-world'   │             │
  │  └──────────────────────┴──────────────────────┘             │
  │                                                              │
  │  SPECIAL CASES:                                               │
  │  → Pages Router + chưa ready → null! ★                     │
  │  → Fallback routes → null! ★                                │
  │  → app + pages cùng tồn tại → Next.js tự adjust type! ★   │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```

---

## §3. Good to Know — Caveats!

```
  CAVEATS:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  ① Server Component KHÔNG đọc URL! ★★★                      │
  │  → Intentional design! ★                                     │
  │  → Support layout state preservation! ★                     │
  │  → Navigate giữa pages → layout KHÔNG re-render! ★         │
  │                                                              │
  │  ② cacheComponents + dynamic params → cần Suspense! ★       │
  │  → Khi bật cacheComponents config! ★                        │
  │  → Route có dynamic param → Suspense boundary! ★            │
  │  → generateStaticParams → Suspense optional! ★             │
  │                                                              │
  │  ③ Rewrites → Hydration Mismatch! ★★★                       │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │                                                       │    │
  │  │  PROBLEM:                                               │    │
  │  │  → Static pre-render + rewrites in next.config! ★     │    │
  │  │  → Server pathname ≠ browser pathname! ★★★             │    │
  │  │  → usePathname() reads rewritten path on client! ★    │    │
  │  │  → HYDRATION MISMATCH! ★★★                            │    │
  │  │                                                       │    │
  │  │  VÍ DỤ:                                                │    │
  │  │  → Server render: pathname = '/original'               │    │
  │  │  → Client hydrate: pathname = '/rewritten'             │    │
  │  │  → MISMATCH! React complains! ★★★                     │    │
  │  │                                                       │    │
  │  │  GIẢI PHÁP:                                             │    │
  │  │  → Render STABLE fallback trên server! ★                │    │
  │  │  → Update pathname SAU mount (useEffect)! ★            │    │
  │  │  → Chỉ phần NHỎ depend on pathname! ★                 │    │
  │  │                                                       │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  ④ Pages Router → usePathname có thể trả null! ★            │
  │  → Router chưa initialized! ★                               │
  │  → Fallback routes! ★                                       │
  │  → Automatic Static Optimization! ★                        │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```

---

## §4. Examples Chi Tiết!

```
  EXAMPLE 1: Respond to Route Change!
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  USE CASE: Track page views, analytics, side effects! ★     │
  │                                                              │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ 'use client'                                          │    │
  │  │                                                       │    │
  │  │ import { useEffect } from 'react'                     │    │
  │  │ import { usePathname, useSearchParams }                │    │
  │  │   from 'next/navigation'                               │    │
  │  │                                                       │    │
  │  │ function ExampleClientComponent() {                    │    │
  │  │   const pathname = usePathname()                      │    │
  │  │   const searchParams = useSearchParams()              │    │
  │  │                                                       │    │
  │  │   useEffect(() => {                                    │    │
  │  │     // Do something on route change! ★                 │    │
  │  │     // Analytics, logging, etc.                        │    │
  │  │   }, [pathname, searchParams])                         │    │
  │  │                                                       │    │
  │  │   // pathname + searchParams trong deps! ★             │    │
  │  │   // → Effect chạy lại khi route change! ★            │    │
  │  │ }                                                      │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘

  EXAMPLE 2: Avoid Hydration Mismatch với Rewrites!
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  PROBLEM: server pathname ≠ client pathname! ★★★            │
  │  SOLUTION: useEffect + useState! ★                          │
  │                                                              │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ 'use client'                                          │    │
  │  │                                                       │    │
  │  │ import { useEffect, useState } from 'react'           │    │
  │  │ import { usePathname } from 'next/navigation'         │    │
  │  │                                                       │    │
  │  │ export default function PathnameBadge() {              │    │
  │  │   const pathname = usePathname()                      │    │
  │  │   const [clientPathname, setClientPathname]            │    │
  │  │     = useState('')  ← STABLE fallback! ★              │    │
  │  │                                                       │    │
  │  │   useEffect(() => {                                    │    │
  │  │     setClientPathname(pathname)                        │    │
  │  │     // ← Update SAU mount! ★                          │    │
  │  │   }, [pathname])                                       │    │
  │  │                                                       │    │
  │  │   return (                                             │    │
  │  │     <p>                                                │    │
  │  │       Current pathname:                                │    │
  │  │       <span>{clientPathname}</span>                    │    │
  │  │       {/* Server: '' → Client: '/actual' */}          │    │
  │  │       {/* ← NO mismatch! ★★★ */}                     │    │
  │  │     </p>                                               │    │
  │  │   )                                                    │    │
  │  │ }                                                      │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  FLOW:                                                        │
  │  ① Server render: clientPathname = '' (stable!) ★           │
  │  ② Client hydrate: clientPathname = '' (match!) ✅          │
  │  ③ useEffect runs: setClientPathname('/actual') ★           │
  │  ④ Re-render: hiển thị '/actual'! ★                        │
  │  → NO hydration mismatch! ★★★                               │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```

---

## §5. usePathname vs useParams vs useSearchParams!

```
  SO SÁNH 3 URL HOOKS:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  URL: /shop/shoes/nike?color=red&size=10                     │
  │                                                              │
  │  ┌───────────────────┬───────────────────────┬────────────┐  │
  │  │ Hook               │ Returns                │ From URL    │  │
  │  ├───────────────────┼───────────────────────┼────────────┤  │
  │  │ usePathname()      │ '/shop/shoes/nike'    │ pathname   │  │
  │  │                    │ ← string! ★            │ ONLY! ★    │  │
  │  ├───────────────────┼───────────────────────┼────────────┤  │
  │  │ useParams()        │ { tag: 'shoes',       │ dynamic    │  │
  │  │                    │   item: 'nike' }       │ segments!★ │  │
  │  ├───────────────────┼───────────────────────┼────────────┤  │
  │  │ useSearchParams()  │ URLSearchParams       │ query      │  │
  │  │                    │ color=red&size=10     │ string! ★  │  │
  │  └───────────────────┴───────────────────────┴────────────┘  │
  │                                                              │
  │  PHÂN TÍCH URL:                                               │
  │  /shop/shoes/nike?color=red&size=10                          │
  │  ├──────────────┤                                             │
  │  │  pathname     │                                             │
  │  │  usePathname()│                                             │
  │  │              ├────────────┤                                │
  │  │              │  params     │                                │
  │  │              │  useParams()│                                │
  │  │                           ├──────────────┤                 │
  │  │                           │  search       │                 │
  │  │                           │useSearchParams│                 │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```

---

## §6. Tự Viết — UsePathnameEngine!

```javascript
var UsePathnameEngine = (function () {
  // ═══════════════════════════════════
  // 1. URL PARSER
  // ═══════════════════════════════════
  function parseUrl(url) {
    var qIndex = url.indexOf("?");
    var hashIndex = url.indexOf("#");

    var pathname = url;
    var search = "";
    var hash = "";

    if (hashIndex >= 0) {
      hash = url.substring(hashIndex);
      pathname = url.substring(0, hashIndex);
    }
    if (qIndex >= 0 && (hashIndex < 0 || qIndex < hashIndex)) {
      search = url.substring(qIndex, hashIndex >= 0 ? hashIndex : undefined);
      pathname = url.substring(0, qIndex);
    }

    return { pathname: pathname, search: search, hash: hash };
  }

  // ═══════════════════════════════════
  // 2. usePathname SIMULATOR
  // ═══════════════════════════════════
  function usePathname(url, context) {
    if (context === "server-component") {
      return {
        error: "Server Component KHÔNG đọc URL! ★★★",
        reason: "Design để preserve layout state! ★",
      };
    }

    if (context === "pages-router-fallback") {
      return { pathname: null, note: "Pages Router fallback → null! ★" };
    }

    var parsed = parseUrl(url);
    return {
      pathname: parsed.pathname,
      note: "CHỈ pathname! Không có query string! ★",
      fullParsed: parsed,
    };
  }

  // ═══════════════════════════════════
  // 3. HYDRATION MISMATCH SIMULATOR
  // ═══════════════════════════════════
  function simulateHydration(serverUrl, clientUrl, usesSafePattern) {
    var serverPathname = parseUrl(serverUrl).pathname;
    var clientPathname = parseUrl(clientUrl).pathname;

    if (serverPathname === clientPathname) {
      return { mismatch: false, note: "Same pathname! No issue! ✅" };
    }

    if (usesSafePattern) {
      return {
        mismatch: false,
        note: "Safe pattern! useState('') + useEffect! ★",
        serverRender: "",
        clientUpdate: clientPathname,
      };
    }

    return {
      mismatch: true,
      error: "HYDRATION MISMATCH! ★★★",
      serverPathname: serverPathname,
      clientPathname: clientPathname,
      fix: "Dùng useState('') + useEffect(setPathname)! ★",
    };
  }

  // ═══════════════════════════════════
  // 4. 3 HOOKS COMPARISON
  // ═══════════════════════════════════
  function compareHooks(url, routePattern) {
    var parsed = parseUrl(url);

    // Extract params (simplified)
    var params = {};
    var routeParts = routePattern.split("/").filter(Boolean);
    var urlParts = parsed.pathname.split("/").filter(Boolean);
    for (var i = 0; i < routeParts.length; i++) {
      if (routeParts[i].charAt(0) === "[") {
        var name = routeParts[i].replace(/[\[\]\.]/g, "");
        params[name] = urlParts[i];
      }
    }

    return {
      usePathname: parsed.pathname,
      useParams: params,
      useSearchParams: parsed.search.replace("?", ""),
    };
  }

  // ═══════════════════════════════════
  // 5. DEMO
  // ═══════════════════════════════════
  function demo() {
    console.log("═══ UsePathname Engine ═══");

    console.log("\n── 1. Parse URL ──");
    console.log(parseUrl("/dashboard?v=2"));
    console.log(parseUrl("/blog/hello-world"));
    console.log(parseUrl("/shop?color=red&size=10#section"));

    console.log("\n── 2. usePathname ──");
    console.log(usePathname("/dashboard?v=2", "client-component"));
    console.log(usePathname("/", "server-component"));
    console.log(usePathname("/", "pages-router-fallback"));

    console.log("\n── 3. Hydration ──");
    console.log(simulateHydration("/original", "/rewritten", false));
    console.log(simulateHydration("/original", "/rewritten", true));
    console.log(simulateHydration("/dashboard", "/dashboard", false));

    console.log("\n── 4. 3 Hooks ──");
    console.log(
      compareHooks("/shop/shoes/nike?color=red", "/shop/[tag]/[item]"),
    );
  }

  return { demo: demo };
})();
// Chạy: UsePathnameEngine.demo();
```

---

## §7. Câu Hỏi Phỏng Vấn!

```
  CÂU HỎI:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  ❓ 1: usePathname trả gì cho /dashboard?v=2?                  │
  │  → '/dashboard'! ★ CHỈ pathname! ★★★                        │
  │  → Query string ?v=2 KHÔNG bao gồm! ★                     │
  │  → Muốn query → useSearchParams()! ★                       │
  │                                                              │
  │  ❓ 2: Tại sao usePathname là Client Component only?           │
  │  → Server Component KHÔNG đọc URL! ★                        │
  │  → Intentional design! ★                                    │
  │  → Preserve layout state khi navigate! ★                    │
  │  → Layout không re-render khi page change! ★                │
  │                                                              │
  │  ❓ 3: Hydration mismatch với rewrites — fix thế nào?          │
  │  → Server pathname ≠ client pathname! ★★★                   │
  │  → FIX: useState('') → stable fallback! ★                  │
  │  → useEffect → setPathname(actual)! ★                      │
  │  → Server = '' → client = '' → NO mismatch! ★              │
  │  → After mount → update to actual pathname! ★              │
  │                                                              │
  │  ❓ 4: usePathname vs useParams vs useSearchParams?            │
  │  → usePathname: '/shop/shoes/nike' (full path!) ★           │
  │  → useParams: { tag: 'shoes', item: 'nike' } (segments!) ★│
  │  → useSearchParams: 'color=red' (query!) ★                 │
  │  → 3 hooks → 3 phần khác nhau của URL! ★                   │
  │                                                              │
  │  ❓ 5: usePathname trong Pages Router?                         │
  │  → Có thể trả null! ★                                       │
  │  → Router chưa initialized! ★                               │
  │  → Fallback routes, Static Optimization! ★                 │
  │  → App Router → luôn string! ★                              │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```
