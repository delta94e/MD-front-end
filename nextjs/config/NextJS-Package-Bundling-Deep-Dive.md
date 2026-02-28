# Next.js Package Bundling — Deep Dive!

> **Chủ đề**: Phân Tích Và Tối Ưu Bundle Size!
> **Ngôn ngữ**: Tiếng Việt — giải thích cực kỳ chi tiết!
> **Phương châm**: Tự viết lại bằng tay — KHÔNG dùng thư viện!
> **Nguồn**: https://nextjs.org/docs/app/guides/package-bundling
> **Sơ đồ gốc**: 1 diagram (Bundle Analyzer import chain treemap) — phân tích chi tiết bên dưới!

---

## Mục Lục

1. [§1. Tổng Quan — Bundling Là Gì?](#1)
2. [§2. Turbopack Bundle Analyzer (Experimental!)](#2)
3. [§3. Phân Tích Sơ Đồ Gốc — Import Chain Treemap!](#3)
4. [§4. @next/bundle-analyzer (Webpack)](#4)
5. [§5. Tối Ưu — 3 Strategies!](#5)
6. [§6. Tự Viết — BundleAnalyzerEngine!](#6)
7. [§7. Câu Hỏi Luyện Tập](#7)

---

## §1. Tổng Quan — Bundling Là Gì?

```
  BUNDLING OVERVIEW:
  ┌────────────────────────────────────────────────────────────┐
  │                                                            │
  │  BUNDLING = Gom code + dependencies → output tối ưu!     │
  │                                                            │
  │  SOURCE CODE:                    BUNDLED OUTPUT:            │
  │  ┌────────────────┐             ┌────────────────┐         │
  │  │ page.tsx       │             │ client-abc.js  │         │
  │  │ utils.ts       │  Bundler   │ (150KB)         │         │
  │  │ component.tsx  │ ═════════► │                 │         │
  │  │ node_modules/  │             │ server-def.js  │         │
  │  │  ├── react     │             │ (80KB)          │         │
  │  │  ├── lodash    │             │                 │         │
  │  │  └── moment    │             │ chunk-ghi.js   │         │
  │  └────────────────┘             │ (50KB)          │         │
  │  (hàng trăm files!)            └────────────────┘         │
  │                                 (vài files tối ưu!)       │
  │                                                            │
  │  NEXT.JS TỰ ĐỘNG TỐI ƯU:                                │
  │  ┌──────────────────────────────────────────────────────┐  │
  │  │ ✅ Code Splitting: Tách bundle per route!           │  │
  │  │ ✅ Tree Shaking: Loại bỏ code không dùng!         │  │
  │  │ ✅ Minification: Nén JS/CSS!                        │  │
  │  │ ✅ Dead Code Elimination: Xóa code chết!           │  │
  │  └──────────────────────────────────────────────────────┘  │
  │                                                            │
  │  NHƯNG đôi khi cần TỰ TỐI ƯU:                           │
  │  → Large dependencies (moment.js = 300KB!)                │
  │  → Icon libraries (import ALL 5000 icons!)                │
  │  → Heavy client rendering (syntax highlight trên client!) │
  │                                                            │
  │  2 ANALYZERS:                                              │
  │  ┌──────────────────┬──────────────────────────────────┐   │
  │  │ Tool             │ Bundler                          │   │
  │  ├──────────────────┼──────────────────────────────────┤   │
  │  │ Next.js Bundle   │ Turbopack (experimental, v16.1+) │   │
  │  │ Analyzer         │                                  │   │
  │  │ @next/bundle-    │ Webpack (stable!)                │   │
  │  │ analyzer         │                                  │   │
  │  └──────────────────┴──────────────────────────────────┘   │
  │                                                            │
  └────────────────────────────────────────────────────────────┘
```

```
  TẠI SAO BUNDLE SIZE QUAN TRỌNG?
  ┌──────────────────────────────────────────────────────────┐
  │                                                          │
  │  Bundle nhỏ hơn → :                                    │
  │  ① Load nhanh hơn (download ít JS!)                   │
  │  ② JS execution time giảm (parse + compile ít hơn!)  │
  │  ③ Core Web Vitals tốt hơn (LCP, FID, CLS!)          │
  │  ④ Server cold start nhanh hơn (serverless!)          │
  │  ⑤ SEO ranking tốt hơn (Google PageSpeed!)            │
  │                                                          │
  │  IMPACT:                                                  │
  │  ┌────────────────┬──────────┬────────────┐               │
  │  │ Bundle Size    │ Download │ Parse Time │               │
  │  ├────────────────┼──────────┼────────────┤               │
  │  │ 100KB          │ 0.3s    │ 50ms       │               │
  │  │ 500KB          │ 1.5s    │ 250ms      │               │
  │  │ 1MB            │ 3s      │ 500ms      │               │
  │  │ 5MB 😱        │ 15s     │ 2500ms     │               │
  │  └────────────────┴──────────┴────────────┘               │
  │  (3G network estimate!)                                   │
  │                                                          │
  └──────────────────────────────────────────────────────────┘
```

---

## §2. Turbopack Bundle Analyzer (Experimental!)

```
  TURBOPACK BUNDLE ANALYZER:
  ┌────────────────────────────────────────────────────────────┐
  │                                                            │
  │  Available: v16.1+ (Experimental!)                         │
  │  Bundler: Turbopack!                                       │
  │  Feature: Precise import tracing (module graph!)           │
  │                                                            │
  │  4 STEPS:                                                  │
  │  ┌──────────────────────────────────────────────────────┐  │
  │  │                                                      │  │
  │  │  STEP 1: Run Analyzer!                               │  │
  │  │  ┌──────────────────────────────────────────────┐    │  │
  │  │  │ pnpm next experimental-analyze               │    │  │
  │  │  └──────────────────────────────────────────────┘    │  │
  │  │  → Mở interactive view trong browser!              │  │
  │  │                                                      │  │
  │  │  STEP 2: Filter + Inspect Modules!                   │  │
  │  │  ┌──────────────────────────────────────────────┐    │  │
  │  │  │ Filter by:                                    │    │  │
  │  │  │  → Route (per page!)                         │    │  │
  │  │  │  → Environment (client or server!)           │    │  │
  │  │  │  → Type (JS, CSS, JSON!)                     │    │  │
  │  │  │  → Search by filename!                       │    │  │
  │  │  └──────────────────────────────────────────────┘    │  │
  │  │                                                      │  │
  │  │  STEP 3: Trace Import Chains!                        │  │
  │  │  ┌──────────────────────────────────────────────┐    │  │
  │  │  │ Treemap: mỗi module = 1 rectangle!          │    │  │
  │  │  │ Kích thước rectangle = size module!          │    │  │
  │  │  │ Click module → xem:                         │    │  │
  │  │  │   → Size (compressed + uncompressed)         │    │  │
  │  │  │   → Full import chain!                       │    │  │
  │  │  │   → Chính xác file nào import nó!           │    │  │
  │  │  └──────────────────────────────────────────────┘    │  │
  │  │                                                      │  │
  │  │  STEP 4: Output to Disk!                             │  │
  │  │  ┌──────────────────────────────────────────────┐    │  │
  │  │  │ pnpm next experimental-analyze --output      │    │  │
  │  │  │                                              │    │  │
  │  │  │ Output: .next/diagnostics/analyze            │    │  │
  │  │  │                                              │    │  │
  │  │  │ Diffing:                                     │    │  │
  │  │  │ cp -r .next/diagnostics/analyze              │    │  │
  │  │  │   ./analyze-before-refactor                  │    │  │
  │  │  │                                              │    │  │
  │  │  │ → So sánh before/after optimization!        │    │  │
  │  │  │ → Share với teammates!                      │    │  │
  │  │  └──────────────────────────────────────────────┘    │  │
  │  │                                                      │  │
  │  └──────────────────────────────────────────────────────┘  │
  │                                                            │
  └────────────────────────────────────────────────────────────┘
```

---

## §3. Phân Tích Sơ Đồ Gốc — Import Chain Treemap!

**Sơ đồ gốc** (1 diagram duy nhất trên trang — "Next.js Bundle Analyzer import chain view"):

```
  ┌ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ┐
  │                                                                       │
  │  SƠ ĐỒ: BUNDLE ANALYZER — IMPORT CHAIN VIEW                         │
  │                                                                       │
  │  ┌───────────────────────────────────────────────────────────────┐     │
  │  │  ChevronLeftIcon.js                                          │     │
  │  │  119 KB uncompressed ⓘ                                      │     │
  │  │  (root: 8338 compressed)                                     │     │
  │  │                                                              │     │
  │  │  Import Chain:              Current route only ☑            │     │
  │  │  ┌─────────────────────────────────────────────────────┐     │     │
  │  │  │                                                     │     │     │
  │  │  │  [client]/[project]/src/app/providers.tsx            │     │     │
  │  │  │    ↓ import                                         │     │     │
  │  │  │  @heroicons/react/20/solid/esm/                     │     │     │
  │  │  │  ChevronLeftIcon.js                                 │     │     │
  │  │  │  (export default as ChevronLeftIcon)                 │     │     │
  │  │  │    ↓ import                                         │     │     │
  │  │  │  [context]/css/cmp/css-transitions/.cl/              │     │     │
  │  │  │  transitions.tsx                                     │     │     │
  │  │  │    ↓ import (T → U →)                              │     │     │
  │  │  │  [context]/css/cmp/css-transitions/.cl/              │     │     │
  │  │  │  transitions.tsx                                     │     │     │
  │  │  │    ↓ import                                         │     │     │
  │  │  │  [context]/use-cmo-transitions/                      │     │     │
  │  │  │  posts/[id]/page.tsx                                 │     │     │
  │  │  │    ↓ import                                         │     │     │
  │  │  │  [context]/use-cmo-transitions/                      │     │     │
  │  │  │  posts/[id]/page.tsx                                 │     │     │
  │  │  │                                                     │     │     │
  │  │  └─────────────────────────────────────────────────────┘     │     │
  │  │                                                              │     │
  │  │  Output Chunks:                                              │     │
  │  │  [client-fe]/.next/static/chunks/zdd1ace0E0...              │     │
  │  │  main.js                                                     │     │
  │  │  [server]/.next/server/chunks/ssr/app_view-ts               │     │
  │  │  ansi1ome__ct_transitions_tsx_6OE18ece2D...js               │     │
  │  └───────────────────────────────────────────────────────────────┘     │
  │                                                                       │
  └ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ┘
```

```
  PHÂN TÍCH SƠ ĐỒ:
  ┌────────────────────────────────────────────────────────────┐
  │                                                            │
  │  Diagram cho thấy KHI CLICK vào 1 module trong treemap:  │
  │                                                            │
  │  ① MODULE INFO:                                           │
  │  → Tên: ChevronLeftIcon.js (từ @heroicons/react!)       │
  │  → Size: 119 KB uncompressed, 8338 bytes compressed       │
  │  → Đây là 1 ICON component — tại sao 119KB?? 😱       │
  │                                                            │
  │  ② IMPORT CHAIN (truy vết ngược!):                       │
  │  providers.tsx                                             │
  │    ↓ import ChevronLeftIcon                               │
  │  ChevronLeftIcon.js (@heroicons/react/20/solid/esm/)       │
  │    ↓ re-exported                                          │
  │  css-transitions/transitions.tsx                           │
  │    ↓ import                                               │
  │  posts/[id]/page.tsx  ← PAGE cuối cùng dùng nó!        │
  │                                                            │
  │  → Cho biết CHÍNH XÁC tại sao module nằm trong bundle! │
  │  → Biết file nào import → biết nơi cần optimize!       │
  │                                                            │
  │  ③ OUTPUT CHUNKS:                                         │
  │  → Client chunk: .next/static/chunks/...main.js           │
  │  → Server chunk: .next/server/chunks/ssr/...js             │
  │  → Module xuất hiện ở CẢ client lẫn server!            │
  │                                                            │
  │  ④ "Current route only" checkbox:                         │
  │  → Checked: chỉ hiện modules cho route hiện tại!       │
  │  → Unchecked: hiện tất cả modules cross-route!          │
  │                                                            │
  │  ⑤ ACTIONABLE INSIGHT:                                    │
  │  → 119KB cho 1 icon = QUÁ LỚN!                          │
  │  → Fix: dùng optimizePackageImports: ['@heroicons/react']│
  │  → Hoặc: import trực tiếp file icon cần thiết!        │
  │                                                            │
  └────────────────────────────────────────────────────────────┘
```

---

## §4. @next/bundle-analyzer (Webpack!)

```
  @next/bundle-analyzer:
  ┌──────────────────────────────────────────────────────────┐
  │                                                          │
  │  Bundler: Webpack (stable!)                               │
  │  Output: 3 browser tabs (client, server, edge!)          │
  │  Visual: Treemap (webpack-bundle-analyzer!)              │
  │                                                          │
  │  STEP 1: Install                                          │
  │  pnpm add @next/bundle-analyzer                          │
  │                                                          │
  │  STEP 2: Config (next.config.js)                          │
  │  ┌──────────────────────────────────────────────────┐    │
  │  │ const withBundleAnalyzer =                       │    │
  │  │   require('@next/bundle-analyzer')({             │    │
  │  │     enabled: process.env.ANALYZE === 'true',     │    │
  │  │   })                                             │    │
  │  │                                                  │    │
  │  │ /** @type {import('next').NextConfig} */          │    │
  │  │ const nextConfig = {}                            │    │
  │  │                                                  │    │
  │  │ module.exports = withBundleAnalyzer(nextConfig)   │    │
  │  └──────────────────────────────────────────────────┘    │
  │                                                          │
  │  STEP 3: Generate Report                                  │
  │  ┌──────────────────────────────────────────────────┐    │
  │  │ ANALYZE=true pnpm build                          │    │
  │  └──────────────────────────────────────────────────┘    │
  │  → Mở 3 tabs: client, server, edge bundles!            │
  │  → Treemap visualization: rectangles = modules          │
  │  → Size = area of rectangle!                            │
  │                                                          │
  └──────────────────────────────────────────────────────────┘
```

```
  TURBOPACK vs WEBPACK ANALYZER:
  ┌──────────────────────────────────────────────────────────┐
  │                                                          │
  │  ┌────────────────────┬──────────────┬────────────────┐  │
  │  │                    │ Turbopack    │ Webpack        │  │
  │  ├────────────────────┼──────────────┼────────────────┤  │
  │  │ Status             │ Experimental │ Stable!        │  │
  │  │ Min version        │ v16.1+       │ Any            │  │
  │  │ Command            │ next         │ ANALYZE=true   │  │
  │  │                    │ experimental-│ pnpm build     │  │
  │  │                    │ analyze      │                │  │
  │  │ Install            │ Nothing!     │ @next/bundle-  │  │
  │  │                    │ (built-in!)  │ analyzer       │  │
  │  │ Import chains      │ ✅ Yes!     │ ❌ No         │  │
  │  │ Filter by route    │ ✅ Yes!     │ ❌ No         │  │
  │  │ Filter by env      │ ✅ Yes!     │ ✅ Yes (tabs) │  │
  │  │ Output to disk     │ ✅ --output │ ❌ No         │  │
  │  │ Diffing support    │ ✅ Yes!     │ ❌ No         │  │
  │  │ Interactive        │ ✅ Browser  │ ✅ Browser    │  │
  │  └────────────────────┴──────────────┴────────────────┘  │
  │                                                          │
  └──────────────────────────────────────────────────────────┘
```

---

## §5. Tối Ưu — 3 Strategies!

```
  STRATEGY 1: optimizePackageImports!
  ┌──────────────────────────────────────────────────────────┐
  │                                                          │
  │  VẤN ĐỀ: Icon/utility libraries export HÀNG TRĂM!     │
  │                                                          │
  │  import { Calendar } from 'lucide-react'                 │
  │  // → Bundler import TẤT CẢ 1500+ icons! 😱           │
  │  // → 500KB+ cho 1 icon! 💥                            │
  │                                                          │
  │  FIX: optimizePackageImports!                            │
  │  ┌──────────────────────────────────────────────────┐    │
  │  │ // next.config.js                                │    │
  │  │ const nextConfig = {                             │    │
  │  │   experimental: {                                │    │
  │  │     optimizePackageImports: [                    │    │
  │  │       'lucide-react',                            │    │
  │  │       '@heroicons/react',                        │    │
  │  │       'lodash',                                  │    │
  │  │       'date-fns',                                │    │
  │  │     ],                                           │    │
  │  │   },                                             │    │
  │  │ }                                                │    │
  │  └──────────────────────────────────────────────────┘    │
  │                                                          │
  │  HIỆU QUẢ:                                              │
  │  TRƯỚC: import { Calendar } from 'lucide-react'         │
  │  → Resolve TẤT CẢ exports → 500KB!                   │
  │                                                          │
  │  SAU: import { Calendar } from 'lucide-react'            │
  │  → Chỉ resolve Calendar icon → 5KB! 🎉               │
  │                                                          │
  │  ⚡ Next.js tự động optimize một số libraries:         │
  │  → lucide-react, @heroicons/react, date-fns, lodash,   │
  │    @mui/material, @mui/icons-material, rxjs, v.v.       │
  │  → Không cần thêm vào list!                            │
  │                                                          │
  └──────────────────────────────────────────────────────────┘
```

```
  STRATEGY 2: Move Heavy Work → Server Component!
  ┌──────────────────────────────────────────────────────────┐
  │                                                          │
  │  VẤN ĐỀ: Expensive rendering trên Client!              │
  │  → Syntax highlighting libraries                        │
  │  → Chart rendering (Chart.js, D3...)                    │
  │  → Markdown parsing                                     │
  │  → Kết quả cuối chỉ là static HTML → WHY CLIENT?   │
  │                                                          │
  │  ❌ TRƯỚC (Client Component — lãng phí!):              │
  │  ┌──────────────────────────────────────────────────┐    │
  │  │ 'use client'                                     │    │
  │  │ import Highlight from 'prism-react-renderer'     │    │
  │  │ // → prism library (200KB) → CLIENT BUNDLE! 💥 │    │
  │  │                                                  │    │
  │  │ export default function Page() {                 │    │
  │  │   return <Highlight code={code} ... />           │    │
  │  │   // Client download 200KB prism → parse        │    │
  │  │   // → execute → render <code> block           │    │
  │  │ }                                                │    │
  │  └──────────────────────────────────────────────────┘    │
  │                                                          │
  │  ✅ SAU (Server Component — tối ưu!):                  │
  │  ┌──────────────────────────────────────────────────┐    │
  │  │ import { codeToHtml } from 'shiki'               │    │
  │  │ // → shiki chạy trên SERVER, KHÔNG bundle!     │    │
  │  │                                                  │    │
  │  │ export default async function Page() {           │    │
  │  │   const html = await codeToHtml(code, {          │    │
  │  │     lang: 'tsx', theme: 'github-dark',           │    │
  │  │   })                                             │    │
  │  │   return (                                       │    │
  │  │     <code dangerouslySetInnerHTML={{              │    │
  │  │       __html: html                               │    │
  │  │     }} />                                        │    │
  │  │   )                                              │    │
  │  │   // Client nhận: plain HTML markup!            │    │
  │  │   // → 0KB JS cho syntax highlighting! 🎉      │    │
  │  │ }                                                │    │
  │  └──────────────────────────────────────────────────┘    │
  │                                                          │
  │  RULE: Nếu work KHÔNG cần:                             │
  │  → Browser APIs (window, document...)                   │
  │  → User interaction (onClick, onChange...)               │
  │  → CHUYỂN sang Server Component!                       │
  │                                                          │
  └──────────────────────────────────────────────────────────┘
```

```
  STRATEGY 3: serverExternalPackages!
  ┌──────────────────────────────────────────────────────────┐
  │                                                          │
  │  VẤN ĐỀ: Next.js TỰ ĐỘNG bundle packages import      │
  │  trong Server Components + Route Handlers!               │
  │                                                          │
  │  Nhưng một số packages KHÔNG NÊN bundle:               │
  │  → Native modules (sharp, canvas)                       │
  │  → Very large packages (puppeteer)                      │
  │  → Packages với side effects (prisma)                   │
  │                                                          │
  │  FIX: serverExternalPackages!                            │
  │  ┌──────────────────────────────────────────────────┐    │
  │  │ // next.config.js                                │    │
  │  │ const nextConfig = {                             │    │
  │  │   serverExternalPackages: [                      │    │
  │  │     'sharp',                                     │    │
  │  │     'puppeteer',                                 │    │
  │  │     '@prisma/client',                            │    │
  │  │   ],                                             │    │
  │  │ }                                                │    │
  │  └──────────────────────────────────────────────────┘    │
  │                                                          │
  │  HIỆU QUẢ:                                              │
  │  → Package KHÔNG được gom vào bundle!                  │
  │  → Require/import tại runtime từ node_modules!        │
  │  → Giảm server bundle size!                            │
  │  → Tránh bundling issues với native code!              │
  │                                                          │
  └──────────────────────────────────────────────────────────┘
```

---

## §6. Tự Viết — BundleAnalyzerEngine!

```javascript
var BundleAnalyzerEngine = (function () {
  // ═══════════════════════════════════
  // 1. MODULE REGISTRY
  // ═══════════════════════════════════
  var modules = {};

  function addModule(path, config) {
    modules[path] = {
      path: path,
      size: config.size || 0,
      compressed: config.compressed || 0,
      type: config.type || "js",
      env: config.env || "client",
      imports: config.imports || [],
    };
  }

  // ═══════════════════════════════════
  // 2. IMPORT CHAIN TRACER
  // ═══════════════════════════════════
  function traceImportChain(modulePath) {
    var chain = [];
    var visited = {};

    function traverse(path) {
      if (visited[path]) return;
      visited[path] = true;
      chain.push(path);

      // Find who imports this module
      for (var key in modules) {
        var mod = modules[key];
        for (var i = 0; i < mod.imports.length; i++) {
          if (mod.imports[i] === path) {
            traverse(key);
          }
        }
      }
    }

    traverse(modulePath);
    return chain;
  }

  // ═══════════════════════════════════
  // 3. TREEMAP GENERATOR
  // ═══════════════════════════════════
  function generateTreemap(filter) {
    var filtered = [];
    for (var key in modules) {
      var mod = modules[key];
      if (filter && filter.env && mod.env !== filter.env) continue;
      if (filter && filter.type && mod.type !== filter.type) continue;
      if (filter && filter.search && key.indexOf(filter.search) === -1)
        continue;
      filtered.push(mod);
    }

    // Sort by size descending
    filtered.sort(function (a, b) {
      return b.size - a.size;
    });

    // Generate ASCII treemap
    var total = 0;
    for (var j = 0; j < filtered.length; j++) {
      total += filtered[j].size;
    }

    var result = [];
    for (var k = 0; k < filtered.length; k++) {
      var m = filtered[k];
      var pct = Math.round((m.size / total) * 100);
      var bar = "";
      for (var b = 0; b < Math.min(pct, 50); b++) bar += "█";
      result.push({
        path: m.path,
        size: m.size,
        compressed: m.compressed,
        percent: pct,
        bar: bar,
      });
    }
    return result;
  }

  // ═══════════════════════════════════
  // 4. optimizePackageImports SIMULATOR
  // ═══════════════════════════════════
  function simulateOptimize(packageName, usedExports) {
    var beforeSize = 0;
    var afterSize = 0;
    var removed = 0;

    for (var key in modules) {
      if (key.indexOf(packageName) > -1) {
        beforeSize += modules[key].size;
        var isUsed = false;
        for (var i = 0; i < usedExports.length; i++) {
          if (key.indexOf(usedExports[i]) > -1) {
            isUsed = true;
            break;
          }
        }
        if (isUsed) {
          afterSize += modules[key].size;
        } else {
          removed++;
        }
      }
    }

    return {
      package: packageName,
      before: beforeSize,
      after: afterSize,
      saved: beforeSize - afterSize,
      removedModules: removed,
    };
  }

  // ═══════════════════════════════════
  // 5. DEMO
  // ═══════════════════════════════════
  function demo() {
    console.log("╔════════════════════════════════════╗");
    console.log("║  BUNDLE ANALYZER ENGINE DEMO        ║");
    console.log("╚════════════════════════════════════╝");

    // Register modules
    addModule("app/page.tsx", {
      size: 5,
      compressed: 2,
      env: "client",
      imports: ["components/Header.tsx", "lucide-react/Calendar"],
    });
    addModule("components/Header.tsx", {
      size: 3,
      compressed: 1,
      env: "client",
      imports: ["lucide-react/Menu", "lucide-react/X"],
    });
    addModule("lucide-react/Calendar", {
      size: 8,
      compressed: 3,
      env: "client",
      imports: [],
    });
    addModule("lucide-react/Menu", {
      size: 6,
      compressed: 2,
      env: "client",
      imports: [],
    });
    addModule("lucide-react/X", {
      size: 5,
      compressed: 2,
      env: "client",
      imports: [],
    });
    addModule("lucide-react/Heart", {
      size: 7,
      compressed: 3,
      env: "client",
      imports: [],
    });
    addModule("lucide-react/Star", {
      size: 6,
      compressed: 2,
      env: "client",
      imports: [],
    });
    addModule("lucide-react/Home", {
      size: 8,
      compressed: 3,
      env: "client",
      imports: [],
    });
    addModule("prism-react-renderer", {
      size: 200,
      compressed: 80,
      env: "client",
      imports: [],
    });
    addModule("api/route.ts", {
      size: 10,
      compressed: 4,
      env: "server",
      imports: [],
    });

    // Treemap
    console.log("\n── Bundle Treemap (client) ──");
    var treemap = generateTreemap({ env: "client" });
    for (var i = 0; i < treemap.length; i++) {
      var t = treemap[i];
      console.log(
        "  " + t.bar + " " + t.percent + "% " + t.path + " (" + t.size + "KB)",
      );
    }

    // Import chain
    console.log("\n── Import Chain: Calendar ──");
    var chain = traceImportChain("lucide-react/Calendar");
    for (var j = 0; j < chain.length; j++) {
      console.log("  " + "  ".repeat(j) + "↓ " + chain[j]);
    }

    // Optimize simulation
    console.log("\n── optimizePackageImports ──");
    var opt = simulateOptimize("lucide-react", ["Calendar", "Menu", "X"]);
    console.log("  Package: " + opt.package);
    console.log("  Before: " + opt.before + "KB");
    console.log("  After: " + opt.after + "KB");
    console.log(
      "  Saved: " +
        opt.saved +
        "KB (" +
        opt.removedModules +
        " modules removed!)",
    );
  }

  return { demo: demo };
})();
// Chạy: BundleAnalyzerEngine.demo();
```

---

## §7. Câu Hỏi Luyện Tập!

**Câu 1**: 2 Bundle Analyzers — Turbopack vs Webpack — so sánh?

<details><summary>Đáp án</summary>

|                     | Turbopack Analyzer                          | Webpack Analyzer                          |
| ------------------- | ------------------------------------------- | ----------------------------------------- |
| Status              | **Experimental** (v16.1+)                   | **Stable**                                |
| Command             | `pnpm next experimental-analyze`            | `ANALYZE=true pnpm build`                 |
| Install             | Nothing (built-in!)                         | `pnpm add @next/bundle-analyzer` + config |
| **Import chains**   | ✅ Click module → xem ai import!            | ❌ Chỉ thấy sizes                         |
| **Filter by route** | ✅ Per-route analysis!                      | ❌ All routes together                    |
| **Output to disk**  | ✅ `--output` → `.next/diagnostics/analyze` | ❌                                        |
| **Diffing**         | ✅ So sánh before/after!                    | ❌                                        |

**Recommendation**: Dùng Turbopack Analyzer nếu v16.1+! Import chain tracing là killer feature.

</details>

---

**Câu 2**: Phân tích sơ đồ import chain trong docs — insight gì?

<details><summary>Đáp án</summary>

Sơ đồ cho thấy **ChevronLeftIcon.js** (119KB uncompressed!) với import chain:

```
providers.tsx
  ↓ import ChevronLeftIcon
@heroicons/react/20/solid/esm/ChevronLeftIcon.js
  ↓ re-export
css-transitions/transitions.tsx
  ↓ import
posts/[id]/page.tsx (page cuối cùng!)
```

**Insights**:

1. **119KB cho 1 icon = quá lớn!** → Cần `optimizePackageImports: ['@heroicons/react']`
2. **Import chain** cho biết CHÍNH XÁC ai import → biết nơi cần optimize
3. **Output Chunks** cho thấy module xuất hiện ở cả client + server bundles
4. **"Current route only"** checkbox giúp phân tích per-page

</details>

---

**Câu 3**: 3 optimization strategies — giải thích và khi nào dùng?

<details><summary>Đáp án</summary>

| Strategy                     | Khi nào dùng                                                                                                        | Config                                              |
| ---------------------------- | ------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------- |
| **optimizePackageImports**   | Libraries export hàng trăm modules (icons, utils) → chỉ bundle modules thực sự dùng!                                | `experimental: { optimizePackageImports: ['pkg'] }` |
| **Move to Server Component** | Heavy rendering không cần browser APIs (syntax highlight, markdown, charts) → render trên server, client nhận HTML! | Bỏ `'use client'`, dùng async Server Component      |
| **serverExternalPackages**   | Server-side packages với native modules hoặc quá lớn (sharp, puppeteer, prisma) → không bundle, require at runtime! | `serverExternalPackages: ['pkg']`                   |

**Key rule**: Nếu tạo static output mà KHÔNG cần user interaction → Server Component! Client bundle = 0KB cho logic đó.

</details>

---

**Câu 4**: optimizePackageImports hoạt động thế nào bên trong?

<details><summary>Đáp án</summary>

**Cách hoạt động**:

```javascript
// TRƯỚC optimize:
import { Calendar } from "lucide-react";
// Bundler: tìm lucide-react/index.js
//   → index.js export TẤT CẢ 1500+ icons
//   → Tree-shaking CÓ THỂ không hoàn hảo
//   → Kết quả: 500KB+ trong bundle! 😱

// SAU optimizePackageImports:
import { Calendar } from "lucide-react";
// Next.js TRANSFORM thành:
import Calendar from "lucide-react/dist/esm/icons/Calendar";
// → Chỉ import ĐÚNG 1 file icon!
// → Kết quả: 5KB! 🎉
```

**Bên trong**: Next.js dùng SWC plugin để **rewrite imports** at build time:

- `import { X } from 'pkg'` → `import X from 'pkg/dist/X'`
- Bypass barrel file (`index.js` re-exports tất cả)
- Direct import → chỉ resolve 1 module!

**Auto-optimized packages** (không cần config): `lucide-react`, `@heroicons/react`, `date-fns`, `lodash`, `@mui/material`, `rxjs`, v.v.

</details>
