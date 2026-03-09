# The Hard Parts of UI Development — Phần 30: Emulate HTML with String Interpolation — "Visual Code for Visual Output!"

> 📅 2026-03-08 · ⏱ 40 phút đọc
>
> Nguồn: Frontend Masters — Will Sentance
> Khoá học: The Hard Parts of UI Development
> Bài: Emulate HTML with String Interpolation — "Template Literals, divInfo Array, convert() Function, JS Representation!"
> Độ khó: ⭐️⭐️⭐️⭐️⭐️ | Advanced — visual code paradigm, template literals, array-as-element-descriptor, convert function, Virtual DOM precursor!

---

## Mục Lục

| #   | Phần                                                            |
| --- | --------------------------------------------------------------- |
| 1   | String Concatenation — "Paul: Imperative, Not Visual!"          |
| 2   | Template Literals — "Justice: Input Looks Like Output!"         |
| 3   | Visual Code Paradigm — "The Closer, the Easier!"                |
| 4   | divInfo Array — "Phil: Two Elements, Type + Content!"           |
| 5   | convert() Function — "Phil + Wye: createElement + textContent!" |
| 6   | JS Representation of DOM — "Intermediate Step!"                 |
| 7   | Tự Implement: Array Descriptor + convert()                      |
| 8   | 🔬 Deep Analysis Patterns — Visual Code → Virtual DOM           |

---

## §1. String Concatenation — "Paul: Imperative, Not Visual!"

> Will: _"Does the code we wrote look ANYTHING like our final output? It couldn't look LESS."_

### Bối cảnh — imperative string building!

Will bắt đầu với ví dụ đơn giản: build string "Hello, Jo!"

Paul verbalize:

1. _"Initializing variable name, assigning string 'Jo'."_
2. _"Declaring textToDisplay, assigning string 'Hello, '."_
3. _"Reassigning textToDisplay using concat method, passing name."_ → "Hello, Jo"
4. _"Same thing, concat exclamation point."_ → "Hello, Jo!"

Will: _"Does the code look anything like our final output? It COULDN'T LOOK LESS!"_

Ian joke: _"Strings are immutable and it really bugged me you just ADDED to that in memory."_ 😂

```
IMPERATIVE STRING BUILDING:
═══════════════════════════════════════════════════════════════

  CODE:
  ┌──────────────────────────────────────────────────────────┐
  │ let name = "Jo";                                         │
  │ let textToDisplay = "Hello, ";                          │
  │ textToDisplay = textToDisplay.concat(name);              │
  │ textToDisplay = textToDisplay.concat("!");               │
  └──────────────────────────────────────────────────────────┘

  OUTPUT: "Hello, Jo!"

  CODE ≠ OUTPUT! 😤
  ┌──────────────────────────────────────────────────────────┐
  │ "Does the code look ANYTHING like the output?           │
  │  It COULDN'T LOOK LESS." — Will                        │
  └──────────────────────────────────────────────────────────┘
```

---

## §2. Template Literals — "Justice: Input Looks Like Output!"

> Justice: _"We're using backticks instead of double quotations. That enables us to insert a string but also use template literals to assign a variable."_
> Will: _"The INPUT looks like the OUTPUT. And that's really nice."_

### Template literal = visual code!

Justice verbalize:

_"We're using backticks instead of double quotations. That enables us to insert a string 'Hello, ' but then use template literals to assign a variable."_

Will: ``textToDisplay = `Hello, ${name}!` `` → evaluates to "Hello, Jo!" → **code LOOKS like output**!

_"The input looks like the output. It's not perfect but the input LOOKS like the output and that's really NICE."_

Core insight: **visual code = code whose structure resembles its output!**

_"String interpolation gives us visual code known as template literals. The closer our code can be to VISUAL, to mirroring its visual or graphical output, the EASIER for us as developers."_

```
TEMPLATE LITERALS — VISUAL CODE:
═══════════════════════════════════════════════════════════════

  IMPERATIVE (code ≠ output):
  ┌──────────────────────────────────────────────────────────┐
  │ "Hello, ".concat(name).concat("!")                      │
  │ → 3 steps, not visual at all! 😤                       │
  └──────────────────────────────────────────────────────────┘

  VISUAL (code ≈ output!):
  ┌──────────────────────────────────────────────────────────┐
  │ `Hello, ${name}!`                                        │
  │ → Looks like "Hello, Jo!" — VISUAL! ✅                │
  └──────────────────────────────────────────────────────────┘

  "The CLOSER our code can be to VISUAL,
   to MIRRORING its output,
   the EASIER for us as developers." — Will 🎯
```

---

## §3. Visual Code Paradigm — "The Closer, the Easier!"

> Will: _"Could we EMULATE our HTML with semi-visual coding?"_

### From strings to DOM elements — same idea!

Will extends pattern: nếu template literals **visualize strings** → có thể **visualize DOM elements** không?

_"Could we do something similar with our main code by creating VISUAL elements? Could we EMULATE our HTML with semi-visual coding?"_

Ý tưởng:

- Mô tả element bằng array: `["div", "Hello, Jo!"]`
- Array **NHÌN** giống HTML `<div>Hello, Jo!</div>`!
- convert() function → transform array → real DOM element!

_"Starting with a unit of code representing each piece of view — a JavaScript array with all the details. Element 0 is type, element 1 is content."_

```
VISUAL CODE PARADIGM:
═══════════════════════════════════════════════════════════════

  STRING:
  Output: "Hello, Jo!"
  Visual code: `Hello, ${name}!`  ← looks like output!

  DOM ELEMENT:
  Output: <div>Hello, Jo!</div>
  Visual code: ["div", `Hi, ${name}!`]  ← looks like HTML!

  "Could we EMULATE our HTML with semi-visual coding?" — Will

  ┌──────────────────────────────────────────────────────────┐
  │ HTML:     <div>Hi, Jo!</div>                            │
  │ Array:    ["div", "Hi, Jo!"]                            │
  │ convert:  ["div", "Hi, Jo!"] → DOM element!            │
  │                                                          │
  │ "A MANIFESTATION of it in JavaScript!" — Will          │
  └──────────────────────────────────────────────────────────┘
```

---

## §4. divInfo Array — "Phil: Two Elements, Type + Content!"

> Phil: _"Declaring divInfo, initializing to an array with two elements: the string 'div' and a template literal."_

### divInfo = ["div", `Hi, ${name}!`]

Phil verbalize:

- _"Declaring divInfo variable, initializing to an array."_
- Will: _"Two elements — string 'div' and template literal."_
- Will: _"This expression needs to be EVALUATED. What does it evaluate to?"_
- Phil: _"The string 'Hi, Jo!'"_

Will excited: _"We now have a VISUAL MAP! Both a sort of conditional on how our data ends up being. This doesn't look like JavaScript — it's so PICTURESQUE."_

Memory state:

- `name = "Jo"`
- `divInfo = ["div", "Hi, Jo!"]` ← **evaluated** template literal!

```
divInfo ARRAY:
═══════════════════════════════════════════════════════════════

  CODE:
  let name = "Jo";
  let divInfo = ["div", `Hi, ${name}!`];

  EVALUATED:
  ┌──────────────────────────────────────────────────────────┐
  │ name: "Jo"                                               │
  │ divInfo: ["div", "Hi, Jo!"]                             │
  │           ↑        ↑                                     │
  │           type     content (EVALUATED!)                  │
  └──────────────────────────────────────────────────────────┘

  Phil: "Array with two elements: string 'div'
         and template literal." ✅

  Will: "This doesn't look like JavaScript —
         it's so PICTURESQUE!" 🎨
```

---

## §5. convert() Function — "Phil + Wye: createElement + textContent!"

> Phil: _"Declare jsDiv, initialize to the evaluated result of executing convert, passing divInfo."_
> Wye: _"Look up zeroeth index on node — string 'div' — that's the signature of createElement."_

### convert(node) → createElement + textContent + return!

Phil: _"Declare jsDiv, initialize to the result of executing convert passing divInfo."_ → Brand new execution context!

Parameter matching: `node = ["div", "Hi, Jo!"]`

Wye verbalize inside convert:

1. _"Look up zeroeth index on node — string 'div'."_ → `node[0] = "div"`
2. _"That's the signature of createElement."_ → `createElement("div")`!
3. → Phil picks up: _"Assigning into memory a variable named elem."_
4. → div created on C++ DOM (unattached!) with accessor object!

Wye verbalize content:

5. _"Look up item at first index of node array — string 'Hi, Jo!'"_
6. _"Assign to textContent — getter-setter which puts that as text content on the DOM node."_

Will: _"We passed in node[0] which was 'div' from our visual description — and created a DOM element of that type!"_

```
convert() WALKTHROUGH:
═══════════════════════════════════════════════════════════════

  convert(["div", "Hi, Jo!"]):

  STEP 1: node = ["div", "Hi, Jo!"]
  ┌──────────────────────────────────────────────────────────┐
  │ node[0] = "div"        ← type!                        │
  │ node[1] = "Hi, Jo!"    ← content!                     │
  └──────────────────────────────────────────────────────────┘

  STEP 2: const elem = document.createElement(node[0])
  ┌──────────────────────────────────────────────────────────┐
  │ createElement("div") → C++ div (unattached!)           │
  │ elem = { [[link]] → div, textContent: g/s }           │
  │                                                          │
  │ Wye: "String 'div' is the SIGNATURE of createElement!" │
  └──────────────────────────────────────────────────────────┘

  STEP 3: elem.textContent = node[1]
  ┌──────────────────────────────────────────────────────────┐
  │ textContent setter → C++ div.text = "Hi, Jo!"         │
  │                                                          │
  │ Wye: "Getter-setter puts that as text content           │
  │       on the DOM node." ✅                               │
  └──────────────────────────────────────────────────────────┘

  STEP 4: return elem → stored in jsDiv!
  ┌──────────────────────────────────────────────────────────┐
  │ jsDiv = elem = accessor with link to C++ div!          │
  │ C++ div: { text: "Hi, Jo!" }                           │
  └──────────────────────────────────────────────────────────┘
```

---

## §6. JS Representation of DOM — "Intermediate Step!"

> Will: _"It's really COOL that we now have in JavaScript a VISUAL REPRESENTATION of our information that's gonna display."_

### Array = visual description BEFORE DOM!

Will tổng kết insight:

_"We have in JavaScript a visual representation of our information that's gonna display. If we were to write document.body.replaceChildren(jsDiv), we would see a div with 'Hi, Jo!'"_

_"If we could create in JavaScript the REPRESENTATION of it and then simply call a convert function that does the displaying — that is pretty COOL."_

Đây chính là **Virtual DOM precursor**: mô tả UI trong JS **trước** khi commit to DOM!

```
JS REPRESENTATION — PRECURSOR TO VIRTUAL DOM:
═══════════════════════════════════════════════════════════════

  FLOW:
  ┌──────────────────────────────────────────────────────────┐
  │ 1. DATA:    name = "Jo"                                 │
  │                                                          │
  │ 2. VISUAL DESCRIPTION (JS!):                             │
  │    divInfo = ["div", "Hi, Jo!"]                         │
  │    ← Looks like HTML! Intermediate step!               │
  │                                                          │
  │ 3. CONVERT:  convert(divInfo) → real DOM element!      │
  │                                                          │
  │ 4. DISPLAY:  body.replaceChildren(jsDiv)                │
  │    → User sees: Hi, Jo! ✅                             │
  └──────────────────────────────────────────────────────────┘

  Will's VISION:
  ┌──────────────────────────────────────────────────────────┐
  │ "Imagine a LIST of sub-arrays down the page.            │
  │  REORDER them → reorder elements on the page!          │
  │  UI COMPOSITION! And if those sub-elements              │
  │  could be produced ON MASS by a function —              │
  │  I would be VERY, VERY HAPPY." — Will 😏               │
  └──────────────────────────────────────────────────────────┘
```

---

## §7. Tự Implement: Array Descriptor + convert()

```javascript
// ═══════════════════════════════════════════════════
// Mô phỏng — Visual Code!
// Array descriptor + convert() → DOM element!
// ═══════════════════════════════════════════════════

// ── Simplified DOM ──

class CppEl {
  constructor(type) {
    this.type = type;
    this.text = "";
    this.value = "";
    this.children = [];
  }
}

class Body {
  constructor() {
    this.children = [];
  }

  replaceChildren(...els) {
    this.children = els;
  }

  display() {
    console.log("  🖥️ Page:");
    for (const el of this.children) {
      if (el.type === "input") {
        console.log(`    [${el.value || "___"}]`);
      } else {
        console.log(`    <${el.type}>${el.text}</${el.type}>`);
      }
    }
  }
}

const body = new Body();

const document = {
  createElement(type) {
    return new CppEl(type);
  },
  body: body,
};

// ═══ PART 1: IMPERATIVE (ugly!) ═══

console.log("═══ PART 1: IMPERATIVE STRING ═══\n");

let name = "Jo";
let textToDisplay = "Hello, ";
textToDisplay = textToDisplay.concat(name);
textToDisplay = textToDisplay.concat("!");
console.log(`  Result: "${textToDisplay}"`);
console.log("  Code ≠ output! 😤\n");

// ═══ PART 2: TEMPLATE LITERAL (visual!) ═══

console.log("═══ PART 2: TEMPLATE LITERAL ═══\n");

textToDisplay = `Hello, ${name}!`;
console.log(`  Code: \`Hello, \${name}!\``);
console.log(`  Result: "${textToDisplay}"`);
console.log("  Code ≈ output! ✅\n");

// ═══ PART 3: ARRAY DESCRIPTOR (visual DOM!) ═══

console.log("═══ PART 3: ARRAY DESCRIPTOR ═══\n");

const divInfo = ["div", `Hi, ${name}!`];
console.log(`  divInfo = ${JSON.stringify(divInfo)}`);
console.log("  Looks like: <div>Hi, Jo!</div> — VISUAL! 🎨\n");

// ═══ PART 4: convert() FUNCTION ═══

console.log("═══ PART 4: convert() ═══\n");

function convert(node) {
  console.log(`  convert(${JSON.stringify(node)}):`);

  // Step 1: createElement with node[0]
  const elem = document.createElement(node[0]);
  console.log(`    createElement("${node[0]}") → C++ ${node[0]}!`);

  // Step 2: textContent with node[1]
  elem.text = node[1];
  console.log(`    textContent = "${node[1]}" ✅`);

  // Step 3: return accessor-like object
  return elem;
}

const jsDiv = convert(divInfo);
console.log(`  jsDiv → C++ div with text "${jsDiv.text}"\n`);

// ═══ PART 5: DISPLAY ═══

console.log("═══ PART 5: DISPLAY ═══\n");

document.body.replaceChildren(jsDiv);
body.display();

// ═══ PART 6: MULTIPLE ELEMENTS (Will's vision!) ═══

console.log("\n═══ PART 6: MULTIPLE ELEMENTS ═══\n");

const pageDescription = [
  ["h1", `Welcome, ${name}!`],
  ["div", `Hi, ${name}!`],
  ["p", "This is visual code!"],
];

console.log("  Page description (arrays):");
for (const desc of pageDescription) {
  console.log(`    ${JSON.stringify(desc)}`);
}

const elements = pageDescription.map((desc) => convert(desc));
document.body.replaceChildren(...elements);
console.log("");
body.display();

console.log("\n  ✅ Arrays LOOK like HTML!");
console.log("  ✅ convert() transforms to real DOM!");
console.log('  ✅ "UI COMPOSITION!" — Will 🎉');
console.log("  ✅ This is the PRECURSOR to Virtual DOM! 🔜");
```

---

## §8. 🔬 Deep Analysis Patterns — Visual Code → Virtual DOM

### 8.1 Pattern ①: Evolution of Visual Code

```
EVOLUTION — IMPERATIVE → VISUAL → VIRTUAL DOM:
═══════════════════════════════════════════════════════════════

  LEVEL 1: Imperative (ugly!)
  ┌──────────────────────────────────────────────────────────┐
  │ document.createElement("div")                           │
  │ div.textContent = "Hi, " + name + "!"                  │
  │ document.body.appendChild(div)                           │
  │ → Code looks NOTHING like output! ❌                   │
  └──────────────────────────────────────────────────────────┘

  LEVEL 2: Array descriptor (visual!)
  ┌──────────────────────────────────────────────────────────┐
  │ ["div", `Hi, ${name}!`]                                 │
  │ → Looks like <div>Hi, Jo!</div>! ✅                    │
  │ → convert() does the heavy lifting!                    │
  └──────────────────────────────────────────────────────────┘

  LEVEL 3: JSX (maximum visual!)
  ┌──────────────────────────────────────────────────────────┐
  │ <div>Hi, {name}!</div>                                  │
  │ → Literally LOOKS like HTML! ✅✅                      │
  │ → Babel transpiles to createElement calls!             │
  └──────────────────────────────────────────────────────────┘

  LEVEL 4: Virtual DOM (diff + update!)
  ┌──────────────────────────────────────────────────────────┐
  │ Old: ["div", "Hi, Jo!"]                                 │
  │ New: ["div", "Hi, Will!"]                               │
  │ → DIFF: only text changed!                             │
  │ → Update ONLY textContent! (not recreate element!)     │
  └──────────────────────────────────────────────────────────┘
```

### 8.2 Pattern ②: Array as Element Descriptor

```
ARRAY AS ELEMENT DESCRIPTOR:
═══════════════════════════════════════════════════════════════

  SIMPLE:
  ["div", "Hello!"]
  → type: "div", content: "Hello!"

  WITH CHILDREN (Will's vision!):
  ["div", [
    ["h1", "Title"],
    ["p", "Content"],
    ["button", "Click me!"]
  ]]
  → type: "div", children: [h1, p, button]
  → "A LIST of sub-arrays down the page!" — Will

  REACT's JSX (same idea, better syntax!):
  <div>
    <h1>Title</h1>
    <p>Content</p>
    <button>Click me!</button>
  </div>
  → Compiles to: createElement("div", null,
      createElement("h1", null, "Title"),
      createElement("p", null, "Content"),
      createElement("button", null, "Click me!"))
```

---

## Self-Assessment Checklist

```
CHECKLIST — SAU KHI HỌC PHẦN 30:
═══════════════════════════════════════════════════════════════

  STRING INTERPOLATION:
  [ ] Imperative concat = code ≠ output! 😤
  [ ] Template literal = code ≈ output! ✅
  [ ] "Input looks like output!" — Will

  VISUAL CODE PARADIGM:
  [ ] "The closer to visual, the easier!" — Will
  [ ] Emulate HTML with semi-visual coding!
  [ ] Array descriptor = ["type", "content"]!

  divInfo ARRAY:
  [ ] ["div", `Hi, ${name}!`] ← visual map!
  [ ] Template literal EVALUATED at creation time!
  [ ] "So picturesque!" — Will

  convert() FUNCTION:
  [ ] node[0] → createElement(type)!
  [ ] node[1] → elem.textContent = content!
  [ ] return elem → JS accessor to C++ element!

  JS REPRESENTATION:
  [ ] Array = visual description BEFORE DOM!
  [ ] "Intermediate step!" — Will
  [ ] Precursor to Virtual DOM! 🔜
  [ ] "Imagine a LIST of sub-arrays!" — Will

  TIẾP THEO → Phần 31: Building Virtual DOM Elements!
```
