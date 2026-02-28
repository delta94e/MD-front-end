# Next.js Compiler — Deep Dive!

> **Nguồn**: https://nextjs.org/docs/architecture/nextjs-compiler
> **Ngôn ngữ**: Tiếng Việt — giải thích cực kỳ chi tiết!
> **Trang này KHÔNG có hình/diagram** — chỉ có text + code blocks!

---

## §1. Next.js Compiler Là Gì?

```
  Next.js Compiler — TỔNG QUAN:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  WHAT:                                                        │
  │  → Viết bằng Rust, dùng SWC! ★★★                         │
  │  → Transform + Minify JavaScript/TypeScript! ★★★          │
  │  → Thay thế Babel (transform) + Terser (minify)! ★★★    │
  │  → 17x nhanh hơn Babel! ★★★                              │
  │  → Default ON từ Next.js 12! ★                             │
  │                                                              │
  │  FALLBACK:                                                    │
  │  → Có .babelrc? → Auto dùng Babel thay SWC! ★★★          │
  │  → Unsupported features? → Babel fallback! ★              │
  │                                                              │
  │  WHY SWC:                                                     │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │  → Extensibility: dùng như Rust Crate! ★              │    │
  │  │  → Performance: 3x Fast Refresh, 5x builds! ★★★      │    │
  │  │  → WebAssembly: chạy everywhere! ★                    │    │
  │  │  → Community: Rust ecosystem mạnh! ★                  │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  COMPILER PIPELINE:                                           │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │  Source Code (.ts/.tsx/.js/.jsx)                        │    │
  │  │       ↓                                                │    │
  │  │  SWC Transform (thay Babel) ★★★                       │    │
  │  │  (JSX → JS, TS → JS, decorators, etc.)                │    │
  │  │       ↓                                                │    │
  │  │  SWC Minify (thay Terser, 7x faster) ★★★             │    │
  │  │       ↓                                                │    │
  │  │  Production Bundle! ✅                                  │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```

---

## §2. Supported Features — compiler key!

```
  SUPPORTED FEATURES:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  CSS-IN-JS:                                                   │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │  Styled Components:                                   │    │
  │  │  compiler: { styledComponents: true } ★★★             │    │
  │  │  Options: displayName, ssr, fileName, minify, etc.    │    │
  │  │                                                       │    │
  │  │  Emotion:                                              │    │
  │  │  compiler: { emotion: true } ★★★                      │    │
  │  │  Options: sourceMap, autoLabel, labelFormat, etc.      │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  TESTING:                                                     │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │  Jest Integration:                                     │    │
  │  │  → Auto mock .css, images ★                           │    │
  │  │  → SWC transform ★★★                                  │    │
  │  │  → .env → process.env ★                              │    │
  │  │  → Ignore node_modules, .next ★                       │    │
  │  │                                                       │    │
  │  │  const nextJest = require('next/jest')                 │    │
  │  │  const createJestConfig = nextJest({ dir: './' })     │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  CODE TRANSFORMS:                                             │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │  removeConsole: true ★★★ (xóa console.*)             │    │
  │  │    → exclude: ['error'] (giữ console.error) ★        │    │
  │  │                                                       │    │
  │  │  reactRemoveProperties: true ★ (xóa data-test*)      │    │
  │  │    → properties: ['^data-custom$'] ★                 │    │
  │  │                                                       │    │
  │  │  Relay support ★                                      │    │
  │  │  Legacy Decorators (experimentalDecorators) ★        │    │
  │  │  importSource (jsxImportSource: 'theme-ui') ★        │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  BUILD:                                                       │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │  transpilePackages: ['@acme/ui'] ★★★                  │    │
  │  │  optimizePackageImports (thay modularizeImports) ★   │    │
  │  │  Minification: SWC (7x faster Terser) ★★★            │    │
  │  │  define: { MY_VAR: 'value' } (build-time) ★          │    │
  │  │  defineServer: { ... } (server-only) ★                │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  LIFECYCLE HOOKS:                                             │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │  runAfterProductionCompile: async ({ distDir,         │    │
  │  │    projectDir }) => { ... } ★★★                       │    │
  │  │  → Chạy SAU compile, TRƯỚC type check! ★             │    │
  │  │  → Collect sourcemaps, build outputs! ★              │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```

---

## §3. Experimental + Unsupported!

```
  EXPERIMENTAL + UNSUPPORTED:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  EXPERIMENTAL:                                                │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │  SWC Trace Profiling:                                  │    │
  │  │  experimental: { swcTraceProfiling: true } ★          │    │
  │  │  → .next/swc-trace-profile-{timestamp}.json ★        │    │
  │  │  → Xem bằng chrome://tracing hoặc speedscope! ★     │    │
  │  │                                                       │    │
  │  │  SWC Plugins:                                          │    │
  │  │  experimental: {                                       │    │
  │  │    swcPlugins: [['plugin', { ...options }]] ★★★       │    │
  │  │  }                                                     │    │
  │  │  → WASM plugins! ★                                    │    │
  │  │  → npm package or absolute path .wasm ★              │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  UNSUPPORTED:                                                 │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │  → Có .babelrc → auto fallback Babel! ★★★            │    │
  │  │  → Custom Babel plugins chưa port! ★                 │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```

---

## §4. Tự Viết — NextCompilerEngine!

```javascript
var NextCompilerEngine = (function () {
  // ═══════════════════════════════════
  // 1. COMPILER CONFIG RESOLVER
  // ═══════════════════════════════════
  var COMPILER_FEATURES = {
    styledComponents: { babel: "babel-plugin-styled-components" },
    emotion: { babel: "@emotion/babel-plugin" },
    removeConsole: { babel: "babel-plugin-transform-remove-console" },
    reactRemoveProperties: { babel: "babel-plugin-react-remove-properties" },
    relay: { babel: "babel-plugin-relay" },
  };

  function resolveCompiler(projectConfig) {
    // .babelrc present → Babel fallback
    if (projectConfig.hasBabelrc) {
      return {
        compiler: "babel",
        note: "⚠️ .babelrc found → Babel fallback! ★★★",
      };
    }
    return {
      compiler: "swc",
      speed: "17x faster than Babel ★★★",
      minifier: "7x faster than Terser ★★★",
    };
  }

  // ═══════════════════════════════════
  // 2. TRANSFORM SIMULATOR
  // ═══════════════════════════════════
  function transform(code, options) {
    var transforms = [];

    if (options.removeConsole) {
      var exclude = options.removeConsole.exclude || [];
      transforms.push({
        type: "removeConsole",
        exclude: exclude,
        note: "Remove console.* (except " + exclude.join(", ") + ") ★★★",
      });
    }

    if (options.reactRemoveProperties) {
      transforms.push({
        type: "reactRemoveProperties",
        note: "Remove data-test* props ★",
      });
    }

    if (options.define) {
      transforms.push({
        type: "define",
        replacements: Object.keys(options.define).length,
        note: "Replace " + Object.keys(options.define).length + " variables ★",
      });
    }

    return {
      source: code.length + " chars",
      transforms: transforms,
      minified: Math.round(code.length * 0.4) + " chars (minified) ★★★",
    };
  }

  // ═══════════════════════════════════
  // 3. DEMO
  // ═══════════════════════════════════
  function demo() {
    console.log("═══ NextCompiler Engine ═══");

    console.log("\n── 1. Resolve Compiler ──");
    console.log(resolveCompiler({ hasBabelrc: false }));
    console.log(resolveCompiler({ hasBabelrc: true }));

    console.log("\n── 2. Transform ──");
    console.log(
      transform(
        "function App() { console.log('hi'); return <div data-test='x'>Hello</div> }",
        {
          removeConsole: { exclude: ["error"] },
          reactRemoveProperties: true,
          define: { MY_VAR: "'production'" },
        },
      ),
    );
  }

  return { demo: demo };
})();
// Chạy: NextCompilerEngine.demo();
```

---

## §5. Câu Hỏi Phỏng Vấn!

```
  CÂU HỎI:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  ❓ 1: Next.js Compiler thay thế gì?                           │
  │  → Babel (transform): 17x faster! ★★★                    │
  │  → Terser (minify): 7x faster! ★★★                       │
  │  → Viết bằng Rust (SWC)! ★★★                             │
  │                                                              │
  │  ❓ 2: Khi nào fallback Babel?                                 │
  │  → Có .babelrc! ★★★                                      │
  │  → Custom Babel plugins chưa port! ★                      │
  │                                                              │
  │  ❓ 3: compiler key hỗ trợ gì?                                 │
  │  → styledComponents, emotion (CSS-in-JS)! ★★★            │
  │  → removeConsole (xóa console.*)! ★★★                    │
  │  → reactRemoveProperties (xóa data-test)! ★              │
  │  → define/defineServer (build-time vars)! ★               │
  │  → runAfterProductionCompile (lifecycle hook)! ★          │
  │                                                              │
  │  ❓ 4: SWC Plugins?                                            │
  │  → Experimental: WASM plugins! ★★★                       │
  │  → swcPlugins: [['plugin', { options }]]! ★               │
  │  → npm package hoặc .wasm file! ★                         │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```
