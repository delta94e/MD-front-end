# Cross-Domain Proxy — Deep Dive

> 📅 2026-02-12 · ⏱ 20 phút đọc
>
> 4 chủ đề: Cross-Origin là gì & Same-Origin Policy, Vite Dev Proxy
> (http-proxy), Nginx Production Proxy (reverse proxy), Backend CORS
> headers & tại sao Nginx giải quyết được cross-domain.
> Độ khó: ⭐️⭐️⭐️⭐️ | Chủ đề: Network / Deployment

---

## Mục Lục

0. [Cross-Domain là gì?](#0-cross-domain-là-gì)
1. [Dev Environment — Vite Reverse Proxy](#1-vite-reverse-proxy)
2. [Production — Nginx Reverse Proxy](#2-nginx-reverse-proxy)
3. [Backend CORS Headers](#3-backend-cors-headers)
4. [Tại sao Proxy giải quyết được Cross-Domain?](#4-tại-sao-proxy-giải-quyết-được)
5. [Tóm Tắt & Câu Hỏi Phỏng Vấn](#5-tóm-tắt--câu-hỏi-phỏng-vấn)

---

## 0. Cross-Domain là gì?

### Same-Origin Policy (SOP)

> **Same-Origin** = cùng **protocol** + **domain** + **port**.
> Browser **chặn response** nếu origin khác nhau (CORS error).

```
SAME-ORIGIN POLICY:
═══════════════════════════════════════════════════════════════

  http://example.com:3000/page

  ┌──────────┬──────────────┬──────┐
  │ Protocol │   Domain     │ Port │
  │  http    │ example.com  │ 3000 │
  └──────────┴──────────────┴──────┘

  So sánh với http://example.com:3000/page:
  ┌─────────────────────────────┬──────────┬─────────────────┐
  │ URL                         │ Same?    │ Lý do           │
  ├─────────────────────────────┼──────────┼─────────────────┤
  │ http://example.com:3000/api │ ✅ Same  │ Chỉ khác path   │
  │ https://example.com:3000    │ ❌ Cross │ Khác protocol    │
  │ http://api.example.com:3000 │ ❌ Cross │ Khác domain      │
  │ http://example.com:8080     │ ❌ Cross │ Khác port        │
  │ http://other.com:3000       │ ❌ Cross │ Khác domain      │
  └─────────────────────────────┴──────────┴─────────────────┘
```

### Lưu ý quan trọng

```
⚠️ CROSS-DOMAIN MISCONCEPTION:
═══════════════════════════════════════════════════════════════

  Request cross-origin ĐÃ GỬI đến server!
  Server ĐÃ TRẢ response bình thường!

  ┌──────────┐  request   ┌──────────┐
  │ Browser  │ ─────────→ │ Server   │
  │ :3000    │ ←───────── │ :8080    │
  └──────────┘  response  └──────────┘
       │                       ✅ Server xử lý OK
       │ ❌ Browser CHẶN response
       │    vì origin khác!
       ↓
  CORS Error in Console

  → Cross-domain là vấn đề của BROWSER, KHÔNG PHẢI server!
  → Server-to-server communication KHÔNG bị SOP!
```

---

## 1. Vite Reverse Proxy

### Tại sao cần Proxy trong Dev?

```
VẤN ĐỀ:
  Frontend: http://localhost:3000
  Backend:  http://192.168.1.100:8080
  → Khác origin → Browser CHẶN!

GIẢI PHÁP — VITE PROXY:
  Browser → Vite Dev Server (cùng origin!) → Backend
  ┌──────────┐  same    ┌──────────┐  server   ┌──────────┐
  │ Browser  │ origin   │ Vite Dev │ to       │ Backend  │
  │ :3000    │ ───────→ │ :3000    │ server   │ :8080    │
  │          │ ←─────── │ (proxy)  │ ←─────── │          │
  └──────────┘          └──────────┘          └──────────┘
  Browser → Vite = SAME ORIGIN (cùng :3000) ✅
  Vite → Backend = SERVER-TO-SERVER (không SOP) ✅
```

### vite.config.js Configuration

```javascript
// vite.config.js
import { defineConfig } from "vite";

export default defineConfig({
  server: {
    port: 3000,
    cors: true, // enable CORS headers on dev server response
    open: true, // auto open browser on start

    proxy: {
      // ═══════════════════════════════════════════════════
      // Scenario A: GIỮA path prefix (không rewrite)
      // ═══════════════════════════════════════════════════
      // Request: /aPath/login
      // Forward: http://33.133.190.116:8100/aPath/login
      "/aPath": {
        target: "http://33.133.190.116:8100",
        changeOrigin: true,
        // changeOrigin: true → Vite set Host header = target
        // → Backend nhận đúng Host (quan trọng!)
      },

      // ═══════════════════════════════════════════════════
      // Scenario B: XÓA path prefix (rewrite)
      // ═══════════════════════════════════════════════════
      // Request: /bPath/list
      // Forward: http://172.16.7.160:9022/list
      //          (bỏ /bPath prefix)
      "/bPath": {
        target: "http://172.16.7.160:9022",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/bPath/, ""),
      },

      // ═══════════════════════════════════════════════════
      // Scenario C: Proxy tất cả /api/*
      // ═══════════════════════════════════════════════════
      "/api": {
        target: "http://localhost:8080",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ""),
        // /api/users → http://localhost:8080/users
      },
    },
  },
});
```

### Giải thích các option

```
VITE PROXY OPTIONS:
  ┌────────────────┬────────────────────────────────────────┐
  │ target         │ Backend server URL                     │
  │ changeOrigin   │ true → set Host = target host          │
  │                │ (PHẢI true nếu backend check Host)     │
  │ rewrite        │ Function transform path trước khi forward│
  │ secure         │ true → verify SSL certificates         │
  │ ws             │ true → proxy WebSocket connections     │
  │ configure      │ Custom http-proxy-middleware config    │
  └────────────────┴────────────────────────────────────────┘
```

### Frontend Code — Gọi API

```javascript
// Frontend code (component)
// KHÔNG cần full URL, chỉ cần path prefix
const fetchData = async () => {
  // Scenario A: giữ prefix
  const res1 = await fetch("/aPath/login", { method: "POST" });
  // → Vite proxy → http://33.133.190.116:8100/aPath/login

  // Scenario B: xóa prefix
  const res2 = await fetch("/bPath/list");
  // → Vite proxy → http://172.16.7.160:9022/list

  // Scenario C: /api prefix
  const res3 = await fetch("/api/users");
  // → Vite proxy → http://localhost:8080/users
};

// ⚠️ Proxy CHỈ hoạt động trong DEV MODE (npm run dev)
// ⚠️ Build production → proxy KHÔNG CÒN hoạt động!
// → Cần Nginx reverse proxy cho production
```

---

## 2. Nginx Reverse Proxy

### Tại sao cần Nginx?

```
PRODUCTION DEPLOYMENT:
═══════════════════════════════════════════════════════════════

  Sau khi build (npm run build):
  → Chỉ còn static files (HTML/CSS/JS)
  → KHÔNG CÒN Vite dev server
  → KHÔNG CÒN proxy

  GIẢI PHÁP: Nginx làm 2 việc:
  ① Serve static files (HTML/CSS/JS)
  ② Reverse proxy API requests → Backend servers

  ┌──────────┐         ┌──────────┐         ┌──────────┐
  │ Browser  │ ──────→ │ Nginx    │ ──────→ │ Backend  │
  │          │ ←────── │ :80      │ ←────── │ :8080    │
  └──────────┘         └──────────┘         └──────────┘
  Same origin!         Serve HTML +         API server
                       Proxy API
```

### nginx.conf — Full Configuration

```nginx
# ═══════════════════════════════════════════════════════════
# GLOBAL CONFIGURATION
# ═══════════════════════════════════════════════════════════
user nginx;
worker_processes auto;           # auto-detect CPU cores
error_log /var/log/nginx/error.log notice;
pid /run/nginx.pid;

events {
    worker_connections 1024;     # max connections per worker
    use epoll;                   # high-performance event model (Linux)
}

http {
    include /etc/nginx/mime.types;
    default_type application/octet-stream;
    client_max_body_size 300m;   # support large file uploads

    # ───────────────────────────────────────────────────────
    # GZIP COMPRESSION (optimize transfer performance)
    # ───────────────────────────────────────────────────────
    gzip on;
    gzip_comp_level 5;           # compression level (1-9, 5 = balanced)
    gzip_types
        text/plain
        text/css
        application/json
        application/javascript
        text/xml
        application/xml;

    # ───────────────────────────────────────────────────────
    # SERVER BLOCK
    # ───────────────────────────────────────────────────────
    server {
        listen 80 default_server;
        server_name _;           # match any hostname

        # ═══════════════════════════════════════════════════
        # STATIC FILES (SPA)
        # ═══════════════════════════════════════════════════
        location / {
            root /usr/share/nginx/html;     # build output directory
            index index.html index.htm;
            try_files $uri $uri/ /index.html;
            # try_files: SPA routing support
            # /about → 404 as file → fallback → /index.html
            # → React Router handles client-side routing
        }

        # ═══════════════════════════════════════════════════
        # PROXY A: GIỮA path prefix
        # Request: /aPath/api → http://33.133.190.116:8100/aPath/api
        # ═══════════════════════════════════════════════════
        location ^~/aPath/ {
            proxy_pass http://33.133.190.116:8100/aPath/;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $remote_addr;
            proxy_read_timeout 3600s;        # long timeout (AI/SSE)
            proxy_buffering off;             # disable for streaming
            chunked_transfer_encoding on;    # support chunked response
        }

        # ═══════════════════════════════════════════════════
        # PROXY B: XÓA path prefix
        # Request: /bPath/api → http://172.16.7.160:9022/api
        # ═══════════════════════════════════════════════════
        location ^~/bPath/ {
            proxy_pass http://172.16.7.160:9022/;
            # ⚠️ Trailing slash sau URL = XÓA prefix!
            # /bPath/api → proxy_pass URL + /api → /api
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $remote_addr;
        }

        # ═══════════════════════════════════════════════════
        # SECURITY: block .ht files
        # ═══════════════════════════════════════════════════
        location ~ /\.ht {
            deny all;
        }
    }
}
```

### Giải thích chi tiết

```
NGINX LOCATION MATCHING:
  ┌───────────────┬────────────────────────────────────────┐
  │ =  /exact     │ Exact match (highest priority)        │
  │ ^~ /prefix    │ Prefix match (no regex after)         │
  │ ~  /regex/    │ Case-sensitive regex                   │
  │ ~* /regex/i   │ Case-insensitive regex                │
  │    /prefix    │ Normal prefix (lowest priority)       │
  └───────────────┴────────────────────────────────────────┘
  Priority: = > ^~ > ~ / ~* > normal prefix

PROXY_PASS — TRAILING SLASH RULE:
  ┌───────────────────────────────────┬─────────────────────┐
  │ proxy_pass http://host/path/     │ XÓA location prefix │
  │ proxy_pass http://host/path      │ GIỮ location prefix │
  │ proxy_pass http://host/          │ XÓA location prefix │
  │ proxy_pass http://host           │ GIỮ location prefix │
  └───────────────────────────────────┴─────────────────────┘
  ⚠️ Trailing slash (/) sau URL → xóa matched prefix!

PROXY HEADERS:
  ┌───────────────────────┬────────────────────────────────┐
  │ Host                  │ Original host header           │
  │ X-Real-IP             │ Client's real IP address       │
  │ X-Forwarded-For       │ Chain of proxy IP addresses    │
  │ X-Forwarded-Proto     │ Original protocol (http/https) │
  └───────────────────────┴────────────────────────────────┘
```

### try_files — SPA Routing

```
try_files $uri $uri/ /index.html:
═══════════════════════════════════════════════════════════════

  Request: GET /about/team

  Step 1: try $uri → /usr/share/nginx/html/about/team (file?)
          → NOT FOUND

  Step 2: try $uri/ → /usr/share/nginx/html/about/team/ (dir?)
          → NOT FOUND

  Step 3: fallback → /index.html
          → FOUND! Serve index.html
          → React Router handle /about/team client-side

  ⚠️ KHÔNG CÓ try_files:
  → GET /about → Nginx tìm file /about → 404!
  → SPA routing BỊ VỠ!
```

---

## 3. Backend CORS Headers

### Simple Request vs Preflight Request

```
CORS REQUEST TYPES:
═══════════════════════════════════════════════════════════════

  ① SIMPLE REQUEST (không preflight)
     Conditions (tất cả phải thỏa):
     → Method: GET / HEAD / POST
     → Headers: chỉ Accept, Content-Type (form), etc.
     → Content-Type: text/plain, multipart/form-data,
       application/x-www-form-urlencoded

     Browser ────GET /api/data────→ Server
     Browser ←───Response + CORS headers───

  ② PREFLIGHT REQUEST (có OPTIONS trước)
     Trigger khi: PUT/DELETE, custom headers, JSON content-type

     Browser ────OPTIONS /api/data────→ Server  (preflight)
     Browser ←───204 + CORS headers────
     Browser ────PUT /api/data────────→ Server  (actual)
     Browser ←───Response──────────────
```

### Backend CORS Response Headers

```
CORS RESPONSE HEADERS:
  ┌──────────────────────────────┬──────────────────────────┐
  │ Access-Control-Allow-Origin  │ Allowed origins          │
  │                              │ * hoặc specific origin   │
  ├──────────────────────────────┼──────────────────────────┤
  │ Access-Control-Allow-Methods │ GET, POST, PUT, DELETE   │
  ├──────────────────────────────┼──────────────────────────┤
  │ Access-Control-Allow-Headers │ Content-Type, Auth...    │
  ├──────────────────────────────┼──────────────────────────┤
  │ Access-Control-Allow-        │ true → cho phép gửi      │
  │ Credentials                  │ cookies cross-origin     │
  ├──────────────────────────────┼──────────────────────────┤
  │ Access-Control-Max-Age       │ Cache preflight (seconds)│
  └──────────────────────────────┴──────────────────────────┘

  ⚠️ Allow-Origin = * VÀ Allow-Credentials = true
     → KHÔNG ĐƯỢC! Browser reject!
     → Phải set specific origin khi dùng credentials
```

### Nginx thêm CORS Headers (nếu cần)

```nginx
# Nếu backend KHÔNG set CORS headers,
# Nginx có thể thêm:
location /api/ {
    proxy_pass http://backend:8080/;

    # Add CORS headers
    add_header Access-Control-Allow-Origin $http_origin;
    add_header Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS";
    add_header Access-Control-Allow-Headers "Content-Type, Authorization";
    add_header Access-Control-Allow-Credentials true;

    # Handle preflight
    if ($request_method = OPTIONS) {
        add_header Access-Control-Max-Age 86400;
        return 204;
    }
}
```

---

## 4. Tại sao Proxy giải quyết được?

```
TẠI SAO NGINX PROXY GIẢI QUYẾT CROSS-DOMAIN:
═══════════════════════════════════════════════════════════════

  CORE INSIGHT:
  "Cross-domain" chỉ tồn tại ở BROWSER!
  Server-to-server communication KHÔNG bị SOP!

  ┌──────────────────────────────────────────────────────────┐
  │ KHÔNG CÓ PROXY:                                        │
  │                                                        │
  │  Browser (:80) ──────────→ Backend (:8080)             │
  │  ❌ KHÁC PORT = CROSS-ORIGIN!                          │
  │  Browser CHẶN response!                                │
  └──────────────────────────────────────────────────────────┘

  ┌──────────────────────────────────────────────────────────┐
  │ CÓ NGINX PROXY:                                        │
  │                                                        │
  │  Browser (:80) ──→ Nginx (:80) ──→ Backend (:8080)    │
  │  ✅ SAME PORT!     Server-to-server                    │
  │  Browser → Nginx   (không SOP!)                        │
  │  = SAME ORIGIN ✅                                      │
  └──────────────────────────────────────────────────────────┘

  TƯƠNG TỰ CHO VITE DEV PROXY:
  ┌──────────────────────────────────────────────────────────┐
  │  Browser (:3000) ──→ Vite (:3000) ──→ Backend (:8080) │
  │  ✅ SAME PORT!       Server-to-server                  │
  └──────────────────────────────────────────────────────────┘
```

```
TỔNG KẾT CÁC GIẢI PHÁP CROSS-DOMAIN:
  ┌─────────────────┬──────────────┬──────────────┬──────────┐
  │ Solution        │ Environment  │ Who handles  │ Config   │
  ├─────────────────┼──────────────┼──────────────┼──────────┤
  │ Vite Proxy      │ Dev only     │ Frontend     │ Easy     │
  │ Nginx Proxy     │ Production   │ DevOps       │ Medium   │
  │ Backend CORS    │ Any          │ Backend      │ Easy     │
  │ JSONP           │ Any (GET)    │ Frontend     │ Limited  │
  │ postMessage     │ iframe       │ Frontend     │ Complex  │
  │ WebSocket       │ Any          │ Both         │ Medium   │
  └─────────────────┴──────────────┴──────────────┴──────────┘
  Recommend: Vite Proxy (dev) + Nginx Proxy (prod)
```

---

## 5. Tóm Tắt & Câu Hỏi Phỏng Vấn

### Quick Reference

```
CROSS-DOMAIN PROXY — QUICK REFERENCE:
═══════════════════════════════════════════════════════════════

  CROSS-DOMAIN:
    SOP        → Same protocol + domain + port
    Behavior   → Request gửi OK, browser CHẶN response
    Core       → Vấn đề BROWSER, không phải server

  VITE DEV PROXY:
    Config     → vite.config.js → server.proxy
    Key opts   → target, changeOrigin (true!), rewrite
    Giữ prefix → chỉ set target
    Xóa prefix → rewrite: path.replace(/^\/prefix/, "")
    ⚠️ CHỈ dev  → build production → mất proxy!

  NGINX PRODUCTION:
    Static     → location / { try_files → /index.html }
    Giữ prefix → proxy_pass http://host/prefix/
    Xóa prefix → proxy_pass http://host/  (trailing slash!)
    Headers    → Host, X-Real-IP, X-Forwarded-For
    SPA        → try_files $uri $uri/ /index.html
    Gzip       → gzip on; gzip_types text/css application/json...

  BACKEND CORS:
    Headers    → Allow-Origin, Allow-Methods, Allow-Headers
    Preflight  → OPTIONS request trước PUT/DELETE/JSON
    ⚠️ Origin=* + Credentials=true → KHÔNG ĐƯỢC!
```

### Câu Hỏi Phỏng Vấn

**1. Cross-domain là gì? Tại sao có?**

> Cross-domain do browser **Same-Origin Policy**: cùng protocol + domain + port mới là same-origin. Khác bất kỳ 1 trong 3 → browser **chặn response** (không phải chặn request). Request vẫn gửi đến server, server trả response bình thường, nhưng browser check origin → khác → block. SOP bảo vệ user khỏi malicious sites đọc data từ origin khác.

**2. Vite proxy hoạt động thế nào?**

> Vite dev server dùng **http-proxy** middleware. Browser gửi request đến **cùng origin** (localhost:3000) → Vite dev server nhận → forward đến backend (server-to-server, không SOP) → nhận response → trả cho browser. Config: `server.proxy` trong vite.config.js với `target`, `changeOrigin: true`, `rewrite` để transform path.

**3. Tại sao Nginx giải quyết được cross-domain?**

> Nginx serve cả static files VÀ proxy API → browser chỉ giao tiếp với **1 origin** (Nginx :80). Nginx → Backend là **server-to-server**, không bị SOP. Giống relay station: browser → Nginx (same origin) → Backend (no SOP). Đây là **reverse proxy** pattern.

**4. proxy_pass trailing slash có ý nghĩa gì?**

> **Có trailing slash** (`http://host/`): Nginx **xóa** matched location prefix, chỉ forward phần còn lại. `location /bPath/` + `proxy_pass http://host/` → `/bPath/api` forward thành `/api`. **Không trailing slash** (`http://host`): Nginx **giữ** nguyên full path. Đây là config detail hay bị sai!

**5. try_files dùng để làm gì?**

> `try_files $uri $uri/ /index.html`: Nginx thử serve file → thử folder → fallback về index.html. Cần cho **SPA routing** — khi user refresh `/about/team`, Nginx không có file `/about/team` → fallback → index.html → React Router xử lý client-side. Không có try_files → SPA route bị 404.

**6. Simple request vs Preflight request?**

> **Simple**: GET/HEAD/POST + basic headers + form content-type → browser gửi trực tiếp. **Preflight**: PUT/DELETE, custom headers, JSON content-type → browser gửi **OPTIONS** request trước → server trả CORS headers → browser check → nếu OK → gửi actual request. Preflight có thể cache bằng `Access-Control-Max-Age`.

---

## Checklist Học Tập

- [ ] Same-Origin Policy: cùng protocol + domain + port
- [ ] Cross-origin: browser chặn response, không phải request
- [ ] Vite proxy: server.proxy config (target, changeOrigin, rewrite)
- [ ] changeOrigin: true → set Host header = target host
- [ ] rewrite: path.replace transform path prefix
- [ ] Vite proxy CHỈ dev mode, mất sau build
- [ ] Nginx: reverse proxy cho production
- [ ] location matching priority: = > ^~ > ~ > normal
- [ ] proxy_pass trailing slash → xóa location prefix
- [ ] proxy_pass không trailing slash → giữ full path
- [ ] try_files → SPA routing fallback (/index.html)
- [ ] proxy_set_header: Host, X-Real-IP, X-Forwarded-For
- [ ] gzip on: optimize transfer (text/css, application/json...)
- [ ] Backend CORS: Allow-Origin, Allow-Methods, Allow-Headers
- [ ] Simple vs Preflight request (OPTIONS)
- [ ] Origin=\* + Credentials=true → browser reject
- [ ] Proxy giải quyết vì: browser → proxy = same origin, proxy → backend = no SOP

---

_Cập nhật lần cuối: Tháng 2, 2026_
