# Front-End System Design — Phần 2: Box Model — "Every HTML Element Is a Box! 4 Layers, 2 Properties!"

> 📅 2026-03-09 · ⏱ 40 phút đọc
>
> Nguồn: Frontend Masters — Evgenii Ray (Meta, ex-JetBrains)
> Bài: Box Model — "Content box → Padding box → Border box → Margin box. Box Size (intrinsic vs restricted). Box Type (block vs inline vs none). box-sizing: content-box vs border-box!"
> Độ khó: ⭐️⭐️⭐️ | Core Fundamental — nền tảng cho mọi CSS layout!

---

## Mục Lục

| #   | Phần                                              |
| --- | ------------------------------------------------- |
| 1   | Every Element Is a Box — "Prove It!"              |
| 2   | Box Anatomy — 4 Layers!                           |
| 3   | Composable Layers — "Mix & Match!"                |
| 4   | Box Properties — "Size + Type!"                   |
| 5   | Box Size: Intrinsic vs Restricted                 |
| 6   | Block Level Boxes — Deep Dive                     |
| 7   | Anonymous Boxes — "Browser Auto-Wraps!"           |
| 8   | Block Box Mathematics — content-box vs border-box |
| 9   | Inline Elements — Deep Dive                       |
| 10  | Inline Height & Non-Content Height                |
| 11  | Deep Dive: border-box Pattern                     |
| 12  | Tự Code: Box Model Visualizer                     |

---

## §1. Every Element Is a Box — "Prove It!"

> Evgenii: _"Every HTML element on the page is actually a box. We can prove this by selecting all elements and applying a green border."_

Mọi thứ bạn thấy trên web — heading, paragraph, image, button — đều là **boxes** (hình chữ nhật). Đây là concept cơ bản nhất nhưng cũng quan trọng nhất trong CSS.

```javascript
// Chạy trong DevTools Console:
document.querySelectorAll("*").forEach((el) => {
  el.style.border = "1px solid green";
});
// → Toàn bộ trang web biến thành hình chữ nhật xanh!
```

```
WEBSITE WITH GREEN BORDERS:
═══════════════════════════════════════════════════════════════

  ┌──────────────────────────────────────────────┐ ← <html>
  │ ┌──────────────────────────────────────────┐ │ ← <body>
  │ │ ┌──────────────────────────────────────┐ │ │ ← <header>
  │ │ │ ┌──────┐  ┌───────────────────────┐  │ │ │
  │ │ │ │ Logo │  │     Navigation        │  │ │ │
  │ │ │ └──────┘  └───────────────────────┘  │ │ │
  │ │ └──────────────────────────────────────┘ │ │
  │ │ ┌──────────────────────────────────────┐ │ │ ← <main>
  │ │ │ ┌──────┐ ┌──────┐ ┌──────┐          │ │ │
  │ │ │ │ Card │ │ Card │ │ Card │          │ │ │
  │ │ │ └──────┘ └──────┘ └──────┘          │ │ │
  │ │ └──────────────────────────────────────┘ │ │
  │ └──────────────────────────────────────────┘ │
  └──────────────────────────────────────────────┘

  "Most websites is just a set of rectangles." — Evgenii
```

---

## §2. Box Anatomy — 4 Layers!

> Evgenii: _"The box has four layers!"_

```
BOX ANATOMY — 4 LAYERS (Inside → Outside):
═══════════════════════════════════════════════════════════════

  ┌──────────────────────────────────────────────┐
  │              MARGIN BOX                       │ Layer 4: external space
  │  ┌════════════════════════════════════════┐  │
  │  ║           BORDER BOX                   ║  │ Layer 3: visible edge
  │  ║  ┌──────────────────────────────────┐  ║  │
  │  ║  │        PADDING BOX               │  ║  │ Layer 2: inner space
  │  ║  │  ┌────────────────────────────┐  │  ║  │
  │  ║  │  │      CONTENT BOX           │  │  ║  │ Layer 1: text/images
  │  ║  │  │    "Hello, World!"         │  │  ║  │
  │  ║  │  └────────────────────────────┘  │  ║  │
  │  ║  └──────────────────────────────────┘  ║  │
  │  └════════════════════════════════════════┘  │
  └──────────────────────────────────────────────┘
```

| Layer | Name            | Description                                              |
| ----- | --------------- | -------------------------------------------------------- |
| 1     | **Content Box** | Nơi chứa text, images, child elements                    |
| 2     | **Padding Box** | Khoảng trống BÊN TRONG border, background extends here   |
| 3     | **Border Box**  | Đường viền nhìn thấy được, takes up real space           |
| 4     | **Margin Box**  | Khoảng trống BÊN NGOÀI, always transparent, CAN collapse |

### Key Differences: Padding vs Margin

```
PADDING vs MARGIN:
═══════════════════════════════════════════════════

  Padding:                     Margin:
  ✅ INSIDE border             ✅ OUTSIDE border
  ✅ Has background color      ❌ Always transparent
  ✅ Part of clickable area    ❌ NOT clickable
  ❌ Cannot be negative        ✅ CAN be negative
  ❌ No collapsing             ⚠️ Vertical can collapse!
```

---

## §3. Composable Layers — "Mix & Match!"

> Evgenii: _"We can compose different layers together. Some of them are optional."_

```
VARIATIONS:
═══════════════════════════════════════════════════════════════

  Content only:         Content + Padding:       All 4 layers:
  ┌──────────┐          ┌──────────────┐         ┌────────────────┐
  │ Content  │          │ ┌──────────┐ │         │ ┌════════════┐ │
  └──────────┘          │ │ Content  │ │         │ ║ ┌────────┐ ║ │
                        │ └──────────┘ │         │ ║ │Content │ ║ │
                        └──────────────┘         │ ║ └────────┘ ║ │
                                                 │ └════════════┘ │
                                                 └────────────────┘
```

---

## §4. Box Properties — "Size + Type!"

> Evgenii: _"The box has two main properties: box size and box type."_

```
TWO MAIN PROPERTIES:
═══════════════════════════════════════════

  BOX SIZE:              BOX TYPE:
  • Intrinsic            • Block Level
  • Restricted           • Inline Level
                         • None (no box!)
```

---

## §5. Box Size: Intrinsic vs Restricted

> Evgenii: _"Intrinsic = size determined by content. Restricted = fixed size via CSS or limited by parent."_

```
INTRINSIC SIZE (no CSS rules):
═══════════════════════════════════════════════════════════════

  <div>Hello</div>    → Width: 100% of parent (block default!)
                        Height: fits "Hello" text!

  <span>Hi</span>     → Width: fits "Hi" text!
                        Height: line-height!

RESTRICTED SIZE (CSS applied):
═══════════════════════════════════════════════════════════════

  .box { width: 300px; height: 200px; }    → Fixed!
  .child { width: 100%; }                  → Limited by parent!
  .flex { min-width: 200px; max-width: 600px; } → Constrained!
```

---

## §6. Block Level Boxes — Deep Dive

> Evgenii: _"Two main characteristics: always takes 100% width of parent, height determined by content. Rendered top to bottom. Participates in Block Formatting Context."_

```
BLOCK LEVEL:
═══════════════════════════════════════════════════════════════

  1. Width = 100% of parent (always full width!)
  ┌──── Parent (800px) ──────────────────────┐
  │ ┌──── Block Child ──────────────────────┐ │
  │ │ Takes full 800px automatically!        │ │
  │ └───────────────────────────────────────┘ │
  └───────────────────────────────────────────┘

  2. Height = fits content (intrinsic!)

  3. Stacks top to bottom!
  ┌──── Block 1 ────────────────────────────┐
  └─────────────────────────────────────────┘
  ┌──── Block 2 ────────────────────────────┐
  └─────────────────────────────────────────┘

  4. Participates in BFC (Block Formatting Context)!

  Elements: <div> <p> <h1-h6> <section> <article>
            <ul> <ol> <li> <form> <header> <footer>
```

---

## §7. Anonymous Boxes — "Browser Auto-Wraps!"

> Evgenii: _"The browser needs to represent elements not wrapped in tags. It automatically drops them into anonymous boxes."_

```
ANONYMOUS BOXES:
═══════════════════════════════════════════════════════════════

  HTML:
  <div>
    Some naked text        ← No tag around this!
    <p>Paragraph</p>
  </div>

  Browser internally creates:
  <div>
    [Anonymous Block Box: "Some naked text"]  ← Auto-created!
    <p>Paragraph</p>
  </div>

  → Browser needs EVERY content in a box!
```

---

## §8. Block Box Mathematics — content-box vs border-box

> Evgenii: _"content-box: sum all layers. border-box: padding and border already included."_

### content-box (DEFAULT)

```
.box { width: 200px; padding: 20px; border: 5px solid; margin: 10px; }

CALCULATION:
═══════════════════════════════════════════════════════════════

  ← 10 →← 5 →← 20 →←── 200 ──→← 20 →← 5 →← 10 →
  margin border padding CONTENT  padding border margin

  Content area: 200px
  Visible box:  200 + 40 + 10 = 250px
  Total space:  250 + 20 = 270px
```

### border-box (RECOMMENDED!)

```
.box { box-sizing: border-box; width: 200px; padding: 20px;
       border: 5px solid; margin: 10px; }

CALCULATION:
═══════════════════════════════════════════════════════════════

  ← 10 →←──────── 200 ────────→← 10 →
  margin  border+padding+CONTENT  margin

  Content area: 200 - 40 - 10 = 150px (auto!)
  Visible box:  200px (what you set!)
  Total space:  200 + 20 = 220px

  "This simplifies calculations — very common pattern
   in complex apps." — Evgenii
```

### Universal border-box Pattern

```css
*,
*::before,
*::after {
  box-sizing: border-box;
}
/* Every framework uses this! */
```

|                | content-box      | border-box                 |
| -------------- | ---------------- | -------------------------- |
| `width` means  | Content only     | Content + Padding + Border |
| Adding padding | Increases total! | Reduces content area!      |
| Recommended    | ❌ Legacy        | ✅ Modern standard         |

---

## §9. Inline Elements — Deep Dive

> Evgenii: _"Inline elements are completely different. They render as a string — left to right, top to bottom. They participate in Inline Formatting Context."_

```
INLINE BEHAVIOR:
═══════════════════════════════════════════════════════════════

  Flow: [span1] [a] [strong] [em] [span2]
        wraps to new line when full!

  Elements: <span> <a> <strong> <em> <b> <i>
            <code> <img> <input> <button>

  ❌ IGNORES:
  width: 500px;          ← IGNORED!
  height: 300px;         ← IGNORED!
  margin-top: 20px;      ← IGNORED!
  margin-bottom: 20px;   ← IGNORED!

  ✅ WORKS:
  margin-left/right      ← Horizontal margins work!
  padding                ← Visible but special behavior!
  border                 ← Visible but special behavior!
```

---

## §10. Inline Height & Non-Content Height

> Evgenii: _"Height of inline element = intrinsic height or line-height. Everything beyond the line height is non-content height — ignored by browser for calculations."_

```
INLINE HEIGHT:
═══════════════════════════════════════════════════════════════

  font-size: 16px; line-height: 24px;

  ┌──────────────────────────────────┐
  │         ↕ 4px (half-leading)      │
  │  ─── Hello World ───              │ ← 16px font
  │         ↕ 4px (half-leading)      │
  └──────────────────────────────────┘
  ↕ Total: 24px (line-height!)

  Half-leading = (line-height - font-size) / 2 = 4px

NON-CONTENT HEIGHT:
═══════════════════════════════════════════════════════════════

  <span style="padding: 20px; line-height: 24px;">Hello</span>

  Padding is PAINTED (visible!) but:
  → Does NOT push surrounding lines apart!
  → Does NOT affect layout calculations!
  → Browser only considers line-height (24px)!

  "Everything beyond the line will not participate
   in any calculations." — Evgenii
```

---

## §11. Deep Dive: border-box Pattern

```
WHY border-box IS STANDARD:
═══════════════════════════════════════════════════════════════

  content-box + percentages = BROKEN!
  .sidebar { width: 30%; padding: 20px; }  → > 30%!
  .main    { width: 70%; padding: 20px; }  → > 70%!
  → 30% + 70% + paddings > 100% → OVERFLOW! 💀

  border-box + percentages = WORKS!
  .sidebar { width: 30%; padding: 20px; }  → exactly 30%!
  .main    { width: 70%; padding: 20px; }  → exactly 70%!
  → 30% + 70% = 100% → PERFECT! ✅
```

---

## §12. Tự Code: Box Model Visualizer

```javascript
// ═══ BOX MODEL CALCULATOR ═══

function calculateBoxModel(options) {
  const { width, height, padding, border, margin, boxSizing } = options;

  if (boxSizing === "content-box") {
    const contentW = width;
    const contentH = height;
    const visibleW = contentW + padding * 2 + border * 2;
    const visibleH = contentH + padding * 2 + border * 2;
    const totalW = visibleW + margin * 2;
    const totalH = visibleH + margin * 2;
    return { contentW, contentH, visibleW, visibleH, totalW, totalH };
  }

  // border-box
  const contentW = width - padding * 2 - border * 2;
  const contentH = height - padding * 2 - border * 2;
  const visibleW = width;
  const visibleH = height;
  const totalW = width + margin * 2;
  const totalH = height + margin * 2;
  return { contentW, contentH, visibleW, visibleH, totalW, totalH };
}

// Demo
const contentBox = calculateBoxModel({
  width: 200,
  height: 100,
  padding: 20,
  border: 5,
  margin: 10,
  boxSizing: "content-box",
});
const borderBox = calculateBoxModel({
  width: 200,
  height: 100,
  padding: 20,
  border: 5,
  margin: 10,
  boxSizing: "border-box",
});

console.log("═══ content-box ═══");
console.log(`Content: ${contentBox.contentW}×${contentBox.contentH}`);
console.log(`Visible: ${contentBox.visibleW}×${contentBox.visibleH}`);
console.log(`Total:   ${contentBox.totalW}×${contentBox.totalH}`);

console.log("\n═══ border-box ═══");
console.log(`Content: ${borderBox.contentW}×${borderBox.contentH}`);
console.log(`Visible: ${borderBox.visibleW}×${borderBox.visibleH}`);
console.log(`Total:   ${borderBox.totalW}×${borderBox.totalH}`);
```

---

## Checklist

```
[ ] Every HTML element = a box!
[ ] 4 layers: Content → Padding → Border → Margin!
[ ] Intrinsic size = determined by content!
[ ] Restricted size = fixed CSS or parent limit!
[ ] Block: 100% width, top-to-bottom, BFC!
[ ] Inline: left-to-right, IGNORES width/height/vertical margins!
[ ] Anonymous boxes = browser wraps naked text!
[ ] content-box: width = content only (add layers!)
[ ] border-box: width = content + padding + border (simpler!)
[ ] Inline height = line-height (non-content height ignored!)
[ ] "Use border-box everywhere" — Evgenii
TIẾP THEO → Phần 3: Browser Formatting Context!
```
