# Front-End System Design — Phần 17: Virtualization Technique — "Maintain Constant DOM Nodes, Recycle Elements!"

> 📅 2026-03-09 · ⏱ 35 phút đọc
>
> Nguồn: Frontend Masters — Evgenii Ray (Meta, ex-JetBrains)
> Bài: Virtualization — "UI optimization: maintain data in virtual memory, render limited subset. Minimize DOM elements, reduce mutations, reduce CPU/memory. Top observer + bottom observer + viewport. Recycle elements: swap halves, update data, move with transform (GPU!)."
> Độ khó: ⭐️⭐️⭐️⭐️⭐️ | Advanced — most complex exercise in course!

---

## Mục Lục

| #   | Phần                                          |
| --- | --------------------------------------------- |
| 1   | What Is Virtualization?                       |
| 2   | Lazy Scroll vs Virtualization                 |
| 3   | High-Level Concept — "Top + Bottom Observer!" |
| 4   | The Recycle Process                           |
| 5   | When to Use Virtualization?                   |
| 6   | Why position:absolute + transform?            |
| 7   | Architecture Overview                         |

---

## §1. What Is Virtualization?

> Evgenii: _"UI optimization technique that involves maintaining data in virtual memory while rendering only a limited subset. Purpose: minimize DOM elements, reduce mutations, reduce CPU and memory usage."_

```
VIRTUALIZATION:
═══════════════════════════════════════════════════════════════

  Without virtualization (10,000 items):
  DOM has 10,000 nodes! 💀
  → Browser struggles to maintain!
  → More resources utilized!
  → Scroll becomes janky!

  With virtualization (10,000 items):
  DOM has only 20 nodes! ✅
  → Constant DOM size!
  → Recycle elements as user scrolls!
  → Smooth performance!

  "The larger the DOM tree, the harder it is
   for the browser to maintain." — Evgenii
```

---

## §2. Lazy Scroll vs Virtualization

```
LAZY SCROLL vs VIRTUALIZATION:
═══════════════════════════════════════════════════════════════

  Lazy Scroll (Part 12):
  ├── Appends NEW elements as you scroll
  ├── DOM grows unbounded!
  ├── 10 scrolls × 10 items = 100 DOM nodes
  └── Eventually performance degrades!

  Virtualization:
  ├── Fixed pool of elements (e.g., 20)!
  ├── RECYCLE elements as you scroll
  ├── 100 scrolls → still only 20 DOM nodes!
  └── Constant performance! ✅

  "We can't create more elements anymore.
   We need to REUSE existing elements." — Evgenii
```

---

## §3. High-Level Concept — "Top + Bottom Observer!"

```
VIRTUALIZATION STRUCTURE:
═══════════════════════════════════════════════════════════════

  ┌─── Top Observer ──────────────────────┐
  │  (sentinel: detects scroll UP)         │
  ├────────────────────────────────────────┤
  │                                        │
  │  ┌── Item 1 ────────────────────┐     │
  │  └───────────────────────────────┘     │
  │  ┌── Item 2 ────────────────────┐     │
  │  └───────────────────────────────┘     │
  │                                        │
  │  ┌─── VIEWPORT ─────────────────┐     │
  │  │ Item 3                        │     │
  │  │ Item 4                        │     │
  │  └───────────────────────────────┘     │
  │                                        │
  │  ┌── Item 5 ────────────────────┐     │
  │  └───────────────────────────────┘     │
  │  ┌── Item 6 ────────────────────┐     │
  │  └───────────────────────────────┘     │
  │                                        │
  ├────────────────────────────────────────┤
  │  (sentinel: detects scroll DOWN)       │
  └─── Bottom Observer ───────────────────┘

  Page size: 2 → limit: 4 (2 pages in memory!)
  Viewport touches bottom → load + recycle!
  Viewport touches top → reverse recycle!
```

---

## §4. The Recycle Process

> Evgenii: _"We select items to recycle — item 1 and 2. User can't see them. Move them after item 4 and 3. Swap halves, update data, move observers."_

```
RECYCLE WHEN SCROLLING DOWN:
═══════════════════════════════════════════════════════════════

  Step 1: Initial state
  Pool: [Item1, Item2, Item3, Item4]
  start: 0, end: 2

  Step 2: Bottom observer triggered!
  → Items 1,2 are above viewport (invisible!)
  → RECYCLE them!

  Step 3: Swap halves in memory
  Pool: [Item3, Item4, Item1, Item2]  ← swapped!
  "unchanged" = [Item3, Item4]
  "toRecycle"  = [Item1, Item2]

  Step 4: Update data of recycled items
  Item1.textContent → "Item 5 data"
  Item2.textContent → "Item 6 data"

  Step 5: Move elements with CSS transform (GPU!)
  Item1 → translateY(position after Item4)
  Item2 → translateY(position after Item1-as-5)

  Step 6: Move observers
  Top observer → before Item3
  Bottom observer → after Item2-as-6

  Step 7: Update pointers
  start: 1, end: 3

  Result: DOM unchanged! Only 4 nodes! Data updated! ✅
```

---

## §5. When to Use Virtualization?

> Evgenii: _"Mobile apps where you need to not overuse memory. Social network feeds, tables with thousands of elements. For desktop, adjust limit to 200 or disable virtualization — desktops have good performance."_

```
WHEN TO VIRTUALIZE:
═══════════════════════════════════════════════════════════════

  ✅ USE virtualization:
  • Mobile apps (limited memory/CPU!)
  • Social network feeds (infinite content!)
  • Tables with 1000+ rows
  • When scroll feels "sticky"

  ❌ SKIP virtualization:
  • Desktop-only apps (good hardware!)
  • Small lists (< 200 items)
  • "95% clients on desktop? Don't overcomplicate!" — Evgenii

  ADJUST for desktop:
  • Increase limit from 20 → 200
  • Or disable virtualization entirely
  • "Virtualization is used in places where
     they actually don't need it." — Evgenii
```

---

## §6. Why position:absolute + transform?

> Student: _"How did position absolute solve the problem?"_
> Evgenii: _"If you don't remove from normal flow, elements take their natural position. With absolute, all reset to top-left. We adjust using transform — GPU pipeline, doesn't impact render thread."_

```
WHY ABSOLUTE + TRANSFORM:
═══════════════════════════════════════════════════════════════

  Normal flow:
  Elements stack naturally → can't control position!
  Moving elements = complex calculations!

  position: absolute:
  All elements reset to top-left (0,0)!
  → We control position with transform!

  transform: translateY(Npx):
  → Uses GPU pipeline (not CPU!)
  → Doesn't trigger full reflow!
  → Just moves pixels! ✅

  Container: position: relative (reference point!)
  Cards: position: absolute + transform: translateY()
```

---

## §7. Architecture Overview

```
VIRTUAL LIST ARCHITECTURE:
═══════════════════════════════════════════════════════════════

  VirtualList class:
  ├── Constructor(root):
  │   ├── root: where to render
  │   ├── props: { getPage, getTemplate, updateTemplate, pageSize }
  │   └── state: { start, end, pool[], limit }
  │
  ├── toHTML(): returns template string
  │   └── container > top-observer + virtual-list + bottom-observer
  │
  ├── effect(): register observers
  │   └── IntersectionObserver(threshold: 0.2)
  │       ├── handleTopObserver()
  │       └── handleBottomObserver()
  │
  ├── handleBottomObserver():
  │   ├── if pool < limit → create new elements!
  │   └── else → recycle top half!
  │       ├── swap halves in pool
  │       ├── updateData(recycled, newData)
  │       └── updateElementPosition('down')
  │
  ├── handleTopObserver():
  │   ├── if start > 0 → recycle bottom half!
  │   ├── swap halves (reverse order!)
  │   ├── updateData(recycled, newData)
  │   └── updateElementPosition('top')
  │
  ├── updateElementPosition(direction):
  │   ├── 'down': loop forward, calc Y from previous
  │   ├── 'top': loop backward, calc Y from next
  │   └── Move observers to new positions!
  │
  └── Utility functions:
      ├── y(el, val): get/set data-y attribute
      └── translateY(val): return CSS transform string
```

---

## Checklist

```
[ ] Virtualization = constant DOM nodes, recycle elements!
[ ] Lazy scroll vs virtualization: unbounded vs fixed pool!
[ ] Top observer (scroll up) + bottom observer (scroll down)!
[ ] Pool = array of DOM elements maintained in memory!
[ ] Limit = 2 × pageSize (two pages in memory!)
[ ] Recycle: swap halves → update data → move with transform!
[ ] position:absolute = remove from normal flow!
[ ] transform:translateY = GPU, no reflow!
[ ] data-y attribute stores element Y position!
[ ] Mobile: use virtualization. Desktop: maybe skip!
TIẾP THEO → Phần 18: Building Virtualization from Scratch!
```
