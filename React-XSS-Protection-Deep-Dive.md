# React XSS Protection — Deep Dive!

> **Chủ đề**: How does React handle XSS attacks in JSX by default?
> **Ngôn ngữ**: Tiếng Việt — giải thích cực kỳ chi tiết!
> **Phương châm**: Tự viết lại bằng tay — KHÔNG dùng thư viện!

---

## Mục Lục

1. [§1. JSX Là Gì? — Hiểu Rõ Bản Chất!](#1)
2. [§2. React Auto-Escaping — Cơ Chế Tự Động Thoát Ký Tự!](#2)
3. [§3. Tự Viết — escapeHtml() Giống React Source Code!](#3)
4. [§4. textContent vs innerHTML — Tại Sao React An Toàn?](#4)
5. [§5. $$typeof — React Element Type Checking!](#5)
6. [§6. Tự Viết — Mini React Renderer An Toàn!](#6)
7. [§7. dangerouslySetInnerHTML — Lỗ Hổng Duy Nhất!](#7)
8. [§8. Các Vector Tấn Công Bypass React!](#8)
9. [§9. Tự Viết — React XSS Validator Từ Đầu!](#9)
10. [§10. Tổng Kết & Câu Hỏi Phỏng Vấn!](#10)

---

## §1. JSX Là Gì? — Hiểu Rõ Bản Chất!

### 1.1. JSX KHÔNG PHẢI HTML!

```
  JSX — HIỂU SAI LỚN NHẤT:
  ┌────────────────────────────────────────────────────────┐
  │                                                        │
  │  ❌ HIỂU SAI: "JSX = HTML trong JavaScript"            │
  │  ✅ HIỂU ĐÚNG: "JSX = SYNTAX SUGAR cho React.createElement()" │
  │                                                        │
  │  JSX:                                                   │
  │  ┌──────────────────────────────────────────────────┐  │
  │  │  const element = <h1>Hello, {name}</h1>;         │  │
  │  └──────────────────────────────────────────────────┘  │
  │                    ↓ BABEL COMPILE ↓                    │
  │  JavaScript:                                            │
  │  ┌──────────────────────────────────────────────────┐  │
  │  │  const element = React.createElement(            │  │
  │  │    'h1',          // type                        │  │
  │  │    null,          // props                       │  │
  │  │    'Hello, ',     // children[0] — STRING!       │  │
  │  │    name           // children[1] — BIẾN!         │  │
  │  │  );                                              │  │
  │  └──────────────────────────────────────────────────┘  │
  │                                                        │
  │  → JSX được COMPILE thành function call!               │
  │  → KHÔNG BAO GIỜ trở thành HTML trực tiếp!            │
  │  → React KIỂM SOÁT cách render vào DOM!                │
  │                                                        │
  └────────────────────────────────────────────────────────┘
```

### 1.2. React.createElement() Trả Về Gì?

```javascript
// ═══════════════════════════════════════════════════════════
// REACT ELEMENT — OBJECT THUẦN JAVASCRIPT!
// ═══════════════════════════════════════════════════════════

// JSX:
// const el = <h1 className="title">Hello, {name}</h1>;

// COMPILE thành:
var el = React.createElement("h1", { className: "title" }, "Hello, ", name);

// KẾT QUẢ — React Element Object:
var reactElement = {
  $$typeof: Symbol.for("react.element"), // ← BẢO MẬT!
  type: "h1",
  key: null,
  ref: null,
  props: {
    className: "title",
    children: ["Hello, ", name], // ← CHỈ LÀ STRING!
  },
  _owner: null,
};

// → React Element KHÔNG PHẢI DOM node!
// → Nó chỉ là JavaScript Object MÔ TẢ UI!
// → React sẽ dùng object này để TẠO DOM một cách AN TOÀN!
```

```
  LUỒNG TỪ JSX → DOM:
  ┌────────────────────────────────────────────────────────┐
  │                                                        │
  │  ① JSX Code:                                            │
  │  <h1>Hello, {userInput}</h1>                           │
  │       ↓                                                │
  │  ② Babel Compile:                                       │
  │  React.createElement('h1', null, 'Hello, ', userInput) │
  │       ↓                                                │
  │  ③ React Element (Plain Object):                        │
  │  { type: 'h1', props: { children: ['Hello,', input] }} │
  │       ↓                                                │
  │  ④ React DOM Renderer:                                  │
  │  ┌──────────────────────────────────────────────────┐  │
  │  │  Kiểm tra children:                              │  │
  │  │  → typeof child === 'string'?                   │  │
  │  │  → CÓ! → dùng textContent (AN TOÀN!)           │  │
  │  │  → KHÔNG dùng innerHTML!                        │  │
  │  │  → Ký tự đặc biệt KHÔNG được parse thành HTML! │  │
  │  └──────────────────────────────────────────────────┘  │
  │       ↓                                                │
  │  ⑤ Real DOM:                                            │
  │  <h1>Hello, &lt;script&gt;alert(1)&lt;/script&gt;</h1> │
  │  → HIỂN THỊ text, KHÔNG chạy script!                  │
  │                                                        │
  └────────────────────────────────────────────────────────┘
```

---

## §2. React Auto-Escaping — Cơ Chế Tự Động!

### 2.1. React Escape Ở Đâu?

```
  REACT AUTO-ESCAPING — XẢY RA Ở ĐÂU?
  ┌────────────────────────────────────────────────────────┐
  │                                                        │
  │  QUAN TRỌNG — 2 CƠ CHẾ BẢO VỆ:                       │
  │                                                        │
  │  ① KHÔNG DÙNG innerHTML:                                │
  │  ┌──────────────────────────────────────────────────┐  │
  │  │  React KHÔNG chèn string qua innerHTML!          │  │
  │  │  React dùng textContent hoặc createTextNode()!  │  │
  │  │                                                  │  │
  │  │  innerHTML:                                      │  │
  │  │  element.innerHTML = '<script>alert(1)</script>'│  │
  │  │  → Browser PARSE HTML → CHẠY script! ❌        │  │
  │  │                                                  │  │
  │  │  textContent:                                    │  │
  │  │  element.textContent = '<script>alert(1)</script>'│
  │  │  → Browser HIỂN THỊ text → KHÔNG chạy! ✅      │  │
  │  │                                                  │  │
  │  │  → ĐÂY LÀ CƠ CHẾ CHÍNH!                       │  │
  │  └──────────────────────────────────────────────────┘  │
  │                                                        │
  │  ② ESCAPE TRONG SSR (Server-Side Rendering):            │
  │  ┌──────────────────────────────────────────────────┐  │
  │  │  Khi render trên server → output = HTML string! │  │
  │  │  → PHẢI escape ký tự đặc biệt!                 │  │
  │  │  → React gọi escapeHtml() cho mọi text node!   │  │
  │  │                                                  │  │
  │  │  Input:  '<script>alert("XSS")</script>'        │  │
  │  │  Output: '&lt;script&gt;alert(&quot;XSS&quot;)  │  │
  │  │           &lt;/script&gt;'                       │  │
  │  │  → AN TOÀN khi gửi trong HTML response!         │  │
  │  └──────────────────────────────────────────────────┘  │
  │                                                        │
  └────────────────────────────────────────────────────────┘
```

### 2.2. Client-Side vs Server-Side — Khác Nhau!

```
  2 MÔI TRƯỜNG — 2 CÁCH BẢO VỆ:
  ┌────────────────────────────────────────────────────────┐
  │                                                        │
  │  CLIENT-SIDE RENDERING (CSR):                           │
  │  ┌──────────────────────────────────────────────────┐  │
  │  │  React Element → DOM APIs                        │  │
  │  │                                                  │  │
  │  │  String children:                                │  │
  │  │  → document.createTextNode(text)                │  │
  │  │  → HOẶC node.textContent = text                 │  │
  │  │  → Browser tự xử lý! KHÔNG parse HTML!          │  │
  │  │  → KHÔNG CẦN escape thủ công!                   │  │
  │  │                                                  │  │
  │  │  Tại sao an toàn?                                │  │
  │  │  → createTextNode() TẠO Text Node!              │  │
  │  │  → Text Node KHÔNG BAO GIỜ chứa HTML tag!      │  │
  │  │  → Browser KHÔNG parse nội dung Text Node!      │  │
  │  └──────────────────────────────────────────────────┘  │
  │                                                        │
  │  SERVER-SIDE RENDERING (SSR):                           │
  │  ┌──────────────────────────────────────────────────┐  │
  │  │  React Element → HTML String                     │  │
  │  │                                                  │  │
  │  │  String children:                                │  │
  │  │  → escapeHtml(text)                             │  │
  │  │  → Thay thế < > & " ' thành entities!           │  │
  │  │  → PHẢI escape vì output là raw HTML string!    │  │
  │  │                                                  │  │
  │  │  Tại sao cần escape?                             │  │
  │  │  → Output gửi qua HTTP → browser parse HTML!   │  │
  │  │  → Nếu không escape → browser thấy <script>!   │  │
  │  │  → Nên React ESCAPE trước khi gửi!              │  │
  │  └──────────────────────────────────────────────────┘  │
  │                                                        │
  └────────────────────────────────────────────────────────┘
```

---

## §3. Tự Viết — escapeHtml() Giống React Source Code!

### 3.1. React Source Code — escapeHtml!

```javascript
// ═══════════════════════════════════════════════════════════
// REACT escapeHtml — TỰ VIẾT GIỐNG REACT SOURCE CODE!
// File gốc: react-dom/src/server/escapeTextForBrowser.js
// ═══════════════════════════════════════════════════════════

// ① BẢNG ESCAPE — 5 ký tự nguy hiểm:
var ESCAPE_LOOKUP = {
  "&": "&amp;", // & → &amp;  (HTML entity start)
  ">": "&gt;", // > → &gt;  (close tag)
  "<": "&lt;", // < → &lt;  (open tag)
  '"': "&quot;", // " → &quot; (attribute delimiter)
  "'": "&#x27;", // ' → &#x27; (attribute delimiter)
};

// Regex match TẤT CẢ 5 ký tự:
var ESCAPE_REGEX = /[&><"']/g;

// ② HÀM ESCAPE — GIỐNG REACT!
function escapeHtml(text) {
  // React check type trước:
  if (typeof text === "boolean" || typeof text === "number") {
    // Number và boolean AN TOÀN — trả về luôn!
    return "" + text;
  }

  // Escape string:
  var str = "" + text;
  var match = ESCAPE_REGEX.exec(str);

  // Nếu KHÔNG có ký tự nguy hiểm → trả nguyên:
  if (!match) {
    return str;
  }

  // CÓ ký tự nguy hiểm → escape TỪNG cái:
  var escaped = "";
  var lastIndex = 0;
  var index;

  // Reset regex:
  ESCAPE_REGEX.lastIndex = 0;

  while ((match = ESCAPE_REGEX.exec(str)) !== null) {
    index = match.index;

    // Copy phần an toàn trước ký tự nguy hiểm:
    if (lastIndex !== index) {
      escaped += str.substring(lastIndex, index);
    }

    // Thay thế ký tự nguy hiểm:
    escaped += ESCAPE_LOOKUP[match[0]];
    lastIndex = index + 1;
  }

  // Copy phần còn lại:
  if (lastIndex !== str.length) {
    escaped += str.substring(lastIndex);
  }

  return escaped;
}

// ③ THỬ NGHIỆM:
var tests = [
  '<script>alert("XSS")</script>',
  "<img src=x onerror=alert(1)>",
  "Hello & welcome <User>!",
  'It\'s a "beautiful" day',
  "Normal text without special chars",
  42,
  true,
];

for (var i = 0; i < tests.length; i++) {
  console.log("Input: ", tests[i]);
  console.log("Output:", escapeHtml(tests[i]));
  console.log("---");
}
// Output:
// Input:  <script>alert("XSS")</script>
// Output: &lt;script&gt;alert(&quot;XSS&quot;)&lt;/script&gt;
//
// Input:  <img src=x onerror=alert(1)>
// Output: &lt;img src=x onerror=alert(1)&gt;
//
// Input:  Hello & welcome <User>!
// Output: Hello &amp; welcome &lt;User&gt;!
//
// Input:  42
// Output: 42    ← Number trả về luôn, không escape!
```

### 3.2. Tại Sao React Dùng Thuật Toán Này?

```
  ESCAPE HTML — TẠI SAO LÀM THẾ NÀY?
  ┌────────────────────────────────────────────────────────┐
  │                                                        │
  │  TẠI SAO KHÔNG DÙNG .replace() ĐƠN GIẢN?              │
  │  ┌──────────────────────────────────────────────────┐  │
  │  │                                                  │  │
  │  │  // Cách đơn giản (CHẬM!):                       │  │
  │  │  str.replace(/&/g, '&amp;')                     │  │
  │  │     .replace(/</g, '&lt;')                      │  │
  │  │     .replace(/>/g, '&gt;')                      │  │
  │  │     .replace(/"/g, '&quot;')                    │  │
  │  │     .replace(/'/g, '&#x27;')                    │  │
  │  │                                                  │  │
  │  │  → 5 LẦN duyệt string!                         │  │
  │  │  → 5 LẦN tạo string mới!                       │  │
  │  │  → O(5n) time, O(5) string allocations!          │  │
  │  │                                                  │  │
  │  │  // Cách React (NHANH!):                          │  │
  │  │  → CHỈ 1 LẦN duyệt string!                     │  │
  │  │  → CHỈ 1 LẦN tạo string mới!                   │  │
  │  │  → O(n) time, O(1) string allocation!            │  │
  │  │  → NHANH hơn 5x cho string lớn!                 │  │
  │  │                                                  │  │
  │  └──────────────────────────────────────────────────┘  │
  │                                                        │
  │  TẠI SAO CHECK NUMBER/BOOLEAN TRƯỚC?                   │
  │  ┌──────────────────────────────────────────────────┐  │
  │  │  → Number (42) KHÔNG BAO GIỜ chứa < > & " '    │  │
  │  │  → Boolean (true/false) cũng vậy!               │  │
  │  │  → SKIP escape → tiết kiệm CPU!                │  │
  │  │  → React render HÀNG TRIỆU nodes!              │  │
  │  │  → Mỗi micro-optimization đều QUAN TRỌNG!       │  │
  │  └──────────────────────────────────────────────────┘  │
  │                                                        │
  └────────────────────────────────────────────────────────┘
```

---

## §4. textContent vs innerHTML — Tại Sao React An Toàn?

### 4.1. Tự Viết — So Sánh textContent vs innerHTML!

```javascript
// ═══════════════════════════════════════════════════════════
// textContent vs innerHTML — BẢN CHẤT KHÁC BIỆT!
// ═══════════════════════════════════════════════════════════

// ① innerHTML — NGUY HIỂM!
function demonstrateInnerHTML() {
  var div = document.createElement("div");
  var malicious = '<img src=x onerror=alert("XSS")>';

  // innerHTML → Browser PARSE thành HTML!
  div.innerHTML = malicious;

  // DOM TREE sau innerHTML:
  // <div>
  //   └── <img src="x" onerror="alert('XSS')">
  //       → Browser tạo IMG element!
  //       → src=x FAIL → trigger onerror!
  //       → alert("XSS") CHẠY! ❌
  // </div>

  console.log("innerHTML childNodes:", div.childNodes.length);
  // → 1 (Element node — <img>!)
  console.log("First child type:", div.firstChild.nodeType);
  // → 1 (ELEMENT_NODE!)
}

// ② textContent — AN TOÀN!
function demonstrateTextContent() {
  var div = document.createElement("div");
  var malicious = '<img src=x onerror=alert("XSS")>';

  // textContent → Browser tạo TEXT NODE!
  div.textContent = malicious;

  // DOM TREE sau textContent:
  // <div>
  //   └── #text "<img src=x onerror=alert("XSS")>"
  //       → Browser tạo TEXT node!
  //       → KHÔNG parse HTML!
  //       → Hiển thị nguyên văn! ✅
  // </div>

  console.log("textContent childNodes:", div.childNodes.length);
  // → 1 (Text node!)
  console.log("First child type:", div.firstChild.nodeType);
  // → 3 (TEXT_NODE! — KHÔNG phải element!)
}

// ③ createTextNode — CÁCH REACT DÙNG!
function demonstrateCreateTextNode() {
  var div = document.createElement("div");
  var malicious = '<img src=x onerror=alert("XSS")>';

  // createTextNode → TẠO Text Node trực tiếp!
  var textNode = document.createTextNode(malicious);
  div.appendChild(textNode);

  // DOM TREE — GIỐNG textContent:
  // <div>
  //   └── #text "<img src=x onerror=alert("XSS")>"
  //       → Text node — KHÔNG parse! ✅
  // </div>

  // ĐÂY CHÍNH LÀ CÁCH REACT RENDER STRING!
}
```

```
  textContent vs innerHTML — SƠ ĐỒ DOM TREE:
  ┌────────────────────────────────────────────────────────┐
  │                                                        │
  │  INPUT: '<img src=x onerror=alert(1)>'                 │
  │                                                        │
  │  innerHTML:                  textContent:               │
  │  ┌──────────────┐           ┌──────────────┐          │
  │  │ <div>        │           │ <div>        │          │
  │  │  └ <img>     │           │  └ #text     │          │
  │  │    src="x"   │           │    "<img     │          │
  │  │    onerror=  │           │     src=x    │          │
  │  │    alert(1)  │           │     onerror= │          │
  │  │              │           │     alert(1) │          │
  │  │  ELEMENT! ❌ │           │     >"       │          │
  │  │  → CHẠY JS! │           │  TEXT! ✅     │          │
  │  └──────────────┘           │  → Hiển thị! │          │
  │                              └──────────────┘          │
  │                                                        │
  │  Node Types:                                            │
  │  ┌──────────────────────────────────────────────────┐  │
  │  │  nodeType 1 = ELEMENT_NODE (parse HTML!)         │  │
  │  │  nodeType 3 = TEXT_NODE (raw text, AN TOÀN!)     │  │
  │  │                                                  │  │
  │  │  React LUÔN tạo TEXT_NODE cho string children!   │  │
  │  │  → KHÔNG BAO GIỜ parse user input thành HTML!   │  │
  │  └──────────────────────────────────────────────────┘  │
  │                                                        │
  └────────────────────────────────────────────────────────┘
```

---

## §5. $$typeof — React Element Type Checking!

### 5.1. $$typeof Symbol — Chống JSON Injection!

```
  $$typeof — LỚP BẢO VỆ BÍ MẬT CỦA REACT:
  ┌────────────────────────────────────────────────────────┐
  │                                                        │
  │  VẤN ĐỀ — Server trả về JSON chứa React Element:      │
  │  ┌──────────────────────────────────────────────────┐  │
  │  │                                                  │  │
  │  │  // Hacker gửi JSON giả mạo React Element:       │  │
  │  │  {                                                │  │
  │  │    "type": "div",                                │  │
  │  │    "props": {                                     │  │
  │  │      "dangerouslySetInnerHTML": {                 │  │
  │  │        "__html": "<script>alert('XSS')</script>" │  │
  │  │      }                                            │  │
  │  │    }                                              │  │
  │  │  }                                                │  │
  │  │                                                  │  │
  │  │  Nếu React render object này → XSS!             │  │
  │  │                                                  │  │
  │  └──────────────────────────────────────────────────┘  │
  │                                                        │
  │  GIẢI PHÁP — $$typeof Symbol:                          │
  │  ┌──────────────────────────────────────────────────┐  │
  │  │                                                  │  │
  │  │  React Element THẬT:                              │  │
  │  │  {                                                │  │
  │  │    $$typeof: Symbol.for('react.element'),        │  │
  │  │    type: 'div',                                  │  │
  │  │    props: { children: 'Hello' }                  │  │
  │  │  }                                                │  │
  │  │                                                  │  │
  │  │  → $$typeof = Symbol!                            │  │
  │  │  → JSON.parse() KHÔNG tạo được Symbol!          │  │
  │  │  → JSON chỉ hỗ trợ: string, number, boolean,   │  │
  │  │    null, array, object                           │  │
  │  │  → Symbol KHÔNG NẰM TRONG JSON spec!            │  │
  │  │  → Hacker KHÔNG THỂ giả mạo qua JSON!          │  │
  │  │                                                  │  │
  │  └──────────────────────────────────────────────────┘  │
  │                                                        │
  └────────────────────────────────────────────────────────┘
```

### 5.2. Tự Viết — $$typeof Validation!

```javascript
// ═══════════════════════════════════════════════════════════
// $$typeof — TỰ VIẾT VALIDATION GIỐNG REACT!
// ═══════════════════════════════════════════════════════════

// ① ĐỊNH NGHĨA REACT ELEMENT TYPE:
var REACT_ELEMENT_TYPE =
  typeof Symbol === "function" && Symbol.for
    ? Symbol.for("react.element")
    : 0xeac7; // Fallback cho browser cũ (trông giống "React"!)

// ② TẠO REACT ELEMENT AN TOÀN:
function createElement(type, props, children) {
  var element = {
    // $$typeof = Symbol → KHÔNG THỂ giả mạo qua JSON!
    $$typeof: REACT_ELEMENT_TYPE,
    type: type,
    key: null,
    ref: null,
    props: {
      children: children,
    },
  };

  // Copy props:
  if (props) {
    var keys = Object.keys(props);
    for (var i = 0; i < keys.length; i++) {
      element.props[keys[i]] = props[keys[i]];
    }
  }

  // Freeze để chống modify:
  if (Object.freeze) {
    Object.freeze(element);
    Object.freeze(element.props);
  }

  return element;
}

// ③ KIỂM TRA REACT ELEMENT THẬT:
function isValidElement(object) {
  return (
    typeof object === "object" &&
    object !== null &&
    object.$$typeof === REACT_ELEMENT_TYPE
  );
}

// ④ THỬ NGHIỆM:
var realElement = createElement("h1", null, "Hello");
console.log("Real element valid?", isValidElement(realElement));
// → true ✅

// Giả mạo qua JSON:
var fakeJSON = '{"$$typeof": "Symbol(react.element)", "type": "div"}';
var fakeElement = JSON.parse(fakeJSON);
console.log("Fake element valid?", isValidElement(fakeElement));
// → false ❌ ($$typeof là STRING, không phải Symbol!)

// Giả mạo trực tiếp:
var fakeObject = {
  $$typeof: 'Symbol.for("react.element")',
  type: "div",
  props: { dangerouslySetInnerHTML: { __html: "<script>XSS</script>" } },
};
console.log("Fake object valid?", isValidElement(fakeObject));
// → false ❌ (String ≠ Symbol!)
```

```
  $$typeof — SƠ ĐỒ BẢO VỆ:
  ┌────────────────────────────────────────────────────────┐
  │                                                        │
  │  HACKER gửi JSON → Server → React:                    │
  │                                                        │
  │  ┌──────────┐  JSON  ┌──────────┐  render  ┌───────┐ │
  │  │ Hacker   │ ─────→│ Server   │ ──────→ │ React │ │
  │  │          │        │          │         │       │ │
  │  │ Fake     │        │ Parse    │         │ Check │ │
  │  │ Element  │        │ JSON     │         │$$type │ │
  │  └──────────┘        └──────────┘         │ of    │ │
  │                                            └───┬───┘ │
  │                                                │      │
  │                           ┌────────────────────┤      │
  │                           │                    │      │
  │               $$typeof = Symbol?    $$typeof ≠ Symbol? │
  │                    ↓                      ↓            │
  │               ✅ RENDER!           ❌ REJECT!          │
  │               (Element thật)       (Fake từ JSON!)    │
  │                                                        │
  │  → JSON.parse() KHÔNG tạo được Symbol!                │
  │  → Symbol là primitive KHÔNG serialize được!           │
  │  → Hacker KHÔNG THỂ bypass qua API/network!           │
  │                                                        │
  └────────────────────────────────────────────────────────┘
```

---

## §6. Tự Viết — Mini React Renderer An Toàn!

### 6.1. Renderer — Từ React Element → Real DOM!

```javascript
// ═══════════════════════════════════════════════════════════
// MINI REACT RENDERER — TỰ VIẾT TỪ ĐẦU!
// Render React Element thành Real DOM — AN TOÀN!
// ═══════════════════════════════════════════════════════════

var REACT_ELEMENT_TYPE = Symbol.for("react.element");

// ① RENDER FUNCTION — TRÁI TIM CỦA REACT DOM!
function render(element, container) {
  // Clear container:
  container.innerHTML = "";

  // Render element:
  var domNode = createDOMNode(element);
  container.appendChild(domNode);
}

// ② TẠO DOM NODE TỪ REACT ELEMENT:
function createDOMNode(element) {
  // CASE 1: String/Number → TẠO TEXT NODE!
  // → ĐÂY LÀ BẢO VỆ XSS CHÍNH!
  if (typeof element === "string" || typeof element === "number") {
    // createTextNode() → AN TOÀN!
    // → KHÔNG BAO GIỜ parse HTML!
    // → '<script>alert(1)</script>' → chỉ là text!
    return document.createTextNode("" + element);
  }

  // CASE 2: null/undefined/boolean → render nothing:
  if (element == null || typeof element === "boolean") {
    return document.createTextNode("");
  }

  // CASE 3: Array → render từng phần tử:
  if (Array.isArray(element)) {
    var fragment = document.createDocumentFragment();
    for (var i = 0; i < element.length; i++) {
      fragment.appendChild(createDOMNode(element[i]));
    }
    return fragment;
  }

  // CASE 4: React Element → KIỂM TRA $$typeof!
  if (typeof element === "object" && element !== null) {
    // ⚠ KIỂM TRA BẢO MẬT — $$typeof!
    if (element.$$typeof !== REACT_ELEMENT_TYPE) {
      // KHÔNG PHẢI React Element thật → CHẶN!
      console.warn("Invalid element! Missing $$typeof!");
      return document.createTextNode("[Invalid Element]");
    }

    // Tạo DOM element:
    var domNode = document.createElement(element.type);

    // Set props:
    var props = element.props || {};
    var propKeys = Object.keys(props);

    for (var j = 0; j < propKeys.length; j++) {
      var key = propKeys[j];
      var value = props[key];

      if (key === "children") {
        // Render children recursively:
        if (Array.isArray(value)) {
          for (var k = 0; k < value.length; k++) {
            domNode.appendChild(createDOMNode(value[k]));
          }
        } else {
          domNode.appendChild(createDOMNode(value));
        }
      } else if (key === "className") {
        domNode.setAttribute("class", value);
      } else if (key === "dangerouslySetInnerHTML") {
        // ⚠ CHỈ CHỖ NÀY dùng innerHTML!
        // → Developer PHẢI tự chịu trách nhiệm!
        if (value && value.__html != null) {
          domNode.innerHTML = value.__html;
        }
      } else if (key.indexOf("on") === 0) {
        // Event handlers:
        var eventName = key.substring(2).toLowerCase();
        domNode.addEventListener(eventName, value);
      } else if (key !== "key" && key !== "ref") {
        domNode.setAttribute(key, value);
      }
    }

    return domNode;
  }

  // Fallback:
  return document.createTextNode("" + element);
}

// ③ THỬ NGHIỆM — XSS BỊ CHẶN!
var userInput = '<script>alert("XSS")</script>';

// Tạo React Element:
var safeElement = {
  $$typeof: REACT_ELEMENT_TYPE,
  type: "div",
  props: {
    children: [
      "User said: ",
      userInput, // ← STRING → createTextNode → AN TOÀN!
    ],
  },
};

// Render:
// render(safeElement, document.getElementById('root'));
// Kết quả DOM:
// <div>
//   #text "User said: "
//   #text "<script>alert("XSS")</script>"    ← TEXT NODE!
// </div>
// → XSS KHÔNG CHẠY! ✅
```

```
  MINI RENDERER — LUỒNG XỬ LÝ:
  ┌────────────────────────────────────────────────────────┐
  │                                                        │
  │  createDOMNode(element) {                              │
  │    ┌─────────────────────────────────────────────┐     │
  │    │ typeof element?                             │     │
  │    └────────────────┬────────────────────────────┘     │
  │                     │                                  │
  │       ┌─────────────┼──────────────┐                   │
  │       ↓             ↓              ↓                   │
  │    string/       object         array                  │
  │    number        (Element)                             │
  │       │             │              │                   │
  │       ↓             ↓              ↓                   │
  │  createTextNode  $$typeof     iterate &                │
  │  (AN TOÀN! ✅)  check?       recurse                  │
  │                     │                                  │
  │              ┌──────┴──────┐                           │
  │              ↓             ↓                           │
  │          = Symbol?     ≠ Symbol?                       │
  │              │             │                           │
  │              ↓             ↓                           │
  │        createElement   REJECT! ❌                      │
  │        + set props     (chống JSON                     │
  │        + recurse        injection!)                    │
  │        children                                        │
  │                                                        │
  │  → String LUÔN thành TextNode (AN TOÀN!)               │
  │  → Object PHẢI có $$typeof Symbol (CHỐNG GIẢ MẠO!)    │
  │  → innerHTML CHỈ dùng khi dangerouslySetInnerHTML!     │
  │                                                        │
  └────────────────────────────────────────────────────────┘
```

---

## §7. dangerouslySetInnerHTML — Lỗ Hổng Duy Nhất!

### 7.1. Tại Sao Cần dangerouslySetInnerHTML?

```
  dangerouslySetInnerHTML — LỖ HỔNG MÀ REACT CỐ Ý ĐỂ LẠI:
  ┌────────────────────────────────────────────────────────┐
  │                                                        │
  │  TẠI SAO CẦN?                                          │
  │  ┌──────────────────────────────────────────────────┐  │
  │  │  Đôi khi BẮT BUỘC phải render HTML thô:         │  │
  │  │  → Rich text editor (Bold, Italic, Links...)    │  │
  │  │  → HTML từ CMS (WordPress, Strapi...)           │  │
  │  │  → Markdown render thành HTML                   │  │
  │  │  → Email templates                              │  │
  │  │                                                  │  │
  │  │  React auto-escape SẼ PHÁ HỎng HTML:            │  │
  │  │  Input: '<b>Bold</b> text'                      │  │
  │  │  React: '&lt;b&gt;Bold&lt;/b&gt; text'          │  │
  │  │  → Hiển thị: <b>Bold</b> text (RAW!)           │  │
  │  │  → KHÔNG PHẢI: **Bold** text (formatted!)       │  │
  │  └──────────────────────────────────────────────────┘  │
  │                                                        │
  │  CÁCH DÙNG:                                             │
  │  ┌──────────────────────────────────────────────────┐  │
  │  │  // React YÊU CẦU tên thật DÀI, thật SỢ:       │  │
  │  │  // "dangerously" + "Set" + "InnerHTML"          │  │
  │  │  // → Developer PHẢI BIẾT mình đang làm gì!    │  │
  │  │                                                  │  │
  │  │  // Prop phải là object { __html: '...' }:       │  │
  │  │  // → 2 LỚP xác nhận:                          │  │
  │  │  //   ① Tên prop dài và đáng sợ                 │  │
  │  │  //   ② Phải tạo object { __html }              │  │
  │  │  // → Khó mà "vô tình" dùng!                   │  │
  │  │                                                  │  │
  │  │  <div dangerouslySetInnerHTML={{ __html: html }}│  │
  │  │  />                                              │  │
  │  └──────────────────────────────────────────────────┘  │
  │                                                        │
  └────────────────────────────────────────────────────────┘
```

### 7.2. Tự Viết — Safe Wrapper Cho dangerouslySetInnerHTML!

```javascript
// ═══════════════════════════════════════════════════════════
// SAFE HTML RENDERER — BỌC dangerouslySetInnerHTML!
// ═══════════════════════════════════════════════════════════

// ① SANITIZER (đơn giản) — whitelist approach:
var SAFE_TAGS = {
  b: true,
  i: true,
  u: true,
  em: true,
  strong: true,
  p: true,
  br: true,
  ul: true,
  ol: true,
  li: true,
  h1: true,
  h2: true,
  h3: true,
  h4: true,
  a: true,
  code: true,
  pre: true,
  blockquote: true,
};

var SAFE_ATTRS = {
  a: { href: true, title: true, target: true },
  img: { src: true, alt: true, width: true, height: true },
};

function sanitizeForReact(dirtyHtml) {
  // Bước 1: Parse thành DOM (dùng browser parser):
  var parser = new DOMParser();
  var doc = parser.parseFromString(dirtyHtml, "text/html");
  var body = doc.body;

  // Bước 2: Walk DOM tree, chỉ giữ safe nodes:
  function cleanNode(node) {
    if (node.nodeType === 3) {
      // Text node → AN TOÀN!
      return node.textContent;
    }

    if (node.nodeType !== 1) {
      return ""; // Comment, etc → xóa!
    }

    var tagName = node.tagName.toLowerCase();

    // Kiểm tra tag:
    if (!SAFE_TAGS[tagName]) {
      // Tag KHÔNG an toàn → chỉ lấy text content:
      var childText = "";
      for (var i = 0; i < node.childNodes.length; i++) {
        childText += cleanNode(node.childNodes[i]);
      }
      return childText; // Xóa tag, giữ nội dung!
    }

    // Tag an toàn → giữ lại:
    var result = "<" + tagName;

    // Chỉ giữ safe attributes:
    var allowedAttrs = SAFE_ATTRS[tagName] || {};
    for (var j = 0; j < node.attributes.length; j++) {
      var attr = node.attributes[j];
      var attrName = attr.name.toLowerCase();

      if (allowedAttrs[attrName]) {
        // Kiểm tra href — chặn javascript:!
        if (attrName === "href") {
          var hrefLower = attr.value.toLowerCase().trim();
          if (hrefLower.indexOf("javascript:") === 0) {
            continue; // CHẶN javascript: URL!
          }
        }
        result +=
          " " +
          attrName +
          '="' +
          attr.value.replace(/&/g, "&amp;").replace(/"/g, "&quot;") +
          '"';
      }
    }

    // Self-closing tags:
    if (tagName === "br" || tagName === "img") {
      return result + " />";
    }

    result += ">";

    // Recursively clean children:
    for (var k = 0; k < node.childNodes.length; k++) {
      result += cleanNode(node.childNodes[k]);
    }

    result += "</" + tagName + ">";
    return result;
  }

  var clean = "";
  for (var m = 0; m < body.childNodes.length; m++) {
    clean += cleanNode(body.childNodes[m]);
  }
  return clean;
}

// ② REACT COMPONENT — SafeHTML:
function SafeHTML(props) {
  var cleanHtml = sanitizeForReact(props.html);

  return {
    $$typeof: Symbol.for("react.element"),
    type: "div",
    props: {
      className: "safe-html-content",
      dangerouslySetInnerHTML: { __html: cleanHtml },
    },
  };
}

// ③ THỬ NGHIỆM:
var dirty =
  "<p>Hello <b>world</b></p>" +
  '<script>alert("XSS")</script>' +
  '<a href="javascript:alert(1)">Click</a>' +
  '<a href="https://safe.com">Safe link</a>' +
  "<img src=x onerror=alert(1)>";

var clean = sanitizeForReact(dirty);
console.log("Clean HTML:", clean);
// Output: <p>Hello <b>world</b></p>
//         alert("XSS")
//         <a>Click</a>
//         <a href="https://safe.com">Safe link</a>
// → script TAG bị XÓA!
// → javascript: href bị XÓA!
// → img onerror bị XÓA!
```

---

## §8. Các Vector Tấn Công Bypass React!

### 8.1. 5 Cách XSS CÓ THỂ Xảy Ra Trong React!

```
  REACT BYPASS — 5 LỖ HỔNG CÒN LẠI:
  ┌────────────────────────────────────────────────────────┐
  │                                                        │
  │  ① dangerouslySetInnerHTML (đã nói ở §7):              │
  │  ┌──────────────────────────────────────────────────┐  │
  │  │  <div dangerouslySetInnerHTML={{                  │  │
  │  │    __html: userInput  // ← XSS nếu không sanitize│  │
  │  │  }} />                                           │  │
  │  │  FIX: Luôn sanitize trước khi dùng!             │  │
  │  └──────────────────────────────────────────────────┘  │
  │                                                        │
  │  ② href="javascript:" — React KHÔNG chặn!              │
  │  ┌──────────────────────────────────────────────────┐  │
  │  │  const url = 'javascript:alert(document.cookie)';│  │
  │  │  <a href={url}>Click me</a>                      │  │
  │  │  → React ESCAPE value trong attribute!          │  │
  │  │  → NHƯNG javascript: vẫn CHẠY khi click!       │  │
  │  │  → Vì browser hiểu javascript: protocol!        │  │
  │  │                                                  │  │
  │  │  FIX — Validate URL:                             │  │
  │  │  function safeUrl(url) {                         │  │
  │  │    var lower = url.toLowerCase().trim();         │  │
  │  │    if (lower.indexOf('javascript:') === 0 ||    │  │
  │  │        lower.indexOf('vbscript:') === 0  ||     │  │
  │  │        lower.indexOf('data:') === 0) {          │  │
  │  │      return '#';                                 │  │
  │  │    }                                             │  │
  │  │    return url;                                   │  │
  │  │  }                                               │  │
  │  └──────────────────────────────────────────────────┘  │
  │                                                        │
  │  ③ SSR JSON Injection:                                  │
  │  ┌──────────────────────────────────────────────────┐  │
  │  │  // Server serialize data vào HTML:               │  │
  │  │  <script>                                         │  │
  │  │    window.__DATA__ = {"name":"</script>           │  │
  │  │    <script>alert('XSS')</script>"}               │  │
  │  │  </script>                                        │  │
  │  │                                                  │  │
  │  │  → </script> trong JSON ĐÓNG script tag!        │  │
  │  │  → Hacker inject script MỚI!                    │  │
  │  │                                                  │  │
  │  │  FIX: Escape < trong JSON:                       │  │
  │  │  JSON.stringify(data)                            │  │
  │  │    .replace(/</g, '\\u003c')                    │  │
  │  │    .replace(/>/g, '\\u003e')                    │  │
  │  └──────────────────────────────────────────────────┘  │
  │                                                        │
  │  ④ React Ref + DOM Manipulation:                        │
  │  ┌──────────────────────────────────────────────────┐  │
  │  │  function Bad() {                                 │  │
  │  │    const ref = useRef();                          │  │
  │  │    useEffect(() => {                              │  │
  │  │      // ❌ Bypass React hoàn toàn!               │  │
  │  │      ref.current.innerHTML = userInput;          │  │
  │  │    });                                            │  │
  │  │    return <div ref={ref} />;                      │  │
  │  │  }                                                │  │
  │  │                                                  │  │
  │  │  FIX: KHÔNG dùng innerHTML qua ref!             │  │
  │  └──────────────────────────────────────────────────┘  │
  │                                                        │
  │  ⑤ Props Spreading từ User Input:                       │
  │  ┌──────────────────────────────────────────────────┐  │
  │  │  // ❌ Spread props từ user → nguy hiểm!        │  │
  │  │  <div {...userControlledProps} />                 │  │
  │  │                                                  │  │
  │  │  // User có thể set:                              │  │
  │  │  userControlledProps = {                          │  │
  │  │    dangerouslySetInnerHTML: {                     │  │
  │  │      __html: '<script>alert(1)</script>'         │  │
  │  │    }                                              │  │
  │  │  }                                                │  │
  │  │                                                  │  │
  │  │  FIX: Whitelist props trước khi spread!          │  │
  │  └──────────────────────────────────────────────────┘  │
  │                                                        │
  └────────────────────────────────────────────────────────┘
```

---

## §9. Tự Viết — React XSS Validator!

```javascript
// ═══════════════════════════════════════════════════════════
// REACT XSS VALIDATOR — KIỂM TRA COMPONENT CÓ AN TOÀN!
// ═══════════════════════════════════════════════════════════

function ReactXSSValidator() {
  var issues = [];

  // ① Kiểm tra dangerouslySetInnerHTML:
  function checkDangerousHTML(componentCode) {
    if (componentCode.indexOf("dangerouslySetInnerHTML") !== -1) {
      // Có dangerouslySetInnerHTML → kiểm tra có sanitize:
      if (
        componentCode.indexOf("sanitize") === -1 &&
        componentCode.indexOf("DOMPurify") === -1 &&
        componentCode.indexOf("cleanHtml") === -1
      ) {
        issues.push({
          severity: "CRITICAL",
          rule: "no-unsanitized-html",
          message: "dangerouslySetInnerHTML KHÔNG có sanitizer!",
          fix: "Thêm sanitize() trước khi gán __html!",
        });
      } else {
        issues.push({
          severity: "WARNING",
          rule: "verify-sanitizer",
          message: "Có sanitizer — xác nhận whitelist đúng!",
          fix: "Kiểm tra sanitizer có chặn script, onerror!",
        });
      }
    }
  }

  // ② Kiểm tra href XSS:
  function checkHrefXSS(componentCode) {
    var hrefRegex = /href\s*=\s*\{[^}]*\}/g;
    var match = hrefRegex.exec(componentCode);
    if (match) {
      if (
        componentCode.indexOf("safeUrl") === -1 &&
        componentCode.indexOf("validateUrl") === -1 &&
        componentCode.indexOf("javascript:") === -1
      ) {
        issues.push({
          severity: "HIGH",
          rule: "no-unsafe-href",
          message: "href dùng biến → cần validate URL!",
          fix: "Kiểm tra protocol: chặn javascript:, data:!",
        });
      }
    }
  }

  // ③ Kiểm tra innerHTML qua ref:
  function checkRefInnerHTML(componentCode) {
    if (
      componentCode.indexOf(".innerHTML") !== -1 &&
      componentCode.indexOf("ref") !== -1
    ) {
      issues.push({
        severity: "CRITICAL",
        rule: "no-ref-innerhtml",
        message: "innerHTML dùng qua ref → bypass React!",
        fix: "Dùng textContent hoặc React state!",
      });
    }
  }

  // ④ Kiểm tra spread tất cả props:
  function checkPropsSpreading(componentCode) {
    var spreadRegex = /\{\s*\.\.\.(?!(?:style|className))[\w]+\s*\}/;
    if (spreadRegex.test(componentCode)) {
      issues.push({
        severity: "MEDIUM",
        rule: "no-unfiltered-spread",
        message: "Spread props → có thể inject nguy hiểm!",
        fix: "Whitelist props trước khi spread!",
      });
    }
  }

  return {
    validate: function (code) {
      issues = [];
      checkDangerousHTML(code);
      checkHrefXSS(code);
      checkRefInnerHTML(code);
      checkPropsSpreading(code);

      console.log("=== REACT XSS AUDIT REPORT ===");
      if (issues.length === 0) {
        console.log("✅ Không tìm thấy vấn đề XSS!");
      }
      for (var i = 0; i < issues.length; i++) {
        var issue = issues[i];
        var icon =
          issue.severity === "CRITICAL"
            ? "🚨"
            : issue.severity === "HIGH"
              ? "❌"
              : issue.severity === "MEDIUM"
                ? "⚠"
                : "ℹ";
        console.log(icon + " [" + issue.severity + "] " + issue.message);
        console.log("  Fix: " + issue.fix);
      }
      return issues;
    },
  };
}

// THỬ NGHIỆM:
var validator = ReactXSSValidator();

// Component NGUY HIỂM:
validator.validate(`
    function Comment({ html }) {
        return <div dangerouslySetInnerHTML={{ __html: html }} />;
    }
`);
// 🚨 [CRITICAL] dangerouslySetInnerHTML KHÔNG có sanitizer!

// Component AN TOÀN:
validator.validate(`
    function Comment({ html }) {
        var clean = sanitize(html);
        return <div dangerouslySetInnerHTML={{ __html: clean }} />;
    }
`);
// ⚠ [WARNING] Có sanitizer — xác nhận whitelist đúng!
```

---

## §10. Tổng Kết & Câu Hỏi Phỏng Vấn!

### 10.1. Sơ Đồ Tổng Hợp!

```
  REACT XSS PROTECTION — TOÀN BỘ CƠ CHẾ:
  ┌────────────────────────────────────────────────────────┐
  │                                                        │
  │  LỚP 1: JSX COMPILATION                                │
  │  ┌──────────────────────────────────────────────────┐  │
  │  │  JSX → React.createElement() → Plain Object     │  │
  │  │  → User input LUÔN là string trong props!       │  │
  │  │  → KHÔNG BAO GIỜ được parse thành HTML!         │  │
  │  └──────────────────────────────────────────────────┘  │
  │                    ↓                                   │
  │  LỚP 2: $$typeof SYMBOL                                │
  │  ┌──────────────────────────────────────────────────┐  │
  │  │  React Element có $$typeof = Symbol              │  │
  │  │  → JSON KHÔNG tạo được Symbol!                  │  │
  │  │  → Chống JSON injection giả mạo Element!        │  │
  │  └──────────────────────────────────────────────────┘  │
  │                    ↓                                   │
  │  LỚP 3: DOM RENDERING                                  │
  │  ┌──────────────────────────────────────────────────┐  │
  │  │  CSR: createTextNode() / textContent            │  │
  │  │  → String → Text Node → KHÔNG parse HTML!      │  │
  │  │  SSR: escapeHtml()                              │  │
  │  │  → < > & " ' → HTML entities!                  │  │
  │  └──────────────────────────────────────────────────┘  │
  │                                                        │
  │  LỖ HỔNG CÒN LẠI:                                     │
  │  ┌──────────────────────────────────────────────────┐  │
  │  │  dangerouslySetInnerHTML → SANITIZE!            │  │
  │  │  href="javascript:"    → VALIDATE URL!          │  │
  │  │  ref.innerHTML          → KHÔNG DÙNG!           │  │
  │  │  SSR JSON               → ESCAPE </>!           │  │
  │  │  Props spread           → WHITELIST!            │  │
  │  └──────────────────────────────────────────────────┘  │
  │                                                        │
  └────────────────────────────────────────────────────────┘
```

### 10.2. Câu Hỏi Phỏng Vấn!

**Q1: React bảo vệ khỏi XSS bằng cách nào?**

> React dùng 3 lớp bảo vệ: (1) JSX compile thành createElement() — user input là string trong props, không bao giờ parse thành HTML. (2) $$typeof Symbol — chống JSON injection giả mạo React Element. (3) Khi render, string children dùng createTextNode()/textContent (CSR) hoặc escapeHtml() (SSR) — không dùng innerHTML.

**Q2: Tại sao React dùng textContent thay vì innerHTML?**

> textContent tạo Text Node (nodeType 3) — browser KHÔNG parse nội dung thành HTML. innerHTML tạo Element Node (nodeType 1) — browser PARSE nội dung thành DOM tree, có thể chạy script. React chỉ dùng innerHTML khi developer CỐ Ý dùng dangerouslySetInnerHTML.

**Q3: $$typeof là gì? Tại sao dùng Symbol?**

> $$typeof là property trên React Element object, có giá trị Symbol.for('react.element'). React kiểm tra $$typeof trước khi render. Dùng Symbol vì JSON.parse() KHÔNG tạo được Symbol — hacker không thể giả mạo React Element qua JSON API response.

**Q4: dangerouslySetInnerHTML nguy hiểm như thế nào?**

> Nó chèn HTML thô vào DOM bằng innerHTML, bỏ qua toàn bộ auto-escaping. React cố ý đặt tên dài và đáng sợ để cảnh báo. Nếu dùng mà không sanitize input → XSS. FIX: Luôn sanitize bằng whitelist approach trước khi gán \_\_html.

**Q5: href="javascript:" trong React có bị chặn không?**

> KHÔNG! React escape giá trị attribute nhưng browser vẫn hiểu javascript: protocol. Khi user click, JavaScript CHẠY. FIX: Validate URL — chỉ cho phép http://, https://, hoặc relative path. Chặn javascript:, data:, vbscript:.

**Q6: Khi nào React KHÔNG bảo vệ được?**

> 5 trường hợp: (1) dangerouslySetInnerHTML không sanitize, (2) href/src dùng javascript: URL, (3) ref.current.innerHTML bypass React, (4) SSR serialize JSON chứa \</script\>, (5) Spread tất cả user-controlled props.

---

> **📌 CỐT LÕI**: React bảo vệ XSS bằng cách **KHÔNG BAO GIỜ dùng innerHTML cho user input**!
> String → createTextNode() → Text Node → Browser KHÔNG parse HTML!
> Đây là nguyên lý đơn giản nhưng CỰC KỲ hiệu quả!
