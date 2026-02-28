# Webpack Optimization — Tối Ưu Webpack Deep Dive

> 📅 2026-02-11 · ⏱ 20 phút đọc
>
> Tài liệu chuyên sâu về Webpack Optimization:
> Tăng tốc build (Loader, HappyPack, DllPlugin, Code Compression),
> giảm bundle size (Code Splitting, Scope Hoisting, Tree Shaking),
> tối ưu frontend performance (CDN, SplitChunks, externals),
> và tổng hợp các strategies.
> Độ khó: ⭐️⭐️⭐️⭐️⭐️ | Chủ đề: Build Tools & Performance

---

## Mục Lục

0. [Tổng quan Webpack Optimization](#0-tổng-quan-webpack-optimization)
1. [Tăng tốc Build Speed](#1-tăng-tốc-build-speed)
2. [Giảm Bundle Size](#2-giảm-bundle-size)
3. [Tối ưu Frontend Performance](#3-tối-ưu-frontend-performance)
4. [Tổng hợp Strategies](#4-tổng-hợp-strategies)
5. [Tóm Tắt & Câu Hỏi Phỏng Vấn](#5-tóm-tắt--câu-hỏi-phỏng-vấn)

---

## 0. Tổng quan Webpack Optimization

> **🎯 3 trục tối ưu: Build Speed ↑ + Bundle Size ↓ + Runtime Performance ↑**

```
WEBPACK OPTIMIZATION — 3 TRỤC:
═══════════════════════════════════════════════════════════════

  ┌──────────────────────────────────────────────────────────┐
  │ ① BUILD SPEED ↑ (Developer Experience)                  │
  │ → Tăng tốc compilation / bundling                       │
  │ → Optimze Loader, HappyPack, DllPlugin, Compression    │
  │ → Ảnh hưởng THỜI GIAN DEV                              │
  ├──────────────────────────────────────────────────────────┤
  │ ② BUNDLE SIZE ↓ (Network)                               │
  │ → Giảm kích thước output files                          │
  │ → Code Splitting, Tree Shaking, Scope Hoisting          │
  │ → Ảnh hưởng DOWNLOAD TIME                              │
  ├──────────────────────────────────────────────────────────┤
  │ ③ RUNTIME PERFORMANCE ↑ (User Experience)               │
  │ → Tối ưu code chạy trên browser                        │
  │ → CDN, Caching, On-demand Loading                       │
  │ → Ảnh hưởng USER EXPERIENCE                            │
  └──────────────────────────────────────────────────────────┘
```

---

## 1. Tăng tốc Build Speed

### (1) Optimize Loader

> **🎯 Babel = bottleneck lớn nhất → giới hạn scope + cache**

```
VẤN ĐỀ VỚI BABEL:
═══════════════════════════════════════════════════════════════

  Babel converts code → AST → transform → generate code
  → Project CÀNG LỚN → code CÀNG NHIỀU → CÀNG CHẬM

  2 GIẢI PHÁP:
  ① Giới hạn PHẠM VI tìm kiếm (include/exclude)
  ② CACHE kết quả compile (cacheDirectory)
```

```javascript
// ===== ① Giới hạn phạm vi Loader =====
module.exports = {
  module: {
    rules: [
      {
        test: /\.js$/, // Chỉ xử lý .js files
        loader: "babel-loader",
        include: [resolve("src")], // CHỈ trong src/
        exclude: /node_modules/, // BỎ QUA node_modules
        // node_modules ĐÃ COMPILED → không cần xử lý lại
      },
    ],
  },
};
```

```javascript
// ===== ② Cache Babel compilation =====
module.exports = {
  module: {
    rules: [
      {
        test: /\.js$/,
        // cacheDirectory=true → cache compiled files
        // Lần sau CHỈ compile files ĐÃ THAY ĐỔI
        loader: "babel-loader?cacheDirectory=true",
        include: [resolve("src")],
        exclude: /node_modules/,
      },
    ],
  },
};
```

```
HIỆU QUẢ:
  include + exclude → giảm SỐ FILE cần xử lý
  cacheDirectory    → giảm SỐ LẦN compile lặp lại
  → Build speed TĂNG ĐÁNG KỂ ✅
```

### (2) HappyPack — Parallel Loader Execution

> **🎯 Node single-thread → HappyPack biến Loader thành PARALLEL**

```
VẤN ĐỀ:
═══════════════════════════════════════════════════════════════

  Node chạy SINGLE THREAD
  → Webpack bundling cũng SINGLE THREAD
  → Loader execute TUẦN TỰ (synchronous)
  → Nhiều compilation tasks → CHẬM → chờ đợi

  GIẢI PHÁP — HAPPYPACK:
  ┌──────────────────────────────────────────────────────────┐
  │ Chuyển Loader từ SYNCHRONOUS → PARALLEL execution      │
  │ → Tận dụng MULTI-CORE CPU                               │
  │ → Nhiều threads xử lý loader ĐỒNG THỜI                │
  │ → Tăng tốc đáng kể                                      │
  └──────────────────────────────────────────────────────────┘

  FLOW:
  ┌──────────┐      ┌─ Thread 1 → babel-loader → file1.js
  │ HappyPack│──────┼─ Thread 2 → babel-loader → file2.js
  │ (pool)   │      ├─ Thread 3 → babel-loader → file3.js
  └──────────┘      └─ Thread 4 → babel-loader → file4.js
                    → 4 files ĐỒNG THỜI thay vì TUẦN TỰ
```

```javascript
// ===== HappyPack Configuration =====
const HappyPack = require("happypack");

module.exports = {
  module: {
    loaders: [
      {
        test: /\.js$/,
        include: [resolve("src")],
        exclude: /node_modules/,
        // id tương ứng với HappyPack plugin bên dưới
        loader: "happypack/loader?id=happybabel",
      },
    ],
  },
  plugins: [
    new HappyPack({
      id: "happybabel",
      loaders: ["babel-loader?cacheDirectory"],
      threads: 4, // Mở 4 THREADS song song
    }),
  ],
};
```

```
⚠️ LƯU Ý: HappyPack đã DEPRECATED
→ Webpack 5+ dùng thread-loader thay thế
→ thread-loader hoạt động tương tự, được maintain tốt hơn
```

### (3) DllPlugin — Pre-bundle Libraries

> **🎯 Pre-package thư viện ÍT THAY ĐỔI → không cần package lại**

```
VẤN ĐỀ:
═══════════════════════════════════════════════════════════════

  Mỗi lần build → bundle LẠI cả thư viện (React, lodash...)
  → Thư viện HIẾM KHI thay đổi → lãng phí thời gian

  GIẢI PHÁP — DLLPLUGIN:
  ┌──────────────────────────────────────────────────────────┐
  │ ① Pre-compile thư viện → file DLL riêng (1 lần)       │
  │ ② Build app → reference DLL (không compile lại lib)    │
  │ → Chỉ re-bundle KHI thư viện UPDATE                   │
  │ → Build speed TĂNG rất nhiều!                           │
  └──────────────────────────────────────────────────────────┘

  FLOW:
  Lần đầu:  react, lodash... → webpack.dll.conf.js → vendor.dll.js
  Mỗi lần:  app code → webpack.conf.js → bundle.js
             ↑ reference vendor.dll.js (KHÔNG compile lại!)
```

```javascript
// ===== BƯỚC 1: webpack.dll.conf.js (chạy 1 lần) =====
const path = require("path");
const webpack = require("webpack");

module.exports = {
  entry: {
    // Thư viện muốn pre-bundle
    vendor: ["react", "react-dom", "lodash"],
  },
  output: {
    path: path.join(__dirname, "dist"),
    filename: "[name].dll.js",
    library: "[name]-[hash]",
  },
  plugins: [
    new webpack.DllPlugin({
      // name PHẢI = output.library
      name: "[name]-[hash]",
      context: __dirname,
      // Tạo manifest.json → map dependencies
      path: path.join(__dirname, "dist", "[name]-manifest.json"),
    }),
  ],
};
```

```javascript
// ===== BƯỚC 2: webpack.conf.js (chạy mỗi lần build) =====
module.exports = {
  // ...config khác
  plugins: [
    new webpack.DllReferencePlugin({
      context: __dirname,
      // Reference manifest.json đã tạo ở bước 1
      manifest: require("./dist/vendor-manifest.json"),
    }),
  ],
};
```

### (4) Code Compression

> **🎯 Loại bỏ code thừa, comments, minify JS/CSS/HTML**

```
CODE COMPRESSION:
═══════════════════════════════════════════════════════════════

  WEBPACK 3:
  → Dùng UglifyJS compress
  → webpack-parallel-uglify-plugin → multi-process UglifyJS
  → Cần cấu hình thủ công

  WEBPACK 4+:
  → Set mode: 'production' → TỰ ĐỘNG enable tất cả!
  → Code minification được BUILT-IN
  → Không cần cấu hình thêm

  CÓ THỂ MINIFY:
  ┌──────────────────────────────────────────────────────────┐
  │ ✅ JS:   UglifyJsPlugin / TerserPlugin                  │
  │ ✅ CSS:  cssnano (css-loader?minimize)                   │
  │ ✅ HTML: HtmlWebpackPlugin ({ minify: true })            │
  │ ✅ Xóa console.log, debugger statements                 │
  └──────────────────────────────────────────────────────────┘
```

```javascript
// ===== Webpack 4+ — Production mode =====
module.exports = {
  mode: "production", // Tự động enable minification
  // TerserPlugin đã built-in ✅
};

// ===== Custom: xóa console.log =====
const TerserPlugin = require("terser-webpack-plugin");

module.exports = {
  optimization: {
    minimizer: [
      new TerserPlugin({
        terserOptions: {
          compress: {
            drop_console: true, // Xóa console.log
            drop_debugger: true, // Xóa debugger
          },
        },
      }),
    ],
  },
};
```

### (5) Các Tối Ưu Khác

```
CÁC TỐI ƯU BỔ SUNG:
═══════════════════════════════════════════════════════════════

  ① resolve.extensions — Giảm danh sách extensions:
  ┌──────────────────────────────────────────────────────────┐
  │ Default: ['.js', '.json']                                │
  │ → GIẢM danh sách ngắn nhất có thể                      │
  │ → Đặt extension HÁY DÙNG NHẤT lên đầu                │
  │ → Webpack tìm NHANH hơn                                 │
  └──────────────────────────────────────────────────────────┘

  ② resolve.alias — Alias cho paths:
  ┌──────────────────────────────────────────────────────────┐
  │ Map path bằng alias → Webpack tìm NHANH hơn            │
  │ VD: '@': resolve('src')                                  │
  │ → import từ '@/utils' thay vì '../../utils'            │
  └──────────────────────────────────────────────────────────┘

  ③ module.noParse — Bỏ qua files không có dependencies:
  ┌──────────────────────────────────────────────────────────┐
  │ File CHẮC CHẮN không import/require gì                 │
  │ → noParse: /jquery|lodash/                               │
  │ → Webpack KHÔNG scan file đó → nhanh hơn               │
  │ → Hiệu quả cho thư viện LỚN                            │
  └──────────────────────────────────────────────────────────┘
```

```javascript
// ===== resolve + noParse =====
module.exports = {
  resolve: {
    // ① Extensions ngắn, hay dùng nhất lên đầu
    extensions: [".js", ".jsx", ".ts", ".tsx"],

    // ② Alias paths
    alias: {
      "@": resolve("src"),
      "@components": resolve("src/components"),
      "@utils": resolve("src/utils"),
    },
  },
  module: {
    // ③ Không scan files này (không có dependencies)
    noParse: /jquery|lodash/,
  },
};
```

---

## 2. Giảm Bundle Size

### (1) Code Splitting — On-demand Loading

> **🎯 Chia code theo route/component → chỉ load KHI CẦN**

```
VẤN ĐỀ:
═══════════════════════════════════════════════════════════════

  SPA: nhiều route pages → bundle TẤT CẢ vào 1 JS file
  → 1 request nhưng LOAD code KHÔNG CẦN THIẾT
  → First-screen load CHẬM

  GIẢI PHÁP — CODE SPLITTING:
  ┌──────────────────────────────────────────────────────────┐
  │ Chia code theo ROUTE hoặc COMPONENT                     │
  │ → Mỗi route = 1 CHUNK riêng                            │
  │ → Chỉ DOWNLOAD file khi user navigate tới             │
  │ → First-screen load NHANH hơn nhiều!                   │
  └──────────────────────────────────────────────────────────┘
```

```javascript
// ===== React: Lazy Loading Routes =====
import { lazy, Suspense } from "react";

// KHÔNG import trực tiếp → dùng lazy()
const Home = lazy(() => import("./pages/Home"));
const About = lazy(() => import("./pages/About"));
const Dashboard = lazy(() => import("./pages/Dashboard"));

// Mỗi page = 1 chunk riêng → download khi navigate

function App() {
  return (
    <Suspense fallback={<Loading />}>
      <Route path="/" component={Home} />
      <Route path="/about" component={About} />
      <Route path="/dashboard" component={Dashboard} />
    </Suspense>
  );
}
```

```javascript
// ===== Dynamic import cho thư viện lớn =====

// ❌ BAD: import toàn bộ lodash (70KB+)
import _ from "lodash";

// ✅ GOOD: import on-demand
const _ = await import("lodash");

// ✅ BETTER: import chỉ function cần
import debounce from "lodash/debounce";
```

### (2) Scope Hoisting

> **🎯 Gộp modules vào 1 function → giảm function wrappers**

```
VẤN ĐỀ:
═══════════════════════════════════════════════════════════════

  Webpack thường wrap MỖI MODULE trong 1 function riêng:

  KHÔNG CÓ Scope Hoisting:
  ┌──────────────────────────────────────────────────────────┐
  │ [                                                        │
  │   /* 0 */ function(module, exports, require) { ... },   │
  │   /* 1 */ function(module, exports, require) { ... },   │
  │   /* 2 */ function(module, exports, require) { ... }    │
  │ ]                                                        │
  │ → Mỗi module 1 function wrapper → CODE NHIỀU hơn      │
  └──────────────────────────────────────────────────────────┘

  CÓ Scope Hoisting:
  ┌──────────────────────────────────────────────────────────┐
  │ [                                                        │
  │   /* 0 */ function(module, exports, require) {           │
  │     // TẤT CẢ modules GỘP vào đây                      │
  │   }                                                      │
  │ ]                                                        │
  │ → ÍT function wrappers → CODE NHỎ hơn ✅              │
  └──────────────────────────────────────────────────────────┘
```

```javascript
// ===== test.js =====
export const a = 1;

// ===== index.js =====
import { a } from "./test.js";
```

```javascript
// ===== Enable Scope Hoisting (Webpack 4+) =====
module.exports = {
  optimization: {
    concatenateModules: true, // Enable Scope Hoisting
  },
};

// Webpack 4 production mode → TỰ ĐỘNG enable ✅
```

### (3) Tree Shaking

> **🎯 Xóa code KHÔNG ĐƯỢC SỬ DỤNG (dead code elimination)**

```
TREE SHAKING:
═══════════════════════════════════════════════════════════════

  Phân tích code → tìm exports KHÔNG ĐƯỢC import ở đâu
  → LOẠI BỎ khỏi bundle → giảm size

  VÍ DỤ:
  ┌──────────────────────────────────────────────────────────┐
  │ // test.js                                               │
  │ export const a = 1;   // ← ĐƯỢC import → GIỮ ✅       │
  │ export const b = 2;   // ← KHÔNG import → XÓA ❌      │
  │                                                          │
  │ // index.js                                              │
  │ import { a } from './test.js';  // Chỉ import a        │
  │ // → b KHÔNG BAO GIỜ được dùng → Tree Shaking loại bỏ │
  └──────────────────────────────────────────────────────────┘

  ĐIỀU KIỆN:
  → Phải dùng ES Modules (import/export)
  → KHÔNG hoạt động với CommonJS (require/module.exports)
  → Webpack 4 production → TỰ ĐỘNG enable ✅
```

---

## 3. Tối ưu Frontend Performance

> **🎯 Output Webpack chạy NHANH + HIỆU QUẢ trên browser**

```
5 CHIẾN LƯỢC TỐI ƯU FRONTEND PERFORMANCE:
═══════════════════════════════════════════════════════════════

  ① CODE COMPRESSION:
  ┌──────────────────────────────────────────────────────────┐
  │ → Loại bỏ code thừa, comments, simplify syntax         │
  │ → JS: UglifyJsPlugin / TerserPlugin / ParallelUglify   │
  │ → CSS: cssnano (css-loader?minimize)                    │
  │ → HTML: HtmlWebpackPlugin ({ minify: true })            │
  └──────────────────────────────────────────────────────────┘

  ② CDN ACCELERATION:
  ┌──────────────────────────────────────────────────────────┐
  │ → Thay đổi paths static resources → CDN paths          │
  │ → Dùng output.publicPath + loader publicPath            │
  │ → Static files load từ CDN gần user nhất               │
  └──────────────────────────────────────────────────────────┘

  ③ TREE SHAKING:
  ┌──────────────────────────────────────────────────────────┐
  │ → Loại bỏ code KHÔNG BAO GIỜ chạy tới                 │
  │ → --optimize-minimize flag                               │
  │ → Webpack 4+ production tự động enable                  │
  └──────────────────────────────────────────────────────────┘

  ④ CODE SPLITTING:
  ┌──────────────────────────────────────────────────────────┐
  │ → Chia code theo routes / components                    │
  │ → On-demand loading (lazy loading)                       │
  │ → Tận dụng browser caching                              │
  └──────────────────────────────────────────────────────────┘

  ⑤ EXTRACT COMMON LIBRARIES (SplitChunks):
  ┌──────────────────────────────────────────────────────────┐
  │ → SplitChunksPlugin tách common modules                 │
  │ → Thư viện chung → file riêng → browser CACHE lâu dài │
  │ → Code ÍT THAY ĐỔI → cached, không download lại      │
  └──────────────────────────────────────────────────────────┘
```

```javascript
// ===== CDN + SplitChunks + Externals =====
module.exports = {
  // ② CDN paths
  output: {
    publicPath: "https://cdn.example.com/assets/",
  },

  // ⑤ SplitChunks — tách common modules
  optimization: {
    splitChunks: {
      chunks: "all",
      cacheGroups: {
        vendor: {
          test: /[\\/]node_modules[\\/]/,
          name: "vendors",
          chunks: "all",
          // node_modules → file riêng → cache lâu dài
        },
      },
    },
  },

  // Externals — không bundle, load từ CDN
  externals: {
    react: "React",
    "react-dom": "ReactDOM",
    // Dùng <script src="cdn/react.min.js"> thay thế
  },
};
```

---

## 4. Tổng hợp Strategies

```
TỔNG HỢP — TẤT CẢ STRATEGIES:
═══════════════════════════════════════════════════════════════

  ┌──────────────────┬────────────────────────────────────────┐
  │ MỤC TIÊU        │ STRATEGIES                              │
  ├──────────────────┼────────────────────────────────────────┤
  │                  │ ① Optimize Loader (include/exclude/   │
  │ BUILD SPEED ↑    │    cacheDirectory)                     │
  │ (Dev Experience) │ ② HappyPack / thread-loader (parallel)│
  │                  │ ③ DllPlugin (pre-bundle libs)         │
  │                  │ ④ Code Compression (TerserPlugin)     │
  │                  │ ⑤ resolve.extensions / alias / noParse│
  ├──────────────────┼────────────────────────────────────────┤
  │                  │ ① Code Splitting (on-demand loading)  │
  │ BUNDLE SIZE ↓    │ ② Scope Hoisting (concatenateModules) │
  │ (Network)        │ ③ Tree Shaking (dead code elimination)│
  │                  │ ④ Externals (CDN cho thư viện lớn)   │
  ├──────────────────┼────────────────────────────────────────┤
  │                  │ ① Code Compression (minify JS/CSS)    │
  │ RUNTIME PERF ↑   │ ② CDN Acceleration (publicPath)       │
  │ (User Experience)│ ③ SplitChunks (tách common → cache)  │
  │                  │ ④ Tree Shaking + Scope Hoisting       │
  │                  │ ⑤ On-demand Loading (lazy routes)     │
  └──────────────────┴────────────────────────────────────────┘
```

```
WEBPACK 3 vs 4+ — SỰ KHÁC BIỆT:
═══════════════════════════════════════════════════════════════

  ┌──────────────────┬────────────────────┬──────────────────┐
  │ Feature          │ Webpack 3          │ Webpack 4+       │
  ├──────────────────┼────────────────────┼──────────────────┤
  │ Minification     │ UglifyJS (manual)  │ mode:'production'│
  │                  │                    │ (auto) ✅        │
  │ Tree Shaking     │ Manual config      │ Production auto  │
  │                  │                    │ ✅               │
  │ Scope Hoisting   │ ModuleConcatenation│ concatenateModule │
  │                  │ Plugin (manual)    │ (auto) ✅        │
  │ Code Splitting   │ CommonsChunkPlugin │ SplitChunksPlugin│
  │                  │                    │ ✅               │
  │ Parallel         │ HappyPack          │ thread-loader ✅ │
  └──────────────────┴────────────────────┴──────────────────┘
```

---

## 5. Tóm Tắt & Câu Hỏi Phỏng Vấn

### Quick Reference

```
WEBPACK OPTIMIZATION — QUICK REFERENCE:
═══════════════════════════════════════════════════════════════

  BUILD SPEED ↑:
    Loader: include/exclude + cacheDirectory
    Parallel: HappyPack (deprecated) → thread-loader
    DllPlugin: pre-bundle libs (chỉ build 1 lần)
    Compression: TerserPlugin, mode:'production'
    resolve: extensions, alias, noParse

  BUNDLE SIZE ↓:
    Code Splitting: lazy(() => import('./Page'))
    Scope Hoisting: concatenateModules (gộp functions)
    Tree Shaking: loại dead code (ES Modules only)

  RUNTIME PERFORMANCE ↑:
    CDN: publicPath cho static resources
    SplitChunks: tách common → browser cache
    Externals: thư viện lớn load từ CDN
    On-demand: lazy routes + dynamic import
```

### Câu Hỏi Phỏng Vấn Thường Gặp

**1. Cách tăng tốc build speed của Webpack?**

> 5 cách: ① **Optimize Loader**: include/exclude giới hạn phạm vi + `cacheDirectory` cache compilation. ② **HappyPack/thread-loader**: chuyển Loader sang **parallel execution** (tận dụng multi-core). ③ **DllPlugin**: **pre-bundle** thư viện ít thay đổi (React, lodash), chỉ recompile khi lib update. ④ **Code Compression**: `mode:'production'` tự động enable minification (Webpack 4+). ⑤ **resolve**: extensions ngắn + alias + noParse cho thư viện lớn.

**2. Cách giảm bundle size?**

> 3 cách: ① **Code Splitting**: chia code theo route/component, `lazy(() => import())`, chỉ download **khi cần** → first-screen nhanh. ② **Scope Hoisting**: `concatenateModules` gộp modules vào **1 function** → giảm function wrappers → code **nhỏ hơn**. ③ **Tree Shaking**: loại bỏ **dead code** (exports không được import), yêu cầu ES Modules, Webpack 4 production **tự động enable**.

**3. Cách tối ưu frontend performance bằng Webpack?**

> 5 cách: ① **Code Compression** (minify JS/CSS/HTML, xóa console.log). ② **CDN Acceleration** (publicPath → static resources từ CDN). ③ **Tree Shaking** (loại dead code). ④ **Code Splitting** (on-demand loading theo route). ⑤ **SplitChunksPlugin** (tách common modules → browser cache **lâu dài**, thư viện ít thay đổi → cached, không download lại).

**4. DllPlugin hoạt động thế nào?**

> 2 bước: ① Tạo **webpack.dll.conf.js** riêng → `DllPlugin` pre-compile thư viện (React, lodash...) → output `vendor.dll.js` + `manifest.json`. Chạy **1 lần** (hoặc khi lib update). ② Trong **webpack.conf.js** chính → `DllReferencePlugin` reference `manifest.json` → Webpack **không compile lại** thư viện → build **nhanh hơn**.

**5. Tree Shaking vs Scope Hoisting?**

> **Tree Shaking**: loại bỏ **dead code** (exports không dùng tới). VD: export a + b, chỉ import a → b bị xóa. Yêu cầu **ES Modules**. **Scope Hoisting**: **gộp** nhiều modules vào 1 function → giảm function wrappers → code nhỏ + chạy nhanh hơn. Cả 2 đều Webpack 4 production **tự động enable**.

**6. Code Splitting vs Externals?**

> **Code Splitting**: chia **app code** theo route → download on-demand → giảm initial load. **Externals**: **không bundle** thư viện lớn (React, jQuery) → load từ **CDN** bằng `<script>` tag. Code Splitting cho **app code**, Externals cho **libraries**.

---

## Checklist Học Tập

- [ ] Biết 3 trục tối ưu (build speed, bundle size, runtime performance)
- [ ] Hiểu Loader optimization (include/exclude + cacheDirectory)
- [ ] Biết HappyPack/thread-loader (parallel Loader execution)
- [ ] Hiểu DllPlugin (2 bước: dll.conf.js + DllReferencePlugin)
- [ ] Biết Code Compression (TerserPlugin, mode:'production')
- [ ] Hiểu resolve (extensions, alias, noParse)
- [ ] Biết Code Splitting (lazy import, on-demand loading)
- [ ] Hiểu Scope Hoisting (concatenateModules, gộp functions)
- [ ] Hiểu Tree Shaking (dead code elimination, ES Modules)
- [ ] Biết frontend perf (CDN, SplitChunks, externals)
- [ ] Phân biệt Webpack 3 vs 4+ (manual vs auto)

---

_Cập nhật lần cuối: Tháng 2, 2026_
