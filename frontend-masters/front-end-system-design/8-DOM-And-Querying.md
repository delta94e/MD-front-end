# Front-End System Design — Phần 8: DOM & Querying — "getElementById O(1), HTMLCollection Live, NodeList Copy!"

> 📅 2026-03-09 · ⏱ 35 phút đọc
>
> Nguồn: Frontend Masters — Evgenii Ray (Meta, ex-JetBrains)
> Bài: DOM & Querying — "DOM API = set of methods to manipulate DOM. Class Hierarchy: HTMLElement → Element (DOM API) → Node (tree). getElementById = Hashmap O(1). getElementsByClassName = DFS + caching. HTMLCollection = LIVE (read O(N)!). NodeList = copy (read O(1), memory cost!)."
> Độ khó: ⭐️⭐️⭐️⭐️ | Core — DOM API internals, performance tradeoffs!

---

## Mục Lục

| #   | Phần                                           |
| --- | ---------------------------------------------- |
| 1   | What Is the DOM API? — "Why We Still Need It!" |
| 2   | Global Objects — window, document, body, head  |
| 3   | Class Hierarchy — HTMLElement, Element, Node   |
| 4   | getElementById — "Hashmap O(1)!"               |
| 5   | getElementsByClassName — "DFS + Caching!"      |
| 6   | HTMLCollection — "LIVE = Expensive Read!"      |
| 7   | querySelector / querySelectorAll               |
| 8   | NodeList vs HTMLCollection                     |
| 9   | Performance Summary — "Which Method When?"     |
| 10  | Tự Code: Query Performance Benchmark           |

---

## §1. What Is the DOM API? — "Why We Still Need It!"

> Evgenii: _"The DOM API is a set of methods to manipulate DOM. Usually we don't use it directly because React, Angular, Vue handle mutations for us. But there are cases where we need it."_

```
WHEN YOU NEED DOM API DIRECTLY:
═══════════════════════════════════════════════════════════════

  1. Building low-level libraries
     → Virtualization engine
     → DOM management library

  2. Generic components portable to ANY framework
     → Video player
     → Chart engine
     → Rich text editor

  3. Lightweight portfolio/static sites
     → No framework = smaller bundle!
     → "Minimize footprint by not importing libraries"
```

---

## §2. Global Objects — window, document, body, head

```
GLOBAL OBJECTS:
═══════════════════════════════════════════════════════════════

  window
  ├── Globally accessible (no import needed!)
  ├── Represents browser viewport
  └── Has instance of HTMLDocument
      │
      ▼
  document (= window.document)
  ├── Represents the HTML page
  ├── Has DOM API methods
  └── Quick-access shortcuts:
      ├── document.body → <body> element
      └── document.head → <head> element
```

---

## §3. Class Hierarchy — HTMLElement, Element, Node

> Evgenii: _"DOM API is on the Element prototype, not HTMLElement. Because DOM API can work with SVG and XML too. Node represents a tree leaf. TextNode wraps text. HTMLDocument is an outlier — has DOM API but extends Node."_

```
CLASS HIERARCHY:
═══════════════════════════════════════════════════════════════

  Window
  └── HTMLDocument (outlier! extends Node but has DOM API!)
      │
      ▼
  Node (tree leaf properties: parentNode, childNodes)
  ├── TextNode (wraps raw text in elements)
  └── Element (DOM API lives HERE! — works with HTML/SVG/XML!)
      └── HTMLElement (HTML-specific properties)
          ├── HTMLDivElement
          ├── HTMLSpanElement
          ├── HTMLInputElement
          └── ...

  WHY Element, not HTMLElement?
  → DOM API works with SVG, XML, not just HTML!
  → querySelector works on SVG elements too!
```

---

## §4. getElementById — "Hashmap O(1)!"

> Evgenii: _"Browser reads the page, constructs a Hashmap of elements. ID mapped to HTML reference. So getElementById is O(1) — just accessing object by key."_

```
getElementById INTERNALS:
═══════════════════════════════════════════════════════════════

  When browser reads HTML:
  <div id="header">...</div>
  <div id="sidebar">...</div>
  <div id="main">...</div>

  Browser builds:
  HashMap {
    "header"  → HTMLDivElement ref ──→ memory address
    "sidebar" → HTMLDivElement ref ──→ memory address
    "main"    → HTMLDivElement ref ──→ memory address
  }

  document.getElementById("header")
  → HashMap lookup → O(1)! Instant!

  ✅ BEST performance of all query methods!
  ⚠️ But: ID namespace shared across components!
     Don't overuse IDs in large apps!
```

---

## §5. getElementsByClassName — "DFS + Caching!"

> Evgenii: _"We need to traverse the whole tree using DFS. Time Complexity is linear O(N). But browser is smart — uses Hashmap caching. First query takes time, next time almost immediate."_

```
getElementsByClassName INTERNALS:
═══════════════════════════════════════════════════════════════

  document.getElementsByClassName("card")

  First query: DFS traversal!
  ┌── html
  │   └── body
  │       ├── div.header      ← check: "card"? NO!
  │       ├── div.card ✅      ← check: "card"? YES!
  │       │   └── p.text      ← check: "card"? NO!
  │       ├── div.card ✅      ← check: "card"? YES!
  │       │   └── p.text      ← check: "card"? NO!
  │       └── div.footer      ← check: "card"? NO!
  └── Result: [div.card, div.card]

  Time Complexity: O(N)* — traverse all elements!
  * = Browser caches! Second query ≈ O(1)!

  Returns: HTMLCollection (LIVE!)
```

---

## §6. HTMLCollection — "LIVE = Expensive Read!"

> Evgenii: _"HTMLCollection is a legacy collection. It's LIVE — if you modify DOM and remove an element, it's reflected. Read cost is O(N) because browser parses tree again to verify position. But memory cost is low — just references."_

```
HTMLCollection (LIVE):
═══════════════════════════════════════════════════════════════

  const cards = document.getElementsByClassName("card");
  // cards = HTMLCollection [div.card, div.card, div.card]

  LIVE behavior:
  cards.length → 3
  cards[0].remove();    ← Remove from DOM!
  cards.length → 2!     ← Automatically updated!

  WHY READ IS O(N):
  cards[0] → browser re-traverses tree to verify
             element still exists! Every access!

  ⚠️ DANGER: Looping + live = QUADRATIC!
  for (let i = 0; i < cards.length; i++) {
    console.log(cards[i]);
    // Each access = O(N) re-traversal!
    // N iterations × O(N) = O(N²)! 💀
  }

  Memory: LOW (just references to existing objects!)
  Read:   HIGH O(N) per access!

  USE WHEN: Low memory needed, small data sets only!
```

---

## §7. querySelector / querySelectorAll

> Evgenii: _"querySelector uses CSS selector. Time complexity depends on selector complexity. If using ID → converts to getElementById. Returns NodeList (NOT live!) — copies of elements."_

```
querySelector:
═══════════════════════════════════════════════════════════════

  document.querySelector(".card")
  → Returns FIRST matching element
  → Time: selector compile + DFS (or Hashmap for ID!)
  → Read: O(1) — single element
  → Memory: O(1) — single reference

  document.querySelector("#header")
  → Browser optimizes: converts to getElementById!
  → Nearly O(1)!

querySelectorAll:
═══════════════════════════════════════════════════════════════

  document.querySelectorAll(".card")
  → Returns ALL matching elements as NodeList
  → NodeList = NOT LIVE! (copies!)
  → Read: O(1) — direct array access
  → Memory: O(N) — copies all elements!

  const cards = document.querySelectorAll(".card");
  cards[0].remove();
  cards.length → STILL 3! (stale reference!)
  → Element removed from DOM but still in NodeList!
```

### Selector Complexity Matters

```
SELECTOR COMPILE COST:
═══════════════════════════════════════════════════════════════

  Simple:    ".card"              → Fast compile!
  Medium:    ".container .card"   → Slower!
  Complex:   "div.container > ul.list > li.item:nth-child(2n+1)"
             → Expensive compile! (every execution!)

  "The more complex selector, the more time to compile.
   You pay extra tax on complex selectors." — Evgenii
```

---

## §8. NodeList vs HTMLCollection

```
NodeList vs HTMLCollection:
═══════════════════════════════════════════════════════════════

  | Property      | HTMLCollection    | NodeList           |
  |---------------|-------------------|--------------------|
  | Source        | getElementsBy*   | querySelectorAll   |
  | Live?         | ✅ YES (auto-update)| ❌ NO (snapshot) |
  | Read cost     | O(N) per access!  | O(1) direct!      |
  | Memory cost   | LOW (references)  | HIGH (copies!)     |
  | Stale refs?   | ❌ Never stale    | ⚠️ Can be stale   |
  | Loop safety   | ⚠️ Can be O(N²)  | ✅ Safe O(N)       |

  "Live collection has more drawbacks. For most developers,
   querySelectorAll is the better choice." — Evgenii
```

---

## §9. Performance Summary — "Which Method When?"

> Evgenii: _"getElementById provides best performance (browser builds cache). getElementsByClassName provides low memory overhead. querySelector very close to getElementById, browser heavily optimizes CSS selectors."_

```
QUERY METHOD COMPARISON:
═══════════════════════════════════════════════════════════════

  getElementById
  ├── Performance: ⭐⭐⭐⭐⭐ O(1) Hashmap!
  ├── Returns: Single element
  ├── Live: N/A
  └── Use: Core containers, unique elements

  getElementsByClassName / ByTagName
  ├── Performance: ⭐⭐⭐ O(N) first, cached after
  ├── Returns: HTMLCollection (LIVE!)
  ├── Read cost: O(N) per access!
  ├── Memory: LOW
  └── Use: When memory is critical, small sets

  querySelector
  ├── Performance: ⭐⭐⭐⭐ (close to getElementById!)
  ├── Returns: Single element (not live)
  └── Use: Most common, flexible selectors

  querySelectorAll
  ├── Performance: ⭐⭐⭐⭐ (compile + DFS)
  ├── Returns: NodeList (NOT live, copies!)
  ├── Memory: O(N) — copies elements!
  └── Use: Most common, but don't query too many!

  BROWSER DIFFERENCES:
  • Safari: uses WebAssembly for CSS selector compilation!
  • Chrome: finds existing performance sufficient!
  • "Same query methods behave differently" — Evgenii
```

---

## §10. Tự Code: Query Performance Benchmark

```javascript
// ═══ QUERY METHOD BENCHMARK ═══

function benchmarkQueries() {
  // Create a large DOM tree for testing
  const container = document.createElement("div");
  container.id = "benchmark-container";
  for (let i = 0; i < 10000; i++) {
    const el = document.createElement("div");
    el.className = i % 2 === 0 ? "item-even" : "item-odd";
    el.id = `item-${i}`;
    el.textContent = `Item ${i}`;
    container.appendChild(el);
  }
  document.body.appendChild(container);

  const iterations = 1000;
  const results = {};

  // getElementById
  let start = performance.now();
  for (let i = 0; i < iterations; i++) {
    document.getElementById("item-500");
  }
  results.getElementById = performance.now() - start;

  // getElementsByClassName
  start = performance.now();
  for (let i = 0; i < iterations; i++) {
    document.getElementsByClassName("item-even");
  }
  results.getElementsByClassName = performance.now() - start;

  // querySelector with ID
  start = performance.now();
  for (let i = 0; i < iterations; i++) {
    document.querySelector("#item-500");
  }
  results.querySelectorID = performance.now() - start;

  // querySelector with class
  start = performance.now();
  for (let i = 0; i < iterations; i++) {
    document.querySelector(".item-even");
  }
  results.querySelectorClass = performance.now() - start;

  // querySelectorAll
  start = performance.now();
  for (let i = 0; i < iterations; i++) {
    document.querySelectorAll(".item-even");
  }
  results.querySelectorAll = performance.now() - start;

  // Scoped query (from container instead of document!)
  start = performance.now();
  for (let i = 0; i < iterations; i++) {
    container.querySelector(".item-even");
  }
  results.scopedQuery = performance.now() - start;

  console.log(`═══ QUERY BENCHMARK (${iterations} iterations) ═══\n`);
  Object.entries(results).forEach(([method, time]) => {
    console.log(`${method}: ${time.toFixed(2)}ms`);
  });

  // HTMLCollection read cost demo
  const liveCollection = document.getElementsByClassName("item-even");
  start = performance.now();
  for (let i = 0; i < liveCollection.length; i++) {
    const el = liveCollection[i]; // Each access = re-traversal!
  }
  const liveTime = performance.now() - start;

  const staticList = document.querySelectorAll(".item-even");
  start = performance.now();
  for (let i = 0; i < staticList.length; i++) {
    const el = staticList[i]; // Direct array access!
  }
  const staticTime = performance.now() - start;

  console.log(`\n═══ READ COST COMPARISON ═══`);
  console.log(`HTMLCollection loop: ${liveTime.toFixed(2)}ms (O(N²)!)`);
  console.log(`NodeList loop: ${staticTime.toFixed(2)}ms (O(N)!)`);

  container.remove();
}

console.log("getElementById = O(1) Hashmap = FASTEST!");
console.log("getElementsByClassName = LIVE = O(N) read!");
console.log("querySelectorAll = copies = O(1) read, O(N) memory!");
```

---

## Checklist

```
[ ] DOM API = methods to manipulate DOM!
[ ] Class Hierarchy: Node → Element (DOM API) → HTMLElement!
[ ] TextNode wraps text, HTMLDocument is outlier!
[ ] getElementById = Hashmap = O(1) = BEST!
[ ] getElementsByClassName = DFS + cache, returns HTMLCollection!
[ ] HTMLCollection = LIVE → read O(N), low memory!
[ ] Don't loop HTMLCollection → O(N²)!
[ ] querySelector = CSS selector, close to getElementById!
[ ] querySelectorAll = NodeList = NOT live, copies, O(1) read!
[ ] querySelectorAll = memory cost (copies all elements!)
[ ] Selector complexity = compile cost every execution!
[ ] Browser caching = no guarantee across engines!
TIẾP THEO → Phần 9: DOM Performance Best Practices!
```
