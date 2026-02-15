# Webpack Deep Dive — Triết Lý Thiết Kế

> Tài liệu học chuyên sâu về Webpack: core workflow, architecture, plugin system, loader system, và cách tự implement Webpack từ đầu.

---

## Mục Lục

1. [Giới Thiệu](#1-giới-thiệu)
2. [Sử Dụng Cơ Bản](#2-sử-dụng-cơ-bản)
3. [Ý Tưởng Cốt Lõi (Core Ideas)](#3-ý-tưởng-cốt-lõi-core-ideas)
4. [Thiết Kế Kiến Trúc (Architecture Design)](#4-thiết-kế-kiến-trúc-architecture-design)
5. [Tapable — Event Flow System](#5-tapable--event-flow-system)
6. [Plugin System](#6-plugin-system)
7. [Loader System](#7-loader-system)
8. [10 Bước Implement Webpack](#8-10-bước-implement-webpack)
9. [Watch Mode](#9-watch-mode)
10. [Tổng Hợp & Quick Reference](#10-tổng-hợp--quick-reference)
11. [Câu Hỏi Phỏng Vấn](#11-câu-hỏi-phỏng-vấn)

---

## 1. Giới Thiệu

```
┌─────────────────────────────────────────────────────────────────┐
│  WEBPACK DEEP DIVE — TRIẾT LÝ THIẾT KẾ                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Webpack = "Hộp đen" đáng sợ?                                  │
│  → Không hiểu nguyên lý                                        │
│  → Không biết cấu hình                                         │
│  → Chỉ biết dùng API cơ bản                                    │
│                                                                 │
│  THỰC TẾ: Core process KHÔNG phức tạp như tưởng tượng!          │
│  → Có thể replicate bằng ~100 dòng code                        │
│  → Phức tạp vì ECOSYSTEM lớn, không phải core                  │
│                                                                 │
│  TRIẾT LÝ HỌC:                                                 │
│  "Vạn biến bất ly kỳ tông" — Mọi thứ thay đổi                 │
│   nhưng bản chất KHÔNG ĐỔI                                     │
│                                                                 │
│  → Tập trung vào THIẾT KẾ TƯ TƯỞNG (design philosophy)         │
│  → Hiểu Plugin System + Loader System                           │
│  → Hiểu 1 thì hiểu TẤT CẢ                                     │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘

KIẾN THỨC NỀN TẢNG CẦN BIẾT:
┌─────────────────────────────────────────────────┐
│  ① Modular Principles — Hiểu module hóa        │
│  ② AST (Abstract Syntax Tree) — Nền tảng FE    │
│  ③ Tapable — Event system (giống EventEmitter)  │
│  ④ Loader mechanism — Biến đổi source code      │
│  ⑤ Plugin mechanism — Mở rộng chức năng         │
└─────────────────────────────────────────────────┘
```

---

## 2. Sử Dụng Cơ Bản

```
KHỞI TẠO PROJECT:
┌─────────────────────────────────────────────────┐
│  npm init              // Khởi tạo project      │
│  yarn add webpack      // Cài đặt Webpack       │
│                                                   │
│  CẤU TRÚC THƯ MỤC:                               │
│  ├── node_modules                                │
│  ├── package.json                                │
│  ├── webpack.config.js    ← Cấu hình            │
│  ├── debugger.js          ← File test            │
│  └── src/                 ← Source code          │
│       ├── index.js        ← Entry file           │
│       ├── name.js         ← Module phụ thuộc     │
│       └── age.js          ← Module phụ thuộc     │
└─────────────────────────────────────────────────┘

DEPENDENCY GRAPH:
┌──────────────────────────────────────────────┐
│                                              │
│   src/index.js (ENTRY)                       │
│       │                                      │
│       ├── require("./name") → src/name.js    │
│       │   └── exports "Xin đừng hói đầu"     │
│       │                                       │
│       └── require("./age")  → src/age.js     │
│           └── exports "99"                   │
│                                              │
│   Output: "Entry in thông tin: Xin đừng hói đầu 99" │
│                                              │
└──────────────────────────────────────────────┘
```

### Webpack Config Cơ Bản

```
webpack.config.js:
┌─────────────────────────────────────────────────┐
│  module.exports = {                              │
│    mode: "development",       // Không nén code  │
│    entry: "./src/index.js",   // File đầu vào   │
│    output: {                                     │
│      path: path.resolve(__dirname, "dist"),      │
│      filename: "[name].js",   // Tên file output │
│    },                                            │
│    devtool: "source-map",     // Debug source    │
│  };                                              │
└─────────────────────────────────────────────────┘
```

### Webpack Là Gì?

```
WEBPACK BẢN CHẤT LÀ 1 FUNCTION:

  webpack(config) → compiler object → compiler.run() → output

┌────────────────────────────────────────────────────────┐
│                                                        │
│  const { webpack } = require("webpack");               │
│  const config = require("./webpack.config.js");        │
│                                                        │
│  // ① Webpack nhận config → trả về compiler object    │
│  const compiler = webpack(config);                     │
│                                                        │
│  // ② Gọi run() → bắt đầu compile                    │
│  compiler.run((err, stats) => {                        │
│    // ③ Callback nhận kết quả hoặc lỗi               │
│    console.log(stats.toJson({                          │
│      assets: true,    // Tài sản đã build             │
│      chunks: true,    // Code blocks                   │
│      modules: true,   // Modules đã compile           │
│    }));                                                │
│  });                                                   │
│                                                        │
└────────────────────────────────────────────────────────┘
```

---

## 3. Ý Tưởng Cốt Lõi (Core Ideas)

```
════════════════════════════════════════════════════════════════════
SOURCE CODE → BUILD ARTIFACT: CHUYỆN GÌ ĐÃ XẢY RA?
════════════════════════════════════════════════════════════════════

SOURCE CODE (bên trái):                OUTPUT (bên phải):
┌─────────────────────┐    BUILD     ┌─────────────────────────┐
│ src/index.js         │  ──────►   │ dist/main.js             │
│   require("./name")  │            │                           │
│   require("./age")   │            │ (() => {                  │
│                      │            │   var modules = {         │
│ src/name.js          │            │     "./src/name.js": ..., │
│   exports "Xin đừng  "│            │     "./src/age.js": ...,  │
│                      │            │   };                      │
│ src/age.js           │            │   function require(id){…} │
│   exports "99"       │            │   // entry code           │
│                      │            │ })();                     │
└─────────────────────┘            └─────────────────────────┘

PHÂN TÍCH OUTPUT:
┌─────────────────────────────────────────────────────────┐
│  ① Entry file (src/index.js)                            │
│     → Được WRAP trong IIFE (Immediately Invoked)       │
│                                                         │
│  ② Dependent modules (name.js, age.js)                  │
│     → Được đặt trong MODULES OBJECT                    │
│     → Key = đường dẫn module                           │
│     → Value = source code của module                    │
│                                                         │
│  ③ require() function                                   │
│     → Tự implement (browser KHÔNG có require)           │
│     → Nhận module path → trả về module.exports         │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

### 3 Bước Chuyển Đổi

```
CÂU HỎI CỐT LÕI: Chuyển source code → dist/main.js NHƯ THẾ NÀO?

BƯỚC 1: TÌM ENTRY FILE
  │  Đọc webpack.config.js → entry: "./src/index.js"
  │  → Xác định file đầu vào
  │
  ▼
BƯỚC 2: THU THẬP THÔNG TIN TẤT CẢ MODULES
  │  Từ entry file → tìm TẤT CẢ modules phụ thuộc
  │  Mỗi module cần 3 thông tin:
  │  ┌──────────────────────────────────────────────┐
  │  │  {                                           │
  │  │    id: "./src/name.js",      // Đường dẫn   │
  │  │    dependencies: [],          // Phụ thuộc   │
  │  │    source: 'module.exports = "..."'  // Code │
  │  │  }                                           │
  │  └──────────────────────────────────────────────┘
  │
  ▼
BƯỚC 3: GENERATE OUTPUT FILE
  → Tạo modules object + require template + entry code
  → Ghi ra dist/main.js

TRONG QUÁ TRÌNH NÀY CẦN THÊM 2 SYSTEM:

┌─────────────────────────────────────────────────────────┐
│  LOADER SYSTEM:                                          │
│  Browser chỉ hiểu HTML, JS, CSS                         │
│  → Cần Loader để CHUYỂN ĐỔI các file khác               │
│  → Input: source file → Transform → Output: JS          │
│                                                          │
│  PLUGIN SYSTEM:                                          │
│  Cần hook vào các THỜI ĐIỂM CỤ THỂ:                     │
│  → Trước khi đóng gói: validate config params           │
│  → Trong khi đóng gói: skip modules (CDN)               │
│  → Sau khi compile: chèn vào HTML                       │
│  → Trước khi ghi file: xóa dist/ cũ                     │
│  → Thiết kế PLUGGABLE → mở rộng cho cộng đồng          │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

---

## 4. Thiết Kế Kiến Trúc (Architecture Design)

```
════════════════════════════════════════════════════════════════════
WEBPACK WORKFLOW — 3 GIAI ĐOẠN
════════════════════════════════════════════════════════════════════

          WEBPACK WORKFLOW
               │
    ┌──────────┼──────────┐
    ▼          ▼          ▼
┌────────┐ ┌────────┐ ┌────────┐
│ TRƯỚC  │ │ TRONG  │ │  SAU   │
│ đóng   │ │ đóng   │ │ đóng   │
│ gói    │ │ gói    │ │ gói    │
│        │ │(COMPILE)│ │        │
└────────┘ └────────┘ └────────┘
  run()    compilation   done()
  hook     ↳ build()     hook


════════════════════════════════════════════════════════════════════
COMPILER vs COMPILATION — PHÂN BIỆT QUAN TRỌNG
════════════════════════════════════════════════════════════════════

┌─ COMPILER ("Quản Gia Trưởng") ──────────────────────────────┐
│                                                               │
│  • Đại diện cho TOÀN BỘ quy trình đóng gói                  │
│  • SINGLETON — chỉ có 1 instance duy nhất                    │
│  • Chứa: cấu hình (this.options)                             │
│          lifecycle hooks (this.hooks)                         │
│          phương thức run() và compile()                       │
│                                                               │
│  ┌─ COMPILATION ("Đầu Bếp") ────────────────────────────┐   │
│  │                                                        │   │
│  │  • Chịu trách nhiệm COMPILE (phần khó nhất)           │   │
│  │  • MỖI LẦN compile → tạo Compilation MỚI              │   │
│  │  • Tại sao? → Vì WATCH MODE!                          │   │
│  │    File thay đổi → compile lại → Compilation mới      │   │
│  │  • Chứa: this.modules (tất cả modules)                │   │
│  │          this.chunks (code blocks)                     │   │
│  │          this.assets (output files)                    │   │
│  │          this.fileDependencies (watched files)         │   │
│  │                                                        │   │
│  └────────────────────────────────────────────────────────┘   │
│                                                               │
└───────────────────────────────────────────────────────────────┘

TẠI SAO TÁCH COMPILER VÀ COMPILATION?
┌─────────────────────────────────────────────────┐
│  ✅ DECOUPLING — tách biệt trách nhiệm         │
│  ✅ REUSABILITY — compile lại không cần tạo     │
│     Compiler mới                                │
│  ✅ WATCH MODE — file thay đổi → chỉ tạo       │
│     Compilation mới, Compiler giữ nguyên        │
│  ✅ LIFECYCLE — Compiler quản lý trước/sau,     │
│     Compilation chỉ lo compile                  │
└─────────────────────────────────────────────────┘
```

---

## 5. Tapable — Event Flow System

```
════════════════════════════════════════════════════════════════════
TAPABLE LÀ GÌ?
════════════════════════════════════════════════════════════════════

Tapable = Library quản lý EVENT FLOW
→ Giống EventEmitter trong Node.js
→ Nhưng FOCUS hơn vào custom events
→ Là "CẦU NỐI" xuyên suốt toàn bộ build process

Tương tự như:
  Vue lifecycle    → mounted, created, destroyed
  React lifecycle  → componentDidMount, useEffect
  Tapable          → run hook, done hook, emit hook...

┌──────────────────────────────────────────────────────────┐
│  CÁCH DÙNG TAPABLE:                                      │
│                                                           │
│  // ① Tạo hook (định nghĩa event)                       │
│  const syncHook = new SyncHook(["author", "age"]);       │
│                                                           │
│  // ② Đăng ký listener (subscribe)                       │
│  syncHook.tap("Listener1", (name, age) => {              │
│    console.log("Listener1:", name, age);                  │
│  });                                                      │
│  syncHook.tap("Listener2", (name) => {                   │
│    console.log("Listener2:", name);                       │
│  });                                                      │
│                                                           │
│  // ③ Trigger event (publish)                            │
│  syncHook.call("Alice", "99");                            │
│                                                           │
│  // Output:                                               │
│  // Listener1: Alice 99                                   │
│  // Listener2: Alice                                      │
│                                                           │
└──────────────────────────────────────────────────────────┘

TAPABLE TRONG WEBPACK:
┌──────────────────────────────────────────────────────────┐
│                                                           │
│  class Compiler {                                         │
│    constructor() {                                        │
│      this.hooks = {                                       │
│        run: new SyncHook(),   // Trước khi compile       │
│        done: new SyncHook(),  // Sau khi compile xong    │
│      };                                                   │
│    }                                                      │
│  }                                                        │
│                                                           │
│  → Plugin đăng ký listener vào hooks                     │
│  → Webpack trigger hooks tại các thời điểm đúng          │
│  → Plugin code chạy tại đúng lifecycle moment            │
│                                                           │
└──────────────────────────────────────────────────────────┘

FLOW:
  Plugin.apply(compiler) {
    compiler.hooks.run.tap(...)    ← Đăng ký event
  }

  compiler.run() {
    this.hooks.run.call()          ← Trigger event
    this.compile(...)              ← Compile
    this.hooks.done.call()         ← Trigger done
  }
```

---

## 6. Plugin System

```
════════════════════════════════════════════════════════════════════
PLUGIN SYSTEM — CƠ CHẾ MỞ RỘNG
════════════════════════════════════════════════════════════════════

Plugin = EVENT STREAMING MECHANISM
→ Broadcast events tại THỜI ĐIỂM CỐ ĐỊNH
→ User thực thi logic cụ thể trong events đó
→ Giống LIFECYCLE

Plugin BẢN CHẤT là gì?
┌─────────────────────────────────────────────────┐
│  Plugin = 1 class thường                         │
│  → BẮT BUỘC có method apply(compiler)           │
│  → Trong apply(): đăng ký vào lifecycle hooks    │
│  → Webpack gọi apply() khi mount plugin         │
│  → Hooks execute tại thời điểm tương ứng        │
└─────────────────────────────────────────────────┘

VÍ DỤ:
┌──────────────────────────────────────────────────────────┐
│                                                           │
│  // Plugin chạy KHI BẮT ĐẦU compile                     │
│  class WebpackRunPlugin {                                 │
│    apply(compiler) {                                      │
│      compiler.hooks.run.tap("RunPlugin", () => {         │
│        console.log("Bắt đầu compile!");                   │
│      });                                                  │
│    }                                                      │
│  }                                                        │
│                                                           │
│  // Plugin chạy KHI COMPILE XONG                          │
│  class WebpackDonePlugin {                                │
│    apply(compiler) {                                      │
│      compiler.hooks.done.tap("DonePlugin", () => {       │
│        console.log("Compile xong!");                      │
│      });                                                  │
│    }                                                      │
│  }                                                        │
│                                                           │
│  // Cấu hình trong webpack.config.js:                    │
│  plugins: [new WebpackRunPlugin(), new WebpackDonePlugin()]│
│                                                           │
└──────────────────────────────────────────────────────────┘

WEBPACK MOUNT PLUGINS NHƯ THẾ NÀO?
┌──────────────────────────────────────────────────────────┐
│                                                           │
│  function webpack(options) {                              │
│    const compiler = new Compiler(options);                │
│                                                           │
│    // Duyệt qua TẤT CẢ plugins → gọi apply()           │
│    const { plugins } = options;                           │
│    for (let plugin of plugins) {                         │
│      plugin.apply(compiler);    // ← Mount plugin        │
│    }                                                      │
│                                                           │
│    return compiler;                                       │
│  }                                                        │
│                                                           │
│  → apply() đăng ký listeners vào compiler.hooks          │
│  → Khi compiler.run() → hooks.run.call()                 │
│  → Listeners được trigger tại đúng thời điểm             │
│                                                           │
└──────────────────────────────────────────────────────────┘

CÁC PLUGIN PHỔ BIẾN:
┌─────────────────────────────────────────────────┐
│  HtmlWebpackPlugin → Chèn output vào HTML      │
│  CleanWebpackPlugin → Xóa dist/ trước build    │
│  MiniCssExtractPlugin → Tách CSS riêng          │
│  DefinePlugin → Định nghĩa environment vars     │
│  CopyWebpackPlugin → Copy static files          │
│  BundleAnalyzerPlugin → Phân tích bundle size   │
└─────────────────────────────────────────────────┘
```

---

## 7. Loader System

```
════════════════════════════════════════════════════════════════════
LOADER SYSTEM — CƠ CHẾ CHUYỂN ĐỔI
════════════════════════════════════════════════════════════════════

Loader BẢN CHẤT là gì?
┌─────────────────────────────────────────────────┐
│  Loader = 1 FUNCTION đơn giản                    │
│  → Nhận: source code (hoặc kết quả Loader trước)│
│  → Trả về: source code đã CHUYỂN ĐỔI            │
│                                                   │
│  Input → Loader1 → Loader2 → Loader3 → Output   │
│                                                   │
│  ⚠️ Chạy TỪ PHẢI SANG TRÁI (right-to-left)      │
│  → use: [loader1, loader2, loader3]              │
│  → Thực thi: loader3 → loader2 → loader1        │
└─────────────────────────────────────────────────┘

TẠI SAO CẦN LOADER?
┌─────────────────────────────────────────────────┐
│  Browser chỉ hiểu: HTML, JS, CSS                │
│  Nhưng project có: .ts, .jsx, .scss, .vue,      │
│                     .png, .json, .md...          │
│                                                   │
│  → Loader CHUYỂN ĐỔI tất cả → JS                │
│  → Sau Loader xong → PHẢI là JS content          │
│     (vì cần parse AST bằng babel)                │
└─────────────────────────────────────────────────┘

VÍ DỤ:
┌──────────────────────────────────────────────────────────┐
│                                                           │
│  // Loader đơn giản: thêm comment vào code               │
│  const loader1 = (source) => {                           │
│    return source + "//loader1 added this comment";       │
│  };                                                       │
│                                                           │
│  const loader2 = (source) => {                           │
│    return source + "//loader2 added this comment";       │
│  };                                                       │
│                                                           │
│  // Cấu hình:                                            │
│  module: {                                                │
│    rules: [                                               │
│      {                                                    │
│        test: /\.js$/,       // Match .js files           │
│        use: [loader1, loader2],  // Chạy loader2 trước  │
│      },                                                   │
│    ],                                                     │
│  }                                                        │
│                                                           │
└──────────────────────────────────────────────────────────┘

LOADER EXECUTION:
  sourceCode = loaders.reduceRight((code, loader) => {
    return loader(code);
  }, sourceCode);

  → reduceRight = chạy TỪ PHẢI SANG TRÁI
  → loader2(source) → loader1(result) → final output

CÁC LOADER PHỔ BIẾN:
┌─────────────────────────────────────────────────┐
│  babel-loader → ES6+ → ES5 (compatibility)     │
│  ts-loader → TypeScript → JavaScript            │
│  css-loader → Xử lý @import, url()             │
│  style-loader → Inject CSS vào DOM              │
│  sass-loader → SCSS → CSS                       │
│  file-loader → File → URL path                  │
│  url-loader → Small file → Base64 inline        │
│  vue-loader → .vue → JS component              │
│  raw-loader → File → String                     │
└─────────────────────────────────────────────────┘

SO SÁNH LOADER vs PLUGIN:
┌──────────────────┬──────────────────────────────┐
│     LOADER       │         PLUGIN                │
├──────────────────┼──────────────────────────────┤
│ Function đơn giản│ Class với apply() method      │
│ Chuyển đổi FILES │ Mở rộng TOÀN BỘ workflow     │
│ Chạy khi match   │ Chạy tại lifecycle hooks     │
│ file pattern     │ (any time point)              │
│ Input → Output   │ Tap vào event system          │
│ 1 file at a time │ Access compilation instance   │
│ Right-to-left    │ Any hook order                │
└──────────────────┴──────────────────────────────┘
```

---

## 8. 10 Bước Implement Webpack

```
════════════════════════════════════════════════════════════════════
TỔNG QUAN 10 BƯỚC
════════════════════════════════════════════════════════════════════

┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│  BƯỚC 1:  Xây dựng cấu trúc, đọc config params                │
│  BƯỚC 2:  Khởi tạo Compiler object từ config                   │
│  BƯỚC 3:  Mount plugins từ config file                          │
│  BƯỚC 4:  Chạy Compiler.run() → bắt đầu compile               │
│  BƯỚC 5:  Tìm tất cả entry points từ config                    │
│  BƯỚC 6:  Từ entry, gọi Loader compile từng module             │
│  BƯỚC 7:  Tìm dependent modules → compile recursive            │
│  BƯỚC 8:  Sau compile xong → tổ hợp thành chunks              │
│  BƯỚC 9:  Chuyển chunks → files → thêm vào output list        │
│  BƯỚC 10: Ghi files ra file system (ổ cứng)                    │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Bước 1-3: Setup

```
════════════════════════════════════════════════════════════════════
BƯỚC 1: XÂY DỰNG CẤU TRÚC, ĐỌC CONFIG
════════════════════════════════════════════════════════════════════

┌──────────────────────────────────────────────────────────┐
│  // webpack() nhận config → trả về compiler             │
│  function webpack(webpackOptions) {                      │
│    const compiler = new Compiler(webpackOptions);        │
│    return compiler;                                      │
│  }                                                       │
│                                                           │
│  class Compiler {                                         │
│    constructor(options) { ... }                           │
│    run(callback) { ... }                                 │
│  }                                                        │
└──────────────────────────────────────────────────────────┘

════════════════════════════════════════════════════════════════════
BƯỚC 2: KHỞI TẠO COMPILER OBJECT
════════════════════════════════════════════════════════════════════

┌──────────────────────────────────────────────────────────┐
│  class Compiler {                                         │
│    constructor(webpackOptions) {                          │
│      this.options = webpackOptions;  // Lưu config       │
│      this.hooks = {                                       │
│        run: new SyncHook(),   // Hook trước compile      │
│        done: new SyncHook(),  // Hook sau compile        │
│      };                                                   │
│    }                                                      │
│  }                                                        │
│                                                           │
│  Compiler chứa:                                           │
│  ├── this.options → webpack config info                   │
│  └── this.hooks → lifecycle hooks (via Tapable)          │
└──────────────────────────────────────────────────────────┘

════════════════════════════════════════════════════════════════════
BƯỚC 3: MOUNT PLUGINS
════════════════════════════════════════════════════════════════════

┌──────────────────────────────────────────────────────────┐
│  function webpack(webpackOptions) {                      │
│    const compiler = new Compiler(webpackOptions);        │
│                                                           │
│    // Mount từng plugin:                                 │
│    const { plugins } = webpackOptions;                   │
│    for (let plugin of plugins) {                         │
│      plugin.apply(compiler);  // ← GỌI apply()          │
│    }                                                      │
│                                                           │
│    return compiler;                                       │
│  }                                                        │
│                                                           │
│  → apply() đăng ký listeners vào compiler.hooks          │
│  → Chưa execute, chỉ SUBSCRIBE                          │
└──────────────────────────────────────────────────────────┘
```

### Bước 4-5: Bắt Đầu Compile

```
════════════════════════════════════════════════════════════════════
BƯỚC 4: CHẠY COMPILER.RUN() — TOÀN CẢNH LIFECYCLE
════════════════════════════════════════════════════════════════════

   ┌──────────────────────────────────────────────────────────────┐
   │  Compiler.run() — Lifecycle 3 bước:                          │
   │                                                              │
   │  (1) Trước compile: trigger hooks.run → plugins chạy logic  │
   │  (2) Thực hiện compile: gọi compile() function              │
   │  (3) Sau compile xong: trigger hooks.done → thông báo hoàn  │
   │                         thành                                │
   └──────────────────────────────────────────────────────────────┘

   FLOW CHI TIẾT:

   Compiler
   ┌────────────────────────────────────────────────────────────────┐
   │                                                                │
   │  run(callback)                                                 │
   │   │                                                            │
   │   ├─① this.hooks.run.call()     ← Trigger "run" hook         │
   │   │     └─ Plugins đã tap vào hook này sẽ execute             │
   │   │        (VD: WebpackRunPlugin log "Bắt đầu compile!")      │
   │   │                                                            │
   │   ├─② this.compile(onCompiled)  ← Gọi compile function       │
   │   │     │                                                      │
   │   │     └─ compile(callback) {                                │
   │   │          // ⭐ MỖI LẦN compile → Compilation MỚI         │
   │   │          let compilation = new Compilation(this.options);  │
   │   │          compilation.build(callback);                      │
   │   │        }                                                   │
   │   │                                                            │
   │   └─③ onCompiled → this.hooks.done.call()  ← "done" hook    │
   │         └─ Plugins đã tap "done" sẽ execute                   │
   │            (VD: WebpackDonePlugin log "Compile xong!")         │
   │                                                                │
   └────────────────────────────────────────────────────────────────┘


════════════════════════════════════════════════════════════════════
COMPILATION INITIALIZATION — TRẠNG THÁI BAN ĐẦU
════════════════════════════════════════════════════════════════════

   Khi compile() tạo new Compilation(options):

   ┌── Compilation ──────────────────────────────────────────────┐
   │                                                              │
   │  this.options          = options;                            │
   │  this.modules          = [];    // Tất cả modules đã compile│
   │  this.chunks           = [];    // Tất cả code blocks       │
   │  this.assets           = {};    // File output (key=tên)    │
   │  this.fileDependencies = [];    // Files liên quan (watch)  │
   │                                                              │
   │  ┌────────────────────────────────────────────────────────┐ │
   │  │                                                        │ │
   │  │         (trống — chưa có gì)                           │ │
   │  │                                                        │ │
   │  │   ← build() sẽ điền dữ liệu vào đây                  │ │
   │  │                                                        │ │
   │  └────────────────────────────────────────────────────────┘ │
   │                                                              │
   │  Sau khởi tạo → gọi build(callback) để bắt đầu compile    │
   │                                                              │
   └──────────────────────────────────────────────────────────────┘


════════════════════════════════════════════════════════════════════
BƯỚC 5: TÌM TẤT CẢ ENTRY POINTS
════════════════════════════════════════════════════════════════════

   ┌──────────────────────────────────────────────────────────┐
   │  build(callback) {                                        │
   │    // Chuẩn hóa entry format:                            │
   │    let entry = {};                                        │
   │    if (typeof this.options.entry === "string") {          │
   │      entry.main = this.options.entry;                    │
   │      // "xx" → { main: "xx" }                            │
   │    } else {                                               │
   │      entry = this.options.entry;                         │
   │    }                                                      │
   │    // Hỗ trợ cả single entry và multi entry              │
   │  }                                                        │
   └──────────────────────────────────────────────────────────┘

   VÍ DỤ KẾT QUẢ:

   entry: "./src/index.js"               entry: { main: "./src/index.js",
         │                                         app: "./src/app.js" }
         │  chuẩn hóa                              │  giữ nguyên
         ▼                                         ▼
   { main: "./src/index.js" }             { main: "./src/index.js",
                                            app: "./src/app.js" }

   → Sau chuẩn hóa: LUÔN là object
   → Duyệt entries bằng Object.entries(entry) thống nhất

   ⚠️ Tại sao chuẩn hóa?
   → Nếu không, phải if/else xử lý 2 format khác nhau
   → Chuẩn hóa 1 lần → code xử lý đơn giản hơn nhiều
```

### Bước 6: Compile Modules Với Loader

```
════════════════════════════════════════════════════════════════════
BƯỚC 6: TỪ ENTRY, GỌI LOADER COMPILE TỪNG MODULE
════════════════════════════════════════════════════════════════════

   TỔNG QUAN — 3 bước lớn trong build():

   ┌──────────────────────────────────────────────────────────────┐
   │                                                              │
   │  Bước 5: Tìm entry → { main: "./src/index.js" }            │
   │                │                                             │
   │                ▼                                             │
   │  Bước 6: Từ entry, Loader compile từng module               │
   │                │                                             │
   │                ▼                                             │
   │  Bước 8: Tổ hợp modules → chunks                           │
   │                                                              │
   └──────────────────────────────────────────────────────────────┘


DUYỆT ENTRY — QUÁ TRÌNH CHI TIẾT:
─────────────────────────────────────────────────

  entry = { main: "./src/index.js" }
       │
       │  Object.entries(entry).forEach(([name, path]) => { ... })
       │
       ▼
  ┌─────────────────────────────────────────────────────────┐
  │  6.1: Thêm absolute path vào fileDependencies          │
  │       → this.fileDependencies.push(absolutePath)        │
  │       → Mục đích: track files cần watch                │
  │                                                         │
  │  KẾT QUẢ:                                              │
  │  this.fileDependencies = [đường dẫn tuyệt đối index.js]  │
  └─────────────────────────────┬───────────────────────────┘
                                │
                                ▼
  ┌─────────────────────────────────────────────────────────┐
  │  6.2: Gọi buildModule(name, modulePath)                 │
  │       → Xây dựng module object từ entry file            │
  │                                                         │
  │       ┌──────────────────────────────────────────────┐  │
  │       │  buildModule bên trong:                      │  │
  │       │                                              │  │
  │       │  (6.2.1) Đọc source code từ file             │  │
  │       │    let source = fs.readFileSync(path, "utf8")│  │
  │       │                                              │  │
  │       │  (6.2.2) Tạo module object                   │  │
  │       │    let module = {                            │  │
  │       │      id: "./src/index.js",                   │  │
  │       │      names: ["main"],                        │  │
  │       │      dependencies: [],                       │  │
  │       │      _source: ""                             │  │
  │       │    };                                        │  │
  │       │                                              │  │
  │       │  (6.2.3) Tìm Loader → chuyển đổi source     │  │
  │       │    rules.forEach(rule => {                   │  │
  │       │      if (path.match(rule.test))              │  │
  │       │        loaders.push(...rule.use)             │  │
  │       │    });                                       │  │
  │       │    source = loaders.reduceRight(             │  │
  │       │      (code, loader) => loader(code),         │  │
  │       │      source                                  │  │
  │       │    );                                        │  │
  │       │                                              │  │
  │       │  → Sau Loader: source PHẢI LÀ JS            │  │
  │       └──────────────────────────────────────────────┘  │
  │                                                         │
  │  KẾT QUẢ: nhận được module object của entry             │
  └─────────────────────────────┬───────────────────────────┘
                                │
                                ▼
  ┌─────────────────────────────────────────────────────────┐
  │  6.3: Push module object vào this.modules               │
  │       → this.modules.push(entryModule)                  │
  └─────────────────────────────────────────────────────────┘


⚠️ SAU LOADER: source code PHẢI LÀ JS
→ Vì tiếp theo cần parse thành AST (babel-parser)
→ Chỉ JS mới parse được AST


COMPILATION STATE SAU BƯỚC 6:
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│  this.modules = [                                           │
│    { id: "./src/index.js", names: ["main"],                │
│      dependencies: [], _source: "" }                       │
│  ]                                                          │
│  this.chunks           = []                                 │
│  this.assets           = {}                                 │
│  this.fileDependencies = [đường dẫn tuyệt đối index.js]    │
│                                                             │
│  → Mới chỉ có entry module                                 │
│  → Dependencies chưa được tìm → Bước 7 sẽ xử lý          │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Bước 7: Recursive Compile Dependencies (Phức Tạp Nhất!)

```
════════════════════════════════════════════════════════════════════
BƯỚC 7: TÌM VÀ COMPILE DEPENDENT MODULES — PHỨC TẠP NHẤT!
════════════════════════════════════════════════════════════════════

10 bước nhỏ bên trong:

7.1  → Parse source code → AST
7.2  → Tìm require() trong AST → tên + path modules phụ thuộc
7.3  → Push absolute path vào fileDependencies
7.4  → Generate module ID cho dependent module
7.5  → Sửa AST: require("./name") → require("./src/name.js")
7.6  → Push dependency info vào module.dependencies
7.7  → Generate code mới từ AST → module._source
7.8  → Recursive: compile dependent modules (gọi lại buildModule)
7.9  → Push dependent module objects vào this.modules
7.10 → Trả về entry module object

┌──────────────────────────────────────────────────────────┐
│  // Dùng Babel để xử lý AST:                            │
│  const parser = require("@babel/parser");      // Parse │
│  const traverse = require("@babel/traverse");  // Duyệt │
│  const types = require("@babel/types");        // Tạo   │
│  const generator = require("@babel/generator"); // Gen  │
└──────────────────────────────────────────────────────────┘


ENTRY MODULE XỬ LÝ — FLOW TOÀN CẢNH:
══════════════════════════════════════

   Quá trình xử lý entry                     Kết quả xử lý entry
   ─────────────────────                     ───────────────────

   ┌──────────────────────────────────┐
   │  6.1: Đưa đường dẫn tuyệt đối   │    this.fileDependencies
   │    của entry file vào            │    = [đường dẫn tuyệt đối
   │    fileDependencies,             │       của index.js]
   │    ghi nhận module phụ thuộc     │
   └──────────┬───────────────────────┘
              │
              ▼
   ┌──────────────────────────────────┐
   │  6.2: Thực thi hàm buildModule, │    Gọi buildModule("main",
   │    nhận được module object       │    "./src/index.js")
   │    của entry                     │
   └──────────┬───────────────────────┘
              │
              │  Thực thi hàm buildModule ─────────────────────►
              │
              │    ┌──────────────────────────────────────┐
              │    │  (6.2.1) Đọc nội dung module,        │
              │    │          lấy source code              │
              │    └──────────┬───────────────────────────┘
              │               │
              │               ▼
              │    ┌──────────────────────────────────────┐
              │    │  (6.2.2) Tạo một module object        │
              │    │                                      │
              │    │  let module = {                      │
              │    │    id: "./src/index.js",             │
              │    │    names: ["main"],                  │
              │    │    dependencies: [],                 │
              │    │    _source: ""                       │
              │    │  };                                  │
              │    └──────────┬───────────────────────────┘
              │               │
              │               ▼
              │    ┌──────────────────────────────────────┐
              │    │  (6.2.3) Tìm Loader tương ứng để    │
              │    │    biên dịch chuyển đổi source code  │
              │    └──────────┬───────────────────────────┘
              │               │
              │  ◄────────────┘  nhận được module object
              │
              ▼
   ┌──────────────────────────────────┐
   │  6.3: Đưa module object của     │    this.modules = [
   │    entry file, push vào         │      module object của
   │    this.modules                 │      index.js
   └──────────────────────────────────┘


════════════════════════════════════════════════════════════════════
BƯỚC 7: PHÂN TÍCH DEPENDENCIES — PHỨC TẠP NHẤT!
════════════════════════════════════════════════════════════════════

   Bước 7: Tìm ra các module phụ thuộc, rồi biên dịch chúng

   Source Code (sau Loader transform)
        │
        ▼
   ┌─────────────────────────────────────────────────────────┐
   │  7.1: Parse source code → AST                          │
   │       parser.parse(sourceCode) → ast                   │
   └─────────┬───────────────────────────────────────────────┘
             │
             ▼
   ┌─────────────────────────────────────────────────────────┐
   │  7.2: Trong AST tìm câu lệnh require,                  │
   │       tìm ra tên module và đường dẫn tương đối          │
   │                                                         │
   │       traverse(ast, {                                   │
   │         CallExpression(nodePath) {                      │
   │           if (callee.name === "require") {              │
   │             depModuleName = node.arguments[0].value     │
   │             // → "./name", "./age"                      │
   │           }                                             │
   │         }                                               │
   │       })                                                │
   └─────────┬───────────────────────────────────────────────┘
             │
             ▼
   ┌─────────────────────────────────────────────────────────┐
   │  7.3: Push đường dẫn tuyệt đối của                      │
   │       module phụ thuộc vào fileDependencies              │
   │                                                         │
   │       this.fileDependencies = [                         │
   │         đường dẫn tuyệt đối index.js,                   │
   │         đường dẫn tuyệt đối name.js,                    │
   │         đường dẫn tuyệt đối age.js                      │
   │       ]                                                 │
   └─────────┬───────────────────────────────────────────────┘
             │
             ▼
   ┌─────────────────────────────────────────────────────────┐
   │  7.4: Tạo module ID cho module phụ thuộc                │
   │       depModuleId = "./" + relative(baseDir, depPath)  │
   │       → "./src/name.js", "./src/age.js"                │
   └─────────┬───────────────────────────────────────────────┘
             │
             ▼
   ┌─────────────────────────────────────────────────────────┐
   │  7.5: Sửa cấu trúc cú pháp, đổi module phụ thuộc      │
   │       thành module ID                                    │
   │                                                         │
   │       require("./name") → require("./src/name.js")     │
   │       require("./age")  → require("./src/age.js")      │
   └─────────┬───────────────────────────────────────────────┘
             │
             ▼
   ┌─────────────────────────────────────────────────────────┐
   │  7.6: Push thông tin module phụ thuộc vào               │
   │       thuộc tính module.dependencies                     │
   └─────────┬───────────────────────────────────────────────┘
             │
             ▼
   ┌─────────────────────────────────────────────────────────┐
   │  7.7: Sinh code mới, đưa source code sau chuyển đổi     │
   │       vào thuộc tính module._source                      │
   │                                                         │
   │       { code } = generator(ast)                         │
   │       module._source = code                             │
   └─────────┬───────────────────────────────────────────────┘
             │
             │   Biên dịch đệ quy các module phụ thuộc
             ▼
   ┌─────────────────────────────────────────────────────────┐
   │  7.8: Biên dịch các module phụ thuộc (duyệt qua        │
   │       dependencies trong module, gọi buildModule)       │
   │                                                         │
   │       module.dependencies.forEach(dep => {              │
   │         // Kiểm tra đã biên dịch chưa                   │
   │         let existing = this.modules.find(              │
   │           m => m.id === dep.depModuleId                 │
   │         );                                              │
   │         if (existing) {                                 │
   │           // Đã biên dịch → chỉ thêm chunk name         │
   │           existing.names.push(name);                    │
   │         } else {                                        │
   │           // Chưa biên dịch → buildModule → push       │
   │           let depModule = this.buildModule(             │
   │             name, dep.depModulePath                     │
   │           );                                            │
   │           this.modules.push(depModule);                 │
   │         }                                               │
   │       });                                               │
   └─────────┬───────────────────────────────────────────────┘
             │
             ▼
   ┌─────────────────────────────────────────────────────────┐
   │  7.9:  Sau khi biên dịch xong tất cả module phụ thuộc,  │
   │        push module object vào this.modules              │
   └─────────┬───────────────────────────────────────────────┘
             │
             ▼
   ┌─────────────────────────────────────────────────────────┐
   │  7.10: Đợi tất cả module phụ thuộc biên dịch xong,     │
   │        trả về module object của entry                    │
   └─────────────────────────────────────────────────────────┘


VÍ DỤ CỤ THỂ — KẾT QUẢ SAU BƯỚC 7:
─────────────────────────────────────

  Module object của entry = {
    id: "./src/index.js",
    names: ["main"],
    dependencies: [
      { depModuleId: "./src/name.js", kết quả buildModule },
      { depModuleId: "./src/age.js",  kết quả buildModule }
    ],
    _source: "// source code của entry sau chuyển đổi"
  };

  this.modules = [
    module object của name.js,
    module object của age.js,
    module object của index.js
  ]

  this.fileDependencies = [
    đường dẫn tuyệt đối index.js,
    đường dẫn tuyệt đối name.js,
    đường dẫn tuyệt đối age.js
  ]


MULTI-ENTRY OPTIMIZATION:
┌─────────────────────────────────────────────────┐
│  Module A được cả entry1 và entry2 require      │
│  → KHÔNG compile 2 lần!                         │
│  → Lần 1: compile bình thường, names: ["main"]  │
│  → Lần 2: chỉ push name → names: ["main","app"]│
│  → 1 module thuộc NHIỀU chunks                   │
└─────────────────────────────────────────────────┘
```

### Bước 8-10: Tổ Hợp Và Output

```
════════════════════════════════════════════════════════════════════
BƯỚC 8: TỔ HỢP MODULES THÀNH CHUNKS
════════════════════════════════════════════════════════════════════

   Sau khi tất cả module đã biên dịch xong, dựa trên quan hệ
   phụ thuộc, tổ hợp thành code block (chunk)

   8.1: Mỗi entry file sẽ tạo ra một chunk tương ứng,
        mỗi chunk chứa entry module và các module phụ thuộc

   8.2: Push chunk object vào this.chunks

   ┌──────────────────────────────────────────────────────────┐
   │  // Mỗi entry → 1 chunk                                 │
   │  let chunk = {                                            │
   │    name: entryName,        // "main"                     │
   │    entryModule,            // Module object của entry    │
   │    modules: this.modules.filter(                         │
   │      m => m.names.includes(entryName)                    │
   │    ),                       // Modules thuộc chunk này   │
   │  };                                                       │
   │  this.chunks.push(chunk);                                │
   └──────────────────────────────────────────────────────────┘

   VÍ DỤ CỤ THỂ — chunk object:

   let chunk = {
     name: "main",
     entryModule: "module object của src/index.js",
     modules: [
       module object của name.js,
       module object của age.js,
       module object của index.js
     ]
   };


COMPILATION STATE SAU BƯỚC 8:
┌──────────────────────────────────────────────────────────────┐
│                                                              │
│  this.modules = [                                            │
│    module object của name.js,                               │
│    module object của age.js,                                │
│    module object của index.js                               │
│  ]                                                           │
│                                                              │
│  this.chunks = [                                             │
│    { chunk object của "main" }                               │
│  ]                                                           │
│                                                              │
│  this.assets = {}          ← Bước 9 sẽ điền                │
│                                                              │
│  this.fileDependencies = [                                   │
│    đường dẫn tuyệt đối index.js,                             │
│    đường dẫn tuyệt đối name.js,                              │
│    đường dẫn tuyệt đối age.js                                │
│  ]                                                           │
│                                                              │
└──────────────────────────────────────────────────────────────┘


════════════════════════════════════════════════════════════════════
BƯỚC 9: CHUYỂN CHUNKS → FILES — GENERATE OUTPUT CODE
════════════════════════════════════════════════════════════════════

   FLOW CHI TIẾT — 3 bước nhỏ:

   ┌─────────────────────────────────────────────────────────┐
   │  9.1: Duyệt this.chunks                                 │
   └─────────┬───────────────────────────────────────────────┘
             │
             ▼
   ┌─────────────────────────────────────────────────────────┐
   │  9.2: Với mỗi chunk, kết hợp output.filename           │
   │       tạo ra filename và runtime code                   │
   │                                                         │
   │       filename = output.filename                        │
   │         .replace("[name]", chunk.name)                   │
   │       → "main.js"                                       │
   └─────────┬───────────────────────────────────────────────┘
             │
             ▼
   ┌─────────────────────────────────────────────────────────┐
   │  9.3: Đặt vào this.assets                               │
   │       this.assets[filename] = getSource(chunk)          │
   └─────────────────────────────────────────────────────────┘

   RUNTIME CODE — hàm getSource():

   ┌──────────────────────────────────────────────────────────┐
   │  function getSource(chunk) {                             │
   │    return `                                               │
   │      (() => {                                             │
   │        var modules = {                                    │
   │          ${chunk.modules.map(m => `                       │
   │            "${m.id}": (module) => { ${m._source} }       │
   │          `)}                                              │
   │        };                                                 │
   │        var cache = {};                                    │
   │        function require(moduleId) {                      │
   │          if (cache[moduleId])                             │
   │            return cache[moduleId].exports;               │
   │          var module = cache[moduleId] = { exports: {} }; │
   │          modules[moduleId](module);                      │
   │          return module.exports;                           │
   │        }                                                  │
   │        ${chunk.entryModule._source}                      │
   │      })();                                                │
   │    `;                                                     │
   │  }                                                        │

   COMPILATION STATE SAU BƯỚC 9:
   ┌──────────────────────────────────────────────────┐
   │  this.assets = { "main.js": "template code" }   │
   │  → Bước 10 sẽ ghi ra file system                │
   └──────────────────────────────────────────────────┘
   OUTPUT CODE STRUCTURE:
   ┌──────────────────────────────────────────────────────────┐
   │                                                           │
   │  (() => {                                                 │
   │    // ① MODULES OBJECT — tất cả modules                 │
   │    var modules = {                                        │
   │      "./src/name.js": (module) => {                      │
   │        module.exports = "Xin đừng hói đầu";              │
   │      },                                                   │
   │      "./src/age.js": (module) => {                       │
   │        module.exports = "99";                             │
   │      },                                                   │
   │    };                                                     │
   │                                                           │
   │    // ② CACHE + REQUIRE — runtime                       │
   │    var cache = {};                                        │
   │    function require(moduleId) { ... }                    │
   │                                                           │
   │    // ③ ENTRY CODE — chạy entry module                  │
   │    const name = require("./src/name.js");                │
   │    const age = require("./src/age.js");                  │
   │    console.log("Entry in thông tin", name, age);          │
   │  })();                                                    │
   │                                                           │
   └──────────────────────────────────────────────────────────┘


════════════════════════════════════════════════════════════════════
BƯỚC 10: GHI RA FILE SYSTEM
════════════════════════════════════════════════════════════════════

   ┌──────────────────────────────────────────────────────────┐
   │  for (let filename in stats.assets) {                    │
   │    let filePath = path.join(output.path, filename);      │
   │    fs.writeFileSync(filePath, stats.assets[filename]);   │
   │  }                                                        │
   │                                                           │
   │  → this.assets["main.js"] → dist/main.js                │
   │  → Ghi nội dung lên ổ cứng                              │
   │  → XONG! 🎉                                              │
   └──────────────────────────────────────────────────────────┘

   COMPILATION STATE CUỐI CÙNG:
   ┌──────────────────────────────────────────────────────┐
   │  this.modules          = [3 module objects]          │
   │  this.chunks           = [1 chunk object "main"]     │
   │  this.assets           = { "main.js": "..." }       │
   │  this.fileDependencies = [3 absolute paths]          │
   │                                                      │
   │  → Trả về cho Compiler                              │
   │  → Compiler trigger hooks.done                      │
   │  → callback(err, stats, fileDependencies)            │
   └──────────────────────────────────────────────────────┘
```

---

## 9. Watch Mode

```
════════════════════════════════════════════════════════════════════
WATCH MODE — TỰ ĐỘNG COMPILE LẠI KHI FILE THAY ĐỔI
════════════════════════════════════════════════════════════════════

TẠI SAO CÓ this.fileDependencies?
→ Để implement WATCH MODE!

┌──────────────────────────────────────────────────────────┐
│                                                           │
│  const onCompiled = (err, stats, fileDependencies) => {  │
│    // Ghi file output (bước 10)                          │
│    // ...                                                 │
│                                                           │
│    // WATCH: theo dõi TẤT CẢ files liên quan            │
│    fileDependencies.forEach(file => {                    │
│      fs.watch(file, () => {                              │
│        this.compile(onCompiled); // Compile LẠI!         │
│      });                                                  │
│    });                                                    │
│  };                                                       │
│                                                           │
└──────────────────────────────────────────────────────────┘

FLOW:
  Compile lần 1 → Thu thập fileDependencies
                 → Watch tất cả files
                 → File thay đổi → compile() lại
                 → Tạo Compilation MỚI (Compiler giữ nguyên)
                 → Thu thập fileDependencies mới
                 → Watch lại...

TẠI SAO Compiler + Compilation TÁCH RỜI?

  ┌─────────────────────────────────────────────────────┐
  │  Compiler = Không đổi (config, hooks)               │
  │  Compilation = Mới mỗi lần compile (modules, chunks)│
  │                                                      │
  │  Watch mode: file thay đổi                           │
  │  → KHÔNG tạo Compiler mới                            │
  │  → CHỈ tạo Compilation mới                           │
  │  → Tái sử dụng config + hooks                        │
  │  → Plugins chỉ mount 1 LẦN                           │
  └─────────────────────────────────────────────────────┘
```

---

## 10. Tổng Hợp & Quick Reference

```
┌─────────────────────────────────────────────────────────────────┐
│  WEBPACK DESIGN PHILOSOPHY — SUMMARY                             │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  CORE IDEA:                                                      │
│  Source code → Thu thập module info → Generate output file       │
│  Entry → Dependencies → Modules object + require() + IIFE      │
│                                                                  │
│  ARCHITECTURE:                                                   │
│  Compiler (quản gia) → Compilation (đầu bếp)                   │
│  Compiler = singleton, giữ config + hooks                       │
│  Compilation = mới mỗi lần, giữ modules + chunks               │
│                                                                  │
│  TAPABLE:                                                        │
│  Event flow system = cầu nối xuyên suốt build process           │
│  tap() = subscribe, call() = publish                             │
│                                                                  │
│  PLUGIN = Class + apply(compiler) + tap vào hooks               │
│  LOADER = Function + nhận source → trả source đã transform     │
│                                                                  │
│  10 BƯỚC:                                                        │
│  1-3: Setup (config, Compiler, plugins)                          │
│  4-5: Start compile (run, entry)                                 │
│  6:   Loader transform                                           │
│  7:   AST parse + recursive dependencies (PHỨC TẠP NHẤT)       │
│  8-9: Assemble chunks + generate output                          │
│  10:  Write to disk                                              │
│                                                                  │
│  WATCH MODE: fileDependencies + fs.watch → recompile            │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Quick Reference

```
WEBPACK = function(config) → compiler → compiler.run() → output

CORE FLOW:
  Config → Compiler → Plugins Mount → run()
  → Compilation.build() → Entry → Loaders → AST
  → Dependencies (recursive) → Chunks → Output → Disk

COMPILER vs COMPILATION:
  Compiler:    Singleton, config + hooks, run() + compile()
  Compilation: Mới mỗi lần, modules + chunks + assets

TAPABLE (Event System):
  new SyncHook()       → Tạo hook
  hook.tap("name", fn) → Subscribe
  hook.call(args)      → Publish/Trigger

PLUGIN:
  class MyPlugin {
    apply(compiler) {
      compiler.hooks.run.tap("MyPlugin", () => { ... });
    }
  }
  → Mount: plugin.apply(compiler) trong webpack()

LOADER:
  const myLoader = (source) => { return transformedSource; }
  → Chạy RIGHT-TO-LEFT: use: [a, b, c] → c → b → a
  → Output PHẢI LÀ JS (vì cần parse AST)

AST PROCESSING (Bước 7 — phức tạp nhất):
  parser.parse()   → Source → AST
  traverse()       → Tìm require() calls
  types.*          → Modify AST nodes
  generator()      → AST → New Source Code

MODULE OBJECT:
  { id, names[], dependencies[], _source }

CHUNK OBJECT:
  { name, entryModule, modules[] }

OUTPUT:
  IIFE wrapping: modules object + require() + entry code

WATCH MODE:
  fileDependencies → fs.watch() → compile() lại
  → Compiler giữ nguyên, Compilation tạo mới
```

---

## 11. Câu Hỏi Phỏng Vấn

```
Q1: Mô tả quy trình đóng gói của Webpack?
A: 10 bước: Đọc config → Khởi tạo Compiler → Mount plugins
   → run() trigger hooks → Tìm entry → Loader transform
   → Parse AST tìm dependencies → Recursive compile
   → Tổ hợp chunks → Generate output → Ghi ra disk.

Q2: Compiler và Compilation khác nhau thế nào?
A: Compiler = "quản gia", singleton, giữ config + lifecycle hooks,
   chạy xuyên suốt 3 giai đoạn (trước/trong/sau compile).
   Compilation = "đầu bếp", tạo MỚI mỗi lần compile, giữ
   modules/chunks/assets. Tách vì watch mode: file thay đổi →
   chỉ tạo Compilation mới, Compiler giữ nguyên.

Q3: Plugin và Loader khác nhau thế nào?
A: Loader = function đơn giản, chuyển đổi FILE content (input → output),
   chạy right-to-left, output phải là JS.
   Plugin = class có apply(), tap vào lifecycle hooks của Compiler,
   mở rộng TOÀN BỘ build workflow, chạy tại bất kỳ thời điểm nào.

Q4: Tại sao Loader chạy từ phải sang trái?
A: Thiết kế theo functional programming compose pattern:
   compose(a, b, c)(input) = a(b(c(input)))
   use: [style-loader, css-loader, sass-loader]
   → sass-loader(source) → css-loader(result) → style-loader(final)
   Mỗi loader nhận output của loader trước làm input.

Q5: Tapable là gì? Tại sao Webpack dùng nó?
A: Tapable = event flow library, giống EventEmitter nhưng cho
   custom events. Webpack dùng nó để tạo lifecycle hooks system.
   Plugin tap() vào hooks → Webpack call() hooks tại đúng thời điểm.
   Đây là CẦU NỐI giữa Webpack core và plugin ecosystem.

Q6: Module object trong Webpack chứa gì?
A: { id: "./src/index.js" (relative path),
     names: ["main"] (thuộc chunk nào, có thể nhiều),
     dependencies: [{depModuleId, depModulePath}],
     _source: "transformed source code" }

Q7: Chunk là gì? Chunk được tạo như thế nào?
A: Chunk = code block, mỗi entry → 1 chunk.
   Chunk chứa entry module + TẤT CẢ dependent modules.
   Sau compile xong → filter modules theo names[] → tạo chunk.
   Multi-entry: 1 module có thể thuộc NHIỀU chunks.

Q8: Watch mode hoạt động thế nào?
A: Trong quá trình compile, thu thập fileDependencies (tất cả
   files liên quan). Sau compile xong, dùng fs.watch() theo dõi.
   File thay đổi → gọi compile() lại → Compilation MỚI.
   Compiler giữ nguyên (plugins vẫn mount, hooks vẫn đăng ký).

Q9: Tại sao output là IIFE?
A: IIFE tạo scope riêng biệt, tránh ô nhiễm global scope.
   Bên trong: modules object (key = path, value = factory function),
   require() function tự viết (browser không có), entry code.
   Mỗi module wrapped trong factory function → isolation.

Q10: AST được dùng ở bước nào? Tại sao cần AST?
A: Bước 7: sau Loader transform xong (source phải là JS).
  → parser.parse() source → AST
  → traverse() tìm require() calls → xác định dependencies
  → types.* modify AST (đổi path require)
  → generator() tạo source code mới
  Cần AST vì: phân tích chính xác, không dùng regex (dễ sai).

Q11: Tự viết Webpack mini cần bao nhiêu dòng?
A: ~100 dòng cho core flow. Cần: Compiler class, Compilation class,
   webpack() function, buildModule(), getSource(), và AST tools
   (babel-parser, traverse, types, generator).
   Core KHÔNG phức tạp — phức tạp là ở ECOSYSTEM.
```

---

## Checklist Học Tập

- [ ] Hiểu Webpack bản chất là function: webpack(config) → compiler → run()
- [ ] Phân biệt Compiler (quản gia, singleton) vs Compilation (đầu bếp, mới mỗi lần)
- [ ] Hiểu Tapable: tap() subscribe, call() publish — cầu nối build process
- [ ] Biết Plugin: class + apply(compiler) + tap vào lifecycle hooks
- [ ] Biết Loader: function đơn giản, right-to-left, output phải là JS
- [ ] Phân biệt Loader vs Plugin: file transform vs workflow extension
- [ ] Hiểu 10 bước implement Webpack từ đầu
- [ ] Biết Bước 7 phức tạp nhất: AST parse + recursive dependencies
- [ ] Hiểu AST flow: parser → traverse → types → generator
- [ ] Biết Module object: { id, names[], dependencies[], \_source }
- [ ] Biết Chunk object: { name, entryModule, modules[] }
- [ ] Hiểu Watch mode: fileDependencies + fs.watch() → recompile
- [ ] Biết output format: IIFE + modules object + require() + entry code
- [ ] Hiểu tại sao Compiler/Compilation tách rời (decoupling + watch mode)
- [ ] Biết Loader execution order: reduceRight (right-to-left)

---

_Cập nhật lần cuối: Tháng 2, 2026_
