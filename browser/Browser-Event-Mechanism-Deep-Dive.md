# Browser Event Mechanism — Event Model, Event Loop & Delegation Deep Dive

> 📅 2026-02-11 · ⏱ 30 phút đọc
>
> Tài liệu chuyên sâu về Event Mechanism: 3 Event Models (DOM0/IE/DOM2),
> Event Bubbling, Event Delegation, Event Loop, Macro/Micro Tasks,
> Execution Stack, Node.js Event Loop, và Event Triggering Process.
> Độ khó: ⭐️⭐️⭐️⭐️⭐️ | Chủ đề: Browser Internals & JavaScript Runtime

---

## Mục Lục

0. [Event là gì? 3 Event Models](#0-event-là-gì-3-event-models)
1. [Ngăn Event Bubbling](#1-ngăn-event-bubbling)
2. [Event Delegation (Ủy thác sự kiện)](#2-event-delegation-ủy-thác-sự-kiện)
3. [Use Cases cho Event Delegation](#3-use-cases-cho-event-delegation)
4. [Synchronous vs Asynchronous](#4-synchronous-vs-asynchronous)
5. [Event Loop (Vòng lặp sự kiện)](#5-event-loop-vòng-lặp-sự-kiện)
6. [Macro Tasks vs Micro Tasks](#6-macro-tasks-vs-micro-tasks)
7. [Execution Stack (Ngăn xếp thực thi)](#7-execution-stack-ngăn-xếp-thực-thi)
8. [Node.js Event Loop vs Browser](#8-nodejs-event-loop-vs-browser)
9. [Event Triggering Process (3 pha)](#9-event-triggering-process-3-pha)
10. [Tóm Tắt & Câu Hỏi Phỏng Vấn](#10-tóm-tắt--câu-hỏi-phỏng-vấn)

---

## 0. Event là gì? 3 Event Models

> **🎯 Event = hành động tương tác; 3 models: DOM0, IE, DOM2**

```
EVENT — ĐỊNH NGHĨA:
═══════════════════════════════════════════════════════════════

  EVENT = hành động tương tác khi user thao tác webpage
  → click, move, scroll, resize, document loading...

  Event được đóng gói thành EVENT OBJECT chứa:
  → Event PROPERTIES (thông tin sự kiện)
  → Event METHODS (thao tác có thể thực hiện)
```

### 3 Event Models

```
3 EVENT MODELS:
═══════════════════════════════════════════════════════════════

  ① DOM0 EVENT MODEL
  ┌──────────────────────────────────────────────────────────┐
  │ → KHÔNG có event propagation (không có event flow)      │
  │ → Một số browser hiện đại hỗ trợ qua BUBBLING          │
  │ → Listener defined trực tiếp trong HTML hoặc qua JS    │
  │ → TẤT CẢ browsers tương thích ✅                       │
  │ → Register event trực tiếp trên DOM object              │
  │                                                          │
  │ VD:  element.onclick = function() { ... }               │
  │      <button onclick="handler()">Click</button>         │
  └──────────────────────────────────────────────────────────┘

  ② IE EVENT MODEL (2 pha)
  ┌──────────────────────────────────────────────────────────┐
  │ Pha 1: EVENT HANDLING (target)                           │
  │   → Execute listeners TRÊN target element TRƯỚC        │
  │                                                          │
  │ Pha 2: EVENT BUBBLING                                    │
  │   → Bubble từ TARGET → DOCUMENT                         │
  │   → Kiểm tra mỗi node → có listener → execute         │
  │                                                          │
  │ API: attachEvent('onclick', handler)                     │
  │ → Thêm NHIỀU listeners, execute TUẦN TỰ                │
  │                                                          │
  │    [Target] ──► [Parent] ──► [Body] ──► [Document]     │
  │    Pha 1          ─────── Pha 2 (Bubbling) ──────       │
  └──────────────────────────────────────────────────────────┘

  ③ DOM LEVEL 2 EVENT MODEL (3 pha)
  ┌──────────────────────────────────────────────────────────┐
  │ Pha 1: EVENT CAPTURING (bắt sự kiện)                    │
  │   → Event propagate TỪ DOCUMENT ──► TARGET              │
  │   → Mỗi node: có listener → execute                    │
  │                                                          │
  │ Pha 2: EVENT HANDLING (target)                           │
  │   → Giống IE model                                       │
  │                                                          │
  │ Pha 3: EVENT BUBBLING                                    │
  │   → Giống IE model                                       │
  │                                                          │
  │ API: addEventListener(event, handler, useCapture)        │
  │ → Tham số 3: true = capturing, false = bubbling         │
  │                                                          │
  │  [Document]──►[Body]──►[Parent]──►[TARGET]──►[Parent]   │
  │  ──── Pha 1 (Capturing) ────    │  ── Pha 3 (Bubbling)  │
  │                              Pha 2                       │
  └──────────────────────────────────────────────────────────┘

  SO SÁNH:
  ┌──────────┬───────────┬────────────┬──────────────────────┐
  │          │ DOM0      │ IE Model   │ DOM2 Level 2         │
  ├──────────┼───────────┼────────────┼──────────────────────┤
  │ Số pha   │ Không     │ 2 pha      │ 3 pha                │
  │ Capturing│ KHÔNG     │ KHÔNG      │ CÓ ✅               │
  │ Bubbling │ Có (mới)  │ CÓ        │ CÓ                   │
  │ API      │ onclick=  │ attachEvent│ addEventListener      │
  │ Multiple │ KHÔNG     │ CÓ        │ CÓ                   │
  │ listeners│           │            │                      │
  └──────────┴───────────┴────────────┴──────────────────────┘
```

---

## 1. Ngăn Event Bubbling

```
NGĂN EVENT BUBBLING:
═══════════════════════════════════════════════════════════════

  ┌──────────────────────────────────────────────────────────┐
  │ STANDARD BROWSERS:                                       │
  │   event.stopPropagation()                                │
  │                                                          │
  │ INTERNET EXPLORER:                                       │
  │   event.cancelBubble = true                              │
  │                                                          │
  │ CROSS-BROWSER:                                           │
  │   function stopBubble(event) {                           │
  │     if (event.stopPropagation) {                         │
  │       event.stopPropagation();                           │
  │     } else {                                             │
  │       event.cancelBubble = true;  // IE                  │
  │     }                                                    │
  │   }                                                      │
  └──────────────────────────────────────────────────────────┘
```

---

## 2. Event Delegation (Ủy thác sự kiện)

> **🎯 Bind event lên PARENT → xử lý events cho TẤT CẢ children**

```
EVENT DELEGATION — NGUYÊN LÝ:
═══════════════════════════════════════════════════════════════

  Lợi dụng EVENT BUBBLING:
  → Events bubble LÊN parent node
  → Parent nhận event → xác định TARGET NODE qua event obj
  → Parent XỬ LÝ events cho NHIỀU child elements

  THAY VÌ:                    DÙNG DELEGATION:
  ┌─────────────────────┐     ┌─────────────────────┐
  │ <ul>                │     │ <ul> ← BIND ở đây  │
  │   <li> ← bind ❌   │     │   <li>              │
  │   <li> ← bind ❌   │     │   <li>              │
  │   <li> ← bind ❌   │     │   <li>              │
  │   ...100 items      │     │   ...100 items      │
  │ </ul>               │     │ </ul>               │
  │ 100 listeners! 🐌   │    │ 1 listener! ⚡       │
  └─────────────────────┘     └─────────────────────┘
```

### 2 Ưu điểm chính

```
ƯU ĐIỂM EVENT DELEGATION:
═══════════════════════════════════════════════════════════════

  ① GIẢM MEMORY:
  ┌──────────────────────────────────────────────────────────┐
  │ Thay vì 100 listeners → CHỈ CẦN 1 listener            │
  │ → Giảm memory consumption đáng kể                      │
  │ → Tăng performance                                      │
  └──────────────────────────────────────────────────────────┘

  ② DYNAMIC EVENT BINDING:
  ┌──────────────────────────────────────────────────────────┐
  │ → Thêm child node MỚI → KHÔNG CẦN bind event lại     │
  │ → Xóa child node → KHÔNG CẦN unbind event             │
  │ → Event bind trên PARENT, KHÔNG PHỤ THUỘC vào         │
  │   sự thêm/xóa children                                 │
  │ → Rất hữu ích cho AJAX dynamic content                 │
  └──────────────────────────────────────────────────────────┘
```

### Code Example

```javascript
// Event delegation: bind lên #list (parent)
document.getElementById("list").addEventListener("click", function (e) {
  var event = e || window.event;
  var target = event.target || event.srcElement;

  // Match target element
  if (target.nodeName.toLocaleLowerCase === "li") {
    console.log("the content is: ", target.innerHTML);
  }
});
```

### Hạn chế & Nhược điểm

```
HẠN CHẾ EVENT DELEGATION:
═══════════════════════════════════════════════════════════════

  ❌ KHÔNG DÙNG ĐƯỢC cho events KHÔNG có bubbling:
    → focus, blur → KHÔNG bubble

  ❌ KHÔNG PHÙ HỢP cho events cần tính toán liên tục:
    → mousemove, mouseout → tốn performance khi
      liên tục tính position

  ⚠️ ẢNH HƯỞNG PERFORMANCE nếu dùng sai:
  ┌──────────────────────────────────────────────────────────┐
  │ Yếu tố ảnh hưởng:                                       │
  │ → Số lần bind delegate trong 1 element                  │
  │ → Số tầng DOM giữa target và delegate element          │
  │                                                          │
  │ BEST PRACTICES:                                          │
  │ ① Chỉ dùng delegation KHI CẦN (AJAX partial refresh)  │
  │ ② GIẢM binding hierarchy (tránh bind trên body)        │
  │ ③ GỘP NHIỀU events vào 1 delegate                      │
  │   → distribute trong callback                           │
  └──────────────────────────────────────────────────────────┘
```

---

## 3. Use Cases cho Event Delegation

```
USE CASE: CLICK TẤT CẢ <a> TAGS TRÊN PAGE:
═══════════════════════════════════════════════════════════════

  VẤN ĐỀ:
  → <a> tags có thể chứa <span>, <img> bên trong
  → Click <span> trong <a> → e.target = <span> (không phải <a>)
  → Event KHÔNG trigger đúng!

  GIẢI PHÁP: Duyệt LÊN TRÊN tìm <a> tag
```

```javascript
// ===== Naive approach (BUG: click vào child = miss) =====
document.addEventListener(
  "click",
  function (e) {
    if (e.target.nodeName == "A") console.log("a");
  },
  false,
);

// ===== Fixed: traverse UP tìm <a> tag =====
document.addEventListener(
  "click",
  function (e) {
    var node = e.target;
    while (node.parentNode.nodeName != "BODY") {
      if (node.nodeName == "A") {
        console.log("a");
        break;
      }
      node = node.parentNode;
    }
  },
  false,
);
```

---

## 4. Synchronous vs Asynchronous

```
SYNCHRONOUS vs ASYNCHRONOUS:
═══════════════════════════════════════════════════════════════

  ① SYNCHRONOUS (Đồng bộ):
  ┌──────────────────────────────────────────────────────────┐
  │ Process gửi request → CẦN chờ kết quả                  │
  │ → Process ĐỨNG YÊN CHỜ cho tới khi có response        │
  │ → Mới tiếp tục thực thi                                │
  │                                                          │
  │ Task A ████████████ → Task B ████████████               │
  │                 ↑ WAIT                                   │
  └──────────────────────────────────────────────────────────┘

  ② ASYNCHRONOUS (Bất đồng bộ):
  ┌──────────────────────────────────────────────────────────┐
  │ Process gửi request → KHÔNG CẦN chờ kết quả            │
  │ → Process TIẾP TỤC thực thi                             │
  │ → Khi kết quả trả về → hệ thống THÔNG BÁO process    │
  │   xử lý                                                 │
  │                                                          │
  │ Task A ████████████████████████████                      │
  │      └─ Request ──────────► Callback                    │
  │         (không chờ)         (khi xong)                   │
  └──────────────────────────────────────────────────────────┘
```

---

## 5. Event Loop (Vòng lặp sự kiện)

> **🎯 JS single-threaded → Event Loop đảm bảo thứ tự thực thi**

```
EVENT LOOP — NGUYÊN LÝ:
═══════════════════════════════════════════════════════════════

  JS chạy trên SINGLE THREAD
  → Execution contexts được push vào EXECUTION STACK
  → Code sync → thực thi theo thứ tự
  → Gặp ASYNC event → JS engine KHÔNG CHỜ
  → TREO event, tiếp tục tasks khác
  → Async xong → callback vào TASK QUEUE
  → Task Queue chia thành: MACRO + MICRO

  THỨ TỰ THỰC THI:
  ┌──────────────────────────────────────────────────────────┐
  │                                                          │
  │  ① Execute SYNCHRONOUS code (đây là 1 macro task)      │
  │       │                                                  │
  │       ▼                                                  │
  │  ② Sync code xong, execution stack TRỐNG               │
  │       │                                                  │
  │       ▼                                                  │
  │  ③ Kiểm tra có ASYNC code cần chạy không?              │
  │       │                                                  │
  │       ▼                                                  │
  │  ④ Execute TẤT CẢ MICRO TASKS                          │
  │       │                                                  │
  │       ▼                                                  │
  │  ⑤ Render page (nếu cần)                                │
  │       │                                                  │
  │       ▼                                                  │
  │  ⑥ Bắt đầu ROUND MỚI → execute MACRO TASK tiếp       │
  │       │                                                  │
  │       └──────── QUAY LẠI ④ ──────────────              │
  │                                                          │
  └──────────────────────────────────────────────────────────┘

  VISUAL:
  ┌──────────┐     ┌───────────┐     ┌──────────┐
  │  Macro   │────►│  ALL      │────►│ Render   │──┐
  │  Task    │     │  Micro    │     │ (if      │  │
  │          │     │  Tasks    │     │  needed) │  │
  └──────────┘     └───────────┘     └──────────┘  │
       ▲                                            │
       └────────────────────────────────────────────┘
```

---

## 6. Macro Tasks vs Micro Tasks

```
MACRO TASKS vs MICRO TASKS:
═══════════════════════════════════════════════════════════════

  MICRO TASKS (ưu tiên CAO hơn):
  ┌──────────────────────────────────────────────────────────┐
  │ → Promise callbacks (.then, .catch, .finally)           │
  │ → process.nextTick (Node.js)                            │
  │ → MutationObserver (theo dõi DOM changes)              │
  └──────────────────────────────────────────────────────────┘

  MACRO TASKS (ưu tiên THẤP hơn):
  ┌──────────────────────────────────────────────────────────┐
  │ → script execution (toàn bộ script tag)                 │
  │ → setTimeout, setInterval                                │
  │ → setImmediate (Node.js)                                 │
  │ → I/O operations                                         │
  │ → UI rendering                                           │
  └──────────────────────────────────────────────────────────┘

  THỨ TỰ: Sync → ALL Micros → 1 Macro → ALL Micros → ...

  VÍ DỤ:
  ┌──────────────────────────────────────────────────────────┐
  │ console.log('1');           // sync                      │
  │ setTimeout(() => {                                       │
  │   console.log('2');         // macro                     │
  │ }, 0);                                                   │
  │ Promise.resolve().then(() => {                           │
  │   console.log('3');         // micro                     │
  │ });                                                      │
  │ console.log('4');           // sync                      │
  │                                                          │
  │ OUTPUT: 1, 4, 3, 2                                       │
  │ → Sync (1, 4) → Micro (3) → Macro (2)                 │
  └──────────────────────────────────────────────────────────┘
```

---

## 7. Execution Stack (Ngăn xếp thực thi)

> **🎯 Stack structure (LIFO) lưu trữ function calls**

```
EXECUTION STACK — NGUYÊN LÝ:
═══════════════════════════════════════════════════════════════

  → Stack structure, LIFO (Last-In, First-Out)
  → Function gọi SAU → pop RA TRƯỚC

  VD: bar() gọi foo() gọi throw Error

  ┌─────────────┐
  │   foo()     │ ← top (last in, first out)
  ├─────────────┤
  │   bar()     │
  ├─────────────┤
  │  (global)   │ ← bottom
  └─────────────┘

  → foo() xong → pop ra
  → bar() xong → pop ra
```

### Error Stack Trace

```javascript
function foo() {
  throw new Error("error");
}
function bar() {
  foo();
}
bar();

// Error stack trace:
// Error: error
//     at foo       ← top of stack
//     at bar       ← called foo
//     at <global>  ← entry point
```

### Stack Overflow

```javascript
// STACK OVERFLOW — đệ quy không điều kiện dừng
function bar() {
  bar(); // gọi chính mình
}
bar();

// → Stack LƯU QUÁ NHIỀU function contexts
// → KHÔNG có release → STACK OVERFLOW!
// → RangeError: Maximum call stack size exceeded
```

```
STACK OVERFLOW VISUAL:
═══════════════════════════════════════════════════════════════

  ┌─────────────┐
  │   bar()     │ ← lần gọi thứ N (OVERFLOW!)
  ├─────────────┤
  │   bar()     │ ← lần gọi thứ N-1
  ├─────────────┤
  │   ...       │ ← hàng ngàn frames
  ├─────────────┤
  │   bar()     │ ← lần gọi thứ 2
  ├─────────────┤
  │   bar()     │ ← lần gọi thứ 1
  ├─────────────┤
  │  (global)   │
  └─────────────┘
  Stack có GIỚI HẠN dung lượng → Overflow!
```

---

## 8. Node.js Event Loop vs Browser

> **🎯 Node.js: 6 phases, khác hoàn toàn browser**

```
NODE.JS EVENT LOOP — 6 PHASES:
═══════════════════════════════════════════════════════════════

  ┌──────────────────────────────────────────────────────────┐
  │                                                          │
  │  ① TIMERS                                                │
  │  → Kiểm tra expired timer callbacks                     │
  │  → setTimeout, setInterval                               │
  │  → Execute TẤT CẢ expired callbacks                     │
  │  → Trigger microtasks → execute ALL microtasks          │
  │       │                                                  │
  │       ▼                                                  │
  │  ② PENDING CALLBACKS                                     │
  │  → I/O callbacks deferred tới next loop iteration       │
  │  → System call related callbacks                        │
  │       │                                                  │
  │       ▼                                                  │
  │  ③ IDLE / PREPARE                                        │
  │  → Internal use only                                     │
  │       │                                                  │
  │       ▼                                                  │
  │  ④ POLL (quan trọng nhất)                                │
  │  → Queue KHÔNG RỖNG:                                     │
  │    → Execute callbacks                                   │
  │    → ⚠️ Mỗi callback xong → execute microtasks NGAY   │
  │      (khác browser: browser chờ hết TẤT CẢ callbacks)  │
  │  → Queue RỖNG:                                           │
  │    → Có timers chưa execute? → Qua CHECK phase         │
  │    → Không có? → Block chờ I/O complete                 │
  │       │                                                  │
  │       ▼                                                  │
  │  ⑤ CHECK                                                 │
  │  → Kiểm tra + execute setImmediate callbacks            │
  │  → Trigger microtasks → execute ALL microtasks          │
  │       │                                                  │
  │       ▼                                                  │
  │  ⑥ CLOSE CALLBACKS                                       │
  │  → Execute close callbacks                               │
  │  → VD: socket.on('close', ...)                           │
  │       │                                                  │
  │       └──────── QUAY LẠI ① ─────────────               │
  │                                                          │
  └──────────────────────────────────────────────────────────┘

  📌 MICROTASKS: clear TRƯỚC KHI vào phase tiếp theo
  📌 process.nextTick: ĐỘC LẬP khỏi Event Loop
     → CÓ QUEUE RIÊNG
     → Mỗi phase xong → clear nextTick queue TRƯỚC
     → rồi mới clear các microtasks khác
```

### setTimeout vs setImmediate

```javascript
// ===== Thứ tự KHÔNG XÁC ĐỊNH =====
setTimeout(() => {
  console.log("setTimeout");
}, 0);
setImmediate(() => {
  console.log("setImmediate");
});

// CÓ THỂ in: setTimeout → setImmediate
// HOẶC:      setImmediate → setTimeout

// LÝ DO:
// → setTimeout(fn, 0) === setTimeout(fn, 1) (source code)
// → Nếu prep time > 1ms → setTimeout chạy trước (Timers phase)
// → Nếu prep time < 1ms → setImmediate chạy trước (Check phase)
```

```javascript
// ===== Thứ tự CỐ ĐỊNH (trong I/O callback) =====
const fs = require("fs");
fs.readFile(__filename, () => {
  setTimeout(() => {
    console.log("timeout");
  }, 0);
  setImmediate(() => {
    console.log("immediate");
  });
});

// LUÔN IN: immediate → timeout
// LÝ DO: Code chạy trong Poll phase
// → Poll xong, queue rỗng
// → Phát hiện setImmediate → nhảy tới Check phase
// → setImmediate LUÔN chạy trước setTimeout
```

### process.nextTick

```javascript
setTimeout(() => {
  console.log("timer1");
  Promise.resolve().then(() => {
    console.log("promise1");
  });
}, 0);

process.nextTick(() => {
  console.log("nextTick");
  process.nextTick(() => {
    console.log("nextTick");
    process.nextTick(() => {
      console.log("nextTick");
      process.nextTick(() => {
        console.log("nextTick");
      });
    });
  });
});

// OUTPUT: nextTick, nextTick, nextTick, nextTick, timer1, promise1
// → nextTick queue clear TOÀN BỘ trước khi vào Timers phase
```

```
BROWSER vs NODE.JS EVENT LOOP:
═══════════════════════════════════════════════════════════════

  ┌──────────────────┬──────────────────────────────────────┐
  │ Browser          │ Node.js                              │
  ├──────────────────┼──────────────────────────────────────┤
  │ 1 macro → ALL    │ 6 PHASES rõ ràng                    │
  │ micros → render  │ Timers → Pending → Idle → Poll     │
  │ → 1 macro → ...  │ → Check → Close → loop             │
  ├──────────────────┼──────────────────────────────────────┤
  │ Micros: sau mỗi │ Micros: sau mỗi PHASE              │
  │ MACRO task       │ + sau mỗi callback (Poll phase)    │
  ├──────────────────┼──────────────────────────────────────┤
  │ Không có nextTick│ process.nextTick: ưu tiên CAO NHẤT │
  │                  │ → clear trước các microtasks khác   │
  ├──────────────────┼──────────────────────────────────────┤
  │ setImmediate:    │ setImmediate: CHECK phase            │
  │ KHÔNG hỗ trợ    │ Đảm bảo thứ tự trong I/O callback  │
  └──────────────────┴──────────────────────────────────────┘
```

---

## 9. Event Triggering Process (3 pha)

> **🎯 Capturing → Target → Bubbling**

```
EVENT TRIGGERING — 3 PHA:
═══════════════════════════════════════════════════════════════

  ① CAPTURING PHASE (bắt sự kiện):
  → Từ WINDOW propagate XUỐNG tới event trigger point
  → Gặp registered CAPTURE event → TRIGGER

  ② TARGET PHASE:
  → Tới event trigger point → execute registered event

  ③ BUBBLING PHASE:
  → Từ trigger point propagate LÊN WINDOW
  → Gặp registered BUBBLING event → TRIGGER

  ┌──────────────────────────────────────────────────────┐
  │                                                      │
  │  window ──► document ──► body ──► target             │
  │  ──────────── Pha 1 (Capturing) ──────────           │
  │                                    │                  │
  │                                 Pha 2 (Target)       │
  │                                    │                  │
  │  window ◄── document ◄── body ◄── target             │
  │  ──────────── Pha 3 (Bubbling) ───────────           │
  │                                                      │
  └──────────────────────────────────────────────────────┘
```

### Ngoại lệ: Target node

```
NGOẠI LỆ ở TARGET NODE:
═══════════════════════════════════════════════════════════════

  ⚠️ Trên TARGET node: events trigger THEO THỨ TỰ REGISTER
  → Không phân biệt capture hay bubble
  → Đăng ký bubble trước → trigger trước!
```

```javascript
// TARGET node: bubble đăng ký trước → chạy trước
node.addEventListener(
  "click",
  (event) => {
    console.log("冒泡"); // ← In TRƯỚC (đăng ký trước)
  },
  false,
);

node.addEventListener(
  "click",
  (event) => {
    console.log("捕获"); // ← In SAU
  },
  true,
);
// Output: 冒泡, 捕获
```

### addEventListener — Tham số thứ 3

```
addEventListener THAM SỐ THỨ 3:
═══════════════════════════════════════════════════════════════

  Có thể là BOOLEAN hoặc OBJECT:

  BOOLEAN (useCapture):
  → false (default): event = BUBBLING
  → true: event = CAPTURING

  OBJECT:
  ┌──────────┬───────────────────────────────────────────┐
  │ capture  │ Giống useCapture                           │
  │ once     │ true → callback CHỈ GỌI 1 LẦN            │
  │          │ Sau đó tự remove listener                  │
  │ passive  │ true → KHÔNG BAO GIỜ gọi preventDefault()│
  └──────────┴───────────────────────────────────────────┘
```

### stopPropagation vs stopImmediatePropagation

```
stopPropagation vs stopImmediatePropagation:
═══════════════════════════════════════════════════════════════

  stopPropagation():
  → Ngăn event PROPAGATE tiếp (capture + bubble)
  → Các listeners KHÁC trên CÙNG element VẪN CHẠY

  stopImmediatePropagation():
  → Ngăn event propagate + NGĂN CẢ listeners khác
    trên CÙNG element
```

```javascript
// stopImmediatePropagation: chặn CẢ listeners khác trên cùng element
node.addEventListener(
  "click",
  (event) => {
    event.stopImmediatePropagation();
    console.log("冒泡"); // ← CHỈ listener này chạy
  },
  false,
);

node.addEventListener(
  "click",
  (event) => {
    console.log("捕获"); // ← KHÔNG CHẠY!
  },
  true,
);
// Output: 冒泡 (chỉ 1 listener)
```

---

## 10. Tóm Tắt & Câu Hỏi Phỏng Vấn

### Quick Reference

```
BROWSER EVENT MECHANISM — QUICK REFERENCE:
═══════════════════════════════════════════════════════════════

  3 EVENT MODELS:
    DOM0: onclick=, không propagation, tất cả browsers
    IE:   2 pha (target + bubbling), attachEvent
    DOM2: 3 pha (capture + target + bubble), addEventListener

  EVENT DELEGATION:
    Bind parent → handle children → giảm memory + dynamic

  EVENT LOOP (Browser):
    Sync → ALL Micros → Render → 1 Macro → ALL Micros → ...

  MICRO: Promise.then, MutationObserver, process.nextTick
  MACRO: setTimeout, setInterval, setImmediate, I/O, UI

  NODE.JS: 6 phases (Timers→Pending→Idle→Poll→Check→Close)
  process.nextTick: queue riêng, clear trước microtasks

  EVENT TRIGGERING: Capture → Target → Bubble
  stopPropagation: ngăn propagation
  stopImmediatePropagation: ngăn propagation + listeners khác
```

### Câu Hỏi Phỏng Vấn Thường Gặp

**1. Event model là gì? Có mấy loại?**

> 3 loại: ① **DOM0**: không propagation, onclick= trực tiếp, tương thích tất cả browsers. ② **IE Model**: 2 pha (target + bubbling), dùng attachEvent. ③ **DOM Level 2**: 3 pha (capturing → target → bubbling), dùng addEventListener, tham số 3 = useCapture (true = capture, false = bubble).

**2. Event Delegation là gì? Ưu nhược điểm?**

> Lợi dụng **event bubbling** → bind event lên PARENT → xử lý events cho tất cả children. **Ưu**: ① Giảm memory (1 listener thay vì N). ② Dynamic binding (thêm/xóa child không cần rebind). **Nhược**: không dùng cho focus/blur (không bubble), mousemove (tốn performance). **Best practices**: dùng khi AJAX refresh, giảm binding hierarchy, gộp events.

**3. Event Loop hoạt động thế nào?**

> JS single-threaded → Event Loop đảm bảo thứ tự. ① Execute sync code (macro task). ② Execution stack trống → check async code. ③ Execute **TẤT CẢ micro tasks**. ④ Render page (nếu cần). ⑤ Execute **1 macro task** tiếp → quay lại ③. Micro tasks LUÔN ưu tiên trước macro tasks.

**4. Macro tasks và Micro tasks gồm gì?**

> **Micro**: Promise.then/.catch/.finally, process.nextTick (Node), MutationObserver. **Macro**: script execution, setTimeout, setInterval, setImmediate (Node), I/O, UI rendering. Thứ tự: Sync → ALL Micros → 1 Macro → ALL Micros → ...

**5. Execution Stack là gì? Stack Overflow?**

> Stack structure (LIFO) lưu function calls. Function cuối được push vào → pop ra trước. **Stack overflow**: recursion không có điều kiện dừng → stack lưu quá nhiều frames → vượt capacity → RangeError.

**6. Node.js Event Loop khác Browser thế nào?**

> Node.js có **6 phases**: Timers → Pending → Idle → Poll → Check → Close. Micro tasks clear **sau mỗi phase** (không phải sau mỗi macro task). **Poll phase**: micro tasks execute sau MỖI callback (không chờ hết tất cả). **process.nextTick**: queue riêng, ưu tiên CAO NHẤT, clear trước micro tasks khác.

**7. setTimeout vs setImmediate trong Node.js?**

> **Top-level**: thứ tự KHÔNG XÁC ĐỊNH (phụ thuộc prep time > hay < 1ms). **Trong I/O callback**: setImmediate LUÔN trước (Poll phase → Check phase). `setTimeout(fn, 0) === setTimeout(fn, 1)` theo source code.

**8. Event Triggering Process?**

> 3 pha: ① **Capturing**: Window → Document → Body → Target (propagate xuống). ② **Target**: execute event tại target. ③ **Bubbling**: Target → Body → Document → Window (propagate lên). **Ngoại lệ**: trên target node, events trigger theo THỨ TỰ ĐĂNG KÝ (không phân biệt capture/bubble).

**9. stopPropagation vs stopImmediatePropagation?**

> **stopPropagation**: chặn event propagate tiếp (cả capture + bubble), nhưng listeners **KHÁC trên cùng element VẪN chạy**. **stopImmediatePropagation**: chặn propagation + chặn **CẢ listeners khác** trên cùng element.

**10. Làm sao ngăn event bubbling cross-browser?**

> Standard: `event.stopPropagation()`. IE: `event.cancelBubble = true`. Cross-browser: check `stopPropagation` tồn tại → dùng, else dùng `cancelBubble`.

---

## Checklist Học Tập

- [ ] Biết 3 Event Models (DOM0, IE, DOM2) và khác biệt
- [ ] Hiểu 3 pha event: Capture → Target → Bubble
- [ ] Biết ngăn bubbling (stopPropagation, cancelBubble)
- [ ] Hiểu Event Delegation: nguyên lý + ưu nhược điểm
- [ ] Biết Event Delegation use case (traverse up tìm target)
- [ ] Hiểu Event Loop browser: Sync → Micros → Render → Macro
- [ ] Phân biệt Macro tasks vs Micro tasks
- [ ] Hiểu Execution Stack (LIFO) + Stack Overflow
- [ ] Hiểu Node.js Event Loop 6 phases
- [ ] Biết process.nextTick (queue riêng, ưu tiên cao nhất)
- [ ] Biết setTimeout vs setImmediate thứ tự trong Node.js
- [ ] Phân biệt stopPropagation vs stopImmediatePropagation

---

_Cập nhật lần cuối: Tháng 2, 2026_
