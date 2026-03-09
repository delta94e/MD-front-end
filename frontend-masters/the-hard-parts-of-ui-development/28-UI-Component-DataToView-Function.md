# The Hard Parts of UI Development — Phần 28: UI Component dataToView Function — "createElement + replaceChildren Walkthrough!"

> 📅 2026-03-08 · ⏱ 40 phút đọc
>
> Nguồn: Frontend Masters — Will Sentance
> Khoá học: The Hard Parts of UI Development
> Bài: UI Component dataToView Function — "Alexa: createElement, Ternary, replaceChildren, Focus Edge Case!"
> Độ khó: ⭐️⭐️⭐️⭐️⭐️ | Advanced — createElement internals, unattached elements, ternary conditional, focus() method, replaceChildren walkthrough!

---

## Mục Lục

| #   | Phần                                                             |
| --- | ---------------------------------------------------------------- |
| 1   | dataToView Callback — "Alexa: Queue → Stack → Execute!"          |
| 2   | createElement("input") — "Unattached, Not Yet Displayed!"        |
| 3   | Visual Representation Teaser — "Wouldn't That Be Cool?"          |
| 4   | Ternary Conditional — "Post !== 'will'? Create div!"             |
| 5   | Mark's Question — "replaceChildren Loses Focus!"                 |
| 6   | focus() Method — "One Line to Fix!"                              |
| 7   | Will's Pedagogy — "Minimize, Minimize Code!"                     |
| 8   | Content Setting + Handler Binding — "Alexa: Value, Text, Input!" |
| 9   | replaceChildren Walkthrough — "Body → Input + Div → Pixels!"     |
| 10  | Tự Implement: createElement + replaceChildren Full Cycle         |
| 11  | 🔬 Deep Analysis Patterns — Imperative vs Declarative Creation   |

---

## §1. dataToView Callback — "Alexa: Queue → Stack → Execute!"

> Alexa: _"dataToView goes in the callback queue. Event loop checks if global code is done, which it IS. Call stack is empty, which it IS. Pop it off the queue and push it onto the call stack."_

### 15ms → callback queue → call stack!

Alexa verbalize hoàn hảo:

1. _"dataToView goes into the callback queue."_
2. _"Event loop checks if global code is done — which it IS."_
3. _"Call stack is empty — which it IS."_
4. _"Pop dataToView off the callback queue and push it onto the call stack."_

Will: _"Onto the call stack, and that is where it's gonna create a new execution context."_

Will mô tả dataToView: _"It's a BIG OLD function here. Because we're now doing anything that the user can see — produced inside this function. And ONLY produced if the user is gonna see it in that moment."_

```
dataToView CALLBACK — ALEXA's WALKTHROUGH:
═══════════════════════════════════════════════════════════════

  t=0ms:    setInterval(dataToView, 15) → DONE!
  t=15ms:   Timer fires! 🔔

  STEP 1: Callback queue
  ┌──────────────────────────────────────────────────────────┐
  │ callback queue: [dataToView]                             │
  │ Alexa: "dataToView goes in the callback queue."        │
  └──────────────────────────────────────────────────────────┘

  STEP 2: Event loop checks
  ┌──────────────────────────────────────────────────────────┐
  │ Global code done? ✅ YES!                               │
  │ Call stack empty? ✅ YES!                                │
  │ Alexa: "Event loop checks — which it IS."              │
  └──────────────────────────────────────────────────────────┘

  STEP 3: Execute!
  ┌──────────────────────────────────────────────────────────┐
  │ call stack: [dataToView]                                 │
  │ → New execution context! 📦                             │
  │ Alexa: "Pop off queue, push onto call stack."          │
  └──────────────────────────────────────────────────────────┘
```

---

## §2. createElement("input") — "Unattached, Not Yet Displayed!"

> Alexa: _"First we use the document object's hidden link to find the DOM. Then we create an element of type input."_
> Will: _"It's not yet APPENDED to the body. JavaScript doesn't know where we want to put that element."_

### createElement = tạo nhưng CHƯA hiển thị!

Alexa verbalize createElement:

1. _"Reassign jsInput to the evaluated result of invoking createElement on the document object."_
2. _"With the string 'input'."_
3. _"First, use the document object's hidden link to find the DOM."_
4. _"Then create an element of type input."_

Will nhấn mạnh: element **unattached**!

_"It's not yet on our appended list of elements. It's not yet appended to body, because JavaScript doesn't know WHERE we want to put that element."_

So sánh HTML vs JS:

- **HTML**: listing order = display order (declarative!)
- **JS**: createElement → element floating → MUST manually attach (imperative!)

_"In HTML, we have a structure — it appears in listed order down the page. NOT in JavaScript, we don't know where."_

```
createElement — UNATTACHED:
═══════════════════════════════════════════════════════════════

  document.createElement("input"):

  STEP 1: Hidden link → C++ DOM
  ┌──────────────────────────────────────────────────────────┐
  │ document.[[link]] → C++ DOM                            │
  │ Alexa: "Use hidden link to find the DOM."              │
  └──────────────────────────────────────────────────────────┘

  STEP 2: Create C++ object (UNATTACHED!)
  ┌──────────────────────────────────────────────────────────┐
  │ C++ DOM:                                                 │
  │ body: { children: [] }   ← EMPTY!                     │
  │                                                          │
  │ input { value: "" }      ← CREATED but UNATTACHED!    │
  │ → Not in body.children!                                │
  │ → Not displayed!                                        │
  └──────────────────────────────────────────────────────────┘

  STEP 3: Return JS accessor
  ┌──────────────────────────────────────────────────────────┐
  │ jsInput = {                                              │
  │   [[link]] → C++ input (unattached!)                   │
  │   value: getter/setter                                   │
  │   oninput: setter                                        │
  │ }                                                        │
  │ Alexa: "JS object with hidden link to that             │
  │         new input node." ✅                              │
  └──────────────────────────────────────────────────────────┘

  HTML: "Listed order = display order" (declarative!)
  JS: "Must MANUALLY attach" (imperative!)
```

---

## §3. Visual Representation Teaser — "Wouldn't That Be Cool?"

> Will: _"We could describe them in full in JavaScript first. And maybe end up with a VISUAL representation of our DOM in JavaScript — which would be kind of cool, kind of neat."_

### Will tease Virtual DOM!

Will nhận ra: vì tất cả elements tạo trong JS → ta có thể **mô tả** chúng trước khi add to page!

_"It means we could potentially describe in full as an intermediate step. Before we actually add those elements to the page, we could describe them in full in JavaScript first."_

_"And maybe end up with a visual representation of our DOM in JavaScript first, which would be kind of cool, kind of neat."_

→ Đây chính là **Virtual DOM** preview! Will tease nhưng chưa reveal!

Và so sánh: HTML = declarative (showed where it is). JS = imperative (must describe location):

_"With JavaScript we're gonna have to IMPERATIVELY describe where it's located on the page. If only we could do better — HOPEFULLY we will."_

```
VIRTUAL DOM TEASER:
═══════════════════════════════════════════════════════════════

  CURRENT (imperative JS):
  ┌──────────────────────────────────────────────────────────┐
  │ createElement("input")  → C++ element (imperative!)    │
  │ createElement("div")    → C++ element (imperative!)    │
  │ replaceChildren(...)    → attach (imperative!)          │
  │                                                          │
  │ → Must DESCRIBE where to attach!                       │
  │ → No intermediate visual representation!               │
  └──────────────────────────────────────────────────────────┘

  WILL's TEASE (virtual DOM!):
  ┌──────────────────────────────────────────────────────────┐
  │ "DESCRIBE them in full in JavaScript FIRST."            │
  │ "A VISUAL REPRESENTATION of our DOM in JavaScript."    │
  │ "Kind of cool, kind of NEAT." — Will 😏                │
  │                                                          │
  │ → Virtual DOM = JS description of page!                │
  │ → Before adding to real DOM!                            │
  │ → Coming soon... 🔜                                    │
  └──────────────────────────────────────────────────────────┘
```

---

## §4. Ternary Conditional — "Post !== 'will'? Create div!"

> Alexa: _"Check the first bit before the question mark. If true, assign the second bit. If false, assign the last part."_
> Will: _"Post is an empty string, it is NOT 'will'. So we jump to creating a div."_

### jsDiv = post !== "will" ? createElement("div") : ""

Alexa verbalize ternary:

- _"First bit: post !== 'will'?"_ → Will: _"Post is empty string, not 'will'."_
- _"True → assign second bit"_ → `createElement("div")`!
- _"False → assign last part"_ → `""` (empty string!)

Will: element chỉ tạo khi data cho phép!

_"We've switched our mindset from 'assuming we'll always have a div from HTML, then remove it based on data' to 'ONLY creating elements, only determining what the user sees, based on EXPLICITLY defined data in JavaScript.'"_

Alexa verbalize output: _"JavaScript object with a hidden link to that new unattached div node. All the properties and getter-setters that go with a div type."_ — Including textContent!

```
TERNARY CONDITIONAL:
═══════════════════════════════════════════════════════════════

  jsDiv = post !== "will" ? document.createElement("div") : ""

  post = "" (empty string):
  ┌──────────────────────────────────────────────────────────┐
  │ "" !== "will" → TRUE! ✅                                │
  │ → document.createElement("div")                        │
  │ → C++ div created (unattached!)                        │
  │ → jsDiv = { [[link]] → div, textContent: g/s }       │
  └──────────────────────────────────────────────────────────┘

  post = "will":
  ┌──────────────────────────────────────────────────────────┐
  │ "will" !== "will" → FALSE! ❌                           │
  │ → jsDiv = "" (empty string!)                           │
  │ → No div created! No div on page!                      │
  └──────────────────────────────────────────────────────────┘

  "ONLY creating elements based on EXPLICITLY defined
   data in JavaScript. That is our source of truth." — Will
```

---

## §5. Mark's Question — "replaceChildren Loses Focus!"

> Mark: _"When replaceChildren executes every 15 milliseconds, will the new input element lose focus?"_
> Will: _"GREAT question. Absolutely."_

### replaceChildren = NEW element mỗi 15ms → mất focus!

Mark phát hiện bug nghiêm trọng: mỗi 15ms, dataToView tạo **brand new** input element → replaceChildren thay thế old input → user's cursor **biến mất**!

Will: _"Absolutely. And that is a line of code that I don't include here."_

Problem: `createElement("input")` = **NEW C++ object** mỗi lần! Không phải update existing!

→ User đang gõ → 15ms → input mới (trống!) thay thế → cursor mất → user bối rối!

```
MARK's QUESTION — FOCUS LOSS:
═══════════════════════════════════════════════════════════════

  EVERY 15ms:
  ┌──────────────────────────────────────────────────────────┐
  │ t=0ms:   input_1 created → user sees [___]             │
  │ t=0ms:   user clicks → cursor IN input_1! ✅          │
  │ t=5ms:   user types "H" → input_1.value = "H"         │
  │ t=15ms:  dataToView() → input_2 created (NEW!)        │
  │          → replaceChildren(input_2) → input_1 gone!   │
  │          → input_2 has value "H" (from data!)          │
  │          → BUT cursor NOT in input_2! ❌                │
  │          → User's cursor DISAPPEARED! 😱               │
  │ t=30ms:  input_3 created → same problem!               │
  └──────────────────────────────────────────────────────────┘

  Mark: "Will the new input lose FOCUS?"
  Will: "GREAT question. ABSOLUTELY." 🎯
```

---

## §6. focus() Method — "One Line to Fix!"

> Will: _"We will need to call the focus method — jsInput.focus(). That will insert the user's cursor in that brand new every-15-millisecond-created input field."_

### jsInput.focus() — giải pháp đơn giản!

Will: chỉ cần thêm 1 dòng: `jsInput.focus()` sau replaceChildren!

_"If we're recreating our input element on the DOM every 15 milliseconds, it's a BRAND NEW element. We default to NOT being focused."_

_"Focus means the cursor of the user is IN that input field. We're gonna need to call the focus method."_

Tại sao Will KHÔNG include trong code? Pedagogy!

_"Same spot as just a second ago. My job in Hard Parts is to REMOVE anything that is extraneous — in order to only keep the pieces that give us the ability to build out the mental model."_

_"The diagramming is tedious. But it means you're NEVER gonna forget this mental model."_

Will thừa nhận: _"This is the one where this WOULDN'T FUNCTION without it."_ — focus() là **must-have**, nhưng bỏ vì diagramming!

```
focus() — ONE LINE FIX:
═══════════════════════════════════════════════════════════════

  function dataToView() {
    jsInput = document.createElement("input");
    jsInput.value = post;
    jsInput.oninput = handleInput;
    // ...div creation...
    document.body.replaceChildren(jsInput, jsDiv);
    jsInput.focus();  // ← ONE LINE! Cursor back! ✅
  }

  TẠI SAO BỎ TRONG LESSON:
  ┌──────────────────────────────────────────────────────────┐
  │ "My job in Hard Parts is to REMOVE anything             │
  │  that is EXTRANEOUS." — Will                             │
  │                                                          │
  │ "The diagramming is tedious. But you're NEVER           │
  │  gonna forget this mental model." — Will                │
  │                                                          │
  │ "This is the one where it WOULDN'T FUNCTION             │
  │  without it." — Will (acknowledging!)                    │
  └──────────────────────────────────────────────────────────┘
```

---

## §7. Will's Pedagogy — "Minimize, Minimize Code!"

> Will: _"Every chance I have to REMOVE a conditional, remove a line... for diagramming purposes, MINIMIZE minimze code."_

### "As long as it doesn't break!"

Will giải thích philosophy giảng dạy:

_"There'll be a few places where we'll be like, this WORKS, the user's experience is correct. But would you ACTUALLY do that? You wouldn't."_

Ví dụ:

- Gọi `.textContent` trên element **không cần** textContent → vô hại!
- Gọi `.textContent` trên element **không có** textContent → lỗi!
- Bỏ conditional checks → giảm code → dễ diagram!

_"Know that there'll be a few places where we do it for the purposes of minimizing complexity on already-tedious diagrams."_

```
PEDAGOGY — MINIMIZE:
═══════════════════════════════════════════════════════════════

  REAL CODE (production):
  ┌──────────────────────────────────────────────────────────┐
  │ if (jsDiv instanceof Element) {                         │
  │   jsDiv.textContent = post;  // ← conditional!        │
  │ }                                                        │
  │ jsInput.focus();             // ← MUST have!           │
  └──────────────────────────────────────────────────────────┘

  WILL's CODE (pedagogy):
  ┌──────────────────────────────────────────────────────────┐
  │ jsDiv.textContent = post;    // ← no conditional!     │
  │ // jsInput.focus();          // ← omitted!             │
  │                                                          │
  │ "As long as it doesn't LITERALLY BREAK" — Will         │
  │ "Minimize minimize code" — Will                        │
  └──────────────────────────────────────────────────────────┘
```

---

## §8. Content Setting + Handler Binding — "Alexa: Value, Text, Input!"

> Alexa: _"We're gonna use the value setter property on jsInput to find the linked input node on the DOM. And set the value to post, which is an empty string."_

### Alexa verbalize 3 steps nhanh gọn!

**Line 8** — jsInput.value = post:

Alexa: _"Use the value setter on jsInput to find the linked input node. Set value to post — empty string."_

**Line 9** — jsDiv.textContent = post:

Alexa: _"Same for the text content on the div."_ → Will: _"Text is empty string, value is also empty string."_

**Line 11** — jsInput.oninput = handleInput:

Alexa: _"Set the oninput callback function on our input to our handleInput function."_ → Will yêu cầu verbalize thêm → Alexa mô tả: input handler sẽ được set to reference of handleInput!

Will hài hước: _"If you can verbalize that as much as possible, just so there is some lovely BACKGROUND NOISE."_ 😂 Rồi ngay lập tức xin lỗi: _"I apologize for my anything-but-endorsement of the wonderful technical communication!"_

```
CONTENT SETTING + HANDLER BINDING:
═══════════════════════════════════════════════════════════════

  LINE 8: jsInput.value = post
  ┌──────────────────────────────────────────────────────────┐
  │ → jsInput.[[link]] → C++ input                        │
  │ → .value setter → input.value = ""                     │
  │ Alexa: "Value setter to find linked input node." ✅    │
  └──────────────────────────────────────────────────────────┘

  LINE 9: jsDiv.textContent = post
  ┌──────────────────────────────────────────────────────────┐
  │ → jsDiv.[[link]] → C++ div                            │
  │ → .textContent setter → div.text = ""                  │
  │ Alexa: "Same for text content on the div." ✅          │
  └──────────────────────────────────────────────────────────┘

  LINE 11: jsInput.oninput = handleInput
  ┌──────────────────────────────────────────────────────────┐
  │ → jsInput.[[link]] → C++ input                        │
  │ → .oninput setter → input.handler = handleInput ref   │
  │ Alexa: "Set oninput callback to handleInput." ✅       │
  └──────────────────────────────────────────────────────────┘
```

---

## §9. replaceChildren Walkthrough — "Body → Input + Div → Pixels!"

> Alexa: _"Find the body property/getter-setter on the document object, then invoke replaceChildren with jsInput and jsDiv."_
> Will: _"We have displayed everything through ONE FUNCTION, no mysteries, and all conditional on our underlying state."_

### Alexa verbalize replaceChildren!

Alexa (từng bước):

1. _"Find our document object in JavaScript memory."_
2. _"Find the body property/getter-setter on that object."_
3. _"Invoke the replaceChildren method there."_
4. _"Pass in jsInput and jsDiv."_

Will giải thích body.replaceChildren:

- `body` has link to C++ body element
- `jsInput` has link to C++ input element (unattached!)
- `jsDiv` has link to C++ div element (unattached!)
- `replaceChildren(jsInput, jsDiv)` → **attach** both as children of body!
- Layout + render engines → **pixels** on page!

Will: _"Right now body doesn't have any children. We're going to replace its children with jsInput's linked input DOM element and jsDiv's linked div element."_

Alexa confirm: _"Our input and our div!"_ → Will: _"Automatically, because of our layout and render engines. AMAZING."_

```
replaceChildren — FULL WALKTHROUGH:
═══════════════════════════════════════════════════════════════

  document.body.replaceChildren(jsInput, jsDiv):

  BEFORE:
  ┌──────────────────────────────────────────────────────────┐
  │ C++ DOM:                                                 │
  │ body: { children: [] }   ← EMPTY!                     │
  │                                                          │
  │ input: { value: "" }     ← UNATTACHED!                 │
  │ div: { text: "" }        ← UNATTACHED!                 │
  └──────────────────────────────────────────────────────────┘

  AFTER:
  ┌──────────────────────────────────────────────────────────┐
  │ C++ DOM:                                                 │
  │ body: {                                                  │
  │   children: [                                            │
  │     input → { value: "" }     ← ATTACHED! ✅          │
  │     div → { text: "" }        ← ATTACHED! ✅          │
  │   ]                                                      │
  │ }                                                        │
  │         │                                                │
  │         ▼ Layout + Render                                │
  │    ┌──────────────────────┐                              │
  │    │ [_______________]    │ ← input!                    │
  │    │                      │ ← div (empty!)              │
  │    └──────────────────────┘                              │
  └──────────────────────────────────────────────────────────┘

  Will: "Displayed EVERYTHING through ONE function,
         no mysteries, all conditional on state." 🎉
```

---

## §10. Tự Implement: createElement + replaceChildren Full Cycle

```javascript
// ═══════════════════════════════════════════════════
// Mô phỏng — createElement + replaceChildren Full Cycle!
// Alexa's walkthrough reproduced in code!
// ═══════════════════════════════════════════════════

// ── C++ DOM ──

class CppEl {
  constructor(type) {
    this.type = type;
    this.value = "";
    this.text = "";
    this.handlers = {};
    this.focused = false;
  }
}

class CppBody {
  constructor() {
    this.children = [];
  }

  replaceChildren(...els) {
    const old = this.children.map((e) => e.type);
    this.children = els.filter((e) => e instanceof CppEl);
    const names = this.children.map((e) => e.type).join(", ");
    if (old.length === 0) {
      console.log(`  📦 body.replaceChildren(${names}) — FIRST ADD!`);
    } else {
      console.log(`  🔄 body.replaceChildren(${names}) — REPLACE!`);
    }
  }
}

// ── document object ──

const cppBody = new CppBody();

const doc = {
  _link: "→ C++ DOM",

  createElement(type) {
    const el = new CppEl(type);
    console.log(`  📦 createElement("${type}") → unattached C++ element!`);
    return el;
  },

  body: {
    _link: "→ C++ body element",
    replaceChildren(...els) {
      cppBody.replaceChildren(...els);
    },
  },
};

// ── JS accessor factory ──

function makeAccessor(el) {
  return {
    get value() {
      return el.value;
    },
    set value(v) {
      el.value = v;
      console.log(`  ✏️ input.value = "${v}" (setter → C++!)`);
    },
    get textContent() {
      return el.text;
    },
    set textContent(v) {
      el.text = v === undefined ? "" : String(v);
      console.log(`  ✏️ div.textContent = "${el.text}" (setter → C++!)`);
    },
    set oninput(fn) {
      el.handlers["input"] = fn;
      console.log(`  🔗 input.oninput = ${fn.name} (handler bound!)`);
    },
    focus() {
      el.focused = true;
      console.log(`  🎯 input.focus() — cursor inserted!`);
    },
    _el: el,
  };
}

// ═══ UI COMPONENT ═══

let post = "";
let jsInput;
let jsDiv;

function dataToView() {
  console.log("\n── dataToView() — execution context! ──");

  // Line 4: createElement("input")
  const inputEl = doc.createElement("input");
  jsInput = makeAccessor(inputEl);

  // Line 5-6: ternary
  if (post !== "will") {
    const divEl = doc.createElement("div");
    jsDiv = makeAccessor(divEl);
  } else {
    jsDiv = "";
    console.log('  📭 post === "will" → NO div created!');
  }

  // Line 8: value = post
  jsInput.value = post;

  // Line 9: textContent = post (if div exists!)
  if (jsDiv && typeof jsDiv !== "string") {
    jsDiv.textContent = post;
  }

  // Line 11: oninput = handleInput
  jsInput.oninput = handleInput;

  // Line 12: replaceChildren
  if (jsDiv && typeof jsDiv !== "string") {
    doc.body.replaceChildren(inputEl, jsDiv._el);
  } else {
    doc.body.replaceChildren(inputEl);
  }

  // Focus fix!
  jsInput.focus();
}

function handleInput(typed) {
  post = typed;
  console.log(`\n  🩷 handleInput: post = "${typed}" (CHỈ DATA!)`);
}

// ═══ DEMO ═══

console.log("═══ UI COMPONENT — FULL CYCLE ═══");

console.log("\n══ t=15ms: INITIAL RENDER ══");
dataToView();
console.log("  🖥️ Page: [___] + (empty div)");

console.log("\n══ t=1000ms: USER TYPES 'hello' ══");
handleInput("hello");
dataToView();
console.log('  🖥️ Page: [hello] + "hello"');

console.log("\n══ t=2000ms: USER TYPES 'will' ══");
handleInput("will");
dataToView();
console.log("  🖥️ Page: [will] (NO DIV!)");

console.log("\n══ t=3000ms: USER TYPES 'hi' ══");
handleInput("hi");
dataToView();
console.log('  🖥️ Page: [hi] + "hi" (div BACK!)');

console.log("\n═══ SUMMARY ═══");
console.log("  ✅ Elements created EACH TIME from data!");
console.log("  ✅ Ternary: div only when post !== 'will'!");
console.log("  ✅ Handler ONLY changes data!");
console.log("  ✅ focus() restores cursor each render!");
console.log("  ✅ replaceChildren = attach to body!");
console.log('  ✅ "ONE function, NO mysteries!" — Will 🎉');
```

---

## §11. 🔬 Deep Analysis Patterns — Imperative vs Declarative Creation

### 11.1 Pattern ①: HTML Implicit vs JS Explicit

```
HTML IMPLICIT vs JS EXPLICIT:
═══════════════════════════════════════════════════════════════

  HTML (implicit — always true!):
  ┌──────────────────────────────────────────────────────────┐
  │ <input>  → input EXISTS (implicit true!)               │
  │ <div>    → div EXISTS (implicit true!)                 │
  │                                                          │
  │ → To remove: handler calls remove() (ad-hoc!)         │
  │ → To re-add: ??? (complicated!) 😤                    │
  └──────────────────────────────────────────────────────────┘

  JS (explicit — data-driven!):
  ┌──────────────────────────────────────────────────────────┐
  │ createElement("input")  → only if data says so!        │
  │ createElement("div")    → only if post !== "will"!     │
  │                                                          │
  │ → To remove: don't create! (natural!)                  │
  │ → To re-add: create again! (natural!)                  │
  │ → "SWITCHED mindset" — Will ✅                        │
  └──────────────────────────────────────────────────────────┘
```

### 11.2 Pattern ②: Recreate vs Update Trade-off

```
RECREATE vs UPDATE:
═══════════════════════════════════════════════════════════════

  RECREATE (current approach):
  ┌──────────────────────────────────────────────────────────┐
  │ Every 15ms: NEW elements from scratch!                  │
  │                                                          │
  │ PRO: Simple! Predictable! Data-driven!                  │
  │ CON: Loses focus! Loses scroll position!                │
  │ CON: Performance at 1000 elements!                      │
  │ FIX: focus() method (one line!)                         │
  └──────────────────────────────────────────────────────────┘

  UPDATE (optimization — coming!):
  ┌──────────────────────────────────────────────────────────┐
  │ Every 15ms: DIFF old vs new → update ONLY changes!    │
  │                                                          │
  │ PRO: Keeps focus! Keeps scroll! Performance!            │
  │ CON: More complex! Need diff algorithm!                 │
  │ → This is VIRTUAL DOM! (coming soon!) 🔜              │
  └──────────────────────────────────────────────────────────┘
```

---

## Self-Assessment Checklist

```
CHECKLIST — SAU KHI HỌC PHẦN 28:
═══════════════════════════════════════════════════════════════

  dataToView CALLBACK:
  [ ] Timer → callback queue → event loop → call stack!
  [ ] Alexa: "Pop off queue, push onto stack!" ✅
  [ ] New execution context!

  createElement:
  [ ] Creates C++ element (UNATTACHED!)
  [ ] Returns JS accessor with hidden link!
  [ ] "JS doesn't know WHERE to put it!" — Will

  VIRTUAL DOM TEASER:
  [ ] "Describe in full in JS FIRST!"
  [ ] "Visual representation — cool, neat!" — Will
  [ ] Coming soon... 🔜

  TERNARY:
  [ ] post !== "will" → create div!
  [ ] post === "will" → jsDiv = "" (no div!)
  [ ] "ONLY creating based on explicit data!" — Will

  FOCUS LOSS:
  [ ] Mark: "replaceChildren loses focus!" 🎯
  [ ] Will: "Absolutely! Great question!"
  [ ] Fix: jsInput.focus() — one line!
  [ ] Omitted for pedagogy (minimize code!)

  replaceChildren:
  [ ] body has NO children → ADD!
  [ ] body has children → REPLACE!
  [ ] "Everything through ONE function!" — Will

  TIẾP THEO → Phần 29: User Interaction with UI Component!
```
