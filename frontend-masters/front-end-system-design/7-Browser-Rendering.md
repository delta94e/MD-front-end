# Front-End System Design — Phần 7: Browser Rendering — "Become the Browser, Part 2! Build ALL Trees!"

> 📅 2026-03-09 · ⏱ 35 phút đọc
>
> Nguồn: Frontend Masters — Evgenii Ray (Meta, ex-JetBrains)
> Bài: Browser Rendering — "Become browser part 2! Build ALL trees: DOM, RenderObject, RenderLayer, GraphicLayer, Stacking Context, Formatting Context. Flex items create BFC! Absolute creates Stacking Context + RenderLayer! 3D transform promotes to new GraphicLayer!"
> Độ khó: ⭐️⭐️⭐️⭐️⭐️ | Master — tổng hợp ALL concepts!

---

## Mục Lục

| #   | Phần                                                         |
| --- | ------------------------------------------------------------ |
| 1   | The Challenge — "Build ALL 6 Trees!"                         |
| 2   | Step 1: Render `<html>` — "Root Everything!"                 |
| 3   | Step 2: Render `<body>` — "No New Context!"                  |
| 4   | Step 3: Render `<section display:flex>` — "Flex FC + BFC!"   |
| 5   | Step 4: Render Absolute Element — "New Layer + Stacking!"    |
| 6   | Step 5: Render `<div display:inline-block>` — "New BFC!"     |
| 7   | Step 6: Render Absolute + 3D Transform — "New GraphicLayer!" |
| 8   | Final State — All Trees Complete!                            |
| 9   | Summary — "From Box Model to Jedi of Reflow!"                |
| 10  | Tự Code: Tree Builder                                        |

---

## §1. The Challenge — "Build ALL 6 Trees!"

> Evgenii: _"We're going to build formatting context, detect elements outside normal flow, build stacking context, DOM tree, RenderObject tree, RenderLayer tree and GraphicLayer tree. See how everything works together."_

```
6 TREES TO BUILD:
═══════════════════════════════════════════════════════════════

  1. DOM Tree            — HTML structure
  2. RenderObject Tree   — How to draw (1:1 DOM)
  3. RenderLayer Tree    — Stacking/isolation groups
  4. GraphicLayer Tree   — GPU texture groups
  5. Stacking Context    — Z-axis realms
  6. Formatting Context  — Layout rules (BFC/IFC/Flex)
```

### The HTML

```html
<html>
  <body>
    <section style="display: flex">
      <div>Flex Item 1</div>
      <div>Flex Item 2</div>
    </section>
    <div style="position: absolute">
      <span>Inline text</span>
    </div>
    <div style="display: inline-block">Content</div>
    <div style="position: absolute; transform: translate3d(0,0,0)">
      3D Element
    </div>
  </body>
</html>
```

---

## §2. Step 1: Render `<html>` — "Root Everything!"

```
STEP 1 — html:
═══════════════════════════════════════════════════════════════

  DOM Tree:         [html]
  RenderObject:     [RO(html)]
  RenderLayer:      [RL(root)]       ← root always creates!
  GraphicLayer:     [GL(root)]       ← always at least one!
  Stacking Context: [SC(default)]    ← default context!
  Formatting:       [BFC(root)]      ← default BFC!
```

---

## §3. Step 2: Render `<body>` — "No New Context!"

> Evgenii: _"Body doesn't have any special properties. It just enters the formatting context, doesn't create a new one."_

```
STEP 2 — body:
═══════════════════════════════════════════════════════════════

  DOM Tree:         html → body
  RenderObject:     RO(html) → RO(body)
  RenderLayer:      RL(root)          ← body joins root layer!
  GraphicLayer:     GL(root)          ← unchanged!
  Stacking Context: SC(default)       ← body enters default!
  Formatting:       BFC(root)         ← body enters root BFC!

  "Body has no special properties → no new contexts!" — Evgenii
```

---

## §4. Step 3: Render `<section display:flex>` — "Flex FC + BFC!"

> Evgenii: _"display:flex assigned → creating new flex formatting context. Div becomes flex item → instructs browser to initiate block formatting context."_

```
STEP 3 — section + flex items:
═══════════════════════════════════════════════════════════════

  DOM Tree:
  html → body → section
                  ├── div (flex item 1)
                  └── div (flex item 2)

  RenderObject:
  RO(html) → RO(body) → RO(section)
                          ├── RO(div1)
                          └── RO(div2)

  RenderLayer: RL(root)     ← no position = stays in root!
  GraphicLayer: GL(root)    ← unchanged!
  Stacking Context: SC(default) ← no stacking trigger!

  Formatting Context:
  ┌─── BFC(root) ─────────────────────────────┐
  │                                             │
  │  ┌─── Flex FC (section) ──────────────┐    │
  │  │                                     │    │
  │  │  ┌── BFC (div1) ──┐  ┌── BFC ──┐  │    │
  │  │  │ flex item       │  │ div2    │  │    │
  │  │  │ creates BFC!    │  │ creates │  │    │
  │  │  └─────────────────┘  │ BFC!   │  │    │
  │  │                       └─────────┘  │    │
  │  └─────────────────────────────────────┘    │
  └─────────────────────────────────────────────┘

  KEY INSIGHT: div normally DOESN'T create BFC,
  but as flex item → DOES create BFC!
```

---

## §5. Step 4: Render Absolute Element — "New Layer + Stacking!"

> Evgenii: _"Position absolute → update RenderLayer tree (new layer!), move out from default stacking context. New stacking context, new BFC, inline formatting context for span."_

```
STEP 4 — div[position:absolute] + span:
═══════════════════════════════════════════════════════════════

  DOM Tree: + div(abs) → span

  RenderObject: + RO(div-abs) → RO(span)

  RenderLayer:
  RL(root) ← body, section, flex items
  └── RL(div-abs) ← NEW! (position:absolute!)

  GraphicLayer: GL(root)    ← no 3D = stays!

  Stacking Context:
  ┌── SC(default) ──────────────────────────┐
  │  body, section, flex items               │
  └──────────────────────────────────────────┘
  ┌── SC(div-abs) ← NEW! ──────────────────┐
  │  Isolated realm!                         │
  │  Contains: span (inline content)         │
  └──────────────────────────────────────────┘

  Formatting Context (within new SC):
  ┌── BFC(div-abs) ─────────────────────────┐
  │  ┌── IFC(span) → inline text! ──────┐   │
  │  └───────────────────────────────────┘   │
  └──────────────────────────────────────────┘
```

---

## §6. Step 5: Render `<div display:inline-block>` — "New BFC!"

> Evgenii: _"display:inline-block → update root stacking context, create new block formatting context."_

```
STEP 5 — div[display:inline-block]:
═══════════════════════════════════════════════════════════════

  DOM Tree: + div(inline-block)

  RenderObject: + RO(div-ib)

  RenderLayer: unchanged (no position!)
  GraphicLayer: unchanged (no 3D!)

  Stacking Context:
  SC(default) ← div-ib enters root SC!
  SC(div-abs) ← unchanged!

  Formatting Context:
  BFC(root) now contains:
  └── BFC(div-inline-block) ← NEW!
      (inline-block = special case of BFC!)
```

---

## §7. Step 6: Render Absolute + 3D Transform — "New GraphicLayer!"

> Evgenii: _"Position absolute + 3D transformation → new RenderLayer, AND this layer assigned to a DIFFERENT GraphicLayer! Promoted to GPU!"_

```
STEP 6 — div[position:absolute; transform:translate3d]:
═══════════════════════════════════════════════════════════════

  DOM Tree: + div(abs+3d)

  RenderObject: + RO(div-3d)

  RenderLayer:
  RL(root)
  ├── RL(div-abs)
  └── RL(div-3d) ← NEW! (position:absolute!)

  GraphicLayer:
  GL(root) ← contains RL(root), RL(div-abs)
  GL(div-3d) ← NEW! (3D transform = promoted!)
  ↑↑↑ KEY DIFFERENCE from Step 4!
  3D transform promotes to SEPARATE GraphicLayer!

  Stacking Context:
  SC(default) ← ...
  SC(div-abs) ← ...
  SC(div-3d) ← NEW! (absolute + transform!)

  Formatting Context:
  SC(div-3d) contains:
  └── BFC(div-3d) ← NEW!
```

---

## §8. Final State — All Trees Complete!

```
FINAL STATE — ALL 6 TREES:
═══════════════════════════════════════════════════════════════

  ┌─── DOM Tree ────────────────────────────────┐
  │ html → body → section → div1, div2          │
  │              → div(abs) → span              │
  │              → div(inline-block)             │
  │              → div(abs+3d)                   │
  └─────────────────────────────────────────────┘

  ┌─── RenderObject Tree (1:1) ─────────────────┐
  │ Same as DOM, but with draw capabilities!     │
  └─────────────────────────────────────────────┘

  ┌─── RenderLayer Tree ────────────────────────┐
  │ RL(root): html, body, section, divs, div-ib  │
  │ ├── RL(div-abs): absolute div + span         │
  │ └── RL(div-3d): absolute + 3d div            │
  └─────────────────────────────────────────────┘

  ┌─── GraphicLayer Tree ───────────────────────┐
  │ GL(root): RL(root) + RL(div-abs)             │
  │ GL(div-3d): RL(div-3d) ← promoted by 3D!    │
  └──────────────────────────────────────────────┘

  ┌─── Stacking Context ────────────────────────┐
  │ SC(default): body, section, flex items, ib   │
  │ SC(div-abs): div + span (isolated!)          │
  │ SC(div-3d): div with 3D (isolated!)          │
  └──────────────────────────────────────────────┘

  ┌─── Formatting Context ──────────────────────┐
  │ BFC(root)                                    │
  │ ├── Flex FC(section)                         │
  │ │   ├── BFC(div1)  ← flex item creates BFC! │
  │ │   └── BFC(div2)  ← flex item creates BFC! │
  │ ├── BFC(div-inline-block)                    │
  │ SC(div-abs):                                 │
  │ ├── BFC(div-abs)                             │
  │ │   └── IFC(span)                            │
  │ SC(div-3d):                                  │
  │ └── BFC(div-3d)                              │
  └──────────────────────────────────────────────┘
```

---

## §9. Summary — "From Box Model to Jedi of Reflow!"

> Evgenii: _"We started with very simple concepts — box model, margins, paddings. Then we understood painting layers and how they work together. Now we can call ourselves Jedi of reflow!"_

```
LEARNING PATH:
═══════════════════════════════════════════════════════════════

  Part 2: Box Model
  ├── 4 layers: Content → Padding → Border → Margin
  └── content-box vs border-box

  Part 3: Formatting Context
  ├── BFC, IFC, Flex FC, Grid FC
  └── Isolation, scalability, predictability

  Part 4: Positioning
  ├── static, relative, absolute
  ├── Containing block
  └── Stacking context

  Part 5: Reflow
  ├── JS → Style → Layout → Paint → Composite
  ├── CPU bound vs GPU bound
  └── margin-top (CPU!) vs translateY (GPU!)

  Part 6: Composition Layers
  ├── RenderObject → RenderLayer → GraphicLayer
  ├── VRAM cost (~0.5 MB per layer!)
  └── Always prefer GPU over CPU!

  Part 7: Browser Rendering (THIS!)
  ├── Build ALL 6 trees step by step
  └── "Jedi of Reflow!" — Evgenii

  → CORE FUNDAMENTALS COMPLETE! ✅
```

---

## §10. Tự Code: Tree Builder

```javascript
// ═══ BROWSER RENDERING TREE BUILDER ═══
// Simulates building all trees like the browser does!

class BrowserRenderer {
  constructor() {
    this.domTree = [];
    this.renderObjects = [];
    this.renderLayers = [{ name: "root", children: [] }];
    this.graphicLayers = [{ name: "root", memory: 8.7, layers: ["root"] }];
    this.stackingContexts = [{ name: "default", elements: [] }];
    this.formattingContexts = [
      { name: "BFC(root)", type: "BFC", children: [] },
    ];
  }

  addElement(config) {
    const { tag, display, position, transform } = config;

    // 1. DOM Tree — always add
    this.domTree.push(tag);

    // 2. RenderObject — 1:1 with DOM
    this.renderObjects.push(`RO(${tag})`);

    // 3. RenderLayer — position/absolute creates new layer
    if (position === "absolute" || position === "fixed") {
      this.renderLayers.push({ name: `RL(${tag})`, children: [] });
    }

    // 4. GraphicLayer — 3D transform promotes!
    if (transform && transform.includes("3d")) {
      this.graphicLayers.push({
        name: `GL(${tag})`,
        memory: 0.5,
        layers: [`RL(${tag})`],
      });
    }

    // 5. Stacking Context — position/transform creates
    if (position === "absolute" || position === "fixed" || transform) {
      this.stackingContexts.push({ name: `SC(${tag})`, elements: [tag] });
    } else {
      this.stackingContexts[0].elements.push(tag);
    }

    // 6. Formatting Context — display determines type
    if (display === "flex") {
      this.formattingContexts.push({
        name: `FlexFC(${tag})`,
        type: "Flex",
        children: [],
      });
    } else if (display === "inline-block") {
      this.formattingContexts.push({
        name: `BFC(${tag})`,
        type: "BFC-inline-block",
        children: [],
      });
    }

    return this;
  }

  report() {
    console.log("═══ BROWSER RENDERING TREES ═══\n");
    console.log("DOM:", this.domTree.join(" → "));
    console.log("RenderObjects:", this.renderObjects.join(", "));
    console.log(
      "RenderLayers:",
      this.renderLayers.map((l) => l.name).join(", "),
    );
    console.log(
      "GraphicLayers:",
      this.graphicLayers.map((g) => `${g.name}(${g.memory}MB)`).join(", "),
    );
    console.log(
      "StackingContexts:",
      this.stackingContexts
        .map((s) => `${s.name}[${s.elements.join(",")}]`)
        .join(", "),
    );
    console.log(
      "FormattingContexts:",
      this.formattingContexts.map((f) => f.name).join(", "),
    );

    const totalVRAM = this.graphicLayers.reduce((a, g) => a + g.memory, 0);
    console.log(`\nTotal VRAM: ${totalVRAM.toFixed(1)} MB`);
    console.log(`Total RenderLayers: ${this.renderLayers.length}`);
    console.log(`Total GraphicLayers: ${this.graphicLayers.length}`);
  }
}

// Reconstruct the lesson example:
const browser = new BrowserRenderer();
browser
  .addElement({ tag: "html" })
  .addElement({ tag: "body" })
  .addElement({ tag: "section", display: "flex" })
  .addElement({ tag: "div-1" }) // flex item
  .addElement({ tag: "div-2" }) // flex item
  .addElement({ tag: "div-abs", position: "absolute" })
  .addElement({ tag: "span" })
  .addElement({ tag: "div-ib", display: "inline-block" })
  .addElement({
    tag: "div-3d",
    position: "absolute",
    transform: "translate3d(0,0,0)",
  })
  .report();

// Output shows all 6 trees like Evgenii built!
```

---

## Checklist

```
[ ] 6 trees: DOM, RenderObject, RenderLayer, GraphicLayer,
    Stacking Context, Formatting Context!
[ ] html → creates ALL root contexts!
[ ] body → enters parent contexts (no new ones!)
[ ] display:flex → new Flex FC, items create BFC!
[ ] position:absolute → new RenderLayer + Stacking Context!
[ ] display:inline-block → new BFC (special case!)
[ ] position:absolute + 3D transform → new GraphicLayer!
[ ] 3D transform = PROMOTED to separate GPU layer!
[ ] Without 3D = stays in root GraphicLayer!
[ ] "We can call ourselves Jedi of reflow!" — Evgenii
TIẾP THEO → Phần 8: DOM API!
```
