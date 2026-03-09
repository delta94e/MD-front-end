# The Hard Parts of UI Development — Phần 44: DOM Diffing User Interaction — "FM! Ian: e.target.value, Alexa: prevVDOM = [...VDOM], createVDOM with FM!"

> 📅 2026-03-08 · ⏱ 35 phút đọc
>
> Nguồn: Frontend Masters — Will Sentance
> Bài: DOM Diffing User Interaction — "User types FM, handle with event object, Ian walks through, Alexa: prevVDOM archive + VDOM reassign!"
> Độ khó: ⭐️⭐️⭐️⭐️⭐️ | Advanced — user interaction with diffing architecture, prevVDOM archive, VDOM re-creation!

---

## Mục Lục

| #   | Phần                                                |
| --- | --------------------------------------------------- |
| 1   | User Types "FM" — "Frontend Masters!"               |
| 2   | Ian: handle + Event Object — "e.target.value = FM!" |
| 3   | name = "FM" — "Data Changed!"                       |
| 4   | updateDOM Again — "else Branch!"                    |
| 5   | Alexa: prevVDOM = [...VDOM] — "Archive!"            |
| 6   | Alexa: VDOM = createVDOM() — "FM in Everything!"    |
| 7   | Tự Implement: User Interaction + Archive            |

---

## §1. User Types "FM" — "Frontend Masters!"

> Will: _"They're gonna type FM — Frontend Masters, yay! That's going to trigger our handle function."_

### User action triggers the flow!

Will: _"FM is going to be set as value on that input node. The event is also fully described in an object AUTO-INSERTED into handle."_

```
USER TYPES "FM":
═══════════════════════════════════════════════════════════════

  User types "FM" → C++ input.value = "FM" (auto!)
  → Event triggered → handle → callback queue!
  → Event object auto-inserted!
```

---

## §2. Ian: handle + Event Object — "e.target.value = FM!"

> Ian: _"The user put in FM, which added handle to the callback queue. We check if call stack is empty — it is — so it's added to the call stack."_

### Ian walks through!

Will: _"We allow it to be GENERIC — we use the event object to identify where this input was happening."_

Ian: _"So we're reassigning the global variable name to — we're accessing the event object."_

Will: _"We have a parameter that is auto assigned — our auto-inserted object."_

Ian: _"The target property is an accessor object for the element the user interacted with. We access the value through the getter method value."_

Will: _"Fantastic — a link to the input element. We use the getter of value to get 'FM' for Frontend Masters."_

---

## §3. name = "FM" — "Data Changed!"

> Ian: _"Name."_ → Will: _"Beautiful. There it is — that's our new data."_

### Data updated!

Ian confirms: `name = "FM"` ✅

Will: _"That's our new data from which we're going to run our simple function that produces our JavaScript representation — an interstitial intermediate step before conversion to C++ DOM elements."_

Handle exits call stack → data ready for next updateDOM cycle!

---

## §4. updateDOM Again — "else Branch!"

> Alexa: _"updateDOM comes back into the callback queue. Event loop checks — global code done, call stack empty."_

### Second updateDOM = else branch!

Alexa: _"updateDOM gets added to the call stack. JavaScript invokes it for us."_

Will: _"Elems — is it undefined anymore?"_ → Alexa: _"No."_

Will: _"It is absolutely NOT undefined. So we hit our ELSE."_

_"We ain't gonna be throwing them out from scratch anymore. Under the hood we're gonna need to do a better job — making INCISIVE changes."_

```
BRANCHING:
═══════════════════════════════════════════════════════════════

  updateDOM() {
    if (!elems) {
      // ← First time (DONE in Part 43!)
    } else {
      // ← NOW! Data changed! ✅
      prevVDOM = [...VDOM];     // archive!
      VDOM = createVDOM();      // new with "FM"!
      findDiff(prevVDOM, VDOM); // compare!
    }
  }
```

---

## §5. Alexa: prevVDOM = [...VDOM] — "Archive!"

> Alexa: _"We're gonna reassign prevVDOM to be a new array into which we SPREAD OUT all of the sub-arrays currently in our VDOM."_
> Will: _"Let's give a hand to Alexa for that one — that's really nice."_ [APPLAUSE]

### Archive old VDOM before re-creating!

Alexa's verbalization (which Will literally copies 😂):

_"Create previous VDOM — a new array — and spread out the sub-elements of VDOM into that new array."_

`prevVDOM = [...VDOM]`:

- New outer array!
- Same sub-arrays spread into it!
- Original VDOM about to be reassigned → but prevVDOM preserves the old state!

```
ARCHIVING:
═══════════════════════════════════════════════════════════════

  BEFORE:
  VDOM = [["input","",handle], ["div","Hello, !"], ["div","great job"]]

  prevVDOM = [...VDOM]:
  ┌──────────────────────────────────────────────────────────┐
  │ prevVDOM = [                                             │
  │   ["input", "", handle],       ← old data!             │
  │   ["div", "Hello, !"],         ← old data!             │
  │   ["div", "great job"],        ← unchanged!            │
  │ ]                                                        │
  │                                                          │
  │ "A new array into which we SPREAD OUT                   │
  │  the sub-arrays!" — Alexa 👏                           │
  └──────────────────────────────────────────────────────────┘
```

---

## §6. Alexa: VDOM = createVDOM() — "FM in Everything!"

> Alexa: _"We reassign VDOM to the evaluated result of invoking createVDOM."_

### New VDOM with "FM"!

Alexa verbalize new VDOM:

1. _"String 'input', string 'FM', function handle."_
2. _"String 'div', string 'Hello, FM!'"_
3. _"String 'div', string 'great job'."_

Will: _"I'm feeling ANTICIPATION as we get to this final part!"_

```
NEW VDOM:
═══════════════════════════════════════════════════════════════

  VDOM = createVDOM() (with name = "FM"):

  VDOM = [
    ["input", "FM", handle],      ← NEW! "FM"!
    ["div", "Hello, FM!"],         ← NEW! "FM"!
    ["div", "great job"],          ← SAME!
  ]

  "I can already see I need to do comparisons —
   but I'm NOT gonna throw out my entire C++ DOM!" — Will 🎯
```

---

## §7. Tự Implement: User Interaction + Archive

```javascript
// ═══ User Interaction + Archive ═══

let name = "";
let VDOM, prevVDOM, elems;

function createVDOM() {
  return [
    ["input", name, "handle"],
    ["div", `Hello, ${name}!`],
    ["div", "great job"],
  ];
}

VDOM = createVDOM();

function handle(e) {
  name = e.target.value;
}

// Simulate
console.log("═══ MOUNTING ═══");
console.log("VDOM:", JSON.stringify(VDOM));

// Simulate user typing "FM"
console.log("\n═══ USER TYPES 'FM' ═══");
handle({ target: { value: "FM" } });
console.log("name =", name);

// Archive + re-create
console.log("\n═══ ARCHIVE + RE-CREATE ═══");
prevVDOM = [...VDOM];
VDOM = createVDOM();

console.log("prevVDOM:", JSON.stringify(prevVDOM));
console.log("VDOM:    ", JSON.stringify(VDOM));

console.log("\nComparison:");
for (let i = 0; i < VDOM.length; i++) {
  const same = JSON.stringify(prevVDOM[i]) === JSON.stringify(VDOM[i]);
  console.log(`  [${i}] ${same ? "SAME → skip!" : "DIFFERENT → update!"}`);
}

console.log("\n✅ prevVDOM archives old state!");
console.log("✅ VDOM gets new data!");
console.log("✅ Ready for findDiff!");
```

---

## Checklist

```
[ ] User types "FM" → e.target.value = "FM"!
[ ] Ian: handle → name = "FM" → data changed!
[ ] updateDOM else branch: elems NOT undefined!
[ ] Alexa: prevVDOM = [...VDOM] → archive old!
[ ] Alexa: VDOM = createVDOM() → new with "FM"!
[ ] New VDOM: input FM, Hello FM!, great job!
[ ] "I can see I need comparisons — but NOT throw out C++DOM!" — Will
TIẾP THEO → Phần 45: Diffing Algorithm!
```
