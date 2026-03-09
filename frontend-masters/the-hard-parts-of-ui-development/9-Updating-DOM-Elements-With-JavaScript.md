# The Hard Parts of UI Development — Phần 9: Updating DOM Elements with JavaScript — "Getter/Setter = Cầu Nối Data → Pixels!"

> 📅 2026-03-08 · ⏱ 35 phút đọc
>
> Nguồn: Frontend Masters — Will Sentance
> Khoá học: The Hard Parts of UI Development
> Bài: Updating DOM Elements with JavaScript — "textContent Setter, Two Runtimes, Fine-Grained Control!"
> Độ khó: ⭐️⭐️⭐️ | Intermediate — getter/setter properties, cross-runtime data flow, declarative vs imperative!

---

## Mục Lục

| #   | Phần                                                |
| --- | --------------------------------------------------- |
| 1   | textContent Setter — "Không Phải Property Thường!"  |
| 2   | Hai Runtime Khác Nhau — "Data Ở JS, Display Ở C++!" |
| 3   | HTML vs JavaScript — "Declarative vs Imperative!"   |
| 4   | Call Stack & querySelector — "Có Trên Stack Không?" |
| 5   | JavaScript Runtimes Across Script Tags              |
| 6   | Tại Sao Cần Biết — "Interview Edge + Debug Power!"  |
| 7   | Tự Implement: Getter/Setter DOM Binding Mô Phỏng    |
| 8   | 🔬 Deep Analysis Patterns — 5 Tư Duy Phân Tích Sâu  |

---

## §1. textContent Setter — "Không Phải Property Thường!"

> Will: _"A property that acts by running code under the hood to go and do something else, even though it looks like a property, you can call a getter setter property."_

### Bối cảnh — jsDiv.textContent = post

Will bắt đầu bằng dòng code `jsDiv.textContent = post`. Ông nhắc lại rằng `jsDiv` thực sự KHÔNG phải là cái console.log hiển thị (`<div></div>`) — mà là **JavaScript object** với method có quyền truy cập C++ DOM element.

Will hỏi học viên Ian: giá trị của `post` là gì? Ian trả lời chính xác: _"The current value is the string Hi and exclamation mark."_ — `"Hi!"`.

### Câu hỏi mấu chốt — Nếu textContent là property thường?

Will đặt câu hỏi rất sắc bén: nếu `textContent` là **regular property** (thuộc tính thông thường), thì `"Hi!"` sẽ được lưu Ở ĐÂU?

Ian trả lời xuất sắc (Will yêu cầu vỗ tay!): _"If it was a regular old JavaScript object then it would get stored under the key textContent in the object jsDiv."_ — Nếu là property thường, `"Hi!"` sẽ nằm **trong JavaScript memory**, trên object `jsDiv`, dưới key `textContent`.

Và Will chỉ ra: điều đó **hoàn toàn vô dụng**! _"Which is of zero use to us!"_ Vì data nằm trong JS memory thì **user không thấy gì trên màn hình**! Chúng ta cần data đi **RA NGOÀI** — đến C++ DOM — để pixels thay đổi!

### textContent = Getter/Setter Property

Đây là lý do `textContent` KHÔNG phải regular property — nó là **getter/setter property**. Khi bạn viết `jsDiv.textContent = "Hi!"`, TRÔNG giống gán property, nhưng thực tế **chạy code bên trong** (setter function):

1. **Đi theo hidden link** đến C++ div element
2. **Set text** trên C++ element (`div.text = "Hi!"`)
3. **Trigger** layout recalculation + repaint → pixels thay đổi!

Will gọi đây là _"a property that acts by running code under the hood"_ — property mà HÀNH ĐỘNG bằng cách chạy code phía dưới. Nó **trông** như property assignment, nhưng **thực chất** là function call cross biên giới JS ↔ C++!

```
textContent: REGULAR PROPERTY vs GETTER/SETTER:
═══════════════════════════════════════════════════════════════

  NẾU LÀ REGULAR PROPERTY (vô dụng!):
  ┌──────────────────────────────────────────────────────────┐
  │ jsDiv.textContent = "Hi!";                               │
  │                                                          │
  │ jsDiv = {                                                │
  │   textContent: "Hi!"  ← lưu TRONG JS memory!           │
  │   [[link]] → C++ div                                    │
  │ }                                                        │
  │                                                          │
  │ C++ DOM: div.text = "" ← KHÔNG THAY ĐỔI!              │
  │ Pixels: (rỗng) ← USER KHÔNG THẤY GÌ!                  │
  │                                                          │
  │ "Which is of ZERO USE to us!" — Will                    │
  └──────────────────────────────────────────────────────────┘

  THỰC TẾ LÀ GETTER/SETTER (hữu dụng!):
  ┌──────────────────────────────────────────────────────────┐
  │ jsDiv.textContent = "Hi!";  ← TRÔNG giống property!    │
  │                                                          │
  │ NHƯNG THỰC TẾ:                                          │
  │ ① jsDiv.__setter__("Hi!")  ← chạy function!            │
  │ ② Đi theo [[link]] → C++ div element                   │
  │ ③ C++ div.text = "Hi!" ← THAY ĐỔI C++ DATA!          │
  │ ④ Layout engine tính toán lại                           │
  │ ⑤ Render engine vẽ pixels → "Hi!" hiển thị! 🖥️        │
  │                                                          │
  │ "A property that acts by RUNNING CODE under the hood    │
  │  to go and do something else, even though it LOOKS      │
  │  LIKE a property — GETTER SETTER property." — Will      │
  └──────────────────────────────────────────────────────────┘

  IAN'S INSIGHT (được vỗ tay!):
  ┌──────────────────────────────────────────────────────────┐
  │ Ian: "If regular property → stored under key            │
  │       textContent in object jsDiv."                      │
  │ Will: "ZERO USE to us!"                                  │
  │ Ian: "We probably want it to go out to the DOM,         │
  │       and by extension show up in the UI."               │
  │ Will: "Beautiful, wow, Ian, excellent!"                  │
  └──────────────────────────────────────────────────────────┘
```

---

## §2. Hai Runtime Khác Nhau — "Data Ở JS, Display Ở C++!"

> Will: _"Our data is in one runtime, and the structure that persists displaying that data is in an entirely different runtime that we access on a case by case basis."_

### Bối cảnh — Vấn đề cốt lõi của UI engineering

Will nhấn mạnh đây là **vấn đề cốt lõi** của toàn bộ UI engineering trong browser: **data** nằm ở JavaScript runtime, nhưng **display** nằm ở C++ runtime (DOM). Hai thế giới này **hoàn toàn tách biệt**, và chúng ta phải **thủ công** chuyển data qua lại giữa chúng.

Will vẽ một **double line** (đường kẻ đôi) trên bảng để phân tách hai runtime — đây là biên giới quan trọng nhất trong kiến trúc browser!

Câu hỏi từ Will: _"Wouldn't it be nice if we could have changes of data here flow directly through to here?"_ — Chẳng phải sẽ tuyệt vời nếu thay đổi data ở JS **tự động chảy** sang DOM? KHÔNG! Chúng ta phải **thủ công** làm điều đó, và đây chính là lý do UI frameworks (React, Vue, Angular, Svelte) tồn tại!

### Tại sao đây là thách thức?

Will giải thích cụ thể:

1. **User thay đổi gì đó trên trang** → data thay đổi ở DOM (C++)
2. **Nhưng JavaScript KHÔNG TỰ BIẾT** → phải có handler để "nghe" sự kiện
3. **Kéo data từ DOM về JS** → cập nhật biến JavaScript
4. **Đẩy data từ JS ra DOM** → cập nhật element hiển thị
5. **Mỗi bước đều thủ công** → rất dễ quên, rất dễ lỗi!

Will kết luận: _"It's gonna be why we impose such strict rules on ourselves."_ — Đây chính là lý do chúng ta áp đặt **quy tắc nghiêm ngặt** (one-way data flow, immutable state, v.v.) — để kiểm soát sự phức tạp này!

```
HAI RUNTIME — VẤN ĐỀ CỐT LÕI:
═══════════════════════════════════════════════════════════════

  ┌──────────────────────────┐ ║ ┌──────────────────────────┐
  │   JAVASCRIPT RUNTIME     │ ║ │    C++ RUNTIME (WebCore) │
  │                          │ ║ │                          │
  │   DATA:                  │ ║ │   DISPLAY:               │
  │   post = "Hi!"           │ ║ │   div.text = "Hi!"       │
  │                          │ ║ │   → pixels! 🖥️          │
  │   CODE:                  │ ║ │                          │
  │   functions, logic       │ ║ │   Layout + Render        │
  │                          │ ║ │                          │
  │   CÓ THỂ thay đổi data! │ ║ │   KHÔNG có code logic!  │
  │   KHÔNG có pixels!       │ ║ │   Chỉ hiển thị!         │
  └──────────────────────────┘ ║ └──────────────────────────┘
                               ║
              ═══ BIÊN GIỚI ═══║═══ PHẢI THỦ CÔNG VƯỢT QUA! ═══
                               ║
  JS → DOM: jsDiv.textContent = post (setter → C++)
  DOM → JS: let val = jsInput.value (getter ← C++)

  VẤN ĐỀ:
  ┌──────────────────────────────────────────────────────────┐
  │ User gõ → DOM thay đổi → JS KHÔNG TỰ BIẾT!            │
  │ JS thay đổi data → DOM KHÔNG TỰ CẬP NHẬT!            │
  │                                                          │
  │ → Phải THỦ CÔNG chuyển qua lại!                        │
  │ → Mỗi bước đều có thể SAI!                             │
  │ → Đây là lý do React, Vue, Angular tồn tại!           │
  │                                                          │
  │ "These are TWO DIFFERENT RUNTIMES that we're gonna      │
  │  have to MANUALLY make the moves across." — Will        │
  └──────────────────────────────────────────────────────────┘
```

---

## §3. HTML vs JavaScript — "Declarative vs Imperative!"

> Will: _"JavaScript is so rough. However, it's gonna give us fine-grained editing control."_

### Bối cảnh — So sánh sức mạnh tra đổi

Will so sánh: để hiển thị "Hi!" trên trang, **HTML** cần **3 ký tự** — viết `Hi!` trong `<div>`. JavaScript cần... HÀNG CHỤC dòng code: khai báo biến, querySelector, tạo accessor object, set textContent qua hidden link!

Will hài hước: _"We've now managed to display content that would have taken us one line in HTML. Three letters, we could have just written 'Hi!' inside of that div."_

### Declarative vs Imperative

Will dùng thuật ngữ **declarative vs imperative** (mô tả vs mệnh lệnh), nhưng ông thích dùng từ **descriptive** (mô tả) hơn:

**HTML = Descriptive (Mô tả):**

- "Tôi MUỐN có div với text 'Hi!'" → Xong! Browser lo phần còn lại!
- Liệt kê CÁI GÌ hiển thị, không quan tâm LÀM SAO!

**JavaScript = Imperative (Mệnh lệnh):**

- Bước 1: Tạo biến. Bước 2: Tìm element. Bước 3: Set textContent. Bước 4: ...
- Chỉ rõ TỪNG BƯỚC phải làm, rất chi tiết!

Will kết luận hay: _"HTML is so magically intuitive... JavaScript is so rough. However, it's gonna give us fine-grained editing control."_ — HTML trực quan tuyệt vời, JS thô ráp, NHƯNG JS cho phép **kiểm soát chi tiết** — có thể thay đổi bất cứ gì, bất cứ lúc nào!

Và đây là trade-off cốt lõi: **sự đơn giản (HTML)** vs **khả năng thay đổi (JS)**. Toàn bộ khoá học này về việc tìm cách **kết hợp cả hai** — mô tả đơn giản NHƯ HTML, nhưng với data THAY ĐỔI ĐƯỢC như JavaScript. Đó chính là mục tiêu của UI frameworks!

```
DECLARATIVE vs IMPERATIVE:
═══════════════════════════════════════════════════════════════

  HTML — DESCRIPTIVE (1 bước!):
  ┌──────────────────────────────────────────────────────────┐
  │ <div>Hi!</div>                                           │
  │                                                          │
  │ → 3 ký tự cho content!                                  │
  │ → Browser tự lo: parse, DOM, layout, render, pixels!   │
  │ → "Magically intuitive!" — Will                         │
  │ → NHƯNG: data cố định! KHÔNG thay đổi được!            │
  └──────────────────────────────────────────────────────────┘

  JAVASCRIPT — IMPERATIVE (6+ bước!):
  ┌──────────────────────────────────────────────────────────┐
  │ let post = "Hi!";                          // ① Lưu data│
  │ const jsDiv = document.querySelector("div");// ② Tìm el │
  │ // → hidden link, tạo accessor object...   // ③④⑤ ...  │
  │ jsDiv.textContent = post;                  // ⑥ Set DOM │
  │                                                          │
  │ → 4+ dòng code cho cùng kết quả!                       │
  │ → Cross biên giới JS ↔ C++!                             │
  │ → "JavaScript is so rough!" — Will                      │
  │ → NHƯNG: data CÓ THỂ thay đổi! MẠNH MẼ!              │
  └──────────────────────────────────────────────────────────┘

  TRADE-OFF:
  ┌──────────────────────────────────────────────────────────┐
  │ HTML: Đơn giản + Trực quan = 😊                         │
  │       Nhưng KHÔNG thay đổi được = 😢                    │
  │                                                          │
  │ JavaScript: Phức tạp + Nhiều bước = 😤                  │
  │             Nhưng FINE-GRAINED CONTROL = 💪              │
  │                                                          │
  │ MỤC TIÊU UI FRAMEWORKS:                                │
  │ → Kết hợp cả hai!                                      │
  │ → Mô tả đơn giản NHƯ HTML (declarative!)               │
  │ → Với data THAY ĐỔI ĐƯỢC như JavaScript!                │
  │ → React JSX, Vue template, Svelte markup = giải pháp!  │
  └──────────────────────────────────────────────────────────┘
```

---

## §4. Call Stack & querySelector — "Có Trên Stack Không?"

> Will: _"Yes, as a JavaScript function, even though it's actually doing a bunch of work outside, it technically will go on the call stack."_

### Bối cảnh — Câu hỏi từ John

Học viên John hỏi một câu rất thú vị: _"document.querySelector là có được push lên call stack không?"_

Will trả lời cẩn thận: **Có, kỹ thuật thì có** — querySelector là JavaScript function, nên nó sẽ lên call stack. NHƯNG Will **không bao giờ vẽ nó trên call stack** vì lý do sư phạm:

1. Call stack thường chỉ chứa **code mà chúng ta viết** — functions mà ta có thể đọc, debug, thay đổi
2. querySelector **không phải code chúng ta viết** — ta không thể đi vào và debug bên trong nó
3. querySelector **làm việc NGOÀI JavaScript** — nó cross sang C++ DOM, nên vẽ trên call stack sẽ gây nhầm lẫn

Will nói: _"I like to think of the stuff on the call stack as being the code that we have written and that we are taking the thread of execution inside of."_ — Call stack dành cho code MÀ TA ĐI VÀO BÊN TRONG.

### Ranh giới giữa JS execution và C++ code

Will đặt câu hỏi triết học: **"Where does the JavaScript execution end and where does the C++ code begin?"** — Ở đâu JavaScript kết thúc và C++ bắt đầu? Đây là ranh giới mờ — vì JavaScript **chạy bên trong** browser (C++), nên mọi thứ kỹ thuật đều là C++ ở mức thấp nhất!

```
CALL STACK — QUERYSELECTOR CÓ Ở ĐÂY KHÔNG?
═══════════════════════════════════════════════════════════════

  KỸ THUẬT: Có! querySelector lên call stack!
  ┌──────────────────────────────────────────────────────────┐
  │ CALL STACK:                                              │
  │ ┌─────────────────────────┐                             │
  │ │ querySelector("div")    │ ← kỹ thuật thì CÓ!        │
  │ │ global()                │                             │
  │ └─────────────────────────┘                             │
  └──────────────────────────────────────────────────────────┘

  NHƯNG WILL KHÔNG VẼ NÓ — TẠI SAO?
  ┌──────────────────────────────────────────────────────────┐
  │ ① Chúng ta KHÔNG viết code bên trong querySelector!    │
  │ ② Chúng ta KHÔNG THỂ debug bên trong nó!               │
  │ ③ Nó làm việc NGOÀI JS — trong C++ WebCore!            │
  │                                                          │
  │ → Call stack = code MÀ TA ĐI VÀO BÊN TRONG!           │
  │ → querySelector = "hộp đen" — ta chỉ thấy output!     │
  │                                                          │
  │ "I like to think of the stuff on the call stack as      │
  │  being the code that WE HAVE WRITTEN and that we are    │
  │  taking the thread of execution INSIDE OF." — Will      │
  └──────────────────────────────────────────────────────────┘
```

---

## §5. JavaScript Runtimes Across Script Tags

> Will: _"We'll see that in a moment... these are ones which become interesting."_

Một học viên hỏi: _"Do all script tags refer to the same JavaScript runtime with shared memory space?"_ Will tạm dừng câu hỏi này — sẽ trả lời sau khi xây dựng custom DOM implementation. Nhưng đây là preview: **Có**, tất cả `<script>` tags trên cùng page chia sẻ **cùng một** JavaScript runtime và global memory space (trừ khi dùng `type="module"` với scope riêng, hoặc Web Workers).

---

## §6. Tại Sao Cần Biết — "Interview Edge + Debug Power!"

> Will: _"You're gonna be able to say, I prefer to spin up my own custom implementation of the virtual DOM."_

### Bối cảnh — "Turtles all the way down"

Will dùng câu nói _"turtles all the way down"_ — luôn có thể đi sâu hơn MỘT TẦNG nữa. Câu hỏi là: **đi sâu có GIÚP** bạn xây dựng thứ gì tốt hơn không?

Will đưa ra 3 lý do cần biết những điều này:

**① Debug power:** Khi hiểu cách DOM, accessor objects, getter/setter hoạt động bên trong, bạn có thể **debug** React, Vue, Angular ở mức sâu nhất — không chỉ đọc error message, mà hiểu **TẠI SAO** lỗi xảy ra!

**② Build your own:** Đến cuối khóa, bạn sẽ có thể **tự xây** virtual DOM implementation — hiểu từ nền tảng tại sao React làm những gì nó làm.

**③ Interview edge:** Will hài hước (nhưng nghiêm túc): _"I'm not saying you wanna scare them [interviewers]... but I am saying that you want them to come away saying, uh-oh, my job is on the line."_ — Khi bạn có thể nói _"I prefer to spin up my own custom implementation of the virtual DOM"_, senior engineers sẽ bị ẤN TƯỢNG!

```
TẠI SAO CẦN BIẾT "DƯỚI HOOD"?
═══════════════════════════════════════════════════════════════

  ① DEBUG POWER:
  ┌──────────────────────────────────────────────────────────┐
  │ React báo lỗi? → Bạn hiểu TẠI SAO vì biết DOM works! │
  │ Vue re-render? → Bạn biết getter/setter trigger!       │
  │ Angular change detection? → Bạn hiểu zone.js + DOM!    │
  │                                                          │
  │ "Such that you can DEBUG them, such that you can        │
  │  WORK WITH THEM AT SCALE." — Will                       │
  └──────────────────────────────────────────────────────────┘

  ② BUILD YOUR OWN:
  ┌──────────────────────────────────────────────────────────┐
  │ Cuối khóa → tự viết virtual DOM!                        │
  │ → Hiểu React/Vue/Svelte từ nền tảng!                   │
  │ → "Genuinely spin up your own versions!" — Will         │
  └──────────────────────────────────────────────────────────┘

  ③ INTERVIEW EDGE:
  ┌──────────────────────────────────────────────────────────┐
  │ "I prefer to spin up my own custom implementation       │
  │  of the virtual DOM."                                    │
  │                                                          │
  │ Senior engineer: 😳 "Uh-oh, my job is on the line."    │
  │                                                          │
  │ "I'm not saying you wanna SCARE them...                 │
  │  but I AM saying you want them to come away             │
  │  saying UH-OH." — Will 😄                               │
  └──────────────────────────────────────────────────────────┘
```

---

## §7. Tự Implement: Getter/Setter DOM Binding Mô Phỏng

```javascript
// ═══════════════════════════════════════════════════
// Mô phỏng Regular Property vs Getter/Setter
// Tự viết từ đầu — hiểu tại sao DOM dùng setter!
// ═══════════════════════════════════════════════════

// ── C++ DOM Element (mô phỏng) ──

class CppDivElement {
  constructor() {
    this.text = "";
  }

  setText(value) {
    this.text = value;
    console.log(`  🔧 C++: div.text = "${value}"`);
    // Trigger layout + render!
    console.log(`  🖥️ Render: Vẽ lại pixels → "${value}" hiện!`);
  }
}

// ── Demo: Regular Property (vô dụng!) ──

console.log("═══ DEMO: Regular Property vs Getter/Setter ═══\n");

console.log("── 1. Regular Property (VÔ DỤNG!) ──");
const cppDiv = new CppDivElement();
const regularObj = {
  textContent: "", // regular property!
  _link: cppDiv,
};
regularObj.textContent = "Hi!";
console.log(`  JS memory: textContent = "${regularObj.textContent}"`);
console.log(`  C++ DOM: div.text = "${cppDiv.text}"`);
console.log(`  ❌ Data nằm TRONG JS! C++ DOM KHÔNG thay đổi!`);
console.log(`  ❌ User KHÔNG thấy gì trên màn hình!\n`);

// ── Demo: Getter/Setter Property (hữu dụng!) ──

console.log("── 2. Getter/Setter Property (ĐÚNG CÁCH!) ──");
const cppDiv2 = new CppDivElement();
const accessorObj = {};

// Hidden link
Object.defineProperty(accessorObj, "_link", {
  value: cppDiv2,
  enumerable: false,
});

// Getter/Setter — giống DOM thật!
Object.defineProperty(accessorObj, "textContent", {
  get() {
    console.log(`  ← GETTER: đi theo hidden link → C++!`);
    return cppDiv2.text;
  },
  set(value) {
    console.log(`  → SETTER: đi theo hidden link → C++!`);
    cppDiv2.setText(value); // Cross biên giới JS → C++!
  },
});

accessorObj.textContent = "Hi!"; // → SETTER chạy!
console.log(`  ✅ C++ DOM thay đổi! User thấy "Hi!" 🎉\n`);

// ── Demo: Hai Runtime Problem ──

console.log("── 3. Hai Runtime Problem ──");
let post = "Hi!";
console.log(`  JS: post = "${post}"`);
console.log(`  DOM: div.text = "${cppDiv2.text}"`);
console.log(`  → Cả hai đang ĐỒNG BỘ! ✅`);

post = "Hello!"; // Thay đổi JS data!
console.log(`\n  JS: post = "${post}" (đã thay đổi!)`);
console.log(`  DOM: div.text = "${cppDiv2.text}" (CHƯA thay đổi!)`);
console.log(`  ❌ Hai runtime KHÔNG TỰ ĐỒNG BỘ!`);
console.log(`  → Phải THỦ CÔNG: jsDiv.textContent = post`);

accessorObj.textContent = post; // Thủ công đồng bộ!
console.log(`  DOM: div.text = "${cppDiv2.text}" ✅ Đã đồng bộ!`);
```

---

## §8. 🔬 Deep Analysis Patterns

### 8.1 Pattern ①: Bản đồ luồng dữ liệu

```
BẢN ĐỒ — DATA FLOW TWO-WAY:
═══════════════════════════════════════════════════════════════

  JAVASCRIPT RUNTIME          ║    C++ RUNTIME (WebCore)
  ─────────────────────        ║    ──────────────────────
                               ║
  let post = "Hi!"            ║    DOM: div.text = ""
       │                       ║         │
       │ jsDiv.textContent     ║         │
       │    = post             ║         │
       │                       ║         │
       └────── SETTER ─────────╫────────▶│
               (cross biên!)   ║         │ div.text = "Hi!"
                               ║         │
                               ║         ▼
                               ║    Render → Pixels! 🖥️

  User gõ "Hello" vào input   ║
                               ║    input.value = "Hello"
       ┌────── GETTER ─────────╫────────◀│
       │ (cross biên!)         ║         │
       ▼                       ║         │
  post = jsInput.value         ║
  post = "Hello"               ║
       │                       ║
       └────── SETTER ─────────╫────────▶│
                               ║    div.text = "Hello"
                               ║    Pixels! 🖥️
```

### 8.2 Pattern ②: So sánh HTML "1 dòng" vs JS "10 dòng"

```
SO SÁNH — CÙNG KẾT QUẢ, KHÁC CÁCH LÀM:
═══════════════════════════════════════════════════════════════

  HTML (3 ký tự!):               JAVASCRIPT (30+ dòng!):
  ──────────────                   ──────────────────────────
  <div>Hi!</div>                  ① let post = "Hi!"
  → Done! 🎉                      ② document = { [[link]]→DOM }
                                   ③ querySelector("div")
                                   ④ → hidden link → C++ DOM
                                   ⑤ → tìm kiếm "div"
                                   ⑥ → tạo accessor object
                                   ⑦ jsDiv = { [[link]]→div,
                                        textContent: setter }
                                   ⑧ jsDiv.textContent = post
                                   ⑨ → setter → hidden link
                                   ⑩ → C++ div.text = "Hi!"
                                   ⑪ → layout recalc
                                   ⑫ → render → pixels
                                   → Done! 🎉 (nhưng MỆT!)

  HTML = Descriptive! Dễ! Static!
  JS = Imperative! Khó! Dynamic! Fine-grained control!
```

### 8.3 Pattern ③: 4 phần của UI Hard Parts

```
UI HARD PARTS — 4 PHẦN THEO WILL:
═══════════════════════════════════════════════════════════════

  Part 1: THE TRUTHS (Phần 1-10)
  ┌──────────────────────────────────────────────────────────┐
  │ → Cách browser THỰC SỰ hoạt động!                      │
  │ → HTML parser, DOM, WebCore, WebIDL                     │
  │ → Accessor objects, getter/setter, hidden links         │
  │ → Hai runtime khác nhau!                                │
  │ → "DEMANDING, however once we have it down,             │
  │    it becomes the STANDARD." — Will                     │
  └──────────────────────────────────────────────────────────┘

  Part 2-4: MOVES TO MAKE TRUTHS EASIER
  ┌──────────────────────────────────────────────────────────┐
  │ Part 2: One-way data binding                             │
  │ Part 3: Virtual DOM                                      │
  │ Part 4: Hooks / State management                         │
  │                                                          │
  │ "Part two, three, and four are MOVES to make            │
  │  the truths MORE EASY TO WORK WITH." — Will             │
  └──────────────────────────────────────────────────────────┘
```

---

## Self-Assessment Checklist

```
CHECKLIST — SAU KHI HỌC PHẦN 9:
═══════════════════════════════════════════════════════════════

  GETTER/SETTER:
  [ ] textContent TRÔNG như property assignment!
  [ ] NHƯNG chạy setter function bên trong!
  [ ] Regular property → lưu TRONG JS (vô dụng!)
  [ ] Getter/setter → cross biên giới → C++ DOM!

  HAI RUNTIME:
  [ ] Data ở JS, Display ở C++ = HAI THẾ GIỚI!
  [ ] Thay đổi JS → DOM KHÔNG TỰ CẬP NHẬT!
  [ ] Phải THỦ CÔNG chuyển qua lại!
  [ ] Đây là lý do UI frameworks tồn tại!

  DECLARATIVE vs IMPERATIVE:
  [ ] HTML = descriptive, 1 dòng, static!
  [ ] JS = imperative, nhiều bước, dynamic!
  [ ] Mục tiêu: declarative + dynamic = frameworks!

  CALL STACK:
  [ ] querySelector kỹ thuật CÓ lên call stack!
  [ ] Nhưng Will không vẽ — vì ta không viết code đó!

  TIẾP THEO → Phần 10: Displaying Data Summary!
```
