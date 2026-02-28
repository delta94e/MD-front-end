# redirects — Deep Dive!

> **Nguồn**: https://nextjs.org/docs/app/api-reference/config/next-config-js/redirects
> **Ngôn ngữ**: Tiếng Việt — giải thích cực kỳ chi tiết!
> **Trang này KHÔNG có hình/diagram** — chỉ có text + code blocks!

---

## §1. redirects Là Gì?

```
  redirects — TỔNG QUAN:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  WHAT:                                                        │
  │  → Redirect incoming request → destination path! ★★★      │
  │  → Checked TRƯỚC filesystem (pages, /public)! ★★★        │
  │  → Query params tự động pass-through! ★                   │
  │                                                              │
  │  3 REQUIRED PROPERTIES:                                       │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │  source:      incoming request path pattern ★         │    │
  │  │  destination:  path to redirect to ★                   │    │
  │  │  permanent:    true/false ★★★                          │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  STATUS CODES (307 vs 308):                                   │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │                                                       │    │
  │  │  permanent: true  → 308 (permanent) ★★★              │    │
  │  │  → Cached forever by browsers + search engines! ★    │    │
  │  │                                                       │    │
  │  │  permanent: false → 307 (temporary) ★                 │    │
  │  │  → NOT cached! ★                                      │    │
  │  │                                                       │    │
  │  │  ⚠️ Tại sao 307/308 thay vì 301/302?                  │    │
  │  │  → 301/302: browsers đổi POST → GET! ★★★            │    │
  │  │  → 307/308: PRESERVE request method! ★★★             │    │
  │  │                                                       │    │
  │  │  VD: POST /v1/users                                    │    │
  │  │  302 → GET /v2/users ← SAI! ★★★                     │    │
  │  │  307 → POST /v2/users ← ĐÚNG! ★★★                   │    │
  │  │                                                       │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  OPTIONAL PROPERTIES:                                         │
  │  → basePath: false (skip basePath prefix) ★                │
  │  → locale: false (skip locale matching) ★                  │
  │  → has: [] (conditional header/cookie/query) ★★★          │
  │  → missing: [] (conditional NOT match) ★★★                │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```

---

## §2. Path Matching — Params, Wildcard, Regex!

```
  PATH MATCHING:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  NAMED PARAMS:                                                │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │  source: '/old-blog/:slug'                             │    │
  │  │  destination: '/news/:slug'  ★★★ (params reusable!)  │    │
  │  │                                                       │    │
  │  │  ✅ /old-blog/first-post → /news/first-post           │    │
  │  │  ❌ /old-blog/a/b (no nested!)                         │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  MODIFIERS:                                                   │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │  *  = zero or more segments ★★★                       │    │
  │  │  +  = one or more segments ★                          │    │
  │  │  ?  = zero or one segment ★                           │    │
  │  │                                                       │    │
  │  │  /blog/:slug*                                          │    │
  │  │  ✅ /blog                                               │    │
  │  │  ✅ /blog/a                                             │    │
  │  │  ✅ /blog/a/b/c ★★★ (nested OK with *)                │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  REGEX:                                                       │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │  source: '/post/:slug(\\d{1,})'                       │    │
  │  │  ✅ /post/123 ★★★                                      │    │
  │  │  ❌ /post/abc (chỉ digits!)                             │    │
  │  │                                                       │    │
  │  │  Special chars PHẢI escape: ( ) { } : * + ?           │    │
  │  │  → '/english\\(default\\)/:slug' ★                     │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```

---

## §3. Conditional Matching — has / missing!

```
  CONDITIONAL:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  has / missing FIELDS:                                        │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │  type:   'header' | 'cookie' | 'host' | 'query' ★★★ │    │
  │  │  key:    string (header/cookie/query key) ★           │    │
  │  │  value:  string | undefined (regex supported) ★       │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  LOGIC:                                                       │
  │  → has: ALL items MUST match + source! ★★★                │
  │  → missing: ALL items MUST NOT match! ★★★                 │
  │                                                              │
  │  VÍ DỤ:                                                      │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │  // Redirect nếu CÓ header:                           │    │
  │  │  has: [{ type: 'header', key: 'x-redirect-me' }]     │    │
  │  │                                                       │    │
  │  │  // Redirect nếu KHÔNG CÓ header:                     │    │
  │  │  missing: [{ type: 'header', key: 'x-no-redirect' }] │    │
  │  │                                                       │    │
  │  │  // Query + Cookie:                                    │    │
  │  │  has: [                                                │    │
  │  │    { type: 'query', key: 'page', value: 'home' },    │    │
  │  │    { type: 'cookie', key: 'auth', value: 'true' }    │    │
  │  │  ]                                                     │    │
  │  │                                                       │    │
  │  │  // Regex capture → destination:                       │    │
  │  │  has: [{                                               │    │
  │  │    type: 'header', key: 'x-auth',                     │    │
  │  │    value: '(?<authorized>yes|true)'  ★★★              │    │
  │  │  }]                                                    │    │
  │  │  destination: '/home?authorized=:authorized' ★★★     │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  basePath / i18n:                                             │
  │  → basePath: auto-prefix (basePath: false to skip) ★      │
  │  → i18n: hardcoded locale or /:locale param ★             │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```

---

## §4. Tự Viết — RedirectsEngine!

```javascript
var RedirectsEngine = (function () {
  // ═══════════════════════════════════
  // 1. PATH MATCHER (path-to-regexp lite)
  // ═══════════════════════════════════
  function pathToRegex(pattern) {
    // Convert :param to named group, :param* to greedy
    var regex = pattern
      .replace(/:(\w+)\*/g, "(?<$1>.+)") // :slug*
      .replace(/:(\w+)\?/g, "(?<$1>[^/]*)") // :slug?
      .replace(/:(\w+)\+/g, "(?<$1>.+)") // :slug+
      .replace(/:(\w+)/g, "(?<$1>[^/]+)"); // :slug
    return new RegExp("^" + regex + "$");
  }

  function matchPath(source, requestPath) {
    var regex = pathToRegex(source);
    var match = requestPath.match(regex);
    if (!match) return null;
    return match.groups || {};
  }

  // ═══════════════════════════════════
  // 2. CONDITIONAL MATCHER (has/missing)
  // ═══════════════════════════════════
  function matchConditions(conditions, request, mustMatch) {
    if (!conditions || conditions.length === 0) return true;

    for (var i = 0; i < conditions.length; i++) {
      var cond = conditions[i];
      var actual = null;

      if (cond.type === "header") actual = (request.headers || {})[cond.key];
      else if (cond.type === "cookie")
        actual = (request.cookies || {})[cond.key];
      else if (cond.type === "query") actual = (request.query || {})[cond.key];
      else if (cond.type === "host") actual = request.host;

      var matched = actual != null;
      if (cond.value && matched) {
        matched = new RegExp(cond.value).test(actual);
      }

      if (mustMatch && !matched) return false;
      if (!mustMatch && matched) return false;
    }
    return true;
  }

  // ═══════════════════════════════════
  // 3. REDIRECT RESOLVER
  // ═══════════════════════════════════
  function resolve(redirects, request) {
    for (var i = 0; i < redirects.length; i++) {
      var r = redirects[i];
      var params = matchPath(r.source, request.path);
      if (!params) continue;

      if (!matchConditions(r.has, request, true)) continue;
      if (!matchConditions(r.missing, request, false)) continue;

      // Build destination with params
      var dest = r.destination;
      for (var key in params) {
        dest = dest.replace(":" + key, params[key]);
      }

      return {
        matched: true,
        source: r.source,
        destination: dest,
        statusCode: r.permanent ? 308 : 307,
        permanent: r.permanent,
      };
    }
    return { matched: false };
  }

  // ═══════════════════════════════════
  // 4. DEMO
  // ═══════════════════════════════════
  function demo() {
    console.log("═══ Redirects Engine ═══");

    var redirects = [
      {
        source: "/old-blog/:slug",
        destination: "/news/:slug",
        permanent: true,
      },
      {
        source: "/blog/:path*",
        destination: "/articles/:path",
        permanent: false,
      },
      {
        source: "/:path*",
        destination: "/login",
        permanent: false,
        missing: [{ type: "cookie", key: "auth" }],
      },
    ];

    console.log("\n── 1. Path Match ──");
    console.log(matchPath("/old-blog/:slug", "/old-blog/hello"));
    console.log(matchPath("/blog/:path*", "/blog/a/b/c"));

    console.log("\n── 2. Resolve ──");
    console.log(resolve(redirects, { path: "/old-blog/my-post" }));
    console.log(resolve(redirects, { path: "/blog/deep/nested" }));
    console.log(
      resolve(redirects, {
        path: "/dashboard",
        cookies: { auth: "true" },
      }),
    );
    console.log(resolve(redirects, { path: "/dashboard" }));
  }

  return { demo: demo };
})();
// Chạy: RedirectsEngine.demo();
```

---

## §5. Câu Hỏi Phỏng Vấn!

```
  CÂU HỎI:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  ❓ 1: redirects config dùng làm gì?                          │
  │  → Redirect incoming path → destination! ★★★              │
  │  → Checked TRƯỚC filesystem! ★                            │
  │  → Query params pass-through! ★                            │
  │                                                              │
  │  ❓ 2: Tại sao 307/308 thay vì 301/302?                       │
  │  → 301/302: browsers đổi POST → GET! ★★★                │
  │  → 307/308: PRESERVE request method! ★★★                 │
  │  → permanent:true → 308, false → 307! ★                  │
  │                                                              │
  │  ❓ 3: Path matching?                                          │
  │  → :slug = 1 segment! ★                                   │
  │  → :slug* = 0+ segments! ★★★                              │
  │  → :slug+ = 1+ segments! ★                                │
  │  → :slug(\\d+) = regex! ★★★                               │
  │                                                              │
  │  ❓ 4: has / missing?                                          │
  │  → Conditional redirect on header/cookie/query/host! ★★★ │
  │  → has: ALL must match! ★                                 │
  │  → missing: ALL must NOT match! ★                         │
  │  → Regex captures → :paramName in destination! ★★★       │
  │                                                              │
  │  ❓ 5: Other redirect methods?                                 │
  │  → Route Handlers (App Router)! ★                         │
  │  → API Routes (Pages Router)! ★                           │
  │  → getServerSideProps / getStaticProps! ★                  │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```
