# Cross-Origin Deep Dive: Vấn Đề Cross-Domain Cho Frontend

> Tài liệu học tập về Cross-Origin - vấn đề không thể tránh khỏi với Frontend Developer. Bao gồm nguyên nhân, các giải pháp, và cấu hình chi tiết.

---

## Mục Lục

1. [Tại Sao Có Vấn Đề Cross-Origin?](#1-tại-sao-có-vấn-đề-cross-origin)
2. [Same-Origin Policy](#2-same-origin-policy)
3. [Các Giải Pháp Cross-Origin](#3-các-giải-pháp-cross-origin)
4. [CORS - Giải Pháp Chính](#4-cors---giải-pháp-chính)
5. [Cấu Hình Proxy](#5-cấu-hình-proxy)
6. [Câu Hỏi Phỏng Vấn](#6-câu-hỏi-phỏng-vấn)

---

## 1. Tại Sao Có Vấn Đề Cross-Origin?

> **Nguyên nhân gốc**: Vấn đề cross-origin tồn tại vì **Same-Origin Policy** của browser - một cơ chế bảo mật để bảo vệ người dùng.

### Nếu Không Có Same-Origin Policy?

```
┌─────────────────────────────────────────────────────────────────┐
│  🔴 KỊCH BẢN 1: TẤN CÔNG DOM (không có Same-Origin Policy)      │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Hacker tạo website giả: http://evil-bank.com                   │
│                                                                 │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │ <iframe src="http://mybank.com" width="100%" height="100%">│  │
│  │   Trang ngân hàng thật bên trong!                         │  │
│  │   User nhập username/password...                          │  │
│  └───────────────────────────────────────────────────────────┘  │
│                                                                 │
│  Hacker có thể:                                                 │
│  • Truy cập DOM của iframe (trang ngân hàng thật)               │
│  • Đọc username/password user nhập vào                          │
│  • Gửi thông tin đến server của hacker                          │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│  🔴 KỊCH BẢN 2: TẤN CÔNG CSRF (Cross-Site Request Forgery)      │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  1. User đăng nhập http://mybank.com                            │
│     → Cookie chứa session được lưu                              │
│                                                                 │
│  2. User truy cập http://evil.com                               │
│     → Trang này chạy code:                                      │
│                                                                 │
│     fetch('http://mybank.com/transfer?to=hacker&amount=1000')   │
│                                                                 │
│  3. Browser tự động gửi Cookie của mybank.com kèm theo!         │
│     → Ngân hàng xác thực thành công                             │
│     → Tiền bị chuyển mà user không biết                         │
│                                                                 │
│  ⚠️ AJAX chạy ngầm, user hoàn toàn không hay biết!              │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 2. Same-Origin Policy

### Định Nghĩa "Same Origin"

> **Same Origin** = Cùng **Protocol** + Cùng **Domain** + Cùng **Port**

```
https://example.com:443/page
  │         │        │
  │         │        └── Port (443)
  │         └── Domain (example.com)
  └── Protocol (https)

⚠️ CẢ 3 YẾU TỐ PHẢI GIỐNG NHAU!
```

### Ví Dụ So Sánh Origin

| URL A                   | URL B                     | Same Origin? | Lý Do              |
| ----------------------- | ------------------------- | ------------ | ------------------ |
| `http://example.com`    | `http://example.com/page` | ✅ Yes       | Chỉ khác path      |
| `http://example.com`    | `https://example.com`     | ❌ No        | Khác protocol      |
| `http://example.com`    | `http://www.example.com`  | ❌ No        | Khác subdomain     |
| `http://example.com`    | `http://example.com:8080` | ❌ No        | Khác port          |
| `http://example.com:80` | `http://example.com`      | ✅ Yes       | Port 80 là default |

### Same-Origin Policy Hạn Chế Gì?

```
┌─────────────────────────────────────────────────────────────────┐
│  SAME-ORIGIN POLICY HẠN CHẾ:                                    │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  1️⃣  AJAX/Fetch Requests                                        │
│      ❌ Không thể gửi request đến domain khác                   │
│      ❌ Không thể đọc response từ domain khác                   │
│                                                                 │
│  2️⃣  DOM Access                                                 │
│      ❌ Không thể đọc/ghi DOM của iframe từ domain khác         │
│                                                                 │
│  3️⃣  Storage Access                                             │
│      ❌ Không thể đọc Cookies, LocalStorage, IndexedDB          │
│         của domain khác                                         │
│                                                                 │
├─────────────────────────────────────────────────────────────────┤
│  NHƯNG CHO PHÉP:                                                │
│                                                                 │
│  ✅ <script src="..."> - Load JS từ domain khác                 │
│  ✅ <img src="..."> - Load hình từ domain khác                  │
│  ✅ <link href="..."> - Load CSS từ domain khác                 │
│  ✅ <video>, <audio>, <iframe> - Embed content                  │
│  ✅ Form submit - Gửi form đến domain khác                      │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Tại Sao Form Submit Được, AJAX Không?

```
┌─────────────────────────────────────────────────────────────────┐
│  FORM SUBMIT vs AJAX                                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  📝 Form Submit:                                                │
│  • Reload/redirect trang sau khi submit                         │
│  • Browser KHÔNG thể đọc response                               │
│  • → Được coi là AN TOÀN                                        │
│                                                                 │
│  📡 AJAX:                                                       │
│  • Gửi request NGẦM, không reload trang                         │
│  • JavaScript CÓ THỂ ĐỌC response                               │
│  • → Nếu cho phép cross-domain, hacker đọc được data!           │
│  • → NGUY HIỂM!                                                 │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 3. Các Giải Pháp Cross-Origin

### Tổng Quan Các Giải Pháp

```
┌─────────────────────────────────────────────────────────────────┐
│                  CROSS-ORIGIN SOLUTIONS                         │
├───────────────┬─────────────────────────────────────────────────┤
│ Giải Pháp     │ Đặc Điểm                                        │
├───────────────┼─────────────────────────────────────────────────┤
│ CORS          │ ✅ Chuẩn nhất, server cho phép cross-origin     │
│               │ ✅ Hỗ trợ tất cả HTTP methods                   │
├───────────────┼─────────────────────────────────────────────────┤
│ Proxy         │ ✅ Không cần backend hỗ trợ CORS                │
│               │ ✅ Dev: webpack proxy, Prod: Nginx proxy        │
├───────────────┼─────────────────────────────────────────────────┤
│ JSONP         │ ⚠️ Chỉ hỗ trợ GET                               │
│               │ ⚠️ Legacy, ít dùng hiện nay                     │
├───────────────┼─────────────────────────────────────────────────┤
│ postMessage   │ ✅ Communication giữa windows/iframes           │
│               │ ⚠️ Chỉ dùng cho window/iframe                   │
├───────────────┼─────────────────────────────────────────────────┤
│ document.domain│ ⚠️ Chỉ cho same base domain                    │
│               │ ⚠️ Deprecated, không nên dùng                   │
├───────────────┼─────────────────────────────────────────────────┤
│ WebSocket     │ ✅ Không bị Same-Origin Policy                  │
│               │ ⚠️ Chỉ cho real-time communication              │
└───────────────┴─────────────────────────────────────────────────┘
```

---

### 3.1 JSONP (JSON with Padding)

> **Nguyên lý**: Thẻ `<script src="...">` KHÔNG bị Same-Origin Policy hạn chế. Lợi dụng điều này để load data từ domain khác.

```
┌─────────────────────────────────────────────────────────────────┐
│  JSONP HOẠT ĐỘNG NHƯ THẾ NÀO?                                   │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Browser (origin A)                    Server (origin B)        │
│       │                                      │                  │
│  1. Tạo <script src="...?callback=fn">       │                  │
│       │ ─────────────────────────────────────►                  │
│       │                                      │                  │
│       │        2. Server trả về: fn({data})  │                  │
│       │ ◄─────────────────────────────────────                  │
│       │                                      │                  │
│  3. Browser thực thi fn({data})              │                  │
│     → Hàm fn được gọi với data!              │                  │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

**Code ví dụ:**

```javascript
// Frontend: Tạo script tag động
var script = document.createElement("script");

// Định nghĩa callback function
function handleData(data) {
  console.log("Received:", data);
  // { code: 0, data: [1, 2, 3, 4, 5] }
}

// Set src với callback parameter
script.src = "https://api.example.com/data?callback=handleData";

// Thêm vào DOM để thực thi
document.body.appendChild(script);

// Server trả về:
// handleData({ code: 0, data: [1, 2, 3, 4, 5] })
// → Browser thực thi handleData() với data từ server!
```

**Nhược điểm JSONP:**

| Nhược Điểm                 | Giải Thích                                |
| -------------------------- | ----------------------------------------- |
| ❌ Chỉ hỗ trợ GET          | `<script>` chỉ có thể tạo GET request     |
| ❌ Không an toàn           | Dễ bị XSS nếu server trả về code độc      |
| ❌ Không có error handling | Không biết request thất bại               |
| ❌ Cần backend hỗ trợ      | Backend phải wrap response trong callback |

---

### 3.2 window.postMessage (HTML5)

> Cho phép communication an toàn giữa window/iframe từ different origins.

```javascript
// Parent window (https://parent.com)
const iframe = document.getElementById("myIframe");

// Gửi message đến iframe
iframe.contentWindow.postMessage(
  { action: "getData", payload: { id: 123 } },
  "https://child.com", // Target origin (bảo mật!)
);

// Nhận message từ iframe
window.addEventListener("message", (event) => {
  // QUAN TRỌNG: Kiểm tra origin trước khi xử lý!
  if (event.origin !== "https://child.com") return;

  console.log("Received:", event.data);
});
```

```javascript
// Iframe (https://child.com)
window.addEventListener("message", (event) => {
  // Kiểm tra origin
  if (event.origin !== "https://parent.com") return;

  // Xử lý message
  if (event.data.action === "getData") {
    // Gửi response về parent
    event.source.postMessage(
      { result: "success", data: [1, 2, 3] },
      event.origin,
    );
  }
});
```

---

### 3.3 document.domain (Deprecated)

> Chỉ dùng cho các subdomain cùng base domain. **KHÔNG NÊN DÙNG** - đã deprecated.

```javascript
// https://sub1.example.com
document.domain = "example.com";

// https://sub2.example.com
document.domain = "example.com";

// Giờ cả hai có thể truy cập DOM của nhau
```

---

### 3.4 window.name

> Thuộc tính `window.name` được giữ nguyên khi navigate giữa các pages, kể cả cross-origin.

```javascript
// Page A (origin1) set window.name
window.name = JSON.stringify({ data: "secret" });

// Navigate đến Page B (origin2)
// window.name vẫn giữ giá trị cũ!
const data = JSON.parse(window.name);
```

---

## 4. CORS - Giải Pháp Chính

> **CORS** (Cross-Origin Resource Sharing) là cơ chế chuẩn để server cho phép cross-origin requests.

### Nguyên Lý CORS

```
┌─────────────────────────────────────────────────────────────────┐
│  CORS: SERVER CHO PHÉP CROSS-ORIGIN                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Browser (origin A)                    Server (origin B)        │
│       │                                      │                  │
│  1. Gửi request với header:                  │                  │
│     Origin: https://origin-a.com             │                  │
│       │ ─────────────────────────────────────►                  │
│       │                                      │                  │
│       │  2. Server kiểm tra Origin           │                  │
│       │     và quyết định cho phép hay không │                  │
│       │                                      │                  │
│       │  3. Response với header:             │                  │
│       │     Access-Control-Allow-Origin: *   │                  │
│       │ ◄─────────────────────────────────────                  │
│       │                                      │                  │
│  4. Browser kiểm tra header và              │                  │
│     cho phép JavaScript đọc response        │                  │
│                                                                 │
│  📌 CHÌA KHÓA: Server phải set header CORS!                     │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Simple Requests vs Preflight Requests

```
┌─────────────────────────────────────────────────────────────────┐
│  SIMPLE REQUEST (Không cần Preflight)                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Điều kiện:                                                     │
│  ✅ Method: GET, POST, hoặc HEAD                                │
│  ✅ Headers chỉ có: Accept, Accept-Language, Content-Language,  │
│     Content-Type (application/x-www-form-urlencoded,            │
│     multipart/form-data, text/plain)                            │
│                                                                 │
│  Flow:                                                          │
│  Browser ──── GET /api/data ────► Server                        │
│  Browser ◄─── 200 OK + CORS headers ─── Server                  │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│  PREFLIGHT REQUEST (Cần OPTIONS trước)                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Khi nào cần Preflight?                                         │
│  ⚠️ Method: PUT, DELETE, PATCH                                  │
│  ⚠️ Custom headers (Authorization, X-Custom-Header...)          │
│  ⚠️ Content-Type: application/json                              │
│                                                                 │
│  Flow:                                                          │
│                                                                 │
│  🔵 BƯỚC 1: Preflight (OPTIONS)                                 │
│  Browser ──── OPTIONS /api/data ────► Server                    │
│               Origin: https://myapp.com                         │
│               Access-Control-Request-Method: PUT                │
│               Access-Control-Request-Headers: Content-Type      │
│                                                                 │
│  Server ────► Browser                                           │
│               Access-Control-Allow-Origin: https://myapp.com    │
│               Access-Control-Allow-Methods: PUT, POST, GET      │
│               Access-Control-Allow-Headers: Content-Type        │
│               Access-Control-Max-Age: 86400                     │
│                                                                 │
│  🟢 BƯỚC 2: Actual Request                                      │
│  Browser ──── PUT /api/data ────► Server                        │
│  Browser ◄─── 200 OK ─── Server                                 │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### CORS Headers

| Header                             | Mô Tả                                  |
| ---------------------------------- | -------------------------------------- |
| `Access-Control-Allow-Origin`      | Origin được phép (hoặc `*` cho tất cả) |
| `Access-Control-Allow-Methods`     | Methods được phép (GET, POST, PUT...)  |
| `Access-Control-Allow-Headers`     | Custom headers được phép               |
| `Access-Control-Allow-Credentials` | Cho phép gửi cookies (`true`/`false`)  |
| `Access-Control-Max-Age`           | Cache preflight bao lâu (giây)         |
| `Access-Control-Expose-Headers`    | Headers mà JS có thể đọc từ response   |

### Cấu Hình CORS Trên Server

**Node.js (Express):**

```javascript
const cors = require("cors");

// Cho phép tất cả origins
app.use(cors());

// Hoặc cấu hình chi tiết
app.use(
  cors({
    origin: "https://myapp.com", // Chỉ cho phép origin này
    methods: ["GET", "POST", "PUT"], // Methods được phép
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true, // Cho phép cookies
    maxAge: 86400, // Cache preflight 24h
  }),
);
```

**Nginx:**

```nginx
server {
    location /api/ {
        # CORS headers
        add_header 'Access-Control-Allow-Origin' 'https://myapp.com';
        add_header 'Access-Control-Allow-Methods' 'GET, POST, PUT, DELETE, OPTIONS';
        add_header 'Access-Control-Allow-Headers' 'Content-Type, Authorization';
        add_header 'Access-Control-Allow-Credentials' 'true';

        # Preflight request
        if ($request_method = 'OPTIONS') {
            add_header 'Access-Control-Max-Age' 86400;
            add_header 'Content-Length' 0;
            return 204;
        }

        proxy_pass http://backend;
    }
}
```

---

## 5. Cấu Hình Proxy

> **Nguyên lý**: Cross-Origin chỉ áp dụng cho **browser**. Server-to-server KHÔNG bị hạn chế. Vì vậy, dùng proxy server để "trung chuyển" request.

```
┌─────────────────────────────────────────────────────────────────┐
│  PROXY: GIẢI QUYẾT CROSS-ORIGIN BẰNG SERVER                     │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ❌ KHÔNG DÙNG PROXY (Cross-Origin Error):                      │
│                                                                 │
│  Browser ─────── AJAX ──────► API Server (different origin)     │
│     │                              │                            │
│     └── 🔴 CORS Error! ───────────┘                             │
│                                                                 │
│  ─────────────────────────────────────────────────────────────  │
│                                                                 │
│  ✅ DÙNG PROXY:                                                 │
│                                                                 │
│  Browser ──── AJAX ────► Proxy Server ────► API Server          │
│     │       (same origin)    │        (server-to-server)        │
│     │                        │              │                   │
│     └── ✅ Same Origin ──────┘              │                   │
│                                             │                   │
│     Server-to-server không bị CORS! ────────┘                   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 5.1 Development: Webpack Dev Server Proxy

**Vue CLI (vue.config.js):**

```javascript
module.exports = {
  devServer: {
    proxy: {
      // Cách 1: Simple
      "/api": "http://api.example.com",
      // /api/users → http://api.example.com/api/users

      // Cách 2: Chi tiết
      "/api": {
        target: "http://api.example.com",
        changeOrigin: true, // Thay đổi origin header
        pathRewrite: {
          "^/api": "", // Bỏ prefix /api
        },
        // /api/users → http://api.example.com/users
      },

      // Nhiều API servers
      "/auth": {
        target: "http://auth.example.com",
        changeOrigin: true,
      },
    },
  },
};
```

**Create React App (setupProxy.js):**

```javascript
// src/setupProxy.js
const { createProxyMiddleware } = require("http-proxy-middleware");

module.exports = function (app) {
  app.use(
    "/api",
    createProxyMiddleware({
      target: "http://api.example.com",
      changeOrigin: true,
      pathRewrite: { "^/api": "" },
    }),
  );
};
```

**Vite (vite.config.js):**

```javascript
export default {
  server: {
    proxy: {
      "/api": {
        target: "http://api.example.com",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ""),
      },
    },
  },
};
```

### 5.2 Production: Nginx Reverse Proxy

```nginx
server {
    listen 80;
    server_name myapp.com;

    # Serve frontend static files
    location / {
        root /var/www/html;
        try_files $uri $uri/ /index.html;
    }

    # Proxy API requests to backend
    location /api/ {
        proxy_pass http://api.example.com/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;

        # Nếu backend không set CORS, thêm ở đây
        add_header 'Access-Control-Allow-Origin' '*';
    }
}
```

---

## 6. Câu Hỏi Phỏng Vấn

### Quick Reference

```
CROSS-ORIGIN xảy ra khi:
• Khác Protocol (http vs https)
• Khác Domain (example.com vs api.example.com)
• Khác Port (80 vs 8080)

GIẢI PHÁP:
• CORS (server set Access-Control-Allow-Origin)
• Proxy (dev: webpack, prod: nginx)
• JSONP (legacy, chỉ GET)
• postMessage (window/iframe)
```

### Câu Hỏi Thường Gặp

**1. Cross-Origin là gì? Tại sao browser có hạn chế này?**

> Cross-Origin là sự khác biệt về origin (protocol + domain + port). Browser hạn chế để **bảo vệ user** khỏi các cuộc tấn công như:
>
> - **XSS**: Script độc truy cập data từ domain khác
> - **CSRF**: Request giả mạo từ website khác
> - **DOM hijacking**: Đọc thông tin từ iframe chứa website khác

**2. Tại sao Form submit không bị CORS nhưng AJAX bị?**

> - **Form**: Reload trang sau submit → JS không đọc được response
> - **AJAX**: Chạy ngầm, JS đọc được response → nguy hiểm nếu cross-origin

**3. Simple Request vs Preflight Request?**

> - **Simple**: GET/POST/HEAD với headers cơ bản → không cần OPTIONS
> - **Preflight**: PUT/DELETE/PATCH hoặc custom headers → browser gửi OPTIONS trước để "hỏi phép"

**4. CORS header `Access-Control-Allow-Origin: *` có an toàn không?**

> - `*` cho phép **tất cả origins** → không an toàn cho API có sensitive data
> - Không dùng được với `credentials: true` (cookies)
> - Production nên specify origin cụ thể

**5. Tại sao dùng proxy có thể bypass CORS?**

> - Same-Origin Policy chỉ áp dụng cho **browser**
> - Server-to-server không bị hạn chế
> - Browser gửi request đến proxy (same origin) → proxy forward đến API (server-to-server)

**6. Khi nào dùng CORS, khi nào dùng Proxy?**

> | Trường Hợp                  | Giải Pháp                  |
> | --------------------------- | -------------------------- |
> | Bạn control backend         | CORS (backend set headers) |
> | Không control backend       | Proxy                      |
> | Development                 | Webpack/Vite proxy         |
> | Production                  | Nginx proxy hoặc CORS      |
> | Public API cần nhiều client | CORS                       |

---

## Checklist Học Tập

- [ ] Hiểu Same-Origin Policy và tại sao cần nó
- [ ] Phân biệt được Same Origin (cùng protocol + domain + port)
- [ ] Biết sự khác nhau Form submit vs AJAX cross-origin
- [ ] Hiểu CORS và các headers liên quan
- [ ] Phân biệt Simple Request và Preflight Request
- [ ] Biết cấu hình Proxy cho Dev (webpack/vite) và Prod (nginx)
- [ ] Hiểu JSONP và tại sao nó hoạt động
- [ ] Biết dùng window.postMessage cho iframe communication

---

## Tóm Tắt

```
CORS = Server cho phép (Access-Control-Allow-Origin)
Proxy = Server trung chuyển (bypass browser restriction)
JSONP = Trick <script src> (legacy, chỉ GET)
postMessage = Window/iframe communication
```

---

_Cập nhật lần cuối: Tháng 2, 2026_
