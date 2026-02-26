# next.config.js Options: adapterPath · allowedDevOrigins · appDir · assetPrefix · authInterrupts — Deep Dive!

> **Nguồn**: 5 trang docs Next.js config options
> **Ngôn ngữ**: Tiếng Việt — giải thích cực kỳ chi tiết!
> **Tất cả các trang đều KHÔNG có hình/diagram** — chỉ text + code blocks!

---

# PHẦN 1: experimental.adapterPath

> **Nguồn**: https://nextjs.org/docs/app/api-reference/config/next-config-js/adapterPath
> **Trang KHÔNG có hình/diagram!**
> **Status**: Experimental!

---

## §1.1. adapterPath Là Gì?

```
  adapterPath — TỔNG QUAN:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  WHAT:                                                        │
  │  → Experimental API để tạo CUSTOM ADAPTER! ★★★              │
  │  → Hook vào build process của Next.js! ★                    │
  │  → Dành cho deployment platforms! ★                         │
  │  → Hoặc custom build integrations! ★                        │
  │                                                              │
  │  CONFIG:                                                      │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │  const nextConfig = {                                 │    │
  │  │    experimental: {                                     │    │
  │  │      adapterPath: require.resolve('./my-adapter.js')  │    │
  │  │    }                                                   │    │
  │  │  }                                                     │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  2 CALLBACKS:                                                 │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │  ① modifyConfig(config, { phase })                    │    │
  │  │    → Chỉnh sửa config TRƯỚC build! ★                 │    │
  │  │    → Gọi cho MỌI CLI command! ★                      │    │
  │  │                                                       │    │
  │  │  ② onBuildComplete({ routes, outputs, ... })          │    │
  │  │    → Gọi SAU build xong! ★                           │    │
  │  │    → Nhận thông tin routes + outputs! ★★★             │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```

---

## §1.2. NextAdapter Interface!

```
  NextAdapter INTERFACE:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  export interface NextAdapter {                               │
  │    name: string         ← TÊN adapter! ★                    │
  │                                                              │
  │    modifyConfig?(       ← OPTIONAL! ★                        │
  │      config: NextConfigComplete,                             │
  │      ctx: { phase: PHASE_TYPE }                              │
  │    ) => NextConfigComplete | Promise<>                       │
  │                                                              │
  │    onBuildComplete?(    ← OPTIONAL! ★                        │
  │      ctx: {                                                   │
  │        routes { headers, redirects, rewrites, dynamicRoutes }│
  │        outputs: AdapterOutputs   ← 7 LOẠI! ★★★             │
  │        projectDir: string                                    │
  │        repoRoot: string                                      │
  │        distDir: string                                       │
  │        config: NextConfigComplete                            │
  │        nextVersion: string                                   │
  │        buildId: string                                       │
  │      }                                                        │
  │    ) => void | Promise<void>                                 │
  │  }                                                            │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```

---

## §1.3. 7 Output Types!

```
  outputs — 7 LOẠI:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  ┌──────────────────┬──────────┬─────────────────────────┐   │
  │  │ Property           │ Type      │ Mô tả                   │   │
  │  ├──────────────────┼──────────┼─────────────────────────┤   │
  │  │ outputs.pages      │ PAGES     │ pages/ directory! ★    │   │
  │  │ outputs.pagesApi   │ PAGES_API │ pages/api/ routes! ★   │   │
  │  │ outputs.appPages   │ APP_PAGE  │ app/ pages! ★          │   │
  │  │ outputs.appRoutes  │ APP_ROUTE │ app/ route handlers! ★ │   │
  │  │ outputs.prerenders │ PRERENDER │ ISR + static pages! ★  │   │
  │  │ outputs.staticFiles│ STATIC_FILE│ Static assets! ★      │   │
  │  │ outputs.middleware │ MIDDLEWARE│ Middleware function! ★  │   │
  │  └──────────────────┴──────────┴─────────────────────────┘   │
  │                                                              │
  │  MỖI OUTPUT CÓ:                                               │
  │  → id: string — route identifier! ★                         │
  │  → filePath: string — path to built file! ★                 │
  │  → pathname: string — URL pathname! ★                       │
  │  → sourcePage: string — original source file! ★             │
  │  → runtime: 'nodejs' | 'edge'! ★                           │
  │  → assets: Record<string, string> — dependencies! ★        │
  │  → config: { maxDuration, preferredRegion, env }! ★         │
  │                                                              │
  │  PRERENDER ĐẶC BIỆT:                                         │
  │  → parentOutputId: source page ID! ★                        │
  │  → groupId: revalidation group! ★                           │
  │  → pprChain: PPR headers! ★                                │
  │  → fallback: { filePath, initialStatus, ... }! ★           │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```

---

## §1.4. Routes Information!

```
  ROUTES — 4 LOẠI:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  ① routes.headers:                                            │
  │  → source, sourceRegex, headers[], has, missing, priority!  │
  │                                                              │
  │  ② routes.redirects:                                          │
  │  → source, sourceRegex, destination, statusCode! ★          │
  │  → has, missing, priority!                                   │
  │                                                              │
  │  ③ routes.rewrites (3 phases!):                               │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │  beforeFiles: trước filesystem routes! ★              │    │
  │  │  afterFiles: sau pages/public, trước dynamic! ★      │    │
  │  │  fallback: sau TẤT CẢ routes! ★                      │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  ④ routes.dynamicRoutes:                                      │
  │  → Từ [slug], [...path] segments! ★                        │
  │  → source, sourceRegex, destination, has, missing!          │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```

---

## §1.5. Use Cases!

```
  USE CASES:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  ① Deployment Platform Integration! ★                        │
  │  → Auto config cho hosting platforms (Vercel, AWS)!         │
  │                                                              │
  │  ② Asset Processing! ★                                       │
  │  → Transform/optimize build outputs!                        │
  │                                                              │
  │  ③ Monitoring Integration! ★                                  │
  │  → Collect build metrics + route info!                      │
  │                                                              │
  │  ④ Custom Bundling! ★                                         │
  │  → Package outputs cho platform-specific formats!           │
  │                                                              │
  │  ⑤ Build Validation! ★                                        │
  │  → Ensure outputs đạt yêu cầu!                             │
  │                                                              │
  │  ⑥ Route Generation! ★                                        │
  │  → Tạo platform-specific routing configs!                   │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```

---

# PHẦN 2: allowedDevOrigins

> **Nguồn**: https://nextjs.org/docs/app/api-reference/config/next-config-js/allowedDevOrigins
> **Trang KHÔNG có hình/diagram!**

---

## §2.1. allowedDevOrigins Là Gì?

```
  allowedDevOrigins — TỔNG QUAN:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  WHAT:                                                        │
  │  → Cho phép ORIGINS KHÁC request dev server! ★              │
  │  → Mặc định: chỉ localhost! ★                              │
  │  → Tương lai: cross-origin sẽ bị BLOCK by default! ★★★    │
  │  → Development mode ONLY! ★                                 │
  │                                                              │
  │  CONFIG:                                                      │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │  module.exports = {                                   │    │
  │  │    allowedDevOrigins: [                                │    │
  │  │      'local-origin.dev',                               │    │
  │  │      '*.local-origin.dev',  ← wildcard! ★            │    │
  │  │    ]                                                   │    │
  │  │  }                                                     │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  KHI NÀO CẦN:                                                 │
  │  → Dev qua custom domain (VD: ngrok, tunnel)! ★            │
  │  → Dev với nhiều subdomain! ★                              │
  │  → Mobile testing qua IP! ★                                │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```

---

# PHẦN 3: appDir

> **Nguồn**: https://nextjs.org/docs/app/api-reference/config/next-config-js/appDir
> **Trang KHÔNG có hình/diagram!**

---

## §3.1. appDir Là Gì?

```
  appDir — TỔNG QUAN:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  ⚠️ KHÔNG CẦN NỮA TỪ Next.js 13.4! ★★★                     │
  │  → App Router ĐÃ STABLE! ★★★                               │
  │  → Option này chỉ cần cho versions TRƯỚC 13.4! ★           │
  │                                                              │
  │  WHAT (lịch sử):                                               │
  │  → Enable App Router (app/ directory)! ★                    │
  │  → Hỗ trợ: layouts, Server Components, streaming! ★       │
  │  → Hỗ trợ: colocated data fetching! ★                     │
  │  → Auto enable React Strict Mode! ★                        │
  │                                                              │
  │  CẤU HÌNH (CHỈ cho < 13.4):                                   │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │  module.exports = {                                   │    │
  │  │    experimental: {                                     │    │
  │  │      appDir: true  ← KHÔNG CẦN NỮA! ★★★             │    │
  │  │    }                                                   │    │
  │  │  }                                                     │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```

---

# PHẦN 4: assetPrefix

> **Nguồn**: https://nextjs.org/docs/app/api-reference/config/next-config-js/assetPrefix
> **Trang KHÔNG có hình/diagram!**

---

## §4.1. assetPrefix Là Gì?

```
  assetPrefix — TỔNG QUAN:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  WHAT:                                                        │
  │  → Prefix URL cho static assets! ★                          │
  │  → Dùng để setup CDN! ★★★                                  │
  │  → Apply cho /_next/static/ (.next/static/)! ★             │
  │  → KHÔNG apply cho /public/ folder! ★★★                    │
  │                                                              │
  │  ⚠️ Vercel tự config CDN! Không cần assetPrefix! ★          │
  │  ⚠️ Dùng basePath cho sub-path, KHÔNG dùng assetPrefix! ★  │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```

---

## §4.2. Setup CDN!

```
  CDN SETUP:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │  import { PHASE_DEVELOPMENT_SERVER }                  │    │
  │  │    from 'next/constants'                               │    │
  │  │                                                       │    │
  │  │  export default (phase) => {                           │    │
  │  │    const isDev = phase === PHASE_DEVELOPMENT_SERVER   │    │
  │  │    return {                                            │    │
  │  │      assetPrefix: isDev                                │    │
  │  │        ? undefined         ← dev: NO prefix! ★       │    │
  │  │        : 'https://cdn.mydomain.com'  ← prod CDN! ★★★ │    │
  │  │    }                                                   │    │
  │  │  }                                                     │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  BEFORE vs AFTER:                                             │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │                                                       │    │
  │  │  BEFORE (no prefix):                                   │    │
  │  │  /_next/static/chunks/main.js                         │    │
  │  │                                                       │    │
  │  │  AFTER (with CDN prefix):                              │    │
  │  │  https://cdn.mydomain.com/_next/static/chunks/main.js │    │
  │  │  ★★★                                                  │    │
  │  │                                                       │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  CDN UPLOAD:                                                  │
  │  → Chỉ upload .next/static/ → _next/static/! ★             │
  │  → KHÔNG upload phần còn lại .next/! ★★★                   │
  │  → Server code + config = BÍ MẬT! ★                        │
  │                                                              │
  │  KHÔNG ẢNH HƯỞNG:                                             │
  │  → /public/ folder! ★★★                                    │
  │  → Muốn CDN cho public → tự thêm prefix! ★                │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```

---

# PHẦN 5: authInterrupts

> **Nguồn**: https://nextjs.org/docs/app/api-reference/config/next-config-js/authInterrupts
> **Trang KHÔNG có hình/diagram!**
> **Status**: Experimental!

---

## §5.1. authInterrupts Là Gì?

```
  authInterrupts — TỔNG QUAN:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  WHAT:                                                        │
  │  → Experimental option! ★                                   │
  │  → Enable forbidden() + unauthorized() APIs! ★★★            │
  │  → Cho auth flows: 403 Forbidden + 401 Unauthorized! ★     │
  │                                                              │
  │  CONFIG:                                                      │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │  import type { NextConfig } from 'next'               │    │
  │  │  const nextConfig: NextConfig = {                     │    │
  │  │    experimental: {                                     │    │
  │  │      authInterrupts: true  ← ENABLE! ★★★             │    │
  │  │    }                                                   │    │
  │  │  }                                                     │    │
  │  │  export default nextConfig                            │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  ENABLES:                                                     │
  │  ┌──────────────────┬──────────────────────────────────┐    │
  │  │ API               │ Mô tả                            │    │
  │  ├──────────────────┼──────────────────────────────────┤    │
  │  │ forbidden()       │ Throw 403 Forbidden! ★            │    │
  │  │ unauthorized()    │ Throw 401 Unauthorized! ★         │    │
  │  │ forbidden.js      │ UI component cho 403! ★           │    │
  │  │ unauthorized.js   │ UI component cho 401! ★           │    │
  │  └──────────────────┴──────────────────────────────────┘    │
  │                                                              │
  │  ANALOGY — so với not-found():                                │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │  notFound()    → 404 + not-found.js UI! ★             │    │
  │  │  forbidden()   → 403 + forbidden.js UI! ★             │    │
  │  │  unauthorized()→ 401 + unauthorized.js UI! ★          │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```

---

# §6. Tự Viết — ConfigOptionsEngine!

```javascript
var ConfigOptionsEngine = (function () {
  // ═══════════════════════════════════
  // 1. ADAPTER SIMULATOR
  // ═══════════════════════════════════
  function createAdapter(name) {
    return {
      name: name,
      modifyConfig: function (config, ctx) {
        if (ctx.phase === "phase-production-build") {
          config._modifiedBy = name;
          config._phase = ctx.phase;
        }
        return config;
      },
      onBuildComplete: function (ctx) {
        return {
          adapter: name,
          outputSummary: {
            pages: ctx.outputs.pages.length,
            appPages: ctx.outputs.appPages.length,
            prerenders: ctx.outputs.prerenders.length,
            staticFiles: ctx.outputs.staticFiles.length,
            middleware: ctx.outputs.middleware ? 1 : 0,
          },
          routeSummary: {
            headers: ctx.outputs.routes ? ctx.outputs.routes.headers.length : 0,
            redirects: ctx.outputs.routes
              ? ctx.outputs.routes.redirects.length
              : 0,
          },
        };
      },
    };
  }

  // ═══════════════════════════════════
  // 2. ASSET PREFIX RESOLVER
  // ═══════════════════════════════════
  function resolveAssetUrl(assetPath, assetPrefix) {
    if (!assetPrefix) {
      return { url: assetPath, note: "No prefix! Local serving! ★" };
    }
    // Remove trailing slash from prefix
    var prefix = assetPrefix.replace(/\/$/, "");
    return {
      original: assetPath,
      resolved: prefix + assetPath,
      note: "CDN prefix applied! ★★★",
    };
  }

  function validateAssetPrefix(prefix) {
    var warnings = [];
    if (prefix && prefix.indexOf("http") !== 0 && prefix.indexOf("//") !== 0) {
      warnings.push("Should be full URL or protocol-relative! ★");
    }
    if (prefix && prefix.charAt(prefix.length - 1) === "/") {
      warnings.push("Trailing slash not recommended! ★");
    }
    return {
      prefix: prefix,
      valid: warnings.length === 0,
      warnings: warnings,
      coversNextStatic: true,
      coversPublic: false,
      note: "assetPrefix ONLY covers /_next/static/! NOT /public/! ★★★",
    };
  }

  // ═══════════════════════════════════
  // 3. ALLOWED DEV ORIGINS CHECKER
  // ═══════════════════════════════════
  function checkOrigin(origin, allowedOrigins) {
    // Check exact match
    for (var i = 0; i < allowedOrigins.length; i++) {
      var pattern = allowedOrigins[i];
      if (pattern === origin) {
        return { allowed: true, matchedBy: pattern };
      }
      // Check wildcard
      if (pattern.indexOf("*") === 0) {
        var suffix = pattern.substring(1);
        if (origin.indexOf(suffix, origin.length - suffix.length) >= 0) {
          return { allowed: true, matchedBy: pattern, type: "wildcard" };
        }
      }
    }
    return {
      allowed: false,
      note: "Origin BLOCKED! Not in allowedDevOrigins! ★★★",
    };
  }

  // ═══════════════════════════════════
  // 4. AUTH INTERRUPTS SIMULATOR
  // ═══════════════════════════════════
  function authInterrupt(type) {
    var interrupts = {
      forbidden: {
        status: 403,
        function: "forbidden()",
        uiFile: "forbidden.js",
        equivalent: "Like notFound() for 404! ★",
      },
      unauthorized: {
        status: 401,
        function: "unauthorized()",
        uiFile: "unauthorized.js",
        equivalent: "Like notFound() for 404! ★",
      },
      notFound: {
        status: 404,
        function: "notFound()",
        uiFile: "not-found.js",
        note: "Already stable! Comparison only! ★",
      },
    };
    return interrupts[type] || { error: "Unknown type!" };
  }

  // ═══════════════════════════════════
  // 5. DEMO
  // ═══════════════════════════════════
  function demo() {
    console.log("═══ ConfigOptions Engine ═══");

    console.log("\n── 1. Adapter ──");
    var adapter = createAdapter("my-vercel-adapter");
    var config = { reactStrictMode: true };
    console.log(
      "Modified:",
      adapter.modifyConfig(config, {
        phase: "phase-production-build",
      }),
    );

    console.log("\n── 2. Asset Prefix ──");
    console.log(
      "No prefix:",
      resolveAssetUrl("/_next/static/chunks/main.js", null),
    );
    console.log(
      "With CDN:",
      resolveAssetUrl(
        "/_next/static/chunks/main.js",
        "https://cdn.example.com",
      ),
    );
    console.log("Validate:", validateAssetPrefix("https://cdn.example.com"));

    console.log("\n── 3. Dev Origins ──");
    var origins = ["local.dev", "*.staging.dev"];
    console.log("localhost:", checkOrigin("localhost", origins));
    console.log("local.dev:", checkOrigin("local.dev", origins));
    console.log("app.staging.dev:", checkOrigin("app.staging.dev", origins));

    console.log("\n── 4. Auth Interrupts ──");
    console.log("forbidden:", authInterrupt("forbidden"));
    console.log("unauthorized:", authInterrupt("unauthorized"));
    console.log("notFound:", authInterrupt("notFound"));
  }

  return { demo: demo };
})();
// Chạy: ConfigOptionsEngine.demo();
```

---

# §7. Câu Hỏi Phỏng Vấn!

```
  CÂU HỎI:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  ❓ 1: adapterPath dùng làm gì?                               │
  │  → Hook vào build process! ★                                │
  │  → modifyConfig: chỉnh config trước build! ★               │
  │  → onBuildComplete: xử lý outputs sau build! ★             │
  │  → 7 output types + 4 route types! ★★★                    │
  │  → Use case: deployment platform, monitoring! ★            │
  │                                                              │
  │  ❓ 2: assetPrefix vs basePath?                                │
  │  → assetPrefix: CDN URL cho /_next/static/! ★               │
  │  → basePath: sub-path deployment (/docs)! ★                │
  │  → KHÁC NHAU! Đừng nhầm lẫn! ★★★                         │
  │  → assetPrefix KHÔNG cover /public/! ★★★                   │
  │                                                              │
  │  ❓ 3: authInterrupts enable gì?                               │
  │  → forbidden() → 403 + forbidden.js UI! ★                  │
  │  → unauthorized() → 401 + unauthorized.js UI! ★            │
  │  → Giống pattern: notFound() → 404! ★                      │
  │  → experimental: { authInterrupts: true }! ★               │
  │                                                              │
  │  ❓ 4: appDir còn cần không?                                    │
  │  → KHÔNG! Stable từ 13.4! ★★★                              │
  │  → App Router mặc định! Không cần config! ★                │
  │                                                              │
  │  ❓ 5: allowedDevOrigins khi nào dùng?                         │
  │  → Dev với custom domain (ngrok, tunnel)! ★                │
  │  → Wildcard: '*.staging.dev'! ★                            │
  │  → Development mode ONLY! ★                                │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```
