# App Icons (favicon, icon, apple-icon) — Deep Dive!

> **Nguồn**: https://nextjs.org/docs/app/api-reference/file-conventions/metadata/app-icons
> **Ngôn ngữ**: Tiếng Việt — giải thích cực kỳ chi tiết!
> **Trang này KHÔNG có hình/diagram** — chỉ có bảng, code blocks, callout boxes!
> **Since**: v13.3.0! (params Promise: v16.0.0!)

---

## §1. Tổng Quan — 3 Loại App Icons!

```
  APP ICONS — 3 LOẠI:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  ① favicon  → Tab trình duyệt! ★                             │
  │  ② icon     → Tab + Search results + Bookmarks! ★            │
  │  ③ apple-icon → iPhone/iPad Home Screen! ★                   │
  │                                                              │
  │  2 CÁCH SET ICONS:                                            │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ Cách 1: Image files (.ico, .jpg, .png) ★              │    │
  │  │   → Đặt file ảnh vào /app directory!                  │    │
  │  │   → Next.js TỰ ĐỘNG thêm <link> tags! ★              │    │
  │  │                                                       │    │
  │  │ Cách 2: Code generation (.js, .ts, .tsx) ★             │    │
  │  │   → Dùng ImageResponse API từ next/og!                │    │
  │  │   → Generate icon PROGRAMMATICALLY! ★                 │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  NƠI HIỂN THỊ:                                                │
  │  ┌───────────┐  ┌───────────┐  ┌───────────┐                │
  │  │ Browser   │  │ Phone     │  │ Search    │                │
  │  │ Tab ★     │  │ Home ★    │  │ Engine ★  │                │
  │  │ (favicon) │  │ (apple-   │  │ (icon)    │                │
  │  │ (icon)    │  │  icon)    │  │           │                │
  │  └───────────┘  └───────────┘  └───────────┘                │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```

---

## §2. Cách 1: Image Files — Đặt File Trực Tiếp!

```
  IMAGE FILES:
  ┌──────────────────┬──────────────┬──────────────┬─────────────┐
  │ File             │ Extensions   │ Location     │ Output      │
  ├──────────────────┼──────────────┼──────────────┼─────────────┤
  │ favicon          │ .ico         │ app/ ★       │ <link       │
  │                  │              │ CHỈ root!    │  rel="icon" │
  │                  │              │              │  href="/    │
  │                  │              │              │  favicon.ico│
  │                  │              │              │  sizes="any"│
  │                  │              │              │ />          │
  ├──────────────────┼──────────────┼──────────────┼─────────────┤
  │ icon             │ .ico .jpg    │ app/**/* ★   │ <link       │
  │                  │ .jpeg .png   │ BẤT KỲ      │  rel="icon" │
  │                  │ .svg         │ segment!     │  type="..." │
  │                  │              │              │  sizes="..">│
  ├──────────────────┼──────────────┼──────────────┼─────────────┤
  │ apple-icon       │ .jpg .jpeg   │ app/**/* ★   │ <link rel=  │
  │                  │ .png         │ BẤT KỲ      │ "apple-     │
  │                  │ (NO .svg!)   │ segment!     │ touch-icon" │
  │                  │ (NO .ico!)   │              │  .../>      │
  └──────────────────┴──────────────┴──────────────┴─────────────┘

  QUY TẮC QUAN TRỌNG:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  ① favicon.ico CHỈ ở ROOT /app! ★★★                          │
  │  → app/favicon.ico ✅                                        │
  │  → app/blog/favicon.ico ❌ KHÔNG hoạt động!                  │
  │  → Muốn icon theo segment → dùng icon file! ★               │
  │                                                              │
  │  ② icon, apple-icon → ĐẶT Ở BẤT KỲ segment! ★              │
  │  → app/icon.png ✅ (root!)                                   │
  │  → app/blog/icon.png ✅ (segment!)                           │
  │  → app/dashboard/apple-icon.png ✅ ★                         │
  │                                                              │
  │  ③ Multiple icons → thêm SỐ suffix! ★                        │
  │  → icon1.png, icon2.png, icon3.png...                        │
  │  → Sort theo LEXICAL order! ★                                │
  │                                                              │
  │  ④ Attributes TỰ DETECT! ★                                    │
  │  → 32x32px .png → type="image/png" sizes="32x32"! ★         │
  │  → .svg hoặc unknown size → sizes="any"! ★                  │
  │                                                              │
  │  ⑤ apple-icon KHÔNG hỗ trợ .svg và .ico! ★                   │
  │  → Chỉ .jpg, .jpeg, .png! ★                                 │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘

  FILE STRUCTURE VÍ DỤ:
  app/
  ├── favicon.ico            ← Root favicon! (CHỈ ở đây!)
  ├── icon.png               ← Root icon (32x32!)
  ├── apple-icon.png         ← Root apple touch icon!
  ├── blog/
  │   ├── icon.png           ← Blog-specific icon! ★
  │   └── page.tsx
  └── page.tsx

  OUTPUT <head>:
  <link rel="icon" href="/favicon.ico" sizes="any" />
  <link rel="icon" href="/icon?<generated>" type="image/png" sizes="32x32" />
  <link rel="apple-touch-icon" href="/apple-icon?<generated>"
        type="image/png" sizes="<generated>" />
```

---

## §3. Cách 2: Generate Icons Bằng Code!

```
  GENERATE ICONS VỚI CODE:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  FILES:                                                       │
  │  ┌──────────────┬──────────────────────┐                     │
  │  │ File         │ Extensions           │                     │
  │  ├──────────────┼──────────────────────┤                     │
  │  │ icon         │ .js, .ts, .tsx        │                     │
  │  │ apple-icon   │ .js, .ts, .tsx        │                     │
  │  └──────────────┴──────────────────────┘                     │
  │  ⚠️ KHÔNG thể generate favicon bằng code! ★                 │
  │  → favicon CHỈ dùng file .ico! ★                             │
  │                                                              │
  │  CODE VÍ DỤ (icon.tsx):                                       │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ import { ImageResponse } from 'next/og'              │    │
  │  │                                                       │    │
  │  │ // Image metadata                                      │    │
  │  │ export const size = { width: 32, height: 32 }         │    │
  │  │ export const contentType = 'image/png'                 │    │
  │  │                                                       │    │
  │  │ // Image generation                                     │    │
  │  │ export default function Icon() {                       │    │
  │  │   return new ImageResponse(                            │    │
  │  │     (                                                  │    │
  │  │       <div style={{                                     │    │
  │  │         fontSize: 24,                                   │    │
  │  │         background: 'black',                            │    │
  │  │         width: '100%',                                  │    │
  │  │         height: '100%',                                 │    │
  │  │         display: 'flex',                                │    │
  │  │         alignItems: 'center',                           │    │
  │  │         justifyContent: 'center',                       │    │
  │  │         color: 'white',                                 │    │
  │  │       }}>                                               │    │
  │  │         A                                               │    │
  │  │       </div>                                            │    │
  │  │     ),                                                  │    │
  │  │     { ...size }                                         │    │
  │  │   )                                                     │    │
  │  │ }                                                       │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  OUTPUT:                                                      │
  │  <link rel="icon" href="/icon?<generated>"                   │
  │        type="image/png" sizes="32x32" />                     │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘

  "GOOD TO KNOW" (từ docs!):
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  ① Generated icons → STATICALLY OPTIMIZED! ★                 │
  │    → Build time generate + cache! ★                          │
  │    → TRỪ KHI dùng Dynamic APIs hoặc uncached data!          │
  │                                                              │
  │  ② Multiple icons trong 1 file → generateImageMetadata! ★   │
  │                                                              │
  │  ③ KHÔNG thể generate favicon bằng code! ★                   │
  │    → Dùng icon file hoặc favicon.ico file! ★                 │
  │                                                              │
  │  ④ App icons = Special Route Handlers! ★                      │
  │    → Cached by default! ★                                    │
  │    → Trừ khi dùng Dynamic API hoặc dynamic config! ★        │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```

---

## §4. Props, Returns, Config Exports!

```
  PROPS (cho code-generated icons):
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  params (optional!):                                          │
  │  → Promise resolving to dynamic route params! ★              │
  │  → Giống page.tsx — phải await hoặc use()! ★                 │
  │                                                              │
  │  PARAMS MAPPING TABLE:                                        │
  │  ┌──────────────────────┬──────────┬─────────────────────┐   │
  │  │ Route                │ URL      │ params              │   │
  │  ├──────────────────────┼──────────┼─────────────────────┤   │
  │  │ app/shop/icon.js     │ /shop    │ undefined           │   │
  │  │ app/shop/[slug]/     │ /shop/1  │ Promise<{slug:'1'}> │   │
  │  │   icon.js            │          │                     │   │
  │  │ app/shop/[tag]/      │ /shop/   │ Promise<{tag:'1',   │   │
  │  │   [item]/icon.js     │   1/2    │   item:'2'}>        │   │
  │  └──────────────────────┴──────────┴─────────────────────┘   │
  │                                                              │
  │  CODE VÍ DỤ:                                                  │
  │  export default async function Icon({                        │
  │    params,                                                   │
  │  }: {                                                        │
  │    params: Promise<{ slug: string }>                         │
  │  }) {                                                        │
  │    const { slug } = await params  // ← await!               │
  │    // Generate icon dựa trên slug!                           │
  │  }                                                           │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘

  RETURNS:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  Trả về 1 trong các kiểu sau:                                │
  │  → Blob | ArrayBuffer | TypedArray                           │
  │  → DataView | ReadableStream | Response                      │
  │  → ImageResponse (satisfies return type!) ★                  │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘

  CONFIG EXPORTS:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  export const size = { width: 32, height: 32 }               │
  │  → Output: <link ... sizes="32x32" /> ★                     │
  │                                                              │
  │  export const contentType = 'image/png'                      │
  │  → Output: <link ... type="image/png" /> ★                  │
  │                                                              │
  │  ★ Route Segment Config cũng áp dụng! ★                      │
  │  → icon/apple-icon = Special Route Handlers!                 │
  │  → Dùng được dynamic, revalidate, etc.!                     │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```

---

## §5. Tự Viết — AppIconsEngine!

```javascript
var AppIconsEngine = (function () {
  // ═══════════════════════════════════
  // 1. ICON FILE VALIDATOR
  // ═══════════════════════════════════
  var RULES = {
    favicon: { extensions: [".ico"], location: "app/" },
    icon: {
      extensions: [".ico", ".jpg", ".jpeg", ".png", ".svg"],
      location: "app/**/*",
    },
    "apple-icon": {
      extensions: [".jpg", ".jpeg", ".png"],
      location: "app/**/*",
    },
  };

  function validateIconFile(type, extension, path) {
    var rule = RULES[type];
    if (!rule) return { valid: false, reason: "Unknown type: " + type };

    // Check extension
    var extValid = false;
    for (var i = 0; i < rule.extensions.length; i++) {
      if (extension === rule.extensions[i]) {
        extValid = true;
        break;
      }
    }
    if (!extValid) {
      return {
        valid: false,
        reason: type + " KHÔNG hỗ trợ " + extension + "! ★",
        allowed: rule.extensions,
      };
    }

    // Check location (favicon must be root only)
    if (type === "favicon" && path !== "app/") {
      return {
        valid: false,
        reason: "favicon CHỈ được đặt ở ROOT app/! ★★★",
        tip: "Muốn icon theo segment → dùng icon file!",
      };
    }

    return { valid: true, output: generateLinkTag(type, extension) };
  }

  // ═══════════════════════════════════
  // 2. LINK TAG GENERATOR
  // ═══════════════════════════════════
  function generateLinkTag(type, extension) {
    var rel = type === "apple-icon" ? "apple-touch-icon" : "icon";
    var mimeMap = {
      ".ico": "image/x-icon",
      ".png": "image/png",
      ".jpg": "image/jpeg",
      ".jpeg": "image/jpeg",
      ".svg": "image/svg+xml",
    };
    var mimeType = mimeMap[extension] || "image/png";
    var sizes = extension === ".svg" ? "any" : "<detected>";

    return (
      '<link rel="' +
      rel +
      '" href="/' +
      type +
      '?<generated>" type="' +
      mimeType +
      '" sizes="' +
      sizes +
      '" />'
    );
  }

  // ═══════════════════════════════════
  // 3. CODE ICON SIMULATOR
  // ═══════════════════════════════════
  function simulateCodeIcon(config) {
    var size = config.size || { width: 32, height: 32 };
    var contentType = config.contentType || "image/png";
    var hasDynamicAPI = config.hasDynamicAPI || false;

    return {
      output:
        '<link rel="icon" href="/icon?<generated>" type="' +
        contentType +
        '" sizes="' +
        size.width +
        "x" +
        size.height +
        '" />',
      caching: hasDynamicAPI
        ? "DYNAMIC! Không cache! (Dynamic API detected!) ★"
        : "STATIC! Build time + cached! ★",
      returnType: "ImageResponse",
    };
  }

  // ═══════════════════════════════════
  // 4. PARAMS RESOLVER
  // ═══════════════════════════════════
  function resolveIconParams(routePath, url) {
    var routeParts = routePath.split("/").filter(Boolean);
    var urlParts = url.split("/").filter(Boolean);
    var params = {};

    for (var i = 0; i < routeParts.length; i++) {
      var part = routeParts[i];
      if (part.match(/^\[.+\]$/)) {
        var key = part.replace(/^\[/, "").replace(/\]$/, "");
        params[key] = urlParts[i] || undefined;
      }
    }

    var hasParams = Object.keys(params).length > 0;
    return {
      route: routePath,
      url: url,
      params: hasParams ? params : undefined,
      type: hasParams ? "Promise<" + JSON.stringify(params) + ">" : "undefined",
    };
  }

  // ═══════════════════════════════════
  // 5. DEMO
  // ═══════════════════════════════════
  function demo() {
    console.log("═══ App Icons Engine ═══");

    console.log("\n── Validate Icon Files ──");
    console.log(
      "favicon .ico root:",
      validateIconFile("favicon", ".ico", "app/"),
    );
    console.log(
      "favicon .ico nested:",
      validateIconFile("favicon", ".ico", "app/blog/"),
    );
    console.log("icon .svg:", validateIconFile("icon", ".svg", "app/blog/"));
    console.log(
      "apple-icon .svg:",
      validateIconFile("apple-icon", ".svg", "app/"),
    );
    console.log(
      "apple-icon .png:",
      validateIconFile("apple-icon", ".png", "app/shop/"),
    );

    console.log("\n── Code Icon ──");
    console.log(
      "Static:",
      simulateCodeIcon({ size: { width: 32, height: 32 } }),
    );
    console.log("Dynamic:", simulateCodeIcon({ hasDynamicAPI: true }));

    console.log("\n── Params ──");
    console.log("app/shop/icon.js:", resolveIconParams("app/shop", "/shop"));
    console.log(
      "app/[slug]/icon.js:",
      resolveIconParams("app/[slug]", "/hello"),
    );
    console.log(
      "[tag]/[item]/icon.js:",
      resolveIconParams("app/[tag]/[item]", "/a/b"),
    );
  }

  return { demo: demo };
})();
// Chạy: AppIconsEngine.demo();
```

---

## §6. Câu Hỏi Phỏng Vấn!

```
  CÂU HỎI:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  ❓ 1: favicon vs icon vs apple-icon?                          │
  │  → favicon: CHỈ .ico, CHỈ ở ROOT app/! ★                    │
  │  → icon: .ico .jpg .png .svg, ĐẶT Ở BẤT KỲ segment! ★     │
  │  → apple-icon: .jpg .png (NO .svg .ico!), any segment! ★    │
  │                                                              │
  │  ❓ 2: favicon.ico đặt ở app/blog/ được không?                 │
  │  → KHÔNG! ❌ favicon CHỈ ở root app/! ★★★                   │
  │  → Muốn icon per-segment → dùng icon file! ★                │
  │                                                              │
  │  ❓ 3: Generate icon bằng code → static hay dynamic?           │
  │  → Mặc định STATIC! Build time + cached! ★                  │
  │  → Dùng Dynamic APIs hoặc uncached data → DYNAMIC! ★        │
  │  → App icons = Special Route Handlers! ★                     │
  │                                                              │
  │  ❓ 4: Có thể generate favicon bằng code không?                │
  │  → KHÔNG! ❌ Chỉ icon và apple-icon! ★                      │
  │  → favicon PHẢI dùng file .ico! ★                            │
  │                                                              │
  │  ❓ 5: Multiple icons trong 1 route?                           │
  │  → Cách 1: icon1.png, icon2.png (number suffix!) ★          │
  │  → Cách 2: generateImageMetadata API! ★                     │
  │  → Sort lexically (icon1 < icon2 < icon3!) ★                │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```
