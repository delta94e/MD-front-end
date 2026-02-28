# 7 Classic JS Coding Interview Problems — Deep Dive

> 📅 2026-02-12 · ⏱ 18 phút đọc
>
> Shallow/Deep Copy → Array Dedup → Throttle/Debounce → Drag & Drop →
> Big Number Addition → Template Engine → Closures
> Độ khó: ⭐️⭐️⭐️⭐️ | Bài toán coding phỏng vấn kinh điển

---

## Mục Lục

| #   | Section                                |
| --- | -------------------------------------- |
| 1   | Shallow Copy vs Deep Copy              |
| 2   | Array Deduplication                    |
| 3   | Search Box: Throttle, Debounce & Abort |
| 4   | Drag & Drop (Mouse Events)             |
| 5   | Large Number Addition (String Math)    |
| 6   | Simple Template Engine                 |
| 7   | Closures — Use Cases                   |
| 8   | Summary & Interview Checklist          |

---

## §1. Shallow Copy vs Deep Copy

```
WHY WE NEED COPY:
═══════════════════════════════════════════════════════════════

  Objects & arrays = REFERENCE types!
  → Assigning to variable = copying the REFERENCE ADDRESS
  → Modifying the copy ALSO modifies the original! 💀

  const obj1 = { a: 1, b: { c: 2 } };
  const obj2 = obj1;       // ← Same reference!
  obj2.a = 999;
  console.log(obj1.a);     // 999! 💀 Original changed!

  SOLUTION: Make a COPY (new memory, independent data)
  → Shallow Copy: copies top-level only (nested = still shared!)
  → Deep Copy: copies EVERYTHING recursively (fully independent!)

  ┌──────────────┬────────────────────┬────────────────────────┐
  │              │ Shallow Copy       │ Deep Copy              │
  ├──────────────┼────────────────────┼────────────────────────┤
  │ Top-level    │ ✅ Independent     │ ✅ Independent         │
  │ Nested obj   │ ❌ Still shared!   │ ✅ Independent         │
  │ Performance  │ ✅ Fast            │ ⚠️ Slower (recursive)  │
  └──────────────┴────────────────────┴────────────────────────┘
```

### 1a. Shallow Copy Methods

```javascript
const obj1 = { a: 1, b: { c: 2 } };

// ① Object.assign
const obj2 = Object.assign({}, obj1);
obj2.b.c = 999;
console.log(obj1.b.c); // 999! 💀 Nested still shared!

// ② ES6 Spread (destructuring)
const obj3 = { ...obj1 };
obj3.b.c = 888;
console.log(obj1.b.c); // 888! 💀 Same problem!

// ③ Manual iteration
function shallowCopy(source) {
  const target = {};
  for (let key in source) {
    if (source.hasOwnProperty(key)) {
      target[key] = source[key]; // Only top-level!
    }
  }
  return target;
}

// ④ Array: slice()
const arr1 = [1, 2, [3, 4]];
const arr2 = arr1.slice();
arr2[2][0] = 999;
console.log(arr1[2][0]); // 999! 💀 Nested shared!

// ⑤ Array: concat()
const arr3 = [].concat(arr1);

// ⑥ Array: spread
const arr4 = [...arr1];
```

```
SHALLOW COPY — ALL 6 METHODS SUMMARY:
═══════════════════════════════════════════════════════════════

  OBJECTS:
  ① Object.assign({}, obj)
  ② { ...obj }
  ③ Manual for...in loop

  ARRAYS:
  ④ arr.slice()
  ⑤ [].concat(arr)
  ⑥ [...arr]

  ALL share the SAME limitation:
  → Top-level properties: copied (independent)
  → Nested objects/arrays: STILL SHARED REFERENCES!
```

### 1b. Deep Copy Methods

```javascript
// ① JSON.stringify + JSON.parse (quick & dirty)
const obj1 = { a: 1, b: { c: 2 } };
const obj2 = JSON.parse(JSON.stringify(obj1));
obj2.b.c = 999;
console.log(obj1.b.c); // 2! ✅ Independent!
```

```
JSON METHOD — 7 FATAL FLAWS:
═══════════════════════════════════════════════════════════════

  const obj = {
      a: undefined,        // ❌ LOST! (key disappears entirely)
      b: function() {},    // ❌ LOST! (functions stripped)
      c: Symbol('x'),      // ❌ LOST! (Symbols stripped)
      d: NaN,              // ❌ Becomes null!
      e: Infinity,         // ❌ Becomes null!
      f: new Date(),       // ❌ Becomes string! (not Date object)
      g: /regex/gi,        // ❌ Becomes empty object {}!
  };

  JSON.parse(JSON.stringify(obj));
  // → { d: null, e: null, f: "2026-02-12T...", g: {} }
  // a, b, c are GONE! 💀

  ALSO:
  → ❌ Circular references → throws TypeError!
  → ❌ Map, Set, BigInt → lost or throws!

  WHEN TO USE:
  → Quick clone of simple objects (numbers, strings, booleans)
  → No functions, no special types, no circular refs
```

```javascript
// ② Recursive deep clone (basic version)
function clone(source) {
  if (source === null || typeof source !== "object") {
    return source;
  }

  const target = Array.isArray(source) ? [] : {};
  for (let key in source) {
    if (source.hasOwnProperty(key)) {
      if (typeof source[key] === "object" && source[key] !== null) {
        target[key] = clone(source[key]); // Recurse!
      } else {
        target[key] = source[key];
      }
    }
  }
  return target;
}
```

```
RECURSIVE CLONE — 3 PROBLEMS:
═══════════════════════════════════════════════════════════════

  ① Circular references → INFINITE RECURSION → STACK OVERFLOW! 💀
     const obj = {};
     obj.self = obj;  // Circular!
     clone(obj);      // 💀 Maximum call stack exceeded!

  ② Deep nesting → stack overflow (no tail-call optimization)
     1000 levels deep → may crash!

  ③ Missing special types: Date, RegExp, Map, Set, Symbol
```

```javascript
// ③ Production-ready deep clone (WeakMap for circular refs!)
function deepClone(source, hash = new WeakMap()) {
  // Primitives & null
  if (source === null || typeof source !== "object") {
    return source;
  }

  // Circular reference detection!
  if (hash.has(source)) {
    return hash.get(source); // Return cached clone!
  }

  // Handle special types
  if (source instanceof Date) return new Date(source);
  if (source instanceof RegExp) return new RegExp(source);
  if (source instanceof Map) {
    const mapClone = new Map();
    hash.set(source, mapClone);
    source.forEach((val, key) => {
      mapClone.set(deepClone(key, hash), deepClone(val, hash));
    });
    return mapClone;
  }
  if (source instanceof Set) {
    const setClone = new Set();
    hash.set(source, setClone);
    source.forEach((val) => {
      setClone.add(deepClone(val, hash));
    });
    return setClone;
  }

  // Object / Array
  const target = Array.isArray(source) ? [] : {};
  hash.set(source, target); // Cache BEFORE recursing!

  // Use Reflect.ownKeys to include Symbol keys!
  Reflect.ownKeys(source).forEach((key) => {
    target[key] = deepClone(source[key], hash);
  });

  return target;
}

// Test circular references:
const obj = { a: 1 };
obj.self = obj;
const copy = deepClone(obj);
console.log(copy.self === copy); // true ✅ (circular preserved!)
console.log(copy !== obj); // true ✅ (different object!)
```

```javascript
// ④ structuredClone() — MODERN NATIVE API (2022+)
const obj1 = { a: 1, b: { c: 2 }, d: new Date() };
obj1.self = obj1; // Circular!

const obj2 = structuredClone(obj1);
// ✅ Handles: circular refs, Date, RegExp, Map, Set, ArrayBuffer
// ❌ Cannot clone: functions, DOM nodes, Symbol properties

// BEST for production when available!
```

```
DEEP COPY — 4 METHODS COMPARISON:
═══════════════════════════════════════════════════════════════

  ┌──────────────────┬──────┬────────┬──────┬───────┬────────┐
  │ Method           │ Circ │ Func   │ Date │ Perf  │ Ease   │
  ├──────────────────┼──────┼────────┼──────┼───────┼────────┤
  │ JSON             │ ❌   │ ❌     │ ❌   │ ✅    │ ⭐⭐⭐ │
  │ Recursive        │ ❌   │ ✅     │ ❌   │ ⚠️    │ ⭐⭐   │
  │ WeakMap clone    │ ✅   │ ✅     │ ✅   │ ✅    │ ⭐     │
  │ structuredClone  │ ✅   │ ❌     │ ✅   │ ✅    │ ⭐⭐⭐ │
  └──────────────────┴──────┴────────┴──────┴───────┴────────┘

  Interview progression:
  → Start with JSON (know the flaws!)
  → Show recursive (basic)
  → Add WeakMap for circular refs (impressive!)
  → Mention structuredClone for production (modern!)
```

---

## §2. Array Deduplication

```
5 METHODS TO DEDUPLICATE AN ARRAY:
═══════════════════════════════════════════════════════════════

  const arr = [1, 2, 3, 4, 2, 5, 4, 6, 7, 6, 8];
  Expected: [1, 2, 3, 4, 5, 6, 7, 8]
```

```javascript
// ① Object as hash map (O(n) — fastest!)
function dedupByObj(arr) {
  const seen = {};
  const result = [];
  arr.forEach((item) => {
    if (!seen[item]) {
      result.push(item);
      seen[item] = true;
    }
  });
  return result;
}
// ⚠️ Flaw: obj keys are strings → 1 and "1" treated as same!
// Fix: use Map instead of plain object

// ② Set + Array.from (ES6 — cleanest!)
const dedup = (arr) => [...new Set(arr)];
// Or: Array.from(new Set(arr))
// ✅ Handles: NaN (only one kept!), undefined
// ⚠️ Cannot dedup objects: {} !== {} (different references)

// ③ Map (handles type coercion issue)
function dedupByMap(arr) {
  const map = new Map();
  const result = [];
  arr.forEach((item) => {
    if (!map.has(item)) {
      map.set(item, true);
      result.push(item);
    }
  });
  return result;
}
// ✅ Distinguishes 1 and "1" correctly!

// ④ filter + indexOf
const dedupFilter = (arr) => arr.filter((item, i) => arr.indexOf(item) === i);
// ⚠️ O(n²) — indexOf iterates for each element!

// ⑤ reduce + includes
const dedupReduce = (arr) =>
  arr.reduce((acc, cur) => {
    return acc.includes(cur) ? acc : [...acc, cur];
  }, []);
// ⚠️ Also O(n²) — includes iterates each time
```

```
DEDUP COMPARISON:
═══════════════════════════════════════════════════════════════

  ┌─────────────────┬────────┬────────────────────────────────┐
  │ Method          │ Time   │ Notes                          │
  ├─────────────────┼────────┼────────────────────────────────┤
  │ Object hash     │ O(n)   │ ⚠️ 1 === "1" type issue       │
  │ Set             │ O(n)   │ ✅ Best! Clean, handles NaN   │
  │ Map             │ O(n)   │ ✅ No type coercion issues    │
  │ filter+indexOf  │ O(n²)  │ ⚠️ Slow for large arrays     │
  │ reduce+includes │ O(n²)  │ ⚠️ Slow for large arrays     │
  └─────────────────┴────────┴────────────────────────────────┘

  Interview answer: [...new Set(arr)] and explain WHY it works!
```

---

## §3. Search Box: Throttle, Debounce & Abort

```
SEARCH BOX — 3 PROBLEMS TO SOLVE:
═══════════════════════════════════════════════════════════════

  User types "a" → "ab" → "abc" rapidly

  Problem ①: TOO MANY REQUESTS!
  → Every keystroke = 1 API call = terrible!
  → Solution: DEBOUNCE (wait until user stops typing)

  Problem ②: REQUESTS RETURN OUT OF ORDER!
  → Request for "a" returns AFTER request for "abc"
  → User sees results for "a" instead of "abc"! 💀
  → Solution: ABORT previous request before sending new one

  Problem ③: SCROLL/RESIZE events fire too frequently
  → Solution: THROTTLE (max 1 call per time window)
```

### 3a. Throttle vs Debounce

```
THROTTLE vs DEBOUNCE — THE DIFFERENCE:
═══════════════════════════════════════════════════════════════

  THROTTLE: Execute AT MOST once per N ms
  → Like a turnstile: 1 person per 3 seconds, no matter how many push

  DEBOUNCE: Execute ONLY after N ms of SILENCE
  → Like elevator door: resets timer each time someone enters

  Timeline (each | is an event, ✓ is execution):

  THROTTLE (300ms):
  Events:  |  |  |  |  |  |               |  |  |
  Execute: ✓           ✓                  ✓

  DEBOUNCE (300ms):
  Events:  |  |  |  |  |  |               |  |  |
  Execute:                   ✓                      ✓
  (only after 300ms silence!)

  ┌────────────┬──────────────────┬────────────────────────┐
  │            │ Throttle         │ Debounce               │
  ├────────────┼──────────────────┼────────────────────────┤
  │ When       │ Every N ms       │ After N ms silence     │
  │ Guarantee  │ Max 1 per N ms   │ Only last call runs    │
  │ Use case   │ scroll, resize,  │ search input, form     │
  │            │ mousemove        │ validation, window     │
  │            │                  │ resize (final value)   │
  └────────────┴──────────────────┴────────────────────────┘
```

```javascript
// THROTTLE — at most once per duration
function throttle(fn, duration) {
  let flag = true;
  return function (...args) {
    if (flag) {
      flag = false;
      setTimeout(() => {
        fn.apply(this, args);
        flag = true;
      }, duration);
    }
  };
}

// Alternative: timestamp-based throttle (leading edge)
function throttleLeading(fn, duration) {
  let lastTime = 0;
  return function (...args) {
    const now = Date.now();
    if (now - lastTime >= duration) {
      lastTime = now;
      fn.apply(this, args);
    }
  };
}

// DEBOUNCE — only after silence
function debounce(fn, duration) {
  let timer = null;
  return function (...args) {
    if (timer) {
      clearTimeout(timer);
      timer = null;
    }
    timer = setTimeout(() => {
      fn.apply(this, args);
      timer = null;
    }, duration);
  };
}

// DEBOUNCE with immediate first call (leading edge)
function debounceImmediate(fn, duration) {
  let timer = null;
  return function (...args) {
    const callNow = !timer; // First call?
    clearTimeout(timer);
    timer = setTimeout(() => {
      timer = null;
    }, duration);
    if (callNow) fn.apply(this, args); // Execute immediately!
  };
}
```

### 3b. Abort Previous Requests

```javascript
// ❌ PROBLEM: Out-of-order responses
// User types "a" → request A sent
// User types "ab" → request B sent
// Response B arrives first → shows "ab" results ✅
// Response A arrives later → OVERWRITES with "a" results 💀

// ✅ SOLUTION 1: AbortController (modern, recommended!)
let controller = null;

function search(query) {
  // Abort previous request!
  if (controller) {
    controller.abort();
  }
  controller = new AbortController();

  fetch(`/api/search?q=${query}`, {
    signal: controller.signal,
  })
    .then((res) => res.json())
    .then((data) => renderResults(data))
    .catch((err) => {
      if (err.name === "AbortError") {
        console.log("Previous request aborted"); // Expected!
      }
    });
}

// ✅ SOLUTION 2: XMLHttpRequest.abort() (legacy)
let xhr = null;

function searchXHR(query) {
  if (xhr) {
    xhr.abort(); // Cancel previous!
  }
  xhr = new XMLHttpRequest();
  xhr.open("GET", `/api/search?q=${query}`);
  xhr.onload = () => renderResults(JSON.parse(xhr.responseText));
  xhr.send();
}

// ✅ COMPLETE SEARCH BOX:
const searchInput = document.getElementById("search");
const debouncedSearch = debounce(search, 300);
searchInput.addEventListener("input", (e) => {
  debouncedSearch(e.target.value);
});
```

---

## §4. Drag & Drop (Mouse Events)

```
DRAG & DROP — CORE CONCEPT:
═══════════════════════════════════════════════════════════════

  3 EVENTS:
  mousedown → Record initial position
  mousemove → Calculate distance, update position
  mouseup   → Remove mousemove listener

  KEY INSIGHT:
  → Bind mousemove on DOCUMENT.BODY, not on the box!
  → Why? Fast mouse movement can leave the box → event lost!
  → Body covers entire page → always captures mouse position

  COORDINATE MATH:
  → On mousedown: save box's offsetLeft/offsetTop + mouse pageX/pageY
  → On mousemove: distance = currentPageX - initialPageX
  → New position = initialBoxLeft + distanceX
```

```javascript
// Complete Drag & Drop Implementation
function makeDraggable(element) {
  let boxLeft = 0;
  let boxTop = 0;
  let initX = 0;
  let initY = 0;

  element.addEventListener("mousedown", mouseDown);

  function mouseDown(e) {
    e.preventDefault(); // Prevent text selection!

    // Save initial positions
    initX = e.pageX;
    initY = e.pageY;
    boxLeft = element.offsetLeft;
    boxTop = element.offsetTop;

    // Bind to document.body for full coverage!
    document.body.addEventListener("mousemove", mouseMove);
    document.body.addEventListener("mouseup", mouseUp);
  }

  function mouseMove(e) {
    const distanceX = e.pageX - initX;
    const distanceY = e.pageY - initY;
    element.style.left = boxLeft + distanceX + "px";
    element.style.top = boxTop + distanceY + "px";
  }

  function mouseUp() {
    // Clean up listeners!
    document.body.removeEventListener("mousemove", mouseMove);
    document.body.removeEventListener("mouseup", mouseUp);
  }
}

// Usage:
// <div id="box" style="position:absolute; width:100px; height:100px;
//                       background:red; cursor:grab;"></div>
const box = document.getElementById("box");
makeDraggable(box);
```

```
DRAG & DROP — KEY DETAILS:
═══════════════════════════════════════════════════════════════

  ✅ e.preventDefault() → prevents text selection during drag
  ✅ mousemove on body → captures even when mouse leaves box
  ✅ mouseup removes listener → stops dragging
  ✅ Uses offsetLeft/offsetTop → absolute position of element
  ✅ Uses pageX/pageY → mouse position relative to document

  ⚠️ Note: Must add 'px' suffix to style.left and style.top!

  TOUCH SUPPORT (mobile):
  → touchstart instead of mousedown
  → touchmove instead of mousemove
  → touchend instead of mouseup
  → e.touches[0].pageX instead of e.pageX
```

---

## §5. Large Number Addition (String Math)

```
PROBLEM:
═══════════════════════════════════════════════════════════════

  JavaScript Number range: (-2^53, 2^53) — ~16 digits
  Beyond this range → PRECISION LOSS!

  9007199254740992 + 1 === 9007199254740992  // 💀 Wrong!

  Backend returns: "99999999999999999999" (20 digits)
  → Cannot convert to Number (precision lost!)
  → Cannot add strings directly (concatenation!)
  → Must simulate MANUAL ADDITION digit by digit!

  ALGORITHM — Grade School Addition:
     1 2 3 4 5
   + 5 6 7 8 9
   ─────────────
     6 9 1 3 4

  → Reverse both strings (start from ones digit)
  → Add digit by digit with carry
  → If sum > 9 → carry = 1, push sum % 10
  → Reverse result
```

```javascript
function addLargeNumbers(str1, str2) {
  const arr1 = str1.split("").reverse();
  const arr2 = str2.split("").reverse();
  const result = [];
  let carry = 0;

  while (arr1.length || arr2.length || carry) {
    const num1 = Number(arr1.shift() || 0);
    const num2 = Number(arr2.shift() || 0);
    const sum = num1 + num2 + carry;

    if (sum > 9) {
      carry = 1;
      result.push(sum % 10);
    } else {
      carry = 0;
      result.push(sum);
    }
  }

  return result.reverse().join("");
}

// Test:
console.log(addLargeNumbers("99999999999999999999", "1"));
// → "100000000000000000000" ✅

console.log(addLargeNumbers("12345", "56789"));
// → "69134" ✅

// Modern alternative: BigInt (ES2020)
console.log(99999999999999999999n + 1n);
// → 100000000000000000000n ✅
// But BigInt is not supported in all environments
```

```
LARGE NUMBER — KEY POINTS:
═══════════════════════════════════════════════════════════════

  ① Reverse strings → process from ones digit (right to left)
  ② shift() returns undefined for empty array → || 0 handles it
  ③ carry persists between iterations
  ④ while condition: arr1.length || arr2.length || carry
     → Handles different lengths AND final carry!
  ⑤ Result is reversed back at the end

  EDGE CASES:
  → Different lengths: "123" + "4567" → handled by || 0
  → Final carry: "999" + "1" → "1000" (carry = 1 after last digit)
  → Leading zeros: not an issue (standard string input)

  BigInt alternative: suffix n → 123n + 456n = 579n
  → Not supported in JSON.parse
  → Cannot mix with Number: 1n + 1 throws TypeError!
```

---

## §6. Simple Template Engine

```
PROBLEM:
═══════════════════════════════════════════════════════════════

  Template: "Hello, I'm {{name}}, age: {{info.age}}"
  Data: { name: 'Jun', info: { age: 25 } }
  Result: "Hello, I'm Jun, age: 25"

  KEY TECHNIQUE:
  → String.replace() 2nd arg can be a CALLBACK FUNCTION!
  → regex captures {{...}} → callback resolves the data path
  → Nested paths like "info.age" → split('.') and traverse
```

```javascript
function compile(template, data) {
  const regex = /\{\{([^}]*)\}\}/g;

  return template.replace(regex, function (match, path) {
    // match = "{{info.age}}", path = "info.age"
    const keys = path.trim().split(".");
    return getNestedValue(data, keys);
  });
}

function getNestedValue(obj, keys) {
  return keys.reduce((acc, key) => {
    return acc != null ? acc[key] : undefined;
  }, obj);
}

// Test:
const tpl =
  "<p>hello, I am {{name}}, age: {{info.age}}, " +
  "company: {{info.experience.company}}, " +
  "time: {{info.experience.time}}</p>";

const data = {
  name: "Jun",
  info: {
    age: 25,
    experience: {
      company: "Google",
      time: "2 years",
    },
  },
};

console.log(compile(tpl, data));
// <p>hello, I am Jun, age: 25, company: Google, time: 2 years</p>
```

```
TEMPLATE ENGINE — KEY DETAILS:
═══════════════════════════════════════════════════════════════

  REGEX BREAKDOWN:
  /\{\{([^}]*)\}\}/g
  │ │   │      │ │
  │ │   │      │ └─ g flag: replace ALL matches
  │ │   │      └─── literal }}
  │ │   └──────── capture group: anything except }
  │ └──────────── literal {{
  └────────────── regex delimiter

  replace() callback params:
  → match: full match "{{info.age}}"
  → $1: capture group "info.age"
  → return value: replaces the match in result string

  NESTED PATH RESOLUTION:
  "info.experience.company"
  → split('.') → ["info", "experience", "company"]
  → reduce: data["info"]["experience"]["company"]
  → Returns: "Google"

  PRODUCTION TEMPLATE ENGINES:
  → Handlebars, Mustache, EJS, Pug
  → They add: conditionals, loops, helpers, partials
```

---

## §7. Closures — Use Cases

```
CLOSURE = FUNCTION + LEXICAL ENVIRONMENT:
═══════════════════════════════════════════════════════════════

  A closure is created when an INNER function accesses
  variables from its OUTER function's scope,
  EVEN AFTER the outer function has returned.

  TWO BENEFITS:
  ① External code can access variables inside a function
  ② Variables inside the function persist in memory
     (not garbage-collected after function returns!)

  5 CLASSIC USE CASES:
  → ① Module pattern (private variables)
  → ② Currying
  → ③ Throttle & Debounce (timer persists!)
  → ④ Event loop + loop index fix
  → ⑤ bind implementation
```

```javascript
// ① Module Pattern — private variables
function createCounter() {
  let count = 0; // Private! Can't access from outside!

  return {
    increment() {
      return ++count;
    },
    decrement() {
      return --count;
    },
    getCount() {
      return count;
    },
  };
}

const counter = createCounter();
counter.increment(); // 1
counter.increment(); // 2
counter.getCount(); // 2
// counter.count → undefined (private!)

// ② Currying
function multiply(a) {
  return function (b) {
    return a * b; // 'a' remembered via closure!
  };
}
const double = multiply(2);
double(5); // 10
double(10); // 20

// ③ Loop index fix (classic interview question!)
// ❌ BUG:
for (var i = 0; i < 3; i++) {
  setTimeout(() => console.log(i), 1000);
}
// Prints: 3, 3, 3 (var is function-scoped, i = 3 after loop!)

// ✅ FIX with closure (IIFE):
for (var i = 0; i < 3; i++) {
  (function (j) {
    setTimeout(() => console.log(j), 1000);
  })(i);
}
// Prints: 0, 1, 2 (j captured at each iteration!)

// ✅ Modern fix: just use let!
for (let i = 0; i < 3; i++) {
  setTimeout(() => console.log(i), 1000);
}
// Prints: 0, 1, 2 (let creates new binding per iteration!)

// ④ Throttle/Debounce use closures!
function debounce(fn, delay) {
  let timer = null; // ← Persists across calls via closure!
  return function (...args) {
    clearTimeout(timer);
    timer = setTimeout(() => fn.apply(this, args), delay);
  };
}
// 'timer' lives in closure → not garbage-collected
// → Debounce function "remembers" previous timer!

// ⑤ Bind implementation uses closure
Function.prototype.myBind = function (context, ...args) {
  const fn = this; // ← Captured in closure!
  return function (...innerArgs) {
    return fn.apply(context, [...args, ...innerArgs]);
  };
};
```

```
CLOSURE — MEMORY LEAK WARNING:
═══════════════════════════════════════════════════════════════

  ⚠️ Closures keep variables in memory!
  → If closure references DOM elements → DOM can't be GC'd!
  → If closure is never released → memory leak!

  PREVENTION:
  → Set closure variable to null when done
  → Remove event listeners that create closures
  → Use WeakRef / WeakMap for DOM references
```

---

## §8. Summary & Interview Checklist

### Checklist

- [ ] **Shallow copy**: Object.assign, spread, slice — top-level only, nested = shared!
- [ ] **Deep copy JSON**: `JSON.parse(JSON.stringify())` — loses undefined, functions, Symbol, Date, RegExp, NaN
- [ ] **Deep copy recursive**: basic for...in + typeof check → fails on circular refs
- [ ] **Deep copy WeakMap**: hash map prevents infinite recursion on circular refs
- [ ] **structuredClone**: modern native API, handles circular + Date + Map/Set, NO functions
- [ ] **Array dedup**: `[...new Set(arr)]` best! O(n), handles NaN
- [ ] **Object dedup**: ⚠️ keys are strings → 1 and "1" same! Use Map instead
- [ ] **Throttle**: at most once per N ms (scroll, resize, mousemove)
- [ ] **Debounce**: only after N ms silence (search input, form validation)
- [ ] **Throttle vs debounce**: throttle = turnstile, debounce = elevator door
- [ ] **AbortController**: abort previous fetch before sending new one
- [ ] **XHR.abort()**: legacy version of AbortController
- [ ] **Drag & drop**: mousedown (save init) → mousemove on BODY → mouseup (cleanup)
- [ ] **Why body**: fast mouse can leave box → event lost if bound to box only
- [ ] **Large number add**: reverse → digit-by-digit + carry → reverse result
- [ ] **while condition**: `arr1.length || arr2.length || carry` handles all edge cases
- [ ] **Template engine**: regex `\{\{([^}]*)\}\}` + replace callback + reduce for nested paths
- [ ] **Closures**: function + lexical env. Benefits: private vars + memory persistence
- [ ] **Closure uses**: module pattern, currying, throttle/debounce, loop fix, bind
- [ ] **Closure risk**: memory leak if references never released!

---

_Nguồn: "7 Classic JS Coding Interview Problems" — Pekings (稀土掘金)_
_Cập nhật lần cuối: Tháng 2, 2026_
