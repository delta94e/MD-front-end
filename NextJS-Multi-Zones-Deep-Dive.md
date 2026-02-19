# Next.js Multi-Zones — Deep Dive!

> **Chủ đề**: Xây Dựng Micro-Frontends Với Multi-Zones!
> **Ngôn ngữ**: Tiếng Việt — giải thích cực kỳ chi tiết!
> **Phương châm**: Tự viết lại bằng tay — KHÔNG dùng thư viện!
> **Nguồn**: https://nextjs.org/docs/app/guides/multi-zones
> **Sơ đồ gốc**: 1 diagram (Zones A, B, C — soft/hard navigation) — phân tích chi tiết bên dưới!

---

## Mục Lục

1. [§1. Tổng Quan — Multi-Zones Là Gì?](#1)
2. [§2. Phân Tích Sơ Đồ Gốc — Zones + Navigation!](#2)
3. [§3. Define A Zone — assetPrefix!](#3)
4. [§4. Routing — Rewrites + Proxy!](#4)
5. [§5. Linking, Sharing Code, Server Actions!](#5)
6. [§6. So Sánh Multi-Zones vs Multi-Tenant vs Monolith!](#6)
7. [§7. Tự Viết — MultiZoneEngine!](#7)
8. [§8. Câu Hỏi Luyện Tập](#8)

---

## §1. Tổng Quan — Multi-Zones Là Gì?

```
  MULTI-ZONES = MICRO-FRONTENDS CHO NEXT.JS!
  ┌────────────────────────────────────────────────────────────┐
  │                                                            │
  │  VẤN ĐỀ: Monolith quá lớn!                              │
  │  ┌──────────────────────────────────────────────────────┐  │
  │  │   1 NEXT.JS APP KHỔNG LỒ:                           │  │
  │  │   /blog/*           (50 pages)                       │  │
  │  │   /dashboard/*      (100 pages)                      │  │
  │  │   /marketing/*      (30 pages)                       │  │
  │  │                                                      │  │
  │  │   → Build chậm (180 pages cùng lúc!)              │  │
  │  │   → 1 bug blog ảnh hưởng dashboard!              │  │
  │  │   → Deploy 1 = deploy ALL! ⏳                     │  │
  │  └──────────────────────────────────────────────────────┘  │
  │                                                            │
  │  GIẢI PHÁP: Multi-Zones!                                  │
  │  ┌──────────────────────────────────────────────────────┐  │
  │  │   CÙNG 1 DOMAIN: yourdomain.com                      │  │
  │  │                                                      │  │
  │  │   Zone A (Main): /*                                   │  │
  │  │   → / /products /about                              │  │
  │  │   → App Next.js riêng!                              │  │
  │  │                                                      │  │
  │  │   Zone B (Dashboard): /dashboard/*                    │  │
  │  │   → /dashboard /dashboard/settings                  │  │
  │  │   → App Next.js riêng!                              │  │
  │  │                                                      │  │
  │  │   Zone C (Blog): /blog/*                              │  │
  │  │   → /blog /blog/post-1 /blog/post-2                │  │
  │  │   → App Next.js riêng!                              │  │
  │  │                                                      │  │
  │  │   → User thấy: 1 website duy nhất! 🎉             │  │
  │  │   → Dev thấy: 3 repos, 3 deploys, 3 teams! 🚀    │  │
  │  └──────────────────────────────────────────────────────┘  │
  │                                                            │
  │  KEY BENEFITS:                                             │
  │  → Reduce build time (chỉ build zone thay đổi!)        │
  │  → Independent deployment (deploy blog ≠ deploy all!)   │
  │  → Team autonomy (blog team vs dashboard team!)          │
  │  → Remove unused code (zone A không có dashboard code!) │
  │  → Framework freedom (zone khác có thể dùng Remix!)   │
  │                                                            │
  └────────────────────────────────────────────────────────────┘
```

---

## §2. Phân Tích Sơ Đồ Gốc — Zones + Navigation!

**Sơ đồ gốc từ trang Next.js docs** (1 diagram duy nhất trên trang):

```
  ┌ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ┐

  │     SƠ ĐỒ: 3 ZONES VỚI SOFT NAV và HARD NAV                            │

  │                                                                           │
  │   ┌─── Zone A (xanh dương) ───┐                 ┌─── Zone C (tím) ──┐   │
  │   │ ┌───────────┐             │   HARD NAV      │ ┌───────────────┐ │   │
  │   │ │    /      │ ←─────────┐ │ ◄════════════► │ │    /blog       │ │   │
  │   │ └───────────┘             │                  │ └───────────────┘ │   │
  │   │       ↕ SOFT NAV          │                  │       ↕ SOFT NAV  │   │
  │   │ ┌───────────┐             │                  │ ┌───────────────┐ │   │
  │   │ │ /products │             │                  │ │ /blog/post-1  │ │   │
  │   │ └───────────┘             │                  │ └───────────────┘ │   │
  │   └───────────────────────────┘                  └──────────────────┘   │
  │            ↕                                           ↕                 │
  │        HARD NAV                                    HARD NAV              │
  │            ↕                                           ↕                 │
  │        ┌─── Zone B (đỏ) ───────────────────────────────┐               │
  │        │ ┌──────────────────┐                          │               │
  │        │ │   /dashboard     │                          │               │
  │        │ └──────────────────┘                          │               │
  │        │       ↕ SOFT NAV                              │               │
  │        │ ┌──────────────────────┐                      │               │
  │        │ │ /dashboard/settings  │                      │               │
  │        │ └──────────────────────┘                      │               │
  │        └────────────────────────────────────────────────┘               │
  │                                                                           │
  └ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ┘
```

```
  PHÂN TÍCH SƠ ĐỒ:
  ┌────────────────────────────────────────────────────────────┐
  │                                                            │
  │  3 ZONES trong diagram:                                    │
  │  ┌──────────┬───────────────────┬────────────────────┐     │
  │  │ Zone     │ Routes            │ Màu trong diagram  │     │
  │  ├──────────┼───────────────────┼────────────────────┤     │
  │  │ Zone A   │ / , /products     │ Xanh dương (blue)  │     │
  │  │ Zone B   │ /dashboard,       │ Đỏ (red)           │     │
  │  │          │ /dashboard/settings│                    │     │
  │  │ Zone C   │ /blog,            │ Tím (purple)       │     │
  │  │          │ /blog/post-1      │                    │     │
  │  └──────────┴───────────────────┴────────────────────┘     │
  │                                                            │
  │  2 LOẠI NAVIGATION:                                       │
  │  ┌─────────────────┬──────────────────────────────────┐    │
  │  │ Loại            │ Giải thích                       │    │
  │  ├─────────────────┼──────────────────────────────────┤    │
  │  │ SOFT NAV        │ Trong CÙNG zone!                 │    │
  │  │ (↕ mũi tên)    │ → Client-side navigation        │    │
  │  │                 │ → KHÔNG reload page!             │    │
  │  │                 │ → Giống <Link> bình thường      │    │
  │  │                 │ Ví dụ: / → /products (Zone A)   │    │
  │  │                 │         /dashboard → /dashboard/ │    │
  │  │                 │         settings (Zone B)        │    │
  │  │                 │         /blog → /blog/post-1     │    │
  │  │                 │         (Zone C)                  │    │
  │  ├─────────────────┼──────────────────────────────────┤    │
  │  │ HARD NAV        │ KHÁC zone!                       │    │
  │  │ (◄════════►)   │ → Full page reload!              │    │
  │  │                 │ → Unload zone cũ                │    │
  │  │                 │ → Load zone mới từ đầu!        │    │
  │  │                 │ Ví dụ: / → /dashboard           │    │
  │  │                 │        (Zone A → Zone B!)       │    │
  │  │                 │ Ví dụ: /products → /blog         │    │
  │  │                 │        (Zone A → Zone C!)       │    │
  │  └─────────────────┴──────────────────────────────────┘    │
  │                                                            │
  │  RULE QUAN TRỌNG:                                          │
  │  → Pages thường xuyên visit CÙNG NHAU → CÙNG zone!      │
  │  → Tránh hard nav = UX tốt hơn!                         │
  │  → / + /products = related → Zone A (SOFT!)             │
  │  → / + /dashboard = unrelated → khác zone (HARD, OK!)  │
  │                                                            │
  └────────────────────────────────────────────────────────────┘
```

---

## §3. Define A Zone — assetPrefix!

```
  ZONE DEFINITION:
  ┌────────────────────────────────────────────────────────────┐
  │                                                            │
  │  Zone = 1 Next.js app bình thường + assetPrefix!          │
  │                                                            │
  │  VẤN ĐỀ: 3 Next.js apps cùng domain → asset conflicts!  │
  │  ┌──────────────────────────────────────────────────────┐  │
  │  │ Zone A: /_next/static/chunk-abc.js                   │  │
  │  │ Zone B: /_next/static/chunk-abc.js   ← TRÙNG TÊN! │  │
  │  │ Zone C: /_next/static/chunk-abc.js   ← TRÙNG TÊN! │  │
  │  │                                                      │  │
  │  │ Browser load nhầm JS! 💥                            │  │
  │  └──────────────────────────────────────────────────────┘  │
  │                                                            │
  │  GIẢI PHÁP: assetPrefix!                                  │
  │  ┌──────────────────────────────────────────────────────┐  │
  │  │ Zone A (default): /_next/static/...                  │  │
  │  │   → KHÔNG cần assetPrefix (default zone!)           │  │
  │  │                                                      │  │
  │  │ Zone B: /dashboard-static/_next/static/...           │  │
  │  │   → assetPrefix: '/dashboard-static'                │  │
  │  │                                                      │  │
  │  │ Zone C: /blog-static/_next/static/...                │  │
  │  │   → assetPrefix: '/blog-static'                     │  │
  │  │                                                      │  │
  │  │ → Mỗi zone có prefix riêng → KHÔNG trùng nhau!    │  │
  │  └──────────────────────────────────────────────────────┘  │
  │                                                            │
  └────────────────────────────────────────────────────────────┘
```

```javascript
// ─── Zone B: next.config.mjs (Dashboard) ───
/** @type {import('next').NextConfig} */
var nextConfig = {
  assetPrefix: "/dashboard-static",
};
// JS/CSS → /dashboard-static/_next/...

// ─── Zone C: next.config.mjs (Blog) ───
/** @type {import('next').NextConfig} */
var nextConfig = {
  assetPrefix: "/blog-static",
};
// JS/CSS → /blog-static/_next/...

// ─── Zone A: next.config.mjs (Main/Default) ───
/** @type {import('next').NextConfig} */
var nextConfig = {
  // NO assetPrefix needed! (default zone)
};
// JS/CSS → /_next/... (default path!)
```

```
  NEXT.JS 15 vs PRE-15:
  ┌──────────────────────────────────────────────────────────┐
  │                                                          │
  │  Next.js 15+: assetPrefix ĐỦ! Tự xử lý!             │
  │                                                          │
  │  Pre-15: Cần THÊM rewrite cho static assets!            │
  │  async rewrites() {                                       │
  │    return {                                               │
  │      beforeFiles: [{                                      │
  │        source: '/blog-static/_next/:path+',              │
  │        destination: '/_next/:path+',                     │
  │      }]                                                   │
  │    }                                                      │
  │  }                                                        │
  │                                                          │
  │  → beforeFiles = process TRƯỚC file-based routing!    │
  │  → Map /blog-static/_next/... → /_next/...             │
  │                                                          │
  └──────────────────────────────────────────────────────────┘
```

---

## §4. Routing — Rewrites + Proxy!

```
  ROUTING ARCHITECTURE:
  ┌────────────────────────────────────────────────────────────┐
  │                                                            │
  │  User request: yourdomain.com/blog/post-1                  │
  │       │                                                    │
  │       ▼                                                    │
  │  ┌─────────────────────────────────┐                       │
  │  │ Zone A (Main App!)              │                       │
  │  │ = "Router" for all zones!       │                       │
  │  │                                 │                       │
  │  │ rewrites() checks:              │                       │
  │  │  /blog* → BLOG_DOMAIN/blog*   │                       │
  │  │  /dashboard* → DASH_DOMAIN    │                       │
  │  │  /*     → handle locally!     │                       │
  │  └──────┬──────────────────────────┘                       │
  │         │ rewrite!                                         │
  │         ▼                                                  │
  │  ┌─────────────────────────────────┐                       │
  │  │ Zone C (Blog App!)              │                       │
  │  │ URL: blog.internal.vercel.app   │                       │
  │  │ → Render /blog/post-1          │                       │
  │  │ → Return HTML to user!         │                       │
  │  └─────────────────────────────────┘                       │
  │                                                            │
  │  User thấy: yourdomain.com/blog/post-1                    │
  │  User KHÔNG biết blog chạy trên server khác!             │
  │                                                            │
  └────────────────────────────────────────────────────────────┘
```

```javascript
// ─── Zone A: next.config.mjs (Main — Routes all zones!) ───

/** @type {import('next').NextConfig} */
var nextConfig = {
  async rewrites() {
    return [
      // ─── Route /blog → Zone C ───
      {
        source: "/blog",
        destination: process.env.BLOG_DOMAIN + "/blog",
      },
      {
        source: "/blog/:path+",
        destination: process.env.BLOG_DOMAIN + "/blog/:path+",
      },
      {
        source: "/blog-static/:path+",
        destination: process.env.BLOG_DOMAIN + "/blog-static/:path+",
      },

      // ─── Route /dashboard → Zone B ───
      {
        source: "/dashboard",
        destination: process.env.DASHBOARD_DOMAIN + "/dashboard",
      },
      {
        source: "/dashboard/:path+",
        destination: process.env.DASHBOARD_DOMAIN + "/dashboard/:path+",
      },
      {
        source: "/dashboard-static/:path+",
        destination: process.env.DASHBOARD_DOMAIN + "/dashboard-static/:path+",
      },
    ];
  },
};
```

```
  3 REWRITES PER ZONE (tại sao?):
  ┌──────────────────────────────────────────────────────────┐
  │                                                          │
  │  ┌───┬──────────────────────┬────────────────────────┐   │
  │  │ # │ Rule                  │ Purpose                │   │
  │  ├───┼──────────────────────┼────────────────────────┤   │
  │  │ 1 │ /blog                │ Root page of zone!     │   │
  │  │ 2 │ /blog/:path+         │ All sub-pages!         │   │
  │  │ 3 │ /blog-static/:path+  │ JS/CSS assets!         │   │
  │  │   │                      │ (assetPrefix files!)   │   │
  │  └───┴──────────────────────┴────────────────────────┘   │
  │                                                          │
  │  → destination PHẢI có scheme + domain!                 │
  │  → Dev: http://localhost:3001                            │
  │  → Prod: https://blog.internal.vercel.app                │
  │                                                          │
  │  ⚠️ URL paths PHẢI unique across zones!                 │
  │  → 2 zones cùng serve /blog → CONFLICT! 💥             │
  │                                                          │
  └──────────────────────────────────────────────────────────┘
```

```
  PROXY (thay thế rewrites khi cần dynamic routing!):
  ┌──────────────────────────────────────────────────────────┐
  │                                                          │
  │  Khi nào dùng PROXY thay REWRITES?                       │
  │  → Feature flag quyết định route!                      │
  │  → A/B testing để lựa chọn zone!                      │
  │  → Migration: dần dần chuyển pages sang zone mới!     │
  │                                                          │
  │  // proxy.ts (Next.js Proxy!)                            │
  │  export async function proxy(request) {                  │
  │    var { pathname, search } = request.nextUrl;           │
  │                                                          │
  │    if (pathname === '/your-path' &&                      │
  │        myFeatureFlag.isEnabled()) {                      │
  │      return NextResponse.rewrite(                        │
  │        rewriteDomain + pathname + search                 │
  │      );                                                  │
  │    }                                                     │
  │    // else: continue to default zone!                    │
  │  }                                                       │
  │                                                          │
  │  → Proxy = DYNAMIC decision at runtime!                 │
  │  → Rewrites = STATIC config at build time!              │
  │  → Rewrites RECOMMENDED (lower latency!)                │
  │                                                          │
  └──────────────────────────────────────────────────────────┘
```

---

## §5. Linking, Sharing Code, Server Actions!

```
  LINKING BETWEEN ZONES:
  ┌──────────────────────────────────────────────────────────┐
  │                                                          │
  │  ⚠️ CRITICAL RULE:                                     │
  │  ┌──────────────────────────────────────────────────┐    │
  │  │ CÙNG zone:  dùng <Link href="/products">!      │    │
  │  │ KHÁC zone:  dùng <a href="/dashboard">!        │    │
  │  └──────────────────────────────────────────────────┘    │
  │                                                          │
  │  TẠI SAO?                                                │
  │  → <Link>: Next.js sẽ PREFETCH + SOFT navigate       │
  │  → Nhưng /dashboard thuộc ZONE KHÁC!                  │
  │  → Prefetch sẽ THẤT BẠI (khác app!)                 │
  │  → <a>: Browser hard navigate → đúng hành vi!        │
  │                                                          │
  │  VÍ DỤ:                                                  │
  │  // Zone A (Main app):                                   │
  │  <Link href="/products">Products</Link>  // ✅ SOFT!    │
  │  <a href="/dashboard">Dashboard</a>       // ✅ HARD!    │
  │  <a href="/blog">Blog</a>                 // ✅ HARD!    │
  │                                                          │
  │  // WRONG ❌:                                            │
  │  <Link href="/dashboard">Dashboard</Link> // ❌ BROKEN! │
  │                                                          │
  └──────────────────────────────────────────────────────────┘
```

```
  SHARING CODE:
  ┌──────────────────────────────────────────────────────────┐
  │                                                          │
  │  MONOREPO (recommended!):                                │
  │  ┌──────────────────────────────────────────────────┐    │
  │  │ my-platform/                                     │    │
  │  │ ├── apps/                                        │    │
  │  │ │   ├── main/      (Zone A — Next.js!)          │    │
  │  │ │   ├── dashboard/ (Zone B — Next.js!)          │    │
  │  │ │   └── blog/      (Zone C — Next.js!)          │    │
  │  │ └── packages/                                    │    │
  │  │     ├── ui/        (shared components!)         │    │
  │  │     ├── utils/     (shared utilities!)          │    │
  │  │     └── config/    (shared configs!)            │    │
  │  └──────────────────────────────────────────────────┘    │
  │                                                          │
  │  KHÁC REPO:                                               │
  │  → Dùng NPM packages (public hoặc private!)            │
  │  → Publish @my-org/ui → tất cả zones install!         │
  │                                                          │
  │  FEATURE FLAGS:                                           │
  │  → Zones deploy ở thời điểm KHÁC nhau!                │
  │  → Feature flag = enable/disable features đồng bộ!    │
  │  → Ví dụ: new design flag = ON → tất cả zones!      │
  │                                                          │
  └──────────────────────────────────────────────────────────┘
```

```
  SERVER ACTIONS:
  ┌──────────────────────────────────────────────────────────┐
  │                                                          │
  │  ⚠️ Multi-Zones + Server Actions = CẦN CONFIG!         │
  │                                                          │
  │  Vấn đề:                                                │
  │  → User domain: yourdomain.com                           │
  │  → Zone B server: dashboard.internal.vercel.app          │
  │  → Server Action POST request: origin mismatch!          │
  │  → Next.js CHẶN vì security (CSRF protection!)        │
  │                                                          │
  │  Fix: allowedOrigins!                                     │
  │  // next.config.js (mỗi zone!)                          │
  │  const nextConfig = {                                     │
  │    experimental: {                                        │
  │      serverActions: {                                     │
  │        allowedOrigins: [                                  │
  │          'yourdomain.com',                                │
  │        ],                                                 │
  │      },                                                   │
  │    },                                                     │
  │  };                                                       │
  │                                                          │
  │  → Cho phép Server Actions từ user-facing domain!       │
  │                                                          │
  └──────────────────────────────────────────────────────────┘
```

---

## §6. So Sánh Multi-Zones vs Multi-Tenant vs Monolith!

```
  SO SÁNH 3 ARCHITECTURE PATTERNS:
  ┌────────────────────────────────────────────────────────────┐
  │                                                            │
  │  ┌──────────┬──────────────┬────────────┬───────────────┐  │
  │  │          │ Monolith     │ Multi-Zones│ Multi-Tenant  │  │
  │  ├──────────┼──────────────┼────────────┼───────────────┤  │
  │  │ Apps     │ 1 app        │ N apps     │ 1 app         │  │
  │  │ Domain   │ 1 domain     │ 1 domain   │ N subdomains  │  │
  │  │ Deploy   │ 1 deploy     │ N deploys  │ 1 deploy      │  │
  │  │ Routing  │ File-based   │ Rewrites/  │ Middleware     │  │
  │  │          │              │ Proxy      │ + rewrite      │  │
  │  │ Nav      │ All soft     │ Soft in    │ All soft       │  │
  │  │          │              │ zone, hard │                │  │
  │  │          │              │ cross-zone │                │  │
  │  │ Use case │ Small-medium │ Large, many│ SaaS, many    │  │
  │  │          │ apps         │ teams      │ customers      │  │
  │  │ Code     │ 1 codebase   │ N codebases│ 1 codebase    │  │
  │  │          │              │ (monorepo) │                │  │
  │  │ Data     │ Shared       │ Separate   │ Per-tenant    │  │
  │  │ Example  │ most apps    │ Vercel.com │ Shopify       │  │
  │  └──────────┴──────────────┴────────────┴───────────────┘  │
  │                                                            │
  │  KEY DIFFERENCE:                                           │
  │  → Multi-Zones: SPLIT BY FEATURE (blog vs dashboard)    │
  │  → Multi-Tenant: SPLIT BY CUSTOMER (tenant A vs B)      │
  │                                                            │
  └────────────────────────────────────────────────────────────┘
```

---

## §7. Tự Viết — MultiZoneEngine!

```javascript
var MultiZoneEngine = (function () {
  // ═══════════════════════════════════
  // 1. ZONE REGISTRY
  // ═══════════════════════════════════
  var zones = {};

  function registerZone(name, config) {
    zones[name] = {
      name: name,
      domain: config.domain,
      assetPrefix: config.assetPrefix || "",
      paths: config.paths || [],
      isDefault: config.isDefault || false,
    };
    return zones[name];
  }

  function getZones() {
    var list = [];
    for (var k in zones) list.push(zones[k]);
    return list;
  }

  // ═══════════════════════════════════
  // 2. ASSET PREFIX RESOLVER
  // ═══════════════════════════════════
  function resolveAsset(zone, assetPath) {
    if (!zone.assetPrefix) {
      return "/_next/" + assetPath;
    }
    return "/" + zone.assetPrefix + "/_next/" + assetPath;
  }

  // ═══════════════════════════════════
  // 3. REWRITE RULES GENERATOR
  // ═══════════════════════════════════
  function generateRewrites() {
    var rules = [];
    for (var k in zones) {
      var zone = zones[k];
      if (zone.isDefault) continue;

      for (var i = 0; i < zone.paths.length; i++) {
        var path = zone.paths[i];
        // Rule 1: Root path
        rules.push({
          source: path,
          destination: zone.domain + path,
        });
        // Rule 2: Sub-paths
        rules.push({
          source: path + "/:path+",
          destination: zone.domain + path + "/:path+",
        });
      }
      // Rule 3: Static assets
      if (zone.assetPrefix) {
        rules.push({
          source: "/" + zone.assetPrefix + "/:path+",
          destination: zone.domain + "/" + zone.assetPrefix + "/:path+",
        });
      }
    }
    return rules;
  }

  // ═══════════════════════════════════
  // 4. REQUEST ROUTER
  // ═══════════════════════════════════
  function routeRequest(pathname) {
    var defaultZone = null;

    for (var k in zones) {
      var zone = zones[k];
      if (zone.isDefault) {
        defaultZone = zone;
        continue;
      }
      for (var i = 0; i < zone.paths.length; i++) {
        if (
          pathname === zone.paths[i] ||
          pathname.indexOf(zone.paths[i] + "/") === 0
        ) {
          return {
            zone: zone.name,
            action: "REWRITE",
            destination: zone.domain + pathname,
          };
        }
      }
      // Check asset prefix
      if (zone.assetPrefix && pathname.indexOf("/" + zone.assetPrefix) === 0) {
        return {
          zone: zone.name,
          action: "REWRITE_ASSET",
          destination: zone.domain + pathname,
        };
      }
    }

    return {
      zone: defaultZone ? defaultZone.name : "unknown",
      action: "LOCAL",
      destination: pathname,
    };
  }

  // ═══════════════════════════════════
  // 5. NAVIGATION TYPE CHECKER
  // ═══════════════════════════════════
  function getNavigationType(fromPath, toPath) {
    var fromZone = routeRequest(fromPath);
    var toZone = routeRequest(toPath);

    if (fromZone.zone === toZone.zone) {
      return {
        type: "SOFT",
        from: fromZone.zone,
        to: toZone.zone,
        tag: "<Link>",
        reload: false,
      };
    }
    return {
      type: "HARD",
      from: fromZone.zone,
      to: toZone.zone,
      tag: "<a>",
      reload: true,
    };
  }

  // ═══════════════════════════════════
  // 6. LINK TAG GENERATOR
  // ═══════════════════════════════════
  function generateLink(currentPath, targetPath, label) {
    var nav = getNavigationType(currentPath, targetPath);
    if (nav.type === "SOFT") {
      return '<Link href="' + targetPath + '">' + label + "</Link>";
    }
    return '<a href="' + targetPath + '">' + label + "</a>";
  }

  // ═══════════════════════════════════
  // 7. DEMO
  // ═══════════════════════════════════
  function demo() {
    console.log("╔════════════════════════════════════╗");
    console.log("║  MULTI-ZONE ENGINE DEMO             ║");
    console.log("╚════════════════════════════════════╝");

    // Register zones
    registerZone("main", {
      domain: "http://localhost:3000",
      isDefault: true,
      paths: ["/", "/products", "/about"],
    });
    registerZone("blog", {
      domain: "http://localhost:3001",
      assetPrefix: "blog-static",
      paths: ["/blog"],
    });
    registerZone("dashboard", {
      domain: "http://localhost:3002",
      assetPrefix: "dashboard-static",
      paths: ["/dashboard"],
    });

    // Zones
    console.log("\n── Registered Zones ──");
    getZones().forEach(function (z) {
      console.log(
        "  " +
          z.name +
          (z.isDefault ? " (DEFAULT)" : "") +
          " → " +
          z.domain +
          (z.assetPrefix ? " [prefix: " + z.assetPrefix + "]" : ""),
      );
    });

    // Rewrites
    console.log("\n── Generated Rewrites ──");
    generateRewrites().forEach(function (r) {
      console.log("  " + r.source + " → " + r.destination);
    });

    // Routing
    console.log("\n── Request Routing ──");
    var paths = [
      "/",
      "/products",
      "/blog",
      "/blog/post-1",
      "/dashboard",
      "/dashboard/settings",
      "/blog-static/_next/chunk.js",
    ];
    paths.forEach(function (p) {
      var r = routeRequest(p);
      console.log("  " + p + " → " + r.zone + " (" + r.action + ")");
    });

    // Navigation types
    console.log("\n── Navigation Types ──");
    var navs = [
      ["/", "/products"],
      ["/", "/dashboard"],
      ["/blog", "/blog/post-1"],
      ["/products", "/blog"],
      ["/dashboard", "/dashboard/settings"],
    ];
    navs.forEach(function (n) {
      var nav = getNavigationType(n[0], n[1]);
      console.log(
        "  " +
          n[0] +
          " → " +
          n[1] +
          " = " +
          nav.type +
          " (" +
          nav.from +
          "→" +
          nav.to +
          ")" +
          " use " +
          nav.tag,
      );
    });

    // Link generation
    console.log("\n── Link Generation ──");
    console.log("  From /: ");
    console.log("    " + generateLink("/", "/products", "Products"));
    console.log("    " + generateLink("/", "/dashboard", "Dashboard"));
    console.log("    " + generateLink("/", "/blog", "Blog"));

    // Asset resolution
    console.log("\n── Asset Resolution ──");
    console.log("  main: " + resolveAsset(zones.main, "static/chunk.js"));
    console.log("  blog: " + resolveAsset(zones.blog, "static/chunk.js"));
    console.log(
      "  dashboard: " + resolveAsset(zones.dashboard, "static/chunk.js"),
    );
  }

  return { demo: demo };
})();
// Chạy: MultiZoneEngine.demo();
```

---

## §8. Câu Hỏi Luyện Tập!

**Câu 1**: Multi-Zones là gì? Khác gì Multi-Tenant?

<details><summary>Đáp án</summary>

**Multi-Zones** = Chia 1 website trên 1 domain thành **nhiều Next.js applications riêng biệt**, mỗi app phục vụ 1 tập hợp routes. Đây là cách tiếp cận **micro-frontends**.

|            | Multi-Zones                       | Multi-Tenant                        |
| ---------- | --------------------------------- | ----------------------------------- |
| Chia theo  | **Feature** (/blog vs /dashboard) | **Customer** (tenant A vs tenant B) |
| Số apps    | **N apps** (1 per zone)           | **1 app**                           |
| Domain     | **1 domain**                      | **N subdomains**                    |
| Deploy     | **N deploys** riêng               | **1 deploy**                        |
| Routing    | Rewrites/Proxy                    | Middleware subdomain detection      |
| Navigation | Soft in-zone, Hard cross-zone     | Soft (all same app!)                |
| Use case   | Large apps, many teams            | SaaS platforms                      |

</details>

---

**Câu 2**: Tại sao cần assetPrefix? Nếu không có thì sao?

<details><summary>Đáp án</summary>

**assetPrefix** giải quyết **asset conflicts** giữa các zones trên cùng domain:

- Mỗi Next.js app generate static assets tại `/_next/static/...`
- 3 zones cùng domain = 3 apps cùng produce `/_next/static/chunk-abc.js`
- **KHÔNG có assetPrefix**: Browser load nhầm JS/CSS từ zone khác → **app BROKEN!**

**Với assetPrefix**:

- Zone A (default): `/_next/static/...`
- Zone B (`assetPrefix: '/dashboard-static'`): `/dashboard-static/_next/static/...`
- Zone C (`assetPrefix: '/blog-static'`): `/blog-static/_next/static/...`

→ Mỗi zone có namespace riêng cho assets → **NO conflicts!**

**Zone default** (thường là main app) **KHÔNG cần** assetPrefix.

</details>

---

**Câu 3**: Giải thích sơ đồ Zones + navigation trong docs. Soft vs Hard nav?

<details><summary>Đáp án</summary>

Sơ đồ hiển thị 3 zones trên cùng 1 domain:

| Zone   | Routes                              | Màu        |
| ------ | ----------------------------------- | ---------- |
| Zone A | `/`, `/products`                    | Xanh dương |
| Zone B | `/dashboard`, `/dashboard/settings` | Đỏ         |
| Zone C | `/blog`, `/blog/post-1`             | Tím        |

**SOFT navigation** (↕ trong sơ đồ):

- Giữa các routes **CÙNG zone** → client-side navigation, KHÔNG reload page
- Ví dụ: `/` → `/products` (cả hai Zone A) = **SOFT** ✅
- Dùng `<Link>` component!

**HARD navigation** (◄════► trong sơ đồ):

- Giữa các routes **KHÁC zone** → full page reload!
- Ví dụ: `/` (Zone A) → `/dashboard` (Zone B) = **HARD**
- Unload Zone A resources → load Zone B resources từ đầu!
- Dùng `<a>` tag (KHÔNG dùng `<Link>`!)

**Quy tắc**: Pages thường xuyên được truy cập cùng nhau nên ở **CÙNG zone** → tránh hard nav → UX mượt hơn!

</details>

---

**Câu 4**: Rewrites vs Proxy — khi nào dùng cái nào?

<details><summary>Đáp án</summary>

|          | Rewrites                | Proxy                                 |
| -------- | ----------------------- | ------------------------------------- |
| Config   | `next.config.mjs`       | `proxy.ts` (runtime!)                 |
| Timing   | **Build time** (static) | **Runtime** (dynamic)                 |
| Latency  | **Thấp** (recommended!) | Cao hơn (thêm logic layer)            |
| Logic    | Fixed rules             | Conditional (if/else)                 |
| Use case | Stable routes           | Feature flags, A/B testing, migration |

**Rewrites** (recommended!):

```js
{ source: '/blog/:path+', destination: `${BLOG_DOMAIN}/blog/:path+` }
```

→ Đơn giản, nhanh, static. **Dùng hầu hết trường hợp!**

**Proxy** (khi cần dynamic):

```js
if (pathname === "/your-path" && myFeatureFlag.isEnabled()) {
  return NextResponse.rewrite(rewriteDomain + pathname);
}
```

→ Dynamic decision dựa trên feature flag, user role, migration progress.

**Mỗi rewrite rule cho 1 zone cần 3 entries**: root path, sub-paths (`:path+`), và static assets (assetPrefix `/:path+`).

</details>
