# devIndicators — Deep Dive!

> **Nguồn**: https://nextjs.org/docs/app/api-reference/config/next-config-js/devIndicators
> **Ngôn ngữ**: Tiếng Việt — giải thích cực kỳ chi tiết!
> **Trang này KHÔNG có hình/diagram** — chỉ có text + code blocks!

---

## §1. devIndicators Là Gì?

```
  devIndicators — TỔNG QUAN:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  WHAT:                                                        │
  │  → On-screen indicator trong DEVELOPMENT mode! ★            │
  │  → Hiển thị context về route hiện tại! ★                   │
  │  → Static (○) vs Dynamic (ƒ)! ★★★                         │
  │  → CHỈ development! Production không có! ★                 │
  │                                                              │
  │  CONFIG:                                                      │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │  devIndicators: false | {                              │    │
  │  │    position?: 'bottom-right'                           │    │
  │  │             | 'bottom-left'   ← DEFAULT! ★★★          │    │
  │  │             | 'top-right'                              │    │
  │  │             | 'top-left'                               │    │
  │  │  }                                                     │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  VỊ TRÍ:                                                      │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │  ┌──────────────────────────────────────┐              │    │
  │  │  │ top-left ★         top-right ★        │              │    │
  │  │  │                                       │              │    │
  │  │  │           TRANG WEB                    │              │    │
  │  │  │                                       │              │    │
  │  │  │ bottom-left ★★★   bottom-right ★     │              │    │
  │  │  │ (DEFAULT)                              │              │    │
  │  │  └──────────────────────────────────────┘              │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  TẮT:                                                         │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │  devIndicators: false  ← ẩn indicator! ★               │    │
  │  │  → Build/runtime errors VẪN hiển thị! ★★★             │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```

---

## §2. Static vs Dynamic Routes!

```
  ROUTE TYPES:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  next build --debug output:                                   │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │  Route (app)                                           │    │
  │  │  ┌ ○ /_not-found                                       │    │
  │  │  └ ƒ /products/[id]                                    │    │
  │  │                                                       │    │
  │  │  ○  (Static)  prerendered as static content! ★        │    │
  │  │  ƒ  (Dynamic) server-rendered on demand! ★            │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  TẠI SAO DYNAMIC (ƒ)?                                         │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │                                                       │    │
  │  │  2 nguyên nhân khiến route DYNAMIC:                    │    │
  │  │                                                       │    │
  │  │  ① Dynamic APIs! ★★★                                   │    │
  │  │    → cookies(), headers(), searchParams! ★             │    │
  │  │    → Phụ thuộc runtime info! ★                        │    │
  │  │                                                       │    │
  │  │  ② Uncached data request! ★★★                          │    │
  │  │    → ORM call, database driver! ★                     │    │
  │  │    → Fetch without cache! ★                           │    │
  │  │                                                       │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  NẾU KHÔNG THỂ STATIC:                                        │
  │  → Dùng loading.js cho streaming! ★                        │
  │  → Dùng <Suspense /> cho partial loading! ★                │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```

---

## §3. Version History!

```
  VERSION HISTORY:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  ┌───────────┬──────────────────────────────────────────┐    │
  │  │ Version     │ Thay đổi                                │    │
  │  ├───────────┼──────────────────────────────────────────┤    │
  │  │ v16.0.0     │ Simplified! Deprecated appIsrStatus,    │    │
  │  │            │ buildActivity, buildActivityPosition! ★ │    │
  │  │ v15.2.0     │ Thêm position option! ★                 │    │
  │  │            │ Deprecated cũ! ★                         │    │
  │  │ v15.0.0     │ Thêm appIsrStatus! ★                    │    │
  │  └───────────┴──────────────────────────────────────────┘    │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```

---

## §4. Tự Viết — DevIndicatorsEngine!

```javascript
var DevIndicatorsEngine = (function () {
  // ═══════════════════════════════════
  // 1. CONFIG RESOLVER
  // ═══════════════════════════════════
  function resolveConfig(devIndicators) {
    if (devIndicators === false) {
      return {
        visible: false,
        position: null,
        note: "Indicator HIDDEN! Errors still shown! ★",
      };
    }

    var config = devIndicators || {};
    var position = config.position || "bottom-left";
    var validPositions = [
      "bottom-right",
      "bottom-left",
      "top-right",
      "top-left",
    ];

    if (validPositions.indexOf(position) < 0) {
      return {
        error: "Invalid position: " + position + "! ★",
        valid: validPositions,
      };
    }

    return {
      visible: true,
      position: position,
      note: "Indicator at " + position + "! ★",
    };
  }

  // ═══════════════════════════════════
  // 2. ROUTE ANALYZER
  // ═══════════════════════════════════
  function analyzeRoute(route) {
    var dynamicReasons = [];

    // Check Dynamic APIs
    if (route.usesCookies) dynamicReasons.push("cookies()");
    if (route.usesHeaders) dynamicReasons.push("headers()");
    if (route.usesSearchParams) dynamicReasons.push("searchParams");

    // Check uncached data
    if (route.hasUncachedFetch) dynamicReasons.push("uncached fetch");
    if (route.usesORM) dynamicReasons.push("ORM/database call");

    var isStatic = dynamicReasons.length === 0;

    return {
      path: route.path,
      type: isStatic ? "Static (○)" : "Dynamic (ƒ)",
      symbol: isStatic ? "○" : "ƒ",
      dynamicReasons: dynamicReasons.length > 0 ? dynamicReasons : null,
      recommendation: isStatic
        ? "Prerendered! Fast! ★"
        : "Consider loading.js or <Suspense /> for streaming! ★",
    };
  }

  // ═══════════════════════════════════
  // 3. BUILD OUTPUT SIMULATOR
  // ═══════════════════════════════════
  function simulateBuildOutput(routes) {
    var output = "Route (app)\n";
    for (var i = 0; i < routes.length; i++) {
      var analysis = analyzeRoute(routes[i]);
      var prefix = i === routes.length - 1 ? "└" : "├";
      output += prefix + " " + analysis.symbol + " " + analysis.path + "\n";
    }
    output += "\n○  (Static)  prerendered as static content\n";
    output += "ƒ  (Dynamic) server-rendered on demand\n";
    return output;
  }

  // ═══════════════════════════════════
  // 4. DEMO
  // ═══════════════════════════════════
  function demo() {
    console.log("═══ DevIndicators Engine ═══");

    console.log("\n── 1. Config ──");
    console.log("Default:", resolveConfig(undefined));
    console.log("Custom:", resolveConfig({ position: "top-right" }));
    console.log("Hidden:", resolveConfig(false));

    console.log("\n── 2. Route Analysis ──");
    var routes = [
      { path: "/", usesCookies: false, usesHeaders: false },
      { path: "/_not-found", usesCookies: false },
      {
        path: "/products/[id]",
        usesSearchParams: true,
        hasUncachedFetch: true,
      },
      { path: "/dashboard", usesCookies: true, usesHeaders: true },
      { path: "/about", usesCookies: false },
    ];

    for (var i = 0; i < routes.length; i++) {
      console.log(analyzeRoute(routes[i]));
    }

    console.log("\n── 3. Build Output ──");
    console.log(simulateBuildOutput(routes));
  }

  return { demo: demo };
})();
// Chạy: DevIndicatorsEngine.demo();
```

---

## §5. Câu Hỏi Phỏng Vấn!

```
  CÂU HỎI:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  ❓ 1: devIndicators dùng làm gì?                              │
  │  → On-screen indicator cho route context! ★                 │
  │  → Static (○) vs Dynamic (ƒ)! ★★★                         │
  │  → CHỈ development mode! ★                                 │
  │  → Default position: bottom-left! ★                        │
  │                                                              │
  │  ❓ 2: Tắt devIndicators thì sao?                               │
  │  → devIndicators: false → ẩn indicator! ★                  │
  │  → Build/runtime errors VẪN hiển thị! ★★★                 │
  │  → Chỉ ẩn route context, KHÔNG ẩn lỗi! ★                 │
  │                                                              │
  │  ❓ 3: Route dynamic vì sao?                                   │
  │  → 2 nguyên nhân: Dynamic APIs + uncached data! ★★★       │
  │  → cookies(), headers(), searchParams! ★                   │
  │  → ORM/database calls! ★                                   │
  │  → Dùng next build --debug để check! ★                     │
  │                                                              │
  │  ❓ 4: Nếu route dynamic nhưng muốn tối ưu?                   │
  │  → loading.js cho streaming! ★                              │
  │  → <Suspense /> cho partial loading! ★                     │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```
