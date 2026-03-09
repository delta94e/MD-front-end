# Front-End System Design — Phần 9: DOM Performance Best Practices — "Simplify Selectors, Avoid innerHTML, Use insertAdjacentElement!"

> 📅 2026-03-09 · ⏱ 30 phút đọc
>
> Nguồn: Frontend Masters — Evgenii Ray (Meta, ex-JetBrains)
> Bài: DOM Performance — "Simplify selectors (save 5ms each × 100 = 50ms!). Use ID for core containers + scope queries from there. innerHTML = HTML parser = expensive! insertAdjacentElement = compiled HTML = cheaper! Every DOM mutation triggers reflow — minimize it!"
> Độ khó: ⭐️⭐️⭐️⭐️ | Practical — optimize DOM operations!

---

## Mục Lục

| #   | Phần                                                              |
| --- | ----------------------------------------------------------------- |
| 1   | Simplify Selectors — "Complex = Extra Tax!"                       |
| 2   | Scope Queries with ID — "10,000 → 1 Operation!"                   |
| 3   | Adding & Removing — "Every Method Is Bad!"                        |
| 4   | innerHTML — "HTML Parser = Expensive!"                            |
| 5   | insertAdjacentElement — "Compiled HTML = Cheaper!"                |
| 6   | Position Options — "beforebegin, afterbegin, beforeend, afterend" |
| 7   | Removing Elements                                                 |
| 8   | When Using Frameworks — "Trust the Library!"                      |
| 9   | Deep Dive: Reflow Batching                                        |
| 10  | Tự Code: Efficient DOM Manipulation                               |

---

## §1. Simplify Selectors — "Complex = Extra Tax!"

> Evgenii: _"Each time you use a complex selector, the CSS compiler needs to transpile it. You pay extra tax. 5ms per query × 100 queries = 50ms delay. Combined with other optimizations, results can be significant."_

```
SELECTOR COMPLEXITY COST:
═══════════════════════════════════════════════════════════════

  ❌ Complex selector:
  document.querySelector(
    "div.container > ul.list > li.item:nth-child(2n+1) > span.text"
  );
  → Compiler must parse EVERY token!
  → Cost: ~5ms each execution
  → 100 calls = 500ms! 💀

  ✅ Simple selector:
  document.querySelector(".item-text");
  → Quick compile!
  → Cost: ~0.5ms
  → 100 calls = 50ms ✅

  ✅ BEST — getElementById:
  document.getElementById("item-text");
  → No compile needed! Hashmap!
  → Cost: ~0.01ms
  → 100 calls = 1ms! ⚡

  "All these things accumulate!" — Evgenii
```

---

## §2. Scope Queries with ID — "10,000 → 1 Operation!"

> Evgenii: _"If you have a DOM tree with 10,000 elements, querying from HTML goes through all 10,000. But if you select a section with ID first, then query from that section — just one operation."_

```
SCOPED QUERIES:
═══════════════════════════════════════════════════════════════

  ❌ Query from document (whole tree!):
  document.querySelector(".card-title");
  → Traverses 10,000 elements!

  ✅ Scope to container first:
  const section = document.getElementById("cards-section");
  section.querySelector(".card-title");
  → getElementById = O(1) hashmap!
  → Then traverse only section's subtree (~100 elements)!

  DOM Tree:
  html (10,000 elements total)
  └── body
      ├── header (500 elements)
      ├── nav (300 elements)
      ├── main
      │   ├── section#cards-section ← Query from HERE!
      │   │   └── (100 elements) ← Only search HERE!
      │   └── section.other (2000 elements)
      └── footer (200 elements)

  10,000 → 100 elements to search! 100× faster!
```

---

## §3. Adding & Removing — "Every Method Is Bad!"

> Evgenii: _"When it comes to adding or removing, every method is bad [LAUGH]. The performance impact is always significant. Every DOM modification triggers reflow. We want to minimize reflow operations."_

```
DOM MUTATION = REFLOW:
═══════════════════════════════════════════════════════════════

  ANY DOM change triggers:
  JS → Style → Layout → Paint → Composite
       ^^^^^^^^^^^^^^^^
       CPU BOUND! EXPENSIVE!

  There is NO "good" method to insert.
  Every method triggers reflow!
  Goal: MINIMIZE the number of reflow operations!

  "In our application, we want to minimize
   reflow operations." — Evgenii
```

---

## §4. innerHTML — "HTML Parser = Expensive!"

> Evgenii: _"innerHTML involves the HTML parser to compile HTML again, do full reflow, validate. You pay the cost of parsing. Same applies to insertAdjacentHTML."_

```
innerHTML COST:
═══════════════════════════════════════════════════════════════

  element.innerHTML = '<div class="card"><h2>Title</h2></div>';

  What browser does:
  1. Parse raw HTML string
     → Tokenize: <div, class=, "card", >, <h2, ...
     → Build DOM nodes
     → Validate HTML structure
  2. Remove all existing children
  3. Replace with new DOM tree
  4. Trigger FULL REFLOW!

  Cost: parsing + validation + reflow = EXPENSIVE!

  ❌ Don't use repeatedly:
  for (let i = 0; i < 100; i++) {
    list.innerHTML += `<li>Item ${i}</li>`;
    // 100 parse + reflow cycles! 💀
  }

  ✅ OK for one-time initialization:
  container.innerHTML = initialTemplate;
  // Single parse + single reflow = acceptable!
```

### insertAdjacentHTML — Same Problem!

```javascript
// ❌ Also uses HTML parser!
element.insertAdjacentHTML("beforeend", "<div>Card</div>");
// Browser still needs to parse raw HTML string!
```

---

## §5. insertAdjacentElement — "Compiled HTML = Cheaper!"

> Evgenii: _"If you need to insert elements dynamically, use insertAdjacentElement or appendChild. It takes compiled HTML object and just renders on DOM. No parsing needed!"_

```
insertAdjacentElement:
═══════════════════════════════════════════════════════════════

  // Pre-compiled element (already a DOM object!)
  const card = document.createElement('div');
  card.className = 'card';
  card.textContent = 'Title';

  // Insert — no HTML parsing needed!
  container.insertAdjacentElement('beforeend', card);

  What browser does:
  1. ❌ No parsing! (already compiled!)
  2. ❌ No validation! (already valid DOM node!)
  3. ✅ Just attach to DOM tree
  4. ✅ Trigger reflow (unavoidable, but faster!)

  innerHTML:               insertAdjacentElement:
  Parse + Validate         Skip parsing!
  + Build DOM              Already DOM!
  + Reflow                 + Reflow (only!)
  = SLOW! 🐌              = FASTER! 🚀
```

---

## §6. Position Options — "beforebegin, afterbegin, beforeend, afterend"

```
insertAdjacentElement POSITIONS:
═══════════════════════════════════════════════════════════════

  <!-- beforebegin → BEFORE the element -->
  <div id="target">
    <!-- afterbegin → FIRST child -->
    <p>Existing content</p>
    <!-- beforeend → LAST child -->
  </div>
  <!-- afterend → AFTER the element -->

  Usage:
  target.insertAdjacentElement('beforebegin', el1);
  target.insertAdjacentElement('afterbegin', el2);
  target.insertAdjacentElement('beforeend', el3);
  target.insertAdjacentElement('afterend', el4);

  Result:
  <div>el1</div>           ← beforebegin
  <div id="target">
    <div>el2</div>          ← afterbegin (first child!)
    <p>Existing content</p>
    <div>el3</div>          ← beforeend (last child!)
  </div>
  <div>el4</div>           ← afterend

  "Very flexible, can be used almost anywhere!" — Evgenii
```

---

## §7. Removing Elements

```
REMOVING ELEMENTS:
═══════════════════════════════════════════════════════════════

  // Method 1: element.remove()
  element.remove();
  // → Removes from DOM, triggers reflow!

  // Method 2: Reset HTML
  container.innerHTML = '';
  // → Removes ALL children, involves parser, reflow!

  // Method 3: Legacy — parent.removeChild()
  parent.removeChild(child);
  // → Old API, same effect as remove()!

  Preferred: element.remove() — clean, modern!
```

---

## §8. When Using Frameworks — "Trust the Library!"

> Student: _"If using React or Angular, are there recommendations for improving performance?"_
> Evgenii: _"You just rely on the library. The only place you might use DOM API is within React effects. Trying to optimize React internals is not a good idea — it's quite complex inside."_

```
FRAMEWORKS & DOM API:
═══════════════════════════════════════════════════════════════

  React/Vue/Angular handle DOM mutations for you!
  → Don't fight the framework!
  → Don't call innerHTML inside React components!
  → Don't manually manipulate DOM that React manages!

  WHERE you CAN use DOM API in React:
  useEffect(() => {
    // Measure element dimensions
    const rect = ref.current.getBoundingClientRect();

    // Focus management
    inputRef.current.focus();

    // Third-party library integration
    const chart = new Chart(canvasRef.current, config);

    return () => chart.destroy();
  }, []);

  "Trying to optimize React is not a good idea
   because it's quite complex inside." — Evgenii
```

---

## §9. Deep Dive: Reflow Batching

```
REFLOW BATCHING — MINIMIZE MUTATIONS:
═══════════════════════════════════════════════════════════════

  ❌ BAD: Multiple reflows!
  list.appendChild(item1);  // Reflow 1!
  list.appendChild(item2);  // Reflow 2!
  list.appendChild(item3);  // Reflow 3!
  // 3 reflows! 💀

  ✅ GOOD: Use DocumentFragment!
  const fragment = document.createDocumentFragment();
  fragment.appendChild(item1);  // In memory, no reflow!
  fragment.appendChild(item2);  // In memory, no reflow!
  fragment.appendChild(item3);  // In memory, no reflow!
  list.appendChild(fragment);   // ONE reflow! ✅

  ✅ ALSO GOOD: Detach → modify → reattach!
  const parent = list.parentNode;
  parent.removeChild(list);     // Detach from DOM
  list.appendChild(item1);      // In memory!
  list.appendChild(item2);      // In memory!
  list.appendChild(item3);      // In memory!
  parent.appendChild(list);     // ONE reflow!

  ✅ ALSO GOOD: display:none → modify → show!
  list.style.display = 'none';  // Remove from render tree
  // ... modify as much as you want!
  list.style.display = '';       // ONE reflow!
```

---

## §10. Tự Code: Efficient DOM Manipulation

```javascript
// ═══ DOM PERFORMANCE PATTERNS ═══

// Pattern 1: Batch with DocumentFragment
function batchInsert(container, items) {
  const fragment = document.createDocumentFragment();

  items.forEach((item) => {
    const el = document.createElement("div");
    el.className = "item";
    el.textContent = item;
    fragment.appendChild(el); // NO reflow here!
  });

  container.appendChild(fragment); // ONE reflow!
}

// Pattern 2: Scoped queries
function scopedQuery(sectionId, selector) {
  const root = document.getElementById(sectionId); // O(1)!
  return root.querySelector(selector); // Small subtree!
}

// Pattern 3: Avoid live collection loops
function safeLoop() {
  // ❌ DANGEROUS: live collection + loop = O(N²)!
  // const items = document.getElementsByClassName('item');
  // for (let i = 0; i < items.length; i++) { ... }

  // ✅ SAFE: NodeList + loop = O(N)!
  const items = document.querySelectorAll(".item");
  items.forEach((item) => {
    // O(1) access each time!
  });
}

// Pattern 4: Template-based creation
function createFromTemplate(templateId, data) {
  const template = document.getElementById(templateId);
  const clone = template.content.cloneNode(true).firstElementChild;

  Object.entries(data).forEach(([selector, value]) => {
    const el = clone.querySelector(selector);
    if (el) el.textContent = value;
  });

  return clone; // Return compiled DOM, no innerHTML!
}

console.log("═══ DOM PERFORMANCE ═══");
console.log("1. Simplify selectors (save compile cost!)");
console.log("2. Scope queries with ID containers!");
console.log("3. Batch mutations with DocumentFragment!");
console.log("4. Use insertAdjacentElement over innerHTML!");
console.log("5. Avoid looping live HTMLCollection!");
console.log("6. Trust framework for DOM management!");
```

---

## Checklist

```
[ ] Simplify selectors = less compile cost!
[ ] Scope queries: getElementById → querySelector from subtree!
[ ] Every DOM mutation = reflow (no good method!)
[ ] innerHTML = parser + validation + reflow = expensive!
[ ] insertAdjacentElement = skip parser = cheaper!
[ ] 4 positions: beforebegin, afterbegin, beforeend, afterend!
[ ] element.remove() = modern way to remove!
[ ] DocumentFragment = batch multiple inserts into ONE reflow!
[ ] Don't loop HTMLCollection → O(N²)!
[ ] Framework users: trust the library, don't fight it!
TIẾP THEO → Phần 10: DOM Templating Exercise!
```
