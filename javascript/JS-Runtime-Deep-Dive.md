# Tự tay xây dựng JavaScript Runtime — Deep Dive

> 📅 2026-02-12 · ⏱ 30 phút đọc
>
> Dựa trên bài viết "Building a JavaScript Runtime in One Month"
> (Ant runtime — ~2MB). 7 chủ đề: NaN-boxing value representation,
> Parsing & ASI, Garbage Collection (mark-copy-compact), Promise &
> async/await (coroutines), JS edge cases, Optimization (arena,
> dispatch table, slots), Architecture overview.
> Độ khó: ⭐️⭐️⭐️⭐️⭐️ | Chủ đề: JS Engine Internals

---

## Mục Lục

0. [Tổng quan — Ant Runtime](#0-tổng-quan)
1. [NaN-Boxing — Value Representation](#1-nan-boxing)
2. [Parsing & JavaScript Quirks](#2-parsing)
3. [Garbage Collection](#3-garbage-collection)
4. [Promise & Async/Await — Coroutines](#4-promise--asyncawait)
5. [JavaScript Edge Cases](#5-edge-cases)
6. [Standard Library & Real-world Usage](#6-standard-library)
7. [Optimization Phase](#7-optimization)
8. [Tóm Tắt & Câu Hỏi Phỏng Vấn](#8-tóm-tắt)

---

## 0. Tổng quan

### Ant Runtime — 1 tháng, 1 người, ~2MB

```
ANT RUNTIME — WHAT & WHY:
═══════════════════════════════════════════════════════════════

  MỤC TIÊU:
  ① Đủ nhỏ để nhúng vào C program (~2MB)
  ② Đủ hoàn chỉnh để chạy code thật
  ③ Không cần V8 (hàng trăm MB) hay Node

  KẾT QUẢ SAU 1 THÁNG:
  ✅ Pass ES1–ES5 conformance tests (25 năm spec)
  ✅ async/await + Promise + microtask
  ✅ GC hoạt động, không leak memory
  ✅ HTTP server (dựa trên libuv)
  ✅ FFI gọi system libraries (SQLite, etc.)
  ✅ File I/O, async I/O
  ✅ ES Modules (import/export)
  ✅ Symbol, Proxy, Reflect, WeakMap/WeakSet
  ✅ SharedArrayBuffer + Atomics
  ✅ Class, arrow functions, destructuring, optional chaining

  TIMELINE:
  ┌─────────┬──────────────────────────────────────────┐
  │ Tuần 1  │ Parser, NaN-boxing, variables, functions │
  │         │ loops, basic CommonJS modules             │
  │ Tuần 2  │ GC (nightmare → bdwgc), Promise,         │
  │         │ async/await (minicoro coroutines)         │
  │ Tuần 3  │ Edge cases: freeze/seal, destructuring,  │
  │         │ prototype chain, strict mode              │
  │ Tuần 4  │ Stdlib (fs, path, URL, HTTP), polish,    │
  │         │ Proxy/Reflect/Symbol, conformance tests   │
  │ Sau v1  │ Optimization: arena, dispatch table,     │
  │         │ slots, mark-copy-compact GC               │
  └─────────┴──────────────────────────────────────────┘
```

### Architecture

```
ANT RUNTIME ARCHITECTURE:
═══════════════════════════════════════════════════════════════

  ┌──────────────────────────────────────────────────────────┐
  │                    JavaScript Source                      │
  └──────────────┬───────────────────────────────────────────┘
                 ↓
  ┌──────────────────────────────────────────────────────────┐
  │  PARSER (Lexer + AST)                                    │
  │  → Tokenize → Parse → Handle ASI, hoisting, etc.        │
  └──────────────┬───────────────────────────────────────────┘
                 ↓
  ┌──────────────────────────────────────────────────────────┐
  │  INTERPRETER / EVALUATOR                                 │
  │  ┌────────────────────┐  ┌───────────────────────────┐  │
  │  │ NaN-Boxing Values  │  │ Scope Chain / Closures    │  │
  │  │ (jsval_t = uint64) │  │ (prototype lookup)        │  │
  │  └────────────────────┘  └───────────────────────────┘  │
  │  ┌────────────────────┐  ┌───────────────────────────┐  │
  │  │ Coroutine Scheduler│  │ Event Loop                │  │
  │  │ (minicoro)         │  │ (microtask + timer queue) │  │
  │  └────────────────────┘  └───────────────────────────┘  │
  └──────────────┬───────────────────────────────────────────┘
                 ↓
  ┌──────────────────────────────────────────────────────────┐
  │  MEMORY MANAGEMENT (GC)                                  │
  │  bdwgc + custom mark-copy-compact                        │
  │  + forward reference tracking                            │
  └──────────────┬───────────────────────────────────────────┘
                 ↓
  ┌──────────────────────────────────────────────────────────┐
  │  NATIVE MODULES                                          │
  │  fs, path, URL, HTTP (libuv), FFI, Atomics              │
  └──────────────────────────────────────────────────────────┘
```

---

## 1. NaN-Boxing

### Vấn đề: Biểu diễn giá trị JS

> Mọi giá trị JS (number, string, object, function, null, undefined,
> boolean...) đều cần được biểu diễn trong runtime. Cách thông thường:
> tagged union hoặc struct + type tag. Nhưng có cách hiệu quả hơn.

### NaN-Boxing — Tất cả trong 64 bits

```
NaN-BOXING:
═══════════════════════════════════════════════════════════════

  IEEE 754 double (64 bits):
  ┌─────┬─────────────┬──────────────────────────────────────┐
  │Sign │ Exponent    │ Mantissa (Significand)               │
  │ 1b  │ 11 bits     │ 52 bits                              │
  └─────┴─────────────┴──────────────────────────────────────┘

  NaN = Exponent = all 1s + Mantissa ≠ 0
  → Có 2^53 giá trị NaN khác nhau!
  → Hầu hết KHÔNG BAO GIỜ được dùng!

  IDEA: "Ăn cắp" các NaN không dùng để encode type + pointer!

  Layout:
  ┌─────┬───────────┬──────┬──────────────────────────────┐
  │  1  │ 11111...1 │ Tag  │ Payload (pointer or value)   │
  │sign │ exponent  │ 3-4b │ 48 bits                      │
  └─────┴───────────┴──────┴──────────────────────────────┘

  Tag encoding (ví dụ):
  ┌──────────┬──────────────────────────────────────────┐
  │ 0x7FF0.. │ Normal double (không phải NaN)           │
  │ Tag = 1  │ Object pointer                           │
  │ Tag = 2  │ String pointer                           │
  │ Tag = 3  │ Function pointer                         │
  │ Tag = 4  │ Boolean (payload = 0 or 1)               │
  │ Tag = 5  │ null                                     │
  │ Tag = 6  │ undefined                                │
  │ Tag = 7  │ Symbol                                   │
  └──────────┴──────────────────────────────────────────┘
```

```c
// Ant runtime core:
typedef uint64_t jsval_t;

// MỌI giá trị JS = 1 machine word (64 bits)
// Không cần tagged union, không cần vtable,
// không cần extra metadata allocation

// Compile-time verification:
_Static_assert(sizeof(double) == 8,
    "NaN-boxing requires 64-bit IEEE 754 doubles");
_Static_assert(sizeof(uint64_t) == 8,
    "NaN-boxing requires 64-bit integers");
_Static_assert(sizeof(double) == sizeof(uint64_t),
    "double and uint64_t must have same size");
```

### Lợi ích NaN-Boxing

```
TẠI SAO NaN-BOXING?
  ┌──────────────────┬──────────────────┬──────────────────┐
  │                  │ Tagged Union     │ NaN-Boxing       │
  ├──────────────────┼──────────────────┼──────────────────┤
  │ Size per value   │ 16+ bytes        │ 8 bytes          │
  │                  │ (tag + union)    │ (1 machine word) │
  ├──────────────────┼──────────────────┼──────────────────┤
  │ Cache friendly   │ ❌ Larger        │ ✅ 2x smaller    │
  ├──────────────────┼──────────────────┼──────────────────┤
  │ Number access    │ Unbox required   │ Direct (đã là   │
  │                  │                  │ double!)          │
  ├──────────────────┼──────────────────┼──────────────────┤
  │ Extra alloc      │ Metadata struct  │ Không cần        │
  ├──────────────────┼──────────────────┼──────────────────┤
  │ Complexity       │ Đơn giản         │ Bit manipulation │
  └──────────────────┴──────────────────┴──────────────────┘

  Dùng bởi: SpiderMonkey (Firefox), JavaScriptCore (Safari), LuaJIT
```

---

## 2. Parsing

### JavaScript — Ngôn ngữ "quái dị"

```
PARSING CHALLENGES:
═══════════════════════════════════════════════════════════════

  ① AUTOMATIC SEMICOLON INSERTION (ASI)
     JS tự chèn ; khi parser gặp lỗi ở cuối dòng
     → Parser phải implement ASI rules từ spec!

     return        // ASI chèn ; sau return!
       { a: 1 }   // → return undefined, KHÔNG phải object!

  ② THIS BINDING thay đổi theo context
     function f() { this; }  // global hoặc caller
     obj.f()                 // this = obj
     () => { this; }         // lexical this (enclosing)
     new f()                 // this = new object

  ③ VAR HOISTING
     console.log(x);  // undefined (không phải ReferenceError!)
     var x = 5;       // khai báo "nổi lên" đầu scope

  ④ WEIRD BUT LEGAL
     window.window.window  // hợp lệ!
     [] + []               // ""
     {} + []               // 0
     typeof null            // "object" (bug từ 1995!)
```

### Parser Pipeline

```
PARSING PIPELINE:
  Source Code → Lexer → Tokens → Parser → AST → Evaluator

  "let x = 1 + 2;"

  LEXER (Tokenize):
  [LET] [IDENT:"x"] [ASSIGN] [NUMBER:1] [PLUS] [NUMBER:2] [SEMI]

  PARSER (AST):
  VariableDeclaration {
    kind: "let",
    declarations: [{
      id: Identifier("x"),
      init: BinaryExpression {
        operator: "+",
        left: NumericLiteral(1),
        right: NumericLiteral(2)
      }
    }]
  }

  EVALUATOR:
  → Tạo binding "x" trong current scope
  → Evaluate 1 + 2 = 3
  → Assign 3 cho "x"
```

---

## 3. Garbage Collection

### Tại sao JS runtime PHẢI có GC?

```
GC — WHY:
  JS developer KHÔNG manual free():
  let obj = { name: "hello" };
  obj = null;  // object cũ cần được GC thu hồi!

  Không có GC → memory leak → crash!
```

### Hành trình GC của Ant

```
GC JOURNEY:
═══════════════════════════════════════════════════════════════

  ❌ ATTEMPT 1: Hand-written free-list GC
     → Thêm feature mới → GC vỡ
     → Fix GC → performance vỡ
     → Bật/tắt hàng trăm lần, mỗi lần hỏng module khác
     → "Cơn ác mộng"

  ❌ ATTEMPT 2: Integrate third-party GC
     → Quá phức tạp để integrate

  ✅ SOLUTION: bdwgc (Boehm-Demers-Weiser GC)
     → Production-grade, nhiều ngôn ngữ dùng
     → Kết hợp custom mark-copy-compact
     → Forward reference tracking (pointer không bị stale)
     → "Một khi integrate xong, mọi thứ ổn định"
```

### GC Algorithms — Tổng quan

```
GC ALGORITHMS:
  ┌──────────────────┬─────────────────────────────────────┐
  │ Mark-Sweep       │ Mark reachable → sweep unreachable  │
  │                  │ ✅ Simple  ❌ Fragmentation          │
  ├──────────────────┼─────────────────────────────────────┤
  │ Mark-Compact     │ Mark → compact (di chuyển objects   │
  │                  │ sát nhau, loại bỏ fragmentation)    │
  │                  │ ✅ No fragmentation  ❌ Costly move  │
  ├──────────────────┼─────────────────────────────────────┤
  │ Mark-Copy        │ Copy reachable sang new space       │
  │                  │ ✅ Fast alloc  ❌ 2x memory          │
  ├──────────────────┼─────────────────────────────────────┤
  │ Generational     │ Young gen (frequent) + Old gen      │
  │                  │ (infrequent). V8 dùng cách này.     │
  │                  │ ✅ Optimized  ❌ Complex             │
  ├──────────────────┼─────────────────────────────────────┤
  │ Reference        │ Count references → free khi count=0 │
  │ Counting         │ ✅ Immediate  ❌ Circular refs!      │
  └──────────────────┴─────────────────────────────────────┘

  ANT:
  bdwgc (conservative GC) + custom mark-copy-compact
  + deferred GC (chạy giữa các work unit, tránh hot path)
  + forward reference tracking (pointer update sau compact)
```

### Forward Reference Tracking

```
FORWARD REFERENCE:
═══════════════════════════════════════════════════════════════

  Khi GC compact/move object → địa chỉ thay đổi!
  → Tất cả pointer trỏ đến object cũ phải UPDATE!

  TRƯỚC compact:
  ┌────────┐     ┌────────┐     ┌────────┐
  │ Obj A  │ ──→ │ Obj B  │     │ Obj C  │
  │ @0x100 │     │ @0x300 │     │ @0x500 │
  └────────┘     └────────┘     └────────┘
                     ↑ gap (fragmentation)

  SAU compact:
  ┌────────┐ ┌────────┐ ┌────────┐
  │ Obj A  │ │ Obj B  │ │ Obj C  │
  │ @0x100 │ │ @0x108 │ │ @0x110 │  ← sát nhau!
  └────────┘ └────────┘ └────────┘
       │         ↑
       └─────────┘  pointer PHẢI update: 0x300 → 0x108

  Forward Reference Table:
  { 0x300 → 0x108, 0x500 → 0x110 }
  → Scan toàn bộ heap, update mọi pointer cũ
```

---

## 4. Promise & Async/Await

### Dependency Chain

```
ASYNC/AWAIT DEPENDENCY CHAIN:
═══════════════════════════════════════════════════════════════

  async/await cần → Promise
  Promise cần     → microtask queue + timer
  microtask cần   → event loop
  event loop cần  → nơi lưu trạng thái async operations
  async function  → coroutine (pause/resume execution)
  coroutine       → scheduler (quản lý nhiều coroutines)
  scheduler       → event loop (biết coroutine nào xong)

  → PHẢI BUILD TẤT CẢ CÙNG LÚC!
```

### Coroutine — minicoro

```c
// Ant sử dụng minicoro cho stack-based coroutines
typedef struct coroutine {
    struct js *js;
    coroutine_type_t type;
    jsval_t scope;              // Scope hiện tại
    jsval_t this_val;           // 'this' binding
    jsval_t awaited_promise;    // Promise đang await
    jsval_t result;             // Kết quả trả về
    jsval_t async_func;         // Function đang chạy
    jsval_t *args;              // Arguments
    int nargs;
    bool is_settled;            // Promise đã resolve/reject?
    bool is_error;              // Có lỗi?
    bool is_done;               // Coroutine hoàn thành?
    jsoff_t resume_point;       // Điểm resume
    jsval_t yield_value;        // Generator yield value
    struct coroutine *prev;     // Linked list ←
    struct coroutine *next;     // Linked list →
    mco_coro* mco;              // minicoro handle
    bool mco_started;
    bool is_ready;
} coroutine_t;
```

### Event Loop & Async Flow

```
EVENT LOOP — ASYNC FLOW:
═══════════════════════════════════════════════════════════════

  ┌──────────────────────────────────────────────────────────┐
  │                     EVENT LOOP                           │
  │                                                          │
  │  ① Execute synchronous code                             │
  │     ↓                                                    │
  │  ② Drain microtask queue                                │
  │     (Promise .then callbacks, queueMicrotask)           │
  │     ↓                                                    │
  │  ③ Check timer queue                                    │
  │     (setTimeout, setInterval callbacks)                 │
  │     ↓                                                    │
  │  ④ Check I/O (libuv)                                    │
  │     (file, network readiness)                           │
  │     ↓                                                    │
  │  ⑤ Check coroutine scheduler                            │
  │     (resume coroutines whose awaited_promise settled)   │
  │     ↓                                                    │
  │  Loop back to ② nếu còn work                            │
  └──────────────────────────────────────────────────────────┘

  ASYNC FUNCTION FLOW:
  async function getData() {
      const res = await fetch('/api');  // ← PAUSE coroutine
      return res.json();                // ← RESUME khi Promise resolves
  }

  ① Call getData() → create coroutine
  ② Execute đến await → PAUSE coroutine, return Promise
  ③ fetch resolves → scheduler mark coroutine "ready"
  ④ Event loop → resume coroutine từ resume_point
  ⑤ Continue execution → return result → resolve outer Promise
```

### Promise Chain — Microtask Queue

```
PROMISE .then() — MICROTASK:
═══════════════════════════════════════════════════════════════

  Promise.resolve(1)
    .then(x => x + 1)    // microtask 1
    .then(x => x * 2)    // microtask 2
    .then(console.log);  // microtask 3 → prints 4

  Execution Order:
  ┌────────────────────────────────────────┐
  │ 1. Synchronous: create promise chain  │
  │ 2. Microtask queue: [then(x+1)]       │
  │ 3. Drain: then(x+1) → result=2       │
  │    Queue: [then(x*2)]                 │
  │ 4. Drain: then(x*2) → result=4       │
  │    Queue: [then(log)]                 │
  │ 5. Drain: console.log(4)             │
  │    Queue: [] → DONE                   │
  └────────────────────────────────────────┘

  ⚠️ Microtask luôn chạy TRƯỚC timer!
  → Promise.then() trước setTimeout(..., 0)
```

---

## 5. Edge Cases

### Prototype Chain — 4 cách truy cập

```javascript
// 4 cách truy cập prototype (PHẢI implement tất cả, NHẤT QUÁN):

// ① __proto__ (deprecated nhưng vẫn phải support)
obj.__proto__ = parent;

// ② Object.getPrototypeOf()
const proto = Object.getPrototypeOf(obj);

// ③ Object.setPrototypeOf()
Object.setPrototypeOf(obj, parent);

// ④ [[Prototype]] internal slot
// → Runtime level, không expose ra JS
// → Nhưng ①②③ đều phải map đúng đến internal slot!
```

### Destructuring — Phức tạp hơn tưởng

```javascript
// Trông đơn giản:
const [a, b] = arr;

// Nhưng edge cases:
const [a, , b] = [1, 2, 3]; // sparse: a=1, b=3
const [a, ...rest] = [1, 2, 3]; // rest: a=1, rest=[2,3]
const { a: x, b: y = 10 } = obj; // rename + default value
const {
  a: {
    b: { c },
  },
} = deep; // nested destructuring
const [{ a }, [b]] = [{ a: 1 }, [2]]; // mixed array + object

// Mỗi case = logic riêng trong parser + evaluator
// "Mỗi lần fix 1 chỗ → chỗ khác vỡ" (whack-a-mole)
```

### Freeze / Seal / Property Descriptors

```
OBJECT IMMUTABILITY:
  ┌───────────────────┬────────┬────────┬────────────────┐
  │                   │ Add    │ Delete │ Modify value   │
  ├───────────────────┼────────┼────────┼────────────────┤
  │ Normal object     │ ✅     │ ✅     │ ✅              │
  │ Object.seal()     │ ❌     │ ❌     │ ✅              │
  │ Object.freeze()   │ ❌     │ ❌     │ ❌              │
  └───────────────────┴────────┴────────┴────────────────┘

  Property Descriptor:
  {
    value: 42,
    writable: true,      // có thể ghi?
    enumerable: true,    // hiện trong for...in?
    configurable: true,  // có thể delete/redefine?
    get: function() {},  // accessor getter
    set: function() {}   // accessor setter
  }
  → Runtime PHẢI check tất cả flags cho MỌI property access!
```

---

## 6. Standard Library

### Real-World Usage — HTTP Server

```javascript
// Chạy trên Ant runtime — REAL JavaScript:
import { join } from "ant:path";
import { readFile } from "ant:fs";
import { createRouter, addRoute, findRoute } from "rou3";

const router = createRouter();

addRoute(router, "GET", "/status/:id", async (c) => {
  await new Promise((r) => setTimeout(r, 1000));

  const result = await Promise.resolve("Hello");
  const name = await readFile(join(import.meta.dirname, "name.txt"));

  return c.res.body(`${name} says ${result} ${c.params.id}!`);
});

Ant.serve(8000, async (c) => {
  console.log("request:", c.req.method, c.req.uri);
  const route = findRoute(router, c.req.method, c.req.uri);

  if (route?.data) {
    c.params = route.params;
    return await route.data(c);
  }
  c.res.body("not found: " + c.req.uri, 404);
});

// $ ant examples/server/server.js
// started on http://localhost:8000
// $ curl http://localhost:8000/status/world
// Ant 0.3.2.6 server is responding with Hello world!
```

### FFI — Foreign Function Interface

```javascript
// Gọi system library từ JavaScript!
import { dlopen, suffix, FFIType } from "ant:ffi";

const sqlite3 = dlopen(`libsqlite3.${suffix}`);

sqlite3.define("sqlite3_libversion", {
  args: [],
  returns: FFIType.string,
});

console.log(`version: ${sqlite3.sqlite3_libversion()}`);
// $ ant examples/ffi/basic/sqlite.js
// version: 3.43.2
```

### Atomics — Shared Memory

```javascript
const sharedBuffer = new SharedArrayBuffer(256);
const int32View = new Int32Array(sharedBuffer);

Atomics.store(int32View, 0, 42);
const value = Atomics.load(int32View, 0);
console.log("stored 42, loaded:", value); // 42

Atomics.store(int32View, 1, 10);
const oldValue = Atomics.add(int32View, 1, 5);
console.log("old value:", oldValue); // 10

Atomics.store(int32View, 2, 100);
Atomics.compareExchange(int32View, 2, 100, 200);
console.log("new:", Atomics.load(int32View, 2)); // 200
```

---

## 7. Optimization

### Optimization Methodology

```
OPTIMIZE CYCLE:
  Profile (xctrace) → Find bottleneck → Fix → Measure → Commit
  → Repeat

  Giữ "working snapshots" → nếu optimization phá vỡ gì
  → rollback về snapshot ổn định
```

### Key Optimizations

```
OPTIMIZATIONS APPLIED:
═══════════════════════════════════════════════════════════════

  ① ARENA ALLOCATOR cho Typed Arrays
     TRƯỚC: TypedArray scatter khắp heap → poor cache locality
     SAU:   Tập trung trong arena → fast alloc + better cache

     ┌────────────────────────────────────────────────┐
     │ Heap (trước):                                  │
     │ [obj][...gap...][TypedArr][...gap...][TypedArr]│
     │ → Cache miss! Pointer chasing!                 │
     ├────────────────────────────────────────────────┤
     │ Arena (sau):                                   │
     │ [TypedArr][TypedArr][TypedArr][TypedArr]       │
     │ → Sequential! Cache friendly!                  │
     └────────────────────────────────────────────────┘

  ② DESCRIPTOR TABLE cho Getters/Setters
     TRƯỚC: Mỗi property descriptor = allocation riêng
     SAU:   Batch vào 1 table → ít allocation, ít pointer chasing

  ③ PROPERTY REFERENCE TABLE
     TRƯỚC: property lookup = full parse mỗi lần
     SAU:   Cache lookup result → skip lần sau

  ④ DISPATCH TABLE (Computed Goto)
     TRƯỚC: switch/case cho FFI, JSON paths → branch prediction miss
     SAU:   Computed goto → CPU nhảy thẳng handler, bỏ branch

     // Computed goto (GCC extension):
     void *dispatch[] = { &&handle_int, &&handle_str, ... };
     goto *dispatch[type];
     handle_int: /* ... */
     handle_str: /* ... */

  ⑤ SLOTS (Property Migration)
     TRƯỚC: Object dùng flexible property map (hash lookup)
     SAU:   Fixed-layout slots theo object shape
     → Runtime biết trước layout → direct offset access
     → Giống V8 Hidden Classes / Shapes!

     // Trước:
     obj.name → hash("name") → bucket → linear search → value
     // Sau (slots):
     obj.name → slot[0] (biết trước offset!)
```

### GC Improvements — Phase 2

```
GC PHASE 2 — DEFERRED + MARK-COPY-COMPACT:
═══════════════════════════════════════════════════════════════

  VẤN ĐỀ ban đầu:
  GC chạy giữa hot path → jank, stutter

  GIẢI PHÁP — Deferred GC:
  ① GC KHÔNG chạy giữa critical operation
  ② Chờ đến "safe point" giữa các work unit mới chạy
  ③ Mark-copy-compact: compact heap, loại bỏ fragmentation
  ④ Forward reference tracking: update stale pointers

  FLOW:
  [Hot code executing...]
  [Safe point reached]
  → GC Mark: scan root set, mark reachable
  → GC Copy: copy live objects to new space
  → GC Compact: update all references
  → GC Complete: old space freed
  [Resume hot code]
```

---

## 8. Tóm Tắt

### Quick Reference

```
JS RUNTIME — QUICK REFERENCE:
═══════════════════════════════════════════════════════════════

  VALUE REPRESENTATION:
    NaN-Boxing      → 64-bit encode type + data in NaN bits
    jsval_t = uint64→ mọi JS value = 1 machine word

  PARSING:
    Lexer → Tokens → Parser → AST → Evaluator
    Challenges: ASI, hoisting, this binding, weird syntax

  GC:
    Must-have      → JS không có manual free
    Approaches     → Mark-sweep, mark-compact, generational
    Ant            → bdwgc + custom mark-copy-compact
    Key            → Forward reference tracking, deferred GC

  ASYNC:
    Dependencies   → Promise → microtask → event loop → coroutine
    Coroutine      → minicoro (stack-based, pause/resume)
    Event loop     → sync → microtask → timer → I/O → scheduler

  EDGE CASES:
    Prototype      → 4 ways (__proto__, get/setPrototypeOf, [[Prototype]])
    Destructuring  → sparse, nested, rest, default values
    Descriptors    → writable, enumerable, configurable, get/set

  OPTIMIZATION:
    Arena allocator→ TypedArray cache locality
    Dispatch table → computed goto (no branch prediction miss)
    Slots          → fixed-layout property access (like V8 shapes)
    Deferred GC    → run at safe points, not in hot path
```

### Câu Hỏi Phỏng Vấn

**1. NaN-Boxing là gì? Tại sao dùng?**

> NaN-Boxing lợi dụng IEEE 754: có **2^53 giá trị NaN** mà hầu hết không dùng. Encode **type tag + pointer/value** vào các bit NaN trống → mọi JS value chỉ chiếm **8 bytes** (1 machine word) thay vì 16+ bytes với tagged union. Lợi: cache friendly, ít allocation, number access trực tiếp (đã là double). SpiderMonkey, JavaScriptCore, LuaJIT đều dùng.

**2. Tại sao JS runtime cần GC? Có những algorithm nào?**

> JS không có `free()` — developer tạo object nhưng không manual giải phóng. Runtime **phải** tự detect unreachable objects và thu hồi memory. Algorithms chính: **Mark-Sweep** (đơn giản, có fragmentation), **Mark-Compact** (compact heap, tốn cost di chuyển), **Generational** (young/old gen — V8 dùng), **Reference Counting** (immediate nhưng không handle circular refs). Production thường kết hợp nhiều techniques.

**3. Implement async/await cần những gì?**

> Chain: async/await → **Promise** → **microtask queue** + timer → **event loop** → **coroutine** (pause/resume execution) → **scheduler**. Coroutine cho phép function "tạm dừng" tại await expression, lưu toàn bộ state (scope, this, resume point) và resume khi Promise resolve. Event loop drain microtask, check timer/IO, rồi resume ready coroutines.

**4. V8 Hidden Classes (Shapes) hoạt động thế nào?**

> Khi tạo object, V8 gán **hidden class** (shape) mô tả layout: property nào ở offset nào. Objects cùng shape → share transition tree → property access = **direct offset** (thay vì hash lookup). Nếu add/delete property → **transition** sang shape mới. Ant implement tương tự bằng **slots**: fixed-layout theo object type, property → slot[offset].

**5. Event loop priority: microtask vs macrotask?**

> **Microtask** (Promise.then, queueMicrotask) luôn chạy **TRƯỚC** macrotask (setTimeout, I/O callbacks). Mỗi vòng event loop: execute sync code → **drain ALL microtasks** → execute 1 macrotask → drain ALL microtasks → repeat. Nếu microtask tạo microtask mới → cũng drain hết trước khi chuyển macrotask. Đây là lý do `Promise.resolve().then(...)` chạy trước `setTimeout(..., 0)`.

**6. Forward reference tracking trong GC là gì?**

> Khi GC **compact** heap, objects di chuyển sang địa chỉ mới → tất cả pointer trỏ đến địa chỉ cũ **phải update**. Forward reference table map: `old address → new address`. GC scan toàn bộ root set + heap, replace mọi stale pointer. Nếu không → dangling pointer → crash hoặc corruption.

---

## Checklist Học Tập

- [ ] NaN-Boxing: IEEE 754 double → 2^53 unused NaN → encode type+value
- [ ] jsval_t = uint64_t: mọi JS value = 1 machine word (8 bytes)
- [ ] Parser pipeline: source → lexer → tokens → parser → AST → eval
- [ ] Parsing challenges: ASI, hoisting, this binding, weird syntax
- [ ] GC necessity: JS không có manual free → runtime PHẢI có GC
- [ ] GC algorithms: mark-sweep, mark-compact, generational, ref count
- [ ] Forward reference tracking: update pointers sau compact
- [ ] Deferred GC: chạy ở safe points, không giữa hot path
- [ ] Async chain: async → Promise → microtask → event loop → coroutine
- [ ] Coroutine: stack-based (minicoro), pause/resume at await
- [ ] Event loop: sync → microtask (drain ALL) → macrotask → microtask
- [ ] Promise .then() = microtask, setTimeout = macrotask
- [ ] Prototype chain: 4 access methods, phải nhất quán
- [ ] Property descriptors: writable, enumerable, configurable
- [ ] Destructuring edge cases: sparse, nested, rest, defaults
- [ ] Arena allocator: group same-type objects → cache friendly
- [ ] Dispatch table: computed goto → no branch prediction miss
- [ ] Slots: fixed-layout property access (V8 hidden classes)
- [ ] Conformance tests: ES1–ES5, mỗi lần pass test → phát hiện bug mới

---

_Cập nhật lần cuối: Tháng 2, 2026_
