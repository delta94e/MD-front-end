# Cross-Site Request Forgery (CSRF) — Deep Dive!

> **Chủ đề**: What is CSRF, and why is it a concern for web applications?
> **Ngôn ngữ**: Tiếng Việt — giải thích cực kỳ chi tiết!
> **Phương châm**: Tự viết lại bằng tay — KHÔNG dùng thư viện!

---

## Mục Lục

1. [§1. CSRF Là Gì? — Định Nghĩa & Cơ Chế!](#1)
2. [§2. Bên Trong Browser — Tại Sao CSRF Có Thể Xảy Ra?](#2)
3. [§3. Tự Viết — Demo Các Cuộc Tấn Công CSRF!](#3)
4. [§4. CSRF vs XSS — Khác Nhau Thế Nào?](#4)
5. [§5. Tự Viết — 5 Phương Pháp Phòng Chống CSRF!](#5)
6. [§6. Tự Viết — CSRF Token System Hoàn Chỉnh!](#6)
7. [§7. SameSite Cookie — Giải Pháp Hiện Đại!](#7)
8. [§8. React & CSRF — Ảnh Hưởng Cụ Thể!](#8)
9. [§9. Tổng Kết & Câu Hỏi Phỏng Vấn!](#9)

---

## §1. CSRF Là Gì? — Định Nghĩa & Cơ Chế!

### 1.1. Định Nghĩa!

```
  CSRF — CROSS-SITE REQUEST FORGERY:
  ┌────────────────────────────────────────────────────────┐
  │                                                        │
  │  CSRF = "Giả mạo yêu cầu xuyên trang"                │
  │                                                        │
  │  ĐỊNH NGHĨA:                                          │
  │  ┌──────────────────────────────────────────────────┐  │
  │  │                                                  │  │
  │  │  CSRF là cuộc tấn công LỪA BROWSER của user      │  │
  │  │  gửi request ĐẾN SERVER MÀ USER ĐÃ ĐĂNG NHẬP,  │  │
  │  │  MÀ USER KHÔNG HỀ BIẾT!                          │  │
  │  │                                                  │  │
  │  │  Hacker KHÔNG cần biết password!                  │  │
  │  │  Hacker KHÔNG cần đánh cắp cookie!                │  │
  │  │  Hacker CHỈ CẦN lừa user click 1 link!           │  │
  │  │  → Browser TỰ ĐỘNG gắn cookies vào request!     │  │
  │  │  → Server KHÔNG phân biệt được request thật/giả!│  │
  │  │                                                  │  │
  │  └──────────────────────────────────────────────────┘  │
  │                                                        │
  │  TÊN GỌI KHÁC:                                        │
  │  → XSRF (Cross-Site Request Forgery)                  │
  │  → "Session Riding"                                   │
  │  → "One-Click Attack"                                 │
  │  → "Sea Surf" 🌊                                      │
  │                                                        │
  └────────────────────────────────────────────────────────┘
```

### 1.2. Cơ Chế Tấn Công — Từng Bước!

```
  CSRF — CƠ CHẾ TẤN CÔNG:
  ┌────────────────────────────────────────────────────────┐
  │                                                        │
  │  BƯỚC 1: User đăng nhập vào bank.com                  │
  │  ┌──────────┐         ┌──────────┐                    │
  │  │ Browser  │──Login──→│ bank.com │                    │
  │  │          │←─Cookie──│ Server   │                    │
  │  │ Cookie:  │          │          │                    │
  │  │ session= │          └──────────┘                    │
  │  │ abc123   │                                          │
  │  └──────────┘                                          │
  │  → Browser LƯU cookie session=abc123!                  │
  │                                                        │
  │  BƯỚC 2: User lướt web, vào trang evil.com             │
  │  ┌──────────┐         ┌──────────┐                    │
  │  │ Browser  │──Visit──→│ evil.com │                    │
  │  │          │←─HTML────│ ← Hacker │                    │
  │  └──────────┘          └──────────┘                    │
  │  → Trang evil.com chứa form/img ẩn!                   │
  │                                                        │
  │  BƯỚC 3: evil.com TỰ ĐỘNG gửi request đến bank.com!  │
  │  ┌──────────┐                      ┌──────────┐       │
  │  │ Browser  │──POST /transfer─────→│ bank.com │       │
  │  │          │  Cookie: session=    │ Server   │       │
  │  │          │  abc123 (TỰ ĐỘNG!)   │          │       │
  │  │          │  body: to=hacker&    │ "Hmm,    │       │
  │  │          │  amount=10000        │ cookie   │       │
  │  └──────────┘                      │ valid!   │       │
  │                                    │ → Chuyển │       │
  │                                    │   tiền!" │       │
  │                                    └──────────┘       │
  │                                                        │
  │  ⚠️ ĐIỂM MẤU CHỐT:                                    │
  │  → Browser TỰ ĐỘNG gắn cookies vào MỌI request       │
  │    đến bank.com, BẤT KỂ request từ đâu!               │
  │  → Server KHÔNG BIẾT request từ bank.com hay evil.com!│
  │  → Server chỉ thấy: "Cookie valid → OK!"             │
  │                                                        │
  └────────────────────────────────────────────────────────┘
```

---

## §2. Bên Trong Browser — Tại Sao CSRF Có Thể Xảy Ra?

```
  TẠI SAO CSRF CÓ THỂ XẢY RA?
  ┌────────────────────────────────────────────────────────┐
  │                                                        │
  │  GỐC RỄ: COOKIES TỰ ĐỘNG GẮN VÀO REQUEST!            │
  │                                                        │
  │  ① Same-Origin Policy (SOP) KHÔNG chặn requests:      │
  │  ┌──────────────────────────────────────────────────┐  │
  │  │  SOP chặn: evil.com ĐỌC response từ bank.com!  │  │
  │  │  SOP KHÔNG chặn: evil.com GỬI request ĐẾN       │  │
  │  │                   bank.com!                     │  │
  │  │                                                  │  │
  │  │  → evil.com KHÔNG ĐỌC được response             │  │
  │  │  → NHƯNG request VẪN ĐƯỢC GỬI!                  │  │
  │  │  → VÀ server VẪN XỬ LÝ request đó!             │  │
  │  │                                                  │  │
  │  │  Tức là: Hacker không biết kết quả,              │  │
  │  │  NHƯNG hành động ĐÃ ĐƯỢC THỰC HIỆN!             │  │
  │  └──────────────────────────────────────────────────┘  │
  │                                                        │
  │  ② Browser TỰ ĐỘNG gắn cookies:                       │
  │  ┌──────────────────────────────────────────────────┐  │
  │  │  Khi browser gửi request đến domain X,           │  │
  │  │  NÓ TỰ ĐỘNG gắn TẤT CẢ cookies của domain X!  │  │
  │  │                                                  │  │
  │  │  → Không quan trọng request xuất phát từ đâu!   │  │
  │  │  → bank.com page → request bank.com → có cookie │  │
  │  │  → evil.com page → request bank.com → CÓ COOKIE!│  │
  │  │                                                  │  │
  │  │  ĐÂY LÀ BEHAVIOR MẶC ĐỊNH CỦA BROWSER!         │  │
  │  └──────────────────────────────────────────────────┘  │
  │                                                        │
  │  ③ Các loại request TỰ ĐỘNG gửi được:                 │
  │  ┌──────────────────────────────────────────────────┐  │
  │  │  GET:                                            │  │
  │  │  → <img src="https://bank.com/transfer?...">    │  │
  │  │  → <script src="https://bank.com/...">          │  │
  │  │  → <link href="https://bank.com/...">           │  │
  │  │  → window.location redirect                     │  │
  │  │                                                  │  │
  │  │  POST:                                           │  │
  │  │  → <form action="https://bank.com/transfer"     │  │
  │  │         method="POST">                          │  │
  │  │    <input name="to" value="hacker">             │  │
  │  │    <input name="amount" value="10000">          │  │
  │  │    </form>                                      │  │
  │  │  → form.submit() tự động!                       │  │
  │  └──────────────────────────────────────────────────┘  │
  │                                                        │
  └────────────────────────────────────────────────────────┘
```

```javascript
// ═══════════════════════════════════════════════════════════
// TỰ VIẾT — MÔ PHỎNG BROWSER COOKIE BEHAVIOR:
// ═══════════════════════════════════════════════════════════

function BrowserCookieSimulation() {
  // Cookie jar — browser lưu cookies theo domain:
  var _cookieJar = {};
  // {
  //   'bank.com': [
  //     { name: 'session', value: 'abc123',
  //       httpOnly: true, secure: true, sameSite: 'None' }
  //   ],
  //   'myapp.com': [...]
  // }

  function setCookie(domain, cookie) {
    if (!_cookieJar[domain]) _cookieJar[domain] = [];
    _cookieJar[domain].push(cookie);
  }

  // QUAN TRỌNG — Khi gửi request:
  function sendRequest(fromOrigin, toURL, method) {
    var toDomain = extractDomain(toURL);

    // Browser TỰ ĐỘNG gắn cookies của toDomain:
    var cookies = _cookieJar[toDomain] || [];

    // Lọc theo SameSite:
    var attachedCookies = cookies.filter(function (cookie) {
      var isCrossOrigin = fromOrigin !== toDomain;

      if (!isCrossOrigin) {
        return true; // Same-origin → luôn gắn!
      }

      // Cross-origin — kiểm tra SameSite:
      switch (cookie.sameSite) {
        case "Strict":
          return false; // KHÔNG gắn cross-origin!
        case "Lax":
          // Chỉ gắn cho top-level GET navigation:
          return method === "GET" && isTopLevelNavigation();
        case "None":
          return cookie.secure; // Gắn nếu Secure!
        default:
          return true; // No SameSite → gắn! (NGUY HIỂM!)
      }
    });

    return {
      url: toURL,
      method: method,
      fromOrigin: fromOrigin,
      cookies: attachedCookies,
      // → Server nhận request + cookies
      // → KHÔNG BIẾT request từ đâu!
    };
  }

  function extractDomain(url) {
    return url.split("/")[2]; // Simplified
  }

  function isTopLevelNavigation() {
    return true; // Simplified
  }

  return {
    setCookie: setCookie,
    sendRequest: sendRequest,
  };
}

// DEMO:
// var browser = BrowserCookieSimulation();
// browser.setCookie('bank.com', {
//     name: 'session', value: 'abc123',
//     sameSite: 'None', secure: true
// });
//
// // Request từ bank.com → bank.com (bình thường):
// browser.sendRequest('bank.com', 'https://bank.com/api', 'POST');
// → cookies: [{ name:'session', value:'abc123' }] ✅
//
// // Request từ evil.com → bank.com (CSRF!):
// browser.sendRequest('evil.com', 'https://bank.com/api', 'POST');
// → cookies: [{ name:'session', value:'abc123' }] ← CŨNG CÓ!
// → Server KHÔNG phân biệt được!
```

---

## §3. Tự Viết — Demo Các Cuộc Tấn Công CSRF!

```javascript
// ═══════════════════════════════════════════════════════════
// ATTACK #1: CSRF QUA HIDDEN FORM (POST)
// ═══════════════════════════════════════════════════════════

// Trang evil.com chứa HTML sau:
var attack1_html =
  "" +
  "<html>" +
  "<body>" +
  "  <h1>Bạn đã trúng thưởng iPhone! ✨</h1>" +
  "  <p>Click nút để nhận thưởng:</p>" +
  "  <!-- FORM ẨN — user KHÔNG thấy! -->" +
  '  <form id="csrf-form" method="POST"' +
  '    action="https://bank.com/api/transfer"' +
  '    style="display:none">' +
  '    <input name="recipient" value="hacker_account">' +
  '    <input name="amount" value="50000000">' +
  '    <input name="currency" value="VND">' +
  "  </form>" +
  "  <button onclick=\"document.getElementById('csrf-form').submit()\">" +
  "    🎁 Nhận Thưởng" +
  "  </button>" +
  "  <!-- HOẶC auto-submit không cần click: -->" +
  "  <script>" +
  '    document.getElementById("csrf-form").submit();' +
  "  </script>" +
  "</body>" +
  "</html>";
// User mở trang evil.com:
// → Form tự submit → POST đến bank.com/api/transfer
// → Browser gắn session cookie của bank.com!
// → Server nhận: session valid + transfer request → THỰC HIỆN!
// → 50 triệu chuyển đến hacker!

// ═══════════════════════════════════════════════════════════
// ATTACK #2: CSRF QUA IMG TAG (GET)
// ═══════════════════════════════════════════════════════════

var attack2_html =
  "" +
  "<html>" +
  "<body>" +
  "  <h1>Đọc tin nóng!</h1>" +
  "  <!-- IMG tag gửi GET request: -->" +
  '  <img src="https://bank.com/api/transfer' +
  '    ?to=hacker&amount=1000000"' +
  '    width="0" height="0"' +
  '    style="display:none">' +
  "  <!-- User KHÔNG thấy img! -->" +
  "  <!-- Browser TỰ ĐỘNG load img = gửi GET! -->" +
  "  <!-- Cookies bank.com gắn theo! -->" +
  "</body>" +
  "</html>";
// ⚠️ Đây là lý do: API endpoints thay đổi state
//    KHÔNG BAO GIỜ nên dùng GET!
//    GET chỉ cho đọc data!

// ═══════════════════════════════════════════════════════════
// ATTACK #3: CSRF QUA AJAX (nếu CORS cho phép)
// ═══════════════════════════════════════════════════════════

var attack3_code = function () {
  // Từ evil.com, gọi AJAX đến bank.com:
  var xhr = new XMLHttpRequest();
  xhr.open("POST", "https://bank.com/api/transfer");
  xhr.withCredentials = true; // Gửi cookies!
  xhr.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
  xhr.send("to=hacker&amount=1000000");
  // ⚠️ CHỈ hoạt động NẾU bank.com set:
  // Access-Control-Allow-Origin: https://evil.com
  // Access-Control-Allow-Credentials: true
  // → Nếu CORS config SAI → attack thành công!
};

// ═══════════════════════════════════════════════════════════
// ATTACK #4: CSRF QUA LINK (social engineering)
// ═══════════════════════════════════════════════════════════

var attack4 =
  "" +
  "<!-- Email hoặc chat gửi link: -->" +
  '<a href="https://bank.com/api/password/change' +
  '  ?new_password=hacker_owns_you">' +
  "  Click xem ảnh mèo dễ thương! 🐱" +
  "</a>" +
  "<!-- User click → GET request → đổi password! -->";

// ═══════════════════════════════════════════════════════════
// ATTACK #5: CSRF QUA IFRAME ẨN
// ═══════════════════════════════════════════════════════════

var attack5_html =
  "" +
  "<html><body>" +
  "  <h1>Trang tin tức bình thường</h1>" +
  '  <iframe name="csrf-frame" style="display:none"></iframe>' +
  '  <form method="POST"' +
  '    action="https://bank.com/api/email/change"' +
  '    target="csrf-frame">' +
  '    <input name="new_email" value="hacker@evil.com">' +
  "  </form>" +
  "  <script>" +
  "    document.forms[0].submit();" +
  "  </script>" +
  "  <!-- Submit form vào iframe ẩn -->" +
  "  <!-- User KHÔNG bị redirect! -->" +
  "  <!-- KHÔNG biết gì đã xảy ra! -->" +
  "</body></html>";
```

---

## §4. CSRF vs XSS — Khác Nhau Thế Nào?

```
  CSRF vs XSS — SO SÁNH:
  ┌────────────────────────────────────────────────────────┐
  │                                                        │
  │              CSRF                    XSS               │
  │  ──────────────────────────────────────────────────    │
  │  Mục tiêu:  Lừa BROWSER gửi      Inject SCRIPT       │
  │             request giả mạo       vào trang web       │
  │                                                        │
  │  Lợi dụng:  Browser TỰ ĐỘNG      App KHÔNG            │
  │             gắn cookies           sanitize input       │
  │                                                        │
  │  Hacker:    KHÔNG cần chạy        CHẠY JavaScript     │
  │             JS trên trang nạn     trên trang nạn      │
  │             nhân                  nhân                │
  │                                                        │
  │  Cần user:  Đã đăng nhập         Chỉ cần visit       │
  │             vào target site       trang bị XSS        │
  │                                                        │
  │  Đọc data:  ❌ KHÔNG đọc được     ✅ ĐỌC ĐƯỢC         │
  │             response              cookies, DOM...     │
  │                                                        │
  │  Hành động: Thực hiện ACTION      Mọi thứ JS          │
  │             (transfer, change     có thể làm!         │
  │             password...)                               │
  │                                                        │
  │  Phòng      CSRF Token,          Input sanitize,      │
  │  chống:     SameSite Cookie,     CSP, HttpOnly        │
  │             Origin check          Cookie               │
  │                                                        │
  │  ┌──────────────────────────────────────────────────┐  │
  │  │  TƯƠNG QUAN:                                     │  │
  │  │  → XSS có thể BYPASS mọi phòng chống CSRF!     │  │
  │  │  → Vì XSS chạy JS → đọc CSRF token → gửi kèm! │  │
  │  │  → Nên phải phòng cả XSS VÀ CSRF!              │  │
  │  └──────────────────────────────────────────────────┘  │
  │                                                        │
  │                                                        │
  │  VÍ DỤ PHÂN BIỆT:                                     │
  │  ┌──────────────────────────────────────────────────┐  │
  │  │                                                  │  │
  │  │  CSRF:                                           │  │
  │  │  evil.com → lừa browser gửi                      │  │
  │  │  POST bank.com/transfer {to:hacker}              │  │
  │  │  → Hacker KHÔNG đọc được response!              │  │
  │  │  → Nhưng tiền ĐÃ CHUYỂN!                        │  │
  │  │                                                  │  │
  │  │  XSS:                                            │  │
  │  │  bank.com bị inject <script>                     │  │
  │  │  → Script ĐỌC cookie, DOM, localStorage         │  │
  │  │  → Script GỬI data về hacker                    │  │
  │  │  → Script GỌI API thay user                     │  │
  │  │                                                  │  │
  │  └──────────────────────────────────────────────────┘  │
  │                                                        │
  └────────────────────────────────────────────────────────┘
```

---

## §5. Tự Viết — 5 Phương Pháp Phòng Chống CSRF!

### Phương Pháp 1: CSRF Token (Synchronizer Token Pattern)!

```
  CSRF TOKEN — CÁCH HOẠT ĐỘNG:
  ┌────────────────────────────────────────────────────────┐
  │                                                        │
  │  ① Server tạo token NGẪU NHIÊN cho mỗi session:      │
  │  ┌──────────────────────────────────────────────────┐  │
  │  │  Token: "a7f3b2c9-e1d4-4k8m-9n2p-5q7r8s0t1u"   │  │
  │  │  → Random, unique, không đoán được!              │  │
  │  │  → Lưu trong server session!                    │  │
  │  └──────────────────────────────────────────────────┘  │
  │                                                        │
  │  ② Server gửi token cho React app:                    │
  │  → Trong HTML: <meta name="csrf-token" content="...">│
  │  → Hoặc trong cookie (non-HttpOnly để JS đọc)        │
  │  → Hoặc trong API response                           │
  │                                                        │
  │  ③ React gửi token trong MỌI request:                │
  │  ┌──────────────────────────────────────────────────┐  │
  │  │  POST /api/transfer                              │  │
  │  │  Header: X-CSRF-Token: a7f3b2c9...               │  │
  │  │  Cookie: session=abc123 (tự động)                │  │
  │  │  Body: { to: "friend", amount: 100 }             │  │
  │  └──────────────────────────────────────────────────┘  │
  │                                                        │
  │  ④ Server VERIFY token:                               │
  │  → Token trong header == token trong session?         │
  │  → YES → xử lý request!                              │
  │  → NO → REJECT! 403 Forbidden!                       │
  │                                                        │
  │  ⚠️ TẠI SAO HACKER KHÔNG GỬI ĐƯỢC TOKEN?              │
  │  → Hacker KHÔNG BIẾT token (random, unique)!          │
  │  → evil.com KHÔNG ĐỌC ĐƯỢC response từ bank.com     │
  │    (Same-Origin Policy chặn!)                         │
  │  → Hacker chỉ gửi được form/img → KHÔNG gắn         │
  │    custom header được!                                │
  │                                                        │
  └────────────────────────────────────────────────────────┘
```

### Phương Pháp 2: Double Submit Cookie!

```javascript
// ═══════════════════════════════════════════════════════════
// DOUBLE SUBMIT COOKIE — TỰ VIẾT!
// ═══════════════════════════════════════════════════════════

// Concept:
// → Server set 1 cookie CSRF (non-HttpOnly)
// → Client đọc cookie → gửi LẠI trong header/body
// → Server so sánh: cookie == header?
// → Hacker KHÔNG đọc được cookie (SOP) → không gửi đúng!

// SERVER SIDE:
function setCSRFCookie(res) {
  var csrfToken = generateRandomToken();
  res.cookie("csrf_token", csrfToken, {
    httpOnly: false, // JS PHẢI đọc được!
    secure: true,
    sameSite: "Lax",
    path: "/",
  });
}

// CLIENT SIDE (React):
function getCSRFFromCookie() {
  var cookies = document.cookie.split(";");
  for (var i = 0; i < cookies.length; i++) {
    var cookie = cookies[i].trim();
    if (cookie.indexOf("csrf_token=") === 0) {
      return cookie.substring("csrf_token=".length);
    }
  }
  return null;
}

// Gắn vào MỌI request:
function csrfFetch(url, options) {
  options = options || {};
  options.headers = options.headers || {};
  options.headers["X-CSRF-Token"] = getCSRFFromCookie();
  options.credentials = "include";
  return fetch(url, options);
}

// SERVER VERIFY:
function verifyDoubleSubmit(req) {
  var cookieToken = req.cookies["csrf_token"];
  var headerToken = req.headers["x-csrf-token"];
  return cookieToken && headerToken && cookieToken === headerToken;
}
// → Hacker evil.com:
// → Cookie csrf_token GỬI ĐƯỢC (browser auto-attach)
// → NHƯNG header X-CSRF-Token → KHÔNG BIẾT giá trị!
// → Vì evil.com KHÔNG đọc được cookie của bank.com!
```

### Phương Pháp 3: Origin/Referer Header Check!

```javascript
// ═══════════════════════════════════════════════════════════
// ORIGIN / REFERER CHECK — TỰ VIẾT!
// ═══════════════════════════════════════════════════════════

// Browser tự thêm Origin/Referer header vào requests:
// → Origin: https://evil.com  (nếu request từ evil.com)
// → Origin: https://bank.com  (nếu request từ bank.com)
// → Hacker KHÔNG THỂ giả mạo header này!

function checkOrigin(req) {
  var allowedOrigins = ["https://myapp.com", "https://www.myapp.com"];

  // Kiểm tra Origin header (preferred):
  var origin = req.headers["origin"];
  if (origin) {
    return allowedOrigins.indexOf(origin) !== -1;
  }

  // Fallback: kiểm tra Referer header:
  var referer = req.headers["referer"];
  if (referer) {
    for (var i = 0; i < allowedOrigins.length; i++) {
      if (referer.indexOf(allowedOrigins[i]) === 0) {
        return true;
      }
    }
    return false;
  }

  // Không có Origin lẫn Referer → REJECT!
  // (Có thể do privacy settings strip headers)
  return false;
}

// ⚠️ GIỚI HẠN:
// → Một số browser/proxy strip Referer header
// → Không nên dùng LÀM DUY NHẤT → kết hợp CSRF token!
```

### Phương Pháp 4: Custom Request Headers!

```javascript
// ═══════════════════════════════════════════════════════════
// CUSTOM HEADERS — TỰ VIẾT!
// ═══════════════════════════════════════════════════════════

// Simple form submissions và <img> tags KHÔNG thể
// set CUSTOM HEADERS!
// → Chỉ JavaScript (fetch/XMLHttpRequest) mới set được!
// → VÀ bị CORS chặn cross-origin!

// Khi dùng JSON API với custom header:
function secureAPICall(url, data) {
  return fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Requested-With": "XMLHttpRequest",
      // ↑ Custom header này:
      // → Form submit KHÔNG gửi được!
      // → Cross-origin AJAX bị CORS chặn!
      // → Chỉ same-origin JS mới gửi được!
    },
    credentials: "include",
    body: JSON.stringify(data),
  });
}

// SERVER: Kiểm tra custom header:
function requireCustomHeader(req) {
  // Nếu có header X-Requested-With → chắc chắn từ JS!
  // → Form attack KHÔNG có header này!
  return req.headers["x-requested-with"] === "XMLHttpRequest";
}

// ⚠️ CHÚ Ý:
// → Nếu server set Access-Control-Allow-Headers sai
//   → Cross-origin JS CÓ THỂ gửi custom header!
// → Nên kết hợp với CSRF token!
```

### Phương Pháp 5: SameSite Cookie!

```javascript
// ═══════════════════════════════════════════════════════════
// SAMESITE COOKIE — GIẢI PHÁP HIỆN ĐẠI!
// (Chi tiết ở §7)
// ═══════════════════════════════════════════════════════════

// Server set cookie:
// Set-Cookie: session=abc123; SameSite=Strict; Secure; HttpOnly

// SameSite=Strict:
// → Cookie CHỈ gửi khi request từ CÙNG SITE!
// → evil.com → request bank.com → KHÔNG CÓ COOKIE!
// → CSRF bị chặn hoàn toàn!

// SameSite=Lax (default trong Chrome):
// → Cookie gửi cho top-level GET navigation
// → KHÔNG gửi cho cross-origin POST, iframe, AJAX
// → Chặn hầu hết CSRF nhưng cho phép link click!

// SameSite=None; Secure:
// → Cookie gửi cho MỌI request (kể cả cross-origin)
// → KHÔNG chống CSRF!
// → Chỉ dùng khi thực sự cần cross-site cookies!
```

---

## §6. Tự Viết — CSRF Token System Hoàn Chỉnh!

```javascript
// ═══════════════════════════════════════════════════════════
// CSRF TOKEN SYSTEM — TỰ VIẾT HOÀN CHỈNH!
// ═══════════════════════════════════════════════════════════

// ═══ SERVER SIDE: ═══

var CSRFTokenManager = (function () {
  var _tokens = {}; // sessionId → token

  // Tạo token ngẫu nhiên:
  function generateToken() {
    var array = new Uint8Array(32);
    // Trong browser: crypto.getRandomValues(array)
    // Demo: simple random:
    for (var i = 0; i < 32; i++) {
      array[i] = Math.floor(Math.random() * 256);
    }
    // Convert to hex string:
    var token = "";
    for (var j = 0; j < array.length; j++) {
      token += ("0" + array[j].toString(16)).slice(-2);
    }
    return token;
  }

  // Tạo và lưu token cho session:
  function createToken(sessionId) {
    var token = generateToken();
    _tokens[sessionId] = {
      value: token,
      createdAt: Date.now(),
      // Token hết hạn sau 1 giờ:
      expiresAt: Date.now() + 3600000,
    };
    return token;
  }

  // Verify token:
  function verifyToken(sessionId, submittedToken) {
    var stored = _tokens[sessionId];
    if (!stored) return false;

    // Kiểm tra hết hạn:
    if (Date.now() > stored.expiresAt) {
      delete _tokens[sessionId];
      return false;
    }

    // Timing-safe comparison (chống timing attack):
    return timingSafeEqual(stored.value, submittedToken);
  }

  // ⚠️ QUAN TRỌNG: Timing-safe string comparison!
  // Normal === comparison: return NGAY khi ký tự sai
  // → Hacker đo thời gian → đoán từng ký tự!
  function timingSafeEqual(a, b) {
    if (a.length !== b.length) return false;
    var result = 0;
    for (var i = 0; i < a.length; i++) {
      // XOR tất cả → nếu có bất kỳ khác biệt nào
      // → result !== 0 → return false
      // → Luôn duyệt TOÀN BỘ string!
      result |= a.charCodeAt(i) ^ b.charCodeAt(i);
    }
    return result === 0;
  }

  // Rotate token (tạo mới sau mỗi request):
  function rotateToken(sessionId) {
    return createToken(sessionId);
  }

  return {
    createToken: createToken,
    verifyToken: verifyToken,
    rotateToken: rotateToken,
  };
})();

// ═══ SERVER MIDDLEWARE: ═══

function csrfMiddleware(req, res, next) {
  var sessionId = req.cookies.session;
  if (!sessionId) {
    res.status(401).json({ error: "No session" });
    return;
  }

  // GET requests — gửi token cho client:
  if (req.method === "GET") {
    var token = CSRFTokenManager.createToken(sessionId);
    // Gửi token qua cookie (client sẽ đọc):
    res.cookie("XSRF-TOKEN", token, {
      httpOnly: false, // JS phải đọc được!
      secure: true,
      sameSite: "Strict",
      path: "/",
    });
    next();
    return;
  }

  // POST/PUT/DELETE — verify token:
  var submittedToken = req.headers["x-xsrf-token"] || req.body._csrf;

  if (!CSRFTokenManager.verifyToken(sessionId, submittedToken)) {
    res.status(403).json({
      error: "Invalid CSRF token",
      message: "Request bị từ chối — có thể là CSRF attack!",
    });
    return;
  }

  // Token valid → rotate:
  var newToken = CSRFTokenManager.rotateToken(sessionId);
  res.cookie("XSRF-TOKEN", newToken, {
    httpOnly: false,
    secure: true,
    sameSite: "Strict",
  });
  next();
}

// ═══ CLIENT SIDE (React): ═══

var CSRFClient = (function () {
  function getToken() {
    var cookies = document.cookie.split(";");
    for (var i = 0; i < cookies.length; i++) {
      var cookie = cookies[i].trim();
      if (cookie.indexOf("XSRF-TOKEN=") === 0) {
        return cookie.substring("XSRF-TOKEN=".length);
      }
    }
    return "";
  }

  function csrfFetch(url, options) {
    options = options || {};
    options.method = options.method || "GET";
    options.headers = options.headers || {};
    options.credentials = "include";

    // Gắn CSRF token cho non-GET requests:
    if (options.method !== "GET") {
      options.headers["X-XSRF-Token"] = getToken();
    }

    return fetch(url, options).then(function (response) {
      if (response.status === 403) {
        // CSRF token invalid → refresh token:
        return refreshCSRFToken().then(function () {
          // Retry với token mới:
          options.headers["X-XSRF-Token"] = getToken();
          return fetch(url, options);
        });
      }
      return response;
    });
  }

  function refreshCSRFToken() {
    // GET request → server gửi token mới:
    return fetch("/api/csrf-token", {
      credentials: "include",
    });
  }

  return { csrfFetch: csrfFetch, getToken: getToken };
})();

// SỬ DỤNG:
// CSRFClient.csrfFetch('/api/transfer', {
//     method: 'POST',
//     headers: { 'Content-Type': 'application/json' },
//     body: JSON.stringify({ to: 'friend', amount: 100 })
// });
```

---

## §7. SameSite Cookie — Giải Pháp Hiện Đại!

```
  SAMESITE COOKIE — CHI TIẾT:
  ┌────────────────────────────────────────────────────────┐
  │                                                        │
  │  SameSite xác định KHI NÀO cookie được gửi:           │
  │                                                        │
  │  ① SameSite=Strict:                                    │
  │  ┌──────────────────────────────────────────────────┐  │
  │  │  Cookie CHỈ gửi khi request từ CÙNG SITE!       │  │
  │  │                                                  │  │
  │  │  ✅ bank.com page → bank.com API → CÓ cookie    │  │
  │  │  ❌ evil.com form → bank.com API → KHÔNG cookie  │  │
  │  │  ❌ google.com link → bank.com → KHÔNG cookie    │  │
  │  │                                                  │  │
  │  │  ⚠️ VẤN ĐỀ: Click link từ email/Google → trang │  │
  │  │  bank.com mở KHÔNG CÓ cookie → phải login lại! │  │
  │  │  → UX không tốt!                                │  │
  │  └──────────────────────────────────────────────────┘  │
  │                                                        │
  │  ② SameSite=Lax (DEFAULT trong Chrome!):               │
  │  ┌──────────────────────────────────────────────────┐  │
  │  │  Cookie gửi cho top-level GET navigations:       │  │
  │  │                                                  │  │
  │  │  ✅ bank.com page → bank.com API → CÓ cookie    │  │
  │  │  ✅ google.com link → bank.com page → CÓ cookie │  │
  │  │     (Top-level GET navigation!)                  │  │
  │  │  ❌ evil.com form POST → bank.com → KHÔNG cookie │  │
  │  │  ❌ evil.com iframe → bank.com → KHÔNG cookie    │  │
  │  │  ❌ evil.com AJAX → bank.com → KHÔNG cookie      │  │
  │  │  ❌ evil.com img → bank.com → KHÔNG cookie       │  │
  │  │                                                  │  │
  │  │  → Chặn hầu hết CSRF!                           │  │
  │  │  → Vẫn cho phép link click → UX tốt!            │  │
  │  └──────────────────────────────────────────────────┘  │
  │  │                                                     │
  │  ③ SameSite=None; Secure:                              │
  │  ┌──────────────────────────────────────────────────┐  │
  │  │  Cookie gửi cho MỌI request:                     │  │
  │  │                                                  │  │
  │  │  ✅ bank.com → bank.com → CÓ cookie              │  │
  │  │  ✅ evil.com → bank.com → CÓ cookie   ← NGUY!   │  │
  │  │                                                  │  │
  │  │  → KHÔNG chống CSRF!                             │  │
  │  │  → Phải BẮT BUỘC Secure flag!                   │  │
  │  │  → Dùng cho: SSO, embedded widgets, OAuth       │  │
  │  └──────────────────────────────────────────────────┘  │
  │                                                        │
  └────────────────────────────────────────────────────────┘
```

```javascript
// ═══════════════════════════════════════════════════════════
// TỰ VIẾT — SAMESITE BEHAVIOR SIMULATION:
// ═══════════════════════════════════════════════════════════

function SameSiteCookieSimulation() {
  function shouldSendCookie(cookie, requestContext) {
    var from = requestContext.fromSite;
    var to = requestContext.toSite;
    var method = requestContext.method;
    var isTopLevel = requestContext.isTopLevelNavigation;
    var isSameSite = from === to;

    switch (cookie.sameSite) {
      case "Strict":
        // CHỈ same-site:
        return isSameSite;

      case "Lax":
        if (isSameSite) return true;
        // Cross-site: CHỈ top-level GET:
        return isTopLevel && method === "GET";

      case "None":
        // Mọi request — nhưng phải Secure:
        return cookie.secure === true;

      default:
        // Không set SameSite → browser default = Lax
        if (isSameSite) return true;
        return isTopLevel && method === "GET";
    }
  }

  // TEST:
  var sessionCookie = {
    name: "session",
    value: "abc123",
    sameSite: "Lax",
    secure: true,
  };

  var tests = [
    // Same-site requests — luôn gửi:
    {
      desc: "bank.com page → bank.com API (POST)",
      result: shouldSendCookie(sessionCookie, {
        fromSite: "bank.com",
        toSite: "bank.com",
        method: "POST",
        isTopLevelNavigation: false,
      }),
      // → true ✅
    },

    // Cross-site link click — Lax cho phép:
    {
      desc: "google.com link → bank.com (GET, top-level)",
      result: shouldSendCookie(sessionCookie, {
        fromSite: "google.com",
        toSite: "bank.com",
        method: "GET",
        isTopLevelNavigation: true,
      }),
      // → true ✅ (Lax cho phép top-level GET)
    },

    // CSRF form POST — Lax CHẶN:
    {
      desc: "evil.com form → bank.com (POST)",
      result: shouldSendCookie(sessionCookie, {
        fromSite: "evil.com",
        toSite: "bank.com",
        method: "POST",
        isTopLevelNavigation: false,
      }),
      // → false ❌ (CSRF bị chặn!)
    },

    // CSRF img tag — Lax CHẶN:
    {
      desc: "evil.com img → bank.com (GET, not top-level)",
      result: shouldSendCookie(sessionCookie, {
        fromSite: "evil.com",
        toSite: "bank.com",
        method: "GET",
        isTopLevelNavigation: false,
      }),
      // → false ❌ (CSRF bị chặn!)
    },
  ];

  return tests;
}
```

---

## §8. React & CSRF — Ảnh Hưởng Cụ Thể!

```
  REACT & CSRF:
  ┌────────────────────────────────────────────────────────┐
  │                                                        │
  │  TẠI SAO REACT "ÍT BỊ" CSRF HƠN?                     │
  │  ┌──────────────────────────────────────────────────┐  │
  │  │                                                  │  │
  │  │  ① React dùng SPA → gọi API bằng fetch/axios   │  │
  │  │     → Gửi JSON với Content-Type: application/json│  │
  │  │     → Form attack GỬI ĐƯỢC text/plain nhưng     │  │
  │  │       KHÔNG gửi được application/json!           │  │
  │  │     → Server reject nếu Content-Type sai!        │  │
  │  │                                                  │  │
  │  │  ② React thường dùng JWT trong header:           │  │
  │  │     → Authorization: Bearer <token>              │  │
  │  │     → Form/img KHÔNG set được header!            │  │
  │  │     → ĐÃ chống CSRF tự nhiên!                   │  │
  │  │                                                  │  │
  │  │  ③ SameSite=Lax là default trong Chrome:         │  │
  │  │     → Cross-site POST → KHÔNG gửi cookie!       │  │
  │  │                                                  │  │
  │  │  NHƯNG VẪN CẦN PHÒNG CHỐNG NẾU:                 │  │
  │  │  ❌ Dùng cookie auth (không phải JWT header)     │  │
  │  │  ❌ Server accept application/x-www-form-urlencoded│
  │  │  ❌ Set SameSite=None cho cookies                 │  │
  │  │  ❌ CORS config quá rộng                         │  │
  │  └──────────────────────────────────────────────────┘  │
  │                                                        │
  └────────────────────────────────────────────────────────┘
```

```javascript
// ═══════════════════════════════════════════════════════════
// REACT CSRF PROTECTION — TỰ VIẾT!
// ═══════════════════════════════════════════════════════════

// ① React API Client với CSRF protection:
var ReactAPIClient = (function () {
  var _csrfToken = null;

  // Đọc CSRF token từ meta tag:
  function getCSRFFromMeta() {
    var meta = document.querySelector('meta[name="csrf-token"]');
    return meta ? meta.getAttribute("content") : null;
  }

  // Đọc CSRF token từ cookie:
  function getCSRFFromCookie() {
    var match = document.cookie.match(/XSRF-TOKEN=([^;]+)/);
    return match ? decodeURIComponent(match[1]) : null;
  }

  function getCSRFToken() {
    return _csrfToken || getCSRFFromMeta() || getCSRFFromCookie();
  }

  function setCSRFToken(token) {
    _csrfToken = token;
  }

  function request(url, options) {
    options = options || {};
    options.method = (options.method || "GET").toUpperCase();
    options.headers = options.headers || {};
    options.credentials = "include"; // Gửi cookies!

    // Content-Type mặc định = JSON:
    if (!options.headers["Content-Type"] && options.body) {
      options.headers["Content-Type"] = "application/json";
    }

    // Gắn CSRF token cho non-GET:
    if (options.method !== "GET" && options.method !== "HEAD") {
      var token = getCSRFToken();
      if (token) {
        options.headers["X-XSRF-Token"] = token;
      }
    }

    // Custom header để server biết là AJAX:
    options.headers["X-Requested-With"] = "XMLHttpRequest";

    return fetch(url, options).then(function (response) {
      // Cập nhật CSRF token từ response header:
      var newToken = response.headers.get("X-XSRF-Token");
      if (newToken) {
        _csrfToken = newToken;
      }
      return response;
    });
  }

  return {
    get: function (url) {
      return request(url);
    },
    post: function (url, data) {
      return request(url, {
        method: "POST",
        body: JSON.stringify(data),
      });
    },
    put: function (url, data) {
      return request(url, {
        method: "PUT",
        body: JSON.stringify(data),
      });
    },
    del: function (url) {
      return request(url, { method: "DELETE" });
    },
    setCSRFToken: setCSRFToken,
  };
})();

// SỬ DỤNG:
// ReactAPIClient.post('/api/transfer', {
//     to: 'friend', amount: 100
// });
// → Tự gắn: X-XSRF-Token, X-Requested-With,
//   Content-Type: application/json, credentials

// ② React Hook — useCSRF:
function useCSRF() {
  var tokenState = React.useState("");
  var token = tokenState[0];
  var setToken = tokenState[1];

  React.useEffect(function () {
    // Fetch CSRF token khi component mount:
    fetch("/api/csrf-token", { credentials: "include" })
      .then(function (res) {
        return res.json();
      })
      .then(function (data) {
        setToken(data.csrfToken);
        ReactAPIClient.setCSRFToken(data.csrfToken);
      });
  }, []);

  return token;
}

// ③ React Form với CSRF Protection:
function SecureForm(props) {
  var csrfToken = useCSRF();

  function handleSubmit(event) {
    event.preventDefault(); // Chặn form submit mặc định!
    var formData = new FormData(event.target);
    var data = {};
    formData.forEach(function (value, key) {
      data[key] = value;
    });

    ReactAPIClient.post(props.action, data)
      .then(function (res) {
        return res.json();
      })
      .then(function (result) {
        if (props.onSuccess) props.onSuccess(result);
      });
  }

  return {
    $$typeof: Symbol.for("react.element"),
    type: "form",
    props: {
      onSubmit: handleSubmit,
      children: [
        // Hidden CSRF input (backup):
        {
          $$typeof: Symbol.for("react.element"),
          type: "input",
          props: {
            type: "hidden",
            name: "_csrf",
            value: csrfToken,
          },
        },
        props.children,
      ],
    },
  };
}
```

---

## §9. Tổng Kết & Câu Hỏi Phỏng Vấn!

### 9.1. Tổng Kết!

```
  CSRF — TỔNG KẾT:
  ┌────────────────────────────────────────────────────────┐
  │                                                        │
  │  CSRF LÀ GÌ:                                          │
  │  → Lừa browser gửi request giả mạo đến server        │
  │  → Lợi dụng browser TỰ ĐỘNG gắn cookies!             │
  │  → Hacker KHÔNG cần biết password hay cookie!         │
  │                                                        │
  │  5 PHƯƠNG PHÁP PHÒNG CHỐNG:                           │
  │  ① CSRF Token (Synchronizer Token Pattern)            │
  │  ② Double Submit Cookie                               │
  │  ③ Origin/Referer Header Check                        │
  │  ④ Custom Request Headers                             │
  │  ⑤ SameSite Cookie (GIẢI PHÁP HIỆN ĐẠI!)             │
  │                                                        │
  │  REACT GIẢM CSRF TỰ NHIÊN NHỜ:                       │
  │  → JSON API (form không gửi được application/json)    │
  │  → JWT in header (form không set được header)         │
  │  → SameSite=Lax default                               │
  │  → NHƯNG vẫn cần protection nếu dùng cookie auth!    │
  │                                                        │
  └────────────────────────────────────────────────────────┘
```

### 9.2. Câu Hỏi Phỏng Vấn!

**❓ Q1: CSRF là gì và cơ chế hoạt động?**

> **CSRF (Cross-Site Request Forgery)** = lừa browser của user gửi request đến server mà user đã đăng nhập, mà user không biết. Cơ chế: User đăng nhập bank.com → browser lưu session cookie → user vào evil.com → evil.com chứa form ẩn auto-submit đến bank.com → browser **tự động gắn** cookie bank.com → server nhận cookie valid → xử lý request (chuyển tiền cho hacker). Hacker không cần biết cookie, chỉ cần lừa user visit evil.com.

**❓ Q2: CSRF khác XSS thế nào?**

> **CSRF**: Hacker KHÔNG chạy JS trên trang nạn nhân, chỉ lừa browser gửi request. Lợi dụng cookies auto-attach. Không đọc được response. Thực hiện ACTIONS (chuyển tiền, đổi password). **XSS**: Hacker CHẠY JS trên trang nạn nhân. Lợi dụng thiếu input sanitization. Đọc được mọi thứ (DOM, cookies, storage). XSS **bypass** mọi phòng chống CSRF vì JS chạy same-origin → đọc CSRF token → gửi kèm.

**❓ Q3: SameSite cookie chống CSRF thế nào?**

> **SameSite=Strict**: Cookie **chỉ** gửi khi request từ cùng site. Cross-site request → không có cookie → CSRF bị chặn 100%. Nhược: click link từ email → không có cookie → phải login lại. **SameSite=Lax** (Chrome default): Cho phép cookie cho top-level GET navigation (link click), chặn cross-site POST/iframe/AJAX/img. Chặn hầu hết CSRF vì CSRF thường dùng POST. **SameSite=None**: Cookie gửi mọi request → không chống CSRF.

**❓ Q4: Tại sao React app "ít bị" CSRF hơn?**

> React SPA gọi API bằng `fetch` với `Content-Type: application/json` — form HTML attack **không gửi được** JSON content type. React thường dùng JWT trong `Authorization` header — form/img **không set được** custom header. SameSite=Lax default chặn cross-site POST cookies. **NHƯNG** vẫn cần phòng nếu: dùng cookie-based auth thay JWT, server accept `application/x-www-form-urlencoded`, set SameSite=None, hoặc CORS config quá rộng.

**❓ Q5: Giải thích CSRF Token pattern?**

> Server tạo token **random, unique** cho mỗi session, lưu server-side. Gửi cho client qua cookie (non-HttpOnly) hoặc meta tag. Client đọc token → gắn vào header `X-XSRF-Token` trong mỗi non-GET request. Server **so sánh** token trong header với token trong session. Hacker evil.com không biết token value (SOP chặn đọc cookie/response cross-origin) → không gửi đúng token → server reject 403. Kết hợp **timing-safe comparison** để chống timing attack.

**❓ Q6: Double Submit Cookie pattern là gì?**

> Server set CSRF token trong cookie **(non-HttpOnly)** và yêu cầu client gửi lại giá trị đó trong **header** hoặc **body**. Server so sánh: cookie value == header value? Hacker evil.com: browser tự gắn cookie → nhưng hacker **không đọc được** giá trị cookie (SOP) → không gửi đúng trong header → request bị reject. Ưu điểm: server **không cần** lưu token trong session (stateless). Nhược: cần SameSite hoặc domain verification để chặn subdomain attack.

---

> 📝 **Ghi nhớ cuối cùng:**
> "CSRF = lừa browser gửi request giả, lợi dụng cookies auto-attach! Phòng chống: SameSite Cookie (hiện đại nhất) + CSRF Token (classic) + Origin check + Custom headers! React giảm CSRF tự nhiên nhờ JSON API + JWT header, nhưng cookie auth vẫn cần protection! XSS bypass mọi CSRF defense → phải phòng CẢ HAI!"
