# The Hard Parts of UI Development — Phần 18: Data-to-View Converter — "Một Function Quyết Tất Cả!"

> 📅 2026-03-08 · ⏱ 40 phút đọc
>
> Nguồn: Frontend Masters — Will Sentance
> Khoá học: The Hard Parts of UI Development
> Bài: Separating Data & View Updates — "dataToView, Single Pipeline, setInterval!"
> Độ khó: ⭐️⭐️⭐️⭐️⭐️ | Advanced — one-way data binding implementation, state management, UI design pattern!

---

## Mục Lục

| #   | Phần                                                     |
| --- | -------------------------------------------------------- |
| 1   | dataToView — "Một Function Cho Mọi Thay Đổi!"            |
| 2   | Handler = Chỉ Thay Đổi Data — "Restriction!"             |
| 3   | Ternary Logic — "If Data Looks This Way, Display This!"  |
| 4   | Shift In Reasoning — "Data → View, Không View → View!"   |
| 5   | setInterval — "Chạy dataToView Mỗi 15ms!"                |
| 6   | Cập Nhật Thừa — "Máy Tính Nhanh, Developer Quý!"         |
| 7   | Tự Implement: One-Way Data Binding Mô Phỏng              |
| 8   | 🔬 Deep Analysis Patterns — UI Design Pattern Hoàn Chỉnh |

---

## §1. dataToView — "Một Function Cho Mọi Thay Đổi!"

> Will: _"One function, dataToView, that can affect our view. Everything is being affected there based on data."_

### Bối cảnh — Code mới với paradigm

Will viết lại code với **paradigm mới**: tách biệt hoàn toàn **data** và **view**. Giới thiệu function `dataToView` — **MỘT function duy nhất** quyết định TẤT CẢ những gì user thấy!

```javascript
let post = ""; // ① STATE

function dataToView() {
  // ② CONVERTER
  jsInput.value = post ? post : "What's up?"; // ternary!
  jsDiv.textContent = post;
}

function handleInput() {
  // ③ HANDLER 1
  post = jsInput.value; // chỉ DATA!
  dataToView(); // chạy converter!
}

function handleClick() {
  // ④ HANDLER 2
  post = ""; // chỉ DATA!
  dataToView(); // chạy converter!
}
```

Will phân tích: _"One function, line for dataToView, that can affect our view."_ — Chỉ CÓ MỘT nơi thay đổi view! Mọi handler đều kết thúc bằng `dataToView()`.

So sánh với ad-hoc approach:

- **Ad-hoc**: mỗi handler **tự quyết** thay đổi view → 500 dòng code ở 500 nơi khác nhau!
- **One-way**: mọi handler **chỉ thay đổi data** → gọi `dataToView()` → **1 nơi duy nhất** quyết view!

```
dataToView — SINGLE PIPELINE:
═══════════════════════════════════════════════════════════════

  AD-HOC (trước):
  ┌──────────────────────────────────────────────────────────┐
  │ Handler₁ → thay đổi view A                             │
  │ Handler₂ → thay đổi view B                             │
  │ Handler₃ → thay đổi view A + C                         │
  │ ...                                                      │
  │ Handler₅₀₀ → thay đổi view D + E + F                   │
  │                                                          │
  │ → 500 nơi thay đổi view! KHÔNG predictable!           │
  └──────────────────────────────────────────────────────────┘

  ONE-WAY (sau):
  ┌──────────────────────────────────────────────────────────┐
  │ Handler₁ → thay đổi DATA → dataToView()               │
  │ Handler₂ → thay đổi DATA → dataToView()               │
  │ Handler₃ → thay đổi DATA → dataToView()               │
  │ ...                                                      │
  │ Handler₅₀₀ → thay đổi DATA → dataToView()             │
  │                                                          │
  │ dataToView() = MỘT NƠI DUY NHẤT quyết view!          │
  │ → ĐỌC function này = BIẾT HẾT view logic!            │
  └──────────────────────────────────────────────────────────┘
```

---

## §2. Handler = Chỉ Thay Đổi Data — "Restriction!"

> Will: _"All the user can do, when they click or start writing, is update the data. And then run that dataToView converter function."_

### Quy tắc vàng: Handler CHỈ thay đổi state

Will đặt ra **restriction** (giới hạn tự đặt): handler functions **CHỈ ĐƯỢC**:

1. **Thay đổi data** (state) trong JavaScript memory
2. **Gọi dataToView()** để cập nhật view

Handler **KHÔNG ĐƯỢC** trực tiếp thay đổi DOM! Tất cả DOM manipulation phải đi qua `dataToView()`.

Đây là restriction — KHÔNG phải browser buộc ta làm vậy. Browser cho phép handler trực tiếp `jsDiv.textContent = "abc"`. Nhưng chúng ta **TỰ CHỌN** giới hạn bản thân vì lợi ích dài hạn!

Will: _"It's a restriction that is immensely popular."_ — React `setState`, Vue `ref()`, Angular signals — tất cả đều enforce restriction này!

```
RESTRICTION — HANDLER CHỈ THAY ĐỔI DATA:
═══════════════════════════════════════════════════════════════

  ❌ KHÔNG ĐƯỢC (ad-hoc):
  ┌──────────────────────────────────────────────────────────┐
  │ function handleClick() {                                 │
  │   jsInput.value = "";  ← TRỰC TIẾP thay đổi DOM!      │
  │ }                                                        │
  └──────────────────────────────────────────────────────────┘

  ✅ PHẢI LÀM (one-way):
  ┌──────────────────────────────────────────────────────────┐
  │ function handleClick() {                                 │
  │   post = "";           ← CHỈ thay đổi DATA!           │
  │   dataToView();        ← converter quyết view!         │
  │ }                                                        │
  └──────────────────────────────────────────────────────────┘

  "It's a RESTRICTION that is IMMENSELY POPULAR." — Will
```

---

## §3. Ternary Logic — "If Data Looks This Way, Display This!"

> Will: _"We go into the land of ternaries, because they are a great way to shorthand conditional logic."_

### Bối cảnh — Conditional rendering trong dataToView

Trong `dataToView`, Will dùng **ternary operator** để conditional rendering:

```javascript
jsInput.value = post ? post : "What's up?";
```

Logic: nếu `post` có giá trị (truthy) → hiển thị post. Nếu `post` rỗng (falsy) → hiển thị default text "What's up?"

Will giải thích: _"If data looks this way, display this. If data looks this way, display this."_ — Ternary = công cụ tự nhiên cho **mô tả conditional view**!

Và đây là insight hay: **MỌI thứ user thấy PHẢI phụ thuộc vào data**. Ngay cả "không hiển thị gì" cũng là quyết định dựa trên data (post === "" → div rỗng)!

```
TERNARY — CONDITIONAL VIEW:
═══════════════════════════════════════════════════════════════

  function dataToView() {
    jsInput.value = post ? post : "What's up?";
    jsDiv.textContent = post;
  }

  DATA:           INPUT:              DIV:
  post = ""    →  "What's up?" ←──── "" (rỗng)
  post = "Ian" →  "Ian"        ←──── "Ian"
  post = "Hi!" →  "Hi!"        ←──── "Hi!"

  MỌI trạng thái data → MỘT trạng thái view cụ thể!
  VIEW = f(DATA)  ← hàm thuần (pure function)!

  "If data looks this way, DISPLAY THIS.
   If data looks this way, DISPLAY THIS." — Will
```

---

## §4. Shift In Reasoning — "Data → View, Không View → View!"

> Will: _"No longer do we have to think about four or five different places that we could change under different conditions what the user sees."_

### Mindset shift — Từ "view → view" sang "data → view"

Will giải thích sự **thay đổi tư duy** quan trọng:

**Tư duy cũ (ad-hoc)**: _"If user clicks → change THIS element. If user types → change THAT element."_ → Suy nghĩ theo **element nào cần thay đổi**, phụ thuộc vào **hành động trước đó**!

**Tư duy mới (one-way)**: _"What's the current data? → dataToView produces the EXACT view."_ → Suy nghĩ theo **data hiện tại là gì**, view **luôn** là kết quả của data!

Will nhấn mạnh: _"There's no such thing as data-less change. Anything that's changed on the screen HAS to have associated data behind it."_ — KHÔNG CÓ thay đổi nào trên màn hình mà KHÔNG có data phía sau! Ngay cả implicit decisions (không set gì cho div = quyết định rằng div trống) cũng là data decisions!

Lợi ích khi debug:

- **Ad-hoc**: "Bug! User click, rồi type, rồi click lại → display sai! Phải trace 500 dòng handler!"
- **One-way**: "Bug! Data hiện tại là gì? post='abc'. dataToView() với post='abc' → view đúng không? → Nếu sai, bug ở dataToView. Nếu đúng, bug ở handler thay đổi data!"

```
SHIFT IN REASONING:
═══════════════════════════════════════════════════════════════

  CŨ (ad-hoc):
  ┌──────────────────────────────────────────────────────────┐
  │ "User click → change input"                             │
  │ "User type → change div"                                │
  │ "User click again → change input again"                 │
  │ → Suy nghĩ theo HÀNH ĐỘNG + LỊCH SỬ!                  │
  │ → Phải TRACE toàn bộ user journey!                     │
  └──────────────────────────────────────────────────────────┘

  MỚI (one-way):
  ┌──────────────────────────────────────────────────────────┐
  │ "Data = {post: 'Ian'}"                                   │
  │ "→ dataToView() → input='Ian', div='Ian'"               │
  │ → Suy nghĩ theo DATA HIỆN TẠI!                         │
  │ → KHÔNG CẦN biết lịch sử!                              │
  │ → View = f(data) mọi lúc!                              │
  │                                                          │
  │ "Everything on the screen MUST be a consequence         │
  │  of underlying DATA." — Will                             │
  └──────────────────────────────────────────────────────────┘

  DEBUG:
  ┌──────────────────────────────────────────────────────────┐
  │ Ad-hoc: "Trace 500 lines of handler code!" 😱          │
  │ One-way: "Check data → check dataToView → done!" 😊   │
  │                                                          │
  │ "We will be able to see EXACTLY the history of our      │
  │  data. And from that, EXACTLY know what the user        │
  │  should and would see." — Will                           │
  └──────────────────────────────────────────────────────────┘
```

---

## §5. setInterval — "Chạy dataToView Mỗi 15ms!"

> Will: _"Running dataToView every 15 milliseconds."_

### Bối cảnh — Auto-update pattern

Will đưa ra ý tưởng (thô nhưng hiệu quả): thay vì handler gọi `dataToView()` thủ công, sao không **tự động chạy** `dataToView()` liên tục bằng `setInterval`?

```javascript
setInterval(dataToView, 15); // Chạy mỗi 15ms!
```

Mỗi **15 milliseconds**, `dataToView()` chạy → kiểm tra data hiện tại → cập nhật TẤT CẢ view elements. Khi user thay đổi data (qua handler), view sẽ **tự cập nhật** trong vòng 15ms!

Will thừa nhận: _"We would NOT use this in practice in the long term, it's completely untenable."_ — KHÔNG dùng ở production! Nhưng để hiểu concept, nó **hoàn hảo**!

Tại sao untenable? Vì mỗi 15ms **TẤT CẢ** DOM elements bị cập nhật — kể cả những cái KHÔNG thay đổi! Với 1000 elements, mỗi 15ms update 1000 elements = **66,000 updates mỗi giây** = chậm!

Giải pháp thực tế: **Virtual DOM + Diffing** (React) hoặc **Reactive system** (Vue, Svelte) — chỉ update elements **THẬT SỰ thay đổi**!

```
setInterval — AUTO-UPDATE:
═══════════════════════════════════════════════════════════════

  setInterval(dataToView, 15);

  T=0ms:    dataToView() → input="What's up?", div=""
  T=15ms:   dataToView() → input="What's up?", div=""  (giống!)
  T=30ms:   dataToView() → input="What's up?", div=""  (giống!)
  ...
  T=60000ms: User click → post = ""  (handler only changes data!)
  T=60015ms: dataToView() → input="What's up?", div=""  ← AUTO!
  ...
  T=61000ms: User type "Ian" → post = "Ian"
  T=61015ms: dataToView() → input="Ian", div="Ian"  ← AUTO! 🎉

  ƯU ĐIỂM:
  ┌──────────────────────────────────────────────────────────┐
  │ → Handler CHỈ thay đổi data!                           │
  │ → KHÔNG cần gọi dataToView() thủ công!                 │
  │ → View TỰ CẬP NHẬT trong 15ms!                        │
  │ → Simple concept!                                        │
  └──────────────────────────────────────────────────────────┘

  NHƯỢC ĐIỂM:
  ┌──────────────────────────────────────────────────────────┐
  │ → Cập nhật TẤT CẢ elements mỗi 15ms!                  │
  │ → Kể cả elements KHÔNG thay đổi!                       │
  │ → 1000 elements × 66/sec = 66,000 updates/sec! 💀     │
  │ → "COMPLETELY UNTENABLE." — Will                        │
  └──────────────────────────────────────────────────────────┘

  GIẢI PHÁP PRODUCTION:
  ┌──────────────────────────────────────────────────────────┐
  │ React: Virtual DOM → diff → chỉ update thay đổi!      │
  │ Vue: Reactive proxy → watcher → chỉ update thay đổi!  │
  │ Svelte: Compile-time → chỉ update thay đổi!           │
  └──────────────────────────────────────────────────────────┘
```

---

## §6. Cập Nhật Thừa — "Máy Tính Nhanh, Developer Quý!"

> Will: _"Our computers are pretty damn fast. They can definitely take a bit of unnecessary updating."_

### Trade-off — Dev time vs Computer time

Will đưa ra trade-off triết học:

**Cập nhật thừa** (update tất cả elements): máy tính phải làm thêm → **chậm hơn**
**Reasoning thừa** (engineer phải suy luận element nào update): developer phải nghĩ thêm → **bugs nhiều hơn**

Will chọn: _"Our computer can put up with updating a few unnecessary pieces of content for the gains of OUR TIME to work out which bits to update."_ — Để máy làm thừa, developer tiết kiệm thời gian!

Nhưng ở scale lớn? Cần **hiệu quả hơn**: Virtual DOM, diffing algorithms, state hooks. Đây là nội dung tiếp theo!

```
TRADE-OFF — PERFORMANCE vs DEVELOPER TIME:
═══════════════════════════════════════════════════════════════

  ┌──────────────────────────────────────────────────────────┐
  │                                                          │
  │  Developer Time  ◄──────────►  Computer Performance     │
  │  (dễ reasoning)               (cập nhật hiệu quả)      │
  │                                                          │
  │  AD-HOC:                                                 │
  │  → Developer: phải reasoning NHIỀU (10/10 khó!)        │
  │  → Computer: cập nhật ĐÚNG element (10/10 nhanh!)      │
  │                                                          │
  │  ONE-WAY + setInterval:                                  │
  │  → Developer: reasoning ÍT (2/10 khó!)                 │
  │  → Computer: cập nhật TẤT CẢ (2/10 nhanh!)            │
  │                                                          │
  │  VIRTUAL DOM (React):                                    │
  │  → Developer: reasoning ÍT (2/10 khó!)                 │
  │  → Computer: cập nhật ĐÃ THAY ĐỔI (8/10 nhanh!)      │
  │  → BEST OF BOTH WORLDS! 🎉                             │
  │                                                          │
  └──────────────────────────────────────────────────────────┘
```

---

## §7. Tự Implement: One-Way Data Binding Mô Phỏng

```javascript
// ═══════════════════════════════════════════════════
// Mô phỏng ONE-WAY DATA BINDING
// Tự viết — hiểu React/Vue làm gì bên trong!
// ═══════════════════════════════════════════════════

// ── Simplified DOM ──

class DOMElement {
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

function accessor(el) {
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

// ═══ ONE-WAY DATA BINDING ═══

console.log("═══ ONE-WAY DATA BINDING DEMO ═══\n");

// DOM Setup
const inputEl = new DOMElement("input");
const divEl = new DOMElement("div");
const jsInput = accessor(inputEl);
const jsDiv = accessor(divEl);

// ── STATE (single source of truth!) ──
let post = "";

// ── DATA → VIEW CONVERTER (single pipeline!) ──
let renderCount = 0;

function dataToView() {
  renderCount++;
  jsInput.value = post ? post : "What's up?";
  jsDiv.textContent = post;
  console.log(
    `  🎨 render #${renderCount}: ` +
      `input="${inputEl.value}", div="${divEl.text}"`,
  );
}

// ── HANDLERS (only change DATA!) ──
function handleInput() {
  post = jsInput.value; // ← chỉ thay đổi DATA!
  dataToView(); // ← converter!
}

function handleClick() {
  post = ""; // ← chỉ thay đổi DATA!
  dataToView(); // ← converter!
}

// Bind handlers
jsInput.oninput = handleInput;
jsInput.onclick = handleClick;

// ── INITIAL RENDER ──
console.log("── Initial Render ──");
dataToView();

// ── USER CLICK ──
console.log("\n── User Click ──");
let h = inputEl.fire("click");
if (h) h();

// ── USER TYPE "Ian" ──
console.log("\n── User Type 'Ian' ──");
inputEl.value = "Ian";
h = inputEl.fire("input");
if (h) h();

// ── VERIFY: View = f(Data)! ──
console.log("\n── Verify ──");
console.log(`  DATA:  post = "${post}"`);
console.log(`  VIEW:  input = "${inputEl.value}", div = "${divEl.text}"`);
console.log(`  view = f(data)? ${divEl.text === post ? "✅" : "❌"}`);
console.log(`  Total renders: ${renderCount}`);

// ── setInterval DEMO ──
console.log("\n── setInterval Demo (simulated) ──");
let intervalCount = 0;
function simulateInterval(n) {
  for (let i = 0; i < n; i++) {
    dataToView(); // Chạy mỗi "15ms"!
    intervalCount++;
  }
}

console.log("  Simulating 5 intervals (data unchanged):");
simulateInterval(5);
console.log(`  → ${5} renders THỪA! Data không đổi!`);

console.log("\n  User changes data:");
post = "Hello!";
simulateInterval(1);
console.log(`  → Render #${renderCount}: view CẬP NHẬT!`);

console.log(`\n  Total renders: ${renderCount}`);
console.log("  → Nhiều render THỪA! Cần Virtual DOM! 🔧");
```

---

## §8. 🔬 Deep Analysis Patterns — UI Design Pattern Hoàn Chỉnh

### 8.1 Pattern ①: Complete UI Design Pattern

```
UI DESIGN PATTERN — ONE-WAY DATA BINDING:
═══════════════════════════════════════════════════════════════

  ┌── STATE ──────────────────────────────────────────────┐
  │ let post = "";     // tất cả data!                    │
  │ let clicked = false;                                   │
  │ let items = [];                                        │
  └───────────┬────────────────────────────────────────────┘
              │
              ▼
  ┌── DATA → VIEW CONVERTER ──────────────────────────────┐
  │ function dataToView() {                                │
  │   // MỌI view phụ thuộc vào STATE!                   │
  │   input.value = post || "What's up?";                 │
  │   div.textContent = post;                              │
  │ }                                                      │
  └───────────┬────────────────────────────────────────────┘
              │
              ▼
  ┌── VIEW (DOM) ─────────────────────────────────────────┐
  │ [What's up?______]  ← input                           │
  │ Ian                 ← div                              │
  └───────────┬────────────────────────────────────────────┘
              │ User action ← click, type!
              ▼
  ┌── HANDLER ────────────────────────────────────────────┐
  │ function handleClick() {                               │
  │   post = "";        // ← chỉ DATA!                   │
  │   dataToView();     // ← converter!                   │
  │ }                                                      │
  └───────────┬────────────────────────────────────────────┘
              │
              └──────────▶ quay lại STATE!  ← ONE WAY! ↻
```

### 8.2 Pattern ②: React so sánh

```
SO SÁNH VỚI REACT:
═══════════════════════════════════════════════════════════════

  VANILLA (chúng ta viết):          REACT (framework):
  ─────────────────────             ──────────────────────
  let post = "";                    const [post, setPost]
                                      = useState("");

  function dataToView() {           function App() {
    jsInput.value = post             return (
      || "What's up?";                <input value=
    jsDiv.textContent = post;            {post || "..."}
  }                                    />
                                       <div>{post}</div>
                                     );
                                    }

  function handleInput() {          function handleInput(e) {
    post = jsInput.value;             setPost(e.target.value);
    dataToView();                     // React auto-calls
  }                                   // dataToView (re-render)!
                                    }

  setInterval(dataToView, 15);      // React: auto re-render
                                    // + Virtual DOM diffing!

  KHÁC BIỆT CHÍNH:
  ┌──────────────────────────────────────────────────────────┐
  │ Vanilla: dataToView() + setInterval = THÔ!             │
  │ React: useState trigger → re-render → diff → update!  │
  │ → Cùng CONCEPT! Khác IMPLEMENTATION!                   │
  └──────────────────────────────────────────────────────────┘
```

### 8.3 Pattern ③: Tổng kết khoá học đến đây

```
TỔNG KẾT — HÀNH TRÌNH TỪ HTML → ONE-WAY BINDING:
═══════════════════════════════════════════════════════════════

  PART 1-6: HTML + CSS + DOM + Layout + Render
  → "Displaying content is EASY with HTML!"

  PART 7: Storing Data in JavaScript
  → "But HTML data is STATIC!"

  PART 8: WebIDL & WebCore
  → "JS accesses DOM via ACCESSOR OBJECTS!"

  PART 9-10: Updating DOM + Summary
  → "JS can change DOM via GETTER/SETTER!"
  → "But it's SO MUCH HARDER than HTML!"

  PART 11-12: Handling User Interaction
  → "EVENTS + HANDLERS = user can change data!"
  → "But NO PERMANENT BOND between JS ↔ DOM!"

  PART 13: One-Way Data Binding
  → "Multiple handlers = EXPONENTIAL complexity!"
  → "Need PARADIGM to restrict!"

  PART 14: Data-to-View Converter ← BẠN Ở ĐÂY!
  → "dataToView = SINGLE PIPELINE!"
  → "View = f(data) = PREDICTABLE!"
  → "This is what React/Vue/Angular DO!"

  TIẾP THEO:
  → Virtual DOM + Diffing (hiệu quả!)
  → State Hooks (composable!)
```

---

## Self-Assessment Checklist

```
CHECKLIST — SAU KHI HỌC PHẦN 18:
═══════════════════════════════════════════════════════════════

  dataToView:
  [ ] MỘT function duy nhất quyết TẤT CẢ view!
  [ ] Dùng ternary cho conditional rendering!
  [ ] View = f(data) — hàm thuần!

  HANDLER RESTRICTION:
  [ ] Handler CHỈ ĐƯỢC thay đổi DATA!
  [ ] Handler KHÔNG ĐƯỢC trực tiếp thay đổi DOM!
  [ ] Sau khi thay đổi data → gọi dataToView()!

  SHIFT IN REASONING:
  [ ] KHÔNG suy nghĩ "action nào → element nào"!
  [ ] SỤY NGHĨ "data hiện tại → view tương ứng"!
  [ ] Debug: check data → check dataToView → done!

  setInterval:
  [ ] Chạy dataToView mỗi 15ms = auto-update!
  [ ] THỪA! Update cả elements KHÔNG thay đổi!
  [ ] "Completely untenable" ở production!
  [ ] → Cần Virtual DOM + diffing!

  TRADE-OFF:
  [ ] Developer thời gian vs Computer performance!
  [ ] One-way: developer DỄ, computer CHẬM!
  [ ] Virtual DOM: developer DỄ, computer NHANH!

  TIẾP THEO → Phần 19: Virtual DOM & Diffing!
```
