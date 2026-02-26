# Turbopack (API Reference) — Deep Dive!

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
  │  → Incremental bundler viết bằng Rust! ★★★                │
  │  → Built-in Next.js (default bundler)! ★★★                │
  │  → Pages Router + App Router! ★                            │
  │  → Zero-config! ★★★                                       │
  │                                                              │
  │  4 LỢI ÍCH:                                                  │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │                                                       │    │
  │  │  ① Unified Graph ★★★                                  │    │
  │  │     → 1 graph cho client + server!                    │    │
  │  │     → Không cần multiple compilers!                   │    │
  │  │                                                       │    │
  │  │  ② Bundling (vs Native ESM) ★★★                       │    │
  │  │     → Native ESM = nhiều network requests!            │    │
  │  │     → Turbopack bundle tối ưu trong dev!             │    │
  │  │     → Large apps vẫn nhanh!                           │    │
  │  │                                                       │    │
  │  │  ③ Incremental Computation ★★★                         │    │
  │  │     → Parallelize across cores!                       │    │
  │  │     → Cache kết quả đến từng function!               │    │
  │  │     → Không lặp lại công việc đã làm!               │    │
  │  │                                                       │    │
  │  │  ④ Lazy Bundling ★★★                                   │    │
  │  │     → Chỉ bundle những gì dev server request!        │    │
  │  │     → Giảm initial compile time + memory!            │    │
  │  │                                                       │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  GETTING STARTED:                                             │
  │  → Default! Không cần config! ★★★                        │
  │  → next dev = Turbopack! ★★★                              │
  │  → next build = Turbopack! ★                              │
  │  → Muốn webpack: next dev --webpack ★                    │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```

---

## §2. Supported Features + Gaps!

```
  SUPPORTED vs GAPS:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  ✅ SUPPORTED:                                                 │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │                                                       │    │
  │  │  LANGUAGE:                                             │    │
  │  │  → TypeScript (tsc --watch equivalent) ★★★            │    │
  │  │  → JavaScript (require + import) ★                    │    │
  │  │  → Babel: chỉ nếu có config → manual babel-loader ★ │    │
  │  │                                                       │    │
  │  │  CSS & STYLING:                                        │    │
  │  │  → .css (Global CSS) ★★★                              │    │
  │  │  → .module.css (CSS Modules) ★★★                      │    │
  │  │  → PostCSS (postcss.config.js) ★                      │    │
  │  │  → CSS nesting (Lightning CSS) ★                     │    │
  │  │                                                       │    │
  │  │  ASSETS:                                               │    │
  │  │  → import img from './img.png' ★★★                    │    │
  │  │  → <Image /> component ★                             │    │
  │  │  → .json imports ★                                    │    │
  │  │                                                       │    │
  │  │  MODULE RESOLUTION:                                    │    │
  │  │  → tsconfig.json paths + baseUrl ★★★                  │    │
  │  │  → resolveAlias (= webpack.resolve.alias) ★           │    │
  │  │  → resolveExtensions ★                                │    │
  │  │                                                       │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  ❌ UNSUPPORTED / UNPLANNED:                                   │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │                                                       │    │
  │  │  CSS MODULES LEGACY:                                   │    │
  │  │  → :local / :global standalone ❌ ★★★                  │    │
  │  │     (chỉ :global(...) function được!) ★★★            │    │
  │  │  → @value rule ❌ (dùng CSS variables!) ★              │    │
  │  │  → :import / :export ICSS ❌ ★                         │    │
  │  │  → composes .css file ❌ → đổi thành .module.css! ★  │    │
  │  │  → @import .css as Module ❌ → .module.css! ★         │    │
  │  │                                                       │    │
  │  │  SASS:                                                 │    │
  │  │  → sassOptions.functions ❌ ★★★                        │    │
  │  │     (Rust không execute JS functions!) ★              │    │
  │  │                                                       │    │
  │  │  WEBPACK:                                              │    │
  │  │  → webpack() config ❌ → dùng turbopack key! ★★★      │    │
  │  │  → Webpack plugins ❌ ★                                │    │
  │  │                                                       │    │
  │  │  OTHER:                                                │    │
  │  │  → Yarn PnP ❌ (not planned!) ★                        │    │
  │  │  → experimental.urlImports ❌ ★                        │    │
  │  │  → experimental.esmExternals ❌ ★                      │    │
  │  │                                                       │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```

---

## §3. Configuration + Trace Files!

```
  CONFIG + DEBUG:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  CONFIGURATION (turbopack key):                               │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │  module.exports = {                                   │    │
  │  │    turbopack: {                                        │    │
  │  │      rules: { ... }, // webpack loaders ★★★           │    │
  │  │      resolveAlias: {                                   │    │
  │  │        underscore: 'lodash' ★                         │    │
  │  │      },                                                │    │
  │  │      resolveExtensions: [                              │    │
  │  │        '.mdx','.tsx','.ts','.jsx','.js','.json' ★    │    │
  │  │      ]                                                 │    │
  │  │    }                                                   │    │
  │  │  }                                                     │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  TRACE FILES (performance debugging):                         │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │  NEXT_TURBOPACK_TRACING=1 next dev ★★★                │    │
  │  │       ↓                                                │    │
  │  │  .next/dev/trace-turbopack ★                          │    │
  │  │       ↓                                                │    │
  │  │  Attach to GitHub issue! ★                            │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```

---

## §4. Tự Viết — TurbopackAPIEngine!

```javascript
var TurbopackAPIEngine = (function () {
  // ═══════════════════════════════════
  // 1. FEATURE REGISTRY
  // ═══════════════════════════════════
  var SUPPORTED = {
    language: ["typescript", "javascript", "babel-loader"],
    css: [".css", ".module.css", "postcss", "css-nesting", "sass", "scss"],
    assets: ["static-imports", "Image", "json"],
    resolution: [
      "tsconfig-paths",
      "baseUrl",
      "resolveAlias",
      "resolveExtensions",
    ],
  };

  var UNSUPPORTED = [
    ":local/:global-standalone",
    "@value",
    ":import/:export",
    "composes-.css",
    "@import-.css-as-module",
    "sassOptions.functions",
    "webpack()-config",
    "webpack-plugins",
    "Yarn-PnP",
    "urlImports",
    "esmExternals",
  ];

  // ═══════════════════════════════════
  // 2. FEATURE CHECKER
  // ═══════════════════════════════════
  function checkFeature(feature) {
    for (var cat in SUPPORTED) {
      if (SUPPORTED[cat].indexOf(feature) >= 0) {
        return {
          feature: feature,
          supported: true,
          category: cat,
          note: "✅ Supported in Turbopack ★★★",
        };
      }
    }
    if (UNSUPPORTED.indexOf(feature) >= 0) {
      return {
        feature: feature,
        supported: false,
        note: "❌ NOT supported! Use webpack or migrate ★★★",
      };
    }
    return { feature: feature, supported: null, note: "⚠️ Unknown ★" };
  }

  // ═══════════════════════════════════
  // 3. CONFIG BUILDER
  // ═══════════════════════════════════
  function buildConfig(options) {
    var config = { turbopack: {} };
    if (options.aliases) config.turbopack.resolveAlias = options.aliases;
    if (options.extensions)
      config.turbopack.resolveExtensions = options.extensions;
    if (options.rules) config.turbopack.rules = options.rules;
    return config;
  }

  // ═══════════════════════════════════
  // 4. BUNDLER SELECTOR
  // ═══════════════════════════════════
  function selectBundler(requirements) {
    var needsWebpack = false;
    var reasons = [];

    for (var i = 0; i < requirements.length; i++) {
      if (UNSUPPORTED.indexOf(requirements[i]) >= 0) {
        needsWebpack = true;
        reasons.push(requirements[i]);
      }
    }

    return {
      bundler: needsWebpack ? "webpack" : "turbopack",
      reasons: needsWebpack
        ? reasons.map(function (r) {
            return r + " not supported in Turbopack";
          })
        : ["All features supported! ★★★"],
      command: needsWebpack ? "next dev --webpack" : "next dev",
    };
  }

  // ═══════════════════════════════════
  // 5. DEMO
  // ═══════════════════════════════════
  function demo() {
    console.log("═══ TurbopackAPI Engine ═══");

    console.log("\n── 1. Check Features ──");
    console.log(checkFeature("typescript"));
    console.log(checkFeature(".module.css"));
    console.log(checkFeature("sassOptions.functions"));
    console.log(checkFeature("webpack()-config"));

    console.log("\n── 2. Build Config ──");
    console.log(
      buildConfig({
        aliases: { underscore: "lodash" },
        extensions: [".mdx", ".tsx", ".ts", ".jsx", ".js"],
      }),
    );

    console.log("\n── 3. Select Bundler ──");
    console.log(selectBundler(["typescript", ".css", "postcss"]));
    console.log(selectBundler(["typescript", "sassOptions.functions"]));
  }

  return { demo: demo };
})();
// Chạy: TurbopackAPIEngine.demo();
```

---

## §5. Câu Hỏi Phỏng Vấn!

```
  CÂU HỎI:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  ❓ 1: 4 lợi ích chính của Turbopack?                          │
  │  → Unified Graph (1 graph cho all envs)! ★★★              │
  │  → Bundling in dev (vs native ESM)! ★★★                  │
  │  → Incremental computation (cache per function)! ★★★     │
  │  → Lazy bundling (chỉ bundle what's requested)! ★★★     │
  │                                                              │
  │  ❓ 2: Turbopack vs Webpack?                                   │
  │  → Turbopack: Rust, incremental, faster! ★★★             │
  │  → Webpack: mature, plugins, full features! ★             │
  │  → Turbopack không support webpack() config! ★★★         │
  │  → Dùng turbopack key thay thế! ★                        │
  │                                                              │
  │  ❓ 3: Khi nào phải dùng webpack?                              │
  │  → sassOptions.functions! ★★★                             │
  │  → Legacy CSS Modules (:local, @value)! ★                 │
  │  → Webpack plugins! ★                                     │
  │  → Command: next dev --webpack! ★★★                      │
  │                                                              │
  │  ❓ 4: Config Turbopack thế nào?                               │
  │  → turbopack key in next.config.js! ★★★                  │
  │  → rules (loaders), resolveAlias, resolveExtensions! ★   │
  │  → Trace: NEXT_TURBOPACK_TRACING=1 next dev! ★           │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```
