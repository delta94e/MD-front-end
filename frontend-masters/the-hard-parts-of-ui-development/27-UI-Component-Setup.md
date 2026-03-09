# The Hard Parts of UI Development — Phần 27: UI Component Setup — "Element Creation from JavaScript!"

> 📅 2026-03-08 · ⏱ 35 phút đọc
>
> Nguồn: Frontend Masters — Will Sentance
> Khoá học: The Hard Parts of UI Development
> Bài: UI Component Setup — "createElement, body, replaceChildren, Source of Truth in dataToView!"
> Độ khó: ⭐️⭐️⭐️⭐️⭐️ | Advanced — createElement in dataToView, body element, closure avoidance, full schematic!

---

## Mục Lục

| #   | Phần                                                      |
| --- | --------------------------------------------------------- |
| 1   | Recap — "Element Existence = Data, Even the Boxes!"       |
| 2   | New Code Structure — "createElement + replaceChildren!"   |
| 3   | Schematic — "HTML Parser, Layout, Render, Bitmap!"        |
| 4   | Justice: document Object — "createElement + body!"        |
| 5   | Three Variables on One Line — "Diagramming, Not Closure!" |
| 6   | Two Functions — "Converter + Handler!"                    |
| 7   | setInterval Setup — "Timer Feature, Done!"                |
| 8   | Tự Implement: Full Component Setup                        |
| 9   | 🔬 Deep Analysis Patterns — Component Setup Architecture  |

---

## §1. Recap — "Element Existence = Data, Even the Boxes!"

> Will: _"Even the EXISTENCE or not of the element is also something that should be a result of underlying DATA."_

### Bối cảnh — Tóm tắt lesson trước

Will tóm tắt insight quan trọng:

_"There are MORE things the user sees that can be changed than just the text content. Actually, even the existence or not of the element — div or input — is also something that IS or SHOULD BE a result of underlying data."_

Handlers **CHỈ** affect data, **KHÔNG** affect view:

_"The handlers that handle the user's action will ONLY be able to affect that data. And yet this handler we had it affect the VIEW."_

→ remove() trong handler = violation! Nên sửa: **element creation** phải nằm TRONG dataToView!

_"That led us to ADD to our dataToView function two important new lines — our CREATION of our element, our div and input."_

```
RECAP — ELEMENT CREATION IN dataToView:
═══════════════════════════════════════════════════════════════

  TRƯỚC:
  ┌──────────────────────────────────────────────────────────┐
  │ HTML: <input> <div>      ← tạo elements!              │
  │ dataToView(): chỉ set value/textContent                │
  │ handler: jsDiv.remove()  ← VIOLATION! ⚠️               │
  └──────────────────────────────────────────────────────────┘

  SAU:
  ┌──────────────────────────────────────────────────────────┐
  │ HTML: chỉ <script>       ← không tạo input/div!       │
  │ dataToView(): {                                          │
  │   createElement("input")  ← TẠO element! ✅           │
  │   createElement("div")    ← TẠO element! ✅           │
  │   set value/textContent   ← set content! ✅            │
  │   replaceChildren(...)    ← add to page! ✅            │
  │ }                                                        │
  │ handler: chỉ post = typed ← CHỈ DATA! ✅             │
  └──────────────────────────────────────────────────────────┘

  "The ONLY PLACE that can affect the view is through
   the dataToView converter." — Will
```

---

## §2. New Code Structure — "createElement + replaceChildren!"

> Will: _"Our dataToView function is also CREATING the part of our view — the buckets, the containers."_

### Code mới — 4 phần trong dataToView

Will mô tả code mới với 4 loại operations trong dataToView:

1. **Line 4-5**: `createElement` — tạo input và div!
2. **Line 6-7**: Assign accessor properties (value, oninput)
3. **Line 8-9**: Set content (value = post, textContent = post)
4. **Line 12**: `body.replaceChildren(...)` — add to page!

_"All within dataToView and all CONDITIONAL on underlying state tracked in JavaScript — a single SOURCE OF TRUTH."_

Will về input (luôn hiển thị): _"In line 4, jsInput is gonna ALWAYS display independent of whether post is empty string, 'will', or something else. It displays in ALL possible states of the value of post."_

_"It IS still dependent definitionally on post because it is being created through our dataToView."_

```
CODE STRUCTURE — dataToView() MỚI:
═══════════════════════════════════════════════════════════════

  let post = ""; let jsInput; let jsDiv;

  function dataToView() {
    // ① CREATE elements
    jsInput = document.createElement("input");    // line 4
    jsDiv = post !== "will"
      ? document.createElement("div")             // line 5
      : "";                                        // line 6

    // ② SET content from DATA
    jsInput.value = post;                          // line 8
    if (jsDiv) jsDiv.textContent = post;           // line 9

    // ③ BIND handler
    jsInput.oninput = handleInput;                 // line 10

    // ④ ADD to page
    document.body.replaceChildren(                 // line 12
      jsInput,
      ...(jsDiv ? [jsDiv] : [])
    );
  }

  function handleInput() {
    post = jsInput.value;  // CHỈ DATA!
  }

  setInterval(dataToView, 15);

  "Single source of truth — a single place in which
   the CAUSE of what you see is determined." — Will
```

---

## §3. Schematic — "HTML Parser, Layout, Render, Bitmap!"

> Will: _"The output of the DOM via the layout and render engine is actually an IMAGE of the page 60 times a second — literally a bitmap graphic."_

### Full browser pipeline

Will vẽ schematic đầy đủ:

1. **HTML file** → **HTML parser** → add elements to C++ DOM
2. **C++ DOM** → **Layout engine** → calculate positions
3. **Layout** → **Render engine** → paint pixels
4. **Render** → **Bitmap graphic** 60fps → **Graphics hardware** (GPU!)

_"Literally bitmap graphic that's passed out to wherever it's gonna be displayed by the graphics hardware — the graphics card or graphics processor."_

Quan trọng: HTML chỉ load **script** tag! Không có input/div nữa:

Phil: _"It's gonna be our script element."_ → Will: _"We're just gonna focus on our BODY element, which is there in our DOM by default."_

```
FULL BROWSER PIPELINE:
═══════════════════════════════════════════════════════════════

  HTML FILE:          C++ DOM:            PAGE:
  ┌────────────┐     ┌──────────────┐    ┌──────────────┐
  │ <script    │ ──▶ │ body {}      │ ──▶│              │
  │  src="...">│     │              │    │  (empty!)    │
  │ </script>  │     │              │    │              │
  └────────────┘     └──────────────┘    └──────────────┘
       │                    │                    │
    HTML parser         Layout engine        Bitmap 60fps
    + Web IDL           + Render engine      → GPU!
       │                    │                    │
       ▼                    ▼                    ▼
  "Nowadays, all we load   "Output = IMAGE     "Graphics
   is JavaScript!"          of page, BITMAP!"   hardware!"

  Will: "Output is literally a BITMAP GRAPHIC
         passed to the graphics hardware." 🖥️
```

---

## §4. Justice: document Object — "createElement + body!"

> Justice: _"The Document Object."_
> Will: _"Can you spot which method we're gonna use this time?"_
> Justice: _"Create element."_

### Justice verbalize document setup

Will hỏi Justice:

- _"What is our mission critical object that loads into JavaScript?"_ → Justice: _"The Document Object."_ ✅
- _"Can you spot which function we're gonna use?"_ → Justice (first try): _"Replace children? Line 19, setInterval?"_ → Will: _"Look at line 4 and 6."_ → Justice: _"Create element!"_ ✅

document object có:

- `createElement` — function! (mới!)
- `body` — getter/setter property! (mới!)
- `[[hidden link]]` → C++ DOM

Will giải thích body: _"Our body getter-setter property is gonna know where to go because we have a hidden link to the DOM."_

_"Any of these getter-setters like body or functions like createElement are going to FIRST check where they're accessing in C++."_

```
document OBJECT — MỚI:
═══════════════════════════════════════════════════════════════

  document = {
    [[link]] → C++ DOM (always!)

    createElement: fn  ← MỚI! Tạo C++ element!
    body: getter/setter  ← MỚI! Access body element!
      → body.replaceChildren(...)  ← MỚI!

    querySelector: fn  ← vẫn có! (nhưng không dùng nữa!)
  }

  Justice's journey:
  1st try: "replaceChildren? setInterval?"
  Will: "Look at line 4 and 6!"
  2nd try: "createElement!" ✅

  "These getter-setters and functions FIRST check
   where they're accessing in C++." — Will
```

---

## §5. Three Variables on One Line — "Diagramming, Not Closure!"

> Will: _"This is NOT me initializing multiple variables in a clever one-line way. This is THREE SEPARATE LINES."_

### Will giải thích tại sao global variables

`let post = "", jsInput, jsDiv;` — Will clarify: đây là **3 separate lines** gộp lại cho gọn!

Tại sao global thay vì local (trong dataToView)?

_"The reason I do them here is so that I don't need to deal with my FAVORITE concept in JavaScript — closure. While a wonderful concept, it's gonna be much harder to DIAGRAM."_

_"In practice, we would probably, certainly not put everything in global. But just for diagramming purposes, it lets us easily diagram."_

Justice verbalize:

- `post = ""` (empty string!)
- `jsInput` (uninitialized!)
- `jsDiv` (uninitialized!)

Will về equals sign: _"I never use equals in the memory because equals is a COMMAND to go and assign something. I use colon instead."_ — Nhưng thừa nhận colon cũng có nhược điểm (looks like object property)!

```
THREE VARIABLES — DIAGRAMMING:
═══════════════════════════════════════════════════════════════

  CODE:
  let post = "", jsInput, jsDiv;
  = 3 SEPARATE LINES! (not clever one-liner!)

  MEMORY:
  ┌──────────────────────────────────────────────────────────┐
  │ post: ""          ← empty string!                      │
  │ jsInput: -        ← uninitialized!                     │
  │ jsDiv: -          ← uninitialized!                     │
  └──────────────────────────────────────────────────────────┘

  TẠI SAO GLOBAL?
  ┌──────────────────────────────────────────────────────────┐
  │ ❌ In practice: use local scope + closure!             │
  │ ✅ For diagramming: global = dễ vẽ!                   │
  │                                                          │
  │ "I don't need to deal with CLOSURE.                    │
  │  While wonderful, it's harder to DIAGRAM." — Will      │
  └──────────────────────────────────────────────────────────┘
```

---

## §6. Two Functions — "Converter + Handler!"

> Will: _"One is the 'take the data, display it.' The other is the 'user takes action, pinpoint change some data, and do NOTHING ELSE.'"_

### dataToView + handleInput — two roles!

Will mô tả 2 loại function trong UI:

**dataToView** (converter):

_"Our mega function that's doing ALL of the creation of anything that's gonna be seen by the user, but CONDITIONAL on data in JavaScript."_

_"Wanna work out what the user sees? Go look at the data and go look at the ONE PLACE that pipes it through to the view."_

**handleInput** (handler):

_"The user takes action, pinpoint change some data based off that action, and do NOTHING ELSE."_

Justice verbalize: _"dataToView"_ + _"handleInput"_ → saved to memory!

```
TWO FUNCTION TYPES:
═══════════════════════════════════════════════════════════════

  CONVERTER (data → view):
  ┌──────────────────────────────────────────────────────────┐
  │ dataToView() {                                           │
  │   // create elements                                     │
  │   // set content from data                               │
  │   // bind handlers                                       │
  │   // add to page                                         │
  │ }                                                        │
  │                                                          │
  │ "MEGA function — ALL creation, CONDITIONAL on data."   │
  │ "ONE PLACE that pipes data to view." — Will            │
  └──────────────────────────────────────────────────────────┘

  HANDLER (user → data):
  ┌──────────────────────────────────────────────────────────┐
  │ handleInput() {                                          │
  │   post = jsInput.value;  // CHỈ DATA!                  │
  │ }                                                        │
  │                                                          │
  │ "Pinpoint change some data, do NOTHING ELSE." — Will   │
  └──────────────────────────────────────────────────────────┘
```

---

## §7. setInterval Setup — "Timer Feature, Done!"

> Will: _"I like to draw a line through to make it really clear. That is DONE."_

### Justice verbalize setInterval

Justice:

- _"Set interval."_ → Will: _"Which is going to do what?"_
- _"Take the reference of dataToView."_ ✅
- _"15 milliseconds."_ ✅

Will repeat key points:

_"Implemented somewhere between JavaScript and the browser's C++ environment. But what we DO know is, the waiting for that 15 milliseconds is NOT happening in JavaScript and blocking anything."_

_"That finishes executing. I like to draw a line through to make it really clear — that is DONE."_

→ Sau line này: global code **xong hết**! Chờ 15ms → dataToView callback!

```
setInterval — "DONE!":
═══════════════════════════════════════════════════════════════

  EXECUTION ORDER:
  ┌──────────────────────────────────────────────────────────┐
  │ 1. let post = "", jsInput, jsDiv;      ✅ DONE!       │
  │ 2. function dataToView() { ... }       ✅ SAVED!       │
  │ 3. function handleInput() { ... }      ✅ SAVED!       │
  │ 4. setInterval(dataToView, 15);        ✅ DONE!        │
  │    ────────────── LINE THROUGH ──────────────          │
  │                                                          │
  │ Global code: FINISHED! ✅                               │
  │ Call stack: EMPTY!                                       │
  │                                                          │
  │ Timer (C++): dataToView every 15ms → callback queue!  │
  │ 15ms later: event loop → dataToView() on call stack!  │
  └──────────────────────────────────────────────────────────┘

  Justice: "Take reference of dataToView, 15ms!" ✅
  Will: "I draw a line through — DONE!" ✅
```

---

## §8. Tự Implement: Full Component Setup

```javascript
// ═══════════════════════════════════════════════════
// Mô phỏng — Full UI Component Setup!
// createElement + body.replaceChildren + setInterval!
// ═══════════════════════════════════════════════════

// ── Simplified Browser ──

class CppElement {
  constructor(type) {
    this.type = type;
    this.value = "";
    this.text = "";
    this.handlers = {};
    this.children = [];
  }
}

class Browser {
  constructor() {
    this.dom = { body: new CppElement("body") };
    this.timer = null;
    this.callbackQueue = [];
    this.renderCount = 0;
  }

  // document.createElement
  createElement(type) {
    const el = new CppElement(type);
    console.log(`    📦 createElement("${type}") → C++ element!`);
    return el;
  }

  // document.body.replaceChildren
  replaceChildren(...elements) {
    this.dom.body.children = elements;
    console.log(
      `    🔄 body.replaceChildren(${elements.map((e) => e.type).join(", ")})`,
    );
  }

  // setInterval
  setInterval(fn, ms) {
    console.log(`    ⏱️ setInterval(${fn.name}, ${ms}ms) → Timer set!`);
    this.timer = { fn, ms };
    // Simulate: returns immediately!
    return this.timer;
  }

  // Simulate timer tick
  tick() {
    if (this.timer) {
      this.renderCount++;
      this.timer.fn();
    }
  }

  // Display current page
  display() {
    console.log("    🖥️ Page (body children):");
    if (this.dom.body.children.length === 0) {
      console.log("      (empty!)");
      return;
    }
    for (const el of this.dom.body.children) {
      if (el.type === "input") {
        console.log(`      [${el.value || "___________"}]`);
      } else if (el.type === "div") {
        console.log(`      ${el.text || "(empty div)"}`);
      }
    }
  }
}

// ═══ SETUP ═══

console.log("═══ UI COMPONENT SETUP ═══\n");

const browser = new Browser();

// ── Step 1: HTML loads → only <script>! ──
console.log("── HTML: only <script> (no input, no div!) ──");
console.log("  body element exists by default in DOM.\n");

// ── Step 2: JavaScript runtime starts ──
console.log("── JavaScript Runtime ──\n");

// document object (auto-loaded!)
const doc = {
  createElement: (t) => browser.createElement(t),
  body: {
    replaceChildren: (...args) => browser.replaceChildren(...args),
  },
};

// Line 1: three separate variables!
let post = "";
let jsInput;
let jsDiv;
console.log("  Memory: post='', jsInput=undefined, jsDiv=undefined");

// Line 2-3: save functions (NOT execute!)
function dataToView() {
  jsInput = doc.createElement("input");
  jsInput.value = post;
  jsInput.handlers["input"] = handleInput;

  if (post !== "will") {
    jsDiv = doc.createElement("div");
    jsDiv.text = post;
    doc.body.replaceChildren(jsInput, jsDiv);
  } else {
    jsDiv = "";
    doc.body.replaceChildren(jsInput);
  }
}

function handleInput(typed) {
  post = typed; // CHỈ DATA!
}

console.log("  Saved: dataToView (converter!)");
console.log("  Saved: handleInput (handler!)\n");

// Line 4: setInterval — DONE!
console.log("── setInterval(dataToView, 15) ──");
browser.setInterval(dataToView, 15);
console.log("  ──── LINE THROUGH — DONE! ────");
console.log("  Global code: FINISHED!\n");

// ═══ SIMULATION ═══

console.log("═══ TIMER TICKS ═══\n");

console.log("── Tick 1: t=15ms (initial render!) ──");
browser.tick();
browser.display();

console.log("\n── User types 'hello' at t=1000ms ──");
handleInput("hello");
console.log("  post = 'hello' (data changed!)");

console.log("\n── Tick 2: t=1015ms (auto-render!) ──");
browser.tick();
browser.display();

console.log("\n── User types 'will' at t=2000ms ──");
handleInput("will");
console.log("  post = 'will' (data changed!)");

console.log("\n── Tick 3: t=2015ms (auto-render!) ──");
browser.tick();
browser.display();

console.log("\n── User types 'hi' at t=3000ms ──");
handleInput("hi");

console.log("\n── Tick 4: t=3015ms (div comes back!) ──");
browser.tick();
browser.display();

console.log(`\n  Total renders: ${browser.renderCount}`);
console.log("  ✅ All elements created INSIDE dataToView!");
console.log("  ✅ Handler ONLY changes data!");
console.log("  ✅ Full UI Component! 🎉");
```

---

## §9. 🔬 Deep Analysis Patterns — Component Setup Architecture

### 9.1 Pattern ①: HTML → JS Migration

```
HTML → JS MIGRATION:
═══════════════════════════════════════════════════════════════

  EVOLUTION:

  v1: HTML creates everything!
  ┌──────────────────────────────────────────────────────────┐
  │ HTML: <input value="hi"> <div>hi</div>                 │
  │ JS: (none!)                                              │
  │ → Static! No data binding!                              │
  └──────────────────────────────────────────────────────────┘

  v2: HTML creates elements, JS updates content!
  ┌──────────────────────────────────────────────────────────┐
  │ HTML: <input> <div></div>                               │
  │ JS: jsInput.value = post; jsDiv.textContent = post;    │
  │ → Dynamic content! But static structure!               │
  └──────────────────────────────────────────────────────────┘

  v3: JS creates EVERYTHING!
  ┌──────────────────────────────────────────────────────────┐
  │ HTML: <script>                                          │
  │ JS: createElement("input"); createElement("div");      │
  │     body.replaceChildren(input, div);                    │
  │ → Dynamic content AND structure! ✅                    │
  │ → "Full UI Component!" — Will                          │
  └──────────────────────────────────────────────────────────┘
```

### 9.2 Pattern ②: Why Closure Avoidance (Pedagogy!)

```
CLOSURE AVOIDANCE — PEDAGOGY:
═══════════════════════════════════════════════════════════════

  REAL CODE (with closure):
  ┌──────────────────────────────────────────────────────────┐
  │ function createApp() {                                   │
  │   let post = "";  ← local! Closed over!               │
  │   let jsInput;    ← local! Closed over!                │
  │                                                          │
  │   function dataToView() {                                │
  │     // accesses post via CLOSURE!                       │
  │   }                                                      │
  │   function handleInput() {                               │
  │     // accesses post via CLOSURE!                       │
  │   }                                                      │
  │ }                                                        │
  │ → Harder to diagram! Must show [[scope]]!              │
  └──────────────────────────────────────────────────────────┘

  WILL's CODE (global for diagrams):
  ┌──────────────────────────────────────────────────────────┐
  │ let post = "";   ← global! Easy to point to!           │
  │ let jsInput;     ← global! Easy to point to!           │
  │                                                          │
  │ function dataToView() {                                  │
  │   // accesses post from GLOBAL! Simple!                │
  │ }                                                        │
  │ → "In practice, certainly not. But for DIAGRAMMING..." │
  └──────────────────────────────────────────────────────────┘
```

---

## Self-Assessment Checklist

```
CHECKLIST — SAU KHI HỌC PHẦN 27:
═══════════════════════════════════════════════════════════════

  ELEMENT CREATION IN dataToView:
  [ ] HTML chỉ load <script>! Không input/div!
  [ ] createElement INSIDE dataToView!
  [ ] body.replaceChildren(...) add to page!
  [ ] "Single source of truth!" — Will

  SCHEMATIC:
  [ ] HTML parser → C++ DOM → Layout → Render → Bitmap!
  [ ] Output = bitmap graphic 60fps → GPU!
  [ ] body element exists by default!

  document OBJECT:
  [ ] createElement — tạo C++ element!
  [ ] body — getter/setter to body element!
  [ ] body.replaceChildren — add/replace children!

  GLOBAL VARIABLES:
  [ ] post, jsInput, jsDiv — 3 separate lines!
  [ ] Global for DIAGRAMMING (not production!)
  [ ] "Don't need to deal with closure!" — Will

  TWO FUNCTIONS:
  [ ] dataToView = converter (data → view!)
  [ ] handleInput = handler (user → data!)
  [ ] "One pipes data to view, other pinpoints data change!"

  setInterval:
  [ ] "Line through — DONE!" Not on call stack!
  [ ] Timer feature, not blocking JS!
  [ ] 15ms → callback queue → call stack!

  TIẾP THEO → Phần 28: Walking Through UI Component!
```
