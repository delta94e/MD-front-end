# Front-End System Design — Phần 14: MutationObserver Exercise — "Markdown Editor with contenteditable!"

> 📅 2026-03-09 · ⏱ 25 phút đọc
>
> Nguồn: Frontend Masters — Evgenii Ray (Meta, ex-JetBrains)
> Bài: MutationObserver Exercise — "Build simple markdown editor. contenteditable=true → user types h1/h2/h3 → MutationObserver detects characterData → replaceWith heading element. Use single observer for all cards. Notion-like editing!"
> Độ khó: ⭐️⭐️⭐️ | Practical — live coding exercise!

---

## Mục Lục

| #   | Phần                                       |
| --- | ------------------------------------------ |
| 1   | The Goal — "Markdown Editor!"              |
| 2   | contenteditable — "Notion-like Editing!"   |
| 3   | Setup — "Supported Elements + getHeading!" |
| 4   | Step 1: Create MutationObserver            |
| 5   | Step 2: Filter for characterData           |
| 6   | Step 3: Check Text Matches Tag             |
| 7   | Step 4: Replace with Heading Element       |
| 8   | Step 5: Observe Each Card                  |
| 9   | Complete Solution                          |
| 10  | Tự Code: Enhanced Markdown Editor          |

---

## §1. The Goal — "Markdown Editor!"

> Evgenii: _"Imagine a markdown editor where you can replace content with elements. Type h1 → it becomes a heading. Notion-like editing using contenteditable."_

```
EXERCISE GOAL:
═══════════════════════════════════════════════════════════════

  Before typing:
  ┌──── Card ────────────────────────────────┐
  │ Title: Card 1                             │
  │ Body: [editable text here_]               │
  └───────────────────────────────────────────┘

  User types "h3":
  ┌──── Card ────────────────────────────────┐
  │ Title: Card 1                             │
  │ Body: <h3>New Heading!</h3>  ← REPLACED! │
  └───────────────────────────────────────────┘

  → contenteditable lets user type directly!
  → MutationObserver detects "h1"/"h2"/"h3"!
  → Replace text node with actual heading element!
```

---

## §2. contenteditable — "Notion-like Editing!"

> Evgenii: _"Done through the contenteditable=true attribute. Notion heavily relies on such type of editing."_

```html
<!-- Make any element editable! -->
<section contenteditable="true">
  <p>Users can type directly here!</p>
</section>
```

```
contenteditable:
═══════════════════════════════════════════════════════════════

  ✅ Any HTML element becomes editable!
  ✅ User can type, delete, format text!
  ✅ Changes are DOM mutations!
  ✅ MutationObserver can track every keystroke!

  Apps that use this:
  • Notion (blocks + contenteditable!)
  • Google Docs
  • Medium editor
  • Quill.js, ProseMirror, TipTap
```

---

## §3. Setup — "Supported Elements + getHeading!"

```javascript
// Supported heading tags
const supportedElements = new Set(["h1", "h2", "h3"]);

// Helper: create heading element from text node
function getHeading(textNode) {
  const tag = textNode.textContent.trim().toLowerCase();
  if (!supportedElements.has(tag)) return null;

  const heading = document.createElement(tag);
  heading.textContent = tag.toUpperCase() + " Heading";
  heading.contentEditable = "true"; // Keep it editable!
  return heading;
}
```

---

## §4. Step 1: Create MutationObserver

> Evgenii: _"MutationObserver accepts mutation entries. Loop through entries."_

```javascript
const observer = new MutationObserver((entries) => {
  for (const mutation of entries) {
    // Step 2: filter + detect...
  }
});
```

---

## §5. Step 2: Filter for characterData

> Evgenii: _"We are looking for the characterData type of mutation. Access the target element."_

```javascript
const observer = new MutationObserver((entries) => {
  for (const mutation of entries) {
    const target = mutation.target;

    // Only react to text typing!
    if (mutation.type !== "characterData") continue;

    // Step 3: check if text matches tag...
  }
});
```

---

## §6. Step 3: Check Text Matches Tag

> Evgenii: _"Check that target.textContent matches any element in supportedElements collection using has()."_

```javascript
if (mutation.type === "characterData") {
  const text = target.textContent.trim().toLowerCase();

  // Does typed text match "h1", "h2", or "h3"?
  if (supportedElements.has(text)) {
    // Step 4: replace with heading!
  }
}
```

```
DETECTION FLOW:
═══════════════════════════════════════════════════════════════

  User types: "h"    → supportedElements.has("h")  → false
  User types: "h3"   → supportedElements.has("h3") → TRUE! ✅
  User types: "h3x"  → supportedElements.has("h3x")→ false
  User types: "hello"→ supportedElements.has("hello")→ false

  Only exact "h1", "h2", "h3" trigger replacement!
```

---

## §7. Step 4: Replace with Heading Element

> Evgenii: _"Create new heading using getHeading method. Replace target element using replaceWith. Focus on newly created element."_

```javascript
if (supportedElements.has(text)) {
  // Create heading element
  const heading = getHeading(target);

  // Replace text node with heading!
  target.replaceWith(heading);

  // Focus on newly created heading
  heading.focus();
}
```

```
REPLACE FLOW:
═══════════════════════════════════════════════════════════════

  Before:
  <p contenteditable="true">
    "h3"  ← TextNode (user typed this!)
  </p>

  After replaceWith:
  <p contenteditable="true">
    <h3 contenteditable="true">H3 Heading</h3>  ← DOM element!
  </p>

  → Text node replaced with actual heading element!
  → heading.focus() moves cursor to new element!
```

---

## §8. Step 5: Observe Each Card

> Evgenii: _"Use mutation observer observe with subtree:true and characterData:true. Use single observer for all rendered cards."_

```javascript
// When creating cards, register observer on each
function appendCard(card) {
  list.appendChild(card);

  // Observe with subtree + characterData!
  observer.observe(card, {
    subtree: true, // Deep tracking!
    characterData: true, // Only text changes!
    // childList: false (not needed!)
    // attributes: false (not needed!)
  });
}
```

```
OBSERVER CONFIGURATION:
═══════════════════════════════════════════════════════════════

  ✅ subtree: true      → track ALL descendants' text changes
  ✅ characterData: true → detect typing/editing
  ❌ childList: false    → DON'T track node add/remove
  ❌ attributes: false   → DON'T track attribute changes

  SINGLE observer for ALL cards!
  → observer.observe(card1, config)
  → observer.observe(card2, config)
  → observer.observe(card3, config)
  → Same observer instance, multiple targets!
```

---

## §9. Complete Solution

```html
<!DOCTYPE html>
<html>
  <head>
    <style>
      .card {
        border: 1px solid #ddd;
        padding: 16px;
        margin: 8px;
      }
      .card_body_content {
        min-height: 40px;
        border: 1px dashed #ccc;
        padding: 8px;
      }
      h1,
      h2,
      h3 {
        margin: 4px 0;
        color: #2c3e50;
      }
    </style>

    <template id="card-template">
      <article class="card">
        <h2 class="card_title"></h2>
        <section class="card_body_content" contenteditable="true">
          <p>Type h1, h2, or h3 here...</p>
        </section>
      </article>
    </template>
  </head>
  <body>
    <div id="list"></div>

    <script>
      // Supported heading tags
      const supportedElements = new Set(["h1", "h2", "h3"]);

      function getHeading(textNode) {
        const tag = textNode.textContent.trim().toLowerCase();
        const heading = document.createElement(tag);
        heading.textContent = tag.toUpperCase() + " Heading";
        heading.contentEditable = "true";
        return heading;
      }

      // Create card from template
      function createCard(title, body) {
        const template = document.getElementById("card-template");
        const card = template.content.cloneNode(true).firstElementChild;
        card.querySelector(".card_title").textContent = title;
        return card;
      }

      // MutationObserver — single observer for ALL cards!
      const observer = new MutationObserver((entries) => {
        for (const mutation of entries) {
          const target = mutation.target;

          // 1. Filter: only characterData!
          if (mutation.type !== "characterData") continue;

          // 2. Check: does text match supported tag?
          const text = target.textContent.trim().toLowerCase();
          if (!supportedElements.has(text)) continue;

          // 3. Replace with heading element!
          const heading = getHeading(target);
          target.replaceWith(heading);

          // 4. Focus on new heading!
          heading.focus();
        }
      });

      // Create cards and observe each
      const list = document.getElementById("list");
      for (let i = 1; i <= 3; i++) {
        const card = createCard(`Card ${i}`);
        list.appendChild(card);

        // Register observer: subtree + characterData only!
        observer.observe(card, {
          subtree: true,
          characterData: true,
        });
      }
    </script>
  </body>
</html>
```

---

## §10. Tự Code: Enhanced Markdown Editor

```javascript
// ═══ ENHANCED MARKDOWN EDITOR ═══

class MarkdownEditor {
  #observer;
  #commands = new Map();

  constructor() {
    // Register supported commands
    this.#commands.set("h1", (text) => this.#createHeading("h1"));
    this.#commands.set("h2", (text) => this.#createHeading("h2"));
    this.#commands.set("h3", (text) => this.#createHeading("h3"));
    this.#commands.set("hr", () => document.createElement("hr"));
    this.#commands.set("code", () => {
      const pre = document.createElement("pre");
      const code = document.createElement("code");
      code.contentEditable = "true";
      code.textContent = "// Write code here";
      pre.appendChild(code);
      return pre;
    });

    // Single observer for all editors!
    this.#observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        if (mutation.type !== "characterData") continue;

        const text = mutation.target.textContent.trim().toLowerCase();
        const createFn = this.#commands.get(text);

        if (createFn) {
          const element = createFn(text);
          mutation.target.replaceWith(element);
          if (element.focus) element.focus();
        }
      }
    });
  }

  #createHeading(tag) {
    const heading = document.createElement(tag);
    heading.textContent = `${tag.toUpperCase()} Heading`;
    heading.contentEditable = "true";
    return heading;
  }

  observe(element) {
    // Add contenteditable if not set
    if (!element.contentEditable || element.contentEditable === "false") {
      element.contentEditable = "true";
    }

    this.#observer.observe(element, {
      subtree: true,
      characterData: true,
    });

    return this;
  }

  disconnect() {
    this.#observer.disconnect();
  }
}

// Usage:
const editor = new MarkdownEditor();
document.querySelectorAll(".editable").forEach((el) => {
  editor.observe(el);
});

// Type "h1", "h2", "h3", "hr", or "code" to create elements!
// Single observer handles ALL editable areas!

console.log("═══ MARKDOWN EDITOR ═══");
console.log("MutationObserver + characterData + replaceWith");
console.log("Single observer for ALL cards (reusable!)");
console.log("contenteditable = Notion-like editing!");
console.log("No infinite recursion: characterData only fires on typing!");
```

---

## Checklist

```
[ ] contenteditable="true" → any element becomes editable!
[ ] MutationObserver tracks characterData (typing)!
[ ] Filter: mutation.type === 'characterData'!
[ ] Check text against supportedElements Set!
[ ] replaceWith() swaps text node for heading element!
[ ] focus() moves cursor to new element!
[ ] subtree:true + characterData:true = correct config!
[ ] Single observer for ALL cards (reusable!)
[ ] No infinite recursion: only characterData triggers!
[ ] Notion, Google Docs, Grammarly use similar patterns!
TIẾP THEO → Phần 15: ResizeObserver!
```
