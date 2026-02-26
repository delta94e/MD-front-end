# ImageResponse — Deep Dive!

> **Nguồn**: https://nextjs.org/docs/app/api-reference/functions/image-response
> **Ngôn ngữ**: Tiếng Việt — giải thích cực kỳ chi tiết!
> **Trang này KHÔNG có hình/diagram** — chỉ có text + code blocks!
> **Since**: v13.3.0! (import từ `next/og`)

---

## §1. ImageResponse Là Gì?

```
  ImageResponse — TỔNG QUAN:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  WHAT:                                                        │
  │  → Constructor generate DYNAMIC images từ JSX + CSS! ★      │
  │  → Social media images: OG, Twitter cards, icons! ★         │
  │  → import { ImageResponse } from 'next/og'                  │
  │                                                              │
  │  PIPELINE:                                                    │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │                                                       │    │
  │  │  JSX element                                          │    │
  │  │    ↓                                                  │    │
  │  │  Satori (JSX → SVG)                                   │    │
  │  │    ↓                                                  │    │
  │  │  Resvg (SVG → PNG)                                    │    │
  │  │    ↓                                                  │    │
  │  │  Response (PNG binary!) ★                              │    │
  │  │                                                       │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  DÙNG TRONG:                                                  │
  │  → Route Handlers (app/api/og/route.tsx) ✅                  │
  │  → File-based Metadata (opengraph-image.tsx, icon.tsx) ✅   │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```

---

## §2. Parameters + Behavior!

```
  CONSTRUCTOR PARAMETERS:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  new ImageResponse(element, options)                          │
  │                                                              │
  │  element: ReactElement ← JSX của image! ★                   │
  │                                                              │
  │  options:                                                     │
  │  ┌───────────────┬──────────┬────────────────────────────┐   │
  │  │ Property       │ Default  │ Mô tả                      │   │
  │  ├───────────────┼──────────┼────────────────────────────┤   │
  │  │ width          │ 1200     │ Chiều rộng (px)! ★         │   │
  │  │ height         │ 630      │ Chiều cao (px)! ★          │   │
  │  │ emoji          │ 'twemoji'│ twemoji/blobmoji/noto/     │   │
  │  │                │          │ openmoji! ★                │   │
  │  │ fonts          │ []       │ Custom fonts array! ★      │   │
  │  │ debug          │ false    │ Debug mode! ★              │   │
  │  │ status         │ 200      │ HTTP status code! ★        │   │
  │  │ statusText     │ ''       │ HTTP status text! ★        │   │
  │  │ headers        │ {}       │ HTTP headers! ★            │   │
  │  └───────────────┴──────────┴────────────────────────────┘   │
  │                                                              │
  │  fonts array item:                                            │
  │  { name: string, data: ArrayBuffer,                          │
  │    weight: number, style: 'normal' | 'italic' }              │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘

  BEHAVIOR — Giới hạn:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  ① Dùng @vercel/og + Satori + Resvg! ★                       │
  │  ② CHỈ flexbox! display: grid KHÔNG work! ★★★               │
  │  ③ Max bundle size: 500KB! (JSX+CSS+fonts+images!) ★★★     │
  │  ④ Font formats: ttf, otf, woff! (ttf/otf nhanh hơn!) ★    │
  │  ⑤ Subset CSS: text-wrapping, centering, nested images! ★  │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```

---

## §3. Examples — 3 Patterns!

```
  PATTERN 1: ROUTE HANDLER
  ┌──────────────────────────────────────────────────────────────┐
  │  // app/api/og/route.tsx                                      │
  │  import { ImageResponse } from 'next/og'                    │
  │  export async function GET() {                                │
  │    return new ImageResponse(                                 │
  │      <div style={{                                           │
  │        height: '100%', width: '100%', display: 'flex',       │
  │        flexDirection: 'column', alignItems: 'center',        │
  │        justifyContent: 'center', backgroundColor: 'white',  │
  │      }}>                                                     │
  │        <div style={{ fontSize: 60 }}>Welcome!</div>          │
  │      </div>,                                                 │
  │      { width: 1200, height: 630 }                            │
  │    )                                                         │
  │  }                                                           │
  └──────────────────────────────────────────────────────────────┘

  PATTERN 2: FILE-BASED METADATA (opengraph-image.tsx)
  ┌──────────────────────────────────────────────────────────────┐
  │  // app/opengraph-image.tsx                                   │
  │  export const alt = 'My site'                                │
  │  export const size = { width: 1200, height: 630 }           │
  │  export const contentType = 'image/png'                      │
  │  export default async function Image() {                      │
  │    return new ImageResponse(<div>My site</div>, { ...size }) │
  │  }                                                           │
  │  → Tái sử dụng size export! ★                               │
  └──────────────────────────────────────────────────────────────┘

  PATTERN 3: CUSTOM FONTS
  ┌──────────────────────────────────────────────────────────────┐
  │  import { readFile } from 'node:fs/promises'                 │
  │  const font = await readFile(                                │
  │    join(process.cwd(), 'assets/Inter-SemiBold.ttf')          │
  │  )                                                           │
  │  return new ImageResponse(<div>Hello</div>, {                │
  │    ...size,                                                  │
  │    fonts: [{ name: 'Inter', data: font,                      │
  │              style: 'normal', weight: 400 }],                │
  │  })                                                          │
  │  → Font load từ project dir! ★                               │
  │  → ttf/otf preferred over woff! ★                            │
  └──────────────────────────────────────────────────────────────┘
```

---

## §4. Tự Viết — ImageResponseEngine!

```javascript
var ImageResponseEngine = (function () {
  // ═══════════════════════════════════
  // 1. OPTIONS VALIDATOR
  // ═══════════════════════════════════
  function validateOptions(options) {
    var errors = [];
    var defaults = {
      width: 1200,
      height: 630,
      emoji: "twemoji",
      debug: false,
      status: 200,
    };
    var merged = {};
    for (var k in defaults) merged[k] = defaults[k];
    if (options) for (var k in options) merged[k] = options[k];

    if (merged.width <= 0 || merged.height <= 0)
      errors.push("width/height phải > 0! ★");
    var emojis = ["twemoji", "blobmoji", "noto", "openmoji"];
    if (emojis.indexOf(merged.emoji) === -1)
      errors.push("emoji không hợp lệ! ★");
    if (merged.fonts) {
      for (var i = 0; i < merged.fonts.length; i++) {
        var f = merged.fonts[i];
        if (!f.name) errors.push("Font[" + i + "] thiếu name! ★");
        if (!f.data) errors.push("Font[" + i + "] thiếu data (ArrayBuffer)! ★");
        var exts = ["ttf", "otf", "woff"];
        // Note: chỉ check format nếu có filename hint
      }
    }
    return { options: merged, errors: errors };
  }

  // ═══════════════════════════════════
  // 2. BUNDLE SIZE CHECKER
  // ═══════════════════════════════════
  function checkBundleSize(jsxSize, cssSize, fontsSize, imagesSize) {
    var MAX = 500 * 1024; // 500KB
    var total = jsxSize + cssSize + fontsSize + imagesSize;
    return {
      total: total,
      max: MAX,
      ok: total <= MAX,
      remaining: MAX - total,
      warning:
        total > MAX
          ? "VƯỢT LIMIT 500KB! Giảm font/image hoặc fetch runtime! ★★★"
          : null,
    };
  }

  // ═══════════════════════════════════
  // 3. CSS SUPPORT CHECKER
  // ═══════════════════════════════════
  function checkCssSupport(cssProperty) {
    var supported = [
      "display:flex",
      "flexDirection",
      "alignItems",
      "justifyContent",
      "padding",
      "margin",
      "fontSize",
      "fontWeight",
      "color",
      "backgroundColor",
      "background",
      "border",
      "borderRadius",
      "width",
      "height",
      "position:absolute",
      "position:relative",
      "top",
      "left",
      "right",
      "bottom",
      "textAlign",
      "lineHeight",
      "letterSpacing",
      "textTransform",
      "opacity",
      "overflow",
    ];
    var unsupported = [
      "display:grid",
      "display:table",
      "animation",
      "transition",
      "transform",
      "filter",
    ];
    var prop = cssProperty.toLowerCase().replace(/\s/g, "");
    if (
      unsupported.some(function (u) {
        return prop.indexOf(u.toLowerCase()) >= 0;
      })
    ) {
      return { supported: false, note: prop + " KHÔNG được hỗ trợ! ★★★" };
    }
    return { supported: true, note: prop + " có thể dùng! ★" };
  }

  // ═══════════════════════════════════
  // 4. DEMO
  // ═══════════════════════════════════
  function demo() {
    console.log("═══ ImageResponse Engine ═══");

    console.log("\n── Options ──");
    console.log(
      validateOptions({ width: 1200, height: 630, emoji: "twemoji" }),
    );
    console.log(validateOptions({ width: -1 }));

    console.log("\n── Bundle ──");
    console.log(checkBundleSize(5000, 2000, 300000, 100000)); // OK
    console.log(checkBundleSize(5000, 2000, 400000, 200000)); // OVER

    console.log("\n── CSS ──");
    console.log(checkCssSupport("display:flex"));
    console.log(checkCssSupport("display:grid"));
    console.log(checkCssSupport("animation"));
  }

  return { demo: demo };
})();
// Chạy: ImageResponseEngine.demo();
```

---

## §5. Câu Hỏi Phỏng Vấn!

```
  CÂU HỎI:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  ❓ 1: ImageResponse hoạt động thế nào?                        │
  │  → JSX → Satori (SVG) → Resvg (PNG) → Response! ★          │
  │  → Dùng @vercel/og under the hood! ★                        │
  │                                                              │
  │  ❓ 2: Giới hạn CSS nào?                                       │
  │  → CHỈ flexbox! display:grid KHÔNG work! ★★★                │
  │  → Subset CSS: fonts, text, colors, position! ★             │
  │                                                              │
  │  ❓ 3: Max bundle size?                                         │
  │  → 500KB cho JSX + CSS + fonts + images! ★★★                │
  │  → Vượt → fetch font/image at runtime! ★                    │
  │                                                              │
  │  ❓ 4: Font formats nào?                                        │
  │  → ttf, otf, woff! ★                                         │
  │  → ttf/otf nhanh hơn woff! ★                                │
  │                                                              │
  │  ❓ 5: 2 cách dùng ImageResponse?                               │
  │  → Route Handler: app/api/og/route.tsx! ★                   │
  │  → File-based: opengraph-image.tsx, icon.tsx! ★             │
  │  → File-based có thể export alt, size, contentType! ★       │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```
