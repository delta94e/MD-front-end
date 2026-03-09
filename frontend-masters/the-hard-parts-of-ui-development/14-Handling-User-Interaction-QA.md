# The Hard Parts of UI Development — Phần 14: Handling User Interaction Q&A — "Full UI, Callback Queue, Micro Tasks!"

> 📅 2026-03-08 · ⏱ 30 phút đọc
>
> Nguồn: Frontend Masters — Will Sentance
> Khoá học: The Hard Parts of UI Development
> Bài: Handling User Interaction Q&A — "Summary, Imperative DOM, Task Queue vs Micro Task Queue!"
> Độ khó: ⭐️⭐️⭐️⭐️ | Advanced — tổng kết user interaction, imperative DOM performance, queue priorities!

---

## Mục Lục

| #   | Phần                                                       |
| --- | ---------------------------------------------------------- |
| 1   | Tổng Kết — "Full User Interface = Goal 1 + Goal 2!"        |
| 2   | No Propagation — "Mỗi Lần Data Thay Đổi → Manual Update!"  |
| 3   | Imperative DOM Insight — "Tại Sao Hàng Trăm Milliseconds!" |
| 4   | Callback Queue vs Micro Task Queue — "Priority VIP Line!"  |
| 5   | Tự Implement: Queue Priority Mô Phỏng                      |
| 6   | 🔬 Deep Analysis Patterns — Queue System & UI Architecture |

---

## §1. Tổng Kết — "Full User Interface = Goal 1 + Goal 2!"

> Will: _"We have a full user interface. Goal 1: display content. Goal 2: enable the user to interact and change that content."_

### Bối cảnh — Will tổng kết toàn bộ

Will dừng lại để tổng kết hệ thống hoàn chỉnh mà chúng ta vừa xây dựng:

**Goal 1 — Display Content:** Data nằm trong JavaScript (vì cần mutable data) → hiển thị lên view thông qua setter properties trên accessor objects → C++ DOM → pixels!

**Goal 2 — Enable User Interaction:** User gõ/click → DOM element **biết** (registered) → handler function saved trên DOM element → user action triggers handler → callback queue → call stack → thay đổi data trong JavaScript → cập nhật view!

Will mô tả luồng cụ thể: _"We went from post being an empty string to 'hi', and then displaying that back on the view."_

```
FULL USER INTERFACE — TỔNG KẾT:
═══════════════════════════════════════════════════════════════

  GOAL 1: DISPLAY CONTENT
  ┌──────────────────────────────────────────────────────────┐
  │ JavaScript Data → Setter → C++ DOM → Pixels! 🖥️       │
  │                                                          │
  │ post = "" → jsDiv.textContent = "" → div.text = ""     │
  │ → Render → user thấy div rỗng!                        │
  └──────────────────────────────────────────────────────────┘

  GOAL 2: USER INTERACTION
  ┌──────────────────────────────────────────────────────────┐
  │ User gõ → DOM registered → callback queue              │
  │ → event loop → call stack → handler chạy              │
  │ → getter (lấy data từ DOM) → thay đổi JS data        │
  │ → setter (đẩy data ra DOM) → pixels thay đổi! 🎉     │
  │                                                          │
  │ post: "" → "hi" → display "hi" trên view!             │
  └──────────────────────────────────────────────────────────┘

  "Users can change what they see. Change the CONTENT.
   Changing what they see based on their ACTION." — Will
```

---

## §2. No Propagation — "Mỗi Lần Data Thay Đổi → Manual Update!"

> Will: _"We have to manually re-update the DOM with our data. There's no propagation."_

### Bối cảnh — Không có tự động sync!

Will nhấn mạnh lại điểm cực kỳ quan trọng: **KHÔNG CÓ propagation** (tự động lan truyền) giữa JavaScript data và DOM. Mỗi khi data thay đổi:

1. Developer phải **thủ công** gọi setter để cập nhật DOM
2. Không có "reactive binding" — data thay đổi ≠ view tự thay đổi
3. _"Every time the data changes here, we have to manually go and update what's seen."_

Đây chính là **truth** (sự thật) của web platform — và là lý do tại sao cần **one-way data binding** (paradigm) để giúp quản lý việc manual update này!

Will cũng nhắc: data PHẢI ở JavaScript vì chỉ JS có **mutable data**: _"It has to be from JavaScript cuz that's where there's mutable data."_

```
NO PROPAGATION — TRUTH CỦA WEB:
═══════════════════════════════════════════════════════════════

  ❌ KHÔNG CÓ tự động sync:
  ┌──────────────────────────────────────────────────────────┐
  │ post = "hi";                                             │
  │ // DOM vẫn hiển thị "" ← KHÔNG TỰ THAY ĐỔI!          │
  │                                                          │
  │ // Phải THỦ CÔNG cập nhật:                              │
  │ jsDiv.textContent = post; // ← BẮT BUỘC!              │
  └──────────────────────────────────────────────────────────┘

  ✅ React/Vue AUTO-SYNC (nhờ paradigm):
  ┌──────────────────────────────────────────────────────────┐
  │ setPost("hi");                                           │
  │ // React auto re-render! View cập nhật!                 │
  │ // Nhưng BÊN DƯỚI vẫn dùng setter THỦ CÔNG!           │
  │ // Framework che giấu sự phức tạp!                      │
  └──────────────────────────────────────────────────────────┘

  "There's NO propagation. Every time the data changes,
   we have to MANUALLY update what's seen." — Will
```

---

## §3. Imperative DOM Insight — "Tại Sao Hàng Trăm Milliseconds!"

> Học viên: _"This is the first time I've understood — it's cuz there's tons of memory being allocated."_

### Bối cảnh — Aha moment về performance!

Một học viên (đã làm imperative DOM nhiều) chia sẻ: _"Having spent a bunch of time in imperative DOM land in the teens, being 'why is it hundreds of milliseconds to change this one thing on this list?' — This is the first time I've UNDERSTOOD — it's cuz there's tons of memory being allocated."_

Lần đầu tiên understand TẠI SAO DOM chậm! Mỗi lần thay đổi DOM:

1. **Accessor object** phải tạo hoặc traverse
2. **Hidden link** phải follow → cross runtime boundary
3. **C++ DOM element** phải cập nhật value
4. **Layout engine** phải tính lại vị trí (reflow!)
5. **Render engine** phải tính lại pixels (repaint!)
6. **Compositor** phải composite layers
7. **Rasterizer** phải tạo image → gửi graphics card

Nhân tất cả bước trên với **1000 elements** → hàng trăm milliseconds!

Will phản hồi nhẹ nhàng: _"Don't think that the one minute is because of anything. The one minute here is just the user was really preparing what to write."_ 😅 (Đùa rằng 1 phút delay trong demo là do user suy nghĩ, không phải performance!)

```
TẠI SAO DOM CHẬM — PERFORMANCE:
═══════════════════════════════════════════════════════════════

  MỖI LẦN THAY ĐỔI 1 DOM ELEMENT:
  ┌──────────────────────────────────────────────────────────┐
  │ ① Accessor object → property lookup                    │
  │ ② Hidden link → cross JS/C++ boundary                  │
  │ ③ C++ element → update value                           │
  │ ④ Layout engine → recalculate positions (REFLOW!)      │
  │ ⑤ Render engine → recalculate pixels (REPAINT!)        │
  │ ⑥ Compositor → composite layers                         │
  │ ⑦ Rasterizer → image → graphics card                   │
  └──────────────────────────────────────────────────────────┘

  × 1 ELEMENT = nhanh (< 1ms)
  × 100 ELEMENTS = chậm (~50ms)
  × 1000 ELEMENTS = RẤT CHẬM (~500ms!)

  "It's cuz there's TONS of memory being allocated."
  — Học viên (epiphany moment! 💡)

  VÌ VẬY REACT DÙNG VIRTUAL DOM:
  → Batch updates! Không update từng element!
  → Diff algorithm! Chỉ update elements THAY ĐỔI!
  → requestAnimationFrame! Sync với render cycle!
```

---

## §4. Callback Queue vs Micro Task Queue — "Priority VIP Line!"

> Will: _"Micro task queue is our Priority VIP line."_

### Câu hỏi — Task Queue vs Micro Task Queue

Học viên hỏi: _"How does the callback queue relate to the task and micro task queues? Is it different and how does it fit priority?"_

Will trả lời rõ ràng:

**Callback Queue = Task Queue:** Chính là một! Will dùng "callback queue" làm tên thân thiện, chính thức gọi là **task queue**. Chứa: event handlers (onclick, oninput), setTimeout, setInterval.

**Micro Task Queue = "VIP Line":** Queue ưu tiên cao hơn! Will gọi là _"Priority VIP line."_ Chứa: Promise `.then()`, async/await, MutationObserver.

**Quy tắc ưu tiên:** Micro task queue **LUÔN được dọn trước** callback queue. Nếu cả hai đều có functions chờ → micro task chạy trước!

Will hỏi ngược: _"Does anyone know what actions in JavaScript put a function in the micro task queue?"_ → Học viên: _"Something asynchronous? If you invoke an async function."_ → Will xác nhận: _"Specifically, async/await under the hood is implementing promises."_

```
CALLBACK QUEUE vs MICRO TASK QUEUE:
═══════════════════════════════════════════════════════════════

  EVENT LOOP — THỨ TỰ ƯU TIÊN:
  ┌──────────────────────────────────────────────────────────┐
  │                                                          │
  │  ① CALL STACK (chạy trước hết!)                         │
  │  ┌──────────────────────────┐                            │
  │  │ global(), handleInput() │                            │
  │  └──────────────────────────┘                            │
  │                │                                          │
  │    khi trống ↓                                           │
  │                                                          │
  │  ② MICRO TASK QUEUE (VIP LINE! 🌟)                     │
  │  ┌──────────────────────────┐                            │
  │  │ Promise.then(), async   │ ← CHẠY TRƯỚC!            │
  │  └──────────────────────────┘                            │
  │                │                                          │
  │    khi trống ↓                                           │
  │                                                          │
  │  ③ CALLBACK QUEUE (task queue)                           │
  │  ┌──────────────────────────┐                            │
  │  │ handleInput, setTimeout │ ← CHẠY SAU!              │
  │  └──────────────────────────┘                            │
  │                                                          │
  └──────────────────────────────────────────────────────────┘

  NGUỒN CỦA MỖI QUEUE:
  ┌──────────────────────────────────────────────────────────┐
  │ CALLBACK QUEUE (task queue):                             │
  │ → Event handlers (onclick, oninput)                     │
  │ → setTimeout, setInterval                                │
  │ → I/O callbacks                                          │
  │                                                          │
  │ MICRO TASK QUEUE (VIP!):                                 │
  │ → Promise .then(), .catch(), .finally()                  │
  │ → async/await (dưới hood = Promise!)                    │
  │ → MutationObserver                                       │
  │ → queueMicrotask()                                       │
  └──────────────────────────────────────────────────────────┘

  VÍ DỤ:
  ┌──────────────────────────────────────────────────────────┐
  │ handleInput → callback queue    ← user gõ             │
  │ fetch().then() → micro task     ← promise resolve      │
  │                                                          │
  │ Event loop: call stack trống?                           │
  │ → CHECK micro task → chạy fetch().then() TRƯỚC!        │
  │ → CHECK callback → chạy handleInput SAU!               │
  │                                                          │
  │ "Micro task queue takes PRECEDENCE over the callback    │
  │  queue for being added to the call stack." — Will        │
  └──────────────────────────────────────────────────────────┘
```

### Will về handler removal

Will cũng bổ sung chi tiết quan trọng mà ông _"should have said"_: khi handleInput được đưa từ callback queue **lên call stack**, nó bị **xóa khỏi callback queue**:

_"I should have said that this callback here, handleInput, which was called back in, has now been REMOVED when it was added to the call stack."_

Nếu có nhiều events xảy ra (user gõ rồi click), chúng **xếp hàng** trong callback queue:

```
MULTIPLE EVENTS — QUEUING:
═══════════════════════════════════════════════════════════════

  User gõ "H" → handleInput vào queue
  User gõ "i" → handleInput vào queue (lại!)
  User click  → handleClick vào queue

  CALLBACK QUEUE: [handleInput, handleInput, handleClick]
                   ↑ chạy trước

  Event Loop:
  ① handleInput lên call stack → XÓA khỏi queue → chạy!
  ② handleInput lên call stack → XÓA khỏi queue → chạy!
  ③ handleClick lên call stack → XÓA khỏi queue → chạy!

  "If there were multiple items in the callback queue,
   handleInput, but then also a click — these would
   all start QUEUING UP, ready to be added to the
   call stack once the previous one has been removed."
   — Will
```

---

## §5. Tự Implement: Queue Priority Mô Phỏng

```javascript
// ═══════════════════════════════════════════════════
// Mô phỏng — Event Loop với Queue Priority!
// Callback Queue vs Micro Task Queue!
// ═══════════════════════════════════════════════════

class EventLoop {
  constructor() {
    this.callStack = [];
    this.callbackQueue = []; // Task queue
    this.microTaskQueue = []; // VIP line!
    this.log = [];
  }

  // Thêm vào callback queue (event handlers)
  addCallback(name, fn) {
    this.callbackQueue.push({ name, fn });
    this.log.push(`📋 Callback queue ← ${name}`);
  }

  // Thêm vào micro task queue (promises)
  addMicroTask(name, fn) {
    this.microTaskQueue.push({ name, fn });
    this.log.push(`⭐ Micro task queue ← ${name} (VIP!)`);
  }

  // Event loop tick
  tick() {
    // ① Micro tasks TRƯỚC! (Priority!)
    while (this.microTaskQueue.length > 0) {
      const task = this.microTaskQueue.shift();
      this.log.push(`  🔄 Micro task → call stack: ${task.name}`);
      this.callStack.push(task.name);
      task.fn();
      this.callStack.pop();
      this.log.push(`  ✅ ${task.name} done → removed!`);
    }

    // ② Callback queue SAU!
    if (this.callbackQueue.length > 0) {
      const task = this.callbackQueue.shift();
      this.log.push(`  🔄 Callback → call stack: ${task.name}`);
      this.callStack.push(task.name);
      task.fn();
      this.callStack.pop();
      this.log.push(`  ✅ ${task.name} done → removed!`);
    }
  }

  // Run tất cả queued items
  drain() {
    while (this.callbackQueue.length > 0 || this.microTaskQueue.length > 0) {
      this.tick();
    }
  }

  printLog() {
    this.log.forEach((l) => console.log(l));
  }
}

// ═══ DEMO ═══

console.log("═══ EVENT LOOP — QUEUE PRIORITY DEMO ═══\n");

const loop = new EventLoop();

// State
let post = "";
const results = [];

// Giả lập: user gõ "Hi" → handleInput vào callback queue
loop.addCallback("handleInput", () => {
  post = "Hi";
  results.push(`  post = "${post}"`);
});

// Giả lập: fetch resolve → .then() vào micro task queue
loop.addMicroTask("fetch.then()", () => {
  results.push(`  fetch resolved! (VIP — chạy TRƯỚC!)`);
});

// Giả lập: user click → handleClick vào callback queue
loop.addCallback("handleClick", () => {
  post = "";
  results.push(`  post cleared!`);
});

// Giả lập: another promise → micro task
loop.addMicroTask("Promise.resolve", () => {
  results.push(`  Promise resolved! (VIP — chạy TRƯỚC!)`);
});

console.log("── Queue Status ──");
console.log(
  `  Callback queue: [${loop.callbackQueue.map((t) => t.name).join(", ")}]`,
);
console.log(
  `  Micro task queue: [${loop.microTaskQueue.map((t) => t.name).join(", ")}]`,
);

console.log("\n── Event Loop Running ──");
loop.drain();
loop.printLog();

console.log("\n── Results (execution order) ──");
results.forEach((r) => console.log(r));

console.log("\n── Key Insight ──");
console.log("  ⭐ Micro tasks (Promise) chạy TRƯỚC callbacks!");
console.log("  📋 Callbacks (event handlers) chạy SAU!");
console.log('  Will: "Micro task queue takes PRECEDENCE!"');
```

---

## §6. 🔬 Deep Analysis Patterns — Queue System & UI Architecture

### 6.1 Pattern ①: Full UI Architecture Recap

```
FULL UI ARCHITECTURE — TỔNG KẾT:
═══════════════════════════════════════════════════════════════

  ┌─── JAVASCRIPT ────────────────────────────────────────┐
  │                                                        │
  │  MEMORY:                                               │
  │  ├── post: "hi"                                        │
  │  ├── jsInput: { [[link]]→input }                      │
  │  ├── jsDiv: { [[link]]→div }                          │
  │  └── handleInput: ƒ                                    │
  │                                                        │
  │  CALL STACK: [ ]                                       │
  │  MICRO TASK QUEUE: [ ] ← VIP! ⭐                      │
  │  CALLBACK QUEUE: [ ] ← Normal 📋                      │
  │                                                        │
  └────────────┬───────────────────────────────────────────┘
               │ getter/setter (cross boundary!)
               ▼
  ┌─── C++ DOM ───────────────────────────────────────────┐
  │  input: value="hi", handler→handleInput               │
  │  div: text="hi"                                        │
  └────────────┬──────────────────────────────────────────┘
               │ layout + render engine
               ▼
  ┌─── PIXELS ────────────────────────────────────────────┐
  │  [hi___________]  input                                │
  │  hi               div                                  │
  └───────────────────────────────────────────────────────┘
```

### 6.2 Pattern ②: Registered Events

```
"REGISTERED" — TẠI SAO WILL DÙNG TỪ NÀY?
═══════════════════════════════════════════════════════════════

  Will: "Registered is a POSH WORD for the DOM element
         KNOWING."

  ┌──────────────────────────────────────────────────────────┐
  │ "Register" = đăng ký!                                    │
  │                                                          │
  │ jsInput.oninput = handleInput;                           │
  │ → "Đăng ký" handleInput với DOM element!               │
  │ → DOM element GHI NHỚ: "Khi user gõ → gọi function!" │
  │                                                          │
  │ Khi user gõ:                                            │
  │ → DOM element BIẾT (registered!)                        │
  │ → DOM element tìm handler → handleInput                │
  │ → Thêm reference vào callback queue!                    │
  │                                                          │
  │ "All we need to know as engineers: when the user takes  │
  │  action on that input field, the associated handler     │
  │  triggers running back on the callback queue." — Will    │
  └──────────────────────────────────────────────────────────┘
```

### 6.3 Pattern ③: Tại Sao Handler Functions Quan Trọng

```
HANDLER FUNCTIONS — CẦU NỐI DUY NHẤT:
═══════════════════════════════════════════════════════════════

  Will: "How can this cause a change in data, which is
         ELSEWHERE in JavaScript? Because of the
         HANDLER FUNCTIONS."

  VẤN ĐỀ:
  ┌──────────────────────────────────────────────────────────┐
  │ User gõ → data vào C++ DOM (input.value = "hi")        │
  │ Nhưng JavaScript data (post) vẫn = "" !                │
  │ → Hai thế giới KHÔNG TỰ ĐỒNG BỘ!                    │
  └──────────────────────────────────────────────────────────┘

  GIẢI PHÁP: Handler function!
  ┌──────────────────────────────────────────────────────────┐
  │ handleInput():                                           │
  │  post = jsInput.value;    ← Kéo data TỪ C++ → JS!    │
  │  jsDiv.textContent = post; ← Đẩy data TỪ JS → C++!   │
  │                                                          │
  │ Handler = CẦU NỐI duy nhất giữa 2 runtimes!           │
  │ Không có handler → data mãi mãi TÁCH BIỆT!            │
  └──────────────────────────────────────────────────────────┘
```

---

## Self-Assessment Checklist

```
CHECKLIST — SAU KHI HỌC PHẦN 14:
═══════════════════════════════════════════════════════════════

  FULL UI RECAP:
  [ ] Goal 1: JS data → setter → C++ DOM → pixels!
  [ ] Goal 2: User action → handler → callback → JS!
  [ ] No propagation = manual update mỗi lần!

  IMPERATIVE DOM PERFORMANCE:
  [ ] Mỗi DOM update = 7+ bước (accessor → rasterize!)
  [ ] × 1000 elements = hàng trăm milliseconds!
  [ ] Đây là lý do React dùng Virtual DOM!

  QUEUE PRIORITY:
  [ ] Callback Queue = Task Queue = event handlers!
  [ ] Micro Task Queue = VIP Line = Promise, async/await!
  [ ] Micro tasks LUÔN chạy TRƯỚC callbacks!
  [ ] Handler xóa khỏi queue khi lên call stack!

  REGISTERED:
  [ ] "Registered" = DOM element BIẾT về handler!
  [ ] User action → DOM tìm handler → callback queue!

  TIẾP THEO → Phần 15: One-Way Data Binding!
  → "Paradigm mới để quản lý manual updates!"
```
