# ByteDance's Favorite JS Basics Interview Questions — Deep Dive

> 📅 2026-02-12 · ⏱ 25 phút đọc
>
> Compiled from 30+ ByteDance front-end interview experiences
> (N) = frequency count — how many times this question appeared
> Độ khó: ⭐️⭐️⭐️⭐️⭐️ | ByteDance Must-Know

---

## Mục Lục

| #   | Topic                                     | Freq |
| --- | ----------------------------------------- | ---- |
| 1   | 0.1 + 0.2 !== 0.3 (IEEE 754)              | (2)  |
| 2   | Data Types in JavaScript                  | (4)  |
| 3   | Deep Clone Implementation                 | (4)  |
| 4   | Event Flow (Capture → Target → Bubble)    | —    |
| 5   | new Keyword — What Happens?               | —    |
| 6   | Symbol — Usage & Purpose                  | —    |
| 7   | Closures                                  | (3)  |
| 8   | Implicit & Explicit Type Conversion       | (2)  |
| 9   | this Binding + bind/call/apply            | (2)  |
| 10  | Handwrite bind, call, apply               | (4)  |
| 11  | Handwrite Promise                         | —    |
| 12  | Prototype Chain & Inheritance             | (4)  |
| 13  | Arrow Functions vs Regular Functions      | (3)  |
| 14  | Event Loop Mechanism                      | (3)  |
| 15  | Handwrite: Array Flatten, Currying, Dedup | —    |
| 16  | Miscellaneous Quick Hits                  | —    |

---

## §1. 0.1 + 0.2 !== 0.3 — IEEE 754 (freq: 2)

```
IEEE 754 — 64-BIT FLOATING POINT:
═══════════════════════════════════════════════════════════════

  64 bits = 1 (sign) + 11 (exponent) + 52 (mantissa/fraction)

  ┌───┬───────────┬────────────────────────────────────────────┐
  │ S │ Exponent  │ Mantissa (52 bits = significant digits)   │
  │ 1 │ 11 bits   │ 52 bits                                    │
  └───┴───────────┴────────────────────────────────────────────┘

  MAX_SAFE_INTEGER = 2⁵³ - 1 = 9007199254740991 (16 digits)

  WHY 0.1 + 0.2 !== 0.3:
  ① 0.1 → binary = 0.0001100110011... (INFINITE loop!)
  ② 0.2 → binary = 0.0011001100110... (INFINITE loop!)
  ③ Stored in 52 bits → TRUNCATED → precision lost!
  ④ 0.1 + 0.2 = 0.30000000000000004 ≠ 0.3

  → Precision lost at TWO stages:
    1. Decimal → Binary conversion (infinite repeating)
    2. Mantissa alignment during addition

  WHY 0.1 === 0.1 is TRUE:
  → toPrecision(16) truncates, both produce same representation
```

```javascript
// Solutions:
0.1 + 0.2 === 0.3; // false 💀
Math.abs(0.1 + 0.2 - 0.3) <
  Number.EPSILON(
    // true ✅
    0.1 * 10 + 0.2 * 10,
  ) /
    10 ===
  0.3; // true ✅ (integer math)
parseFloat((0.1 + 0.2).toFixed(10)) === 0.3; // true ✅
```

---

## §2. Data Types in JavaScript (freq: 4)

```
8 DATA TYPES:
═══════════════════════════════════════════════════════════════

  PRIMITIVE (7): stored in STACK, immutable
  ┌─────────────────────────────────────────────────────────┐
  │ Number    → IEEE 754 double (int + float)              │
  │ String    → UTF-16 encoded text                        │
  │ Boolean   → true / false                               │
  │ null      → intentional absence (typeof = "object" 💀) │
  │ undefined → uninitialized / not assigned               │
  │ Symbol    → unique identifier (ES6)                    │
  │ BigInt    → arbitrary precision integers (ES2020)      │
  └─────────────────────────────────────────────────────────┘

  REFERENCE (1+): stored in HEAP, pointer in stack
  ┌─────────────────────────────────────────────────────────┐
  │ Object    → base type for all reference types          │
  │  ├ Array  → ordered collection                         │
  │  ├ Function → callable object                          │
  │  ├ Date, RegExp, Map, Set, WeakMap, WeakSet...        │
  └─────────────────────────────────────────────────────────┘

  Number storage:
  → 64 bits (IEEE 754), safe range: ±2⁵³
  → If backend sends > 2⁵³ → TRUNCATED! (precision lost)
  → Fix: use BigInt or send as string
```

---

## §3. Deep Clone Implementation (freq: 4)

```javascript
// SHALLOW CLONE — level 1 only
function shallowClone(obj) {
  let cloneObj = {};
  for (let i in obj) {
    cloneObj[i] = obj[i];
  }
  return cloneObj;
}

// DEEP CLONE — basic recursive
function deepCopy(obj) {
  if (typeof obj !== "object" || obj === null) return obj;
  var result = Array.isArray(obj) ? [] : {};
  for (var i in obj) {
    if (obj.hasOwnProperty(i)) {
      result[i] = typeof obj[i] === "object" ? deepCopy(obj[i]) : obj[i];
    }
  }
  return result;
}
```

```
DEEP CLONE — INTERVIEW CHECKLIST:
═══════════════════════════════════════════════════════════════

  5 THINGS TO ADDRESS:
  ① Primitive types → return directly
  ② Reference types → recursive clone
  ③ Special types: RegExp, Date, Function NOT JSON-safe!
     → JSON.parse(JSON.stringify()) LOSES them!
  ④ Constructor info lost → all become plain Object
  ⑤ Circular reference → WeakMap to track visited!
```

```javascript
// PRODUCTION DEEP CLONE — handles all edge cases
function deepClone(obj, map = new WeakMap()) {
  if (obj === null || typeof obj !== "object") return obj;
  if (obj instanceof Date) return new Date(obj);
  if (obj instanceof RegExp) return new RegExp(obj.source, obj.flags);
  if (map.has(obj)) return map.get(obj); // Circular ref!

  const clone = Array.isArray(obj) ? [] : {};
  map.set(obj, clone);

  for (const key of Reflect.ownKeys(obj)) {
    clone[key] = deepClone(obj[key], map);
  }
  return clone;
}
```

---

## §4. Event Flow — Capture → Target → Bubble

```
DOM LEVEL 2 EVENT FLOW — 3 PHASES:
═══════════════════════════════════════════════════════════════

  Phase 1: CAPTURING ↓ (top → target)
  → window → document → html → body → div → target
  → Chance to INTERCEPT before target receives event

  Phase 2: TARGET ⭐ (event arrives at target)
  → Handlers execute in BINDING ORDER (not phase order!)

  Phase 3: BUBBLING ↑ (target → top)
  → target → div → body → html → document → window
  → Most common phase for handling events

  ┌─── window ──────────────────────────────────────────┐
  │ ┌── document ────────────────────────────────────┐  │
  │ │ ┌── html ───────────────────────────────────┐  │  │
  │ │ │ ┌── body ─────────────────────────────┐   │  │  │
  │ │ │ │ ┌── div ────────────────────────┐    │   │  │  │
  │ │ │ │ │ ┌── p (target) ───────────┐   │    │   │  │  │
  │ │ │ │ │ │   CLICK HERE            │   │    │   │  │  │
  │ │ │ │ │ └─────────────────────────┘   │    │   │  │  │
  │ │ │ │ └───────────────────────────────┘    │   │  │  │
  │ │ │ └──────────────────────────────────────┘   │  │  │
  │ │ └────────────────────────────────────────────┘  │  │
  │ └─────────────────────────────────────────────────┘  │
  └──────────────────────────────────────────────────────┘
    ↓ CAPTURE (phase 1)          ↑ BUBBLE (phase 3)
```

```javascript
// addEventListener(event, handler, useCapture)
// useCapture: true = capture phase, false = bubble phase (default)

parent.addEventListener("click", () => alert("Parent CAPTURE"), true);
parent.addEventListener("click", () => alert("Parent BUBBLE"), false);
child.addEventListener("click", () => alert("Child BUBBLE"), false);
child.addEventListener("click", () => alert("Child CAPTURE"), true);

// Click on CHILD → output order:
// 1. Parent CAPTURE  (capture phase, top→down)
// 2. Child BUBBLE    (target phase, BINDING ORDER!)
// 3. Child CAPTURE   (target phase, BINDING ORDER!)
// 4. Parent BUBBLE   (bubble phase, bottom→up)

// AT TARGET: order = binding order, NOT phase order!

// IE compatibility:
// attachEvent('onclick', handler)   — IE only, bubble only
// detachEvent('onclick', handler)
```

```
DOM EVENT LEVELS:
═══════════════════════════════════════════════════════════════

  DOM 0: element.onclick = handler
  → Only 1 handler per event! Later overrides earlier!
  → Cancel: element.onclick = null

  DOM 2: element.addEventListener(type, handler, useCapture)
  → Multiple handlers per event! Execute sequentially!
  → Capture + Bubble support
  → Remove: element.removeEventListener(type, handler, useCapture)

  DOM 3: extends DOM 2 with MORE event types
  → UI events, Focus events, Mouse events, Wheel events,
    Keyboard events, Composition events
```

---

## §5. new Keyword — What Happens?

```
4 STEPS WHEN new IS CALLED:
═══════════════════════════════════════════════════════════════

  function Foo(name) { this.name = name; }
  var obj = new Foo('Jun');

  Step 1: Create a BRAND NEW empty object {}
  Step 2: Link [[Prototype]] → Foo.prototype
          obj.__proto__ = Foo.prototype
  Step 3: Bind this = new object, execute constructor
          Foo.call(obj, 'Jun') → obj.name = 'Jun'
  Step 4: If constructor returns an OBJECT → return THAT
          Otherwise → return the NEW object (obj)
```

```javascript
// Return value rules:
function Foo() {
  this.a = 1;
}
new Foo(); // { a: 1 } — normal

function Bar() {
  this.a = 1;
  return {};
}
new Bar(); // {} — returned object overrides!

function Baz() {
  this.a = 1;
  return null;
}
new Baz(); // { a: 1 } — null is NOT object, ignored!

function Qux() {
  this.a = 1;
  return 1;
}
new Qux(); // { a: 1 } — primitive ignored!

function Quux() {
  this.a = 1;
  return true;
}
new Quux(); // { a: 1 } — primitive ignored!

// RULE: return object → use it. return primitive/null → use new obj.
```

---

## §6. Symbol — Usage & Purpose

```
SYMBOL — 4 USE CASES:
═══════════════════════════════════════════════════════════════

  ① UNIQUE PROPERTY KEYS (prevent naming collisions)
  const id = Symbol('id');
  const obj = { [id]: 123, name: 'Jun' };
  // No collision even if someone else uses 'id'!

  ② SIMULATE PRIVATE PROPERTIES
  → Symbol keys are NOT enumerable by:
    for...in, Object.keys(), JSON.stringify()
  → Only accessible via Object.getOwnPropertySymbols()

  ③ Symbol.iterator — ITERABLE PROTOCOL
  → Makes any object usable with for...of
  → Must implement [Symbol.iterator]() → returns { next() }

  ④ Symbol.for() — GLOBAL SYMBOL REGISTRY
  → Symbol.for('key') returns SAME symbol across files
  → Symbol('key') creates NEW unique symbol every time!
```

```javascript
// Symbol.iterator example:
const range = {
  from: 1,
  to: 5,
  [Symbol.iterator]() {
    let current = this.from;
    return {
      next: () => ({
        value: current,
        done: current++ > this.to,
      }),
    };
  },
};
for (const num of range) console.log(num); // 1, 2, 3, 4, 5

// Symbol conversion rules:
Symbol("x") + 1; // ❌ TypeError (cannot convert to number)
Boolean(Symbol("x")); // true (can convert to boolean)
String(Symbol("x")); // "Symbol(x)" (can convert to string)
```

---

## §7. Closures (freq: 3)

```
CLOSURE — DEFINITION:
═══════════════════════════════════════════════════════════════

  A CLOSURE = function + its LEXICAL ENVIRONMENT
  → Function that has access to variables from OUTER scope
  → Even AFTER the outer function has returned!

  HOW JS EXECUTES:
  ① Compilation phase: determine scope rules
  ② Execution phase: create execution contexts

  SCOPE in ES5:
  → Global scope + Function scope (no block scope!)
  → ES6 adds: Block scope (let, const)

  SCOPE CHAIN:
  → Variable lookup: current scope → parent → ... → global
  → Chain of variable objects from current to global
```

```javascript
// Classic closure
function outer() {
  let count = 0; // outer's variable
  return function inner() {
    count++; // inner accesses outer's variable!
    console.log(count);
  };
}
const fn = outer(); // outer returns, but count SURVIVES!
fn(); // 1
fn(); // 2 — count persists in closure!
fn(); // 3

// HOW CLOSURES ARE GENERATED:
// 1. Return function
function makeCounter() {
  let n = 0;
  return () => n++;
}

// 2. Pass function as parameter
function doSomething(callback) {
  let data = "secret";
  callback(data); // callback closes over doSomething's scope
}

// APPLICATION SCENARIOS:
// ① Currying
const add = (a) => (b) => a + b;
const add5 = add(5);
add5(3); // 8

// ② Module pattern (encapsulation)
const Counter = (() => {
  let count = 0; // private!
  return {
    inc: () => ++count,
    get: () => count,
  };
})();

// ③ bind implementation (uses closure internally)
```

---

## §8. Implicit & Explicit Type Conversion (freq: 2)

```
TYPE CONVERSION RULES:
═══════════════════════════════════════════════════════════════

  Non-primitive → primitive: valueOf() first, then toString()

  STRING + NUMBER:
  → "+" with any string → BOTH become strings → concatenate!
  → "-", "*", "/" → convert to NUMBER → calculate!

  '3' + 2   // '32' (string concat!)
  '3' - 2   // 1    (numeric!)
  '3' * 2   // 6    (numeric!)

  BOOLEAN → NUMBER:
  1 + true   // 2 (true → 1)
  1 + false  // 1 (false → 0)

  [] + {}    // "[object Object]" (both toString!)
  {} + []    // 0 (block + [] → +[] → 0) — context dependent!

  FALSY VALUES (6 total):
  ┌─────────────────────────────────────┐
  │ undefined, null, false              │
  │ +0, -0, NaN                         │
  │ "" (empty string)                   │
  └─────────────────────────────────────┘
  Everything else is TRUTHY!
```

```
LOOSE (==) vs STRICT (===) EQUALITY:
═══════════════════════════════════════════════════════════════

  === : No type coercion! Types must match!
  ==  : Type coercion HAPPENS!

  == Rules:
  ① String vs Number → String → Number
  ② Boolean vs Any → Boolean → Number first, then compare
  ③ Object vs Primitive → ToPrimitive(object) then compare
  ④ null == undefined → true (special case!)
  ⑤ null / undefined == anything else → false

  null == undefined   // true
  null === undefined  // false
  NaN == NaN          // false! (NaN is not equal to itself!)
  NaN === NaN         // false!
```

---

## §9. this Binding Rules (freq: 2)

```
4 RULES — PRIORITY: new > explicit > implicit > default
═══════════════════════════════════════════════════════════════

  ① DEFAULT BINDING (standalone function call):
  → Non-strict: this = window (global)
  → Strict: this = undefined

  ② IMPLICIT BINDING (method call):
  → this = the object BEFORE the dot
  → obj.foo() → this = obj
  → Only LAST object in chain matters!

  ③ EXPLICIT BINDING (call/apply/bind):
  → this = first argument
  → foo.call(obj) → this = obj
  → Hard binding: bind creates PERMANENT this

  ④ NEW BINDING (constructor call):
  → this = newly created object
  → new > bind (new overrides hard binding!)
```

```javascript
// Rule 1: Default
function foo() {
  console.log(this.a);
}
var a = 2;
foo(); // 2 (window.a in non-strict)

// Rule 2: Implicit
var obj = { a: 2, foo };
obj.foo(); // 2 (this = obj)

// Rule 3: Explicit
foo.call({ a: 3 }); // 3 (this = {a:3})

// Rule 4: new > bind
function foo(a) {
  this.a = a;
}
var bar = new foo(2);
console.log(bar.a); // 2 (this = new object!)

// Hard binding
function bind(fn, obj) {
  return function () {
    return fn.apply(obj, arguments);
  };
}
```

---

## §10. Handwrite bind, call, apply (freq: 4)

```javascript
// ① HANDWRITE call
Function.prototype.myCall = function (context, ...args) {
  context = context || window;
  const fnSymbol = Symbol("fn");
  context[fnSymbol] = this; // this = the function being called
  const result = context[fnSymbol](...args);
  delete context[fnSymbol];
  return result;
};

// ② HANDWRITE apply (same as call, but args = array)
Function.prototype.myApply = function (context, argsArr = []) {
  context = context || window;
  const fnSymbol = Symbol("fn");
  context[fnSymbol] = this;
  const result = context[fnSymbol](...argsArr);
  delete context[fnSymbol];
  return result;
};

// ③ HANDWRITE bind (returns NEW function, supports partial args)
Function.prototype.myBind = function (context, ...args) {
  const fn = this;
  return function BoundFn(...innerArgs) {
    // Support new: if called with new, this = new object
    if (this instanceof BoundFn) {
      return new fn(...args, ...innerArgs);
    }
    return fn.apply(context, [...args, ...innerArgs]);
  };
};
```

```
HOW IT WORKS — KEY INSIGHT:
═══════════════════════════════════════════════════════════════

  foo.call(obj, 1, 2)
  → We want: obj.foo(1, 2) — so this = obj!

  TRICK:
  ① Temporarily add foo as a property of obj
     obj[Symbol('fn')] = foo
  ② Call it: obj[Symbol('fn')](1, 2) → this = obj! ✅
  ③ Clean up: delete obj[Symbol('fn')]

  WHY Symbol('fn')?
  → Avoid property name collision on obj!
  → Symbol is unique → safe to use as temp key
```

---

## §11. Handwrite Promise

```javascript
class MyPromise {
  constructor(executor) {
    this.state = "PENDING";
    this.value = null;
    this.callbacks = [];

    const resolve = (value) => {
      if (this.state !== "PENDING") return;
      // Handle thenable (Promise returning Promise)
      if (value && typeof value.then === "function") {
        value.then(resolve, reject);
        return;
      }
      this.state = "FULFILLED";
      this.value = value;
      this.callbacks.forEach((cb) => this._handle(cb));
    };

    const reject = (error) => {
      if (this.state !== "PENDING") return;
      this.state = "REJECTED";
      this.value = error;
      this.callbacks.forEach((cb) => this._handle(cb));
    };

    try {
      executor(resolve, reject);
    } catch (err) {
      reject(err);
    }
  }

  then(onFulfilled, onRejected) {
    return new MyPromise((resolve, reject) => {
      this._handle({ onFulfilled, onRejected, resolve, reject });
    });
  }

  catch(onRejected) {
    return this.then(null, onRejected);
  }

  _handle(callback) {
    // Still pending → queue for later
    if (this.state === "PENDING") {
      this.callbacks.push(callback);
      return;
    }

    const cb =
      this.state === "FULFILLED" ? callback.onFulfilled : callback.onRejected;

    // No handler → pass through
    if (!cb) {
      const passThrough =
        this.state === "FULFILLED" ? callback.resolve : callback.reject;
      passThrough(this.value);
      return;
    }

    // Execute handler
    try {
      const result = cb(this.value);
      callback.resolve(result);
    } catch (err) {
      callback.reject(err);
    }
  }
}
```

```
PROMISE KEY CONCEPTS:
═══════════════════════════════════════════════════════════════

  3 STATES: PENDING → FULFILLED or REJECTED (irreversible!)

  CORE MECHANISM:
  ① constructor receives executor(resolve, reject)
  ② .then() returns NEW Promise (chaining!)
  ③ Callbacks queued if PENDING, executed immediately if settled
  ④ Thenable support: if resolve(anotherPromise) → wait for it!

  COMMON INTERVIEW FOLLOW-UP:
  → Promise.all, Promise.race, Promise.allSettled
  → Promise.resolve vs new Promise(resolve => resolve())
```

---

## §12. Prototype Chain & Inheritance (freq: 4)

```
PROTOTYPE CHAIN — HOW IT WORKS:
═══════════════════════════════════════════════════════════════

  function Person(name) { this.name = name; }
  Person.prototype.greet = function() { return this.name; };

  var jun = new Person('Jun');

  jun.greet() → LOOKUP CHAIN:
  ① Check jun itself → no greet
  ② Check jun.__proto__ (= Person.prototype) → FOUND! ✅
  ③ If not found → check Person.prototype.__proto__ (= Object.prototype)
  ④ If not found → Object.prototype.__proto__ = null → STOP!

  jun ──→ Person.prototype ──→ Object.prototype ──→ null
  (instance)  (constructor's     (base prototype)
               prototype)

  RULE: Properties on CONSTRUCTOR, Methods on PROTOTYPE!
```

```javascript
// ES5 INHERITANCE (ByteDance favorite!)
function Foo(name) {
  this.name = name;
}
Foo.prototype.myName = function () {
  return this.name;
};

function Bar(name, label) {
  Foo.call(this, name); // ① Inherit PROPERTIES (borrow constructor)
  this.label = label;
}

// ② Inherit METHODS (link prototypes)
Bar.prototype = Object.create(Foo.prototype);
Bar.prototype.constructor = Bar; // ③ Fix constructor reference!

// ④ Add Bar's own methods AFTER linking
Bar.prototype.myLabel = function () {
  return this.label;
};

var a = new Bar("a", "obj a");
a.myName(); // 'a'  — inherited from Foo!
a.myLabel(); // 'obj a' — Bar's own method!

// Q: "If constructor binds an object, does new inherit it?"
// A: NO! new binding > bind binding!
// new creates fresh object, replaces bind's this!
```

```
PROTOTYPE CHAIN — INTERVIEW DEFINITION:
═══════════════════════════════════════════════════════════════

  Q: What is the prototype chain?
  A: When looking up a property, JS checks the object itself.
     If not found → checks its __proto__ (prototype).
     If still not found → checks prototype's prototype.
     Continues until Object.prototype (whose __proto__ = null).
     This linked chain of prototypes = PROTOTYPE CHAIN.

  Q: What is prototype inheritance?
  A: One object USES another object's properties/methods
     by setting its prototype to that other object.
     Lookup follows the chain → "inherits" behavior!
```

---

## §13. Arrow Functions vs Regular Functions (freq: 3)

```
5 KEY DIFFERENCES + CANNOT BE CONSTRUCTOR:
═══════════════════════════════════════════════════════════════

  ┌─────────────────┬────────────────────┬────────────────────┐
  │                 │ Arrow Function     │ Regular Function   │
  ├─────────────────┼────────────────────┼────────────────────┤
  │ this            │ LEXICAL (outer fn) │ DYNAMIC (caller)   │
  │                 │ Fixed at define!   │ Depends on call!   │
  │ arguments       │ ❌ No own          │ ✅ Has own         │
  │ new (construct) │ ❌ Cannot!         │ ✅ Can             │
  │ prototype       │ ❌ None            │ ✅ Has             │
  │ super/new.target│ ❌ None            │ ✅ Has             │
  │ Generator/yield │ ❌ Cannot          │ ✅ Can             │
  └─────────────────┴────────────────────┴────────────────────┘

  WHY arrow CAN'T be constructor:
  → Functions have [[Call]] (direct call) and [[Construct]] (new)
  → Arrow functions ONLY have [[Call]], NO [[Construct]]!
  → new Arrow() → TypeError!

  ARROW this is PERMANENT:
  → call, apply, bind CANNOT change arrow's this!
```

```javascript
function foo() {
  return (a) => console.log(this.a); // this = foo's this!
}

var obj1 = { a: 2 };
var obj2 = { a: 3 };

var bar = foo.call(obj1); // Arrow's this locked to obj1!
bar.call(obj2); // Still 2! obj2 IGNORED! ⭐
```

---

## §14. Event Loop Mechanism (freq: 3)

```
EVENT LOOP — EXECUTION ORDER:
═══════════════════════════════════════════════════════════════

  ┌─────────────────────────────────────────────────────────┐
  │ 1. Execute SYNCHRONOUS code (= first macro task: Script)│
  │ 2. Drain ALL MICRO-TASKS queue                         │
  │ 3. ONE macro task from queue                           │
  │ 4. Drain ALL micro-tasks again                         │
  │ 5. Render (if needed)                                  │
  │ 6. Repeat 3-5 ♻️                                       │
  └─────────────────────────────────────────────────────────┘

  MACRO TASKS:           MICRO TASKS:
  Script (initial!)      Promise.then/catch/finally
  setTimeout             process.nextTick (Node)
  setInterval            MutationObserver
  setImmediate (Node)    queueMicrotask
  I/O, UI Rendering

  PRIORITY RULES:
  setTimeout = setInterval (same queue)
  setTimeout > setImmediate (in general)
  process.nextTick > Promise.then (Node)
```

```javascript
// Pseudocode for Event Loop:
for (const macroTask of macroTaskQueue) {
  handleMacroTask();
  for (const microTask of microTaskQueue) {
    handleMicroTask(microTask);
  }
}

// Q: setTimeout(fn, 0) — when does fn execute?
// A: NOT immediately! After:
//    ① Current sync code finishes
//    ② All microtasks drain
//    ③ THEN fn executes (next event loop tick)
//    Minimum delay: ~4ms (browser clamp)
```

---

## §15. Handwrite: Array Flatten, Currying, Dedup

```javascript
// ① ARRAY FLATTEN (recursive)
function flatten(arr) {
  let result = [];
  for (let i = 0; i < arr.length; i++) {
    if (Array.isArray(arr[i])) {
      result = result.concat(flatten(arr[i]));
    } else {
      result.push(arr[i]);
    }
  }
  return result;
}
// One-liner: arr.flat(Infinity)

flatten([1, [2, [3, 4]]]); // [1, 2, 3, 4]

// ② CURRYING — transform f(a,b,c) → f(a)(b)(c)
function curry(func, args = []) {
  const arity = func.length; // expected params count
  return function (..._args) {
    const allArgs = [...args, ..._args];
    if (allArgs.length >= arity) {
      return func.apply(this, allArgs); // All args ready!
    }
    return curry(func, allArgs); // Wait for more args
  };
}

// Usage:
const add = (a, b, c) => a + b + c;
const curriedAdd = curry(add);
curriedAdd(1)(2)(3); // 6
curriedAdd(1, 2)(3); // 6
curriedAdd(1)(2, 3); // 6

// ③ ARRAY DEDUP
Array.from(new Set([1, 1, 2, 2, 3])); // [1, 2, 3]
[...new Set([1, 1, 2, 2, 3])]; // [1, 2, 3]
```

---

## §16. Miscellaneous Quick Hits

```
NaN:
═══════════════════════════════════════════════════════════════
  → typeof NaN === 'number' (yes, NaN is of type number! 💀)
  → NaN !== NaN (only value not equal to itself!)
  → Check: Number.isNaN(x) or x !== x

EMPTY OBJECT CHECK:
  Object.keys(obj).length === 0

ARRAY TYPE CHECK:
  Array.isArray(arr) // most reliable

ARGUMENTS → ARRAY:
  [...arguments]                           // spread
  Array.from(arguments)                    // Array.from
  Array.prototype.slice.call(arguments)    // classic

INSTANCEOF:
  'hello' instanceof String  // false! (primitive, not object)
  → instanceof: left ANY value, right MUST be function
  → Checks prototype chain: obj.__proto__ chain includes Fn.prototype?

VARIABLE HOISTING:
  → Execution context creation: create VO → scope chain → determine this
  → VO creation order: arguments → function declarations → var declarations
  → Function declaration: hoisted as reference
  → var: hoisted as undefined
  → let/const: hoisted but NOT initialized (TDZ!)

LET vs CLOSURE (Classic):
  for (var i = 0; i < 5; i++) {
      setTimeout(() => console.log(i), 100); // 5,5,5,5,5 💀
  }
  for (let i = 0; i < 5; i++) {
      setTimeout(() => console.log(i), 100); // 0,1,2,3,4 ✅
  }
  → let creates NEW binding per iteration!
  → var shares SAME binding across all iterations!
```

```
SCRIPT LOADING — async vs defer:
═══════════════════════════════════════════════════════════════
  → Depends on other scripts/DOM → defer
  → Independent of DOM/scripts → async
  → onload fires AFTER external JS finishes loading

ARRAY METHODS:
  Mutating: push, pop, shift, unshift, splice, sort, reverse
  Non-mutating: slice, concat, map, filter, reduce, find, findIndex
  From prototype: toString, valueOf

ES6 CLASS — static keyword:
  → static method is on CLASS itself, NOT on prototype!
  → Foo.staticMethod() ✅
  → new Foo().staticMethod() ❌

PWA & SERVICE WORKER:
  → PWA = web app with native-like experience
  → Service Worker = background script (no DOM access!)
  → Intercepts network requests → cache → offline support
  → Runs independently of web page
```

---

## Tóm Tắt — ByteDance Favorites

```
TOP FREQUENCIES (from 30+ interviews):
═══════════════════════════════════════════════════════════════

  (4) Data types ← "name all 8, explain stack vs heap"
  (4) Deep clone ← "handle circular refs, special types"
  (4) Prototype chain ← "explain + ES5 inheritance code"
  (4) Handwrite bind/call/apply ← "Symbol trick for temp key"
  (3) Closures ← "definition + scope chain + application"
  (3) Arrow vs Regular ← "this, no constructor, no arguments"
  (3) Event Loop ← "sync → micro → macro, with code output"
  (2) 0.1 + 0.2 ← "IEEE 754, truncation, EPSILON"
  (2) this binding ← "4 rules + priority"
  (2) Type conversion ← "== rules, falsy values"

  INTERVIEW TIP:
  → ByteDance loves HANDWRITING CODE on the spot!
  → Practice: bind, call, apply, Promise, flatten, curry, dedup
  → Know the WHY behind each concept, not just the WHAT
  → Show progressive depth: basic → edge cases → production
```

### Checklist

- [ ] IEEE 754: 64-bit = 1+11+52, MAX_SAFE_INTEGER = 2⁵³-1
- [ ] 0.1+0.2: binary infinite loop → truncation → precision loss
- [ ] 8 data types: 7 primitive + Object (subtypes: Array, Function)
- [ ] Deep clone: recursive + WeakMap (circular) + special types
- [ ] Event flow: capture↓ → target⭐ → bubble↑ (3 phases)
- [ ] Target phase: binding ORDER, not phase order!
- [ ] new keyword: 4 steps, return object overrides, primitive ignored
- [ ] Symbol: unique key, private sim, iterator protocol, Symbol.for()
- [ ] Closure: function + lexical env, survives after outer returns
- [ ] Scope chain: current → parent → ... → global
- [ ] Falsy values: undefined, null, false, ±0, NaN, ""
- [ ] == vs ===: loose coerces types, strict does not
- [ ] this: default < implicit < explicit < new (priority)
- [ ] Handwrite call/apply: Symbol temp key → attach → call → delete
- [ ] Handwrite bind: return new function, support partial + new
- [ ] Promise: 3 states, then returns new Promise, thenable support
- [ ] Prototype chain: obj→proto→proto→...→Object.prototype→null
- [ ] ES5 inheritance: Foo.call(this) + Object.create(Foo.prototype)
- [ ] Arrow function: lexical this, no construct/arguments/prototype
- [ ] Event loop: sync → ALL micros → 1 macro → ALL micros → repeat
- [ ] setTimeout(fn,0): NOT immediate! After sync+micros+4ms clamp
- [ ] Curry: transform f(a,b,c) → f(a)(b)(c), check args.length
- [ ] let in for-loop: new binding per iteration (no closure trap!)

---

_Nguồn: ByteDance Front-end Interview — JavaScript Basics (30+ experiences compiled)_
_Cập nhật lần cuối: Tháng 2, 2026_
