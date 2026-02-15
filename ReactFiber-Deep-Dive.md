# React Fiber Architecture — Deep Dive

> 📅 2026-02-13 · ⏱ 25 phút đọc
>
> Fiber hoạt động như thế nào? Giải quyết vấn đề gì?
> Stack Reconciler → Fiber Reconciler, Scheduler, Lanes, Time Slicing,
> Concurrent Mode, Suspense, Automatic Batching
> Độ khó: ⭐️⭐️⭐️⭐️⭐️ | Ultimate React Core Interview

---

## Mục Lục

| #   | Phần                                   |
| --- | -------------------------------------- |
| 1   | Vấn đề của Stack Reconciler (React 15) |
| 2   | Fiber là gì? Ý tưởng cốt lõi           |
| 3   | Fiber Node — Cấu trúc dữ liệu          |
| 4   | Fiber Tree — Double Buffering          |
| 5   | Work Loop — Interruptible Rendering    |
| 6   | Scheduler — Hệ thống ưu tiên           |
| 7   | Lanes — Mô hình ưu tiên thế hệ mới     |
| 8   | Render Phase vs Commit Phase           |
| 9   | Concurrent Features (React 18)         |
| 10  | Time Slicing — Chia nhỏ công việc      |
| 11  | Suspense — Chờ async data              |
| 12  | Tổng kết & Checklist phỏng vấn         |

---

## §1. Vấn đề của Stack Reconciler (React 15)

```
REACT 15 — STACK RECONCILER:
═══════════════════════════════════════════════════════════════

  React 15 dùng ĐỆ QUY để đối chiếu (reconcile) VDOM:

  function reconcile(element, container) {
      // Tạo/cập nhật DOM
      updateDOM(element, container);
      // ĐỆ QUY xử lý children:
      element.children.forEach(child =>
          reconcile(child, getChildContainer(child))  ← ĐỆ QUY!
      );
  }

  VẤN ĐỀ: Đệ quy = Stack-based = KHÔNG THỂ DỪNG!
  → Call stack quản lý → phải chạy hết mới return!
  → Không có cách "pause" giữa chừng!
```

```
TẠI SAO STACK RECONCILER LÀ VẤN ĐỀ:
═══════════════════════════════════════════════════════════════

  60fps = 16.67ms / frame

  ┌──────── 1 Frame (16.67ms) ────────┐
  │ Input → JS → Layout → Paint       │
  └────────────────────────────────────┘

  NẾU reconcile mất 100ms (tree lớn):

  ┌──── Frame 1 ────┐┌──── Frame 2 ────┐┌──── Frame 3 ────┐
  │ JS (reconcile)...│.....................│.............done│
  │ ❌ KHÔNG Paint!  │ ❌ KHÔNG Paint!   │ Paint rồi mới│
  └─────────────────┘└──────────────────┘└────────────────┘
  → 6 frames bị bỏ lỡ → UI ĐỨNG 100ms! 💀

  BIỂU HIỆN:
  → Animation giật (dropped frames)
  → Input lag (gõ chữ chậm phản hồi)
  → Scroll không mượt
  → Hover effects trễ

  VÍ DỤ THỰC TẾ:
  → Bảng 10,000 rows re-render → UI đứng 200ms!
  → Autocomplete dropdown → gõ chữ bị delay!
  → Chart update → animation bị giật!
```

```
THỬ NGHIỆM — BLOCKING MAIN THREAD:
═══════════════════════════════════════════════════════════════

  // Giả lập Stack Reconciler blocking:
  function heavyUpdate() {
      // Render 10,000 items → reconcile ĐỆ QUY:
      for (let i = 0; i < 10000; i++) {
          createElement('div', { key: i }, `Item ${i}`);
          updateDOM(...); // Mỗi node: 0.01ms × 10,000 = 100ms!
      }
  }

  // Trong 100ms này:
  // ❌ User click → KHÔNG phản hồi!
  // ❌ Animation → KHÔNG chạy!
  // ❌ Input → KHÔNG hiển thị ký tự đã gõ!
  // → Main thread bị KHÓA hoàn toàn!

  GIẢI PHÁP: CHIA NHỎ CÔNG VIỆC + CHO PHÉP XEN KẼ!
  → Đó chính là FIBER! 🚀
```

---

## §2. Fiber là gì? Ý tưởng cốt lõi

```
FIBER — 3 NGHĨA:
═══════════════════════════════════════════════════════════════

  ① KIẾN TRÚC (Architecture):
     React Fiber = Reconciler MỚI thay Stack Reconciler
     → Incremental rendering: chia nhỏ render thành units
     → Có thể pause, abort, resume, reuse work

  ② ĐƠN VỊ CÔNG VIỆC (Unit of Work):
     Mỗi Fiber node = 1 đơn vị công việc nhỏ nhất
     → Xử lý 1 Fiber = 1 unit of work
     → Xong 1 unit → kiểm tra: còn thời gian? Tiếp tục : Yield!

  ③ CẤU TRÚC DỮ LIỆU (Data Structure):
     Fiber node = JS object chứa thông tin component
     → type, props, state, DOM ref, effect tags...
     → Liên kết thành linked list (không phải tree!)
```

```
STACK vs FIBER — SO SÁNH TRỰC QUAN:
═══════════════════════════════════════════════════════════════

  STACK RECONCILER (React 15):
  ┌────────────────────────────────────────────────────────┐
  │ reconcile(A)                                           │
  │   reconcile(B)                                         │
  │     reconcile(D)                                       │
  │       reconcile(G) ← KHÔNG THỂ DỪNG!                  │
  │     reconcile(E)                                       │
  │   reconcile(C)                                         │
  │     reconcile(F)                                       │
  │ DONE! (mới trả quyền cho browser)                     │
  └────────────────────────────────────────────────────────┘
  → 1 lần chạy dài, block toàn bộ!

  FIBER RECONCILER (React 16+):
  ┌── Frame 1 ──┐ ┌── Frame 2 ──┐ ┌── Frame 3 ──┐
  │ Fiber A      │ │ Fiber D      │ │ Fiber E      │
  │ Fiber B      │ │ Fiber G      │ │ Fiber C      │
  │ (yield!)     │ │ (yield!)     │ │ Fiber F      │
  │ Paint ✅     │ │ Input ✅     │ │ Commit! ✅   │
  └──────────────┘ └──────────────┘ └──────────────┘
  → Chia nhỏ, xen kẽ paint + input! Mượt!
```

```
FIBER GIẢI QUYẾT 4 VẤN ĐỀ:
═══════════════════════════════════════════════════════════════

  ① INTERRUPTIBLE: Có thể dừng render giữa chừng
     → User input được xử lý NGAY, không phải đợi!

  ② PRIORITIZABLE: Phân loại ưu tiên công việc
     → Animation > Data fetch > Off-screen update

  ③ REUSABLE: Tái sử dụng kết quả đã tính toán
     → Không cần tính lại từ đầu khi resume!

  ④ ABORTABLE: Hủy bỏ công việc không cần thiết
     → User navigate đi → abort render cũ!
```

---

## §3. Fiber Node — Cấu trúc dữ liệu

```javascript
// FIBER NODE — Mỗi React element → 1 Fiber:
const fiber = {
  // ═══ IDENTITY ═══
  tag: 0, // FunctionComponent=0, ClassComponent=1, HostComponent=5...
  type: "div", // Element type (string | Function | Class)
  key: "unique-key", // Key cho reconciliation

  // ═══ TREE STRUCTURE (Linked List!) ═══
  child: Fiber | null, // → Con ĐẦU TIÊN
  sibling: Fiber | null, // → Anh em TIẾP THEO
  return: Fiber | null, // → Cha (parent)
  index: 0, // Vị trí trong siblings

  // ═══ STATE & PROPS ═══
  pendingProps: {}, // Props MỚI (chờ xử lý)
  memoizedProps: {}, // Props ĐÃ XỬ LÝ (lần render trước)
  memoizedState: {}, // State ĐÃ XỬ LÝ
  updateQueue: Queue, // Queue các updates (setState calls)

  // ═══ OUTPUT ═══
  stateNode: HTMLElement | ComponentInstance | null,
  // → DOM node thật (nếu host component)
  // → Component instance (nếu class component)
  // → null (nếu function component)

  // ═══ EFFECTS ═══
  flags: 0, // Effect flags (bitfield): Placement, Update, Deletion...
  subtreeFlags: 0, // Effects trong subtree (bubble up!)
  deletions: [], // Children cần xóa

  // ═══ ALTERNATE (Double Buffering) ═══
  alternate: Fiber | null, // → Fiber cũ / Fiber đang build
  // current.alternate = workInProgress
  // workInProgress.alternate = current

  // ═══ SCHEDULING ═══
  lanes: 0, // Priority lanes (bitfield)
  childLanes: 0, // Lanes của children
};
```

```
TẠI SAO LINKED LIST THAY VÌ TREE:
═══════════════════════════════════════════════════════════════

  TREE (đệ quy):
  → Duyệt bằng call stack → KHÔNG THỂ DỪNG!
  → Phải dùng recursion → stack frame bị lock

  LINKED LIST (3 pointers):
  → child: đi xuống con đầu tiên
  → sibling: đi ngang anh em
  → return: đi lên cha

  → Duyệt bằng VÒNG LẶP (while loop)!
  → Có thể DỪNG ở bất kỳ node nào!
  → Lưu "con trỏ" hiện tại → TIẾP TỤC sau!

  VÍ DỤ:
       A
      / \
     B   C
    / \
   D   E

  child/sibling/return:
  A.child = B
  B.sibling = C
  B.child = D
  D.sibling = E
  D.return = B
  E.return = B
  B.return = A
  C.return = A

  Thứ tự duyệt: A → B → D → E → C (DFS qua while loop!)
  Có thể DỪNG ở D! → Xử lý user input → TIẾP TỤC từ D → E → C
```

---

## §4. Fiber Tree — Double Buffering

```
DOUBLE BUFFERING — 2 CÂY FIBER:
═══════════════════════════════════════════════════════════════

  React luôn giữ 2 Fiber tree:

  ┌──────────────────┐         ┌──────────────────┐
  │   CURRENT TREE   │←─alt─→ │ WORK-IN-PROGRESS │
  │ (đang hiển thị)  │         │  TREE (đang build)│
  └──────────────────┘         └──────────────────┘

  ① Render phase: Build WIP tree từ current + new props/state
     → Mỗi current Fiber có .alternate → WIP Fiber tương ứng
     → REUSE Fiber nodes khi có thể (không tạo mới!)

  ② Commit phase: WIP tree → trở thành current tree
     → Swap pointer: fiberRoot.current = wipTree
     → Current cũ → trở thành WIP cho lần sau!

  KỸ THUẬT NÀY GỌI LÀ "DOUBLE BUFFERING":
  → Giống game rendering: 2 frame buffers, swap khi ready
  → User KHÔNG BAO GIỜ thấy tree đang xây dựng dở!
  → DOM cập nhật ATOMIC — tất cả hoặc không gì cả!
```

```javascript
// DOUBLE BUFFERING — Cách hoạt động:

// Lần render 1:
// current:  A → B → C
// WIP:      A' → B' → C'  (building...)
// → A.alternate = A', A'.alternate = A

// Commit: fiberRoot.current = WIP tree
// current:  A' → B' → C'  (hiển thị!)
// old:      A → B → C     (sẽ thành WIP lần sau)

// Lần render 2:
// current:  A' → B' → C'
// WIP:      A'' → B'' → C''  (building, reuse A → A'')
// → A' object được reuse thành A''!
// → Giảm GC pressure (không tạo object mới!)

// createWorkInProgress (simplified):
function createWorkInProgress(current, pendingProps) {
  let workInProgress = current.alternate;

  if (workInProgress === null) {
    // Lần đầu: tạo mới
    workInProgress = createFiber(current.tag, pendingProps, current.key);
    workInProgress.stateNode = current.stateNode;
    workInProgress.alternate = current;
    current.alternate = workInProgress;
  } else {
    // Lần sau: REUSE! Chỉ update props
    workInProgress.pendingProps = pendingProps;
    workInProgress.flags = 0; // Reset effects
    workInProgress.subtreeFlags = 0;
    workInProgress.deletions = null;
  }

  // Copy từ current:
  workInProgress.child = current.child;
  workInProgress.memoizedProps = current.memoizedProps;
  workInProgress.memoizedState = current.memoizedState;
  workInProgress.updateQueue = current.updateQueue;
  workInProgress.lanes = current.lanes;
  workInProgress.childLanes = current.childLanes;

  return workInProgress;
}
```

---

## §5. Work Loop — Interruptible Rendering

```javascript
// WORK LOOP — Vòng lặp xử lý Fiber (simplified React source):

// ═══ SYNCHRONOUS (không thể dừng — urgent updates) ═══
function workLoopSync() {
  while (workInProgress !== null) {
    performUnitOfWork(workInProgress);
    // KHÔNG kiểm tra thời gian! Chạy hết!
  }
}

// ═══ CONCURRENT (có thể dừng — non-urgent updates) ═══
function workLoopConcurrent() {
  while (workInProgress !== null && !shouldYield()) {
    performUnitOfWork(workInProgress);
    //                    ↑
    //    Scheduler kiểm tra: còn thời gian không?
    //    true → DỪNG! Trả quyền cho browser!
  }
}

// shouldYield():
// → Kiểm tra elapsed time từ khi bắt đầu time slice
// → Mỗi time slice ≈ 5ms (React Scheduler)
// → Hết 5ms → yield → browser paint/input → tiếp tục
```

```
PERFORM UNIT OF WORK — XỬ LÝ 1 FIBER:
═══════════════════════════════════════════════════════════════

  function performUnitOfWork(unitOfWork) {
      // ① BEGIN WORK: Xử lý fiber (diff, reconcile)
      const next = beginWork(unitOfWork);

      // ② Nếu có child → đi xuống:
      if (next !== null) {
          workInProgress = next;       // → child
          return;
      }

      // ③ Không có child → COMPLETE + tìm sibling:
      completeUnitOfWork(unitOfWork);
  }

  function completeUnitOfWork(unitOfWork) {
      let completedWork = unitOfWork;
      while (completedWork !== null) {

          // ① COMPLETE WORK: Tạo DOM, collect effects
          completeWork(completedWork);

          // ② Có sibling? → đi ngang:
          if (completedWork.sibling !== null) {
              workInProgress = completedWork.sibling;
              return; // → beginWork trên sibling
          }

          // ③ Không sibling? → đi lên parent:
          completedWork = completedWork.return;
          workInProgress = completedWork;
      }
  }

  TRAVERSAL: beginWork đi XUỐNG (DFS)
             completeWork đi LÊN (bubble up effects)

       A ─── beginWork(A) → child B
      / \
     B   C ─ beginWork(B) → child D
    / \
   D   E ── beginWork(D) → no child → completeWork(D)
             → sibling E → beginWork(E) → completeWork(E)
             → no sibling → completeWork(B)
             → sibling C → beginWork(C) → completeWork(C)
             → no sibling → completeWork(A)
             → DONE!
```

---

## §6. Scheduler — Hệ thống ưu tiên

```
REACT SCHEDULER — QUẢN LÝ ƯU TIÊN:
═══════════════════════════════════════════════════════════════

  React KHÔNG dùng requestIdleCallback (không ổn định!)
  → Tự xây dựng Scheduler riêng!

  5 MỨC ĐỘ ƯU TIÊN (React 16-17):
  ┌────┬──────────────────────┬──────────┬────────────────────┐
  │ #  │ Priority             │ Timeout  │ Ví dụ              │
  ├────┼──────────────────────┼──────────┼────────────────────┤
  │ 1  │ Immediate            │ -1ms     │ Đồng bộ! (sync)    │
  │ 2  │ UserBlocking         │ 250ms    │ Click, input, hover │
  │ 3  │ Normal               │ 5000ms   │ Network response    │
  │ 4  │ Low                  │ 10000ms  │ Analytics           │
  │ 5  │ Idle                 │ maxInt   │ Off-screen, prefetch│
  └────┴──────────────────────┴──────────┴────────────────────┘

  Timeout = Thời gian tối đa chờ trước khi PHẢI thực thi (starvation prevention)
```

```javascript
// SCHEDULER — Cách hoạt động (simplified):

// ① Task Queue — Min-Heap theo expirationTime:
const taskQueue = new MinHeap(); // Sorted by expirationTime!

function scheduleCallback(priorityLevel, callback) {
  const currentTime = getCurrentTime();
  const startTime = currentTime;

  // Tính timeout từ priority:
  let timeout;
  switch (priorityLevel) {
    case ImmediatePriority:
      timeout = -1;
      break;
    case UserBlockingPriority:
      timeout = 250;
      break;
    case NormalPriority:
      timeout = 5000;
      break;
    case LowPriority:
      timeout = 10000;
      break;
    case IdlePriority:
      timeout = 1073741823;
      break; // maxInt
  }

  const expirationTime = startTime + timeout;
  const newTask = {
    callback,
    priorityLevel,
    expirationTime,
    startTime,
  };

  taskQueue.push(newTask); // Push vào min-heap!
  requestHostCallback(flushWork); // Lên lịch chạy!
}

// ② Flush Work — Chạy tasks theo priority:
function flushWork(initialTime) {
  let currentTime = initialTime;

  // Lấy task ưu tiên cao nhất:
  let currentTask = taskQueue.peek();

  while (currentTask !== null) {
    // Task chưa hết hạn + hết time slice → yield!
    if (currentTask.expirationTime > currentTime && shouldYield()) {
      break; // ← DỪNG! Trả quyền cho browser!
    }

    // Thực thi task:
    const callback = currentTask.callback;
    const continuationCallback = callback();

    if (typeof continuationCallback === "function") {
      // Task chưa xong → giữ trong queue (tiếp tục sau):
      currentTask.callback = continuationCallback;
    } else {
      // Task xong → xóa khỏi queue:
      taskQueue.pop();
    }

    currentTask = taskQueue.peek();
  }

  // Còn tasks? → lên lịch tiếp!
  return taskQueue.length > 0;
}

// ③ Time Slicing — 5ms per slice:
function shouldYield() {
  const elapsed = getCurrentTime() - startTime;
  return elapsed >= 5; // 5ms! Yield lại cho browser!
}

// ④ requestHostCallback — Dùng MessageChannel (không phải rIC!):
const channel = new MessageChannel();
const port = channel.port2;
channel.port1.onmessage = () => {
  // Macro task → chạy sau browser paint/input!
  performWorkUntilDeadline();
};
function requestHostCallback(callback) {
  scheduledHostCallback = callback;
  port.postMessage(null); // Trigger macro task!
}
```

```
TẠI SAO MessageChannel THAY VÌ requestIdleCallback / setTimeout:
═══════════════════════════════════════════════════════════════

  requestIdleCallback:
  → Browser support kém (Safari KHÔNG hỗ trợ!)
  → Không đảm bảo gọi mỗi frame
  → Hành vi khác nhau giữa browsers

  setTimeout(fn, 0):
  → Minimum delay 4ms (browser clamp!)
  → Quá chậm cho 5ms time slices
  → Nested setTimeout delay tích lũy!

  MessageChannel:
  → Macro task → chạy SAU micro tasks, TRƯỚC setTimeout
  → KHÔNG bị 4ms clamp!
  → Consistent across browsers! ✅
  → React Scheduler dùng MessageChannel.port.postMessage()
```

---

## §7. Lanes — Mô hình ưu tiên thế hệ mới

```
LANES (React 18) — THAY THẾ ExpirationTime:
═══════════════════════════════════════════════════════════════

  TẠI SAO THAY ĐỔI:
  ExpirationTime = 1 NUMBER → chỉ sắp xếp LINEAR
  → Không biểu diễn được: "task A và B CÙNG priority"
  → Không GROUP được 1 batch updates!

  LANES = BITMASK → biểu diễn SET of priorities!
  → Mỗi bit = 1 lane (làn đường)
  → Bitwise OR: gộp lanes | GroupA = Lane1 | Lane2
  → Bitwise AND: kiểm tra lanes & HighPriority
  → SIÊU NHANH (bitwise operations!)

  31 LANES (31-bit integer):
  ┌─────────────────────────────────────────────────────────┐
  │ Bit 0:   SyncLane           │ Urgent! (click, input)   │
  │ Bit 1-2: InputContinuous    │ Drag, scroll             │
  │ Bit 3-4: DefaultLanes       │ setState, fetch          │
  │ Bit 5-16: TransitionLanes   │ useTransition, startTrans│
  │ Bit 17-26: RetryLanes       │ Suspense retry           │
  │ Bit 27-30: IdleLanes        │ Off-screen, prefetch     │
  │ Bit 31: OffscreenLane       │ Hidden content           │
  └─────────────────────────────────────────────────────────┘
```

```javascript
// LANES — Bitwise operations:

const NoLanes = 0b0000000000000000000000000000000;
const SyncLane = 0b0000000000000000000000000000001; // Bit 0
const InputLane = 0b0000000000000000000000000000100; // Bit 2
const DefaultLane = 0b0000000000000000000000000010000; // Bit 4
const TransLane1 = 0b0000000000000000000000001000000; // Bit 6

// Gộp lanes:
const pendingLanes = SyncLane | DefaultLane;
// = 0b0000000000000000000000000010001

// Kiểm tra lane:
const hasSyncWork = (pendingLanes & SyncLane) !== NoLanes;
// true! → Có sync work cần xử lý!

// Lấy lane ưu tiên cao nhất:
function getHighestPriorityLane(lanes) {
  return lanes & -lanes; // Lấy bit thấp nhất (rightmost)!
  // pendingLanes & -pendingLanes = SyncLane ✅
}

// React quyết định render lane nào:
function getNextLanes(root) {
  const pendingLanes = root.pendingLanes;
  if (pendingLanes === NoLanes) return NoLanes;

  // Ưu tiên: Sync > Input > Default > Transition > Idle
  if (pendingLanes & SyncLane) return SyncLane;
  if (pendingLanes & InputContinuousLanes) return InputContinuousLanes;
  if (pendingLanes & DefaultLanes) return DefaultLanes;
  // ... tiếp tục theo thứ tự ưu tiên

  return pendingLanes; // Fallback: tất cả
}
```

```
LANES vs EXPIRATION TIME:
═══════════════════════════════════════════════════════════════

  ┌──────────────────┬──────────────────┬─────────────────┐
  │ Feature          │ ExpirationTime   │ Lanes ⭐         │
  ├──────────────────┼──────────────────┼─────────────────┤
  │ Kiểu dữ liệu    │ Number (1 value) │ Bitmask (31 bit)│
  │ Batch updates    │ ❌ Khó          │ ✅ OR bitwise   │
  │ Priority groups  │ ❌ Linear only  │ ✅ Arbitrary    │
  │ Check priority   │ O(n) compare    │ O(1) bitwise &  │
  │ Multiple tasks   │ ❌ 1 at a time  │ ✅ Concurrent!  │
  │ Entangle         │ ❌ Không        │ ✅ Bind lanes   │
  └──────────────────┴──────────────────┴─────────────────┘
```

---

## §8. Render Phase vs Commit Phase

```
2 PHASES CỦA FIBER RECONCILER:
═══════════════════════════════════════════════════════════════

  ┌─── RENDER PHASE ────────────────────────────────────────┐
  │ CÓ THỂ DỪNG / HỦY / RESTART!                          │
  │                                                          │
  │ ① beginWork (top-down):                                  │
  │    → Duyệt từ root xuống leaves                          │
  │    → Diff: so sánh current vs new element                │
  │    → Tạo/update child Fibers                             │
  │    → Gán flags: Placement | Update | Deletion            │
  │    → KHÔNG CHẠM DOM!                                     │
  │                                                          │
  │ ② completeWork (bottom-up):                              │
  │    → Tạo DOM nodes (chưa gắn vào document!)              │
  │    → Collect effects: bubble subtreeFlags lên cha         │
  │    → Build effect list                                    │
  │                                                          │
  │ LIFECYCLE chạy trong render phase:                       │
  │ → constructor, getDerivedStateFromProps, shouldComponentUpdate│
  │ → render                                                  │
  │ ⚠️ CÓ THỂ GỌI NHIỀU LẦN! (do interruptible!)          │
  │ → KHÔNG side effects ở đây!                              │
  └──────────────────────────────────────────────────────────┘

  ┌─── COMMIT PHASE ────────────────────────────────────────┐
  │ KHÔNG THỂ DỪNG! (synchronous, atomic!)                  │
  │                                                          │
  │ 3 SUB-PHASES:                                            │
  │                                                          │
  │ ① Before Mutation (đọc DOM!):                            │
  │    → getSnapshotBeforeUpdate                              │
  │    → Đọc layout info TRƯỚC khi DOM thay đổi              │
  │                                                          │
  │ ② Mutation (thay đổi DOM!):                              │
  │    → Placement → DOM.appendChild / insertBefore           │
  │    → Update → updateProperties (className, style...)      │
  │    → Deletion → removeChild + cleanup refs                │
  │    → Text update → textContent = newText                  │
  │                                                          │
  │ ③ Layout (đọc DOM mới!):                                 │
  │    → fiberRoot.current = finishedWork (SWAP!)             │
  │    → componentDidMount / componentDidUpdate               │
  │    → useLayoutEffect callbacks                            │
  │    → Refs update                                          │
  │                                                          │
  │ ④ Passive Effects (async — SAU paint!):                  │
  │    → useEffect cleanup (previous)                         │
  │    → useEffect callbacks (current)                        │
  │    → Chạy trong MACRO TASK tiếp theo!                     │
  └──────────────────────────────────────────────────────────┘
```

```javascript
// BEGIN WORK — Xử lý Fiber theo type (simplified):
function beginWork(current, workInProgress, renderLanes) {
  // Optimization: nếu props KHÔNG đổi → bỏ qua!
  if (current !== null) {
    const oldProps = current.memoizedProps;
    const newProps = workInProgress.pendingProps;
    if (oldProps === newProps && !hasContextChanged()) {
      return bailoutOnAlreadyFinishedWork(workInProgress);
      // ← SKIP toàn bộ subtree! ⚡
    }
  }

  // Xử lý theo component type:
  switch (workInProgress.tag) {
    case FunctionComponent:
      return updateFunctionComponent(current, workInProgress, renderLanes);
    // → Gọi function(props) → reconcile children

    case ClassComponent:
      return updateClassComponent(current, workInProgress, renderLanes);
    // → Gọi instance.render() → reconcile children

    case HostComponent: // div, span, p...
      return updateHostComponent(current, workInProgress);
    // → Reconcile children trực tiếp

    case HostText: // Text node
      return null; // Leaf node — no children

    case SuspenseComponent:
      return updateSuspenseComponent(current, workInProgress, renderLanes);
  }
}

// COMPLETE WORK — Tạo DOM + collect effects (simplified):
function completeWork(current, workInProgress) {
  switch (workInProgress.tag) {
    case HostComponent: {
      const type = workInProgress.type; // 'div'

      if (current !== null && workInProgress.stateNode != null) {
        // UPDATE: diff props → prepare update payload
        const updatePayload = diffProperties(
          current.memoizedProps,
          workInProgress.pendingProps,
        );
        workInProgress.updateQueue = updatePayload;
        if (updatePayload) {
          workInProgress.flags |= Update;
        }
      } else {
        // MOUNT: tạo DOM node (chưa gắn vào document!)
        const instance = document.createElement(type);
        appendAllChildren(instance, workInProgress);
        workInProgress.stateNode = instance;
      }

      // Bubble effects lên parent:
      bubbleProperties(workInProgress);
      return null;
    }
  }
}
```

---

## §9. Concurrent Features (React 18)

```
CONCURRENT MODE — React 18 FEATURES:
═══════════════════════════════════════════════════════════════

  React 18 = Concurrent React! Tất cả features dựa trên Fiber!

  ① Automatic Batching — Gộp updates TỰ ĐỘNG
  ② useTransition — Đánh dấu update KHÔNG urgent
  ③ useDeferredValue — Deferring giá trị
  ④ Suspense — Chờ async data
  ⑤ Streaming SSR — Server-side rendering từng phần
```

```javascript
// ① AUTOMATIC BATCHING (React 18):
// React 17: chỉ batch trong event handlers
// React 18: batch EVERYWHERE! (setTimeout, Promises, native events!)

function handleClick() {
  setCount((c) => c + 1); // React 17: 1 re-render
  setFlag((f) => !f); // React 17: 1 re-render → TOTAL: 2! 💀
} // React 18: 1 re-render → TOTAL: 1! ✅

setTimeout(() => {
  setCount((c) => c + 1);
  setFlag((f) => !f);
  // React 17: 2 re-renders (không batch trong setTimeout!) 💀
  // React 18: 1 re-render (automatic batching!) ✅
}, 1000);

// Opt-out: flushSync (buộc đồng bộ):
import { flushSync } from "react-dom";
flushSync(() => {
  setCount((c) => c + 1);
}); // Re-render NGAY!
flushSync(() => {
  setFlag((f) => !f);
}); // Re-render NGAY!

// ② useTransition — "Đây là update KHÔNG URGENT":
function SearchResults() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [isPending, startTransition] = useTransition();

  function handleChange(e) {
    // ① Urgent: update input NGAY (user thấy ký tự đã gõ):
    setQuery(e.target.value);

    // ② Non-urgent: update results CÓ THỂ CHỜ:
    startTransition(() => {
      setResults(filterData(e.target.value)); // ← Interruptible!
    });
  }

  return (
    <div>
      <input value={query} onChange={handleChange} />
      {isPending ? <Spinner /> : <ResultList results={results} />}
    </div>
  );
}
// → User gõ → input phản hồi NGAY → results update SAU!
// → Gõ tiếp → ABORT results cũ → tính results MỚI!
// → KHÔNG BAO GIỜ block input! ✅

// ③ useDeferredValue — Defer giá trị:
function SearchResults({ query }) {
  const deferredQuery = useDeferredValue(query);
  // deferredQuery = query cũ (trong lúc chờ)
  // → Khi browser rảnh → deferredQuery = query mới

  const results = useMemo(() => filterData(deferredQuery), [deferredQuery]);

  return (
    <div style={{ opacity: query !== deferredQuery ? 0.5 : 1 }}>
      <ResultList results={results} />
    </div>
  );
}
```

```
useTransition vs useDeferredValue:
═══════════════════════════════════════════════════════════════

  useTransition:
  → BỌC setState call → "update này không urgent"
  → Có isPending flag → hiện loading UI
  → Kiểm soát tại NƠI GỌI setState

  useDeferredValue:
  → BỌC value → "value này có thể dùng bản cũ trong lúc chờ"
  → Không kiểm soát setState
  → Kiểm soát tại NƠI DÙNG value
  → Hữu ích khi không kiểm soát setState (props từ parent!)
```

---

## §10. Time Slicing — Chia nhỏ công việc

```
TIME SLICING — Render theo lát cắt thời gian:
═══════════════════════════════════════════════════════════════

  KHÔNG Time Slicing (Sync):
  ┌────────────────────────────────────────────┐
  │ Render (50ms) ██████████████████████████████│ Block!
  │                               Input ↑ Ignored!
  └────────────────────────────────────────────┘

  CÓ Time Slicing (Concurrent):
  ┌─── 5ms ──┐ ┌─── 5ms ──┐ ┌─── 5ms ──┐ ┌─── 5ms ──┐
  │ Render █  │ │ Render █  │ │ Input! ✅ │ │ Render █  │
  │ yield! → │→│ yield! → │→│ Handle  → │→│ yield! → │...
  └──────────┘ └──────────┘ └──────────┘ └──────────┘
  → 5ms slices + yielding = 60fps maintained! ✅
```

```javascript
// TIME SLICING THỰC TẾ — Demo:
// Render 10,000 items — KHÔNG block UI:

function HeavyList() {
  const [items] = useState(() =>
    Array.from({ length: 10000 }, (_, i) => ({ id: i, name: `Item ${i}` })),
  );

  // ❌ KHÔNG time slicing: block toàn bộ!
  // return items.map(item => <ExpensiveItem key={item.id} {...item} />);

  // ✅ VỚI useTransition: React tự time-slice!
  const [isPending, startTransition] = useTransition();
  const [visibleItems, setVisibleItems] = useState([]);

  useEffect(() => {
    startTransition(() => {
      setVisibleItems(items); // ← Interruptible render!
    });
  }, [items]);

  return (
    <div>
      {isPending && <div>Loading...</div>}
      {visibleItems.map((item) => (
        <ExpensiveItem key={item.id} {...item} />
      ))}
    </div>
  );
}
```

---

## §11. Suspense — Chờ async data

```javascript
// SUSPENSE — Khai báo "loading state" declaratively:

// ① Lazy loading components:
const HeavyChart = React.lazy(() => import("./HeavyChart"));

function Dashboard() {
  return (
    <Suspense fallback={<Spinner />}>
      <HeavyChart /> {/* Chưa load → Spinner → Load xong → Chart */}
    </Suspense>
  );
}

// ② Data fetching (React 18+ with Suspense-compatible library):
// Libraries: Relay, SWR (experimental), React Query (experimental)

function UserProfile({ id }) {
  // Giả sử useSuspenseQuery throw Promise khi loading:
  const user = useSuspenseQuery(`/api/users/${id}`);
  // → Loading? → throw Promise → Suspense bắt → fallback!
  // → Done? → render bình thường!
  return <h1>{user.name}</h1>;
}

function App() {
  return (
    <Suspense fallback={<Skeleton />}>
      <UserProfile id={1} />
    </Suspense>
  );
}
```

```
SUSPENSE — NGUYÊN LÝ BÊN DƯỚI:
═══════════════════════════════════════════════════════════════

  ① Component throw PROMISE khi data chưa sẵn sàng
  ② React BẮT Promise trong render phase
  ③ Suspense boundary hiển thị FALLBACK
  ④ Promise resolve → React RE-RENDER component
  ⑤ Lần này data sẵn sàng → render bình thường!

  FIBER HANDLING:
  → Khi catch Promise → đánh dấu Fiber = SuspenseComponent
  → Set flags = DidCapture
  → Render fallback subtree thay vì primary subtree
  → Khi Promise resolve → schedule re-render trên Retry Lane
  → Re-render: primary subtree render thành công!

  ┌─────────────────────────────────────┐
  │ <Suspense fallback={<Loading/>}>    │
  │   ┌─────────────────┐              │
  │   │ PRIMARY:        │ ← throw Promise!
  │   │ <UserProfile/>  │              │
  │   └────────┬────────┘              │
  │            │ switch!               │
  │   ┌────────▼────────┐              │
  │   │ FALLBACK:       │ ← hiển thị! │
  │   │ <Loading/>      │              │
  │   └────────┬────────┘              │
  │            │ Promise resolve!      │
  │   ┌────────▼────────┐              │
  │   │ PRIMARY:        │ ← hiển thị! │
  │   │ <UserProfile/>  │              │
  │   └─────────────────┘              │
  └─────────────────────────────────────┘
```

---

## §12. Tổng kết & Checklist phỏng vấn

```
MIND MAP — REACT FIBER:
═══════════════════════════════════════════════════════════════

  React Fiber
  ├── Problem: Stack Reconciler blocking (đệ quy, không dừng được)
  ├── Solution: Linked list + while loop → interruptible!
  ├── Fiber Node: type, child/sibling/return, alternate, flags, lanes
  ├── Double Buffering: current ↔ WIP, swap on commit, reuse nodes
  ├── Work Loop: performUnitOfWork → beginWork (down) + completeWork (up)
  │   ├── Sync: workLoopSync (no yield)
  │   └── Concurrent: workLoopConcurrent (shouldYield @ 5ms)
  ├── Scheduler: 5 priorities, min-heap, MessageChannel, 5ms slices
  ├── Lanes: 31-bit bitmask, bitwise ops O(1), replace expirationTime
  ├── 2 Phases: Render (interruptible) → Commit (3 sub-phases, atomic)
  ├── Concurrent Features: auto batching, useTransition, useDeferredValue
  ├── Time Slicing: 5ms chunks, yield to browser, 60fps maintained
  └── Suspense: throw Promise → fallback → resolve → render primary
```

### Checklist

- [ ] **Stack Reconciler vấn đề**: đệ quy (call stack) → không thể dừng → block main thread → UI giật khi tree lớn
- [ ] **Fiber 3 nghĩa**: architecture (reconciler mới), unit of work (1 Fiber = 1 task), data structure (JS object)
- [ ] **Fiber giải quyết 4 vấn đề**: interruptible, prioritizable, reusable, abortable
- [ ] **Fiber linked list**: child / sibling / return (3 pointers), duyệt bằng while loop thay vì recursion
- [ ] **Double buffering**: current tree ↔ WIP tree, swap khi commit, reuse Fiber nodes (giảm GC)
- [ ] **Work loop sync vs concurrent**: sync = while(wip), concurrent = while(wip && !shouldYield())
- [ ] **performUnitOfWork**: beginWork (đi xuống, diff) → completeWork (đi lên, tạo DOM, collect effects)
- [ ] **Scheduler**: 5 mức ưu tiên (Immediate → Idle), min-heap theo expirationTime, 5ms time slices
- [ ] **MessageChannel**: thay requestIdleCallback (Safari!) và setTimeout (4ms clamp!), macro task reliable
- [ ] **Lanes (React 18)**: 31-bit bitmask, bitwise OR gộp, AND kiểm tra, getHighestPriorityLane = lanes & -lanes
- [ ] **Lanes vs ExpirationTime**: lanes hỗ trợ batch (OR), grouping, concurrent rendering, O(1) check
- [ ] **Render phase**: beginWork + completeWork, interruptible, KHÔNG CHẠM DOM, có thể gọi nhiều lần!
- [ ] **Commit phase**: 3 sub-phases (before mutation → mutation → layout), synchronous, atomic, KHÔNG interruptible
- [ ] **Passive effects**: useEffect chạy sau paint (macro task), useLayoutEffect chạy trước paint (trong layout sub-phase)
- [ ] **Automatic batching (18)**: batch EVERYWHERE (setTimeout, Promise, native events), opt-out = flushSync
- [ ] **useTransition**: đánh dấu setState không urgent, isPending flag, interruptible render, abort khi gõ tiếp
- [ ] **useDeferredValue**: defer VALUE (dùng bản cũ trong lúc chờ), hữu ích khi không control setState (props)
- [ ] **Time slicing**: 5ms chunks → yield → browser paint/input → resume, duy trì 60fps
- [ ] **Suspense**: throw Promise → Suspense catch → fallback → resolve → re-render primary

---

_Nguồn: React Fiber Architecture Deep Dive_
_Tham khảo: React Source (github.com/facebook/react), Andrew Clark "React Fiber Architecture"_
_Cập nhật lần cuối: Tháng 2, 2026_
