# Front-End System Design — Phần 12: Infinite Scroll with IntersectionObserver — "Load More When Bottom Observer Intersects!"

> 📅 2026-03-09 · ⏱ 30 phút đọc
>
> Nguồn: Frontend Masters — Evgenii Ray (Meta, ex-JetBrains)
> Bài: Infinite Scroll — "IntersectionObserver + DocumentFragment + MockDB. Observe bottom sentinel → fetch page → create cards in fragment → appendChild once! Prerequisite for virtualization. 10 DOM mutations → 1 operation!"
> Độ khó: ⭐️⭐️⭐️ | Practical — live coding exercise!

---

## Mục Lục

| #   | Phần                                             |
| --- | ------------------------------------------------ |
| 1   | The Goal — "Simple Infinite Scroller!"           |
| 2   | Architecture — "Bottom Observer Pattern!"        |
| 3   | Setup — "MockDB, Container, Observer Element!"   |
| 4   | Step 1: Create IntersectionObserver              |
| 5   | Step 2: Fetch Data on Intersect                  |
| 6   | Step 3: Build Cards in DocumentFragment          |
| 7   | Step 4: Append Fragment to List — "1 Operation!" |
| 8   | Step 5: Observe the Bottom Element               |
| 9   | Complete Solution                                |
| 10  | Deep Dive: Why Fragment Matters Here             |
| 11  | Tự Code: Full Infinite Scroll Implementation     |

---

## §1. The Goal — "Simple Infinite Scroller!"

> Evgenii: _"We're going to utilize the IntersectionObserver to create a very simple version of infinite scroller. Load content once you're intersecting with the bottom observer. No virtualization yet — prerequisite exercise for virtualization."_

```
INFINITE SCROLL CONCEPT:
═══════════════════════════════════════════════════════════════

  ┌─── Viewport ────────────────────────────┐
  │                                          │
  │  ┌── Card 1 ──────────────────────┐     │
  │  └────────────────────────────────┘     │
  │  ┌── Card 2 ──────────────────────┐     │
  │  └────────────────────────────────┘     │
  │  ┌── Card 3 ──────────────────────┐     │
  │  └────────────────────────────────┘     │
  │                                          │
  │  ┌── Bottom Observer ─────────────┐     │
  │  │   (sentinel element)           │     │ ← User scrolls here!
  │  └────────────────────────────────┘     │
  └──────────────────────────────────────────┘

  When bottom observer INTERSECTS viewport:
  → Fetch next page of data!
  → Create card elements in fragment!
  → Append fragment to list!
  → Observer stays at bottom → repeat!
```

---

## §2. Architecture — "Bottom Observer Pattern!"

```
ARCHITECTURE:
═══════════════════════════════════════════════════════════════

  IntersectionObserver
       │
       │ watches
       ▼
  Bottom Observer Element (sentinel)
       │
       │ intersects viewport → callback fires!
       ▼
  Async Callback
       │
       ├── 1. page++ (increment page pointer)
       ├── 2. db.getPage(page) → fetch data
       ├── 3. Create DocumentFragment
       ├── 4. Loop data → createCard → fragment.appendChild
       └── 5. list.appendChild(fragment) → ONE reflow!

  10 cards fetched → 10 DOM mutations in memory
  → 1 actual DOM operation! ✅
```

---

## §3. Setup — "MockDB, Container, Observer Element!"

```html
<!DOCTYPE html>
<html>
  <head>
    <template id="card-template">
      <article class="card">
        <h2 class="card_title"></h2>
        <p class="card_body_content"></p>
      </article>
    </template>
  </head>
  <body>
    <div id="list">
      <!-- Cards will be appended here -->
    </div>
    <div id="bottom-observer">
      <!-- Sentinel: when this enters viewport, load more! -->
    </div>

    <script>
      // MockDB: simulates paginated API
      // createCard: reuses template from Part 10
      // list: querySelector('#list')
      // observerElement: querySelector('#bottom-observer')
    </script>
  </body>
</html>
```

```
SETUP ELEMENTS:
═══════════════════════════════════════════════════════════════

  MockDB (initDatabase):
  ├── Takes sample object as template
  ├── Returns similar objects
  └── getPage(pageNumber) → returns array of data

  Card Template:
  ├── Reused from Part 10!
  └── createCard(title, body) → returns DOM element

  List Container:
  └── #list → where all cards go

  Bottom Observer:
  └── #bottom-observer → sentinel element at bottom!
```

---

## §4. Step 1: Create IntersectionObserver

> Evgenii: _"Let's create one instance. Callback accepts entries. Threshold of 0.2, viewport as intersection root."_

```javascript
// Page pointer — starts at 0, increments each fetch
let page = 0;

// Create IntersectionObserver
const observer = new IntersectionObserver(
  async (entries) => {
    // Handle intersection callback
  },
  {
    threshold: 0.2, // Fire when 20% of sentinel visible!
    // root: null → default viewport!
  },
);
```

```
THRESHOLD 0.2:
═══════════════════════════════════════════════════════════════

  ┌─── Viewport ─────────────────────┐
  │                                   │
  │  ... cards ...                    │
  │                                   │
  │  ┌── Bottom Observer ──────┐     │
  │  │░░░░░░░░░░░░░░░░░░░░░░░│     │ ← 20% visible = FIRE!
  │  └─────────────────────────┘     │
  └───────────────────────────────────┘
  │  │█████████████████████████│     │ ← 80% still below
  │  └─────────────────────────┘     │

  threshold: 0.2 = fire early (before fully visible!)
  → Better UX: data loads before user sees sentinel!
```

---

## §5. Step 2: Fetch Data on Intersect

> Evgenii: _"Check if entry isIntersecting. Convert callback to async. Use await on MockDB.getPage(page). Increment page each time."_

```javascript
const observer = new IntersectionObserver(
  async ([entry]) => {
    // Destructure: only 1 sentinel!
    if (entry.isIntersecting) {
      // Fetch next page!
      const data = await db.getPage(page);
      page++;

      // ... build cards next!
    }
  },
  { threshold: 0.2 },
);
```

```
DESTRUCTURING TRICK:
═══════════════════════════════════════════════════════════════

  // We know there's only ONE sentinel being observed.
  // So entries array always has 1 element!

  // Instead of:
  (entries) => {
    entries.forEach(entry => { ... });
  }

  // We can destructure:
  ([entry]) => {
    if (entry.isIntersecting) { ... }
  }

  // Cleaner! "I know we have only one intersection entry,
  //           so I can destructure the array." — Evgenii
```

---

## §6. Step 3: Build Cards in DocumentFragment

> Evgenii: _"Create new DocumentFragment to accumulate all DOM mutations. Loop data, create card, fragment.appendChild(card). We accumulate all DOM updates within the same memory object."_

```javascript
if (entry.isIntersecting) {
  const data = await db.getPage(page);
  page++;

  // Create fragment to batch mutations!
  const fragment = document.createDocumentFragment();

  // Build all cards in memory (NO reflow!)
  for (const datum of data) {
    const card = createCard(datum.title, datum.body);
    fragment.appendChild(card); // In memory only!
  }

  // ... append to DOM next!
}
```

```
FRAGMENT ACCUMULATION:
═══════════════════════════════════════════════════════════════

  data = [item1, item2, item3, ..., item10]

  fragment (in memory, no reflow!):
  ┌────────────────────────────────────────────┐
  │  Card 1 → Card 2 → Card 3 → ... → Card 10 │
  │  (all built from template, populated!)      │
  │  (zero DOM mutations so far!)               │
  └────────────────────────────────────────────┘

  "Instead of having 10 operations,
   we now just have 1!" — Evgenii
```

---

## §7. Step 4: Append Fragment to List — "1 Operation!"

```javascript
// ONE DOM operation for all 10 cards!
list.appendChild(fragment); // 1 reflow, not 10! ✅
```

```
10 OPERATIONS → 1:
═══════════════════════════════════════════════════════════════

  ❌ Without fragment (10 reflows!):
  for (const datum of data) {
    const card = createCard(datum.title, datum.body);
    list.appendChild(card);  // REFLOW! × 10 times!
  }

  ✅ With fragment (1 reflow!):
  const fragment = document.createDocumentFragment();
  for (const datum of data) {
    const card = createCard(datum.title, datum.body);
    fragment.appendChild(card);  // Memory only!
  }
  list.appendChild(fragment);    // 1 REFLOW! ✅
```

---

## §8. Step 5: Observe the Bottom Element

```javascript
// Start observing the sentinel!
observer.observe(observerElement);
```

```
OBSERVATION FLOW:
═══════════════════════════════════════════════════════════════

  1. observer.observe(bottomSentinel)
  2. User scrolls down...
  3. Sentinel enters viewport (20% visible)
  4. Callback fires! (async)
  5. Fetch page 0 → build cards → append!
  6. Cards push sentinel down below viewport
  7. User scrolls more...
  8. Sentinel re-enters viewport
  9. Callback fires again!
  10. Fetch page 1 → build cards → append!
  11. Repeat infinitely! ♾️

  Sentinel always stays at the BOTTOM!
  Each append pushes it further down!
```

---

## §9. Complete Solution

```html
<!DOCTYPE html>
<html>
  <head>
    <style>
      .card {
        border: 1px solid #ddd;
        padding: 16px;
        margin: 8px;
        border-radius: 8px;
      }
      #bottom-observer {
        height: 50px;
        background: #f0f0f0;
        display: flex;
        align-items: center;
        justify-content: center;
        color: #888;
      }
    </style>

    <template id="card-template">
      <article class="card">
        <h2 class="card_title"></h2>
        <p class="card_body_content"></p>
      </article>
    </template>
  </head>
  <body>
    <div id="list"></div>
    <div id="bottom-observer">Loading...</div>

    <script>
      // ═══ Mock Database ═══
      function initDatabase(sample, totalItems = 100, pageSize = 10) {
        const items = Array.from({ length: totalItems }, (_, i) => ({
          title: `${sample.title} ${i + 1}`,
          body: `${sample.body} — Item #${i + 1}`,
        }));

        return {
          getPage: async (page) => {
            // Simulate network delay
            await new Promise((r) => setTimeout(r, 300));
            const start = page * pageSize;
            return items.slice(start, start + pageSize);
          },
        };
      }

      // ═══ Card Creator (from Part 10) ═══
      function createCard(title, body) {
        const template = document.getElementById("card-template");
        const card = template.content.cloneNode(true).firstElementChild;
        const [cardTitle, cardBody] = card.querySelectorAll(
          ".card_title, .card_body_content",
        );
        cardTitle.textContent = title;
        cardBody.textContent = body;
        return card;
      }

      // ═══ Setup ═══
      const db = initDatabase({
        title: "Card",
        body: "This is card content",
      });
      const list = document.querySelector("#list");
      const observerElement = document.querySelector("#bottom-observer");
      let page = 0;

      // ═══ IntersectionObserver ═══
      const observer = new IntersectionObserver(
        async ([entry]) => {
          if (entry.isIntersecting) {
            // Fetch data
            const data = await db.getPage(page);
            page++;

            // Build cards in fragment (no reflow!)
            const fragment = document.createDocumentFragment();
            for (const datum of data) {
              const card = createCard(datum.title, datum.body);
              fragment.appendChild(card);
            }

            // ONE DOM operation!
            list.appendChild(fragment);
          }
        },
        { threshold: 0.2 },
      );

      // Start observing!
      observer.observe(observerElement);
    </script>
  </body>
</html>
```

---

## §10. Deep Dive: Why Fragment Matters Here

```
FRAGMENT IN INFINITE SCROLL:
═══════════════════════════════════════════════════════════════

  Each scroll event loads ~10 cards.
  After 10 scrolls: 100 cards total.

  Without fragment:
  10 scrolls × 10 cards × 1 reflow each = 100 reflows! 💀

  With fragment:
  10 scrolls × 1 reflow each = 10 reflows! ✅

  90% reduction in reflow operations!

  And each reflow is expensive:
  Style recalc → Layout → Paint → Composite
  All on CPU main thread!

  "Instead of having 10 operations,
   we now just have 1." — Evgenii
```

---

## §11. Tự Code: Full Infinite Scroll Implementation

```javascript
// ═══ PRODUCTION-READY INFINITE SCROLL ═══

class InfiniteScroll {
  #observer;
  #page = 0;
  #loading = false;
  #hasMore = true;
  #list;
  #sentinel;
  #fetchFn;
  #renderFn;

  constructor({ listSelector, sentinelSelector, fetchFn, renderFn }) {
    this.#list = document.querySelector(listSelector);
    this.#sentinel = document.querySelector(sentinelSelector);
    this.#fetchFn = fetchFn;
    this.#renderFn = renderFn;

    this.#observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !this.#loading && this.#hasMore) {
          this.#loadMore();
        }
      },
      { threshold: 0.2 },
    );
  }

  async #loadMore() {
    this.#loading = true;
    this.#sentinel.textContent = "Loading...";

    try {
      const data = await this.#fetchFn(this.#page);

      if (!data || data.length === 0) {
        this.#hasMore = false;
        this.#sentinel.textContent = "No more items!";
        this.#observer.disconnect();
        return;
      }

      // Build ALL cards in fragment (no reflow!)
      const fragment = document.createDocumentFragment();
      for (const item of data) {
        const element = this.#renderFn(item);
        fragment.appendChild(element);
      }

      // ONE DOM operation!
      this.#list.appendChild(fragment);
      this.#page++;
    } catch (error) {
      console.error("Failed to load:", error);
      this.#sentinel.textContent = "Error loading. Scroll to retry.";
    } finally {
      this.#loading = false;
    }
  }

  start() {
    this.#observer.observe(this.#sentinel);
    return this;
  }

  destroy() {
    this.#observer.disconnect();
  }
}

// Usage:
const scroller = new InfiniteScroll({
  listSelector: "#list",
  sentinelSelector: "#bottom-observer",
  fetchFn: (page) => db.getPage(page),
  renderFn: (item) => createCard(item.title, item.body),
});

scroller.start();

// Key patterns used:
// 1. IntersectionObserver (Part 11!)
// 2. DocumentFragment batching (Part 9!)
// 3. Template cloning (Part 10!)
// 4. Async/await for data fetching
// 5. Loading state to prevent duplicate fetches
// 6. hasMore flag to stop when no data left

console.log("═══ INFINITE SCROLL ═══");
console.log("Observer watches sentinel at bottom");
console.log("Sentinel intersects → fetch page → build fragment → append!");
console.log("10 cards per page × 1 reflow = efficient!");
console.log("Prerequisite for virtualization pattern!");
```

---

## Checklist

```
[ ] IntersectionObserver on bottom sentinel element!
[ ] threshold: 0.2 = fire before fully visible (better UX!)
[ ] Destructure [entry] when only 1 observed element!
[ ] entry.isIntersecting → fetch next page!
[ ] Increment page pointer each fetch!
[ ] DocumentFragment batches all card creation!
[ ] fragment.appendChild(card) = in memory, no reflow!
[ ] list.appendChild(fragment) = ONE reflow for all cards!
[ ] 10 operations → 1 operation!
[ ] Sentinel stays at bottom, pushed down by new cards!
[ ] Prerequisite for virtualization (Part 13+!)
TIẾP THEO → Phần 13: Virtualization!
```
