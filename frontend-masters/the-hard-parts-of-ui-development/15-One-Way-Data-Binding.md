# The Hard Parts of UI Development — Phần 15: One-Way Data Binding — "Từ Ad-Hoc Sang Paradigm!"

> 📅 2026-03-08 · ⏱ 50 phút đọc
>
> Nguồn: Frontend Masters — Will Sentance
> Khoá học: The Hard Parts of UI Development
> Bài: One-Way Data Binding + Changing View + Handling Multiple Interactions
> Độ khó: ⭐️⭐️⭐️⭐️ | Advanced — paradigm shift, multiple handlers, state reasoning, exponential complexity!

---

## Mục Lục

| #   | Phần                                                  |
| --- | ----------------------------------------------------- |
| 1   | Từ "Truths" Sang "Moves" — "Paradigm Mới!"            |
| 2   | UI Phức Tạp Hơn — "Input + Div + Click + Type!"       |
| 3   | Setup JavaScript — "post, jsInput, jsDiv, handlers!"  |
| 4   | Default Text & Setters — "What's Up?"                 |
| 5   | Handler Functions — "handleInput + handleClick!"      |
| 6   | User Click → handleClick → Clear Input!               |
| 7   | User Type → handleInput → Update Post → Update Div!   |
| 8   | Vấn Đề — "Exponential Complexity!"                    |
| 9   | Tự Implement: Multi-Handler UI Mô Phỏng               |
| 10  | 🔬 Deep Analysis Patterns — Tại Sao Cần Paradigm Mới? |

---

## §1. Từ "Truths" Sang "Moves" — "Paradigm Mới!"

> Will: _"We're gonna move from the truths of the world of user interface development... into the moves, the efforts, for us to make our lives more manageable."_

### Bối cảnh — Bước ngoặt của khoá học

Will tuyên bố chuyển sang **phần 2** của khoá học. Phần 1 (Parts 1-12) là **"Truths"** — sự thật về cách browser hoạt động: HTML parser, C++ DOM, accessor objects, getter/setter, hidden links, event handlers, callback queue. Đó là **thực tế** mà chúng ta phải chấp nhận.

Phần 2 bắt đầu với **"Moves"** — những **nỗ lực, quyết định** mà engineers đưa ra để cuộc sống dễ chịu hơn. Đây KHÔNG phải "truths" (sự thật bất biến) — đây là **choices** (lựa chọn), **restrictions** (giới hạn tự đặt), **paradigms** (mô hình tư duy).

Move đầu tiên: **One-Way Data Binding** — mô hình ràng buộc dữ liệu một chiều. Được implement bởi **React, Vue, Angular, Svelte** — hầu hết UI frameworks phổ biến!

```
TRUTHS vs MOVES:
═══════════════════════════════════════════════════════════════

  TRUTHS (Parts 1-12) — "Thế Giới Thực!"
  ┌──────────────────────────────────────────────────────────┐
  │ → Cách browser THỰC SỰ hoạt động                       │
  │ → C++ DOM, WebCore, WebIDL                              │
  │ → Accessor objects, getter/setter, hidden links          │
  │ → Event handlers, callback queue, event loop             │
  │ → KHÔNG thay đổi được! Chấp nhận!                      │
  └──────────────────────────────────────────────────────────┘

  MOVES (Parts 13+) — "Lựa Chọn Của Engineers!"
  ┌──────────────────────────────────────────────────────────┐
  │ → One-way data binding                                   │
  │ → Virtual DOM (diffing algorithms)                       │
  │ → State hooks, composable functions                      │
  │ → CÓ THỂ thay đổi! Là CHOICE, không phải TRUTH!       │
  │                                                          │
  │ "These are NOT truths. These are EFFORTS to provide     │
  │  RESTRICTIONS that make our lives easier." — Will        │
  └──────────────────────────────────────────────────────────┘
```

### Vấn đề cốt lõi: Hai runtimes, KHÔNG tự đồng bộ

Will tóm tắt: **Data** lưu trong JavaScript, **View** (pixels) hiển thị từ C++ DOM — hai runtimes hoàn toàn tách biệt. _"Never the two shall mix except via formal calls to getter/setter properties in JavaScript or handler functions in the DOM being called back."_ — Chúng KHÔNG BAO GIỜ trộn lẫn, chỉ giao tiếp qua getter/setter và event handlers!

Will hỏi tu từ: _"What a convoluted back and forth. You wouldn't design that if you — maybe you would, I don't know."_ 😅

---

## §2. UI Phức Tạp Hơn — "Input + Div + Click + Type!"

> Will: _"Let's expand our UI to make it more sophisticated. We're gonna add another handler. This one for clicks."_

### Bối cảnh — Thêm handler thứ hai

Để chứng minh tại sao cần paradigm mới, Will mở rộng UI: thêm **onclick handler** ngoài oninput. Giờ có **2 loại user interaction**: gõ (input) và click.

**Spec UI** (product team yêu cầu):

1. Input field hiển thị default text "What's up?"
2. Khi user **click** vào input → xóa default text, cho phép gõ
3. Khi user **gõ** → preview text hiển thị trong div bên dưới

```
UI SPEC — PRODUCT TEAM YÊU CẦU:
═══════════════════════════════════════════════════════════════

  TRẠNG THÁI BAN ĐẦU:
  ┌────────────────────────────────────────────┐
  │ [What's up?______]  ← input (default text) │
  │                     ← div (rỗng)           │
  └────────────────────────────────────────────┘

  SAU KHI USER CLICK:
  ┌────────────────────────────────────────────┐
  │ [________________]  ← input (cleared!)     │
  │                     ← div (vẫn rỗng)      │
  └────────────────────────────────────────────┘

  SAU KHI USER GÕ "Ian":
  ┌────────────────────────────────────────────┐
  │ [Ian_____________]  ← input (user gõ)      │
  │ Ian                 ← div (preview!) 🎉    │
  └────────────────────────────────────────────┘
```

---

## §3. Setup JavaScript — "post, jsInput, jsDiv, handlers!"

> Will: _"That is what we love doing, isn't it? In Hard Parts, the same thing on repeat."_

### Code mới — Phức tạp hơn

Will vui vẻ nhắc: _"The same thing on repeat. That's what we love doing."_ Lần này setup nhanh hơn vì pattern đã quen:

```javascript
let post = ""; // ① Data
const jsInput = document.querySelector("input"); // ② Accessor
const jsDiv = document.querySelector("div"); // ③ Accessor
jsInput.value = "What's up?"; // ④ Default text!

function handleInput() {
  // ⑤ Handler 1
  post = jsInput.value;
  jsDiv.textContent = post;
}

function handleClick() {
  // ⑥ Handler 2
  jsInput.value = ""; // Clear input!
}

jsInput.oninput = handleInput; // ⑦ Bind handler 1
jsInput.onclick = handleClick; // ⑧ Bind handler 2
```

**Justice** liệt kê DOM elements: input, div, script. Will hỏi: _"What happens on the page itself?"_ → Justice: _"Get input rendered and then a div that's not really shown but it's there."_ → Will: _"Rendered, I like that term."_

### Accessor Objects — jsInput methods

Lần này `jsInput` accessor object có **3 properties** quan trọng (thay vì 2):

- **`value`** — getter/setter cho input text
- **`oninput`** — setter để gắn input handler
- **`onclick`** — setter để gắn click handler!

Will: _"These are on all, or some of these are on all DOM elements. I just only show the ones which we're actually gonna use."_ → Tất cả properties có thể tra cứu trên **MDN**!

```
JAVASCRIPT MEMORY SAU SETUP:
═══════════════════════════════════════════════════════════════

  post: ""

  jsInput = {
    [[link]] → C++ input element
    value:    [getter/setter]  ← THÊM MỚI: default text!
    oninput:  [setter]         ← gắn handler input
    onclick:  [setter]         ← THÊM MỚI: handler click!
  }

  jsDiv = {
    [[link]] → C++ div element
    textContent: [getter/setter]
  }

  handleInput: ƒ { post=jsInput.value; jsDiv.textContent=post; }
  handleClick: ƒ { jsInput.value=""; }

  C++ DOM (sau setup):
  ┌──────────────────────────────────────────────────────────┐
  │ input: value="What's up?"                                │
  │        handler[input] → handleInput (ref!)              │
  │        handler[click] → handleClick (ref!)              │
  │ div:   text=""                                           │
  └──────────────────────────────────────────────────────────┘
```

---

## §4. Default Text & Setters — "What's Up?"

> Will: _"We're gonna use the value setter property on the jsInput object to set its value."_

### Dòng mới: jsInput.value = "What's up?"

Đây là dòng mới so với code trước: **set default text** cho input field! `jsInput.value = "What's up?"` sử dụng **setter** (không phải regular property!) để:

1. Đi theo hidden link → C++ input element
2. Set value property = "What's up?"
3. Render → "What's up?" hiển thị trong input field!

**Alexa** cho biết giá trị được set: _"The string 'What's on your mind'."_ Will sửa nhẹ (do code thật ghi "What's up?" cho ngắn hơn).

---

## §5. Handler Functions — "handleInput + handleClick!"

> Wyatt: _"We're using the setter method on jsInput called oninput... and we're passing the handleInput function definition to that setter."_

### Hai handler functions

**handleInput** (giữ nguyên từ trước): kéo value từ input → lưu vào post → đẩy ra div

**handleClick** (MỚI!): clear input field — set value = "" → xóa default text khi user click!

**Wyatt** mô tả binding hoàn hảo: _"We're using the setter method on jsInput called oninput, and we're passing the handleInput function definition to that setter. And then doing the same thing with onclick."_ Will: _"That deserves a round of applause!"_ 👏

```
HAI HANDLERS — SETUP:
═══════════════════════════════════════════════════════════════

  handleInput():
  ┌──────────────────────────────────────────────────────────┐
  │ post = jsInput.value     ← GETTER: C++ → JS            │
  │ jsDiv.textContent = post ← SETTER: JS → C++            │
  │                                                          │
  │ Mục đích: Khi user GÕ → cập nhật preview!             │
  └──────────────────────────────────────────────────────────┘

  handleClick():
  ┌──────────────────────────────────────────────────────────┐
  │ jsInput.value = ""       ← SETTER: clear input!        │
  │                                                          │
  │ Mục đích: Khi user CLICK → xóa default text!          │
  └──────────────────────────────────────────────────────────┘

  C++ DOM BINDINGS:
  ┌──────────────────────────────────────────────────────────┐
  │ input.handler["input"] → handleInput (reference!)      │
  │ input.handler["click"] → handleClick (reference!)      │
  │                                                          │
  │ Wyatt: "We're passing the handleInput function          │
  │         definition to that setter."                      │
  │ Will: "That deserves a ROUND OF APPLAUSE!" 👏           │
  └──────────────────────────────────────────────────────────┘
```

---

## §6. User Click → handleClick → Clear Input!

> Will: _"User action handleClick is going to be added to the callback queue."_

### Timeline — User click vào input

Synchronous setup xong. Bây giờ user action! User **click** vào input field:

1. Event "click" fires trên C++ input element
2. handleClick → **callback queue**
3. Event loop: call stack trống? ✅ (đã 1 phút!)
4. handleClick → **call stack** → JS thêm `()`!
5. Tạo **execution context** mới!

**Ian** mô tả bên trong handleClick: _"jsInput is gonna be our accessor object for that input... we're accessing the setter for value... and assigning an empty string literal. And because it's an accessor object, it's gonna happen over [in C++ land]."_

Will hỏi: pixels thay đổi thế nào? → Ian: _"We will end up with not pixels where they used to be."_ → Will: _"No pixels where there were pixels. Beautiful!"_

```
USER CLICK → handleClick:
═══════════════════════════════════════════════════════════════

  T=1min: User CLICK vào input! 🖱️

  ① Event "click" → C++ DOM
  ② handleClick → callback queue
  ③ Event loop: call stack trống? ✅
  ④ handleClick → call stack + ()!
  ⑤ Execution context mới!

  TRONG handleClick():
  ┌──────────────────────────────────────────────────────────┐
  │ jsInput.value = "";                                      │
  │ → Setter → hidden link → C++ input                     │
  │ → input.value = "" (xóa "What's up?")                  │
  │ → Render → pixels xóa! 🖥️                              │
  └──────────────────────────────────────────────────────────┘

  PIXELS:
  TRƯỚC: [What's up?______]
  SAU:   [________________]  ← CLEARED! ✅

  Ian: "We will end up with NOT PIXELS where they used to be."
  Will: "No pixels where there WERE pixels. Beautiful!" 😄
```

---

## §7. User Type → handleInput → Update Post → Update Div!

> Will: _"So there's Ian, Ian is now saved to post. Beautiful. And now we're going to update our textContent setter."_

### Timeline — User gõ "Ian"

Sau khi click (xóa default text), user gõ "Ian":

1. C++ input.value = "Ian"
2. Event "input" fires
3. handleInput → callback queue → call stack
4. **Execution context mới!**
5. `post = jsInput.value` → getter → "Ian" → post = "Ian"
6. `jsDiv.textContent = post` → setter → C++ div.text = "Ian" → pixels!

```
USER TYPE "Ian" → handleInput:
═══════════════════════════════════════════════════════════════

  User gõ "Ian" ⌨️

  ① C++ input.value = "Ian"
  ② Event "input" → handleInput → callback queue
  ③ Event loop → call stack
  ④ Execution context mới!

  TRONG handleInput():
  ┌──────────────────────────────────────────────────────────┐
  │ post = jsInput.value;                                    │
  │ → Getter → C++ input.value = "Ian"                     │
  │ → post = "Ian" ← JS memory cập nhật!                  │
  │                                                          │
  │ jsDiv.textContent = post;                                │
  │ → Setter → C++ div.text = "Ian"                        │
  │ → Render → "Ian" hiển thị trong div! 🎉                │
  └──────────────────────────────────────────────────────────┘

  PIXELS:
  ┌────────────────────────────────────────────┐
  │ [Ian_____________]  ← input               │
  │ Ian                 ← div (preview!) 🎉   │
  └────────────────────────────────────────────┘
```

---

## §8. Vấn Đề — "Exponential Complexity!"

> Will: _"We are starting to struggle to think about how it's doing its work."_

### Bối cảnh — Chỉ 2 handlers mà đã phức tạp!

Will nhấn mạnh: chỉ với **2 elements** và **2 handlers**, chúng ta ĐÃ phải **suy nghĩ rất nhiều** về luồng data:

- **Line 5**: Set default text "What's up?" → liên quan đến view!
- **Line 9**: Update textContent → liên quan đến view!
- **Line 12**: Clear input value → liên quan đến view!

Mỗi dòng ảnh hưởng view ở **điều kiện khác nhau**, phụ thuộc vào **thứ tự** user hành động!

### Bài toán exponential

Will đặt câu hỏi: nếu có **1,000 elements** và **40 handlers** mỗi element?

- 40 handlers × 40 handlers × 1,000 elements = hàng **triệu** kịch bản có thể xảy ra!
- Mỗi kịch bản phụ thuộc vào **lịch sử** hành động trước đó!
- Engineer phải **reasoning** (suy luận) qua TẤT CẢ đường đi!

Will: _"We need a way to make these changes as PREDICTABLE as possible."_

Giải pháp: **Giới hạn MỌI thay đổi view** phải qua:

1. **Cập nhật data** (state change)
2. **Chạy MỘT function duy nhất** chuyển data → view!

```
VẤN ĐỀ — EXPONENTIAL COMPLEXITY:
═══════════════════════════════════════════════════════════════

  VỚI 2 ELEMENTS + 2 HANDLERS:
  ┌──────────────────────────────────────────────────────────┐
  │ Kịch bản 1: User chưa làm gì                           │
  │   → Input: "What's up?" | Div: ""                      │
  │                                                          │
  │ Kịch bản 2: User click → rồi gõ "Ian"                 │
  │   → Input: "Ian"        | Div: "Ian"                   │
  │                                                          │
  │ Kịch bản 3: User gõ TRƯỚC khi click (nếu có thể)?     │
  │   → Input: "What's up?Ian" | Div: "What's up?Ian" 😱  │
  │   → BUG! Text append thay vì replace!                  │
  │                                                          │
  │ Chỉ 2 handlers mà ĐÃ có 3+ kịch bản!                 │
  └──────────────────────────────────────────────────────────┘

  VỚI 1000 ELEMENTS + 40 HANDLERS:
  ┌──────────────────────────────────────────────────────────┐
  │ 40 × 40 × 1000 = 1,600,000 kịch bản!                   │
  │                                                          │
  │ "You've got 40 handlers for a thousand different         │
  │  elements, each of them has 40 handlers. You're          │
  │  dealing with 40 × 40 × 1,000 possible scenario         │
  │  paths. Actually EVEN MORE than that!" — Will            │
  │                                                          │
  │ → KHÔNG THỂ reasoning qua tất cả!                      │
  │ → Cần PARADIGM MỚI!                                    │
  └──────────────────────────────────────────────────────────┘

  GIẢI PHÁP — ONE-WAY DATA BINDING:
  ┌──────────────────────────────────────────────────────────┐
  │ "Restrict EVERY change to view to be via:               │
  │  ① An updated data                                      │
  │  ② A run of a SINGLE data-to-view converter function"  │
  │                                                          │
  │ React, Next, Vue, Angular, Svelte — ALL USE IT!        │
  │ — Will                                                   │
  └──────────────────────────────────────────────────────────┘
```

---

## §9. Tự Implement: Multi-Handler UI Mô Phỏng

```javascript
// ═══════════════════════════════════════════════════
// Mô phỏng Multi-Handler UI — VẤN ĐỀ ad-hoc!
// Tự viết từ đầu — thấy tại sao cần paradigm!
// ═══════════════════════════════════════════════════

// ── Simplified DOM ──

class Element {
  constructor(type) {
    this.type = type;
    this.value = "";
    this.text = "";
    this._handlers = {};
  }
  setHandler(ev, fn) {
    this._handlers[ev] = fn;
  }
  fire(ev) {
    return this._handlers[ev] || null;
  }
}

// ── Accessor Factory ──

function accessor(el) {
  const a = {};
  Object.defineProperty(a, "value", {
    get() {
      return el.value;
    },
    set(v) {
      el.value = v;
      console.log(`  → input.value = "${v}"`);
    },
  });
  Object.defineProperty(a, "textContent", {
    get() {
      return el.text;
    },
    set(v) {
      el.text = v;
      console.log(`  → div.text = "${v}" 🖥️`);
    },
  });
  Object.defineProperty(a, "oninput", {
    set(fn) {
      el.setHandler("input", fn);
    },
  });
  Object.defineProperty(a, "onclick", {
    set(fn) {
      el.setHandler("click", fn);
    },
  });
  return a;
}

// ═══ AD-HOC APPROACH (vấn đề!) ═══

console.log("═══ AD-HOC APPROACH — VẤN ĐỀ! ═══\n");

const input = new Element("input");
const div = new Element("div");
const jsInput = accessor(input);
const jsDiv = accessor(div);

let post = "";

// Setup — set default text
jsInput.value = "What's up?";

// Handlers — mỗi handler tự quyết view!
function handleInput() {
  post = jsInput.value;
  jsDiv.textContent = post;
}

function handleClick() {
  jsInput.value = "";
}

jsInput.oninput = handleInput;
jsInput.onclick = handleClick;

// Scenario 1: User click → rồi gõ
console.log("── Scenario 1: Click → Type ──");
let h = input.fire("click");
if (h) h();
console.log(
  `  post = "${post}", input = "${input.value}", div = "${div.text}"`,
);

input.value = "Ian";
h = input.fire("input");
if (h) h();
console.log(
  `  post = "${post}", input = "${input.value}", div = "${div.text}"`,
);
console.log("  ✅ Đúng! Input='Ian', Div='Ian'\n");

// Reset
post = "";
input.value = "";
div.text = "";
jsInput.value = "What's up?";

// Scenario 2: User gõ TRƯỚC khi click (giả lập bug!)
console.log("── Scenario 2: Type WITHOUT Click ──");
input.value = "What's up?Bob";
h = input.fire("input");
if (h) h();
console.log(
  `  post = "${post}", input = "${input.value}", div = "${div.text}"`,
);
console.log("  ❌ BUG! Div hiển thị 'What's up?Bob'!");
console.log("  → Default text KHÔNG được clear!\n");

console.log("  Chỉ 2 handlers! 2 scenarios! Đã có BUG!");
console.log("  → Tưởng tượng 1000 elements × 40 handlers...");
console.log("  → KHÔNG THỂ reasoning ad-hoc!");
```

---

## §10. 🔬 Deep Analysis Patterns — Tại Sao Cần Paradigm Mới?

### 10.1 Pattern ①: Ad-hoc vs One-Way Data Binding

```
AD-HOC vs ONE-WAY DATA BINDING:
═══════════════════════════════════════════════════════════════

  AD-HOC (truyền thống):
  ┌──────────────────────────────────────────────────────────┐
  │ handleClick() {                                          │
  │   jsInput.value = "";  ← trực tiếp thay đổi VIEW!     │
  │ }                                                        │
  │ handleInput() {                                          │
  │   post = jsInput.value;                                  │
  │   jsDiv.textContent = post;  ← trực tiếp thay đổi!    │
  │ }                                                        │
  │                                                          │
  │ → Mỗi handler TỰ QUYẾT thay đổi view NÀO!            │
  │ → KHÔNG có quy tắc chung!                              │
  │ → Phải reasoning từng kịch bản!                        │
  │ → EXPONENTIAL complexity!                                │
  └──────────────────────────────────────────────────────────┘

  ONE-WAY DATA BINDING (paradigm mới):
  ┌──────────────────────────────────────────────────────────┐
  │ handleClick() {                                          │
  │   post = "";  ← CHỈ thay đổi DATA!                    │
  │   dataToView();  ← gọi converter!                      │
  │ }                                                        │
  │ handleInput() {                                          │
  │   post = jsInput.value;  ← CHỈ thay đổi DATA!         │
  │   dataToView();  ← gọi converter!                      │
  │ }                                                        │
  │ function dataToView() {                                  │
  │   jsInput.value = post || "What's up?";  ← view = f(data)│
  │   jsDiv.textContent = post;                              │
  │ }                                                        │
  │                                                          │
  │ → Handler CHỈ thay đổi data!                           │
  │ → MỘT function duy nhất quyết view!                    │
  │ → View LUÔN = f(data)! Predictable!                    │
  └──────────────────────────────────────────────────────────┘
```

### 10.2 Pattern ②: "State & View" — Reasoning

```
"REASONING ABOUT STATE AND VIEW":
═══════════════════════════════════════════════════════════════

  Will gọi quá trình suy luận "data → view" là:
  "Reasoning about STATE and VIEW"

  ┌──────────────────────────────────────────────────────────┐
  │ STATE (data):        VIEW (pixels):                      │
  │ post = ""        →   Input: "What's up?" | Div: ""     │
  │ post = ""        →   Input: "" | Div: ""  (sau click)  │
  │ post = "Ian"     →   Input: "Ian" | Div: "Ian"        │
  │                                                          │
  │ MỖI trạng thái STATE → MỘT trạng thái VIEW cụ thể!   │
  │ VIEW = f(STATE) — hàm thuần!                            │
  │                                                          │
  │ "Every SINGLE thing the user can see will be DEPENDENT  │
  │  in some way on that DATA." — Will                       │
  └──────────────────────────────────────────────────────────┘
```

### 10.3 Pattern ③: Framework Comparison

```
FRAMEWORK IMPLEMENTATIONS:
═══════════════════════════════════════════════════════════════

  React:
  ┌──────────────────────────────────────────────────────────┐
  │ const [post, setPost] = useState("");                    │
  │ // Handler chỉ thay đổi state!                         │
  │ const handleInput = (e) => setPost(e.target.value);     │
  │ // View = f(state)! JSX!                                │
  │ return <div>{post}</div>;                                │
  └──────────────────────────────────────────────────────────┘

  Vue:
  ┌──────────────────────────────────────────────────────────┐
  │ const post = ref("");                                    │
  │ // Handler chỉ thay đổi data!                          │
  │ const handleInput = () => post.value = input.value;     │
  │ // View = f(data)! Template!                            │
  │ <template><div>{{ post }}</div></template>               │
  └──────────────────────────────────────────────────────────┘

  ALL: Handler → State → dataToView → DOM!
  → ONE WAY: data flows in ONE DIRECTION!
```

---

## Self-Assessment Checklist

```
CHECKLIST — SAU KHI HỌC PHẦN 15:
═══════════════════════════════════════════════════════════════

  TRUTHS vs MOVES:
  [ ] Truths = cách browser THỰC SỰ hoạt động!
  [ ] Moves = lựa chọn, restrictions engineers TỰ ĐẶT!
  [ ] One-way data binding = move, KHÔNG phải truth!

  MULTI-HANDLER PROBLEM:
  [ ] 2 handlers → 3+ kịch bản → bugs!
  [ ] 1000 elements × 40 handlers → hàng triệu paths!
  [ ] Ad-hoc = mỗi handler tự quyết view!
  [ ] Exponential complexity = KHÔNG thể reasoning!

  ONE-WAY DATA BINDING:
  [ ] Handler → CHỈ thay đổi DATA (state)!
  [ ] MỘT function duy nhất: data → view!
  [ ] View = f(state) — LUÔN predictable!
  [ ] React, Vue, Angular, Svelte = ALL use it!

  TIẾP THEO → Phần 16: Data-to-View Converter!
  → "Một function quyết tất cả!"
```
