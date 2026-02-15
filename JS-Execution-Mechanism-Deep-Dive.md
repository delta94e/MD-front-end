# Phân Tích Chuyên Sâu Cơ Chế Thực Thi JavaScript — Từ Code Đến Kết Quả

> Hệ thống hóa cơ chế thực thi JavaScript trong V8: Execution Context, Variable Environment vs Lexical Environment, Compilation Phase vs Execution Phase, Hoisting, và Memory Allocation.
> Độ khó: ⭐️⭐️⭐️ | Thời gian đọc: ~18 phút

---

## Mục Lục

1. [Mô Hình Cốt Lõi — Compile Trước, Execute Sau](#1-mô-hình-cốt-lõi--compile-trước-execute-sau)
2. [Execution Context — Gói Môi Trường Runtime](#2-execution-context--gói-môi-trường-runtime)
3. [Compilation Phase — Tạo Và Nạp Execution Context](#3-compilation-phase--tạo-và-nạp-execution-context)
4. [Execution Phase — Thực Thi Từng Dòng](#4-execution-phase--thực-thi-từng-dòng)
5. [Variable Environment vs Lexical Environment](#5-variable-environment-vs-lexical-environment)
6. [Function Declaration vs Function Expression](#6-function-declaration-vs-function-expression)
7. [Memory — Stack vs Heap](#7-memory--stack-vs-heap)
8. [Tổng Kết](#8-tổng-kết)
9. [Câu Hỏi Phỏng Vấn](#9-câu-hỏi-phỏng-vấn)

---

## 1. Mô Hình Cốt Lõi — Compile Trước, Execute Sau

```
V8 XỬ LÝ JAVASCRIPT NHƯ THẾ NÀO?
═══════════════════════════════════════════════════════════════

  Khác với C++/Java cần compile tường minh,
  JavaScript "compile" NGAY TRƯỚC KHI execute:

  ┌──────────────────────────────────────────────────────────┐
  │                                                          │
  │  Source Code                                             │
  │      │                                                   │
  │      ▼                                                   │
  │  ┌─────────────────────┐                                │
  │  │  COMPILATION PHASE  │  ← Xảy ra TRƯỚC execution     │
  │  │  (Tạo & nạp         │                                │
  │  │   Execution Context)│                                │
  │  └──────────┬──────────┘                                │
  │             │                                            │
  │             ▼                                            │
  │  ┌─────────────────────┐                                │
  │  │  EXECUTION PHASE    │  ← Thực thi từng dòng         │
  │  │  (Chạy executable   │                                │
  │  │   code line by line)│                                │
  │  └─────────────────────┘                                │
  │                                                          │
  │  ⚠️ Mô hình này áp dụng trên CƠ SỞ TỪNG FUNCTION:     │
  │  → Global code: compile → execute                       │
  │  → Gọi function A: compile A → execute A                │
  │  → Trong A gọi B: compile B → execute B                 │
  │  → Mỗi function = 1 vòng "compile → execute" riêng     │
  │                                                          │
  └──────────────────────────────────────────────────────────┘

═══════════════════════════════════════════════════════════════
```

---

## 2. Execution Context — Gói Môi Trường Runtime

```
EXECUTION CONTEXT LÀ GÌ?
═══════════════════════════════════════════════════════════════

  = "Gói môi trường" chứa TẤT CẢ thông tin cần thiết
  để thực thi một đoạn code.

  2 LOẠI CHÍNH:
  ┌──────────────────────────────────────────────────────────┐
  │                                                          │
  │  ① Global Execution Context:                             │
  │     → Tạo TRƯỚC KHI code bắt đầu chạy                  │
  │     → Mỗi chương trình CHỈ CÓ 1                        │
  │     → Luôn ở ĐÁY call stack                             │
  │                                                          │
  │  ② Function Execution Context:                           │
  │     → Tạo MỖI LẦN function được gọi                     │
  │     → Function gọi N lần = N contexts khác nhau         │
  │     → Bao gồm cả formal/actual parameter binding       │
  │                                                          │
  └──────────────────────────────────────────────────────────┘

  CẤU TRÚC BÊN TRONG:
  ┌──────────────────────────────────────────────────────────┐
  │                                                          │
  │  Execution Context = {                                   │
  │    ┌──────────────────────────────────────────────────┐ │
  │    │  Variable Environment                            │ │
  │    │  → Lưu var + function declarations               │ │
  │    │  → Initialize: var = undefined, func = full body │ │
  │    └──────────────────────────────────────────────────┘ │
  │    ┌──────────────────────────────────────────────────┐ │
  │    │  Lexical Environment                             │ │
  │    │  → Lưu let + const declarations                  │ │
  │    │  → KHÔNG initialize → Temporal Dead Zone (TDZ)   │ │
  │    └──────────────────────────────────────────────────┘ │
  │    ┌──────────────────────────────────────────────────┐ │
  │    │  Executable Code                                 │ │
  │    │  → Code đã compile, bỏ declarations              │ │
  │    │  → Sẵn sàng execute line by line                 │ │
  │    └──────────────────────────────────────────────────┘ │
  │  }                                                       │
  │                                                          │
  └──────────────────────────────────────────────────────────┘

  CALL STACK — QUẢN LÝ EXECUTION CONTEXTS:
  ┌──────────────────────────────────────────────────────────┐
  │                                                          │
  │  Nguyên tắc: LIFO (Last-In, First-Out)                  │
  │                                                          │
  │  ┌──────────────┐                                       │
  │  │ fn B context │ ← TOP (đang thực thi)                │
  │  ├──────────────┤                                       │
  │  │ fn A context │ ← Đang chờ B xong                    │
  │  ├──────────────┤                                       │
  │  │ Global ctx   │ ← Luôn ở đáy                         │
  │  └──────────────┘                                       │
  │                                                          │
  │  Flow:                                                   │
  │  ① Global code bắt đầu → push Global context            │
  │  ② Gặp gọi function A → push A context                  │
  │  ③ Trong A, gọi B → push B context                      │
  │  ④ B xong → pop B context, trở lại A                    │
  │  ⑤ A xong → pop A context, trở lại Global               │
  │                                                          │
  └──────────────────────────────────────────────────────────┘

═══════════════════════════════════════════════════════════════
```

---

## 3. Compilation Phase — Tạo Và Nạp Execution Context

```
QUY TRÌNH COMPILATION PHASE:
═══════════════════════════════════════════════════════════════

  Khi V8 chuẩn bị execute 1 đoạn code:

  BƯỚC 1: Tạo Execution Context TRỐNG
  ┌──────────────────────────────────────────────────────────┐
  │  ExecutionContext = {                                    │
  │    variableEnvironment: {},                              │
  │    lexicalEnvironment: {},                               │
  │    executableCode: null                                  │
  │  }                                                       │
  └──────────────────────────────────────────────────────────┘

  BƯỚC 2: Scan & Hoist (Hoisting)
  ┌──────────────────────────────────────────────────────────┐
  │                                                          │
  │  Quét code, xử lý DECLARATIONS (không phải assignments):│
  │                                                          │
  │  ┌────────────────────┬──────────────────────────────┐  │
  │  │ Loại declaration   │ Xử lý                         │  │
  │  ├────────────────────┼──────────────────────────────┤  │
  │  │ var myName         │ variableEnv: { myName:       │  │
  │  │                    │   undefined }                 │  │
  │  ├────────────────────┼──────────────────────────────┤  │
  │  │ function foo() {}  │ variableEnv: { foo:          │  │
  │  │                    │   function() {...} }          │  │
  │  │                    │ ⭐ LƯU TOÀN BỘ function body│  │
  │  │                    │ ⭐ ƯU TIÊN CAO NHẤT         │  │
  │  ├────────────────────┼──────────────────────────────┤  │
  │  │ let hero           │ lexicalEnv: { hero:          │  │
  │  │                    │   <uninitialized> }           │  │
  │  │                    │ ⚠️ KHÔNG initialize          │  │
  │  │                    │ → Temporal Dead Zone!         │  │
  │  ├────────────────────┼──────────────────────────────┤  │
  │  │ const PI           │ lexicalEnv: { PI:            │  │
  │  │                    │   <uninitialized> }           │  │
  │  │                    │ ⚠️ Giống let                  │  │
  │  └────────────────────┴──────────────────────────────┘  │
  │                                                          │
  │  THỨ TỰ ƯU TIÊN KHI TRÙNG TÊN:                         │
  │  function declaration > var > formal parameters         │
  │                                                          │
  └──────────────────────────────────────────────────────────┘

  BƯỚC 3 (chỉ cho function): Bind formal ↔ actual params
  ┌──────────────────────────────────────────────────────────┐
  │  function fn(a) { ... }                                  │
  │  fn(3);                                                  │
  │                                                          │
  │  → variableEnv: { a: 3 }                                │
  │  → Gán giá trị actual param vào formal param            │
  └──────────────────────────────────────────────────────────┘

  BƯỚC 4: Tạo executable code
  ┌──────────────────────────────────────────────────────────┐
  │  → Loại bỏ tất cả declaration statements                │
  │  → Chỉ giữ assignments + function calls + expressions  │
  │  → Code này sẵn sàng execute line by line               │
  └──────────────────────────────────────────────────────────┘

═══════════════════════════════════════════════════════════════
```

### Case 1 — Compile Global Context

```javascript
// File 1.js
showName();
console.log(myName);
console.log(hero);
var myName = "lcx";
let hero = "钢铁侠";
function showName() {
  console.log("函数showName被执行");
}
```

```
COMPILATION PHASE — GLOBAL CONTEXT:
═══════════════════════════════════════════════════════════════

  ① Variable Environment:
  ┌───────────────────────────────────────────┐
  │  myName  :  undefined                     │  ← var hoisted
  │  showName:  function() { console.log(..) }│  ← full body!
  └───────────────────────────────────────────┘

  ② Lexical Environment:
  ┌───────────────────────────────────────────┐
  │  hero  :  <uninitialized>                 │  ← TDZ ⚠️
  └───────────────────────────────────────────┘

  ③ Executable Code (loại bỏ declarations):
  ┌───────────────────────────────────────────┐
  │  showName();                              │
  │  console.log(myName);                     │
  │  console.log(hero);                       │
  │  myName = 'lcx';                          │
  │  hero = '钢铁侠';                          │
  └───────────────────────────────────────────┘

═══════════════════════════════════════════════════════════════
```

### Case 2 — Compile Function Context (Trùng Tên)

```javascript
function fn(a) {
  // gọi fn(3)
  console.log(a);
  var a = 2;
  function a() {}
  var b = a;
  console.log(a);
}
```

```
COMPILATION PHASE — fn(3) CONTEXT:
═══════════════════════════════════════════════════════════════

  Quá trình scan tuần tự:

  BƯỚC 1: formal param a → { a: 3 }
  BƯỚC 2: var a → a ĐÃ TỒN TẠI, var cho phép redeclare
           → KHÔNG thay đổi giá trị → { a: 3 }
  BƯỚC 3: var b → { a: 3, b: undefined }
  BƯỚC 4: function a() {} → ⭐ GHI ĐÈ a!
           → { a: function(){}, b: undefined }

  KẾT QUẢ:
  ┌───────────────────────────────────────────┐
  │  Variable Environment:                    │
  │    a  :  function() {}   ← function thắng│
  │    b  :  undefined                        │
  │                                           │
  │  Lexical Environment: (trống)             │
  │                                           │
  │  Executable Code:                         │
  │    console.log(a);   → function(){}      │
  │    a = 2;            → a trở thành 2      │
  │    b = a;            → b = 2              │
  │    console.log(a);   → 2                  │
  └───────────────────────────────────────────┘

  THỨ TỰ ƯU TIÊN HOISTING:
  ┌──────────────────────────────────────────────────────────┐
  │                                                          │
  │  function declaration  >  formal parameters  >  var     │
  │  (ghi đè tất cả)       (giá trị initial)     (chỉ tạo │
  │                                                nếu chưa│
  │                                                tồn tại)│
  │                                                          │
  └──────────────────────────────────────────────────────────┘

═══════════════════════════════════════════════════════════════
```

---

## 4. Execution Phase — Thực Thi Từng Dòng

```
QUY TẮC EXECUTION PHASE:
═══════════════════════════════════════════════════════════════

  ① TRUY CẬP BIẾN — THỨ TỰ TÌM KIẾM:
  ┌──────────────────────────────────────────────────────────┐
  │                                                          │
  │  Tìm trong context HIỆN TẠI:                             │
  │  Lexical Environment → Variable Environment              │
  │                                                          │
  │  Nếu KHÔNG TÌM THẤY:                                    │
  │  → Đi theo SCOPE CHAIN lên outer scope                  │
  │  → Tiếp tục tìm kiếm                                    │
  │  → Cho đến Global context                                │
  │  → Vẫn không thấy → ReferenceError                      │
  │                                                          │
  └──────────────────────────────────────────────────────────┘

  ② GÁN GIÁ TRỊ:
  → Thay đổi giá trị trong environment tương ứng

  ③ GỌI FUNCTION:
  → Tạo Function Execution Context MỚI
  → Push vào call stack
  → Lặp lại "compile → execute"
  → Xong → Pop khỏi call stack

═══════════════════════════════════════════════════════════════
```

### Case 1 — Execute Global Code

```
EXECUTION PHASE — 1.js:
═══════════════════════════════════════════════════════════════

  Executable Code       │ Hành động              │ Output
  ══════════════════════╪════════════════════════╪═══════════
  showName();           │ Tìm trong varEnv       │ "函数showName
                        │ → có function body     │  被执行"
                        │ → gọi function         │
                        │ → tạo fn context mới   │
                        │ → execute → pop        │
  ──────────────────────┼────────────────────────┼───────────
  console.log(myName);  │ Tìm trong varEnv       │ undefined
                        │ → myName = undefined   │
  ──────────────────────┼────────────────────────┼───────────
  console.log(hero);    │ Tìm trong lexEnv       │ ❌
                        │ → hero = <uninit>      │ Reference
                        │ → TRONG TDZ!           │ Error!
                        │ → ⛔ DỪNG CHƯƠNG TRÌNH │
  ──────────────────────┼────────────────────────┼───────────
  myName = 'lcx';       │ (Không đến được nếu   │
  hero = '钢铁侠';       │  hero throw error)     │

═══════════════════════════════════════════════════════════════
```

### Case 2 — Execute fn(3)

```
EXECUTION PHASE — fn(3):
═══════════════════════════════════════════════════════════════

  Trạng thái ban đầu:
  varEnv = { a: function(){}, b: undefined }

  Executable Code       │ Hành động              │ Output
  ══════════════════════╪════════════════════════╪═══════════
  console.log(a);       │ a = function(){}       │ ƒ a(){}
  ──────────────────────┼────────────────────────┼───────────
  a = 2;                │ Gán a = 2 trong varEnv │ (no output)
                        │ varEnv = { a:2, b:und }│
  ──────────────────────┼────────────────────────┼───────────
  b = a;                │ a hiện tại = 2         │ (no output)
                        │ Gán b = 2              │
                        │ varEnv = { a:2, b:2 }  │
  ──────────────────────┼────────────────────────┼───────────
  console.log(a);       │ a = 2                  │ 2

═══════════════════════════════════════════════════════════════
```

---

## 5. Variable Environment vs Lexical Environment

```
TẠI SAO CẦN HAI ENVIRONMENT?
═══════════════════════════════════════════════════════════════

  VẤN ĐỀ CỦA var:
  ┌──────────────────────────────────────────────────────────┐
  │                                                          │
  │  ① Hoisting → giá trị undefined trước khi gán           │
  │     console.log(x); // undefined (không error!)         │
  │     var x = 5;                                           │
  │                                                          │
  │  ② KHÔNG có block scope:                                 │
  │     if (true) { var x = 10; }                            │
  │     console.log(x); // 10 → leak ra ngoài block!        │
  │                                                          │
  │  ③ Cho phép redeclare:                                   │
  │     var a = 1;                                           │
  │     var a = 2; // OK, không error → dễ bug              │
  │                                                          │
  └──────────────────────────────────────────────────────────┘

  ES6 GIẢI QUYẾT BẰNG let/const + Lexical Environment:
  ┌──────────────────────────────────────────────────────────┐
  │                                                          │
  │  ┌────────────────────┬────────────────────────────────┐│
  │  │ Variable Env       │ Lexical Env                     ││
  │  ├────────────────────┼────────────────────────────────┤│
  │  │ Lưu: var +         │ Lưu: let + const               ││
  │  │ function decl      │                                 ││
  │  ├────────────────────┼────────────────────────────────┤│
  │  │ Init: undefined    │ Init: <uninitialized>          ││
  │  │ (khi compile)      │ (khi compile)                   ││
  │  ├────────────────────┼────────────────────────────────┤│
  │  │ Scope: function    │ Scope: BLOCK { }               ││
  │  ├────────────────────┼────────────────────────────────┤│
  │  │ Redeclare: ✅ OK   │ Redeclare: ❌ SyntaxError      ││
  │  ├────────────────────┼────────────────────────────────┤│
  │  │ Access trước       │ Access trước                    ││
  │  │ declare: undefined │ declare: ReferenceError (TDZ)  ││
  │  └────────────────────┴────────────────────────────────┘│
  │                                                          │
  └──────────────────────────────────────────────────────────┘

  TEMPORAL DEAD ZONE (TDZ) TRỰC QUAN:
  ┌──────────────────────────────────────────────────────────┐
  │                                                          │
  │  {                                                       │
  │    // ─── TDZ cho hero BẮT ĐẦU ─────────────────       │
  │    console.log(hero); // ❌ ReferenceError               │
  │    // hero tồn tại trong lexEnv nhưng <uninit>          │
  │    // ─── TDZ cho hero KẾT THÚC ────────────────       │
  │    let hero = '钢铁侠';  // ← initialize tại đây       │
  │    console.log(hero); // ✅ '钢铁侠'                    │
  │  }                                                       │
  │                                                          │
  │  So sánh với var:                                        │
  │  {                                                       │
  │    console.log(name); // undefined (hoisted + init)     │
  │    var name = 'lcx';                                     │
  │    console.log(name); // 'lcx'                          │
  │  }                                                       │
  │                                                          │
  └──────────────────────────────────────────────────────────┘

  BLOCK SCOPE VỚI LEXICAL ENVIRONMENT:
  ┌──────────────────────────────────────────────────────────┐
  │                                                          │
  │  function example() {                                    │
  │    var a = 1;                // variableEnv              │
  │    let b = 2;               // lexicalEnv (function)    │
  │                                                          │
  │    {   // Block mới → lexicalEnv MỚI (stacked)          │
  │      let c = 3;             // lexicalEnv (block)       │
  │      var d = 4;             // variableEnv (hoisted!)   │
  │      console.log(a, b, c);  // 1, 2, 3 ✅              │
  │    }                                                     │
  │                                                          │
  │    console.log(a);  // 1 ✅                              │
  │    console.log(b);  // 2 ✅                              │
  │    console.log(c);  // ❌ ReferenceError (block scope)  │
  │    console.log(d);  // 4 ✅ (var = function scope!)     │
  │  }                                                       │
  │                                                          │
  └──────────────────────────────────────────────────────────┘

═══════════════════════════════════════════════════════════════
```

---

## 6. Function Declaration vs Function Expression

```
HAI CÁCH ĐỊNH NGHĨA FUNCTION — HOISTING KHÁC NHAU:
═══════════════════════════════════════════════════════════════

  ① FUNCTION DECLARATION — HOIST TOÀN BỘ:
  ┌──────────────────────────────────────────────────────────┐
  │                                                          │
  │  foo(); // ✅ CHẠY ĐƯỢC — "Hello"                       │
  │                                                          │
  │  function foo() {                                        │
  │    console.log('Hello');                                 │
  │  }                                                       │
  │                                                          │
  │  Compilation: varEnv = { foo: function(){...} }         │
  │  → Cả TÊN lẫn BODY đều available ngay                   │
  │                                                          │
  └──────────────────────────────────────────────────────────┘

  ② FUNCTION EXPRESSION — CHỈ HOIST BIẾN:
  ┌──────────────────────────────────────────────────────────┐
  │                                                          │
  │  bar(); // ❌ TypeError: bar is not a function           │
  │                                                          │
  │  var bar = function() {                                  │
  │    console.log('World');                                 │
  │  };                                                      │
  │                                                          │
  │  Compilation: varEnv = { bar: undefined }               │
  │  → Chỉ hoist BIẾN var bar = undefined                   │
  │  → Assignment = function() {} nằm ở EXECUTION phase    │
  │  → Gọi undefined() → TypeError!                        │
  │                                                          │
  └──────────────────────────────────────────────────────────┘

  ③ LET/CONST + FUNCTION EXPRESSION:
  ┌──────────────────────────────────────────────────────────┐
  │                                                          │
  │  baz(); // ❌ ReferenceError (TDZ!)                      │
  │                                                          │
  │  let baz = () => {                                       │
  │    console.log('Arrow');                                 │
  │  };                                                      │
  │                                                          │
  │  Compilation: lexEnv = { baz: <uninitialized> }         │
  │  → baz trong TDZ → access = ReferenceError              │
  │  → KHÁC TypeError (var) vs ReferenceError (let/const)   │
  │                                                          │
  └──────────────────────────────────────────────────────────┘

  TÓM TẮT:
  ┌────────────────────┬───────────┬──────────────────────┐
  │ Kiểu               │ Hoist     │ Gọi trước declare    │
  ├────────────────────┼───────────┼──────────────────────┤
  │ function foo(){}   │ Toàn bộ   │ ✅ Chạy được         │
  │ var bar = func..   │ var only  │ ❌ TypeError          │
  │ let baz = ()=>..   │ TDZ       │ ❌ ReferenceError    │
  └────────────────────┴───────────┴──────────────────────┘

═══════════════════════════════════════════════════════════════
```

---

## 7. Memory — Stack vs Heap

```
STACK MEMORY VS HEAP MEMORY:
═══════════════════════════════════════════════════════════════

  ① PRIMITIVE TYPES → LƯU TRÊN STACK:
  ┌──────────────────────────────────────────────────────────┐
  │                                                          │
  │  let str = 'hello';                                      │
  │  let str2 = str;      // COPY GIÁ TRỊ (value copy)     │
  │  str2 = '你好';        // Chỉ str2 thay đổi             │
  │  console.log(str);    // 'hello' ← KHÔNG bị ảnh hưởng  │
  │                                                          │
  │  STACK:                                                  │
  │  ┌──────────────────┐                                   │
  │  │ str2 : '你好'     │                                   │
  │  │ str  : 'hello'   │                                   │
  │  │ ...              │                                   │
  │  └──────────────────┘                                   │
  │                                                          │
  │  → Mỗi biến = BẢN SAO ĐỘC LẬP                         │
  │  → Thay đổi 1 → KHÔNG ảnh hưởng cái kia                │
  │                                                          │
  │  Primitive types: String, Number, Boolean,               │
  │  null, undefined, Symbol, BigInt                         │
  │                                                          │
  └──────────────────────────────────────────────────────────┘

  ② REFERENCE TYPES → LƯU TRÊN HEAP:
  ┌──────────────────────────────────────────────────────────┐
  │                                                          │
  │  let arr1 = [1, 2, 3];                                   │
  │  let arr2 = arr1;     // COPY ĐỊA CHỈ (reference copy) │
  │  arr2.push(4);        // Thay đổi QUA ĐỊA CHỈ          │
  │  console.log(arr1);   // [1,2,3,4] ← BỊ ẢNH HƯỞNG!    │
  │                                                          │
  │  STACK:                    HEAP:                         │
  │  ┌──────────────────┐     ┌──────────────────┐          │
  │  │ arr2 : 0x1000 ───┼────►│ [1, 2, 3, 4]     │          │
  │  │ arr1 : 0x1000 ───┼────►│                   │          │
  │  │ ...              │     └──────────────────┘          │
  │  └──────────────────┘                                   │
  │                                                          │
  │  → Cả hai biến trỏ đến CÙNG 1 vùng nhớ heap            │
  │  → Thay đổi qua 1 biến → THẤY QUA biến kia!            │
  │                                                          │
  │  Reference types: Object, Array, Function, Date, etc.   │
  │                                                          │
  └──────────────────────────────────────────────────────────┘

  SO SÁNH:
  ┌──────────────────┬───────────────┬───────────────────┐
  │                  │ Primitive      │ Reference          │
  ├──────────────────┼───────────────┼───────────────────┤
  │ Lưu ở           │ Stack          │ Heap (stack giữ   │
  │                  │                │ địa chỉ)          │
  │ Gán biến         │ Copy VALUE     │ Copy ADDRESS      │
  │ Thay đổi         │ Độc lập        │ Chia sẻ           │
  │ So sánh (===)    │ So giá trị     │ So địa chỉ        │
  │ Kích thước       │ Cố định, nhỏ   │ Động, có thể lớn  │
  └──────────────────┴───────────────┴───────────────────┘

═══════════════════════════════════════════════════════════════
```

---

## 8. Tổng Kết

```
TOÀN BỘ CƠ CHẾ THỰC THI JS:
═══════════════════════════════════════════════════════════════

  ┌──────────────────────────────────────────────────────────┐
  │                                                          │
  │  JavaScript = Single-threaded                            │
  │             + Compile trước, Execute sau                  │
  │             + Call stack quản lý contexts                 │
  │             + Execution context là trung tâm             │
  │                                                          │
  │  FLOW TỔNG QUÁT:                                         │
  │                                                          │
  │  Source Code                                             │
  │      │                                                   │
  │      ▼                                                   │
  │  ┌── COMPILE ────────────────────────────────────────┐  │
  │  │  → Tạo Execution Context                          │  │
  │  │  → var → variableEnv (init: undefined)            │  │
  │  │  → function → variableEnv (init: full body)       │  │
  │  │  → let/const → lexicalEnv (init: <uninit> → TDZ) │  │
  │  │  → Bind formal/actual params                      │  │
  │  │  → Loại bỏ declarations → executable code         │  │
  │  └──────────────────────────────────────────────────┘  │
  │      │                                                   │
  │      ▼                                                   │
  │  ┌── EXECUTE ────────────────────────────────────────┐  │
  │  │  → Thực thi executable code LINE BY LINE         │  │
  │  │  → Truy cập biến: lexEnv → varEnv → scope chain │  │
  │  │  → Gán giá trị: update environment tương ứng     │  │
  │  │  → Gọi function: tạo context MỚI → push stack   │  │
  │  │    → compile → execute → pop stack               │  │
  │  └──────────────────────────────────────────────────┘  │
  │                                                          │
  │  → Mọi hành vi "kỳ lạ" của JS (hoisting, TDZ, scope,   │
  │    closures, this) đều GIẢI THÍCH ĐƯỢC bằng mô hình này│
  │                                                          │
  └──────────────────────────────────────────────────────────┘

═══════════════════════════════════════════════════════════════
```

---

## 9. Câu Hỏi Phỏng Vấn

### Q1: Execution Context là gì? Gồm những thành phần nào?

```
TRẢ LỜI:
┌──────────────────────────────────────────────────────────────┐
│                                                              │
│  Execution Context = "gói môi trường runtime"               │
│  chứa TẤT CẢ thông tin cần thiết để thực thi 1 đoạn code. │
│                                                              │
│  2 loại chính:                                               │
│  ① Global Execution Context (duy nhất, nằm đáy call stack) │
│  ② Function Execution Context (tạo mỗi lần gọi function)   │
│                                                              │
│  3 thành phần:                                               │
│  ① Variable Environment: lưu var + function declarations   │
│  ② Lexical Environment: lưu let/const (block scope, TDZ)   │
│  ③ Executable Code: code đã compile, sẵn sàng execute      │
│                                                              │
│  Quản lý bởi Call Stack (LIFO):                              │
│  → Context mới push lên top → execute → pop khi xong       │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

### Q2: Hoisting hoạt động thế nào? var, let/const, và function khác gì nhau?

```
TRẢ LỜI:
┌──────────────────────────────────────────────────────────────┐
│                                                              │
│  Hoisting xảy ra trong COMPILATION PHASE:                    │
│                                                              │
│  ┌────────────────────┬──────────────────────────────────┐  │
│  │ var                │ Hoist + init undefined            │  │
│  │                    │ → Access trước = undefined        │  │
│  ├────────────────────┼──────────────────────────────────┤  │
│  │ function decl      │ Hoist + init TOÀN BỘ body       │  │
│  │                    │ → Gọi trước = CHẠY ĐƯỢC          │  │
│  ├────────────────────┼──────────────────────────────────┤  │
│  │ let / const        │ Hoist nhưng KHÔNG init           │  │
│  │                    │ → Access trước = ReferenceError  │  │
│  │                    │ → Temporal Dead Zone (TDZ)        │  │
│  └────────────────────┴──────────────────────────────────┘  │
│                                                              │
│  Ưu tiên khi trùng tên:                                     │
│  function declaration > formal params > var                 │
│  (function ghi đè tất cả, var chỉ tạo nếu chưa tồn tại)  │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

### Q3: Temporal Dead Zone (TDZ) là gì? Tại sao cần nó?

```
TRẢ LỜI:
┌──────────────────────────────────────────────────────────────┐
│                                                              │
│  TDZ = khoảng thời gian từ khi block BẮT ĐẦU đến khi      │
│  let/const được INITIALIZE (gặp câu lệnh khai báo).        │
│                                                              │
│  {                                                           │
│    // ─── TDZ BẮT ĐẦU ─────                                │
│    console.log(x); // ❌ ReferenceError                     │
│    // ─── TDZ KẾT THÚC ─────                               │
│    let x = 5;                                                │
│    console.log(x); // ✅ 5                                  │
│  }                                                           │
│                                                              │
│  Cơ chế:                                                     │
│  → Compile phase: let x được LƯU vào lexicalEnv            │
│    nhưng ở trạng thái <uninitialized>                       │
│  → Execute phase: engine THẤY x tồn tại nhưng <uninit>    │
│    → throw ReferenceError                                   │
│  → Khi execute đến "let x = 5" → INITIALIZE x = 5         │
│                                                              │
│  Tại sao cần TDZ?                                            │
│  → Bắt lỗi sớm: access biến trước declare = bug           │
│  → var cho undefined → BỎ QUA lỗi im lặng → nguy hiểm     │
│  → TDZ buộc developer khai báo trước khi dùng              │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

### Q4: Đoạn code sau output gì? Giải thích chi tiết.

```javascript
function fn(a) {
  console.log(a); // ?
  var a = 2;
  function a() {}
  var b = a;
  console.log(a); // ?
  console.log(b); // ?
}
fn(3);
```

```
TRẢ LỜI:
┌──────────────────────────────────────────────────────────────┐
│                                                              │
│  Output:                                                     │
│  ① ƒ a() {}                                                 │
│  ② 2                                                         │
│  ③ 2                                                         │
│                                                              │
│  Giải thích — COMPILATION PHASE:                             │
│  → formal param a = 3           → varEnv: { a: 3 }         │
│  → var a → đã tồn tại, skip    → varEnv: { a: 3 }         │
│  → var b → chưa có              → varEnv: { a:3, b:undef } │
│  → function a() {} → GHI ĐÈ a! → varEnv: { a:ƒ, b:undef }│
│                                                              │
│  EXECUTION PHASE:                                            │
│  → console.log(a) → a = function → ƒ a() {}                │
│  → a = 2 → varEnv: { a:2, b:undefined }                    │
│  → b = a → b = 2 → varEnv: { a:2, b:2 }                   │
│  → console.log(a) → 2                                       │
│  → console.log(b) → 2                                       │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

### Q5: Variable Environment và Lexical Environment khác gì nhau?

```
TRẢ LỜI:
┌──────────────────────────────────────────────────────────────┐
│                                                              │
│  ┌──────────────────┬─────────────────┬──────────────────┐  │
│  │                  │ Variable Env    │ Lexical Env      │  │
│  ├──────────────────┼─────────────────┼──────────────────┤  │
│  │ Lưu trữ          │ var + function  │ let + const      │  │
│  │                  │ declarations    │                  │  │
│  ├──────────────────┼─────────────────┼──────────────────┤  │
│  │ Init khi compile│ var = undefined │ <uninitialized>  │  │
│  │                  │ func = full body│ → TDZ            │  │
│  ├──────────────────┼─────────────────┼──────────────────┤  │
│  │ Scope            │ Function scope  │ Block scope {}   │  │
│  ├──────────────────┼─────────────────┼──────────────────┤  │
│  │ Redeclare        │ ✅ Cho phép     │ ❌ SyntaxError   │  │
│  ├──────────────────┼─────────────────┼──────────────────┤  │
│  │ Access trước     │ undefined       │ ReferenceError   │  │
│  │ declare          │ (silent fail)   │ (loud fail)      │  │
│  └──────────────────┴─────────────────┴──────────────────┘  │
│                                                              │
│  Thiết kế mục đích:                                          │
│  → Variable Env: backward-compatible với ES5 var behavior   │
│  → Lexical Env: ES6+ block scope + TDZ → safer code        │
│                                                              │
│  Lookup order: Lexical Env → Variable Env → Scope Chain     │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

### Q6: Giải thích sự khác biệt primitive vs reference types trong memory?

```
TRẢ LỜI:
┌──────────────────────────────────────────────────────────────┐
│                                                              │
│  PRIMITIVE (Stack):                                          │
│  → Lưu trực tiếp GIÁ TRỊ trên stack                       │
│  → Gán biến = COPY giá trị → bản sao ĐỘC LẬP             │
│  → Thay đổi bản sao → KHÔNG ảnh hưởng gốc                 │
│  → let a = 5; let b = a; b = 10; → a vẫn = 5             │
│                                                              │
│  REFERENCE (Heap):                                           │
│  → Giá trị lưu trên Heap, stack chỉ giữ ĐỊA CHỈ          │
│  → Gán biến = COPY địa chỉ → cùng trỏ đến 1 object       │
│  → Thay đổi qua 1 biến → THẤY qua biến kia!              │
│  → let a = [1]; let b = a; b.push(2); → a = [1,2]         │
│                                                              │
│  Hệ quả thực tế:                                            │
│  → Pass primitive to function = pass by VALUE               │
│  → Pass object to function = pass by REFERENCE (address)    │
│  → Deep clone (structuredClone, JSON hack) để tránh         │
│    mutation không mong muốn                                  │
│  → === so sánh VALUE cho primitive, ADDRESS cho reference    │
│  → {} === {} → false (2 địa chỉ khác nhau!)                │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```
