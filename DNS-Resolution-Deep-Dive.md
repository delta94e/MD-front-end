# DNS Resolution — Deep Dive!

> **Chủ đề**: DNS Domain Name Resolution — Quy Trình Chi Tiết & Tối Ưu!
> **Ngôn ngữ**: Tiếng Việt — giải thích cực kỳ chi tiết!
> **Phương châm**: Tự viết lại bằng tay — KHÔNG dùng thư viện!
> **Nguồn**: "Optimization Practice Episode 02 — DNS Domain Name Resolution" — Juejin

---

## Mục Lục

1. [§1. Domain Name vs IP Address!](#1)
2. [§2. Mối Quan Hệ Domain ↔ IP!](#2)
3. [§3. DNS Resolution — Quy Trình Chi Tiết!](#3)
4. [§4. Sơ Đồ Quy Trình DNS — 10 Bước!](#4)
5. [§5. Recursive vs Iterative Query!](#5)
6. [§6. DNS Resolution Optimization!](#6)
7. [§7. Hosts File!](#7)
8. [§8. Tự Viết — DNSResolverEngine!](#8)
9. [§9. Câu Hỏi Luyện Tập!](#9)

---

## §1. Domain Name vs IP Address!

```
  DOMAIN NAME vs IP ADDRESS:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  ① DOMAIN NAME (Tên Miền!):                                  │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ → Dùng để ĐỊNH DANH địa chỉ mạng!                 │    │
  │  │ → Giống IP, nhưng DỄ NHỚ hơn cho con người!       │    │
  │  │                                                      │    │
  │  │ Ví dụ:                                               │    │
  │  │   www.google.com     ← dễ nhớ! ★                  │    │
  │  │   www.facebook.com   ← dễ nhớ! ★                  │    │
  │  │   www.github.com     ← dễ nhớ! ★                  │    │
  │  │                                                      │    │
  │  │ Cấu trúc Domain Name:                                │    │
  │  │ ┌─────────────────────────────────────────────┐      │    │
  │  │ │  www  .  google  .  com                     │      │    │
  │  │ │  ───     ──────     ───                     │      │    │
  │  │ │  │       │          │                       │      │    │
  │  │ │  │       │          └─ TLD (Top-Level Domain)│      │    │
  │  │ │  │       │             .com, .org, .net, .vn│      │    │
  │  │ │  │       │                                   │      │    │
  │  │ │  │       └─ SLD (Second-Level Domain)       │      │    │
  │  │ │  │          Tên tổ chức: google, facebook   │      │    │
  │  │ │  │                                           │      │    │
  │  │ │  └─ Subdomain (Tên miền phụ)               │      │    │
  │  │ │     www, mail, api, cdn                      │      │    │
  │  │ └─────────────────────────────────────────────┘      │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  ② IP ADDRESS (Địa Chỉ IP!):                                 │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ → Internet Protocol Address!                        │    │
  │  │ → Địa chỉ CHUẨN do giao thức IP cung cấp!        │    │
  │  │ → MỖI máy tính trên mạng CẦN IP riêng biệt!     │    │
  │  │ → Máy tính DỰA VÀO IP để phân biệt + giao tiếp! │    │
  │  │                                                      │    │
  │  │ Ví dụ:                                               │    │
  │  │   142.250.190.78     ← KHÓ nhớ! ❌               │    │
  │  │   31.13.66.35        ← KHÓ nhớ! ❌               │    │
  │  │   140.82.121.4       ← KHÓ nhớ! ❌               │    │
  │  │                                                      │    │
  │  │ IPv4: 4 số, mỗi số 0-255 (32 bit!)                │    │
  │  │   → 192.168.1.1                                     │    │
  │  │                                                      │    │
  │  │ IPv6: 128 bit (vì IPv4 sắp hết!)                   │    │
  │  │   → 2001:0db8:85a3:0000:0000:8a2e:0370:7334        │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  SO SÁNH:                                                      │
  │  ┌──────────────┬─────────────────┬─────────────────┐        │
  │  │              │ Domain Name     │ IP Address      │        │
  │  ├──────────────┼─────────────────┼─────────────────┤        │
  │  │ Hướng đến   │ CON NGƯỜI! ★   │ MÁY TÍNH!      │        │
  │  │ Dễ nhớ?     │ ✅ CÓ!         │ ❌ KHÔNG!      │        │
  │  │ Máy hiểu?  │ ❌ KHÔNG!      │ ✅ CÓ!         │        │
  │  │ Ví dụ      │ google.com      │ 142.250.190.78  │        │
  │  └──────────────┴─────────────────┴─────────────────┘        │
  │                                                              │
  │  → IP hướng về MẠNG (network-oriented)!                     │
  │  → Domain Name hướng về NGƯỜI DÙNG (user-oriented)!         │
  │  → Máy tính CHỈ hiểu IP!                                   │
  │  → Cần CHUYỂN ĐỔI domain → IP = DNS RESOLUTION! ★        │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```

---

## §2. Mối Quan Hệ Domain ↔ IP!

```
  DOMAIN ↔ IP RELATIONSHIP:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  QUAN HỆ: 1 ĐỐI 1  hoặc  NHIỀU ĐỐI 1!                    │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │                                                      │    │
  │  │  ① 1 ĐỐI 1 (One-to-One):                           │    │
  │  │  ┌───────────────┐     ┌─────────────────┐          │    │
  │  │  │ example.com   │────→│ 93.184.216.34   │          │    │
  │  │  └───────────────┘     └─────────────────┘          │    │
  │  │  → 1 domain = 1 IP!                                │    │
  │  │                                                      │    │
  │  │  ② NHIỀU ĐỐI 1 (Many-to-One):                      │    │
  │  │  ┌───────────────┐                                   │    │
  │  │  │ www.site.com  │──┐                                │    │
  │  │  └───────────────┘  │  ┌─────────────────┐          │    │
  │  │  ┌───────────────┐  ├─→│ 104.16.51.111   │          │    │
  │  │  │ api.site.com  │──┤  └─────────────────┘          │    │
  │  │  └───────────────┘  │                                │    │
  │  │  ┌───────────────┐  │                                │    │
  │  │  │ cdn.site.com  │──┘                                │    │
  │  │  └───────────────┘                                   │    │
  │  │  → NHIỀU domains → CÙNG 1 IP!                      │    │
  │  │  → Ví dụ: shared hosting!                           │    │
  │  │                                                      │    │
  │  │  ⚠️ NGƯỢC LẠI:                                     │    │
  │  │  → 1 IP CÓ THỂ → nhiều domain!                    │    │
  │  │  → NHƯNG 1 domain CHỈ CÓ 1 IP tại 1 thời điểm!  │    │
  │  │    (trừ load balancing → multiple IP records!)      │    │
  │  │                                                      │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  TÓM TẮT:                                                     │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ → IP = hướng MÁY TÍNH (network-oriented!)          │    │
  │  │ → Domain = hướng CON NGƯỜI (user-oriented!)        │    │
  │  │ → Máy tính chỉ hiểu IP!                            │    │
  │  │ → CHUYỂN ĐỔI domain ↔ IP = DOMAIN RESOLUTION!   │    │
  │  │ → Xử lý bởi DNS Server!                            │    │
  │  │                                                      │    │
  │  │ DNS = Domain Name System!                             │    │
  │  │ = Hệ thống phân giải tên miền!                      │    │
  │  │ = "Danh bạ điện thoại" của Internet! ★             │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```

---

## §3. DNS Resolution — Quy Trình Chi Tiết!

```
  DNS RESOLUTION PROCESS:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  User gõ: www.example.com → Chuyện gì xảy ra?              │
  │                                                              │
  │  BƯỚC 1: Kiểm tra BROWSER DNS CACHE!                        │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ → Browser có cache DNS không?                       │    │
  │  │ → CÓ? → Dùng IP từ cache! XONG! ✅               │    │
  │  │         → Thiết lập TCP connection!                 │    │
  │  │ → KHÔNG? → Sang bước 2!                            │    │
  │  │                                                      │    │
  │  │ Chrome cache: chrome://net-internals/#dns            │    │
  │  │ Cache time: ~60 giây (tùy browser!)                 │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  BƯỚC 2: Kiểm tra HOSTS FILE!                               │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ → OS kiểm tra file hosts!                           │    │
  │  │ → CÓ mapping domain → IP? → Dùng luôn! XONG! ✅  │    │
  │  │         → Thiết lập TCP connection!                 │    │
  │  │ → KHÔNG? → Sang bước 3!                            │    │
  │  │                                                      │    │
  │  │ Vị trí hosts file:                                   │    │
  │  │ macOS/Linux: /etc/hosts                              │    │
  │  │ Windows: C:\Windows\System32\drivers\etc\hosts       │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  BƯỚC 3: Hỏi LOCAL DNS SERVER!                               │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ → OS gửi request đến Local DNS Server!             │    │
  │  │ → Server này thường ở GẦN (cùng thành phố!)       │    │
  │  │ → Hiệu suất TƯƠNG ĐỐI TỐT!                       │    │
  │  │ → CÓ? → Trả IP! XONG! ✅                         │    │
  │  │ → KHÔNG? → Bắt đầu TÌM KIẾM trên Internet!      │    │
  │  │           → Sang bước 4-9 (query chuỗi DNS!)      │    │
  │  │                                                      │    │
  │  │ Local DNS = ISP DNS (nhà mạng cung cấp!)           │    │
  │  │ Ví dụ: Viettel DNS, VNPT DNS, FPT DNS             │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  BƯỚC 4-5: Hỏi ROOT DNS SERVER!                             │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ → Local DNS hỏi Root DNS Server!                   │    │
  │  │ → "www.example.com ở đâu?"                         │    │
  │  │ → Root KHÔNG biết IP cụ thể!                       │    │
  │  │ → NHƯNG biết TLD server (.com)!                    │    │
  │  │ → Trả về: "Hỏi TLD .com server này!"             │    │
  │  │                                                      │    │
  │  │ Root DNS Server: 13 cụm trên toàn thế giới!       │    │
  │  │ a.root-servers.net → m.root-servers.net              │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  BƯỚC 6-7: Hỏi TLD DNS SERVER!                              │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ → Local DNS hỏi TLD Server (.com)!                 │    │
  │  │ → "www.example.com ở đâu?"                         │    │
  │  │ → TLD KHÔNG biết IP cụ thể!                        │    │
  │  │ → NHƯNG biết NameServer của example.com!           │    │
  │  │ → Trả về: "Hỏi NameServer này!"                   │    │
  │  │                                                      │    │
  │  │ TLD = Top-Level Domain server!                       │    │
  │  │ .com, .org, .net, .vn, .jp...                        │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  BƯỚC 8-9: Hỏi NAMESERVER (Authoritative DNS)!              │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ → Local DNS hỏi NameServer!                        │    │
  │  │ → NameServer = DNS server của NHÀ CUNG CẤP domain!│    │
  │  │ → "www.example.com IP là gì?"                      │    │
  │  │ → NameServer TRẢ VỀ IP chính xác!                 │    │
  │  │ → 93.184.216.34 ← ĐÂY LÀ IP! ✅                 │    │
  │  │                                                      │    │
  │  │ NameServer = server của nhà đăng ký domain!        │    │
  │  │ (GoDaddy, Namecheap, Cloudflare DNS...)             │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  BƯỚC 10: Local DNS TRẢ KẾT QUẢ!                            │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ → Local DNS nhận IP từ NameServer!                 │    │
  │  │ → CACHE lại kết quả! (TTL = Time To Live!)        │    │
  │  │ → Trả IP về cho máy tính!                          │    │
  │  │ → Browser nhận IP → TCP connection! ✅             │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```

---

## §4. Sơ Đồ Quy Trình DNS — 10 Bước!

```
  DNS RESOLUTION — FULL DIAGRAM:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │                      ┌──────────────┐                        │
  │                      │ TLD DNS      │                        │
  │                      │ Server       │                        │
  │                      │ (.com/.vn)   │                        │
  │                      └──────┬───────┘                        │
  │                     ⑥↑     │⑦                               │
  │                      │     ↓                                 │
  │   ┌─────────┐   ③  ┌──────────────┐  ④  ┌──────────────┐  │
  │   │ ☁️      │─────→│              │────→│ Root DNS     │  │
  │   │ Máy     │  ②  │ Local DNS    │  ⑤  │ Server       │  │
  │   │ Tính    │←────│ Server       │←────│ (13 cụm!)   │  │
  │   │         │  ⑩  │ (ISP DNS!)   │     └──────────────┘  │
  │   │ ① Cache │     │              │                         │
  │   │ ② Hosts │     └──────┬───────┘                         │
  │   └─────────┘          ⑧↓     ↑⑨                           │
  │                      ┌──────────────┐                        │
  │                      │ NameServer   │                        │
  │                      │ DNS Server   │                        │
  │                      │ (nhà cung    │                        │
  │                      │  cấp domain!)│                        │
  │                      └──────────────┘                        │
  │                                                              │
  │  CHI TIẾT TỪNG BƯỚC:                                          │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ ① Máy tính kiểm tra BROWSER DNS CACHE!             │    │
  │  │   → CÓ? → Dùng cache! XONG! ✅                   │    │
  │  │                                                      │    │
  │  │ ② Máy tính kiểm tra HOSTS FILE!                    │    │
  │  │   → CÓ mapping? → Dùng luôn! XONG! ✅            │    │
  │  │                                                      │    │
  │  │ ③ Máy tính gửi DNS request → LOCAL DNS SERVER!    │    │
  │  │   → "www.example.com IP là gì?"                    │    │
  │  │   ↑ Đây là RECURSIVE QUERY! (đệ quy!)            │    │
  │  │                                                      │    │
  │  │ ④ Local DNS → hỏi ROOT DNS SERVER!                │    │
  │  │   → "www.example.com ở đâu?"                      │    │
  │  │                                                      │    │
  │  │ ⑤ Root DNS → trả về TLD DNS Server address!       │    │
  │  │   → "Hỏi .com TLD server!"                        │    │
  │  │                                                      │    │
  │  │ ⑥ Local DNS → hỏi TLD DNS SERVER!                 │    │
  │  │   → "www.example.com ở đâu?"                      │    │
  │  │                                                      │    │
  │  │ ⑦ TLD DNS → trả về NameServer address!            │    │
  │  │   → "Hỏi NameServer của example.com!"             │    │
  │  │                                                      │    │
  │  │ ⑧ Local DNS → hỏi NAMESERVER!                     │    │
  │  │   → "www.example.com IP chính xác?"               │    │
  │  │                                                      │    │
  │  │ ⑨ NameServer → trả về IP CHÍNH XÁC!               │    │
  │  │   → "93.184.216.34" ← ĐÂY! ✅                   │    │
  │  │                                                      │    │
  │  │ ⑩ Local DNS → trả kết quả về MÁY TÍNH!           │    │
  │  │   → Cache kết quả! (TTL!)                          │    │
  │  │   → Browser nhận IP → TCP connection!              │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```

---

## §5. Recursive vs Iterative Query!

```
  RECURSIVE vs ITERATIVE QUERY:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  ① RECURSIVE QUERY (Truy vấn ĐỆ QUY!):                     │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ → Máy tính → Local DNS Server!                    │    │
  │  │ → "Tìm HỘ tôi! Trả kết quả CUỐI CÙNG!"         │    │
  │  │                                                      │    │
  │  │   Máy tính                Local DNS                  │    │
  │  │     │── "IP của X?" ───────→│                       │    │
  │  │     │                        │ (đi tìm...)          │    │
  │  │     │                        │ Root→TLD→NameServer  │    │
  │  │     │←── "IP = 1.2.3.4" ───│ (tìm xong!)         │    │
  │  │                                                      │    │
  │  │ → Client CHỈ hỏi 1 LẦN!                           │    │
  │  │ → Local DNS LÀM HỘ toàn bộ!                      │    │
  │  │ → Giống gọi tổng đài: "Tìm giúp tôi!" ★        │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  ② ITERATIVE QUERY (Truy vấn LẶP LẠI!):                    │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ → Local DNS → Root → TLD → NameServer!            │    │
  │  │ → Mỗi server CHỈ TRẢ "hỏi chỗ nào tiếp theo!"  │    │
  │  │                                                      │    │
  │  │   Local DNS         Root         TLD        NS      │    │
  │  │     │──"IP?"───→│              │           │       │    │
  │  │     │←─"hỏi TLD"─│              │           │       │    │
  │  │     │────────────"IP?"──→│           │       │    │
  │  │     │←───────────"hỏi NS"──│           │       │    │
  │  │     │──────────────────────"IP?"───→│       │    │
  │  │     │←─────────────────────"1.2.3.4"──│       │    │
  │  │                                                      │    │
  │  │ → Local DNS HỎI TỪNG SERVER một!                  │    │
  │  │ → Mỗi server chỉ cho "HƯỚNG DẪN" tiếp theo!     │    │
  │  │ → Giống hỏi đường: "Rẽ phải, hỏi tiếp!" ★      │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  TÓM TẮT:                                                     │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │              │ Recursive       │ Iterative          │    │
  │  │ ─────────────┼─────────────────┼──────────────      │    │
  │  │ Ai làm?     │ Server LÀM HỘ! │ Client tự hỏi!   │    │
  │  │ Số lần hỏi │ 1 lần!          │ Nhiều lần!        │    │
  │  │ Dùng ở đâu │ Client→Local ★ │ Local→Root/TLD!   │    │
  │  │ Giống như   │ Gọi tổng đài!  │ Hỏi đường!       │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```

---

## §6. DNS Resolution Optimization!

```
  DNS OPTIMIZATION:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  ① HTTP PAGE — TỰ ĐỘNG RESOLVE!                             │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ → Khi tải trang HTTP, browser TỰ ĐỘNG resolve     │    │
  │  │   domain trong thuộc tính href của hyperlinks!      │    │
  │  │ → Chuyển domain → IP TRƯỚC khi user click!        │    │
  │  │                                                      │    │
  │  │ ⚠️ NHƯNG! Trang HTTPS:                              │    │
  │  │ → Vì lý do BẢO MẬT, HTTPS KHÔNG tự động resolve! │    │
  │  │ → Phải BẬT thủ công!                               │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  ② HTTPS PAGE — BẬT DNS PREFETCH!                           │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │                                                      │    │
  │  │ Cách 1: HTML meta tag!                               │    │
  │  │ ┌──────────────────────────────────────────────┐    │    │
  │  │ │ <meta                                        │    │    │
  │  │ │   http-equiv="x-dns-prefetch-control"        │    │    │
  │  │ │   content="on"                                │    │    │
  │  │ │ >                                             │    │    │
  │  │ └──────────────────────────────────────────────┘    │    │
  │  │                                                      │    │
  │  │ Cách 2: Response header!                             │    │
  │  │ ┌──────────────────────────────────────────────┐    │    │
  │  │ │ ctx.set('X-DNS-Prefetch-Control', 'on')      │    │    │
  │  │ └──────────────────────────────────────────────┘    │    │
  │  │                                                      │    │
  │  │ → "on" = BẬT DNS pre-resolve!                     │    │
  │  │ → "off" = TẮT DNS pre-resolve!                    │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  ③ MANUAL DNS PREFETCH — THỦ CÔNG!                          │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │                                                      │    │
  │  │ ┌──────────────────────────────────────────────┐    │    │
  │  │ │ <link                                        │    │    │
  │  │ │   rel="dns-prefetch"                          │    │    │
  │  │ │   href="//file.cdn.com"                       │    │    │
  │  │ │ >                                             │    │    │
  │  │ └──────────────────────────────────────────────┘    │    │
  │  │                                                      │    │
  │  │ → Chỉ định domain CỤ THỂ để pre-resolve!         │    │
  │  │ → Chủ yếu dùng cho CDN resources! ★               │    │
  │  │ → KHUYẾN NGHỊ dùng trong mọi dự án!               │    │
  │  │                                                      │    │
  │  │ VỊ TRÍ ĐẶT TỐI ƯU:                                │    │
  │  │ ┌──────────────────────────────────────────────┐    │    │
  │  │ │ <head>                                        │    │    │
  │  │ │   <meta charset="utf-8">                      │    │    │
  │  │ │   <link rel="dns-prefetch"                    │    │    │
  │  │ │         href="//file.cdn.com">                │    │    │
  │  │ │   <link rel="dns-prefetch"                    │    │    │
  │  │ │         href="//api.example.com">             │    │    │
  │  │ │   <link rel="dns-prefetch"                    │    │    │
  │  │ │         href="//fonts.googleapis.com">        │    │    │
  │  │ │   <!-- CSS, JS, etc. -->                      │    │    │
  │  │ │ </head>                                       │    │    │
  │  │ └──────────────────────────────────────────────┘    │    │
  │  │                                                      │    │
  │  │ → Đặt SAU <meta charset>!                         │    │
  │  │ → Đặt TRƯỚC CSS & JS!                             │    │
  │  │ → Resolve SỚM NHẤT có thể!                       │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  ④ TẠI SAO DNS PREFETCH QUAN TRỌNG?                          │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ → DNS request tốn RẤT ÍT bandwidth!               │    │
  │  │ → NHƯNG latency TƯƠNG ĐỐI CAO!                    │    │
  │  │ → Đặc biệt trên MẠNG DI ĐỘNG! ★                  │    │
  │  │                                                      │    │
  │  │ DNS Lookup Time:                                      │    │
  │  │ ┌──────────────────────────────────────────┐        │    │
  │  │ │ WiFi:        ~20-50ms     ← tạm OK!     │        │    │
  │  │ │ 4G:          ~50-100ms    ← chậm!       │        │    │
  │  │ │ 3G:          ~100-300ms   ← RẤT chậm!  │        │    │
  │  │ │ DNS Prefetch: ~0ms         ← ĐÃ resolve!│        │    │
  │  │ └──────────────────────────────────────────┘        │    │
  │  │                                                      │    │
  │  │ → Pre-resolve = GIẢM ĐÁNG KỂ latency!             │    │
  │  │ → User click link = PHẢN HỒI NGAY!                │    │
  │  │ → Tăng tốc page response! ★                       │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  ⑤ CÁC KỸ THUẬT TỐI ƯU KHÁC!                                │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ ★ preconnect: DNS + TCP + TLS luôn!               │    │
  │  │   <link rel="preconnect" href="//api.example.com"> │    │
  │  │   → Mạnh hơn dns-prefetch!                        │    │
  │  │   → Dùng cho resources CHẮC CHẮN sẽ dùng!        │    │
  │  │                                                      │    │
  │  │ ★ preload: download NGAY resource!                 │    │
  │  │   <link rel="preload" href="/main.js" as="script"> │    │
  │  │   → DNS + TCP + TLS + Download!                    │    │
  │  │   → Tải NGAY! Ưu tiên HIGH!                       │    │
  │  │                                                      │    │
  │  │ ★ prefetch: download THẤP ưu tiên!                │    │
  │  │   <link rel="prefetch" href="/next-page.js">       │    │
  │  │   → Cho trang TIẾP THEO!                           │    │
  │  │   → Ưu tiên LOW! Tải khi rảnh!                    │    │
  │  │                                                      │    │
  │  │ SO SÁNH:                                              │    │
  │  │ ┌──────────────────────────────────────────┐        │    │
  │  │ │ dns-prefetch: DNS only        ← nhẹ!   │        │    │
  │  │ │ preconnect:   DNS+TCP+TLS     ← mạnh!  │        │    │
  │  │ │ preload:      DNS→Download    ← nặng!  │        │    │
  │  │ │ prefetch:     DNS→Download    ← idle!  │        │    │
  │  │ └──────────────────────────────────────────┘        │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```

---

## §7. Hosts File!

```
  HOSTS FILE:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  HOSTS FILE LÀ GÌ?                                            │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ → File hệ thống KHÔNG CÓ phần mở rộng!           │    │
  │  │ → Lưu trữ mapping DOMAIN ↔ IP!                   │    │
  │  │ → OS kiểm tra hosts TRƯỚC khi hỏi DNS server!    │    │
  │  │ → Ưu tiên CAO HƠN DNS!                            │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  VỊ TRÍ:                                                      │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ macOS / Linux:                                       │    │
  │  │   /etc/hosts                                         │    │
  │  │                                                      │    │
  │  │ Windows:                                              │    │
  │  │   C:\Windows\System32\drivers\etc\hosts              │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  NỘI DUNG:                                                     │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ # Đây là comment (bắt đầu bằng #)                 │    │
  │  │ # Host Database                                      │    │
  │  │ # localhost is used to configure the loopback        │    │
  │  │                                                      │    │
  │  │ 127.0.0.1       localhost                            │    │
  │  │ 255.255.255.255 broadcasthost                        │    │
  │  │ ::1             localhost                            │    │
  │  │                                                      │    │
  │  │ # Custom mappings:                                   │    │
  │  │ 192.168.1.100   myserver.local                       │    │
  │  │ 127.0.0.1       blocked-site.com   ← CHẶN site!  │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  CÁCH SỬA HOSTS FILE:                                          │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ macOS:                                                │    │
  │  │   sudo nano /etc/hosts                               │    │
  │  │   → Thêm dòng: 127.0.0.1  mysite.local             │    │
  │  │   → Ctrl+O lưu → Ctrl+X thoát!                    │    │
  │  │   → sudo dscacheutil -flushcache  ← xóa cache!   │    │
  │  │                                                      │    │
  │  │ Windows:                                              │    │
  │  │   → Mở Notepad AS ADMINISTRATOR!                   │    │
  │  │   → File → Open → hosts file                       │    │
  │  │   → Thêm dòng → Save!                              │    │
  │  │   → ipconfig /flushdns  ← xóa cache!              │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  USE CASES:                                                    │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ ★ Development: test domain trên localhost!         │    │
  │  │   127.0.0.1  myapp.local                             │    │
  │  │                                                      │    │
  │  │ ★ CHẶN websites:                                   │    │
  │  │   127.0.0.1  facebook.com                            │    │
  │  │   127.0.0.1  youtube.com                             │    │
  │  │   → Redirect về localhost = KHÔNG truy cập được! │    │
  │  │                                                      │    │
  │  │ ★ Test staging server:                               │    │
  │  │   10.0.0.50  staging.myapp.com                       │    │
  │  │   → Trỏ domain về staging IP!                     │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```

---

## §8. Tự Viết — DNSResolverEngine!

```javascript
// ═══════════════════════════════════════════════════
// DNS RESOLVER ENGINE — Tự viết bằng tay!
// ═══════════════════════════════════════════════════

class DNSResolverEngine {
  constructor() {
    // ① Browser DNS Cache
    this.browserCache = new Map();
    // Cache TTL mặc định 60 giây
    this.cacheTTL = 60 * 1000;

    // ② Hosts file mapping
    this.hostsFile = new Map([
      ['localhost', '127.0.0.1'],
      ['broadcasthost', '255.255.255.255'],
    ]);

    // ③ Local DNS Server cache
    this.localDNSCache = new Map();

    // ④ Root DNS Server — biết TLD servers
    this.rootDNS = {
      name: 'Root DNS Server',
      // Root chỉ biết TLD server addresses
      tldServers: {
        'com': 'tld-com.server.net',
        'org': 'tld-org.server.net',
        'net': 'tld-net.server.net',
        'vn':  'tld-vn.server.net',
        'io':  'tld-io.server.net',
      },
    };

    // ⑤ TLD DNS Servers — biết NameServers
    this.tldDNS = {
      'com': {
        'google':    'ns1.google.com',
        'facebook':  'ns1.facebook.com',
        'github':    'ns1.github.com',
        'example':   'ns1.example.com',
      },
      'vn': {
        'vnexpress': 'ns1.vnexpress.vn',
      },
    };

    // ⑥ NameServers — biết IP chính xác!
    this.nameServers = {
      'ns1.google.com': {
        'www.google.com':    '142.250.190.78',
        'mail.google.com':   '142.250.190.83',
        'api.google.com':    '142.250.190.90',
      },
      'ns1.facebook.com': {
        'www.facebook.com':  '31.13.66.35',
      },
      'ns1.github.com': {
        'www.github.com':    '140.82.121.4',
        'api.github.com':    '140.82.121.6',
      },
      'ns1.example.com': {
        'www.example.com':   '93.184.216.34',
      },
      'ns1.vnexpress.vn': {
        'www.vnexpress.vn':  '111.65.250.2',
      },
    };

    // Logs
    this.logs = [];
  }

  // ═══════════ LOG ═══════════
  log(step, message) {
    const entry = `[Bước ${step}] ${message}`;
    this.logs.push(entry);
    console.log(entry);
  }

  // ═══════════ PARSE DOMAIN ═══════════
  parseDomain(domain) {
    // Xóa protocol + path
    let clean = domain
      .replace(/^https?:\/\//, '')
      .replace(/\/.*$/, '')
      .replace(/:\d+$/, '');

    const parts = clean.split('.');
    // parts = ['www', 'google', 'com']

    return {
      full: clean,
      subdomain: parts.length > 2 ? parts[0] : '',
      sld: parts.length > 2 ? parts[1] : parts[0], // second-level
      tld: parts[parts.length - 1], // top-level
    };
  }

  // ═══════════ BƯỚC 1: Browser Cache ═══════════
  checkBrowserCache(domain) {
    this.log('①', `Kiểm tra Browser DNS Cache: "${domain}"`);

    const cached = this.browserCache.get(domain);
    if (cached && Date.now() - cached.timestamp < this.cacheTTL) {
      this.log('①', `✅ Cache HIT! IP = ${cached.ip} (TTL còn ${
        Math.round((this.cacheTTL - (Date.now() - cached.timestamp)) / 1000)
      }s)`);
      return cached.ip;
    }

    this.log('①', '❌ Cache MISS! Sang bước 2...');
    return null;
  }

  // ═══════════ BƯỚC 2: Hosts File ═══════════
  checkHostsFile(domain) {
    this.log('②', `Kiểm tra Hosts File: "${domain}"`);

    const ip = this.hostsFile.get(domain);
    if (ip) {
      this.log('②', `✅ Tìm thấy trong hosts! IP = ${ip}`);
      return ip;
    }

    this.log('②', '❌ Không có trong hosts! Sang bước 3...');
    return null;
  }

  // ═══════════ BƯỚC 3: Local DNS ═══════════
  checkLocalDNS(domain) {
    this.log('③', `Gửi request đến Local DNS Server (ISP!)`);

    const cached = this.localDNSCache.get(domain);
    if (cached) {
      this.log('③', `✅ Local DNS có cache! IP = ${cached}`);
      return cached;
    }

    this.log('③', '❌ Local DNS không có cache! Bắt đầu iterative query...');
    return null;
  }

  // ═══════════ BƯỚC 4-5: Query Root DNS ═══════════
  queryRootDNS(domain) {
    const parsed = this.parseDomain(domain);
    this.log('④', `Local DNS hỏi Root DNS: "${domain} ở đâu?"`);

    const tldServer = this.rootDNS.tldServers[parsed.tld];
    if (tldServer) {
      this.log('⑤', `Root DNS trả về: "Hỏi TLD .${parsed.tld} server: ${tldServer}"`);
      return { tld: parsed.tld, tldServer };
    }

    this.log('⑤', `❌ Root DNS không biết TLD .${parsed.tld}!`);
    return null;
  }

  // ═══════════ BƯỚC 6-7: Query TLD DNS ═══════════
  queryTLDDNS(domain, tld) {
    const parsed = this.parseDomain(domain);
    this.log('⑥', `Local DNS hỏi TLD .${tld} Server: "${domain} ở đâu?"`);

    const tldData = this.tldDNS[tld];
    if (tldData && tldData[parsed.sld]) {
      const ns = tldData[parsed.sld];
      this.log('⑦', `TLD Server trả về: "Hỏi NameServer: ${ns}"`);
      return ns;
    }

    this.log('⑦', `❌ TLD Server không biết ${parsed.sld}.${tld}!`);
    return null;
  }

  // ═══════════ BƯỚC 8-9: Query NameServer ═══════════
  queryNameServer(domain, nsServer) {
    this.log('⑧', `Local DNS hỏi NameServer ${nsServer}: "IP của ${domain}?"`);

    const nsData = this.nameServers[nsServer];
    if (nsData && nsData[domain]) {
      const ip = nsData[domain];
      this.log('⑨', `✅ NameServer trả về IP CHÍNH XÁC: ${ip}`);
      return ip;
    }

    this.log('⑨', `❌ NameServer không có record cho ${domain}!`);
    return null;
  }

  // ═══════════ FULL DNS RESOLUTION ═══════════
  resolve(url) {
    this.logs = [];
    const domain = url.replace(/^https?:\/\//, '').replace(/\/.*$/, '');

    console.log('\n' + '═'.repeat(50));
    console.log(`🔍 DNS RESOLVE: ${domain}`);
    console.log('═'.repeat(50));

    // Bước 1: Browser Cache
    let ip = this.checkBrowserCache(domain);
    if (ip) return this.result(domain, ip, 'Browser Cache');

    // Bước 2: Hosts File
    ip = this.checkHostsFile(domain);
    if (ip) return this.result(domain, ip, 'Hosts File');

    // Bước 3: Local DNS Cache
    ip = this.checkLocalDNS(domain);
    if (ip) return this.result(domain, ip, 'Local DNS Cache');

    // Bước 4-5: Root DNS
    const rootResult = this.queryRootDNS(domain);
    if (!rootResult) return this.result(domain, null, 'FAILED');

    // Bước 6-7: TLD DNS
    const nsServer = this.queryTLDDNS(domain, rootResult.tld);
    if (!nsServer) return this.result(domain, null, 'FAILED');

    // Bước 8-9: NameServer
    ip = this.queryNameServer(domain, nsServer);
    if (!ip) return this.result(domain, null, 'FAILED');

    // Bước 10: Cache kết quả!
    this.log('⑩', `Local DNS cache kết quả + trả về máy tính!`);
    this.browserCache.set(domain, { ip, timestamp: Date.now() });
    this.localDNSCache.set(domain, ip);

    return this.result(domain, ip, 'NameServer (Full Resolution)');
  }

  result(domain, ip, source) {
    console.log('\n' + '─'.repeat(40));
    if (ip) {
      console.log(`✅ KẾT QUẢ: ${domain} → ${ip}`);
      console.log(`📍 NGUỒN: ${source}`);
    } else {
      console.log(`❌ THẤT BẠI: Không resolve được ${domain}`);
    }
    console.log('─'.repeat(40) + '\n');
    return { domain, ip, source, logs: [...this.logs] };
  }

  // ═══════════ DNS PREFETCH ═══════════
  dnsPrefetch(domains) {
    console.log('\n🚀 DNS PREFETCH — Pre-resolve domains!');
    console.log('─'.repeat(40));

    const results = [];
    for (const domain of domains) {
      const result = this.resolve(domain);
      results.push(result);
    }

    console.log('✅ Prefetch hoàn tất! Tất cả domains đã cached!');
    return results;
  }

  // ═══════════ HOSTS FILE OPERATIONS ═══════════
  addHostsEntry(domain, ip) {
    this.hostsFile.set(domain, ip);
    console.log(`📝 Hosts: Thêm ${domain} → ${ip}`);
  }

  removeHostsEntry(domain) {
    this.hostsFile.delete(domain);
    console.log(`🗑️ Hosts: Xóa ${domain}`);
  }

  showHostsFile() {
    console.log('\n📄 HOSTS FILE:');
    console.log('─'.repeat(35));
    for (const [domain, ip] of this.hostsFile) {
      console.log(`  ${ip.padEnd(20)} ${domain}`);
    }
    console.log('─'.repeat(35));
  }

  // ═══════════ DEMO ═══════════
  demo() {
    console.log('╔══════════════════════════════════════╗');
    console.log('║   DNS RESOLVER ENGINE — DEMO!        ║');
    console.log('╚══════════════════════════════════════╝\n');

    // 1. Full resolution (10 bước!)
    console.log('━━━ Demo 1: Full DNS Resolution ━━━');
    this.resolve('www.google.com');

    // 2. Cache HIT (bước 1!)
    console.log('━━━ Demo 2: Browser Cache HIT ━━━');
    this.resolve('www.google.com');

    // 3. Hosts file
    console.log('━━━ Demo 3: Hosts File ━━━');
    this.addHostsEntry('myapp.local', '127.0.0.1');
    this.resolve('myapp.local');

    // 4. DNS Prefetch
    console.log('━━━ Demo 4: DNS Prefetch ━━━');
    this.dnsPrefetch([
      'www.facebook.com',
      'www.github.com',
    ]);

    // 5. Show hosts file
    this.showHostsFile();

    // 6. Parse domain
    console.log('\n━━━ Demo 5: Parse Domain ━━━');
    const parsed = this.parseDomain('https://api.google.com/v1/search');
    console.log('Domain:', parsed);
  }
}

// ═══════════ CHẠY DEMO ═══════════
const engine = new DNSResolverEngine();
engine.demo();
```

---

## §9. Câu Hỏi Luyện Tập!

```
  CÂU HỎI PHỎNG VẤN:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  ❓ Câu 1: DNS Resolution gồm mấy bước?                     │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ TRẢ LỜI:                                            │    │
  │  │ 10 bước chính:                                       │    │
  │  │ ① Kiểm tra Browser DNS Cache                       │    │
  │  │ ② Kiểm tra Hosts File                               │    │
  │  │ ③ Hỏi Local DNS Server (ISP!)                      │    │
  │  │ ④ Local DNS hỏi Root DNS Server                    │    │
  │  │ ⑤ Root trả về TLD Server address                   │    │
  │  │ ⑥ Local DNS hỏi TLD DNS Server                    │    │
  │  │ ⑦ TLD trả về NameServer address                   │    │
  │  │ ⑧ Local DNS hỏi NameServer                        │    │
  │  │ ⑨ NameServer trả về IP chính xác                  │    │
  │  │ ⑩ Local DNS trả kết quả + cache                   │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  ❓ Câu 2: Recursive vs Iterative Query khác nhau gì?       │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ TRẢ LỜI:                                            │    │
  │  │ Recursive: Client hỏi 1 lần → server LÀM HỘ     │    │
  │  │ toàn bộ quá trình tìm kiếm → trả kết quả cuối!  │    │
  │  │ Dùng: Client → Local DNS!                           │    │
  │  │                                                      │    │
  │  │ Iterative: Server chỉ trả "hỏi chỗ nào tiếp"    │    │
  │  │ → client tự hỏi tiếp từng server một!             │    │
  │  │ Dùng: Local DNS → Root → TLD → NameServer!        │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  ❓ Câu 3: Làm sao tối ưu DNS trên HTTPS page?              │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ TRẢ LỜI:                                            │    │
  │  │ HTTPS không tự động DNS resolve (bảo mật!)         │    │
  │  │ Phải bật thủ công:                                   │    │
  │  │                                                      │    │
  │  │ ① Meta tag:                                          │    │
  │  │ <meta http-equiv="x-dns-prefetch-control"           │    │
  │  │       content="on">                                  │    │
  │  │                                                      │    │
  │  │ ② Manual prefetch:                                   │    │
  │  │ <link rel="dns-prefetch" href="//cdn.example.com">  │    │
  │  │                                                      │    │
  │  │ ③ Đặt sau <meta charset> và TRƯỚC CSS/JS!         │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  ❓ Câu 4: dns-prefetch vs preconnect khác nhau gì?          │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ TRẢ LỜI:                                            │    │
  │  │ dns-prefetch: CHỈ resolve DNS thôi! (nhẹ!)        │    │
  │  │ preconnect: DNS + TCP + TLS luôn! (mạnh hơn!)     │    │
  │  │                                                      │    │
  │  │ Dùng dns-prefetch cho domains CÓ THỂ dùng!        │    │
  │  │ Dùng preconnect cho domains CHẮC CHẮN dùng!       │    │
  │  │                                                      │    │
  │  │ preconnect tốn nhiều tài nguyên hơn →              │    │
  │  │ chỉ dùng cho critical domains!                      │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  ❓ Câu 5: Hosts file là gì? Ưu tiên ra sao?                │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ TRẢ LỜI:                                            │    │
  │  │ → File hệ thống lưu mapping domain → IP!          │    │
  │  │ → KHÔNG có phần mở rộng!                           │    │
  │  │ → OS kiểm tra TRƯỚC khi hỏi DNS server!          │    │
  │  │ → Ưu tiên: Browser Cache → Hosts → Local DNS!    │    │
  │  │                                                      │    │
  │  │ macOS: /etc/hosts                                    │    │
  │  │ Windows: C:\Windows\System32\drivers\etc\hosts       │    │
  │  │                                                      │    │
  │  │ Use cases: dev localhost, chặn site, test staging!  │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  ❓ Câu 6: Domain Name và IP Address khác nhau gì?           │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ TRẢ LỜI:                                            │    │
  │  │ → Domain Name hướng CON NGƯỜI (user-oriented!)    │    │
  │  │   Dễ nhớ: google.com, facebook.com                 │    │
  │  │ → IP Address hướng MÁY TÍNH (network-oriented!)   │    │
  │  │   Khó nhớ: 142.250.190.78                           │    │
  │  │                                                      │    │
  │  │ Quan hệ: 1-1 hoặc nhiều-1!                         │    │
  │  │ → Nhiều domain → 1 IP (shared hosting!)            │    │
  │  │ → 1 domain → 1 IP (tại 1 thời điểm!)            │    │
  │  │                                                      │    │
  │  │ Chuyển đổi domain ↔ IP = DNS Resolution!          │    │
  │  │ Xử lý bởi DNS Server!                              │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```

---

> **TÓM TẮT**: DNS Resolution là quá trình chuyển đổi domain → IP. Browser kiểm tra cache → hosts → Local DNS → Root → TLD → NameServer. Tối ưu bằng `dns-prefetch` và `preconnect`! ★
