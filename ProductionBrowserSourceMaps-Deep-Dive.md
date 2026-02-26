# productionBrowserSourceMaps — Deep Dive!

> **Nguồn**: https://nextjs.org/docs/app/api-reference/config/next-config-js/productionBrowserSourceMaps
> **Ngôn ngữ**: Tiếng Việt — giải thích cực kỳ chi tiết!
> **Trang này KHÔNG có hình/diagram** — chỉ có text + code blocks!

---

## §1. productionBrowserSourceMaps Là Gì?

```
  productionBrowserSourceMaps — TỔNG QUAN:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  WHAT:                                                        │
  │  → Enable source maps trong production build! ★★★         │
  │  → Dev: source maps BẬT by default! ★                     │
  │  → Production: TẮT by default (bảo mật)! ★★★             │
  │                                                              │
  │  TẠI SAO TẮT PRODUCTION:                                      │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │  Source maps = file map minified → original code      │    │
  │  │  → Leak source code cho client! ★★★                  │    │
  │  │  → Ai cũng xem được logic app! ★★★                  │    │
  │  │  → Bảo mật: TẮT is good! ★                          │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  CONFIG:                                                      │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │  module.exports = {                                   │    │
  │  │    productionBrowserSourceMaps: true  ★★★              │    │
  │  │  }                                                     │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  BEHAVIOR KHI BẬT:                                            │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │                                                       │    │
  │  │  next build                                            │    │
  │  │       ↓                                                │    │
  │  │  Generate .js files                                    │    │
  │  │       ↓                                                │    │
  │  │  Generate .js.map files (SAME directory!) ★★★         │    │
  │  │       ↓                                                │    │
  │  │  Auto serve khi browser request! ★                    │    │
  │  │                                                       │    │
  │  │  .next/static/chunks/                                  │    │
  │  │  ├── main.js                                           │    │
  │  │  ├── main.js.map ★★★ (source map!)                    │    │
  │  │  ├── page.js                                           │    │
  │  │  └── page.js.map ★★★                                  │    │
  │  │                                                       │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  TRADE-OFFS:                                                  │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │  ⚠️ Build time TĂNG! ★★★                               │    │
  │  │  ⚠️ Memory usage TĂNG! ★★★                             │    │
  │  │  ⚠️ Source code EXPOSED cho client! ★★★                │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```

---

## §2. Tự Viết — SourceMapsEngine!

```javascript
var SourceMapsEngine = (function () {
  // ═══════════════════════════════════
  // 1. SOURCE MAP GENERATOR (simplified)
  // ═══════════════════════════════════
  function generateSourceMap(originalFile, minifiedCode) {
    // Simulate mapping minified → original positions
    var mappings = [];
    var lines = originalFile.split("\n");
    for (var i = 0; i < lines.length; i++) {
      mappings.push({
        originalLine: i + 1,
        originalColumn: 0,
        generatedLine: 1, // minified = 1 line
        generatedColumn: i * 10, // approximate
      });
    }

    return {
      version: 3,
      file: "bundle.min.js",
      sources: ["original.js"],
      mappings: mappings.length + " mappings",
      note: "Maps minified code → original source ★★★",
    };
  }

  // ═══════════════════════════════════
  // 2. BUILD SIMULATOR
  // ═══════════════════════════════════
  function build(files, config) {
    var output = [];
    var totalSize = 0;

    for (var i = 0; i < files.length; i++) {
      var file = files[i];
      var minified = { name: file.name + ".js", size: file.size };
      output.push(minified);
      totalSize += file.size;

      if (config.productionBrowserSourceMaps) {
        var mapSize = Math.round(file.size * 2.5); // maps are ~2.5x
        output.push({
          name: file.name + ".js.map",
          size: mapSize,
          note: "Source map generated ★★★",
        });
        totalSize += mapSize;
      }
    }

    return {
      files: output,
      totalSize: totalSize,
      sourceMaps: config.productionBrowserSourceMaps,
      note: config.productionBrowserSourceMaps
        ? "⚠️ Source maps enabled! Code exposed! ★★★"
        : "✅ Source maps disabled! Code protected! ★",
    };
  }

  // ═══════════════════════════════════
  // 3. DEMO
  // ═══════════════════════════════════
  function demo() {
    console.log("═══ SourceMaps Engine ═══");

    var files = [
      { name: "main", size: 150000 },
      { name: "page", size: 50000 },
      { name: "vendor", size: 300000 },
    ];

    console.log("\n── 1. Without source maps (default) ──");
    console.log(build(files, { productionBrowserSourceMaps: false }));

    console.log("\n── 2. With source maps ──");
    console.log(build(files, { productionBrowserSourceMaps: true }));

    console.log("\n── 3. Source Map structure ──");
    console.log(generateSourceMap("function hello() {\n  return 'world';\n}"));
  }

  return { demo: demo };
})();
// Chạy: SourceMapsEngine.demo();
```

---

## §3. Câu Hỏi Phỏng Vấn!

```
  CÂU HỎI:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  ❓ 1: Tại sao production tắt source maps?                    │
  │  → Bảo mật: không leak source code! ★★★                  │
  │  → Giảm build time + memory! ★                            │
  │                                                              │
  │  ❓ 2: Khi nào nên bật?                                       │
  │  → Debug production errors! ★★★                           │
  │  → Error tracking (Sentry, Datadog)! ★★★                 │
  │  → Open-source projects! ★                                │
  │                                                              │
  │  ❓ 3: Trade-offs?                                             │
  │  → Build time tăng! ★                                     │
  │  → Memory tăng! ★                                         │
  │  → Source code exposed! ★★★                               │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```
