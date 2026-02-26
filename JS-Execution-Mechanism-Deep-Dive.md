# JavaScript Execution Mechanism — Deep Dive!

> **Từ code đến kết quả: compile → execute!**
> Execution Context, Variable/Lexical Environment, Hoisting, Call Stack!

---

## §1. Mô Hình 2 Pha: Compile Trước, Execute Sau!

```
  JAVASCRIPT EXECUTION MODEL:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  ★ "COMPILE TRƯỚC, EXECUTE SAU!" ★                            │
  │  ★ Thực hiện TỪNG FUNCTION!                                    │
  │                                                              │
  │  Source Code                                                    │
  │       │                                                        │
  │       ▼                                                        │
  │  ┌─────────────────────────────────────┐                      │
  │  │ PHA 1: COMPILATION ★                │                      │
  │  │                                     │                      │
  │  │ → Tạo Execution Context!            │                      │
  │  │ → Scan var → Variable Environment!  │                      │
  │  │ → Scan let/const → Lexical Env!     │                      │
  │  │ → Scan function → Variable Env!     │                      │
  │  │ → Chuẩn bị executable code!         │                      │
  │  └─────────────┬───────────────────────┘                      │
  │                │                                              │
  │                ▼                                              │
  │  ┌─────────────────────────────────────┐                      │
  │  │ PHA 2: EXECUTION ★                  │                      │
  │  │                                     │                      │
  │  │ → Chạy code TỪNG DÒNG!             │                      │
  │  │ → Gán giá trị!                      │                      │
  │  │ → Gọi function → tạo context MỚI!  │                      │
  │  │ → Quản lý bởi CALL STACK!           │                      │
  │  └─────────────────────────────────────┘                      │
  │                                                              │
  │  2 LOẠI EXECUTION CONTEXT:                                      │
  │  ┌──────────────────┬──────────────────────────────────┐    │
  │  │ Loại            │ Mô tả                           │    │
  │  ├──────────────────┼──────────────────────────────────┤    │
  │  │ Global Context    │ Tạo TRƯỚC KHI chạy code! ★      │    │
  │  │                  │ Mỗi chương trình CHỈ 1! ★       │    │
  │  │ Function Context  │ Tạo MỖI LẦN gọi function! ★    │    │
  │  │                  │ Gọi 3 lần → tạo 3 context! ★   │    │
  │  └──────────────────┴──────────────────────────────────┘    │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```

---

## §2. Execution Context — Bên Trong Có Gì?

```
  EXECUTION CONTEXT:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  ┌────────────────────────────────────────────────────┐      │
  │  │ Execution Context                                   │      │
  │  │                                                    │      │
  │  │ ┌──────────────────────────────────────────────┐   │      │
  │  │ │ Variable Environment (var + function!) ★      │   │      │
  │  │ │                                              │   │      │
  │  │ │ → var myName: undefined  (hoisted!) ★        │   │      │
  │  │ │ → function showName: [toàn bộ function!] ★  │   │      │
  │  │ └──────────────────────────────────────────────┘   │      │
  │  │                                                    │      │
  │  │ ┌──────────────────────────────────────────────┐   │      │
  │  │ │ Lexical Environment (let/const!) ★            │   │      │
  │  │ │                                              │   │      │
  │  │ │ → let hero: ⛔ CHƯA KHỞI TẠO! (TDZ!) ★     │   │      │
  │  │ │ → const PI: ⛔ CHƯA KHỞI TẠO! (TDZ!) ★     │   │      │
  │  │ └──────────────────────────────────────────────┘   │      │
  │  │                                                    │      │
  │  │ ┌──────────────────────────────────────────────┐   │      │
  │  │ │ Executable Code ★                             │   │      │
  │  │ │                                              │   │      │
  │  │ │ → Code đã bỏ declarations!                   │   │      │
  │  │ │ → Sẵn sàng chạy từng dòng!                  │   │      │
  │  │ └──────────────────────────────────────────────┘   │      │
  │  └────────────────────────────────────────────────────┘      │
  │                                                              │
  │  Variable Env vs Lexical Env:                                   │
  │  ┌──────────────────┬──────────────────────────────────┐    │
  │  │                  │ Variable Env    │ Lexical Env    │    │
  │  ├──────────────────┼─────────────────┼────────────────┤    │
  │  │ Lưu gì          │ var + function  │ let + const    │    │
  │  │ Init khi compile │ undefined / fn  │ KHÔNG init! ★ │    │
  │  │ Hoisting          │ CÓ (undefined!)│ CÓ nhưng TDZ! │    │
  │  │ Block scope       │ KHÔNG! ❌       │ CÓ! ✅ ★      │    │
  │  │ Re-declare        │ var: OK!        │ let/const: ❌ │    │
  │  └──────────────────┴─────────────────┴────────────────┘    │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```

---

## §3. Compilation — Ví Dụ Chi Tiết!

```javascript
// ═══════════════════════════════════════════════════════════
// VÍ DỤ 1: Global Context!
// ═══════════════════════════════════════════════════════════

// showName();        // ★ Chạy được! (function hoisted!)
// console.log(myName); // ★ undefined! (var hoisted!)
// console.log(hero);   // ★ ReferenceError! (TDZ!) ❌
// var myName = 'JS';
// let hero = 'Iron Man';
// function showName() { console.log('showName!'); }

// ─── PHA COMPILE: ─────────────────────────────────────────
// Variable Environment:
//   myName: undefined          ← var hoisted! ★
//   showName: function() {...} ← function hoisted TOÀN BỘ! ★
//
// Lexical Environment:
//   hero: ⛔ (TDZ!)            ← let KHÔNG init! ★
//
// Executable Code:
//   showName();
//   console.log(myName);
//   console.log(hero);
//   myName = 'JS';
//   hero = 'Iron Man';
// ──────────────────────────────────────────────────────────

// ─── PHA EXECUTE: (từng dòng!) ────────────────────────────
// 1. showName()        → tìm Variable Env → CÓ! → "showName!" ✅
// 2. console.log(myName) → tìm Variable Env → undefined ★
// 3. console.log(hero)   → tìm Lexical Env → TDZ! ❌ ReferenceError!
// 4. myName = 'JS'       → gán giá trị trong Variable Env!
// 5. hero = 'Iron Man'   → init + gán trong Lexical Env!
// ──────────────────────────────────────────────────────────

// ═══════════════════════════════════════════════════════════
// VÍ DỤ 2: Function Context — ĐỘ ƯU TIÊN! ★★★
// ═══════════════════════════════════════════════════════════

function fn(a) {
  // gọi fn(3)
  console.log(a); // ★ Output gì? ★★★
  var a = 2;
  function a() {}
  var b = a;
  console.log(a); // ★ Output gì?
}

// ─── PHA COMPILE (fn execution context): ───────────────────
// Variable Environment:
//   BƯỚC 1: a = 3           ← tham số! (formal param!)
//   BƯỚC 2: var a → đã có a → KHÔNG đổi! (vẫn 3!)
//   BƯỚC 3: var b = undefined
//   BƯỚC 4: function a() {} → GHI ĐÈ a! ★★★
//           → a = function() {} ★ (function > param > var!)
//
// Executable Code:
//   console.log(a); a = 2; b = a; console.log(a);
// ──────────────────────────────────────────────────────────

// ─── PHA EXECUTE: ──────────────────────────────────────────
// 1. console.log(a) → a = function a(){} ★ (từ compile!)
// 2. a = 2           → GHI ĐÈ a thành 2!
// 3. b = a           → b = 2!
// 4. console.log(a) → a = 2 ★
// ──────────────────────────────────────────────────────────
```

```
  ĐỘ ƯU TIÊN HOISTING:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  function declaration > formal parameter > var ★★★            │
  │                                                              │
  │  ① var myVar;        → myVar: undefined                       │
  │  ② parameter a = 3;  → a: 3 (GHI ĐÈ undefined!)             │
  │  ③ function a() {};  → a: fn (GHI ĐÈ 3!) ★★★               │
  │                                                              │
  │  TẠI SAO?                                                       │
  │  → V8 xử lý theo THỨ TỰ: var → param → function! ★        │
  │  → Function declaration là CUỐI CÙNG → THẮNG! ★★★           │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```

---

## §4. Call Stack!

```
  CALL STACK — LIFO (Last In, First Out!):
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  CODE:                                                          │
  │  function multiply(a, b) { return a * b; }                    │
  │  function square(n)   { return multiply(n, n); }              │
  │  function printSquare(n) {                                     │
  │    var result = square(n);                                     │
  │    console.log(result);                                        │
  │  }                                                             │
  │  printSquare(4);                                               │
  │                                                              │
  │  CALL STACK:                                                    │
  │                                                              │
  │  ① Global Context vào stack:                                   │
  │  ┌─────────────────┐                                          │
  │  │ Global Context   │                                          │
  │  └─────────────────┘                                          │
  │                                                              │
  │  ② printSquare(4) → push!                                     │
  │  ┌─────────────────┐                                          │
  │  │ printSquare(4)   │ ← TOP (đang chạy!) ★                   │
  │  ├─────────────────┤                                          │
  │  │ Global Context   │                                          │
  │  └─────────────────┘                                          │
  │                                                              │
  │  ③ square(4) → push!                                          │
  │  ┌─────────────────┐                                          │
  │  │ square(4)        │ ← TOP ★                                 │
  │  ├─────────────────┤                                          │
  │  │ printSquare(4)   │                                          │
  │  ├─────────────────┤                                          │
  │  │ Global Context   │                                          │
  │  └─────────────────┘                                          │
  │                                                              │
  │  ④ multiply(4,4) → push!                                      │
  │  ┌─────────────────┐                                          │
  │  │ multiply(4,4)    │ ← TOP ★                                 │
  │  ├─────────────────┤                                          │
  │  │ square(4)        │                                          │
  │  ├─────────────────┤                                          │
  │  │ printSquare(4)   │                                          │
  │  ├─────────────────┤                                          │
  │  │ Global Context   │                                          │
  │  └─────────────────┘                                          │
  │                                                              │
  │  ⑤ multiply return 16 → POP!                                  │
  │  ⑥ square return 16 → POP!                                    │
  │  ⑦ console.log(16) → POP!                                     │
  │  ⑧ printSquare xong → POP!                                    │
  │  ⑨ Global Context → chương trình KẾT THÚC!                  │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```

---

## §5. Hoisting — Var vs Let/Const vs Function!

```javascript
// ═══════════════════════════════════════════════════════════
// TỰ VIẾT: Mô phỏng compile phase! ★
// ═══════════════════════════════════════════════════════════

function simulateCompile(code) {
  var variableEnv = {};
  var lexicalEnv = {};
  var lines = code.split("\n");

  for (var i = 0; i < lines.length; i++) {
    var line = lines[i].trim();

    // ★ var declaration → Variable Env, init undefined!
    if (line.indexOf("var ") === 0) {
      var varName = line.split(" ")[1].replace(/[;=].*/g, "");
      if (!variableEnv[varName]) {
        variableEnv[varName] = "undefined"; // ★ Hoisted!
      }
    }

    // ★ function declaration → Variable Env, init TOÀN BỘ!
    if (line.indexOf("function ") === 0 && line.indexOf("=") === -1) {
      var fnMatch = line.match(/function\s+(\w+)/);
      if (fnMatch) {
        variableEnv[fnMatch[1]] = "[Function]"; // ★ TOÀN BỘ! ★★★
      }
    }

    // ★ let/const → Lexical Env, KHÔNG init! (TDZ!)
    if (line.indexOf("let ") === 0 || line.indexOf("const ") === 0) {
      var letName = line.split(" ")[1].replace(/[;=].*/g, "");
      lexicalEnv[letName] = "⛔ TDZ"; // ★ Temporal Dead Zone!
    }
  }

  return {
    variableEnvironment: variableEnv,
    lexicalEnvironment: lexicalEnv,
  };
}

// ═══════════════════════════════════════════════════════════
// TỰ VIẾT: Mô phỏng variable lookup! ★
// ═══════════════════════════════════════════════════════════

function lookupVariable(name, context) {
  // ★ Tìm Lexical Environment TRƯỚC! ★
  if (context.lexicalEnvironment[name] !== undefined) {
    if (context.lexicalEnvironment[name] === "⛔ TDZ") {
      throw new ReferenceError(name + " chưa được khởi tạo! (TDZ!)");
    }
    return context.lexicalEnvironment[name];
  }

  // ★ Sau đó tìm Variable Environment! ★
  if (context.variableEnvironment[name] !== undefined) {
    return context.variableEnvironment[name];
  }

  // ★ Không tìm thấy → tìm scope cha (scope chain!)
  if (context.outer) {
    return lookupVariable(name, context.outer);
  }

  throw new ReferenceError(name + " is not defined!");
}
```

---

## §6. Function Declaration vs Expression!

```
  DECLARATION vs EXPRESSION:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  ① Function DECLARATION — hoisted TOÀN BỘ! ★                │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ showName();              // ✅ CHẠY ĐƯỢC! ★           │    │
  │  │ function showName() {    // Hoisted: name + body!     │    │
  │  │   console.log('Hello!');                              │    │
  │  │ }                                                     │    │
  │  │                                                      │    │
  │  │ Compile: variableEnv.showName = function() {...} ★   │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  ② Function EXPRESSION (var) — chỉ hoisted tên! ★           │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ showName();              // ❌ TypeError! ★            │    │
  │  │ var showName = function() {                           │    │
  │  │   console.log('Hello!');                              │    │
  │  │ };                                                    │    │
  │  │                                                      │    │
  │  │ Compile: variableEnv.showName = undefined ★           │    │
  │  │ → undefined() → TypeError: not a function! ❌         │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  ③ Function EXPRESSION (let/const) — TDZ! ★                 │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ showName();              // ❌ ReferenceError! ★       │    │
  │  │ let showName = function() {                           │    │
  │  │   console.log('Hello!');                              │    │
  │  │ };                                                    │    │
  │  │                                                      │    │
  │  │ Compile: lexicalEnv.showName = ⛔ TDZ ★               │    │
  │  │ → TDZ! ReferenceError! ❌                              │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  ④ Arrow function = function expression! ★                    │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ greet();                 // ❌ ReferenceError! ★       │    │
  │  │ const greet = () => {    // Arrow = expression!       │    │
  │  │   console.log('Hi!');                                 │    │
  │  │ };                                                    │    │
  │  │ → const → TDZ → ReferenceError! ❌ ★                  │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```

---

## §7. Memory: Stack vs Heap!

```
  PRIMITIVE vs REFERENCE:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  PRIMITIVE (stack — copy GIÁ TRỊ!):                            │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ var a = 'hello';                                       │    │
  │  │ var b = a;        // ★ Copy GIÁ TRỊ 'hello'!         │    │
  │  │ b = 'world';      // ★ Chỉ đổi b, a KHÔNG đổi!      │    │
  │  │                                                      │    │
  │  │ STACK:                                                  │    │
  │  │ ┌────┬─────────┐                                      │    │
  │  │ │ a  │ 'hello'  │  ← vẫn 'hello'! ✅                  │    │
  │  │ │ b  │ 'world'  │  ← đổi riêng!                       │    │
  │  │ └────┴─────────┘                                      │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  REFERENCE (heap — copy ĐỊA CHỈ!):                            │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ var arr1 = [1, 2, 3];                                  │    │
  │  │ var arr2 = arr1;   // ★ Copy ĐỊA CHỈ 0x01! ★         │    │
  │  │ arr2.push(4);      // ★ Sửa HEAP → arr1 cũng đổi! ❌│    │
  │  │                                                      │    │
  │  │ STACK          HEAP                                      │    │
  │  │ ┌────┬──────┐  ┌──────────────┐                        │    │
  │  │ │arr1│ 0x01 ├──┤ [1,2,3,4]    │ ← CHUNG! ★            │    │
  │  │ │arr2│ 0x01 ├──┤     ↑ 0x01   │                        │    │
  │  │ └────┴──────┘  └──────────────┘                        │    │
  │  │                                                      │    │
  │  │ console.log(arr1); // [1,2,3,4]! ❌ Bị ảnh hưởng!   │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```

---

## §8. Câu Hỏi Phỏng Vấn!

```
  CÂU HỎI:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  ❓ 1: Hoisting là gì?                                           │
  │  → Compile phase: var → undefined, function → toàn bộ! ★   │
  │  → let/const: hoisted nhưng KHÔNG init → TDZ! ★              │
  │  → Gọi var trước khai báo → undefined ★                      │
  │  → Gọi let trước khai báo → ReferenceError ★                │
  │                                                              │
  │  ❓ 2: TDZ (Temporal Dead Zone) là gì?                           │
  │  → Vùng từ đầu block đến dòng khai báo let/const! ★        │
  │  → Biến ĐÃ tồn tại nhưng CHƯA được init! ★                 │
  │  → Truy cập → ReferenceError! ★                              │
  │                                                              │
  │  ❓ 3: Variable Env vs Lexical Env?                              │
  │  → Variable: var + function declaration! ★                    │
  │  → Lexical: let + const! ★                                    │
  │  → Tìm biến: Lexical TRƯỚC → Variable SAU! ★                │
  │                                                              │
  │  ❓ 4: function declaration vs expression?                       │
  │  → Declaration: hoisted toàn bộ (name + body)! ★             │
  │  → Expression (var): chỉ hoisted name = undefined! ★        │
  │  → Expression (let/const): TDZ! ★                             │
  │                                                              │
  │  ❓ 5: Call Stack là gì?                                          │
  │  → Stack LIFO quản lý execution context! ★                   │
  │  → Global → push → function call → push → return → pop! ★ │
  │  → TOP = context ĐANG CHẠY! ★                                │
  │  → Stack overflow = đệ quy quá sâu! ★                       │
  │                                                              │
  │  ❓ 6: Output đoạn code sau?                                     │
  │  → console.log(a); var a=1; function a(){}                   │
  │  → Compile: a=undefined → a=fn (ghi đè!) ★                  │
  │  → Execute: console.log(a) → function a(){} ★               │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```
