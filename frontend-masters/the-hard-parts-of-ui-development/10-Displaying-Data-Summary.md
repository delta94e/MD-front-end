# The Hard Parts of UI Development — Phần 10: Displaying Data Summary — "Tổng Kết Goal 1: Hiển Thị Dữ Liệu!"

> 📅 2026-03-08 · ⏱ 20 phút đọc
>
> Nguồn: Frontend Masters — Will Sentance
> Khoá học: The Hard Parts of UI Development
> Bài: Displaying Data Summary — "WebCore, DOM API, Accessor Objects, Setter Properties — Tổng Kết!"
> Độ khó: ⭐️⭐️⭐️ | Intermediate — tổng hợp kiến thức, so sánh HTML vs JS, cross-runtime model!

---

## Mục Lục

| #   | Phần                                              |
| --- | ------------------------------------------------- |
| 1   | Goal 1 Recap — "WebCore Cho JS Truy Cập DOM!"     |
| 2   | HTML Flow — "Mô Tả Là Đủ, Không Cần Code!"        |
| 3   | JavaScript Flow — "6 Bước Cho 1 Dòng HTML!"       |
| 4   | Setter Properties — "Không Phải Property Thường!" |
| 5   | DOM Tự Động Hiển Thị — "Model → View!"            |
| 6   | Web Components — "Giải Pháp Tương Lai?"           |
| 7   | 🔬 Deep Analysis — Tổng Hợp Mental Model          |

---

## §1. Goal 1 Recap — "WebCore Cho JS Truy Cập DOM!"

> Will: _"WebCore gives JavaScript access to the DOM and therefore pixels. That's not nothing."_

### Bối cảnh — Tổng kết mục tiêu đầu tiên

Will tạm dừng để tổng kết toàn bộ **Goal 1** của UI engineering: **hiển thị content data cho user**. Ông nhấn mạnh rằng trước phần này, **chưa bao giờ** trong bất kỳ workshop nào, họ thêm bất cứ thứ gì lên trang web thật sự! _"Have you ever seen in any of the workshops us adding anything to the page, the actual page ever? Never have we done it."_

Lý do? Vì **thêm thứ gì đó lên trang không hề dễ** — như Will đã chứng minh, chỉ để hiển thị "Hi!" đã cần hàng chục bước!

Tuy nhiên, nhờ **WebCore** (phần lõi C++ của browser) và **WebIDL** (ngôn ngữ mô tả chuẩn hóa DOM API), JavaScript **ĐƯỢC** cấp quyền truy cập DOM — và do đó, truy cập **pixels** trên màn hình!

```
KẾT QUẢ GOAL 1 — HIỂN THỊ CONTENT:
═══════════════════════════════════════════════════════════════

  HAI CÁCH HIỂN THỊ CONTENT:

  ① HTML (Phần 1-6):
  ┌──────────────────────────────────────────────────────────┐
  │ → Mô tả element trong text file                         │
  │ → HTML parser tạo C++ objects (DOM)                     │
  │ → Layout + Render → pixels tự động! 🖥️                 │
  │ → NHANH + DỄ! Nhưng KHÔNG có data thay đổi!           │
  └──────────────────────────────────────────────────────────┘

  ② JavaScript (Phần 7-9):
  ┌──────────────────────────────────────────────────────────┐
  │ → Lưu data trong JS memory (let post = "Hi!")          │
  │ → querySelector → accessor object + hidden link         │
  │ → Setter property → cross biên giới → C++ DOM           │
  │ → Layout + Render → pixels! 🖥️                         │
  │ → PHỨC TẠP! Nhưng CÓ data thay đổi được!             │
  └──────────────────────────────────────────────────────────┘

  "WebCore gives JavaScript ACCESS to the DOM and therefore
   PIXELS. That's not nothing." — Will
```

---

## §2. HTML Flow — "Mô Tả Là Đủ, Không Cần Code!"

> Will: _"With HTML, we did it in, I think we dwelled on it too long, honestly, but we did it quickly."_

### HTML — Tóm tắt ưu điểm

Với HTML, hiển thị content **siêu đơn giản**: liệt kê elements trong file text, browser tự lo phần còn lại. Will thừa nhận đã giải thích HTML "hơi lâu" — vì thực tế nó **nhanh chóng đến mức khó giải thích lâu**!

Will cũng nhắc lại sự khác biệt giữa **HTML thêm element vào DOM** vs **lập trình thông thường**: Trong hầu hết ngôn ngữ lập trình, để thêm phần tử vào danh sách, bạn cần `push()`, `append()`, `instantiate()`. Còn HTML? _"If I wanna add from HTML to this list, what do I do? On the next line, yeah. Isn't that just extraordinary?"_ — Chỉ cần viết dòng tiếp theo! Cực kỳ trực quan!

---

## §3. JavaScript Flow — "6 Bước Cho 1 Dòng HTML!"

> Will: _"It ain't so easy, but we did get to create and store changeable mutable data."_

### JavaScript — Tóm tắt từng bước

Will tóm tắt toàn bộ luồng JavaScript trong 6 bước rõ ràng:

**① Lưu data mutable**: `let post = "Hi!"` — data có thể thay đổi, khác HTML!

**② Dùng document object**: Object `document` có hidden link đến toàn bộ DOM (C++ list of elements).

**③ querySelector tìm element**: Chạy querySelector method → tìm element trong DOM → KHÔNG THỂ kéo C++ object vào JS!

**④ Tạo accessor object**: JavaScript tự tạo **brand new object** với hidden link đến C++ element. Will nhấn mạnh chính xác: _"Retrieve NOT the actual element back into JavaScript — because we can't copy a C++ object into JavaScript, not possible."_

**⑤ Accessor object + methods**: Object được populated với hidden link và **bunch of methods** (textContent, innerHTML, classList, style, v.v.) — tất cả đều thao tác C++ element qua hidden link!

**⑥ Setter property push data → DOM**: `jsDiv.textContent = post` — setter property **cross biên giới** JS→C++, set text trên DOM element, trigger render → pixels thay đổi!

```
JAVASCRIPT FLOW — 6 BƯỚC TỔNG KẾT:
═══════════════════════════════════════════════════════════════

  ① let post = "Hi!"
     → Data MUTABLE trong JS memory!

  ② document = { [[link]] → C++ DOM }
     → Object có link đến toàn bộ danh sách elements!

  ③ document.querySelector("div")
     → Tìm "div" trong C++ DOM list!
     → ❌ KHÔNG THỂ copy C++ object về JS!

  ④ jsDiv = { [[link]] → C++ div, textContent, ... }
     → Tạo BRAND NEW accessor object!
     → Hidden link trỏ đến CỤ THỂ div element!

  ⑤ Accessor object có methods:
     textContent, innerHTML, classList, style,
     appendChild, remove, setAttribute, ...
     → Tất cả thao tác C++ element qua hidden link!

  ⑥ jsDiv.textContent = post
     → SETTER (không regular property!)
     → Cross JS → C++ → div.text = "Hi!"
     → Render → pixels! "Hi!" hiển thị! 🎉

  "We can't copy a C++ object into JavaScript, NOT POSSIBLE.
   Instead, we created a BRAND NEW object in JavaScript,
   populated with a HIDDEN LINK." — Will
```

---

## §4. Setter Properties — "Không Phải Property Thường!"

> Will: _"I say methods cuz they do more than just set a local value in a key value pair, right, in an object."_

### Bối cảnh — Tại sao Will gọi property là "method"

Will giải thích tại sao ông hay nhầm gọi properties là "methods": vì chúng **LÀM nhiều hơn** chỉ set giá trị locally! Regular property chỉ lưu value trong object — setter property **gửi message ra ngoài** JS runtime, **cross biên giới** sang C++, **set giá trị ttrên DOM element**!

Will dùng cụm từ rất hay: _"They send a message out to set through the link to the DOM element. They cross the streams."_ — Chúng **vượt qua ranh giới** giữa hai luồng (streams) — JavaScript stream và C++ stream.

Will còn vẽ **double line** trên bảng để nhấn mạnh ranh giới: _"I like to do a double line down here really because it's between JavaScript runtime and C++ runtime."_ — Đây là biên giới quan trọng nhất!

```
SETTER = "CROSS THE STREAMS":
═══════════════════════════════════════════════════════════════

  JAVASCRIPT RUNTIME                 ║  C++ RUNTIME
  ──────────────────                  ║  ────────────
                                      ║
  jsDiv.textContent = post            ║
       │                              ║
       │  "Send a message OUT         ║
       │   to SET through the LINK"   ║
       │                              ║
       └────────── CROSS ─────────────╫──▶ div.text = "Hi!"
                   THE STREAMS        ║
                                      ║    ▼
                                      ║    Render → Pixels!
                                      ║
  ════════════════════════════════════ ║ ══════════════════

  "They CROSS THE STREAMS." — Will
  → JS → C++ = cross biên giới giữa 2 runtimes!
```

---

## §5. DOM Tự Động Hiển Thị — "Model → View!"

> Will: _"DOM automatically displays the content on the page itself, known as the view, what the user sees."_

### Bối cảnh — Phần cuối: DOM → Pixels

Khi data đã được set trên C++ DOM element, **Layout + Render engine tự động chạy** — DOM element biến thành pixels trên màn hình. Will gọi pixels mà user thấy là **"the view"** — cái user nhìn thấy.

Will kết luận: _"Success, but so much harder than `<div>Hi!</div>`."_ — Thành công, nhưng khó gấp bội so với HTML! Một câu tóm tắt perfect cho cả Goal 1.

```
THÀNH CÔNG — NHƯNG CÁI GIÁ LÀ GÌ?
═══════════════════════════════════════════════════════════════

  HTML: <div>Hi!</div>
  → 1 dòng. Done. 🎉

  JavaScript:
  → let post = "Hi!"
  → document = { [[link]]→DOM }
  → querySelector → hidden link → C++ DOM
  → Tạo accessor object
  → jsDiv.textContent = post
  → Setter → cross biên giới
  → C++ div.text = "Hi!"
  → Layout → Render → Pixels!
  → 8+ bước. Done. 🎉 (nhưng MỆT!)

  HTML:        ████░░░░░░░░░░░░░░░░  Effort: 10%
  JavaScript:  ████████████████████  Effort: 100%

  "Success, but SO MUCH HARDER than <div>Hi!</div>." — Will
```

---

## §6. Web Components — "Giải Pháp Tương Lai?"

> Will: _"Things like web components try to do that without us having to build it all out from scratch ourselves."_

### Bối cảnh — Declarative + Dynamic = Mục tiêu

Will nhắc đến **Web Components** — công nghệ browser native cho phép bạn viết **custom HTML elements** với logic bên trong. Ý tưởng: kết hợp sự **đơn giản mô tả** (declarative) của HTML với **data thay đổi được** (dynamic) của JavaScript — mà KHÔNG cần framework bên ngoài!

Will thừa nhận: _"Whether they take off fully or not, but they're all trying to solve that problem."_ — Chưa biết Web Components có thành công hoàn toàn không, nhưng mục tiêu rõ ràng: **Describe the page like we did in HTML, but now we get changeable data.**

Và đây chính là mục tiêu của React, Vue, Angular, Svelte — tất cả đều cố giải quyết cùng vấn đề!

---

## §7. 🔬 Deep Analysis — Tổng Hợp Mental Model

### 7.1 Mental Model tổng hợp Goal 1

```
MENTAL MODEL — GOAL 1 COMPLETE:
═══════════════════════════════════════════════════════════════

  ARCHITECTURE:

  ┌── DEVELOPER ──────────────────────────────────────────┐
  │                                                        │
  │  HTML File:       JavaScript:                          │
  │  <input/>         let post = "Hi!"                     │
  │  <div></div>      querySelector → accessor obj         │
  │  <script>...      jsDiv.textContent = post             │
  │                                                        │
  └────────────────────────┬───────────────────────────────┘
                           │
                           ▼
  ┌── BROWSER ENGINE ─────────────────────────────────────┐
  │                                                        │
  │  HTML Parser → C++ DOM                                 │
  │  ┌──────────┬──────────┬──────────┐                   │
  │  │ input    │ div      │ script   │                   │
  │  │ value:"" │ text:"Hi"│ ⚡JS!   │                   │
  │  └──────────┴──────────┴──────────┘                   │
  │                      │                                 │
  │                      ▼                                 │
  │  Layout + Render Engine                                │
  │                      │                                 │
  │                      ▼                                 │
  │  ┌────────────────────────────────────────────┐       │
  │  │ [____________]  ← input field              │       │
  │  │ Hi!             ← div text! 🎉             │       │
  │  └────────────────────────────────────────────┘       │
  │                                                        │
  └────────────────────────────────────────────────────────┘
```

### 7.2 Declarative vs Imperative — Trade-off

```
TRADE-OFF SUMMARY:
═══════════════════════════════════════════════════════════════

  DECLARATIVE (HTML):
  ┌──────────────────────────────────────────────────────────┐
  │ ✅ Đơn giản — liệt kê là xong!                         │
  │ ✅ Trực quan — thứ tự code = thứ tự hiển thị!          │
  │ ✅ Không cần biết DOM, C++, getter/setter!             │
  │ ❌ KHÔNG có mutable data!                               │
  │ ❌ KHÔNG thay đổi được sau khi render!                  │
  └──────────────────────────────────────────────────────────┘

  IMPERATIVE (JavaScript):
  ┌──────────────────────────────────────────────────────────┐
  │ ❌ Phức tạp — 8+ bước cho 1 thay đổi!                  │
  │ ❌ Cross biên giới JS ↔ C++ = chậm + khó hiểu!        │
  │ ❌ Console distortion = dễ nhầm lẫn!                   │
  │ ✅ CÓ mutable data! post = "Hi!" → "Hello!"           │
  │ ✅ Fine-grained editing control!                        │
  │ ✅ Có thể thay đổi BẤT CỨ LÚC NÀO!                   │
  └──────────────────────────────────────────────────────────┘

  MỤC TIÊU CỦA UI FRAMEWORKS:
  ┌──────────────────────────────────────────────────────────┐
  │ Kết hợp CẢ HAI:                                        │
  │ → Declarative NHƯ HTML (dễ viết, dễ đọc!)             │
  │ → Dynamic NHƯ JavaScript (data thay đổi!)             │
  │                                                          │
  │ React JSX: <div>{post}</div> ← cả hai!                │
  │ Vue template: <div>{{ post }}</div>                      │
  │ Svelte: <div>{post}</div>                               │
  │ Web Components: <my-div data={post}></my-div>           │
  └──────────────────────────────────────────────────────────┘
```

---

## Self-Assessment Checklist

```
CHECKLIST — SAU KHI HỌC PHẦN 10:
═══════════════════════════════════════════════════════════════

  GOAL 1 — HIỂN THỊ CONTENT:
  [ ] HTML: mô tả → DOM → pixels (2 tầng!)
  [ ] JS: data → querySelector → setter → DOM → pixels!
  [ ] WebCore cho JS truy cập DOM qua WebIDL!
  [ ] Accessor object + hidden link = cầu nối!
  [ ] Setter "cross the streams" — JS → C++!

  SO SÁNH:
  [ ] HTML = declarative, 1 dòng, static!
  [ ] JS = imperative, 8+ bước, dynamic!
  [ ] Trade-off: đơn giản vs kiểm soát!

  NHẬN THỨC:
  [ ] Chưa bao giờ thêm gì lên page trước đây!
  [ ] "So much harder than <div>Hi!</div>"!
  [ ] Web Components = giải pháp browser native!
  [ ] Frameworks = giải pháp community!

  TIẾP THEO → Phần 11: Handling User Interaction!
  → "Goal 2: user thay đổi content!"
```
