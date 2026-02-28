# pageExtensions — Deep Dive!

> **Nguồn**: https://nextjs.org/docs/app/api-reference/config/next-config-js/pageExtensions
> **Ngôn ngữ**: Tiếng Việt — giải thích cực kỳ chi tiết!
> **Trang này KHÔNG có hình/diagram** — chỉ có text + code blocks!

---

## §1. pageExtensions Là Gì?

```
  pageExtensions — TỔNG QUAN:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  WHAT:                                                        │
  │  → Customize file extensions mà Next.js nhận diện! ★★★   │
  │  → Default: .tsx, .ts, .jsx, .js ★                        │
  │  → Mở rộng thêm: .md, .mdx, ... ★★★                     │
  │                                                              │
  │  DEFAULT:                                                     │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │  pages/ hoặc app/                                      │    │
  │  │  ├── page.tsx ✅ (recognized!)                         │    │
  │  │  ├── page.ts  ✅                                       │    │
  │  │  ├── page.jsx ✅                                       │    │
  │  │  ├── page.js  ✅                                       │    │
  │  │  ├── page.md  ❌ (IGNORED by default!) ★★★            │    │
  │  │  └── page.mdx ❌ (IGNORED by default!) ★★★            │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  CUSTOM (thêm md, mdx):                                      │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │  pageExtensions: ['js','jsx','ts','tsx','md','mdx']   │    │
  │  │                                                       │    │
  │  │  pages/ hoặc app/                                      │    │
  │  │  ├── page.tsx ✅                                       │    │
  │  │  ├── page.md  ✅ (NOW recognized!) ★★★                │    │
  │  │  └── page.mdx ✅ (NOW recognized!) ★★★                │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  CONFIG (với MDX):                                            │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │  const withMDX = require('@next/mdx')()               │    │
  │  │  const nextConfig = {                                  │    │
  │  │    pageExtensions: [                                   │    │
  │  │      'js', 'jsx', 'ts', 'tsx',                         │    │
  │  │      'md', 'mdx' ★★★                                  │    │
  │  │    ]                                                   │    │
  │  │  }                                                     │    │
  │  │  module.exports = withMDX(nextConfig) ★                │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  FLOW:                                                        │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │                                                       │    │
  │  │  File found in app/ or pages/                          │    │
  │  │       ↓                                                │    │
  │  │  Extension in pageExtensions? ★★★                     │    │
  │  │       ↓ YES              ↓ NO                          │    │
  │  │  Process as             IGNORE file! ★                │    │
  │  │  page/route! ✅                                        │    │
  │  │                                                       │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```

---

## §2. Tự Viết — PageExtensionsEngine!

```javascript
var PageExtensionsEngine = (function () {
  // ═══════════════════════════════════
  // 1. EXTENSION CHECKER
  // ═══════════════════════════════════
  function getExtension(filename) {
    var dot = filename.lastIndexOf(".");
    return dot >= 0 ? filename.slice(dot + 1) : "";
  }

  function isValidPage(filename, pageExtensions) {
    var ext = getExtension(filename);
    for (var i = 0; i < pageExtensions.length; i++) {
      if (ext === pageExtensions[i]) return true;
    }
    return false;
  }

  // ═══════════════════════════════════
  // 2. FILE SCANNER
  // ═══════════════════════════════════
  function scanDirectory(files, config) {
    var extensions = config.pageExtensions || ["tsx", "ts", "jsx", "js"];
    var pages = [];
    var ignored = [];

    for (var i = 0; i < files.length; i++) {
      if (isValidPage(files[i], extensions)) {
        pages.push({ file: files[i], status: "✅ Page" });
      } else {
        ignored.push({ file: files[i], status: "❌ Ignored" });
      }
    }

    return {
      extensions: extensions,
      pages: pages,
      ignored: ignored,
      total: files.length,
      recognized: pages.length,
    };
  }

  // ═══════════════════════════════════
  // 3. DEMO
  // ═══════════════════════════════════
  function demo() {
    console.log("═══ PageExtensions Engine ═══");

    var files = [
      "page.tsx",
      "page.ts",
      "page.jsx",
      "page.js",
      "page.md",
      "page.mdx",
      "readme.txt",
      "styles.css",
    ];

    console.log("\n── 1. Default extensions ──");
    console.log(scanDirectory(files, {}));

    console.log("\n── 2. With MDX extensions ──");
    console.log(
      scanDirectory(files, {
        pageExtensions: ["js", "jsx", "ts", "tsx", "md", "mdx"],
      }),
    );
  }

  return { demo: demo };
})();
// Chạy: PageExtensionsEngine.demo();
```

---

## §3. Câu Hỏi Phỏng Vấn!

```
  CÂU HỎI:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  ❓ 1: pageExtensions dùng làm gì?                            │
  │  → Customize extensions Next.js nhận diện! ★★★            │
  │  → Default: .tsx, .ts, .jsx, .js! ★                       │
  │  → Thêm .md, .mdx cho MDX pages! ★★★                    │
  │                                                              │
  │  ❓ 2: Khi nào dùng?                                          │
  │  → MDX content pages! ★★★                                │
  │  → Blog, docs site với markdown! ★                        │
  │  → Custom file formats! ★                                 │
  │                                                              │
  │  ❓ 3: Không thêm thì sao?                                    │
  │  → Files bị IGNORED! ★★★                                 │
  │  → Không render thành pages! ★                            │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```
