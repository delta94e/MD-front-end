# React Scheduler — Deep Dive

> 📅 2026-02-14 · ⏱ 20 phút đọc
>
> "Bậc thầy quản lý thời gian" — React Scheduler
> Task Priority, Time Slicing, Min-Heap, timerQueue & taskQueue,
> workLoop, MessageChannel, Task Interruption & Resumption
> Độ khó: ⭐️⭐️⭐️⭐️⭐️ | React Source Code Level Interview

---

## Mục Lục

| #   | Phần                                          |
| --- | --------------------------------------------- |
| 1   | Scheduler là gì? Tại sao cần?                 |
| 2   | Tổng quan nguyên lý — Priority & Time Slicing |
| 3   | Quản lý nhiều tasks — timerQueue & taskQueue  |
| 4   | Min-Heap — Cấu trúc dữ liệu priority queue    |
| 5   | Hệ thống Priority — Lane → Scheduler Priority |
| 6   | scheduleCallback — Entry point của Scheduler  |
| 7   | getCurrentTime & Timeout Helpers              |
| 8   | handleTimeout & advanceTimers                 |
| 9   | requestHostCallback & MessageChannel          |
| 10  | performWorkUntilDeadline — Executor           |
| 11  | flushWork & workLoop — Ngắt & Phục hồi task   |
| 12  | shouldYieldToHost — Nhường main thread        |
| 13  | Cancel & Custom Time Slice                    |
| 14  | Tổng kết & Checklist phỏng vấn                |

---

## §1. Scheduler là gì? Tại sao cần?

```
SCHEDULER — KHÁI NIỆM:
═══════════════════════════════════════════════════════════════

  Tầm nhìn của React: PHẢN HỒI NHANH cho user!
  → User cảm thấy ứng dụng "nhanh đủ"
  → KHÔNG block interaction!

  VẤN ĐỀ: JavaScript = SINGLE THREAD!
  → 1 task đồng bộ tốn thời gian → BLOCK main thread!
  → User click/gõ phím → KHÔNG PHẢN HỒI! (jank/frame drop!)

  GIẢI PHÁP: SCHEDULER!
  → Package nội bộ trong React project!
  → Bạn đưa TASKS + PRIORITIES vào → nó lo toàn bộ!
  → Phối hợp + lập lịch tasks cho bạn!

  ⚠️ Hiện tại Scheduler CHỈ dùng trong React!
  → Nhưng đội phát triển muốn: Scheduler = công cụ CHUNG!
  → Tương lai có thể tách ra dùng độc lập!
```

```
SCHEDULER LÀM GÌ? — 2 CHIỀU:
═══════════════════════════════════════════════════════════════

  ① MACRO — Quản lý NHIỀU tasks:
  → Sắp xếp THỨ TỰ thực thi dựa trên PRIORITY!
  → Task ưu tiên cao → chạy TRƯỚC!
  → Task ưu tiên thấp → chạy SAU!

  ② MICRO — Kiểm soát TỪNG task:
  → Task dài → NGẮT kịp thời!
  → Nhường cho tasks quan trọng hơn (user interaction!)
  → Sau đó TIẾP TỤC task bị ngắt!
  → → Tránh chiếm dụng main thread liên tục!

  VÍ DỤ:
  ┌──────────────────────────────────────────────────────────┐
  │ KHÔNG CÓ Scheduler:                                     │
  │ [──── Render 100ms ────────────────────────]              │
  │ → User click ở giữa → KHÔNG PHẢN HỒI! 💀               │
  ├──────────────────────────────────────────────────────────┤
  │ CÓ Scheduler (time slicing):                             │
  │ [─ 5ms ─] → yield → [─ 5ms ─] → yield → [─ 5ms ─]      │
  │            ↑ user click xử lý ngay! ✅                    │
  └──────────────────────────────────────────────────────────┘

  → Chia nhỏ task dài → thực thi "có kiểm soát"!
  → Giống COROUTINE: ngắt + tiếp tục!
  → ES6 Generator: yield keyword mô phỏng tương tự!
```

---

## §2. Tổng quan nguyên lý — Priority & Time Slicing

```
HAI KHÁI NIỆM CỐT LÕI:
═══════════════════════════════════════════════════════════════

  ① TASK PRIORITY (Độ ưu tiên):
  → Sắp xếp tasks theo MỨC ĐỘ KHẨN CẤP!
  → Task khẩn cấp nhất → thực thi TRƯỚC!

  ② TIME SLICE (Khung thời gian):
  → Thời gian TỐI ĐA 1 task được chạy trong 1 frame!
  → yieldInterval = 5ms (mặc định!)
  → Task chạy quá 5ms → BỊ NGẮT!
  → Nhường cho task ưu tiên cao hơn!
  → Đảm bảo: KHÔNG frame drop + KHÔNG block user interaction!

  WORKFLOW:
  ┌─────────────────────────────────────────────────────────┐
  │ Tasks đi vào Scheduler                                   │
  │     ↓                                                    │
  │ Phân loại: ĐÃ HẾT HẠN hay CHƯA HẾT HẠN?               │
  │     ↓                      ↓                             │
  │ taskQueue              timerQueue                        │
  │ (đã hết hạn →           (chưa hết hạn →                  │
  │  cần chạy NGAY!)         chờ đến lúc!)                   │
  │     ↓                      ↓                             │
  │ workLoop lặp             advanceTimers                    │
  │ qua taskQueue            kiểm tra & chuyển               │
  │     ↓                   vào taskQueue                     │
  │ Thực thi task                                            │
  │ (tối đa 5ms!)                                            │
  │     ↓                                                    │
  │ Hết 5ms? → NGẮT → nhường main thread                    │
  │ → Lập lịch executor MỚI → TIẾP TỤC task!               │
  └─────────────────────────────────────────────────────────┘
```

---

## §3. Quản lý nhiều tasks — timerQueue & taskQueue

```
HAI HÀNG ĐỢI TASK:
═══════════════════════════════════════════════════════════════

  Scheduler chia tasks thành 2 LOẠI → 2 QUEUES:

  ┌──────────────────────────────────────────────────────────┐
  │ timerQueue                                                │
  │ → Tasks CHƯA HẾT HẠN! (startTime > currentTime)         │
  │ → Sắp xếp theo: startTime (bắt đầu sớm → ở trước!)     │
  │ → KHÔNG thực thi ngay! Chờ đến thời điểm startTime!     │
  │ → Khi hết hạn → chuyển sang taskQueue!                   │
  ├──────────────────────────────────────────────────────────┤
  │ taskQueue                                                 │
  │ → Tasks ĐÃ HẾT HẠN! (startTime <= currentTime)          │
  │ → Sắp xếp theo: expirationTime (hết hạn sớm → ở trước!)│
  │ → workLoop LẶP QUA và thực thi lần lượt!                │
  └──────────────────────────────────────────────────────────┘

  PHÂN LOẠI:
  → startTime > currentTime → task CHƯA hết hạn → timerQueue!
  → startTime <= currentTime → task ĐÃ hết hạn → taskQueue!

  startTime = currentTime (mặc định)
            HOẶC currentTime + delay (nếu truyền delay!)

  CHUYỂN ĐỔI:
  → advanceTimers() kiểm tra timerQueue
  → Task nào đã hết hạn → POP ra → PUSH vào taskQueue!
  → workLoop gọi advanceTimers() mỗi vòng lặp!
```

```
THỰC THI TASK:
═══════════════════════════════════════════════════════════════

  taskQueue (đã hết hạn):
  → workLoop LẶP QUA → thực thi từng task!
  → Task chạy quá time slice → NGẮT → tiếp tục sau!

  timerQueue (chưa hết hạn):
  → KHÔNG thực thi ngay!
  → advanceTimers() kiểm tra task ĐẦU TIÊN (highest priority!)
  → Nếu đã hết hạn → chuyển sang taskQueue!
  → Nếu chưa → requestHostTimeout() → chờ đến lúc!

  ⚠️ Lanes từ react-reconciler = ĐỘ ƯU TIÊN lõi của React!
  → Cần CHUYỂN ĐỔI sang Scheduler priorities!
  → Rồi Scheduler dùng priorities để quản lý HÀNG ĐỢI!
  → Task KHẨN CẤP hơn → priority CAO hơn!
```

---

## §4. Min-Heap — Cấu trúc dữ liệu priority queue

```
MIN-HEAP LÀ GÌ?
═══════════════════════════════════════════════════════════════

  Phiên bản CŨ React Scheduler: dùng CIRCULAR LINKED LIST!
  → Code rất khó hiểu!

  Phiên bản HIỆN TẠI: dùng MIN-HEAP!
  → Heap = cài đặt cơ sở của PRIORITY QUEUE!
  → Insert/Delete → TỰ ĐỘNG sắp xếp! (float up / sink down!)
  → peek() = lấy phần tử NHỎ NHẤT (ưu tiên CAO nhất!) → O(1)!
  → push() = chèn + sắp xếp → O(log n)!
  → pop() = lấy ra + sắp xếp lại → O(log n)!

  ⚠️ Heap lưu trong ARRAY (không phải linked list!)

  VÍ DỤ MIN-HEAP (sortIndex = expirationTime):
  ┌─────────────────────────────────────────────────────┐
  │          [10]           ← Root: nhỏ nhất (ưu tiên!)│
  │         /    \                                      │
  │       [15]   [20]                                   │
  │       / \    / \                                    │
  │     [25][30][35][40]                                │
  │                                                     │
  │ Array: [10, 15, 20, 25, 30, 35, 40]                │
  └─────────────────────────────────────────────────────┘

  TIÊU CHÍ SẮP XẾP:
  → timerQueue: sortIndex = startTime
    → BẮT ĐẦU sớm hơn → ở TRƯỚC!
  → taskQueue: sortIndex = expirationTime
    → HẾT HẠN sớm hơn → ở TRƯỚC (khẩn cấp hơn!)
```

---

## §5. Hệ thống Priority — Lane → Scheduler Priority

```
6 MỨC ĐỘ ƯU TIÊN TRONG SCHEDULER:
═══════════════════════════════════════════════════════════════

  // scheduler/src/SchedulerPriorities.js

  ┌────┬──────────────────────┬──────────┬─────────────────────┐
  │ #  │ Priority             │ Timeout  │ Ý nghĩa              │
  ├────┼──────────────────────┼──────────┼─────────────────────┤
  │ 0  │ NoPriority           │ —        │ Không có (không dùng)│
  ├────┼──────────────────────┼──────────┼─────────────────────┤
  │ 1  │ ImmediatePriority    │ -1 ms    │ Thực thi NGAY LẬP TỨC│
  │    │                      │          │ → Hết hạn = startTime-1│
  │    │                      │          │ → Đã quá hạn rồi!    │
  ├────┼──────────────────────┼──────────┼─────────────────────┤
  │ 2  │ UserBlockingPriority │ 250 ms   │ User input, drag!     │
  │    │                      │          │ → Phải XỬ LÝ NHANH!  │
  ├────┼──────────────────────┼──────────┼─────────────────────┤
  │ 3  │ NormalPriority       │ 5000 ms  │ Mặc định! Network, etc│
  ├────┼──────────────────────┼──────────┼─────────────────────┤
  │ 4  │ LowPriority          │ 10000 ms │ Ưu tiên thấp!        │
  ├────┼──────────────────────┼──────────┼─────────────────────┤
  │ 5  │ IdlePriority         │ 2^30 - 1 │ Rảnh mới chạy!       │
  │    │                      │ ms       │ → ~12.4 ngày! 😱      │
  └────┴──────────────────────┴──────────┴─────────────────────┘

  expirationTime = startTime + timeout
  → ImmediatePriority: startTime + (-1) = startTime - 1
    → Đã QUÁ HẠN ngay khi tạo! → Chạy NGAY!
  → IdlePriority: startTime + 1073741823
    → Gần như KHÔNG BAO GIỜ hết hạn!
```

```javascript
// ═══ LANE → SCHEDULER PRIORITY CONVERSION ═══
// react-reconciler/src/ReactFiberWorkLoop.js

// React dùng Lane model cho priorities!
// Scheduler là package RIÊNG → CÓ priority system RIÊNG!
// → Cần CHUYỂN ĐỔI!

let schedulerPriorityLevel;
switch (lanesToEventPriority(nextLanes)) {
  case DiscreteEventPriority: // Click, input, focus
    schedulerPriorityLevel = ImmediateSchedulerPriority; // → 1
    break;
  case ContinuousEventPriority: // Drag, scroll, mousemove
    schedulerPriorityLevel = UserBlockingSchedulerPriority; // → 2
    break;
  case DefaultEventPriority: // Network, setTimeout
    schedulerPriorityLevel = NormalSchedulerPriority; // → 3
    break;
  case IdleEventPriority: // Idle work
    schedulerPriorityLevel = IdleSchedulerPriority; // → 5
    break;
  default:
    schedulerPriorityLevel = NormalSchedulerPriority; // → 3
    break;
}

// Truyền task + priority vào Scheduler:
newCallbackNode = scheduleCallback(
  schedulerPriorityLevel,
  performConcurrentWorkOnRoot.bind(null, root),
);

// ⚠️ SYNC TASKS (SyncLane):
// → Xử lý RIÊNG qua scheduleSyncCallback()
// → Dùng syncQueue riêng
// → Sau đó scheduleCallback với ImmediatePriority!
// → Hoặc scheduleMicrotask nếu browser hỗ trợ!
```

---

## §6. scheduleCallback — Entry point của Scheduler

```javascript
// ═══ unstable_scheduleCallback — ENTRY POINT ═══

function unstable_scheduleCallback(priorityLevel, callback, options) {
  // ══════════════════════════════════════════════════
  // BƯỚC 1: Tính startTime
  // ══════════════════════════════════════════════════
  var currentTime = getCurrentTime();
  var startTime;

  if (typeof options === "object" && options !== null) {
    var delay = options.delay;
    if (typeof delay === "number" && delay > 0) {
      startTime = currentTime + delay; // Có delay → bắt đầu SAU!
    } else {
      startTime = currentTime; // Không delay → bắt đầu NGAY!
    }
  } else {
    startTime = currentTime;
  }

  // ══════════════════════════════════════════════════
  // BƯỚC 2: Tính expirationTime (dựa trên priority!)
  // ══════════════════════════════════════════════════
  var timeout;
  switch (priorityLevel) {
    case ImmediatePriority:
      timeout = -1;
      break; // HẾT HẠN NGAY!
    case UserBlockingPriority:
      timeout = 250;
      break; // 250ms
    case IdlePriority:
      timeout = 1073741823;
      break; // 2^30-1 (~12 ngày!)
    case LowPriority:
      timeout = 10000;
      break; // 10s
    case NormalPriority:
    default:
      timeout = 5000;
      break; // 5s
  }

  var expirationTime = startTime + timeout;
  // ImmediatePriority: startTime + (-1) = startTime - 1 → ĐÃ QUÁ HẠN!

  // ══════════════════════════════════════════════════
  // BƯỚC 3: Tạo task object
  // ══════════════════════════════════════════════════
  var newTask = {
    id: taskIdCounter++, // ID tăng dần
    callback, // Hàm cần thực thi!
    priorityLevel, // Mức ưu tiên
    startTime, // Thời điểm bắt đầu
    expirationTime, // Thời điểm hết hạn
    sortIndex: -1, // Tiêu chí sắp xếp trong min-heap!
  };

  // ══════════════════════════════════════════════════
  // BƯỚC 4: Phân loại vào queue + trigger scheduling
  // ══════════════════════════════════════════════════
  if (startTime > currentTime) {
    // ── CHƯA HẾT HẠN → timerQueue ──
    newTask.sortIndex = startTime; // Sắp xếp theo startTime!
    push(timerQueue, newTask);

    // Nếu taskQueue rỗng VÀ task này ưu tiên CAO NHẤT:
    if (peek(taskQueue) === null && newTask === peek(timerQueue)) {
      if (isHostTimeoutScheduled) {
        cancelHostTimeout(); // Cancel timeout cũ!
      } else {
        isHostTimeoutScheduled = true;
      }
      // Đặt timeout: khi task "vừa hết hạn" → chuyển sang taskQueue!
      requestHostTimeout(handleTimeout, startTime - currentTime);
    }
  } else {
    // ── ĐÃ HẾT HẠN → taskQueue ──
    newTask.sortIndex = expirationTime; // Sắp xếp theo expirationTime!
    push(taskQueue, newTask);

    // Trigger scheduling nếu chưa đang schedule:
    if (!isHostCallbackScheduled && !isPerformingWork) {
      isHostCallbackScheduled = true;
      requestHostCallback(flushWork); // → Bắt đầu thực thi!
    }
  }

  return newTask;
}
```

```
scheduleCallback — TÓM TẮT:
═══════════════════════════════════════════════════════════════

  1️⃣ Tính startTime → cơ sở sắp xếp timerQueue
  2️⃣ Tính expirationTime (startTime + priority timeout)
     → Cơ sở sắp xếp taskQueue
  3️⃣ Tạo newTask { id, callback, priority, startTime, expirationTime, sortIndex }
  4️⃣ Phân loại:
     → startTime > currentTime → timerQueue + requestHostTimeout
     → startTime <= currentTime → taskQueue + requestHostCallback

  ⚠️ sortIndex = tiêu chí sắp xếp trong MIN-HEAP!
  → timerQueue: sortIndex = startTime (sớm → ở trước!)
  → taskQueue: sortIndex = expirationTime (khẩn cấp → ở trước!)
```

---

## §7. getCurrentTime & Timeout Helpers

```javascript
// ═══ getCurrentTime — LẤY THỜI GIAN HIỆN TẠI ═══

let getCurrentTime;
const hasPerformanceNow =
  typeof performance === "object" && typeof performance.now === "function";

if (hasPerformanceNow) {
  const localPerformance = performance;
  getCurrentTime = () => localPerformance.now();
  // → performance.now(): DOMHighResTimeStamp!
  // → Chính xác đến MICRO-GIÂY (microseconds)!
  // → Monotonically increasing: KHÔNG BAO GIỜ giảm!
  // → 2 lần gọi liên tiếp: kết quả SAU >= kết quả TRƯỚC!
  // → Đảm bảo time calculations chính xác!
} else {
  const localDate = Date;
  const initialTime = localDate.now();
  getCurrentTime = () => localDate.now() - initialTime;
  // → Fallback cho môi trường không có performance API!
}

// ⚠️ TẠI SAO performance.now() > Date.now()?
// → Date.now(): có thể bị ảnh hưởng bởi system clock changes!
// → performance.now(): monotonic clock → ỔN ĐỊNH!
// → Chromium source: MonotonicTimeToDOMHighResTimeStamp()
// → Noise reduction + coarsening algorithm cho kết quả chính xác!
```

```javascript
// ═══ requestHostTimeout & cancelHostTimeout ═══
// → Cặp đôi "yêu ghét lẫn nhau"!

// Đặt timeout: khi task CHƯA hết hạn → chờ đến lúc "VỪA hết hạn"
// → Delay = startTime - currentTime (= XXX_PRIORITY_TIMEOUT)
function requestHostTimeout(callback, ms) {
  taskTimeoutID = setTimeout(() => {
    callback(getCurrentTime());
  }, ms);
}

// Cancel timeout (khi có task mới ưu tiên CAO hơn):
function cancelHostTimeout() {
  clearTimeout(taskTimeoutID);
  taskTimeoutID = -1;
}

// VÍ DỤ:
// Task A: startTime = now + 250ms (UserBlocking)
// → requestHostTimeout(handleTimeout, 250)
// → Sau 250ms → handleTimeout() → chuyển task A sang taskQueue!
//
// Task B mới vào: ImmediatePriority (ưu tiên CAO hơn!)
// → cancelHostTimeout() → cancel Task A timeout!
// → Task B vào taskQueue NGAY!
```

---

## §8. handleTimeout & advanceTimers

```javascript
// ═══ handleTimeout — CHUYỂN TASK TỪ timerQueue → taskQueue ═══

function handleTimeout(currentTime) {
  isHostTimeoutScheduled = false;

  // ① Cập nhật 2 queues: kiểm tra tasks hết hạn!
  advanceTimers(currentTime);

  // ② Kiểm tra xem có đang schedule chưa:
  if (!isHostCallbackScheduled) {
    if (peek(taskQueue) !== null) {
      // taskQueue CÓ task → thực thi!
      isHostCallbackScheduled = true;
      requestHostCallback(flushWork);
    } else {
      // taskQueue TRỐNG → lấy task ĐẦU TIÊN từ timerQueue
      // → requestHostTimeout lại → ĐỆ QUY cho đến khi
      //   task đó có thể chuyển sang taskQueue!
      const firstTimer = peek(timerQueue);
      if (firstTimer !== null) {
        requestHostTimeout(handleTimeout, firstTimer.startTime - currentTime);
      }
    }
  }
}

// TÓM TẮT:
// handleTimeout = "chuyển giao viên"
// → Kiểm tra timerQueue → chuyển tasks hết hạn sang taskQueue
// → Nếu taskQueue có task → bắt đầu thực thi (flushWork)
// → Nếu không → chờ task tiếp theo hết hạn (đệ quy!)
```

```javascript
// ═══ advanceTimers — KIỂM TRA & CHUYỂN ĐỔI TASKS ═══

function advanceTimers(currentTime) {
  let timer = peek(timerQueue);

  while (timer !== null) {
    if (timer.callback === null) {
      // Task đã bị CANCEL → xóa khỏi timerQueue!
      pop(timerQueue);
    } else if (timer.startTime <= currentTime) {
      // ĐÃ HẾT HẠN! → Chuyển sang taskQueue!
      pop(timerQueue);
      timer.sortIndex = timer.expirationTime;
      //                 ↑ taskQueue sắp xếp theo expirationTime!
      push(taskQueue, timer);
    } else {
      // CHƯA HẾT HẠN → giữ nguyên trong timerQueue!
      // (timerQueue sắp xếp theo startTime → task đầu chưa hết hạn
      //  → các task sau CHẮC CHẮN cũng chưa → dừng loop!)
      return;
    }

    timer = peek(timerQueue);
  }
}

// VÍ DỤ MINH HỌA:
// timerQueue: [A(start:100), B(start:200), C(start:300)]
// currentTime = 150
//
// A: startTime(100) <= 150 → HẾT HẠN → chuyển sang taskQueue!
// B: startTime(200) > 150 → CHƯA → dừng! (C cũng chưa!)
//
// Kết quả:
// timerQueue: [B(start:200), C(start:300)]
// taskQueue: [..., A]
```

---

## §9. requestHostCallback & MessageChannel

```
TẠI SAO MESSAGECHAR — LỊCH SỬ PHÁT TRIỂN:
═══════════════════════════════════════════════════════════════

  PHIÊN BẢN CŨ (đã bị BỎ):
  requestAnimationFrame() + requestIdleCallback()

  VẤN ĐỀ VỚI rAF:
  ① rAF bị ẢNH HƯỞNG bởi user behavior!
     → Chuyển tab → frame rate KHÔNG ỔN ĐỊNH!
     → Giảm từ 60fps xuống thấp hơn khi tab inactive!
  ② rAF phụ thuộc MONITOR REFRESH RATE!
     → 60Hz, 90Hz, 120Hz (ProMotion) → khác nhau!
     → Scheduling KHÔNG ỔN ĐỊNH!
  ③ Compatibility issues phức tạp!
  → Scheduler KHÔNG THỂ kiểm soát hoàn toàn!

  VẤN ĐỀ VỚI requestIdleCallback:
  → Chỉ chạy khi browser RẢNH!
  → Thời gian idle KHÔNG dự đoán được!
  → Không đủ chính xác cho Scheduler!

  GIẢI PHÁP: MessageChannel!
  → Scheduler TỰ kiểm soát scheduling frequency!
  → Time slice mặc định = 5ms (nhỏ hơn cả ProMotion 120Hz = 8.3ms!)
  → KHÔNG phụ thuộc refresh rate, tab state, hay bất cứ gì!
  → Compatibility RẤT TỐT!
```

```javascript
// ═══ requestHostCallback — SETUP MessageChannel ═══

let schedulePerformWorkUntilDeadline;

// Node.js / IE compatibility:
if (typeof setImmediate === "function") {
  schedulePerformWorkUntilDeadline = () => {
    setImmediate(performWorkUntilDeadline);
  };
} else {
  // ══ BROWSER CHÍNH THỨC ══
  const channel = new MessageChannel();
  const port = channel.port2;

  // port1 = EXECUTOR (nhận signal + thực thi task!)
  channel.port1.onmessage = performWorkUntilDeadline;

  // port2 = SCHEDULER (gửi signal!)
  schedulePerformWorkUntilDeadline = () => {
    port.postMessage(null);
    //    ↑ Gửi signal cho port1 → "hãy thực thi task!"
  };
}

// ═══ requestHostCallback ═══
function requestHostCallback(callback) {
  scheduledHostCallback = callback; // Lưu vào biến toàn cục!

  if (!isMessageLoopRunning) {
    isMessageLoopRunning = true;
    schedulePerformWorkUntilDeadline();
    // → port2.postMessage(null)
    // → port1.onmessage = performWorkUntilDeadline
    // → Bắt đầu THỰC THI TASK!
  }
}

// ⚠️ VAI TRÒ:
// → port2 (Scheduler): GỬI lệnh "hãy làm việc!"
// → port1 (Executor): NHẬN lệnh + thực thi performWorkUntilDeadline!
// → Giống mô hình: Manager (port2) → Worker (port1)!
```

```
MESSAGEPORT SCHEDULING — TẠI SAO?
═══════════════════════════════════════════════════════════════

  TẠI SAO postMessage thay vì setTimeout(fn, 0)?
  → setTimeout(fn, 0) có MINIMUM DELAY ~4ms (browser spec!)
  → Sau vài lần nested → delay có thể lên 10ms+!
  → postMessage: KHÔNG CÓ minimum delay!
  → Chạy trong MACRO TASK queue → chạy SAU microtasks!
  → Cho phép browser render/paint GIỮA các time slices!

  FLOW:
  ① port2.postMessage(null) → gửi message
  ② Browser xử lý pending work (paint, layout, etc.)
  ③ port1.onmessage → performWorkUntilDeadline()
  ④ Thực thi task trong 5ms
  ⑤ Hết 5ms → port2.postMessage(null) lại → quay lại ②!

  → Browser CÓ CƠ HỘI render giữa các time slices!
  → User interaction KHÔNG BỊ BLOCK!
```

---

## §10. performWorkUntilDeadline — Executor

```javascript
// ═══ performWorkUntilDeadline — THỰC THI TASK TRONG TIME SLICE ═══

const performWorkUntilDeadline = () => {
  if (scheduledHostCallback !== null) {
    const currentTime = getCurrentTime();

    // ══════════ TIME SLICING! ══════════
    deadline = currentTime + yieldInterval; // deadline = now + 5ms!
    const hasTimeRemaining = true;
    // ↑ Luôn true VÌ: dù task chạy xong hay bị ngắt
    //   → trong 5ms → luôn CÒN THỜI GIAN trong time slice!

    let hasMoreWork = true;
    try {
      // scheduledHostCallback = flushWork
      // → Thực thi TASK THẬT SỰ!
      // → Return true = task bị NGẮT (chưa xong!)
      // → Return false = task HOÀN THÀNH!
      hasMoreWork = scheduledHostCallback(hasTimeRemaining, currentTime);
    } finally {
      if (hasMoreWork) {
        // ══ TASK BỊ NGẮT → LẬP LỊCH EXECUTOR MỚI! ══
        schedulePerformWorkUntilDeadline();
        // → port2.postMessage(null) → port1 nhận signal
        // → performWorkUntilDeadline() chạy lại!
        // → TIẾP TỤC task bị ngắt! (TASK RESUMPTION!)
      } else {
        // ══ TASK HOÀN THÀNH! ══
        isMessageLoopRunning = false;
        scheduledHostCallback = null;
      }
    }
  } else {
    isMessageLoopRunning = false;
  }

  // Sau khi yield → browser có cơ hội PAINT!
  needsPaint = false;
};
```

```
SCHEDULER vs EXECUTOR — MÔ HÌNH:
═══════════════════════════════════════════════════════════════

  ┌──────────────┐        Signal         ┌──────────────────┐
  │  SCHEDULER   │  ──────────────────→  │    EXECUTOR      │
  │  (port2)     │    postMessage(null)   │    (port1)       │
  │              │                        │                  │
  │ "Hãy làm    │                        │ performWork      │
  │  việc!"     │                        │ UntilDeadline()  │
  └──────────────┘                        └────────┬─────────┘
                                                   │
                                          ┌────────▼─────────┐
                                          │ flushWork()       │
                                          │    ↓              │
                                          │ workLoop()        │
                                          │    ↓              │
                                          │ Thực thi task     │
                                          │ trong 5ms!        │
                                          └────────┬─────────┘
                                                   │
                                          hasMoreWork?
                                          /           \
                                        true          false
                                        /               \
                              LẬP LỊCH               HOÀN THÀNH!
                              EXECUTOR MỚI           Dọn dẹp state.
                              (tiếp tục task!)
```

---

## §11. flushWork & workLoop — Ngắt & Phục hồi task

```javascript
// ═══ flushWork — "XẢ" TASKS ═══
// Giống nhấn nút xả bồn cầu — flush tasks ra khỏi taskQueue! 😄

function flushWork(hasTimeRemaining, initialTime) {
  // requestHostCallback không nhất thiết thực thi callback NGAY
  // → isHostCallbackScheduled có thể duy trì 1 thời gian
  // → Khi flushWork bắt đầu → GIẢI PHÓNG trạng thái!
  isHostCallbackScheduled = false;

  // Đã đang thực thi taskQueue →
  // KHÔNG cần chờ timerQueue timeout nữa!
  if (isHostTimeoutScheduled) {
    isHostTimeoutScheduled = false;
    cancelHostTimeout();
  }

  isPerformingWork = true;
  const previousPriorityLevel = currentPriorityLevel;

  try {
    // ══════════ CORE: workLoop! ══════════
    return workLoop(hasTimeRemaining, initialTime);
    //     ↑ return true = task bị ngắt!
    //     ↑ return false = tất cả tasks hoàn thành!
  } finally {
    // Phục hồi global state sau khi xong:
    currentTask = null;
    currentPriorityLevel = previousPriorityLevel;
    isPerformingWork = false;
  }
}
```

```javascript
// ═══ workLoop — CỐT LÕI CỦA SCHEDULER! ═══
// Xử lý: Lặp tasks, Ngắt, Phục hồi, Hoàn thành!

function workLoop(hasTimeRemaining, initialTime) {
  let currentTime = initialTime;

  // Cập nhật queues (vì đây là async → cần re-check!):
  advanceTimers(currentTime);

  // Lấy task KHẨN CẤP NHẤT:
  currentTask = peek(taskQueue);

  while (currentTask !== null) {
    // ══════════════════════════════════════════════
    // ĐIỀU KIỆN NGẮT TASK:
    // Task chưa quá hạn + hết time slice → NGẮT!
    // ══════════════════════════════════════════════
    if (
      currentTask.expirationTime > currentTime &&
      (!hasTimeRemaining || shouldYieldToHost())
    ) {
      // → Time slice hết (5ms!) nhưng task chưa quá hạn
      // → BREAK! → Task bị ngắt → tiếp tục lần workLoop sau!
      break;
    }

    const callback = currentTask.callback;

    if (typeof callback === "function") {
      // Xóa callback để đánh dấu:
      // → Nếu vòng lặp sau callback = null → task ĐÃ XONG!
      currentTask.callback = null;
      currentPriorityLevel = currentTask.priorityLevel;

      const didUserCallbackTimeout = currentTask.expirationTime <= currentTime;

      // ══════════ THỰC THI TASK! ══════════
      const continuationCallback = callback(didUserCallbackTimeout);
      currentTime = getCurrentTime();

      if (typeof continuationCallback === "function") {
        // ══ CONTINUATION! Task trả về function mới! ══
        // → Task bị NGẮT ở giữa → trả về phần CÒN LẠI!
        // → Gán lại callback = continuation!
        // → Vòng lặp sau sẽ TIẾP TỤC từ đây! (RESUMPTION!)
        currentTask.callback = continuationCallback;
      } else {
        // ══ HOÀN THÀNH! ══
        // → continuationCallback KHÔNG phải function
        // → Task ĐÃ XONG! → Pop ra khỏi taskQueue!
        if (currentTask === peek(taskQueue)) {
          pop(taskQueue);
        }
      }

      // Cập nhật lại queues (thực thi task tốn thời gian!):
      advanceTimers(currentTime);
    } else {
      // callback đã bị xóa (= null) → task đã xong/cancel!
      pop(taskQueue);
    }

    // Lấy task tiếp theo (hoặc cùng task nếu bị ngắt!):
    currentTask = peek(taskQueue);
  }

  // ══════════════════════════════════════════════
  // KẾT QUẢ:
  // ══════════════════════════════════════════════
  if (currentTask !== null) {
    // taskQueue CHƯA hết → return TRUE → TASK BỊ NGẮT!
    // → performWorkUntilDeadline sẽ lập lịch EXECUTOR MỚI!
    return true;
  } else {
    // taskQueue HẾT → kiểm tra timerQueue:
    const firstTimer = peek(timerQueue);
    if (firstTimer !== null) {
      requestHostTimeout(handleTimeout, firstTimer.startTime - currentTime);
    }
    return false; // → TẤT CẢ tasks HOÀN THÀNH!
  }
}
```

```
workLoop — FLOW NGẮT & PHỤC HỒI:
═══════════════════════════════════════════════════════════════

  VÍ DỤ: Task A (render 50ms) + Time slice 5ms:

  ┌─── workLoop lần 1 ─────────────────────────────────────┐
  │ currentTask = Task A                                    │
  │ callback = performConcurrentWorkOnRoot                  │
  │ → Thực thi 5ms... → shouldYieldToHost() = true!        │
  │ → callback trả về continuationCallback (phần còn lại!) │
  │ → currentTask.callback = continuationCallback!          │
  │ → return true → hasMoreWork = true!                    │
  └─── → schedulePerformWorkUntilDeadline() ───────────────┘
         ↓ (browser paint/input opportunity!)
  ┌─── workLoop lần 2 ─────────────────────────────────────┐
  │ currentTask = CÙNG Task A (chưa bị pop!)               │
  │ callback = continuationCallback (phần còn lại!)         │
  │ → Thực thi 5ms... → shouldYieldToHost() = true!        │
  │ → trả về continuation tiếp...                           │
  │ → return true → hasMoreWork = true!                    │
  └─── → schedulePerformWorkUntilDeadline() ───────────────┘
         ↓
  ┌─── workLoop lần N ─────────────────────────────────────┐
  │ currentTask = Task A                                    │
  │ → Thực thi phần cuối... XONG!                          │
  │ → continuationCallback = undefined (KHÔNG phải function)│
  │ → pop(taskQueue) → Task A bị XỬ LÝ XONG!              │
  │ → currentTask = null → return false! HOÀN THÀNH!       │
  └─────────────────────────────────────────────────────────┘
```

---

## §12. shouldYieldToHost — Nhường main thread

```javascript
// ═══ shouldYieldToHost — CÓ NÊN NHƯỜNG MAIN THREAD? ═══

function shouldYieldToHost() {
  if (
    enableIsInputPending &&
    navigator !== undefined &&
    navigator.scheduling !== undefined &&
    navigator.scheduling.isInputPending !== undefined
  ) {
    // ══ MODERN BROWSER (có isInputPending API!) ══
    const scheduling = navigator.scheduling;
    const currentTime = getCurrentTime();

    if (currentTime >= deadline) {
      // Hết time slice!
      if (needsPaint || scheduling.isInputPending()) {
        // Cần paint HOẶC có user input đang chờ → NHƯỜNG!
        return true;
      }
      // Không có input → nhường ÍT hơn → chờ maxYieldInterval!
      return currentTime >= maxYieldInterval;
    } else {
      // Còn thời gian trong time slice → TIẾP TỤC!
      return false;
    }
  } else {
    // ══ FALLBACK (không có isInputPending) ══
    // → Hết deadline thì NHƯỜNG, đơn giản!
    return getCurrentTime() >= deadline;
  }
}
```

```
shouldYieldToHost — GIẢI THÍCH:
═══════════════════════════════════════════════════════════════

  deadline = currentTime + 5ms (yieldInterval!)

  ① Nếu currentTime < deadline:
     → Vẫn còn thời gian! → return false → TIẾP TỤC!

  ② Nếu currentTime >= deadline:
     → Hết time slice!
     → Có isInputPending?
       → CÓ user input đang chờ → return true → NHƯỜNG NGAY!
       → Cần paint → return true → NHƯỜNG NGAY!
       → Không có gì → nhường ít hơn (maxYieldInterval)

  ③ Không có isInputPending API:
     → Đơn giản: hết deadline → return true → NHƯỜNG!

  ⚠️ navigator.scheduling.isInputPending():
  → API MỚI! Kiểm tra có user input đang chờ xử lý không!
  → Cải thiện responsiveness mà KHÔNG CẦN nhường main thread sớm!
  → "Better JS scheduling with isInputPending()"
```

---

## §13. Cancel & Custom Time Slice

```javascript
// ═══ CANCEL SCHEDULING ═══

function unstable_cancelCallback(task) {
  // KHÔNG thể xóa node tùy ý khỏi array-based heap!
  // (Chỉ xóa được phần tử ĐẦU TIÊN = root!)
  // → Giải pháp: set callback = null!
  // → workLoop kiểm tra: callback === null → pop & skip!
  task.callback = null;
}

// Trong workLoop:
// const callback = currentTask.callback;
// if (typeof callback === 'function') {
//     ... thực thi ...
// } else {
//     pop(taskQueue);  ← callback = null → task đã cancel!
// }
```

```javascript
// ═══ CUSTOM TIME SLICE — forceFrameRate ═══

function forceFrameRate(fps) {
  if (fps < 0 || fps > 125) {
    console["error"](
      "forceFrameRate takes a positive int between 0 and 125, " +
        "forcing frame rates higher than 125 fps is not supported",
    );
    return;
  }
  if (fps > 0) {
    yieldInterval = Math.floor(1000 / fps);
    // 60fps → yieldInterval = 16ms
    // 120fps → yieldInterval = 8ms
    // 125fps → yieldInterval = 8ms
  } else {
    yieldInterval = 5; // Reset về mặc định 5ms!
  }
}

// ⚠️ Cho phép Scheduler được đóng gói ĐỘC LẬP sau này!
// → User có thể tùy chỉnh time slice!
// → Mặc định 5ms: nhỏ hơn cả 120Hz ProMotion (8.3ms!)
// → 0-125 fps → balance giữa responsiveness & throughput!
```

---

## §14. Tổng kết & Checklist phỏng vấn

```
MIND MAP:
═══════════════════════════════════════════════════════════════

  React Scheduler
  ├── Mục đích: Phản hồi NHANH user → không block interaction!
  ├── 2 Chiều:
  │   ├── Macro: Quản lý NHIỀU tasks → sắp xếp theo PRIORITY!
  │   └── Micro: Kiểm soát TỪNG task → time slice 5ms → NGẮT + TIẾP TỤC!
  ├── 2 Queues (Min-Heap):
  │   ├── timerQueue: tasks CHƯA hết hạn → sắp xếp theo startTime!
  │   └── taskQueue: tasks ĐÃ hết hạn → sắp xếp theo expirationTime!
  ├── 6 Priorities: Immediate(-1) > UserBlocking(250) > Normal(5000)
  │                  > Low(10000) > Idle(2^30-1)
  │   └── Lane → Scheduler Priority conversion!
  ├── scheduleCallback: Entry point → tính startTime, expirationTime
  │   → phân loại vào queue → trigger scheduling!
  ├── MessageChannel (thay rAF + rIC):
  │   ├── port2 = Scheduler (gửi signal!)
  │   └── port1 = Executor (nhận signal → performWorkUntilDeadline)
  ├── workLoop: Lặp taskQueue → thực thi → ngắt khi hết 5ms!
  │   ├── continuationCallback = function → task bị NGẮT → tiếp tục!
  │   ├── continuationCallback ≠ function → task HOÀN THÀNH → pop!
  │   └── return true → hasMoreWork → schedule executor MỚI!
  ├── shouldYieldToHost: hết deadline? → NHƯỜNG main thread!
  │   └── isInputPending: API mới → check có user input chờ không!
  └── advanceTimers: kiểm tra timerQueue → chuyển tasks hết hạn → taskQueue!
```

### Checklist

- [ ] **Scheduler là gì**: Package nội bộ React; nhận tasks + priorities → lo phối hợp + lập lịch; mục tiêu: KHÔNG block user interaction!
- [ ] **2 chiều quản lý**: Macro (nhiều tasks → sắp xếp theo priority), Micro (từng task → time slice 5ms → ngắt + tiếp tục!)
- [ ] **timerQueue vs taskQueue**: timerQueue = chưa hết hạn (sort by startTime); taskQueue = đã hết hạn (sort by expirationTime); dùng MIN-HEAP!
- [ ] **Min-Heap**: Priority queue; peek() = O(1) lấy nhỏ nhất; push/pop = O(log n); lưu trong ARRAY!
- [ ] **6 Priorities**: NoPriority(0) / Immediate(-1ms) / UserBlocking(250ms) / Normal(5000ms) / Low(10000ms) / Idle(2^30-1 ms)
- [ ] **Lane → Scheduler**: DiscreteEvent→Immediate; ContinuousEvent→UserBlocking; Default→Normal; Idle→Idle; SyncLane xử lý riêng!
- [ ] **scheduleCallback**: Entry point; tính startTime + expirationTime → tạo task → phân loại vào queue → trigger scheduling!
- [ ] **expirationTime**: startTime + priority_timeout; Immediate: startTime-1 (đã quá hạn!); Idle: ~12 ngày!
- [ ] **getCurrentTime**: ưu tiên performance.now() (monotonic, microsecond!) > Date.now() (có thể bị system clock ảnh hưởng!)
- [ ] **requestHostTimeout**: setTimeout(handleTimeout, startTime-currentTime) → chờ task "vừa hết hạn" → chuyển sang taskQueue!
- [ ] **advanceTimers**: Duyệt timerQueue → task đã hết hạn → pop → push vào taskQueue; task chưa hết hạn → dừng!
- [ ] **handleTimeout**: advanceTimers → nếu taskQueue có task → flushWork; nếu không → requestHostTimeout đệ quy!
- [ ] **MessageChannel thay rAF**: rAF bị ảnh hưởng bởi tab switch + monitor refresh rate; MessageChannel: Scheduler TỰ kiểm soát; postMessage KHÔNG có minimum delay như setTimeout!
- [ ] **port2 = Scheduler, port1 = Executor**: port2.postMessage → port1.onmessage = performWorkUntilDeadline!
- [ ] **performWorkUntilDeadline**: deadline = now + 5ms; gọi flushWork → return hasMoreWork → nếu true → schedulePerformWorkUntilDeadline lại!
- [ ] **flushWork**: "xả" tasks; core = return workLoop(); giải phóng isHostCallbackScheduled + cancel timeout!
- [ ] **workLoop**: Lặp taskQueue; task chưa quá hạn + hết time slice → BREAK (ngắt!); callback trả về function → continuation (phục hồi!); trả về non-function → hoàn thành → pop!
- [ ] **Ngắt & Phục hồi**: continuationCallback = function → gán lại currentTask.callback → vòng lặp sau TIẾP TỤC từ đó; giống coroutine/yield!
- [ ] **shouldYieldToHost**: currentTime >= deadline → nhường! isInputPending API: check có user input chờ không → nhường thông minh hơn!
- [ ] **Cancel**: task.callback = null; không xóa khỏi heap (chỉ xóa root!); workLoop kiểm tra callback === null → pop & skip!
- [ ] **forceFrameRate**: Tùy chỉnh time slice 0-125fps; mặc định yieldInterval = 5ms; cho phép Scheduler dùng độc lập!

---

_Nguồn: ConardLi — "In-depth look at the time management master: React Scheduler" · TikTok Frontend Security Team · Juejin_
_Cập nhật lần cuối: Tháng 2, 2026_
