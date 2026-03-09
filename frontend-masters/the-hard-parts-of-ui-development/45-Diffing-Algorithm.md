# The Hard Parts of UI Development — Phần 45: Diffing Algorithm — "findDiff! Phil: stringify, Ian: Hello FM!, Alexa: div great job = SAME! 🎉"

> 📅 2026-03-08 · ⏱ 40 phút đọc
>
> Nguồn: Frontend Masters — Will Sentance
> Bài: Diffing Algorithm — "findDiff execution, JSON.stringify comparison, i=0 input changed, i=1 div changed, i=2 SAME!, incisive edits, Will's final speech!"
> Độ khó: ⭐️⭐️⭐️⭐️⭐️ | FINAL — diffing execution, incisive DOM edits, course conclusion!

---

## Mục Lục

| #   | Phần                                                      |
| --- | --------------------------------------------------------- |
| 1   | findDiff(prevVDOM, VDOM) — "Last Execution Context!"      |
| 2   | i=0: Input Changed! — "Phil: stringify, NOT same!"        |
| 3   | Incisive Edit — "elems[0].value = 'FM'!"                  |
| 4   | i=1: Div Changed! — "Ian: Hello FM!"                      |
| 5   | Incisive Edit — "elems[1].textContent = 'Hello, FM!'"     |
| 6   | i=2: SAME! — "Alexa: div great job = div great job!"      |
| 7   | Will's Final Speech — "Display Content + Change Content!" |
| 8   | Tự Implement: Complete Diffing System                     |
| 9   | 🔬 Deep Analysis — Course Architecture Summary            |

---

## §1. findDiff(prevVDOM, VDOM) — "Last Execution Context!"

> Will: _"I'm gonna run findDiff passing in prevVDOM and VDOM."_
> Everyone: _"Execution context."_ → Will: _"There it is!"_

### Final execution context of the course!

Will: _"We're still inside updateDOM — so findDiff goes on TOP of the call stack."_

Parameters:

- `prev` = prevVDOM (old: name = "")
- `current` = VDOM (new: name = "FM")

Loop: `i = 0, 1, 2` → compare each!

---

## §2. i=0: Input Changed! — "Phil: stringify, NOT same!"

> Will: _"Stringify — turn previous[0] into a string. Roughly, Phil?"_
> Phil: _"Input..."_ → Will: _"And then sort of the words 'function' or whatever."_

### JSON.stringify comparison!

`JSON.stringify(prev[0])` = `'["input","",...]'` (empty string!)
`JSON.stringify(current[0])` = `'["input","FM",...]'` (FM!)

Will: _"Are they DIFFERENT?"_ → Ian: _"Yes."_ → Will: _"YES, they're different!"_

---

## §3. Incisive Edit — "elems[0].value = 'FM'!"

> Will: _"We're gonna grab current position 0's content... and set that FM to elems position 0 using our VALUE setter."_

### Incisive = chỉ sửa đúng property thay đổi!

Will: _"We hit VALUE on elems[0] — our setter — to set on our corresponding input element the value to FM. INCISIVE edit! Immediately it's gonna show up on the page."_

_"Did I get that right?"_ → Yes! ✅

```
INCISIVE EDIT — i=0:
═══════════════════════════════════════════════════════════════

  prev[0] = ["input", "",   handle]
  curr[0] = ["input", "FM", handle]
  → DIFFERENT! ❌

  ACTION:
  elems[0].value = "FM"
  → setter → C++ input.value = "FM"! ✅
  → Page: [FM________________] ← immediately!

  "INCISIVE edit! Did I get that right?" — Will
```

---

## §4. i=1: Div Changed! — "Ian: Hello FM!"

> Ian: _"We'll compare stringified prev[1]: div, Hello, !. With stringified current[1]: div, Hello, FM!"_
> Will: _"Is that different?"_ → Ian: _"Yes."_ → Will: _"You BET it is."_

### textContent setter!

Will: _"elems[1] is our accessor for the div element — set its textContent to what, Ian?"_

Ian: _"Hello, FM!"_ ✅

```
INCISIVE EDIT — i=1:
═══════════════════════════════════════════════════════════════

  prev[1] = ["div", "Hello, !"]
  curr[1] = ["div", "Hello, FM!"]
  → DIFFERENT! ❌

  ACTION:
  elems[1].textContent = "Hello, FM!"
  → setter → C++ div.textContent = "Hello, FM!"! ✅

  Ian: "Hello, FM!" ✅
```

---

## §5. i=2: SAME! — "Alexa: div great job = div great job!"

> Alexa: _"We're comparing div great job to div great job."_
> Will: _"Are they different?"_ → Alexa: _"No."_
> Will: _"Let's say it EVERYONE TOGETHER — are they different?"_
> Everyone: _"NO."_ → Will: _"So do we change any DOM elements?"_ → Everyone: _"NO."_

### Skip! No DOM change! 🚀

Will: _"I think we DID IT."_ [APPLAUSE] 🎉

```
SKIP — i=2:
═══════════════════════════════════════════════════════════════

  prev[2] = ["div", "great job"]
  curr[2] = ["div", "great job"]
  → SAME! ✅

  ACTION: NOTHING! SKIP! 🚀

  Everyone: "NO!" 😂
  Will: "I think we DID IT!" 🎉 [APPLAUSE]

  "Look at all those CPU cycles we saved!" — Student 😂
```

---

## §6. Diffing Summary — "3 Elements, Only 2 Changed!"

```
DIFFING RESULT:
═══════════════════════════════════════════════════════════════

  | i | Element  | Old          | New            | Action        |
  |---|----------|--------------|----------------|---------------|
  | 0 | input    | value: ""    | value: "FM"    | UPDATE! ✅   |
  | 1 | div      | "Hello, !"   | "Hello, FM!"   | UPDATE! ✅   |
  | 2 | div      | "great job"  | "great job"    | SKIP! 🚀     |

  DOM operations: 2 (not 3!)
  CPU saved: 33%! (1 element skipped!)

  With 100 elements: could save 99%! 🚀🚀🚀
```

---

## §7. Will's Final Speech — "Display Content + Change Content!"

> Will: _"We have a beautiful description in JavaScript of what we want to display — imagine HTML but you could have VARIABLES in it. That's all we've been trying to get to."_

### Two goals of UI!

Will: _"What are the two things user interface is trying to do?"_

1. **Display content** → _"We had with HTML beautiful techniques for that."_
2. **Change content** → _"No such thing as content changing without associated data."_

Will: _"Unfortunately that data lives in a TOTALLY different runtime — JavaScript. The flow back and forth was extremely hard to maintain mentally."_

### The solution!

Will: _"One simple rule — users can only update underlying data. Then a single function flows it through. ONE-WAY."_

_"That also gave us the ability to describe as an INTERMEDIARY STEP in JavaScript what content to display — our virtual DOM."_

_"We realized we could compare those two collections of elements and decide what actually CHANGED."_

_"From that diffing algorithm — we only made the ACTUAL changes necessary to the real C++ elements. No performance issues."_

### Final line!

> Will: _"Composable UI that's NOT a disaster. Integrating that diffing algorithm makes our code semi-visual — described on the page looking like what it's gonna be in the output. But NOT untenably inefficient."_

---

## §8. Tự Implement: Complete Diffing System

```javascript
// ═══ COMPLETE DIFFING SYSTEM — FINAL CODE ═══

let name = "";
let VDOM, prevVDOM, elems;

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
  const el = document.createElement(node[0]);
  if (node[0] === "input") {
    el.value = node[1];
    el.oninput = node[2];
  } else {
    el.textContent = node[1];
  }
  return el;
}

function findDiff(prev, current) {
  for (let i = 0; i < current.length; i++) {
    if (JSON.stringify(prev[i]) !== JSON.stringify(current[i])) {
      // DIFFERENT! Incisive change!
      elems[i].textContent = current[i][1];
      elems[i].value = current[i][1];
    }
    // SAME → skip!
  }
}

function updateDOM() {
  if (!elems) {
    // MOUNTING!
    elems = VDOM.map(convert);
    document.body.append(...elems);
  } else {
    // DIFFING!
    prevVDOM = [...VDOM];
    VDOM = createVDOM();
    findDiff(prevVDOM, VDOM);
  }
}

VDOM = createVDOM();
setInterval(updateDOM, 15);

// ═══ THE COMPLETE FLOW ═══
// 1. Data (name) → createVDOM → VDOM description!
// 2. First time: map(convert) → DOM elements → append!
// 3. User action: handle → name = e.target.value!
// 4. Next tick: archive VDOM → createVDOM with new data!
// 5. findDiff: compare old vs new → only update changes!
// 6. Page updates with INCISIVE edits! 🎉
```

---

## §9. 🔬 Deep Analysis — Course Architecture Summary

```
COMPLETE EVOLUTION:
═══════════════════════════════════════════════════════════════

  Part 1-10: HTML + C++ DOM + JavaScript basics!
  Part 11-17: User interaction + data change!
  Part 18-22: One-way data binding!
  Part 23-25: setInterval auto-updating!
  Part 26-29: UI Components!
  Part 30-32: Virtual DOM (VDOM)!
  Part 33-35: Declarative UI + map + spread!
  Part 36-38: Event API + Functional Components!
  Part 39-40: State Hooks!
  Part 41-45: DIFFING! ← WE ARE HERE! 🎯

  FINAL ARCHITECTURE:
  ┌──────────────────────────────────────────────────────────┐
  │                                                          │
  │  DATA (name)                                             │
  │    ↓                                                    │
  │  createVDOM() → VDOM = [arrays] (semi-visual!)         │
  │    ↓                                                    │
  │  findDiff(old, new) → only what changed!               │
  │    ↓                                                    │
  │  elems[i].value/textContent = new value!               │
  │    ↓                                                    │
  │  C++ DOM updates → Page renders! 🎉                    │
  │                                                          │
  │  "Composable UI that's NOT a disaster!" — Will          │
  └──────────────────────────────────────────────────────────┘
```

---

## Checklist

```
[x] findDiff: brand new execution context!
[x] i=0: Phil stringify → input DIFFERENT → value = "FM"!
[x] i=1: Ian → "Hello, FM!" → textContent updated!
[x] i=2: Alexa → "div great job = SAME!" → SKIP! 🚀
[x] Everyone: "NO!" → no DOM change needed!
[x] "I think we DID IT!" — Will [APPLAUSE] 🎉
[x] Two goals: display content + change content!
[x] One-way data binding → VDOM → diffing → efficient!
[x] "Composable UI that's NOT untenably inefficient!" — Will
🎓 KHOÁ HỌC HOÀN THÀNH! 🎉
```
