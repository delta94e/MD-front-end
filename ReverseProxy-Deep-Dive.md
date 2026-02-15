# Forward Proxy & Reverse Proxy — Deep Dive

> 📅 2026-02-12 · ⏱ 10 phút đọc
>
> Nguồn: Front-end Dictionary — "How to Explain Reverse Proxy to Your Boss"
> Topics: Proxy, Forward Proxy, Reverse Proxy, Nginx, Load Balancing
> Độ khó: ⭐️⭐️⭐️ | Chủ đề: Network / DevOps / Interview

---

## Mục Lục

0. [Giải Thích Đơn Giản — Analogy](#analogy)
1. [Forward Proxy vs Reverse Proxy — Concepts](#concepts)
2. [Features & Differences](#features)
3. [Practical: VPN / Circumvention — Forward Proxy](#vpn)
4. [Practical: Nginx — Reverse Proxy](#nginx)
5. [Load Balancing — Nginx Config](#load-balancing)
6. [Cross-Origin — Dev Proxy](#cross-origin)
7. [Tóm Tắt & Checklist](#tóm-tắt)

---

## §0. Giải Thích Đơn Giản — Analogy

```
PROXY = TRUNG GIAN (Middleman)
═══════════════════════════════════════════════════════════════

  FORWARD PROXY — Ví dụ đặt cơm:
  ┌─────────────────────────────────────────────────────────┐
  │ Bạn (Client) muốn ĂN CƠM nhưng KHÔNG MUỐN ĐI MUA     │
  │ → Nhờ đồng nghiệp (Proxy) đi mua hộ                   │
  │ → Quán cơm (Server) KHÔNG BIẾT ai ăn, chỉ thấy proxy  │
  │                                                         │
  │    Bạn ──→ Đồng nghiệp ──→ Quán cơm                   │
  │    (Client)  (Forward Proxy)  (Server)                  │
  │                                                         │
  │ → Quán cơm KHÔNG BIẾT client thật sự là ai!            │
  │ → Client được GIẤU đi (hidden)                         │
  └─────────────────────────────────────────────────────────┘

  REVERSE PROXY — Ví dụ tổng đài:
  ┌─────────────────────────────────────────────────────────┐
  │ Bạn (Client) gọi điện tổng đài 1900xxxx                │
  │ → Tổng đài (Reverse Proxy) CHUYỂN cuộc gọi             │
  │ → Đến nhân viên A, B, hoặc C (Real Server)             │
  │ → Bạn KHÔNG BIẾT nhân viên nào xử lý!                  │
  │                                                         │
  │    Bạn ──→ Tổng đài ──→ Nhân viên A/B/C               │
  │    (Client) (Reverse Proxy) (Real Servers)              │
  │                                                         │
  │ → Client KHÔNG BIẾT server thật sự là ai!              │
  │ → Server được GIẤU đi (hidden)                         │
  └─────────────────────────────────────────────────────────┘

  TÓM LẠI:
  Forward Proxy: GIẤU CLIENT    (server không biết client thật)
  Reverse Proxy: GIẤU SERVER    (client không biết server thật)
```

---

## §1. Forward Proxy vs Reverse Proxy — Concepts

```
FORWARD PROXY — PROXY FOR CLIENT:
═══════════════════════════════════════════════════════════════

  ┌──────────┐     ┌──────────────┐     ┌──────────┐
  │  Client  │ ──→ │ FORWARD      │ ──→ │  Origin  │
  │  (You)   │ ←── │ PROXY Server │ ←── │  Server  │
  └──────────┘     └──────────────┘     └──────────┘
       ↑                   ↑                   ↑
    You know         Your middleman       Sees ONLY proxy
    the real         forwards             doesn't know
    destination      your request         real client!

  Definition:
  → Server nằm GIỮA client và origin server
  → Client gửi request → Proxy → chuyển tới origin server
  → Origin server trả response → Proxy → trả về client
  → CHỈ client biết và sử dụng forward proxy!
  → Server KHÔNG biết request thật từ đâu!

  Use cases:
  → VPN / Bypass firewall (vượt tường lửa)
  → Access restricted content
  → Anonymous browsing
  → Cache content
  → Content filtering (enterprise firewall)
```

```
REVERSE PROXY — PROXY FOR SERVER:
═══════════════════════════════════════════════════════════════

  ┌──────────┐     ┌──────────────┐     ┌──────────┐
  │  Client  │ ──→ │ REVERSE      │ ──→ │ Server A │
  │  (User)  │ ←── │ PROXY Server │ ──→ │ Server B │
  └──────────┘     └──────────────┘ ──→ │ Server C │
       ↑                   ↑            └──────────┘
    Sees ONLY         Load balancer         Real
    proxy IP          / gateway            servers
    doesn't know      distributes          HIDDEN!
    real server!      requests

  Definition:
  → Server accept requests từ Internet
  → Forward requests đến internal servers
  → Return kết quả cho client
  → Client NGHĨ proxy chính là server thật!
  → Khi resolve domain → nhận được IP của PROXY, không phải server thật!

  Use cases:
  → Load balancing (phân tải)
  → SSL termination
  → Caching
  → Security (hide internal infrastructure)
  → Compression
  → Web Application Firewall (WAF)
```

---

## §2. Features & Differences

```
FEATURES — FORWARD PROXY:
═══════════════════════════════════════════════════════════════

  ① Proxy for CLIENT → hides real client
  ② Server chỉ thấy proxy, KHÔNG thấy client thật
  ③ Tất cả users trong LAN có thể qua CÙNG 1 proxy
  ④ Server giao tiếp với proxy, không phải client
  ⑤ Client CHỦ ĐỘNG cấu hình proxy (biết mình dùng proxy)
```

```
FEATURES — REVERSE PROXY:
═══════════════════════════════════════════════════════════════

  ① Proxy for SERVER → hides real server
  ② Client chỉ thấy proxy, KHÔNG thấy server thật
  ③ Load balancer phân phối requests đến nhiều servers
  ④ Users giao tiếp với load balancer (proxy)
  ⑤ Client KHÔNG BIẾT mình đang nói chuyện với proxy
     → Resolve domain → nhận proxy IP!
```

```
COMPARISON TABLE:
═══════════════════════════════════════════════════════════════

  ┌───────────────────┬──────────────────┬──────────────────┐
  │                   │ Forward Proxy    │ Reverse Proxy    │
  ├───────────────────┼──────────────────┼──────────────────┤
  │ Proxy for         │ CLIENT           │ SERVER           │
  │ Hides             │ Client identity  │ Server identity  │
  │ Who doesn't know? │ Server ↛ client  │ Client ↛ server  │
  │ Configured by     │ Client (manual)  │ Server (admin)   │
  │ Client awareness  │ ✅ Yes (knows)   │ ❌ No (unaware!) │
  │ Primary purpose   │ Access control,  │ Load balancing,  │
  │                   │ bypass, privacy  │ security, cache  │
  ├───────────────────┼──────────────────┼──────────────────┤
  │ SIMILARITIES:                                           │
  │ → Both are middleman between client & server            │
  │ → Both enhance security (prevent direct attacks)        │
  │ → Both can implement caching for better performance     │
  └─────────────────────────────────────────────────────────┘
```

---

## §3. Practical: VPN / Circumvention — Forward Proxy

```
VPN AS FORWARD PROXY:
═══════════════════════════════════════════════════════════════

  SCENARIO: Access google.com from China
  → Bị GFW (Great Firewall) chặn!

  ┌──────────┐     ┌───────┐     ┌──────────┐     ┌────────┐
  │  You     │ ──→ │  GFW  │ ✗✗✗ │ Google   │     │        │
  │  (China) │     │ BLOCK │     │ .com     │     │        │
  └──────────┘     └───────┘     └──────────┘     │        │
                                                    │        │
  WITH VPN (Forward Proxy):                        │        │
  ┌──────────┐     ┌───────┐     ┌──────────┐     │        │
  │  You     │ ──→ │ VPN   │ ──→ │ Google   │     │        │
  │  (China) │ ←── │ Proxy │ ←── │ .com     │     │        │
  └──────────┘     │(abroad)│    └──────────┘     │        │
                   └───────┘                       │        │
                                                    │        │
  How it works:                                    │        │
  ① You → encrypted tunnel → VPN server (abroad)  │        │
  ② VPN server → request google.com               │        │
  ③ Google sees VPN server's IP (not yours!)       │        │
  ④ Google → response → VPN → you                 │        │
  → GFW thấy bạn kết nối VPN, KHÔNG thấy Google!  │        │
  → Google thấy VPN, KHÔNG thấy bạn!              │        │

  GFW (Great Firewall):
  → Analyzes & filters internet traffic China ↔ overseas
  → Can block BOTH directions (domestic → overseas AND overseas → domestic)
  → "Bypass/circumvent" = find a way around these restrictions
```

---

## §4. Practical: Nginx — Reverse Proxy

```
NGINX AS REVERSE PROXY:
═══════════════════════════════════════════════════════════════

  WITHOUT Nginx:
  Client ──→ Application Server (direct access)
  → Server exposed! Security risk!

  WITH Nginx (Reverse Proxy):
  Client ──→ Nginx ──→ Application Server
  → Client chỉ thấy Nginx, KHÔNG thấy app server!
  → App server HIDDEN behind Nginx!
```

```nginx
# Nginx Reverse Proxy Configuration
server {
    listen 8080;                         # Port lắng nghe
    server_name  192.168.1.1;            # Domain/IP truy cập
    root  /data/toor;                    # Thư mục gốc
    error_page 502 404 /page/404.html;   # Trang lỗi

    # Reverse Proxy: /api/ → forward to app server
    location ^~ /api/ {
        proxy_pass http://192.168.20.1:8080;  # App server thật!
    }
}
```

```
GIẢI THÍCH CONFIG:
═══════════════════════════════════════════════════════════════

  listen 8080:
  → Nginx lắng nghe port 8080

  server_name:
  → Domain hoặc IP mà client truy cập

  location ^~ /api/:
  → Tất cả requests bắt đầu bằng /api/
  → Sẽ được FORWARD đến proxy_pass

  proxy_pass http://192.168.20.1:8080:
  → App server thật (client KHÔNG biết IP này!)
  → Client chỉ thấy 192.168.1.1:8080

  FLOW:
  Client → GET /api/users
  → Nginx nhận (192.168.1.1:8080)
  → Forward → http://192.168.20.1:8080/api/users
  → App server respond → Nginx → Client
  → Client KHÔNG BIẾT 192.168.20.1 tồn tại!
```

---

## §5. Load Balancing — Nginx Config

```
LOAD BALANCING = PHÂN TẢI ĐỀU
═══════════════════════════════════════════════════════════════

  1 server không đủ → NHIỀU servers cùng xử lý!
  → Load balancer (Nginx) phân phối requests ĐỀU!

  ┌──────────┐     ┌──────────┐     ┌──────────────┐
  │  Client  │ ──→ │  Nginx   │ ──→ │ Server A (25%)│
  │  Client  │ ──→ │  (Load   │ ──→ │ Server B (25%)│
  │  Client  │ ──→ │ Balancer)│ ──→ │ Server C (25%)│
  │  Client  │ ──→ │          │ ──→ │ Server D (25%)│
  └──────────┘     └──────────┘     └──────────────┘
```

```nginx
# Load Balancing Configuration
upstream my_servers {
    server 192.168.2.1:8080 weight=1 max_fails=2 fail_timeout=30s;
    server 192.168.2.2:8080 weight=1 max_fails=2 fail_timeout=30s;
    server 192.168.2.3:8080 weight=1 max_fails=2 fail_timeout=30s;
    server 192.168.2.4:8080 weight=1 max_fails=2 fail_timeout=30s;
    # 30s nội fail 2 lần → coi như server DOWN!
}

server {
    listen 80;
    server_name example.com;

    location / {
        proxy_pass http://my_servers;  # Forward to upstream pool!
    }
}
```

```
LOAD BALANCING STRATEGIES:
═══════════════════════════════════════════════════════════════

  ① ROUND ROBIN (default):
  → Request 1 → Server A
  → Request 2 → Server B
  → Request 3 → Server C
  → Request 4 → Server D
  → Request 5 → Server A (loop!)
  → Phân phối ĐỀU, simple!

  ② WEIGHTED Round Robin:
  → weight=3: nhận GẤP 3 requests so với weight=1
  → Server mạnh hơn → weight cao hơn → xử lý nhiều hơn!

  upstream my_servers {
      server 192.168.2.1:8080 weight=3;  # 3x requests
      server 192.168.2.2:8080 weight=1;  # 1x requests
  }
  → Server A: 75% traffic | Server B: 25% traffic

  ③ IP-HASH:
  → Hash(client IP) → chọn server CỐ ĐỊNH!
  → Cùng client → luôn đến CÙNG server!
  → Useful: session persistence (sticky sessions)

  upstream my_servers {
      ip_hash;
      server 192.168.2.1:8080;
      server 192.168.2.2:8080;
  }

  ④ LEAST CONNECTIONS:
  → Forward đến server có ÍT connections nhất!
  → least_conn;

  COMPARISON:
  ┌──────────────────┬────────────────────────────────────┐
  │ Strategy         │ Best For                           │
  ├──────────────────┼────────────────────────────────────┤
  │ Round Robin      │ Equal servers, stateless apps      │
  │ Weighted         │ Mixed hardware (strong + weak)     │
  │ IP-Hash          │ Session persistence needed         │
  │ Least Conn       │ Long-lived connections, varied load│
  └──────────────────┴────────────────────────────────────┘
```

```
CONFIG PARAMS EXPLAINED:
═══════════════════════════════════════════════════════════════

  weight=1:
  → Trọng số: weight cao → nhận nhiều request hơn

  max_fails=2:
  → Số lần fail TỐI ĐA trước khi đánh dấu DOWN

  fail_timeout=30s:
  → Trong 30s, nếu fail 2 lần → server bị marked DOWN
  → Sau 30s → thử lại (health check)

  Ví dụ:
  → Server A fail 2 requests trong 30s
  → Nginx đánh dấu Server A DOWN
  → KHÔNG gửi request đến A trong 30s tiếp
  → Sau 30s → thử gửi lại → nếu OK → mark UP
```

---

## §6. Cross-Origin — Dev Proxy

```
DEV PROXY — GIẢI QUYẾT CORS:
═══════════════════════════════════════════════════════════════

  PROBLEM:
  Frontend: http://localhost:3000
  Backend:  http://192.168.20.1:8080
  → CORS ERROR! Different origin!

  SOLUTION: Dev server = reverse proxy!
  → Frontend server proxy requests to backend
  → Browser → localhost:3000/api → proxy → 192.168.20.1:8080
  → Browser thấy CÙNG origin → NO CORS!
```

```javascript
// vue-cli: vue.config.js (hoặc config/index.js)
module.exports = {
  devServer: {
    proxy: {
      "/weixin": {
        target: "http://192.168.20.1:8080/", // Backend URL
        secure: false, // Accept self-signed HTTPS
        changeOrigin: true, // SỬA origin header → tránh CORS!
        pathRewrite: {
          "^/weixin": "", // Xóa /weixin prefix
        },
      },
    },
  },
};

// Vite: vite.config.js
export default {
  server: {
    proxy: {
      "/api": {
        target: "http://192.168.20.1:8080",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ""),
      },
    },
  },
};

// FLOW:
// Browser: GET http://localhost:3000/weixin/user
// Dev server (proxy): GET http://192.168.20.1:8080/user
// → pathRewrite: '/weixin' → '' (removed!)
// → changeOrigin: true → Origin header = target (not localhost!)
// → Browser thấy response từ localhost → NO CORS!
```

```
changeOrigin EXPLAINED:
═══════════════════════════════════════════════════════════════

  changeOrigin: false (default):
  → Request header: Host: localhost:3000
  → Backend thấy Host khác với expected → có thể REJECT!

  changeOrigin: true:
  → Request header: Host: 192.168.20.1:8080
  → Backend thấy Host ĐÚNG → accept!

  ⚠️ Dev proxy CHỈ hoạt động trong DEVELOPMENT!
  → Production: dùng Nginx reverse proxy thay thế!
  → Hoặc: backend set CORS headers (Access-Control-Allow-Origin)
```

---

## Tóm Tắt

```
FORWARD vs REVERSE — ONE SENTENCE:
═══════════════════════════════════════════════════════════════

  FORWARD PROXY: "Tôi BIẾT tôi dùng proxy, server KHÔNG biết tôi là ai"
  → Proxy for CLIENT → hides CLIENT from server

  REVERSE PROXY: "Tôi KHÔNG biết có proxy, nhưng server thật bị giấu"
  → Proxy for SERVER → hides SERVER from client

  ┌─────────────────────────────────────────────────────────┐
  │ Forward: Client ──→ [PROXY] ──→ Server                 │
  │          Known       ↑          Unknown to server       │
  │                   Client sets                           │
  │                                                         │
  │ Reverse: Client ──→ [PROXY] ──→ Server                 │
  │          Unknown     ↑          Known                   │
  │          to client  Server sets                         │
  └─────────────────────────────────────────────────────────┘

  REAL-WORLD:
  → VPN/bypass = forward proxy (client-side)
  → Nginx/CDN = reverse proxy (server-side)
  → Dev proxy (vue-cli, Vite) = reverse proxy (solve CORS!)
  → Load balancer = reverse proxy + traffic distribution
```

### Checklist

- [ ] Forward proxy: client chủ động config, giấu client identity
- [ ] Reverse proxy: client không biết, giấu server identity
- [ ] Similarities: middleman, security, caching
- [ ] VPN = forward proxy (bypass GFW, anonymous browsing)
- [ ] Nginx reverse proxy: `proxy_pass` directive, hide app server
- [ ] Load balancing: upstream pool, round robin (default)
- [ ] Weighted: `weight=3` → nhận 3x traffic
- [ ] IP-Hash: `ip_hash` → same client → same server (sticky session)
- [ ] Least Connections: `least_conn` → send to least busy server
- [ ] `max_fails` + `fail_timeout`: health check mechanism
- [ ] Dev proxy: vue-cli `proxyTable` / Vite `server.proxy`
- [ ] `changeOrigin: true` → sửa Host header → solve CORS
- [ ] `pathRewrite`: remove prefix (e.g., `/api` → `''`)
- [ ] Dev proxy CHỈ cho development! Production → Nginx hoặc CORS headers

---

_Nguồn: Front-end Dictionary — "How to Explain Reverse Proxy to Your Boss"_
_Cập nhật lần cuối: Tháng 2, 2026_
