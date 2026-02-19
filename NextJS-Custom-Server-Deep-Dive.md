# Next.js Custom Server — Deep Dive!

> **Chủ đề**: Custom Server — Khởi động Next.js programmatically!
> **Ngôn ngữ**: Tiếng Việt — giải thích cực kỳ chi tiết!
> **Phương châm**: Tự viết lại bằng tay — KHÔNG dùng thư viện!
> **Nguồn**: https://nextjs.org/docs/app/guides/custom-server
> **Lưu ý**: Trang gốc KHÔNG có sơ đồ — tất cả diagrams là TỰ VẼ!

---

## Mục Lục

1. [§1. Custom Server Là Gì?](#1)
2. [§2. Khi Nào KHÔNG Nên Dùng](#2)
3. [§3. Cấu Hình Chi Tiết](#3)
4. [§4. next() Options API](#4)
5. [§5. Tích Hợp Với Express / Fastify](#5)
6. [§6. Tự Viết — CustomServerEngine](#6)
7. [§7. Câu Hỏi Luyện Tập](#7)

---

## §1. Custom Server Là Gì?

```
  CUSTOM SERVER — TỔNG QUAN:
  ┌────────────────────────────────────────────────────────────┐
  │                                                            │
  │  MẶC ĐỊNH: Next.js có SẴN server (next start)!           │
  │  ┌──────────────────────────────────────────────────────┐  │
  │  │  $ next start                                        │  │
  │  │    → Next.js khởi động built-in HTTP server          │  │
  │  │    → Xử lý routing, SSR, API routes, static files   │  │
  │  │    → ĐỦ cho 99% use cases!                          │  │
  │  └──────────────────────────────────────────────────────┘  │
  │                                                            │
  │  CUSTOM SERVER: Bạn TỰ tạo HTTP server!                   │
  │  ┌──────────────────────────────────────────────────────┐  │
  │  │  $ node server.js                                    │  │
  │  │    → BẠN tạo HTTP server (Node.js createServer)     │  │
  │  │    → Import next() → kết nối Next.js vào server     │  │
  │  │    → Kiểm soát TOÀN BỘ request handling!            │  │
  │  │    → Custom routing, WebSocket, proxy...             │  │
  │  └──────────────────────────────────────────────────────┘  │
  │                                                            │
  │  SO SÁNH:                                                  │
  │  ┌──────────────┬──────────────────┬─────────────────────┐ │
  │  │              │ next start       │ Custom server       │ │
  │  ├──────────────┼──────────────────┼─────────────────────┤ │
  │  │ Khởi động   │ next start       │ node server.js      │ │
  │  │ Routing      │ Built-in         │ Custom + Next.js    │ │
  │  │ Static Opt   │ ✅ Automatic     │ ❌ DISABLED!       │ │
  │  │ Complexity   │ Zero config      │ Manual setup        │ │
  │  │ WebSocket    │ ❌ Không có     │ ✅ Có thể          │ │
  │  │ Deploy       │ Vercel, auto     │ Self-host only      │ │
  │  │ standalone   │ ✅ Tương thích  │ ❌ KHÔNG trace!    │ │
  │  └──────────────┴──────────────────┴─────────────────────┘ │
  │                                                            │
  └────────────────────────────────────────────────────────────┘
```

---

## §2. Khi Nào KHÔNG Nên Dùng!

```
  ⚠️ CẢNH BÁO QUAN TRỌNG:
  ┌────────────────────────────────────────────────────────────┐
  │                                                            │
  │  CHỈ DÙNG CUSTOM SERVER KHI:                               │
  │  → Built-in router KHÔNG ĐÁP ỨNG được yêu cầu!         │
  │  → Cần WebSocket server (chat, realtime...)               │
  │  → Cần custom protocol (gRPC, TCP...)                     │
  │  → Cần proxy phức tạp                                     │
  │  → Tích hợp legacy backend                                │
  │                                                            │
  │  MẤT GÌ KHI DÙNG CUSTOM SERVER?                           │
  │  ┌──────────────────────────────────────────────────────┐  │
  │  │ ❌ Automatic Static Optimization = DISABLED!         │  │
  │  │   → Tất cả pages sẽ SSR mỗi request!               │  │
  │  │   → Chậm hơn! Tốn tài nguyên hơn!                  │  │
  │  │                                                      │  │
  │  │ ❌ standalone output KHÔNG trace server.js!           │  │
  │  │   → standalone tạo server.js RIÊNG                   │  │
  │  │   → Custom server.js bị BỎ QUA!                     │  │
  │  │   → KHÔNG THỂ dùng chung!                           │  │
  │  │                                                      │  │
  │  │ ❌ Không deploy Vercel (serverless)!                  │  │
  │  │   → Custom server = long-running process             │  │
  │  │   → Vercel = serverless = KHÔNG tương thích!        │  │
  │  │                                                      │  │
  │  │ ❌ server.js KHÔNG qua Next.js Compiler!             │  │
  │  │   → KHÔNG bundled! KHÔNG transformed!                │  │
  │  │   → Phải dùng syntax Node.js version hiện tại!      │  │
  │  │   → KHÔNG có TypeScript transform!                   │  │
  │  └──────────────────────────────────────────────────────┘  │
  │                                                            │
  │  THAY THẾ TỐT HƠN:                                        │
  │  ┌──────────────────────────────────────────────────────┐  │
  │  │ Custom routing → App Router (file-based routing!)   │  │
  │  │ API endpoints → Route Handlers (app/api/...)        │  │
  │  │ Proxy requests → Middleware (proxy.ts) hoặc rewrites│  │
  │  │ Header/cookie → Middleware                          │  │
  │  │ Auth → Middleware + NextAuth                        │  │
  │  └──────────────────────────────────────────────────────┘  │
  │                                                            │
  └────────────────────────────────────────────────────────────┘
```

---

## §3. Cấu Hình Chi Tiết!

**server.js đầy đủ:**

```javascript
import { createServer } from "http";
import next from "next";

const port = parseInt(process.env.PORT || "3000", 10);
const dev = process.env.NODE_ENV !== "production";
const app = next({ dev });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  createServer((req, res) => {
    handle(req, res);
  }).listen(port);

  console.log(
    `> Server listening at http://localhost:${port} as ${
      dev ? "development" : process.env.NODE_ENV
    }`,
  );
});
```

```
  PHÂN TÍCH TỪNG DÒNG:
  ┌────────────────────────────────────────────────────────────┐
  │                                                            │
  │  import { createServer } from 'http'                       │
  │    → Node.js built-in HTTP module!                        │
  │    → Tạo raw HTTP server!                                 │
  │                                                            │
  │  import next from 'next'                                   │
  │    → Import Next.js PROGRAMMATIC API!                     │
  │    → Hàm next() trả về Next.js app instance!             │
  │                                                            │
  │  const app = next({ dev })                                 │
  │    → Tạo Next.js app instance!                            │
  │    → dev: true = development mode (HMR, error overlay)    │
  │    → dev: false = production mode (optimized)             │
  │                                                            │
  │  const handle = app.getRequestHandler()                    │
  │    → Lấy request handler của Next.js!                     │
  │    → Handler này xử lý: routing, SSR, static files...    │
  │    → Truyền (req, res) → Next.js xử lý!                 │
  │                                                            │
  │  app.prepare()                                             │
  │    → PHẢI gọi TRƯỚC khi handle requests!                  │
  │    → Compile pages, setup internal state                  │
  │    → Trả về Promise → .then() khi sẵn sàng!             │
  │                                                            │
  │  createServer((req, res) => { handle(req, res) })          │
  │    → Tạo HTTP server!                                     │
  │    → MỌI request → chuyển cho Next.js handle!            │
  │    → Có thể thêm custom logic TRƯỚC handle!              │
  │                                                            │
  └────────────────────────────────────────────────────────────┘
```

```
  REQUEST FLOW:
  ┌────────────────────────────────────────────────────────────┐
  │                                                            │
  │  Browser Request                                           │
  │    │                                                       │
  │    ▼                                                       │
  │  Node.js HTTP Server (createServer)                        │
  │    │                                                       │
  │    ├── Custom logic (logging, auth, WebSocket...)          │
  │    │                                                       │
  │    ▼                                                       │
  │  handle(req, res) → Next.js Request Handler                │
  │    │                                                       │
  │    ├── Static files? → /_next/static/ → serve!            │
  │    ├── API route? → app/api/ → handle!                    │
  │    ├── Page route? → app/page.tsx → SSR/SSG!              │
  │    └── 404? → not-found page!                             │
  │    │                                                       │
  │    ▼                                                       │
  │  Response → Browser                                        │
  │                                                            │
  └────────────────────────────────────────────────────────────┘
```

**package.json scripts:**

```json
{
  "scripts": {
    "dev": "node server.js",
    "build": "next build",
    "start": "NODE_ENV=production node server.js"
  }
}
```

```
  GIẢI THÍCH SCRIPTS:
  ┌──────────────────────────────────────────────────────────┐
  │ dev:   node server.js                                    │
  │   → KHÔNG dùng "next dev"!                              │
  │   → server.js tự set dev: true → Next.js dev mode!     │
  │                                                          │
  │ build: next build                                        │
  │   → VẪN DÙNG next build! (KHÔNG thay đổi!)             │
  │   → Build pages, optimize, generate .next/               │
  │                                                          │
  │ start: NODE_ENV=production node server.js                │
  │   → KHÔNG dùng "next start"!                            │
  │   → server.js detect NODE_ENV → dev: false!             │
  │   → Production mode, optimized!                         │
  │                                                          │
  │ ⚠️ server.js KHÔNG qua compiler!                        │
  │   → Phải dùng syntax Node.js hiện tại hiểu!            │
  │   → ESM import: cần "type": "module" trong package.json │
  │   → Hoặc dùng CommonJS: const next = require('next')    │
  └──────────────────────────────────────────────────────────┘
```

---

## §4. next() Options API!

```
  next() OPTIONS — TẤT CẢ THAM SỐ:
  ┌────────────────────────────────────────────────────────────┐
  │                                                            │
  │  const app = next({                                        │
  │    conf,         // Object — next.config.js override      │
  │    dev,          // Boolean — development mode? (false)   │
  │    dir,          // String — project directory ('.')      │
  │    quiet,        // Boolean — ẩn error messages? (false) │
  │    hostname,     // String — server hostname              │
  │    port,         // Number — server port                  │
  │    httpServer,   // node:http#Server — existing server    │
  │    turbopack,    // Boolean — dùng Turbopack?             │
  │    webpack,      // Boolean — dùng Webpack?               │
  │  })                                                        │
  │                                                            │
  │  CHI TIẾT:                                                 │
  │  ┌──────────┬────────────┬─────────────────────────────┐   │
  │  │ Option   │ Default    │ Mô tả                       │   │
  │  ├──────────┼────────────┼─────────────────────────────┤   │
  │  │ conf     │ {}         │ Ghi đè next.config.js       │   │
  │  │ dev      │ false      │ Dev mode (HMR, errors)      │   │
  │  │ dir      │ '.'        │ Thư mục project             │   │
  │  │ quiet    │ false      │ Ẩn server info/errors       │   │
  │  │ hostname │ (auto)     │ Hostname cho server         │   │
  │  │ port     │ (auto)     │ Port cho server             │   │
  │  │ httpSvr  │ (none)     │ Truyền server có sẵn       │   │
  │  │ turbopack│ false      │ Enable Turbopack bundler    │   │
  │  │ webpack  │ true       │ Enable Webpack bundler      │   │
  │  └──────────┴────────────┴─────────────────────────────┘   │
  │                                                            │
  │  METHODS CỦA APP:                                          │
  │  ┌──────────────────────────────────────────────────────┐   │
  │  │ app.prepare()          → Chuẩn bị Next.js (async!)  │   │
  │  │ app.getRequestHandler()→ Lấy handler cho req/res    │   │
  │  │ app.close()            → Shutdown gracefully         │   │
  │  └──────────────────────────────────────────────────────┘   │
  │                                                            │
  └────────────────────────────────────────────────────────────┘
```

---

## §5. Tích Hợp Với Express / Fastify!

```
  CUSTOM SERVER + EXPRESS:
  ┌────────────────────────────────────────────────────────────┐
  │                                                            │
  │  FLOW:                                                     │
  │  ┌──────────────────────────────────────────────────────┐  │
  │  │ Browser Request                                      │  │
  │  │   ↓                                                  │  │
  │  │ Express Server                                       │  │
  │  │   ├── GET /api/custom → Express handler!            │  │
  │  │   ├── GET /health     → Express handler!            │  │
  │  │   ├── WebSocket       → Socket.io handler!          │  │
  │  │   └── MỌI THỨ KHÁC   → handle(req, res) → Next.js │  │
  │  │   ↓                                                  │  │
  │  │ Response                                             │  │
  │  └──────────────────────────────────────────────────────┘  │
  │                                                            │
  └────────────────────────────────────────────────────────────┘
```

```javascript
// server.js — Express + Next.js
import express from "express";
import next from "next";

const port = parseInt(process.env.PORT || "3000", 10);
const dev = process.env.NODE_ENV !== "production";
const app = next({ dev });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const server = express();

  // Custom Express routes
  server.get("/api/custom", (req, res) => {
    res.json({ message: "Express route!" });
  });

  server.get("/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // MỌI THỨ KHÁC → Next.js!
  server.all("*", (req, res) => {
    return handle(req, res);
  });

  server.listen(port, () => {
    console.log(`> Ready on http://localhost:${port}`);
  });
});
```

```
  TẠI SAO DÙNG EXPRESS?
  ┌──────────────────────────────────────────────────────────┐
  │                                                          │
  │ ① Middleware ecosystem phong phú:                        │
  │   → cors, helmet, morgan, compression...                │
  │                                                          │
  │ ② WebSocket tích hợp dễ (Socket.io):                    │
  │   → const io = new Server(httpServer)                   │
  │                                                          │
  │ ③ Custom API patterns:                                   │
  │   → REST API với validation (express-validator)         │
  │   → GraphQL server (apollo-server-express)              │
  │                                                          │
  │ ④ Legacy integration:                                    │
  │   → Tích hợp Express app CŨ + Next.js frontend         │
  │                                                          │
  └──────────────────────────────────────────────────────────┘
```

---

## §6. Tự Viết — CustomServerEngine!

```javascript
var CustomServerEngine = (function () {
  // ═══════════════════════════════════
  // 1. MINI NEXT.JS APP (simulated)
  // ═══════════════════════════════════
  var nextApp = {
    prepared: false,
    dev: false,
    dir: ".",
    pages: {
      "/": { html: "<h1>Home</h1>", type: "static" },
      "/about": { html: "<h1>About</h1>", type: "static" },
      "/blog": { html: "<h1>Blog</h1>", type: "dynamic" },
    },
  };

  function createNextApp(options) {
    var app = Object.create(nextApp);
    app.dev = (options && options.dev) || false;
    app.dir = (options && options.dir) || ".";
    app.prepared = false;
    console.log(
      "  📦 Next.js app created (" + (app.dev ? "DEV" : "PROD") + ")",
    );
    return app;
  }

  function prepare(app) {
    return new Promise(function (resolve) {
      console.log("  ⏳ Preparing Next.js...");
      console.log("    → Compiling pages...");
      console.log("    → Setting up internal state...");
      app.prepared = true;
      console.log("  ✅ Next.js ready!");
      resolve();
    });
  }

  function getRequestHandler(app) {
    return function handle(req) {
      if (!app.prepared) {
        return { status: 500, body: "Not prepared!" };
      }
      var page = app.pages[req.url];
      if (page) {
        var isSSR = page.type === "dynamic" || app.dev;
        console.log("  📄 " + req.url + (isSSR ? " → SSR" : " → Static"));
        return { status: 200, body: page.html };
      }
      // Static files
      if (req.url.indexOf("/_next/") === 0) {
        console.log("  📁 Static: " + req.url);
        return { status: 200, body: "[static file]" };
      }
      console.log("  ❌ 404: " + req.url);
      return { status: 404, body: "Not Found" };
    };
  }

  // ═══════════════════════════════════
  // 2. MINI HTTP SERVER (simulated)
  // ═══════════════════════════════════
  function createServer(handler) {
    var routes = {};
    var server = {
      get: function (path, fn) {
        routes["GET:" + path] = fn;
      },
      all: function (path, fn) {
        routes["ALL:" + path] = fn;
      },
      listen: function (port) {
        console.log("\n  🚀 Server listening on port " + port);
      },
      handleRequest: function (method, url) {
        console.log("\n  → " + method + " " + url);
        var key = method + ":" + url;
        if (routes[key]) {
          return routes[key]({ url: url, method: method });
        }
        if (routes["ALL:*"]) {
          return routes["ALL:*"]({ url: url, method: method });
        }
        return { status: 404, body: "No route" };
      },
    };
    return server;
  }

  // ═══════════════════════════════════
  // 3. DEMO
  // ═══════════════════════════════════
  function demo() {
    console.log("╔════════════════════════════════════╗");
    console.log("║  CUSTOM SERVER ENGINE DEMO          ║");
    console.log("╚════════════════════════════════════╝");

    var app = createNextApp({ dev: false });
    var handle = getRequestHandler(app);

    prepare(app).then(function () {
      var server = createServer();

      // Custom route (Express-style!)
      server.get("/api/health", function () {
        console.log("  💚 Custom route: /api/health");
        return { status: 200, body: '{"status":"ok"}' };
      });

      // Everything else → Next.js
      server.all("*", function (req) {
        return handle(req);
      });

      server.listen(3000);

      // Simulate requests
      console.log("\n── Simulated Requests ──");
      server.handleRequest("GET", "/");
      server.handleRequest("GET", "/about");
      server.handleRequest("GET", "/blog");
      server.handleRequest("GET", "/api/health");
      server.handleRequest("GET", "/_next/static/chunk.js");
      server.handleRequest("GET", "/nonexistent");
    });
  }

  return { demo: demo };
})();
// Chạy: CustomServerEngine.demo();
```

---

## §7. Câu Hỏi Luyện Tập!

**Câu 1**: Custom server mất gì so với next start? Khi nào cần dùng?

<details><summary>Đáp án</summary>

**Mất:**

- **Automatic Static Optimization** → DISABLED! Mọi page phải SSR mỗi request
- **standalone output** → KHÔNG trace custom server.js (standalone tạo server.js riêng)
- **Vercel deployment** → Custom server = long-running process ≠ serverless
- **Next.js Compiler** → server.js KHÔNG được bundled/transformed

**Khi nào cần:**

- WebSocket server (chat, realtime notifications)
- Custom protocol (gRPC, TCP socket)
- Proxy phức tạp không thể dùng Middleware
- Tích hợp legacy Express/Fastify backend

</details>

---

**Câu 2**: Giải thích flow: app = next({dev}) → app.prepare() → handle(req, res)

<details><summary>Đáp án</summary>

1. `next({ dev })` — Tạo Next.js app **instance** (chưa sẵn sàng!). dev=true → HMR, error overlay; dev=false → optimized production.

2. `app.prepare()` — **Async initialization**: compile pages, setup internal routing, initialize caches. Trả về **Promise** — PHẢI await trước khi handle requests!

3. `app.getRequestHandler()` — Trả về **function(req, res)**. Function này là core of Next.js: routing, SSR, static serving, API handling.

4. `handle(req, res)` — Nhận Node.js IncomingMessage (req) + ServerResponse (res). Next.js xử lý hoàn toàn: match route → render → send response.

**Key**: `prepare()` PHẢI hoàn thành trước `handle()`, nếu không → crash!

</details>

---

**Câu 3**: Tại sao server.js KHÔNG qua Next.js Compiler?

<details><summary>Đáp án</summary>

`server.js` là **entry point** chạy TRƯỚC Next.js khởi động. Next.js Compiler (SWC/Webpack) chỉ compile code TRONG project (`app/`, `pages/`, components...). `server.js` nằm NGOÀI scope của compiler.

Hệ quả:

- KHÔNG có TypeScript transform → phải dùng `.js` hoặc cấu hình ts-node
- KHÔNG có JSX transform → không viết JSX trong server.js
- KHÔNG có path aliases → không dùng `@/` imports
- Phải dùng syntax Node.js version hiện tại hiểu (ESM hoặc CJS)

Giải pháp: Dùng `"type": "module"` trong package.json cho ESM import, hoặc dùng CommonJS `require()`.

</details>

---

**Câu 4**: Sự khác biệt khi dùng custom server + Express vs Route Handlers?

<details><summary>Đáp án</summary>

|                | Custom Server + Express | Route Handlers (app/api/) |
| -------------- | ----------------------- | ------------------------- |
| **Deploy**     | Self-host only          | Vercel, edge, serverless  |
| **Static Opt** | ❌ Disabled             | ✅ Hoạt động              |
| **Bundle**     | Không bundled           | Bundled + tree-shaken     |
| **Middleware** | Express middleware      | Next.js Middleware        |
| **WebSocket**  | ✅ Socket.io            | ❌ Không hỗ trợ           |
| **Scaling**    | Manual (PM2, cluster)   | Auto (serverless)         |
| **Complexity** | Manual setup            | Zero config               |

**Kết luận**: Dùng Route Handlers trừ khi THỰC SỰ cần WebSocket, custom protocol, hoặc legacy integration.

</details>
