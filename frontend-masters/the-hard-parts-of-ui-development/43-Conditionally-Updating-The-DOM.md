# The Hard Parts of UI Development — Phần 43: Conditionally Updating the DOM — "Mounting! elems = map(convert), append, Alexa: input, div, div!"

> 📅 2026-03-08 · ⏱ 35 phút đọc
>
> Nguồn: Frontend Masters — Will Sentance
> Bài: Conditionally Updating the DOM — "First 15ms, updateDOM execution, if elems undefined → mount! Machick: input array. Alexa: append. No more replaceChildren!"
> Độ khó: ⭐️⭐️⭐️⭐️⭐️ | Advanced — mounting flow, map(convert), accessor objects, append vs replace, incisive changes preview!

---

## Mục Lục

| #   | Phần                                           |
| --- | ---------------------------------------------- |
| 1   | 15ms — "Justice: updateDOM on Callback Queue!" |
| 2   | if (elems === undefined) — "MOUNTING!"         |
| 3   | Machick: map(convert) — "Input Array First!"   |
| 4   | 3 DOM Elements + 3 Accessor Objects — "Links!" |
| 5   | Alexa: append — "Not replaceChildren!"         |
| 6   | Page Renders! — "Initial State Displayed!"     |
| 7   | Tự Implement: Mounting Flow                    |

---

## §1. 15ms — "Justice: updateDOM on Callback Queue!"

> Justice: _"Got updateDOM."_
> Will: _"It's gonna be called — callback queue — let's put it on the call stack."_

### First tick at 15ms!

Justice: updateDOM added to callback queue → event loop checks → call stack empty → **updateDOM executes!**

Will: _"Brand new EXECUTION CONTEXT!"_ 🎉

---

## §2. if (elems === undefined) — "MOUNTING!"

> Will: _"We check if elems are undefined — are they? YES. So we run our process of taking our JavaScript representation and hitting each with convert."_

### First time = MOUNT!

`elems` is `undefined` → first-time rendering → create ALL elements from scratch!

Will: _"Consider this the MOUNTING of the elements."_

_"I don't see any replaceChildren here anymore. Instead, we've got a findDiff that's gonna work out what specific content to change."_

```
CONDITIONAL LOGIC:
═══════════════════════════════════════════════════════════════

  function updateDOM() {
    if (!elems) {
      // ← FIRST TIME! MOUNTING!
      elems = VDOM.map(convert);
      document.body.append(...elems);
    } else {
      // ← SUBSEQUENT! DIFFING!
      prevVDOM = [...VDOM];
      VDOM = createVDOM();
      findDiff(prevVDOM, VDOM);
    }
  }

  "No replaceChildren anymore!
   Instead: findDiff for INCISIVE changes!" — Will
```

---

## §3. Machick: map(convert) — "Input Array First!"

> Will: _"Which index of VDOM?"_ → Machick: _"Input."_ → Will: _"Perfect! Input the array."_

### map calls convert 3 times!

**convert(VDOM[0])**: `["input", "", handle]`
→ Creates C++ input element (value: "", oninput: handle)
→ Returns accessor object (value getter/setter, link to C++ input)

**convert(VDOM[1])**: `["div", "Hello, !"]`
→ Creates C++ div element (textContent: "Hello, !")
→ Returns accessor object (textContent getter/setter, link to C++ div)

**convert(VDOM[2])**: `["div", "great job"]`
→ Creates C++ div element (textContent: "great job")
→ Returns accessor object (textContent getter/setter, link to C++ div)

Will: _"We know it's there, just minimized. Its output is the creation in C++ DOM of an input element."_

---

## §4. 3 DOM Elements + 3 Accessor Objects — "Links!"

> Machick: _"Just elems?"_ → Will: _"Elems, exactly. Spot on."_

### elems = array of 3 accessors!

```
MOUNTING RESULT:
═══════════════════════════════════════════════════════════════

  C++ DOM:                       JavaScript:
  ┌─────────────────────────┐   ┌──────────────────────────┐
  │ input (value: "")       │←──│ elems[0]: { value, ... } │
  │ div (text: "Hello, !")  │←──│ elems[1]: { textContent } │
  │ div (text: "great job") │←──│ elems[2]: { textContent } │
  └─────────────────────────┘   └──────────────────────────┘

  "We have accessor objects for our underlying DOM elements.
   We're gonna use them for INCISIVE, PRECISE changes!" — Will
```

Will: _"Each is linked to, respectively, input, div, and div."_

_"The first one has VALUE on input. The second two are divs and have TEXT CONTENT."_

---

## §5. Alexa: append — "Not replaceChildren!"

> Will: _"What are we gonna do instead?"_ → Alexa: _"Append them."_ → Will: _"Because we ain't gonna be REPLACING them anytime soon."_

### append vs replaceChildren!

Will: _"We ain't gonna be replacing them anytime soon. We're gonna do INCISIVE changes rather than replace as a whole."_

`document.body.append(...elems)`:

- Spread elems[0], elems[1], elems[2] as individual arguments!
- Each accessor's linked element becomes a **child of body**!

Will: _"Take our link to body and append our linked three elems as its children — the funny term meaning sub-elements."_

```
append vs replaceChildren:
═══════════════════════════════════════════════════════════════

  BEFORE (wasteful):
  replaceChildren(...elems)
  → WIPE all children → add new ones!
  → Even unchanged elements get destroyed! 😤

  NOW (efficient):
  append(...elems)  ← only on FIRST mount!
  → After this: findDiff makes incisive changes!
  → Elements PERSIST! Only content updated! 🚀
```

---

## §6. Page Renders! — "Initial State Displayed!"

> Alexa: _"An input with empty string — nothing. First div: 'Hello, !'. Second div: 'great job'."_

### First render complete!

Alexa verbalize what appears on page:

1. Input field (empty)
2. "Hello, !" (no name yet)
3. "great job"

Will: _"We have successfully taken our initial state, produced a JavaScript manifestation. Created through convert and mapping — our elements added to the DOM, the accessor for them, and then our rendered displayed pixels!"_

_"In the challenges, you can build this out to handle sub-elements, multiple layers — as it does in full UI framework implementations."_

```
PAGE:
═══════════════════════════════════════════════════════════════

  ┌──────────────────────────┐
  │ [________________]       │ ← input (empty!)
  │ Hello, !                 │ ← div!
  │ great job                │ ← div!
  └──────────────────────────┘

  "We have SUCCESSFULLY taken our initial state!" — Will 🎉
```

---

## §7. Tự Implement: Mounting Flow

```javascript
// ═══ Mounting Flow ═══

let elems;

const VDOM = [
  ["input", "", null],
  ["div", "Hello, !"],
  ["div", "great job"],
];

function convert(node) {
  console.log(`  convert([${node[0]}, "${node[1]}"])`);
  return {
    type: node[0],
    content: node[1],
    link: `→ C++ ${node[0]} element!`,
  };
}

function updateDOM() {
  if (!elems) {
    // MOUNTING!
    console.log("  if (!elems) → MOUNTING!");
    elems = VDOM.map(convert);
    console.log(`  elems = [${elems.length} accessor objects]`);
    console.log("  document.body.append(...elems)");
    elems.forEach((el, i) => {
      console.log(
        `    body.child[${i}]: <${el.type}>${el.content}</${el.type}>`,
      );
    });
  } else {
    // DIFFING! (next part!)
    console.log("  else → DIFFING! (not mounting)");
  }
}

// Demo
console.log("═══ FIRST 15ms: MOUNTING ═══\n");
updateDOM();

console.log("\n═══ SECOND 15ms (no data change) ═══\n");
updateDOM();

console.log("\n✅ First call: MOUNT (create elements + append)!");
console.log("✅ Second call: DIFF (compare + incisive changes)!");
console.log("✅ append, NOT replaceChildren!");
```

---

## Checklist

```
[ ] 15ms: updateDOM → callback queue → call stack!
[ ] if (!elems): MOUNTING — create from scratch!
[ ] map(convert): 3 arrays → 3 DOM elements + 3 accessors!
[ ] Machick: input array first!
[ ] elems = [accessor0, accessor1, accessor2]!
[ ] Each accessor linked to C++ DOM element!
[ ] Alexa: "append them!" — not replaceChildren!
[ ] append = one-time mount, then incisive changes!
[ ] Page: input + "Hello, !" + "great job"!
TIẾP THEO → Phần 44: DOM Diffing User Interaction!
```
