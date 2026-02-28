# Semantic HTML vs Non-Semantic HTML — Deep Dive!

> **Chủ đề**: Difference between semantic HTML and non-semantic HTML
> **Ngôn ngữ**: Tiếng Việt — giải thích cực kỳ chi tiết!
> **Phương châm**: Tự viết lại bằng tay — KHÔNG dùng thư viện!

---

## Mục Lục

1. [§1. Semantic Là Gì? — Định Nghĩa!](#1)
2. [§2. So Sánh — Semantic vs Non-Semantic!](#2)
3. [§3. Tất Cả Semantic Elements HTML5!](#3)
4. [§4. Accessibility — Tại Sao Semantic Quan Trọng!](#4)
5. [§5. SEO — Semantic Giúp Google Hiểu Trang!](#5)
6. [§6. Tự Viết — Semantic Analyzer Tool!](#6)
7. [§7. Tự Viết — Div-to-Semantic Converter!](#7)
8. [§8. React & Semantic HTML!](#8)
9. [§9. Tổng Kết & Câu Hỏi Phỏng Vấn!](#9)

---

## §1. Semantic Là Gì? — Định Nghĩa!

```
  SEMANTIC HTML vs NON-SEMANTIC HTML:
  ┌────────────────────────────────────────────────────────┐
  │                                                        │
  │  "SEMANTIC" = CÓ Ý NGHĨA!                            │
  │                                                        │
  │  SEMANTIC HTML:                                        │
  │  ┌──────────────────────────────────────────────────┐  │
  │  │  Element TỰ MÔ TẢ nội dung bên trong!           │  │
  │  │                                                  │  │
  │  │  <header>  → "Đây là phần đầu trang"            │  │
  │  │  <nav>     → "Đây là navigation"                 │  │
  │  │  <main>    → "Đây là nội dung chính"             │  │
  │  │  <article> → "Đây là bài viết độc lập"           │  │
  │  │  <aside>   → "Đây là nội dung phụ"               │  │
  │  │  <footer>  → "Đây là phần cuối trang"            │  │
  │  │  <h1>      → "Đây là tiêu đề cấp 1"             │  │
  │  │  <button>  → "Đây là nút bấm"                   │  │
  │  │                                                  │  │
  │  │  → Browser HIỂU, Screen reader HIỂU,            │  │
  │  │    Google HIỂU, Developer HIỂU!                  │  │
  │  └──────────────────────────────────────────────────┘  │
  │                                                        │
  │  NON-SEMANTIC HTML:                                    │
  │  ┌──────────────────────────────────────────────────┐  │
  │  │  Element KHÔNG mô tả nội dung!                  │  │
  │  │                                                  │  │
  │  │  <div>   → "Đây là... cái gì đó?"               │  │
  │  │  <span>  → "Đây là... text gì đó?"              │  │
  │  │                                                  │  │
  │  │  <div class="header">  → Browser: "Đây là div"  │  │
  │  │  <div class="nav">     → Browser: "Đây là div"  │  │
  │  │  <div class="btn">     → Browser: "Đây là div"  │  │
  │  │                                                  │  │
  │  │  → CHỈ developer đọc class name MỚI hiểu!       │  │
  │  │  → Browser KHÔNG HIỂU, Screen reader KHÔNG!     │  │
  │  │  → Google KHÔNG ưu tiên!                         │  │
  │  └──────────────────────────────────────────────────┘  │
  │                                                        │
  │  ⚠️ LƯU Ý:                                            │
  │  <div> và <span> KHÔNG XẤU! Chúng là CONTAINERS!     │
  │  → Dùng khi KHÔNG CẦN semantic (layout, styling)     │
  │  → XẤU khi dùng THAY THẾ semantic elements!          │
  │                                                        │
  └────────────────────────────────────────────────────────┘
```

---

## §2. So Sánh — Semantic vs Non-Semantic!

```
  SO SÁNH TRỰC TIẾP:
  ┌────────────────────────────────────────────────────────┐
  │                                                        │
  │  ❌ NON-SEMANTIC (Div Soup):                           │
  │  ┌──────────────────────────────────────────────────┐  │
  │  │  <div class="page">                              │  │
  │  │    <div class="header">                          │  │
  │  │      <div class="logo">Logo</div>                │  │
  │  │      <div class="nav">                           │  │
  │  │        <div class="nav-item">Home</div>          │  │
  │  │        <div class="nav-item">About</div>         │  │
  │  │      </div>                                      │  │
  │  │    </div>                                        │  │
  │  │    <div class="content">                         │  │
  │  │      <div class="title">Tiêu đề</div>           │  │
  │  │      <div class="text">Nội dung...</div>         │  │
  │  │      <div class="sidebar">Sidebar</div>          │  │
  │  │    </div>                                        │  │
  │  │    <div class="footer">© 2024</div>              │  │
  │  │  </div>                                          │  │
  │  └──────────────────────────────────────────────────┘  │
  │  → Screen reader: "div, div, div, div, div..."       │
  │  → Google: "Đây là mớ div, không hiểu structure!"    │
  │  → Không Tab focus vào nav items!                     │
  │                                                        │
  │  ✅ SEMANTIC:                                          │
  │  ┌──────────────────────────────────────────────────┐  │
  │  │  <body>                                          │  │
  │  │    <header>                                      │  │
  │  │      <a href="/" class="logo">Logo</a>          │  │
  │  │      <nav aria-label="Main">                     │  │
  │  │        <ul>                                      │  │
  │  │          <li><a href="/">Home</a></li>           │  │
  │  │          <li><a href="/about">About</a></li>    │  │
  │  │        </ul>                                     │  │
  │  │      </nav>                                      │  │
  │  │    </header>                                     │  │
  │  │    <main>                                        │  │
  │  │      <h1>Tiêu đề</h1>                           │  │
  │  │      <p>Nội dung...</p>                          │  │
  │  │      <aside>Sidebar</aside>                      │  │
  │  │    </main>                                       │  │
  │  │    <footer>© 2024</footer>                       │  │
  │  │  </body>                                         │  │
  │  └──────────────────────────────────────────────────┘  │
  │  → Screen reader: "banner, navigation 2 items,       │
  │    link Home, link About, main, heading level 1,     │
  │    paragraph, complementary, content info"            │
  │  → Google: "Hiểu rõ cấu trúc trang!"                │
  │  → Tab focus vào links tự nhiên!                      │
  │                                                        │
  └────────────────────────────────────────────────────────┘
```

```
  DOM TREE vs ACCESSIBILITY TREE:
  ┌────────────────────────────────────────────────────────┐
  │                                                        │
  │  NON-SEMANTIC DOM:           A11Y TREE:                │
  │  <div class="header">       generic                   │
  │    <div class="nav">          generic                 │
  │      <div onclick>              generic ← ???         │
  │  <div class="content">      generic                   │
  │    <div class="title">        generic ← ???           │
  │    <div class="btn" onclick>  generic ← ???           │
  │                                                        │
  │  → MẤT hết ý nghĩa! Screen reader hoàn toàn MÙ!     │
  │                                                        │
  │  ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ │
  │                                                        │
  │  SEMANTIC DOM:               A11Y TREE:                │
  │  <header>                    banner                    │
  │    <nav>                       navigation              │
  │      <a href>                    link "Home"           │
  │  <main>                      main                     │
  │    <h1>                        heading level 1         │
  │    <button>                    button "Submit"         │
  │                                                        │
  │  → ĐẦY ĐỦ ý nghĩa! Screen reader hiểu hoàn toàn!   │
  │                                                        │
  └────────────────────────────────────────────────────────┘
```

---

## §3. Tất Cả Semantic Elements HTML5!

```javascript
// ═══════════════════════════════════════════════════════════
// DANH SÁCH SEMANTIC ELEMENTS:
// ═══════════════════════════════════════════════════════════

// ① SECTIONING — chia vùng trang:
var sectioning = {
  "<header>": "Phần đầu trang hoặc đầu section",
  "<nav>": "Navigation links",
  "<main>": "Nội dung chính (CHỈ 1 PER PAGE!)",
  "<section>": "Nhóm nội dung có chủ đề chung",
  "<article>": "Nội dung ĐỘC LẬP (bài viết, comment)",
  "<aside>": "Nội dung PHỤ (sidebar, related)",
  "<footer>": "Phần cuối trang hoặc cuối section",
};

// ② TEXT CONTENT — nội dung văn bản:
var textContent = {
  "<h1>-<h6>": "Tiêu đề CẤP 1 đến 6",
  "<p>": "Đoạn văn (paragraph)",
  "<ul>/<ol>": "Danh sách không/có thứ tự",
  "<li>": "Mục trong danh sách",
  "<dl>": "Definition list",
  "<dt>/<dd>": "Definition term / description",
  "<blockquote>": "Trích dẫn dài",
  "<figure>": "Hình ảnh kèm caption",
  "<figcaption>": "Caption cho figure",
  "<pre>": "Preformatted text (code)",
  "<address>": "Thông tin liên hệ",
};

// ③ INLINE TEXT — text inline:
var inlineText = {
  "<a>": "Hyperlink (link)",
  "<strong>": "Quan trọng (đậm + semantic)",
  "<em>": "Nhấn mạnh (nghiêng + semantic)",
  "<mark>": "Highlight text",
  "<code>": "Inline code",
  "<time>": "Ngày/giờ (machine-readable)",
  "<abbr>": "Viết tắt (có title giải thích)",
  "<cite>": "Tên tác phẩm được trích dẫn",
  "<q>": "Trích dẫn ngắn inline",
  "<small>": "Chú thích, disclaimer",
  "<sub>/<sup>": "Subscript / Superscript",
};

// ④ INTERACTIVE — tương tác:
var interactive = {
  "<button>": "Nút bấm (tự có focus, keyboard, role!)",
  "<input>": "Trường nhập liệu (nhiều type)",
  "<select>": "Dropdown selection",
  "<textarea>": "Text area nhiều dòng",
  "<label>": "Nhãn cho form control",
  "<fieldset>": "Nhóm form controls",
  "<legend>": "Tiêu đề cho fieldset",
  "<details>": "Expandable/collapsible widget",
  "<summary>": "Tiêu đề cho details",
  "<dialog>": "Modal/dialog box (HTML5.2!)",
  "<output>": "Kết quả tính toán",
};

// ⑤ TABLE — bảng dữ liệu:
var table = {
  "<table>": "Bảng dữ liệu",
  "<thead>": "Header rows",
  "<tbody>": "Body rows",
  "<tfoot>": "Footer rows",
  "<tr>": "Hàng",
  "<th>": 'Ô tiêu đề (scope="col"/"row")',
  "<td>": "Ô dữ liệu",
  "<caption>": "Tiêu đề bảng",
  "<colgroup>": "Nhóm cột",
};

// ⑥ NON-SEMANTIC (container, không có ý nghĩa):
var nonSemantic = {
  "<div>": "Block container — KHÔNG có ý nghĩa!",
  "<span>": "Inline container — KHÔNG có ý nghĩa!",
  "<b>": "Bold visual — KHÔNG có semantic (dùng <strong>!)",
  "<i>": "Italic visual — KHÔNG có semantic (dùng <em>!)",
};

// ═══════════════════════════════════════════════════════════
// <strong> vs <b>, <em> vs <i> — PHÂN BIỆT!
// ═══════════════════════════════════════════════════════════

// <strong>: NỘI DUNG QUAN TRỌNG (semantic!)
// → Screen reader: đọc với GIỌNG NHẤN MẠNH hơn!
// → Ý nghĩa: "text này QUAN TRỌNG hơn text xung quanh"

// <b>: CHỈ LÀ VISUAL BOLD (không semantic!)
// → Screen reader: đọc BÌNH THƯỜNG, không nhấn!
// → Ý nghĩa: không có — chỉ styling!

// <em>: NHẤN MẠNH NGỪA NGHĨA (semantic!)
// → Screen reader: đọc với GIỌNG NHẤN!
// → "Tôi <em>không</em> nói vậy" ≠ "Tôi không <em>nói</em> vậy"

// <i>: CHỈ LÀ VISUAL ITALIC (không semantic!)
// → Dùng cho: thuật ngữ nước ngoài, tên tàu, suy nghĩ
```

---

## §4. Accessibility — Tại Sao Semantic Quan Trọng!

```
  SEMANTIC HTML & ACCESSIBILITY:
  ┌────────────────────────────────────────────────────────┐
  │                                                        │
  │  ① SEMANTIC = TỰ CÓ ACCESSIBILITY!                    │
  │  ┌──────────────────────────────────────────────────┐  │
  │  │  <button>Submit</button>                         │  │
  │  │  TỰ CÓ:                                         │  │
  │  │  ✅ role="button" trong A11y Tree                │  │
  │  │  ✅ Focusable bằng Tab                           │  │
  │  │  ✅ Activate bằng Enter & Space                  │  │
  │  │  ✅ :focus, :hover, :active styles               │  │
  │  │  ✅ Disabled state (disabled attribute)          │  │
  │  │                                                  │  │
  │  │  <div class="btn" onclick="submit()">Submit</div>│  │
  │  │  KHÔNG CÓ GÌ:                                   │  │
  │  │  ❌ Không role → SR đọc "generic"                │  │
  │  │  ❌ Không focus → Tab bỏ qua                    │  │
  │  │  ❌ Enter/Space không hoạt động                  │  │
  │  │  ❌ Phải TỰ THÊM: tabindex, role, onkeydown,   │  │
  │  │     aria-disabled, focus styles, cursor:pointer  │  │
  │  │  = VIẾT GẤP 10 LẦN CODE!                        │  │
  │  └──────────────────────────────────────────────────┘  │
  │                                                        │
  │  ② SCREEN READER NAVIGATION:                           │
  │  ┌──────────────────────────────────────────────────┐  │
  │  │  Screen reader có phím tắt nhảy theo semantic:  │  │
  │  │                                                  │  │
  │  │  H → nhảy đến heading tiếp theo                 │  │
  │  │  1-6 → nhảy đến h1-h6 cụ thể                   │  │
  │  │  L → nhảy đến list                              │  │
  │  │  T → nhảy đến table                             │  │
  │  │  D → nhảy đến landmark                          │  │
  │  │  K → nhảy đến link                              │  │
  │  │  B → nhảy đến button                            │  │
  │  │  F → nhảy đến form field                        │  │
  │  │                                                  │  │
  │  │  Nếu KHÔNG có semantic → KHÔNG nhảy được!       │  │
  │  │  → User phải Tab qua TỪNG element!              │  │
  │  │  → Trang 100 elements = Tab 100 lần!            │  │
  │  └──────────────────────────────────────────────────┘  │
  │                                                        │
  │  ③ LANDMARK NAVIGATION:                                │
  │  ┌──────────────────────────────────────────────────┐  │
  │  │  Semantic landmarks cho SR nhảy qua CÁC VÙNG:  │  │
  │  │                                                  │  │
  │  │  ┌─────────── <header> ─────────────┐           │  │
  │  │  │  banner                          │           │  │
  │  │  │  ┌─────── <nav> ──────────┐      │           │  │
  │  │  │  │  navigation            │      │           │  │
  │  │  │  └────────────────────────┘      │           │  │
  │  │  └──────────────────────────────────┘           │  │
  │  │  ┌─────────── <main> ───────────────┐           │  │
  │  │  │  main                            │           │  │
  │  │  │  ┌── <article> ──┐ ┌─ <aside> ─┐│           │  │
  │  │  │  │  article      │ │ sidebar   ││           │  │
  │  │  │  └───────────────┘ └───────────┘│           │  │
  │  │  └──────────────────────────────────┘           │  │
  │  │  ┌─────────── <footer> ─────────────┐           │  │
  │  │  │  contentinfo                     │           │  │
  │  │  └──────────────────────────────────┘           │  │
  │  │                                                  │  │
  │  │  SR user: "Nhảy đến main" → BÙM! đến nội dung! │  │
  │  └──────────────────────────────────────────────────┘  │
  │                                                        │
  └────────────────────────────────────────────────────────┘
```

---

## §5. SEO — Semantic Giúp Google Hiểu Trang!

```
  SEMANTIC & SEO:
  ┌────────────────────────────────────────────────────────┐
  │                                                        │
  │  GOOGLE CRAWLER ĐỌC HTML, KHÔNG ĐỌC CSS!             │
  │                                                        │
  │  ❌ <div class="title" style="font-size:32px">        │
  │     Bài viết hay                                      │
  │  </div>                                                │
  │  → Google: "Đây là div... text gì đó... rank thấp"   │
  │                                                        │
  │  ✅ <h1>Bài viết hay</h1>                              │
  │  → Google: "Đây là TIÊU ĐỀ CHÍNH! Rank cao hơn!"    │
  │                                                        │
  │  CÁC YẾUTỐ SEO TỪ SEMANTIC:                           │
  │  ┌──────────────────────────────────────────────────┐  │
  │  │  <h1>-<h6> → Google hiểu HIERARCHY nội dung!    │  │
  │  │  <article>  → Google biết đây là BÀI VIẾT!      │  │
  │  │  <nav>      → Google biết đây là NAVIGATION!    │  │
  │  │  <main>     → Google biết đây là NỘI DUNG CHÍNH!│  │
  │  │  <time>     → Google parse NGÀY GIỜ!            │  │
  │  │  <address>  → Google biết THÔNG TIN LIÊN HỆ!    │  │
  │  │  <img alt>  → Google index HÌNH ẢNH!            │  │
  │  │  <a href>   → Google FOLLOW LINKS!              │  │
  │  │  <strong>   → Google biết từ khóa QUAN TRỌNG!   │  │
  │  └──────────────────────────────────────────────────┘  │
  │                                                        │
  │  RICH SNIPPETS FROM SEMANTIC:                          │
  │  ┌──────────────────────────────────────────────────┐  │
  │  │  <article>                                       │  │
  │  │    <h2>Tiêu đề bài viết</h2>                    │  │
  │  │    <time datetime="2024-01-15">15/01/2024</time> │  │
  │  │    <address>Tác giả: Nguyễn Văn A</address>     │  │
  │  │  </article>                                      │  │
  │  │                                                  │  │
  │  │  → Google Results:                               │  │
  │  │  ┌────────────────────────────────────────┐      │  │
  │  │  │ Tiêu đề bài viết                      │      │  │
  │  │  │ Nguyễn Văn A — 15/01/2024             │      │  │
  │  │  │ Mô tả từ meta description...          │      │  │
  │  │  └────────────────────────────────────────┘      │  │
  │  └──────────────────────────────────────────────────┘  │
  │                                                        │
  └────────────────────────────────────────────────────────┘
```

---

## §6. Tự Viết — Semantic Analyzer Tool!

```javascript
// ═══════════════════════════════════════════════════════════
// SEMANTIC ANALYZER — TỰ VIẾT!
// Phân tích mức độ semantic của trang!
// ═══════════════════════════════════════════════════════════

var SemanticAnalyzer = (function () {
  var _semanticTags = [
    "header",
    "nav",
    "main",
    "section",
    "article",
    "aside",
    "footer",
    "h1",
    "h2",
    "h3",
    "h4",
    "h5",
    "h6",
    "p",
    "ul",
    "ol",
    "li",
    "dl",
    "dt",
    "dd",
    "figure",
    "figcaption",
    "blockquote",
    "pre",
    "code",
    "table",
    "thead",
    "tbody",
    "tfoot",
    "tr",
    "th",
    "td",
    "caption",
    "form",
    "fieldset",
    "legend",
    "label",
    "button",
    "input",
    "select",
    "textarea",
    "output",
    "details",
    "summary",
    "dialog",
    "address",
    "time",
    "mark",
    "strong",
    "em",
    "abbr",
    "cite",
    "q",
    "a",
    "img",
  ];

  var _nonSemanticTags = ["div", "span", "b", "i"];

  function analyze(root) {
    root = root || document.body;
    var allElements = root.querySelectorAll("*");

    var semanticCount = 0;
    var nonSemanticCount = 0;
    var divCount = 0;
    var spanCount = 0;
    var issues = [];

    for (var i = 0; i < allElements.length; i++) {
      var tag = allElements[i].tagName.toLowerCase();

      if (_semanticTags.indexOf(tag) !== -1) {
        semanticCount++;
      } else if (_nonSemanticTags.indexOf(tag) !== -1) {
        nonSemanticCount++;
        if (tag === "div") divCount++;
        if (tag === "span") spanCount++;
      }
    }

    // Specific checks:
    checkDivSoup(root, issues, divCount);
    checkHeadings(root, issues);
    checkButtons(root, issues);
    checkLinks(root, issues);
    checkLandmarks(root, issues);

    var total = semanticCount + nonSemanticCount;
    var score = total > 0 ? Math.round((semanticCount / total) * 100) : 0;

    return {
      score: score,
      grade: score >= 80 ? "A" : score >= 60 ? "B" : score >= 40 ? "C" : "D",
      semanticCount: semanticCount,
      nonSemanticCount: nonSemanticCount,
      divCount: divCount,
      spanCount: spanCount,
      issues: issues,
    };
  }

  function checkDivSoup(root, issues, divCount) {
    // Div with class suggesting semantic meaning:
    var suspiciousDivs = root.querySelectorAll(
      'div[class*="header"], div[class*="nav"], ' +
        'div[class*="footer"], div[class*="sidebar"], ' +
        'div[class*="article"], div[class*="main"]',
    );
    for (var i = 0; i < suspiciousDivs.length; i++) {
      var cls = suspiciousDivs[i].className;
      var suggestion = "";
      if (/header/i.test(cls)) suggestion = "<header>";
      else if (/nav/i.test(cls)) suggestion = "<nav>";
      else if (/footer/i.test(cls)) suggestion = "<footer>";
      else if (/sidebar/i.test(cls)) suggestion = "<aside>";
      else if (/article/i.test(cls)) suggestion = "<article>";
      else if (/main/i.test(cls)) suggestion = "<main>";

      issues.push({
        type: "warning",
        message: '<div class="' + cls + '"> → dùng ' + suggestion,
        element: suspiciousDivs[i],
      });
    }
  }

  function checkHeadings(root, issues) {
    // h1 count:
    var h1s = root.querySelectorAll("h1");
    if (h1s.length === 0) {
      issues.push({ type: "error", message: "Trang THIẾU <h1>!" });
    } else if (h1s.length > 1) {
      issues.push({
        type: "warning",
        message: "Trang có " + h1s.length + " <h1>! Nên chỉ 1.",
      });
    }

    // Heading hierarchy:
    var headings = root.querySelectorAll("h1,h2,h3,h4,h5,h6");
    var prevLevel = 0;
    for (var i = 0; i < headings.length; i++) {
      var level = parseInt(headings[i].tagName.charAt(1));
      if (level - prevLevel > 1 && prevLevel > 0) {
        issues.push({
          type: "warning",
          message: "Heading nhảy h" + prevLevel + " → h" + level + "!",
        });
      }
      prevLevel = level;
    }
  }

  function checkButtons(root, issues) {
    var divButtons = root.querySelectorAll(
      'div[onclick], span[onclick], div[class*="btn"], ' +
        'div[class*="button"], span[class*="btn"]',
    );
    for (var i = 0; i < divButtons.length; i++) {
      var tag = divButtons[i].tagName.toLowerCase();
      if (tag !== "button" && tag !== "a") {
        issues.push({
          type: "error",
          message: "<" + tag + "> dùng như button → dùng <button>!",
          element: divButtons[i],
        });
      }
    }
  }

  function checkLinks(root, issues) {
    // Div/span with onclick used as link:
    var fakeLinks = root.querySelectorAll("span[onclick], div[onclick]");
    for (var i = 0; i < fakeLinks.length; i++) {
      var el = fakeLinks[i];
      var text = el.textContent.trim();
      if (text && text.length < 50) {
        issues.push({
          type: "warning",
          message: '"' + text + '" dùng onclick → nên dùng <a>!',
          element: el,
        });
      }
    }
  }

  function checkLandmarks(root, issues) {
    if (!root.querySelector("main")) {
      issues.push({
        type: "error",
        message: "Thiếu <main>! Mỗi trang nên có 1 <main>.",
      });
    }
    if (!root.querySelector("nav")) {
      issues.push({
        type: "warning",
        message: "Thiếu <nav>. Trang có navigation nên dùng <nav>.",
      });
    }
  }

  return { analyze: analyze };
})();

// var result = SemanticAnalyzer.analyze();
// console.log('Score:', result.score + '%', 'Grade:', result.grade);
// console.log('Semantic:', result.semanticCount);
// console.log('Non-semantic:', result.nonSemanticCount);
// result.issues.forEach(function(i) { console.log(i.message); });
```

---

## §7. Tự Viết — Div-to-Semantic Converter!

```javascript
// ═══════════════════════════════════════════════════════════
// DIV-TO-SEMANTIC CONVERTER — TỰ VIẾT!
// Tự động gợi ý chuyển div soup → semantic!
// ═══════════════════════════════════════════════════════════

var DivToSemantic = (function () {
  var _classToTag = {
    header: "header",
    hdr: "header",
    "top-bar": "header",
    navbar: "nav",
    nav: "nav",
    navigation: "nav",
    menu: "nav",
    main: "main",
    content: "main",
    body: "main",
    footer: "footer",
    ftr: "footer",
    bottom: "footer",
    sidebar: "aside",
    side: "aside",
    aside: "aside",
    article: "article",
    post: "article",
    card: "article",
    "blog-post": "article",
    section: "section",
    title: "h2",
    heading: "h2",
    subtitle: "h3",
    btn: "button",
    button: "button",
    link: "a",
  };

  function suggest(root) {
    root = root || document.body;
    var divs = root.querySelectorAll("div, span");
    var suggestions = [];

    for (var i = 0; i < divs.length; i++) {
      var el = divs[i];
      var classes = (el.className || "").split(/\s+/);

      for (var j = 0; j < classes.length; j++) {
        var cls = classes[j].toLowerCase();
        for (var key in _classToTag) {
          if (cls.indexOf(key) !== -1) {
            suggestions.push({
              original:
                "<" +
                el.tagName.toLowerCase() +
                ' class="' +
                el.className +
                '">',
              suggested: "<" + _classToTag[key] + ">",
              reason: 'Class "' + cls + '" gợi ý semantic ' + _classToTag[key],
              element: el,
            });
            break;
          }
        }
      }
    }
    return suggestions;
  }

  return { suggest: suggest };
})();
```

---

## §8. React & Semantic HTML!

```javascript
// ═══════════════════════════════════════════════════════════
// REACT SEMANTIC COMPONENTS:
// ═══════════════════════════════════════════════════════════

// ① SEMANTIC PAGE LAYOUT:
function SemanticLayout(props) {
  return React.createElement(
    React.Fragment,
    null,
    // Skip link:
    React.createElement(
      "a",
      {
        href: "#main-content",
        className: "skip-link",
      },
      "Bỏ qua đến nội dung chính",
    ),

    React.createElement(
      "header",
      null,
      React.createElement(
        "nav",
        {
          "aria-label": "Main navigation",
        },
        React.createElement(
          "ul",
          null,
          props.navItems.map(function (item) {
            return React.createElement(
              "li",
              { key: item.href },
              React.createElement(
                "a",
                {
                  href: item.href,
                  "aria-current": item.active ? "page" : null,
                },
                item.label,
              ),
            );
          }),
        ),
      ),
    ),

    React.createElement(
      "main",
      {
        id: "main-content",
        tabIndex: -1,
      },
      props.children,
    ),

    React.createElement(
      "footer",
      null,
      React.createElement("p", null, "© 2024"),
    ),
  );
}

// ② SEMANTIC ARTICLE:
function SemanticArticle(props) {
  return React.createElement(
    "article",
    null,
    React.createElement(
      "header",
      null,
      React.createElement("h2", null, props.title),
      React.createElement(
        "time",
        {
          dateTime: props.date,
        },
        props.displayDate,
      ),
      React.createElement("address", null, "Tác giả: ", props.author),
    ),
    // Content:
    props.children,
    // Footer:
    React.createElement(
      "footer",
      null,
      React.createElement(
        "ul",
        {
          "aria-label": "Tags",
        },
        (props.tags || []).map(function (tag) {
          return React.createElement("li", { key: tag }, tag);
        }),
      ),
    ),
  );
}

// ③ SEMANTIC FORM:
function SemanticForm(props) {
  return React.createElement(
    "form",
    {
      "aria-label": props.formLabel,
      onSubmit: props.onSubmit,
    },
    React.createElement(
      "fieldset",
      null,
      React.createElement("legend", null, props.legend),
      // Input with label:
      React.createElement(
        "div",
        null,
        React.createElement(
          "label",
          {
            htmlFor: "email", // React: htmlFor, NOT for!
          },
          "Email",
        ),
        React.createElement("input", {
          id: "email",
          type: "email",
          required: true,
          "aria-required": "true",
        }),
      ),
      React.createElement(
        "button",
        {
          type: "submit", // Semantic: <button>, NOT <div>!
        },
        "Gửi",
      ),
    ),
  );
}
// → Screen reader hiểu hoàn toàn: form, fieldset, legend,
//   label, email input, submit button!
```

```
  REACT SEMANTIC — LƯU Ý:
  ┌────────────────────────────────────────────────────────┐
  │                                                        │
  │  ① React Fragment tránh div thừa:                     │
  │  ❌ <div><Component1/><Component2/></div>              │
  │  ✅ <><Component1/><Component2/></>                    │
  │                                                        │
  │  ② JSX attributes khác HTML:                          │
  │  → htmlFor (không for) → cho <label>                  │
  │  → className (không class)                            │
  │  → tabIndex (camelCase)                               │
  │                                                        │
  │  ③ Heading hierarchy trong components:                │
  │  → Component KHÔNG hardcode <h2>!                     │
  │  → Truyền level qua props: headingLevel={2}          │
  │  → Tạo dynamic heading: React.createElement(         │
  │      'h' + props.headingLevel, ...)                   │
  │                                                        │
  │  ④ Không dùng <div onClick>! Dùng <button>!          │
  │  → Đây là lỗi PHỔ BIẾN NHẤT trong React!             │
  │                                                        │
  └────────────────────────────────────────────────────────┘
```

---

## §9. Tổng Kết & Câu Hỏi Phỏng Vấn!

```
  SEMANTIC vs NON-SEMANTIC — TỔNG KẾT:
  ┌────────────────────────────────────────────────────────┐
  │                                                        │
  │  SEMANTIC          │  NON-SEMANTIC                     │
  │  ——————————————————│———————————————————                │
  │  Tự mô tả ý nghĩa │  Không có ý nghĩa                │
  │  <header> <nav>    │  <div> <span>                     │
  │  A11y tự có        │  Phải thêm ARIA                   │
  │  SEO tốt           │  Google không hiểu                │
  │  Code dễ đọc       │  Cần đọc class names              │
  │  Ít code hơn       │  Nhiều code hơn (ARIA+JS)         │
  │  SR navigate được  │  SR không navigate                │
  │  Keyboard tự có    │  Phải thêm tabindex               │
  │                                                        │
  └────────────────────────────────────────────────────────┘
```

**❓ Q1: Semantic HTML và non-semantic HTML khác nhau thế nào?**

> **Semantic HTML** = elements tự mô tả ý nghĩa nội dung (`<header>`, `<nav>`, `<article>`, `<button>`). Browser, screen reader, và Google đều hiểu. **Non-semantic** = `<div>`, `<span>` — chỉ là containers, **không** có ý nghĩa. Class name chỉ dev đọc hiểu, browser không parse. Semantic tự có accessibility (focus, keyboard, role), non-semantic phải tự thêm ARIA + JS + tabindex. Dùng semantic **trước**, chỉ dùng div/span cho layout/styling.

**❓ Q2: Tại sao semantic HTML quan trọng cho accessibility?**

> Semantic → browser tạo **Accessibility Tree** chính xác → screen reader hiểu: `<button>` = "button", `<nav>` = "navigation", `<h1>` = "heading level 1". Non-semantic → A11y Tree chỉ có "generic". SR có phím tắt nhảy: H=heading, L=list, B=button, D=landmark — **chỉ hoạt động với semantic**. Semantic tự có keyboard (Tab, Enter, Space). Non-semantic phải thêm tabindex, onkeydown, role — code gấp 10 lần!

**❓ Q3: section vs article vs div?**

> **`<article>`**: nội dung **độc lập**, có ý nghĩa khi tách riêng (blog post, comment, product card). **`<section>`**: nhóm nội dung **cùng chủ đề**, PHẢI có heading (`<h2>`). Nếu chỉ cần container cho styling → dùng **`<div>`**. Nguyên tắc: article = "có thể syndicate?", section = "có heading không?", div = "chỉ cần styling?".

**❓ Q4: strong vs b, em vs i?**

> **`<strong>`**: semantic = nội dung **QUAN TRỌNG** — screen reader đọc nhấn mạnh, Google hiểu keyword quan trọng. **`<b>`**: chỉ visual bold, không semantic. **`<em>`**: semantic = **nhấn mạnh ý nghĩa** — thay đổi nghĩa câu ("Tôi _không_ nói" vs "Tôi không _nói_"). **`<i>`**: chỉ visual italic. Dùng strong/em khi cần **ý nghĩa**, dùng b/i (hoặc CSS) khi chỉ cần **visual**.

**❓ Q5: Lỗi semantic phổ biến nhất trong React?**

> ① `<div onClick>` thay `<button>` — mất keyboard, focus, role! ② Div soup — `<div class="header">` thay `<header>`. ③ `<div>` bọc không cần thiết — dùng Fragment `<>`. ④ Heading không hierarchy — nhảy h1 → h4. ⑤ `<a>` không `href` hoặc `<button>` trong `<a>`. ⑥ `htmlFor` quên liên kết label. Fix: dùng **semantic HTML native**, Fragment thay div thừa, heading level qua props!

---

> 📝 **Ghi nhớ cuối cùng:**
> "Semantic = tự mô tả ý nghĩa! Div/span = containers không ý nghĩa! Semantic tự có a11y + SEO + keyboard! Non-semantic phải tự thêm mọi thứ! Dùng <button> không <div onClick>! Dùng <nav> không <div class='nav'>! Khi nào cần container mà KHÔNG cần ý nghĩa → dùng div!"
