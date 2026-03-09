# Front-End System Design — Phần 4: Browser Positioning — "Normal Flow, Relative, Absolute, Stacking Context!"

> 📅 2026-03-09 · ⏱ 30 phút đọc
>
> Nguồn: Frontend Masters — Evgenii Ray (Meta, ex-JetBrains)
> Bài: Browser Positioning — "Normal flow (static), position:relative (stays in flow but offset), position:absolute (removed from flow!), containing block, stacking context = z-axis layering, isolation for DOM performance!"
> Độ khó: ⭐️⭐️⭐️⭐️ | Core — positioning, stacking context, z-axis, containing block!

---

## Mục Lục

| #   | Phần                                                 |
| --- | ---------------------------------------------------- |
| 1   | Normal Flow — "Default Rendering!"                   |
| 2   | Position: static — "The Default!"                    |
| 3   | Position: relative — "Offset Without Impact!"        |
| 4   | Containing Block — "Reference Point!"                |
| 5   | Position: absolute — "Removed From Flow!"            |
| 6   | Stacking Context — "Z-Axis Layering!"                |
| 7   | Z-Axis — "The Third Dimension!"                      |
| 8   | Why Positioning Matters — "Isolation = Performance!" |
| 9   | Tự Code: Positioning Demo                            |

---

## §1. Normal Flow — "Default Rendering!"

> Evgenii: _"In the web, we have 'normal flow' — elements rendered in natural order. LTR languages: top to bottom, left to right. RTL: right to left."_

```
NORMAL FLOW:
═══════════════════════════════════════════════════════════════

  LTR (English, Vietnamese):
  ┌──── Block 1 ────────────────────────────────┐
  └─────────────────────────────────────────────┘
  ┌──── Block 2 ────────────────────────────────┐
  └─────────────────────────────────────────────┘
  [inline1] [inline2] [inline3] → left to right!

  RTL (Arabic, Hebrew):
  ┌──── Block 1 ────────────────────────────────┐
  └─────────────────────────────────────────────┘
  → [inline3] [inline2] [inline1] ← right to left!
```

---

## §2. Position: static — "The Default!"

> Evgenii: _"Static is applied by default. Everything is rendered from top to bottom, left to right."_

```css
.element {
  position: static; /* DEFAULT — always in normal flow! */
  /* top, right, bottom, left have NO EFFECT! */
}
```

```
STATIC POSITIONING:
═══════════════════════════════════════════════════════════════

  ┌──── Element 1 (static) ─────────────────────┐
  └─────────────────────────────────────────────┘
  ┌──── Element 2 (static) ─────────────────────┐
  └─────────────────────────────────────────────┘
  ┌──── Element 3 (static) ─────────────────────┐
  └─────────────────────────────────────────────┘

  Normal flow, nothing special!
```

---

## §3. Position: relative — "Offset Without Impact!"

> Evgenii: _"The browser renders relative the same as normal flow. But the final position is determined by top/right/bottom/left. The change doesn't impact other elements — because the element is removed from normal flow."_

```
RELATIVE POSITIONING:
═══════════════════════════════════════════════════════════════

  Before (normal position):
  ┌──── Element 1 ──────────────────────────────┐
  └─────────────────────────────────────────────┘
  ┌──── Element 2 (relative) ───────────────────┐
  └─────────────────────────────────────────────┘
  ┌──── Element 3 ──────────────────────────────┐
  └─────────────────────────────────────────────┘

  After (top: 20px; left: 30px):
  ┌──── Element 1 ──────────────────────────────┐
  └─────────────────────────────────────────────┘
  [ghost position still reserved!]
     ┌──── Element 2 (moved!) ──────────────────┐
     └──────────────────────────────────────────┘
  ┌──── Element 3 (NOT affected!) ──────────────┐
  └─────────────────────────────────────────────┘

  KEY: Element 2 moved, but Element 3 stays put!
  Original space is PRESERVED in flow!
```

### Relative Also Creates:

- ✅ **New Stacking Context** (z-axis realm!)
- ✅ **Contains absolutely positioned children** (containing block!)

---

## §4. Containing Block — "Reference Point!"

> Evgenii: _"The containing block is a reference point for the element — how it calculates its position."_

```
CONTAINING BLOCK RULES:
═══════════════════════════════════════════════════════════════

  For <html>:
  → Containing block = browser viewport!

  For position: static/relative elements:
  → Containing block = nearest block-level ancestor!

  For position: absolute elements:
  → Containing block = nearest ancestor with
     position: relative/absolute/fixed!

  Example:
  <body>                          ← closest ancestor
    <div style="position:relative"> ← CONTAINING BLOCK!
      <p style="position:absolute">  ← positioned relative
        I position myself relative    to the div!
        to the div, not body!
      </p>
    </div>
  </body>
```

---

## §5. Position: absolute — "Removed From Flow!"

> Evgenii: _"Position absolute behaves completely different. The element is removed from normal flow. Final position determined by top/right/bottom/left. Uses its containing block to calculate position."_

```
ABSOLUTE POSITIONING:
═══════════════════════════════════════════════════════════════

  ┌──── Normal Flow ─────────────────────────────┐
  │ ┌──── Section ────────────────────────────┐  │
  │ └─────────────────────────────────────────┘  │
  │ ┌──── Div ────────────────────────────────┐  │
  │ └─────────────────────────────────────────┘  │
  └──────────────────────────────────────────────┘

  After position:absolute on Box 1 and Box 2:

  ┌──── Normal Flow ─────────────────────────────┐
  │ ┌──── Section ────────────────────────────┐  │
  │ └─────────────────────────────────────────┘  │
  │ ┌──── Div ────────────────────────────────┐  │
  │ └─────────────────────────────────────────┘  │
  └──────────────────────────────────────────────┘
  ┌══ Stacking Context ══════════════════════════┐
  ║  ┌─── Box 1 (absolute) ──┐                  ║
  ║  └───────────────────────┘                   ║
  ║     ┌─── Box 2 (absolute) ──┐               ║
  ║     └───────────────────────┘ ← on top!      ║
  └══════════════════════════════════════════════┘

  Box 2 renders ON TOP of Box 1!
  → Stacking context = stack order (last = on top!)
  → Unless z-index overrides!
```

### Absolute = Creates New Stacking Context!

```
  position: absolute →
  ├── Removed from normal flow ✅
  ├── Creates new stacking context ✅
  ├── Positioned relative to containing block ✅
  └── Default position: top-left of containing block ✅
```

---

## §6. Stacking Context — "Z-Axis Layering!"

> Evgenii: _"When we apply position relative/absolute, we create a new stacking context — a new realm where elements are completely isolated."_

```
STACKING CONTEXT:
═══════════════════════════════════════════════════════════════

  Default Stacking Context (root):
  ┌────────────────────────────────┐
  │ Normal flow elements           │ z-index: auto
  └────────────────────────────────┘

  Stacking Context 1 (position: absolute):
  ┌════════════════════════════════┐
  ║ Box 1 — isolated realm!        ║ z-index: 1
  └════════════════════════════════┘

  Stacking Context 2 (position: absolute):
  ┌════════════════════════════════┐
  ║ Box 2 — separate realm!        ║ z-index: 2 (on top!)
  └════════════════════════════════┘

  CREATES STACKING CONTEXT:
  • position: relative/absolute/fixed + z-index
  • opacity < 1
  • transform (any value!)
  • filter, backdrop-filter
  • will-change
  • isolation: isolate
```

---

## §7. Z-Axis — "The Third Dimension!"

> Evgenii: _"When we build HTML, we usually utilize x and y-axis. But there's a z-axis used with 3D transformations and absolute positioning."_

```
THREE AXES:
═══════════════════════════════════════════════════════════════

           Y (top ↓ bottom)
           │
           │    ╱ Z (depth — stacking!)
           │   ╱
           │  ╱
           │ ╱
           │╱────────── X (left → right)

  X-axis: left/right positioning
  Y-axis: top/bottom positioning
  Z-axis: DEPTH — which element is "on top"!

  translateZ demo:
  ┌─── Box 1 ───┐
  │              │  ←── translateZ(0)
  │  ┌─── Box 2 ─┤
  │  │           ││  ←── translateZ(50px) closer!
  │  │  ┌── Box 3│┤
  │  │  │        │││  ←── translateZ(100px) closest!
  │  │  │        │││
  └──┘  └────────┘┘

  "They kinda stack on each other." — Evgenii
```

---

## §8. Why Positioning Matters — "Isolation = Performance!"

> Evgenii: _"The benefit lies in ability to remove items from normal flow. We can achieve isolation — every modification is completely isolated. We can minimize potential reflow."_

```
WHY THIS MATTERS FOR PERFORMANCE:
═══════════════════════════════════════════════════════════════

  In normal flow:
  Change Element 2 size → browser must recalculate
  positions of Element 3, 4, 5... → REFLOW! 💀

  With absolute positioning:
  Change Element 2 size → ONLY Element 2 changes!
  Elements 3, 4, 5 are UNAFFECTED! → No reflow! ✅

  USE CASES:
  • Tooltips, modals, dropdowns → position: absolute!
  • Animations → transform (GPU!) instead of top/left!
  • Overlays → position: fixed!
  • Complex widgets → isolate from main layout!
```

---

## §9. Tự Code: Positioning Demo

```javascript
// ═══ POSITIONING & STACKING CONTEXT DEMO ═══

function createPositioningDemo() {
  const container = document.createElement("div");
  container.style.cssText = `
    position: relative; width: 400px; height: 300px;
    border: 2px solid #333; margin: 20px; font-family: monospace;
  `;

  // Static element
  const static1 = document.createElement("div");
  static1.textContent = "Static (normal flow)";
  static1.style.cssText = `
    background: #3498db; color: white; padding: 10px;
    margin: 10px;
  `;

  // Relative element
  const relative = document.createElement("div");
  relative.textContent = "Relative (top:20px, left:30px)";
  relative.style.cssText = `
    position: relative; top: 20px; left: 30px;
    background: #2ecc71; color: white; padding: 10px;
    margin: 10px;
  `;

  // Absolute element
  const absolute = document.createElement("div");
  absolute.textContent = "Absolute (top:50px, right:10px)";
  absolute.style.cssText = `
    position: absolute; top: 50px; right: 10px;
    background: #e74c3c; color: white; padding: 10px;
    z-index: 10;
  `;

  container.append(static1, relative, absolute);
  document.body.appendChild(container);

  console.log("═══ POSITIONING DEMO ═══");
  console.log("Blue: static (normal flow)");
  console.log("Green: relative (offset, space preserved!)");
  console.log("Red: absolute (removed from flow, z-axis!)");
}

console.log("static: default, normal flow");
console.log("relative: offset but space preserved, creates stacking context");
console.log("absolute: removed from flow, uses containing block");
console.log("Stacking context = isolation = better performance!");
```

---

## Checklist

```
[ ] Normal flow = elements in natural order!
[ ] static = default, no offset, no stacking context!
[ ] relative = offset WITHOUT impacting siblings, space preserved!
[ ] relative creates: containing block + stacking context!
[ ] Containing block = reference point for position calc!
[ ] absolute = removed from flow, uses containing block!
[ ] absolute creates: stacking context!
[ ] last absolute element = on top (stack order!)
[ ] z-index overrides stack order!
[ ] Isolation from normal flow = minimize reflow!
[ ] Z-axis = the third dimension (depth/stacking!)
TIẾP THEO → Phần 5: Reflow!
```
