# WCAG Guidelines & 4 Nguyên Tắc Accessibility — Deep Dive!

> **Chủ đề**: What are WCAG guidelines, and the four principles of accessibility?
> **Ngôn ngữ**: Tiếng Việt — giải thích cực kỳ chi tiết!
> **Phương châm**: Tự viết lại bằng tay — KHÔNG dùng thư viện!

---

## Mục Lục

1. [§1. WCAG Là Gì? — Tổng Quan!](#1)
2. [§2. P — Perceivable (Nhận Biết Được)!](#2)
3. [§3. O — Operable (Thao Tác Được)!](#3)
4. [§4. U — Understandable (Hiểu Được)!](#4)
5. [§5. R — Robust (Mạnh Mẽ)!](#5)
6. [§6. Tự Viết — WCAG Compliance Checker!](#6)
7. [§7. Tự Viết — React POUR Components!](#7)
8. [§8. Tổng Kết & Câu Hỏi Phỏng Vấn!](#8)

---

## §1. WCAG Là Gì? — Tổng Quan!

```
  WCAG — WEB CONTENT ACCESSIBILITY GUIDELINES:
  ┌────────────────────────────────────────────────────────┐
  │                                                        │
  │  WCAG là BỘ TIÊU CHUẨN do W3C ban hành               │
  │  để đảm bảo web accessible cho MỌI NGƯỜI!            │
  │                                                        │
  │  LỊCH SỬ:                                             │
  │  ┌──────────────────────────────────────────────────┐  │
  │  │  WCAG 1.0 (1999) → 14 guidelines, checkpoints  │  │
  │  │  WCAG 2.0 (2008) → 4 principles, 12 guidelines │  │
  │  │  WCAG 2.1 (2018) → +17 success criteria (mobile)│  │
  │  │  WCAG 2.2 (2023) → +9 criteria (cognitive, auth)│  │
  │  │  WCAG 3.0 (draft) → đang phát triển...         │  │
  │  └──────────────────────────────────────────────────┘  │
  │                                                        │
  │  CẤU TRÚC:                                            │
  │  ┌──────────────────────────────────────────────────┐  │
  │  │                                                  │  │
  │  │  4 PRINCIPLES (Nguyên tắc)                       │  │
  │  │    └─ 13 GUIDELINES (Hướng dẫn)                  │  │
  │  │       └─ 78 SUCCESS CRITERIA (Tiêu chí)          │  │
  │  │          └─ TECHNIQUES (Kỹ thuật thực hiện)      │  │
  │  │                                                  │  │
  │  │  VÍ DỤ:                                          │  │
  │  │  Principle 1: Perceivable                        │  │
  │  │    └─ Guideline 1.1: Text Alternatives           │  │
  │  │       └─ SC 1.1.1: Non-text Content (Level A)    │  │
  │  │          └─ Technique: img alt="mô tả"          │  │
  │  └──────────────────────────────────────────────────┘  │
  │                                                        │
  │  3 MỨC ĐỘ TUÂN THỦ:                                   │
  │  ┌──────────────────────────────────────────────────┐  │
  │  │                                                  │  │
  │  │  Level A — TỐI THIỂU:                            │  │
  │  │  → Yêu cầu cơ bản nhất!                        │  │
  │  │  → VD: alt text cho ảnh, keyboard accessible    │  │
  │  │  → Nếu không đạt → hoàn toàn không usable!     │  │
  │  │                                                  │  │
  │  │  Level AA — TIÊU CHUẨN (phổ biến nhất!):        │  │
  │  │  → Bao gồm Level A + thêm tiêu chí!            │  │
  │  │  → VD: contrast ratio 4.5:1, resize text 200%  │  │
  │  │  → Hầu hết luật pháp yêu cầu level này!        │  │
  │  │  → ADA (Mỹ), EN 301 549 (EU), AODA (Canada)    │  │
  │  │                                                  │  │
  │  │  Level AAA — TỐI ĐA:                             │  │
  │  │  → Bao gồm A + AA + thêm tiêu chí!             │  │
  │  │  → VD: contrast 7:1, sign language cho video    │  │
  │  │  → Khó đạt 100% toàn site!                     │  │
  │  │  → W3C KHÔNG khuyến nghị làm target toàn site!  │  │
  │  │                                                  │  │
  │  └──────────────────────────────────────────────────┘  │
  │                                                        │
  └────────────────────────────────────────────────────────┘
```

---

## §2. P — Perceivable (Nhận Biết Được)!

```
  PRINCIPLE 1 — PERCEIVABLE:
  ┌────────────────────────────────────────────────────────┐
  │                                                        │
  │  "User PHẢI NHẬN BIẾT ĐƯỢC thông tin & UI!"           │
  │  → Thông tin KHÔNG được ẩn khỏi MỌI giác quan!       │
  │                                                        │
  │  4 GUIDELINES:                                         │
  │                                                        │
  │  1.1 TEXT ALTERNATIVES:                                │
  │  ┌──────────────────────────────────────────────────┐  │
  │  │  Mọi non-text content phải có text alternative! │  │
  │  │                                                  │  │
  │  │  ✅ <img src="cat.jpg" alt="Mèo cam nằm ngủ">  │  │
  │  │  ❌ <img src="cat.jpg">  ← Screen reader: ???   │  │
  │  │                                                  │  │
  │  │  ✅ Decorative: <img alt="" role="presentation"> │  │
  │  │  ✅ Complex: <figure> + <figcaption>             │  │
  │  │  ✅ Icon button: <button aria-label="Đóng">     │  │
  │  └──────────────────────────────────────────────────┘  │
  │                                                        │
  │  1.2 TIME-BASED MEDIA:                                 │
  │  ┌──────────────────────────────────────────────────┐  │
  │  │  Video/Audio phải có alternatives!               │  │
  │  │                                                  │  │
  │  │  Level A: Phụ đề (captions) cho video có tiếng  │  │
  │  │  Level A: Mô tả text cho video/audio            │  │
  │  │  Level AA: Phụ đề LIVE (real-time)              │  │
  │  │  Level AA: Audio description (mô tả hình ảnh)   │  │
  │  │  Level AAA: Sign language (ngôn ngữ ký hiệu)   │  │
  │  └──────────────────────────────────────────────────┘  │
  │                                                        │
  │  1.3 ADAPTABLE:                                        │
  │  ┌──────────────────────────────────────────────────┐  │
  │  │  Content phải trình bày được nhiều cách         │  │
  │  │  MÀ KHÔNG mất thông tin!                        │  │
  │  │                                                  │  │
  │  │  → Dùng semantic HTML (heading, list, table)    │  │
  │  │  → KHÔNG chỉ dùng visual format truyền tin     │  │
  │  │    (bold, size, color) mà thiếu semantic!       │  │
  │  │  → Responsive: landscape + portrait!            │  │
  │  └──────────────────────────────────────────────────┘  │
  │                                                        │
  │  1.4 DISTINGUISHABLE:                                  │
  │  ┌──────────────────────────────────────────────────┐  │
  │  │  User phải PHÂN BIỆT được content!              │  │
  │  │                                                  │  │
  │  │  Color: KHÔNG chỉ dùng MÀU để truyền tin!      │  │
  │  │  ❌ "Fields in red are required"                 │  │
  │  │  ✅ "Fields marked with * are required" + red   │  │
  │  │                                                  │  │
  │  │  Contrast (AA): text 4.5:1, large text 3:1     │  │
  │  │  Contrast (AAA): text 7:1, large text 4.5:1    │  │
  │  │                                                  │  │
  │  │  Resize: text phóng to 200% KHÔNG bị vỡ layout!│  │
  │  │  Audio control: tự tắt được âm thanh tự play!   │  │
  │  └──────────────────────────────────────────────────┘  │
  │                                                        │
  └────────────────────────────────────────────────────────┘
```

```javascript
// ═══════════════════════════════════════════════════════════
// TỰ VIẾT — PERCEIVABLE HELPERS:
// ═══════════════════════════════════════════════════════════

// ① CONTRAST RATIO CALCULATOR:
function ContrastChecker() {
  // Parse CSS color → RGB:
  function parseColor(str) {
    if (str.charAt(0) === "#") {
      var hex = str.substring(1);
      if (hex.length === 3) {
        hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2];
      }
      return {
        r: parseInt(hex.substring(0, 2), 16),
        g: parseInt(hex.substring(2, 4), 16),
        b: parseInt(hex.substring(4, 6), 16),
      };
    }
    var match = str.match(/\d+/g);
    return match ? { r: +match[0], g: +match[1], b: +match[2] } : null;
  }

  // Relative luminance (WCAG formula):
  function luminance(rgb) {
    var channels = [rgb.r, rgb.g, rgb.b].map(function (val) {
      val = val / 255;
      return val <= 0.03928
        ? val / 12.92
        : Math.pow((val + 0.055) / 1.055, 2.4);
    });
    return 0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2];
  }

  // Contrast ratio:
  function ratio(color1, color2) {
    var l1 = luminance(parseColor(color1));
    var l2 = luminance(parseColor(color2));
    var lighter = Math.max(l1, l2);
    var darker = Math.min(l1, l2);
    return (lighter + 0.05) / (darker + 0.05);
  }

  // WCAG level check:
  function check(foreground, background, fontSize) {
    var r = ratio(foreground, background);
    var isLarge = fontSize >= 24 || fontSize >= 18.66;
    // Font >= 24px hoặc >= 18.66px bold = "large text"

    return {
      ratio: r.toFixed(2),
      levelA: true, // Level A không yêu cầu contrast cụ thể
      levelAA: isLarge ? r >= 3 : r >= 4.5,
      levelAAA: isLarge ? r >= 4.5 : r >= 7,
    };
  }

  return { ratio: ratio, check: check, parseColor: parseColor };
}

// var checker = ContrastChecker();
// checker.check('#333333', '#FFFFFF', 16);
// → { ratio: "12.63", levelAA: true, levelAAA: true }
// checker.check('#777777', '#FFFFFF', 16);
// → { ratio: "4.48", levelAA: false, levelAAA: false }

// ② ALT TEXT VALIDATOR:
function validateAltTexts(root) {
  var issues = [];
  var images = (root || document).querySelectorAll("img");

  for (var i = 0; i < images.length; i++) {
    var img = images[i];
    var alt = img.getAttribute("alt");

    if (alt === null) {
      issues.push({
        severity: "error",
        element: img,
        message: "THIẾU alt! Screen reader sẽ đọc filename!",
      });
    } else if (alt === "") {
      // alt="" = decorative → OK nếu đúng là decorative
      if (!img.getAttribute("role")) {
        issues.push({
          severity: "warning",
          element: img,
          message: 'alt="" — nên thêm role="presentation"',
        });
      }
    } else if (alt.length > 125) {
      issues.push({
        severity: "warning",
        element: img,
        message: "alt quá dài (" + alt.length + " chars)!",
      });
    } else if (/^(image|photo|picture|img)/i.test(alt)) {
      issues.push({
        severity: "warning",
        element: img,
        message: 'alt bắt đầu bằng "image/photo" — thừa!',
        // Screen reader đã nói "image" rồi!
      });
    }
  }
  return issues;
}
```

---

## §3. O — Operable (Thao Tác Được)!

```
  PRINCIPLE 2 — OPERABLE:
  ┌────────────────────────────────────────────────────────┐
  │                                                        │
  │  "User PHẢI THAO TÁC ĐƯỢC với mọi UI!"               │
  │  → Không yêu cầu hành động user KHÔNG THỂ làm!       │
  │                                                        │
  │  4 GUIDELINES:                                         │
  │                                                        │
  │  2.1 KEYBOARD ACCESSIBLE:                              │
  │  ┌──────────────────────────────────────────────────┐  │
  │  │  MỌI chức năng phải dùng được bằng KEYBOARD!    │  │
  │  │                                                  │  │
  │  │  Tab / Shift+Tab → di chuyển focus              │  │
  │  │  Enter / Space → activate                       │  │
  │  │  Arrow keys → navigate menus                    │  │
  │  │  Escape → đóng modal/popup                      │  │
  │  │                                                  │  │
  │  │  ❌ KEYBOARD TRAP: focus bị "kẹt" không thoát   │  │
  │  │  → NGOẠI TRỪ modal (focus trap có chủ đích!)   │  │
  │  └──────────────────────────────────────────────────┘  │
  │                                                        │
  │  2.2 ENOUGH TIME:                                      │
  │  ┌──────────────────────────────────────────────────┐  │
  │  │  User phải có ĐỦ THỜI GIAN đọc & tương tác!    │  │
  │  │                                                  │  │
  │  │  → Auto-scroll/slideshow: phải pause được!      │  │
  │  │  → Session timeout: cảnh báo + gia hạn!        │  │
  │  │  → Time limit: cho phép tắt/kéo dài/gấp 10x!  │  │
  │  └──────────────────────────────────────────────────┘  │
  │                                                        │
  │  2.3 SEIZURES & PHYSICAL:                              │
  │  ┌──────────────────────────────────────────────────┐  │
  │  │  KHÔNG thiết kế gây seizure (co giật)!          │  │
  │  │                                                  │  │
  │  │  ❌ Flash > 3 lần/giây!                          │  │
  │  │  ❌ Nội dung nhấp nháy liên tục!                 │  │
  │  │  → Có thể gây động kinh quang mẫn!             │  │
  │  └──────────────────────────────────────────────────┘  │
  │                                                        │
  │  2.4 NAVIGABLE:                                        │
  │  ┌──────────────────────────────────────────────────┐  │
  │  │  User phải TÌM ĐƯỢC content & biết ở đâu!      │  │
  │  │                                                  │  │
  │  │  → Skip navigation links!                       │  │
  │  │  → Descriptive page <title>!                    │  │
  │  │  → Logical focus order (tab order)!             │  │
  │  │  → Link text descriptive (không "click here")!  │  │
  │  │  → Multiple ways to find (search, sitemap, nav)!│  │
  │  │  → Visible focus indicator!                     │  │
  │  │     ❌ outline: none  ← NGUY HIỂM!              │  │
  │  │     ✅ :focus-visible { outline: 2px solid }    │  │
  │  └──────────────────────────────────────────────────┘  │
  │                                                        │
  └────────────────────────────────────────────────────────┘
```

```javascript
// ═══════════════════════════════════════════════════════════
// TỰ VIẾT — OPERABLE HELPERS:
// ═══════════════════════════════════════════════════════════

// ① KEYBOARD-ACCESSIBLE CUSTOM BUTTON:
function makeKeyboardAccessible(element, onClick) {
  // Thêm khả năng keyboard cho non-native elements:
  element.setAttribute("tabindex", "0");
  element.setAttribute("role", "button");

  element.addEventListener("click", onClick);
  element.addEventListener("keydown", function (event) {
    // Enter hoặc Space → activate:
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault(); // Space: chặn scroll!
      onClick(event);
    }
  });
}

// ② FOCUS ORDER AUDITOR:
function auditFocusOrder(root) {
  root = root || document.body;
  var focusable = root.querySelectorAll(
    "a[href], button, input, select, textarea, " +
      '[tabindex]:not([tabindex="-1"])',
  );

  var issues = [];
  for (var i = 0; i < focusable.length; i++) {
    var el = focusable[i];
    var tabindex = el.getAttribute("tabindex");

    // tabindex > 0 → thay đổi order → BAD PRACTICE!
    if (tabindex && parseInt(tabindex) > 0) {
      issues.push({
        severity: "warning",
        element: el,
        message:
          "tabindex=" + tabindex + " → thay đổi focus order! Dùng DOM order!",
      });
    }

    // Check visible focus:
    var style = window.getComputedStyle(el);
    if (style.outlineStyle === "none" && style.outlineWidth === "0px") {
      issues.push({
        severity: "error",
        element: el,
        message: "outline:none → KHÔNG CÓ visible focus!",
      });
    }
  }
  return issues;
}

// ③ SESSION TIMEOUT WARNING (WCAG 2.2.1):
function SessionTimeoutWarning(timeoutMs) {
  var _warningMs = 60000; // Cảnh báo trước 1 phút
  var _timer = null;
  var _warningTimer = null;

  function start() {
    clear();
    // Warning trước khi timeout:
    _warningTimer = setTimeout(function () {
      var extend = confirm("Phiên sắp hết hạn! Bạn có muốn gia hạn không?");
      if (extend) start(); // Reset timer!
      // Nếu không → để timeout tự nhiên
    }, timeoutMs - _warningMs);

    _timer = setTimeout(function () {
      window.location.href = "/login?reason=timeout";
    }, timeoutMs);
  }

  function clear() {
    clearTimeout(_timer);
    clearTimeout(_warningTimer);
  }

  return { start: start, clear: clear };
}
```

---

## §4. U — Understandable (Hiểu Được)!

```
  PRINCIPLE 3 — UNDERSTANDABLE:
  ┌────────────────────────────────────────────────────────┐
  │                                                        │
  │  "User PHẢI HIỂU ĐƯỢC content & cách dùng UI!"       │
  │                                                        │
  │  3 GUIDELINES:                                         │
  │                                                        │
  │  3.1 READABLE:                                         │
  │  ┌──────────────────────────────────────────────────┐  │
  │  │  Content phải ĐỌC HIỂU được!                   │  │
  │  │                                                  │  │
  │  │  ① Language declaration:                         │  │
  │  │  <html lang="vi">  ← Screen reader đọc đúng!   │  │
  │  │  <span lang="en">Hello</span> ← chuyển ngôn ngữ│  │
  │  │                                                  │  │
  │  │  ② Abbreviations:                                │  │
  │  │  <abbr title="World Wide Web">WWW</abbr>        │  │
  │  │                                                  │  │
  │  │  ③ Reading level (AAA):                          │  │
  │  │  Viết ở trình độ trung học cơ sở!               │  │
  │  └──────────────────────────────────────────────────┘  │
  │                                                        │
  │  3.2 PREDICTABLE:                                      │
  │  ┌──────────────────────────────────────────────────┐  │
  │  │  UI phải HOẠT ĐỘNG NHẤT QUÁN!                   │  │
  │  │                                                  │  │
  │  │  ❌ Focus vào input → trang tự redirect!         │  │
  │  │  ❌ Select option → form tự submit!              │  │
  │  │  ❌ Nav items thay đổi thứ tự giữa các trang!   │  │
  │  │                                                  │  │
  │  │  ✅ Navigation nhất quán trên mọi trang!        │  │
  │  │  ✅ Components cùng loại hoạt động giống nhau!  │  │
  │  │  ✅ Changes chỉ xảy ra khi user YÊU CẦU!       │  │
  │  └──────────────────────────────────────────────────┘  │
  │                                                        │
  │  3.3 INPUT ASSISTANCE:                                 │
  │  ┌──────────────────────────────────────────────────┐  │
  │  │  Giúp user TRÁNH & SỬA lỗi!                    │  │
  │  │                                                  │  │
  │  │  ① Error identification (A):                     │  │
  │  │  → Lỗi phải NHẬN DIỆN được (text, không chỉ    │  │
  │  │    màu đỏ!)                                     │  │
  │  │                                                  │  │
  │  │  ② Labels/Instructions (A):                      │  │
  │  │  → Mọi input có label + hướng dẫn!             │  │
  │  │                                                  │  │
  │  │  ③ Error suggestion (AA):                        │  │
  │  │  → Gợi ý CÁCH SỬA lỗi!                        │  │
  │  │  "Email phải chứa @. VD: name@example.com"     │  │
  │  │                                                  │  │
  │  │  ④ Error prevention (AA):                        │  │
  │  │  → Giao dịch: confirm trước khi submit!         │  │
  │  │  → Có thể undo/review!                         │  │
  │  └──────────────────────────────────────────────────┘  │
  │                                                        │
  └────────────────────────────────────────────────────────┘
```

```javascript
// ═══════════════════════════════════════════════════════════
// TỰ VIẾT — ACCESSIBLE FORM VALIDATION:
// ═══════════════════════════════════════════════════════════

function AccessibleFormValidator(formElement) {
  var _rules = {};
  var _errorContainer = null;

  function addRule(fieldName, validators) {
    _rules[fieldName] = validators;
  }

  function validate() {
    var errors = {};
    var firstErrorField = null;

    for (var fieldName in _rules) {
      var field = formElement.querySelector('[name="' + fieldName + '"]');
      if (!field) continue;

      var value = field.value.trim();
      var validators = _rules[fieldName];

      for (var i = 0; i < validators.length; i++) {
        var result = validators[i](value);
        if (result !== true) {
          errors[fieldName] = result; // error message
          if (!firstErrorField) firstErrorField = field;
          break;
        }
      }
    }

    displayErrors(errors);

    // Focus vào field lỗi ĐẦU TIÊN:
    if (firstErrorField) {
      firstErrorField.focus();
    }

    return Object.keys(errors).length === 0;
  }

  function displayErrors(errors) {
    // Clear old errors:
    var oldErrors = formElement.querySelectorAll(".field-error");
    for (var i = 0; i < oldErrors.length; i++) {
      oldErrors[i].remove();
    }

    // Reset aria states:
    var inputs = formElement.querySelectorAll("input, select, textarea");
    for (var j = 0; j < inputs.length; j++) {
      inputs[j].setAttribute("aria-invalid", "false");
      inputs[j].removeAttribute("aria-describedby");
    }

    // Set new errors:
    for (var fieldName in errors) {
      var field = formElement.querySelector('[name="' + fieldName + '"]');
      if (!field) continue;

      var errorId = "error-" + fieldName;

      // aria-invalid cho screen reader:
      field.setAttribute("aria-invalid", "true");
      field.setAttribute("aria-describedby", errorId);

      // Error message element:
      var errorEl = document.createElement("span");
      errorEl.id = errorId;
      errorEl.className = "field-error";
      errorEl.setAttribute("role", "alert");
      // ↑ role="alert" → screen reader ĐỌC NGAY!
      errorEl.textContent = errors[fieldName];

      field.parentNode.insertBefore(errorEl, field.nextSibling);
    }

    // Error summary (cho nhiều lỗi):
    if (Object.keys(errors).length > 1) {
      announceErrors(errors);
    }
  }

  function announceErrors(errors) {
    var summary = document.getElementById("error-summary");
    if (!summary) {
      summary = document.createElement("div");
      summary.id = "error-summary";
      summary.setAttribute("role", "alert");
      summary.setAttribute("aria-live", "assertive");
      formElement.insertBefore(summary, formElement.firstChild);
    }
    var count = Object.keys(errors).length;
    summary.textContent = "Có " + count + " lỗi cần sửa.";
  }

  return { addRule: addRule, validate: validate };
}

// SỬ DỤNG:
// var validator = AccessibleFormValidator(myForm);
// validator.addRule('email', [
//     function(v) { return v ? true : 'Email là bắt buộc!'; },
//     function(v) { return v.includes('@') ? true :
//         'Email phải chứa @. VD: name@example.com'; }
// ]);
// validator.addRule('password', [
//     function(v) { return v ? true : 'Mật khẩu là bắt buộc!'; },
//     function(v) { return v.length >= 8 ? true :
//         'Mật khẩu phải ít nhất 8 ký tự!'; }
// ]);
// myForm.addEventListener('submit', function(e) {
//     e.preventDefault();
//     if (validator.validate()) { /* submit */ }
// });
```

---

## §5. R — Robust (Mạnh Mẽ)!

```
  PRINCIPLE 4 — ROBUST:
  ┌────────────────────────────────────────────────────────┐
  │                                                        │
  │  "Content phải TƯƠNG THÍCH với nhiều user agents      │
  │   & assistive technologies!"                           │
  │                                                        │
  │  1 GUIDELINE:                                          │
  │                                                        │
  │  4.1 COMPATIBLE:                                       │
  │  ┌──────────────────────────────────────────────────┐  │
  │  │                                                  │  │
  │  │  ① VALID HTML (4.1.1 — Parsing):                 │  │
  │  │  → Tags mở/đóng đúng cặp!                      │  │
  │  │  → IDs unique!                                  │  │
  │  │  → Attributes không duplicate!                  │  │
  │  │  → Elements lồng đúng quy tắc!                 │  │
  │  │                                                  │  │
  │  │  ❌ <p><div>text</div></p>  (div trong p!)      │  │
  │  │  ❌ <ul><div>item</div></ul> (div trong ul!)    │  │
  │  │  ✅ <p><span>text</span></p>                    │  │
  │  │  ✅ <ul><li>item</li></ul>                      │  │
  │  │                                                  │  │
  │  │  ② NAME, ROLE, VALUE (4.1.2):                    │  │
  │  │  → Mọi UI component phải có:                    │  │
  │  │    NAME: tên accessible (label, aria-label)     │  │
  │  │    ROLE: vai trò (button, link, checkbox)       │  │
  │  │    VALUE: giá trị/trạng thái hiện tại          │  │
  │  │                                                  │  │
  │  │  ❌ <div class="checkbox checked">              │  │
  │  │  → Name: ? Role: ? Value: ?                     │  │
  │  │                                                  │  │
  │  │  ✅ <input type="checkbox" id="agree"           │  │
  │  │        checked aria-label="Đồng ý điều khoản"> │  │
  │  │  → Name: "Đồng ý điều khoản"                   │  │
  │  │  → Role: checkbox                               │  │
  │  │  → Value: checked                               │  │
  │  │                                                  │  │
  │  │  ③ STATUS MESSAGES (4.1.3 — WCAG 2.1):          │  │
  │  │  → Thông báo trạng thái phải accessible!        │  │
  │  │  → Dùng role="status" / aria-live="polite"      │  │
  │  │  → "3 kết quả tìm thấy" → screen reader đọc!   │  │
  │  │  → "Đang tải..." → announce!                    │  │
  │  └──────────────────────────────────────────────────┘  │
  │                                                        │
  └────────────────────────────────────────────────────────┘
```

---

## §6. Tự Viết — WCAG Compliance Checker!

```javascript
// ═══════════════════════════════════════════════════════════
// WCAG COMPLIANCE CHECKER — TỰ VIẾT!
// ═══════════════════════════════════════════════════════════

var WCAGChecker = (function () {
  function checkPage(root) {
    root = root || document.body;
    var results = {
      perceivable: checkPerceivable(root),
      operable: checkOperable(root),
      understandable: checkUnderstandable(root),
      robust: checkRobust(root),
    };
    results.summary = summarize(results);
    return results;
  }

  // P — PERCEIVABLE:
  function checkPerceivable(root) {
    var issues = [];

    // 1.1.1 Images alt text:
    var imgs = root.querySelectorAll("img");
    for (var i = 0; i < imgs.length; i++) {
      if (!imgs[i].hasAttribute("alt")) {
        issues.push({
          level: "A",
          criterion: "1.1.1",
          message: "img thiếu alt",
          element: imgs[i],
        });
      }
    }

    // 1.4.3 Contrast (simplified):
    var texts = root.querySelectorAll("p, h1, h2, h3, span, a, button");
    var checker = ContrastChecker();
    for (var j = 0; j < texts.length; j++) {
      var style = window.getComputedStyle(texts[j]);
      var r = checker.check(
        style.color,
        style.backgroundColor,
        parseFloat(style.fontSize),
      );
      if (!r.levelAA) {
        issues.push({
          level: "AA",
          criterion: "1.4.3",
          message: "Contrast " + r.ratio + ":1 < 4.5:1",
          element: texts[j],
        });
      }
    }
    return issues;
  }

  // O — OPERABLE:
  function checkOperable(root) {
    var issues = [];

    // 2.1.1 Keyboard: onclick without keyboard:
    var clickables = root.querySelectorAll("[onclick]");
    for (var i = 0; i < clickables.length; i++) {
      var el = clickables[i];
      var tag = el.tagName.toLowerCase();
      if (tag !== "button" && tag !== "a" && tag !== "input") {
        var hasTabindex = el.hasAttribute("tabindex");
        var hasKeyHandler =
          el.hasAttribute("onkeydown") || el.hasAttribute("onkeypress");
        if (!hasTabindex || !hasKeyHandler) {
          issues.push({
            level: "A",
            criterion: "2.1.1",
            message: "onclick mà không keyboard accessible!",
            element: el,
          });
        }
      }
    }

    // 2.4.1 Skip nav:
    var skipLink = root.querySelector('a[href^="#main"], .skip-link');
    if (!skipLink) {
      issues.push({
        level: "A",
        criterion: "2.4.1",
        message: "Thiếu skip navigation link!",
      });
    }

    // 2.4.7 Visible focus:
    var focusable = root.querySelectorAll("a, button, input, [tabindex]");
    for (var k = 0; k < focusable.length; k++) {
      var s = window.getComputedStyle(focusable[k], ":focus");
      // Simplified check
    }
    return issues;
  }

  // U — UNDERSTANDABLE:
  function checkUnderstandable(root) {
    var issues = [];

    // 3.1.1 Language:
    var htmlEl = document.documentElement;
    if (!htmlEl.hasAttribute("lang")) {
      issues.push({
        level: "A",
        criterion: "3.1.1",
        message: "<html> thiếu lang attribute!",
      });
    }

    // 3.3.2 Labels:
    var inputs = root.querySelectorAll(
      'input:not([type="hidden"]):not([type="submit"]), select, textarea',
    );
    for (var i = 0; i < inputs.length; i++) {
      var inp = inputs[i];
      var hasLabel = false;
      if (inp.id) {
        hasLabel = !!root.querySelector('label[for="' + inp.id + '"]');
      }
      if (!hasLabel) hasLabel = !!inp.closest("label");
      if (!hasLabel) hasLabel = !!inp.getAttribute("aria-label");
      if (!hasLabel) hasLabel = !!inp.getAttribute("aria-labelledby");

      if (!hasLabel) {
        issues.push({
          level: "A",
          criterion: "3.3.2",
          message: "Input thiếu label!",
          element: inp,
        });
      }
    }
    return issues;
  }

  // R — ROBUST:
  function checkRobust(root) {
    var issues = [];

    // 4.1.1 Duplicate IDs:
    var allIds = root.querySelectorAll("[id]");
    var seenIds = {};
    for (var i = 0; i < allIds.length; i++) {
      var id = allIds[i].id;
      if (seenIds[id]) {
        issues.push({
          level: "A",
          criterion: "4.1.1",
          message: 'Duplicate ID: "' + id + '"!',
        });
      }
      seenIds[id] = true;
    }

    // 4.1.2 Name, Role, Value:
    var interactives = root.querySelectorAll(
      '[onclick], [role="button"], [role="checkbox"]',
    );
    for (var j = 0; j < interactives.length; j++) {
      var el = interactives[j];
      var name =
        el.textContent.trim() ||
        el.getAttribute("aria-label") ||
        el.getAttribute("title");
      if (!name) {
        issues.push({
          level: "A",
          criterion: "4.1.2",
          message: "Interactive element thiếu accessible name!",
          element: el,
        });
      }
    }
    return issues;
  }

  function summarize(results) {
    var total = 0;
    var byLevel = { A: 0, AA: 0, AAA: 0 };
    ["perceivable", "operable", "understandable", "robust"].forEach(
      function (p) {
        results[p].forEach(function (issue) {
          total++;
          byLevel[issue.level] = (byLevel[issue.level] || 0) + 1;
        });
      },
    );
    return { total: total, byLevel: byLevel };
  }

  return { checkPage: checkPage };
})();
```

---

## §7. Tự Viết — React POUR Components!

```javascript
// ═══════════════════════════════════════════════════════════
// REACT COMPONENTS THEO POUR — TỰ VIẾT!
// ═══════════════════════════════════════════════════════════

// ① P — AccessibleImage:
function AccessibleImage(props) {
  if (props.decorative) {
    return React.createElement("img", {
      src: props.src,
      alt: "",
      role: "presentation",
      "aria-hidden": "true",
    });
  }
  // Image có ý nghĩa → BẮT BUỘC alt:
  if (!props.alt) {
    console.error("AccessibleImage: alt là bắt buộc!");
  }
  return React.createElement(
    "figure",
    null,
    React.createElement("img", {
      src: props.src,
      alt: props.alt,
    }),
    props.caption
      ? React.createElement("figcaption", null, props.caption)
      : null,
  );
}

// ② O — SkipLink:
function SkipLink(props) {
  return React.createElement(
    "a",
    {
      href: "#" + (props.target || "main-content"),
      className: "skip-link",
      // CSS: position:absolute; top:-100%; :focus{top:0}
    },
    props.text || "Bỏ qua đến nội dung chính",
  );
}

// ③ U — AccessibleErrorMessage:
function AccessibleErrorMessage(props) {
  if (!props.error) return null;
  return React.createElement(
    "span",
    {
      id: props.id,
      role: "alert",
      "aria-live": "assertive",
      className: "error-message",
    },
    React.createElement("span", { "aria-hidden": "true" }, "⚠️ "),
    props.error,
  );
}

// ④ R — StatusMessage:
function StatusMessage(props) {
  return React.createElement(
    "div",
    {
      role: "status",
      "aria-live": "polite",
      "aria-atomic": "true",
      className: props.visuallyHidden ? "sr-only" : "status",
    },
    props.message,
  );
}
// Screen reader tự đọc khi message thay đổi!
```

---

## §8. Tổng Kết & Câu Hỏi Phỏng Vấn!

```
  WCAG POUR — TỔNG KẾT:
  ┌────────────────────────────────────────────────────────┐
  │                                                        │
  │  ┌──────────────────────────────────────┐              │
  │  │ P  Perceivable  │ Nhận biết được    │              │
  │  │    alt text, contrast, captions,     │              │
  │  │    không chỉ dùng màu               │              │
  │  ├──────────────────────────────────────┤              │
  │  │ O  Operable     │ Thao tác được     │              │
  │  │    keyboard, enough time,            │              │
  │  │    no seizures, navigable            │              │
  │  ├──────────────────────────────────────┤              │
  │  │ U  Understandable│ Hiểu được        │              │
  │  │    lang attr, consistent nav,        │              │
  │  │    error messages, labels            │              │
  │  ├──────────────────────────────────────┤              │
  │  │ R  Robust        │ Mạnh mẽ          │              │
  │  │    valid HTML, name/role/value,      │              │
  │  │    status messages                   │              │
  │  └──────────────────────────────────────┘              │
  │                                                        │
  │  TARGET: Level AA (tiêu chuẩn pháp luật)!             │
  │                                                        │
  └────────────────────────────────────────────────────────┘
```

**❓ Q1: WCAG là gì?**

> WCAG (Web Content Accessibility Guidelines) = bộ tiêu chuẩn do **W3C** ban hành để đảm bảo web accessible. Cấu trúc: 4 Principles → 13 Guidelines → 78 Success Criteria → Techniques. 3 mức: **A** (tối thiểu), **AA** (tiêu chuẩn — hầu hết luật yêu cầu), **AAA** (tối đa). Phiên bản hiện tại: WCAG 2.2 (2023).

**❓ Q2: Giải thích 4 nguyên tắc POUR?**

> **Perceivable**: User nhận biết được content — alt text cho ảnh, captions video, contrast ≥4.5:1, không chỉ dùng màu. **Operable**: Thao tác được bằng keyboard, đủ thời gian, không gây seizure (≤3 flash/s), skip nav, visible focus. **Understandable**: `lang` attribute, navigation nhất quán, error messages rõ ràng + gợi ý sửa, labels cho inputs. **Robust**: HTML valid, unique IDs, mọi UI có name/role/value, status messages dùng `aria-live`.

**❓ Q3: Level A vs AA vs AAA?**

> **A**: tối thiểu bắt buộc — alt text, keyboard access, lang attribute. Không đạt = hoàn toàn unusable. **AA**: tiêu chuẩn phổ biến — contrast 4.5:1, resize 200%, captions live, error suggestions. Hầu hết **luật pháp** (ADA, EU) yêu cầu level này. **AAA**: lý tưởng — contrast 7:1, sign language, reading level. W3C **không khuyến nghị** target AAA toàn site vì quá khó đạt 100%.

**❓ Q4: Contrast ratio trong WCAG?**

> WCAG dùng **relative luminance** formula tính contrast ratio. **AA**: normal text ≥ 4.5:1, large text (≥24px hoặc ≥18.66px bold) ≥ 3:1. **AAA**: normal ≥ 7:1, large ≥ 4.5:1. Tính: `(L1 + 0.05) / (L2 + 0.05)` với L = relative luminance. Tools: Chrome DevTools, tự viết `ContrastChecker` dùng sRGB → linear conversion.

**❓ Q5: WCAG 4.1.2 Name, Role, Value?**

> Mọi UI component phải expose: **Name** (tên — text content, aria-label, label), **Role** (vai trò — button, checkbox, link), **Value** (trạng thái — checked, expanded, selected). Semantic HTML tự cung cấp (button, input). Custom components (`<div>`) phải thêm `role`, `aria-label`, `aria-checked`... Nếu thiếu → screen reader không biết element là gì, ở trạng thái nào.

---

> 📝 **Ghi nhớ cuối cùng:**
> "WCAG = tiêu chuẩn a11y của W3C! 4 nguyên tắc POUR: Perceivable (nhận biết), Operable (thao tác), Understandable (hiểu), Robust (mạnh mẽ)! Target Level AA! Contrast ≥ 4.5:1, keyboard mọi thứ, lang attribute, valid HTML, name/role/value cho mọi UI component!"
