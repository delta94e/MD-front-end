# The Hard Parts of UI Development — Phần 42: DOM Diffing Setup — "Final Code! Phil: document, Memory, Mounting!"

> 📅 2026-03-08 · ⏱ 35 phút đọc
>
> Nguồn: Frontend Masters — Will Sentance
> Bài: DOM Diffing Setup — "Final code setup, Phil walks through memory, document object, hoisting, setInterval, convert, findDiff, append!"
> Độ khó: ⭐️⭐️⭐️⭐️⭐️ | Advanced — full architecture setup, mounting concept, append vs replaceChildren!

---

## Mục Lục

| #   | Phần                                                            |
| --- | --------------------------------------------------------------- |
| 1   | Final Code! — "Web Page Setup!"                                 |
| 2   | Phil: Memory — "document, name, VDOM, prevVDOM, elems!"         |
| 3   | Functions — "createVDOM, handle, updateDOM, convert, findDiff!" |
| 4   | setInterval — "15ms Loop!"                                      |
| 5   | Sơ Đồ Kiến Trúc — Full Setup                                    |
| 6   | Tự Implement: Final Code Setup                                  |

---

## §1. Final Code! — "Web Page Setup!"

> Will: _"We are at our FINAL CODE. I'm so proud of everybody."_

### Full architecture!

Will vẽ toàn bộ hệ thống:

- **Web page**: pixels → graphics card!
- **C++ DOM**: list/object form → layout/render engine auto-displays!
- **JavaScript**: memory + call stack + callback queue + event loop!

_"If we could write C++ code, today's and yesterday's session wouldn't have mattered — but we can't. So we lean on JavaScript."_

---

## §2. Phil: Memory — "document, name, VDOM, prevVDOM, elems!"

> Phil: _"First thing: the document object."_ → Will: _"Loaded there whenever the host running JavaScript is the web browser."_

### Global memory declarations!

Phil walks through:

1. **`document`** — auto-loaded, linked to DOM! Has `createElement` (collapsed — we know what it does!)
2. **`name = ""`** — our piece of state!
3. **`VDOM`** — assigned immediately from `createVDOM()` with initial data!
4. **`prevVDOM`** — declared, nothing assigned yet!
5. **`elems`** — declared, will hold accessor objects!

Phil verbalize VDOM:

_"Array with three subarrays. First: string 'input', empty string, function handle. Then: string 'div', string 'Hello, !'. Then: div, great job."_

```
GLOBAL MEMORY:
═══════════════════════════════════════════════════════════════

  document → link to DOM! (createElement, body, etc.)

  name = ""                      ← state!

  VDOM = [                       ← from createVDOM()!
    ["input", "", handle],
    ["div", "Hello, !"],
    ["div", "great job"],
  ]

  prevVDOM = undefined           ← will archive old VDOM!
  elems = undefined              ← will hold accessors!
```

---

## §3. Functions — "createVDOM, handle, updateDOM, convert, findDiff!"

> Will: _"Function keyword ensures they're all available throughout the whole file — HOISTING."_

### 5 functions — all hoisted!

Phil: _"createVDOM."_ → Will: _"Takes our data and creates JavaScript representation with real data in it."_

1. **createVDOM** — data → VDOM array!
2. **handle** — event handler, stored in VDOM element!
3. **updateDOM** — the BIG function doing all the work!
4. **convert** — array → DOM element + accessor (collapsed!)
5. **findDiff** — compare old vs new, make incisive changes!

Will on convert: _"We don't have space but we remember what it does — taking an array and producing a DOM element with an accessor object."_

Will on findDiff: _"That's gonna do the work of figuring out — do we actually have to update the real DOM?"_

---

## §4. setInterval — "15ms Loop!"

> Phil: _"Execute setInterval, passing updateDOM function definition and 15."_

### Timer setup!

Will: _"That's gonna set up an interval — 15 milliseconds later, well, it's gonna run many many times."_

_"Now we want to grab it all and stick them on the page — on the condition that there's not yet any elements. Consider this the MOUNTING of the elements."_

→ **Mounting** = first-time creation of DOM elements!

---

## §5. Sơ Đồ Kiến Trúc — Full Setup

```
FULL ARCHITECTURE:
═══════════════════════════════════════════════════════════════

  JAVASCRIPT                    │  C++ (Browser)
  ──────────────────────────────┼──────────────────────────
                                │
  Memory:                       │  DOM (list of elements):
  ┌────────────────────────┐   │  ┌─────────────────────┐
  │ document → ──────────────────→│ body               │
  │ name = ""              │   │  │   (empty initially) │
  │ VDOM = [3 arrays]      │   │  └─────────────────────┘
  │ prevVDOM = undefined   │   │
  │ elems = undefined      │   │  Timer:
  │                        │   │  ┌─────────────────────┐
  │ createVDOM()           │   │  │ 15ms → updateDOM   │
  │ handle()               │   │  └─────────────────────┘
  │ updateDOM()  ← BIG!   │   │
  │ convert()              │   │  Layout/Render Engine:
  │ findDiff()             │   │  → auto-display!
  └────────────────────────┘   │
                                │
  Call Stack: [empty]          │  Page:
  Callback Queue: [empty]      │  (nothing yet!)
  Event Loop: checking...      │
```

---

## §6. Tự Implement: Final Code Setup

```javascript
// ═══ Final Code — DOM Diffing Setup ═══

let name = "";
let VDOM = createVDOM(); // initial with empty name!
let prevVDOM; // will archive old VDOM!
let elems; // will hold accessor objects!

function createVDOM() {
  return [
    ["input", name, handle],
    ["div", `Hello, ${name}!`],
    ["div", "great job"],
  ];
}

function handle(e) {
  name = e.target.value;
}

function convert(node) {
  // Creates DOM element + accessor object!
  // (collapsed — we know what it does!)
  const el = document.createElement(node[0]);
  if (node[0] === "input") {
    el.value = node[1];
    el.oninput = node[2];
  } else {
    el.textContent = node[1];
  }
  return el;
}

function updateDOM() {
  if (!elems) {
    // MOUNTING! First time!
    elems = VDOM.map(convert);
    document.body.append(...elems);
  } else {
    // DIFFING! Subsequent times!
    prevVDOM = [...VDOM];
    VDOM = createVDOM();
    findDiff(prevVDOM, VDOM);
  }
}

function findDiff(prev, current) {
  for (let i = 0; i < current.length; i++) {
    if (JSON.stringify(prev[i]) !== JSON.stringify(current[i])) {
      // DIFFERENT! Make incisive change!
      elems[i].textContent = current[i][1];
      elems[i].value = current[i][1];
    }
    // SAME → skip!
  }
}

setInterval(updateDOM, 15); // 15ms loop!

console.log("✅ Setup complete!");
console.log("✅ Mounting = first createDOM (if !elems)");
console.log("✅ Diffing = subsequent runs (else)");
console.log("✅ append instead of replaceChildren!");
```

---

## Checklist

```
[ ] Final code setup — full architecture!
[ ] Phil: document, name, VDOM, prevVDOM, elems in memory!
[ ] Hoisting: all 5 functions available immediately!
[ ] convert: collapsed — creates DOM element + accessor!
[ ] findDiff: compare old vs new VDOM!
[ ] setInterval(updateDOM, 15): timer loop!
[ ] "Mounting" = first-time element creation!
[ ] append instead of replaceChildren (no more wiping!)
TIẾP THEO → Phần 43: Conditionally Updating the DOM!
```
