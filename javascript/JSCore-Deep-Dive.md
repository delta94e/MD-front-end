# JavaScript Core — 23 Câu Phỏng Vấn Kinh Điển — Deep Dive

> 📅 2026-02-12 · ⏱ 20 phút đọc
>
> Tổng hợp Q23–Q45: Data types & memory, type detection,
> null vs undefined, scope chain, this/call/apply/bind,
> prototype chain, closures, event models, modules (CJS/AMD/CMD/ESM),
> Event Loop, V8 GC, memory leaks, ES6, arrow functions,
> handwritten call/apply/bind/new/curry.
> Độ khó: ⭐️⭐️⭐️⭐️⭐️ | Chủ đề: JavaScript Core

---

## Mục Lục

0. [Data Types & Memory (Q23)](#q23)
1. [Type Detection — Object.prototype.toString (Q24)](#q24)
2. [null vs undefined (Q25)](#q25)
3. [valueOf & toString — {} và [] (Q26)](#q26)
4. [Scope & Scope Chain (Q27)](#q27)
5. [this, call, apply, bind (Q28)](#q28)
6. [Prototype & Prototype Chain (Q29)](#q29)
7. [Closures (Q30)](#q30)
8. [3 Event Models (Q31)](#q31)
9. [Array & String Methods (Q32)](#q32)
10. [JS Lazy Loading (Q33)](#q33)
11. [Module Specifications (Q34–Q36)](#q34)
12. [Event Loop (Q37)](#q37)
13. [V8 Garbage Collection (Q38)](#q38)
14. [Memory Leaks (Q39)](#q39)
15. [ES6 Features (Q40–Q41)](#q40)
16. [Higher-Order Functions (Q42)](#q42)
17. [Handwritten call, apply, bind (Q43)](#q43)
18. [Function Currying (Q44)](#q44)
19. [Handwritten new (Q45)](#q45)
20. [Tóm Tắt & Checklist](#tóm-tắt)

---

## Q23. Data Types & Memory

### 8 kiểu dữ liệu JavaScript

```
8 DATA TYPES:
═══════════════════════════════════════════════════════════════

  7 Primitives (基本数据类型):
  ┌──────────┬──────────┬────────────────────────────────────┐
  │ Type     │ Version  │ Ví dụ                              │
  ├──────────┼──────────┼────────────────────────────────────┤
  │ Undefined│ ES1      │ undefined                          │
  │ Null     │ ES1      │ null                               │
  │ Boolean  │ ES1      │ true, false                        │
  │ Number   │ ES1      │ 42, 3.14, NaN, Infinity            │
  │ String   │ ES1      │ 'hello', "world", `template`       │
  │ Symbol   │ ES6      │ Symbol('id') — 独一无二的值        │
  │ BigInt   │ ES10     │ 9007199254740991n                  │
  └──────────┴──────────┴────────────────────────────────────┘

  1 Reference (引用数据类型):
  ┌──────────┬────────────────────────────────────────────────┐
  │ Object   │ { }, [ ], function, Date, RegExp, Map, Set... │
  └──────────┴────────────────────────────────────────────────┘

  → JS không hỗ trợ tạo custom types
  → MỌI giá trị đều thuộc 1 trong 8 types trên
```

### Stack vs Heap — Lưu trữ giá trị

```
MEMORY MODEL:
═══════════════════════════════════════════════════════════════

  STACK (ngăn xếp):                HEAP (đống):
  ┌──────────────────┐             ┌─────────────────────┐
  │ a = 42           │             │                     │
  │ b = 'hello'      │             │  { name: 'Jun',     │
  │ c = true         │             │    age: 25,         │
  │                  │             │    hobbies: [...]  } │
  │ obj ──────────────────────────→│                     │
  │ arr ──────────────────────┐    │                     │
  │                  │        └───→│  [1, 2, 3]          │
  └──────────────────┘             └─────────────────────┘

  PRIMITIVES → Stack:
  → Kích thước NHỎ + CỐ ĐỊNH
  → Truy cập NHANH (LIFO)
  → Copy = copy VALUE (independent)

  REFERENCE → Stack (pointer) + Heap (data):
  → Kích thước LỚN + KHÔNG CỐ ĐỊNH
  → Stack chứa POINTER → Heap chứa DATA
  → Copy = copy POINTER (shared reference!)

  let a = { x: 1 };
  let b = a;          // b = copy pointer, KHÔNG copy object!
  b.x = 2;
  console.log(a.x);   // 2 ← a CŨNG BỊ THAY ĐỔI!
```

---

## Q24. Type Detection — Object.prototype.toString

```javascript
var a = Object.prototype.toString;

console.log(a.call(2)); // [object Number]
console.log(a.call(true)); // [object Boolean]
console.log(a.call("str")); // [object String]
console.log(a.call([])); // [object Array]
console.log(a.call(function () {})); // [object Function]
console.log(a.call({})); // [object Object]
console.log(a.call(undefined)); // [object Undefined]
console.log(a.call(null)); // [object Null]
```

```
4 PHƯƠNG PHÁP TYPE DETECTION:
═══════════════════════════════════════════════════════════════

  ┌─────────────────────────┬──────────────────────────────┐
  │ Method                  │ Đặc điểm                    │
  ├─────────────────────────┼──────────────────────────────┤
  │ typeof                  │ Nhanh, nhưng null→'object'  │
  │                         │ Array→'object', chỉ phân    │
  │                         │ biệt được primitives        │
  ├─────────────────────────┼──────────────────────────────┤
  │ instanceof              │ Check prototype chain        │
  │                         │ [] instanceof Array → true   │
  │                         │ Không dùng được cross-iframe │
  ├─────────────────────────┼──────────────────────────────┤
  │ constructor             │ obj.constructor === Array    │
  │                         │ Có thể bị override          │
  ├─────────────────────────┼──────────────────────────────┤
  │ Object.prototype        │ CHÍNH XÁC NHẤT ⭐           │
  │   .toString.call()      │ Phân biệt mọi type          │
  │                         │ Return [object Type]         │
  └─────────────────────────┴──────────────────────────────┘

  TẠI SAO toString.call() CHÍNH XÁC NHẤT?
  → Đọc internal [[Class]] property
  → Không bị ảnh hưởng bởi prototype thay đổi
  → Phân biệt: Array vs Object, null vs undefined
```

---

## Q25. null vs undefined

```
null vs undefined:
═══════════════════════════════════════════════════════════════

  ┌────────────┬─────────────────────┬──────────────────────┐
  │            │ undefined           │ null                 │
  ├────────────┼─────────────────────┼──────────────────────┤
  │ Ý nghĩa   │ CHƯA được định nghĩa│ Giá trị RỖNG (empty)│
  │ Khi nào    │ Biến khai báo chưa  │ Gán cho biến sẽ     │
  │            │ gán giá trị         │ chứa object          │
  │ typeof     │ 'undefined'         │ 'object' ← BUG!     │
  │ ==         │ null == undefined   │ → true               │
  │ ===        │ null === undefined  │ → false              │
  │ Toán học   │ Number(undefined)   │ Number(null) → 0    │
  │            │ → NaN               │                      │
  └────────────┴─────────────────────┴──────────────────────┘

  typeof null === 'object' — TẠI SAO?
  → JS ban đầu dùng 32-bit cho mọi giá trị
  → 3 bit đầu = type tag: 000 = object
  → null = all zeros (0x00)
  → 000... → bị nhầm thành object!
  → Bug từ JS v1.0, KHÔNG THỂ sửa (break backward compat)

  undefined KHÔNG phải reserved word!
  → var undefined = 123; // ⚠️ HỢP LỆ (non-strict mode)!
  → NGUY HIỂM! Dùng void 0 để lấy safe undefined
```

---

## Q26. valueOf & toString — {} và []

```javascript
// Object
({}).valueOf(); // {} (chính nó)
({}).toString(); // "[object Object]"

// Array
[].valueOf(); // [] (chính nó)
[].toString(); // "" (chuỗi rỗng)
[1, 2, 3].toString(); // "1,2,3" (join bằng comma)
```

```
TYPE COERCION ORDER:
═══════════════════════════════════════════════════════════════

  Khi JS cần convert object → primitive:
  ① Gọi valueOf() → nếu return primitive → DÙNG
  ② Nếu valueOf() return object → gọi toString()
  ③ Nếu toString() cũng return object → TypeError!

  Ví dụ: [] + []
  → [].valueOf() → [] (object, không phải primitive)
  → [].toString() → "" (primitive!)
  → "" + "" → ""

  Ví dụ: [] + {}
  → "" + "[object Object]" → "[object Object]"

  Ví dụ: {} + []
  → {} bị parse thành empty block
  → +[] → +"" → 0
```

---

## Q27. Scope & Scope Chain

```
SCOPE — QUY TẮC:
═══════════════════════════════════════════════════════════════

  SCOPE = vùng mà biến được ĐỊNH NGHĨA
  → Quy tắc truy cập biến do browser engine quản lý

  3 LOẠI SCOPE:
  ① Global Scope — biến toàn cục
  ② Function Scope — biến trong function
  ③ Block Scope (ES6) — biến trong { } (let, const)

  SCOPE CHAIN:
  → Chuỗi liên kết các scope từ TRONG → NGOÀI
  → Xác định khi DEFINE (lexical scoping), KHÔNG phải khi CALL
  → Bản chất: pointer list → Variable Objects (VO)

  ┌─────────────────────────────────────────────────────┐
  │ Global Scope { var a = 1 }                         │
  │   ┌─────────────────────────────────────────────┐   │
  │   │ function outer() { var b = 2 }             │   │
  │   │   ┌─────────────────────────────────────┐   │   │
  │   │   │ function inner() { var c = 3 }     │   │   │
  │   │   │ → Scope chain: inner → outer → global│   │   │
  │   │   │ → inner có thể truy cập a, b, c    │   │   │
  │   │   └─────────────────────────────────────┘   │   │
  │   │ → outer có thể truy cập a, b (KHÔNG c)    │   │
  │   └─────────────────────────────────────────────┘   │
  │ → global chỉ truy cập a (KHÔNG b, c)              │
  └─────────────────────────────────────────────────────┘

  Tìm biến: current VO → parent VO → ... → Global VO
  Không tìm thấy → ReferenceError!
```

---

## Q28. this, call, apply, bind

### 5 quy tắc xác định this

```
this — 5 QUY TẮC:
═══════════════════════════════════════════════════════════════

  ① DEFAULT: standalone function → window (strict: undefined)
     function fn() { console.log(this) }
     fn(); // window

  ② IMPLICIT: method call → object gọi
     obj.fn(); // this = obj
     (obj được . gọi cuối cùng)

  ③ EXPLICIT: call/apply/bind → object truyền vào
     fn.call(obj);  // this = obj
     fn.apply(obj); // this = obj
     fn.bind(obj);  // return new fn với this = obj

  ④ NEW: constructor → new object
     new Fn(); // this = new empty object

  ⑤ ARROW: không có this riêng → this = outer scope (lexical)
     const fn = () => this; // this = parent scope
     → KHÔNG thể dùng call/apply/bind để thay đổi
     → KHÔNG thể dùng new

  ƯU TIÊN: new > explicit > implicit > default
```

### call vs apply vs bind

```
call vs apply vs bind:
═══════════════════════════════════════════════════════════════

  ┌──────┬────────────────────┬────────────┬────────────────┐
  │      │ Cú pháp           │ Thực thi   │ Tham số        │
  ├──────┼────────────────────┼────────────┼────────────────┤
  │ call │ fn.call(obj, a, b)│ NGAY       │ danh sách, ... │
  │ apply│ fn.apply(obj,[a,b])│ NGAY      │ array [...]    │
  │ bind │ fn.bind(obj, a)   │ KHÔNG      │ danh sách, ... │
  │      │ → return new fn   │ (trả về fn)│ (partial OK)   │
  └──────┴────────────────────┴────────────┴────────────────┘

  call = gọi NGAY + args riêng lẻ
  apply = gọi NGAY + args trong array
  bind = KHÔNG gọi, return function MỚI với this cố định
```

---

## Q29. Prototype & Prototype Chain

```
PROTOTYPE CHAIN:
═══════════════════════════════════════════════════════════════

  Constructor.prototype = prototype object (shared methods)
  instance.__proto__     = Constructor.prototype
  instance.__proto__.__proto__ = Object.prototype
  Object.prototype.__proto__  = null (END!)

  function Person(name) { this.name = name; }
  Person.prototype.greet = function() { return 'Hi ' + this.name; }

  const p = new Person('Jun');

  p.__proto__ === Person.prototype           // true
  Person.prototype.__proto__ === Object.prototype // true
  Object.prototype.__proto__ === null        // true

  p.greet();     // ① tìm trong p → KHÔNG CÓ
                 // ② tìm trong Person.prototype → CÓ!
  p.toString();  // ① p → ② Person.prototype → ③ Object.prototype → CÓ!

  ĐẶC ĐIỂM QUAN TRỌNG:
  → Objects truyền bằng REFERENCE
  → Sửa prototype → TẤT CẢ instances đều thấy thay đổi
  → KHÔNG có bản sao riêng của prototype
  → Dùng Object.getPrototypeOf(obj) thay vì __proto__
```

---

## Q30. Closures

```javascript
function outer() {
  let count = 0; // Biến private — KHÔNG thể truy cập từ ngoài
  return function inner() {
    count++;
    return count;
  };
}
const counter = outer();
counter(); // 1
counter(); // 2 ← count KHÔNG bị GC dù outer đã return!
```

```
CLOSURE:
═══════════════════════════════════════════════════════════════

  ĐỊNH NGHĨA:
  → Function + Lexical Environment nơi nó được DEFINE
  → Inner function giữ reference tới biến của outer function
  → Biến đó KHÔNG bị garbage collected dù outer đã return

  USE CASES:
  → Data privacy (biến private, module pattern)
  → Factory functions
  → Debounce / Throttle
  → Event handlers giữ state
  → setTimeout callbacks

  ƯU ĐIỂM:
  → Biến PRIVATE — isolate scope — data không bị ô nhiễm

  NHƯỢC ĐIỂM:
  → Memory leak! GC không thể dọn biến trong closure
  → Giải pháp: set reference = null khi không cần nữa
```

---

## Q31. 3 Event Models

```
3 EVENT MODELS:
═══════════════════════════════════════════════════════════════

  ① DOM0 Level (Inline):
  → el.onclick = fn
  → KHÔNG có event propagation
  → Compatible tất cả browsers

  ② IE Event Model (2 phases):
  → Phase 1: Event HANDLING (target)
  → Phase 2: Event BUBBLING (target → document)
  → API: attachEvent('onclick', fn)

  ③ DOM2 Level (3 phases) ⭐ MODERN:
  → Phase 1: CAPTURING (document → target)
  → Phase 2: Event HANDLING (target)
  → Phase 3: BUBBLING (target → document)
  → API: addEventListener('click', fn, useCapture)

  ┌────────────────────────────────────────────────────┐
  │ document                                          │
  │   ↓ capturing (phase 1)    ↑ bubbling (phase 3)  │
  │   ↓                        ↑                      │
  │   ↓    ┌──────────┐        ↑                      │
  │   ↓    │  target   │ ← phase 2 (handling)         │
  │   ↓    └──────────┘        ↑                      │
  └────────────────────────────────────────────────────┘

  addEventListener(event, fn, true)  → Capture phase
  addEventListener(event, fn, false) → Bubble phase (default)
```

---

## Q32. Array & String Methods

```
ARRAY METHODS — THƯỜNG GẶP:
═══════════════════════════════════════════════════════════════

  Mutating (thay đổi mảng gốc):
  push/pop, shift/unshift, splice, sort, reverse, fill

  Non-mutating (trả về mảng mới):
  map, filter, reduce, find, findIndex, some, every,
  slice, concat, flat, flatMap, includes, indexOf,
  forEach (không return), join, entries, keys, values

  ES6+: Array.from, Array.of, [...spread]


STRING METHODS — THƯỜNG GẶP:
═══════════════════════════════════════════════════════════════

  charAt, charCodeAt, indexOf, lastIndexOf, includes,
  startsWith, endsWith, slice, substring, trim, trimStart,
  trimEnd, toUpperCase, toLowerCase, split, replace,
  replaceAll, repeat, padStart, padEnd, match, search,
  localeCompare, normalize, at (ES2022)
```

---

## Q33. JS Lazy Loading — 4 cách

```
JS LAZY LOADING:
═══════════════════════════════════════════════════════════════

  Vấn đề: JS load/parse/execute → BLOCK rendering!

  ┌────────────┬──────────┬──────────┬─────────────────────┐
  │ Method     │ Load     │ Execute  │ Order               │
  ├────────────┼──────────┼──────────┼─────────────────────┤
  │ Bottom     │ Cuối HTML│ Ngay     │ Theo thứ tự         │
  │ defer      │ Song song│ Sau DOM  │ Theo thứ tự ⭐      │
  │ async      │ Song song│ Ngay khi │ KHÔNG đảm bảo       │
  │            │          │ load xong│ thứ tự!             │
  │ Dynamic    │ Manual   │ Manual   │ Tùy code            │
  └────────────┴──────────┴──────────┴─────────────────────┘

  <script src="app.js"></script>           ← Block!
  <script defer src="app.js"></script>     ← Song song + sau DOM
  <script async src="app.js"></script>     ← Song song + ngay khi xong

  ④ Dynamic:
  document.addEventListener('DOMContentLoaded', () => {
      const script = document.createElement('script');
      script.src = 'app.js';
      document.body.appendChild(script);
  });

  KHUYẾN NGHỊ: defer cho app code, async cho analytics/ads
```

---

## Q34–Q36. Module Specifications

```
4 MODULE SYSTEMS:
═══════════════════════════════════════════════════════════════

  ┌──────────┬──────────┬──────────┬──────────┬────────────┐
  │          │ CommonJS │ AMD      │ CMD      │ ES Modules │
  ├──────────┼──────────┼──────────┼──────────┼────────────┤
  │ Syntax   │ require()│ define() │ define() │ import     │
  │ Export   │ module   │ return   │ exports  │ export     │
  │          │ .exports │          │          │            │
  │ Load     │ Sync     │ Async    │ Async    │ Static ⭐  │
  │ Execute  │ Runtime  │ Ngay khi │ Khi      │ Compile    │
  │          │          │ load xong│ require  │ time       │
  │ Value    │ COPY     │ -        │ -        │ REFERENCE ⭐│
  │ Env      │ Node.js  │ Browser  │ Browser  │ Universal  │
  │ Library  │ Built-in │ RequireJS│ Sea.js   │ Built-in   │
  └──────────┴──────────┴──────────┴──────────┴────────────┘
```

### AMD vs CMD

```javascript
// AMD — Dependency UPFRONT (phải khai báo trước)
define(["./a", "./b"], function (a, b) {
  a.doSomething();
  // ... 100 lines later ...
  b.doSomething(); // b ĐÃ load NGAY từ đầu
});

// CMD — Dependency NEARBY (dùng đến đâu khai báo đến đó)
define(function (require, exports, module) {
  var a = require("./a");
  a.doSomething();
  // ... 100 lines later ...
  var b = require("./b"); // b CHỈ load khi cần
  b.doSomething();
});
```

### CommonJS vs ES Modules — 3 khác biệt CORE

```
CJS vs ESM — KHÁC BIỆT:
═══════════════════════════════════════════════════════════════

  ① VALUE COPY vs REFERENCE:
  → CJS: require() → COPY giá trị
    → Module thay đổi → giá trị import KHÔNG đổi
  → ESM: import → REFERENCE (like Unix symlink)
    → Module thay đổi → giá trị import CŨNG đổi!

  ② RUNTIME vs COMPILE TIME:
  → CJS: require() chạy ở RUNTIME → load TOÀN BỘ module object
    → Có thể dùng trong if/else, dynamic paths
  → ESM: import ở COMPILE TIME → static analysis possible
    → Tree-shaking, dead code elimination ⭐
    → KHÔNG thể dùng trong if/else (dùng dynamic import())

  ③ OBJECT vs BINDINGS:
  → CJS: module.exports = đối tượng module (chỉ sinh khi run)
  → ESM: export = named bindings (static interface)
```

---

## Q37. Event Loop

```
EVENT LOOP — EXECUTION ORDER:
═══════════════════════════════════════════════════════════════

  ① Execute SYNC code (Call Stack)
  ② Drain MICROTASK queue (tất cả!)
     → Promise.then, queueMicrotask, MutationObserver
  ③ Render (nếu cần: rAF, layout, paint)
  ④ Execute 1 MACROTASK
     → setTimeout, setInterval, I/O, UI events
  ⑤ Quay lại ② (drain microtasks SAU MỖI macrotask)

  SYNC → ALL Microtasks → Render → 1 Macrotask → ALL Microtasks → ...

  ⚠️ QUAN TRỌNG:
  → Microtasks chạy HẾT trước khi render hoặc macrotask tiếp
  → Microtask sinh ra microtask → chạy NGAY (có thể block render!)
  → Macrotask chỉ chạy 1 cái mỗi vòng loop
```

---

## Q38. V8 Garbage Collection

```
V8 GC — GENERATIONAL:
═══════════════════════════════════════════════════════════════

  Hypothesis: "Objects die young, survivors live long"

  ┌─────────────────────────────────────────────────────────┐
  │ NEW GENERATION (新生代) — Scavenge Algorithm           │
  │                                                        │
  │  ┌──────────────┐     ┌──────────────┐                 │
  │  │   FROM space  │ ──→ │   TO space    │                │
  │  │ (active)      │     │ (idle)        │                │
  │  └──────────────┘     └──────────────┘                 │
  │                                                        │
  │  Khi FROM đầy:                                         │
  │  1. Check sống? → CÓ → đã qua 1 lần Scavenge?        │
  │     → CÓ → promote lên OLD GENERATION                 │
  │     → CHƯA → copy sang TO space                        │
  │  2. Check sống? → KHÔNG → giải phóng memory           │
  │  3. Swap FROM ↔ TO                                     │
  │                                                        │
  │  Promote khi:                                          │
  │  ① Đã survive 1 lần Scavenge                           │
  │  ② TO space usage > 25% (tránh TO quá đầy sau swap)   │
  ├─────────────────────────────────────────────────────────┤
  │ OLD GENERATION (老生代) — Mark-Sweep + Mark-Compact    │
  │                                                        │
  │  Mark-Sweep (标记清除):                                │
  │  1. Mark tất cả reachable objects                      │
  │  2. Sweep (xóa) unmarked objects                       │
  │  → Vấn đề: memory FRAGMENTATION (lỗ hổng rải rác)    │
  │                                                        │
  │  Mark-Compact (标记整理):                              │
  │  → Di chuyển surviving objects → liên tiếp nhau        │
  │  → Giải quyết fragmentation                           │
  │                                                        │
  │  Incremental Marking (增量标记):                       │
  │  → GC pause DÀI → block main thread                   │
  │  → Giải pháp: chia nhỏ marking → xen kẽ với app logic │
  │  → mark 1 chút → app chạy → mark tiếp → app chạy...  │
  └─────────────────────────────────────────────────────────┘
```

---

## Q39. Memory Leaks — 4 nguyên nhân

```
4 MEMORY LEAKS:
═══════════════════════════════════════════════════════════════

  ① Accidental globals (biến global vô ý):
     function fn() { leak = 'oops'; } // Quên var/let/const!
     → leak trở thành window.leak → KHÔNG bao giờ bị GC

  ② Forgotten timers (timer bị quên):
     setInterval(() => { /* ref to huge data */ }, 1000);
     → Quên clearInterval → callback + data tồn tại MÃI MÃI

  ③ Detached DOM references:
     const el = document.getElementById('btn');
     document.body.removeChild(el);
     // el vẫn tồn tại trong JS! → DOM node KHÔNG bị GC
     → Fix: el = null;

  ④ Closures:
     function outer() {
         const huge = new Array(1000000);
         return function() { console.log(huge.length); };
     }
     // huge KHÔNG bị GC vì inner function reference nó
     → Fix: set huge = null khi không cần
```

---

## Q40–Q41. ES6 Features & Arrow Functions

```
ES6 — TOP 12 FEATURES:
═══════════════════════════════════════════════════════════════

  ① let / const (block scope)
  ② Arrow functions (() => {})
  ③ Template literals (`hello ${name}`)
  ④ Destructuring ({ a, b } = obj)
  ⑤ Spread / Rest (...args)
  ⑥ Classes (class Foo extends Bar)
  ⑦ Promises
  ⑧ Modules (import / export)
  ⑨ Symbol
  ⑩ Proxy / Reflect
  ⑪ Default parameters (fn(a = 1))
  ⑫ Set / Map / WeakSet / WeakMap
```

### Arrow Functions — 4 đặc điểm

```javascript
// ES5
var getDate = function () {
  return new Date();
};
// ES6
const getDate = () => new Date();
```

```
ARROW FUNCTION — 4 ĐẶC ĐIỂM:
═══════════════════════════════════════════════════════════════

  ① KHÔNG có this riêng → this = outer scope (lexical)
  ② KHÔNG có arguments → dùng ...rest
  ③ KHÔNG có super
  ④ KHÔNG thể dùng new (不能作为构造函数)

  → this STATIC (xác định khi DEFINE)
  → Regular function: this DYNAMIC (xác định khi CALL)

  const obj = {
      fn1: () => console.log(this),     // window (outer)
      fn2: function() { console.log(this) } // obj (caller)
  };
  obj.fn1(); // window
  obj.fn2(); // obj
```

---

## Q42. Higher-Order Functions

```javascript
// Higher-order = nhận function làm tham số HOẶC return function
function higherOrder(param, callback) {
  return callback(param);
}

// Ví dụ built-in:
[1, 2, 3].map((x) => x * 2); // map nhận function → HOF
[1, 2, 3].filter((x) => x > 1); // filter nhận function → HOF
[1, 2, 3].reduce((a, b) => a + b); // reduce nhận function → HOF

// Return function:
function multiplier(factor) {
  return (num) => num * factor; // Return function → HOF
}
const double = multiplier(2);
double(5); // 10
```

---

## Q43. Handwritten call, apply, bind

### Handwritten call

```javascript
Function.prototype.mu_call = function (context, ...args) {
  // Nếu context null/undefined → window
  if (!context || context === null) {
    context = window;
  }
  // Tạo unique key (tránh đè property có sẵn)
  let fn = Symbol();

  // this = function đang gọi .mu_call
  // Gắn function vào context như 1 method
  context[fn] = this;

  // Gọi method trên context → this tự động = context!
  const result = context[fn](...args);

  // Dọn dẹp (không để lại property trên context)
  delete context[fn];
  return result;
};
```

```
TRICK — TẠI SAO HOẠT ĐỘNG?
═══════════════════════════════════════════════════════════════

  fn.call(obj, a, b)  →  "Gọi fn với this = obj"

  Bản chất:
  ① Gắn fn vào obj:   obj[Symbol()] = fn
  ② Gọi fn qua obj:   obj[Symbol()](...args)
  ③ Implicit binding:  this = obj (vì obj.method())
  ④ Xóa fn khỏi obj:  delete obj[Symbol()]

  → Symbol() đảm bảo KHÔNG đè property có sẵn
```

### Handwritten apply

```javascript
Function.prototype.mu_apply = function (context, args) {
  // Chỉ khác call ở CHỖ NHẬN THAM SỐ: array thay vì ...spread
  if (!context || context === null) {
    context = window;
  }
  let fn = Symbol();
  context[fn] = this;
  const result = context[fn](...args); // Spread array ra
  delete context[fn];
  return result;
};

// call vs apply: CHỈ KHÁC cách truyền args
// call:  fn.mu_call(obj, 'a', 'b')    ← args riêng lẻ
// apply: fn.mu_apply(obj, ['a', 'b']) ← args trong array
```

### Handwritten bind

```javascript
Function.prototype.mu_bind = function (context, ...args) {
  if (!context || context === null) {
    context = window;
  }
  let fn = Symbol();
  context[fn] = this;
  let _this = this;

  const result = function (...innerArgs) {
    // CASE 1: dùng làm constructor (new)
    if (this instanceof _this) {
      // new → this = instance mới → KHÔNG bind context
      this[fn] = _this;
      this[fn](...[...args, ...innerArgs]);
      delete this[fn];
    } else {
      // CASE 2: gọi bình thường → bind context
      context[fn](...[...args, ...innerArgs]);
      delete context[fn];
    }
  };

  // Kế thừa prototype (cho trường hợp new)
  result.prototype = Object.create(this.prototype);
  return result;
};
```

```
BIND — PHỨC TẠP HƠN call/apply:
═══════════════════════════════════════════════════════════════

  bind KHÔNG gọi ngay → return function MỚI
  → Phải handle 2 trường hợp:

  CASE 1: Gọi bình thường
  → const bound = fn.bind(obj, arg1);
  → bound(arg2);  ← this = obj, args = [arg1, arg2]

  CASE 2: Dùng làm constructor (new bound())
  → const instance = new bound(arg2);
  → this = instance MỚI (KHÔNG phải obj!)
  → Phải kế thừa prototype gốc

  this instanceof _this:
  → Nếu true → đang trong new → KHÔNG bind context
  → Nếu false → gọi bình thường → bind context
```

---

## Q44. Function Currying

```javascript
// Currying: fn(a, b, c) → fn(a)(b)(c)
// Chuyển function nhiều tham số → chuỗi functions 1 tham số

// ES5 version
function curry(fn, args) {
  let length = fn.length; // Số params fn cần
  args = args || [];

  return function () {
    let subArgs = args.slice(0);
    for (let i = 0; i < arguments.length; i++) {
      subArgs.push(arguments[i]);
    }
    // Đủ params → execute, chưa đủ → return curry tiếp
    if (subArgs.length >= length) {
      return fn.apply(this, subArgs);
    } else {
      return curry.call(this, fn, subArgs);
    }
  };
}

// ES6 version — ELEGANT
function curry(fn, ...args) {
  return fn.length <= args.length
    ? fn(...args) // Đủ params → execute!
    : curry.bind(null, fn, ...args); // Chưa đủ → đợi thêm
}

// Sử dụng
function add(a, b, c) {
  return a + b + c;
}
const curriedAdd = curry(add);
curriedAdd(1)(2)(3); // 6
curriedAdd(1, 2)(3); // 6
curriedAdd(1)(2, 3); // 6
```

```
CURRYING — KEY INSIGHT:
═══════════════════════════════════════════════════════════════

  fn.length = số tham số function cần
  → So sánh args đã nhận vs fn.length
  → Đủ → execute fn(...args)
  → Chưa đủ → return function mới, đợi thêm args

  ES6 trick: curry.bind(null, fn, ...args)
  → bind partial args → tự đông chờ args tiếp
  → 1 dòng code thay cho cả đống recursion!
```

---

## Q45. Handwritten new

### new làm gì? (4 bước)

```javascript
function mu_new(fn, ...args) {
  // ① Tạo empty object
  const obj = {};

  // ② Set prototype = constructor.prototype
  Object.setPrototypeOf(obj, fn.prototype);

  // ③ Execute constructor với this = obj mới
  const result = fn.apply(obj, args);

  // ④ Nếu constructor return object → dùng nó
  //    Nếu không → return obj mới
  return result instanceof Object ? result : obj;
}

// Test
function Dog(name) {
  this.name = name;
  this.say = function () {
    console.log("my name is " + this.name);
  };
}

const dog = mu_new(Dog, "傻🐶");
dog.say(); // my name is 傻🐶
dog instanceof Dog; // true ✅
```

```
new — 4 BƯỚC:
═══════════════════════════════════════════════════════════════

  ① {} = Object.create(null) → tạo empty object
  ② obj.__proto__ = Fn.prototype → link prototype chain
  ③ Fn.apply(obj, args) → chạy constructor, this = obj
  ④ return result instanceof Object ? result : obj

  BƯỚC ④ — TẠI SAO?
  → Nếu constructor KHÔNG return gì → return obj mới
  → Nếu constructor return PRIMITIVE → BỎ QUA, return obj mới
  → Nếu constructor return OBJECT → DÙNG object đó thay obj!

  function Weird() {
      this.name = 'Jun';
      return { override: true }; // Return object!
  }
  const w = new Weird();
  w.name;     // undefined (obj mới bị bỏ!)
  w.override; // true (dùng return value!)
```

---

## Tóm Tắt

### Quick Reference toàn bộ

```
Q23-Q45 — QUICK REFERENCE:
═══════════════════════════════════════════════════════════════

  DATA:
  → 7 primitives (Stack) + 1 ref type Object (Stack ptr + Heap)
  → Detection: Object.prototype.toString.call() = chính xác nhất
  → typeof null = 'object' (bug JS v1.0, dùng void 0 cho safe undefined)

  SCOPE:
  → Scope chain = pointer list tới Variable Objects
  → Xác định khi DEFINE (lexical), KHÔNG phải khi CALL
  → Closure = function + lexical env → biến private, memory leak

  THIS:
  → 5 rules: default < implicit < explicit < new, arrow = static
  → call(obj,...args), apply(obj,[args]), bind(obj) → return fn

  PROTOTYPE:
  → instance.__proto__ → Constructor.prototype → Object.prototype → null
  → Shared by reference → sửa prototype ảnh hưởng TẤT CẢ instances

  MODULES:
  → CJS: sync, runtime, value COPY
  → ESM: static, compile-time, value REFERENCE, tree-shaking ⭐
  → AMD: async, dependency upfront
  → CMD: async, dependency nearby

  EVENT LOOP:
  → Sync → ALL microtasks → Render → 1 macrotask → loop

  V8 GC:
  → New gen: Scavenge (From/To swap, promote khi survive/25%)
  → Old gen: Mark-Sweep + Mark-Compact + Incremental Marking

  HANDWRITTEN:
  → call/apply: context[Symbol()] = this → context[fn](...args)
  → bind: return function, handle new vs normal
  → curry: fn.length <= args.length ? execute : wait
  → new: {} → setPrototypeOf → apply → check return
```

### Checklist

- [ ] 8 types: 7 primitives (Stack) + Object (Heap)
- [ ] Stack vs Heap: primitives copy VALUE, objects copy POINTER
- [ ] toString.call() chính xác nhất, typeof null = 'object' bug
- [ ] null = empty object, undefined = chưa define, void 0 = safe
- [ ] valueOf/toString: coercion order ① valueOf ② toString
- [ ] Scope chain: xác định khi DEFINE (lexical scoping)
- [ ] this: 5 rules, ưu tiên new > explicit > implicit > default
- [ ] call = ngay + ...args, apply = ngay + [args], bind = return fn
- [ ] Prototype chain: **proto** → prototype → Object.prototype → null
- [ ] Closure: function + env → private vars, memory leak risk
- [ ] 3 event models: DOM0, IE (2 phase), DOM2 (3 phase)
- [ ] defer vs async: defer = sau DOM + đúng thứ tự, async = ngay + random
- [ ] CJS runtime copy vs ESM compile reference — tree-shaking
- [ ] Event Loop: sync → microtasks → render → macrotask
- [ ] V8 GC: Scavenge (new) + Mark-Sweep-Compact (old) + Incremental
- [ ] 4 memory leaks: global, timer, detached DOM, closure
- [ ] Arrow: no this, no arguments, no super, no new
- [ ] Handwritten call: Symbol() + context[fn] + delete
- [ ] Handwritten bind: handle new (instanceof) vs normal
- [ ] Curry: fn.length vs args.length → execute or wait
- [ ] Handwritten new: {} → setPrototypeOf → apply → check return

---

_Cập nhật lần cuối: Tháng 2, 2026_
