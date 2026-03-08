# The Hard Parts of UI Development — Phần 4: Rendering HTML Under the Hood — "Document Object Model!"

> 📅 2026-03-08 · ⏱ 35 phút đọc
>
> Nguồn: Frontend Masters — Will Sentance
> Khoá học: The Hard Parts of UI Development
> Bài: Rendering HTML Under the Hood — "DOM, Nodes, WebCore, Bitmap 60fps, Text Nodes, Xử Lý Lỗi!"
> Độ khó: ⭐️⭐️⭐️ | Intermediate — DOM chi tiết, rendering pipeline, Hỏi-Đáp sâu sắc!

---

## Mục Lục

| #   | Phần                                                      |
| --- | --------------------------------------------------------- |
| 1   | DOM — "Document Object Model!"                            |
| 2   | Rendering Từng Bước — "Từng Dòng HTML, Một Lần Duy Nhất!" |
| 3   | Element Lồng Nhau — "Sub-Element, Sub-Array!"             |
| 4   | Divisions — "Nhóm Element Vào Phân Vùng!"                 |
| 5   | WebCore — "Layout + Render = Pixel!"                      |
| 6   | Hỏi-Đáp — "Text Nodes, Render Engine, Xử Lý Lỗi HTML!"    |
| 7   | Tự Implement: Mô Phỏng DOM Rendering                      |
| 8   | 🔬 Deep Analysis Patterns — 6 Tư Duy Phân Tích Sâu        |

---

## §1. DOM — "Document Object Model!"

> Will: _"D-O-M. A list in JavaScript (actually C++), a MODEL of the document, stored in an OBJECT format."_

### Bối cảnh — Tên gọi đến từ đâu?

Will bắt đầu phần này bằng một bài tập thú vị: thử đặt tên cho "danh sách element trên trang". Ông nói: "Tôi thực sự nghĩ ra tên khác nhau mỗi lần" — ví dụ "List of Elements on the Page" → viết tắt L.E.P? Nghe không hay lắm.

Rồi ông phân tích từng thành phần của tên thật:

- **Document**: Tại sao gọi là "tài liệu"? Vì thuở ban đầu, trang web thực sự **chỉ là một tài liệu** — văn bản có đường link. Người dùng gọi nó là "document" và tên đó **dính luể** mãi đến tận bây giờ.

- **Object**: Tại sao "object" chứ không phải "list" hay "array"? Vì dữ liệu được lưu dưới dạng **object** (cấu trúc key-value) trong C++. Object cho phép linh hoạt hơn: mỗi node có type, attributes, children, parent reference — nhiều hơn những gì array đơn thuần cung cấp.

- **Model**: Tại sao "model" chứ không phải "copy" hay "mirror"? Will dùng ví dụ tuyệt vời: "Giống như mô hình LEGO của một chiếc xe tải gaming. Không phải xe thật. Đơn giản hoá bằng các viên gạch." DOM là **mô hình đơn giản hoá** của trang web — không phải bản sao hoàn hảo, mà là biểu diễn cấu trúc.

```
DOM — TÊN GỌI VÀ Ý NGHĨA:
═══════════════════════════════════════════════════════════════

  Thử đặt tên:
  ┌──────────────────────────────────────────────────────────┐
  │ "List of Elements on the Page" = L.E.P? ❌ Không hay!  │
  │ → "I literally come up with different names             │
  │    every time." 😂                                      │
  └──────────────────────────────────────────────────────────┘

  Phân tích tên thật:
  ┌──────────────────────────────────────────────────────────┐
  │ D = Document                                             │
  │ → Trang web = "tài liệu"! Legacy từ CERN 1991!        │
  │ → "Originally it was a list of links and text.          │
  │    User calls it a DOCUMENT."                            │
  │                                                          │
  │ O = Object                                               │
  │ → Dữ liệu lưu dưới dạng object trong C++!             │
  │ → "Object gives more flexibility. Allows more           │
  │    SPECIFIC structure than a simple array."              │
  │ → Mỗi node chứa: type, attributes, children, parent!  │
  │                                                          │
  │ M = Model                                                │
  │ → Mô hình ĐƠN GIẢN HOÁ! Như LEGO!                    │
  │ → "Like a LEGO model of a gaming truck.                 │
  │    Not the real thing. Simplified with bricks."          │
  │ → DOM không PHẢI trang web — nó là MÔ HÌNH của trang! │
  │ → "Every MODEL is an intentional simplification.        │
  │    It captures the ESSENTIAL structure, not every        │
  │    pixel detail."                                        │
  └──────────────────────────────────────────────────────────┘

  TÓM TẮT:
  ┌──────────────────────────────────────────────────────────┐
  │ DOM = Document Object Model                              │
  │ → Document: trang web (gọi "tài liệu" vì lịch sử!)   │
  │ → Object: cấu trúc dữ liệu (key-value trong C++!)    │
  │ → Model: mô hình đơn giản hoá (như LEGO, không phải   │
  │   bản sao hoàn hảo!)                                    │
  └──────────────────────────────────────────────────────────┘
```

### Phân tích chuyên sâu — Tại sao DOM là "model" chứ không phải "the thing"?

Sự khác biệt giữa **model** và **the real thing** cực kỳ quan trọng trong computer science:

- **Mô hình LEGO** của xe tải: có hình dạng, có màu sắc, nhưng không chạy được, không chở hàng được.
- **DOM** của trang web: có cấu trúc element, có nội dung text, nhưng **không phải pixel trên màn hình**. DOM chỉ **mô tả** trang — render engine mới **tạo ra** trang thật.

Điều này sẽ cực kỳ quan trọng sau này khi chúng ta nói về **Virtual DOM** (Part 3): Virtual DOM là **model của model** — một biểu diễn JavaScript của DOM C++, hai lớp abstraction cách xa pixel thật!

---

## §2. Rendering Từng Bước — "Từng Dòng HTML, Một Lần Duy Nhất!"

> Will: _"HTML literally — we go through and grab this code ONE TIME. We do NOT return to it."_

### Bối cảnh — Quá trình parse HTML diễn ra thế nào?

Will minh hoạ chính xác điều gì xảy ra khi browser mở file HTML: nó đọc **từng dòng, từ trên xuống dưới, CHỈ MỘT LẦN**. Mỗi dòng HTML được chuyển thành một node trên DOM. Sau khi parse xong, browser **KHÔNG BAO GIỜ** quay lại file HTML nữa.

Đây là điểm cực kỳ quan trọng và sẽ là lý do chính tại sao HTML **không thể** giúp chúng ta thay đổi giao diện (goal 2): nếu browser không quay lại file HTML, ta không thể "sửa" HTML để cập nhật giao diện.

```
HTML PARSING — TỪNG DÒNG, MỘT LẦN DUY NHẤT:
═══════════════════════════════════════════════════════════════

  HTML File:                    DOM (C++):            Trang:
  ┌──────────────────┐    ┌───────────────────┐   ┌───────────┐
  │ Dòng 1:          │    │                   │   │           │
  │ What's on your   │───▶│ • Text node       │──▶│ What's on │
  │ mind             │    │  "What's on your  │   │ your mind │
  │                  │    │   mind"           │   │           │
  ├──────────────────┤    ├───────────────────┤   ├───────────┤
  │ Dòng 2:          │    │                   │   │           │
  │ <input>          │───▶│ • Input node      │──▶│ [_______] │
  │                  │    │   value: ""       │   │           │
  ├──────────────────┤    ├───────────────────┤   ├───────────┤
  │ Dòng 3-5:        │    │ • Button node     │   │           │
  │ <button>         │───▶│   └── Text node   │──▶│ [Publish] │
  │   Publish        │    │     "Publish"     │   │           │
  │ </button>        │    │                   │   │           │
  └──────────────────┘    └───────────────────┘   └───────────┘

  QUY TẮC:
  ┌──────────────────────────────────────────────────────────┐
  │ ① Đọc tuần tự từ trên xuống! Mỗi dòng → một node!    │
  │ ② MỘT LẦN DUY NHẤT — không bao giờ quay lại!         │
  │   "I checked — we definitely don't." 😂                 │
  │ ③ Thứ tự trong file = thứ tự node trên DOM!           │
  │ ④ Element lồng nhau → node con (child node!)          │
  │ ⑤ Text bên trong element → text node con!             │
  │ ⑥ Sau khi parse xong → DOM hoàn chỉnh!               │
  │   → Layout engine → Render engine → Pixel!            │
  └──────────────────────────────────────────────────────────┘

  TẠI SAO ĐIỀU NÀY QUAN TRỌNG:
  ┌──────────────────────────────────────────────────────────┐
  │ → Vì HTML = ONE-TIME! Muốn thay đổi giao diện?        │
  │   KHÔNG THỂ sửa HTML file! Browser đã parse xong rồi! │
  │ → Đây chính là lý do cần JAVASCRIPT (Phần 6!)         │
  │ → JavaScript = ngôn ngữ duy nhất có thể THAO TÁC DOM  │
  │   sau khi HTML đã parse xong!                           │
  └──────────────────────────────────────────────────────────┘
```

---

## §3. Element Lồng Nhau — "Sub-Element, Sub-Array!"

> Will: _"Text inside of button — I write the text INSIDE of button. And on my model, a sort of nested sub-element."_

### Bối cảnh — Cấu trúc cây của DOM

Khi bạn viết `<button>Publish</button>` trong HTML, text "Publish" nằm **bên trong** thẻ button. Điều này phản ánh trên DOM: text "Publish" trở thành **child node** (node con) của button node. Will giải thích bằng phép so sánh với JavaScript:

- Nếu DOM là **array**, thì button chứa text giống như **sub-array** (mảng con): `["text", "input", ["button", "Publish"]]`
- Nếu DOM là **object** (thực tế đúng hơn), thì button chứa text giống như **sub-object** được tham chiếu từ bên trong object cha.

Cấu trúc lồng nhau này là nền tảng của **tree structure** (cấu trúc cây) — mỗi element có thể chứa nhiều element con, mỗi element con lại có thể chứa element cháu, v.v. Đây chính là cách DOM tổ chức dữ liệu.

```
LỒNG NHAU — CẤU TRÚC CÂY:
═══════════════════════════════════════════════════════════════

  HTML:                         DOM Tree:
  ┌──────────────────────┐     ┌────────────────────────┐
  │ <button>             │     │ button node             │
  │   Publish            │     │ └── text node "Publish" │
  │ </button>            │     │                         │
  └──────────────────────┘     └────────────────────────┘

  → Text "Publish" là CHILD (con) của button!
  → Trên trang: text hiển thị BÊN TRONG nút bấm!
  → "If it were an array, this would be a SUB-ARRAY.
     If an object, a SUB-OBJECT referenced from
     within an existing object."

  PHÉP SO SÁNH VỚI CẤU TRÚC DỮ LIỆU JAVASCRIPT:
  ┌──────────────────────────────────────────────────────────┐
  │ Array analogy:                                           │
  │ DOM ≈ [                                                 │
  │   "What's on your mind",  // text node!                 │
  │   { type: "input" },      // input node!                │
  │   {                        // button node!               │
  │     type: "button",                                      │
  │     children: ["Publish"] // sub-array = text node con! │
  │   },                                                     │
  │ ]                                                        │
  │                                                          │
  │ Object analogy (gần thực tế hơn!):                      │
  │ DOM ≈ {                                                  │
  │   children: [                                            │
  │     { type: "text", content: "What's on your mind" },   │
  │     { type: "input", value: "" },                       │
  │     {                                                    │
  │       type: "button",                                    │
  │       children: [                                        │
  │         { type: "text", content: "Publish" }            │
  │       ]                                                  │
  │     }                                                    │
  │   ]                                                      │
  │ }                                                        │
  └──────────────────────────────────────────────────────────┘
```

---

## §4. Divisions — "Nhóm Element Vào Phân Vùng!"

> Will: _"What if we could cluster elements into SUBDIVISIONS on the page?"_

### Bối cảnh — Tại sao cần "phân vùng"?

Cho đến giờ, các element chỉ xếp chồng lên nhau từ trên xuống. Nhưng giao diện thực tế cần **nhóm** các element liên quan lại với nhau — ví dụ: video cùng với caption và số like nên nằm trong MỘT vùng. HTML cung cấp thẻ `<div>` (viết tắt của **division** — phân vùng) để làm điều này.

Điều thú vị: `<div>` **tự nó không hiển thị gì** trên trang. Nó không có border, không có background mặc định. Nó chỉ là một "hộp vô hình" dùng để **nhóm** các element con lại. Chỉ khi bạn thêm CSS hoặc nội dung bên trong, bạn mới "thấy" nó.

```
DIV — PHÂN VÙNG TRÊN TRANG:
═══════════════════════════════════════════════════════════════

  HTML:
  ┌──────────────────────────────────────────────────────────┐
  │ <div>                                                    │
  │   <video src="carpool_karaoke.mp4"></video>              │
  │   <p>Love Les Mis ❤️</p>                                │
  │   <p>7</p>                                               │
  │ </div>                                                   │
  └──────────────────────────────────────────────────────────┘

  DOM Tree:
  ┌──────────────────────────────────────────────────────────┐
  │ div                                                      │
  │ ├── video (src: "carpool_karaoke.mp4")                  │
  │ ├── p                                                    │
  │ │   └── text "Love Les Mis ❤️"                          │
  │ └── p                                                    │
  │     └── text "7"                                         │
  └──────────────────────────────────────────────────────────┘

  Trang hiển thị:
  ┌──────────────────────────────────────────────────────────┐
  │ ┌──────────────────────────────────────────────────┐    │
  │ │  🎥 [Video: Carpool Karaoke đang phát]            │    │
  │ │  Love Les Mis ❤️                                  │    │
  │ │  7                                                 │    │
  │ └──────────────────────────────────────────────────┘    │
  │                                                          │
  │ LƯU Ý:                                                  │
  │ → Div tự nó VÔ HÌNH! Không có border mặc định!        │
  │ → "You won't be able to SEE the division               │
  │    until you put content in it."                        │
  │ → Div chỉ là "hộp nhóm" — cần CSS để thấy viền!     │
  └──────────────────────────────────────────────────────────┘
```

### Phân tích chuyên sâu — Div và semantic HTML

Trong thực tế phát triển hiện đại, `<div>` thường bị **lạm dụng** (gọi là "div soup"). HTML5 giới thiệu các thẻ **semantic** (có ý nghĩa) như `<header>`, `<nav>`, `<main>`, `<article>`, `<section>`, `<footer>` — chúng hoạt động giống `<div>` nhưng mang ý nghĩa rõ ràng hơn cho browser, search engine, và screen reader.

Nhưng tại thời điểm này trong khoá học, Will chỉ giới thiệu `<div>` để minh hoạ khái niệm **nhóm element** — đây là nền tảng cho mọi layout phức tạp sau này.

---

## §5. WebCore — "Layout + Render = Pixel!"

> Will: _"The render engine produces a composite image — a BITMAP, rasterizes it — turns it into a list of pixels, and then pings it out 60 times a second."_

### Bối cảnh — Hành trình từ DOM đến pixel

Khi DOM đã hoàn chỉnh (parse HTML xong), hệ thống **WebCore** tiếp quản. WebCore là tên gọi chung cho bộ engine xử lý bên trong browser, bao gồm hai thành phần chính:

**Layout Engine** — "nếu chúng ta thu nhỏ cửa sổ, text sẽ tự xuống dòng" — đây là nhiệm vụ của layout engine. Nó nhận DOM và tính toán vị trí **chính xác** (toạ độ x, y, chiều rộng, chiều cao) cho từng element trên **thiết bị cụ thể đang sử dụng**. Cùng một trang web trên iPhone và trên màn hình 27 inch sẽ có layout khác nhau.

**Render Engine** — sau khi layout xong, render engine tạo **composite image** (hình ảnh tổng hợp) bằng cách vẽ từng element theo vị trí đã tính. Hình ảnh này gọi là **bitmap**. Sau đó, render engine **rasterize** — chuyển bitmap thành danh sách pixel cụ thể (mỗi pixel có toạ độ và màu RGB). Danh sách này được gửi cho **graphics card** để hiển thị.

```
WEBCORE PIPELINE CHI TIẾT:
═══════════════════════════════════════════════════════════════

  HTML Parser (đọc file text!)
  └→ Đọc HTML từng dòng, tạo DOM nodes!
  └→ MỘT LẦN DUY NHẤT! Không quay lại!
       │
       ▼
  DOM (danh sách element trong C++!)
  └→ Cấu trúc cây: element cha chứa element con!
  └→ Mỗi node có: type, attributes, children!
       │
       ▼
  ┌──────────────────────────────────────────────────────────┐
  │ LAYOUT ENGINE                                            │
  │ └→ Tính toán vị trí cho THIẾT BỊ CỤ THỂ này!         │
  │ └→ "If we SHRINK the window, text wraps around."       │
  │ └→ Xử lý: box model, margin, padding, flex, grid!     │
  │ └→ Responsive: khác nhau trên phone vs desktop!        │
  │ └→ Output: layout tree (mỗi node có toạ độ x, y,      │
  │    chiều rộng, chiều cao chính xác!)                    │
  └──────────────────────────────┬───────────────────────────┘
                                 │
                                 ▼
  ┌──────────────────────────────────────────────────────────┐
  │ RENDER ENGINE                                            │
  │ └→ Vẽ từng element theo vị trí từ layout tree!         │
  │ └→ Kết hợp tất cả thành MỘT hình ảnh: COMPOSITE!     │
  │ └→ Hình ảnh tổng hợp này gọi là BITMAP!               │
  │ └→ RASTERIZE: chuyển bitmap → danh sách pixel!        │
  │    (mỗi pixel: toạ độ x/y + màu sắc RGB!)            │
  │ └→ Output: danh sách hàng triệu pixel sẵn sàng!      │
  └──────────────────────────────┬───────────────────────────┘
                                 │ (mỗi ~16ms = 60fps!)
                                 ▼
  ┌──────────────────────────────────────────────────────────┐
  │ 🎮 GRAPHICS CARD                                        │
  │ └→ Nhận danh sách pixel → hiển thị lên màn hình!      │
  │ └→ 60 lần/giây (60fps = ~16ms mỗi frame!)             │
  │ └→ Nếu render mất hơn 16ms → drop frame → giật!      │
  │ └→ Cảm giác "mượt mà" = render kịp trong 16ms!       │
  └──────────────────────────────────────────────────────────┘

  SỰ THẬT VỀ RENDER ENGINE:
  ┌──────────────────────────────────────────────────────────┐
  │ → "The main render engines are spinning off from       │
  │    versions from 10-15 years ago."                      │
  │ → Blink (Chrome) = fork từ WebKit!                    │
  │ → WebKit (Safari) = fork từ KHTML (KDE!)              │
  │ → Gecko (Firefox) = phát triển từ đầu!                │
  │ → "People are NOT building these from scratch."        │
  │                                                          │
  │ Đây là lý do chỉ có VÀI trình duyệt:                  │
  │ → Render engine QUÁ phức tạp để xây mới!              │
  │ → Mất hàng THẬP KỶ phát triển!                        │
  │ → "Here be DRAGONS code!" 🐉                          │
  └──────────────────────────────────────────────────────────┘
```

---

## §6. Hỏi-Đáp — "Text Nodes, Render Engine, Xử Lý Lỗi HTML!"

### Text Nodes — Có "node" bọc quanh text không?

> Học viên hỏi: _"Would there be an actual node around text?"_

Will xác nhận: khi bạn viết text thuần (không bọc trong thẻ), browser VẪN tạo một **text node** trên DOM. Mọi thứ trên DOM đều là node — kể cả text.

```
TEXT NODES — MỌI THỨ TRÊN DOM ĐỀU LÀ NODE:
═══════════════════════════════════════════════════════════════

  Khi viết: What's on your mind
  DOM tạo ra:
  ┌──────────────────────────────────────────────────────────┐
  │ {                                                        │
  │   type: "text",                                         │
  │   content: "What's on your mind",                       │
  │   nodeType: 3   // Node.TEXT_NODE = 3 trong DOM spec!  │
  │ }                                                        │
  │                                                          │
  │ → CÓ! Có node bọc quanh text!                         │
  │ → Text node là node đặc biệt: KHÔNG có children!      │
  │ → Luôn là "lá" (leaf node) trong cây DOM!             │
  │                                                          │
  │ Will: "We DO have to go check it — search in ChatGPT   │
  │ for the exact C++ class that produces a text node.      │
  │ We have to check every time, otherwise it'll tell us    │
  │ completely WRONG thing." 😂                             │
  └──────────────────────────────────────────────────────────┘
```

### Render Engine — "Here Be Dragons!"

> Học viên hỏi: _"The render engine is a large chunk of the browser?"_

```
RENDER ENGINE — TẠI SAO CHỈ CÓ VÀI BROWSER?
═══════════════════════════════════════════════════════════════

  ┌──────────────────────────────────────────────────────────┐
  │ Will: "HERE BE DRAGONS code!"                            │
  │                                                          │
  │ Render engine phải xử lý:                                │
  │ → TẤT CẢ loại thiết bị (phone, tablet, desktop!)      │
  │ → TẤT CẢ độ phân giải (720p đến 8K!)                  │
  │ → TẤT CẢ loại content (text, image, video, SVG, 3D!)  │
  │ → Legacy CSS từ 20 năm trước vẫn phải hoạt động!      │
  │ → Accessibility features!                               │
  │ → Internationalization (tiếng Ả Rập viết ngược!)      │
  │ → "Legacy browsers with unpatchable cracks!"           │
  │                                                          │
  │ Kết quả:                                                 │
  │ → Code HÀNG TRIỆU dòng C++!                            │
  │ → "Profoundly sophisticated!"                           │
  │ → "Only a small consortium produces browsers."          │
  │                                                          │
  │ HẬU QUẢ:                                                 │
  │ → "We essentially built almost a full OPERATING SYSTEM  │
  │    within an application that was designed to display    │
  │    TEXT and LINKS."                                      │
  │ → Browser = gần như hệ điều hành! Nằm bên trong       │
  │   ứng dụng ban đầu chỉ để xem text!                   │
  └──────────────────────────────────────────────────────────┘
```

### HTML Error Handling — "Lỗi hiển thị ở ĐÂU?"

> Học viên hỏi: _"Was the forgiving nature of HTML by design?"_

Câu hỏi rất sâu sắc. HTML nổi tiếng **"tha thứ"** — nếu bạn viết HTML sai cú pháp, browser sẽ CỐ GẮNG hiểu và hiển thị thay vì báo lỗi. Tại sao?

```
HTML — NGÔN NGỮ "THA THỨ":
═══════════════════════════════════════════════════════════════

  ┌──────────────────────────────────────────────────────────┐
  │ HTML = quá trình MỘT LẦN! Không phải runtime!          │
  │                                                          │
  │ Nếu có lỗi → hiển thị ở đâu?                          │
  │ → Console? "But console renders errors called from     │
  │   JavaScript, where you actually SAY 'use the console'."│
  │   Console là CỦA JavaScript, không phải HTML!           │
  │                                                          │
  │ → Pre-parser? "Could spot syntax failings.             │
  │   But there's not a runtime EXECUTING that code."       │
  │   Không có runtime → không có error handling!          │
  │                                                          │
  │ ĐÁP ÁN:                                                 │
  │ → HTML KHÔNG CÓ error handling chuẩn!                  │
  │ → Browser CỐ GẮNG tự sửa lỗi (error recovery!)      │
  │ → Thiếu thẻ đóng? Browser tự thêm!                    │
  │ → Thẻ lồng sai? Browser tự sắp xếp lại!              │
  │                                                          │
  │ "It's INDICATIVE of how MINIMAL that process is.        │
  │  Here's a list. Add them. THAT'S IT."                   │
  │                                                          │
  │ → "Thêm vào danh sách. HẾT." — đó là toàn bộ         │
  │   những gì HTML parser làm! Quá đơn giản để cần       │
  │   hệ thống xử lý lỗi phức tạp!                        │
  └──────────────────────────────────────────────────────────┘
```

---

## §7. Tự Implement: Mô Phỏng DOM Rendering

```javascript
// ═══════════════════════════════════
// Mô phỏng DOM Rendering — Từ đầu!
// ═══════════════════════════════════

// ── Bước 1: Tạo DOM nodes ──
// Will: "D-O-M. A MODEL stored in OBJECT format."

class DOMNode {
  constructor(type, content = null) {
    this.type = type; // "div", "p", "button", "text"
    this.content = content; // chỉ cho text nodes
    this.children = []; // node con!
    this.attributes = {}; // src, class, id...
  }

  appendChild(child) {
    this.children.push(child);
    return child;
  }

  setAttribute(key, value) {
    this.attributes[key] = value;
  }
}

// ── Bước 2: Xây DOM bằng tay (mô phỏng parsing!) ──

const document = new DOMNode("document");

// Parse dòng 1: "What's on your mind"
const text1 = new DOMNode("text", "What's on your mind");
document.appendChild(text1);

// Parse dòng 2: <input>
const input = new DOMNode("input");
document.appendChild(input);

// Parse dòng 3-5: <button>Publish</button>
const button = new DOMNode("button");
const buttonText = new DOMNode("text", "Publish");
button.appendChild(buttonText); // Text LỒNG TRONG button!
document.appendChild(button);

// Parse <div> với children:
const div = new DOMNode("div");
const video = new DOMNode("video");
video.setAttribute("src", "carpool_karaoke.mp4");
div.appendChild(video);

const p1 = new DOMNode("p");
p1.appendChild(new DOMNode("text", "Love Les Mis ❤️"));
div.appendChild(p1);

const p2 = new DOMNode("p");
p2.appendChild(new DOMNode("text", "7"));
div.appendChild(p2);

document.appendChild(div);

// ── Bước 3: In cây DOM ──

function printDOMTree(node, indent = 0) {
  const prefix = " ".repeat(indent);
  if (node.type === "text") {
    console.log(`${prefix}└── text: "${node.content}"`);
  } else {
    const attrs = Object.entries(node.attributes)
      .map(([k, v]) => `${k}="${v}"`)
      .join(" ");
    console.log(`${prefix}${node.type}${attrs ? " " + attrs : ""}`);
    for (const child of node.children) {
      printDOMTree(child, indent + 2);
    }
  }
}

printDOMTree(document);
// Output:
// document
//   └── text: "What's on your mind"
//   input
//   button
//     └── text: "Publish"
//   div
//     video src="carpool_karaoke.mp4"
//     p
//       └── text: "Love Les Mis ❤️"
//     p
//       └── text: "7"
```

---

## §8. 🔬 Deep Analysis Patterns — 6 Tư Duy Phân Tích Sâu

### 8.1 Pattern ①: Chuỗi 5-Whys

```
5 WHYS: TẠI SAO DOM LÀ OBJECT, KHÔNG PHẢI ARRAY?
═══════════════════════════════════════════════════════════════

  WHY ①: Tại sao không dùng array đơn giản?
  └→ Vì object cho phép lưu NHIỀU thông tin hơn!
     Mỗi node cần: type, attributes, children, parent!
     Array chỉ lưu thứ tự — không đủ metadata!

  WHY ②: Tại sao cần lồng nhau?
  └→ Vì giao diện có CẤU TRÚC PHÂN CẤP!
     Button chứa text! Div chứa video + paragraphs!
     CStructural hierarchy = tree structure!

  WHY ③: Tại sao gọi là "document"?
  └→ "It was literally a list of LINKS and TEXT.
     So they called it a DOCUMENT." — di sản từ CERN!
     Trang web ban đầu = tài liệu text thuần!

  WHY ④: Tại sao gọi là "model"?
  └→ "Like a LEGO model. Not the real thing."
     DOM chỉ MÔ TẢ cấu trúc — KHÔNG PHẢI pixel!
     Render engine mới tạo pixel từ model!

  WHY ⑤: Tại sao implement bằng C++ chứ không phải JS?
  └→ "C++ is the heavy-lifting language."
     Performance! Render engine cần tốc độ C++!
     JS runtime chạy BÊN TRONG hệ thống C++!
```

### 8.2 Pattern ②: Bản đồ tư duy

```
BẢN ĐỒ TƯ DUY — RENDERING:
═══════════════════════════════════════════════════════════════

  HTML file (text thuần!)
       │ → parse MỘT LẦN, KHÔNG quay lại!
       ▼
  DOM (cấu trúc cây trong C++!)
       │ → D = Document (di sản CERN!)
       │ → O = Object (key-value, linh hoạt!)
       │ → M = Model (đơn giản hoá, như LEGO!)
       │
       ├── Text nodes = "lá" cây (không có con!)
       ├── Element nodes = có thể chứa con!
       └── Attributes = metadata (src, class, id!)
       │
       ▼
  Layout Engine → tính vị trí cho THIẾT BỊ NÀY!
       │
       ▼
  Render Engine → bitmap → rasterize → pixel!
       │        "Here be DRAGONS!" 🐉
       ▼
  Graphics Card → 60fps (mỗi 16ms!)
```

---

## Self-Assessment Checklist

```
CHECKLIST — SAU KHI HỌC PHẦN 4:
═══════════════════════════════════════════════════════════════

  DOM:
  [ ] D = Document (trang web = "tài liệu" vì lịch sử CERN!)
  [ ] O = Object (cấu trúc key-value linh hoạt trong C++!)
  [ ] M = Model ("mô hình LEGO — đơn giản hoá, không phải bản sao!")
  [ ] DOM lưu trong C++, KHÔNG phải JavaScript!

  RENDERING:
  [ ] HTML parse MỘT LẦN, từ trên xuống, không quay lại!
  [ ] "I checked — we definitely don't." 😂
  [ ] Mỗi dòng HTML → một node trên DOM!
  [ ] Element lồng nhau → child node (cấu trúc cây!)

  WEBCORE:
  [ ] Layout engine = tính vị trí cho thiết bị cụ thể!
  [ ] Render engine = bitmap → rasterize → pixel!
  [ ] Graphics card = 60fps, 16ms mỗi frame!
  [ ] "Here be DRAGONS code!" 🐉

  HỎI-ĐÁP:
  [ ] Text thuần → vẫn tạo text node trên DOM!
  [ ] Render engine = lý do chỉ có vài browser!
  [ ] HTML "tha thứ" vì quá đơn giản: "thêm vào danh sách. HẾT."
  [ ] "We built an OS within a text+links viewer!"

  TIẾP THEO → Phần 5: CSSOM for Styling!
```
