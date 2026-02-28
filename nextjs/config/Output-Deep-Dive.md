# output — Deep Dive!

> **Nguồn**: https://nextjs.org/docs/app/api-reference/config/next-config-js/output
> **Ngôn ngữ**: Tiếng Việt — giải thích cực kỳ chi tiết!
> **Trang này KHÔNG có hình/diagram** — chỉ có text + code blocks!

---

## §1. output Là Gì?

```
  output — TỔNG QUAN:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  WHAT:                                                        │
  │  → Output File Tracing cho deployment! ★★★                 │
  │  → Tự động trace files cần thiết cho production! ★         │
  │  → Giảm DRASTICALLY deployment size! ★★★                  │
  │  → output: 'standalone' → self-contained folder! ★★★     │
  │                                                              │
  │  VẤN ĐỀ (trước Next.js 12):                                   │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │  Docker deploy:                                        │    │
  │  │  → COPY toàn bộ node_modules/ ★★★ (hàng trăm MB!)  │    │
  │  │  → Rất nhiều files KHÔNG cần! ★                      │    │
  │  │  → Image Docker cực lớn! ★★★                         │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  GIẢI PHÁP (output: 'standalone'):                             │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │  → Trace chỉ files CẦN THIẾT! ★★★                   │    │
  │  │  → Copy minimal node_modules! ★                      │    │
  │  │  → Tạo .next/standalone/ ★★★                         │    │
  │  │  → Chạy: node .next/standalone/server.js ★           │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  CONFIG:                                                      │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │  module.exports = {                                   │    │
  │  │    output: 'standalone'  ★★★                          │    │
  │  │  }                                                     │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```

---

## §2. How It Works + Standalone!

```
  HOW IT WORKS:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  TRACING (powered by @vercel/nft):                             │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │                                                       │    │
  │  │  next build                                            │    │
  │  │       ↓                                                │    │
  │  │  @vercel/nft statically analyze:                       │    │
  │  │  → import statements ★                                │    │
  │  │  → require() calls ★                                  │    │
  │  │  → fs usage ★                                         │    │
  │  │       ↓                                                │    │
  │  │  Output: .nft.json files ★★★                          │    │
  │  │  (list of files needed per page)                       │    │
  │  │       ↓                                                │    │
  │  │  .next/next-server.js.nft.json ★                      │    │
  │  │                                                       │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  STANDALONE FOLDER:                                           │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │                                                       │    │
  │  │  .next/standalone/                                     │    │
  │  │  ├── server.js       ← minimal server! ★★★           │    │
  │  │  ├── node_modules/   ← chỉ files cần! ★★★           │    │
  │  │  ├── package.json                                     │    │
  │  │  └── .next/          ← build output                   │    │
  │  │                                                       │    │
  │  │  ⚠️ KHÔNG tự copy:                                     │    │
  │  │  → public/ (CDN handle!) ★                            │    │
  │  │  → .next/static/ (CDN handle!) ★                     │    │
  │  │                                                       │    │
  │  │  Manual copy:                                          │    │
  │  │  cp -r public .next/standalone/                        │    │
  │  │  cp -r .next/static .next/standalone/.next/ ★         │    │
  │  │                                                       │    │
  │  │  Run:                                                  │    │
  │  │  node .next/standalone/server.js ★★★                  │    │
  │  │  PORT=8080 HOSTNAME=0.0.0.0 node server.js ★         │    │
  │  │                                                       │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```

---

## §3. Caveats — Monorepo + Include/Exclude!

```
  CAVEATS:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  MONOREPO:                                                    │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │  // Mặc định: trace từ project dir only! ★            │    │
  │  │  // Files ngoài project dir → KHÔNG included! ★★★    │    │
  │  │                                                       │    │
  │  │  // Fix: outputFileTracingRoot                         │    │
  │  │  const path = require('path');                         │    │
  │  │  module.exports = {                                   │    │
  │  │    outputFileTracingRoot: path.join(__dirname, '../../')│   │
  │  │  }                                                     │    │
  │  │  // → Trace từ monorepo root! ★★★                    │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  INCLUDE / EXCLUDE:                                           │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │  module.exports = {                                   │    │
  │  │    // Force include files:                             │    │
  │  │    outputFileTracingIncludes: {                        │    │
  │  │      '/api/another': ['./needed-folder/**/*'],        │    │
  │  │      '/*': ['node_modules/sharp/**/*'],  ★★★         │    │
  │  │    },                                                  │    │
  │  │    // Force exclude files:                             │    │
  │  │    outputFileTracingExcludes: {                        │    │
  │  │      '/api/hello': ['./un-necessary-folder/**/*'], ★ │    │
  │  │    }                                                   │    │
  │  │  }                                                     │    │
  │  │                                                       │    │
  │  │  Key = route glob (/api/hello, /products/[id])        │    │
  │  │  Value = file globs (relative to project root)         │    │
  │  │  '/*' = all routes ★★★                                │    │
  │  │                                                       │    │
  │  │  ⚠️ Chỉ server traces! ★                               │    │
  │  │  → Edge Runtime routes: KHÔNG affected! ★             │    │
  │  │  → Fully static pages: KHÔNG affected! ★              │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```

---

## §4. Tự Viết — OutputTracingEngine!

```javascript
var OutputTracingEngine = (function () {
  // ═══════════════════════════════════
  // 1. FILE TRACER (simulate @vercel/nft)
  // ═══════════════════════════════════
  function traceFile(source) {
    var deps = [];
    // Simulate import analysis
    var importRegex = /(?:import|require)\s*\(?['"]([^'"]+)['"]\)?/g;
    var match;
    while ((match = importRegex.exec(source)) !== null) {
      deps.push(match[1]);
    }
    return { dependencies: deps, count: deps.length };
  }

  // ═══════════════════════════════════
  // 2. STANDALONE BUILDER
  // ═══════════════════════════════════
  function buildStandalone(pages, allNodeModules) {
    var neededModules = {};
    var traced = {};

    for (var i = 0; i < pages.length; i++) {
      var page = pages[i];
      traced[page.route] = traceFile(page.source);
      var deps = traced[page.route].dependencies;
      for (var j = 0; j < deps.length; j++) {
        neededModules[deps[j]] = true;
      }
    }

    var needed = Object.keys(neededModules);
    var excluded = allNodeModules.filter(function (m) {
      return needed.indexOf(m) < 0;
    });

    return {
      traced: traced,
      neededModules: needed,
      excludedModules: excluded,
      sizeBefore: allNodeModules.length + " packages",
      sizeAfter: needed.length + " packages",
      saved: excluded.length + " packages removed! ★★★",
    };
  }

  // ═══════════════════════════════════
  // 3. INCLUDE/EXCLUDE RESOLVER
  // ═══════════════════════════════════
  function resolveTracing(route, includes, excludes) {
    var included = [];
    var excluded = [];

    for (var pattern in includes) {
      if (route === pattern || pattern === "/*") {
        included = included.concat(includes[pattern]);
      }
    }
    for (var pattern2 in excludes) {
      if (route === pattern2 || pattern2 === "/*") {
        excluded = excluded.concat(excludes[pattern2]);
      }
    }

    return {
      route: route,
      forcedIncludes: included,
      forcedExcludes: excluded,
    };
  }

  // ═══════════════════════════════════
  // 4. DEMO
  // ═══════════════════════════════════
  function demo() {
    console.log("═══ OutputTracing Engine ═══");

    console.log("\n── 1. Trace ──");
    var source =
      "import React from 'react';\n" +
      "import { Button } from '@mui/material';\n" +
      "const fs = require('fs');";
    console.log(traceFile(source));

    console.log("\n── 2. Standalone Build ──");
    var pages = [
      {
        route: "/",
        source: "import React from 'react'; import next from 'next'",
      },
      {
        route: "/api/data",
        source: "import pg from 'pg'; import next from 'next'",
      },
    ];
    var allMods = [
      "react",
      "next",
      "pg",
      "lodash",
      "moment",
      "webpack",
      "babel",
    ];
    console.log(buildStandalone(pages, allMods));

    console.log("\n── 3. Include/Exclude ──");
    console.log(
      resolveTracing(
        "/api/data",
        { "/*": ["node_modules/sharp/**/*"] },
        { "/api/data": ["./temp/**/*"] },
      ),
    );
  }

  return { demo: demo };
})();
// Chạy: OutputTracingEngine.demo();
```

---

## §5. Câu Hỏi Phỏng Vấn!

```
  CÂU HỎI:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  ❓ 1: output: 'standalone' dùng làm gì?                      │
  │  → Tạo self-contained folder cho deployment! ★★★          │
  │  → Chỉ copy files CẦN THIẾT! ★                            │
  │  → Minimal server.js thay next start! ★                   │
  │                                                              │
  │  ❓ 2: @vercel/nft làm gì?                                    │
  │  → Static analysis: import, require, fs! ★★★              │
  │  → Output .nft.json (list needed files)! ★                │
  │                                                              │
  │  ❓ 3: Standalone thiếu gì?                                   │
  │  → public/ và .next/static/ ★★★                           │
  │  → CDN nên handle! ★                                      │
  │  → Manual copy nếu cần: cp -r public .next/standalone/ ★ │
  │                                                              │
  │  ❓ 4: Monorepo tracing?                                       │
  │  → Mặc định: chỉ trace project dir! ★                    │
  │  → outputFileTracingRoot: monorepo root! ★★★             │
  │                                                              │
  │  ❓ 5: Include/Exclude?                                        │
  │  → outputFileTracingIncludes: force include files! ★      │
  │  → outputFileTracingExcludes: force exclude! ★            │
  │  → Key = route glob, Value = file globs! ★★★             │
  │  → '/*' = all routes! ★                                   │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```
