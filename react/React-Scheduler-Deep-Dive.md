# React Scheduler — Deep Dive!

> **Chủ đề**: Tự viết lại React Scheduler trong ~300 dòng code
> **Ngôn ngữ**: Tiếng Việt — giải thích cực kỳ chi tiết!
> **Phương châm**: Tự viết lại bằng tay — KHÔNG dùng thư viện!
> **Nguồn**: "Implementing React's Scheduler in 300 lines of code"
> **Hình ảnh gốc**: 1 screenshot (execution result)

---

## Mục Lục

1. [§1. Tổng Quan — Scheduler Là Gì?](#1)
2. [§2. Min-Heap — Cấu Trúc Dữ Liệu Nền Tảng](#2)
3. [§3. Priority System — 5 Mức Ưu Tiên](#3)
4. [§4. Core Flow — unstable_scheduleCallback](#4)
5. [§5. Time Slicing — MessageChannel + workLoop](#5)
6. [§6. Timer Queue — Delayed Tasks](#6)
7. [§7. Phân Tích Hình Gốc + Execution Trace](#7)
8. [§8. Sơ Đồ Tự Vẽ](#8)
9. [§9. Tự Viết — SchedulerEngine](#9)
10. [§10. Câu Hỏi Luyện Tập](#10)

---

## §1. Tổng Quan — Scheduler Là Gì?

```
  REACT SCHEDULER:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  ĐỊNH NGHĨA:                                                 │
  │  Scheduler = BỘ LẬP LỊCH của React!                         │
  │  → Quản lý THỨ TỰ và THỜI ĐIỂM thực thi task!              │
  │  → Cho phép React NGẮT task (interruptible rendering!)       │
  │  → Chia công việc thành time slices (5ms)!                   │
  │                                                              │
  │  TẠI SAO CẦN:                                                │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ KHÔNG CÓ Scheduler:                                 │    │
  │  │ → 1 task lớn = BLOCK main thread!                  │    │
  │  │ → UI đóng BĂNG! User click = KHÔNG phản hồi!      │    │
  │  │                                                      │    │
  │  │ CÓ Scheduler:                                        │    │
  │  │ → Task chia nhỏ thành 5ms slices!                  │    │
  │  │ → Giữa mỗi slice = NHƯỜNG thread cho browser!     │    │
  │  │ → Browser render UI, xử lý events!                 │    │
  │  │ → Rồi tiếp tục task!                               │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  CÁC THÀNH PHẦN:                                              │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ 1. Min-Heap: cấu trúc dữ liệu cho priority queue! │    │
  │  │ 2. taskQueue: hàng đợi task thường!                │    │
  │  │ 3. timerQueue: hàng đợi task trì hoãn (delay!)     │    │
  │  │ 4. Priority levels: 5 mức ưu tiên!                │    │
  │  │ 5. Time slicing: 5ms + MessageChannel!              │    │
  │  │ 6. workLoop: vòng lặp thực thi task!               │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```

---

## §2. Min-Heap — Cấu Trúc Dữ Liệu Nền Tảng!

```
  MIN-HEAP:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  ĐỊNH NGHĨA:                                                 │
  │  → Cây nhị phân hoàn chỉnh!                                 │
  │  → Node CHA luôn NHỎ HƠN hoặc BẰNG node CON!               │
  │  → Root (index 0) = GIÁ TRỊ NHỎ NHẤT!                     │
  │  → Lưu dưới dạng ARRAY!                                     │
  │                                                              │
  │  VÍ DỤ:                                                       │
  │              1                                                │
  │            /   \                                              │
  │           3     5          Array: [1, 3, 5, 7, 4, 8]         │
  │          / \   /                                              │
  │         7   4 8                                               │
  │                                                              │
  │  INDEX RELATIONSHIPS:                                         │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ Parent index = (childIndex - 1) >>> 1  (bit shift!) │    │
  │  │ Left child   = (parentIndex + 1) * 2 - 1            │    │
  │  │ Right child  = leftIndex + 1                         │    │
  │  │                                                      │    │
  │  │ >>> 1 = chia 2 làm tròn xuống (unsigned right shift)│    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  3 OPERATIONS:                                                │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ push(heap, node): thêm + siftUp!                   │    │
  │  │ peek(heap): xem node nhỏ nhất (heap[0])!           │    │
  │  │ pop(heap): lấy ra + siftDown!                      │    │
  │  │                                                      │    │
  │  │ siftUp: node mới → so với cha → swap nếu nhỏ hơn! │    │
  │  │ siftDown: root mới → so với con → swap nếu lớn hơn!│    │
  │  │                                                      │    │
  │  │ compare(a, b):                                       │    │
  │  │   → So sánh sortIndex trước!                       │    │
  │  │   → Bằng nhau → so sánh id (FIFO!)                │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```

---

## §3. Priority System — 5 Mức Ưu Tiên!

```
  PRIORITY + TIMEOUT:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  ┌────────────────────┬───────┬────────────┬──────────────┐ │
  │  │ Priority           │ Value │ Timeout    │ Ý nghĩa      │ │
  │  ├────────────────────┼───────┼────────────┼──────────────┤ │
  │  │ ImmediatePriority  │   1   │ -1ms       │ Quá hạn NGAY!│ │
  │  │ UserBlockingPri.   │   2   │ 250ms      │ Click, input │ │
  │  │ NormalPriority     │   3   │ 5000ms     │ Render thường│ │
  │  │ LowPriority        │   4   │ 10000ms    │ Ít quan trọng│ │
  │  │ IdlePriority       │   5   │ 1073741823 │ Rảnh mới làm│ │
  │  └────────────────────┴───────┴────────────┴──────────────┘ │
  │                                                              │
  │  TIMEOUT GIẢI THÍCH:                                          │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ → Task CÓ THỂ bị ngắt (interrupted)!               │    │
  │  │ → NHƯNG không thể bị ngắt MÃI MÃI!               │    │
  │  │ → Timeout = sau bao lâu PHẢI thực thi!            │    │
  │  │                                                      │    │
  │  │ expirationTime = startTime + timeout                 │    │
  │  │                                                      │    │
  │  │ → ImmediatePriority: -1ms = ĐÃ QUÁ HẠN!          │    │
  │  │ → IdlePriority: ~12.4 ngày = gần như VÔ HẠN!      │    │
  │  │   (1073741823ms = 2^30 - 1 = max 32-bit signed /2) │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  TASK OBJECT:                                                 │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ {                                                    │    │
  │  │   id: 1,              // unique ID (tăng dần)       │    │
  │  │   callback: fn,       // hàm thực thi               │    │
  │  │   priorityLevel: 3,   // mức ưu tiên               │    │
  │  │   startTime: 1000,    // thời điểm lên lịch        │    │
  │  │   expirationTime: 6000, // thời điểm hết hạn      │    │
  │  │   sortIndex: 6000     // key sắp xếp trong heap     │    │
  │  │ }                                                    │    │
  │  │                                                      │    │
  │  │ taskQueue: sortIndex = expirationTime                │    │
  │  │ timerQueue: sortIndex = startTime                    │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```

---

## §4. Core Flow — unstable_scheduleCallback!

```
  SCHEDULING FLOW:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  unstable_scheduleCallback(priority, callback, options)      │
  │       │                                                      │
  │       ▼                                                      │
  │  Tính startTime:                                              │
  │  → có delay? startTime = now + delay                        │
  │  → không?    startTime = now                                 │
  │       │                                                      │
  │       ▼                                                      │
  │  Tính expirationTime = startTime + timeout(priority)         │
  │       │                                                      │
  │       ▼                                                      │
  │  Tạo task object { id, callback, priority, startTime,        │
  │                     expirationTime, sortIndex }              │
  │       │                                                      │
  │       ▼                                                      │
  │  ┌─── startTime > currentTime? ───────────────────────┐     │
  │  │                                                      │    │
  │  │  YES (DELAYED TASK!)         NO (NORMAL TASK!)      │    │
  │  │  │                            │                      │    │
  │  │  ▼                            ▼                      │    │
  │  │  sortIndex = startTime       sortIndex = expiration  │    │
  │  │  push(timerQueue)            push(taskQueue)         │    │
  │  │  │                            │                      │    │
  │  │  ▼                            ▼                      │    │
  │  │  taskQueue rỗng?             requestHostCallback     │    │
  │  │  → requestHostTimeout       (flushWork)              │    │
  │  │  (handleTimeout, delay)      │                      │    │
  │  │                               ▼                      │    │
  │  │                        MessageChannel                │    │
  │  │                        → performWorkUntilDeadline   │    │
  │  │                        → flushWork → workLoop       │    │
  │  │                                                      │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```

---

## §5. Time Slicing — MessageChannel + workLoop!

```
  TIME SLICING:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  TẠI SAO MessageChannel?                                      │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ → setTimeout(fn, 0) tối thiểu 4ms (browser limit!) │    │
  │  │ → requestAnimationFrame phụ thuộc refresh rate!     │    │
  │  │ → requestIdleCallback không đáng tin cậy!          │    │
  │  │ → MessageChannel = macro task, ~0ms delay!          │    │
  │  │ → PERFECT cho việc nhường thread!                   │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  CƠ CHẾ:                                                     │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ const channel = new MessageChannel()                 │    │
  │  │ const port = channel.port2                           │    │
  │  │ channel.port1.onmessage = performWorkUntilDeadline   │    │
  │  │                                                      │    │
  │  │ // Nhường thread:                                    │    │
  │  │ port.postMessage(null)                               │    │
  │  │ → Đặt callback vào macro task queue!               │    │
  │  │ → Browser xử lý việc của nó TRƯỚC!                │    │
  │  │ → Rồi mới gọi performWorkUntilDeadline!            │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  WORKLOOP:                                                    │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ while (currentTask !== null) {                       │    │
  │  │   // Chưa hết hạn + đã quá 5ms? → BREAK!          │    │
  │  │   if (notExpired && shouldYield()) break;            │    │
  │  │                                                      │    │
  │  │   // Thực thi task                                   │    │
  │  │   result = task.callback(isExpired)                   │    │
  │  │                                                      │    │
  │  │   if (result === function) {                         │    │
  │  │     // Task bị NGẮT giữa chừng!                    │    │
  │  │     task.callback = result // Lưu lại!              │    │
  │  │   } else {                                           │    │
  │  │     pop(taskQueue) // Task HOÀN THÀNH!              │    │
  │  │   }                                                  │    │
  │  │ }                                                    │    │
  │  │                                                      │    │
  │  │ return hasMoreWork? → schedulePerformWork...        │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  shouldYieldToHost():                                         │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ timeElapsed = getCurrentTime() - batchStartTime      │    │
  │  │ return timeElapsed >= 5ms (frameInterval)            │    │
  │  │                                                      │    │
  │  │ → KHÔNG phải mỗi task 5ms!                         │    │
  │  │ → Mỗi BATCH tasks 5ms!                             │    │
  │  │ → Xong 1 task, check thời gian, chưa 5ms → tiếp! │    │
  │  │ → Quá 5ms → nhường thread!                        │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```

---

## §6. Timer Queue — Delayed Tasks!

```
  TIMER QUEUE:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  2 HÀNG ĐỢI:                                                 │
  │  ┌──────────────┐     ┌──────────────┐                      │
  │  │ taskQueue    │     │ timerQueue   │                      │
  │  │ (thường)     │     │ (trì hoãn)   │                      │
  │  │              │     │              │                      │
  │  │ sortIndex =  │     │ sortIndex =  │                      │
  │  │ expiration   │     │ startTime    │                      │
  │  │ Time!        │     │              │                      │
  │  └──────────────┘     └──────────────┘                      │
  │         ▲                     │                              │
  │         │   advanceTimers()   │                              │
  │         └─────────────────────┘                              │
  │         Khi startTime <= now → chuyển sang taskQueue!       │
  │                                                              │
  │  advanceTimers(currentTime):                                  │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ while (timer = peek(timerQueue)) {                   │    │
  │  │   if (timer.callback === null) → pop (bị cancel!)  │    │
  │  │   if (timer.startTime <= now)  → chuyển taskQueue! │    │
  │  │   else → chưa đến lúc, break!                     │    │
  │  │ }                                                    │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  handleTimeout:                                               │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ → setTimeout gọi khi delay hết!                    │    │
  │  │ → advanceTimers: chuyển tasks đến hạn!             │    │
  │  │ → taskQueue có task? → requestHostCallback!        │    │
  │  │ → taskQueue rỗng? → set timeout cho timer tiếp!   │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```

---

## §7. Phân Tích Hình Gốc + Execution Trace!

```
  HÌNH GỐC — EXECUTION RESULT:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  Console output:                                              │
  │  ┌──────────────────────────────────────────┐                │
  │  │  workLoop start                          │                │
  │  │  1                                       │                │
  │  │  4                                       │                │
  │  │  workLoop start                          │                │
  │  │  5                                       │                │
  │  │  2                                       │                │
  │  │  workLoop start                          │                │
  │  │  3                                       │                │
  │  └──────────────────────────────────────────┘                │
  │                                                              │
  │  TEST CODE:                                                   │
  │  Task A: priority=3, callback=()=>log(1)                     │
  │  Task B: priority=3, callback=()=>{log(2);sleep(10)},delay=10│
  │  Task C: priority=3, callback=()=>log(3), delay=10           │
  │  Task D: priority=3, callback=()=>{log(4);sleep(10)}         │
  │  Task E: priority=3, callback=()=>log(5)                     │
  │                                                              │
  │  TRACE:                                                       │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ t=0: Schedule A,D,E → taskQueue (không delay!)     │    │
  │  │      Schedule B,C   → timerQueue (delay=10ms!)     │    │
  │  │                                                      │    │
  │  │ taskQueue (by expirationTime):                       │    │
  │  │   A(id=1), D(id=4), E(id=5) — cùng priority!      │    │
  │  │                                                      │    │
  │  │ timerQueue (by startTime):                           │    │
  │  │   B(id=2), C(id=3) — delay=10ms!                   │    │
  │  │                                                      │    │
  │  │ ── BATCH 1 (workLoop start) ──                      │    │
  │  │ Execute A → log(1) — nhanh, <5ms!                  │    │
  │  │ Execute D → log(4), sleep(10ms) — quá 5ms!        │    │
  │  │ shouldYield() = true → BREAK! Nhường thread!       │    │
  │  │                                                      │    │
  │  │ ── BATCH 2 (workLoop start) ──                      │    │
  │  │ advanceTimers: B,C đã hết delay → taskQueue!       │    │
  │  │ Execute E → log(5) — nhanh!                        │    │
  │  │ Execute B → log(2), sleep(10ms) — quá 5ms!        │    │
  │  │ shouldYield() = true → BREAK!                      │    │
  │  │                                                      │    │
  │  │ ── BATCH 3 (workLoop start) ──                      │    │
  │  │ Execute C → log(3) — cuối cùng!                   │    │
  │  │ taskQueue rỗng → DONE!                             │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```

---

## §8. Sơ Đồ Tự Vẽ!

### Sơ Đồ 1: Complete Scheduler Architecture

```
  ARCHITECTURE:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  unstable_scheduleCallback(priority, callback, {delay})      │
  │       │                                                      │
  │       ├─── delay? ─── YES ──→ push(timerQueue)              │
  │       │                          │                           │
  │       │                     setTimeout(handleTimeout)        │
  │       │                          │                           │
  │       │                     handleTimeout:                    │
  │       │                     advanceTimers → taskQueue        │
  │       │                          │                           │
  │       └─── NO ───→ push(taskQueue)                          │
  │                          │                                   │
  │                    requestHostCallback(flushWork)             │
  │                          │                                   │
  │                    MessageChannel.postMessage()               │
  │                          │                                   │
  │                    ┌─── NHƯỜNG THREAD ───┐                  │
  │                    │ Browser: paint,     │                  │
  │                    │ events, layout...   │                  │
  │                    └─────────┬───────────┘                  │
  │                              │                               │
  │                    performWorkUntilDeadline()                 │
  │                              │                               │
  │                    flushWork → workLoop                      │
  │                              │                               │
  │                    ┌─── LOOP ────────────────────┐          │
  │                    │ task = peek(taskQueue)       │          │
  │                    │ Quá 5ms? → break + postMsg! │          │
  │                    │ Execute task.callback()      │          │
  │                    │ Return fn? → task bị ngắt!  │          │
  │                    │ Else → pop(taskQueue)        │          │
  │                    │ advanceTimers()               │          │
  │                    └──────────────────────────────┘          │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```

### Sơ Đồ 2: Time Slicing Visual

```
  TIME SLICING (5ms batches):
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  Main Thread Timeline:                                       │
  │                                                              │
  │  ┌─ Batch 1 ──┐  ┌ Browser ┐  ┌─ Batch 2 ──┐  ┌Browser┐  │
  │  │ Task A (1ms)│  │ Paint   │  │ Task E (1ms)│  │ Paint │  │
  │  │ Task D (10ms│  │ Events  │  │ Task B (10ms│  │ Events│  │
  │  │ >5ms YIELD! │  │ Layout  │  │ >5ms YIELD! │  │ ...   │  │
  │  └─────────────┘  └─────────┘  └─────────────┘  └───────┘  │
  │  |←── 5ms+ ──→|   |← idle →|  |←── 5ms+ ──→|              │
  │                                                              │
  │  → Task xong + chưa 5ms → tiếp task kế!                   │
  │  → Task xong + quá 5ms → NHƯỜNG thread!                   │
  │  → Browser xong → tiếp batch mới!                          │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```

---

## §9. Tự Viết — SchedulerEngine!

```javascript
/**
 * SchedulerEngine — Mô phỏng React Scheduler!
 * Tự viết bằng tay, KHÔNG dùng thư viện nào!
 * Covers: MinHeap, Priority, TaskQueue, TimerQueue, WorkLoop
 */
var SchedulerEngine = (function () {

  // ═══════════════════════════════════
  // 1. MIN-HEAP — Cấu trúc dữ liệu
  // ═══════════════════════════════════
  function heapCompare(a, b) {
    var diff = a.sortIndex - b.sortIndex;
    return diff !== 0 ? diff : a.id - b.id;
  }

  function heapPush(heap, node) {
    heap.push(node);
    // Sift up: node mới đi LÊN đến vị trí đúng
    var index = heap.length - 1;
    while (index > 0) {
      var parentIndex = (index - 1) >>> 1; // chia 2
      if (heapCompare(heap[parentIndex], heap[index]) > 0) {
        // Cha lớn hơn → swap!
        var temp = heap[parentIndex];
        heap[parentIndex] = heap[index];
        heap[index] = temp;
        index = parentIndex;
      } else {
        break;
      }
    }
  }

  function heapPeek(heap) {
    return heap.length === 0 ? null : heap[0];
  }

  function heapPop(heap) {
    if (heap.length === 0) return null;
    var first = heap[0];
    var last = heap.pop();
    if (last !== first) {
      heap[0] = last;
      // Sift down: root mới đi XUỐNG đến vị trí đúng
      var index = 0;
      var length = heap.length;
      var halfLength = length >>> 1;
      while (index < halfLength) {
        var leftIndex = (index + 1) * 2 - 1;
        var rightIndex = leftIndex + 1;
        // Tìm con nhỏ nhất
        if (rightIndex < length &&
            heapCompare(heap[rightIndex], heap[leftIndex]) < 0) {
          // Right nhỏ hơn
          if (heapCompare(heap[rightIndex], heap[index]) < 0) {
            var t = heap[index];
            heap[index] = heap[rightIndex];
            heap[rightIndex] = t;
            index = rightIndex;
          } else break;
        } else if (heapCompare(heap[leftIndex], heap[index]) < 0) {
          var t2 = heap[index];
          heap[index] = heap[leftIndex];
          heap[leftIndex] = t2;
          index = leftIndex;
        } else break;
      }
    }
    return first;
  }

  // ═══════════════════════════════════
  // 2. PRIORITY CONSTANTS
  // ═══════════════════════════════════
  var PRIORITIES = {
    IMMEDIATE: { level: 1, timeout: -1, name: 'Immediate' },
    USER_BLOCKING: { level: 2, timeout: 250, name: 'UserBlocking' },
    NORMAL: { level: 3, timeout: 5000, name: 'Normal' },
    LOW: { level: 4, timeout: 10000, name: 'Low' },
    IDLE: { level: 5, timeout: 1073741823, name: 'Idle' }
  };

  function getTimeout(priorityLevel) {
    switch (priorityLevel) {
      case 1: return -1;
      case 2: return 250;
      case 4: return 10000;
      case 5: return 1073741823;
      default: return 5000;
    }
  }

  // ═══════════════════════════════════
  // 3. SCHEDULER STATE
  // ═══════════════════════════════════
  var taskQueue = [];
  var timerQueue = [];
  var taskIdCounter = 1;
  var frameInterval = 5; // 5ms time slice!
  var currentTime = 0;

  function resetState() {
    taskQueue = [];
    timerQueue = [];
    taskIdCounter = 1;
    currentTime = 0;
  }

  // ═══════════════════════════════════
  // 4. SCHEDULE CALLBACK
  // ═══════════════════════════════════
  function scheduleCallback(priorityLevel, callback, options) {
    var startTime = currentTime;
    if (options && typeof options.delay === 'number' && options.delay > 0) {
      startTime = currentTime + options.delay;
    }

    var timeout = getTimeout(priorityLevel);
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
      // Delayed task → timerQueue!
      newTask.sortIndex = startTime;
      heapPush(timerQueue, newTask);
    } else {
      // Normal task → taskQueue!
      newTask.sortIndex = expirationTime;
      heapPush(taskQueue, newTask);
    }

    return newTask;
  }

  // ═══════════════════════════════════
  // 5. ADVANCE TIMERS
  // ═══════════════════════════════════
  function advanceTimers() {
    var timer = heapPeek(timerQueue);
    while (timer !== null) {
      if (timer.callback === null) {
        heapPop(timerQueue); // Cancelled!
      } else if (timer.startTime <= currentTime) {
        heapPop(timerQueue);
        timer.sortIndex = timer.expirationTime;
        heapPush(taskQueue, timer); // Chuyển sang taskQueue!
      } else {
        break; // Chưa đến hạn
      }
      timer = heapPeek(timerQueue);
    }
  }

  // ═══════════════════════════════════
  // 6. WORK LOOP SIMULATION
  // ═══════════════════════════════════
  function simulateWorkLoop() {
    var log = [];
    var batchCount = 0;

    while (heapPeek(taskQueue) !== null || heapPeek(timerQueue) !== null) {
      advanceTimers();
      if (heapPeek(taskQueue) === null) {
        // Tua thời gian tới timer sớm nhất
        var nextTimer = heapPeek(timerQueue);
        if (nextTimer) {
          currentTime = nextTimer.startTime;
          advanceTimers();
        } else break;
      }

      batchCount++;
      var batchLog = { batch: batchCount, tasks: [] };
      var batchStart = currentTime;

      var task = heapPeek(taskQueue);
      while (task !== null) {
        var elapsed = currentTime - batchStart;
        if (task.expirationTime > currentTime && elapsed >= frameInterval) {
          batchLog.yieldReason = 'Quá 5ms! Nhường thread!';
          break; // shouldYield!
        }

        var cb = task.callback;
        if (typeof cb === 'function') {
          task.callback = null;
          var isExpired = task.expirationTime <= currentTime;
          var taskDuration = cb._duration || 0;

          batchLog.tasks.push({
            id: task.id,
            expired: isExpired,
            duration: taskDuration + 'ms'
          });

          currentTime += taskDuration;
          heapPop(taskQueue);
          advanceTimers();
        } else {
          heapPop(taskQueue);
        }

        task = heapPeek(taskQueue);
      }
      log.push(batchLog);
    }
    return log;
  }

  // ═══════════════════════════════════
  // DEMO
  // ═══════════════════════════════════
  function demo() {
    console.log('╔═══════════════════════════════════════════╗');
    console.log('║  SCHEDULER ENGINE — DEMO                    ║');
    console.log('╚═══════════════════════════════════════════╝');

    // 1. MinHeap test
    console.log('\n--- 1. MIN-HEAP ---');
    var heap = [];
    heapPush(heap, { id: 1, sortIndex: 5 });
    heapPush(heap, { id: 2, sortIndex: 2 });
    heapPush(heap, { id: 3, sortIndex: 8 });
    heapPush(heap, { id: 4, sortIndex: 1 });
    console.log('Peek (min):', heapPeek(heap).sortIndex); // 1
    console.log('Pop order:',
      heapPop(heap).sortIndex, // 1
      heapPop(heap).sortIndex, // 2
      heapPop(heap).sortIndex, // 5
      heapPop(heap).sortIndex  // 8
    );

    // 2. Schedule tasks (match article test!)
    console.log('\n--- 2. SCHEDULE TASKS ---');
    resetState();

    var fn1 = function() {}; fn1._duration = 1;
    var fn2 = function() {}; fn2._duration = 10;
    var fn3 = function() {}; fn3._duration = 1;
    var fn4 = function() {}; fn4._duration = 10;
    var fn5 = function() {}; fn5._duration = 1;

    scheduleCallback(3, fn1);                   // Task 1
    scheduleCallback(3, fn2, { delay: 10 });    // Task 2 (delay!)
    scheduleCallback(3, fn3, { delay: 10 });    // Task 3 (delay!)
    scheduleCallback(3, fn4);                   // Task 4
    scheduleCallback(3, fn5);                   // Task 5

    console.log('taskQueue:', taskQueue.map(function(t) { return t.id; }));
    console.log('timerQueue:', timerQueue.map(function(t) { return t.id; }));

    // 3. Simulate workLoop
    console.log('\n--- 3. WORK LOOP ---');
    var result = simulateWorkLoop();
    console.log(JSON.stringify(result, null, 2));

    // 4. Priority ordering
    console.log('\n--- 4. PRIORITY ORDERING ---');
    resetState();
    var pA = function(){}; pA._duration = 1;
    var pB = function(){}; pB._duration = 1;
    var pC = function(){}; pC._duration = 1;

    scheduleCallback(3, pA); // Normal (timeout 5000)
    scheduleCallback(1, pB); // Immediate (timeout -1)
    scheduleCallback(5, pC); // Idle (timeout huge)

    console.log('Order (by expirationTime):',
      taskQueue.map(function(t) {
        return 'id=' + t.id + ' exp=' + t.expirationTime;
      }));
    // Immediate first! (smallest expirationTime)

    console.log('\n╔═══════════════════════════════════════════╗');
    console.log('║  ✅ Demo Complete!                           ║');
    console.log('╚═══════════════════════════════════════════╝');
  }

  return {
    heapPush: heapPush,
    heapPeek: heapPeek,
    heapPop: heapPop,
    PRIORITIES: PRIORITIES,
    scheduleCallback: scheduleCallback,
    advanceTimers: advanceTimers,
    simulateWorkLoop: simulateWorkLoop,
    resetState: resetState,
    demo: demo
  };
})();

// Chạy: SchedulerEngine.demo();
```

---

## §10. Câu Hỏi Luyện Tập!

### ❓ Câu 1: React Scheduler giải quyết vấn đề gì?

**Trả lời:**

Scheduler giải quyết **blocking main thread**! Không có Scheduler:
- 1 task render lớn = UI ĐÓNG BĂNG!
- User click = KHÔNG phản hồi!

Có Scheduler:
- Task chia thành **5ms time slices**!
- Giữa mỗi slice → nhường thread cho browser paint, events!
- Tasks có **priority** → urgent task chạy trước!

### ❓ Câu 2: Tại sao dùng MessageChannel thay vì setTimeout?

**Trả lời:**

| Method | Delay | Vấn đề |
|---|---|---|
| `setTimeout(fn, 0)` | **≥4ms** (browser minimum!) | Quá chậm cho 5ms slice! |
| `requestAnimationFrame` | ~16ms | Phụ thuộc refresh rate! |
| `requestIdleCallback` | Không đảm bảo | Không đáng tin cậy! |
| **`MessageChannel`** | **~0ms** | Macro task, gần như instant! ✅ |

→ MessageChannel = macro task với ~0ms delay, PERFECT cho time slicing!

### ❓ Câu 3: 5ms time slice hoạt động thế nào?

**Trả lời:**

KHÔNG phải mỗi task 5ms! Mà mỗi **BATCH** tasks 5ms!

```
Batch bắt đầu → batchStart = now
  Task A: 1ms → xong, elapsed=1ms < 5ms → TIẾP!
  Task B: 3ms → xong, elapsed=4ms < 5ms → TIẾP!
  Task C: 2ms → xong, elapsed=6ms > 5ms → NHƯỜNG THREAD!
```

→ `shouldYieldToHost()` check `getCurrentTime() - batchStart >= 5ms`

### ❓ Câu 4: taskQueue vs timerQueue?

**Trả lời:**

| Queue | Chứa | Sort by | Khi nào vào |
|---|---|---|---|
| **taskQueue** | Task thường | `expirationTime` | Không có delay |
| **timerQueue** | Task trì hoãn | `startTime` | Có delay option |

→ `advanceTimers()` chuyển task từ timerQueue → taskQueue khi `startTime <= now`!

### ❓ Câu 5: Task bị ngắt giữa chừng xử lý thế nào?

**Trả lời:**

```javascript
var result = task.callback(isExpired)

if (typeof result === 'function') {
  // Task bị NGẮT! Lưu continuation!
  task.callback = result  // Lần chạy tiếp = tiếp tục!
} else {
  pop(taskQueue)  // Task HOÀN THÀNH!
}
```

→ Callback return **function** = "chưa xong, chạy tiếp lần sau!"
→ Callback return **không phải function** = "xong rồi, pop ra!"

### ❓ Câu 6: Giải thích output: 1, 4, 5, 2, 3?

**Trả lời:**

```
t=0: taskQueue=[1,4,5] (no delay), timerQueue=[2,3] (delay=10)

Batch 1: Task 1 (1ms) + Task 4 (10ms) = 11ms > 5ms → YIELD
Output: 1, 4

Batch 2: advanceTimers → 2,3 chuyển sang taskQueue
Task 5 (1ms) + Task 2 (10ms) = 11ms > 5ms → YIELD
Output: 5, 2

Batch 3: Task 3 (1ms) → DONE
Output: 3
```

→ Tasks 2,3 có delay → vào timerQueue → chạy SAU tasks 1,4,5!

### ❓ Câu 7: Min-Heap dùng để làm gì?

**Trả lời:**

Min-Heap = **priority queue**!
- O(1) peek: lấy task ưu tiên nhất!
- O(log n) push/pop: thêm/xóa task!
- Compare: `sortIndex` trước, `id` sau (FIFO khi cùng priority!)
- taskQueue sort by `expirationTime` → task sắp hết hạn = ưu tiên!
- timerQueue sort by `startTime` → task sớm nhất = ưu tiên!

---

> 🎯 **Tổng kết React Scheduler:**
> - **Min-Heap**: O(1) peek, O(log n) push/pop cho priority queue!
> - **5 priorities**: Immediate(-1ms) → Idle(~12 ngày) — số nhỏ = ưu tiên cao!
> - **2 queues**: taskQueue (expirationTime) + timerQueue (startTime)!
> - **Time slicing**: 5ms batches + MessageChannel (~0ms delay) nhường thread!
> - **workLoop**: lấy task → thực thi → check 5ms → yield → batch tiếp!
> - **advanceTimers**: chuyển delayed tasks từ timerQueue → taskQueue!
> - **Task interruption**: callback return function = chưa xong, tiếp lần sau!
> - **SchedulerEngine** tự viết: MinHeap + Priority + Schedule + WorkLoop!
> - **7 câu hỏi** luyện tập với đáp án chi tiết!
