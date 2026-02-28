# env (Config) — Deep Dive!

> **Nguồn**: https://nextjs.org/docs/app/api-reference/config/next-config-js/env
> **Ngôn ngữ**: Tiếng Việt — giải thích cực kỳ chi tiết!
> **Trang này KHÔNG có hình/diagram** — chỉ có text + code blocks!
> **Recommend**: Dùng .env files từ Next.js 9.4+!

---

## §1. env Config Là Gì?

```
  env — TỔNG QUAN:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  WHAT:                                                        │
  │  → Thêm env variables vào JS BUNDLE! ★★★                   │
  │  → BUILD-TIME replacement! ★★★                              │
  │  → Dùng webpack DefinePlugin! ★                             │
  │                                                              │
  │  CONFIG:                                                      │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │  // next.config.js                                    │    │
  │  │  module.exports = {                                   │    │
  │  │    env: {                                              │    │
  │  │      customKey: 'my-value'  ★                         │    │
  │  │    }                                                   │    │
  │  │  }                                                     │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  SỬ DỤNG:                                                     │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │  // Trong component:                                   │    │
  │  │  process.env.customKey  → 'my-value'! ★★★             │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  BUILD-TIME REPLACEMENT:                                      │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │                                                       │    │
  │  │  SOURCE CODE:                                          │    │
  │  │  <h1>Value: {process.env.customKey}</h1>              │    │
  │  │                    ↓  (build time)                     │    │
  │  │  BUNDLED OUTPUT:                                       │    │
  │  │  <h1>Value: {'my-value'}</h1> ★★★                    │    │
  │  │                                                       │    │
  │  │  → THAY THẾ tại build time! ★★★                      │    │
  │  │  → Không phải runtime! ★                              │    │
  │  │                                                       │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```

---

## §2. Caveats — KHÔNG Destructure!

```
  CAVEATS:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  ⚠️ KHÔNG THỂ DESTRUCTURE process.env! ★★★                   │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │                                                       │    │
  │  │  // ❌ SAI — KHÔNG hoạt động!                           │    │
  │  │  const { customKey } = process.env  ★★★               │    │
  │  │  // → undefined! DefinePlugin chỉ replace              │    │
  │  │  //   EXACT string "process.env.customKey"! ★         │    │
  │  │                                                       │    │
  │  │  // ✅ ĐÚNG — phải dùng trực tiếp!                      │    │
  │  │  process.env.customKey  ★★★                           │    │
  │  │  // → 'my-value'! ★                                   │    │
  │  │                                                       │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  TẠI SAO?                                                      │
  │  → Webpack DefinePlugin thay THẾ CỤM TỪ chính xác! ★★★   │
  │  → "process.env.customKey" → "'my-value'"! ★               │
  │  → Destructure tách process.env → DefinePlugin KHÔNG       │
  │    nhận ra! ★★★                                           │
  │                                                              │
  │  ⚠️ LUÔN INCLUDED trong JS bundle! ★★★                       │
  │  → NEXT_PUBLIC_ prefix CHỈ có tác dụng                     │
  │    với .env files! ★                                       │
  │  → Config env {} LUÔN public! ★★★                         │
  │  → ĐỪNG đặt secrets ở đây! ★★★                           │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```

---

## §3. env Config vs .env Files!

```
  SO SÁNH:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  ┌──────────────┬────────────────┬──────────────────────┐    │
  │  │ Feature        │ env (config)    │ .env files            │    │
  │  ├──────────────┼────────────────┼──────────────────────┤    │
  │  │ Khai báo      │ next.config.js │ .env, .env.local...  │    │
  │  │ NEXT_PUBLIC_  │ KHÔNG cần! ★★★│ CẦN cho client! ★★★ │    │
  │  │              │ (luôn public)  │                      │    │
  │  │ Server-only   │ ❌ KHÔNG! ★★★   │ ✅ CÓ (không prefix) │    │
  │  │ Destructure   │ ❌ KHÔNG! ★★★   │ ❌ KHÔNG! ★★★         │    │
  │  │ Recommend     │ Legacy ★       │ ✅ PREFERRED! ★★★     │    │
  │  └──────────────┴────────────────┴──────────────────────┘    │
  │                                                              │
  │  → .env files RECOMMENDED từ Next.js 9.4+! ★★★            │
  │  → env config vẫn hoạt động nhưng ít dùng! ★              │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```

---

## §4. Tự Viết — EnvConfigEngine!

```javascript
var EnvConfigEngine = (function () {
  // ═══════════════════════════════════
  // 1. BUILD-TIME REPLACER (DefinePlugin sim)
  // ═══════════════════════════════════
  function buildTimeReplace(sourceCode, envConfig) {
    var result = sourceCode;
    for (var key in envConfig) {
      // Replace exact "process.env.KEY" with value
      var pattern = "process.env." + key;
      while (result.indexOf(pattern) >= 0) {
        result = result.replace(pattern, "'" + envConfig[key] + "'");
      }
    }
    return {
      source: sourceCode,
      output: result,
      note: "Build-time replacement (DefinePlugin)! ★★★",
    };
  }

  // ═══════════════════════════════════
  // 2. DESTRUCTURE CHECKER
  // ═══════════════════════════════════
  function checkDestructure(code) {
    var hasDestructure =
      code.indexOf("} = process.env") >= 0 ||
      code.indexOf("}=process.env") >= 0;
    if (hasDestructure) {
      return {
        code: code,
        valid: false,
        error: "CANNOT destructure process.env! ★★★",
        fix: "Use process.env.KEY directly! ★",
      };
    }
    return { code: code, valid: true, note: "OK! ★" };
  }

  // ═══════════════════════════════════
  // 3. SECURITY CHECKER
  // ═══════════════════════════════════
  function checkSecurity(envConfig) {
    var warnings = [];
    var sensitivePatterns = ["SECRET", "PASSWORD", "TOKEN", "KEY", "PRIVATE"];
    for (var key in envConfig) {
      var upperKey = key.toUpperCase();
      for (var i = 0; i < sensitivePatterns.length; i++) {
        if (upperKey.indexOf(sensitivePatterns[i]) >= 0) {
          warnings.push({
            key: key,
            issue: "Possibly sensitive! INCLUDED in JS bundle! ★★★",
            fix: "Move to .env file (server-only)! ★",
          });
        }
      }
    }
    return {
      totalVars: Object.keys(envConfig).length,
      warnings: warnings,
      note:
        warnings.length > 0
          ? "SECURITY RISK! " + warnings.length + " sensitive vars exposed! ★★★"
          : "No sensitive vars detected! ★",
    };
  }

  // ═══════════════════════════════════
  // 4. DEMO
  // ═══════════════════════════════════
  function demo() {
    console.log("═══ EnvConfig Engine ═══");

    var envConfig = {
      API_URL: "https://api.example.com",
      APP_NAME: "MyApp",
    };

    console.log("\n── 1. Build-time Replace ──");
    console.log(
      buildTimeReplace(
        "<h1>{process.env.APP_NAME} at {process.env.API_URL}</h1>",
        envConfig,
      ),
    );

    console.log("\n── 2. Destructure Check ──");
    console.log(checkDestructure("const { API_URL } = process.env"));
    console.log(checkDestructure("const url = process.env.API_URL"));

    console.log("\n── 3. Security Check ──");
    console.log(checkSecurity({ API_URL: "...", DB_PASSWORD: "123" }));
    console.log(checkSecurity({ APP_NAME: "MyApp" }));
  }

  return { demo: demo };
})();
// Chạy: EnvConfigEngine.demo();
```

---

## §5. Câu Hỏi Phỏng Vấn!

```
  CÂU HỎI:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  ❓ 1: env config hoạt động thế nào?                           │
  │  → BUILD-TIME replacement! ★★★                             │
  │  → Webpack DefinePlugin thay cụm từ chính xác! ★          │
  │  → process.env.KEY → 'value' lúc build! ★                 │
  │                                                              │
  │  ❓ 2: Tại sao không destructure được?                         │
  │  → DefinePlugin chỉ replace EXACT string! ★★★             │
  │  → "process.env.KEY" → replaced! ★                         │
  │  → const { KEY } = process.env → KHÔNG replaced! ★★★     │
  │                                                              │
  │  ❓ 3: env config vs .env files?                               │
  │  → env config: LUÔN public (trong bundle)! ★★★            │
  │  → .env files: server-only (không NEXT_PUBLIC_)! ★★★      │
  │  → .env files = RECOMMENDED từ 9.4+! ★                    │
  │                                                              │
  │  ❓ 4: Có nên đặt secrets trong env config?                    │
  │  → KHÔNG! LUÔN included trong JS bundle! ★★★              │
  │  → Dùng .env file cho secrets! ★★★                        │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```
