# JavaScript Async & Event Loop — Implementation Mechanism — Deep Dive

> 📅 2026-02-13 · ⏱ 25 phút đọc
>
> try/finally cơ chế, Event Loop chi tiết, Macro vs Micro Tasks,
> Phân tích async phức tạp, Promise serial, Node vs Browser,
> Xử lý dữ liệu lớn mượt mà
> Độ khó: ⭐️⭐️⭐️⭐️⭐️ | Core JS Interview — Phải hiểu bản chất!

---

## Mục Lục

| #   | Phần                                   |
| --- | -------------------------------------- |
| 1   | try/return/finally — Cơ chế bên trong  |
| 2   | Event Loop — Cơ chế chi tiết           |
| 3   | Macro Tasks vs Micro Tasks             |
| 4   | Phân tích Async phức tạp — Phương pháp |
| 5   | Promise Serial — Thực thi tuần tự      |
| 6   | Node.js vs Browser Event Loop          |
| 7   | Xử lý dữ liệu lớn — Giữ trang mượt     |
| 8   | Tổng kết & Checklist phỏng vấn         |

---

## §1. try/return/finally — Cơ chế bên trong

```
TẠI SAO finally LUÔN CHẠY DÙ ĐÃ return:
═══════════════════════════════════════════════════════════════

  ECMAScript spec quy định:
  → return trong try/catch → giá trị được LƯU TẠM!
  → finally block chạy TRƯỚC KHI return thực sự!
  → Nếu finally CÓ return → GHI ĐÈ giá trị return cũ!

  COMPLETION RECORD (spec nội bộ):
  → Mỗi statement → Completion { type, value, target }
  → type = normal | break | continue | return | throw

  try   return 1;  → Completion { type: return, value: 1 } → LƯU TẠM!
  finally block    → CHẠY! (bất kể Completion type!)
  → Nếu finally có return → Completion MỚI ghi đè!
  → Nếu finally KHÔNG return → dùng Completion cũ!
```

```javascript
// ═══ VÍ DỤ 1: finally LUÔN chạy ═══
function test1() {
  try {
    console.log("try");
    return 1;
  } finally {
    console.log("finally"); // ← LUÔN CHẠY!
  }
}
console.log(test1());
// Output: "try" → "finally" → 1
// ① return 1 → lưu tạm Completion { return, 1 }
// ② finally chạy → log "finally"
// ③ Không có return trong finally → dùng Completion cũ → return 1

// ═══ VÍ DỤ 2: finally GHI ĐÈ return ═══
function test2() {
  try {
    return 1;
  } finally {
    return 2; // ← GHI ĐÈ!
  }
}
console.log(test2()); // 2! (KHÔNG PHẢI 1!)
// ① return 1 → lưu tạm Completion { return, 1 }
// ② finally return 2 → Completion MỚI { return, 2 } → GHI ĐÈ!

// ═══ VÍ DỤ 3: throw trong try, return trong finally ═══
function test3() {
  try {
    throw new Error("oops");
  } catch (e) {
    console.log("caught:", e.message);
    return "from catch";
  } finally {
    console.log("finally");
    // Nếu thêm: return 'from finally'; → ghi đè 'from catch'!
  }
}
console.log(test3());
// "caught: oops" → "finally" → "from catch"

// ═══ VÍ DỤ 4: return value KHÔNG bị thay đổi bởi finally ═══
function test4() {
  let x = 1;
  try {
    return x; // ← LƯU VALUE (1) vào Completion!
  } finally {
    x = 2; // ← Thay đổi x, NHƯNG Completion đã lưu 1!
  }
}
console.log(test4()); // 1! (KHÔNG PHẢI 2!)
// → return x lưu VALUE của x (1), không phải REFERENCE đến x!
// ⚠️ NHƯNG nếu x là object → return lưu REFERENCE → finally SẼ thấy thay đổi!

function test5() {
  let obj = { a: 1 };
  try {
    return obj; // ← LƯU REFERENCE đến object!
  } finally {
    obj.a = 2; // ← Thay đổi object QUA reference → ẢNH HƯỞNG!
  }
}
console.log(test5()); // { a: 2 }! ← Object bị thay đổi!
```

```
TỔNG KẾT try/finally:
═══════════════════════════════════════════════════════════════

  ┌──────────────────────────────────┬─────────────────────┐
  │ Trường hợp                       │ Kết quả             │
  ├──────────────────────────────────┼─────────────────────┤
  │ try return → finally (no return) │ return từ TRY       │
  │ try return → finally return      │ return từ FINALLY!  │
  │ try throw → catch return         │ return từ CATCH     │
  │ try throw → catch return         │                     │
  │   → finally return               │ return từ FINALLY!  │
  │ try return primitive → finally   │                     │
  │   thay đổi biến                  │ GIÁ TRỊ CŨ (copy!) │
  │ try return object → finally      │                     │
  │   thay đổi object property       │ OBJECT ĐÃ ĐỔI!     │
  └──────────────────────────────────┴─────────────────────┘

  QUY TẮC: finally LUÔN chạy → return trong finally GHI ĐÈ!
  ⚠️ ĐỪNG BAO GIỜ return trong finally! (confusing + ESLint warning!)
```

---

## §2. Event Loop — Cơ chế chi tiết

```
JAVASCRIPT = SINGLE-THREADED + EVENT LOOP:
═══════════════════════════════════════════════════════════════

  TẠI SAO SINGLE-THREADED:
  → JS sinh ra để thao tác DOM
  → 2 threads cùng sửa DOM → data race → inconsistent UI! 💀
  → Single-threaded = đơn giản + an toàn

  NHƯNG single-threaded thì LÀM SAO xử lý ASYNC?
  → Event Loop! (hàng đợi sự kiện)
  → JS chỉ chạy 1 việc tại 1 thời điểm
  → Async tasks ủy quyền cho BROWSER/NODE (multi-threaded!)
  → Khi xong → callback vào QUEUE → Event Loop đẩy vào call stack!
```

```
EVENT LOOP ARCHITECTURE:
═══════════════════════════════════════════════════════════════

  ┌─────────────────── JS ENGINE (V8) ──────────────────────┐
  │                                                          │
  │ ┌─────────────┐        ┌────────────────────────────┐   │
  │ │  CALL STACK  │        │       HEAP (Memory)        │   │
  │ │  ┌─────────┐│        │  Objects, closures,        │   │
  │ │  │  fn()   ││        │  arrays allocated here     │   │
  │ │  ├─────────┤│        │                            │   │
  │ │  │  main() ││        │                            │   │
  │ │  └─────────┘│        └────────────────────────────┘   │
  │ └──────┬──────┘                                          │
  │        │                                                 │
  └────────┼─────────────────────────────────────────────────┘
           │
  ┌────────▼─────────────────────────────────────────────────┐
  │                    EVENT LOOP                             │
  │                                                          │
  │  "Stack trống? → Micro Queue hết? → lấy 1 Macro Task!"  │
  │                                                          │
  │  ┌────────────────────┐   ┌──────────────────────────┐  │
  │  │  MICROTASK QUEUE   │   │   MACROTASK QUEUE        │  │
  │  │  (ưu tiên CAO!)    │   │   (ưu tiên THẤP hơn)    │  │
  │  │                    │   │                          │  │
  │  │  • Promise.then    │   │  • setTimeout            │  │
  │  │  • queueMicrotask  │   │  • setInterval           │  │
  │  │  • MutationObserver│   │  • I/O callbacks         │  │
  │  │  • process.nextTick│   │  • UI rendering          │  │
  │  │    (Node only!)    │   │  • MessageChannel        │  │
  │  └────────────────────┘   │  • requestAnimationFrame │  │
  │                           │  • setImmediate (Node)   │  │
  │                           └──────────────────────────┘  │
  └──────────────────────────────────────────────────────────┘

  ┌────────────────── WEB APIs (Browser) ────────────────────┐
  │  setTimeout, fetch, DOM events, XMLHttpRequest,          │
  │  geolocation, WebSocket... → chạy trên BROWSER THREADS! │
  │  → Xong → đẩy callback vào Macro/Micro Queue!           │
  └──────────────────────────────────────────────────────────┘
```

```
EVENT LOOP — THUẬT TOÁN (mỗi vòng lặp):
═══════════════════════════════════════════════════════════════

  ① Kiểm tra CALL STACK:
     → Có task? → Chạy cho đến khi stack trống!

  ② Xử lý TẤT CẢ MICROTASKS:
     → Lấy từng microtask → đẩy vào call stack → chạy!
     → Nếu microtask tạo thêm microtask → chạy LUÔN!
     → LẶP LẠI cho đến khi microtask queue TRỐNG!
     → ⚠️ Microtask có thể STARVE macro tasks!

  ③ Render (nếu cần):
     → requestAnimationFrame callbacks
     → Layout + Paint (nếu có thay đổi DOM)

  ④ Lấy 1 MACROTASK:
     → Lấy macrotask ĐẦU TIÊN → đẩy vào call stack → chạy!
     → Chỉ 1 macrotask mỗi vòng lặp!

  ⑤ Quay lại ① (LOOP!)

  FLOW MỖI VÒNG:
  [Call Stack trống] → [TẤT CẢ Micro] → [Render?] → [1 Macro] → lặp
```

---

## §3. Macro Tasks vs Micro Tasks

```
MACRO TASKS (Task Queue):
═══════════════════════════════════════════════════════════════

  • setTimeout(fn, delay)
  • setInterval(fn, delay)
  • setImmediate(fn) — Node.js only!
  • I/O operations (file read, network)
  • UI rendering / interaction events
  • MessageChannel.port.postMessage
  • requestAnimationFrame (⚠️ trước paint, sau micro!)

MICRO TASKS (Microtask Queue):
═══════════════════════════════════════════════════════════════

  • Promise.then / .catch / .finally callbacks
  • async/await (mỗi await → phần sau = microtask)
  • queueMicrotask(fn)
  • MutationObserver callback
  • process.nextTick(fn) — Node.js only! (ưu tiên CAO NHẤT!)

THỨ TỰ ƯU TIÊN:
  process.nextTick > Promise.then > queueMicrotask > setTimeout
  (Node only)         (microtask)                      (macrotask)
```

```javascript
// ═══ VÍ DỤ CƠ BẢN ═══
console.log("1 — sync");

setTimeout(() => {
  console.log("2 — macro");
}, 0);

Promise.resolve().then(() => {
  console.log("3 — micro");
});

console.log("4 — sync");

// Output: 1, 4, 3, 2
// ① Sync: log 1, log 4
// ② Micro: Promise.then → log 3
// ③ Macro: setTimeout → log 2
```

```javascript
// ═══ VÍ DỤ NÂNG CAO — Microtask trong Microtask ═══
console.log("start");

setTimeout(() => console.log("timeout"), 0);

Promise.resolve()
  .then(() => {
    console.log("promise 1");
    // Microtask tạo thêm microtask:
    Promise.resolve().then(() => console.log("promise 2"));
  })
  .then(() => console.log("promise 3"));

console.log("end");

// Output: start, end, promise 1, promise 2, promise 3, timeout
// ① Sync: "start", "end"
// ② Micro 1: "promise 1" → tạo thêm micro (promise 2)
// ③ Micro 2: "promise 2" (chạy TRƯỚC promise 3! mới tạo nhưng ưu tiên!)
//    ⚠️ Sai! Promise 2 vào queue SAU promise 3 (đã .then chain!)
//    → Đúng ra: start, end, promise 1, promise 3, promise 2, timeout
//    Giải thích:
//    • .then().then() = chained → promise 3 vào queue sau promise 1 xong
//    • Promise.resolve().then() trong callback → promise 2 vào queue
//    • Queue lúc này: [promise 3, promise 2] → chạy theo FIFO!
//    → NHƯNG thực tế: promise 1 callback chạy → cả promise 3 VÀ
//      promise 2 đều được schedule → ai vào queue trước?
//    → Promise.resolve().then(promise 2) = immediate resolve
//    → .then(promise 3) = chờ promise 1 resolve mới queue
//    → Kết quả thực: start, end, promise 1, promise 2, promise 3, timeout
```

```javascript
// ═══ TRƯỜNG HỢP: sync → micro → render → macro ═══

// Chạy thử trong browser:
const box = document.getElementById("box");

console.log("1 — sync");

setTimeout(() => {
  console.log("2 — macro");
  box.style.backgroundColor = "red"; // Macro → render sau micro
}, 0);

Promise.resolve().then(() => {
  console.log("3 — micro");
  box.style.backgroundColor = "blue"; // Micro → render TRƯỚC macro!
  // → User có thể KHÔNG thấy blue vì quá nhanh!
});

console.log("4 — sync");

// Output: 1, 4, 3, 2
// Render flow: sync → micro (blue) → RENDER → macro (red) → RENDER
// → User thấy: blue rất nhanh → đổi thành red
// → Hoặc: nếu quá nhanh → chỉ thấy red (browser gộp render!)
```

---

## §4. Phân tích Async phức tạp — Phương pháp

```
PHƯƠNG PHÁP PHÂN TÍCH:
═══════════════════════════════════════════════════════════════

  ① Chạy TẤT CẢ code SYNC trước (top-to-bottom)
  ② Xác định CALLBACK thuộc Micro hay Macro
  ③ Sync xong → xử lý TẤT CẢ Micro (FIFO)
  ④ Micro tạo thêm Micro → xử lý ngay trong round này!
  ⑤ Micro hết → lấy 1 Macro → chạy
  ⑥ Macro xong → lại xử lý TẤT CẢ Micro mới
  ⑦ Lặp lại ⑤-⑥

  TIP: Vẽ bảng 3 cột!
  ┌────────────┬─────────────────┬─────────────────┐
  │ Call Stack  │ Micro Queue     │ Macro Queue     │
  ├────────────┼─────────────────┼─────────────────┤
  │ main()     │                 │                 │
  │ ...        │ ...             │ ...             │
  └────────────┴─────────────────┴─────────────────┘
```

```javascript
// ═══ BÀI TẬP 1: setTimeout + Promise lồng nhau ═══
console.log("1");

setTimeout(function () {
  console.log("2");
  Promise.resolve().then(function () {
    console.log("3");
  });
}, 0);

new Promise(function (resolve) {
  console.log("4"); // ← executor chạy ĐỒNG BỘ!
  resolve();
}).then(function () {
  console.log("5");
});

setTimeout(function () {
  console.log("6");
}, 0);

console.log("7");

// PHÂN TÍCH:
// Sync: 1 → 4 (Promise executor = sync!) → 7
// Micro Queue: [then(5)]
// Macro Queue: [setTimeout(2,3), setTimeout(6)]
//
// Round 1: sync → 1, 4, 7
// Round 2: drain micro → 5
// Round 3: 1 macro → 2 → micro [then(3)] → drain micro → 3
// Round 4: 1 macro → 6
//
// OUTPUT: 1, 4, 7, 5, 2, 3, 6
```

```javascript
// ═══ BÀI TẬP 2: async/await ═══
async function async1() {
  console.log("async1 start");
  await async2();
  // ↑ TƯƠNG ĐƯƠNG: async2().then(() => { console.log('async1 end') })
  console.log("async1 end");
}

async function async2() {
  console.log("async2");
}

console.log("script start");

setTimeout(function () {
  console.log("setTimeout");
}, 0);

async1();

new Promise(function (resolve) {
  console.log("promise1");
  resolve();
}).then(function () {
  console.log("promise2");
});

console.log("script end");

// PHÂN TÍCH:
// ① Sync: "script start"
// ② Macro: setTimeout → Macro Queue
// ③ async1(): "async1 start" → await async2() → "async2" (sync!)
//    → Phần sau await → Micro Queue: [async1 end]
// ④ Promise executor: "promise1" (sync!) → Micro Queue: [async1 end, promise2]
// ⑤ Sync: "script end"
// ⑥ Drain micro: "async1 end", "promise2"
// ⑦ Macro: "setTimeout"
//
// OUTPUT: script start, async1 start, async2, promise1, script end,
//         async1 end, promise2, setTimeout
```

```javascript
// ═══ BÀI TẬP 3: PHỨC TẠP — Nhiều lớp lồng ═══
console.log("1");

setTimeout(() => {
  console.log("2");
  new Promise((resolve) => {
    console.log("3");
    resolve();
  }).then(() => {
    console.log("4");
  });
}, 0);

new Promise((resolve) => {
  console.log("5");
  resolve();
})
  .then(() => {
    console.log("6");
    setTimeout(() => {
      console.log("7");
    }, 0);
  })
  .then(() => {
    console.log("8");
  });

setTimeout(() => {
  console.log("9");
  new Promise((resolve) => {
    console.log("10");
    resolve();
  }).then(() => {
    console.log("11");
  });
}, 0);

console.log("12");

// PHÂN TÍCH từng bước:
//
// ═══ Sync Phase ═══
// log '1'
// setTimeout ① → Macro: [ST1(2,3,4)]
// Promise executor: log '5' → Micro: [then(6)]
// setTimeout ② → Macro: [ST1(2,3,4), ST2(9,10,11)]
// log '12'
//
// OUTPUT hiện tại: 1, 5, 12
// Micro Queue: [then(6)]
// Macro Queue: [ST1, ST2]
//
// ═══ Drain Micro ═══
// then(6): log '6' → setTimeout ③ → Macro: [ST1, ST2, ST3(7)]
//           → chain .then(8) → Micro: [then(8)]
// then(8): log '8'
//
// OUTPUT: 1, 5, 12, 6, 8
// Macro Queue: [ST1, ST2, ST3]
//
// ═══ Macro 1: ST1 ═══
// log '2' → Promise executor: log '3' → Micro: [then(4)]
// Drain micro: log '4'
//
// OUTPUT: 1, 5, 12, 6, 8, 2, 3, 4
//
// ═══ Macro 2: ST2 ═══
// log '9' → Promise executor: log '10' → Micro: [then(11)]
// Drain micro: log '11'
//
// OUTPUT: 1, 5, 12, 6, 8, 2, 3, 4, 9, 10, 11
//
// ═══ Macro 3: ST3 ═══
// log '7'
//
// FINAL: 1, 5, 12, 6, 8, 2, 3, 4, 9, 10, 11, 7
```

---

## §5. Promise Serial — Thực thi tuần tự

```javascript
// ═══ VẤN ĐỀ: Chạy nhiều async tasks TUẦN TỰ ═══
// Task 1 xong → Task 2 bắt đầu → Task 2 xong → Task 3 bắt đầu...

const tasks = [
  () => fetch("/api/1").then((r) => r.json()),
  () => fetch("/api/2").then((r) => r.json()),
  () => fetch("/api/3").then((r) => r.json()),
];

// ═══ Cách 1: reduce (Kinh điển!) ═══
function serial(tasks) {
  return tasks.reduce((promise, task) => {
    return promise.then((results) => {
      return task().then((result) => [...results, result]);
    });
  }, Promise.resolve([]));
}

serial(tasks).then((results) => {
  console.log(results); // [result1, result2, result3]
});

// Cách hoạt động (unroll):
// Promise.resolve([])
//   .then([] => task1().then(r => [r]))        // → [r1]
//   .then([r1] => task2().then(r => [r1, r]))  // → [r1, r2]
//   .then([r1,r2] => task3().then(r => [r1,r2,r])) // → [r1,r2,r3]

// ═══ Cách 2: async/await for...of (Dễ đọc!) ═══
async function serial(tasks) {
  const results = [];
  for (const task of tasks) {
    const result = await task(); // Chờ xong mới next!
    results.push(result);
  }
  return results;
}

// ═══ Cách 3: Recursive ═══
function serial(tasks) {
  return new Promise((resolve) => {
    const results = [];
    function run(index) {
      if (index >= tasks.length) {
        resolve(results);
        return;
      }
      tasks[index]().then((result) => {
        results.push(result);
        run(index + 1); // Đệ quy!
      });
    }
    run(0);
  });
}

// ═══ Cách 4: for...of + then chain ═══
function serial(tasks) {
  let promise = Promise.resolve([]);
  for (const task of tasks) {
    promise = promise.then((results) =>
      task().then((result) => [...results, result]),
    );
  }
  return promise;
}
```

```javascript
// ═══ PROMISE CONCURRENCY CONTROL (Giới hạn song song!) ═══
// Chạy TỐI ĐA N tasks đồng thời:

function parallelLimit(tasks, limit) {
  return new Promise((resolve, reject) => {
    const results = [];
    let running = 0;
    let index = 0;
    let finished = 0;

    function run() {
      while (running < limit && index < tasks.length) {
        const i = index++;
        running++;

        tasks[i]()
          .then((result) => {
            results[i] = result; // Giữ thứ tự!
            running--;
            finished++;
            if (finished === tasks.length) {
              resolve(results);
            } else {
              run(); // Chạy task tiếp theo!
            }
          })
          .catch(reject);
      }
    }

    run();
  });
}

// Sử dụng: tối đa 3 requests đồng thời:
const urls = Array.from({ length: 20 }, (_, i) => `/api/${i}`);
const tasks = urls.map((url) => () => fetch(url).then((r) => r.json()));
parallelLimit(tasks, 3).then((results) => console.log(results));

// ═══ HOẶC dùng Promise.allSettled cho batch ═══
async function batchProcess(items, batchSize, processor) {
  const results = [];
  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);
    const batchResults = await Promise.allSettled(
      batch.map((item) => processor(item)),
    );
    results.push(...batchResults);
  }
  return results;
}
```

---

## §6. Node.js vs Browser Event Loop

```
BROWSER EVENT LOOP:
═══════════════════════════════════════════════════════════════

  ┌──── Macro Task ────┐
  │ setTimeout         │
  │ setInterval        │
  │ I/O, UI events     │
  │ MessageChannel     │
  └────────┬───────────┘
           ▼
  Lấy 1 Macro Task → Chạy
           │
           ▼
  ┌──── Micro Tasks ───┐
  │ Promise.then       │ → Chạy TẤT CẢ micro tasks!
  │ queueMicrotask     │
  │ MutationObserver   │
  └────────┬───────────┘
           ▼
  ┌──── Render ────────┐
  │ rAF callbacks      │
  │ Layout + Paint     │ → ~16.67ms (60fps)
  └────────┬───────────┘
           ▼
  Quay lại lấy 1 Macro Task...
```

```
NODE.JS EVENT LOOP (libuv — 6 PHASES!):
═══════════════════════════════════════════════════════════════

  ┌───────────────────────────────────────────────────────┐
  │                    Event Loop                          │
  │                                                       │
  │  ┌─────────────────┐                                  │
  │  │ ① Timers        │ ← setTimeout, setInterval       │
  │  │   callbacks     │                                  │
  │  └────────┬────────┘                                  │
  │           ▼                                           │
  │  ┌─────────────────┐                                  │
  │  │ ② Pending I/O   │ ← I/O callbacks (TCP errors...) │
  │  │   callbacks     │                                  │
  │  └────────┬────────┘                                  │
  │           ▼                                           │
  │  ┌─────────────────┐                                  │
  │  │ ③ Idle, Prepare │ ← Nội bộ Node (không dùng!)     │
  │  └────────┬────────┘                                  │
  │           ▼                                           │
  │  ┌─────────────────┐                                  │
  │  │ ④ Poll          │ ← I/O callbacks (fs, network)   │
  │  │   (quan trọng!) │    Chờ I/O events nếu queue trống│
  │  └────────┬────────┘                                  │
  │           ▼                                           │
  │  ┌─────────────────┐                                  │
  │  │ ⑤ Check         │ ← setImmediate callbacks        │
  │  └────────┬────────┘                                  │
  │           ▼                                           │
  │  ┌─────────────────┐                                  │
  │  │ ⑥ Close         │ ← socket.on('close')            │
  │  │   callbacks     │                                  │
  │  └────────┬────────┘                                  │
  │           ▼                                           │
  │  Quay lại ① (nếu còn events/timers)                   │
  │                                                       │
  │  ⚡ GIỮA MỖI PHASE: chạy TẤT CẢ microtasks!         │
  │     process.nextTick() queue TRƯỚC!                   │
  │     Promise.then() queue SAU!                         │
  └───────────────────────────────────────────────────────┘
```

```
KHÁC BIỆT CHÍNH:
═══════════════════════════════════════════════════════════════

  ┌─────────────────────┬─────────────────┬──────────────────┐
  │ Feature             │ Browser         │ Node.js          │
  ├─────────────────────┼─────────────────┼──────────────────┤
  │ Phases              │ Đơn giản: Macro │ 6 phases (libuv) │
  │                     │ → Micro → Render│                  │
  │ Micro timing        │ Sau MỖI macro   │ Giữa MỖI PHASE  │
  │                     │ task            │ (Node 11+)       │
  │ process.nextTick    │ ❌ Không có     │ ✅ Ưu tiên nhất! │
  │ setImmediate        │ ❌ Không có     │ ✅ Check phase   │
  │ requestAnimationFrame│ ✅ Trước paint │ ❌ Không có      │
  │ MutationObserver    │ ✅ Microtask    │ ❌ Không có      │
  │ UI Rendering        │ ✅ Có          │ ❌ Không (no DOM!)│
  │ I/O                 │ fetch, XHR      │ fs, net, http    │
  └─────────────────────┴─────────────────┴──────────────────┘
```

```javascript
// ═══ Node.js: setTimeout vs setImmediate ═══

// TRƯỜNG HỢP 1: Top-level (KHÔNG xác định thứ tự!):
setTimeout(() => console.log("timeout"), 0);
setImmediate(() => console.log("immediate"));
// Output: CÓ THỂ timeout trước HOẶC immediate trước!
// → Phụ thuộc vào timer resolution (~1ms) khi event loop bắt đầu!

// TRƯỜNG HỢP 2: Trong I/O callback (XÁC ĐỊNH!):
const fs = require("fs");
fs.readFile(__filename, () => {
  setTimeout(() => console.log("timeout"), 0);
  setImmediate(() => console.log("immediate"));
});
// Output: LUÔN immediate → timeout!
// → Vì I/O callback chạy trong Poll phase
// → Check phase (setImmediate) TRƯỚC Timers phase (setTimeout)!

// ═══ process.nextTick vs Promise.then ═══
process.nextTick(() => console.log("nextTick"));
Promise.resolve().then(() => console.log("promise"));
// Output: LUÔN nextTick → promise!
// → nextTick queue xử lý TRƯỚC microtask queue!

// ⚠️ process.nextTick CÓ THỂ STARVE I/O:
function recursiveNextTick() {
  process.nextTick(recursiveNextTick); // VÒNG LẶP VÔ HẠN!
  // → I/O KHÔNG BAO GIỜ được xử lý! 💀
  // → Dùng setImmediate thay thế cho recursive!
}
```

```
NODE 10 vs NODE 11+ (THAY ĐỔI QUAN TRỌNG!):
═══════════════════════════════════════════════════════════════

  // Code:
  setTimeout(() => {
      console.log('timeout1');
      Promise.resolve().then(() => console.log('promise1'));
  }, 0);
  setTimeout(() => {
      console.log('timeout2');
      Promise.resolve().then(() => console.log('promise2'));
  }, 0);

  NODE 10 (cũ): timeout1, timeout2, promise1, promise2
  → Chạy TẤT CẢ timers trong phase → RỒI mới micro!

  NODE 11+ (mới): timeout1, promise1, timeout2, promise2
  → Mỗi macro task → drain micro → macro tiếp
  → GIỐNG BROWSER! ✅

  → Node 11+ align behavior với browser!
```

---

## §7. Xử lý dữ liệu lớn — Giữ trang mượt

```
VẤN ĐỀ: RENDER 100,000 DOM ELEMENTS:
═══════════════════════════════════════════════════════════════

  // ❌ Render 1 lần → BLOCK UI 3-5 giây!
  for (let i = 0; i < 100000; i++) {
      const div = document.createElement('div');
      div.textContent = `Item ${i}`;
      container.appendChild(div);
  }
  // → Main thread bị khóa → UI đứng!
```

```javascript
// ═══ GIẢI PHÁP 1: requestAnimationFrame + Chunking ═══
// Chia 100K items thành chunks nhỏ, render theo frame:

function renderChunked(data, container, chunkSize = 100) {
  let index = 0;

  function renderChunk() {
    // Mỗi frame: render 1 chunk nhỏ!
    const fragment = document.createDocumentFragment();
    const end = Math.min(index + chunkSize, data.length);

    for (let i = index; i < end; i++) {
      const div = document.createElement("div");
      div.textContent = data[i];
      fragment.appendChild(div);
    }

    container.appendChild(fragment); // 1 lần reflow!
    index = end;

    if (index < data.length) {
      requestAnimationFrame(renderChunk); // Frame tiếp!
    }
  }

  requestAnimationFrame(renderChunk);
}

// Sử dụng:
const data = Array.from({ length: 100000 }, (_, i) => `Item ${i}`);
renderChunked(data, document.getElementById("container"));
// → UI MƯỢT! Render ~100 items/frame × ~60fps = ~6000 items/giây
```

```javascript
// ═══ GIẢI PHÁP 2: setTimeout Chunking ═══
function renderWithTimeout(data, container, chunkSize = 500) {
  let index = 0;

  function chunk() {
    const fragment = document.createDocumentFragment();
    const end = Math.min(index + chunkSize, data.length);

    for (let i = index; i < end; i++) {
      const div = document.createElement("div");
      div.textContent = data[i];
      fragment.appendChild(div);
    }

    container.appendChild(fragment);
    index = end;

    if (index < data.length) {
      setTimeout(chunk, 0); // Yield cho browser!
    }
  }

  chunk();
}
// → setTimeout = macro task → browser paint xen kẽ!
// → Kém chính xác hơn rAF (có thể > 16ms)
```

```javascript
// ═══ GIẢI PHÁP 3: Virtual Scrolling (TỐI ƯU NHẤT!) ═══
// Chỉ render items ĐANG THẤY trên viewport!

class VirtualList {
  constructor(container, items, itemHeight, visibleCount) {
    this.container = container;
    this.items = items;
    this.itemHeight = itemHeight;
    this.visibleCount = visibleCount;
    this.totalHeight = items.length * itemHeight;
    this.startIndex = 0;
    this.buffer = 5; // Buffer items cho smooth scroll

    this.setup();
  }

  setup() {
    // ① Container styles:
    this.container.style.overflow = "auto";
    this.container.style.position = "relative";

    // ② Phantom element (chiều cao thật để có scrollbar):
    this.phantom = document.createElement("div");
    this.phantom.style.height = `${this.totalHeight}px`;
    this.container.appendChild(this.phantom);

    // ③ Visible content wrapper:
    this.content = document.createElement("div");
    this.content.style.position = "absolute";
    this.content.style.top = "0";
    this.content.style.width = "100%";
    this.container.appendChild(this.content);

    // ④ Listen scroll:
    this.container.addEventListener("scroll", () => {
      this.onScroll();
    });

    this.render();
  }

  onScroll() {
    const scrollTop = this.container.scrollTop;
    this.startIndex = Math.floor(scrollTop / this.itemHeight);
    this.content.style.transform = `translateY(${this.startIndex * this.itemHeight}px)`;
    this.render();
  }

  render() {
    const start = Math.max(0, this.startIndex - this.buffer);
    const end = Math.min(
      this.items.length,
      this.startIndex + this.visibleCount + this.buffer,
    );

    // Chỉ render ~20-30 items thay vì 100,000! ⚡
    this.content.innerHTML = "";
    for (let i = start; i < end; i++) {
      const div = document.createElement("div");
      div.style.height = `${this.itemHeight}px`;
      div.textContent = this.items[i];
      this.content.appendChild(div);
    }
  }
}

// Sử dụng:
const items = Array.from({ length: 100000 }, (_, i) => `Item ${i}`);
new VirtualList(
  document.getElementById("container"),
  items,
  30, // itemHeight: 30px
  20, // visibleCount: 20 items
);
// → DOM chỉ CÓ ~30 elements (20 visible + 10 buffer)!
// → Scroll mượt với 100,000 items! ⚡
```

```javascript
// ═══ GIẢI PHÁP 4: Web Worker (Tính toán nặng!) ═══
// Chuyển heavy computation sang THREAD KHÁC:

// main.js:
const worker = new Worker("worker.js");
worker.postMessage({ data: hugeArray });

worker.onmessage = function (e) {
  const processedData = e.data;
  renderResults(processedData); // Render kết quả!
};

// worker.js:
self.onmessage = function (e) {
  const data = e.data.data;
  // Heavy computation ở đây → KHÔNG block UI!
  const result = data
    .filter((item) => item.active)
    .map((item) => transform(item))
    .sort((a, b) => a.score - b.score);

  self.postMessage(result); // Gửi kết quả về!
};

// ⚠️ Worker KHÔNG truy cập được: DOM, window, document
// ✅ Worker CÓ THỂ: fetch, setTimeout, IndexedDB, importScripts
```

```
SO SÁNH GIẢI PHÁP:
═══════════════════════════════════════════════════════════════

  ┌──────────────────┬──────────┬───────────┬──────────────┐
  │ Giải pháp        │ Dễ dùng  │ Hiệu quả  │ Use case     │
  ├──────────────────┼──────────┼───────────┼──────────────┤
  │ rAF Chunking     │ ⭐⭐⭐   │ ⭐⭐      │ Render dần   │
  │ setTimeout Chunk │ ⭐⭐⭐⭐  │ ⭐⭐      │ Simple tasks │
  │ Virtual Scroll   │ ⭐⭐     │ ⭐⭐⭐⭐⭐ │ Long lists   │
  │ Web Worker       │ ⭐⭐     │ ⭐⭐⭐⭐   │ Heavy compute│
  │ IntersectionObs. │ ⭐⭐⭐   │ ⭐⭐⭐    │ Lazy load    │
  └──────────────────┴──────────┴───────────┴──────────────┘

  TỔNG HỢP THỰC TẾ:
  → Render danh sách dài → Virtual Scrolling
  → Tính toán data nặng → Web Worker
  → Render progressive → rAF Chunking
  → Load on-demand → IntersectionObserver + Lazy Load
```

---

## §8. Tổng kết & Checklist phỏng vấn

```
MIND MAP:
═══════════════════════════════════════════════════════════════

  JS Implementation Mechanism
  ├── try/finally: finally LUÔN chạy, return finally GHI ĐÈ try return
  │   └── Completion Record: { type: return, value } lưu tạm
  ├── Event Loop: single-threaded + event queue
  │   ├── Call Stack → ALL Microtasks → Render? → 1 Macrotask → loop
  │   ├── Macro: setTimeout, setInterval, I/O, MessageChannel
  │   └── Micro: Promise.then, queueMicrotask, MutationObserver
  ├── Async Analysis: sync first → drain micro → 1 macro → drain micro...
  ├── Promise Serial: reduce chain, async for...of, recursive
  │   └── Concurrency control: parallelLimit(tasks, N)
  ├── Node vs Browser: 6 phases (libuv), process.nextTick, setImmediate
  │   └── Node 11+: align với browser (micro sau mỗi macro)
  └── Big Data: rAF chunking, virtual scroll, Web Worker
```

### Checklist

- [ ] **try/finally**: finally LUÔN chạy, return trong finally GHI ĐÈ return try/catch
- [ ] **Completion Record**: return lưu VALUE (primitive = copy, object = reference → finally thay đổi nội dung!)
- [ ] **Event Loop**: single-threaded + task queues, JS ủy quyền async cho browser/Node threads
- [ ] **Event Loop thuật toán**: Call Stack → drain ALL Micro → Render (rAF) → 1 Macro → lặp lại
- [ ] **Macro tasks**: setTimeout, setInterval, I/O, UI events, MessageChannel, setImmediate (Node)
- [ ] **Micro tasks**: Promise.then, queueMicrotask, MutationObserver, process.nextTick (Node, ưu tiên nhất!)
- [ ] **Microtask starvation**: micro tạo micro → xử lý NGAY → có thể block macro mãi!
- [ ] **Promise executor**: `new Promise(fn)` → fn chạy ĐỒNG BỘ! Chỉ .then callback mới async!
- [ ] **async/await**: await X = X.then(() => phần sau) → phần sau await = microtask
- [ ] **Phân tích async**: vẽ bảng 3 cột (Stack / Micro Queue / Macro Queue), xử lý từng round
- [ ] **Promise serial reduce**: `tasks.reduce((p, task) => p.then(r => task().then(...)), Promise.resolve([]))`
- [ ] **Promise serial async/await**: `for (const task of tasks) { await task() }` — dễ đọc nhất!
- [ ] **Concurrency limit**: pool pattern — track running count, chạy task mới khi slot trống
- [ ] **Node 6 phases**: Timers → Pending I/O → Idle → Poll → Check → Close, micro giữa mỗi phase
- [ ] **setTimeout vs setImmediate**: top-level = không xác định, trong I/O = immediate trước!
- [ ] **process.nextTick vs Promise**: nextTick queue TRƯỚC microtask queue, có thể starve I/O!
- [ ] **Node 11+**: micro sau MỖI macro (giống browser), trước đó micro sau MỖI PHASE
- [ ] **rAF Chunking**: chia data thành chunks nhỏ, render mỗi frame, DocumentFragment giảm reflow
- [ ] **Virtual Scrolling**: chỉ render items visible + buffer, phantom div cho scrollbar, translateY dịch chuyển
- [ ] **Web Worker**: heavy computation off main thread, postMessage giao tiếp, KHÔNG truy cập DOM

---

_Nguồn: ConardLi — "JavaScript Implementation Mechanism" · Juejin_
_Cập nhật lần cuối: Tháng 2, 2026_
