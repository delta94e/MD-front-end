# poweredByHeader — Deep Dive!

> **Nguồn**: https://nextjs.org/docs/app/api-reference/config/next-config-js/poweredByHeader
> **Ngôn ngữ**: Tiếng Việt — giải thích cực kỳ chi tiết!
> **Trang này KHÔNG có hình/diagram** — chỉ có text + code blocks!

---

## §1. poweredByHeader Là Gì?

```
  poweredByHeader — TỔNG QUAN:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  WHAT:                                                        │
  │  → Next.js thêm header: x-powered-by: Next.js! ★★★       │
  │  → Default: BẬT (true)! ★                                 │
  │  → poweredByHeader: false để TẮT! ★★★                    │
  │                                                              │
  │  DEFAULT RESPONSE HEADERS:                                    │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │  HTTP/1.1 200 OK                                       │    │
  │  │  Content-Type: text/html                               │    │
  │  │  x-powered-by: Next.js ← ★★★ HEADER NÀY!            │    │
  │  │  ...                                                   │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  TẠI SAO TẮT:                                                 │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │  ⚠️ BẢO MẬT:                                           │    │
  │  │  → Attacker biết bạn dùng Next.js! ★★★               │    │
  │  │  → Target specific Next.js vulnerabilities! ★★★      │    │
  │  │  → "Security through obscurity" ★                    │    │
  │  │                                                       │    │
  │  │  → TẮT = giấu technology stack! ★★★                  │    │
  │  │  → Hacker khó target hơn! ★                          │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  CONFIG:                                                      │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │  module.exports = {                                   │    │
  │  │    poweredByHeader: false  ★★★                         │    │
  │  │  }                                                     │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```

---

## §2. Tự Viết — PoweredByHeaderEngine!

```javascript
var PoweredByHeaderEngine = (function () {
  // ═══════════════════════════════════
  // 1. HEADER BUILDER
  // ═══════════════════════════════════
  function buildHeaders(config) {
    var headers = {
      "Content-Type": "text/html",
      "Cache-Control": "no-store",
    };

    if (config.poweredByHeader !== false) {
      headers["x-powered-by"] = "Next.js";
    }

    return headers;
  }

  // ═══════════════════════════════════
  // 2. SECURITY SCANNER (simulate attacker)
  // ═══════════════════════════════════
  function scanHeaders(headers) {
    var risks = [];

    if (headers["x-powered-by"]) {
      risks.push({
        header: "x-powered-by",
        value: headers["x-powered-by"],
        risk: "HIGH",
        note: "⚠️ Framework exposed! Attacker knows tech stack! ★★★",
      });
    }

    return {
      headersExposed: Object.keys(headers).length,
      risks: risks.length,
      secure: risks.length === 0,
      details: risks,
      note:
        risks.length === 0
          ? "✅ No framework info leaked! ★★★"
          : "❌ Framework info leaked! ★★★",
    };
  }

  // ═══════════════════════════════════
  // 3. DEMO
  // ═══════════════════════════════════
  function demo() {
    console.log("═══ PoweredByHeader Engine ═══");

    console.log("\n── 1. Default (header ON) ──");
    var headersOn = buildHeaders({});
    console.log(headersOn);
    console.log(scanHeaders(headersOn));

    console.log("\n── 2. Disabled (header OFF) ──");
    var headersOff = buildHeaders({ poweredByHeader: false });
    console.log(headersOff);
    console.log(scanHeaders(headersOff));
  }

  return { demo: demo };
})();
// Chạy: PoweredByHeaderEngine.demo();
```

---

## §3. Câu Hỏi Phỏng Vấn!

```
  CÂU HỎI:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  ❓ 1: poweredByHeader làm gì?                                │
  │  → Thêm header x-powered-by: Next.js! ★★★                │
  │  → Default: BẬT! ★                                        │
  │                                                              │
  │  ❓ 2: Tại sao nên tắt?                                       │
  │  → Bảo mật: giấu tech stack! ★★★                        │
  │  → Attacker không biết bạn dùng Next.js! ★                │
  │  → Giảm surface area cho attacks! ★★★                    │
  │                                                              │
  │  ❓ 3: Cách tắt?                                              │
  │  → poweredByHeader: false! ★★★                            │
  │  → 1 dòng config! ★                                       │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```
