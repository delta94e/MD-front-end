# Next.js Instrumentation — Deep Dive!

> **Chủ đề**: Instrumentation — Chạy code khi Server Khởi Động!
> **Ngôn ngữ**: Tiếng Việt — giải thích cực kỳ chi tiết!
> **Phương châm**: Tự viết lại bằng tay — KHÔNG dùng thư viện!
> **Nguồn**: https://nextjs.org/docs/app/guides/instrumentation
> **Lưu ý**: Trang gốc KHÔNG có sơ đồ — tất cả diagrams là TỰ VẼ!

---

## Mục Lục

1. [§1. Instrumentation Là Gì? — Tổng Quan](#1)
2. [§2. Convention — File + register()](#2)
3. [§3. Side Effects Import](#3)
4. [§4. Runtime-Specific Code — NEXT_RUNTIME](#4)
5. [§5. Use Cases — Khi Nào Cần Instrumentation?](#5)
6. [§6. Tự Viết — InstrumentationEngine](#6)
7. [§7. Câu Hỏi Luyện Tập](#7)

---

## §1. Instrumentation Là Gì? — Tổng Quan!

```
  INSTRUMENTATION — BIG PICTURE:
  ┌────────────────────────────────────────────────────────────┐
  │                                                            │
  │  ĐỊNH NGHĨA:                                              │
  │  Instrumentation = quá trình TÍCH HỢP monitoring &       │
  │  logging tools VÀO ứng dụng bằng code!                   │
  │                                                            │
  │  MỤC ĐÍCH:                                                │
  │  ┌──────────────────────────────────────────────────────┐  │
  │  │ ① Track PERFORMANCE (response time, throughput)     │  │
  │  │ ② Track BEHAVIOR (user actions, API calls)          │  │
  │  │ ③ DEBUG issues in PRODUCTION!                       │  │
  │  │ ④ Integrate monitoring: OpenTelemetry, Sentry,     │  │
  │  │    Datadog, New Relic, Prometheus...                 │  │
  │  └──────────────────────────────────────────────────────┘  │
  │                                                            │
  │  NEXT.JS APPROACH:                                         │
  │  ┌──────────────────────────────────────────────────────┐  │
  │  │                                                      │  │
  │  │  instrumentation.ts                                  │  │
  │  │  ┌────────────────────────────────────────────────┐  │  │
  │  │  │ export function register() {                   │  │  │
  │  │  │   // Chạy 1 LẦN DUY NHẤT khi server start!   │  │  │
  │  │  │   // TRƯỚC KHI server sẵn sàng nhận request! │  │  │
  │  │  │   // Setup: OTel, Sentry, DB pools, etc.      │  │  │
  │  │  │ }                                              │  │  │
  │  │  └────────────────────────────────────────────────┘  │  │
  │  │                                                      │  │
  │  └──────────────────────────────────────────────────────┘  │
  │                                                            │
  └────────────────────────────────────────────────────────────┘
```

```
  SERVER STARTUP TIMELINE:
  ┌────────────────────────────────────────────────────────────┐
  │                                                            │
  │  next start / next dev                                     │
  │  │                                                         │
  │  ▼                                                         │
  │  ┌──────────────────────┐                                  │
  │  │  New server instance  │                                  │
  │  └──────────┬───────────┘                                  │
  │             │                                              │
  │             ▼                                              │
  │  ┌──────────────────────┐                                  │
  │  │  register() called!  │ ← instrumentation.ts            │
  │  │  • Setup OTel        │                                  │
  │  │  • Init Sentry       │                                  │
  │  │  • Connect DB pool   │                                  │
  │  │  • Register globals  │                                  │
  │  └──────────┬───────────┘                                  │
  │             │                                              │
  │             ▼                                              │
  │  ┌──────────────────────┐                                  │
  │  │  register() COMPLETE │                                  │
  │  └──────────┬───────────┘                                  │
  │             │                                              │
  │             ▼                                              │
  │  ┌──────────────────────┐                                  │
  │  │  Server READY!       │ ← Bắt đầu nhận requests!       │
  │  │  Handling requests...│                                  │
  │  └──────────────────────┘                                  │
  │                                                            │
  │  ⚠️ register() PHẢI complete TRƯỚC KHI server ready!     │
  │  → Blocking! Đảm bảo monitoring sẵn sàng!              │
  │                                                            │
  └────────────────────────────────────────────────────────────┘
```

---

## §2. Convention — File + register()!

```
  FILE PLACEMENT:
  ┌──────────────────────────────────────────────────────────┐
  │                                                          │
  │  Cách 1: KHÔNG có /src                                   │
  │  project-root/                                           │
  │  ├── instrumentation.ts    ← ĐẶT Ở ĐÂY!              │
  │  ├── app/                                                │
  │  │   └── page.tsx                                        │
  │  ├── next.config.js                                      │
  │  └── package.json                                        │
  │                                                          │
  │  Cách 2: CÓ /src                                         │
  │  project-root/                                           │
  │  ├── src/                                                │
  │  │   ├── instrumentation.ts  ← ĐẶT TRONG src/!        │
  │  │   ├── app/                                            │
  │  │   │   └── page.tsx                                    │
  │  │   └── pages/                                          │
  │  ├── next.config.js                                      │
  │  └── package.json                                        │
  │                                                          │
  │  ⚠️ KHÔNG đặt trong app/ hay pages/!                    │
  │  ⚠️ Dùng pageExtensions? → Đổi tên file tương ứng!    │
  │                                                          │
  └──────────────────────────────────────────────────────────┘
```

**OpenTelemetry example:**

```typescript
// instrumentation.ts
import { registerOTel } from "@vercel/otel";

export function register() {
  registerOTel("next-app");
}
```

```
  register() FUNCTION:
  ┌──────────────────────────────────────────────────────────┐
  │                                                          │
  │  ① Export function tên "register"                        │
  │  ② Gọi 1 LẦN khi new server instance khởi tạo         │
  │  ③ PHẢI complete TRƯỚC KHI server ready                 │
  │  ④ Có thể async (return Promise)!                      │
  │  ⑤ Gọi cho MỌI environment (Node.js + Edge!)          │
  │                                                          │
  └──────────────────────────────────────────────────────────┘
```

---

## §3. Side Effects Import!

```
  SIDE EFFECTS — TẠI SAO CẦN?
  ┌────────────────────────────────────────────────────────────┐
  │                                                            │
  │  Một số package tạo "side effects" khi import:            │
  │  → Đăng ký global variables                              │
  │  → Setup monkey-patching                                  │
  │  → Init tracing/monitoring                                │
  │  → Modify prototype chains                                │
  │                                                            │
  │  VÍ DỤ: import 'tracing-package'                          │
  │  → KHÔNG dùng gì export ra                              │
  │  → NHƯNG package tự setup globals khi import!            │
  │                                                            │
  │  ❌ SAI — Import ở top-level:                             │
  │  ┌──────────────────────────────────────────────────────┐  │
  │  │  import 'package-with-side-effect' // TOP OF FILE!  │  │
  │  │  export function register() { ... }                  │  │
  │  │                                                      │  │
  │  │  → Side effect chạy TRƯỚC register()!               │  │
  │  │  → Không kiểm soát được thời điểm!                 │  │
  │  │  → Có thể gây lỗi nếu phụ thuộc thứ tự!          │  │
  │  └──────────────────────────────────────────────────────┘  │
  │                                                            │
  │  ✅ ĐÚNG — Import TRONG register():                       │
  │  ┌──────────────────────────────────────────────────────┐  │
  │  │  export async function register() {                  │  │
  │  │    await import('package-with-side-effect')          │  │
  │  │  }                                                    │  │
  │  │                                                      │  │
  │  │  → Side effect chạy ĐÚNG LÚC register()!           │  │
  │  │  → Tập trung side effects 1 chỗ!                   │  │
  │  │  → Kiểm soát hoàn toàn!                            │  │
  │  └──────────────────────────────────────────────────────┘  │
  │                                                            │
  └────────────────────────────────────────────────────────────┘
```

---

## §4. Runtime-Specific Code — NEXT_RUNTIME!

```
  NEXT_RUNTIME — 2 ENVIRONMENTS:
  ┌────────────────────────────────────────────────────────────┐
  │                                                            │
  │  Next.js gọi register() trong MỌI environment!           │
  │  → Node.js runtime AND Edge runtime!                      │
  │                                                            │
  │  VẤN ĐỀ: Code Node.js-only (fs, net, database...)        │
  │  → Import trong Edge → CRASH!                            │
  │                                                            │
  │  GIẢI PHÁP: process.env.NEXT_RUNTIME                      │
  │  ┌──────────────────────────────────────────────────────┐  │
  │  │  NEXT_RUNTIME = 'nodejs'                             │  │
  │  │  → Server-side Node.js                               │  │
  │  │  → Có fs, net, crypto, database drivers...          │  │
  │  │                                                      │  │
  │  │  NEXT_RUNTIME = 'edge'                               │  │
  │  │  → Edge Runtime (Middleware, Edge routes)             │  │
  │  │  → KHÔNG có fs, net, full crypto!                   │  │
  │  │  → Web APIs only!                                    │  │
  │  └──────────────────────────────────────────────────────┘  │
  │                                                            │
  │  ⚠️ Dynamic import() là BẮT BUỘC!                        │
  │  → Static import ở top-level → load cho CẢ 2 runtime!  │
  │  → Dynamic import trong if → chỉ load khi cần!         │
  │                                                            │
  └────────────────────────────────────────────────────────────┘
```

```typescript
// instrumentation.ts
export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    await import("./instrumentation-node");
    // → Sentry, Prisma, database pools, pino logger...
  }

  if (process.env.NEXT_RUNTIME === "edge") {
    await import("./instrumentation-edge");
    // → Lightweight tracing, edge-compatible monitoring...
  }
}
```

```
  DYNAMIC IMPORT FLOW:
  ┌──────────────────────────────────────────────────────────┐
  │                                                          │
  │  register() called                                       │
  │       │                                                  │
  │       ├── NEXT_RUNTIME === 'nodejs'?                     │
  │       │   ├── YES → import('./instrumentation-node')    │
  │       │   │   ├── Setup Sentry                          │
  │       │   │   ├── Init DB connection pool               │
  │       │   │   └── Register Node.js metrics              │
  │       │   └── NO → skip!                                │
  │       │                                                  │
  │       ├── NEXT_RUNTIME === 'edge'?                       │
  │       │   ├── YES → import('./instrumentation-edge')    │
  │       │   │   └── Setup lightweight tracing             │
  │       │   └── NO → skip!                                │
  │       │                                                  │
  │       └── register() complete → server ready!           │
  │                                                          │
  └──────────────────────────────────────────────────────────┘
```

---

## §5. Use Cases — Khi Nào Cần Instrumentation?

```
  USE CASES:
  ┌──────────────────────────────────────────────────────────┐
  │                                                          │
  │  ① OBSERVABILITY — Monitoring & Tracing                  │
  │  ┌────────────────────────────────────────────────────┐  │
  │  │ • OpenTelemetry → distributed tracing             │  │
  │  │ • @vercel/otel → Vercel-specific OTel             │  │
  │  │ • Sentry → error tracking                          │  │
  │  │ • Datadog → APM & metrics                          │  │
  │  │ • New Relic → performance monitoring               │  │
  │  └────────────────────────────────────────────────────┘  │
  │                                                          │
  │  ② INITIALIZATION — Server Startup                       │
  │  ┌────────────────────────────────────────────────────┐  │
  │  │ • Database connection pools                        │  │
  │  │ • Redis client connections                         │  │
  │  │ • Message queue consumers (RabbitMQ, Kafka)        │  │
  │  │ • Cron job schedulers                              │  │
  │  └────────────────────────────────────────────────────┘  │
  │                                                          │
  │  ③ GLOBAL SETUP                                          │
  │  ┌────────────────────────────────────────────────────┐  │
  │  │ • Global error handlers                            │  │
  │  │ • Polyfills for server                             │  │
  │  │ • Environment validation                           │  │
  │  │ • Feature flag initialization                      │  │
  │  └────────────────────────────────────────────────────┘  │
  │                                                          │
  │  ④ LOGGING SETUP                                         │
  │  ┌────────────────────────────────────────────────────┐  │
  │  │ • Structured logging (pino, winston)               │  │
  │  │ • Log transport (file, cloud, ELK stack)           │  │
  │  │ • Request correlation IDs                          │  │
  │  └────────────────────────────────────────────────────┘  │
  │                                                          │
  └──────────────────────────────────────────────────────────┘
```

---

## §6. Tự Viết — InstrumentationEngine!

```javascript
var InstrumentationEngine = (function () {
  // ═══════════════════════════════════
  // 1. SERVER LIFECYCLE SIMULATION
  // ═══════════════════════════════════
  var serverState = "STOPPED";
  var registeredPlugins = [];
  var runtimeEnv = "nodejs"; // 'nodejs' | 'edge'

  function setRuntime(rt) {
    runtimeEnv = rt;
    console.log('  🔧 NEXT_RUNTIME = "' + rt + '"');
  }

  // ═══════════════════════════════════
  // 2. PLUGIN SYSTEM (simulates packages)
  // ═══════════════════════════════════
  var pluginRegistry = {
    otel: {
      name: "OpenTelemetry",
      runtime: "all",
      init: function () {
        console.log("  📡 OTel: Tracing initialized!");
        console.log("  📡 OTel: Spans, metrics, logs ready!");
      },
    },
    sentry: {
      name: "Sentry",
      runtime: "nodejs",
      init: function () {
        console.log("  🛡️ Sentry: Error tracking active!");
        console.log("  🛡️ Sentry: DSN configured.");
      },
    },
    "edge-logger": {
      name: "EdgeLogger",
      runtime: "edge",
      init: function () {
        console.log("  📝 EdgeLogger: Lightweight logging!");
      },
    },
    "db-pool": {
      name: "DatabasePool",
      runtime: "nodejs",
      init: function () {
        console.log("  🗄️ DB Pool: 10 connections created!");
      },
    },
    "side-effect-pkg": {
      name: "SideEffectPackage",
      runtime: "all",
      init: function () {
        // Simulates global variable registration
        globalThis.__INSTRUMENTED__ = true;
        console.log("  🌍 Global __INSTRUMENTED__ = true");
      },
    },
  };

  // ═══════════════════════════════════
  // 3. DYNAMIC IMPORT SIMULATION
  // ═══════════════════════════════════
  function dynamicImport(pluginName) {
    var plugin = pluginRegistry[pluginName];
    if (!plugin) {
      console.log('  ❌ Plugin "' + pluginName + '" not found!');
      return;
    }
    if (plugin.runtime !== "all" && plugin.runtime !== runtimeEnv) {
      console.log(
        '  ⏭️ SKIP "' +
          plugin.name +
          '" (requires ' +
          plugin.runtime +
          ", current: " +
          runtimeEnv +
          ")",
      );
      return;
    }
    plugin.init();
    registeredPlugins.push(plugin.name);
  }

  // ═══════════════════════════════════
  // 4. register() FUNCTION
  // ═══════════════════════════════════
  function register(pluginList) {
    console.log("  ── register() called! ──");
    serverState = "REGISTERING";

    for (var i = 0; i < pluginList.length; i++) {
      dynamicImport(pluginList[i]);
    }

    serverState = "REGISTERED";
    console.log("  ── register() complete! ──");
    console.log("  📋 Plugins: [" + registeredPlugins.join(", ") + "]");
  }

  // ═══════════════════════════════════
  // 5. SERVER STARTUP
  // ═══════════════════════════════════
  function startServer(runtime, plugins) {
    registeredPlugins = [];
    serverState = "STARTING";
    console.log("  🚀 Server starting...");
    setRuntime(runtime);

    register(plugins);

    serverState = "READY";
    console.log("  ✅ Server READY! Handling requests...");
    return {
      state: serverState,
      plugins: registeredPlugins,
      runtime: runtimeEnv,
    };
  }

  // ═══════════════════════════════════
  // 6. DEMO
  // ═══════════════════════════════════
  function demo() {
    console.log("╔════════════════════════════════════╗");
    console.log("║  INSTRUMENTATION ENGINE DEMO        ║");
    console.log("╚════════════════════════════════════╝");

    // Scenario 1: Node.js runtime
    console.log("\n── Scenario 1: Node.js Runtime ──");
    var s1 = startServer("nodejs", [
      "otel",
      "sentry",
      "db-pool",
      "edge-logger",
      "side-effect-pkg",
    ]);
    console.log("  Result: " + s1.plugins.length + " plugins on " + s1.runtime);

    // Scenario 2: Edge runtime
    console.log("\n── Scenario 2: Edge Runtime ──");
    var s2 = startServer("edge", [
      "otel",
      "sentry",
      "db-pool",
      "edge-logger",
      "side-effect-pkg",
    ]);
    console.log("  Result: " + s2.plugins.length + " plugins on " + s2.runtime);

    // Scenario 3: Side effects only
    console.log("\n── Scenario 3: Side Effects ──");
    startServer("nodejs", ["side-effect-pkg"]);
    console.log(
      "  __INSTRUMENTED__? " + (globalThis.__INSTRUMENTED__ === true),
    );

    // Scenario 4: Unknown plugin
    console.log("\n── Scenario 4: Unknown ──");
    startServer("nodejs", ["unknown-plugin", "otel"]);
  }

  return { demo: demo };
})();
// Chạy: InstrumentationEngine.demo();
```

---

## §7. Câu Hỏi Luyện Tập!

**Câu 1**: `register()` hoạt động thế nào? Tại sao phải complete trước khi server ready?

<details><summary>Đáp án</summary>

`register()` là function export từ `instrumentation.ts`, được Next.js gọi **1 lần duy nhất** khi new server instance khởi tạo.

**Phải complete trước** vì:

1. **Monitoring phải sẵn sàng** trước request đầu tiên → nếu không, request đầu sẽ KHÔNG được track
2. **Database pools** cần khởi tạo → nếu không, request đầu sẽ fail khi query
3. **Error tracking** (Sentry) cần init → nếu không, crash đầu tiên sẽ bị miss
4. **Tracing spans** cần root span → mọi request cần cha tracing

Đây là **blocking initialization** — server KHÔNG nhận request cho đến khi `register()` return.

</details>

---

**Câu 2**: Tại sao dùng `await import()` trong register() thay vì import ở top-level?

<details><summary>Đáp án</summary>

2 lý do chính:

**1. Runtime safety**: `register()` được gọi trong CẢ Node.js VÀ Edge runtime. Import Node.js-only code (fs, database) ở top-level → load cho Edge → **CRASH**! Dynamic import trong `if (NEXT_RUNTIME === 'nodejs')` → chỉ load khi đúng runtime.

**2. Side effects control**: Top-level import → side effects chạy **TRƯỚC** register() → không kiểm soát thứ tự. Dynamic import TRONG register() → side effects chạy **ĐÚNG LÚC** cần → tập trung 1 chỗ, dễ debug.

```typescript
// ❌ Top-level: dangerous!
import "./instrumentation-node"; // runs in Edge too → CRASH!

// ✅ Dynamic: safe!
export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    await import("./instrumentation-node"); // only Node.js!
  }
}
```

</details>

---

**Câu 3**: NEXT_RUNTIME có những giá trị nào? Khi nào dùng?

<details><summary>Đáp án</summary>

| NEXT_RUNTIME | Khi nào                                   | Có gì                                          |
| ------------ | ----------------------------------------- | ---------------------------------------------- |
| `'nodejs'`   | Server-side (next start, SSR, API routes) | Full Node.js APIs: fs, net, crypto, DB drivers |
| `'edge'`     | Edge Runtime (Middleware, Edge routes)    | Web APIs only: fetch, Response, TextEncoder... |

**Dùng khi** cần conditional import trong `register()`:

- **Node.js only**: Sentry SDK, Prisma, database pools, pino logger, filesystem watchers
- **Edge only**: Lightweight tracing, Cloudflare Workers-compatible monitoring
- **Cả hai**: OpenTelemetry (có cả Node.js + Edge SDK)

**Không có giá trị thứ 3** — chỉ `'nodejs'` và `'edge'`.

</details>

---

**Câu 4**: instrumentation.ts đặt ở đâu? Có trường hợp nào cần đổi tên file?

<details><summary>Đáp án</summary>

**Vị trí**:

- **Không có `/src`**: `project-root/instrumentation.ts`
- **Có `/src`**: `project-root/src/instrumentation.ts`
- **KHÔNG BAO GIỜ** đặt trong `app/` hay `pages/`!

**Đổi tên khi**: Dùng `pageExtensions` trong `next.config.js`:

```javascript
// next.config.js
module.exports = {
  pageExtensions: ["page.tsx", "page.ts"],
};
// → instrumentation file CŨNG cần suffix tương ứng!
// → instrumentation.page.ts (theo convention)
```

Đây là edge case ít gặp, chỉ khi project dùng custom page extensions.

</details>
