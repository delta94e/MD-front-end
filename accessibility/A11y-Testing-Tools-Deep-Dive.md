# Accessibility Testing Tools — Deep Dive!

> **Chủ đề**: Common accessibility tools for testing a website
> **Ngôn ngữ**: Tiếng Việt — giải thích cực kỳ chi tiết!
> **Phương châm**: Tự viết lại bằng tay — KHÔNG dùng thư viện!

---

## Mục Lục

1. [§1. Tổng Quan — Phân Loại Tools!](#1)
2. [§2. Automated Tools — Lighthouse, Axe, WAVE!](#2)
3. [§3. Screen Readers — NVDA, JAWS, VoiceOver!](#3)
4. [§4. Browser DevTools — Chrome A11y!](#4)
5. [§5. Manual Testing — Keyboard & Visual!](#5)
6. [§6. Tự Viết — A11y Testing Framework!](#6)
7. [§7. Tự Viết — Automated A11y Test Runner!](#7)
8. [§8. Tổng Kết & Câu Hỏi Phỏng Vấn!](#8)

---

## §1. Tổng Quan — Phân Loại Tools!

```
ACCESSIBILITY TESTING TOOLS — PHÂN LOẠI:
  ┌────────────────────────────────────────────────────────┐
  │                                                        │
  │  ┌──────────────────────────────────────────────────┐  │
  │  │  AUTOMATED TOOLS (phát hiện ~30-40% lỗi):       │  │
  │  │  → Lighthouse (Google, built-in Chrome)          │  │
  │  │  → Axe (Deque, browser extension)                │  │
  │  │  → WAVE (WebAIM, browser extension)              │  │
  │  │  → Pa11y (CLI, CI/CD)                            │  │
  │  │  → HTML_CodeSniffer                              │  │
  │  │                                                  │  │
  │  │  ✅ Nhanh, consistent, chạy trong CI/CD!         │  │
  │  │  ❌ KHÔNG phát hiện hết lỗi (chỉ ~30-40%)!      │  │
  │  └──────────────────────────────────────────────────┘  │
  │                                                        │
  │  ┌──────────────────────────────────────────────────┐  │
  │  │  SCREEN READERS (kiểm tra trải nghiệm thực):    │  │
  │  │  → NVDA (Windows, FREE!)                         │  │
  │  │  → JAWS (Windows, thương mại, phổ biến nhất)    │  │
  │  │  → VoiceOver (macOS/iOS, built-in FREE!)         │  │
  │  │  → TalkBack (Android, built-in FREE!)            │  │
  │  │  → Narrator (Windows, built-in)                  │  │
  │  │                                                  │  │
  │  │  ✅ Test THỰC TẾ user experience!                │  │
  │  │  ❌ Chậm, cần kiến thức sử dụng!                │  │
  │  └──────────────────────────────────────────────────┘  │
  │                                                        │
  │  ┌──────────────────────────────────────────────────┐  │
  │  │  BROWSER DEVTOOLS:                               │  │
  │  │  → Chrome Accessibility Inspector                │  │
  │  │  → Firefox Accessibility Inspector               │  │
  │  │  → Chrome Rendering: Emulate vision deficiencies│  │
  │  │                                                  │  │
  │  │  ✅ Built-in, realtime debug!                    │  │
  │  └──────────────────────────────────────────────────┘  │
  │                                                        │
  │  ┌──────────────────────────────────────────────────┐  │
  │  │  MANUAL TESTING:                                 │  │
  │  │  → Keyboard-only navigation                     │  │
  │  │  → Zoom 200% test                               │  │
  │  │  → Color contrast check                         │  │
  │  │  → Color blindness simulation                   │  │
  │  │                                                  │  │
  │  │  ✅ Phát hiện lỗi automated KHÔNG tìm được!     │  │
  │  └──────────────────────────────────────────────────┘  │
  │                                                        │
  │  ⚠️ QUAN TRỌNG:                                       │
  │  Automated tools CHỈ tìm được ~30-40% lỗi a11y!     │
  │  → PHẢI kết hợp: Automated + Screen Reader + Manual! │
  │                                                        │
  └────────────────────────────────────────────────────────┘
```

```
QUY TRÌNH TEST A11Y HOÀN CHỈNH:
  ┌────────────────────────────────────────────────────────┐
  │                                                        │
  │  ① Automated scan (Lighthouse/Axe)                    │
  │    ↓ Sửa tất cả lỗi tìm được                        │
  │  ② Keyboard testing                                   │
  │    ↓ Tab qua mọi element, check focus, check trap    │
  │  ③ Screen reader testing (VoiceOver/NVDA)             │
  │    ↓ Đọc trang, navigate, submit forms               │
  │  ④ Visual testing                                     │
  │    ↓ Zoom 200%, contrast, color blind sim             │
  │  ⑤ User testing (optional)                            │
  │    ↓ Người dùng thật với disabilities                 │
  │  ✅ PASS!                                              │
  │                                                        │
  └────────────────────────────────────────────────────────┘
```

---

## §2. Automated Tools — Lighthouse, Axe, WAVE!

```
① LIGHTHOUSE (Google):
  ┌────────────────────────────────────────────────────────┐
  │                                                        │
  │  TÍCH HỢP SẴN trong Chrome DevTools!                  │
  │  → F12 → Lighthouse tab → chọn "Accessibility"       │
  │  → Generate report → điểm 0-100!                     │
  │                                                        │
  │  KIỂM TRA:                                             │
  │  ✅ Image alt text                                     │
  │  ✅ Color contrast ratio                               │
  │  ✅ Button/Link accessible names                       │
  │  ✅ Form labels                                        │
  │  ✅ HTML lang attribute                                │
  │  ✅ ARIA attributes valid                              │
  │  ✅ Heading order                                      │
  │  ✅ Tab order logic                                    │
  │  ✅ Document has <title>                               │
  │  ✅ Unique IDs                                         │
  │                                                        │
  │  KẾT QUẢ: Score + danh sách issues + cách fix!        │
  │                                                        │
  │  CÁCH DÙNG PROGRAMMATIC (Node.js CLI):                 │
  │  $ npx lighthouse https://example.com                  │
  │    --only-categories=accessibility                     │
  │    --output=json                                       │
  │                                                        │
  │  ⚠️ HẠN CHẾ:                                          │
  │  → Chỉ kiểm tra trang HIỆN TẠI (không SPA routes)   │
  │  → Không test keyboard navigation thực tế            │
  │  → Không test screen reader experience               │
  │  → Score 100 ≠ fully accessible!                     │
  │                                                        │
  └────────────────────────────────────────────────────────┘

  ② AXE (Deque Systems):
  ┌────────────────────────────────────────────────────────┐
  │                                                        │
  │  CHUYÊN NGHIỆP nhất cho a11y testing!                 │
  │  → Browser extension: axe DevTools                    │
  │  → Library: axe-core (dùng trong code!)               │
  │                                                        │
  │  SỐ LƯỢNG RULES: ~90 rules WCAG 2.1!                 │
  │                                                        │
  │  ĐẶC BIỆT:                                            │
  │  → ZERO false positives (rất ít báo nhầm!)           │
  │  → Guided testing (hướng dẫn fix từng lỗi!)          │
  │  → Integration: Jest, Cypress, Playwright!            │
  │  → CI/CD: chạy tự động mỗi build!                    │
  │                                                        │
  │  KẾT QUẢ:                                             │
  │  { violations: [...], passes: [...],                  │
  │    incomplete: [...], inapplicable: [...] }            │
  │                                                        │
  │  Mỗi issue có:                                        │
  │  → id, impact (critical/serious/moderate/minor)       │
  │  → description, helpUrl, nodes (elements bị lỗi)     │
  │                                                        │
  └────────────────────────────────────────────────────────┘

  ③ WAVE (WebAIM):
  ┌────────────────────────────────────────────────────────┐
  │                                                        │
  │  VISUAL — hiển thị lỗi TRÊN TRANG!                    │
  │  → Browser extension hoặc wave.webaim.org             │
  │                                                        │
  │  ICONS TRÊN TRANG:                                     │
  │  🔴 Error — lỗi phải sửa!                             │
  │  🟡 Alert — cảnh báo cần kiểm tra!                    │
  │  🟢 Feature — feature a11y đã có!                     │
  │  🔵 Structural — heading, landmark                    │
  │  🟣 ARIA — aria attributes                            │
  │  ⚪ Contrast — contrast errors                        │
  │                                                        │
  │  ĐẶC BIỆT:                                            │
  │  → TRỰC QUAN — thấy lỗi NGAY TRÊN TRANG!            │
  │  → Contrast checker built-in!                        │
  │  → Heading/Structure outline!                        │
  │  → Phù hợp cho designers + non-technical!            │
  │                                                        │
  └────────────────────────────────────────────────────────┘
```

---

## §3. Screen Readers — NVDA, JAWS, VoiceOver!

```
SCREEN READERS — SO SÁNH:
  ┌────────────────────────────────────────────────────────┐
  │                                                        │
  │  Tool       │ OS       │ Giá     │ Browser    │ %User │
  │  ━━━━━━━━━━━│━━━━━━━━━━│━━━━━━━━━│━━━━━━━━━━━━│━━━━━━ │
  │  JAWS       │ Windows  │ $1000/y │ IE/Chrome  │ ~40%  │
  │  NVDA       │ Windows  │ FREE!   │ Firefox    │ ~31%  │
  │  VoiceOver  │ macOS/iOS│ FREE!   │ Safari     │ ~20%  │
  │  TalkBack   │ Android  │ FREE!   │ Chrome     │ ~7%   │
  │  Narrator   │ Windows  │ FREE!   │ Edge       │ ~2%   │
  │                                                        │
  │  → Developer NÊN test với ÍT NHẤT 2 screen readers! │
  │  → Khuyến nghị: VoiceOver (Mac) + NVDA (Windows)    │
  │                                                        │
  └────────────────────────────────────────────────────────┘

  VOICEOVER — macOS (built-in):
  ┌────────────────────────────────────────────────────────┐
  │                                                        │
  │  BẬT: Cmd + F5 (hoặc Settings → Accessibility)       │
  │                                                        │
  │  PHÍM TẮT QUAN TRỌNG:                                 │
  │  VO = Control + Option (modifier key)                 │
  │                                                        │
  │  VO + → / ← : di chuyển giữa elements                │
  │  VO + Space  : activate (click)                       │
  │  VO + U      : mở Rotor (navigate by type!)          │
  │  VO + Cmd + H: nhảy đến heading tiếp theo            │
  │  VO + Cmd + J: nhảy đến element tiếp theo            │
  │  Tab         : nhảy giữa focusable elements           │
  │  VO + Shift + ↓ : vào web content                    │
  │  Escape      : thoát khỏi area hiện tại              │
  │                                                        │
  │  ROTOR (VO + U):                                       │
  │  → Liệt kê tất cả: Headings, Links, Landmarks,      │
  │    Forms, Tables → nhảy nhanh đến element!            │
  │                                                        │
  └────────────────────────────────────────────────────────┘

  NVDA — Windows (FREE!):
  ┌────────────────────────────────────────────────────────┐
  │                                                        │
  │  Download: nvaccess.org (miễn phí!)                   │
  │  NVDA Key = Insert (hoặc Caps Lock)                   │
  │                                                        │
  │  PHÍM TẮT:                                             │
  │  ↓ / ↑       : đọc element tiếp/trước                │
  │  H            : nhảy đến heading                      │
  │  D            : nhảy đến landmark                     │
  │  K            : nhảy đến link                         │
  │  B            : nhảy đến button                       │
  │  F            : nhảy đến form field                   │
  │  T            : nhảy đến table                        │
  │  Tab           : focusable elements                   │
  │  Enter/Space   : activate                             │
  │  NVDA + F7     : Elements list (like Rotor!)          │
  │  NVDA + Space  : chuyển focus/browse mode             │
  │                                                        │
  └────────────────────────────────────────────────────────┘
```

```
TEST CHECKLIST VỚI SCREEN READER:
  ┌────────────────────────────────────────────────────────┐
  │                                                        │
  │  ① Page load: đọc <title> + <h1> đúng?               │
  │  ② Navigation: nhảy qua headings (H key) OK?         │
  │  ③ Landmarks: nhảy nav/main/footer (D key) OK?       │
  │  ④ Links: đọc text descriptive? (không "click here") │
  │  ⑤ Images: đọc alt text? Decorative bị skip?         │
  │  ⑥ Forms: đọc labels? Error messages?                │
  │  ⑦ Buttons: đọc tên? Activate bằng Enter/Space?     │
  │  ⑧ Dynamic content: aria-live announce?               │
  │  ⑨ Modal: focus trap? Escape đóng? Restore focus?    │
  │  ⑩ Tables: đọc header + data cell đúng?              │
  │                                                        │
  └────────────────────────────────────────────────────────┘
```

---

## §4. Browser DevTools — Chrome A11y!

```
CHROME DEVTOOLS — ACCESSIBILITY FEATURES:
  ┌────────────────────────────────────────────────────────┐
  │                                                        │
  │  ① ACCESSIBILITY TREE (F12 → Elements → A11y tab):   │
  │  ┌──────────────────────────────────────────────────┐  │
  │  │  Xem Accessibility Tree song song DOM:           │  │
  │  │                                                  │  │
  │  │  Element: <button class="primary-btn">Submit</button>│
  │  │                                                  │  │
  │  │  Computed Properties:                            │  │
  │  │  Name: "Submit"           ← accessible name     │  │
  │  │  Role: button             ← a11y role           │  │
  │  │  Focusable: true          ← keyboard access     │  │
  │  │  Disabled: false          ← state               │  │
  │  │                                                  │  │
  │  │  → Nếu Name trống → LỖI!                       │  │
  │  │  → Nếu Role = generic → CẦN semantic/ARIA!     │  │
  │  └──────────────────────────────────────────────────┘  │
  │                                                        │
  │  ② CONTRAST CHECKER (inspect element → Styles):       │
  │  ┌──────────────────────────────────────────────────┐  │
  │  │  Click vào color swatch → xem contrast ratio!   │  │
  │  │  AA: ✅ (4.5:1 pass)  hoặc  ❌ (fail)           │  │
  │  │  AAA: ✅ (7:1 pass)   hoặc  ❌ (fail)           │  │
  │  │  → Suggest closest passing color!               │  │
  │  └──────────────────────────────────────────────────┘  │
  │                                                        │
  │  ③ VISION DEFICIENCY EMULATION:                        │
  │  (F12 → Rendering → Emulate vision deficiencies)      │
  │  ┌──────────────────────────────────────────────────┐  │
  │  │  → Blurred vision (nhìn mờ)                     │  │
  │  │  → Protanopia (mù đỏ)                           │  │
  │  │  → Deuteranopia (mù xanh lá)                    │  │
  │  │  → Tritanopia (mù xanh dương)                   │  │
  │  │  → Achromatopsia (mù màu hoàn toàn)            │  │
  │  │  → Xem trang web ĐÚNG NHƯ người mù màu thấy!  │  │
  │  └──────────────────────────────────────────────────┘  │
  │                                                        │
  │  ④ TAB ORDER OVERLAY:                                  │
  │  (F12 → Elements → Accessibility → check "Show a11y  │
  │   tree" + CSS: *:focus { outline: 3px solid red })    │
  │                                                        │
  └────────────────────────────────────────────────────────┘
```

---

## §5. Manual Testing — Keyboard & Visual!

```javascript
// ═══════════════════════════════════════════════════════════
// MANUAL TESTING CHECKLIST — TỰ VIẾT!
// ═══════════════════════════════════════════════════════════

var ManualA11yChecklist = {
  // ① KEYBOARD TESTING:
  keyboard: [
    "Tab qua TẤT CẢ interactive elements — bỏ sót element nào?",
    "Shift+Tab quay ngược — order logic?",
    "Focus indicator VISIBLE trên mọi element?",
    "Enter/Space activate buttons + links?",
    "Arrow keys navigate menus/tabs/radio?",
    "Escape đóng modals/dropdowns?",
    "Focus KHÔNG bị trap (ngoại trừ modal)?",
    "Skip link hoạt động (Tab đầu tiên)?",
    "Focus order LOGIC (trái→phải, trên→dưới)?",
    "Modal: focus trap hoạt động? Focus restore khi đóng?",
  ],

  // ② ZOOM TESTING:
  zoom: [
    "Zoom 200% — layout KHÔNG bị vỡ?",
    "Zoom 200% — text KHÔNG bị cắt?",
    "Zoom 200% — không cần horizontal scroll?",
    "Zoom 400% — vẫn usable? (WCAG 2.1)",
    "Text-only zoom — text tăng, layout giữ?",
  ],

  // ③ COLOR TESTING:
  color: [
    "Thông tin KHÔNG chỉ dùng MÀU truyền đạt?",
    "Error: có icon + text, không chỉ màu đỏ?",
    "Links: có underline, không chỉ màu xanh?",
    "Charts/graphs: có pattern, không chỉ màu?",
    "Contrast ratio đạt WCAG AA (4.5:1)?",
  ],

  // ④ CONTENT TESTING:
  content: [
    "Page <title> descriptive và unique?",
    "Chỉ 1 <h1> per page?",
    "Heading hierarchy h1→h2→h3 không nhảy cấp?",
    'Link text descriptive (không "click here")?',
    "Error messages rõ ràng + gợi ý sửa?",
    "lang attribute trên <html>?",
    "Forms có labels? Required fields marked?",
  ],
};
```

---

## §6. Tự Viết — A11y Testing Framework!

```javascript
// ═══════════════════════════════════════════════════════════
// A11Y TESTING FRAMEWORK — TỰ VIẾT!
// Tương tự axe-core nhưng đơn giản!
// ═══════════════════════════════════════════════════════════

var A11yTester = (function () {
  var _rules = [];

  // Rule builder:
  function addRule(config) {
    _rules.push({
      id: config.id,
      description: config.description,
      impact: config.impact, // critical/serious/moderate/minor
      wcag: config.wcag, // ['1.1.1', '4.1.2']
      check: config.check, // function(root) → issues[]
    });
  }

  // ① RULE: img-alt
  addRule({
    id: "img-alt",
    description: "Images phải có alt text",
    impact: "critical",
    wcag: ["1.1.1"],
    check: function (root) {
      var issues = [];
      var imgs = root.querySelectorAll("img");
      for (var i = 0; i < imgs.length; i++) {
        if (!imgs[i].hasAttribute("alt")) {
          issues.push({
            node: imgs[i],
            message: "img thiếu alt attribute",
          });
        }
      }
      return issues;
    },
  });

  // ② RULE: button-name
  addRule({
    id: "button-name",
    description: "Buttons phải có accessible name",
    impact: "critical",
    wcag: ["4.1.2"],
    check: function (root) {
      var issues = [];
      var btns = root.querySelectorAll('button, [role="button"]');
      for (var i = 0; i < btns.length; i++) {
        var name =
          btns[i].textContent.trim() ||
          btns[i].getAttribute("aria-label") ||
          btns[i].getAttribute("aria-labelledby") ||
          btns[i].getAttribute("title");
        if (!name) {
          issues.push({
            node: btns[i],
            message: "Button thiếu accessible name",
          });
        }
      }
      return issues;
    },
  });

  // ③ RULE: input-label
  addRule({
    id: "input-label",
    description: "Form inputs phải có label",
    impact: "critical",
    wcag: ["1.3.1", "3.3.2"],
    check: function (root) {
      var issues = [];
      var inputs = root.querySelectorAll(
        'input:not([type="hidden"]):not([type="submit"]),' + "select, textarea",
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
          issues.push({ node: inp, message: "Input thiếu label" });
        }
      }
      return issues;
    },
  });

  // ④ RULE: color-contrast
  addRule({
    id: "color-contrast",
    description: "Text phải có đủ contrast ratio",
    impact: "serious",
    wcag: ["1.4.3"],
    check: function (root) {
      var issues = [];
      var texts = root.querySelectorAll("p,h1,h2,h3,h4,span,a,button,label");
      for (var i = 0; i < texts.length; i++) {
        var el = texts[i];
        if (!el.textContent.trim()) continue;
        var style = window.getComputedStyle(el);
        var ratio = calcContrast(style.color, style.backgroundColor);
        var size = parseFloat(style.fontSize);
        var bold = parseInt(style.fontWeight) >= 700;
        var isLarge = size >= 24 || (size >= 18.66 && bold);
        var min = isLarge ? 3 : 4.5;
        if (ratio < min) {
          issues.push({
            node: el,
            message: "Contrast " + ratio.toFixed(1) + ":1 < " + min + ":1",
          });
        }
      }
      return issues;
    },
  });

  // ⑤ RULE: html-lang
  addRule({
    id: "html-lang",
    description: "<html> phải có lang attribute",
    impact: "serious",
    wcag: ["3.1.1"],
    check: function () {
      var issues = [];
      if (!document.documentElement.hasAttribute("lang")) {
        issues.push({
          node: document.documentElement,
          message: "<html> thiếu lang attribute",
        });
      }
      return issues;
    },
  });

  // ⑥ RULE: heading-order
  addRule({
    id: "heading-order",
    description: "Headings phải theo thứ tự",
    impact: "moderate",
    wcag: ["1.3.1"],
    check: function (root) {
      var issues = [];
      var headings = root.querySelectorAll("h1,h2,h3,h4,h5,h6");
      var prev = 0;
      for (var i = 0; i < headings.length; i++) {
        var level = parseInt(headings[i].tagName[1]);
        if (prev > 0 && level - prev > 1) {
          issues.push({
            node: headings[i],
            message: "Nhảy h" + prev + " → h" + level,
          });
        }
        prev = level;
      }
      return issues;
    },
  });

  // HELPER: contrast calculation
  function calcContrast(fg, bg) {
    var fgRgb = parseRgb(fg);
    var bgRgb = parseRgb(bg);
    if (!fgRgb || !bgRgb) return 21;
    var l1 = lum(fgRgb);
    var l2 = lum(bgRgb);
    return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
  }
  function parseRgb(s) {
    var m = s.match(/\d+/g);
    return m ? [+m[0], +m[1], +m[2]] : null;
  }
  function lum(rgb) {
    var c = rgb.map(function (v) {
      v /= 255;
      return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
    });
    return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
  }

  // RUN ALL RULES:
  function run(root) {
    root = root || document.body;
    var results = { violations: [], passes: [] };

    for (var i = 0; i < _rules.length; i++) {
      var rule = _rules[i];
      var issues = rule.check(root);

      if (issues.length > 0) {
        results.violations.push({
          id: rule.id,
          description: rule.description,
          impact: rule.impact,
          wcag: rule.wcag,
          nodes: issues,
        });
      } else {
        results.passes.push({
          id: rule.id,
          description: rule.description,
        });
      }
    }
    return results;
  }

  // REPORT:
  function report(root) {
    var results = run(root);
    console.group("♿ A11y Test Results");
    console.log("✅ Passed:", results.passes.length);
    console.log("❌ Violations:", results.violations.length);
    results.violations.forEach(function (v) {
      console.group("❌ [" + v.impact.toUpperCase() + "] " + v.id);
      console.log(v.description);
      console.log("WCAG:", v.wcag.join(", "));
      v.nodes.forEach(function (n) {
        console.log("  →", n.message);
      });
      console.groupEnd();
    });
    console.groupEnd();
    return results;
  }

  return { run: run, report: report, addRule: addRule };
})();

// SỬ DỤNG:
// A11yTester.report(); // In kết quả ra console!
```

---

## §7. Tự Viết — Automated A11y Test Runner!

```javascript
// ═══════════════════════════════════════════════════════════
// KEYBOARD NAVIGATION TESTER — TỰ VIẾT!
// Tự động test keyboard accessibility!
// ═══════════════════════════════════════════════════════════

var KeyboardTester = (function () {
  function testFocusOrder(root) {
    root = root || document.body;
    var focusable = root.querySelectorAll(
      "a[href], button:not([disabled]), input:not([disabled])," +
        "select:not([disabled]), textarea:not([disabled])," +
        '[tabindex]:not([tabindex="-1"])',
    );

    var results = [];
    var prevRect = null;

    for (var i = 0; i < focusable.length; i++) {
      var el = focusable[i];
      var rect = el.getBoundingClientRect();

      var issue = null;

      // Check: element visible?
      if (rect.width === 0 || rect.height === 0) {
        issue = "Element không visible nhưng focusable!";
      }

      // Check: tabindex > 0 (bad practice)?
      var tabindex = el.getAttribute("tabindex");
      if (tabindex && parseInt(tabindex) > 0) {
        issue = "tabindex=" + tabindex + " thay đổi natural order!";
      }

      // Check: focus indicator?
      el.focus();
      var style = window.getComputedStyle(el);
      if (style.outlineStyle === "none" && style.boxShadow === "none") {
        issue = "Không có visible focus indicator!";
      }

      results.push({
        element: el.tagName + (el.id ? "#" + el.id : ""),
        text: (el.textContent || "").trim().substring(0, 30),
        position: { top: rect.top, left: rect.left },
        issue: issue,
      });

      prevRect = rect;
    }

    return results;
  }

  function testFocusTrap(container) {
    // Kiểm tra modal có focus trap đúng:
    var focusable = container.querySelectorAll(
      "a[href], button:not([disabled]), input:not([disabled])," +
        '[tabindex]:not([tabindex="-1"])',
    );

    if (focusable.length === 0) {
      return { pass: false, message: "Modal KHÔNG CÓ focusable elements!" };
    }

    // Check: first element focused?
    var first = focusable[0];
    var last = focusable[focusable.length - 1];

    return {
      firstFocusable: first.tagName,
      lastFocusable: last.tagName,
      totalFocusable: focusable.length,
      message:
        "Tab từ last → nên quay về first, " +
        "Shift+Tab từ first → nên nhảy đến last",
    };
  }

  return {
    testFocusOrder: testFocusOrder,
    testFocusTrap: testFocusTrap,
  };
})();

// ═══════════════════════════════════════════════════════════
// COLOR BLINDNESS SIMULATOR — TỰ VIẾT!
// ═══════════════════════════════════════════════════════════

var ColorBlindSim = (function () {
  // Color transformation matrices:
  var _matrices = {
    protanopia: [
      // Mù đỏ
      0.567, 0.433, 0, 0.558, 0.442, 0, 0, 0.242, 0.758,
    ],
    deuteranopia: [
      // Mù xanh lá
      0.625, 0.375, 0, 0.7, 0.3, 0, 0, 0.3, 0.7,
    ],
    tritanopia: [
      // Mù xanh dương
      0.95, 0.05, 0, 0, 0.433, 0.567, 0, 0.475, 0.525,
    ],
    achromatopsia: [
      // Mù màu hoàn toàn
      0.299, 0.587, 0.114, 0.299, 0.587, 0.114, 0.299, 0.587, 0.114,
    ],
  };

  function simulate(r, g, b, type) {
    var m = _matrices[type];
    if (!m) return { r: r, g: g, b: b };
    return {
      r: Math.round(m[0] * r + m[1] * g + m[2] * b),
      g: Math.round(m[3] * r + m[4] * g + m[5] * b),
      b: Math.round(m[6] * r + m[7] * g + m[8] * b),
    };
  }

  // Kiểm tra 2 màu phân biệt được không:
  function canDistinguish(color1, color2, type) {
    var sim1 = simulate(color1.r, color1.g, color1.b, type);
    var sim2 = simulate(color2.r, color2.g, color2.b, type);

    // Euclidean distance:
    var dist = Math.sqrt(
      Math.pow(sim1.r - sim2.r, 2) +
        Math.pow(sim1.g - sim2.g, 2) +
        Math.pow(sim1.b - sim2.b, 2),
    );
    return {
      distance: dist,
      distinguishable: dist > 50,
      // < 50 → khó phân biệt cho người mù màu!
    };
  }

  return { simulate: simulate, canDistinguish: canDistinguish };
})();

// VD:
// ColorBlindSim.canDistinguish(
//     {r:255,g:0,b:0}, {r:0,g:128,b:0}, 'deuteranopia'
// );
// → đỏ vs xanh lá: người deuteranopia KHÔNG phân biệt!
```

---

## §8. Tổng Kết & Câu Hỏi Phỏng Vấn!

```
A11Y TESTING TOOLS — TỔNG KẾT:
  ┌────────────────────────────────────────────────────────┐
  │                                                        │
  │  AUTOMATED (~30-40% lỗi):                             │
  │  → Lighthouse: built-in Chrome, score 0-100           │
  │  → Axe: chuyên nghiệp, zero false positives          │
  │  → WAVE: visual icons trên trang                      │
  │                                                        │
  │  SCREEN READERS (trải nghiệm thực):                   │
  │  → VoiceOver: macOS/iOS, free, Cmd+F5                 │
  │  → NVDA: Windows, free, phổ biến                      │
  │  → JAWS: Windows, trả phí, market leader              │
  │                                                        │
  │  DEVTOOLS:                                             │
  │  → Chrome A11y Inspector, Contrast Checker            │
  │  → Vision deficiency emulation                        │
  │                                                        │
  │  MANUAL:                                               │
  │  → Keyboard nav, Zoom 200%, Color test                │
  │                                                        │
  │  ⚠️ PHẢI KẾT HỢP: Automated + SR + Manual!           │
  │                                                        │
  └────────────────────────────────────────────────────────┘
```

**❓ Q1: Kể tên các a11y testing tools phổ biến?**

> **Automated**: Lighthouse (Google, built-in Chrome, score 0-100), Axe/axe-core (Deque, chuyên nghiệp nhất, tích hợp CI/CD), WAVE (WebAIM, visual trên trang). **Screen readers**: JAWS (Windows, trả phí, \~40% user), NVDA (Windows, free, \~31%), VoiceOver (macOS/iOS, built-in, \~20%), TalkBack (Android). **DevTools**: Chrome A11y Inspector, contrast checker, vision deficiency emulation. **Manual**: keyboard testing, zoom 200%, color contrast.

**❓ Q2: Tại sao automated tools chỉ tìm 30-40% lỗi?**

> Automated **chỉ kiểm tra được**: missing alt text, contrast ratio, missing labels, invalid ARIA, heading order — những thứ **đo lường được**. **KHÔNG kiểm tra được**: alt text có **mô tả đúng** không? Focus order có **logic** không? Content có **hiểu được** không? Screen reader experience có **tốt** không? Keyboard navigation có **tự nhiên** không? → Những thứ cần **con người đánh giá** → phải test manual + screen reader!

**❓ Q3: Làm sao test với VoiceOver?**

> **Bật**: Cmd+F5 (macOS). **VO key**: Control+Option. **Navigate**: VO+→/← di chuyển, Tab nhảy focusable, VO+U mở Rotor. **Test checklist**: page title đọc đúng? Heading navigation (H key) hoạt động? Landmarks nhảy được (D key)? Form labels đọc? Button/link activate Enter/Space? Dynamic content aria-live announce? Modal focus trap? Images alt text? Nên test với **Safari** vì VoiceOver + Safari là combo phổ biến nhất trên macOS.

**❓ Q4: Nên test với screen reader nào?**

> Tối thiểu **2 screen readers**: VoiceOver + Safari (macOS/iOS) và NVDA + Firefox (Windows). Lý do: mỗi SR xử lý ARIA khác nhau, browser expose A11y Tree khác nhau. JAWS chiếm \~40% thị phần nhưng trả phí. NVDA free và chiếm \~31%. VoiceOver free, built-in macOS. Nếu target mobile: thêm VoiceOver (iOS) + TalkBack (Android).

**❓ Q5: A11y testing trong CI/CD như thế nào?**

> Dùng **axe-core** tích hợp vào test framework: `jest-axe` cho unit tests, `cypress-axe` cho E2E, `@axe-core/playwright` cho Playwright. Mỗi build: scan page → nếu có violations → **fail build**! Bổ sung: Lighthouse CI (budgets cho a11y score), Pa11y CI (command-line scanner). **Nhớ**: CI/CD chỉ catch \~30-40% → vẫn cần periodic manual audit + SR testing!

---

> 📝 **Ghi nhớ cuối cùng:**
> "Automated tools (Lighthouse, Axe, WAVE) chỉ tìm \~30-40% lỗi! PHẢI kết hợp Screen Reader (VoiceOver/NVDA) + Manual (keyboard, zoom, color)! Test tối thiểu 2 SR! CI/CD dùng axe-core! Score 100 Lighthouse ≠ fully accessible!"