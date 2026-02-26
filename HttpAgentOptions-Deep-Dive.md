# httpAgentOptions — Deep Dive!

> **Nguồn**: https://nextjs.org/docs/app/api-reference/config/next-config-js/httpAgentOptions
> **Ngôn ngữ**: Tiếng Việt — giải thích cực kỳ chi tiết!
> **Trang này KHÔNG có hình/diagram** — chỉ có text + code blocks!

---

## §1. httpAgentOptions Là Gì?

```
  httpAgentOptions — TỔNG QUAN:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  WHAT:                                                        │
  │  → Config cho HTTP Agent (server-side fetch)! ★             │
  │  → Mặc định: HTTP Keep-Alive = TRUE (bật)! ★★★            │
  │  → Node.js < 18: polyfill fetch() bằng undici! ★           │
  │  → Chỉ ảnh hưởng SERVER-SIDE fetch()! ★★★                │
  │                                                              │
  │  CONFIG:                                                      │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │  module.exports = {                                   │    │
  │  │    httpAgentOptions: {                                 │    │
  │  │      keepAlive: false  ← tắt Keep-Alive! ★           │    │
  │  │    }                                                   │    │
  │  │  }                                                     │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  HTTP KEEP-ALIVE:                                             │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │                                                       │    │
  │  │  KHÔNG Keep-Alive (keepAlive: false):                  │    │
  │  │  Req 1: TCP open → request → response → TCP close ★ │    │
  │  │  Req 2: TCP open → request → response → TCP close ★ │    │
  │  │  Req 3: TCP open → request → response → TCP close ★ │    │
  │  │  → 3 lần TCP handshake! CHẬM! ★★★                   │    │
  │  │                                                       │    │
  │  │  CÓ Keep-Alive (keepAlive: true — DEFAULT):            │    │
  │  │  TCP open → Req 1 → Res 1                             │    │
  │  │           → Req 2 → Res 2  (reuse connection!) ★★★   │    │
  │  │           → Req 3 → Res 3  (reuse!) ★★★              │    │
  │  │           → TCP close (khi idle)                       │    │
  │  │  → 1 lần TCP handshake! NHANH! ★★★                   │    │
  │  │                                                       │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```

---

## §2. Khi Nào Tắt?

```
  KHI NÀO TẮT:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  GIỮ BẬT (mặc định — recommended):                           │
  │  → Hầu hết apps! ★★★                                      │
  │  → Giảm latency cho server-side fetch! ★                  │
  │  → Reuse TCP connections! ★                                │
  │                                                              │
  │  TẮT khi:                                                     │
  │  → Backend/API không hỗ trợ Keep-Alive! ★                 │
  │  → Connection pool issues (memory/leaks)! ★                │
  │  → Serverless functions (short-lived)! ★                   │
  │  → Debug connection problems! ★                            │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```

---

## §3. Tự Viết — HttpAgentEngine!

```javascript
var HttpAgentEngine = (function () {
  // ═══════════════════════════════════
  // 1. CONNECTION SIMULATOR
  // ═══════════════════════════════════
  function simulateRequests(count, keepAlive) {
    var handshakes = keepAlive ? 1 : count;
    var connections = keepAlive ? 1 : count;
    var latencyPerHandshake = 50; // ms
    var latencyPerRequest = 20; // ms

    var totalLatency =
      handshakes * latencyPerHandshake + count * latencyPerRequest;

    return {
      keepAlive: keepAlive,
      requests: count,
      tcpHandshakes: handshakes,
      connections: connections,
      totalLatency: totalLatency + "ms",
      saved: keepAlive
        ? (count - 1) * latencyPerHandshake + "ms saved! ★★★"
        : "0ms saved ★",
    };
  }

  // ═══════════════════════════════════
  // 2. CONFIG RESOLVER
  // ═══════════════════════════════════
  function resolveConfig(httpAgentOptions) {
    var keepAlive = true; // default
    if (httpAgentOptions && httpAgentOptions.keepAlive === false) {
      keepAlive = false;
    }
    return {
      keepAlive: keepAlive,
      note: keepAlive
        ? "Keep-Alive ON! Reuse connections! ★★★"
        : "Keep-Alive OFF! New connection per request! ★",
    };
  }

  // ═══════════════════════════════════
  // 3. DEMO
  // ═══════════════════════════════════
  function demo() {
    console.log("═══ HttpAgent Engine ═══");

    console.log("\n── 1. Config ──");
    console.log("Default:", resolveConfig(undefined));
    console.log("Disabled:", resolveConfig({ keepAlive: false }));

    console.log("\n── 2. Connection Simulation ──");
    console.log("5 req, Keep-Alive:", simulateRequests(5, true));
    console.log("5 req, No Keep-Alive:", simulateRequests(5, false));
    console.log("10 req, Keep-Alive:", simulateRequests(10, true));
    console.log("10 req, No Keep-Alive:", simulateRequests(10, false));
  }

  return { demo: demo };
})();
// Chạy: HttpAgentEngine.demo();
```

---

## §4. Câu Hỏi Phỏng Vấn!

```
  CÂU HỎI:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  ❓ 1: httpAgentOptions dùng làm gì?                           │
  │  → Config HTTP Agent cho server-side fetch! ★              │
  │  → Mặc định: keepAlive = true! ★★★                        │
  │                                                              │
  │  ❓ 2: Keep-Alive là gì?                                       │
  │  → Reuse TCP connection cho nhiều requests! ★★★            │
  │  → Giảm TCP handshake overhead! ★                          │
  │  → 1 connection thay vì N connections! ★★★                │
  │                                                              │
  │  ❓ 3: Khi nào tắt?                                            │
  │  → Backend không hỗ trợ! ★                                │
  │  → Connection pool issues! ★                               │
  │  → Serverless (short-lived)! ★                             │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```
