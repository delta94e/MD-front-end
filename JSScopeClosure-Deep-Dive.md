# JavaScript Scope & Closure — Deep Dive

> 📅 2026-02-13 · ⏱ 25 phút đọc
>
> Nguồn: ConardLi — "JS Scope & Closure" · Juejin
> Lexical Scope → Scope Chain → Execution Context → this → Closure
> → Memory Leak → Async Loop → Module Systems
> Độ khó: ⭐️⭐️⭐️⭐️⭐️ | Must-know JS Core Interview

---

## Mục Lục

| #   | Phần                           |
| --- | ------------------------------ |
| 1   | Lexical Scope vs Dynamic Scope |
| 2   | Scope & Scope Chain            |
| 3   | Execution Context Stack        |
| 4   | this — 5 Quy tắc binding       |
| 5   | Closure — Nguyên lý & Ứng dụng |
| 6   | Stack Overflow & Memory Leak   |
| 7   | Async trong vòng lặp           |
| 8   | Module Systems — 4 chuẩn       |
| 9   | Tổng kết & Checklist phỏng vấn |

---

## §1. Lexical Scope vs Dynamic Scope

```
2 LOẠI SCOPE:
═══════════════════════════════════════════════════════════════

  LEXICAL SCOPE (Static Scope) — JavaScript dùng cái này! ⭐
  → Scope được xác định LÚC VIẾT CODE (author time)
  → Không thay đổi lúc runtime
  → Nơi HÀM ĐƯỢC KHAI BÁO → quyết định scope chain

  DYNAMIC SCOPE — Bash, một số ngôn ngữ cũ
  → Scope được xác định LÚC GỌI HÀM (runtime)
  → Nơi HÀM ĐƯỢC GỌI → quyết định scope chain
```

```javascript
// MỘT VÍ DỤ, HAI KẾT QUẢ:
var value = 1;

function foo() {
  console.log(value);
}

function bar() {
  var value = 2;
  foo(); // ← Gọi foo từ bên trong bar
}

bar();

// LEXICAL SCOPE (JavaScript):
// → foo() khai báo ở GLOBAL → scope chain: foo → global
// → Tìm value ở foo? KHÔNG → tìm ở global? CÓ! value = 1
// → KẾT QUẢ: 1 ✅

// DYNAMIC SCOPE (giả sử):
// → foo() được GỌI từ bar → scope chain: foo → bar → global
// → Tìm value ở foo? KHÔNG → tìm ở bar? CÓ! value = 2
// → KẾT QUẢ: 2
```

```
TẠI SAO LEXICAL SCOPE TỐT HƠN:
═══════════════════════════════════════════════════════════════

  ✅ DỰ ĐOÁN ĐƯỢC — nhìn code biết ngay biến nào tham chiếu ở đâu
  ✅ AN TOÀN — không bị ảnh hưởng bởi context gọi hàm
  ✅ TỐI ƯU — engine compile và tối ưu tốt hơn
  ❌ Dynamic scope: phải trace call stack mới biết giá trị biến!

  ⚠️ NGOẠI LỆ: this trong JS hoạt động GIỐNG dynamic scope!
  → Giá trị this phụ thuộc vào CÁCH GỌI hàm, không phải nơi khai báo!
  → (Xem §4 bên dưới)
```

---

## §2. Scope & Scope Chain

```
3 LOẠI SCOPE TRONG JS:
═══════════════════════════════════════════════════════════════

  ┌────────────────────────────────────────────────────────────┐
  │ ① GLOBAL SCOPE                                            │
  │   → Biến khai báo ngoài tất cả function/block             │
  │   → Truy cập từ MỌI NƠI                                  │
  │   → window.xxx (browser) hoặc global.xxx (Node)           │
  │                                                            │
  │ ② FUNCTION SCOPE                                           │
  │   → Biến khai báo bên trong function (var)                 │
  │   → Chỉ truy cập trong function đó                         │
  │   → KHÔNG lộ ra ngoài!                                     │
  │                                                            │
  │ ③ BLOCK SCOPE (ES6+)                                      │
  │   → Biến khai báo bằng let/const trong { }                │
  │   → Chỉ truy cập trong block đó                            │
  │   → if, for, while, { } blocks                             │
  └────────────────────────────────────────────────────────────┘
```

```javascript
// FUNCTION SCOPE vs BLOCK SCOPE:
function test() {
  var a = 1; // function scope
  let b = 2; // block scope (nhưng function = 1 block → tương tự)
  const c = 3; // block scope

  if (true) {
    var d = 4; // function scope! Lộ ra ngoài if block!
    let e = 5; // block scope — chỉ trong if block
    const f = 6; // block scope — chỉ trong if block
  }

  console.log(d); // 4 ← var KHÔNG bị giới hạn bởi block!
  // console.log(e); // ❌ ReferenceError! let bị giới hạn!
  // console.log(f); // ❌ ReferenceError! const bị giới hạn!
}

// VAR HOISTING (Kéo lên):
console.log(x); // undefined ← Không lỗi! var được hoist!
var x = 10;
// Thực tế engine thấy:
// var x;           ← Khai báo được hoist lên đầu
// console.log(x);  ← undefined (đã khai báo, chưa gán)
// x = 10;          ← Gán giá trị

// LET/CONST — Temporal Dead Zone (TDZ):
// console.log(y); // ❌ ReferenceError! TDZ!
let y = 20;
// let/const CŨNG được hoist, nhưng KHÔNG được khởi tạo!
// → Truy cập trước khai báo → TDZ → ReferenceError!
```

### Scope Chain

```javascript
// SCOPE CHAIN — Chuỗi phạm vi:
var global_var = "global";

function outer() {
  var outer_var = "outer";

  function inner() {
    var inner_var = "inner";
    console.log(inner_var); // ① Tìm ở inner → CÓ!
    console.log(outer_var); // ② inner KHÔNG → outer CÓ!
    console.log(global_var); // ③ inner KHÔNG → outer KHÔNG → global CÓ!
  }

  inner();
}
outer();
```

```
SCOPE CHAIN VISUALIZATION:
═══════════════════════════════════════════════════════════════

  ┌─────────────────────────────────┐
  │ Global Scope                    │
  │ global_var = 'global'           │
  │ outer = function                │
  │                                 │
  │  ┌──────────────────────────┐   │
  │  │ outer() Scope            │   │
  │  │ outer_var = 'outer'      │   │
  │  │ inner = function         │   │
  │  │                          │   │
  │  │  ┌───────────────────┐   │   │
  │  │  │ inner() Scope     │   │   │
  │  │  │ inner_var='inner' │   │   │
  │  │  └───────┬───────────┘   │   │
  │  │          │ tìm ↑         │   │
  │  └──────────┼───────────────┘   │
  │             │ tìm ↑              │
  └─────────────┴───────────────────┘

  Scope Chain (inner): inner → outer → global
  → Biến tìm từ trong ra ngoài, KHÔNG BAO GIỜ ngược lại!
  → outer KHÔNG truy cập được inner_var!
```

---

## §3. Execution Context Stack

```
EXECUTION CONTEXT (EC) — MÔI TRƯỜNG THỰC THI:
═══════════════════════════════════════════════════════════════

  Mỗi khi code chạy, JS engine tạo 1 Execution Context:

  ┌─────────────────────────────────────────────────────────┐
  │ Execution Context                                       │
  ├─────────────────────────────────────────────────────────┤
  │ Variable Environment (VE)                               │
  │ → Lưu var declarations, function declarations          │
  │ → Hoisting xảy ra ở đây!                               │
  ├─────────────────────────────────────────────────────────┤
  │ Lexical Environment (LE)                                │
  │ → Lưu let/const bindings                               │
  │ → Outer Reference → scope chain link!                  │
  ├─────────────────────────────────────────────────────────┤
  │ This Binding                                            │
  │ → Giá trị this cho context này                         │
  └─────────────────────────────────────────────────────────┘

  3 LOẠI EXECUTION CONTEXT:
  ① Global EC — tạo khi script bắt đầu chạy
  ② Function EC — tạo mỗi khi GỌI function
  ③ Eval EC — tạo khi gọi eval() (ít dùng)
```

```
EXECUTION CONTEXT STACK (Call Stack):
═══════════════════════════════════════════════════════════════

  EC Stack quản lý thứ tự thực thi: LIFO (Last In, First Out)

  function first() {
      console.log('first');
      second();
      console.log('end first');
  }
  function second() {
      console.log('second');
      third();
      console.log('end second');
  }
  function third() {
      console.log('third');
  }
  first();

  STACK EVOLUTION:
  ┌─────────┐
  │ third() │ ← ④ Push third, chạy, pop
  ├─────────┤
  │second() │ ← ③ Push second
  ├─────────┤  ├─────────┤
  │ first() │  │ first() │ ← ② Push first
  ├─────────┤  ├─────────┤  ├─────────┤
  │ Global  │  │ Global  │  │ Global  │ ← ① Luôn ở đáy
  └─────────┘  └─────────┘  └─────────┘

  Output: "first" → "second" → "third" → "end second" → "end first"
```

```javascript
// ĐỌC STACK TRACE TRONG LỖI:
function a() {
  b();
}
function b() {
  c();
}
function c() {
  throw new Error("Bug!");
}

a();
// Error: Bug!
//     at c (script.js:3)    ← Lỗi xảy ra ở đây!
//     at b (script.js:2)    ← b gọi c
//     at a (script.js:1)    ← a gọi b
//     at script.js:5        ← Global gọi a

// → ĐỌC TỪ DƯỚI LÊN = thứ tự gọi!
// → ĐỌC TỪ TRÊN XUỐNG = tìm lỗi nhanh nhất!
// → Dòng đầu tiên = NƠI LỖI XẢY RA!

// NAMED FUNCTION EXPRESSION — giúp debug dễ hơn:
const handler = function handleClick() {
  // ← Đặt tên!
  throw new Error("debug me");
};
// Stack trace sẽ hiện "handleClick" thay vì "anonymous"!
// → LUÔN đặt tên function, kể cả function expression!
```

```
2 GIAI ĐOẠN CỦA EXECUTION CONTEXT:
═══════════════════════════════════════════════════════════════

  ① CREATION PHASE (Tạo):
  → Tạo Variable Environment (hoisting var, function declarations)
  → Tạo Lexical Environment (let/const → TDZ!)
  → Bind this

  ② EXECUTION PHASE (Thực thi):
  → Gán giá trị cho biến
  → Thực thi code từng dòng

  VÍ DỤ HOISTING:
  console.log(a);   // undefined (var hoisted, chưa gán)
  console.log(b);   // ❌ ReferenceError (let TDZ!)
  console.log(c);   // ƒ c() {} (function hoisted HOÀN TOÀN!)

  var a = 1;
  let b = 2;
  function c() {}

  // CREATION PHASE thấy:
  // VE: { a: undefined, c: function }  ← var + function hoisted!
  // LE: { b: <uninitialized> }         ← let TDZ!
```

---

## §4. this — 5 Quy tắc Binding

```
this — KHÔNG PHẢI LEXICAL SCOPE!
═══════════════════════════════════════════════════════════════

  this GIỐNG dynamic scope:
  → Giá trị phụ thuộc vào CÁCH GỌI, không phải nơi khai báo!
  → 5 quy tắc, ƯU TIÊN từ cao đến thấp:
```

### Quy tắc 1: new Binding (Ưu tiên CAO NHẤT)

```javascript
function Person(name) {
  this.name = name;
  // this = object mới được tạo bởi new!
}
var jun = new Person("Jun");
console.log(jun.name); // 'Jun'
// this = jun (object mới)
```

### Quy tắc 2: Explicit Binding (call, apply, bind)

```javascript
function greet() {
  console.log(`Hi, ${this.name}`);
}
var person = { name: "Jun" };

greet.call(person); // "Hi, Jun" — this = person
greet.apply(person); // "Hi, Jun" — this = person
var bound = greet.bind(person);
bound(); // "Hi, Jun" — this = person (vĩnh viễn!)

// CALL vs APPLY vs BIND:
// call(thisArg, arg1, arg2, ...)     — gọi ngay, args riêng lẻ
// apply(thisArg, [arg1, arg2, ...])  — gọi ngay, args là mảng
// bind(thisArg, arg1, arg2, ...)     — TRẢ VỀ function mới, KHÔNG gọi
```

### Quy tắc 3: Implicit Binding (Object method)

```javascript
var obj = {
  name: "Jun",
  greet() {
    console.log(`Hi, ${this.name}`);
  },
};
obj.greet(); // "Hi, Jun" — this = obj (object trước dấu chấm)

// ⚠️ CẠM BẪY — Mất context khi tách method:
var greet = obj.greet;
greet(); // "Hi, undefined" — this = window (hoặc undefined strict mode)!
// → Gán method vào biến → MẤT implicit binding! 💀

// ⚠️ CẠM BẪY — Callback:
setTimeout(obj.greet, 100); // "Hi, undefined" ← MẤT context! 💀
// Fix: setTimeout(() => obj.greet(), 100); ✅
// Fix: setTimeout(obj.greet.bind(obj), 100); ✅
```

### Quy tắc 4: Default Binding

```javascript
function show() {
  console.log(this);
}

show(); // window (non-strict) hoặc undefined (strict mode)

// Non-strict mode: this = window (global object)
// Strict mode: this = undefined
// → LUÔN dùng strict mode để tránh lỗi ẩn!
```

### Quy tắc 5: Arrow Function (Lexical this)

```javascript
// ARROW FUNCTION KHÔNG CÓ this CỦA RIÊNG NÓ!
// → Kế thừa this từ scope BÊN NGOÀI (lexical this)

var obj = {
  name: "Jun",
  greet: () => {
    console.log(this.name); // ← this = OUTER scope (không phải obj!)
  },
  delayGreet() {
    setTimeout(() => {
      console.log(this.name); // ← this = obj (kế thừa từ delayGreet)
    }, 100);
  },
};

obj.greet(); // undefined ← this = window, KHÔNG phải obj! 💀
obj.delayGreet(); // "Jun" ← this = obj (kế thừa từ delayGreet scope) ✅

// call/apply/bind KHÔNG ảnh hưởng arrow function:
var arrow = () => console.log(this);
arrow.call({ name: "Jun" }); // window ← BỎ QUA explicit binding!
```

```
THỨ TỰ ƯU TIÊN this (CAO → THẤP):
═══════════════════════════════════════════════════════════════

  ┌────┬──────────────────────┬───────────────────────────────┐
  │ #  │ Quy tắc              │ this =                        │
  ├────┼──────────────────────┼───────────────────────────────┤
  │ 0  │ Arrow function       │ Lexical (scope ngoài) ← ĐẶC BIỆT│
  │ 1  │ new Constructor()    │ Object mới được tạo           │
  │ 2  │ call/apply/bind      │ Argument đầu tiên             │
  │ 3  │ obj.method()         │ Object trước dấu chấm         │
  │ 4  │ Standalone call      │ window / undefined (strict)   │
  └────┴──────────────────────┴───────────────────────────────┘

  MẸO NHANH:
  → Nhìn VỊ TRÍ GỌI HÀM, không phải nơi khai báo!
  → Có dấu chấm? → this = object trước dấu chấm
  → Có new? → this = object mới
  → Có call/apply/bind? → this = arg đầu tiên
  → Không có gì? → window / undefined
  → Arrow function? → QUÊN HẾT QUY TẮC TRÊN → lấy this từ ngoài!
```

---

## §5. Closure — Nguyên lý & Ứng dụng

```
CLOSURE LÀ GÌ?
═══════════════════════════════════════════════════════════════

  Closure = Function + Lexical Environment nơi nó được khai báo

  Khi function sử dụng biến từ OUTER SCOPE:
  → Dù outer function đã return (EC bị pop khỏi stack)
  → Biến đó VẪN SỐNG! (không bị garbage collect)
  → Vì inner function vẫn giữ REFERENCE đến nó!

  Bản chất: Function "nhớ" scope nơi nó được sinh ra!
```

```javascript
// CLOSURE CƠ BẢN:
function outer() {
  var count = 0; // Biến local của outer
  return function inner() {
    count++; // ← Truy cập biến từ outer scope!
    console.log(count);
  };
}

var counter = outer(); // outer() đã return, nhưng count VẪN SỐNG!
counter(); // 1
counter(); // 2
counter(); // 3
// → count KHÔNG bị hủy vì inner() vẫn tham chiếu đến nó!
```

```
TẠI SAO CLOSURE HOẠT ĐỘNG:
═══════════════════════════════════════════════════════════════

  BÌNH THƯỜNG:
  function normal() {
      var x = 10;  // ← Khi normal() return → x bị garbage collect!
  }

  CLOSURE:
  function outer() {
      var x = 10;        // ① outer tạo x
      return function() {
          console.log(x); // ② inner tham chiếu x
      };
  }
  var fn = outer();       // ③ outer return → NẾU BÌNH THƯỜNG x chết
                          // → NHƯNG fn (inner) vẫn hold reference!
                          // → Garbage Collector KHÔNG THỂ dọn x!
  fn(); // 10             // ④ x vẫn sống!

  NGUYÊN LÝ: Lexical Environment của outer() KHÔNG bị hủy
  → Vì inner function (được trả về) vẫn có reference đến nó
  → Trong [[Scope]] chain của inner
```

### 7 Ứng dụng thực tế của Closure

```javascript
// ① MODULE PATTERN — Tạo private variables
var Counter = (function () {
  var count = 0; // ← PRIVATE! Không truy cập từ ngoài!
  return {
    increment() {
      count++;
    },
    decrement() {
      count--;
    },
    getCount() {
      return count;
    },
  };
})();
Counter.increment();
Counter.getCount(); // 1
// Counter.count → undefined! ← Private! ✅

// ② CURRYING — Hàm trả về hàm
function multiply(a) {
  return function (b) {
    return a * b; // ← a được "nhớ" qua closure!
  };
}
var double = multiply(2);
var triple = multiply(3);
double(5); // 10
triple(5); // 15
// → Tạo specialized functions từ general function!

// ③ MEMOIZATION — Cache kết quả
function memoize(fn) {
  var cache = {}; // ← Private cache qua closure!
  return function (...args) {
    var key = JSON.stringify(args);
    if (cache[key]) return cache[key];
    cache[key] = fn.apply(this, args);
    return cache[key];
  };
}
var expensiveCalc = memoize(function (n) {
  console.log("Computing...");
  return n * n;
});
expensiveCalc(5); // "Computing..." → 25
expensiveCalc(5); // 25 (từ cache, không tính lại!)

// ④ DEBOUNCE — Trì hoãn thực thi
function debounce(fn, delay) {
  var timer = null; // ← Closure giữ timer!
  return function (...args) {
    clearTimeout(timer);
    timer = setTimeout(() => fn.apply(this, args), delay);
  };
}
// Mỗi lần gọi → reset timer → chỉ thực thi SAU delay ms!

// ⑤ THROTTLE — Giới hạn tần suất
function throttle(fn, limit) {
  var inThrottle = false; // ← Closure giữ flag!
  return function (...args) {
    if (!inThrottle) {
      fn.apply(this, args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}

// ⑥ EVENT HANDLER với context
function setupButton(name) {
  var clickCount = 0; // ← Mỗi button có counter RIÊNG!
  document.getElementById(name).addEventListener("click", function () {
    clickCount++;
    console.log(`${name} clicked ${clickCount} times`);
  });
}
setupButton("btn1"); // btn1 có clickCount riêng
setupButton("btn2"); // btn2 có clickCount RIÊNG (closure khác!)

// ⑦ IIFE + CLOSURE — Fix classic for-loop problem
for (var i = 0; i < 5; i++) {
  (function (j) {
    // ← IIFE tạo closure cho mỗi iteration!
    setTimeout(function () {
      console.log(j); // 0, 1, 2, 3, 4 ✅
    }, j * 100);
  })(i);
}
// Hoặc đơn giản hơn: dùng let!
for (let i = 0; i < 5; i++) {
  setTimeout(() => console.log(i), i * 100); // 0,1,2,3,4 ✅
}
```

---

## §6. Stack Overflow & Memory Leak

### Stack Overflow (Tràn ngăn xếp)

```javascript
// STACK OVERFLOW — Đệ quy không có điểm dừng:
function infinite() {
  infinite(); // ← Mỗi lần gọi → push EC lên stack
} //    Không bao giờ pop → TRÀN! 💀
infinite(); // ❌ RangeError: Maximum call stack size exceeded

// Stack size giới hạn: ~10,000 - 25,000 frames (tùy browser)
```

```
NGUYÊN LÝ STACK OVERFLOW:
═══════════════════════════════════════════════════════════════

  Call Stack có KÍCH THƯỚC GIỚI HẠN!
  ┌──────────┐
  │ infinite │ ← Frame 10001 → ❌ TRÀN!
  ├──────────┤
  │ infinite │ ← Frame 10000
  ├──────────┤
  │   ...    │ ← 9999 frames khác
  ├──────────┤
  │ infinite │ ← Frame 1
  ├──────────┤
  │  Global  │
  └──────────┘

  CÁCH PHÒNG TRÁNH:
  ① Luôn có BASE CASE trong đệ quy!
  ② Dùng Tail Call Optimization (TCO) — ES6 (Safari only)
  ③ Chuyển đệ quy thành iteration (vòng lặp)
  ④ Dùng trampoline pattern
```

```javascript
// CÁCH SỬA — Tail Call Optimization:
// ❌ SAI: Tích lũy stack
function factorial(n) {
  if (n <= 1) return 1;
  return n * factorial(n - 1); // ← Phải giữ frame để nhân!
}

// ✅ ĐÚNG: Tail call (kết quả mang trong accumulator)
function factorial(n, acc = 1) {
  if (n <= 1) return acc;
  return factorial(n - 1, n * acc); // ← Tail position! Reuse frame!
}

// ✅ TRAMPOLINE — Chuyển đệ quy thành loop:
function trampoline(fn) {
  return function (...args) {
    let result = fn(...args);
    while (typeof result === "function") {
      result = result(); // Gọi cho đến khi không còn là function
    }
    return result;
  };
}
var safeFactorial = trampoline(function fact(n, acc = 1) {
  if (n <= 1) return acc;
  return () => fact(n - 1, n * acc); // Return FUNCTION, không gọi!
});
safeFactorial(100000); // OK! Không tràn! ✅
```

### Memory Leak (Rò rỉ bộ nhớ)

```javascript
// 4 NGUYÊN NHÂN PHỔ BIẾN:

// ① GLOBAL VARIABLES — Quên var/let/const:
function leak() {
  leaked = "oops"; // ← Không có var → tạo GLOBAL! 💀
}
// leaked sẽ KHÔNG BAO GIỜ bị garbage collect!
// FIX: 'use strict' → ReferenceError nếu quên khai báo!

// ② CLOSURES — Giữ reference không cần thiết:
function createLeak() {
  var hugeData = new Array(1000000).fill("x"); // 1 triệu phần tử
  return function () {
    // Chỉ cần 1 phần tử, nhưng TOÀN BỘ hugeData bị giữ! 💀
    console.log(hugeData[0]);
  };
}
var leak = createLeak(); // hugeData SỐNG MÃI qua closure!
// FIX: Chỉ trữ giá trị cần thiết:
function noLeak() {
  var hugeData = new Array(1000000).fill("x");
  var needed = hugeData[0]; // Chỉ lấy cái cần!
  hugeData = null; // Giải phóng! ✅
  return function () {
    console.log(needed);
  };
}

// ③ DOM REFERENCES — Xóa DOM nhưng còn reference:
var elements = {
  button: document.getElementById("myBtn"),
};
document.body.removeChild(document.getElementById("myBtn"));
// DOM node đã xóa, nhưng elements.button VẪN GIỮ reference! 💀
// FIX: elements.button = null; ✅

// ④ TIMERS & EVENT LISTENERS — Quên clear:
var timer = setInterval(() => {
  var node = document.getElementById("data");
  if (node) node.innerHTML = getData();
  // Nếu node bị xóa → timer VẪN CHẠY → leak! 💀
}, 1000);
// FIX: clearInterval(timer) khi không cần! ✅
// FIX: element.removeEventListener() khi component unmount!
```

```
PHÁT HIỆN MEMORY LEAK:
═══════════════════════════════════════════════════════════════

  ① Chrome DevTools → Memory tab → Heap Snapshot
     → Chụp 2 snapshot → so sánh → tìm objects tăng lên

  ② Performance Monitor → JS Heap Size
     → Nếu liên tục tăng → LEAK!

  ③ performance.memory (Chrome only):
     console.log(performance.memory.usedJSHeapSize);

  DẤU HIỆU LEAK:
  → App ngày càng CHẬM dần
  → Memory usage tăng liên tục, không giảm sau GC
  → Tab crash: "Aw, Snap!" (Chrome)
```

---

## §7. Async trong vòng lặp

```
VẤN ĐỀ KINH ĐIỂN: for + var + setTimeout
═══════════════════════════════════════════════════════════════

  for (var i = 0; i < 5; i++) {
      setTimeout(function() {
          console.log(i);
      }, i * 100);
  }

  KẾT QUẢ: 5, 5, 5, 5, 5 ← TẤT CẢ LÀ 5! 💀

  TẠI SAO:
  → var i là FUNCTION SCOPE → chỉ có 1 biến i!
  → setTimeout callback chạy SAU khi loop xong
  → Khi loop xong → i = 5
  → Tất cả callbacks đều tham chiếu CÙNG 1 i = 5!
```

```javascript
// 5 CÁCH FIX:

// ① IIFE — Tạo scope mới cho mỗi iteration:
for (var i = 0; i < 5; i++) {
  (function (j) {
    setTimeout(function () {
      console.log(j); // 0, 1, 2, 3, 4 ✅
    }, j * 100);
  })(i); // ← Truyền i vào IIFE → j là bản sao RIÊNG!
}

// ② LET — Block scope tạo biến mới mỗi vòng:
for (let i = 0; i < 5; i++) {
  setTimeout(function () {
    console.log(i); // 0, 1, 2, 3, 4 ✅
  }, i * 100);
}
// let tạo BINDING MỚI cho mỗi iteration!
// → Mỗi callback closure khác nhau, tham chiếu i khác nhau

// ③ setTimeout tham số thứ 3:
for (var i = 0; i < 5; i++) {
  setTimeout(
    function (j) {
      console.log(j); // 0, 1, 2, 3, 4 ✅
    },
    i * 100,
    i,
  ); // ← i truyền làm argument thứ 3 → callback nhận j
}

// ④ PROMISE + ASYNC/AWAIT — Tuần tự:
async function sequential() {
  for (let i = 0; i < 5; i++) {
    await new Promise((resolve) => {
      setTimeout(() => {
        console.log(i); // 0, 1, 2, 3, 4 (theo thứ tự!)
        resolve();
      }, 100);
    });
  }
}

// ⑤ PROMISE.ALL — Song song:
async function parallel() {
  const promises = [];
  for (let i = 0; i < 5; i++) {
    promises.push(
      new Promise((resolve) => {
        setTimeout(() => {
          console.log(i);
          resolve(i);
        }, i * 100);
      }),
    );
  }
  await Promise.all(promises);
}

// ⑥ FOR...OF + ASYNC — Đọc dữ liệu tuần tự:
async function fetchAll(urls) {
  for (const url of urls) {
    const data = await fetch(url); // Tuần tự, từng cái một
    console.log(await data.json());
  }
}

// ⑦ FOR AWAIT...OF — Async Iterator:
async function* asyncGenerator() {
  for (let i = 0; i < 5; i++) {
    yield await new Promise((r) => setTimeout(() => r(i), 100));
  }
}
for await (const val of asyncGenerator()) {
  console.log(val); // 0, 1, 2, 3, 4 ✅
}
```

---

## §8. Module Systems — 4 Chuẩn

```
TẠI SAO CẦN MODULE:
═══════════════════════════════════════════════════════════════

  THỜI XƯA (không module):
  → Tất cả code trong 1 file hoặc <script> tags
  → Biến GLOBAL → xung đột tên! 💀
  → Không biết phụ thuộc file nào load trước file nào
  → Không reuse code giữa các project

  MODULE GIẢI QUYẾT:
  ① Namespace — tránh xung đột biến
  ② Encapsulation — ẩn implementation, chỉ lộ API
  ③ Dependency Management — biết rõ file nào cần file nào
  ④ Reusability — import/export logic dùng lại
```

### 8a. CommonJS (CJS) — Node.js

```javascript
// ① CommonJS — Dùng trong Node.js
// math.js
var PI = 3.14159;
function add(a, b) {
  return a + b;
}
module.exports = { PI, add };
// HOẶC: exports.PI = PI; exports.add = add;

// app.js
var math = require("./math"); // ← ĐỒNG BỘ! Block execution!
console.log(math.PI); // 3.14159
console.log(math.add(1, 2)); // 3

// ĐẶC ĐIỂM:
// → LOAD ĐỒNG BỘ (chỉ phù hợp server — file system nhanh!)
// → Module được CACHE sau lần require đầu tiên
// → require() trả về COPY (value) của exports → shallow copy!
// → Hoạt động runtime (dynamic import)
```

```
COMMONJS — NGUYÊN LÝ BÊN DƯỚI:
═══════════════════════════════════════════════════════════════

  Node.js bọc mỗi file trong 1 function:

  (function(exports, require, module, __filename, __dirname) {
      // CODE CỦA BẠN Ở ĐÂY
      var PI = 3.14;
      module.exports = { PI };
  });

  → Tạo function scope cho mỗi file!
  → exports, require, module: được inject vào
  → __filename, __dirname: path của file hiện tại
  → Đây là lý do biến trong file KHÔNG leak ra global!
```

### 8b. AMD (Asynchronous Module Definition) — Browser

```javascript
// ② AMD — require.js — Load BẤT ĐỒNG BỘ cho browser!
// math.js
define("math", [], function () {
  var PI = 3.14159;
  function add(a, b) {
    return a + b;
  }
  return { PI, add };
});

// app.js
require(["math"], function (math) {
  console.log(math.PI);
  // Code chạy SAU KHI math.js load xong!
});

// ĐẶC ĐIỂM:
// → LOAD BẤT ĐỒNG BỘ (phù hợp browser — network chậm!)
// → Dependencies khai báo trước, load song song
// → Callback chạy sau khi TẤT CẢ dependencies load xong
// → Cú pháp verbose → ít dùng hiện nay
```

### 8c. UMD (Universal Module Definition)

```javascript
// ③ UMD — Chạy cả CommonJS + AMD + Browser global!
(function (root, factory) {
  if (typeof define === "function" && define.amd) {
    // AMD
    define(["dependency"], factory);
  } else if (typeof module === "object" && module.exports) {
    // CommonJS
    module.exports = factory(require("dependency"));
  } else {
    // Browser global
    root.MyModule = factory(root.Dependency);
  }
})(typeof self !== "undefined" ? self : this, function (Dependency) {
  // Module code
  return {
    /* exports */
  };
});

// ĐẶC ĐIỂM:
// → Tương thích MỌI môi trường!
// → Dùng cho thư viện (library) cần phân phối rộng
// → Cú pháp boilerplate nhiều!
```

### 8d. ES Modules (ESM) — Chuẩn chính thức! ⭐

```javascript
// ④ ES Modules — Chuẩn ECMAScript! Tương lai! ⭐
// math.js
export const PI = 3.14159;
export function add(a, b) {
  return a + b;
}
export default class Calculator {
  /* ... */
}

// app.js
import Calculator, { PI, add } from "./math.js";
import * as math from "./math.js"; // Import tất cả
console.log(PI); // 3.14159
console.log(add(1, 2)); // 3

// Dynamic import (lazy loading):
const module = await import("./heavy-module.js"); // Load khi cần!
```

```
BẢNG SO SÁNH 4 MODULE SYSTEMS:
═══════════════════════════════════════════════════════════════

  ┌──────────────┬────────────┬──────────┬──────────┬──────────┐
  │              │ CommonJS   │ AMD      │ UMD      │ ESM ⭐    │
  ├──────────────┼────────────┼──────────┼──────────┼──────────┤
  │ Môi trường   │ Node.js    │ Browser  │ Cả 2     │ Cả 2     │
  │ Load         │ Đồng bộ   │ Bất đồng │ Tùy      │ Bất đồng │
  │ Phân tích    │ Runtime    │ Runtime  │ Runtime  │ COMPILE! │
  │ Import       │ require()  │ require()│ Tùy      │ import   │
  │ Export       │ module.exp │ return   │ Tùy      │ export   │
  │ Copy/Ref     │ Copy (val) │ Copy     │ Tùy      │ REFERENCE│
  │ Tree Shaking │ ❌         │ ❌       │ ❌       │ ✅       │
  │ Trạng thái   │ Đang dùng │ Ít dùng  │ Thư viện │ TƯƠNG LAI│
  └──────────────┴────────────┴──────────┴──────────┴──────────┘

  ESM vs CJS — KHÁC BIỆT QUAN TRỌNG:

  ① ESM là STATIC: import/export phải ở top-level
     → Compiler phân tích được → TREE SHAKING! (loại bỏ dead code)
     CJS là DYNAMIC: require() gọi ở đâu cũng được
     → Không tree shaking vì không biết trước

  ② ESM trả về REFERENCE (live binding):
     → Export thay đổi → import cũng thấy thay đổi!
     CJS trả về VALUE COPY (shallow):
     → Export thay đổi sau → import KHÔNG thấy!

  ③ ESM: this = undefined ở top level
     CJS: this = module.exports
```

```javascript
// ESM LIVE BINDING vs CJS VALUE COPY:

// ==== CommonJS ====
// counter.js
var count = 0;
function increment() {
  count++;
}
module.exports = { count, increment };

// app.js
var { count, increment } = require("./counter");
console.log(count); // 0
increment();
console.log(count); // 0 ← KHÔNG ĐỔI! Copy giá trị! 💀

// ==== ES Modules ====
// counter.mjs
export let count = 0;
export function increment() {
  count++;
}

// app.mjs
import { count, increment } from "./counter.mjs";
console.log(count); // 0
increment();
console.log(count); // 1 ← ĐỔI! Live binding! ✅
```

---

## §9. Tổng kết & Checklist phỏng vấn

```
MIND MAP SCOPE & CLOSURE:
═══════════════════════════════════════════════════════════════

  Scope & Closure
  ├── Lexical Scope: xác định lúc viết code, không phải lúc gọi
  ├── 3 Scope: Global, Function (var), Block (let/const)
  ├── Scope Chain: trong → ngoài, lexical environment link
  ├── EC Stack: creation (hoisting) → execution, Call Stack LIFO
  ├── this: 5 rules (new > explicit > implicit > default > arrow)
  ├── Closure: function + lexical env, 7 ứng dụng
  ├── Stack Overflow: đệ quy không dừng, fix bằng TCO/trampoline
  ├── Memory Leak: 4 nguyên nhân (global, closure, DOM ref, timer)
  ├── Async Loop: var+setTimeout=5555, fix bằng let/IIFE/arg
  └── Modules: CJS (sync, copy) → AMD → UMD → ESM (async, ref, tree)
```

### Checklist

- [ ] **Lexical vs Dynamic scope**: JS dùng lexical (nơi khai báo xác định scope), nhưng this giống dynamic (nơi gọi)
- [ ] **3 scope**: Global, Function (var), Block (let/const ES6+)
- [ ] **Hoisting**: var → undefined, function → toàn bộ, let/const → TDZ (ReferenceError)
- [ ] **Scope chain**: inner → outer → global, tìm biến từ trong ra ngoài
- [ ] **Execution Context**: Variable Environment (var, func) + Lexical Environment (let/const) + this binding
- [ ] **EC Stack (Call Stack)**: LIFO, push khi gọi function, pop khi return
- [ ] **2 giai đoạn EC**: Creation (hoisting) → Execution (gán giá trị, chạy code)
- [ ] **Stack trace**: đọc từ trên xuống = nơi lỗi xảy ra, đọc từ dưới lên = thứ tự gọi
- [ ] **this 5 quy tắc**: new > call/apply/bind > obj.method > standalone > arrow (lexical)
- [ ] **Arrow function this**: KHÔNG có this riêng, kế thừa từ outer scope, call/bind KHÔNG ảnh hưởng
- [ ] **this mất context**: gán method vào biến, callback, setTimeout → fix bằng bind/arrow
- [ ] **Closure**: function "nhớ" scope nơi khai báo, biến outer KHÔNG bị GC dù function đã return
- [ ] **7 closure apps**: module pattern, currying, memoization, debounce, throttle, event handler, IIFE loop fix
- [ ] **Stack overflow**: đệ quy không base case, ~10K-25K frames, fix bằng iteration/TCO/trampoline
- [ ] **4 memory leak**: global vars, closure giữ ref thừa, cached DOM refs, timers/listeners chưa clear
- [ ] **Phát hiện leak**: DevTools Memory tab, Heap Snapshot diff, performance.memory
- [ ] **for+var+setTimeout**: tất cả = giá trị cuối, fix bằng let (block scope) / IIFE / setTimeout arg3
- [ ] **async/await loop**: `for...of` + await (tuần tự), `Promise.all` + map (song song)
- [ ] **CommonJS**: `require()`, đồng bộ, trả về VALUE COPY, dùng cho Node.js
- [ ] **ESM**: `import/export`, bất đồng bộ, trả về LIVE REFERENCE, tree shaking, chuẩn chính thức ⭐
- [ ] **ESM vs CJS quan trọng**: ESM static → tree shaking, CJS dynamic → no tree shaking; ESM live binding, CJS value copy

---

_Nguồn: ConardLi — "Scope & Closure" · Juejin_
_Cập nhật lần cuối: Tháng 2, 2026_
