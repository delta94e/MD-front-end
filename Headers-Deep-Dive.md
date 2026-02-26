# headers — Deep Dive!

> **Nguồn**: https://nextjs.org/docs/app/api-reference/config/next-config-js/headers
> **Ngôn ngữ**: Tiếng Việt — giải thích cực kỳ chi tiết!
> **Trang này KHÔNG có hình/diagram** — chỉ có text + code blocks!

---

## §1. headers Là Gì?

```
  headers — TỔNG QUAN:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  WHAT:                                                        │
  │  → Set custom HTTP headers cho response! ★★★               │
  │  → Dựa trên incoming request path! ★                       │
  │  → async function trả về array of objects! ★               │
  │  → Checked TRƯỚC filesystem (pages + /public)! ★★★        │
  │                                                              │
  │  CONFIG:                                                      │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │  module.exports = {                                   │    │
  │  │    async headers() {                                   │    │
  │  │      return [                                          │    │
  │  │        {                                               │    │
  │  │          source: '/about',  ← path pattern! ★         │    │
  │  │          headers: [                                    │    │
  │  │            { key: 'x-custom', value: 'hello' } ★     │    │
  │  │          ]                                             │    │
  │  │        }                                               │    │
  │  │      ]                                                 │    │
  │  │    }                                                   │    │
  │  │  }                                                     │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  HEADER OBJECT:                                               │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │  source:    incoming request path pattern! ★          │    │
  │  │  headers:   [{ key, value }] array! ★                 │    │
  │  │  basePath:  false → skip basePath prefix! ★           │    │
  │  │  locale:    false → skip locale prefix! ★             │    │
  │  │  has:       conditional match (header/cookie/query)!★ │    │
  │  │  missing:   conditional NOT match! ★                  │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  OVERRIDE BEHAVIOR:                                           │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │  2 rules match cùng path + cùng key:                  │    │
  │  │  → LAST one wins! ★★★                                 │    │
  │  │                                                       │    │
  │  │  Rule 1: '/:path*' → x-hello: 'there'                │    │
  │  │  Rule 2: '/hello'  → x-hello: 'world'                │    │
  │  │  → /hello: x-hello = 'world' ★★★ (last wins!)       │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```

---

## §2. Path Matching!

```
  PATH MATCHING:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  ① Basic :param — single segment! ★                         │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │  source: '/blog/:slug'                                │    │
  │  │  ✅ /blog/first-post                                   │    │
  │  │  ✅ /blog/post-1                                       │    │
  │  │  ❌ /blog/a/b         (nested! ★)                      │    │
  │  │  ❌ /archive/blog/x   (anchored to start! ★)           │    │
  │  │                                                       │    │
  │  │  → :slug usable in key/value:                          │    │
  │  │    key: 'x-slug', value: ':slug' ★★★                  │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  ② Modifiers! ★★★                                            │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │  *  (zero or more):  /blog/:slug*                     │    │
  │  │     ✅ /blog  ✅ /blog/a  ✅ /blog/a/b/c               │    │
  │  │                                                       │    │
  │  │  +  (one or more):   /blog/:slug+                     │    │
  │  │     ❌ /blog  ✅ /blog/a  ✅ /blog/a/b                  │    │
  │  │                                                       │    │
  │  │  ?  (zero or one):   /blog/:slug?                     │    │
  │  │     ✅ /blog  ✅ /blog/a  ❌ /blog/a/b                  │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  ③ Regex! ★                                                   │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │  source: '/blog/:post(\\d{1,})'                       │    │
  │  │  ✅ /blog/123                                          │    │
  │  │  ❌ /blog/abc                                          │    │
  │  │                                                       │    │
  │  │  Special chars phải escape với \\:                     │    │
  │  │  source: '/english\\(default\\)/:slug'                │    │
  │  │  → matches /english(default)/something! ★             │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```

---

## §3. Conditional Matching — has & missing!

```
  HAS & MISSING:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  type: 'header' | 'cookie' | 'host' | 'query'! ★★★        │
  │  key:  string — the key to match! ★                        │
  │  value: string | undefined — regex supported! ★             │
  │                                                              │
  │  VÍ DỤ:                                                       │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │  // Chỉ apply khi CÓ header x-add-header:             │    │
  │  │  has: [{ type: 'header', key: 'x-add-header' }]      │    │
  │  │                                                       │    │
  │  │  // Chỉ apply khi KHÔNG CÓ header:                     │    │
  │  │  missing: [{ type: 'header', key: 'x-no-header' }]   │    │
  │  │                                                       │    │
  │  │  // Match query + cookie:                              │    │
  │  │  has: [                                                │    │
  │  │    { type: 'query', key: 'page', value: 'home' },    │    │
  │  │    { type: 'cookie', key: 'authorized', value: 'true'}│    │
  │  │  ]                                                     │    │
  │  │                                                       │    │
  │  │  // Regex named capture:                               │    │
  │  │  has: [{                                               │    │
  │  │    type: 'header',                                     │    │
  │  │    key: 'x-authorized',                                │    │
  │  │    value: '(?<authorized>yes|true)'                   │    │
  │  │  }]                                                    │    │
  │  │  → value ':authorized' usable in headers! ★★★        │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  LOGIC:                                                       │
  │  → ALL has items MUST match! ★★★                            │
  │  → ALL missing items MUST NOT match! ★★★                   │
  │  → source + has + missing ALL checked! ★                   │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```

---

## §4. basePath + i18n + Cache-Control!

```
  EXTRAS:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  ① basePath support! ★                                       │
  │  → basePath: '/docs'                                        │
  │  → source '/about' → auto becomes '/docs/about'! ★        │
  │  → basePath: false → skip prefix! ★                        │
  │                                                              │
  │  ② i18n support! ★                                           │
  │  → locales: ['en','fr','de']                                │
  │  → source auto prefixed for ALL locales! ★                 │
  │  → locale: false → manual locale in source! ★              │
  │                                                              │
  │  ③ Cache-Control! ★★★                                        │
  │  → Immutable assets: public, max-age=31536000, immutable    │
  │  → CANNOT be overridden for immutable assets! ★★★         │
  │  → SHA-hash in filename → safe cache indefinitely! ★       │
  │  → CAN set Cache-Control for other responses! ★            │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```

---

## §5. Security Headers Cheat Sheet!

```
  SECURITY HEADERS:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  ┌───────────────────────────┬────────────────────────────┐  │
  │  │ Header                      │ Purpose                    │  │
  │  ├───────────────────────────┼────────────────────────────┤  │
  │  │ X-DNS-Prefetch-Control     │ DNS prefetch external       │  │
  │  │ value: 'on'                │ links! Giảm latency! ★    │  │
  │  ├───────────────────────────┼────────────────────────────┤  │
  │  │ Strict-Transport-Security  │ Force HTTPS! ★★★           │  │
  │  │ max-age=63072000;          │ includeSubDomains!         │  │
  │  │ includeSubDomains; preload │ preload HSTS list! ★      │  │
  │  ├───────────────────────────┼────────────────────────────┤  │
  │  │ X-Frame-Options            │ Chống clickjacking! ★★★    │  │
  │  │ value: 'SAMEORIGIN'        │ Dùng CSP frame-ancestors  │  │
  │  ├───────────────────────────┼────────────────────────────┤  │
  │  │ Permissions-Policy          │ Giới hạn browser APIs! ★  │  │
  │  │ camera=(), microphone=()   │ geolocation=()! ★          │  │
  │  ├───────────────────────────┼────────────────────────────┤  │
  │  │ X-Content-Type-Options     │ Chống MIME sniffing! ★★★   │  │
  │  │ value: 'nosniff'           │ Ngăn XSS qua upload! ★    │  │
  │  ├───────────────────────────┼────────────────────────────┤  │
  │  │ Referrer-Policy             │ Kiểm soát referrer! ★     │  │
  │  │ 'origin-when-cross-origin'  │ Same-origin: full URL!   │  │
  │  │                            │ Cross-origin: chỉ origin! │  │
  │  ├───────────────────────────┼────────────────────────────┤  │
  │  │ Content-Security-Policy     │ Chống XSS injection! ★★★  │  │
  │  │                            │ Whitelist sources! ★       │  │
  │  ├───────────────────────────┼────────────────────────────┤  │
  │  │ CORS headers               │ Cross-origin access! ★★★  │  │
  │  │ Access-Control-Allow-Origin │ Methods, Headers! ★      │  │
  │  └───────────────────────────┴────────────────────────────┘  │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```

---

## §6. Tự Viết — HeadersEngine!

```javascript
var HeadersEngine = (function () {
  // ═══════════════════════════════════
  // 1. PATH MATCHER (simplified path-to-regexp)
  // ═══════════════════════════════════
  function matchPath(pattern, path) {
    // Convert pattern to regex
    var regexStr =
      "^" +
      pattern
        .replace(/:(\w+)\*/g, "(?<$1>.*)") // :slug* → zero or more
        .replace(/:(\w+)\+/g, "(?<$1>.+)") // :slug+ → one or more
        .replace(/:(\w+)\?/g, "(?<$1>[^/]*)?") // :slug? → zero or one
        .replace(/:(\w+)/g, "(?<$1>[^/]+)") + // :slug  → single segment
      "$";

    var regex = new RegExp(regexStr);
    var match = path.match(regex);
    if (!match) return null;
    return { matched: true, params: match.groups || {} };
  }

  // ═══════════════════════════════════
  // 2. CONDITIONAL MATCHER (has/missing)
  // ═══════════════════════════════════
  function checkConditions(rule, request) {
    // Check "has" conditions — ALL must match
    if (rule.has) {
      for (var i = 0; i < rule.has.length; i++) {
        var cond = rule.has[i];
        var store = request[cond.type + "s"] || {};
        var val = store[cond.key];
        if (val === undefined) return false;
        if (cond.value && !new RegExp(cond.value).test(val)) return false;
      }
    }
    // Check "missing" conditions — ALL must NOT match
    if (rule.missing) {
      for (var j = 0; j < rule.missing.length; j++) {
        var mcond = rule.missing[j];
        var mstore = request[mcond.type + "s"] || {};
        if (mstore[mcond.key] !== undefined) return false;
      }
    }
    return true;
  }

  // ═══════════════════════════════════
  // 3. HEADER RESOLVER
  // ═══════════════════════════════════
  function resolveHeaders(rules, path, request) {
    var result = {};
    for (var i = 0; i < rules.length; i++) {
      var rule = rules[i];
      var match = matchPath(rule.source, path);
      if (!match) continue;
      if (!checkConditions(rule, request || {})) continue;

      // Apply headers (last wins for same key!)
      for (var j = 0; j < rule.headers.length; j++) {
        var h = rule.headers[j];
        var key = h.key;
        var value = h.value;
        // Replace params in value
        for (var param in match.params) {
          value = value.replace(":" + param, match.params[param]);
          key = key.replace(":" + param, match.params[param]);
        }
        result[key] = value;
      }
    }
    return result;
  }

  // ═══════════════════════════════════
  // 4. SECURITY HEADERS GENERATOR
  // ═══════════════════════════════════
  function generateSecurityHeaders() {
    return [
      { key: "X-DNS-Prefetch-Control", value: "on" },
      {
        key: "Strict-Transport-Security",
        value: "max-age=63072000; includeSubDomains; preload",
      },
      { key: "X-Frame-Options", value: "SAMEORIGIN" },
      {
        key: "Permissions-Policy",
        value: "camera=(), microphone=(), geolocation=()",
      },
      { key: "X-Content-Type-Options", value: "nosniff" },
      { key: "Referrer-Policy", value: "origin-when-cross-origin" },
    ];
  }

  // ═══════════════════════════════════
  // 5. DEMO
  // ═══════════════════════════════════
  function demo() {
    console.log("═══ Headers Engine ═══");

    console.log("\n── 1. Path Matching ──");
    console.log(matchPath("/blog/:slug", "/blog/hello"));
    console.log(matchPath("/blog/:slug*", "/blog/a/b/c"));
    console.log(matchPath("/blog/:slug", "/blog/a/b"));

    console.log("\n── 2. Header Resolution ──");
    var rules = [
      { source: "/:path*", headers: [{ key: "x-hello", value: "there" }] },
      { source: "/hello", headers: [{ key: "x-hello", value: "world" }] },
      { source: "/blog/:slug", headers: [{ key: "x-slug", value: ":slug" }] },
    ];
    console.log("/hello:", resolveHeaders(rules, "/hello", {}));
    console.log("/blog/test:", resolveHeaders(rules, "/blog/test", {}));

    console.log("\n── 3. Conditional ──");
    var condRules = [
      {
        source: "/:path*",
        has: [{ type: "header", key: "x-auth" }],
        headers: [{ key: "x-authorized", value: "yes" }],
      },
    ];
    console.log(
      "With header:",
      resolveHeaders(condRules, "/page", { headers: { "x-auth": "token" } }),
    );
    console.log("Without:", resolveHeaders(condRules, "/page", {}));

    console.log("\n── 4. Security Headers ──");
    console.log(generateSecurityHeaders());
  }

  return { demo: demo };
})();
// Chạy: HeadersEngine.demo();
```

---

## §7. Câu Hỏi Phỏng Vấn!

```
  CÂU HỎI:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  ❓ 1: headers config dùng làm gì?                             │
  │  → Custom HTTP headers trên response! ★★★                  │
  │  → Dựa trên path + conditions! ★                           │
  │  → Checked TRƯỚC filesystem! ★                              │
  │                                                              │
  │  ❓ 2: Override behavior?                                      │
  │  → 2 rules cùng path + cùng key → LAST wins! ★★★          │
  │                                                              │
  │  ❓ 3: has vs missing?                                         │
  │  → has: ALL phải match (header/cookie/query/host)! ★★★    │
  │  → missing: ALL phải KHÔNG match! ★★★                     │
  │  → Cả 2 support regex + named captures! ★                 │
  │                                                              │
  │  ❓ 4: Path matching modifiers?                                │
  │  → :slug  = single segment! ★                              │
  │  → :slug* = zero or more! ★                                │
  │  → :slug+ = one or more! ★                                 │
  │  → :slug? = zero or one! ★                                 │
  │  → Regex: :post(\\d{1,})! ★                                │
  │                                                              │
  │  ❓ 5: Kể 7 security headers quan trọng?                      │
  │  → HSTS, X-Frame-Options, CSP, CORS,                      │
  │    X-Content-Type-Options, Permissions-Policy,              │
  │    Referrer-Policy! ★★★                                    │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```
