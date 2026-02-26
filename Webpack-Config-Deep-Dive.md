# Custom Webpack Config — Deep Dive!

> **Nguồn**: https://nextjs.org/docs/app/api-reference/config/next-config-js/webpack
> **Ngôn ngữ**: Tiếng Việt — giải thích cực kỳ chi tiết!
> **Trang này KHÔNG có hình/diagram** — chỉ có text + code blocks!

---

## §1. webpack Config Là Gì?

```
  WEBPACK CONFIG — TỔNG QUAN:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  WHAT:                                                        │
  │  → Extend webpack config trong next.config.js! ★★★        │
  │  → Function nhận config + options, return config! ★        │
  │                                                              │
  │  ⚠️ CẢNH BÁO:                                                 │
  │  → KHÔNG covered by semver! ★★★                            │
  │  → Proceed at your own risk! ★★★                          │
  │  → Kiểm tra Next.js đã support chưa trước! ★              │
  │                                                              │
  │  BUILT-IN (KHÔNG cần custom):                                 │
  │  → CSS imports / CSS Modules ★                             │
  │  → Sass/SCSS imports / modules ★                           │
  │  → @next/mdx (MDX support) ★                              │
  │  → @next/bundle-analyzer ★                                 │
  │                                                              │
  │  FUNCTION SIGNATURE:                                          │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │  module.exports = {                                   │    │
  │  │    webpack: (config, {                                 │    │
  │  │      buildId,        // unique build identifier ★     │    │
  │  │      dev,            // true if development ★         │    │
  │  │      isServer,       // true for server compile ★★★  │    │
  │  │      defaultLoaders, // { babel } ★                   │    │
  │  │      nextRuntime,    // 'edge' | 'nodejs' | undef ★  │    │
  │  │      webpack         // webpack instance ★            │    │
  │  │    }) => {                                              │    │
  │  │      // modify config...                               │    │
  │  │      return config   // MUST return! ★★★              │    │
  │  │    }                                                   │    │
  │  │  }                                                     │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  EXECUTIONS (3 lần!):                                         │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │                                                       │    │
  │  │  ① Server (nodejs):  isServer=true ★                  │    │
  │  │     nextRuntime='nodejs'                               │    │
  │  │                                                       │    │
  │  │  ② Server (edge):    isServer=true ★                  │    │
  │  │     nextRuntime='edge'                                 │    │
  │  │                                                       │    │
  │  │  ③ Client:           isServer=false ★                 │    │
  │  │     nextRuntime=undefined                              │    │
  │  │                                                       │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```

---

## §2. Options + Usage Patterns!

```
  OPTIONS & PATTERNS:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  defaultLoaders.babel:                                        │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │  // Add loader (e.g. MDX):                             │    │
  │  │  webpack: (config, options) => {                       │    │
  │  │    config.module.rules.push({                          │    │
  │  │      test: /\.mdx/,                                    │    │
  │  │      use: [                                            │    │
  │  │        options.defaultLoaders.babel, ★★★              │    │
  │  │        { loader: '@mdx-js/loader' }                   │    │
  │  │      ]                                                 │    │
  │  │    })                                                   │    │
  │  │    return config ★★★                                  │    │
  │  │  }                                                     │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  COMMON PATTERNS:                                             │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │                                                       │    │
  │  │  // Client-only plugin:                                │    │
  │  │  if (!isServer) {                                      │    │
  │  │    config.plugins.push(new MyPlugin()) ★★★            │    │
  │  │  }                                                     │    │
  │  │                                                       │    │
  │  │  // Dev-only:                                          │    │
  │  │  if (dev) {                                            │    │
  │  │    config.devtool = 'eval-source-map' ★               │    │
  │  │  }                                                     │    │
  │  │                                                       │    │
  │  │  // Add alias:                                         │    │
  │  │  config.resolve.alias['@'] = path.resolve('src') ★   │    │
  │  │                                                       │    │
  │  │  // Edge runtime:                                      │    │
  │  │  if (nextRuntime === 'edge') {                         │    │
  │  │    // edge-specific config ★                          │    │
  │  │  }                                                     │    │
  │  │                                                       │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```

---

## §3. Tự Viết — WebpackConfigEngine!

```javascript
var WebpackConfigEngine = (function () {
  // ═══════════════════════════════════
  // 1. CONFIG BUILDER (simulate Next.js webpack function)
  // ═══════════════════════════════════
  function createBaseConfig(env) {
    return {
      mode: env.dev ? "development" : "production",
      target: env.isServer ? "node" : "web",
      module: { rules: [] },
      plugins: [],
      resolve: { alias: {}, extensions: [".js", ".jsx", ".ts", ".tsx"] },
    };
  }

  // ═══════════════════════════════════
  // 2. WEBPACK FUNCTION EXECUTOR
  // ═══════════════════════════════════
  function executeWebpackFn(webpackFn) {
    var environments = [
      {
        name: "server-nodejs",
        isServer: true,
        nextRuntime: "nodejs",
        dev: false,
      },
      { name: "server-edge", isServer: true, nextRuntime: "edge", dev: false },
      { name: "client", isServer: false, nextRuntime: undefined, dev: false },
    ];

    var results = {};
    for (var i = 0; i < environments.length; i++) {
      var env = environments[i];
      var config = createBaseConfig(env);
      var options = {
        buildId: "build-" + Date.now(),
        dev: env.dev,
        isServer: env.isServer,
        nextRuntime: env.nextRuntime,
        defaultLoaders: { babel: { loader: "next-babel-loader" } },
      };
      results[env.name] = webpackFn(config, options);
    }
    return results;
  }

  // ═══════════════════════════════════
  // 3. RULE ADDER
  // ═══════════════════════════════════
  function addRule(config, test, loaders) {
    config.module.rules.push({ test: test, use: loaders });
    return config;
  }

  function addAlias(config, name, path) {
    config.resolve.alias[name] = path;
    return config;
  }

  // ═══════════════════════════════════
  // 4. DEMO
  // ═══════════════════════════════════
  function demo() {
    console.log("═══ WebpackConfig Engine ═══");

    console.log("\n── 1. Execute 3 times ──");
    var results = executeWebpackFn(function (config, options) {
      // Add MDX loader
      addRule(config, /\.mdx$/, [
        options.defaultLoaders.babel,
        { loader: "@mdx-js/loader" },
      ]);

      // Client-only plugin
      if (!options.isServer) {
        config.plugins.push({ name: "BundleAnalyzer" });
      }

      // Alias
      addAlias(config, "@", "./src");

      return config;
    });

    for (var env in results) {
      console.log("\n" + env + ":");
      console.log("  rules:", results[env].module.rules.length);
      console.log("  plugins:", results[env].plugins.length);
      console.log("  alias:", results[env].resolve.alias);
    }
  }

  return { demo: demo };
})();
// Chạy: WebpackConfigEngine.demo();
```

---

## §4. Câu Hỏi Phỏng Vấn!

```
  CÂU HỎI:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  ❓ 1: webpack function chạy mấy lần?                         │
  │  → 3 lần! ★★★                                             │
  │  → Server nodejs, Server edge, Client! ★                  │
  │  → Dùng isServer + nextRuntime phân biệt! ★★★            │
  │                                                              │
  │  ❓ 2: Options có những gì?                                    │
  │  → buildId: unique build identifier! ★                     │
  │  → dev: development mode? ★                               │
  │  → isServer: server compile? ★★★                          │
  │  → nextRuntime: 'edge' | 'nodejs' | undefined! ★         │
  │  → defaultLoaders: { babel } ★★★                          │
  │                                                              │
  │  ❓ 3: Tại sao cần trả về config?                              │
  │  → MUST return modified config! ★★★                       │
  │  → Nếu không return → Next.js dùng config rỗng! ★       │
  │                                                              │
  │  ❓ 4: Khi nào KHÔNG nên custom webpack?                       │
  │  → CSS/Sass/SCSS: built-in! ★                             │
  │  → MDX: @next/mdx plugin! ★                               │
  │  → Bundle analysis: @next/bundle-analyzer! ★              │
  │  → Không covered by semver → breaking changes! ★★★       │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```
