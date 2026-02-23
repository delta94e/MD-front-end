# Next.js Static Exports — Deep Dive!

> **Chủ đề**: Static Exports — Xuất Trang Tĩnh!
> **Ngôn ngữ**: Tiếng Việt — giải thích cực kỳ chi tiết!
> **Phương châm**: Tự viết lại bằng tay — KHÔNG dùng thư viện!
> **Nguồn**: https://nextjs.org/docs/app/guides/static-exports
> **Lưu ý**: Trang gốc KHÔNG có sơ đồ — tất cả diagrams TỰ VẼ!

---

## Mục Lục

1. [§1. Tổng Quan — Static Export Là Gì?](#1)
2. [§2. Configuration — output: 'export'!](#2)
3. [§3. Supported Features!](#3)
4. [§4. Unsupported Features — 12 Cái KHÔNG Được!](#4)
5. [§5. Deploying — Nginx Config!](#5)
6. [§6. Tự Viết — StaticExportEngine!](#6)
7. [§7. Câu Hỏi Luyện Tập](#7)

---

## §1. Tổng Quan — Static Export Là Gì?

```
  STATIC EXPORT:
  ┌────────────────────────────────────────────────────────────┐
  │                                                            │
  │  next build (bình thường):    next build + output:'export':│
  │  ┌──────────────┐             ┌──────────────┐             │
  │  │ .next/       │             │ out/          │             │
  │  │ (Server cần  │             │ (PURE static!)│             │
  │  │ Node.js!)    │             │ HTML/CSS/JS!  │             │
  │  │ → next start │             │ → ANY server! │             │
  │  └──────────────┘             └──────────────┘             │
  │  Cần server!                  KHÔNG cần server!           │
  │                                                            │
  │  WHAT IS STATIC EXPORT?                                     │
  │  ┌──────────────────────────────────────────────────────┐  │
  │  │ ① Build generates HTML file PER ROUTE!               │  │
  │  │ ② Pure HTML/CSS/JS — no Node.js needed!             │  │
  │  │ ③ Deploy to ANY static host! (Nginx, S3, GH Pages!) │  │
  │  │ ④ Code-split per route (faster than SPA!)            │  │
  │  │ ⑤ Start static → progressively add server later!   │  │
  │  └──────────────────────────────────────────────────────┘  │
  │                                                            │
  │  FLOW:                                                      │
  │  next build ──► out/ folder ──► Upload to host ──► Done!  │
  │  (generate)     (HTML+CSS+JS)   (Nginx, S3, CDN)           │
  │                                                            │
  └────────────────────────────────────────────────────────────┘
```

---

## §2. Configuration — output: 'export'!

```
  next.config.js:
  ┌──────────────────────────────────────────────────────────┐
  │                                                          │
  │  const nextConfig = {                                    │
  │    output: 'export',  // ← ENABLE STATIC EXPORT!       │
  │                                                          │
  │    // OPTIONAL:                                           │
  │    trailingSlash: true,                                  │
  │    // /me → /me/ (links)                                │
  │    // /me.html → /me/index.html (files)                 │
  │                                                          │
  │    skipTrailingSlashRedirect: true,                      │
  │    // Prevent auto /me → /me/ redirect!                 │
  │                                                          │
  │    distDir: 'dist',                                      │
  │    // Output: out/ → dist/ (custom output dir!)         │
  │  }                                                       │
  │                                                          │
  │  3 OPTIONAL SETTINGS:                                     │
  │  ┌──────────────────────┬──────────────────────────┐     │
  │  │ Option               │ Purpose                  │     │
  │  ├──────────────────────┼──────────────────────────┤     │
  │  │ trailingSlash        │ /me → /me/ + emit        │     │
  │  │                      │ /me/index.html           │     │
  │  │ skipTrailingSlash    │ Keep href as-is!         │     │
  │  │ Redirect             │     No auto redirect     │     │
  │  │ distDir              │ Change output dir name!  │     │
  │  │                      │ out/ → dist/ or build/  │     │
  │  └──────────────────────┴──────────────────────────┘     │
  │                                                          │
  └──────────────────────────────────────────────────────────┘
```

---

## §3. Supported Features!

```
  SUPPORTED FEATURES:
  ┌────────────────────────────────────────────────────────────┐
  │                                                            │
  │  ① SERVER COMPONENTS — Run at BUILD time!                 │
  │  ┌──────────────────────────────────────────────────────┐  │
  │  │ // app/page.tsx (Server Component!)                  │  │
  │  │ export default async function Page() {               │  │
  │  │   // fetch runs DURING next build! (not runtime!)    │  │
  │  │   const res = await fetch('https://api.example.com') │  │
  │  │   const data = await res.json()                      │  │
  │  │   return <main>...</main>                            │  │
  │  │ }                                                    │  │
  │  │                                                      │  │
  │  │ → Rendered to STATIC HTML for initial load!         │  │
  │  │ → Static PAYLOAD for client navigation!             │  │
  │  │ → No changes needed! (unless dynamic APIs!)         │  │
  │  └──────────────────────────────────────────────────────┘  │
  │                                                            │
  │  ② CLIENT COMPONENTS — SWR / Client Fetch!                │
  │  ┌──────────────────────────────────────────────────────┐  │
  │  │ 'use client'                                         │  │
  │  │ import useSWR from 'swr'                             │  │
  │  │                                                      │  │
  │  │ export default function Page() {                     │  │
  │  │   const { data, error } = useSWR(url, fetcher)       │  │
  │  │   if (error) return 'Failed to load'                 │  │
  │  │   if (!data) return 'Loading...'                     │  │
  │  │   return data.title                                  │  │
  │  │ }                                                    │  │
  │  │                                                      │  │
  │  │ → Pre-rendered to HTML during build!                │  │
  │  │ → Data fetching happens CLIENT-SIDE!                │  │
  │  │ → Route transitions = SPA-like! 🎉                 │  │
  │  └──────────────────────────────────────────────────────┘  │
  │                                                            │
  │  ③ IMAGE OPTIMIZATION — Custom Loader!                    │
  │  ┌──────────────────────────────────────────────────────┐  │
  │  │ // next.config.js                                    │  │
  │  │ nextConfig = {                                       │  │
  │  │   output: 'export',                                  │  │
  │  │   images: {                                          │  │
  │  │     loader: 'custom',                                │  │
  │  │     loaderFile: './my-loader.ts',                    │  │
  │  │   },                                                 │  │
  │  │ }                                                    │  │
  │  │                                                      │  │
  │  │ // my-loader.ts (Cloudinary example!)                │  │
  │  │ export default function cloudinaryLoader({           │  │
  │  │   src, width, quality                                │  │
  │  │ }) {                                                 │  │
  │  │   const params = [                                   │  │
  │  │     'f_auto', 'c_limit',                             │  │
  │  │     `w_${width}`, `q_${quality || 'auto'}`           │  │
  │  │   ]                                                  │  │
  │  │   return `https://res.cloudinary.com/demo/           │  │
  │  │     image/upload/${params.join(',')}${src}`           │  │
  │  │ }                                                    │  │
  │  │                                                      │  │
  │  │ → Default loader KHÔNG work (needs Node.js!)       │  │
  │  │ → Custom loader = external service (Cloudinary,     │  │
  │  │   imgix, Cloudflare!)                                │  │
  │  └──────────────────────────────────────────────────────┘  │
  │                                                            │
  │  ④ ROUTE HANDLERS — GET Only!                             │
  │  ┌──────────────────────────────────────────────────────┐  │
  │  │ // app/data.json/route.ts                            │  │
  │  │ export async function GET() {                        │  │
  │  │   return Response.json({ name: 'Lee' })              │  │
  │  │ }                                                    │  │
  │  │                                                      │  │
  │  │ BUILD → out/data.json containing { name: 'Lee' }   │  │
  │  │ → CHỈ GET! POST/PUT/DELETE KHÔNG supported!        │  │
  │  │ → Generate static JSON, TXT, HTML files!            │  │
  │  │ → KHÔNG đọc Request (dynamic = FAIL!)              │  │
  │  └──────────────────────────────────────────────────────┘  │
  │                                                            │
  │  ⑤ BROWSER APIs — useEffect only!                        │
  │  ┌──────────────────────────────────────────────────────┐  │
  │  │ 'use client'                                         │  │
  │  │ import { useEffect } from 'react'                    │  │
  │  │                                                      │  │
  │  │ export default function ClientComponent() {          │  │
  │  │   useEffect(() => {                                  │  │
  │  │     console.log(window.innerHeight) // ← OK!       │  │
  │  │   }, [])                                             │  │
  │  │   return '...'                                       │  │
  │  │ }                                                    │  │
  │  │                                                      │  │
  │  │ → window, localStorage, navigator: useEffect only! │  │
  │  │ → Client Components pre-rendered during build!      │  │
  │  │ → Server KHÔNG có window! useEffect = browser!      │  │
  │  └──────────────────────────────────────────────────────┘  │
  │                                                            │
  └────────────────────────────────────────────────────────────┘
```

---

## §4. Unsupported Features — 12 Cái KHÔNG Được!

```
  ⚠️ 12 UNSUPPORTED FEATURES:
  ┌────────────────────────────────────────────────────────────┐
  │                                                            │
  │  ┌───┬──────────────────────┬──────────────────────────┐   │
  │  │ # │ Feature              │ Why not?                 │   │
  │  ├───┼──────────────────────┼──────────────────────────┤   │
  │  │ 1 │ Dynamic Routes with  │ dynamicParams: true cần │   │
  │  │   │ dynamicParams: true  │ runtime server!          │   │
  │  │ 2 │ Dynamic Routes       │ Phải có generate-       │   │
  │  │   │ without              │ StaticParams() để biết │   │
  │  │   │ generateStaticParams │ params lúc build!        │   │
  │  │ 3 │ Route Handlers       │ POST/PUT/DELETE cần     │   │
  │  │   │ rely on Request      │ runtime server!          │   │
  │  │ 4 │ Cookies              │ Runtime API! Cần Node!  │   │
  │  │ 5 │ Rewrites             │ Server-side URL rewrite! │   │
  │  │ 6 │ Redirects            │ Server-side redirect!    │   │
  │  │ 7 │ Headers              │ Server-side headers!     │   │
  │  │ 8 │ Proxy (Middleware)   │ Runtime routing logic!   │   │
  │  │ 9 │ ISR                  │ Revalidation cần server!│   │
  │  │10 │ Image Optimization   │ Default loader = Node.js!│   │
  │  │   │ (default loader)     │ → Dùng custom loader!  │   │
  │  │11 │ Draft Mode           │ Runtime preview feature! │   │
  │  │12 │ Server Actions       │ 'use server' = Node.js!  │   │
  │  │13 │ Intercepting Routes  │ Complex routing logic!   │   │
  │  └───┴──────────────────────┴──────────────────────────┘   │
  │                                                            │
  │  COMMON RULE:                                               │
  │  → Cần RUNTIME server? → KHÔNG supported!               │
  │  → Compute lúc BUILD? → Supported! ✅                   │
  │                                                            │
  │  ERROR HANDLING:                                            │
  │  → next dev: dùng unsupported feature → ERROR!           │
  │  → Giống như export const dynamic = 'error'              │
  │     trong root layout!                                     │
  │                                                            │
  └────────────────────────────────────────────────────────────┘
```

---

## §5. Deploying — Nginx Config!

```
  BUILD OUTPUT:
  ┌──────────────────────────────────────────────────────────┐
  │                                                          │
  │  Routes:           Output:                                │
  │  /                → out/index.html                       │
  │  /blog/[id]       → out/blog/post-1.html                │
  │  (with generate   → out/blog/post-2.html                │
  │   StaticParams)   → out/404.html                        │
  │                                                          │
  │  ┌──────────────────────────────────────────────────┐    │
  │  │ out/                                             │    │
  │  │ ├── index.html       (/ route!)                 │    │
  │  │ ├── 404.html         (404 page!)                │    │
  │  │ ├── blog/                                        │    │
  │  │ │   ├── post-1.html  (/blog/post-1!)            │    │
  │  │ │   └── post-2.html  (/blog/post-2!)            │    │
  │  │ └── _next/                                       │    │
  │  │     └── static/      (JS/CSS bundles!)          │    │
  │  └──────────────────────────────────────────────────┘    │
  │                                                          │
  └──────────────────────────────────────────────────────────┘

  NGINX CONFIG:
  ┌──────────────────────────────────────────────────────────┐
  │                                                          │
  │  server {                                                │
  │    listen 80;                                            │
  │    server_name acme.com;                                 │
  │    root /var/www/out;                                    │
  │                                                          │
  │    location / {                                          │
  │      try_files $uri $uri.html $uri/ =404;                │
  │    }                                                     │
  │                                                          │
  │    # trailingSlash: false cần rewrite!                  │
  │    location /blog/ {                                     │
  │      rewrite ^/blog/(.*)$ /blog/$1.html break;           │
  │    }                                                     │
  │                                                          │
  │    error_page 404 /404.html;                             │
  │    location = /404.html {                                │
  │      internal;                                           │
  │    }                                                     │
  │  }                                                       │
  │                                                          │
  │  REQUEST FLOW:                                            │
  │  GET /blog/post-1                                        │
  │  │                                                       │
  │  ▼                                                       │
  │  try_files:                                               │
  │  ① /blog/post-1 (file?) → NO                           │
  │  ② /blog/post-1.html → YES! ✅ Serve it!              │
  │                                                          │
  │  DEPLOY TO:                                               │
  │  → Nginx, Apache, Caddy!                                │
  │  → AWS S3 + CloudFront!                                  │
  │  → GitHub Pages!                                         │
  │  → Netlify, Cloudflare Pages!                            │
  │  → ANY static file server! ✅                           │
  │                                                          │
  └──────────────────────────────────────────────────────────┘
```

---

## §6. Tự Viết — StaticExportEngine!

```javascript
var StaticExportEngine = (function () {
  // ═══════════════════════════════════
  // 1. CONFIG
  // ═══════════════════════════════════
  var config = {
    output: "export",
    trailingSlash: false,
    distDir: "out",
    images: { loader: "default", loaderFile: null },
  };

  function configure(opts) {
    for (var key in opts) {
      if (key === "images") {
        config.images = opts[key];
      } else {
        config[key] = opts[key];
      }
    }
  }

  // ═══════════════════════════════════
  // 2. ROUTE BUILDER
  // ═══════════════════════════════════
  function generateOutputFiles(routes) {
    var files = [];
    for (var i = 0; i < routes.length; i++) {
      var r = routes[i];
      var filename;

      if (r.path === "/") {
        filename = "index.html";
      } else if (r.path === "/404") {
        filename = "404.html";
      } else {
        var segments = r.path.slice(1).split("/");
        if (config.trailingSlash) {
          filename = segments.join("/") + "/index.html";
        } else {
          filename = segments.join("/") + ".html";
        }
      }

      files.push({
        route: r.path,
        file: config.distDir + "/" + filename,
        type: r.type || "page",
        size: r.content ? r.content.length : 0,
      });
    }

    // Add static assets
    files.push({
      route: null,
      file: config.distDir + "/_next/static/",
      type: "JS/CSS bundles",
    });

    return files;
  }

  // ═══════════════════════════════════
  // 3. FEATURE VALIDATOR
  // ═══════════════════════════════════
  var UNSUPPORTED = [
    "dynamicParams: true",
    "Dynamic Routes without generateStaticParams",
    "Route Handlers rely on Request",
    "Cookies",
    "Rewrites",
    "Redirects",
    "Headers",
    "Proxy (Middleware)",
    "ISR",
    "Image Optimization (default loader)",
    "Draft Mode",
    "Server Actions",
    "Intercepting Routes",
  ];

  function validateFeature(feature) {
    for (var i = 0; i < UNSUPPORTED.length; i++) {
      if (feature.toLowerCase().indexOf(UNSUPPORTED[i].toLowerCase()) !== -1) {
        return {
          feature: feature,
          supported: false,
          error: "UNSUPPORTED in static export! " + "Needs runtime server!",
        };
      }
    }
    return { feature: feature, supported: true };
  }

  // ═══════════════════════════════════
  // 4. IMAGE LOADER SIMULATOR
  // ═══════════════════════════════════
  function createImageLoader(type) {
    if (type === "cloudinary") {
      return function (src, width, quality) {
        var params = [
          "f_auto",
          "c_limit",
          "w_" + width,
          "q_" + (quality || "auto"),
        ];
        return (
          "https://res.cloudinary.com/demo/image/upload/" +
          params.join(",") +
          src
        );
      };
    }
    if (type === "imgix") {
      return function (src, width, quality) {
        return (
          "https://demo.imgix.net" +
          src +
          "?w=" +
          width +
          "&q=" +
          (quality || 75) +
          "&auto=format"
        );
      };
    }
    // Default loader (NOT supported!)
    return function () {
      throw new Error(
        "Default image loader UNSUPPORTED in static export! " +
          "Use custom loader!",
      );
    };
  }

  // ═══════════════════════════════════
  // 5. ROUTE HANDLER SIMULATOR
  // ═══════════════════════════════════
  function staticRouteHandler(path, method, handler) {
    if (method !== "GET") {
      return {
        path: path,
        error: method + " UNSUPPORTED! Only GET for static export!",
      };
    }
    var response = handler();
    var filename = path.replace(/^\//, "") || "index";
    return {
      path: path,
      method: "GET",
      output: config.distDir + "/" + filename,
      content: response,
    };
  }

  // ═══════════════════════════════════
  // 6. NGINX CONFIG GENERATOR
  // ═══════════════════════════════════
  function generateNginxConfig(domain) {
    var conf = [
      "server {",
      "  listen 80;",
      "  server_name " + domain + ";",
      "  root /var/www/" + config.distDir + ";",
      "",
      "  location / {",
      "    try_files $uri $uri.html $uri/ =404;",
      "  }",
    ];

    if (!config.trailingSlash) {
      conf.push("");
      conf.push("  # rewrite for trailingSlash: false");
      conf.push("  location ~ ^/(.+)/$ {");
      conf.push("    rewrite ^/(.+)/$ /$1.html break;");
      conf.push("  }");
    }

    conf.push("");
    conf.push("  error_page 404 /404.html;");
    conf.push("  location = /404.html { internal; }");
    conf.push("}");

    return conf.join("\n");
  }

  // ═══════════════════════════════════
  // 7. DEMO
  // ═══════════════════════════════════
  function demo() {
    console.log("╔════════════════════════════════════╗");
    console.log("║  STATIC EXPORT ENGINE DEMO          ║");
    console.log("╚════════════════════════════════════╝");

    // Generate output files
    console.log("\n── Output Files ──");
    var files = generateOutputFiles([
      { path: "/", content: "<h1>Home</h1>" },
      { path: "/404", content: "<h1>Not Found</h1>" },
      { path: "/blog/post-1", content: "<h1>Post 1</h1>" },
      { path: "/blog/post-2", content: "<h1>Post 2</h1>" },
      { path: "/about", content: "<h1>About</h1>" },
    ]);
    for (var i = 0; i < files.length; i++) {
      console.log(
        "  " + (files[i].route || "(assets)") + " → " + files[i].file,
      );
    }

    // Feature validation
    console.log("\n── Feature Validation ──");
    var features = [
      "Server Components",
      "Client Components",
      "Cookies",
      "ISR",
      "Server Actions",
      "Route Handlers rely on Request",
    ];
    for (var j = 0; j < features.length; j++) {
      var v = validateFeature(features[j]);
      console.log(
        "  " + v.feature + ": " + (v.supported ? "✅ OK" : "❌ " + v.error),
      );
    }

    // Image loaders
    console.log("\n── Image Loaders ──");
    var cloudinary = createImageLoader("cloudinary");
    console.log("  Cloudinary:", cloudinary("/turtles.jpg", 300, 80));
    var imgix = createImageLoader("imgix");
    console.log("  imgix:", imgix("/hero.png", 800, 90));

    // Route handler
    console.log("\n── Route Handlers ──");
    console.log(
      "  GET:",
      staticRouteHandler("data.json", "GET", function () {
        return { name: "Lee" };
      }),
    );
    console.log(
      "  POST:",
      staticRouteHandler("api/submit", "POST", function () {
        return {};
      }),
    );

    // Nginx config
    console.log("\n── Nginx Config ──");
    console.log(generateNginxConfig("acme.com"));
  }

  return { demo: demo };
})();
// Chạy: StaticExportEngine.demo();
```

---

## §7. Câu Hỏi Luyện Tập!

**Câu 1**: Static export — Server Components run KHI NÀO?

<details><summary>Đáp án</summary>

**Khi**: Chạy `next build`! (BUILD time, KHÔNG phải runtime!)

```
next build:
  Server Component → fetch data AT BUILD TIME!
  → Render to STATIC HTML!
  → Generate static PAYLOAD for client navigation!

Runtime:
  → HTML served by static host! (Nginx, S3...)
  → NO Node.js needed!
  → Client navigation uses static payload!
```

**⚠️ Restriction**: Server Components KHÔNG ĐƯỢC dùng **dynamic server functions** (cookies, headers, dynamic params...) → những cái này cần runtime server!

</details>

---

**Câu 2**: Image Optimization — tại sao default loader KHÔNG work?

<details><summary>Đáp án</summary>

|                    | Default Loader            | Custom Loader                 |
| ------------------ | ------------------------- | ----------------------------- |
| **Cần**            | Node.js server (runtime!) | External service (CDN!)       |
| **Process**        | Server optimize on-demand | Service optimize via URL      |
| **Static export?** | ❌ KHÔNG! (no server!)    | ✅ YES!                       |
| **Examples**       | sharp (on Node.js)        | Cloudinary, imgix, Cloudflare |

**Fix**: Set `images: { loader: 'custom', loaderFile: './my-loader.ts' }` trong `next.config.js`!

Custom loader = function nhận `(src, width, quality)` → return URL string!

</details>

---

**Câu 3**: Route Handlers — tại sao CHỈ GET?

<details><summary>Đáp án</summary>

```
GET handler:
  → Runs during `next build`!
  → Output = static file! (JSON, HTML, TXT)
  → Example: app/data.json/route.ts → out/data.json
  → Served by static host! ✅

POST/PUT/DELETE:
  → Need to READ Request body! (Dynamic!)
  → Need runtime server to process!
  → CANNOT pre-generate at build time!
  → ❌ NOT supported in static export!
```

**Rule**: Nếu Route Handler cần đọc **Request** (body, query params, cookies) → KHÔNG supported!

</details>

---

**Câu 4**: `dynamic = 'error'` — nghĩa gì?

<details><summary>Đáp án</summary>

Khi `output: 'export'`, Next.js tự động set `export const dynamic = 'error'` cho root layout!

**Nghĩa**: Nếu bất kỳ component nào dùng **dynamic API** (cookies(), headers(), searchParams...) → **BUILD ERROR** ngay!

```
→ Giống như guard: "This project is STATIC ONLY!"
→ Dùng unsupported feature? → ERROR immediately!
→ Catch mistakes during `next dev`, not production!
```

Không cần chờ deploy để biết lỗi — `next dev` sẽ báo luôn!

</details>
