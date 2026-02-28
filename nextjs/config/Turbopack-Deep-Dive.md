# Turbopack — Deep Dive!

> **Nguồn**: https://nextjs.org/docs/app/api-reference/turbopack
> **Ngôn ngữ**: Tiếng Việt — giải thích cực kỳ chi tiết!
> **Trang này KHÔNG có hình/diagram** — chỉ có text + code blocks!

---

## §1. Turbopack Là Gì?

```
  Turbopack — TỔNG QUAN:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  WHAT:                                                        │
  │  → Incremental bundler viết bằng RUST! ★★★                │
  │  → Optimized cho JavaScript + TypeScript! ★                │
  │  → Built into Next.js! ★★★                                │
  │  → Default bundler (không cần config)! ★★★                │
  │  → Pages Router + App Router đều dùng được! ★             │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```

---

## §2. Why Turbopack? — 4 Lý Do!

```
  WHY TURBOPACK:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  ① UNIFIED GRAPH:                                             │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │                                                       │    │
  │  │  Webpack (cũ):                                         │    │
  │  │  Client compiler ─┐                                    │    │
  │  │  Server compiler ─┼→ stitch bundles → tedious! ★★★   │    │
  │  │  Edge compiler  ──┘                                    │    │
  │  │                                                       │    │
  │  │  Turbopack (mới):                                      │    │
  │  │  ┌─────────────────────────────┐                       │    │
  │  │  │  Single Unified Graph! ★★★  │                       │    │
  │  │  │  Client + Server + Edge     │                       │    │
  │  │  │  → 1 graph cho TẤT CẢ!     │                       │    │
  │  │  └─────────────────────────────┘                       │    │
  │  │                                                       │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  ② BUNDLING vs NATIVE ESM:                                    │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │                                                       │    │
  │  │  Vite (Native ESM):                                    │    │
  │  │  → Small apps: NHANH! ★                               │    │
  │  │  → Large apps: CHẬM (quá nhiều requests)! ★★★       │    │
  │  │                                                       │    │
  │  │  Turbopack:                                            │    │
  │  │  → Bundle in dev! ★                                   │    │
  │  │  → Nhưng OPTIMIZED → large apps vẫn nhanh! ★★★      │    │
  │  │                                                       │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  ③ INCREMENTAL COMPUTATION:                                   │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │  → Parallelize across CPU cores! ★★★                 │    │
  │  │  → Cache results down to FUNCTION level! ★★★         │    │
  │  │  → Đã làm xong → KHÔNG lặp lại! ★★★                │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  ④ LAZY BUNDLING:                                             │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │  → Chỉ bundle khi dev server THỰC SỰ request! ★★★  │    │
  │  │  → Giảm initial compile time! ★                      │    │
  │  │  → Giảm memory usage! ★★★                            │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```

---

## §3. Supported Features!

```
  SUPPORTED FEATURES:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  ┌─── Language ────────────────────────────────────────┐     │
  │  │  ✅ TypeScript (tsc --watch recommended)              │     │
  │  │  ✅ JSX / TSX                                          │     │
  │  │  ✅ require() + import                                 │     │
  │  │  ✅ Babel (if config file exists)                      │     │
  │  │     → Or manually configure babel-loader              │     │
  │  └─────────────────────────────────────────────────────┘     │
  │                                                              │
  │  ┌─── CSS & Styling ──────────────────────────────────┐     │
  │  │  ✅ CSS (.css)                                         │     │
  │  │  ✅ CSS Modules (.module.css)                          │     │
  │  │  ✅ CSS Nesting (lightningcss)                         │     │
  │  │  ✅ PostCSS (postcss.config.js)                        │     │
  │  │  ✅ Sass (trừ sassOptions.functions)                   │     │
  │  │  ✅ :local / :global                                   │     │
  │  └─────────────────────────────────────────────────────┘     │
  │                                                              │
  │  ┌─── Assets ──────────────────────────────────────────┐     │
  │  │  ✅ Static imports (import img from './img.png')       │     │
  │  │  ✅ <Image /> component                                │     │
  │  │  ✅ JSON imports                                       │     │
  │  └─────────────────────────────────────────────────────┘     │
  │                                                              │
  │  ┌─── Module Resolution ───────────────────────────────┐     │
  │  │  ✅ tsconfig paths + baseUrl                           │     │
  │  │  ✅ resolveAlias (= webpack resolve.alias)             │     │
  │  │  ✅ resolveExtensions                                  │     │
  │  └─────────────────────────────────────────────────────┘     │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```

---

## §4. Known Gaps + Config!

```
  GAPS & CONFIG:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  ⚠️ KNOWN GAPS vs Webpack:                                     │
  │  → Filesystem Root behavior khác! ★                        │
  │  → CSS Module ordering khác! ★                             │
  │  → Sass node_modules imports! ★                            │
  │  → Build Caching! ★                                        │
  │  → Webpack plugins KHÔNG hỗ trợ! ★★★                     │
  │                                                              │
  │  ❌ UNSUPPORTED:                                               │
  │  → experimental.sri.algorithm ★                            │
  │  → experimental.fallbackNodePolyfills ★                    │
  │                                                              │
  │  CONFIG (next.config.js):                                     │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │  module.exports = {                                   │    │
  │  │    turbopack: {                                        │    │
  │  │      rules: { /* webpack loaders */ },    ★           │    │
  │  │      resolveAlias: {                      ★★★        │    │
  │  │        underscore: 'lodash'                           │    │
  │  │      },                                                │    │
  │  │      resolveExtensions: ['.mdx','.tsx',   ★           │    │
  │  │        '.ts','.jsx','.js','.json']                    │    │
  │  │    }                                                   │    │
  │  │  }                                                     │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  DEBUG TRACE:                                                 │
  │  → NEXT_TURBOPACK_TRACING=1 next dev ★                    │
  │  → Output: .next/dev/trace-turbopack ★                    │
  │                                                              │
  │  FALLBACK WEBPACK:                                            │
  │  → next dev --turbopack=false ★                            │
  │  → next build --turbopack=false ★                          │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```

---

## §5. Tự Viết — TurbopackEngine!

```javascript
var TurbopackEngine = (function () {
  // ═══════════════════════════════════
  // 1. INCREMENTAL CACHE (function-level)
  // ═══════════════════════════════════
  var cache = {};
  var stats = { hits: 0, misses: 0, compiles: 0 };

  function compile(moduleId, source) {
    if (cache[moduleId] && cache[moduleId].source === source) {
      stats.hits++;
      return {
        moduleId: moduleId,
        cached: true,
        note: "Cache HIT! No recompile! ★★★",
      };
    }
    stats.misses++;
    stats.compiles++;
    cache[moduleId] = { source: source, compiledAt: Date.now() };
    return {
      moduleId: moduleId,
      cached: false,
      note: "Compiled! Cached for next time! ★",
    };
  }

  // ═══════════════════════════════════
  // 2. LAZY BUNDLER (on-demand)
  // ═══════════════════════════════════
  var bundled = {};

  function requestModule(route, allModules) {
    if (bundled[route]) {
      return {
        route: route,
        alreadyBundled: true,
        note: "Already bundled! Instant! ★★★",
      };
    }

    // Only bundle what's needed for this route
    var needed = allModules[route] || [];
    bundled[route] = needed;

    var notBundled = Object.keys(allModules).filter(function (r) {
      return !bundled[r];
    });

    return {
      route: route,
      bundledModules: needed.length,
      skippedRoutes: notBundled.length,
      note: "Lazy! Only bundled " + needed.length + " modules! ★★★",
    };
  }

  // ═══════════════════════════════════
  // 3. UNIFIED GRAPH (client + server)
  // ═══════════════════════════════════
  function buildUnifiedGraph(modules) {
    var graph = { client: [], server: [], shared: [] };

    for (var i = 0; i < modules.length; i++) {
      var mod = modules[i];
      if (mod.env === "client") graph.client.push(mod.name);
      else if (mod.env === "server") graph.server.push(mod.name);
      else graph.shared.push(mod.name);
    }

    return {
      graph: graph,
      total: modules.length,
      note: "Single graph for ALL environments! ★★★",
    };
  }

  // ═══════════════════════════════════
  // 4. RESOLVE ALIAS
  // ═══════════════════════════════════
  function resolveAlias(importPath, aliases) {
    for (var alias in aliases) {
      if (importPath === alias || importPath.indexOf(alias + "/") === 0) {
        var resolved = importPath.replace(alias, aliases[alias]);
        return { original: importPath, resolved: resolved, aliased: true };
      }
    }
    return { original: importPath, resolved: importPath, aliased: false };
  }

  // ═══════════════════════════════════
  // 5. DEMO
  // ═══════════════════════════════════
  function demo() {
    console.log("═══ Turbopack Engine ═══");

    console.log("\n── 1. Incremental Cache ──");
    console.log(compile("utils.js", "export const x = 1"));
    console.log(compile("utils.js", "export const x = 1")); // HIT!
    console.log(compile("utils.js", "export const x = 2")); // MISS
    console.log("Stats:", stats);

    console.log("\n── 2. Lazy Bundling ──");
    var routes = {
      "/": ["react", "layout", "home"],
      "/about": ["react", "layout", "about"],
      "/blog": ["react", "layout", "blog", "mdx"],
    };
    console.log(requestModule("/", routes));
    console.log(requestModule("/about", routes));
    console.log(requestModule("/", routes)); // already bundled!

    console.log("\n── 3. Unified Graph ──");
    console.log(
      buildUnifiedGraph([
        { name: "Button", env: "client" },
        { name: "fetchData", env: "server" },
        { name: "utils", env: "shared" },
        { name: "Form", env: "client" },
      ]),
    );

    console.log("\n── 4. Resolve Alias ──");
    var aliases = { underscore: "lodash", "@": "./src" };
    console.log(resolveAlias("underscore", aliases));
    console.log(resolveAlias("@/components/Button", aliases));
  }

  return { demo: demo };
})();
// Chạy: TurbopackEngine.demo();
```

---

## §6. Câu Hỏi Phỏng Vấn!

```
  CÂU HỎI:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  ❓ 1: Turbopack là gì?                                        │
  │  → Incremental bundler viết bằng Rust! ★★★                │
  │  → Built into Next.js, default bundler! ★                  │
  │  → Thay thế Webpack! ★★★                                  │
  │                                                              │
  │  ❓ 2: 4 lý do dùng Turbopack?                                │
  │  → ① Unified Graph: 1 graph cho client + server! ★★★     │
  │  → ② Bundling: bundle in dev (không dùng native ESM)! ★  │
  │  → ③ Incremental: cache function-level, parallel! ★★★    │
  │  → ④ Lazy Bundling: chỉ bundle khi request! ★★★         │
  │                                                              │
  │  ❓ 3: Turbopack vs Vite?                                      │
  │  → Vite = native ESM → large apps chậm! ★★★             │
  │  → Turbopack = bundle in dev → optimized! ★★★            │
  │                                                              │
  │  ❓ 4: Config Turbopack?                                       │
  │  → turbopack key trong next.config.js! ★                  │
  │  → rules (webpack loaders)! ★                              │
  │  → resolveAlias (= resolve.alias)! ★★★                   │
  │  → resolveExtensions! ★                                    │
  │                                                              │
  │  ❓ 5: Dùng lại Webpack?                                      │
  │  → next dev --turbopack=false! ★                           │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```
