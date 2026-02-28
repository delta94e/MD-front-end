# typedRoutes — Deep Dive!

> **Nguồn**: https://nextjs.org/docs/app/api-reference/config/next-config-js/typedRoutes
> **Ngôn ngữ**: Tiếng Việt — giải thích cực kỳ chi tiết!
> **Trang này KHÔNG có hình/diagram** — chỉ có text + code blocks!

---

## §1. typedRoutes Là Gì?

```
  typedRoutes — TỔNG QUAN:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  WHAT:                                                        │
  │  → Statically typed links cho Next.js! ★★★                │
  │  → TypeScript kiểm tra href ĐÚNG route! ★★★              │
  │  → Typo "/aboot" → TS ERROR ngay lập tức! ★★★           │
  │  → Stable (không cần experimental nữa)! ★                 │
  │                                                              │
  │  CONFIG:                                                      │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │  const nextConfig = {                                  │    │
  │  │    typedRoutes: true  ★★★                              │    │
  │  │  }                                                     │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  HOW IT WORKS:                                                │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │                                                       │    │
  │  │  next dev / next build                                 │    │
  │  │       ↓                                                │    │
  │  │  Scan ALL routes in app/                               │    │
  │  │       ↓                                                │    │
  │  │  Generate .next/types/*.d.ts ★★★                      │    │
  │  │  (all valid routes as href type)                       │    │
  │  │       ↓                                                │    │
  │  │  tsconfig.json includes .next/types/**/*.ts            │    │
  │  │       ↓                                                │    │
  │  │  TypeScript checks <Link href="..."> ★★★             │    │
  │  │       ↓                                                │    │
  │  │  Valid route? ✅ OK!                                    │    │
  │  │  Invalid route? ❌ TS Error! ★★★                      │    │
  │  │                                                       │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  SUPPORTS:                                                    │
  │  → <Link href="..."> (Pages + App Router)! ★★★            │
  │  → router.push(), replace(), prefetch() (App Router)! ★  │
  │  → ❌ KHÔNG type next/router (Pages Router)! ★             │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```

---

## §2. Usage Patterns!

```
  USAGE:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  LITERAL STRINGS (auto validated):                            │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │  <Link href="/about" />         ✅ OK! ★★★            │    │
  │  │  <Link href="/aboot" />         ❌ TS Error! ★★★      │    │
  │  │  router.push('/about')          ✅ OK! ★               │    │
  │  │  router.push('/contact')        ✅ OK! ★               │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  TEMPLATE LITERALS (auto validated):                          │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │  <Link href={`/blog/${slug}`} />  ✅ OK! ★★★          │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  NON-LITERAL (needs cast):                                    │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │  import type { Route } from 'next'                     │    │
  │  │  <Link href={('/blog/' + slug) as Route} /> ★★★      │    │
  │  │  router.push(('/blog/' + slug) as Route) ★            │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  CUSTOM COMPONENT:                                            │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │  import type { Route } from 'next'                     │    │
  │  │  function Card<T extends string>(                      │    │
  │  │    { href }: { href: Route<T> | URL }  ★★★            │    │
  │  │  ) { return <Link href={href}>...</Link> }            │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  NAV DATA STRUCTURE:                                          │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │  type NavItem<T extends string = string> = {           │    │
  │  │    href: T; label: string                              │    │
  │  │  }                                                     │    │
  │  │  const navItems: NavItem<Route>[] = [                  │    │
  │  │    { href: '/', label: 'Home' },        ★★★          │    │
  │  │    { href: '/about', label: 'About' },                │    │
  │  │    { href: '/blog', label: 'Blog' },                  │    │
  │  │  ]                                                     │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  tsconfig.json (REQUIRED):                                    │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │  {                                                     │    │
  │  │    "include": [                                        │    │
  │  │      "next-env.d.ts",                                 │    │
  │  │      ".next/types/**/*.ts",  ★★★ (phải có!)          │    │
  │  │      "**/*.ts",                                        │    │
  │  │      "**/*.tsx"                                        │    │
  │  │    ]                                                   │    │
  │  │  }                                                     │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```

---

## §3. Tự Viết — TypedRoutesEngine!

```javascript
var TypedRoutesEngine = (function () {
  // ═══════════════════════════════════
  // 1. ROUTE SCANNER (simulate next dev/build)
  // ═══════════════════════════════════
  function scanRoutes(appDir) {
    // Simulate scanning app/ directory for routes
    var routes = [];
    for (var i = 0; i < appDir.length; i++) {
      var file = appDir[i];
      if (file.type === "page") {
        routes.push(file.route);
      }
    }
    return routes;
  }

  // ═══════════════════════════════════
  // 2. TYPE GENERATOR (.d.ts)
  // ═══════════════════════════════════
  function generateTypes(routes) {
    var union = routes
      .map(function (r) {
        return "'" + r + "'";
      })
      .join(" | ");
    return {
      file: ".next/types/link.d.ts",
      content: "type Route = " + union + ";",
      routes: routes,
    };
  }

  // ═══════════════════════════════════
  // 3. LINK VALIDATOR
  // ═══════════════════════════════════
  function validateHref(href, validRoutes) {
    // Literal string check
    if (typeof href === "string") {
      // Check exact match or dynamic pattern
      for (var i = 0; i < validRoutes.length; i++) {
        var route = validRoutes[i];
        if (href === route) {
          return { href: href, valid: true, note: "✅ Valid route! ★★★" };
        }
        // Simple dynamic segment match
        if (route.indexOf("[") >= 0) {
          var pattern = route.replace(/\[(\w+)\]/g, "[^/]+");
          if (new RegExp("^" + pattern + "$").test(href)) {
            return { href: href, valid: true, note: "✅ Dynamic match! ★" };
          }
        }
      }
      return {
        href: href,
        valid: false,
        note: "❌ TS Error! Route not found! ★★★",
      };
    }
    return {
      href: href,
      valid: null,
      note: "⚠️ Non-literal: needs 'as Route' cast! ★",
    };
  }

  // ═══════════════════════════════════
  // 4. DEMO
  // ═══════════════════════════════════
  function demo() {
    console.log("═══ TypedRoutes Engine ═══");

    var appDir = [
      { route: "/", type: "page" },
      { route: "/about", type: "page" },
      { route: "/blog", type: "page" },
      { route: "/blog/[slug]", type: "page" },
      { route: "/contact", type: "page" },
    ];

    console.log("\n── 1. Scan Routes ──");
    var routes = scanRoutes(appDir);
    console.log(routes);

    console.log("\n── 2. Generate Types ──");
    console.log(generateTypes(routes));

    console.log("\n── 3. Validate Hrefs ──");
    console.log(validateHref("/about", routes));
    console.log(validateHref("/aboot", routes));
    console.log(validateHref("/blog/hello", routes));
    console.log(validateHref("/unknown", routes));
  }

  return { demo: demo };
})();
// Chạy: TypedRoutesEngine.demo();
```

---

## §4. Câu Hỏi Phỏng Vấn!

```
  CÂU HỎI:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  ❓ 1: typedRoutes dùng làm gì?                               │
  │  → Statically typed <Link href>! ★★★                     │
  │  → TS kiểm tra route hợp lệ tại compile-time! ★★★       │
  │  → Typo → TS Error ngay! ★                                │
  │                                                              │
  │  ❓ 2: How it works?                                           │
  │  → next dev/build scan routes! ★                          │
  │  → Generate .next/types/*.d.ts! ★★★                      │
  │  → tsconfig.json include types! ★                         │
  │  → TS validates href! ★★★                                │
  │                                                              │
  │  ❓ 3: Non-literal strings?                                    │
  │  → Cần cast: as Route! ★★★                               │
  │  → import type { Route } from 'next'! ★                  │
  │                                                              │
  │  ❓ 4: Custom component nhận href?                             │
  │  → Generic: <T extends string>! ★                        │
  │  → Props: { href: Route<T> | URL }! ★★★                 │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```
