# The Hard Parts of UI Development — Phần 33: Declarative UI as a Paradigm

> 📅 2026-03-08 · ⏱ 20 phút đọc
>
> Nguồn: Frontend Masters — Will Sentance
> Bài: Declarative UI as a Paradigm — "Nested Elements, One-Way Data Binding, Semi-Visual Coding!"

---

## §1. Nested Elements — "Sub-Elements in Content!"

> Will: _"We can have elements in the content section — sub-elements! That would show up as nested on the DOM tree."_

### VDOM mở rộng: nested arrays!

Will: _"See a JavaScript NESTED list representation of your actual DOM elements and content — so you can get semi-visual coding."_

Ý tưởng: array con có thể chứa array con khác → **nested elements**!

_"Via nested objects or arrays of info. We can create these via functions that produce them as the output."_

→ Functional components: functions tạo VDOM sub-trees!

```
NESTED VDOM:
═══════════════════════════════════════════════════════════════

  FLAT (current):
  [["input", name, handle], ["div", `Hello, ${name}!`]]

  NESTED (future!):
  ["div", [
    ["input", name, handle],
    ["div", `Hello, ${name}!`],
    ["button", "Submit", handleClick]
  ]]
  → Sub-elements INSIDE parent! 🎯
  → "Semi-visual coding!" — Will
```

---

## §2. Source of Truth — "Guaranteed Accurate!"

> Will: _"For it to be guaranteed accurate and NOT out of sync, we need the data in JavaScript to be the ONLY source of truth."_

### One-way data binding = guaranteed accuracy!

Will: _"That's gonna allow us to have a function that runs through and produces a representation in JavaScript, first, of what's gonna show up."_

_"And know that there's NOTHING ELSE that could be showing up that is NOT from this source of truth."_

If one-way data binding broken:

_"Imagine the user wrote 'y' and we were NOT filling that through back to JavaScript. Then this VDOM would NOT have our latest update."_

```
SOURCE OF TRUTH:
═══════════════════════════════════════════════════════════════

  ✅ ONE-WAY (guaranteed!):
  user action → handler → DATA → VDOM → DOM
  → VDOM always matches DATA!
  → DATA always matches what user sees!

  ❌ BROKEN (out of sync!):
  user types "y" → C++ input shows "y"
  BUT JavaScript name = "" (not updated!)
  → VDOM says [input, ""] ← WRONG!
  → Out of sync! Not reflective! 😱

  "If you set up one-way data binding,
   it IS guaranteed to be reflective." — Will
```

---

## §3. Data Flow Diagram

> Will: _"User action from the user comes through, changes data via handler, then we run our converter through."_

### "Pinpoint submission" — not automatic propagation!

Will maps flow:

1. **User action** → DOM (C++)
2. → **Handler** → changes JavaScript data (pinpoint submission!)
3. → **createVDOM** → JavaScript description (VDOM!)
4. → **convert** → actual C++ DOM elements
5. → **DOM** → Layout/Render → pixels!

Will: _"Think of this as being a PINPOINT SUBMISSION of 'please take this new information and determine if you want to update the data.' We get to define that in our handler."_

_"Do NOT get involved in the automatic re-propagation of that to the page."_

```
DATA FLOW — FULL CIRCLE:
═══════════════════════════════════════════════════════════════

  ┌──────────┐    ┌──────────┐    ┌──────────┐
  │  STATE   │ →  │ createVDOM│ →  │ convert  │
  │ name="y" │    │ [arrays] │    │ C++ els  │
  └──────────┘    └──────────┘    └──────────┘
       ↑                               │
       │ PINPOINT                      ▼
       │ SUBMISSION!          ┌──────────────┐
  ┌────────────┐              │     DOM      │
  │  handler   │              │   → pixels!  │
  │ name = val │              └──────────────┘
  └────────────┘                     │
       ↑                             ▼
       └──── USER ACTION ◄────── 🖥️ PAGE

  "Pinpoint SUBMISSION — not automatic propagation!" — Will
```

---

## §4. Semi-Visual Coding — "Declare What You Want!"

> Will: _"We DECLARE what the page structure we want, and how we want its content to depend on data, and then it APPEARS on the page."_

### Declarative UI = mô tả KẾT QUẢ, không phải BƯỚC!

Will: _"We have semi-visual coding — our JavaScript DOM content and positioning on the page is reflected in our actual view."_

Two declarations:

1. **A**: Page structure (what elements!)
2. **B**: How content depends on data (template literals!)

_"Even an empty form field is a propagation of data — empty string in this case."_

```
DECLARATIVE UI:
═══════════════════════════════════════════════════════════════

  IMPERATIVE (step by step):
  ┌──────────────────────────────────────────────────────┐
  │ createElement("input")                               │
  │ input.value = name                                   │
  │ input.oninput = handle                               │
  │ createElement("div")                                 │
  │ div.textContent = `Hello, ${name}!`                 │
  │ body.replaceChildren(input, div)                     │
  │ → 6 steps! Computer-friendly, human-UNfriendly!    │
  └──────────────────────────────────────────────────────┘

  DECLARATIVE (describe result):
  ┌──────────────────────────────────────────────────────┐
  │ [["input", name, handle],                            │
  │  ["div", `Hello, ${name}!`]]                        │
  │ → 2 lines! Human-friendly, visual!                 │
  │ → "Declare WHAT, not HOW!" — paradigm shift!       │
  └──────────────────────────────────────────────────────┘

  "We DECLARE what structure we want and how content
   depends on data — then it APPEARS." — Will 🎯
```

---

## §5. Tự Implement

```javascript
// ═══ Declarative UI Demo ═══
let name = "";

// DECLARATIVE: describe WHAT, not HOW!
function createVDOM() {
  return [
    [
      "input",
      name,
      (e) => {
        name = e;
      },
    ],
    ["div", `Hello, ${name}!`],
  ];
}

// IMPERATIVE: convert handles HOW (hidden!)
function convert(node) {
  console.log(`  Declare: [${node[0]}, "${node[1]}"]`);
  console.log(`  Execute: createElement → set content → done!`);
  return { type: node[0], content: node[1] };
}

function render() {
  const vdom = createVDOM();
  console.log("  VDOM (declarative description):");
  vdom.forEach((n) => console.log(`    [${n[0]}, "${n[1]}"]`));
  const els = vdom.map(convert);
  console.log(
    `  Page: ${els.map((e) => `<${e.type}>${e.content}</${e.type}>`).join(" ")}`,
  );
}

console.log("Render 1 (name=''):");
render();
name = "Jo";
console.log("\nRender 2 (name='Jo'):");
render();
// "Declare what you want, it APPEARS!" — Will
```

---

## Checklist

```
[ ] Nested elements: sub-arrays in content → DOM tree!
[ ] Source of truth: JS data = ONLY source! One-way binding!
[ ] Data flow: user → handler → data → VDOM → DOM → pixels!
[ ] "Pinpoint submission" — handler defines data change!
[ ] Declarative UI: describe WHAT, not HOW!
[ ] "Even empty field = propagation of data (empty string)!"
TIẾP THEO → Phần 34: Functional Components!
```
