# Localhost vs 127.0.0.1 — Deep Dive!

> **`localhost` và `127.0.0.1` khác nhau thế nào?**
> Phân tích cực kỳ chi tiết từ DNS, Domain, IP, Hosts File, đến Private IP và IPv6!

---

## §1. Câu Hỏi — localhost và 127.0.0.1 Khác Gì?

```
  VẤN ĐỀ:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  Frontend dev chạy npm run dev:                                │
  │  → http://localhost:3000/index.html                          │
  │                                                              │
  │  Hoặc:                                                         │
  │  → http://127.0.0.1:3000/index.html                          │
  │                                                              │
  │  CẢ HAI đều mở CÙNG trang web!                                │
  │  VẬY CHÚNG KHÁC NHAU Ở ĐÂU?                                   │
  │                                                              │
  │  TRẢ LỜI NGẮN:                                                 │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │                                                      │    │
  │  │  localhost = TÊN MIỀN (domain name)! 📛              │    │
  │  │  127.0.0.1 = ĐỊA CHỈ IP! 🔢                        │    │
  │  │                                                      │    │
  │  │  localhost PHÂN GIẢI thành 127.0.0.1!                 │    │
  │  │  Giống như: baidu.com → 39.156.66.10!                │    │
  │  │                                                      │    │
  │  │  NHƯNG cách phân giải KHÁC NHAU:                      │    │
  │  │  baidu.com → tra DNS (server bên ngoài!)             │    │
  │  │  localhost → tra file HOSTS (local!) ★               │    │
  │  │                                                      │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  ĐỂ HIỂU SÂU → CẦN NẮM:                                    │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ ① Tên miền (Domain) là gì?                            │    │
  │  │ ② Địa chỉ IP là gì?                                  │    │
  │  │ ③ DNS hoạt động thế nào?                              │    │
  │  │ ④ File hosts hoạt động thế nào?                       │    │
  │  │ ⑤ Port (cổng) là gì?                                  │    │
  │  │ ⑥ Loopback interface (127.0.0.0/8) là gì?            │    │
  │  │ ⑦ Phân cấp tên miền (TLD, SLD, 3LD)!                 │    │
  │  │ ⑧ Private IP vs Public IP!                            │    │
  │  │ ⑨ IPv4 vs IPv6!                                       │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```

---

## §2. Từ Domain Name Đến Chương Trình!

```
  LUỒNG TRUY CẬP WEBSITE — VÍ DỤ BAIDU.COM:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  User gõ: baidu.com                                            │
  │    │                                                          │
  │    ↓ BƯỚC 1: PHÂN GIẢI TÊN MIỀN (DNS Lookup)!               │
  │                                                              │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ Browser hỏi DNS Server:                              │    │
  │  │ "baidu.com có IP là gì?"                              │    │
  │  │                                                      │    │
  │  │ DNS Server trả lời:                                   │    │
  │  │ "baidu.com → 39.156.66.10" ★                        │    │
  │  │                                                      │    │
  │  │ GIẢI THÍCH:                                           │    │
  │  │ → Domain = TÊN CÔNG TY (dễ nhớ!)                    │    │
  │  │ → IP = ĐỊA CHỈ VẬT LÝ (router tìm đường!)        │    │
  │  │ → DNS = DANH BẠ ĐIỆN THOẠI!                         │    │
  │  │   Tra tên → ra số!                                   │    │
  │  │                                                      │    │
  │  │ Public IP lấy từ đâu?                                │    │
  │  │ → ISP (nhà cung cấp internet: Viettel, VNPT...)    │    │
  │  │ → Cấp cho gateway server của công ty!                │    │
  │  │ → Gateway = "TỔNG ĐÀI" chuyển tiếp request! ★     │    │
  │  └──────────────────────────────────────────────────────┘    │
  │    │                                                          │
  │    ↓ BƯỚC 2: GỬI REQUEST ĐẾN IP!                            │
  │                                                              │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ OS đóng gói request thành IP packet!                  │    │
  │  │ → Gửi qua mạng theo routing protocol!               │    │
  │  │ → Chuyển tiếp qua nhiều router!                     │    │
  │  │ → Cuối cùng đến máy có IP 39.156.66.10!            │    │
  │  │                                                      │    │
  │  │   User → Router 1 → Router 2 → ... → Server!       │    │
  │  └──────────────────────────────────────────────────────┘    │
  │    │                                                          │
  │    ↓ BƯỚC 3: TÌM ĐÚNG CHƯƠNG TRÌNH (PORT!)                  │
  │                                                              │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ 1 máy có thể chạy NHIỀU chương trình mạng!          │    │
  │  │ → Web server, email server, FTP server, ...          │    │
  │  │ → Phân biệt bằng PORT (cổng)!                      │    │
  │  │                                                      │    │
  │  │ → HTTP mặc định port 80!                             │    │
  │  │ → HTTPS mặc định port 443!                           │    │
  │  │ → Nếu gõ baidu.com → thực ra là baidu.com:80!      │    │
  │  │ → Nếu gõ baidu.com:3000 → port 3000!               │    │
  │  │                                                      │    │
  │  │ Mỗi chương trình BIND (gắn) với 1 port!             │    │
  │  │ → 2 chương trình KHÔNG được bind cùng port!        │    │
  │  │ → Bind trùng → lỗi "port already in use"! ❌       │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```

```
  SƠ ĐỒ TỔNG QUAN:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  User gõ: http://baidu.com:80/index.html                       │
  │                │        │    │                                │
  │                │        │    └── path: /index.html            │
  │                │        └── port: 80 (mặc định HTTP!)       │
  │                └── domain: baidu.com                          │
  │                                                              │
  │  ① baidu.com ─── DNS ──→ 39.156.66.10 (IP!)                 │
  │                                                              │
  │  ② Browser ──request──→ 39.156.66.10:80                      │
  │                                                              │
  │  ③ Server nhận ─── port 80 ──→ Nginx (web server)           │
  │                                                              │
  │  ④ Nginx ──→ trả về HTML ──→ Browser hiển thị!             │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```

---

## §3. localhost Là Gì?

```
  LOCALHOST:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  ĐỊNH NGHĨA:                                                   │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ localhost là MỘT TÊN MIỀN (domain name)!             │    │
  │  │                                                      │    │
  │  │ → Không khác gì baidu.com hay google.com!            │    │
  │  │ → Chỉ đơn giản là TÊN, dễ nhớ thay cho số IP!     │    │
  │  │                                                      │    │
  │  │ NHƯNG phạm vi KHÁC:                                   │    │
  │  │ → baidu.com → ai cũng truy cập được!               │    │
  │  │ → localhost → CHỈ dùng trên MÁY HIỆN TẠI! ★       │    │
  │  │                                                      │    │
  │  │ local = NỘI BỘ! host = MÁY CHỦ!                     │    │
  │  │ → localhost = "máy chủ nội bộ" = MÁY CỦA BẠN!    │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  ĐẶC ĐIỂM:                                                    │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ → Anh A dùng localhost → mở trang CỦA ANH A!       │    │
  │  │ → Chị B dùng localhost → mở trang CỦA CHỊ B!       │    │
  │  │ → KHÔNG XUNG ĐỘT! Mỗi máy có localhost RIÊNG!     │    │
  │  │                                                      │    │
  │  │ → localhost KHÔNG sử dụng mạng bên ngoài!          │    │
  │  │ → Không cần kết nối internet!                       │    │
  │  │ → Data đi VÒNG LẬP (loopback) trong máy! ★        │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```

---

## §4. 127.0.0.1 Là Gì?

```
  127.0.0.1 — LOOPBACK IP ADDRESS:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  ĐỊNH NGHĨA:                                                   │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ 127.0.0.1 là ĐỊA CHỈ IP cục bộ (local IP address)! │    │
  │  │                                                      │    │
  │  │ → Là IP của CHÍNH MÁY HIỆN TẠI!                    │    │
  │  │ → Chỉ dùng trên MÁY HIỆN TẠI!                     │    │
  │  │ → KHÔNG cần kết nối internet!                       │    │
  │  │ → Dùng để phát triển và test network programs!       │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  IP ADDRESS LÀ GÌ?                                              │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │                                                      │    │
  │  │ IPv4 format: X.X.X.X (4 phần, ngăn bởi dấu ".")!  │    │
  │  │                                                      │    │
  │  │ Thực chất = SỐ NHỊ PHÂN 32-bit!                     │    │
  │  │ → Chia thành 4 đoạn, mỗi đoạn 8-bit!              │    │
  │  │ → Mỗi đoạn chuyển sang thập phân (0-255)!          │    │
  │  │                                                      │    │
  │  │ VD: 127.0.0.1                                         │    │
  │  │ = 01111111.00000000.00000000.00000001 (nhị phân!)    │    │
  │  │   ↑         ↑         ↑         ↑                    │    │
  │  │  127        0         0         1                     │    │
  │  │                                                      │    │
  │  │ VD: 192.168.1.100                                     │    │
  │  │ = 11000000.10101000.00000001.01100100                 │    │
  │  │   ↑         ↑         ↑         ↑                    │    │
  │  │  192       168        1        100                    │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  LOOPBACK INTERFACE:                                            │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ 127.0.0.1 thuộc dải LOOPBACK: 127.0.0.0/8!          │    │
  │  │ → Từ 127.0.0.0 đến 127.255.255.255!                │    │
  │  │ → TẤT CẢ đều là loopback! ★                        │    │
  │  │ → 127.0.0.2 cũng hoạt động giống 127.0.0.1!        │    │
  │  │                                                      │    │
  │  │ "LOOPBACK" = VÒNG LẶP!                                │    │
  │  │ → Data GỬI đến 127.x.x.x!                           │    │
  │  │ → KHÔNG ra ngoài mạng!                               │    │
  │  │ → OS chuyển NGƯỢC LẠI cho chính máy! ★              │    │
  │  │ → Như gửi thư cho CHÍNH MÌNH!                       │    │
  │  │                                                      │    │
  │  │ SƠ ĐỒ:                                                │    │
  │  │ ┌─────────────────────────────────────────┐           │    │
  │  │ │  App gửi data đến 127.0.0.1:3000       │           │    │
  │  │ │    │                                     │           │    │
  │  │ │    ↓ OS (Network Stack)                  │           │    │
  │  │ │    │                                     │           │    │
  │  │ │    ├── Đây là 127.x.x.x?               │           │    │
  │  │ │    │   ĐÚng! → LOOPBACK!               │           │    │
  │  │ │    │                                     │           │    │
  │  │ │    ↓ KHÔNG gửi ra network card!          │           │    │
  │  │ │    ↓ Chuyển NGAY cho app listen port 3000│           │    │
  │  │ │    │                                     │           │    │
  │  │ │    ↓ App nhận data! ✅                   │           │    │
  │  │ └─────────────────────────────────────────┘           │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```

---

## §5. Sự Khác Biệt Chính — localhost vs 127.0.0.1!

```
  SO SÁNH CHI TIẾT:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  ┌─────────────────────┬───────────────┬────────────────┐   │
  │  │ TIÊU CHÍ             │ localhost     │ 127.0.0.1      │   │
  │  ├─────────────────────┼───────────────┼────────────────┤   │
  │  │ Loại                 │ TÊN MIỀN     │ ĐỊA CHỈ IP    │   │
  │  │ (Domain/IP)          │ (Domain)      │ (IP Address)   │   │
  │  ├─────────────────────┼───────────────┼────────────────┤   │
  │  │ Cần phân giải?       │ CÓ ★         │ KHÔNG!         │   │
  │  │                      │ (tra hosts    │ (dùng trực tiếp)│  │
  │  │                      │  file!)       │                │   │
  │  ├─────────────────────┼───────────────┼────────────────┤   │
  │  │ Phân giải qua DNS?   │ KHÔNG!        │ N/A            │   │
  │  │                      │ (qua hosts    │                │   │
  │  │                      │  file!)       │                │   │
  │  ├─────────────────────┼───────────────┼────────────────┤   │
  │  │ Có thể thay đổi?    │ CÓ! ★        │ KHÔNG!         │   │
  │  │                      │ (sửa hosts   │ (cố định!)     │   │
  │  │                      │  file!)       │                │   │
  │  ├─────────────────────┼───────────────┼────────────────┤   │
  │  │ Phạm vi              │ Máy hiện tại │ Máy hiện tại   │   │
  │  ├─────────────────────┼───────────────┼────────────────┤   │
  │  │ IPv6 tương đương     │ localhost     │ ::1            │   │
  │  ├─────────────────────┼───────────────┼────────────────┤   │
  │  │ Có thể tùy chỉnh?  │ CÓ! ★        │ KHÔNG!         │   │
  │  │                      │ (đổi tên     │ (luôn là       │   │
  │  │                      │  miền khác!) │  127.0.0.1!)   │   │
  │  └─────────────────────┴───────────────┴────────────────┘   │
  │                                                              │
  │  SƠ ĐỒ PHÂN GIẢI:                                              │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │                                                      │    │
  │  │  baidu.com:                                            │    │
  │  │    │                                                  │    │
  │  │    ↓ Browser hỏi DNS Server (INTERNET!)               │    │
  │  │    ↓ DNS trả: 39.156.66.10                            │    │
  │  │    ↓ Gửi request đến 39.156.66.10 (RA NGOÀI!)       │    │
  │  │                                                      │    │
  │  │  localhost:                                             │    │
  │  │    │                                                  │    │
  │  │    ↓ OS tra file HOSTS (LOCAL! Không qua DNS!) ★      │    │
  │  │    ↓ hosts file: localhost → 127.0.0.1                │    │
  │  │    ↓ 127.0.0.1 = loopback → KHÔNG ra ngoài!         │    │
  │  │    ↓ Gửi NGAY cho chương trình trên máy!            │    │
  │  │                                                      │    │
  │  │  127.0.0.1:                                            │    │
  │  │    │                                                  │    │
  │  │    ↓ Đã là IP → KHÔNG cần phân giải! ★              │    │
  │  │    ↓ 127.x.x.x = loopback → KHÔNG ra ngoài!         │    │
  │  │    ↓ Gửi NGAY cho chương trình trên máy!            │    │
  │  │                                                      │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```

---

## §6. File Hosts — "DNS Cục Bộ"!

```
  FILE HOSTS:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  MỌI MÁY TÍNH ĐỀU CÓ FILE HOSTS!                              │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │                                                      │    │
  │  │ VỊ TRÍ:                                               │    │
  │  │ → Windows: C:\Windows\System32\drivers\etc\hosts      │    │
  │  │ → macOS:   /etc/hosts                                 │    │
  │  │ → Linux:   /etc/hosts                                 │    │
  │  │                                                      │    │
  │  │ NỘI DUNG MẶC ĐỊNH:                                    │    │
  │  │ ┌───────────────────────────────────────┐              │    │
  │  │ │ 127.0.0.1       localhost              │              │    │
  │  │ │ ::1             localhost              │              │    │
  │  │ │ 255.255.255.255  broadcasthost         │              │    │
  │  │ └───────────────────────────────────────┘              │    │
  │  │                                                      │    │
  │  │  ↑ Dòng đầu: localhost → 127.0.0.1 ★               │    │
  │  │  ↑ Dòng 2: localhost → ::1 (IPv6 loopback!) ★       │    │
  │  │                                                      │    │
  │  │ ĐÂY LÀ QUY ƯỚC! Mọi máy tính đều có sẵn!         │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  THỨ TỰ PHÂN GIẢI TÊN MIỀN:                                   │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │                                                      │    │
  │  │  Browser gõ: example.com                                │    │
  │  │    │                                                  │    │
  │  │    ↓ ① Tra BROWSER CACHE trước!                      │    │
  │  │    │    (đã phân giải gần đây?)                      │    │
  │  │    │                                                  │    │
  │  │    ↓ ② Tra OS CACHE!                                  │    │
  │  │    │    (DNS cache của hệ điều hành?)                │    │
  │  │    │                                                  │    │
  │  │    ↓ ③ Tra FILE HOSTS! ★                              │    │
  │  │    │    (có dòng "IP example.com" không?)             │    │
  │  │    │    → CÓ → dùng IP trong hosts! XONG!           │    │
  │  │    │    → KHÔNG → tiếp!                              │    │
  │  │    │                                                  │    │
  │  │    ↓ ④ Tra DNS SERVER!                                 │    │
  │  │    │    (hỏi DNS server bên ngoài!)                  │    │
  │  │    │    → ISP DNS / Google DNS (8.8.8.8) / ...!      │    │
  │  │    │                                                  │    │
  │  │    ↓ ⑤ KHÔNG tìm thấy → ERR_NAME_NOT_RESOLVED! ❌   │    │
  │  │                                                      │    │
  │  │  ★ hosts file được tra TRƯỚC DNS! ★                  │    │
  │  │  → localhost nằm trong hosts → KHÔNG hỏi DNS!       │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  TÙY CHỈNH HOSTS FILE:                                        │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ Bạn có thể TỰ THÊM dòng vào hosts file!             │    │
  │  │                                                      │    │
  │  │ VD thêm: 127.0.0.1  wodehost                         │    │
  │  │ → Giờ gõ http://wodehost:3000 = http://127.0.0.1:3000│   │
  │  │ → TỰ đặt tên miền cho máy mình! ★                  │    │
  │  │                                                      │    │
  │  │ VD thêm: 127.0.0.1  baidu.com                         │    │
  │  │ → Trên MÁY BẠN, baidu.com → 127.0.0.1!             │    │
  │  │ → Không mở được Baidu nữa! (vào máy bạn thay vì!) │    │
  │  │ → CHỈ ảnh hưởng MÁY BẠN! Người khác bình thường!  │    │
  │  │                                                      │    │
  │  │ ỨNG DỤNG THỰC TẾ:                                     │    │
  │  │ → Block website (chặn quảng cáo, trang độc hại!)   │    │
  │  │ → Dev test: trỏ domain API sang localhost!           │    │
  │  │ → VD: 127.0.0.1  api.myapp.com                       │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```

---

## §7. Phân Cấp Tên Miền!

```
  DOMAIN HIERARCHY — PHÂN CẤP:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  VÍ DỤ: developer.work.weixin.qq.com                          │
  │                                                              │
  │  ĐỌC TỪ PHẢI SANG TRÁI:                                      │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │                                                      │    │
  │  │  .com        ← TLD (Top-Level Domain!)              │    │
  │  │  .qq         ← SLD (Second-Level Domain!)           │    │
  │  │  .weixin     ← 3LD (Third-Level Domain!)            │    │
  │  │  .work       ← Fourth-Level Domain!                 │    │
  │  │  .developer  ← Fifth-Level Domain!                  │    │
  │  │                                                      │    │
  │  │  SƠ ĐỒ CÂY:                                          │    │
  │  │        . (root)                                       │    │
  │  │        │                                              │    │
  │  │   ┌────┼──────┬────────┐                              │    │
  │  │  .com  .net  .org    .cn    ← TLD!                   │    │
  │  │   │                   │                               │    │
  │  │  .qq               .juejin  ← SLD!                   │    │
  │  │   │                   │                               │    │
  │  │  .weixin            .www     ← 3LD!                  │    │
  │  │   │                                                   │    │
  │  │  .work                                                │    │
  │  │   │                                                   │    │
  │  │  .developer                                           │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  CÁC LOẠI TLD:                                                 │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ GENERIC TLD (gTLD):                                   │    │
  │  │ → .com  = thương mại (commercial!)                    │    │
  │  │ → .net  = mạng (network!)                             │    │
  │  │ → .org  = tổ chức phi lợi nhuận!                    │    │
  │  │ → .edu  = giáo dục!                                   │    │
  │  │ → .gov  = chính phủ!                                  │    │
  │  │                                                      │    │
  │  │ COUNTRY CODE TLD (ccTLD):                             │    │
  │  │ → .cn  = Trung Quốc!                                 │    │
  │  │ → .vn  = Việt Nam!                                    │    │
  │  │ → .uk  = Vương quốc Anh!                            │    │
  │  │ → .jp  = Nhật Bản!                                   │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  VẬY localhost LÀ GÌ TRONG HỆ PHÂN CẤP?                       │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ → localhost là TLD ĐẶC BIỆT (reserved TLD)! ★      │    │
  │  │ → Được IANA đặt riêng!                              │    │
  │  │ → Mục đích DUY NHẤT: trỏ đến máy hiện tại!        │    │
  │  │ → KHÔNG đăng ký được localhost.com hoặc x.localhost!│    │
  │  │ → Giống .test, .example, .invalid — reserved!        │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  "www" LÀ GÌ?                                                  │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ → www = third-level domain!                           │    │
  │  │ → www.baidu.com = "www" là subdomain của baidu.com!   │    │
  │  │ → "www" = World Wide Web — quy ước phổ biến!        │    │
  │  │ → Nhiều trang bỏ www: chỉ dùng baidu.com!          │    │
  │  │ → www KHÔNG bắt buộc! Chỉ là convention! ★         │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```

---

## §8. Virtual Host — Nhiều Website Chung 1 IP!

```
  VIRTUAL HOSTING:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  VẤN ĐỀ:                                                       │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ 1 server, 1 IP, port 80!                              │    │
  │  │ Muốn chạy NHIỀU website trên CÙNG server!            │    │
  │  │ → blog.abc.com, shop.abc.com, api.abc.com!            │    │
  │  │ → TẤT CẢ dùng port 80! Làm sao phân biệt?        │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  GIẢI PHÁP: HOST HEADER!                                       │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │                                                      │    │
  │  │ HTTP request có header "Host":                         │    │
  │  │ ┌─────────────────────────────────────┐               │    │
  │  │ │ GET /index.html HTTP/1.1            │               │    │
  │  │ │ Host: blog.abc.com  ← TÊN MIỀN! ★ │               │    │
  │  │ └─────────────────────────────────────┘               │    │
  │  │                                                      │    │
  │  │ Nginx đọc Host header → tìm đúng website!           │    │
  │  │                                                      │    │
  │  │ SƠ ĐỒ:                                                │    │
  │  │ Request 1: Host=blog.abc.com                           │    │
  │  │   ↓                                                    │    │
  │  │ ┌───────── Nginx (port 80) ─────────┐                 │    │
  │  │ │                                     │                 │    │
  │  │ │  Host = blog.abc.com → Blog App!   │                 │    │
  │  │ │  Host = shop.abc.com → Shop App!   │                 │    │
  │  │ │  Host = api.abc.com  → API Server! │                 │    │
  │  │ │                                     │                 │    │
  │  │ └─────────────────────────────────────┘                 │    │
  │  │                                                      │    │
  │  │ → 1 IP, 1 port, NHIỀU websites! ★                    │    │
  │  │ → Đây là cách web hosting hoạt động!                 │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  NGINX CONFIG VÍ DỤ:                                            │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ server {                                              │    │
  │  │   listen 80;                                          │    │
  │  │   server_name blog.abc.com;  ← Host header!         │    │
  │  │   root /var/www/blog;                                 │    │
  │  │ }                                                     │    │
  │  │ server {                                              │    │
  │  │   listen 80;                                          │    │
  │  │   server_name shop.abc.com;  ← Host header khác!    │    │
  │  │   root /var/www/shop;                                 │    │
  │  │ }                                                     │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```

---

## §9. Private IP vs Public IP!

```
  PRIVATE IP vs PUBLIC IP:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  PUBLIC IP (IP Công cộng):                                     │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ → Duy nhất trên TOÀN THẾ GIỚI!                      │    │
  │  │ → Ai cũng có thể truy cập!                         │    │
  │  │ → ISP (Viettel, VNPT, FPT) cấp!                     │    │
  │  │ → Baidu, Google, Facebook dùng public IP!             │    │
  │  │ → VD: 39.156.66.10 (Baidu!)                          │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  PRIVATE IP (IP Riêng tư):                                     │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ → Dùng trong MẠNG NỘI BỘ (LAN!) ★                  │    │
  │  │ → KHÔNG truy cập được từ internet!                  │    │
  │  │ → Công ty A dùng 192.168.1.1 — OK!                  │    │
  │  │ → Công ty B cũng dùng 192.168.1.1 — OK! Không xung đột│ │
  │  │ → Muốn ra internet → qua NAT (gateway!) ★          │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  3 DẢI PRIVATE IPv4 (RFC 1918):                                │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │                                                      │    │
  │  │ CLASS A: 10.0.0.0 → 10.255.255.255                  │    │
  │  │          (16,777,216 địa chỉ!)                       │    │
  │  │          → Cho mạng LỚN (doanh nghiệp!)            │    │
  │  │                                                      │    │
  │  │ CLASS B: 172.16.0.0 → 172.31.255.255                │    │
  │  │          (1,048,576 địa chỉ!)                        │    │
  │  │          → Cho mạng VỪA!                             │    │
  │  │                                                      │    │
  │  │ CLASS C: 192.168.0.0 → 192.168.255.255              │    │
  │  │          (65,536 địa chỉ!)                           │    │
  │  │          → Cho mạng NHỎ (nhà, văn phòng!) ★        │    │
  │  │          → Đây là dải bạn thường gặp nhất!         │    │
  │  │          → Wifi nhà: 192.168.1.x!                     │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  CÁC DẢI IP ĐẶC BIỆT KHÁC:                                    │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │                                                      │    │
  │  │ LOOPBACK: 127.0.0.0 → 127.255.255.255               │    │
  │  │   → Truy cập CHÍNH MÁY HIỆN TẠI! ★                │    │
  │  │   → 127.0.0.1 phổ biến nhất!                        │    │
  │  │   → 127.0.0.2 cũng được! (cùng hiệu quả!)         │    │
  │  │                                                      │    │
  │  │ LINK-LOCAL: 169.254.0.0 → 169.254.255.255            │    │
  │  │   → LAN tạm thời!                                   │    │
  │  │   → Khi máy KHÔNG lấy được IP từ DHCP!             │    │
  │  │   → Tự cấp IP tạm: 169.254.x.x!                    │    │
  │  │   → Thấy IP này → mạng có vấn đề! ❌              │    │
  │  │                                                      │    │
  │  │ CGNAT: 100.64.0.0 → 100.127.255.255                 │    │
  │  │   → Dải mới! ISP dùng khi HẾT public IP!           │    │
  │  │   → Carrier-Grade NAT!                                │    │
  │  │   → Bạn KHÔNG có public IP thật! ★                   │    │
  │  │   → ISP đặt 1 LỚP NAT nữa giữa bạn và internet!  │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  SƠ ĐỒ MẠNG:                                                   │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │                                                      │    │
  │  │  ┌───────────── INTERNET ────────────────┐           │    │
  │  │  │  Public IPs: 39.156.66.10, 8.8.8.8   │           │    │
  │  │  └───────────────────────────────────────┘           │    │
  │  │           │                                            │    │
  │  │           ↓ NAT (Network Address Translation!)        │    │
  │  │  ┌───────────── GATEWAY ─────────────────┐           │    │
  │  │  │  Public: 203.0.113.1                   │           │    │
  │  │  │  Private: 192.168.1.1 (router!)        │           │    │
  │  │  └────────────────────────────────────────┘           │    │
  │  │           │                                            │    │
  │  │  ┌────────┼──────────────────────────────┐           │    │
  │  │  │  LAN (Mạng nội bộ!)                   │           │    │
  │  │  │                                        │           │    │
  │  │  │  PC1: 192.168.1.100                    │           │    │
  │  │  │  PC2: 192.168.1.101                    │           │    │
  │  │  │  PC3: 192.168.1.102                    │           │    │
  │  │  │                                        │           │    │
  │  │  │  Trên mỗi PC:                         │           │    │
  │  │  │  127.0.0.1 = CHÍNH MÁY ĐÓ!           │           │    │
  │  │  │  localhost = CHÍNH MÁY ĐÓ!            │           │    │
  │  │  └────────────────────────────────────────┘           │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```

---

## §10. IPv4 vs IPv6!

```
  IPv4 vs IPv6:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  IPv4:                                                          │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ → 32-bit! 4 đoạn thập phân!                        │    │
  │  │ → VD: 192.168.1.100                                  │    │
  │  │ → Tổng: 2^32 = ~4.3 TỶ địa chỉ!                   │    │
  │  │ → Vấn đề: SẮP HẾT! (đã hết ở nhiều nơi!) ★      │    │
  │  │ → Giải pháp tạm: NAT, CGNAT!                        │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  IPv6:                                                          │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ → 128-bit! 8 đoạn hex!                              │    │
  │  │ → VD: 2001:0db8:3c4d:0015:0000:0000:1a2f:1a2b       │    │
  │  │ → Tổng: 2^128 = 3.4 × 10^38 địa chỉ!               │    │
  │  │ → Đủ cấp IP cho MỌI HẠT CÁT trên Trái Đất! ★    │    │
  │  │                                                      │    │
  │  │ IPv6 Loopback:                                         │    │
  │  │ → ::1 (tương đương 127.0.0.1!) ★                    │    │
  │  │ → localhost → ::1 (trong hosts file!)                │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  SO SÁNH:                                                       │
  │  ┌─────────────────┬─────────────┬───────────────┐          │
  │  │ TIÊU CHÍ         │ IPv4        │ IPv6          │          │
  │  ├─────────────────┼─────────────┼───────────────┤          │
  │  │ Độ dài          │ 32-bit      │ 128-bit       │          │
  │  │ Format          │ Thập phân   │ Hex (16)      │          │
  │  │ VD              │ 127.0.0.1   │ ::1           │          │
  │  │ Tổng địa chỉ  │ ~4.3 tỷ    │ 3.4 × 10^38  │          │
  │  │ Loopback        │ 127.0.0.1   │ ::1           │          │
  │  │ Trạng thái     │ Sắp hết!   │ Vô hạn!      │          │
  │  └─────────────────┴─────────────┴───────────────┘          │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```

---

## §11. Câu Hỏi Luyện Tập!

```
  CÂU HỎI PHỎNG VẤN — NETWORKING CƠ BẢN:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  ❓ CÂU 1: localhost và 127.0.0.1 khác nhau thế nào?            │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ TRẢ LỜI:                                             │    │
  │  │ → localhost = TÊN MIỀN (domain name!)                │    │
  │  │ → 127.0.0.1 = ĐỊA CHỈ IP (loopback IP!)            │    │
  │  │ → localhost phải PHÂN GIẢI thành IP (qua hosts file!)│   │
  │  │ → 127.0.0.1 dùng TRỰC TIẾP, không cần phân giải!  │    │
  │  │ → Cả hai đều trỏ đến MÁY HIỆN TẠI! ★             │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  ❓ CÂU 2: localhost có phân giải qua DNS không?                │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ TRẢ LỜI:                                             │    │
  │  │ → KHÔNG! ★ Không qua DNS server bên ngoài!          │    │
  │  │ → Phân giải qua FILE HOSTS cục bộ!                  │    │
  │  │ → /etc/hosts (Mac/Linux) có dòng:                    │    │
  │  │   "127.0.0.1 localhost"!                              │    │
  │  │ → Hosts file được tra TRƯỚC DNS! ★                  │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  ❓ CÂU 3: Loopback address là gì?                               │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ TRẢ LỜI:                                             │    │
  │  │ → Dải IP 127.0.0.0 → 127.255.255.255!              │    │
  │  │ → Data gửi đến dải này KHÔNG ra ngoài mạng!        │    │
  │  │ → OS chuyển NGAY lại cho máy hiện tại! (vòng lặp!) │    │
  │  │ → 127.0.0.1 là phổ biến nhất!                       │    │
  │  │ → 127.0.0.2 cũng hoạt động tương tự! ★             │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  ❓ CÂU 4: Tại sao HTTP mặc định port 80?                       │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ TRẢ LỜI:                                             │    │
  │  │ → QUY ƯỚC! (convention!)                             │    │
  │  │ → HTTP = port 80, HTTPS = port 443!                   │    │
  │  │ → Khi gõ baidu.com → thực ra là baidu.com:80!       │    │
  │  │ → Browser TỰ THÊM port mặc định!                    │    │
  │  │ → Dev server dùng 3000, 8080 → phải gõ tay! ★      │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  ❓ CÂU 5: File hosts nằm ở đâu? Dùng để làm gì?              │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ TRẢ LỜI:                                             │    │
  │  │ → Windows: C:\Windows\System32\drivers\etc\hosts!     │    │
  │  │ → Mac/Linux: /etc/hosts!                              │    │
  │  │ → Chứa ánh xạ domain → IP!                          │    │
  │  │ → Được tra CỦA DNS! (ưu tiên cao hơn!)             │    │
  │  │ → Ứng dụng: block web, dev test, custom domain! ★   │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  ❓ CÂU 6: Private IP khác Public IP thế nào?                   │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ TRẢ LỜI:                                             │    │
  │  │ → Public: duy nhất toàn cầu, ai cũng truy cập!    │    │
  │  │ → Private: dùng trong LAN, không ra internet!        │    │
  │  │ → 3 dải Private: 10.x, 172.16-31.x, 192.168.x! ★   │    │
  │  │ → Nhiều LAN dùng CÙNG private IP → không xung đột!│    │
  │  │ → Ra internet qua NAT (gateway chuyển đổi!)        │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  ❓ CÂU 7: Virtual Host hoạt động thế nào?                      │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ TRẢ LỜI:                                             │    │
  │  │ → Nhiều website dùng CÙNG IP + port!                │    │
  │  │ → Phân biệt bằng HOST HEADER trong HTTP request!    │    │
  │  │ → Nginx/Apache đọc Host → tìm đúng website!       │    │
  │  │ → Config: server_name blog.abc.com; ★                │    │
  │  │ → Đây là cách web hosting hoạt động!                │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  ❓ CÂU 8: 169.254.x.x là IP gì?                                │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ TRẢ LỜI:                                             │    │
  │  │ → Link-Local address!                                 │    │
  │  │ → Khi máy KHÔNG lấy được IP từ DHCP!               │    │
  │  │ → Tự cấp IP tạm: 169.254.x.x!                      │    │
  │  │ → Thấy IP này → mạng có VẤN ĐỀ! ❌                │    │
  │  │ → Kiểm tra kết nối LAN! ★                          │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  ❓ CÂU 9: ::1 trong IPv6 là gì?                                │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ TRẢ LỜI:                                             │    │
  │  │ → IPv6 loopback address! ★                            │    │
  │  │ → Tương đương 127.0.0.1 trong IPv4!                  │    │
  │  │ → localhost → 127.0.0.1 (IPv4) hoặc ::1 (IPv6)!     │    │
  │  │ → Trong hosts file: "::1 localhost"!                  │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  ❓ CÂU 10: 100.64.x.x là IP gì? Khi nào gặp?                  │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ TRẢ LỜI:                                             │    │
  │  │ → CGNAT (Carrier-Grade NAT!) address!                 │    │
  │  │ → ISP dùng khi HẾT public IPv4! ★                    │    │
  │  │ → ISP thêm 1 LỚP NAT giữa bạn và internet!        │    │
  │  │ → Bạn KHÔNG có public IP thật!                       │    │
  │  │ → Cloud (Alibaba, AWS) cũng dùng dải này!           │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```
