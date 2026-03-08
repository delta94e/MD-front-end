# The Hard Parts of UI Development — Phần 3: Display Content — "Pixel By Pixel? UNTENABLE!"

> 📅 2026-03-08 · ⏱ 35 phút đọc
>
> Nguồn: Frontend Masters — Will Sentance
> Khoá học: The Hard Parts of UI Development
> Bài: Display Content — "JavaScript = Không Có Output Trực Quan! HTML = Semi-Visual! Ngôn Ngữ Trực Quan Nhất!"
> Độ khó: ⭐️⭐️⭐️ | Intermediate — Bài toán pixel, HTML là danh sách, giới thiệu DOM!

---

## Mục Lục

| #   | Phần                                                            |
| --- | --------------------------------------------------------------- |
| 1   | Bài Toán Pixel — "2 Triệu Pixel, Code Từng Cái Một?"            |
| 2   | Output Của JavaScript = Vô Hình! — "Hoàn Toàn Không Trực Quan!" |
| 3   | HTML — "Ngôn Ngữ Trực Quan Nhất Từng Tồn Tại!"                  |
| 4   | Danh Sách Element — "Thêm Vào Danh Sách = Hiện Trên Trang!"     |
| 5   | Layout + Render Engine — "Chuyển Danh Sách Thành Pixel!"        |
| 6   | Semi-Visual Code — "Trực Quan Đến Kinh Ngạc!"                   |
| 7   | Tự Implement: HTML → DOM → Page Pipeline                        |
| 8   | 🔬 Deep Analysis Patterns — 6 Tư Duy Phân Tích Sâu              |

---

## §1. Bài Toán Pixel — "2 Triệu Pixel, Code Từng Cái Một?"

> Will: _"We've got two days to do this screen. Let's get started pixel by pixel. This is NOT a joke."_

### Bối cảnh — Output thật sự của UI Engineering là gì?

Will bắt đầu bằng một bài tập tư duy thú vị: nếu mục tiêu của UI engineering là **hiển thị nội dung trên màn hình**, thì output cuối cùng — thứ người dùng thực sự nhìn thấy — là **pixel**. Mỗi pixel là một điểm sáng nhỏ trên màn hình, có thể phát bất kỳ màu nào.

Một màn hình bình thường có khoảng **2 triệu pixel**. Màn hình 4K có khoảng **8 triệu pixel**. Vậy nếu chúng ta code TỪNG pixel một?

Will đùa rất nghiêm túc: "Chúng ta có hai ngày để làm màn hình này. Bắt đầu pixel từng pixel thôi!" — và ông thực sự bắt đầu chỉ định toạ độ cho từng pixel. **Không phải đùa.** Đây là cách giáo dục "từ gốc" đặc trưng của Will: trước khi giới thiệu giải pháp, ông cho bạn **CẢM NHẬN** vấn đề thực sự.

Kết quả: chỉ sau vài pixel, bạn nhận ra điều này hoàn toàn **bất khả thi** (untenable). Không thể code từng pixel cho 2 triệu điểm sáng. **PHẢI có abstraction** cao hơn — và đó chính là vai trò của HTML và DOM.

```
BÀI TOÁN PIXEL — KHÔNG THỂ THỰC HIỆN:
═══════════════════════════════════════════════════════════════

  Màn hình binh thường:
  ┌──────────────────────────────────────────────────────────┐
  │ → Full HD (1920×1080) = 2,073,600 pixel!               │
  │ → 4K (3840×2160) = 8,294,400 pixel!                    │
  │ → Mỗi pixel = 1 điểm sáng cần được chỉ định!          │
  │ → Mỗi pixel có toạ độ (x, y) và màu sắc (RGB)!       │
  └──────────────────────────────────────────────────────────┘

  Thử code từng pixel:
  ┌──────────────────────────────────────────────────────────┐
  │ pixel(x: 100, y: 900, color: "black")  → Pixel thứ 1! │
  │ pixel(x: 101, y: 900, color: "black")  → Pixel thứ 2! │
  │ pixel(x: 102, y: 898, color: "black")  → Pixel thứ 3! │
  │ ...                                                      │
  │ pixel(x: ???, y: ???, color: ???)                        │
  │ → Còn 2 TRIỆU pixel nữa! 😱                           │
  │                                                          │
  │ "I hope this becomes a MONTAGE in the recorded          │
  │  version. So no one has to sit through this." 😂        │
  └──────────────────────────────────────────────────────────┘

  KẾT LUẬN:
  ┌──────────────────────────────────────────────────────────┐
  │ → Code pixel-by-pixel = BẤT KHẢ THI!                   │
  │ → PHẢI có abstraction (trừu tượng hoá!)                │
  │ → Thay vì chỉ định từng pixel, ta chỉ cần MÔ TẢ      │
  │   cái gì cần hiển thị, và để MÁY tự tính pixel!       │
  │ → "There MUST be a better way." — đúng! Đó là HTML!   │
  └──────────────────────────────────────────────────────────┘
```

### Phân tích chuyên sâu — Abstraction và trade-off

Đây là bài học quan trọng trong computer science: **mọi abstraction đều giải quyết một vấn đề nhưng cũng tạo ra vấn đề mới**.

- **Pixel-by-pixel**: Kiểm soát 100% nhưng không thể bảo trì, không thể mở rộng, mất hàng năm cho một màn hình đơn giản.
- **HTML/CSS**: Mô tả ở mức cao hơn (element), mất một phần kiểm soát pixel-level nhưng được **quy mô** và **bảo trì**.
- **Framework (React, Vue)**: Mô tả ở mức cao hơn nữa (component), mất thêm kiểm soát nhưng được **quản lý state** và **tái sử dụng**.

Mỗi tầng abstraction **xa hơn** pixel — nhưng **gần hơn** con người. Đó là trade-off cốt lõi của software engineering.

---

## §2. Output Của JavaScript = Vô Hình! — "Hoàn Toàn Không Trực Quan!"

> Will: _"The output of running code in JavaScript is SAVING DATA. It's definitely NOT visual. With UI engineering, output IS visual. It's PIXELS."_

### Bối cảnh — Sự khác biệt cơ bản giữa lập trình thông thường và UI engineering

Will chỉ ra một khác biệt sâu sắc mà nhiều người không nhận ra: khi bạn viết `let likes = 7` trong JavaScript, **output** của dòng code đó là gì? Nó **lưu** giá trị 7 vào bộ nhớ. Không có gì xuất hiện trên màn hình. Không có pixel nào thay đổi. Output hoàn toàn **vô hình**.

Ông nói: "Chúng ta VẼ nó trên bảng trắng khi whiteboard, nhưng thực tế nó **không phải trực quan**. Nó nằm bên trong máy tính. Là các transistor đang bật hoặc tắt."

Đây là khác biệt TRIỆT ĐỂ với UI engineering: trong UI, output là **PIXEL** — thứ NHÌN THẤY ĐƯỢC. Vấn đề là JavaScript **không có khả năng tạo pixel**. Nó chỉ có thể lưu và thao tác dữ liệu. Vậy ta cần **cầu nối** giữa thế giới dữ liệu (JavaScript) và thế giới pixel (màn hình) — và cầu nối đó chính là **DOM + WebCore**.

### Shorthand — Lập trình đã có abstraction sẵn

Will cũng nhắc nhở rằng ngay cả trong lập trình thông thường, chúng ta đã sử dụng abstraction rồi mà không nhận ra:

```
JAVASCRIPT OUTPUT = VÔ HÌNH:
═══════════════════════════════════════════════════════════════

  Lập trình thông thường:
  ┌──────────────────────────────────────────────────────────┐
  │ let likes = 7;                                           │
  │                                                          │
  │ → Output: lưu giá trị 7 vào bộ nhớ!                   │
  │ → KHÔNG có gì xuất hiện trên màn hình!                 │
  │ → Hoàn toàn VÔ HÌNH!                                   │
  │ → "We DRAW it on the blackboard, but it AIN'T          │
  │    visual. It's inside the computer."                    │
  │ → Transistor bật/tắt = cách dữ liệu thực sự tồn tại! │
  │                                                          │
  │ SHORTHAND đã có sẵn:                                    │
  │ → let likes = 7                                        │
  │   Không cần biết memory address!                        │
  │   "let" tự tìm vị trí trống trong bộ nhớ!             │
  │   "English label refers to that position from now on." │
  │                                                          │
  │ → function sum(1, 2, 3)                                │
  │   Không cần phải viết lại logic cộng mỗi lần!         │
  │   Tái sử dụng! "JavaScript doesn't have sum built in. │
  │   But we have much more useful REDUCE!" 😏             │
  └──────────────────────────────────────────────────────────┘

  UI Engineering:
  ┌──────────────────────────────────────────────────────────┐
  │ <p>What's on your mind</p>                              │
  │                                                          │
  │ → Output: PIXEL trên màn hình!                         │
  │ → Thực sự TRỰC QUAN! Nhìn thấy được!                  │
  │ → Nhưng cần cơ chế phức tạp bên dưới:                 │
  │   HTML → DOM (C++) → Layout → Render → Pixel!         │
  │ → "There's a lot of them." (2 triệu đến 8 triệu!)    │
  └──────────────────────────────────────────────────────────┘

  SỰ KHÁC BIỆT CỐT LÕI:
  ┌──────────────────────────────────────────────────────────┐
  │   Lập trình thông thường    │    UI Engineering         │
  │   Output = DATA (ẩn!)       │    Output = PIXEL (hiện!) │
  │   Dữ liệu trong bộ nhớ     │    Điểm sáng trên màn hình│
  │   Không cần render engine   │    CẦN render pipeline!   │
  │   Tự hoàn chỉnh trong JS   │    Cần C++ DOM + WebCore! │
  └──────────────────────────────────────────────────────────┘
```

---

## §3. HTML — "Ngôn Ngữ Trực Quan Nhất Từng Tồn Tại!"

> Will: _"I want to display 'What's on your mind?' — what should my code say? Just write 'What's on your mind?' That'd be AMAZING. And it does!"_

### Bối cảnh — Thiết kế thiên tài của HTML

Will mô tả HTML theo cách cực kỳ thuyết phục: bạn muốn hiển thị dòng chữ "What's on your mind?" trên màn hình — thì code nên viết gì? **Viết đúng dòng chữ đó!** Và nó THỰC SỰ hoạt động! Đó là thiết kế thiên tài của HTML.

Ông đùa: "There's NO WAY this language exists and we're still CHARGING for this content." — kiểu như "không thể tin ngôn ngữ dễ thế này tồn tại mà chúng tôi vẫn thu phí cho nội dung dạy nó!" Và: "We don't even TEACH it at Codesmith. That's how intuitive it is." — Codesmith thậm chí không dạy HTML vì nó quá trực quan!

Nhưng ẩn sau vẻ đơn giản đó là một cơ chế phức tạp: khi bạn viết HTML, bạn đang **tạo một danh sách các element** sẽ được thêm vào DOM (C++), rồi layout engine tính toán vị trí, render engine tạo bitmap, và graphics card chuyển thành pixel. Bạn **chỉ mô tả** — máy **tự tính toán** 2 triệu pixel.

```
HTML — NGÔN NGỮ TRỰC QUAN NHẤT:
═══════════════════════════════════════════════════════════════

  Muốn hiển thị text? → Viết chính text đó!
  ┌──────────────────────────────────────────────────────────┐
  │ CODE:                        │ HIỂN THỊ:               │
  │ What's on your mind          │ What's on your mind      │
  │ <input>                      │ [________________]       │
  │ <button>Publish</button>     │ [ Publish ]              │
  │                              │                          │
  │ → Viết text = hiện text!    │                          │
  │ → Viết <input> = hiện ô nhập!                          │
  │ → Viết <button> = hiện nút bấm!                       │
  │ → "That'd be AMAZING. And it does!"                    │
  └──────────────────────────────────────────────────────────┘

  TẠI SAO HTML TRỰC QUAN:
  ┌──────────────────────────────────────────────────────────┐
  │ ① Viết text thuần = hiển thị text đó!                  │
  │   → Không cần bọc trong hàm, không cần compile!       │
  │                                                          │
  │ ② Viết element = tạo "hộp" trên trang!                │
  │   → <input> = ô nhập liệu!                            │
  │   → <button> = nút bấm!                               │
  │   → <div> = vùng chứa!                                │
  │                                                          │
  │ ③ THỨ TỰ trong file = THỨ TỰ trên trang!             │
  │   → Viết dòng 1 → hiện VỊ TRÍ thứ nhất trên trang!  │
  │   → Viết dòng 2 → hiện DƯỚI dòng 1!                  │
  │   → "The ORDER is set by WHERE we write each line."    │
  │                                                          │
  │ ④ Lồng nhau = element con bên trong element cha!       │
  │   → <button>Publish</button>                            │
  │   → Text "Publish" nằm BÊN TRONG button!              │
  │   → Trên trang: text hiện TRONG nút bấm!              │
  │                                                          │
  │ "There's NO WAY this language exists and               │
  │  we're still CHARGING for this content." 😂            │
  │ "We don't even TEACH it at Codesmith."                 │
  └──────────────────────────────────────────────────────────┘
```

### Phân tích chuyên sâu — "Semi-visual code" nghĩa là gì?

Will dùng thuật ngữ **semi-visual code** để mô tả HTML. "Semi" nghĩa là "nửa" — tức HTML **gần như phản chiếu** giao diện thật, nhưng **không hoàn toàn chính xác**. Ví dụ:

- Bạn viết `<button>` → trên trang có nút bấm. **Tương ứng!**
- Nhưng `<button>` trong code **không có kích thước**, **không có vị trí chính xác**, **không có pixel** — đó do layout/render engine tự tính.
- Và styling (màu sắc, font, khoảng cách) cần CSS riêng — HTML chỉ có **cấu trúc**.

So sánh với JavaScript: khi bạn viết `document.createElement("button")` — dòng code này **hoàn toàn không phản ánh** giao diện. Bạn không thể "nhìn" vào code JS và tưởng tượng trang web trông như thế nào. Đây chính là vấn đề mà Virtual DOM (Part 3) sẽ giải quyết.

---

## §4. Danh Sách Element — "Thêm Vào Danh Sách = Hiện Trên Trang!"

> Will: _"This list of elements will automatically be converted onto the screen. All we have to do is write text to this list."_

### Bối cảnh — HTML tạo ra cái gì?

Khi browser parse (phân tích) file HTML, nó **không trực tiếp tạo pixel**. Thay vào đó, nó tạo ra một **danh sách các element** — gọi là DOM (Document Object Model) — được lưu trong bộ nhớ dưới dạng cấu trúc dữ liệu C++.

Danh sách này sẽ được **tự động chuyển đổi** thành pixel trên màn hình thông qua layout engine và render engine. Will nhấn mạnh: "Tất cả những gì chúng ta cần làm là **thêm text vào danh sách này**. Phần còn lại — tính toán vị trí cho hàng nghìn loại thiết bị khác nhau, chuyển đổi thành pixel — browser tự xử lý."

Đây là abstraction cốt lõi: thay vì code 2 triệu pixel, bạn chỉ cần **mô tả** "tôi muốn một đoạn text, một ô nhập, và một nút bấm" → browser tự tính CẦN BẬT pixel nào.

```
HTML → DANH SÁCH → TRANG:
═══════════════════════════════════════════════════════════════

  HTML FILE (text!)          DOM (C++!)         TRANG (pixel!)
  ┌────────────────┐    ┌───────────────┐    ┌──────────────┐
  │ What's on mind │───▶│ • text node   │───▶│ What's on... │
  │                │    │   "What's on  │    │              │
  │                │    │    your mind" │    │              │
  ├────────────────┤    ├───────────────┤    ├──────────────┤
  │ <input>        │───▶│ • input node  │───▶│ [__________] │
  ├────────────────┤    ├───────────────┤    ├──────────────┤
  │ <button>       │───▶│ • button node │───▶│ [ Publish ]  │
  │   Publish      │    │   └── text    │    │              │
  │ </button>      │    │     "Publish" │    │              │
  └────────────────┘    └───────────────┘    └──────────────┘

  QUY TRÌNH:
  ┌──────────────────────────────────────────────────────────┐
  │ ① HTML parser đọc file text, từng dòng, MỘT LẦN!      │
  │ ② Với mỗi element → tạo một node trong DOM (C++!)     │
  │ ③ Thứ tự viết trong file = thứ tự trong danh sách!    │
  │ ④ Lồng nhau trong HTML = lồng nhau trong DOM!         │
  │ ⑤ Danh sách hoàn chỉnh → layout engine → render!     │
  │ ⑥ Render tạo bitmap → graphics card → pixel!          │
  │                                                          │
  │ ĐIỂM QUAN TRỌNG:                                        │
  │ → "A simplified list — totally implemented as an       │
  │    OBJECT. But THINK of it as an ordered list."        │
  │ → DOM thực ra là object (tree structure) nhưng ở       │
  │    giai đoạn này nghĩ như danh sách là đủ hiểu!       │
  │                                                          │
  │ → "We don't have to worry about individual pixels!"    │
  │ → Browser xử lý HÀNG NGHÌN loại thiết bị khác nhau!  │
  │ → Tablet, phone, laptop — NGHÌN kích thước!           │
  │ → Layout engine tự tính pixel cho TỪNG thiết bị!      │
  └──────────────────────────────────────────────────────────┘
```

---

## §5. Layout + Render Engine — "Chuyển Danh Sách Thành Pixel!"

> Will: _"The layout engine figures out exact placement for THIS device. The render engine produces a composite image — a bitmap — 60 times a second."_

### Bối cảnh — Hai engine bí ẩn bên trong browser

Khi DOM (danh sách element) đã được tạo, hai "động cơ" bên trong browser sẽ tiếp quản:

**Layout Engine**: Nhận danh sách element và tính toán **vị trí chính xác** cho từng element trên **thiết bị CỤ THỂ này**. Tại sao "thiết bị cụ thể"? Vì cùng một trang web, trên màn hình 27 inch sẽ hiển thị khác so với trên iPhone 15 Mini. Layout engine xử lý: text wrapping (xuống dòng tự động), responsive sizing, flex/grid layout, margin/padding tính toán, và positioning.

**Render Engine**: Nhận kết quả từ layout engine và tạo ra một **bitmap** — một hình ảnh tổng hợp (composite image) của toàn bộ trang. Sau đó, nó **rasterize** — tức chuyển bitmap thành **danh sách pixel thực sự** (mỗi pixel có toạ độ x, y và giá trị RGB). Danh sách pixel này được gửi cho graphics card.

**Graphics card**: Nhận danh sách pixel và **hiển thị lên màn hình**, **60 lần mỗi giây** (mỗi 16 mili-giây). Đây gọi là frame rate — tần số quét khiến mắt người nhìn thấy hình ảnh liên tục, mượt mà.

```
PIPELINE WEBCORE — TỪ DANH SÁCH ĐẾN PIXEL:
═══════════════════════════════════════════════════════════════

  HTML file (text!)
       │ (parse — CHỈ MỘT LẦN! Không bao giờ quay lại!)
       ▼
  DOM (danh sách element trong C++!)
       │ → "Mô hình đơn giản hoá" của trang web!
       │ → Cấu trúc object nhưng nghĩ như danh sách!
       ▼
  ┌──────────────────────────────────────────────────────────┐
  │ LAYOUT ENGINE                                            │
  │ → "Nếu thu nhỏ cửa sổ? Text tự xuống dòng!"          │
  │ → Tính toán vị trí CHÍNH XÁC cho THIẾT BỊ NÀY!       │
  │ → Xử lý: text wrapping, sizing, flex, grid, position! │
  │ → Output: layout tree (cây bố cục có toạ độ!)         │
  └──────────────────────────────┬───────────────────────────┘
                                 │
                                 ▼
  ┌──────────────────────────────────────────────────────────┐
  │ RENDER ENGINE                                            │
  │ → Tạo BITMAP — hình ảnh tổng hợp (composite image!)   │
  │ → Kết hợp tất cả element + style thành MỘT hình ảnh!  │
  │ → RASTERIZE — chuyển thành DANH SÁCH PIXEL!            │
  │ → Mỗi pixel: toạ độ (x, y) + màu sắc (RGB)!          │
  │ → Output: danh sách hàng triệu pixel!                 │
  └──────────────────────────────┬───────────────────────────┘
                                 │ (mỗi ~16ms, 60fps!)
                                 ▼
  ┌──────────────────────────────────────────────────────────┐
  │ 🎮 GRAPHICS CARD                                        │
  │ → Nhận danh sách pixel → hiển thị lên màn hình!       │
  │ → Lặp lại 60 lần/giây (60fps = 16ms mỗi frame!)      │
  │ → Animation mượt = render kịp thời trong 16ms!        │
  │ → Animation giật = render trễ, drop frame!             │
  └──────────────────────────────────────────────────────────┘

  THUẬT NGỮ — WEBCORE:
  ┌──────────────────────────────────────────────────────────┐
  │ → Toàn bộ hệ thống trên gọi là WEBCORE!               │
  │ → Layout engine + Render engine = trung tâm WebCore!   │
  │ → "The main render engines are spinning off from       │
  │    versions from 10-15 years ago. People are NOT       │
  │    building these from scratch."                        │
  │ → Tại sao ít trình duyệt? Vì render engine CỰC KỲ    │
  │   phức tạp! Mất hàng chục năm phát triển!             │
  └──────────────────────────────────────────────────────────┘
```

---

## §6. Semi-Visual Code — "Trực Quan Đến Kinh Ngạc!"

> Will: _"We have HTML — semi-visual code for structure and content. It PRODUCES a model of the page that then gets displayed."_

### Bối cảnh — Tổng kết vai trò của HTML

Will tổng kết HTML bằng thuật ngữ **semi-visual code**: code mà bạn có thể **gần như hình dung** giao diện chỉ bằng cách đọc. Đây là thuộc tính HIẾM có trong lập trình — hầu hết code (JavaScript, Python, C++) hoàn toàn **không phản ánh** output trực quan.

HTML hoàn thành 3 nhiệm vụ:

1. **Tạo element** (create): thêm node vào DOM
2. **Đặt nội dung** (content): text, attribute, source
3. **Xác định vị trí** (position): thứ tự trong file = thứ tự trên trang

```
TỔNG KẾT HTML — SEMI-VISUAL CODE:
═══════════════════════════════════════════════════════════════

  3 NHIỆM VỤ CỦA HTML:
  ┌──────────────────────────────────────────────────────────┐
  │ ① TẠO ELEMENT — thêm node vào DOM!                     │
  │   → <input> → tạo input node trên DOM!                │
  │   → <div> → tạo division node trên DOM!               │
  │   → <video> → tạo video node trên DOM!                │
  │                                                          │
  │ ② ĐẶT NỘI DUNG — text, attributes!                    │
  │   → "What's on mind" → content dạng text!             │
  │   → src="video.mp4" → attribute chỉ nguồn!            │
  │   → "Publish" → text bên trong button!                 │
  │                                                          │
  │ ③ XÁC ĐỊNH VỊ TRÍ — WHERE in file = WHERE on page!    │
  │   → Viết ở dòng nào = hiện ở vị trí đó trên trang!   │
  │   → Bên trong element = sub-element (lồng nhau!)      │
  └──────────────────────────────────────────────────────────┘

  VÍ DỤ LỒNG NHAU:
  ┌──────────────────────────────────────────────────────────┐
  │  <div>                                                   │
  │    <video src="carpool_karaoke.mp4"></video>             │
  │    <p>Love Les Mis ❤️</p>                               │
  │    <p>7</p>                                              │
  │  </div>                                                  │
  │                                                          │
  │  → div chứa 3 element con: video, p, p!                │
  │  → Trên trang: video và 2 đoạn text nằm BÊN TRONG    │
  │    một vùng (division) — nhóm lại với nhau!            │
  │  → "Look at that. INSIDE the division is our           │
  │     video, our paragraph, and our paragraph."           │
  └──────────────────────────────────────────────────────────┘

  BLESSING:
  ┌──────────────────────────────────────────────────────────┐
  │ "We are BLESSED to have this semi-visual code           │
  │  for structure and content."                             │
  │                                                          │
  │ → So sánh: viết UI bằng JavaScript thuần =              │
  │   document.createElement("div"); // đâu là giao diện?? │
  │ → HTML: <div>Hello</div> // ồ, có text "Hello" trong   │
  │   một hộp! (semi-visual!)                                │
  │                                                          │
  │ → Vấn đề: khi cần THAY ĐỔI giao diện, HTML không     │
  │   giúp được (one-time!) → cần JavaScript!              │
  │ → Và khi dùng JS, ta MẤT tính semi-visual!            │
  │ → Part 3 (Virtual DOM) sẽ giải quyết điều này!        │
  └──────────────────────────────────────────────────────────┘
```

---

## §7. Tự Implement: HTML → DOM → Page Pipeline

```javascript
// ═══════════════════════════════════
// Pipeline từ HTML → DOM → Trang — Mô phỏng từ đầu!
// ═══════════════════════════════════

// ── Bước 1: HTML Parser (mô phỏng đơn giản!) ──
// "We go through line by line and produce elements.
//  ONE TIME. We do NOT return to it."

function parseHTML(htmlString) {
  const lines = htmlString.trim().split("\n");
  const dom = { type: "document", children: [] };
  const stack = [dom]; // Ngăn xếp để xử lý lồng nhau!

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    const current = stack[stack.length - 1];

    // Thẻ đóng? → Pop ra khỏi stack!
    if (trimmed.startsWith("</")) {
      stack.pop();
      continue;
    }

    // Thẻ mở hoặc self-closing?
    if (trimmed.startsWith("<")) {
      const tagMatch = trimmed.match(/^<(\w+)([^>]*)>(.*?)(?:<\/\1>)?$/);
      if (tagMatch) {
        const [, tag, attrs, content] = tagMatch;
        const node = {
          type: tag,
          attributes: parseAttrs(attrs),
          children: [],
        };

        // Có inline content? → Tạo text node con!
        if (content) {
          node.children.push({
            type: "text",
            content,
          });
        }

        current.children.push(node);

        // Thẻ mở chưa đóng? → Push vào stack!
        if (!trimmed.endsWith(`</${tag}>`) && !trimmed.endsWith("/>")) {
          stack.push(node);
        }
      }
    } else {
      // Text thuần → tạo text node!
      // "Khi viết text, DOM tạo ra text node."
      current.children.push({
        type: "text",
        content: trimmed,
      });
    }
  }

  return dom;
}

function parseAttrs(attrString) {
  const attrs = {};
  const matches = attrString.matchAll(/(\w+)="([^"]*)"/g);
  for (const [, key, value] of matches) {
    attrs[key] = value;
  }
  return attrs;
}

// ── Bước 2: Layout Engine (mô phỏng đơn giản!) ──
// "Analyzes how to PLACE elements for THIS device."

function layout(domNode, x = 0, y = 0, width = 800) {
  const layoutNode = {
    ...domNode,
    x,
    y,
    width,
    height: 0,
    children: [],
  };

  let currentY = y;
  for (const child of domNode.children || []) {
    const childLayout = layout(child, x, currentY, width);
    layoutNode.children.push(childLayout);
    currentY += childLayout.height;
  }

  layoutNode.height = currentY - y || 20;
  return layoutNode;
}

// ── Bước 3: Render Engine (khái niệm!) ──
// "Produces a BITMAP. Rasterize — turn into pixels."

function render(layoutTree) {
  const bitmap = [];

  function walk(node) {
    if (node.type === "text") {
      bitmap.push({
        type: "text",
        x: node.x,
        y: node.y,
        content: node.content,
      });
    } else {
      bitmap.push({
        type: "box",
        x: node.x,
        y: node.y,
        width: node.width,
        height: node.height,
        tag: node.type,
      });
    }
    for (const child of node.children || []) {
      walk(child);
    }
  }

  walk(layoutTree);
  return bitmap;
}

// ── Bước 4: Display Loop (60fps!) ──
// "Pinged out to graphics card every 16ms"

function displayLoop(bitmap) {
  setInterval(() => {
    paintToScreen(bitmap);
    // Mỗi 16ms = 60 lần/giây!
    // Graphics card nhận bitmap → hiển thị pixel!
  }, 16);
}
```

---

## §8. 🔬 Deep Analysis Patterns — 6 Tư Duy Phân Tích Sâu

### 8.1 Pattern ①: Chuỗi 5-Whys

```
5 WHYS: TẠI SAO HTML ĐƠN GIẢN ĐẾN VẬY?
═══════════════════════════════════════════════════════════════

  WHY ①: Tại sao chỉ viết text = hiện text trên trang?
  └→ Vì HTML parser THÊM text node vào DOM, và layout
     engine TỰ TÍNH vị trí pixel! Ta không cần biết
     pixel nào sáng — chỉ cần MÔ TẢ element!

  WHY ②: Tại sao không cần tính pixel thủ công?
  └→ Vì có HÀNG NGHÌN loại thiết bị với kích thước
     màn hình khác nhau! Không thể hardcode pixel
     cho mỗi loại. Layout engine xử lý CHUNG cho tất cả!

  WHY ③: Tại sao element lồng nhau?
  └→ Vì giao diện thực tế CÓ cấu trúc phân cấp!
     Text nằm TRONG button, button nằm TRONG form.
     HTML phản ánh cấu trúc này bằng thẻ lồng nhau!

  WHY ④: Tại sao DOM là object chứ không phải array?
  └→ Vì object cho phép lưu nhiều thông tin hơn:
     type, attributes, children, parent reference!
     Array chỉ lưu thứ tự — thiếu metadata!
     "But THINK of it as an ordered list" — ban đầu!

  WHY ⑤: Tại sao 60fps?
  └→ Vì mắt người nhận biết được giật (jank) khi
     frame rate dưới ~24fps. 60fps = mượt mà!
     Mỗi frame = 16ms. Render engine PHẢI hoàn thành
     mỗi frame trong 16ms, nếu không → drop frame!
```

### 8.2 Pattern ②: Bản đồ tư duy

```
BẢN ĐỒ TƯ DUY — HIỂN THỊ NỘI DUNG:
═══════════════════════════════════════════════════════════════

  VẤN ĐỀ: 2 triệu pixel, không thể code từng cái!
       │
       ▼
  ABSTRACTION: Danh sách element (DOM!)
       │ → Thêm vào danh sách = hiện trên trang!
       │ → Thứ tự trong file = vị trí trên trang!
       │ → Lồng nhau = sub-element!
       │
       ▼
  CÔNG CỤ: HTML (semi-visual code!)
       │ → Viết text = hiện text! Trực quan!
       │ → Viết <input> = hiện ô nhập!
       │ → "Ngôn ngữ trực quan nhất từng tồn tại!"
       │
       ▼
  PIPELINE: Layout → Render → Bitmap → 60fps!
       │ → Layout tính vị trí cho THIẾT BỊ NÀY!
       │ → Render tạo hình ảnh tổng hợp!
       │ → Graphics card hiển thị pixel!
       │
       ▼
  KẾT QUẢ: Mục tiêu 1 HOÀN THÀNH! ✅
       → "Just HTML and CSS to display data!"
```

---

## Self-Assessment Checklist

```
CHECKLIST — SAU KHI HỌC PHẦN 3:
═══════════════════════════════════════════════════════════════

  BÀI TOÁN PIXEL:
  [ ] 2-8 triệu pixel mỗi màn hình!
  [ ] "Code pixel-by-pixel = BẤT KHẢ THI!" 😂
  [ ] Cần abstraction → danh sách element!

  JAVASCRIPT vs UI:
  [ ] JS output = data (ẩn!) — UI output = pixel (hiện!)
  [ ] JS không thể tạo pixel — cần DOM + WebCore!
  [ ] "It's NOT visual. It's inside the computer."

  HTML:
  [ ] "Ngôn ngữ trực quan nhất từng tồn tại!"
  [ ] Viết text = hiện text! (semi-visual code!)
  [ ] Thứ tự trong file = thứ tự trên trang!
  [ ] Lồng nhau = sub-element trong DOM!
  [ ] "We don't even TEACH it at Codesmith!" 😂

  DOM:
  [ ] Danh sách element trong C++!
  [ ] "Object kỹ thuật nhưng nghĩ như danh sách!"
  [ ] HTML thêm vào DOM → auto-hiển thị!

  PIPELINE:
  [ ] HTML → DOM → Layout → Render → Bitmap → Pixel!
  [ ] 60fps = 16ms mỗi frame!
  [ ] WebCore = layout + render engine!

  TIẾP THEO → Phần 4: Rendering HTML Under the Hood!
```
