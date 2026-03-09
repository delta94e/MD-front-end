# Front-End System Design — Phần 3: Browser Formatting Context — "Realm of Rules, Isolation, Scalability!"

> 📅 2026-03-09 · ⏱ 30 phút đọc
>
> Nguồn: Frontend Masters — Evgenii Ray (Meta, ex-JetBrains)
> Bài: Browser Formatting Context — "Realm of rules, BFC vs IFC, isolation, CSS creates context not HTML tags, display:flex/grid = new context, inline-block = special BFC!"
> Độ khó: ⭐️⭐️⭐️⭐️ | Core — hiểu cách browser quyết định layout rules cho mỗi element!

---

## Mục Lục

| #   | Phần                                                    |
| --- | ------------------------------------------------------- |
| 1   | What Is a Formatting Context? — "Realm of Rules!"       |
| 2   | Key Idea: Isolation — "Inner ≠ Outer!"                  |
| 3   | Block Formatting Context (BFC) — "Top to Bottom!"       |
| 4   | Inline Formatting Context (IFC) — "Left to Right!"      |
| 5   | Nested Contexts — "Context Within Context!"             |
| 6   | Key Properties — Isolation, Scalability, Predictability |
| 7   | Become the Browser — "Render HTML Line by Line!"        |
| 8   | CSS Creates Context, Not HTML Tags!                     |
| 9   | Deep Dive: Flex & Grid Formatting Context               |
| 10  | Tự Code: Formatting Context Detector                    |

---

## §1. What Is a Formatting Context? — "Realm of Rules!"

> Evgenii: _"You have elements and some kind of realm. When the element falls into this realm, the rules are applied."_

Formatting Context là một **"vùng quy tắc"** (realm) mà browser tạo ra. Khi element rơi vào vùng này, một bộ rules cụ thể sẽ được áp dụng lên nó — quyết định element đó render theo hướng nào, chiếm bao nhiêu space, tương tác với siblings ra sao.

```
FORMATTING CONTEXT = REALM OF RULES:
═══════════════════════════════════════════════════════════════

  ┌─── Realm (Formatting Context) ──────────────┐
  │                                               │
  │   RULES:                                      │
  │   • Element takes 100% parent width           │
  │   • Rendered top to bottom                     │
  │   • Vertical margins collapse                  │
  │                                               │
  │   ┌─────────────────────────────────────────┐ │
  │   │ Element 1 (follows realm rules!)         │ │
  │   └─────────────────────────────────────────┘ │
  │   ┌─────────────────────────────────────────┐ │
  │   │ Element 2 (follows realm rules!)         │ │
  │   └─────────────────────────────────────────┘ │
  │                                               │
  └───────────────────────────────────────────────┘

  → This is basically Block Formatting Context (BFC)!
```

---

## §2. Key Idea: Isolation — "Inner ≠ Outer!"

> Evgenii: _"The inner formatting context is completely isolated from the outer. Once element enters the realm, it cannot be impacted by any rules of the outer context."_

```
NESTED CONTEXTS — ISOLATION:
═══════════════════════════════════════════════════════════════

  ┌─── Outer Context (BFC) ─────────────────────┐
  │                                               │
  │   Rules: top-to-bottom, 100% width            │
  │                                               │
  │   ┌─── Inner Context (BFC) ──────────────┐   │
  │   │                                       │   │
  │   │   ISOLATED! Same rules, but:          │   │
  │   │   Element 2 takes 100% of INNER       │   │
  │   │   container, NOT outer!               │   │
  │   │                                       │   │
  │   │   ┌─────────────────────────────┐     │   │
  │   │   │ Element 2                   │     │   │
  │   │   └─────────────────────────────┘     │   │
  │   │                                       │   │
  │   └───────────────────────────────────────┘   │
  │                                               │
  └───────────────────────────────────────────────┘

  Inner context = completely shielded from outer!
```

---

## §3. Block Formatting Context (BFC) — "Top to Bottom!"

```
BFC RULES:
═══════════════════════════════════════════════════════════════

  • Elements take 100% parent width
  • Rendered top to bottom
  • Vertical margins collapse between siblings
  • Contains floats (clearfix!)
  • Prevents margin collapse with children

  TRIGGERS BFC:
  • Root element (<html>)
  • float: left/right
  • position: absolute/fixed
  • display: inline-block
  • overflow: hidden/auto/scroll (not visible!)
  • display: flow-root (explicit BFC!)
  • Flex/Grid items (each creates BFC!)
```

---

## §4. Inline Formatting Context (IFC) — "Left to Right!"

> Evgenii: _"We can create a new inline formatting context. Element should be rendered left to right and take the width of the content."_

```
IFC RULES:
═══════════════════════════════════════════════════════════════

  • Elements flow left to right
  • Take content width only (not 100%!)
  • Wrap to next line when container full
  • Elements sit side by side

  ┌─── Inline Formatting Context ───────────────┐
  │                                               │
  │  [Element 3] [Element 4] [Element 5]          │
  │  ← left to right, content-width only! →       │
  │                                               │
  │  "Since Element 3 doesn't span full width,    │
  │   Element 4 appears next to it in a row."     │
  │                                               │
  └───────────────────────────────────────────────┘
```

---

## §5. Nested Contexts — "Context Within Context!"

```
MIXED CONTEXTS:
═══════════════════════════════════════════════════════════════

  ┌─── BFC (Root) ──────────────────────────────┐
  │                                               │
  │  ┌─ Block Element ──────────────────────┐    │
  │  └──────────────────────────────────────┘    │
  │                                               │
  │  ┌─── IFC (Inline Context) ─────────────┐   │
  │  │  [span] [a] [strong]                  │   │
  │  └──────────────────────────────────────-┘   │
  │                                               │
  │  ┌─── Flex FC ──────────────────────────┐    │
  │  │  [flex-item] [flex-item] [flex-item]  │   │
  │  │  ← Each item creates its own BFC! →   │   │
  │  └──────────────────────────────────────-┘   │
  │                                               │
  └───────────────────────────────────────────────┘
```

---

## §6. Key Properties — Isolation, Scalability, Predictability

> Evgenii: _"Three key ideas: isolation, scalability, predictability."_

| Property           | Meaning                                                          |
| ------------------ | ---------------------------------------------------------------- |
| **Isolation**      | Elements within context are shielded from outer rules            |
| **Scalability**    | CSS spec devs create new context for new rule sets (flex, grid!) |
| **Predictability** | Strict rules → always know element position/placement            |

---

## §7. Become the Browser — "Render HTML Line by Line!"

> Evgenii: _"Let's become the browser and render HTML line by line, creating formatting contexts like the browser does."_

```html
<html>
  <!-- Creates BFC (root!) -->
  <body>
    <!-- Enters root BFC (no new context) -->
    <h1>Title</h1>
    <!-- Enters root BFC -->
    <ol>
      <!-- Enters root BFC -->
      <li style="display: inline-block">A</li>
      <!-- NEW BFC! -->
      <li style="display: inline-block">B</li>
      <!-- NEW BFC! -->
    </ol>
    <section style="display: flex">
      <!-- NEW Flex FC! -->
      <div>Item 1</div>
      <!-- Flex item → BFC! -->
      <div>Item 2</div>
      <!-- Flex item → BFC! -->
      <span>
        <!-- NEW IFC! -->
        <em>inline content</em>
      </span>
    </section>
  </body>
</html>
```

```
CONTEXT TREE:
═══════════════════════════════════════════════════════════════

  BFC (root — html)
  ├── body (enters root BFC)
  ├── h1 (enters root BFC)
  ├── ol (enters root BFC)
  │   ├── li → NEW BFC (inline-block!)
  │   └── li → NEW BFC (inline-block!)
  └── section → NEW Flex FC (display: flex!)
      ├── div → BFC (flex item creates BFC!)
      ├── div → BFC (flex item creates BFC!)
      └── span → NEW IFC (inline content!)
```

---

## §8. CSS Creates Context, Not HTML Tags!

> Student: _"Is the context set by HTML tags or CSS?"_
> Evgenii: _"It's more about the CSS. The tags just give you the defaults."_

```
CSS vs HTML:
═══════════════════════════════════════════════════════════════

  <html> → BFC by default (root element!)
  BUT: html { display: flex; } → Changes to Flex FC!

  <div> → Enters parent's BFC (no new context by default!)
  BUT: div { display: flex; } → Creates Flex FC!

  <span> → Creates IFC by default
  BUT: span { display: block; } → Enters BFC instead!

  "Tags give defaults. CSS overrides everything." — Evgenii
```

---

## §9. Deep Dive: Flex & Grid Formatting Context

```
FLEX FORMATTING CONTEXT:
═══════════════════════════════════════════════════════════════

  .container { display: flex; }

  ┌─── Flex FC ──────────────────────────────┐
  │                                           │
  │  [Item 1]  [Item 2]  [Item 3]            │
  │  ← main axis (flex-direction: row) →      │
  │                                           │
  │  Each flex item creates its OWN BFC!      │
  │  → Child elements of flex items           │
  │    follow BFC rules (top-to-bottom!)      │
  │                                           │
  └───────────────────────────────────────────┘

GRID FORMATTING CONTEXT:
═══════════════════════════════════════════════════════════════

  .container { display: grid; grid-template-columns: 1fr 1fr; }

  ┌─── Grid FC ──────────────────────────────┐
  │  ┌──────────┐  ┌──────────┐              │
  │  │ Cell 1   │  │ Cell 2   │              │
  │  │ (BFC!)   │  │ (BFC!)   │              │
  │  └──────────┘  └──────────┘              │
  │  ┌──────────┐  ┌──────────┐              │
  │  │ Cell 3   │  │ Cell 4   │              │
  │  │ (BFC!)   │  │ (BFC!)   │              │
  │  └──────────┘  └──────────┘              │
  └──────────────────────────────────────────┘
```

---

## §10. Tự Code: Formatting Context Detector

```javascript
// ═══ FORMATTING CONTEXT DETECTOR ═══

function detectFormattingContext(element) {
  const style = getComputedStyle(element);
  const display = style.display;
  const position = style.position;
  const float = style.float;
  const overflow = style.overflow;

  const contexts = [];

  // Root element always creates BFC
  if (element === document.documentElement) {
    contexts.push("Root BFC");
  }

  // Flex creates Flex FC
  if (display === "flex" || display === "inline-flex") {
    contexts.push("Flex Formatting Context");
  }

  // Grid creates Grid FC
  if (display === "grid" || display === "inline-grid") {
    contexts.push("Grid Formatting Context");
  }

  // These create BFC
  if (display === "inline-block") contexts.push("BFC (inline-block)");
  if (display === "flow-root") contexts.push("BFC (flow-root)");
  if (position === "absolute" || position === "fixed") {
    contexts.push("BFC (position: " + position + ")");
  }
  if (float !== "none") contexts.push("BFC (float)");
  if (overflow !== "visible" && overflow !== "") {
    contexts.push("BFC (overflow: " + overflow + ")");
  }

  // Inline elements create IFC for their content
  if (display === "inline") {
    contexts.push("Creates IFC for content");
  }

  return contexts.length ? contexts : ["Enters parent context"];
}

// Demo
console.log("═══ FORMATTING CONTEXT DETECTOR ═══\n");
console.log("Root:", detectFormattingContext(document.documentElement));
console.log("\nKey Insight:");
console.log("CSS creates context, not HTML tags!");
console.log("Tags just provide defaults!");
```

---

## Checklist

```
[ ] Formatting Context = "realm of rules"!
[ ] BFC: top-to-bottom, 100% width, margin collapse!
[ ] IFC: left-to-right, content width, inline flow!
[ ] Flex FC: flex items, each item creates own BFC!
[ ] Grid FC: grid cells, each cell creates own BFC!
[ ] Isolation: inner context shielded from outer!
[ ] CSS creates context, NOT HTML tags!
[ ] inline-block = special case of BFC!
[ ] Scalability: new rule sets → new context types!
[ ] Predictability: strict rules → known positions!
TIẾP THEO → Phần 4: Browser Positioning!
```
