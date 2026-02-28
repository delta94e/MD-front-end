# Webpack Loader — Cơ Chế Hoạt Động Chi Tiết

> Hiểu sâu về Loader trong Webpack qua hình minh họa và ví dụ thực tế.
> Độ khó: ⭐️⭐️⭐️ | Thời gian đọc: ~40 phút

---

## Table of Contents

1. [Giới Thiệu — Mười Câu Hỏi Mở Đầu](#1-giới-thiệu--mười-câu-hỏi-mở-đầu)
2. [Loader Là Gì?](#2-loader-là-gì)
3. [Sử Dụng Custom Loader Trong Webpack](#3-sử-dụng-custom-loader-trong-webpack)
4. [Bốn Loại Loader](#4-bốn-loại-loader)
5. [Normal Loader và Pitching Loader](#5-normal-loader-và-pitching-loader)
6. [Tham Số Của Pitch Loader](#6-tham-số-của-pitch-loader)
7. [Inline Loader — Cách Sử Dụng Nội Tuyến](#7-inline-loader--cách-sử-dụng-nội-tuyến)
8. [Tự Viết loader-runner (Nâng Cao)](#8-tự-viết-loader-runner-nâng-cao)
9. [Thực Chiến — Tự Viết Các Loader Phổ Biến](#9-thực-chiến--tự-viết-các-loader-phổ-biến)
10. [Tổng Kết](#10-tổng-kết)

---

## 1. Giới Thiệu — Mười Câu Hỏi Mở Đầu

Đọc xong bài viết này, bạn sẽ trả lời được:

1. Bản chất của Loader là gì?
2. Trong Webpack, sử dụng custom Loader bằng cách nào? Có bao nhiêu cách?
3. Loader có mấy loại? Thứ tự thực thi ra sao? Làm sao kiểm soát thứ tự?
4. Normal Loader là gì? Pitching Loader là gì? Cơ chế hoạt động khác nhau thế nào?
5. Nếu một file được chỉ định nhiều Loader, làm sao chỉ chạy Loader cụ thể, bỏ qua các Loader khác?
6. Tại sao Loader chạy từ phải sang trái? Cơ chế bên trong hoạt động ra sao?
7. Các file `.css`, `.less`, `.scss`, `.tsx`, `.vue` được parse như thế nào? Nguyên lý?
8. Cơ chế Loader hoàn chỉnh trong Webpack hoạt động ra sao?
9. Tại sao kết quả cuối cùng của Loader phải là chuỗi JS?
10. Nếu cần xóa `console.log` khi build — dùng Loader, Babel Plugin, hay Webpack Plugin? Vì sao?

Webpack bản thân **chỉ xử lý được JS và JSON**. Để xử lý các loại file khác (CSS, Less, Vue, JSX, TypeScript...), cần nhờ **Loader** chuyển đổi chúng thành module hợp lệ.

---

## 2. Loader Là Gì?

> **Loader bản chất là một JavaScript module export ra một hàm.** Hàm này nhận source code (hoặc kết quả của Loader trước đó) làm tham số, có thể ghép nhiều Loader thành **loader chain**, và trả về kết quả đã chuyển đổi.

```javascript
/**
 * @param {string|Buffer} content  Nội dung file nguồn
 * @param {object} [map]          SourceMap data
 * @param {any} [meta]            Meta data, có thể là bất kỳ gì
 */
function webpackLoader(content, map, meta) {
  // Code xử lý của bạn
}
```

### Loader Chain — Chuỗi Loader

```
LOADER CHAIN — VÍ DỤ VỚI .less:
═══════════════════════════════════════════════════════

  webpack.config.js:
  ┌──────────────────────────────────────────────────┐
  │  module: {                                       │
  │    rules: [{                                     │
  │      test: /\.less$/,                            │
  │      use: [                                      │
  │        "style-loader",  // CSS → <style> tag     │
  │        "css-loader",    // Parse đường dẫn CSS   │
  │        "less-loader",   // Less → CSS            │
  │      ]                                           │
  │    }]                                            │
  │  }                                               │
  └──────────────────────────────────────────────────┘

  THỨ TỰ THỰC THI: Từ PHẢI → TRÁI (dưới → trên)
  ═══════════════════════════════════════════════════

  .less file
       │
       ▼
  ❶ less-loader    →  Chuyển Less → CSS
       │
       ▼
  ❷ css-loader     →  Parse URL, @import trong CSS
       │
       ▼
  ❸ style-loader   →  Chèn CSS vào <style> trong HTML
```

> **Lợi ích thiết kế chuỗi Loader**: Mỗi Loader chỉ đảm nhận **một trách nhiệm duy nhất** (Single Responsibility). Dễ dàng tổ hợp và mở rộng.

### Viết Loader Đơn Giản Nhất

```javascript
// a-loader.js
function ALoader(content, map, meta) {
  console.log("Tôi là ALoader");
  return content; // Không xử lý gì, trả về nguyên content
}
module.exports = ALoader;
```

---

## 3. Sử Dụng Custom Loader Trong Webpack

Có **3 cách** sử dụng custom Loader:

### Cách 1: Đường Dẫn Tuyệt Đối

```javascript
{
  test: /\.js$/,
  use: [{
    loader: path.resolve(__dirname, "./loaders/simpleLoader.js"),
    options: { /* ... */ }
  }]
}
```

### Cách 2: Alias — `resolveLoader.alias`

```javascript
resolveLoader: {
  alias: {
    "simpleLoader": path.resolve(__dirname, "./loaders/simpleLoader.js"),
  }
},
module: {
  rules: [{
    test: /\.js$/,
    use: [{
      loader: "simpleLoader",
      options: { /* ... */ }
    }]
  }]
}
```

> ⚠️ Nếu có nhiều custom Loader → phải cấu hình nhiều alias → **phiền phức**, không khuyến khích.

### Cách 3: `resolveLoader.modules` ✅ Khuyến Khích

```javascript
resolveLoader: {
  // Tìm loader ở thư mục "loaders" trước, không có thì tìm ở node_modules
  modules: ["loaders", "node_modules"],
},
module: {
  rules: [{
    test: /\.js$/,
    use: [{
      loader: "simpleLoader",
      options: { /* ... */ }
    }]
  }]
}
```

> Loader bên thứ ba chỉ cần ghi tên — mặc định tìm trong `node_modules`.

---

## 4. Bốn Loại Loader

```
BỐN LOẠI LOADER:
═══════════════════════════════════════════════════════════════

  ┌───────────────┬───────────────┬────────────────────────────┐
  │  Loại         │  enforce      │  Mô tả                    │
  ├───────────────┼───────────────┼────────────────────────────┤
  │  Pre          │  "pre"        │  Chạy trước tất cả        │
  │  Normal       │  (mặc định)   │  Loader thông thường       │
  │  Inline       │  (trong code) │  Ghi trực tiếp trong code │
  │  Post         │  "post"       │  Chạy sau tất cả          │
  └───────────────┴───────────────┴────────────────────────────┘
```

> **Quan trọng**: Loại Loader **KHÔNG** phụ thuộc vào bản thân Loader, mà phụ thuộc vào thuộc tính `enforce` trong config.

### Ví Dụ — Normal vs Pre Loader

```javascript
// Normal Loader (mặc định — không có enforce)
{
  test: /\.css$/,
  use: ["css-loader"],
}

// Pre Loader (thêm enforce: "pre")
{
  test: /\.css$/,
  use: ["css-loader"],
  enforce: "pre",  // Cũng có thể là "post"
}
```

### Inline Loader

Cú pháp: `loader + dấu chấm than + đường dẫn file`:

```javascript
import xxx from "inline-loader1!inline-loader2!/src/xxx.css";
// → Dùng inline-loader1 và inline-loader2 để parse file
```

### Thứ Tự Thực Thi — Quy Tắc Chính Thức

Theo tài liệu chính thức, Loader có **2 giai đoạn**:

```
HAI GIAI ĐOẠN CỦA LOADER:
═══════════════════════════════════════════════════════════════

  ❶ PITCHING (Giai đoạn đi)
     Thứ tự: post → inline → normal → pre
     → Gọi hàm pitch trên mỗi Loader

  ❷ NORMAL (Giai đoạn về)
     Thứ tự: pre → normal → inline → post
     → Gọi hàm chính (normal) trên mỗi Loader
     → Đây là nơi chuyển đổi source code THỰC SỰ xảy ra
```

> **"Từ phải sang trái"** chỉ đúng khi các Loader **cùng loại**. Khi Loader thuộc loại khác nhau → thứ tự tuân theo quy tắc trên.

### Ứng Dụng Thực Tế — ESLint Pre Loader

```javascript
module: {
  rules: [
    {
      test: /\.js$/,
      use: ["eslint-loader"],
      enforce: "pre", // Kiểm tra trước khi compile
    },
    {
      test: /\.js$/,
      use: ["babel-loader"],
    },
  ];
}
```

> **Câu hỏi tư duy**: Cấu hình trên kiểm tra tất cả file `.js` rồi mới compile, hay kiểm tra từng file rồi compile từng file?
>
> **Trả lời**: Kiểm tra **từng file rồi compile từng file** — chi tiết sẽ được giải thích trong phần viết Webpack từ đầu.

---

## 5. Normal Loader và Pitching Loader

### 5.1 Normal Loader

**Normal Loader = hàm chính được export từ module.** Đây KHÔNG PHẢI khái niệm "normal" trong phân loại 4 loại Loader ở trên — là hai khái niệm khác nhau.

```javascript
// a-loader.js
function ALoader(content, map, meta) {
  console.log("Thực thi a-loader giai đoạn normal");
  return content + "//Thêm comment (từ ALoader)";
}
module.exports = ALoader;
```

**Demo — 3 Loader chạy cùng lúc:**

```javascript
// b-loader.js
function BLoader(content, map, meta) {
  console.log("Thực thi b-loader giai đoạn normal");
  return content + "//Thêm comment (từ BLoader)";
}
module.exports = BLoader;

// c-loader.js
function CLoader(content, map, meta) {
  console.log("Thực thi c-loader giai đoạn normal");
  return content + "//Thêm comment (từ CLoader)";
}
module.exports = CLoader;
```

Config:

```javascript
{
  test: /\.js$/,
  use: ["c-loader", "b-loader", "a-loader"],
}
```

```
KẾT QUẢ CONSOLE:
═══════════════════════════════════════════

  Thực thi a-loader giai đoạn normal    ← Chạy TRƯỚC (bên phải)
  Thực thi b-loader giai đoạn normal
  Thực thi c-loader giai đoạn normal    ← Chạy SAU (bên trái)

  → Xác nhận: Normal Loader chạy từ PHẢI → TRÁI
```

### 5.2 Pitch Loader

Trên hàm Loader được export, có một **thuộc tính tùy chọn: `pitch`**. Giá trị là một hàm — gọi là **Pitching Loader**.

```javascript
// a-loader.js
function ALoader(content, map, meta) {
  console.log("Thực thi a-loader giai đoạn normal");
  return content + "//Thêm comment (từ ALoader)";
}
ALoader.pitch = function () {
  console.log("ALoader giai đoạn pitch");
};
module.exports = ALoader;

// b-loader.js
function BLoader(content, map, meta) {
  console.log("Thực thi b-loader giai đoạn normal");
  return content + "//Thêm comment (từ BLoader)";
}
BLoader.pitch = function () {
  console.log("BLoader giai đoạn pitch");
};
module.exports = BLoader;

// c-loader.js
function CLoader(content, map, meta) {
  console.log("Thực thi c-loader giai đoạn normal");
  return content + "//Thêm comment (từ CLoader)";
}
CLoader.pitch = function () {
  console.log("CLoader giai đoạn pitch");
};
module.exports = CLoader;
```

Config giữ nguyên: `use: ["c-loader", "b-loader", "a-loader"]`

```
KẾT QUẢ CONSOLE:
═══════════════════════════════════════════

  CLoader giai đoạn pitch               ← Pitch: TRÁI → PHẢI
  BLoader giai đoạn pitch
  ALoader giai đoạn pitch
  Thực thi a-loader giai đoạn normal    ← Normal: PHẢI → TRÁI
  Thực thi b-loader giai đoạn normal
  Thực thi c-loader giai đoạn normal
```

```
FLOW HOÀN CHỈNH — PITCH + NORMAL:
═══════════════════════════════════════════════════════════════

  Config: use: ["c-loader", "b-loader", "a-loader"]

  ┌─────────────────────────────────────────────────────────┐
  │              PITCHING (Trái → Phải)                     │
  │                                                         │
  │  c-loader.pitch  →  b-loader.pitch  →  a-loader.pitch  │
  │                                                         │
  └───────────────────────────┬─────────────────────────────┘
                              │
                     Đọc file nguồn
                              │
  ┌───────────────────────────▼─────────────────────────────┐
  │              NORMAL (Phải → Trái)                       │
  │                                                         │
  │  a-loader.normal → b-loader.normal → c-loader.normal   │
  │                                                         │
  └─────────────────────────────────────────────────────────┘
```

### 5.3 Kết Hợp 4 Loại Loader + Pitch/Normal

```
VÍ DỤ PHỨC TẠP — 6 LOADER VỚI CÁC LOẠI KHÁC NHAU:
═══════════════════════════════════════════════════════════════

  Config:
  ┌────────────┬──────────┐
  │  Loader    │  enforce │
  ├────────────┼──────────┤
  │  a-loader  │  pre     │
  │  b-loader  │  post    │
  │  c-loader  │  pre     │
  │  d-loader  │  post    │
  │  e-loader  │  normal  │
  │  f-loader  │  normal  │
  └────────────┴──────────┘

  Bước 1: Webpack phân loại Loader theo enforce:

  postLoaders   = ["b-loader", "d-loader"]
  inlineLoaders = []
  normalLoaders = ["e-loader", "f-loader"]
  preLoaders    = ["a-loader", "c-loader"]

  Bước 2: Ghép theo thứ tự chuẩn:

  loaders = [
    ...postLoaders,    // b, d
    ...inlineLoaders,  // (trống)
    ...normalLoaders,  // e, f
    ...preLoaders      // a, c
  ]
  // Kết quả: ['b-loader','d-loader','e-loader','f-loader','a-loader','c-loader']

  Bước 3: Thực thi — Pitch TRÁI→PHẢI, Normal PHẢI→TRÁI:

  b.pitch → d.pitch → e.pitch → f.pitch → a.pitch → c.pitch
          ↓ (đọc file)
  c.normal → a.normal → f.normal → e.normal → d.normal → b.normal
```

### 5.4 Pitch Có Return Value — Quay Đầu!

> Nếu hàm `pitch` **có giá trị trả về** → lập tức **kết thúc giai đoạn Pitch** và nhảy về Normal của Loader **trước đó**.

```
PITCH CÓ RETURN VALUE:
═══════════════════════════════════════════════════════════════

  Config: use: ["c-loader", "b-loader", "a-loader"]

  Giả sử BLoader.pitch RETURN "hello world"

  ┌─────────────────────────────────────────────────────────┐
  │              PITCHING                                   │
  │                                                         │
  │  c-loader.pitch  →  b-loader.pitch ──┐                 │
  │                     (return!)        │                  │
  │                                      │                  │
  │              NORMAL                  ▼                  │
  │                                                         │
  │                     c-loader.normal ◄──                 │
  │                                                         │
  │  ❌ a-loader.pitch   — KHÔNG chạy                      │
  │  ❌ a-loader.normal  — KHÔNG chạy                      │
  │  ❌ b-loader.normal  — KHÔNG chạy                      │
  │  ❌ Đọc file nguồn   — KHÔNG đọc!                     │
  └─────────────────────────────────────────────────────────┘
```

```javascript
// b-loader.js
BLoader.pitch = function () {
  console.log("BLoader giai đoạn pitch");
  return "hello world"; // ← CÓ return → quay đầu!
};
```

```
KẾT QUẢ CONSOLE:
═══════════════════════════════════════════

  CLoader giai đoạn pitch
  BLoader giai đoạn pitch
  Thực thi c-loader giai đoạn normal

  → File nguồn KHÔNG được đọc!
  → ALoader hoàn toàn bị bỏ qua!
```

> **Câu hỏi**: Loader mục đích là xử lý file, mà file không đọc thì Loader có ý nghĩa gì?
>
> → Đừng vội — phần **thực chiến style-loader** bên dưới sẽ giải thích!

---

## 6. Tham Số Của Pitch Loader

Pitch Loader có 3 tham số quan trọng: `remainingRequest`, `previousRequest`, `data`.

```
3 THAM SỐ CỦA PITCH:
═══════════════════════════════════════════════════════════════

  Giả sử có 5 loader: loader1 → loader2 → loader3 → loader4 → loader5
  Đang thực thi pitch của loader3:

  ┌───────────────────┬──────────────────────────────────────┐
  │  Tham số          │  Giá trị                            │
  ├───────────────────┼──────────────────────────────────────┤
  │  previousRequest  │  [loader1, loader2]                  │
  │                   │  (đã chạy pitch)                     │
  ├───────────────────┼──────────────────────────────────────┤
  │  currentRequest   │  [loader3, loader4, loader5, file]   │
  │                   │  (đang chạy + chưa chạy)             │
  ├───────────────────┼──────────────────────────────────────┤
  │  remainingRequest │  [loader4, loader5, file nguồn]      │
  │                   │  (chưa chạy pitch)                   │
  └───────────────────┴──────────────────────────────────────┘
```

```javascript
Loader.pitch = function (remainingRequest, previousRequest, data) {
  console.log(remainingRequest, previousRequest, data);
};
```

### Tham số `data` — Truyền Dữ Liệu Giữa Pitch và Normal

```javascript
function loader(source) {
  console.log(this.data.a); // → 1 (nhận được từ pitch)
  return source;
}

loader.pitch = function () {
  this.data.a = 1; // Inject data ở pitch
  console.log("loader-pitch");
};
```

> `data` giống **context injection**: ghi ở pitch → đọc bằng `this.data` ở normal.

---

## 7. Inline Loader — Cách Sử Dụng Nội Tuyến

Khi một file được cấu hình nhiều Loader, nhưng chỉ muốn chạy Loader cụ thể → dùng **prefix prefix** trong inline import.

### Ví Dụ Setup

```javascript
// webpack.config.js
rules: [
  { test: /\.js$/, use: ["a-loader"] }, // normal
  { test: /\.js$/, use: ["b-loader"], enforce: "post" }, // post
];

// src/index.js
import test from "c-loader!./test.js"; // inline loader
```

```
THỨ TỰ BÌNH THƯỜNG (không có prefix):
═══════════════════════════════════════════════════════

  Pitch:  B(post) → C(inline) → A(normal)
  Normal: A(normal) → C(inline) → B(post)
```

### Prefix `!` — Bỏ qua Normal Loader

```javascript
import test from "!c-loader!./test.js";
```

```
  Pitch:  B(post) → C(inline)          ← A(normal) bị bỏ qua!
  Normal: C(inline) → B(post)
```

### Prefix `!!` — CHỈ dùng Inline Loader

```javascript
import test from "!!c-loader!./test.js";
```

```
  Pitch:  C(inline)                    ← CHỈ có inline!
  Normal: C(inline)
```

### Prefix `-!` — Bỏ qua Pre + Normal, giữ Post

```javascript
import test from "-!c-loader!./test.js";
```

```
  Pitch:  B(post) → C(inline)          ← Bỏ pre + normal
  Normal: C(inline) → B(post)
```

### Nguyên Lý Bên Trong — Chỉ Là Filter

```javascript
const { runLoaders } = require("loader-runner");
const path = require("path");

// Phân tích inline path
let modulePath = `-!inline-loader1!inline-loader2!${entryFile}`;

// Phân loại loader từ config
let preLoaders = [],
  inlineLoaders = [],
  postLoaders = [],
  normalLoaders = [];

// Parse inline loaders
let parts = modulePath.replace(/^-?!+/, "").split("!");
let resource = parts.pop(); // File nguồn
inlineLoaders = parts; // Inline loaders

// Phân loại từ rules
for (let rule of rules) {
  if (rule.test.test(resource)) {
    if (rule.enforce === "pre") preLoaders.push(...rule.use);
    else if (rule.enforce === "post") postLoaders.push(...rule.use);
    else normalLoaders.push(...rule.use);
  }
}

// Áp dụng prefix filter
let loaders = [];
if (modulePath.startsWith("!!")) {
  // !! → CHỈ inline
  loaders = [...inlineLoaders];
} else if (modulePath.startsWith("-!")) {
  // -! → Bỏ pre + normal, giữ post + inline
  loaders = [...postLoaders, ...inlineLoaders];
} else if (modulePath.startsWith("!")) {
  // ! → Bỏ normal, giữ post + inline + pre
  loaders = [...postLoaders, ...inlineLoaders, ...preLoaders];
} else {
  // Không prefix → tất cả
  loaders = [...postLoaders, ...inlineLoaders, ...normalLoaders, ...preLoaders];
}
```

---

## 8. Tự Viết loader-runner (Nâng Cao)

> Webpack nội bộ sử dụng thư viện `loader-runner` để chạy các Loader đã cấu hình. Phần này sẽ tự viết lại từ đầu.

### 8.1 Cấu Trúc Cơ Bản — `runLoaders`

```
TỔNG QUAN loader-runner:
═══════════════════════════════════════════════════════════════

  runLoaders(options, callback)
       │
       ▼
  Tạo loaderContext (= this trong mỗi loader)
       │
       ▼
  iteratePitchingLoaders()  ← Chạy pitch: index 0 → N
       │
       ▼ (index >= loaders.length)
  processResource()         ← Đọc file nguồn
       │
       ▼
  iterateNormalLoader()     ← Chạy normal: index N → 0
       │
       ▼ (index < 0)
  finalCallback()           ← Trả kết quả cuối cùng
```

```javascript
const fs = require("fs");

// Tạo loader object từ đường dẫn
function createLoaderObject(loader) {
  const normal = require(loader);
  const pitch = normal.pitch;
  return {
    path: loader, // Đường dẫn tuyệt đối
    normal, // Hàm normal
    pitch, // Hàm pitch (có thể undefined)
    raw: normal.raw, // raw=true → tham số là Buffer
    data: {}, // Data truyền giữa pitch ↔ normal
    pitchExecuted: false, // Đã chạy pitch chưa?
    normalExecuted: false, // Đã chạy normal chưa?
  };
}

function runLoaders(option, finalCallback) {
  const {
    resource,
    loaders = [],
    context = {},
    readResource = fs.readFile,
  } = option;

  // loaderContext = this trong mỗi loader
  const loaderContext = context;
  loaderContext.resource = resource;
  loaderContext.readResource = readResource;
  loaderContext.loaders = loaders.map(createLoaderObject);
  loaderContext.loaderIndex = 0; // Index: pitch tăng 0→N, normal giảm N→0
  loaderContext.callback = null;
  loaderContext.async = null;

  // Getter: remainingRequest
  Object.defineProperty(loaderContext, "remainRequest", {
    get() {
      return loaderContext.loaders
        .slice(loaderContext.loaderIndex + 1)
        .map((l) => l.path)
        .concat(loaderContext.resource)
        .join("!");
    },
  });

  // Getter: currentRequest
  Object.defineProperty(loaderContext, "currentRequest", {
    get() {
      return loaderContext.loaders
        .slice(loaderContext.loaderIndex)
        .map((l) => l.path)
        .concat(loaderContext.resource)
        .join("!");
    },
  });

  // Getter: previousRequest
  Object.defineProperty(loaderContext, "previousRequest", {
    get() {
      return loaderContext.loaders
        .slice(0, loaderContext.loaderIndex)
        .map((l) => l.path)
        .join("!");
    },
  });

  // Getter: data của loader hiện tại
  Object.defineProperty(loaderContext, "data", {
    get() {
      return loaderContext.loaders[loaderContext.loaderIndex].data;
    },
  });

  let processOptions = {
    resourceBuffer: null,
    readResource,
  };

  // Bắt đầu chạy pitch từ trái → phải
  iteratePitchingLoaders(processOptions, loaderContext, (err, result) => {
    finalCallback(err, {
      result,
      resourceBuffer: processOptions.resourceBuffer,
    });
  });
}
```

### 8.2 Thực Thi Pitch — `iteratePitchingLoaders`

```
LOGIC PITCH:
═══════════════════════════════════════════════════════

  index >= loaders.length?
      → CÓ: Chuyển sang đọc file (processResource)
      → KHÔNG:
          Loader đã chạy pitch?
              → CÓ: index++, tiếp tục
              → KHÔNG:
                  Có hàm pitch?
                      → KHÔNG: index++, tiếp tục
                      → CÓ: Chạy pitchFn
                          Return value?
                              → CÓ: index--, chạy normal Loader trước đó
                              → KHÔNG: index++, chạy pitch tiếp
```

```javascript
function iteratePitchingLoaders(
  processOptions,
  loaderContext,
  pitchingCallback,
) {
  // Hết loader → đọc file
  if (loaderContext.loaderIndex >= loaderContext.loaders.length) {
    return processResource(processOptions, loaderContext, pitchingCallback);
  }

  const currentLoader = loaderContext.loaders[loaderContext.loaderIndex];

  // Đã chạy pitch → index++
  if (currentLoader.pitchExecuted) {
    loaderContext.loaderIndex++;
    return iteratePitchingLoaders(
      processOptions,
      loaderContext,
      pitchingCallback,
    );
  }

  let pitchFn = currentLoader.pitch;
  currentLoader.pitchExecuted = true;

  // Không có pitch → tiếp tục
  if (!pitchFn) {
    return iteratePitchingLoaders(
      processOptions,
      loaderContext,
      pitchingCallback,
    );
  }

  // Chạy pitchFn
  runSyncOrAsync(
    pitchFn,
    loaderContext,
    [
      loaderContext.remainRequest,
      loaderContext.previousRequest,
      loaderContext.data,
    ],
    (err, ...args) => {
      // Có return value → quay đầu chạy normal
      if (args.length > 0 && args.some((item) => item)) {
        loaderContext.loaderIndex--;
        iterateNormalLoader(
          processOptions,
          loaderContext,
          args,
          pitchingCallback,
        );
      } else {
        // Không return → pitch tiếp
        iteratePitchingLoaders(processOptions, loaderContext, pitchingCallback);
      }
    },
  );
}

function runSyncOrAsync(fn, context, args, runCallback) {
  let isSync = true;
  let isDone = false;

  context.callback = (err, ...args) => {
    if (isDone) throw new Error("callback đã được gọi rồi");
    isDone = true;
    runCallback(err, ...args);
  };

  context.async = () => {
    isSync = false; // Chuyển sang async
    return context.callback;
  };

  let result = fn.apply(context, args);

  if (isSync) {
    isDone = true;
    runCallback(null, result);
  }
  // Nếu async → chờ user tự gọi callback
}
```

### 8.3 Đọc File Nguồn — `processResource`

```javascript
function processResource(processOptions, loaderContext, pitchingCallback) {
  processOptions.readResource(loaderContext.resource, (err, resourceBuffer) => {
    processOptions.resourceBuffer = resourceBuffer;
    loaderContext.loaderIndex--; // Giảm index → bắt đầu normal
    iterateNormalLoader(
      processOptions,
      loaderContext,
      [resourceBuffer],
      pitchingCallback,
    );
  });
}
```

### 8.4 Thực Thi Normal — `iterateNormalLoader`

```javascript
function iterateNormalLoader(
  processOptions,
  loaderContext,
  args,
  pitchingCallback,
) {
  // Hết loader → callback cuối cùng
  if (loaderContext.loaderIndex < 0) {
    return pitchingCallback(null, args);
  }

  const currentLoader = loaderContext.loaders[loaderContext.loaderIndex];

  if (currentLoader.normalExecuted) {
    loaderContext.loaderIndex--;
    return iterateNormalLoader(
      processOptions,
      loaderContext,
      args,
      pitchingCallback,
    );
  }

  let normalFn = currentLoader.normal;
  currentLoader.normalExecuted = true;

  // Xử lý raw: string ↔ Buffer
  convertArgs(args, currentLoader.raw);

  runSyncOrAsync(normalFn, loaderContext, args, (err, ...returnArgs) => {
    if (err) return pitchingCallback(err);
    return iterateNormalLoader(
      processOptions,
      loaderContext,
      returnArgs,
      pitchingCallback,
    );
  });
}

function convertArgs(args, raw) {
  if (raw && !Buffer.isBuffer(args[0])) {
    args[0] = Buffer.from(args[0]); // Cần Buffer → chuyển
  } else if (!raw && Buffer.isBuffer(args[0])) {
    args[0] = args[0].toString("utf8"); // Không cần Buffer → string
  }
}
```

---

## 9. Thực Chiến — Tự Viết Các Loader Phổ Biến

### Cấu Trúc Dự Án

```
├── dist/                   # Thư mục output
├── loaders/                # Custom loaders
│   ├── my-babel-loader.js
│   ├── less-loader.js
│   ├── css-loader.js
│   └── style-loader.js
├── src/
│   ├── index.html
│   ├── index.js            # Entry point
│   └── index.less
├── package.json
└── webpack.config.js
```

### 9.1 Tự Viết babel-loader

> babel-loader chỉ làm một việc: đưa source code cho thư viện Babel xử lý → trả lại kết quả.

```bash
yarn add @babel/core @babel/preset-env -D
```

```javascript
// webpack.config.js
rules: [
  {
    test: /\.js$/,
    use: [
      {
        loader: "my-babel-loader",
        options: { presets: ["@babel/preset-env"] },
      },
    ],
  },
];
```

```javascript
// src/index.js
const sum = (a, b) => a + b; // Arrow function cần chuyển
sum(1, 2);
```

```javascript
// loaders/my-babel-loader.js
const babel = require("@babel/core");

function babelLoader(source) {
  // this = loaderContext — object duy nhất, dùng chung mọi loader
  const options = this.getOptions(); // Lấy options từ webpack config
  console.log("Custom babel-loader đang chạy");
  const { code } = babel.transformSync(source, options);
  return code;
}

module.exports = babelLoader;
```

```
GIẢI THÍCH:
═══════════════════════════════════════════════════════

  @babel/core
  → Chuyển source → AST → duyệt → sinh code mới
  → Nhưng KHÔNG biết bất kỳ cú pháp cụ thể nào

  @babel/preset-env
  → Gom nhiều plugin (arrow-functions, let/const, class...)
  → Thành một preset duy nhất
```

**Kết quả**: Arrow function `=>` được chuyển thành `function` thông thường ✅

### 9.2 Tự Viết less-loader

```bash
yarn add less -D
```

```javascript
// loaders/less-loader.js
const less = require("less");

function lessLoader(lessSource) {
  let css;
  // less.render parse Less → AST → sinh CSS
  less.render(lessSource, { filename: this.resource }, (err, output) => {
    css = output.css;
  });
  return css;
}
module.exports = lessLoader;
```

### 9.3 Tự Viết css-loader (Đơn Giản)

```javascript
// loaders/css-loader.js
function cssLoader(css) {
  return css; // Thực tế sẽ parse @import và url()
}
module.exports = cssLoader;
```

### 9.4 Tự Viết style-loader

> **Quan trọng**: Webpack chỉ hiểu JS và JSON → Loader cuối cùng (bên trái nhất) **BẮT BUỘC** trả về JS code.

```javascript
// loaders/style-loader.js
function styleLoader(cssSource) {
  let script = `
    let style = document.createElement("style");
    style.innerHTML = ${JSON.stringify(cssSource)};
    document.head.appendChild(style);
  `;
  return script; // Trả về JS code!
}
module.exports = styleLoader;
```

```
FLOW HOÀN CHỈNH:
═══════════════════════════════════════════════════════

  index.less (Less code)
       │
       ▼ less-loader
  CSS code
       │
       ▼ css-loader
  CSS code (parse URL, @import...)
       │
       ▼ style-loader
  JS code:
  ┌──────────────────────────────────────────────┐
  │  let style = document.createElement("style") │
  │  style.innerHTML = "#root{color:red}"         │
  │  document.head.appendChild(style)             │
  └──────────────────────────────────────────────┘
       │
       ▼
  Webpack hiểu JS → đóng gói thành công ✅
```

### 9.5 Source Code Thực Tế Khác Gì?

Trong source code thực, `css-loader` trả về **JS code** chứ không phải CSS:

```javascript
// css-loader thực tế trả về:
function cssLoader(css) {
  return `module.exports=${JSON.stringify(css)}`; // ← JS code!
}
```

Vấn đề: `style-loader` cần nhận **CSS text**, nhưng `css-loader` trả về **JS text**.

### Giải Pháp 1: Sửa style-loader (không tối ưu)

```javascript
function styleLoader(cssSource) {
  // Parse lấy nội dung sau dấu "="
  let css = cssSource.match(/module.exports="(.+?)"/)[1];
  let script = `
    let style = document.createElement("style");
    style.innerHTML = ${JSON.stringify(css.replace(/\\n/g, ""))};
    document.head.appendChild(style);
  `;
  return script;
}
```

> ⚠️ Regex không đáng tin cậy — nếu `css-loader` đổi cách export thì hỏng.

### Giải Pháp 2: Dùng Pitch! ✅ (Cách source code thật làm)

```javascript
// style-loader thực tế — dùng pitch
function styleLoader(source) {}

styleLoader.pitch = function (remainingRequest) {
  let script = `
    let style = document.createElement("style");
    style.innerHTML = require("!!../loaders/css-loader.js!../loaders/less-loader.js!./index.less");
    document.head.appendChild(style);
  `;
  return script; // ← CÓ RETURN → kết thúc pitch, quay đầu!
};

module.exports = styleLoader;
```

> Chú ý: Trong `require(...)` dùng **inline Loader** với prefix `!!`!

```
FLOW THỰC TẾ — 2 LẦN BIÊN DỊCH:
═══════════════════════════════════════════════════════════════

  ┌─────────────────────────────────────────────────────────┐
  │  LẦN 1: Parse index.less                               │
  │                                                         │
  │  style-loader.pitch → return script!                    │
  │  (css-loader, less-loader KHÔNG chạy)                   │
  │                                                         │
  │  Webpack phân tích AST của script:                      │
  │  → Phát hiện require("!!css-loader!less-loader!file")   │
  │  → Thêm vào dependency tree                            │
  └──────────────────────────┬──────────────────────────────┘
                             │
                             ▼
  ┌─────────────────────────────────────────────────────────┐
  │  LẦN 2: Parse dependency (inline Loader)                │
  │                                                         │
  │  !! prefix → CHỈ dùng inline loader                    │
  │  → less-loader.normal: Less → CSS                      │
  │  → css-loader.normal:  CSS → module.exports="..."      │
  │                                                         │
  │  Kết quả: module.exports="#root{color:red}"             │
  │  → require() nhận được CSS text chính xác!             │
  └─────────────────────────────────────────────────────────┘
```

```
TỔNG KẾT 2 LẦN COMPILE:
═══════════════════════════════════════════════════════════════

  COMPILE LẦN 1
  ┌─────────────────────┐
  │  index.less          │
  │       │              │
  │       ▼              │
  │  style-loader.pitch  │──→ return script chứa require()
  └──────────────────────┘

  ↓ Webpack phân tích script → phát hiện require()

  COMPILE LẦN 2
  ┌──────────────────────────────────────────────────┐
  │  !!css-loader!less-loader!./index.less           │
  │       │                                          │
  │       ▼                                          │
  │  less-loader.normal  →  CSS                      │
  │       │                                          │
  │       ▼                                          │
  │  css-loader.normal   →  module.exports="css..."  │
  └──────────────────────────────────────────────────┘

  → require() trả về CSS text → style.innerHTML nhận đúng!
```

### 9.6 Tại Sao Phải Làm Vậy?

1. **css-loader trả về JS** → style-loader không thể nhận trực tiếp → phải dùng `require()` để "import" module JS, lấy giá trị export (chính là CSS text).

2. **css-loader có thể dùng độc lập** — vì nó trả về JS (module hợp lệ cho Webpack), không phụ thuộc vào style-loader.

3. **Đây là lý do pitch tồn tại** — cho phép "can thiệp sớm" vào pipeline, tạo vòng compile mới với inline Loader.

---

## 10. Tổng Kết

```
TỔNG KẾT — WEBPACK LOADER MECHANISM:
═══════════════════════════════════════════════════════════════

  ❶ BẢN CHẤT LOADER
  ┌──────────────────────────────────────────────────────────┐
  │  JS module export hàm — nhận source, trả kết quả       │
  │  Chuỗi Loader → mỗi Loader 1 trách nhiệm duy nhất     │
  └──────────────────────────────────────────────────────────┘

  ❷ 4 LOẠI LOADER
  ┌──────────────────────────────────────────────────────────┐
  │  pre (enforce:"pre")  → normal (mặc định)               │
  │  → inline (trong code) → post (enforce:"post")          │
  └──────────────────────────────────────────────────────────┘

  ❸ HAI GIAI ĐOẠN
  ┌──────────────────────────────────────────────────────────┐
  │  Pitch:  post → inline → normal → pre  (trái → phải)   │
  │  Normal: pre → normal → inline → post  (phải → trái)   │
  │  Pitch return → quay đầu + bỏ qua loader phía sau      │
  └──────────────────────────────────────────────────────────┘

  ❹ INLINE PREFIX
  ┌──────────────────────────────────────────────────────────┐
  │  !   → Bỏ normal loaders                                │
  │  !!  → CHỈ inline loaders                               │
  │  -!  → Bỏ pre + normal, giữ post + inline               │
  └──────────────────────────────────────────────────────────┘

  ❺ LOADER CUỐI CÙNG PHẢI TRẢ VỀ JS
  ┌──────────────────────────────────────────────────────────┐
  │  Webpack chỉ hiểu JS + JSON                             │
  │  → Loader bên trái nhất BẮT BUỘC return JS string       │
  └──────────────────────────────────────────────────────────┘

  ❻ THỰC CHIẾN
  ┌──────────────────────────────────────────────────────────┐
  │  ☑ babel-loader  → Đưa source cho @babel/core xử lý    │
  │  ☑ less-loader   → less.render() chuyển Less → CSS      │
  │  ☑ css-loader    → Parse URL, @import (trả về JS)       │
  │  ☑ style-loader  → Dùng pitch + inline require          │
  │    → 2 lần compile → nhận CSS text qua module.exports   │
  └──────────────────────────────────────────────────────────┘
```

> **Câu hỏi cuối**: Xóa `console.log` khi build — dùng gì?
>
> → **Babel Plugin** (vì AST-level manipulation, chính xác nhất) hoặc **Webpack Plugin** (dùng Terser). **Không nên dùng Loader** — vì Loader xử lý theo file type, không phù hợp cho biến đổi cú pháp JS cross-cutting.
