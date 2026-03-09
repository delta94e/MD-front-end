# Front-End System Design — Phần 5: Reflow — "DOM + CSSOM → Render Tree → Layout → Paint → Composite!"

> 📅 2026-03-09 · ⏱ 35 phút đọc
>
> Nguồn: Frontend Masters — Evgenii Ray (Meta, ex-JetBrains)
> Bài: Reflow — "JavaScript modifies DOM → Style recalc → Layout (CPU!) → Paint (GPU!) → Composite. margin-top animation = CPU reflow = LAG! translateY = GPU only = SMOOTH 60fps!"
> Độ khó: ⭐️⭐️⭐️⭐️⭐️ | Critical — hiểu pipeline = optimize mọi thứ!

---

## Mục Lục

| #   | Phần                                                |
| --- | --------------------------------------------------- |
| 1   | DOM + CSSOM → Render Tree                           |
| 2   | What Is Reflow? — "JavaScript Triggers It!"         |
| 3   | The Rendering Pipeline — 5 Steps!                   |
| 4   | Step 1-2: Style + Layout — "CPU Bound!"             |
| 5   | Step 3: Paint — "GPU Draws Pixels!"                 |
| 6   | Step 4: Composite — "Arrange Layers!"               |
| 7   | Optimized vs Non-Optimized Pipeline                 |
| 8   | The 2-Line Difference — "margin-top vs translateY!" |
| 9   | Wikipedia Reflow Demo                               |
| 10  | Deep Dive: What Triggers Reflow?                    |
| 11  | Tự Code: Pipeline Performance Comparison            |

---

## §1. DOM + CSSOM → Render Tree

> Evgenii: _"When you read HTML and CSS, the browser compiles two trees. DOM = object representation of HTML. CSSOM = tree of all CSS rules. The final render tree is built by merging both."_

```
DOM + CSSOM → RENDER TREE:
═══════════════════════════════════════════════════════════════

  HTML                          CSS
  ─────                         ─────
  <html>                        html { font: 16px; }
    <body>                      .card { width: 300px; }
      <div class="card">        .card h2 { color: blue; }
        <h2>Title</h2>          .hidden { display: none; }
        <p>Text</p>
        <span class="hidden">
      </div>
    </body>
  </html>

       │                           │
       ▼                           ▼
   DOM TREE                    CSSOM TREE
   ────────                    ──────────
   html                       html → font: 16px
   └─ body                    .card → width: 300px
      └─ div.card              .card h2 → color: blue
         ├─ h2                 .hidden → display: none
         ├─ p
         └─ span.hidden

       │              │
       └──────┬───────┘
              ▼
        RENDER TREE
        ────────────
        html (font: 16px)
        └─ body
           └─ div.card (width: 300px)
              ├─ h2 (color: blue)
              └─ p
              ❌ span.hidden NOT in render tree!
                 (display:none removed!)
```

---

## §2. What Is Reflow? — "JavaScript Triggers It!"

> Evgenii: _"Reflow happens when JavaScript tries to modify the DOM tree or styles. Like a 'load more' button rendering more cards, or React doing DOM modifications."_

```
WHAT TRIGGERS REFLOW:
═══════════════════════════════════════════════════════════════

  1. DOM Modification:
     button.addEventListener('click', () => {
       list.appendChild(newCard);  // DOM changed → REFLOW!
     });

  2. React/Vue rendering:
     ReactDOM.render(<App />, container);
     // React modifies DOM via DOM API → REFLOW!

  3. Style changes:
     element.style.width = '500px';  // Style changed → REFLOW!

  4. Window resize:
     window.onresize → ALL elements recalculated → REFLOW!

  5. Font loading:
     Font loads → text size changes → REFLOW!
```

---

## §3. The Rendering Pipeline — 5 Steps!

```
REFLOW PIPELINE (Full):
═══════════════════════════════════════════════════════════════

  JavaScript ──→ Style ──→ Layout ──→ Paint ──→ Composite
     │             │          │         │          │
     │          Recalc     Recalc     Draw       Arrange
     │          DOM +      positions  pixels     layers
     │          CSSOM      & sizes    (bitmap)   in order
     │             │          │         │          │
     │          ┌──┴──────────┤         │          │
     │          │  CPU BOUND  │     GPU BOUND      │
     │          │  (BLOCKS    │     (DOESN'T       │
     │          │   RENDER    │      BLOCK!)        │
     │          │   THREAD!)  │                     │
     │          └─────────────┘                     │
     │                                              │
     ▼                                              ▼
  TRIGGER                                        SCREEN!
```

---

## §4. Step 1-2: Style + Layout — "CPU Bound!"

> Evgenii: _"The style and layout phases are very CPU bound. If we trigger reflow too much, we can block the render thread."_

```
STYLE PHASE (CPU):
═══════════════════════════════════════════════════════════════

  What happens:
  • Recalculate CSS selector matching
  • Rebuild DOM subtree affected
  • Rebuild CSSOM subtree affected
  • Merge into updated render tree

  Cost: O(affected elements × CSS rules!)

LAYOUT PHASE (CPU):
═══════════════════════════════════════════════════════════════

  What happens:
  • Recalculate positions (x, y) for affected elements
  • Recalculate dimensions (width, height)
  • Propagate changes to children/siblings

  Cost: depends on how many elements affected!

  ⚠️ BOTH phases run on MAIN THREAD!
  ⚠️ If too slow → UI FREEZES! No clicks, no scroll!
```

---

## §5. Step 3: Paint — "GPU Draws Pixels!"

> Evgenii: _"The GPU draws pixels on your monitor. It's separated from CPU, doesn't block the rendering thread, and is pretty fast because GPU is very good at drawing pixels."_

```
PAINT PHASE (GPU):
═══════════════════════════════════════════════════════════════

  GPU = Graphics Processing Unit
  ┌─────────────────────────────────────────┐
  │  Thousands of small cores!               │
  │  Optimized for parallel pixel drawing!   │
  │  SEPARATE from CPU!                      │
  │  Does NOT block main thread!             │
  └─────────────────────────────────────────┘

  CPU says: "Here's the layout. Draw it!"
  GPU says: "Done! 2000 rectangles painted in <1ms!"

  ✅ Fast because: GPU = massively parallel!
  ✅ Non-blocking because: separate processor!
```

---

## §6. Step 4: Composite — "Arrange Layers!"

> Evgenii: _"The composite phase — when you have multiple layers, arrange them in the right order."_

```
COMPOSITE PHASE:
═══════════════════════════════════════════════════════════════

  Layer 3: [Tooltip]            z-index: 100
  Layer 2: [Modal backdrop]     z-index: 50
  Layer 1: [Content]            z-index: 0

  Compositing = stack layers in correct order!
  → GPU operation = fast!
  → No layout recalculation needed!
```

---

## §7. Optimized vs Non-Optimized Pipeline

> Evgenii: _"Rendering 2000 rectangles. Optimized pipeline = 0% CPU, 60fps. Non-optimized = CPU loaded, lag!"_

```
PIPELINE COMPARISON:
═══════════════════════════════════════════════════════════════

  NON-OPTIMIZED (Full pipeline):
  JS → Style → Layout → Paint → Composite
  ← ALL 5 steps every frame! →
  CPU: ████████████████████ HIGH! Frame drops!

  OPTIMIZED (Skip style + layout):
  JS → ─────────────────── Composite
  ← Only GPU compositing! →
  CPU: ░░░░░░░░░░░░░░░░░░░ 0%! Smooth 60fps!

  Evgenii's demo:
  ├── Optimized: "0% CPU, flat line, no lag!"
  ├── Non-optimized: "CPU loaded, buffer filled in 3 seconds!"
  └── "This Mac is 16 cores, but not every device has that!"
```

---

## §8. The 2-Line Difference — "margin-top vs translateY!"

> Evgenii: _"The difference is just two lines. margin-top → browser recalculates position of ALL 2000 rectangles. translateY → only moves pixels, GPU only, no CPU!"_

```css
/* ❌ NON-OPTIMIZED: triggers full reflow! */
@keyframes move-bad {
  from {
    margin-top: 0;
  }
  to {
    margin-top: 100px;
  }
}

/* ✅ OPTIMIZED: GPU only, no reflow! */
@keyframes move-good {
  from {
    transform: translateY(0);
  }
  to {
    transform: translateY(100px);
  }
}
```

```
WHY THE DIFFERENCE?
═══════════════════════════════════════════════════════════════

  margin-top changes:
  → Browser: "margin changed → recalc positions of ALL
     2000 elements → layout → paint → composite"
  → CPU: BUSY! 🔥 Every single frame!

  translateY changes:
  → Browser: "transform changed → just move pixels on GPU
     → composite only!"
  → CPU: FREE! ✅ GPU handles everything!

  "CSS transformations do not utilize CPU!" — Evgenii

  SAFE (GPU-only):           EXPENSIVE (CPU reflow):
  ✅ transform               ❌ width, height
  ✅ opacity                 ❌ margin, padding
                             ❌ top, left, right, bottom
                             ❌ font-size
                             ❌ border-width
```

---

## §9. Wikipedia Reflow Demo

> Evgenii: _"This is how browser renders the page with reflow. First, top to bottom. Then styles load → full reflow → top to bottom again adjusting styles."_

```
WIKIPEDIA REFLOW SEQUENCE:
═══════════════════════════════════════════════════════════════

  Step 1: HTML loads (no CSS yet!)
  ┌──────────────────────┐
  │ Title                │  Raw text, no styles!
  │ Content              │
  │ More content         │
  └──────────────────────┘

  Step 2: CSS loads → REFLOW!
  ┌──────────────────────────────────────┐
  │ ┌──── Sidebar ─────┐ ┌── Content ──┐│
  │ │ Navigation       │ │ Styled!     ││
  │ │ Links             │ │ Formatted!  ││
  │ └──────────────────┘ └─────────────┘│
  └──────────────────────────────────────┘

  Step 3: Images load → REFLOW again!
  (Images push content down as they load!)
  → This is why CLS (Cumulative Layout Shift) matters!
```

---

## §10. Deep Dive: What Triggers Reflow?

```
REFLOW TRIGGERS:
═══════════════════════════════════════════════════════════════

  🔴 Layout properties (triggers Style + Layout + Paint):
  width, height, padding, margin, border
  top, left, right, bottom
  display, position, float
  font-size, font-family, line-height
  text-align, vertical-align
  overflow

  🟡 Paint-only properties (triggers Paint only):
  color, background-color
  box-shadow, text-shadow
  border-color, outline
  visibility

  🟢 Composite-only (GPU only, cheapest!):
  transform (translate, rotate, scale)
  opacity

  Check: csstriggers.com → see pipeline for every property!
```

---

## §11. Tự Code: Pipeline Performance Comparison

```javascript
// ═══ REFLOW vs GPU-ONLY DEMO ═══

function createReflowDemo() {
  const container = document.createElement("div");
  container.style.cssText = "padding:20px; font-family:monospace;";

  // Create 500 boxes
  const boxes = [];
  for (let i = 0; i < 500; i++) {
    const box = document.createElement("div");
    box.style.cssText = `
      width:10px; height:10px; background:#e74c3c;
      display:inline-block; margin:1px;
    `;
    container.appendChild(box);
    boxes.push(box);
  }
  document.body.appendChild(container);

  let frame = 0;

  // ❌ NON-OPTIMIZED: margin-top = REFLOW!
  function animateBad() {
    boxes.forEach((box) => {
      box.style.marginTop = Math.sin(frame * 0.05) * 20 + "px";
    });
    frame++;
    requestAnimationFrame(animateBad);
  }

  // ✅ OPTIMIZED: transform = GPU only!
  function animateGood() {
    boxes.forEach((box) => {
      box.style.transform = `translateY(${Math.sin(frame * 0.05) * 20}px)`;
    });
    frame++;
    requestAnimationFrame(animateGood);
  }

  // Measure performance
  function measure(fn, label) {
    const times = [];
    let count = 0;
    function tick() {
      const start = performance.now();
      fn();
      times.push(performance.now() - start);
      count++;
      if (count < 60) requestAnimationFrame(tick);
      else {
        const avg = times.reduce((a, b) => a + b) / times.length;
        console.log(`${label}: avg ${avg.toFixed(2)}ms/frame`);
      }
    }
    tick();
  }

  console.log("═══ REFLOW PERFORMANCE ═══");
  console.log("margin-top: triggers full reflow (CPU!) every frame");
  console.log("transform: GPU only, no reflow, smooth!");
  console.log("\nThe 2-line difference between lag and smooth!");
}
```

---

## Checklist

```
[ ] DOM + CSSOM → Render Tree (display:none excluded!)
[ ] Reflow triggered by JS modifying DOM/styles!
[ ] Pipeline: JS → Style → Layout → Paint → Composite!
[ ] Style + Layout = CPU bound = blocks main thread!
[ ] Paint = GPU = fast, non-blocking!
[ ] Composite = arrange layers = cheapest!
[ ] margin-top animation = full pipeline = LAG!
[ ] translateY animation = composite only = 60fps!
[ ] GPU-safe: transform, opacity!
[ ] CPU-expensive: width, height, margin, padding, top, left!
[ ] csstriggers.com = check any CSS property!
TIẾP THEO → Phần 6: Composition Layers!
```
