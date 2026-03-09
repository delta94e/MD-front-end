# The Hard Parts of UI Development — Phần 26: Understanding UI Components — "Full Pipeline: Data → View → Handler!"

> 📅 2026-03-08 · ⏱ 45 phút đọc
>
> Nguồn: Frontend Masters — Will Sentance
> Khoá học: The Hard Parts of UI Development
> Bài: Understanding UI Components — "replaceChildren, Controlled vs Uncontrolled, UI Component Definition!"
> Độ khó: ⭐️⭐️⭐️⭐️⭐️ | Advanced — element creation inside dataToView, replaceChildren, controlled/uncontrolled, component = full pipeline!

---

## Mục Lục

| #   | Phần                                                           |
| --- | -------------------------------------------------------------- |
| 1   | Element Creation Inside dataToView — "Containers = Data Too!"  |
| 2   | replaceChildren — "Replace or Add, Single API!"                |
| 3   | Controlled vs Uncontrolled Inputs — "Phil: React Concept!"     |
| 4   | Mark's Question — "Input Value Already There, Why Re-set?"     |
| 5   | "One Function, One Source of Truth" — Will's Reasoning         |
| 6   | Phil's Question — "textContent on Empty String?"               |
| 7   | Ian's "DOM Node Purgatory" — "Only Reachable via JS Accessor!" |
| 8   | Alexa's Question — "Enter Key Before Storing Data?"            |
| 9   | UI Component Definition — "Full Pipeline!"                     |
| 10  | Tự Implement: Full UI Component with replaceChildren           |
| 11  | 🔬 Deep Analysis Patterns — Component Architecture             |

---

## §1. Element Creation Inside dataToView — "Containers = Data Too!"

> Will: _"We are EXPLICITLY making all of our view, everything the user sees, DEPENDENT on underlying data."_

### Bối cảnh — Không tạo elements từ HTML nữa!

Will tiến thêm 1 bước lớn: **thay vì HTML tạo input và div** → dataToView sẽ **tự tạo elements** dựa trên data!

_"Rather than have our input and div automatically from HTML, essentially implicitly starting with div/input as true and then switching them off... Instead, we're going to ONLY CREATE them if we want to have them displayed."_

Code mới:

- `input` = **unconditionally** created (mọi state của post → input luôn present!)
- `div` = **conditionally** created (chỉ khi post !== "will"!)

Will: _"We are explicitly making ALL of our view, everything the user sees, dependent on underlying data. No hiding from that data!"_

```
ELEMENT CREATION — HTML vs dataToView:
═══════════════════════════════════════════════════════════════

  TRƯỚC (HTML creates elements):
  ┌──────────────────────────────────────────────────────────┐
  │ HTML: <input> <div></div>  ← IMPLICIT creation!       │
  │ → Elements always exist                                 │
  │ → remove() in handler = IMPLICIT destruction!          │
  │ → dataToView chỉ update text/value                    │
  └──────────────────────────────────────────────────────────┘

  SAU (dataToView creates elements):
  ┌──────────────────────────────────────────────────────────┐
  │ HTML: (chỉ <script>!) ← no input, no div!             │
  │ dataToView() {                                           │
  │   input = createElement("input"); ← EXPLICIT create!  │
  │   if (post !== "will") {                                 │
  │     div = createElement("div"); ← CONDITIONAL create! │
  │   }                                                      │
  │   body.replaceChildren(input, div); ← add to page!    │
  │ }                                                        │
  │ → Elements created EACH TIME based on DATA!            │
  │ → "No hiding from our data!" — Will                    │
  └──────────────────────────────────────────────────────────┘
```

---

## §2. replaceChildren — "Replace or Add, Single API!"

> Will: _"If they're not yet on there, replaceChildren is ADDING. If there's already something on there, it's SWITCHING OUT for the new."_

### document.body.replaceChildren() — API mới!

Will giới thiệu `replaceChildren`:

_"We're going to take whatever is currently on the page and then RE-ADD it or add it or not, ONLY based on the underlying data in that moment."_

_"All elements on our page are actually children, sub-elements, of a BODY object that represents the overall page."_

`document.body.replaceChildren(input, div)`:

- Nếu body **trống** → **add** input và div!
- Nếu body **đã có** elements → **replace** tất cả bằng input và div mới!
- = **Wipe + recreate** mỗi lần dataToView chạy!

Will nhắc: HTML cũng add elements vào body, nhưng **tự động**: _"With HTML, we got to add them automatically as children of body. With JavaScript, we're gonna need to MANUALLY add them."_

```
replaceChildren API:
═══════════════════════════════════════════════════════════════

  document.body.replaceChildren(input, div):

  LẦN 1 (body trống):
  ┌──────────────────────────────────────────────────────────┐
  │ body: []                                                 │
  │ → replaceChildren(input, div)                          │
  │ → body: [input, div]  ← ADD!                          │
  └──────────────────────────────────────────────────────────┘

  LẦN 2 (body đã có elements):
  ┌──────────────────────────────────────────────────────────┐
  │ body: [old_input, old_div]                               │
  │ → replaceChildren(new_input, new_div)                  │
  │ → body: [new_input, new_div]  ← REPLACE!              │
  └──────────────────────────────────────────────────────────┘

  CONDITIONAL (post === "will"):
  ┌──────────────────────────────────────────────────────────┐
  │ body: [input, div]                                       │
  │ → replaceChildren(input)  ← CHỈ INPUT! No div!       │
  │ → body: [input]  ← div TỰ ĐỘNG biến mất!             │
  └──────────────────────────────────────────────────────────┘

  "If not yet on there → ADDING.
   If already something → SWITCHING OUT." — Will
```

---

## §3. Controlled vs Uncontrolled Inputs — "Phil: React Concept!"

> Phil: _"There's a notion between CONTROLLED or UNCONTROLLED inputs, especially in React."_

### Controlled = JS takes over, Uncontrolled = DOM handles

Phil mang context từ React:

_"Controlled is where you're having JavaScript take over everything. Uncontrolled is essentially the event handler does its work — fires, changes directly."_

Will giải thích evolution tất yếu:

_"A framework is gonna be full of smart, intelligent engineers saying: 'In this edge case, could you adjust your library to give us the chance to sometimes DIRECTLY overwrite what the user did and see their typing as a submission that we then replace with the actual data from JavaScript? And sometimes let them do it directly?'"_

**Controlled**: JavaScript nhận input → validate → set value bằng data
**Uncontrolled**: DOM tự handle → value from C++ directly

Will về library bloat: _"Libraries can become bloated, but by nature they kinda HAVE to be because they're dealing with so many different versions of engineering teams with different goals."_ — Giống Photoshop: legacy + 400 features = coherence giảm, nhưng cần thiết!

```
CONTROLLED vs UNCONTROLLED:
═══════════════════════════════════════════════════════════════

  UNCONTROLLED (DOM handles!):
  ┌──────────────────────────────────────────────────────────┐
  │ User types "Y" → C++ input.value = "Y" → User sees!  │
  │ → JavaScript KHÔNG biết (until handler)!               │
  │ → DOM = source of truth cho value!                     │
  │                                                          │
  │ React: <input onChange={handle} />                      │
  │ → Value from DOM directly!                             │
  └──────────────────────────────────────────────────────────┘

  CONTROLLED (JS takes over!):
  ┌──────────────────────────────────────────────────────────┐
  │ User types "Y" → handler → post = "Y" → re-render!   │
  │ → JavaScript SET input.value = post!                   │
  │ → JS data = source of truth!                           │
  │ → User sees ONLY what data says!                       │
  │                                                          │
  │ React: <input value={post} onChange={handle} />        │
  │ → Value from STATE!                                    │
  └──────────────────────────────────────────────────────────┘

  "Are we going to TAKE CONTROL and update what the user
   sees from our DATA?" — Will
```

---

## §4. Mark's Question — "Input Value Already There, Why Re-set?"

> Mark: _"Input.value is automatically returned by an HTML input. Why manually set it with JavaScript?"_

### "It's Not a Truth, It's a MOVE!"

Mark hỏi: user gõ "Will" → giá trị đã hiện trong input → tại sao grab rồi set lại?

Will trả lời:

_"It's not a truth, it's a MOVE. Because now I am 100% SURE."_

_"I could totally have in my handler only updated the div's textContent, because that's the only thing that needed to be updated."_

NHƯNG: _"When you've got thousands of elements on the page and I have to work out in every single user action which bit to update, and in which handler... I DON'T WANNA THINK ABOUT IT."_

_"Instead, I only want to have some underlying data and then ONE SINGLE FUNCTION that always updates ALL possible dependent content, even if actually NOTHING was needed to be updated."_

_"Why did I initially set textContent to empty string? It was empty anyway! I did it because I don't want to have ANYTHING displayed that is not a direct consequence of a piece of data in JavaScript."_

```
MARK's QUESTION — "WHY RE-SET?":
═══════════════════════════════════════════════════════════════

  MARK: "Value already there on DOM. Why re-set from JS?"

  WILL's ANSWER:
  ┌──────────────────────────────────────────────────────────┐
  │ "I COULD just update the div. The input already shows  │
  │  the typed value. I COULD optimize."                     │
  │                                                          │
  │ "But with THOUSANDS of elements, I have to work out:   │
  │  - Which element to update?                             │
  │  - In which handler?                                     │
  │  - Under which condition?                                │
  │  - Under which user behavior?                            │
  │                                                          │
  │ I DON'T WANNA THINK ABOUT IT."                         │
  │                                                          │
  │ "Instead: ONE data, ONE function, ALL updates.          │
  │  Even if nothing actually changed.                       │
  │  EVERYTHING the user sees = DIRECT consequence          │
  │  of a piece of data in JavaScript."                      │
  │                                                          │
  │ "It's not a TRUTH, it's a MOVE." ♟️                    │
  └──────────────────────────────────────────────────────────┘
```

---

## §5. "One Function, One Source of Truth" — Will's Reasoning

> Will: _"Now we're determining whether jsDiv is there or not from a HANDLER. Not from our JavaScript data. In that case, we are in a tough place."_

### Handler = source of truth? Tough place!

Will chỉ rõ vấn đề của code trước: **handler** quyết view (jsDiv.remove()) thay vì **data**!

_"We're back to our handler handleInput being a source of truth — being a PLACE that determines what the user sees. Now we're determining whether jsDiv is there or not from a handler. Not from our JavaScript data."_

Giải pháp: **MỌI THỨ** qua dataToView!

_"We want ONE PLACE, ONE FUNCTION that can funnel ALL of our change to the user's view through."_

Will mở rộng cho input: _"Someone else on our team could go, 'Actually, if the user types "will" twice, we're gonna make input disappear.' Then input COULD be part of the view that CAN be changed."_

→ Đặt tất cả vào dataToView = an toàn cho tương lai!

```
ONE FUNCTION — ONE SOURCE OF TRUTH:
═══════════════════════════════════════════════════════════════

  ❌ HANDLER = SOURCE OF TRUTH:
  ┌──────────────────────────────────────────────────────────┐
  │ handleInput() {                                          │
  │   if (post === "will") jsDiv.remove(); ← VIEW change! │
  │ }                                                        │
  │ → Handler quyết div tồn tại hay không!                │
  │ → "TOUGH PLACE!" — Will                                │
  └──────────────────────────────────────────────────────────┘

  ✅ DATA → dataToView = SOURCE OF TRUTH:
  ┌──────────────────────────────────────────────────────────┐
  │ handleInput() {                                          │
  │   post = jsInput.value; ← CHỈ DATA!                   │
  │ }                                                        │
  │                                                          │
  │ dataToView() {                                           │
  │   input = createElement("input");                       │
  │   input.value = post;                                    │
  │   if (post !== "will") {                                 │
  │     div = createElement("div");                         │
  │     div.textContent = post;                              │
  │   }                                                      │
  │   body.replaceChildren(input, div);                      │
  │ }                                                        │
  │                                                          │
  │ → DATA quyết MỌI THỨ!                                │
  │ → "One function, one source of truth!" — Will          │
  └──────────────────────────────────────────────────────────┘
```

---

## §6. Phil's Question — "textContent on Empty String?"

> Paul: _"jsDiv will be set to an empty string, and then you do jsDiv.textContent — there is no textContent on an empty string, is there?"_

### Edge case — jsDiv = "" rồi .textContent?

Paul (Phil giúp): nếu `jsDiv = ""` (khi post === "will") → `jsDiv.textContent` sẽ **error**?

Phil suy nghĩ: _"Isn't a string an object? You can just assign any property?"_ → Will: _"Let's walk through it. Let's see how it plays out."_

Will không trả lời ngay → hứa sẽ rõ khi walkthrough code! _"I think it IS handleable with the code as it's implemented."_

Đây là ví dụ thực tế: code có **potential issue** mà phải walkthrough mới thấy!

```
PAUL's EDGE CASE:
═══════════════════════════════════════════════════════════════

  Code:
  ┌──────────────────────────────────────────────────────────┐
  │ let jsDiv = "";  ← khi post === "will"!               │
  │ jsDiv.textContent = post;  ← .textContent trên ""! 🤔│
  └──────────────────────────────────────────────────────────┘

  Phil: "String là object, gán property được?"
  → JavaScript: string primitive ≠ object!
  → "" .textContent = "will" → SILENTLY ignored!
  → No error! Nhưng không làm gì! (strict mode → error!)

  Will: "Let's see how it plays out." 🧐
```

---

## §7. Ian's "DOM Node Purgatory" — "Only Reachable via JS Accessor!"

> Ian: _"DOM Node Purgatory — can they be queried, searchable, referenceable?"_
> Will: _"The ONLY way you can access them is by the accessor object you have in JS."_

### Unattached nodes = "Purgatory"! 😄

Ian đặt tên catchy: **"DOM Node Purgatory"** — nơi unattached elements sống!

Will confirm: unattached nodes **KHÔNG thể**:

- querySelector tìm thấy ❌
- Traversal API (sibling, children) tìm thấy ❌
- document searches tìm thấy ❌

**CHỈ CÓ** JS accessor object (jsDiv) mới reach được!

Và khi `jsDiv` bị reassign (jsDiv = ""):

- C++ garbage collection sẽ **xoá** object hoàn toàn!
- "For all purposes, it's been removed. Except because it still has a JS reference."

```
"DOM NODE PURGATORY" — Ian's Term:
═══════════════════════════════════════════════════════════════

  ATTACHED (on the tree!):
  ┌──────────────────────────────────────────────────────────┐
  │ body → input → (displayed!) ✅                        │
  │     → div → (displayed!) ✅                            │
  │                                                          │
  │ → querySelector("div") → found! ✅                    │
  │ → traversal API → reachable! ✅                       │
  └──────────────────────────────────────────────────────────┘

  UNATTACHED ("Purgatory!" — Ian):
  ┌──────────────────────────────────────────────────────────┐
  │ div { text: "will" }  ← floating in memory! 👻        │
  │                                                          │
  │ → querySelector("div") → NOT found! ❌                │
  │ → traversal API → NOT reachable! ❌                   │
  │ → document searches → NOT found! ❌                   │
  │ → ONLY via jsDiv accessor! ✅                          │
  │                                                          │
  │ Khi jsDiv = "" (reassign):                               │
  │ → No JS reference! → C++ garbage collected! 🗑️       │
  └──────────────────────────────────────────────────────────┘

  Will: "Ian's going to be in charge of writing
         the catchy names for these things." 😂
```

---

## §8. Alexa's Question — "Enter Key Before Storing Data?"

> Alexa: _"What if you want to NOT store the input value until the user presses Enter?"_

### Library design decision — flexibility!

Alexa hỏi: muốn **CHỈ** store data khi user nhấn Enter (không phải mỗi keystroke)?

Will: _"That would be a PERFECT case where 'why do we need underlying data associated?'"_ → Đây là library design decision!

_"Once you have a framework, any of the things we're doing here will be written as functions built by the framework. And suddenly you don't have that freedom."_

→ Pull request vào framework: _"Can you make this function take another argument that determines whether we're going to actually update the underlying data, or let this happen directly, until maybe the user presses Enter?"_

Will tổng kết paradigm: _"One-way data binding is standard, slash three or four other different ways it can be implemented in every one of those libraries."_

```
ALEXA's QUESTION — ENTER KEY:
═══════════════════════════════════════════════════════════════

  CURRENT (every keystroke):
  ┌──────────────────────────────────────────────────────────┐
  │ User types "W" → post = "W" → dataToView()!          │
  │ User types "i" → post = "Wi" → dataToView()!         │
  │ → Update data EVERY keystroke!                         │
  └──────────────────────────────────────────────────────────┘

  ALEXA's IDEA (only Enter):
  ┌──────────────────────────────────────────────────────────┐
  │ User types "W" → DOM shows "W" (uncontrolled!)        │
  │ User types "i" → DOM shows "Wi" (uncontrolled!)       │
  │ User hits Enter → post = "Will" → dataToView()!      │
  │ → Update data only on SUBMIT!                          │
  └──────────────────────────────────────────────────────────┘

  → Library design: controlled vs uncontrolled!
  → "Library evolution" — edge cases grow! 📈
```

---

## §9. UI Component Definition — "Full Pipeline!"

> Will: _"A COMPONENT captures in full the relationship between underlying data and what the user sees."_

### Component = data + view + handler = full pipeline!

Will **định nghĩa UI component** lần đầu:

_"Component refers to a function that associates, describes, captures in FULL the relationship between underlying data in JavaScript, in this case post, and what the user sees."_

_"It is a description in WHOLE of the content: what the user sees, how it depends on underlying data, and how the user is able to ACT on that data via a handler."_

Component = **full pipeline**:

1. **Data** → `post` (state!)
2. **View** → `createElement` + `replaceChildren` (pixels!)
3. **Handler** → `handleInput` (user action!)
4. **Binding** → `dataToView` (data → view conversion!)

Will: _"This is gonna be a full UI component. It's only taken us... [LAUGH] But hey, at least we DEFINITELY know what it's doing."_ 😂

```
UI COMPONENT — FULL PIPELINE:
═══════════════════════════════════════════════════════════════

  ┌──────────────────────────────────────────────────────────┐
  │                    UI COMPONENT                          │
  │ ┌──────────────────────────────────────────────────────┐│
  │ │ DATA:     post = ""                                  ││
  │ │           ↓                                          ││
  │ │ VIEW:     dataToView() {                             ││
  │ │             input = createElement("input");          ││
  │ │             input.value = post;                      ││
  │ │             if (post !== "will")                      ││
  │ │               div = createElement("div");            ││
  │ │               div.textContent = post;                ││
  │ │             body.replaceChildren(input, div);        ││
  │ │           }                                          ││
  │ │           ↑                                          ││
  │ │ HANDLER:  handleInput() {                            ││
  │ │             post = jsInput.value;                     ││
  │ │           }                                          ││
  │ │           ↑                                          ││
  │ │ BINDING:  jsInput.oninput = handleInput;             ││
  │ │           setInterval(dataToView, 15);               ││
  │ └──────────────────────────────────────────────────────┘│
  │                                                          │
  │ "A FULL route through, a FULL PIPELINE through,        │
  │  from underlying data through to what the user sees."  │
  │  — Will                                                  │
  └──────────────────────────────────────────────────────────┘
```

---

## §10. Tự Implement: Full UI Component with replaceChildren

```javascript
// ═══════════════════════════════════════════════════
// Mô phỏng — Full UI Component!
// Element creation INSIDE dataToView + replaceChildren!
// ═══════════════════════════════════════════════════

// ── Simplified DOM ──

class El {
  constructor(type) {
    this.type = type;
    this.value = "";
    this.text = "";
    this.handler = null;
  }
}

class Body {
  constructor() {
    this.children = [];
  }

  replaceChildren(...elements) {
    const valid = elements.filter((e) => e instanceof El);
    const oldLen = this.children.length;
    this.children = valid;
    const action = oldLen === 0 ? "ADD" : "REPLACE";
    console.log(
      `    📦 body.replaceChildren(${valid.map((e) => e.type).join(", ")}) — ${action}!`,
    );
  }

  display() {
    console.log("    🖥️ Page:");
    if (this.children.length === 0) {
      console.log("      (empty!)");
    }
    for (const el of this.children) {
      if (el.type === "input") {
        console.log(`      [${el.value || "___________"}]`);
      } else {
        console.log(`      ${el.text || "(empty div)"}`);
      }
    }
  }
}

// ── "Accessor" factory ──

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
      el.text = v === undefined ? "" : String(v);
    },
    set oninput(fn) {
      el.handler = fn;
    },
  };
}

// ── "document" object ──

const body = new Body();

const document = {
  createElement(type) {
    return new El(type);
  },
  body: body,
};

// ═══ FULL UI COMPONENT ═══

let post = "";

function dataToView() {
  // CREATE elements based on data!
  const input = document.createElement("input");
  const jsInput = acc(input);
  jsInput.value = post;
  jsInput.oninput = handleInput;

  let jsDiv;
  if (post !== "will") {
    const div = document.createElement("div");
    jsDiv = acc(div);
    jsDiv.textContent = post;
    document.body.replaceChildren(input, div);
  } else {
    jsDiv = ""; // no div!
    document.body.replaceChildren(input);
  }
}

function handleInput(typed) {
  post = typed; // CHỈ DATA! Không view change!
  // dataToView sẽ auto-run via setInterval!
}

// ═══ DEMO ═══

console.log("═══ FULL UI COMPONENT ═══\n");

console.log("── Initial render (post = '') ──");
dataToView();
body.display();

console.log("\n── User types 'hello' ──");
handleInput("hello");
dataToView();
body.display();

console.log("\n── User types 'will' → NO DIV! ──");
handleInput("will");
dataToView();
body.display();

console.log("\n── User types 'hi' → DIV COMES BACK! ──");
handleInput("hi");
dataToView();
body.display();

console.log("\n═══ KEY INSIGHT ═══");
console.log("  ✅ Elements created EACH TIME based on data!");
console.log("  ✅ Handler ONLY changes data, not view!");
console.log("  ✅ div disappears AND reappears based on data!");
console.log("  ✅ ONE function, ONE source of truth!");
console.log("  ✅ This is a FULL UI COMPONENT! 🎉");
```

---

## §11. 🔬 Deep Analysis Patterns — Component Architecture

### 11.1 Pattern ①: Component = Encapsulated Unit

```
COMPONENT ARCHITECTURE:
═══════════════════════════════════════════════════════════════

  UI Component =
  ┌──────────────────────────────────────────────────────────┐
  │ 1. STATE (data):                                         │
  │    let post = ""                                         │
  │                                                          │
  │ 2. RENDER (data → view):                                │
  │    dataToView() { createElement + replaceChildren }     │
  │                                                          │
  │ 3. HANDLER (user → data):                               │
  │    handleInput() { post = typed }                        │
  │                                                          │
  │ 4. BINDING (wire everything):                            │
  │    oninput = handleInput                                 │
  │    setInterval(dataToView, 15)                           │
  │                                                          │
  │ React equivalent:                                        │
  │ function PostComponent() {                               │
  │   const [post, setPost] = useState("");  ← STATE       │
  │   const handleInput = (e) =>             ← HANDLER     │
  │     setPost(e.target.value);                             │
  │   return (                               ← RENDER      │
  │     <div>                                                │
  │       <input value={post}                                │
  │         onChange={handleInput} />  ← BINDING            │
  │       {post !== "will" && <div>{post}</div>}            │
  │     </div>                                               │
  │   );                                                     │
  │ }                                                        │
  └──────────────────────────────────────────────────────────┘
```

### 11.2 Pattern ②: Library Evolution

```
LIBRARY EVOLUTION — FROM CORE TO BLOAT:
═══════════════════════════════════════════════════════════════

  v1.0: "One-way data binding! Simple!"
  ┌──────────────────────────────────────────────────────────┐
  │ → Controlled inputs only                                │
  │ → All state in JS                                       │
  │ → Pure paradigm!                                        │
  └──────────────────────────────────────────────────────────┘

  v2.0: "Edge case! Need uncontrolled too!"
  ┌──────────────────────────────────────────────────────────┐
  │ → PR: "Add uncontrolled mode argument"                 │
  │ → useRef for uncontrolled inputs                        │
  │ → Paradigm + escape hatch!                              │
  └──────────────────────────────────────────────────────────┘

  v5.0: "10,000 teams, each with different needs!"
  ┌──────────────────────────────────────────────────────────┐
  │ → Controlled + uncontrolled + hybrid                    │
  │ → Server components + client components                 │
  │ → Concurrent mode + suspense + transitions              │
  │ → "400 features, coherence starts to go" — Will        │
  └──────────────────────────────────────────────────────────┘

  "That's the nature of serving MILLIONS of users,
   each with their own historic priorities." — Will
```

---

## Self-Assessment Checklist

```
CHECKLIST — SAU KHI HỌC PHẦN 26:
═══════════════════════════════════════════════════════════════

  ELEMENT CREATION IN dataToView:
  [ ] Không dùng HTML tạo elements nữa!
  [ ] createElement INSIDE dataToView!
  [ ] Conditional creation based on DATA!
  [ ] "No hiding from our data!" — Will

  replaceChildren:
  [ ] body.replaceChildren(...elements)!
  [ ] Empty → add! Existing → replace!
  [ ] Elements not passed = removed!

  CONTROLLED vs UNCONTROLLED:
  [ ] Controlled = JS sets value from data!
  [ ] Uncontrolled = DOM handles directly!
  [ ] Library design decision!
  [ ] "Motions not notions" 😂

  MARK's QUESTION:
  [ ] "Why re-set value already on DOM?"
  [ ] "It's not a truth, it's a MOVE!"
  [ ] 1000 elements = don't wanna think!
  [ ] ONE function, ALL updates!

  UI COMPONENT:
  [ ] = data + view + handler + binding!
  [ ] "Full PIPELINE from data to view!"
  [ ] "Captures in FULL the relationship!"
  [ ] "It's only taken us... [LAUGH]" — Will

  TIẾP THEO → Phần 27: Walking Through UI Component!
```
