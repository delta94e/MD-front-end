# CommonJS & ES6 Modules — Hiểu Sâu Từ Bản Chất

> Phân tích chi tiết CommonJS và ES6 Modules từ góc độ bộ nhớ, cơ chế loading, circular reference, Tree-shaking và sử dụng trong các môi trường khác nhau.
> Độ khó: ⭐️⭐️⭐️ | Thời gian đọc: ~38 phút

---

## Table of Contents

1. [Tại Sao Cần Module Hóa?](#1-tại-sao-cần-module-hóa)
2. [Vấn Đề Khi Không Có Module](#2-vấn-đề-khi-không-có-module)
3. [Các Chuẩn Module Hiện Tại](#3-các-chuẩn-module-hiện-tại)
4. [CommonJS — Cú Pháp Export/Import](#4-commonjs--cú-pháp-exportimport)
5. [CommonJS — require Wrapper & Cơ Chế Bên Trong](#5-commonjs--require-wrapper--cơ-chế-bên-trong)
6. [CommonJS — module.exports vs exports (Góc Nhìn Bộ Nhớ)](#6-commonjs--moduleexports-vs-exports-góc-nhìn-bộ-nhớ)
7. [CommonJS — Thứ Tự Loading & Circular Reference](#7-commonjs--thứ-tự-loading--circular-reference)
8. [CommonJS — Bản Chất & Quy Trình Loading](#8-commonjs--bản-chất--quy-trình-loading)
9. [ES6 Modules — Cú Pháp Export](#9-es6-modules--cú-pháp-export)
10. [ES6 Modules — Cú Pháp Import](#10-es6-modules--cú-pháp-import)
11. [ES6 Modules — Đặc Tính Quan Trọng](#11-es6-modules--đặc-tính-quan-trọng)
12. [ES6 Modules — Circular Reference](#12-es6-modules--circular-reference)
13. [So Sánh CommonJS vs ES6 Modules](#13-so-sánh-commonjs-vs-es6-modules)
14. [Những Điểm Dễ Nhầm Lẫn](#14-những-điểm-dễ-nhầm-lẫn)
15. [Sử Dụng Trong Các Môi Trường](#15-sử-dụng-trong-các-môi-trường)
16. [Tree-shaking](#16-tree-shaking)
17. [pkg.module & Webpack vs Rollup](#17-pkgmodule--webpack-vs-rollup)
18. [Tổng Kết](#18-tổng-kết)

---

## 1. Tại Sao Cần Module Hóa?

**Module hóa** = chia chương trình thành **các đơn vị nhỏ (module)**, mỗi module có:

- **Logic code riêng** và **scope riêng** — không ảnh hưởng module khác
- Khả năng **export** biến, hàm, object cho module khác sử dụng
- Khả năng **import** từ module khác

### Lỗi Thiết Kế Của JavaScript

```
VẤN ĐỀ LỊCH SỬ CỦA JAVASCRIPT:
═══════════════════════════════════════════════════════════════

  ❶ var không có block scope → biến bị chia sẻ toàn cục
  ❷ OOP không có class (trước ES6)
  ❸ KHÔNG CÓ hệ thống module → không có cách tách biệt code

  JavaScript ban đầu chỉ là ngôn ngữ script nhỏ
  → validate form, animation đơn giản

  Nhưng sau đó:
  ┌──────────────────────────────────────────────────────┐
  │  AJAX     → Tách frontend/backend → render phía FE  │
  │  SPA      → Routing, State Management phức tạp      │
  │  Node.js  → Viết backend phức tạp bằng JS           │
  └──────────────────────────────────────────────────────┘

  → Module hóa trở thành NHU CẦU CẤP BÁCH
  → Trước ES6 (2015): AMD, CMD, CommonJS ra đời
  → ES6: Chính thức có ES Modules
```

---

## 2. Vấn Đề Khi Không Có Module

### Demo — Xung Đột Biến

Giả sử team có 2 dev: Hào và Hồng.

```javascript
// bar.js (Hào viết)
var name = "Hào";
console.log("bar.js----", name);

// foo.js (Hồng viết)
var name = "Hồng";
console.log("foo.js----", name);

// baz.js (Hào viết)
console.log("baz.js----", name);
```

```html
<body>
  <script src="./bar.js"></script>
  <script src="./foo.js"></script>
  <script src="./baz.js"></script>
</body>
```

```
KẾT QUẢ:
═══════════════════════════════════════════

  bar.js---- Hào
  foo.js---- Hồng
  baz.js---- Hồng     ← ❌ name bị Hồng ghi đè!
```

> Mỗi file `.js` **KHÔNG** phải module độc lập → biến `name` bị chia sẻ toàn cục!

### Giải Pháp Ban Đầu — IIFE

```javascript
// bar.js (IIFE — tạo scope riêng)
var moduleBar = (function () {
  var name = "Hào";
  var age = 18;
  console.log("bar.js----", name, age);
  return { name, age };
})();

// baz.js
console.log("baz.js----", moduleBar.name); // ✅ "Hào"

// foo.js (IIFE)
(function () {
  var name = "Hồng";
  var age = 20;
  console.log("foo.js----", name, age);
})();
```

**Vấn đề của IIFE:**

1. Phải **nhớ tên biến** mỗi module trả về
2. Code **lộn xộn** — mọi file phải bọc trong anonymous function
3. **Không có chuẩn** — ai cũng đặt tên tùy ý, dễ trùng

→ Cần chuẩn thống nhất → **CommonJS** ra đời!

---

## 3. Các Chuẩn Module Hiện Tại

```
BA CHUẨN MODULE PHỔ BIẾN:
═══════════════════════════════════════════════════════════════

  ┌─────────────┬───────────────────────────────────────────┐
  │  Chuẩn      │  Mô tả                                   │
  ├─────────────┼───────────────────────────────────────────┤
  │  UMD        │  Kết hợp AMD + CommonJS + Global          │
  │             │  Chạy trên cả Node + Browser              │
  │             │  Phổ biến cho thư viện                    │
  ├─────────────┼───────────────────────────────────────────┤
  │  CommonJS   │  Chuẩn của Node.js                        │
  │             │  require/module.exports                    │
  │             │  Đồng bộ, runtime loading                 │
  ├─────────────┼───────────────────────────────────────────┤
  │  ES Modules │  Chuẩn chính thức ES6 (2015)              │
  │             │  import/export                            │
  │             │  Tĩnh, compile-time analysis              │
  └─────────────┴───────────────────────────────────────────┘
```

### UMD — Universal Module Definition

```javascript
(function (global, factory) {
  typeof exports === "object" && typeof module !== "undefined"
    ? (module.exports = factory()) // Node → CommonJS
    : typeof define === "function" && define.amd
      ? define(factory) // AMD → RequireJS
      : (global.libName = factory()); // Browser → Global
})(this, function () {
  "use strict";
});
```

> Nếu thấy code như trên ở đầu file → file đó dùng **UMD**. Hầu hết thư viện frontend hiện tại đều dùng UMD để đóng gói.

---

## 4. CommonJS — Cú Pháp Export/Import

### Đặc Tính CommonJS Trong Node

```
COMMONJS TRONG NODE:
═══════════════════════════════════════════════════════

  ✅ Mỗi file .js = một module độc lập
  ✅ Biến cốt lõi: exports, module.exports, require
  ✅ Export bằng: exports.xxx hoặc module.exports
  ✅ Import bằng: require()
```

### Export — `module.exports` và `exports`

```javascript
// foo.js

// Cách 1: Export từng thuộc tính
module.exports.age = 1;
module.exports.foo = function () {};
exports.a = "hello";

// Cách 2: Export toàn bộ object
module.exports = { age: 1, a: "hello", foo: function () {} };

// ⚠️ SAI — exports KHÔNG THỂ gán lại object!
exports = { age: 1, a: "hello", foo: function () {} };
// → exports mất tham chiếu đến module.exports
// → trở thành biến cục bộ → không export được gì!
```

> **Lý do**: Trước khi module chạy, Node thực hiện `exports = module.exports`. Gán lại `exports` sẽ **mất tham chiếu** (xem phần 6).

### Import — `require`

```javascript
const foo = require("./foo.js");
console.log(foo.age); // 1
```

### Quy Tắc Tìm Kiếm Module Của `require`

```
QUY TẮC TÌM KIẾM — require('./moduleA')
═══════════════════════════════════════════════════════════════
Giả sử gọi từ: src/app/index.js

  ❶ ĐƯỜNG DẪN TƯƠNG ĐỐI: ./moduleA
  ────────────────────────────────────────
  Tìm trong thư mục cùng cấp: src/app/

  src/app/moduleA        (không có extension → parse JS)
  src/app/moduleA.js     (JS)
  src/app/moduleA.json   (JSON)
  src/app/moduleA.node   (Native addon)

  Nếu không tìm thấy file → tìm THƯ MỤC: src/app/moduleA/

  src/app/moduleA/package.json → trường "main"
  src/app/moduleA/index.js
  src/app/moduleA/index.json
  src/app/moduleA/index.node

  ❷ ĐƯỜNG DẪN TUYỆT ĐỐI: /module/moduleA
  ────────────────────────────────────────
  Tìm trực tiếp, áp dụng quy tắc tương tự

  ❸ KHÔNG CÓ ĐƯỜNG DẪN: require('react')
  ────────────────────────────────────────
  Kiểm tra core module (path, http, fs...)
  → Nếu không phải → tìm trong node_modules:

  /src/app/node_modules/react → react.js → react/package.json...
  /src/node_modules/react
  /node_modules/react
  → Lên thư mục cha cho đến root
```

---

## 5. CommonJS — require Wrapper & Cơ Chế Bên Trong

### Node Bọc Module Trong Hàm

Mỗi module trong Node thực chất được **bọc trong một hàm**:

```javascript
function wrapper(script) {
  return (
    "(function (exports, require, module, __filename, __dirname) {" +
    script +
    "\n})"
  );
}
```

### Mô Phỏng require

```javascript
function require(id) {
  // Bước 1: Kiểm tra cache
  var cachedModule = Module._cache[id];
  if (cachedModule) {
    return cachedModule.exports; // ← Đã load → trả cache
  }

  // Bước 2: Tạo module object mới
  const module = { exports: {} };

  // Bước 3: THÊM VÀO CACHE TRƯỚC KHI THỰC THI
  // (quan trọng cho circular reference!)
  Module._cache[id] = module;

  // Bước 4: Thực thi module code
  eval(wrapper('module.exports = "123"'))(
    module.exports,
    require,
    module,
    "filename",
    "dirname",
  );

  // Bước 5: Trả về exports
  return module.exports;
}
```

```
3 ĐIỂM QUAN TRỌNG TỪ require:
═══════════════════════════════════════════════════════════════

  ❶ Module chỉ THỰC THI MỘT LẦN
     Các lần gọi sau → lấy từ cache (module.exports)
     Kể cả khi module chưa chạy xong (cache trước, chạy sau)

  ❷ Export = GÁN BIẾN
     Kiểu nguyên thủy: export GIÁ TRỊ (copy)
     Kiểu tham chiếu:  export ĐỊA CHỈ tham chiếu

  ❸ exports = module.exports (cùng tham chiếu)
     Gán lại exports = {} → mất tham chiếu
     → Kết quả export THỰC SỰ luôn là module.exports
```

---

## 6. CommonJS — module.exports vs exports (Góc Nhìn Bộ Nhớ)

### Bản Chất: Cùng Tham Chiếu

```
BỘ NHỚ — BAN ĐẦU:
═══════════════════════════════════════════════════════════════

  STACK                          HEAP
  ┌──────────────────┐           ┌──────────────────────┐
  │  module.exports ─┼──────┐   │                      │
  │                  │      ├──→│  { }  (object rỗng)  │
  │  exports ────────┼──────┘   │                      │
  │                  │          └──────────────────────┘
  │  bar (main.js) ──┼──────────→  (cùng object sau require)
  └──────────────────┘
```

> `module.exports = exports = bar` — cả ba trỏ cùng một object!

### Demo Chứng Minh

```javascript
// bar.js
const name = "Hào";
exports.name = name;

setTimeout(() => {
  module.exports.name = "HaHaHa";
  console.log("bar.js 1s sau:", exports.name);
}, 1000);

// main.js
const bar = require("./bar");
console.log("main.js:", bar.name);

setTimeout(() => {
  console.log("main.js 1s sau:", bar.name);
}, 2000);
```

```
KẾT QUẢ:
═══════════════════════════════════════════

  main.js: Hào
  bar.js 1s sau: HaHaHa       ← exports.name cũng đổi!
  main.js 2s sau: HaHaHa      ← bar.name cũng đổi!

  → Cả 3 (module.exports, exports, bar) cùng ref → đổi 1 = đổi cả 3
```

### Khi module.exports Bị GÁN LẠI Object Mới

```javascript
// bar.js
module.exports = {
  name: "Object mới",
  age: 20,
};

exports.name = "Cái này VÔ ÍCH";
// → exports vẫn trỏ object cũ
// → module.exports trỏ object MỚI
// → require trả về object MỚI
```

```
BỘ NHỚ — SAU KHI GÁN LẠI:
═══════════════════════════════════════════════════════════════

  STACK                          HEAP
  ┌──────────────────┐           ┌──────────────────────┐
  │  module.exports ─┼────────→ │  { name: "Object mới",│
  │                  │           │    age: 20 }          │
  │                  │           └──────────────────────┘
  │  exports ────────┼────────→ ┌──────────────────────┐
  │                  │          │  { name: "VÔ ÍCH" }  │ ← BỎ ĐI!
  │                  │          └──────────────────────┘
  │  bar (main.js) ──┼────────→ (= module.exports MỚI)
  └──────────────────┘
```

> **Bản chất**: `require` LUÔN trả về `module.exports`. `exports` chỉ là alias tiện lợi.

### Bài Tập — Value Type vs Reference Type

```javascript
// BÀI 1: Export value type
// bar.js
let name = "Hào";
setTimeout(() => {
  name = "123123";
}, 1000);
module.exports = { name: name, age: "20" };

// main.js
const bar = require("./bar");
console.log(bar.name); // "Hào"
setTimeout(() => console.log(bar.name), 2000); // "Hào" ← KHÔNG ĐỔI!
// → name là value type → copy giá trị vào object → timer đổi biến gốc
//   nhưng KHÔNG ảnh hưởng object đã export
```

```javascript
// BÀI 2: Export reference type
// bar.js
let info = { name: "Hào" };
setTimeout(() => {
  info.name = "123123";
}, 1000);
module.exports = { info: info, age: "20" };

// main.js
const bar = require("./bar");
console.log(bar.info.name); // "Hào"
setTimeout(() => console.log(bar.info.name), 2000); // "123123" ← ĐỔI!
// → info là reference type → export ĐỊA CHỈ → timer đổi object gốc
//   → bar.info cũng đổi theo!
```

```
TỔNG KẾT VALUE vs REFERENCE:
═══════════════════════════════════════════════════════════════

  ┌──────────────────┬─────────────────────────────────────┐
  │  Value Type      │  Copy GIÁ TRỊ vào module.exports   │
  │  (string, number)│  Đổi biến gốc → KHÔNG ảnh hưởng    │
  ├──────────────────┼─────────────────────────────────────┤
  │  Reference Type  │  Copy ĐỊA CHỈ vào module.exports   │
  │  (object, array) │  Đổi thuộc tính → CÓ ảnh hưởng     │
  └──────────────────┴─────────────────────────────────────┘
```

---

## 7. CommonJS — Thứ Tự Loading & Circular Reference

### Kết Luận 1: Module chỉ thực thi MỘT LẦN

```javascript
// aaa.js
const name = "coderwhy";
console.log("Hello aaa");

// main.js
const aaa = require("./aaa"); // → In "Hello aaa"
```

### Kết Luận 2: Import nhiều lần → cache → chỉ chạy MỘT LẦN

```javascript
// main.js
const aaa = require("./aaa");
const bbb = require("./bbb");

// aaa.js
const ccc = require("./ccc");

// bbb.js
const ccc = require("./ccc");

// ccc.js
console.log("ccc được load");
// → "ccc được load" chỉ in MỘT LẦN!
```

> Mỗi module object có thuộc tính `loaded`: `false` → chưa load, `true` → đã load.

### Kết Luận 3: Circular Import — DFS

```
THỨ TỰ LOAD — DEPTH-FIRST SEARCH:
═══════════════════════════════════════════════════════════════

         main
        /    \
      aaa    bbb
      / \      \
    ccc  ddd   eee

  Thứ tự: main → aaa → ccc → ddd → eee → bbb
  (Node dùng DFS — Depth-First Search)
```

### Phân Tích Circular Reference Từng Bước

```javascript
// a.js
module.exports.a = 1;
var b = require("./b");
console.log(b);
module.exports.a = 2;

// b.js
module.exports.b = 11;
var a = require("./a");
console.log(a);
module.exports.b = 22;

// main.js
var a = require("./a");
console.log(a);
```

```
PHÂN TÍCH TỪNG BƯỚC:
═══════════════════════════════════════════════════════════════

  ❶ node main.js → require(a.js)

  ❷ require(a): cache chưa có → tạo module → THÊM VÀO CACHE
     → thực thi a.js

  ❸ a.js dòng 1: exports.a = 1
     a.js dòng 2: require(b.js)       ← a mới chạy dòng 1!

  ❹ require(b): cache chưa có → tạo module → THÊM VÀO CACHE
     → thực thi b.js

  ❺ b.js dòng 1: exports.b = 11
     b.js dòng 2: require(a.js)       ← circular!

  ❻ require(a): cache CÓ RỒI! → trả cache
     cache lúc này: { a: 1 }          ← a chưa chạy xong!

  ❼ b.js dòng 3: console.log(a)      → { a: 1 }
     b.js dòng 4: exports.b = 22
     → b.js chạy XONG → quay lại a.js

  ❽ a.js dòng 3: console.log(b)      → { b: 22 }
     a.js dòng 4: exports.a = 2
     → a.js chạy XONG → quay lại main.js

  ❾ main.js dòng 2: console.log(a)   → { a: 2 }

  KẾT QUẢ CONSOLE:
  { a: 1 }      ← b.js in ra (a chưa chạy xong)
  { b: 22 }     ← a.js in ra
  { a: 2 }      ← main.js in ra
```

---

## 8. CommonJS — Bản Chất & Quy Trình Loading

```
BẢN CHẤT COMMONJS:
═══════════════════════════════════════════════════════════════

  ┌──────────────────────────────────────────────────────────┐
  │  CommonJS = GÁN THAM CHIẾU OBJECT (shallow copy)       │
  │                                                          │
  │  module.exports = exports = bar (trong main.js)          │
  │                                                          │
  │  Loading:                                                │
  │  ✅ Runtime loading (chạy JS mới load module)           │
  │  ✅ Đồng bộ (code sau phải chờ module load xong)        │
  │  ✅ Export object → các module cùng trỏ 1 object        │
  │  ✅ Sửa thuộc tính object → tất cả đều thấy             │
  └──────────────────────────────────────────────────────────┘
```

```javascript
const flag = true;
if (flag) {
  const foo = require("./foo"); // ← Có thể require trong if!
  console.log("Chờ require xong mới in dòng này");
}
```

---

## 9. ES6 Modules — Cú Pháp Export

### Named Export

```javascript
// Cách 1: Export khi khai báo
export let name1 = "name1";
export function foo() {}
export class MyClass {}

// Cách 2: Export sau khi khai báo (binding)
let a = 1,
  b = 2;
export { a, b };

// Cách 3: Đổi tên
export { variable1 as name1, variable2 as name2 };
```

### Default Export

```javascript
export default expression;
export default function () {}
export default function name1() {}
export { name1 as default };
```

### Re-export (Redirect)

```javascript
export * from "module"; // Tất cả (trừ default)
export { name1, name2 } from "module"; // Named
export { import1 as name1 } from "module"; // Đổi tên
```

---

## 10. ES6 Modules — Cú Pháp Import

```javascript
// Named import
import { a, b, c } from "module";
import { a as newA, b, c as newC } from "module";

// Default import
import defaultExport from "module";

// Mixed import
import defaultExport, { a, b, c } from "module";
import defaultExport, * as name from "module";

// Namespace import
import * as name from "module";
// name = { a, b, c, default: ... }

// Side-effect only (chạy module, không import gì)
import "module"; // Chỉ chạy 1 lần dù gọi nhiều lần

// Dynamic import (async)
const module = await import("module"); // Trả về Promise
```

---

## 11. ES6 Modules — Đặc Tính Quan Trọng

### ❶ Cú Pháp TĨNH (Static)

```javascript
// ✅ import tự động được đưa lên đầu file (hoisting)

// ❌ KHÔNG THỂ dùng trong block/condition
{
  export let a = 1;              // ❌ SyntaxError
  import defaultExport from 'module'; // ❌ SyntaxError
}

if (true) {
  export let a = 1;              // ❌ SyntaxError
}

// ❌ Tên import KHÔNG THỂ là string hoặc biểu thức
import 'defaultExport' from 'module';        // ❌
let name = 'Export';
import 'default' + name from 'module';       // ❌
```

> **Tĩnh** = xác định import/export **tại compile time** → cho phép:
>
> - Tìm dependency nhanh hơn
> - Lint tool kiểm tra dependency
> - Static type checking
> - **Tree-shaking**

### ❷ Export Là BINDING (Ràng Buộc Tham Chiếu)

```javascript
// JS thông thường: value type = COPY
let a = 1;
let b = a;
b = 2;
console.log(a, b); // 1, 2

// ES Module: KỂ CẢ value type cũng là BINDING!
// foo.js
export let a = 1;
export function count() {
  a++;
}

// main.js
import { a, count } from "./foo";
console.log(a); // 1
count();
console.log(a); // 2 ← a THAY ĐỔI! (binding, không phải copy)
```

```
SO SÁNH — COMMONJS vs ES MODULE BINDING:
═══════════════════════════════════════════════════════════════

  CommonJS:   export GIÁ TRỊ (value type = copy)
  ES Module:  export BINDING  (value type cũng là tham chiếu!)

  ⚠️ NGOẠI TRỪ: export default value
  ─────────────────────────────────
  let a = 1;
  export default a;   // ← Copy giá trị! Giống CommonJS!

  // Workaround: dùng named export cho default
  let a = 1;
  export { a as default };  // ← Binding! a thay đổi = default thay đổi
  export function count() { a++; }
```

### ❸ Strict Mode & Read-only

- ES Module tự động chạy trong **strict mode**
- Biến import là **read-only** (const) — không thể gán lại

---

## 12. ES6 Modules — Circular Reference

```javascript
// bar.js
import { foo } from "./foo";
console.log(foo);
export let bar = "bar";

// foo.js
import { bar } from "./bar";
console.log(bar);
export let foo = "foo";

// main.js
import { bar } from "./bar";
console.log(bar);
```

```
PHÂN TÍCH:
═══════════════════════════════════════════════════════════════

  main.js → import bar.js
  bar.js  → import foo.js
  foo.js  → import bar.js → bar.js đã thực thi → trả về
         → console.log(bar)
         → ❌ ReferenceError: bar is not defined!

  Vì bar dùng "let" → chưa khai báo tại thời điểm foo.js truy cập
  (let không hoisting giá trị như function)
```

### Giải Pháp: Dùng `function` Declaration

```javascript
// bar.js
import { foo } from "./foo";
console.log(foo()); // ✅ "foo"
export function bar() {
  return "bar";
}

// foo.js
import { bar } from "./bar";
console.log(bar()); // ✅ "bar"
export function foo() {
  return "foo";
}

// main.js
import { bar } from "./bar";
console.log(bar); // ✅ [Function: bar]
```

> `function` declaration được **hoisting** lên đầu file → có thể gọi trước khi module import hoàn tất. **Tránh dùng biến ngoài** trong function vì chúng có thể chưa được khai báo.

---

## 13. So Sánh CommonJS vs ES6 Modules

```
SO SÁNH TOÀN DIỆN:
═══════════════════════════════════════════════════════════════

  ┌─────────────────┬──────────────────┬───────────────────────┐
  │  Tiêu chí        │  CommonJS        │  ES6 Modules          │
  ├─────────────────┼──────────────────┼───────────────────────┤
  │  Export          │  Copy giá trị    │  Binding/tham chiếu   │
  │                  │                  │  (default là copy)    │
  ├─────────────────┼──────────────────┼───────────────────────┤
  │  Số lượng export │  Một giá trị     │  Nhiều giá trị        │
  │                  │  (module.exports)│  (named + default)    │
  ├─────────────────┼──────────────────┼───────────────────────┤
  │  Cú pháp        │  Động (runtime)  │  Tĩnh (compile-time)  │
  │                  │  Dùng trong if   │  Chỉ top-level        │
  ├─────────────────┼──────────────────┼───────────────────────┤
  │  this            │  module hiện tại │  undefined            │
  ├─────────────────┼──────────────────┼───────────────────────┤
  │  Loading        │  Đồng bộ         │  Bất đồng bộ          │
  │                  │  Runtime         │  Compile-time         │
  ├─────────────────┼──────────────────┼───────────────────────┤
  │  Tree-shaking   │  ❌ Không hỗ trợ │  ✅ Hỗ trợ             │
  └─────────────────┴──────────────────┴───────────────────────┘
```

---

## 14. Những Điểm Dễ Nhầm Lẫn

### ❶ Module Syntax ≠ Destructuring

```javascript
// Module syntax — HOÀN TOÀN KHÁC destructuring!
import { a } from "module"; // ← Module import
const { a } = require("module"); // ← Destructuring

// Module syntax chỉ hỗ trợ:
// import/export { a } / { a, b } / { a as c } FromClause

// Destructuring syntax:
let { a } = { a: 1 };
let { a = 2 } = {};
let { a: b } = { a: 1 };
let { a: b = 2, ...res } = { name: "a" };
// → Hai cú pháp KHÁC NHAU hoàn toàn!
```

### ❷ Export Syntax ≠ Object Shorthand

```javascript
let a = 1;

export { a }; // ← Export syntax (binding)
export default { a }; // ← Object shorthand, export { a: 1 }

module.exports = { a }; // ← Object shorthand, export { a: 1 }
```

> `export default` và `module.exports` giống nhau ở điểm này — đều export giá trị (copy).

---

## 15. Sử Dụng Trong Các Môi Trường

### Browser

```html
<script type="module" src="index.js"></script>
<!-- hoặc inline -->
<script type="module">
  import module from "./module.js";
  console.log(module); // 123
</script>
```

> ⚠️ Phải chạy trên **Web Server** — mở file trực tiếp sẽ không hoạt động.
> ⚠️ Browser KHÔNG hỗ trợ CommonJS.
> ⚠️ Phải có extension trong import path (`.js`, `.mjs`).

### Node.js

```javascript
// module.mjs
export default 123;

// index.mjs — phải dùng extension .mjs
import module from "./module.mjs";
console.log(module); // 123
```

```bash
node --experimental-modules index.mjs
```

Node import CommonJS từ ES Module:

```javascript
// module.js (CommonJS)
module.exports.a = 123; // module.exports ≈ export default

// index.mjs (ES Module)
import module from "./module.js";
console.log(module); // { a: 123 }

import * as module from "./module.js";
console.log(module); // { default: { a: 123 } }
```

Node CommonJS import ES Module → chỉ dùng `import()` dynamic:

```javascript
// es.mjs
export default { name: "foo" };
export let a = 1;

// cjs.js
import("./es.mjs").then((res) => {
  console.log(res); // { default: {name:'foo'}, a: 1 }
});
```

### Khác Biệt Node vs Webpack/Rollup Khi Import CommonJS

```javascript
// module.js
module.exports.a = 1;

// Webpack/Rollup:
import * as a from "./module";
// → { a: 1, default: { a: 1 } }
// Cả module.exports lẫn từng key đều export

// Node (.mjs):
import * as a from "./module";
// → { default: { a: 1 } }
// CHỈ có default — module.exports = export default
```

---

## 16. Tree-shaking

> **Tree-shaking** = loại bỏ code không sử dụng. Khái niệm bắt nguồn từ **Rollup**, sau đó **Webpack 2** hỗ trợ. Dựa trên **phân tích tĩnh** của ES Module.

### Rollup Tree-shaking

```javascript
// module.js
export let foo = "foo";
export let bar = "bar";

// index.js
import { foo } from "./module";
console.log(foo);

// KẾT QUẢ ĐÓNG GÓI:
let foo = "foo";
console.log(foo);
// → bar đã bị XÓA! ✅
```

### Webpack Tree-shaking

```javascript
// ES Module → ✅ Tree-shaking hoạt động
export function foo() {
  return "foo";
}
export function bar() {
  return "bar";
}
// import { foo } → bar bị xóa ✅

// CommonJS → ❌ KHÔNG Tree-shaking
module.exports.foo = function () {
  return "foo";
};
module.exports.bar = function () {
  return "bar";
};
// import { foo } → bar VẪN CÒN ❌
```

> Webpack **KHÔNG** hỗ trợ Tree-shaking cho CommonJS!

---

## 17. pkg.module & Webpack vs Rollup

### Vấn Đề: npm Package Dùng CommonJS

Hầu hết npm packages dùng CommonJS → không Tree-shaking được. Giải pháp:

```
GIẢI PHÁP — pkg.module:
═══════════════════════════════════════════════════════════════

  package.json:
  {
    "main": "dist/lib.cjs.js",       ← CommonJS (cho Node)
    "module": "dist/lib.esm.js",     ← ES Module (cho bundler)
  }

  Webpack/Rollup thấy trường "module" → dùng ES Module version
  → Tree-shaking hoạt động! ✅
```

> ⚠️ Code trong `module` field phải là **ES5 + ES Module syntax** (vì babel thường exclude `node_modules`).
> ⚠️ Nếu dùng `@babel/preset-env`, cần set `"modules": false` để không convert ES Module → CommonJS.

### So Sánh Webpack vs Rollup

```
WEBPACK vs ROLLUP:
═══════════════════════════════════════════════════════════════

  ┌──────────────────┬────────────────────────────────────────┐
  │  Webpack         │  Rollup                                │
  ├──────────────────┼────────────────────────────────────────┤
  │  ❌ Không export │  ✅ Export ES Module                    │
  │  ES Module       │                                        │
  ├──────────────────┼────────────────────────────────────────┤
  │  Code dư thừa,   │  Code gọn, đẹp, đọc được             │
  │  khó đọc         │                                        │
  ├──────────────────┼────────────────────────────────────────┤
  │  ✅ Code split,  │  ✅ Tree-shaking mạnh hơn              │
  │  HMR, static     │  ✅ Output gọn, nhanh                  │
  │  assets          │                                        │
  ├──────────────────┼────────────────────────────────────────┤
  │  Tốt cho APP     │  Tốt cho LIBRARY                       │
  │  (React, Vue...) │  (Vue, React lib...)                   │
  └──────────────────┴────────────────────────────────────────┘
```

---

## 18. Tổng Kết

```
TỔNG KẾT — COMMONJS & ES6 MODULES:
═══════════════════════════════════════════════════════════════

  ❶ COMMONJS
  ┌──────────────────────────────────────────────────────────┐
  │  Bản chất: GÁN THAM CHIẾU OBJECT                       │
  │  module.exports = exports (cùng ref)                     │
  │  Gán lại exports = {} → MẤT KẾT NỐI                    │
  │  Value type: copy giá trị → đổi gốc KHÔNG ảnh hưởng    │
  │  Reference type: copy địa chỉ → đổi thuộc tính CÓ ảnh  │
  │  Loading: runtime, đồng bộ, chỉ chạy 1 lần (cache)     │
  │  Circular ref: trả cache chưa hoàn chỉnh                │
  └──────────────────────────────────────────────────────────┘

  ❷ ES6 MODULES
  ┌──────────────────────────────────────────────────────────┐
  │  Bản chất: BINDING (ràng buộc tham chiếu)               │
  │  Kể cả value type cũng là live binding                  │
  │  (trừ export default value → copy)                       │
  │  Cú pháp tĩnh → compile-time analysis → Tree-shaking   │
  │  Strict mode, import read-only, this = undefined        │
  │  Circular ref: function hoisting giải quyết             │
  └──────────────────────────────────────────────────────────┘

  ❸ MÔI TRƯỜNG
  ┌──────────────────────────────────────────────────────────┐
  │  Browser:  ES Module (type="module") — NO CommonJS       │
  │  Node:     CommonJS mặc định, .mjs cho ES Module        │
  │  Webpack:  Cả hai — module.exports = named + default    │
  │  Rollup:   ES Module ưu tiên — cần plugin cho CommonJS  │
  └──────────────────────────────────────────────────────────┘

  ❹ TREE-SHAKING
  ┌──────────────────────────────────────────────────────────┐
  │  Chỉ hoạt động với ES Module (phân tích tĩnh)           │
  │  CommonJS → KHÔNG thể Tree-shake                        │
  │  pkg.module → ES Module version cho bundler              │
  │  Webpack → tốt cho app | Rollup → tốt cho library       │
  └──────────────────────────────────────────────────────────┘
```
