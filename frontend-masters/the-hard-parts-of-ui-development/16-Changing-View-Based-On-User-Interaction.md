# The Hard Parts of UI Development — Phần 16: Changing View Based on User Interaction — "Execution Context, Setter, Pixels!"

> 📅 2026-03-08 · ⏱ 30 phút đọc
>
> Nguồn: Frontend Masters — Will Sentance
> Khoá học: The Hard Parts of UI Development
> Bài: Changing View Based on User Interaction — "User Click → handleClick → Clear Input!"
> Độ khó: ⭐️⭐️⭐️⭐️ | Advanced — callback queue, execution context, setter in action, reasoning about state!

---

## Mục Lục

| #   | Phần                                                             |
| --- | ---------------------------------------------------------------- |
| 1   | System Ready — "Locked and Loaded!"                              |
| 2   | User Click → Callback Queue — "Pink for User Actions!"           |
| 3   | Event Loop → Call Stack — "One Minute, No Code Running!"         |
| 4   | Execution Context — "Brand New Context!"                         |
| 5   | Reasoning About State & View — "Tại Sao Clear Input?"            |
| 6   | Ian: Setter Verbalization — "No Pixels Where There Were Pixels!" |
| 7   | Tự Implement: User Click Flow Mô Phỏng                           |
| 8   | 🔬 Deep Analysis Patterns — State Reasoning & Implicit Data      |

---

## §1. System Ready — "Locked and Loaded!"

> Will: _"Our system is fully set, locked and loaded to receive user action."_

### Bối cảnh — Synchronous code xong!

Will tuyên bố: JavaScript synchronous code **đã chạy xong hoàn toàn**. Call stack trống! Mọi setup đã hoàn tất:

- Data (`post`) đã khai báo
- Accessor objects (`jsInput`, `jsDiv`) đã tạo
- Handlers (`handleClick`, `handleInput`) đã định nghĩa
- Bindings đã gắn vào DOM elements

_"We are now in the land of user action."_ — Bước vào vùng đất của user! Từ đây, mọi thứ xảy ra bất đồng bộ — chỉ khi user hành động!

```
SYSTEM READY:
═══════════════════════════════════════════════════════════════

  JAVASCRIPT:
  ┌──────────────────────────────────────────────────────────┐
  │ MEMORY: post, jsInput, jsDiv, handleClick, handleInput  │
  │ CALL STACK: [ ]         ← TRỐNG!                        │
  │ CALLBACK QUEUE: [ ]     ← TRỐNG!                        │
  │                                                          │
  │ Status: "LOCKED AND LOADED!" 🔒                         │
  └──────────────────────────────────────────────────────────┘

  C++ DOM:
  ┌──────────────────────────────────────────────────────────┐
  │ input: value="What's up?"                                │
  │        handler["click"] → handleClick (ref!)            │
  │        handler["input"] → handleInput (ref!)            │
  │ div:   text=""                                           │
  └──────────────────────────────────────────────────────────┘

  PIXELS: [What's up?______]  |  (div rỗng)
```

---

## §2. User Click → Callback Queue — "Pink for User Actions!"

> Will: _"The first thing they do is click on the input. That is going to send an event to the DOM."_

### User action — Click!

Will dùng **màu hồng** (pink) cho user actions trên bảng: _"We're using pink now for user actions."_

User **click** vào input field:

1. Click event fires trên C++ input element
2. DOM tìm handler["click"] → **handleClick** (reference!)
3. handleClick → **callback queue** ← thêm vào hàng đợi!

Will mô tả rõ: _"User action: handleClick is going to be added to the callback queue."_

Lưu ý: function được thêm vào callback queue **BẢN THÂN NÓ CHƯA CHẠY**! Chỉ là reference nằm trong queue, chờ event loop!

```
USER CLICK → CALLBACK QUEUE:
═══════════════════════════════════════════════════════════════

  T=1min: User CLICK vào input! 🖱️ (Pink!)

  ① Click event fires trên C++ input
  ┌──────────────────────────────────────────────────────────┐
  │ C++ input: handler["click"] → handleClick              │
  │ → TÌM handler cho event "click" → FOUND!              │
  └──────────────────────────────────────────────────────────┘

  ② handleClick → callback queue
  ┌──────────────────────────────────────────────────────────┐
  │ CALLBACK QUEUE: [ handleClick ]                          │
  │                   ↑ chờ event loop!                      │
  │                                                          │
  │ Lưu ý: handleClick CHƯA CHẠY!                          │
  │ Chỉ là reference nằm trong queue!                       │
  └──────────────────────────────────────────────────────────┘
```

---

## §3. Event Loop → Call Stack — "One Minute, No Code Running!"

> Will: _"The event loop checks: is there anything still being executed in JavaScript? No. At one minute there is no code still running here."_

### Event loop kiểm tra

Event loop hỏi: **"Call stack trống?"** → Đã 1 phút kể từ setup → YES, trống!

Will nhấn mạnh: _"Let's say this is at one minute. Is there any code still running here? No, you bet there is not."_ — Rõ ràng, dứt khoát!

handleClick → **lên call stack** + JavaScript **tự thêm `()`** (parentheses) → function chạy!

Will chuyển sang **màu cam** (orange) cho JavaScript actions: _"Orange for JavaScript action!"_

```
EVENT LOOP → CALL STACK:
═══════════════════════════════════════════════════════════════

  Event Loop:
  ┌──────────────────────────────────────────────────────────┐
  │ ① Check: Call stack trống?                               │
  │    → Đã 1 phút! YES! ✅                                │
  │                                                          │
  │ ② Move: handleClick → call stack                         │
  │    → JavaScript thêm () tự động!                        │
  │    → handleClick() CHẠY!                                │
  └──────────────────────────────────────────────────────────┘

  CALLBACK QUEUE: [ ]        ← handleClick đã RỜI!
  CALL STACK:     [ handleClick() ]  ← ĐANG CHẠY!

  Will: "At ONE MINUTE there is NO CODE still running.
         And so handleClick goes on the call stack."
```

---

## §4. Execution Context — "Brand New Context!"

> Will: _"We're going to execute handleClick which is going to open a brand new... execution context."_

### Execution context mới!

Will hỏi cả lớp: handleClick chạy → mở gì? Tất cả đồng thanh: _"Execution context!"_ Will khen: _"Beautiful. Hopefully our online community are all shouting execution context as well!"_ 😄

Bên trong handleClick:

```javascript
function handleClick() {
  jsInput.value = ""; // ← DUY NHẤT 1 dòng!
}
```

Execution context mới → local memory (rỗng — không có variables) → xử lý dòng: `jsInput.value = ""`

```
EXECUTION CONTEXT — handleClick():
═══════════════════════════════════════════════════════════════

  CALL STACK: [ handleClick() ]

  EXECUTION CONTEXT:
  ┌──────────────────────────────────────────────────────────┐
  │ handleClick()                                            │
  │                                                          │
  │ LOCAL MEMORY: (trống! không có variables)                │
  │                                                          │
  │ CODE: jsInput.value = "";                                │
  │       ↓                                                  │
  │ ① Tìm jsInput → global memory → accessor object!      │
  │ ② .value = SETTER!                                      │
  │ ③ → hidden link → C++ input element                    │
  │ ④ → set value = ""                                      │
  │ ⑤ → render → pixels thay đổi!                         │
  └──────────────────────────────────────────────────────────┘

  Will: "Open a BRAND NEW execution context!"
  Class: "EXECUTION CONTEXT!" (đồng thanh!) 🎉
```

---

## §5. Reasoning About State & View — "Tại Sao Clear Input?"

> Will: _"That scene was called reasoning about state and view."_

### Bối cảnh — Will đặt tên cho quá trình suy luận

Will dừng lại để **đặt tên** cho quá trình tư duy mà tất cả đang làm: **"Reasoning about State and View"** — suy luận về data VÀ những gì user thấy dựa trên user interaction.

_"The user is changing what they see. And I guess implicitly changing the data via us."_

Nhưng Will nhận ra điều thú vị: trong handleClick, chúng ta **không thực sự track data** trong JavaScript! Chỉ gửi string literal `""` trực tiếp qua setter → đây là **ad-hoc** approach — thay đổi view mà KHÔNG cập nhật state!

_"We're not really tracking the data in JavaScript there, are we? We're taking a string literal in line 5... and then we're doing that again here with an empty string."_

Đây chính là vấn đề mà **one-way data binding** giải quyết: PHẢI track data, PHẢI cập nhật state TRƯỚC → rồi mới update view!

```
REASONING ABOUT STATE & VIEW:
═══════════════════════════════════════════════════════════════

  AD-HOC (hiện tại):
  ┌──────────────────────────────────────────────────────────┐
  │ handleClick() {                                          │
  │   jsInput.value = "";  ← trực tiếp gán string literal!│
  │                           → KHÔNG track trong post!     │
  │                           → post vẫn = ""!             │
  │ }                                                        │
  │                                                          │
  │ → "We're NOT REALLY tracking the data." — Will          │
  │ → Implicit data change = DANGEROUS!                     │
  └──────────────────────────────────────────────────────────┘

  ONE-WAY (paradigm):
  ┌──────────────────────────────────────────────────────────┐
  │ handleClick() {                                          │
  │   post = "";           ← CẬP NHẬT state!              │
  │   dataToView();        ← converter quyết view!         │
  │ }                                                        │
  │                                                          │
  │ → Track data CHÍNH XÁC!                                │
  │ → View = f(data)!                                       │
  │ → PREDICTABLE!                                          │
  └──────────────────────────────────────────────────────────┘

  "That scene was called REASONING ABOUT STATE AND VIEW.
   Reasoning about the data and what the user sees
   based on user interaction." — Will
```

---

## §6. Ian: Setter Verbalization — "No Pixels Where There Were Pixels!"

> Ian: _"We will end up with not pixels where they used to be."_
> Will: _"No pixels where there were pixels. Beautiful!"_

### Ian mô tả setter flow

Will mời Ian verbalize dòng `jsInput.value = ""`:

**Ian** mô tả từng bước hoàn hảo:

1. _"jsInput is gonna be our accessor object for that input that we queried earlier."_
2. _"We're accessing the setter for value."_
3. _"And assigning an empty string literal."_
4. _"Because it's an accessor object, it's gonna happen over there [in C++ land]."_

Will hỏi: pixels thay đổi thế nào? Ian trả lời cực hay:

_"We will end up with NOT PIXELS where they used to be."_

Will: _"No pixels where there WERE pixels. Beautiful!"_ — Chỗ trước đó có text "What's up?" → giờ KHÔNG CÓ pixels! Text biến mất!

```
SETTER FLOW — Ian's Verbalization:
═══════════════════════════════════════════════════════════════

  jsInput.value = "";

  Ian's walkthrough:
  ┌──────────────────────────────────────────────────────────┐
  │ ① "jsInput is our ACCESSOR OBJECT"                      │
  │     → Tìm jsInput trong JS memory ✅                    │
  │                                                          │
  │ ② "Accessing the SETTER for value"                      │
  │     → .value = SETTER (không regular property!) ✅     │
  │                                                          │
  │ ③ "Assigning an EMPTY STRING LITERAL"                   │
  │     → "" → giá trị mới ✅                              │
  │                                                          │
  │ ④ "Because it's an accessor object, it's gonna          │
  │     happen over there [in C++ land]"                     │
  │     → hidden link → C++ input.value = "" ✅            │
  │                                                          │
  │ ⑤ Render → "NOT PIXELS where they USED TO BE!"         │
  └──────────────────────────────────────────────────────────┘

  PIXELS:
  TRƯỚC: [What's up?______]  ← có chữ!
  SAU:   [________________]  ← TRỐNG! "No pixels!" ✅

  Ian: "Not pixels where they USED TO BE."
  Will: "No pixels where there WERE pixels. BEAUTIFUL!" 😄

  → handleClick XONG! Pop khỏi call stack!
```

---

## §7. Tự Implement: User Click Flow Mô Phỏng

```javascript
// ═══════════════════════════════════════════════════
// Mô phỏng — User Click → handleClick Full Flow!
// Event loop, callback queue, execution context!
// ═══════════════════════════════════════════════════

// ── C++ DOM ──

class CppElement {
  constructor(type) {
    this.type = type;
    this.value = "";
    this.text = "";
    this._handlers = {};
  }
  setHandler(ev, fn) {
    this._handlers[ev] = fn;
  }
  fireEvent(ev) {
    console.log(`  ⚡ C++: event "${ev}" on ${this.type}!`);
    return this._handlers[ev] || null;
  }
}

// ── Accessor Object ──

function createAccessor(el) {
  const obj = {};
  Object.defineProperty(obj, "value", {
    get() {
      console.log(`    → GETTER: C++ ${el.type}.value = "${el.value}"`);
      return el.value;
    },
    set(v) {
      console.log(`    → SETTER: C++ ${el.type}.value = "${v}"`);
      el.value = v;
      // Render!
      if (v === "") {
        console.log(`    🖥️ Render: NO PIXELS where there were pixels!`);
      } else {
        console.log(`    🖥️ Render: "${v}" → pixels!`);
      }
    },
  });
  Object.defineProperty(obj, "oninput", {
    set(fn) {
      el.setHandler("input", fn);
    },
  });
  Object.defineProperty(obj, "onclick", {
    set(fn) {
      el.setHandler("click", fn);
    },
  });
  return obj;
}

// ── Event Loop ──

class EventLoop {
  constructor() {
    this.callbackQueue = [];
    this.callStack = [];
  }

  enqueue(name, fn) {
    this.callbackQueue.push({ name, fn });
    console.log(`  📋 Callback queue ← ${name}`);
  }

  tick() {
    if (this.callbackQueue.length === 0) return false;

    console.log(`  🔄 Event loop: call stack trống? ✅`);
    const task = this.callbackQueue.shift();
    console.log(`  🔄 ${task.name} → call stack + ()!`);

    // Execution context!
    console.log(`  📦 NEW execution context: ${task.name}()`);
    this.callStack.push(task.name);
    task.fn();
    this.callStack.pop();
    console.log(`  📦 ${task.name}() done → pop call stack!`);

    return true;
  }
}

// ═══ DEMO: Full Click Flow ═══

console.log("═══ USER CLICK FLOW ═══\n");

// Setup
const input = new CppElement("input");
const div = new CppElement("div");
const jsInput = createAccessor(input);
const loop = new EventLoop();

// Set default text
console.log("── Setup ──");
jsInput.value = "What's up?";

// Define handler
function handleClick() {
  jsInput.value = ""; // Clear input!
}

// Bind handler
jsInput.onclick = handleClick;
console.log("  🔧 onclick handler bound!");
console.log("  System: LOCKED AND LOADED! 🔒\n");

// ── User click! ──
console.log("── T=1min: User CLICK! 🖱️ (Pink!) ──");
const handler = input.fireEvent("click");
if (handler) {
  loop.enqueue("handleClick", handler);
}

console.log("\n── Event Loop Processing ──");
loop.tick();

console.log(`\n── Result ──`);
console.log(`  input.value = "${input.value}"`);
console.log(
  `  Pixels: ${input.value === "" ? "[________________]" : `[${input.value}]`}`,
);
console.log(`  ✅ Default text CLEARED!`);

// ── KEY INSIGHT ──
console.log("\n── Reasoning About State & View ──");
console.log('  Will: "We\'re NOT REALLY tracking data in JS!"');
console.log('  → post vẫn = "" → data KHÔNG được update!');
console.log("  → Ad-hoc approach → ONE-WAY sẽ fix!");
```

---

## §8. 🔬 Deep Analysis Patterns — State Reasoning & Implicit Data

### 8.1 Pattern ①: Implicit vs Explicit Data Changes

```
IMPLICIT vs EXPLICIT DATA CHANGES:
═══════════════════════════════════════════════════════════════

  IMPLICIT (ad-hoc — nguy hiểm!):
  ┌──────────────────────────────────────────────────────────┐
  │ handleClick() {                                          │
  │   jsInput.value = "";  ← "What's up?" biến mất!       │
  │ }                                                        │
  │                                                          │
  │ → Data thay đổi ở ĐÂU?                                │
  │ → "What's up?" ĐÃ TỪNG tồn tại ở post? KHÔNG!        │
  │ → post vẫn = "" → JS data KHÔNG phản ánh view!        │
  │ → "Implicitly changing the data VIA US." — Will        │
  │ → NGUY HIỂM! View ≠ f(data)!                          │
  └──────────────────────────────────────────────────────────┘

  EXPLICIT (one-way — an toàn!):
  ┌──────────────────────────────────────────────────────────┐
  │ handleClick() {                                          │
  │   post = "";       ← DATA thay đổi rõ ràng!           │
  │   dataToView();    ← view auto-sync!                    │
  │ }                                                        │
  │                                                          │
  │ → Biết chính xác data gì thay đổi!                    │
  │ → post = "" → dataToView → view = f(data) ✅          │
  └──────────────────────────────────────────────────────────┘
```

### 8.2 Pattern ②: User Action Color Coding

```
WILL'S COLOR SYSTEM (trên whiteboard):
═══════════════════════════════════════════════════════════════

  🟢 GREEN / 🩷 PINK — User Actions!
  ┌──────────────────────────────────────────────────────────┐
  │ → User click, user type, user scroll                    │
  │ → Xảy ra BÊN NGOÀI JavaScript!                        │
  │ → Không predictable — bất kỳ lúc nào!                 │
  └──────────────────────────────────────────────────────────┘

  🟠 ORANGE — JavaScript Actions!
  ┌──────────────────────────────────────────────────────────┐
  │ → handleClick() chạy, setter gọi, getter gọi           │
  │ → Xảy ra BÊN TRONG JavaScript!                        │
  │ → Predictable — theo code đã viết!                     │
  └──────────────────────────────────────────────────────────┘

  🔵 BLUE — C++ DOM Actions!
  ┌──────────────────────────────────────────────────────────┐
  │ → Event fires, handler lookup, DOM update               │
  │ → Xảy ra trong C++ runtime!                            │
  └──────────────────────────────────────────────────────────┘
```

### 8.3 Pattern ③: Timeline Tổng Hợp

```
TIMELINE — USER CLICK:
═══════════════════════════════════════════════════════════════

  T=0ms:     Setup code chạy (synchronous)
  T=~50ms:   Setup XONG! Call stack trống!
  T=50ms-60s: Hệ thống CHỜ... "locked and loaded!"
  T=60000ms: 🩷 USER CLICK! (pink!)
  T=60000ms: 🔵 C++ DOM: event "click" fires!
  T=60000ms: 🔵 C++ DOM: tìm handler → handleClick!
  T=60000ms: 📋 handleClick → callback queue!
  T=60001ms: 🔄 Event loop: call stack trống? ✅
  T=60001ms: 🟠 handleClick → call stack + ()!
  T=60001ms: 🟠 Execution context mới!
  T=60001ms: 🟠 jsInput.value = "" → SETTER!
  T=60001ms: 🔵 C++ input.value = ""
  T=60001ms: 🖥️ Render: "No pixels where there were pixels!"
  T=60002ms: 🟠 handleClick() DONE → pop call stack!

  "That is our handleClick FINISHED." — Will ✅
```

---

## Self-Assessment Checklist

```
CHECKLIST — SAU KHI HỌC PHẦN 16:
═══════════════════════════════════════════════════════════════

  SYSTEM READY:
  [ ] Synchronous code XONG → call stack trống!
  [ ] "Locked and loaded to receive user action!"
  [ ] Bước vào "land of user action" — async!

  USER CLICK → handleClick:
  [ ] Click event fires trên C++ input!
  [ ] handleClick → callback queue!
  [ ] Event loop check → call stack trống → GO!
  [ ] handleClick → call stack + ()!
  [ ] Execution context MỚI!

  SETTER IN ACTION:
  [ ] jsInput.value = "" → setter!
  [ ] → hidden link → C++ input.value = ""!
  [ ] → render → "no pixels where there were pixels!"

  REASONING ABOUT STATE & VIEW:
  [ ] Quá trình suy luận data ↔ view!
  [ ] Ad-hoc: KHÔNG track data trong JS!
  [ ] Implicit data changes = NGUY HIỂM!
  [ ] One-way: track data → dataToView → safe!

  TIẾP THEO → Phần 17: Data-to-View Converter!
```
