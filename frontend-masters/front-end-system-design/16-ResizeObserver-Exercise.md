# Front-End System Design — Phần 16: ResizeObserver Exercise — "Rectangle → Circle at 150px!"

> 📅 2026-03-09 · ⏱ 20 phút đọc
>
> Nguồn: Frontend Masters — Evgenii Ray (Meta, ex-JetBrains)
> Bài: ResizeObserver Exercise — "Resize rectangle → becomes circle when size < 150px. Track borderBoxSize[0].blockSize and inlineSize. Set borderRadius: 100%. Debounce callback. 98% browser support, polyfill for rest."
> Độ khó: ⭐️⭐️⭐️ | Practical — live coding exercise!

---

## Mục Lục

| #   | Phần                                                  |
| --- | ----------------------------------------------------- |
| 1   | The Goal — "Rectangle → Circle!"                      |
| 2   | Step 1: Create ResizeObserver                         |
| 3   | Step 2: Check Size < 150px                            |
| 4   | Step 3: Apply borderRadius                            |
| 5   | Step 4: Query All Boxes and Observe                   |
| 6   | Complete Solution                                     |
| 7   | Q&A — Debounce, LTR/RTL, MutationObserver Performance |
| 8   | Observer API Summary                                  |

---

## §1. The Goal — "Rectangle → Circle!"

> Evgenii: _"When you resize your rectangle, it becomes circle when size < 150px. Four nice circles. Resize back → rectangle again."_

```
EXERCISE:
═══════════════════════════════════════════════════════════════

  Size ≥ 150px:                Size < 150px:
  ┌──────────────┐             ╭──────╮
  │              │             │      │
  │  Rectangle!  │    →→→      │  ○   │  Circle!
  │              │             │      │
  └──────────────┘             ╰──────╯

  borderRadius: unset          borderRadius: 100%
```

---

## §2. Step 1: Create ResizeObserver

```javascript
const observer = new ResizeObserver((entries) => {
  for (const entry of entries) {
    // Step 2: check size...
  }
});
```

---

## §3. Step 2: Check Size < 150px

```javascript
for (const entry of entries) {
  const target = entry.target;
  const box = entry.borderBoxSize[0]; // Always [0]!

  if (box.blockSize < 150 && box.inlineSize < 150) {
    // Small → circle!
  } else {
    // Large → rectangle!
  }
}
```

---

## §4. Step 3: Apply borderRadius

```javascript
if (box.blockSize < 150 && box.inlineSize < 150) {
  target.style.borderRadius = "100%";
  target.style.border = "4px solid red";
} else {
  target.style.borderRadius = "unset";
  target.style.border = "unset";
}
```

---

## §5. Step 4: Query All Boxes and Observe

```javascript
const boxes = document.querySelectorAll(".box");
boxes.forEach((box) => {
  observer.observe(box); // One observer, multiple elements!
});
```

---

## §6. Complete Solution

```html
<!DOCTYPE html>
<html>
  <head>
    <style>
      .box {
        width: 200px;
        height: 200px;
        background: #3498db;
        margin: 10px;
        display: inline-block;
        resize: both;
        overflow: auto; /* Enable resize! */
        transition: border-radius 0.3s ease;
      }
    </style>
  </head>
  <body>
    <div class="box"></div>
    <div class="box"></div>
    <div class="box"></div>
    <div class="box"></div>

    <script>
      const observer = new ResizeObserver((entries) => {
        for (const entry of entries) {
          const target = entry.target;
          const box = entry.borderBoxSize[0];

          if (box.blockSize < 150 && box.inlineSize < 150) {
            target.style.borderRadius = "100%";
            target.style.border = "4px solid #e74c3c";
          } else {
            target.style.borderRadius = "unset";
            target.style.border = "unset";
          }
        }
      });

      document.querySelectorAll(".box").forEach((box) => {
        observer.observe(box);
      });
    </script>
  </body>
</html>
```

---

## §7. Q&A — Debounce, LTR/RTL, MutationObserver Performance

> Student: _"Is it still reapplying styles as you keep moving under 150?"_
> Evgenii: _"Yeah, callback is fired. You still need to debounce to make sure not firing too often. But much more performant than resize event."_

```
KEY Q&A POINTS:
═══════════════════════════════════════════════════════════════

  Q: inlineSize/blockSize change with vertical text (Japanese)?
  A: "Yes! If render top-to-bottom, inlineSize tracks height
     instead. Check CSS spec." — Evgenii

  Q: MutationObserver with subtree:true for 1000+ nodes?
  A: "Might be issue on low hardware, but native level = still
     good. Better to provide specific config. If 10,000 elements,
     even native level may have issues.
     Optimization: observe only selected line, not full doc!" — Evgenii

  Q: Observer API browser support?
  A: "98% support. For remaining 2%, use polyfill.
     Not as performant, but 98% get good experience!" — Evgenii
```

---

## §8. Observer API Summary

```
OBSERVER API — COMPLETE SUMMARY:
═══════════════════════════════════════════════════════════════

  IntersectionObserver:
  → Virtualization, lazy loading, analytics
  → 50× faster than setInterval!
  → Native level, async callbacks

  MutationObserver:
  → Text editors, drawing tools, extensions
  → Native level vs JS proxy polyfill
  → Configure precisely!

  ResizeObserver:
  → Charts, dashboards, adaptive UI
  → 10× faster than resize event!
  → Element-level, not just window!

  "Observer API is very performant way for complex patterns.
   Replace legacy setInterval/resize with Observer API.
   98% browser support!" — Evgenii
```

---

## Checklist

```
[ ] borderBoxSize[0].blockSize AND inlineSize < 150!
[ ] borderRadius: '100%' = circle, 'unset' = rectangle!
[ ] One observer tracks ALL boxes!
[ ] Debounce if callback fires too often!
[ ] inlineSize/blockSize swap in vertical writing!
[ ] Observer API: 98% support, polyfill for rest!
TIẾP THEO → Phần 17: Virtualization Technique!
```
