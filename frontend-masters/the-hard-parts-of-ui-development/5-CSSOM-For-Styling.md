# The Hard Parts of UI Development — Phần 5: CSSOM for Styling — "CSS Có Thể Lưu State? Nguy Hiểm!"

> 📅 2026-03-08 · ⏱ 45 phút đọc
>
> Nguồn: Frontend Masters — Will Sentance
> Khoá học: The Hard Parts of UI Development
> Bài: CSSOM for Styling — "CSS = Powerful, Đến Mức Nguy Hiểm! CSSOM + DOM = Trang Hoàn Chỉnh!"
> Độ khó: ⭐️⭐️⭐️ | Intermediate — CSSOM, hai mô hình kết hợp, Goal 1 hoàn thành!

---

## Mục Lục

| #   | Phần                                                           |
| --- | -------------------------------------------------------------- |
| 1   | CSS — "Ngôn Ngữ Cực Kỳ Tinh Vi, Đến Mức Nguy Hiểm!"            |
| 2   | Tại Sao "Đến Mức Nguy Hiểm"? — State Phân Tán!                 |
| 3   | CSSOM — "Mô Hình Thứ Hai Trong Browser!"                       |
| 4   | Cascade — "Tầng Tầng Lớp Lớp, Ai Thắng?"                       |
| 5   | Specificity — "Cuộc Chiến Quyền Lực Giữa Các Selector!"        |
| 6   | Liên Kết CSS Qua HTML — "Di Sản Lịch Sử 5 Năm Trễ!"            |
| 7   | DOM + CSSOM = Render Tree — "Hai Mô Hình Kết Hợp Thành Pixel!" |
| 8   | Pipeline Hoàn Chỉnh — "Từ Code Đến Pixel, Mọi Bước!"           |
| 9   | Goal 1 Hoàn Thành! — "Hiển Thị Nội Dung = XONG!"               |
| 10  | So Sánh Web vs Native — "Apple Sở Hữu Toàn Bộ Stack!"          |
| 11  | Tự Implement: Mô Phỏng CSSOM Từ Đầu                            |
| 12  | 🔬 Deep Analysis Patterns — 6 Tư Duy Phân Tích Sâu             |

---

## §1. CSS — "Ngôn Ngữ Cực Kỳ Tinh Vi, Đến Mức Nguy Hiểm!"

> Will: _"CSS is a beautifully sophisticated language. It's actually really powerful. To a point of FAULT."_

### Bối cảnh — CSS ra đời để giải quyết vấn đề gì?

Trước khi CSS tồn tại (từ năm 1991 đến 1996), toàn bộ giao diện web được quyết định bởi **chỉ HTML**. Mỗi browser tự quyết định element trông ra sao — font gì, cỡ chữ bao nhiêu, màu nền là gì. Kết quả: cùng một trang web hiển thị **HOÀN TOÀN KHÁC NHAU** trên mỗi browser. Đây là thảm hoạ cho designer — họ không kiểm soát được giao diện.

CSS (Cascading Style Sheets) ra đời năm 1996 để giải quyết chính xác vấn đề này: cho phép developer **kiểm soát** cách element hiển thị — màu sắc, kích thước, font chữ, khoảng cách, animation, bố cục — **độc lập** với cấu trúc HTML. Như vậy, HTML phụ trách **cấu trúc và nội dung** (cái gì trên trang, thứ tự ra sao), còn CSS phụ trách **giao diện trực quan** (trông như thế nào).

Will mô tả CSS bằng hai nhận xét cực kỳ quan trọng mà chúng ta cần phân tích kỹ:

**Nhận xét thứ nhất: "Beautifully sophisticated."** CSS hiện đại (2026) đã tiến hoá đáng kinh ngạc so với CSS ban đầu. Cách đây 10 năm, rất nhiều hiệu ứng cần JavaScript; bây giờ CSS tự xử lý được: animation phức tạp với `@keyframes` và `transitions`, bố cục linh hoạt với `flexbox` và `grid`, thiết kế responsive với `@media queries` và `container queries`, thậm chí logic đơn giản với `calc()`, `min()`, `max()`, `clamp()`. CSS selector cũng ngày càng "thông minh" với `:has()` (quét ngược lên element cha — trước đây bất khả thi!), `:is()`, `:where()`, và `nesting` (viết selector lồng nhau như SCSS). Will hoàn toàn đúng khi nói CSS "beautifully sophisticated" — nó là ngôn ngữ khai báo (declarative language) mạnh mẽ nhất hiện tại cho visual design.

**Nhận xét thứ hai: "To a point of FAULT."** Đây chính là cảnh báo cốt lõi. "Fault" nghĩa là "lỗi, điểm yếu, khuyết điểm". Will nói CSS mạnh ĐẾN MỨC nó tạo ra vấn đề — cụ thể là khả năng **vô tình lưu trữ state** (trạng thái ứng dụng) bên trong CSS thay vì JavaScript.

### CSS có khả năng gì cụ thể?

Hãy liệt kê chi tiết để hiểu tại sao Will gọi CSS là "beautifully sophisticated":

```
CSS — NĂNG LỰC TOÀN DIỆN:
═══════════════════════════════════════════════════════════════

  ① MÀU SẮC VÀ NỀN:
  ┌──────────────────────────────────────────────────────────┐
  │ → color: chỉ định màu chữ!                            │
  │ → background-color: màu nền!                           │
  │ → background-image: hình nền (kể cả gradient!)        │
  │ → linear-gradient(), radial-gradient()!                │
  │ → opacity: độ trong suốt (0 = ẩn hoàn toàn!)         │
  │ → filter: blur(), grayscale(), brightness()!           │
  │                                                          │
  │ Ví dụ thực tế: Instagram filter hoàn toàn bằng CSS!   │
  └──────────────────────────────────────────────────────────┘

  ② KÍCH THƯỚC VÀ KHOẢNG CÁCH:
  ┌──────────────────────────────────────────────────────────┐
  │ → width/height: chiều rộng/cao của element!            │
  │ → padding: khoảng cách BÊN TRONG (content ↔ border!)  │
  │ → margin: khoảng cách BÊN NGOÀI (element ↔ element!)  │
  │ → box-sizing: border-box → tính padding VÀO width!   │
  │ → min-width/max-width: giới hạn responsive!           │
  │                                                          │
  │ Ví dụ thực tế: card bài viết có padding đều, margin    │
  │ tự động căn giữa trên trang!                            │
  └──────────────────────────────────────────────────────────┘

  ③ FONT CHỮ VÀ TYPOGRAPHY:
  ┌──────────────────────────────────────────────────────────┐
  │ → font-family: chọn font (Google Fonts, system fonts!) │
  │ → font-size: cỡ chữ (px, rem, em, vw!)               │
  │ → line-height: khoảng cách giữa các dòng!             │
  │ → letter-spacing: khoảng cách giữa các ký tự!         │
  │ → text-transform: uppercase, lowercase, capitalize!    │
  │ → @font-face: tải font tuỳ chỉnh!                    │
  │                                                          │
  │ Ví dụ thực tế: Apple.com sử dụng SF Pro — font riêng  │
  │ tải qua @font-face!                                     │
  └──────────────────────────────────────────────────────────┘

  ④ BỐ CỤC (LAYOUT):
  ┌──────────────────────────────────────────────────────────┐
  │ → display: block, inline, flex, grid, none!            │
  │ → flexbox: sắp xếp 1 chiều (hàng hoặc cột!)         │
  │ → grid: sắp xếp 2 chiều (hàng VÀ cột!)              │
  │ → position: static, relative, absolute, fixed, sticky! │
  │ → z-index: thứ tự xếp chồng (layer nào ở trên?)     │
  │ → float: bọc text quanh hình ảnh (di sản cũ!)        │
  │                                                          │
  │ Ví dụ thực tế: Google Sheets layout sử dụng grid!     │
  │ YouTube sidebar sử dụng flexbox!                        │
  └──────────────────────────────────────────────────────────┘

  ⑤ ANIMATION VÀ TRANSITION:
  ┌──────────────────────────────────────────────────────────┐
  │ → transition: chuyển đổi MỀM MẠI giữa 2 trạng thái! │
  │   (ví dụ: hover → màu chuyển từ xanh sang đỏ trong   │
  │   0.3 giây thay vì nhảy cóc!)                          │
  │ → @keyframes: định nghĩa ANIMATION phức tạp nhiều     │
  │   bước (0% → 25% → 50% → 75% → 100%!)              │
  │ → transform: rotate(), scale(), translateX/Y()!        │
  │ → animation: kết hợp keyframes + thời gian + lặp lại! │
  │                                                          │
  │ Ví dụ thực tế: loading spinner hoàn toàn bằng CSS!    │
  │ Skeleton loading screen của Facebook = CSS animation!   │
  └──────────────────────────────────────────────────────────┘

  ⑥ RESPONSIVE (THÍCH ỨNG THIẾT BỊ):
  ┌──────────────────────────────────────────────────────────┐
  │ → @media queries: "nếu màn hình < 768px → layout     │
  │   1 cột! Nếu > 1024px → layout 3 cột!"              │
  │ → container queries: "nếu CONTAINER (không phải       │
  │   viewport!) < 400px → style khác!"                   │
  │ → clamp(): kích thước "kẹp" giữa min và max!         │
  │   font-size: clamp(1rem, 2vw, 2rem) = TỰ ĐỘNG co/dãn!│
  │ → aspect-ratio: giữ tỷ lệ cố định!                   │
  │                                                          │
  │ Ví dụ thực tế: Twitter/X layout 1 cột trên phone,     │
  │ 2 cột trên tablet, 3 cột trên desktop!                 │
  └──────────────────────────────────────────────────────────┘

  ⑦ SELECTOR NÂNG CAO:
  ┌──────────────────────────────────────────────────────────┐
  │ → :has() — "chọn element CHA nếu CON thoả điều kiện!"│
  │   form:has(input:invalid) { border: red; }              │
  │   → Form có viền đỏ NẾU bên trong có input invalid!   │
  │   → Trước đây BẤT KHẢ THI bằng CSS!                   │
  │                                                          │
  │ → :is() — gom nhóm selector, giảm lặp lại!           │
  │ → :where() — giống :is() nhưng specificity = 0!       │
  │ → CSS Nesting — viết selector lồng nhau!              │
  │   .card { & .title { color: blue; } }                   │
  │   → Trước đây cần SCSS/SASS preprocessor!              │
  │                                                          │
  │ "It's a BEAUTIFULLY sophisticated language.             │
  │  Actually really POWERFUL." ✅                          │
  └──────────────────────────────────────────────────────────┘
```

---

## §2. Tại Sao "Đến Mức Nguy Hiểm"? — State Phân Tán!

> Will: _"The biggest challenge is maintaining CONSISTENCY between the underlying data and what the user sees."_

### Bối cảnh — CSS có thể lưu state và đây là thảm hoạ

Will cảnh báo rằng sự mạnh mẽ của CSS tạo ra một vấn đề cực kỳ nghiêm trọng: CSS có thể **vô tình lưu trữ state** — trạng thái ứng dụng — bên trong chính nó, thay vì để state tập trung ở một nơi duy nhất (JavaScript). Đây là vấn đề mà Will gọi là **state phân tán** (scattered state).

Để hiểu tại sao đây là thảm hoạ, chúng ta cần phân tích chi tiết. Xem xét thuộc tính `display: none`: khi bạn viết CSS `display: none` cho một element, element đó **biến mất** khỏi trang — người dùng không nhìn thấy nó. Nhưng nó **VẪN TỒN TẠI** trên DOM! Nó chỉ bị ẩn đi ở tầng hiển thị (visual layer), không bị xoá khỏi cấu trúc dữ liệu.

Bây giờ hãy tự hỏi: "element này đang ẩn" — thông tin này LƯU TRỮ ở đâu? Câu trả lời: ở **CSS** (thuộc tính `display: none`). Đây chính là CSS đang **lưu state** — tức thông tin về trạng thái hiện tại của ứng dụng. Và vấn đề bắt đầu từ đây.

### Ví dụ cụ thể — Dropdown menu

Hãy tưởng tượng một dropdown menu (menu xổ xuống). Khi người dùng click vào nút "Menu", menu xổ xuống hiện ra. Khi click lần nữa, menu ẩn đi. Có nhiều cách implement:

**Cách 1 — CSS thuần (state trong CSS!):**

```
CÁCH 1 — STATE BỊ PHÂN TÁN (BAD!):
═══════════════════════════════════════════════════════════════

  Trước khi click (menu ẩn!):
  ┌──────────────────────────────────────────────────────────┐
  │ CSS:                                                      │
  │ .dropdown { display: none; }  ← CSS lưu "menu đang ẩn!"│
  │                                                          │
  │ DOM:                                                      │
  │ <div class="dropdown">...</div> ← Element VẪN ở đây!   │
  │                                                          │
  │ JavaScript:                                               │
  │ → Có thể KHÔNG biết menu đang ẩn!                      │
  │ → Nếu JS quản lý state riêng: menuOpen = ???           │
  │ → JS nghĩ menu mở, CSS nói menu đóng = BUG!           │
  └──────────────────────────────────────────────────────────┘

  Sau khi click (menu hiện!):
  ┌──────────────────────────────────────────────────────────┐
  │ JS toggle class:                                         │
  │ element.classList.add("show");                            │
  │                                                          │
  │ CSS:                                                      │
  │ .dropdown.show { display: block; } ← CSS đổi state!    │
  │                                                          │
  │ BÂY GIỜ STATE Ở 3 NƠI:                                  │
  │ ① JavaScript: menuOpen = true (biến trong JS!)         │
  │ ② CSS: display: block (thuộc tính trong stylesheet!)   │
  │ ③ DOM: class="dropdown show" (attribute trên element!)  │
  │                                                          │
  │ → BA chỗ khác nhau lưu CÙNG MỘT thông tin!            │
  │ → Cập nhật quên 1 chỗ = INCONSISTENCY = BUG!          │
  └──────────────────────────────────────────────────────────┘
```

### Ví dụ thực tế — Todo list "cơn ác mộng"

Tưởng tượng ứng dụng todo list phức tạp hơn:

- **State trong JavaScript**: `todos = [{text: "Mua sữa", done: false}]`
- **State trong CSS**: todo item có `text-decoration: line-through` (gạch ngang = hoàn thành) — CSS đang "nói" todo này đã xong
- **State trong DOM**: attribute `class="completed"` trên element — DOM cũng "nói" todo này đã xong

Bây giờ khi bạn muốn **undo** (hoàn tác), bạn phải thay đổi **CẢ BA** nơi đồng thời: JavaScript data (`done: false`), CSS style (bỏ `line-through`), và DOM attribute (bỏ class `completed`). **Quên một trong ba = bug.** Và ở quy mô Google Sheets — hàng nghìn element, mỗi element có hàng chục thuộc tính — đây là cơn ác mộng không thể kiểm soát.

### Ví dụ nâng cao — CSS `:checked` pseudo-class

CSS còn có khả năng lưu state tinh vi hơn qua **pseudo-classes** (lớp giả). Ví dụ: `input[type="checkbox"]:checked` — CSS **biết** checkbox đang được check hay không! Bạn thậm chí có thể xây dựng toggle switch, accordion, tab system HOÀN TOÀN bằng CSS (dùng `:checked` + sibling selector `~`). Nghe ấn tượng nhưng **CỰC KỲ NGUY HIỂM** vì state giờ nằm hoàn toàn trong DOM/CSS, JavaScript không biết gì.

### Giải pháp — Single source of truth

Đây chính là lý do React và các framework hiện đại ép buộc một nguyên tắc: **single source of truth** (một nguồn sự thật duy nhất). State CHỈ nên nằm ở **MỘT NƠI** — tức JavaScript. CSS và DOM chỉ **phản ánh** (reflect) state đó, không bao giờ **lưu trữ** state riêng.

```
SINGLE SOURCE OF TRUTH (ĐÚNG!):
═══════════════════════════════════════════════════════════════

  ┌──────────────────────────────────────────────────────────┐
  │ ① JavaScript giữ TOÀN BỘ state:                       │
  │   const state = {                                        │
  │     menuOpen: false,                                     │
  │     todos: [{ text: "Mua sữa", done: false }],         │
  │     darkMode: true,                                      │
  │     currentTab: "home",                                  │
  │   }                                                      │
  │                                                          │
  │ ② CSS chỉ PHẢN ÁNH state:                              │
  │   → menuOpen = true → thêm class "show"               │
  │   → done = true → thêm class "completed"              │
  │   → CSS KHÔNG tự quyết ẩn/hiện — JS quyết!           │
  │                                                          │
  │ ③ DOM chỉ PHẢN ÁNH state:                              │
  │   → JS cập nhật DOM dựa trên state!                    │
  │   → DOM KHÔNG tự thay đổi — JS thay đổi DOM!         │
  │                                                          │
  │ KẾT QUẢ:                                                 │
  │ → Muốn biết "trạng thái hiện tại là gì?" → hỏi JS!  │
  │ → CHỈ CẦN CẬP NHẬT MỘT NƠI → CSS/DOM tự theo!      │
  │ → Consistency ĐẢM BẢO! Không bao giờ lệch!           │
  │                                                          │
  │ Đây là triết lý CỐT LÕI của React, Vue, Svelte:       │
  │ "State drives the UI. UI reflects state."               │
  │ "State đẩy giao diện. Giao diện phản chiếu state."    │
  └──────────────────────────────────────────────────────────┘
```

---

## §3. CSSOM — "Mô Hình Thứ Hai Trong Browser!"

> Will: _"CSSOM is a TWO-PART model. Part one: the rules. Part two: a mirror of the page's elements with their styles."_

### Bối cảnh — Tại sao cần MỘT MÔ HÌNH RIÊNG cho CSS?

Ở phần trước, chúng ta đã học rằng browser tạo ra **DOM** (Document Object Model) từ HTML — một mô hình cấu trúc trang. Nhưng DOM **KHÔNG chứa thông tin style**. DOM chỉ biết: "có một element `<p>`, bên trong có text 'Hello'" — nhưng DOM KHÔNG biết paragraph đó có font-size bao nhiêu, màu gì, margin ra sao.

Vì vậy, browser cần **MỘT MÔ HÌNH THỨ HAI** để lưu thông tin style — đó chính là **CSSOM** (CSS Object Model). Giống như DOM được tạo từ HTML, CSSOM được tạo từ CSS. Hai mô hình này tồn tại **SONG SONG** và sau đó được **KẾT HỢP** bởi layout engine.

Will giải thích CSSOM có **hai phần** rất khác nhau:

### Phần 1: Danh sách các quy tắc CSS (CSS Rules)

Khi browser parse (phân tích) file CSS, nó tạo ra một danh sách các **quy tắc** (rules). Mỗi quy tắc gồm hai thành phần:

- **Selector** — chọn element nào? (ví dụ: `p`, `.card`, `#header`, `button:hover`)
- **Declaration block** — áp dụng style gì? (ví dụ: `{ font-size: 18px; color: darkblue; }`)

Danh sách này là "bảng quy luật" — giống như bộ luật giao thông: "tất cả xe máy phải đi làn phải". Chưa áp dụng vào xe cụ thể nào — chỉ là quy tắc tổng quát.

### Phần 2: Bản sao cấu trúc trang với computed styles

Đây là phần phức tạp hơn. CSSOM tạo ra một cây **song song** (mirror tree) với DOM, nhưng mỗi node trên cây này ghi thêm **computed styles** — tức style CUỐI CÙNG sau khi browser tính toán tất cả nguồn style.

Tại sao gọi là "computed" (tính toán)? Vì style cuối cùng của một element **KHÔNG** đơn giản là copy từ file CSS. Browser phải **tính toán** bằng cách kết hợp NHIỀU nguồn:

1. **User agent styles** — browser tự áp dụng mặc định (button có border, h1 cỡ lớn, a có màu xanh, ul có bullet)
2. **External CSS** — file `.css` bạn viết và liên kết qua `<link>`
3. **Internal CSS** — viết trong thẻ `<style>` bên trong HTML
4. **Inline styles** — `style=""` trực tiếp trên element HTML
5. **Inherited styles** — styles được kế thừa từ element cha (ví dụ: `color` trên body → tất cả con đều có cùng color trừ khi ghi đè)

CSSOM phải hợp nhất TẤT CẢ nguồn này theo quy tắc **cascade** (xếp chồng) và **specificity** (mức độ cụ thể) để ra MỘT kết quả cuối cùng cho mỗi element.

```
CSSOM — HAI PHẦN:
═══════════════════════════════════════════════════════════════

  PHẦN 1: Danh sách quy tắc CSS (chưa áp dụng!)
  ┌──────────────────────────────────────────────────────────┐
  │ Từ file CSS:                                             │
  │ ┌────────────────────────────────────────┐              │
  │ │ p {                                    │              │
  │ │   font-size: 18px;      ← declaration  │              │
  │ │   color: darkblue;      ← declaration  │              │
  │ │ }                                      │              │
  │ │ ↑ selector                              │              │
  │ │                                        │              │
  │ │ button {                ← selector     │              │
  │ │   background-color: #3b82f6;           │              │
  │ │   border-radius: 8px;                  │              │
  │ │   cursor: pointer;                     │              │
  │ │   color: white;                        │              │
  │ │ }                                      │              │
  │ └────────────────────────────────────────┘              │
  │                                                          │
  │ CSSOM lưu thành cấu trúc object:                        │
  │ ┌────────────────────────────────────────┐              │
  │ │ rules = [                              │              │
  │ │   {                                    │              │
  │ │     selector: "p",                     │              │
  │ │     declarations: {                    │              │
  │ │       fontSize: "18px",                │              │
  │ │       color: "darkblue"                │              │
  │ │     }                                  │              │
  │ │   },                                   │              │
  │ │   {                                    │              │
  │ │     selector: "button",                │              │
  │ │     declarations: {                    │              │
  │ │       backgroundColor: "#3b82f6",      │              │
  │ │       borderRadius: "8px",             │              │
  │ │       cursor: "pointer",               │              │
  │ │       color: "white"                   │              │
  │ │     }                                  │              │
  │ │   }                                    │              │
  │ │ ]                                      │              │
  │ └────────────────────────────────────────┘              │
  │                                                          │
  │ → Giống "BỘ LUẬT GIAO THÔNG" — quy tắc tổng quát!   │
  │ → Chưa áp dụng vào element CỤ THỂ nào!               │
  └──────────────────────────────────────────────────────────┘

  PHẦN 2: Cây song song với computed styles (ĐÃ áp dụng!)
  ┌──────────────────────────────────────────────────────────┐
  │ DOM tree:              │  CSSOM mirror tree:             │
  │ ┌──────────────────┐  │  ┌──────────────────────────┐  │
  │ │ document          │  │  │ document                  │  │
  │ │ ├── text node     │  │  │ ├── text node             │  │
  │ │ │  "What's on..." │  │  │ │   font: Times, 16px     │  │
  │ │ │                 │  │  │ │   color: black (mặc     │  │
  │ │ │                 │  │  │ │   định từ browser!)      │  │
  │ │ ├── input         │  │  │ ├── input                 │  │
  │ │ │                 │  │  │ │   border: 1px solid      │  │
  │ │ │                 │  │  │ │   font: inherit          │  │
  │ │ │                 │  │  │ │   padding: 2px           │  │
  │ │ └── button        │  │  │ └── button                │  │
  │ │     └── text      │  │  │     bg: #3b82f6           │  │
  │ │       "Publish"   │  │  │     borderRadius: 8px     │  │
  │ └──────────────────┘  │  │     cursor: pointer        │  │
  │                        │  │     color: white            │  │
  │                        │  │     └── text                │  │
  │                        │  │       color: white          │  │
  │                        │  │       (INHERITED từ button!)│  │
  │                        │  └──────────────────────────┘  │
  │                        │                                 │
  │ Chú ý INHERITED:                                         │
  │ → Text node "Publish" bên trong button KHÔNG có CSS    │
  │   riêng, nhưng nó KẾ THỪA color: white từ button cha! │
  │ → Đây là cách inheritance hoạt động trong CSS!         │
  │ → CSSOM phải TÍNH TOÁN điều này!                       │
  │                                                          │
  │ "CSSOM has TWO PARTS: the RULES, and a MIRROR           │
  │  of the page model with COMPUTED styles applied."        │
  └──────────────────────────────────────────────────────────┘
```

---

## §4. Cascade — "Tầng Tầng Lớp Lớp, Ai Thắng?"

> Will: _"CSS — Cascading Style Sheets. The 'cascading' part is CRUCIAL."_

### Bối cảnh — Tại sao gọi là "Cascading"?

Chữ "C" đầu tiên trong CSS là **Cascading** — nghĩa là "xếp chồng", "trôi theo tầng". Đây không phải tên gọi ngẫu nhiên — nó mô tả chính xác cơ chế hoạt động cốt lõi của CSS: khi có **NHIỀU quy tắc** cùng áp dụng cho một element, browser phải quyết định **quy tắc nào thắng**. Quy trình quyết định này gọi là **cascade**.

Tại sao có nhiều quy tắc cùng áp dụng? Vì style đến từ **NHIỀU nguồn** khác nhau, và chúng thường **MÂU THUẪN** với nhau. Ví dụ: browser mặc định nói `<h1>` có `font-size: 2em`, nhưng file CSS của bạn nói `h1 { font-size: 24px }`, và inline style nói `style="font-size: 30px"`. Ba nguồn khác nhau, ba giá trị khác nhau — browser phải chọn MỘT.

### Thứ tự ưu tiên cascade (từ thấp đến cao)

```
CASCADE — THỨ TỰ ƯU TIÊN:
═══════════════════════════════════════════════════════════════

  TẦNG 1 (ưu tiên THẤP NHẤT):
  ┌──────────────────────────────────────────────────────────┐
  │ USER AGENT STYLES — browser tự áp dụng mặc định!       │
  │                                                          │
  │ → Mỗi browser có BỘ STYLE MẶC ĐỊNH riêng!             │
  │ → Ví dụ Chrome mặc định:                               │
  │   • <h1> → font-size: 2em, font-weight: bold          │
  │   • <a> → color: blue, text-decoration: underline      │
  │   • <ul> → list-style-type: disc, padding-left: 40px  │
  │   • <button> → border: 2px outset, padding: 1px 6px   │
  │   • <body> → margin: 8px (đây là lý do trang web     │
  │     luôn có khoảng trắng quanh viền!)                   │
  │                                                          │
  │ → Đây là lý do "CSS Reset" tồn tại — để XOÁ tất cả  │
  │   style mặc định và bắt đầu từ "trang giấy trắng"!   │
  │ → normalize.css, CSS Reset, modern-normalize!           │
  └──────────────────────────────────────────────────────────┘

  TẦNG 2:
  ┌──────────────────────────────────────────────────────────┐
  │ EXTERNAL CSS — file .css liên kết qua <link>!          │
  │                                                          │
  │ → <link href="styles.css" rel="stylesheet">             │
  │ → Đây là cách phổ biến nhất để viết CSS!               │
  │ → Một file CSS có thể phục vụ NHIỀU trang HTML!        │
  │ → Browser CACHE file CSS → tải lần đầu, dùng lại!    │
  │                                                          │
  │ → GHI ĐÈ lên user agent styles!                       │
  │ → Ví dụ: bạn viết h1 { font-size: 24px } → browser   │
  │   không dùng 2em mặc định nữa, dùng 24px của bạn!    │
  └──────────────────────────────────────────────────────────┘

  TẦNG 3:
  ┌──────────────────────────────────────────────────────────┐
  │ INTERNAL CSS — viết trong <style> bên trong HTML!       │
  │                                                          │
  │ → <style> h1 { font-size: 28px; } </style>             │
  │ → Chỉ áp dụng cho TRANG NÀY (không share được!)      │
  │ → Ưu tiên cao hơn external CSS cùng specificity!      │
  │ → Ít dùng trong thực tế (trừ email template, critical  │
  │   CSS cho above-the-fold content!)                      │
  └──────────────────────────────────────────────────────────┘

  TẦNG 4:
  ┌──────────────────────────────────────────────────────────┐
  │ INLINE STYLES — style="" trực tiếp trên element!        │
  │                                                          │
  │ → <h1 style="font-size: 30px">Hello</h1>               │
  │ → Ưu tiên RẤT CAO — gần như luôn thắng!              │
  │ → Khó bảo trì vì KHÔNG TÁI SỬ DỤNG được!            │
  │ → Nhưng React và CSS-in-JS dùng inline styles nhiều!  │
  │   (style={{ fontSize: "30px" }})                        │
  └──────────────────────────────────────────────────────────┘

  TẦNG 5 (ưu tiên CAO NHẤT):
  ┌──────────────────────────────────────────────────────────┐
  │ !important — "VŨ KHÍ HẠT NHÂN" của CSS! ☢️            │
  │                                                          │
  │ → h1 { font-size: 50px !important; }                   │
  │ → GHI ĐÈ MỌI THỨ — kể cả inline styles!             │
  │ → Bad Practice! Chỉ dùng khi BẤT ĐẮC DĨ!            │
  │                                                          │
  │ → Nếu 2 rule đều có !important? → specificity quyết!  │
  │ → Nếu specificity CŨNG bằng nhau? → rule SAU thắng!  │
  │ → "Cuộc chiến !important" = code KHÔNG THỂ bảo trì!   │
  │ → "If everything is !important, nothing is."            │
  └──────────────────────────────────────────────────────────┘

  TÓM TẮT ƯU TIÊN (thấp → cao):
  ┌──────────────────────────────────────────────────────────┐
  │ user agent < external < internal < inline < !important  │
  │                                                          │
  │ → Nếu ĐỒI ĐỘI (cùng tầng, cùng specificity):         │
  │   Rule viết SAU trong file CSS thắng!                   │
  │   "Last one wins." — quy tắc ai viết sau người ấy hơn!│
  └──────────────────────────────────────────────────────────┘
```

### Cascade và vấn đề bảo trì

Cascade nghe hợp lý trên giấy, nhưng trong thực tế ở dự án lớn, nó tạo ra **sự hỗn loạn**: developer A viết rule ở file `header.css`, developer B viết rule ở file `global.css`, designer C viết inline style — và không ai biết quy tắc nào đang thắng. Đây là lý do các phương pháp như **BEM** (Block Element Modifier), **CSS Modules**, **Styled Components**, và **Tailwind CSS** xuất hiện — tất cả đều cố gắng **loại bỏ hoặc giảm thiểu cascade** bằng cách scope (giới hạn phạm vi) CSS vào từng component.

---

## §5. Specificity — "Cuộc Chiến Quyền Lực Giữa Các Selector!"

### Bối cảnh — Khi cascade không đủ, specificity quyết định

Trong cùng một tầng cascade (ví dụ: cùng là external CSS), nếu hai quy tắc mâu thuẫn nhau, browser dùng **specificity** (mức độ cụ thể) để quyết định. Selector nào **cụ thể hơn** (specific hơn) thì thắng.

Specificity được tính theo **ba cấp bậc** (a, b, c):

```
SPECIFICITY — TÍNH ĐIỂM SELECTOR:
═══════════════════════════════════════════════════════════════

  BA CẤP BẬC (a, b, c):
  ┌──────────────────────────────────────────────────────────┐
  │ a = số lượng ID selector (#id!)                         │
  │ b = số lượng CLASS, ATTRIBUTE, PSEUDO-CLASS selector!   │
  │ c = số lượng ELEMENT, PSEUDO-ELEMENT selector!          │
  │                                                          │
  │ So sánh: a trước, nếu bằng thì b, nếu bằng thì c!    │
  └──────────────────────────────────────────────────────────┘

  VÍ DỤ:
  ┌──────────────────────────────────────────────────────────┐
  │ p { }                        → (0, 0, 1) = CỤ THỂ ÍT! │
  │ .card { }                    → (0, 1, 0)               │
  │ p.card { }                   → (0, 1, 1)               │
  │ #header { }                  → (1, 0, 0) = CỤ THỂ HƠN!│
  │ #header .nav a { }           → (1, 1, 1)               │
  │ #header .nav a:hover { }     → (1, 2, 1) = CAO NHẤT!  │
  │                                                          │
  │ → #header .nav a:hover THẮNG p { } mọi lúc!          │
  │ → Vì a=1 > a=0, dù c có lớn bao nhiêu cũng không     │
  │   thắng được ID selector!                               │
  │                                                          │
  │ "1 ID selector > 1000 class selectors!"                 │
  │ → (1,0,0) > (0,999,999) = ĐÚNG!                       │
  │ → Hệ thống KHÔNG cộng đơn giản — so sánh theo cấp!   │
  └──────────────────────────────────────────────────────────┘

  TẠI SAO SPECIFICITY QUAN TRỌNG:
  ┌──────────────────────────────────────────────────────────┐
  │ → Giải quyết mâu thuẫn CÙNG TẦNG cascade!             │
  │ → Nhưng cũng tạo ra "specificity wars" (cuộc chiến    │
  │   specificity) trong dự án lớn!                         │
  │ → Developer A viết .card { color: blue }               │
  │ → Developer B viết #main .content .card { color: red } │
  │ → B luôn thắng vì specificity cao hơn!                │
  │ → A thêm !important → cuộc chiến leo thang!           │
  │ → Đây là NGUYÊN NHÂN SÂU XA của "CSS is hard"!       │
  └──────────────────────────────────────────────────────────┘
```

---

## §6. Liên Kết CSS Qua HTML — "Di Sản Lịch Sử 5 Năm Trễ!"

> Will: _"We PREEMPTIVELY set our styles on a different page and then link to them from HTML. Because CSS came after HTML."_

### Bối cảnh — Tại sao CSS phải "nhờ" HTML?

Đây là một "quirk" (đặc điểm kỳ lạ) lịch sử mà Will nhấn mạnh. CSS **không tự đứng được** — nó phải được liên kết từ file HTML thông qua thẻ `<link>` hoặc viết bên trong thẻ `<style>`. CSS KHÔNG có cách nào tự "chạy" mà không có HTML.

Câu trả lời nằm ở **lịch sử**: HTML ra đời năm 1991 tại CERN, CSS ra đời năm 1996 — **muộn hơn 5 năm**. Trong 5 năm đầu tiên, web browser hoạt động **chỉ với HTML**. Khi CSS được phát minh, HTML đã là "ngôn ngữ chính" — mọi thứ đều đi qua HTML. CSS buộc phải **"gắn vào"** HTML thay vì tồn tại độc lập.

Will dùng từ **"preemptively"** — nghĩa là chúng ta **đặt trước** style ở file riêng, sau đó liên kết vào HTML. Quy trình này nghe ngược đời (viết style trước khi biết element nào tồn tại?) nhưng hoàn toàn hợp lý: CSS rule dùng **selector** để "chọn" element — nên rule có thể viết trước, và khi element xuất hiện trên DOM, rule tự áp dụng.

```
CSS LIÊN KẾT QUA HTML — 3 CÁCH:
═══════════════════════════════════════════════════════════════

  CÁCH 1: External CSS (phổ biến nhất!):
  ┌──────────────────────────────────────────────────────────┐
  │ HTML file:                                               │
  │ <link href="styles.css" rel="stylesheet">                │
  │                                                          │
  │ → Browser gặp thẻ <link> khi parse HTML!               │
  │ → Dừng parse HTML (render-blocking resource!)          │
  │ → Tải file CSS từ server!                              │
  │ → Parse CSS → tạo CSSOM!                              │
  │ → Tiếp tục parse HTML!                                 │
  │                                                          │
  │ ƯU ĐIỂM:                                                │
  │ → Tái sử dụng! 1 file CSS cho NHIỀU trang!            │
  │ → Browser cache! Tải lần đầu, lần sau dùng lại!      │
  │ → Tách biệt concerns! HTML = cấu trúc, CSS = style!  │
  │                                                          │
  │ NHƯỢC ĐIỂM:                                              │
  │ → Render-blocking! Browser PHẢI tải xong CSS trước     │
  │   khi hiển thị bất kỳ thứ gì!                          │
  │ → "Flash of Unstyled Content" nếu CSS tải chậm!       │
  └──────────────────────────────────────────────────────────┘

  CÁCH 2: Internal CSS (<style> tag!):
  ┌──────────────────────────────────────────────────────────┐
  │ <style>                                                  │
  │   p { font-size: 18px; }                                │
  │   button { background: blue; }                          │
  │ </style>                                                 │
  │                                                          │
  │ → Viết TRỰC TIẾP trong HTML!                            │
  │ → Không cần tải file riêng = nhanh hơn cho trang đó!  │
  │ → Nhưng KHÔNG tái sử dụng được! Không cache riêng!    │
  │ → Dùng cho: critical CSS (above-the-fold), email HTML! │
  └──────────────────────────────────────────────────────────┘

  CÁCH 3: Inline styles (style attribute!):
  ┌──────────────────────────────────────────────────────────┐
  │ <button style="background: blue; color: white">          │
  │   Publish                                                │
  │ </button>                                                │
  │                                                          │
  │ → Ưu tiên CAO (trừ !important!)                        │
  │ → KHÔNG tái sử dụng! Viết LẶP LẠI mỗi element!      │
  │ → Nhưng React CSS-in-JS dùng inline vì SCOPED tự nhiên!│
  │ → style={{ background: "blue" }} — JS object, ko string!│
  └──────────────────────────────────────────────────────────┘

  TẠI SAO TẤT CẢ ĐỀU QUA HTML?
  ┌──────────────────────────────────────────────────────────┐
  │ "CSS came AFTER HTML. It has to 'hook in' somehow."     │
  │ → HTML 1991 → CSS 1996 = muộn 5 năm!                 │
  │ → CSS KHÔNG tự đứng được — phải gắn vào HTML!        │
  │ → Render-blocking vì browser cần CSSOM TRƯỚC KHI       │
  │   hiển thị! (Nếu hiển thị trước → FOUC!)             │
  │ → "Đây là DI SẢN AD HOC. Nếu thiết kế lại từ đầu,  │
  │   mọi thứ sẽ tích hợp chặt chẽ hơn nhiều."           │
  └──────────────────────────────────────────────────────────┘
```

### Phân tích chuyên sâu — Render-blocking và Critical CSS

Một hệ quả quan trọng của việc CSS liên kết qua HTML: CSS là **render-blocking resource**. Nghĩa là browser **KHÔNG hiển thị BẤT KỲ THỨ GÌ** cho đến khi CSS tải xong và CSSOM được tạo. Tại sao? Vì nếu hiển thị trước khi có CSS, người dùng sẽ thấy **trang trắng với text thuần** (không format) trong vài giây, rồi đột ngột "nhảy" sang giao diện đẹp — gọi là **FOUC** (Flash of Unstyled Content). Trải nghiệm cực kỳ tệ!

Giải pháp hiện đại: **Critical CSS** — extract CSS cần thiết cho phần "above the fold" (phần người dùng nhìn thấy đầu tiên) và đặt inline trong `<style>`, phần còn lại tải async. Google PageSpeed Insights đánh giá cao kỹ thuật này.

---

## §7. DOM + CSSOM = Render Tree — "Hai Mô Hình Kết Hợp Thành Pixel!"

> Will: _"These two MODELS get combined by layout and render engine — what's displayed depends on BOTH."_

### Bối cảnh — Render tree là gì và tại sao cần nó?

Khi cả DOM và CSSOM đã hoàn chỉnh, layout engine **kết hợp** chúng thành một cấu trúc mới gọi là **render tree** (cây render). Đây là bước QUAN TRỌNG vì render tree **KHÔNG** giống DOM — nó chỉ chứa những element **THỰC SỰ CẦN HIỂN THỊ** trên trang.

Sự khác biệt giữa DOM và render tree:

- Element bị `display: none` **CÓ** trên DOM nhưng **KHÔNG CÓ** trên render tree. Browser biết element tồn tại (DOM) nhưng quyết định không hiển thị nó (render tree).
- Thẻ `<head>`, `<script>`, `<meta>` **CÓ** trên DOM nhưng **KHÔNG CÓ** trên render tree — chúng không phải visual element.
- Element có `visibility: hidden` **CÓ** trên cả DOM VÀ render tree — nó vẫn chiếm không gian, chỉ **trong suốt**! Đây là khác biệt quan trọng giữa `display: none` (biến mất hoàn toàn, không chiếm chỗ) và `visibility: hidden` (trong suốt nhưng vẫn chiếm chỗ).
- **Pseudo-elements** (::before, ::after) **KHÔNG CÓ** trên DOM nhưng **CÓ** trên render tree! Chúng chỉ tồn tại ở tầng CSS, không phải cấu trúc HTML.

```
DOM vs RENDER TREE — KHÔNG GIỐNG NHAU:
═══════════════════════════════════════════════════════════════

  DOM (cấu trúc ĐẦY ĐỦ!):
  ┌──────────────────────────────────────────────────────────┐
  │ document                                                 │
  │ ├── head ← KHÔNG hiển thị! Chỉ metadata!              │
  │ │   ├── title "My Page"                                 │
  │ │   ├── meta charset                                    │
  │ │   └── link stylesheet                                 │
  │ ├── body                                                 │
  │ │   ├── div.header                                      │
  │ │   │   └── h1 "Hello"                                  │
  │ │   ├── div.content                                     │
  │ │   │   ├── p "Visible text"                            │
  │ │   │   └── p.hidden (display: none!) ← ẨN!           │
  │ │   └── script ← KHÔNG hiển thị! Chỉ code!            │
  │ └──                                                      │
  └──────────────────────────────────────────────────────────┘

  RENDER TREE (chỉ element NHÌN THẤY ĐƯỢC!):
  ┌──────────────────────────────────────────────────────────┐
  │ render root                                              │
  │ ├── div.header — bg: white, padding: 16px              │
  │ │   └── h1 "Hello" — font: 24px, bold, color: black   │
  │ ├── div.content — padding: 20px                        │
  │ │   └── p "Visible text" — font: 16px, color: #333    │
  │ │                                                        │
  │ │   (p.hidden KHÔNG ở đây! display: none!)             │
  │ │   (head, script KHÔNG ở đây! Không visual!)          │
  │ │                                                        │
  │ │   ::before pseudo-element — CÓ ở đây!               │
  │ │   (Dù KHÔNG có trên DOM!)                             │
  │ └──                                                      │
  │                                                          │
  │ MỖI NODE TRÊN RENDER TREE CÓ:                           │
  │ → Cấu trúc (từ DOM!): type, children, content          │
  │ → Style (từ CSSOM!): computed styles cuối cùng         │
  │ → "What gets displayed depends on BOTH models."        │
  └──────────────────────────────────────────────────────────┘

  SỰ KHÁC BIỆT QUAN TRỌNG:
  ┌──────────────────────────────────────────────────────────┐
  │ display: none     → KHÔNG trên render tree!            │
  │                      KHÔNG chiếm không gian!            │
  │                      Như "biến mất hoàn toàn"!          │
  │                                                          │
  │ visibility: hidden → CÓ trên render tree!              │
  │                      CÓ chiếm không gian!               │
  │                      Nhưng TRONG SUỐT!                   │
  │                      Như "người vô hình vẫn chiếm chỗ!" │
  │                                                          │
  │ opacity: 0         → CÓ trên render tree!              │
  │                      CÓ chiếm không gian!               │
  │                      Trong suốt nhưng VẪN tương tác!    │
  │                      (click vẫn hoạt động!)             │
  │                                                          │
  │ → BA cách "ẩn" khác nhau, BA hành vi khác nhau!       │
  │ → Đây là ví dụ về CSS "sophisticated to a FAULT"!     │
  └──────────────────────────────────────────────────────────┘
```

---

## §8. Pipeline Hoàn Chỉnh — "Từ Code Đến Pixel, Mọi Bước!"

> Will: _"The render engine produces a composite image — a BITMAP, rasterizes it — turns it into a list of pixels, and then pings it out 60 times a second."_

### Bối cảnh — Toàn bộ hành trình từ code đến pixel

Bây giờ chúng ta đã hiểu tất cả các thành phần, hãy ghép lại thành **pipeline hoàn chỉnh** — từ file text (HTML + CSS) đến pixel trên màn hình. Đây là hành trình mà BROWSER LÀM TỰ ĐỘNG mỗi khi bạn mở trang web:

```
PIPELINE HOÀN CHỈNH — TỪ CODE ĐẾN PIXEL:
═══════════════════════════════════════════════════════════════

  BƯỚC 1: Parse HTML
  ┌──────────────────────────────────────────────────────────┐
  │ HTML file (text thuần!) ──parse──▶ DOM (cấu trúc C++!) │
  │                                                          │
  │ → Đọc từng dòng HTML, tạo node trên cây DOM!          │
  │ → MỘT LẦN DUY NHẤT! Không quay lại file HTML!        │
  │ → Gặp <link stylesheet> → kích hoạt bước 2!          │
  │ → Gặp <script> → kích hoạt JavaScript engine!        │
  └──────────────────────────────────────────────────────────┘
              │
              │ Song song (hoặc tuần tự tuỳ browser!)
              ▼
  BƯỚC 2: Parse CSS
  ┌──────────────────────────────────────────────────────────┐
  │ CSS file ──parse──▶ CSSOM (style C++!)                  │
  │                                                          │
  │ → Tải file CSS (render-blocking!)                      │
  │ → Parse → tạo danh sách rules (phần 1 CSSOM!)        │
  │ → Tính computed styles (phần 2 CSSOM!)                 │
  │ → Áp dụng cascade + specificity + inheritance!         │
  └──────────────────────────────────────────────────────────┘
              │
              │ Cả hai hoàn chỉnh → kết hợp!
              ▼
  BƯỚC 3: Xây dựng Render Tree
  ┌──────────────────────────────────────────────────────────┐
  │ DOM + CSSOM ──kết hợp──▶ RENDER TREE!                   │
  │                                                          │
  │ → Chỉ giữ element NHÌN THẤY ĐƯỢC!                     │
  │ → Loại bỏ: display: none, <head>, <script>!           │
  │ → Thêm: ::before, ::after (pseudo-elements!)           │
  │ → Mỗi node = cấu trúc (DOM) + style (CSSOM)!         │
  └──────────────────────────────────────────────────────────┘
              │
              ▼
  BƯỚC 4: Layout
  ┌──────────────────────────────────────────────────────────┐
  │ Render Tree ──layout──▶ Layout Tree (có toạ độ!)       │
  │                                                          │
  │ → Tính toạ độ (x, y) chính xác cho THIẾT BỊ NÀY!    │
  │ → Tính chiều rộng, chiều cao từng element!             │
  │ → Xử lý: text wrapping, flex, grid, float, position!  │
  │ → Thu nhỏ cửa sổ? Layout TÍNH LẠI!                   │
  │ → Gọi là "Reflow" khi phải tính lại!                  │
  └──────────────────────────────────────────────────────────┘
              │
              ▼
  BƯỚC 5: Paint
  ┌──────────────────────────────────────────────────────────┐
  │ Layout Tree ──paint──▶ Paint Records!                    │
  │                                                          │
  │ → Tạo danh sách lệnh vẽ: "vẽ hình chữ nhật xanh     │
  │   tại (100, 50), kích thước 200×40"!                   │
  │ → Sắp xếp theo z-index (element nào vẽ trước?)       │
  │ → Gọi là "Repaint" khi chỉ đổi màu/style mà không   │
  │   đổi vị trí!                                           │
  └──────────────────────────────────────────────────────────┘
              │
              ▼
  BƯỚC 6: Composite
  ┌──────────────────────────────────────────────────────────┐
  │ Paint Records ──composite──▶ Layers + Bitmap!           │
  │                                                          │
  │ → Chia trang thành LAYERS (tầng) riêng biệt!          │
  │ → Element có transform/opacity → layer riêng!          │
  │ → Rasterize: chuyển bitmap → danh sách pixel!         │
  │ → Mỗi pixel: toạ độ (x, y) + màu (RGB)!              │
  └──────────────────────────────────────────────────────────┘
              │ (mỗi ~16ms = 60fps!)
              ▼
  BƯỚC 7: Display
  ┌──────────────────────────────────────────────────────────┐
  │ 🎮 Graphics Card → LÊN MÀN HÌNH!                      │
  │                                                          │
  │ → Nhận danh sách pixel → hiển thị!                    │
  │ → 60 lần/giây (60fps = ~16ms mỗi frame!)              │
  │ → Mượt mà = kịp 16ms! Giật = trễ 16ms!               │
  └──────────────────────────────────────────────────────────┘

  TỔNG KẾT PIPELINE:
  ┌──────────────────────────────────────────────────────────┐
  │ HTML ──▶ DOM ──┐                                        │
  │                 ├──▶ Render Tree ──▶ Layout ──▶ Paint   │
  │ CSS ──▶ CSSOM ─┘                        ──▶ Composite   │
  │                                              ──▶ Display │
  │                                                          │
  │ 7 BƯỚC! Từ text file đến 2 triệu pixel!               │
  │ Browser xử lý TẤT CẢ tự động! Ta chỉ viết HTML+CSS!  │
  └──────────────────────────────────────────────────────────┘
```

### Phân tích chuyên sâu — Reflow vs Repaint

Hai thuật ngữ quan trọng cho performance:

- **Reflow** (Layout lại): khi bạn thay đổi thứ gì ảnh hưởng đến **vị trí hoặc kích thước** element (ví dụ: thêm element, thay đổi width, thay đổi font-size). Browser phải chạy lại TỪ BƯỚC 4 (Layout) → Paint → Composite. **Rất tốn kém!**

- **Repaint** (Vẽ lại): khi bạn chỉ thay đổi **giao diện** mà không thay đổi vị trí (ví dụ: đổi màu background, đổi border-color). Browser chỉ cần BƯỚC 5 (Paint) → Composite. **Ít tốn kém hơn reflow!**

- **Composite only**: khi bạn chỉ thay đổi `transform` hoặc `opacity`. Browser chỉ cần BƯỚC 6, không cần layout hay paint! **Rẻ nhất!** Đây là lý do animation nên dùng `transform` thay vì `top/left`.

---

## §9. Goal 1 Hoàn Thành! — "Hiển Thị Nội Dung = XONG!"

> Will: _"Goal one — display content for our user to see. DONE!"_

### Bối cảnh — Tổng kết Goal 1 và nhìn về phía trước

Will tuyên bố hoàn thành mục tiêu thứ nhất — và đúng như ông hứa, mất khoảng 20 phút! Để hiển thị nội dung trên trang, chúng ta cần NĂM thành phần chính:

1. **HTML** — semi-visual code mô tả cấu trúc và nội dung. Ngôn ngữ "trực quan nhất từng tồn tại" — viết text = hiện text!
2. **CSS** — quy tắc style cho giao diện trực quan. "Beautifully sophisticated" nhưng có thể "đến mức nguy hiểm" khi lưu state!
3. **DOM** — mô hình cấu trúc trang, implement bằng C++. Document (di sản CERN) + Object (key-value) + Model (đơn giản hoá như LEGO)!
4. **CSSOM** — mô hình style trang, implement bằng C++. Hai phần: rules + mirror tree với computed styles!
5. **WebCore** — layout + render engine kết hợp DOM + CSSOM → render tree → layout → paint → composite → pixel!

**Chỉ cần 5 thành phần!** Nghe đơn giản, nhưng mỗi thành phần có hàng thập kỷ phát triển phía sau. Và bây giờ câu hỏi tiếp theo mới THỰC SỰ KHÓ: **làm sao cho phép người dùng THAY ĐỒI nội dung?**

```
GOAL 1 — HOÀN THÀNH! ✅
═══════════════════════════════════════════════════════════════

  5 THÀNH PHẦN:
  ┌──────────────────────────────────────────────────────────┐
  │ ① HTML → cấu trúc + nội dung (semi-visual code!)     │
  │ ② CSS → giao diện trực quan (sophisticated → fault!)  │
  │ ③ DOM → mô hình cấu trúc trang (C++, Document       │
  │         Object Model như LEGO!)                         │
  │ ④ CSSOM → mô hình style (rules + computed styles!)    │
  │ ⑤ WebCore → pipeline 7 bước → pixel 60fps!           │
  │                                                          │
  │ "Goal one — DONE. Took about 20 minutes."              │
  │ "Just HTML and CSS to display data."                    │
  └──────────────────────────────────────────────────────────┘

  GOAL 2: "This is where the PROBLEMS begin!" 😈
  ┌──────────────────────────────────────────────────────────┐
  │ → HTML = one-time! Không quay lại sau khi parse!       │
  │ → DOM = có data nhưng KHÔNG THỂ chạy code!            │
  │ → Pixel = không biết chúng là gì (ẢO GIÁC!)          │
  │ → CẦN JAVASCRIPT — đáp án duy nhất! (Phần 6!)        │
  └──────────────────────────────────────────────────────────┘
```

---

## §10. So Sánh Web vs Native — "Apple Sở Hữu Toàn Bộ Stack!"

> Will: _"Apple has the benefit of being an environment that is OWNED. And they own the whole stack."_

### Bối cảnh — Hai triết lý hoàn toàn khác nhau

Will đưa ra so sánh với phát triển native (Swift/SwiftUI cho iOS) để làm nổi bật tại sao web browser phức tạp. Đây không phải so sánh "web tốt hơn hay native tốt hơn" — mà là so sánh về **quyền kiểm soát kiến trúc**.

**Apple (Native stack):** Apple **sở hữu toàn bộ** từ phần cứng (chip Apple Silicon M-series), hệ điều hành (iOS/macOS), ngôn ngữ lập trình (Swift), đến framework UI (SwiftUI). Điều này có nghĩa: khi Apple nhận ra UIKit (framework UI cũ) quá phức tạp và khó bảo trì, họ có quyền **xây mới hoàn toàn** — tạo ra SwiftUI với triết lý declarative, loại bỏ mọi vấn đề thiết kế cũ. họ kiểm soát MỌI THỨ nên có thể tối ưu từ chip hardware đến API framework.

**Web (Ad hoc stack):** Web browser **KHÔNG AI sở hữu toàn bộ**. JavaScript do TC39 (Ecma International) quản lý, HTML/CSS do W3C và WHATWG, DOM API do riêng từng browser implement (Chrome/Blink, Firefox/Gecko, Safari/WebKit). Mỗi phần được thiết kế bởi **đội ngũ khác nhau**, vào **thời điểm khác nhau**, với **mục tiêu khác nhau**. Khi gặp vấn đề? **Chắp vá!** Không thể xây mới vì hàng tỷ trang web cũ sẽ hỏng (backward compatibility).

React, Vue, Svelte — tất cả framework — là **NỖ LỰC của cộng đồng** để bù đắp cho kiến trúc ad hoc của browser. Will luôn nhắc: "These are MOVES, not truths!" — đây là chiến lược giải quyết vấn đề, KHÔNG phải sự thật tuyệt đối. Ai đó có thể nghĩ ra "move" tốt hơn, và framework sẽ tiếp tục tiến hoá.

```
WEB vs NATIVE — SO SÁNH CHI TIẾT:
═══════════════════════════════════════════════════════════════

  ┌────────────────┬──────────────────┬──────────────────────┐
  │ Tiêu chí       │ Web Browser      │ Native (Apple)       │
  ├────────────────┼──────────────────┼──────────────────────┤
  │ Sở hữu        │ ❌ Không ai!     │ ✅ Apple toàn bộ!   │
  │ Phân phối      │ ✅ Universal!    │ ❌ Chỉ iOS/Mac!     │
  │ Kiến trúc      │ ❌ Ad hoc 30y!   │ ✅ Thiết kế thống   │
  │                │                  │    nhất!              │
  │ Giải quyết     │ ❌ Chắp vá!     │ ✅ Xây mới!          │
  │ vấn đề        │ (backward compat)│ (UIKit→SwiftUI!)     │
  │ Performance    │ ⚠️ JS overhead!  │ ✅ Native speed!     │
  │ Ngôn ngữ UI   │ ❌ HTML+CSS+JS   │ ✅ Chỉ Swift!       │
  │                │ (3 ngôn ngữ!)    │ (1 ngôn ngữ!)       │
  │ Cross-platform │ ✅ Mọi thiết bị! │ ❌ Chỉ Apple!       │
  │ Framework      │ React/Vue/Svelte │ SwiftUI (chính thức!)│
  │                │ (cộng đồng!)     │ (Apple tạo!)        │
  │ State quản lý  │ ❌ Phân tán!     │ ✅ @State tích hợp! │
  │ Developer      │ ✅ Triệu người!  │ ⚠️ Ít hơn nhiều!    │
  │ ecosystem      │                  │                      │
  └────────────────┴──────────────────┴──────────────────────┘

  KẾT LUẬN — TRADE-OFF:
  ┌──────────────────────────────────────────────────────────┐
  │ Web = UNIVERSAL nhưng AD HOC + PHỨC TẠP!               │
  │ Native = NHẤT QUÁN nhưng GIỚI HẠN PLATFORM!           │
  │                                                          │
  │ → Chọn Web: khi cần tiếp cận MỌI NGƯỜI trên MỌI      │
  │   thiết bị! "Write once, run everywhere!"               │
  │ → Chọn Native: khi cần PERFORMANCE tối đa và trải     │
  │   nghiệm người dùng PREMIUM trên 1 platform!           │
  │                                                          │
  │ → Đây là trade-off KHÔNG CÓ đáp án tuyệt đối!        │
  │ → "These are MOVES, not truths!"                       │
  └──────────────────────────────────────────────────────────┘
```

---

## §11. Tự Implement: Mô Phỏng CSSOM Từ Đầu

```javascript
// ═══════════════════════════════════
// CSSOM — Mô phỏng từ đầu!
// Tự viết thư viện, không dùng framework!
// ═══════════════════════════════════

// ── Phần 1: Parse CSS Rules ──
// "Part one of CSSOM: the RULES."

function parseCSSRules(cssText) {
  const rules = [];
  const ruleRegex = /([^{]+)\{([^}]+)\}/g;
  let match;

  while ((match = ruleRegex.exec(cssText)) !== null) {
    const selector = match[1].trim();
    const declarations = {};

    match[2].split(";").forEach((decl) => {
      const parts = decl.split(":");
      if (parts.length >= 2) {
        const prop = parts[0].trim();
        const value = parts.slice(1).join(":").trim();
        if (prop && value) {
          // CSS property → camelCase!
          // font-size → fontSize, background-color → backgroundColor
          const camelProp = prop.replace(/-([a-z])/g, (_, letter) =>
            letter.toUpperCase(),
          );
          declarations[camelProp] = value;
        }
      }
    });

    rules.push({ selector, declarations });
  }

  return rules;
}

// Ví dụ:
const cssText = `
  p {
    font-size: 18px;
    color: darkblue;
    line-height: 1.6;
  }
  button {
    background-color: #3b82f6;
    border-radius: 8px;
    cursor: pointer;
    color: white;
    padding: 8px 16px;
  }
  .hidden {
    display: none;
  }
`;

const rules = parseCSSRules(cssText);
console.log("CSS Rules:", rules);
// [
//   { selector: "p", declarations: { fontSize: "18px", color: "darkblue", lineHeight: "1.6" } },
//   { selector: "button", declarations: { backgroundColor: "#3b82f6", ... } },
//   { selector: ".hidden", declarations: { display: "none" } }
// ]

// ── Phần 2: Tính Specificity ──
// "Specificity = (a, b, c) scoring system!"

function calculateSpecificity(selector) {
  let a = 0; // ID selectors (#id)
  let b = 0; // Class, attribute, pseudo-class selectors
  let c = 0; // Element, pseudo-element selectors

  // Đếm ID selectors (#)
  a = (selector.match(/#[a-zA-Z]/g) || []).length;

  // Đếm class selectors (.), attribute ([]), pseudo-class (:)
  b = (selector.match(/\.[a-zA-Z]/g) || []).length;
  b += (selector.match(/\[/g) || []).length;
  b += (selector.match(/:[^:]/g) || []).length;

  // Đếm element selectors
  const withoutClassAndId = selector
    .replace(/#[a-zA-Z][\w-]*/g, "")
    .replace(/\.[a-zA-Z][\w-]*/g, "")
    .replace(/\[.*?\]/g, "")
    .replace(/:[a-zA-Z-]+/g, "");
  c = (withoutClassAndId.match(/[a-zA-Z]+/g) || []).length;

  return [a, b, c];
}

console.log(calculateSpecificity("p")); // [0, 0, 1]
console.log(calculateSpecificity(".card")); // [0, 1, 0]
console.log(calculateSpecificity("#header .nav a")); // [1, 1, 1]

// ── Phần 3: Áp dụng Cascade + Computed Styles ──
// "Part two: a MIRROR with styles applied."

// User agent styles mặc định (giống browser!)
const USER_AGENT_STYLES = {
  p: { display: "block", margin: "1em 0" },
  button: { display: "inline-block", cursor: "default" },
  h1: { fontSize: "2em", fontWeight: "bold" },
  body: { margin: "8px" },
};

function computeStyles(domNode, cssRules, parentStyles = {}) {
  const node = { ...domNode, computedStyle: {} };

  // Bước 1: Áp dụng user agent styles mặc định!
  if (USER_AGENT_STYLES[node.type]) {
    Object.assign(node.computedStyle, USER_AGENT_STYLES[node.type]);
  }

  // Bước 2: Kế thừa inheritable properties từ cha!
  // (color, font-size, line-height được kế thừa!)
  const INHERITABLE = ["color", "fontSize", "lineHeight", "fontFamily"];
  for (const prop of INHERITABLE) {
    if (parentStyles[prop]) {
      node.computedStyle[prop] = parentStyles[prop];
    }
  }

  // Bước 3: Áp dụng CSS rules theo cascade!
  // Rules sau GHI ĐÈ rules trước (cùng specificity!)
  for (const rule of cssRules) {
    if (matchesSelector(node, rule.selector)) {
      Object.assign(node.computedStyle, rule.declarations);
    }
  }

  // Bước 4: Áp dụng inline styles (ưu tiên cao nhất!)
  if (node.inlineStyle) {
    Object.assign(node.computedStyle, node.inlineStyle);
  }

  // Đệ quy cho children — truyền computedStyle làm parentStyles!
  node.children = (domNode.children || []).map((child) =>
    computeStyles(child, cssRules, node.computedStyle),
  );

  return node;
}

function matchesSelector(node, selector) {
  if (selector.startsWith("#")) return node.id === selector.slice(1);
  if (selector.startsWith(".")) {
    return (node.classes || []).includes(selector.slice(1));
  }
  return node.type === selector;
}

// ── Phần 4: Xây Render Tree ──
// "Only VISIBLE elements make it to the render tree!"

function buildRenderTree(styledDom) {
  // display: none → KHÔNG có trên render tree!
  if (styledDom.computedStyle?.display === "none") {
    return null; // Biến mất hoàn toàn! Không chiếm chỗ!
  }

  // <head>, <script>, <meta> → cũng không hiển thị!
  const nonVisualTags = ["head", "script", "meta", "link", "style"];
  if (nonVisualTags.includes(styledDom.type)) {
    return null;
  }

  const renderNode = {
    type: styledDom.type,
    content: styledDom.content,
    style: styledDom.computedStyle,
    children: [],
  };

  for (const child of styledDom.children || []) {
    const renderChild = buildRenderTree(child);
    if (renderChild) {
      renderNode.children.push(renderChild);
    }
  }

  return renderNode;
}

// ── Phần 5: In Render Tree ──
function printRenderTree(node, indent = 0) {
  if (!node) return;
  const prefix = " ".repeat(indent);
  const styleStr = Object.entries(node.style || {})
    .map(([k, v]) => `${k}: ${v}`)
    .join(", ");

  if (node.type === "text") {
    console.log(`${prefix}📝 "${node.content}" [${styleStr}]`);
  } else {
    console.log(`${prefix}📦 ${node.type} [${styleStr}]`);
  }

  for (const child of node.children || []) {
    printRenderTree(child, indent + 2);
  }
}
```

---

## §12. 🔬 Deep Analysis Patterns — 6 Tư Duy Phân Tích Sâu

### 12.1 Pattern ①: Chuỗi 5-Whys

```
5 WHYS: TẠI SAO CSS CÓ THỂ NGUY HIỂM?
═══════════════════════════════════════════════════════════════

  WHY ①: Tại sao CSS "đến mức nguy hiểm"?
  └→ Vì CSS có thể LƯU STATE (display: none, :checked,
     visibility, opacity — tất cả đều là state!)
     State bị PHÂN TÁN ở nhiều nơi → inconsistency!

  WHY ②: Tại sao state phân tán = thảm hoạ?
  └→ Vì cần cập nhật NHIỀU NƠI đồng thời khi thay đổi!
     JS data + CSS style + DOM attribute = 3 nơi!
     Quên 1 chỗ = giao diện không khớp data = BUG!
     Google Sheets × 1000 element = CƠN ÁC MỘNG!

  WHY ③: Tại sao CSS liên kết qua HTML?
  └→ Lịch sử! CSS sinh sau HTML 5 năm (1996 vs 1991!)
     HTML đã là "ngôn ngữ chính" → CSS phải "gắn vào"!
     Render-blocking vì cần CSSOM trước khi paint!

  WHY ④: Tại sao CSSOM có 2 phần?
  └→ Phần 1 (rules): quy tắc GỐC chưa áp dụng!
     Phần 2 (mirror tree): computed styles CUỐI CÙNG
     sau cascade + specificity + inheritance cho TỪNG
     element cụ thể! Hai vai trò KHÁC nhau!

  WHY ⑤: Tại sao không hợp nhất DOM và CSSOM?
  └→ Separation of Concerns! Tách biệt quan tâm!
     DOM = cấu trúc (CÁI GÌ hiện trên trang?)
     CSSOM = style (TRÔNG NHƯ THẾ NÀO?)
     Tách biệt = CÓ THỂ thay đổi style MÀ KHÔNG
     cần thay đổi cấu trúc, và ngược lại!
```

### 12.2 Pattern ②: First Principles

```
NGUYÊN LÝ NỀN TẢNG CỦA STYLING:
═══════════════════════════════════════════════════════════════

  ① CSS = KHAI BÁO (declarative), không phải mệnh lệnh!
     → Bạn NÓI "element này có font-size 18px"
     → Bạn KHÔNG NÓI "đi đến pixel (100,50), vẽ chữ
       cỡ 18px, rồi đi đến pixel (100,70), vẽ tiếp!"
     → Browser TỰ tính HOW! Bạn chỉ nói WHAT!

  ② Cascade = giải quyết xung đột nhiều nguồn style!
     → User agent < external < internal < inline < !important
     → Cùng tầng? → Specificity quyết!
     → Cùng specificity? → "Last one wins!"

  ③ DOM + CSSOM = render tree = pixel!
     → Hai mô hình tách biệt nhưng SONG SONG!
     → Kết hợp bởi layout engine!
     → Render tree ≠ DOM (loại display:none, thêm ::before!)

  ④ State KHÔNG NÊN ở CSS!
     → CSS CÓ THỂ lưu state (display, :checked, v.v.)
     → Nhưng KHÔNG NÊN! → Single source of truth = JS!
     → "State drives the UI. UI reflects state."
```

### 12.3 Pattern ③: Bản đồ luồng dữ liệu

```
BẢN ĐỒ — GOAL 1 HOÀN CHỈNH:
═══════════════════════════════════════════════════════════════

  HTML ────parse────▶ DOM (cấu trúc C++!)
                           │
                           │  Layout engine KẾT HỢP!
                           │
  CSS ────parse────▶ CSSOM (style C++!)
                           │
                           ▼
                    Render Tree
                    (cấu trúc + style, chỉ visible!)
                           │
                           ▼
                    Layout (tính toạ độ!)
                           │
                           ▼
                    Paint (tạo lệnh vẽ!)
                           │
                           ▼
                    Composite (layers + rasterize!)
                           │
                           ▼
                    Graphics Card (60fps!)
                           │
                           ▼
                    🖥️ PIXEL! ✅

  "GOAL ONE — DONE! 🎉"
  "But Goal Two... that's where problems BEGIN." 😈
```

---

## Self-Assessment Checklist

```
CHECKLIST — SAU KHI HỌC PHẦN 5:
═══════════════════════════════════════════════════════════════

  CSS:
  [ ] "Beautifully sophisticated — to a point of FAULT!"
  [ ] 7 khả năng: màu, kích thước, font, bố cục, animation,
      responsive, selector nâng cao!
  [ ] CSS CÓ THỂ lưu state (display:none, :checked, opacity!)
  [ ] State phân tán (JS + CSS + DOM) = cơn ác mộng!
  [ ] Single source of truth = giữ state CHỈ ở JavaScript!

  CASCADE:
  [ ] 5 tầng: user agent < external < internal < inline < !important
  [ ] "Last one wins" khi cùng tầng + cùng specificity!
  [ ] !important = "vũ khí hạt nhân" — chỉ dùng khi bất đắc dĩ!

  SPECIFICITY:
  [ ] (a, b, c) = ID, Class/Attr/Pseudo, Element!
  [ ] 1 ID > 1000 classes! So sánh theo CẤP, không cộng!
  [ ] "Specificity wars" = nguyên nhân "CSS is hard"!

  CSSOM:
  [ ] Phần 1: Danh sách quy tắc CSS (rules — chưa áp dụng!)
  [ ] Phần 2: Mirror tree + computed styles (ĐÃ áp dụng!)
  [ ] Inheritance: color, font-size kế thừa từ cha!

  CSS LIÊN KẾT QUA HTML:
  [ ] HTML 1991 → CSS 1996 = muộn 5 năm!
  [ ] 3 cách: external <link>, internal <style>, inline style!
  [ ] Render-blocking! Browser chờ CSS trước khi paint!
  [ ] FOUC = Flash of Unstyled Content nếu CSS chậm!
  [ ] Critical CSS = inline above-the-fold, async phần còn lại!

  RENDER TREE:
  [ ] DOM + CSSOM → render tree (chỉ visible elements!)
  [ ] display: none → KHÔNG trên render tree, KHÔNG chiếm chỗ!
  [ ] visibility: hidden → CÓ trên render tree, CÓ chiếm chỗ!
  [ ] opacity: 0 → CÓ trên render tree, VẪN tương tác được!
  [ ] ::before/::after → CÓ trên render tree, KHÔNG trên DOM!

  PIPELINE:
  [ ] 7 bước: HTML→DOM, CSS→CSSOM, Render Tree, Layout,
      Paint, Composite, Display!
  [ ] Reflow (layout lại) > Repaint (vẽ lại) > Composite only!
  [ ] 60fps = 16ms mỗi frame!

  SO SÁNH:
  [ ] Apple sở hữu toàn bộ stack → dễ hơn! → SwiftUI!
  [ ] Web = ad hoc 30 năm → framework = "moves, not truths!"
  [ ] Trade-off: universal ↔ complexity!

  GOAL 1 HOÀN THÀNH! ✅
  [ ] HTML + CSS + DOM + CSSOM + WebCore = hiển thị nội dung!
  [ ] "Goal one — DONE! Took about 20 minutes."

  TIẾP THEO → Phần 6: Enabling Change of Content!
  → "This is where the problems BEGIN." 😈
```
