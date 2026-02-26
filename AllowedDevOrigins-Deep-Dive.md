# allowedDevOrigins — Deep Dive!

> **Nguồn**: https://nextjs.org/docs/app/api-reference/config/next-config-js/allowedDevOrigins
> **Ngôn ngữ**: Tiếng Việt — giải thích cực kỳ chi tiết!
> **Trang này KHÔNG có hình/diagram** — chỉ có text + code blocks!

---

## §1. allowedDevOrigins Là Gì?

```
  allowedDevOrigins — TỔNG QUAN:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  WHAT:                                                        │
  │  → Config cho DEVELOPMENT MODE ONLY! ★                      │
  │  → Cho phép origins KHÁC request dev server! ★★★            │
  │  → Mặc định: chỉ localhost được phép! ★                    │
  │  → Tương lai: cross-origin BỊ BLOCK by default! ★★★       │
  │                                                              │
  │  VẤN ĐỀ:                                                      │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │                                                       │    │
  │  │  Dev server chạy ở: http://localhost:3000              │    │
  │  │                                                       │    │
  │  │  ❌ Request từ: http://my-app.local:3000                │    │
  │  │  → BỊ BLOCK! Origin khác! ★★★                        │    │
  │  │                                                       │    │
  │  │  ❌ Request từ: http://192.168.1.10:3000                │    │
  │  │  → BỊ BLOCK! Origin khác! ★★★                        │    │
  │  │                                                       │    │
  │  │  ❌ Request từ: https://abc.ngrok.io                    │    │
  │  │  → BỊ BLOCK! Origin khác! ★★★                        │    │
  │  │                                                       │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  GIẢI PHÁP: allowedDevOrigins! ★★★                          │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```

---

## §2. Cấu Hình!

```
  CONFIG:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │  // next.config.js                                    │    │
  │  │  module.exports = {                                   │    │
  │  │    allowedDevOrigins: [                                │    │
  │  │      'local-origin.dev',        ← exact match! ★     │    │
  │  │      '*.local-origin.dev',      ← wildcard! ★★★      │    │
  │  │    ]                                                   │    │
  │  │  }                                                     │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  WILDCARD (*):                                                │
  │  → '*.local-origin.dev' match:                               │
  │    ✅ app.local-origin.dev! ★                                 │
  │    ✅ api.local-origin.dev! ★                                 │
  │    ✅ admin.local-origin.dev! ★                               │
  │    ❌ local-origin.dev (KHÔNG có subdomain)! ★               │
  │                                                              │
  │  ⚠️ TYPE: string[]! ★                                        │
  │  ⚠️ DEVELOPMENT MODE ONLY! Production không ảnh hưởng! ★   │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```

---

## §3. Khi Nào Cần?

```
  USE CASES:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  ① Custom Domain cho Dev:                                     │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │  // /etc/hosts: 127.0.0.1 my-app.local                │    │
  │  │  allowedDevOrigins: ['my-app.local']  ★               │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  ② Ngrok / Tunneling:                                         │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │  // ngrok đổi subdomain mỗi lần!                      │    │
  │  │  allowedDevOrigins: ['*.ngrok.io']  ★★★               │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  ③ Mobile Testing qua IP:                                     │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │  // Test trên điện thoại cùng mạng WiFi                │    │
  │  │  allowedDevOrigins: ['192.168.1.10']  ★               │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  ④ Nhiều Subdomain Dev:                                       │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │  allowedDevOrigins: [                                  │    │
  │  │    'app.staging.dev',                                  │    │
  │  │    'api.staging.dev',                                  │    │
  │  │    '*.staging.dev',  ← tất cả subdomains! ★★★        │    │
  │  │  ]                                                     │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  FLOW:                                                        │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │                                                       │    │
  │  │  Request từ external origin                            │    │
  │  │         ↓                                              │    │
  │  │  ┌─── origin === localhost? ───┐                       │    │
  │  │  │ YES             │ NO        │                       │    │
  │  │  ↓                 ↓            │                       │    │
  │  │  ✅ ALLOW     ┌─── in allowedDevOrigins? ───┐          │    │
  │  │              │ YES                │ NO       │          │    │
  │  │              ↓                    ↓           │          │    │
  │  │              ✅ ALLOW             ❌ BLOCK!    │          │    │
  │  │                                               │          │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```

---

## §4. Tự Viết — AllowedDevOriginsEngine!

```javascript
var AllowedDevOriginsEngine = (function () {
  // ═══════════════════════════════════
  // 1. ORIGIN CHECKER
  // ═══════════════════════════════════
  var DEFAULT_ORIGIN = "localhost";

  function checkOrigin(requestOrigin, allowedOrigins) {
    // Always allow localhost
    if (requestOrigin === DEFAULT_ORIGIN) {
      return {
        origin: requestOrigin,
        allowed: true,
        matchedBy: "DEFAULT (localhost)",
        note: "localhost luôn được phép! ★",
      };
    }

    if (!allowedOrigins || allowedOrigins.length === 0) {
      return {
        origin: requestOrigin,
        allowed: false,
        note: "Không có allowedDevOrigins! BLOCKED! ★★★",
      };
    }

    // Check each pattern
    for (var i = 0; i < allowedOrigins.length; i++) {
      var pattern = allowedOrigins[i];

      // Exact match
      if (pattern === requestOrigin) {
        return {
          origin: requestOrigin,
          allowed: true,
          matchedBy: pattern,
          type: "exact",
        };
      }

      // Wildcard match (*.domain.com)
      if (pattern.charAt(0) === "*" && pattern.charAt(1) === ".") {
        var suffix = pattern.substring(1); // .domain.com
        var originLen = requestOrigin.length;
        var suffixLen = suffix.length;

        if (
          originLen > suffixLen &&
          requestOrigin.substring(originLen - suffixLen) === suffix
        ) {
          return {
            origin: requestOrigin,
            allowed: true,
            matchedBy: pattern,
            type: "wildcard",
            note: "Wildcard match! ★",
          };
        }
      }
    }

    return {
      origin: requestOrigin,
      allowed: false,
      checkedPatterns: allowedOrigins,
      note: "BLOCKED! Origin không match pattern nào! ★★★",
    };
  }

  // ═══════════════════════════════════
  // 2. CONFIG VALIDATOR
  // ═══════════════════════════════════
  function validateConfig(config) {
    var issues = [];
    if (!Array.isArray(config)) {
      issues.push("Phải là array! string[]! ★★★");
      return { valid: false, issues: issues };
    }
    for (var i = 0; i < config.length; i++) {
      if (typeof config[i] !== "string") {
        issues.push("Item " + i + " không phải string! ★");
      }
      if (config[i].indexOf("http") === 0) {
        issues.push(
          "Item '" + config[i] + "': chỉ cần domain, KHÔNG cần protocol! ★",
        );
      }
    }
    return {
      valid: issues.length === 0,
      count: config.length,
      hasWildcard: config.some(function (p) {
        return p.charAt(0) === "*";
      }),
      issues: issues,
      note: "Development mode ONLY! ★",
    };
  }

  // ═══════════════════════════════════
  // 3. DEMO
  // ═══════════════════════════════════
  function demo() {
    console.log("═══ AllowedDevOrigins Engine ═══");

    var origins = ["local-origin.dev", "*.staging.dev"];

    console.log("\n── 1. Check ──");
    console.log("localhost:", checkOrigin("localhost", origins));
    console.log("local-origin.dev:", checkOrigin("local-origin.dev", origins));
    console.log("app.staging.dev:", checkOrigin("app.staging.dev", origins));
    console.log("api.staging.dev:", checkOrigin("api.staging.dev", origins));
    console.log("staging.dev:", checkOrigin("staging.dev", origins));
    console.log("evil.com:", checkOrigin("evil.com", origins));

    console.log("\n── 2. Validate ──");
    console.log(validateConfig(origins));
    console.log(validateConfig(["https://bad.com", 123]));
  }

  return { demo: demo };
})();
// Chạy: AllowedDevOriginsEngine.demo();
```

---

## §5. Câu Hỏi Phỏng Vấn!

```
  CÂU HỎI:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  ❓ 1: allowedDevOrigins dùng làm gì?                         │
  │  → Cho phép origins KHÁC localhost request dev server! ★    │
  │  → string[] config trong next.config.js! ★                  │
  │  → Development mode ONLY! ★★★                              │
  │                                                              │
  │  ❓ 2: Wildcard hoạt động thế nào?                             │
  │  → '*.domain.com' match TẤT CẢ subdomains! ★★★            │
  │  → app.domain.com ✅, api.domain.com ✅! ★                    │
  │  → domain.com ❌ (không có subdomain)! ★                     │
  │                                                              │
  │  ❓ 3: Khi nào cần config?                                     │
  │  → Custom domain dev, ngrok tunneling! ★                    │
  │  → Mobile testing qua IP! ★                                │
  │  → Multi-subdomain dev environment! ★                      │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```
