# JavaScript Application Scenarios — Deep Dive

> 📅 2026-02-12 · ⏱ 25 phút đọc
>
> 15+ bài thực hành: Traffic light async, timer print, Josephus,
> Promise image load, Pub-Sub, fetch wrapper, prototype inheritance,
> 2-way data binding, hash routing, Fibonacci, sliding window,
> setTimeout→setInterval, JSONP, circular reference, 2D array.
> Độ khó: ⭐️⭐️⭐️⭐️ | Chủ đề: JS Application Patterns

---

## Mục Lục

0. [Async Patterns (traffic light, timer, image load)](#0-async-patterns)
1. [Design Patterns (Pub-Sub, fetch, inheritance, data binding)](#1-design-patterns)
2. [Algorithms (Josephus, Fibonacci, sliding window, 2D array)](#2-algorithms)
3. [Browser APIs (routing, setInterval, JSONP, circular ref)](#3-browser-apis)
4. [Tóm Tắt & Câu Hỏi Phỏng Vấn](#4-tóm-tắt--câu-hỏi-phỏng-vấn)

---

## 0. Async Patterns

### ① Traffic Light Loop — 3 cách async

> **Đèn đỏ 3s → xanh 1s → vàng 2s → LẶP LẠI vô hạn.**

```javascript
function red() {
  console.log("red");
}
function green() {
  console.log("green");
}
function yellow() {
  console.log("yellow");
}
```

#### (1) Callback + Recursion

```javascript
const task = (timer, light, callback) => {
  setTimeout(() => {
    if (light === "red") red();
    if (light === "green") green();
    if (light === "yellow") yellow();
    callback();
  }, timer);
};

// Recursion → tạo LOOP vô hạn
const step = () => {
  task(3000, "red", () => {
    task(1000, "green", () => {
      task(2000, "yellow", step); // ← gọi lại step!
    });
  });
};
step();
```

#### (2) Promise + Recursion

```javascript
const task = (timer, light) =>
  new Promise((resolve) => {
    setTimeout(() => {
      if (light === "red") red();
      if (light === "green") green();
      if (light === "yellow") yellow();
      resolve();
    }, timer);
  });

const step = () => {
  task(3000, "red")
    .then(() => task(1000, "green"))
    .then(() => task(2000, "yellow"))
    .then(step); // Recursion!
};
step();
```

#### (3) async/await + Recursion ← CLEANEST

```javascript
const taskRunner = async () => {
  await task(3000, "red");
  await task(1000, "green");
  await task(2000, "yellow");
  taskRunner(); // Recursion!
};
taskRunner();
```

```
SO SÁNH:
  Callback   → Nested (callback hell nếu nhiều)
  Promise    → .then chaining (flat hơn)
  async/await→ Đọc như SYNC code ✅ (recommend)

  KEY: Tất cả dùng RECURSION để loop vô hạn!
```

### ② Print 0–4, mỗi giây 1 số

```javascript
// ── var + Closure (IIFE) ──
for (var i = 0; i < 5; i++) {
  (function (i) {
    setTimeout(function () {
      console.log(i);
    }, i * 1000);
  })(i); // IIFE tạo scope riêng → capture i
}

// ── let (block scope) ← SIMPLE ──
for (let i = 0; i < 5; i++) {
  setTimeout(function () {
    console.log(i);
  }, i * 1000);
  // let → mỗi iteration có scope RIÊNG
}
```

```
TẠI SAO var KHÔNG WORK?
  for (var i = 0; i < 5; i++) {
    setTimeout(() => console.log(i), i * 1000);
  }
  → Output: 5 5 5 5 5 (i=5 khi timeout chạy!)

  FIX: ① IIFE closure ② let block scope ③ setTimeout 3rd arg
```

### ③ Promise Image Loading

```javascript
let imageAsync = (url) => {
  return new Promise((resolve, reject) => {
    let img = new Image();
    img.src = url;
    img.onload = () => {
      console.log("Image loaded successfully");
      resolve(img);
    };
    img.onerror = (err) => {
      console.log("Image load failed");
      reject(err);
    };
  });
};

// Sử dụng:
imageAsync("https://example.com/photo.jpg")
  .then((img) => document.body.appendChild(img))
  .catch((err) => console.error("Failed:", err));
```

---

## 1. Design Patterns

### ④ Publish-Subscribe (EventEmitter)

```javascript
class EventCenter {
  constructor() {
    this.handlers = {}; // { eventName: [handler1, handler2, ...] }
  }

  // ── Subscribe (ON) ──
  addEventListener(type, handler) {
    if (!this.handlers[type]) {
      this.handlers[type] = [];
    }
    this.handlers[type].push(handler);
  }

  // ── Publish (EMIT) ──
  dispatchEvent(type, ...params) {
    if (!this.handlers[type]) {
      return new Error("Event not registered");
    }
    this.handlers[type].forEach((handler) => {
      handler(...params);
    });
  }

  // ── Unsubscribe (OFF) ──
  removeEventListener(type, handler) {
    if (!this.handlers[type]) {
      return new Error("Invalid event");
    }
    if (!handler) {
      delete this.handlers[type]; // Remove ALL handlers
    } else {
      const index = this.handlers[type].findIndex((el) => el === handler);
      if (index === -1) return new Error("Handler not found");
      this.handlers[type].splice(index, 1);
      if (this.handlers[type].length === 0) {
        delete this.handlers[type];
      }
    }
  }
}

// Sử dụng:
const bus = new EventCenter();
const onLogin = (user) => console.log("Logged in:", user);
bus.addEventListener("login", onLogin);
bus.dispatchEvent("login", "John"); // 'Logged in: John'
bus.removeEventListener("login", onLogin);
```

```
PUB-SUB PATTERN:
  ┌──────────┐  subscribe  ┌────────────┐  publish  ┌──────────┐
  │Subscriber│ ──────────→ │EventCenter │ ←──────── │Publisher │
  │(on)      │             │{handlers}  │           │(emit)    │
  └──────────┘  ←──────── └────────────┘            └──────────┘
                  notify
```

### ⑤ Async Fetch Wrapper (HttpRequestUtil)

```javascript
class HttpRequestUtil {
  async get(url) {
    const res = await fetch(url);
    return await res.json();
  }

  async post(url, data) {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    return await res.json();
  }

  async put(url, data) {
    const res = await fetch(url, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    return await res.json();
  }

  async delete(url, data) {
    const res = await fetch(url, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    return await res.json();
  }
}

// const http = new HttpRequestUtil();
// const data = await http.get('/api/users');
// await http.post('/api/users', { name: 'John' });
```

### ⑥ Prototype Inheritance

```javascript
// Parent
function SupperFunction(flag1) {
  this.flag1 = flag1;
}

// Child
function SubFunction(flag2) {
  this.flag2 = flag2;
}

// Inheritance: Child.prototype = Parent instance
var superInstance = new SupperFunction(true);
SubFunction.prototype = superInstance;

var subInstance = new SubFunction(false);
subInstance.flag1; // true  (từ parent qua prototype)
subInstance.flag2; // false (own property)
```

```
PROTOTYPE CHAIN:
  subInstance.__proto__  →  superInstance (SubFunction.prototype)
  superInstance.__proto__  →  SupperFunction.prototype
  SupperFunction.prototype.__proto__  →  Object.prototype
```

### ⑦ Two-Way Data Binding (Object.defineProperty)

```javascript
let obj = {};
let input = document.getElementById("input");
let span = document.getElementById("span");

// Data hijacking — getter/setter
Object.defineProperty(obj, "text", {
  configurable: true,
  enumerable: true,
  get() {
    console.log("Data accessed");
  },
  set(newVal) {
    console.log("Data updated");
    input.value = newVal; // Update input
    span.innerHTML = newVal; // Update display
  },
});

// View → Model
input.addEventListener("keyup", function (e) {
  obj.text = e.target.value; // Trigger setter
});
```

```
TWO-WAY BINDING:
  ┌───────┐  keyup   ┌──────────────────┐  setter   ┌──────┐
  │ Input │ ───────→ │ obj.text = value │ ────────→ │ Span │
  │(View) │          │(defineProperty)  │           │(View)│
  └───────┘ ←─────── └──────────────────┘            └──────┘
              setter update input.value

  Vue 2: Object.defineProperty (giống pattern này)
  Vue 3: Proxy (mạnh hơn, hỗ trợ add/delete property)
```

### ⑧ Simple Hash Router

```javascript
class Route {
  constructor() {
    this.routes = {}; // { path: callback }
    this.currentHash = "";
    this.freshRoute = this.freshRoute.bind(this);

    window.addEventListener("load", this.freshRoute, false);
    window.addEventListener("hashchange", this.freshRoute, false);
  }

  // Register route
  storeRoute(path, cb) {
    this.routes[path] = cb || function () {};
  }

  // Handle route change
  freshRoute() {
    this.currentHash = location.hash.slice(1) || "/";
    this.routes[this.currentHash]();
  }
}

// const router = new Route();
// router.storeRoute('/', () => console.log('Home'));
// router.storeRoute('/about', () => console.log('About'));
// URL: example.com/#/about → 'About'
```

---

## 2. Algorithms

### ⑨ Josephus Problem (đếm số)

> **30 trẻ đứng vòng tròn, đếm đến 3 → loại. Tìm người cuối.**

```javascript
function childNum(num, count) {
  let allplayer = [];
  for (let i = 0; i < num; i++) {
    allplayer[i] = i + 1; // Đánh số 1→30
  }

  let exitCount = 0; // Số người đã loại
  let counter = 0; // Bộ đếm (1, 2, 3)
  let curIndex = 0; // Vị trí hiện tại

  while (exitCount < num - 1) {
    if (allplayer[curIndex] !== 0) counter++;

    if (counter === count) {
      allplayer[curIndex] = 0; // Loại (đánh dấu = 0)
      counter = 0; // Reset counter
      exitCount++;
    }

    curIndex++;
    if (curIndex === num) {
      curIndex = 0; // Quay vòng tròn
    }
  }

  // Tìm người còn lại
  for (let i = 0; i < num; i++) {
    if (allplayer[i] !== 0) return allplayer[i];
  }
}

childNum(30, 3); // → 29
```

```
JOSEPHUS FLOW (simplified n=5, count=3):
  [1, 2, 3, 4, 5]  → đếm 1,2,3 → loại 3
  [1, 2, 0, 4, 5]  → đếm 4,5,1 → loại 1
  [0, 2, 0, 4, 5]  → đếm 2,4,5 → loại 5
  [0, 2, 0, 4, 0]  → đếm 2,4,2 → loại 2
  [0, 0, 0, 4, 0]  → Còn lại: 4 ✅
```

### ⑩ Most Frequent Word

```javascript
function findMostWord(article) {
  if (!article) return;
  article = article.trim().toLowerCase();
  let wordList = article.match(/[a-z]+/g);
  let visited = [],
    maxNum = 0,
    maxWord = "";

  article = " " + wordList.join("  ") + " ";

  wordList.forEach(function (item) {
    if (visited.indexOf(item) < 0) {
      visited.push(item);
      let word = new RegExp(" " + item + " ", "g");
      let num = article.match(word).length;
      if (num > maxNum) {
        maxNum = num;
        maxWord = item;
      }
    }
  });
  return maxWord + "  " + maxNum;
}
```

### ⑪ Fibonacci Sequence — 3 cách

```javascript
// ── (1) Recursive (chậm — O(2^n)) ──
function fib(n) {
  if (n === 0) return 0;
  if (n === 1) return 1;
  return fib(n - 2) + fib(n - 1);
}

// ── (2) DP array (tối ưu — O(n), space O(n)) ──
function fibonacci(n) {
  const arr = [1, 1, 2];
  if (n <= arr.length) return arr[n];
  for (let i = arr.length; i < n; i++) {
    arr.push(arr[i - 1] + arr[i - 2]);
  }
  return arr[arr.length - 1];
}

// ── (3) Iterative (tối ưu — O(n), space O(1)) ← BEST ──
function fib(n) {
  let pre1 = 1,
    pre2 = 1,
    current = 2;
  if (n <= 2) return current;
  for (let i = 2; i < n; i++) {
    pre1 = pre2;
    pre2 = current;
    current = pre1 + pre2;
  }
  return current;
}
```

```
FIBONACCI SO SÁNH:
  ┌────────────┬──────┬────────┬──────────────────────────┐
  │ Method     │ Time │ Space  │ Note                     │
  ├────────────┼──────┼────────┼──────────────────────────┤
  │ Recursive  │O(2^n)│ O(n)   │ Trùng lặp tính toán     │
  │ DP array   │ O(n) │ O(n)   │ Memoization              │
  │ Iterative  │ O(n) │ O(1)   │ ✅ Best: 2 biến tạm     │
  └────────────┴──────┴────────┴──────────────────────────┘
```

### ⑫ Longest Non-Repeating Substring (Sliding Window)

```javascript
var lengthOfLongestSubstring = function (s) {
  let map = new Map(); // char → last index
  let i = -1; // Left boundary
  let res = 0; // Max length
  let n = s.length;

  for (let j = 0; j < n; j++) {
    if (map.has(s[j])) {
      i = Math.max(i, map.get(s[j])); // Move left boundary
    }
    res = Math.max(res, j - i); // Update max
    map.set(s[j], j); // Record index
  }
  return res;
};

// "abcabcbb" → 3 ("abc")
// "bbbbb"    → 1 ("b")
// "pwwkew"   → 3 ("wke")
```

```
SLIDING WINDOW FLOW: "abcabcbb"
  ┌────────────┬───┬───┬──────┬─────┐
  │ j (right)  │s[j]│ i │ j-i │ res │
  ├────────────┼───┼───┼──────┼─────┤
  │ 0          │ a │-1 │  1   │  1  │
  │ 1          │ b │-1 │  2   │  2  │
  │ 2          │ c │-1 │  3   │  3  │
  │ 3          │ a │ 0 │  3   │  3  │  ← duplicate 'a' at 0
  │ 4          │ b │ 1 │  3   │  3  │  ← duplicate 'b' at 1
  │ 5          │ c │ 2 │  3   │  3  │
  │ 6          │ b │ 4 │  2   │  3  │
  │ 7          │ b │ 6 │  1   │  3  │
  └────────────┴───┴───┴──────┴─────┘
  Result: 3
```

---

## 3. Browser APIs

### ⑬ setTimeout → setInterval

> **setInterval problem**: events pile up trong queue khi execution stack busy.
> **Fix**: recursive setTimeout — chỉ schedule NEXT sau khi CURRENT xong.

```javascript
function mySetInterval(fn, timeout) {
  var timer = { flag: true }; // Controller

  function interval() {
    if (timer.flag) {
      fn();
      setTimeout(interval, timeout); // Schedule NEXT
    }
  }

  setTimeout(interval, timeout);
  return timer; // Return controller để stop
}

// const timer = mySetInterval(() => console.log('tick'), 1000);
// timer.flag = false;  // Stop!
```

```
setInterval vs recursive setTimeout:
  setInterval:          setTimeout recursive:
  ┌──┐ ┌──┐ ┌──┐       ┌──┐     ┌──┐     ┌──┐
  │fn│ │fn│ │fn│       │fn│→delay│fn│→delay│fn│
  └──┘ └──┘ └──┘       └──┘     └──┘     └──┘
  ^    ^    ^           ^              ^
  fixed intervals       guaranteed gap after execution
  (may pile up!)        (no pile up) ✅
```

### ⑭ JSONP Implementation

> **Bypass CORS** bằng `<script>` tag (chỉ hỗ trợ GET).

```javascript
// ── Client ──
function addScript(src) {
  const script = document.createElement("script");
  script.src = src;
  script.type = "text/javascript";
  document.body.appendChild(script);
}

// Gọi API với callback name
addScript("http://api.example.com/data?callback=handleRes");

// Callback global function
function handleRes(res) {
  console.log(res); // { a: 1, b: 2 }
}

// ── Server trả về ──
// handleRes({a: 1, b: 2});
// → Server wrap data trong function call
```

```
JSONP FLOW:
  ① Client tạo <script src="api?callback=handleRes">
  ② Browser GET request (không bị CORS!)
  ③ Server trả: handleRes({data})
  ④ Browser execute script → gọi handleRes({data})
  ⚠️ Chỉ GET, không POST/PUT/DELETE
```

### ⑮ Detect Circular Reference

```javascript
const isCycleObject = (obj, parent) => {
  const parentArr = parent || [obj];

  for (let i in obj) {
    if (typeof obj[i] === "object") {
      let flag = false;
      parentArr.forEach((pObj) => {
        if (pObj === obj[i]) flag = true; // Tìm thấy reference loop!
      });
      if (flag) return true;

      // Recursive check con
      flag = isCycleObject(obj[i], [...parentArr, obj[i]]);
      if (flag) return true;
    }
  }
  return false;
};

// const a = {}; const b = { a }; a.b = b;
// isCycleObject(a) → true (circular!)
// ⚠️ JSON.stringify(a) → TypeError: Converting circular structure to JSON
```

### ⑯ Search in Sorted 2D Array

> **Sorted 2D array**: mỗi hàng tăng trái→phải, mỗi cột tăng trên→dưới.
> **Strategy**: Bắt đầu từ **góc PHẢI TRÊN**.

```javascript
var findNumberIn2DArray = function (matrix, target) {
  if (matrix == null || matrix.length == 0) return false;

  let row = 0;
  let column = matrix[0].length - 1; // Góc phải trên

  while (row < matrix.length && column >= 0) {
    if (matrix[row][column] === target) {
      return true;
    } else if (matrix[row][column] > target) {
      column--; // Quá lớn → đi TRÁI
    } else {
      row++; // Quá nhỏ → đi XUỐNG
    }
  }
  return false;
};

// Time: O(m + n) — tối đa m+n bước
```

### ⑰ 2D Array Diagonal Print

```javascript
function printMatrix(arr) {
  let m = arr.length,
    n = arr[0].length;
  let res = [];

  // Phần trên: từ cột 0 → n-1
  for (let k = 0; k < n; k++) {
    for (let i = 0, j = k; i < m && j >= 0; i++, j--) {
      res.push(arr[i][j]);
    }
  }

  // Phần dưới: từ hàng 1 → m-1
  for (let k = 1; k < m; k++) {
    for (let i = k, j = n - 1; i < m && j >= 0; i++, j--) {
      res.push(arr[i][j]);
    }
  }
  return res;
}

// [[1,2,3],[4,5,6],[7,8,9]]
// → [1, 2,4, 3,5,7, 6,8, 9] (diagonal ↙)
```

---

## 4. Tóm Tắt & Câu Hỏi Phỏng Vấn

### Quick Reference

```
15 APPLICATION SCENARIOS — QUICK REFERENCE:
═══════════════════════════════════════════════════════════════

  ASYNC:
    Traffic light     → task(timer,light) + RECURSION loop
    Timer print       → IIFE closure hoặc let block scope
    Image load        → new Image() + onload/onerror → Promise

  DESIGN PATTERNS:
    Pub-Sub           → handlers{} + on/emit/off
    Fetch wrapper     → async/await + class methods
    Inheritance       → Child.prototype = new Parent()
    2-way binding     → Object.defineProperty get/set
    Hash router       → hashchange event + routes{}

  ALGORITHMS:
    Josephus          → array + circular index + counter
    Most frequent word→ regex match + count
    Fibonacci         → recursive/DP/iterative (O(1) space best)
    Sliding window    → Map + left boundary + max length

  BROWSER:
    setTimeout→setInterval → recursive setTimeout (no pile up)
    JSONP              → <script> tag + global callback
    Circular reference → recursive parent array check
    2D array search    → top-right corner, O(m+n)
```

### Câu Hỏi Phỏng Vấn

**1. Traffic light dùng async/await tốt hơn Promise chain ở điểm nào?**

> Code đọc **tuần tự** như synchronous, không cần `.then` chaining. Dễ debug, dễ thêm logic (try/catch). Cả hai đều dùng **recursion** để loop vô hạn.

**2. var + setTimeout tại sao in ra 5 5 5 5 5?**

> `var` = **function scope**, tất cả setTimeout **share cùng i**. Khi timeout chạy, loop đã kết thúc → i=5. Fix: **IIFE** tạo scope riêng hoặc dùng **let** (block scope).

**3. Pub-Sub pattern dùng ở đâu trong thực tế?**

> **Event bus** (Vue), **Redux middleware**, **WebSocket message handling**, **DOM events**. Core: decouple sender/receiver, nhiều subscribers nhận cùng event.

**4. Object.defineProperty vs Proxy cho data binding?**

> **defineProperty** (Vue 2): phải declare property trước, không detect add/delete. **Proxy** (Vue 3): intercept toàn bộ object operations, hỗ trợ array, new property, delete. Proxy **mạnh hơn** nhưng không hỗ trợ IE.

**5. Tại sao dùng recursive setTimeout thay setInterval?**

> **setInterval** schedule events theo **fixed interval**, nếu callback chạy lâu → events **pile up** trong queue. **Recursive setTimeout** chỉ schedule next event **SAU KHI callback hoàn thành** → guaranteed gap, no pile up.

**6. JSONP bypass CORS thế nào? Hạn chế?**

> Dùng `<script>` tag (browser không apply CORS cho scripts). Server wrap data trong function call. **Hạn chế**: chỉ **GET**, security risk (XSS), không control headers/error codes.

---

## Checklist Học Tập

- [ ] Traffic light: callback → Promise → async/await + recursion
- [ ] Timer print: var+IIFE vs let block scope
- [ ] Promise image loading (onload/onerror)
- [ ] Pub-Sub EventCenter (on/emit/off)
- [ ] Async fetch wrapper (GET/POST/PUT/DELETE)
- [ ] Prototype inheritance (Child.prototype = new Parent)
- [ ] 2-way data binding (Object.defineProperty)
- [ ] Hash router (hashchange event)
- [ ] Josephus problem (circular array)
- [ ] Fibonacci: 3 cách + so sánh complexity
- [ ] Sliding window: longest non-repeating substring
- [ ] setTimeout simulate setInterval
- [ ] JSONP implementation + limitations
- [ ] Detect circular reference
- [ ] 2D array search from top-right corner O(m+n)

---

_Cập nhật lần cuối: Tháng 2, 2026_
