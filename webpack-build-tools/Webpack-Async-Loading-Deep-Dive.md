# Webpack Async Loading (Lazy Loading) — Nguyên Lý Từ Bên Trong

> Phân tích chi tiết nguyên lý lazy loading của Webpack thông qua build artifacts: JSONP, code splitting, import() và toàn bộ flow từ click → load chunk → execute module.
> Độ khó: ⭐️⭐️ | Thời gian đọc: ~20 phút

---

## Table of Contents

1. [Câu Hỏi Mở Đầu](#1-câu-hỏi-mở-đầu)
2. [Kiến Thức Tiền Đề — Lazy Loading & Code Splitting](#2-kiến-thức-tiền-đề--lazy-loading--code-splitting)
3. [Cấu Hình Chung](#3-cấu-hình-chung)
4. [import() — Sử Dụng Cơ Bản](#4-import--sử-dụng-cơ-bản)
5. [Phân Tích Nguyên Lý — 4 Bước](#5-phân-tích-nguyên-lý--4-bước)
6. [Code Tổng Thể (Đã Tối Ưu)](#6-code-tổng-thể-đã-tối-ưu)
7. [Tổng Kết](#7-tổng-kết)

---

## 1. Câu Hỏi Mở Đầu

Trước khi bắt đầu, hãy thử trả lời các câu hỏi phỏng vấn thường gặp sau:

```
CÂU HỎI PHỎNG VẤN:
═══════════════════════════════════════════════════════════════

  ❶ Làm thế nào để thực hiện lazy loading
     trong dự án build bằng Webpack?

  ❷ Webpack có những phương pháp code splitting nào?

  ❸ Nguyên lý bên trong lazy loading của Webpack là gì?

  ❹ JSONP đóng vai trò gì trong async loading?

  ❺ Tại sao lazy loading giúp tăng tốc initial load?
```

> Sau khi đọc xong bài viết, bạn sẽ trả lời được **tất cả** câu hỏi trên.

---

## 2. Kiến Thức Tiền Đề — Lazy Loading & Code Splitting

### Lazy Loading Là Gì?

**Lazy loading** (on-demand loading) = chia code thành các **điểm ngắt logic**, chỉ tải code khi **thực sự cần thiết**.

```
LAZY LOADING:
═══════════════════════════════════════════════════════════════

  TRƯỚC (Tải hết cùng lúc):
  ┌──────────────────────────────────────────────────────────┐
  │  main.js (500KB)                                         │
  │  ┌─────────┬───────────┬──────────┬──────────┬─────────┐│
  │  │ Core    │ Dashboard │ Profile  │ Settings │ Chart   ││
  │  │ 100KB   │ 150KB     │ 80KB     │ 70KB     │ 100KB   ││
  │  └─────────┴───────────┴──────────┴──────────┴─────────┘│
  └──────────────────────────────────────────────────────────┘
  → Tải 500KB ngay lần đầu → CHẬM! ❌

  SAU (Lazy loading):
  ┌──────────────────┐
  │  main.js (100KB) │ ← Chỉ tải Core
  └──────────────────┘
       Khi cần ↓
  ┌───────────┐ ┌──────────┐ ┌──────────┐ ┌─────────┐
  │ Dashboard │ │ Profile  │ │ Settings │ │ Chart   │
  │ 150KB     │ │ 80KB     │ │ 70KB     │ │ 100KB   │
  └───────────┘ └──────────┘ └──────────┘ └─────────┘
  → Initial load chỉ 100KB → NHANH! ✅
```

> Bản chất lazy loading = **code splitting** (chia code) + **tải theo yêu cầu**.

### 3 Phương Pháp Code Splitting Trong Webpack

```
3 CÁCH CODE SPLITTING:
═══════════════════════════════════════════════════════════════

  ❶ ENTRY POINTS — Chia thủ công qua cấu hình entry
  ┌─────────────────────────────────────────────────────────┐
  │  entry: {                                               │
  │    app: './src/app.js',                                 │
  │    admin: './src/admin.js'                              │
  │  }                                                      │
  │  → 2 bundle riêng biệt                                 │
  └─────────────────────────────────────────────────────────┘

  ❷ PREVENT DUPLICATION — SplitChunksPlugin
  ┌─────────────────────────────────────────────────────────┐
  │  optimization: {                                        │
  │    splitChunks: { chunks: 'all' }                       │
  │  }                                                      │
  │  → Tự động tách code trùng lặp                         │
  └─────────────────────────────────────────────────────────┘

  ❸ DYNAMIC IMPORT — import() ⭐️ TRỌNG TÂM BÀI NÀY
  ┌─────────────────────────────────────────────────────────┐
  │  import('./module').then(module => { ... })              │
  │  → Tách thành chunk riêng, tải khi cần                 │
  └─────────────────────────────────────────────────────────┘
```

### import() Syntax

```
import() — DYNAMIC IMPORT:
═══════════════════════════════════════════════════════════════

  Đặc điểm:
  ✅ Nhận 1 tham số: đường dẫn module
  ✅ Trả về Promise
  ✅ Tự động tách module thành chunk riêng
  ✅ Browser chạy đến dòng code → tự động request chunk
  ✅ Tuân theo ECMAScript proposal

  Ứng dụng phổ biến nhất: LAZY LOADING ROUTES
```

> Webpack cũng có `require.ensure` (cũ, **không khuyên dùng**). Bài này chỉ tập trung vào `import()`.

---

## 3. Cấu Hình Chung

```javascript
// webpack.config.js
const path = require("path");

module.exports = {
  mode: "development",
  devtool: false,
  entry: {
    main: "./src/main.js",
  },
  output: {
    filename: "main.js",
    path: path.resolve(__dirname, "./dist"),
  },
};
```

```json
// package.json (dependencies)
{
  "webpack": "^5.73.0",
  "webpack-cli": "^4.10.0"
}
```

---

## 4. import() — Sử Dụng Cơ Bản

### Source Code

```javascript
// src/main.js
const buttonEle = document.getElementById("button");

buttonEle.onclick = function () {
  import("./test").then((module) => {
    const print = module.default;
    print();
  });
};

// src/test.js
export default () => {
  console.log("Button đã được click!");
};
```

### Kết Quả Build

```
KẾT QUẢ ĐÓNG GÓI:
═══════════════════════════════════════════════════════════════

  dist/
  ├── main.js                 ← Entry bundle
  └── src_test_js.main.js     ← Async chunk (test.js)

  → Code splitting ĐÃ THỰC HIỆN!
  → test.js được tách thành file riêng
```

### HTML — Chỉ Import main.js

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <title>Webpack Lazy Loading</title>
  </head>
  <body>
    <button id="button">Click me!</button>
    <!-- CHỈ import main.js — KHÔNG import src_test_js.main.js -->
    <script src="./main.js"></script>
  </body>
</html>
```

### Hành Vi Trên Browser

```
NETWORK TAB — TRƯỚC KHI CLICK:
═══════════════════════════════════════════════════════════════

  ┌─────────────────────────────────┬────────┬────────────┐
  │  File                           │  Size  │  Status    │
  ├─────────────────────────────────┼────────┼────────────┤
  │  index.html                     │  0.3KB │  200 OK    │
  │  main.js                        │  12KB  │  200 OK    │
  └─────────────────────────────────┴────────┴────────────┘
  → Chỉ tải main.js — test.js CHƯA ĐƯỢC TẢI

  NETWORK TAB — SAU KHI CLICK BUTTON:
  ┌─────────────────────────────────┬────────┬────────────┐
  │  File                           │  Size  │  Status    │
  ├─────────────────────────────────┼────────┼────────────┤
  │  index.html                     │  0.3KB │  200 OK    │
  │  main.js                        │  12KB  │  200 OK    │
  │  src_test_js.main.js            │  1KB   │  200 OK    │ ← MỚI!
  └─────────────────────────────────┴────────┴────────────┘
  → test.js CHỈ ĐƯỢC TẢI KHI CLICK → Lazy loading thành công! ✅
```

---

## 5. Phân Tích Nguyên Lý — 4 Bước

### Tổng Quan Flow

```
FLOW TỔNG THỂ — LAZY LOADING:
═══════════════════════════════════════════════════════════════

  Click Button
      │
      ▼
  ┌─────────────────────────────────────────────────┐
  │  BƯỚC 1: JSONP load file chunk (src_test_js)    │
  │  → Tạo <script> tag → browser tải file          │
  └──────────────────────┬──────────────────────────┘
                         │
                         ▼
  ┌─────────────────────────────────────────────────┐
  │  BƯỚC 2: Execute chunk → merge module vào       │
  │  modules object của main.js                      │
  └──────────────────────┬──────────────────────────┘
                         │
                         ▼
  ┌─────────────────────────────────────────────────┐
  │  BƯỚC 3: Load module (require)                  │
  │  → Thực thi module code, lấy exports            │
  └──────────────────────┬──────────────────────────┘
                         │
                         ▼
  ┌─────────────────────────────────────────────────┐
  │  BƯỚC 4: Sử dụng exported content               │
  │  → module.default → gọi hàm                     │
  └─────────────────────────────────────────────────┘
```

---

### Bước 1 — JSONP Load Chunk

Khi click button, Webpack gọi `require.e()` để tải chunk:

```javascript
// main.js (đã build)
const buttonEle = document.getElementById("button");
buttonEle.onclick = function () {
  require.e("src_test_js"); // "src_test_js" = chunkName của test.js
};
```

#### Triển khai `require.e`

```javascript
// Nhận chunkId → tạo array promises → gọi require.j → trả Promise.all
require.e = function (chunkId) {
  let promises = [];
  require.j(chunkId, promises);
  return Promise.all(promises);
  // → Chỉ khi TẤT CẢ promises resolve → mới đi tiếp
};
```

#### Triển khai `require.j` — JSONP Core

```javascript
// Theo dõi chunks đã install: 0 = đã sẵn sàng
var installedChunks = {
  main: 0, // main chunk — đã load lúc đầu
};

require.j = function (chunkId, promises) {
  // Tạo Promise cho chunk này
  var promise = new Promise((resolve, reject) => {
    installedChunks[chunkId] = [resolve, reject];
    // installedChunks = {
    //   main: 0,
    //   "src_test_js": [resolve, reject]  ← pending!
    // }
  });
  promises.push(promise);

  // Tạo URL tới file chunk
  var url = require.publicPath + chunkId + ".main.js";
  // → "src_test_js.main.js"

  // JSONP: Tạo <script> tag để tải file
  let script = document.createElement("script");
  script.src = url;
  document.head.appendChild(script);
  // → Browser bắt đầu tải src_test_js.main.js
};
```

```
JSONP MECHANISM:
═══════════════════════════════════════════════════════════════

  require.e("src_test_js")
      │
      ▼
  require.j("src_test_js", promises)
      │
      ├─→ Tạo Promise → lưu [resolve, reject] vào installedChunks
      │
      ├─→ Tính URL: "" + "src_test_js" + ".main.js"
      │
      └─→ Tạo <script src="src_test_js.main.js">
          └─→ Thêm vào <head>
              └─→ Browser tự động tải file!

  TẠI SAO GỌI LÀ JSONP?
  ─────────────────────────────────────────
  Giống kỹ thuật JSONP truyền thống:
  1. Tạo <script> tag động
  2. Browser tải file JS từ server
  3. File JS tự thực thi → gọi callback
  4. Không bị CORS chặn (khác fetch/XHR)
```

---

### Bước 2 — Execute Chunk & Merge Modules

Sau khi browser tải xong `src_test_js.main.js`, nó **tự động thực thi** nội dung file:

#### Nội dung file chunk (src_test_js.main.js)

```javascript
// File chunk đã build — src_test_js.main.js
self["webpackChunkstudy"].push([
  // Tham số 1: Array chunkIds
  ["src_test_js"],

  // Tham số 2: Object chứa module definitions
  {
    "./src/test.js": (modules, exports, require) => {
      require.defineProperty(exports, {
        default: () => WEBPACK_DEFAULT_EXPORT,
      });
      const WEBPACK_DEFAULT_EXPORT = () => {
        console.log("Button đã được click!");
      };
    },
  },
]);
```

> `self["webpackChunkstudy"]` = `window.webpackChunkstudy`. Tên `"study"` lấy từ trường `name` trong `package.json`.

#### Triển khai `webpackJsonpCallback`

```javascript
// modules ban đầu: object rỗng (vì không có sync module nào)
var modules = {};

// Hàm callback — được gọi khi chunk tải xong
function webpackJsonpCallback([chunkIds, moreModules]) {
  const resolves = [];

  for (let i = 0; i < chunkIds.length; i++) {
    const chunkId = chunkIds[i]; // "src_test_js"

    // Lấy resolve function từ installedChunks
    // installedChunks["src_test_js"] = [resolve, reject]
    resolves.push(installedChunks[chunkId][0]); // push resolve

    // Đánh dấu chunk đã load xong
    installedChunks[chunkId] = 0;
  }

  // MERGE modules: thêm module definitions vào modules object
  for (const moduleId in moreModules) {
    modules[moduleId] = moreModules[moduleId];
  }

  // Resolve TẤT CẢ promises → require.e().then() sẽ chạy tiếp
  while (resolves.length) {
    resolves.shift()(); // Gọi resolve()
  }
}

// Override push method → khi chunk gọi .push() → thực chất gọi callback
self.webpackChunkstudy = {};
self.webpackChunkstudy.push = webpackJsonpCallback;
```

```
TRẠNG THÁI SAU BƯỚC 2:
═══════════════════════════════════════════════════════════════

  installedChunks = {
    main: 0,              ← đã load từ đầu
    "src_test_js": 0      ← VỪA LOAD XONG
  }

  modules = {
    "./src/test.js": (modules, exports, require) => {
      require.defineProperty(exports, {
        default: () => WEBPACK_DEFAULT_EXPORT,
      });
      const WEBPACK_DEFAULT_EXPORT = () => {
        console.log("Button đã được click!");
      };
    }
  }
  → Module đã được MERGE vào modules object! ✅
  → Promise đã RESOLVE → .then() chain tiếp tục!
```

```
CHI TIẾT MERGE FLOW:
═══════════════════════════════════════════════════════════════

  TRƯỚC merge:                    SAU merge:
  ┌──────────────┐                ┌──────────────────────────┐
  │  modules = {}│       →       │  modules = {             │
  │  (rỗng)      │                │    "./src/test.js": fn   │
  └──────────────┘                │  }                       │
                                  └──────────────────────────┘

  installedChunks:
  ┌──────────────────────────┐    ┌──────────────────────────┐
  │  main: 0                 │    │  main: 0                 │
  │  src_test_js: [res, rej] │ →  │  src_test_js: 0          │
  │  (pending)               │    │  (done!)                 │
  └──────────────────────────┘    └──────────────────────────┘
```

---

### Bước 3 — Load Module (require)

Khi `require.e()` resolve → chuyển sang `.then()`:

```javascript
require
  .e("src_test_js") // Bước 1 + 2
  .then(require.bind(require, "./src/test.js")); // Bước 3
```

#### Triển khai hàm `require`

```javascript
// Cache module đã load
var cache = {};

// Hàm require — polyfill cho browser
function require(moduleId) {
  // Kiểm tra cache
  var cachedModule = cache[moduleId];
  if (cachedModule !== undefined) {
    return cachedModule.exports;
  }

  // Tạo module object mới → thêm vào cache
  var module = (cache[moduleId] = {
    exports: {},
  });

  // Thực thi module function → populate exports
  modules[moduleId](module, module.exports, require);

  // Trả về exports
  return module.exports;
}

// Helper: define getter cho exports (dùng cho ES Module export)
require.defineProperty = (exports, definition) => {
  for (var key in definition) {
    Object.defineProperty(exports, key, {
      enumerable: true,
      get: definition[key], // lazy getter
    });
  }
};
```

```
SAU KHI require("./src/test.js") CHẠY:
═══════════════════════════════════════════════════════════════

  Trả về object exports:
  {
    default: () => {
      console.log("Button đã được click!");
    }
  }
  → Vì test.js dùng "export default" → key là "default"
```

---

### Bước 4 — Sử Dụng Exported Content

```javascript
require
  .e("src_test_js") // Bước 1 + 2
  .then(require.bind(require, "./src/test.js")) // Bước 3
  .then((module) => {
    // Bước 4
    const print = module.default; // Lấy default export
    print(); // "Button đã được click!" ✅
  });
```

---

## 6. Code Tổng Thể (Đã Tối Ưu)

### main.js — Entry Bundle

```javascript
// ═══════════════════════════════════════════════════════════
// WEBPACK ASYNC LOADING — MAIN BUNDLE (ĐÃ TỐI ƯU)
// ═══════════════════════════════════════════════════════════

// ❶ Module Registry —— ban đầu rỗng (chưa có sync module)
var modules = {};

// ❷ Module Cache —— tránh thực thi module nhiều lần
var cache = {};

// ❸ require() —— polyfill để load module trong browser
function require(moduleId) {
  var cachedModule = cache[moduleId];
  if (cachedModule !== undefined) {
    return cachedModule.exports;
  }
  var module = (cache[moduleId] = {
    exports: {},
  });
  modules[moduleId](module, module.exports, require);
  return module.exports;
}

// ❹ Helper: define property getter cho ES Module exports
require.defineProperty = (exports, definition) => {
  for (var key in definition) {
    Object.defineProperty(exports, key, {
      enumerable: true,
      get: definition[key],
    });
  }
};

// ❺ Installed Chunks Registry
//    0 = đã sẵn sàng,  [resolve, reject] = đang loading
var installedChunks = {
  main: 0,
};

// ❻ publicPath —— prefix cho URL chunk (từ output.publicPath)
require.publicPath = "";

// ❼ JSONP chunk loading
require.j = function (chunkId, promises) {
  var promise = new Promise((resolve, reject) => {
    installedChunks[chunkId] = [resolve, reject];
  });
  promises.push(promise);

  var url = require.publicPath + chunkId + ".main.js";
  let script = document.createElement("script");
  script.src = url;
  document.head.appendChild(script);
};

// ❽ webpackJsonpCallback —— chunk tải xong → merge + resolve
function webpackJsonpCallback([chunkIds, moreModules]) {
  const resolves = [];
  for (let i = 0; i < chunkIds.length; i++) {
    const chunkId = chunkIds[i];
    resolves.push(installedChunks[chunkId][0]);
    installedChunks[chunkId] = 0;
  }
  for (const moduleId in moreModules) {
    modules[moduleId] = moreModules[moduleId];
  }
  while (resolves.length) {
    resolves.shift()();
  }
}

// ❾ Override push → callback pattern
self.webpackChunkstudy = {};
self.webpackChunkstudy.push = webpackJsonpCallback;

// ❿ Async require entry point
require.e = function (chunkId) {
  let promises = [];
  require.j(chunkId, promises);
  return Promise.all(promises);
};

// ═══════════════════════════════════════════════════════════
// APPLICATION CODE
// ═══════════════════════════════════════════════════════════

const buttonEle = document.getElementById("button");
buttonEle.onclick = function () {
  require
    .e("src_test_js") // Bước 1: JSONP load chunk
    .then(require.bind(require, "./src/test.js")) // Bước 3: Execute module
    .then((module) => {
      // Bước 4: Sử dụng export
      const print = module.default;
      print();
    });
};
```

### src_test_js.main.js — Async Chunk

```javascript
// ═══════════════════════════════════════════════════════════
// ASYNC CHUNK — test.js
// ═══════════════════════════════════════════════════════════

self["webpackChunkstudy"].push([
  ["src_test_js"],
  {
    "./src/test.js": (modules, exports, require) => {
      require.defineProperty(exports, {
        default: () => WEBPACK_DEFAULT_EXPORT,
      });
      const WEBPACK_DEFAULT_EXPORT = () => {
        console.log("Button đã được click!");
      };
    },
  },
]);
```

### Flow Thực Thi Toàn Bộ

```
FLOW TỔNG THỂ — TỪ CLICK ĐẾN EXECUTE:
═══════════════════════════════════════════════════════════════

  USER CLICK BUTTON
      │
      ▼
  require.e("src_test_js")
      │
      ▼
  require.j("src_test_js", promises)
      │
      ├─→ installedChunks["src_test_js"] = [resolve, reject]
      │
      ├─→ Tạo <script src="src_test_js.main.js">
      │
      └─→ → Browser tải file...
              │
              ▼
         FILE TẢI XONG → TỰ ĐỘNG THỰC THI
              │
              ▼
         self.webpackChunkstudy.push([...])
              │
              ▼
         webpackJsonpCallback()
              │
              ├─→ Lấy resolve từ installedChunks
              │
              ├─→ installedChunks["src_test_js"] = 0  (done!)
              │
              ├─→ Merge module vào modules object
              │
              └─→ resolve()  → Promise.all resolve!
                                    │
                                    ▼
                          .then(require("./src/test.js"))
                                    │
                                    ├─→ Tìm module trong modules
                                    │
                                    ├─→ Thực thi module function
                                    │
                                    └─→ Trả exports = { default: fn }
                                              │
                                              ▼
                                    .then((module) => {
                                       module.default()
                                    })
                                              │
                                              ▼
                                    "Button đã được click!" ✅
```

---

## 7. Tổng Kết

```
TỔNG KẾT — WEBPACK ASYNC LOADING:
═══════════════════════════════════════════════════════════════

  ❶ LAZY LOADING = CODE SPLITTING + TẢI THEO YÊU CẦU
  ┌──────────────────────────────────────────────────────────┐
  │  import() tách module thành chunk riêng                  │
  │  Chỉ tải khi code chạy đến dòng import()                │
  │  → Giảm initial bundle size → tăng tốc first load       │
  └──────────────────────────────────────────────────────────┘

  ❷ CƠ CHẾ JSONP
  ┌──────────────────────────────────────────────────────────┐
  │  Tạo <script> tag động → browser tải chunk               │
  │  Chunk tự thực thi → gọi webpackJsonpCallback            │
  │  Callback → merge module + resolve promise               │
  │  → Giống JSONP truyền thống: script tag + callback       │
  └──────────────────────────────────────────────────────────┘

  ❸ 4 BƯỚC THỰC THI
  ┌──────────────────────────────────────────────────────────┐
  │  B1: require.e() → require.j() → tạo <script>           │
  │  B2: Chunk load → webpackJsonpCallback → merge modules  │
  │  B3: require(moduleId) → execute module → lấy exports   │
  │  B4: .then(module => ...) → sử dụng exported content     │
  └──────────────────────────────────────────────────────────┘

  ❹ CÁC THÀNH PHẦN CHÍNH
  ┌──────────────────┬───────────────────────────────────────┐
  │  modules          │  Registry chứa module definitions    │
  │  cache            │  Cache module đã require             │
  │  installedChunks  │  Trạng thái chunks (0/[res,rej])     │
  │  require.e        │  Entry point async loading           │
  │  require.j        │  JSONP: tạo script tag               │
  │  webpackJsonpCb   │  Callback: merge + resolve           │
  │  require          │  Load & execute module               │
  └──────────────────┴───────────────────────────────────────┘

  ❺ LƯU Ý THỰC TẾ
  ┌──────────────────────────────────────────────────────────┐
  │  • Chunk chỉ nên request LẦN ĐẦU — lần sau dùng cache   │
  │    (installedChunks[chunkId] === 0 → đã load)            │
  │  • publicPath phải đúng để URL chunk chính xác           │
  │  • Ứng dụng phổ biến nhất: lazy load routes              │
  │    React.lazy() / Vue Router dynamic import              │
  └──────────────────────────────────────────────────────────┘
```

### Trả Lời Câu Hỏi Phỏng Vấn

```
TRẢ LỜI:
═══════════════════════════════════════════════════════════════

  Q: Làm thế nào để lazy loading?
  A: Dùng import() syntax — dynamic import

  Q: Webpack có những cách code splitting nào?
  A: 3 cách: Entry points, SplitChunksPlugin, Dynamic import

  Q: Nguyên lý lazy loading?
  A: import() tách code thành chunk riêng. Khi cần, Webpack
     dùng JSONP (tạo <script> tag) tải chunk → execute →
     merge module definitions → resolve promise → sử dụng

  Q: JSONP đóng vai trò gì?
  A: Tải file chunk qua <script> tag (không bị CORS).
     File chunk tự execute → gọi callback để merge module

  Q: Tại sao lazy loading tăng tốc initial load?
  A: Giảm initial bundle size — chỉ tải code CẦN THIẾT
     ban đầu. Code còn lại tải sau khi user cần
```
