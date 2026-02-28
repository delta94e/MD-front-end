# Frontend 大厂面试真题 — 12 Companies — Deep Dive

> 📅 2026-02-12 · ⏱ 25 phút đọc
>
> Tổng hợp câu hỏi phỏng vấn THỰC TẾ từ 12 công ty lớn:
> Didi, 58, Jinshan, Bianlifeng, Xiaohongshu, UMU, NetEase,
> Kuaishou, Gaode, Shopee, Tencent, ByteDance. Bao gồm
> câu hỏi lý thuyết, code problems, và lời giải chi tiết.
> Độ khó: ⭐️⭐️⭐️⭐️⭐️ | Chủ đề: Interview / Full-Stack Frontend

---

## Mục Lục

0. [Tổng quan & Nhận xét](#0-tổng-quan)
1. [Code Problems — Lời giải](#1-code-problems)
2. [Lý thuyết — Câu trả lời](#2-lý-thuyết)
3. [Tóm Tắt & Quick Reference](#3-tóm-tắt)

---

## 0. Tổng quan

### Kết quả phỏng vấn

```
12 COMPANIES — KẾT QUẢ:
═══════════════════════════════════════════════════════════════

  ✅ OFFER: 58, Bianlifeng, UMU, Kuaishou, Shopee, Tencent, Byte
  ❌ FAIL:  NetEase (round 1), Gaode (round 1), Xiaohongshu
  ⚠️ PASS nhưng lương thấp: Didi

  7/12 = 58% offer rate (rất tốt!)
```

### Tần suất câu hỏi (TOP 15)

```
CÂU HỎI XUẤT HIỆN NHIỀU NHẤT:
═══════════════════════════════════════════════════════════════

  ┌──────────────────────────────────────────┬─────────────┐
  │ Chủ đề                                  │ Số lần hỏi  │
  ├──────────────────────────────────────────┼─────────────┤
  │ Event Loop / Output Order                │ 6 companies │
  │ this binding / Arrow vs Regular          │ 5 companies │
  │ Closures                                 │ 4 companies │
  │ Vue two-way data binding                 │ 4 companies │
  │ XSS/CSRF/CSP Security                   │ 4 companies │
  │ Throttle / Debounce                      │ 4 companies │
  │ async/await + Promise                    │ 4 companies │
  │ Deep Copy                                │ 3 companies │
  │ React Hooks                              │ 3 companies │
  │ HTTPS + Security                         │ 3 companies │
  │ Virtual DOM / Diff                       │ 3 companies │
  │ CSS Flex layout                          │ 3 companies │
  │ WebSocket                                │ 2 companies │
  │ Micro Frontend                           │ 2 companies │
  │ Array to Tree                            │ 2 companies │
  └──────────────────────────────────────────┴─────────────┘
```

---

## 1. Code Problems — Lời giải

### 1.1 Throttle — chỉ chạy 1 lần (Didi)

```javascript
// Throttle: đảm bảo chỉ execute 1 lần trong interval
function throttle(fn, delay) {
  let timer = null;
  return function (...args) {
    if (timer) return; // Đang trong cooldown → bỏ qua
    timer = setTimeout(() => {
      fn.apply(this, args);
      timer = null; // Reset sau khi execute
    }, delay);
  };
}

// Throttle chạy NGAY lần đầu (leading edge):
function throttleImmediate(fn, delay) {
  let lastTime = 0;
  return function (...args) {
    const now = Date.now();
    if (now - lastTime >= delay) {
      fn.apply(this, args);
      lastTime = now;
    }
  };
}
```

### 1.2 Batch Request — giới hạn concurrency (Didi, Xiaohongshu, Shopee)

```javascript
// Giới hạn tối đa maxConcurrent requests cùng lúc
function batchRequest(urls, maxConcurrent) {
  return new Promise((resolve) => {
    const results = [];
    let index = 0; // URL tiếp theo cần fetch
    let completed = 0; // Số request đã hoàn thành

    function next() {
      if (completed >= urls.length) {
        resolve(results);
        return;
      }
      while (index < urls.length && getRunning() < maxConcurrent) {
        const i = index++;
        fetch(urls[i])
          .then((res) => res.json())
          .then((data) => {
            results[i] = data;
          })
          .catch((err) => {
            results[i] = err;
          })
          .finally(() => {
            completed++;
            next(); // Khi 1 request xong → lấy request tiếp
          });
      }
    }

    let running = 0;
    function getRunning() {
      return index - completed;
    }
    next();
  });
}
```

### 1.3 Array to Tree (Didi, 58, Kuaishou)

```javascript
const arr = [
  { id: 2, name: "部门B", parentId: 0 },
  { id: 3, name: "部门C", parentId: 1 },
  { id: 1, name: "部门A", parentId: 2 },
  { id: 4, name: "部门D", parentId: 1 },
  { id: 5, name: "部门E", parentId: 2 },
  { id: 6, name: "部门F", parentId: 3 },
  { id: 7, name: "部门G", parentId: 2 },
  { id: 8, name: "部门H", parentId: 4 },
];

// O(n) — dùng Map
function arrayToTree(arr) {
  const map = new Map();
  const roots = [];

  // Bước 1: tạo map id → node (thêm children array)
  arr.forEach((item) => {
    map.set(item.id, { ...item, children: [] });
  });

  // Bước 2: link parent-child
  arr.forEach((item) => {
    const node = map.get(item.id);
    const parent = map.get(item.parentId);
    if (parent) {
      parent.children.push(node);
    } else {
      roots.push(node); // Không tìm thấy parent → root
    }
  });

  return roots;
}

// Mở rộng: thêm/xóa node
function addNode(tree, parentId, newNode) {
  function find(nodes) {
    for (const node of nodes) {
      if (node.id === parentId) {
        node.children.push({ ...newNode, children: [] });
        return true;
      }
      if (find(node.children)) return true;
    }
    return false;
  }
  find(tree);
}

function removeNode(tree, targetId) {
  for (let i = 0; i < tree.length; i++) {
    if (tree[i].id === targetId) {
      tree.splice(i, 1);
      return true;
    }
    if (removeNode(tree[i].children, targetId)) return true;
  }
  return false;
}
```

### 1.4 Xóa ký tự ít nhất (Didi final)

```javascript
// "ababac" → "ababa" (xóa 'c' vì ít nhất)
// "aaabbbcceeff" → "aaabbb" (xóa 'c','e','f' vì ít nhất)
function removeLeastFrequent(str) {
  // Bước 1: đếm tần suất
  const freq = {};
  for (const ch of str) {
    freq[ch] = (freq[ch] || 0) + 1;
  }

  // Bước 2: tìm tần suất nhỏ nhất
  const minFreq = Math.min(...Object.values(freq));

  // Bước 3: loại bỏ ký tự có tần suất = minFreq
  return str
    .split("")
    .filter((ch) => freq[ch] !== minFreq)
    .join("");
}

removeLeastFrequent("ababac"); // "ababa"
removeLeastFrequent("aaabbbcceeff"); // "aaabbb"
```

### 1.5 Số → Chữ Hán (Didi final)

```javascript
// trans(123456) → "十二万三千四百五十六"
// trans(100010001) → "一亿零一万零一"
function trans(num) {
  const digits = ["零", "一", "二", "三", "四", "五", "六", "七", "八", "九"];
  const units = ["", "十", "百", "千"];
  const bigUnits = ["", "万", "亿"];

  if (num === 0) return "零";

  const str = String(num);
  let result = "";

  // Chia thành groups of 4: 亿 | 万 | 个
  const groups = [];
  let s = str;
  while (s.length > 0) {
    groups.unshift(s.slice(Math.max(s.length - 4, 0)));
    s = s.slice(0, Math.max(s.length - 4, 0));
  }

  for (let g = 0; g < groups.length; g++) {
    const group = groups[g];
    const bigUnit = bigUnits[groups.length - 1 - g];
    let groupStr = "";
    let hasZero = false;
    let allZero = true;

    for (let i = 0; i < group.length; i++) {
      const d = parseInt(group[i]);
      const unit = units[group.length - 1 - i];

      if (d === 0) {
        hasZero = true;
      } else {
        allZero = false;
        if (hasZero) {
          groupStr += "零";
          hasZero = false;
        }
        groupStr += digits[d] + unit;
      }
    }

    if (!allZero) {
      // Handle leading 零 between groups
      if (result && hasZero) result += "零";
      else if (result && group.length < 4) result += "零";
      result += groupStr + bigUnit;
    } else if (result) {
      hasZero = true; // Group toàn 0 → cần thêm 零 cho group sau
    }
  }

  return result;
}
```

### 1.6 Event Output Order (58, Xiaohongshu, Shopee)

```javascript
async function async1() {
  console.log("async1 start"); // ②
  await async2();
  console.log("async1 end"); // ⑥ (microtask)
}
async function async2() {
  console.log("async2"); // ③
}
console.log("script start"); // ①
setTimeout(function () {
  console.log("setTimeout"); // ⑨ (macrotask)
}, 0);
async1();
new Promise(function (resolve) {
  console.log("promise1"); // ④
  resolve();
  console.log("promise2"); // ⑤ (resolve không dừng execution)
}).then(function () {
  console.log("promise3"); // ⑦ (microtask)
});
console.log("script end"); // ⑧

// Output:
// script start → async1 start → async2 → promise1 →
// promise2 → script end → async1 end → promise3 → setTimeout
```

```
EVENT LOOP ORDER:
═══════════════════════════════════════════════════════════════

  SYNC (call stack):
  ① 'script start'
  ② 'async1 start'
  ③ 'async2'        (await async2() → async2 chạy sync)
  ④ 'promise1'
  ⑤ 'promise2'      (resolve() KHÔNG dừng, code sau vẫn chạy)
  ⑧ 'script end'

  MICROTASK queue:
  ⑥ 'async1 end'    (await resume = microtask)
  ⑦ 'promise3'      (.then callback)

  MACROTASK queue:
  ⑨ 'setTimeout'    (setTimeout callback)
```

### 1.7 IIFE + Named Function Expression (Xiaohongshu)

```javascript
var b = 10;
(function b() {
  b = 20; // ← KHÔNG THAY ĐỔI ĐƯỢC!
  console.log(b); // → function b() { ... }
})();
```

```
TẠI SAO?
═══════════════════════════════════════════════════════════════

  Named Function Expression (NFE):
  → Tên function "b" bên trong IIFE là READ-ONLY!
  → b = 20 bị ignore (non-strict) hoặc TypeError (strict)
  → console.log(b) → in ra chính function b

  Nếu thêm "use strict":
  → b = 20 sẽ throw TypeError!
```

### 1.8 sleep function (Bianlifeng, Byte)

```javascript
function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Sử dụng:
async function test() {
  console.log("start");
  await sleep(2000); // Đợi 2 giây
  console.log("end");
}
```

### 1.9 compose — Koa Onion Model (NetEase, UMU)

```javascript
function compose(middlewares) {
  return function () {
    function dispatch(i) {
      if (i >= middlewares.length) return;
      const fn = middlewares[i];
      fn(() => dispatch(i + 1)); // next() = dispatch(i+1)
    }
    dispatch(0);
  };
}

// Test:
let middleware = [];
middleware.push((next) => {
  console.log(1);
  next();
  console.log(1.1);
});
middleware.push((next) => {
  console.log(2);
  next();
  console.log(2.1);
});
middleware.push((next) => {
  console.log(3);
  next();
  console.log(3.1);
});

let fn = compose(middleware);
fn(); // 1, 2, 3, 3.1, 2.1, 1.1
```

```
ONION MODEL:
  ┌──────────────────────────────────────────────────┐
  │ middleware[0]: log(1) → next() → log(1.1)       │
  │   ┌──────────────────────────────────────────┐   │
  │   │ middleware[1]: log(2) → next() → log(2.1)│   │
  │   │   ┌──────────────────────────────────┐   │   │
  │   │   │ middleware[2]: log(3) → log(3.1) │   │   │
  │   │   └──────────────────────────────────┘   │   │
  │   └──────────────────────────────────────────┘   │
  └──────────────────────────────────────────────────┘
  → Đi VÀO: 1 → 2 → 3
  → Đi RA:  3.1 → 2.1 → 1.1
```

### 1.10 Backspace String Compare (NetEase)

```javascript
// "<-" = backspace, "<" và "-" là ký tự bình thường
function fn(str1, str2) {
  return process(str1) === process(str2);
}

function process(str) {
  const stack = [];
  let i = 0;
  while (i < str.length) {
    if (str[i] === "<" && str[i + 1] === "-") {
      stack.pop(); // Backspace: xóa ký tự trước
      i += 2; // Skip "<-"
    } else {
      stack.push(str[i]);
      i++;
    }
  }
  return stack.join("");
}

fn("a<-b<-", "c<-d<-"); // true (cả hai = "")
fn("<-<-ab<-", "<-<-<-<-a"); // true (cả hai = "a")
fn("<-<ab<-c", "<<-<a<-<-c"); // false ("<ac" !== "c")
```

### 1.11 createRepeat — interval output (Kuaishou)

```javascript
function createRepeat(fn, repeat, interval) {
  return function (...args) {
    let count = 0;
    const timer = setInterval(() => {
      if (count >= repeat) {
        clearInterval(timer);
        return;
      }
      fn.apply(this, args);
      count++;
    }, interval * 1000);
  };
}

const repeatLog = createRepeat(console.log, 3, 4);
repeatLog("helloWorld"); // Mỗi 4s output 1 lần, tổng 3 lần
```

### 1.12 LRU Cache (Kuaishou)

```javascript
class LRU {
  constructor(capacity) {
    this.capacity = capacity;
    this.cache = new Map(); // Map giữ insertion order!
  }

  get(key) {
    if (!this.cache.has(key)) return -1;
    const val = this.cache.get(key);
    // Move to end (most recently used)
    this.cache.delete(key);
    this.cache.set(key, val);
    return val;
  }

  set(key, value) {
    if (this.cache.has(key)) {
      this.cache.delete(key); // Remove old position
    } else if (this.cache.size >= this.capacity) {
      // Evict least recently used (first item in Map)
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }
    this.cache.set(key, value);
  }
}
```

```
LRU — MAP TRICK:
  Map.keys().next().value = phần tử ĐẦU TIÊN (oldest)
  Map giữ insertion order → delete + set = move to end
  → Không cần Doubly Linked List!
```

### 1.13 Deep Copy (Shopee)

```javascript
const deepClone = (obj, map = new WeakMap()) => {
  if (obj === null || typeof obj !== "object") return obj;
  if (obj instanceof Date) return new Date(obj);
  if (obj instanceof RegExp) return new RegExp(obj);
  if (map.has(obj)) return map.get(obj); // Circular ref

  const clone = Array.isArray(obj) ? [] : {};
  map.set(obj, clone);

  for (const key of Reflect.ownKeys(obj)) {
    clone[key] = deepClone(obj[key], map);
  }
  return clone;
};
```

### 1.14 Binary Tree Right Side View (Shopee)

```javascript
// Input: [1,2,3,null,5,null,4] → Output: [1,3,4]
function exposedElement(root) {
  if (!root) return [];
  const result = [];
  const queue = [root];

  while (queue.length) {
    const levelSize = queue.length;
    for (let i = 0; i < levelSize; i++) {
      const node = queue.shift();
      if (i === levelSize - 1) result.push(node.val); // Last in level
      if (node.left) queue.push(node.left);
      if (node.right) queue.push(node.right);
    }
  }
  return result;
}
```

### 1.15 this binding (Shopee, Tencent)

```javascript
var name = "123";
var obj = {
  name: "456",
  print: function () {
    function a() {
      console.log(this.name);
    }
    a(); // ← Gọi bình thường (không phải method call)
  },
};
obj.print(); // '123' (non-strict) hoặc undefined (strict)
```

```
TẠI SAO?
  → a() gọi kiểu "standalone function invocation"
  → KHÔNG phải obj.a() (method call)
  → this = window (non-strict) hoặc undefined (strict)
  → window.name = '123' → output '123'
```

```javascript
// Tencent: arrow vs regular
const obj = {
  fn1: () => console.log(this), // Arrow: this = outer scope
  fn2: function () {
    console.log(this);
  }, // Regular: this = caller
};

obj.fn1(); // window (arrow không có this riêng)
obj.fn2(); // obj (method call → this = obj)

// const x = new obj.fn1(); // ❌ TypeError! Arrow không thể new
const y = new obj.fn2(); // ✅ fn2 {} (new object)
```

### 1.16 Scope — Closure Question (Shopee)

```javascript
var a = 3;
function c() {
  alert(a); // a = ? → tìm trong SCOPE CHAIN
}
(function () {
  var a = 4; // a local trong IIFE
  c(); // c định nghĩa NGOÀI IIFE → scope chain hướng ra global
})();

// Output: 3 (KHÔNG phải 4!)
```

```
TẠI SAO 3 KHÔNG PHẢI 4?
  → Scope chain xác định khi DEFINE, không phải khi CALL
  → c() được define ở global scope
  → Scope chain: c → global
  → a = 3 (global), KHÔNG phải a = 4 (IIFE local)
  → Đây là LEXICAL SCOPING (static scoping)
```

### 1.17 Prototype Chain Output (Shopee)

```javascript
function Foo() {
  Foo.a = function () {
    console.log(1);
  };
  this.a = function () {
    console.log(2);
  };
}
Foo.prototype.a = function () {
  console.log(3);
};
Foo.a = function () {
  console.log(4);
};

Foo.a(); // 4 (static method trên Foo)
let obj = new Foo(); // Constructor chạy: Foo.a → log(1), this.a → log(2)
obj.a(); // 2 (instance property, ưu tiên hơn prototype)
Foo.a(); // 1 (Foo.a đã bị OVERRIDE trong constructor!)
```

### 1.18 Multi-way Tree Level Sum (Tencent)

```javascript
function layerSum(root) {
  if (!root) return [];
  const result = [];
  const queue = [root];

  while (queue.length) {
    let sum = 0;
    const levelSize = queue.length;
    for (let i = 0; i < levelSize; i++) {
      const node = queue.shift();
      sum += node.value;
      if (node.children) {
        queue.push(...node.children);
      }
    }
    result.push(sum);
  }
  return result;
}

// Test: [2, 14, 25]
// Level 0: 2
// Level 1: 6+3+5 = 14
// Level 2: 1+2+3+4+7+8 = 25
```

### 1.19 Virtual DOM → Real DOM (Tencent)

```javascript
function render(vnode) {
  const el = document.createElement(vnode.tag);

  // Set attributes
  if (vnode.attrs) {
    for (const [key, val] of Object.entries(vnode.attrs)) {
      el.setAttribute(key, val);
    }
  }

  // Render children recursively
  if (vnode.children) {
    vnode.children.forEach((child) => {
      el.appendChild(render(child)); // Recursive!
    });
  }

  return el;
}
```

### 1.20 fetchWithRetry (Byte)

```javascript
function fetchWithRetry(url, retries = 3) {
  return fetch(url).catch((err) => {
    if (retries <= 0) throw err;
    return fetchWithRetry(url, retries - 1);
  });
}

// Hoặc dùng loop:
async function fetchWithRetryLoop(url, retries = 3) {
  for (let i = 0; i <= retries; i++) {
    try {
      return await fetch(url);
    } catch (err) {
      if (i === retries) throw err;
    }
  }
}
```

### 1.21 Binary Tree Level Order (Byte)

```javascript
function levelOrder(root) {
  if (!root) return [];
  const result = [];
  const queue = [root];

  while (queue.length) {
    const level = [];
    const size = queue.length;
    for (let i = 0; i < size; i++) {
      const node = queue.shift();
      level.push(node.val);
      if (node.left) queue.push(node.left);
      if (node.right) queue.push(node.right);
    }
    result.push(level);
  }
  return result;
}
// [3,9,20,#,#,15,7] → [[3], [9,20], [15,7]]
```

### 1.22 Reduplicated Words Count (Byte)

```javascript
const str = "abcdaaabbccccdddefgaaa";

// 1. Đếm số "叠词" (consecutive repeating chars)
function countReduplicated(str) {
  let count = 0;
  let i = 0;
  while (i < str.length) {
    let j = i;
    while (j < str.length && str[j] === str[i]) j++;
    if (j - i >= 2) count++; // Chuỗi ≥ 2 ký tự giống nhau
    i = j;
  }
  return count;
}
countReduplicated(str); // 4 (aaa, bb, cccc, ddd)
//  → NHƯNG "aaa" cuối cùng cũng tính = 5?
//    Xem context: aaa, bb, cccc, ddd, aaa = 5 groups
//    Nhưng nếu đề bài đếm UNIQUE reduplicated chars = 4 (a,b,c,d)

// 2. Đếm UNIQUE reduplicated chars
function countUniqueReduplicated(str) {
  const seen = new Set();
  let i = 0;
  while (i < str.length) {
    let j = i;
    while (j < str.length && str[j] === str[i]) j++;
    if (j - i >= 2) seen.add(str[i]);
    i = j;
  }
  return seen.size;
}
countUniqueReduplicated(str); // 4 (a, b, c, d)

// 3. Regex
function countByRegex(str) {
  const matches = str.match(/(.)\1+/g); // Tìm ký tự lặp liên tiếp
  return matches ? matches.length : 0;
}
countByRegex(str); // 5 groups
```

### 1.23 2D Array Permutations (Jinshan, Shopee)

```javascript
// Input: [['A','B'], [1,2], ['a','b']]
// Output: ['A1a', 'A1b', 'A2a', 'A2b', 'B1a', ...]
function permutations(arrays) {
  return arrays.reduce((acc, curr) => {
    if (acc.length === 0) return curr.map(String);
    const result = [];
    for (const prev of acc) {
      for (const item of curr) {
        result.push(prev + item);
      }
    }
    return result;
  }, []);
}
```

### 1.24 Find Array Name by Value (58)

```javascript
const A = [1, 2, 3];
const B = [4, 5, 6];
const C = [7, 8, 9];

function test(num) {
  const map = { A, B, C };
  for (const [name, arr] of Object.entries(map)) {
    if (arr.includes(num)) return name;
  }
  return null;
}

test(1); // 'A'
test(5); // 'B'
test(9); // 'C'
```

### 1.25 First Non-Repeating Character (UMU)

```javascript
function firstUnique(str) {
  const freq = {};
  for (const ch of str) freq[ch] = (freq[ch] || 0) + 1;
  for (const ch of str) {
    if (freq[ch] === 1) return ch;
  }
  return null;
}

firstUnique("ababcbdsa"); // 'c'
firstUnique("abcdefg"); // 'a'
// Time: O(n), Space: O(k) where k = unique chars
```

### 1.26 Promises Output in Order (Shopee final)

```javascript
// Requests song song nhưng OUTPUT THEO THỨ TỰ
async function fn(promiseList) {
  const results = await Promise.all(
    promiseList.map((p, i) => p.then((val) => ({ i, val }))),
  );
  // Promise.all chạy song song nhưng return theo thứ tự!
  return results;
}

// Thực ra Promise.all ĐÃ giữ thứ tự sẵn:
async function fnSimple(promiseList) {
  const results = await Promise.all(promiseList);
  results.forEach((r) => console.log(r));
}
```

---

## 2. Lý thuyết — Câu trả lời ngắn

### Closures (Didi, Bianlifeng, Xiaohongshu)

> **Closure** = function + lexical environment nơi nó được define. Khi inner function reference biến của outer function, biến đó **không bị GC** dù outer function đã return. **Ứng dụng**: data privacy, factory functions, partial application, module pattern, event handlers giữ state.

### Virtual DOM (Didi)

> Virtual DOM = **JS object mô phỏng DOM tree**. Khi state thay đổi: tạo new VDOM → **diff** với old VDOM → tính **minimal DOM operations** → **batch update** real DOM. **Ưu**: cross-platform, batch update giảm reflow, declarative UI. **Nhược**: overhead diff algorithm, memory cho JS objects, không nhanh hơn tối ưu manual DOM.

### Vue Two-Way Binding (Didi, 58, Xiaohongshu)

> Vue 2: **Object.defineProperty** — define getter/setter trên mỗi property. Getter: collect dependencies (watcher). Setter: notify dependencies → re-render. Vue 3: **Proxy** — intercept toàn bộ object operations (bao gồm add/delete property, array index). Ưu hơn defineProperty: không cần walk qua từng property, handle dynamic properties.

### key trong Vue/React (Didi)

> `key` giúp diff algorithm **identify nodes** — khi reorder, diff dùng key để **tìm lại node cũ** thay vì destroy + create mới. **Không dùng index** vì khi insert/delete, index shift → diff map sai node → performance kém + bug state (input values lẫn lộn). **Không có key** → diff dùng in-place patch (cùng vị trí = cùng node) → sai khi reorder.

### keep-alive (Didi, Xiaohongshu)

> `keep-alive` **cache component instance** thay vì destroy khi switch. Dùng **LRU cache** (max, include, exclude). Component bị cache → gọi `deactivated`; activated lại → gọi `activated`. Refresh: `$forceUpdate`, hoặc watch route + reset data trong `activated` hook.

### async/await (Xiaohongshu, 58)

> `async function` return **Promise**. `await` pause execution → đưa code sau await vào **microtask queue**. Bản chất: **syntactic sugar** cho Generator + Promise. `await x` ≈ `yield x` + tự động `.then(resume)`. Khác Generator: async tự chạy (không cần manual `.next()`), return Promise thay vì Iterator.

### BFC (Xiaohongshu)

> **Block Formatting Context** = vùng render độc lập, elements bên trong không ảnh hưởng bên ngoài. **Tạo BFC**: `overflow: hidden/auto/scroll`, `display: flex/grid/inline-block`, `float`, `position: absolute/fixed`. **Ứng dụng**: clear float, prevent margin collapse, contain floated children.

### HTTPS Security (Jinshan, UMU, Tencent)

> HTTPS = HTTP + **TLS/SSL**. ① **Asymmetric encryption**: server gửi public key (trong certificate) → client tạo random symmetric key → encrypt bằng public key → gửi server. ② **Symmetric encryption**: cả hai dùng shared key encrypt/decrypt data. ③ **Certificate verification**: CA sign certificate → browser verify chain of trust → prevent MITM. **CSP** (Content Security Policy): restrict sources of scripts, styles, images → prevent XSS injection.

### flex: 1 (Jinshan)

> `flex: 1` = `flex-grow: 1` + `flex-shrink: 1` + `flex-basis: 0%`. **flex-grow**: chiếm bao nhiêu remaining space. **flex-shrink**: co lại bao nhiêu khi thiếu space. **flex-basis**: kích thước ban đầu trước khi grow/shrink. `flex: 1` = chia đều remaining space.

---

## 3. Tóm Tắt

### Interview Strategy

```
INTERVIEW STRATEGY — LESSONS LEARNED:
═══════════════════════════════════════════════════════════════

  TOP PRIORITY (xuất hiện ở hầu hết companies):
  ① Event Loop output order — PHẢI thuần thục
  ② this binding — regular vs arrow, method vs standalone
  ③ Closures — concept + use cases + problems
  ④ Vue/React lifecycle & data binding
  ⑤ async/await + Promise — relationships, implementation

  CODE PROBLEMS (common patterns):
  ① Array ↔ Tree (Map-based O(n))
  ② Throttle / Debounce (timer-based)
  ③ Concurrent request limiter (Promise pool)
  ④ Deep copy (WeakMap + Reflect.ownKeys)
  ⑤ LRU Cache (Map trick)
  ⑥ BFS level-order traversal (queue)
  ⑦ compose / middleware (onion model)
  ⑧ sleep function (Promise + setTimeout)

  KINH NGHIỆM:
  → Gaode: KHÔNG nên đi (hỏi thuộc API, vô nghĩa)
  → Xiaohongshu: trải nghiệm kém (hỏi random, không lắng nghe)
  → Tencent: 5 rounds nhưng không khó, chủ yếu project
  → Byte: nghe khó nhưng thực tế questions phụ thuộc may mắn
  → 58, Bianlifeng: dễ nhất, offer cao
```

### Checklist Học Tập

- [ ] Event Loop: sync → microtask → render → macrotask
- [ ] this: 4 rules (default, implicit, explicit, new) + arrow
- [ ] Closures: definition, use cases, memory leak prevention
- [ ] Vue 2 defineProperty vs Vue 3 Proxy
- [ ] key trong diff: tại sao không dùng index
- [ ] async/await = Generator + Promise syntactic sugar
- [ ] BFC: creation conditions + applications
- [ ] HTTPS: asymmetric → symmetric → certificate chain
- [ ] Array to Tree: Map-based O(n) algorithm
- [ ] Throttle/Debounce: leading vs trailing vs both
- [ ] Concurrent limiter: Promise pool pattern
- [ ] LRU: Map giữ insertion order trick
- [ ] Deep copy: WeakMap (circular) + Reflect.ownKeys (Symbol)
- [ ] compose: dispatch(i) → next = dispatch(i+1)
- [ ] Virtual DOM → Real DOM: createElement + setAttribute + recursive
- [ ] Level-order BFS: queue + level size loop
- [ ] Scope chain: xác định khi DEFINE, không phải khi CALL

---

_Cập nhật lần cuối: Tháng 2, 2026_
