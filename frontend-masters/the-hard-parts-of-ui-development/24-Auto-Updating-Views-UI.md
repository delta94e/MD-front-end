# The Hard Parts of UI Development — Phần 24: Auto-Updating Views UI — "Full Setup Revisited!"

> 📅 2026-03-08 · ⏱ 40 phút đọc
>
> Nguồn: Frontend Masters — Will Sentance
> Khoá học: The Hard Parts of UI Development
> Bài: Auto-Updating Views UI — "Simplified UI, querySelector Revisited, Data Must Back Every Pixel!"
> Độ khó: ⭐️⭐️⭐️⭐️⭐️ | Advanced — simplified handler, remove() API, data-backed view, handleInput edge case!

---

## Mục Lục

| #   | Phần                                                              |
| --- | ----------------------------------------------------------------- |
| 1   | Simplified Implementation — "Removed handleClick!"                |
| 2   | HTML → C++ DOM — "Justice: input, div, script!"                   |
| 3   | JavaScript Runtime Setup — "document Object Revisited!"           |
| 4   | Alexa: querySelector Deep Walkthrough — "Accessor + Hidden Link!" |
| 5   | Functions: dataToView + handleInput — "Spray Out + Pinpoint In!"  |
| 6   | oninput Setter — "A Tricky Line!" (Why's Walkthrough)             |
| 7   | Data Must Back Every Pixel — "Even true/false!"                   |
| 8   | The remove() Edge Case — "Mark's Question!"                       |
| 9   | Tự Implement: Simplified UI With Remove                           |
| 10  | 🔬 Deep Analysis Patterns — Data-Backed Views                     |

---

## §1. Simplified Implementation — "Removed handleClick!"

> Will: _"We've removed one of our handlers, so it's a slightly simpler implementation here."_

### Bối cảnh — Bỏ handleClick, chỉ giữ handleInput

Will quay lại build full UI nhưng **đơn giản hơn**: bỏ handleClick, chỉ giữ handleInput. User chỉ cần **gõ** vào input → preview hiện trong div.

Thêm feature mới: nếu user gõ "will" → **remove div** hoàn toàn khỏi DOM! (Will đùa: _"they need to learn"_ 😄)

Code structure:

1. `post = ""` — data
2. `jsInput = querySelector("input")` — accessor
3. `jsDiv = querySelector("div")` — accessor
4. `dataToView()` — converter (spray out!)
5. `handleInput()` — handler (pinpoint in!) + remove logic
6. `jsInput.oninput = handleInput` — binding
7. `setInterval(dataToView, 15)` — auto-render!

```
SIMPLIFIED UI — CHỈ handleInput:
═══════════════════════════════════════════════════════════════

  TRƯỚC (2 handlers):                SAU (1 handler):
  ┌────────────────────────┐        ┌────────────────────────┐
  │ handleClick() {        │        │ (removed!)             │
  │   post = "";           │        │                        │
  │   dataToView();        │        │                        │
  │ }                      │        │                        │
  │ handleInput() {        │        │ handleInput() {        │
  │   post = jsInput.value;│        │   post = jsInput.value;│
  │   dataToView();        │        │   if (post === "will") │
  │ }                      │        │     jsDiv.remove();    │
  └────────────────────────┘        │   dataToView();        │
                                    │ }                      │
                                    └────────────────────────┘

  + Feature mới: gõ "will" → REMOVE div!
  + Auto-render: setInterval(dataToView, 15)!
```

---

## §2. HTML → C++ DOM — "Justice: input, div, script!"

> Justice: _"We've got an input."_ → _"Div."_ → _"A script."_

### Justice verbalize HTML parsing

Will yêu cầu Justice liệt kê HTML elements. Justice: _"Input, div, script."_

Will nhắc lại flow:

1. HTML file → **HTML parser**
2. Parser → **Web IDL** (interface description language)
3. Web IDL → add elements to **C++ DOM list**
4. DOM list → **layout + render engines** → **pixels**!

Will nhấn mạnh: DOM **kỹ thuật** là object, nhưng ta có thể nghĩ nó như **ordered list** (danh sách có thứ tự):

_"Technically is an object, the O stands for Object, but it's an ordered list of elements. We can think of it as being an ordered list for simplicity's sake."_

Justice mô tả pixels: _"We see an input, a box. And then there's a div, that's really not shown but is there."_ — Div **tồn tại** nhưng **trống** nên user không thấy!

```
HTML → C++ DOM → PIXELS:
═══════════════════════════════════════════════════════════════

  HTML FILE:                 C++ DOM (ordered list):
  ┌──────────────────┐       ┌──────────────────────────────┐
  │ <input>          │  ──▶  │ [0] input { value: "" }     │
  │ <div></div>      │  ──▶  │ [1] div { text: "" }        │
  │ <script>...</script>──▶  │ [2] script { ... }          │
  └──────────────────┘       └──────────────────────────────┘
       │                              │
       │ HTML parser                  │ Layout + Render
       │ + Web IDL                    │ engines
       ▼                              ▼
  "Most intuitive,             PIXELS:
   thought-free design         ┌──────────────────────┐
   language!" — Will           │ [_______________]    │
                               │ (div: invisible!)    │
                               └──────────────────────┘

  Justice: "Input, a box. Div, not shown but IS there."
```

---

## §3. JavaScript Runtime Setup — "document Object Revisited!"

> Alexa: _"A hidden property that is a link to let us access the DOM."_

### JavaScript runtime = memory + thread

Will setup JavaScript runtime:

- **Memory** (store of data) — nơi lưu data
- **Thread** (process ability) — khả năng chạy code line by line
- **document object** — có sẵn trong memory!

Will hỏi Alexa về document object:

1. _"Hidden property — a link to let us access the DOM."_ ✅
2. _"Properties, which are probably methods."_ → Will bổ sung: _"Also some actual methods, like querySelector that lets us interact with the DOM."_ ✅

Will nhắc lại **2 mục tiêu** của UI:

1. _"Displaying content."_
2. _"Letting the user change it."_

_"We need data corresponding to something they can see that can be changed. Otherwise I can't change pixels without corresponding underlying data."_

```
JAVASCRIPT RUNTIME:
═══════════════════════════════════════════════════════════════

  MEMORY (store of data):
  ┌──────────────────────────────────────────────────────────┐
  │ document = {                                             │
  │   [[link]] → C++ DOM  ← hidden property!              │
  │   querySelector: fn   ← method!                        │
  │   ...more methods                                        │
  │ }                                                        │
  │                                                          │
  │ Alexa: "A hidden property, a LINK to let us            │
  │         ACCESS the DOM."                                 │
  └──────────────────────────────────────────────────────────┘

  THREAD (execution):
  ┌──────────────────────────────────────────────────────────┐
  │ → Process ability (chạy code line by line!)            │
  │ → Call stack (tracking execution!)                      │
  │ → Callback queue (pending callbacks!)                   │
  │ → Event loop (checking call stack empty!)              │
  └──────────────────────────────────────────────────────────┘
```

---

## §4. Alexa: querySelector Deep Walkthrough — "Accessor + Hidden Link!"

> Alexa: _"Because we can't bring that C++ object back into JavaScript — we create an accessor object."_

### Alexa verbalize BOTH querySelector calls

**jsInput = querySelector("input")**:

Alexa (từng bước):

1. _"Declaring our jsInput variable"_
2. _"Assigning it to the result of invoking querySelector on our document object with the string input"_
3. _"It's gonna use that hidden link on the document object to head to the DOM"_
4. _"Search for what selector? Input."_
5. _"Because it's a C++ object, we can't retrieve it — JavaScript gives us an object"_
6. _"A regular JavaScript object with its own hidden property linking to the input node"_
7. _"Value, and oninput"_ — pertinent properties!

**jsDiv = querySelector("div")** — by analogy:

- Alexa: _"Same thing, except we query for our div this time"_
- _"Result stored under jsDiv — JavaScript object with hidden link to the div"_
- _"Getter-setter properties pertinent to div: textContent, and REMOVE"_ ← mới!

Will khen: _"Let's give a hand to Alexa!"_ 👏

```
ALEXA's WALKTHROUGH:
═══════════════════════════════════════════════════════════════

  jsInput:
  ┌──────────────────────────────────────────────────────────┐
  │ jsInput = {                                              │
  │   [[link]] → C++ input node                            │
  │   value: [getter/setter]                                 │
  │   oninput: [setter]                                      │
  │ }                                                        │
  │ Alexa: "An object with hidden link + value + oninput"  │
  └──────────────────────────────────────────────────────────┘

  jsDiv:
  ┌──────────────────────────────────────────────────────────┐
  │ jsDiv = {                                                │
  │   [[link]] → C++ div node                              │
  │   textContent: [getter/setter]                           │
  │   remove: [method]  ← MỚI! Xoá div khỏi DOM!        │
  │ }                                                        │
  │ Alexa: "textContent and REMOVE"                        │
  └──────────────────────────────────────────────────────────┘

  Will: "Let's give a hand to Alexa!" 👏
```

---

## §5. Functions: dataToView + handleInput — "Spray Out + Pinpoint In!"

> Will: _"One that's gonna PIPE DATA through to the view, the other's gonna PIPE ACTION back to the JavaScript environment."_

### 2 functions — asymmetric roles!

Will mô tả 2 functions:

- `dataToView` = **pipe data through to view** (spray out!)
- `handleInput` = **pipe action back to JS** (pinpoint in!)

Alexa: _"We're assigning two functions to memory to call at arbitrary times later."_ → Muốn mô tả code bên trong → Will ngăn: _"JavaScript isn't even looking at the code inside. It's JUST saving it."_

Will nhấn mạnh mental model: khi **define** function → JavaScript **KHÔNG** đọc code bên trong. Chỉ **save** reference. Code bên trong chỉ chạy khi **gọi** function!

```
2 FUNCTIONS — DEFINE ≠ EXECUTE:
═══════════════════════════════════════════════════════════════

  DEFINE (chỉ save!):
  ┌──────────────────────────────────────────────────────────┐
  │ function dataToView() { ... }   ← JS chỉ SAVE!       │
  │ function handleInput() { ... }  ← JS chỉ SAVE!       │
  │                                                          │
  │ → KHÔNG đọc code bên trong!                           │
  │ → KHÔNG chạy!                                          │
  │ → Chỉ lưu vào memory!                                 │
  │                                                          │
  │ "JavaScript isn't even looking at the code inside.     │
  │  It's JUST saving it." — Will                           │
  └──────────────────────────────────────────────────────────┘

  EXECUTE (sau này!):
  ┌──────────────────────────────────────────────────────────┐
  │ dataToView()    ← GỌI = đọc + chạy code bên trong!  │
  │ handleInput()   ← GỌI = đọc + chạy code bên trong!  │
  └──────────────────────────────────────────────────────────┘
```

---

## §6. oninput Setter — "A Tricky Line!" (Why's Walkthrough)

> Will: _"Line 15 is a TRICKY line — a lot of things that don't look like what it's doing."_

### Why verbalize oninput binding

Will gọi `jsInput.oninput = handleInput` là **"tricky line"** vì:

1. `oninput` **trông** như property assignment → thực ra là **setter** (chạy code!)
2. `handleInput` **trông** như gọi function → thực ra chỉ **reference** (không gọi!)
3. Function sẽ execute **SAU** khi user action → **later, not now!**

Why verbalize:

1. _"The function handleInput defined inside JS runtime..."_
2. _"Is getting passed to the oninput method of the jsInput object..."_
3. Will bổ sung: _"Go look at the link to which element? Input."_
4. _"Setting its input handler to handleInput."_

Will nhấn mạnh: _"None of this is happening in JavaScript. This is just a setter-getter that's going to pass this out."_ — oninput setter **gửi** function reference sang C++ DOM, KHÔNG chạy trong JS!

```
oninput — "A TRICKY LINE":
═══════════════════════════════════════════════════════════════

  jsInput.oninput = handleInput;

  TRÔNG NHƯ:                    THỰC TẾ:
  ┌────────────────────────┐    ┌────────────────────────────┐
  │ "Gán value cho         │    │ oninput = SETTER!          │
  │  property oninput"     │    │ → Chạy code ngầm!        │
  │                        │    │ → Gửi function ref sang   │
  │ "handleInput chạy"    │    │   C++ DOM!                 │
  │                        │    │ handleInput = REFERENCE!   │
  │                        │    │ → KHÔNG gọi! Không ()!   │
  │                        │    │ → Chỉ tham chiếu!        │
  └────────────────────────┘    └────────────────────────────┘

  C++ DOM:
  ┌──────────────────────────────────────────────────────────┐
  │ input: handlers["input"] → handleInput (reference!)    │
  │                                                          │
  │ "None of this is happening in JavaScript.               │
  │  This is just a setter that passes this OUT." — Will   │
  └──────────────────────────────────────────────────────────┘
```

---

## §7. Data Must Back Every Pixel — "Even true/false!"

> Will: _"Even if that data is just true or false, even if that data is just 'show or not' — it's still DATA."_

### Golden rule revisited — mở rộng!

Will mở rộng golden rule: **MỌI pixel** mà user thấy VÀ có thể thay đổi → PHẢI có data tương ứng!

_"I can't change pixels without corresponding underlying data. Even if that data is just true or false, even if that data is just 'show or not', it's STILL DATA. It's still not just pixels, which are the MANIFESTATION of some sort of state or data."_

Ví dụ:

- Input có text → `post = "Ian"` (data!)
- Div hiển thị preview → `post` (same data!)
- Div **tồn tại** hay **không** → cần data! (`divExists = true/false`)
- Button enabled/disabled → cần data! (`isEnabled = true/false`)

```
DATA MUST BACK EVERY PIXEL:
═══════════════════════════════════════════════════════════════

  ┌──────────────────────────────────────────────────────────┐
  │ PIXEL (user thấy)         DATA (JS backing)             │
  │ ─────────────────         ──────────────────             │
  │ "Ian" trong input     ←   post = "Ian"                 │
  │ "Ian" trong div       ←   post = "Ian"                 │
  │ Div tồn tại          ←   ??? (THIẾU DATA!) ⚠️       │
  │ Input có border blue  ←   ??? (CSS, không data!)       │
  │                                                          │
  │ "Even TRUE or FALSE is still DATA.                      │
  │  Pixels are the MANIFESTATION of state." — Will        │
  └──────────────────────────────────────────────────────────┘
```

---

## §8. The remove() Edge Case — "Mark's Question!"

> Mark: _"Is it deliberate that dataToView doesn't check if jsDiv has been detached by handleInput?"_

### Mark phát hiện bug!

Mark hỏi: _"Is it deliberate that in the code, dataToView doesn't check if the jsDiv has been DETACHED by handleInput?"_

Vấn đề: handleInput có thể gọi `jsDiv.remove()` (xoá div khỏi DOM). Nhưng dataToView vẫn cố set `jsDiv.textContent = post` → div đã bị remove → **edge case**!

Will thừa nhận: _"This is by design some code that we'll at least have to do some REASONING about."_ Rồi đùa: _"We're on a JOURNEY."_ 😄

Đây chính là ví dụ thực tế: **view changes NGOÀI dataToView** phá vỡ one-way pattern!

- `jsDiv.remove()` trong handleInput = thay đổi view **trực tiếp**!
- Không có data backing cho "div tồn tại hay không"!
- dataToView không biết div đã bị remove!

```
MARK's QUESTION — EDGE CASE:
═══════════════════════════════════════════════════════════════

  handleInput():
  ┌──────────────────────────────────────────────────────────┐
  │ post = jsInput.value;                                    │
  │ if (post === "will") {                                   │
  │   jsDiv.remove();  ← TRỰC TIẾP thay đổi view! ⚠️    │
  │ }                                                        │
  │ dataToView();                                            │
  └──────────────────────────────────────────────────────────┘

  dataToView():
  ┌──────────────────────────────────────────────────────────┐
  │ jsInput.value = post;                                    │
  │ jsDiv.textContent = post;  ← div ĐÃ BỊ REMOVE! 💥   │
  │                                                          │
  │ Mark: "dataToView doesn't check if jsDiv                │
  │        has been DETACHED!" 🎯                            │
  └──────────────────────────────────────────────────────────┘

  VẤN ĐỀ:
  ┌──────────────────────────────────────────────────────────┐
  │ ❌ remove() trong handler = view change NGOÀI dTV!     │
  │ ❌ Không có data: divExists = true/false!              │
  │ ❌ dataToView không biết div bị remove!                │
  │ → Vi phạm one-way principle!                            │
  │                                                          │
  │ Will: "This is by design. We're on a JOURNEY." 😄      │
  └──────────────────────────────────────────────────────────┘
```

---

## §9. Tự Implement: Simplified UI With Remove

```javascript
// ═══════════════════════════════════════════════════
// Mô phỏng — Simplified UI + remove() Edge Case!
// Only handleInput, no handleClick!
// ═══════════════════════════════════════════════════

// ── Simplified DOM ──

class El {
  constructor(t, parent) {
    this.type = t;
    this.value = "";
    this.text = "";
    this.removed = false;
    this.parent = parent;
    if (parent) parent.children.push(this);
  }
  remove() {
    this.removed = true;
    if (this.parent) {
      this.parent.children = this.parent.children.filter((c) => c !== this);
    }
    console.log(`    🗑️ ${this.type} REMOVED from DOM!`);
  }
}

class Container {
  constructor() {
    this.children = [];
  }
}

function acc(el) {
  return {
    get value() {
      return el.value;
    },
    set value(v) {
      if (el.removed) {
        console.log(`    ⚠️ ${el.type}.value set but DETACHED!`);
      }
      el.value = v;
    },
    get textContent() {
      return el.text;
    },
    set textContent(v) {
      if (el.removed) {
        console.log(`    ⚠️ ${el.type}.textContent set but DETACHED!`);
        return; // no-op on removed element
      }
      el.text = v === undefined ? "" : String(v);
      console.log(`    🖥️ ${el.type}.text = "${el.text}"`);
    },
    remove() {
      el.remove();
    },
  };
}

// ── Setup ──

const dom = new Container();
const inputEl = new El("input", dom);
const divEl = new El("div", dom);

const jsInput = acc(inputEl);
const jsDiv = acc(divEl);

let post = "";

// ── dataToView ──
function dataToView() {
  jsInput.value = post;
  jsDiv.textContent = post;
}

// ── handleInput (with remove!) ──
function handleInput(typed) {
  post = typed;
  if (post === "will") {
    console.log('    💀 User typed "will" → REMOVE div!');
    jsDiv.remove();
  }
  dataToView();
}

// ═══ DEMO ═══

console.log("═══ SIMPLIFIED UI — REMOVE EDGE CASE ═══\n");

console.log("── Initial render ──");
dataToView();
console.log(`  DOM children: ${dom.children.length}`);

console.log("\n── User types 'hi' ──");
handleInput("hi");
console.log(`  DOM children: ${dom.children.length}`);

console.log("\n── User types 'will' → REMOVE! ──");
handleInput("will");
console.log(`  DOM children: ${dom.children.length}`);
console.log(`  div removed? ${divEl.removed}`);

console.log("\n── User types 'hello' (div already gone!) ──");
handleInput("hello");
console.log(`  DOM children: ${dom.children.length}`);

console.log("\n═══ EDGE CASE ANALYSIS ═══");
console.log("  Mark's question: dataToView tries to set");
console.log("  textContent on a DETACHED div!");
console.log("  → View change OUTSIDE dataToView = BUG! ❌");
console.log("  → Need data: divExists = true/false!");
```

---

## §10. 🔬 Deep Analysis Patterns — Data-Backed Views

### 10.1 Pattern ①: HTML = "Thought-Free Design Language"

```
HTML — Will's APPRECIATION:
═══════════════════════════════════════════════════════════════

  "How often do you get to add things to a C++ list
   of objects by FILE OPEN and listing the things
   you want to add? That's pretty powerful.
   That's our HTML for you." — Will

  ┌──────────────────────────────────────────────────────────┐
  │ HTML:                                                    │
  │ <input>     → C++ list: add input object!              │
  │ <div></div> → C++ list: add div object!                │
  │                                                          │
  │ → File open → parse → add to C++ list! 🎉            │
  │ → "Most INTUITIVE, thought-free design language!" — Will│
  │ → Declarative: LIST things = they APPEAR!              │
  └──────────────────────────────────────────────────────────┘
```

### 10.2 Pattern ②: View Changes MUST Go Through dataToView

```
RULE VIOLATION — remove() IN HANDLER:
═══════════════════════════════════════════════════════════════

  ✅ CORRECT (one-way!):
  ┌──────────────────────────────────────────────────────────┐
  │ handleInput() {                                          │
  │   post = jsInput.value;  ← chỉ data!                  │
  │   showDiv = post !== "will";  ← chỉ data!             │
  │ }                                                        │
  │                                                          │
  │ dataToView() {                                           │
  │   if (showDiv) { /* add div */ }                        │
  │   else { jsDiv.remove(); }  ← view qua converter!     │
  │ }                                                        │
  └──────────────────────────────────────────────────────────┘

  ❌ VIOLATION (current code!):
  ┌──────────────────────────────────────────────────────────┐
  │ handleInput() {                                          │
  │   post = jsInput.value;                                  │
  │   jsDiv.remove();  ← view change IN handler! ⚠️       │
  │ }                                                        │
  │                                                          │
  │ → Handler thay đổi view TRỰC TIẾP!                   │
  │ → dataToView không biết div đã remove!                │
  │ → Will: "We're on a JOURNEY" → sẽ fix!               │
  └──────────────────────────────────────────────────────────┘
```

---

## Self-Assessment Checklist

```
CHECKLIST — SAU KHI HỌC PHẦN 24:
═══════════════════════════════════════════════════════════════

  SIMPLIFIED UI:
  [ ] Bỏ handleClick, chỉ handleInput!
  [ ] Feature: gõ "will" → remove div!
  [ ] Auto-render: setInterval(dataToView, 15)!

  HTML → C++ DOM:
  [ ] HTML parser + Web IDL → C++ list!
  [ ] DOM = ordered list of elements (technically object!)
  [ ] Justice: input, div, script!

  ALEXA's WALKTHROUGH:
  [ ] jsInput: hidden link + value + oninput!
  [ ] jsDiv: hidden link + textContent + remove!
  [ ] "Accessor object" — because C++ can't come to JS!

  oninput TRICKY LINE:
  [ ] Setter (not property assignment!)
  [ ] handleInput = reference (not call!)
  [ ] "None of this happening in JS" — sends to C++ DOM!

  DATA MUST BACK PIXELS:
  [ ] "Even true/false is still DATA!" — Will
  [ ] Pixels = manifestation of state!
  [ ] remove() in handler = violation! (Mark's question!)

  TIẾP THEO → Phần 25: Building Virtual DOM Elements!
```
