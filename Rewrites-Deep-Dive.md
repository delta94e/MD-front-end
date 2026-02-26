# rewrites — Deep Dive!

> **Nguồn**: https://nextjs.org/docs/app/api-reference/config/next-config-js/rewrites
> **Ngôn ngữ**: Tiếng Việt — giải thích cực kỳ chi tiết!
> **Trang này KHÔNG có hình/diagram** — chỉ có text + code blocks!

---

## §1. rewrites Là Gì? — URL Proxy!

```
  rewrites — TỔNG QUAN:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  WHAT:                                                        │
  │  → Map incoming path → destination path! ★★★               │
  │  → URL PROXY: URL KHÔNG thay đổi trên browser! ★★★       │
  │  → User thấy /about nhưng server serve /! ★★★            │
  │  → Áp dụng cả client-side routing (<Link>)! ★             │
  │                                                              │
  │  REDIRECT vs REWRITE:                                         │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │                                                       │    │
  │  │  REDIRECT:                                             │    │
  │  │  /old-page → 307/308 → /new-page                     │    │
  │  │  URL THAY ĐỔI trên browser! ★★★                     │    │
  │  │                                                       │    │
  │  │  REWRITE:                                              │    │
  │  │  /about → serve content from / ★★★                   │    │
  │  │  URL GIỮ NGUYÊN /about trên browser! ★★★            │    │
  │  │  → "URL proxy" / "URL masking" ★                     │    │
  │  │                                                       │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  CONFIG:                                                      │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │  module.exports = {                                   │    │
  │  │    async rewrites() {                                  │    │
  │  │      return [                                          │    │
  │  │        { source: '/about', destination: '/' } ★★★    │    │
  │  │      ]                                                 │    │
  │  │    }                                                   │    │
  │  │  }                                                     │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```

---

## §2. 3 Phases — beforeFiles / afterFiles / fallback!

```
  3 PHASES:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  THỨ TỰ ROUTING CỦA NEXT.JS:                                  │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │  1. headers ← checked/applied                         │    │
  │  │  2. redirects ← checked/applied                       │    │
  │  │  3. proxy                                              │    │
  │  │  4. beforeFiles rewrites ← ★★★ TRƯỚC files!         │    │
  │  │  5. public/, _next/static, non-dynamic pages          │    │
  │  │  6. afterFiles rewrites ← ★ SAU files!               │    │
  │  │  7. fallback rewrites ← ★ CUỐI CÙNG!                │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  CONFIG:                                                      │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │  async rewrites() {                                    │    │
  │  │    return {                                            │    │
  │  │      beforeFiles: [                                    │    │
  │  │        // Trước files! Override page files! ★★★      │    │
  │  │        { source: '/page', destination: '/other',       │    │
  │  │          has: [{ type: 'query', key: 'override' }] }  │    │
  │  │      ],                                                │    │
  │  │      afterFiles: [                                     │    │
  │  │        // Sau pages/public, trước dynamic routes! ★   │    │
  │  │        { source: '/non-existent',                      │    │
  │  │          destination: '/somewhere-else' }              │    │
  │  │      ],                                                │    │
  │  │      fallback: [                                       │    │
  │  │        // Cuối cùng! Proxy to old site! ★★★          │    │
  │  │        { source: '/:path*',                            │    │
  │  │          destination: 'https://old-site.com/:path*' } │    │
  │  │      ]                                                 │    │
  │  │    }                                                   │    │
  │  │  }                                                     │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```

---

## §3. Params + External URL + Incremental Adoption!

```
  PARAMS & EXTERNAL:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  PARAMS BEHAVIOR:                                             │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │  // Params NOT used → auto pass in query! ★★★        │    │
  │  │  source: '/old/:path*', destination: '/about'         │    │
  │  │  → /old/a/b → /about?path=a/b ★                     │    │
  │  │                                                       │    │
  │  │  // Params USED → NOT auto pass! ★                    │    │
  │  │  source: '/docs/:path*', destination: '/:path*'       │    │
  │  │  → /docs/a/b → /a/b (no query) ★                    │    │
  │  │                                                       │    │
  │  │  // Manual pass:                                       │    │
  │  │  source: '/:first/:second',                            │    │
  │  │  destination: '/:first?second=:second' ★★★           │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  EXTERNAL URL (incremental adoption):                         │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │  // Proxy to external site! ★★★                       │    │
  │  │  source: '/blog/:slug',                                │    │
  │  │  destination: 'https://example.com/blog/:slug'        │    │
  │  │                                                       │    │
  │  │  // Incremental migration: fallback to old site!       │    │
  │  │  fallback: [{                                          │    │
  │  │    source: '/:path*',                                  │    │
  │  │    destination: 'https://old-site.com/:path*' ★★★    │    │
  │  │  }]                                                    │    │
  │  │  → Migrate page by page! ★                           │    │
  │  │  → No config change needed! ★★★                      │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  basePath:                                                    │
  │  → Auto-prefix source + destination! ★                    │
  │  → basePath: false to skip (external only)! ★             │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```

---

## §4. Tự Viết — RewritesEngine!

```javascript
var RewritesEngine = (function () {
  // ═══════════════════════════════════
  // 1. PATH MATCHER
  // ═══════════════════════════════════
  function matchPath(pattern, path) {
    var regex = pattern
      .replace(/:(\w+)\*/g, "(?<$1>.*)")
      .replace(/:(\w+)\?/g, "(?<$1>[^/]*)")
      .replace(/:(\w+)/g, "(?<$1>[^/]+)");
    var match = path.match(new RegExp("^" + regex + "$"));
    return match ? match.groups || {} : null;
  }

  // ═══════════════════════════════════
  // 2. PARAM RESOLVER
  // ═══════════════════════════════════
  function resolveDestination(destination, params) {
    var result = destination;
    var usedParams = {};

    for (var key in params) {
      if (destination.indexOf(":" + key) >= 0) {
        result = result.replace(":" + key, params[key]);
        usedParams[key] = true;
      }
    }

    // Unused params → query string
    var query = [];
    for (var k in params) {
      if (!usedParams[k] && params[k]) {
        query.push(k + "=" + encodeURIComponent(params[k]));
      }
    }

    if (query.length > 0) {
      result += (result.indexOf("?") >= 0 ? "&" : "?") + query.join("&");
    }

    return result;
  }

  // ═══════════════════════════════════
  // 3. REWRITE RESOLVER (3 phases)
  // ═══════════════════════════════════
  function resolve(config, requestPath, staticFiles) {
    var phases = ["beforeFiles", "afterFiles", "fallback"];
    staticFiles = staticFiles || [];

    for (var p = 0; p < phases.length; p++) {
      var phase = phases[p];
      var rules = config[phase] || [];

      // Check static files between phases
      if (phase === "afterFiles" || phase === "fallback") {
        if (staticFiles.indexOf(requestPath) >= 0) {
          return { served: requestPath, phase: "static", rewritten: false };
        }
      }

      for (var i = 0; i < rules.length; i++) {
        var params = matchPath(rules[i].source, requestPath);
        if (params) {
          var dest = resolveDestination(rules[i].destination, params);
          return {
            original: requestPath,
            destination: dest,
            phase: phase,
            rewritten: true,
            urlUnchanged: true,
            note: "URL stays " + requestPath + " but serves " + dest + " ★★★",
          };
        }
      }
    }

    return { served: requestPath, rewritten: false };
  }

  // ═══════════════════════════════════
  // 4. DEMO
  // ═══════════════════════════════════
  function demo() {
    console.log("═══ Rewrites Engine ═══");

    var config = {
      beforeFiles: [{ source: "/override", destination: "/special" }],
      afterFiles: [
        { source: "/old/:slug", destination: "/new/:slug" },
        { source: "/proxy/:path*", destination: "/about" },
      ],
      fallback: [
        { source: "/:path*", destination: "https://old-site.com/:path" },
      ],
    };

    console.log("\n── 1. Path Match ──");
    console.log(matchPath("/blog/:slug", "/blog/hello"));
    console.log(matchPath("/blog/:path*", "/blog/a/b/c"));

    console.log("\n── 2. Param Resolver ──");
    console.log(resolveDestination("/new/:slug", { slug: "hello" }));
    console.log(resolveDestination("/about", { path: "a/b" }));

    console.log("\n── 3. Resolve (3 phases) ──");
    console.log(resolve(config, "/override", []));
    console.log(resolve(config, "/old/post-1", ["/home"]));
    console.log(resolve(config, "/proxy/deep/path", []));
    console.log(resolve(config, "/unknown", []));
  }

  return { demo: demo };
})();
// Chạy: RewritesEngine.demo();
```

---

## §5. Câu Hỏi Phỏng Vấn!

```
  CÂU HỎI:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  ❓ 1: Rewrite vs Redirect?                                    │
  │  → Redirect: URL THAY ĐỔI (307/308)! ★★★                │
  │  → Rewrite: URL GIỮ NGUYÊN (proxy)! ★★★                 │
  │                                                              │
  │  ❓ 2: 3 phases?                                               │
  │  → beforeFiles: trước static files! Override page! ★★★    │
  │  → afterFiles: sau static, trước dynamic routes! ★       │
  │  → fallback: cuối cùng, proxy to old site! ★★★          │
  │                                                              │
  │  ❓ 3: Params behavior?                                        │
  │  → KHÔNG used in destination → auto query! ★★★           │
  │  → USED in destination → KHÔNG auto query! ★              │
  │  → Manual: destination: '/:first?second=:second'! ★      │
  │                                                              │
  │  ❓ 4: Incremental adoption?                                   │
  │  → fallback: proxy /:path* to old site! ★★★              │
  │  → Migrate page by page! ★                                │
  │  → Next.js pages served first, rest → old site! ★★★     │
  │                                                              │
  │  ❓ 5: Routing order?                                          │
  │  → headers → redirects → proxy →                         │
  │    beforeFiles → static → afterFiles → fallback! ★★★    │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```
