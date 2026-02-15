# Real Interview Experiences — 12 Companies (Part 1)

> 📅 2026-02-12 · ⏱ 20 phút đọc
>
> 6 công ty: Didi, 58同城, Jinshan, Bianlifeng, Xiaohongshu, UMU
> Kết quả: Didi (offer thấp), 58 (offer), Bianlifeng (offer), UMU (offer)
> Code solutions + phân tích chiến lược
> Độ khó: ⭐️⭐️⭐️⭐️⭐️ | Chủ đề: Interview / Algorithm / System Design

---

## Mục Lục

0. [Tổng Quan — Topic Frequency](#tổng-quan)
1. [Didi — 3 Rounds + HR](#didi)
2. [58同城 — 3 Rounds + Cross + HR (OFFER)](#58)
3. [Jinshan — 2 Rounds](#jinshan)
4. [Bianlifeng — 3 Rounds (OFFER)](#bianlifeng)
5. [Xiaohongshu — 2 Rounds](#xiaohongshu)
6. [UMU — 3 Rounds (OFFER)](#umu)
7. [Tóm Tắt & Checklist](#tóm-tắt)

---

## Tổng Quan

```
TOPIC FREQUENCY — 12 COMPANIES (Part 1 + Part 2):
═══════════════════════════════════════════════════════════════

  HOT TOPICS (xuất hiện > 5 lần):
  ★★★★★ Event Loop / Output Order        │ 8 companies
  ★★★★★ Closure / Scope                   │ 7 companies
  ★★★★★ this binding                      │ 6 companies
  ★★★★★ Vue two-way binding               │ 6 companies
  ★★★★★ Promise / async-await             │ 6 companies
  ★★★★★ Concurrency control               │ 5 companies

  COMMON TOPICS (3-4 lần):
  ★★★★  XSS / CSRF / Security            │ 4 companies
  ★★★★  Throttle / Debounce              │ 4 companies
  ★★★★  React hooks                       │ 4 companies
  ★★★★  Virtual DOM / Diff               │ 4 companies
  ★★★★  WebSocket                         │ 3 companies
  ★★★★  HTTPS                             │ 3 companies

  CODE PROBLEMS (most common):
  ★★★★★ Array to Tree                     │ 3 companies
  ★★★★★ Concurrency limiter              │ 4 companies
  ★★★★  Throttle/Debounce                │ 3 companies
  ★★★★  Deep Clone                        │ 2 companies
  ★★★★  Binary Tree traversal            │ 3 companies
  ★★★   LRU Cache                         │ 2 companies
  ★★★   compose (Koa onion)              │ 2 companies
```

---

## §1. Didi — 3 Rounds + HR

```
DIDI — OVERVIEW:
═══════════════════════════════════════════════════════════════
  Kết quả: OFFER (lương thấp hơn expected)
  Đặc điểm: Không chuẩn bị → trả lời kém → lương thấp
  Ấn tượng: Câu hỏi soft-skill "A bất đồng với sếp"
  → Đáp án interviewer: "Đừng hire A. Loại từ vòng phỏng vấn."
```

### Round 1 — Theory Heavy

```
CÂU HỎI THEORY — DIDI ROUND 1:
═══════════════════════════════════════════════════════════════

  Q1: Closure là gì? Use cases?
  → Function + lexical environment nơi nó được KHAI BÁO
  → Uses: data privacy, factory functions, currying, memoize
  → Pitfall: memory leak nếu giữ reference quá lâu

  Q2: Event Loop principle?
  → Call Stack → Microtask Queue → Macrotask Queue
  → Microtask (Promise.then) > Macrotask (setTimeout)

  Q3: Virtual DOM là gì? Ưu nhược?
  → JS object mô tả DOM structure
  → ✅ Cross-platform, batch update, diff minimize DOM ops
  → ❌ Overhead cho simple apps, memory cho VDOM tree

  Q4: Vue/React diff improvements?
  → Same level comparison only (O(n) không O(n³))
  → Key-based reorder (không recreate DOM)
  → Vue: static hoisting, PatchFlags
  → React: Fiber interruptible reconciliation

  Q5: Key purpose? Tại sao KHÔNG dùng index?
  → Key = unique identifier cho diff algorithm
  → index: khi insert/delete → tất cả items shift → wrong reuse!
  → Không có key: fallback to in-place update → bug hidden state

  Q6: Vue two-way binding principle?
  → Vue 2: Object.defineProperty (getter/setter) + Dep + Watcher
  → Vue 3: Proxy (intercept get/set/delete/has)
  → v-model = :value + @input syntactic sugar

  Q7: keep-alive?
  → Cache component instances (không destroy khi switch)
  → LRU strategy (max prop controls cache size)
  → Refresh: activated/deactivated hooks (không phải created/mounted)

  Q8: Vue template parsing?
  → Template → AST (parse) → optimize (mark static) → generate (render fn)
  → Directives: v-if/v-for → parsed as AST attributes → codegen
  → Template variables: {{ msg }} → _s(msg) in render function
  → HTML tags: <div> → _c('div', ...)

  Q9: render vs template?
  → template → compiled to render function (build time)
  → render(): manual, more flexible, JSX support
  → render > template (template is syntactic sugar for render)
```

### Code: Throttle (Execute Once Guaranteed)

```javascript
// Throttle: guaranteed to execute AT LEAST once (leading + trailing)
function throttle(fn, delay) {
  let timer = null;
  let lastTime = 0;

  return function (...args) {
    const now = Date.now();
    const remaining = delay - (now - lastTime);

    clearTimeout(timer);

    if (remaining <= 0) {
      // ① Leading: đủ thời gian → execute ngay
      fn.apply(this, args);
      lastTime = now;
    } else {
      // ② Trailing: set timer cho lần cuối
      timer = setTimeout(() => {
        fn.apply(this, args);
        lastTime = Date.now();
      }, remaining);
    }
  };
}
```

### Code: Batch Request with Concurrency Limit

```javascript
// Concurrency control — Didi version (same pattern as file upload!)
function batchRequest(urls, maxConcurrency) {
  return new Promise((resolve, reject) => {
    const results = [];
    let idx = 0;
    let counter = 0;

    const start = () => {
      while (idx < urls.length && maxConcurrency > 0) {
        maxConcurrency--;
        const i = idx++;
        fetch(urls[i])
          .then((res) => {
            results[i] = res; // Giữ đúng thứ tự!
            maxConcurrency++;
            counter++;
            if (counter === urls.length) resolve(results);
            else start();
          })
          .catch(reject);
      }
    };
    start();
  });
}
```

### Code: Array to Tree

```javascript
// Array → Tree — O(n) using Map! ⭐
function arrayToTree(arr) {
  const map = new Map();
  const tree = [];

  // ① Build map: id → node (with children array)
  arr.forEach((item) => {
    map.set(item.id, { ...item, children: [] });
  });

  // ② Link parent → child
  arr.forEach((item) => {
    const node = map.get(item.id);
    if (item.parentId === 0) {
      tree.push(node); // Root node
    } else {
      const parent = map.get(item.parentId);
      if (parent) parent.children.push(node);
    }
  });

  return tree;
}

// Complexity: O(n) — 2 passes, Map lookup O(1)
// Naive approach (recursive find parent): O(n²) → AVOID!
```

### Code: Remove Least Frequent Character

```javascript
// "ababac" → "ababa" (remove 'c', frequency = 1)
// "aaabbbcceeff" → "aaabbb" (remove 'cc','ee','ff', all freq=2)
function removeLeastFrequent(str) {
  // ① Count frequency
  const freq = {};
  for (const ch of str) {
    freq[ch] = (freq[ch] || 0) + 1;
  }

  // ② Find minimum frequency
  const minFreq = Math.min(...Object.values(freq));

  // ③ Filter: keep chars with freq > minFreq
  return str
    .split("")
    .filter((ch) => freq[ch] !== minFreq)
    .join("");
}

// "ababac" → a:3, b:2, c:1 → min=1 → remove 'c' → "ababa"
// "aaabbbcceeff" → a:3,b:3,c:2,e:2,f:2 → min=2 → remove c,e,f → "aaabbb"
```

### Code: Number to Chinese Characters

```javascript
// trans(123456) → "十二万三千四百五十六"
// trans(100010001) → "一亿零一万零一"
function trans(num) {
  const chars = ["零", "一", "二", "三", "四", "五", "六", "七", "八", "九"];
  const units = ["", "十", "百", "千"];
  const bigUnits = ["", "万", "亿"];

  if (num === 0) return "零";

  const str = String(num);
  let result = "";
  const groups = [];

  // ① Split into groups of 4 (from right)
  for (let i = str.length; i > 0; i -= 4) {
    groups.unshift(str.slice(Math.max(0, i - 4), i));
  }

  groups.forEach((group, gi) => {
    let groupStr = "";
    let hasZero = false;

    for (let i = 0; i < group.length; i++) {
      const digit = parseInt(group[i]);
      const unitIdx = group.length - 1 - i;

      if (digit === 0) {
        hasZero = true;
      } else {
        if (hasZero) {
          groupStr += "零";
          hasZero = false;
        }
        // Skip "一十" → "十" (at beginning)
        if (!(digit === 1 && unitIdx === 1 && gi === 0 && groupStr === "")) {
          groupStr += chars[digit];
        }
        groupStr += units[unitIdx];
      }
    }

    if (groupStr) {
      result += groupStr + bigUnits[groups.length - 1 - gi];
    }
  });

  return result;
}
```

---

## §2. 58同城 — 3 Rounds + Cross + HR (OFFER)

```
58 — OVERVIEW:
═══════════════════════════════════════════════════════════════
  Kết quả: OFFER
  Đặc điểm: 3 rounds remote + cross interview tại office
  Round 1-3: Technical tốt | Cross + final: casual
  HR: Rất nhiệt tình, professional
```

### Round 1 — Key Topics

```
CÂU HỎI — 58 ROUND 1:
═══════════════════════════════════════════════════════════════

  Q: Front-end engineering?
  → Build tools (Webpack/Vite), CI/CD, linting, testing
  → Monorepo (Turborepo, NX), module federation

  Q: Performance optimization?
  → Loading: compress, cache, CDN, lazy load, tree shake
  → Execution: memo, virtual DOM, requestAnimationFrame

  Q: Node.js async I/O + libuv?
  → libuv: event loop + thread pool for async I/O
  → 4 phases: timers → poll → check → close
  → File I/O: delegated to thread pool (4 threads default)

  Q: Micro frontend?
  → Tách large app → multiple small apps (independent deploy)
  → Solutions: qiankun (single-spa based), Module Federation
  → Key: sandbox (JS isolation), CSS isolation, communication

  Q: Vue to React migration?
  → Gradual migration: embed React components in Vue (adapters)
  → Shared state: Redux/Zustand accessible from both
  → Keep API layer unchanged → migrate UI layer

  Q: Node logs + load balancer?
  → Logs: winston/pino → structured JSON → ELK stack
  → Load balancer: Nginx (upstream), PM2 cluster mode
```

### Code: Event Loop Output Order

```javascript
async function async1() {
  console.log("async1 start"); // ②
  await async2();
  console.log("async1 end"); // ⑥
}
async function async2() {
  console.log("async2"); // ③
}
console.log("script start"); // ①
setTimeout(function () {
  console.log("setTimeout"); // ⑧
}, 0);
async1();
new Promise(function (resolve) {
  console.log("promise1"); // ④
  resolve();
  console.log("promise2"); // ⑤ (resolve KHÔNG dừng execution!)
}).then(function () {
  console.log("promise3"); // ⑦
});
console.log("script end"); // (nằm giữa ⑤ và ⑥)

// OUTPUT:
// script start → async1 start → async2 → promise1 → promise2
// → script end → async1 end → promise3 → setTimeout
```

```
GIẢI THÍCH:
═══════════════════════════════════════════════════════════════
  SYNC: script start, async1 start, async2, promise1, promise2, script end
  MICRO: async1 end (await = implicit .then), promise3
  MACRO: setTimeout

  ⚠️ resolve() KHÔNG dừng execution!
  → console.log('promise2') vẫn chạy sau resolve()
  → .then callback vào microtask queue
```

### Code: Find Array Name by Value

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

test(1); // "A"
test(5); // "B"

// Alternative: Build reverse map (O(1) lookup)
function buildLookup(...namedArrays) {
  const lookup = new Map();
  for (const [name, arr] of Object.entries(namedArrays[0])) {
    arr.forEach((v) => lookup.set(v, name));
  }
  return (num) => lookup.get(num) || null;
}
const find = buildLookup({ A, B, C });
find(8); // "C"
```

---

## §3. Jinshan — 2 Rounds

```
JINSHAN — OVERVIEW:
═══════════════════════════════════════════════════════════════
  Kết quả: FAIL (interviewer arrogant, ép giảm lương)
  Round 1: Professional, friendly → tốt
  Round 2: Arrogant, PUA tactics → tệ
```

### Round 1 — Key Topics + Code

```
CÂU HỎI — JINSHAN ROUND 1:
═══════════════════════════════════════════════════════════════

  Q: React vs Vue technical differences?
  → React: JSX, one-way data flow, hooks, Fiber
  → Vue: template, two-way binding, Options/Composition API
  → React: "library" mindset | Vue: "framework" mindset

  Q: useReducer?
  → Alternative to useState for complex state logic
  → const [state, dispatch] = useReducer(reducer, initialState)
  → Giống Redux pattern nhưng local cho component

  Q: let a outside vs inside component?
  → Outside: shared across renders, NOT reactive
  → Inside: re-created each render, NOT reactive
  → useState: persisted across renders AND triggers re-render!

  Q: PM2 daemon?
  → pm2 fork child processes → monitor → restart on crash
  → Cluster mode: 1 master + N workers (CPU cores)
  → Daemon: detach from terminal, run in background

  Q: Node child process methods?
  → spawn(): stream-based, large output
  → exec(): buffer output, callback-based
  → fork(): special spawn for Node scripts, IPC channel
  → execFile(): run executable file

  Q: IPC (Inter-Process Communication)?
  → process.send() / process.on('message')
  → Shared memory, pipes, sockets
  → Worker threads: SharedArrayBuffer

  Q: CSS three-column equal width? flex: 1?
  → flex: 1 = flex-grow: 1 + flex-shrink: 1 + flex-basis: 0%
  → 3 columns: each flex: 1 → equal width!
  → flex: 1 1 0% (shorthand)

  Q: XSS, CSRF, CSP?
  → XSS: inject script → steal cookies → escape HTML, CSP
  → CSRF: forged request → CSRF token, SameSite cookie
  → CSP: Content-Security-Policy header → whitelist script sources
```

### Code: 2D Array Permutations

```javascript
// Input: [['A','B'], [1,2], ['a','b']]
// Output: ['A1a','A1b','A2a','A2b','B1a','B1b','B2a','B2b']
function permutations(arrays) {
  return arrays.reduce((acc, arr) => {
    if (acc.length === 0) return arr.map(String);
    const result = [];
    for (const prev of acc) {
      for (const cur of arr) {
        result.push(prev + cur);
      }
    }
    return result;
  }, []);
}

// Time: O(∏ arr.length) — product of all array lengths
// Elegant reduce: "cross product" pattern
```

### Code: String Diff (Insert/Delete Detection)

```javascript
// pre = 'abcde123', now = '1abc123'
// → "a前面插入了1, c后面删除了de"
function diffStrings(pre, now) {
  const ops = [];
  // LCS (Longest Common Subsequence) approach
  const m = pre.length,
    n = now.length;
  const dp = Array(m + 1)
    .fill(null)
    .map(() => Array(n + 1).fill(0));

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (pre[i - 1] === now[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1] + 1;
      } else {
        dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
      }
    }
  }

  // Backtrack to find operations
  let i = m,
    j = n;
  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && pre[i - 1] === now[j - 1]) {
      i--;
      j--; // Match — no operation
    } else if (j > 0 && (i === 0 || dp[i][j - 1] >= dp[i - 1][j])) {
      ops.unshift({ type: "insert", char: now[j - 1], pos: j - 1 });
      j--;
    } else {
      ops.unshift({ type: "delete", char: pre[i - 1], pos: i - 1 });
      i--;
    }
  }
  return ops;
}
```

---

## §4. Bianlifeng — 3 Rounds (OFFER)

```
BIANLIFENG — OVERVIEW:
═══════════════════════════════════════════════════════════════
  Kết quả: OFFER (lương rất cao, nhưng lo lắng vì quá dễ)
  Đặc điểm: 3 interviewers đều talkative, questions đơn giản
  Round 1: Thuần project discussion
  Round 2: Closures, online debugging, Linux, HTTP codes
  Round 3: Code — sleep, throttle/debounce
```

### Round 2 — Monitoring & Linux

```
CÂU HỎI — BIANLIFENG ROUND 2:
═══════════════════════════════════════════════════════════════

  Q: Online crash monitoring?
  → window.onerror, unhandledrejection
  → Performance API: memory, timing
  → Sentry SDK: capture exceptions + stack traces

  Q: Continuous memory growth monitoring?
  → performance.memory.usedJSHeapSize (Chrome)
  → Periodic sampling: mỗi 30s đo memory → detect trend
  → Memory leak patterns: event listeners, closures, DOM detached

  Q: Linux top command?
  → PID, USER, %CPU, %MEM, TIME, COMMAND
  → Load average: 1min, 5min, 15min
  → Useful for Node.js process monitoring

  Q: 301 vs 302 vs 304?
  → 301: Moved Permanently → browser cache URL permanently
  → 302: Found (temporary redirect) → DON'T cache
  → 304: Not Modified → dùng cached version (conditional caching)
```

### Code: sleep Function

```javascript
// sleep — pause execution for N milliseconds
function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Usage:
async function demo() {
  console.log("start");
  await sleep(2000); // Wait 2 seconds
  console.log("end"); // 2s later
}
```

---

## §5. Xiaohongshu — 2 Rounds

```
XIAOHONGSHU — OVERVIEW:
═══════════════════════════════════════════════════════════════
  Kết quả: FAIL (chỉ tuyển leaders, trải nghiệm tệ)
  Round 1: Hỏi máy móc, không lắng nghe, random questions
  Round 2: Chat linh tinh → 2 tuần sau báo fail
```

### Code: IIFE Named Function Expression

```javascript
var b = 10;
(function b() {
  b = 20;
  console.log(b);
})();

// OUTPUT: ƒ b() { b = 20; console.log(b); }

// TẠI SAO?
// Named Function Expression (NFE):
// → Tên 'b' INSIDE function = READ-ONLY reference to function itself
// → b = 20 fails SILENTLY (non-strict mode)
// → console.log(b) → prints function, NOT 20 or 10!
// → Strict mode: TypeError: Assignment to constant variable
```

### Code: ES5 vs ES6 Inheritance

```javascript
// ES5 — Parasitic Combination Inheritance
function Parent(name) {
  this.name = name;
}
Parent.prototype.sayHi = function () {
  console.log("Hi, " + this.name);
};

function Child(name, age) {
  Parent.call(this, name); // ① Steal constructor
  this.age = age;
}
Child.prototype = Object.create(Parent.prototype); // ② Link prototype
Child.prototype.constructor = Child; // ③ Fix constructor

// ES6 — class + extends
class ParentES6 {
  constructor(name) {
    this.name = name;
  }
  sayHi() {
    console.log("Hi, " + this.name);
  }
}
class ChildES6 extends ParentES6 {
  constructor(name, age) {
    super(name); // MUST call super() before using 'this'
    this.age = age;
  }
}

// KEY DIFFERENCES (beyond syntax):
// ① ES6 class: typeof → "function", BUT not hoisted (TDZ!)
// ② ES6: static methods ARE inherited (ES5: manual copy)
// ③ ES6: super() required in child constructor
// ④ ES6: class methods NOT enumerable (ES5: they are)
// ⑤ ES6: class body runs in strict mode automatically
```

### Code: EventEmitter

```javascript
class EventEmitter {
  constructor() {
    this.events = {};
  }
  on(event, fn) {
    (this.events[event] ||= []).push(fn);
    return this;
  }
  off(event, fn) {
    if (!this.events[event]) return this;
    this.events[event] = this.events[event].filter((f) => f !== fn);
    return this;
  }
  emit(event, ...args) {
    (this.events[event] || []).forEach((fn) => fn(...args));
    return this;
  }
  once(event, fn) {
    const wrapper = (...args) => {
      fn(...args);
      this.off(event, wrapper);
    };
    this.on(event, wrapper);
    return this;
  }
}
```

---

## §6. UMU — 3 Rounds (OFFER)

```
UMU — OVERVIEW:
═══════════════════════════════════════════════════════════════
  Kết quả: OFFER (CTO very impressive, lo OT thứ 7)
  Round 1 & 2: Remote | Round 3: Onsite + aptitude test
  Đặc điểm: Practical, daily-dev focused questions
```

### Round 2 — Koa Deep Dive

```
CÂU HỎI — UMU ROUND 2:
═══════════════════════════════════════════════════════════════

  Q: Koa Onion Model?
  → Middleware stack: request → m1 → m2 → m3 → response
  →                       ← m3 ← m2 ← m1 ←
  → compose(): chạy next() → đi sâu, return → lên lại
  → Giống call stack: LIFO cho "after" logic

  Q: Exception handling in middleware?
  → try/catch bọc await next() → catch errors from inner middleware
  → app.on('error', handler) → global error handling

  Q: Koa onion WITHOUT async/await?
  → Promise chain: middleware return Promise
  → next() return Promise → .then() chain

  Q: POST upload image + fields — header?
  → Content-Type: multipart/form-data; boundary=----xxx
  → Boundary separates each field/file in body
  → Without body-parser: parse raw stream manually
       → Read chunks → find boundary → extract parts

  Q: WebSocket principle?
  → HTTP upgrade handshake → persistent TCP connection
  → Full-duplex: server push without polling
  → Header: Upgrade: websocket, Connection: Upgrade

  Q: HTTPS security? Man-in-the-middle?
  → TLS handshake: asymmetric → exchange symmetric key
  → CA certificate: verify server identity
  → MITM prevention: certificate pinning, HSTS
```

### Code: First Non-Repeating Character

```javascript
// "ababcbdsa" → 'c' (first char with freq = 1)
// "abcdefg" → 'a' (all unique, first one)
function firstUniqChar(str) {
  const freq = {};
  for (const ch of str) {
    freq[ch] = (freq[ch] || 0) + 1;
  }
  for (const ch of str) {
    if (freq[ch] === 1) return ch;
  }
  return null;
}

// Time: O(n) — 2 passes
// Space: O(k) — k = unique characters (max 26 for lowercase)

// Edge cases to consider:
// ① Empty string → null
// ② All same char "aaaa" → null
// ③ All unique "abcd" → 'a'
// ④ Special chars, numbers, unicode
```

---

## Tóm Tắt

### Quick Reference

```
6 COMPANIES — KEY TAKEAWAYS:
═══════════════════════════════════════════════════════════════

  DIDI:
  → Theory heavy (closure, VDOM, Vue internals)
  → Code: throttle, concurrency limiter, arr→tree, Chinese numbers
  → Lesson: chuẩn bị kém → lương thấp dù offer

  58同城:
  → Full-stack (Node.js, engineering, micro frontend)
  → Event loop output order (KINH ĐIỂN!)
  → Lesson: HR professional, cross-interview tại office

  JINSHAN:
  → React hooks deep dive, Node process, CSS flex
  → Code: 2D permutations, string diff (LCS)
  → Lesson: interviewer arrogant → decline offer

  BIANLIFENG:
  → Monitoring (crash, memory leak), Linux top
  → HTTP codes (301/302/304)
  → Lesson: quá dễ + lương quá cao → lo lắng (!)

  XIAOHONGSHU:
  → Trải nghiệm TỆ NHẤT (random questions, 2 weeks wait)
  → Code: IIFE NFE trick, ES5/ES6 inheritance, EventEmitter
  → Lesson: quality of interview ≠ quality of company

  UMU:
  → Koa deep dive, debugging, practical daily-dev
  → CTO interview onsite → impressive knowledge
  → Lesson: technical depth matters
```

### Checklist — Code Problems

- [ ] Throttle: leading + trailing, clearTimeout pattern
- [ ] Concurrency limiter: maxCount, queue.shift(), resolve counter
- [ ] Array to Tree: O(n) Map approach, 2-pass (build map → link)
- [ ] Remove least frequent char: freq count → min → filter
- [ ] Number to Chinese: groups of 4, 零 handling, 十 prefix
- [ ] Event loop output: sync → microtask → macrotask order
- [ ] Find value in named arrays: Object.entries + includes
- [ ] 2D permutations: reduce cross-product pattern
- [ ] String diff: LCS (dp) → backtrack → insert/delete ops
- [ ] sleep: Promise + setTimeout wrapper
- [ ] IIFE NFE: named function expression → b = read-only inside
- [ ] ES5 vs ES6 inheritance: 5 key differences beyond syntax
- [ ] EventEmitter: on/off/emit/once (wrapper pattern for once)
- [ ] First non-repeating char: 2-pass freq count, O(n)

---

_Nguồn: 路从今夜白丶 — juejin.cn/post/7142690757722243102_
_Part 2: NetEase, Kuaishou, Gaode, Shopee, Tencent, ByteDance_
_Cập nhật lần cuối: Tháng 2, 2026_
