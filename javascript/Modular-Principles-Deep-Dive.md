# Nguyên Lý Module Hóa: Từ Sản Phẩm Đến Bản Chất

> Hiểu sâu về CommonJS, ES Module, và cách Webpack hỗ trợ module hóa trong môi trường Web.
> Độ khó: ⭐️⭐️ | Thời gian đọc: ~15 phút

---

## Table of Contents

1. [Giới Thiệu](#1-giới-thiệu)
2. [Kiến Thức Nền Tảng](#2-kiến-thức-nền-tảng)
3. [Lịch Sử Phát Triển Module Hóa](#3-lịch-sử-phát-triển-module-hóa)
4. [CommonJS Specification](#4-commonjs-specification)
5. [ES Module Specification](#5-es-module-specification)
6. [Cấu Hình Cơ Bản Webpack](#6-cấu-hình-cơ-bản-webpack)
7. [Nguyên Lý CommonJS Trong Webpack](#7-nguyên-lý-commonjs-trong-webpack)
8. [Nguyên Lý ES Module Trong Webpack](#8-nguyên-lý-es-module-trong-webpack)
9. [CommonJS Load ES Module](#9-commonjs-load-es-module)
10. [ES Module Load CommonJS](#10-es-module-load-commonjs)
11. [Tổng Kết & Bài Tập](#11-tổng-kết--bài-tập)

---

## 1. Giới Thiệu

Bài viết này là phần đầu tiên trong chuỗi bài xây dựng hệ thống kiến thức front-end từ con số 0 đến hệ thống tỷ đô.

Chúng ta sẽ bắt đầu từ lịch sử phát triển module hóa front-end, dần khám phá sự giống và khác nhau giữa **CommonJS** và **ES Module**, cuối cùng đào sâu vào nguyên lý bên trong để phân tích đa chiều — hiểu tường tận cách **Webpack** hỗ trợ các chuẩn module hóa trong môi trường Web.

### Câu Hỏi Phỏng Vấn Thường Gặp

```
══════════════════════════════════════════════════════════════
CÂU HỎI PHỎNG VẤN — TRẢ LỜI ĐƯỢC SAU KHI ĐỌC BÀI NÀY
══════════════════════════════════════════════════════════════

  ❶ Module hóa giải quyết vấn đề gì?
    Xuất hiện trong bối cảnh nào?

  ❷ Module hóa được hỗ trợ như thế nào trong
    môi trường Web? Quy trình loading?

  ❸ CommonJS có thể load nội dung export từ
    ES Module không?

  ❹ ES Module có thể load nội dung export từ
    CommonJS không?

  ❺ Webpack phân biệt module sử dụng chuẩn nào
    bằng cách nào?

  ❻ Một module có thể sử dụng đồng thời cả
    CommonJS và ES Module không?

══════════════════════════════════════════════════════════════
```

> **Lưu ý**: Cuối bài có câu hỏi thực thi code để kiểm tra mức độ hiểu — đừng bỏ qua!

---

## 2. Kiến Thức Nền Tảng

### Symbol.toStringTag — Tùy Chỉnh Nhãn Kiểu Dữ Liệu

Trước khi đi vào nội dung chính, cần nắm một kiến thức nền để tránh ảnh hưởng việc học sau này.

Chúng ta thường dùng `Object.prototype.toString` để xác định kiểu dữ liệu:

```javascript
Object.prototype.toString.call("hello"); // "[object String]"
Object.prototype.toString.call([1, 2]); // "[object Array]"
Object.prototype.toString.call(3); // "[object Number]"
Object.prototype.toString.call(true); // "[object Boolean]"
Object.prototype.toString.call(undefined); // "[object Undefined]"
Object.prototype.toString.call(null); // "[object Null]"
```

Một số built-in types có label đặc biệt vì browser engine đã thiết lập `toStringTag`:

```javascript
Object.prototype.toString.call(new Map()); // "[object Map]"
Object.prototype.toString.call(function* () {}); // "[object GeneratorFunction]"
Object.prototype.toString.call(Promise.resolve()); // "[object Promise]"
```

**Vậy làm sao tự định nghĩa label cho kiểu dữ liệu riêng?**

Theo spec: `Symbol.toStringTag` là một built-in symbol, thường dùng làm property key của object. Giá trị tương ứng là string — đại diện cho **custom type tag** của object.

```javascript
const obj = {};

// Định nghĩa toStringTag
Object.defineProperty(obj, Symbol.toStringTag, { value: "Module" });

// Kiểm tra kiểu tùy chỉnh
console.log(Object.prototype.toString.call(obj));
// → '[object Module]' ← Kiểu đã đổi thành Module!
```

```
TẠI SAO CẦN BIẾT ĐIỀU NÀY?
════════════════════════════════════════════════════

  Webpack sử dụng chính Symbol.toStringTag để
  đánh dấu một module là ES Module:

  ┌─────────────────────────────────────────────┐
  │  Object.defineProperty(                     │
  │    exports,                                 │
  │    Symbol.toStringTag,                      │
  │    { value: "Module" }                      │
  │  );                                         │
  │                                             │
  │  → exports trở thành [object Module]       │
  │  → Webpack biết đây là ES Module           │
  └─────────────────────────────────────────────┘
```

---

## 3. Lịch Sử Phát Triển Module Hóa

### Vấn Đề: Global Pollution

Thời kỳ đầu JavaScript rất dễ xảy ra **ô nhiễm biến toàn cục** và **quản lý dependency lộn xộn** — đặc biệt nghiêm trọng khi nhiều người phát triển ứng dụng front-end.

```
VÍ DỤ — VẤN ĐỀ TRƯỚC KHI CÓ MODULE HÓA:
══════════════════════════════════════════════════

  <body>
    <script src="./index.js"></script>     ← Dev A viết
    <script src="./home.js"></script>      ← Dev B viết
    <script src="./list.js"></script>      ← Dev A viết
  </body>

  Không có module hóa → các biến trong script
  có thể "nhiễm" lẫn nhau!

  ┌─────────────────────────────────────────────┐
  │  index.js (Dev A):                          │
  │    var name = 'Alice'                       │
  │                                             │
  │  home.js (Dev B):                           │
  │    function name() { ... }                  │
  │                                             │
  │  list.js (Dev A):                           │
  │    console.log(name)   → ??? function!      │
  │                                             │
  │  ⚠️ Dev A mong đợi "Alice" nhưng nhận được │
  │     function — vì home.js đã ghi đè!       │
  └─────────────────────────────────────────────┘
```

```
NGUYÊN NHÂN GỐC:
═════════════════
  Mỗi file JS được load đều CHIA SẺ biến toàn cục
  → Không có scope isolation
  → Biến trùng tên → ghi đè

GIẢI PHÁP TẠM THỜI — IIFE:
═══════════════════════════
  Dùng anonymous function tự thực thi để tạo
  block scope riêng biệt:

  ┌─────────────────────────────────────────────┐
  │  // home.js — bọc trong IIFE                │
  │  (function() {                              │
  │    function name() {                        │
  │      // ...                                 │
  │    }                                        │
  │  })()                                       │
  │                                             │
  │  → name() giờ nằm trong scope riêng        │
  │  → Không ảnh hưởng biến name bên ngoài     │
  └─────────────────────────────────────────────┘
```

### Vấn Đề Của IIFE

```
IIFE GIẢI QUYẾT SCOPE NHƯNG TẠO VẤN ĐỀ MỚI:
══════════════════════════════════════════════════

  ❶ Phải nhớ tên object trả về của mỗi module
     để sử dụng đúng ở module khác

  ❷ Code lộn xộn — mỗi file phải bọc trong
     anonymous function

  ❸ Không có quy chuẩn thống nhất — mỗi người,
     mỗi công ty đặt tên module tùy ý,
     thậm chí trùng tên module

  → CẦN MỘT CHUẨN THỐNG NHẤT!
  → Đó là cách CommonJS ra đời
```

```
TIẾN TRÌNH PHÁT TRIỂN MODULE HÓA:
══════════════════════════════════════════

  Global Variables     IIFE           CommonJS       ES Module
  (chia sẻ)         (scope riêng)    (server-side)   (native JS)
       │                │                │               │
       ▼                ▼                ▼               ▼
  ┌──────────┐   ┌──────────┐   ┌──────────────┐  ┌──────────┐
  │  var a=1  │   │ (()=>{}) │   │  require()   │  │ import / │
  │  var b=2  │   │ (()=>{}) │   │  exports     │  │ export   │
  └──────────┘   └──────────┘   │  module      │  │          │
                                └──────────────┘  └──────────┘
       ⚠️              ⚠️              ✅              ✅
   Nhiễm toàn     Code lộn xộn,    Chuẩn hóa,      Native JS,
     cục          không chuẩn      server-side     tree-shaking
```

---

## 4. CommonJS Specification

**CommonJS** là chuẩn ban đầu được đề xuất cho môi trường ngoài browser, tên gốc là **ServerJS**. Sau đó đổi tên thành CommonJS để phản ánh khả năng ứng dụng rộng hơn. **Node.js** là triển khai tiêu biểu của CommonJS ở phía server.

### Đặc Điểm Chính

```
COMMONJS TRONG NODE.JS:
══════════════════════════════════

  ┌─────────────────────────────────────────────────────┐
  │                                                     │
  │  ❶ Trong Node, mỗi file JS là một module riêng    │
  │                                                     │
  │  ❷ Module chứa các biến cốt lõi:                  │
  │     • exports                                      │
  │     • module.exports                               │
  │     • require                                      │
  │                                                     │
  │  ❸ Dùng 3 biến trên để phát triển module hóa      │
  │                                                     │
  └─────────────────────────────────────────────────────┘
```

### Cách Sử Dụng

```javascript
// ======= a.js — Export =======
const name = "Alice";
const age = "18";
module.exports = { name, age };

// Hoặc:
exports.name = "Alice";
exports.age = "18";

// ======= b.js — Import =======
const { name, age } = require("./a.js");
console.log(name, age);
```

```
EXPORTS vs MODULE.EXPORTS:
══════════════════════════════

  ┌─────────────────────────────────────────────────────┐
  │                                                     │
  │  exports là REFERENCE đến module.exports            │
  │                                                     │
  │  exports ──────────► module.exports = {}            │
  │                              ▲                      │
  │                              │                      │
  │  require() trả về ──────────┘                      │
  │                                                     │
  │  ⚠️ CẢNH BÁO:                                     │
  │  exports = { ... }  ← SAI! Gán đè reference       │
  │  exports.x = "..."  ← ĐÚNG! Thêm property         │
  │                                                     │
  └─────────────────────────────────────────────────────┘
```

---

## 5. ES Module Specification

Node.js áp dụng và triển khai CommonJS. Nhưng từ **ES6** trở đi, **JavaScript mới thực sự có chuẩn module hóa của riêng mình**.

### Ưu Điểm Của ES Module

```
ES MODULE — ƯU ĐIỂM:
══════════════════════════════

  ❶ Static import/export → Tree Shaking
     Loại bỏ code không sử dụng khi build

  ❷ import() → Code Splitting
     Lazy loading modules khi cần

  ❸ Native JavaScript
     Không cần bundler trong môi trường hiện đại
```

### Cú Pháp Export

```javascript
/**
 * EXPORT — Các cách export
 */

// Re-export (không bao gồm default)
export * from 'module';

// Re-export với tên cụ thể
export { name1, name2 } from 'module';

// Re-export với đổi tên
export { import1 as name1, import2 as name2 } from 'module';

// Named export — gắn với biến đã khai báo
export { name1, name2 };

// Named export — đổi tên khi export
export { variable1 as name1, variable2 as name2 };

// Named export — khai báo và export cùng lúc
export let name1 = 'name1';
// Hoặc: var, const, function, function*, class

// Default export
export default expression;
export default function () { ... }
export default function name1() { ... }
```

### Cú Pháp Import

```javascript
/**
 * IMPORT — Các cách import
 */

// Default import
import defaultExport from "module";

// Named import (destructure)
import { a, b, c } from "module";

// Mixed import (default + named)
import defaultExport, { a, b, c as newC } from "module";

// Namespace import
import * as name from "module";

// Dynamic import (async — lazy loading)
var promise = import("module");
```

### So Sánh CommonJS vs ES Module

```
COMMONJS vs ES MODULE — SO SÁNH TỔNG QUAN:
══════════════════════════════════════════════════════════════

  ┌────────────────────┬──────────────────┬──────────────────┐
  │     Tiêu chí       │    CommonJS      │    ES Module     │
  ├────────────────────┼──────────────────┼──────────────────┤
  │ Thời điểm load     │ Runtime          │ Compile-time     │
  │                    │ (dynamic)        │ (static)         │
  ├────────────────────┼──────────────────┼──────────────────┤
  │ Export             │ module.exports   │ export / export  │
  │                    │ / exports        │ default          │
  ├────────────────────┼──────────────────┼──────────────────┤
  │ Import             │ require()        │ import           │
  ├────────────────────┼──────────────────┼──────────────────┤
  │ Giá trị export     │ Copy of value    │ Live binding     │
  │                    │ (bản sao)        │ (tham chiếu)     │
  ├────────────────────┼──────────────────┼──────────────────┤
  │ Tree Shaking       │ ❌ Không         │ ✅ Có            │
  ├────────────────────┼──────────────────┼──────────────────┤
  │ Synchronous        │ ✅ Có            │ ❌ Async          │
  ├────────────────────┼──────────────────┼──────────────────┤
  │ Môi trường         │ Node.js         │ Browser + Node   │
  ├────────────────────┼──────────────────┼──────────────────┤
  │ Loading            │ Toàn bộ module  │ Chỉ phần cần     │
  └────────────────────┴──────────────────┴──────────────────┘
```

```
COPY OF VALUE vs LIVE BINDING — HIỂU RÕ SỰ KHÁC BIỆT:
═══════════════════════════════════════════════════════════

  CommonJS: require() trả về BẢN SAO giá trị
  ────────────────────────────────────────────
  ┌───────────────────┐     ┌──────────────────┐
  │  a.js             │     │  b.js            │
  │                   │     │                  │
  │  let count = 0;   │     │  const a =       │
  │                   │     │    require("./a") │
  │  exports.count    │     │                  │
  │    = count;       │     │  // a.count = 0  │
  │                   │     │  // (bản sao)    │
  │  exports.add =    │     │                  │
  │    () => count++; │     │  a.add();        │
  │                   │     │  // a.count vẫn  │
  │                   │     │  // = 0 ❌        │
  └───────────────────┘     └──────────────────┘

  ES Module: import nhận THAM CHIẾU (live binding)
  ────────────────────────────────────────────────
  ┌───────────────────┐     ┌──────────────────┐
  │  a.js             │     │  b.js            │
  │                   │     │                  │
  │  export let       │     │  import { count, │
  │    count = 0;     │     │    add }         │
  │                   │     │    from "./a"    │
  │  export function  │     │                  │
  │    add() {        │     │  // count = 0   │
  │      count++;     │     │                  │
  │    }              │     │  add();          │
  │                   │     │  // count = 1 ✅ │
  │                   │     │  // (live ref)   │
  └───────────────────┘     └──────────────────┘
```

---

## 6. Cấu Hình Cơ Bản Webpack

Trong các project dùng **Webpack**, nó cho phép nhiều cách module hóa khác nhau. Phổ biến nhất là **CommonJS** và **ES Module**. Vậy Webpack hỗ trợ module hóa bên trong như thế nào?

Chúng ta sẽ phân tích nguyên lý từ 4 góc độ:

```
4 GÓC ĐỘ PHÂN TÍCH:
══════════════════════════════

  ┌────────────────────────────────────────────────────┐
  │                                                    │
  │  ❶ Nguyên lý CommonJS trong Webpack               │
  │  ❷ Nguyên lý ES Module trong Webpack              │
  │  ❸ CommonJS load ES Module — cách hoạt động       │
  │  ❹ ES Module load CommonJS — cách hoạt động       │
  │                                                    │
  └────────────────────────────────────────────────────┘
```

Cấu hình webpack để test:

```javascript
// webpack.config.js
module.exports = {
  mode: "development", // Không nén code
  entry: "./src/main.js",
  devtool: "source-map", // Xem code sau đóng gói dễ hơn
};

// Versions:
// "webpack": "^5.73.0"
// "webpack-cli": "^4.10.0"
```

---

## 7. Nguyên Lý CommonJS Trong Webpack

### Source Code

```javascript
// name.js
module.exports = "Alice";

// main.js
let author = require("./name.js");
console.log(author, "author");
```

### Phân Tích Trước Khi Xem Code Đóng Gói

```
PHÂN TÍCH LUỒNG HOẠT ĐỘNG:
══════════════════════════════════

  name.js:
  ┌─────────────────────────────────────┐
  │  Có object "module"                 │
  │  module.exports = "Alice"           │
  │  → Property exports chứa "Alice"   │
  └─────────────────────────────────────┘

  main.js:
  ┌─────────────────────────────────────┐
  │  Gọi require("./name.js")          │
  │  → Truyền đường dẫn module         │
  │  → Trả về module.exports           │
  └─────────────────────────────────────┘
```

Nếu tự thiết kế, đơn giản nhất: Chuyển nội dung `name.js` thành một object `modules`, **key là đường dẫn module**, **value là function chứa code module**, rồi khi `require()` thực thi → lấy ra object đã export.

```javascript
// Thiết kế đơn giản hóa:
var modules = {
  "./name.js": () => {
    var module = {};
    module.exports = "Alice";
    return module.exports;
  },
};

const require = (modulePath) => {
  return modules[modulePath]();
};

let author = require("./name.js");
console.log(author, "author");
```

> Thực tế source code trong Webpack cũng tương tự ý tưởng trên — đây chính là **core idea** giúp CommonJS chạy được trên browser.

### Code Đóng Gói Chi Tiết (4 phần)

```
4 PHẦN CỐT LÕI CỦA BUNDLE:
══════════════════════════════════════════════════

  ┌──────────────────────────────────────────────┐
  │                                              │
  │  ❶ Khởi tạo: Định nghĩa object modules     │
  │     → key = đường dẫn module                │
  │     → value = function chứa source code     │
  │                                              │
  │  ❷ Định nghĩa cache object                  │
  │     → Lưu module đã load để tránh load lại  │
  │                                              │
  │  ❸ Định nghĩa hàm require                   │
  │     → Nhận đường dẫn, trả về nội dung       │
  │     → Kiểm tra cache trước                   │
  │                                              │
  │  ❹ Thực thi entry function                   │
  │     → Bọc trong IIFE tránh xung đột tên     │
  │                                              │
  └──────────────────────────────────────────────┘
```

#### Phần ❶: Khởi tạo — Object modules

```javascript
// Key = đường dẫn module, Value = function chứa source code
var modules = {
  "./src/name.js": (module) => {
    module.exports = "Alice";
  },
};
```

#### Phần ❷: Cache object

```javascript
var cache = {};
```

#### Phần ❸: Hàm require

```javascript
// Nhận đường dẫn module → trả về nội dung module
function require(modulePath) {
  var cachedModule = cache[modulePath]; // Lấy cache

  if (cachedModule !== undefined) {
    // Có cache → trả về luôn, không chạy lại code
    return cachedModule.exports;
  }

  // Không có cache → tạo module object, định nghĩa exports
  // CHÚ Ý: module = cache[modulePath] → CÙNG địa chỉ bộ nhớ
  var module = (cache[modulePath] = {
    exports: {},
  });

  // Chạy code trong module → gán giá trị cho module.exports
  modules[modulePath](module, module.exports, require);

  // Trả về module.exports
  return module.exports;
}
```

#### Phần ❹: Thực thi entry

```javascript
// Bọc trong IIFE để tránh xung đột tên biến
(() => {
  let author = require("./src/name.js");
  console.log(author, "author");
})();
```

### Flow Diagram Toàn Cảnh

```
COMMONJS BUNDLE — FLOW THỰC THI:
══════════════════════════════════════════════════════════════

  ① KHỞI TẠO
  ┌──────────────────────────────────────────────────────┐
  │  var modules = {                                     │
  │    "./src/name.js": (module) => {                    │
  │      module.exports = "Alice";                       │
  │    }                                                 │
  │  };                                                  │
  │  var cache = {};                                     │
  └──────────────────────────────────────────────────────┘
                         │
                         ▼
  ② ENTRY — gọi require("./src/name.js")
  ┌──────────────────────────────────────────────────────┐
  │  let author = require("./src/name.js");              │
  └─────────┬────────────────────────────────────────────┘
            │
            ▼
  ③ REQUIRE FUNCTION
  ┌──────────────────────────────────────────────────────┐
  │  cache["./src/name.js"]  →  undefined                │
  │  → Không có cache                                    │
  │                                                      │
  │  Tạo module = { exports: {} }                        │
  │  Lưu vào cache["./src/name.js"]                      │
  │                                                      │
  │  Chạy: modules["./src/name.js"](module)              │
  │  → module.exports = "Alice"                          │
  │                                                      │
  │  return module.exports → "Alice"                     │
  └─────────┬────────────────────────────────────────────┘
            │
            ▼
  ④ KẾT QUẢ
  ┌──────────────────────────────────────────────────────┐
  │  author = "Alice"                                    │
  │  console.log("Alice", "author")                      │
  └──────────────────────────────────────────────────────┘
```

### Toàn Bộ Code Đóng Gói

```javascript
// ===== TOÀN BỘ BUNDLE =====

// Phần 1: Module definitions
var modules = {
  "./src/name.js": (module) => {
    module.exports = "Alice";
  },
};

// Phần 2: Cache
var cache = {};

// Phần 3: require function
function require(modulePath) {
  var cachedModule = cache[modulePath];
  if (cachedModule !== undefined) {
    return cachedModule.exports;
  }
  var module = (cache[modulePath] = {
    exports: {},
  });
  modules[modulePath](module, module.exports, require);
  return module.exports;
}

// Phần 4: Entry execution
(() => {
  let author = require("./src/name.js");
  console.log(author, "author");
})();
```

---

## 8. Nguyên Lý ES Module Trong Webpack

### Source Code

```javascript
// name.js
const author = "Alice";
export const age = "18";
export default author;

// main.js
import author, { age } from "./name";
console.log(author, "author");
console.log(age, "age");
```

### Phân Tích Ý Tưởng

```
VẤN ĐỀ: Giờ không còn exports object để gán giá trị.
Giải quyết thế nào?

CÁCH TIẾP CẬN:
══════════════════════════════════════════════════════

  ❶ Vẫn mount nội dung export lên object exports

  ❷ Nếu export default → thêm property "default"
     vào exports

  ❸ Kết quả exports object:

     ┌─────────────────────────────────┐
     │  const exports = {             │
     │    age: "18",                  │
     │    default: "Alice",           │
     │  }                             │
     └─────────────────────────────────┘

  ❹ import author from "./name"
     → Được Webpack chuyển thành:
     const exports = require("./name")
     → Lấy exports.default = "Alice"

  ❺ Việc gán giá trị vào exports được thực hiện
     thông qua PROXY (Object.defineProperty)
```

### Điểm Khác Biệt So Với CommonJS

```
ES MODULE BUNDLE — 2 ĐIỂM KHÁC BIỆT:
══════════════════════════════════════════════════════

  ❶ require.setModuleTag(exports)
     → Đánh dấu module này là ES Module
     → Thêm Symbol.toStringTag = "Module"
     → Thêm __esModule = true

  ❷ Object.defineProperty proxy
     → Truy cập exports.default
       → thực chất truy cập biến DEFAULT_EXPORT
     → Truy cập exports.age
       → thực chất truy cập biến age
     → ĐÂY LÀ LIVE BINDING!
```

### Code Đóng Gói (Đã Tối Ưu)

```javascript
// ===== ES MODULE BUNDLE =====

// Phần 1: Module definitions
var modules = {
  "./src/name.js": (module, exports, require) => {
    // ★ Đánh dấu đây là ES Module
    require.setModuleTag(exports);

    // ★ Proxy: gán property cho exports qua defineProperty
    require.defineProperty(exports, {
      age: () => age,
      default: () => DEFAULT_EXPORT,
    });

    const author = "Alice";
    const age = "18";
    const DEFAULT_EXPORT = author;
  },
};

// Phần 2: Cache + require (giống CommonJS)
var cache = {};
function require(modulePath) {
  var cachedModule = cache[modulePath];
  if (cachedModule !== undefined) {
    return cachedModule.exports;
  }
  var module = (cache[modulePath] = {
    exports: {},
  });
  modules[modulePath](module, module.exports, require);
  return module.exports;
}

// ★ Phần 3: Proxy cho exports — defineProperty
require.defineProperty = (exports, definition) => {
  for (var key in definition) {
    Object.defineProperty(exports, key, {
      enumerable: true,
      get: definition[key], // ← GETTER → live binding!
    });
  }
};

// ★ Phần 4: Đánh dấu module là ES Module
require.setModuleTag = (exports) => {
  Object.defineProperty(exports, Symbol.toStringTag, {
    value: "Module",
  });
  Object.defineProperty(exports, "__esModule", {
    value: true,
  });
};

// Phần 5: Entry (main.js sau biên dịch)
var _name__WEBPACK_IMPORTED_MODULE_0__ = require("./src/name.js");

console.log(_name__WEBPACK_IMPORTED_MODULE_0__["default"], "author");
console.log(_name__WEBPACK_IMPORTED_MODULE_0__.age, "age");
```

### Flow Diagram

```
ES MODULE BUNDLE — FLOW THỰC THI:
══════════════════════════════════════════════════════════════

  ① KHỞI TẠO — giống CommonJS nhưng thêm helper functions
  ┌──────────────────────────────────────────────────────┐
  │  modules = { ... }                                   │
  │  cache = {}                                          │
  │  require()                                           │
  │  require.defineProperty()     ← MỚI                 │
  │  require.setModuleTag()       ← MỚI                 │
  └──────────────────────────────────────────────────────┘
                         │
                         ▼
  ② ENTRY — require("./src/name.js")
  ┌──────────────────────────────────────────────────────┐
  │  Chạy module function:                               │
  │                                                      │
  │  → setModuleTag(exports)                             │
  │    exports[Symbol.toStringTag] = "Module"            │
  │    exports.__esModule = true                         │
  │                                                      │
  │  → defineProperty(exports, {...})                    │
  │    exports.age     → getter → trả về biến age       │
  │    exports.default → getter → trả về DEFAULT_EXPORT │
  │                                                      │
  │  → Khai báo biến: author, age, DEFAULT_EXPORT       │
  └─────────┬────────────────────────────────────────────┘
            │
            ▼
  ③ TRUY CẬP GIÁ TRỊ
  ┌──────────────────────────────────────────────────────┐
  │  exports["default"]   → getter() → "Alice"          │
  │  exports.age          → getter() → "18"             │
  │                                                      │
  │  console.log("Alice", "author")                      │
  │  console.log("18", "age")                            │
  └──────────────────────────────────────────────────────┘
```

---

## 9. CommonJS Load ES Module

### Source Code

```javascript
// name.js (ES Module)
export const age = 18;
export default "Alice";

// main.js (CommonJS)
let obj = require("./name");
console.log(obj, "obj");
```

### Phân Tích

```
COMMONJS LOAD ES MODULE — NGUYÊN LÝ:
══════════════════════════════════════════════════════

  ┌───────────────────────────────────────────────────┐
  │                                                   │
  │  name.js (ES Module) vẫn được đóng gói giống     │
  │  phần 8: dùng setModuleTag + defineProperty       │
  │                                                   │
  │  main.js dùng require() → nhận exports object    │
  │  → Object có dạng:                                │
  │                                                   │
  │  { age: [Getter], default: [Getter] }             │
  │                                                   │
  │  → CommonJS nhận được TOÀN BỘ exports object     │
  │  → Bao gồm cả property "default"                 │
  │                                                   │
  └───────────────────────────────────────────────────┘

  FLOW:
  ┌─────────────┐     require()      ┌─────────────────┐
  │  main.js    │ ──────────────────► │  name.js        │
  │  (CommonJS) │                     │  (ES Module)    │
  │             │ ◄──────────────── │                   │
  │  obj =      │   exports object   │  setModuleTag() │
  │  { age:     │   với getters     │  defineProperty()│
  │    [Getter],│                    │                   │
  │    default: │                    │                   │
  │    [Getter] │                    │                   │
  │  }          │                    │                   │
  └─────────────┘                    └─────────────────┘
```

### Code Đóng Gói (Đã Tối Ưu)

```javascript
// ===== COMMONJS LOAD ES MODULE =====

var modules = {
  "./src/name.js": (module, exports, require) => {
    require.setModuleTag(exports);
    require.defineProperty(exports, {
      age: () => age,
      default: () => DEFAULT_EXPORT,
    });
    const age = 18;
    const DEFAULT_EXPORT = "Alice";
  },
};

var cache = {};
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

require.defineProperty = (exports, definition) => {
  for (var key in definition) {
    Object.defineProperty(exports, key, {
      enumerable: true,
      get: definition[key],
    });
  }
};

require.setModuleTag = (exports) => {
  Object.defineProperty(exports, Symbol.toStringTag, {
    value: "Module",
  });
  Object.defineProperty(exports, "__esModule", {
    value: true,
  });
};

// Entry
(() => {
  let obj = require("./src/name.js");
  console.log(obj, "obj");
})();

// Kết quả: { age: [Getter], default: [Getter] } obj
```

---

## 10. ES Module Load CommonJS

### Source Code

```javascript
// name.js (CommonJS)
module.exports = "Alice";

// main.js (ES Module)
import author from "./name";
console.log(author, "author");
```

### Phân Tích — Điểm Khác Biệt Duy Nhất: require.n

```
ES MODULE LOAD COMMONJS — THÊM require.n:
══════════════════════════════════════════════════════════

  ┌───────────────────────────────────────────────────────┐
  │                                                       │
  │  Cách tiếp cận cơ bản giống phần trước, CHỈ KHÁC:    │
  │                                                       │
  │  Thêm hàm require.n — trả về default export          │
  │  của module                                           │
  │                                                       │
  │  require.n = (module) => {                            │
  │    var getter = module && module.__esModule            │
  │      ? () => module["default"]  ← nếu ES Module      │
  │      : () => module;            ← nếu CommonJS       │
  │    return getter;                                     │
  │  };                                                   │
  │                                                       │
  │  LOGIC:                                               │
  │  ┌────────────────────────────────────────────────┐   │
  │  │  • Kiểm tra module.__esModule                  │   │
  │  │  • Nếu true → lấy module["default"]           │   │
  │  │  • Nếu false → lấy toàn bộ module             │   │
  │  │    (vì CommonJS export toàn bộ qua             │   │
  │  │     module.exports)                            │   │
  │  └────────────────────────────────────────────────┘   │
  │                                                       │
  │  Ý tưởng cốt lõi vẫn là: export nội dung cuối cùng  │
  │  của module dưới dạng exports object                  │
  │                                                       │
  └───────────────────────────────────────────────────────┘
```

### Code Đóng Gói (Đã Tối Ưu)

```javascript
// ===== ES MODULE LOAD COMMONJS =====

var modules = {
  "./src/name.js": (module) => {
    module.exports = "Alice";
  },
};

var cache = {};
function require(modulePath) {
  var cachedModule = cache[modulePath];
  if (cachedModule !== undefined) {
    return cachedModule.exports;
  }
  var module = (cache[modulePath] = {
    exports: {},
  });
  modules[modulePath](module, module.exports, require);
  return module.exports;
}

// ★ HÀM MỚI: Lấy default export
require.n = (module) => {
  var getter =
    module && module.__esModule
      ? () => module["default"] // ES Module → lấy .default
      : () => module; // CommonJS → lấy toàn bộ
  require.defineProperty(getter, {
    a: getter,
  });
  return getter;
};

require.defineProperty = (exports, definition) => {
  for (var key in definition) {
    Object.defineProperty(exports, key, {
      enumerable: true,
      get: definition[key],
    });
  }
};

require.setModuleTag = (exports) => {
  Object.defineProperty(exports, Symbol.toStringTag, {
    value: "Module",
  });
  Object.defineProperty(exports, "__esModule", {
    value: true,
  });
};

// Entry
var __webpack_exports__ = {};
(() => {
  "use strict";
  require.setModuleTag(__webpack_exports__);

  var _name__WEBPACK_IMPORTED_MODULE_0__ = require("./src/name.js");
  var _name__WEBPACK_IMPORTED_MODULE_0___default = require.n(
    _name__WEBPACK_IMPORTED_MODULE_0__,
  );

  // Gọi getter() → trả về "Alice"
  console.log(_name__WEBPACK_IMPORTED_MODULE_0___default(), "author");
})();
```

### Flow So Sánh Toàn Bộ 4 Trường Hợp

```
TÓM TẮT 4 TRƯỜNG HỢP CROSS-MODULE LOADING:
══════════════════════════════════════════════════════════════

  ┌─────────────────┬─────────────────┬──────────────────────┐
  │   Source →      │   Target →      │  Webpack xử lý      │
  │   (import)      │   (export)      │                      │
  ├─────────────────┼─────────────────┼──────────────────────┤
  │                 │                 │  Chỉ cần:            │
  │  CommonJS       │  CommonJS       │  modules + cache     │
  │  require()      │  module.exports │  + require           │
  ├─────────────────┼─────────────────┼──────────────────────┤
  │                 │                 │  Thêm:               │
  │  ES Module      │  ES Module      │  setModuleTag        │
  │  import         │  export         │  defineProperty      │
  ├─────────────────┼─────────────────┼──────────────────────┤
  │                 │                 │  Thêm:               │
  │  CommonJS       │  ES Module      │  setModuleTag        │
  │  require()      │  export         │  defineProperty      │
  ├─────────────────┼─────────────────┼──────────────────────┤
  │                 │                 │  Thêm:               │
  │  ES Module      │  CommonJS       │  require.n           │
  │  import         │  module.exports │  (lấy default)       │
  └─────────────────┴─────────────────┴──────────────────────┘
```

---

## 11. Tổng Kết & Bài Tập

### Tổng Kết

Bài viết phân tích nguyên lý module hóa trong Webpack từ nhiều góc độ, tập trung vào **sản phẩm build** (build artifacts). Mặc dù code tổng thể nhỏ gọn, nhưng nó hỗ trợ **cross-module referencing** một cách khéo léo.

```
ĐIỂM CHÍNH CẦN NHỚ:
══════════════════════════════════

  ❶ Webpack chuyển TẤT CẢ modules thành functions
     trong object "modules" → key = path, value = fn

  ❷ Hàm require() với cache mechanism
     → Load 1 lần, dùng nhiều lần

  ❸ ES Module được đánh dấu bằng:
     • Symbol.toStringTag = "Module"
     • __esModule = true

  ❹ Live binding qua Object.defineProperty getter
     → Truy cập property = gọi getter function

  ❺ require.n xử lý trường hợp
     ES Module import CommonJS
     → Kiểm tra __esModule để quyết định
       lấy .default hay toàn bộ module
```

### Bài Tập — Câu Hỏi Thực Thi Code

**Câu hỏi then chốt: Các chuẩn module hóa giải quyết vấn đề Circular Dependencies như thế nào?**

```javascript
// ===== a.js =====
const getMes = require("./b");
console.log("Tôi là file a");
exports.say = function () {
  const message = getMes();
  console.log(message);
};

// ===== b.js =====
const say = require("./a");
const object = {
  name: "Nguyên lý module hóa từ sản phẩm build",
  author: "Alice",
};
console.log("Tôi là file b");
module.exports = function () {
  return object;
};

// ===== main.js (entry) =====
const a = require("./a");
const b = require("./b");
console.log("Entry file");
```

**Câu hỏi: Khi thực thi `main.js`, console sẽ in ra gì?**

```
GỢI Ý PHÂN TÍCH:
══════════════════════════════════

  Hãy suy nghĩ theo thứ tự require() được gọi:

  main.js → require('./a')
    ├── a.js bắt đầu thực thi
    ├── a.js → require('./b')
    │   ├── b.js bắt đầu thực thi
    │   ├── b.js → require('./a')
    │   │   └── ??? (a.js đã nằm trong cache
    │   │          nhưng chưa chạy xong!)
    │   ├── b.js tiếp tục...
    │   └── b.js thực thi xong
    ├── a.js tiếp tục...
    └── a.js thực thi xong
  main.js → require('./b')
    └── cache hit → trả về ngay

  💡 KEY INSIGHT: Khi circular dependency xảy ra,
     CommonJS trả về TRẠNG THÁI HIỆN TẠI của
     module.exports tại THỜI ĐIỂM ĐÓ (chưa hoàn
     thành) → exports có thể là object rỗng {}
```

```
ĐÁP ÁN:
══════════════════════════════════

  Console output theo thứ tự:

  1. "Tôi là file b"
  2. "Tôi là file a"
  3. "Entry file"

  GIẢI THÍCH:
  ┌──────────────────────────────────────────────────┐
  │                                                  │
  │  1. main.js → require('./a')                    │
  │  2. a.js chạy → require('./b')                  │
  │  3. b.js chạy → require('./a')                  │
  │     → a.js đang trong cache nhưng chưa xong    │
  │     → Trả về exports HIỆN TẠI = {}             │
  │     → say = {} (chưa có property say)           │
  │  4. b.js → console.log('Tôi là file b') ← ❶   │
  │  5. b.js xong → trả về cho a.js                │
  │  6. a.js → console.log('Tôi là file a') ← ❷   │
  │  7. a.js xong → trả về cho main.js             │
  │  8. main.js → require('./b')                    │
  │     → Cache hit! Trả về ngay                    │
  │  9. main.js → console.log('Entry file')  ← ❸   │
  │                                                  │
  └──────────────────────────────────────────────────┘
```

---

## Trả Lời Câu Hỏi Phỏng Vấn

```
TRẢ LỜI CÁC CÂU HỎI ĐẦU BÀI:
══════════════════════════════════════════════════════════════

  ❶ Module hóa giải quyết vấn đề gì?
     → Ô nhiễm biến toàn cục (global pollution)
     → Quản lý dependency lộn xộn
     → Xuất hiện khi nhiều developer cùng phát triển
       ứng dụng front-end, biến trùng tên ghi đè nhau

  ❷ Module hóa hỗ trợ thế nào trong Web?
     → Webpack chuyển modules thành object (key=path,
       value=function), tạo hàm require() + cache
     → Code load qua bundle file duy nhất

  ❸ CommonJS load ES Module được không?
     → ✅ ĐƯỢC — Webpack xử lý bằng setModuleTag +
       defineProperty, CommonJS nhận exports object
       với getters

  ❹ ES Module load CommonJS được không?
     → ✅ ĐƯỢC — Webpack thêm require.n để kiểm tra
       __esModule và quyết định lấy .default
       hay toàn bộ module

  ❺ Webpack phân biệt chuẩn module bằng cách nào?
     → Dùng __esModule flag: true = ES Module
     → Dùng Symbol.toStringTag = "Module"

  ❻ Một module dùng cả CommonJS và ES Module?
     → Có thể mix trong cùng project, nhưng
       KHÔNG NÊN dùng cả hai trong cùng 1 file
     → Webpack sẽ xử lý tùy theo cú pháp phát hiện
```
