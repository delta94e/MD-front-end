# The Hard Parts of UI Development — Phần 31: Creating a JavaScript Virtual DOM — "VDOM Array, createVDOM, convert, updateDOM!"

> 📅 2026-03-08 · ⏱ 40 phút đọc
>
> Nguồn: Frontend Masters — Will Sentance
> Khoá học: The Hard Parts of UI Development
> Bài: Creating a JavaScript Virtual DOM — "John: Setup, Alexa: createVDOM, Paul: convert(input), Alexa: convert(div), replaceChildren!"
> Độ khó: ⭐️⭐️⭐️⭐️⭐️ | Advanced — VDOM array, createVDOM function, convert function, updateDOM cycle, textContent on input edge case!

---

## Mục Lục

| #   | Phần                                                          |
| --- | ------------------------------------------------------------- |
| 1   | Bối Cảnh — "Non-Edge Case Virtual DOM!"                       |
| 2   | Schematic Setup — "John: 4 Variables, 4 Functions!"           |
| 3   | setInterval(updateDOM, 15) — "John: Done!"                    |
| 4   | updateDOM Callback — "Alexa: createVDOM → VDOM!"              |
| 5   | VDOM Evaluation — "Alexa: Input + Div, Empty String + Hello!" |
| 6   | convert(VDOM[0]) — "Paul: createElement + value + handler!"   |
| 7   | textContent on Input — "Cheeky, Lazy, Sure!"                  |
| 8   | convert(VDOM[1]) — "Alexa: By Analogy, Div + textContent!"    |
| 9   | replaceChildren — "Displayed on the Page!"                    |
| 10  | Tự Implement: Full VDOM Pipeline                              |
| 11  | 🔬 Deep Analysis Patterns — VDOM Architecture                 |

---

## §1. Bối Cảnh — "Non-Edge Case Virtual DOM!"

> Will: _"We are now gonna diagram through a full implementation of a very NON-EDGE CASE handling visual virtual DOM."_

### Minimal → understand → expand!

Will: _"It can only handle two elements. We're gonna make it much more flexible very soon. We start with something MINIMAL so that we can appreciate when we add that flexibility, WHY we are doing it."_

Key insight: elements tạo bằng **dynamic content** — vì sở hữu template literals!

_"Those are dynamic pieces of content — which is kind of cool, right? That's what HTML DIDN'T give us. It IS the ability to have dynamic content described in our code."_

Code structure mới:

- `createVDOM()` — tạo array of arrays (visual description!)
- `convert(node)` — transform array → real DOM element!
- `updateDOM()` — gọi createVDOM + convert + replaceChildren!
- `handle()` — user action → chỉ change data!

```
VDOM ARCHITECTURE:
═══════════════════════════════════════════════════════════════

  DATA:    name = ""
              │
  createVDOM  │  → VDOM = [["input", "", handle], ["div", "Hello, !"]]
              │
  convert()   │  → C++ input + C++ div (unattached!)
              │
  replaceChildren → body.children = [input, div]
              │
  PAGE:    │  → [___] + Hello, !
              │
  USER:    │  → types "y" → handle() → name = "y"
              │
  15ms:    │  → updateDOM() → repeat! 🔄
```

---

## §2. Schematic Setup — "John: 4 Variables, 4 Functions!"

> John: _"We are declaring name to empty string. jsInput undefined. Virtual DOM unassigned."_

### John verbalize setup

John:

1. `name = ""` (empty string!)
2. `jsInput` (unassigned!)
3. `VDOM` (unassigned!)
4. `jsDiv` (unassigned!)

Will rearranges memory layout: _"VDOM above because the data's gonna flow DOWN through — from here to here."_ — Visual diagramming matters!

Functions:

- John: _"Declaring create virtual DOM function."_ → createVDOM
- John: _"Declaring handle function."_ → handle
- John: _"Declaring update DOM function."_ → updateDOM

Will adds: _"And convert — putting all the job of converting that generic set of information in one function."_

```
MEMORY LAYOUT — WILL's ARRANGEMENT:
═══════════════════════════════════════════════════════════════

  ┌──────────────────────────────────────────────────────────┐
  │ name: ""            ← DATA!                            │
  │                                                          │
  │ VDOM: -             ← will hold array of arrays!       │
  │   ↓ (data flows DOWN)                                   │
  │ jsInput: -          ← will hold accessor!              │
  │ jsDiv: -            ← will hold accessor!              │
  │                                                          │
  │ createVDOM: fn      ← returns VDOM array!              │
  │ handle: fn          ← user action → data!              │
  │ updateDOM: fn       ← orchestrator!                    │
  │ convert: fn         ← array → DOM element!             │
  └──────────────────────────────────────────────────────────┘

  Will: "VDOM above because data FLOWS DOWN." 📐
```

---

## §3. setInterval(updateDOM, 15) — "John: Done!"

> John: _"Update DOM, 15 milliseconds."_
> Will: _"Added to the callback queue every 15 milliseconds — can't say it's gonna EXECUTE every 15ms."_

### Will corrects: "added to queue", not "executed"!

Will important correction:

_"Sorry, be added to the CALLBACK QUEUE every 15 milliseconds. Can't say it's gonna execute every 15 milliseconds, but we add it back into JavaScript."_

_"I really should have left this dataToView, but okay. Although it's updateDOM — it IS converting our data into our view."_

→ setInterval done. Global code finished. Call stack empty. Timer running.

```
setInterval — "DONE!":
═══════════════════════════════════════════════════════════════

  setInterval(updateDOM, 15):
  ┌──────────────────────────────────────────────────────────┐
  │ ⏱️ Timer: updateDOM every 15ms → callback queue!      │
  │ ────── LINE THROUGH — DONE! ──────                    │
  │                                                          │
  │ Will: "ADDED TO QUEUE, not executed!"                  │
  │ (Can't guarantee execution every 15ms!)                │
  └──────────────────────────────────────────────────────────┘
```

---

## §4. updateDOM Callback — "Alexa: createVDOM → VDOM!"

> Alexa: _"We're reassigning VDOM to the evaluated result of invoking createVDOM."_

### 15ms → updateDOM → createVDOM!

Alexa: _"Update DOM."_ → Will: _"There's nothing on the call stack, all synchronous code is finished."_ → Alexa: _"In the call stack?"_ → Will: _"Yeah. Create a new execution context."_

Inside updateDOM: _"Reassigning VDOM to the evaluated result of invoking createVDOM."_

Will: _"createVDOM is on the call stack and into it we go — it's going to return out an array of two sub-arrays, each describing a different element."_

```
updateDOM — createVDOM:
═══════════════════════════════════════════════════════════════

  t=15ms: updateDOM on call stack!
  ┌──────────────────────────────────────────────────────────┐
  │ VDOM = createVDOM()                                      │
  │                                                          │
  │ createVDOM():                                            │
  │   return [                                               │
  │     ["input", name, handle],  ← name = ""!             │
  │     ["div", `Hello, ${name}!`]  ← "Hello, !"          │
  │   ]                                                      │
  │                                                          │
  │ Alexa: "Reassigning VDOM to the evaluated result       │
  │         of invoking createVDOM." ✅                      │
  └──────────────────────────────────────────────────────────┘
```

---

## §5. VDOM Evaluation — "Alexa: Input + Div, Empty String + Hello!"

> Alexa: _"First sub-array: string 'input', empty string, and a function definition."_

### Template literals EVALUATED tại thời điểm gọi!

Alexa verbalize VDOM:

- _"First sub-array: string 'input'."_ → type!
- _"Empty string."_ → name = "" → value!
- _"Function definition."_ → handle function reference!

Will: _"It's gonna be an input element with NO value content right now, no preview text, and a handler defined attached to it. Really cool."_

Second sub-array: Alexa: _"Zeroeth element is string 'div'. And string 'hello, !' — evaluated template literal."_

Will: _"A fully evaluated — turned into its REAL VALUES — representation of what's gonna show up on the page."_

```
VDOM — EVALUATED STATE:
═══════════════════════════════════════════════════════════════

  VDOM = [
    ["input", "",      handle],   ← sub-array 0!
    ["div",   "Hello, !"]         ← sub-array 1!
  ]

  VISUAL MAP:
  ┌──────────────────────────────────────────────────────────┐
  │ VDOM[0]: ["input", "", handle]                          │
  │ → type: input | value: "" | handler: handle            │
  │                                                          │
  │ VDOM[1]: ["div", "Hello, !"]                            │
  │ → type: div | content: "Hello, !"                      │
  └──────────────────────────────────────────────────────────┘

  Will: "A fully EVALUATED representation of what's
         gonna show up on the page!" 🎯
```

---

## §6. convert(VDOM[0]) — "Paul: createElement + value + handler!"

> Paul: _"jsInput is reassigned to the result from convert. The node is passed VDOM[0] which is the first sub-array."_

### Paul walkthrough convert!

Paul verbalize:

1. _"jsInput is reassigned to the result from convert."_
2. _"Node is passed VDOM[0] — the first sub-array."_
3. _"Creates a constant elem."_ → Will: _"That's memory — local memory!"_
4. _"It's passed the first element — string 'input'."_ → createElement("input")!

Will: _"Uses the link from document object to the DOM — gonna create type input."_

Paul continues:

5. _"Value: empty string."_ → elem.value = node[1] = ""
6. _"Handle function."_ → elem.oninput = node[2] = handle

Will: _"In order to persist the link after closing this execution context, we return out that object. Into what global constant?"_ → Paul: _"jsInput."_ ✅

```
convert(VDOM[0]) — PAUL's WALKTHROUGH:
═══════════════════════════════════════════════════════════════

  convert(["input", "", handle]):

  node = ["input", "", handle]

  LINE 18: const elem = document.createElement(node[0])
  ┌──────────────────────────────────────────────────────────┐
  │ createElement("input") → C++ input (unattached!)       │
  │ elem = { [[link]] → input, value: g/s, oninput: s }  │
  │ Paul: "Creates a constant elem." ✅                    │
  └──────────────────────────────────────────────────────────┘

  LINE 20: elem.value = node[1]
  ┌──────────────────────────────────────────────────────────┐
  │ value setter → input.value = "" (empty string!)        │
  │ Paul: "Basically an empty string." ✅                  │
  └──────────────────────────────────────────────────────────┘

  LINE 21: elem.oninput = node[2]
  ┌──────────────────────────────────────────────────────────┐
  │ oninput setter → input.handler = handle!               │
  │ Paul: "The handle function." ✅                        │
  └──────────────────────────────────────────────────────────┘

  RETURN elem → jsInput! ✅
```

---

## §7. textContent on Input — "Cheeky, Lazy, Sure!"

> Will: _"We're gonna end up trying to use textContent even though that's NOT gonna actually do anything to our input. Cheeky, lazy, sure."_

### Will thừa nhận: skip edge case!

Will: _"In practice, a convert function would absolutely ASSESS: is the element linked to an input or a div? Do NOT try and set textContent on an input element."_

_"In order to save code and space, if it doesn't BREAK it, we're not worried."_

Line 19: `elem.textContent = node[1]` → on input element → **silently ignored**! (no error, just no effect!)

→ Production code: phải check element type! Will's code: skip for diagramming!

```
textContent ON INPUT — EDGE CASE:
═══════════════════════════════════════════════════════════════

  WILL's CODE (pedagogy):
  ┌──────────────────────────────────────────────────────────┐
  │ elem.textContent = node[1];  // ← runs for ALL types! │
  │ elem.value = node[1];        // ← runs for ALL types! │
  │                                                          │
  │ input: textContent = "" → NO EFFECT! (harmless!)      │
  │ div: value = "Hello" → NO EFFECT! (harmless!)         │
  └──────────────────────────────────────────────────────────┘

  PRODUCTION CODE:
  ┌──────────────────────────────────────────────────────────┐
  │ if (node[0] === "input") {                              │
  │   elem.value = node[1];                                 │
  │   elem.oninput = node[2];                               │
  │ } else {                                                 │
  │   elem.textContent = node[1];                           │
  │ }                                                        │
  │ ← More correct, but more code!                        │
  └──────────────────────────────────────────────────────────┘

  "Cheeky, lazy, sure. If it doesn't BREAK,
   we're not worried." — Will 😏
```

---

## §8. convert(VDOM[1]) — "Alexa: By Analogy, Div + textContent!"

> Alexa: _"Using document.createElement, we create a div node on the DOM — unattached."_
> Alexa: _"Set text content to 'Hello, !'"._

### Alexa by analogy!

Will: _"By analogy, we also created div."_ Alexa verbalize:

1. _"Redefining jsDiv to the result of calling convert on VDOM[1]."_
2. _"Using createElement, create a div node — unattached."_
3. Locally stored as elem!
4. _"Set text content of that new div to 'Hello, !'"_
5. Return out into jsDiv!

Will: _"textContent and a hidden link to this div."_

```
convert(VDOM[1]) — ALEXA:
═══════════════════════════════════════════════════════════════

  convert(["div", "Hello, !"]):

  ┌──────────────────────────────────────────────────────────┐
  │ createElement("div") → C++ div (unattached!)           │
  │ elem.textContent = "Hello, !" (setter → C++!)         │
  │ return elem → jsDiv! ✅                                │
  │                                                          │
  │ jsDiv = { [[link]] → div, textContent: g/s }          │
  │ C++ div: { text: "Hello, !" }                          │
  │                                                          │
  │ Alexa: "Set text content to 'Hello, !'" ✅             │
  └──────────────────────────────────────────────────────────┘
```

---

## §9. replaceChildren — "Displayed on the Page!"

> Alexa: _"We use replaceChildren on body of document. Pass in those new JavaScript objects that link to our new unattached DOM elements — replaceChildren will APPEND them to the body."_

### Alexa verbalize replaceChildren hoàn hảo!

Alexa: _"We use the replaceChildren method on the body of the document object. And we pass in those new JavaScript objects that link to our new unattached DOM elements, and then replaceChildren will append them to the body on the DOM."_

Will: _"We use these two accessor links and body's accessor link to attach these two to body as children."_

Result: input (empty) + div ("Hello, !") → displayed!

```
replaceChildren — INITIAL RENDER:
═══════════════════════════════════════════════════════════════

  document.body.replaceChildren(jsInput, jsDiv):

  C++ DOM:
  ┌──────────────────────────────────────────────────────────┐
  │ body: {                                                  │
  │   children: [                                            │
  │     input → { value: "" }        ← ATTACHED! ✅       │
  │     div → { text: "Hello, !" }   ← ATTACHED! ✅       │
  │   ]                                                      │
  │ }                                                        │
  └──────────────────────────────────────────────────────────┘

  PAGE:
  ┌──────────────────────────┐
  │ [_______________]        │ ← input (empty!)
  │ Hello, !                 │ ← div!
  └──────────────────────────┘

  Alexa: "replaceChildren will APPEND them to body!" ✅
  Will: "Displayed on the page! All in one converter!" 🎉
```

---

## §10. Tự Implement: Full VDOM Pipeline

```javascript
// ═══════════════════════════════════════════════════
// Full Virtual DOM Pipeline!
// createVDOM → convert → replaceChildren!
// ═══════════════════════════════════════════════════

// ── Simplified C++ DOM ──

class CppEl {
  static count = 0;
  constructor(type) {
    this.id = ++CppEl.count;
    this.type = type;
    this.value = "";
    this.text = "";
    this.handler = null;
  }
}

const body = { children: [] };

const document = {
  createElement(type) {
    const el = new CppEl(type);
    console.log(`    📦 createElement("${type}") → #${el.id} unattached!`);
    return el;
  },
  body: {
    replaceChildren(...els) {
      body.children = els;
      const names = els.map((e) => `${e.type}#${e.id}`).join(", ");
      console.log(`    🔗 body.replaceChildren(${names})`);
    },
  },
};

function makeAccessor(el) {
  return {
    get value() {
      return el.value;
    },
    set value(v) {
      el.value = v;
    },
    set textContent(v) {
      el.text = String(v);
    },
    set oninput(fn) {
      el.handler = fn;
    },
    focus() {
      /* cursor! */
    },
    _el: el,
  };
}

// ═══ STATE ═══

let name = "";
let jsInput;
let jsDiv;
let VDOM;

// ═══ createVDOM ═══

function createVDOM() {
  return [
    ["input", name, handle],
    ["div", `Hello, ${name}!`],
  ];
}

// ═══ convert ═══

function convert(node) {
  const el = document.createElement(node[0]);
  const acc = makeAccessor(el);

  // textContent — harmless on input! (Will: "cheeky!")
  acc.textContent = node[1];
  // value — harmless on div!
  acc.value = node[1];
  // handler — only for input, but won't break div!
  if (node[2]) acc.oninput = node[2];

  return { acc, el };
}

// ═══ handle ═══

function handle() {
  name = jsInput.value; // CHỈ DATA!
}

// ═══ updateDOM ═══

function updateDOM() {
  console.log("\n── updateDOM() ──");

  // Step 1: createVDOM
  VDOM = createVDOM();
  console.log(
    `  VDOM = ${JSON.stringify(VDOM.map((a) => [a[0], a[1], a[2] ? "handle" : undefined]))}`,
  );

  // Step 2: convert each
  const r0 = convert(VDOM[0]);
  jsInput = r0.acc;
  console.log(`  jsInput → ${r0.el.type}#${r0.el.id}`);

  const r1 = convert(VDOM[1]);
  jsDiv = r1.acc;
  console.log(`  jsDiv → ${r1.el.type}#${r1.el.id}`);

  // Step 3: replaceChildren
  document.body.replaceChildren(r0.el, r1.el);

  // Step 4: focus
  jsInput.focus();
}

// ═══ DEMO ═══

console.log("═══ FULL VDOM PIPELINE ═══");

console.log("\n══ RENDER 1: name='' ══");
updateDOM();
console.log(
  `  Page: [${body.children.map((c) => `<${c.type}>${c.value || c.text}</${c.type}>`).join(" ")}]`,
);

console.log("\n══ USER types 'y' ══");
name = "y"; // simulate handle
console.log("  name = 'y'");

console.log("\n══ RENDER 2: name='y' ══");
updateDOM();
console.log(
  `  Page: [${body.children.map((c) => `<${c.type}>${c.value || c.text}</${c.type}>`).join(" ")}]`,
);

console.log("\n══ USER types 'Jo' ══");
name = "Jo";

console.log("\n══ RENDER 3: name='Jo' ══");
updateDOM();
console.log(
  `  Page: [${body.children.map((c) => `<${c.type}>${c.value || c.text}</${c.type}>`).join(" ")}]`,
);

console.log("\n  ✅ VDOM = JS visual representation!");
console.log("  ✅ convert() transforms to real DOM!");
console.log("  ✅ updateDOM() orchestrates full cycle!");
console.log("  ✅ 'Non-edge case but WORKS!' — Will 🎉");
```

---

## §11. 🔬 Deep Analysis Patterns — VDOM Architecture

### 11.1 Pattern ①: Data Flow Pipeline

```
DATA FLOW — FULL PIPELINE:
═══════════════════════════════════════════════════════════════

  ┌─────────┐    ┌───────────┐    ┌─────────┐    ┌────────┐
  │  STATE  │ →  │ createVDOM│ →  │ convert │ →  │  DOM   │
  │ name="" │    │ [arrays]  │    │ C++ els │    │ pixels │
  └─────────┘    └───────────┘    └─────────┘    └────────┘
       ↑                                              │
       │              ┌──────────┐                    │
       └──────────────│  handle  │←───── USER ACTION ─┘
                      │ name=val │
                      └──────────┘

  "Data flows DOWN (state → VDOM → DOM → pixels).
   User action flows UP (action → handler → state)." — Will
```

### 11.2 Pattern ②: VDOM as Archive

```
VDOM AS ARCHIVE — WILL's INSIGHT:
═══════════════════════════════════════════════════════════════

  Render 1: VDOM_v1 = [["input", ""], ["div", "Hello, !"]]
  Render 2: VDOM_v2 = [["input", "y"], ["div", "Hello, y!"]]

  Will: "We could ARCHIVE this! Then we'd know
         EXACTLY what changed between two states!"

  DIFF:
  ┌──────────────────────────────────────────────────────────┐
  │ VDOM_v1[0][1] = ""   → VDOM_v2[0][1] = "y"  CHANGED! │
  │ VDOM_v1[1][1] = "!"  → VDOM_v2[1][1] = "y!" CHANGED! │
  │                                                          │
  │ → Only update THESE elements! Not all! 🚀              │
  │ → This is DIFFING! (coming later!)                     │
  └──────────────────────────────────────────────────────────┘

  "Kind of cool, right? We could definitely
   USE that information." — Will 😏 (teasing diff!)
```

---

## Self-Assessment Checklist

```
CHECKLIST — SAU KHI HỌC PHẦN 31:
═══════════════════════════════════════════════════════════════

  SETUP:
  [ ] 4 variables: name, VDOM, jsInput, jsDiv
  [ ] 4 functions: createVDOM, handle, updateDOM, convert
  [ ] setInterval(updateDOM, 15) → timer!

  createVDOM:
  [ ] Returns array of sub-arrays!
  [ ] Template literals EVALUATED with current data!
  [ ] ["input", name, handle] + ["div", `Hello, ${name}!`]

  convert:
  [ ] node[0] → createElement(type)!
  [ ] node[1] → textContent + value (harmless overlap!)
  [ ] node[2] → oninput handler!
  [ ] return elem → accessor!

  updateDOM:
  [ ] VDOM = createVDOM() (visual description!)
  [ ] jsInput = convert(VDOM[0]) (input accessor!)
  [ ] jsDiv = convert(VDOM[1]) (div accessor!)
  [ ] replaceChildren(jsInput, jsDiv) (display!)

  EDGE CASES:
  [ ] textContent on input = harmless!
  [ ] "Cheeky, lazy, sure!" — Will
  [ ] Production: check element type!

  TIẾP THEO → Phần 32: JS Virtual DOM User Interaction!
```
