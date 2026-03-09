# Front-End System Design — Phần 15: ResizeObserver — "10× Faster Than resize Event!"

> 📅 2026-03-09 · ⏱ 30 phút đọc
>
> Nguồn: Frontend Masters — Evgenii Ray (Meta, ex-JetBrains)
> Bài: ResizeObserver — "4 methods: CSS media/container (no JS!), resize event (SLOW!), ResizeObserver (10× faster!). box: content-box/border-box. borderBoxSize[0].inlineSize = width."
> Độ khó: ⭐️⭐️⭐️⭐️ | Core — resize tracking, performance!

---

## Mục Lục

| #   | Phần                                           |
| --- | ---------------------------------------------- |
| 1   | 4 Methods to Track Resize                      |
| 2   | CSS Media Query — "Best, No JS!"               |
| 3   | CSS Container Query — "Element-Level!"         |
| 4   | resize Event — "SLOW! 5000 Fires!"             |
| 5   | ResizeObserver — "10× Faster!"                 |
| 6   | API — box, borderBoxSize, inlineSize/blockSize |
| 7   | Performance Comparison                         |
| 8   | Tự Code: ResizeObserver Patterns               |

---

## §1. 4 Methods to Track Resize

```
RESIZE TRACKING:
═══════════════════════════════════════════════════════════════

  WINDOW resize:
  ├── CSS Media Query    → Best! No JS!
  └── resize Event       → Slow! 5000 fires!

  ELEMENT resize:
  ├── CSS Container Query → Fast! No JS!
  └── ResizeObserver      → 10× faster! JS callback!
```

---

## §2. CSS Media Query — "Best, No JS!"

> Evgenii: _"Performance-wise the best way for adaptive layout when you don't need JS callback."_

```css
@media (max-width: 768px) {
  .sidebar {
    display: none;
  }
  .content {
    width: 100%;
  }
}
```

✅ Best performance | ❌ No JS callback | ❌ Window only

---

## §3. CSS Container Query — "Element-Level!"

> Evgenii: _"Set up container, based on its size change children styles. Super fast."_

```css
.card-container {
  container-type: inline-size;
}
@container (max-width: 300px) {
  .card-title {
    font-size: 14px;
  }
}
```

✅ Element-level | ✅ Fast | ❌ No JS callback

---

## §4. resize Event — "SLOW! 5000 Fires!"

> Evgenii: _"Resize event is super slow. Relies on DOM events — event goes top to target then bubbles. Fired too often — 5000 times in small resize. Don't use unless you really need this."_

```
WHY SLOW:
═══════════════════════════════════════════════════════════════

  1. DOM Event Bubbling:
     Event traverses ENTIRE DOM tree each time!
     Capture ↓ → target → Bubble ↑

  2. Fires too often:
     Small drag = 5000 events!
     Without debounce = 5000 callbacks = LAG! 💀

  3. Window only:
     Cannot track specific element size!
```

---

## §5. ResizeObserver — "10× Faster!"

> Evgenii: _"Designed specifically for tracking element resize. On average 10× faster than resize event. Supports callback, tracks multiple elements."_

```javascript
const observer = new ResizeObserver((entries) => {
  for (const entry of entries) {
    const { inlineSize, blockSize } = entry.borderBoxSize[0];
    console.log(`${entry.target.id}: ${inlineSize}×${blockSize}`);
  }
});

observer.observe(element, { box: "border-box" });
```

---

## §6. API — box, borderBoxSize, inlineSize/blockSize

> Evgenii: _"box: content-box tracks just content. border-box includes border+padding. borderBoxSize is array — future multi-column. inlineSize = width, blockSize = height (LTR)."_

```
BOX OPTIONS:
═══════════════════════════════════════════════════════════════

  content-box: tracks Content only
  border-box:  tracks Content + Padding + Border

  borderBoxSize = ARRAY (future: multi-column!)
  → Always use [0] for current spec!

  inlineSize = width  (LTR languages)
  blockSize  = height (LTR languages)
  → Vertical writing: they SWAP!
```

```javascript
const box = entry.borderBoxSize[0];
box.inlineSize; // ≈ width
box.blockSize; // ≈ height

// Why array? Future multi-column elements!
// "No such elements in current spec, but future-proofed." — Evgenii
```

---

## §7. Performance Comparison

```
| Method          | Speed  | Element? | JS? |
|-----------------|--------|----------|-----|
| CSS Media Query | ⭐⭐⭐⭐⭐ | ❌ Window | ❌   |
| Container Query | ⭐⭐⭐⭐⭐ | ✅ Yes   | ❌   |
| resize Event    | ⭐      | ❌ Window | ✅   |
| ResizeObserver  | ⭐⭐⭐⭐  | ✅ Yes   | ✅   |

RECOMMENDATION:
1. Layout only? → CSS!
2. Need JS? → ResizeObserver!
3. Legacy? → resize event + debounce!
```

---

## §8. Tự Code: ResizeObserver Patterns

```javascript
// Pattern 1: Shape morpher (exercise preview!)
function shapeMorpher(selector, threshold = 150) {
  const observer = new ResizeObserver((entries) => {
    for (const entry of entries) {
      const box = entry.borderBoxSize[0];
      const isSmall = box.blockSize < threshold && box.inlineSize < threshold;
      entry.target.style.borderRadius = isSmall ? "100%" : "unset";
      entry.target.style.border = isSmall ? "4px solid red" : "unset";
    }
  });
  document
    .querySelectorAll(selector)
    .forEach((el) => observer.observe(el, { box: "border-box" }));
  return observer;
}

// Pattern 2: Trading dashboard
function tradingDashboard() {
  const observer = new ResizeObserver((entries) => {
    for (const entry of entries) {
      const { inlineSize: w, blockSize: h } = entry.borderBoxSize[0];
      const canvas = entry.target.querySelector("canvas");
      if (canvas) {
        canvas.width = w;
        canvas.height = h;
      }
    }
  });
  document
    .querySelectorAll(".chart-panel")
    .forEach((p) => observer.observe(p, { box: "content-box" }));
}

// "Set up one observer to track all charts!" — Evgenii
```

---

## Checklist

```
[ ] 4 methods: CSS media, container, resize event, ResizeObserver!
[ ] resize event = SLOW (5000 fires, DOM bubbling!)
[ ] ResizeObserver = 10× faster, element-level!
[ ] box: content-box (default) or border-box!
[ ] borderBoxSize = array, always [0] for now!
[ ] inlineSize = width, blockSize = height (LTR)!
[ ] Vertical writing: inlineSize/blockSize swap!
[ ] Debounce callback if needed!
TIẾP THEO → Phần 16: ResizeObserver Exercise!
```
