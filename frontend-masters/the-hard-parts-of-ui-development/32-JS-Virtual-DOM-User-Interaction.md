# The Hard Parts of UI Development — Phần 32: JS Virtual DOM User Interaction

> 📅 2026-03-08 · ⏱ 35 phút đọc
>
> Nguồn: Frontend Masters — Will Sentance
> Bài: JS Virtual DOM User Interaction

---

## §1. User Types "Y" — "Wye: Handler → Queue → Stack!"

> Wye: _"The function definition handle gets put onto the callback queue. Gets pulled off and put onto the call stack. Gets those pink parens."_

User types "y" → event fired → handle vào callback queue.

Wye verbalize: _"Handle gets put onto the callback queue. Gets pulled off and put onto the call stack. Gets those PINK parens — the thread will then invoke the handle function."_

Will: _"Create a new execution context!"_

```
USER TYPES "Y":
═══════════════════════════════════════════════════════════════
  C++ input.value = "y" (auto!)
  → handle → callback queue → call stack → pink parens!
  → New execution context! 📦
```

---

## §2. handle() — "Only Update Data!"

> Wye: _"Goes to jsInput accessor, looks up value — retrieve string 'Y'. Saved into global label name."_
> Will: _"These are NOT truths, they're just APPROACHES."_

handle chỉ làm 1 việc: `name = jsInput.value` → name = "y"!

Wye: _"That is the ONLY thing that happens in response to the user input."_

---

## §3. updateDOM Re-Run — "createVDOM with New Data!"

> Wye: _"15 milliseconds later, updateDOM gets put onto the callback queue."_

Wye verbalize: _"Invokes createVDOM and assigns return value to VDOM."_

Will corrects "closure" → _"We're doing global for everything."_

---

## §4. VDOM Archive Insight — "Could've Used That Information!"

> Will: _"Imagine we ARCHIVE this — we'd know EXACTLY what changed between two states."_

Will teases diff: _"We'd have a FULL HISTORY. I feel like we could definitely USE that info. But we're not going to."_

```
VDOM ARCHIVE — DIFF PREVIEW:
═══════════════════════════════════════════════════════════════
  OLD: [["input", ""], ["div", "Hello, !"]]
  NEW: [["input", "y"], ["div", "Hello, y!"]]
  DIFF: [0][1] changed! [1][1] changed! → Only update THESE! 🚀
```

---

## §5. convert(VDOM[0]) — "Wye: Input, Y, Handle!"

> Wye: _"Create a new JavaScript accessor object and DOM node. Node type from 0th item: input."_

Wye: _"Set value to string 'y'. Our callback function — handle."_

Will: _"This deleted the old object — brand new one."_ → jsInput = new accessor!

```
convert(["input", "y", handle]):
  createElement("input") → C++ input (unattached!)
  elem.value = "y" | elem.oninput = handle
  return elem → jsInput! ✅
```

---

## §6. convert(VDOM[1]) — "By Analogy, Div, Hello Y!"

> Wye: _"By analogy, creating element — node[0] is 'div'. Assign textContent: 'Hello, y!'"_

→ jsDiv = new accessor with textContent = "Hello, y!"

---

## §7. replaceChildren — "Gone, Gone, GONE!"

> Wye: _"Call replaceChildren, passing jsInput and jsDiv."_
> Will: _"Replace our former UNLINKED elements — gone, gone, GONE!"_

Old elements deleted! New input("y") + div("Hello, y!") displayed!

Will: _"jsInput.focus() to make sure cursor was back. The user NEVER knew what happened."_ 🎉 [APPLAUSE]

```
PAGE AFTER:
  ┌──────────────────────────┐
  │ [y________________]      │ ← input!
  │ Hello, y!                │ ← div!
  └──────────────────────────┘
```

---

## §8. VDOM = Descriptive Code

> Will: _"Where are we describing data → view?"_
> Alexa: _"In our VDOM."_

Will: _"For the FIRST TIME, you have DESCRIPTIVE CODE that describes its output in JavaScript."_

Key insights:

- **createVDOM** = DESCRIPTION (what to show, with data!)
- **convert** = EXECUTION (imperative, hidden from developer!)
- _"Everything the user sees is a DIRECT CONSEQUENCE of state."_

```
DESCRIPTIVE CODE:
═══════════════════════════════════════════════════════════════
  createVDOM() = WHAT to show (declarative, visual!)
  convert()    = HOW to make real (imperative, hidden!)

  "First time — descriptive code in JS!" — Will
  "Everything the user sees = direct consequence of STATE." 🎯
```

---

## §9. Tự Implement

```javascript
// ═══ Full VDOM User Interaction ═══
let name = "";
let jsInput, jsDiv, VDOM;

function createVDOM() {
  return [
    ["input", name, handle],
    ["div", `Hello, ${name}!`],
  ];
}

function convert(node) {
  const el = { type: node[0], value: node[1], text: node[1], handler: node[2] };
  console.log(`  convert(${node[0]}) → value="${node[1]}"`);
  return el;
}

function handle(typed) {
  name = typed;
}

function updateDOM() {
  VDOM = createVDOM();
  console.log(`  VDOM: input="${VDOM[0][1]}", div="${VDOM[1][1]}"`);
  jsInput = convert(VDOM[0]);
  jsDiv = convert(VDOM[1]);
  console.log(`  Page: [${jsInput.value || "___"}] + "${jsDiv.text}"`);
}

// Demo
console.log("Render 1:");
updateDOM();
console.log("\nUser types 'y':");
handle("y");
console.log("\nRender 2:");
updateDOM();
console.log("\nUser types 'Jo':");
handle("Jo");
console.log("\nRender 3:");
updateDOM();
```

---

## Checklist

```
[ ] User types → handler → callback queue → call stack!
[ ] handle: name = jsInput.value (CHỈ DATA!)
[ ] VDOM archive → diff preview (coming!)
[ ] convert: brand new elements each time!
[ ] replaceChildren: "Gone, gone, GONE!" — Will
[ ] VDOM = descriptive code! Alexa: "In our VDOM!"
TIẾP THEO → Phần 33: Declarative UI as a Paradigm!
```
