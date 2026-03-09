# Front-End System Design — Phần 6: Composition Layers — "RenderObject → RenderLayer → GraphicLayer → GPU!"

> 📅 2026-03-09 · ⏱ 35 phút đọc
>
> Nguồn: Frontend Masters — Evgenii Ray (Meta, ex-JetBrains)
> Bài: Composition Layers — "Old browsers: CPU only. New: CPU+GPU parallel! RenderObject tree (1:1 DOM) → RenderLayer tree (position/stacking) → GraphicLayer (GPU memory! 3D/video). Promote wisely — each layer = ~0.5MB VRAM!"
> Độ khó: ⭐️⭐️⭐️⭐️⭐️ | Advanced — GPU architecture, VRAM tradeoffs!

---

## Mục Lục

| #   | Phần                                                       |
| --- | ---------------------------------------------------------- |
| 1   | CPU vs GPU Rendering — "Old vs New!"                       |
| 2   | Three Trees — "RenderObject → RenderLayer → GraphicLayer!" |
| 3   | RenderObject Tree — "1:1 Copy of DOM!"                     |
| 4   | RenderLayer Tree — "Stacking Context Layers!"              |
| 5   | GraphicLayer — "GPU-Aware, VRAM Cost!"                     |
| 6   | Full Rendering Cycle — "Everything Connected!"             |
| 7   | Demo: Layer Tab in DevTools                                |
| 8   | VRAM Cost — "Each Layer = ~0.5MB!"                         |
| 9   | Rule of Thumb — "Always Prefer GPU Over CPU!"              |
| 10  | When to Promote — "High Activity Widget Only!"             |
| 11  | Tự Code: Layer Promotion Demo                              |

---

## §1. CPU vs GPU Rendering — "Old vs New!"

> Evgenii: _"Old browsers used only CPU. New browsers use CPU and GPU together in parallel."_

```
OLD vs NEW RENDERING:
═══════════════════════════════════════════════════════════════

  OLD (CPU only):
  ┌─── CPU ────────────────┐
  │ Style → Layout → Paint │  Everything on ONE processor!
  │ → Composite            │  Sequential, slow!
  └────────────────────────┘

  NEW (CPU + GPU parallel):
  ┌─── CPU ──────────────┐  ┌─── GPU ──────────────┐
  │ Style → Layout        │  │ Paint → Composite    │
  │ (positions, sizes)    │  │ (draw pixels, layers) │
  └───────────┬───────────┘  └───────────┬──────────┘
              │                          │
              └──────────┬───────────────┘
                         ▼
                    SCREEN! 🖥️

  CPU: good at sequential, complex calculations!
  GPU: good at MANY parallel, simple operations (pixels)!
```

---

## §2. Three Trees — "RenderObject → RenderLayer → GraphicLayer!"

> Evgenii: _"The browser constructs RenderObject tree, RenderLayer tree, and GraphicLayer tree to optimize for GPU rendering."_

```
THREE RENDERING TREES:
═══════════════════════════════════════════════════════════════

  DOM Tree (what you wrote):
  html → body → main → div1, div2, div3, div4

  RenderObject Tree (how to draw):
  One RenderObject per DOM element!
  Knows how to draw using graphical context!

  RenderLayer Tree (stacking/isolation):
  Created for position:relative/absolute, root, canvas!
  Groups RenderObjects into layers!

  GraphicLayer (GPU textures):
  Created for 3D transforms, video, canvas!
  Each layer = GPU memory allocation (VRAM)!

  DOM → RenderObject → RenderLayer → GraphicLayer
  (1:1)   (1:1)      (grouped)      (grouped further)
```

---

## §3. RenderObject Tree — "1:1 Copy of DOM!"

> Evgenii: _"For each DOM element, we create a new RenderObject. It's a 1:1 copy, but with completely different properties. DOM has HTML info, RenderObject knows how to DRAW."_

```
DOM ELEMENT vs RENDER OBJECT:
═══════════════════════════════════════════════════════════════

  DOM Element:                 RenderObject:
  ├── tagName                  ├── paintMethod()
  ├── className                ├── graphicContext
  ├── attributes               ├── boundingBox
  ├── children                 ├── paintOrder
  └── textContent              └── layerReference

  Example (4 absolutely positioned boxes):

  DOM Tree:                    RenderObject Tree:
  html                         RO(html)
  └─ body                      └─ RO(body)
     └─ main                      └─ RO(main)
        ├─ div.box1                   ├─ RO(box1)
        ├─ div.box2                   ├─ RO(box2)
        ├─ div.box3                   ├─ RO(box3)
        └─ div.box4                   └─ RO(box4)
```

---

## §4. RenderLayer Tree — "Stacking Context Layers!"

> Evgenii: _"RenderLayer is constructed when we use position relative/absolute, for root element, or accelerated context like Canvas/CSS filters. Stored as a linked list in stack order."_

```
RENDER LAYER CONSTRUCTION:
═══════════════════════════════════════════════════════════════

  TRIGGERS RenderLayer creation:
  • Root element (always need root layer!)
  • position: relative / absolute / fixed
  • Canvas, CSS filters
  • opacity < 1
  • will-change

  Example (4 absolute boxes):

  RenderObject Tree:           RenderLayer Tree:
  RO(html)                     RL(root) ←── root layer!
  └─ RO(body)                  ├── RO(html) + RO(body) + RO(main)
     └─ RO(main)               │   (no special properties → assigned
        ├─ RO(box1) abs        │    to root layer!)
        ├─ RO(box2) abs        │
        ├─ RO(box3) abs        ├── RL(box1) ← absolute = new layer!
        └─ RO(box4) abs        ├── RL(box2) ← absolute = new layer!
                               ├── RL(box3) ← absolute = new layer!
                               └── RL(box4) ← absolute = new layer!

  "RenderLayer children stored as linked list in stack order.
   Last layer = first rendered (painted on top!)" — Evgenii
```

---

## §5. GraphicLayer — "GPU-Aware, VRAM Cost!"

> Evgenii: _"There's an additional layer called GraphicLayer, constructed when we use 3D acceleration, perspective, or video element. Hundreds of RenderLayers → still not efficient. GraphicLayer groups them for GPU."_

```
GRAPHIC LAYER CONSTRUCTION:
═══════════════════════════════════════════════════════════════

  TRIGGERS GraphicLayer creation:
  • Root element (always at least one!)
  • 3D transforms (translate3d, perspective)
  • <video>, <canvas> (need GPU decoding!)
  • CSS will-change: transform
  • Animated opacity/transform

  Without 3D transforms:
  ┌─── GraphicLayer 1 (root) ────────────────┐
  │                                            │
  │  RL(root)  RL(box1)  RL(box2)              │
  │  RL(box3)  RL(box4)                        │
  │                                            │
  │  ALL render layers on ONE graphic layer!   │
  │  GPU memory: ~8.7 MB                       │
  └────────────────────────────────────────────┘

  With 3D transform on each box:
  ┌── GL1 (root) ──┐  ┌── GL2 ──┐  ┌── GL3 ──┐
  │ 8.7 MB          │  │ 0.5 MB  │  │ 0.5 MB  │
  │ RL(root)        │  │ RL(box1)│  │ RL(box2)│
  └─────────────────┘  └─────────┘  └─────────┘
  ┌── GL4 ──┐  ┌── GL5 ──┐
  │ 0.5 MB  │  │ 0.5 MB  │
  │ RL(box3)│  │ RL(box4)│
  └─────────┘  └─────────┘

  5 GraphicLayers = 8.7 + 4×0.5 = ~10.7 MB VRAM!
```

---

## §6. Full Rendering Cycle — "Everything Connected!"

```
FULL CYCLE:
═══════════════════════════════════════════════════════════════

  HTML → DOM Tree
           │
           ▼ (1:1)
         RenderObject Tree
           │
           ▼ (grouped by stacking)
         RenderLayer Tree
           │
           ▼ (grouped for GPU)
         GraphicLayer Tree
           │
           ▼
         GPU draws pixels! → SCREEN! 🖥️
```

---

## §7. Demo: Layer Tab in DevTools

> Evgenii: _"Open DevTools > Layers tab. Single GraphicLayer = 8.7 MB. Promote each box → 5 layers, each new one ~0.5 MB VRAM."_

```
DEVTOOLS LAYERS TAB:
═══════════════════════════════════════════════════════════════

  Before promotion (1 GraphicLayer):
  ┌─────────────────────────────┐
  │ GraphicLayer #1             │
  │ Memory: 8.7 MB              │
  │ Contains: all elements      │
  └─────────────────────────────┘

  After promoting 4 boxes (5 GraphicLayers):
  ┌──────────────────┐
  │ GL #1: 8.7 MB    │  ← Root (constant cost!)
  ├──────────────────┤
  │ GL #2: 0.5 MB    │  ← Box 1 (transform: translate3d)
  ├──────────────────┤
  │ GL #3: 0.5 MB    │  ← Box 2
  ├──────────────────┤
  │ GL #4: 0.5 MB    │  ← Box 3
  ├──────────────────┤
  │ GL #5: 0.5 MB    │  ← Box 4
  └──────────────────┘
  Total: ~10.7 MB
```

---

## §8. VRAM Cost — "Each Layer = ~0.5MB!"

> Evgenii: _"Imagine hundreds of elements promoted to GraphicLayer → 200 MB VRAM! Mobile devices don't have RTX 4090!"_

```
VRAM COST ANALYSIS:
═══════════════════════════════════════════════════════════════

  4 elements promoted:     ~10.7 MB   ✅ OK!
  100 elements promoted:   ~58.7 MB   ⚠️ Warning!
  400 elements promoted:   ~208.7 MB  💀 PROBLEM!

  Desktop (RTX 4090):  24 GB VRAM → 208 MB = fine!
  Mobile phone:        shared RAM → 208 MB = CRASH!
  Budget phone:        2 GB total → 208 MB = DEAD! 💀

  "GPU memory is not just for browser — it's for the SYSTEM!
   When we use swap cache → unresponsiveness!" — Evgenii

  "You need to put a LOT of effort to make GPU unresponsive.
   But it's very EASY to make CPU mistakes → frame drops!"
   — Evgenii
```

---

## §9. Rule of Thumb — "Always Prefer GPU Over CPU!"

> Student: _"CSS transforms are good optimizations over reflows. How do we correlate with GPU memory hit?"_
> Evgenii: _"Always better to utilize GPU than CPU. CPU blocks rendering thread → responsiveness drops. GPU → you need a LOT of effort to make it unresponsive. Few CPU mistakes → frame drop easy."_

```
GPU vs CPU — ALWAYS CHOOSE GPU:
═══════════════════════════════════════════════════════════════

  CPU reflow:
  • Blocks main thread → no clicks, no scroll!
  • Easy to cause frame drops!
  • Every margin/width change = recalc ALL elements!

  GPU compositing:
  • Separate processor → main thread FREE!
  • Hard to overload!
  • Only moves pixels, no layout recalc!

  Rule: ALWAYS prefer GPU (transform, opacity)
        over CPU (margin, width, top, left)!

  "Try to minimize any reflow. Always change properties
   that do not trigger the full pipeline." — Evgenii

  Resource: csstriggers.com → check any CSS property!
```

---

## §10. When to Promote — "High Activity Widget Only!"

> Evgenii: _"If you have a high activity widget with advanced animations → promote to separate GraphicLayer. But static page → don't promote everything!"_

```
WHEN TO PROMOTE TO GRAPHIC LAYER:
═══════════════════════════════════════════════════════════════

  ✅ PROMOTE:
  • Animated widgets (carousel, slider)
  • Elements with frequent transform changes
  • Video/Canvas elements
  • Fixed headers/footers with effects

  ❌ DON'T PROMOTE:
  • Every item in a list! (100 items = 50 MB!)
  • Static content
  • Text blocks
  • Images without animation

  HOW TO PROMOTE:
  .widget {
    will-change: transform;     /* Tell browser! */
    /* OR */
    transform: translateZ(0);   /* Force layer! */
  }
```

---

## §11. Tự Code: Layer Promotion Demo

```javascript
// ═══ LAYER PROMOTION DEMO ═══

function createLayerDemo() {
  const container = document.createElement("div");
  container.style.cssText = `
    position: relative; width: 500px; height: 400px;
    background: #1a1a2e; padding: 20px;
    font-family: monospace; color: white;
  `;

  const title = document.createElement("h3");
  title.textContent = "Layer Promotion Demo";
  title.style.color = "#e94560";
  container.appendChild(title);

  // Create boxes WITHOUT promotion
  for (let i = 0; i < 4; i++) {
    const box = document.createElement("div");
    box.textContent = `Box ${i + 1} (no promotion)`;
    box.style.cssText = `
      position: absolute;
      top: ${80 + i * 30}px;
      left: ${20 + i * 30}px;
      width: 200px; height: 60px;
      background: hsl(${i * 60}, 70%, 50%);
      display: flex; align-items: center;
      justify-content: center;
      border: 2px solid white;
      font-size: 12px;
    `;
    container.appendChild(box);
  }

  document.body.appendChild(container);

  // Promote to graphic layers
  function promoteLayers() {
    container.querySelectorAll('div[style*="absolute"]').forEach((box) => {
      box.style.transform = "translateZ(0)";
      box.textContent = box.textContent.replace("no promotion", "GPU layer!");
    });
    console.log("Promoted! Check DevTools > Layers tab!");
  }

  const btn = document.createElement("button");
  btn.textContent = "Promote to GraphicLayers!";
  btn.style.cssText = `
    margin-top: 300px; padding: 10px 20px;
    background: #e94560; color: white; border: none;
    cursor: pointer; font-family: monospace;
  `;
  btn.onclick = promoteLayers;
  container.appendChild(btn);

  console.log("═══ LAYER DEMO ═══");
  console.log("DOM → RenderObject (1:1) → RenderLayer → GraphicLayer");
  console.log("Each GraphicLayer = ~0.5 MB VRAM!");
  console.log("Promote wisely, not everything!");
}
```

---

## Checklist

```
[ ] Old browsers: CPU only. New: CPU + GPU parallel!
[ ] Three trees: RenderObject → RenderLayer → GraphicLayer!
[ ] RenderObject: 1:1 DOM copy, knows how to DRAW!
[ ] RenderLayer: created by position/stacking context!
[ ] GraphicLayer: GPU texture, VRAM cost!
[ ] Root GraphicLayer: ~8.7 MB (constant!)
[ ] Each promoted layer: ~0.5 MB VRAM!
[ ] Don't promote list items: 100 items = 50 MB!
[ ] Always prefer GPU (transform) over CPU (margin)!
[ ] will-change: transform → promotes to GPU layer!
[ ] csstriggers.com → check pipeline for any CSS property!
TIẾP THEO → Phần 7: Browser Rendering!
```
