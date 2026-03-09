# The Hard Parts of UI Development — Phần 21: One-Way Data Binding User Interactions — "Tedious = Predictable!"

> 📅 2026-03-08 · ⏱ 40 phút đọc
>
> Nguồn: Frontend Masters — Will Sentance
> Khoá học: The Hard Parts of UI Development
> Bài: One-Way Data Binding User Interactions — "handleClick, handleInput, dataToView = Liberating!"
> Độ khó: ⭐️⭐️⭐️⭐️⭐️ | Advanced — full user interaction flow, tedious=predictable, virtual DOM preview, diff algorithm teaser!

---

## Mục Lục

| #   | Phần                                                          |
| --- | ------------------------------------------------------------- |
| 1   | User Click → handleClick — "Only Allowed to Change Data!"     |
| 2   | Tedious = Predictable — "No Bad Thing!"                       |
| 3   | User Type "Y" → handleInput — "Submission, Not Data!"         |
| 4   | Ian + John: Full Walkthrough — "Brand New Execution Context!" |
| 5   | Green → White — "User Submission → JavaScript Data!"          |
| 6   | "Description Function" — "Full Description of Content!"       |
| 7   | Virtual DOM Preview — "Full Map in JavaScript First!"         |
| 8   | Diff Algorithm Teaser — "Only Make THOSE Changes!"            |
| 9   | Tự Implement: One-Way Full Flow + Diff Preview                |
| 10  | 🔬 Deep Analysis Patterns — Architecture & Optimization       |

---

## §1. User Click → handleClick — "Only Allowed to Change Data!"

> Machik: _"It just sets the post to blank."_
> Will: _"The only thing it's allowed to do is change data."_

### Bối cảnh — One-way click flow

User click trên input (t=1min) → event → handleClick vào **callback queue** → event loop check: call stack trống? ✅ → handleClick lên call stack + `()` → execution context mới!

Will hỏi Machik: _"What's the ONLY thing it's allowed to do?"_ → Machik: _"It just sets the post to blank."_ → Will: _"The only thing it's allowed to do is CHANGE DATA."_

handleClick chỉ làm **2 việc**:

1. `post = ""` — thay đổi DATA (undefined → "")
2. `dataToView()` — gọi converter!

**KHÔNG** trực tiếp thay đổi view! KHÔNG `jsInput.value = ""` trong handler!

```
handleClick — ONE-WAY FLOW:
═══════════════════════════════════════════════════════════════

  T=1min: User CLICK! → callback queue → call stack

  handleClick() {
    post = "";       ← ① CHỈ thay đổi DATA!
    dataToView();    ← ② GỌI converter!
  }

  ❌ KHÔNG: jsInput.value = "";   ← trực tiếp view!
  ✅ CÓ:   post = "";            ← data first!
            dataToView();         ← converter quyết view!

  "The ONLY thing it's allowed to do is CHANGE DATA."
  — Will

  dataToView() → execution context MỚI:
  ┌──────────────────────────────────────────────────────────┐
  │ post = "" (không còn undefined!)                        │
  │ jsInput.value = "" !== undefined ? "" : "What's up?"   │
  │              → "" (TRUE! dùng post!)                    │
  │ jsDiv.textContent = "" → empty!                        │
  │                                                          │
  │ Machik: "Nhưng lần trước cũng empty?"                  │
  │ Will: "Đúng! undefined → '' (textContent magic)        │
  │        và '' → '' (giống nhau!) — nhưng ta TRACK được!"│
  └──────────────────────────────────────────────────────────┘
```

---

## §2. Tedious = Predictable — "No Bad Thing!"

> Will: _"If UI engineering can become a bit tedious, that's no bad thing because tedious means PREDICTABLE."_

### Bối cảnh — Will bảo vệ sự nhàm chán!

Will nhận ra pattern lặp đi lặp lại (change data → dataToView → same logic) và **bảo vệ nó**:

_"Tedious means I'm running through the SAME FUNCTION on my data change EVERY SINGLE TIME."_

_"Tedious means NOT figuring out a complex flow of changes to data that I haven't fully tracked in memory."_

3 lý do tedious = good:

1. **Predictable** — chạy CÙNG function mỗi lần!
2. **No complex flow** — không reasoning paths phức tạp!
3. **No untracked data** — mọi thứ tracked trong JS memory!

```
TEDIOUS = PREDICTABLE:
═══════════════════════════════════════════════════════════════

  AD-HOC (exciting! but dangerous!):
  ┌──────────────────────────────────────────────────────────┐
  │ handleClick → view change A                             │
  │ handleInput → view change B + C                         │
  │ handleScroll → view change D (conditional on A!)       │
  │ → EXCITING! Mỗi handler KHÁC NHAU! 🎰                 │
  │ → UNPREDICTABLE! Complex flow!                          │
  └──────────────────────────────────────────────────────────┘

  ONE-WAY (tedious! but safe!):
  ┌──────────────────────────────────────────────────────────┐
  │ handleClick → data → dataToView()                      │
  │ handleInput → data → dataToView()                      │
  │ handleScroll → data → dataToView()                     │
  │ → TEDIOUS! Mỗi handler GIỐNG pattern! 😴              │
  │ → PREDICTABLE! Same function every time!                │
  └──────────────────────────────────────────────────────────┘

  "Tedious means PREDICTABLE.
   Tedious means NOT figuring out a COMPLEX FLOW
   of changes to data that I haven't FULLY TRACKED
   in memory." — Will
```

---

## §3. User Type "Y" → handleInput — "Submission, Not Data!"

> Will: _"Anything from the user is a SUBMISSION to underlying data here. A PINPOINT submission."_

### User type "Y" — Another callback

User type "Y" (t=1min 1ms) → C++ input.value = "Y" → handleInput vào callback queue → event loop → call stack!

Will giới thiệu concept quan trọng: **user input = SUBMISSION, not data**:

_"I won't even see this as necessarily data so much as a SUBMISSION. Because when that input is filled in, it's gonna trigger handleInput."_

User gõ "Y" → text hiện trên input trên DOM. Nhưng Will nói: đó là **green** (user submission), CHƯA phải **white** (JavaScript data). Chỉ khi handleInput chạy → getter lấy "Y" → assign vào post → NOW it's white (JS data)!

```
USER SUBMISSION vs JS DATA:
═══════════════════════════════════════════════════════════════

  User gõ "Y":
  ┌──────────────────────────────────────────────────────────┐
  │ C++ input.value = "Y"  ← 🟢 GREEN (user submission!)  │
  │                                                          │
  │ Đây KHÔNG PHẢI data!                                    │
  │ Đây là SUBMISSION — user gửi thông tin!                │
  │ Chưa được JavaScript APPROVE!                           │
  └──────────────────────────────────────────────────────────┘

  handleInput chạy:
  ┌──────────────────────────────────────────────────────────┐
  │ post = jsInput.value;                                    │
  │ → getter → "Y" → post = "Y"                           │
  │ → ⬜ WHITE (JavaScript data!)                           │
  │                                                          │
  │ BÂY GIỜ mới là DATA!                                   │
  │ Đã được JavaScript CHẤP NHẬN!                          │
  └──────────────────────────────────────────────────────────┘

  "Anything from the user is a SUBMISSION to underlying
   data. A PINPOINT submission." — Will
```

---

## §4. Ian + John: Full Walkthrough — "Brand New Execution Context!"

> Ian: _"We are going to take the piece of data called post and assign it to the result of accessing the value property of jsInput, but jsInput is an accessor object."_

### Ian verbalize handleInput

Will hỏi Ian từng bước:

**Ian**: _"Since it's in the callback queue, with the event loop, we make sure nothing is in the call stack."_ → handleInput lên call stack → _"It's a new..."_ → Will nudge → Ian: _"Execution context!"_ Will: _"Beautiful!"_

Ian tiếp: _"Take the piece of data called post..."_ → Will sửa nhẹ: _"The IDENTIFIER for a piece of data called post."_ → Ian: _"Assign it to accessing the value property of jsInput, but jsInput is an ACCESSOR OBJECT that we got cuz we can't just get stuff from the DOM."_

Will rất vui: _"It's beautiful, Ian, it's wonderful!"_

### John verbalize dataToView

**John** tiếp dataToView:

1. _"jsInput.value set... check if post equals undefined."_
2. _"Because it's NOT equal to undefined, we will get post's value."_
3. _"Set input's value to post's value."_ → Will: _"Which is?"_ → John: _"Y."_
4. _"Call jsDiv's setter method textContent."_ → Will: _"They call it property, but both work."_
5. _"Set it to post."_ → Will: _"Which is?"_ → John: _"Y."_

```
FULL WALKTHROUGH — Ian + John:
═══════════════════════════════════════════════════════════════

  handleInput() — IAN:
  ┌──────────────────────────────────────────────────────────┐
  │ Ian: "Take the piece of data post..."                    │
  │ Will: "The IDENTIFIER for data called post."            │
  │ Ian: "Assign it to accessing value of jsInput,          │
  │        but jsInput is an ACCESSOR OBJECT."              │
  │ Will: "Beautiful, Ian, WONDERFUL!" 🎉                   │
  │                                                          │
  │ post = jsInput.value;                                    │
  │ → GETTER → C++ input.value = "Y"                       │
  │ → post = "Y" (🟢green → ⬜white!)                     │
  │                                                          │
  │ dataToView();  ← gọi converter!                        │
  └──────────────────────────────────────────────────────────┘

  dataToView() — JOHN:
  ┌──────────────────────────────────────────────────────────┐
  │ John: "Check if post equals undefined."                  │
  │ John: "It's NOT undefined → get post's value."         │
  │                                                          │
  │ jsInput.value = "Y" !== undefined ? "Y" : "What's up?" │
  │               → TRUE → "Y"!                             │
  │ → SETTER → C++ input.value = "Y" (⬜white data!)      │
  │                                                          │
  │ John: "Call jsDiv's textContent, set to post = Y."     │
  │ jsDiv.textContent = "Y"                                  │
  │ → SETTER → C++ div.text = "Y" → render!               │
  └──────────────────────────────────────────────────────────┘
```

---

## §5. Green → White — "User Submission → JavaScript Data!"

> Will: _"I'm now changing from GREEN, which was a user submission, into saving it in WHITE. It's a JavaScript string."_

### Will's whiteboard color system!

Will giải thích hệ thống màu trên whiteboard:

**🟢 Green** — User submission (data tạm thời trên DOM, user gõ)
**⬜ White** — JavaScript data (chính thức, tracked trong JS memory)
**🩷 Pink** — User actions (click, type)
**🟠 Orange** — JavaScript execution (handler chạy)

Khi user gõ "Y" → hiện 🟢green trên DOM. Khi handleInput lấy và gán vào post → chuyển thành ⬜white!

_"They think it's just what they typed. No, they're NOT TO BE TRUSTED with that. They have to trust US to refill it with actual data from JavaScript."_

Will hài hước: user nghĩ mình gõ text. Nhưng thực tế: text hiện ra là **từ JavaScript data** (after dataToView), KHÔNG phải trực tiếp từ user typing!

```
GREEN → WHITE — COLOR SYSTEM:
═══════════════════════════════════════════════════════════════

  STEP 1: User type "Y" → 🟢 GREEN
  ┌──────────────────────────────────────────────────────────┐
  │ C++ input.value = "Y" (user submission! tạm thời!)    │
  │ → Hiện trên screen nhưng KHÔNG PHẢI JS data!          │
  └──────────────────────────────────────────────────────────┘

  STEP 2: handleInput → post = "Y" → ⬜ WHITE
  ┌──────────────────────────────────────────────────────────┐
  │ post = jsInput.value; → post = "Y"                     │
  │ → ⬜ WHITE! Chính thức là JavaScript data!             │
  └──────────────────────────────────────────────────────────┘

  STEP 3: dataToView → jsInput.value = "Y" → ⬜ WHITE
  ┌──────────────────────────────────────────────────────────┐
  │ jsInput.value = post; → "Y" (từ JS data!)             │
  │ → ⬜ WHITE! Derived from data, not user input!         │
  │                                                          │
  │ User nghĩ: "Tôi gõ Y, hiện Y."                        │
  │ Thực tế: JS lấy Y → post = Y → dataToView → "Y"!    │
  │ → "They're NOT TO BE TRUSTED." 😂 — Will               │
  └──────────────────────────────────────────────────────────┘
```

---

## §6. "Description Function" — "Full Description of Content!"

> Will: _"A DESCRIPTION — it DESCRIBES what's gonna show up. Based on that data, we have a full description of the content."_

### dataToView = Description function!

Will hoàn thành full flow và tuyên bố:

_"We have a full user interface with a highly restrictive but honestly LIBERATING design pattern."_

Ông gọi dataToView bằng tên mới: **description function** — function MÔ TẢ mọi thứ sẽ hiển thị:

_"You could even call it a description. It describes what's gonna show up. Based on that data, we have a full description of the content that's gonna show on the page — all within one function."_

3 quy tắc:

1. **User chỉ được thay đổi DATA** (nowhere else!)
2. **MỘT function (dataToView)** pipes data → view
3. **View = output** của data qua conditionals

```
DESCRIPTION FUNCTION — FULL PATTERN:
═══════════════════════════════════════════════════════════════

  ┌──────────────────────────────────────────────────────────┐
  │ USER ACTION → handler → CHANGE DATA only!              │
  │                            │                             │
  │                            ▼                             │
  │                    dataToView()                           │
  │                 "DESCRIPTION FUNCTION"                    │
  │                    │           │                          │
  │            conditionals   conditionals                    │
  │                    │           │                          │
  │                    ▼           ▼                          │
  │              input.value  div.textContent                 │
  │                    │           │                          │
  │                    ▼           ▼                          │
  │                  PIXELS     PIXELS                        │
  │                                                          │
  │ "A full DESCRIPTION of the content that's gonna         │
  │  show on the page — all within ONE function.            │
  │  It's BEAUTIFUL." — Will                                 │
  └──────────────────────────────────────────────────────────┘

  "Highly restrictive but honestly LIBERATING." — Will
```

---

## §7. Virtual DOM Preview — "Full Map in JavaScript First!"

> Will: _"Within JavaScript we can have a full MAP of what the page is gonna end up looking like."_

### Bối cảnh — Tương lai: JavaScript map of the page!

Will bắt đầu preview concept **Virtual DOM** (sẽ học chi tiết sau):

Currently: dataToView trực tiếp set values trên C++ DOM. Nhưng Will hỏi: nếu ta có thể tạo **bản đồ đầy đủ** (full map) của page TRONG JavaScript TRƯỚC khi gửi sang C++?

_"If we know that nothing shows up on the page that wasn't determined by underlying data and conversion from that data to view... maybe we could have a full layout of what the page is gonna look like within JavaScript first."_

4 nơi lưu data xác định view:

1. **HTML** — initial structure (one-time)
2. **CSS** — styling rules
3. **C++ DOM** — runtime data (value, text)
4. **JavaScript** — mutable data

Will: _"How do we have FOUR different places to store data that determines what the user sees? At least THREE out of four are changeable."_ → Đó là lý do restrict về JS duy nhất!

```
VIRTUAL DOM PREVIEW:
═══════════════════════════════════════════════════════════════

  HIỆN TẠI: dataToView → trực tiếp C++ DOM
  ┌──────────────────────────────────────────────────────────┐
  │ dataToView() → jsInput.value = "Y"  → C++ DOM         │
  │              → jsDiv.textContent = "Y" → C++ DOM       │
  │                                                          │
  │ → Mỗi lần: WIPE + RELOAD toàn bộ!                    │
  │ → 1000 elements = chậm!                                 │
  └──────────────────────────────────────────────────────────┘

  TƯƠNG LAI: dataToView → Virtual DOM → diff → C++ DOM
  ┌──────────────────────────────────────────────────────────┐
  │ dataToView() → JS MAP (virtual DOM):                    │
  │                { input: { value: "Y" },                 │
  │                  div: { text: "Y" } }                   │
  │                         │                                │
  │                    DIFF với map cũ!                      │
  │                         │                                │
  │                    Chỉ update CHANGES!                   │
  │                         ▼                                │
  │                    C++ DOM (minimal updates!)            │
  └──────────────────────────────────────────────────────────┘

  "Within JavaScript we can have a FULL MAP of what the
   page is gonna end up looking like." — Will
```

---

## §8. Diff Algorithm Teaser — "Only Make THOSE Changes!"

> Will: _"Look back at the previous map and see what ACTUALLY changed, and only make THOSE changes."_

### Bối cảnh — Will tease diff algorithm!

Will nhận ra vấn đề: dataToView hiện tại **wipe + reload** toàn bộ view mỗi lần chạy: _"Do we really need to do that every single time? A thousand elements, we gotta really wipe all the data every time?"_

Giải pháp = **diff algorithm**:

1. Tạo **map mới** (virtual DOM) từ data mới
2. So sánh với **map cũ** (virtual DOM trước đó)
3. Tìm **chỉ những gì thay đổi** (diff!)
4. Update **chỉ elements thay đổi** trên real DOM!

_"Have an algorithm, clever code — it's gonna be pretty basic — look back at the previous map and see what actually changed, and only make THOSE changes. That could be quite a powerful move for us."_

Đây chính là **React's reconciliation algorithm**!

```
DIFF ALGORITHM TEASER:
═══════════════════════════════════════════════════════════════

  KHÔNG CÓ DIFF (hiện tại):
  ┌──────────────────────────────────────────────────────────┐
  │ dataToView() chạy → WIPE TOÀN BỘ → RELOAD TOÀN BỘ   │
  │                                                          │
  │ 1000 elements: wipe 1000 + set 1000 = 2000 operations! │
  │ Nhưng chỉ 1 element thay đổi! 🤦                      │
  └──────────────────────────────────────────────────────────┘

  CÓ DIFF (tương lai — React!):
  ┌──────────────────────────────────────────────────────────┐
  │ Map CŨ:                Map MỚI:                        │
  │ { input: "",           { input: "Y",    ← CHANGED! ✅ │
  │   div: "" }              div: "Y" }     ← CHANGED! ✅ │
  │                                                          │
  │ DIFF: input changed, div changed                        │
  │ → Update CHỈ 2 elements! (thay vì 1000!)              │
  │ → 2 operations thay vì 2000! 🚀                       │
  └──────────────────────────────────────────────────────────┘

  "Could it be that if we could MAP OUT in JavaScript
   all the data as it's gonna be displayed, and then
   have an algorithm... look back at the previous map
   and see what ACTUALLY CHANGED, and only make
   THOSE changes?" — Will
```

---

## §9. Tự Implement: One-Way Full Flow + Diff Preview

```javascript
// ═══════════════════════════════════════════════════
// Mô phỏng — One-Way Full Flow + Diff Preview!
// handleClick → handleInput → dataToView!
// + Virtual DOM diff teaser!
// ═══════════════════════════════════════════════════

// ── Simplified DOM ──

class El {
  constructor(t) {
    this.type = t;
    this.value = "";
    this.text = "";
  }
}

function acc(el) {
  return {
    get value() {
      return el.value;
    },
    set value(v) {
      el.value = v;
      console.log(`    🖥️ ${el.type}.value = "${v}"`);
    },
    get textContent() {
      return el.text;
    },
    set textContent(v) {
      const actual = v === undefined ? "" : String(v);
      el.text = actual;
      console.log(`    🖥️ ${el.type}.text = "${actual}"`);
    },
  };
}

// ── Setup ──

const inputEl = new El("input");
const divEl = new El("div");
const jsInput = acc(inputEl);
const jsDiv = acc(divEl);
let post; // undefined!
let domUpdates = 0;

// ── dataToView (tracks updates!) ──

function dataToView() {
  console.log(`  📦 dataToView(): post = ${JSON.stringify(post)}`);
  jsInput.value = post !== undefined ? post : "What's up?";
  jsDiv.textContent = post;
  domUpdates += 2;
}

// ── Handlers ──

function handleClick() {
  console.log("  🟠 handleClick(): post = ''");
  post = "";
  dataToView();
}

function handleInput(typed) {
  console.log(`  🟠 handleInput(): post = "${typed}"`);
  post = typed;
  dataToView();
}

// ═══ FULL FLOW ═══

console.log("═══ INITIAL RENDER ═══");
dataToView();
console.log(`  DOM updates: ${domUpdates}\n`);

console.log("═══ USER CLICK (t=1min) ═══");
handleClick();
console.log(`  DOM updates: ${domUpdates}\n`);

console.log("═══ USER TYPE 'Y' (t=1min 1ms) ═══");
handleInput("Y");
console.log(`  DOM updates: ${domUpdates}\n`);

// ═══ DIFF ALGORITHM PREVIEW ═══

console.log("═══ DIFF ALGORITHM PREVIEW ═══\n");

let previousMap = null;

function dataToViewWithDiff() {
  const newMap = {
    input: post !== undefined ? post : "What's up?",
    div: post === undefined ? "" : String(post),
  };

  if (previousMap === null) {
    console.log("  First render — update ALL!");
    jsInput.value = newMap.input;
    jsDiv.textContent = newMap.div;
  } else {
    // DIFF!
    const changes = [];
    if (newMap.input !== previousMap.input) {
      changes.push(`input: "${previousMap.input}" → "${newMap.input}"`);
      jsInput.value = newMap.input;
    }
    if (newMap.div !== previousMap.div) {
      changes.push(`div: "${previousMap.div}" → "${newMap.div}"`);
      jsDiv.textContent = newMap.div;
    }
    if (changes.length === 0) {
      console.log("  🟢 DIFF: NO CHANGES! Skip DOM update!");
    } else {
      console.log(`  🔄 DIFF: ${changes.length} change(s):`);
      changes.forEach((c) => console.log(`    → ${c}`));
    }
  }
  previousMap = { ...newMap };
}

post = undefined;
console.log("── Initial render (with diff) ──");
dataToViewWithDiff();

console.log("\n── Click (post = '') ──");
post = "";
dataToViewWithDiff();

console.log("\n── Type 'Y' (post = 'Y') ──");
post = "Y";
dataToViewWithDiff();

console.log("\n── Type 'Y' again (SAME!) ──");
post = "Y"; // Same value!
dataToViewWithDiff();

console.log("\n  → DIFF algorithm skips unnecessary updates! 🚀");
console.log('  → Will: "Only make THOSE changes!"');
```

---

## §10. 🔬 Deep Analysis Patterns — Architecture & Optimization

### 10.1 Pattern ①: Four Places of Data

```
4 NƠI LƯU DATA → VIEW:
═══════════════════════════════════════════════════════════════

  Will: "How do we have FOUR different places to store
         data that can determine what the user sees?"

  ┌──────────────────────────────────────────────────────────┐
  │ ① HTML — initial structure (one-time, unchangeable!)   │
  │ ② CSS — styling rules (changeable! ⚠️)                 │
  │ ③ C++ DOM — runtime values (changeable! ⚠️)            │
  │ ④ JavaScript — mutable data (changeable! ⚠️)            │
  │                                                          │
  │ "At least THREE out of four are changeable." — Will     │
  │                                                          │
  │ GIẢI PHÁP: Restrict → ONLY JavaScript!                 │
  │ → "JavaScript as our SINGLE SOURCE of data."           │
  │ → User data on DOM = "submission" (not real data!)     │
  │ → CSS changes = via JavaScript state!                   │
  │ → HTML = initial render only!                           │
  └──────────────────────────────────────────────────────────┘
```

### 10.2 Pattern ②: Liberating Restriction

```
"RESTRICTIVE BUT LIBERATING":
═══════════════════════════════════════════════════════════════

  RESTRICTION:
  ┌──────────────────────────────────────────────────────────┐
  │ → Handlers CHỈ được thay đổi data!                    │
  │ → View CHỈ qua dataToView()!                           │
  │ → Content PHẢI traceable to JS data!                    │
  │ → Nghe restrictive! 😰                                 │
  └──────────────────────────────────────────────────────────┘

  LIBERATION:
  ┌──────────────────────────────────────────────────────────┐
  │ → BIẾT CHẮC view hiển thị gì → check data!           │
  │ → BIẾT CHẮC data thay đổi thế nào → check handlers!  │
  │ → BIẾT CHẮC view chạy logic gì → check dataToView!   │
  │ → Debug = check 1 function! ✅                          │
  │ → Nghe liberating! 🕊️                                  │
  └──────────────────────────────────────────────────────────┘

  "A highly RESTRICTIVE but honestly LIBERATING
   design pattern." — Will
```

### 10.3 Pattern ③: Evolution Path

```
EVOLUTION: One-Way → Virtual DOM → React:
═══════════════════════════════════════════════════════════════

  LEVEL 1: One-Way Data Binding (bây giờ!)
  ┌──────────────────────────────────────────────────────────┐
  │ data → dataToView() → directly update DOM             │
  │ → Simple! Predictable! Nhưng wipe+reload! 🐢          │
  └──────────────────────────────────────────────────────────┘
                         │
                         ▼
  LEVEL 2: Virtual DOM (sắp học!)
  ┌──────────────────────────────────────────────────────────┐
  │ data → dataToView() → JS map (virtual DOM)             │
  │ → "Full map in JavaScript FIRST!"                      │
  │ → Semi-visual coding!                                   │
  └──────────────────────────────────────────────────────────┘
                         │
                         ▼
  LEVEL 3: Diff Algorithm (sắp học!)
  ┌──────────────────────────────────────────────────────────┐
  │ old virtual DOM vs new virtual DOM → DIFF               │
  │ → Only update CHANGED elements!                         │
  │ → "Quite a powerful MOVE for us." — Will               │
  └──────────────────────────────────────────────────────────┘
                         │
                         ▼
  LEVEL 4: React/Vue/Svelte (production!)
  ┌──────────────────────────────────────────────────────────┐
  │ JSX + hooks + reconciliation + fiber                    │
  │ → All built on THESE foundations!                       │
  └──────────────────────────────────────────────────────────┘
```

---

## Self-Assessment Checklist

```
CHECKLIST — SAU KHI HỌC PHẦN 21:
═══════════════════════════════════════════════════════════════

  handleClick ONE-WAY:
  [ ] Chỉ thay đổi DATA! (post = "")
  [ ] Gọi dataToView()! (converter!)
  [ ] KHÔNG trực tiếp thay đổi view!

  TEDIOUS = PREDICTABLE:
  [ ] Same function every time!
  [ ] No complex flow reasoning!
  [ ] No untracked data!

  SUBMISSION vs DATA:
  [ ] 🟢 Green = user submission (tạm, trên DOM!)
  [ ] ⬜ White = JavaScript data (chính thức!)
  [ ] User "not to be trusted" — JS refills from data!

  DESCRIPTION FUNCTION:
  [ ] dataToView = "description" of content!
  [ ] Full description within ONE function!
  [ ] "Restrictive but LIBERATING!"

  VIRTUAL DOM PREVIEW:
  [ ] Full map in JavaScript FIRST!
  [ ] 4 places of data → restrict to JS only!
  [ ] Diff: compare old map vs new → only update changes!

  TIẾP THEO → Phần 22: Virtual DOM + Diff Algorithm!
```
