# JavaScript: The Hard Parts v2 — Phần 5: Synchronous Execution Review — Nền Tảng Trước Khi Async!

> 📅 2026-03-07 · ⏱ 25 phút đọc
>
> Nguồn: Frontend Masters — Will Sentance
> Khoá học: JavaScript: The Hard Parts, v2
> Bài: Synchronous Execution Review — Thread, Memory, Call Stack
> Độ khó: ⭐️⭐️⭐️ | "One Thing At A Time — No Exceptions!"

---

## Mục Lục

| #   | Phần                                                    |
| --- | ------------------------------------------------------- |
| 1   | Giới Thiệu Part 5 — Promises, Async & The Event Loop    |
| 2   | 3 Thành Phần Cốt Lõi: Thread, Memory, Call Stack        |
| 3   | Full Trace: multiplyBy2(3) — Execution Context Chi Tiết |
| 4   | Full Trace: multiplyBy2(10) — Lần Gọi Thứ Hai           |
| 5   | Single-Threaded — Một Thứ Một Lúc, KHÔNG Ngoại Lệ!      |
| 6   | Tại Sao Cần Review? — Setup Cho Async!                  |
| 7   | Tự Implement: Execution Context Simulator               |
| 8   | 🔬 Deep Analysis Patterns — 6 Tư Duy Phân Tích Sâu      |

---

## §1. Giới Thiệu Part 5 — Promises, Async & The Event Loop

### 1.1 Bài Viết: "The Most Significant ES6 Feature"

> Will: _"Promises — the most significant ES6 feature added in 2015. We'll see that they're used to make our code far easier to read, but if we don't understand how they're working under the hood, they are pretty MAGIC — maybe magic to a fault."_

```
PART 5 — ROADMAP:
═══════════════════════════════════════════════════════════════

  ┌──────────────────────────────────────────────────┐
  │ SẼ HỌC TRONG PART 5:                            │
  │                                                  │
  │ ① Promises                                       │
  │   → ES6 feature quan trọng nhất!                 │
  │   → Kiểm soát async code!                       │
  │   → Abort promises khi cần!                      │
  │                                                  │
  │ ② Asynchronous Code Execution                    │
  │   → Làm sao dynamic web apps hoạt động?         │
  │   → Web browser APIs & features!                 │
  │                                                  │
  │ ③ The Event Loop                                 │
  │   → JavaScript's TRIAGE system!                  │
  │   → "Chạy cái gì tiếp theo?"                    │
  │   → Microtask queue vs Callback queue!           │
  │                                                  │
  │ ④ Web Browser APIs                               │
  │   → setTimeout, fetch, DOM...                    │
  │   → KHÔNG phải JavaScript features!              │
  │   → Browser features accessed FROM JS!           │
  └──────────────────────────────────────────────────┘

  NHƯNG TRƯỚC ĐÃ...
  → Phải hiểu synchronous execution HOÀN HẢO!
  → Vì async = synchronous + THÊM rules!
  → Nếu không hiểu sync → KHÔNG THỂ hiểu async!
```

---

## §2. 3 Thành Phần Cốt Lõi: Thread, Memory, Call Stack

```
3 COMPONENTS — JAVASCRIPT EXECUTION MODEL:
═══════════════════════════════════════════════════════════════

  ① THREAD OF EXECUTION:
  ┌──────────────────────────────────────────────────┐
  │ → Đi qua code TỪNG DÒNG MỘT (line by line!)    │
  │ → Chỉ CÓ MỘT thread duy nhất!                  │
  │ → = SINGLE-THREADED!                             │
  │ → Chỉ làm MỘT thứ tại MỘT thời điểm!           │
  │ → JavaScript KHÔNG BAO GIỜ bỏ dang dở 1 dòng!   │
  │                                                  │
  │ Will: "How many things can that thread do at     │
  │ once? ONE!"                                      │
  └──────────────────────────────────────────────────┘

  ② MEMORY (Variable Environment):
  ┌──────────────────────────────────────────────────┐
  │ → Nơi LƯU TRỮ data (variables, functions!)      │
  │ → Global memory = persistent!                    │
  │ → Local memory = tạm thời (deleted khi EC end!)  │
  │ → = "Save stuff" area!                           │
  └──────────────────────────────────────────────────┘

  ③ CALL STACK:
  ┌──────────────────────────────────────────────────┐
  │ → Theo dõi: "đang ở ĐÂU trong code?"            │
  │ → LIFO structure (Last In, First Out!)           │
  │ → global() = LUÔN ở đáy!                         │
  │ → Function call → PUSH lên stack!                │
  │ → Function return → POP khỏi stack!              │
  │ → Top of stack = ĐANG CHẠY!                      │
  │                                                  │
  │ Will: "The call stack keeps track of what        │
  │ function we're currently running — where in      │
  │ our thread of execution we currently are."       │
  └──────────────────────────────────────────────────┘

  3 COMPONENTS — HÌNH ẢNH:
  ┌──────────────────────────────────────────────────┐
  │                                                  │
  │  THREAD          MEMORY           CALL STACK     │
  │  ────→           ┌──────┐         ┌────────┐    │
  │  line 1          │num: 3│         │        │    │
  │  line 2          │multi │         │        │    │
  │  line 3    →     │By2:ƒ │         │ global │    │
  │  line 4          │      │         └────────┘    │
  │  ...             └──────┘                        │
  │                                                  │
  │  Thread goes     Memory saves    Stack tracks    │
  │  LINE BY LINE    DATA             POSITION       │
  │                                                  │
  └──────────────────────────────────────────────────┘
```

---

## §3. Full Trace: multiplyBy2(3) — Execution Context Chi Tiết

```
CODE:
═══════════════════════════════════════════════════════════════

  const num = 3;

  function multiplyBy2(inputNumber) {
    const result = inputNumber * 2;
    return result;
  }

  const output = multiplyBy2(num);
  const newOutput = multiplyBy2(10);
```

```
TRACE — DÒNG 1: const num = 3;
═══════════════════════════════════════════════════════════════

  GLOBAL MEMORY:                    CALL STACK:
  ┌────────────────────┐            ┌──────────┐
  │ num: 3             │            │          │
  │                    │            │  global  │
  └────────────────────┘            └──────────┘

  → Declare const num, assign value 3
  → Primitive 3 stored directly in memory (stack!)
```

```
TRACE — DÒNG 2-4: function multiplyBy2...
═══════════════════════════════════════════════════════════════

  GLOBAL MEMORY:                    CALL STACK:
  ┌────────────────────┐            ┌──────────┐
  │ num: 3             │            │          │
  │ multiplyBy2: ƒ     │            │  global  │
  └────────────────────┘            └──────────┘

  → Store ENTIRE function definition in memory!
  → Thread KHÔNG đi vào body!
  → Thread NHẢY QUA thẳng xuống dòng tiếp theo!

  Will: "Do we go inside the body of that function
  yet? No. Our thread jumps straight down."
```

```
TRACE — DÒNG 6: const output = multiplyBy2(num);
═══════════════════════════════════════════════════════════════

  Step 1: Declare output → chưa biết giá trị!
  Step 2: Thấy multiplyBy2(num) → parens = CALL!
  Step 3: Evaluate num → 3
  Step 4: Gọi multiplyBy2(3) → NEW EXECUTION CONTEXT!

  GLOBAL MEMORY:                    CALL STACK:
  ┌────────────────────┐            ┌──────────────┐
  │ num: 3             │            │multiplyBy2(3)│
  │ multiplyBy2: ƒ     │            ├──────────────┤
  │ output: ???        │            │    global     │
  └────────────────────┘            └──────────────┘

  NEW EXECUTION CONTEXT — multiplyBy2(3):
  ┌──────────────────────────────────────────────────┐
  │ LOCAL MEMORY:                                    │
  │ ┌────────────────────────────┐                   │
  │ │ inputNumber: 3  (parameter!)│                  │
  │ │ result: 3 * 2 = 6          │                  │
  │ └────────────────────────────┘                   │
  │                                                  │
  │ THREAD:                                          │
  │ → inputNumber = 3 (argument matches parameter)   │
  │ → result = inputNumber * 2 = 3 * 2 = 6          │
  │ → return result → return 6 OUT!                  │
  └──────────────────────────────────────────────────┘

  return 6 → output = 6!

  GLOBAL MEMORY:                    CALL STACK:
  ┌────────────────────┐            ┌──────────┐
  │ num: 3             │            │          │
  │ multiplyBy2: ƒ     │            │  global  │ ← back on top!
  │ output: 6          │            └──────────┘
  └────────────────────┘

  → EC bị XÓA!
  → multiplyBy2 POP off call stack!
  → Thread quay lại global!

  Will: "What happens to this execution context?
  It goes away! Gets popped off the call stack!"
```

---

## §4. Full Trace: multiplyBy2(10) — Lần Gọi Thứ Hai

```
TRACE — DÒNG 7: const newOutput = multiplyBy2(10);
═══════════════════════════════════════════════════════════════

  Step 1: Declare newOutput → chưa biết!
  Step 2: multiplyBy2(10) → NEW EXECUTION CONTEXT!

  GLOBAL MEMORY:                    CALL STACK:
  ┌────────────────────┐            ┌───────────────┐
  │ num: 3             │            │multiplyBy2(10)│
  │ multiplyBy2: ƒ     │            ├───────────────┤
  │ output: 6          │            │    global      │
  │ newOutput: ???     │            └───────────────┘
  └────────────────────┘

  NEW EC — multiplyBy2(10):
  ┌──────────────────────────────────────────────────┐
  │ LOCAL MEMORY:                                    │
  │ ┌────────────────────────────┐                   │
  │ │ inputNumber: 10             │                  │
  │ │ result: 10 * 2 = 20        │                  │
  │ └────────────────────────────┘                   │
  │                                                  │
  │ → return 20                                      │
  └──────────────────────────────────────────────────┘

  return 20 → newOutput = 20!

  GLOBAL MEMORY:                    CALL STACK:
  ┌────────────────────┐            ┌──────────┐
  │ num: 3             │            │          │
  │ multiplyBy2: ƒ     │            │  global  │
  │ output: 6          │            └──────────┘
  │ newOutput: 20      │
  └────────────────────┘

  → EC bị XÓA LẦN NỮA!
  → Thread quay lại global!
  → Done!
```

---

## §5. Single-Threaded — Một Thứ Một Lúc, KHÔNG Ngoại Lệ!

### 5.1 Bài Viết: "Did We Run Both At The Same Time?"

> Will: _"Do we run multiplyBy2 the first time AT THE SAME TIME as the second call? No, absolutely not. Did we hit the next line before we finished inside the first execution context? No, we definitely did not."_

```
SINGLE-THREADED — KEY INSIGHT:
═══════════════════════════════════════════════════════════════

  TIMELINE:
  ┌──────────────────────────────────────────────────┐
  │                                                  │
  │ TIME →                                           │
  │                                                  │
  │ ├─── const num = 3                               │
  │ │                                                │
  │ ├─── function multiplyBy2...  (store, skip body) │
  │ │                                                │
  │ ├─── const output = multiplyBy2(3)               │
  │ │    ├── CREATE EC                               │
  │ │    ├── inputNumber = 3                         │
  │ │    ├── result = 6                              │
  │ │    ├── return 6                                │
  │ │    └── DELETE EC ← PHẢI XON XONG!             │
  │ │                                                │
  │ ├─── const newOutput = multiplyBy2(10)           │
  │ │    ├── CREATE EC                               │
  │ │    ├── inputNumber = 10                        │
  │ │    ├── result = 20                             │
  │ │    ├── return 20                               │
  │ │    └── DELETE EC                               │
  │ │                                                │
  │ └─── DONE!                                       │
  │                                                  │
  │ ❌ KHÔNG BAO GIỜ chạy song song!                │
  │ ❌ KHÔNG BAO GIỜ bỏ dang dở 1 dòng!             │
  │ ✅ LUÔN hoàn thành dòng hiện tại trước!          │
  │ ✅ Rồi mới chuyển sang dòng tiếp theo!           │
  │                                                  │
  └──────────────────────────────────────────────────┘

  CALL STACK TIMELINE:
  ┌──────────────────────────────────────────────────┐
  │                                                  │
  │  ┌──────────┐                                    │
  │  │ multiply │                                    │
  │  │ By2(3)   │  ┌──────────┐                      │
  │  ├──────────┤  │ multiply │                      │
  │  │  global  │  │ By2(10)  │                      │
  │  │          │  ├──────────┤                      │
  │  │          │  │  global  │                      │
  │  └──────────┘  └──────────┘                      │
  │  ←── t1 ──→  ←── t2 ──→                         │
  │                                                  │
  │  NEVER overlapping! Sequential!                  │
  │                                                  │
  └──────────────────────────────────────────────────┘

  Will: "JavaScript can only do ONE thing at a time.
  I am ABSOLUTELY CERTAIN I do things LINE BY LINE."
```

---

## §6. Tại Sao Cần Review? — Setup Cho Async!

```
TẠI SAO REVIEW? — VẤN ĐỀ SẮP TỚI:
═══════════════════════════════════════════════════════════════

  SYNC = OK cho code đơn giản:
  ┌──────────────────────────────────────────────────┐
  │ const x = 3 * 2;        // instant!             │
  │ const y = x + 1;        // instant!             │
  │ console.log(y);          // instant!             │
  └──────────────────────────────────────────────────┘

  NHƯNG... web applications CẦN:
  ┌──────────────────────────────────────────────────┐
  │ → Fetch data từ server (200ms - 2000ms!)         │
  │ → User clicks button (bất kỳ lúc nào!)          │
  │ → Timer chạy sau 5 giây                          │
  │ → File upload (có thể vài giây!)                 │
  │                                                  │
  │ NẾU SINGLE-THREADED:                             │
  │ → Fetch server... ĐỨNG YÊN CHỜ 2 giây???       │
  │ → User KHÔNG click được gì!                     │
  │ → UI ĐÓNG BĂNG!                                 │
  │ → = TERRIBLE user experience! 💀                │
  └──────────────────────────────────────────────────┘

  GIẢI PHÁP:
  → KHÔNG phải JS tự làm async!
  → WEB BROWSER cung cấp features!
  → setTimeout, fetch, DOM = BROWSER features!
  → JS "giao việc" cho browser, tiếp tục chạy!
  → Khi browser XONG → callback/promise → JS chạy tiếp!
  → = EVENT LOOP!

  → Phải hiểu SYNC HOÀN HẢO trước!
  → Vì async = sync rules + THÊM event loop rules!
```

---

## §7. Tự Implement: Execution Context Simulator

```javascript
// CHỨNG MINH 1: Simulate call stack

class CallStack {
  constructor() {
    this.stack = ["global()"];
    this.log = [];
    this._log("START: global() is on the call stack");
  }

  _log(message) {
    const indent = "  ".repeat(this.stack.length - 1);
    const entry = `${indent}${message}`;
    this.log.push(entry);
    console.log(entry);
  }

  push(funcName) {
    this.stack.push(funcName);
    this._log(`PUSH: ${funcName} → top of stack`);
    this._log(`Stack: [${this.stack.join(" → ")}]`);
  }

  pop() {
    const removed = this.stack.pop();
    this._log(`POP: ${removed} finished → removed`);
    this._log(`Stack: [${this.stack.join(" → ")}]`);
    return removed;
  }

  current() {
    return this.stack[this.stack.length - 1];
  }
}

// Simulate the code from the lesson:
const cs = new CallStack();
// global() is already on stack

// Line 1: const num = 3
cs._log("Line 1: const num = 3 (stored in global memory)");

// Line 2: function multiplyBy2 (stored, body skipped!)
cs._log("Line 2: store function multiplyBy2 (skip body!)");

// Line 6: const output = multiplyBy2(3)
cs._log("Line 6: const output = multiplyBy2(3)");
cs.push("multiplyBy2(3)");
cs._log("  Local: inputNumber = 3");
cs._log("  Local: result = 3 * 2 = 6");
cs._log("  return 6 → output = 6");
cs.pop();

// Line 7: const newOutput = multiplyBy2(10)
cs._log("Line 7: const newOutput = multiplyBy2(10)");
cs.push("multiplyBy2(10)");
cs._log("  Local: inputNumber = 10");
cs._log("  Local: result = 10 * 2 = 20");
cs._log("  return 20 → newOutput = 20");
cs.pop();

cs._log("DONE! All code executed synchronously.");
```

```javascript
// CHỨNG MINH 2: Execution Context model

class ExecutionContext {
  constructor(name) {
    this.name = name;
    this.localMemory = {};
    this.returnValue = undefined;
  }

  declare(varName, value) {
    this.localMemory[varName] = value;
    console.log(`  [${this.name}] declare: ${varName} = ${value}`);
  }

  setReturn(value) {
    this.returnValue = value;
    console.log(`  [${this.name}] return: ${value}`);
  }

  destroy() {
    console.log(`  [${this.name}] EC DESTROYED! ❌`);
    console.log(`  Local memory wiped: ${JSON.stringify(this.localMemory)}`);
    this.localMemory = null;
  }
}

// Simulate:
console.log("=== GLOBAL EXECUTION CONTEXT ===");
const globalEC = new ExecutionContext("global");
globalEC.declare("num", 3);
globalEC.declare("multiplyBy2", "ƒ(inputNumber){...}");

// First call:
console.log("\n=== CALL: multiplyBy2(3) ===");
const ec1 = new ExecutionContext("multiplyBy2#1");
ec1.declare("inputNumber", 3); // parameter = argument
ec1.declare("result", 3 * 2); // computation
ec1.setReturn(6); // return
globalEC.declare("output", ec1.returnValue);
ec1.destroy();

// Second call:
console.log("\n=== CALL: multiplyBy2(10) ===");
const ec2 = new ExecutionContext("multiplyBy2#2");
ec2.declare("inputNumber", 10);
ec2.declare("result", 10 * 2);
ec2.setReturn(20);
globalEC.declare("newOutput", ec2.returnValue);
ec2.destroy();

console.log("\n=== FINAL GLOBAL MEMORY ===");
console.log(globalEC.localMemory);
// { num: 3, multiplyBy2: 'ƒ...', output: 6, newOutput: 20 }
```

```javascript
// CHỨNG MINH 3: Single-threaded proof

console.log("Line 1: START");

function slowFunction() {
  // Simulate heavy computation
  const start = Date.now();
  while (Date.now() - start < 1000) {
    // Block for 1 second!
  }
  return "done";
}

console.log("Line 2: Before slow function");
const result = slowFunction();
// Line 3 DOES NOT EXECUTE until slowFunction finishes!
console.log("Line 3: After slow function —", result);
// This proves: JavaScript waits, BLOCKS, until function completes!
// = SYNCHRONOUS! = SINGLE-THREADED!

// THE PROBLEM:
// If slowFunction takes 5 seconds → UI freezes for 5 seconds!
// → This is WHY we need async!
// → Solution = hand work to BROWSER, continue in JS!
```

---

## §8. 🔬 Deep Analysis Patterns — 6 Tư Duy Phân Tích Sâu

### 8.1 Pattern ①: 5 Whys — Single-Threaded

```
5 WHYS: TẠI SAO JS SINGLE-THREADED?
═══════════════════════════════════════════════════════════════

  WHY ①: Tại sao JS chỉ có 1 thread?
  └→ Vì JS được thiết kế cho DOM manipulation!
     Nếu 2 threads cùng modify 1 DOM element
     → RACE CONDITION! → UI corrupted!

  WHY ②: Tại sao race condition nguy hiểm?
  └→ VD: Thread A xóa button, Thread B click button
     → Button đã bị xóa nhưng vẫn có click event!
     → UNDEFINED BEHAVIOR!

  WHY ③: Tại sao không dùng locks (như Java)?
  └→ Vì Brendan Eich thiết kế JS trong 10 ngày!
     Locks = complex! Deadlocks! Priority inversion!
     Single-thread = SIMPLE! Predictable!

  WHY ④: Tại sao vẫn fast dù single-threaded?
  └→ Vì ASYNC! JS giao heavy work cho browser!
     Browser = multi-threaded (network, rendering...)
     JS chỉ orchestrate = event loop!

  WHY ⑤: Tại sao model này successful?
  └→ Vì PREDICTABLE! Code chạy đúng thứ tự!
     Không cần lo race conditions!
     Event loop = elegant solution!
     Node.js chứng minh: single-thread + async = scales!
```

### 8.2 Pattern ②: First Principles

```
FIRST PRINCIPLES — EXECUTION CONTEXT TRONG SPEC:
═══════════════════════════════════════════════════════════════

  9.4 Execution Contexts (ECMAScript Spec):

  → "An execution context is a specification device
     used to track the runtime evaluation of code."

  → Mỗi EC có:
     → code evaluation state (đang ở dòng nào?)
     → Function (nếu function code)
     → Realm (global object, built-ins)
     → LexicalEnvironment (biến let/const)
     → VariableEnvironment (biến var)

  → "The running execution context is always the
     TOP element of the execution context stack."

  → = CALL STACK! Top = đang chạy!

  9.4.1 GetActiveScriptOrModule:
  → Scan stack từ top → tìm active script
  → = Cách JS biết đang chạy code ở đâu!
```

### 8.3 Pattern ③: Trade-off Analysis

```
TRADE-OFFS: SINGLE-THREADED vs MULTI-THREADED:
═══════════════════════════════════════════════════════════════

  ┌──────────────────┬──────────────────┬──────────────────┐
  │                  │ SINGLE-THREADED  │ MULTI-THREADED   │
  ├──────────────────┼──────────────────┼──────────────────┤
  │ Simplicity       │ SIMPLE ✅        │ Complex ❌       │
  │ Predictability   │ Deterministic ✅ │ Race conditions! │
  │ CPU utilization  │ 1 core only ❌   │ All cores ✅     │
  │ Blocking         │ UI freezes! ❌   │ Other threads OK │
  │ Debugging        │ Easy ✅          │ Hard! ❌         │
  │ Memory           │ No shared state  │ Shared memory    │
  │ Solution         │ ASYNC (event     │ Locks, mutexes   │
  │                  │  loop!) ✅       │ (complex!)       │
  ├──────────────────┼──────────────────┼──────────────────┤
  │ Languages        │ JavaScript       │ Java, C++, Go    │
  │                  │ Python (GIL)     │ Rust              │
  └──────────────────┴──────────────────┴──────────────────┘

  JS SOLUTION:
  → Single-threaded JS + Multi-threaded browser!
  → Best of both worlds!
  → JS = simple, predictable
  → Browser = parallel network, rendering, timers!
```

### 8.4 Pattern ④: Mental Mapping

```
MENTAL MAP: JS ENGINE vs BROWSER:
═══════════════════════════════════════════════════════════════

  ┌─────────────────────────────────────────────────────────┐
  │ BROWSER (multi-threaded!):                              │
  │ ┌─────────────────────────────────────────────────────┐ │
  │ │                                                     │ │
  │ │  ┌──────────────┐  ┌────────────────────────────┐   │ │
  │ │  │ JS ENGINE    │  │ WEB APIs (browser threads!) │  │ │
  │ │  │ (V8)         │  │                            │  │ │
  │ │  │              │  │ → Network thread (fetch!)  │  │ │
  │ │  │ Single       │  │ → Timer thread (setTimeout)│  │ │
  │ │  │ Thread       │  │ → DOM/Render thread        │  │ │
  │ │  │ ↓            │  │ → Storage thread           │  │ │
  │ │  │ Call Stack   │  │ → Geolocation thread       │  │ │
  │ │  │ Memory       │  │                            │  │ │
  │ │  │ Event Loop ←─┼──┤ → Results pushed to queues │  │ │
  │ │  └──────────────┘  └────────────────────────────┘   │ │
  │ │                                                     │ │
  │ │  ┌────────────────┐  ┌────────────────────────┐     │ │
  │ │  │ CALLBACK QUEUE │  │ MICROTASK QUEUE        │     │ │
  │ │  │ (setTimeout,   │  │ (Promise.then,         │     │ │
  │ │  │  click, etc.)  │  │  queueMicrotask, etc.) │     │ │
  │ │  └────────────────┘  └────────────────────────┘     │ │
  │ └─────────────────────────────────────────────────────┘ │
  └─────────────────────────────────────────────────────────┘

  → JS = 1 thread = simple!
  → Browser = nhiều threads = parallel!
  → Event loop = bridge!
  → SẼ HỌC CHI TIẾT ở bài tiếp theo!
```

### 8.5 Pattern ⑤: Reverse Engineering

```javascript
// TỰ BUILD: Full JavaScript runtime model

class JSRuntime {
  constructor() {
    this.globalMemory = {};
    this.callStack = [{ name: "global", memory: this.globalMemory }];
    this.functions = {};
  }

  declareVariable(name, value) {
    const currentEC = this.callStack[this.callStack.length - 1];
    currentEC.memory[name] = value;
    console.log(`[${currentEC.name}] ${name} = ${JSON.stringify(value)}`);
  }

  declareFunction(name, params, body) {
    this.functions[name] = { params, body };
    this.globalMemory[name] = `ƒ ${name}(${params.join(", ")})`;
    console.log(`[global] function ${name} stored (body skipped!)`);
  }

  callFunction(name, args) {
    const func = this.functions[name];
    if (!func) throw new Error(`${name} is not defined!`);

    // Create new EC:
    const localMemory = {};
    const ec = { name: `${name}()`, memory: localMemory };

    // Push to call stack:
    this.callStack.push(ec);
    console.log(`\n--- CALL: ${name}(${args.join(", ")}) ---`);
    console.log(
      `Call Stack: [${this.callStack.map((e) => e.name).join(" → ")}]`,
    );

    // Assign parameters:
    func.params.forEach((param, i) => {
      localMemory[param] = args[i];
      console.log(`  [local] ${param} = ${args[i]}`);
    });

    // Execute body:
    const returnValue = func.body(localMemory);
    console.log(`  [return] ${returnValue}`);

    // Pop from call stack:
    this.callStack.pop();
    console.log(`--- END: ${name}() → EC destroyed ---`);
    console.log(
      `Call Stack: [${this.callStack.map((e) => e.name).join(" → ")}]`,
    );

    return returnValue;
  }
}

// Run the lesson's code:
const runtime = new JSRuntime();

runtime.declareVariable("num", 3);
runtime.declareFunction("multiplyBy2", ["inputNumber"], (local) => {
  local.result = local.inputNumber * 2;
  console.log(`  [local] result = ${local.inputNumber} * 2 = ${local.result}`);
  return local.result;
});

const output = runtime.callFunction("multiplyBy2", [3]);
runtime.declareVariable("output", output);

const newOutput = runtime.callFunction("multiplyBy2", [10]);
runtime.declareVariable("newOutput", newOutput);

console.log("\n=== FINAL STATE ===");
console.log("Global Memory:", runtime.globalMemory);
```

### 8.6 Pattern ⑥: Lịch Sử

```
LỊCH SỬ: ASYNC EVOLUTION TRONG JS:
═══════════════════════════════════════════════════════════════

  1995: JavaScript 1.0 — SYNCHRONOUS ONLY!
  │     → setTimeout() = first async (DOM API!)
  │     → KHÔNG PHẢI JS feature — BROWSER feature!
  │
  ↓
  1999: XMLHttpRequest (IE5!)
  │     → First AJAX!
  │     → Callback-based async!
  │     → "Callback hell" begins... 💀
  │
  ↓
  2009: Node.js — JS on server!
  │     → Event loop model = CORE of Node!
  │     → Proves: single-thread + async = scales!
  │     → EVERYTHING async: fs, http, dns...
  │
  ↓
  2012: Promises (libraries: Bluebird, Q, when.js)
  │     → Solve callback hell!
  │     → .then().then().then() = chaining!
  │
  ↓
  2015: ES2015 — Promises NATIVE!
  │     → Will: "Most significant ES6 feature!"
  │     → Microtask queue introduced!
  │     → fetch() replaces XMLHttpRequest!
  │
  ↓
  2017: ES2017 — async/await!
  │     → Syntactic sugar for Promises!
  │     → Looks synchronous but IS async!
  │     → "Best of both worlds!"
  │
  ↓
  2024: Top-level await, AbortController mature
        → Abort promises when needed!
        → Will: "Not just send off work and that's
          the end — but ABORT those promises!"

  → Part 5 sẽ cover TOÀN BỘ journey này!
```

```
TÓM TẮT 6 PATTERNS:
═══════════════════════════════════════════════════════════════

  ① 5 WHYS         → Single-threaded vì DOM safety,
                      async = delegate to browser threads!

  ② FIRST PRINCIPLES→ Spec 9.4: EC stack, top = running,
                      LexicalEnv + VariableEnv

  ③ TRADE-OFFS     → Single (simple, predictable) vs
                      Multi (parallel, race conditions)

  ④ MENTAL MAPPING → JS engine (1 thread) inside
                      Browser (multi-thread) + event loop bridge

  ⑤ RE-IMPLEMENT   → JSRuntime class with callStack,
                      EC creation/destruction lifecycle

  ⑥ HISTORY        → 1995 sync → 1999 AJAX → 2015 Promises
                      → 2017 async/await → modern abort!
```

---

## Self-Assessment Checklist

```
CHECKLIST — SAU KHI HỌC PHẦN 5.1:
═══════════════════════════════════════════════════════════════

  3 COMPONENTS:
  [ ] Thread of execution — line by line, ONE at a time!
  [ ] Memory — global (persistent) + local (ephemeral!)
  [ ] Call stack — tracks where we are (LIFO!)

  EXECUTION CONTEXT:
  [ ] Function call → CREATE new EC!
  [ ] EC has: local memory + thread position
  [ ] return → value goes OUT, EC DESTROYED!
  [ ] Call stack: push on call, pop on return!

  SINGLE-THREADED:
  [ ] JS = 1 thread duy nhất!
  [ ] KHÔNG chạy song song 2 functions!
  [ ] HOÀN THÀNH dòng hiện tại trước khi tiếp theo!
  [ ] Blocking = UI freeze! → CẦN async!

  TIẾP THEO → Phần 5.2: Web Browser APIs & setTimeout!
```
