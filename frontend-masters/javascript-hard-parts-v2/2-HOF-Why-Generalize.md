# JavaScript: The Hard Parts v2 — Phần 2: Higher-Order Functions — Tại Sao Cần Generalize?

> 📅 2026-03-06 · ⏱ 30 phút đọc
>
> Nguồn: Frontend Masters — Will Sentance
> Khoá học: JavaScript: The Hard Parts, v2
> Bài: Callbacks & Higher-Order Functions (Intro)
> Độ khó: ⭐️⭐️⭐️⭐️ | Nền tảng cho Functional Programming

---

## Mục Lục

| #   | Phần                                                  |
| --- | ----------------------------------------------------- |
| 1   | Tại Sao Cần Functions? — DRY Principle                |
| 2   | Generalize Với Parameter — Để Dữ Liệu "Chưa Xác Định" |
| 3   | Bước Nhảy Vọt: Để Cả FUNCTIONALITY "Chưa Xác Định"    |
| 4   | Higher-Order Functions — Định Nghĩa & Ý Nghĩa         |
| 5   | Lịch Sử: Java/C++ Không Có Feature Này Đến 2010s!     |
| 6   | Function Declaration vs Arrow Function                |
| 7   | Tự Implement: Từ 10Squared Đến HOF                    |
| 8   | 🔬 Deep Analysis Patterns — 6 Tư Duy Phân Tích Sâu    |

---

## §1. Tại Sao Cần Functions? — DRY Principle

### 1.1 Bài Viết: Nỗi Đau Của Copy-Paste

Will Sentance bắt đầu bằng một bài học kinh điển: viết function `10squared`, rồi `9squared`, rồi `8squared`... Mỗi function gần như GIỐNG HỆT nhau, chỉ khác MỘT CON SỐ. Đây là **violation** của DRY principle — **Don't Repeat Yourself**.

Tại sao DRY quan trọng?

1. **Bugs nhân đôi** — Nếu có lỗi trong logic `x * x`, bạn phải sửa ở MỌI function
2. **Maintenance nightmare** — 100 functions gần giống nhau = 100 nơi cần update
3. **Readability giảm** — Người đọc phải "diff" bằng mắt để tìm khác biệt
4. **Memory waste** — Mỗi function definition chiếm memory riêng

> **Will's approach:** Ông cố tình bắt học viên viết 10squared, 9squared, 8squared cho đến khi họ _đau khổ_ — đó là lúc insight "TẠI SAO cần parameter" trở nên sâu sắc nhất.

```
NỖI ĐAU CỦA KHÔNG CÓ PARAMETER:
═══════════════════════════════════════════════════════════════

  function tenSquared() {        function nineSquared() {
    return 10 * 10;                return 9 * 9;
  }                              }

  function eightSquared() {      function sevenSquared() {
    return 8 * 8;                  return 7 * 7;
  }

  function sixSquared() {        function fiveSquared() {
    return 6 * 6;                  return 5 * 5;
  }

  // ... còn 4 functions nữa!

  ┌─────────────────────────────────────────────────────────┐
  │ VẤN ĐỀ:                                                │
  │                                                         │
  │ ① 10 functions gần GIỐNG HỆT nhau                      │
  │ ② Chỉ khác 1 CON SỐ (10, 9, 8, 7...)                  │
  │ ③ Nếu đổi logic thành x * x * x (cube)?               │
  │    → Phải sửa CẢ 10 functions!                          │
  │ ④ Muốn thêm 100squared?                                │
  │    → Phải viết THÊM function mới!                       │
  │                                                         │
  │ ⚠️ VI PHẠM DRY: Don't Repeat Yourself!                 │
  └─────────────────────────────────────────────────────────┘
```

```javascript
// NỖI ĐAU — CODE THỰC TẾ:

// ❌ BAD: Mỗi số = 1 function riêng
function tenSquared() {
  return 10 * 10;
} // 100
function nineSquared() {
  return 9 * 9;
} // 81
function eightSquared() {
  return 8 * 8;
} // 64
// ... lặp lại 7 lần nữa 😩

// ✅ GOOD: 1 function dùng cho MỌI số
function squareNum(num) {
  return num * num;
}
squareNum(10); // 100
squareNum(9); // 81
squareNum(8); // 64
// 1 function thay thế 10 functions!
```

---

## §2. Generalize Với Parameter — Để Dữ Liệu "Chưa Xác Định"

### 2.1 Bài Viết: Parameter = "Chỗ Trống" Chờ Điền

Will Sentance hỏi Joe: _"What could we do to save ourselves from this painful experience?"_ → **"Make our squared function have a parameter."**

**Parameter** nghĩa là: khi KHAI BÁO function, bạn **để trống** một phần dữ liệu. Khi GỌI function, bạn **điền vào** chỗ trống đó bằng argument.

- **Khai báo:** "Tôi sẽ nhân MỘT SỐ NÀO ĐÓ với chính nó"
- **Gọi:** "Số đó là 10!" → 10 \* 10 = 100
- **Gọi lại:** "Số đó là 9!" → 9 \* 9 = 81

```
GENERALIZE = ĐỂ DỮ LIỆU LÀ "TBD" (To Be Determined):
═══════════════════════════════════════════════════════════════

  TRƯỚC (Cụ thể — Hardcoded):
  ┌──────────────────────────────────────────────────┐
  │ function tenSquared() {                          │
  │   return 10 * 10;      ← SỐ 10 "cứng"           │
  │ }                        Chỉ dùng được cho 10!   │
  └──────────────────────────────────────────────────┘

  SAU (Tổng quát — Generalized):
  ┌──────────────────────────────────────────────────┐
  │ function squareNum(num) {                        │
  │   return num * num;    ← "num" là PLACEHOLDER!   │
  │ }                        Dùng cho BẤT KỲ số nào! │
  └──────────────────────────────────────────────────┘

  Khi KHAI BÁO:  num = ??? (chưa biết, TBD)
  Khi GỌI:       num = 10  → return 100
                  num = 9   → return 81
                  num = 999 → return 998001

  ┌─────────────────────────────────────────────────────┐
  │  PARAMETER = "chỗ trống" khi khai báo              │
  │  ARGUMENT  = "giá trị thực" khi gọi                │
  │                                                     │
  │  function squareNum( num ) { ... }                  │
  │                      ^^^                            │
  │                   PARAMETER (blank)                 │
  │                                                     │
  │  squareNum( 10 )                                    │
  │             ^^                                      │
  │          ARGUMENT (actual value)                    │
  └─────────────────────────────────────────────────────┘
```

### 2.2 Insight: Generalize = Sức Mạnh Của Abstraction

```
ABSTRACTION LEVELS:
═══════════════════════════════════════════════════════════════

  Level 0: Không có function
  → 10 * 10  (hardcode trực tiếp!)
  → 9 * 9
  → 8 * 8   ... lặp lại mãi

  Level 1: Function KHÔNG có parameter
  → tenSquared()     (mỗi số = 1 function)
  → nineSquared()
  → eightSquared()   ... vẫn lặp!

  Level 2: Function CÓ parameter (Generalize DATA)    ← ĐÂY!
  → squareNum(10)    (1 function cho MỌI số!)
  → squareNum(9)
  → squareNum(8)     ... 1 function là đủ!

  Level 3: Higher-Order Function (Generalize BEHAVIOR) ← SẮP TỚI!
  → operateOnNum(10, square)     (1 function cho MỌI phép tính!)
  → operateOnNum(10, cube)
  → operateOnNum(10, double)     ... power level 9000!
```

---

## §3. Bước Nhảy Vọt: Để Cả FUNCTIONALITY "Chưa Xác Định"

### 3.1 Bài Viết: Câu Hỏi Thay Đổi Mọi Thứ

Will Sentance đặt ra câu hỏi **đột phá nhất** của bài học:

> _"What if we could not only leave some blank for our DATA, but also leave a TBD for some of our CODE?"_

Đến Level 2, ta đã generalize **dữ liệu** — số nào cũng bình phương được. Nhưng nếu ta muốn thay đổi **hành vi**? Không chỉ bình phương, mà còn lập phương, nhân đôi, chia 3, hay BẤT KỲ phép tính nào?

**Level 3** là để cả **functionality** ở trạng thái "chưa xác định" — khi gọi function, ta mới quyết định nó LÀM GÌ.

```
BƯỚC NHẢY VỌT: TỪ GENERALIZE DATA → GENERALIZE BEHAVIOR:
═══════════════════════════════════════════════════════════════

  Level 2: Generalize DATA (đã học)
  ┌──────────────────────────────────────────────────────┐
  │ function squareNum(num) {                            │
  │   return num * num;     ← HÀNH VI cố định (bình     │
  │ }                         phương), DATA thay đổi     │
  │                                                      │
  │ squareNum(10) → 100                                  │
  │ squareNum(9)  → 81     ← Chỉ đổi SỐ, phép tính     │
  │ squareNum(8)  → 64       LUÔN là bình phương!        │
  └──────────────────────────────────────────────────────┘

  Nhưng nếu muốn nhân 3? Lập phương? Cộng 10?
  → Phải viết MỚI: tripleNum(), cubeNum(), addTen()...
  → LẠI VI PHẠM DRY!

  Level 3: Generalize BEHAVIOR (sắp học!)
  ┌──────────────────────────────────────────────────────┐
  │ function operateOnNum(num, operation) {              │
  │   return operation(num); ← CẢ HÀNH VI cũng TBD!     │
  │ }                                                    │
  │                                                      │
  │ operateOnNum(10, square)  → 100   ← bình phương     │
  │ operateOnNum(10, cube)    → 1000  ← lập phương      │
  │ operateOnNum(10, double)  → 20    ← nhân đôi        │
  │ operateOnNum(10, addTen)  → 20    ← cộng 10         │
  │                                                      │
  │ → 1 function, THAY ĐỔI CÀ DỮ LIỆU LẪN HÀNH VI!    │
  └──────────────────────────────────────────────────────┘

  ⭐ Đây chính là HIGHER-ORDER FUNCTION!
     Function nhận function khác làm tham số.
```

### 3.2 Tại Sao Điều Này Khả Thi?

Trong JavaScript, **functions là "first-class citizens"** — chúng là GIÁ TRỊ, giống như số, chuỗi, boolean. Nghĩa là:

- Lưu function vào biến ✅
- Truyền function làm argument ✅
- Return function từ function khác ✅

```
FUNCTIONS = FIRST-CLASS CITIZENS:
═══════════════════════════════════════════════════════════════

  Số:        const x = 10;       ← lưu vào biến ✅
  Chuỗi:     const s = "hello";  ← lưu vào biến ✅
  Function:  const f = (x) => x * x;  ← lưu vào biến ✅

  ┌──────────────────────────────────────────────────────┐
  │ Truyền SỐ làm argument:                             │
  │   squareNum(10)                                      │
  │             ^^── 10 là GIÁ TRỊ truyền vào            │
  │                                                      │
  │ Truyền FUNCTION làm argument:                        │
  │   operateOnNum(10, square)                           │
  │                    ^^^^^^── square là GIÁ TRỊ!       │
  │                    (function = giá trị, giống số!)   │
  └──────────────────────────────────────────────────────┘

  → Trong JS: function KHÔNG ĐẶC BIỆT hơn số!
  → Nó chỉ là MỘT LOẠI GIÁ TRỊ mà ta có thể:
    ① Lưu vào memory
    ② Truyền vào function khác
    ③ Return từ function
```

---

## §4. Higher-Order Functions — Định Nghĩa & Ý Nghĩa

### 4.1 Bài Viết: HOF Là Gì?

**Higher-Order Function (HOF)** = function **nhận function khác làm argument** hoặc **return function**.

Nó "higher-order" vì hoạt động ở **mức trừu tượng cao hơn**: thay vì thao tác trực tiếp trên dữ liệu, nó **điều phối** function khác (callback) để làm việc.

Will nói về ý nghĩa thực tế:

> _"We understand higher-order functions, we can do pro-level functions like map, filter, reduce."_

```
HIGHER-ORDER FUNCTION vs REGULAR FUNCTION:
═══════════════════════════════════════════════════════════════

  REGULAR FUNCTION (Level 2):
  ┌──────────────────────────────────────────────────────┐
  │ function squareNum(num) {                            │
  │   return num * num;                                  │
  │ }                                                    │
  │                                                      │
  │ → Nhận DATA (số)                                     │
  │ → Xử lý bằng LOGIC CỐ ĐỊNH (bình phương)            │
  │ → Trả kết quả                                       │
  └──────────────────────────────────────────────────────┘

  HIGHER-ORDER FUNCTION (Level 3):
  ┌──────────────────────────────────────────────────────┐
  │ function operateOnNum(num, operation) {              │
  │   return operation(num);                             │
  │ }                     ↑                              │
  │                       callback — function truyền vào │
  │                                                      │
  │ → Nhận DATA (số) + BEHAVIOR (function!)              │
  │ → GỌI callback để xử lý                              │
  │ → Trả kết quả                                       │
  │                                                      │
  │ Thuật ngữ:                                           │
  │ • operateOnNum = HIGHER-ORDER FUNCTION               │
  │ • operation    = CALLBACK (function truyền vào)      │
  └──────────────────────────────────────────────────────┘

  MAP, FILTER, REDUCE đều là HOFs:
  ─────────────────────────────────
  [1,2,3].map(double)    → [2,4,6]     callback = double
  [1,2,3].filter(isEven) → [2]         callback = isEven
  [1,2,3].reduce(sum, 0) → 6           callback = sum
```

### 4.2 Sơ Đồ: Two-Level Abstraction

```
HAI TẦNG TRỪU TƯỢNG:
═══════════════════════════════════════════════════════════════

  ┌──────────────────────────────────────────────────────┐
  │              HIGHER-ORDER FUNCTION                    │
  │              (Tầng điều phối)                         │
  │                                                      │
  │  "Tôi sẽ duyệt qua mảng, gọi callback cho mỗi      │
  │   phần tử, và thu thập kết quả."                     │
  │                                                      │
  │  function map(array, callback) {                     │
  │    const results = [];                               │
  │    for (let i = 0; i < array.length; i++) {          │
  │      results.push( callback(array[i]) );             │
  │    }                     ↑                           │
  │    return results;       │                           │
  │  }                       │                           │
  │                          │ GỌI callback              │
  │  ┌───────────────────────┼──────────────────────┐    │
  │  │           CALLBACK    │                      │    │
  │  │           (Tầng xử lý)                       │    │
  │  │                                              │    │
  │  │  "Tôi biết cách xử lý 1 PHẦN TỬ."          │    │
  │  │                                              │    │
  │  │  function double(x) { return x * 2; }        │    │
  │  │  function square(x) { return x * x; }        │    │
  │  │  function negate(x) { return -x; }           │    │
  │  │                                              │    │
  │  └──────────────────────────────────────────────┘    │
  │                                                      │
  │  map([1,2,3], double) → [2,4,6]                     │
  │  map([1,2,3], square) → [1,4,9]                     │
  │  map([1,2,3], negate) → [-1,-2,-3]                   │
  │                                                      │
  │  → CÙNG map(), KHÁC callback = KHÁC kết quả!        │
  └──────────────────────────────────────────────────────┘
```

---

## §5. Lịch Sử: Java/C++ Không Có Feature Này Đến 2010s!

### 5.1 Bài Viết: Đừng Coi Thường First-Class Functions

Will Sentance nhấn mạnh một fact ít người biết:

> _"In some of our favorite languages — Java, C++ — this wasn't possible until the 2010s. The idea of adjusting a function after it's been defined to give it different behaviors was not a built-in feature."_

JavaScript có **first-class functions từ ngày đầu** (1995), vì Brendan Eich lấy cảm hứng từ Scheme (1975). Nhưng Java chỉ có Lambda expressions từ **Java 8 (2014)**. C++ chỉ có lambdas từ **C++11 (2011)**.

```
LỊCH SỬ FIRST-CLASS FUNCTIONS:
═══════════════════════════════════════════════════════════════

  1958: LISP — Ngôn ngữ ĐẦU TIÊN có first-class functions
  │     → Functions = data, có thể truyền xung quanh
  │     → Quá thời đại, ít người hiểu
  │
  ↓
  1975: Scheme — Kế thừa LISP, thêm lexical scoping
  │     → Brendan Eich lấy cảm hứng từ đây cho JS!
  │
  ↓
  1995: JavaScript — First-class functions BUILT-IN
  │     → Từ ngày đầu: function = value
  │     → Truyền function làm argument = TỰ NHIÊN
  │     → Higher-order functions = MIỄN PHÍ!
  │
  ↓
  Trong khi đó...
  │
  │  1995: Java 1.0     — KHÔNG có first-class functions
  │  │     → Phải dùng anonymous inner classes (verbose!)
  │  │     → Runnable r = new Runnable() { void run() {...} }
  │  │     → 😩 Quá dài dòng!
  │  │
  │  ↓
  │  2014: Java 8       — THÊM Lambda expressions (19 năm sau!)
  │        → list.forEach(x -> System.out.println(x));
  │
  │  1998: C++98        — KHÔNG có lambdas
  │  │     → Phải dùng function pointers hoặc functors
  │  │
  │  ↓
  │  2011: C++11        — THÊM Lambda expressions (13 năm sau!)
  │        → auto f = [](int x) { return x * x; };
  │
  ↓
  2015: ES6 — Arrow functions (cú pháp gọn hơn)
        → const square = x => x * x;

  ⭐ JavaScript có HOFs từ 1995.
     Java/C++ phải đợi đến 2011-2014!
     "Don't take higher-order functions for granted!"
```

---

## §6. Function Declaration vs Arrow Function

Will đề cập: _"We'll see the new arrow function declaration style in a moment. I will tend to use the function keyword throughout hard parts, primarily because for readability."_

```
FUNCTION DECLARATION vs ARROW FUNCTION:
═══════════════════════════════════════════════════════════════

  ① FUNCTION DECLARATION (Will dùng trong Hard Parts):
  ┌──────────────────────────────────────────────────────┐
  │ function squareNum(num) {                            │
  │   return num * num;                                  │
  │ }                                                    │
  │                                                      │
  │ ✅ Rõ ràng: keyword "function" = biết ngay là hàm   │
  │ ✅ Hoisted: có thể gọi TRƯỚC khi khai báo           │
  │ ✅ Có tên: dễ debug (stack trace hiện tên)           │
  │ ✅ Tốt cho teaching: explicit, không magic           │
  └──────────────────────────────────────────────────────┘

  ② ARROW FUNCTION (phổ biến trong code thực tế):
  ┌──────────────────────────────────────────────────────┐
  │ const squareNum = (num) => num * num;                │
  │                                                      │
  │ ✅ Ngắn gọn: 1 dòng thay vì 3 dòng                 │
  │ ✅ Implicit return (không cần keyword "return")      │
  │ ✅ Lexical this (không tạo this riêng)               │
  │ ❌ Không hoisted: phải khai báo TRƯỚC khi gọi       │
  │ ❌ Anonymous: stack trace hiện "(anonymous)"         │
  └──────────────────────────────────────────────────────┘

  SO SÁNH CÚ PHÁP:
  ─────────────────
  // Function declaration
  function add(a, b) { return a + b; }

  // Arrow function — đầy đủ
  const add = (a, b) => { return a + b; };

  // Arrow function — implicit return
  const add = (a, b) => a + b;

  // Arrow function — 1 parameter (bỏ ngoặc)
  const double = x => x * 2;

  → Ở Hard Parts: dùng function keyword cho rõ ràng
  → Ở production code: arrow function cho gọn
```

---

## §7. Tự Implement: Từ 10Squared Đến HOF

```javascript
// HÀNH TRÌNH EVOLUTION: Từ hardcode → Higher-Order Function

// ═══ LEVEL 0: Hardcode trực tiếp ═══
console.log(10 * 10); // 100
console.log(9 * 9); // 81
// ❌ Lặp lại, không tái sử dụng

// ═══ LEVEL 1: Function không parameter ═══
function tenSquared() {
  return 10 * 10;
}
function nineSquared() {
  return 9 * 9;
}
// ❌ DRY violation — 1 function mỗi số!

// ═══ LEVEL 2: Function có parameter ═══
function squareNum(num) {
  return num * num;
}
squareNum(10); // 100
squareNum(9); // 81
// ✅ Generalize DATA! Nhưng...
// ❌ Phép tính CỐ ĐỊNH (chỉ bình phương)

// Muốn cube? Phải viết function mới:
function cubeNum(num) {
  return num * num * num;
}
// Muốn double? Lại function mới:
function doubleNum(num) {
  return num * 2;
}
// ❌ DRY violation LEVEL 2!

// ═══ LEVEL 3: HIGHER-ORDER FUNCTION ═══
function operateOnNum(num, operation) {
  return operation(num); // GỌI callback!
}

// Callbacks — thay đổi HÀNH VI:
const square = (x) => x * x;
const cube = (x) => x * x * x;
const double = (x) => x * 2;
const negate = (x) => -x;
const addTen = (x) => x + 10;

// 1 function, NHIỀU hành vi:
operateOnNum(10, square); // 100
operateOnNum(10, cube); // 1000
operateOnNum(10, double); // 20
operateOnNum(10, negate); // -10
operateOnNum(10, addTen); // 20
// ✅ Generalize cả DATA lẫn BEHAVIOR!
```

```javascript
// TỰ XÂY LẠI MAP — Không dùng Array.prototype.map!

function myMap(array, callback) {
  // ① Tạo mảng kết quả rỗng
  const output = [];

  // ② Duyệt qua từng phần tử
  for (let i = 0; i < array.length; i++) {
    // ③ Gọi callback cho MỖI phần tử
    // callback = function truyền vào = BEHAVIOR TBD!
    const transformed = callback(array[i]);

    // ④ Push kết quả vào output
    output.push(transformed);
  }

  // ⑤ Return mảng mới
  return output;
}

// Sử dụng:
myMap([1, 2, 3], (x) => x * 2); // [2, 4, 6]
myMap([1, 2, 3], (x) => x * x); // [1, 4, 9]
myMap(["a", "b"], (s) => s.toUpperCase()); // ["A", "B"]

// → CÙNG myMap, KHÁC callback = KHÁC kết quả!
// → myMap = Higher-Order Function
// → (x) => x * 2 = Callback
```

```javascript
// TỰ XÂY LẠI FILTER — Không dùng Array.prototype.filter!

function myFilter(array, testFunc) {
  const output = [];
  for (let i = 0; i < array.length; i++) {
    // testFunc return true/false → giữ hoặc bỏ
    if (testFunc(array[i])) {
      output.push(array[i]);
    }
  }
  return output;
}

myFilter([1, 2, 3, 4, 5], (x) => x > 3); // [4, 5]
myFilter([1, 2, 3, 4, 5], (x) => x % 2 === 0); // [2, 4]

// TỰ XÂY LẠI REDUCE — Không dùng Array.prototype.reduce!

function myReduce(array, combiner, initialValue) {
  let accumulator = initialValue;
  for (let i = 0; i < array.length; i++) {
    accumulator = combiner(accumulator, array[i]);
  }
  return accumulator;
}

myReduce([1, 2, 3], (acc, x) => acc + x, 0); // 6 (tổng)
myReduce([1, 2, 3], (acc, x) => acc * x, 1); // 6 (tích)
myReduce([1, 2, 3], (acc, x) => Math.max(acc, x), -Infinity); // 3

// ⭐ map, filter, reduce = 3 Higher-Order Functions
//    mạnh nhất trong JavaScript!
```

---

## §8. 🔬 Deep Analysis Patterns — 6 Tư Duy Phân Tích Sâu

### 8.1 Pattern ①: 5 Whys — Higher-Order Functions

```
5 WHYS: TẠI SAO CẦN HIGHER-ORDER FUNCTIONS?
═══════════════════════════════════════════════════════════════

  WHY ①: Tại sao cần HOF?
  └→ Vì nếu chỉ generalize DATA, mỗi lần muốn hành vi
     khác (square, cube, double...) phải viết function mới.

  WHY ②: Tại sao không viết nhiều functions?
  └→ Vì DRY! Nếu 90% logic giống nhau (duyệt mảng, thu
     thập kết quả), chỉ khác 10% (phép biến đổi) → lãng phí.

  WHY ③: Tại sao JS cho phép truyền function làm argument?
  └→ Vì JS thiết kế functions là FIRST-CLASS CITIZENS —
     function = value, giống số hay chuỗi. Lấy từ Scheme.

  WHY ④: Tại sao Java/C++ không có HOF từ đầu?
  └→ Vì chúng thiết kế theo paradigm OOP, functions KHÔNG
     phải first-class. Function luôn gắn với class/object.
     Phải đợi đến 2011-2014 mới thêm lambdas.

  WHY ⑤: Tại sao first-class functions mạnh đến vậy?
  └→ Vì nó cho phép COMPOSITION — ghép nhỏ thành lớn!
     map + filter + reduce = xử lý DATA pipeline hoàn chỉnh
     mà KHÔNG cần vòng lặp, biến tạm, hay mutation.
     ⭐ Đây là nền tảng của Functional Programming!
```

### 8.2 Pattern ②: First Principles

```
FIRST PRINCIPLES — PHÂN RÃ HOF:
═══════════════════════════════════════════════════════════════

  ┌──────────────────────────────────────────────────────────┐
  │            HIGHER-ORDER FUNCTION = ?                      │
  │                                                          │
  │  DATA STRUCTURE:                                         │
  │  → Function = Object trong JS (có properties!)           │
  │  → Callback = reference đến function object              │
  │  → Arguments = array-like object chứa tất cả inputs      │
  │                                                          │
  │  ALGORITHM:                                              │
  │  → HOF pattern: nhận callback → gọi callback với data    │
  │  → map:    iterate → transform each → collect            │
  │  → filter: iterate → test each → keep if true            │
  │  → reduce: iterate → accumulate → return single value    │
  │                                                          │
  │  HARDWARE:                                               │
  │  → Mỗi callback call = 1 Execution Context              │
  │  → map([1..1000], fn) = 1000 EC tạo rồi xoá!           │
  │  → V8 tối ưu: inline callback nếu nhỏ → skip EC!       │
  └──────────────────────────────────────────────────────────┘
```

### 8.3 Pattern ③: Trade-off Analysis

```
TRADE-OFFS: HOF vs IMPERATIVE LOOPS:
═══════════════════════════════════════════════════════════════

  ┌──────────────────┬──────────────────┬───────────────────┐
  │ Tiêu chí          │ HOF (map/filter)│ Imperative (for)  │
  ├──────────────────┼──────────────────┼───────────────────┤
  │ Readability      │ ✅ Declarative  │ ❌ Phải đọc logic │
  │                  │ "Làm GÌ"        │ "Làm NHƯ THẾ NÀO"│
  ├──────────────────┼──────────────────┼───────────────────┤
  │ Performance      │ ❌ Overhead:    │ ✅ Nhanh hơn      │
  │                  │ function calls  │ (no call overhead) │
  ├──────────────────┼──────────────────┼───────────────────┤
  │ Reusability      │ ✅ Callback     │ ❌ Logic hardcode │
  │                  │ thay đổi được   │ trong vòng lặp    │
  ├──────────────────┼──────────────────┼───────────────────┤
  │ Debugging        │ ❌ Stack trace  │ ✅ Breakpoint     │
  │                  │ sâu hơn        │ dễ đặt hơn        │
  ├──────────────────┼──────────────────┼───────────────────┤
  │ Immutability     │ ✅ Tạo mảng MỚI│ ⚠️ Dễ mutate     │
  │                  │ (no side effect)│ mảng gốc          │
  └──────────────────┴──────────────────┴───────────────────┘

  ⭐ Production code: HOF (readability + safety)
     Performance-critical: for loop (raw speed)
     (V8 thường inline HOFs → gần bằng for loop!)
```

### 8.4 Pattern ④: Mental Mapping

```
MENTAL MAP: HOF TRONG THỰC TẾ:
═══════════════════════════════════════════════════════════════

  ┌─────────────────────────────────────────────────────────┐
  │ REACT (Frontend)                                        │
  │                                                         │
  │ {items.map(item => <Card key={item.id} data={item} />)}│
  │           ^^^                                           │
  │        HOF: map | Callback: item => <Card />            │
  │                                                         │
  │ {items.filter(item => item.active).map(...)}            │
  │        ^^^^^^                                           │
  │        HOF: filter | Callback: item => item.active      │
  │                                                         │
  │ → MỌI React list rendering = Higher-Order Functions!    │
  └─────────────────────────────────────────────────────────┘

  ┌─────────────────────────────────────────────────────────┐
  │ EXPRESS (Backend)                                       │
  │                                                         │
  │ app.get("/api", (req, res) => { ... })                  │
  │     ^^^          ^^^^^^^^^^^^^^^^^^                     │
  │     HOF          Callback (handler)                     │
  │                                                         │
  │ app.use(authMiddleware)                                  │
  │     ^^^  ^^^^^^^^^^^^^^                                 │
  │     HOF  Callback (middleware)                          │
  │                                                         │
  │ → Express routing = Higher-Order Functions!             │
  └─────────────────────────────────────────────────────────┘

  ┌─────────────────────────────────────────────────────────┐
  │ EVENT HANDLING                                          │
  │                                                         │
  │ button.addEventListener("click", handleClick)           │
  │        ^^^^^^^^^^^^^^^^          ^^^^^^^^^^^            │
  │        HOF                       Callback               │
  │                                                         │
  │ → DOM events = Higher-Order Functions!                  │
  └─────────────────────────────────────────────────────────┘
```

### 8.5 Pattern ⑤: Reverse Engineering & Implementation

```javascript
// TỰ XÂY LẠI: FUNCTION COMPOSITION PIPELINE

function pipe(...fns) {
  // pipe = Higher-Order Function trả về function!
  return function (initialValue) {
    let result = initialValue;
    for (const fn of fns) {
      result = fn(result); // Gọi từng callback tuần tự
    }
    return result;
  };
}

// Callbacks:
const double = (x) => x * 2;
const addOne = (x) => x + 1;
const square = (x) => x * x;

// Tạo pipeline:
const transform = pipe(double, addOne, square);
//                     ↑ step1  ↑ step2  ↑ step3

transform(3);
// Step 1: double(3) = 6
// Step 2: addOne(6) = 7
// Step 3: square(7) = 49
// → 49

// ⭐ pipe() = HOF trả về HOF!
// ⭐ double, addOne, square = Callbacks
// ⭐ "What I cannot create, I do not understand" ✅
```

```javascript
// TỰ XÂY LẠI: CURRY — Biến 1 function thành HOF chuỗi

function myCurry(fn) {
  return function curried(...args) {
    if (args.length >= fn.length) {
      // Đủ arguments → gọi function gốc
      return fn.apply(this, args);
    } else {
      // Chưa đủ → trả function chờ thêm arguments
      return function (...moreArgs) {
        return curried.apply(this, args.concat(moreArgs));
      };
    }
  };
}

// Function thường:
function add(a, b, c) {
  return a + b + c;
}
add(1, 2, 3); // 6

// Curried version:
const curriedAdd = myCurry(add);
curriedAdd(1)(2)(3); // 6
curriedAdd(1, 2)(3); // 6
curriedAdd(1)(2, 3); // 6

// Partial application:
const add10 = curriedAdd(10); // "Nhớ" a=10
add10(5)(3); // 18 (10+5+3)

// → Curry = HOF trả về HOF chờ thêm data!
// → Đây là nền tảng của Functional Programming
```

### 8.6 Pattern ⑥: Lịch Sử & Tiến Hoá

```
LỊCH SỬ: HIGHER-ORDER FUNCTIONS
═══════════════════════════════════════════════════════════════

  1936: Alonzo Church — Lambda Calculus
  │     → Toán học: function nhận function = TỰ NHIÊN
  │     → Nền tảng lý thuyết cho mọi thứ sau đây
  │
  ↓
  1958: LISP — First-class functions trong code
  │     → mapcar (tổ tiên của map!)
  │     → Vấn đề: cú pháp quá lạ (nhiều ngoặc)
  │
  ↓
  1975: Scheme — Lexical closures
  │     → HOFs + closures = cực mạnh
  │     → Brendan Eich: "JS lấy cảm hứng từ Scheme"
  │
  ↓
  1990: Haskell — Pure FP, mọi function đều curried
  │     → map, filter, fold (= reduce) hoàn thiện
  │
  ↓
  1995: JavaScript — HOFs built-in từ ngày SINH
  │     → Nhưng ít ai biết dùng (jQuery era: callbacks)
  │
  ↓
  2009: ES5 — Array HOFs native
  │     → Array.prototype.map, filter, reduce, forEach
  │     → "Functional JavaScript" bắt đầu phổ biến
  │
  ↓
  2015: ES6 — Arrow functions
  │     → HOFs elegant hơn: arr.map(x => x * 2)
  │     → Spread, destructuring → FP-friendly
  │
  ↓
  2020+: React Hooks, RxJS, Ramda, fp-ts
        → HOFs = TRUNG TÂM của modern JS ecosystem
        → useEffect(callback, deps) = HOF!
        → observable.pipe(map, filter) = HOF chain!

  ⭐ HOFs: từ toán học (1936) → production code (2020+).
     84 NĂM tiến hoá!
```

```
TÓM TẮT 6 PATTERNS — HIGHER-ORDER FUNCTIONS:
═══════════════════════════════════════════════════════════════

  ① 5 WHYS         → DRY → generalize behavior → first-class
                      functions → composition → FP!

  ② FIRST PRINCIPLES→ HOF = function nhận/trả function
                      Callback = reference đến function object
                      Mỗi callback call = 1 Execution Context

  ③ TRADE-OFFS     → HOF: readable + reusable ↔ overhead
                      Imperative: fast ↔ hardcoded logic
                      V8 inline → gap ngày càng nhỏ

  ④ MENTAL MAPPING → React .map(), Express middleware,
                      DOM addEventListener, Promise .then()
                      → MỌI NƠI trong modern JavaScript!

  ⑤ RE-IMPLEMENT   → Tự build: myMap, myFilter, myReduce,
                      pipe, curry — KHÔNG dùng thư viện

  ⑥ HISTORY        → Lambda Calculus (1936) → LISP (1958)
                      → Scheme → JS → ES5 → modern ecosystem
```

---

## Self-Assessment Checklist

```
CHECKLIST — SAU KHI HỌC PHẦN 2 (INTRO):
═══════════════════════════════════════════════════════════════

  [ ] Giải thích DRY principle bằng ví dụ 10squared/9squared
  [ ] Phân biệt 3 levels: hardcode → parameter → HOF
  [ ] Định nghĩa Higher-Order Function bằng lời của bạn
  [ ] Phân biệt HOF vs Callback
  [ ] Giải thích "first-class citizens" nghĩa là gì
  [ ] Viết function declaration vs arrow function
  [ ] Giải thích tại sao Java 2014 mới có lambdas

  TỰ IMPLEMENT (không dùng thư viện):
  [ ] Tự viết myMap từ đầu
  [ ] Tự viết myFilter từ đầu
  [ ] Tự viết myReduce từ đầu
  [ ] Tự viết pipe (function composition)
  [ ] Tự viết curry

  LIÊN HỆ THỰC TẾ:
  [ ] Chỉ ra HOF trong React code (map, filter, useEffect)
  [ ] Chỉ ra HOF trong Express (middleware, route handler)
  [ ] Chỉ ra HOF trong DOM (addEventListener)
```
