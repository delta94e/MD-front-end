# React 19 Scheduler & Event Handling — Deep Dive!

> **Tại sao React chọn MessageChannel?**
> Event Loop, Time Slicing, Fiber scheduling, shouldYield!

---

## §1. React Scheduler Làm Gì?

```
  REACT SCHEDULER:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  ★ React KHÔNG dispatch "events"!                              │
  │  ★ React dispatch FIBER RENDERING TASKS! ★                    │
  │                                                              │
  │  Scheduler quản lý:                                             │
  │  → beginWork (xử lý mỗi fiber node!)                        │
  │  → completeWork (hoàn thành fiber!)                          │
  │  → diff (so sánh old vs new!)                                 │
  │  → Xây dựng workInProgress Fiber Tree!                       │
  │                                                              │
  │  MỤC TIÊU: Đẩy Fiber rendering MÀ KHÔNG BLOCK browser! ★    │
  │                                                              │
  │  Scheduler cần:                                                  │
  │  ① Gọi LẶP LẠI được! ★                                      │
  │  ② Chạy MỘT PHẦN nhỏ mỗi lần! ★                            │
  │  ③ Xong → NHƯỜNG main thread cho browser! ★★★               │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```

---

## §2. Event Loop — Nền Tảng!

```
  BROWSER EVENT LOOP:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  ┌─────────────────────────────────────┐                      │
  │  │ ① MACRO TASK (Task Queue!)           │                      │
  │  │ → setTimeout, MessageChannel, rAF    │                      │
  │  │ → Lấy 1 task → chạy!               │                      │
  │  └─────────────┬───────────────────────┘                      │
  │                │                                              │
  │                ▼                                              │
  │  ┌─────────────────────────────────────┐                      │
  │  │ ② MICRO TASKS (xử lý HẾT!)          │                      │
  │  │ → Promise.then, queueMicrotask       │                      │
  │  │ → Chạy TẤT CẢ! Không dừng! ★       │                      │
  │  └─────────────┬───────────────────────┘                      │
  │                │                                              │
  │                ▼                                              │
  │  ┌─────────────────────────────────────┐                      │
  │  │ ③ RENDER (nếu cần!)                  │                      │
  │  │ → rAF callbacks                      │                      │
  │  │ → Style → Layout → Paint → Composite │                      │
  │  └─────────────┬───────────────────────┘                      │
  │                │                                              │
  │                ▼                                              │
  │           Quay lại ① !                                         │
  │                                                              │
  │  1 FRAME ≈ 16.6ms (60Hz!)                                     │
  │  ┌────────────────────────────────────────────────────┐      │
  │  │ Task → Microtasks → rAF → Style → Layout → Paint  │      │
  │  │ ←──────────── 16.6ms ──────────────→               │      │
  │  └────────────────────────────────────────────────────┘      │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```

---

## §3. Tại Sao KHÔNG Dùng Microtask?

```
  ❌ MICROTASK (Promise/queueMicrotask):
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  VẤN ĐỀ 1: BLOCK RENDERING! ★★★                               │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ React work → schedule microtask → work tiếp →        │    │
  │  │ → schedule microtask → work tiếp → ...                 │    │
  │  │                                                      │    │
  │  │ Browser: "Tôi chưa được paint!" ❌ ★                  │    │
  │  │ → Microtask PHẢI xử lý HẾT trước paint! ★            │    │
  │  │ → UI ĐỨNG! ❌                                          │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  VẤN ĐỀ 2: KHÔNG THỂ NGẮT! ★★★                               │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ → Microtask queue phải CLEAR HẾT!                     │    │
  │  │ → React KHÔNG THỂ "nhường main thread"! ❌            │    │
  │  │ → KHÔNG concurrent rendering! ❌                       │    │
  │  │ → Ngược hoàn toàn với Fiber time slicing! ❌ ★       │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```

---

## §4. Tại Sao KHÔNG Dùng setTimeout?

```
  ❌ setTimeout:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  VẤN ĐỀ: DELAY TỐI THIỂU 4ms! ★                              │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ HTML Standard:                                          │    │
  │  │ "Nếu nesting > 5 levels VÀ timeout < 4ms               │    │
  │  │  → timeout = 4ms!" ★                                    │    │
  │  │                                                      │    │
  │  │ React Scheduler hỏi:                                    │    │
  │  │ "Frame này còn 2ms để làm việc không?"                 │    │
  │  │ → setTimeout: "Tôi chỉ có độ chính xác 4ms!" ❌ ★    │    │
  │  │ → Quá THÔ cho time slicing! ❌                         │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  setTimeout + Animation → AVALANCHE! ❌                        │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ Frame 1: Task 18ms → VƯỢT 16.6ms → không render! ❌ │    │
  │  │ Frame 2: Task 18ms → lại vượt → không render! ❌     │    │
  │  │ Frame 3: Task 18ms → tiếp tục... ❌                    │    │
  │  │                                                      │    │
  │  │ → setTimeout chỉ biết: "hết giờ → chạy!" ★           │    │
  │  │ → KHÔNG quan tâm: main thread bận? render được?      │    │
  │  │ → Lag TÍCH LŨY! (avalanche!) ❌ ★★★                  │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```

---

## §5. Tại Sao KHÔNG Dùng rAF?

```
  ❌ requestAnimationFrame:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  VẤN ĐỀ 1: GẮN VỚI RENDER FRAME! ★                           │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ rAF: "Tôi chỉ chạy TRƯỚC MỖI frame render!" ★       │    │
  │  │ → 1 frame = 16.6ms → rAF tối đa 60 lần/giây!       │    │
  │  │                                                      │    │
  │  │ React muốn:                                            │    │
  │  │ "Main thread rảnh → tôi chạy!" ★                      │    │
  │  │ → KHÔNG cần đợi frame tiếp! ★                         │    │
  │  │ → rAF quá CHẬm cho Scheduler! ❌                      │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  VẤN ĐỀ 2: KHÔNG CHẠY TRONG BACKGROUND! ★                    │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ → Tab không active → browser PAUSE rAF! ★             │    │
  │  │ → React updates bị "đóng băng"! ❌                    │    │
  │  │ → Quay lại tab → state cũ! ❌                          │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  rAF GIỎI Ở ĐÂU?                                               │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ ✅ Animation! (sync với render frame!)                │    │
  │  │ ✅ Drop frame thay vì lag tích lũy! ★                 │    │
  │  │ ✅ CSS animation, scroll effects!                      │    │
  │  │ ❌ KHÔNG phù hợp cho Fiber scheduling! ★              │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```

---

## §6. MessageChannel — Lựa Chọn Cuối Cùng! ★★★

```
  ✅ MessageChannel:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  ★ MACRO TASK → không starve browser! ✅                      │
  │  ★ LATENCY CỰC THẤP → gần microtask nhưng KHÔNG block! ✅  │
  │  ★ KHÔNG gắn render frame → chạy bất cứ khi nào rảnh! ✅   │
  │  ★ CÓ THỂ NGẮT + NHƯỜNG main thread! ✅ ★★★                 │
  │                                                              │
  │  SCHEDULER MODEL:                                               │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ MessageChannel callback kích hoạt!                     │    │
  │  │     │                                                   │    │
  │  │     ▼                                                   │    │
  │  │ performWorkUntilDeadline()                              │    │
  │  │     │                                                   │    │
  │  │     ▼                                                   │    │
  │  │ while (còn task && chưa hết time!) {                    │    │
  │  │   Fiber work (2~5ms!) ★                                │    │
  │  │ }                                                      │    │
  │  │     │                                                   │    │
  │  │     ▼                                                   │    │
  │  │ shouldYield() === true? ★                               │    │
  │  │     │                                                   │    │
  │  │  ┌──┴──┐                                                │    │
  │  │  │ YES │ → postMessage() → hẹn lần sau! ★              │    │
  │  │  │     │ → NHƯỜNG main thread! ★★★                     │    │
  │  │  │     │ → Browser paint/input! ✅                      │    │
  │  │  └─────┘                                                │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```

```javascript
// ═══════════════════════════════════════════════════════════
// TỰ VIẾT: Mô phỏng React Scheduler! ★★★
// ═══════════════════════════════════════════════════════════

function createScheduler() {
  var channel = new MessageChannel();
  var port = channel.port2;
  var taskQueue = [];
  var isScheduled = false;
  var deadline = 0;
  var FRAME_BUDGET = 5; // ★ 5ms mỗi lần! ★

  // ★ shouldYield: hết thời gian chưa?
  function shouldYield() {
    return performance.now() >= deadline;
  }

  // ★ MessageChannel callback!
  channel.port1.onmessage = function () {
    deadline = performance.now() + FRAME_BUDGET; // ★ Budget!

    // ★ Chạy tasks cho đến khi hết budget!
    while (taskQueue.length > 0 && !shouldYield()) {
      var task = taskQueue.shift();
      task(); // ★ Chạy 1 unit of work!
    }

    // ★ Còn task? → Hẹn lần sau!
    if (taskQueue.length > 0) {
      port.postMessage(null); // ★ Macro task MỚI! ★
      // → Browser có cơ hội paint/input! ★★★
    } else {
      isScheduled = false;
    }
  };

  // ★ Schedule task!
  function scheduleTask(task) {
    taskQueue.push(task);
    if (!isScheduled) {
      isScheduled = true;
      port.postMessage(null); // ★ Kích hoạt!
    }
  }

  return { scheduleTask: scheduleTask };
}

// ═══════════════════════════════════════════════════════════
// TEST!
// ═══════════════════════════════════════════════════════════

var scheduler = createScheduler();

// Giả lập 20 Fiber tasks!
for (var i = 0; i < 20; i++) {
  (function (idx) {
    scheduler.scheduleTask(function () {
      // ★ Mỗi task = 1 unit of Fiber work!
      console.log("Fiber task", idx, "tại", performance.now().toFixed(1));
    });
  })(i);
}

// Output: tasks chạy theo nhóm nhỏ!
// → Giữa các nhóm: browser có thể paint! ★★★
```

---

## §7. So Sánh Tất Cả!

```
  ┌──────────────────┬──────────┬──────────┬──────────┬──────────────┐
  │ Tiêu chí        │Microtask │setTimeout│ rAF      │MessageChannel│
  ├──────────────────┼──────────┼──────────┼──────────┼──────────────┤
  │ Loại            │ Micro    │ Macro    │ Trước    │ Macro ★      │
  │                  │          │          │ render!  │              │
  │ Block render     │ CÓ! ❌  │ Không    │ Không    │ Không ✅ ★   │
  │ Latency          │ Cực thấp│ ≥4ms! ❌ │ 16.6ms! │ Cực thấp ✅ ★│
  │ Ngắt được       │ ❌ ★     │ ✅       │ ✅       │ ✅ ★★★       │
  │ Nhường thread    │ ❌ ★★★  │ ✅       │ ✅       │ ✅ ★★★       │
  │ Gắn frame       │ Không    │ Không    │ CÓ! ❌  │ Không ✅ ★   │
  │ Background tab   │ Chạy    │ Throttle │ PAUSE! ❌│ Chạy ✅ ★   │
  │ Chính xác       │ Cao      │ Thô! ❌ │ Frame    │ Cao ✅ ★     │
  │ React Scheduler  │ ❌       │ ❌       │ ❌       │ ✅ ★★★       │
  └──────────────────┴──────────┴──────────┴──────────┴──────────────┘
```

---

## §8. rAF vs setTimeout — Drop Frame!

```
  setTimeout AVALANCHE:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  Mỗi task = 18ms > 16.6ms frame budget!                      │
  │                                                              │
  │  Frame 1: [Task 18ms ████████████████████]                    │
  │           → VƯỢT! Không render! ❌                            │
  │  Frame 2: [Task 18ms ████████████████████]                    │
  │           → VƯỢT! Không render! ❌                            │
  │  Frame 3: [Task 18ms ████████████████████]                    │
  │           → Lag TÍCH LŨY! ❌ ★★★                             │
  │                                                              │
  │  → setTimeout: "Hết giờ → chạy!" (không kiểm tra gì!)      │
  │  → Tasks XẾP HÀNG liên tục! ❌                                │
  │  → UI ĐỨNG! ❌                                                │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘

  rAF — DROP FRAME (không tích lũy!):
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  Frame 1: [Task 18ms] → vượt → DROP FRAME! ★                │
  │  Frame 2: [Task 5ms][rAF][render ✅] → OK!                   │
  │  Frame 3: [Task 5ms][rAF][render ✅] → OK!                   │
  │                                                              │
  │  → rAF: "Frame bị vượt → BỎ QUA! (drop!)" ★                │
  │  → KHÔNG xếp hàng! KHÔNG tích lũy! ★                        │
  │  → Frame sau PHỤC HỒI! ✅                                    │
  │  → Chậm nhưng KHÔNG chết! ★                                  │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘

  MessageChannel — TIME SLICING! ★★★
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  Frame 1: [Work 5ms][nhường!][render ✅][input ✅]           │
  │  Frame 2: [Work 5ms][nhường!][render ✅]                     │
  │  Frame 3: [Work 5ms][nhường!][render ✅]                     │
  │                                                              │
  │  → Chạy 5ms → shouldYield → NHƯỜNG! ★★★                     │
  │  → Browser paint + input! ✅                                  │
  │  → postMessage → hẹn lần sau! ★                              │
  │  → MƯỢT + KHÔNG LAG! ★★★                                     │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```

---

## §9. Câu Hỏi Phỏng Vấn!

```
  CÂU HỎI:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  ❓ 1: React Scheduler dùng gì để dispatch?                     │
  │  → MessageChannel! ★★★                                        │
  │  → Macro task, low latency, không gắn frame! ★               │
  │  → Có thể ngắt + nhường main thread! ★                       │
  │                                                              │
  │  ❓ 2: Tại sao không dùng microtask?                             │
  │  → Block rendering! Microtask phải clear hết! ★              │
  │  → Không thể ngắt → không concurrent! ❌                     │
  │                                                              │
  │  ❓ 3: Tại sao không dùng setTimeout?                            │
  │  → Delay tối thiểu 4ms (nesting > 5)! ★                     │
  │  → Quá thô cho time slicing 2-5ms! ❌                        │
  │  → Animation: lag tích lũy (avalanche!) ❌                   │
  │                                                              │
  │  ❓ 4: Tại sao không dùng rAF?                                   │
  │  → Gắn render frame (16.6ms)! ★                              │
  │  → React muốn chạy BẤT CỨ KHI NÀO rảnh! ★                 │
  │  → Background tab: rAF bị pause! ❌                           │
  │                                                              │
  │  ❓ 5: shouldYield() làm gì?                                     │
  │  → Kiểm tra: hết time budget chưa? ★                        │
  │  → performance.now() >= deadline? ★                           │
  │  → Hết → postMessage → nhường → browser paint! ★            │
  │  → Đây là CỐT LÕI của time slicing! ★★★                    │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```
