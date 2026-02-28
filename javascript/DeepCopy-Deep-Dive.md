# Deep Copy — Ultimate Exploration (90% Don't Know This)

> 📅 2026-02-12 · ⏱ 15 phút đọc
>
> 4 phương pháp: clone, cloneJSON, cloneLoop, cloneForce
> Topics: Stack Overflow, Circular Reference, Reference Preservation, Performance
> Độ khó: ⭐️⭐️⭐️⭐️⭐️ | Chủ đề: Algorithm / Interview Must-Know

---

## Mục Lục

0. [Deep Copy vs Shallow Copy](#basics)
1. [Method 1: Recursive clone — Simple But Flawed](#clone)
2. [Method 2: JSON — One-Liner Magic](#clone-json)
3. [Method 3: Loop — Solve Stack Overflow](#clone-loop)
4. [Method 4: Force — Preserve References](#clone-force)
5. [Performance Benchmark](#performance)
6. [Production-Ready Deep Clone](#production)
7. [Tóm Tắt & Checklist](#tóm-tắt)

---

## §0. Deep Copy vs Shallow Copy

```
VALUE TYPE vs REFERENCE TYPE:
═══════════════════════════════════════════════════════════════

  VALUE TYPE (primitive):
  var a = 1;
  var b = a;   // COPY value
  a = 2;
  console.log(a, b); // 2, 1 → INDEPENDENT!

  REFERENCE TYPE (object):
  var a = { c: 1 };
  var b = a;   // COPY reference (memory address!)
  a.c = 2;
  console.log(a.c, b.c); // 2, 2 → SAME object! 💀

  → Modify a → b cũng bị thay đổi!
  → Cần DEEP COPY để tách biệt!
```

```
SHALLOW vs DEEP — DIFFERENCE:
═══════════════════════════════════════════════════════════════

  var a1 = { b: { c: {} } };

  SHALLOW COPY: chỉ copy LEVEL 1
  var a2 = shallowClone(a1);
  a2.b.c === a1.b.c  // TRUE! → level 2+ vẫn CÙNG reference!

  DEEP COPY: copy TẤT CẢ levels
  var a3 = deepClone(a1);
  a3.b.c === a1.b.c  // FALSE! → hoàn toàn INDEPENDENT!

  ┌─────────────────────────────────────────────────────────┐
  │ Shallow:  a1.b ≠ a2.b ✅  BUT  a1.b.c === a2.b.c ❌  │
  │ Deep:     a1.b ≠ a3.b ✅  AND  a1.b.c ≠ a3.b.c ✅    │
  └─────────────────────────────────────────────────────────┘
```

```javascript
// Shallow Clone — simple iteration
function shallowClone(source) {
  var target = {};
  for (var i in source) {
    if (source.hasOwnProperty(i)) {
      target[i] = source[i]; // Chỉ copy level 1!
    }
  }
  return target;
}

// Other shallow clone methods:
// Object.assign({}, source)
// { ...source }  (spread operator)
// Array: [...arr], arr.slice(), arr.concat()
```

---

## §1. Method 1: Recursive clone — Simple But Flawed ⭐

```
IDEA: Shallow Copy + RECURSION = Deep Copy!
═══════════════════════════════════════════════════════════════

  Gặp property là object → RECURSIVE clone!
  Gặp property là primitive → copy trực tiếp!
```

```javascript
function clone(source) {
  var target = {};
  for (var i in source) {
    if (source.hasOwnProperty(i)) {
      if (typeof source[i] === "object") {
        target[i] = clone(source[i]); // ⭐ RECURSIVE!
      } else {
        target[i] = source[i];
      }
    }
  }
  return target;
}
```

```
4 PROBLEMS — INTERVIEWER SẼ HỎI:
═══════════════════════════════════════════════════════════════

  ① NO PARAMETER VALIDATION:
  → clone(null) → crash! (typeof null === 'object')
  → clone(123)  → returns {} (wrong!)

  ② OBJECT CHECK NOT RIGOROUS:
  → typeof null === 'object' → BUG!
  → typeof [] === 'object' → mất Array type!
  → typeof new Date() === 'object' → mất Date!

  ③ ARRAY NOT HANDLED:
  → Array bị convert thành Object! { 0: 'a', 1: 'b' }
  → Cần: Array.isArray(source) ? [] : {}

  ④ STACK OVERFLOW (FATAL! 💀):
  → Data quá sâu (>10,000 levels) → Maximum call stack!
  → Circular reference: a.a = a → INFINITE LOOP → crash!
```

```javascript
// Fix ① ②: proper validation
function isObject(x) {
  return Object.prototype.toString.call(x) === "[object Object]";
}

function clone(source) {
  if (!isObject(source)) return source; // ① Validation!
  // ...
}
```

```
STACK OVERFLOW — TEST:
═══════════════════════════════════════════════════════════════

  // Generate test data: depth × breadth
  function createData(deep, breadth) {
      var data = {};
      var temp = data;
      for (var i = 0; i < deep; i++) {
          temp = temp['data'] = {};
          for (var j = 0; j < breadth; j++) {
              temp[j] = j;
          }
      }
      return data;
  }

  clone(createData(1000));   // ✅ OK
  clone(createData(10000));  // ❌ Maximum call stack size exceeded!
  clone(createData(10, 100000)); // ✅ OK (breadth doesn't overflow!)

  → DEPTH causes overflow, NOT breadth!

  CIRCULAR REFERENCE:
  var a = {};
  a.a = a;       // Self-reference!
  clone(a);      // ❌ INFINITE LOOP → stack overflow! 💀
```

---

## §2. Method 2: JSON — One-Liner Magic ⭐⭐

```javascript
function cloneJSON(source) {
  return JSON.parse(JSON.stringify(source));
}
```

```
cloneJSON — ANALYSIS:
═══════════════════════════════════════════════════════════════

  ✅ PROS:
  → 1 dòng code! Extremely simple!
  → Built-in, no dependencies

  ❌ CONS:
  → Stack overflow VẪN XẢY RA (internally recursive!)
     cloneJSON(createData(10000)); // ❌ Maximum call stack!

  → CIRCULAR REFERENCE: detected and THROWS ERROR!
     var a = {}; a.a = a;
     cloneJSON(a); // ❌ TypeError: circular structure to JSON
     → JSON.stringify internally has LOOP DETECTION!
     → Better than infinite loop, but still fails!

  → LOSES DATA TYPES:
     → undefined → DELETED (disappears!)
     → Function → DELETED
     → Symbol → DELETED
     → Date → becomes string "2024-01-01T..."
     → RegExp → becomes {} !!!
     → NaN → becomes null
     → Infinity → becomes null
     → Map, Set → becomes {}
     → BigInt → TypeError!

  VERDICT: Simple but MANY limitations!
  → OK for simple JSON-compatible data
  → NOT OK for complex objects!
```

```
WHAT JSON.stringify DROPS:
═══════════════════════════════════════════════════════════════

  const obj = {
      str: "hello",        // ✅ kept
      num: 42,             // ✅ kept
      bool: true,          // ✅ kept
      nul: null,           // ✅ kept
      arr: [1, 2],         // ✅ kept
      nested: { a: 1 },    // ✅ kept

      undef: undefined,    // ❌ DELETED
      func: () => {},      // ❌ DELETED
      sym: Symbol('x'),    // ❌ DELETED
      date: new Date(),    // ⚠️ → string!
      regex: /hello/gi,    // ⚠️ → {}
      nan: NaN,            // ⚠️ → null
      inf: Infinity,       // ⚠️ → null
      map: new Map(),      // ⚠️ → {}
      set: new Set(),      // ⚠️ → {}
  };
```

---

## §3. Method 3: Loop — Solve Stack Overflow ⭐⭐⭐

```
KEY INSIGHT: Object = TREE STRUCTURE!
═══════════════════════════════════════════════════════════════

  var a = { a1: 1, a2: { b1: 1, b2: { c1: 1 } } }

  Visualize as tree:
        a
      /   \
    a1     a2
    |     / \
    1   b1   b2
        |    |
        1    c1
              |
              1

  TREE TRAVERSAL: recursion → STACK (loop)!
  → DFS with explicit stack → NO stack overflow!
  → Stack stores: { parent, key, data }
```

```javascript
function cloneLoop(x) {
  const root = {};

  // Explicit stack (replaces call stack!)
  const loopList = [
    {
      parent: root,
      key: undefined,
      data: x,
    },
  ];

  while (loopList.length) {
    // DFS: pop from stack
    const node = loopList.pop();
    const parent = node.parent;
    const key = node.key;
    const data = node.data;

    // Target: key=undefined → copy to root, else to child
    let res = parent;
    if (typeof key !== "undefined") {
      res = parent[key] = {};
    }

    for (let k in data) {
      if (data.hasOwnProperty(k)) {
        if (typeof data[k] === "object") {
          // Object → push to stack (next iteration!)
          loopList.push({
            parent: res,
            key: k,
            data: data[k],
          });
        } else {
          // Primitive → copy directly
          res[k] = data[k];
        }
      }
    }
  }

  return root;
}
```

```
cloneLoop — ANALYSIS:
═══════════════════════════════════════════════════════════════

  ✅ NO STACK OVERFLOW! (explicit stack in heap memory)
  → cloneLoop(createData(10000)); // ✅ OK!
  → cloneLoop(createData(100000)); // ✅ OK!

  ❌ STILL CAN'T HANDLE:
  → Circular reference → infinite loop (no detection!)
  → Reference preservation lost (same as clone)

  HOW IT WORKS:
  ┌─────────────────────────────────────────────────────────┐
  │ Stack: [{parent: root, key: undefined, data: x}]       │
  │                                                         │
  │ Iteration 1: pop → process x's children                │
  │   → primitive: copy directly                            │
  │   → object: push {parent: res, key: k, data: obj}     │
  │                                                         │
  │ Iteration 2: pop → process next object's children      │
  │   → ... same pattern                                    │
  │                                                         │
  │ Stack empty → DONE!                                    │
  └─────────────────────────────────────────────────────────┘

  KEY: Loop stack uses HEAP memory (virtually unlimited!)
       Call stack = limited (typically ~10,000 frames)
```

---

## §4. Method 4: Force — Preserve References ⭐⭐⭐⭐

```
PROBLEM: REFERENCE LOSS!
═══════════════════════════════════════════════════════════════

  var b = {};
  var a = { a1: b, a2: b };    // a1 và a2 CÙNG reference b!

  a.a1 === a.a2  // true ✅

  var c = clone(a);             // Any of clone/cloneJSON/cloneLoop
  c.a1 === c.a2  // false ❌    // Reference LOST! Different objects!

  → 3 methods trước: a1, a2 thành 2 objects RIÊNG BIỆT!
  → Trong một số trường hợp, đây là BUG!

  SOLUTION: Track đã COPY chưa → nếu rồi → reuse copy!
```

```javascript
function cloneForce(x) {
  const uniqueList = []; // ⭐ Cache: track source → target mapping

  let root = {};
  const loopList = [{ parent: root, key: undefined, data: x }];

  while (loopList.length) {
    const node = loopList.pop();
    const parent = node.parent;
    const key = node.key;
    const data = node.data;

    let res = parent;
    if (typeof key !== "undefined") {
      res = parent[key] = {};
    }

    // ⭐ CHECK: đã copy object này chưa?
    let uniqueData = find(uniqueList, data);
    if (uniqueData) {
      parent[key] = uniqueData.target; // Reuse existing copy!
      continue; // Skip! Don't copy again!
    }

    // ⭐ SAVE: source → target mapping
    uniqueList.push({
      source: data, // Original object
      target: res, // Its copy
    });

    for (let k in data) {
      if (data.hasOwnProperty(k)) {
        if (typeof data[k] === "object") {
          loopList.push({
            parent: res,
            key: k,
            data: data[k],
          });
        } else {
          res[k] = data[k];
        }
      }
    }
  }

  return root;
}

function find(arr, item) {
  for (let i = 0; i < arr.length; i++) {
    if (arr[i].source === item) {
      return arr[i]; // Found! Already copied!
    }
  }
  return null;
}
```

```
cloneForce — VERIFICATION:
═══════════════════════════════════════════════════════════════

  ① REFERENCE PRESERVATION:
  var b = {};
  var a = { a1: b, a2: b };
  var c = cloneForce(a);
  c.a1 === c.a2  // TRUE! ✅ References preserved!

  ② CIRCULAR REFERENCE:
  var a = {};
  a.a = a;
  cloneForce(a)  // ✅ Works! No crash! No infinite loop!

  HOW circular ref works:
  → First encounter a → save to uniqueList
  → Second encounter a.a (same as a) → found in uniqueList!
  → Reuse existing copy → NO infinite loop!

  ❌ DRAWBACKS:
  ① If reference preservation NOT wanted → wrong behavior!
  ② find() is O(n) scan → total check = O(n²)! 💀
     → With many objects (>10,000) → VERY SLOW!
     → Can fix with WeakMap (O(1) lookup)!
```

```
WeakMap OPTIMIZATION (Modern Version):
═══════════════════════════════════════════════════════════════

  Thay uniqueList (array, O(n) search)
  → WeakMap (hash map, O(1) search!)
```

```javascript
// Modern cloneForce with WeakMap — O(n) total!
function cloneForceModern(x, map = new WeakMap()) {
  if (typeof x !== "object" || x === null) return x;

  // Already cloned? Return cached copy!
  if (map.has(x)) return map.get(x);

  const result = Array.isArray(x) ? [] : {};
  map.set(x, result); // Cache BEFORE recursion!

  for (const key of Reflect.ownKeys(x)) {
    result[key] = cloneForceModern(x[key], map);
  }
  return result;
}

// ✅ Circular reference handled
// ✅ Reference preserved
// ✅ O(1) lookup instead of O(n)
// ✅ Handles arrays, Symbol keys
// ⚠️ Still recursive (stack overflow for ultra-deep data)
```

---

## §5. Performance Benchmark

```
BENCHMARK — FIXED BREADTH = 100, VARYING DEPTH:
═══════════════════════════════════════════════════════════════

  Measure: số lần clone trong 1 giây (higher = better)

  ┌───────┬────────┬───────────┬───────────┬────────────┐
  │ Depth │ clone  │ cloneJSON │ cloneLoop │ cloneForce │
  ├───────┼────────┼───────────┼───────────┼────────────┤
  │   500 │  351   │    212    │    338    │    372     │
  │ 1,000 │  174   │    104    │    175    │    143     │
  │ 1,500 │  116   │     67   │    112    │     82     │
  │ 2,000 │   92   │     50   │     88    │     69     │
  └───────┴────────┴───────────┴───────────┴────────────┘

  RANKINGS:
  cloneLoop > clone ≈ cloneForce > cloneJSON

  ANALYSIS:
  → cloneJSON: 50% speed of clone (2x recursion: stringify + parse)
  → cloneForce: slower do uniqueList O(n²) check
  → cloneLoop ≈ clone: function creation overhead negligible

  FIXED DEPTH = 10,000, BREADTH = 0:
  ┌───────┬────────┬───────────┬───────────┬────────────┐
  │ Width │ clone  │ cloneJSON │ cloneLoop │ cloneForce │
  ├───────┼────────┼───────────┼───────────┼────────────┤
  │     0 │ 13,400 │   3,272   │  14,292   │     989    │
  └───────┴────────┴───────────┴───────────┴────────────┘

  → cloneForce: 989 (14x slower than cloneLoop!)
  → O(n²) cache check dominates performance!
  → FIX: use WeakMap → O(1) lookup → comparable to cloneLoop
```

```
TIME COMPLEXITY ANALYSIS:
═══════════════════════════════════════════════════════════════

  n = total number of objects

  clone:      O(n) + overhead(creating recursive functions)
  cloneJSON:  O(n) × 2 + overhead(circular detection)
              → stringify O(n) + parse O(n) = 2n
  cloneLoop:  O(n) — pure loop, no overhead!
  cloneForce: O(n²) — cache check: 1+2+3+...+n = n²/2
              → With WeakMap: O(n)! ⭐

  cloneForce LATENCY (exponential growth!):
  ┌───────────┬────────────┐
  │ Objects   │ Time (ms)  │
  ├───────────┼────────────┤
  │   2,000   │     5      │
  │   4,000   │    20      │
  │   6,000   │    60      │
  │   8,000   │   150      │
  │  10,000   │   300+     │ ← Noticeable delay! 💀
  └───────────┴────────────┘
  → O(n²) → objects > 10,000 → delay > 300ms!
```

---

## §6. Production-Ready Deep Clone

```javascript
// PRODUCTION VERSION — handles ALL edge cases
function deepClone(obj, map = new WeakMap()) {
  // ① Primitives + null
  if (obj === null || typeof obj !== "object") return obj;

  // ② Circular reference
  if (map.has(obj)) return map.get(obj);

  // ③ Special types
  if (obj instanceof Date) return new Date(obj);
  if (obj instanceof RegExp) return new RegExp(obj.source, obj.flags);
  if (obj instanceof Error) return new Error(obj.message);

  // ④ Map
  if (obj instanceof Map) {
    const clone = new Map();
    map.set(obj, clone);
    obj.forEach((val, key) => {
      clone.set(deepClone(key, map), deepClone(val, map));
    });
    return clone;
  }

  // ⑤ Set
  if (obj instanceof Set) {
    const clone = new Set();
    map.set(obj, clone);
    obj.forEach((val) => {
      clone.add(deepClone(val, map));
    });
    return clone;
  }

  // ⑥ Array or Object
  const clone = Array.isArray(obj) ? [] : {};
  map.set(obj, clone); // Register BEFORE recursion!

  // ⑦ All own keys (including Symbol!)
  for (const key of Reflect.ownKeys(obj)) {
    clone[key] = deepClone(obj[key], map);
  }

  return clone;
}
```

```
PRODUCTION CHECKLIST:
═══════════════════════════════════════════════════════════════

  ┌─────────────────────┬───────┬──────────┬──────────┬──────────┐
  │ Feature             │ clone │cloneJSON │cloneLoop │cloneForce│
  ├─────────────────────┼───────┼──────────┼──────────┼──────────┤
  │ Difficulty          │ ☆☆   │ ☆       │ ☆☆☆    │ ☆☆☆☆  │
  │ Circular Ref        │ ❌💀  │ ❌ Error │ ❌💀     │ ✅       │
  │ Stack Overflow      │ ❌    │ ❌       │ ✅       │ ✅       │
  │ Preserve Reference  │ ❌    │ ❌       │ ❌       │ ✅       │
  │ Handle Special Types│ ❌    │ ❌       │ ❌       │ ❌       │
  │ Best For            │Simple │JSON data │Deep data │Full copy │
  └─────────────────────┴───────┴──────────┴──────────┴──────────┘

  BEST COMBINATION (interview answer):
  → cloneLoop (no stack overflow)
  + WeakMap (circular ref + O(1))
  + Special type handling (Date, RegExp, Map, Set)
  + Reflect.ownKeys (Symbol keys + non-enumerable)
  = PRODUCTION READY! ✅

  LIBRARY: @jsmini/clone (4 methods all in 1 package)
  → import { clone, cloneJSON, cloneLoop, cloneForce } from '@jsmini/clone'

  OR: structuredClone() — Built-in API (modern browsers)!
  → const copy = structuredClone(original);
  → ✅ Circular refs, Map, Set, Date, RegExp, ArrayBuffer
  → ❌ Functions, DOM nodes, Symbol, prototype chain
```

---

## Tóm Tắt

```
4 METHODS — EVOLUTION:
═══════════════════════════════════════════════════════════════

  Level 1: clone (recursive)
  → Shallow + recursion → SIMPLE → ❌ stack overflow, circular ref

  Level 2: cloneJSON (JSON.parse + stringify)
  → 1 line! → ❌ stack overflow, loses types, ❌ circular (error)

  Level 3: cloneLoop (explicit stack)
  → Loop replaces recursion → ✅ No stack overflow
  → ❌ circular ref, ❌ reference preservation

  Level 4: cloneForce (cache + loop)
  → uniqueList tracks copies → ✅ circular ref + references
  → ❌ O(n²) performance → FIX: WeakMap → O(n)

  Level 5: Production (WeakMap + special types)
  → Handle Date, RegExp, Map, Set, Symbol keys
  → ✅ All edge cases handled!

  INTERVIEW STRATEGY:
  ① Start with simple recursive version
  ② Point out 4 flaws (validation, null, array, stack overflow)
  ③ Mention JSON method + its limitations
  ④ Explain loop-based solution (tree → DFS with stack)
  ⑤ Add WeakMap for circular ref + reference preservation
  ⑥ Handle special types → Production ready
  → Show PROGRESSION = demonstrate DEPTH! ⭐
```

### Checklist

- [ ] Shallow vs Deep: level 1 copy vs infinite levels
- [ ] typeof null === 'object': classic gotcha, must handle!
- [ ] Recursive clone: 4 problems (validation, null, array, stack overflow)
- [ ] cloneJSON: loses undefined, Function, Symbol, Date→string, RegExp→{}
- [ ] Stack overflow: depth > ~10,000 → crash (breadth doesn't overflow!)
- [ ] Circular reference: a.a = a → infinite loop (recursive) or error (JSON)
- [ ] Tree traversal: object = tree, DFS with explicit stack (loopList)
- [ ] Stack entry: { parent, key, data } — key=undefined → root level
- [ ] Reference preservation: track source→target mapping
- [ ] uniqueList O(n²) → WeakMap O(1) optimization
- [ ] WeakMap: set BEFORE recursion (prevent circular infinite loop!)
- [ ] Special types: Date, RegExp, Map, Set, Error
- [ ] Reflect.ownKeys: includes Symbol + non-enumerable keys
- [ ] structuredClone(): modern built-in API (but no functions/DOM)
- [ ] Performance ranking: cloneLoop > clone > cloneForce > cloneJSON
- [ ] Interview strategy: start simple → point flaws → improve → DEPTH!

---

_Nguồn: 颜海镜 — "The Ultimate Exploration of Deep Copying (90% Don't Know)"_
_Library: @jsmini/clone_
_Cập nhật lần cuối: Tháng 2, 2026_
