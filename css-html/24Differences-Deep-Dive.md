# 24 Differences Between XX and XX — Interview Deep Dive

> 📅 2026-02-12 · ⏱ 25 phút đọc
>
> 24 cặp "sự khác nhau" hay bị hỏi trong phỏng vấn Front-end
> Phủ: JS Core, Network, CSS, Framework, Browser, DevOps
> Độ khó: ⭐️⭐️⭐️⭐️ | Must-Know for Senior Interview

---

## Mục Lục

| #   | Topic                                    |
| --- | ---------------------------------------- |
| 1   | Arrow Function vs Regular Function       |
| 2   | var vs let vs const                      |
| 3   | BigInt vs Number                         |
| 4   | Primitive vs Reference Types             |
| 5   | defer vs async (script)                  |
| 6   | async/await vs Promise                   |
| 7   | GET vs POST                              |
| 8   | Framework vs No Framework (Vue vs React) |
| 9   | Cookie vs Session                        |
| 10  | Macro-task vs Micro-task                 |
| 11  | fetch vs Ajax vs axios                   |
| 12  | TCP vs UDP                               |
| 13  | Heap vs Stack vs Queue                   |
| 14  | WebSocket vs HTTP                        |
| 15  | HTTP vs HTTPS                            |
| 16  | px vs em vs rem vs vw vs vh              |
| 17  | Webpack Loader vs Plugin                 |
| 18  | bind vs call vs apply                    |
| 19  | 301 vs 302                               |
| 20  | Process vs Thread                        |
| 21  | JavaScript vs TypeScript                 |
| 22  | localStorage vs sessionStorage vs Cookie |
| 23  | HTTP 1.0 vs 1.1 vs 2.0                   |
| 24  | MongoDB vs MySQL                         |

---

## §1. Arrow Function vs Regular Function

```
7 DIFFERENCES:
═══════════════════════════════════════════════════════════════

  ┌───┬─────────────────────────┬──────────────────────────────┐
  │ # │ Arrow Function          │ Regular Function             │
  ├───┼─────────────────────────┼──────────────────────────────┤
  │ a │ () => {} syntax         │ function() {} syntax         │
  │ b │ this = lexical (outer)  │ this = dynamic (caller)      │
  │   │ Fixed at DEFINE time!   │ Changes based on HOW called! │
  │ c │ ❌ Cannot use as        │ ✅ Can use as constructor    │
  │   │ constructor (no new)    │ new Foo() works              │
  │ d │ ❌ No own arguments     │ ✅ Has arguments object      │
  │   │ Uses outer's arguments  │                              │
  │ e │ call/apply/bind CANNOT  │ call/apply/bind CAN          │
  │   │ change this             │ change this                  │
  │ f │ ❌ No prototype prop    │ ✅ Has Foo.prototype         │
  │ g │ ❌ Cannot be Generator  │ ✅ Can use yield             │
  │   │ No yield keyword        │ function* gen() {}           │
  └───┴─────────────────────────┴──────────────────────────────┘
```

```javascript
// b — this behavior
const obj = {
  name: "Jun",
  arrowFn: () => console.log(this.name), // this = outer (window)
  regularFn() {
    console.log(this.name);
  }, // this = obj
};
obj.arrowFn(); // undefined (window.name)
obj.regularFn(); // "Jun"

// c — constructor
const Arrow = () => {};
new Arrow(); // ❌ TypeError: Arrow is not a constructor

// d — no arguments
const fn = () => console.log(arguments); // ❌ ReferenceError
function fn2() {
  console.log(arguments);
} // ✅ [1,2,3]

// e — call/apply cannot change this
const arrowFn = () => console.log(this);
arrowFn.call({ name: "test" }); // Still window! NOT { name: 'test' }
```

---

## §2. var vs let vs const

```
3 DIFFERENCES:
═══════════════════════════════════════════════════════════════

  ┌───────────────────┬────────┬────────┬────────────────────┐
  │                   │  var   │  let   │  const             │
  ├───────────────────┼────────┼────────┼────────────────────┤
  │ Hoisting          │ ✅ Yes │ ⚠️ TDZ │ ⚠️ TDZ             │
  │                   │ =undef │ Error! │ Error!             │
  │ Block scope       │ ❌ No  │ ✅ Yes │ ✅ Yes             │
  │ Redeclare         │ ✅ Yes │ ❌ No  │ ❌ No              │
  │ Reassign          │ ✅ Yes │ ✅ Yes │ ❌ No              │
  │ Must init at decl │ ❌ No  │ ❌ No  │ ✅ Yes (required!) │
  │ window property   │ ✅ Yes │ ❌ No  │ ❌ No              │
  └───────────────────┴────────┴────────┴────────────────────┘

  TDZ (Temporal Dead Zone):
  → let/const ARE HOISTED but NOT initialized!
  → Access before declaration → ReferenceError!
  → var: hoisted + initialized to undefined
```

```javascript
// Hoisting — var vs let
console.log(a); // undefined (hoisted!)
var a = 1;

console.log(b); // ❌ ReferenceError (TDZ!)
let b = 2;

// Block scope
if (true) {
  var x = 1;
}
console.log(x); // 1 ✅ (var leaks!)

if (true) {
  let y = 2;
}
console.log(y); // ❌ ReferenceError (block-scoped!)

// const — immutable binding, NOT immutable VALUE!
const obj = { name: "蟹黄" };
obj.name = "同学"; // ✅ OK! (mutate property)
console.log(obj.name); // '同学'
obj = { name: "new" }; // ❌ TypeError! (reassign binding)

// Make properties truly immutable:
Object.freeze(obj); // Shallow freeze only!
// Deep freeze: recursive freeze needed!
function deepFreeze(obj) {
  Object.freeze(obj);
  Object.keys(obj).forEach((key) => {
    if (typeof obj[key] === "object" && obj[key] !== null) {
      deepFreeze(obj[key]);
    }
  });
  return obj;
}
```

---

## §3. BigInt vs Number

```
DIFFERENCES:
═══════════════════════════════════════════════════════════════

  ┌────────────────────┬──────────────────┬────────────────────┐
  │                    │ Number           │ BigInt             │
  ├────────────────────┼──────────────────┼────────────────────┤
  │ Precision          │ 53-bit (±2⁵³)   │ UNLIMITED! ∞       │
  │ Max safe integer   │ 9007199254740992 │ No limit           │
  │ Type               │ Int + Float      │ Integer ONLY       │
  │ Syntax             │ 42               │ 42n (suffix n)     │
  │ Mixed arithmetic   │ ❌ Cannot mix!   │ ❌ Cannot mix!     │
  │ typeof             │ "number"         │ "bigint"           │
  │ Unary +            │ ✅ +42           │ ❌ +42n → Error!   │
  └────────────────────┴──────────────────┴────────────────────┘
```

```javascript
// Precision issue
Number.MAX_SAFE_INTEGER; // 9007199254740991 (2⁵³ - 1)
9007199254740992 === 9007199254740993; // true 💀 PRECISION LOST!

// BigInt — no limit!
9007199254740992n === 9007199254740993n; // false ✅

// Cannot mix!
12n + 12; // ❌ TypeError: Cannot mix BigInt and other types
12n + BigInt(12); // ✅ 24n
Number(12n) + 12; // ✅ 24
```

---

## §4. Primitive vs Reference Types

```
DIFFERENCES:
═══════════════════════════════════════════════════════════════

  ┌───────────────────┬──────────────────┬──────────────────────┐
  │                   │ Primitive        │ Reference            │
  ├───────────────────┼──────────────────┼──────────────────────┤
  │ Types             │ string, number,  │ Object, Array,       │
  │                   │ boolean, null,   │ Function, Date,      │
  │                   │ undefined,       │ RegExp, Map, Set     │
  │                   │ symbol, bigint   │                      │
  │ Stored in         │ STACK            │ HEAP (ref in stack)  │
  │ Mutability        │ IMMUTABLE        │ MUTABLE              │
  │ Copy              │ Copy VALUE       │ Copy REFERENCE       │
  │ Compare           │ Compare VALUE    │ Compare REFERENCE    │
  │ Add properties    │ ❌ Cannot        │ ✅ Can               │
  └───────────────────┴──────────────────┴──────────────────────┘
```

```javascript
// Primitive — IMMUTABLE (methods return NEW value!)
let a = 'abc';
a.split('');           // Returns ['a','b','c']
console.log(a);        // 'abc' — UNCHANGED!

// Reference — MUTABLE
let obj = { x: 1 };
obj.x = 2;             // ✅ Mutated!

// Copy difference
let x = 1; let y = x; x = 2;
console.log(y); // 1 (independent copy!)

let a = { v: 1 }; let b = a; a.v = 2;
console.log(b.v); // 2 (same reference! 💀)

// Compare difference
'abc' === 'abc'                     // true (value compare)
{ x: 1 } === { x: 1 }             // false (different reference!)
const ref = { x: 1 }; ref === ref  // true (same reference)
```

---

## §5. defer vs async (Script Loading)

```
3 MODES:
═══════════════════════════════════════════════════════════════

  NORMAL: <script src="app.js"></script>
  ┌─ HTML Parse ─┐ STOP ┌─ Download ─┐┌─ Execute ─┐┌─ Parse ─┐
  → BLOCKS parsing! Page freezes!

  ASYNC: <script async src="app.js"></script>
  ┌──────── HTML Parse ──────────────────────── Parse ────────┐
          ┌─ Download ─┐┌─ Execute ─┐
  → Download parallel, EXECUTE IMMEDIATELY (blocks briefly)
  → Order NOT guaranteed!

  DEFER: <script defer src="app.js"></script>
  ┌──────── HTML Parse ──────────────────────────────────────┐
          ┌─ Download ─┐              ┌─ Execute ─┐
  → Download parallel, EXECUTE AFTER DOM parsed!
  → Order GUARANTEED!

  ┌─────────────┬─────────────────┬──────────────────────────┐
  │             │ async           │ defer                    │
  ├─────────────┼─────────────────┼──────────────────────────┤
  │ Download    │ Parallel ✅     │ Parallel ✅              │
  │ Execute     │ Immediately     │ After DOM parsed         │
  │ Order       │ ❌ NOT guarant. │ ✅ In document order     │
  │ Best for    │ Independent     │ Scripts with             │
  │             │ scripts (GA)    │ dependencies (app.js)    │
  │ DOMContent  │ May fire before │ Fires AFTER all defer    │
  │ Loaded      │ or after        │ scripts execute          │
  └─────────────┴─────────────────┴──────────────────────────┘

  SAFEST: <script> at bottom of <body>
  → No compatibility issues, no blocking, correct order!
```

---

## §6. async/await vs Promise

```
COMPARISON:
═══════════════════════════════════════════════════════════════

  ┌─────────────────────┬──────────────────┬──────────────────┐
  │                     │ async/await      │ Promise          │
  ├─────────────────────┼──────────────────┼──────────────────┤
  │ Style               │ Synchronous-like │ Callback chain   │
  │ Error handling      │ try...catch      │ .catch()         │
  │ Conditional logic   │ ✅ Easy (if/else)│ ⚠️ Nested .then  │
  │ Parallel execution  │ Need Promise.all │ Promise.all ✅   │
  │ Cancel midway       │ ❌ Cannot        │ ❌ Cannot        │
  │ Debug               │ ✅ Stack trace   │ ⚠️ Hard to trace │
  │ Complex flow        │ ✅ Clear         │ ⚠️ .then hell    │
  └─────────────────────┴──────────────────┴──────────────────┘
```

```javascript
// async/await — conditional logic EASY!
async function f() {
  try {
    if ((await fetchData()) === 222) {
      console.log("yes!"); // Clean!
    }
  } catch (err) {
    /* handle error */
  }
}

// Promise — conditional logic MESSY
fetchData()
  .then((val) => {
    if (val === 222) console.log("yes!");
  })
  .catch((err) => {
    /* handle */
  });

// ⚠️ async/await BLOCKS sequential (performance trap!)
async function slow() {
  const a = await fetch("/api/1"); // Wait...
  const b = await fetch("/api/2"); // Wait... (unnecessary!)
}

// ✅ Parallel with Promise.all
async function fast() {
  const [a, b] = await Promise.all([fetch("/api/1"), fetch("/api/2")]);
}

// Promise issues:
// ① Cannot cancel mid-chain
// ② Internal errors invisible without .catch
// ③ Pending state — impossible to know progress
```

---

## §7. GET vs POST

```
DIFFERENCES:
═══════════════════════════════════════════════════════════════

  ┌─────────────────┬──────────────────┬──────────────────────┐
  │                 │ GET              │ POST                 │
  ├─────────────────┼──────────────────┼──────────────────────┤
  │ Params location │ URL (after ?)    │ Request body         │
  │ Params visible  │ ✅ In URL bar   │ ❌ Hidden in body    │
  │ Length limit    │ ⚠️ Browser/server│ No limit (body)      │
  │                 │ limit (~2KB-8KB) │                      │
  │ Caching         │ ✅ Cached       │ ❌ Not cached        │
  │ Bookmarkable    │ ✅ Yes          │ ❌ No                │
  │ Purpose         │ READ (query)    │ WRITE (create/update)│
  │ Idempotent      │ ✅ Yes          │ ❌ No                │
  │ History         │ ✅ Saved in log │ ❌ Not saved         │
  │ Security        │ ⚠️ Params in URL│ ⚠️ Slightly better   │
  │ TCP packets     │ 1 packet        │ 1 or 2 packets*      │
  └─────────────────┴──────────────────┴──────────────────────┘

  * POST 2 packets myth:
  → Some clients send header first (Expect: 100-continue)
  → Server responds 100 → then body sent
  → But NOT all clients! Firefox sends 1 packet!
  → This is CLIENT STRATEGY, not GET/POST spec!

  BOTH are INSECURE over HTTP (plaintext!)
  → Use HTTPS for sensitive data!
  → POST is "safer" only because params not in URL/history
```

---

## §8. Framework vs No Framework (Vue vs React)

```
FRAMEWORK ADVANTAGES:
═══════════════════════════════════════════════════════════════

  ① UI-State Sync: framework handles DOM updates automatically
     → No manual DOM manipulation → fewer bugs!
  ② Componentization: reusable, atomic components
  ③ Natural Layering: MVC/MVP/MVVM → decoupled, maintainable
  ④ Ecosystem: state management, routing, UI libs included
  ⑤ Developer Experience: focus on BUSINESS LOGIC only

  FRAMEWORK DISADVANTAGES:
  ① Bundle size: import entire framework even if using 10%
  ② Learning curve: fast iteration, frequent breaking changes
  ③ Overhead: abstraction cost for simple pages
```

```
VUE vs REACT — CORE PHILOSOPHY:
═══════════════════════════════════════════════════════════════

  ┌────────────────────┬────────────────┬───────────────────┐
  │                    │ Vue            │ React             │
  ├────────────────────┼────────────────┼───────────────────┤
  │ Philosophy         │ REACTIVE       │ FUNCTIONAL        │
  │ Data flow          │ Two-way binding│ One-way data flow │
  │ Mutability         │ Mutable data   │ Immutable state   │
  │ Reactivity         │ Watcher per    │ setState → re-    │
  │                    │ property       │ render entire tree│
  │ Template           │ HTML template  │ JSX (JS + HTML)   │
  │ Learning curve     │ Lower          │ Higher            │
  │ Componentization   │ SFC (.vue)     │ Function/Class    │
  │ State management   │ Vuex/Pinia     │ Redux/Zustand     │
  └────────────────────┴────────────────┴───────────────────┘

  Vue: Data changes → Watcher detects → update specific DOM
  React: setState() → re-render component tree → VDOM diff → patch DOM
```

---

## §9. Cookie vs Session

```
7 DIFFERENCES:
═══════════════════════════════════════════════════════════════

  ┌────────────────────┬─────────────────┬──────────────────┐
  │                    │ Cookie          │ Session          │
  ├────────────────────┼─────────────────┼──────────────────┤
  │ Storage location   │ CLIENT browser  │ SERVER           │
  │ Capacity           │ ≤ 4KB per cookie│ No limit (but    │
  │                    │ ≤ 20 per site   │ affects memory!) │
  │ Data types         │ ASCII string    │ Any type (obj,   │
  │                    │ only            │ list, map, etc.) │
  │ Security           │ ❌ Visible to   │ ✅ Server-side   │
  │                    │ client (unsafe!)│ (transparent)    │
  │ Lifetime           │ Configurable    │ Window close =   │
  │                    │ (can persist)   │ session expires  │
  │ Server load        │ ✅ No load      │ ❌ Each user =   │
  │                    │ (client-side)   │ 1 session in RAM │
  │ Cross-domain       │ ✅ Subdomain    │ ❌ No cross-     │
  │                    │ sharing         │ domain support   │
  └────────────────────┴─────────────────┴──────────────────┘

  Session depends on Cookie!
  → Session ID stored in cookie (JSESSIONID)
  → Cookie expires → Session lost!
```

---

## §10. Macro-task vs Micro-task

```
EVENT LOOP ORDER: Sync → Micro → Macro
═══════════════════════════════════════════════════════════════

  MACRO TASKS:                    MICRO TASKS:
  ┌─────────────────────────┐    ┌─────────────────────────┐
  │ setTimeout              │    │ Promise.then/catch      │
  │ setInterval             │    │ MutationObserver        │
  │ setImmediate (Node)     │    │ process.nextTick (Node) │
  │ I/O                     │    │ queueMicrotask          │
  │ requestAnimationFrame   │    │                         │
  │ UI rendering            │    │                         │
  └─────────────────────────┘    └─────────────────────────┘

  EXECUTION ORDER:
  ┌─────────────────────────────────────────────────────────┐
  │ 1. Execute ALL synchronous code (= first macro task)   │
  │ 2. Execute ALL micro tasks (drain the queue!)          │
  │ 3. Render UI (if needed)                               │
  │ 4. Pick ONE macro task → execute                       │
  │ 5. Execute ALL micro tasks again                       │
  │ 6. Repeat 3-5 (Event Loop!)                            │
  └─────────────────────────────────────────────────────────┘

  KEY: Micro tasks created DURING a macro task
       execute BEFORE the next macro task!

  BANK ANALOGY:
  → Depositing money = macro task (take a number, wait in line)
  → While depositing, ask for micro-investment = micro task
    → Processed IMMEDIATELY after deposit (no re-queuing!)
  → Want to deposit for spouse? = another macro task
    → Must take NEW number and wait!
```

```javascript
// Classic Event Loop Quiz
setTimeout(() => console.log("1")); // Macro 1
new Promise((resolve) => {
  console.log("2"); // Sync 1
  resolve();
}).then(() => console.log("3")); // Micro 1
console.log("4"); // Sync 2

// Output: 2, 4, 3, 1
// Sync(2,4) → Micro(3) → Macro(1)
```

---

## §11. fetch vs Ajax (XHR) vs axios

```
COMPARISON:
═══════════════════════════════════════════════════════════════

  ┌─────────────────┬────────────┬────────────┬──────────────┐
  │                 │ Ajax (XHR) │ axios      │ fetch        │
  ├─────────────────┼────────────┼────────────┼──────────────┤
  │ API             │ XMLHttp    │ Promise    │ Promise      │
  │                 │ Request    │ (wraps XHR)│ (native)     │
  │ Return          │ Callback   │ Promise    │ Promise      │
  │ Browser         │ ✅ All     │ ✅ All     │ ✅ Modern    │
  │ Node.js         │ ❌ No     │ ✅ Yes     │ ✅ v18+      │
  │ Intercept       │ ❌         │ ✅ Yes     │ ❌ Manual    │
  │ Cancel          │ abort()    │ CancelToken│ AbortControl │
  │ CSRF protect    │ ❌ Manual  │ ✅ Built-in│ ❌ Manual    │
  │ JSON auto-parse │ ❌ Manual  │ ✅ Auto    │ ❌ .json()   │
  │ Error on 4xx/5xx│ ❌ (success)│ ✅ Throws │ ❌ (resolves)│
  │ Progress        │ ✅ Yes     │ ✅ Yes     │ ❌ No        │
  └─────────────────┴────────────┴────────────┴──────────────┘

  fetch pitfall: 404/500 → Promise RESOLVES (not rejects!)
  → Must check response.ok manually!
  axios: most feature-rich, best DX, both browser + Node
```

---

## §12. TCP vs UDP

```
COMPARISON:
═══════════════════════════════════════════════════════════════

  ┌─────────────────┬──────────────────┬──────────────────────┐
  │                 │ TCP              │ UDP                  │
  ├─────────────────┼──────────────────┼──────────────────────┤
  │ Connection      │ Connection-      │ Connection-LESS      │
  │                 │ oriented (3-way) │ (just send!)         │
  │ Reliability     │ ✅ Guaranteed    │ ❌ Best-effort       │
  │                 │ no loss, order   │ may lose/reorder     │
  │ Stream type     │ Byte-stream     │ Message-oriented     │
  │ Congestion ctrl │ ✅ Yes (slow     │ ❌ No (constant     │
  │                 │ start, etc.)     │ rate, may drop)      │
  │ Communication   │ 1-to-1 only     │ 1-to-1, 1-to-many   │
  │ Header size     │ 20 bytes         │ 8 bytes              │
  │ Speed           │ Slower           │ Faster               │
  │ Use case        │ HTTP, Email,     │ Video, VoIP, DNS,    │
  │                 │ File transfer    │ Gaming, live stream  │
  └─────────────────┴──────────────────┴──────────────────────┘

  TCP: "Reliable mail" (tracked, confirmed, retransmit if lost)
  UDP: "Throwing leaflets" (fast, no guarantee, some may blow away)
```

---

## §13. Heap vs Stack vs Queue

```
3 DATA STRUCTURES IN JS:
═══════════════════════════════════════════════════════════════

  STACK (Call Stack):
  → LIFO (Last In, First Out) — chồng đĩa!
  → Stores: primitives, function call frames
  → Access: O(1) — top only
  → Auto-managed by engine

  HEAP (Memory Heap):
  → Unstructured memory pool — kho hàng!
  → Stores: objects, arrays, functions
  → Access: via reference (pointer from stack)
  → Managed by GC (garbage collector)

  QUEUE (Task Queue):
  → FIFO (First In, First Out) — xếp hàng!
  → Stores: callbacks waiting to execute
  → Event loop picks from queue → stack

  ┌──────────┬────────────┬────────────┐
  │ Stack    │ Heap       │ Queue      │
  ├──────────┼────────────┼────────────┤
  │ LIFO     │ Unordered  │ FIFO       │
  │ Fast     │ Dynamic    │ Ordered    │
  │ Fixed    │ GC managed │ Event loop │
  │ Primitive│ Objects    │ Callbacks  │
  └──────────┴────────────┴────────────┘
```

---

## §14. WebSocket vs HTTP

```
COMPARISON:
═══════════════════════════════════════════════════════════════

  ┌─────────────────┬──────────────────┬──────────────────────┐
  │                 │ HTTP             │ WebSocket            │
  ├─────────────────┼──────────────────┼──────────────────────┤
  │ Direction       │ Unidirectional   │ BIDIRECTIONAL        │
  │                 │ (req → resp)     │ (both send anytime!) │
  │ Connection      │ Short-lived      │ PERSISTENT           │
  │                 │ (per request)    │ (keep-alive)         │
  │ Protocol        │ http:// / https: │ ws:// / wss://       │
  │ Overhead        │ Headers each req │ Minimal after        │
  │                 │ (heavy!)         │ handshake (light!)   │
  │ Based on        │ TCP              │ TCP (HTTP upgrade)   │
  │ Real-time       │ ⚠️ Polling      │ ✅ Native            │
  │ Use case        │ REST API, pages  │ Chat, gaming, live   │
  └─────────────────┴──────────────────┴──────────────────────┘

  WebSocket starts as HTTP → upgrade handshake → persistent!
  → After handshake: both sides can push data anytime
  → No need for repeated HTTP request/response cycle
```

---

## §15. HTTP vs HTTPS

```
COMPARISON:
═══════════════════════════════════════════════════════════════

  ┌─────────────────┬──────────────────┬──────────────────────┐
  │                 │ HTTP             │ HTTPS                │
  ├─────────────────┼──────────────────┼──────────────────────┤
  │ Security        │ ❌ Plaintext     │ ✅ Encrypted (TLS)   │
  │ Port            │ 80               │ 443                  │
  │ Certificate     │ ❌ Not needed    │ ✅ CA cert required  │
  │ Handshake       │ TCP 3-way (3 pk) │ TCP + TLS (12 pk!)  │
  │ Speed           │ ✅ Faster        │ ⚠️ Slower (encrypt)  │
  │ Server cost     │ ✅ Lower         │ ⚠️ Higher (CPU)      │
  │ SEO             │ ⚠️ Penalized    │ ✅ Google prefers    │
  │ URL bar         │ "Not Secure"     │ 🔒 Lock icon         │
  └─────────────────┴──────────────────┴──────────────────────┘

  HTTPS = HTTP + SSL/TLS encryption
  → Prevents man-in-the-middle attacks
  → Encrypts data in transit
  → Verifies server identity (certificate)
```

---

## §16. px vs em vs rem vs vw vs vh

```
CSS UNITS:
═══════════════════════════════════════════════════════════════

  ┌──────┬────────────┬────────────────────────────────────────┐
  │ Unit │ Relative to│ Example                                │
  ├──────┼────────────┼────────────────────────────────────────┤
  │ px   │ ABSOLUTE   │ 16px = 16px always (device pixel)     │
  │ em   │ Parent     │ Parent 16px → 1.5em = 24px            │
  │      │ font-size  │ ⚠️ Compounds! nested = chaos!         │
  │ rem  │ ROOT html  │ html 16px → 1.5rem = 24px             │
  │      │ font-size  │ ✅ Consistent! No compounding!        │
  │ vw   │ Viewport   │ 1vw = 1% viewport WIDTH               │
  │      │ WIDTH      │ Browser 1200px → 1vw = 12px           │
  │ vh   │ Viewport   │ 1vh = 1% viewport HEIGHT              │
  │      │ HEIGHT     │ Browser 900px → 1vh = 9px             │
  │ %    │ Parent     │ 50% of parent's same property         │
  └──────┴────────────┴────────────────────────────────────────┘

  em TRAP: nesting compounds!
  body { font-size: 16px; }
  div  { font-size: 1.5em; }  /* 24px */
  p    { font-size: 1.5em; }  /* 36px! (1.5 × 24) 💀 */

  rem: always relative to <html>, NO compounding!
  → Best for responsive typography!
  → Set html { font-size: 62.5% } → 1rem = 10px (easy math!)
```

---

## §17. Webpack Loader vs Plugin

```
COMPARISON:
═══════════════════════════════════════════════════════════════

  ┌─────────────────┬──────────────────┬──────────────────────┐
  │                 │ Loader           │ Plugin               │
  ├─────────────────┼──────────────────┼──────────────────────┤
  │ What it does    │ TRANSFORM files  │ EXTEND webpack       │
  │ Operates on     │ Individual files │ Bundle process       │
  │ When            │ Before bundling  │ During/after bundle  │
  │ How             │ A → B converter  │ Hook into lifecycle  │
  │ Config          │ module.rules     │ plugins array        │
  │ Example         │ babel-loader     │ HtmlWebpackPlugin    │
  │                 │ css-loader       │ MiniCssExtractPlugin │
  │                 │ sass-loader      │ CleanWebpackPlugin   │
  │                 │ ts-loader        │ DefinePlugin         │
  └─────────────────┴──────────────────┴──────────────────────┘

  Loader: "Translator" — .scss → .css, .ts → .js
  Plugin: "Power-up" — optimize, inject, clean, analyze
```

---

## §18. bind vs call vs apply

```
COMPARISON:
═══════════════════════════════════════════════════════════════

  ┌─────────────────┬────────────┬───────────┬────────────────┐
  │                 │ call       │ apply     │ bind           │
  ├─────────────────┼────────────┼───────────┼────────────────┤
  │ Execution       │ IMMEDIATE  │ IMMEDIATE │ Returns NEW fn │
  │ Args format     │ arg1, arg2 │ [arg1,arg2│ arg1, arg2     │
  │                 │ (list)     │ ] (array) │ (partial OK!)  │
  │ Returns         │ Result     │ Result    │ New function   │
  │ this binding    │ ✅ Changes │ ✅ Changes│ ✅ Permanent   │
  └─────────────────┴────────────┴───────────┴────────────────┘
```

```javascript
function greet(greeting, punct) {
  console.log(`${greeting}, ${this.name}${punct}`);
}
const user = { name: "Jun" };

greet.call(user, "Hello", "!"); // "Hello, Jun!" — immediate!
greet.apply(user, ["Hello", "!"]); // "Hello, Jun!" — array args!
const bound = greet.bind(user); // Returns function (NOT called!)
bound("Hello", "!"); // "Hello, Jun!" — call later!

// bind — partial application
const sayHi = greet.bind(user, "Hi"); // Pre-fill first arg
sayHi("!"); // "Hi, Jun!"

// Mnemonic: Call = Comma, Apply = Array, Bind = Bind (later)
```

---

## §19. 301 vs 302

```
COMPARISON:
═══════════════════════════════════════════════════════════════

  ┌─────────────────┬──────────────────────┬──────────────────┐
  │                 │ 301                  │ 302              │
  ├─────────────────┼──────────────────────┼──────────────────┤
  │ Name            │ Moved Permanently    │ Found (Temporary)│
  │ Type            │ PERMANENT redirect   │ TEMPORARY redirect│
  │ Cache           │ ✅ Cached by browser │ ❌ Not cached    │
  │ SEO             │ Transfers page rank  │ Keeps old URL    │
  │ Use case        │ Domain migration     │ Login redirect,  │
  │                 │ old → new URL        │ A/B testing      │
  │ Bookmarks       │ Should update        │ Keep original    │
  └─────────────────┴──────────────────────┴──────────────────┘

  301: "We MOVED permanently! Update your bookmarks!"
  → old-domain.com → new-domain.com
  302: "We're temporarily elsewhere, come back to this URL later"
  → /dashboard → /login (unauthenticated)
```

---

## §20. Process vs Thread

```
COMPARISON:
═══════════════════════════════════════════════════════════════

  ┌─────────────────┬──────────────────┬──────────────────────┐
  │                 │ Process          │ Thread               │
  ├─────────────────┼──────────────────┼──────────────────────┤
  │ Definition      │ Unit of RESOURCE │ Unit of EXECUTION    │
  │                 │ allocation       │ (scheduling)         │
  │ Memory          │ Independent      │ SHARED within process│
  │                 │ address space    │ (same address space) │
  │ Switch cost     │ HIGH (context    │ LOW (lightweight)    │
  │                 │ switch expensive)│                      │
  │ Crash impact    │ ✅ Isolated!     │ ❌ 1 thread dies =   │
  │                 │ Others survive   │ ENTIRE process dies! │
  │ Communication   │ IPC (pipes,      │ Direct memory        │
  │                 │ sockets, etc.)   │ access (easy!)       │
  │ Relationship    │ Contains threads │ Part of a process    │
  └─────────────────┴──────────────────┴──────────────────────┘

  Process = Apartment (independent space, own resources)
  Thread = Roommates (share apartment, share resources!)

  Multi-process: more ROBUST (crash isolation)
  Multi-thread: more EFFICIENT (shared memory, low overhead)
```

---

## §21. JavaScript vs TypeScript

```
COMPARISON:
═══════════════════════════════════════════════════════════════

  ┌─────────────────┬──────────────────┬──────────────────────┐
  │                 │ JavaScript       │ TypeScript           │
  ├─────────────────┼──────────────────┼──────────────────────┤
  │ Typing          │ Dynamic          │ Static (compile-time)│
  │ Type annotation │ ❌ None          │ ✅ Required/optional │
  │ Compilation     │ Interpreted      │ Compiled → JS        │
  │ Classes         │ ES6+ (syntactic) │ Full OOP support     │
  │ Interfaces      │ ❌ None          │ ✅ interface keyword │
  │ Modules         │ ES Modules, CJS  │ Same + namespaces    │
  │ Enums           │ ❌ None          │ ✅ Built-in          │
  │ Generics        │ ❌ None          │ ✅ <T> generics      │
  │ Default params  │ ES6+             │ ✅ Built-in          │
  │ Error detection │ Runtime only     │ Compile time! ⭐     │
  │ IDE support     │ Basic            │ ✅ Full IntelliSense │
  │ Learning curve  │ Lower            │ Higher               │
  │ Output          │ Runs directly    │ Must compile to JS   │
  └─────────────────┴──────────────────┴──────────────────────┘

  TypeScript = JavaScript + TYPE SYSTEM
  → Catches bugs at COMPILE time (before runtime!)
  → Better refactoring, autocomplete, documentation
```

---

## §22. localStorage vs sessionStorage vs Cookie

```
COMPARISON:
═══════════════════════════════════════════════════════════════

  ┌─────────────────┬──────────┬──────────────┬──────────────┐
  │                 │ Cookie   │ localStorage │sessionStorage│
  ├─────────────────┼──────────┼──────────────┼──────────────┤
  │ Capacity        │ ≤ 4KB    │ 5-10MB       │ 5-10MB       │
  │ Sent to server  │ ✅ Every │ ❌ Local only│ ❌ Local only│
  │                 │ request! │              │              │
  │ Lifetime        │ Expiry   │ ♾️ Forever   │ Tab close =  │
  │                 │ setting  │ (persistent) │ GONE!        │
  │ Scope           │ All same-│ All same-    │ SAME TAB only│
  │                 │ origin   │ origin tabs  │ (not shared!)│
  │ API             │ document │ getItem()    │ getItem()    │
  │                 │ .cookie  │ setItem()    │ setItem()    │
  │ Event           │ ❌       │ ✅ storage   │ ✅ storage   │
  │                 │          │ event        │ event        │
  └─────────────────┴──────────┴──────────────┴──────────────┘

  Cookie: sent with EVERY HTTP request (overhead for big data!)
  → Best for: session IDs, small auth tokens
  localStorage: persistent, shared across tabs
  → Best for: user preferences, cached data
  sessionStorage: per-tab, temporary
  → Best for: form data, one-time state
```

---

## §23. HTTP 1.0 vs 1.1 vs 2.0

```
EVOLUTION:
═══════════════════════════════════════════════════════════════

  ┌─────────────────┬──────────┬───────────┬─────────────────┐
  │                 │ HTTP/1.0 │ HTTP/1.1  │ HTTP/2          │
  ├─────────────────┼──────────┼───────────┼─────────────────┤
  │ Connection      │ New conn │ Keep-alive│ Multiplexed!    │
  │                 │ per req  │ (reuse)   │ (parallel!)     │
  │ Pipelining      │ ❌       │ ✅ (but   │ ✅ True         │
  │                 │          │ HOL block)│ multiplexing    │
  │ Headers         │ Basic    │ Host, more│ COMPRESSED!     │
  │                 │          │ cache ctrl│ (HPACK)         │
  │ Protocol        │ Text     │ Text      │ BINARY!         │
  │ Server Push     │ ❌       │ ❌        │ ✅ Push assets  │
  │ HOL blocking    │ ❌       │ ✅ (issue)│ ❌ Solved!      │
  │ Chunked         │ ❌       │ ✅        │ ✅ (frames)     │
  │ content negotiation│ ❌    │ ✅        │ ✅              │
  └─────────────────┴──────────┴───────────┴─────────────────┘

  1.0: 1 request = 1 TCP connection (expensive!)
  1.1: persistent connection + pipelining (but HOL blocking)
  2.0: binary + multiplexing + header compression + server push
       → Multiple requests on SAME connection, NO blocking!
```

---

## §24. MongoDB vs MySQL

```
COMPARISON:
═══════════════════════════════════════════════════════════════

  ┌─────────────────┬──────────────────┬──────────────────────┐
  │                 │ MongoDB          │ MySQL                │
  ├─────────────────┼──────────────────┼──────────────────────┤
  │ Type            │ NoSQL (document) │ Relational (SQL)     │
  │ Storage         │ BSON (JSON-like) │ Tables (rows/cols)   │
  │ Schema          │ Flexible (no     │ Fixed schema         │
  │                 │ schema required!)│ (must define first!) │
  │ Query           │ JS-like methods  │ SQL statements       │
  │ JOINs           │ ❌ No native     │ ✅ Full JOIN support │
  │ Transactions    │ ⚠️ Limited       │ ✅ Full ACID         │
  │ Performance     │ ✅ Memory-based  │ Disk-based (slower)  │
  │                 │ (hot data in RAM)│                      │
  │ Scalability     │ Horizontal       │ Vertical (scale up)  │
  │                 │ (shard/replica)  │                      │
  │ Space           │ Larger           │ Smaller              │
  │ Best for        │ Rapid prototyping│ Complex relations,   │
  │                 │ flexible schema  │ financial data       │
  └─────────────────┴──────────────────┴──────────────────────┘
```

---

## Tóm Tắt — Quick Reference

```
24 PAIRS — ONE-LINE SUMMARY:
═══════════════════════════════════════════════════════════════

  1.  Arrow vs Regular:    Arrow = lexical this, no constructor/arguments
  2.  var vs let vs const: var hoists+leaks, let/const TDZ+block-scoped
  3.  BigInt vs Number:    BigInt = unlimited precision, suffix n, no mix
  4.  Primitive vs Ref:    Stack/immutable/value vs Heap/mutable/reference
  5.  defer vs async:      defer = after DOM, ordered; async = ASAP, unordered
  6.  async/await vs Promise: await = sync-style, Promise = chain-style
  7.  GET vs POST:         GET = read/cached/URL; POST = write/body/uncached
  8.  Framework vs None:   Framework = UI-state sync, components, ecosystem
  9.  Cookie vs Session:   Cookie = client/4KB; Session = server/unlimited
  10. Macro vs Micro:      Sync → ALL micros → 1 macro → ALL micros → ...
  11. fetch vs axios:      axios = auto JSON, error throw; fetch = manual
  12. TCP vs UDP:           TCP = reliable/ordered; UDP = fast/best-effort
  13. Heap vs Stack vs Q:  Stack LIFO, Heap unstructured, Queue FIFO
  14. WebSocket vs HTTP:   WS = bidirectional persistent; HTTP = req/resp
  15. HTTP vs HTTPS:       HTTPS = HTTP + TLS encryption (port 443)
  16. px/em/rem/vw/vh:     rem = root-based, vw/vh = viewport percentage
  17. Loader vs Plugin:    Loader = file transform; Plugin = process extend
  18. bind/call/apply:     call=comma, apply=array, bind=returns new fn
  19. 301 vs 302:           301 = permanent (cached); 302 = temporary
  20. Process vs Thread:   Process = isolated; Thread = shared within process
  21. JS vs TS:             TS = JS + static types + compile-time checking
  22. local/session/cookie: cookie sent to server; storage = local only
  23. HTTP 1.0/1.1/2.0:    1.0=new conn, 1.1=keep-alive, 2.0=multiplex
  24. MongoDB vs MySQL:    Mongo = flexible NoSQL; MySQL = relational SQL
```

### Checklist

- [ ] Arrow function: 7 differences (this, constructor, arguments, prototype, generator)
- [ ] var/let/const: hoisting, TDZ, block scope, redeclare
- [ ] const object: binding immutable, properties mutable → Object.freeze
- [ ] BigInt: suffix n, no mixed arithmetic, no unary +
- [ ] Primitive: stack, immutable, value compare
- [ ] defer: after DOM parsed, ordered; async: ASAP, unordered
- [ ] async/await: parallel trap → fix with Promise.all
- [ ] GET: cached, URL params; POST: body, not cached
- [ ] POST 2-packet: myth! Depends on client, not spec
- [ ] Event Loop: Sync → ALL micros → 1 macro → ALL micros
- [ ] fetch: 404/500 resolves! Must check response.ok
- [ ] TCP: reliable, 20B header; UDP: fast, 8B header
- [ ] WebSocket: starts as HTTP → upgrade → persistent bidirectional
- [ ] HTTPS: TCP 3-way + TLS handshake = 12 packets
- [ ] rem: relative to root html, no compounding (unlike em!)
- [ ] Loader: A→B transform; Plugin: hook into lifecycle
- [ ] bind: returns new function; call/apply: execute immediately
- [ ] 301: permanent, cached; 302: temporary, not cached
- [ ] Process crash: isolated; Thread crash: kills entire process
- [ ] localStorage: persistent + shared; sessionStorage: tab-only
- [ ] HTTP/2: binary, multiplexed, header compression, server push

---

_Nguồn: "24 Differences Between XX and XX That Made Me Stutter in Front of the Interviewer"_
_Cập nhật lần cuối: Tháng 2, 2026_
