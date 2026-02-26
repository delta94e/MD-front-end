# next.config.js — Deep Dive!

> **Nguồn**: https://nextjs.org/docs/app/api-reference/config/next-config-js
> **Ngôn ngữ**: Tiếng Việt — giải thích cực kỳ chi tiết!
> **Trang này KHÔNG có hình/diagram** — chỉ có text + code blocks!
> **Vị trí**: root project (cùng cấp `package.json`)!

---

## §1. next.config.js Là Gì?

```
  next.config.js — TỔNG QUAN:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  WHAT:                                                        │
  │  → File CẤU HÌNH chính của Next.js! ★★★                     │
  │  → Regular Node.js module (KHÔNG phải JSON)! ★              │
  │  → Dùng trong server + build phases! ★                      │
  │  → KHÔNG included trong browser build! ★                    │
  │  → KHÔNG bị Webpack/Babel parse! ★                          │
  │                                                              │
  │  DẠNG CƠ BẢN — CommonJS:                                     │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │  // next.config.js                                    │    │
  │  │  // @ts-check                                         │    │
  │  │  /** @type {import('next').NextConfig} */              │    │
  │  │  const nextConfig = {                                 │    │
  │  │    /* config options here */                           │    │
  │  │  }                                                     │    │
  │  │  module.exports = nextConfig                          │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  ⚠️ KHÔNG có config nào BẮT BUỘC! ★                         │
  │  → Chỉ config khi CẦN! ★                                   │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```

---

## §2. 4 Dạng Config File!

```
  FILE FORMATS:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  ┌───────────────────┬──────────────────┬────────────────┐   │
  │  │ File                │ Module System      │ Export           │   │
  │  ├───────────────────┼──────────────────┼────────────────┤   │
  │  │ next.config.js      │ CommonJS          │ module.exports  │   │
  │  │ next.config.mjs     │ ESM (ES Modules)  │ export default  │   │
  │  │ next.config.ts      │ TypeScript        │ export default  │   │
  │  │ next.config.cjs     │ ⛔ NOT SUPPORTED!  │ —              │   │
  │  │ next.config.cts     │ ⛔ NOT SUPPORTED!  │ —              │   │
  │  └───────────────────┴──────────────────┴────────────────┘   │
  │                                                              │
  │  ESM — next.config.mjs:                                       │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │  // @ts-check                                         │    │
  │  │  /** @type {import('next').NextConfig} */              │    │
  │  │  const nextConfig = { /* ... */ }                     │    │
  │  │  export default nextConfig  ← ESM! ★                 │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  TypeScript — next.config.ts:                                 │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │  import type { NextConfig } from 'next'               │    │
  │  │  const nextConfig: NextConfig = { /* ... */ }         │    │
  │  │  export default nextConfig  ← Full type safety! ★★★  │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```

---

## §3. Configuration as Function + Async!

```
  FUNCTION CONFIG:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  DẠNG 1: Synchronous Function!                                │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │  export default (phase, { defaultConfig }) => {       │    │
  │  │    const nextConfig = { /* ... */ }                   │    │
  │  │    return nextConfig                                  │    │
  │  │  }                                                     │    │
  │  │                                                       │    │
  │  │  → phase: context hiện tại! ★                         │    │
  │  │  → defaultConfig: config mặc định! ★                 │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  DẠNG 2: Async Function (since v12.1.0)!                      │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │  module.exports = async (phase, { defaultConfig }) => │    │
  │  │  {                                                     │    │
  │  │    const data = await fetchSomething()  ← ASYNC! ★   │    │
  │  │    return { /* config */ }                            │    │
  │  │  }                                                     │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```

---

## §4. Phases — Build Context!

```
  PHASES:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  import { PHASE_DEVELOPMENT_SERVER } from 'next/constants'   │
  │                                                              │
  │  CÁC PHASE CÓ SẴN:                                           │
  │  ┌──────────────────────────────┬───────────────────────┐    │
  │  │ Phase Constant                │ Khi nào?               │    │
  │  ├──────────────────────────────┼───────────────────────┤    │
  │  │ PHASE_DEVELOPMENT_SERVER     │ next dev! ★            │    │
  │  │ PHASE_PRODUCTION_BUILD       │ next build! ★          │    │
  │  │ PHASE_PRODUCTION_SERVER      │ next start! ★          │    │
  │  │ PHASE_EXPORT                 │ next export! ★         │    │
  │  │ PHASE_TEST                   │ Testing! ★             │    │
  │  └──────────────────────────────┴───────────────────────┘    │
  │                                                              │
  │  EXAMPLE — Config theo phase:                                 │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │  const { PHASE_DEVELOPMENT_SERVER }                   │    │
  │  │    = require('next/constants')                         │    │
  │  │                                                       │    │
  │  │  module.exports = (phase) => {                         │    │
  │  │    if (phase === PHASE_DEVELOPMENT_SERVER) {           │    │
  │  │      return {                                          │    │
  │  │        /* dev-only config ★ */                         │    │
  │  │        env: { API_URL: 'http://localhost:3001' }      │    │
  │  │      }                                                 │    │
  │  │    }                                                   │    │
  │  │    return {                                            │    │
  │  │      /* production config ★ */                         │    │
  │  │      env: { API_URL: 'https://api.example.com' }      │    │
  │  │    }                                                   │    │
  │  │  }                                                     │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```

---

## §5. Unit Testing (Experimental — v15.1+)!

```
  UNIT TESTING:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  import { unstable_getResponseFromNextConfig,                │
  │    getRedirectUrl }                                          │
  │    from 'next/experimental/testing/server'                   │
  │                                                              │
  │  → Test headers, redirects, rewrites! ★                     │
  │  → KHÔNG test proxy/filesystem routes! ★                    │
  │  → Chỉ test next.config.js fields! ★                       │
  │                                                              │
  │  EXAMPLE:                                                     │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │  const response = await                                │    │
  │  │    unstable_getResponseFromNextConfig({                │    │
  │  │      url: 'https://example.com/test',                  │    │
  │  │      nextConfig: {                                     │    │
  │  │        async redirects() {                              │    │
  │  │          return [{                                      │    │
  │  │            source: '/test',                             │    │
  │  │            destination: '/test2',                       │    │
  │  │            permanent: false,                            │    │
  │  │          }]                                             │    │
  │  │        }                                                │    │
  │  │      }                                                  │    │
  │  │    })                                                   │    │
  │  │                                                       │    │
  │  │  expect(response.status).toEqual(307)  ← temp! ★     │    │
  │  │  expect(getRedirectUrl(response))                      │    │
  │  │    .toEqual('https://example.com/test2')! ★           │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```

---

## §6. Tất Cả Config Options — 50+ Options!

```
  CONFIG OPTIONS — PHÂN LOẠI:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  ── ROUTING ──                                                │
  │  ┌────────────────────────┬──────────────────────────────┐   │
  │  │ Option                   │ Mô tả                        │   │
  │  ├────────────────────────┼──────────────────────────────┤   │
  │  │ basePath                │ Deploy dưới sub-path! ★      │   │
  │  │ headers                 │ Custom HTTP headers! ★       │   │
  │  │ redirects               │ URL redirects! ★             │   │
  │  │ rewrites                │ URL rewrites! ★              │   │
  │  │ trailingSlash           │ /about vs /about/! ★         │   │
  │  └────────────────────────┴──────────────────────────────┘   │
  │                                                              │
  │  ── BUILD + OUTPUT ──                                         │
  │  ┌────────────────────────┬──────────────────────────────┐   │
  │  │ distDir                 │ Custom build dir (.next)! ★  │   │
  │  │ output                  │ standalone/export! ★          │   │
  │  │ generateBuildId         │ Custom build ID! ★           │   │
  │  │ compress                │ gzip compression! ★          │   │
  │  │ pageExtensions          │ Resolve extensions! ★        │   │
  │  │ exportPathMap           │ Static export pages! ★       │   │
  │  └────────────────────────┴──────────────────────────────┘   │
  │                                                              │
  │  ── CACHING ──                                                │
  │  ┌────────────────────────┬──────────────────────────────┐   │
  │  │ cacheHandler            │ External cache (Redis)! ★    │   │
  │  │ cacheHandlers           │ use cache handlers! ★        │   │
  │  │ cacheLife               │ Cache lifetime! ★            │   │
  │  │ cacheComponents         │ Component caching! ★         │   │
  │  │ expireTime              │ ISR SWR expire! ★            │   │
  │  │ staleTimes              │ Client Router Cache! ★       │   │
  │  │ generateEtags           │ ETags per page! ★            │   │
  │  └────────────────────────┴──────────────────────────────┘   │
  │                                                              │
  │  ── IMAGES + ASSETS ──                                        │
  │  ┌────────────────────────┬──────────────────────────────┐   │
  │  │ images                  │ next/image loader config! ★  │   │
  │  │ assetPrefix             │ CDN prefix! ★                │   │
  │  └────────────────────────┴──────────────────────────────┘   │
  │                                                              │
  │  ── CSS + STYLING ──                                          │
  │  ┌────────────────────────┬──────────────────────────────┐   │
  │  │ cssChunking             │ CSS chunk strategy! ★        │   │
  │  │ inlineCss               │ Inline CSS (experimental)! ★│   │
  │  │ sassOptions             │ SASS compiler options! ★     │   │
  │  │ useLightningcss         │ Lightning CSS! ★             │   │
  │  └────────────────────────┴──────────────────────────────┘   │
  │                                                              │
  │  ── REACT + COMPILER ──                                       │
  │  ┌────────────────────────┬──────────────────────────────┐   │
  │  │ reactStrictMode         │ Strict Mode! ★               │   │
  │  │ reactCompiler           │ React Compiler! ★            │   │
  │  │ reactMaxHeadersLength   │ RSC headers length! ★        │   │
  │  │ viewTransition          │ View Transition API! ★       │   │
  │  └────────────────────────┴──────────────────────────────┘   │
  │                                                              │
  │  ── SERVER + NETWORKING ──                                    │
  │  ┌────────────────────────┬──────────────────────────────┐   │
  │  │ serverActions           │ SA behavior config! ★        │   │
  │  │ serverExternalPackages  │ Exclude from bundle! ★       │   │
  │  │ serverComponentsHmrCache│ HMR cache for SC! ★         │   │
  │  │ httpAgentOptions        │ HTTP Keep-Alive! ★           │   │
  │  │ proxyClientMaxBodySize  │ Max body size! ★             │   │
  │  │ crossOrigin             │ Script crossorigin! ★        │   │
  │  └────────────────────────┴──────────────────────────────┘   │
  │                                                              │
  │  ── TYPESCRIPT + DEV ──                                       │
  │  ┌────────────────────────┬──────────────────────────────┐   │
  │  │ typescript              │ TS error handling! ★         │   │
  │  │ typedRoutes             │ Typed links (exp.)! ★        │   │
  │  │ devIndicators           │ Dev indicators UI! ★         │   │
  │  │ allowedDevOrigins       │ Dev server origins! ★        │   │
  │  │ onDemandEntries         │ Dev page disposal! ★         │   │
  │  │ logging                 │ Fetch logging! ★             │   │
  │  │ browserDebugInfoInTerminal│ Console → terminal! ★     │   │
  │  │ isolatedDevBuild        │ Isolated dev output! ★       │   │
  │  └────────────────────────┴──────────────────────────────┘   │
  │                                                              │
  │  ── BUNDLER ──                                                │
  │  ┌────────────────────────┬──────────────────────────────┐   │
  │  │ webpack                 │ Custom webpack config! ★     │   │
  │  │ turbopack               │ Turbopack options! ★         │   │
  │  │ turbopackFileSystemCache│ FS cache for Turbo! ★       │   │
  │  │ transpilePackages       │ Transpile node_modules! ★   │   │
  │  │ optimizePackageImports  │ Barrel file optimize! ★     │   │
  │  │ urlImports              │ ESM URL imports! ★           │   │
  │  └────────────────────────┴──────────────────────────────┘   │
  │                                                              │
  │  ── SECURITY + OTHER ──                                       │
  │  ┌────────────────────────┬──────────────────────────────┐   │
  │  │ env                     │ Build-time env vars! ★       │   │
  │  │ poweredByHeader         │ x-powered-by header! ★       │   │
  │  │ productionBrowserSourceMaps│ Prod source maps! ★      │   │
  │  │ deploymentId            │ Version skew protect! ★      │   │
  │  │ authInterrupts          │ forbidden/unauthorized! ★    │   │
  │  │ taint                   │ Taint objects! ★             │   │
  │  │ htmlLimitedBots         │ Bot metadata! ★              │   │
  │  │ webVitalsAttribution    │ Web Vitals debug! ★          │   │
  │  │ mdxRs                   │ Rust MDX compiler! ★         │   │
  │  │ staticGeneration*       │ Static gen config! ★         │   │
  │  │ appDir                  │ App Router enable! ★         │   │
  │  │ adapterPath             │ Build adapter! ★             │   │
  │  └────────────────────────┴──────────────────────────────┘   │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```

---

## §7. Tự Viết — NextConfigEngine!

```javascript
var NextConfigEngine = (function () {
  // ═══════════════════════════════════
  // 1. PHASES
  // ═══════════════════════════════════
  var PHASES = {
    PHASE_DEVELOPMENT_SERVER: "phase-development-server",
    PHASE_PRODUCTION_BUILD: "phase-production-build",
    PHASE_PRODUCTION_SERVER: "phase-production-server",
    PHASE_EXPORT: "phase-export",
    PHASE_TEST: "phase-test",
  };

  // ═══════════════════════════════════
  // 2. CONFIG VALIDATOR
  // ═══════════════════════════════════
  var KNOWN_OPTIONS = [
    "basePath",
    "headers",
    "redirects",
    "rewrites",
    "trailingSlash",
    "distDir",
    "output",
    "generateBuildId",
    "compress",
    "pageExtensions",
    "images",
    "assetPrefix",
    "env",
    "reactStrictMode",
    "typescript",
    "webpack",
    "turbopack",
    "serverActions",
    "serverExternalPackages",
    "cssChunking",
    "sassOptions",
    "cacheHandler",
    "staleTimes",
    "poweredByHeader",
    "productionBrowserSourceMaps",
    "crossOrigin",
  ];

  function validateConfig(config) {
    var warnings = [];
    var valid = [];
    for (var key in config) {
      if (KNOWN_OPTIONS.indexOf(key) >= 0) {
        valid.push(key);
      } else {
        warnings.push(key + " → unknown option! Check docs! ★");
      }
    }
    return { valid: valid, warnings: warnings };
  }

  // ═══════════════════════════════════
  // 3. FILE FORMAT DETECTOR
  // ═══════════════════════════════════
  function detectFormat(filename) {
    var formats = {
      "next.config.js": {
        module: "CommonJS",
        export: "module.exports",
        supported: true,
      },
      "next.config.mjs": {
        module: "ESM",
        export: "export default",
        supported: true,
      },
      "next.config.ts": {
        module: "TypeScript",
        export: "export default",
        supported: true,
      },
      "next.config.cjs": {
        module: "CommonJS explicit",
        supported: false,
        error: "NOT SUPPORTED! ★★★",
      },
      "next.config.cts": {
        module: "TypeScript CommonJS",
        supported: false,
        error: "NOT SUPPORTED! ★★★",
      },
    };
    return formats[filename] || { error: "Unknown file!" };
  }

  // ═══════════════════════════════════
  // 4. PHASE-BASED CONFIG RESOLVER
  // ═══════════════════════════════════
  function resolveConfig(configFn, phase) {
    if (typeof configFn === "function") {
      var defaultConfig = { reactStrictMode: true };
      var result = configFn(phase, { defaultConfig: defaultConfig });
      return {
        phase: phase,
        resolved: result,
        note: "Config resolved for phase: " + phase + "! ★",
      };
    }
    return { resolved: configFn, note: "Static config (not function)! ★" };
  }

  // ═══════════════════════════════════
  // 5. REDIRECT/REWRITE TESTER
  // ═══════════════════════════════════
  function testRedirect(redirects, requestPath) {
    for (var i = 0; i < redirects.length; i++) {
      var r = redirects[i];
      if (r.source === requestPath) {
        return {
          matched: true,
          destination: r.destination,
          permanent: r.permanent,
          status: r.permanent ? 308 : 307,
          note: (r.permanent ? "Permanent" : "Temporary") + " redirect! ★",
        };
      }
    }
    return { matched: false, note: "No redirect matched! ★" };
  }

  function testRewrite(rewrites, requestPath) {
    for (var i = 0; i < rewrites.length; i++) {
      var r = rewrites[i];
      if (r.source === requestPath) {
        return {
          matched: true,
          destination: r.destination,
          note: "Rewrite matched! URL stays same, content from destination! ★",
        };
      }
    }
    return { matched: false };
  }

  // ═══════════════════════════════════
  // 6. DEMO
  // ═══════════════════════════════════
  function demo() {
    console.log("═══ NextConfig Engine ═══");

    console.log("\n── 1. File Formats ──");
    console.log("next.config.js:", detectFormat("next.config.js"));
    console.log("next.config.ts:", detectFormat("next.config.ts"));
    console.log("next.config.cjs:", detectFormat("next.config.cjs"));

    console.log("\n── 2. Validate ──");
    console.log(
      validateConfig({
        basePath: "/app",
        reactStrictMode: true,
        unknownOption: true,
      }),
    );

    console.log("\n── 3. Phase Config ──");
    var configFn = function (phase) {
      if (phase === PHASES.PHASE_DEVELOPMENT_SERVER) {
        return { env: { API: "http://localhost:3001" } };
      }
      return { env: { API: "https://api.prod.com" } };
    };
    console.log(
      "DEV:",
      resolveConfig(configFn, PHASES.PHASE_DEVELOPMENT_SERVER),
    );
    console.log(
      "PROD:",
      resolveConfig(configFn, PHASES.PHASE_PRODUCTION_BUILD),
    );

    console.log("\n── 4. Redirects ──");
    var redirects = [
      { source: "/old", destination: "/new", permanent: true },
      { source: "/temp", destination: "/other", permanent: false },
    ];
    console.log("/old:", testRedirect(redirects, "/old"));
    console.log("/temp:", testRedirect(redirects, "/temp"));
    console.log("/none:", testRedirect(redirects, "/none"));

    console.log("\n── 5. Rewrites ──");
    var rewrites = [
      { source: "/api/:path*", destination: "https://backend.com/:path*" },
    ];
    console.log("/api/:path*:", testRewrite(rewrites, "/api/:path*"));
  }

  return { demo: demo };
})();
// Chạy: NextConfigEngine.demo();
```

---

## §8. Câu Hỏi Phỏng Vấn!

```
  CÂU HỎI:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  ❓ 1: next.config.js hỗ trợ format nào?                      │
  │  → .js (CommonJS), .mjs (ESM), .ts (TypeScript)! ★         │
  │  → .cjs + .cts KHÔNG supported! ★★★                       │
  │  → .ts cho full type safety! ★                              │
  │                                                              │
  │  ❓ 2: Phase dùng làm gì?                                      │
  │  → Config KHÁC NHAU cho dev/build/prod/export! ★★★         │
  │  → import { PHASE_DEVELOPMENT_SERVER }                       │
  │    from 'next/constants'! ★                                 │
  │  → Config as function nhận (phase, { defaultConfig })! ★   │
  │                                                              │
  │  ❓ 3: Async config khi nào cần?                               │
  │  → Fetch remote config, read file, API call! ★              │
  │  → Since v12.1.0! ★                                         │
  │  → module.exports = async (phase) => { ... }! ★            │
  │                                                              │
  │  ❓ 4: redirects vs rewrites?                                  │
  │  → redirect: URL ĐỔI! Browser thấy URL mới! ★★★           │
  │  → rewrite: URL GIỮ NGUYÊN! Content từ destination! ★★★   │
  │  → redirect: permanent=308, temporary=307! ★                │
  │                                                              │
  │  ❓ 5: Unit testing config?                                    │
  │  → next/experimental/testing/server! ★                      │
  │  → unstable_getResponseFromNextConfig()! ★                  │
  │  → Test redirects/rewrites/headers! ★                      │
  │  → KHÔNG test proxy/filesystem routes! ★                    │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```
