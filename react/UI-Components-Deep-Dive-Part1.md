# UI Components Deep Dive — Phần 1: Accordion, Star Rating, Tabs

> 📅 2026-03-09 · ⏱ 45 phút đọc
>
> Chủ đề: Tự viết lại từ đầu — Accordion, Star Rating, Tabs
> Version: Vanilla JavaScript + React
> Không thư viện! Viết tay 100%!

---

## Mục Lục

| #   | Component   | Vanilla JS | React | Advanced Patterns | Web Component |
| --- | ----------- | ---------- | ----- | ----------------- | ------------- |
| 1   | Accordion   | §1.1       | §1.2  | §1.3              | §1.4          |
| 2   | Star Rating | §2.1       | §2.2  | §2.3              | §2.4          |
| 3   | Tabs        | §3.1       | §3.2  | §3.3              | §3.4          |

---

# 🎯 Component 1: Accordion

## Kiến Trúc Accordion

```
ACCORDION:
═══════════════════════════════════════════════════════════════

  ┌─────────────────────────────────────┐
  │ ▶ Section 1 Title                   │ ← header (clickable!)
  ├─────────────────────────────────────┤
  │ Content 1 (hidden!)                 │ ← panel (collapsed!)
  ├─────────────────────────────────────┤
  │ ▼ Section 2 Title                   │ ← header (active!)
  ├─────────────────────────────────────┤
  │ Content 2 visible!                  │ ← panel (expanded!)
  │ Lorem ipsum dolor sit amet...       │
  ├─────────────────────────────────────┤
  │ ▶ Section 3 Title                   │ ← header
  ├─────────────────────────────────────┤
  │ Content 3 (hidden!)                 │ ← panel (collapsed!)
  └─────────────────────────────────────┘

  Behavior:
  • Click header → toggle expand/collapse
  • Single mode: only 1 panel open at a time
  • Multi mode: multiple panels can be open
  • Smooth animation via max-height transition!
  • Accessibility: aria-expanded, aria-controls!
```

---

## §1.1 Accordion — Vanilla JavaScript

```html
<!-- ═══ HTML Structure ═══ -->
<div class="accordion" id="myAccordion">
  <div class="accordion-item">
    <button
      class="accordion-header"
      aria-expanded="false"
      aria-controls="panel-1"
      id="header-1"
    >
      <span>Section 1: Giới thiệu</span>
      <span class="accordion-icon">▶</span>
    </button>
    <div
      class="accordion-panel"
      id="panel-1"
      role="region"
      aria-labelledby="header-1"
    >
      <div class="accordion-content">
        Nội dung section 1. Lorem ipsum dolor sit amet, consectetur adipiscing
        elit.
      </div>
    </div>
  </div>
  <div class="accordion-item">
    <button
      class="accordion-header"
      aria-expanded="false"
      aria-controls="panel-2"
      id="header-2"
    >
      <span>Section 2: Cài đặt</span>
      <span class="accordion-icon">▶</span>
    </button>
    <div
      class="accordion-panel"
      id="panel-2"
      role="region"
      aria-labelledby="header-2"
    >
      <div class="accordion-content">
        Nội dung section 2. Hướng dẫn cài đặt chi tiết.
      </div>
    </div>
  </div>
  <div class="accordion-item">
    <button
      class="accordion-header"
      aria-expanded="false"
      aria-controls="panel-3"
      id="header-3"
    >
      <span>Section 3: Sử dụng</span>
      <span class="accordion-icon">▶</span>
    </button>
    <div
      class="accordion-panel"
      id="panel-3"
      role="region"
      aria-labelledby="header-3"
    >
      <div class="accordion-content">
        Nội dung section 3. Cách sử dụng component.
      </div>
    </div>
  </div>
</div>
```

```css
/* ═══ CSS ═══ */
.accordion {
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  overflow: hidden;
  font-family: system-ui, sans-serif;
}

.accordion-item + .accordion-item {
  border-top: 1px solid #e2e8f0;
}

.accordion-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
  padding: 16px 20px;
  border: none;
  background: #fff;
  cursor: pointer;
  font-size: 16px;
  font-weight: 600;
  color: #1a202c;
  text-align: left;
  transition: background-color 0.2s;
}

.accordion-header:hover {
  background: #f7fafc;
}

.accordion-header[aria-expanded="true"] {
  background: #edf2f7;
}

.accordion-icon {
  transition: transform 0.3s ease;
  font-size: 12px;
}

.accordion-header[aria-expanded="true"] .accordion-icon {
  transform: rotate(90deg);
}

.accordion-panel {
  max-height: 0;
  overflow: hidden;
  transition: max-height 0.35s ease;
}

.accordion-panel.open {
  /* max-height set bằng JS dựa trên scrollHeight! */
}

.accordion-content {
  padding: 16px 20px;
  color: #4a5568;
  line-height: 1.6;
}
```

```javascript
// ═══ Vanilla JS Accordion ═══

class Accordion {
  constructor(container, options = {}) {
    this.container =
      typeof container === "string"
        ? document.querySelector(container)
        : container;

    this.options = {
      singleOpen: true, // chỉ 1 panel mở cùng lúc?
      animationDuration: 350, // ms
      ...options,
    };

    this.items = [];
    this._init();
  }

  _init() {
    const headers = this.container.querySelectorAll(".accordion-header");

    headers.forEach((header, index) => {
      const panel = header.nextElementSibling;
      this.items.push({ header, panel, isOpen: false });

      // Click handler:
      header.addEventListener("click", () => this.toggle(index));

      // Keyboard: Enter/Space để toggle!
      header.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          this.toggle(index);
        }
        // Arrow keys để navigate giữa headers!
        if (e.key === "ArrowDown") {
          e.preventDefault();
          const next = (index + 1) % headers.length;
          headers[next].focus();
        }
        if (e.key === "ArrowUp") {
          e.preventDefault();
          const prev = (index - 1 + headers.length) % headers.length;
          headers[prev].focus();
        }
      });
    });
  }

  toggle(index) {
    const item = this.items[index];
    if (item.isOpen) {
      this._close(index);
    } else {
      // Single mode: đóng tất cả trước!
      if (this.options.singleOpen) {
        this.items.forEach((_, i) => {
          if (i !== index && this.items[i].isOpen) {
            this._close(i);
          }
        });
      }
      this._open(index);
    }
  }

  _open(index) {
    const { header, panel } = this.items[index];
    this.items[index].isOpen = true;

    header.setAttribute("aria-expanded", "true");
    panel.classList.add("open");
    // Tính max-height từ scrollHeight!
    panel.style.maxHeight = panel.scrollHeight + "px";
  }

  _close(index) {
    const { header, panel } = this.items[index];
    this.items[index].isOpen = false;

    header.setAttribute("aria-expanded", "false");
    panel.style.maxHeight = "0";
    panel.classList.remove("open");
  }

  openAll() {
    this.items.forEach((_, i) => this._open(i));
  }

  closeAll() {
    this.items.forEach((_, i) => this._close(i));
  }

  destroy() {
    // Cleanup: remove event listeners!
    this.items.forEach(({ header }) => {
      header.replaceWith(header.cloneNode(true));
    });
  }
}

// Usage:
const accordion = new Accordion("#myAccordion", {
  singleOpen: true,
});
```

---

### 📖 Giải thích code Accordion từng phần

#### 1. Tại sao dùng `class`?

```javascript
class Accordion { ... }
```

`class` là cách **gom tất cả logic liên quan vào 1 chỗ**. Thay vì viết 10 function rời rạc, `class` gói gọn:

```javascript
// ❌ KHÔNG DÙNG CLASS — functions rời rạc, khó quản lý:
let container, items, options;

function initAccordion() { ... }
function toggleAccordion() { ... }
function openAccordion() { ... }
function closeAccordion() { ... }
function destroyAccordion() { ... }
// → 5 functions + 3 biến global → lộn xộn!
// → Nếu có 2 accordion trên page → biến bị đè nhau!

// ✅ DÙNG CLASS — gọn, mỗi instance riêng biệt:
const acc1 = new Accordion('#accordion1');
const acc2 = new Accordion('#accordion2');
// → Mỗi cái có state riêng, không đè nhau!
```

#### 2. `constructor(container, options = {})` — Tại sao 2 tham số?

```javascript
constructor(container, options = {}) {
```

`constructor` là hàm **chạy TỰ ĐỘNG khi bạn gọi `new Accordion(...)`**. 2 tham số:

- **`container`** — Nói cho Accordion biết nó nằm Ở ĐÂU trên trang:

  ```javascript
  new Accordion("#myAccordion"); // container = '#myAccordion'
  // → "Hãy tìm element có id='myAccordion' và biến nó thành accordion!"
  ```

- **`options = {}`** — Tuỳ chọn cấu hình. `= {}` nghĩa là **mặc định là object rỗng**:

  ```javascript
  // Không truyền options → dùng mặc định:
  new Accordion("#acc");
  // options = {} → singleOpen = true (mặc định trong code)

  // Truyền options → ghi đè mặc định:
  new Accordion("#acc", { singleOpen: false });
  // options = { singleOpen: false } → cho phép mở nhiều panel
  ```

Bên trong constructor:

```javascript
// container có thể là string hoặc element:
this.container =
  typeof container === "string"
    ? document.querySelector(container) // string → tìm element!
    : container; // đã là element → dùng luôn!

// Merge options: mặc định + user override:
this.options = {
  singleOpen: true, // mặc định!
  animationDuration: 350,
  ...options, // user truyền gì → ghi đè!
};
// VD: options = { singleOpen: false }
// → kết quả: { singleOpen: false, animationDuration: 350 }
// (singleOpen bị ghi đè từ true → false!)
```

#### 3. `nextElementSibling` là gì?

```javascript
const panel = header.nextElementSibling;
```

`nextElementSibling` = **element NGAY SAU** element hiện tại trong HTML. Nhìn lại HTML:

```html
<div class="accordion-item">
  <button class="accordion-header">...</button> ← header (đây!)
  <div class="accordion-panel">...</div>
  ← panel (ngay sau!)
</div>
```

`header.nextElementSibling` = element ngay sau `header` = `panel`!

```
Hình dung DOM tree:

accordion-item
  ├── button.accordion-header     ← header
  │     ↓ nextElementSibling
  └── div.accordion-panel         ← panel (em kế tiếp!)

Tương tự:
  nextElementSibling = em/chị NGAY SAU trong cùng parent
  previousElementSibling = anh/chị NGAY TRƯỚC
  parentElement = cha/mẹ
  children = con

Khác biệt với nextSibling:
  nextSibling         = node tiếp theo (kể cả text, comment!)
  nextElementSibling  = ELEMENT tiếp theo (bỏ qua text, comment!)
```

#### 4. `preventDefault()` — Nếu không dùng thì sao?

```javascript
if (e.key === "Enter" || e.key === " ") {
  e.preventDefault(); // ← cái này!
  this.toggle(index);
}
```

`preventDefault()` = **chặn hành vi mặc định** của browser. Nếu KHÔNG dùng:

```
PHÍM SPACE trên <button>:
  Hành vi mặc định: browser TỰ ĐỘNG click button!
  → toggle() chạy 2 LẦN (1 từ code + 1 từ browser)!
  → Kết quả: mở rồi đóng ngay = như không click!

  Ngoài ra: Space key scroll page xuống!
  → User nhấn Space → page cuộn → UX tệ!

  e.preventDefault() → chặn hết hành vi mặc định!
  → toggle() chạy ĐÚNG 1 LẦN!
  → Page KHÔNG cuộn!

PHÍM ARROWDOWN:
  Hành vi mặc định: scroll page xuống!
  → User muốn navigate giữa headers, KHÔNG phải scroll page!
  e.preventDefault() → chặn scroll, chỉ focus header tiếp theo!

PHÍM ARROWUP:
  Tương tự: chặn scroll lên!
```

```javascript
// Tóm tắt:
e.preventDefault();
// = "Browser, ĐỪNG làm gì mặc định! Để TÔI xử lý!"
// Không dùng → browser xử lý + code xử lý = conflict!
```

#### 5. Arrow keys — Tại sao tính `(index + 1) % headers.length`?

```javascript
if (e.key === "ArrowDown") {
  const next = (index + 1) % headers.length;
  headers[next].focus();
}
if (e.key === "ArrowUp") {
  const prev = (index - 1 + headers.length) % headers.length;
  headers[prev].focus();
}
```

Đây là **circular navigation** (vòng tròn). Giả sử có 3 headers (index 0, 1, 2):

```
ArrowDown — đi XUỐNG:
═══════════════════════
  (index + 1) % 3

  Đang ở 0: (0 + 1) % 3 = 1 % 3 = 1  ✅ xuống 1
  Đang ở 1: (1 + 1) % 3 = 2 % 3 = 2  ✅ xuống 2
  Đang ở 2: (2 + 1) % 3 = 3 % 3 = 0  ✅ QUAY LẠI ĐẦU!
  (không bị out of bounds!)

  % (modulo) = phép chia lấy DƯ:
  3 % 3 = 0  (3 ÷ 3 = 1 dư 0)
  4 % 3 = 1  (4 ÷ 3 = 1 dư 1)

ArrowUp — đi LÊN:
═══════════════════════
  (index - 1 + 3) % 3

  Tại sao + 3 trước? Vì nếu không:
  Đang ở 0: (0 - 1) % 3 = (-1) % 3 = -1  ❌ index âm!

  Thêm + 3:
  Đang ở 0: (0 - 1 + 3) % 3 = 2 % 3 = 2  ✅ QUAY VỀ CUỐI!
  Đang ở 1: (1 - 1 + 3) % 3 = 3 % 3 = 0  ✅ lên 0
  Đang ở 2: (2 - 1 + 3) % 3 = 4 % 3 = 1  ✅ lên 1

Hình dung vòng tròn:

      [0] Header 1
     ↗               ↘
   [2] Header 3 ← → [1] Header 2

  ArrowDown: đi theo chiều kim đồng hồ
  ArrowUp: đi ngược chiều kim đồng hồ
  Không bao giờ bị "out of bounds"!
```

#### 6. Single-open logic — `if (i !== index && this.items[i].isOpen)`

```javascript
if (this.options.singleOpen) {
  this.items.forEach((_, i) => {
    if (i !== index && this.items[i].isOpen) {
      this._close(i);
    }
  });
}
this._open(index);
```

Logic: **"Trước khi mở panel mới, ĐÓNG tất cả panel đang mở (trừ panel sắp mở)."**

```
Giả sử 3 panels, panel 1 đang mở, user click panel 2:

  index = 2  (panel mà user vừa click!)

  Duyệt qua tất cả items:
  i=0: i !== 2? YES. items[0].isOpen? NO  → bỏ qua!
  i=1: i !== 2? YES. items[1].isOpen? YES → ĐÓNG panel 1! ✅
  i=2: i !== 2? NO  → bỏ qua! (đây là panel sắp mở, đừng đóng!)

  Sau đó: this._open(2)  → mở panel 2!

  Kết quả: panel 1 đóng, panel 2 mở!
  = Chỉ 1 panel mở cùng lúc! (single-open mode!)

  Tại sao check "i !== index"?
  → Nếu không: ta đóng panel 2 TRƯỚC rồi mở panel 2 → animation lỗi!
  → Nên bỏ qua panel sắp mở, chỉ đóng các panel KHÁC!
```

#### 7. `scrollHeight` là gì?

_Xem phần Deep Dive bên dưới đã giải thích rất chi tiết (trong RADIO section)._ Tóm tắt:

```javascript
panel.style.maxHeight = panel.scrollHeight + "px";
```

`scrollHeight` = **JavaScript property** (không phải CSS!). Browser tự đo **chiều cao THẬT** của toàn bộ content bên trong element, kể cả phần bị ẩn bởi `overflow: hidden`.

```
<div style="max-height: 0; overflow: hidden;">
  <p>Paragraph 1</p>          ← bị ẩn!
  <p>Paragraph 2</p>          ← bị ẩn!
  <p>Paragraph 3</p>          ← bị ẩn!
</div>                     tổng content = 137px

div.scrollHeight = 137    ← JS đọc được dù content bị ẩn!
→ set max-height = 137px  → CSS animate 0 → 137px → nội dung hiện ra!
```

#### 8. `aria-expanded` — Ý nghĩa?

```javascript
header.setAttribute("aria-expanded", "true"); // khi mở
header.setAttribute("aria-expanded", "false"); // khi đóng
```

`aria-expanded` là **thuộc tính accessibility** cho **screen reader** (phần mềm đọc màn hình cho người khiếm thị):

```
Không có aria-expanded:
  Screen reader đọc: "Section 1, button"
  → Người dùng: "Nó có mở hay đóng? Tôi không biết!"

Có aria-expanded="true":
  Screen reader đọc: "Section 1, button, expanded"
  → Người dùng: "À, nó đang MỞ!"

Có aria-expanded="false":
  Screen reader đọc: "Section 1, button, collapsed"
  → Người dùng: "Nó đang ĐÓNG, nhấn Enter để mở!"
```

CSS cũng dùng `aria-expanded` để style:

```css
.accordion-header[aria-expanded="true"] {
  background: #edf2f7; /* header đang mở = nền xám! */
}
.accordion-header[aria-expanded="true"] .accordion-icon {
  transform: rotate(90deg); /* icon xoay 90° khi mở! */
}
```

→ Một thuộc tính dùng cho CẢ accessibility VÀ styling!

#### 9. `replaceWith` và `cloneNode` — Trick xoá event listeners!

```javascript
destroy() {
  this.items.forEach(({ header }) => {
    header.replaceWith(header.cloneNode(true));
  });
}
```

Đây là trick **remove ALL event listeners** khỏi element:

```
Vấn đề: header có addEventListener('click', ...) và addEventListener('keydown', ...)
→ Muốn xoá tất cả, nhưng không nhớ (hoặc không lưu) reference handlers!

removeEventListener(type, handler)
→ Cần truyền CHÍNH XÁC function đã dùng trong addEventListener!
→ Nếu dùng arrow function ẩn danh → KHÔNG thể remove!

Trick:
1. cloneNode(true) = tạo BẢN SAO element (copy HTML + children)
   → BẢN SAO KHÔNG CÓ event listeners! (chỉ copy HTML, không copy JS!)

2. replaceWith() = thay thế element GỐC bằng bản sao!
   → Element gốc (có listeners) bị remove khỏi DOM!
   → Bản sao (không listeners) thay thế!
```

```javascript
// Hình dung:

// TRƯỚC destroy():
// <button class="accordion-header">  ← GỐC, có click + keydown listeners!

header.cloneNode(true);
// → Tạo: <button class="accordion-header">  ← BẢN SAO, KHÔNG có listeners!
// cloneNode(true) = copy element + TẤT CẢ children
// cloneNode(false) = copy element ONLY, không copy children

header.replaceWith(header.cloneNode(true));
// → DOM: bản sao thay thế bản gốc!
// → Bản gốc bị garbage collected (kèm listeners)!
// → Kết quả: element trông GIỐNG HỆT nhưng "sạch" listeners!

// SAU destroy():
// <button class="accordion-header">  ← BẢN SAO, sạch sẽ, không listeners!
```

---

### 📖 Accordion I → II → III — Tiến trình xây dựng

> Giống như Tabs, Accordion cũng được xây dựng qua 3 tầng:
> - **Accordion I**: Functionality cơ bản — click toggle, sections độc lập!
> - **Accordion II**: Accessibility — ARIA roles, states, properties!
> - **Accordion III**: Keyboard interactions — Enter/Space, Arrow keys, Home/End!

---

### 🔹 Accordion I — Functionality Cơ Bản

#### Yêu cầu

```
ACCORDION I — YÊU CẦU:
═══════════════════════════════════════════════════════════════

  1. Mặc định: TẤT CẢ sections đều collapsed (ẩn)!
  2. Click vào title → TOGGLE content:
     • Nếu collapsed → expanded (hiện content!)
     • Nếu expanded → collapsed (ẩn content!)
  3. Các sections ĐỘC LẬP: mở/đóng 1 section
     KHÔNG ảnh hưởng sections khác!
  4. Focus vào functionality, KHÔNG cần CSS phức tạp!
```

#### Phân tích: accordion vs tabs

```
ACCORDION vs TABS — KHÁC NHAU Ở ĐÂU:
═══════════════════════════════════════════════════════════════

  TABS:
  → Chỉ 1 panel hiển thị tại một thời điểm!
  → Chọn tab A → tab B tự đóng!
  → EXCLUSIVE: mutually exclusive!

  ACCORDION (multi mode):
  → NHIỀU sections có thể mở cùng lúc!
  → Mở section A → section B VẪN mở!
  → INDEPENDENT: các sections độc lập!

  ACCORDION (single mode):
  → Giống tabs: chỉ 1 section mở!
  → Mở A → B tự đóng!
  → Accordion I yêu cầu MULTI mode (independent)!
```

#### Code tối giản — Accordion I

```javascript
// ═══ Accordion I — Phiên bản tối giản ═══
// Chỉ cần: headers, panels, toggle mỗi cái RIÊNG!

function initAccordion(container) {
  const headers = container.querySelectorAll('.accordion-header');

  headers.forEach((header) => {
    const panel = header.nextElementSibling;
    panel.style.display = 'none'; // mặc định: ẩn!

    header.addEventListener('click', () => {
      // Toggle: nếu đang ẩn → hiện, nếu đang hiện → ẩn!
      const isHidden = panel.style.display === 'none';
      panel.style.display = isHidden ? 'block' : 'none';

      // Visual: xoay chevron!
      const icon = header.querySelector('.accordion-icon');
      if (icon) icon.textContent = isHidden ? '▼' : '▶';
    });
  });
}
```

Nhận xét: Accordion I **đơn giản hơn Tabs I** vì không cần track "active index" — mỗi section **tự quản lý** expand/collapse. Không có khái niệm "active" duy nhất.

#### UX Improvements — Điểm cộng trong phỏng vấn!

```
UX CẢI THIỆN (BONUS POINTS!):
═══════════════════════════════════════════════════════════════

  1. Smooth animation thay vì nhảy cóc!
     → max-height + transition (đã giải thích ở Deep Dive!)
     → KHÔNG dùng display:none (không animate được!)

  2. Chevron icon xoay 90° khi expand!
     → CSS transform: rotate(90deg) + transition!
     → Visual feedback cho user biết state!

  3. Hover effect trên header!
     → background-color thay đổi khi hover!
     → Cho user biết "cái này clickable!"

  4. Single-open mode (optional)!
     → Click section A → đóng section B!
     → Phù hợp cho FAQ, nav menus!

  5. Deep link!
     → URL hash: /page#section-2 → auto-expand section 2!
```

---

### 🔹 Accordion II — ARIA Accessibility

#### Yêu cầu — WAI-ARIA Accordion Pattern

> Accordion II nâng cấp từ Accordion I: thêm ARIA roles, states, properties cho screen readers.

```
ACCORDION II — ARIA REQUIREMENTS:
═══════════════════════════════════════════════════════════════

  1. Title mỗi header nằm trong <button> element!
  2. Header button có aria-expanded:
     → Panel visible: aria-expanded="true"
     → Panel hidden: aria-expanded="false"
  3. Header button có aria-controls = ID của panel!
  4. Mỗi panel container có:
     → role="region"
     → aria-labelledby = ID của button header!
```

#### Giải thích từng ARIA attribute

##### `<button>` — Tại sao bắt buộc?

```
TẠI SAO HEADER PHẢI LÀ <BUTTON>:
═══════════════════════════════════════════════════════════════

  <h3 class="accordion-header">Section 1</h3>
  ❌ <h3> KHÔNG focusable bằng Tab key!
  ❌ KHÔNG respond Enter/Space!
  ❌ Screen reader: "heading level 3" — không biết clickable!

  <button class="accordion-header">Section 1</button>
  ✅ Focusable bằng Tab key!
  ✅ Enter/Space trigger click tự động!
  ✅ Screen reader: "Section 1, button" — biết interactive!

  Best practice: <h3> wrap <button>:
  <h3>
    <button class="accordion-header"
      aria-expanded="false"
      aria-controls="panel-1">
      Section 1
    </button>
  </h3>
  → Heading structure (cho SEO + outline!)
  → Button bên trong (cho interaction + a11y!)
```

##### `aria-expanded` — "Đang mở hay đóng?"

```
aria-expanded — SO SÁNH VỚI aria-selected (Tabs):
═══════════════════════════════════════════════════════════════

  ACCORDION: aria-expanded
  → "Panel này đang MỞ hay ĐÓNG?"
  → true = content ĐANG HIỆN!
  → false = content ĐANG ẨN!
  → Screen reader: "Section 1, button, expanded"
                 or "Section 1, button, collapsed"

  TABS: aria-selected
  → "Tab này ĐANG ĐƯỢC CHỌN hay không?"
  → true = tab này ACTIVE!
  → false = tab này INACTIVE!

  TẠI SAO KHÁC NHAU?
  → Accordion: sections MỞ/ĐÓNG (reveal/hide!)
  → Tabs: tab CHỌN/KHÔNG CHỌN (pick 1 of many!)
  → Semantic khác nhau dù UI tương tự!
```

##### `aria-controls` + `aria-labelledby` — Liên kết hai chiều

```
LIÊN KẾT HAI CHIỀU — header ↔ panel:
═══════════════════════════════════════════════════════════════

  Header → Panel:  aria-controls="panel-1"
  Panel → Header:  aria-labelledby="header-1"

  ┌─────────────────────────────────────────┐
  │  button#header-1                        │
  │  aria-expanded="true"                   │
  │  aria-controls="panel-1" ─────────┐     │
  └───────────────────────────────────│─────┘
                                      │
  ┌───────────────────────────────────│─────┐
  │  div#panel-1                      │     │
  │  role="region"                    │     │
  │  aria-labelledby="header-1" ──────┘     │
  │  Content for Section 1                  │
  └─────────────────────────────────────────┘

  → Header biết panel nào: aria-controls!
  → Panel biết header nào: aria-labelledby!
  → Screen reader: "Region, labelled by Section 1"
```

##### `role="region"` — Tại sao panel cần role?

```
role="region" — LANDMARK:
═══════════════════════════════════════════════════════════════

  KHÔNG CÓ role:
  <div id="panel-1">Content...</div>
  → Screen reader: "group" hoặc chỉ đọc content!
  → Không biết đây là "vùng nội dung" riêng biệt!

  CÓ role="region":
  <div id="panel-1" role="region" aria-labelledby="header-1">
    Content...
  </div>
  → Screen reader: "Section 1 region, Content..."
  → User biết: "đây là vùng nội dung CỦA Section 1!"

  region = ARIA landmark!
  → Screen reader liệt kê landmarks trên page!
  → User nhảy nhanh giữa các regions!
  → PHẢI có aria-labelledby hoặc aria-label kèm theo!
    (region không có label → cảnh báo a11y!)
```

#### Code — Accordion II (ARIA hoàn chỉnh)

```html
<!-- Accordion II — HTML chuẩn ARIA -->
<div class="accordion">
  <div class="accordion-item">
    <h3>
      <button
        class="accordion-header"
        aria-expanded="false"
        aria-controls="panel-1"
        id="header-1"
      >
        <span>Section 1: Giới thiệu</span>
        <span class="accordion-icon">▶</span>
      </button>
    </h3>
    <div
      class="accordion-panel"
      id="panel-1"
      role="region"
      aria-labelledby="header-1"
      hidden
    >
      <div class="accordion-content">
        Nội dung section 1...
      </div>
    </div>
  </div>
</div>
```

```javascript
// Accordion II — Toggle với ARIA!
function toggle(header, panel) {
  const isExpanded = header.getAttribute('aria-expanded') === 'true';

  // Toggle aria-expanded!
  header.setAttribute('aria-expanded', String(!isExpanded));

  // Toggle panel visibility!
  panel.hidden = isExpanded; // hidden attribute!
  // hidden = true → ẩn khỏi DOM + screen reader!
  // hidden = false → hiện!
}
```

Mỗi lần toggle:
- `aria-expanded` flip: `"true"` ↔ `"false"`
- `hidden` attribute flip: có ↔ không
- Screen reader đọc state MỚI ngay lập tức!

---

### 🔹 Accordion III — Keyboard Interactions

#### Yêu cầu keyboard

> Accordion III thêm keyboard interactions nâng cao. **Khác với Tabs**: accordion có Enter/Space toggle (không chỉ focus), và Tab key hoạt động bình thường (không skip!).

```
ACCORDION III — KEYBOARD REQUIREMENTS:
═══════════════════════════════════════════════════════════════

  ENTER / SPACE (khi focus ở header button):
  → Panel collapsed → EXPAND!
  → Panel expanded → COLLAPSE!
  → Giống click! (button đã handle tự động!)

  TAB / SHIFT+TAB:
  → Hoạt động BÌNH THƯỜNG!
  → Di chuyển focus qua TẤT CẢ focusable elements!
  → KHÔNG skip! (khác tabs: tabs dùng roving tabindex!)
  → Content trong expanded panel CŨNG focusable!

  ARROW DOWN (khi focus ở header):
  → Focus đến header TIẾP THEO!
  → Ở header cuối → KHÔNG di chuyển (hoặc wrap về đầu)!

  ARROW UP (khi focus ở header):
  → Focus đến header TRƯỚC ĐÓ!
  → Ở header đầu → KHÔNG di chuyển (hoặc wrap về cuối)!

  HOME (khi focus ở header):
  → Focus đến header ĐẦU TIÊN!

  END (khi focus ở header):
  → Focus đến header CUỐI CÙNG!
```

#### Accordion vs Tabs — Khác biệt keyboard!

```
KEYBOARD — ACCORDION vs TABS:
═══════════════════════════════════════════════════════════════

  Feature         │ Accordion            │ Tabs
  ────────────────┼──────────────────────┼────────────────────
  Enter/Space     │ Toggle expand/       │ Activate tab
                  │ collapse!            │ (nếu manual mode!)
  Tab key         │ BÌNH THƯỜNG!         │ Roving tabindex!
                  │ Focus mọi element!   │ Skip inactive tabs!
  Arrow keys      │ CHỈNH giữa headers! │ Switch tabs + chuyển
                  │ KHÔNG toggle!        │ ACTIVATE!
  Wrap cuối→đầu   │ TÙY CHỌN!           │ BẮT BUỘC!

  TẠI SAO KHÁC?
  → Tabs: chỉ 1 active → roving tabindex tối ưu!
  → Accordion: nhiều mở cùng lúc → Tab key phải
    đi qua CONTENT bên trong expanded panels!
  → Arrow keys trong accordion: CHỈ di chuyển focus
    giữa headers, KHÔNG toggle expand/collapse!
```

#### Code keyboard handler — Accordion III

```javascript
// ═══ Accordion III — Keyboard Handler ═══

const headers = container.querySelectorAll('.accordion-header');

headers.forEach((header, index) => {
  header.addEventListener('keydown', (e) => {
    let targetIndex = -1; // -1 = không di chuyển!

    switch (e.key) {
      case 'ArrowDown':
        // Header tiếp theo! (không wrap hoặc wrap tuỳ chọn)
        if (index < headers.length - 1) {
          targetIndex = index + 1;
        }
        // Nếu muốn wrap: targetIndex = (index + 1) % headers.length;
        break;

      case 'ArrowUp':
        // Header trước đó!
        if (index > 0) {
          targetIndex = index - 1;
        }
        // Nếu muốn wrap:
        // targetIndex = (index - 1 + headers.length) % headers.length;
        break;

      case 'Home':
        targetIndex = 0; // Header đầu tiên!
        break;

      case 'End':
        targetIndex = headers.length - 1; // Header cuối!
        break;

      default:
        return; // Enter/Space: button đã handle click event!
                // Tab/Shift+Tab: để browser handle bình thường!
    }

    if (targetIndex >= 0) {
      e.preventDefault(); // Chặn Arrow scroll page!
      headers[targetIndex].focus(); // Di chuyển focus!
      // CHÚ Ý: KHÔNG toggle! Chỉ FOCUS!
      // Toggle chỉ xảy ra khi Enter/Space hoặc click!
    }
  });
});
```

```
FOCUS vs TOGGLE — KHÁC NHAU:
═══════════════════════════════════════════════════════════════

  Arrow keys: FOCUS (di chuyển focus đến header khác!)
  → KHÔNG mở/đóng section!
  → Chỉ "nhìn vào" header khác!

  Enter/Space: TOGGLE (mở/đóng section!)
  → Expand nếu collapsed, collapse nếu expanded!

  Click: TOGGLE (giống Enter/Space!)

  Tab: FOCUS (di chuyển đến element focusable tiếp theo!)
  → Bao gồm: headers, links trong content, inputs...
  → KHÔNG skip content! (khác Tabs!)

  Ví dụ flow:
  1. Tab → focus Header 1
  2. Enter → expand Section 1 (content hiện!)
  3. Tab → focus link trong content Section 1
  4. Tab → focus Header 2
  5. ArrowDown → focus Header 3 (không toggle!)
  6. Enter → expand Section 3!
  7. Home → focus Header 1 (top!)
```

#### Tại sao Enter/Space không cần code riêng?

```
ENTER/SPACE — TẠI SAO KHÔNG THẤY TRONG SWITCH:
═══════════════════════════════════════════════════════════════

  switch (e.key) {
    case 'ArrowDown': ... break;
    case 'ArrowUp':   ... break;
    case 'Home':      ... break;
    case 'End':       ... break;
    default: return;  ← Enter/Space ĐI QUA ĐÂY!
  }

  Tại sao? Vì header là <BUTTON>!
  → Browser TỰ ĐỘNG handle Enter/Space cho <button>!
  → Enter → fire click event!
  → Space → fire click event!
  → Click event → toggle function (đã gắn sẵn!)
  → KHÔNG cần code thêm!

  Nếu header là <div> thay vì <button>:
  → PHẢI thêm case 'Enter' và case ' ' (Space)!
  → PHẢI gọi toggle() thủ công!
  → THÊM code không cần thiết!
  → → ĐÓ LÀ LÝ DO dùng <button>!!! 🎯
```

#### Tổng kết: Accordion I → II → III

```
ACCORDION I → II → III — PROGRESSION:
═══════════════════════════════════════════════════════════════

  ACCORDION I (Functionality):
  ✅ Click header → toggle content!
  ✅ Sections INDEPENDENT (multi mode)!
  ✅ Chevron icon xoay khi expand!
  ❌ Screen reader không hiểu state!
  ❌ Keyboard chỉ có Tab + click!

  ACCORDION II (Accessibility): I +
  ✅ <button> trong header!
  ✅ aria-expanded="true"/"false"!
  ✅ aria-controls liên kết header → panel!
  ✅ role="region" + aria-labelledby trên panel!
  ✅ Screen reader ĐỌC ĐƯỢC state!
  ❌ Arrow keys chưa hoạt động!

  ACCORDION III (Keyboard): II +
  ✅ ArrowDown/Up: navigate giữa headers!
  ✅ Home/End: đầu/cuối!
  ✅ Enter/Space: toggle (button handle tự động!)
  ✅ Tab/Shift+Tab: bình thường (focus mọi element!)
  ✅ HOÀN CHỈNH! Production-ready! 🎯

  → §1.1 code phía trên = ACCORDION III (đầy đủ nhất!)
  → Bao gồm: click + ARIA + keyboard!
```

---

## §1.2 Accordion — React

```javascript
// ═══ React Accordion ═══
import { useState, useRef, useEffect, useCallback } from "react";

// Hook tự viết: quản lý accordion state!
function useAccordion(itemCount, singleOpen = true) {
  const [openItems, setOpenItems] = useState(new Set());

  const toggle = useCallback(
    (index) => {
      setOpenItems((prev) => {
        const next = new Set(prev);
        if (next.has(index)) {
          next.delete(index);
        } else {
          if (singleOpen) next.clear(); // single mode!
          next.add(index);
        }
        return next;
      });
    },
    [singleOpen],
  );

  const isOpen = useCallback(
    (index) => {
      return openItems.has(index);
    },
    [openItems],
  );

  return { toggle, isOpen };
}

// AccordionPanel: animated panel!
function AccordionPanel({ isOpen, children }) {
  const contentRef = useRef(null);
  const [maxHeight, setMaxHeight] = useState(0);

  useEffect(() => {
    if (isOpen && contentRef.current) {
      setMaxHeight(contentRef.current.scrollHeight);
    } else {
      setMaxHeight(0);
    }
  }, [isOpen]);

  return (
    <div
      style={{
        maxHeight: `${maxHeight}px`,
        overflow: "hidden",
        transition: "max-height 0.35s ease",
      }}
    >
      <div ref={contentRef} style={{ padding: "16px 20px" }}>
        {children}
      </div>
    </div>
  );
}

// AccordionItem:
function AccordionItem({ title, isOpen, onToggle, children, id }) {
  return (
    <div style={{ borderTop: "1px solid #e2e8f0" }}>
      <button
        onClick={onToggle}
        aria-expanded={isOpen}
        aria-controls={`panel-${id}`}
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          width: "100%",
          padding: "16px 20px",
          border: "none",
          background: isOpen ? "#edf2f7" : "#fff",
          cursor: "pointer",
          fontSize: "16px",
          fontWeight: 600,
        }}
      >
        <span>{title}</span>
        <span
          style={{
            transform: isOpen ? "rotate(90deg)" : "rotate(0)",
            transition: "transform 0.3s",
            fontSize: "12px",
          }}
        >
          ▶
        </span>
      </button>
      <AccordionPanel isOpen={isOpen}>{children}</AccordionPanel>
    </div>
  );
}

// Main Accordion:
function Accordion({ items, singleOpen = true }) {
  const { toggle, isOpen } = useAccordion(items.length, singleOpen);

  return (
    <div
      style={{
        border: "1px solid #e2e8f0",
        borderRadius: "8px",
        overflow: "hidden",
      }}
    >
      {items.map((item, index) => (
        <AccordionItem
          key={index}
          id={index}
          title={item.title}
          isOpen={isOpen(index)}
          onToggle={() => toggle(index)}
        >
          {item.content}
        </AccordionItem>
      ))}
    </div>
  );
}

// Usage:
// <Accordion items={[
//   { title: 'Section 1', content: 'Content 1...' },
//   { title: 'Section 2', content: 'Content 2...' },
// ]} singleOpen={true} />
```

---

### §1.3 Advanced React Patterns — Accordion

```javascript
// ═══ PATTERN 1: Compound Components ═══
// Cho phép user compose accordion linh hoạt hơn!

const AccordionContext = React.createContext(null);

function AccordionRoot({ children, singleOpen = true }) {
  const [openItems, setOpenItems] = useState(new Set());

  const toggle = useCallback((id) => {
    setOpenItems(prev => {
      const next = new Set(prev);
      if (next.has(id)) { next.delete(id); }
      else {
        if (singleOpen) next.clear();
        next.add(id);
      }
      return next;
    });
  }, [singleOpen]);

  return (
    <AccordionContext.Provider value={{ openItems, toggle }}>
      <div style={{ border: '1px solid #e2e8f0', borderRadius: '8px' }}>
        {children}
      </div>
    </AccordionContext.Provider>
  );
}

function AccordionItem({ id, children }) {
  const { openItems } = useContext(AccordionContext);
  const isOpen = openItems.has(id);

  return (
    <div data-open={isOpen}>{children}</div>
  );
}

function AccordionTrigger({ id, children }) {
  const { openItems, toggle } = useContext(AccordionContext);
  return (
    <button onClick={() => toggle(id)}
      aria-expanded={openItems.has(id)}>
      {children}
    </button>
  );
}

function AccordionContent({ id, children }) {
  const { openItems } = useContext(AccordionContext);
  if (!openItems.has(id)) return null;
  return <div role="region">{children}</div>;
}

// Usage (Compound Components):
// <AccordionRoot singleOpen>
//   <AccordionItem id="1">
//     <AccordionTrigger id="1">Section 1</AccordionTrigger>
//     <AccordionContent id="1">Content 1</AccordionContent>
//   </AccordionItem>
//   <AccordionItem id="2">
//     <AccordionTrigger id="2">Section 2</AccordionTrigger>
//     <AccordionContent id="2">
//       <CustomComponent /> {/* Bất kỳ JSX nào! */}
//     </AccordionContent>
//   </AccordionItem>
// </AccordionRoot>

// ═══ PATTERN 2: Controlled vs Uncontrolled ═══
// Component có thể tự quản lý state HOẶC nhận state từ parent!

function ControlledAccordion({
  openItems,        // controlled: parent quản lý!
  onToggle,         // callback khi toggle!
  defaultOpen = [], // uncontrolled: initial state!
  singleOpen = true,
  items,
}) {
  // Internal state (uncontrolled mode):
  const [internalOpen, setInternalOpen] = useState(new Set(defaultOpen));

  // Determine nếu controlled hay uncontrolled:
  const isControlled = openItems !== undefined;
  const currentOpen = isControlled ? new Set(openItems) : internalOpen;

  const handleToggle = (index) => {
    if (isControlled) {
      onToggle?.(index); // parent xử lý!
    } else {
      setInternalOpen(prev => {
        const next = new Set(prev);
        if (next.has(index)) next.delete(index);
        else { if (singleOpen) next.clear(); next.add(index); }
        return next;
      });
    }
  };

  return items.map((item, i) => (/* render */))
}

// Uncontrolled: <Accordion items={items} />
// Controlled:   <Accordion items={items} openItems={[0,2]} onToggle={fn} />

// ═══ PATTERN 3: useReducer cho State Phức Tạp ═══

function accordionReducer(state, action) {
  switch (action.type) {
    case 'TOGGLE': {
      const { index, singleOpen } = action;
      const next = new Set(state.openItems);
      if (next.has(index)) next.delete(index);
      else { if (singleOpen) next.clear(); next.add(index); }
      return { ...state, openItems: next };
    }
    case 'OPEN_ALL':
      return { ...state, openItems: new Set(action.allIndices) };
    case 'CLOSE_ALL':
      return { ...state, openItems: new Set() };
    default: return state;
  }
}
// → useReducer tốt hơn useState khi có nhiều actions phức tạp!

// ═══ PATTERN 4: Render Props ═══
// Cho phép parent quyết định render content!

function Accordion({ items, renderHeader, renderContent, singleOpen }) {
  const { toggle, isOpen } = useAccordion(items.length, singleOpen);
  return items.map((item, i) => (
    <div key={i}>
      {renderHeader(item, isOpen(i), () => toggle(i))}
      {isOpen(i) && renderContent(item)}
    </div>
  ));
}
// <Accordion items={data}
//   renderHeader={(item, open, toggle) => (
//     <h3 onClick={toggle}>{item.title} {open ? '▼' : '▶'}</h3>
//   )}
//   renderContent={(item) => <p>{item.body}</p>}
// />
```

---

## §1.4 Accordion — Web Component

> 🗣 **Web Component** = Custom Element + Shadow DOM + HTML Templates. Không cần framework! Native browser API!

```javascript
// ═══ Web Component Accordion ═══
// Tại sao Web Component?
// → Encapsulation: Shadow DOM cô lập CSS, không conflict với page!
// → Reusable: <my-accordion> dùng được ở BẤT KỲ framework nào!
// → Native: không cần React, Vue, Angular — browser hỗ trợ sẵn!

class MyAccordion extends HTMLElement {
  // ═══ CONSTRUCTOR ═══
  // Chạy khi <my-accordion> được tạo (trước khi thêm vào DOM!)
  constructor() {
    super(); // BẮT BUỘC: gọi constructor của HTMLElement!

    // Shadow DOM = DOM riêng biệt, cách ly khỏi page!
    // mode: 'open' = bên ngoài có thể truy cập shadowRoot
    // mode: 'closed' = không thể truy cập (private!)
    this.attachShadow({ mode: "open" });

    this._items = []; // state: danh sách accordion items
    this._singleOpen = true;
  }

  // ═══ OBSERVED ATTRIBUTES ═══
  // Khai báo attributes nào sẽ trigger attributeChangedCallback!
  static get observedAttributes() {
    return ["single-open"];
  }

  // ═══ ATTRIBUTE CHANGED ═══
  // Chạy khi observed attribute thay đổi!
  attributeChangedCallback(name, oldVal, newVal) {
    if (name === "single-open") {
      this._singleOpen = newVal !== "false";
    }
  }

  // ═══ CONNECTED CALLBACK ═══
  // Chạy khi element được thêm vào DOM (như componentDidMount!)
  connectedCallback() {
    this._render();
    this._setupEvents();
  }

  // ═══ DISCONNECTED CALLBACK ═══
  // Chạy khi element bị remove khỏi DOM (cleanup!)
  disconnectedCallback() {
    // Shadow DOM tự cleanup events khi remove!
  }

  _render() {
    // Shadow DOM: CSS ở đây KHÔNG ảnh hưởng page bên ngoài!
    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: block;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          overflow: hidden;
          font-family: system-ui, sans-serif;
        }
        /* :host = chính element <my-accordion> */

        .item + .item { border-top: 1px solid #e2e8f0; }

        .header {
          display: flex; justify-content: space-between;
          align-items: center; width: 100%;
          padding: 16px 20px; border: none;
          background: #fff; cursor: pointer;
          font-size: 16px; font-weight: 600;
          color: #1a202c; text-align: left;
        }
        .header:hover { background: #f7fafc; }
        .header[aria-expanded="true"] { background: #edf2f7; }

        .icon {
          transition: transform 0.3s ease;
          font-size: 12px;
        }
        .header[aria-expanded="true"] .icon {
          transform: rotate(90deg);
        }

        .panel {
          max-height: 0;
          overflow: hidden;
          transition: max-height 0.35s ease;
        }

        .content { padding: 16px 20px; color: #4a5568; line-height: 1.6; }
      </style>

      <slot></slot>
      <!-- <slot> = "chèn children từ light DOM vào đây!" -->
    `;

    // Đọc children từ light DOM:
    const items = this.querySelectorAll("accordion-item");
    // querySelectorAll trên this (không phải shadowRoot!)
    // vì <accordion-item> nằm trong light DOM!

    const container = document.createElement("div");

    items.forEach((item, i) => {
      const title = item.getAttribute("title") || `Section ${i + 1}`;
      const content = item.innerHTML;

      const div = document.createElement("div");
      div.className = "item";
      div.innerHTML = `
        <button class="header" aria-expanded="false">
          <span>${title}</span>
          <span class="icon">▶</span>
        </button>
        <div class="panel" role="region">
          <div class="content">${content}</div>
        </div>
      `;
      container.appendChild(div);

      this._items.push({
        header: div.querySelector(".header"),
        panel: div.querySelector(".panel"),
        isOpen: false,
      });
    });

    // Xoá slot, thêm rendered content:
    this.shadowRoot.querySelector("slot")?.remove();
    this.shadowRoot.appendChild(container);
  }

  _setupEvents() {
    this._items.forEach((item, index) => {
      item.header.addEventListener("click", () => this.toggle(index));

      item.header.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          this.toggle(index);
        }
        if (e.key === "ArrowDown") {
          e.preventDefault();
          const next = (index + 1) % this._items.length;
          this._items[next].header.focus();
        }
        if (e.key === "ArrowUp") {
          e.preventDefault();
          const prev = (index - 1 + this._items.length) % this._items.length;
          this._items[prev].header.focus();
        }
      });
    });
  }

  toggle(index) {
    const item = this._items[index];
    if (item.isOpen) {
      this._close(index);
    } else {
      if (this._singleOpen) {
        this._items.forEach((_, i) => {
          if (i !== index && this._items[i].isOpen) this._close(i);
        });
      }
      this._open(index);
    }
  }

  _open(index) {
    const { header, panel } = this._items[index];
    this._items[index].isOpen = true;
    header.setAttribute("aria-expanded", "true");
    panel.style.maxHeight = panel.scrollHeight + "px";
  }

  _close(index) {
    const { header, panel } = this._items[index];
    this._items[index].isOpen = false;
    header.setAttribute("aria-expanded", "false");
    panel.style.maxHeight = "0";
  }
}

// ĐĂNG KÝ CUSTOM ELEMENT:
// Tên PHẢI có dấu gạch ngang (my-accordion, không phải myaccordion!)
// → Để browser phân biệt với HTML native elements!
customElements.define("my-accordion", MyAccordion);
```

```html
<!-- Usage: Native HTML! Không cần import React! -->
<my-accordion single-open="true">
  <accordion-item title="Section 1: Giới thiệu">
    Nội dung section 1. Lorem ipsum dolor sit amet.
  </accordion-item>
  <accordion-item title="Section 2: Cài đặt">
    Nội dung section 2. Hướng dẫn cài đặt chi tiết.
  </accordion-item>
  <accordion-item title="Section 3: Sử dụng">
    Nội dung section 3. Cách sử dụng component.
  </accordion-item>
</my-accordion>

<!-- Dùng trong React? CŨNG ĐƯỢC! -->
<!-- <my-accordion single-open="true">...</my-accordion> -->
<!-- Dùng trong Vue? CŨNG ĐƯỢC! -->
<!-- Dùng trong Angular? CŨNG ĐƯỢC! -->
```

### Giải thích Web Component Lifecycle:

```
WEB COMPONENT LIFECYCLE:
═══════════════════════════════════════════════════════

  1. constructor()
     → Chạy khi element được TẠO (document.createElement)
     → Chưa có trong DOM! Không access children!
     → Chỉ setup Shadow DOM, initial state!

  2. connectedCallback()
     → Chạy khi element được THÊM VÀO DOM
     → Giống componentDidMount trong React!
     → Render content, setup event listeners!

  3. attributeChangedCallback(name, old, new)
     → Chạy khi observed attribute thay đổi
     → Giống useEffect([dependency]) trong React!
     → Chỉ trigger cho attributes trong observedAttributes!

  4. disconnectedCallback()
     → Chạy khi element bị REMOVE khỏi DOM
     → Giống componentWillUnmount / cleanup useEffect!
     → Cleanup timers, observers, listeners!

  Shadow DOM vs Light DOM:
  ┌─── <my-accordion> ─────────────────────┐
  │                                         │
  │  Light DOM (bên ngoài, do user viết):   │
  │  <accordion-item title="...">           │
  │    Nội dung...                          │
  │  </accordion-item>                     │
  │                                         │
  │  Shadow DOM (bên trong, do code tạo):   │
  │  #shadow-root                           │
  │    <style>...</style>  ← CSS CÔ LẬP!   │
  │    <div class="item">                   │
  │      <button>...</button>               │
  │      <div class="panel">...</div>       │
  │    </div>                               │
  └─────────────────────────────────────────┘

  CSS trong Shadow DOM KHÔNG ảnh hưởng page!
  CSS của page KHÔNG ảnh hưởng Shadow DOM!
  → Hoàn toàn cô lập! Không sợ conflict!
```

### Giải thích `extends HTMLElement` và `super()`

#### Tại sao phải `extends HTMLElement`?

```javascript
class MyAccordion extends HTMLElement { ... }
//                   ^^^^^^^^^^^^^^^^
//                   PHẢI có! Không có = lỗi!
```

`extends HTMLElement` = **"MyAccordion KẾ THỪA từ HTMLElement"**. Nghĩa là:

```
HTMLElement (class cha) — browser cung cấp sẵn!
├── Có: .setAttribute(), .getAttribute()
├── Có: .addEventListener(), .removeEventListener()
├── Có: .classList, .style, .innerHTML
├── Có: .attachShadow()
├── Có: lifecycle callbacks (connectedCallback, etc.)
└── Có: tất cả tính năng của 1 HTML element!

        ↓ extends (kế thừa!)

MyAccordion (class con) — ta tự viết!
├── KẾ THỪA tất cả từ HTMLElement!
├── THÊM: toggle(), _open(), _close()
└── THÊM: _items, _singleOpen (state riêng!)
```

**Nếu KHÔNG extends?**

```javascript
// ❌ KHÔNG extends HTMLElement:
class MyAccordion { ... }
customElements.define('my-accordion', MyAccordion);
// → Lỗi: "MyAccordion does not extend HTMLElement"
// → Browser TỪ CHỐI đăng ký!

// Tại sao? Vì customElements.define() YÊU CẦU:
// → Class PHẢI là con/cháu của HTMLElement!
// → Browser cần biết: "đây là 1 HTML element hợp lệ!"
// → Nếu không kế thừa → không có .setAttribute, .addEventListener...
// → → Không phải HTML element → browser không chấp nhận!
```

```
Hình dung: Giống như muốn làm bác sĩ!

HTMLElement = bằng cấp y khoa
extends HTMLElement = "tôi CÓ bằng y khoa!"
customElements.define = "đăng ký hành nghề"

Không extends = không có bằng = không được đăng ký!
```

**Có thể extends element CỤ THỂ hơn:**

```javascript
// extends HTMLElement → HOÀN TOÀN custom!
class MyAccordion extends HTMLElement { ... }
// <my-accordion> — tag mới, browser chưa biết gì!

// extends HTMLButtonElement → custom BUTTON!
class FancyButton extends HTMLButtonElement { ... }
// <button is="fancy-button"> — vẫn là button, thêm tính năng!
// → Có sẵn: click behavior, form submission, disabled, type...

// extends HTMLInputElement → custom INPUT!
class DatePicker extends HTMLInputElement { ... }
// <input is="date-picker"> — vẫn là input, thêm UI!
```

#### `super()` — Nếu không có thì sao?

```javascript
constructor() {
  super();  // ← CÁI NÀY!
  // ... code khác
}
```

`super()` = **gọi constructor của class CHA (HTMLElement)**. Nó setup những thứ cơ bản:

```
super() gọi constructor của HTMLElement, constructor đó:
1. Tạo DOM node (element thật trong browser!)
2. Setup internal state (attributes, children, style...)
3. Khởi tạo `this` → để bạn dùng this.xxx sau đó!
```

**Nếu KHÔNG gọi super():**

```javascript
// ❌ THIẾU super():
class MyAccordion extends HTMLElement {
  constructor() {
    // QUÊN super()!
    this.attachShadow({ mode: "open" });
    // → ReferenceError: Must call super constructor
    //   in derived class before accessing 'this'!
  }
}

// Browser nói:
// "Bạn chưa gọi super() mà đã dùng 'this'?
//  'this' CHƯA TỒN TẠI vì class cha chưa khởi tạo!"
```

**Quy tắc JavaScript:**

```
Khi class CON có constructor → PHẢI gọi super() TRƯỚC KHI dùng this!

class Cha {
  constructor() {
    // Tạo object, gán vào 'this'!
  }
}

class Con extends Cha {
  constructor() {
    // Lúc này 'this' CHƯA CÓ!
    // → this.xxx = lỗi!

    super();  // Gọi constructor Cha → 'this' được tạo!

    // Bây giờ 'this' ĐÃ CÓ!
    this.xxx = 123;  // OK! ✅
  }
}

// Nếu Con KHÔNG có constructor → tự động gọi super()!
class Con extends Cha {
  // Không viết constructor
  // → JS tự thêm: constructor(...args) { super(...args); }
}
```

```
Hình dung: Xây nhà 2 tầng!

HTMLElement = tầng 1 (móng + khung!)
super()     = "xin hãy xây tầng 1 trước!"
MyAccordion = tầng 2 (phòng ốc của ta!)

Không gọi super() = cố xây tầng 2 mà chưa có tầng 1!
→ SẬP! (ReferenceError!)
```

---

# ⭐ Component 2: Star Rating

## Kiến Trúc Star Rating

```
STAR RATING:
═══════════════════════════════════════════════════════════════

  Interactive mode (user clicks!):
  ★ ★ ★ ★ ☆     ← 4/5 stars selected!
  1 2 3 4 5

  Hover preview:
  ★ ★ ★ ☆ ☆     ← hovering star 3!
  (preview trước khi click!)

  States:
  ☆ = empty (unfilled!)
  ★ = filled (selected!)
  ★ = highlighted (hover preview!)

  Features:
  • Click to rate!
  • Hover to preview!
  • Half-star support (optional!)
  • Read-only mode!
  • Keyboard accessible (←/→ arrows!)
  • aria-label for screen readers!
```

---

## §2.1 Star Rating — Vanilla JavaScript

```html
<div
  class="star-rating"
  id="myRating"
  role="radiogroup"
  aria-label="Đánh giá sản phẩm"
></div>
<p id="ratingText">Chưa đánh giá</p>
```

```css
.star-rating {
  display: inline-flex;
  gap: 4px;
  cursor: pointer;
}

.star-rating .star {
  font-size: 32px;
  color: #cbd5e0;
  transition:
    color 0.15s ease,
    transform 0.15s ease;
  user-select: none;
  background: none;
  border: none;
  cursor: pointer;
  padding: 2px;
}

.star-rating .star.filled {
  color: #f6ad55;
}

.star-rating .star.hover {
  color: #ed8936;
  transform: scale(1.15);
}

.star-rating.readonly {
  cursor: default;
}

.star-rating.readonly .star {
  cursor: default;
}
```

```javascript
// ═══ Vanilla JS Star Rating ═══

class StarRating {
  constructor(container, options = {}) {
    this.container =
      typeof container === "string"
        ? document.querySelector(container)
        : container;

    this.options = {
      maxStars: 5,
      initialRating: 0,
      readonly: false,
      onChange: null, // callback(rating)
      ...options,
    };

    this.rating = this.options.initialRating;
    this.hoverRating = 0;
    this.stars = [];

    this._render();
    this._bindEvents();
  }

  _render() {
    this.container.innerHTML = "";
    if (this.options.readonly) {
      this.container.classList.add("readonly");
    }

    for (let i = 1; i <= this.options.maxStars; i++) {
      const star = document.createElement("button");
      star.className = "star";
      star.textContent = "★";
      star.dataset.value = i;
      star.setAttribute("role", "radio");
      star.setAttribute("aria-checked", i <= this.rating);
      star.setAttribute("aria-label", `${i} sao`);
      star.setAttribute("tabindex", i === 1 ? "0" : "-1");

      this.container.appendChild(star);
      this.stars.push(star);
    }

    this._updateDisplay();
  }

  _bindEvents() {
    if (this.options.readonly) return;

    this.container.addEventListener("click", (e) => {
      const star = e.target.closest(".star");
      if (!star) return;
      this.setRating(parseInt(star.dataset.value));
    });

    this.container.addEventListener("mouseover", (e) => {
      const star = e.target.closest(".star");
      if (!star) return;
      this.hoverRating = parseInt(star.dataset.value);
      this._updateDisplay();
    });

    this.container.addEventListener("mouseleave", () => {
      this.hoverRating = 0;
      this._updateDisplay();
    });

    // Keyboard: ←/→ để thay đổi rating!
    this.container.addEventListener("keydown", (e) => {
      if (e.key === "ArrowRight" || e.key === "ArrowUp") {
        e.preventDefault();
        this.setRating(Math.min(this.rating + 1, this.options.maxStars));
      }
      if (e.key === "ArrowLeft" || e.key === "ArrowDown") {
        e.preventDefault();
        this.setRating(Math.max(this.rating - 1, 0));
      }
    });
  }

  _updateDisplay() {
    const activeRating = this.hoverRating || this.rating;

    this.stars.forEach((star, index) => {
      const value = index + 1;
      star.classList.toggle("filled", value <= this.rating);
      star.classList.toggle(
        "hover",
        this.hoverRating > 0 && value <= this.hoverRating,
      );
      star.setAttribute("aria-checked", value <= this.rating);
    });
  }

  setRating(value) {
    this.rating = value;
    this._updateDisplay();
    if (this.options.onChange) {
      this.options.onChange(this.rating);
    }
  }

  getRating() {
    return this.rating;
  }

  reset() {
    this.setRating(0);
  }
}

// Usage:
const rating = new StarRating("#myRating", {
  maxStars: 5,
  initialRating: 3,
  onChange: (value) => {
    document.getElementById("ratingText").textContent =
      `Bạn đánh giá: ${value}/5 sao`;
  },
});
```

---

## §2.2 Star Rating — React

```javascript
// ═══ React Star Rating ═══
import { useState, useCallback } from "react";

function useStarRating(maxStars = 5, initialRating = 0) {
  const [rating, setRating] = useState(initialRating);
  const [hoverRating, setHoverRating] = useState(0);

  const handleClick = useCallback((value) => {
    setRating(value);
  }, []);

  const handleHover = useCallback((value) => {
    setHoverRating(value);
  }, []);

  const handleLeave = useCallback(() => {
    setHoverRating(0);
  }, []);

  const reset = useCallback(() => {
    setRating(0);
    setHoverRating(0);
  }, []);

  return {
    rating,
    hoverRating,
    handleClick,
    handleHover,
    handleLeave,
    reset,
  };
}

function Star({ filled, hovered, onClick, onHover, value }) {
  return (
    <button
      onClick={() => onClick(value)}
      onMouseEnter={() => onHover(value)}
      role="radio"
      aria-checked={filled}
      aria-label={`${value} sao`}
      style={{
        fontSize: "32px",
        background: "none",
        border: "none",
        cursor: "pointer",
        color: hovered ? "#ed8936" : filled ? "#f6ad55" : "#cbd5e0",
        transform: hovered ? "scale(1.15)" : "scale(1)",
        transition: "color 0.15s, transform 0.15s",
        padding: "2px",
      }}
    >
      ★
    </button>
  );
}

function StarRating({
  maxStars = 5,
  initialRating = 0,
  readonly = false,
  onChange,
}) {
  const { rating, hoverRating, handleClick, handleHover, handleLeave } =
    useStarRating(maxStars, initialRating);

  const onStarClick = useCallback(
    (val) => {
      if (readonly) return;
      handleClick(val);
      onChange?.(val);
    },
    [readonly, handleClick, onChange],
  );

  return (
    <div
      role="radiogroup"
      aria-label="Đánh giá"
      onMouseLeave={handleLeave}
      style={{ display: "inline-flex", gap: "4px" }}
    >
      {Array.from({ length: maxStars }, (_, i) => {
        const value = i + 1;
        const activeRating = hoverRating || rating;
        return (
          <Star
            key={value}
            value={value}
            filled={value <= rating}
            hovered={!readonly && hoverRating > 0 && value <= hoverRating}
            onClick={onStarClick}
            onHover={readonly ? () => {} : handleHover}
          />
        );
      })}
    </div>
  );
}

// Usage:
// <StarRating maxStars={5} onChange={(v) => console.log(v)} />
// <StarRating maxStars={5} initialRating={4} readonly />
```

---

### §2.3 Advanced React Patterns — Star Rating

```javascript
// ═══ PATTERN 1: Half-Star Support ═══
// Detect click position trên star để xác định .5!

function HalfStarRating({ maxStars = 5, onChange, precision = 0.5 }) {
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);

  const handleClick = (e, starIndex) => {
    const starEl = e.currentTarget;
    const rect = starEl.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const isLeftHalf = clickX < rect.width / 2;

    const value = isLeftHalf ? starIndex - 0.5 : starIndex;
    setRating(value);
    onChange?.(value);
  };

  const handleHover = (e, starIndex) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const isLeftHalf = e.clientX - rect.left < rect.width / 2;
    setHoverRating(isLeftHalf ? starIndex - 0.5 : starIndex);
  };

  const activeRating = hoverRating || rating;

  return (
    <div
      onMouseLeave={() => setHoverRating(0)}
      style={{ display: "inline-flex" }}
    >
      {Array.from({ length: maxStars }, (_, i) => {
        const value = i + 1;
        const fillPercent =
          activeRating >= value ? 100 : activeRating >= value - 0.5 ? 50 : 0;
        return (
          <span
            key={value}
            onClick={(e) => handleClick(e, value)}
            onMouseMove={(e) => handleHover(e, value)}
            style={{
              fontSize: "32px",
              cursor: "pointer",
              position: "relative",
              display: "inline-block",
            }}
          >
            {/* Background star (empty!) */}
            <span style={{ color: "#cbd5e0" }}>★</span>
            {/* Overlay star (filled by %) */}
            <span
              style={{
                position: "absolute",
                left: 0,
                top: 0,
                overflow: "hidden",
                width: `${fillPercent}%`,
                color: "#f6ad55",
              }}
            >
              ★
            </span>
          </span>
        );
      })}
    </div>
  );
}
// <HalfStarRating maxStars={5} onChange={(v) => console.log(v)} />
// → Click trái nửa star = 0.5, phải nửa = 1.0!

// ═══ PATTERN 2: Controlled Component ═══
// Parent kiểm soát hoàn toàn giá trị rating!

function ControlledStarRating({ value, onChange, maxStars = 5 }) {
  // Không có internal state! Parent quyết định!
  const [hover, setHover] = useState(0);
  return (
    <div onMouseLeave={() => setHover(0)}>
      {Array.from({ length: maxStars }, (_, i) => {
        const v = i + 1;
        return (
          <button
            key={v}
            onClick={() => onChange(v)}
            onMouseEnter={() => setHover(v)}
          >
            {(hover || value) >= v ? "★" : "☆"}
          </button>
        );
      })}
    </div>
  );
}
// Form integration:
// const [form, setForm] = useState({ title: '', rating: 0 });
// <ControlledStarRating value={form.rating}
//   onChange={(v) => setForm(prev => ({ ...prev, rating: v }))} />

// ═══ PATTERN 3: Custom Icons via Render Props ═══
// Thay ★ bằng icon tuỳ chỉnh (heart, thumb, emoji...)!

function CustomIconRating({
  maxStars = 5,
  onChange,
  renderIcon = (filled) => (filled ? "★" : "☆"),
}) {
  const [rating, setRating] = useState(0);
  return (
    <div>
      {Array.from({ length: maxStars }, (_, i) => (
        <button
          key={i}
          onClick={() => {
            setRating(i + 1);
            onChange?.(i + 1);
          }}
        >
          {renderIcon(i + 1 <= rating)}
        </button>
      ))}
    </div>
  );
}
// <CustomIconRating renderIcon={(filled) => filled ? '❤️' : '🤍'} />
// <CustomIconRating renderIcon={(filled) => filled ? '👍' : '👎'} />

// ═══ PATTERN 4: Optimistic Update + API Sync ═══
// Update UI ngay lập tức, sync với server sau!

function useOptimisticRating(initialRating, onSave) {
  const [rating, setRating] = useState(initialRating);
  const [isSaving, setIsSaving] = useState(false);
  const previousRef = useRef(initialRating);

  const rate = async (value) => {
    previousRef.current = rating; // backup!
    setRating(value); // optimistic!
    setIsSaving(true);
    try {
      await onSave(value); // API call!
    } catch {
      setRating(previousRef.current); // rollback!
    } finally {
      setIsSaving(false);
    }
  };

  return { rating, rate, isSaving };
}
// → UI updates INSTANTLY, API syncs in background!
// → If API fails, rollback to previous value!
```

---

## §2.4 Star Rating — Web Component

```javascript
// ═══ Web Component Star Rating ═══

class MyStarRating extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this._rating = 0;
    this._hoverRating = 0;
    this._maxStars = 5;
    this._readonly = false;
  }

  static get observedAttributes() {
    return ["max-stars", "value", "readonly"];
  }

  attributeChangedCallback(name, oldVal, newVal) {
    if (name === "max-stars") this._maxStars = parseInt(newVal) || 5;
    if (name === "value") this._rating = parseFloat(newVal) || 0;
    if (name === "readonly") this._readonly = newVal !== null;
    if (this.shadowRoot.innerHTML) this._updateStars();
  }

  connectedCallback() {
    this._rating = parseFloat(this.getAttribute("value")) || 0;
    this._maxStars = parseInt(this.getAttribute("max-stars")) || 5;
    this._readonly = this.hasAttribute("readonly");
    this._render();
  }

  _render() {
    this.shadowRoot.innerHTML = `
      <style>
        :host { display: inline-flex; gap: 2px; }
        .star {
          font-size: 32px; cursor: pointer;
          background: none; border: none; padding: 2px;
          transition: transform 0.1s;
          color: #cbd5e0;
        }
        .star.filled { color: #f6ad55; }
        .star:hover { transform: scale(1.15); }
        :host([readonly]) .star { cursor: default; }
        :host([readonly]) .star:hover { transform: none; }
      </style>
      <div role="radiogroup" aria-label="Rating">
        ${Array.from(
          { length: this._maxStars },
          (_, i) => `
          <button class="star ${i < this._rating ? "filled" : ""}"
            role="radio" aria-checked="${i < this._rating}"
            aria-label="${i + 1} sao" data-value="${i + 1}">
            ★
          </button>
        `,
        ).join("")}
      </div>
    `;

    if (!this._readonly) {
      this.shadowRoot.querySelectorAll(".star").forEach((star) => {
        star.addEventListener("click", () => {
          this._rating = parseInt(star.dataset.value);
          this._updateStars();
          // Dispatch custom event → parent bắt được!
          this.dispatchEvent(
            new CustomEvent("rating-change", {
              detail: { value: this._rating },
              bubbles: true, // event nổi lên parent!
            }),
          );
        });

        star.addEventListener("mouseenter", () => {
          this._hoverRating = parseInt(star.dataset.value);
          this._updateStars();
        });
      });

      this.shadowRoot
        .querySelector('[role="radiogroup"]')
        .addEventListener("mouseleave", () => {
          this._hoverRating = 0;
          this._updateStars();
        });
    }
  }

  _updateStars() {
    const active = this._hoverRating || this._rating;
    this.shadowRoot.querySelectorAll(".star").forEach((star, i) => {
      const isFilled = i < active;
      star.classList.toggle("filled", isFilled);
      star.setAttribute("aria-checked", String(isFilled));
    });
  }

  // Public API — gọi từ bên ngoài:
  get value() {
    return this._rating;
  }
  set value(v) {
    this._rating = v;
    this._updateStars();
  }
}

customElements.define("my-star-rating", MyStarRating);
```

```html
<!-- Usage -->
<my-star-rating max-stars="5" value="3"></my-star-rating>
<my-star-rating max-stars="5" value="4" readonly></my-star-rating>

<script>
  // Lắng nghe custom event:
  document
    .querySelector("my-star-rating")
    .addEventListener("rating-change", (e) => {
      console.log("New rating:", e.detail.value); // 1-5
    });

  // Public API:
  const rating = document.querySelector("my-star-rating");
  console.log(rating.value); // getter!
  rating.value = 5; // setter!
</script>
```

---

# 📑 Component 3: Tabs

## Kiến Trúc Tabs

```
TABS:
═══════════════════════════════════════════════════════════════

  ┌──────┬──────┬──────┬──────┐
  │ Tab1 │ Tab2 │ Tab3 │ Tab4 │  ← tablist (role="tablist")
  └──────┴──┬───┴──────┴──────┘
             │
  ┌──────────┴────────────────┐
  │ Content for Tab 2         │  ← tabpanel (role="tabpanel")
  │ Only active tab shown!    │
  └───────────────────────────┘

  Keyboard Navigation (WAI-ARIA!):
  • ←/→: switch tabs!
  • Home/End: first/last tab!
  • Tab key: focus vào tabpanel!
  • aria-selected, aria-controls!
```

---

## §3.1 Tabs — Vanilla JavaScript

```html
<div class="tabs" id="myTabs">
  <div class="tab-list" role="tablist" aria-label="Sample Tabs">
    <button
      class="tab-btn"
      role="tab"
      aria-selected="true"
      aria-controls="tabpanel-0"
      id="tab-0"
      tabindex="0"
    >
      Tab 1
    </button>
    <button
      class="tab-btn"
      role="tab"
      aria-selected="false"
      aria-controls="tabpanel-1"
      id="tab-1"
      tabindex="-1"
    >
      Tab 2
    </button>
    <button
      class="tab-btn"
      role="tab"
      aria-selected="false"
      aria-controls="tabpanel-2"
      id="tab-2"
      tabindex="-1"
    >
      Tab 3
    </button>
  </div>
  <div
    class="tab-panel active"
    role="tabpanel"
    id="tabpanel-0"
    aria-labelledby="tab-0"
  >
    Content 1
  </div>
  <div
    class="tab-panel"
    role="tabpanel"
    id="tabpanel-1"
    aria-labelledby="tab-1"
    hidden
  >
    Content 2
  </div>
  <div
    class="tab-panel"
    role="tabpanel"
    id="tabpanel-2"
    aria-labelledby="tab-2"
    hidden
  >
    Content 3
  </div>
</div>
```

```css
.tabs {
  font-family: system-ui, sans-serif;
}

.tab-list {
  display: flex;
  border-bottom: 2px solid #e2e8f0;
  gap: 0;
}

.tab-btn {
  padding: 12px 24px;
  border: none;
  background: transparent;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  color: #718096;
  border-bottom: 2px solid transparent;
  margin-bottom: -2px;
  transition:
    color 0.2s,
    border-color 0.2s;
}

.tab-btn:hover {
  color: #2d3748;
}

.tab-btn[aria-selected="true"] {
  color: #3182ce;
  border-bottom-color: #3182ce;
  font-weight: 600;
}

.tab-panel {
  padding: 20px 0;
  animation: fadeIn 0.3s ease;
}

.tab-panel[hidden] {
  display: none;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(4px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
```

```javascript
// ═══ Vanilla JS Tabs ═══

class Tabs {
  constructor(container) {
    this.container =
      typeof container === "string"
        ? document.querySelector(container)
        : container;

    this.tabs = [...this.container.querySelectorAll('[role="tab"]')];
    this.panels = [...this.container.querySelectorAll('[role="tabpanel"]')];
    this.activeIndex = 0;

    this._bindEvents();
  }

  _bindEvents() {
    this.tabs.forEach((tab, index) => {
      tab.addEventListener("click", () => this.selectTab(index));
    });

    // Keyboard navigation (WAI-ARIA Tabs pattern!):
    this.container
      .querySelector('[role="tablist"]')
      .addEventListener("keydown", (e) => {
        let newIndex = this.activeIndex;

        switch (e.key) {
          case "ArrowRight":
            newIndex = (this.activeIndex + 1) % this.tabs.length;
            break;
          case "ArrowLeft":
            newIndex =
              (this.activeIndex - 1 + this.tabs.length) % this.tabs.length;
            break;
          case "Home":
            newIndex = 0;
            break;
          case "End":
            newIndex = this.tabs.length - 1;
            break;
          default:
            return; // không prevent default cho keys khác!
        }

        e.preventDefault();
        this.selectTab(newIndex);
        this.tabs[newIndex].focus();
      });
  }

  selectTab(index) {
    // Deactivate current:
    this.tabs[this.activeIndex].setAttribute("aria-selected", "false");
    this.tabs[this.activeIndex].setAttribute("tabindex", "-1");
    this.panels[this.activeIndex].hidden = true;

    // Activate new:
    this.activeIndex = index;
    this.tabs[index].setAttribute("aria-selected", "true");
    this.tabs[index].setAttribute("tabindex", "0");
    this.panels[index].hidden = false;
  }
}

// Usage:
const tabs = new Tabs("#myTabs");
```

---

### 📖 Giải thích code Tabs từng phần — Tabs I, II, III

> Tabs component nhìn đơn giản nhưng khi xây dựng **đúng chuẩn**, nó đòi hỏi 3 tầng:
> - **Tabs I**: Functionality cơ bản — click tab, hiển thị panel!
> - **Tabs II**: Accessibility — ARIA roles, states, properties!
> - **Tabs III**: Keyboard interactions — Arrow keys, Home/End, Tab key!

---

### 🔹 Tabs I — Functionality Cơ Bản

#### Yêu cầu

```
TABS I — YÊU CẦU:
═══════════════════════════════════════════════════════════════

  1. Click vào tab → tab đó trở thành active!
  2. Active tab phải có visual indication (ví dụ: màu xanh)!
  3. Luôn chỉ hiển thị MỘT panel — panel tương ứng tab active!
  4. Focus vào functionality, KHÔNG cần CSS phức tạp!
```

#### Phân tích: cách tiếp cận đơn giản nhất

Ở mức cơ bản nhất, tabs chỉ cần:

```javascript
// Logic cốt lõi — CỰC KỲ ĐƠN GIẢN:
// 1. Track "tab nào đang active" (một con số!)
// 2. Click tab → update số đó!
// 3. Hiển thị panel tương ứng số đó!

let activeTab = 0; // index của tab active!

function selectTab(index) {
  activeTab = index;
  // Ẩn tất cả panels, hiện panel[index]!
  // Bỏ highlight tất cả tabs, highlight tab[index]!
}
```

Nghe quen không? Logic này **giống y hệt** radio buttons — chỉ có 1 option được chọn tại một thời điểm. Đó là lý do WAI-ARIA dùng pattern tương tự `radiogroup` cho tabs.

#### Code giải thích chi tiết — Tabs I

```javascript
// ═══ Tabs I — Phiên bản tối giản ═══
// Chỉ cần 3 thứ: tabs, panels, activeIndex!

function initTabs(container) {
  const tabButtons = container.querySelectorAll('.tab-btn');
  const tabPanels = container.querySelectorAll('.tab-panel');
  let activeIndex = 0;

  tabButtons.forEach((btn, index) => {
    btn.addEventListener('click', () => {
      // Bước 1: Bỏ highlight tab cũ!
      tabButtons[activeIndex].classList.remove('active');
      tabButtons[activeIndex].style.color = ''; // reset màu!

      // Bước 2: Ẩn panel cũ!
      tabPanels[activeIndex].style.display = 'none';

      // Bước 3: Cập nhật activeIndex!
      activeIndex = index;

      // Bước 4: Highlight tab mới!
      tabButtons[activeIndex].classList.add('active');
      tabButtons[activeIndex].style.color = 'blue'; // visual indication!

      // Bước 5: Hiện panel mới!
      tabPanels[activeIndex].style.display = 'block';
    });
  });
}
```

```
TẠI SAO VISUAL INDICATION QUAN TRỌNG:
═══════════════════════════════════════════════════════════════

  KHÔNG có visual indication:
  ┌──────┬──────┬──────┐
  │ Tab1 │ Tab2 │ Tab3 │   ← trông như nhau! Tab nào đang active?
  └──────┴──────┴──────┘
  │ Content...           │
  → User BỐI RỐI! Không biết đang xem tab nào!

  CÓ visual indication:
  ┌──────┬──────┬──────┐
  │ Tab1 │▉Tab2▉│ Tab3 │   ← Tab2 màu xanh + underline!
  └──────┴══════┴──────┘
  │ Content for Tab 2... │
  → User BIẾT NGAY đang xem Tab 2! ✅

  Cách highlight đơn giản nhất:
  → Màu chữ xanh (blue) cho active tab!
  → Hoặc: border-bottom, background, font-weight...
```

#### UX Improvements — Điểm cộng trong phỏng vấn!

```
UX CẢI THIỆN (BONUS POINTS!):
═══════════════════════════════════════════════════════════════

  1. Tab đầu tiên active mặc định khi load!
     → Không để user thấy page trống!

  2. Smooth transition khi switch panel!
     → fadeIn animation thay vì nhảy cóc!

  3. Panel height consistent!
     → Tránh page "nhảy" khi panels có height khác nhau!

  4. URL hash sync!
     → /page#tab2 → tự activate Tab 2 khi load!
     → Shareable links! ✅

  5. Remember last tab!
     → localStorage lưu activeTab!
     → Quay lại page → tab cuối cùng active!
```

---

### 🔹 Tabs II — ARIA Accessibility

#### Yêu cầu — WAI-ARIA Tabs Pattern

> Tabs II nâng cấp từ Tabs I: thêm đúng ARIA roles, states, và properties. Đây là **tiêu chuẩn quốc tế** để screen readers (phần mềm đọc màn hình) hiểu được component.

```
TABS II — ARIA REQUIREMENTS:
═══════════════════════════════════════════════════════════════

  1. Container chứa tabs → role="tablist"
  2. Mỗi tab button → role="tab" + NẰM TRONG tablist!
  3. Mỗi panel → role="tabpanel"
  4. Tab có aria-controls → trỏ đến id của panel tương ứng!
  5. Active tab: aria-selected="true"!
     Inactive tabs: aria-selected="false"!
  6. Panel có aria-labelledby → trỏ đến id của tab tương ứng!
  7. Dùng <button> cho tabs (focusable + interactive!)
```

#### Giải thích từng ARIA attribute

```
ARIA ATTRIBUTES — TẠI SAO CẦN:
═══════════════════════════════════════════════════════════════

  KHÔNG CÓ ARIA (screen reader đọc):
  "button, Tab 1"
  "button, Tab 2"
  "div, some content..."
  → Người khiếm thị: "Đây là gì? Buttons? Content?
     Nó liên quan nhau thế nào?"

  CÓ ARIA (screen reader đọc):
  "tablist"
  "Tab 1, tab, selected, 1 of 3"
  "Tab 2, tab, not selected, 2 of 3"
  "Tab 1 content, tabpanel, labelled by Tab 1"
  → Người khiếm thị: "À! Đây là nhóm tabs,
     Tab 1 đang active, có 3 tabs, panel bên dưới
     là content của Tab 1!" ✅
```

#### `role="tablist"` — Container!

```html
<!-- TRƯỚC: Chỉ là div bình thường → screen reader không biết! -->
<div class="tab-list">...</div>

<!-- SAU: role="tablist" → screen reader hiểu! -->
<div class="tab-list" role="tablist" aria-label="Sample Tabs">...</div>
```

`role="tablist"` nói cho assistive technology: **"đây là NHÓM TABS, không phải nhóm buttons random."** `aria-label` mô tả nhóm tabs này là gì (ví dụ: "Settings tabs", "Product details tabs").

#### `role="tab"` + `aria-selected` — Mỗi tab!

```html
<!-- Active tab: -->
<button
  role="tab"
  aria-selected="true"
  aria-controls="tabpanel-0"
  id="tab-0"
>
  Tab 1
</button>

<!-- Inactive tab: -->
<button
  role="tab"
  aria-selected="false"
  aria-controls="tabpanel-1"
  id="tab-1"
>
  Tab 2
</button>
```

```
CHI TIẾT TỪNG ATTRIBUTE:
═══════════════════════════════════════════════════════════════

  role="tab"
  → "Tôi là MỘT TAB trong tablist!"
  → Nếu không có: screen reader chỉ thấy "button"

  aria-selected="true" / "false"
  → "Tôi ĐANG ĐƯỢC CHỌN!" / "Tôi CHƯA được chọn!"
  → Screen reader đọc: "Tab 1, selected" hoặc "Tab 2"
  → KHÁC biệt với aria-expanded (accordion):
    • aria-expanded: "mở/đóng" (reveal/hide content!)
    • aria-selected: "chọn/không chọn" (pick 1 of many!)

  aria-controls="tabpanel-0"
  → "Khi tôi active, panel có id='tabpanel-0' sẽ hiện!"
  → Tạo LIÊN KẾT ngữ nghĩa giữa tab và panel!
  → Screen reader có thể nhảy trực tiếp đến panel!

  id="tab-0"
  → Cần thiết để panel dùng aria-labelledby trỏ ngược lại!
```

#### `role="tabpanel"` + `aria-labelledby` — Mỗi panel!

```html
<div
  role="tabpanel"
  id="tabpanel-0"
  aria-labelledby="tab-0"
>
  Content for Tab 1
</div>
```

```
LIÊN KẾT HAI CHIỀU — tab ↔ panel:
═══════════════════════════════════════════════════════════════

  Tab → Panel:  aria-controls="tabpanel-0"
  Panel → Tab:  aria-labelledby="tab-0"

  ┌─────────────────────────────────────────┐
  │  button#tab-0                           │
  │  role="tab"                             │
  │  aria-controls="tabpanel-0" ─────┐      │
  │  aria-selected="true"            │      │
  └──────────────────────────────────│──────┘
                                     │
  ┌──────────────────────────────────│──────┐
  │  div#tabpanel-0                  │      │
  │  role="tabpanel"                 │      │
  │  aria-labelledby="tab-0" ────────┘      │
  │  Content for Tab 1                      │
  └─────────────────────────────────────────┘

  → Hai chiều! Tab biết panel nào. Panel biết tab nào!
  → Screen reader: "Panel này được label bởi Tab 1"
```

#### Tại sao dùng `<button>` chứ không phải `<div>` hay `<span>`?

```
<BUTTON> vs <DIV> vs <SPAN>:
═══════════════════════════════════════════════════════════════

  <div> hoặc <span>:
  ❌ KHÔNG focusable bằng Tab key (trừ khi thêm tabindex!)
  ❌ KHÔNG handle Enter/Space key tự động!
  ❌ Screen reader KHÔNG đọc là "button"!
  → Phải thêm: tabindex="0", role="button",
    onkeydown handler cho Enter/Space...
  → NHIỀU code thừa!

  <button>:
  ✅ Focusable by default!
  ✅ Enter/Space trigger click tự động!
  ✅ Screen reader đọc "button"!
  → KHÔNG cần thêm gì! Browser lo hết!

  Quy tắc: "Nếu nó clickable → dùng <button>!"
  → Accessibility miễn phí!
  → Ít code hơn!
  → Behavioral semantics đúng!
```

#### Code hoàn chỉnh — Tabs II

Đây chính là code trong §3.1 phía trên — `selectTab()` đã handle cả ARIA:

```javascript
selectTab(index) {
  // Deactivate tab cũ:
  this.tabs[this.activeIndex].setAttribute('aria-selected', 'false');
  this.panels[this.activeIndex].hidden = true;

  // Activate tab mới:
  this.activeIndex = index;
  this.tabs[index].setAttribute('aria-selected', 'true');
  this.panels[index].hidden = false;
}
```

Mỗi lần switch tab:
- Tab cũ: `aria-selected="false"` → screen reader: "not selected"
- Tab mới: `aria-selected="true"` → screen reader: "selected"
- Panel cũ: `hidden` → ẩn khỏi DOM + screen reader!
- Panel mới: bỏ `hidden` → hiện!

---

### 🔹 Tabs III — Keyboard Interactions

#### Yêu cầu keyboard

> Tabs III là phiên bản nâng cao nhất — thêm keyboard interactions theo WAI-ARIA standard. Component tabs phải **activate ngay** khi focus thay đổi (automatic activation).

```
TABS III — KEYBOARD REQUIREMENTS:
═══════════════════════════════════════════════════════════════

  TAB KEY:
  → Focus vào tablist → đặt focus vào ACTIVE tab!
  → Từ tablist → Tab lần nữa → nhảy vào tabpanel!
  → KHÔNG tab qua từng tab button! (đó là việc của Arrow keys!)

  KHI FOCUS ĐANG Ở MỘT TAB:
  → ArrowLeft: focus tab TRƯỚC! (đầu → cuối = wrap!)
  → ArrowRight: focus tab SAU! (cuối → đầu = wrap!)
  → Home: focus tab ĐẦU TIÊN!
  → End: focus tab CUỐI CÙNG!
  → Tab content hiển thị NGAY khi focus thay đổi!
     (automatic activation!)
```

#### Roving Tabindex — Khái niệm then chốt!

Đây là **kỹ thuật quan trọng nhất** cho keyboard navigation trong tabs. Thay vì cho tất cả tabs có `tabindex="0"` (Tab key dừng ở mỗi tab), chỉ có **active tab** có `tabindex="0"`, còn lại có `tabindex="-1"`.

```
ROVING TABINDEX — GIẢI THÍCH:
═══════════════════════════════════════════════════════════════

  KHÔNG CÓ roving tabindex:
  Tất cả tabs tabindex="0"
  → User nhấn Tab: focus Tab1 → Tab → Tab2 → Tab → Tab3
  → PHẢI TAB QUA TỪNG TAB trước khi vào content!
  → Nếu có 10 tabs → nhấn Tab 10 lần! 😩

  CÓ roving tabindex:
  Chỉ active tab tabindex="0", còn lại tabindex="-1"
  → User nhấn Tab: focus Tab1 (active)
  → Tab lần nữa: NHẢY THẲNG vào panel content!
  → Muốn đổi tab? Dùng Arrow keys!
  → 10 tabs? Arrow Left/Right để navigate! Chỉ 1 Tab key vào content! ✅

  tabindex="-1" KHÔNG CÓ NGHĨA "không focusable"!
  → Tab key SKIP nó!
  → NHƯNG .focus() bằng JavaScript VẪN WORK!
  → Arrow keys gọi .focus() → tab NHẬN focus!

  ┌────────────────────────────────────────────┐
  │ Tab flow bình thường (Tab key):            │
  │                                            │
  │   [Other page elements]                    │
  │         ↓ Tab                              │
  │   [Active tab] (tabindex="0")              │
  │         ↓ Tab (skip inactive tabs!)        │
  │   [Tab panel content]                      │
  │         ↓ Tab                              │
  │   [Other page elements]                    │
  └────────────────────────────────────────────┘

  ┌────────────────────────────────────────────┐
  │ Arrow key flow (trong tablist):            │
  │                                            │
  │   Tab1 ←→ Tab2 ←→ Tab3 ←→ Tab1 (wrap!)   │
  │    ↑                              ↓        │
  │    └──────────── circular ────────┘        │
  └────────────────────────────────────────────┘
```

#### Code keyboard handler — giải thích từng case

```javascript
// ═══ Keyboard Handler — Tabs III ═══

// Gắn listener trên TABLIST (không phải từng tab!)
// → Event delegation: 1 listener cho tất cả tabs!
tablist.addEventListener('keydown', (e) => {
  let newIndex = this.activeIndex;

  switch (e.key) {
    case 'ArrowRight':
      // Di chuyển sang tab BÊN PHẢI!
      // Modulo wrap: cuối → đầu!
      newIndex = (this.activeIndex + 1) % this.tabs.length;
      break;

    case 'ArrowLeft':
      // Di chuyển sang tab BÊN TRÁI!
      // +length trước modulo: tránh index ÂM!
      newIndex = (this.activeIndex - 1 + this.tabs.length) % this.tabs.length;
      break;

    case 'Home':
      // Nhảy đến tab ĐẦU TIÊN!
      newIndex = 0;
      break;

    case 'End':
      // Nhảy đến tab CUỐI CÙNG!
      newIndex = this.tabs.length - 1;
      break;

    default:
      return; // KHÔNG preventDefault cho keys khác!
      // Đặc biệt QUAN TRỌNG: Tab key phải hoạt động bình thường
      // để user có thể Tab vào panel content!
  }

  e.preventDefault();     // Chặn default (ArrowLeft/Right scroll page!)
  this.selectTab(newIndex); // Switch tab!
  this.tabs[newIndex].focus(); // Focus programmatically!
});
```

```
TẠI SAO RETURN TRƯỚC PREVENTDEFAULT:
═══════════════════════════════════════════════════════════════

  switch (e.key) {
    case 'ArrowRight': ...break;
    case 'ArrowLeft':  ...break;
    case 'Home':       ...break;
    case 'End':        ...break;
    default: return;  ← RETURN! Thoát khỏi function!
  }
  e.preventDefault();  ← CHỈ chạy cho Arrow/Home/End!

  Nếu KHÔNG có "return" trong default:
  → Tab key → e.preventDefault() → Tab key BỊ CHẶN!
  → User KHÔNG THỂ Tab ra khỏi tablist! BỊ KẸT! 💀

  Nếu CÓ "return" trong default:
  → Tab key → return → e.preventDefault() KHÔNG chạy!
  → Tab key hoạt động bình thường!
  → User Tab → focus vào panel content! ✅
```

#### selectTab với roving tabindex — cập nhật tabindex!

```javascript
selectTab(index) {
  // 1. Tab cũ: bỏ selected + tabindex = -1!
  this.tabs[this.activeIndex].setAttribute('aria-selected', 'false');
  this.tabs[this.activeIndex].setAttribute('tabindex', '-1');
  //                                          ↑ Tab key SKIP tab này!
  this.panels[this.activeIndex].hidden = true;

  // 2. Tab mới: set selected + tabindex = 0!
  this.activeIndex = index;
  this.tabs[index].setAttribute('aria-selected', 'true');
  this.tabs[index].setAttribute('tabindex', '0');
  //                                  ↑ Tab key DỪNG ở tab này!
  this.panels[index].hidden = false;
}
```

```
ROVING TABINDEX — MÔ PHỎNG:
═══════════════════════════════════════════════════════════════

  Ban đầu: Tab 1 active
  ┌──────────┬──────────┬──────────┐
  │ Tab 1    │ Tab 2    │ Tab 3    │
  │ index=0  │ index=-1 │ index=-1 │
  │ selected │          │          │
  └──────────┴──────────┴──────────┘

  User nhấn ArrowRight → selectTab(1):
  ┌──────────┬──────────┬──────────┐
  │ Tab 1    │ Tab 2    │ Tab 3    │
  │ index=-1 │ index=0  │ index=-1 │
  │          │ selected │          │
  └──────────┴──────────┴──────────┘
  + panels[0].hidden = true
  + panels[1].hidden = false
  + tabs[1].focus() → focus chuyển sang Tab 2!

  User nhấn ArrowRight → selectTab(2):
  ┌──────────┬──────────┬──────────┐
  │ Tab 1    │ Tab 2    │ Tab 3    │
  │ index=-1 │ index=-1 │ index=0  │
  │          │          │ selected │
  └──────────┴──────────┴──────────┘

  User nhấn ArrowRight → WRAP → selectTab(0):
  ┌──────────┬──────────┬──────────┐
  │ Tab 1    │ Tab 2    │ Tab 3    │
  │ index=0  │ index=-1 │ index=-1 │
  │ selected │          │          │
  └──────────┴──────────┴──────────┘
  → Quay lại đầu! Circular navigation! ✅
```

#### Automatic Activation vs Manual Activation

Có 2 chế độ activation cho tabs:

```
2 CHẾ ĐỘ ACTIVATION:
═══════════════════════════════════════════════════════════════

  AUTOMATIC (chúng ta dùng cái này!):
  → Arrow key → focus tab MỚI → panel hiển thị NGAY!
  → User nhấn ArrowRight → Tab 2 active + panel 2 hiện!
  → Nhanh, ít bước!
  → Phù hợp khi: tab content nhẹ, load nhanh!

  MANUAL:
  → Arrow key → focus tab MỚI → nhưng CHƯA active!
  → User phải nhấn Enter/Space để activate!
  → Nhiều bước hơn!
  → Phù hợp khi: tab content nặng (API calls, charts)
    → Không muốn load until user confirms!

  Code khác biệt:
  // AUTOMATIC:
  case 'ArrowRight':
    newIndex = (activeIndex + 1) % total;
    selectTab(newIndex);     // ← activate NGAY!
    tabs[newIndex].focus();  // ← focus!
    break;

  // MANUAL:
  case 'ArrowRight':
    newIndex = (activeIndex + 1) % total;
    // KHÔNG selectTab! Chỉ focus!
    tabs[newIndex].focus();  // ← focus ONLY!
    tabs[newIndex].tabIndex = 0;
    tabs[activeIndex].tabIndex = -1;
    break;
  // User nhấn Enter/Space → selectTab(newIndex)!
```

#### Tổng kết: Tabs I → II → III

```
TABS I → II → III — PROGRESSION:
═══════════════════════════════════════════════════════════════

  TABS I (Functionality):
  ✅ Click tab → active!
  ✅ Visual indication (màu xanh)!
  ✅ 1 panel hiển thị tại một thời điểm!
  ❌ Screen reader không hiểu!
  ❌ Keyboard không hoạt động!

  TABS II (Accessibility): Tabs I +
  ✅ role="tablist", role="tab", role="tabpanel"!
  ✅ aria-selected, aria-controls, aria-labelledby!
  ✅ <button> cho focusable + interactive!
  ✅ Screen reader ĐỌC ĐƯỢC!
  ❌ Chỉ click, chưa có keyboard!

  TABS III (Keyboard): Tabs II +
  ✅ ArrowLeft/Right: navigate tabs!
  ✅ Home/End: đầu/cuối!
  ✅ Roving tabindex (0 active, -1 inactive)!
  ✅ Tab key: vào tablist → vào panel (skip inactive!)
  ✅ Automatic activation!
  ✅ HOÀN CHỈNH! Production-ready! 🎯

  → §3.1 code phía trên = TABS III (đầy đủ nhất!)
  → Bao gồm tất cả: click + ARIA + keyboard!
```

---

## §3.2 Tabs — React

```javascript
// ═══ React Tabs ═══
import { useState, useCallback, useRef } from "react";

function useTabs(initialTab = 0) {
  const [activeTab, setActiveTab] = useState(initialTab);
  const select = useCallback((index) => setActiveTab(index), []);
  return { activeTab, select };
}

function TabList({ tabs, activeTab, onSelect }) {
  const tabRefs = useRef([]);

  const handleKeyDown = useCallback(
    (e) => {
      const total = tabs.length;
      let newIndex = activeTab;

      switch (e.key) {
        case "ArrowRight":
          newIndex = (activeTab + 1) % total;
          break;
        case "ArrowLeft":
          newIndex = (activeTab - 1 + total) % total;
          break;
        case "Home":
          newIndex = 0;
          break;
        case "End":
          newIndex = total - 1;
          break;
        default:
          return;
      }

      e.preventDefault();
      onSelect(newIndex);
      tabRefs.current[newIndex]?.focus();
    },
    [activeTab, tabs.length, onSelect],
  );

  return (
    <div
      role="tablist"
      onKeyDown={handleKeyDown}
      style={{
        display: "flex",
        borderBottom: "2px solid #e2e8f0",
      }}
    >
      {tabs.map((tab, i) => (
        <button
          key={i}
          ref={(el) => (tabRefs.current[i] = el)}
          role="tab"
          aria-selected={i === activeTab}
          aria-controls={`panel-${i}`}
          tabIndex={i === activeTab ? 0 : -1}
          onClick={() => onSelect(i)}
          style={{
            padding: "12px 24px",
            border: "none",
            background: "transparent",
            cursor: "pointer",
            fontWeight: i === activeTab ? 600 : 400,
            color: i === activeTab ? "#3182ce" : "#718096",
            borderBottom: `2px solid ${
              i === activeTab ? "#3182ce" : "transparent"
            }`,
            marginBottom: "-2px",
            transition: "color 0.2s, border-color 0.2s",
          }}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}

function Tabs({ tabs }) {
  const { activeTab, select } = useTabs(0);

  return (
    <div>
      <TabList tabs={tabs} activeTab={activeTab} onSelect={select} />
      <div
        role="tabpanel"
        id={`panel-${activeTab}`}
        style={{ padding: "20px 0" }}
      >
        {tabs[activeTab]?.content}
      </div>
    </div>
  );
}

// Usage:
// <Tabs tabs={[
//   { label: 'Tab 1', content: <p>Content 1</p> },
//   { label: 'Tab 2', content: <p>Content 2</p> },
//   { label: 'Tab 3', content: <p>Content 3</p> },
// ]} />
```

---

### 📖 Giải thích React Tabs — Từng phần

#### 1. `useTabs` hook — Tại sao tách ra?

```javascript
function useTabs(initialTab = 0) {
  const [activeTab, setActiveTab] = useState(initialTab);
  const select = useCallback((index) => setActiveTab(index), []);
  return { activeTab, select };
}
```

Tách state logic vào custom hook vì:
- **Reusable**: dùng lại ở bất kỳ tabs component nào!
- **Testable**: test hook riêng mà không cần render component!
- **Separation of concerns**: UI tách khỏi logic!

`useCallback` cho `select` — tạo **stable function reference**. Nếu không wrap `useCallback`, mỗi lần component re-render, `select` là function MỚI → tất cả tab buttons re-render (vì prop `onSelect` thay đổi).

#### 2. `tabRefs` — Ref Array cho focus programmatic

```javascript
const tabRefs = useRef([]);
// ...
ref={(el) => (tabRefs.current[i] = el)}
// ...
tabRefs.current[newIndex]?.focus();
```

Tại sao cần ref cho mỗi tab?

```
REF ARRAY — TẠI SAO CẦN:
═══════════════════════════════════════════════════════════════

  Khi user nhấn ArrowRight:
  → Cần gọi .focus() trên tab button MỚI!
  → .focus() là DOM API → cần DOM element!
  → React không trực tiếp access DOM → dùng ref!

  ref={(el) => (tabRefs.current[i] = el)}
  → Mỗi button render → React gọi callback ref!
  → Lưu DOM element vào tabRefs.current[i]!

  tabRefs.current[newIndex]?.focus()
  → Lấy DOM element tab mới → gọi .focus()!
  → ?. (optional chaining): tránh crash nếu ref null!
```

#### 3. `tabIndex={i === activeTab ? 0 : -1}` — Roving tabindex trong React

```jsx
<button
  tabIndex={i === activeTab ? 0 : -1}
  // Active tab: tabIndex=0 → Tab key DỪNG ở đây!
  // Inactive tabs: tabIndex=-1 → Tab key SKIP!
>
```

Trong React, attribute `tabIndex` (camelCase!) tương đương HTML `tabindex`. Logic giống hệt Vanilla JS nhưng React tự cập nhật DOM khi state thay đổi — không cần `setAttribute` thủ công.

#### 4. `onKeyDown` trên tablist — Event delegation

```jsx
<div
  role="tablist"
  onKeyDown={handleKeyDown} // ← GẮN Ở TABLIST, không phải từng tab!
>
```

Tại sao gắn `onKeyDown` ở tablist div thay vì mỗi button?

```
EVENT DELEGATION:
═══════════════════════════════════════════════════════════════

  Gắn ở MỖI button (❌ không tối ưu):
  → 10 tabs = 10 event listeners!
  → Mỗi listener là closure → giữ reference → memory!

  Gắn ở TABLIST container (✅ event delegation):
  → 1 event listener cho TẤT CẢ tabs!
  → Keyboard event bubble UP từ button → tablist!
  → tablist handler bắt event → xử lý!
  → Ít memory, ít code, dễ maintain!
```

#### 5. So sánh Vanilla JS vs React Tabs

```
VANILLA JS vs REACT — CÙNG LOGIC, KHÁC CÁCH:
═══════════════════════════════════════════════════════════════

  Feature           │ Vanilla JS              │ React
  ──────────────────┼─────────────────────────┼──────────────
  State             │ this.activeIndex        │ useState
  DOM update        │ setAttribute thủ công   │ React tự update
  Event binding     │ addEventListener        │ JSX props
  Focus             │ this.tabs[i].focus()    │ tabRefs.current[i]
  Roving tabindex   │ setAttribute('tabindex')│ tabIndex prop
  Re-render         │ Phải tự update DOM!     │ React diff + update!

  → Cùng concepts! Chỉ khác cách triển khai!
  → Hiểu Vanilla JS trước = hiểu React dễ hơn!
```

---

### §3.3 Advanced React Patterns — Tabs

```javascript
// ═══ PATTERN 1: Lazy Loading Tab Content ═══
// Chỉ render content khi tab được active lần đầu!

function LazyTabs({ tabs }) {
  const [activeTab, setActiveTab] = useState(0);
  const [loadedTabs, setLoadedTabs] = useState(new Set([0]));

  const selectTab = (index) => {
    setActiveTab(index);
    setLoadedTabs((prev) => new Set(prev).add(index)); // mark loaded!
  };

  return (
    <div>
      <div role="tablist">
        {tabs.map((tab, i) => (
          <button
            key={i}
            role="tab"
            aria-selected={i === activeTab}
            onClick={() => selectTab(i)}
          >
            {tab.label}
          </button>
        ))}
      </div>
      {tabs.map((tab, i) => (
        // Chỉ render nếu đã loaded! Giữ mounted sau khi load!
        <div
          key={i}
          role="tabpanel"
          style={{ display: i === activeTab ? "block" : "none" }}
        >
          {loadedTabs.has(i) && tab.content}
        </div>
      ))}
    </div>
  );
}
// → Tab 1: render ngay!
// → Tab 2: chỉ render khi click lần đầu!
// → Khi quay lại Tab 2: không re-render (đã mounted)!
// → Tối ưu cho heavy content (charts, tables, forms)!

// ═══ PATTERN 2: URL-Synced Tabs ═══
// Sync active tab với URL hash/query param!

function useTabsWithURL(tabs) {
  const getTabFromURL = () => {
    const hash = window.location.hash.slice(1);
    const idx = tabs.findIndex((t) => t.id === hash);
    return idx >= 0 ? idx : 0;
  };

  const [activeTab, setActiveTab] = useState(getTabFromURL);

  const selectTab = useCallback(
    (index) => {
      setActiveTab(index);
      window.location.hash = tabs[index].id;
    },
    [tabs],
  );

  // Listen for back/forward navigation:
  useEffect(() => {
    const handler = () => setActiveTab(getTabFromURL());
    window.addEventListener("hashchange", handler);
    return () => window.removeEventListener("hashchange", handler);
  }, [tabs]);

  return { activeTab, selectTab };
}
// → URL: /page#settings → tab "settings" active!
// → Browser back/forward works! ✅
// → Shareable links! ✅

// ═══ PATTERN 3: Compound Components ═══

const TabsContext = React.createContext(null);

function TabsRoot({ children, defaultTab = 0 }) {
  const [active, setActive] = useState(defaultTab);
  return (
    <TabsContext.Provider value={{ active, setActive }}>
      {children}
    </TabsContext.Provider>
  );
}

function TabsList({ children }) {
  return <div role="tablist">{children}</div>;
}

function Tab({ index, children }) {
  const { active, setActive } = useContext(TabsContext);
  return (
    <button
      role="tab"
      aria-selected={active === index}
      onClick={() => setActive(index)}
    >
      {children}
    </button>
  );
}

function TabPanel({ index, children }) {
  const { active } = useContext(TabsContext);
  if (active !== index) return null;
  return <div role="tabpanel">{children}</div>;
}

// <TabsRoot defaultTab={0}>
//   <TabsList>
//     <Tab index={0}>General</Tab>
//     <Tab index={1}>Settings</Tab>
//   </TabsList>
//   <TabPanel index={0}><GeneralContent /></TabPanel>
//   <TabPanel index={1}><SettingsContent /></TabPanel>
// </TabsRoot>

// ═══ PATTERN 4: Animated Tab Transitions ═══
// Slide animation khi chuyển tab!

function AnimatedTabs({ tabs }) {
  const [activeTab, setActiveTab] = useState(0);
  const [direction, setDirection] = useState("right");
  const prevTab = useRef(0);

  const selectTab = (index) => {
    setDirection(index > prevTab.current ? "right" : "left");
    prevTab.current = index;
    setActiveTab(index);
  };

  return (
    <div>
      <div role="tablist">
        {tabs.map((t, i) => (
          <button key={i} onClick={() => selectTab(i)}>
            {t.label}
          </button>
        ))}
      </div>
      <div style={{ overflow: "hidden", position: "relative" }}>
        <div
          style={{
            transform: `translateX(${direction === "right" ? "-" : ""}5%)`,
            opacity: 0,
            animation: "slideIn 0.3s forwards",
          }}
        >
          {tabs[activeTab]?.content}
        </div>
      </div>
    </div>
  );
}
// CSS: @keyframes slideIn { to { transform: translateX(0); opacity: 1; } }
```

---

## §3.4 Tabs — Web Component

```javascript
// ═══ Web Component Tabs ═══

class MyTabs extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this._activeTab = 0;
    this._tabs = [];
  }

  connectedCallback() {
    // Đọc <tab-panel> children từ light DOM:
    const panels = this.querySelectorAll("tab-panel");

    this._tabs = Array.from(panels).map((panel, i) => ({
      label: panel.getAttribute("label") || `Tab ${i + 1}`,
      content: panel.innerHTML,
    }));

    this._activeTab = parseInt(this.getAttribute("active") || "0");
    this._render();
    this._setupEvents();
  }

  _render() {
    this.shadowRoot.innerHTML = `
      <style>
        :host { display: block; font-family: system-ui, sans-serif; }

        .tablist {
          display: flex; border-bottom: 2px solid #e2e8f0;
          gap: 0; margin: 0; padding: 0;
        }

        .tab {
          padding: 12px 24px; border: none;
          background: none; cursor: pointer;
          font-size: 15px; font-weight: 500;
          color: #718096; position: relative;
          transition: color 0.2s;
        }
        .tab:hover { color: #2d3748; }
        .tab[aria-selected="true"] {
          color: #3182ce; font-weight: 600;
        }
        .tab[aria-selected="true"]::after {
          content: ''; position: absolute;
          bottom: -2px; left: 0; right: 0;
          height: 2px; background: #3182ce;
        }

        .panel {
          padding: 20px; color: #4a5568; line-height: 1.6;
        }
      </style>

      <div class="tablist" role="tablist">
        ${this._tabs
          .map(
            (tab, i) => `
          <button class="tab" role="tab"
            aria-selected="${i === this._activeTab}"
            tabindex="${i === this._activeTab ? "0" : "-1"}"
            id="tab-${i}" aria-controls="panel-${i}">
            ${tab.label}
          </button>
        `,
          )
          .join("")}
      </div>

      ${this._tabs
        .map(
          (tab, i) => `
        <div class="panel" role="tabpanel"
          id="panel-${i}" aria-labelledby="tab-${i}"
          ${i !== this._activeTab ? "hidden" : ""}>
          ${tab.content}
        </div>
      `,
        )
        .join("")}
    `;
  }

  _setupEvents() {
    const tabs = this.shadowRoot.querySelectorAll(".tab");
    const panels = this.shadowRoot.querySelectorAll(".panel");

    tabs.forEach((tab, i) => {
      tab.addEventListener("click", () => this._selectTab(i));

      tab.addEventListener("keydown", (e) => {
        let newIndex = this._activeTab;
        if (e.key === "ArrowRight") newIndex = (i + 1) % tabs.length;
        else if (e.key === "ArrowLeft")
          newIndex = (i - 1 + tabs.length) % tabs.length;
        else if (e.key === "Home") newIndex = 0;
        else if (e.key === "End") newIndex = tabs.length - 1;
        else return;

        e.preventDefault();
        this._selectTab(newIndex);
        tabs[newIndex].focus();
      });
    });
  }

  _selectTab(index) {
    this._activeTab = index;
    const tabs = this.shadowRoot.querySelectorAll(".tab");
    const panels = this.shadowRoot.querySelectorAll(".panel");

    tabs.forEach((tab, i) => {
      tab.setAttribute("aria-selected", String(i === index));
      tab.setAttribute("tabindex", i === index ? "0" : "-1");
    });
    panels.forEach((panel, i) => {
      panel.hidden = i !== index;
    });

    this.dispatchEvent(
      new CustomEvent("tab-change", {
        detail: { index, label: this._tabs[index].label },
        bubbles: true,
      }),
    );
  }
}

customElements.define("my-tabs", MyTabs);
```

```html
<!-- Usage -->
<my-tabs active="0">
  <tab-panel label="Tổng quan">Nội dung tab 1...</tab-panel>
  <tab-panel label="Cài đặt">Nội dung tab 2...</tab-panel>
  <tab-panel label="Hỗ trợ">Nội dung tab 3...</tab-panel>
</my-tabs>

<script>
  document.querySelector("my-tabs").addEventListener("tab-change", (e) => {
    console.log("Tab changed:", e.detail); // { index: 1, label: 'Cài đặt' }
  });
</script>
```

---

## 📖 Deep Dive: Accessibility Patterns

### WAI-ARIA Roles

Mỗi component đều tuân theo **WAI-ARIA Design Patterns** — tiêu chuẩn accessibility quốc tế:

**Accordion**: `aria-expanded` trên header, `aria-controls` link đến panel, `role="region"` trên panel. Keyboard: Enter/Space toggle, Arrow keys navigate headers.

**Star Rating**: `role="radiogroup"` trên container, `role="radio"` + `aria-checked` trên mỗi star. Keyboard: Arrow keys thay đổi rating.

**Tabs**: `role="tablist"` container, `role="tab"` trên buttons, `role="tabpanel"` trên panels. Keyboard: Arrow keys switch tabs, Home/End, Tab key moves focus into panel.

### max-height Trick (Accordion Animation)

CSS `height: auto` không animate được! Trick: dùng `max-height` với giá trị cụ thể từ `scrollHeight` — khi mở, set `max-height = scrollHeight`; khi đóng, set `max-height = 0`. Transition trên `max-height` tạo animation smooth.

---

# 🎤 RADIO Interview Walkthrough — Part 1

> Pattern **RADIO**: **R**equirements → **A**rchitecture → **D**esign → **I**mplementation → **O**ptimization
> Mỗi component sẽ được phân tích theo pattern này, giống như cách bạn trả lời trong interview!

---

## 🎤 RADIO: Accordion

### R — Requirements (Làm rõ yêu cầu)

> 🗣 **Think out loud**: "Trước khi code, tôi cần hỏi interviewer vài câu để hiểu rõ scope..."

**Câu hỏi tôi sẽ hỏi interviewer:**

1. **Single hay multi expand?** — Chỉ 1 panel mở cùng lúc, hay nhiều panels?
   - → Nếu cả 2, tôi sẽ thiết kế config `singleOpen` prop
2. **Có cần animation không?** — Smooth transition hay instant show/hide?
   - → Nếu có, tôi sẽ dùng `max-height` trick thay vì `display: none`
3. **Accessibility level?** — Basic hay full WAI-ARIA compliance?
   - → Full: cần `aria-expanded`, `aria-controls`, keyboard navigation
4. **Controlled hay uncontrolled?** — Parent quản lý state hay component tự quản lý?
   - → Cả 2: design pattern Controlled/Uncontrolled
5. **Có pre-opened items không?** — Một số sections mở sẵn khi load?

> 🗣 "Okay, vậy tôi cần: single/multi mode, smooth animation, full accessibility, controlled/uncontrolled support."

### A — Architecture (Kiến trúc tổng quát)

> 🗣 "Bây giờ tôi sẽ phác thảo kiến trúc tổng quan trước khi đi vào chi tiết..."

```
KIẾN TRÚC ACCORDION:
═══════════════════════════════════════════════════════

  Component Tree:
  ┌─ Accordion (container!)
  │   ├── state: openItems (Set<number>)
  │   ├── prop: singleOpen (boolean!)
  │   │
  │   ├─ AccordionItem[0]
  │   │   ├── AccordionHeader (button! clickable!)
  │   │   │     ├── aria-expanded={isOpen}
  │   │   │     ├── aria-controls="panel-0"
  │   │   │     └── onClick → toggle(0)
  │   │   └── AccordionPanel
  │   │         ├── id="panel-0"
  │   │         ├── role="region"
  │   │         └── max-height animation!
  │   │
  │   └─ AccordionItem[1]
  │       ├── AccordionHeader ...
  │       └── AccordionPanel ...

  State Flow:
  click header → toggle(index) → update openItems
  → if singleOpen: clear others first!
  → re-render: panels expand/collapse via max-height!

  Vấn đề chính cần giải quyết:
  1. State management: Set vs Array vs Object?
     → Set! O(1) lookup has(), add(), delete()
  2. Animation: height:auto không animate được!
     → Trick: max-height + scrollHeight
  3. Keyboard: Arrow keys navigate giữa headers
     → Roving tabindex pattern
```

> 🗣 "Tôi chọn `Set` cho `openItems` vì O(1) lookup — tốt hơn Array filter O(n). Animation dùng `max-height` trick vì CSS không transition `height: auto`."

#### 📖 Deep Dive: Animation cho Accordion — Giải thích từ đầu

**Bài toán**: Khi click header, panel phải từ từ mở ra (không nhảy cóc). Làm sao?

---

**Bước 1 — Thử cách đơn giản nhất: `display: none/block`**

```css
.panel {
  display: none;
} /* ẩn */
.panel.open {
  display: block;
} /* hiện */
```

Kết quả: content **xuất hiện ngay lập tức** — không có animation. Vì `display` KHÔNG THỂ transition.

---

**Bước 2 — Thử dùng `height` + transition**

```css
.panel {
  height: 0; /* đóng = cao 0px */
  overflow: hidden; /* ẩn content tràn ra ngoài */
  transition: height 0.3s; /* animate height! */
}
.panel.open {
  height: auto; /* mở = cao vừa đủ content */
}
```

Kết quả: **VẪN NHẢY CÓC!** Tại sao?

Vì CSS transition hoạt động thế này: browser cần tính mỗi frame trung gian.

```
height: 0px → height: 300px   ← 2 con số! Browser tính được:
  frame 1: 0px
  frame 2: 50px
  frame 3: 100px
  frame 4: 150px     ← đây là ANIMATION!
  frame 5: 200px
  frame 6: 300px

height: 0px → height: auto    ← "auto" KHÔNG PHẢI SỐ!
  Browser: "auto là mấy pixel? Tôi không biết!"
  → Bỏ qua transition, nhảy thẳng!
```

> 💡 **Quy tắc CSS**: transition chỉ hoạt động giữa 2 giá trị **SỐ CỤ THỂ**.
> `auto`, `none`, `initial` — đều KHÔNG phải số → không animate!

---

**Bước 3 — Hardcode height bằng số cụ thể?**

```css
.panel.open {
  height: 500px; /* thay "auto" bằng số! */
}
```

Kết quả: **animation works!** Nhưng có vấn đề mới...

- Content thực tế chỉ 120px → thừa 380px khoảng trống bên dưới! 😬
- Mỗi panel content khác nhau → không thể hardcode 1 con số!

---

**Bước 4 — Dùng `max-height` thay vì `height`**

Đây là trick! `height` và `max-height` khác nhau:

```
height: 500px
→ Element LUÔN LUÔN cao 500px, dù content chỉ 100px
→ 400px bị trống!

max-height: 500px
→ Element cao TỐI ĐA 500px
→ Nếu content chỉ 100px → element chỉ cao 100px!
→ Nếu content 800px → bị cắt ở 500px
```

Vậy ta dùng `max-height` vì **khi mở xong, element tự co theo content**:

```css
.panel {
  max-height: 0; /* đóng = tối đa 0px = ẩn! */
  overflow: hidden; /* ẩn phần content tràn */
  transition: max-height 0.35s ease;
}
.panel.open {
  max-height: 9999px; /* tối đa 9999px = "mở hết"! */
}
```

Kết quả: **animation works!** 🎉 Nhưng... animation hơi lag.

Tại sao? Vì browser animate từ `0px → 9999px` trong 0.35 giây.
Content chỉ 120px = hiện xong ở frame đầu tiên, nhưng animation
vẫn tiếp tục chạy "ảo" từ 120px → 9999px suốt 0.34 giây còn lại!

---

**Bước 5 — `scrollHeight` giải quyết tất cả!**

`scrollHeight` là một **JavaScript property** (không phải CSS!). Nó cho biết **chiều cao THẬT** của content bên trong 1 element:

```html
<div id="panel" style="overflow:hidden; max-height:0;">
  <p>Hello World!</p>
  <!-- giả sử đoạn text -->
  <p>Đây là paragraph 2</p>
  <!-- tổng cộng cao 137px -->
</div>

<script>
  const panel = document.getElementById("panel");
  console.log(panel.scrollHeight); // 137 !!!
  // Browser tự đo: "content bên trong cao 137px"
  // Dù panel đang max-height:0, scrollHeight VẪN = 137!
  // Vì scrollHeight đo TOÀN BỘ content, kể cả phần bị ẩn!
</script>
```

Bây giờ ta kết hợp: **JavaScript đọc `scrollHeight`** → đặt vào **CSS `max-height`**:

```javascript
// KHI MỞ:
const realHeight = panel.scrollHeight; // JS đọc: 137!
panel.style.maxHeight = realHeight + "px";
// CSS transition: max-height 0px → 137px
// = animation VỪA KHÍT, không thừa, không thiếu! ✅

// KHI ĐÓNG:
panel.style.maxHeight = "0";
// CSS transition: max-height 137px → 0px
// = animation đóng lại smooth! ✅
```

---

**Tóm tắt toàn bộ flow:**

```
NÊN LÀM (max-height + scrollHeight):
═══════════════════════════════════════════════

  Ban đầu (đóng):
  ┌──────────────────┐  max-height: 0px
  │                  │  overflow: hidden
  └──────────────────┘  → Không thấy gì!
  (content vẫn ở trong, chỉ bị ẩn!)

  User click header:
  → JS đọc: panel.scrollHeight = 137
  → JS set:  panel.style.maxHeight = '137px'

  CSS transition chạy (0.35 giây):
  ┌──────────────────┐  max-height: 0px     (frame 1)
  │██                │  max-height: 20px    (frame 2)
  │████              │  max-height: 50px    (frame 3)
  │████████          │  max-height: 90px    (frame 4)
  │██████████████    │  max-height: 120px   (frame 5)
  │████████████████  │  max-height: 137px   (frame 6) ✨ DONE!
  └──────────────────┘

  User click lại (đóng):
  → JS set: panel.style.maxHeight = '0'
  → CSS transition: 137px → 0px (thu lại!)

KHÔNG NÊN LÀM:
═══════════════
  ❌ height: auto     → không animate được!
  ❌ max-height: 9999px → animate thừa, feel bị lag!
  ❌ display: none     → không transition được!
```

**Trong React, code tương ứng:**

```javascript
function AccordionPanel({ isOpen, children }) {
  const contentRef = useRef(null); // ref để đọc scrollHeight!
  const [maxHeight, setMaxHeight] = useState(0);

  useEffect(() => {
    if (isOpen && contentRef.current) {
      // isOpen = true → đọc scrollHeight → set max-height!
      setMaxHeight(contentRef.current.scrollHeight);
    } else {
      // isOpen = false → max-height = 0 → đóng lại!
      setMaxHeight(0);
    }
  }, [isOpen]);

  return (
    <div
      style={{
        maxHeight: `${maxHeight}px`, // 0 hoặc scrollHeight!
        overflow: "hidden", // ẩn content tràn!
        transition: "max-height 0.35s", // animate!
      }}
    >
      {/* ref ở INNER div vì outer div có overflow:hidden
          → scrollHeight outer = 0 (bị cắt!)
          → scrollHeight inner = 137 (đúng!) */}
      <div ref={contentRef}>{children}</div>
    </div>
  );
}
```

> ⚠️ **Tại sao ref ở inner div?** Outer div có `overflow: hidden` + `max-height: 0` → `scrollHeight` của nó = 0! Inner div KHÔNG có overflow → `scrollHeight` = chiều cao thật của content!

### D — Design (Thiết kế API)

> 🗣 "Tôi sẽ thiết kế API trước — component nhận props gì, trả về gì..."

```javascript
// API Design:

// 1. Simple usage:
<Accordion items={items} singleOpen={true} />

// 2. Custom hook tách logic:
const { toggle, isOpen } = useAccordion(count, singleOpen);
// → Reusable: logic tách khỏi UI!
// → Testable: test hook riêng, không cần render!

// 3. Props interface:
interface AccordionProps {
  items: Array<{ title: string; content: ReactNode }>;
  singleOpen?: boolean;    // default: true
  defaultOpen?: number[];  // pre-opened indices
  onChange?: (openItems: number[]) => void;  // callback
}
```

> 🗣 "Custom hook `useAccordion` tách state logic — test được mà không cần render component. `onChange` callback cho controlled mode."

### I — Implementation (Triển khai)

> 🗣 "Okay bắt đầu code. Tôi sẽ đi từ hook → component con → component chính..."

**Bước 1 — Hook quản lý state:**

```javascript
// Tại sao dùng Set? → O(1) has/add/delete!
// Tại sao useCallback? → Stable reference, tránh re-render con!
function useAccordion(itemCount, singleOpen = true) {
  const [openItems, setOpenItems] = useState(new Set());

  const toggle = useCallback(
    (index) => {
      setOpenItems((prev) => {
        const next = new Set(prev); // immutable update!
        if (next.has(index)) {
          next.delete(index); // đóng nếu đang mở
        } else {
          if (singleOpen) next.clear(); // single: đóng hết!
          next.add(index); // mở item mới
        }
        return next;
      });
    },
    [singleOpen],
  );

  // Tại sao return function thay vì boolean?
  // → isOpen(0) dễ đọc hơn openItems.has(0)!
  const isOpen = useCallback((i) => openItems.has(i), [openItems]);

  return { toggle, isOpen };
}
```

> 🗣 "Chú ý: `new Set(prev)` — tạo Set mới để trigger re-render! Nếu mutate Set cũ, React không detect change."

**Bước 2 — Panel component (animation!):**

```javascript
// TẠI SAO max-height mà không dùng height?
// → CSS KHÔNG THỂ transition height: auto!
// → max-height: 0 → max-height: scrollHeight = smooth!
// → scrollHeight = chiều cao thực của content!
function AccordionPanel({ isOpen, children }) {
  const ref = useRef(null);
  const [maxHeight, setMaxHeight] = useState(0);

  useEffect(() => {
    if (isOpen && ref.current) {
      setMaxHeight(ref.current.scrollHeight);
      // scrollHeight = full content height kể cả overflow!
    } else {
      setMaxHeight(0);
    }
  }, [isOpen]);

  return (
    <div
      style={{
        maxHeight: `${maxHeight}px`,
        overflow: "hidden",
        transition: "max-height 0.35s ease",
        // ease = bắt đầu nhanh, kết thúc chậm → feel tự nhiên!
      }}
    >
      <div ref={ref}>{children}</div>
    </div>
  );
}
```

> 🗣 "Gotcha: `scrollHeight` chỉ chính xác khi content đã render. Nên ref gắn vào inner div, không phải outer div có `overflow: hidden`."

**Bước 3 — Keyboard navigation:**

```javascript
// WAI-ARIA Accordion Pattern:
// Enter/Space = toggle
// ↑/↓ = navigate headers
// Home/End = first/last header

const handleKeyDown = (e, index, totalHeaders) => {
  switch (e.key) {
    case "ArrowDown":
      e.preventDefault();
      // Wrap around: cuối → đầu!
      focusHeader((index + 1) % totalHeaders);
      break;
    case "ArrowUp":
      e.preventDefault();
      focusHeader((index - 1 + totalHeaders) % totalHeaders);
      break;
    case "Home":
      e.preventDefault();
      focusHeader(0);
      break;
    case "End":
      e.preventDefault();
      focusHeader(totalHeaders - 1);
      break;
    // Enter/Space đã handled bởi button click event!
  }
};
```

> 🗣 "Modulo trick: `(index - 1 + total) % total` — tránh index âm khi ở header đầu tiên nhấn ArrowUp!"

### O — Optimization (Tối ưu hóa)

> 🗣 "Cuối cùng, tôi sẽ nói về các cách tối ưu..."

1. **`React.memo` cho AccordionItem** — chỉ re-render item thay đổi, không phải tất cả!
2. **`useCallback` cho toggle** — stable reference, tránh child re-render
3. **Lazy content**: Render content chỉ khi panel mở lần đầu (như LazyTabs pattern)
4. **CSS `will-change: max-height`** — hint cho browser pre-allocate layer cho animation
5. **ResizeObserver** — update `maxHeight` khi content thay đổi kích thước dynamically
6. **Virtual Accordion** — nếu 100+ items, chỉ render visible items (intersection observer)

---

## 🎤 RADIO: Star Rating

### R — Requirements

> 🗣 "Để tôi clarify requirements trước..."

1. **Click to rate** — 1-5 sao (hoặc custom max)
2. **Hover preview** — preview rating trước khi click
3. **Half-star?** — Có cần support nửa sao không?
4. **Read-only mode?** — Hiển thị rating mà không cho edit
5. **Controlled hay uncontrolled?** — Parent quản lý value?
6. **Accessibility?** — Screen reader đọc được "3 trên 5 sao"?
7. **Form integration?** — Sử dụng trong form submission?

> 🗣 "Tôi sẽ build full-featured: hover, half-star optional, controlled/uncontrolled, full a11y."

### A — Architecture

```
KIẾN TRÚC STAR RATING:
═══════════════════════════════════════════════════════

  ┌─ StarRating (container!)
  │   ├── role="radiogroup"
  │   ├── aria-label="Đánh giá sản phẩm"
  │   ├── state: rating (number!)
  │   ├── state: hoverRating (number, 0 = no hover!)
  │   │
  │   ├─ Star[1] (role="radio")
  │   │   ├── aria-checked={rating >= 1}
  │   │   ├── onClick → setRating(1)
  │   │   ├── onMouseEnter → setHoverRating(1)
  │   │   └── visual: filled nếu (hoverRating || rating) >= 1
  │   │
  │   ├─ Star[2] ...
  │   ├─ Star[3] ...
  │   ├─ Star[4] ...
  │   └─ Star[5] ...
  │
  └── onMouseLeave → setHoverRating(0) (reset hover!)

  State Priority:
  hoverRating > 0 ? hoverRating : rating
  → Hover luôn ưu tiên hiển thị hơn rating!

  Quyết định thiết kế:
  • Dùng <button> không phải <span> → focusable, clickable!
  • radiogroup pattern → screen reader hiểu là options!
  • Tách Star component → React.memo từng star!
```

> 🗣 "Key insight: `activeRating = hoverRating || rating` — khi hover, show preview; khi không hover, show actual rating. Simple nhưng cover mọi case!"

### D — Design

```javascript
// API Design:
<StarRating maxStars={5} onChange={(val) => console.log(val)} />
<StarRating maxStars={5} initialRating={4} readonly />
<StarRating value={form.rating} onChange={(v) => setForm({...form, rating: v})} />

// Hook API:
const { rating, hoverRating, handleClick, handleHover, handleLeave } =
  useStarRating(maxStars, initialRating);
```

### I — Implementation

> 🗣 "Bước quan trọng nhất: xác định visual state cho mỗi star..."

```javascript
// CÂU HỎI: Làm sao biết star nào filled, star nào empty?
// TRẢ LỜI: So sánh index với activeRating!

// Logic cốt lõi:
const activeRating = hoverRating || rating;
// star index 1: filled nếu activeRating >= 1
// star index 3: filled nếu activeRating >= 3
// → Tất cả stars từ 1 đến activeRating = filled!
// → Còn lại = empty!

// TẠI SAO dùng onMouseEnter trên MỖI star thay vì onMouseMove trên container?
// → onMouseEnter fire 1 lần khi enter star → ít events hơn!
// → onMouseMove fire liên tục → quá nhiều re-renders!
// → NHƯNG nếu cần half-star, phải dùng onMouseMove + getBoundingClientRect!

// HALF-STAR TRICK:
const handleHover = (e, starIndex) => {
  const rect = e.currentTarget.getBoundingClientRect();
  const clickX = e.clientX - rect.left;
  const isLeftHalf = clickX < rect.width / 2;
  // Click bên trái = 0.5, bên phải = 1.0!
  setHoverRating(isLeftHalf ? starIndex - 0.5 : starIndex);
};

// Visual cho half-star:
// Dùng CSS clip hoặc overlay span với width percentage!
// fillPercent = rating >= value ? 100 : rating >= value-0.5 ? 50 : 0
```

> 🗣 "Half-star detect bằng `getBoundingClientRect` — so sánh click position với center của star. Left half = 0.5!"

### O — Optimization

1. **`React.memo(Star)`** — 5 stars nhưng chỉ 1-2 thay đổi khi hover
2. **Debounce hover** — nếu mouse lướt nhanh, không cần update mỗi star
3. **useCallback cho handlers** — stable reference tránh Star re-render
4. **SVG thay Unicode** — `★` render khác nhau trên OS; SVG consistent
5. **Touch support** — mobile cần `onTouchStart/Move` thay mouse events

---

## 🎤 RADIO: Tabs

### R — Requirements

> 🗣 "Tabs trông đơn giản nhưng có nhiều edge cases..."

1. **Có bao nhiêu tabs?** — Fixed hay dynamic (add/remove)?
2. **Tab content nặng không?** — Có cần lazy load?
3. **URL sync?** — Deep link vào tab cụ thể?
4. **Keyboard navigation?** — WAI-ARIA Tabs pattern
5. **Responsive?** — Tabs overflow trên mobile → scroll hay dropdown?
6. **Keep mounted hay unmount?** — Tab content giữ state khi switch?
7. **Animation khi switch?** — Slide, fade, hay instant?

### A — Architecture

```
KIẾN TRÚC TABS:
═══════════════════════════════════════════════════════

  ┌─ Tabs (container!)
  │   ├── state: activeTab (number!)
  │   │
  │   ├─ TabList (role="tablist!")
  │   │   ├── Tab[0] (role="tab", aria-selected=true)
  │   │   │     ├── tabindex="0"  ← ACTIVE: focusable!
  │   │   │     └── aria-controls="panel-0"
  │   │   ├── Tab[1] (role="tab", aria-selected=false)
  │   │   │     ├── tabindex="-1" ← INACTIVE: skip!
  │   │   │     └── aria-controls="panel-1"
  │   │   └── Tab[2] ...
  │   │
  │   └─ TabPanel[activeTab] (role="tabpanel!")
  │         ├── id="panel-{activeTab}"
  │         └── aria-labelledby="tab-{activeTab}"

  ROVING TABINDEX — Key concept!
  ═════════════════════════════
  • Chỉ active tab có tabindex="0"!
  • Các tab khác: tabindex="-1"!
  • Khi Tab key: skip trực tiếp vào panel!
  • Khi Arrow keys: di chuyển giữa tabs!

  Tại sao?
  → User nhấn Tab: focus vào tablist → tab active
  → Nhấn Tab lần nữa: skip vào panel content
  → KHÔNG phải tab qua từng tab button!
  → Arrow keys để navigate giữa tabs!
```

> 🗣 "Roving tabindex là điểm quan trọng nhất! Chỉ 1 tab có tabindex=0, còn lại -1. User dùng Arrow keys để navigate, Tab key để vào content. Đây là WAI-ARIA standard."

### D — Design

```javascript
// Quyết định quan trọng: Render strategy!

// Option 1: Unmount inactive panels
// + Ít DOM nodes, light!
// - Mất state khi switch (form inputs reset!)
{
  activeTab === 0 && <Panel0 />;
}

// Option 2: Hide bằng CSS (display:none)
// + Giữ state! Form inputs preserved!
// - Nhiều DOM nodes hơn!
<div style={{ display: activeTab === 0 ? "block" : "none" }}>
  <Panel0 />
</div>;

// Option 3: Lazy + Keep mounted (BEST!)
// + Lazy render lần đầu, sau đó keep mounted!
// + Tối ưu cả performance và state preservation!
{
  loadedTabs.has(i) && (
    <div style={{ display: i === activeTab ? "block" : "none" }}>
      {tabs[i].content}
    </div>
  );
}
```

> 🗣 "Tôi chọn Option 3: lazy render + keep mounted. Tốt nhất cho cả performance (không render content chưa cần) và UX (giữ state form khi switch)."

### I — Implementation

> 🗣 "Focus vào keyboard navigation — phần phức tạp nhất..."

```javascript
// Keyboard handler cho tablist:
const handleKeyDown = (e) => {
  const total = tabs.length;
  let newIndex = activeTab;

  switch (e.key) {
    case "ArrowRight":
      // Wrap: cuối → đầu! (circular navigation!)
      newIndex = (activeTab + 1) % total;
      break;
    case "ArrowLeft":
      // Wrap: đầu → cuối!
      newIndex = (activeTab - 1 + total) % total;
      break;
    case "Home":
      newIndex = 0;
      break;
    case "End":
      newIndex = total - 1;
      break;
    default:
      return; // QUAN TRỌNG: không preventDefault cho keys khác!
    // Nếu preventDefault cho tất cả → Tab key bị block!
  }

  e.preventDefault();
  onSelect(newIndex);
  // Focus vào tab mới:
  tabRefs.current[newIndex]?.focus();
  // TẠI SAO focus programmatically?
  // → tabindex="-1" nghĩa là Tab key skip nó
  // → Nhưng .focus() vẫn work! Chỉ Tab key bị skip!
};
```

> 🗣 "Subtlety: `tabindex="-1"` không có nghĩa unfocusable! Nó chỉ nghĩa Tab key skip. `.focus()` vẫn work. Đây là cơ chế roving tabindex!"

### O — Optimization

1. **Lazy rendering** — Chỉ render tab content khi active lần đầu
2. **`React.memo` cho TabPanel** — Không re-render panel khi props không đổi
3. **URL hash sync** — Deep linking: `#settings` → tab settings active
4. **Prefetch** — Hover trên tab → prefetch data (React Router `prefetch`)
5. **Responsive**: Tab overflow → horizontal scroll với `scroll-snap`
6. **Transition**: `key` prop trên panel → trigger CSS animation khi switch

---

## Checklist Part 1

```
[ ] Accordion: single/multi mode, max-height animation!
[ ] Accordion: aria-expanded, aria-controls, keyboard nav!
[ ] Star Rating: click, hover preview, keyboard arrows!
[ ] Star Rating: aria-checked, role="radiogroup"!
[ ] Tabs: aria-selected, Arrow keys, Home/End!
[ ] Tabs: tabindex roving (0 cho active, -1 cho inactive)!
[ ] Tất cả: Vanilla JS class-based + React hooks-based!
[ ] Tất cả: RADIO walkthrough (R→A→D→I→O)!
TIẾP THEO → Part 2: Tooltip, Dialog, Table!
```
