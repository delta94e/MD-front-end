# The Hard Parts of UI Development — Phần 20: One-Way Data Binding UI Elements — "Setup Walkthrough!"

> 📅 2026-03-08 · ⏱ 40 phút đọc
>
> Nguồn: Frontend Masters — Will Sentance
> Khoá học: The Hard Parts of UI Development
> Bài: One-Way Data Binding UI Elements — "Phil, Alexa Setup + First dataToView Run!"
> Độ khó: ⭐️⭐️⭐️⭐️⭐️ | Advanced — three states, dataToView first run, ternary, undefined → empty string, paradigm shift!

---

## Mục Lục

| #   | Phần                                                    |
| --- | ------------------------------------------------------- |
| 1   | Three States of Data — "undefined, '', 'Ian'!"          |
| 2   | Phil: querySelector + Accessor Objects — "By Analogy!"  |
| 3   | Alexa: Handler Bindings — "onclick, oninput!"           |
| 4   | Paradigm Restriction — "Nothing Not Traceable to Data!" |
| 5   | dataToView First Run — "Convert Data to View!"          |
| 6   | Ternary Logic — "Post Undefined? → 'What's up?'"        |
| 7   | textContent + undefined — "Empty String Magic!"         |
| 8   | Tự Implement: Three-State dataToView                    |
| 9   | 🔬 Deep Analysis Patterns — State-Driven Views          |

---

## §1. Three States of Data — "undefined, '', 'Ian'!"

> Will: _"We've got three different stages of our data here. Post can be undefined, empty string, and then whatever the user is typing."_

### Bối cảnh — Paradigm shift: define view qua data!

Will giới thiệu paradigm shift quan trọng nhất: **define what the user can see in terms of different possible values for our data** — xác định user thấy gì dựa trên **các giá trị có thể** của data!

Post có **3 trạng thái** (states):

| State | Giá trị     | Ý nghĩa            | User thấy gì              |
| ----- | ----------- | ------------------ | ------------------------- |
| ①     | `undefined` | Chưa bắt đầu       | Default text "What's up?" |
| ②     | `""`        | Đã click (cleared) | Input trống               |
| ③     | `"Ian"`     | Đang gõ            | Preview text              |

Will: _"That's the shift of mentality we have to go to: define what the user can see in terms of different possible values for our data."_

Phil bắt đầu: _"We're gonna declare a post let variable and initialize it to the value of undefined."_ — Lần đầu dùng `let` thay `const` vì data SẼ THAY ĐỔI!

```
THREE STATES OF DATA:
═══════════════════════════════════════════════════════════════

  let post;  // ← UNDEFINED! (không phải "")

  ┌────────────────────┬────────────────┬──────────────────┐
  │ STATE ①            │ STATE ②        │ STATE ③          │
  │ post = undefined   │ post = ""      │ post = "Ian"     │
  ├────────────────────┼────────────────┼──────────────────┤
  │ Chưa bắt đầu     │ Đã click      │ Đang gõ         │
  │ "What's up?"       │ (trống)        │ "Ian"            │
  │ Default text!      │ Ready to type! │ Preview!         │
  └────────────────────┴────────────────┴──────────────────┘

  PARADIGM SHIFT:
  ┌──────────────────────────────────────────────────────────┐
  │ CŨ:  "Khi user click → clear input"                    │
  │       "Khi user gõ → show text"                        │
  │       → Reasoning theo ACTIONS!                         │
  │                                                          │
  │ MỚI: "Nếu post = undefined → show 'What's up?'"       │
  │       "Nếu post = '' → show nothing"                   │
  │       "Nếu post = 'Ian' → show 'Ian'"                 │
  │       → Reasoning theo DATA STATES!                     │
  └──────────────────────────────────────────────────────────┘

  "Define what the user can SEE in terms of different
   possible VALUES for our data." — Will
```

---

## §2. Phil: querySelector + Accessor Objects — "By Analogy!"

> Phil: _"We're gonna declare a variable jsInput and initialize it to the evaluated results of running the querySelector method on the document object, passing in the argument of input."_

### Phil verbalize — Perfect!

Phil mô tả hoàn hảo từng bước:

1. _"Declare a variable jsInput"_
2. _"Initialize it to the evaluated results of running querySelector"_
3. _"On the document object, passing the argument of input"_
4. _"This allows us to access the actual C++ DOM, searching for a node of the value of input"_
5. _"Because we can't bring that C++ object back into JavaScript — we create an accessor object"_
6. _"Stored under jsInput"_

Will hỏi tiếp: properties nào trên accessor object? Phil: _"value"_ → Will: _"What about onclick?"_ → Phil: _"onclick, oninput"_ → 3 getter/setter properties!

jsDiv setup **by analogy** — Will tiết kiệm thời gian: _"By analogy we can do again, right?"_:

- querySelector("div") → accessor object
- Hidden link → C++ div element
- textContent getter/setter

```
ACCESSOR OBJECTS — Phil's Walkthrough:
═══════════════════════════════════════════════════════════════

  jsInput = document.querySelector("input"):
  ┌──────────────────────────────────────────────────────────┐
  │ jsInput = {                                              │
  │   [[link]] → C++ input element                          │
  │   value: [getter/setter]     ← Phil: "dot value"      │
  │   onclick: [setter]          ← Phil: "onclick"         │
  │   oninput: [setter]          ← Phil: "oninput"         │
  │ }                                                        │
  │                                                          │
  │ Phil: "Because we can't bring that C++ object back      │
  │        into JavaScript — we create an ACCESSOR OBJECT." │
  └──────────────────────────────────────────────────────────┘

  jsDiv = document.querySelector("div"):
  ┌──────────────────────────────────────────────────────────┐
  │ jsDiv = {                                                │
  │   [[link]] → C++ div element (FIRST div found!)        │
  │   textContent: [getter/setter]                           │
  │ }                                                        │
  │                                                          │
  │ Will: "By analogy. What element? The FIRST div."        │
  └──────────────────────────────────────────────────────────┘
```

---

## §3. Alexa: Handler Bindings — "onclick, oninput!"

> Alexa: _"We're gonna find our jsInput object and use the onclick setter to set our handleClick function as the callback."_

### Function definitions + Handler bindings

Will liệt kê **3 functions** cần define:

- `dataToView` — "the BIG DEAL function" / "spray out" (phun ra toàn bộ view!)
- `handleClick` — "pinpoint in" (nhận data từ 1 điểm!)
- `handleInput` — "pinpoint in" (nhận data từ 1 điểm!)

Will giới thiệu metaphor hay: **"spray out" vs "pinpoint in"**:

- dataToView = **spray out** — phun data ra TẤT CẢ elements!
- handlers = **pinpoint in** — nhận data từ MỘT action cụ thể!

Will cũng nhận xét về thứ tự code: _"I reordered these here. HandleClick and handleInput, and THEN the onclick and oninput assignment. Just because the user is gonna click FIRST... but it has obviously NO EFFECT."_ — Thứ tự trong code KHÔNG ảnh hưởng behavior, chỉ cho dễ đọc!

**Alexa** verbalize handler binding:

1. _"Find our jsInput object"_
2. _"Use the onclick setter to set handleClick as the callback"_
3. _"For handling the event that a user clicks"_

```
FUNCTION DEFINITIONS + BINDINGS:
═══════════════════════════════════════════════════════════════

  FUNCTIONS:
  ┌──────────────────────────────────────────────────────────┐
  │ dataToView()   ← "SPRAY OUT!" 🌊                       │
  │ → Phun data ra TẤT CẢ elements!                       │
  │ → Convert data → view!                                 │
  │                                                          │
  │ handleClick()  ← "PINPOINT IN!" 🎯                     │
  │ → Nhận data từ 1 action!                               │
  │                                                          │
  │ handleInput()  ← "PINPOINT IN!" 🎯                     │
  │ → Nhận data từ 1 action!                               │
  └──────────────────────────────────────────────────────────┘

  BINDINGS (Alexa):
  ┌──────────────────────────────────────────────────────────┐
  │ jsInput.onclick = handleClick;                           │
  │ → "Set handleClick as the CALLBACK for click event"    │
  │                                                          │
  │ jsInput.oninput = handleInput;                           │
  │ → "Set handleInput as callback for input event"        │
  │                                                          │
  │ C++ DOM:                                                 │
  │ input: handler["click"] → handleClick                  │
  │        handler["input"] → handleInput                  │
  └──────────────────────────────────────────────────────────┘
```

---

## §4. Paradigm Restriction — "Nothing Not Traceable to Data!"

> Will: _"There should be nothing in the value and textContent of DOM elements that is not traceable back to some data in JavaScript."_

### Golden Rule!

Will tuyên bố **quy tắc vàng** của one-way data binding:

_"There should be NOTHING in the value and textContent of DOM elements — in other words, no content that the user sees — that is NOT TRACEABLE BACK to some data in JavaScript."_

**Translation**: Mọi thứ user thấy → PHẢI trace ngược về data trong JavaScript! Không có "magic text" xuất hiện từ đâu. Mọi pixel hiển thị = f(data)!

_"What a GREAT restriction on ourselves. What a way to be GUARANTEED to know what's displaying on the page — it's whatever's here [in JavaScript]."_

Will gọi đây là **State-Driven Views**: _"State-driven views, we've heard multiple words for it. But this is a PARADIGM SHIFT, honestly, in UI engineering."_

```
GOLDEN RULE — TRACEABLE TO DATA:
═══════════════════════════════════════════════════════════════

  ┌──────────────────────────────────────────────────────────┐
  │ "There should be NOTHING that the user sees              │
  │  that is NOT TRACEABLE BACK to some data                │
  │  in JavaScript."                                         │
  │                                                          │
  │ → User thấy "What's up?"                               │
  │   ← Traceable: post === undefined → ternary!           │
  │                                                          │
  │ → User thấy "Ian"                                      │
  │   ← Traceable: post === "Ian"!                          │
  │                                                          │
  │ → User thấy (trống)                                    │
  │   ← Traceable: post === ""!                              │
  │                                                          │
  │ ❌ KHÔNG BAO GIỜ có text mà KHÔNG có data!             │
  │ ✅ 100% view = f(data)!                                 │
  └──────────────────────────────────────────────────────────┘

  "What a GREAT RESTRICTION on ourselves.
   What a way to be GUARANTEED to know what's
   displaying on the page." — Will
```

---

## §5. dataToView First Run — "Convert Data to View!"

> Will: _"Let's run our dataToView converter function. Execution context, brand new, everyone together."_
> Class: _"Execution context!"_

### Chạy dataToView() lần đầu!

Will hào hứng: _"Its job is to CONVERT our data to our view."_ Rồi bổ sung: _"That conversion might include DETERMINING — based on the data, determine what to display."_

dataToView() chạy → execution context mới! Bên trong:

```javascript
function dataToView() {
  jsInput.value = post !== undefined ? post : "What's up?";
  jsDiv.textContent = post;
}
```

Hai dòng code → quyết định **TOÀN BỘ** view! _"We've got our one function here, we're done."_

```
dataToView() — FIRST RUN:
═══════════════════════════════════════════════════════════════

  EXECUTION CONTEXT: dataToView()
  ┌──────────────────────────────────────────────────────────┐
  │                                                          │
  │ DATA: post = undefined (state ①!)                       │
  │                                                          │
  │ LINE 1: jsInput.value = post !== undefined               │
  │                         ? post : "What's up?";          │
  │         → post === undefined? YES!                       │
  │         → ternary → "What's up?"                        │
  │         → SETTER → C++ input.value = "What's up?"      │
  │                                                          │
  │ LINE 2: jsDiv.textContent = post;                        │
  │         → post = undefined                               │
  │         → textContent setter: undefined → ""!            │
  │         → C++ div.text = "" (empty!)                    │
  │                                                          │
  └──────────────────────────────────────────────────────────┘

  PIXELS:
  ┌────────────────────────────────────────────┐
  │ [What's up?_______]  ← input (default!)  │
  │                       ← div (empty!) ✅   │
  └────────────────────────────────────────────┘
```

---

## §6. Ternary Logic — "Post Undefined? → 'What's up?'"

> Justice: _"If post is undefined..."_
> Will: _"Is it undefined? It IS undefined."_

### Ternary operator — Conditional data → view

Will hỏi Justice: _"Is post undefined?"_ → Justice: _"It is undefined, yes."_ → Will: _"What are we going to assign?"_ → Justice: _"A string 'What's up?'"_

Will hỏi lại: _"Anyone have a better word for 'the first thing in it'?"_ → Học viên: _"Operand?"_ → Will khen: _"What a show! First operand!"_ 😄

Ternary logic:

```javascript
post !== undefined ? post : "What's up?";
```

- Nếu `post !== undefined` → dùng `post` (user đang gõ!)
- Nếu `post === undefined` → dùng `"What's up?"` (default text!)
- State ① (undefined) → "What's up?" ✅
- State ② ("") → "" (cleared!) ✅
- State ③ ("Ian") → "Ian" ✅

```
TERNARY — 3 STATES:
═══════════════════════════════════════════════════════════════

  post !== undefined ? post : "What's up?"

  STATE ①: post = undefined
  ┌─────────────────────────────────────┐
  │ undefined !== undefined? → FALSE!   │
  │ → "What's up?" (second operand!)   │
  │ → input hiển thị default text ✅   │
  └─────────────────────────────────────┘

  STATE ②: post = ""
  ┌─────────────────────────────────────┐
  │ "" !== undefined? → TRUE!           │
  │ → "" (first operand!)              │
  │ → input TRỐNG (cleared!) ✅       │
  └─────────────────────────────────────┘

  STATE ③: post = "Ian"
  ┌─────────────────────────────────────┐
  │ "Ian" !== undefined? → TRUE!       │
  │ → "Ian" (first operand!)          │
  │ → input hiển thị "Ian" ✅         │
  └─────────────────────────────────────┘

  → MỘT ternary xử lý TẤT CẢ 3 states! 🎉
```

---

## §7. textContent + undefined — "Empty String Magic!"

> Will: _"Our API for the textContent setter evaluates undefined and assigns an EMPTY STRING. That's pretty nice."_

### textContent API — undefined → ""

Will phát hiện chi tiết rất hay của DOM API: khi gán `undefined` vào `textContent`, API **tự động convert** thành empty string!

_"That ensures that we don't need to write any conditional logic to say, if it's undefined, please don't post 'undefined' as text. It actually evaluates to an empty string so nothing shows up."_

Điều này làm code **đơn giản hơn**: `jsDiv.textContent = post` hoạt động đúng cho CẢ 3 states mà KHÔNG cần ternary!

Will tuyên bố yêu thích: _"I honestly, I do really love that now everything we do runs from data through a bunch of clever conditionals to determine what will show up on the view."_ — TẤT CẢ chạy từ DATA → conditionals → VIEW!

```
textContent SETTER — undefined MAGIC:
═══════════════════════════════════════════════════════════════

  jsDiv.textContent = post;

  STATE ①: post = undefined
  ┌──────────────────────────────────────────────────────────┐
  │ jsDiv.textContent = undefined;                           │
  │ → API auto-converts: undefined → ""                    │
  │ → div hiển thị NOTHING! ✅                              │
  │ → KHÔNG cần: if (post !== undefined) { ... }           │
  └──────────────────────────────────────────────────────────┘

  STATE ②: post = ""
  ┌──────────────────────────────────────────────────────────┐
  │ jsDiv.textContent = "";                                  │
  │ → div hiển thị NOTHING! ✅                              │
  └──────────────────────────────────────────────────────────┘

  STATE ③: post = "Ian"
  ┌──────────────────────────────────────────────────────────┐
  │ jsDiv.textContent = "Ian";                               │
  │ → div hiển thị "Ian"! ✅                                │
  └──────────────────────────────────────────────────────────┘

  "That's PRETTY NICE. We don't need conditional logic
   to say 'if undefined, please don't post undefined
   as text.' It evaluates to EMPTY STRING." — Will

  NOTE: toString(undefined) = "undefined" (chuỗi!)
        Nhưng textContent setter: undefined → "" ← đặc biệt!
```

---

## §8. Tự Implement: Three-State dataToView

```javascript
// ═══════════════════════════════════════════════════
// Mô phỏng — Three-State dataToView!
// post: undefined → "" → "Ian"
// ═══════════════════════════════════════════════════

// ── Simplified DOM ──

class El {
  constructor(type) {
    this.type = type;
    this._value = "";
    this._text = "";
  }
  get value() {
    return this._value;
  }
  set value(v) {
    this._value = v;
    console.log(`    🖥️ ${this.type}.value = "${v}"`);
  }
  get text() {
    return this._text;
  }
  set text(v) {
    // textContent API: undefined → ""!
    const actual = v === undefined ? "" : String(v);
    this._text = actual;
    console.log(
      `    🖥️ ${this.type}.text = "${actual}"` +
        (v === undefined ? " (undefined → '' magic!)" : ""),
    );
  }
}

function createAccessor(el) {
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
      el.text = v;
    },
  };
}

// ── Setup ──

const inputEl = new El("input");
const divEl = new El("div");
const jsInput = createAccessor(inputEl);
const jsDiv = createAccessor(divEl);

// ── Three States ──

let post; // undefined! (state ①)

// ── dataToView — MỘT function quyết TẤT CẢ! ──

function dataToView() {
  // Ternary: undefined → default text!
  jsInput.value = post !== undefined ? post : "What's up?";
  // textContent: undefined → "" (magic!)
  jsDiv.textContent = post;
}

// ── Handlers — chỉ thay đổi DATA! ──

function handleClick() {
  post = ""; // state ② — cleared!
  dataToView();
}

function handleInput(typed) {
  post = typed; // state ③ — user typing!
  dataToView();
}

// ═══ DEMO: Three States ═══

console.log("═══ STATE ① — post = undefined ═══\n");
console.log(`  post = ${post}`);
dataToView(); // First run!

console.log(`\n  input shows: "${inputEl.value}"`);
console.log(`  div shows: "${divEl.text}"`);
console.log(`  ✅ Default text + empty div!`);

console.log("\n═══ STATE ② — User CLICK (handleClick) ═══\n");
handleClick();
console.log(`  post = "${post}"`);
console.log(`  input shows: "${inputEl.value}"`);
console.log(`  div shows: "${divEl.text}"`);
console.log(`  ✅ Input cleared + div empty!`);

console.log("\n═══ STATE ③ — User TYPE 'Ian' (handleInput) ═══\n");
handleInput("Ian");
console.log(`  post = "${post}"`);
console.log(`  input shows: "${inputEl.value}"`);
console.log(`  div shows: "${divEl.text}"`);
console.log(`  ✅ Input + div both show "Ian"!`);

// ── Verify TRACEABLE! ──
console.log("\n═══ VERIFY: View = f(data)? ═══");
console.log(`  post = "${post}"`);
console.log(`  input.value = "${inputEl.value}" ← from post? ✅`);
console.log(`  div.text = "${divEl.text}" ← from post? ✅`);
console.log(`  EVERY pixel TRACEABLE to data! 🎉`);
console.log(`\n  Will: "What a GREAT restriction on ourselves!"`);
```

---

## §9. 🔬 Deep Analysis Patterns — State-Driven Views

### 9.1 Pattern ①: Spray Out vs Pinpoint In

```
SPRAY OUT vs PINPOINT IN:
═══════════════════════════════════════════════════════════════

  Will dùng metaphor:

  "SPRAY OUT" — dataToView():
  ┌──────────────────────────────────────────────────────────┐
  │           data                                           │
  │            │                                             │
  │     dataToView()                                         │
  │    ╱    │    ╲                                           │
  │   ▼    ▼    ▼                                           │
  │ input  div  other... → PHUN ra TẤT CẢ elements!      │
  │                                                          │
  │ → MỘT function → TOÀN BỘ view!                        │
  │ → Broad, comprehensive!                                 │
  └──────────────────────────────────────────────────────────┘

  "PINPOINT IN" — handlers:
  ┌──────────────────────────────────────────────────────────┐
  │ user click ──▶ handleClick() ──▶ post = ""             │
  │                                      │                   │
  │ user type ──▶ handleInput() ──▶ post = "Ian"           │
  │                                      │                   │
  │ → MỖI handler → MỘT data change!   │                  │
  │ → Narrow, focused!                   │                   │
  │                                      ▼                   │
  │                              dataToView() ← spray!     │
  └──────────────────────────────────────────────────────────┘
```

### 9.2 Pattern ②: undefined vs "" — Tại Sao Quan Trọng

```
undefined vs "" — TẠI SAO?
═══════════════════════════════════════════════════════════════

  ┌──────────────────────────────────────────────────────────┐
  │ Q: Tại sao post = undefined thay vì post = ""?         │
  │                                                          │
  │ A: Vì chúng ta CẦN PHÂN BIỆT:                         │
  │    → undefined = "CHƯA BẮT ĐẦU" (show default!)      │
  │    → "" = "ĐÃ CLICK, CHƯA GÕ" (show nothing!)        │
  │                                                          │
  │ Nếu dùng "" cho cả hai:                                │
  │    → post = "" → user đã click? hay chưa bắt đầu?    │
  │    → KHÔNG PHÂN BIỆT ĐƯỢC! ❌                          │
  │    → dataToView không biết show default hay không!     │
  │                                                          │
  │ undefined cho phép TERNARY phân biệt:                   │
  │    post !== undefined ? post : "What's up?"             │
  │    → undefined → "What's up?" (default!)               │
  │    → "" → "" (cleared!)                                │
  │    → "Ian" → "Ian" (typing!)                           │
  └──────────────────────────────────────────────────────────┘
```

### 9.3 Pattern ③: Semi-Visual → JSX Evolution

```
EVOLUTION: dataToView → JSX:
═══════════════════════════════════════════════════════════════

  VANILLA (hiện tại):
  ┌──────────────────────────────────────────────────────────┐
  │ function dataToView() {                                  │
  │   jsInput.value = post !== undefined                     │
  │                   ? post : "What's up?";                │
  │   jsDiv.textContent = post;                              │
  │ }                                                        │
  │ → Imperative nhưng DATA-DRIVEN!                        │
  └──────────────────────────────────────────────────────────┘

  REACT JSX (tương lai):
  ┌──────────────────────────────────────────────────────────┐
  │ function App() {                                         │
  │   const [post, setPost] = useState(undefined);           │
  │   return (                                               │
  │     <input value={post ?? "What's up?"} />              │
  │     <div>{post}</div>                                    │
  │   );                                                     │
  │ }                                                        │
  │ → Declarative! "Semi-visual coding!"                   │
  │ → CÙNG logic, khác syntax!                             │
  └──────────────────────────────────────────────────────────┘

  "It's also gonna allow us to do SEMI-VISUAL coding."
  — Will (từ bài trước!)
```

---

## Self-Assessment Checklist

```
CHECKLIST — SAU KHI HỌC PHẦN 20:
═══════════════════════════════════════════════════════════════

  THREE STATES:
  [ ] undefined = chưa bắt đầu → default text!
  [ ] "" = đã click → input trống!
  [ ] "Ian" = đang gõ → preview text!
  [ ] let (không const!) vì data sẽ thay đổi!

  ACCESSOR OBJECTS:
  [ ] jsInput: value, onclick, oninput!
  [ ] jsDiv: textContent!
  [ ] Phil's verbalization: "accessor object"!

  HANDLER BINDINGS:
  [ ] onclick = handleClick (Alexa's verbalization!)
  [ ] oninput = handleInput!
  [ ] Thứ tự code ≠ thứ tự execution!

  PARADIGM RESTRICTION:
  [ ] "NOTHING not traceable to data!" (golden rule!)
  [ ] State-driven views = paradigm shift!
  [ ] "Spray out" vs "pinpoint in"!

  dataToView FIRST RUN:
  [ ] Ternary: undefined → "What's up?"!
  [ ] textContent: undefined → "" (API magic!)
  [ ] MỘT function quyết TẤT CẢ view!

  TIẾP THEO → Phần 21: Data-to-View Converter!
```
