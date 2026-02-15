# Kế Hoạch Ôn Phỏng Vấn Frontend — Toàn Diện

> Tổng hợp kiến thức phỏng vấn Frontend: Resume, HTML+CSS, JavaScript Core, Web Storage, HTTP, React, Webpack, Performance Optimization, và các bài Handwriting phổ biến.
> Độ khó: ⭐️⭐️⭐️⭐️⭐️ | Thời gian đọc: ~50 phút

---

## Mục Lục

1. [Resume — Viết CV Hiệu Quả](#1-resume--viết-cv-hiệu-quả)
2. [HTML Interview](#2-html-interview)
3. [CSS Interview](#3-css-interview)
4. [JavaScript Cơ Bản](#4-javascript-cơ-bản)
5. [Prototype & Prototype Chain](#5-prototype--prototype-chain)
6. [Scope, Execution Context & Closure](#6-scope-execution-context--closure)
7. [Handwrite call/apply/bind/new](#7-handwrite-callapplybindnew)
8. [Async — Event Loop, Promise, async/await](#8-async--event-loop-promise-asyncawait)
9. [Web Storage](#9-web-storage)
10. [HTTP & Cache](#10-http--cache)
11. [React](#11-react)
12. [Webpack & Module](#12-webpack--module)
13. [Performance Optimization](#13-performance-optimization)
14. [Handwriting Phổ Biến](#14-handwriting-phổ-biến)

---

## 1. Resume — Viết CV Hiệu Quả

```
NGUYÊN TẮC CV:
═══════════════════════════════════════════════════════════

  ┌────────────────────────────────────────────────────────┐
  │                                                        │
  │  CV = BÀI VĂN THI ĐH → thời gian chấm RẤT NGẮN     │
  │                                                        │
  │  ① NỘI DUNG:                                          │
  │  → Thông tin cá nhân: Tên, SĐT, Email, GitHub        │
  │  → Professional Skills: 3-5 điểm CỐT LÕI             │
  │    (đừng viết "biết dùng VS Code" hay "biết Lodash")  │
  │  → Work Experience: công ty, vị trí, thời gian        │
  │  → Project Experience: 2-4 dự án NỔI BẬT              │
  │    (tên, mô tả, tech stack, vai trò CỤ THỂ)          │
  │  → Community: blog, open-source (phải CÓ NỘI DUNG)   │
  │                                                        │
  │  ② LƯU Ý:                                             │
  │  → Giao diện ĐƠN GIẢN, CLEAR                         │
  │  → Cẩn thận dùng từ "proficient" → dùng "familiar"   │
  │  → KHÔNG fake → sẽ bị blacklist                       │
  │  → Chuẩn bị: in CV, mang bút giấy, laptop            │
  │  → "Tại sao nghỉ việc?" → ĐỪNG nói xấu công ty cũ   │
  │  → Gặp câu không biết → thái độ TÍCH CỰC:            │
  │    "Xin lỗi, phần này tôi chưa nắm rõ, anh/chị      │
  │     có thể gợi ý để tôi tìm hiểu thêm không?"       │
  │                                                        │
  └────────────────────────────────────────────────────────┘
```

---

## 2. HTML Interview

```
HTML — CÁC CÂU HỎI CHÍNH:
═══════════════════════════════════════════════════════════

  ① SEMANTIC MARKUP — Tại sao quan trọng?
  ┌────────────────────────────────────────────────────────┐
  │  → Code DỄ ĐỌC hơn (readability)                     │
  │  → SEO: crawler hiểu context + weight của keywords    │
  │  → Không có CSS vẫn hiển thị CẤU TRÚC tốt            │
  └────────────────────────────────────────────────────────┘

  ② DEFER vs ASYNC trong <script>:
  ┌────────────────────────────────────────────────────────┐
  │                                                        │
  │  <script>:                                             │
  │  HTML ──▓▓▓ PAUSE ▓▓▓──────────────────────►          │
  │              ↓ download ↓ execute                      │
  │  → CHẶN HTML parsing hoàn toàn                        │
  │                                                        │
  │  <script async>:                                       │
  │  HTML ──────────────────▓▓ PAUSE ▓▓────────►          │
  │         ↓ download ↓        ↓ execute                  │
  │  → Download SONG SONG, execute NGAY → có thể chặn    │
  │                                                        │
  │  <script defer>:                                       │
  │  HTML ──────────────────────────────────────►          │
  │         ↓ download ↓                ↓ execute          │
  │  → Download SONG SONG, execute SAU khi parse xong    │
  │  → Giữ đúng THỨ TỰ các script                        │
  │                                                        │
  └────────────────────────────────────────────────────────┘

  ③ TỪ URL ĐẾN TRANG WEB — Flow đầy đủ:
  ┌────────────────────────────────────────────────────────┐
  │  1. Parse URL → protocol, host, port, path            │
  │  2. HTTP Cache (strong cache / conditional cache)     │
  │  3. DNS Resolution → IP address                       │
  │  4. TCP 3-way Handshake                               │
  │     → Tại sao 3 lần? Xác nhận sending + receiving    │
  │       capability của CẢ HAI bên                       │
  │  5. HTTP Request                                       │
  │  6. Server xử lý → trả HTTP Response                  │
  │  7. Browser Rendering:                                 │
  │     DOM → CSSOM → Render Tree → Layout → Paint        │
  │  8. TCP 4-way Handshake (disconnect)                   │
  └────────────────────────────────────────────────────────┘
```

---

## 3. CSS Interview

```
CSS — CÁC CHỦ ĐỀ QUAN TRỌNG:
═══════════════════════════════════════════════════════════

  ① BOX MODEL:
  ┌────────────────────────────────────────────────────────┐
  │  Box = content + padding + border + margin             │
  │                                                        │
  │  content-box (standard):                               │
  │    width = CHỈ content                                 │
  │                                                        │
  │  border-box (IE/alternative):                          │
  │    width = content + padding + border                  │
  │                                                        │
  │  → Dùng box-sizing: border-box cho dễ tính toán      │
  └────────────────────────────────────────────────────────┘

  ② CSS SELECTOR PRIORITY — A, B, C, D:
  ┌────────────────────────────────────────────────────────┐
  │  A = inline style (style="") → 1 hoặc 0               │
  │  B = số lần xuất hiện #id                              │
  │  C = số lần .class + [attr] + :pseudo-class           │
  │  D = số lần tag + ::pseudo-element                     │
  │                                                        │
  │  So sánh từ TRÁI → PHẢI, bằng nhau → lấy sau         │
  │  !important > inline > id > class > tag               │
  └────────────────────────────────────────────────────────┘

  ③ REFLOW vs REPAINT:
  ┌────────────────────────────────────────────────────────┐
  │  Reflow: tính lại GEOMETRY (vị trí, kích thước)       │
  │  Repaint: vẽ lại PIXELS (màu sắc, visibility)        │
  │                                                        │
  │  Giảm reflow:                                          │
  │  → Gộp thay đổi style (className thay vì từng prop)  │
  │  → Batch DOM: documentFragment, cache offsetWidth     │
  │  → position: absolute/fixed → tách khỏi flow         │
  │  → GPU acceleration: transform, will-change           │
  │    (transform KHÔNG gây reflow/repaint!)              │
  └────────────────────────────────────────────────────────┘

  ④ BFC (Block Formatting Context):
  ┌────────────────────────────────────────────────────────┐
  │  Đặc điểm:                                            │
  │  → Block elements xếp dọc theo document flow          │
  │  → 2 container liền kề trong BFC → margin OVERLAP    │
  │  → BFC tính cả HEIGHT của float elements              │
  │  → BFC KHÔNG overlap với float containers             │
  │  → BFC là ISOLATED container                           │
  │                                                        │
  │  Tạo BFC: position absolute/fixed, display            │
  │  inline-block, overflow ≠ visible                     │
  │                                                        │
  │  Ứng dụng: fix margin overlap, fix float collapse,    │
  │  two/three-column adaptive layout                      │
  └────────────────────────────────────────────────────────┘

  ⑤ TWO-COLUMN LAYOUT (fixed left + adaptive right):
  ┌────────────────────────────────────────────────────────┐
  │  Cách 1: float left + margin-left trên right          │
  │  Cách 2: float left + overflow:hidden trên right(BFC)│
  │  Cách 3: display:flex, right flex:1 ⭐                │
  │  Cách 4: position absolute left + margin-left right   │
  │  Cách 5: position absolute right, left/right/top: 0   │
  └────────────────────────────────────────────────────────┘

  ⑥ HOLY GRAIL & DOUBLE WING (three-column):
  ┌────────────────────────────────────────────────────────┐
  │  Mục đích: middle LOAD TRƯỚC (content quan trọng nhất)│
  │  Hai bên FIXED, giữa ADAPTIVE                         │
  │                                                        │
  │  Kỹ thuật chung:                                       │
  │  → float layout                                        │
  │  → margin NEGATIVE để hai bên overlap với giữa        │
  │  → Holy Grail: dùng PADDING trên container            │
  │  → Double Wing: dùng MARGIN trên inner div            │
  │                                                        │
  │  Key: margin-left: -100% = width của PARENT content   │
  └────────────────────────────────────────────────────────┘

  ⑦ CENTERING — Nhiều cách:
  ┌────────────────────────────────────────────────────────┐
  │  1. absolute + translate(-50%,-50%) → flexible size ⭐│
  │  2. absolute + top/left/right/bottom:0 + margin:auto  │
  │     → cần fixed width/height                          │
  │  3. absolute + left:50% + margin-left:-half           │
  │     → cần fixed width/height                          │
  │  4. flex + justify-content + align-items: center ⭐⭐ │
  └────────────────────────────────────────────────────────┘

  ⑧ FLEX: 1 nghĩa là gì?
  ┌────────────────────────────────────────────────────────┐
  │  flex-grow: 1   → CÓ lớn lên nếu dư space            │
  │  flex-shrink: 1 → CÓ nhỏ lại nếu thiếu space         │
  │  flex-basis: 0% → kích thước ban đầu = 0 (auto-scale)│
  └────────────────────────────────────────────────────────┘

  ⑨ LINE-HEIGHT inheritance:
  ┌────────────────────────────────────────────────────────┐
  │  Giá trị cụ thể (30px): con kế thừa 30px             │
  │  Tỉ lệ (1.5):           con kế thừa TỈ LỆ 1.5       │
  │  Phần trăm (200%):      con kế thừa GIÁ TRỊ TÍNH    │
  │                          = parent font-size × 200%    │
  └────────────────────────────────────────────────────────┘
```

---

## 4. JavaScript Cơ Bản

```
JAVASCRIPT — DATA TYPES & CORE:
═══════════════════════════════════════════════════════════

  ① 8 DATA TYPES:
  ┌────────────────────────────────────────────────────────┐
  │  Primitive (7): Undefined, Null, Boolean, Number,     │
  │                 String, Symbol (ES6), BigInt (ES2020)  │
  │  Reference (1): Object                                 │
  │                                                        │
  │  VALUE types → Stack (nhỏ, cố định, thường dùng)     │
  │  let a = 100; let b = a; a = 200;                     │
  │  console.log(b); // 100 → COPY giá trị               │
  │                                                        │
  │  REFERENCE types → Heap (lớn, thay đổi)              │
  │  let a = {age:20}; let b = a; b.age = 30;             │
  │  console.log(a.age); // 30 → SHARE reference!        │
  └────────────────────────────────────────────────────────┘

  ② TYPE DETECTION — 3 cách:
  ┌───────────────────┬──────────────────────────────────┐
  │ typeof            │ Value types OK, nhưng:           │
  │                   │ null/[]/{}  → đều là "object"   │
  ├───────────────────┼──────────────────────────────────┤
  │ instanceof        │ Object types OK (prototype chain)│
  │                   │ KHÔNG check được primitive       │
  ├───────────────────┼──────────────────────────────────┤
  │ Object.prototype  │ TẤT CẢ types, chính xác nhất ⭐│
  │ .toString.call()  │ "[object Number]", "[object Null]│
  └───────────────────┴──────────────────────────────────┘

  Kiểm tra Array:
  → Array.isArray(arr)
  → arr instanceof Array
  → Object.prototype.toString.call(arr) === "[object Array]"

  ③ DEEP CLONE — Handwrite:
  ┌────────────────────────────────────────────────────────┐
  │  function deepClone(obj, map = new WeakMap()) {       │
  │    if (typeof obj !== "object" || obj === null)        │
  │      return obj;                                       │
  │    if (map.get(obj)) return map.get(obj); // circular │
  │                                                        │
  │    const isArr = Array.isArray(obj);                   │
  │    let result = isArr ? [] : {};                       │
  │    map.set(obj, result);                               │
  │                                                        │
  │    const keys = isArr ? obj : Object.keys(obj);        │
  │    keys.forEach((val, key) => {                        │
  │      if (!isArr) key = val;                            │
  │      result[key] = deepClone(obj[key], map);           │
  │    });                                                 │
  │    return result;                                      │
  │  }                                                     │
  │                                                        │
  │  KEY: WeakMap xử lý CIRCULAR REFERENCE!               │
  └────────────────────────────────────────────────────────┘

  ④ 0.1 + 0.2 !== 0.3 — IEEE 754:
  ┌────────────────────────────────────────────────────────┐
  │  Nguyên nhân:                                          │
  │  → Binary: 0.1, 0.2 là SỐ VÔ HẠN TUẦN HOÀN          │
  │  → IEEE 754: chỉ giữ 53 bit → CẮT bỏ → mất precision│
  │  → Đối trả order: mantissa shift → mất thêm bit     │
  │                                                        │
  │  Giải pháp:                                            │
  │  1. Number.EPSILON:                                    │
  │     Math.abs(a - b) < Number.EPSILON → "bằng"        │
  │  2. Convert thành integer rồi tính                    │
  │  3. String addition (LeetCode 415)                    │
  └────────────────────────────────────────────────────────┘
```

---

## 5. Prototype & Prototype Chain

```
PROTOTYPE — BẢN ĐỒ TOÀN CẢNH:
═══════════════════════════════════════════════════════════

  function Foo() {}
  let f1 = new Foo();

  ┌────────────────────────────────────────────────────────┐
  │                                                        │
  │  f1.__proto__  ──────────►  Foo.prototype              │
  │                             │                          │
  │  Foo.prototype.constructor ◄┘                          │
  │  = Foo                                                 │
  │                                                        │
  │  Foo.prototype.__proto__ ──► Object.prototype          │
  │                              │                         │
  │  Object.prototype.__proto__ ──► null                   │
  │                                                        │
  │  Foo.__proto__ ──────────►  Function.prototype         │
  │  Function.prototype.__proto__ ──► Object.prototype     │
  │                                                        │
  └────────────────────────────────────────────────────────┘

  → Prototype: mỗi object khi tạo ra đều LIÊN KẾT với
    một object khác (prototype), "kế thừa" properties
  → Prototype Chain: chuỗi prototypes nối nhau tạo thành
    "đường tìm kiếm" property từ dưới lên trên
  → Tìm property: đi theo chain LÊN TRÊN cho đến null
```

---

## 6. Scope, Execution Context & Closure

```
SCOPE → EXECUTION CONTEXT → CLOSURE:
═══════════════════════════════════════════════════════════

  ① SCOPE (Phạm vi):
  ┌────────────────────────────────────────────────────────┐
  │  → Quyết định VISIBILITY của biến trong code block    │
  │  → 3 loại: Global, Function, Block (let/const)        │
  │  → JS dùng STATIC SCOPE: scope xác định khi DEFINE   │
  │  → Scope Chain: tìm biến từ scope hiện tại LÊN TRÊN │
  └────────────────────────────────────────────────────────┘

  ② EXECUTION CONTEXT (3 thuộc tính):
  ┌────────────────────────────────────────────────────────┐
  │  Khi chạy executable code → tạo Execution Context:   │
  │  → Variable Object (VO): lưu variables, functions    │
  │  → Scope Chain: VO hiện tại + VO cha + ... + global  │
  │  → this binding                                       │
  └────────────────────────────────────────────────────────┘

  ③ CLOSURE:
  ┌────────────────────────────────────────────────────────┐
  │  Closure = Function + Free variables accessible       │
  │  (Free variable: không phải param, không phải local)  │
  │                                                        │
  │  BẢN CHẤT: khi tạo execution context cho inner fn,   │
  │  Activation Object của parent fn được thêm vào        │
  │  inner fn's [[scope]] → scope chain → dù parent      │
  │  context bị destroy, AO vẫn trong memory!             │
  │                                                        │
  │  ⭐ KEY: Free variable lookup tại NƠI DEFINE,         │
  │  KHÔNG phải nơi EXECUTE!                               │
  │                                                        │
  │  // Function as argument:                              │
  │  const a = 100;                                        │
  │  function fn() { console.log(a); }                     │
  │  function print(fn) { const a = 200; fn(); }           │
  │  print(fn); // 100 ← lookup tại nơi define!          │
  │                                                        │
  │  // Function as return value:                          │
  │  function create() {                                   │
  │    const a = 100;                                      │
  │    return function() { console.log(a); };              │
  │  }                                                     │
  │  const fn = create();                                   │
  │  const a = 200;                                        │
  │  fn(); // 100 ← closure giữ a = 100                  │
  │                                                        │
  │  Ứng dụng: cache tool (ẩn data, chỉ expose API):     │
  │  function createCache() {                              │
  │    const data = {}; // HIDDEN by closure               │
  │    return {                                            │
  │      set: (k, v) => { data[k] = v; },                 │
  │      get: (k) => data[k],                              │
  │    };                                                   │
  │  }                                                     │
  └────────────────────────────────────────────────────────┘
```

---

## 7. Handwrite call/apply/bind/new

```
HANDWRITE — call / apply / bind / new:
═══════════════════════════════════════════════════════════

  ① CALL — Ý tưởng: gắn fn vào obj → gọi → xóa:
  ┌────────────────────────────────────────────────────────┐
  │  Function.prototype.myCall = function(context, ...args)│
  │  {                                                     │
  │    if (typeof this !== "function")                     │
  │      throw new Error("Type error");                    │
  │    context = context || window;                        │
  │    context.fn = this;        // gắn fn vào obj        │
  │    const result = context.fn(...args);  // gọi        │
  │    delete context.fn;        // xóa                    │
  │    return result;                                      │
  │  };                                                    │
  └────────────────────────────────────────────────────────┘

  ② APPLY — Giống call, khác cách truyền params:
  ┌────────────────────────────────────────────────────────┐
  │  Function.prototype.myApply = function(context, args) {│
  │    context = context || window;                        │
  │    const fnSymbol = Symbol();  // ← tránh ghi đè     │
  │    context[fnSymbol] = this;                           │
  │    const result = args                                 │
  │      ? context[fnSymbol](...args)                      │
  │      : context[fnSymbol]();                            │
  │    delete context[fnSymbol];                           │
  │    return result;                                      │
  │  };                                                    │
  └────────────────────────────────────────────────────────┘

  ③ BIND — Trả về FUNCTION MỚI:
  ┌────────────────────────────────────────────────────────┐
  │  Function.prototype.myBind = function(context, ...args)│
  │  {                                                     │
  │    const fn = this;                                    │
  │    return function Fn() {                              │
  │      return fn.apply(                                  │
  │        this instanceof Fn ? this : context,            │
  │        args.concat(...arguments)                       │
  │      );                                                │
  │    };                                                   │
  │  };                                                    │
  │  // this instanceof Fn: hỗ trợ new bound function    │
  └────────────────────────────────────────────────────────┘

  ④ NEW — 4 bước:
  ┌────────────────────────────────────────────────────────┐
  │  function _new(constructor, ...args) {                 │
  │    // ① Tạo object mới                                │
  │    // ② Set __proto__ = constructor.prototype          │
  │    const obj = Object.create(constructor.prototype);   │
  │    // ③ Chạy constructor với this = obj               │
  │    const res = constructor.apply(obj, args);           │
  │    // ④ Nếu constructor trả về object → dùng nó      │
  │    const isObj = typeof res === 'object' && res!==null;│
  │    return isObj || typeof res === 'function' ? res:obj;│
  │  }                                                     │
  └────────────────────────────────────────────────────────┘
```

---

## 8. Async — Event Loop, Promise, async/await

```
ASYNC — EVENT LOOP & PROMISE:
═══════════════════════════════════════════════════════════

  ① EVENT LOOP:
  ┌────────────────────────────────────────────────────────┐
  │                                                        │
  │  Call Stack  →  Web APIs  →  Callback Queue           │
  │       ↑                          │                     │
  │       └──────────────────────────┘                     │
  │                 Event Loop                             │
  │                                                        │
  │  Flow: Call Stack rỗng → thử DOM render →             │
  │        → Event Loop lấy task từ queue → push stack    │
  │                                                        │
  │  MACRO TASKS: setTimeout, setInterval, Ajax, DOM事件   │
  │  → Trigger SAU DOM rendering                           │
  │  → Được browser quản lý (Web APIs)                    │
  │                                                        │
  │  MICRO TASKS: Promise.then, async/await,MutationObserver│
  │  → Trigger TRƯỚC DOM rendering                         │
  │  → Được ES6 syntax quản lý                            │
  │                                                        │
  │  ⭐ Thứ tự: Sync → ALL Microtasks → DOM render →     │
  │             1 Macrotask → ALL Microtasks → ...        │
  │                                                        │
  └────────────────────────────────────────────────────────┘

  ② PROMISE.ALL — Handwrite:
  ┌────────────────────────────────────────────────────────┐
  │  Promise.all = function(promises) {                    │
  │    return new Promise((resolve, reject) => {           │
  │      if (!promises[Symbol.iterator])                   │
  │        reject("Type error");                           │
  │      if (promises.length === 0) resolve([]);           │
  │                                                        │
  │      const res = [];                                   │
  │      let count = 0;                                    │
  │      const len = promises.length;                      │
  │                                                        │
  │      for (let i = 0; i < len; i++) {                   │
  │        Promise.resolve(promises[i])                    │
  │          .then(data => {                               │
  │            res[i] = data;  // ← giữ đúng thứ tự!    │
  │            if (++count === len) resolve(res);           │
  │          })                                            │
  │          .catch(err => reject(err));                    │
  │      }                                                 │
  │    });                                                 │
  │  };                                                    │
  └────────────────────────────────────────────────────────┘

  ③ ASYNC/AWAIT:
  ┌────────────────────────────────────────────────────────┐
  │  → async function LUÔN trả về Promise                 │
  │  → await = Promise.then                               │
  │  → try/catch = Promise.catch                          │
  │  → "Ultimate weapon" xóa bỏ async callbacks          │
  └────────────────────────────────────────────────────────┘
```

---

## 9. Web Storage

```
WEB STORAGE — SO SÁNH:
═══════════════════════════════════════════════════════════

  ┌─────────────┬────────┬──────────────┬─────────────────┐
  │             │ Cookie │localStorage  │ sessionStorage  │
  ├─────────────┼────────┼──────────────┼─────────────────┤
  │ Dung lượng  │ 4KB    │ 5MB          │ 5MB             │
  ├─────────────┼────────┼──────────────┼─────────────────┤
  │ Gửi kèm    │ CÓ     │ KHÔNG        │ KHÔNG           │
  │ HTTP request│ (mỗi   │              │                 │
  │             │  request)│             │                 │
  ├─────────────┼────────┼──────────────┼─────────────────┤
  │ API         │ Thô sơ │ setItem/     │ setItem/        │
  │             │document│ getItem      │ getItem         │
  │             │.cookie │              │                 │
  ├─────────────┼────────┼──────────────┼─────────────────┤
  │ Thời gian   │ Expires│ VĨNH VIỄN    │ Đóng tab/       │
  │             │/maxAge │ (trừ khi xóa)│ browser → mất  │
  └─────────────┴────────┴──────────────┴─────────────────┘
```

---

## 10. HTTP & Cache

```
HTTP — STATUS CODES & CACHING:
═══════════════════════════════════════════════════════════

  ① STATUS CODE:
  ┌────────────────────────────────────────────────────────┐
  │  1xx: Server đã nhận request                           │
  │  2xx: Thành công (200 OK)                              │
  │  3xx: Redirect (301 permanent, 302 temporary, 304 cache│
  │  4xx: Client error (403 forbidden, 404 not found)     │
  │  5xx: Server error (500 internal, 504 gateway timeout)│
  └────────────────────────────────────────────────────────┘

  ② CACHING STRATEGY:
  ┌────────────────────────────────────────────────────────┐
  │                                                        │
  │  STRONG CACHE (không gửi request):                     │
  │  → Cache-Control: max-age=31536000                     │
  │  → no-cache: lưu nhưng PHẢI check server mỗi lần    │
  │  → no-store: KHÔNG BAO GIỜ lưu                       │
  │                                                        │
  │  CONDITIONAL CACHE (gửi request, có thể 304):         │
  │  → Last-Modified / If-Modified-Since                   │
  │    (chính xác đến GIÂY)                               │
  │  → ETag / If-None-Match ⭐ ĐƯỢ ƯU TIÊN              │
  │    (content hash, chính xác hơn)                      │
  │                                                        │
  │  3 kiểu refresh:                                       │
  │  → Normal: strong ✅ conditional ✅                    │
  │  → Manual (F5): strong ❌ conditional ✅               │
  │  → Force (Ctrl+F5): strong ❌ conditional ❌           │
  │                                                        │
  └────────────────────────────────────────────────────────┘

  ③ GET vs POST:
  ┌────────────────────────────────────────────────────────┐
  │  Cache: GET được cache, POST không                    │
  │  Encoding: GET chỉ URL encode + ASCII, POST tùy ý   │
  │  Params: GET trong URL (insecure), POST trong body   │
  │  Idempotent: GET có (cùng input=cùng output), POST ko│
  │  TCP: GET gửi 1 packet, POST gửi 2 (header → body) │
  └────────────────────────────────────────────────────────┘

  ④ HTTP/2 cải tiến:
  → Header compression
  → Multiplexing
  → Server push
```

---

## 11. React

```
REACT — CÁC CHỦ ĐỀ PHỎNG VẤN:
═══════════════════════════════════════════════════════════

  ① EVENT SYSTEM — Tại sao custom?
  ┌────────────────────────────────────────────────────────┐
  │  → Cross-platform: xóa browser differences            │
  │  → Event Pool: tránh GC, reuse event objects          │
  │  → Unified management + transaction mechanism         │
  │  → React 17: gắn vào ROOT thay vì document           │
  └────────────────────────────────────────────────────────┘

  ② setState — SYNC hay ASYNC?
  ┌────────────────────────────────────────────────────────┐
  │  Code bản thân chạy SYNC, "async" = batch update     │
  │  → Trong React scope (synthetic events, lifecycle):   │
  │    ASYNC (batch) — state merged trước update DOM      │
  │  → Ngoài React scope (native events, setTimeout):    │
  │    SYNC — DOM update NGAY sau setState                │
  └────────────────────────────────────────────────────────┘

  ③ HOOKS — Key points:
  ┌────────────────────────────────────────────────────────┐
  │  Tại sao KHÔNG dùng trong conditional?                 │
  │  → Hooks dùng linked list + global index              │
  │  → Conditional thay đổi thứ tự → state SAI!          │
  │                                                        │
  │  HOC vs Hook:                                          │
  │  → HOC: reuse logic + VIEW                            │
  │  → Hook: chỉ reuse LOGIC                              │
  │                                                        │
  │  useEffect vs useLayoutEffect:                         │
  │  → useEffect: SAU browser paint (async)               │
  │  → useLayoutEffect: TRƯỚC browser paint (sync)        │
  │  → useLayoutEffect ≈ componentDidMount                │
  │                                                        │
  │  React.memo vs useMemo vs useCallback:                 │
  │  → memo: HOC, shallow compare PROPS                   │
  │  → useMemo: cache VALUE (computed result)             │
  │  → useCallback: cache FUNCTION reference              │
  └────────────────────────────────────────────────────────┘

  ④ PERFORMANCE OPTIMIZATION:
  ┌────────────────────────────────────────────────────────┐
  │  → React.memo cache components                        │
  │  → useMemo cache expensive computation                │
  │  → Tránh anonymous functions trong render             │
  │  → React.lazy + Suspense lazy-load components        │
  │  → CSS ẩn/hiện thay vì mount/unmount                 │
  │  → React.Fragment tránh extra DOM                     │
  └────────────────────────────────────────────────────────┘

  ⑤ FIBER — Tại sao cần?
  ┌────────────────────────────────────────────────────────┐
  │  → React 15: recursive reconciliation → KHÔNG ngắt   │
  │    được → UI lag nếu tree lớn                        │
  │  → Fiber: chia nhỏ work thành units (time slicing)   │
  │  → Mỗi unit có thể PAUSE → nhường cho browser       │
  │  → Priority scheduling: urgent updates trước          │
  └────────────────────────────────────────────────────────┘
```

---

## 12. Webpack & Module

```
WEBPACK & MODULARIZATION:
═══════════════════════════════════════════════════════════

  ① WEBPACK — Nguyên lý:
  ┌────────────────────────────────────────────────────────┐
  │  → Entry: điểm bắt đầu build dependency graph        │
  │  → Loader: transform file (babel, css, image...)      │
  │  → Plugin: hook vào build lifecycle (optimize, emit)  │
  │  → Output: bundled files                               │
  │                                                        │
  │  HMR (Hot Module Replacement):                         │
  │  → WebSocket giữa dev server và browser               │
  │  → Server gửi hash khi module thay đổi               │
  │  → Client fetch updated module → replace in memory   │
  └────────────────────────────────────────────────────────┘

  ② MODULE SYSTEMS:
  ┌────────────────────────────────────────────────────────┐
  │  CommonJS: require/module.exports                     │
  │  → SYNC, runtime, COPY of value                       │
  │  → Chủ yếu dùng cho Node.js                          │
  │                                                        │
  │  ES Modules: import/export                             │
  │  → ASYNC, compile-time, REFERENCE (live binding)      │
  │  → Browser + Node.js, tree-shakeable                  │
  │                                                        │
  │  UMD: Universal Module Definition                      │
  │  → Wrapper: detect AMD/CommonJS/global → adapt       │
  └────────────────────────────────────────────────────────┘
```

---

## 13. Performance Optimization

```
PERFORMANCE OPTIMIZATION — 3 TẦNG:
═══════════════════════════════════════════════════════════

  ① CODE LEVEL:
  ┌────────────────────────────────────────────────────────┐
  │  → Debounce & Throttle (resize, scroll, input)        │
  │  → Giảm reflow/repaint                                │
  │  → Event delegation                                    │
  │  → CSS trên đầu, JS cuối file                        │
  │  → Giảm DOM manipulation                              │
  │  → Lazy loading (React.lazy + Suspense + splitChunks) │
  └────────────────────────────────────────────────────────┘

  ② BUILD LEVEL:
  ┌────────────────────────────────────────────────────────┐
  │  → Compress: terser (JS), css-minimizer (CSS)         │
  │  → Gzip: compression-webpack-plugin + server config   │
  │  → CDN cho third-party libs (externals trong webpack) │
  └────────────────────────────────────────────────────────┘

  ③ OTHER:
  ┌────────────────────────────────────────────────────────┐
  │  → HTTP/2 (multiplexing, header compression)          │
  │  → SSR (Server-side rendering)                        │
  │  → Image compression                                   │
  │  → HTTP caching (Cache-Control / Expires)             │
  └────────────────────────────────────────────────────────┘
```

---

## 14. Handwriting Phổ Biến

```
HANDWRITING — CÁC BÀI THƯỜNG GẶP:
═══════════════════════════════════════════════════════════

  ① DEBOUNCE:
  ┌────────────────────────────────────────────────────────┐
  │  function debounce(func, wait, immediate) {            │
  │    let timeout;                                        │
  │    return function() {                                 │
  │      const context = this, args = arguments;           │
  │      if (timeout) clearTimeout(timeout);               │
  │      if (immediate) {                                  │
  │        const callNow = !timeout;                       │
  │        timeout = setTimeout(() => timeout=null, wait); │
  │        if (callNow) func.apply(context, args);         │
  │      } else {                                          │
  │        timeout = setTimeout(                           │
  │          () => func.apply(context, args), wait         │
  │        );                                              │
  │      }                                                 │
  │    };                                                   │
  │  }                                                     │
  └────────────────────────────────────────────────────────┘

  ② THROTTLE:
  ┌────────────────────────────────────────────────────────┐
  │  // Timestamp version:                                 │
  │  function throttle(func, wait) {                       │
  │    let preTime = 0;                                    │
  │    return function() {                                 │
  │      const now = +new Date();                          │
  │      if (now - preTime > wait) {                       │
  │        func.apply(this, arguments);                    │
  │        preTime = now;                                  │
  │      }                                                 │
  │    };                                                   │
  │  }                                                     │
  │                                                        │
  │  // Timer version:                                     │
  │  function throttle(func, wait) {                       │
  │    let timeout;                                        │
  │    return function() {                                 │
  │      if (!timeout) {                                   │
  │        timeout = setTimeout(() => {                    │
  │          timeout = null;                               │
  │          func.apply(this, arguments);                  │
  │        }, wait);                                       │
  │      }                                                 │
  │    };                                                   │
  │  }                                                     │
  └────────────────────────────────────────────────────────┘

  ③ INSTANCEOF:
  ┌────────────────────────────────────────────────────────┐
  │  function myInstanceof(target, origin) {               │
  │    if (typeof target !== "object" || target === null)   │
  │      return false;                                     │
  │    let proto = Object.getPrototypeOf(target);          │
  │    while (proto) {                                     │
  │      if (proto === origin.prototype) return true;      │
  │      proto = Object.getPrototypeOf(proto);             │
  │    }                                                   │
  │    return false;                                       │
  │  }                                                     │
  └────────────────────────────────────────────────────────┘

  ④ ARRAY FLAT:
  ┌────────────────────────────────────────────────────────┐
  │  function flat(arr, depth = 1) {                       │
  │    if (depth > 0) {                                    │
  │      return arr.reduce((pre, cur) =>                   │
  │        pre.concat(                                     │
  │          Array.isArray(cur) ? flat(cur, depth-1) : cur │
  │        ), []);                                         │
  │    }                                                   │
  │    return arr.slice();                                  │
  │  }                                                     │
  └────────────────────────────────────────────────────────┘

  ⑤ SCHEDULER (Concurrency Limit):
  ┌────────────────────────────────────────────────────────┐
  │  class Scheduler {                                     │
  │    constructor(max) {                                  │
  │      this.max = max;                                   │
  │      this.queue = [];                                  │
  │      this.running = 0;                                 │
  │    }                                                   │
  │    add(promiseMaker) {                                 │
  │      const task = () => {                              │
  │        this.running++;                                 │
  │        return promiseMaker().finally(() => {           │
  │          this.running--;                               │
  │          this._next();                                 │
  │        });                                             │
  │      };                                                │
  │      this.running < this.max                           │
  │        ? task() : this.queue.push(task);               │
  │    }                                                   │
  │    _next() {                                           │
  │      if (this.queue.length > 0) this.queue.shift()();  │
  │    }                                                   │
  │  }                                                     │
  └────────────────────────────────────────────────────────┘

  ⑥ EventEmitter:
  ┌────────────────────────────────────────────────────────┐
  │  class EventEmitter {                                  │
  │    constructor() { this.events = {}; }                 │
  │    on(evt, cb) {                                       │
  │      (this.events[evt] ??= []).push(cb);               │
  │      return this;                                      │
  │    }                                                   │
  │    off(evt, cb) {                                      │
  │      if (!cb) { this.events[evt] = []; return; }       │
  │      this.events[evt] = this.events[evt]               │
  │        ?.filter(f => f !== cb);                        │
  │    }                                                   │
  │    emit(evt, ...args) {                                │
  │      this.events[evt]?.forEach(cb => cb(...args));     │
  │    }                                                   │
  │    once(evt, cb) {                                     │
  │      const wrap = (...args) => {                       │
  │        cb(...args); this.off(evt, wrap);               │
  │      };                                                │
  │      this.on(evt, wrap);                               │
  │    }                                                   │
  │  }                                                     │
  └────────────────────────────────────────────────────────┘

  ⑦ FLAT ARRAY → TREE (parentId):
  ┌────────────────────────────────────────────────────────┐
  │  function buildTree(items, parentId = null) {          │
  │    return items                                        │
  │      .filter(item => item.parent_id === parentId)      │
  │      .map(item => ({                                   │
  │        ...item,                                        │
  │        children: buildTree(items, item.id)             │
  │      }))                                               │
  │      .sort((a, b) => a.id - b.id);                    │
  │  }                                                     │
  └────────────────────────────────────────────────────────┘

  ⑧ QUICK SORT:
  ┌────────────────────────────────────────────────────────┐
  │  function quickSort(arr, start = 0, end = arr.length-1)│
  │  {                                                     │
  │    if (start >= end) return arr;                        │
  │    const pivot = arr[start];                           │
  │    let left = start, right = end;                      │
  │    while (left < right) {                              │
  │      while (arr[right] >= pivot && right > left)       │
  │        right--;                                        │
  │      arr[left] = arr[right];                           │
  │      while (arr[left] <= pivot && right > left)        │
  │        left++;                                         │
  │      arr[right] = arr[left];                           │
  │    }                                                   │
  │    arr[left] = pivot;                                  │
  │    quickSort(arr, start, left - 1);                    │
  │    quickSort(arr, left + 1, end);                      │
  │    return arr;                                         │
  │  }                                                     │
  └────────────────────────────────────────────────────────┘

  ⑨ UNIQUE (DEDUPLICATE):
  ┌────────────────────────────────────────────────────────┐
  │  // ES6:                                               │
  │  const unique = arr => [...new Set(arr)];              │
  │                                                        │
  │  // ES5:                                               │
  │  const unique = arr =>                                  │
  │    arr.filter((item, i, a) => a.indexOf(item) === i);  │
  └────────────────────────────────────────────────────────┘
```
