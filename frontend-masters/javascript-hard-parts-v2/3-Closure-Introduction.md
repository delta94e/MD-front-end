# JavaScript: The Hard Parts v2 — Phần 3: Closure — Giới Thiệu & Tại Sao Quan Trọng

> 📅 2026-03-06 · ⏱ 35 phút đọc
>
> Nguồn: Frontend Masters — Will Sentance
> Khoá học: JavaScript: The Hard Parts, v2
> Bài: Closure — "The Most Elegant and Beautiful Feature of JavaScript"
> Độ khó: ⭐️⭐️⭐️⭐️⭐️ | Feature quan trọng BẬC NHẤT

---

## Mục Lục

| #   | Phần                                               |
| --- | -------------------------------------------------- |
| 1   | Recap: HOF Loại 2 — Return Function Từ Function    |
| 2   | Closure Giải Quyết NHỮNG GÌ? (10 Use Cases)        |
| 3   | Bài Toán: Local Memory = Temporary → Mất Hết!      |
| 4   | Câu Hỏi Then Chốt: Persistent Memory Có Thể?       |
| 5   | "It All Starts With Returning A Function"          |
| 6   | Temporary Memory vs Persistent Memory — Diagram    |
| 7   | Closure = Function + Backpack                      |
| 8   | Tự Implement: once, memoize, counter — Preview     |
| 9   | 🔬 Deep Analysis Patterns — 6 Tư Duy Phân Tích Sâu |

---

## §1. Recap: HOF Loại 2 — Return Function Từ Function

### 1.1 Bài Viết: Từ "Nhận Function" Đến "Trả Function"

Will Sentance bắt đầu phần Closure bằng cách nhắc lại: Higher-Order Functions không chỉ **nhận** function vào, mà còn có thể **trả** function ra. Đây là nửa còn lại — và nửa MẠNH hơn nhiều.

> _"Higher-order functions aren't just about passing in a new function as input. They're also about returning out a function from another function."_

```
HOF LOẠI 1 vs HOF LOẠI 2:
═══════════════════════════════════════════════════════════════

  HOF LOẠI 1 (Phần 2 — đã học):
  ┌──────────────────────────────────────────────────────┐
  │ function copyArrayAndManipulate(array, instructions) │
  │   NHẬN function VÀO → chạy bên trong                │
  │                                                      │
  │ → Generalize behavior (DRY)                          │
  │ → map, filter, reduce                                │
  │ → "Cho tôi biết BẠN MUỐN LÀM GÌ với mỗi element"  │
  └──────────────────────────────────────────────────────┘

  HOF LOẠI 2 (Phần 3 — closure!):
  ┌──────────────────────────────────────────────────────┐
  │ function createCounter() {                           │
  │   let count = 0;                                     │
  │   return function() { count++; return count; };      │
  │ }        ↑ RETURN function RA!                       │
  │                                                      │
  │ → Function NHỚN dữ liệu từ lần chạy trước!          │
  │ → Persistent memory!                                 │
  │ → "The most powerful feature in JavaScript"          │
  │               — Will Sentance                        │
  └──────────────────────────────────────────────────────┘
```

---

## §2. Closure Giải Quyết NHỮNG GÌ? (10 Use Cases)

### 2.1 Bài Viết: Tại Sao Will Nói "I Can't Stress Enough"

Will liệt kê một danh sách ấn tượng về những gì closure làm được. Đây không phải feature nhỏ — đây là **nền tảng của JavaScript hiện đại**:

> _"I can't really stress enough... it's going to allow us to use fantastic functions like once and memoize."_

```
CLOSURE CHO PHÉP:
═══════════════════════════════════════════════════════════════

  ① ONCE — Giới hạn function chỉ chạy 1 lần:
  ┌──────────────────────────────────────────────────────┐
  │ const payOnce = once(processPayment);                │
  │ payOnce(); // ✅ Chạy                                │
  │ payOnce(); // ❌ Không chạy lại! (đã ghi nhớ!)     │
  │ → "Limit how many times a function can be called"    │
  └──────────────────────────────────────────────────────┘

  ② MEMOIZE — Cache kết quả, không tính lại:
  ┌──────────────────────────────────────────────────────┐
  │ const fastFib = memoize(fibonacci);                  │
  │ fastFib(40); // Tính lần 1: 2000ms                  │
  │ fastFib(40); // Lấy cache: 0.01ms ← 200,000x nhanh!│
  │ → "Save us from redoing computationally demanding    │
  │    work once we've done that work before"            │
  └──────────────────────────────────────────────────────┘

  ③ MODULE PATTERN — Encapsulate private data:
  ┌──────────────────────────────────────────────────────┐
  │ const counter = createModule();                      │
  │ counter.increment(); // private count tăng          │
  │ counter.count;       // undefined! (private!)        │
  │ → "The module pattern and built-in modules of        │
  │    JavaScript all implement with closure"            │
  └──────────────────────────────────────────────────────┘

  ④ ITERATORS — Duyệt data bằng function, không for loop:
  ┌──────────────────────────────────────────────────────┐
  │ const next = createIterator([1, 2, 3]);              │
  │ next(); // 1                                         │
  │ next(); // 2                                         │
  │ next(); // 3                                         │
  │ → "The ability to go through an array via a function │
  │    where each time we run it, its return value is    │
  │    the NEXT element"                                 │
  └──────────────────────────────────────────────────────┘

  ⑤ PARTIAL APPLICATION — Pre-fill arguments:
  ┌──────────────────────────────────────────────────────┐
  │ const add5 = partial(add, 5);                        │
  │ add5(3); // 8  (nhớ 5 từ trước!)                    │
  │ → "A big part of functional programming"             │
  └──────────────────────────────────────────────────────┘

  ⑥ ASYNC CALLBACKS — Data available khi callback chạy:
  ┌──────────────────────────────────────────────────────┐
  │ function fetchUser(id) {                             │
  │   const url = `/api/users/${id}`;                    │
  │   fetch(url).then(data => {                          │
  │     // url VẪN CÒN ở đây nhờ closure!               │
  │     console.log(`Got data from ${url}`);             │
  │   });                                                │
  │ }                                                    │
  │ → "Will that callback have the data it needs?        │
  │    It will, because of CLOSURE."                     │
  └──────────────────────────────────────────────────────┘

  ⑦ EVENT HANDLERS — Giữ state giữa các events
  ⑧ CURRYING — f(a)(b)(c) thay vì f(a, b, c)
  ⑨ FACTORY FUNCTIONS — Tạo objects có private state
  ⑩ REACT HOOKS — useState, useEffect bên dưới = closure!

  ┌─────────────────────────────────────────────────────────┐
  │ Will: "EVERYTHING depends on this elegant structure."   │
  └─────────────────────────────────────────────────────────┘
```

---

## §3. Bài Toán: Local Memory = Temporary → Mất Hết!

### 3.1 Bài Viết: Vấn Đề Mà Closure Giải Quyết

Will quay lại nền tảng đã học ở Phần 1: khi function chạy, EC được tạo → local memory lưu data → function kết thúc → local memory **BỊ XOÁ!**

> _"When we finished running multiplyBy2 the first time with 7, we threw it out. We then ran multiplyBy2 again with input of 10. We did NOT want to remember the previous running was with 7."_

```
BÀI TOÁN: LOCAL MEMORY = TEMPORARY:
═══════════════════════════════════════════════════════════════

  function multiplyBy2(input) {
    return input * 2;
  }

  LẦN 1: multiplyBy2(7)
  ┌─────────────────────────┐
  │ EC:                     │
  │ local memory:           │
  │   input: 7              │ ← TẠM THỜI!
  │ return: 14              │
  └─────────────────────────┘
  → EC BỊ XOÁ! input: 7 BIẾN MẤT!

  LẦN 2: multiplyBy2(10)
  ┌─────────────────────────┐
  │ EC:                     │
  │ local memory:           │
  │   input: 10             │ ← MỚI HOÀN TOÀN!
  │ return: 20              │ ← KHÔNG biết lần trước là 7!
  └─────────────────────────┘
  → EC LẠI BỊ XOÁ!

  ĐÂY LÀ ĐIỀU TỐT cho pure functions:
  ┌──────────────────────────────────────────────────────┐
  │ → multiplyBy2(7) LUÔN trả 14, bất kể gọi ở đâu    │
  │ → Không side effects, không state, predictable       │
  │ → "That's what we WANT to have happen, because       │
  │    that makes our functions PREDICTABLE."             │
  │                         — Will Sentance              │
  └──────────────────────────────────────────────────────┘

  NHƯNG... nếu ta MUỐN NHỚ thì sao?
```

---

## §4. Câu Hỏi Then Chốt: Persistent Memory Có Thể?

### 4.1 Bài Viết: "What If Functions Could REMEMBER?"

Will đặt RA câu hỏi then chốt — câu hỏi mà toàn bộ Phần 3 sẽ trả lời:

> _"What if our functions could hold onto live data between executions? Between their runnings, they could somehow not only have a temporary memory, but also a PERSISTENT memory."_

```
CÂU HỎI THEN CHỐT:
═══════════════════════════════════════════════════════════════

  Hiện tại: Function = TEMPORARY memory only

  ┌─────────┐   ┌─────────┐   ┌─────────┐
  │ Call #1  │   │ Call #2  │   │ Call #3  │
  │ mem: {a} │   │ mem: {b} │   │ mem: {c} │
  │ → XOÁ!  │   │ → XOÁ!  │   │ → XOÁ!  │
  └─────────┘   └─────────┘   └─────────┘
  → Mỗi lần = fresh start, KHÔNG nhớ gì!

  Ước muốn: Function = PERSISTENT memory!

  ┌──────────────────────────────────────┐
  │ PERSISTENT MEMORY (luôn tồn tại)    │
  │ ┌────────────────────────────────┐   │
  │ │ counter: 0 → 1 → 2 → 3       │   │
  │ │ cache: {} → {7: 14} → ...     │   │
  │ └────────────────────────────────┘   │
  │                                      │
  │ ┌─────────┐ ┌─────────┐ ┌─────────┐ │
  │ │ Call #1  │ │ Call #2  │ │ Call #3  │ │
  │ │ temp mem │ │ temp mem │ │ temp mem │ │
  │ │ → XOÁ!  │ │ → XOÁ!  │ │ → XOÁ!  │ │
  │ └─────────┘ └─────────┘ └─────────┘ │
  └──────────────────────────────────────┘

  → Temporary memory tạo+xoá mỗi lần gọi (như cũ)
  → PLUS persistent memory TỒN TẠI giữa các lần!
  → Persistent memory CHỈ function đó access được!

  Will: "That would be PRETTY REMARKABLE."
```

### 4.2 Tại Sao Persistent Memory Mạnh?

```
PERSISTENT MEMORY CHO PHÉP:
═══════════════════════════════════════════════════════════════

  ① ĐẾM số lần function được gọi:
  ┌──────────────────────────────────────────────────────┐
  │ persistent: { counter: 0 }                           │
  │                                                      │
  │ Call #1 → counter++ → counter = 1                    │
  │ Call #2 → counter++ → counter = 2                    │
  │ Call #3 → if (counter >= 2) → STOP! ❌              │
  │                                                      │
  │ → Đây là cách "once" hoạt động!                      │
  │ → Will: "If we run it again, we've got some store    │
  │   saying counter is already one, and if it's one,    │
  │   you can't run me again."                           │
  └──────────────────────────────────────────────────────┘

  ② CACHE kết quả đã tính:
  ┌──────────────────────────────────────────────────────┐
  │ persistent: { cache: {} }                            │
  │                                                      │
  │ Call fib(40) → tính 2 giây → cache[40] = 102334155  │
  │ Call fib(40) → cache HIT! → 0.001ms! 🚀            │
  │                                                      │
  │ → Đây là cách "memoize" hoạt động!                   │
  └──────────────────────────────────────────────────────┘

  ③ TRACK state qua thời gian:
  ┌──────────────────────────────────────────────────────┐
  │ persistent: { index: 0, data: [1,2,3] }             │
  │                                                      │
  │ Call next() → data[0] = 1, index++ → 1              │
  │ Call next() → data[1] = 2, index++ → 2              │
  │ Call next() → data[2] = 3, index++ → 3              │
  │                                                      │
  │ → Đây là cách "iterator" hoạt động!                  │
  └──────────────────────────────────────────────────────┘
```

---

## §5. "It All Starts With Returning A Function"

### 5.1 Bài Viết: Bí Mật Nằm Ở Chỗ RETURN

> Will: _"But it all starts with us returning a function from another function."_

Closure không phải magic — nó là **hệ quả tự nhiên** của 2 quy tắc JavaScript đã biết:

```
CLOSURE = HỆ QUẢ CỦA 2 QUY TẮC:
═══════════════════════════════════════════════════════════════

  QUY TẮC 1: Functions = first-class objects (Phần 2.4)
  → Functions có thể RETURN từ functions!
  → Return function = return VALUE (vì function = value)

  QUY TẮC 2: Lexical scoping (Phần 1)
  → Function "nhìn thấy" variables ở nơi nó ĐƯỢC KHAI BÁO
  → KHÔNG PHẢI nơi nó được GỌI!

  QUY TẮC 1 + QUY TẮC 2 = CLOSURE:
  ┌──────────────────────────────────────────────────────┐
  │ function outer() {                                   │
  │   let count = 0;           ← outer's local memory   │
  │   function inner() {                                 │
  │     count++;               ← "nhìn thấy" count     │
  │     return count;          ← vì KHAI BÁO bên trong  │
  │   }                        ← outer!                  │
  │   return inner;            ← RETURN function ra!     │
  │ }                                                    │
  │                                                      │
  │ const myFunc = outer();    ← outer chạy xong → XOÁ EC│
  │ myFunc(); // 1             ← NHƯNG count VẪN CÒN!   │
  │ myFunc(); // 2             ← count TIẾP TỤC tăng!   │
  │ myFunc(); // 3                                       │
  │                                                      │
  │ → outer() đã chạy XONG                              │
  │ → EC của outer BỊ XOÁ                               │
  │ → NHƯNG inner "mang theo" count!                     │
  │ → count = PERSISTENT MEMORY!                         │
  └──────────────────────────────────────────────────────┘
```

---

## §6. Temporary Memory vs Persistent Memory — Diagram

```
MEMORY MODEL — TEMPORARY vs PERSISTENT:
═══════════════════════════════════════════════════════════════

  PURE FUNCTION (chỉ temporary):
  ┌──────────────────────────────────────────────────────┐
  │                                                      │
  │  multiplyBy2: ƒ ──→ [code: return input * 2]        │
  │                                                      │
  │  Gọi #1:          Gọi #2:          Gọi #3:          │
  │  ┌──────────┐     ┌──────────┐     ┌──────────┐     │
  │  │ input: 7 │     │ input: 10│     │ input: 3 │     │
  │  │ ret: 14  │     │ ret: 20  │     │ ret: 6   │     │
  │  └──── ╳ ──┘     └──── ╳ ──┘     └──── ╳ ──┘     │
  │    (deleted)        (deleted)        (deleted)       │
  │                                                      │
  │  → Mỗi lần: fresh start, KHÔNG nhớ!                 │
  └──────────────────────────────────────────────────────┘

  CLOSURE FUNCTION (temporary + PERSISTENT!):
  ┌──────────────────────────────────────────────────────┐
  │                                                      │
  │  myFunc: ƒ ──┬──→ [code: count++; return count;]    │
  │              │                                       │
  │              └──→ 🎒 BACKPACK (persistent memory!):  │
  │                   ┌──────────────────────────┐       │
  │                   │ count: 0 → 1 → 2 → 3    │       │
  │                   └──────────────────────────┘       │
  │                         ↑ KHÔNG bị xoá!              │
  │                         ↑ Tồn tại GIỮA các lần gọi! │
  │                                                      │
  │  Gọi #1:          Gọi #2:          Gọi #3:          │
  │  ┌──────────┐     ┌──────────┐     ┌──────────┐     │
  │  │ temp mem │     │ temp mem │     │ temp mem │     │
  │  │ count→1  │     │ count→2  │     │ count→3  │     │
  │  │ ret: 1   │     │ ret: 2   │     │ ret: 3   │     │
  │  └──── ╳ ──┘     └──── ╳ ──┘     └──── ╳ ──┘     │
  │    (deleted)        (deleted)        (deleted)       │
  │    BUT count=1      BUT count=2      BUT count=3     │
  │    SAVED in 🎒!     SAVED in 🎒!     SAVED in 🎒!   │
  └──────────────────────────────────────────────────────┘

  → Temporary memory: tạo + xoá mỗi call (như cũ)
  → Persistent memory (🎒): TỒN TẠI mãi mãi!
  → Chỉ myFunc ACCESS được 🎒!
  → Đây = CLOSURE!
```

---

## §7. Closure = Function + Backpack

### 7.1 Bài Viết: Thuật Ngữ Chính Thức

Will gọi persistent memory bằng nhiều tên:

```
CLOSURE — NHIỀU TÊN, CÙNG CONCEPT:
═══════════════════════════════════════════════════════════════

  Chính thức (ECMAScript spec):
  → [[Environment]] — hidden property trên function object
  → Lexical Environment — môi trường nơi function được khai báo

  Thường dùng:
  → Closure — "đóng lại" variables từ outer scope
  → Closed-over Variable Environment (C.O.V.E.)

  Will's name:
  → "Backpack" 🎒 — function "mang ba lô" chứa data!

  Tên khác trong cộng đồng:
  → Persistent Lexical Scope Referenced Data (P.L.S.R.D.)
  → "The most beautiful feature of JavaScript"

  ┌──────────────────────────────────────────────────────┐
  │                                                      │
  │  CLOSURE = FUNCTION DEFINITION                       │
  │          + SURROUNDING DATA (BACKPACK)               │
  │                                                      │
  │  Khi function được RETURN từ outer function:         │
  │  → Function code = GIỮ NGUYÊN                        │
  │  → Surrounding data = ĐÍNH KÈM vào function!        │
  │  → Giống sinh viên tốt nghiệp: mang theo KIẾN THỨC  │
  │    từ trường (outer function) dù trường đã ĐÓNG CỬA │
  │    (outer EC bị xoá)!                                │
  │                                                      │
  └──────────────────────────────────────────────────────┘
```

### 7.2 Tại Sao Persistent Memory CHỈ Function Đó Truy Cập?

```
ENCAPSULATION — PRIVATE DATA:
═══════════════════════════════════════════════════════════════

  function createCounter() {
    let count = 0;
    return function() { return ++count; };
  }

  const counter = createCounter();

  ✅ counter();        // 1 → truy cập count qua closure
  ✅ counter();        // 2 → count vẫn SỐNG!

  ❌ counter.count     // undefined → KHÔNG truy cập trực tiếp!
  ❌ console.log(count) // ReferenceError! count KHÔNG ở global!

  → count chỉ tồn tại TRONG backpack 🎒 của counter!
  → KHÔNG AI KHÁC truy cập được!
  → Đây = ENCAPSULATION = PRIVATE DATA!

  Will: "Maybe even one that's ONLY available inside
  of that function."

  So sánh:
  ┌──────────────────────────────────────────────────────┐
  │ Global variable:  MỌI NGƯỜI truy cập → NGUY HIỂM!  │
  │ Closure variable: CHỈ function đó → AN TOÀN!        │
  │                                                      │
  │ → Closure = private state cho function!              │
  │ → Giống private field trong OOP!                     │
  │ → Nhưng KHÔNG CẦN class! Chỉ cần function!         │
  └──────────────────────────────────────────────────────┘
```

---

## §8. Tự Implement: once, memoize, counter — Preview

```javascript
// ═══ PREVIEW: ONCE — Giới hạn chỉ chạy 1 lần ═══

function once(fn) {
  let hasRun = false; // ← SẼ trở thành persistent memory!
  let result;

  return function (...args) {
    if (!hasRun) {
      result = fn(...args);
      hasRun = true; // ← GHI NHỚ: "đã chạy rồi!"
      return result;
    }
    return result; // ← Lần sau: return kết quả cũ!
  };
}

const processPayment = once((amount) => {
  console.log(`Processing $${amount}...`);
  return `Paid $${amount}`;
});

processPayment(100); // "Processing $100..." → "Paid $100"
processPayment(200); // (không log gì!) → "Paid $100" ← GIÁ TRỊ CŨ!
processPayment(300); // (không log gì!) → "Paid $100" ← VẪN GIÁ TRỊ CŨ!

// → hasRun = persistent memory TRONG closure!
// → Payment chỉ xử lý 1 LẦN! An toàn! ✅
```

```javascript
// ═══ PREVIEW: MEMOIZE — Cache kết quả ═══

function memoize(fn) {
  const cache = {}; // ← Persistent memory!

  return function (...args) {
    const key = JSON.stringify(args);

    if (key in cache) {
      console.log(`Cache HIT for ${key}`);
      return cache[key]; // ← Return từ cache, KHÔNG tính lại!
    }

    console.log(`Computing for ${key}...`);
    const result = fn(...args);
    cache[key] = result; // ← LƯU vào persistent cache!
    return result;
  };
}

// Fibonacci đệ quy (rất chậm!):
function slowFib(n) {
  if (n <= 1) return n;
  return slowFib(n - 1) + slowFib(n - 2);
}

const fastFib = memoize(slowFib);

console.time("First");
fastFib(35); // Computing... (chậm lần đầu)
console.timeEnd("First"); // ~100ms

console.time("Second");
fastFib(35); // Cache HIT! (instant!)
console.timeEnd("Second"); // ~0.01ms ← 10,000x nhanh hơn!

// → cache = persistent memory TRONG closure!
// → Kết quả cũ KHÔNG bị tính lại! 🚀
```

```javascript
// ═══ PREVIEW: ITERATOR — Duyệt array bằng function ═══

function createIterator(array) {
  let index = 0; // ← Persistent memory!

  return function next() {
    if (index < array.length) {
      const value = array[index];
      index++; // ← Tăng index mỗi lần gọi!
      return { value, done: false };
    }
    return { value: undefined, done: true };
  };
}

const iter = createIterator(["a", "b", "c"]);

iter(); // { value: "a", done: false }  ← index was 0, now 1
iter(); // { value: "b", done: false }  ← index was 1, now 2
iter(); // { value: "c", done: false }  ← index was 2, now 3
iter(); // { value: undefined, done: true } ← DONE!

// → index = persistent memory!
// → Mỗi lần gọi: nhớ đang ở đâu → return phần tử TIẾP THEO!
// → Will: "A function where each time we run it, its return
//   value is the NEXT element in that array."
```

```javascript
// ═══ PREVIEW: MODULE PATTERN — Private & Public ═══

function createBankAccount(initialBalance) {
  let balance = initialBalance; // ← PRIVATE! persistent memory!
  const history = []; // ← PRIVATE!

  return {
    deposit(amount) {
      balance += amount;
      history.push({ type: "deposit", amount, balance });
      return balance;
    },
    withdraw(amount) {
      if (amount > balance) return "Insufficient funds!";
      balance -= amount;
      history.push({ type: "withdraw", amount, balance });
      return balance;
    },
    getBalance() {
      return balance; // ← Truy cập qua method, KHÔNG trực tiếp!
    },
    getHistory() {
      return [...history]; // ← Return COPY (immutable!)
    },
  };
}

const account = createBankAccount(100);
account.deposit(50); // 150
account.withdraw(30); // 120
account.getBalance(); // 120
account.balance; // undefined! ← PRIVATE! 🔒
account.history; // undefined! ← PRIVATE! 🔒

// → balance, history = closure variables!
// → Chỉ access qua public methods!
// → Đây = encapsulation KHÔNG CẦN class!
```

---

## §9. 🔬 Deep Analysis Patterns — 6 Tư Duy Phân Tích Sâu

### 9.1 Pattern ①: 5 Whys — Closure

```
5 WHYS: TẠI SAO CẦN CLOSURE?
═══════════════════════════════════════════════════════════════

  WHY ①: Tại sao cần persistent memory?
  └→ Vì nhiều bài toán CẦN state giữa các lần gọi:
     counter, cache, iterator, rate limiter...

  WHY ②: Sao không dùng global variable?
  └→ Global variable = MỌI NGƯỜI truy cập → conflict!
     Closure = CHỈ function đó truy cập → SAFE!
     → Encapsulation không cần class!

  WHY ③: Sao không dùng object/class thay closure?
  └→ CÓ THỂ dùng class! Nhưng closure GỌN hơn:
     Class = 10 dòng. Closure = 5 dòng.
     Functional Programming dùng closure, OOP dùng class.
     JavaScript hỗ trợ CẢ HAI.

  WHY ④: Tại sao V8 không xoá data khi outer function kết thúc?
  └→ Vì inner function VẪN REFERENCE đến data!
     Garbage Collector rule: nếu CÓ reference → KHÔNG xoá!
     Inner function giữ reference → data SỐNG SÓT!

  WHY ⑤: Tại sao Will gọi closure là "elegant"?
  └→ Vì closure = hệ quả TỰ NHIÊN của 2 quy tắc:
     first-class functions + lexical scoping = closure!
     KHÔNG cần syntax mới, KHÔNG cần keyword mới!
     ⭐ Nó "xuất hiện" từ những gì JS đã có sẵn!
```

### 9.2 Pattern ②: First Principles

```
FIRST PRINCIPLES — CLOSURE LÀ GÌ THỰC SỰ?
═══════════════════════════════════════════════════════════════

  Closure KHÔNG phải feature "thêm vào" JavaScript.
  Closure = HỆ QUẢ TỰ NHIÊN của:

  ① LEXICAL SCOPING:
  → Function "nhìn thấy" biến ở nơi nó ĐƯỢC KHAI BÁO
  → Khai báo bên trong outer → thấy biến của outer

  ② FIRST-CLASS FUNCTIONS:
  → Function = value → có thể RETURN từ function khác
  → Function có thể SỐNG lâu hơn nơi nó được khai báo

  ③ GARBAGE COLLECTION:
  → Data chỉ bị xoá khi KHÔNG CÒN reference
  → Inner function giữ reference → data SỐNG!

  ① + ② + ③ = CLOSURE:
  ┌──────────────────────────────────────────────────────┐
  │ Inner function được KHAI BÁO trong outer (①)        │
  │ → "Thấy" biến của outer (lexical scope)             │
  │                                                      │
  │ Inner function được RETURN ra ngoài (②)              │
  │ → Sống SÂU hơn outer function                       │
  │                                                      │
  │ Biến outer vẫn có REFERENCE từ inner (③)            │
  │ → GC KHÔNG xoá → PERSISTENT MEMORY!                 │
  │                                                      │
  │ = Function + Backpack 🎒                              │
  └──────────────────────────────────────────────────────┘
```

### 9.3 Pattern ③: Trade-off Analysis

```
TRADE-OFFS: GLOBAL STATE vs CLOSURE vs CLASS
═══════════════════════════════════════════════════════════════

  ┌──────────────────┬──────────────────┬──────────────────┐
  │ Tiêu chí          │ Global variable  │ Closure          │
  ├──────────────────┼──────────────────┼──────────────────┤
  │ Accessibility    │ ❌ MỌI NƠI      │ ✅ CHỈ function  │
  │                  │ → name collision │ → private!       │
  ├──────────────────┼──────────────────┼──────────────────┤
  │ Debugging        │ ❌ "Ai sửa?"    │ ⚠️ Hidden state  │
  │                  │ (bất kỳ ai)     │ (khó trace)      │
  ├──────────────────┼──────────────────┼──────────────────┤
  │ Memory           │ ✅ 1 copy       │ ⚠️ Mỗi closure  │
  │                  │                  │ = 1 copy riêng   │
  ├──────────────────┼──────────────────┼──────────────────┤
  │ Predictability   │ ❌ Side effects │ ✅ Contained     │
  └──────────────────┴──────────────────┴──────────────────┘

  ┌──────────────────┬──────────────────┬──────────────────┐
  │ Tiêu chí          │ Closure          │ Class            │
  ├──────────────────┼──────────────────┼──────────────────┤
  │ Syntax           │ ✅ Gọn (5 dòng) │ ❌ Dài (10 dòng)│
  ├──────────────────┼──────────────────┼──────────────────┤
  │ Private state    │ ✅ Auto private │ ⚠️ Cần # prefix │
  │                  │ (không cần keyword)│ (ES2022)       │
  ├──────────────────┼──────────────────┼──────────────────┤
  │ Inheritance      │ ❌ Không hỗ trợ│ ✅ extends       │
  ├──────────────────┼──────────────────┼──────────────────┤
  │ this complexity  │ ✅ Không this!  │ ❌ this binding  │
  ├──────────────────┼──────────────────┼──────────────────┤
  │ Paradigm         │ Functional Prog │ OOP              │
  └──────────────────┴──────────────────┴──────────────────┘
```

### 9.4 Pattern ④: Mental Mapping

```
MENTAL MAP: CLOSURE TRONG JAVASCRIPT ECOSYSTEM:
═══════════════════════════════════════════════════════════════

  ┌─────────────────────────────────────────────────────────┐
  │ REACT HOOKS = Closure!                                  │
  │                                                         │
  │ function Counter() {                                    │
  │   const [count, setCount] = useState(0);                │
  │   //    ^^^^^^^^^^^^^^^^^                               │
  │   //    useState BÊN TRONG = closure giữ state!        │
  │                                                         │
  │   return <button onClick={() => setCount(count + 1)}>   │
  │     {count}                                             │
  │   </button>;                                            │
  │   // onClick callback = closure giữ count & setCount!  │
  │ }                                                       │
  └─────────────────────────────────────────────────────────┘

  ┌─────────────────────────────────────────────────────────┐
  │ NODE.js MODULES = Closure!                              │
  │                                                         │
  │ // Mỗi file Node.js = wrapped trong function:           │
  │ (function(exports, require, module, __filename) {       │
  │   const secret = "hidden";  // ← closure variable!     │
  │   module.exports = { getSecret: () => secret };         │
  │ })();                                                   │
  │ → Variables trong module = PRIVATE nhờ closure!        │
  └─────────────────────────────────────────────────────────┘

  ┌─────────────────────────────────────────────────────────┐
  │ ASYNC/AWAIT = Closure!                                  │
  │                                                         │
  │ async function fetchUser(id) {                          │
  │   const url = `/api/${id}`;  // ← closure variable!    │
  │   const data = await fetch(url);                        │
  │   // "url" VẪN CÒN khi fetch resolve!                  │
  │   // Vì async function = closure giữ url!              │
  │ }                                                       │
  └─────────────────────────────────────────────────────────┘
```

### 9.5 Pattern ⑤: Reverse Engineering & Implementation

```javascript
// TỰ BUILD: Chứng minh CLOSURE = [[Environment]]

function outer() {
  let x = 10;

  function inner() {
    return x; // inner "thấy" x từ outer
  }

  return inner;
}

const myFunc = outer();

// Inspect closure — CHỨNG MINH nó tồn tại:
console.dir(myFunc);
// ƒ inner()
//   [[Scopes]]:
//     0: Closure (outer)
//       x: 10          ← ĐÂY LÀ BACKPACK! 🎒
//     1: Global

// → V8 lưu closure trong [[Scopes]]
// → x = 10 VẪN CÒN dù outer() đã chạy xong!
// → Đây là PROOF của persistent memory!
```

```javascript
// TỰ BUILD: Mỗi closure = INSTANCE RIÊNG!

function createCounter(start) {
  let count = start;
  return {
    increment: () => ++count,
    decrement: () => --count,
    getCount: () => count,
  };
}

const counterA = createCounter(0);
const counterB = createCounter(100);

counterA.increment(); // 1
counterA.increment(); // 2
counterB.increment(); // 101
counterB.decrement(); // 100

console.log(counterA.getCount()); // 2
console.log(counterB.getCount()); // 100

// → counterA và counterB: 2 closures KHÁC NHAU!
// → Mỗi cái có backpack RIÊNG với count riêng!
// → counterA.count ≠ counterB.count
// → Giống 2 INSTANCES của cùng 1 "class"!
```

### 9.6 Pattern ⑥: Lịch Sử & Tiến Hoá

```
LỊCH SỬ: CLOSURE:
═══════════════════════════════════════════════════════════════

  1958: LISP — Closures nguyên thuỷ
  │     → Khái niệm function + environment
  │     → Chưa hoàn chỉnh (dynamic scoping)
  │
  ↓
  1964: Peter Landin — "The Mechanical Evaluation of
  │     Expressions" → thuật ngữ "closure" ra đời
  │     → Function code + environment = "closed over"
  │
  ↓
  1975: Scheme — CLOSURES HOÀN CHỈNH!
  │     → Lexical scoping (khác LISP dynamic scoping)
  │     → First-class closures = core feature
  │     → JS lấy cảm hứng trực tiếp từ Scheme!
  │
  ↓
  1995: JavaScript — Closures từ ngày đầu!
  │     → Brendan Eich (ảnh hưởng Scheme)
  │     → Nhưng ít ai HIỂU closure!
  │     → "Accidental closures" gây bug (var + loop)
  │
  ↓
  2008: Douglas Crockford — "JavaScript: The Good Parts"
  │     → "Closure is JavaScript's best feature"
  │     → Module Pattern = closure-based encapsulation
  │
  ↓
  2015: ES6 — let/const fix "closure bug" với var+loop
  │     → Block scoping + closure = powerful combo
  │
  ↓
  2019: React Hooks — Closures = MAINSTREAM!
  │     → useState, useEffect, useCallback = closures!
  │     → "Stale closure" = common bug
  │
  ↓
  2024: JavaScript chuẩn
        → Closures = feature CƠ BẢN nhất
        → Mọi developer PHẢI hiểu
        → "The most elegant feature" — Will Sentance

  ⭐ Closure 60 tuổi (1964→2024) — vẫn quan trọng
     như ngày đầu!
```

```
TÓM TẮT 6 PATTERNS:
═══════════════════════════════════════════════════════════════

  ① 5 WHYS         → Cần persistent state → global unsafe
                      → closure encapsulate → GC giữ data
                      → "elegant" = hệ quả tự nhiên!

  ② FIRST PRINCIPLES→ Lexical scope + first-class ƒ + GC
                      = closure! Không cần syntax mới!

  ③ TRADE-OFFS     → Closure: private, gọn ↔ hidden state
                      Global: simple ↔ unsafe shared
                      Class: inheritance ↔ verbose, this

  ④ MENTAL MAPPING → React hooks, Node modules, async/await,
                      event handlers → TẤT CẢ dùng closure!

  ⑤ RE-IMPLEMENT   → console.dir(fn) → [[Scopes]] = proof!
                      Mỗi createCounter() = instance riêng!

  ⑥ HISTORY        → Landin "closure" (1964) → Scheme (1975)
                      → JS (1995) → Module Pattern (2008)
                      → React Hooks (2019) → everywhere!
```

---

## Self-Assessment Checklist

```
CHECKLIST — SAU KHI HỌC PHẦN 3:
═══════════════════════════════════════════════════════════════

  HIỂU KHÁI NIỆM:
  [ ] Giải thích closure BẰNG LỜI MÌNH (không thuật ngữ)
  [ ] Phân biệt temporary memory vs persistent memory
  [ ] Giải thích tại sao local memory bình thường bị xoá
  [ ] Giải thích tại sao closure data KHÔNG bị xoá (GC rule)

  TRỰC GIÁC:
  [ ] Giải thích closure = hệ quả của 2 quy tắc nào?
  [ ] Tại sao persistent memory CHỈ function đó truy cập?
  [ ] Closure khác global variable ở điểm nào?
  [ ] Closure khác class ở điểm nào?

  USE CASES (biết TẠI SAO cần):
  [ ] once — giới hạn chỉ chạy 1 lần
  [ ] memoize — cache kết quả tính toán
  [ ] iterator — duyệt data bằng function
  [ ] module pattern — private + public
  [ ] async callback — giữ data cho khi callback chạy

  TỰ IMPLEMENT (CODE):
  [ ] Viết createCounter từ đầu
  [ ] Viết once từ đầu
  [ ] Viết memoize từ đầu
  [ ] Viết createIterator từ đầu
  [ ] Dùng console.dir(fn) kiểm tra [[Scopes]]

  TIẾP THEO → Phần 3.2: Full Closure Walkthrough!
```
