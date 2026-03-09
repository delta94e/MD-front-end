# The Hard Parts of UI Development — Phần 29: UI Component Interaction — "User Types 'Will', Ternary, Garbage Collection!"

> 📅 2026-03-08 · ⏱ 40 phút đọc
>
> Nguồn: Frontend Masters — Will Sentance
> Khoá học: The Hard Parts of UI Development
> Bài: UI Component Interaction — "Metric: Callback Queue, Wye: Ternary, Alexa: Garbage Collection!"
> Độ khó: ⭐️⭐️⭐️⭐️⭐️ | Advanced — handleInput execution, brand new elements, ternary + empty string, focus(), garbage collection, component definition!

---

## Mục Lục

| #   | Phần                                                          |
| --- | ------------------------------------------------------------- |
| 1   | User Types "Will" — "Metric: Callback Queue → Call Stack!"    |
| 2   | handleInput — "Only Change Data, That's It!"                  |
| 3   | dataToView Re-Run — "Brand New Elements, Alexa!"              |
| 4   | Ternary: post === "will" — "Wye: Empty String, No Div!"       |
| 5   | replaceChildren — "Wye: Just Input, Unappend Old!"            |
| 6   | focus() Revisited — "Won't Even Notice!"                      |
| 7   | Performance Preview — "1000 Elements, Really?"                |
| 8   | Alexa's Question — "Garbage Collection, Memory Leaks!"        |
| 9   | UI Component Definition — "Full Description, All Conditions!" |
| 10  | Reusability — "Run It 20 Times!"                              |
| 11  | Tự Implement: Full Interaction Cycle + GC                     |
| 12  | 🔬 Deep Analysis Patterns — Component as Full Description     |

---

## §1. User Types "Will" — "Metric: Callback Queue → Call Stack!"

> Will: _"It's not a closed system, it's a system where users can come in and cause events."_

### User action: type "will"!

User types "will" → value hiện trên C++ input **tự động** (C++ tự handle!). Rồi event fired → handleInput vào callback queue.

Metric verbalize:

- _"Is it assigned to callback queue first?"_ → Will: _"Yes."_
- _"And then the message loop is gonna put it to call stack."_ → Will: _"Yes, perfect."_

Will: _"We don't add parens, instead we rely on JavaScript doing so."_

```
USER TYPES "will":
═══════════════════════════════════════════════════════════════

  t=1min: User types "will"
  ┌──────────────────────────────────────────────────────────┐
  │ C++ input.value = "will"  ← AUTO! (C++ handles!)      │
  │ Event fired → "please execute handleInput!"            │
  └──────────────────────────────────────────────────────────┘

  Metric: "Assigned to callback queue first?"
  Will: "YES!"
  Metric: "Message loop puts it to call stack."
  Will: "YES, perfect!" ✅

  ┌──────────────────────────────────────────────────────────┐
  │ callback queue: [handleInput] → event loop → call stack│
  │ → New execution context! 📦                             │
  └──────────────────────────────────────────────────────────┘
```

---

## §2. handleInput — "Only Change Data, That's It!"

> Will: _"It's a very small one because all it's gonna do is CHANGE DATA. That's the ONLY thing we can do."_

### post = jsInput.value → chỉ data!

Will nhấn mạnh: handleInput **rất nhỏ** — chỉ thay đổi data!

_"All it's gonna do is change data, that's the only thing we can do is change data."_

`post = jsInput.value` → getter → C++ input.value = "will" → post = "will"!

Will: _"How nice that we know our data changes happening in ONE handler function. Not lots of different things displaying content — JUST changing data."_

_"It's not a truth, it's a MOVE, it's an effort, it's a TACTIC to make our lives easier to reason about this complex state and view relationship."_

```
handleInput — CHỈ DATA:
═══════════════════════════════════════════════════════════════

  handleInput():
  ┌──────────────────────────────────────────────────────────┐
  │ post = jsInput.value;                                    │
  │                                                          │
  │ jsInput.value → GETTER → C++ input.value = "will"     │
  │ post = "will" ✅                                        │
  │                                                          │
  │ "ALL it does is change DATA.                            │
  │  That's the ONLY thing we can do." — Will               │
  │                                                          │
  │ "Not a truth, it's a TACTIC." — Will                   │
  └──────────────────────────────────────────────────────────┘
```

---

## §3. dataToView Re-Run — "Brand New Elements, Alexa!"

> Alexa: _"We're gonna use that createElement method on the document object to create a new unattached input."_
> Will: _"We truly know that it's lost its JavaScript label — we are reassigning to a BRAND NEW object."_

### createElement = BRAND NEW mỗi lần!

dataToView chạy lại (15ms timer) → Alexa verbalize:

_"We're gonna create a brand new JavaScript object with createElement."_
_"It's just floating around in there."_ (unattached!)

Will nhấn mạnh: **jsInput reassigned** → old accessor object **mất label**!

_"We truly know that it's lost its JavaScript label, this input element here, because we are reassigning to a BRAND NEW object as the output of createElement."_

Cả old C++ input element cũng **mất reference**:

- jsInput label → points to NEW accessor
- Old accessor → no label → eligible for GC!
- Old C++ input → no JS reference → eligible for GC!

```
BRAND NEW ELEMENTS:
═══════════════════════════════════════════════════════════════

  TRƯỚC dataToView re-run:
  ┌──────────────────────────────────────────────────────────┐
  │ jsInput → accessor_1 → C++ input_1 (attached, "will") │
  │ post = "will"                                            │
  └──────────────────────────────────────────────────────────┘

  SAU dataToView re-run:
  ┌──────────────────────────────────────────────────────────┐
  │ jsInput → accessor_2 → C++ input_2 (NEW! unattached!) │
  │                                                          │
  │ accessor_1 → (no label! orphaned! 👻)                  │
  │ C++ input_1 → (no reference! GC candidate!)            │
  │                                                          │
  │ "BRAND NEW object. Old one lost its label." — Will     │
  │ Alexa: "It's just FLOATING around in there." 😄       │
  └──────────────────────────────────────────────────────────┘
```

---

## §4. Ternary: post === "will" — "Wye: Empty String, No Div!"

> Wye: _"We check the value of post which currently is 'will'. As a result, we're reassigning jsDiv to an empty string."_

### post === "will" → jsDiv = "" → NO div!

Wye verbalize ternary:

1. _"First we execute the ternary statement."_
2. _"Check the value of post — which is 'will'."_
3. _"Is it true? YES."_ (post === "will" is true!)
4. _"We're NOT creating accessor objects, NOT creating a new node — we're reassigning jsDiv to an empty string."_

Will: _"Fantastic."_ → jsDiv = "" → no createElement("div") → no div on page!

```
TERNARY — post === "will":
═══════════════════════════════════════════════════════════════

  jsDiv = post !== "will" ? createElement("div") : ""

  post = "will":
  ┌──────────────────────────────────────────────────────────┐
  │ "will" !== "will" → FALSE!                              │
  │ → jsDiv = "" (empty string!)                           │
  │                                                          │
  │ Wye: "Not creating accessor objects,                    │
  │       not creating a new node —                         │
  │       reassigning jsDiv to empty string." ✅            │
  └──────────────────────────────────────────────────────────┘

  RESULT:
  ┌──────────────────────────────────────────────────────────┐
  │ jsInput = accessor → C++ input (value: "will") ✅     │
  │ jsDiv = "" ← empty string, NOT an element! ❌          │
  └──────────────────────────────────────────────────────────┘
```

---

## §5. replaceChildren — "Wye: Just Input, Unappend Old!"

> Wye: _"Of the two arguments, jsInput is similar to before. jsDiv however is just an empty string — essentially ignored."_
> Will: _"These two get UNAPPENDED."_

### replaceChildren(jsInput, "") → only input!

Wye verbalize replaceChildren:

- _"Call replaceChildren on body, property of document."_
- _"First argument jsInput — attaching to DOM."_ ✅
- _"Second argument jsDiv — currently just an empty string."_ → ignored!

Will: _"jsDiv as empty string acts as 'ignore this element, don't append it.'"_

Old elements (input_1, div_1): **unappended**! New input_2: **appended**!

Will nhắc Paul's earlier question: _"jsDiv setting textContent — I skipped over it knowing it WON'T BREAK."_ → set textContent on empty string = silently ignored!

```
replaceChildren — ONLY INPUT:
═══════════════════════════════════════════════════════════════

  document.body.replaceChildren(jsInput, jsDiv):
  → replaceChildren(accessor, "") → "" = IGNORED!

  BEFORE:
  ┌──────────────────────────────────────────────────────────┐
  │ body.children: [input_1, div_1]                         │
  └──────────────────────────────────────────────────────────┘

  AFTER:
  ┌──────────────────────────────────────────────────────────┐
  │ body.children: [input_2]  ← ONLY input!               │
  │                                                          │
  │ input_1: UNAPPENDED! (orphaned!)                        │
  │ div_1: UNAPPENDED! (orphaned!)                          │
  └──────────────────────────────────────────────────────────┘

  PIXELS:
  ┌──────────────────────────┐
  │ [will____________]       │ ← input only!
  │                          │ ← NO div!
  └──────────────────────────┘

  Wye: "jsDiv is just an empty string — IGNORED!" ✅
```

---

## §6. focus() Revisited — "Won't Even Notice!"

> Will: _"The user won't even notice a difference as long as we set for that element to be REFOCUSED."_

### Brand new element + focus() = seamless!

Will: brand new input element mỗi 15ms → user KHÔNG nhận ra nếu có focus():

_"A whole brand new element is being appended with 'Will'. The user won't even notice as long as we set for that element to be refocused via jsInput.focus()."_

_"As they're writing, they're not like 'I wrote a letter' — 15 milliseconds too fast — it will bounce out if we didn't write anything."_

→ focus() = essential glue giữ UX mượt mà khi recreate elements!

```
focus() — SEAMLESS UX:
═══════════════════════════════════════════════════════════════

  WITHOUT focus():
  ┌──────────────────────────────────────────────────────────┐
  │ t=0ms:   User typing in input_1 ✅                     │
  │ t=15ms:  input_2 replaces input_1 → CURSOR GONE! ❌   │
  │ t=16ms:  User confused... clicks BACK in... 😤        │
  │ t=30ms:  input_3 replaces input_2 → CURSOR GONE! ❌   │
  │ → UNUSABLE! 💀                                        │
  └──────────────────────────────────────────────────────────┘

  WITH focus():
  ┌──────────────────────────────────────────────────────────┐
  │ t=0ms:   User typing in input_1 ✅                     │
  │ t=15ms:  input_2 replaces → focus() → CURSOR! ✅      │
  │ t=30ms:  input_3 replaces → focus() → CURSOR! ✅      │
  │ → SEAMLESS! "Won't even notice!" — Will 🎉           │
  └──────────────────────────────────────────────────────────┘
```

---

## §7. Performance Preview — "1000 Elements, Really?"

> Will: _"We could have 1000 elements — are we really going to RECREATE all of them every time a minor detail in data changes?"_

### Trade-off: simplicity vs performance!

Will flag performance concern:

_"While it gives us a full picture of what's gonna be displayed from our data in JavaScript — which we could even use to DRAW OUT in JavaScript elements before they appear on the DOM..."_

_"The DOWNSIDE: we are RECREATING elements on the DOM. We could have 1000 of them. Are we really going to have that on every single time a minor detail in data changes?"_

→ Đây là preview cho Virtual DOM + diff algorithm! Thay vì recreate all → chỉ update **changes**!

```
PERFORMANCE PREVIEW:
═══════════════════════════════════════════════════════════════

  CURRENT (recreate all!):
  ┌──────────────────────────────────────────────────────────┐
  │ 1000 elements on page                                    │
  │ User changes 1 character                                 │
  │ → RECREATE all 1000 elements! (15ms later!)            │
  │ → Expensive! 😰                                        │
  └──────────────────────────────────────────────────────────┘

  IDEAL (diff + update!):
  ┌──────────────────────────────────────────────────────────┐
  │ 1000 elements on page                                    │
  │ User changes 1 character                                 │
  │ → Compare old vs new (in JS!)                          │
  │ → Update ONLY the 1 element that changed! ✅           │
  │ → Fast! 🚀                                             │
  └──────────────────────────────────────────────────────────┘

  "Are we REALLY going to recreate 1000 elements
   every time a MINOR detail changes?" — Will 🤔
```

---

## §8. Alexa's Question — "Garbage Collection, Memory Leaks!"

> Alexa: _"When we replaceChildren and unattach the previous elements, because we no longer have a JavaScript pointer — immediately garbage collected?"_
> Will: _"It's gonna depend on the engine design."_

### Memory leak vs garbage collection

Alexa hỏi: old elements bị unattach + old accessor mất label → GC ngay?

Will: _"It depends on the engine design."_ Rồi đề cập Microsoft tool:

_"Microsoft has a tool that allows you to look for memory leaks — elements on the DOM that do NOT have labels in JavaScript but are NOT attached. They're only retrievable by a label, but the label's gone — that would be a memory leak."_

_"In practice, once they're replaced in a modern browser, they WILL be cleaned up and removed."_

→ Modern browsers: GC handles! Older browsers: potential memory leak!

```
GARBAGE COLLECTION:
═══════════════════════════════════════════════════════════════

  replaceChildren(input_2) → input_1, div_1 UNAPPENDED!

  Q: Are old elements garbage collected?

  ┌──────────────────────────────────────────────────────────┐
  │ OLD input_1:                                             │
  │ → JS label (jsInput)? NO! (reassigned to accessor_2!)  │
  │ → Attached to DOM? NO! (replaced!)                     │
  │ → querySelector find it? NO!                            │
  │ → Traversal API reach it? NO!                           │
  │ → UNREACHABLE! → GC candidate! 🗑️                    │
  └──────────────────────────────────────────────────────────┘

  Will: "In modern browsers → CLEANED UP."
  Will: "Microsoft has a tool to detect memory leaks."
  Will: "It depends on the ENGINE DESIGN."
```

---

## §9. UI Component Definition — "Full Description, All Conditions!"

> Will: _"A function that describes in full: underlying data, its appearance on the page under ALL CONDITIONS of what that data could be, under ALL CONDITIONS of user interaction history."_

### Component captures EVERYTHING!

Will's complete definition:

_"A component describes in full: underlying data, and its appearance on the page under ALL CONDITIONS of what that underlying data could be, under ALL conditions of what their history of user interaction is."_

_"Because ALL user action ends up becoming STATE. Therefore, a function that describes the translation of that state, that data to view, is a FULL description of the entire piece of content."_

UI Component:

1. **Data** → state (post!)
2. **View** → createElement + content + replaceChildren
3. **Handler** → user action → data change
4. **Binding** → oninput + setInterval
5. = **Full description** of data ↔ view relationship!

Will: _"Two things we're doing: One, display content. Two, let the user CHANGE the content."_

```
UI COMPONENT — FULL DEFINITION:
═══════════════════════════════════════════════════════════════

  ┌──────────────────────────────────────────────────────────┐
  │ COMPONENT = function that captures IN FULL:             │
  │                                                          │
  │ 1. DATA: post = "" | "will" | "hello" | ...            │
  │                                                          │
  │ 2. VIEW (all conditions!):                               │
  │    post = "" → input(empty) + div(empty)               │
  │    post = "will" → input("will") + NO div!             │
  │    post = "hello" → input("hello") + div("hello")      │
  │                                                          │
  │ 3. HANDLER: user action → post = typed                 │
  │                                                          │
  │ 4. BINDING: oninput + setInterval(dataToView, 15)       │
  │                                                          │
  │ = "ALL possible conditions captured!" — Will            │
  │ = "Full description of the entire piece of content!"   │
  └──────────────────────────────────────────────────────────┘
```

---

## §10. Reusability — "Run It 20 Times!"

> Will: _"You could now RUN that 20 times and have 20 input previews."_

### Component = reusable unit!

Will: nếu component có tên (vd: `inputPreview`) → run 20 lần → 20 instances!

_"Once you have one component, you could have OTHERS. You could rerun this one. Give it a name like 'input preview' — run it 20 times and have 20 input previews."_

Caveat (global variables):

_"Ours wouldn't quite work because we're globally saving them. In practice, we wouldn't globally save them. We'd keep them in here — that handler would have access via CLOSURE."_

React, Angular, Vue, Svelte → **all built on UI components** vì lý do này!

```
REUSABILITY:
═══════════════════════════════════════════════════════════════

  WILL's CODE (global — not reusable!):
  ┌──────────────────────────────────────────────────────────┐
  │ let post = "";     ← global! Only 1 instance!         │
  │ let jsInput;       ← global! Shared!                   │
  │                                                          │
  │ → Can't run 20 times!                                  │
  └──────────────────────────────────────────────────────────┘

  REAL CODE (closure — reusable!):
  ┌──────────────────────────────────────────────────────────┐
  │ function InputPreview() {                                │
  │   let post = "";     ← local! Per-instance!            │
  │   let jsInput;       ← local! Per-instance!            │
  │   // ... closure access!                                 │
  │ }                                                        │
  │                                                          │
  │ InputPreview()  → instance 1!                           │
  │ InputPreview()  → instance 2!                           │
  │ InputPreview()  → instance 3! ... × 20!                │
  │                                                          │
  │ "Run it 20 times → 20 input previews!" — Will          │
  └──────────────────────────────────────────────────────────┘

  React/Angular/Vue/Svelte → ALL built on components! 🎉
```

---

## §11. Tự Implement: Full Interaction Cycle + GC

```javascript
// ═══════════════════════════════════════════════════
// Mô phỏng — Full UI Component Interaction + GC!
// ═══════════════════════════════════════════════════

let gcLog = [];

class CppEl {
  static count = 0;
  constructor(type) {
    this.id = ++CppEl.count;
    this.type = type;
    this.value = "";
    this.text = "";
    this.attached = false;
  }
}

class Body {
  constructor() {
    this.children = [];
  }

  replaceChildren(...els) {
    const valid = els.filter((e) => e instanceof CppEl);
    // Old children become unattached!
    for (const old of this.children) {
      if (!valid.includes(old)) {
        old.attached = false;
        gcLog.push(`  🗑️ ${old.type}#${old.id} UNAPPENDED → GC candidate!`);
      }
    }
    this.children = valid;
    for (const el of valid) el.attached = true;
  }
}

const body = new Body();

function acc(el) {
  return {
    get value() {
      return el.value;
    },
    set value(v) {
      el.value = v;
    },
    get textContent() {
      return el.text;
    },
    set textContent(v) {
      if (typeof v === "string") el.text = v;
    },
    set oninput(fn) {
      el.handler = fn;
    },
    focus() {
      console.log(`  🎯 ${el.type}#${el.id}.focus()!`);
    },
    _el: el,
  };
}

// ═══ UI COMPONENT ═══

let post = "";
let jsInput;
let jsDiv;

function dataToView() {
  // Brand new elements each time!
  const inputEl = new CppEl("input");
  jsInput = acc(inputEl);
  jsInput.value = post;
  jsInput.oninput = handleInput;

  if (post !== "will") {
    const divEl = new CppEl("div");
    jsDiv = acc(divEl);
    jsDiv.textContent = post;
    body.replaceChildren(inputEl, divEl);
  } else {
    jsDiv = "";
    body.replaceChildren(inputEl);
  }

  jsInput.focus();
}

function handleInput(typed) {
  post = typed;
}

// ═══ DEMO ═══

console.log("═══ FULL INTERACTION CYCLE ═══\n");

console.log("── RENDER 1: Initial (post='') ──");
dataToView();
console.log(
  `  Page: [${body.children.map((c) => `${c.type}#${c.id}`).join(", ")}]`,
);

console.log("\n── USER types 'hello' ──");
handleInput("hello");
console.log("  post = 'hello'");

console.log("\n── RENDER 2: (post='hello') ──");
gcLog = [];
dataToView();
gcLog.forEach((l) => console.log(l));
console.log(
  `  Page: [${body.children.map((c) => `${c.type}#${c.id}(${c.value || c.text})`).join(", ")}]`,
);

console.log("\n── USER types 'will' ──");
handleInput("will");
console.log("  post = 'will'");

console.log("\n── RENDER 3: (post='will') → NO DIV! ──");
gcLog = [];
dataToView();
gcLog.forEach((l) => console.log(l));
console.log(
  `  Page: [${body.children.map((c) => `${c.type}#${c.id}(${c.value})`).join(", ")}]`,
);
console.log("  → Div GONE! Only input! ✅");

console.log("\n── USER types 'hi' ──");
handleInput("hi");

console.log("\n── RENDER 4: (post='hi') → DIV BACK! ──");
gcLog = [];
dataToView();
gcLog.forEach((l) => console.log(l));
console.log(
  `  Page: [${body.children.map((c) => `${c.type}#${c.id}(${c.value || c.text})`).join(", ")}]`,
);
console.log("  → Div BACK! Both elements! ✅");

console.log(`\n  Total C++ elements created: ${CppEl.count}`);
console.log("  → Brand new each render (recreate all!)");
console.log("  → Old elements GC'd (modern browser!) 🗑️");
```

---

## §12. 🔬 Deep Analysis Patterns — Component as Full Description

### 12.1 Pattern ①: Component = f(state) → view

```
COMPONENT = f(state) → view:
═══════════════════════════════════════════════════════════════

  Mathematical model:
  ┌──────────────────────────────────────────────────────────┐
  │ view = dataToView(state)                                 │
  │                                                          │
  │ state = { post: "" }     → view = [input, div(empty)] │
  │ state = { post: "hi" }   → view = [input("hi"), div]  │
  │ state = { post: "will" } → view = [input("will")]     │
  │                                                          │
  │ "ALL possible conditions captured!" — Will              │
  │ = React: UI = f(state)                                  │
  │ = Pure function of state!                                │
  └──────────────────────────────────────────────────────────┘
```

### 12.2 Pattern ②: User History → State → View

```
USER HISTORY DOESN'T MATTER:
═══════════════════════════════════════════════════════════════

  ❌ AD-HOC: "What did user do before?"
  ┌──────────────────────────────────────────────────────────┐
  │ Click → type "a" → delete → type "will" → ???        │
  │ Must trace ENTIRE history! Exponential paths!           │
  └──────────────────────────────────────────────────────────┘

  ✅ COMPONENT: "What is state RIGHT NOW?"
  ┌──────────────────────────────────────────────────────────┐
  │ post = "will" → view = [input("will")] ← DONE!       │
  │ Don't care HOW we got here!                             │
  │ "Under ALL conditions of user history" — Will           │
  └──────────────────────────────────────────────────────────┘
```

---

## Self-Assessment Checklist

```
CHECKLIST — SAU KHI HỌC PHẦN 29:
═══════════════════════════════════════════════════════════════

  USER INTERACTION:
  [ ] User types → C++ auto-updates value!
  [ ] Event → callback queue → call stack!
  [ ] Metric: "Message loop puts it to call stack!" ✅

  handleInput:
  [ ] post = jsInput.value (GETTER!)
  [ ] "ONLY change data, that's IT!" — Will
  [ ] "Not a truth, it's a TACTIC!"

  BRAND NEW ELEMENTS:
  [ ] createElement = NEW C++ object mỗi lần!
  [ ] Old accessor loses label (jsInput reassigned!)
  [ ] Old C++ element → GC candidate!

  TERNARY:
  [ ] post === "will" → jsDiv = "" (no div!)
  [ ] "" passed to replaceChildren = ignored!
  [ ] Wye: "Not creating accessor, just empty string!" ✅

  GC + MEMORY:
  [ ] Alexa: "Immediately garbage collected?"
  [ ] Will: "Depends on engine design."
  [ ] Modern browsers: cleaned up! ✅
  [ ] Microsoft tool for memory leak detection!

  COMPONENT DEFINITION:
  [ ] Full description: data + view + handler + binding!
  [ ] "ALL conditions of data" covered!
  [ ] "ALL conditions of user history" captured!
  [ ] Reusable: run 20 times → 20 instances!

  TIẾP THEO → Phần 30: Emulate HTML with String Interpolation!
```
