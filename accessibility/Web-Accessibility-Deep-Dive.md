# Web Accessibility (a11y) — Deep Dive!

> **Chủ đề**: What is web accessibility, and why is it important?
> **Ngôn ngữ**: Tiếng Việt — giải thích cực kỳ chi tiết!
> **Phương châm**: Tự viết lại bằng tay — KHÔNG dùng thư viện!

---

## Mục Lục

1. [§1. Web Accessibility Là Gì?](#1)
2. [§2. Tại Sao Quan Trọng? — 7 Lý Do!](#2)
3. [§3. WCAG — Tiêu Chuẩn Accessibility!](#3)
4. [§4. Assistive Technologies — Công Nghệ Hỗ Trợ!](#4)
5. [§5. Tự Viết — Semantic HTML & ARIA!](#5)
6. [§6. Tự Viết — Keyboard Navigation!](#6)
7. [§7. Tự Viết — Accessibility Audit Tool!](#7)
8. [§8. React & Accessibility!](#8)
9. [§9. Tổng Kết & Câu Hỏi Phỏng Vấn!](#9)

---

## §1. Web Accessibility Là Gì?

```
  WEB ACCESSIBILITY (a11y):
  ┌────────────────────────────────────────────────────────┐
  │                                                        │
  │  ĐỊNH NGHĨA:                                          │
  │  ┌──────────────────────────────────────────────────┐  │
  │  │  Web Accessibility = thiết kế & phát triển web   │  │
  │  │  để MỌI NGƯỜI đều có thể sử dụng được,          │  │
  │  │  BẤT KỂ khả năng thể chất hay nhận thức!        │  │
  │  │                                                  │  │
  │  │  "a11y" = a + 11 ký tự + y = "accessibility"    │  │
  │  └──────────────────────────────────────────────────┘  │
  │                                                        │
  │  AI CẦN ACCESSIBILITY?                                 │
  │  ┌──────────────────────────────────────────────────┐  │
  │  │  👁️ Khiếm thị:                                   │  │
  │  │  → Mù hoàn toàn → dùng Screen Reader            │  │
  │  │  → Nhìn kém → phóng to, high contrast            │  │
  │  │  → Mù màu → không phân biệt đỏ/xanh             │  │
  │  │                                                  │  │
  │  │  👂 Khiếm thính:                                  │  │
  │  │  → Điếc → cần phụ đề video, visual alerts       │  │
  │  │                                                  │  │
  │  │  🖐️ Vận động:                                     │  │
  │  │  → Không dùng chuột → keyboard navigation       │  │
  │  │  → Run tay → target click lớn hơn               │  │
  │  │                                                  │  │
  │  │  🧠 Nhận thức:                                    │  │
  │  │  → Khó đọc (dyslexia) → font rõ ràng            │  │
  │  │  → Khó tập trung → layout đơn giản              │  │
  │  │  → Động kinh → tránh flash/nhấp nháy            │  │
  │  │                                                  │  │
  │  │  📱 Tình huống tạm thời:                          │  │
  │  │  → Tay bị thương → dùng keyboard                │  │
  │  │  → Ngoài nắng → cần contrast cao                │  │
  │  │  → Nơi ồn ào → cần phụ đề                      │  │
  │  │  → Internet chậm → cần alt text thay ảnh        │  │
  │  └──────────────────────────────────────────────────┘  │
  │                                                        │
  │  THỐNG KÊ:                                             │
  │  → 15-20% dân số thế giới có khuyết tật nào đó!     │
  │  → ~1 tỷ người!                                      │
  │  → = thị trường KHỔNG LỒ bị bỏ quên!                │
  │                                                        │
  └────────────────────────────────────────────────────────┘
```

---

## §2. Tại Sao Quan Trọng? — 7 Lý Do!

```
  7 LÝ DO ACCESSIBILITY QUAN TRỌNG:
  ┌────────────────────────────────────────────────────────┐
  │                                                        │
  │  ① QUYỀN CON NGƯỜI:                                   │
  │  → Internet là nhu cầu thiết yếu (UN Convention)     │
  │  → Mọi người có quyền truy cập thông tin             │
  │  → Loại trừ = phân biệt đối xử!                     │
  │                                                        │
  │  ② PHÁP LUẬT:                                         │
  │  → ADA (Mỹ) — bắt buộc accessible!                  │
  │  → EU Accessibility Act (Châu Âu)                    │
  │  → Không tuân thủ → bị kiện! (ví dụ: Domino's Pizza)│
  │                                                        │
  │  ③ THỊ TRƯỜNG LỚN:                                    │
  │  → 1 tỷ người khuyết tật = khách hàng tiềm năng!   │
  │  → Accessible → nhiều user hơn → nhiều revenue hơn! │
  │                                                        │
  │  ④ SEO TỐT HƠN:                                      │
  │  → Semantic HTML → Google hiểu content tốt hơn      │
  │  → Alt text → Google index ảnh                      │
  │  → Heading structure → ranking tốt hơn              │
  │                                                        │
  │  ⑤ UX TỐT HƠN CHO MỌI NGƯỜI:                         │
  │  → Keyboard nav → power users yêu thích!            │
  │  → Clear labels → ai cũng hiểu nhanh hơn!           │
  │  → Good contrast → dễ đọc trong mọi điều kiện!      │
  │                                                        │
  │  ⑥ TRÁCH NHIỆM ĐẠO ĐỨC:                              │
  │  → Web là cho tất cả mọi người!                      │
  │  → "The power of the Web is in its universality"     │
  │  │  — Tim Berners-Lee (người tạo WWW)                │
  │                                                        │
  │  ⑦ CHẤT LƯỢNG CODE TỐT HƠN:                           │
  │  → Semantic HTML = clean code                        │
  │  → Testable = dễ viết automated tests               │
  │  → Maintainable = dễ bảo trì dài hạn!               │
  │                                                        │
  └────────────────────────────────────────────────────────┘
```

---

## §3. WCAG — Tiêu Chuẩn Accessibility!

```
  WCAG — WEB CONTENT ACCESSIBILITY GUIDELINES:
  ┌────────────────────────────────────────────────────────┐
  │                                                        │
  │  WCAG do W3C (World Wide Web Consortium) ban hành.    │
  │  Phiên bản hiện tại: WCAG 2.1 (2018), 2.2 (2023)    │
  │                                                        │
  │  4 NGUYÊN TẮC CỐT LÕI (POUR):                        │
  │  ┌──────────────────────────────────────────────────┐  │
  │  │                                                  │  │
  │  │  P — PERCEIVABLE (Nhận biết được):               │  │
  │  │  → User PHẢI nhận biết được nội dung!           │  │
  │  │  → Alt text cho ảnh                             │  │
  │  │  → Phụ đề cho video                             │  │
  │  │  → Contrast đủ cao                              │  │
  │  │  → Không chỉ dùng màu để truyền thông tin      │  │
  │  │                                                  │  │
  │  │  O — OPERABLE (Thao tác được):                   │  │
  │  │  → User PHẢI thao tác được với UI!              │  │
  │  │  → Keyboard navigation cho mọi thứ             │  │
  │  │  → Đủ thời gian để đọc/tương tác               │  │
  │  │  → Không gây seizure (nhấp nháy)               │  │
  │  │  → Skip navigation links                       │  │
  │  │                                                  │  │
  │  │  U — UNDERSTANDABLE (Hiểu được):                 │  │
  │  │  → User PHẢI hiểu được nội dung & UI!           │  │
  │  │  → Ngôn ngữ trang rõ ràng (lang attribute)      │  │
  │  │  → Navigation nhất quán                         │  │
  │  │  → Error messages rõ ràng, hướng dẫn sửa       │  │
  │  │  → Labels cho form inputs                       │  │
  │  │                                                  │  │
  │  │  R — ROBUST (Mạnh mẽ):                           │  │
  │  │  → Content phải tương thích với nhiều tools!    │  │
  │  │  → Valid HTML                                   │  │
  │  │  → ARIA đúng cách                               │  │
  │  │  → Hoạt động với screen readers, braille...     │  │
  │  │                                                  │  │
  │  └──────────────────────────────────────────────────┘  │
  │                                                        │
  │  3 MỨC ĐỘ TUÂN THỦ:                                   │
  │  ┌──────────────────────────────────────────────────┐  │
  │  │  Level A   — TỐI THIỂU (phải có!)               │  │
  │  │  Level AA  — KHUYẾN NGHỊ (tiêu chuẩn chung!)    │  │
  │  │  Level AAA — TỐI ĐA (lý tưởng, khó đạt 100%)   │  │
  │  │                                                  │  │
  │  │  Hầu hết luật pháp yêu cầu Level AA!            │  │
  │  └──────────────────────────────────────────────────┘  │
  │                                                        │
  └────────────────────────────────────────────────────────┘
```

---

## §4. Assistive Technologies — Công Nghệ Hỗ Trợ!

```
  ASSISTIVE TECHNOLOGIES:
  ┌────────────────────────────────────────────────────────┐
  │                                                        │
  │  SCREEN READERS — đọc màn hình:                        │
  │  ┌──────────────────────────────────────────────────┐  │
  │  │  Cách hoạt động:                                 │  │
  │  │                                                  │  │
  │  │  HTML DOM                                        │  │
  │  │    ↓                                             │  │
  │  │  Accessibility Tree (browser tạo từ DOM)         │  │
  │  │    ↓                                             │  │
  │  │  Screen Reader (NVDA, JAWS, VoiceOver)           │  │
  │  │    ↓                                             │  │
  │  │  Đọc thành giọng nói / Braille display           │  │
  │  │                                                  │  │
  │  │  VÍ DỤ:                                          │  │
  │  │  <button>Gửi đơn</button>                       │  │
  │  │  → Screen reader: "Gửi đơn, button"             │  │
  │  │                                                  │  │
  │  │  <div onclick="submit()">Gửi đơn</div>          │  │
  │  │  → Screen reader: "Gửi đơn" (KHÔNG biết là      │  │
  │  │    button! Không focus được! Không Enter được!)  │  │
  │  └──────────────────────────────────────────────────┘  │
  │                                                        │
  │  ACCESSIBILITY TREE:                                   │
  │  ┌──────────────────────────────────────────────────┐  │
  │  │  DOM Tree:              A11y Tree:               │  │
  │  │  <nav>                  navigation               │  │
  │  │    <ul>                   list (3 items)         │  │
  │  │      <li>                   listitem            │  │
  │  │        <a href>               link "Home"       │  │
  │  │  <main>                 main                    │  │
  │  │    <h1>                   heading level 1       │  │
  │  │    <img alt="mèo">       image "mèo"           │  │
  │  │    <img>                  (IGNORED — no alt!)    │  │
  │  │    <button>               button "Submit"       │  │
  │  │    <div onclick>          generic (LOST info!)   │  │
  │  └──────────────────────────────────────────────────┘  │
  │                                                        │
  │  KEYBOARD NAVIGATION:                                  │
  │  Tab → di chuyển giữa focusable elements              │
  │  Shift+Tab → di chuyển ngược                          │
  │  Enter/Space → activate button/link                   │
  │  Arrow keys → navigate menus, radio, select           │
  │  Escape → đóng modal/dropdown                         │
  │                                                        │
  └────────────────────────────────────────────────────────┘
```

---

## §5. Tự Viết — Semantic HTML & ARIA!

```javascript
// ═══════════════════════════════════════════════════════════
// SEMANTIC HTML vs DIV SOUP — SO SÁNH!
// ═══════════════════════════════════════════════════════════

// ❌ SAI — "Div Soup" (không accessible):
var bad_html =
  "" +
  '<div class="header">' +
  '  <div class="nav">' +
  '    <div class="nav-item" onclick="goHome()">Home</div>' +
  '    <div class="nav-item" onclick="goAbout()">About</div>' +
  "  </div>" +
  "</div>" +
  '<div class="main">' +
  '  <div class="title">Tiêu đề</div>' +
  '  <div class="image-box">' +
  '    <img src="cat.jpg">' + // Không alt!
  "  </div>" +
  '  <div class="btn" onclick="submit()">Gửi</div>' +
  "</div>";
// → Screen reader: "Home... About... Tiêu đề... Gửi..."
// → KHÔNG BIẾT đâu là nav, heading, button!
// → KHÔNG Tab focus được vào "button"!
// → KHÔNG Enter/Space để click!

// ✅ ĐÚNG — Semantic HTML:
var good_html =
  "" +
  "<header>" +
  '  <nav aria-label="Main navigation">' +
  "    <ul>" +
  '      <li><a href="/">Home</a></li>' +
  '      <li><a href="/about">About</a></li>' +
  "    </ul>" +
  "  </nav>" +
  "</header>" +
  "<main>" +
  "  <h1>Tiêu đề</h1>" +
  '  <img src="cat.jpg" alt="Mèo cam ngồi trên bàn">' +
  '  <button type="submit">Gửi</button>' +
  "</main>";
// → Screen reader: "Main navigation, list 2 items,
//   link Home, link About... heading level 1 Tiêu đề...
//   image Mèo cam ngồi trên bàn... button Gửi"
// → Tab focus vào links và button!
// → Enter để activate!

// ═══════════════════════════════════════════════════════════
// ARIA — ACCESSIBLE RICH INTERNET APPLICATIONS!
// ═══════════════════════════════════════════════════════════

// ARIA bổ sung thông tin accessibility khi HTML không đủ:
// Quy tắc #1: Nếu có thể dùng semantic HTML → DÙNG HTML!
//             Chỉ dùng ARIA khi HTML không đủ!

// ① ARIA ROLES — vai trò:
var aria_roles = {
  // Landmark roles (vùng):
  'role="banner"': "= <header>",
  'role="navigation"': "= <nav>",
  'role="main"': "= <main>",
  'role="contentinfo"': "= <footer>",
  'role="complementary"': "= <aside>",

  // Widget roles (tương tác):
  'role="button"': "element hoạt động như button",
  'role="tab"': "tab trong tab panel",
  'role="tabpanel"': "nội dung của tab",
  'role="dialog"': "modal/dialog box",
  'role="alert"': "thông báo quan trọng",
  'role="progressbar"': "thanh tiến trình",
  'role="tooltip"': "tooltip popup",
};

// ② ARIA PROPERTIES — thuộc tính bổ sung:
var aria_examples =
  "" +
  // aria-label: nhãn cho element không có text:
  '<button aria-label="Đóng">' +
  "  <svg><!-- icon X --></svg>" +
  "</button>" +
  // → Screen reader: "Đóng, button"

  // aria-labelledby: nhãn từ element khác:
  '<h2 id="section-title">Sản Phẩm</h2>' +
  '<ul aria-labelledby="section-title">...</ul>' +
  // aria-describedby: mô tả bổ sung:
  '<input aria-describedby="help-text">' +
  '<span id="help-text">Mật khẩu ít nhất 8 ký tự</span>' +
  // aria-expanded: trạng thái mở/đóng:
  '<button aria-expanded="false" aria-controls="menu">' +
  "  Menu" +
  "</button>" +
  '<ul id="menu" hidden>...</ul>' +
  // aria-hidden: ẩn khỏi screen reader:
  '<div aria-hidden="true"><!-- Decorative icon --></div>' +
  // aria-live: thông báo thay đổi động:
  '<div aria-live="polite"><!-- Cập nhật khi có tin mới --></div>' +
  '<div aria-live="assertive"><!-- Thông báo khẩn! --></div>';

// ③ ARIA STATES:
var aria_states =
  "" +
  'aria-checked="true"    → checkbox/radio đã chọn\n' +
  'aria-disabled="true"   → element bị disable\n' +
  'aria-selected="true"   → item đang được chọn\n' +
  'aria-invalid="true"    → input có lỗi validation\n' +
  'aria-required="true"   → field bắt buộc\n' +
  'aria-current="page"    → trang hiện tại trong nav';
```

---

## §6. Tự Viết — Keyboard Navigation!

```javascript
// ═══════════════════════════════════════════════════════════
// KEYBOARD NAVIGATION — TỰ VIẾT!
// ═══════════════════════════════════════════════════════════

// ① FOCUS TRAP — giữ focus trong modal:
var FocusTrap = (function () {
  function createTrap(containerElement) {
    // Tìm tất cả focusable elements:
    var focusableSelector = [
      "a[href]",
      "button:not([disabled])",
      "input:not([disabled])",
      "select:not([disabled])",
      "textarea:not([disabled])",
      '[tabindex]:not([tabindex="-1"])',
    ].join(", ");

    var focusableElements =
      containerElement.querySelectorAll(focusableSelector);
    var firstElement = focusableElements[0];
    var lastElement = focusableElements[focusableElements.length - 1];

    function handleKeyDown(event) {
      if (event.key !== "Tab") return;

      if (event.shiftKey) {
        // Shift+Tab: lùi → nếu ở first → nhảy về last:
        if (document.activeElement === firstElement) {
          event.preventDefault();
          lastElement.focus();
        }
      } else {
        // Tab: tiến → nếu ở last → nhảy về first:
        if (document.activeElement === lastElement) {
          event.preventDefault();
          firstElement.focus();
        }
      }
    }

    // Activate trap:
    containerElement.addEventListener("keydown", handleKeyDown);
    firstElement.focus(); // Focus element đầu tiên!

    // Return cleanup function:
    return function deactivate() {
      containerElement.removeEventListener("keydown", handleKeyDown);
    };
  }

  return { createTrap: createTrap };
})();

// ② SKIP NAVIGATION LINK:
var skipNavHTML =
  "" +
  '<a href="#main-content" class="skip-link">' +
  "  Bỏ qua navigation, đến nội dung chính" +
  "</a>" +
  "<!-- CSS: .skip-link { position:absolute; top:-40px; }" +
  "     .skip-link:focus { top:0; } -->" +
  "<!-- → Ẩn bình thường, hiện khi Tab focus! -->" +
  "<nav>...memos navigation dài...</nav>" +
  '<main id="main-content" tabindex="-1">' +
  "  <!-- Nội dung chính -->" +
  "</main>";

// ③ ROVING TABINDEX — cho menu/toolbar:
function RovingTabIndex(container) {
  var items = container.querySelectorAll('[role="menuitem"]');
  var currentIndex = 0;

  // Chỉ item đầu có tabindex=0, còn lại -1:
  function updateTabIndex() {
    for (var i = 0; i < items.length; i++) {
      items[i].setAttribute("tabindex", i === currentIndex ? "0" : "-1");
    }
    items[currentIndex].focus();
  }

  container.addEventListener("keydown", function (event) {
    switch (event.key) {
      case "ArrowDown":
      case "ArrowRight":
        event.preventDefault();
        currentIndex = (currentIndex + 1) % items.length;
        updateTabIndex();
        break;
      case "ArrowUp":
      case "ArrowLeft":
        event.preventDefault();
        currentIndex = (currentIndex - 1 + items.length) % items.length;
        updateTabIndex();
        break;
      case "Home":
        event.preventDefault();
        currentIndex = 0;
        updateTabIndex();
        break;
      case "End":
        event.preventDefault();
        currentIndex = items.length - 1;
        updateTabIndex();
        break;
    }
  });

  updateTabIndex();
}
```

```
  FOCUS TRAP — MODAL:
  ┌────────────────────────────────────────────────────────┐
  │                                                        │
  │  Trang chính (inert / không tương tác)                │
  │  ┌──────────────────────────────────────────────────┐  │
  │  │              MODAL DIALOG                        │  │
  │  │  ┌────────────────────────────────────────────┐  │  │
  │  │  │  [X Close] ← first focusable               │  │  │
  │  │  │                                            │  │  │
  │  │  │  Nội dung modal...                         │  │  │
  │  │  │                                            │  │  │
  │  │  │  [Input field]                             │  │  │
  │  │  │                                            │  │  │
  │  │  │  [Cancel]  [Confirm] ← last focusable      │  │  │
  │  │  └────────────────────────────────────────────┘  │  │
  │  │                                                  │  │
  │  │  Tab từ [Confirm] → quay lại [X Close]          │  │
  │  │  Shift+Tab từ [X Close] → nhảy đến [Confirm]   │  │
  │  │  → Focus KHÔNG thoát khỏi modal!               │  │
  │  │  → Esc → đóng modal!                           │  │
  │  └──────────────────────────────────────────────────┘  │
  │                                                        │
  └────────────────────────────────────────────────────────┘
```

---

## §7. Tự Viết — Accessibility Audit Tool!

```javascript
// ═══════════════════════════════════════════════════════════
// A11Y AUDIT TOOL — TỰ VIẾT!
// Kiểm tra các lỗi accessibility phổ biến!
// ═══════════════════════════════════════════════════════════

var A11yAudit = (function () {
  var _issues = [];

  function audit(rootElement) {
    _issues = [];
    rootElement = rootElement || document.body;

    checkImages(rootElement);
    checkButtons(rootElement);
    checkForms(rootElement);
    checkHeadings(rootElement);
    checkContrast(rootElement);
    checkLinks(rootElement);

    return {
      issues: _issues,
      passed: _issues.filter(function (i) {
        return i.type === "pass";
      }).length,
      warnings: _issues.filter(function (i) {
        return i.type === "warning";
      }).length,
      errors: _issues.filter(function (i) {
        return i.type === "error";
      }).length,
    };
  }

  // ① Kiểm tra ảnh có alt text:
  function checkImages(root) {
    var images = root.querySelectorAll("img");
    for (var i = 0; i < images.length; i++) {
      var img = images[i];
      if (!img.hasAttribute("alt")) {
        _issues.push({
          type: "error",
          rule: "img-alt",
          message: "Image thiếu alt attribute!",
          element: img.outerHTML.substring(0, 100),
          fix: 'Thêm alt="mô tả ảnh" hoặc alt="" cho decorative',
        });
      } else if (
        img.alt === "" &&
        img.getAttribute("role") !== "presentation"
      ) {
        _issues.push({
          type: "warning",
          rule: "img-alt-empty",
          message: "Image có alt rỗng — đảm bảo là decorative!",
          element: img.outerHTML.substring(0, 100),
        });
      } else {
        _issues.push({
          type: "pass",
          rule: "img-alt",
          message: 'Image có alt: "' + img.alt + '"',
        });
      }
    }
  }

  // ② Kiểm tra buttons:
  function checkButtons(root) {
    // Div/span dùng như button nhưng thiếu role:
    var clickables = root.querySelectorAll("[onclick]");
    for (var i = 0; i < clickables.length; i++) {
      var el = clickables[i];
      var tag = el.tagName.toLowerCase();
      if (tag !== "button" && tag !== "a" && !el.hasAttribute("role")) {
        _issues.push({
          type: "error",
          rule: "interactive-role",
          message: "<" + tag + "> có onclick nhưng không có role!",
          element: el.outerHTML.substring(0, 100),
          fix: 'Dùng <button> hoặc thêm role="button" + tabindex="0"',
        });
      }
    }

    // Buttons không có accessible name:
    var buttons = root.querySelectorAll('button, [role="button"]');
    for (var j = 0; j < buttons.length; j++) {
      var btn = buttons[j];
      var name =
        btn.textContent.trim() ||
        btn.getAttribute("aria-label") ||
        btn.getAttribute("aria-labelledby");
      if (!name) {
        _issues.push({
          type: "error",
          rule: "button-name",
          message: "Button thiếu accessible name!",
          element: btn.outerHTML.substring(0, 100),
          fix: "Thêm text content hoặc aria-label",
        });
      }
    }
  }

  // ③ Kiểm tra forms:
  function checkForms(root) {
    var inputs = root.querySelectorAll(
      'input:not([type="hidden"]), select, textarea',
    );
    for (var i = 0; i < inputs.length; i++) {
      var input = inputs[i];
      var id = input.id;
      var hasLabel = false;

      if (id) {
        hasLabel = !!root.querySelector('label[for="' + id + '"]');
      }
      if (!hasLabel) {
        hasLabel = !!input.closest("label");
      }
      if (!hasLabel) {
        hasLabel =
          !!input.getAttribute("aria-label") ||
          !!input.getAttribute("aria-labelledby");
      }

      if (!hasLabel) {
        _issues.push({
          type: "error",
          rule: "input-label",
          message: "Input thiếu label!",
          element: input.outerHTML.substring(0, 100),
          fix: 'Thêm <label for="id"> hoặc aria-label',
        });
      }
    }
  }

  // ④ Kiểm tra heading hierarchy:
  function checkHeadings(root) {
    var headings = root.querySelectorAll("h1, h2, h3, h4, h5, h6");
    var prevLevel = 0;
    for (var i = 0; i < headings.length; i++) {
      var level = parseInt(headings[i].tagName.charAt(1));
      if (level - prevLevel > 1 && prevLevel !== 0) {
        _issues.push({
          type: "warning",
          rule: "heading-order",
          message: "Heading nhảy từ h" + prevLevel + " sang h" + level + "!",
          fix: "Sử dụng heading theo thứ tự: h1 → h2 → h3...",
        });
      }
      prevLevel = level;
    }
  }

  // ⑤ Kiểm tra contrast (simplified):
  function checkContrast(root) {
    var texts = root.querySelectorAll("p, span, a, button, label, h1, h2, h3");
    for (var i = 0; i < texts.length; i++) {
      var el = texts[i];
      var style = window.getComputedStyle(el);
      var color = style.color;
      var bgColor = style.backgroundColor;

      var ratio = calculateContrastRatio(
        parseColor(color),
        parseColor(bgColor),
      );

      var fontSize = parseFloat(style.fontSize);
      var isBold = parseInt(style.fontWeight) >= 700;
      var isLargeText = fontSize >= 24 || (fontSize >= 18.66 && isBold);
      var minRatio = isLargeText ? 3 : 4.5; // WCAG AA

      if (ratio < minRatio) {
        _issues.push({
          type: "error",
          rule: "color-contrast",
          message:
            "Contrast ratio " +
            ratio.toFixed(2) +
            ":1 < " +
            minRatio +
            ":1 (WCAG AA)!",
          element: el.textContent.substring(0, 50),
        });
      }
    }
  }

  // ⑥ Links:
  function checkLinks(root) {
    var links = root.querySelectorAll("a");
    for (var i = 0; i < links.length; i++) {
      var text = links[i].textContent.trim().toLowerCase();
      if (
        text === "click here" ||
        text === "read more" ||
        text === "here" ||
        text === "more"
      ) {
        _issues.push({
          type: "warning",
          rule: "link-name",
          message: 'Link text "' + text + '" không descriptive!',
          fix: 'Dùng text mô tả rõ: "Đọc bài viết về React"',
        });
      }
    }
  }

  // HELPERS:
  function parseColor(colorStr) {
    var match = colorStr.match(/\d+/g);
    return match ? { r: +match[0], g: +match[1], b: +match[2] } : null;
  }

  function luminance(rgb) {
    var a = [rgb.r, rgb.g, rgb.b].map(function (v) {
      v /= 255;
      return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
    });
    return 0.2126 * a[0] + 0.7152 * a[1] + 0.0722 * a[2];
  }

  function calculateContrastRatio(fg, bg) {
    if (!fg || !bg) return 21; // Cannot determine
    var l1 = luminance(fg);
    var l2 = luminance(bg);
    var lighter = Math.max(l1, l2);
    var darker = Math.min(l1, l2);
    return (lighter + 0.05) / (darker + 0.05);
  }

  return { audit: audit };
})();

// SỬ DỤNG:
// var results = A11yAudit.audit(document.body);
// console.log('Errors:', results.errors);
// console.log('Warnings:', results.warnings);
// results.issues.forEach(function(issue) {
//     console.log('[' + issue.type + '] ' + issue.message);
// });
```

---

## §8. React & Accessibility!

```javascript
// ═══════════════════════════════════════════════════════════
// REACT ACCESSIBLE COMPONENTS — TỰ VIẾT!
// ═══════════════════════════════════════════════════════════

// ① ACCESSIBLE MODAL:
function AccessibleModal(props) {
  var previousFocusRef = React.useRef(null);

  React.useEffect(
    function () {
      if (props.isOpen) {
        // Lưu element đang focus trước khi mở modal:
        previousFocusRef.current = document.activeElement;

        // Focus vào modal:
        var modal = document.getElementById("modal-" + props.id);
        if (modal) {
          var deactivateTrap = FocusTrap.createTrap(modal);
          // Cleanup:
          return function () {
            deactivateTrap();
            // Trả focus về element trước đó:
            if (previousFocusRef.current) {
              previousFocusRef.current.focus();
            }
          };
        }
      }
    },
    [props.isOpen],
  );

  if (!props.isOpen) return null;

  return React.createElement(
    "div",
    {
      className: "modal-overlay",
      onClick: function (e) {
        if (e.target === e.currentTarget) props.onClose();
      },
    },
    React.createElement(
      "div",
      {
        id: "modal-" + props.id,
        role: "dialog",
        "aria-modal": "true",
        "aria-labelledby": "modal-title-" + props.id,
        onKeyDown: function (e) {
          if (e.key === "Escape") props.onClose();
        },
      },
      React.createElement(
        "h2",
        {
          id: "modal-title-" + props.id,
        },
        props.title,
      ),
      props.children,
      React.createElement(
        "button",
        {
          onClick: props.onClose,
          "aria-label": "Đóng dialog",
        },
        "✕",
      ),
    ),
  );
}

// ② LIVE REGION — thông báo cho screen reader:
function LiveAnnouncer() {
  var messageState = React.useState("");
  var message = messageState[0];
  var setMessage = messageState[1];

  // Function để announce:
  function announce(text, priority) {
    setMessage(""); // Reset để re-announce cùng text
    setTimeout(function () {
      setMessage(text);
    }, 100);
  }

  return React.createElement(
    "div",
    {
      "aria-live": "polite",
      "aria-atomic": "true",
      className: "sr-only", // Visually hidden!
      // CSS: .sr-only { position:absolute; width:1px;
      //   height:1px; overflow:hidden; clip:rect(0,0,0,0); }
    },
    message,
  );
}

// ③ ACCESSIBLE FORM:
function AccessibleForm() {
  var errors = React.useState({});
  var formErrors = errors[0];
  var setFormErrors = errors[1];

  function validate(name, value) {
    var err = {};
    if (name === "email" && !value.includes("@")) {
      err.email = "Email phải chứa @";
    }
    if (name === "password" && value.length < 8) {
      err.password = "Mật khẩu ít nhất 8 ký tự";
    }
    setFormErrors(err);
  }

  return React.createElement(
    "form",
    {
      "aria-label": "Form đăng ký",
      noValidate: true,
    },
    // Email field:
    React.createElement(
      "div",
      null,
      React.createElement(
        "label",
        { htmlFor: "email" },
        "Email ",
        React.createElement("span", { "aria-hidden": "true" }, "*"),
      ),
      React.createElement("input", {
        id: "email",
        type: "email",
        "aria-required": "true",
        "aria-invalid": formErrors.email ? "true" : "false",
        "aria-describedby": formErrors.email ? "email-error" : "email-help",
        onChange: function (e) {
          validate("email", e.target.value);
        },
      }),
      formErrors.email
        ? React.createElement(
            "span",
            {
              id: "email-error",
              role: "alert",
              className: "error",
            },
            formErrors.email,
          )
        : React.createElement(
            "span",
            {
              id: "email-help",
              className: "help",
            },
            "Nhập địa chỉ email của bạn",
          ),
    ),
  );
}
```

```
  REACT A11Y — BEST PRACTICES:
  ┌────────────────────────────────────────────────────────┐
  │                                                        │
  │  ① Dùng semantic HTML TRƯỚC, ARIA SAU!                │
  │  → <button> thay <div onClick>                        │
  │  → <a href> thay <span onClick>                       │
  │  → <nav>, <main>, <header>, <footer>                  │
  │                                                        │
  │  ② JSX khác HTML:                                     │
  │  → className (không class)                            │
  │  → htmlFor (không for)                                │
  │  → tabIndex (không tabindex)                          │
  │  → aria-label, aria-labelledby → GIỐNG HTML!          │
  │                                                        │
  │  ③ React Fragment cho list:                           │
  │  → <React.Fragment> hoặc <> không tạo div thừa!      │
  │                                                        │
  │  ④ Focus management cho SPA:                          │
  │  → Khi route thay đổi → focus vào <main> hoặc <h1>!  │
  │  → useEffect + ref.focus() khi navigate!              │
  │                                                        │
  │  ⑤ Accessible images:                                 │
  │  → <img alt="mô tả"> luôn luôn!                      │
  │  → Decorative: alt="" + aria-hidden="true"            │
  │                                                        │
  │  ⑥ Color không phải cách DUY NHẤT:                    │
  │  → Error: màu đỏ + icon ⚠️ + text "Lỗi..."           │
  │  → Success: màu xanh + icon ✅ + text "Thành công"    │
  │                                                        │
  └────────────────────────────────────────────────────────┘
```

---

## §9. Tổng Kết & Câu Hỏi Phỏng Vấn!

### 9.1. Tổng Kết!

```
  WEB ACCESSIBILITY — TỔNG KẾT:
  ┌────────────────────────────────────────────────────────┐
  │                                                        │
  │  A11Y = thiết kế web MỌI NGƯỜI dùng được!            │
  │                                                        │
  │  WCAG 4 NGUYÊN TẮC (POUR):                            │
  │  P = Perceivable (nhận biết)                          │
  │  O = Operable (thao tác)                              │
  │  U = Understandable (hiểu)                            │
  │  R = Robust (mạnh mẽ)                                 │
  │                                                        │
  │  THỰC HÀNH:                                            │
  │  ① Semantic HTML trước, ARIA sau!                     │
  │  ② Keyboard navigation cho mọi tương tác!            │
  │  ③ Alt text cho mọi ảnh có ý nghĩa!                  │
  │  ④ Label cho mọi form input!                          │
  │  ⑤ Contrast ratio ≥ 4.5:1 (WCAG AA)!                 │
  │  ⑥ Focus management cho SPA!                          │
  │  ⑦ aria-live cho dynamic content!                     │
  │  ⑧ Focus trap cho modals!                             │
  │                                                        │
  └────────────────────────────────────────────────────────┘
```

### 9.2. Câu Hỏi Phỏng Vấn!

**❓ Q1: Web accessibility là gì và tại sao quan trọng?**

> Web accessibility (a11y) = thiết kế web để **mọi người** sử dụng được, bất kể khuyết tật (thị giác, thính giác, vận động, nhận thức). Quan trọng vì: **quyền con người** (UN Convention), **pháp luật** (ADA, EU Accessibility Act — vi phạm bị kiện), **thị trường** 1 tỷ người, **SEO** tốt hơn (semantic HTML, alt text), **UX tốt hơn** cho tất cả (keyboard nav, contrast cao). 15-20% dân số có khuyết tật nào đó.

**❓ Q2: Giải thích WCAG và 4 nguyên tắc POUR?**

> WCAG (Web Content Accessibility Guidelines) do W3C ban hành. 4 nguyên tắc: **Perceivable** — user nhận biết được (alt text, phụ đề, contrast). **Operable** — thao tác được (keyboard nav, đủ thời gian, không gây seizure). **Understandable** — hiểu được (lang attribute, clear labels, error messages). **Robust** — tương thích nhiều tools (valid HTML, ARIA đúng). 3 mức: A (tối thiểu), **AA** (tiêu chuẩn, hầu hết luật yêu cầu), AAA (lý tưởng).

**❓ Q3: ARIA là gì và khi nào nên dùng?**

> ARIA (Accessible Rich Internet Applications) = attributes bổ sung a11y info khi HTML không đủ. Gồm: **roles** (`role="dialog"`), **properties** (`aria-label`, `aria-describedby`), **states** (`aria-expanded`, `aria-invalid`). **Quy tắc #1**: dùng semantic HTML trước! `<button>` tốt hơn `<div role="button">`. Chỉ dùng ARIA cho custom widgets (tabs, modals, autocomplete) mà HTML native không có sẵn.

**❓ Q4: Làm sao đảm bảo keyboard accessibility?**

> Mọi interactive element **phải** focusable + operable bằng keyboard. Dùng **semantic elements** (`<button>`, `<a>`) — tự có keyboard support. Custom elements cần `tabindex="0"` + keydown handler. **Focus order** logic (DOM order hợp lý). **Focus trap** cho modals (Tab cycle trong modal). **Skip links** bỏ qua nav đến main content. **Roving tabindex** cho menu/toolbar (Arrow keys di chuyển). **Visible focus indicator** — KHÔNG bỏ `outline`!

**❓ Q5: React có gì đặc biệt với accessibility?**

> JSX dùng `htmlFor` (thay `for`), `className` (thay `class`), `tabIndex` (camelCase). ARIA attributes **giống HTML**: `aria-label`, `aria-hidden`. **Fragment** (`<>...</>`) tránh div thừa. SPA challenge: route change không trigger page load → phải **focus management** thủ công (focus vào `<main>` hoặc `<h1>` khi navigate). Dynamic content dùng **`aria-live`** regions thông báo screen reader. Modal cần **focus trap** + Escape close + restore focus khi đóng.

**❓ Q6: Accessibility Tree là gì?**

> Browser tạo **Accessibility Tree** song song với DOM tree. A11y tree chứa: **role** (button, link, heading), **name** ("Submit", "Home"), **state** (disabled, expanded), **value**. Screen readers đọc A11y tree, **KHÔNG** đọc DOM trực tiếp. Semantic HTML → A11y tree chính xác. `<div onclick>` → A11y tree chỉ thấy "generic" → screen reader không biết là gì. `<button>` → A11y tree thấy "button" → screen reader đọc đúng.

---

> 📝 **Ghi nhớ cuối cùng:**
> "A11y = web cho MỌI NGƯỜI! WCAG POUR: Perceivable, Operable, Understandable, Robust! Semantic HTML trước, ARIA sau! Keyboard navigation cho mọi tương tác! Alt text, labels, contrast, focus management, aria-live! React SPA cần đặc biệt chú ý focus khi route change!"
