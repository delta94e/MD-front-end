# Browser Same-Origin Policy & Cross-Domain Solutions — Deep Dive

> 📅 2026-02-11 · ⏱ 30 phút đọc
>
> Tài liệu chuyên sâu về Same-Origin Policy, 9 giải pháp cross-domain
> (CORS, JSONP, postMessage, Nginx, Node proxy, document.domain,
> location.hash, window.name, WebSocket), Forward vs Reverse Proxy, và Nginx.
> Độ khó: ⭐️⭐️⭐️⭐️⭐️ | Chủ đề: Browser Security & Networking

---

## Mục Lục

0. [Same-Origin Policy là gì?](#0-same-origin-policy-là-gì)
1. [CORS — Cross-Origin Resource Sharing](#1-cors--cross-origin-resource-sharing)
2. [JSONP](#2-jsonp)
3. [postMessage](#3-postmessage)
4. [Nginx Proxy Cross-Domain](#4-nginx-proxy-cross-domain)
5. [Node.js Middleware Proxy](#5-nodejs-middleware-proxy)
6. [document.domain + iframe](#6-documentdomain--iframe)
7. [location.hash + iframe](#7-locationhash--iframe)
8. [window.name + iframe](#8-windowname--iframe)
9. [WebSocket Cross-Domain](#9-websocket-cross-domain)
10. [Forward Proxy vs Reverse Proxy](#10-forward-proxy-vs-reverse-proxy)
11. [Nginx — Khái niệm & Nguyên lý](#11-nginx--khái-niệm--nguyên-lý)
12. [Tóm Tắt & Câu Hỏi Phỏng Vấn](#12-tóm-tắt--câu-hỏi-phỏng-vấn)

---

## 0. Same-Origin Policy là gì?

> **🎯 Protocol + Domain + Port phải GIỐNG NHAU**

```
SAME-ORIGIN POLICY — ĐỊNH NGHĨA:
═══════════════════════════════════════════════════════════════

  Cross-domain là DO browser's Same-Origin Policy gây ra

  Same-origin = PROTOCOL + DOMAIN + PORT đều giống nhau

  VD: http://store.company.com/dir/page.html

  ┌────────────────────────────────────────┬────────┬────────┐
  │ URL                                    │Cross?  │ Lý do  │
  ├────────────────────────────────────────┼────────┼────────┤
  │ .../dir/page2.html                     │ KHÔNG  │ Cùng   │
  │                                        │ ✅     │ origin │
  ├────────────────────────────────────────┼────────┼────────┤
  │ .../dir/inner/another.html             │ KHÔNG  │ Chỉ    │
  │                                        │ ✅     │ khác   │
  │                                        │        │ path   │
  ├────────────────────────────────────────┼────────┼────────┤
  │ https://store.company.com/secure.html  │ CÓ ❌  │ Khác   │
  │                                        │        │PROTOCOL│
  ├────────────────────────────────────────┼────────┼────────┤
  │ http://store.company.com:81/dir/...    │ CÓ ❌  │ Khác   │
  │                                        │        │ PORT   │
  │                                        │        │(80→81) │
  ├────────────────────────────────────────┼────────┼────────┤
  │ http://news.company.com/dir/...        │ CÓ ❌  │ Khác   │
  │                                        │        │ HOST   │
  └────────────────────────────────────────┴────────┴────────┘
```

### 3 hạn chế của Same-Origin Policy

```
3 HẠN CHẾ CHÍNH:
═══════════════════════════════════════════════════════════════

  ┌──────────────────────────────────────────────────────────┐
  │ ① JS KHÔNG truy cập cookies, localStorage, IndexedDB   │
  │   của DOMAIN KHÁC                                       │
  ├──────────────────────────────────────────────────────────┤
  │ ② JS KHÔNG thao tác DOM của DOMAIN KHÁC                │
  ├──────────────────────────────────────────────────────────┤
  │ ③ AJAX KHÔNG gửi request tới DOMAIN KHÁC               │
  └──────────────────────────────────────────────────────────┘

  📌 MỤC ĐÍCH: bảo vệ THÔNG TIN USER
  📌 CHỈ hạn chế JAVASCRIPT, không hạn chế browser
  📌 Image, script requests thường KHÔNG bị hạn chế
     (vì không liên quan tới security qua response)
```

---

## 1. CORS — Cross-Origin Resource Sharing

> **🎯 Server set Access-Control headers → cho phép cross-origin**

```
CORS — TỔNG QUAN:
═══════════════════════════════════════════════════════════════

  → Cơ chế dùng ADDITIONAL HTTP HEADERS
  → Cho phép web app ở 1 ORIGIN truy cập resources
    từ SERVER KHÁC ORIGIN

  → CẦN hỗ trợ từ CẢ browser VÀ server
  → Browser xử lý tự động, KHÔNG cần user can thiệp
  → CHÌA KHÓA: SERVER implement CORS

  ┌──────┐  Origin: http://a.com     ┌──────┐
  │      │───────────────────────────►│      │
  │Client│                            │Server│
  │(a.com)│◄───────────────────────────│(b.com)│
  └──────┘  Access-Control-Allow-     └──────┘
            Origin: http://a.com
```

### Simple Request vs Non-Simple Request

```
SIMPLE REQUEST — ĐIỀU KIỆN (CẢ 2 PHẢI THỎA):
═══════════════════════════════════════════════════════════════

  ① Method là 1 trong:
     → HEAD, GET, POST

  ② HTTP headers KHÔNG vượt quá:
     → Accept
     → Accept-Language
     → Content-Language
     → Last-Event-ID
     → Content-Type (CHỈ 3 giá trị):
       · application/x-www-form-urlencoded
       · multipart/form-data
       · text/plain

  KHÔNG thỏa 2 điều kiện trên → NON-SIMPLE REQUEST
  (VD: PUT, DELETE, Content-Type: application/json)
```

### (1) Simple Request Flow

```
SIMPLE REQUEST FLOW:
═══════════════════════════════════════════════════════════════

  ┌──────┐  GET /api/data               ┌──────┐
  │      │  Origin: http://a.com  ──────►│      │
  │Client│                               │Server│
  │      │◄──────────────────────────────│      │
  └──────┘                               └──────┘
          Access-Control-Allow-Origin: http://a.com
          Access-Control-Allow-Credentials: true
          Access-Control-Expose-Headers: FooBar
          Content-Type: text/html; charset=utf-8

  → Browser TRỰC TIẾP gửi CORS request
  → Thêm field "Origin" vào request headers
  → Server dùng Origin để quyết định cho phép không

  ✅ Origin TRONG phạm vi cho phép: trả response + headers
  ❌ Origin NGOÀI: trả HTTP response BÌNH THƯỜNG
     → Browser thấy KHÔNG CÓ Access-Control-Allow-Origin
     → BÁO LỖI (status code vẫn có thể là 200!)

  📌 TỐI THIỂU server phải set:
  → Access-Control-Allow-Origin
```

### (2) Non-Simple Request Flow — Preflight

```
NON-SIMPLE REQUEST — PREFLIGHT FLOW:
═══════════════════════════════════════════════════════════════

  ① PREFLIGHT REQUEST (OPTIONS method):
  ┌──────┐  OPTIONS /api/data            ┌──────┐
  │      │  Origin: http://a.com         │      │
  │      │  Access-Control-Request-      │      │
  │Client│    Method: PUT         ──────►│Server│
  │      │  Access-Control-Request-      │      │
  │      │    Headers: X-Custom-Header   │      │
  └──────┘                               └──────┘

  ② SERVER RESPONSE (cho phép):
  ┌──────┐                               ┌──────┐
  │      │◄──────────────────────────────│      │
  │Client│  Access-Control-Allow-Origin  │Server│
  │      │  Access-Control-Allow-Methods │      │
  │      │  Access-Control-Allow-Headers │      │
  │      │  Access-Control-Allow-Creds   │      │
  │      │  Access-Control-Max-Age       │      │
  └──────┘                               └──────┘

  ③ ACTUAL REQUEST (nếu preflight OK):
  ┌──────┐  PUT /api/data                ┌──────┐
  │      │  Origin: http://a.com  ──────►│      │
  │Client│                               │Server│
  │      │◄──────────────────────────────│      │
  └──────┘  Access-Control-Allow-Origin  └──────┘

  📌 TỐI THIỂU server phải set:
  → Access-Control-Allow-Origin
  → Access-Control-Allow-Methods
  → Access-Control-Allow-Headers
```

### Giảm OPTIONS requests & Cookie

```
GIẢM PREFLIGHT + COOKIE:
═══════════════════════════════════════════════════════════════

  ① GIẢM OPTIONS REQUESTS:
  → Thêm Access-Control-Max-Age: 1728000 (giây)
  → Cache preflight response trong thời gian đó
  → Subsequent requests KHÔNG CẦN preflight lại
  → Chỉ áp dụng trong cùng URL

  ② COOKIE TRONG CORS (3 điều kiện):
  ┌──────────────────────────────────────────────────────────┐
  │ ① Client: withCredentials = true                        │
  │                                                          │
  │   // Native XHR                                          │
  │   xhr.withCredentials = true;                            │
  │   // Axios                                               │
  │   axios.defaults.withCredentials = true;                 │
  │                                                          │
  │ ② Server: Access-Control-Allow-Credentials: true        │
  │                                                          │
  │ ③ Server: Access-Control-Allow-Origin ≠ "*"             │
  │   (PHẢI chỉ định DOMAIN CỤ THỂ)                        │
  └──────────────────────────────────────────────────────────┘
```

---

## 2. JSONP

> **🎯 Lợi dụng `<script>` tag KHÔNG bị SOP hạn chế**

```
JSONP — NGUYÊN LÝ:
═══════════════════════════════════════════════════════════════

  <script> tag KHÔNG bị cross-domain restriction!

  FLOW:
  ┌──────┐  <script src="b.com/api     ┌──────┐
  │      │   ?callback=handleData">     │      │
  │Client│  ───────────────────────────►│Server│
  │(a.com)│                              │(b.com)│
  │      │◄─────────────────────────────│      │
  └──────┘  handleData({"name":"Jun"})  └──────┘
            ↑ Server wrap data trong callback function

  → Client tạo <script> tag với src chứa callback name
  → Server nhận callback name → wrap data → trả về
  → Browser parse + execute → callback function chạy
  → Frontend nhận được data!
```

### Code Example

```javascript
// ===== FRONTEND: Native JavaScript =====
var script = document.createElement("script");
script.type = "text/javascript";
script.src =
  "http://www.domain2.com:8080/login?user=admin&callback=handleCallback";
document.head.appendChild(script);

function handleCallback(res) {
  alert(JSON.stringify(res));
}

// ===== BACKEND: Node.js =====
var querystring = require("querystring");
var http = require("http");
var server = http.createServer();
server.on("request", function (req, res) {
  var params = querystring.parse(req.url.split("?")[1]);
  var fn = params.callback;
  res.writeHead(200, { "Content-Type": "text/javascript" });
  res.write(fn + "(" + JSON.stringify(params) + ")");
  res.end();
});
server.listen("8080");
```

```
JSONP — NHƯỢC ĐIỂM:
═══════════════════════════════════════════════════════════════

  ❌ CHỈ hỗ trợ GET method (không POST, PUT, DELETE)
  ❌ KHÔNG AN TOÀN — có thể bị XSS attack
  ❌ Không có error handling tốt
```

---

## 3. postMessage

> **🎯 HTML5 API: giao tiếp cross-domain giữa windows/iframes**

```
postMessage — USE CASES:
═══════════════════════════════════════════════════════════════

  ① Data transfer: page ↔ window mới mở
  ② Message passing: giữa NHIỀU windows
  ③ Message passing: page ↔ nested iframe
  ④ Cross-domain data trong 3 scenarios trên

  API: postMessage(data, origin)
  → data: dữ liệu (nên JSON.stringify() cho safe)
  → origin: protocol + host + port ("*" = any, "/" = same)
```

### Code Example

```javascript
// ===== a.html (domain1.com) =====
var iframe = document.getElementById("iframe");
iframe.onload = function () {
  var data = { name: "aym" };
  // Gửi data cross-domain tới domain2
  iframe.contentWindow.postMessage(
    JSON.stringify(data),
    "http://www.domain2.com",
  );
};
// Nhận data từ domain2
window.addEventListener(
  "message",
  function (e) {
    alert("data from domain2 ---> " + e.data);
  },
  false,
);

// ===== b.html (domain2.com) =====
window.addEventListener(
  "message",
  function (e) {
    alert("data from domain1 ---> " + e.data);
    var data = JSON.parse(e.data);
    if (data) {
      data.number = 16;
      // Xử lý xong → gửi lại domain1
      window.parent.postMessage(JSON.stringify(data), "http://www.domain1.com");
    }
  },
  false,
);
```

---

## 4. Nginx Proxy Cross-Domain

> **🎯 Server-side → KHÔNG bị SOP (SOP chỉ áp dụng browser)**

```
NGINX PROXY — NGUYÊN LÝ:
═══════════════════════════════════════════════════════════════

  SOP chỉ áp dụng cho BROWSER
  Server gọi HTTP → KHÔNG CẦN SOP → không cross-domain!

  ┌──────┐  same-origin   ┌────────┐  proxy   ┌──────┐
  │      │────────────────►│ Nginx  │─────────►│      │
  │Client│                 │ Proxy  │          │Target│
  │(a.com)│◄────────────────│(a.com) │◄─────────│Server│
  └──────┘                 │port 81 │          │(b.com)│
                           └────────┘          └──────┘

  → Nginx proxy CÙNG domain với client (khác port)
  → Client request tới Nginx (same origin!)
  → Nginx forward tới target server
  → Nginx modify cookie domain → client đọc được
```

### Nginx Config

```nginx
# ===== Nginx Reverse Proxy Config =====
server {
    listen       81;
    server_name  www.domain1.com;

    location / {
        proxy_pass   http://www.domain2.com:8080;  # Reverse proxy
        proxy_cookie_domain www.domain2.com www.domain1.com; # Sửa cookie domain

        # CORS headers (nếu cần)
        add_header Access-Control-Allow-Origin http://www.domain1.com;
        add_header Access-Control-Allow-Credentials true;
    }
}

# ===== Nginx fix iconfont cross-domain =====
# (eot|otf|ttf|woff|svg bị SOP hạn chế)
location / {
    add_header Access-Control-Allow-Origin *;
}
```

---

## 5. Node.js Middleware Proxy

> **🎯 Nguyên lý tương tự Nginx: proxy server forward data**

```
NODE.JS PROXY — NGUYÊN LÝ:
═══════════════════════════════════════════════════════════════

  Giống Nginx: khởi PROXY SERVER forward data
  Có thể modify cookie domain qua cookieDomainRewrite

  ┌──────┐               ┌──────────┐              ┌──────┐
  │      │──────────────►│  Node    │─────────────►│      │
  │Client│               │  Proxy   │              │Target│
  │      │◄──────────────│ (Express)│◄─────────────│Server│
  └──────┘               └──────────┘              └──────┘
```

### Code Example

```javascript
// ===== Node + Express + http-proxy-middleware =====
var express = require("express");
var proxy = require("http-proxy-middleware");
var app = express();

app.use(
  "/",
  proxy({
    target: "http://www.domain2.com:8080",
    changeOrigin: true,
    onProxyRes: function (proxyRes, req, res) {
      res.header("Access-Control-Allow-Origin", "http://www.domain1.com");
      res.header("Access-Control-Allow-Credentials", "true");
    },
    cookieDomainRewrite: "www.domain1.com",
  }),
);
app.listen(3000);
```

```javascript
// ===== Vue webpack.config.js (Dev environment) =====
module.exports = {
  devServer: {
    proxy: [
      {
        context: "/login",
        target: "http://www.domain2.com:8080",
        changeOrigin: true,
        secure: false,
        cookieDomainRewrite: "www.domain1.com",
      },
    ],
  },
};
// Vue dev → rendering + proxy trên CÙNG webpack-dev-server
// → Không có cross-origin giữa page và proxy API
```

---

## 6. document.domain + iframe

> **🎯 CHỈ áp dụng: cùng main domain, KHÁC subdomain**

```
document.domain — NGUYÊN LÝ:
═══════════════════════════════════════════════════════════════

  CHỈ DÙNG KHI: main domain GIỐNG, subdomain KHÁC

  VD: parent.domain.com ↔ child.domain.com
      → CẢ 2 set document.domain = 'domain.com'
      → Trở thành SAME DOMAIN → truy cập nhau OK!

  ⚠️ KHÔNG dùng được cho domains hoàn toàn khác nhau!
```

```javascript
// ===== Parent: domain.com/a.html =====
document.domain = "domain.com";
var user = "admin";

// ===== Child iframe: child.domain.com/b.html =====
document.domain = "domain.com";
// Truy cập biến parent
console.log("get data: " + window.parent.user); // "admin"
```

---

## 7. location.hash + iframe

> **🎯 Giao tiếp qua URL hash (#), dùng page trung gian cùng domain**

```
location.hash — NGUYÊN LÝ:
═══════════════════════════════════════════════════════════════

  A (domain1) ←→ B (domain2) ←→ C (domain1)

  A và B: khác domain → chỉ giao tiếp qua HASH
  B và C: khác domain → chỉ giao tiếp qua HASH
  C và A: CÙNG domain → C truy cập A qua parent.parent

  ┌──────────┐  hash   ┌──────────┐  hash   ┌──────────┐
  │ A        │────────►│ B        │────────►│ C        │
  │(domain1) │         │(domain2) │         │(domain1) │
  │          │◄────────────────────────────── │          │
  └──────────┘  parent.parent (same domain) └──────────┘
```

```javascript
// ===== a.html (domain1) =====
var iframe = document.getElementById("iframe");
setTimeout(function () {
  iframe.src = iframe.src + "#user=admin"; // Gửi hash cho B
}, 1000);
function onCallback(res) {
  alert("data from c.html ---> " + res);
}

// ===== b.html (domain2) =====
var iframe = document.getElementById("iframe");
window.onhashchange = function () {
  iframe.src = iframe.src + location.hash; // Chuyển hash cho C
};

// ===== c.html (domain1 — cùng domain với A) =====
window.onhashchange = function () {
  // Gọi callback của A qua parent.parent (same domain!)
  window.parent.parent.onCallback(
    "hello: " + location.hash.replace("#user=", ""),
  );
};
```

---

## 8. window.name + iframe

> **🎯 window.name TỒN TẠI qua page loads khác domain (max 2MB)**

```
window.name — NGUYÊN LÝ:
═══════════════════════════════════════════════════════════════

  ĐẶC BIỆT: window.name GIỮ GIÁ TRỊ khi load page KHÁC!
  → Kể cả khác DOMAIN, giá trị name VẪN CÒN
  → Hỗ trợ VERY LONG values (2MB)

  FLOW:
  ① iframe load cross-domain page → data lưu window.name
  ② Chuyển iframe.src sang SAME-DOMAIN proxy page
  ③ Vì cùng domain → đọc được iframe.contentWindow.name
  ④ Lấy data xong → destroy iframe

  ┌─────────┐  ①load b.html   ┌──────────┐
  │ a.html  │ (domain2)       │ b.html   │
  │(domain1)│─────────────────►│(domain2) │
  │         │                  │ set name │
  │         │  ②switch to      └──────────┘
  │         │  proxy.html
  │         │─────────────────►┌──────────┐
  │         │                  │proxy.html│
  │         │◄─ ③read name ──│(domain1) │
  │         │  (same domain!) └──────────┘
  └─────────┘
```

```javascript
// ===== a.html (domain1) =====
var proxy = function (url, callback) {
  var state = 0;
  var iframe = document.createElement("iframe");
  iframe.src = url; // Load cross-domain page

  iframe.onload = function () {
    if (state === 1) {
      // ② Lần 2: same-domain → đọc window.name
      callback(iframe.contentWindow.name);
      destoryFrame();
    } else if (state === 0) {
      // ① Lần 1: chuyển sang same-domain proxy
      iframe.contentWindow.location = "http://www.domain1.com/proxy.html";
      state = 1;
    }
  };
  document.body.appendChild(iframe);

  function destoryFrame() {
    iframe.contentWindow.document.write("");
    iframe.contentWindow.close();
    document.body.removeChild(iframe);
  }
};

proxy("http://www.domain2.com/b.html", function (data) {
  alert(data);
});

// ===== b.html (domain2) =====
window.name = "This is domain2 data!";

// ===== proxy.html (domain1) — NỘI DUNG TRỐNG =====
```

---

## 9. WebSocket Cross-Domain

> **🎯 HTML5 full-duplex protocol, HỖ TRỢ cross-domain natively**

```
WEBSOCKET — NGUYÊN LÝ:
═══════════════════════════════════════════════════════════════

  → Protocol MỚI của HTML5
  → Full-duplex: browser ↔ server
  → HỖ TRỢ cross-domain communication
  → Server push technology

  Thường dùng Socket.io:
  → Wrap WebSocket API cho dễ dùng
  → Backward compatible cho browsers cũ
```

```javascript
// ===== FRONTEND (Socket.io) =====
var socket = io("http://www.domain2.com:8080");
socket.on("connect", function () {
  socket.on("message", function (msg) {
    console.log("data from server: ---> " + msg);
  });
  socket.on("disconnect", function () {
    console.log("Server socket has closed.");
  });
});
document.getElementsByTagName("input")[0].onblur = function () {
  socket.send(this.value);
};

// ===== BACKEND (Node.js) =====
var http = require("http");
var socket = require("socket.io");
var server = http.createServer(function (req, res) {
  res.writeHead(200, { "Content-type": "text/html" });
  res.end();
});
server.listen("8080");

socket.listen(server).on("connection", function (client) {
  client.on("message", function (msg) {
    client.send("hello：" + msg);
  });
  client.on("disconnect", function () {
    console.log("Client socket has closed.");
  });
});
```

---

## 10. Forward Proxy vs Reverse Proxy

```
FORWARD PROXY vs REVERSE PROXY:
═══════════════════════════════════════════════════════════════

  ① FORWARD PROXY (Proxy xuôi):
  ┌──────┐     ┌─────────┐     ┌──────┐
  │Client│────►│ Forward │────►│Server│
  │(ẩn!) │     │  Proxy  │     │      │
  └──────┘     └─────────┘     └──────┘

  → Client KHÔNG THỂ truy cập server trực tiếp
  → Client set proxy → proxy forward request
  → ẨN REAL CLIENT khỏi server
  → Cần MODIFY CLIENT (VD: cấu hình browser)
  → VD: VPN, proxy bypass firewall

  ② REVERSE PROXY (Proxy ngược):
  ┌──────┐     ┌─────────┐     ┌──────┐
  │Client│────►│ Reverse │────►│Server│
  │      │     │  Proxy  │     │(ẩn!) │
  └──────┘     └─────────┘     └──────┘

  → Client request tới proxy (nghĩ là server thật)
  → Proxy forward tới REAL server theo rules
  → ẨN REAL SERVER khỏi client
  → Cần modify DNS (domain → proxy IP)
  → Browser KHÔNG BIẾT real server tồn tại
  → VD: Nginx load balancing, CDN

  SO SÁNH:
  ┌────────────────┬──────────────────┬──────────────────┐
  │ Tiêu chí        │ Forward Proxy    │ Reverse Proxy    │
  ├────────────────┼──────────────────┼──────────────────┤
  │ Ẩn ai?         │ ẨN CLIENT        │ ẨN SERVER        │
  │ Config bên nào │ CLIENT config    │ SERVER config    │
  │ Mục đích        │ Bypass firewall  │ Load balancing   │
  │                 │ Truy cập bị chặn│ Security, cache  │
  │ Structure       │ Client→Proxy→   │ Client→Proxy→   │
  │                 │ Server           │ Server           │
  └────────────────┴──────────────────┴──────────────────┘

  📌 CẢ HAI đều có kiến trúc Client → Proxy → Server
  📌 Khác nhau: BÊN NÀO config proxy
     → Forward: CLIENT config → ẩn client
     → Reverse: SERVER config → ẩn server
```

---

## 11. Nginx — Khái niệm & Nguyên lý

```
NGINX — TỔNG QUAN:
═══════════════════════════════════════════════════════════════

  → Lightweight WEB SERVER
  → Reverse proxy, load balancing, HTTP caching
  → ASYNCHRONOUS EVENT-DRIVEN (xử lý requests)
  → Designed for PERFORMANCE

  NGINX vs APACHE:
  ┌───────────────┬──────────────────┬──────────────────────┐
  │ Tiêu chí       │ Apache           │ Nginx                │
  ├───────────────┼──────────────────┼──────────────────────┤
  │ Mô hình       │ PROCESS-BASED    │ EVENT-DRIVEN          │
  │ Worker        │ 1 process =      │ 1 worker = NHIỀU     │
  │               │ 1 HTTP request   │ HTTP requests         │
  │ Performance   │ Thấp hơn         │ CAO HƠN ★            │
  └───────────────┴──────────────────┴──────────────────────┘

  ARCHITECTURE:
  ┌──────────────────────────────────────────────────────┐
  │                 MASTER PROCESS                       │
  │                      │                               │
  │          ┌───────────┼───────────┐                   │
  │          ▼           ▼           ▼                   │
  │    ┌──────────┐┌──────────┐┌──────────┐             │
  │    │ Worker 1 ││ Worker 2 ││ Worker 3 │             │
  │    │          ││          ││          │             │
  │    │ Handle   ││ Handle   ││ Handle   │             │
  │    │ NHIỀU    ││ NHIỀU    ││ NHIỀU    │             │
  │    │ requests ││ requests ││ requests │             │
  │    └──────────┘└──────────┘└──────────┘             │
  └──────────────────────────────────────────────────────┘

  → Master process → spawn worker processes
  → Mỗi worker xử lý HÀNG NGÀN requests đồng thời
  → ≠ Apache: mỗi process chỉ xử lý 1 request
```

---

## 12. Tóm Tắt & Câu Hỏi Phỏng Vấn

### Quick Reference

```
SAME-ORIGIN POLICY — QUICK REFERENCE:
═══════════════════════════════════════════════════════════════

  SAME-ORIGIN = Protocol + Domain + Port GIỐNG NHAU
  HẠN CHẾ: cookies/localStorage/IndexedDB, DOM, AJAX

  9 GIẢI PHÁP CROSS-DOMAIN:
    ① CORS         — Server set Access-Control headers (★)
    ② JSONP        — <script> tag, chỉ GET, không an toàn
    ③ postMessage  — HTML5 API, window/iframe communication
    ④ Nginx Proxy  — Reverse proxy, server-side
    ⑤ Node Proxy   — Express + http-proxy-middleware
    ⑥ document.domain — Cùng main domain, khác subdomain
    ⑦ location.hash — 3 pages (A↔B↔C), giao tiếp qua #
    ⑧ window.name  — Persist qua page loads (2MB)
    ⑨ WebSocket    — Full-duplex, native cross-domain

  CORS:
    Simple: HEAD/GET/POST + limited headers → no preflight
    Non-simple: PUT/DELETE/JSON → OPTIONS preflight first
    Cookie: withCredentials + Allow-Credentials + Allow-Origin≠*

  PROXY: Forward (ẩn client) vs Reverse (ẩn server)
  NGINX: Event-driven, lightweight, 1 worker = nhiều requests
```

### Câu Hỏi Phỏng Vấn Thường Gặp

**1. Same-Origin Policy là gì? Tại sao cần?**

> Same-Origin Policy yêu cầu **protocol + domain + port** phải giống nhau. Hạn chế 3 thứ: JS không truy cập cookies/localStorage/IndexedDB domain khác, không thao tác DOM domain khác, không gửi AJAX cross-domain. Mục đích: **bảo vệ thông tin user**. SOP chỉ hạn chế JS, không hạn chế browser load image/script (vì không gây security issue).

**2. CORS hoạt động thế nào? Simple vs Non-simple request?**

> Server set **Access-Control-Allow-Origin** header. **Simple request**: method GET/HEAD/POST + limited headers → browser gửi trực tiếp với Origin header. **Non-simple**: PUT/DELETE/application/json → browser gửi **preflight OPTIONS** trước → server OK → actual request. Giảm preflight: set **Access-Control-Max-Age**. Cookie: cần withCredentials + Allow-Credentials: true + Allow-Origin ≠ "\*".

**3. JSONP hoạt động ra sao? Ưu nhược điểm?**

> Lợi dụng `<script>` tag không bị SOP. Client tạo script tag với src chứa callback name → server wrap data trong callback function → browser execute. **Ưu**: đơn giản, tương thích tốt. **Nhược**: chỉ GET, không an toàn (XSS risk), không có error handling tốt.

**4. Có bao nhiêu cách giải quyết cross-domain?**

> 9 cách: ① **CORS** (phổ biến nhất), ② **JSONP** (chỉ GET), ③ **postMessage** (window/iframe), ④ **Nginx reverse proxy**, ⑤ **Node.js middleware proxy**, ⑥ **document.domain + iframe** (cùng main domain), ⑦ **location.hash + iframe** (3 pages), ⑧ **window.name + iframe** (2MB persist), ⑨ **WebSocket** (full-duplex).

**5. Forward Proxy vs Reverse Proxy?**

> Cả 2 đều: Client → Proxy → Server. **Forward**: client config proxy → **ẩn client** (VD: VPN). **Reverse**: server config proxy → **ẩn server** (VD: Nginx load balancing). Forward cần modify client; Reverse cần modify DNS.

**6. Nginx là gì? Tại sao nhanh?**

> Lightweight web server, reverse proxy, load balancing, HTTP caching. Nhanh vì **event-driven** (vs Apache process-based). Master process → spawn workers → mỗi worker xử lý **hàng ngàn requests** đồng thời (Apache: 1 process = 1 request).

**7. postMessage dùng khi nào?**

> **HTML5 API** cho cross-domain communication giữa: page ↔ window mới, nhiều windows, page ↔ iframe. API: `postMessage(data, origin)` — data nên JSON.stringify, origin là protocol+host+port ("\*" = any). Nhận qua `window.addEventListener('message', callback)`.

**8. document.domain + iframe hạn chế gì?**

> **CHỈ** dùng khi main domain GIỐNG, subdomain KHÁC (VD: parent.domain.com ↔ child.domain.com). Cả 2 pages set `document.domain = 'domain.com'` → thành same domain. **KHÔNG DÙNG ĐƯỢC** cho domains hoàn toàn khác nhau.

---

## Checklist Học Tập

- [ ] Hiểu Same-Origin Policy (protocol + domain + port)
- [ ] Biết 3 hạn chế của SOP (cookies, DOM, AJAX)
- [ ] Hiểu CORS: Simple vs Non-simple request + preflight
- [ ] Biết CORS cookie: 3 điều kiện (withCredentials, Allow-Credentials, Allow-Origin≠\*)
- [ ] Hiểu JSONP nguyên lý + nhược điểm (chỉ GET, XSS)
- [ ] Biết postMessage API (data, origin)
- [ ] Hiểu Nginx reverse proxy cross-domain
- [ ] Biết Node.js middleware proxy (webpack devServer)
- [ ] Phân biệt document.domain, location.hash, window.name
- [ ] Hiểu WebSocket cross-domain (full-duplex)
- [ ] Phân biệt Forward Proxy vs Reverse Proxy
- [ ] Biết Nginx: event-driven vs Apache process-based

---

_Cập nhật lần cuối: Tháng 2, 2026_
