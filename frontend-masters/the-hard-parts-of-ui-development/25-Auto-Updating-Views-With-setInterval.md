# The Hard Parts of UI Development — Phần 25: Auto-Updating Views with setInterval — "Timer + Remove Edge Case!"

> 📅 2026-03-08 · ⏱ 40 phút đọc
>
> Nguồn: Frontend Masters — Will Sentance
> Khoá học: The Hard Parts of UI Development
> Bài: Auto-Updating Views with setInterval — "Timer Feature, Unattached Elements, Element Existence = Data!"
> Độ khó: ⭐️⭐️⭐️⭐️⭐️ | Advanced — setInterval internals, remove() consequence, implicit state, element existence = data!

---

## Mục Lục

| #   | Phần                                                           |
| --- | -------------------------------------------------------------- |
| 1   | setInterval Internals — "Timer Feature, Not Call Stack!"       |
| 2   | First dataToView Auto-Run — "Phil: Empty String = Still Data!" |
| 3   | User Types "Will" — "Jon, It's a Getter!"                      |
| 4   | remove() Consequence — "Unattached, Not Deleted!"              |
| 5   | dataToView Re-Run — "Ian: Not Attached, No View!"              |
| 6   | "Motions Not Notions" — "Tactics, Not Truths!"                 |
| 7   | Element Existence = Data — "True/False Behind Every Box!"      |
| 8   | Tự Implement: setInterval + Remove + Implicit State            |
| 9   | 🔬 Deep Analysis Patterns — Explicit State for Everything      |

---

## §1. setInterval Internals — "Timer Feature, Not Call Stack!"

> Will: _"We move out of this line IMMEDIATELY. Do NOT think we're inside of it."_

### Bối cảnh — setInterval KHÔNG block!

Will nhấn mạnh **rất rõ**: `setInterval(dataToView, 15)` **KHÔNG** giữ JavaScript trên call stack!

_"Do NOT think it's sitting on the call stack. No, it's DONE."_

Wye verbalize:

- _"We're passing dataToView."_ → Will: _"Or at least a reference to its function definition."_
- _"15 milliseconds."_ → Will: _"This line is done. We move out IMMEDIATELY."_

How it works:

1. JavaScript grabs `dataToView` reference
2. Passes it to **browser timer feature** (outside JS!)
3. Timer stores: "every 15ms → add dataToView to callback queue"
4. JavaScript continues **ngay lập tức** (không chờ!)

Will: _"This one technically is implemented somewhere between the JavaScript engine and outside of it in the browser as a whole. But we know that it is certainly NOT BLOCKING running code in JavaScript."_

```
setInterval INTERNALS:
═══════════════════════════════════════════════════════════════

  jsInput.oninput = handleInput;   ← line 15 (done!)
  setInterval(dataToView, 15);     ← line 17 (THIS!)

  STEP 1: JavaScript runs line 17:
  ┌──────────────────────────────────────────────────────────┐
  │ setInterval(dataToView, 15)                              │
  │ → Grab dataToView reference                             │
  │ → Pass to BROWSER TIMER (C++ feature!)                 │
  │ → Line 17 DONE! Move on! ✅                            │
  │                                                          │
  │ "Do NOT think it's on the call stack." — Will           │
  └──────────────────────────────────────────────────────────┘

  STEP 2: Timer (outside JS!) runs forever:
  ┌──────────────────────────────────────────────────────────┐
  │ BROWSER TIMER:                                           │
  │ ┌─────────────────────────────────────┐                  │
  │ │ fn: dataToView                      │                  │
  │ │ interval: 15ms                      │                  │
  │ │                                     │                  │
  │ │ t=15ms:  → callback queue! 📮      │                  │
  │ │ t=30ms:  → callback queue! 📮      │                  │
  │ │ t=45ms:  → callback queue! 📮      │                  │
  │ │ ...forever...                       │                  │
  │ └─────────────────────────────────────┘                  │
  └──────────────────────────────────────────────────────────┘

  STEP 3: Event loop → call stack:
  ┌──────────────────────────────────────────────────────────┐
  │ Event loop: call stack empty? → dataToView()!          │
  │ → "JavaScript adds parens for us. I LOVE that." — Will │
  └──────────────────────────────────────────────────────────┘
```

---

## §2. First dataToView Auto-Run — "Phil: Empty String = Still Data!"

> Phil: _"Set it equal to the value of post, which currently is an empty string."_
> Will: _"By defaulting to 'everything the user sees must be a manifestation of underlying data', we're even going to go ahead displaying BLANK data."_

### Initial state: post = "" → display empty!

15ms sau setInterval → dataToView vào callback queue → global code xong → event loop → call stack → execution context mới!

Phil verbalize:

1. _"Access our jsInput accessor object."_ → _"Find the value setter property and set it equal to post."_ → Will: _"Which is?"_ → Phil: _"Empty string."_
2. _"Same thing for jsDiv — textContent setter, set to post."_ → Will: _"Which is also empty string."_

Will nhấn mạnh: tại sao display empty string khi **chẳng có gì thay đổi** trên page?

_"There was a time where you wouldn't even turn data into empty content. But by defaulting to 'everything the user sees must be a manifestation of underlying data', we're even going to go ahead displaying BLANK data, because it IS data."_

_"A div not showing up — it's still presentation. Data causing NO view. But it's still DEPENDENT on the underlying data."_

```
FIRST AUTO-RUN — post = "":
═══════════════════════════════════════════════════════════════

  dataToView() — INITIAL:
  ┌──────────────────────────────────────────────────────────┐
  │ Phil: "jsInput.value = post"                             │
  │ → post = "" → input.value = ""                         │
  │ → User thấy: input trống                               │
  │                                                          │
  │ Phil: "jsDiv.textContent = post"                        │
  │ → post = "" → div.text = ""                            │
  │ → User thấy: div trống                                 │
  └──────────────────────────────────────────────────────────┘

  PIXELS:
  ┌────────────────────────────────────────────┐
  │ [_______________]  ← input (empty!)       │
  │                     ← div (empty!)         │
  └────────────────────────────────────────────┘

  "Displaying BLANK DATA — because it IS data.
   It's still STATE. It's still something that
   can be CHANGED by the user." — Will
```

---

## §3. User Types "Will" — "Jon, It's a Getter!"

> Will: _"That value property — is it a setter or a getter?"_
> Jon: _"It's a getter, right?"_

### User type "will" → handleInput chạy

t=1min: user type "will" (Will ban đầu muốn "Jon" nhưng đổi lại để demo remove!):

_"Sorry, Jon, we have instead gonna have the user input be 'will'."_

Jon verbalize handleInput:

- _"We are setting our post variable to jsInput's value property."_
- Will hỏi: _"That value property — setter or getter?"_
- Jon: _"It's a getter."_ → Will: _"Spot on! To get the value of what?"_ → Jon: _"Input, which is 'will'."_

Sau khi `post = "will"` → conditional check!

Phil confirm: _"Post is 'will'? Yes."_ → `jsDiv.remove()` chạy!

```
USER TYPES "will" → handleInput:
═══════════════════════════════════════════════════════════════

  t=1min: User types "will" → C++ input.value = "will"
  → event → callback queue → call stack → execution context!

  handleInput():
  ┌──────────────────────────────────────────────────────────┐
  │ LINE 11: post = jsInput.value;                          │
  │                                                          │
  │ Jon: "jsInput's value property"                         │
  │ Will: "Setter or GETTER?"                               │
  │ Jon: "Getter!" ✅                                       │
  │ → .value = GETTER → C++ input.value = "will"          │
  │ → post = "will" (🟢green → ⬜white!)                  │
  │                                                          │
  │ LINE 12: if (post === "will")                           │
  │ Phil: "Yes, it is!" ✅                                  │
  │                                                          │
  │ LINE 13: jsDiv.remove()                                  │
  │ → 💥 REMOVE div from DOM!                              │
  └──────────────────────────────────────────────────────────┘
```

---

## §4. remove() Consequence — "Unattached, Not Deleted!"

> Will: _"We do NOT actually delete this DOM C++ element. Instead, it just gets REMOVED from the list of displayed elements and becomes an UNATTACHED element."_

### Attached vs Unattached — C++ DOM detail!

Will giới thiệu concept mới: khi gọi `remove()`, element **KHÔNG bị xoá** khỏi bộ nhớ C++! Nó chỉ bị **tách** (unattached) khỏi danh sách hiển thị:

_"Because we still have a label and accessor object in JavaScript memory, we don't actually delete this DOM C++ element. Instead, it just gets removed from the list of displayed elements and becomes an UNATTACHED element."_

Nghĩa là:

- `jsDiv` vẫn tồn tại trong JS memory! ✅
- C++ div object vẫn tồn tại trong memory! ✅
- Nhưng div **KHÔNG CÒN** trong displayed list! ❌
- User **KHÔNG THẤY** div nữa! ❌

```
ATTACHED vs UNATTACHED:
═══════════════════════════════════════════════════════════════

  TRƯỚC remove():
  ┌──────────────────────────────────────────────────────────┐
  │ C++ DOM (displayed list):                                │
  │ [0] input { value: "will" }  ← ATTACHED! ✅           │
  │ [1] div { text: "" }        ← ATTACHED! ✅             │
  │                                                          │
  │ JS Memory:                                               │
  │ jsInput → [[link]] → input                             │
  │ jsDiv → [[link]] → div                                 │
  └──────────────────────────────────────────────────────────┘

  SAU remove():
  ┌──────────────────────────────────────────────────────────┐
  │ C++ DOM (displayed list):                                │
  │ [0] input { value: "will" }  ← ATTACHED! ✅           │
  │                                                          │
  │ C++ (unattached):                                        │
  │ div { text: "" }            ← UNATTACHED! ⚠️          │
  │ → Vẫn tồn tại! Nhưng KHÔNG hiển thị!                 │
  │                                                          │
  │ JS Memory:                                               │
  │ jsInput → [[link]] → input (attached!)                 │
  │ jsDiv → [[link]] → div (UNATTACHED! ⚠️)               │
  │ → Link vẫn valid! Nhưng set textContent = vô nghĩa!  │
  └──────────────────────────────────────────────────────────┘

  "It becomes an UNATTACHED element down here." — Will
```

---

## §5. dataToView Re-Run — "Ian: Not Attached, No View!"

> Ian: _"jsDiv accessor object for the div is getting its textContent setter called with a parameter of post."_
> Will: _"And it's going to?"_
> Ian: _"It's not attached to the document, so we're not actually gonna see anything, right?"_

### dataToView chạy lại — div đã unattached!

setInterval trigger → dataToView() chạy lại:

Ian verbalize:

1. _"jsInput accessor object — assign its value to post."_ → "will" hiển thị! ✅
2. _"jsDiv textContent setter called with post."_ → Will: _"And it's going to?"_ → Ian: _"It's NOT ATTACHED to the document, so we're not actually gonna see anything."_ 🎯

Will hài hước: _"I'm happy! I'm not even getting an error!"_ — No error! Nhưng div đã biến mất và user **không hiểu tại sao**!

_"The user is so proud — I've managed to type in 'will', I'm thrilled. And the preview div DISAPPEARS."_

Rồi Will phân tích: _"We can certainly fix this code very quickly. It's whether at a THOUSAND elements, is this the best way?"_ — Phải check conditional mỗi element: "có còn attached không?" → exponential!

```
dataToView RE-RUN — UNATTACHED:
═══════════════════════════════════════════════════════════════

  dataToView() — sau remove():
  ┌──────────────────────────────────────────────────────────┐
  │ Ian: "jsInput.value = post"                              │
  │ → post = "will" → input.value = "will" ✅             │
  │ → User thấy "will" trong input!                        │
  │                                                          │
  │ Ian: "jsDiv.textContent = post"                         │
  │ → post = "will" → set on UNATTACHED div! ⚠️          │
  │ → "Not attached, so we're not gonna SEE anything"      │
  │ → NO ERROR! Nhưng NOTHING hiển thị! 😱                │
  └──────────────────────────────────────────────────────────┘

  PIXELS:
  ┌────────────────────────────────────────────┐
  │ [will____________]  ← input (OK!)         │
  │                      ← div BIẾN MẤT! 💨  │
  └────────────────────────────────────────────┘

  Will: "I get NO ERROR for it! And I've got no idea
         where to track down what's caused my..."

  VẤN ĐỀ Ở SCALE:
  ┌──────────────────────────────────────────────────────────┐
  │ "Whether at a THOUSAND elements, is this the best way  │
  │  to have conditionals saying: if the DOM element's     │
  │  been removed, don't try and set its textContent?" — W │
  └──────────────────────────────────────────────────────────┘
```

---

## §6. "Motions Not Notions" — "Tactics, Not Truths!"

> Ian: _"Motions not notions."_
> Will: _"I don't even know what that means at this point — this is rhyming words."_ 😂

### Will's disclaimer — These are tactics!

Will dừng lại và nhắc nhở quan trọng:

_"These aren't like TRUTHS. These aren't like 'this is the way.' You might be like, I could do that a different way — ABSOLUTELY. There are different ways you can do all these things."_

_"These are like what has become the STANDARD, if only because it's probably got fewer trade-offs than others."_

Ian chen vào: _"Motions not notions."_ → Will bối rối: _"I don't even know what that means. This is rhyming words at this point."_ 😂

Lesson quan trọng: one-way data binding = **tactic**, không phải **truth**. Nó standard vì **fewer trade-offs**, không phải vì perfect!

```
TACTICS, NOT TRUTHS:
═══════════════════════════════════════════════════════════════

  ┌──────────────────────────────────────────────────────────┐
  │ ❌ "One-way data binding is the ONLY way!"             │
  │ ❌ "Virtual DOM is always better!"                     │
  │ ❌ "Never change view outside dataToView!"             │
  │                                                          │
  │ ✅ "These are TACTICS, not truths."                     │
  │ ✅ "Standard because fewer trade-offs."                 │
  │ ✅ "You COULD do it differently. Absolutely."           │
  │                                                          │
  │ "These aren't facts, these are TACTICS." — Will        │
  │ "Motions not notions." — Ian 😂                        │
  └──────────────────────────────────────────────────────────┘
```

---

## §7. Element Existence = Data — "True/False Behind Every Box!"

> Will: _"Displaying or not displaying a box is DATA being changed — the data of true or false, IS that box there or not?"_

### Core insight — Element existence phải là DATA!

Will đưa ra insight quan trọng nhất của bài:

_"Even the CONTAINERS, the boxes that are being displayed are themselves things that have underlying data associated with them."_

_"Displaying or not displaying a box is DATA being changed — in this case, the data of true or false, IS that container there or not?"_

Ví dụ thực tế: _"If you are posting a tweet and it shows up right below, that is a NEW div. A previously not-there and now-there. The user is changing what they see. And therefore, changing DATA and VIEW."_

Will tổng kết: _"We want to make that data EXPLICIT. Including whether the CONTAINER for our more obvious data is even there or not."_

Implicit state:

- `input` tồn tại? → Implicit `true` (từ HTML!)
- `div` tồn tại? → Implicit `true` → rồi `false` (after remove!)
- KHÔNG có variable tracking! → NGUY HIỂM!

Explicit state (cần làm):

- `showDiv = true/false` → EXPLICIT!
- dataToView check `showDiv` → create/remove div!
- MỌI thứ traceable!

```
ELEMENT EXISTENCE = DATA:
═══════════════════════════════════════════════════════════════

  IMPLICIT (hiện tại — nguy hiểm!):
  ┌──────────────────────────────────────────────────────────┐
  │ HTML tạo input, div → IMPLICITLY true!                 │
  │ remove() xoá div → IMPLICITLY false!                   │
  │                                                          │
  │ state = {                                                │
  │   post: "will",      ← EXPLICIT ✅                     │
  │   inputExists: ???,  ← IMPLICIT (from HTML!) ⚠️       │
  │   divExists: ???,    ← IMPLICIT (from remove!) ⚠️     │
  │ }                                                        │
  │                                                          │
  │ → dataToView KHÔNG BIẾT div đã mất!                   │
  │ → Phải conditional check mỗi element!                 │
  └──────────────────────────────────────────────────────────┘

  EXPLICIT (cần chuyển sang!):
  ┌──────────────────────────────────────────────────────────┐
  │ state = {                                                │
  │   post: "will",      ← EXPLICIT ✅                     │
  │   showDiv: false,    ← EXPLICIT ✅                     │
  │ }                                                        │
  │                                                          │
  │ dataToView() {                                           │
  │   if (showDiv) { /* create/show div */ }                │
  │   else { /* remove/hide div */ }                        │
  │ }                                                        │
  │                                                          │
  │ → dataToView BIẾT mọi thứ! ✅                         │
  │ → Traceable to data! ✅                                │
  └──────────────────────────────────────────────────────────┘

  "We want to make that data EXPLICIT.
   Including whether the CONTAINER for our more obvious
   data is even THERE or not." — Will

  REAL WORLD:
  ┌──────────────────────────────────────────────────────────┐
  │ Tweet posted → new div appears!                         │
  │ = "Previously NOT THERE, now THERE."                    │
  │ = Data changed: tweets.length + 1!                      │
  │ = Element existence = DATA! ✅                          │
  └──────────────────────────────────────────────────────────┘
```

---

## §8. Tự Implement: setInterval + Remove + Implicit State

```javascript
// ═══════════════════════════════════════════════════
// Mô phỏng — setInterval + remove() + Implicit vs Explicit State!
// ═══════════════════════════════════════════════════

// ── Simplified DOM ──

class El {
  constructor(t) {
    this.type = t;
    this.value = "";
    this.text = "";
    this.attached = true;
  }

  remove() {
    this.attached = false;
    console.log(`    🗑️ ${this.type} REMOVED (unattached!)`);
  }
}

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
      if (!el.attached) {
        console.log(
          `    ⚠️ ${el.type}.textContent on UNATTACHED! No view change!`,
        );
        el.text = v === undefined ? "" : String(v);
        return;
      }
      el.text = v === undefined ? "" : String(v);
      console.log(`    🖥️ ${el.type}.text = "${el.text}"`);
    },
    remove() {
      el.remove();
    },
  };
}

// ═══ PART 1: IMPLICIT STATE (buggy!) ═══

console.log("═══ PART 1: IMPLICIT STATE (current code!) ═══\n");

const input1 = new El("input");
const div1 = new El("div");
const jsI1 = acc(input1);
const jsD1 = acc(div1);
let post1 = "";

function dataToView1() {
  jsI1.value = post1;
  jsD1.textContent = post1;
}

function handleInput1(typed) {
  post1 = typed;
  if (post1 === "will") {
    jsD1.remove(); // view change OUTSIDE dataToView! ⚠️
  }
}

console.log("── Initial auto-render ──");
dataToView1();

console.log("\n── User types 'will' ──");
handleInput1("will");

console.log("\n── setInterval → dataToView re-runs ──");
dataToView1(); // div is unattached!

console.log("\n── User types 'hello' (div still gone!) ──");
handleInput1("hello");
dataToView1();

console.log(`\n  div attached? ${div1.attached}`);
console.log("  → Div NEVER comes back! No data tracking it! ❌\n");

// ═══ PART 2: EXPLICIT STATE (correct!) ═══

console.log("═══ PART 2: EXPLICIT STATE (fixed!) ═══\n");

const input2 = new El("input");
let div2 = new El("div");
const jsI2 = acc(input2);
let jsD2 = acc(div2);
let post2 = "";
let showDiv = true; // ← EXPLICIT state for element existence!

function dataToView2() {
  jsI2.value = post2;

  if (showDiv && !div2.attached) {
    // Re-create div!
    div2 = new El("div");
    jsD2 = acc(div2);
    console.log("    📦 div RE-CREATED (showDiv = true!)");
  }

  if (!showDiv && div2.attached) {
    jsD2.remove();
  }

  if (div2.attached) {
    jsD2.textContent = post2;
  }
}

function handleInput2(typed) {
  post2 = typed;
  showDiv = post2 !== "will"; // ← data drives view!
  // NO jsDiv.remove() here! dataToView handles it!
}

console.log("── Initial auto-render ──");
dataToView2();

console.log("\n── User types 'will' ──");
handleInput2("will");
dataToView2();
console.log(`  showDiv = ${showDiv}, div attached = ${div2.attached}`);

console.log("\n── User types 'hello' (div should COME BACK!) ──");
handleInput2("hello");
dataToView2();
console.log(`  showDiv = ${showDiv}, div attached = ${div2.attached}`);
console.log("  → Div comes back! EXPLICIT state works! ✅");
```

---

## §9. 🔬 Deep Analysis Patterns — Explicit State for Everything

### 9.1 Pattern ①: "What Is the State of the Universe?"

```
"STATE OF THE UNIVERSE":
═══════════════════════════════════════════════════════════════

  Will: "Imagine if all I have to reason about is,
        what is the STATE OF THE UNIVERSE?
        And the user can change that, but I don't really
        care what they change it FROM or TO — I just care
        about what's the STATE of it."

  AD-HOC (care about paths!):
  ┌──────────────────────────────────────────────────────────┐
  │ "User clicked A, then typed B, then removed C..."      │
  │ → Phải reasoning TOÀN BỘ history!                    │
  │ → "What happened BEFORE?" matters!                     │
  └──────────────────────────────────────────────────────────┘

  ONE-WAY (care about state!):
  ┌──────────────────────────────────────────────────────────┐
  │ state = { post: "will", showDiv: false }                │
  │ → dataToView(state) → view!                            │
  │ → KHÔNG CẦN biết history!                              │
  │ → "What is the state RIGHT NOW?" → enough!             │
  └──────────────────────────────────────────────────────────┘

  "What a LEVELING UP of reasoning." — Will
```

### 9.2 Pattern ②: Implicit → Explicit State Map

```
IMPLICIT → EXPLICIT:
═══════════════════════════════════════════════════════════════

  Mọi thứ user thấy → PHẢI có explicit data!

  ┌─────────────────────────┬─────────────────────────────┐
  │ IMPLICIT (từ HTML/DOM)  │ EXPLICIT (cần add!)         │
  ├─────────────────────────┼─────────────────────────────┤
  │ input tồn tại          │ showInput: true              │
  │ div tồn tại            │ showDiv: true                │
  │ input có text           │ post: "hello"               │
  │ div có text             │ post: "hello"               │
  │ button enabled          │ isEnabled: true             │
  │ modal visible           │ modalOpen: false            │
  │ list có 3 items         │ items: [a, b, c]            │
  │ tab active              │ activeTab: 2               │
  └─────────────────────────┴─────────────────────────────┘

  "Don't think that input and div being on the page
   is not data. As long as it CAN BE TURNED OFF,
   there IS state behind it — TRUE or FALSE." — Will
```

---

## Self-Assessment Checklist

```
CHECKLIST — SAU KHI HỌC PHẦN 25:
═══════════════════════════════════════════════════════════════

  setInterval INTERNALS:
  [ ] Không block call stack! Line xong NGAY!
  [ ] Pass function to browser TIMER feature!
  [ ] Timer → callback queue mỗi 15ms!
  [ ] Event loop: empty? → dataToView()!

  FIRST AUTO-RUN:
  [ ] post = "" → display empty (still DATA!)
  [ ] "Blank data is STILL data!" — Will
  [ ] "Manifestation of underlying data!"

  remove() CONSEQUENCE:
  [ ] Element UNATTACHED, not deleted!
  [ ] jsDiv link still valid!
  [ ] Set textContent on unattached = no view!
  [ ] NO ERROR! Silent failure! 😱

  TACTICS, NOT TRUTHS:
  [ ] "Could do differently — absolutely!"
  [ ] Standard = fewer trade-offs!
  [ ] "Motions not notions" 😂

  ELEMENT EXISTENCE = DATA:
  [ ] Displaying/not-displaying box = data!
  [ ] true/false behind EVERY container!
  [ ] Implicit (HTML) → Explicit (JS variable!)
  [ ] Tweet appearing = new element = data change!

  TIẾP THEO → Phần 26: Building Virtual DOM!
```
