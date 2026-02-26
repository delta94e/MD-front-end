# serverActions — Deep Dive!

> **Nguồn**: https://nextjs.org/docs/app/api-reference/config/next-config-js/serverActions
> **Ngôn ngữ**: Tiếng Việt — giải thích cực kỳ chi tiết!
> **Trang này KHÔNG có hình/diagram** — chỉ có text + code blocks!

---

## §1. serverActions Config Là Gì?

```
  serverActions — TỔNG QUAN:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  WHAT:                                                        │
  │  → Configure Server Actions behavior! ★★★                 │
  │  → Stable từ Next.js 14 (enabled by default)! ★           │
  │  → v13: phải bật experimental.serverActions! ★             │
  │                                                              │
  │  2 OPTIONS:                                                   │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │                                                       │    │
  │  │  ┌──────────────────┬──────────┬──────────────────┐   │    │
  │  │  │ Option           │ Type     │ Default          │   │    │
  │  │  ├──────────────────┼──────────┼──────────────────┤   │    │
  │  │  │ allowedOrigins   │ string[] │ same origin only │   │    │
  │  │  │ bodySizeLimit    │ string   │ '1mb'            │   │    │
  │  │  └──────────────────┴──────────┴──────────────────┘   │    │
  │  │                                                       │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```

---

## §2. allowedOrigins — Chống CSRF!

```
  allowedOrigins:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  WHAT:                                                        │
  │  → Extra safe origin domains cho Server Actions! ★★★      │
  │  → Next.js so sánh origin vs host! ★★★                    │
  │  → Không match → BLOCK (chống CSRF)! ★★★                 │
  │  → Default: chỉ same origin! ★                            │
  │                                                              │
  │  FLOW:                                                        │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │                                                       │    │
  │  │  Client gửi Server Action request                      │    │
  │  │       ↓                                                │    │
  │  │  Next.js check: Origin header === Host?                │    │
  │  │       ↓                                                │    │
  │  │  ┌── Match? ──┐                                        │    │
  │  │  ↓ YES         ↓ NO                                    │    │
  │  │  ✅ Allow       Check allowedOrigins list               │    │
  │  │                 ↓                                       │    │
  │  │            ┌── In list? ──┐                             │    │
  │  │            ↓ YES           ↓ NO                         │    │
  │  │            ✅ Allow          ❌ BLOCK! CSRF! ★★★         │    │
  │  │                                                       │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  CONFIG:                                                      │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │  module.exports = {                                   │    │
  │  │    experimental: {                                     │    │
  │  │      serverActions: {                                  │    │
  │  │        allowedOrigins: [                               │    │
  │  │          'my-proxy.com',      ★★★                     │    │
  │  │          '*.my-proxy.com'     ★ (wildcard!)           │    │
  │  │        ]                                               │    │
  │  │      }                                                 │    │
  │  │    }                                                   │    │
  │  │  }                                                     │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  KHI NÀO DÙNG:                                                │
  │  → Reverse proxy phía trước! ★★★                         │
  │  → Multi-domain (cdn, api subdomain)! ★                   │
  │  → Cross-origin form submissions! ★                       │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```

---

## §3. bodySizeLimit — Giới Hạn Request Body!

```
  bodySizeLimit:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  WHAT:                                                        │
  │  → Max size request body cho Server Actions! ★★★          │
  │  → Default: 1MB ★                                         │
  │  → Chống DDoS + quá tải server! ★★★                      │
  │                                                              │
  │  FORMATS:                                                     │
  │  → Number (bytes): 1000 ★                                 │
  │  → String: '500kb', '2mb', '1gb' ★★★                     │
  │                                                              │
  │  CONFIG:                                                      │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │  module.exports = {                                   │    │
  │  │    experimental: {                                     │    │
  │  │      serverActions: {                                  │    │
  │  │        bodySizeLimit: '2mb' ★★★                       │    │
  │  │      }                                                 │    │
  │  │    }                                                   │    │
  │  │  }                                                     │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  KHI NÀO TĂNG:                                                │
  │  → File upload qua Server Action! ★★★                    │
  │  → Large form data! ★                                     │
  │  → Rich text content! ★                                   │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```

---

## §4. Tự Viết — ServerActionsConfigEngine!

```javascript
var ServerActionsConfigEngine = (function () {
  // ═══════════════════════════════════
  // 1. ORIGIN CHECKER (CSRF protection)
  // ═══════════════════════════════════
  function matchOrigin(origin, pattern) {
    if (pattern.indexOf("*.") === 0) {
      var suffix = pattern.slice(1); // ".my-proxy.com"
      return origin.indexOf(suffix) === origin.length - suffix.length;
    }
    return origin === pattern;
  }

  function checkOrigin(requestOrigin, host, allowedOrigins) {
    // Same origin check
    if (requestOrigin === host) {
      return { allowed: true, reason: "Same origin ✅ ★★★" };
    }

    // Check allowedOrigins list
    if (allowedOrigins) {
      for (var i = 0; i < allowedOrigins.length; i++) {
        if (matchOrigin(requestOrigin, allowedOrigins[i])) {
          return { allowed: true, reason: "In allowedOrigins ✅ ★" };
        }
      }
    }

    return {
      allowed: false,
      reason: "❌ CSRF blocked! Origin not allowed ★★★",
    };
  }

  // ═══════════════════════════════════
  // 2. BODY SIZE CHECKER
  // ═══════════════════════════════════
  function parseSize(limit) {
    if (typeof limit === "number") return limit;
    var match = limit.match(/^(\d+)(kb|mb|gb)?$/i);
    if (!match) return 1048576; // default 1MB
    var num = parseInt(match[1], 10);
    var unit = (match[2] || "b").toLowerCase();
    if (unit === "kb") return num * 1024;
    if (unit === "mb") return num * 1024 * 1024;
    if (unit === "gb") return num * 1024 * 1024 * 1024;
    return num;
  }

  function checkBodySize(bodyBytes, limit) {
    var maxBytes = parseSize(limit || "1mb");
    if (bodyBytes <= maxBytes) {
      return { allowed: true, size: bodyBytes, max: maxBytes, note: "✅ OK ★" };
    }
    return {
      allowed: false,
      size: bodyBytes,
      max: maxBytes,
      note: "❌ Body too large! ★★★",
    };
  }

  // ═══════════════════════════════════
  // 3. DEMO
  // ═══════════════════════════════════
  function demo() {
    console.log("═══ ServerActionsConfig Engine ═══");

    var config = {
      allowedOrigins: ["my-proxy.com", "*.my-proxy.com"],
      bodySizeLimit: "2mb",
    };

    console.log("\n── 1. Origin Check ──");
    console.log(checkOrigin("my-app.com", "my-app.com", config.allowedOrigins));
    console.log(
      checkOrigin("my-proxy.com", "my-app.com", config.allowedOrigins),
    );
    console.log(
      checkOrigin("sub.my-proxy.com", "my-app.com", config.allowedOrigins),
    );
    console.log(checkOrigin("evil.com", "my-app.com", config.allowedOrigins));

    console.log("\n── 2. Body Size Check ──");
    console.log(checkBodySize(500000, config.bodySizeLimit)); // 500KB OK
    console.log(checkBodySize(3000000, config.bodySizeLimit)); // 3MB TOO LARGE
  }

  return { demo: demo };
})();
// Chạy: ServerActionsConfigEngine.demo();
```

---

## §5. Câu Hỏi Phỏng Vấn!

```
  CÂU HỎI:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  ❓ 1: allowedOrigins dùng làm gì?                            │
  │  → Chống CSRF! ★★★                                       │
  │  → So sánh origin vs host! ★                              │
  │  → Thêm extra safe domains (proxy, subdomain)! ★★★       │
  │  → Wildcard: '*.my-proxy.com'! ★                          │
  │                                                              │
  │  ❓ 2: bodySizeLimit?                                          │
  │  → Max request body size cho Server Actions! ★★★          │
  │  → Default: 1MB! ★                                        │
  │  → Chống DDoS + quá tải server! ★★★                     │
  │  → Formats: 1000, '500kb', '2mb'! ★                      │
  │                                                              │
  │  ❓ 3: Server Actions v13 vs v14?                              │
  │  → v13: phải bật experimental.serverActions: true! ★      │
  │  → v14+: stable, enabled by default! ★★★                 │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```
