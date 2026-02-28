# Process, Thread, Coroutine & JS Async — Deep Dive!

> **Hiểu sâu Process, Thread, Coroutine và sự phát triển Coroutine trong JavaScript!**
> Concurrent vs Parallel, Event Loop, Generator, async/await!

---

## §1. Process — Tiến Trình!

```
  PROCESS (TIẾN TRÌNH):
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  ĐỊNH NGHĨA:                                                    │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ → Đơn vị QUẢN LÝ TÀI NGUYÊN nhỏ nhất (OS!) ★     │    │
  │  │ → Một instance của chương trình đang chạy!          │    │
  │  │ → Sở hữu: code, file, data, MEMORY RIÊNG! ★        │    │
  │  │ → Mỗi process có ADDRESS SPACE riêng biệt!          │    │
  │  │ → Process là CONTAINER chứa threads!                  │    │
  │  │                                                      │    │
  │  │ VÍ DỤ: Mở Chrome = 1 process!                         │    │
  │  │         Mở VS Code = 1 process!                        │    │
  │  │         Mỗi tab Chrome = 1 process riêng! ★           │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  CẤU TRÚC MEMORY CỦA PROCESS:                                  │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │  ┌──────────────────┐                                  │    │
  │  │  │ STACK            │ ← Biến local, call stack!       │    │
  │  │  │ (grows down ↓)   │                                  │    │
  │  │  ├──────────────────┤                                  │    │
  │  │  │      ↕ Free      │                                  │    │
  │  │  ├──────────────────┤                                  │    │
  │  │  │ HEAP             │ ← Dynamic allocation!            │    │
  │  │  │ (grows up ↑)     │                                  │    │
  │  │  ├──────────────────┤                                  │    │
  │  │  │ DATA (BSS)       │ ← Biến global, static!          │    │
  │  │  ├──────────────────┤                                  │    │
  │  │  │ TEXT (CODE)      │ ← Machine code!                  │    │
  │  │  └──────────────────┘                                  │    │
  │  │  ★ Mỗi process được OS cấp RIÊNG 1 bộ nhớ!        │    │
  │  │  ★ Process A KHÔNG THỂ truy cập memory Process B!   │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  5 TRẠNG THÁI:                                                  │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │                                                      │    │
  │  │  Created → Ready → Running → Blocked → Terminated    │    │
  │  │             ↑        │         │                       │    │
  │  │             └────────┘         │                       │    │
  │  │             ↑                  │                       │    │
  │  │             └──────────────────┘                       │    │
  │  │                                                      │    │
  │  │  Created:    Đang tạo, cấp phát PCB + tài nguyên!   │    │
  │  │  Ready:      Có mọi thứ TRỪ CPU! Chờ CPU! ★         │    │
  │  │  Running:    CPU đang thực thi! ★                     │    │
  │  │  Blocked:    Chờ I/O, event! (đọc file, network!)   │    │
  │  │  Terminated: Kết thúc hoặc bị kill!                   │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  ★ CHUYỂN ĐỔI PROCESS RẤT TỐN KÉM!                         │
  │  → Switch memory address space!                               │
  │  → Switch kernel stack!                                       │
  │  → Switch CPU registers (hardware context!)                   │
  │  → Có thể swap memory ra disk! ★                             │
  │  → Càng nhiều process → máy càng CHẬM! ❌                   │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```

---

## §2. Thread — Luồng!

```
  THREAD (LUỒNG):
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  ĐỊNH NGHĨA:                                                    │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ → Đơn vị THỰC THI nhỏ nhất (OS!) ★                  │    │
  │  │ → Nằm TRONG process! (process chứa threads!)        │    │
  │  │ → Có STACK riêng, nhưng CHIA SẺ memory với process! │    │
  │  │ → 1 process ≥ 1 thread (1 main + nhiều worker!)     │    │
  │  │                                                      │    │
  │  │ VÍ DỤ: Chrome tab = 1 process!                        │    │
  │  │         Render = 1 thread!                              │    │
  │  │         JS Engine = 1 thread!                           │    │
  │  │         Network = 1 thread!                              │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  PROCESS vs THREAD:                                              │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │  Process (Tiến trình):                                 │    │
  │  │  ┌────────────────────────────────────────────┐        │    │
  │  │  │ Memory Space (RIÊNG!)                      │        │    │
  │  │  │ ┌──────────┐ ┌──────────┐ ┌──────────┐    │        │    │
  │  │  │ │ Thread 1 │ │ Thread 2 │ │ Thread 3 │    │        │    │
  │  │  │ │ (main)   │ │ (worker) │ │ (worker) │    │        │    │
  │  │  │ │ Stack ↕  │ │ Stack ↕  │ │ Stack ↕  │    │        │    │
  │  │  │ └──────────┘ └──────────┘ └──────────┘    │        │    │
  │  │  │           ↕ SHARED MEMORY ↕                │        │    │
  │  │  │ ┌──────────────────────────────────────┐   │        │    │
  │  │  │ │ Heap, Code, Data (CHIA SẺ!) ★       │   │        │    │
  │  │  │ └──────────────────────────────────────┘   │        │    │
  │  │  └────────────────────────────────────────────┘        │    │
  │  │                                                      │    │
  │  │  ★ Threads CHIA SẺ memory → truy cập nhanh! ✅      │    │
  │  │  ★ Nhưng cần LOCK khi write! (race condition!) ❌   │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  SO SÁNH CHI TIẾT:                                               │
  │  ┌──────────────────┬──────────────┬──────────────────┐      │
  │  │ TIÊU CHÍ          │ Process      │ Thread           │      │
  │  ├──────────────────┼──────────────┼──────────────────┤      │
  │  │ Đơn vị          │ Quản lý TN ★│ Thực thi ★       │      │
  │  │ Memory           │ RIÊNG! ★     │ CHIA SẺ! ★       │      │
  │  │ Overhead switch   │ CAO! ❌      │ Thấp hơn ✅     │      │
  │  │ Giao tiếp        │ IPC (phức tạp)│ Shared memory   │      │
  │  │ Crash ảnh hưởng│ Chỉ process đó│ Cả process! ❌ │      │
  │  │ Tạo mới        │ Chậm         │ Nhanh hơn       │      │
  │  └──────────────────┴──────────────┴──────────────────┘      │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```

---

## §3. Coroutine — Coroutine!

```
  COROUTINE (COROUTINE):
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  ĐỊNH NGHĨA:                                                    │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ → Lightweight USER-LEVEL thread! ★                    │    │
  │  │ → Scheduling do USER kiểm soát (không phải OS!) ★   │    │
  │  │ → 1 thread có thể chứa NHIỀU coroutines!             │    │
  │  │ → Có thể PAUSE (yield) và RESUME! ★                  │    │
  │  │ → Giữ nguyên registers + stack khi pause!             │    │
  │  │ → KHÔNG cần lock! (cùng thread, không race!) ★       │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  SO SÁNH 3 CẤP ĐỘ:                                             │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │                                                      │    │
  │  │  Process (OS quản lý!)                                 │    │
  │  │  ┌───────────────────────────────────────────┐        │    │
  │  │  │ Thread 1 (OS quản lý!)                    │        │    │
  │  │  │ ┌─────────────────────────────────────┐    │        │    │
  │  │  │ │ Coroutine A  (USER quản lý!) ★      │    │        │    │
  │  │  │ │ Coroutine B  (USER quản lý!)        │    │        │    │
  │  │  │ │ Coroutine C  (USER quản lý!)        │    │        │    │
  │  │  │ └─────────────────────────────────────┘    │        │    │
  │  │  │ Thread 2                                   │        │    │
  │  │  │ ┌─────────────────────────────────────┐    │        │    │
  │  │  │ │ Coroutine D                         │    │        │    │
  │  │  │ │ Coroutine E                         │    │        │    │
  │  │  │ └─────────────────────────────────────┘    │        │    │
  │  │  └───────────────────────────────────────────┘        │    │
  │  │                                                      │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  ƯU ĐIỂM:                                                       │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ ✅ Overhead cực thấp! (không kernel switch!)          │    │
  │  │ ✅ Không cần lock! (cooperative, không preemptive!)  │    │
  │  │ ✅ Memory ít! (Goroutine: 2KB vs Thread: 8MB!)       │    │
  │  │ ✅ 1 CPU chạy hàng chục ngàn coroutines!            │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  NHƯỢC ĐIỂM:                                                    │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ ❌ Không tận dụng multi-core! (single-thread!)       │    │
  │  │ ❌ Blocking I/O → block TOÀN BỘ thread! ★            │    │
  │  │ ❌ Cooperative → phải tự yield! (không preemptive!) │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  ┌──────────────────┬──────────┬──────────┬──────────┐      │
  │  │ TIÊU CHÍ          │ Process  │ Thread  │ Coroutine│      │
  │  ├──────────────────┼──────────┼──────────┼──────────┤      │
  │  │ Ai quản lý      │ OS ★     │ OS ★    │ USER ★   │      │
  │  │ Scheduling       │Preemptive│Preemptive│Cooperat. │      │
  │  │ Memory           │ Riêng    │ Chia sẻ │ Chia sẻ │      │
  │  │ Overhead          │ Rất cao │ Cao      │ Cực thấp│      │
  │  │ Cần lock         │ Có       │ Có ★    │ Không ★ │      │
  │  │ Multi-core        │ Có ★    │ Có      │ Không   │      │
  │  │ Phù hợp         │CPU-intens│ I/O     │ I/O ★    │      │
  │  └──────────────────┴──────────┴──────────┴──────────┘      │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```

---

## §4. Concurrent vs Parallel!

```
  CONCURRENT vs PARALLEL:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  CONCURRENT (Đồng thời!):                                     │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ 1 CPU! Nhiều task LUÂN PHIÊN! ★                       │    │
  │  │                                                      │    │
  │  │ CPU: ┌─A─┬─B─┬─A─┬─C─┬─B─┬─A─┬─C─┐                │    │
  │  │      └───┴───┴───┴───┴───┴───┴───┘                │    │
  │  │       Time slices! (time-sharing!)                     │    │
  │  │                                                      │    │
  │  │ → TRÔNG NHƯ chạy cùng lúc!                          │    │
  │  │ → Nhưng THỰC TẾ chỉ 1 task tại 1 thời điểm!       │    │
  │  │                                                      │    │
  │  │ VD: Đang ĂN, điện thoại reo → DỪNG ăn, nghe!      │    │
  │  │     Nghe xong → ĂN tiếp! ★ (luân phiên!)           │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  PARALLEL (Song song!):                                         │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ NHIỀU CPU! Nhiều task THỰC SỰ cùng lúc! ★            │    │
  │  │                                                      │    │
  │  │ CPU 1: ┌──────A──────┐                                │    │
  │  │ CPU 2: ┌──────B──────┐  ← CÙNG LÚC! ★               │    │
  │  │ CPU 3: ┌──────C──────┐                                │    │
  │  │                                                      │    │
  │  │ VD: Đang ĂN, điện thoại reo → VỪA ĂN VỪA NGHE! ★ │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  KHÁC BIỆT:                                                     │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ Concurrent: KHẢ NĂNG xử lý nhiều task!              │    │
  │  │ Parallel:   ĐỒNG THỜI xử lý nhiều task!              │    │
  │  │ ★ Parallel ⊂ Concurrent! (parallel là concurrent!)  │    │
  │  │ ★ Concurrent KHÔNG nhất thiết parallel! ★             │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```

---

## §5. JavaScript Coroutine — Sự Phát Triển!

```
  EVOLUTION CỦA JS ASYNC:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  ① Callback (ES5!) → ② Promise (ES6!) → ③ Generator (ES6!)│
  │  → ④ async/await (ES7!) ★                                   │
  │                                                              │
  │  ① CALLBACK HELL:                                               │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ getData(function(a) {                                  │    │
  │  │   getMore(a, function(b) {                             │    │
  │  │     getMore(b, function(c) {                           │    │
  │  │       getMore(c, function(d) {                         │    │
  │  │         // PYRAMID OF DOOM! ❌                         │    │
  │  │       });                                              │    │
  │  │     });                                                │    │
  │  │   });                                                  │    │
  │  │ });                                                    │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  ② PROMISE:                                                     │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ getData()                                              │    │
  │  │   .then(a => getMore(a))    // ★ Chaining! Flat!      │    │
  │  │   .then(b => getMore(b))                               │    │
  │  │   .then(c => getMore(c))                               │    │
  │  │   .catch(err => handle(err));                          │    │
  │  │                                                      │    │
  │  │ 3 trạng thái: pending → fulfilled / rejected! ★      │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  ③ GENERATOR (COROUTINE trong JS!) ★★★:                        │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ → function* = Generator function!                      │    │
  │  │ → yield = PAUSE execution! (suspend point!) ★         │    │
  │  │ → .next() = RESUME execution! ★                       │    │
  │  │ → Đây chính là CƠ CHẾ COROUTINE!                     │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  ④ ASYNC/AWAIT (Syntactic Sugar!):                              │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ → async function = Generator + auto-executor!          │    │
  │  │ → await = yield + Promise! ★                           │    │
  │  │ → Đọc như synchronous code!                           │    │
  │  │ → Error handling bằng try/catch!                       │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```

---

## §6. Generator — Coroutine Trong JS!

```javascript
// ═══════════════════════════════════════════════════════════
// GENERATOR — Cơ chế coroutine trong JavaScript!
// ═══════════════════════════════════════════════════════════

function* counterGenerator() {
  console.log("Start!");
  yield 1; // ★ PAUSE! Trả về 1!
  console.log("After yield 1");
  yield 2; // ★ PAUSE! Trả về 2!
  console.log("After yield 2");
  yield 3; // ★ PAUSE! Trả về 3!
  console.log("End!");
}

const gen = counterGenerator();
// ★ Gọi function KHÔNG chạy code! Chỉ tạo generator object!

console.log(gen.next()); // Start!       → { value: 1, done: false }
console.log(gen.next()); // After yield 1 → { value: 2, done: false }
console.log(gen.next()); // After yield 2 → { value: 3, done: false }
console.log(gen.next()); // End!          → { value: undefined, done: true }

// ═══════════════════════════════════════════════════════════
// GENERATOR + YIELD: Truyền giá trị 2 chiều!
// ═══════════════════════════════════════════════════════════

function* twoWay() {
  const a = yield "first"; // yield GỬI 'first' ra ngoài!
  console.log("a =", a); // a = giá trị từ next('hello')!
  const b = yield "second";
  console.log("b =", b);
  return "done";
}

const g = twoWay();
console.log(g.next()); // { value: 'first', done: false }
console.log(g.next("hello")); // a = hello → { value: 'second', done: false }
console.log(g.next("world")); // b = world → { value: 'done', done: true }

// ★ yield = TRAO đổi dữ liệu giữa bên trong & bên ngoài!
// ★ Giống hệt coroutine PAUSE + RESUME + data exchange!
```

---

## §7. Tự Viết async/await Bằng Generator!

```javascript
// ═══════════════════════════════════════════════════════════
// TỰ VIẾT: Auto-executor cho Generator!
// ★ Đây chính là cách async/await hoạt động bên trong!
// ═══════════════════════════════════════════════════════════

function asyncRunner(generatorFn) {
  return function (...args) {
    const gen = generatorFn.apply(this, args);

    return new Promise(function (resolve, reject) {
      // ★ Hàm tự động gọi next() liên tục!
      function step(method, value) {
        let result;
        try {
          result = gen[method](value);
          // gen.next(value) hoặc gen.throw(value)!
        } catch (err) {
          return reject(err);
        }

        if (result.done) {
          // ★ Generator kết thúc! Resolve promise!
          return resolve(result.value);
        }

        // ★ Chưa xong! yield trả về Promise → đợi resolve!
        Promise.resolve(result.value).then(
          function onFulfilled(val) {
            step("next", val); // ★ Resume với giá trị!
          },
          function onRejected(err) {
            step("throw", err); // ★ Throw error vào generator!
          },
        );
      }

      step("next", undefined); // Bắt đầu!
    });
  };
}

// ═══════════════════════════════════════════════════════════
// SỬ DỤNG: So sánh Generator + Runner vs async/await!
// ═══════════════════════════════════════════════════════════

function fakeFetch(url) {
  return new Promise(function (resolve) {
    setTimeout(function () {
      resolve("Data from " + url);
    }, 1000);
  });
}

// CÁCH 1: Generator + asyncRunner (tự viết!)
const fetchDataGen = asyncRunner(function* () {
  console.log("Fetching...");
  const data1 = yield fakeFetch("/api/users"); // PAUSE!
  console.log(data1); // 'Data from /api/users'
  const data2 = yield fakeFetch("/api/posts"); // PAUSE!
  console.log(data2); // 'Data from /api/posts'
  return [data1, data2];
});

// CÁCH 2: async/await (native! syntactic sugar!)
async function fetchDataAsync() {
  console.log("Fetching...");
  const data1 = await fakeFetch("/api/users"); // PAUSE!
  console.log(data1);
  const data2 = await fakeFetch("/api/posts"); // PAUSE!
  console.log(data2);
  return [data1, data2];
}

// ★ CẢ HAI HOẠT ĐỘNG GIỐNG HỆT NHAU!
// ★ async/await = Generator + Promise + auto-executor! ★
```

---

## §8. Event Loop — Vòng Lặp Sự Kiện!

```
  JS EVENT LOOP:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  ┌─────────────────┐     ┌─────────────────────────────┐    │
  │  │ CALL STACK       │     │ WEB APIs                    │    │
  │  │ (Execution Stack)│     │ (setTimeout, fetch,         │    │
  │  │                  │────→│  DOM events...)             │    │
  │  │ Sync code chạy  │     │                             │    │
  │  │ ở đây! ★        │     └──────────┬──────────────────┘    │
  │  └────────┬─────────┘                │                       │
  │           │                          │ callback ready!        │
  │           │                          ▼                       │
  │  ┌────────▼──────────────────────────────────────────┐       │
  │  │ EVENT LOOP ★                                      │       │
  │  │ ① Chạy hết call stack (sync!)                     │       │
  │  │ ② Xử lý TẤT CẢ microtask queue! ★               │       │
  │  │ ③ Lấy 1 macrotask từ queue!                       │       │
  │  │ ④ Lặp lại từ ②!                                   │       │
  │  └────────┬──────────────────────────┬───────────────┘       │
  │           │                          │                       │
  │  ┌────────▼─────────┐      ┌─────────▼──────────┐           │
  │  │ MICROTASK QUEUE  │      │ MACROTASK QUEUE     │           │
  │  │ (ưu tiên CAO!)   │      │ (ưu tiên thấp!)    │           │
  │  │                  │      │                     │           │
  │  │ → Promise.then() │      │ → setTimeout()      │           │
  │  │ → queueMicrotask │      │ → setInterval()     │           │
  │  │ → MutationObserver│     │ → I/O callbacks     │           │
  │  │ → process.nextTick│     │ → UI rendering      │           │
  │  │   (Node!)        │      │ → setImmediate      │           │
  │  │                  │      │   (Node!)           │           │
  │  │ ★ Chạy TRƯỚC    │      │                     │           │
  │  │   macrotask! ★   │      │                     │           │
  │  └──────────────────┘      └─────────────────────┘           │
  │                                                              │
  │  ★ Trong cùng 1 event loop:                                  │
  │  ★ MICROTASK luôn chạy TRƯỚC macrotask! ★                   │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```

```javascript
// ═══════════════════════════════════════════════════════════
// VÍ DỤ: Event Loop thứ tự thực thi!
// ═══════════════════════════════════════════════════════════

console.log("1 - sync"); // ① SYNC!

setTimeout(() => console.log("2 - macro"), 0); // ④ MACRO!

Promise.resolve().then(() => {
  console.log("3 - micro"); // ② MICRO!
});

queueMicrotask(() => {
  console.log("4 - micro"); // ③ MICRO!
});

console.log("5 - sync"); // ① SYNC!

// OUTPUT:
// 1 - sync
// 5 - sync
// 3 - micro   ← Microtask TRƯỚC! ★
// 4 - micro   ← Microtask TRƯỚC! ★
// 2 - macro   ← Macrotask SAU!
```

---

## §9. Best Practices!

```
  BEST PRACTICES:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  ┌──────────────────┬──────────────────────────────────┐    │
  │  │ Loại công việc  │ Nên dùng                          │    │
  │  ├──────────────────┼──────────────────────────────────┤    │
  │  │ I/O-intensive    │ Coroutine / Thread! ★             │    │
  │  │ (network, file)  │ → async/await, Promise!           │    │
  │  │                  │                                    │    │
  │  │ CPU-intensive    │ Multi-process! ★                   │    │
  │  │ (tính toán nặng) │ → Web Workers, Worker Threads!   │    │
  │  │                  │ → Child processes!                  │    │
  │  │                  │                                    │    │
  │  │ High concurrency │ Multi-process + Coroutine! ★★★    │    │
  │  │ (max hiệu suất) │ → Tận dụng multi-core +          │    │
  │  │                  │   hiệu quả coroutine!              │    │
  │  └──────────────────┴──────────────────────────────────┘    │
  │                                                              │
  │  TRONG JAVASCRIPT:                                               │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ → JS = SINGLE-THREADED! ★                            │    │
  │  │ → Coroutine = async/await (Generator-based!)          │    │
  │  │ → Multi-thread = Web Workers!                          │    │
  │  │ → Event Loop = cơ chế concurrent! ★                   │    │
  │  │ → Node.js: Worker Threads, Child Process!             │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```

---

## §10. Câu Hỏi Phỏng Vấn!

```
  CÂU HỎI:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  ❓ 1: Process vs Thread khác nhau thế nào?                      │
  │  → Process: đơn vị quản lý tài nguyên, memory RIÊNG!       │
  │  → Thread: đơn vị thực thi, CHIA SẺ memory trong process! │
  │  → Switch process TỐN HƠN switch thread!                     │
  │                                                              │
  │  ❓ 2: Coroutine là gì? Khác thread thế nào?                    │
  │  → User-level lightweight thread! USER quản lý!              │
  │  → Thread: OS scheduling, preemptive, cần lock!              │
  │  → Coroutine: user scheduling, cooperative, KHÔNG lock! ★   │
  │  → Overhead coroutine CỰC THẤP! (2KB vs 8MB!)              │
  │                                                              │
  │  ❓ 3: Concurrent vs Parallel?                                   │
  │  → Concurrent: 1 CPU luân phiên tasks (trông như cùng lúc!) │
  │  → Parallel: NHIỀU CPU thực sự cùng lúc! ★                  │
  │                                                              │
  │  ❓ 4: Generator liên quan gì đến coroutine?                     │
  │  → Generator = implementation coroutine trong JS! ★          │
  │  → yield = pause (suspend point!)                             │
  │  → .next() = resume!                                          │
  │  → async/await = sugar trên Generator + Promise!              │
  │                                                              │
  │  ❓ 5: Event Loop hoạt động thế nào?                             │
  │  → Chạy sync → hết microtask → 1 macrotask → lặp lại! ★  │
  │  → Microtask: Promise.then, queueMicrotask!                   │
  │  → Macrotask: setTimeout, setInterval, I/O!                   │
  │  → Microtask LUÔN trước macrotask!                            │
  │                                                              │
  │  ❓ 6: Tại sao JS single-threaded mà vẫn concurrent?            │
  │  → Event Loop + Callback Queue! ★                             │
  │  → Non-blocking I/O (async!)                                  │
  │  → Web APIs xử lý ngoài main thread!                         │
  │  → Coroutine (async/await) cho I/O-intensive!                 │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```
