# The Hard Parts of UI Development — Phần 17: Handling Multiple User Interactions — "Exponential Complexity!"

> 📅 2026-03-08 · ⏱ 35 phút đọc
>
> Nguồn: Frontend Masters — Will Sentance
> Khoá học: The Hard Parts of UI Development
> Bài: Handling Multiple User Interactions — "User Type 'Ian', Getter/Setter, Exponential Paths!"
> Độ khó: ⭐️⭐️⭐️⭐️⭐️ | Advanced — multiple handlers, conditional view changes, exponential reasoning, paradigm motivation!

---

## Mục Lục

| #   | Phần                                                |
| --- | --------------------------------------------------- |
| 1   | User Type "Ian" — "handleInput Callback!"           |
| 2   | Execution Context — "Getter → post → Setter → Div!" |
| 3   | UI Phức Tạp Hơn — "Chỉ 2 Handlers Mà Đã Khó!"       |
| 4   | Conditional View Changes — "Line 5, 9, 12!"         |
| 5   | Exponential Paths — "40 × 40 × 1000!"               |
| 6   | Giải Pháp — "Restrict → Data → dataToView!"         |
| 7   | Tự Implement: Multiple Handlers Exponential Demo    |
| 8   | 🔬 Deep Analysis Patterns — Tại Sao One-Way Thắng   |

---

## §1. User Type "Ian" — "handleInput Callback!"

> Will: _"Next user action, type. The user is gonna type Ian."_
> Ian: _"Let's go."_
> Will: _"Let's go Ian!"_ 😄

### Bối cảnh — Sau khi click (clear default text)

Sau handleClick xong (clear input), user bắt đầu **gõ**. Will chọn "Ian" thay vì "Hi" cho vui: _"Let's have something more interesting than Hi."_ Ian (học viên) hào hứng: _"Let's go!"_

User gõ "Ian" vào input field → C++ input.value = "Ian" → event "input" fires:

1. handleClick **đã bị xóa** khỏi callback queue (đã chạy xong!)
2. Call stack **đã được clear** (handleClick popped!)
3. handleInput → **callback queue** → event loop → **call stack**!

Will nhấn mạnh: _"I needed to wipe our handleClick from the callback queue, and then clear our call stack."_ — Quan trọng: queue và stack phải **sạch** trước khi function mới lên!

```
USER TYPE "Ian" → handleInput:
═══════════════════════════════════════════════════════════════

  T sau click: User gõ "Ian" ⌨️

  ① C++ input: value = "Ian" (user gõ!)
  ② Event "input" fires!
  ③ handleInput → callback queue

  Queue & Stack Status:
  ┌──────────────────────────────────────────────────────────┐
  │ TRƯỚC:                                                   │
  │ Callback queue: [ ] ← handleClick ĐÃ XÓA!            │
  │ Call stack: [ ] ← handleClick ĐÃ POP!                 │
  │                                                          │
  │ SAU event:                                               │
  │ Callback queue: [ handleInput ] ← MỚI!                 │
  │ Call stack: [ ] ← trống → event loop GO!               │
  └──────────────────────────────────────────────────────────┘

  Event loop: handleInput → call stack + ()!

  Will: "And our ORANGE is back to mark that this is
         being handled by JavaScript."
```

---

## §2. Execution Context — "Getter → post → Setter → Div!"

> Will: _"Ian is now saved to post. And now we are going to update our textContent setter."_

### handleInput() chạy — Execution context mới!

Will hỏi cả lớp: _"A brand new what, everybody?"_ → Tất cả: _"Execution context!"_ Will: _"Beautiful!"_

Bên trong handleInput:

**Line 5: `post = jsInput.value`** (GETTER)

- jsInput → hidden link → C++ input element
- `.value` = **getter** → lấy "Ian" từ C++
- post = "Ian" ← JavaScript data **CẬP NHẬT**!
- Will: _"Ian is now saved to post. Beautiful, look at that."_

**Line 6: `jsDiv.textContent = post`** (SETTER)

- jsDiv → hidden link → C++ div element
- `.textContent` = **setter** → set div.text = "Ian"
- Render → "Ian" hiển thị trong div!
- Will: _"That will show up on our view for the user."_

```
handleInput() — GETTER + SETTER:
═══════════════════════════════════════════════════════════════

  EXECUTION CONTEXT: handleInput()
  ┌──────────────────────────────────────────────────────────┐
  │                                                          │
  │ ① post = jsInput.value;        ← GETTER!               │
  │ ┌────────────────────────────────────────────────┐       │
  │ │ jsInput → [[link]] → C++ input                │       │
  │ │ .value = GETTER → C++ input.value = "Ian"     │       │
  │ │ → "Ian" trả về JS → post = "Ian" ✅          │       │
  │ └────────────────────────────────────────────────┘       │
  │                                                          │
  │ ② jsDiv.textContent = post;    ← SETTER!               │
  │ ┌────────────────────────────────────────────────┐       │
  │ │ jsDiv → [[link]] → C++ div                    │       │
  │ │ .textContent = SETTER → div.text = "Ian"      │       │
  │ │ → Render → "Ian" hiển thị! 🖥️                │       │
  │ └────────────────────────────────────────────────┘       │
  │                                                          │
  └──────────────────────────────────────────────────────────┘

  PIXELS:
  ┌────────────────────────────────────────────┐
  │ [Ian_____________]  ← input               │
  │ Ian                 ← div (preview!) 🎉   │
  └────────────────────────────────────────────┘

  Will: "Ian is now SAVED TO POST. Beautiful!"
```

---

## §3. UI Phức Tạp Hơn — "Chỉ 2 Handlers Mà Đã Khó!"

> Will: _"We are starting to struggle to think about how it's doing its work."_

### Bối cảnh — Will thú nhận khó!

Sau khi chạy xong cả handleClick VÀ handleInput, Will dừng lại và thú nhận:

_"Even with two elements, even with two handlers, is becoming harder to REASON ABOUT."_

Chỉ với:

- **2 elements** (input, div)
- **2 handlers** (handleClick, handleInput)

Mà đã phải: _"flow the data back and forth"_ — dữ liệu chạy qua chạy lại giữa JS ↔ C++, qua getter/setter, qua callback queue, qua execution context...

Will nhắc lại cả phần setup mệt nhọc: _"I had my post data here, I had the input field with some default text set in line 5."_ Rồi phải reasoning: click trước hay type trước? Default text còn không? Post đã cập nhật chưa?

```
CHỈ 2 HANDLERS — ĐÃ PHỨC TẠP:
═══════════════════════════════════════════════════════════════

  ELEMENTS: 2 (input, div)
  HANDLERS: 2 (handleClick, handleInput)
  FLOWS:    getter, setter, callback, execution context...

  LUỒNG DATA:
  ┌──────────────────────────────────────────────────────────┐
  │                                                          │
  │ JS: post="" ──setter──▶ C++: input.value="What's up?"  │
  │                                                          │
  │ User click ──event──▶ handleClick() ──setter──▶         │
  │               C++: input.value=""                        │
  │                                                          │
  │ User type ──event──▶ handleInput() ──getter──▶          │
  │               post="Ian" ──setter──▶ div.text="Ian"     │
  │                                                          │
  │ → 4 lần cross runtime boundary!                        │
  │ → 2 execution contexts!                                 │
  │ → Phải reasoning: click TRƯỚC type!                    │
  │ → Chỉ 2 handlers mà ĐÃ nhức đầu! 🤯                  │
  └──────────────────────────────────────────────────────────┘
```

---

## §4. Conditional View Changes — "Line 5, 9, 12!"

> Will: _"Line 5, line 9, line 12. Every one of those lines affects what the user sees."_

### 3 dòng thay đổi view — mỗi dòng khác điều kiện!

Will chỉ ra: trong code rất ngắn, có **3 dòng khác nhau** thay đổi view, mỗi dòng ở **điều kiện khác nhau**:

**Line 5**: `jsInput.value = "What's up?"` — Set default text (chạy lúc setup)
**Line 9**: `jsDiv.textContent = post` — Update div (chạy khi user gõ)
**Line 12**: `jsInput.value = ""` — Clear input (chạy khi user click)

Will phân tích: _"I've got a string of CONDITIONAL changes."_ Và đặt câu hỏi then chốt:

_"What if somehow the user was able to write something WITHOUT clicking? Then we've got still the 'What's up?' text in the..."_ — Nếu user gõ mà CHƯA click → default text vẫn còn → text APPEND thay vì replace → BUG!

_"I've got to reason through ALL THOSE possible paths the user can take."_ — Phải reasoning qua TẤT CẢ con đường!

```
CONDITIONAL VIEW CHANGES:
═══════════════════════════════════════════════════════════════

  3 DÒNG THAY ĐỔI VIEW — 3 ĐIỀU KIỆN:
  ┌──────────────────────────────────────────────────────────┐
  │                                                          │
  │ Line 5:  jsInput.value = "What's up?";                  │
  │          → Khi: SETUP (luôn chạy đầu tiên)            │
  │          → View: input hiển thị default text            │
  │                                                          │
  │ Line 9:  jsDiv.textContent = post;                      │
  │          → Khi: User ĐÃ GÕ (handleInput chạy)         │
  │          → View: div hiển thị preview                    │
  │                                                          │
  │ Line 12: jsInput.value = "";                            │
  │          → Khi: User ĐÃ CLICK (handleClick chạy)      │
  │          → View: input bị clear                          │
  │                                                          │
  └──────────────────────────────────────────────────────────┘

  VẤN ĐỀ: THỨ TỰ QUAN TRỌNG!
  ┌──────────────────────────────────────────────────────────┐
  │ ✅ Click → Type: default text cleared → gõ bình thường │
  │ ❌ Type (no click): default text CHƯA clear!            │
  │    → input = "What's up?Ian" ← BUG! Append!           │
  │    → div = "What's up?Ian" ← BUG! Hiển thị sai!      │
  │                                                          │
  │ "What if the user was able to write WITHOUT clicking?   │
  │  Then we've got STILL the 'What's up?' text!" — Will    │
  └──────────────────────────────────────────────────────────┘
```

---

## §5. Exponential Paths — "40 × 40 × 1000!"

> Will: _"You're dealing with 40 by 40 by 1,000 possible scenario paths. Actually even MORE than that!"_

### Bối cảnh — Scale lên = thảm hoạ!

Will đưa ra bài toán scale: nếu có **1,000 elements**, mỗi element có **40 handlers**:

- 40 handlers × có thể trigger theo bất kỳ thứ tự nào
- Mỗi handler phụ thuộc vào **lịch sử** actions trước đó
- 40 × 40 × 1,000 = **hàng triệu** kịch bản!
- _"Actually even MORE than that, because it's 40, you can take one, and then another, and another, all of them depending on the previous action."_

Will: exponential vì mỗi action tạo **nhánh mới** trong cây quyết định. Với 2 handlers = 2-3 paths. Với 40 handlers = **40!** (factorial) permutations × 1000 elements = KHÔNG THỂ reasoning!

```
EXPONENTIAL PATHS:
═══════════════════════════════════════════════════════════════

  2 HANDLERS:            40 HANDLERS:
  ┌────────────────┐     ┌────────────────────────────────┐
  │     start      │     │           start                │
  │    /     \     │     │    /   |   |   |   ... \       │
  │  click   type  │     │   h1  h2  h3  h4  ...  h40    │
  │   |       |    │     │   /\  /\  /\  /\       /\     │
  │  type    click │     │  40  40  40  40  ...  40       │
  │                │     │  /\  /\  /\  /\       /\      │
  │ = 2-3 paths    │     │ 40  40  40  40  ...  40        │
  │ = manageable!  │     │                                │
  └────────────────┘     │ = 40 × 40 × 40 × ... paths!   │
                         │ = EXPONENTIAL! 💀              │
                         │ × 1000 elements = IMPOSSIBLE!  │
                         └────────────────────────────────┘

  "You're dealing with 40 × 40 × 1,000 possible
   scenario paths. Actually even MORE than that!" — Will
```

---

## §6. Giải Pháp — "Restrict → Data → dataToView!"

> Will: _"Restrict EVERY change to view to be via: one, an updated data, and two, a run of a single data-to-view converter function."_

### One-Way Data Binding — Giải pháp!

Will tuyên bố giải pháp:

**① Restrict**: Giới hạn MỌI thay đổi view
**② Data first**: Thay đổi DATA trước
**③ Single converter**: Chạy MỘT function `dataToView()`

_"It's just one approach, but an IMMENSELY POPULAR one."_ → React, Next, Vue, Angular, Svelte — **TẤT CẢ** dùng!

Will cũng nhắc: _"It's also gonna allow us to do SEMI-VISUAL coding as well."_ — One-way data binding cho phép viết code gần giống visual (JSX, templates)!

```
GIẢI PHÁP — ONE-WAY DATA BINDING:
═══════════════════════════════════════════════════════════════

  AD-HOC (exponential!):
  ┌──────────────────────────────────────────────────────────┐
  │ Handler₁ → view change A                                │
  │ Handler₂ → view change B + C                            │
  │ Handler₃ → view change A + D (nếu handler₁ đã chạy)   │
  │ ...                                                      │
  │ → 40^n kịch bản! KHÔNG THỂ reasoning!                 │
  └──────────────────────────────────────────────────────────┘

  ONE-WAY (linear!):
  ┌──────────────────────────────────────────────────────────┐
  │ Handler₁ → update DATA → dataToView()                  │
  │ Handler₂ → update DATA → dataToView()                  │
  │ Handler₃ → update DATA → dataToView()                  │
  │ ...                                                      │
  │ → MỌI handler cùng 1 pattern!                           │
  │ → dataToView quyết TẤT CẢ view!                       │
  │ → LINEAR reasoning! ✅                                  │
  │                                                          │
  │ "RESTRICT every change to view to be via:               │
  │  ① An updated DATA                                      │
  │  ② A run of a SINGLE data-to-view converter" — Will    │
  │                                                          │
  │ React, Next, Vue, Angular, Svelte = ALL USE IT!        │
  └──────────────────────────────────────────────────────────┘
```

---

## §7. Tự Implement: Multiple Handlers Exponential Demo

```javascript
// ═══════════════════════════════════════════════════
// Mô phỏng — Multiple Handlers = Exponential Paths!
// So sánh Ad-hoc vs One-Way Data Binding!
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

// ═══ AD-HOC APPROACH ═══

console.log("═══ AD-HOC — EXPONENTIAL PATHS! ═══\n");

function testAdHoc(scenario, actions) {
  const input = new El("input");
  const div = new El("div");
  const jsI = acc(input);
  const jsD = acc(div);
  let post = "";

  // Setup
  jsI.value = "What's up?";

  // Handlers — ad-hoc (trực tiếp thay đổi view!)
  function handleClick() {
    jsI.value = "";
  }
  function handleInput() {
    post = jsI.value;
    jsD.textContent = post;
  }

  // Execute scenario
  actions.forEach((action) => {
    if (action === "click") handleClick();
    if (action === "type") {
      input.value = "Ian"; // simulate user typing
      handleInput();
    }
  });

  console.log(`  ${scenario}:`);
  console.log(`    input="${input.value}", div="${div.text}"`);
  console.log(
    `    ${div.text === "Ian" && input.value === "Ian" ? "✅ OK" : "⚠️ Unexpected!"}`,
  );
}

testAdHoc("Scenario 1: click → type", ["click", "type"]);
testAdHoc("Scenario 2: type (no click!)", ["type"]);
testAdHoc("Scenario 3: type → click", ["type", "click"]);
testAdHoc("Scenario 4: click → type → click", ["click", "type", "click"]);

console.log("\n  → 4 scenarios, 2 handlers, KHÁC NHAU mỗi lần!");
console.log("  → Phải reasoning TỪNG PATH!");

// ═══ ONE-WAY APPROACH ═══

console.log("\n═══ ONE-WAY — LINEAR! ═══\n");

function testOneWay(scenario, actions) {
  const input = new El("input");
  const div = new El("div");
  const jsI = acc(input);
  const jsD = acc(div);
  let post = "";

  // dataToView — MỘT function quyết TẤT CẢ!
  function dataToView() {
    jsI.value = post || "What's up?";
    jsD.textContent = post;
  }

  // Handlers — chỉ thay đổi DATA!
  function handleClick() {
    post = ""; // chỉ DATA!
    dataToView(); // converter!
  }
  function handleInput() {
    post = jsI.value; // chỉ DATA!
    dataToView(); // converter!
  }

  // Initial render
  dataToView();

  // Execute scenario
  actions.forEach((action) => {
    if (action === "click") handleClick();
    if (action === "type") {
      input.value = "Ian";
      handleInput();
    }
  });

  console.log(`  ${scenario}:`);
  console.log(`    post="${post}", input="${input.value}", div="${div.text}"`);
  console.log(`    view = f(data)? ${div.text === post ? "✅" : "❌"}`);
}

testOneWay("Scenario 1: click → type", ["click", "type"]);
testOneWay("Scenario 2: type (no click!)", ["type"]);
testOneWay("Scenario 3: type → click", ["type", "click"]);
testOneWay("Scenario 4: click → type → click", ["click", "type", "click"]);

console.log("\n  → 4 scenarios, CÙNG KẾT QUẢ: view = f(data)!");
console.log("  → KHÔNG CẦN reasoning paths!");
console.log("  → dataToView QUYẾT TẤT CẢ! ✅");
```

---

## §8. 🔬 Deep Analysis Patterns — Tại Sao One-Way Thắng

### 8.1 Pattern ①: Exponential vs Linear Reasoning

```
EXPONENTIAL vs LINEAR:
═══════════════════════════════════════════════════════════════

  AD-HOC: O(n!) reasoning — EXPONENTIAL!
  ┌──────────────────────────────────────────────────────────┐
  │ 2 handlers: 2! = 2 paths ← manageable!                │
  │ 5 handlers: 5! = 120 paths ← hard!                    │
  │ 10 handlers: 10! = 3,628,800 paths ← impossible!       │
  │ 40 handlers: 40! = 8.15 × 10⁴⁷ paths ← UNIVERSE! 🌌 │
  │                                                          │
  │ Mỗi path phụ thuộc vào LỊCH SỬ!                       │
  │ → Phải kiểm tra TỪNG tổ hợp!                          │
  └──────────────────────────────────────────────────────────┘

  ONE-WAY: O(1) reasoning — CONSTANT!
  ┌──────────────────────────────────────────────────────────┐
  │ 2 handlers: check dataToView() ← 1 function!          │
  │ 5 handlers: check dataToView() ← CÙNG 1 function!     │
  │ 10 handlers: check dataToView() ← CÙNG 1 function!    │
  │ 40 handlers: check dataToView() ← CÙNG 1 function!    │
  │                                                          │
  │ KHÔNG phụ thuộc lịch sử!                                │
  │ data hiện tại → view hiện tại → DONE!                  │
  └──────────────────────────────────────────────────────────┘
```

### 8.2 Pattern ②: Semi-Visual Coding

```
SEMI-VISUAL CODING:
═══════════════════════════════════════════════════════════════

  Will nhắc: "It's also gonna allow us to do
  SEMI-VISUAL coding as well."

  ┌──────────────────────────────────────────────────────────┐
  │ dataToView():                                            │
  │   jsInput.value = post || "What's up?";                 │
  │   jsDiv.textContent = post;                              │
  │                                                          │
  │ → ĐỌC function này = "THẤY" view!                    │
  │ → Gần như KHAI BÁO visual!                             │
  │ → "If post truthy → show post. Else → show default."  │
  └──────────────────────────────────────────────────────────┘

  EVOLUTION: dataToView → JSX/Templates:
  ┌──────────────────────────────────────────────────────────┐
  │ React JSX:                                               │
  │ return (                                                 │
  │   <input value={post || "What's up?"} />                │
  │   <div>{post}</div>                                      │
  │ );                                                       │
  │                                                          │
  │ → dataToView() BIẾN THÀNH JSX!                         │
  │ → Semi-visual = imperative → declarative!              │
  └──────────────────────────────────────────────────────────┘
```

---

## Self-Assessment Checklist

```
CHECKLIST — SAU KHI HỌC PHẦN 17:
═══════════════════════════════════════════════════════════════

  handleInput FLOW:
  [ ] User type → C++ value update + event fires!
  [ ] handleInput → callback queue (sau handleClick xóa!)
  [ ] Execution context → getter → post → setter → div!

  CONDITIONAL VIEW CHANGES:
  [ ] Line 5, 9, 12 — mỗi dòng thay đổi view!
  [ ] Mỗi dòng ở ĐIỀU KIỆN KHÁC!
  [ ] Thứ tự user actions QUAN TRỌNG!
  [ ] Type trước click = BUG (append default text!)

  EXPONENTIAL PATHS:
  [ ] 2 handlers = 2-3 paths (manageable!)
  [ ] 40 handlers = 40! paths (IMPOSSIBLE!)
  [ ] × 1000 elements = thảm hoạ!

  GIẢI PHÁP:
  [ ] Restrict: MỌI view change qua data + dataToView!
  [ ] Linear reasoning: check 1 function = DONE!
  [ ] React, Next, Vue, Angular, Svelte = ALL use it!
  [ ] Semi-visual coding: dataToView → JSX/templates!

  TIẾP THEO → Phần 18: Data-to-View Converter!
```
