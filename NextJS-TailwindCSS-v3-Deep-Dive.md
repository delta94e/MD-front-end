# Next.js Tailwind CSS v3 — Deep Dive!

> **Chủ đề**: Tailwind CSS v3 — Utility-First CSS Trong Next.js!
> **Ngôn ngữ**: Tiếng Việt — giải thích cực kỳ chi tiết!
> **Phương châm**: Tự viết lại bằng tay — KHÔNG dùng thư viện!
> **Nguồn**: https://nextjs.org/docs/app/guides/tailwind-v3-css
> **Lưu ý**: Trang gốc KHÔNG có sơ đồ — tất cả diagrams TỰ VẼ!

---

## Mục Lục

1. [§1. Tổng Quan — Tailwind CSS Là Gì?](#1)
2. [§2. Installing Tailwind v3!](#2)
3. [§3. Configuring — tailwind.config.js!](#3)
4. [§4. Using Classes — Utility-First!](#4)
5. [§5. Turbopack Support!](#5)
6. [§6. Tailwind v3 vs v4!](#6)
7. [§7. Tự Viết — TailwindEngine!](#7)
8. [§8. Câu Hỏi Luyện Tập](#8)

---

## §1. Tổng Quan — Tailwind CSS Là Gì?

```
  TAILWIND CSS — UTILITY-FIRST CSS FRAMEWORK!
  ┌────────────────────────────────────────────────────────────┐
  │                                                            │
  │  TRADITIONAL CSS:            TAILWIND CSS:                  │
  │  ┌──────────────────┐        ┌──────────────────┐          │
  │  │ .card {           │        │ <div class="      │          │
  │  │   padding: 1rem;  │        │   p-4 bg-white   │          │
  │  │   background: #fff│        │   rounded-lg     │          │
  │  │   border-radius:  │        │   shadow-md">    │          │
  │  │     0.5rem;       │        │                  │          │
  │  │   box-shadow:     │        │ → Inline utility │          │
  │  │     0 2px 4px;    │        │   classes!       │          │
  │  │ }                 │        └──────────────────┘          │
  │  │ → Separate CSS   │                                      │
  │  │   file! (custom   │        Ưu điểm Tailwind:           │
  │  │   class names!)   │        ① No switching files!        │
  │  └──────────────────┘        ② No naming classes!          │
  │                               ③ Purge unused → tiny CSS!  │
  │                               ④ Consistent design tokens!  │
  │                               ⑤ Responsive: sm: md: lg:!  │
  │                                                            │
  │  TAILWIND IN NEXT.JS:                                       │
  │  ┌──────────────────────────────────────────────────────┐  │
  │  │ Source Code:           Build Time:        Output:    │  │
  │  │ ┌──────────┐          ┌──────────┐       ┌────────┐│  │
  │  │ │ JSX with │  PostCSS │ Tailwind │ Purge │Tiny CSS││  │
  │  │ │ className│───────▶ │ Compiler │──────▶│file!   ││  │
  │  │ │ props!   │          │ scans    │       │Only    ││  │
  │  │ │          │          │ content  │       │used    ││  │
  │  │ └──────────┘          │ paths!   │       │classes!││  │
  │  │                       └──────────┘       └────────┘│  │
  │  └──────────────────────────────────────────────────────┘  │
  │                                                            │
  └────────────────────────────────────────────────────────────┘
```

---

## §2. Installing Tailwind v3!

```
  INSTALLATION — 2 STEPS!
  ┌──────────────────────────────────────────────────────────┐
  │                                                          │
  │  Step 1: Install packages!                                │
  │  ┌──────────────────────────────────────────────────────┐│
  │  │ pnpm add -D tailwindcss@^3 postcss autoprefixer     ││
  │  │                                                      ││
  │  │ 3 packages:                                          ││
  │  │ ┌───────────────┬──────────────────────────────┐     ││
  │  │ │ Package       │ Purpose                      │     ││
  │  │ ├───────────────┼──────────────────────────────┤     ││
  │  │ │ tailwindcss   │ Core framework! (v3!)        │     ││
  │  │ │ postcss       │ CSS transformer pipeline!    │     ││
  │  │ │ autoprefixer  │ Auto vendor prefixes!        │     ││
  │  │ │               │ (-webkit-, -moz-, etc!)      │     ││
  │  │ └───────────────┴──────────────────────────────┘     ││
  │  │ → DevDependency (-D)! Chỉ cần lúc build!           ││
  │  │ → @^3: lock to version 3.x!                         ││
  │  └──────────────────────────────────────────────────────┘│
  │                                                          │
  │  Step 2: Generate config files!                           │
  │  ┌──────────────────────────────────────────────────────┐│
  │  │ npx tailwindcss init -p                              ││
  │  │                                                      ││
  │  │ Creates 2 files:                                     ││
  │  │ ① tailwind.config.js  ← Tailwind config!           ││
  │  │ ② postcss.config.js   ← PostCSS plugins!           ││
  │  │ (-p flag = also create postcss.config.js!)           ││
  │  └──────────────────────────────────────────────────────┘│
  │                                                          │
  │  INSTALL WITH OTHER PACKAGE MANAGERS:                      │
  │  ┌──────────────────┬────────────────────────────────┐   │
  │  │ Manager          │ Command                        │   │
  │  ├──────────────────┼────────────────────────────────┤   │
  │  │ pnpm             │ pnpm add -D tailwindcss@^3     │   │
  │  │                  │ postcss autoprefixer            │   │
  │  │ npm              │ npm install -D tailwindcss@^3   │   │
  │  │                  │ postcss autoprefixer            │   │
  │  │ yarn             │ yarn add -D tailwindcss@^3     │   │
  │  │                  │ postcss autoprefixer            │   │
  │  │ bun              │ bun add -d tailwindcss@^3      │   │
  │  │                  │ postcss autoprefixer            │   │
  │  └──────────────────┴────────────────────────────────┘   │
  │                                                          │
  └──────────────────────────────────────────────────────────┘
```

---

## §3. Configuring — tailwind.config.js!

```
  CẤU HÌNH — 3 BƯỚC!
  ┌────────────────────────────────────────────────────────────┐
  │                                                            │
  │  BƯỚC 1: tailwind.config.js — Content Paths!              │
  │  ┌──────────────────────────────────────────────────────┐  │
  │  │ /** @type {import('tailwindcss').Config} */           │  │
  │  │ module.exports = {                                   │  │
  │  │   content: [                                         │  │
  │  │     './app/**/*.{js,ts,jsx,tsx,mdx}',                │  │
  │  │     './pages/**/*.{js,ts,jsx,tsx,mdx}',              │  │
  │  │     './components/**/*.{js,ts,jsx,tsx,mdx}',         │  │
  │  │   ],                                                 │  │
  │  │   theme: { extend: {} },                             │  │
  │  │   plugins: [],                                       │  │
  │  │ }                                                    │  │
  │  │                                                      │  │
  │  │ content ARRAY — Tailwind scans these paths:         │  │
  │  │ ┌────────────────┬──────────────────────────────┐   │  │
  │  │ │ Path           │ What it covers               │   │  │
  │  │ ├────────────────┼──────────────────────────────┤   │  │
  │  │ │ ./app/**/*     │ App Router! (layouts, pages) │   │  │
  │  │ │ ./pages/**/*   │ Pages Router! (legacy)       │   │  │
  │  │ │ ./components/* │ Shared components!           │   │  │
  │  │ └────────────────┴──────────────────────────────┘   │  │
  │  │ Extensions: .js .ts .jsx .tsx .mdx                   │  │
  │  │ → Tailwind SCANS these files for class names!       │  │
  │  │ → Only USED classes → included in output CSS!       │  │
  │  │ → Unused classes → PURGED! (tiny bundle!)           │  │
  │  └──────────────────────────────────────────────────────┘  │
  │                                                            │
  │  BƯỚC 2: globals.css — 3 Directives!                      │
  │  ┌──────────────────────────────────────────────────────┐  │
  │  │ /* app/globals.css */                                │  │
  │  │ @tailwind base;         ← Reset + base styles!     │  │
  │  │ @tailwind components;   ← Component classes!        │  │
  │  │ @tailwind utilities;    ← Utility classes! (p-4,   │  │
  │  │                            text-red-500, etc!)       │  │
  │  │                                                      │  │
  │  │ 3 LAYERS:                                            │  │
  │  │ ┌──────────────┬──────────────────────────────┐     │  │
  │  │ │ Directive     │ What it injects              │     │  │
  │  │ ├──────────────┼──────────────────────────────┤     │  │
  │  │ │ @tailwind base│ Normalize + CSS reset!      │     │  │
  │  │ │              │ (margin:0, box-sizing, etc!) │     │  │
  │  │ │ @tailwind     │ Pre-built component classes! │     │  │
  │  │ │ components   │ (container, prose, etc!)     │     │  │
  │  │ │ @tailwind     │ ALL utility classes!         │     │  │
  │  │ │ utilities    │ (p-4, mt-2, flex, grid,     │     │  │
  │  │ │              │  bg-blue-500, text-white!)   │     │  │
  │  │ └──────────────┴──────────────────────────────┘     │  │
  │  └──────────────────────────────────────────────────────┘  │
  │                                                            │
  │  BƯỚC 3: Import in Root Layout!                            │
  │  ┌──────────────────────────────────────────────────────┐  │
  │  │ // app/layout.tsx                                    │  │
  │  │ import './globals.css'   // ← Import Tailwind!     │  │
  │  │                                                      │  │
  │  │ export default function RootLayout({                 │  │
  │  │   children                                           │  │
  │  │ }: { children: React.ReactNode }) {                  │  │
  │  │   return (                                           │  │
  │  │     <html lang="en">                                 │  │
  │  │       <body>{children}</body>                        │  │
  │  │     </html>                                          │  │
  │  │   )                                                  │  │
  │  │ }                                                    │  │
  │  │ → globals.css loaded GLOBALLY for all routes!       │  │
  │  └──────────────────────────────────────────────────────┘  │
  │                                                            │
  │  FULL FLOW:                                                 │
  │  tailwind.config.js ──► scan content paths ──►            │
  │  globals.css ──► @tailwind directives ──► PostCSS ──►     │
  │  Output: tiny CSS with ONLY used classes! ⚡              │
  │                                                            │
  └────────────────────────────────────────────────────────────┘
```

---

## §4. Using Classes — Utility-First!

```
  UTILITY CLASSES:
  ┌──────────────────────────────────────────────────────────┐
  │                                                          │
  │  EXAMPLE:                                                 │
  │  ┌──────────────────────────────────────────────────────┐│
  │  │ export default function Page() {                     ││
  │  │   return (                                           ││
  │  │     <h1 className="text-3xl font-bold underline">    ││
  │  │       Hello, Next.js!                                ││
  │  │     </h1>                                            ││
  │  │   )                                                  ││
  │  │ }                                                    ││
  │  └──────────────────────────────────────────────────────┘│
  │                                                          │
  │  BREAKDOWN:                                               │
  │  ┌──────────────┬───────────────────┬────────────────┐   │
  │  │ Class        │ CSS equivalent    │ Category       │   │
  │  ├──────────────┼───────────────────┼────────────────┤   │
  │  │ text-3xl     │ font-size: 1.875  │ Typography     │   │
  │  │              │ rem; line-height: │                │   │
  │  │              │ 2.25rem;          │                │   │
  │  │ font-bold    │ font-weight: 700; │ Typography     │   │
  │  │ underline    │ text-decoration:  │ Typography     │   │
  │  │              │ underline;        │                │   │
  │  └──────────────┴───────────────────┴────────────────┘   │
  │                                                          │
  │  COMMON UTILITIES:                                        │
  │  ┌──────────────┬───────────────────────────────────┐    │
  │  │ Category     │ Examples                          │    │
  │  ├──────────────┼───────────────────────────────────┤    │
  │  │ Spacing      │ p-4, m-2, px-6, mt-8, gap-4     │    │
  │  │ Sizing       │ w-full, h-screen, max-w-lg       │    │
  │  │ Typography   │ text-lg, font-semibold, italic   │    │
  │  │ Colors       │ bg-blue-500, text-white          │    │
  │  │ Borders      │ rounded-lg, border, border-gray  │    │
  │  │ Flex/Grid    │ flex, grid, items-center, gap-2  │    │
  │  │ Responsive   │ sm:text-lg, md:flex, lg:grid-3   │    │
  │  │ Hover/Focus  │ hover:bg-blue-700, focus:ring    │    │
  │  │ Dark mode    │ dark:bg-gray-900, dark:text-white│    │
  │  └──────────────┴───────────────────────────────────┘    │
  │                                                          │
  └──────────────────────────────────────────────────────────┘
```

---

## §5. Turbopack Support!

```
  TURBOPACK:
  ┌──────────────────────────────────────────────────────────┐
  │                                                          │
  │  Since Next.js 13.1:                                      │
  │  Tailwind CSS + PostCSS = SUPPORTED with Turbopack! ✅   │
  │                                                          │
  │  WEBPACK vs TURBOPACK:                                    │
  │  ┌──────────────────┬──────────────────────────────┐     │
  │  │ Webpack (default) │ Turbopack (next --turbopack)│     │
  │  ├──────────────────┼──────────────────────────────┤     │
  │  │ Slower HMR       │ ⚡ Fast HMR!               │     │
  │  │ Full bundler     │ Incremental! (Rust-based!)  │     │
  │  │ Tailwind ✅      │ Tailwind ✅ (since 13.1!)  │     │
  │  │ PostCSS ✅       │ PostCSS ✅                 │     │
  │  └──────────────────┴──────────────────────────────┘     │
  │                                                          │
  │  RUN WITH TURBOPACK:                                      │
  │  next dev --turbopack                                     │
  │  → Tailwind classes compile correctly! ✅               │
  │  → PostCSS plugins work! ✅                             │
  │                                                          │
  └──────────────────────────────────────────────────────────┘
```

---

## §6. Tailwind v3 vs v4!

```
  V3 vs V4 — KEY DIFFERENCES:
  ┌──────────────────────────────────────────────────────────┐
  │                                                          │
  │  ┌──────────────────┬─────────────────┬────────────────┐ │
  │  │                  │ Tailwind v3     │ Tailwind v4    │ │
  │  ├──────────────────┼─────────────────┼────────────────┤ │
  │  │ Config file      │ tailwind.       │ CSS-based!     │ │
  │  │                  │ config.js       │ (@theme in CSS)│ │
  │  │ PostCSS needed   │ YES             │ Built-in!      │ │
  │  │ Autoprefixer     │ Separate pkg!   │ Built-in!      │ │
  │  │ Directives       │ @tailwind base  │ @import        │ │
  │  │                  │ /components/    │ "tailwindcss"  │ │
  │  │                  │ utilities       │                │ │
  │  │ Content paths    │ Manual config!  │ Auto-detect!   │ │
  │  │ Engine           │ JavaScript      │ Oxide (Rust!)  │ │
  │  │ Browser support  │ Broader! ✅    │ Modern only!   │ │
  │  │ Next.js guide    │ This page!      │ /getting-      │ │
  │  │                  │                 │ started/css    │ │
  │  └──────────────────┴─────────────────┴────────────────┘ │
  │                                                          │
  │  WHY STILL v3?                                            │
  │  → Broader browser support! (IE11, older Safari!)       │
  │  → Existing projects not ready to migrate!              │
  │  → Stable, well-tested! (mature ecosystem!)             │
  │                                                          │
  └──────────────────────────────────────────────────────────┘
```

---

## §7. Tự Viết — TailwindEngine!

```javascript
var TailwindEngine = (function () {
  // ═══════════════════════════════════
  // 1. UTILITY CLASS DATABASE
  // ═══════════════════════════════════
  var utilityMap = {
    // Spacing
    "p-0": "padding: 0;",
    "p-1": "padding: 0.25rem;",
    "p-2": "padding: 0.5rem;",
    "p-4": "padding: 1rem;",
    "p-8": "padding: 2rem;",
    "px-4": "padding-left: 1rem; padding-right: 1rem;",
    "py-2": "padding-top: 0.5rem; padding-bottom: 0.5rem;",
    "m-0": "margin: 0;",
    "m-2": "margin: 0.5rem;",
    "m-4": "margin: 1rem;",
    "mt-4": "margin-top: 1rem;",
    "mb-4": "margin-bottom: 1rem;",

    // Typography
    "text-sm": "font-size: 0.875rem; line-height: 1.25rem;",
    "text-lg": "font-size: 1.125rem; line-height: 1.75rem;",
    "text-xl": "font-size: 1.25rem; line-height: 1.75rem;",
    "text-3xl": "font-size: 1.875rem; line-height: 2.25rem;",
    "font-bold": "font-weight: 700;",
    "font-semibold": "font-weight: 600;",
    underline: "text-decoration-line: underline;",
    italic: "font-style: italic;",

    // Colors
    "bg-white": "background-color: #fff;",
    "bg-blue-500": "background-color: #3b82f6;",
    "bg-red-500": "background-color: #ef4444;",
    "text-white": "color: #fff;",
    "text-gray-700": "color: #374151;",

    // Layout
    flex: "display: flex;",
    grid: "display: grid;",
    block: "display: block;",
    hidden: "display: none;",
    "items-center": "align-items: center;",
    "justify-center": "justify-content: center;",

    // Borders
    rounded: "border-radius: 0.25rem;",
    "rounded-lg": "border-radius: 0.5rem;",
    "rounded-full": "border-radius: 9999px;",

    // Sizing
    "w-full": "width: 100%;",
    "h-screen": "height: 100vh;",

    // Effects
    "shadow-md": "box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);",
    "shadow-lg": "box-shadow: 0 10px 15px -3px rgba(0,0,0,0.1);",
  };

  // ═══════════════════════════════════
  // 2. CONTENT SCANNER (purge!)
  // ═══════════════════════════════════
  function scanContent(files) {
    var usedClasses = {};
    for (var i = 0; i < files.length; i++) {
      var content = files[i].content;
      // Extract className="..." values
      var matches = content.match(/className="([^"]+)"/g) || [];
      for (var j = 0; j < matches.length; j++) {
        var classes = matches[j]
          .replace('className="', "")
          .replace('"', "")
          .split(/\s+/);
        for (var k = 0; k < classes.length; k++) {
          if (classes[k]) usedClasses[classes[k]] = true;
        }
      }
    }
    return Object.keys(usedClasses);
  }

  // ═══════════════════════════════════
  // 3. CSS GENERATOR (only used!)
  // ═══════════════════════════════════
  function generateCSS(usedClasses) {
    var rules = [];
    var included = 0;
    var purged = 0;

    for (var cls in utilityMap) {
      if (usedClasses.indexOf(cls) !== -1) {
        rules.push("." + cls + " { " + utilityMap[cls] + " }");
        included++;
      } else {
        purged++;
      }
    }

    return {
      css: rules.join("\n"),
      stats: {
        total: included + purged,
        included: included,
        purged: purged,
        savings: Math.round((purged / (included + purged)) * 100) + "%",
      },
    };
  }

  // ═══════════════════════════════════
  // 4. RESPONSIVE PREFIX RESOLVER
  // ═══════════════════════════════════
  var breakpoints = {
    sm: "640px",
    md: "768px",
    lg: "1024px",
    xl: "1280px",
    "2xl": "1536px",
  };

  function resolveResponsive(cls) {
    var parts = cls.split(":");
    if (parts.length === 1) return { css: utilityMap[cls] || null };

    var prefix = parts[0];
    var utility = parts.slice(1).join(":");
    var bp = breakpoints[prefix];

    if (!bp) return { css: null, error: "Unknown breakpoint: " + prefix };

    return {
      breakpoint: prefix,
      minWidth: bp,
      utility: utility,
      css:
        "@media (min-width: " +
        bp +
        ") { ." +
        cls.replace(":", "\\:") +
        " { " +
        (utilityMap[utility] || utility) +
        " } }",
    };
  }

  // ═══════════════════════════════════
  // 5. DIRECTIVE SIMULATOR
  // ═══════════════════════════════════
  function processDirectives(cssInput) {
    var output = [];
    var lines = cssInput.split("\n");

    for (var i = 0; i < lines.length; i++) {
      var line = lines[i].trim();
      if (line === "@tailwind base;") {
        output.push("/* === BASE LAYER ===");
        output.push(" * CSS Reset: margin:0, box-sizing:border-box");
        output.push(" * Normalize: consistent cross-browser! */");
        output.push("*, *::before, *::after { box-sizing: border-box; }");
        output.push("body { margin: 0; line-height: 1.5; }");
      } else if (line === "@tailwind components;") {
        output.push("/* === COMPONENTS LAYER ===");
        output.push(" * Pre-built: .container, etc! */");
        output.push(".container { width: 100%; margin: 0 auto; }");
      } else if (line === "@tailwind utilities;") {
        output.push("/* === UTILITIES LAYER ===");
        output.push(" * ALL utility classes injected here!");
        output.push(" * (purged to only used ones!) */");
      } else {
        output.push(line);
      }
    }

    return output.join("\n");
  }

  // ═══════════════════════════════════
  // 6. DEMO
  // ═══════════════════════════════════
  function demo() {
    console.log("╔════════════════════════════════════╗");
    console.log("║  TAILWIND ENGINE DEMO               ║");
    console.log("╚════════════════════════════════════╝");

    // Scan content files
    console.log("\n── Content Scanning + Purge ──");
    var files = [
      {
        path: "app/page.tsx",
        content: '<h1 className="text-3xl font-bold underline">',
      },
      {
        path: "app/card.tsx",
        content: '<div className="p-4 bg-white rounded-lg shadow-md">',
      },
    ];
    var used = scanContent(files);
    console.log("  Used classes:", used);
    var result = generateCSS(used);
    console.log("  Generated CSS:\n" + result.css);
    console.log("  Stats:", result.stats);

    // Responsive
    console.log("\n── Responsive Prefixes ──");
    var responsive = ["sm:text-lg", "md:flex", "lg:grid", "xl:p-8"];
    for (var i = 0; i < responsive.length; i++) {
      console.log("  " + responsive[i] + ":", resolveResponsive(responsive[i]));
    }

    // Directives
    console.log("\n── Directive Processing ──");
    var input =
      "@tailwind base;\n@tailwind components;\n" + "@tailwind utilities;";
    console.log(processDirectives(input));
  }

  return { demo: demo };
})();
// Chạy: TailwindEngine.demo();
```

---

## §8. Câu Hỏi Luyện Tập!

**Câu 1**: 3 bước cài đặt Tailwind v3 trong Next.js?

<details><summary>Đáp án</summary>

```
Bước 1: Install packages
  pnpm add -D tailwindcss@^3 postcss autoprefixer
  npx tailwindcss init -p
  → Creates tailwind.config.js + postcss.config.js!

Bước 2: Configure content paths
  // tailwind.config.js
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ]
  → Tailwind scans these files for class names!

Bước 3: Add directives + import
  // globals.css
  @tailwind base;
  @tailwind components;
  @tailwind utilities;

  // app/layout.tsx
  import './globals.css'
  → Apply globally to all routes!
```

</details>

---

**Câu 2**: `content` array trong tailwind.config.js — tại sao quan trọng?

<details><summary>Đáp án</summary>

**Purpose**: Tailwind **SCANS** these file paths để tìm class names đang được dùng!

```
content: [
  './app/**/*.{js,ts,jsx,tsx,mdx}',     → Tất cả files trong app/
  './pages/**/*.{js,ts,jsx,tsx,mdx}',    → Pages Router (nếu có)
  './components/**/*.{js,ts,jsx,tsx,mdx}' → Shared components
]
```

**Tại sao quan trọng?**

1. ✅ **Purging**: Chỉ classes THẬT SỰ DÙNG → included in output CSS!
2. ✅ **Tiny bundle**: Unused classes removed → CSS file rất nhỏ!
3. ❌ **Missing path?** → Classes từ folder đó bị PURGE → styles mất!

**Example**: Nếu quên `./components/**/*` → component styles KHÔNG work!

</details>

---

**Câu 3**: 3 `@tailwind` directives — inject gì?

<details><summary>Đáp án</summary>

| Directive              | Layer      | What it injects                                                              |
| ---------------------- | ---------- | ---------------------------------------------------------------------------- |
| `@tailwind base`       | Base       | CSS reset + normalize! (margin:0, box-sizing, consistent cross-browser!)     |
| `@tailwind components` | Components | Pre-built classes (container, prose, etc.) + custom `@layer components {}`   |
| `@tailwind utilities`  | Utilities  | ALL utility classes! (p-4, flex, bg-blue-500...) Only used ones after purge! |

**Order matters!** base → components → utilities (specificity tăng dần!)

</details>

---

**Câu 4**: Tailwind v3 vs v4 — 3 khác biệt chính?

<details><summary>Đáp án</summary>

| Aspect            | v3                                     | v4                                |
| ----------------- | -------------------------------------- | --------------------------------- |
| **Config**        | JavaScript file (`tailwind.config.js`) | CSS-based (`@theme` in CSS!)      |
| **PostCSS**       | Separate dependency needed             | Built-in! No extra install!       |
| **Content paths** | Manual config in `content: [...]`      | Auto-detection! No config needed! |

**Bonus**: v4 dùng **Oxide engine** (Rust) → nhanh hơn! Nhưng v3 có **broader browser support** (IE11, older Safari) → dùng v3 khi cần compat!

</details>
