# Observer Pattern — Deep Dive

> 📅 2026-02-14 · ⏱ 22 phút đọc
>
> Observer / Observable Concept,
> subscribe, unsubscribe, notify,
> EventEmitter (Node.js), Custom Events (DOM),
> RxJS Observables, React State as Observer,
> Pub/Sub Pattern, Memory Leaks,
> Real-World Applications & Tradeoffs
> Độ khó: ⭐️⭐️⭐️⭐️ | Design Pattern

---

## Mục Lục

| #   | Phần                                 |
| --- | ------------------------------------ |
| 1   | Observer Pattern là gì?              |
| 2   | Implementation cơ bản                |
| 3   | Ví dụ: Logger + Toast Notification   |
| 4   | Observer với React                   |
| 5   | Event Types — Multi-channel Observer |
| 6   | EventEmitter (Node.js)               |
| 7   | Custom Events (DOM API)              |
| 8   | Observer vs Pub/Sub                  |
| 9   | RxJS — Reactive Observables          |
| 10  | once, off, removeAll                 |
| 11  | Memory Leaks — Vấn đề thường gặp     |
| 12  | Observer trong React và Frameworks   |
| 13  | Real-World Applications              |
| 14  | Tradeoffs — Ưu & Nhược điểm          |
| 15  | Tóm tắt                              |

---

## §1. Observer Pattern là gì?

```
OBSERVER PATTERN — KHÁI NIỆM:
═══════════════════════════════════════════════════════════════

  ĐỊNH NGHĨA:
  → OBSERVABLE (Subject) = đối tượng PHÁT sự kiện!
  → OBSERVERS = đối tượng LẮNG NGHE sự kiện!
  → Khi event xảy ra → Observable THÔNG BÁO tất cả Observers!
  → MỐI QUAN HỆ: 1 → NHIỀU (one-to-many!)

  VÍ DỤ THỰC TẾ:
  → YouTube Channel (Observable!) → Subscribers (Observers!)
  → Channel đăng video MỚI → TẤT CẢ subscribers nhận THÔNG BÁO!
  → Subscribe: nhấn nút ĐĂNG KÝ → vào danh sách!
  → Unsubscribe: nhấn HỦY → ra khỏi danh sách!
  → Notify: video mới → thông báo → TẤT CẢ subscribers!

  3 THÀNH PHẦN CHÍNH:
  ┌──────────────────────────────────────────────────────────┐
  │ ① observers[]    → Danh sách observers ĐANG lắng nghe! │
  │ ② subscribe(fn)  → THÊM observer vào danh sách!        │
  │ ③ unsubscribe(fn)→ XÓA observer khỏi danh sách!        │
  │ ④ notify(data)   → THÔNG BÁO tất cả observers!         │
  └──────────────────────────────────────────────────────────┘
```

```
LUỒNG HOẠT ĐỘNG:
═══════════════════════════════════════════════════════════════

                    subscribe(logger)
  logger ──────────────────────────────┐
                                       ▼
                              ┌─────────────────┐
  toastify ───────────────────│   OBSERVABLE     │
                subscribe     │                  │
                              │  observers: [    │
  analytics ──────────────────│    logger,       │
                subscribe     │    toastify,     │
                              │    analytics     │
                              │  ]               │
                              └────────┬─────────┘
                                       │
                                 notify(data)
                                       │
                        ┌──────────────┼──────────────┐
                        ▼              ▼              ▼
                    logger(data)  toastify(data) analytics(data)
                    "Log nó!"     "Toast nó!"    "Track nó!"
```

---

## §2. Implementation cơ bản

```javascript
// ═══ OBSERVABLE CLASS — CƠ BẢN ═══

class Observable {
  constructor() {
    this.observers = [];
  }

  // THÊM observer:
  subscribe(fn) {
    this.observers.push(fn);
  }

  // XÓA observer:
  unsubscribe(fn) {
    this.observers = this.observers.filter((observer) => observer !== fn);
  }

  // THÔNG BÁO tất cả:
  notify(data) {
    this.observers.forEach((observer) => observer(data));
  }
}

export default new Observable();
```

```javascript
// ═══ SỬ DỤNG ═══

const observable = new Observable();

// Tạo observers (callback functions!):
function logger(data) {
  console.log(`[LOG] ${Date.now()}: ${data}`);
}

function alerter(data) {
  console.log(`[ALERT] ⚠️ ${data}`);
}

function counter(data) {
  counter.count = (counter.count || 0) + 1;
  console.log(`[COUNT] Event #${counter.count}: ${data}`);
}

// SUBSCRIBE:
observable.subscribe(logger);
observable.subscribe(alerter);
observable.subscribe(counter);

// NOTIFY:
observable.notify("User clicked button!");
// → [LOG] 1707900000000: User clicked button!
// → [ALERT] ⚠️ User clicked button!
// → [COUNT] Event #1: User clicked button!

observable.notify("User toggled switch!");
// → [LOG] 1707900001000: User toggled switch!
// → [ALERT] ⚠️ User toggled switch!
// → [COUNT] Event #2: User toggled switch!

// UNSUBSCRIBE:
observable.unsubscribe(alerter);

observable.notify("User submitted form!");
// → [LOG] 1707900002000: User submitted form!
// → [COUNT] Event #3: User submitted form!
// → alerter KHÔNG được gọi! Đã unsubscribe!
```

```javascript
// ═══ TDD — TEST OBSERVER ═══

// Test subscribe:
const observer = new Observable();
const fn = () => {};
observer.subscribe(fn);
console.assert(
  observer.observers.length === 1,
  "subscribe should add observer",
);

// Test unsubscribe:
observer.unsubscribe(fn);
console.assert(
  observer.observers.length === 0,
  "unsubscribe should remove observer",
);

// Test notify:
let called = false;
const fn2 = (data) => {
  called = data;
};
observer.subscribe(fn2);
observer.broadcast(true); // Hoặc notify(true)!
console.assert(called === true, "notify should call observer with data");
```

---

## §3. Ví dụ: Logger + Toast Notification

```javascript
// ═══ REACT APP VỚI OBSERVER ═══

// Observable.js
class Observable {
  constructor() {
    this.observers = [];
  }
  subscribe(fn) {
    this.observers.push(fn);
    // Return unsubscribe function (cleanup!):
    return () => {
      this.observers = this.observers.filter((obs) => obs !== fn);
    };
  }
  notify(data) {
    this.observers.forEach((fn) => fn(data));
  }
}

export default new Observable(); // SINGLETON instance!
```

```javascript
// ═══ App.jsx ═══

import React from "react";
import { Button, Switch, FormControlLabel } from "@material-ui/core";
import { ToastContainer, toast } from "react-toastify";
import observable from "./Observable";

// Observer 1: Logger!
function logger(data) {
  console.log(`${Date.now()} ${data}`);
}

// Observer 2: Toast notification!
function toastify(data) {
  toast(data, {
    position: toast.POSITION.BOTTOM_RIGHT,
    closeButton: false,
    autoClose: 2000,
  });
}

// ĐĂNG KÝ observers:
observable.subscribe(logger);
observable.subscribe(toastify);

export default function App() {
  // Khi click → notify TẤT CẢ observers:
  function handleClick() {
    observable.notify("User clicked button!");
  }

  // Khi toggle → notify TẤT CẢ observers:
  function handleToggle() {
    observable.notify("User toggled switch!");
  }

  return (
    <div className="App">
      <Button variant="contained" onClick={handleClick}>
        Click me!
      </Button>
      <FormControlLabel
        control={<Switch onChange={handleToggle} />}
        label="Toggle me!"
      />
      <ToastContainer />
    </div>
  );
}
```

```
LUỒNG HOẠT ĐỘNG:
═══════════════════════════════════════════════════════════════

  User click "Click me!"
  → handleClick()
  → observable.notify("User clicked button!")
  → forEach observer:
    → logger("User clicked button!")
       → console.log("1707900000 User clicked button!")
    → toastify("User clicked button!")
       → toast("User clicked button!")
       → Toast xuất hiện góc phải dưới!

  → TẤT CẢ observers xử lý THEO CÁCH RIÊNG của mình!
  → Observable KHÔNG BIẾT và KHÔNG CẦN BIẾT!
  → → Đó là LOOSE COUPLING!
```

---

## §4. Observer với React

```javascript
// ═══ CUSTOM HOOK: useObservable ═══

import { useState, useEffect, useRef } from "react";

class Observable {
  constructor() {
    this.observers = new Set();
  }

  subscribe(fn) {
    this.observers.add(fn);
    return () => this.observers.delete(fn);
  }

  notify(data) {
    this.observers.forEach((fn) => fn(data));
  }

  get size() {
    return this.observers.size;
  }
}

// Custom hook:
function useObservable(observable) {
  const [data, setData] = useState(null);

  useEffect(() => {
    // Subscribe khi mount:
    const unsubscribe = observable.subscribe(setData);

    // Unsubscribe khi unmount (CLEANUP!):
    return unsubscribe;
  }, [observable]);

  return data;
}

// SỬ DỤNG:
const clickObservable = new Observable();

function Dashboard() {
  const lastClick = useObservable(clickObservable);

  return (
    <div>
      <p>Last event: {lastClick || "None"}</p>
      <button onClick={() => clickObservable.notify("Button clicked!")}>
        Click me
      </button>
    </div>
  );
}
```

```javascript
// ═══ OBSERVER STORE — GLOBAL STATE ═══

class Store {
  constructor(initialState = {}) {
    this.state = initialState;
    this.observers = new Set();
  }

  getState() {
    return this.state;
  }

  setState(updater) {
    const prevState = this.state;

    // Updater có thể là object hoặc function:
    this.state =
      typeof updater === "function"
        ? { ...this.state, ...updater(this.state) }
        : { ...this.state, ...updater };

    // CHỈ notify nếu state THAY ĐỔI:
    if (this.state !== prevState) {
      this.notify();
    }
  }

  subscribe(fn) {
    this.observers.add(fn);
    return () => this.observers.delete(fn);
  }

  notify() {
    this.observers.forEach((fn) => fn(this.state));
  }
}

// Tạo store:
const appStore = new Store({ count: 0, user: null });

// Hook sử dụng store:
function useStore(store, selector = (s) => s) {
  const [state, setState] = useState(selector(store.getState()));

  useEffect(() => {
    return store.subscribe((newState) => {
      const selected = selector(newState);
      setState(selected);
    });
  }, [store, selector]);

  return state;
}

// Components:
function CounterDisplay() {
  const count = useStore(appStore, (s) => s.count);
  return <p>Count: {count}</p>;
}

function CounterButton() {
  return (
    <button
      onClick={() => {
        appStore.setState((s) => ({ count: s.count + 1 }));
      }}
    >
      Increment
    </button>
  );
}
```

```
⚠️ React BUILT-IN Observer Patterns:
═══════════════════════════════════════════════════════════════

  React ĐÃ CÓ observer built-in:
  → useState → re-render khi state thay đổi!
  → useContext → re-render khi context thay đổi!
  → useSyncExternalStore → subscribe to external store!
  → Redux → subscribe/dispatch = Observer pattern!

  KHI NÀO CẦN custom Observable trong React?
  → Cross-component communication KHÔNG qua props!
  → Event bus cho unrelated components!
  → Integration với thư viện NGOẠI VI!
  → Analytics / logging events!
```

---

## §5. Event Types — Multi-channel Observer

```javascript
// ═══ EVENT EMITTER — NHIỀU LOẠI EVENT ═══

class EventEmitter {
  constructor() {
    this.events = {}; // { eventName: [fn1, fn2, ...] }
  }

  // SUBSCRIBE tới event CỤ THỂ:
  on(event, fn) {
    if (!this.events[event]) {
      this.events[event] = [];
    }
    this.events[event].push(fn);
    return this; // Chaining!
  }

  // UNSUBSCRIBE:
  off(event, fn) {
    if (!this.events[event]) return this;
    this.events[event] = this.events[event].filter((f) => f !== fn);
    return this;
  }

  // EMIT event:
  emit(event, ...args) {
    if (!this.events[event]) return this;
    this.events[event].forEach((fn) => fn(...args));
    return this;
  }

  // ONCE — chỉ gọi 1 LẦN rồi tự xóa:
  once(event, fn) {
    const wrapper = (...args) => {
      fn(...args);
      this.off(event, wrapper); // Tự XÓA!
    };
    return this.on(event, wrapper);
  }

  // XÓA TẤT CẢ listeners:
  removeAllListeners(event) {
    if (event) {
      delete this.events[event];
    } else {
      this.events = {};
    }
    return this;
  }

  // ĐẾM listeners:
  listenerCount(event) {
    return this.events[event] ? this.events[event].length : 0;
  }
}
```

```javascript
// ═══ SỬ DỤNG EVENT EMITTER ═══

const emitter = new EventEmitter();

// SUBSCRIBE tới events khác nhau:
emitter.on("user:login", (user) => {
  console.log(`Welcome back, ${user.name}!`);
});

emitter.on("user:login", (user) => {
  // Analytics tracking!
  console.log(`[Analytics] Login: ${user.email}`);
});

emitter.on("user:logout", (user) => {
  console.log(`Goodbye, ${user.name}!`);
});

emitter.on("data:fetch", (url) => {
  console.log(`Fetching: ${url}`);
});

// ONCE — chỉ 1 lần:
emitter.once("app:ready", () => {
  console.log("App initialized!");
});

// EMIT events:
emitter.emit("user:login", { name: "John", email: "john@example.com" });
// → "Welcome back, John!"
// → "[Analytics] Login: john@example.com"

emitter.emit("user:logout", { name: "John" });
// → "Goodbye, John!"

emitter.emit("app:ready");
// → "App initialized!"

emitter.emit("app:ready");
// → KHÔNG CÒN! (once đã tự xóa!)

console.log(emitter.listenerCount("user:login")); // 2
```

---

## §6. EventEmitter (Node.js)

```javascript
// ═══ NODE.JS BUILT-IN EventEmitter ═══

const EventEmitter = require("events");

class MyServer extends EventEmitter {
  constructor() {
    super();
  }

  start(port) {
    // Simulate server start:
    console.log(`Server starting on port ${port}...`);
    this.emit("start", port);

    // Simulate request:
    setTimeout(() => {
      this.emit("request", {
        method: "GET",
        url: "/users",
        timestamp: Date.now(),
      });
    }, 100);
  }

  stop() {
    console.log("Server stopping...");
    this.emit("stop");
  }
}

const server = new MyServer();

// SUBSCRIBE:
server.on("start", (port) => {
  console.log(`✅ Server started on port ${port}`);
});

server.on("request", (req) => {
  console.log(`📥 ${req.method} ${req.url}`);
});

server.on("stop", () => {
  console.log("🛑 Server stopped");
});

// ERROR handling:
server.on("error", (err) => {
  console.error("💥 Error:", err.message);
});

server.start(3000);
// → "Server starting on port 3000..."
// → "✅ Server started on port 3000"
// → (100ms later) "📥 GET /users"
```

```
NODE.JS EVENT-DRIVEN ARCHITECTURE:
═══════════════════════════════════════════════════════════════

  Node.js = EVENT-DRIVEN!
  → TOÀN BỘ kiến trúc dựa trên Observer Pattern!
  → HTTP Server: on('request'), on('error')!
  → Streams: on('data'), on('end'), on('error')!
  → Process: on('exit'), on('uncaughtException')!
  → File System: fs.watch → on('change')!

  ┌──────────────────────────────────────────────────────────┐
  │ const http = require('http');                            │
  │                                                          │
  │ const server = http.createServer();                      │
  │                                                          │
  │ server.on('request', (req, res) => { ... });            │
  │ server.on('error', (err) => { ... });                   │
  │ server.on('close', () => { ... });                      │
  │                                                          │
  │ server.listen(3000);                                     │
  └──────────────────────────────────────────────────────────┘

  → createServer() TRẢ VỀ EventEmitter!
  → .on() = subscribe!
  → HTTP request = emit('request')!
  → OBSERVER PATTERN EVERYWHERE!
```

---

## §7. Custom Events (DOM API)

```javascript
// ═══ DOM CustomEvent — BROWSER OBSERVER! ═══

// CÁCH 1: addEventListener (OBSERVER PATTERN!)
const btn = document.getElementById("myBtn");

// Subscribe:
btn.addEventListener("click", (e) => {
  console.log("Clicked!", e.target);
});

// → addEventListener = subscribe!
// → click event = notify!
// → callback = observer!

// CÁCH 2: CUSTOM EVENTS — Tạo event riêng!
const customEvent = new CustomEvent("user:action", {
  detail: {
    action: "purchase",
    amount: 99.99,
    timestamp: Date.now(),
  },
  bubbles: true, // Event đi LÊN DOM tree!
  cancelable: true, // Có thể preventDefault!
});

// Subscribe ở bất kỳ đâu:
document.addEventListener("user:action", (e) => {
  console.log("Action:", e.detail.action);
  console.log("Amount:", e.detail.amount);
});

// Dispatch (= notify!):
document.dispatchEvent(customEvent);
// → "Action: purchase"
// → "Amount: 99.99"
```

```javascript
// ═══ EVENT BUS — GLOBAL OBSERVER VỚI DOM ═══

class EventBus {
  constructor() {
    this.bus = document.createElement("div");
  }

  on(event, callback) {
    this.bus.addEventListener(event, (e) => callback(e.detail));
  }

  off(event, callback) {
    this.bus.removeEventListener(event, callback);
  }

  emit(event, data) {
    this.bus.dispatchEvent(new CustomEvent(event, { detail: data }));
  }
}

const bus = new EventBus();

bus.on("notification", (data) => {
  console.log("New notification:", data.message);
});

bus.emit("notification", { message: "Hello World!", type: "info" });
// → "New notification: Hello World!"
```

---

## §8. Observer vs Pub/Sub

```
SO SÁNH OBSERVER vs PUB/SUB:
═══════════════════════════════════════════════════════════════

  OBSERVER PATTERN:
  ┌──────────┐          ┌──────────┐
  │ Observer1 │◄─────── │OBSERVABLE│
  ├──────────┤ notify  │          │
  │ Observer2 │◄─────── │ observers│
  ├──────────┤          │   = []   │
  │ Observer3 │◄─────── │          │
  └──────────┘          └──────────┘
  → Observable BIẾT observers!
  → TRỰC TIẾP gọi observer callbacks!

  PUB/SUB PATTERN:
  ┌───────────┐    ┌──────────────┐    ┌────────────┐
  │ Publisher  │───▶│  MESSAGE     │───▶│ Subscriber1│
  │           │    │  BROKER      │───▶│ Subscriber2│
  └───────────┘    │  (Channel)   │───▶│ Subscriber3│
                   └──────────────┘    └────────────┘
  → Publisher KHÔNG BIẾT subscribers!
  → Message Broker LÀ TRUNG GIAN!
  → LOOSE COUPLING hơn!
```

```
CHI TIẾT KHÁC BIỆT:
═══════════════════════════════════════════════════════════════

  ┌────────────────────┬────────────────┬──────────────────┐
  │                    │ Observer       │ Pub/Sub          │
  ├────────────────────┼────────────────┼──────────────────┤
  │ Coupling           │ Loose          │ LOOSER!          │
  │ Subject biết       │ ✅ Biết        │ ❌ Không biết!   │
  │   observers?       │   observers!   │   có ai lắng nghe│
  │ Trung gian?        │ ❌ Trực tiếp  │ ✅ Message broker│
  │ Synchronous?       │ ✅ Thường sync│ ⚠️ Có thể async! │
  │ Event filtering?   │ ❌ Tất cả     │ ✅ Theo topic!    │
  │                    │   nhận hết!    │                   │
  │ Ví dụ              │ addEventListener│ Redis Pub/Sub   │
  │                    │ RxJS Observable│ Kafka             │
  │                    │ MobX           │ AWS SNS/SQS      │
  └────────────────────┴────────────────┴──────────────────┘
```

```javascript
// ═══ PUB/SUB IMPLEMENTATION ═══

class PubSub {
  constructor() {
    this.topics = {}; // { topic: [subscriber1, subscriber2] }
  }

  // PUBLISH tới topic:
  publish(topic, data) {
    if (!this.topics[topic]) return;
    this.topics[topic].forEach((fn) => fn(data));
  }

  // SUBSCRIBE tới topic:
  subscribe(topic, fn) {
    if (!this.topics[topic]) {
      this.topics[topic] = [];
    }
    this.topics[topic].push(fn);

    // Return unsubscribe:
    return () => {
      this.topics[topic] = this.topics[topic].filter(
        (subscriber) => subscriber !== fn,
      );
    };
  }
}

const pubsub = new PubSub();

// Subscriber KHÔNG biết Publisher:
const unsub = pubsub.subscribe("news", (article) => {
  console.log(`News: ${article.title}`);
});

// Publisher KHÔNG biết Subscriber:
pubsub.publish("news", { title: "Breaking: Observer Pattern!" });
// → "News: Breaking: Observer Pattern!"

unsub(); // Hủy đăng ký!
```

---

## §9. RxJS — Reactive Observables

```javascript
// ═══ RxJS — OBSERVABLE PATTERN NÂNG CAO ═══

import { fromEvent, merge } from "rxjs";
import {
  map,
  filter,
  debounceTime,
  distinctUntilChanged,
} from "rxjs/operators";

// DOM events → Observable:
const clicks$ = fromEvent(document, "click");
const mousemoves$ = fromEvent(document, "mousemove");

// Subscribe:
clicks$.subscribe((event) => {
  console.log(`Clicked at (${event.clientX}, ${event.clientY})`);
});

// OPERATORS — Biến đổi data stream:
const searchInput = document.getElementById("search");

const search$ = fromEvent(searchInput, "input").pipe(
  map((e) => e.target.value), // Lấy value!
  filter((text) => text.length >= 3), // Ít nhất 3 ký tự!
  debounceTime(300), // Đợi 300ms không gõ!
  distinctUntilChanged(), // Khác giá trị trước!
);

search$.subscribe(async (query) => {
  console.log(`Searching for: ${query}`);
  const results = await fetch(`/api/search?q=${query}`);
  // render results...
});
```

```javascript
// ═══ RxJS — DRAG DETECTION ═══

import { fromEvent, merge } from "rxjs";
import { sample, mapTo } from "rxjs/operators";

// Detect: user đang DRAG hay chỉ CLICK?
merge(
  fromEvent(document, "mousedown").pipe(mapTo(false)),
  fromEvent(document, "mousemove").pipe(mapTo(true)),
)
  .pipe(sample(fromEvent(document, "mouseup")))
  .subscribe((isDragging) => {
    console.log("Were you dragging?", isDragging);
  });

// mousedown → false
// mousemove → true
// mouseup → sample (lấy giá trị cuối!)
// → Nếu có mousemove → isDragging = true!
// → Nếu không → isDragging = false (chỉ click!)
```

```
RxJS — TẠI SAO MẠNH:
═══════════════════════════════════════════════════════════════

  RxJS = ReactiveX + JavaScript!
  → kết hợp OBSERVER + ITERATOR + FUNCTIONAL programming!

  OBSERVER PATTERN CƠ BẢN:
  → subscribe/notify → XONG!
  → Không có operators!
  → Không transform data!

  RxJS ADVANCED:
  → Observable = DATA STREAM (chuỗi event theo thời gian!)
  → OPERATORS: map, filter, debounce, merge, switchMap,...!
  → COMPOSITION: pipe() kết hợp nhiều operators!
  → LAZY: Observable KHÔNG chạy cho đến khi subscribe!
  → CANCELLABLE: unsubscribe() dừng ngay!
  → ERROR HANDLING: catchError, retry!

  ┌─────────────┬────────────────────────────────────────┐
  │ Promise      │ Observable (RxJS)                     │
  ├─────────────┼────────────────────────────────────────┤
  │ 1 giá trị    │ NHIỀU giá trị theo thời gian!         │
  │ Eager        │ LAZY (chạy khi subscribe!)            │
  │ Không cancel │ CANCEL được (unsubscribe!)            │
  │ Không retry  │ retry(), retryWhen()                  │
  │ .then()      │ pipe(operators...)                    │
  └─────────────┴────────────────────────────────────────┘
```

---

## §10. once, off, removeAll

```javascript
// ═══ PATTERN MỞ RỘNG ═══

class Observable {
  constructor() {
    this.events = new Map();
  }

  // ON — subscribe (có thể nhiều events!):
  on(event, fn) {
    if (!this.events.has(event)) {
      this.events.set(event, new Set());
    }
    this.events.get(event).add(fn);
    return this;
  }

  // OFF — unsubscribe:
  off(event, fn) {
    if (fn) {
      this.events.get(event)?.delete(fn);
    } else {
      // Xóa TẤT CẢ listeners của event:
      this.events.delete(event);
    }
    return this;
  }

  // ONCE — subscribe 1 LẦN DUY NHẤT:
  once(event, fn) {
    const wrapper = (...args) => {
      fn.apply(this, args);
      this.off(event, wrapper); // TỰ XÓA sau khi gọi!
    };
    wrapper._original = fn; // Để off() có thể match!
    return this.on(event, wrapper);
  }

  // EMIT — notify:
  emit(event, ...args) {
    if (!this.events.has(event)) return this;
    // Clone Set để tránh modification during iteration:
    [...this.events.get(event)].forEach((fn) => fn(...args));
    return this;
  }

  // REMOVE ALL:
  removeAllListeners() {
    this.events.clear();
    return this;
  }

  // LISTENER COUNT:
  listenerCount(event) {
    return this.events.get(event)?.size || 0;
  }

  // EVENT NAMES:
  eventNames() {
    return [...this.events.keys()];
  }
}
```

```
once() — USE CASES:
═══════════════════════════════════════════════════════════════

  ① APP INITIALIZATION:
  emitter.once('app:ready', () => {
      // Chạy 1 LẦN khi app sẵn sàng!
      initializePlugins();
  });

  ② FIRST USER INTERACTION:
  emitter.once('user:firstClick', () => {
      // Track first interaction!
      analytics.track('first_click');
  });

  ③ ONE-TIME DATA FETCH:
  emitter.once('data:loaded', (data) => {
      // Process data 1 lần!
      renderDashboard(data);
  });

  ④ CONNECTION ESTABLISHED:
  socket.once('connect', () => {
      console.log('Connected!');
  });
```

---

## §11. Memory Leaks — Vấn đề thường gặp

```javascript
// ═══ ❌ MEMORY LEAK — QUÊN UNSUBSCRIBE ═══

class ChatRoom {
  constructor() {
    this.messageObservable = new Observable();
  }
}

// Component React:
function ChatMessage({ room }) {
  // ❌ SAI: Subscribe mỗi lần render!
  // KHÔNG BAO GIỜ unsubscribe!
  room.messageObservable.subscribe((msg) => {
    console.log("New message:", msg);
  });

  return <div>Chat</div>;
}
// → Mount 10 lần → 10 subscribers!
// → MEMORY LEAK! Observers KHÔNG BAO GIỜ được xóa!
```

```javascript
// ═══ ✅ FIX — CLEANUP TRONG useEffect ═══

function ChatMessage({ room }) {
  useEffect(() => {
    const handler = (msg) => {
      console.log("New message:", msg);
    };

    // Subscribe:
    const unsubscribe = room.messageObservable.subscribe(handler);

    // CLEANUP khi unmount hoặc room thay đổi:
    return () => {
      unsubscribe();
    };
  }, [room]); // Dependency!

  return <div>Chat</div>;
}
```

```javascript
// ═══ ✅ FIX — WEAKREF OBSERVERS ═══

class WeakObservable {
  constructor() {
    this.observers = new Set();
  }

  subscribe(fn) {
    const ref = new WeakRef(fn);
    this.observers.add(ref);

    return () => this.observers.delete(ref);
  }

  notify(data) {
    for (const ref of this.observers) {
      const fn = ref.deref();
      if (fn) {
        fn(data);
      } else {
        // Observer đã bị GC! Xóa WeakRef:
        this.observers.delete(ref);
      }
    }
  }
}
```

```
MEMORY LEAK CHECKLIST:
═══════════════════════════════════════════════════════════════

  ① LUÔN unsubscribe trong useEffect cleanup!
  ② LUÔN removeEventListener khi component unmount!
  ③ TRÁNH anonymous functions nếu cần unsubscribe:
     → Phải GIỮ reference để truyền vào off()!
  ④ Dùng once() cho events chỉ cần 1 lần!
  ⑤ removeAllListeners() khi destroy object!
  ⑥ Cân nhắc WeakRef cho long-lived observables!
  ⑦ Monitor: Chrome DevTools → Memory → Heap Snapshot!

  COMMON MISTAKES:
  ❌ observable.subscribe(() => { ... }); ← anonymous!
     → KHÔNG THỂ unsubscribe! (không có reference!)

  ✅ const handler = () => { ... };
     observable.subscribe(handler);
     observable.unsubscribe(handler); ← CÓ reference!
```

---

## §12. Observer trong React và Frameworks

```javascript
// ═══ useSyncExternalStore — REACT 18 BUILT-IN! ═══

import { useSyncExternalStore } from "react";

class ExternalStore {
  constructor(initialValue) {
    this.value = initialValue;
    this.listeners = new Set();
  }

  getValue() {
    return this.value;
  }

  setValue(newValue) {
    this.value = newValue;
    // NOTIFY tất cả React components:
    this.listeners.forEach((fn) => fn());
  }

  subscribe(listener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }
}

const counterStore = new ExternalStore(0);

function Counter() {
  // React 18: CHÍNH THỨC subscribe to external store!
  const count = useSyncExternalStore(
    // subscribe:
    (callback) => counterStore.subscribe(callback),
    // getSnapshot:
    () => counterStore.getValue(),
  );

  return (
    <div>
      <p>Count: {count}</p>
      <button onClick={() => counterStore.setValue(count + 1)}>+1</button>
    </div>
  );
}
```

```
OBSERVER PATTERN TRONG FRAMEWORKS:
═══════════════════════════════════════════════════════════════

  ┌─────────────┬───────────────────────────────────────────┐
  │ Framework   │ Observer Implementation                   │
  ├─────────────┼───────────────────────────────────────────┤
  │ React       │ useState → re-render!                    │
  │             │ useContext → Provider/Consumer pattern!   │
  │             │ useSyncExternalStore → external stores!   │
  │             │ Redux → store.subscribe()!               │
  ├─────────────┼───────────────────────────────────────────┤
  │ Vue         │ ref/reactive → Proxy-based watchers!     │
  │             │ watch/watchEffect → explicit observers!   │
  │             │ $emit/$on → component events!            │
  ├─────────────┼───────────────────────────────────────────┤
  │ Angular     │ RxJS Observables → CORE!                 │
  │             │ @Output() EventEmitter!                   │
  │             │ Async Pipe → auto subscribe/unsubscribe! │
  ├─────────────┼───────────────────────────────────────────┤
  │ MobX        │ observable → autorun/reaction!           │
  │             │ @observer decorator!                      │
  │             │ Proxy-based change detection!             │
  ├─────────────┼───────────────────────────────────────────┤
  │ Svelte      │ $: reactive declarations!                │
  │             │ Stores → subscribe pattern!              │
  └─────────────┴───────────────────────────────────────────┘
```

```javascript
// ═══ REDUX — OBSERVER PATTERN! ═══

// Redux store = OBSERVABLE!
function createStore(reducer, initialState) {
  let state = initialState;
  const listeners = [];

  return {
    getState() {
      return state;
    },
    dispatch(action) {
      state = reducer(state, action);
      // NOTIFY tất cả subscribers:
      listeners.forEach((fn) => fn());
    },
    subscribe(fn) {
      listeners.push(fn);
      // Return UNSUBSCRIBE:
      return () => {
        const index = listeners.indexOf(fn);
        if (index > -1) listeners.splice(index, 1);
      };
    },
  };
}

// → dispatch = CẬP NHẬT state!
// → subscribe = ĐĂNG KÝ listener!
// → Khi dispatch → notify TẤT CẢ listeners!
// → React-Redux connect() / useSelector() = TỰ subscribe!
```

---

## §13. Real-World Applications

```javascript
// ═══ WORD COUNT — OBSERVER PATTERN ═══

class EventObserver {
  constructor() {
    this.observers = [];
  }
  subscribe(fn) {
    this.observers.push(fn);
  }
  unsubscribe(fn) {
    this.observers = this.observers.filter((o) => o !== fn);
  }
  broadcast(data) {
    this.observers.forEach((fn) => fn(data));
  }
}

function getWordCount(text) {
  return text ? text.trim().split(/\s+/).length : 0;
}

// Wire up:
const blogObserver = new EventObserver();

// Observer 1: Word count display!
blogObserver.subscribe((text) => {
  const countEl = document.getElementById("blogWordCount");
  countEl.textContent = getWordCount(text);
});

// Observer 2: Character count!
blogObserver.subscribe((text) => {
  const charEl = document.getElementById("charCount");
  charEl.textContent = text.length;
});

// Observer 3: Preview!
blogObserver.subscribe((text) => {
  const previewEl = document.getElementById("preview");
  previewEl.innerHTML = text.replace(/\n/g, "<br>");
});

// EMIT on keyup:
const blogPost = document.getElementById("blogPost");
blogPost.addEventListener("keyup", () => {
  blogObserver.broadcast(blogPost.value);
});

// → Mỗi keystroke → broadcast → 3 observers CẬP NHẬT!
// → Word count, char count, preview → TẤT CẢ sync!
```

```javascript
// ═══ FORM VALIDATION — OBSERVER ═══

class FormValidator {
  constructor() {
    this.rules = new Map(); // field → [validator1, validator2]
    this.errors = new Map(); // field → [error1, error2]
    this.onError = new EventEmitter();
    this.onChange = new EventEmitter();
  }

  addRule(field, validator, message) {
    if (!this.rules.has(field)) this.rules.set(field, []);
    this.rules.get(field).push({ validator, message });
  }

  validate(field, value) {
    const rules = this.rules.get(field) || [];
    const errors = [];

    for (const rule of rules) {
      if (!rule.validator(value)) {
        errors.push(rule.message);
      }
    }

    this.errors.set(field, errors);

    // NOTIFY observers:
    if (errors.length > 0) {
      this.onError.emit(field, errors);
    }
    this.onChange.emit(field, { value, errors, isValid: errors.length === 0 });

    return errors.length === 0;
  }
}

// SỬ DỤNG:
const validator = new FormValidator();

// Rules:
validator.addRule("email", (v) => v.includes("@"), "Email phải có @!");
validator.addRule("email", (v) => v.length > 5, "Email quá ngắn!");
validator.addRule(
  "password",
  (v) => v.length >= 8,
  "Mật khẩu ít nhất 8 ký tự!",
);
validator.addRule("password", (v) => /[A-Z]/.test(v), "Cần ít nhất 1 chữ HOA!");

// Subscribers:
validator.onError.on("email", (errors) => {
  document.getElementById("emailError").textContent = errors[0];
});

validator.onChange.on("password", ({ isValid }) => {
  const el = document.getElementById("passwordField");
  el.classList.toggle("valid", isValid);
  el.classList.toggle("invalid", !isValid);
});
```

```javascript
// ═══ WEBSOCKET — REAL-TIME OBSERVER ═══

class WebSocketClient extends EventEmitter {
  constructor(url) {
    super();
    this.url = url;
    this.ws = null;
    this.reconnectAttempts = 0;
    this.maxReconnect = 5;
  }

  connect() {
    this.ws = new WebSocket(this.url);

    this.ws.onopen = () => {
      this.reconnectAttempts = 0;
      this.emit("connected");
    };

    this.ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      // EMIT theo TYPE → observers lắng nghe event riêng!
      this.emit(data.type, data.payload);
      this.emit("message", data); // Catch-all!
    };

    this.ws.onclose = () => {
      this.emit("disconnected");
      this.reconnect();
    };

    this.ws.onerror = (err) => {
      this.emit("error", err);
    };
  }

  reconnect() {
    if (this.reconnectAttempts >= this.maxReconnect) {
      this.emit("maxReconnectReached");
      return;
    }
    this.reconnectAttempts++;
    const delay = Math.min(1000 * 2 ** this.reconnectAttempts, 30000);
    setTimeout(() => this.connect(), delay);
  }

  send(type, payload) {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ type, payload }));
    }
  }
}

// SỬ DỤNG:
const ws = new WebSocketClient("wss://api.example.com/ws");

// Subscribe theo event type:
ws.on("connected", () => console.log("✅ Connected!"));

ws.on("chat:message", (msg) => {
  console.log(`💬 ${msg.user}: ${msg.text}`);
  renderMessage(msg);
});

ws.on("user:typing", (data) => {
  showTypingIndicator(data.user);
});

ws.on("notification", (notif) => {
  showToast(notif.message);
});

ws.on("disconnected", () => {
  showReconnecting();
});

ws.connect();
```

---

## §14. Tradeoffs — Ưu & Nhược điểm

```
ƯU ĐIỂM:
═══════════════════════════════════════════════════════════════

  ✅ SEPARATION OF CONCERNS:
  → Observable chỉ PHÁT event!
  → Observer chỉ XỬ LÝ event!
  → Mỗi phần có TRÁCH NHIỆM riêng!

  ✅ LOOSE COUPLING:
  → Observable KHÔNG biết observer làm gì!
  → Observer KHÔNG biết observable hoạt động thế nào!
  → Có thể add/remove observers bất kỳ lúc nào!

  ✅ OPEN/CLOSED PRINCIPLE:
  → Thêm observer MỚI → KHÔNG cần sửa Observable!
  → Extension WITHOUT modification!

  ✅ EVENT-DRIVEN:
  → Tự nhiên cho UI interactions!
  → Async data flows!
  → Real-time updates!

  ✅ REUSABLE:
  → Observable class dùng lại cho MỌI nơi!
  → Observers là functions → dễ compose!
```

```
NHƯỢC ĐIỂM:
═══════════════════════════════════════════════════════════════

  ❌ MEMORY LEAKS:
  → Quên unsubscribe → observers KHÔNG ĐƯỢC GC!
  → Đặc biệt trong SPA (single-page apps!)
  → PHẢI cleanup trong useEffect return!

  ❌ DEBUGGING KHÓ KHĂN:
  → "AI notify cái này?" → Khó trace!
  → Event chain phức tạp → flow khó follow!
  → console.log everywhere!

  ❌ PERFORMANCE:
  → Nhiều observers → notify CHẬM!
  → Sync notify BLOCK main thread!
  → Complex observers → cascading re-renders!

  ❌ ORDER DEPENDENCY:
  → Observers được gọi theo THỨ TỰ subscribe!
  → Nếu order quan trọng → FRAGILE!

  ❌ UNEXPECTED UPDATES:
  → Observer nhận TẤT CẢ notifications!
  → Có thể broadcast data KHÔNG LIÊN QUAN!
  → Cần filter logic trong observer!
```

```
KHI NÀO DÙNG OBSERVER:
═══════════════════════════════════════════════════════════════

  ✅ NÊN DÙNG:
  → Event handling (click, input, scroll!)
  → Real-time data (WebSocket, SSE!)
  → Cross-component communication!
  → Logging / Analytics / Monitoring!
  → Plugin / Extension systems!
  → State management (Redux, MobX!)

  ❌ KHÔNG NÊN DÙNG:
  → Simple 1-to-1 communication (just call function!)
  → Khi ORDER quan trọng → dùng middleware chain!
  → Quá ít observers → overhead không đáng!
  → Khi cần REQUEST/RESPONSE (dùng Promise!)
```

---

## §15. Tóm tắt

```
OBSERVER PATTERN — TRẢ LỜI PHỎNG VẤN:
═══════════════════════════════════════════════════════════════

  Q: "Observer Pattern là gì?"
  A: Design pattern 1-to-many: Observable phát event,
  tất cả Observers được notify! 3 method chính:
  subscribe (thêm), unsubscribe (xóa), notify (thông báo)!

  Q: "Observer vs Pub/Sub?"
  A: Observer: subject TRỰC TIẾP gọi observers!
  Pub/Sub: có MESSAGE BROKER trung gian!
  Pub/Sub loose coupling HƠN, cho phép async!

  Q: "Ví dụ Observable trong JS?"
  A: addEventListener = Observer Pattern!
  Node.js EventEmitter! Redux store.subscribe()!
  RxJS Observables! Vue watch()! MobX autorun()!

  Q: "Memory leak?"
  A: Quên unsubscribe → observer KHÔNG được GC!
  Fix: cleanup trong useEffect return, dùng once(),
  giữ reference cho off(), WeakRef!

  Q: "RxJS khác Observable thường?"
  A: RxJS = Observable + Operators (map, filter, debounce!)
  + Lazy + Cancellable + Error handling!
  Data STREAM theo thời gian, không chỉ 1 event!

  Q: "Observer trong React?"
  A: useState = internal observer! useContext = provider/consumer!
  useSyncExternalStore (React 18) = external store subscription!
  Redux useSelector tự subscribe + chỉ re-render khi data đổi!
```

---

### Checklist

- [ ] **Observable concept**: subscribe/unsubscribe/notify; 1-to-many; loose coupling!
- [ ] **Implementation**: class Observable với observers[], subscribe(fn), unsubscribe(filter), notify(forEach)!
- [ ] **Return unsubscribe**: subscribe trả về cleanup function cho dễ cleanup!
- [ ] **Event types**: EventEmitter với events Map; on(event, fn), off(event, fn), emit(event, data)!
- [ ] **once()**: subscribe 1 lần → auto unsubscribe sau khi gọi!
- [ ] **Node.js EventEmitter**: require('events'); on/emit/removeListener; HTTP server event-driven!
- [ ] **DOM CustomEvent**: new CustomEvent(name, { detail }); addEventListener = Observer!
- [ ] **Observer vs Pub/Sub**: Observer = trực tiếp; Pub/Sub = có broker trung gian, looser coupling!
- [ ] **RxJS**: Observable = data stream; Operators: map/filter/debounce; Lazy + Cancellable!
- [ ] **Memory Leaks**: PHẢI unsubscribe; useEffect cleanup; giữ fn reference; once(); WeakRef!
- [ ] **React integration**: useSyncExternalStore (React 18); Redux = Observer pattern!
- [ ] **Redux as Observer**: store.subscribe(); dispatch → notify listeners; connect/useSelector auto-subscribe!
- [ ] **Real-World**: Word count, Form validation, WebSocket client, Analytics tracking!
- [ ] **Tradeoffs**: Ưu (SoC, loose coupling, event-driven) vs Nhược (memory leak, debug khó, perf)!

---

_Nguồn: patterns.dev — Observer Pattern, SitePoint, MDN Web Docs, Node.js Docs, RxJS Docs_
_Cập nhật lần cuối: Tháng 2, 2026_
