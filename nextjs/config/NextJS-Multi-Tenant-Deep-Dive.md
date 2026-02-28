# Next.js Multi-Tenant — Deep Dive!

> **Chủ đề**: Xây Dựng Multi-Tenant Apps với Next.js!
> **Ngôn ngữ**: Tiếng Việt — giải thích cực kỳ chi tiết!
> **Phương châm**: Tự viết lại bằng tay — KHÔNG dùng thư viện!
> **Nguồn**: https://nextjs.org/docs/app/guides/multi-tenant
> **Nguồn mở rộng**: https://github.com/vercel/platforms (Platforms Starter Kit)
> **Lưu ý**: Trang docs gốc CHỈ CÓ 1 câu! Toàn bộ nội dung mở rộng từ Platforms Starter Kit + kiến thức multi-tenancy. Trang gốc KHÔNG có sơ đồ — tất cả diagrams TỰ VẼ!

---

## Mục Lục

1. [§1. Tổng Quan — Multi-Tenancy Là Gì?](#1)
2. [§2. Kiến Trúc Multi-Tenant Với Next.js](#2)
3. [§3. Middleware — Subdomain Detection Engine!](#3)
4. [§4. Routing — File Structure + Dynamic Routes](#4)
5. [§5. Redis — Tenant Data Storage](#5)
6. [§6. DNS + Deployment — Wildcard Domains](#6)
7. [§7. Local Development — Subdomains trên localhost!](#7)
8. [§8. Tự Viết — MultiTenantEngine](#8)
9. [§9. Câu Hỏi Luyện Tập](#9)

---

## §1. Tổng Quan — Multi-Tenancy Là Gì?

```
  MULTI-TENANCY CONCEPT:
  ┌────────────────────────────────────────────────────────────┐
  │                                                            │
  │  SINGLE-TENANT (truyền thống):                             │
  │  ┌──────────┐  ┌──────────┐  ┌──────────┐                │
  │  │ App A    │  │ App B    │  │ App C    │                │
  │  │ Code A   │  │ Code B   │  │ Code C   │                │
  │  │ Server A │  │ Server B │  │ Server C │                │
  │  │ DB A     │  │ DB B     │  │ DB C     │                │
  │  └──────────┘  └──────────┘  └──────────┘                │
  │  → 3 apps riêng biệt, deploy 3 lần! 😰                │
  │                                                            │
  │  MULTI-TENANT (1 app, nhiều tenants!):                     │
  │  ┌────────────────────────────────────────────┐            │
  │  │              1 Next.js App!                │            │
  │  │  ┌──────────┬──────────┬──────────┐       │            │
  │  │  │ Tenant A │ Tenant B │ Tenant C │       │            │
  │  │  │ a.domain │ b.domain │ c.domain │       │            │
  │  │  │ Data A   │ Data B   │ Data C   │       │            │
  │  │  └──────────┴──────────┴──────────┘       │            │
  │  │  Shared: Code + Server + Components!       │            │
  │  └────────────────────────────────────────────┘            │
  │  → 1 codebase, 1 deployment, N tenants! ⚡              │
  │                                                            │
  │  VÍ DỤ THỰC TẾ:                                           │
  │  → Shopify: 1 platform, triệu shops (shop1.myshopify.com)│
  │  → WordPress.com: blog1.wordpress.com, blog2.wordpress.com│
  │  → Notion: team1.notion.so, team2.notion.so               │
  │  → Vercel: project1.vercel.app, project2.vercel.app       │
  │                                                            │
  └────────────────────────────────────────────────────────────┘
```

```
  2 STRATEGIES CHÍNH:
  ┌────────────────────────────────────────────────────────────┐
  │                                                            │
  │  ① SUBDOMAIN-BASED (recommended!):                        │
  │  ┌──────────────────────────────────────────────────────┐  │
  │  │ tenant-a.yourdomain.com → Tenant A                  │  │
  │  │ tenant-b.yourdomain.com → Tenant B                  │  │
  │  │ yourdomain.com           → Landing page / Admin      │  │
  │  │                                                      │  │
  │  │ Ưu: SEO tốt, brand riêng, tách biệt rõ ràng     │  │
  │  │ Nhược: Cần wildcard DNS, phức tạp hơn             │  │
  │  └──────────────────────────────────────────────────────┘  │
  │                                                            │
  │  ② PATH-BASED:                                             │
  │  ┌──────────────────────────────────────────────────────┐  │
  │  │ yourdomain.com/tenant-a → Tenant A                  │  │
  │  │ yourdomain.com/tenant-b → Tenant B                  │  │
  │  │ yourdomain.com/admin     → Admin page               │  │
  │  │                                                      │  │
  │  │ Ưu: Đơn giản, không cần DNS đặc biệt            │  │
  │  │ Nhược: Ít chuyên nghiệp, khó tách SEO            │  │
  │  └──────────────────────────────────────────────────────┘  │
  │                                                            │
  │  → Vercel Platforms Starter Kit dùng ① SUBDOMAIN!        │
  │                                                            │
  └────────────────────────────────────────────────────────────┘
```

---

## §2. Kiến Trúc Multi-Tenant Với Next.js!

```
  ARCHITECTURE OVERVIEW (Platforms Starter Kit):
  ┌────────────────────────────────────────────────────────────┐
  │                                                            │
  │  REQUEST FLOW:                                              │
  │                                                            │
  │  User truy cập: tenant-a.yourdomain.com/page              │
  │       │                                                    │
  │       ▼                                                    │
  │  ┌─────────────────────────────────────────────┐           │
  │  │ DNS (Wildcard: *.yourdomain.com)            │           │
  │  │ → Tất cả subdomains → cùng 1 server!      │           │
  │  └─────────────────┬───────────────────────────┘           │
  │                    │                                       │
  │                    ▼                                       │
  │  ┌─────────────────────────────────────────────┐           │
  │  │ Next.js Middleware (middleware.ts)            │           │
  │  │ ① Parse hostname → extract subdomain        │           │
  │  │ ② Detect environment (local/prod/preview)   │           │
  │  │ ③ Rewrite URL: tenant-a.domain/page         │           │
  │  │    → /tenant-a/page (internal rewrite!)    │           │
  │  └─────────────────┬───────────────────────────┘           │
  │                    │                                       │
  │                    ▼                                       │
  │  ┌─────────────────────────────────────────────┐           │
  │  │ App Router (app/[domain]/[...slug]/page.tsx) │           │
  │  │ → domain = "tenant-a"                       │           │
  │  │ → Fetch tenant data từ Redis!              │           │
  │  │ → Render tenant-specific content!           │           │
  │  └─────────────────┬───────────────────────────┘           │
  │                    │                                       │
  │                    ▼                                       │
  │  ┌─────────────────────────────────────────────┐           │
  │  │ Redis (Upstash KV)                           │           │
  │  │ Key: "subdomain:tenant-a"                    │           │
  │  │ Value: { name, description, emoji, ... }     │           │
  │  └─────────────────────────────────────────────┘           │
  │                                                            │
  └────────────────────────────────────────────────────────────┘
```

```
  TECH STACK:
  ┌──────────────────────────────────────────────────────────┐
  │                                                          │
  │  ┌────────────────────┬──────────────────────────────┐   │
  │  │ Component          │ Technology                   │   │
  │  ├────────────────────┼──────────────────────────────┤   │
  │  │ Framework          │ Next.js 15 (App Router!)     │   │
  │  │ UI Library         │ React 19                     │   │
  │  │ Data Storage       │ Upstash Redis (KV)           │   │
  │  │ Styling            │ Tailwind CSS 4               │   │
  │  │ Design System      │ shadcn/ui                    │   │
  │  │ Routing            │ Middleware + Dynamic Routes  │   │
  │  │ DNS                │ Wildcard (*.domain.com)      │   │
  │  │ Deployment         │ Vercel                       │   │
  │  └────────────────────┴──────────────────────────────┘   │
  │                                                          │
  └──────────────────────────────────────────────────────────┘
```

```
  8 FEATURES:
  ┌──────────────────────────────────────────────────────────┐
  │                                                          │
  │  ✅ Custom subdomain routing (middleware!)               │
  │  ✅ Tenant-specific content + pages                      │
  │  ✅ Shared components + layouts across tenants           │
  │  ✅ Redis for tenant data storage                        │
  │  ✅ Admin interface (quản lý tenants)                    │
  │  ✅ Emoji support (branding tenants!)                    │
  │  ✅ Local development (subdomains trên localhost!)       │
  │  ✅ Vercel preview deployments compatible!               │
  │                                                          │
  └──────────────────────────────────────────────────────────┘
```

---

## §3. Middleware — Subdomain Detection Engine!

```
  MIDDLEWARE FLOW:
  ┌────────────────────────────────────────────────────────────┐
  │                                                            │
  │  middleware.ts — TRÁI TIM của multi-tenancy!              │
  │                                                            │
  │  Request: tenant-a.yourdomain.com/blog                     │
  │       │                                                    │
  │       ▼                                                    │
  │  ① PARSE HOSTNAME:                                        │
  │  hostname = "tenant-a.yourdomain.com"                      │
  │       │                                                    │
  │       ▼                                                    │
  │  ② DETECT ENVIRONMENT:                                    │
  │  ┌──────────────────────────────────────────────────────┐  │
  │  │ Local:   tenant-a.localhost:3000                      │  │
  │  │          → Remove ".localhost:3000"                   │  │
  │  │          → subdomain = "tenant-a"                    │  │
  │  │                                                      │  │
  │  │ Production: tenant-a.yourdomain.com                   │  │
  │  │          → Remove ".yourdomain.com"                  │  │
  │  │          → subdomain = "tenant-a"                    │  │
  │  │                                                      │  │
  │  │ Preview: tenant-a.xxx-yyy.vercel.app                  │  │
  │  │          → Remove ".xxx-yyy.vercel.app"              │  │
  │  │          → subdomain = "tenant-a"                    │  │
  │  └──────────────────────────────────────────────────────┘  │
  │       │                                                    │
  │       ▼                                                    │
  │  ③ CHECK SUBDOMAIN:                                       │
  │  if (subdomain) {                                          │
  │    // Rewrite → tenant-specific route!                    │
  │    rewrite → /tenant-a/blog                               │
  │  } else {                                                  │
  │    // Main domain → landing page / admin!                 │
  │    continue normally                                       │
  │  }                                                         │
  │       │                                                    │
  │       ▼                                                    │
  │  ④ URL REWRITE (user KHÔNG thấy URL thay đổi!):         │
  │  External: tenant-a.yourdomain.com/blog                    │
  │  Internal: yourdomain.com/tenant-a/blog                    │
  │  → App Router nhận: params.domain = "tenant-a"           │
  │                      params.slug = ["blog"]                │
  │                                                            │
  └────────────────────────────────────────────────────────────┘
```

```javascript
// middleware.ts — SIMPLIFIED IMPLEMENTATION
// (Đây là phiên bản đơn giản hóa để học!)

import { NextRequest, NextResponse } from "next/server";

export function middleware(request) {
  var url = request.nextUrl;
  var hostname = request.headers.get("host") || "";

  // ─── Environment Detection ───
  var currentHost = "";

  if (hostname.includes(".localhost")) {
    // LOCAL: tenant-a.localhost:3000
    currentHost = hostname.replace(".localhost:3000", "");
  } else if (hostname.endsWith(".vercel.app")) {
    // PREVIEW: Remove deployment-specific part
    currentHost = hostname.split(".")[0];
  } else {
    // PRODUCTION: tenant-a.yourdomain.com
    currentHost = hostname.replace(".yourdomain.com", "");
  }

  // ─── Main domain? → No rewrite! ───
  if (!currentHost || currentHost === "yourdomain" || currentHost === "www") {
    return NextResponse.next();
  }

  // ─── Rewrite to tenant-specific path! ───
  url.pathname = "/" + currentHost + url.pathname;
  return NextResponse.rewrite(url);
}

export var config = {
  matcher: [
    // Match ALL paths except static files!
    "/((?!api/|_next/|_static/|[\\w-]+\\.\\w+).*)",
  ],
};
```

---

## §4. Routing — File Structure + Dynamic Routes!

```
  FILE STRUCTURE:
  ┌────────────────────────────────────────────────────────────┐
  │                                                            │
  │  app/                                                      │
  │  ├── layout.tsx              ← Root layout (shared!)     │
  │  ├── page.tsx                ← Landing page (main domain)│
  │  ├── admin/                  ← Admin panel!              │
  │  │   ├── layout.tsx                                       │
  │  │   └── page.tsx            ← Manage tenants            │
  │  │                                                        │
  │  └── [domain]/               ← DYNAMIC! Per-tenant!     │
  │      ├── layout.tsx          ← Tenant-specific layout    │
  │      ├── page.tsx            ← Tenant home page          │
  │      └── [...slug]/          ← Catch-all tenant routes   │
  │          └── page.tsx        ← Tenant sub-pages          │
  │                                                            │
  │  middleware.ts               ← Subdomain → rewrite!     │
  │                                                            │
  │  HOW IT MAPS:                                              │
  │  ┌────────────────────────────┬──────────────────────────┐ │
  │  │ URL                        │ Route                    │ │
  │  ├────────────────────────────┼──────────────────────────┤ │
  │  │ yourdomain.com             │ app/page.tsx             │ │
  │  │ yourdomain.com/admin       │ app/admin/page.tsx       │ │
  │  │ tenant-a.yourdomain.com    │ app/[domain]/page.tsx    │ │
  │  │ tenant-a.yourdomain.com/x  │ app/[domain]/[...slug]/ │ │
  │  │                            │ page.tsx                 │ │
  │  └────────────────────────────┴──────────────────────────┘ │
  │                                                            │
  │  GHI NHỚ:                                                  │
  │  → Middleware rewrite: tenant-a.domain/x → /tenant-a/x   │
  │  → [domain] param = "tenant-a" (từ middleware rewrite!)  │
  │  → User KHÔNG thấy /tenant-a/ trong URL bar!            │
  │                                                            │
  └────────────────────────────────────────────────────────────┘
```

```
  SHARED vs TENANT-SPECIFIC:
  ┌──────────────────────────────────────────────────────────┐
  │                                                          │
  │  SHARED (tất cả tenants dùng chung!):                   │
  │  → Root layout (app/layout.tsx)                          │
  │  → UI components (shadcn/ui buttons, cards...)          │
  │  → Middleware logic                                      │
  │  → Admin interface                                       │
  │  → API/data fetching logic                               │
  │                                                          │
  │  TENANT-SPECIFIC (khác nhau per tenant!):                │
  │  → Content (blog posts, products...)                    │
  │  → Branding (emoji, colors, name)                       │
  │  → Subdomain (tenant-a.domain vs tenant-b.domain)       │
  │  → Tenant layout (app/[domain]/layout.tsx)               │
  │  → Data (Redis key: subdomain:{name})                    │
  │                                                          │
  └──────────────────────────────────────────────────────────┘
```

---

## §5. Redis — Tenant Data Storage!

```
  REDIS DATA MODEL:
  ┌────────────────────────────────────────────────────────────┐
  │                                                            │
  │  KEY PATTERN: "subdomain:{tenant-name}"                    │
  │                                                            │
  │  Ví dụ:                                                    │
  │  ┌─────────────────────────┬───────────────────────────┐   │
  │  │ Key                     │ Value                     │   │
  │  ├─────────────────────────┼───────────────────────────┤   │
  │  │ subdomain:starbucks     │ { name: "Starbucks",     │   │
  │  │                         │   description: "...",     │   │
  │  │                         │   emoji: "☕",            │   │
  │  │                         │   pages: [...] }          │   │
  │  │ subdomain:nike          │ { name: "Nike",          │   │
  │  │                         │   description: "...",     │   │
  │  │                         │   emoji: "👟",            │   │
  │  │                         │   pages: [...] }          │   │
  │  │ subdomain:spotify       │ { name: "Spotify",       │   │
  │  │                         │   description: "...",     │   │
  │  │                         │   emoji: "🎵",            │   │
  │  │                         │   pages: [...] }          │   │
  │  └─────────────────────────┴───────────────────────────┘   │
  │                                                            │
  │  TẠI SAO REDIS?                                            │
  │  → Cực nhanh! (in-memory, < 1ms latency!)                │
  │  → Key-Value phù hợp cho tenant lookup!                  │
  │  → Upstash = serverless Redis (pay per request!)         │
  │  → Không cần manage server Redis!                        │
  │                                                            │
  │  FLOW ĐỌC DATA:                                           │
  │  Middleware extract subdomain = "starbucks"                │
  │       ↓                                                    │
  │  Page component:                                           │
  │  const tenant = await kv.get("subdomain:starbucks")       │
  │       ↓                                                    │
  │  Render: { name: "Starbucks", emoji: "☕", ... }          │
  │                                                            │
  └────────────────────────────────────────────────────────────┘
```

---

## §6. DNS + Deployment — Wildcard Domains!

```
  DNS CONFIGURATION:
  ┌────────────────────────────────────────────────────────────┐
  │                                                            │
  │  WILDCARD DNS RECORD:                                      │
  │  *.yourdomain.com → Vercel server IP                      │
  │                                                            │
  │  Nghĩa là:                                                │
  │  tenant-a.yourdomain.com → CÙNG server!                  │
  │  tenant-b.yourdomain.com → CÙNG server!                  │
  │  anything.yourdomain.com → CÙNG server!                  │
  │  yourdomain.com           → CÙNG server!                  │
  │                                                            │
  │  → Server = 1 Next.js app!                                │
  │  → Middleware phân biệt tenant qua subdomain!            │
  │                                                            │
  │  DEPLOYMENT STEPS:                                         │
  │  ① Push code → GitHub                                    │
  │  ② Connect repo → Vercel                                 │
  │  ③ Configure env vars:                                    │
  │     KV_REST_API_URL = redis://...                          │
  │     KV_REST_API_TOKEN = ...                                │
  │  ④ Add root domain → Vercel                              │
  │  ⑤ Setup wildcard DNS: *.yourdomain.com                  │
  │  ⑥ Deploy!                                               │
  │                                                            │
  │  DNS RECORD TYPES:                                         │
  │  ┌──────────┬──────────────────┬────────────────────┐      │
  │  │ Type     │ Name             │ Value              │      │
  │  ├──────────┼──────────────────┼────────────────────┤      │
  │  │ A        │ yourdomain.com   │ 76.76.21.21       │      │
  │  │ CNAME    │ *.yourdomain.com │ cname.vercel-dns  │      │
  │  └──────────┴──────────────────┴────────────────────┘      │
  │                                                            │
  └────────────────────────────────────────────────────────────┘
```

---

## §7. Local Development — Subdomains trên localhost!

```
  LOCAL DEVELOPMENT:
  ┌──────────────────────────────────────────────────────────┐
  │                                                          │
  │  Browser hỗ trợ subdomains trên localhost!              │
  │                                                          │
  │  ┌────────────────────────────────┬──────────────────┐   │
  │  │ URL                            │ Purpose          │   │
  │  ├────────────────────────────────┼──────────────────┤   │
  │  │ http://localhost:3000           │ Landing page     │   │
  │  │ http://localhost:3000/admin     │ Admin panel      │   │
  │  │ http://tenant-a.localhost:3000  │ Tenant A!        │   │
  │  │ http://tenant-b.localhost:3000  │ Tenant B!        │   │
  │  └────────────────────────────────┴──────────────────┘   │
  │                                                          │
  │  TẠI SAO HOẠT ĐỘNG?                                     │
  │  → Browsers tự resolve *.localhost → 127.0.0.1         │
  │  → KHÔNG cần sửa /etc/hosts!                           │
  │  → Middleware detect: hostname.includes('.localhost')    │
  │                                                          │
  │  ENV VARIABLES (.env.local):                              │
  │  KV_REST_API_URL=your_redis_url                          │
  │  KV_REST_API_TOKEN=your_redis_token                      │
  │                                                          │
  └──────────────────────────────────────────────────────────┘
```

---

## §8. Tự Viết — MultiTenantEngine!

```javascript
var MultiTenantEngine = (function () {
  // ═══════════════════════════════════
  // 1. IN-MEMORY REDIS SIMULATION
  // ═══════════════════════════════════
  var redisStore = {};

  function kvSet(key, value) {
    redisStore[key] = JSON.parse(JSON.stringify(value));
    return "OK";
  }

  function kvGet(key) {
    return redisStore[key] || null;
  }

  function kvDel(key) {
    if (redisStore[key]) {
      delete redisStore[key];
      return 1;
    }
    return 0;
  }

  function kvKeys(pattern) {
    var prefix = pattern.replace("*", "");
    var keys = [];
    for (var k in redisStore) {
      if (k.indexOf(prefix) === 0) keys.push(k);
    }
    return keys;
  }

  // ═══════════════════════════════════
  // 2. TENANT MANAGER (ADMIN)
  // ═══════════════════════════════════
  function createTenant(name, config) {
    var key = "subdomain:" + name;
    if (kvGet(key)) {
      return { error: 'Tenant "' + name + '" already exists!' };
    }
    var tenant = {
      name: config.name || name,
      subdomain: name,
      description: config.description || "",
      emoji: config.emoji || "🌐",
      createdAt: new Date().toISOString(),
      pages: config.pages || [],
    };
    kvSet(key, tenant);
    return { success: true, tenant: tenant };
  }

  function getTenant(subdomain) {
    return kvGet("subdomain:" + subdomain);
  }

  function listTenants() {
    var keys = kvKeys("subdomain:");
    return keys.map(function (k) {
      return kvGet(k);
    });
  }

  function deleteTenant(subdomain) {
    return kvDel("subdomain:" + subdomain);
  }

  // ═══════════════════════════════════
  // 3. MIDDLEWARE SIMULATION
  // ═══════════════════════════════════
  function middleware(hostname, pathname) {
    var subdomain = "";
    var env = "";

    // Detect environment
    if (hostname.indexOf(".localhost") > -1) {
      env = "local";
      subdomain = hostname.split(".localhost")[0];
    } else if (hostname.indexOf(".vercel.app") > -1) {
      env = "preview";
      subdomain = hostname.split(".")[0];
    } else if (hostname.indexOf(".") > -1) {
      env = "production";
      var parts = hostname.split(".");
      if (parts.length > 2) {
        subdomain = parts[0];
      }
    }

    // Skip main domain
    if (!subdomain || subdomain === "www") {
      return {
        action: "NEXT",
        env: env,
        rewriteTo: pathname,
        subdomain: null,
        log: "Main domain → no rewrite",
      };
    }

    // Check if tenant exists
    var tenant = getTenant(subdomain);
    if (!tenant) {
      return {
        action: "NOT_FOUND",
        env: env,
        subdomain: subdomain,
        log: 'Tenant "' + subdomain + '" not found!',
      };
    }

    // Rewrite!
    var rewritten = "/" + subdomain + pathname;
    return {
      action: "REWRITE",
      env: env,
      subdomain: subdomain,
      rewriteTo: rewritten,
      tenant: tenant,
      log: subdomain + ".domain" + pathname + " → " + rewritten,
    };
  }

  // ═══════════════════════════════════
  // 4. PAGE RENDERER
  // ═══════════════════════════════════
  function renderPage(domain, slug) {
    var tenant = getTenant(domain);
    if (!tenant) {
      return { status: 404, html: "404 — Tenant not found!" };
    }

    var page = null;
    for (var i = 0; i < tenant.pages.length; i++) {
      if (tenant.pages[i].slug === (slug || "/")) {
        page = tenant.pages[i];
        break;
      }
    }

    if (!page) {
      return {
        status: 200,
        html: tenant.emoji + " " + tenant.name + " — Home Page",
      };
    }

    return {
      status: 200,
      html: tenant.emoji + " " + tenant.name + " — " + page.title,
    };
  }

  // ═══════════════════════════════════
  // 5. ROUTE MATCHER
  // ═══════════════════════════════════
  function matchRoute(internalPath) {
    var parts = internalPath.split("/").filter(Boolean);

    if (parts.length === 0) {
      return { route: "app/page.tsx", params: {} };
    }
    if (parts[0] === "admin") {
      return { route: "app/admin/page.tsx", params: {} };
    }

    // [domain] segment
    var domain = parts[0];
    var slug = parts.slice(1);

    if (slug.length === 0) {
      return {
        route: "app/[domain]/page.tsx",
        params: { domain: domain },
      };
    }

    return {
      route: "app/[domain]/[...slug]/page.tsx",
      params: { domain: domain, slug: slug },
    };
  }

  // ═══════════════════════════════════
  // 6. DEMO
  // ═══════════════════════════════════
  function demo() {
    console.log("╔════════════════════════════════════╗");
    console.log("║  MULTI-TENANT ENGINE DEMO           ║");
    console.log("╚════════════════════════════════════╝");

    // Create tenants
    console.log("\n── Create Tenants ──");
    createTenant("starbucks", {
      name: "Starbucks Coffee",
      emoji: "☕",
      description: "Best coffee chain",
      pages: [
        { slug: "/menu", title: "Our Menu" },
        { slug: "/about", title: "About Us" },
      ],
    });
    createTenant("nike", {
      name: "Nike Sports",
      emoji: "👟",
      description: "Just do it",
      pages: [{ slug: "/shoes", title: "All Shoes" }],
    });
    console.log(
      "  Tenants: " +
        listTenants()
          .map(function (t) {
            return t.emoji + " " + t.name;
          })
          .join(", "),
    );

    // Middleware scenarios
    console.log("\n── Middleware Scenarios ──");

    var scenarios = [
      ["starbucks.localhost:3000", "/menu"],
      ["nike.yourdomain.com", "/shoes"],
      ["yourdomain.com", "/"],
      ["yourdomain.com", "/admin"],
      ["unknown.yourdomain.com", "/"],
      ["starbucks.preview-123.vercel.app", "/about"],
    ];

    for (var i = 0; i < scenarios.length; i++) {
      var result = middleware(scenarios[i][0], scenarios[i][1]);
      console.log("  " + scenarios[i][0] + scenarios[i][1]);
      console.log("    → " + result.action + ": " + result.log);
    }

    // Route matching
    console.log("\n── Route Matching ──");
    var routes = [
      "/",
      "/admin",
      "/starbucks",
      "/starbucks/menu",
      "/nike/shoes",
    ];

    for (var j = 0; j < routes.length; j++) {
      var match = matchRoute(routes[j]);
      console.log(
        "  " +
          routes[j] +
          " → " +
          match.route +
          " params=" +
          JSON.stringify(match.params),
      );
    }

    // Page rendering
    console.log("\n── Page Rendering ──");
    console.log("  starbucks/: " + renderPage("starbucks", "/").html);
    console.log("  starbucks/menu: " + renderPage("starbucks", "/menu").html);
    console.log("  nike/shoes: " + renderPage("nike", "/shoes").html);
    console.log("  unknown/: " + renderPage("unknown", "/").html);
  }

  return { demo: demo };
})();
// Chạy: MultiTenantEngine.demo();
```

---

## §9. Câu Hỏi Luyện Tập!

**Câu 1**: Multi-tenancy là gì? 2 strategies và ưu/nhược điểm?

<details><summary>Đáp án</summary>

**Multi-tenancy** = 1 ứng dụng phục vụ NHIỀU "tenants" (khách hàng/tổ chức), mỗi tenant có data, branding, content riêng nhưng **chia sẻ cùng codebase + infrastructure**.

**Strategy 1: Subdomain-based** (recommended):

- URL: `tenant-a.yourdomain.com`
- **Ưu**: Chuyên nghiệp, SEO riêng cho mỗi tenant, tách biệt rõ, có thể cấp custom domain
- **Nhược**: Cần wildcard DNS (`*.domain`), middleware phức tạp hơn, local dev cần `.localhost` trick

**Strategy 2: Path-based**:

- URL: `yourdomain.com/tenant-a`
- **Ưu**: Đơn giản, không cần DNS đặc biệt, dễ implement
- **Nhược**: Ít chuyên nghiệp, khó tách SEO, user thấy tenant name trong path

</details>

---

**Câu 2**: Middleware đóng vai trò gì? Flow request từ subdomain → page?

<details><summary>Đáp án</summary>

**Middleware** là "bộ não" của multi-tenancy! Chạy TRƯỚC mọi request:

1. **Parse hostname**: Extract subdomain từ `tenant-a.yourdomain.com`
2. **Detect environment**: Phân biệt local (`.localhost`), production (`.yourdomain.com`), preview (`.vercel.app`)
3. **URL Rewrite**: `tenant-a.yourdomain.com/blog` → internal rewrite thành `/tenant-a/blog`
4. **App Router** nhận: `params.domain = "tenant-a"`, `params.slug = ["blog"]`
5. **Page** fetch tenant data từ Redis: `kv.get("subdomain:tenant-a")`
6. **Render** tenant-specific content

**Key**: User URL **KHÔNG thay đổi**! Họ vẫn thấy `tenant-a.yourdomain.com/blog`. Rewrite là **internal** — chỉ Next.js routing biết.

</details>

---

**Câu 3**: Tại sao dùng Redis? Key pattern lưu trữ tenant data?

<details><summary>Đáp án</summary>

**Tại sao Redis**:

- **In-memory** = cực nhanh (< 1ms latency!) — quan trọng vì mỗi request cần lookup tenant
- **Key-Value** = phù hợp hoàn hảo cho tenant lookup (subdomain → data)
- **Upstash** = serverless Redis, pay-per-request, không cần manage server
- **Edge-compatible** = hoạt động với Next.js Middleware (Edge Runtime!)

**Key pattern**: `subdomain:{tenant-name}`

- `subdomain:starbucks` → `{ name: "Starbucks", emoji: "☕", description: "...", pages: [...] }`
- `subdomain:nike` → `{ name: "Nike", emoji: "👟", ... }`

**Tại sao key prefix**: Dễ query tất cả tenants: `KEYS subdomain:*` → list all!

</details>

---

**Câu 4**: File structure cho multi-tenant app? Route nào dùng cho tenant?

<details><summary>Đáp án</summary>

```
app/
├── layout.tsx             ← Shared root layout
├── page.tsx               ← Landing page (main domain)
├── admin/
│   ├── layout.tsx
│   └── page.tsx           ← Admin panel
│
└── [domain]/              ← Dynamic: per-tenant!
    ├── layout.tsx         ← Tenant layout
    ├── page.tsx           ← Tenant home
    └── [...slug]/         ← Catch-all sub-pages
        └── page.tsx
```

| URL                        | Rendered by                                       |
| -------------------------- | ------------------------------------------------- |
| `yourdomain.com`           | `app/page.tsx`                                    |
| `yourdomain.com/admin`     | `app/admin/page.tsx`                              |
| `tenant-a.domain.com`      | `app/[domain]/page.tsx` (domain="tenant-a")       |
| `tenant-a.domain.com/blog` | `app/[domain]/[...slug]/page.tsx` (slug=["blog"]) |

**Key**: `[domain]` param được set bởi **middleware rewrite**, KHÔNG phải từ URL path mà user thấy!

</details>
