# Nginx cho Frontend Developer — Deep Dive!

> **Chủ đề**: Nginx — Kiến Thức Cần Thiết Cho Frontend Developer!
> **Ngôn ngữ**: Tiếng Việt — giải thích cực kỳ chi tiết!
> **Phương châm**: Tự viết lại bằng tay — KHÔNG dùng thư viện!
> **Nguồn**: "A brief discussion of Nginx knowledge required for front-end development" — Juejin

---

## Mục Lục

1. [§1. Nginx Là Gì? Tại Sao Frontend Cần Biết?](#1)
2. [§2. Forward Proxy vs Reverse Proxy!](#2)
3. [§3. Reverse Proxy — Cấu Hình Chi Tiết!](#3)
4. [§4. Load Balancing — 6 Chiến Lược!](#4)
5. [§5. Health Check — Kiểm Tra Sức Khỏe Server!](#5)
6. [§6. HTTPS — Cấu Hình SSL!](#6)
7. [§7. Static Resource Server!](#7)
8. [§8. Tách Tĩnh Động — Dynamic-Static Separation!](#8)
9. [§9. Tự Động Chuyển Hướng PC ↔ Mobile!](#9)
10. [§10. Gzip — Nén Tĩnh!](#10)
11. [§11. CORS — Xử Lý Cross-Domain!](#11)
12. [§12. IP Whitelist + Request Filtering!](#12)
13. [§13. Anti-Hotlinking + Cache Control!](#13)
14. [§14. Cài Đặt + Cấu Hình Nginx!](#14)
15. [§15. Sơ Đồ Tổng Hợp!](#15)
16. [§16. Tự Viết — NginxSimulator!](#16)
17. [§17. Câu Hỏi Luyện Tập!](#17)

---

## §1. Nginx Là Gì? Tại Sao Frontend Cần Biết?

```
  NGINX LÀ GÌ:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  Nginx = Engine X!                                             │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ → Web Server NHẸ + NHANH!                          │    │
  │  │ → Reverse Proxy Server!                             │    │
  │  │ → Email Proxy (IMAP/POP3)!                          │    │
  │  │ → Load Balancer!                                    │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  TẠI SAO FRONTEND CẦN BIẾT:                                   │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ ① Cross-domain proxy → CORS issues!                │    │
  │  │ ② CI/CD → deploy code!                             │    │
  │  │ ③ Debug production issues!                          │    │
  │  │ ④ Công ty nhỏ → Frontend tự deploy! ★            │    │
  │  │ ⑤ Hiểu vì sao, KHÔNG chỉ biết làm gì!           │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  NGINX LÀM ĐƯỢC GÌ:                                           │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ ★ Reverse Proxy → giải quyết cross-domain!        │    │
  │  │ ★ Load Balancing → phân tải giữa servers!         │    │
  │  │ ★ Dynamic-Static Separation → tách tĩnh/động!    │    │
  │  │ ★ Request Filtering → lọc request bất hợp lệ!   │    │
  │  │ ★ Gzip Compression → nén file nhỏ hơn!           │    │
  │  │ ★ Static Resource Server → serve file tĩnh!       │    │
  │  │ ★ Rate Limiting → giới hạn request!               │    │
  │  │ ★ Caching → cache tài nguyên!                     │    │
  │  │ ★ Security Control → kiểm soát bảo mật!          │    │
  │  │ ★ HTTPS Configuration → ssl/tls!                   │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  ĐẶC ĐIỂM NỔI BẬT:                                           │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ ★ NHANH HƠN:                                       │    │
  │  │   → Thời gian phản hồi từng request RẤT NHANH!   │    │
  │  │                                                      │    │
  │  │ ★ KHẢ NĂNG MỞ RỘNG CAO:                           │    │
  │  │   → Thiết kế module hóa!                           │    │
  │  │   → Nhiều module khác nhau, coupling THẤP!         │    │
  │  │                                                      │    │
  │  │ ★ ĐỘ TIN CẬY CAO:                                 │    │
  │  │   → Nhiều website traffic LỚN dùng Nginx!         │    │
  │  │                                                      │    │
  │  │ ★ TIẾT KIỆM BỘ NHỚ:                               │    │
  │  │   → 10,000 HTTP Keep-Alive connections              │    │
  │  │     CHỈ tốn ~2.5MB RAM! ★                         │    │
  │  │                                                      │    │
  │  │ ★ CONCURRENT CAO:                                   │    │
  │  │   → 1 máy > 100,000 concurrent connections!       │    │
  │  │                                                      │    │
  │  │ ★ HOT DEPLOYMENT:                                   │    │
  │  │   → Master process + Worker processes TÁCH BIỆT!  │    │
  │  │   → Reload config KHÔNG cần tắt server!           │    │
  │  │                                                      │    │
  │  │ ★ OPEN SOURCE (BSD License):                        │    │
  │  │   → Miễn phí! Có thể sửa source code!            │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  ỨNG DỤNG:                                                     │
  │  ┌──────────────────┬──────────────────────────────┐         │
  │  │ HTTP Server      │ Serve trang tĩnh!           │         │
  │  │ Static Server    │ Upload + serve static files! │         │
  │  │ Reverse Proxy    │ Chuyển tiếp request!        │         │
  │  │ Load Balancer    │ Phân tải nhiều server!      │         │
  │  │ Dynamic-Static   │ Tách tĩnh/động!            │         │
  │  └──────────────────┴──────────────────────────────┘         │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```

---

## §2. Forward Proxy vs Reverse Proxy!

```
  PROXY LÀ GÌ:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  Proxy = Một lớp server TRUNG GIAN!                           │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ → Đứng GIỮA client và target server!              │    │
  │  │ → Nhận request từ client!                          │    │
  │  │ → Chuyển tiếp tới target server!                   │    │
  │  │ → Nhận response từ target server!                  │    │
  │  │ → Trả response về client!                          │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  ① FORWARD PROXY (Proxy Xuôi):                                │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │                                                      │    │
  │  │  ┌────────┐    ┌─────────┐    ┌──────────────┐     │    │
  │  │  │ Client │───→│ Forward │───→│ Target Server│     │    │
  │  │  │ (User) │←───│ Proxy   │←───│ (YouTube)    │     │    │
  │  │  └────────┘    └─────────┘    └──────────────┘     │    │
  │  │                                                      │    │
  │  │  → Client BIẾT target server!                       │    │
  │  │  → Target server KHÔNG BIẾT client thật! ★         │    │
  │  │  → Proxy ĐẠI DIỆN cho client!                     │    │
  │  │                                                      │    │
  │  │  VÍ DỤ THỰC TẾ:                                     │    │
  │  │  → VPN truy cập YouTube, Facebook!                 │    │
  │  │  → Client gửi request tới VPN server!              │    │
  │  │  → VPN chuyển tiếp tới YouTube!                    │    │
  │  │  → YouTube chỉ thấy IP của VPN! ★                 │    │
  │  │  → YouTube KHÔNG biết user thật là ai!             │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  ② REVERSE PROXY (Proxy Ngược):                               │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │                                                      │    │
  │  │  ┌────────┐    ┌─────────┐    ┌──────────────┐     │    │
  │  │  │ Client │───→│ Reverse │───→│ Server A     │     │    │
  │  │  │ (User) │←───│ Proxy   │    │ Server B     │     │    │
  │  │  └────────┘    │(Nginx)  │    │ Server C     │     │    │
  │  │                └─────────┘    └──────────────┘     │    │
  │  │                                                      │    │
  │  │  → Client KHÔNG BIẾT target server thật! ★         │    │
  │  │  → Target server ẨN IP khỏi client!               │    │
  │  │  → Proxy ĐẠI DIỆN cho server!                     │    │
  │  │                                                      │    │
  │  │  VÍ DỤ THỰC TẾ:                                     │    │
  │  │  → User truy cập www.example.com!                   │    │
  │  │  → Nginx nhận request!                              │    │
  │  │  → Nginx CHỌN server phù hợp!                     │    │
  │  │  → Trả response về user!                           │    │
  │  │  → User KHÔNG biết server nào xử lý! ★            │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  SO SÁNH:                                                      │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │                                                      │    │
  │  │  ┌───────────────┬───────────────┬────────────────┐ │    │
  │  │  │               │ Forward Proxy │ Reverse Proxy  │ │    │
  │  │  ├───────────────┼───────────────┼────────────────┤ │    │
  │  │  │ Đại diện cho │ CLIENT ★     │ SERVER ★      │ │    │
  │  │  │ Client biết   │ Target server │ Proxy server   │ │    │
  │  │  │ Server biết   │ Proxy server  │ Real client    │ │    │
  │  │  │ Ai ẩn danh?  │ CLIENT ẩn ★  │ SERVER ẩn ★  │ │    │
  │  │  │ Ví dụ        │ VPN           │ Nginx          │ │    │
  │  │  └───────────────┴───────────────┴────────────────┘ │    │
  │  │                                                      │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  REVERSE PROXY ĐỂ LÀM GÌ:                                    │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ ★ Firewall (Tường lửa):                            │    │
  │  │   → Client KHÔNG truy cập trực tiếp server!      │    │
  │  │   → Nginx LỌC request bất hợp lệ!                │    │
  │  │   → BẢO VỆ server nội bộ! ★                      │    │
  │  │                                                      │    │
  │  │ ★ Load Balancing:                                   │    │
  │  │   → Phân tải ĐỀU cho tất cả servers!             │    │
  │  │   → Tránh 1 server bị quá tải!                    │    │
  │  │                                                      │    │
  │  │ ★ Ẩn IP Server:                                    │    │
  │  │   → Client chỉ thấy IP của Nginx!                 │    │
  │  │   → Server thật HOÀN TOÀN ẩn!                    │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```

---

## §3. Reverse Proxy — Cấu Hình Chi Tiết!

```
  REVERSE PROXY CONFIG:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  VÍ DỤ: Proxy Node.js server (port 8000) qua port 80:       │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │                                                      │    │
  │  │  # nginx.conf                                        │    │
  │  │  server {                                             │    │
  │  │      listen 80;                                       │    │
  │  │      server_name localhost;                           │    │
  │  │                                                      │    │
  │  │      location / {                                     │    │
  │  │          proxy_pass http://127.0.0.1:8000;           │    │
  │  │      }                                                │    │
  │  │  }                                                    │    │
  │  │                                                      │    │
  │  │  GIẢI THÍCH:                                          │    │
  │  │  → listen 80: Nginx lắng nghe port 80!             │    │
  │  │  → server_name: Domain name / hostname!              │    │
  │  │  → location /: Match TẤT CẢ request path!          │    │
  │  │  → proxy_pass: Chuyển tiếp tới Node.js server!     │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  FLOW:                                                         │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │                                                      │    │
  │  │  Client          Nginx (port 80)     Node.js (8000) │    │
  │  │    │                  │                    │          │    │
  │  │    │─── GET / ───────→│                    │          │    │
  │  │    │                  │─── proxy_pass ────→│          │    │
  │  │    │                  │                    │          │    │
  │  │    │                  │←── response ───────│          │    │
  │  │    │←── response ─────│                    │          │    │
  │  │    │                  │                    │          │    │
  │  │                                                      │    │
  │  │  → Client chỉ giao tiếp với Nginx (port 80)!       │    │
  │  │  → Client KHÔNG biết Node.js server ở port 8000!   │    │
  │  │  → Nginx làm trung gian! ★                         │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  KEYWORD QUAN TRỌNG:                                           │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ ★ location: Match URI pattern!                      │    │
  │  │   location /          → match TẤT CẢ!             │    │
  │  │   location /api/      → match /api/xxx!             │    │
  │  │   location ~* \.js$   → match file .js (regex)!    │    │
  │  │                                                      │    │
  │  │ ★ proxy_pass: Chuyển tiếp tới upstream server!     │    │
  │  │ ★ proxy_set_header: Set request headers!            │    │
  │  │   → Host $host;                                     │    │
  │  │   → X-Real-IP $remote_addr;                         │    │
  │  │   → X-Forwarded-For $proxy_add_x_forwarded_for;    │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```

---

## §4. Load Balancing — 6 Chiến Lược!

```
  LOAD BALANCING:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  LOAD BALANCING LÀ GÌ:                                        │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ → 1 server KHÔNG ĐỦ → thêm NHIỀU servers!        │    │
  │  │ → Phân tải request ĐỀU giữa các servers!          │    │
  │  │ → 1 server chết → chuyển sang server khác! ★      │    │
  │  │ → Tăng ĐỘ ỔN ĐỊNH + hiệu suất!                  │    │
  │  │ → Ứng dụng của REVERSE PROXY! ★                   │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  SƠ ĐỒ:                                                       │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │                                                      │    │
  │  │  ┌─────────┐                                        │    │
  │  │  │ Client  │ ×1000 requests!                        │    │
  │  │  └────┬────┘                                        │    │
  │  │       ↓                                              │    │
  │  │  ┌──────────────┐                                   │    │
  │  │  │ Nginx        │ ← Load Balancer!                 │    │
  │  │  │ (Phân tải!) │                                   │    │
  │  │  └──┬───┬───┬───┘                                   │    │
  │  │     ↓   ↓   ↓                                       │    │
  │  │  ┌──┐ ┌──┐ ┌──┐                                    │    │
  │  │  │S1│ │S2│ │S3│ ← Cluster servers!                 │    │
  │  │  │  │ │  │ │  │                                     │    │
  │  │  │  │ │  │ │  │                                     │    │
  │  │  └──┘ └──┘ └──┘                                    │    │
  │  │  333  333  334  ← requests mỗi server!             │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  ① ROUND ROBIN (Mặc Định!):                                  │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ → Phân phối TUẦN TỰ cho từng server!              │    │
  │  │ → Request 1 → Server A                             │    │
  │  │ → Request 2 → Server B                             │    │
  │  │ → Request 3 → Server C                             │    │
  │  │ → Request 4 → Server A (lặp lại!)                 │    │
  │  │                                                      │    │
  │  │ ⚠️ Nhược điểm: Nếu 1 server CHẬM →              │    │
  │  │    TẤT CẢ users gán cho server đó đều chậm!     │    │
  │  │                                                      │    │
  │  │ # nginx.conf                                         │    │
  │  │ upstream balanceServer {                              │    │
  │  │     server 192.168.0.1;                               │    │
  │  │     server 192.168.0.2;                               │    │
  │  │ }                                                     │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  ② WEIGHTED (Trọng Số!):                                     │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ → Gán TRỌNG SỐ cho mỗi server!                   │    │
  │  │ → Weight CAO → nhận NHIỀU request hơn!            │    │
  │  │ → Server mạnh → weight lớn!                       │    │
  │  │ → Server yếu → weight nhỏ!                       │    │
  │  │                                                      │    │
  │  │ # nginx.conf                                         │    │
  │  │ upstream balanceServer {                              │    │
  │  │     server 192.168.0.1 weight=2;  # 20% traffic    │    │
  │  │     server 192.168.0.2 weight=8;  # 80% traffic    │    │
  │  │ }                                                     │    │
  │  │                                                      │    │
  │  │ → Tổng weight = 10                                  │    │
  │  │ → Server 1: 2/10 = 20% requests!                   │    │
  │  │ → Server 2: 8/10 = 80% requests!                   │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  ③ LEAST CONNECTIONS (Ít Kết Nối Nhất!):                     │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ → Gửi request tới server có ÍT connections nhất!  │    │
  │  │ → Cân bằng độ dài HÀNG ĐỢI!                     │    │
  │  │ → Tránh server bận nhận thêm request!             │    │
  │  │                                                      │    │
  │  │ # nginx.conf                                         │    │
  │  │ upstream balanceServer {                              │    │
  │  │     least_conn;                                       │    │
  │  │     server 10.1.22.33:12345;                          │    │
  │  │     server 10.1.22.34:12345;                          │    │
  │  │     server 10.1.22.35:12345;                          │    │
  │  │ }                                                     │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  ④ IP HASH (Client IP Binding!):                              │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ → Cùng 1 IP → LUÔN gửi tới CÙNG 1 server!       │    │
  │  │ → Giải quyết vấn đề SESSION SHARING! ★           │    │
  │  │ → User login ở Server A → luôn quay lại A!       │    │
  │  │                                                      │    │
  │  │ # nginx.conf                                         │    │
  │  │ upstream balanceServer {                              │    │
  │  │     ip_hash;                                          │    │
  │  │     server 10.1.22.33:12345;                          │    │
  │  │     server 10.1.22.34:12345;                          │    │
  │  │     server 10.1.22.35:12345;                          │    │
  │  │ }                                                     │    │
  │  │                                                      │    │
  │  │ ⚠️ TẠI SAO CẦN IP HASH:                            │    │
  │  │ → Round Robin: User login Server A!                 │    │
  │  │ → Next request → Server B (KHÔNG có session!)     │    │
  │  │ → User phải login LẠI! ❌                         │    │
  │  │ → IP Hash: LUÔN quay lại Server A! ✅             │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  ⑤ FAIR (Fastest Response — Third-party!):                    │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ → Gửi request tới server PHẢN HỒI NHANH nhất!    │    │
  │  │ → Cần cài plugin: nginx-upstream-fair!              │    │
  │  │                                                      │    │
  │  │ # nginx.conf                                         │    │
  │  │ upstream balanceServer {                              │    │
  │  │     fair;                                             │    │
  │  │     server 10.1.22.33:12345;                          │    │
  │  │     server 10.1.22.34:12345;                          │    │
  │  │ }                                                     │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  ⑥ URL HASH (Third-party!):                                   │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ → Cùng 1 URL → LUÔN tới CÙNG 1 server!           │    │
  │  │ → Tăng hiệu quả CACHE! ★                          │    │
  │  │ → /api/users luôn tới Server A!                    │    │
  │  │ → /api/posts luôn tới Server B!                    │    │
  │  │                                                      │    │
  │  │ # nginx.conf                                         │    │
  │  │ upstream balanceServer {                              │    │
  │  │     hash $request_uri;                                │    │
  │  │     server 192.168.244.1:8080;                        │    │
  │  │     server 192.168.244.2:8080;                        │    │
  │  │ }                                                     │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  SO SÁNH 6 CHIẾN LƯỢC:                                        │
  │  ┌───────────────┬──────────────┬──────────────────────┐     │
  │  │ Chiến lược   │ Keyword      │ Use Case             │     │
  │  ├───────────────┼──────────────┼──────────────────────┤     │
  │  │ Round Robin   │ (mặc định)  │ Server GIỐNG nhau   │     │
  │  │ Weighted      │ weight=N     │ Server KHÁC cấu hình│     │
  │  │ Least Conn    │ least_conn   │ Request KHÁC thời gian│    │
  │  │ IP Hash       │ ip_hash      │ Cần SESSION!        │     │
  │  │ Fair          │ fair (3rd)   │ Ưu tiên server nhanh│     │
  │  │ URL Hash      │ hash $uri    │ Tối ưu CACHE!      │     │
  │  └───────────────┴──────────────┴──────────────────────┘     │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```

---

## §5. Health Check — Kiểm Tra Sức Khỏe Server!

```
  HEALTH CHECK:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  MODULE: ngx_http_upstream_module!                             │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ → Server heartbeat check!                           │    │
  │  │ → Định kỳ gửi health check request!               │    │
  │  │ → Kiểm tra server có BẤT THƯỜNG không!            │    │
  │  │ → Server lỗi → NGỪNG gửi request! ★              │    │
  │  │ → Đợi health check PASS → gửi lại!               │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  CẤU HÌNH:                                                     │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ upstream backserver {                                 │    │
  │  │     server 192.168.0.1                                │    │
  │  │            max_fails=1                                │    │
  │  │            fail_timeout=40s;                          │    │
  │  │     server 192.168.0.2                                │    │
  │  │            max_fails=1                                │    │
  │  │            fail_timeout=40s;                          │    │
  │  │ }                                                     │    │
  │  │ server {                                              │    │
  │  │     listen 80;                                        │    │
  │  │     server_name localhost;                             │    │
  │  │     location / {                                      │    │
  │  │         proxy_pass http://backserver;                 │    │
  │  │     }                                                 │    │
  │  │ }                                                     │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  THAM SỐ:                                                      │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ ★ fail_timeout (mặc định: 10s):                    │    │
  │  │   → Khoảng thời gian ĐẾM SỐ LẦN FAIL!          │    │
  │  │   → Server bị đánh dấu "unavailable"              │    │
  │  │     trong khoảng thời gian này!                     │    │
  │  │                                                      │    │
  │  │ ★ max_fails (mặc định: 1):                         │    │
  │  │   → Số lần THẤT BẠI tối đa!                     │    │
  │  │   → Vượt quá → server bị LOẠI! ★                │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  FLOW:                                                         │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │  ┌────────┐    ┌──────────┐    ┌──────┐ ← OK!     │    │
  │  │  │ Client │───→│  Nginx   │───→│ S1 ✅│            │    │
  │  │  │        │    │          │    └──────┘            │    │
  │  │  │        │    │          │    ┌──────┐ ← FAIL!    │    │
  │  │  │        │    │          │  ✗ │ S2 ❌│            │    │
  │  │  │        │    │          │    └──────┘            │    │
  │  │  │        │    │          │    ┌──────┐ ← OK!     │    │
  │  │  │        │    │          │───→│ S3 ✅│            │    │
  │  │  └────────┘    └──────────┘    └──────┘            │    │
  │  │                                                      │    │
  │  │  → S2 fail > max_fails trong fail_timeout!         │    │
  │  │  → Nginx NGỪNG gửi request tới S2!                │    │
  │  │  → Chuyển tới S1, S3!                               │    │
  │  │  → Sau fail_timeout → check lại S2!                │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```

---

## §6. HTTPS — Cấu Hình SSL!

```
  HTTPS:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  HTTPS LÀ GÌ:                                                 │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ → HTTP + SSL/TLS encryption!                        │    │
  │  │ → Port 443 (mặc định!) thay vì port 80!           │    │
  │  │ → Mã hóa dữ liệu truyền tải!                    │    │
  │  │ → Cần: Certificate file (.crt) + Private key (.key)│    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  QUY TRÌNH LẤY SSL CERTIFICATE:                               │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ ① Tạo private key file (.key)!                     │    │
  │  │ ② Tạo CSR file (.csr) — Certificate Signing Req!  │    │
  │  │ ③ Gửi CSR tới CA (Certificate Authority)!          │    │
  │  │ ④ CA ký → trả về CRT file (.crt)! ★              │    │
  │  │ ⑤ Cấu hình Nginx với .crt + .key!                 │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  CẤU HÌNH NGINX HTTPS:                                        │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ # nginx.conf                                         │    │
  │  │ server {                                              │    │
  │  │     listen 443 ssl;                                   │    │
  │  │     server_name example.com;                          │    │
  │  │                                                      │    │
  │  │     # Certificate file (chứng chỉ SSL!)            │    │
  │  │     ssl_certificate     /path/to/example.com.crt;   │    │
  │  │                                                      │    │
  │  │     # Private key file (khóa bí mật!)              │    │
  │  │     ssl_certificate_key /path/to/example.com.key;   │    │
  │  │ }                                                     │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  GIẢI THÍCH:                                                    │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ ★ listen 443 ssl:                                   │    │
  │  │   → Lắng nghe port 443 + bật ssl!                  │    │
  │  │   → 443 = port HTTPS mặc định!                    │    │
  │  │   → 80 = port HTTP mặc định!                      │    │
  │  │                                                      │    │
  │  │ ★ ssl_certificate:                                  │    │
  │  │   → Đường dẫn TUYỆT ĐỐI tới file .crt!         │    │
  │  │   → Chứng chỉ SSL (công khai!)                    │    │
  │  │                                                      │    │
  │  │ ★ ssl_certificate_key:                              │    │
  │  │   → Đường dẫn TUYỆT ĐỐI tới file .key!         │    │
  │  │   → Khóa bí mật (KHÔNG công khai!) ★              │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  FLOW HTTPS:                                                    │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │  Client          Nginx (443)        Backend          │    │
  │  │    │                  │                   │           │    │
  │  │    │── TLS Handshake →│                   │           │    │
  │  │    │← Certificate ───│                   │           │    │
  │  │    │── Encrypted ────→│── proxy_pass ───→│           │    │
  │  │    │← Encrypted ─────│← response ──────│           │    │
  │  │    │                  │                   │           │    │
  │  │  → Dữ liệu MÃ HÓA giữa Client ↔ Nginx!         │    │
  │  │  → Nginx ↔ Backend có thể KHÔNG mã hóa!          │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```

---

## §7. Static Resource Server!

```
  STATIC RESOURCE SERVER:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  NGINX LÀM STATIC SERVER:                                     │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ → Serve file HTML, CSS, JS, images!                 │    │
  │  │ → KHÔNG cần backend server!                         │    │
  │  │ → Cung cấp tính năng upload!                       │    │
  │  │ → Các ứng dụng khác lấy static resources!         │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  CẤU HÌNH:                                                     │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ # nginx.conf                                         │    │
  │  │ server {                                              │    │
  │  │     listen 80;                                        │    │
  │  │     server_name example.com;                          │    │
  │  │     root /var/www/example.com;                        │    │
  │  │                                                      │    │
  │  │     # Match ảnh: png, gif, jpg, jpeg!               │    │
  │  │     location ~* \.(png|gif|jpg|jpeg)$ {              │    │
  │  │         expires 30d;                                  │    │
  │  │         add_header Cache-Control "public";           │    │
  │  │         autoindex on;                                 │    │
  │  │         access_log off;                               │    │
  │  │         try_files $uri $uri/ /index.php$is_args$args;│    │
  │  │     }                                                 │    │
  │  │ }                                                     │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  GIẢI THÍCH TỪNG DÒNG:                                         │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ ★ root /var/www/example.com:                        │    │
  │  │   → THƯ MỤC GỐC chứa static files!               │    │
  │  │   → Request /img/logo.png                            │    │
  │  │     → /var/www/example.com/img/logo.png! ★          │    │
  │  │                                                      │    │
  │  │ ★ location ~* \.(png|gif|jpg|jpeg)$:                │    │
  │  │   → ~* = REGEX + case-insensitive!                  │    │
  │  │   → Match file ĐUÔI .png, .gif, .jpg, .jpeg!       │    │
  │  │                                                      │    │
  │  │ ★ expires 30d:                                      │    │
  │  │   → Cache 30 ngày! Browser KHÔNG request lại!      │    │
  │  │                                                      │    │
  │  │ ★ add_header Cache-Control "public":                │    │
  │  │   → Cho phép mọi proxy CACHE!                      │    │
  │  │                                                      │    │
  │  │ ★ autoindex on:                                     │    │
  │  │   → Hiển thị danh sách file trong folder!          │    │
  │  │                                                      │    │
  │  │ ★ access_log off:                                   │    │
  │  │   → TẮT log cho static requests (tiết kiệm IO!)   │    │
  │  │                                                      │    │
  │  │ ★ try_files:                                        │    │
  │  │   → Thử tìm file theo thứ tự!                     │    │
  │  │   → $uri → $uri/ → fallback!                      │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```

---

## §8. Tách Tĩnh Động — Dynamic-Static Separation!

```
  DYNAMIC-STATIC SEPARATION:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  Ý TƯỞNG CHÍNH:                                                │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ → Trang web ĐỘNG = có phần TĨNH + phần ĐỘNG!     │    │
  │  │ → Tách riêng 2 loại resource!                      │    │
  │  │ → Tĩnh: HTML, CSS, JS, images (KHÔNG đổi!)       │    │
  │  │ → Động: API responses, DB queries (THAY ĐỔI!)    │    │
  │  │ → Cache theo ĐẶC TRƯNG riêng! ★                  │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  SƠ ĐỒ:                                                       │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │                                                      │    │
  │  │  ┌─────────┐                                        │    │
  │  │  │ Client  │                                        │    │
  │  │  └────┬────┘                                        │    │
  │  │       ↓                                              │    │
  │  │  ┌──────────────────┐                               │    │
  │  │  │ Nginx (Rev Proxy)│                               │    │
  │  │  └──┬───────────┬───┘                               │    │
  │  │     ↓           ↓                                    │    │
  │  │  /static/    /api/                                   │    │
  │  │     ↓           ↓                                    │    │
  │  │  ┌──────┐   ┌──────────┐                            │    │
  │  │  │Static│   │ Dynamic  │                            │    │
  │  │  │Server│   │ Server   │                            │    │
  │  │  │HTML  │   │ Node.js  │                            │    │
  │  │  │CSS/JS│   │ API      │                            │    │
  │  │  └──────┘   └──────────┘                            │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  CẤU HÌNH 3 BƯỚC:                                             │
  │                                                              │
  │  BƯỚC 1 - Static Resource Server:                              │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ server {                                              │    │
  │  │     listen 80;                                        │    │
  │  │     server_name static.example.com;                   │    │
  │  │     root /var/www/static;                             │    │
  │  │     location / {                                      │    │
  │  │         expires 30d;                                  │    │
  │  │         add_header Cache-Control                      │    │
  │  │             "public, max-age=7200";                  │    │
  │  │     }                                                 │    │
  │  │ }                                                     │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  BƯỚC 2 - Dynamic Resource Server:                             │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ server {                                              │    │
  │  │     listen 80;                                        │    │
  │  │     server_name dynamic.example.com;                  │    │
  │  │     location / {                                      │    │
  │  │         proxy_pass http://127.0.0.1:8000;            │    │
  │  │         proxy_set_header Host $host;                  │    │
  │  │         proxy_set_header X-Real-IP $remote_addr;     │    │
  │  │         proxy_set_header X-Forwarded-For             │    │
  │  │             $proxy_add_x_forwarded_for;              │    │
  │  │     }                                                 │    │
  │  │ }                                                     │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  BƯỚC 3 - Reverse Proxy Tổng Hợp:                             │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ server {                                              │    │
  │  │     listen 80;                                        │    │
  │  │     server_name www.example.com;                      │    │
  │  │                                                      │    │
  │  │     # /static/ → chuyển tới static server!         │    │
  │  │     location /static/ {                               │    │
  │  │         proxy_pass http://static.example.com/;       │    │
  │  │     }                                                 │    │
  │  │                                                      │    │
  │  │     # / → chuyển tới dynamic server!               │    │
  │  │     location / {                                      │    │
  │  │         proxy_pass http://dynamic.example.com/;      │    │
  │  │         proxy_set_header Host $host;                  │    │
  │  │         proxy_set_header X-Real-IP $remote_addr;     │    │
  │  │         proxy_set_header X-Forwarded-For             │    │
  │  │             $proxy_add_x_forwarded_for;              │    │
  │  │     }                                                 │    │
  │  │ }                                                     │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  SAU KHI CẤU HÌNH → nginx -s reload! ★                      │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```

---

## §9. Tự Động Chuyển Hướng PC ↔ Mobile!

```
  PC vs MOBILE REDIRECT:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  KỊCH BẢN:                                                     │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ → User mở baidu.com trên ĐIỆN THOẠI!              │    │
  │  │ → Tự động REDIRECT tới m.baidu.com! ★              │    │
  │  │ → Nginx detect User-Agent → biết PC hay Mobile!   │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  CÁCH HOẠT ĐỘNG:                                               │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ Nginx biến nội tại: $http_user_agent                 │    │
  │  │ → Chứa User-Agent header từ client!                │    │
  │  │ → Mobile: "Android", "iPhone", "webOS"              │    │
  │  │ → PC: "Windows NT", "Macintosh"                     │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  CẤU HÌNH:                                                     │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ # nginx.conf                                         │    │
  │  │ server {                                              │    │
  │  │     location / {                                      │    │
  │  │         # Detect mobile User-Agent!                  │    │
  │  │         if ($http_user_agent ~*                       │    │
  │  │             '(Android|webOS|iPhone)') {              │    │
  │  │             set $mobile_request '1';                  │    │
  │  │         }                                             │    │
  │  │                                                      │    │
  │  │         # Nếu mobile → redirect!                   │    │
  │  │         if ($mobile_request = '1') {                  │    │
  │  │             rewrite ^.+ http://m.baidu.com;          │    │
  │  │         }                                             │    │
  │  │     }                                                 │    │
  │  │ }                                                     │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  FLOW:                                                         │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │                                                      │    │
  │  │  Mobile User                                         │    │
  │  │  (User-Agent: iPhone)                                │    │
  │  │       │                                              │    │
  │  │       │── GET baidu.com ──→ Nginx                   │    │
  │  │       │                        │                     │    │
  │  │       │                        │ Check User-Agent!   │    │
  │  │       │                        │ "iPhone" → Mobile! │    │
  │  │       │                        │                     │    │
  │  │       │←── 302 Redirect ──────│                     │    │
  │  │       │    Location:                                 │    │
  │  │       │    http://m.baidu.com                        │    │
  │  │       │                                              │    │
  │  │  PC User                                              │    │
  │  │  (User-Agent: Windows NT)                            │    │
  │  │       │                                              │    │
  │  │       │── GET baidu.com ──→ Nginx                   │    │
  │  │       │                        │                     │    │
  │  │       │                        │ Check User-Agent!   │    │
  │  │       │                        │ "Windows" → PC!    │    │
  │  │       │                        │                     │    │
  │  │       │←── 200 OK ────────────│                     │    │
  │  │       │    (Serve PC version!)                       │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  GIẢI THÍCH:                                                    │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ ★ $http_user_agent:                                 │    │
  │  │   → Biến NGINX lấy User-Agent header!              │    │
  │  │                                                      │    │
  │  │ ★ ~* '(Android|webOS|iPhone)':                      │    │
  │  │   → ~* = regex CASE-INSENSITIVE!                    │    │
  │  │   → Match nếu chứa Android HOẶC webOS HOẶC iPhone!│    │
  │  │                                                      │    │
  │  │ ★ set $mobile_request '1':                          │    │
  │  │   → Đặt biến tùy chỉnh = '1'!                    │    │
  │  │                                                      │    │
  │  │ ★ rewrite ^.+ http://m.baidu.com:                   │    │
  │  │   → ^.+ = match TOÀN BỘ URL!                      │    │
  │  │   → Redirect tới mobile version!                    │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```

---

## §10. Gzip — Nén Tĩnh!

```
  GZIP COMPRESSION:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  GZIP LÀ GÌ:                                                  │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ → Phương pháp NÉN nội dung web page!              │    │
  │  │ → Giảm kích thước xuống 30% hoặc NHỎ HƠN! ★     │    │
  │  │ → Tiết kiệm bandwidth!                             │    │
  │  │ → Tăng tốc truyền tải!                            │    │
  │  │ → User trải nghiệm TỐT HƠN!                      │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  FLOW:                                                         │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │  Client                    Nginx                     │    │
  │  │    │                        │                        │    │
  │  │    │── Request ─────────→  │                        │    │
  │  │    │   Accept-Encoding:    │                        │    │
  │  │    │   gzip, deflate       │                        │    │
  │  │    │                        │                        │    │
  │  │    │                        │  Nén file bằng gzip!  │    │
  │  │    │                        │  100KB → 30KB! ★      │    │
  │  │    │                        │                        │    │
  │  │    │← Response ────────── │                        │    │
  │  │    │   Content-Encoding:   │                        │    │
  │  │    │   gzip                │                        │    │
  │  │    │   (30KB thay vì 100KB!)                        │    │
  │  │    │                        │                        │    │
  │  │    │  Browser GIẢI NÉN                              │    │
  │  │    │  tự động! ★                                   │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  CẤU HÌNH ĐẦY ĐỦ:                                            │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ server {                                              │    │
  │  │   # BẬT gzip!                                       │    │
  │  │   gzip on;                                            │    │
  │  │                                                      │    │
  │  │   # Buffer: số lượng × kích thước buffer!          │    │
  │  │   gzip_buffers 32 4K;                                 │    │
  │  │                                                      │    │
  │  │   # Cấp độ nén: 1-10! ★                           │    │
  │  │   # Cao hơn = nén TỐT hơn → CHẬM hơn!           │    │
  │  │   gzip_comp_level 6;                                  │    │
  │  │                                                      │    │
  │  │   # Kích thước TỐI THIỂU để nén!                 │    │
  │  │   # Nhỏ hơn 100 bytes → KHÔNG nén!               │    │
  │  │   gzip_min_length 100;                                │    │
  │  │                                                      │    │
  │  │   # LOẠI FILE ĐƯỢC NÉN! ★                         │    │
  │  │   gzip_types application/javascript                   │    │
  │  │              text/css                                 │    │
  │  │              text/xml;                                │    │
  │  │                                                      │    │
  │  │   # TẮT gzip cho IE6! (không hỗ trợ!)            │    │
  │  │   gzip_disable "MSIE [1-6]\.";                       │    │
  │  │                                                      │    │
  │  │   # Bật/tắt nén cho proxy response!                │    │
  │  │   gzip_proxied on;                                    │    │
  │  │                                                      │    │
  │  │   # HTTP version hỗ trợ gzip!                      │    │
  │  │   gzip_http_version 1.1;                              │    │
  │  │                                                      │    │
  │  │   # Thêm Vary: Accept-Encoding header!             │    │
  │  │   # Proxy BIẾT nên cache phiên bản nào!            │    │
  │  │   gzip_vary on;                                       │    │
  │  │ }                                                     │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  GIẢI THÍCH CHI TIẾT:                                          │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ ★ gzip on/off:                                     │    │
  │  │   → Bật hoặc TẮT module gzip!                     │    │
  │  │                                                      │    │
  │  │ ★ gzip_comp_level (1-10):                           │    │
  │  │   → 1 = nén ÍT, nhanh!                             │    │
  │  │   → 10 = nén NHIỀU, chậm!                          │    │
  │  │   → Khuyến nghị: 4-6! ★                            │    │
  │  │                                                      │    │
  │  │ ★ gzip_min_length:                                  │    │
  │  │   → Lấy từ Content-Length header!                   │    │
  │  │   → File NHỎ hơn → KHÔNG nén! (overhead!)         │    │
  │  │                                                      │    │
  │  │ ★ gzip_types:                                       │    │
  │  │   → CHỈ NÉN các MIME types được liệt kê!          │    │
  │  │   → text/html LUÔN được nén! (mặc định!)          │    │
  │  │   → Thêm: JS, CSS, XML, JSON, SVG!                 │    │
  │  │                                                      │    │
  │  │ ★ gzip_vary on:                                     │    │
  │  │   → Thêm header: Vary: Accept-Encoding              │    │
  │  │   → Proxy server BIẾT cache client nào hỗ trợ!   │    │
  │  │   → Client CÓ gzip → serve bản nén!               │    │
  │  │   → Client KHÔNG gzip → serve bản gốc!            │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```

---

## §11. CORS — Xử Lý Cross-Domain!

```
  CORS CONFIGURATION:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  VẤN ĐỀ:                                                      │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ → Frontend: http://localhost:3000                    │    │
  │  │ → Backend:  http://localhost:8000                    │    │
  │  │ → Browser chặn: CORS ERROR! ❌                     │    │
  │  │ → "No 'Access-Control-Allow-Origin' header"!       │    │
  │  │ → 403 Forbidden!                                    │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  GIẢI PHÁP — Nginx CORS Headers:                               │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ location / {                                          │    │
  │  │   # Cho phép TẤT CẢ origins!                       │    │
  │  │   add_header Access-Control-Allow-Origin *;          │    │
  │  │                                                      │    │
  │  │   # Cho phép methods!                                │    │
  │  │   add_header Access-Control-Allow-Methods            │    │
  │  │       'GET, POST, OPTIONS';                          │    │
  │  │                                                      │    │
  │  │   # Cho phép headers!                                │    │
  │  │   add_header Access-Control-Allow-Headers            │    │
  │  │       'DNT,X-Mx-ReqToken,Keep-Alive,               │    │
  │  │        User-Agent,X-Requested-With,                  │    │
  │  │        If-Modified-Since,Cache-Control,              │    │
  │  │        Content-Type,Authorization';                  │    │
  │  │                                                      │    │
  │  │   # Preflight request → 204 No Content!            │    │
  │  │   if ($request_method = 'OPTIONS') {                 │    │
  │  │       return 204;                                     │    │
  │  │   }                                                   │    │
  │  │ }                                                     │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  GIẢI THÍCH:                                                    │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ ★ Access-Control-Allow-Origin *:                    │    │
  │  │   → * = cho phép TẤT CẢ domains!                  │    │
  │  │   → Hoặc chỉ định domain cụ thể:                  │    │
  │  │     http://localhost:3000                             │    │
  │  │                                                      │    │
  │  │ ★ Access-Control-Allow-Methods:                     │    │
  │  │   → Danh sách HTTP methods được phép!              │    │
  │  │   → GET, POST, PUT, DELETE, OPTIONS!                │    │
  │  │                                                      │    │
  │  │ ★ Access-Control-Allow-Headers:                     │    │
  │  │   → Headers mà client được phép GỬI!              │    │
  │  │   → Cần khai báo tất cả custom headers!            │    │
  │  │                                                      │    │
  │  │ ★ OPTIONS Preflight:                                │    │
  │  │   → Browser gửi OPTIONS TRƯỚC request thật!        │    │
  │  │   → Hỏi server: "Tôi CÓ PHÉP không?"            │    │
  │  │   → return 204: "Có! Tiếp tục đi!" ★             │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  FLOW PREFLIGHT:                                                │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │  Browser                      Nginx                  │    │
  │  │    │                            │                    │    │
  │  │    │── OPTIONS /api/data ──────→│                    │    │
  │  │    │   (Preflight: hỏi quyền!)│                    │    │
  │  │    │                            │                    │    │
  │  │    │←── 204 No Content ────────│                    │    │
  │  │    │    ACAO: *                  │                    │    │
  │  │    │    ACAM: GET,POST           │                    │    │
  │  │    │    ACAH: Content-Type       │                    │    │
  │  │    │                            │                    │    │
  │  │    │── GET /api/data ──────────→│                    │    │
  │  │    │   (Request thật!)          │                    │    │
  │  │    │                            │                    │    │
  │  │    │←── 200 OK + data ─────────│                    │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  ⚠️ CÁCH KHÁC — Dùng Reverse Proxy thay CORS:                │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ → Thay vì thêm CORS headers...                     │    │
  │  │ → Dùng Nginx reverse proxy!                         │    │
  │  │ → Frontend + Backend CÙNG domain/port! ★           │    │
  │  │ → KHÔNG CẦN CORS! Vì same-origin!                 │    │
  │  │                                                      │    │
  │  │ server {                                              │    │
  │  │     listen 80;                                        │    │
  │  │     location / {                                      │    │
  │  │         root /var/www/frontend;  # static files!    │    │
  │  │     }                                                 │    │
  │  │     location /api/ {                                  │    │
  │  │         proxy_pass http://127.0.0.1:8000;            │    │
  │  │     }                                                 │    │
  │  │ }                                                     │    │
  │  │ → / → serve frontend!                              │    │
  │  │ → /api/ → proxy tới backend!                       │    │
  │  │ → Cùng port 80 → NO CORS! ★                       │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```

---

## §12. IP Whitelist + Request Filtering!

```
  IP WHITELIST & REQUEST FILTERING:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  ① IP ĐƠNN GIẢN — CHẶN/MỞ IP:                                │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ server {                                              │    │
  │  │     location / {                                      │    │
  │  │         deny 192.168.0.1;   # CHẶN IP này!        │    │
  │  │         deny all;           # CHẶN TẤT CẢ!        │    │
  │  │     }                                                 │    │
  │  │ }                                                     │    │
  │  │                                                      │    │
  │  │ → deny: CHẶN IP/range!                             │    │
  │  │ → allow: CHO PHÉP IP/range!                         │    │
  │  │ → all: TẤT CẢ ip!                                 │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  ② WHITELIST — File Riêng:                                     │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ BƯỚC 1: Tạo file whitelist!                         │    │
  │  │ # vim /etc/nginx/white_ip.conf                       │    │
  │  │ 192.168.0.1 1;   # IP được phép!                  │    │
  │  │ 192.168.0.2 1;                                       │    │
  │  │ 10.0.0.0/24 1;   # Cả subnet!                     │    │
  │  │                                                      │    │
  │  │ BƯỚC 2: Nginx config — geo directive!                │    │
  │  │ # nginx.conf                                         │    │
  │  │ geo $remote_addr $ip_whitelist {                      │    │
  │  │     default 0;              # Mặc định: CHẶN!      │    │
  │  │     include white_ip.conf;  # Load whitelist!        │    │
  │  │ }                                                     │    │
  │  │                                                      │    │
  │  │ GIẢI THÍCH geo:                                       │    │
  │  │ → geo directive: MAP biến → giá trị mới!          │    │
  │  │ → $remote_addr = IP client!                          │    │
  │  │ → $ip_whitelist = 0 hoặc 1!                         │    │
  │  │ → IP trong whitelist → $ip_whitelist = 1!           │    │
  │  │ → IP KHÔNG trong list → $ip_whitelist = 0!          │    │
  │  │                                                      │    │
  │  │ BƯỚC 3: Server config!                               │    │
  │  │ server {                                              │    │
  │  │     location / {                                      │    │
  │  │         if ($ip_whitelist = 0) {                      │    │
  │  │             return 403;  # KHÔNG trong whitelist!   │    │
  │  │         }                                             │    │
  │  │         index index.html;                             │    │
  │  │         root /tmp;                                    │    │
  │  │     }                                                 │    │
  │  │ }                                                     │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  ③ REQUEST FILTERING — Lọc Request:                            │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │                                                      │    │
  │  │ ★ LỌC THEO STATUS CODE:                            │    │
  │  │ error_page 500 501 502 503 504 506 /50x.html;       │    │
  │  │ location = /50x.html {                                │    │
  │  │     root /root/static/html;                           │    │
  │  │ }                                                     │    │
  │  │ → Server lỗi 5xx → hiển thị trang lỗi tùy chỉnh!│    │
  │  │                                                      │    │
  │  │ ★ LỌC THEO URL:                                    │    │
  │  │ location / {                                          │    │
  │  │     rewrite ^.*$ /index.html redirect;               │    │
  │  │ }                                                     │    │
  │  │ → TẤT CẢ URL không match → redirect trang chủ!   │    │
  │  │                                                      │    │
  │  │ ★ LỌC THEO REQUEST METHOD:                         │    │
  │  │ if ($request_method !~ ^(GET|POST|HEAD)$) {          │    │
  │  │     return 403;  # CHỈ cho phép GET, POST, HEAD!   │    │
  │  │ }                                                     │    │
  │  │ → PUT, DELETE, PATCH → 403 Forbidden! ★            │    │
  │  │                                                      │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```

---

## §13. Anti-Hotlinking + Cache Control!

```
  ANTI-HOTLINKING & CACHE:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  ① ANTI-HOTLINKING (Chống Đánh Cắp Tài Nguyên!):             │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ HOTLINKING LÀ GÌ:                                    │    │
  │  │ → Website KHÁC dùng hình ảnh/video của BẠN!       │    │
  │  │ → Trực tiếp link tới resource trên server bạn!    │    │
  │  │ → BẠN trả bandwidth! HỌ thu lợi! ❌              │    │
  │  │                                                      │    │
  │  │ CẤU HÌNH:                                             │    │
  │  │ location ~* \.(gif|jpg|png)$ {                        │    │
  │  │     # CHỈ cho phép từ server này!                  │    │
  │  │     valid_referers none blocked 192.168.0.1;         │    │
  │  │     if ($invalid_referer) {                           │    │
  │  │         rewrite ^/ http://$host/logo.png;            │    │
  │  │     }                                                 │    │
  │  │ }                                                     │    │
  │  │                                                      │    │
  │  │ GIẢI THÍCH:                                           │    │
  │  │ → valid_referers: Danh sách referer hợp lệ!       │    │
  │  │ → none: Request KHÔNG có Referer header!            │    │
  │  │ → blocked: Referer bị firewall/proxy xóa!          │    │
  │  │ → 192.168.0.1: CHỈ IP này được phép!              │    │
  │  │ → $invalid_referer: TRUE nếu referer bất hợp lệ! │    │
  │  │ → rewrite: Trả về logo.png thay vì ảnh thật! ★   │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  ② ĐẶT THỜI GIAN HẾT HẠN (Cache theo loại file!):         │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ # CSS — cache 1 ngày!                               │    │
  │  │ location ~.*\.css$ {                                  │    │
  │  │     expires 1d;                                       │    │
  │  │     break;                                            │    │
  │  │ }                                                     │    │
  │  │                                                      │    │
  │  │ # JS — cache 1 ngày!                               │    │
  │  │ location ~.*\.js$ {                                   │    │
  │  │     expires 1d;                                       │    │
  │  │     break;                                            │    │
  │  │ }                                                     │    │
  │  │                                                      │    │
  │  │ # Ảnh — cache 15 ngày!                             │    │
  │  │ location ~ .*\.(gif|jpg|jpeg|png|bmp|swf)$ {         │    │
  │  │     access_log off;                                   │    │
  │  │     expires 15d;                                      │    │
  │  │     break;                                            │    │
  │  │ }                                                     │    │
  │  │                                                      │    │
  │  │ → CSS/JS: cache 1 ngày (thay đổi thường xuyên!)  │    │
  │  │ → Ảnh: cache 15 ngày (ít thay đổi!)              │    │
  │  │ → access_log off: TẮT log cho ảnh!                │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  ③ TẮT CACHE (Cho Development!):                              │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ → Khi phát triển, code THAY ĐỔI liên tục!        │    │
  │  │ → Browser cache → KHÔNG thấy thay đổi!           │    │
  │  │ → Phải force refresh (Ctrl+Shift+R!) ❌            │    │
  │  │ → Giải pháp: TẮT cache!                           │    │
  │  │                                                      │    │
  │  │ location ~* \.(js|css|png|jpg|gif)$ {                │    │
  │  │     add_header Cache-Control no-store;               │    │
  │  │ }                                                     │    │
  │  │                                                      │    │
  │  │ → Cache-Control: no-store                            │    │
  │  │ → Browser KHÔNG cache gì! ★                        │    │
  │  │ → Mỗi lần load → request MỚI!                    │    │
  │  │                                                      │    │
  │  │ Cache-Control values khác:                            │    │
  │  │ ┌──────────────┬────────────────────────────┐        │    │
  │  │ │ no-store     │ KHÔNG lưu bất kỳ cache!   │        │    │
  │  │ │ no-cache     │ Lưu nhưng LUÔN validate!   │        │    │
  │  │ │ public       │ Ai cũng cache được!       │        │    │
  │  │ │ private      │ CHỈ browser cache!         │        │    │
  │  │ │ max-age=N    │ Cache N giây!              │        │    │
  │  │ └──────────────┴────────────────────────────┘        │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```

---

## §14. Cài Đặt + Cấu Hình Nginx!

```
  CÀI ĐẶT NGINX:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  ① CÀI ĐẶT (CentOS/Linux):                                   │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ # Cài đặt Nginx!                                    │    │
  │  │ yum install nginx                                     │    │
  │  │                                                      │    │
  │  │ # Kiểm tra vị trí cài đặt!                        │    │
  │  │ whereis nginx                                         │    │
  │  │ → /etc/nginx  /usr/sbin/nginx  ...                   │    │
  │  │                                                      │    │
  │  │ # Khởi động Nginx!                                  │    │
  │  │ nginx                                                 │    │
  │  │                                                      │    │
  │  │ # Kiểm tra trạng thái!                             │    │
  │  │ ps -ef | grep nginx                                   │    │
  │  │ → "master process" = khởi động THÀNH CÔNG! ★       │    │
  │  │                                                      │    │
  │  │ # Dừng Nginx!                                        │    │
  │  │ nginx -s stop                                         │    │
  │  │                                                      │    │
  │  │ # Restart (reload config!):                           │    │
  │  │ nginx -s reload                                       │    │
  │  │                                                      │    │
  │  │ # Kill process trực tiếp!                           │    │
  │  │ kill -9 <PID>                                         │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  ② KIẾN TRÚC PROCESS:                                          │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │                                                      │    │
  │  │  ┌────────────────┐                                 │    │
  │  │  │ Master Process │ ← PID: 8011 (quản lý!)       │    │
  │  │  └──┬───┬───┬─────┘                                 │    │
  │  │     ↓   ↓   ↓                                       │    │
  │  │  ┌───┐┌───┐┌───┐                                   │    │
  │  │  │W1 ││W2 ││W3 │ ← Worker Processes!              │    │
  │  │  └───┘└───┘└───┘                                   │    │
  │  │                                                      │    │
  │  │  → Master: Đọc config + quản lý workers!          │    │
  │  │  → Workers: Xử lý request THẬT!                   │    │
  │  │  → Hot Deployment: reload → master tạo workers mới!│    │
  │  │  → Workers cũ xử lý xong → thoát! ★              │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  ③ KIỂM TRA PORT:                                              │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ # Check port 80!                                      │    │
  │  │ netstat -anp | grep :80                               │    │
  │  │                                                      │    │
  │  │ # Check firewall!                                     │    │
  │  │ firewall-cmd --query-port=80/tcp                     │    │
  │  │ → "yes" = port MỞ!                                 │    │
  │  │ → "no" = port ĐÓNG!                                │    │
  │  │                                                      │    │
  │  │ # Mở port 80!                                        │    │
  │  │ firewall-cmd --permanent --add-port=80/tcp           │    │
  │  │ firewall-cmd --reload                                 │    │
  │  │                                                      │    │
  │  │ # Bật/tắt firewall!                                  │    │
  │  │ systemctl start firewalld                             │    │
  │  │ systemctl stop firewalld                              │    │
  │  │ systemctl status firewalld                            │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  ④ CẤU TRÚC FILE CẤU HÌNH:                                    │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ # File: /etc/nginx/nginx.conf                         │    │
  │  │                                                      │    │
  │  │ user root;                                            │    │
  │  │                                                      │    │
  │  │ http {                                                │    │
  │  │     server {                                          │    │
  │  │         listen       80;                              │    │
  │  │         listen       [::]:80;                         │    │
  │  │         server_name  _;                               │    │
  │  │         root /usr/share/nginx/html;                   │    │
  │  │                                                      │    │
  │  │         # Import thêm config!                       │    │
  │  │         include /etc/nginx/default.d/*.conf;         │    │
  │  │                                                      │    │
  │  │         location / {                                  │    │
  │  │             # Serve root path!                       │    │
  │  │         }                                             │    │
  │  │                                                      │    │
  │  │         error_page 404 /404.html;                    │    │
  │  │         location = /40x.html {                        │    │
  │  │         }                                             │    │
  │  │                                                      │    │
  │  │         error_page 500 502 503 504 /50x.html;       │    │
  │  │         location = /50x.html {                        │    │
  │  │         }                                             │    │
  │  │     }                                                 │    │
  │  │ }                                                     │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  GIẢI THÍCH CẤU TRÚC:                                          │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ ★ user root:                                        │    │
  │  │   → Nginx chạy với quyền root!                    │    │
  │  │                                                      │    │
  │  │ ★ http { ... }:                                     │    │
  │  │   → Block HTTP! Chứa tất cả cấu hình HTTP!       │    │
  │  │                                                      │    │
  │  │ ★ server { ... }:                                   │    │
  │  │   → Virtual host! Mỗi domain/port = 1 server!     │    │
  │  │                                                      │    │
  │  │ ★ listen 80:                                        │    │
  │  │   → Lắng nghe port 80 (HTTP mặc định!)            │    │
  │  │                                                      │    │
  │  │ ★ server_name _:                                    │    │
  │  │   → _ = match TẤT CẢ domain names!                │    │
  │  │                                                      │    │
  │  │ ★ root /usr/share/nginx/html:                       │    │
  │  │   → Thư mục gốc! Load HTML từ đây!               │    │
  │  │                                                      │    │
  │  │ ★ include:                                          │    │
  │  │   → Import file config khác!                        │    │
  │  │   → Module hóa config! ★                           │    │
  │  │                                                      │    │
  │  │ ★ error_page:                                       │    │
  │  │   → Map status code → HTML page!                   │    │
  │  │   → 404 → /404.html!                               │    │
  │  │   → 500/502/503/504 → /50x.html!                  │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```

---

## §15. Sơ Đồ Tổng Hợp!

```
  TỔNG QUAN NGINX ARCHITECTURE:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │              INTERNET (Clients)                       │    │
  │  │  ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐    │    │
  │  │  │Phone │ │PC    │ │Tablet│ │Bot   │ │API   │    │    │
  │  │  └──┬───┘ └──┬───┘ └──┬───┘ └──┬───┘ └──┬───┘    │    │
  │  │     └────┬───┴───┬────┴────┬───┴────┬───┘         │    │
  │  └──────────┼───────┼─────────┼────────┼──────────────┘    │
  │             ↓       ↓         ↓        ↓                    │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │                   NGINX SERVER                        │    │
  │  │  ┌────────────────────────────────────────────────┐  │    │
  │  │  │              Master Process (PID 1)            │  │    │
  │  │  │  → Đọc nginx.conf!                           │  │    │
  │  │  │  → Quản lý Worker Processes!                  │  │    │
  │  │  │  → Hot reload (nginx -s reload!)              │  │    │
  │  │  └────────────────────────────────────────────────┘  │    │
  │  │  ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐              │    │
  │  │  │ W1   │ │ W2   │ │ W3   │ │ W4   │              │    │
  │  │  │Worker│ │Worker│ │Worker│ │Worker│              │    │
  │  │  └──────┘ └──────┘ └──────┘ └──────┘              │    │
  │  │                                                      │    │
  │  │  ┌────────────────────────────────────────────────┐  │    │
  │  │  │            MODULES PIPELINE                    │  │    │
  │  │  │                                                │  │    │
  │  │  │  ① Mobile Detect ($http_user_agent)           │  │    │
  │  │  │  ② IP Whitelist (geo $ip_whitelist)           │  │    │
  │  │  │  ③ Request Filtering (method/url)             │  │    │
  │  │  │  ④ CORS Headers (ACAO/ACAM/ACAH)             │  │    │
  │  │  │  ⑤ Anti-Hotlinking (valid_referers)          │  │    │
  │  │  │  ⑥ Gzip Compression (100KB→30KB!)            │  │    │
  │  │  │  ⑦ SSL/TLS Termination (port 443!)           │  │    │
  │  │  │  ⑧ Cache Control (expires/max-age!)          │  │    │
  │  │  └────────────────────────────────────────────────┘  │    │
  │  │                                                      │    │
  │  │  ┌────────────────────────────────────────────────┐  │    │
  │  │  │            ROUTING (location)                  │  │    │
  │  │  │  location /static/ → Static Server!           │  │    │
  │  │  │  location /api/    → Reverse Proxy!           │  │    │
  │  │  │  location /        → Root / SPA!              │  │    │
  │  │  └────────────────────────────────────────────────┘  │    │
  │  └──────────────────────────────────────────────────────┘    │
  │             │                    │                            │
  │      ┌──────┴──────┐    ┌───────┴──────────┐                │
  │      ↓             ↓    ↓                  ↓                │
  │  ┌────────┐   ┌─────────────────────────────────┐           │
  │  │ Static │   │     UPSTREAM (Load Balancer)     │           │
  │  │ Files  │   │  ┌───────────────────────────┐  │           │
  │  │ /var/  │   │  │ ① Round Robin (default)  │  │           │
  │  │ www/   │   │  │ ② Weighted               │  │           │
  │  │ html/  │   │  │ ③ Least Connections      │  │           │
  │  │ css/   │   │  │ ④ IP Hash (session!)     │  │           │
  │  │ js/    │   │  │ ⑤ Fair (3rd party)       │  │           │
  │  │ img/   │   │  │ ⑥ URL Hash (3rd party)   │  │           │
  │  └────────┘   │  └───────────────────────────┘  │           │
  │               │  ┌──────┐ ┌──────┐ ┌──────┐    │           │
  │               │  │ S1 ✅│ │ S2 ✅│ │ S3 ✅│    │           │
  │               │  │:8001 │ │:8002 │ │:8003 │    │           │
  │               │  └──────┘ └──────┘ └──────┘    │           │
  │               │  Health Check:                    │           │
  │               │  max_fails + fail_timeout!        │           │
  │               └──────────────────────────────────┘           │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```

---

## §16. Tự Viết — NginxSimulator!

**KHÔNG dùng thư viện! Tự viết hoàn toàn bằng tay!**

```javascript
// ═══════════════════════════════════════════════
// NginxSimulator — Mô phỏng Nginx bằng JavaScript!
// Tự viết 100% — KHÔNG dùng thư viện!
// ═══════════════════════════════════════════════

class NginxSimulator {
  constructor() {
    this.servers = [];
    this.upstreams = {};
    this.geoRules = {};
    this.gzipEnabled = false;
    this.gzipTypes = [];
    this.gzipMinLength = 0;
    this.gzipCompLevel = 6;
    this.logs = [];
  }

  _log(msg) {
    const ts = new Date().toISOString().slice(11, 23);
    this.logs.push(`[${ts}] ${msg}`);
    console.log(`[${ts}] ${msg}`);
  }

  // ═══ SERVER BLOCK — Virtual Host! ═══
  addServer(config) {
    this.servers.push({
      listen: config.listen || 80,
      server_name: config.server_name || "_",
      root: config.root || "/usr/share/nginx/html",
      locations: config.locations || [],
      ssl: config.ssl || null,
      errorPages: config.errorPages || {},
    });
    this._log(`Server added: ${config.server_name}:${config.listen}`);
    return this;
  }

  // ═══ UPSTREAM — Load Balancing Pool! ═══
  addUpstream(name, config) {
    this.upstreams[name] = {
      name,
      strategy: config.strategy || "round-robin",
      servers: config.servers.map((s) => ({
        address: s.address,
        weight: s.weight || 1,
        maxFails: s.maxFails || 1,
        failTimeout: s.failTimeout || 10,
        currentFails: 0,
        isDown: false,
        lastFailTime: null,
        connections: 0,
        totalRequests: 0,
      })),
      _rrIndex: 0,
    };
    this._log(`Upstream: ${name} (${config.strategy || "round-robin"})`);
    return this;
  }

  // ═══ LOAD BALANCING — 5 Strategies! ═══
  _selectServer(upstream, request) {
    const now = Date.now();
    upstream.servers.forEach((s) => {
      if (
        s.isDown &&
        s.lastFailTime &&
        (now - s.lastFailTime) / 1000 >= s.failTimeout
      ) {
        s.isDown = false;
        s.currentFails = 0;
        this._log(`  → ${s.address} RECOVERED!`);
      }
    });

    const alive = upstream.servers.filter((s) => !s.isDown);
    if (!alive.length) {
      this._log("  ❌ ALL DOWN!");
      return null;
    }

    switch (upstream.strategy) {
      case "weighted":
        return this._weighted(alive);
      case "least-conn":
        return this._leastConn(alive);
      case "ip-hash":
        return this._ipHash(alive, request.clientIP);
      case "url-hash":
        return this._urlHash(alive, request.url);
      default:
        return this._roundRobin(upstream, alive);
    }
  }

  _roundRobin(upstream, alive) {
    const s = alive[upstream._rrIndex++ % alive.length];
    s.totalRequests++;
    this._log(`  → RR → ${s.address}`);
    return s;
  }

  _weighted(alive) {
    const total = alive.reduce((sum, s) => sum + s.weight, 0);
    let r = Math.random() * total;
    for (const s of alive) {
      r -= s.weight;
      if (r <= 0) {
        s.totalRequests++;
        return s;
      }
    }
    return alive[0];
  }

  _leastConn(alive) {
    const s = alive.reduce((min, s) =>
      s.connections < min.connections ? s : min,
    );
    s.connections++;
    s.totalRequests++;
    return s;
  }

  _ipHash(alive, ip) {
    let h = 0;
    for (let i = 0; i < ip.length; i++)
      h = ((h << 5) - h + ip.charCodeAt(i)) | 0;
    const s = alive[Math.abs(h) % alive.length];
    s.totalRequests++;
    return s;
  }

  _urlHash(alive, url) {
    let h = 0;
    for (let i = 0; i < url.length; i++)
      h = ((h << 5) - h + url.charCodeAt(i)) | 0;
    const s = alive[Math.abs(h) % alive.length];
    s.totalRequests++;
    return s;
  }

  // ═══ GZIP ═══
  configGzip(config) {
    this.gzipEnabled = config.enabled;
    this.gzipTypes = config.types || ["text/html"];
    this.gzipMinLength = config.minLength || 0;
    this.gzipCompLevel = config.compLevel || 6;
    return this;
  }

  _applyGzip(response) {
    if (!this.gzipEnabled) return response;
    if (!this.gzipTypes.includes(response.contentType)) return response;
    if (response.bodySize < this.gzipMinLength) return response;

    const ratio = 1 - this.gzipCompLevel * 0.07;
    const compressed = Math.round(response.bodySize * ratio);
    this._log(`  → Gzip: ${response.bodySize}B → ${compressed}B`);
    return {
      ...response,
      bodySize: compressed,
      headers: {
        ...response.headers,
        "Content-Encoding": "gzip",
        Vary: "Accept-Encoding",
      },
    };
  }

  // ═══ IP WHITELIST ═══
  configWhitelist(rules) {
    this.geoRules = rules;
    return this;
  }

  _checkWhitelist(ip) {
    if (!this.geoRules.ips) return true;
    const val = this.geoRules.ips[ip];
    return val !== undefined ? val === 1 : this.geoRules.default === 1;
  }

  // ═══ LOCATION MATCHING ═══
  _matchLocation(url, locations) {
    let best = null,
      bestLen = 0;
    for (const loc of locations) {
      if (loc.exact && loc.path === url) return loc;
      if (loc.regex) {
        if (
          new RegExp(loc.path, loc.caseInsensitive ? "i" : "").test(url) &&
          loc.path.length > bestLen
        ) {
          best = loc;
          bestLen = loc.path.length;
        }
        continue;
      }
      if (url.startsWith(loc.path) && loc.path.length > bestLen) {
        best = loc;
        bestLen = loc.path.length;
      }
    }
    return best;
  }

  // ═══ MOBILE DETECT ═══
  _isMobile(ua) {
    return ["Android", "webOS", "iPhone", "iPad"].some((p) =>
      (ua || "").toLowerCase().includes(p.toLowerCase()),
    );
  }

  // ═══ MAIN HANDLER ═══
  handleRequest(req) {
    this._log(`\n══ ${req.method} ${req.url} from ${req.clientIP} ══`);

    // ① IP Check!
    if (!this._checkWhitelist(req.clientIP)) {
      this._log(`  ❌ IP BLOCKED!`);
      return { status: 403, body: "Forbidden" };
    }

    // ② Mobile redirect!
    if (req.mobileRedirect && this._isMobile(req.userAgent)) {
      return { status: 302, headers: { Location: req.mobileRedirect } };
    }

    // ③ Find server block!
    const server = this.servers.find(
      (s) =>
        s.listen === (req.port || 80) &&
        (s.server_name === "_" || s.server_name === req.host),
    );
    if (!server) return { status: 404, body: "No server found" };

    // ④ Match location!
    const loc = this._matchLocation(req.url, server.locations);

    // ⑤ CORS preflight!
    if (loc?.cors && req.method === "OPTIONS") {
      return {
        status: 204,
        headers: {
          "Access-Control-Allow-Origin": loc.cors.origin || "*",
          "Access-Control-Allow-Methods": loc.cors.methods || "GET,POST",
          "Access-Control-Allow-Headers": loc.cors.headers || "Content-Type",
        },
      };
    }

    // ⑥ Proxy pass or static!
    let res;
    if (loc?.proxyPass) {
      const upstream = this.upstreams[loc.proxyPass];
      if (upstream) {
        const s = this._selectServer(upstream, req);
        res = s
          ? { status: 200, body: `Proxied → ${s.address}` }
          : { status: 502, body: "Bad Gateway" };
      } else {
        res = { status: 200, body: `Proxied → ${loc.proxyPass}` };
      }
    } else {
      const root = loc?.root || server.root;
      res = {
        status: 200,
        body: `Static: ${root}${req.url}`,
        contentType: this._contentType(req.url),
        bodySize: 2048,
      };
    }

    // ⑦ Gzip!
    if (res.contentType) res = this._applyGzip(res);

    // ⑧ Cache!
    if (loc?.expires) {
      res.headers = {
        ...res.headers,
        "Cache-Control": `max-age=${loc.expires}`,
      };
    }
    return res;
  }

  _contentType(url) {
    const ext = url.split(".").pop()?.toLowerCase();
    return (
      {
        html: "text/html",
        css: "text/css",
        js: "application/javascript",
        png: "image/png",
        jpg: "image/jpeg",
      }[ext] || "text/html"
    );
  }

  markServerFail(upstreamName, address) {
    const s = this.upstreams[upstreamName]?.servers.find(
      (s) => s.address === address,
    );
    if (!s) return;
    s.currentFails++;
    s.lastFailTime = Date.now();
    if (s.currentFails >= s.maxFails) {
      s.isDown = true;
      this._log(`  ❌ ${address} DOWN!`);
    }
  }

  getStats() {
    const stats = {};
    for (const [name, up] of Object.entries(this.upstreams)) {
      stats[name] = up.servers.map((s) => ({
        address: s.address,
        requests: s.totalRequests,
        isDown: s.isDown,
        weight: s.weight,
      }));
    }
    return stats;
  }
}

// ═══ DEMO ═══
const nginx = new NginxSimulator();

nginx.addUpstream("backend", {
  strategy: "round-robin",
  servers: [
    { address: "10.0.0.1:8001", weight: 2, maxFails: 3, failTimeout: 30 },
    { address: "10.0.0.2:8002", weight: 5, maxFails: 3, failTimeout: 30 },
    { address: "10.0.0.3:8003", weight: 3, maxFails: 3, failTimeout: 30 },
  ],
});

nginx.configGzip({
  enabled: true,
  types: ["text/html", "text/css", "application/javascript"],
  minLength: 100,
  compLevel: 6,
});
nginx.configWhitelist({
  default: 0,
  ips: { "192.168.1.100": 1, "10.0.0.1": 1 },
});

nginx.addServer({
  listen: 80,
  server_name: "example.com",
  root: "/var/www/html",
  locations: [
    {
      path: "/api/",
      proxyPass: "backend",
      cors: { origin: "*", methods: "GET,POST,OPTIONS" },
    },
    { path: "/static/", root: "/var/www/static", expires: 86400 * 30 },
    { path: "/", root: "/var/www/html" },
  ],
});

// Test 1: API!
console.log(
  nginx.handleRequest({
    method: "GET",
    url: "/api/users",
    clientIP: "192.168.1.100",
    port: 80,
    host: "example.com",
  }),
);

// Test 2: Blocked IP!
console.log(
  nginx.handleRequest({
    method: "GET",
    url: "/api/data",
    clientIP: "10.10.10.10",
    port: 80,
    host: "example.com",
  }),
);

// Test 3: Mobile!
console.log(
  nginx.handleRequest({
    method: "GET",
    url: "/",
    clientIP: "192.168.1.100",
    userAgent: "iPhone",
    mobileRedirect: "http://m.example.com",
    port: 80,
    host: "example.com",
  }),
);

// Test 4: Load Balancing!
for (let i = 0; i < 6; i++)
  nginx.handleRequest({
    method: "GET",
    url: "/api/x",
    clientIP: "192.168.1.100",
    port: 80,
    host: "example.com",
  });
console.log("Stats:", JSON.stringify(nginx.getStats(), null, 2));

// Test 5: Server failure!
nginx.markServerFail("backend", "10.0.0.1:8001");
nginx.markServerFail("backend", "10.0.0.1:8001");
nginx.markServerFail("backend", "10.0.0.1:8001");
console.log(
  nginx.handleRequest({
    method: "GET",
    url: "/api/health",
    clientIP: "192.168.1.100",
    port: 80,
    host: "example.com",
  }),
);
```

---

## §17. Câu Hỏi Luyện Tập!

```
  CÂU HỎI PHỎNG VẤN:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  CÂU 1: Forward Proxy vs Reverse Proxy?                      │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ → Forward: Đại diện CLIENT! Server không biết user! │    │
  │  │ → Reverse: Đại diện SERVER! Client không biết server!│   │
  │  │ → Forward: VPN truy cập YouTube!                    │    │
  │  │ → Reverse: Nginx load balance tới nhiều servers!   │    │
  │  │ → Forward: Client ẨN danh!                         │    │
  │  │ → Reverse: Server ẨN IP!                           │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  CÂU 2: Giải thích 6 chiến lược Load Balancing?              │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ ① Round Robin: Tuần tự, mặc định!                  │    │
  │  │ ② Weighted: Trọng số, server mạnh nhận nhiều hơn! │    │
  │  │ ③ Least Conn: Ít connection nhất, cân bằng queue!  │    │
  │  │ ④ IP Hash: Cùng IP → cùng server (session!)       │    │
  │  │ ⑤ Fair: Server nhanh nhất (3rd party!)              │    │
  │  │ ⑥ URL Hash: Cùng URL → cùng server (cache!)       │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  CÂU 3: Tại sao cần IP Hash?                                  │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ → Session Sharing problem!                           │    │
  │  │ → Round Robin: Login Server A → next req Server B! │    │
  │  │ → Server B KHÔNG có session → login lại! ❌       │    │
  │  │ → IP Hash: Cùng IP → LUÔN cùng server! ★          │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  CÂU 4: Nginx giải quyết CORS thế nào?                       │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ Cách 1 — CORS Headers:                               │    │
  │  │ → add_header Access-Control-Allow-Origin *;         │    │
  │  │ → OPTIONS preflight → return 204!                   │    │
  │  │                                                      │    │
  │  │ Cách 2 — Reverse Proxy (TỐT HƠN!):                  │    │
  │  │ → location / → frontend!                           │    │
  │  │ → location /api/ → proxy_pass backend!             │    │
  │  │ → Same-origin → NO CORS! ★                        │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  CÂU 5: Gzip hoạt động thế nào?                               │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ → Client: Accept-Encoding: gzip!                    │    │
  │  │ → Nginx nén: 100KB → 30KB!                        │    │
  │  │ → Response: Content-Encoding: gzip!                  │    │
  │  │ → Browser tự GIẢI NÉN!                             │    │
  │  │ → gzip_comp_level 4-6 TỐI ƯU!                     │    │
  │  │ → gzip_vary on: proxy cache thông minh!             │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  CÂU 6: Dynamic-Static Separation?                            │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ → Tách TĨNH (HTML/CSS/JS) vs ĐỘNG (API/DB)!       │    │
  │  │ → Tĩnh: cache 30d! Động: no-cache hoặc ngắn!     │    │
  │  │ → Giảm tải backend! Tăng performance!              │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  CÂU 7: Health Check?                                          │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ → max_fails: Số fail tối đa (default: 1!)         │    │
  │  │ → fail_timeout: Thời gian đếm fail (default: 10s!)│    │
  │  │ → Vượt max_fails → server bị LOẠI!               │    │
  │  │ → Sau fail_timeout → check LẠI!                   │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  CÂU 8: Master-Worker architecture?                            │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ → Master: Đọc config + quản lý workers!           │    │
  │  │ → Workers: Xử lý request thật!                    │    │
  │  │ → Hot Deploy: reload → workers mới, cũ thoát!    │    │
  │  │ → 10,000 Keep-Alive ≈ 2.5MB RAM!                  │    │
  │  │ → 1 máy > 100,000 concurrent connections!         │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  CÂU 9: Anti-Hotlinking?                                      │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ → valid_referers: Danh sách referer hợp lệ!       │    │
  │  │ → none + blocked + domain cụ thể!                  │    │
  │  │ → $invalid_referer → rewrite placeholder image!    │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  CÂU 10: location matching priority?                           │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ ① = /path    → EXACT match (highest!)              │    │
  │  │ ② ^~ /path   → Prefix stop search!                │    │
  │  │ ③ ~ regex    → Case-sensitive regex!               │    │
  │  │ ④ ~* regex   → Case-INsensitive regex!            │    │
  │  │ ⑤ /path      → Prefix match (lowest!)             │    │
  │  │ Priority: = > ^~ > ~/~* > /path                     │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```
