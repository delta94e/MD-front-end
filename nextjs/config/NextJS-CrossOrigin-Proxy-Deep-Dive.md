# Next.js Cross-Origin Proxy Forwarding — Deep Dive!

> **Hiểu sâu cơ chế Proxy Cross-Origin trong Next.js!**
> Tại sao cần proxy, cách hoạt động, tự viết proxy server bằng tay!

---

## §1. Tổng Quan — Cross-Origin Là Gì?

```
  CROSS-ORIGIN (CORS) PROBLEM:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  SAME-ORIGIN POLICY (SOP):                                      │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ Browser áp dụng chính sách SAME-ORIGIN! ★            │    │
  │  │ → Chỉ cho phép request đến CÙNG origin!             │    │
  │  │                                                      │    │
  │  │ ORIGIN = Protocol + Domain + Port                      │    │
  │  │                                                      │    │
  │  │ http://localhost:3000  ← ORIGIN CỦA FRONTEND!        │    │
  │  │ http://localhost:7001  ← ORIGIN CỦA BACKEND API!     │    │
  │  │                                                      │    │
  │  │ ★ KHÁC PORT → KHÁC ORIGIN → BỊ CHẶN! ★             │    │
  │  │                                                      │    │
  │  │ VÍ DỤ CÁC TRƯỜNG HỢP CROSS-ORIGIN:                   │    │
  │  │ ┌────────────────────┬──────────────────┬──────────┐  │    │
  │  │ │ Từ                 │ Đến              │ Kết quả │  │    │
  │  │ ├────────────────────┼──────────────────┼──────────┤  │    │
  │  │ │ http://a.com       │ http://a.com/api │ ✅ Same  │  │    │
  │  │ │ http://a.com       │ https://a.com    │ ❌ Cross │  │    │
  │  │ │ http://a.com       │ http://b.com     │ ❌ Cross │  │    │
  │  │ │ http://a.com       │ http://a.com:8080│ ❌ Cross │  │    │
  │  │ │ http://a.com       │ http://sub.a.com │ ❌ Cross │  │    │
  │  │ └────────────────────┴──────────────────┴──────────┘  │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  TẠI SAO CẦN PROXY?                                            │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ → SOP CHỈ áp dụng cho BROWSER! ★                    │    │
  │  │ → Server-to-Server: KHÔNG bị SOP!                    │    │
  │  │ → Proxy = server TRUNG GIAN!                          │    │
  │  │ → Browser → Proxy (same origin!) → API (khác origin!)│   │
  │  │ → Browser NGHĨ nó gọi same origin! ★                │    │
  │  │                                                      │    │
  │  │ KHÔNG CÓ PROXY:                                        │    │
  │  │ Browser ──────────→ API Server ❌ CORS ERROR!        │    │
  │  │ :3000                :7001                             │    │
  │  │                                                      │    │
  │  │ CÓ PROXY:                                               │    │
  │  │ Browser ───→ Proxy ───→ API Server ✅ OK!             │    │
  │  │ :3000       :3000       :7001                          │    │
  │  │ (same!)     (forward!)  (server-to-server!)           │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```

---

## §2. Kiến Trúc Proxy Trong Next.js!

```
  KIẾN TRÚC TỔNG QUAN:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  2 CÁCH CẤU HÌNH PROXY TRONG NEXT.JS:                         │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │                                                      │    │
  │  │ ① CUSTOM SERVER (Express + http-proxy-middleware!) ★  │    │
  │  │ → Thay thế Next.js dev server bằng Express!          │    │
  │  │ → Linh hoạt, kiểm soát hoàn toàn!                  │    │
  │  │ → Phù hợp cho Next.js Pages Router!                  │    │
  │  │                                                      │    │
  │  │ ② NEXT.JS REWRITES (next.config.js!) ★                │    │
  │  │ → Cấu hình trong next.config.js!                      │    │
  │  │ → Đơn giản hơn, built-in!                            │    │
  │  │ → Phù hợp cho cả Pages & App Router!                  │    │
  │  │                                                      │    │
  │  │ ③ API ROUTES (pages/api hoặc app/api!)                │    │
  │  │ → Tự viết API route làm proxy!                       │    │
  │  │ → Kiểm soát hoàn toàn request/response!             │    │
  │  │                                                      │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  SƠ ĐỒ LUỒNG DỮ LIỆU:                                         │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │                                                      │    │
  │  │  ┌──────────┐  /api/users  ┌───────────────┐          │    │
  │  │  │ BROWSER  │ ──────────→ │ NEXT.JS SERVER│          │    │
  │  │  │ React App│              │ (Express/     │          │    │
  │  │  │ :3000    │              │  Built-in)    │          │    │
  │  │  └──────────┘              └───────┬───────┘          │    │
  │  │                                    │                    │    │
  │  │                             pathRewrite:                │    │
  │  │                             /api → /                    │    │
  │  │                                    │                    │    │
  │  │                                    ▼                    │    │
  │  │                            ┌───────────────┐            │    │
  │  │                            │ BACKEND API  │            │    │
  │  │                            │ :7001        │            │    │
  │  │                            │ /users       │            │    │
  │  │                            └───────────────┘            │    │
  │  │                                                      │    │
  │  │  Browser gọi: http://localhost:3000/api/users          │    │
  │  │  Proxy forward: http://127.0.0.1:7001/users ★          │    │
  │  │  Browser KHÔNG biết có proxy! (transparent!) ★         │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```

---

## §3. Cách 1 — Custom Server (Express!)

```
  CUSTOM SERVER:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  CẦN CÀI ĐẶT:                                                  │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ npm install express http-proxy-middleware --save       │    │
  │  │                                                      │    │
  │  │ express: web framework! (tạo HTTP server!)           │    │
  │  │ http-proxy-middleware: middleware proxy! ★              │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  LUỒNG HOẠT ĐỘNG:                                               │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │                                                      │    │
  │  │ ① Express server KHỞI TẠO!                            │    │
  │  │    ↓                                                    │    │
  │  │ ② Next.js app.prepare() → build pages!                │    │
  │  │    ↓                                                    │    │
  │  │ ③ Đăng ký proxy middleware cho /api/*!                │    │
  │  │    ↓                                                    │    │
  │  │ ④ Mọi request KHÁC → Next.js handle! (SSR/SSG!)      │    │
  │  │    ↓                                                    │    │
  │  │ ⑤ Server.listen(3000)!                                  │    │
  │  │                                                      │    │
  │  │ REQUEST ĐẾN:                                            │    │
  │  │ /api/users → proxy middleware → forward → backend!   │    │
  │  │ /about     → Next.js handler → render page!           │    │
  │  │ /static/*  → Next.js handler → serve file!            │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```

```javascript
// ═══════════════════════════════════════════════════════════
// server.js — CUSTOM SERVER VỚI GIẢI THÍCH CHI TIẾT!
// ═══════════════════════════════════════════════════════════

const express = require("express");
const next = require("next");
const { createProxyMiddleware } = require("http-proxy-middleware");
// ★ Phiên bản >= 2.0.0: dùng { createProxyMiddleware }!
// ★ Phiên bản < 1.0.0: dùng require('http-proxy-middleware') trực tiếp!

// ═══ CẤU HÌNH PROXY ═══
const devProxy = {
  "/api": {
    target: "http://127.0.0.1:7001", // ★ Backend API server!
    pathRewrite: {
      "^/api": "/", // ★ Xóa prefix /api!
      // /api/users → /users
      // /api/posts/1 → /posts/1
    },
    changeOrigin: true, // ★ Thay đổi Origin header!
    // → Origin: http://127.0.0.1:7001 (thay vì localhost:3000!)
    // → Backend nghĩ request đến từ CHÍNH NÓ!
  },
};

// ═══ KHỞI TẠO NEXT.JS ═══
const port = parseInt(process.env.PORT, 10) || 3000;
const dev = process.env.NODE_ENV !== "production";
// ★ dev = true → Next.js hot-reload, error overlay!
// ★ dev = false → Next.js production mode!

const app = next({ dev }); // Tạo Next.js instance!
const handle = app.getRequestHandler(); // Handler cho Next.js pages!

// ═══ CHUẨN BỊ VÀ KHỞI ĐỘNG ═══
app
  .prepare() // ★ Build/compile Next.js pages!
  .then(() => {
    const server = express(); // Tạo Express server!

    // ★ CHỈ PROXY TRONG DEVELOPMENT MODE!
    if (dev && devProxy) {
      Object.keys(devProxy).forEach(function (context) {
        // context = '/api'
        // devProxy[context] = { target: ..., pathRewrite: ... }
        server.use(createProxyMiddleware(context, devProxy[context]));
        // ★ Đăng ký middleware: /api/* → forward đến target!
      });
    }

    // ★ TẤT CẢ REQUEST KHÁC → Next.js xử lý!
    server.all("*", (req, res) => {
      handle(req, res);
      // → Next.js SSR/SSG pages!
      // → Static files!
      // → API routes (pages/api!)
    });

    // ★ LẮNG NGHE PORT!
    server.listen(port, (err) => {
      if (err) throw err;
      console.log(`> Ready on http://localhost:${port}`);
    });
  })
  .catch((err) => {
    console.log("Lỗi khởi động server!");
    console.log(err);
  });
```

```
  CẤU HÌNH package.json:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  THAY ĐỔI SCRIPT:                                              │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ // TRƯỚC (mặc định Next.js):                          │    │
  │  │ "dev": "next dev"                                      │    │
  │  │                                                      │    │
  │  │ // SAU (dùng custom server):                           │    │
  │  │ "dev": "node server.js" ★                              │    │
  │  │ "build": "next build"                                  │    │
  │  │ "start": "NODE_ENV=production node server.js"          │    │
  │  │                                                      │    │
  │  │ ★ Chạy server.js thay vì next dev!                    │    │
  │  │ ★ server.js tự khởi tạo Next.js bên trong!           │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```

---

## §4. Tự Viết Proxy Middleware Bằng Tay!

```javascript
// ═══════════════════════════════════════════════════════════
// TỰ VIẾT: createProxyMiddleware — KHÔNG DÙNG THƯ VIỆN!
// ★ Mô phỏng http-proxy-middleware từ đầu!
// ═══════════════════════════════════════════════════════════

const http = require("http");
const url = require("url");

function createProxyMiddlewareHandwritten(context, options) {
  // context = '/api' → prefix cần match!
  // options = { target, pathRewrite, changeOrigin }

  const { target, pathRewrite, changeOrigin } = options;
  const targetUrl = new URL(target); // Parse target URL!

  // ★ TRẢ VỀ MIDDLEWARE FUNCTION!
  // Express middleware = (req, res, next) => {}
  return function proxyMiddleware(req, res, next) {
    // ① KIỂM TRA: request có MATCH context không?
    if (!req.url.startsWith(context)) {
      return next(); // ★ Không match → bỏ qua, tiếp tục Express chain!
    }

    // ② REWRITE PATH!
    let targetPath = req.url;
    if (pathRewrite) {
      Object.keys(pathRewrite).forEach((pattern) => {
        const regex = new RegExp(pattern);
        targetPath = targetPath.replace(regex, pathRewrite[pattern]);
        // '^/api' → '/'
        // '/api/users' → '/users' ★
      });
    }

    // ③ TẠO PROXY REQUEST OPTIONS!
    const proxyOptions = {
      hostname: targetUrl.hostname, // '127.0.0.1'
      port: targetUrl.port, // '7001'
      path: targetPath, // '/users'
      method: req.method, // 'GET', 'POST', etc.
      headers: { ...req.headers }, // Copy headers!
    };

    // ★ changeOrigin: thay đổi Host header!
    if (changeOrigin) {
      proxyOptions.headers.host = targetUrl.host;
      // host: 'localhost:3000' → '127.0.0.1:7001' ★
      // → Backend nghĩ request đến từ chính nó!
    }

    // Xóa headers không cần thiết!
    delete proxyOptions.headers["content-length"];

    // ④ GỬI REQUEST ĐẾN BACKEND!
    const proxyReq = http.request(proxyOptions, (proxyRes) => {
      // ⑤ COPY response headers từ backend → client!
      res.writeHead(proxyRes.statusCode, proxyRes.headers);

      // ⑥ PIPE dữ liệu từ backend → client!
      proxyRes.pipe(res, { end: true });
      // ★ pipe = stream data trực tiếp!
      // → Không cần buffer toàn bộ response!
      // → Hiệu quả cho response lớn!
    });

    // ⑦ XỬ LÝ LỖI!
    proxyReq.on("error", (err) => {
      console.error("Proxy error:", err.message);
      res.writeHead(502, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "Bad Gateway", message: err.message }));
    });

    // ⑧ PIPE request body từ client → backend!
    // (cho POST, PUT, PATCH requests!)
    req.pipe(proxyReq, { end: true });
  };
}

// ═══════════════════════════════════════════════════════════
// SỬ DỤNG:
// ═══════════════════════════════════════════════════════════
// const proxy = createProxyMiddlewareHandwritten('/api', {
//   target: 'http://127.0.0.1:7001',
//   pathRewrite: { '^/api': '/' },
//   changeOrigin: true,
// });
// app.use(proxy);
```

```
  LUỒNG XỬ LÝ CỦA PROXY MIDDLEWARE:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  CLIENT REQUEST:                                                │
  │  GET http://localhost:3000/api/users?page=1                    │
  │                                                              │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ ① Express nhận request!                               │    │
  │  │    URL: /api/users?page=1                              │    │
  │  │    ↓                                                    │    │
  │  │ ② Proxy middleware MATCH! (/api prefix!)              │    │
  │  │    ↓                                                    │    │
  │  │ ③ pathRewrite: /api/users → /users                    │    │
  │  │    ↓                                                    │    │
  │  │ ④ changeOrigin: Host → 127.0.0.1:7001                │    │
  │  │    ↓                                                    │    │
  │  │ ⑤ http.request() → gửi đến backend!                 │    │
  │  │    GET http://127.0.0.1:7001/users?page=1              │    │
  │  │    ↓                                                    │    │
  │  │ ⑥ Backend trả response!                               │    │
  │  │    200 OK { users: [...] }                              │    │
  │  │    ↓                                                    │    │
  │  │ ⑦ Proxy PIPE response → client!                       │    │
  │  │    ↓                                                    │    │
  │  │ ⑧ Browser nhận data! ★                                │    │
  │  │    KHÔNG biết có proxy!                               │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```

---

## §5. Cách 2 — Next.js Rewrites (next.config.js!)

```
  REWRITES — BUILT-IN PROXY:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  ★ CÁCH ĐƠN GIẢN NHẤT! Không cần Express!                    │
  │  ★ Không cần http-proxy-middleware!                            │
  │  ★ Cấu hình trong next.config.js!                             │
  │                                                              │
  │  ƯU ĐIỂM:                                                       │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ → Không cần custom server!                            │    │
  │  │ → Giữ nguyên tối ưu hóa Next.js!                    │    │
  │  │ → Hỗ trợ cả dev và production!                       │    │
  │  │ → Hỗ trợ Vercel deployment! ★                        │    │
  │  │ → Syntax đơn giản!                                    │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```

```javascript
// ═══════════════════════════════════════════════════════════
// next.config.js — REWRITES PROXY!
// ═══════════════════════════════════════════════════════════

/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    return [
      {
        source: "/api/:path*", // ★ Match pattern!
        destination: "http://127.0.0.1:7001/:path*", // ★ Forward!
        // /api/users → http://127.0.0.1:7001/users
        // /api/posts/1 → http://127.0.0.1:7001/posts/1
        // /api/auth/login → http://127.0.0.1:7001/auth/login
      },
    ];
  },
};

module.exports = nextConfig;

// ═══════════════════════════════════════════════════════════
// REWRITES NÂNG CAO — NHIỀU BACKEND!
// ═══════════════════════════════════════════════════════════

const nextConfigAdvanced = {
  async rewrites() {
    return [
      // Backend API chính!
      {
        source: "/api/:path*",
        destination: "http://127.0.0.1:7001/:path*",
      },
      // Auth service riêng!
      {
        source: "/auth/:path*",
        destination: "http://127.0.0.1:8001/:path*",
      },
      // Upload service!
      {
        source: "/upload/:path*",
        destination: "http://127.0.0.1:9001/:path*",
      },
    ];
  },
};

// ═══════════════════════════════════════════════════════════
// REWRITES THEO ENVIRONMENT!
// ═══════════════════════════════════════════════════════════

const nextConfigEnv = {
  async rewrites() {
    const isDev = process.env.NODE_ENV === "development";
    return [
      {
        source: "/api/:path*",
        destination: isDev
          ? "http://127.0.0.1:7001/:path*" // Dev: local!
          : "https://api.production.com/:path*", // Prod: remote!
      },
    ];
  },
};
```

---

## §6. Cách 3 — API Routes Làm Proxy!

```javascript
// ═══════════════════════════════════════════════════════════
// TỰ VIẾT: API Route Proxy — KHÔNG DÙNG THƯ VIỆN!
// pages/api/[...proxy].js (Pages Router!)
// hoặc app/api/[...proxy]/route.js (App Router!)
// ═══════════════════════════════════════════════════════════

// ★ PAGES ROUTER: pages/api/[...proxy].js
export default async function handler(req, res) {
  const { proxy } = req.query;
  // proxy = ['users'] cho /api/users
  // proxy = ['posts', '1'] cho /api/posts/1

  // ① Xây dựng URL backend!
  const backendPath = Array.isArray(proxy) ? proxy.join("/") : proxy;
  const backendUrl = `http://127.0.0.1:7001/${backendPath}`;

  // ② Xây dựng query string!
  const queryString = new URLSearchParams(req.query);
  queryString.delete("proxy"); // Xóa param [...proxy]!
  const qs = queryString.toString();
  const fullUrl = qs ? `${backendUrl}?${qs}` : backendUrl;

  try {
    // ③ Forward request đến backend!
    const backendRes = await fetch(fullUrl, {
      method: req.method,
      headers: {
        "Content-Type": req.headers["content-type"] || "application/json",
        // ★ Forward auth headers!
        ...(req.headers.authorization && {
          Authorization: req.headers.authorization,
        }),
      },
      // ④ Forward body cho POST/PUT/PATCH!
      ...(req.method !== "GET" &&
        req.method !== "HEAD" && {
          body: JSON.stringify(req.body),
        }),
    });

    // ⑤ Trả response về client!
    const data = await backendRes.json();
    res.status(backendRes.status).json(data);
  } catch (error) {
    console.error("Proxy error:", error);
    res.status(502).json({ error: "Bad Gateway" });
  }
}

// ═══════════════════════════════════════════════════════════
// ★ APP ROUTER: app/api/[...proxy]/route.js
// ═══════════════════════════════════════════════════════════

export async function GET(request, { params }) {
  const proxyPath = params.proxy.join("/");
  const { searchParams } = new URL(request.url);
  const backendUrl = `http://127.0.0.1:7001/${proxyPath}?${searchParams}`;

  const backendRes = await fetch(backendUrl, {
    headers: {
      Authorization: request.headers.get("Authorization") || "",
    },
  });

  const data = await backendRes.json();
  return Response.json(data, { status: backendRes.status });
}

export async function POST(request, { params }) {
  const proxyPath = params.proxy.join("/");
  const body = await request.json();
  const backendUrl = `http://127.0.0.1:7001/${proxyPath}`;

  const backendRes = await fetch(backendUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  const data = await backendRes.json();
  return Response.json(data, { status: backendRes.status });
}
```

---

## §7. pathRewrite — Viết Lại Đường Dẫn!

```
  pathRewrite GIẢI THÍCH CHI TIẾT:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  CẤU HÌNH:                                                      │
  │  pathRewrite: { '^/api': '/' }                                 │
  │                                                              │
  │  ★ KEY = RegExp pattern!                                       │
  │  ★ VALUE = chuỗi thay thế!                                    │
  │                                                              │
  │  VÍ DỤ:                                                         │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ '^/api': '/'                                          │    │
  │  │ /api/users       → /users ★                           │    │
  │  │ /api/posts/1     → /posts/1                            │    │
  │  │ /api/auth/login  → /auth/login                         │    │
  │  │                                                      │    │
  │  │ '^/api': '/v2'                                        │    │
  │  │ /api/users       → /v2/users ★                        │    │
  │  │ /api/posts/1     → /v2/posts/1                         │    │
  │  │                                                      │    │
  │  │ '^/old-api': '/new-api'                               │    │
  │  │ /old-api/users   → /new-api/users ★                   │    │
  │  │                                                      │    │
  │  │ NHIỀU RULES:                                           │    │
  │  │ pathRewrite: {                                         │    │
  │  │   '^/api/v1': '/legacy',                              │    │
  │  │   '^/api/v2': '/current',                             │    │
  │  │   '^/api': '/',                                       │    │
  │  │ }                                                     │    │
  │  │ → Rules áp dụng THEO THỨ TỰ! ★                      │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```

```javascript
// ═══════════════════════════════════════════════════════════
// TỰ VIẾT: pathRewrite function!
// ═══════════════════════════════════════════════════════════

function rewritePath(originalPath, rewriteRules) {
  let rewrittenPath = originalPath;

  Object.keys(rewriteRules).forEach((pattern) => {
    const regex = new RegExp(pattern);
    const replacement = rewriteRules[pattern];

    if (regex.test(rewrittenPath)) {
      rewrittenPath = rewrittenPath.replace(regex, replacement);
    }
  });

  return rewrittenPath;
}

// VÍ DỤ:
// rewritePath('/api/users', { '^/api': '/' })
// → '/users'
//
// rewritePath('/api/v2/posts', { '^/api/v2': '/current' })
// → '/current/posts'
```

---

## §8. changeOrigin — Thay Đổi Origin!

```
  changeOrigin GIẢI THÍCH:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  changeOrigin: true                                            │
  │                                                              │
  │  KHÔNG CÓ changeOrigin:                                         │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ Request headers:                                       │    │
  │  │ Host: localhost:3000  ← GIỮ NGUYÊN! ★                │    │
  │  │ Origin: http://localhost:3000                           │    │
  │  │                                                      │    │
  │  │ → Backend nhận Host: localhost:3000                    │    │
  │  │ → Nếu backend CHECK host → có thể REJECT! ❌        │    │
  │  │ → Virtual hosting server cần đúng Host!              │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  CÓ changeOrigin:                                               │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ Request headers:                                       │    │
  │  │ Host: 127.0.0.1:7001  ← ĐÃ THAY ĐỔI! ★             │    │
  │  │ Origin: http://127.0.0.1:7001                           │    │
  │  │                                                      │    │
  │  │ → Backend nhận Host: 127.0.0.1:7001                   │    │
  │  │ → Backend NGHĨ request đến từ chính nó! ✅           │    │
  │  │ → Virtual host routing ĐÚNG!                          │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  KHI NÀO CẦN changeOrigin: true?                              │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ → Backend dùng virtual hosting! (nhiều domain 1 IP!) │    │
  │  │ → Backend kiểm tra Host header!                      │    │
  │  │ → Backend dùng Nginx reverse proxy!                   │    │
  │  │ → ★ NÊN LUÔN BẬT changeOrigin: true! ★              │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```

---

## §9. http-proxy-middleware — Phiên Bản!

```
  VERSION DIFFERENCES:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  ★ QUAN TRỌNG: Import khác nhau theo VERSION!                  │
  │                                                              │
  │  PHIÊN BẢN >= 2.0.0 (MỚI):                                    │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ const { createProxyMiddleware }                        │    │
  │  │   = require('http-proxy-middleware');                   │    │
  │  │                                                      │    │
  │  │ // Named export! (destructuring!) ★                   │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  PHIÊN BẢN < 1.0.0 (CŨ):                                      │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ const proxy = require('http-proxy-middleware');        │    │
  │  │                                                      │    │
  │  │ // Default export! (không destructuring!) ★           │    │
  │  │ // Dùng trực tiếp: proxy('/api', { target: ... })    │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  PHIÊN BẢN 1.x (CHUYỂN TIẾP):                                 │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ const { createProxyMiddleware }                        │    │
  │  │   = require('http-proxy-middleware');                   │    │
  │  │                                                      │    │
  │  │ // Bắt đầu dùng named export!                       │    │
  │  │ // Nhưng API hơi khác v2!                             │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  KIỂM TRA VERSION:                                              │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ npm list http-proxy-middleware                          │    │
  │  │ // hoặc xem package.json!                              │    │
  │  │                                                      │    │
  │  │ ★ KHUYẾN NGHỊ: Dùng >= 2.0.0! ★                      │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```

---

## §10. So Sánh 3 Cách & Khi Nào Dùng!

```
  SO SÁNH:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  ┌────────────────┬──────────┬──────────┬──────────────┐    │
  │  │ TIÊU CHÍ        │Custom   │Rewrites  │API Routes    │    │
  │  │                │Server   │          │              │    │
  │  ├────────────────┼──────────┼──────────┼──────────────┤    │
  │  │ Độ phức tạp   │ Cao      │ Thấp ★  │ Trung bình  │    │
  │  │ Cần thư viện  │ Có       │ Không ★ │ Không       │    │
  │  │ Vercel deploy  │ ❌       │ ✅ ★    │ ✅          │    │
  │  │ SSR tối ưu    │ Giảm    │ Giữ ★   │ Giữ        │    │
  │  │ WebSocket      │ ✅ ★    │ ❌       │ ❌          │    │
  │  │ Logging        │ ✅ ★    │ Hạn chế │ ✅          │    │
  │  │ Custom logic   │ ✅ ★    │ ❌       │ ✅ ★       │    │
  │  │ Production     │ ✅       │ ✅ ★    │ ✅          │    │
  │  │ Hot reload     │ Tự quản │ Tự động │ Tự động    │    │
  │  └────────────────┴──────────┴──────────┴──────────────┘    │
  │                                                              │
  │  KHUYẾN NGHỊ:                                                    │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ → MẶC ĐỊNH: Dùng Rewrites! (đơn giản nhất!) ★      │    │
  │  │ → Cần WebSocket: Dùng Custom Server!                  │    │
  │  │ → Cần logic phức tạp: Dùng API Routes!               │    │
  │  │ → Deploy Vercel: PHẢI dùng Rewrites hoặc API Routes! │    │
  │  │                                                      │    │
  │  │ ★ Custom Server MẤT một số tính năng Next.js:        │    │
  │  │ → Automatic Static Optimization!                      │    │
  │  │ → Serverless deployment!                               │    │
  │  │ → Incremental Static Regeneration (ISR!)              │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```

---

## §11. Câu Hỏi Luyện Tập!

```
  CÂU HỎI PHỎNG VẤN:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  ❓ CÂU 1: Tại sao cần proxy trong Next.js?                     │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ → Browser áp dụng Same-Origin Policy (SOP)!          │    │
  │  │ → Frontend (3000) ≠ Backend (7001) → Cross-Origin!  │    │
  │  │ → Proxy = server trung gian, cùng origin với FE!     │    │
  │  │ → Browser → Proxy (same origin) → Backend (server!)  │    │
  │  │ → SOP chỉ áp dụng cho Browser, không cho Server! ★  │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  ❓ CÂU 2: pathRewrite làm gì?                                  │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ → Viết lại URL path trước khi forward!               │    │
  │  │ → '^/api': '/' → xóa prefix /api!                   │    │
  │  │ → /api/users → /users ★                               │    │
  │  │ → Dùng RegExp pattern!                                │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  ❓ CÂU 3: changeOrigin: true làm gì?                           │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ → Thay đổi Host header của request!                  │    │
  │  │ → Host: localhost:3000 → 127.0.0.1:7001 ★            │    │
  │  │ → Backend nghĩ request từ chính nó!                  │    │
  │  │ → Cần cho virtual hosting, Nginx routing!             │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  ❓ CÂU 4: Custom Server vs Rewrites?                            │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ → Custom Server: linh hoạt, WebSocket, nhưng mất    │    │
  │  │   Automatic Static Optimization + ISR + Serverless!   │    │
  │  │ → Rewrites: đơn giản, built-in, giữ tối ưu!        │    │
  │  │ → Khuyến nghị: Rewrites cho hầu hết trường hợp! ★  │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  ❓ CÂU 5: Proxy có hoạt động ở Production không?                │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ → Custom Server: CÓ nếu cấu hình đúng!             │    │
  │  │ → Rewrites: CÓ! Built-in cả dev và production! ★    │    │
  │  │ → Thường production dùng Nginx/API Gateway thay proxy!│   │
  │  │ → Proxy chủ yếu cho DEVELOPMENT! ★                   │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  ❓ CÂU 6: http-proxy-middleware v1 vs v2 khác gì?               │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ → v2: const { createProxyMiddleware } = require(...)  │    │
  │  │ → v1: const proxy = require(...)                      │    │
  │  │ → Khác CÁCH IMPORT! (named vs default export!) ★      │    │
  │  │ → Sai version → MODULE_NOT_FOUND error!              │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```
