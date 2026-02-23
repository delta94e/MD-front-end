# React Scheduler Source Code — Part 1 Deep Dive!

> **Chủ đề**: Phân tích source code Scheduler (Phần 1 — Normal Task Flow)
> **Ngôn ngữ**: Tiếng Việt — giải thích cực kỳ chi tiết!
> **Phương châm**: Tự viết lại bằng tay — KHÔNG dùng thư viện!
> **Nguồn**: "React Scheduler Source Code Analysis (Part 1)"
> **Hình ảnh gốc**: 2 screenshots (params debug, newTask debug)

---

## Mục Lục

1. [§1. Tổng Quan — Scheduler trong React](#1)
2. [§2. unstable_scheduleCallback — 6 Bước Chi Tiết](#2)
3. [§3. requestHostCallback → MessageChannel](#3)
4. [§4. performWorkUntilDeadline — Batch Execution](#4)
5. [§5. flushWork → workLoop — Vòng Lặp Thực Thi](#5)
6. [§6. advanceTimers + shouldYieldToHost](#6)
7. [§7. Phân Tích Hình Gốc](#7)
8. [§8. Sơ Đồ Tự Vẽ](#8)
9. [§9. Tự Viết — SchedulerSourceEngine](#9)
10. [§10. Câu Hỏi Luyện Tập](#10)

---

## §1. Tổng Quan — Scheduler trong React!

```
  SCHEDULER TRONG REACT:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  SCHEDULER LÀ GÌ?                                            │
  │  → Package RIÊNG BIỆT trong React (KHÔNG phụ thuộc React!) │
  │  → Chưa có public API (chỉ internal!)                       │
  │  → v18.2.0: chỉ ~629 dòng code!                             │
  │                                                              │
  │  NHIỆM VỤ:                                                   │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ 1. PHÂN PHỐI task vào queue theo priority!          │    │
  │  │ 2. XÁC ĐỊNH task nào chạy trước!                   │    │
  │  │ 3. NGẮT task quá lâu → nhường thread!              │    │
  │  │ 4. TIẾP TỤC task khi browser rảnh!                 │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  FLOW TỔNG QUÁT:                                              │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ unstable_scheduleCallback                            │    │
  │  │   → Tạo task object                                 │    │
  │  │   → Push vào taskQueue hoặc timerQueue              │    │
  │  │   → requestHostCallback(flushWork)                  │    │
  │  │     → MessageChannel nhường thread                  │    │
  │  │     → performWorkUntilDeadline                      │    │
  │  │       → flushWork → workLoop                       │    │
  │  │         → Chạy tasks theo batch 5ms                │    │
  │  │         → shouldYieldToHost → nhường               │    │
  │  │         → Lặp lại cho tới khi hết tasks            │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  REACT PRIORITY → SCHEDULER PRIORITY MAPPING:                │
  │  ┌──────────────────────────┬──────────────────────────┐    │
  │  │ React Priority           │ Scheduler Priority       │    │
  │  ├──────────────────────────┼──────────────────────────┤    │
  │  │ DiscreteEventPriority    │ ImmediatePriority (1)    │    │
  │  │ ContinuousEventPriority  │ UserBlockingPriority (2) │    │
  │  │ DefaultEventPriority     │ NormalPriority (3)       │    │
  │  │ IdleEventPriority        │ IdlePriority (5)         │    │
  │  └──────────────────────────┴──────────────────────────┘    │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```

---

## §2. unstable_scheduleCallback — 6 Bước Chi Tiết!

### Bước 1: Input Parameters

```
  3 THAM SỐ:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  unstable_scheduleCallback(priorityLevel, callback, options) │
  │                                                              │
  │  ① priorityLevel: MỨC ƯU TIÊN (1-5)                        │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ 0 = NoPriority     (không ưu tiên)                 │    │
  │  │ 1 = Immediate      (-1ms timeout)                   │    │
  │  │ 2 = UserBlocking   (250ms timeout)                  │    │
  │  │ 3 = Normal         (5000ms timeout) ← MẶC ĐỊNH!   │    │
  │  │ 4 = Low            (10000ms timeout)                │    │
  │  │ 5 = Idle           (1073741823ms timeout)           │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  ② callback: HÀM THỰC THI                                    │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ → Trong React: performConcurrentWorkOnRoot!         │    │
  │  │ → Được gọi từ ensureRootIsScheduled!                │    │
  │  │ → Hàm xử lý render/reconciliation!                 │    │
  │  │                                                      │    │
  │  │ ensureRootIsScheduled() {                            │    │
  │  │   newCallbackNode = scheduleCallback(                │    │
  │  │     schedulerPriorityLevel,                          │    │
  │  │     performConcurrentWorkOnRoot.bind(null, root)     │    │
  │  │   );                                                 │    │
  │  │   root.callbackNode = newCallbackNode; // Gắn vào!│    │
  │  │ }                                                    │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  ③ options: { delay?: number }                               │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ → Optional!                                          │    │
  │  │ → delay > 0 → delayed task (vào timerQueue!)       │    │
  │  │ → Không có delay → normal task (vào taskQueue!)    │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```

### Bước 2-5: startTime → timeout → expirationTime → newTask

```
  TÍNH TOÁN:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  BƯỚC 2 — startTime:                                          │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ startTime = currentTime + (options.delay || 0)       │    │
  │  │                                                      │    │
  │  │ → KHÔNG phải "thời gian bắt đầu thực thi"!        │    │
  │  │ → Là "thời gian BẮT ĐẦU LÊN LỊCH" (bấm số!)     │    │
  │  │ → Ví dụ: đi ngân hàng, bấm máy lấy số thứ tự!   │    │
  │  │ → Biết bạn đã CHỜ bao lâu!                        │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  BƯỚC 3 — timeout:                                            │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ timeout = TIMEOUT theo priority!                     │    │
  │  │                                                      │    │
  │  │ → Task CÓ THỂ bị ngắt bởi task ưu tiên cao hơn!  │    │
  │  │ → NHƯNG không thể bị ngắt MÃI MÃI!               │    │
  │  │ → timeout = "quá thời gian này PHẢI thực thi"!    │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  BƯỚC 4 — expirationTime:                                    │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ expirationTime = startTime + timeout                 │    │
  │  │                                                      │    │
  │  │ → Thời gian HẾT HẠN!                               │    │
  │  │ → Giá trị CÀNG NHỎ → CÀNG GẤP → xếp TRƯỚC!      │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  BƯỚC 5 — newTask object:                                     │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ {                                                    │    │
  │  │   id: 1,                  // unique, tăng dần       │    │
  │  │   callback: fn,           // hàm thực thi           │    │
  │  │   priorityLevel: 3,       // mức ưu tiên           │    │
  │  │   startTime: 1234.5,      // thời điểm lên lịch   │    │
  │  │   expirationTime: 6234.5, // thời điểm hết hạn    │    │
  │  │   sortIndex: -1           // key sắp xếp trong heap│    │
  │  │ }                                                    │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```

### Bước 6: Phân phối vào Queue

```
  PHÂN PHỐI:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  startTime > currentTime?                                    │
  │       │                                                      │
  │  ┌── YES (DELAYED TASK!) ────────────────────────────────┐  │
  │  │  newTask.sortIndex = startTime   ← SẮP XẾP THEO     │  │
  │  │  push(timerQueue, newTask)        THỜI GIAN LÊN LỊCH │  │
  │  │                                                        │  │
  │  │  Nếu taskQueue rỗng + newTask là timer sớm nhất:      │  │
  │  │  → requestHostTimeout(handleTimeout, delay)            │  │
  │  │  → setTimeout để đảm bảo chạy ĐÚNG HẠN!            │  │
  │  └────────────────────────────────────────────────────────┘  │
  │       │                                                      │
  │  ┌── NO (NORMAL TASK!) ──────────────────────────────────┐  │
  │  │  newTask.sortIndex = expirationTime ← SẮP XẾP THEO  │  │
  │  │  push(taskQueue, newTask)          THỜI GIAN HẾT HẠN │  │
  │  │                                                        │  │
  │  │  requestHostCallback(flushWork)                        │  │
  │  │  → Bắt đầu lên lịch thực thi!                       │  │
  │  └────────────────────────────────────────────────────────┘  │
  │                                                              │
  │  QUAN TRỌNG — SORT INDEX:                                    │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ taskQueue:  sortIndex = expirationTime               │    │
  │  │ → Hết hạn SỚM nhất = ưu tiên CAO nhất!            │    │
  │  │                                                      │    │
  │  │ timerQueue: sortIndex = startTime                    │    │
  │  │ → Lên lịch SỚM nhất = chuyển sang taskQueue trước! │    │
  │  │                                                      │    │
  │  │ push() KHÔNG PHẢI Array.push()!                     │    │
  │  │ → Là Min-Heap push: thêm + SẮP XẾP lại!           │    │
  │  │ → Giá trị nhỏ nhất LUÔN ở index 0!                │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```

---

## §3. requestHostCallback → MessageChannel!

```
  requestHostCallback:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  function requestHostCallback(callback) {                    │
  │    scheduledHostCallback = callback; // = flushWork!         │
  │    if (!isMessageLoopRunning) {                              │
  │      isMessageLoopRunning = true;                            │
  │      schedulePerformWorkUntilDeadline();                     │
  │    }                                                         │
  │  }                                                           │
  │                                                              │
  │  → Lưu flushWork vào biến global!                           │
  │  → Gọi schedulePerformWorkUntilDeadline!                    │
  │                                                              │
  │  ─────────────────────────────────────────────────────────── │
  │                                                              │
  │  schedulePerformWorkUntilDeadline:                            │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ const channel = new MessageChannel();                │    │
  │  │ const port = channel.port2;                          │    │
  │  │ channel.port1.onmessage = performWorkUntilDeadline;  │    │
  │  │                                                      │    │
  │  │ let schedulePerformWorkUntilDeadline = () => {       │    │
  │  │   port.postMessage(null); // NHƯỜNG THREAD!         │    │
  │  │ };                                                   │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  → postMessage = đặt callback vào macro task queue!         │
  │  → Browser xử lý paint/events TRƯỚC!                       │
  │  → Rồi gọi performWorkUntilDeadline!                       │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```

---

## §4. performWorkUntilDeadline — Batch Execution!

```
  performWorkUntilDeadline:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  ⚠️ startTime Ở ĐÂY ≠ startTime trong scheduleCallback!   │
  │  → Đây là BIẾN GLOBAL!                                      │
  │  → Ghi lại thời gian BẮT ĐẦU BATCH (không phải 1 task!)   │
  │                                                              │
  │  LOGIC:                                                       │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ if (scheduledHostCallback !== null) {                │    │
  │  │   startTime = getCurrentTime(); // batch start!      │    │
  │  │                                                      │    │
  │  │   hasMoreWork = scheduledHostCallback(               │    │
  │  │     hasTimeRemaining, currentTime                    │    │
  │  │   );  // = flushWork(true, currentTime)!            │    │
  │  │                                                      │    │
  │  │   if (hasMoreWork) {                                 │    │
  │  │     // Còn tasks → nhường thread → lặp lại!        │    │
  │  │     schedulePerformWorkUntilDeadline();               │    │
  │  │   } else {                                           │    │
  │  │     // Hết tasks → dừng!                            │    │
  │  │     isMessageLoopRunning = false;                    │    │
  │  │     scheduledHostCallback = null;                    │    │
  │  │   }                                                  │    │
  │  │ }                                                    │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  TẠI SAO GỌI "BATCH"?                                        │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ React KHÔNG nhường thread SAU MỖI task!              │    │
  │  │ → Xong task A (1ms) → chưa 5ms → tiếp task B!     │    │
  │  │ → Xong task B (3ms) → tổng 4ms → tiếp task C!    │    │
  │  │ → Xong task C (2ms) → tổng 6ms > 5ms → NHƯỜNG!  │    │
  │  │                                                      │    │
  │  │ → A, B, C = 1 BATCH!                               │    │
  │  │ → startTime = thời gian bắt đầu BATCH, không task!│    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```

---

## §5. flushWork → workLoop — Vòng Lặp Thực Thi!

```
  flushWork:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  function flushWork(hasTimeRemaining, initialTime) {         │
  │    isHostCallbackScheduled = false;                          │
  │    // Hủy timeout nếu có (sẽ schedule lại nếu cần!)       │
  │    if (isHostTimeoutScheduled) {                             │
  │      isHostTimeoutScheduled = false;                         │
  │      cancelHostTimeout();                                    │
  │    }                                                         │
  │    isPerformingWork = true;                                  │
  │    try {                                                     │
  │      return workLoop(hasTimeRemaining, initialTime);         │
  │    } finally {                                               │
  │      currentTask = null;                                     │
  │      isPerformingWork = false;                               │
  │    }                                                         │
  │  }                                                           │
  │                                                              │
  │  → Thiết lập flags → GỌI workLoop → cleanup!               │
  │  → Công việc THỰC SỰ nằm trong workLoop!                   │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘

  workLoop (TRUNG TÂM!):
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  function workLoop(hasTimeRemaining, initialTime) {          │
  │    advanceTimers(currentTime);  // ①                        │
  │    currentTask = peek(taskQueue);                            │
  │                                                              │
  │    while (currentTask !== null) {                            │
  │      // ② ĐIỀU KIỆN BREAK:                                  │
  │      if (notExpired && shouldYieldToHost()) break;           │
  │                                                              │
  │      // ③ THỰC THI:                                          │
  │      callback = currentTask.callback;                        │
  │      result = callback(didTimeout);                          │
  │                                                              │
  │      // ④ KIỂM TRA KẾT QUẢ:                                │
  │      if (typeof result === 'function') {                     │
  │        // Task bị NGẮT → lưu continuation!                 │
  │        currentTask.callback = result;                        │
  │        return true; // CÒN VIỆC!                            │
  │      } else {                                                │
  │        // Task HOÀN THÀNH → pop ra!                        │
  │        pop(taskQueue);                                       │
  │      }                                                       │
  │      advanceTimers(currentTime);                             │
  │      currentTask = peek(taskQueue); // task tiếp!           │
  │    }                                                         │
  │                                                              │
  │    // ⑤ KẾT THÚC:                                           │
  │    if (currentTask !== null) return true; // còn task!       │
  │    else {                                                    │
  │      // Set timeout cho timer sớm nhất!                    │
  │      firstTimer = peek(timerQueue);                          │
  │      if (firstTimer) requestHostTimeout(...);                │
  │      return false; // HẾT TASK!                             │
  │    }                                                         │
  │  }                                                           │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```

### continuationCallback — Task bị ngắt giữa chừng!

```
  CONTINUATION:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  KHÔNG CHỈ NHIỀU TASKS bị ngắt (batch yielding)!            │
  │  MÀ 1 TASK ĐƠN LẺ cũng bị ngắt (task-level interruption)! │
  │                                                              │
  │  const result = callback(didUserCallbackTimeout);            │
  │                                                              │
  │  if (typeof result === 'function') {                         │
  │    // ★ Task trả về FUNCTION = "tôi CHƯA XONG!"           │
  │    currentTask.callback = result; // Lưu lại!              │
  │    return true; // Báo workLoop: CÒN VIỆC!                 │
  │    // → Lần chạy tiếp: workLoop peek lại task này!        │
  │    // → callback = result (phần còn lại!)                  │
  │  } else {                                                    │
  │    // Task trả về KHÔNG phải function = "tôi XONG RỒI!"   │
  │    pop(taskQueue); // Bỏ ra khỏi queue!                    │
  │  }                                                           │
  │                                                              │
  │  TRONG REACT:                                                 │
  │  → performConcurrentWorkOnRoot return function              │
  │    = work chưa xong → tiếp lần sau!                        │
  │  → performConcurrentWorkOnRoot return null                  │
  │    = work xong → pop task!                                  │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```

---

## §6. advanceTimers + shouldYieldToHost!

```
  advanceTimers + shouldYieldToHost:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  advanceTimers(currentTime):                                  │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ while (timer = peek(timerQueue)) {                   │    │
  │  │   if (timer.callback === null)                       │    │
  │  │     → pop! (task đã bị CANCEL!)                    │    │
  │  │   if (timer.startTime <= currentTime)                │    │
  │  │     → pop từ timerQueue!                            │    │
  │  │     → timer.sortIndex = timer.expirationTime!       │    │
  │  │     → push vào taskQueue! (ĐỔI sort criteria!)     │    │
  │  │   else → chưa tới lúc, return!                     │    │
  │  │ }                                                    │    │
  │  │                                                      │    │
  │  │ ★ CHUYỂN: timerQueue → taskQueue!                  │    │
  │  │ ★ SORT: startTime → expirationTime!               │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  shouldYieldToHost():                                         │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ let frameInterval = 5; // 5ms!                       │    │
  │  │                                                      │    │
  │  │ function shouldYieldToHost() {                       │    │
  │  │   elapsed = getCurrentTime() - startTime; // batch! │    │
  │  │   return elapsed >= frameInterval; // >= 5ms!       │    │
  │  │ }                                                    │    │
  │  │                                                      │    │
  │  │ → startTime = thời gian bắt đầu BATCH!            │    │
  │  │ → Không phải thời gian 1 task!                     │    │
  │  │ → Quá 5ms → return true → workLoop BREAK!         │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```

---

## §7. Phân Tích Hình Gốc!

```
  HÌNH 1 — unstable_scheduleCallback params (debug):
  ┌──────────────────────────────────────────────────────────────┐
  │  Console debug output từ create-react-app default code:      │
  │                                                              │
  │  priorityLevel: 3 (NormalPriority)                           │
  │  callback: performConcurrentWorkOnRoot (bound)               │
  │  options: undefined (không có delay!)                        │
  │                                                              │
  │  → Default CRA render = NormalPriority!                     │
  │  → callback = performConcurrentWorkOnRoot!                   │
  │  → Không delay = normal task = vào taskQueue!               │
  └──────────────────────────────────────────────────────────────┘

  HÌNH 2 — newTask object (debug):
  ┌──────────────────────────────────────────────────────────────┐
  │  {                                                           │
  │    id: 1,                                                    │
  │    callback: performConcurrentWorkOnRoot,                    │
  │    priorityLevel: 3,                                         │
  │    startTime: 234.5,                 // ms từ page load    │
  │    expirationTime: 5234.5,           // + 5000ms timeout   │
  │    sortIndex: 5234.5                 // = expirationTime!  │
  │  }                                                           │
  │                                                              │
  │  → sortIndex = expirationTime (normal task!)                │
  │  → Sẽ được push vào taskQueue min-heap!                    │
  │  → heap[0] = task với sortIndex NHỎ NHẤT!                  │
  └──────────────────────────────────────────────────────────────┘
```

---

## §8. Sơ Đồ Tự Vẽ!

### Sơ Đồ 1: Complete Normal Task Flow

```
  NORMAL TASK FLOW:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  unstable_scheduleCallback(3, performConcurrentWorkOnRoot)   │
  │       │                                                      │
  │       ▼                                                      │
  │  startTime = performance.now()                               │
  │  timeout = 5000ms (NormalPriority)                           │
  │  expirationTime = startTime + 5000                           │
  │  newTask = { id, callback, sortIndex: expirationTime }       │
  │       │                                                      │
  │       ▼                                                      │
  │  push(taskQueue, newTask)  → Min-Heap sắp xếp!             │
  │       │                                                      │
  │       ▼                                                      │
  │  requestHostCallback(flushWork)                              │
  │       │                                                      │
  │       ▼                                                      │
  │  scheduledHostCallback = flushWork                           │
  │  schedulePerformWorkUntilDeadline()                          │
  │       │                                                      │
  │       ▼                                                      │
  │  MessageChannel.port2.postMessage(null) → NHƯỜNG THREAD!    │
  │       │                                                      │
  │       ▼  (browser idle)                                      │
  │  performWorkUntilDeadline()                                  │
  │       │                                                      │
  │       ▼                                                      │
  │  batchStartTime = getCurrentTime()                           │
  │  hasMoreWork = flushWork(true, currentTime)                  │
  │       │                                                      │
  │       ▼                                                      │
  │  ┌── workLoop ──────────────────────────────────────────┐   │
  │  │ advanceTimers() — chuyển delayed tasks đến hạn!     │   │
  │  │ task = peek(taskQueue) — task ưu tiên nhất!         │   │
  │  │                                                      │   │
  │  │ while (task) {                                       │   │
  │  │   if (!expired && elapsed >= 5ms) BREAK! → yield   │   │
  │  │   result = task.callback(isExpired)                  │   │
  │  │   result === fn? → task ngắt! Lưu continuation     │   │
  │  │   result !== fn? → task xong! pop(taskQueue)        │   │
  │  │   task = peek(taskQueue) — tiếp!                   │   │
  │  │ }                                                    │   │
  │  └──────────────────────────────────────────────────────┘   │
  │       │                                                      │
  │       ├── hasMoreWork = true → postMessage → lặp lại!      │
  │       └── hasMoreWork = false → XONG! Dừng loop!           │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```

### Sơ Đồ 2: Global Variables State Machine

```
  FLAGS STATE:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  isHostCallbackScheduled:                                    │
  │  → true  khi requestHostCallback được gọi!                 │
  │  → false khi flushWork bắt đầu!                            │
  │  → Đảm bảo CHỈ 1 requestHostCallback tại 1 thời điểm!    │
  │                                                              │
  │  isPerformingWork:                                           │
  │  → true  khi workLoop đang chạy!                           │
  │  → false khi workLoop xong!                                 │
  │  → Ngăn schedule MỚI khi đang chạy workLoop!              │
  │                                                              │
  │  isHostTimeoutScheduled:                                     │
  │  → true  khi requestHostTimeout được gọi!                  │
  │  → false khi cancelHostTimeout hoặc handleTimeout!          │
  │  → Đảm bảo chỉ 1 setTimeout cho timerQueue!               │
  │                                                              │
  │  isMessageLoopRunning:                                       │
  │  → true  khi schedulePerformWorkUntilDeadline!             │
  │  → false khi tất cả tasks hoàn thành!                      │
  │  → Ngăn nhiều message loop chạy song song!                 │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```

---

## §9. Tự Viết — SchedulerSourceEngine!

```javascript
/**
 * SchedulerSourceEngine — Mô phỏng Normal Task Flow!
 * Tự viết bằng tay, trace từng bước source code!
 */
var SchedulerSourceEngine = (function () {

  // ═══════════════════════════════════
  // MIN-HEAP (simplified)
  // ═══════════════════════════════════
  function compare(a, b) {
    var d = a.sortIndex - b.sortIndex;
    return d !== 0 ? d : a.id - b.id;
  }
  function push(heap, node) {
    heap.push(node);
    var i = heap.length - 1;
    while (i > 0) {
      var pi = (i - 1) >>> 1;
      if (compare(heap[pi], heap[i]) > 0) {
        var t = heap[pi]; heap[pi] = heap[i]; heap[i] = t;
        i = pi;
      } else break;
    }
  }
  function peek(heap) { return heap.length ? heap[0] : null; }
  function pop(heap) {
    if (!heap.length) return null;
    var first = heap[0], last = heap.pop();
    if (last !== first) {
      heap[0] = last;
      var i = 0, half = heap.length >>> 1;
      while (i < half) {
        var li = (i+1)*2-1, ri = li+1, smallest = i;
        if (li < heap.length && compare(heap[li], heap[smallest]) < 0) smallest = li;
        if (ri < heap.length && compare(heap[ri], heap[smallest]) < 0) smallest = ri;
        if (smallest !== i) {
          var t = heap[i]; heap[i] = heap[smallest]; heap[smallest] = t;
          i = smallest;
        } else break;
      }
    }
    return first;
  }

  // ═══════════════════════════════════
  // CONSTANTS
  // ═══════════════════════════════════
  var TIMEOUTS = { 1: -1, 2: 250, 3: 5000, 4: 10000, 5: 1073741823 };

  // ═══════════════════════════════════
  // SCHEDULER STATE
  // ═══════════════════════════════════
  var taskQueue = [], timerQueue = [];
  var taskIdCounter = 1;
  var currentTime = 0;
  var frameInterval = 5;
  var trace = [];

  function reset() {
    taskQueue = []; timerQueue = [];
    taskIdCounter = 1; currentTime = 0; trace = [];
  }

  // ═══════════════════════════════════
  // unstable_scheduleCallback (TRACE!)
  // ═══════════════════════════════════
  function scheduleCallback(priorityLevel, callback, options) {
    var startTime = currentTime;
    if (options && options.delay > 0) startTime += options.delay;

    var timeout = TIMEOUTS[priorityLevel] || 5000;
    var expirationTime = startTime + timeout;

    var newTask = {
      id: taskIdCounter++,
      callback: callback,
      priorityLevel: priorityLevel,
      startTime: startTime,
      expirationTime: expirationTime,
      sortIndex: -1
    };

    if (startTime > currentTime) {
      newTask.sortIndex = startTime;
      push(timerQueue, newTask);
      trace.push({
        action: 'SCHEDULE_DELAYED',
        taskId: newTask.id,
        sortIndex: newTask.sortIndex,
        queue: 'timerQueue'
      });
    } else {
      newTask.sortIndex = expirationTime;
      push(taskQueue, newTask);
      trace.push({
        action: 'SCHEDULE_NORMAL',
        taskId: newTask.id,
        sortIndex: newTask.sortIndex,
        queue: 'taskQueue'
      });
    }
    return newTask;
  }

  // ═══════════════════════════════════
  // advanceTimers
  // ═══════════════════════════════════
  function advanceTimers() {
    var timer = peek(timerQueue);
    while (timer) {
      if (timer.callback === null) {
        pop(timerQueue);
      } else if (timer.startTime <= currentTime) {
        pop(timerQueue);
        timer.sortIndex = timer.expirationTime;
        push(taskQueue, timer);
        trace.push({
          action: 'ADVANCE_TIMER',
          taskId: timer.id,
          note: 'timerQueue → taskQueue!'
        });
      } else break;
      timer = peek(timerQueue);
    }
  }

  // ═══════════════════════════════════
  // workLoop (TRACE!)
  // ═══════════════════════════════════
  function workLoop() {
    var batchCount = 0;
    var allBatches = [];

    while (peek(taskQueue) || peek(timerQueue)) {
      advanceTimers();
      if (!peek(taskQueue)) {
        var next = peek(timerQueue);
        if (next) { currentTime = next.startTime; advanceTimers(); }
        else break;
      }

      batchCount++;
      var batch = { batch: batchCount, tasks: [], startTime: currentTime };
      var batchStart = currentTime;

      var task = peek(taskQueue);
      while (task) {
        var elapsed = currentTime - batchStart;
        if (task.expirationTime > currentTime && elapsed >= frameInterval) {
          batch.yieldReason = 'elapsed ' + elapsed + 'ms >= 5ms → YIELD!';
          break;
        }

        if (typeof task.callback === 'function') {
          var duration = task.callback._duration || 0;
          var isExpired = task.expirationTime <= currentTime;

          batch.tasks.push({
            id: task.id,
            priority: task.priorityLevel,
            expired: isExpired,
            duration: duration + 'ms'
          });

          task.callback = null;
          currentTime += duration;

          if (task === peek(taskQueue)) pop(taskQueue);
          advanceTimers();
        } else {
          pop(taskQueue);
        }
        task = peek(taskQueue);
      }
      allBatches.push(batch);
    }
    return allBatches;
  }

  // ═══════════════════════════════════
  // DEMO
  // ═══════════════════════════════════
  function demo() {
    console.log('╔═══════════════════════════════════════════╗');
    console.log('║  SCHEDULER SOURCE ENGINE — DEMO             ║');
    console.log('╚═══════════════════════════════════════════╝');

    reset();

    // Schedule tasks like React does
    var fn1 = function(){}; fn1._duration = 2;
    var fn2 = function(){}; fn2._duration = 1;
    var fn3 = function(){}; fn3._duration = 8;

    scheduleCallback(3, fn1);           // Normal, 2ms
    scheduleCallback(1, fn2);           // Immediate! (highest priority)
    scheduleCallback(3, fn3);           // Normal, 8ms (will cause yield)

    console.log('\n--- TRACE ---');
    console.log(JSON.stringify(trace, null, 2));

    console.log('\n--- TASK QUEUE ORDER ---');
    console.log('Tasks by sortIndex (expirationTime):');
    taskQueue.forEach(function(t) {
      console.log('  id=' + t.id + ' sortIndex=' + t.sortIndex +
        ' priority=' + t.priorityLevel);
    });
    // Immediate (id=2) should be first (smallest expirationTime!)

    console.log('\n--- WORK LOOP ---');
    var result = workLoop();
    console.log(JSON.stringify(result, null, 2));

    console.log('\n╔═══════════════════════════════════════════╗');
    console.log('║  ✅ Demo Complete!                           ║');
    console.log('╚═══════════════════════════════════════════╝');
  }

  return {
    push: push, peek: peek, pop: pop,
    scheduleCallback: scheduleCallback,
    advanceTimers: advanceTimers,
    workLoop: workLoop,
    reset: reset,
    demo: demo
  };
})();

// Chạy: SchedulerSourceEngine.demo();
```

---

## §10. Câu Hỏi Luyện Tập!

### ❓ Câu 1: unstable_scheduleCallback nhận gì và trả về gì?

**Trả lời:**

**Nhận**: `(priorityLevel, callback, options?)` — ưu tiên, hàm thực thi, delay options.
**Trả về**: `newTask` object — được gắn vào `root.callbackNode` trong React!

### ❓ Câu 2: startTime trong scheduleCallback có nghĩa gì?

**Trả lời:**

KHÔNG phải "thời gian bắt đầu thực thi"! Mà là **thời gian LÊN LỊCH** — như bấm máy lấy số ở ngân hàng! Tính bằng: `currentTime + delay`.

### ❓ Câu 3: sortIndex khác nhau thế nào giữa 2 queue?

| Queue | sortIndex | Ý nghĩa |
|---|---|---|
| **taskQueue** | `expirationTime` | Hết hạn SỚM nhất = ưu tiên CAO nhất! |
| **timerQueue** | `startTime` | Lên lịch SỚM nhất = chuyển sang taskQueue trước! |

→ Khi chuyển timerQueue → taskQueue: **đổi** sortIndex từ startTime → expirationTime!

### ❓ Câu 4: push(taskQueue, task) có phải Array.push() không?

**Trả lời:**

**KHÔNG!** Là **Min-Heap push**:
1. Thêm vào cuối array!
2. **siftUp** — so với cha, swap nếu nhỏ hơn!
3. Kết quả: sortIndex nhỏ nhất LUÔN ở `heap[0]`!
→ `peek()` = O(1) lấy task ưu tiên nhất!

### ❓ Câu 5: 4 global flags dùng để làm gì?

| Flag | Mục đích |
|---|---|
| `isHostCallbackScheduled` | Chỉ 1 requestHostCallback tại 1 thời điểm! |
| `isPerformingWork` | Ngăn schedule mới khi workLoop đang chạy! |
| `isHostTimeoutScheduled` | Chỉ 1 setTimeout cho timerQueue tại 1 thời điểm! |
| `isMessageLoopRunning` | Ngăn nhiều message loop chạy song song! |

### ❓ Câu 6: continuationCallback là gì?

**Trả lời:**

Khi **1 task đơn lẻ** bị ngắt giữa chừng:
```
result = task.callback(isExpired)
→ result là FUNCTION = "tôi chưa xong!"
→ task.callback = result (lưu phần còn lại!)
→ workLoop return true → batch tiếp sẽ chạy lại task này!
```
→ Trong React: `performConcurrentWorkOnRoot` return function = render chưa xong!

### ❓ Câu 7: Tại sao startTime trong performWorkUntilDeadline khác scheduleCallback?

**Trả lời:**

| Biến | Nằm ở | Ý nghĩa |
|---|---|---|
| `newTask.startTime` | scheduleCallback | Thời gian **task** được lên lịch! |
| Global `startTime` | performWorkUntilDeadline | Thời gian **BATCH** bắt đầu! |

→ `shouldYieldToHost` check: `getCurrentTime() - batchStartTime >= 5ms`
→ Đo thời gian của **batch**, không phải 1 task!

---

> 🎯 **Tổng kết Scheduler Source Part 1:**
> - **scheduleCallback**: tạo task → tính timeout/expiration → push vào queue!
> - **2 queues**: taskQueue (sortBy expirationTime), timerQueue (sortBy startTime)!
> - **Min-Heap push**: không phải Array.push! Tự sắp xếp! peek() = O(1)!
> - **requestHostCallback → MessageChannel**: nhường thread cho browser!
> - **performWorkUntilDeadline**: ghi batchStartTime → gọi flushWork!
> - **workLoop**: advanceTimers → while loop → callback → continuation check!
> - **shouldYieldToHost**: batch elapsed >= 5ms → break → nhường thread!
> - **4 flags**: đảm bảo chỉ 1 instance chạy tại mỗi thời điểm!
> - **continuationCallback**: 1 task cũng có thể bị ngắt → return function!
> - **7 câu hỏi** luyện tập với đáp án chi tiết!
