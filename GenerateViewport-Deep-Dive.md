# generateViewport() — Deep Dive!

> **Nguồn**: https://nextjs.org/docs/app/api-reference/functions/generate-viewport
> **Ngôn ngữ**: Tiếng Việt — giải thích cực kỳ chi tiết!
> **Trang này KHÔNG có hình/diagram** — chỉ có text + code blocks!
> **Since**: v14.0.0! (Tách ra từ metadata!)

---

## §1. generateViewport() Là Gì?

```
  generateViewport() — TỔNG QUAN:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  WHAT:                                                        │
  │  → Customize viewport meta tag cho page! ★                   │
  │  → TÁCH RA từ metadata object (v14+!) ★                     │
  │  → 2 cách: static viewport HOẶC generateViewport! ★        │
  │                                                              │
  │  2 CÁCH:                                                      │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │                                                       │    │
  │  │  ① STATIC:                                             │    │
  │  │  export const viewport = { themeColor: 'black' }      │    │
  │  │  → Khi KHÔNG phụ thuộc runtime info! ★                │    │
  │  │                                                       │    │
  │  │  ② DYNAMIC:                                            │    │
  │  │  export function generateViewport({ params }) {       │    │
  │  │    return { themeColor: '...' }                        │    │
  │  │  }                                                     │    │
  │  │  → Phụ thuộc params! ★                                 │    │
  │  │                                                       │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  QUY TẮC:                                                     │
  │  → Chỉ Server Components! ★                                 │
  │  → KHÔNG export cả 2 (viewport + generateViewport)! ★★★    │
  │  → Migration codemod: metadata-to-viewport-export! ★        │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```

---

## §2. Viewport Fields — 3 Fields!

```
  VIEWPORT FIELDS:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  ① themeColor:                                                │
  │  ┌─────────────────────────────────────────────────────┐     │
  │  │ Simple:                                              │     │
  │  │ viewport = { themeColor: 'black' }                   │     │
  │  │ → <meta name="theme-color" content="black">        │     │
  │  │                                                      │     │
  │  │ With media (light/dark!):                             │     │
  │  │ themeColor: [                                         │     │
  │  │   { media: '(prefers-color-scheme: light)',           │     │
  │  │     color: 'cyan' },                                  │     │
  │  │   { media: '(prefers-color-scheme: dark)',            │     │
  │  │     color: 'black' },                                 │     │
  │  │ ]                                                     │     │
  │  │ → 2 <meta> tags with media attribute! ★              │     │
  │  └─────────────────────────────────────────────────────┘     │
  │                                                              │
  │  ② width + initialScale + maximumScale + userScalable:        │
  │  ┌─────────────────────────────────────────────────────┐     │
  │  │ viewport = {                                         │     │
  │  │   width: 'device-width',                             │     │
  │  │   initialScale: 1,                                   │     │
  │  │   maximumScale: 1,                                   │     │
  │  │   userScalable: false,                               │     │
  │  │ }                                                    │     │
  │  │ → <meta name="viewport" content="width=device-width,│     │
  │  │    initial-scale=1, maximum-scale=1,                 │     │
  │  │    user-scalable=no">                                │     │
  │  │                                                      │     │
  │  │ "Good to know": Default đã đủ tốt! ★                │     │
  │  │ → Thường KHÔNG cần config thêm! ★                   │     │
  │  └─────────────────────────────────────────────────────┘     │
  │                                                              │
  │  ③ colorScheme:                                               │
  │  ┌─────────────────────────────────────────────────────┐     │
  │  │ viewport = { colorScheme: 'dark' }                   │     │
  │  │ → <meta name="color-scheme" content="dark">         │     │
  │  │ → Browser render dark mode native controls! ★       │     │
  │  └─────────────────────────────────────────────────────┘     │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```

---

## §3. Tự Viết — ViewportEngine!

```javascript
var ViewportEngine = (function () {
  // ═══════════════════════════════════
  // 1. VIEWPORT META GENERATOR
  // ═══════════════════════════════════
  function generateViewportMeta(viewport) {
    var tags = [];

    // themeColor
    if (viewport.themeColor) {
      if (typeof viewport.themeColor === "string") {
        tags.push(
          '<meta name="theme-color" content="' + viewport.themeColor + '">',
        );
      } else if (Array.isArray(viewport.themeColor)) {
        for (var i = 0; i < viewport.themeColor.length; i++) {
          var tc = viewport.themeColor[i];
          tags.push(
            '<meta name="theme-color" media="' +
              tc.media +
              '" content="' +
              tc.color +
              '">',
          );
        }
      }
    }

    // viewport dimensions
    var parts = [];
    if (viewport.width) parts.push("width=" + viewport.width);
    if (viewport.initialScale !== undefined)
      parts.push("initial-scale=" + viewport.initialScale);
    if (viewport.maximumScale !== undefined)
      parts.push("maximum-scale=" + viewport.maximumScale);
    if (viewport.userScalable === false) parts.push("user-scalable=no");
    if (parts.length) {
      tags.push('<meta name="viewport" content="' + parts.join(", ") + '">');
    }

    // colorScheme
    if (viewport.colorScheme) {
      tags.push(
        '<meta name="color-scheme" content="' + viewport.colorScheme + '">',
      );
    }

    return tags;
  }

  // ═══════════════════════════════════
  // 2. VALIDATOR
  // ═══════════════════════════════════
  function validate(viewport) {
    var warnings = [];
    if (viewport.userScalable === false) {
      warnings.push("userScalable=false → Accessibility issue! Zoom bị tắt! ★");
    }
    if (viewport.maximumScale && viewport.maximumScale < 2) {
      warnings.push("maximumScale < 2 → Hạn chế zoom! ★");
    }
    return { valid: true, warnings: warnings };
  }

  // ═══════════════════════════════════
  // 3. DEMO
  // ═══════════════════════════════════
  function demo() {
    console.log("═══ Viewport Engine ═══");

    console.log("\n── Simple ──");
    console.log(generateViewportMeta({ themeColor: "black" }));

    console.log("\n── Full ──");
    console.log(
      generateViewportMeta({
        themeColor: [
          { media: "(prefers-color-scheme: light)", color: "cyan" },
          { media: "(prefers-color-scheme: dark)", color: "black" },
        ],
        width: "device-width",
        initialScale: 1,
        maximumScale: 1,
        userScalable: false,
        colorScheme: "dark",
      }),
    );

    console.log("\n── Validate ──");
    console.log(validate({ userScalable: false, maximumScale: 1 }));
  }

  return { demo: demo };
})();
// Chạy: ViewportEngine.demo();
```

---

## §4. Câu Hỏi Phỏng Vấn!

```
  CÂU HỎI:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  ❓ 1: Tại sao viewport tách ra từ metadata?                    │
  │  → v14+ tách riêng vì viewport ĐẶC BIỆT! ★                 │
  │  → Viewport ảnh hưởng layout TRƯỚC khi content load! ★      │
  │  → Streaming metadata: viewport PHẢI có sớm! ★             │
  │  → Codemod: metadata-to-viewport-export! ★                 │
  │                                                              │
  │  ❓ 2: viewport vs generateViewport — khi nào?                  │
  │  → Static (không runtime) → viewport object! ★              │
  │  → Dynamic (params) → generateViewport()! ★                 │
  │  → KHÔNG export cả 2! ★★★                                   │
  │                                                              │
  │  ❓ 3: themeColor với media query?                              │
  │  → Array of { media, color }! ★                              │
  │  → Light mode: cyan, Dark mode: black! ★                    │
  │  → Browser tự chọn dựa trên prefers-color-scheme! ★        │
  │                                                              │
  │  ❓ 4: userScalable: false — vấn đề gì?                        │
  │  → Accessibility issue! Không zoom được! ★★★                │
  │  → WCAG khuyến cáo KHÔNG nên dùng! ★                       │
  │  → Chỉ dùng cho app-like experiences! ★                     │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```
