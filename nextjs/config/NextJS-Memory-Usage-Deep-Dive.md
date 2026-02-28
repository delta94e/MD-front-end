# Next.js Memory Usage — Deep Dive!

> **Chủ đề**: Tối Ưu Memory — Dev + Production Build!
> **Ngôn ngữ**: Tiếng Việt — giải thích cực kỳ chi tiết!
> **Phương châm**: Tự viết lại bằng tay — KHÔNG dùng thư viện!
> **Nguồn**: https://nextjs.org/docs/app/guides/memory-usage
> **Lưu ý**: Trang gốc KHÔNG có sơ đồ — tất cả diagrams là TỰ VẼ!

---

## Mục Lục

1. [§1. Tổng Quan — Tại Sao Memory Quan Trọng](#1)
2. [§2. Reduce Dependencies + webpackMemoryOptimizations](#2)
3. [§3. Debug Memory Usage + Heap Profile + Heap Snapshot](#3)
4. [§4. Webpack Build Worker + Disable Cache](#4)
5. [§5. Disable Static Analysis + Source Maps](#5)
6. [§6. Edge Memory + Preloading Entries](#6)
7. [§7. Tự Viết — MemoryOptimizerEngine](#7)
8. [§8. Câu Hỏi Luyện Tập](#8)

---

## §1. Tổng Quan — Tại Sao Memory Quan Trọng!

```
  MEMORY PROBLEM:
  ┌────────────────────────────────────────────────────────────┐
  │                                                            │
  │  App nhỏ (10 pages):                                      │
  │  ┌─────────────────────────────────┐                       │
  │  │ Node.js heap: ~200MB            │ ✅ OK!               │
  │  └─────────────────────────────────┘                       │
  │                                                            │
  │  App lớn (500+ pages, nhiều deps):                        │
  │  ┌─────────────────────────────────────────────────────┐   │
  │  │ Node.js heap: ~2GB+ → CRASH!   │ ❌ OOM!           │   │
  │  │ "FATAL ERROR: Reached heap limit"                   │   │
  │  │ "JavaScript heap out of memory"                     │   │
  │  └─────────────────────────────────────────────────────┘   │
  │                                                            │
  │  NGUYÊN NHÂN:                                              │
  │  ┌──────────────────────────────────────────────────────┐  │
  │  │ ① Quá nhiều dependencies → parse hàng ngàn modules │  │
  │  │ ② Webpack cache giữ compiled modules trong memory  │  │
  │  │ ③ TypeScript type checking cần nhiều RAM           │  │
  │  │ ④ Source maps generation tốn memory               │  │
  │  │ ⑤ Preload tất cả page modules khi server start    │  │
  │  │ ⑥ Barrel files → import chain dài → memory lớn   │  │
  │  └──────────────────────────────────────────────────────┘  │
  │                                                            │
  └────────────────────────────────────────────────────────────┘
```

```
  10 CHIẾN LƯỢC TỐI ƯU:
  ┌──────────────────────────────────────────────────────────┐
  │                                                          │
  │  ①  Reduce dependencies (Bundle Analyzer)                │
  │  ②  webpackMemoryOptimizations (v15+)                    │
  │  ③  --experimental-debug-memory-usage (v14.2+)           │
  │  ④  Record heap profile (--heap-prof)                    │
  │  ⑤  Analyze heap snapshot (NODE_OPTIONS=--inspect)       │
  │  ⑥  Webpack build worker (separate process)             │
  │  ⑦  Disable Webpack cache                                │
  │  ⑧  Disable static analysis (TypeScript)                │
  │  ⑨  Disable source maps                                 │
  │  ⑩  Preloading entries (false)                           │
  │                                                          │
  └──────────────────────────────────────────────────────────┘
```

---

## §2. Reduce Dependencies + webpackMemoryOptimizations!

```
  TIP 1: REDUCE DEPENDENCIES
  ┌──────────────────────────────────────────────────────────┐
  │                                                          │
  │  Nhiều dependencies = nhiều modules = nhiều memory!     │
  │                                                          │
  │  Dùng Bundle Analyzer:                                   │
  │  → Xem size từng dependency!                           │
  │  → Tìm deps KHÔNG CẦN THIẾT → remove!                │
  │  → Tìm deps QUÁ LỚN → thay bằng lighter alternative! │
  │                                                          │
  │  Ví dụ:                                                  │
  │  ┌───────────────┬──────────┬──────────────────────┐     │
  │  │ Package       │ Size     │ Thay thế             │     │
  │  ├───────────────┼──────────┼──────────────────────┤     │
  │  │ moment.js     │ 300KB+   │ date-fns (tree-shake)│     │
  │  │ lodash        │ 70KB     │ lodash-es hoặc native│     │
  │  │ axios         │ 40KB     │ fetch (built-in)     │     │
  │  └───────────────┴──────────┴──────────────────────┘     │
  │                                                          │
  └──────────────────────────────────────────────────────────┘
```

```
  TIP 2: webpackMemoryOptimizations (v15+)
  ┌──────────────────────────────────────────────────────────┐
  │                                                          │
  │  // next.config.js                                       │
  │  module.exports = {                                      │
  │    experimental: {                                       │
  │      webpackMemoryOptimizations: true                    │
  │    }                                                     │
  │  }                                                       │
  │                                                          │
  │  → Thay đổi behavior Webpack để giảm MAX memory!      │
  │  → Trade-off: compilation hơi CHẬM hơn!               │
  │  → Low-risk experimental feature!                       │
  │  → Có từ Next.js v15.0.0                               │
  │                                                          │
  │  TRƯỚC:                                                   │
  │  ┌──────────────────────────────────────────┐            │
  │  │ Memory ████████████████████ 2.1GB PEAK   │            │
  │  └──────────────────────────────────────────┘            │
  │  SAU:                                                     │
  │  ┌──────────────────────────────────────────┐            │
  │  │ Memory ████████████ 1.4GB PEAK (~33% ↓) │            │
  │  └──────────────────────────────────────────┘            │
  │                                                          │
  └──────────────────────────────────────────────────────────┘
```

---

## §3. Debug Memory Usage + Heap Profile + Heap Snapshot!

```
  TIP 3: --experimental-debug-memory-usage (v14.2+)
  ┌────────────────────────────────────────────────────────────┐
  │                                                            │
  │  next build --experimental-debug-memory-usage              │
  │                                                            │
  │  Tính năng:                                                │
  │  ┌──────────────────────────────────────────────────────┐  │
  │  │ ① In memory usage LIÊN TỤC trong suốt build!      │  │
  │  │ ② Heap usage + GC statistics!                       │  │
  │  │ ③ TỰ ĐỘNG chụp heap snapshot khi gần limit!       │  │
  │  │ ④ Gửi SIGUSR2 → chụp snapshot BẤT KỲ LÚC NÀO!  │  │
  │  └──────────────────────────────────────────────────────┘  │
  │                                                            │
  │  OUTPUT ví dụ:                                             │
  │  [build] Heap: 512MB used / 4096MB limit                  │
  │  [build] Heap: 814MB used / 4096MB limit                  │
  │  [build] GC: collected 120MB                              │
  │  [build] ⚠️ Heap: 3800MB → auto snapshot!               │
  │                                                            │
  │  ⚠️ KHÔNG tương thích với Webpack build worker!          │
  │  Snapshot lưu ở project root!                             │
  │                                                            │
  └────────────────────────────────────────────────────────────┘
```

```
  TIP 4: HEAP PROFILE (--heap-prof)
  ┌──────────────────────────────────────────────────────────┐
  │                                                          │
  │  node --heap-prof node_modules/next/dist/bin/next build  │
  │                                                          │
  │  WORKFLOW:                                                │
  │  ┌────────────────────────────────────────────────────┐  │
  │  │ 1. Chạy command trên                              │  │
  │  │ 2. Build hoàn thành                               │  │
  │  │ 3. File .heapprofile được tạo!                   │  │
  │  │ 4. Mở Chrome DevTools → Memory tab               │  │
  │  │ 5. Click "Load Profile" → chọn file             │  │
  │  │ 6. Visualize → tìm memory leaks!               │  │
  │  └────────────────────────────────────────────────────┘  │
  │                                                          │
  │  → Thấy CHÍNH XÁC functions/objects nào giữ memory!  │
  │  → Tìm sources of memory leaks!                       │
  │                                                          │
  └──────────────────────────────────────────────────────────┘
```

```
  TIP 5: HEAP SNAPSHOT (NODE_OPTIONS=--inspect)
  ┌──────────────────────────────────────────────────────────┐
  │                                                          │
  │  NODE_OPTIONS=--inspect next build                       │
  │  NODE_OPTIONS=--inspect next dev                         │
  │  NODE_OPTIONS=--inspect-brk next build ← break đầu!  │
  │                                                          │
  │  HOẶC dùng --experimental-debug-memory-usage:            │
  │  next build --experimental-debug-memory-usage            │
  │  → Gửi SIGUSR2 bất kỳ lúc nào:                       │
  │    kill -SIGUSR2 <PID>                                  │
  │  → Heap snapshot tự động saved!                        │
  │                                                          │
  │  WORKFLOW:                                                │
  │  ┌────────────────────────────────────────────────────┐  │
  │  │ Terminal          Chrome DevTools                  │  │
  │  │ ────────          ───────────────                  │  │
  │  │ --inspect         → chrome://inspect              │  │
  │  │ Process running   → Connect debugging port        │  │
  │  │                   → Memory tab                     │  │
  │  │                   → Take snapshot                  │  │
  │  │                   → Analyze retained objects!      │  │
  │  └────────────────────────────────────────────────────┘  │
  │                                                          │
  └──────────────────────────────────────────────────────────┘
```

---

## §4. Webpack Build Worker + Disable Cache!

```
  TIP 6: WEBPACK BUILD WORKER
  ┌────────────────────────────────────────────────────────────┐
  │                                                            │
  │  VẤN ĐỀ: Webpack compile trong MAIN process              │
  │  → Main process giữ TẤT CẢ compiled modules!            │
  │  → Memory usage CỰC CAO!                                 │
  │                                                            │
  │  GIẢI PHÁP: Chạy Webpack trong SEPARATE Node.js worker!  │
  │                                                            │
  │  TRƯỚC:                                                    │
  │  ┌──────────────────────────────────┐                      │
  │  │ Main Process                     │                      │
  │  │ ┌──────────────────────────────┐ │                      │
  │  │ │ Next.js + Webpack + Modules  │ │                      │
  │  │ │ = TẤT CẢ trong 1 process!  │ │                      │
  │  │ │ Memory: 2GB+ 😱             │ │                      │
  │  │ └──────────────────────────────┘ │                      │
  │  └──────────────────────────────────┘                      │
  │                                                            │
  │  SAU (v14.1+ mặc định):                                   │
  │  ┌────────────────┐  ┌─────────────────┐                   │
  │  │ Main Process   │  │ Worker Process  │                   │
  │  │ Next.js core   │  │ Webpack compile │                   │
  │  │ Memory: 800MB  │  │ Memory: 1.2GB   │                   │
  │  └────────────────┘  └─────────────────┘                   │
  │  → Worker crashed? Main process vẫn OK!                  │
  │  → Memory tách biệt!                                     │
  │                                                            │
  │  Enable thủ công (nếu custom webpack config):             │
  │  experimental: { webpackBuildWorker: true }                │
  │                                                            │
  │  ⚠️ Có thể KHÔNG tương thích với một số                  │
  │     custom Webpack plugins!                                │
  │                                                            │
  └────────────────────────────────────────────────────────────┘
```

```
  TIP 7: DISABLE WEBPACK CACHE
  ┌──────────────────────────────────────────────────────────┐
  │                                                          │
  │  Webpack cache = giữ compiled modules trong memory!     │
  │  → Nhanh hơn (rebuild fast!) nhưng TỐN MEMORY!        │
  │                                                          │
  │  Disable cho production build:                           │
  │  ┌────────────────────────────────────────────────────┐  │
  │  │  webpack: (config, { dev }) => {                   │  │
  │  │    if (config.cache && !dev) {                     │  │
  │  │      config.cache = Object.freeze({                │  │
  │  │        type: 'memory'                              │  │
  │  │      })                                            │  │
  │  │    }                                               │  │
  │  │    return config                                   │  │
  │  │  }                                                 │  │
  │  └────────────────────────────────────────────────────┘  │
  │                                                          │
  │  Object.freeze → cache KHÔNG THỂ grow!                 │
  │  !dev → chỉ áp dụng production build!                  │
  │  → Dev vẫn cache bình thường (fast HMR!)              │
  │                                                          │
  └──────────────────────────────────────────────────────────┘
```

---

## §5. Disable Static Analysis + Source Maps!

```
  TIP 8: DISABLE TYPESCRIPT CHECK
  ┌──────────────────────────────────────────────────────────┐
  │                                                          │
  │  Build step "Running TypeScript" tốn RẤT NHIỀU memory! │
  │  → Especially large projects (hundreds of files!)      │
  │                                                          │
  │  // next.config.js                                       │
  │  module.exports = {                                      │
  │    typescript: {                                         │
  │      ignoreBuildErrors: true  ← NGUY HIỂM!            │
  │    }                                                     │
  │  }                                                       │
  │                                                          │
  │  ⚠️ CẢNH BÁO:                                           │
  │  → Type errors sẽ KHÔNG bị bắt trong build!          │
  │  → Có thể deploy code LỖI!                            │
  │                                                          │
  │  BEST PRACTICE:                                          │
  │  ┌────────────────────────────────────────────────────┐  │
  │  │ CI Pipeline:                                       │  │
  │  │ ① tsc --noEmit (type check RIÊNG!)               │  │
  │  │ ② next build  (với ignoreBuildErrors: true)       │  │
  │  │ ③ Deploy chỉ khi CẢ HAI pass!                   │  │
  │  │                                                    │  │
  │  │ → Type check trong separate step = LESS memory!  │  │
  │  │ → Build step chỉ lo compile = LESS memory!      │  │
  │  └────────────────────────────────────────────────────┘  │
  │                                                          │
  └──────────────────────────────────────────────────────────┘
```

```
  TIP 9: DISABLE SOURCE MAPS
  ┌──────────────────────────────────────────────────────────┐
  │                                                          │
  │  Source maps = mapping compiled → original source       │
  │  → Tốn EXTRA memory khi generate!                     │
  │                                                          │
  │  // next.config.js                                       │
  │  module.exports = {                                      │
  │    productionBrowserSourceMaps: false,    // Browser     │
  │    experimental: {                                       │
  │      serverSourceMaps: false,            // Server       │
  │    }                                                     │
  │  }                                                       │
  │                                                          │
  │  Nếu dùng cacheComponents + OOM ở "Generating static":  │
  │  enablePrerenderSourceMaps: false    // Prerender phase  │
  │                                                          │
  │  ⚠️ Một số plugins tự bật source maps!                 │
  │  → Cần config riêng để disable!                        │
  │                                                          │
  └──────────────────────────────────────────────────────────┘
```

---

## §6. Edge Memory + Preloading Entries!

```
  TIP 10A: EDGE RUNTIME FIX (v14.1.3)
  ┌──────────────────────────────────────────────────────────┐
  │                                                          │
  │  Next.js v14.1.3 fix memory issue khi dùng Edge runtime │
  │  → Update lên v14.1.3+ nếu gặp vấn đề!              │
  │                                                          │
  └──────────────────────────────────────────────────────────┘

  TIP 10B: PRELOADING ENTRIES
  ┌──────────────────────────────────────────────────────────┐
  │                                                          │
  │  MẶC ĐỊNH: Server start → preload TẤT CẢ page JS!   │
  │                                                          │
  │  ┌────────────────────────────────────────────────────┐  │
  │  │ Server Start:                                      │  │
  │  │ Load /home.js        ████ 5MB                      │  │
  │  │ Load /products.js    ████ 8MB                      │  │
  │  │ Load /about.js       ██ 2MB                        │  │
  │  │ Load /settings.js    ███ 4MB                       │  │
  │  │ ... 100+ pages       ████████████ 200MB+!         │  │
  │  │                                                    │  │
  │  │ → Initial memory: 200MB+ 😱                      │  │
  │  │ → Nhưng response TIME nhanh! (đã load sẵn!)    │  │
  │  └────────────────────────────────────────────────────┘  │
  │                                                          │
  │  Tắt preloading:                                         │
  │  ┌────────────────────────────────────────────────────┐  │
  │  │  const config = {                                  │  │
  │  │    experimental: {                                 │  │
  │  │      preloadEntriesOnStart: false                  │  │
  │  │    }                                               │  │
  │  │  }                                                 │  │
  │  │                                                    │  │
  │  │  → Initial memory: thấp hơn nhiều!              │  │
  │  │  → First request mỗi page: hơi chậm (load lúc │  │
  │  │    request!)                                       │  │
  │  │  → SAU KHI tất cả pages được request →           │  │
  │  │    memory BẰNG nhau! (Node.js không unload!)     │  │
  │  └────────────────────────────────────────────────────┘  │
  │                                                          │
  │  ⚠️ KEY INSIGHT: preloadEntriesOnStart: false           │
  │  chỉ DELAY memory usage, KHÔNG GIẢM tổng memory!      │
  │  → Modules loaded lazy nhưng KHÔNG được unload!       │
  │  → Eventually same total memory!                       │
  │                                                          │
  └──────────────────────────────────────────────────────────┘
```

---

## §7. Tự Viết — MemoryOptimizerEngine!

```javascript
var MemoryOptimizerEngine = (function () {
  // ═══════════════════════════════════
  // 1. MEMORY SIMULATOR
  // ═══════════════════════════════════
  var heap = {
    used: 0,
    limit: 4096, // 4GB default V8 limit
    objects: {},
    snapshots: [],
    logs: [],
  };

  function allocate(name, sizeMB) {
    heap.used += sizeMB;
    heap.objects[name] = sizeMB;
    heap.logs.push(
      "  ALLOC " +
        name +
        ": +" +
        sizeMB +
        "MB" +
        " (heap: " +
        heap.used +
        "/" +
        heap.limit +
        "MB)",
    );
    if (heap.used > heap.limit * 0.9) {
      heap.logs.push("  ⚠️ Near limit! Auto snapshot...");
      takeSnapshot();
    }
    if (heap.used > heap.limit) {
      heap.logs.push("  💀 FATAL: JavaScript heap out of memory!");
      return false;
    }
    return true;
  }

  function gc(collectMB) {
    heap.used = Math.max(0, heap.used - collectMB);
    heap.logs.push(
      "  GC: collected " + collectMB + "MB (heap: " + heap.used + "MB)",
    );
  }

  function takeSnapshot() {
    var snap = {
      timestamp: Date.now(),
      used: heap.used,
      objects: JSON.parse(JSON.stringify(heap.objects)),
    };
    heap.snapshots.push(snap);
    heap.logs.push(
      "  📸 Snapshot #" + heap.snapshots.length + ": " + heap.used + "MB",
    );
  }

  // ═══════════════════════════════════
  // 2. BUILD ANALYZER
  // ═══════════════════════════════════
  function analyzeBuild(config) {
    var issues = [];
    var tips = [];

    if (config.dependencies > 100) {
      issues.push("Too many deps: " + config.dependencies);
      tips.push("Use Bundle Analyzer to find large deps");
    }

    if (!config.webpackMemoryOpt && config.nextVersion >= 15) {
      tips.push("Enable webpackMemoryOptimizations: true");
    }

    if (!config.webpackBuildWorker && config.customWebpack) {
      tips.push("Enable webpackBuildWorker: true");
    }

    if (config.typescriptCheck && config.pagesCount > 200) {
      issues.push(
        "TypeScript check on " + config.pagesCount + " pages = HIGH memory",
      );
      tips.push("Set ignoreBuildErrors + run tsc in CI");
    }

    if (config.sourceMaps) {
      tips.push("Disable productionBrowserSourceMaps");
    }

    if (config.webpackCache) {
      tips.push("Freeze webpack cache for production");
    }

    if (config.preloadEntries && config.pagesCount > 50) {
      tips.push("Set preloadEntriesOnStart: false");
    }

    return { issues: issues, tips: tips };
  }

  // ═══════════════════════════════════
  // 3. WEBPACK BUILD WORKER SIM
  // ═══════════════════════════════════
  function simulateBuild(useWorker) {
    heap.used = 0;
    heap.objects = {};
    heap.logs = [];

    if (useWorker) {
      console.log("  🔧 Build WITH worker:");
      allocate("next-core", 200);
      allocate("routing", 100);
      console.log("  → Webpack in SEPARATE worker (not counted)");
      console.log("  → Main: " + heap.used + "MB | Worker: ~1200MB");
    } else {
      console.log("  🔧 Build WITHOUT worker:");
      allocate("next-core", 200);
      allocate("routing", 100);
      allocate("webpack-compile", 800);
      allocate("webpack-cache", 400);
      allocate("modules", 300);
      console.log("  → ALL in main: " + heap.used + "MB!");
    }
  }

  // ═══════════════════════════════════
  // 4. PRELOAD SIMULATION
  // ═══════════════════════════════════
  function simulatePreload(preloadEnabled, pages) {
    heap.used = 200; // base
    heap.objects = { "next-core": 200 };
    heap.logs = [];

    if (preloadEnabled) {
      console.log("  📦 Preload ON: Loading ALL pages...");
      for (var i = 0; i < pages.length; i++) {
        allocate(pages[i], 5);
      }
      console.log("  → Initial: " + heap.used + "MB");
      console.log("  → ALL requests: FAST! ⚡");
    } else {
      console.log("  📦 Preload OFF: Lazy loading...");
      console.log("  → Initial: " + heap.used + "MB (low!)");
      // Simulate requests
      allocate(pages[0], 5);
      console.log("  → After 1 request: " + heap.used + "MB");
      for (var j = 1; j < pages.length; j++) {
        allocate(pages[j], 5);
      }
      console.log(
        "  → After ALL requests: " + heap.used + "MB (same as preload!)",
      );
    }
  }

  // ═══════════════════════════════════
  // 5. DEMO
  // ═══════════════════════════════════
  function demo() {
    console.log("╔════════════════════════════════════╗");
    console.log("║  MEMORY OPTIMIZER ENGINE DEMO       ║");
    console.log("╚════════════════════════════════════╝");

    // Scenario 1: Build analysis
    console.log("\n── Scenario 1: Build Analysis ──");
    var result = analyzeBuild({
      dependencies: 250,
      nextVersion: 15,
      webpackMemoryOpt: false,
      webpackBuildWorker: false,
      customWebpack: true,
      typescriptCheck: true,
      pagesCount: 300,
      sourceMaps: true,
      webpackCache: true,
      preloadEntries: true,
    });
    console.log("  Issues: " + result.issues.length);
    for (var a = 0; a < result.issues.length; a++)
      console.log("  ❌ " + result.issues[a]);
    console.log("  Tips: " + result.tips.length);
    for (var b = 0; b < result.tips.length; b++)
      console.log("  💡 " + result.tips[b]);

    // Scenario 2: Worker vs no worker
    console.log("\n── Scenario 2: Webpack Worker ──");
    simulateBuild(false);
    console.log("");
    simulateBuild(true);

    // Scenario 3: Preloading
    console.log("\n── Scenario 3: Preload ──");
    var pages = ["/home", "/products", "/about", "/settings", "/admin"];
    simulatePreload(true, pages);
    console.log("");
    simulatePreload(false, pages);

    // Scenario 4: OOM simulation
    console.log("\n── Scenario 4: Near OOM ──");
    heap.used = 0;
    heap.objects = {};
    heap.logs = [];
    heap.limit = 100; // low limit for demo
    allocate("core", 30);
    allocate("webpack", 40);
    allocate("cache", 25); // 95MB → near limit!
    for (var c = 0; c < heap.logs.length; c++) console.log(heap.logs[c]);
  }

  return { demo: demo };
})();
// Chạy: MemoryOptimizerEngine.demo();
```

---

## §8. Câu Hỏi Luyện Tập!

**Câu 1**: Kể tên 10 chiến lược tối ưu memory trong Next.js.

<details><summary>Đáp án</summary>

1. **Reduce dependencies**: Dùng Bundle Analyzer, loại bỏ deps không cần thiết
2. **webpackMemoryOptimizations**: `experimental: { webpackMemoryOptimizations: true }` (v15+)
3. **--experimental-debug-memory-usage**: In heap usage liên tục, auto snapshot gần limit (v14.2+)
4. **Heap profile**: `node --heap-prof` → `.heapprofile` → Chrome DevTools Memory tab
5. **Heap snapshot**: `NODE_OPTIONS=--inspect` → Chrome DevTools → Take snapshot
6. **Webpack build worker**: Compile trong separate Node.js worker (default v14.1+)
7. **Disable webpack cache**: `Object.freeze({ type: 'memory' })` cho production
8. **Disable TypeScript check**: `typescript.ignoreBuildErrors: true` + type check trong CI riêng
9. **Disable source maps**: `productionBrowserSourceMaps: false` + `serverSourceMaps: false`
10. **Preloading entries**: `preloadEntriesOnStart: false` → lazy load page modules

</details>

---

**Câu 2**: webpackBuildWorker hoạt động thế nào? Tại sao giảm memory?

<details><summary>Đáp án</summary>

**Trước**: Webpack compile trong **main process** → tất cả compiled modules, cache, AST trees giữ trong cùng 1 process → memory CỰC CAO (2GB+).

**Sau**: Webpack compile trong **SEPARATE Node.js worker process**:

- Main process: chỉ Next.js core + routing → ~300MB
- Worker process: Webpack compile → ~1.2GB
- Memory **tách biệt** → main process không bị OOM vì Webpack

**Default từ v14.1+** (nếu KHÔNG có custom webpack config). Nếu có custom webpack → phải enable thủ công: `experimental: { webpackBuildWorker: true }`.

⚠️ Có thể không tương thích với một số custom Webpack plugins.

</details>

---

**Câu 3**: preloadEntriesOnStart: false có thực sự giảm tổng memory không?

<details><summary>Đáp án</summary>

**KHÔNG!** Nó chỉ **DELAY** memory usage, không giảm tổng.

**Mặc định (true)**: Server start → preload TẤT CẢ page JS vào memory → initial memory CAO nhưng response nhanh.

**false**: Server start → memory THẤP → nhưng mỗi khi page được request lần đầu → load JS module vào memory. **Node.js KHÔNG unload modules** → sau khi tất cả pages được request → memory **BẰNG NHAU**!

**Dùng khi**: Cần giảm **initial memory** (ví dụ container có memory limit thấp) hoặc app có nhiều pages mà user chỉ truy cập một số ít.

</details>

---

**Câu 4**: Khi nào nên disable TypeScript check trong build? Rủi ro gì?

<details><summary>Đáp án</summary>

**Khi nào**: Khi build **OOM** ở bước "Running TypeScript" — đặc biệt large projects (200+ pages). TypeScript type checking phải load **TOÀN BỘ** type information vào memory.

**Config**: `typescript: { ignoreBuildErrors: true }`

**Rủi ro**: Build thành công **DÙ CÓ type errors** → deploy code bị lỗi runtime!

**Best practice**:

1. CI Pipeline: Chạy `tsc --noEmit` (type check) trong **step riêng** (ít memory hơn vì chỉ check types, không compile)
2. `next build` với `ignoreBuildErrors: true` (chỉ compile, không type check)
3. Deploy **CHỈ KHI CẢ HAI** pass!
4. Vercel: dùng staging deployments → promote to production sau khi custom tasks succeed

</details>
