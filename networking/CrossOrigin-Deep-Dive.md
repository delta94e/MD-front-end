# crossOrigin — Deep Dive!

> **Nguồn**: https://nextjs.org/docs/app/api-reference/config/next-config-js/crossOrigin
> **Ngôn ngữ**: Tiếng Việt — giải thích cực kỳ chi tiết!
> **Trang này KHÔNG có hình/diagram** — chỉ có text + code blocks!

---

## §1. crossOrigin Là Gì?

```
  crossOrigin — TỔNG QUAN:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  WHAT:                                                        │
  │  → Thêm crossOrigin attribute vào TẤT CẢ <script> tags! ★  │
  │  → Generated bởi next/script component! ★                  │
  │  → Định nghĩa cách xử lý cross-origin requests! ★★★       │
  │                                                              │
  │  CONFIG:                                                      │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │  module.exports = {                                   │    │
  │  │    crossOrigin: 'anonymous'  ← hoặc 'use-credentials' │    │
  │  │  }                                                     │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  OUTPUT:                                                      │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │  // Không config:                                      │    │
  │  │  <script src="/_next/static/chunks/main.js"></script> │    │
  │  │                                                       │    │
  │  │  // crossOrigin: 'anonymous':                          │    │
  │  │  <script src="/_next/static/chunks/main.js"           │    │
  │  │          crossorigin="anonymous"></script> ★★★         │    │
  │  │                                                       │    │
  │  │  // crossOrigin: 'use-credentials':                    │    │
  │  │  <script src="/_next/static/chunks/main.js"           │    │
  │  │          crossorigin="use-credentials"></script> ★     │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```

---

## §2. 2 Options!

```
  OPTIONS:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  ┌──────────────────┬───────────────────────────────────┐    │
  │  │ Value              │ Hành vi                           │    │
  │  ├──────────────────┼───────────────────────────────────┤    │
  │  │ 'anonymous'        │ → CORS request! ★★★               │    │
  │  │                   │ → KHÔNG gửi credentials! ★        │    │
  │  │                   │ → Không cookies, no auth! ★       │    │
  │  │                   │ → PHỔ BIẾN NHẤT! ★★★               │    │
  │  ├──────────────────┼───────────────────────────────────┤    │
  │  │ 'use-credentials'  │ → CORS request! ★                  │    │
  │  │                   │ → CÓ gửi credentials! ★★★         │    │
  │  │                   │ → Cookies + auth headers! ★       │    │
  │  │                   │ → Server PHẢI cho phép! ★         │    │
  │  └──────────────────┴───────────────────────────────────┘    │
  │                                                              │
  │  FLOW:                                                        │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │                                                       │    │
  │  │  crossOrigin: 'anonymous' (phổ biến):                  │    │
  │  │  Browser ──→ CDN (script src)                          │    │
  │  │  Request:  Origin: https://myapp.com                   │    │
  │  │  Response: Access-Control-Allow-Origin: *              │    │
  │  │  → KHÔNG gửi cookies! ★                               │    │
  │  │                                                       │    │
  │  │  crossOrigin: 'use-credentials' (ít dùng):             │    │
  │  │  Browser ──→ CDN (script src)                          │    │
  │  │  Request:  Origin: https://myapp.com + Cookies! ★★★   │    │
  │  │  Response: Access-Control-Allow-Origin: https://myapp  │    │
  │  │            Access-Control-Allow-Credentials: true      │    │
  │  │  → Server PHẢI whitelist domain cụ thể! ★★★          │    │
  │  │  → KHÔNG thể dùng wildcard (*)! ★★★                  │    │
  │  │                                                       │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```

---

## §3. Khi Nào Cần?

```
  USE CASES:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  ① CDN cho scripts (anonymous):                               │
  │  → Scripts serve từ CDN khác domain! ★                     │
  │  → Error tracking cần crossOrigin! ★★★                     │
  │  → Không có crossOrigin → Script errors = "Script error"!  │
  │  → Có crossOrigin → Xem full error message! ★★★           │
  │                                                              │
  │  ② Authenticated CDN (use-credentials):                       │
  │  → CDN cần auth (private CDN)! ★                           │
  │  → Scripts yêu cầu cookies! ★                              │
  │  → ÍT PHỔ BIẾN! ★                                          │
  │                                                              │
  │  ③ Error Monitoring (Sentry, Datadog):                        │
  │  → crossOrigin: 'anonymous' → cần cho error tracking! ★★★ │
  │  → Không có → chỉ thấy "Script error" — vô dụng! ★★★    │
  │                                                              │
  │  ERROR TRACKING:                                              │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │                                                       │    │
  │  │  KHÔNG CÓ crossOrigin:                                 │    │
  │  │  window.onerror → "Script error." (line 0, col 0)    │    │
  │  │  → Không biết lỗi gì! ★★★                            │    │
  │  │                                                       │    │
  │  │  CÓ crossOrigin: 'anonymous':                          │    │
  │  │  window.onerror → "TypeError: x is not a function"   │    │
  │  │                    (main.js, line 42, col 15) ★★★     │    │
  │  │  → Full error details! Debug được! ★★★               │    │
  │  │                                                       │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```

---

## §4. Tự Viết — CrossOriginEngine!

```javascript
var CrossOriginEngine = (function () {
  // ═══════════════════════════════════
  // 1. SCRIPT TAG GENERATOR
  // ═══════════════════════════════════
  function generateScriptTag(src, crossOrigin) {
    var tag = '<script src="' + src + '"';
    if (crossOrigin) {
      tag += ' crossorigin="' + crossOrigin + '"';
    }
    tag += "></script>";
    return {
      tag: tag,
      crossOrigin: crossOrigin || "none",
      note: crossOrigin
        ? "crossOrigin applied! ★"
        : "No crossOrigin attribute! ★",
    };
  }

  // ═══════════════════════════════════
  // 2. CORS REQUEST SIMULATOR
  // ═══════════════════════════════════
  function simulateCORSRequest(scriptSrc, appOrigin, crossOrigin) {
    var request = {
      url: scriptSrc,
      headers: { Origin: appOrigin },
    };

    // Add credentials if use-credentials
    if (crossOrigin === "use-credentials") {
      request.headers.Cookie = "session=abc123";
      request.credentials = true;
    }

    // Simulate server response
    var response = {};
    if (crossOrigin === "anonymous") {
      response = {
        "Access-Control-Allow-Origin": "*",
        note: "Wildcard OK! No credentials sent! ★",
      };
    } else if (crossOrigin === "use-credentials") {
      response = {
        "Access-Control-Allow-Origin": appOrigin,
        "Access-Control-Allow-Credentials": "true",
        note: "Must whitelist exact origin! No wildcard! ★★★",
      };
    } else {
      response = {
        note: "No CORS headers needed (same-origin)! ★",
      };
    }

    return {
      crossOrigin: crossOrigin || "none",
      request: request,
      response: response,
    };
  }

  // ═══════════════════════════════════
  // 3. ERROR TRACKING SIMULATOR
  // ═══════════════════════════════════
  function simulateError(hasCrossOrigin) {
    if (!hasCrossOrigin) {
      return {
        message: "Script error.",
        filename: "",
        lineno: 0,
        colno: 0,
        useful: false,
        note: "NO crossOrigin → useless error! ★★★",
      };
    }
    return {
      message: "TypeError: Cannot read property 'map' of undefined",
      filename: "https://cdn.example.com/_next/static/chunks/main.js",
      lineno: 142,
      colno: 23,
      useful: true,
      note: "WITH crossOrigin → full error details! ★★★",
    };
  }

  // ═══════════════════════════════════
  // 4. DEMO
  // ═══════════════════════════════════
  function demo() {
    console.log("═══ CrossOrigin Engine ═══");

    var cdnScript = "https://cdn.example.com/_next/static/chunks/main.js";

    console.log("\n── 1. Script Tags ──");
    console.log("No attr:", generateScriptTag(cdnScript, null));
    console.log("anonymous:", generateScriptTag(cdnScript, "anonymous"));
    console.log("use-cred:", generateScriptTag(cdnScript, "use-credentials"));

    console.log("\n── 2. CORS Requests ──");
    console.log(
      "anonymous:",
      simulateCORSRequest(cdnScript, "https://myapp.com", "anonymous"),
    );
    console.log(
      "use-credentials:",
      simulateCORSRequest(cdnScript, "https://myapp.com", "use-credentials"),
    );

    console.log("\n── 3. Error Tracking ──");
    console.log("Without:", simulateError(false));
    console.log("With:", simulateError(true));
  }

  return { demo: demo };
})();
// Chạy: CrossOriginEngine.demo();
```

---

## §5. Câu Hỏi Phỏng Vấn!

```
  CÂU HỎI:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  ❓ 1: crossOrigin config làm gì?                              │
  │  → Thêm crossorigin attr vào TẤT CẢ <script> tags! ★     │
  │  → From next/script component! ★                            │
  │  → Định nghĩa CORS policy cho scripts! ★★★                │
  │                                                              │
  │  ❓ 2: anonymous vs use-credentials?                           │
  │  → anonymous: CORS nhưng KHÔNG gửi cookies! ★★★           │
  │  → use-credentials: CORS + gửi cookies! ★                  │
  │  → use-credentials: server phải whitelist domain! ★★★     │
  │  → use-credentials: KHÔNG dùng wildcard (*)! ★★★          │
  │                                                              │
  │  ❓ 3: Tại sao cần cho error tracking?                         │
  │  → Không crossOrigin → "Script error." (vô dụng)! ★★★    │
  │  → Có crossOrigin → full error + file + line! ★★★         │
  │  → Sentry, Datadog cần crossOrigin: 'anonymous'! ★        │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```
