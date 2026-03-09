# Front-End System Design — Phần 18: Building Virtualization from Scratch — "Complete Implementation!"

> 📅 2026-03-09 · ⏱ 45 phút đọc
>
> Nguồn: Frontend Masters — Evgenii Ray (Meta, ex-JetBrains)
> Bài: Coding Virtualization — "6 exercises in 1! Skeleton → Observer → Load Data → Pool → Recycle Down → Recycle Up. Sliding window with start/end pointers. Pool = 2×pageSize limit. Swap halves, updateData, updateElementPosition with translateY (GPU!). Move observers. Scroll height preservation."
> Độ khó: ⭐️⭐️⭐️⭐️⭐️ | Advanced — most complex exercise!

---

## Mục Lục

| #   | Phần                                                |
| --- | --------------------------------------------------- |
| 1   | Exercise Overview — "6 Steps!"                      |
| 2   | Step 1: Skeleton — HTML Template                    |
| 3   | Step 2: IntersectionObserver Setup                  |
| 4   | Step 3: Loading Data (Bottom Observer)              |
| 5   | Step 4: Creating the Pool — "Limit = 2 × pageSize!" |
| 6   | Step 5: Recycling Down — "Swap, Update, Move!"      |
| 7   | Step 6: Recycling Up — "Reverse Direction!"         |
| 8   | Scroll Height Preservation                          |
| 9   | Complete Implementation                             |
| 10  | Key Formulas                                        |

---

## §1. Exercise Overview — "6 Steps!"

```
6 EXERCISES IN 1:
═══════════════════════════════════════════════════════════════

  1. Skeleton: container + top-observer + virtual-list + bottom-observer
  2. Observer: IntersectionObserver on both sentinels
  3. Load Data: fetch page → create cards → append (like lazy scroll!)
  4. Pool: limit = 2 × pageSize, store elements in array
  5. Recycle Down: swap halves, update data, move with translateY
  6. Recycle Up: reverse direction, move elements backward
```

---

## §2. Step 1: Skeleton — HTML Template

```javascript
class VirtualList {
  constructor(root) {
    this.root = root;
    this.state = { start: 0, end: 0, pool: [] };
    this.limit = this.props.pageSize * 2;
  }

  toHTML() {
    return `
      <div class="container" style="position: relative;">
        <div id="top-observer">Top Observer</div>
        <div id="virtual-list"></div>
        <div id="bottom-observer">Bottom Observer</div>
      </div>
    `.trim();
  }

  render() {
    this.root.innerHTML = this.toHTML();
    this.effect(); // Register observers!
  }
}
```

```
SKELETON STRUCTURE:
═══════════════════════════════════════════════════════════════

  container (position: relative = reference point!)
  ├── #top-observer (sentinel)
  ├── #virtual-list (cards go here!)
  └── #bottom-observer (sentinel)
```

---

## §3. Step 2: IntersectionObserver Setup

```javascript
effect() {
  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;

        if (entry.target.id === 'bottom-observer') {
          this.handleBottomObserver();
        }
        if (entry.target.id === 'top-observer') {
          this.handleTopObserver();
        }
      }
    },
    { threshold: 0.2 }
  );

  // Observe BOTH sentinels!
  observer.observe(document.getElementById('top-observer'));
  observer.observe(document.getElementById('bottom-observer'));
}
```

---

## §4. Step 3: Loading Data (Bottom Observer)

> Evgenii: _"Sliding window with start and end pointers. getPage fetches data, getTemplate creates element, updateTemplate reuses element."_

```javascript
// Props (provided by user of VirtualList):
this.props = {
  getPage: async (page) => db.getPage(page),      // Fetch data
  getTemplate: (datum) => createCard(datum),        // NEW element
  updateTemplate: (datum, el) => updateCard(datum, el), // REUSE element
  pageSize: 10
};

async handleBottomObserver() {
  // 1. Fetch data
  const data = await this.props.getPage(this.state.end);
  this.state.end++;
  this.state.start++;  // Update sliding window!

  // 2. Build cards in fragment
  const fragment = document.createDocumentFragment();
  for (const datum of data) {
    const card = this.props.getTemplate(datum);
    fragment.appendChild(card);
  }

  // 3. Append to list
  const list = document.getElementById('virtual-list');
  list.appendChild(fragment);
}
```

```
getTemplate vs updateTemplate:
═══════════════════════════════════════════════════════════════

  getTemplate(datum):
  → Creates NEW DOM element from template
  → Used when pool is not full yet

  updateTemplate(datum, existingElement):
  → Reuses EXISTING element, updates text content
  → Used when recycling (pool is full!)
  → No new DOM node created! ✅
```

---

## §5. Step 4: Creating the Pool — "Limit = 2 × pageSize!"

> Evgenii: _"We can't just render elements as we scroll. We need a limit — double the page size. Virtual memory array stores HTML element references."_

```javascript
// limit = 2 × pageSize (two pages in memory!)
this.limit = this.props.pageSize * 2; // e.g., 20

async handleBottomObserver() {
  const data = await this.props.getPage(this.state.end);
  this.state.end++;

  // ONLY create new elements if pool not full!
  if (this.state.pool.length < this.limit) {
    const fragment = document.createDocumentFragment();
    for (const datum of data) {
      const card = this.props.getTemplate(datum);
      this.state.pool.push(card);  // Add to pool!
      fragment.appendChild(card);
    }
    list.appendChild(fragment);
  } else {
    // Pool is full → RECYCLE! (Step 5)
  }
}
```

```
POOL LIFECYCLE:
═══════════════════════════════════════════════════════════════

  Scroll 1: pool = [C1,C2,...,C10]     → 10/20 (add!)
  Scroll 2: pool = [C1,...,C10,...,C20] → 20/20 (add!)
  Scroll 3: pool FULL → RECYCLE!       → 20/20 (recycle!)
  Scroll 4: pool FULL → RECYCLE!       → 20/20 (recycle!)
  ...forever 20 nodes!
```

---

## §6. Step 5: Recycling Down — "Swap, Update, Move!"

### 5a. Swap Halves

```javascript
// Pool is full → recycle first half!
const toRecycle = this.state.pool.slice(0, this.props.pageSize);
const unchanged = this.state.pool.slice(this.props.pageSize);

// Swap: unchanged first, recycled at end!
this.state.pool = [...unchanged, ...toRecycle];
```

```
SWAP HALVES:
═══════════════════════════════════════════════════════════════

  Before: [C1, C2, C3, C4, C5, C6, C7, C8, C9, C10, ...]
           ├─ toRecycle ─┤  ├──── unchanged ─────────────┤

  After:  [C6, C7, C8, C9, C10, ..., C1, C2, C3, C4, C5]
           ├──── unchanged ─────────┤  ├── toRecycle ────┤
```

### 5b. Update Data

```javascript
updateData(elements, data) {
  data.forEach((datum, index) => {
    this.props.updateTemplate(datum, elements[index]);
    // Reuses DOM element, just changes textContent!
  });
}

// Call after swap:
this.updateData(toRecycle, data);
```

### 5c. Move Elements with Transform

```javascript
updateElementPosition(direction) {
  if (direction === 'down') {
    for (let i = 0; i < this.state.pool.length; i++) {
      const prev = this.state.pool.at(i - 1); // Circular!
      const current = this.state.pool[i];

      const prevY = y(prev);

      if (prevY === null) {
        // First element: initialize to 0!
        y(current, 0);
      } else {
        // Calculate from previous position!
        const newY = y(prev)
          + prev.getBoundingClientRect().height
          + MARGIN * 2;
        y(current, newY);
      }

      // Move with GPU transform!
      current.style.transform = translateY(y(current));
    }
  }

  // Move observers!
  this.moveObservers();
}
```

```
POSITION CALCULATION (DOWN):
═══════════════════════════════════════════════════════════════

  Item3 (first in pool):
  → prevY = null (Item2 has no data-y yet)
  → Set Item3.data-y = 0

  Item4:
  → prevY = y(Item3) = 0
  → newY = 0 + height(Item3) + margin×2
  → Set Item4.data-y = newY

  Item5 (recycled from Item1):
  → prevY = y(Item4) = e.g., 120
  → newY = 120 + height(Item4) + margin×2
  → Set Item5.data-y = newY

  CSS: transform: translateY(newY + "px")
  → GPU pipeline! No reflow! ✅
```

### 5d. Move Observers

```javascript
moveObservers() {
  const first = this.state.pool[0];
  const last = this.state.pool.at(-1);

  const topY = y(first);
  const bottomY = y(last)
    + last.getBoundingClientRect().height
    + MARGIN;

  topObserver.style.transform = translateY(topY);
  bottomObserver.style.transform = translateY(bottomY);
}
```

---

## §7. Step 6: Recycling Up — "Reverse Direction!"

> Evgenii: _"Backward direction. Exchange arrays — second half becomes toRecycle. Loop backward from pageSize-1 to 0, decrement i."_

```javascript
async handleTopObserver() {
  if (this.state.start <= 0) return; // Nothing above!

  this.state.start--;
  const data = await this.props.getPage(this.state.start);
  this.state.end--;

  // Swap halves (REVERSE order!)
  const unchanged = this.state.pool.slice(0, this.props.pageSize);
  const toRecycle = this.state.pool.slice(this.props.pageSize);

  // toRecycle goes to FRONT!
  this.state.pool = [...toRecycle, ...unchanged];

  this.updateData(toRecycle, data);
  this.updateElementPosition('top');
}
```

```
POSITION CALCULATION (TOP — BACKWARD!):
═══════════════════════════════════════════════════════════════

  Loop from pageSize-1 down to 0!

  Item6 (current), Item3 (next rendered):
  → newY = y(Item3) - margin×2 - height(Item6)
  → Item6 placed ABOVE Item3!

  Item5 (current), Item6 (next):
  → newY = y(Item6) - margin×2 - height(Item5)
  → Item5 placed ABOVE Item6!
```

```javascript
// In updateElementPosition:
if (direction === "top") {
  for (let i = this.props.pageSize - 1; i >= 0; i--) {
    const current = this.state.pool[i];
    const next = this.state.pool[i + 1];

    const newY = y(next) - MARGIN * 2 - current.getBoundingClientRect().height;

    y(current, newY);
    current.style.transform = translateY(newY);
  }
}
```

---

## §8. Scroll Height Preservation

> Evgenii: _"When scroll down, scrollbar increases. When scroll to top, it decreases. One line fix: set container height to scrollHeight."_

```javascript
// In handleBottomObserver, after recycling:
const container = document.querySelector(".container");
container.style.height = container.scrollHeight + "px";
// Preserves scrollbar when scrolling back up! ✅
```

---

## §9. Complete Implementation

```javascript
// ═══ UTILITY FUNCTIONS ═══
const MARGIN = 8;

function y(element, value) {
  if (value !== undefined) {
    element.setAttribute("data-y", value);
    return;
  }
  const attr = element.getAttribute("data-y");
  return attr !== null ? Number(attr) : null;
}

function translateY(value) {
  return `translateY(${value}px)`;
}

// ═══ VIRTUAL LIST ═══
class VirtualList {
  constructor(root, props) {
    this.root = root;
    this.props = props;
    this.state = { start: 0, end: 0, pool: [] };
    this.limit = props.pageSize * 2;
  }

  toHTML() {
    return `
      <div class="container" style="position:relative">
        <div id="top-observer">Top</div>
        <div id="virtual-list"></div>
        <div id="bottom-observer">Bottom</div>
      </div>`.trim();
  }

  render() {
    this.root.innerHTML = this.toHTML();
    this.effect();
  }

  effect() {
    const observer = new IntersectionObserver(
      (entries) => this.handleIntersection(entries),
      { threshold: 0.2 },
    );
    observer.observe(document.getElementById("top-observer"));
    observer.observe(document.getElementById("bottom-observer"));
  }

  handleIntersection(entries) {
    for (const entry of entries) {
      if (!entry.isIntersecting) continue;
      if (entry.target.id === "bottom-observer") this.handleBottom();
      if (entry.target.id === "top-observer") this.handleTop();
    }
  }

  async handleBottom() {
    const data = await this.props.getPage(this.state.end);
    this.state.end++;

    if (this.state.pool.length < this.limit) {
      // Still filling pool
      const fragment = document.createDocumentFragment();
      for (const datum of data) {
        const card = this.props.getTemplate(datum);
        this.state.pool.push(card);
        fragment.appendChild(card);
      }
      document.getElementById("virtual-list").appendChild(fragment);
    } else {
      // Pool full → RECYCLE!
      this.state.start++;
      const toRecycle = this.state.pool.slice(0, this.props.pageSize);
      const unchanged = this.state.pool.slice(this.props.pageSize);
      this.state.pool = [...unchanged, ...toRecycle];
      this.updateData(toRecycle, data);
      this.updatePosition("down");
    }

    // Preserve scroll height
    const container = document.querySelector(".container");
    container.style.height = container.scrollHeight + "px";
  }

  async handleTop() {
    if (this.state.start <= 0) return;
    this.state.start--;
    const data = await this.props.getPage(this.state.start);
    this.state.end--;

    const unchanged = this.state.pool.slice(0, this.props.pageSize);
    const toRecycle = this.state.pool.slice(this.props.pageSize);
    this.state.pool = [...toRecycle, ...unchanged];
    this.updateData(toRecycle, data);
    this.updatePosition("top");
  }

  updateData(elements, data) {
    data.forEach((datum, i) => {
      this.props.updateTemplate(datum, elements[i]);
    });
  }

  updatePosition(direction) {
    const pool = this.state.pool;

    if (direction === "down") {
      for (let i = 0; i < pool.length; i++) {
        const prev = pool.at(i - 1);
        const current = pool[i];
        const prevY = y(prev);
        const newY =
          prevY === null
            ? 0
            : prevY + prev.getBoundingClientRect().height + MARGIN * 2;
        y(current, newY);
        current.style.transform = translateY(newY);
      }
    }

    if (direction === "top") {
      for (let i = this.props.pageSize - 1; i >= 0; i--) {
        const current = pool[i];
        const next = pool[i + 1];
        const newY =
          y(next) - MARGIN * 2 - current.getBoundingClientRect().height;
        y(current, newY);
        current.style.transform = translateY(newY);
      }
    }

    // Move observers
    const first = pool[0];
    const last = pool.at(-1);
    const topObs = document.getElementById("top-observer");
    const botObs = document.getElementById("bottom-observer");
    topObs.style.transform = translateY(y(first));
    botObs.style.transform = translateY(
      y(last) + last.getBoundingClientRect().height + MARGIN,
    );
  }
}

// CSS required:
// .card { position: absolute; width: 100%; }
```

---

## §10. Key Formulas

```
KEY FORMULAS:
═══════════════════════════════════════════════════════════════

  Pool limit:
  limit = pageSize × 2

  Position (scrolling DOWN):
  newY = y(prev) + height(prev) + margin × 2

  Position (scrolling UP):
  newY = y(next) - margin × 2 - height(current)

  Top observer position:
  topY = y(firstElement)

  Bottom observer position:
  bottomY = y(lastElement) + height(lastElement) + margin

  Scroll preservation:
  container.style.height = container.scrollHeight + "px"
```

---

## Checklist

```
[ ] Skeleton: container + top/bottom observer + virtual-list!
[ ] IntersectionObserver on both sentinels (threshold: 0.2)!
[ ] Filter entry.target.id for top/bottom!
[ ] Sliding window: start/end pointers!
[ ] Pool grows until limit (2 × pageSize)!
[ ] Pool full → swap halves + updateData + move!
[ ] Down: loop forward, y = prevY + prevHeight + margin!
[ ] Up: loop backward, y = nextY - margin - currentHeight!
[ ] pool.at(-1) for circular/backward access!
[ ] position:absolute for all cards!
[ ] transform:translateY = GPU, no reflow!
[ ] data-y attribute stores Y position!
[ ] Move observers after recycling!
[ ] container.style.height = scrollHeight + "px"!
[ ] "DOM is not modified at all. Just moving pixels." — Evgenii
```
