# The Hard Parts of UI Development — Phần 35: Composable Code with Map and Spread — "Alexa: Full Diagram, 3 Elements, Event Object!"

> 📅 2026-03-08 · ⏱ 35 phút đọc
>
> Nguồn: Frontend Masters — Will Sentance
> Khoá học: The Hard Parts of UI Development
> Bài: Composable Code with Map and Spread — "Phil: Setup, Alexa: createVDOM → map(convert) → spread → replaceChildren!"
> Độ khó: ⭐️⭐️⭐️⭐️⭐️ | Advanced — 3-element VDOM, map(convert), elems array, spread, event object intro, hoisting note!

---

## Mục Lục

| #   | Phần                                                         |
| --- | ------------------------------------------------------------ |
| 1   | Bối Cảnh — "Element Flexible, Composable!"                   |
| 2   | Phil: Setup — "document, name, VDOM, elems, Functions!"      |
| 3   | Event Object — "No More jsInput Label!"                      |
| 4   | Hoisting Note — "Function Keyword = Available Anywhere!"     |
| 5   | setInterval(updateDOM, 15) — "Phil: 15ms!"                   |
| 6   | Alexa: createVDOM — "3 Sub-Arrays, Input + Div + Div!"       |
| 7   | Alexa: map(convert) — "Hit Each Element One by One!"         |
| 8   | Alexa: convert(VDOM[0]) — "createElement + value + handler!" |
| 9   | By Analogy — "VDOM[1]: Div Hello, VDOM[2]: Div Great Job!"   |
| 10  | Alexa: spread + replaceChildren — "3 Elements on Page!"      |
| 11  | Tự Implement: 3-Element map + spread Pipeline                |
| 12  | 🔬 Deep Analysis — Composability                             |

---

## §1. Bối Cảnh — "Element Flexible, Composable!"

> Will: _"We are now gonna be element FLEXIBLE. I could have ten great jobs — great job Phil, great job Alexa, great job Metric... I can just LIST THEM OUT."_

### Từ 2 elements → N elements!

Will: _"They will ALL be converted into DOM elements via my map that's going to run convert on EVERY one of them."_

_"This is gonna be a FLEXIBLE virtual visual JavaScript DOM."_

Code mới thêm **element thứ 3**: `["div", "great job"]` → total 3 elements!

```
COMPOSABLE — ANY NUMBER:
═══════════════════════════════════════════════════════════════

  createVDOM() = [
    ["input", name, handle],     ← element 0
    ["div", `Hello, ${name}!`],  ← element 1
    ["div", "great job"],        ← element 2 (NEW!)
  ]

  → map(convert) handles ALL OF THEM!
  → "I can just LIST them out!" — Will 🎉
```

---

## §2. Phil: Setup — "document, name, VDOM, elems, Functions!"

> Phil: _"We get the document object. Declare name to empty string. VDOM uninitialized. elems variable."_

### Phil verbalize setup đầy đủ!

Phil:

1. _"We get the document DOM."_ → Will: _"Linked through hidden property to our DOM."_
2. `name = ""` (empty string!)
3. `VDOM` (uninitialized!)
4. `elems` (uninitialized!) ← **MỚI!** thay thế jsInput/jsDiv!

Will explains elems: _"Now when we are mapping, we are NOT gonna be generating jsInput from index 0, jsDiv from index 1. We are gonna be GENERIC — all accessor objects added to an array."_

_"elems will be as big as the number of elements we've described in our VDOM — here it's gonna be THREE."_

Functions:

- Phil: `createVDOM` — visual description!
- Phil: `handle` — user action → data!
- Phil: `updateDOM` — orchestrator!
- Phil: `convert` — array → DOM element!

```
MEMORY LAYOUT:
═══════════════════════════════════════════════════════════════

  ┌──────────────────────────────────────────────────────────┐
  │ document: { createElement, body } → [[link]] to DOM   │
  │                                                          │
  │ name: ""       ← DATA!                                 │
  │ VDOM: -        ← will hold 3 sub-arrays!              │
  │ elems: -       ← will hold 3 accessor objects! NEW!   │
  │                                                          │
  │ createVDOM: fn                                           │
  │ handle: fn     ← now uses EVENT OBJECT!               │
  │ convert: fn                                              │
  │ updateDOM: fn                                            │
  └──────────────────────────────────────────────────────────┘

  "elems is GENERIC — as big as the number
   of elements in VDOM!" — Will
```

---

## §3. Event Object — "No More jsInput Label!"

> Will: _"Once we are no longer giving individual labels in JavaScript to our input element on the DOM, it might be easier to use the EVENT OBJECT."_

### Tại sao cần event object?

Trước đây: `handle()` dùng `jsInput.value` để lấy value → cần label `jsInput`!

Bây giờ: **không có jsInput label** nữa! Tất cả nằm trong `elems` array!

→ Dùng **event object**: `e.target.value` → lấy value từ element triggered event!

Will: _"The event object gives us ALL the information about the user's action."_

```
EVENT OBJECT — WHY?
═══════════════════════════════════════════════════════════════

  BEFORE (individual labels):
  ┌──────────────────────────────────────────────────────────┐
  │ let jsInput = convert(VDOM[0]);  ← has label!         │
  │ function handle() {                                      │
  │   name = jsInput.value;  ← access via label!          │
  │ }                                                        │
  └──────────────────────────────────────────────────────────┘

  AFTER (generic elems):
  ┌──────────────────────────────────────────────────────────┐
  │ const elems = VDOM.map(convert);  ← no individual!    │
  │ function handle(e) {                                     │
  │   name = e.target.value;  ← access via event! ✅     │
  │ }                                                        │
  │ "Event object gives us ALL the info!" — Will           │
  └──────────────────────────────────────────────────────────┘
```

---

## §4. Hoisting Note — "Function Keyword = Available Anywhere!"

> Will: _"We use the function keyword — we get this HOISTING notion that ensures all function definitions are available immediately, even ABOVE where they're defined."_

### Will nhắc: hoisting = design tradition!

Will: _"You will notice we sometimes call functions BEFORE they're defined. Because we use the function keyword, we get hoisting."_

_"It's a design tradition from JavaScript. It's up to somebody whether they use it."_

→ Trong code này không dùng hoisting, nhưng sẽ dùng sau!

---

## §5. setInterval(updateDOM, 15) — "Phil: 15ms!"

> Phil: _"Execute setInterval, passing updateDOM function definition and the number 15."_

Phil verbalize:

- _"Passing updateDOM function definition as first argument."_
- _"The number 15 to denote 15 milliseconds."_

Will: _"We find out the rules of setInterval on MDN, or ChatGPT, or GitHub Copilot."_ 😂

→ Timer set! Global code done! Call stack empty!

---

## §6. Alexa: createVDOM — "3 Sub-Arrays!"

> Alexa: _"First one: string 'input', empty string, handle function definition. Next: string 'div', string 'Hello, !'. Next: string 'div', string 'great job'."_

### 15ms → updateDOM → createVDOM!

Phil: _"15 milliseconds later, updateDOM callback function is introduced to our callback queue."_

Alexa verbalize inside updateDOM:

_"Reassigning VDOM to the result of invoking createVDOM."_

VDOM = 3 sub-arrays:

1. `["input", "", handle]` — input!
2. `["div", "Hello, !"]` — div with greeting!
3. `["div", "great job"]` — div with static text!

Will: _"Not sure that one depends on our data, but we're describing in FULL what the user will see in ONE place — that's kind of amazing."_

```
VDOM — 3 SUB-ARRAYS:
═══════════════════════════════════════════════════════════════

  VDOM = [
    ["input", "",         handle],  ← 0: input!
    ["div",   "Hello, !"],          ← 1: greeting!
    ["div",   "great job"],         ← 2: static! (no data dep!)
  ]

  Will: "Describing in FULL what the user sees
         in ONE place — amazing!" 🎯
```

---

## §7. Alexa: map(convert) — "Hit Each Element One by One!"

> Will: _"elems is going to be the output of calling on this list vDOM, the built-in map function, passing the convert function definition."_
> Alexa: _"It's going to hit each element one by one with convert."_

### map creates internal array → elems!

Will: _"map inside of it creates what, Alexa?"_ → Alexa: _"An array."_

Will: _"Ready for each element to be added — the return value of each call to convert, called as many times as there are elements."_

Flow:

1. convert(VDOM[0]) → accessor → push to internal array!
2. convert(VDOM[1]) → accessor → push!
3. convert(VDOM[2]) → accessor → push!
4. Return array → `elems`!

```
map(convert) FLOW:
═══════════════════════════════════════════════════════════════

  elems = VDOM.map(convert):

  ITERATION 1: convert(["input", "", handle])
  ┌──────────────────────────────────────────────────────────┐
  │ → createElement("input") → C++ input!                  │
  │ → value = "", oninput = handle                         │
  │ → push accessor to internal array[0] ✅               │
  └──────────────────────────────────────────────────────────┘

  ITERATION 2: convert(["div", "Hello, !"])
  ┌──────────────────────────────────────────────────────────┐
  │ → createElement("div") → C++ div!                      │
  │ → textContent = "Hello, !"                             │
  │ → push accessor to internal array[1] ✅               │
  └──────────────────────────────────────────────────────────┘

  ITERATION 3: convert(["div", "great job"])
  ┌──────────────────────────────────────────────────────────┐
  │ → createElement("div") → C++ div!                      │
  │ → textContent = "great job"                            │
  │ → push accessor to internal array[2] ✅               │
  └──────────────────────────────────────────────────────────┘

  → Return array → elems! ✅
```

---

## §8. Alexa: convert(VDOM[0]) — Full Walkthrough!

> Alexa: _"In our local memory — node has the value of the 0th element of VDOM. An array with 'input', empty string, handle function definition."_

### Alexa: full convert walkthrough!

Alexa verbalize:

1. _"Node = ['input', '', handle]."_
2. _"Call createElement on document object — hidden link — create input element."_
3. _"JavaScript gives us an accessor object with getter-setter properties."_
4. Line 20: _"Use value setter to set value on input node to empty string."_ (node[1])
5. Line 21: _"Use oninput setter to set handler to handle."_ (node[2])

Will on line 19 (textContent): _"We know it will NOT cause any harm — the user's view will not change. So we'll just SKIP OVER it."_

→ Return accessor → pushed into map's internal array!

---

## §9. By Analogy — "VDOM[1] + VDOM[2]!"

> Will: _"VDOM position 1 is div with 'Hello, !' text. Third is from another run of convert — VDOM[2] — div with 'great job'."_

### 2 more converts — by analogy!

convert(VDOM[1]):

- createElement("div") → C++ div!
- textContent = "Hello, !" → text set!
- Push accessor to elems[1]!

convert(VDOM[2]):

- createElement("div") → C++ div!
- textContent = "great job" → text set!
- Push accessor to elems[2]!

Will: _"This list of three accessor objects will be returned out of the map call into which global constant?"_ → Alexa: _"Elems."_ ✅

```
elems AFTER map:
═══════════════════════════════════════════════════════════════

  elems = [
    accessor_0 → C++ input (value: "")      ← [0]
    accessor_1 → C++ div (text: "Hello, !") ← [1]
    accessor_2 → C++ div (text: "great job")← [2]
  ]

  "3 accessor objects, each linking to
   their respective DOM elements!" — Will
```

---

## §10. Alexa: spread + replaceChildren — "3 Elements on Page!"

> Alexa: _"We are going to SPREAD all elements in elems into our list of arguments."_
> Will: _"Take elems[0], elems[1], elems[2] and insert them one by one as replacement of body's children."_

### spread(...elems) → replaceChildren!

Alexa: _"Use replaceChildren on body, on document object."_

Will: _"A little bit different — we've got to SPREAD."_

Alexa: _"Spread all elements in elems into our list of arguments."_

`replaceChildren(...elems)` = `replaceChildren(elems[0], elems[1], elems[2])`!

Result: input (empty) + div ("Hello, !") + div ("great job") → displayed! 🎉

Will summary: _"updateDOM has converted our underlying data into a full representation in JavaScript, instantiated with actual data. Through mapping over that and running convert — each description into actual DOM elements. Once they're appended through the spread — we end up with our full user interface directly MAPPED from the JavaScript description."_

```
FINAL PAGE:
═══════════════════════════════════════════════════════════════

  replaceChildren(...elems):
  = replaceChildren(elems[0], elems[1], elems[2])

  ┌──────────────────────────┐
  │ [_______________]        │ ← input (empty!)
  │ Hello, !                 │ ← div!
  │ great job                │ ← div! (NEW!)
  └──────────────────────────┘

  🎉 [APPLAUSE] — "Well done Alexa!" — Will

  "Full UI directly MAPPED from the
   JavaScript description!" — Will 🎯
```

---

## §11. Tự Implement: 3-Element Pipeline

```javascript
// ═══ 3-Element map + spread Pipeline ═══

let name = "";

function createVDOM() {
  return [
    ["input", name, handle],
    ["div", `Hello, ${name}!`],
    ["div", "great job"],
  ];
}

function handle(e) {
  name = e.target.value; // EVENT OBJECT!
}

function convert(node) {
  const el = { type: node[0], content: node[1], handler: node[2] };
  console.log(`  convert: <${el.type}>${el.content}</${el.type}>`);
  return el;
}

function updateDOM() {
  const VDOM = createVDOM();
  console.log(`  VDOM: ${VDOM.length} elements`);

  const elems = VDOM.map(convert); // map!
  // replaceChildren(...elems)            // spread!

  console.log(`  Page:`);
  elems.forEach((el, i) => {
    console.log(`    [${i}] <${el.type}>${el.content}</${el.type}>`);
  });
}

console.log("Render 1 (name=''):");
updateDOM();

name = "Jo";
console.log("\nRender 2 (name='Jo'):");
updateDOM();

// Add MORE elements — NO code change in updateDOM!
console.log("\n✅ 3 elements — map handles all!");
console.log("✅ spread converts array → individual args!");
console.log("✅ Fully composable! 🎉");
```

---

## §12. 🔬 Deep Analysis — Composability

```
COMPOSABILITY EVOLUTION:
═══════════════════════════════════════════════════════════════

  v1: Manual indexing
  → convert(VDOM[0]); convert(VDOM[1]); // rigid!

  v2: map + spread (NOW!):
  → const elems = VDOM.map(convert);    // flexible!
  → replaceChildren(...elems);          // any number!

  v3: Functional components (NEXT!):
  → Functions that PRODUCE sub-arrays!
  → Compose complex UIs from simple pieces!

  "I could have 10 great jobs — just LIST them!
   map will handle however many there are!" — Will 🎯
```

---

## Checklist

```
[ ] elems replaces jsInput/jsDiv — generic array!
[ ] Event object: e.target.value (no individual labels!)
[ ] Hoisting: function keyword = available everywhere!
[ ] createVDOM: 3 sub-arrays (input + 2 divs!)
[ ] map(convert): hit each element, push to internal array!
[ ] spread + replaceChildren: array → individual args!
[ ] "Full UI directly MAPPED from JS description!" — Will
TIẾP THEO → Phần 36: Functional Components!
```
