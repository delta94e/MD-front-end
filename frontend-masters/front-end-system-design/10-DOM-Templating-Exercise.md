# Front-End System Design — Phần 10: DOM Templating Exercise — "Template Tag, DocumentFragment, No Reflow in Memory!"

> 📅 2026-03-09 · ⏱ 25 phút đọc
>
> Nguồn: Frontend Masters — Evgenii Ray (Meta, ex-JetBrains)
> Bài: DOM Templating Exercise — "Template tag = lightweight in-memory HTML, not queryable, not rendered! Clone content.cloneNode(true).firstElementChild. DocumentFragment = no reflow until appendChild! String innerHTML vs Template approach."
> Độ khó: ⭐️⭐️⭐️ | Practical — live-code exercise!

---

## Mục Lục

| #   | Phần                                                       |
| --- | ---------------------------------------------------------- |
| 1   | The Exercise — "createCardComponent!"                      |
| 2   | Approach 1: innerHTML String — "Works But Bad!"            |
| 3   | Template Tag — "Lightweight, Not Queryable, Not Rendered!" |
| 4   | Clone Content — "cloneNode(true).firstElementChild!"       |
| 5   | Query from Clone, Not Document!                            |
| 6   | Why No Reflow? — "Fragment Is In Memory!"                  |
| 7   | String Replace vs Template — Comparison                    |
| 8   | Full Solution                                              |
| 9   | Tự Code: Reusable Template System                          |

---

## §1. The Exercise — "createCardComponent!"

> Evgenii: _"We need to implement createCardComponent that takes title and body strings, returns an HTML element, then append to container."_

```
EXERCISE GOAL:
═══════════════════════════════════════════════════════════════

  function createCardComponent(title, body) {
    // Take a template
    // Clone it
    // Set title and body text
    // Return compiled HTML element
  }

  // Usage:
  const card = createCardComponent("Hello", "World");
  container.appendChild(card);  // ONE reflow!
```

---

## §2. Approach 1: innerHTML String — "Works But Bad!"

```javascript
// ❌ Approach 1: innerHTML with string
function createCardBad(title, body) {
  container.innerHTML = `
    <article class="card">
      <h2 class="card_title">${title}</h2>
      <p class="card_body_content">${body}</p>
    </article>
  `;
  // Problems:
  // 1. Working with strings = hard to maintain!
  // 2. HTML parser invoked EVERY time!
  // 3. Not reusable as a function returning element!
  // 4. XSS risk if title/body contain HTML!
}
```

---

## §3. Template Tag — "Lightweight, Not Queryable, Not Rendered!"

> Evgenii: _"The template tag stores HTML in a lightweight object in memory. Content not queryable by DOM API. External scripts can't access it. Not rendered on the final render tree."_

```html
<head>
  <!-- Template: lightweight, hidden, reusable! -->
  <template id="card-template">
    <article class="card">
      <h2 class="card_title"></h2>
      <p class="card_body_content"></p>
    </article>
  </template>
</head>
```

```
TEMPLATE TAG PROPERTIES:
═══════════════════════════════════════════════════════════════

  ✅ Stored in memory (lightweight!)
  ✅ Content NOT queryable by external DOM API!
  ✅ NOT rendered on screen!
  ✅ NOT in render tree (no reflow cost!)
  ✅ External scripts CANNOT access content!
  ✅ But template ITSELF is queryable by ID!
  ✅ Can be cloned and reused many times!

  "The natural place to keep markup components!" — Evgenii
```

---

## §4. Clone Content — "cloneNode(true).firstElementChild!"

> Evgenii: _"Templates use fragments. We need to clone the content. Use template.content.cloneNode(true).firstElementChild to get the article."_

```javascript
// Step 1: Get template reference
const template = document.getElementById("card-template");

// Step 2: Clone the content (deep clone!)
const card = template.content // → DocumentFragment
  .cloneNode(true).firstElementChild; // → Deep copy of fragment // → <article> element!

// WHY firstElementChild?
// template.content = DocumentFragment (wrapper!)
// template.content.cloneNode(true) = cloned fragment
// .firstElementChild = the actual <article> we want!
```

```
CLONE CHAIN:
═══════════════════════════════════════════════════════════════

  template
  └── .content → DocumentFragment
      └── .cloneNode(true) → Cloned Fragment (deep!)
          └── .firstElementChild → <article> ← WANT THIS!
              ├── <h2 class="card_title">
              └── <p class="card_body_content">
```

---

## §5. Query from Clone, Not Document!

> Evgenii: _"We don't need to query the document, we need to query card. If we fix that, now we have our card rendered."_

```javascript
// ❌ BUG: Querying from document!
const [cardTitle, cardBody] = document.querySelectorAll(
  ".card_title, .card_body_content",
);
// → Finds elements in MAIN DOM, not in our clone!
// → Returns undefined if card not yet appended!

// ✅ FIX: Query from the CLONED element!
const [cardTitle, cardBody] = card.querySelectorAll(
  ".card_title, .card_body_content",
);
// → Finds elements in OUR clone!
// → Works even though clone is in memory!

cardTitle.textContent = title;
cardBody.textContent = body;
```

---

## §6. Why No Reflow? — "Fragment Is In Memory!"

> Student: _"Why doesn't this trigger reflow?"_
> Evgenii: _"When you modify the fragment, it's not in the DOM tree. It's in memory. Updating properties doesn't trigger reflow. Only appendChild counts."_

```
WHY NO REFLOW:
═══════════════════════════════════════════════════════════════

  ┌─── DOM Tree (triggers reflow!) ──────────────┐
  │ html → body → container                       │
  │ Modifying elements HERE = REFLOW!              │
  └────────────────────────────────────────────────┘

  ┌─── Memory (DocumentFragment, NO reflow!) ────┐
  │ card (cloned from template)                    │
  │ ├── h2.card_title = "Hello"  ← No reflow!    │
  │ └── p.card_body = "World"    ← No reflow!    │
  │                                                │
  │ "Disconnected from main DOM tree!" — Evgenii   │
  └────────────────────────────────────────────────┘

  container.appendChild(card);  ← ONE reflow! ✅
  (This is the ONLY point where reflow occurs!)
```

---

## §7. String Replace vs Template — Comparison

> Evgenii: _"First solution: treat article as string, create placeholders, replace with string.replace(). But working with strings is not the best way."_

```
COMPARISON:
═══════════════════════════════════════════════════════════════

  ❌ String approach:
  const html = '<article><h2>{{title}}</h2></article>';
  const result = html.replace('{{title}}', title);
  container.innerHTML = result;
  → Work with strings = messy!
  → innerHTML = parser every time!
  → Not reusable as DOM element!
  → XSS vulnerability!

  ✅ Template approach:
  const card = template.content.cloneNode(true).firstElementChild;
  card.querySelector('.title').textContent = title;
  container.appendChild(card);
  → Work with DOM objects = clean!
  → No parser needed!
  → Fragment = no reflow until append!
  → Reusable many times!
  → textContent = safe from XSS!
  → "Very natural place for markup" — Evgenii
```

---

## §8. Full Solution

```html
<!DOCTYPE html>
<html>
  <head>
    <template id="card-template">
      <article class="card">
        <h2 class="card_title"></h2>
        <p class="card_body_content"></p>
      </article>
    </template>
  </head>
  <body>
    <div id="container"></div>

    <script>
      function createCardComponent(title, body) {
        // 1. Get template
        const template = document.getElementById("card-template");

        // 2. Clone content (deep!)
        const card = template.content.cloneNode(true).firstElementChild;

        // 3. Query from CLONE, not document!
        const [cardTitle, cardBody] = card.querySelectorAll(
          ".card_title, .card_body_content",
        );

        // 4. Set text (in memory, no reflow!)
        cardTitle.textContent = title;
        cardBody.textContent = body;

        // 5. Return compiled element
        return card;
      }

      // Usage
      const container = document.getElementById("container");
      const card = createCardComponent(
        "Frontend System Design",
        "Understanding how every library works!",
      );
      container.appendChild(card); // ONE reflow! ✅
    </script>
  </body>
</html>
```

---

## §9. Tự Code: Reusable Template System

```javascript
// ═══ REUSABLE TEMPLATE SYSTEM ═══

class TemplateEngine {
  #templates = new Map();

  register(id) {
    const template = document.getElementById(id);
    if (!template) throw new Error(`Template #${id} not found!`);
    this.#templates.set(id, template);
    return this;
  }

  create(id, data = {}) {
    const template = this.#templates.get(id);
    if (!template) throw new Error(`Template #${id} not registered!`);

    // Clone from template (in memory!)
    const element = template.content.cloneNode(true).firstElementChild;

    // Populate data (all in memory, no reflow!)
    Object.entries(data).forEach(([selector, value]) => {
      const el = element.querySelector(selector);
      if (el) el.textContent = value;
    });

    return element;
  }

  // Batch create multiple elements
  createBatch(id, dataArray) {
    const fragment = document.createDocumentFragment();

    dataArray.forEach((data) => {
      const element = this.create(id, data);
      fragment.appendChild(element); // In memory!
    });

    return fragment; // Append this = ONE reflow!
  }
}

// Usage:
const engine = new TemplateEngine();
engine.register("card-template");

// Single card
const card = engine.create("card-template", {
  ".card_title": "Hello",
  ".card_body_content": "World",
});
container.appendChild(card);

// Batch: 100 cards, ONE reflow!
const cards = engine.createBatch("card-template", [
  { ".card_title": "Card 1", ".card_body_content": "Body 1" },
  { ".card_title": "Card 2", ".card_body_content": "Body 2" },
  // ...100 items
]);
container.appendChild(cards); // ONE reflow for all 100! ✅

console.log("═══ TEMPLATE ENGINE ═══");
console.log("1. Register templates by ID");
console.log("2. Clone + populate in memory (no reflow!)");
console.log("3. Batch create with DocumentFragment");
console.log("4. Single appendChild = ONE reflow!");
```

---

## Checklist

```
[ ] <template> tag = lightweight in-memory HTML!
[ ] Content NOT queryable, NOT rendered, NOT in render tree!
[ ] Clone: template.content.cloneNode(true).firstElementChild!
[ ] Query from CLONE, not document!
[ ] Modify clone in memory = NO reflow!
[ ] appendChild = ONE reflow (only point of reflow!)
[ ] String innerHTML = parser + XSS risk!
[ ] Template + textContent = no parser + XSS safe!
[ ] DocumentFragment for batch operations!
[ ] "DOM API is simple, limited methods, useful for low-level" — Evgenii
TIẾP THEO → Phần 11: Observer API!
```
