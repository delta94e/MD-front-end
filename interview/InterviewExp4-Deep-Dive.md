# Real Interview Experiences — 12 Companies (Part 2)

> 📅 2026-02-12 · ⏱ 20 phút đọc
>
> 6 công ty: NetEase, Kuaishou, Gaode, Shopee, Tencent, ByteDance
> Kết quả: Kuaishou (offer), Shopee (offer), Tencent (offer), ByteDance (offer)
> Code solutions + phân tích chiến lược
> Độ khó: ⭐️⭐️⭐️⭐️⭐️ | Chủ đề: Interview / Algorithm / System Design

---

## Mục Lục

1. [NetEase — 1 Round (FAIL)](#netease)
2. [Kuaishou — 3 Rounds (OFFER)](#kuaishou)
3. [Gaode — 1 Round (FAIL)](#gaode)
4. [Shopee — 2 Rounds (OFFER)](#shopee)
5. [Tencent — 5 Rounds (OFFER)](#tencent)
6. [ByteDance — 3 Rounds (OFFER)](#bytedance)
7. [Tóm Tắt & Final Strategy](#tóm-tắt)

---

## §1. NetEase — 1 Round (FAIL)

```
NETEASE — OVERVIEW:
═══════════════════════════════════════════════════════════════
  Kết quả: FAIL round 1 (code bị mess)
  Bài học: Code questions quyết định PASS/FAIL!
```

### Key Topics

```
CÂU HỎI — NETEASE:
═══════════════════════════════════════════════════════════════

  Q: this keyword — drawbacks?
  → this dynamic binding → KHÔNG predictable
  → Arrow functions: lexical this (fix vấn đề)
  → Drawback: confusion in callbacks, event handlers, class methods

  Q: Vue reactive vs imperative?
  → Imperative: manually DOM.innerHTML = ... (HOW to update)
  → Reactive: change data → UI auto-update (WHAT to show)
  → Benefit: developer focus on STATE, not DOM manipulation

  Q: Generator interruption/resumption?
  → yield: pause execution, return value
  → .next(): resume from where it paused
  → Internal: save stack frame, restore on resume
  → Used by: async/await (syntactic sugar for generators)

  Q: Why distinguish macro-task / micro-task?
  → Microtask: high priority, execute BEFORE next render
  → Macrotask: lower priority, execute AFTER render
  → Purpose: Promise callbacks (.then) should run ASAP
              Timer callbacks can wait for next event loop cycle
```

### Code: compose (Koa Onion Model)

```javascript
// Output: 1, 2, 3, 3.1, 2.1, 1.1
function compose(middlewares) {
  return function () {
    function dispatch(i) {
      if (i === middlewares.length) return;
      const fn = middlewares[i];
      fn(() => dispatch(i + 1)); // next = dispatch(i+1)
    }
    dispatch(0);
  };
}

// WHY IT WORKS (Call Stack):
// dispatch(0) → fn0(next) → console.log(1)
//   → next() → dispatch(1) → fn1(next) → console.log(2)
//     → next() → dispatch(2) → fn2(next) → console.log(3)
//       → next() → dispatch(3) → return (no more middleware)
//     → console.log(3.1)   ← fn2 continues after next()
//   → console.log(2.1)     ← fn1 continues after next()
// → console.log(1.1)       ← fn0 continues after next()
```

### Code: Backspace String Compare

```javascript
// "<-" = backspace, "<" and "-" are normal chars
// "a<-b<-", "c<-d<-" → true (both "")
// "<-<-ab<-", "<-<-<-<-a" → true (both "a")
// "<-<ab<-c", "<<-<a<-<-c" → false ("<ac" !== "c")
function fn(str1, str2) {
  return process(str1) === process(str2);
}

function process(str) {
  const stack = [];
  let i = 0;
  while (i < str.length) {
    if (str[i] === "<" && str[i + 1] === "-") {
      // Backspace: pop last char
      stack.pop();
      i += 2; // Skip "<-"
    } else {
      stack.push(str[i]);
      i++;
    }
  }
  return stack.join("");
}

// "<-<ab<-c" → process:
// i=0: '<' + '-' → backspace (stack empty, pop nothing) → i=2
// i=2: '<' (next is 'a', not '-') → push '<' → stack: ['<']
// i=3: 'a' → push → stack: ['<','a']
// i=4: 'b' → push → stack: ['<','a','b']
// i=5: '<' + '-' → pop 'b' → stack: ['<','a'] → i=7
// i=7: 'c' → push → stack: ['<','a','c']
// Result: "<ac"
```

---

## §2. Kuaishou — 3 Rounds (OFFER)

```
KUAISHOU — OVERVIEW:
═══════════════════════════════════════════════════════════════
  Kết quả: OFFER (nhưng HR kéo dài, đợi giá các công ty khác)
  Đặc điểm: Professional, serious, wide range
  Round 1: Mini-program, output, code problems
  Round 2: Promise details, Electron, micro-frontend
  Round 3: Project-focused
```

### Code: typeof chain + console.log

```javascript
console.log(typeof typeof typeof null);
// Step: typeof null → "object"
//       typeof "object" → "string"
//       typeof "string" → "string"
// OUTPUT: "string"

console.log(typeof console.log(1));
// Step: console.log(1) → prints 1, returns undefined
//       typeof undefined → "undefined"
// OUTPUT: 1   (side effect)
//         "undefined"
```

### Code: this Binding

```javascript
var name = "123";
var obj = {
  name: "456",
  print: function () {
    function a() {
      console.log(this.name);
    }
    a(); // Normal function call → this = window (non-strict)
  },
};
obj.print();
// OUTPUT: '123' (window.name, NOT obj.name!)

// FIX: arrow function, .bind(), or const self = this
```

### Code: createRepeat

```javascript
function createRepeat(fn, repeat, interval) {
  return function (...args) {
    let count = 0;
    const timer = setInterval(() => {
      fn(...args);
      count++;
      if (count >= repeat) clearInterval(timer);
    }, interval * 1000);
  };
}

const fn = createRepeat(console.log, 3, 4);
fn("helloWorld"); // Outputs "helloWorld" 3 times, every 4 seconds
```

### Code: Delete Node from Linked List

```javascript
function deleteNode(head, node) {
  // Case 1: delete head
  if (head === node) return head.next;

  let curr = head;
  while (curr.next) {
    if (curr.next === node) {
      curr.next = curr.next.next; // Skip target node
      return head;
    }
    curr = curr.next;
  }
  return head;
}

// O(1) trick (if node is NOT tail):
function deleteNodeO1(node) {
  // Copy next node's value → delete next node
  node.val = node.next.val;
  node.next = node.next.next;
}
```

### Code: LRU Cache

```javascript
class LRU {
  constructor(capacity) {
    this.capacity = capacity;
    this.cache = new Map(); // Map preserves insertion order!
  }

  get(key) {
    if (!this.cache.has(key)) return -1;
    const value = this.cache.get(key);
    // Move to end (most recently used)
    this.cache.delete(key);
    this.cache.set(key, value);
    return value;
  }

  set(key, value) {
    if (this.cache.has(key)) {
      this.cache.delete(key); // Remove old position
    } else if (this.cache.size >= this.capacity) {
      // Evict LEAST recently used (first in Map)
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }
    this.cache.set(key, value); // Insert at end
  }
}

// WHY Map? → keys().next().value = FIRST inserted = LRU!
// delete + set = "move to end" = mark as recently used
// O(1) get, O(1) set — perfect!
```

### Round 2 — Key Topics

```
CÂU HỎI — KUAISHOU ROUND 2:
═══════════════════════════════════════════════════════════════

  Q: Promise .then 2nd arg vs .catch?
  → .then(onFulfilled, onRejected): chỉ catch errors TỪ PROMISE
  → .catch(onRejected): catch errors từ PROMISE + từ .then callback!
  → .catch = .then(undefined, onRejected)
  → Prefer .catch: catches MORE errors!

  Q: Promise.finally implementation?
  → .finally(callback): runs regardless of fulfilled/rejected
  → Returns ORIGINAL value (not callback's return)
  → Promise.prototype.finally = function(cb) {
        return this.then(
            value => Promise.resolve(cb()).then(() => value),
            reason => Promise.resolve(cb()).then(() => { throw reason; })
        );
    };

  Q: Electron architecture?
  → Main process (Node.js) + Renderer process (Chromium)
  → IPC: ipcMain / ipcRenderer communication
  → preload.js: bridge between main & renderer (contextBridge)

  Q: webpack5 Module Federation?
  → Share modules between SEPARATE builds at RUNTIME
  → Not compile-time (unlike monorepo shared packages)
  → Host: consumes remote modules | Remote: exposes modules
  → Micro-frontend solution without iframe overhead
```

---

## §3. Gaode — 1 Round (FAIL)

```
GAODE — OVERVIEW:
═══════════════════════════════════════════════════════════════
  Kết quả: FAIL round 1
  Đặc điểm: Interviewer hỏi thuộc lòng API → vô nghĩa!
  → "CSS property xx làm gì?" "Promise method xx là gì?"
  → Memorize all API = EXHAUSTING & MEANINGLESS

  Bài học: Một số interviewer focus API memorization,
  nhưng đây KHÔNG phải cách đánh giá engineer tốt.
  → Vẫn nên biết common APIs, nhưng không cần thuộc HẾT

  KEY TOPICS:
  → Symbol: unique primitive, property key, iterator protocol
  → useRef vs ref vs forwardRef:
     useRef: mutable ref object (.current), persists across renders
     ref: callback ref hoặc createRef (class component)
     forwardRef: pass ref TO child component
  → useEffect(fn, []): mount only, cleanup on unmount
  → useEffect(fn, [dep]): run when dep changes
  → flex layout, ES5 inheritance, Promise APIs, CSS properties
```

---

## §4. Shopee — 2 Rounds (OFFER)

```
SHOPEE — OVERVIEW:
═══════════════════════════════════════════════════════════════
  Kết quả: OFFER (HR chậm trả giá, đợi Kuaishou/ByteDance)
  Đặc điểm: Efficient — 2 rounds + HR cùng 1 buổi chiều
  Round 1 xong → 1h sau round 2 → 1h sau HR
```

### Code: Deep Clone

```javascript
const deepClone = (obj, map = new WeakMap()) => {
  if (obj === null || typeof obj !== "object") return obj;

  // ① Circular reference detection
  if (map.has(obj)) return map.get(obj);

  // ② Handle Date, RegExp
  if (obj instanceof Date) return new Date(obj);
  if (obj instanceof RegExp) return new RegExp(obj);

  // ③ Create clone (Array or Object)
  const clone = Array.isArray(obj) ? [] : {};
  map.set(obj, clone); // Register BEFORE recursion (circular ref)

  // ④ Recursively clone all properties
  for (const key of Reflect.ownKeys(obj)) {
    clone[key] = deepClone(obj[key], map);
  }
  return clone;
};

// KEY POINTS:
// → WeakMap: circular reference, auto GC
// → Reflect.ownKeys: includes Symbol keys + non-enumerable
// → Handle special types: Date, RegExp, Map, Set, etc.
```

### Code: Binary Tree Right Side View (DFS)

```javascript
// Input: [1,2,3,null,5,null,4] → Output: [1,3,4]
function exposedElement(root) {
  if (!root) return [];
  const result = [];

  function dfs(node, depth) {
    if (!node) return;
    // First node at each depth from RIGHT side
    if (depth === result.length) {
      result.push(node.val);
    }
    dfs(node.right, depth + 1); // RIGHT first!
    dfs(node.left, depth + 1);
  }

  dfs(root, 0);
  return result;
}

// Visit RIGHT subtree first → first node at each depth = rightmost
// Time: O(n), Space: O(h) h=height
```

### Code: Scope & Prototype Chain Output

```javascript
// Scope:
var a = 3;
function c() {
  alert(a);
}
(function () {
  var a = 4;
  c();
})();
// OUTPUT: 3
// WHY: c() defined in GLOBAL scope → lexical scope chain → global a=3
// var a=4 inside IIFE = DIFFERENT scope, c() doesn't see it!

// Prototype chain:
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

Foo.a(); // 4 (static method, Foo.a = log(4))
let obj = new Foo(); // Constructor runs: Foo.a = log(1), this.a = log(2)
obj.a(); // 2 (instance property, set in constructor)
Foo.a(); // 1 (Foo.a was OVERWRITTEN inside constructor!)
```

### Code: Sequential Promise Output

```javascript
// Output promises in ORDER, but run concurrently (fastest possible)
function fn(promiseList) {
  return Promise.all(
    promiseList.map((p, i) => p.then((res) => ({ i, res }))),
  ).then((results) => {
    results.sort((a, b) => a.i - b.i);
    results.forEach(({ res }) => console.log(res));
  });
}

// Simpler: Promise.all already preserves order!
function fn2(promiseList) {
  return Promise.all(promiseList).then((results) => {
    results.forEach((res) => console.log(res));
  });
}
// Promise.all runs ALL concurrently, resolves in INPUT ORDER
```

### Code: Array Permutations (Subsets + Permutations)

```javascript
// [1,2,3] → [[1],[2],[3],[1,2],[1,3],[2,3],[1,2,3],...]
// This is actually SUBSETS (power set), not permutations
function subsets(arr) {
  const result = [];

  function backtrack(start, current) {
    if (current.length > 0) {
      result.push([...current]);
    }
    for (let i = start; i < arr.length; i++) {
      current.push(arr[i]);
      backtrack(i + 1, current);
      current.pop(); // Backtrack
    }
  }

  backtrack(0, []);
  return result;
}

// For ACTUAL permutations of each subset:
function allPermutations(arr) {
  const subs = subsets(arr);
  const result = [];
  for (const sub of subs) {
    permute(sub, 0, result);
  }
  return result;
}

function permute(arr, start, result) {
  if (start === arr.length) {
    result.push([...arr]);
    return;
  }
  for (let i = start; i < arr.length; i++) {
    [arr[start], arr[i]] = [arr[i], arr[start]];
    permute(arr, start + 1, result);
    [arr[start], arr[i]] = [arr[i], arr[start]]; // Restore
  }
}
```

---

## §5. Tencent — 5 Rounds (OFFER)

```
TENCENT — OVERVIEW:
═══════════════════════════════════════════════════════════════
  Kết quả: OFFER (lương thấp hơn expected → decline)
  Đặc điểm: 5 rounds! Longest process
  Round 1-3: Technical | Round 4-5: Project casual
  → Difficulty: NOT high, nhưng NHIỀU rounds
```

### Code: this in Arrow vs Regular

```javascript
const obj = {
  fn1: () => console.log(this),
  fn2: function () {
    console.log(this);
  },
};

obj.fn1(); // window (arrow: lexical this = outer scope)
obj.fn2(); // obj (regular: called on obj)

// const x = new obj.fn1(); // ❌ TypeError: not a constructor!
const y = new obj.fn2(); // fn2 {} (new creates fresh object)

// Arrow functions CANNOT be constructors (no [[Construct]])
```

### Code: Multi-way Tree Layer Sum

```javascript
function layerSum(root) {
  if (!root) return [];
  const result = [];
  const queue = [root];

  while (queue.length > 0) {
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

// layerSum({value:2, children:[{value:6,...},{value:3,...},{value:5,...}]})
// Level 0: 2
// Level 1: 6+3+5 = 14
// Level 2: 1+2+3+4+7+8 = 25
// Result: [2, 14, 25]
```

### Code: Virtual DOM → Real DOM

```javascript
function render(vnode) {
  const el = document.createElement(vnode.tag);

  // Set attributes
  if (vnode.attrs) {
    for (const [key, value] of Object.entries(vnode.attrs)) {
      el.setAttribute(key, value);
    }
  }

  // Recursively render children
  if (vnode.children) {
    vnode.children.forEach((child) => {
      el.appendChild(
        typeof child === "string"
          ? document.createTextNode(child)
          : render(child), // Recursive!
      );
    });
  }
  return el;
}
```

---

## §6. ByteDance — 3 Rounds (OFFER)

```
BYTEDANCE — OVERVIEW:
═══════════════════════════════════════════════════════════════
  Kết quả: OFFER
  Đặc điểm: Nghe đồn rất khó → thực tế SIMPLE! (may mắn)
  Round 1: Binary tree, retry, linked list
  Round 2: System design heavy, algorithm
  Round 3: Code — duplicated words
```

### Code: Binary Tree Level Order Traversal

```javascript
// {3,9,20,#,#,15,7} → [[3],[9,20],[15,7]]
function levelOrder(root) {
  if (!root) return [];
  const result = [];
  const queue = [root];

  while (queue.length > 0) {
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
// BFS: queue size = number of nodes at current level
```

### Code: fetchWithRetry

```javascript
function fetchWithRetry(url, retries = 3) {
  return fetch(url).catch((err) => {
    if (retries <= 0) throw err;
    return fetchWithRetry(url, retries - 1);
  });
}

// Expanded with delay:
async function fetchWithRetryDelay(url, retries = 3, delay = 1000) {
  for (let i = 0; i <= retries; i++) {
    try {
      return await fetch(url);
    } catch (err) {
      if (i === retries) throw err;
      await new Promise((r) => setTimeout(r, delay * (i + 1)));
    }
  }
}
```

### Code: Linked List Cycle Entry

```javascript
// Floyd's Tortoise & Hare algorithm
function detectCycle(head) {
  let slow = head,
    fast = head;

  // ① Detect cycle
  while (fast && fast.next) {
    slow = slow.next;
    fast = fast.next.next;
    if (slow === fast) break;
  }
  if (!fast || !fast.next) return null; // No cycle

  // ② Find entry: reset slow to head, both move 1 step
  slow = head;
  while (slow !== fast) {
    slow = slow.next;
    fast = fast.next;
  }
  return slow; // Entry node!
}
// Math: head→entry = a, entry→meet = b, cycle = c
// fast travels 2x slow: a+b+nc = 2(a+b) → a = nc-b
// Reset slow to head, both move 1: they meet at ENTRY!
```

### Code: Duplicated Words Count

```javascript
// 'abcdaaabbccccdddefgaaa' → 4 duplicated words
// Step 1: count duplicated words
function countDuplicated(str) {
  let count = 0,
    i = 0;
  while (i < str.length) {
    let j = i;
    while (j < str.length && str[j] === str[i]) j++;
    if (j - i >= 2) count++; // 2+ consecutive same chars = 叠词
    i = j;
  }
  return count;
}

// Step 2: count UNIQUE duplicated words
function countUniqueDuplicated(str) {
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

// Step 3: Regex version
function countDuplicatedRegex(str) {
  const matches = str.match(/(.)\1+/g);
  return matches ? matches.length : 0;
}

// 'abcdaaabbccccdddefgaaa'
// Groups: aaa, bb, cccc, ddd, aaa → 5 (but aaa appears twice)
// Unique: a, b, c, d → 4
```

### Round 2 — System Design

```
CÂU HỎI — BYTEDANCE ROUND 2:
═══════════════════════════════════════════════════════════════

  Q: Screenshot implementation?
  → html2canvas: clone DOM → draw to Canvas → toDataURL()
  → dom-to-image: SVG foreignObject approach
  → Native: navigator.mediaDevices.getDisplayMedia()

  Q: QPS at peak, how to optimize?
  → CDN, cache, lazy load, code splitting
  → Rate limiting, queue requests
  → SSR/ISR for static content
  → Edge computing (Cloudflare Workers)

  Q: Numbers > Number.MAX_SAFE_INTEGER?
  → BigInt: 123n, BigInt("9007199254740993")
  → String arithmetic (manual carry)
  → Libraries: bignumber.js

  Q: 64 athletes, 8 tracks, minimum races for top 4?
  → 8 races (group stage) + 1 race (group winners) = 9
  → Then 2 more races to determine 2nd-4th → TOTAL: 11

  Q: Route a→b→c, c→b→a data structure?
  → Stack! Push on forward, pop on back
  → Stack = LIFO = perfect for browser history
  → Actually 2 stacks: back-stack + forward-stack
```

---

## Tóm Tắt

### Final Results

```
12 COMPANIES — FINAL SCORECARD:
═══════════════════════════════════════════════════════════════

  ✅ OFFER (7): Didi, 58, Bianlifeng, UMU, Kuaishou, Shopee,
                Tencent, ByteDance
  ❌ FAIL  (4): Jinshan, Xiaohongshu, NetEase, Gaode
  🏆 CHOSEN: (article doesn't say, but likely ByteDance/Kuaishou)

  KEY PATTERNS:
  → Code questions = MAKE OR BREAK (NetEase fail = code mess)
  → HR process varies hugely (Shopee/Kuaishou slow, 58 fast)
  → Some interviewers are arrogant/PUA (Jinshan, Gaode)
  → Difficulty ≠ Company prestige (ByteDance was SIMPLE!)
```

### Must-Know Code Problems

```
TOP CODE PROBLEMS — MUST PRACTICE:
═══════════════════════════════════════════════════════════════

  DATA STRUCTURES:
  [✓] Array to Tree (O(n) Map)        → Didi, 58, Kuaishou
  [✓] LRU Cache (Map order)           → Kuaishou
  [✓] Linked List (delete, cycle)     → Kuaishou, ByteDance
  [✓] Binary Tree (BFS, DFS, levels)  → Shopee, Tencent, ByteDance

  ASYNC PATTERNS:
  [✓] Concurrency limiter             → Didi, 58, Xiaohongshu
  [✓] fetchWithRetry                  → ByteDance
  [✓] sleep                           → Bianlifeng, ByteDance
  [✓] Sequential Promise output       → Shopee

  UTILITIES:
  [✓] Deep Clone (WeakMap circular)   → Shopee
  [✓] EventEmitter (on/off/emit/once) → Xiaohongshu
  [✓] Throttle/Debounce               → Didi, Kuaishou, Bianlifeng
  [✓] compose (Koa onion)             → NetEase, UMU
  [✓] VDOM → Real DOM                 → Tencent

  OUTPUT QUESTIONS:
  [✓] Event loop order                → 58, Xiaohongshu, Shopee
  [✓] this binding                    → Kuaishou, Tencent
  [✓] Scope chain                     → Shopee
  [✓] Prototype chain                 → Shopee
  [✓] typeof chain                    → Kuaishou
```

### Checklist — Part 2

- [ ] compose: dispatch(i) pattern, next = dispatch(i+1)
- [ ] Backspace string: stack-based, "<-" detection (i += 2)
- [ ] typeof typeof typeof null = "string"
- [ ] createRepeat: setInterval + count + clearInterval
- [ ] LRU: Map insertion order, delete+set = "move to end"
- [ ] Delete linked list node: O(1) trick (copy next value)
- [ ] Deep clone: WeakMap circular, Reflect.ownKeys, Date/RegExp
- [ ] Binary tree right view: DFS right-first, depth === result.length
- [ ] Scope: lexical scope (where DEFINED, not where CALLED)
- [ ] Prototype: constructor overwrites Foo.a but NOT prototype.a
- [ ] Layer sum: BFS queue, levelSize = queue.length pattern
- [ ] VDOM → DOM: createElement + setAttribute + recursive children
- [ ] Level order traversal: BFS, size-based level grouping
- [ ] fetchWithRetry: recursive .catch or for-loop with delay
- [ ] Linked list cycle entry: Floyd's algorithm, 2-pointer reset
- [ ] Duplicated words: while loop grouping + regex /(.)\1+/g
- [ ] Arrow vs regular this: arrow = lexical, cannot new
- [ ] Promise.then(null,fn) vs .catch: .catch catches .then errors too

---

_Nguồn: 路从今夜白丶 — juejin.cn/post/7142690757722243102_
_Part 1: Didi, 58, Jinshan, Bianlifeng, Xiaohongshu, UMU_
_Cập nhật lần cuối: Tháng 2, 2026_
