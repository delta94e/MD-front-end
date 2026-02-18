# ARIA Roles — Mục Đích & Khi Nào Sử Dụng! Deep Dive!

> **Chủ đề**: What is the purpose of ARIA roles, and when should you use them?
> **Ngôn ngữ**: Tiếng Việt — giải thích cực kỳ chi tiết!
> **Phương châm**: Tự viết lại bằng tay — KHÔNG dùng thư viện!

---

## Mục Lục

1. [§1. ARIA Là Gì? — Tổng Quan!](#1)
2. [§2. 6 Loại ARIA Roles Chi Tiết!](#2)
3. [§3. ARIA Properties & States!](#3)
4. [§4. 5 Quy Tắc Vàng Khi Dùng ARIA!](#4)
5. [§5. Tự Viết — Custom Widgets Với ARIA!](#5)
6. [§6. Tự Viết — ARIA Validator!](#6)
7. [§7. React & ARIA!](#7)
8. [§8. Tổng Kết & Câu Hỏi Phỏng Vấn!](#8)

---

## §1. ARIA Là Gì? — Tổng Quan!

```
  ARIA — ACCESSIBLE RICH INTERNET APPLICATIONS:
  ┌────────────────────────────────────────────────────────┐
  │                                                        │
  │  ARIA = bộ HTML ATTRIBUTES bổ sung thông tin          │
  │  accessibility cho ASSISTIVE TECHNOLOGIES!             │
  │                                                        │
  │  TẠI SAO CẦN ARIA?                                    │
  │  ┌──────────────────────────────────────────────────┐  │
  │  │                                                  │  │
  │  │  HTML native có SẴN accessibility:               │  │
  │  │  <button> → Screen reader: "Submit, button"      │  │
  │  │  <a href> → Screen reader: "Home, link"          │  │
  │  │  <input type="checkbox"> → "checkbox, checked"   │  │
  │  │                                                  │  │
  │  │  NHƯNG web apps PHỨC TẠP hơn HTML native:       │  │
  │  │  → Tab panels, accordions, drag-and-drop        │  │
  │  │  → Autocomplete, tree views, modals             │  │
  │  │  → HTML KHÔNG CÓ <tab>, <accordion>, <modal>!   │  │
  │  │                                                  │  │
  │  │  → PHẢI DÙNG <div>/<span> + JavaScript!         │  │
  │  │  → NHƯNG <div> KHÔNG CÓ accessibility info!     │  │
  │  │  → ARIA BỔ SUNG info đó!                        │  │
  │  └──────────────────────────────────────────────────┘  │
  │                                                        │
  │  ARIA GỒM 3 THÀNH PHẦN:                               │
  │  ┌──────────────────────────────────────────────────┐  │
  │  │  ① ROLES — vai trò của element:                  │  │
  │  │     role="button", role="tab", role="dialog"     │  │
  │  │                                                  │  │
  │  │  ② PROPERTIES — thuộc tính bổ sung:              │  │
  │  │     aria-label, aria-labelledby,                 │  │
  │  │     aria-describedby, aria-required              │  │
  │  │                                                  │  │
  │  │  ③ STATES — trạng thái thay đổi:                │  │
  │  │     aria-expanded, aria-checked, aria-selected,  │  │
  │  │     aria-disabled, aria-hidden                   │  │
  │  └──────────────────────────────────────────────────┘  │
  │                                                        │
  │  ARIA & ACCESSIBILITY TREE:                            │
  │  ┌──────────────────────────────────────────────────┐  │
  │  │                                                  │  │
  │  │  HTML DOM ──→ Browser ──→ Accessibility Tree     │  │
  │  │                  ↑                               │  │
  │  │                ARIA attributes                   │  │
  │  │                BỔ SUNG / GHI ĐÈ                  │  │
  │  │                thông tin trong A11y Tree!        │  │
  │  │                                                  │  │
  │  │  <div role="button" aria-label="Đóng">X</div>  │  │
  │  │       ↓                                          │  │
  │  │  A11y Tree: { role: button, name: "Đóng" }     │  │
  │  │       ↓                                          │  │
  │  │  Screen reader: "Đóng, button"                  │  │
  │  │                                                  │  │
  │  │  ⚠️ ARIA CHỈ thay đổi A11Y TREE!                │  │
  │  │  → KHÔNG thay đổi visual!                       │  │
  │  │  → KHÔNG thay đổi behavior!                     │  │
  │  │  → PHẢI tự thêm CSS + JS!                       │  │
  │  └──────────────────────────────────────────────────┘  │
  │                                                        │
  └────────────────────────────────────────────────────────┘
```

---

## §2. 6 Loại ARIA Roles Chi Tiết!

```
  6 LOẠI ARIA ROLES:
  ┌────────────────────────────────────────────────────────┐
  │                                                        │
  │  ① LANDMARK ROLES — vùng trang:                       │
  │  ┌──────────────────────────────────────────────────┐  │
  │  │  role="banner"        = <header>                 │  │
  │  │  role="navigation"    = <nav>                    │  │
  │  │  role="main"          = <main>                   │  │
  │  │  role="contentinfo"   = <footer>                 │  │
  │  │  role="complementary" = <aside>                  │  │
  │  │  role="search"        = search area              │  │
  │  │  role="form"          = <form> (có tên)          │  │
  │  │  role="region"        = <section> (có tên)       │  │
  │  │                                                  │  │
  │  │  → Screen reader: nhảy nhanh giữa landmarks!   │  │
  │  │  → ✅ DÙng semantic HTML thay vì role!           │  │
  │  └──────────────────────────────────────────────────┘  │
  │                                                        │
  │  ② WIDGET ROLES — tương tác:                          │
  │  ┌──────────────────────────────────────────────────┐  │
  │  │  CÓ HTML NATIVE:              KHÔNG CÓ NATIVE:  │  │
  │  │  button    = <button>          tab               │  │
  │  │  checkbox  = <input checkbox>  tabpanel          │  │
  │  │  link      = <a href>          tablist           │  │
  │  │  radio     = <input radio>     menu              │  │
  │  │  textbox   = <input text>      menuitem          │  │
  │  │  listbox   = <select>          tree / treeitem   │  │
  │  │  slider    = <input range>     dialog            │  │
  │  │  progressbar = <progress>      alertdialog       │  │
  │  │  combobox  = <select+input>    tooltip           │  │
  │  │                                toolbar           │  │
  │  │                                switch            │  │
  │  └──────────────────────────────────────────────────┘  │
  │                                                        │
  │  ③ DOCUMENT STRUCTURE ROLES:                           │
  │  ┌──────────────────────────────────────────────────┐  │
  │  │  heading   = <h1>-<h6>                           │  │
  │  │  list      = <ul> / <ol>                         │  │
  │  │  listitem  = <li>                                │  │
  │  │  img       = <img>                               │  │
  │  │  table     = <table>                             │  │
  │  │  row       = <tr>                                │  │
  │  │  cell      = <td>                                │  │
  │  │  separator = <hr>                                │  │
  │  │  article   = <article>                           │  │
  │  │  definition                                      │  │
  │  │  note                                            │  │
  │  │  feed (live feed of articles)                    │  │
  │  └──────────────────────────────────────────────────┘  │
  │                                                        │
  │  ④ LIVE REGION ROLES:                                  │
  │  ┌──────────────────────────────────────────────────┐  │
  │  │  alert      → đọc NGAY (assertive)!             │  │
  │  │  status     → đọc khi rảnh (polite)             │  │
  │  │  log        → append-only log                   │  │
  │  │  marquee    → thay đổi liên tục không quan trọng│  │
  │  │  timer      → đếm thời gian                     │  │
  │  └──────────────────────────────────────────────────┘  │
  │                                                        │
  │  ⑤ WINDOW ROLES:                                      │
  │  ┌──────────────────────────────────────────────────┐  │
  │  │  dialog      → modal/dialog box                 │  │
  │  │  alertdialog → dialog cảnh báo quan trọng       │  │
  │  └──────────────────────────────────────────────────┘  │
  │                                                        │
  │  ⑥ ABSTRACT ROLES (KHÔNG dùng trực tiếp!):            │
  │  ┌──────────────────────────────────────────────────┐  │
  │  │  widget, input, command, composite, section...  │  │
  │  │  → Chỉ là base classes trong spec!              │  │
  │  │  → ❌ KHÔNG BAO GIỜ dùng trong HTML!             │  │
  │  └──────────────────────────────────────────────────┘  │
  │                                                        │
  └────────────────────────────────────────────────────────┘
```

---

## §3. ARIA Properties & States!

```javascript
// ═══════════════════════════════════════════════════════════
// ARIA PROPERTIES — THUỘC TÍNH BỔ SUNG:
// ═══════════════════════════════════════════════════════════

// ① NAMING (đặt tên cho elements):
var naming = {
  "aria-label":
    // Nhãn trực tiếp (khi KHÔNG có visible text):
    '<button aria-label="Đóng menu"><svg>✕</svg></button>',
  // Screen reader: "Đóng menu, button"

  "aria-labelledby":
    // Nhãn từ element KHÁC (visible text):
    '<h2 id="cart-title">Giỏ hàng</h2>' +
    '<ul aria-labelledby="cart-title">...</ul>',
  // Screen reader: "Giỏ hàng, list"

  "aria-describedby":
    // MÔ TẢ BỔ SUNG (đọc SAU name + role):
    '<input id="pw" aria-describedby="pw-help">' +
    '<span id="pw-help">Ít nhất 8 ký tự, 1 chữ hoa</span>',
  // SR: "password, edit... Ít nhất 8 ký tự, 1 chữ hoa"
};

// ② RELATIONSHIP (quan hệ giữa elements):
var relationships = {
  "aria-controls":
    // Element NÀY điều khiển element KHÁC:
    '<button aria-controls="panel-1" aria-expanded="false">' +
    "  Section 1" +
    "</button>" +
    '<div id="panel-1" hidden>Nội dung...</div>',

  "aria-owns":
    // Element NÀY "sở hữu" element KHÔNG phải con DOM:
    '<div role="listbox" aria-owns="option-external">' +
    '  <div role="option">Option 1</div>' +
    "</div>" +
    '<div id="option-external" role="option">Option 2</div>',

  "aria-activedescendant":
    // Item ĐANG ACTIVE trong composite widget:
    '<ul role="listbox" aria-activedescendant="item-2">' +
    '  <li role="option" id="item-1">A</li>' +
    '  <li role="option" id="item-2">B</li>' +
    "</ul>",
};

// ═══════════════════════════════════════════════════════════
// ARIA STATES — TRẠNG THÁI THAY ĐỔI ĐỘNG:
// ═══════════════════════════════════════════════════════════

var states = {
  "aria-expanded": "true/false — mở rộng/thu gọn (accordion)",
  "aria-checked": "true/false/mixed — checkbox/radio/switch",
  "aria-selected": "true/false — item được chọn (tab, option)",
  "aria-pressed": "true/false/mixed — toggle button",
  "aria-disabled": "true — vô hiệu hóa (nhưng VẪN focusable!)",
  "aria-hidden": "true — ẨN khỏi screen reader",
  "aria-invalid": "true/grammar/spelling — input có lỗi",
  "aria-busy": "true — đang loading/updating",
  "aria-current": "page/step/date — item hiện tại trong nav",
  "aria-haspopup": "true/menu/dialog — có popup khi activate",
};

// ⚠️ PHÂN BIỆT disabled vs aria-disabled:
// <button disabled>         → KHÔNG focus, KHÔNG click, screen reader BỎ QUA
// <button aria-disabled="true"> → CÓ focus, KHÔNG click (JS), screen reader ĐỌC
// → aria-disabled tốt hơn cho a11y vì user BIẾT button tồn tại!
```

---

## §4. 5 Quy Tắc Vàng Khi Dùng ARIA!

```
  5 QUY TẮC VÀNG CỦA ARIA:
  ┌────────────────────────────────────────────────────────┐
  │                                                        │
  │  QUY TẮC #1: DÙNG HTML NATIVE TRƯỚC!                  │
  │  ┌──────────────────────────────────────────────────┐  │
  │  │  ❌ <div role="button" tabindex="0"              │  │
  │  │       onclick="..." onkeydown="...">Click</div> │  │
  │  │  → Phải tự thêm: tabindex, keyboard, focus...  │  │
  │  │                                                  │  │
  │  │  ✅ <button onclick="...">Click</button>         │  │
  │  │  → TỰ CÓ: focus, keyboard, role, click!        │  │
  │  │                                                  │  │
  │  │  "Nếu HTML native làm được → DÙNG HTML!"        │  │
  │  └──────────────────────────────────────────────────┘  │
  │                                                        │
  │  QUY TẮC #2: KHÔNG THAY ĐỔI SEMANTIC CỦA HTML!       │
  │  ┌──────────────────────────────────────────────────┐  │
  │  │  ❌ <h2 role="tab">Tab 1</h2>                    │  │
  │  │  → h2 mất ý nghĩa heading!                     │  │
  │  │                                                  │  │
  │  │  ✅ <div role="tab"><h2>Tab 1</h2></div>         │  │
  │  │  → Giữ nguyên semantic!                         │  │
  │  └──────────────────────────────────────────────────┘  │
  │                                                        │
  │  QUY TẮC #3: MỌI INTERACTIVE ARIA PHẢI KEYBOARD!     │
  │  ┌──────────────────────────────────────────────────┐  │
  │  │  ❌ <div role="button">Click</div>               │  │
  │  │  → Có role nhưng KHÔNG Tab/Enter được!          │  │
  │  │                                                  │  │
  │  │  ✅ <div role="button" tabindex="0"              │  │
  │  │       onkeydown="handleKey(e)">Click</div>      │  │
  │  └──────────────────────────────────────────────────┘  │
  │                                                        │
  │  QUY TẮC #4: KHÔNG DÙNG role="presentation"           │
  │              HOẶC aria-hidden="true" TRÊN FOCUSABLE!  │
  │  ┌──────────────────────────────────────────────────┐  │
  │  │  ❌ <button aria-hidden="true">Submit</button>   │  │
  │  │  → Focus được nhưng screen reader bỏ qua!      │  │
  │  │  → User keyboard: "đến 1 element vô hình"!     │  │
  │  └──────────────────────────────────────────────────┘  │
  │                                                        │
  │  QUY TẮC #5: MỌI INTERACTIVE ELEMENT PHẢI CÓ NAME!   │
  │  ┌──────────────────────────────────────────────────┐  │
  │  │  ❌ <button><svg>...</svg></button>               │  │
  │  │  → Screen reader: "button" (KHÔNG có tên!)      │  │
  │  │                                                  │  │
  │  │  ✅ <button aria-label="Tìm kiếm">              │  │
  │  │       <svg>...</svg></button>                    │  │
  │  │  → Screen reader: "Tìm kiếm, button"           │  │
  │  └──────────────────────────────────────────────────┘  │
  │                                                        │
  └────────────────────────────────────────────────────────┘
```

---

## §5. Tự Viết — Custom Widgets Với ARIA!

```javascript
// ═══════════════════════════════════════════════════════════
// ① TABS — ARIA PATTERN HOÀN CHỈNH:
// ═══════════════════════════════════════════════════════════

function AccessibleTabs(container) {
  var tablist = container.querySelector('[role="tablist"]');
  var tabs = container.querySelectorAll('[role="tab"]');
  var panels = container.querySelectorAll('[role="tabpanel"]');

  // HTML structure cần:
  // <div role="tablist" aria-label="Cài đặt">
  //   <button role="tab" aria-selected="true"
  //     aria-controls="panel-1" id="tab-1">Tab 1</button>
  //   <button role="tab" aria-selected="false"
  //     aria-controls="panel-2" id="tab-2" tabindex="-1">Tab 2</button>
  // </div>
  // <div role="tabpanel" id="panel-1"
  //   aria-labelledby="tab-1">Content 1</div>
  // <div role="tabpanel" id="panel-2"
  //   aria-labelledby="tab-2" hidden>Content 2</div>

  var currentIndex = 0;

  function selectTab(index) {
    // Deselect tất cả:
    for (var i = 0; i < tabs.length; i++) {
      tabs[i].setAttribute("aria-selected", "false");
      tabs[i].setAttribute("tabindex", "-1");
      panels[i].hidden = true;
    }
    // Select tab mới:
    tabs[index].setAttribute("aria-selected", "true");
    tabs[index].setAttribute("tabindex", "0");
    tabs[index].focus();
    panels[index].hidden = false;
    currentIndex = index;
  }

  // Keyboard navigation:
  tablist.addEventListener("keydown", function (event) {
    var newIndex = currentIndex;
    switch (event.key) {
      case "ArrowRight":
      case "ArrowDown":
        newIndex = (currentIndex + 1) % tabs.length;
        break;
      case "ArrowLeft":
      case "ArrowUp":
        newIndex = (currentIndex - 1 + tabs.length) % tabs.length;
        break;
      case "Home":
        newIndex = 0;
        break;
      case "End":
        newIndex = tabs.length - 1;
        break;
      default:
        return;
    }
    event.preventDefault();
    selectTab(newIndex);
  });

  // Click:
  for (var i = 0; i < tabs.length; i++) {
    (function (idx) {
      tabs[idx].addEventListener("click", function () {
        selectTab(idx);
      });
    })(i);
  }
}

// ═══════════════════════════════════════════════════════════
// ② ACCORDION — ARIA PATTERN:
// ═══════════════════════════════════════════════════════════

function AccessibleAccordion(container) {
  var triggers = container.querySelectorAll("[aria-expanded]");

  // HTML structure:
  // <h3>
  //   <button aria-expanded="false" aria-controls="sect-1">
  //     Section 1
  //   </button>
  // </h3>
  // <div id="sect-1" role="region"
  //   aria-labelledby="trigger-1" hidden>
  //   Content...
  // </div>

  for (var i = 0; i < triggers.length; i++) {
    (function (trigger) {
      trigger.addEventListener("click", function () {
        var expanded = trigger.getAttribute("aria-expanded") === "true";
        var panelId = trigger.getAttribute("aria-controls");
        var panel = document.getElementById(panelId);

        // Toggle:
        trigger.setAttribute("aria-expanded", String(!expanded));
        panel.hidden = expanded;
      });
    })(triggers[i]);
  }
}

// ═══════════════════════════════════════════════════════════
// ③ CUSTOM SWITCH (toggle) — ARIA PATTERN:
// ═══════════════════════════════════════════════════════════

function AccessibleSwitch(element) {
  // <button role="switch" aria-checked="false"
  //   aria-label="Dark mode">
  //   <span aria-hidden="true">OFF</span>
  // </button>

  element.addEventListener("click", toggle);
  element.addEventListener("keydown", function (event) {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      toggle();
    }
  });

  function toggle() {
    var checked = element.getAttribute("aria-checked") === "true";
    element.setAttribute("aria-checked", String(!checked));
    // Screen reader: "Dark mode, switch, ON/OFF"

    // Visual update:
    var label = element.querySelector("span");
    if (label) label.textContent = checked ? "OFF" : "ON";

    // Callback:
    if (element.onToggle) element.onToggle(!checked);
  }
}

// ═══════════════════════════════════════════════════════════
// ④ LIVE REGION — THÔNG BÁO ĐỘNG:
// ═══════════════════════════════════════════════════════════

function LiveRegionManager() {
  // polite: đọc khi screen reader rảnh
  // assertive: đọc NGAY, ngắt mọi thứ!

  var _polite = document.createElement("div");
  _polite.setAttribute("aria-live", "polite");
  _polite.setAttribute("aria-atomic", "true");
  _polite.className = "sr-only";
  document.body.appendChild(_polite);

  var _assertive = document.createElement("div");
  _assertive.setAttribute("aria-live", "assertive");
  _assertive.setAttribute("aria-atomic", "true");
  _assertive.className = "sr-only";
  document.body.appendChild(_assertive);

  function announce(message, priority) {
    var region = priority === "assertive" ? _assertive : _polite;
    region.textContent = ""; // Clear trước
    setTimeout(function () {
      region.textContent = message;
    }, 50);
    // → Screen reader tự đọc khi content thay đổi!
  }

  return { announce: announce };
}

// var announcer = LiveRegionManager();
// announcer.announce('3 kết quả tìm thấy', 'polite');
// announcer.announce('Lỗi: Mất kết nối mạng!', 'assertive');
```

---

## §6. Tự Viết — ARIA Validator!

```javascript
// ═══════════════════════════════════════════════════════════
// ARIA VALIDATOR — TỰ VIẾT!
// Kiểm tra ARIA dùng ĐÚNG cách!
// ═══════════════════════════════════════════════════════════

var ARIAValidator = (function () {
  // Allowed ARIA attributes per role:
  var _roleAttributes = {
    button: [
      "aria-expanded",
      "aria-pressed",
      "aria-disabled",
      "aria-label",
      "aria-labelledby",
      "aria-describedby",
      "aria-haspopup",
      "aria-controls",
    ],
    tab: [
      "aria-selected",
      "aria-controls",
      "aria-disabled",
      "aria-label",
      "aria-labelledby",
    ],
    tabpanel: ["aria-labelledby", "aria-label", "aria-hidden"],
    checkbox: [
      "aria-checked",
      "aria-disabled",
      "aria-label",
      "aria-labelledby",
      "aria-describedby",
      "aria-required",
    ],
    switch: ["aria-checked", "aria-label", "aria-labelledby", "aria-disabled"],
    dialog: ["aria-label", "aria-labelledby", "aria-describedby", "aria-modal"],
    alert: ["aria-label", "aria-labelledby", "aria-live"],
    link: [
      "aria-label",
      "aria-labelledby",
      "aria-describedby",
      "aria-disabled",
      "aria-current",
    ],
    img: ["aria-label", "aria-labelledby", "aria-describedby", "aria-hidden"],
  };

  // Required attributes per role:
  var _requiredAttributes = {
    checkbox: ["aria-checked"],
    switch: ["aria-checked"],
    tab: ["aria-selected"],
    combobox: ["aria-expanded"],
    slider: ["aria-valuenow", "aria-valuemin", "aria-valuemax"],
  };

  function validate(root) {
    root = root || document.body;
    var issues = [];

    // ① Kiểm tra: role có required attributes:
    var roledElements = root.querySelectorAll("[role]");
    for (var i = 0; i < roledElements.length; i++) {
      var el = roledElements[i];
      var role = el.getAttribute("role");
      var required = _requiredAttributes[role] || [];

      for (var j = 0; j < required.length; j++) {
        if (!el.hasAttribute(required[j])) {
          issues.push({
            type: "error",
            rule: "required-attr",
            message: 'role="' + role + '" cần ' + required[j],
            element: el.outerHTML.substring(0, 80),
          });
        }
      }
    }

    // ② Kiểm tra: role="button" phải có keyboard:
    var ariaButtons = root.querySelectorAll('[role="button"]');
    for (var k = 0; k < ariaButtons.length; k++) {
      var btn = ariaButtons[k];
      if (btn.tagName.toLowerCase() !== "button") {
        if (!btn.hasAttribute("tabindex")) {
          issues.push({
            type: "error",
            rule: "keyboard-access",
            message: 'role="button" cần tabindex="0"!',
            element: btn.outerHTML.substring(0, 80),
          });
        }
      }
    }

    // ③ Kiểm tra: aria-hidden trên focusable:
    var hiddenFocusable = root.querySelectorAll(
      '[aria-hidden="true"] button, ' +
        '[aria-hidden="true"] a[href], ' +
        '[aria-hidden="true"] input, ' +
        'button[aria-hidden="true"], ' +
        'a[aria-hidden="true"]',
    );
    for (var m = 0; m < hiddenFocusable.length; m++) {
      issues.push({
        type: "error",
        rule: "hidden-focusable",
        message: 'aria-hidden="true" trên focusable element!',
        element: hiddenFocusable[m].outerHTML.substring(0, 80),
      });
    }

    // ④ Kiểm tra: interactive ARIA phải có name:
    var interactiveRoles = root.querySelectorAll(
      '[role="button"], [role="link"], [role="tab"], ' +
        '[role="checkbox"], [role="switch"], [role="menuitem"]',
    );
    for (var n = 0; n < interactiveRoles.length; n++) {
      var interEl = interactiveRoles[n];
      var name =
        interEl.textContent.trim() ||
        interEl.getAttribute("aria-label") ||
        interEl.getAttribute("aria-labelledby") ||
        interEl.getAttribute("title");
      if (!name) {
        issues.push({
          type: "error",
          rule: "missing-name",
          message:
            'role="' +
            interEl.getAttribute("role") +
            '" thiếu accessible name!',
          element: interEl.outerHTML.substring(0, 80),
        });
      }
    }

    // ⑤ Kiểm tra: dùng HTML native thay vì ARIA:
    var unnecessaryAria = root.querySelectorAll(
      'button[role="button"], a[role="link"], ' +
        'nav[role="navigation"], main[role="main"], ' +
        'header[role="banner"], footer[role="contentinfo"]',
    );
    for (var p = 0; p < unnecessaryAria.length; p++) {
      issues.push({
        type: "warning",
        rule: "redundant-role",
        message: "Role thừa! HTML native đã có role này!",
        element: unnecessaryAria[p].outerHTML.substring(0, 80),
      });
    }

    return issues;
  }

  return { validate: validate };
})();
```

---

## §7. React & ARIA!

```javascript
// ═══════════════════════════════════════════════════════════
// REACT ARIA COMPONENTS — TỰ VIẾT!
// ═══════════════════════════════════════════════════════════

// ① REACT TABS:
function ReactTabs(props) {
  var activeState = React.useState(0);
  var activeIndex = activeState[0];
  var setActive = activeState[1];
  var tabRefs = React.useRef([]);

  function handleKeyDown(event) {
    var newIndex = activeIndex;
    switch (event.key) {
      case "ArrowRight":
        newIndex = (activeIndex + 1) % props.tabs.length;
        break;
      case "ArrowLeft":
        newIndex = (activeIndex - 1 + props.tabs.length) % props.tabs.length;
        break;
      case "Home":
        newIndex = 0;
        break;
      case "End":
        newIndex = props.tabs.length - 1;
        break;
      default:
        return;
    }
    event.preventDefault();
    setActive(newIndex);
    tabRefs.current[newIndex].focus();
  }

  return React.createElement(
    "div",
    null,
    // Tab list:
    React.createElement(
      "div",
      {
        role: "tablist",
        "aria-label": props.label,
        onKeyDown: handleKeyDown,
      },
      props.tabs.map(function (tab, i) {
        return React.createElement(
          "button",
          {
            key: i,
            ref: function (el) {
              tabRefs.current[i] = el;
            },
            role: "tab",
            id: "tab-" + i,
            "aria-selected": i === activeIndex ? "true" : "false",
            "aria-controls": "panel-" + i,
            tabIndex: i === activeIndex ? 0 : -1,
            onClick: function () {
              setActive(i);
            },
          },
          tab.title,
        );
      }),
    ),
    // Tab panels:
    props.tabs.map(function (tab, i) {
      if (i !== activeIndex) return null;
      return React.createElement(
        "div",
        {
          key: i,
          role: "tabpanel",
          id: "panel-" + i,
          "aria-labelledby": "tab-" + i,
          tabIndex: 0,
        },
        tab.content,
      );
    }),
  );
}

// ② REACT DISCLOSURE (show/hide):
function ReactDisclosure(props) {
  var state = React.useState(props.defaultOpen || false);
  var isOpen = state[0];
  var setOpen = state[1];
  var panelId = "disclosure-" + (props.id || "default");

  return React.createElement(
    "div",
    null,
    React.createElement(
      "button",
      {
        "aria-expanded": String(isOpen),
        "aria-controls": panelId,
        onClick: function () {
          setOpen(!isOpen);
        },
      },
      props.triggerText,
    ),
    isOpen
      ? React.createElement(
          "div",
          {
            id: panelId,
            role: "region",
            "aria-labelledby": props.id,
          },
          props.children,
        )
      : null,
  );
}

// ③ REACT LIVE ANNOUNCER HOOK:
function useAnnounce() {
  var ref = React.useRef(null);

  React.useEffect(function () {
    var el = document.createElement("div");
    el.setAttribute("aria-live", "polite");
    el.setAttribute("aria-atomic", "true");
    el.className = "sr-only";
    document.body.appendChild(el);
    ref.current = el;
    return function () {
      document.body.removeChild(el);
    };
  }, []);

  return function announce(message) {
    if (ref.current) {
      ref.current.textContent = "";
      setTimeout(function () {
        ref.current.textContent = message;
      }, 50);
    }
  };
}
// var announce = useAnnounce();
// announce('Đã thêm vào giỏ hàng');
```

---

## §8. Tổng Kết & Câu Hỏi Phỏng Vấn!

```
  ARIA — TỔNG KẾT:
  ┌────────────────────────────────────────────────────────┐
  │                                                        │
  │  ARIA = bổ sung a11y info khi HTML không đủ!          │
  │  3 thành phần: Roles + Properties + States            │
  │  6 loại roles: Landmark, Widget, Document,            │
  │                 Live Region, Window, Abstract          │
  │                                                        │
  │  5 QUY TẮC:                                            │
  │  ① HTML native TRƯỚC, ARIA SAU!                       │
  │  ② Không thay đổi semantic HTML!                      │
  │  ③ Interactive ARIA → phải có keyboard!               │
  │  ④ Không aria-hidden trên focusable!                  │
  │  ⑤ Mọi interactive phải có name!                      │
  │                                                        │
  │  ⚠️ ARIA CHỈ thay đổi A11y Tree!                      │
  │  → Không thay đổi visual hay behavior!                │
  │  → Phải tự thêm CSS + JS!                            │
  │  → "No ARIA is better than bad ARIA!"                 │
  │                                                        │
  └────────────────────────────────────────────────────────┘
```

**❓ Q1: ARIA roles là gì và mục đích?**

> ARIA roles = HTML attributes cho screen readers biết **vai trò** của element. Mục đích: bổ sung accessibility info khi HTML native không đủ. VD: HTML không có `<tab>` → dùng `<div role="tab">`. ARIA chỉ thay đổi **Accessibility Tree**, không thay đổi visual/behavior — phải tự thêm CSS + JS. 6 loại: Landmark (navigation), Widget (tab, dialog), Document Structure (heading), Live Region (alert), Window (dialog), Abstract (không dùng).

**❓ Q2: Khi nào DÙNG và KHÔNG DÙNG ARIA?**

> **DÙNG** khi HTML native không có widget tương ứng: tabs, accordion, tree view, combobox, modal dialog, switch. **KHÔNG DÙNG** khi HTML đã có: `<button>` thay `<div role="button">`, `<nav>` thay `<div role="navigation">`, `<a href>` thay `<span role="link">`. Quy tắc #1: **"Prefer native HTML"**. Native có sẵn keyboard, focus, screen reader support. ARIA phải tự implement tất cả. "No ARIA is better than bad ARIA!"

**❓ Q3: aria-label vs aria-labelledby vs aria-describedby?**

> **aria-label**: nhãn trực tiếp bằng string — dùng khi KHÔNG có visible text (icon button: `aria-label="Đóng"`). **aria-labelledby**: nhãn từ element khác bằng ID — dùng khi CÓ visible text ở nơi khác (`<h2 id="title">` → `aria-labelledby="title"`). **aria-describedby**: mô tả BỔ SUNG — đọc SAU name + role (`aria-describedby="help"` → "Ít nhất 8 ký tự"). Ưu tiên: aria-labelledby > aria-label > text content.

**❓ Q4: aria-hidden="true" dùng khi nào?**

> Dùng để **ẩn** element khỏi screen reader khi: decorative icons (`<svg aria-hidden="true">`), duplicate content (visual + sr-only), animation elements không có ý nghĩa. **TUYỆT ĐỐI KHÔNG** đặt trên focusable elements (button, link, input) — user keyboard sẽ focus vào element "vô hình". Cũng cẩn thận: aria-hidden trên parent ẩn TẤT CẢ children.

**❓ Q5: Giải thích ARIA live regions?**

> Live regions thông báo screen reader khi content **thay đổi động** mà không cần focus. `aria-live="polite"`: đọc khi SR rảnh (search results count, status updates). `aria-live="assertive"`: đọc **NGAY**, ngắt mọi thứ (error alerts, connection lost). `role="alert"` = `aria-live="assertive"`. `role="status"` = `aria-live="polite"`. `aria-atomic="true"`: đọc TOÀN BỘ region, không chỉ phần thay đổi.

---

> 📝 **Ghi nhớ cuối cùng:**
> "ARIA bổ sung a11y info, KHÔNG thay thế HTML native! Rule #1: dùng HTML trước! Roles cho screen reader biết element LÀ GÌ, Properties cho biết QUAN HỆ, States cho biết TRẠNG THÁI! Interactive ARIA phải có keyboard + name! No ARIA is better than bad ARIA!"
