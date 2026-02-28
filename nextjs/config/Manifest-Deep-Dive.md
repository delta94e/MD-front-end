# manifest.json — Deep Dive!

> **Nguồn**: https://nextjs.org/docs/app/api-reference/file-conventions/metadata/manifest
> **Spec**: https://developer.mozilla.org/docs/Web/Manifest
> **Ngôn ngữ**: Tiếng Việt — giải thích cực kỳ chi tiết!
> **Trang này KHÔNG có hình/diagram** — chỉ có text + code blocks!

---

## §1. manifest.json Là Gì?

```
  WEB APP MANIFEST — TỔNG QUAN:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  WHAT:                                                        │
  │  → File JSON cung cấp THÔNG TIN về web app cho browser! ★   │
  │  → Theo chuẩn Web Manifest Specification (W3C/MDN)! ★       │
  │  → Cho phép app cài đặt lên Home Screen (PWA!) ★            │
  │                                                              │
  │  FILE NAMES ACCEPTED:                                         │
  │  → manifest.json ★                                           │
  │  → manifest.webmanifest ★                                    │
  │  → manifest.js / manifest.ts (code generate!) ★             │
  │                                                              │
  │  LOCATION:                                                    │
  │  → ROOT của app/ directory! ★                                │
  │  → app/manifest.json hoặc app/manifest.ts                   │
  │                                                              │
  │  OUTPUT:                                                      │
  │  → <link rel="manifest" href="/manifest.webmanifest" />      │
  │                                                              │
  │  USE CASES:                                                   │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ → PWA: Cài app lên Home Screen! ★                    │    │
  │  │ → Tên app khi cài!                                   │    │
  │  │ → Icon trên Home Screen!                              │    │
  │  │ → Splash screen khi mở app!                          │    │
  │  │ → Theme color cho browser bar!                        │    │
  │  │ → Chế độ hiển thị (standalone, fullscreen!)           │    │
  │  │ → Orientation (portrait, landscape!)                  │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```

---

## §2. Cách 1: Static Manifest File!

```
  STATIC MANIFEST:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  FILE: app/manifest.json (hoặc .webmanifest)                  │
  │                                                              │
  │  {                                                            │
  │    "name": "My Next.js Application",                         │
  │    "short_name": "Next.js App",                              │
  │    "description": "An application built with Next.js",       │
  │    "start_url": "/",                                         │
  │    "display": "standalone",                                  │
  │    "background_color": "#ffffff",                            │
  │    "theme_color": "#000000",                                 │
  │    "icons": [                                                │
  │      {                                                       │
  │        "src": "/favicon.ico",                                │
  │        "sizes": "any",                                       │
  │        "type": "image/x-icon"                                │
  │      },                                                      │
  │      {                                                       │
  │        "src": "/icon-192.png",                               │
  │        "sizes": "192x192",                                   │
  │        "type": "image/png"                                   │
  │      },                                                      │
  │      {                                                       │
  │        "src": "/icon-512.png",                               │
  │        "sizes": "512x512",                                   │
  │        "type": "image/png"                                   │
  │      }                                                       │
  │    ]                                                         │
  │  }                                                           │
  │                                                              │
  │  → Đơn giản! Đặt file JSON vào app/! ★                      │
  │  → Next.js TỰ ĐỘNG thêm <link> tag! ★                       │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```

---

## §3. Cách 2: Generate Manifest Bằng Code!

```
  GENERATE MANIFEST:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  FILE: app/manifest.ts (hoặc .js)                             │
  │                                                              │
  │  import type { MetadataRoute } from 'next'                   │
  │                                                              │
  │  export default function manifest(): MetadataRoute.Manifest { │
  │    return {                                                   │
  │      name: 'Next.js App',                                    │
  │      short_name: 'Next.js App',                              │
  │      description: 'Next.js App',                             │
  │      start_url: '/',                                         │
  │      display: 'standalone',                                  │
  │      background_color: '#fff',                               │
  │      theme_color: '#fff',                                    │
  │      icons: [                                                │
  │        {                                                     │
  │          src: '/favicon.ico',                                │
  │          sizes: 'any',                                       │
  │          type: 'image/x-icon',                               │
  │        },                                                    │
  │      ],                                                      │
  │    }                                                         │
  │  }                                                           │
  │                                                              │
  │  ★ "Good to know" từ docs:                                    │
  │  → manifest.js = Special Route Handler! ★                    │
  │  → CACHED by default! ★                                      │
  │  → TRỪ KHI dùng Dynamic API hoặc dynamic config! ★          │
  │                                                              │
  │  LỢI ÍCH CODE vs STATIC:                                     │
  │  ┌──────────────────────┬──────────────────────────────┐     │
  │  │ Static (.json)       │ Code (.ts/.js) ★              │     │
  │  ├──────────────────────┼──────────────────────────────┤     │
  │  │ Cố định!             │ DYNAMIC giá trị! ★            │     │
  │  │ Không logic!         │ Có thể đọc env, DB! ★        │     │
  │  │ Không TypeScript!    │ TYPE SAFE! ★                  │     │
  │  │ Đơn giản!            │ MetadataRoute.Manifest! ★    │     │
  │  └──────────────────────┴──────────────────────────────┘     │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```

---

## §4. Manifest Object — Tất Cả Các Fields!

```
  MANIFEST FIELDS (từ Web Manifest Spec!):
  ┌──────────────────┬──────────────────────────────────────────┐
  │ Field            │ Mô tả + Ví dụ                           │
  ├──────────────────┼──────────────────────────────────────────┤
  │ name             │ Tên FULL của app! ★                      │
  │                  │ "My Next.js Application"                 │
  ├──────────────────┼──────────────────────────────────────────┤
  │ short_name       │ Tên NGẮN (Home Screen!) ★                │
  │                  │ "Next App"                               │
  ├──────────────────┼──────────────────────────────────────────┤
  │ description      │ Mô tả app!                              │
  │                  │ "An application built with Next.js"      │
  ├──────────────────┼──────────────────────────────────────────┤
  │ start_url        │ URL khi mở app! ★                        │
  │                  │ "/"                                      │
  ├──────────────────┼──────────────────────────────────────────┤
  │ display          │ Chế độ hiển thị! ★★★                     │
  │                  │ "fullscreen" | "standalone" |            │
  │                  │ "minimal-ui" | "browser"                 │
  ├──────────────────┼──────────────────────────────────────────┤
  │ background_color │ Màu nền Splash Screen! ★                 │
  │                  │ "#ffffff"                                │
  ├──────────────────┼──────────────────────────────────────────┤
  │ theme_color      │ Màu browser bar/status bar! ★            │
  │                  │ "#000000"                                │
  ├──────────────────┼──────────────────────────────────────────┤
  │ icons            │ Array icons cho app! ★                    │
  │                  │ [{ src, sizes, type, purpose }]          │
  ├──────────────────┼──────────────────────────────────────────┤
  │ orientation      │ Hướng màn hình! ★                        │
  │                  │ "portrait" | "landscape" | "any"         │
  ├──────────────────┼──────────────────────────────────────────┤
  │ scope            │ Phạm vi navigation!                      │
  │                  │ "/"                                      │
  ├──────────────────┼──────────────────────────────────────────┤
  │ lang             │ Ngôn ngữ!                                │
  │                  │ "en" | "vi"                              │
  ├──────────────────┼──────────────────────────────────────────┤
  │ dir              │ Hướng text!                              │
  │                  │ "ltr" | "rtl" | "auto"                   │
  ├──────────────────┼──────────────────────────────────────────┤
  │ categories       │ Danh mục app!                            │
  │                  │ ["business", "technology"]               │
  ├──────────────────┼──────────────────────────────────────────┤
  │ screenshots      │ Screenshots cho store listing!           │
  │                  │ [{ src, sizes, type }]                   │
  └──────────────────┴──────────────────────────────────────────┘

  DISPLAY MODES CHI TIẾT:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  "fullscreen":                                                │
  │  ┌──────────────┐                                            │
  │  │ ████████████ │ ← STATUS BAR ẨN!                          │
  │  │ ████████████ │ ← BROWSER BAR ẨN!                         │
  │  │ ██ APP UI ██ │ ← Full screen! ★                          │
  │  │ ████████████ │                                            │
  │  │ ████████████ │ ← NAVIGATION ẨN!                          │
  │  └──────────────┘                                            │
  │                                                              │
  │  "standalone": ★ (PHỔI BIẾN NHẤT!)                           │
  │  ┌──────────────┐                                            │
  │  │ ▓ Status Bar │ ← Status bar HIỆN!                        │
  │  │ ████████████ │ ← BROWSER BAR ẨN!                         │
  │  │ ██ APP UI ██ │ ← Giống native app! ★                     │
  │  │ ████████████ │                                            │
  │  └──────────────┘                                            │
  │                                                              │
  │  "minimal-ui":                                                │
  │  ┌──────────────┐                                            │
  │  │ ▓ Status Bar │                                            │
  │  │ ◁  ▷  ⟳     │ ← Minimal navigation! ★                   │
  │  │ ██ APP UI ██ │                                            │
  │  │ ████████████ │                                            │
  │  └──────────────┘                                            │
  │                                                              │
  │  "browser": (MẶC ĐỊNH!)                                      │
  │  ┌──────────────┐                                            │
  │  │ ▓ Status Bar │                                            │
  │  │ 🔍 URL bar  │ ← Full browser UI! ★                      │
  │  │ ◁  ▷  ⟳ ☆  │ ← Tabs, bookmarks...                      │
  │  │ ██ APP UI ██ │                                            │
  │  └──────────────┘                                            │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```

---

## §5. Tự Viết — ManifestEngine!

```javascript
var ManifestEngine = (function () {
  // ═══════════════════════════════════
  // 1. MANIFEST VALIDATOR
  // ═══════════════════════════════════
  var DISPLAY_MODES = ["fullscreen", "standalone", "minimal-ui", "browser"];
  var ORIENTATIONS = ["any", "natural", "landscape", "portrait"];

  function validateManifest(manifest) {
    var errors = [];
    var warnings = [];

    // Required fields
    if (!manifest.name && !manifest.short_name) {
      errors.push("Phải có ít nhất name HOẶC short_name! ★");
    }
    if (!manifest.start_url) {
      warnings.push("Thiếu start_url! Nên có '/' ★");
    }
    if (!manifest.icons || manifest.icons.length === 0) {
      warnings.push("Thiếu icons! PWA cần ít nhất 192x192 + 512x512! ★");
    }

    // Display mode
    if (manifest.display) {
      var validDisplay = false;
      for (var i = 0; i < DISPLAY_MODES.length; i++) {
        if (manifest.display === DISPLAY_MODES[i]) {
          validDisplay = true;
          break;
        }
      }
      if (!validDisplay) {
        errors.push(
          "display không hợp lệ: " +
            manifest.display +
            "! Chỉ: " +
            DISPLAY_MODES.join(", "),
        );
      }
    }

    // Icons check
    if (manifest.icons) {
      var has192 = false,
        has512 = false;
      for (var j = 0; j < manifest.icons.length; j++) {
        if (manifest.icons[j].sizes === "192x192") has192 = true;
        if (manifest.icons[j].sizes === "512x512") has512 = true;
      }
      if (!has192) warnings.push("Thiếu icon 192x192 (PWA required!) ★");
      if (!has512) warnings.push("Thiếu icon 512x512 (PWA required!) ★");
    }

    return {
      valid: errors.length === 0,
      errors: errors,
      warnings: warnings,
    };
  }

  // ═══════════════════════════════════
  // 2. MANIFEST GENERATOR
  // ═══════════════════════════════════
  function generateManifest(config) {
    var manifest = {
      name: config.name || "My App",
      short_name: config.shortName || config.name || "App",
      description: config.description || "",
      start_url: config.startUrl || "/",
      display: config.display || "standalone",
      background_color: config.bgColor || "#ffffff",
      theme_color: config.themeColor || "#000000",
      icons: [],
    };

    // Auto-generate standard PWA icons
    if (config.iconBasePath) {
      var sizes = [
        { s: "48x48", w: 48 },
        { s: "72x72", w: 72 },
        { s: "96x96", w: 96 },
        { s: "144x144", w: 144 },
        { s: "192x192", w: 192 },
        { s: "256x256", w: 256 },
        { s: "384x384", w: 384 },
        { s: "512x512", w: 512 },
      ];
      for (var i = 0; i < sizes.length; i++) {
        manifest.icons.push({
          src: config.iconBasePath + "/icon-" + sizes[i].w + ".png",
          sizes: sizes[i].s,
          type: "image/png",
        });
      }
    }

    if (config.orientation) manifest.orientation = config.orientation;
    if (config.scope) manifest.scope = config.scope;

    return manifest;
  }

  // ═══════════════════════════════════
  // 3. LINK TAG GENERATOR
  // ═══════════════════════════════════
  function generateLinkTag(filePath) {
    var isWebmanifest = filePath.indexOf(".webmanifest") > -1;
    var href = "/" + filePath.replace("app/", "");
    return '<link rel="manifest" href="' + href + '" />';
  }

  // ═══════════════════════════════════
  // 4. STATIC vs CODE ADVISOR
  // ═══════════════════════════════════
  function chooseStaticOrCode(requirements) {
    if (
      requirements.dynamicValues ||
      requirements.envBased ||
      requirements.dbBased
    ) {
      return {
        recommendation: "manifest.ts (code!)",
        reasons: [
          requirements.dynamicValues ? "Dynamic values cần logic! ★" : null,
          requirements.envBased ? "Đọc environment variables! ★" : null,
          requirements.dbBased ? "Đọc từ database! ★" : null,
        ].filter(Boolean),
        typeSafe: "MetadataRoute.Manifest! ★",
      };
    }
    return {
      recommendation: "manifest.json (static!)",
      reasons: ["Giá trị cố định, đơn giản! ★"],
      typeSafe: "Không! (JSON thuần!) ★",
    };
  }

  // ═══════════════════════════════════
  // 5. DEMO
  // ═══════════════════════════════════
  function demo() {
    console.log("═══ Manifest Engine ═══");

    console.log("\n── Validate ──");
    console.log(
      "Good manifest:",
      validateManifest({
        name: "My App",
        start_url: "/",
        display: "standalone",
        icons: [
          { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
          { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
        ],
      }),
    );
    console.log("Bad manifest:", validateManifest({ display: "wrong" }));

    console.log("\n── Generate ──");
    console.log(
      JSON.stringify(
        generateManifest({
          name: "Cool App",
          shortName: "Cool",
          description: "A cool app!",
          display: "standalone",
          themeColor: "#ff6600",
          iconBasePath: "/icons",
        }),
        null,
        2,
      ),
    );

    console.log("\n── Static vs Code ──");
    console.log("Static:", chooseStaticOrCode({}));
    console.log(
      "Dynamic:",
      chooseStaticOrCode({ dynamicValues: true, envBased: true }),
    );
  }

  return { demo: demo };
})();
// Chạy: ManifestEngine.demo();
```

---

## §6. Câu Hỏi Phỏng Vấn!

```
  CÂU HỎI:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  ❓ 1: manifest.json để làm gì?                                │
  │  → Cung cấp thông tin app cho browser! ★                    │
  │  → PWA: cài lên Home Screen, splash screen, theme color! ★ │
  │  → Theo chuẩn Web Manifest Specification! ★                 │
  │                                                              │
  │  ❓ 2: Static (.json) vs Code (.ts) — khác gì?                 │
  │  → Static: cố định, đơn giản, không type-safe! ★            │
  │  → Code: dynamic values, đọc env/DB, TYPE SAFE! ★           │
  │  → Code: MetadataRoute.Manifest type! ★                     │
  │  → Code: Special Route Handler, CACHED by default! ★        │
  │                                                              │
  │  ❓ 3: 4 display modes khác nhau thế nào?                      │
  │  → "fullscreen": ẩn TẤT CẢ, full screen! ★                 │
  │  → "standalone": ẩn browser bar, giống native app! ★        │
  │  → "minimal-ui": có nút back/forward/reload! ★              │
  │  → "browser": browser bình thường! (mặc định!) ★            │
  │                                                              │
  │  ❓ 4: PWA cần icons gì tối thiểu?                             │
  │  → 192x192 (Home Screen!) + 512x512 (Splash Screen!) ★     │
  │  → Nên có thêm: 48, 72, 96, 144, 256, 384 cho phủ hết! ★  │
  │                                                              │
  │  ❓ 5: manifest.js có cached không?                             │
  │  → CÓ! Cached by default! ★                                 │
  │  → TRỪ KHI dùng Dynamic API hoặc dynamic config! ★          │
  │  → Giống icon.js, apple-icon.js — Special Route Handler! ★  │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```
