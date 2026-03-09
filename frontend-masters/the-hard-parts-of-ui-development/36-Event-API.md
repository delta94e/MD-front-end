# The Hard Parts of UI Development — Phần 36: Event API — "Auto-Inserted Argument, e.target.value, Full Re-Render!"

> 📅 2026-03-08 · ⏱ 35 phút đọc
>
> Nguồn: Frontend Masters — Will Sentance
> Khoá học: The Hard Parts of UI Development
> Bài: Event API — "User types 'Li', event object auto-inserted, e.target.value, updateDOM re-run with map + spread!"
> Độ khó: ⭐️⭐️⭐️⭐️⭐️ | Advanced — event object, auto-inserted argument, target property, full re-render cycle!

---

## Mục Lục

| #   | Phần                                                   |
| --- | ------------------------------------------------------ |
| 1   | User Types "Li" — "Event Triggers handle!"             |
| 2   | Event Object — "Auto-Inserted Argument!"               |
| 3   | e.target — "Accessor Object Linked to Input!"          |
| 4   | e.target.value — "Phil: name = 'Li'!"                  |
| 5   | updateDOM Re-Run — "Wye: Already Described!"           |
| 6   | createVDOM with "Li" — "Wye: 3 Sub-Arrays!"            |
| 7   | map(convert) + spread — "Brand New Everything!"        |
| 8   | replaceChildren — "Page Updated, User Doesn't Notice!" |
| 9   | Tự Implement: Event Object + Full Cycle                |
| 10  | 🔬 Deep Analysis — Event API Architecture              |

---

## §1. User Types "Li" — "Event Triggers handle!"

> Will: _"Li is going to show up as the value IMMEDIATELY — because of our layout and render engine binding of this C++ list and the view together."_

### User types → value auto-updates → event fired!

User types "Li" → C++ input.value = "Li" (auto by layout engine!) → event triggers handle → callback queue → call stack!

Will: _"Brand new everybody — a brand new EXECUTION CONTEXT!"_

---

## §2. Event Object — "Auto-Inserted Argument!"

> Will: _"If we're allowing functions to be AUTO-EXECUTED, could we imagine they also have AUTO-INSERTED arguments? ABSOLUTELY YES."_

### Two parts of auto-execution!

Will explains **two parts** of running a function:

1. **Running the code** — auto-executed by JavaScript!
2. **Inserting arguments** — also auto-inserted by JavaScript!

Will: _"handle function that is auto-executed by JavaScript ALSO has auto-inserted into it an object full of useful properties that describe the event in more detail."_

Event object contains:

- **XY coordinates** of the user's input!
- **command button** held down? (true/false)
- **control button** held down? (true/false)
- **target** — which element was inputted into! ← KEY!

```
EVENT OBJECT — AUTO-INSERTED:
═══════════════════════════════════════════════════════════════

  User types "Li" → handle auto-executed:

  function handle(e) {    ← "e" = auto-inserted event object!
    name = e.target.value;
  }

  EVENT OBJECT (auto-inserted by JavaScript!):
  ┌──────────────────────────────────────────────────────────┐
  │ e = {                                                    │
  │   type: "input",                                         │
  │   target: accessor → C++ input element! ← KEY!       │
  │   clientX: 142,     ← XY coordinates!                 │
  │   clientY: 58,                                           │
  │   ctrlKey: false,   ← control held?                   │
  │   metaKey: false,   ← command held?                   │
  │   ...                                                    │
  │ }                                                        │
  │                                                          │
  │ "Auto-executed AND auto-inserted!" — Will               │
  └──────────────────────────────────────────────────────────┘
```

---

## §3. e.target — "Accessor Object Linked to Input!"

> Will: _"target has an accessor object corresponding to the input element in C++ that was inputted into — it has the hidden link to that C++ element."_

### target = accessor to the element!

Will: _"For our purposes the MOST USEFUL is the target property — it has an accessor object corresponding to the input element that was inputted into."_

_"That accessor object has all the useful properties for getting and setting data on that C++ object, and it has the hidden link."_

Justice verbalize parameter: _"The letter 'e'."_

Will: _"What COULD we have called it? We could have called it 'justice'. As long as we'd written `name = justice.target.value` — we would have been accessing the event object."_

→ Parameter name doesn't matter — just a placeholder!

```
e.target — ACCESSOR:
═══════════════════════════════════════════════════════════════

  e.target = {
    [[link]] → C++ input element!
    value: getter/setter → "Li"!
    oninput: setter
    textContent: getter/setter
    ...
  }

  "We could have called it 'justice'.
   As long as we wrote justice.target.value!" — Will 😂
```

---

## §4. e.target.value — "Phil: name = 'Li'!"

> Phil: _"Li."_
> Will: _"It's gonna be assigned to Li. Exactly."_

### Generic handle with event object!

Will: _"We hopefully wrote our code to access this target, use its value getter to get the value of input — 'Li' — to update our data."_

`e.target.value` → getter → C++ input.value = "Li" → `name = "Li"`!

Phil confirms: _"Li."_ 🎉 [APPLAUSE]

Will: _"Our data is updated. Woo-hoo! We now have our data updated."_

```
handle(e) EXECUTION:
═══════════════════════════════════════════════════════════════

  handle(e):
  ┌──────────────────────────────────────────────────────────┐
  │ e = { target: accessor → C++ input }                  │
  │                                                          │
  │ name = e.target.value                                    │
  │ → e.target = accessor                                  │
  │ → .value = GETTER → C++ input.value = "Li"           │
  │ → name = "Li" ✅                                       │
  │                                                          │
  │ Phil: "Li." ✅ [APPLAUSE] 🎉                          │
  └──────────────────────────────────────────────────────────┘
```

---

## §5. updateDOM Re-Run — "Wye: Already Described!"

> Will: _"The best thing is — are we even THINKING about how to change the page? NO! We DESCRIBED it already."_

### "Our work was DONE the moment we changed the data!"

Will's key insight:

_"Our work was done the moment that we changed the data with handle. Unfortunately FOR ENGINEERS, our work is done because updateDOM is just gonna run again and take our description."_

_"createVDOM is a ONE-TIME and done description of under ALL possible state values — name in this case 'Li' — that gives a full description of what's gonna show up."_

Wye: _"The browser adds updateDOM which eventually gets put onto the call stack, gets those pink parens added."_

→ updateDOM creates **brand new execution context**!

---

## §6. createVDOM with "Li" — "Wye: 3 Sub-Arrays!"

> Wye: _"First one: string 'input', string 'Li', function handle. String 'div', string 'Hello, Li!'. String 'div', 'great job'."_

### VDOM fully re-evaluated!

Wye verbalize:

1. `["input", "Li", handle]` — input with "Li"!
2. `["div", "Hello, Li!"]` — greeting with name!
3. `["div", "great job"]` — static!

Will: _"Look how VISUAL our code is in JavaScript. I was able to go [SOUND] because I knew EXACTLY what it was gonna look like!"_

```
VDOM — WITH "Li":
═══════════════════════════════════════════════════════════════

  VDOM = [
    ["input", "Li",        handle],  ← value = "Li"!
    ["div",   "Hello, Li!"],         ← template evaluated!
    ["div",   "great job"],          ← static!
  ]

  "Look how VISUAL our code is!
   I knew EXACTLY what it'd look like!" — Will 😏
```

---

## §7. map(convert) + spread — "Brand New Everything!"

> Wye: _"We're taking each item in that JavaScript array and returning a JavaScript accessor object with a hidden link to a DOM node."_

### Wye summarizes map beautifully!

Wye: _"Since VDOM is just a JavaScript array, we're going to map over it, calling convert on each item."_

Will: _"Tell me what's happening — you're doing better than me, I'm getting tired!"_ 😂

Wye: _"Basically, we're taking each item and returning a JavaScript accessor object that provides a hidden link to a DOM node."_

Will: _"Beautiful. These are all brand new accessor objects."_

Result: 3 new C++ elements (input, div, div) + 3 new accessor objects!

Old elements: **all links lost!**

```
BRAND NEW ELEMENTS:
═══════════════════════════════════════════════════════════════

  elems = VDOM.map(convert):

  OLD (removed!):
  ┌──────────────────────────────────────────────────────────┐
  │ input_1 → GONE! 🗑️                                   │
  │ div_1 ("Hello, !") → GONE! 🗑️                       │
  │ div_2 ("great job") → GONE! 🗑️                      │
  └──────────────────────────────────────────────────────────┘

  NEW (created!):
  ┌──────────────────────────────────────────────────────────┐
  │ elems[0] → accessor → input_2 (value: "Li") ✅      │
  │ elems[1] → accessor → div_3 (text: "Hello, Li!") ✅ │
  │ elems[2] → accessor → div_4 (text: "great job") ✅  │
  └──────────────────────────────────────────────────────────┘
```

---

## §8. replaceChildren — "Page Updated!"

> Wye: _"We spread elems into positional arguments parsed to replaceChildren on body of document object."_

### spread + replaceChildren!

Wye: _"Spread elems array into the call to replaceChildren."_

Will: _"Turns each accessor into individual arguments. Replace children will take the links to these three elements and REPLACE this set of children on body."_

_"They don't even see any difference as long as we REFOCUS the cursor."_

```
FINAL PAGE:
═══════════════════════════════════════════════════════════════

  replaceChildren(...elems):
  ┌──────────────────────────┐
  │ [Li________________]    │ ← input!
  │ Hello, Li!               │ ← div!
  │ great job                │ ← div!
  └──────────────────────────┘

  🎉 [APPLAUSE] — "Excellent technical communication!" — Will
```

---

## §9. Tự Implement: Event Object + Full Cycle

```javascript
// ═══ Event Object + Full Re-Render ═══

let name = "";

function createVDOM() {
  return [
    ["input", name, handle],
    ["div", `Hello, ${name}!`],
    ["div", "great job"],
  ];
}

// Event object — auto-inserted!
function handle(e) {
  // e = { target: { value: "Li" }, clientX, clientY, ... }
  name = e.target.value;
  console.log(`  handle: name = "${name}" (from e.target.value!)`);
}

function convert(node) {
  return { type: node[0], content: node[1], handler: node[2] };
}

function updateDOM() {
  const VDOM = createVDOM();
  const elems = VDOM.map(convert);
  // replaceChildren(...elems)
  console.log("  Page:");
  elems.forEach((el, i) => {
    console.log(`    <${el.type}>${el.content}</${el.type}>`);
  });
}

// Demo
console.log("Render 1 (name=''):");
updateDOM();

// Simulate user typing "Li" with event object!
console.log("\nUser types 'Li':");
handle({ target: { value: "Li" } }); // auto-inserted!

console.log("\nRender 2 (name='Li'):");
updateDOM();

console.log("\n✅ Event object: auto-inserted by JavaScript!");
console.log("✅ e.target.value: generic, no individual labels!");
console.log("✅ 'Our work was DONE when we changed data!' — Will");
```

---

## §10. 🔬 Deep Analysis — Event API Architecture

```
EVENT API — TWO AUTO FEATURES:
═══════════════════════════════════════════════════════════════

  AUTO-EXECUTION:
  ┌──────────────────────────────────────────────────────────┐
  │ User action → event → callback queue → call stack     │
  │ → JavaScript AUTO-RUNS handle()!                       │
  └──────────────────────────────────────────────────────────┘

  AUTO-INSERTION:
  ┌──────────────────────────────────────────────────────────┐
  │ JavaScript AUTO-INSERTS event object as argument!      │
  │ → e = { target, clientX, clientY, ctrlKey, ... }      │
  │ → "e" is just a parameter name — could be anything!   │
  └──────────────────────────────────────────────────────────┘

  PARALLEL: Node.js!
  ┌──────────────────────────────────────────────────────────┐
  │ HTTP request → auto-insert (req, res) objects!         │
  │ Same pattern! Auto-executed + auto-inserted!           │
  └──────────────────────────────────────────────────────────┘

  "If we allow auto-EXECUTION, could we also
   auto-INSERT arguments? ABSOLUTELY YES." — Will 🎯
```

---

## Checklist

```
[ ] Event object: auto-inserted by JavaScript!
[ ] Two auto features: auto-execution + auto-insertion!
[ ] e.target: accessor to the element being inputted into!
[ ] e.target.value: getter → retrieve typed value!
[ ] Parameter name ("e") is arbitrary — could be "justice"!
[ ] handle(e) → name = e.target.value → data updated!
[ ] updateDOM re-runs: createVDOM → map(convert) → spread!
[ ] "Our work was DONE when we changed data!" — Will
TIẾP THEO → Phần 37: Functional Components!
```
