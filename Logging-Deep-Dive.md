# logging — Deep Dive!

> **Nguồn**: https://nextjs.org/docs/app/api-reference/config/next-config-js/logging
> **Ngôn ngữ**: Tiếng Việt — giải thích cực kỳ chi tiết!
> **Trang này KHÔNG có hình/diagram** — chỉ có text + code blocks!

---

## §1. logging Là Gì?

```
  logging — TỔNG QUAN:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  WHAT:                                                        │
  │  → Config logging cho DEV MODE! ★★★                        │
  │  → 2 loại: Fetch logs + Incoming request logs! ★           │
  │  → Chỉ development! KHÔNG ảnh hưởng production! ★★★      │
  │                                                              │
  │  3 OPTIONS:                                                   │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │                                                       │    │
  │  │  ① fetches.fullUrl: true                               │    │
  │  │  → Log FULL URL của fetch requests! ★★★               │    │
  │  │                                                       │    │
  │  │  ② fetches.hmrRefreshes: true                          │    │
  │  │  → Log cả fetch từ HMR cache! ★                      │    │
  │  │  → Mặc định: KHÔNG log HMR fetches! ★                │    │
  │  │                                                       │    │
  │  │  ③ incomingRequests                                     │    │
  │  │  → Log incoming requests (default: all)! ★            │    │
  │  │  → ignore: [regex] để skip! ★                        │    │
  │  │  → false để tắt hoàn toàn! ★                        │    │
  │  │                                                       │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  CONFIGS:                                                     │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │                                                       │    │
  │  │  // Full URL + HMR fetch logs:                         │    │
  │  │  logging: {                                            │    │
  │  │    fetches: {                                          │    │
  │  │      fullUrl: true,         ★★★                       │    │
  │  │      hmrRefreshes: true     ★                         │    │
  │  │    }                                                   │    │
  │  │  }                                                     │    │
  │  │                                                       │    │
  │  │  // Ignore health check requests:                      │    │
  │  │  logging: {                                            │    │
  │  │    incomingRequests: {                                  │    │
  │  │      ignore: [/\/api\/v1\/health/]  ★                 │    │
  │  │    }                                                   │    │
  │  │  }                                                     │    │
  │  │                                                       │    │
  │  │  // Tắt incoming request logs:                          │    │
  │  │  logging: { incomingRequests: false }  ★               │    │
  │  │                                                       │    │
  │  │  // Tắt TẤT CẢ logging:                                │    │
  │  │  logging: false  ★★★                                   │    │
  │  │                                                       │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  ⚠️ Fetch logging chỉ cho fetch API! ★                        │
  │  → Không áp dụng cho logs khác! ★                          │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```

---

## §2. Tự Viết — LoggingEngine!

```javascript
var LoggingEngine = (function () {
  // ═══════════════════════════════════
  // 1. CONFIG RESOLVER
  // ═══════════════════════════════════
  function resolveConfig(logging) {
    if (logging === false) {
      return { enabled: false, note: "All logging disabled! ★★★" };
    }
    if (!logging) {
      return {
        enabled: true,
        fetches: { fullUrl: false, hmrRefreshes: false },
        incomingRequests: true,
        note: "Default logging! ★",
      };
    }

    var fetchConfig = logging.fetches || {};
    var inReq = logging.incomingRequests;

    return {
      enabled: true,
      fetches: {
        fullUrl: fetchConfig.fullUrl || false,
        hmrRefreshes: fetchConfig.hmrRefreshes || false,
      },
      incomingRequests: inReq !== false,
      ignorePatterns: (inReq && inReq.ignore) || [],
    };
  }

  // ═══════════════════════════════════
  // 2. FETCH LOGGER
  // ═══════════════════════════════════
  function logFetch(url, config, isHmrCached) {
    var resolved = resolveConfig(config);
    if (!resolved.enabled) return { logged: false, note: "Logging off! ★" };

    if (isHmrCached && !resolved.fetches.hmrRefreshes) {
      return { logged: false, note: "HMR fetch skipped! ★" };
    }

    var displayUrl = resolved.fetches.fullUrl ? url : url.split("?")[0]; // Strip query params

    return {
      logged: true,
      url: displayUrl,
      fullUrl: resolved.fetches.fullUrl,
      hmrCached: isHmrCached || false,
    };
  }

  // ═══════════════════════════════════
  // 3. REQUEST FILTER
  // ═══════════════════════════════════
  function shouldLogRequest(path, config) {
    var resolved = resolveConfig(config);
    if (!resolved.enabled || !resolved.incomingRequests) {
      return { path: path, logged: false, note: "Request logging off! ★" };
    }

    var patterns = resolved.ignorePatterns || [];
    for (var i = 0; i < patterns.length; i++) {
      if (patterns[i].test(path)) {
        return { path: path, logged: false, note: "Ignored by pattern! ★" };
      }
    }
    return { path: path, logged: true };
  }

  // ═══════════════════════════════════
  // 4. DEMO
  // ═══════════════════════════════════
  function demo() {
    console.log("═══ Logging Engine ═══");

    var config = {
      fetches: { fullUrl: true, hmrRefreshes: true },
      incomingRequests: { ignore: [/\/api\/health/] },
    };

    console.log("\n── 1. Config ──");
    console.log(resolveConfig(config));
    console.log(resolveConfig(false));

    console.log("\n── 2. Fetch Logger ──");
    console.log(logFetch("https://api.com/data?key=123", config, false));
    console.log(logFetch("https://api.com/data", config, true));
    console.log(logFetch("https://api.com/data", false, false));

    console.log("\n── 3. Request Filter ──");
    console.log(shouldLogRequest("/page/home", config));
    console.log(shouldLogRequest("/api/health", config));
  }

  return { demo: demo };
})();
// Chạy: LoggingEngine.demo();
```

---

## §3. Câu Hỏi Phỏng Vấn!

```
  CÂU HỎI:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  ❓ 1: logging config dùng làm gì?                             │
  │  → Config logging cho DEV mode! ★★★                       │
  │  → Fetch logs + incoming request logs! ★                   │
  │  → KHÔNG ảnh hưởng production! ★★★                        │
  │                                                              │
  │  ❓ 2: fetches options?                                        │
  │  → fullUrl: true → log full URL! ★★★                      │
  │  → hmrRefreshes: true → log HMR cached fetches! ★         │
  │  → Mặc định: KHÔNG log HMR + không full URL! ★           │
  │                                                              │
  │  ❓ 3: incomingRequests?                                       │
  │  → Default: log TẤT CẢ requests! ★                        │
  │  → ignore: [regex] để skip (health checks)! ★★★          │
  │  → false để tắt hoàn toàn! ★                             │
  │                                                              │
  │  ❓ 4: Tắt toàn bộ logging?                                   │
  │  → logging: false ★★★                                      │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```
