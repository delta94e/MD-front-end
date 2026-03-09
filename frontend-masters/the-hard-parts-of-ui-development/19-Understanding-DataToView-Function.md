# The Hard Parts of UI Development — Phần 19: Understanding the dataToView Function — "Narrow In, Broad Out!"

> 📅 2026-03-08 · ⏱ 40 phút đọc
>
> Nguồn: Frontend Masters — Will Sentance
> Khoá học: The Hard Parts of UI Development
> Bài: Understanding the dataToView Function — "State, View = f(Data), One-Way Data Binding Explained!"
> Độ khó: ⭐️⭐️⭐️⭐️⭐️ | Advanced — one-way data binding philosophy, state management, schematic setup, narrow-in/broad-out!

---

## Mục Lục

| #   | Phần                                                      |
| --- | --------------------------------------------------------- |
| 1   | Tại Sao Predictability — "High-Stakes Environment!"       |
| 2   | State — "Trạng Thái Của Vũ Trụ Ứng Dụng!"                 |
| 3   | Schematic — "DOM, Pixels, Layout + Render Engine!"        |
| 4   | JavaScript Setup — "querySelector, Handlers, dataToView!" |
| 5   | One-Way Data Binding Giải Thích — "Narrow In, Broad Out!" |
| 6   | Ian's Question — "View = f(State), Đó Là One-Way?"        |
| 7   | Matthew's Insight — "Pinpoint In, Spray Back Out!"        |
| 8   | Tự Implement: One-Way Data Binding Với State Management   |
| 9   | 🔬 Deep Analysis Patterns — Philosophy of UI Engineering  |

---

## §1. Tại Sao Predictability — "High-Stakes Environment!"

> Will: _"We are in a high-stakes environment. If what the user sees does not look like what's actually going on, we're in a really difficult position."_

### Bối cảnh — Tại sao cần predictable code

Will mở đầu bằng lập luận **tại sao** one-way data binding cần thiết, không chỉ là "best practice" mà là **sống còn**:

**① Users kỳ vọng cao:** Từ khi 1 tuổi, con người được dạy: _"what they see is how the world actually is under the hood."_ — Cái gì hiển thị = sự thật! Nếu UI hiển thị sai, user **thực sự khó chịu** — không như server error mà phần lớn bị block trước khi đến user.

**② Code chạy trên máy user:** Frontend code được gửi đến máy user để chạy locally. _"You've just passed them a bunch of code to execute on their local machine."_ — Rất khó track lỗi vì mỗi user có môi trường khác nhau!

**③ Dễ test nhưng khó debug:** User dễ phát hiện lỗi visual (nhìn thấy ngay!), nhưng developer khó tìm **root cause** trong hàng nghìn dòng handler code!

Will kết luận: _"The more predictable we can make our code, the more we can minimize where changes in what we see can even happen."_ — Càng predictable → càng ít nơi có thể gây lỗi!

```
HIGH-STAKES ENVIRONMENT:
═══════════════════════════════════════════════════════════════

  TẠI SAO FRONTEND KHÁC BACKEND?
  ┌──────────────────────────────────────────────────────────┐
  │ BACKEND:                                                 │
  │ → Error → block trước khi đến user!                    │
  │ → Code chạy trên SERVER (kiểm soát được!)             │
  │ → User không THẤY lỗi trực tiếp!                      │
  │                                                          │
  │ FRONTEND:                                                │
  │ → Error → user THẤY NGAY trên màn hình!               │
  │ → Code chạy trên MÁY USER (không kiểm soát!)          │
  │ → User kỳ vọng: "what I see = reality!"               │
  │ → Latency, visual glitch = user UPSET!                  │
  │                                                          │
  │ "Users were brought up from ONE YEAR OLD that what they │
  │  see is how the world ACTUALLY IS." — Will               │
  └──────────────────────────────────────────────────────────┘

  GIẢI PHÁP:
  ┌──────────────────────────────────────────────────────────┐
  │ → CÓ thể dùng ad-hoc? CÓ! Browser cho phép!          │
  │ → NHƯNG 500 handlers × 1000 elements = BUG!           │
  │ → Cần RESTRICT nơi view thay đổi!                     │
  │ → dataToView = MỘT NƠI DUY NHẤT!                     │
  │ → "Minimize where changes can even HAPPEN." — Will     │
  └──────────────────────────────────────────────────────────┘
```

---

## §2. State — "Trạng Thái Của Vũ Trụ Ứng Dụng!"

> Will: _"It describes the state of the universe. It'd be like the underlying atoms and where they are in XYZ coordinates of this pen."_

### State vs Data — Thuật ngữ quan trọng

Will đưa ra definition cực hay cho **state**:

_"State... describes all possible changeable things, in our case, the state of the universe."_ — State = trạng thái của **vũ trụ ứng dụng**. Giống như vật lý mô tả vũ trụ bằng vị trí (x,y,z) của mọi nguyên tử, **state** mô tả ứng dụng bằng **tất cả data có thể thay đổi**.

Will giải thích tại sao "state" hay hơn "data":

- **Data** = thông tin chung chung
- **State** = _"the state of the universe"_ — mô tả **trạng thái hiện tại** của ứng dụng tại **một thời điểm cụ thể**

Requirement: **MỌI thứ user thấy PHẢI phụ thuộc vào state**. Không có thứ gì "bí ẩn" xuất hiện trên màn hình mà không có data tương ứng. _"There's no mysterious thing showing up that's a result of an ad-hoc change."_

```
STATE = TRẠNG THÁI VŨ TRỤ ỨNG DỤNG:
═══════════════════════════════════════════════════════════════

  VẬT LÝ:                        ỨNG DỤNG:
  ┌────────────────────┐          ┌────────────────────┐
  │ Vũ trụ = tập hợp  │          │ App = tập hợp      │
  │ nguyên tử tại      │          │ state tại          │
  │ vị trí (x,y,z)    │          │ một thời điểm      │
  │                    │          │                    │
  │ Biết vị trí       │          │ Biết state         │
  │ → biết vũ trụ!    │          │ → biết view!       │
  └────────────────────┘          └────────────────────┘

  QUY TẮC:
  ┌──────────────────────────────────────────────────────────┐
  │ ① MỌI thứ user thấy PHẢI có state tương ứng!          │
  │ ② KHÔNG có thứ gì "bí ẩn" trên màn hình!              │
  │ ③ State thay đổi → view PHẢI thay đổi tương ứng!      │
  │ ④ View LUÔN = f(state)!                                │
  │                                                          │
  │ "There's NO MYSTERIOUS thing showing up that's a        │
  │  result of an AD-HOC change in some handler             │
  │  function." — Will                                       │
  └──────────────────────────────────────────────────────────┘
```

---

## §3. Schematic — "DOM, Pixels, Layout + Render Engine!"

> Will: _"It's a rendered image that gets sent to the graphics card 60 times a second. Rasterized image."_

### Will vẽ lại kiến trúc chi tiết

Will vẽ schematic hoàn chỉnh trên bảng, lần này bao gồm chi tiết về **rendering pipeline**:

1. **JavaScript Runtime** (bên trái) — memory, call stack, callback queue
2. **C++ DOM** (giữa) — list of elements (input, div, script)
3. **Output Pixels** (bên phải) — what user sees

Và Will giải thích rendering pipeline chi tiết hơn bao giờ hết:

**Layout Engine**: xác định vị trí elements dựa trên screen size, device type
**Render Engine**: tính pixels chính xác, **compositing** (kết hợp) tất cả divs, images, animations
**Rasterization**: chuyển pixels thành image → gửi đến **graphics card**
**60 FPS**: quá trình này lặp lại **60 lần mỗi giây**!

```
RENDERING PIPELINE CHI TIẾT:
═══════════════════════════════════════════════════════════════

  C++ DOM:                    RENDERING:
  ┌──────────────┐            ┌────────────────────────────┐
  │ input        │            │ ① Layout Engine:           │
  │  value: ""   │            │    → Vị trí elements      │
  │  handlers:{} │─────────▶  │    → screen size, device  │
  │ div          │            │                            │
  │  text: ""    │            │ ② Render Engine:           │
  │ script       │            │    → Tính pixels chính xác│
  └──────────────┘            │    → Compositing layers   │
                              │    → Animations           │
                              │                            │
                              │ ③ Rasterization:          │
                              │    → Pixels → image       │
                              │    → Gửi → Graphics Card │
                              │    → 60 FPS! 🖥️          │
                              └────────────────────────────┘

  "Rasterized image — turns a bunch of pixels to be sent
   to a graphics card to be displayed." — Will
```

---

## §4. JavaScript Setup — "querySelector, Handlers, dataToView!"

> Will: _"We have some data being saved, accessor objects for div and input, two handlers, and a function dataToView."_

### Setup nhanh — Pattern đã quen

Will chạy qua setup nhanh vì pattern đã lặp lại nhiều lần (ông gọi đây là "starts hard and becomes tedious"!):

Với sự giúp đỡ của **Phil** và **Alexa**:

- Phil liệt kê DOM elements: input, div, script
- Alexa nhắc Will render pixels trên bảng! _"Don't forget to—"_ → Will: _"Yes, thank you! Not by writing 'input'!"_ (đùa về việc render engine không ghi text lên bảng!)

**document object**: Alexa mô tả xuất sắc: _"It's exposed by the global context by the browser, and it allows you to access the DOM in JavaScript."_ Will bổ sung: _"Technically referenced as a C++ pointer to that position in C++ memory."_

Will tóm tắt JavaScript code setup:

1. **Data**: `let post = ""`
2. **Accessor objects**: jsInput, jsDiv (via querySelector)
3. **Handlers**: handleClick, handleInput
4. **dataToView**: _"Our CORE function that's gonna translate data into view!"_

```
JAVASCRIPT SETUP SUMMARY:
═══════════════════════════════════════════════════════════════

  MEMORY:
  ┌──────────────────────────────────────────────────────────┐
  │ document: { [[link]]→DOM, querySelector: ƒ }           │
  │ post: ""                                                 │
  │ jsInput: { [[link]]→input, value, oninput, onclick }    │
  │ jsDiv: { [[link]]→div, textContent }                    │
  │ handleClick: ƒ { post=""; }                             │
  │ handleInput: ƒ { post=jsInput.value; }                  │
  │ dataToView: ƒ { /* converter! */ }                      │
  └──────────────────────────────────────────────────────────┘

  CALL STACK:    [ global() ]
  CALLBACK QUEUE: [ ]

  "Our CORE function, dataToView, is gonna translate
   based on a DESCRIPTION of the relationship between
   underlying data and what the user sees." — Will
```

---

## §5. One-Way Data Binding Giải Thích — "View = f(State)!"

> Will: _"Everything the user sees that could ever be changed by them must be via a change of that data and then an execution of the corresponding dataToView converter function."_

### Tổng hợp — Nguyên tắc cốt lõi

Will tổng hợp nguyên tắc one-way data binding rõ ràng nhất:

**① Mọi thứ user thấy PHẢI phụ thuộc vào data.** Không có "bí ẩn" trên màn hình. Ngay cả div rỗng cũng là quyết định từ data (post === "" → div rỗng).

**② User action CHỈ thay đổi data.** Handler không trực tiếp thay đổi DOM — chỉ cập nhật state.

**③ MỘT function duy nhất chuyển data → view.** Không phải 5 handler thay đổi 5 chỗ — chỉ `dataToView()`.

**④ Reasoning dễ hơn.** _"Not under seven different pathways through user handles. Everything in the view must be a consequence of underlying data."_ — Không cần trace 7 handler pathways!

Will gọi đây là **"creative thinking"** — phải tư duy sáng tạo để **mọi thứ visual** đều biểu diễn được bằng data. Nhưng: _"That's GOOD reasoning. That's reasoning that I can get my head around."_

```
NGUYÊN TẮC CỐT LÕI — ONE-WAY:
═══════════════════════════════════════════════════════════════

  ① MỌI THỨ USER THẤY = f(DATA):
  ┌──────────────────────────────────────────────────────────┐
  │ data = { post: "" }                                      │
  │ → view = { input: "What's up?", div: "" }               │
  │                                                          │
  │ data = { post: "Ian" }                                   │
  │ → view = { input: "Ian", div: "Ian" }                   │
  │                                                          │
  │ KHÔNG CÓ thứ gì trên view MÀ KHÔNG từ data!           │
  └──────────────────────────────────────────────────────────┘

  ② USER ACTION → CHỈ THAY ĐỔI DATA:
  ┌──────────────────────────────────────────────────────────┐
  │ handleClick() { post = ""; }   ← chỉ DATA!            │
  │ handleInput() { post = jsInput.value; } ← chỉ DATA!   │
  │                                                          │
  │ KHÔNG jsDiv.textContent = ... trong handler!            │
  └──────────────────────────────────────────────────────────┘

  ③ MỘT FUNCTION → TOÀN BỘ VIEW:
  ┌──────────────────────────────────────────────────────────┐
  │ function dataToView() {                                  │
  │   jsInput.value = post || "What's up?";                 │
  │   jsDiv.textContent = post;                              │
  │ }                                                        │
  │ → ĐỌC function này = BIẾT HẾT view logic!            │
  └──────────────────────────────────────────────────────────┘
```

---

## §6. Ian's Question — "View = f(State), Đó Là One-Way?"

> Ian: _"Is that what one-way data binding is, where the view is a function of state?"_

### Ian hỏi — One-Way Data Binding là gì chính xác?

Ian hỏi: _"Where the view is a function of state, it goes from the data to the view — the one way?"_

Will trả lời cẩn thận: **Có**, nhưng câu hỏi hay ở chỗ: nếu user gõ → data quay về JavaScript → thì KHÔNG PHẢI hai chiều sao?

Will giải thích: khi user gõ, data quay về JS, nhưng đó là **"submission"** (đệ trình) — _"Hey, I just typed the letters IAN, can you update the data?"_ — Handlers **quyết định** cách cập nhật data, data KHÔNG tự động chảy ngược!

**Chiều "one-way" là từ DATA → VIEW**: _"Whatever the data is in memory, that is gonna determine what shows up."_ — Data → View là **cố định, tự động, toàn bộ**. Mọi data luôn map sang view qua dataToView.

**Chiều ngược (VIEW → DATA)**: user gõ → event → handler → **tùy handler quyết định** data nào thay đổi. Không automatic! Không toàn bộ!

---

## §7. Matthew's Insight — "Pinpoint In, Spray Back Out!"

> Will: _"The direction from the view to the data is very pinpoint. Whereas the flow back is very broad, complete, automatic, and unspecific."_

### Insight xuất sắc — "Narrow In, Broad Out"

Matthew đưa ra metaphor mà Will rất khen: chiều vào (view → data) là **narrow/pinpoint** (hẹp, chính xác), chiều ra (data → view) là **broad/spray** (rộng, phun ra hết)!

**VIEW → DATA (Narrow In):**

- User click → chỉ thay đổi `post = ""`
- User gõ "Ian" → chỉ thay đổi `post = "Ian"`
- **Rất hẹp**: mỗi action chỉ ảnh hưởng 1-2 biến state
- **Rất custom**: mỗi handler viết riêng cho từng action

**DATA → VIEW (Broad Out):**

- dataToView chạy → cập nhật TẤT CẢ elements
- Không cần biết action nào gây ra thay đổi
- **Rất rộng**: mọi view element đều cập nhật
- **Rất tự động**: chạy dataToView = view tự sync

Will khen: _"What a nice way of putting it!"_ Và ông bổ sung lý do:

_"A: We can't see it when the user sees it. B: We wanna have it as simple and predictable as possible."_ — Broad out vì (A) chúng ta không thấy khi user thấy, (B) simple + predictable là ưu tiên hàng đầu!

```
NARROW IN, BROAD OUT:
═══════════════════════════════════════════════════════════════

  VIEW → DATA (Narrow In / Pinpoint):
  ┌──────────────────────────────────────────────────────────┐
  │                                                          │
  │   User click ──────▶ post = ""        (1 biến!)        │
  │   User type "Ian" ─▶ post = "Ian"    (1 biến!)        │
  │   User type "Hi" ──▶ post = "Hi"     (1 biến!)        │
  │                                                          │
  │   → HẸP! Mỗi action → 1-2 biến state!                │
  │   → CUSTOM! Mỗi handler viết riêng!                    │
  │   → SUBMISSION! User "đệ trình" data!                  │
  └──────────────────────────────────────────────────────────┘
                           │
                           ▼
  ┌──────────────────────────────────────────────────────────┐
  │                     STATE                                │
  │                  post = "Ian"                            │
  └──────────────────────────────────────────────────────────┘
                           │
                           ▼
  DATA → VIEW (Broad Out / Spray):
  ┌──────────────────────────────────────────────────────────┐
  │                                                          │
  │   dataToView() ──────▶ input.value = "Ian"             │
  │                ──────▶ div.textContent = "Ian"          │
  │                ──────▶ (mọi element khác!)             │
  │                                                          │
  │   → RỘNG! Cập nhật TẤT CẢ elements!                   │
  │   → TỰ ĐỘNG! Chạy dataToView = view sync!             │
  │   → UNSPECIFIC! Không cần biết action nào!              │
  └──────────────────────────────────────────────────────────┘

  "From the view to the data is very PINPOINT.
   The flow back is very BROAD, COMPLETE, AUTOMATIC,
   and UNSPECIFIC — it's EVERYTHING." — Will
```

---

## §8. Tự Implement: One-Way Data Binding Với State Management

```javascript
// ═══════════════════════════════════════════════════
// Mô phỏng ONE-WAY DATA BINDING — Hoàn chỉnh!
// "Narrow In, Broad Out" pattern!
// ═══════════════════════════════════════════════════

// ── State Management ──

class StateManager {
  constructor(initialState) {
    this._state = { ...initialState };
    this._history = [{ ...initialState }]; // Debug history!
    this._converter = null;
  }

  get(key) {
    return this._state[key];
  }

  // NARROW IN: chỉ thay đổi 1-2 biến!
  set(key, value) {
    console.log(`  📝 State: ${key} = "${value}"`);
    this._state[key] = value;
    this._history.push({ ...this._state });

    // BROAD OUT: auto-run converter!
    if (this._converter) {
      console.log(`  🎨 Auto dataToView()!`);
      this._converter(this._state);
    }
  }

  setConverter(fn) {
    this._converter = fn;
  }

  getHistory() {
    return this._history;
  }
}

// ── Simplified DOM ──

class El {
  constructor(type) {
    this.type = type;
    this.value = "";
    this.text = "";
    this._handlers = {};
  }
  on(ev, fn) {
    this._handlers[ev] = fn;
  }
  fire(ev) {
    if (this._handlers[ev]) this._handlers[ev]();
  }
}

function acc(el) {
  const a = {};
  Object.defineProperty(a, "value", {
    get() {
      return el.value;
    },
    set(v) {
      el.value = v;
    },
  });
  Object.defineProperty(a, "textContent", {
    get() {
      return el.text;
    },
    set(v) {
      el.text = v;
    },
  });
  return a;
}

// ═══ DEMO ═══

console.log("═══ ONE-WAY DATA BINDING: Narrow In, Broad Out ═══\n");

// DOM
const inputEl = new El("input");
const divEl = new El("div");
const jsInput = acc(inputEl);
const jsDiv = acc(divEl);

// STATE — "trạng thái vũ trụ ứng dụng!"
const state = new StateManager({ post: "" });

// DATA → VIEW CONVERTER (Broad Out!)
state.setConverter((s) => {
  jsInput.value = s.post || "What's up?";
  jsDiv.textContent = s.post;
  console.log(`     input="${inputEl.value}", div="${divEl.text}"`);
});

// HANDLERS (Narrow In!)
function handleClick() {
  console.log("\n── handleClick (Narrow In: post→'') ──");
  state.set("post", ""); // CHỈ 1 biến!
}

function handleInput() {
  console.log(`\n── handleInput (Narrow In: post→'${inputEl.value}') ──`);
  state.set("post", inputEl.value); // CHỈ 1 biến!
}

inputEl.on("click", handleClick);
inputEl.on("input", handleInput);

// Initial render
console.log("── Initial Render ──");
state.set("post", ""); // Trigger initial dataToView

// User interactions
console.log("\n═══ USER ACTIONS ═══");

// Click
inputEl.fire("click");

// Type "Ian"
inputEl.value = "Ian";
inputEl.fire("input");

// Check history
console.log("\n═══ STATE HISTORY (Debug!) ═══");
state.getHistory().forEach((s, i) => {
  console.log(`  T${i}: post="${s.post}"`);
});
console.log("  → Biết state history = biết VIEW history!");
console.log("  → Debug: check state → check dataToView → DONE!");

console.log("\n═══ NARROW vs BROAD ═══");
console.log("  Narrow In:  click → post='' (1 biến!)");
console.log("  Narrow In:  type → post='Ian' (1 biến!)");
console.log("  Broad Out:  dataToView → input + div (TẤT CẢ!)");
```

---

## §9. 🔬 Deep Analysis Patterns — Philosophy of UI Engineering

### 9.1 Pattern ①: One-Way Explained

```
ONE-WAY DATA BINDING — TẠI SAO "MỘT CHIỀU"?
═══════════════════════════════════════════════════════════════

  "ONE-WAY" = DATA → VIEW (cố định, tự động!)

  ┌─── STATE ───┐
  │ post = "Ian" │
  └──────┬───────┘
         │  dataToView() — LUÔN CHẠY!
         │  BROAD OUT! Cập nhật TẤT CẢ!
         ▼
  ┌─── VIEW ────────────────────────────┐
  │ input: "Ian" | div: "Ian"          │
  └──────┬──────────────────────────────┘
         │  User gõ "Bob"
         │  NARROW IN! Chỉ 1 biến!
         ▼
  ┌─── HANDLER ─┐
  │ post = "Bob" │ ← handler QUYẾT ĐỊNH!
  └──────┬───────┘
         │
         ▼
  ┌─── STATE ───┐
  │ post = "Bob" │ ← state CẬP NHẬT!
  └──────┬───────┘
         │  dataToView() lại chạy!
         ▼
  ┌─── VIEW ────────────────────────────┐
  │ input: "Bob" | div: "Bob"          │
  └─────────────────────────────────────┘

  Ian's question: "Nhưng data CÓ quay về từ view?"
  Will: "Đó là SUBMISSION. Handler QUYẾT ĐỊNH."

  "ONE-WAY" vì:
  → DATA → VIEW: fixed, automatic, everything!
  → VIEW → DATA: custom, manual, pinpoint!
```

### 9.2 Pattern ②: State History = Debug Power

```
STATE HISTORY = DEBUG POWER:
═══════════════════════════════════════════════════════════════

  VỚI AD-HOC (debug NIGHTMARE):
  ┌──────────────────────────────────────────────────────────┐
  │ Bug: div hiển thị "What's up?Bob"                       │
  │ → Handler nào gây ra? handleInput? handleClick?        │
  │ → Thứ tự nào? Click trước hay type trước?              │
  │ → Dòng code nào? Line 5? Line 9? Line 12?              │
  │ → TRACE 500 dòng code! 😱                              │
  └──────────────────────────────────────────────────────────┘

  VỚI ONE-WAY (debug EASY):
  ┌──────────────────────────────────────────────────────────┐
  │ Bug: div hiển thị "What's up?Bob"                       │
  │                                                          │
  │ Step 1: Check state history:                             │
  │   T0: post="" → T1: post="" → T2: post="What's up?Bob"│
  │ Step 2: Which handler set post="What's up?Bob"?         │
  │   → handleInput! (line 14)                               │
  │ Step 3: WHY? jsInput.value = "What's up?Bob"!           │
  │   → AHA! Default text wasn't cleared!                   │
  │ Step 4: Fix handleClick to clear first!                  │
  │   → DONE! 3 minutes! 😊                                 │
  │                                                          │
  │ "We will be able to see EXACTLY the history of our      │
  │  data. And from that, EXACTLY know what the user        │
  │  should and would see." — Will                           │
  └──────────────────────────────────────────────────────────┘
```

### 9.3 Pattern ③: Tại sao "Nobody would design this from scratch"

```
LỊCH SỬ → TẠI SAO WEB NHƯ VẬY?
═══════════════════════════════════════════════════════════════

  1991: Tim Berners-Lee → Web = DOCUMENTS!
  → HTML liệt kê nội dung → browser hiển thị! Done!
  → Không cần JavaScript, không cần interaction!

  1995: Brendan Eich → JavaScript trong 10 NGÀY!
  → "Thêm chút interaction" cho documents
  → KHÔNG THIẾT KẾ cho applications!

  2005: Gmail, Google Maps → Web = APPLICATIONS!
  → Cần: mutable data, real-time updates, complex UI
  → Dùng: JavaScript + DOM → PAIN! 😱

  2013: React ra đời → ONE-WAY DATA BINDING!
  → setState → virtual DOM → diff → update!
  → Component model, predictable, debuggable!

  HIỆN TẠI:
  ┌──────────────────────────────────────────────────────────┐
  │ Browser: vẫn 2 runtimes (JS + C++)!                    │
  │ → Truths KHÔNG thay đổi!                               │
  │ → Moves (React, Vue, Svelte) giúp SỐNG VỚI truths!    │
  │                                                          │
  │ "Nobody would design this from scratch." — Will         │
  │ → TRUE! Nhưng đây là thực tế!                          │
  │ → Hiểu truths → hiểu tại sao moves CẦN THIẾT!        │
  └──────────────────────────────────────────────────────────┘
```

---

## Self-Assessment Checklist

```
CHECKLIST — SAU KHI HỌC PHẦN 19:
═══════════════════════════════════════════════════════════════

  HIGH-STAKES ENVIRONMENT:
  [ ] Frontend code chạy trên MÁY USER!
  [ ] User kỳ vọng: what I see = reality!
  [ ] Predictability = sống còn!

  STATE:
  [ ] State = "trạng thái vũ trụ ứng dụng"!
  [ ] MỌI thứ user thấy PHẢI có state tương ứng!
  [ ] KHÔNG có "bí ẩn" trên màn hình!

  ONE-WAY DATA BINDING:
  [ ] ONE-WAY = data → view (cố định, tự động!)
  [ ] View → data = "submission" (custom, thủ công!)
  [ ] Hàm dataToView = MỘT NƠI cho view logic!

  NARROW IN, BROAD OUT:
  [ ] Narrow In: user action → 1-2 biến state!
  [ ] Broad Out: dataToView → TẤT CẢ elements!
  [ ] Debug: check state history → xong!

  RENDERING PIPELINE:
  [ ] Layout engine → vị trí elements!
  [ ] Render engine → pixels → compositing!
  [ ] Rasterization → graphics card → 60 FPS!

  TIẾP THEO → Phần 20: Implementing dataToView!
```
