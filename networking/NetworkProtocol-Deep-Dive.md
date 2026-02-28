# Network Protocol — Deep Dive

> 📅 2026-02-13 · ⏱ 30 phút đọc
>
> TCP/IP Model, 3-Way/4-Way Handshake, TCP Reliable Delivery,
> DNS, CDN, HTTP Headers/Methods/Status Codes, HTTP/2,
> HTTPS Encryption, WebSocket
> Độ khó: ⭐️⭐️⭐️⭐️⭐️ | Must-know Network Interview

---

## Mục Lục

| #   | Phần                                      |
| --- | ----------------------------------------- |
| 1   | TCP/IP — Mô hình giao thức mạng           |
| 2   | TCP 3-Way Handshake & 4-Way Handshake     |
| 3   | TCP Reliable Delivery — Cơ chế đảm bảo    |
| 4   | DNS — Vai trò & Phân giải chi tiết        |
| 5   | CDN — Chức năng & Nguyên lý               |
| 6   | HTTP — Request/Response, Methods, Headers |
| 7   | HTTP Status Codes — Toàn bộ ý nghĩa       |
| 8   | HTTP/1.1 → HTTP/2 — Những cải tiến        |
| 9   | HTTPS — Nguyên lý mã hóa & Hijack         |
| 10  | WebSocket — So sánh với HTTP              |
| 11  | Tổng kết & Checklist phỏng vấn            |

---

## §1. TCP/IP — Mô hình giao thức mạng

```
GIAO THỨC (Protocol) LÀ GÌ:
═══════════════════════════════════════════════════════════════

  → Tập hợp QUY TẮC quy định cách truyền dữ liệu giữa 2 bên
  → Như "ngôn ngữ chung" để máy tính giao tiếp
  → Định nghĩa: format dữ liệu, thứ tự gửi, xử lý lỗi...

  OSI 7 LAYERS vs TCP/IP 4 LAYERS:
  ┌──────────────────────┬──────────────────────┐
  │    OSI (7 layers)    │  TCP/IP (4 layers)   │
  ├──────────────────────┼──────────────────────┤
  │ 7. Application       │                      │
  │ 6. Presentation      │ 4. Application       │
  │ 5. Session           │    (HTTP, DNS, FTP)  │
  ├──────────────────────┼──────────────────────┤
  │ 4. Transport         │ 3. Transport         │
  │                      │    (TCP, UDP)        │
  ├──────────────────────┼──────────────────────┤
  │ 3. Network           │ 2. Internet          │
  │                      │    (IP, ICMP, ARP)   │
  ├──────────────────────┼──────────────────────┤
  │ 2. Data Link         │ 1. Network Access    │
  │ 1. Physical          │    (Ethernet, WiFi)  │
  └──────────────────────┴──────────────────────┘

  Thực tế dùng TCP/IP 4 layers! OSI chỉ là lý thuyết!
```

```
MỖI LAYER LÀM GÌ — VÍ DỤ: Gửi HTTP Request:
═══════════════════════════════════════════════════════════════

  ① Application Layer (HTTP):
     → Tạo HTTP message: "GET /index.html HTTP/1.1\r\nHost: ..."
     → Đóng gói data + headers

  ② Transport Layer (TCP):
     → Chia data thành segments
     → Thêm: Source Port, Dest Port, Sequence Number, Checksum
     → Đảm bảo: order, reliability, flow control

  ③ Internet Layer (IP):
     → Thêm: Source IP, Dest IP, TTL
     → Routing: chọn đường đi giữa các networks

  ④ Network Access Layer (Ethernet):
     → Thêm: Source MAC, Dest MAC, Frame Check
     → Truyền qua physical medium (cable, WiFi)

  ENCAPSULATION (đóng gói):
  ┌─── HTTP Data ──────────────────────────────┐
  ├─── TCP Header ──┬── HTTP Data ─────────────┤
  ├── IP Header ─┬── TCP Header ──┬── Data ────┤
  ├ Frame Header ┬ IP ┬ TCP ┬ Data ┬ Frame Tail┤
  └──────────────┴────┴─────┴──────┴───────────┘
  → Mỗi layer BỌC THÊM header → nhận bên kia BÓC ra!
```

```
TCP vs UDP:
═══════════════════════════════════════════════════════════════

  ┌───────────────────┬──────────────┬──────────────┐
  │ Feature           │ TCP          │ UDP          │
  ├───────────────────┼──────────────┼──────────────┤
  │ Connection        │ Connection-  │ Connectionless│
  │                   │ oriented     │              │
  │ Reliability       │ ✅ Reliable  │ ❌ Unreliable│
  │ Ordering          │ ✅ In-order  │ ❌ No order  │
  │ Speed             │ Chậm hơn     │ Nhanh hơn    │
  │ Overhead          │ 20 bytes     │ 8 bytes      │
  │ Flow Control      │ ✅ Có       │ ❌ Không     │
  │ Congestion Control│ ✅ Có       │ ❌ Không     │
  │ Use cases         │ HTTP, Email, │ DNS, Video,  │
  │                   │ File transfer│ Games, VoIP  │
  └───────────────────┴──────────────┴──────────────┘
```

---

## §2. TCP 3-Way Handshake & 4-Way Handshake

```
3-WAY HANDSHAKE — THIẾT LẬP KẾT NỐI:
═══════════════════════════════════════════════════════════════

  TẠI SAO CẦN 3 BƯỚC (không phải 2 hay 4)?
  → 2 bước: server không biết client NHẬN ĐƯỢC reply chưa!
  → 4 bước: thừa! 3 bước đã đủ xác nhận CẢ HAI CHIỀU!
  → 3 bước = TỐI THIỂU để xác nhận 2 bên ĐỀU gửi + nhận OK!

  Client                                  Server
  (CLOSED)                                (LISTEN)
     │                                       │
     │ ① SYN (seq=x)                        │
     │──────────────────────────────────────→│
     │ "Tôi muốn kết nối! Số bắt đầu: x"   │
     │                                       │ (SYN-RECEIVED)
     │                                       │
     │ ② SYN+ACK (seq=y, ack=x+1)          │
     │←──────────────────────────────────────│
     │ "OK! Tôi cũng muốn! Số tôi: y"      │
     │ "Tôi nhận được x, mong nhận x+1"     │
     │                                       │
     │ ③ ACK (ack=y+1)                      │
     │──────────────────────────────────────→│
     │ "Nhận được y rồi! Mong nhận y+1"     │
     │                                       │
  (ESTABLISHED)                           (ESTABLISHED)
     │←────── Kết nối 2 chiều! ──────────→│

  SAU 3 BƯỚC:
  → Client biết: tôi gửi OK ✅, tôi nhận OK ✅
  → Server biết: tôi gửi OK ✅, tôi nhận OK ✅
  → CẢ HAI đều xác nhận → ESTABLISHED!

  ⚠️ TẠI SAO KHÔNG 2 BƯỚC:
  → Nếu SYN cũ (đã timeout) đến trễ → Server nghĩ có kết nối mới!
  → Server ESTABLISHED nhưng Client KHÔNG biết → lãng phí tài nguyên!
  → Bước 3 (ACK) = Client xác nhận: "Đúng, TÔI muốn kết nối thật!"
```

```
4-WAY HANDSHAKE — ĐÓNG KẾT NỐI:
═══════════════════════════════════════════════════════════════

  TẠI SAO CẦN 4 BƯỚC (không phải 3)?
  → TCP là full-duplex (2 chiều ĐỘC LẬP!)
  → Mỗi chiều đóng RIÊNG → 2 × 2 = 4 bước!
  → Server nhận FIN nhưng CÓ THỂ vẫn còn data cần gửi!

  Client                                  Server
  (ESTABLISHED)                           (ESTABLISHED)
     │                                       │
     │ ① FIN (seq=u)                        │
     │──────────────────────────────────────→│
     │ "Tôi gửi XONG rồi! Đóng chiều tôi"  │
     │                                       │
  (FIN-WAIT-1)                               │
     │                                       │
     │ ② ACK (ack=u+1)                      │
     │←──────────────────────────────────────│
     │ "OK! Nhận được. Nhưng tôi chưa xong!"│
     │                                       │
  (FIN-WAIT-2)                           (CLOSE-WAIT)
     │                                       │
     │    Server tiếp tục gửi data còn lại...│
     │←──────── remaining data ──────────────│
     │                                       │
     │ ③ FIN (seq=w)                        │
     │←──────────────────────────────────────│
     │ "Tôi cũng XONG rồi! Đóng chiều tôi" │
     │                                       │
     │                                   (LAST-ACK)
     │ ④ ACK (ack=w+1)                      │
     │──────────────────────────────────────→│
     │ "OK! Bye!"                            │
     │                                       │
  (TIME-WAIT)                             (CLOSED)
     │  ← Chờ 2MSL (2 × Max Segment Lifetime)│
     │  ← ~60 giây → đảm bảo ACK cuối đến! │
  (CLOSED)

  ⚠️ TẠI SAO TIME-WAIT = 2MSL:
  → Nếu ACK cuối ④ bị mất → Server gửi lại FIN ③
  → Client cần còn sống để gửi lại ACK!
  → 2MSL = đủ thời gian cho 1 round-trip cuối cùng!
```

---

## §3. TCP Reliable Delivery — Cơ chế đảm bảo

```
TCP ĐẢM BẢO DELIVERY QUA 6 CƠ CHẾ:
═══════════════════════════════════════════════════════════════

  ① SEQUENCE NUMBERS (Số thứ tự):
     → Mỗi byte data có 1 sequence number
     → Receiver sắp xếp lại ĐÚNG THỨ TỰ dù đến lộn xộn!
     → Phát hiện: duplicate, thiếu, lộn xộn

  ② ACKNOWLEDGMENT (Xác nhận):
     → Receiver gửi ACK cho sender: "Tôi nhận đến byte X"
     → ACK = cumulative: ACK 1000 = "tôi nhận tất cả ĐẾN byte 999"
     → Sender biết data ĐÃ ĐẾN an toàn!

  ③ RETRANSMISSION (Truyền lại):
     → Timeout Retransmission: sender đợi ACK quá lâu → gửi lại!
     → Fast Retransmit: nhận 3 duplicate ACKs → gửi lại NGAY!
        (không cần chờ timeout → nhanh hơn!)

  ④ FLOW CONTROL (Kiểm soát luồng):
     → Receiver có BUFFER CÓ HẠN!
     → Sliding Window: receiver báo "Window Size = N bytes"
     → Sender chỉ gửi TỐI ĐA N bytes chưa ACK
     → Window = 0 → DỪNG gửi! (receiver đầy buffer!)

  ⑤ CONGESTION CONTROL (Kiểm soát tắc nghẽn):
     → Mạng bị nghẽn → giảm tốc độ gửi!
     → 4 thuật toán: Slow Start, Congestion Avoidance,
       Fast Retransmit, Fast Recovery
     → Slow Start: cwnd = 1 → 2 → 4 → 8... (tăng gấp đôi!)
     → Đến threshold → Congestion Avoidance (tăng tuyến tính)
     → Detect loss → giảm cwnd drastically!

  ⑥ CHECKSUM (Kiểm tra lỗi):
     → Mỗi segment có checksum
     → Receiver tính lại → khác → BỎ segment!
```

```
SLIDING WINDOW — TRỰC QUAN:
═══════════════════════════════════════════════════════════════

  Sender Buffer:
  ┌──┬──┬──┬──┬──┬──┬──┬──┬──┬──┐
  │✅│✅│✅│📤│📤│📤│📦│📦│🔒│🔒│
  │1 │2 │3 │4 │5 │6 │7 │8 │9 │10│
  └──┴──┴──┴──┴──┴──┴──┴──┴──┴──┘
        ↑           ↑         ↑
     ACK'd      Window=6    Locked
  (đã nhận ACK) (đã gửi/    (chưa được
               chờ gửi)    gửi)

  ✅ = ACK'd (xác nhận nhận được)
  📤 = Sent, chờ ACK
  📦 = Chưa gửi, TRONG window (được phép gửi)
  🔒 = Chưa gửi, NGOÀI window (chờ window slide!)

  Khi nhận ACK 4:
  ┌──┬──┬──┬──┬──┬──┬──┬──┬──┬──┐
  │✅│✅│✅│✅│📤│📤│📦│📦│📦│🔒│
  │1 │2 │3 │4 │5 │6 │7 │8 │9 │10│
  └──┴──┴──┴──┴──┴──┴──┴──┴──┴──┘
              ↑              ↑
           Window TRƯỢT SANG PHẢI! → 9 vào window!
```

---

## §4. DNS — Vai trò & Phân giải chi tiết

```
DNS (Domain Name System):
═══════════════════════════════════════════════════════════════

  VAI TRÒ: Chuyển đổi DOMAIN NAME → IP ADDRESS
  → "google.com" → "142.250.68.14"
  → Con người nhớ tên, máy tính dùng số!
  → Port: 53, Protocol: UDP (nhanh!) hoặc TCP (zone transfer)

  CẤU TRÚC TÊN MIỀN (phân cấp):
  www.example.com.
  │    │       │  └── Root domain (.)
  │    │       └──── TLD (Top-Level Domain): .com
  │    └──────────── SLD (Second-Level Domain): example
  └───────────────── Subdomain: www

  Root Servers: 13 clusters (a.root-servers.net → m.root-servers.net)
  → Biết TẤT CẢ TLD nameservers!
```

```
QUY TRÌNH PHÂN GIẢI DNS CHI TIẾT:
═══════════════════════════════════════════════════════════════

  User gõ: www.example.com

  ① Browser DNS Cache:
     → Đã truy cập trước đó? → Dùng cache! DONE! ⚡
     → Chrome: chrome://net-internals/#dns

  ② OS DNS Cache:
     → Kiểm tra /etc/hosts file trước!
     → Sau đó kiểm tra OS DNS cache
     → macOS: dscacheutil -flushcache

  ③ Router DNS Cache:
     → Router WiFi/modem thường cache DNS

  ④ ISP DNS Resolver (Recursive Resolver):
     → DNS server của nhà mạng (Viettel, VNPT...)
     → Hoặc public: Google (8.8.8.8), Cloudflare (1.1.1.1)
     → Có cache? → Trả về! DONE!
     → Không? → RECURSIVE QUERY:

  ⑤ Root Name Server:
     → Resolver hỏi: "www.example.com ở đâu?"
     → Root: "Tôi biết .com → hỏi TLD server: x.gtld-servers.net"

  ⑥ TLD Name Server (.com):
     → Resolver hỏi TLD server
     → TLD: ".com → hỏi Authoritative NS: ns1.example.com"

  ⑦ Authoritative Name Server:
     → Resolver hỏi ns1.example.com
     → Auth NS: "www.example.com → IP: 93.184.216.34" ✅
     → Resolver cache kết quả (TTL)!

  ⑧ Trả về cho client:
     → Resolver → OS → Browser → Kết nối TCP đến IP!

  ┌────────┐    ┌────────┐    ┌────────┐    ┌──────────┐
  │Browser │───→│  ISP   │───→│  Root  │    │  TLD     │
  │        │    │Resolver│←───│  NS    │    │  NS      │
  │        │    │        │───→│        │    │(.com)    │
  │        │    │        │←───│ "ask   │    │          │
  │        │    │        │    │  TLD"  │    │          │
  │        │    │        │───────────────→ │          │
  │        │    │        │←──────────────── │ "ask     │
  │        │    │        │                  │  Auth NS"│
  │        │    │        │───→ Auth NS      └──────────┘
  │        │    │        │←── IP: 93.184... │
  │        │←───│ Cache! │                  │
  └────────┘    └────────┘                  │
```

```
DNS OPTIMIZATION:
═══════════════════════════════════════════════════════════════

  ① DNS Prefetch (trình duyệt):
     <link rel="dns-prefetch" href="//cdn.example.com">
     → Browser phân giải DNS TRƯỚC khi user click!
     → Giảm latency ~20-120ms!

  ② Giảm số domain khác nhau:
     → Mỗi domain mới = 1 DNS lookup mới!
     → Gộp static files vào ít domain!

  ③ TTL (Time-to-Live):
     → DNS record cache trong TTL giây
     → TTL cao → ít query → nhanh nhưng chậm cập nhật!
     → TTL thấp → nhiều query → cập nhật nhanh!

  ④ Dùng CDN DNS (CNAME):
     → example.com CNAME → cdn.cloudflare.com
     → CDN có DNS server TỐI ƯU, gần user nhất!
```

---

## §5. CDN — Chức năng & Nguyên lý

```
CDN (Content Delivery Network):
═══════════════════════════════════════════════════════════════

  → Mạng lưới servers PHÂN TÁN khắp thế giới
  → Cache nội dung TĨNH (JS, CSS, images, videos...)
  → Phục vụ từ server GẦN NHẤT user → NHANH hơn!

  ┌──── User (HCM) ────┐
  │                     │
  │  Không CDN:         │   Có CDN:
  │  HCM → US (300ms)  │   HCM → SG Edge (10ms) ⚡
  └─────────────────────┘

  CÁC CDN PHỔ BIẾN:
  → Cloudflare, AWS CloudFront, Akamai, Fastly,
  → Google Cloud CDN, Azure CDN, BunnyCDN

  NGUYÊN LÝ HOẠT ĐỘNG:
  ┌──────────────────────────────────────────────────┐
  │                                                  │
  │  User request: cdn.example.com/style.css         │
  │       │                                          │
  │       ▼                                          │
  │  ┌─────────────┐                                 │
  │  │ DNS Resolve  │ → CNAME → CDN DNS              │
  │  │              │ → Trả về IP edge gần nhất!     │
  │  └──────┬──────┘                                 │
  │         ▼                                        │
  │  ┌─────────────┐                                 │
  │  │  CDN Edge   │ (Server gần user nhất)          │
  │  │  (SG/HK)    │                                 │
  │  └──────┬──────┘                                 │
  │         │                                        │
  │    Cache HIT? ──YES── → Trả file ĐÃ CACHE! ⚡    │
  │         │                                        │
  │        NO                                        │
  │         │                                        │
  │         ▼                                        │
  │  ┌─────────────┐                                 │
  │  │ Origin      │ (Server gốc — US)               │
  │  │ Server      │ → Fetch file → Cache tại Edge   │
  │  └─────────────┘ → Trả cho user                  │
  │                                                  │
  └──────────────────────────────────────────────────┘

  CACHE STRATEGIES:
  → Cache-Control: public, max-age=31536000 (1 năm!)
  → Versioning: style.v2.css hoặc style.css?v=abc123
  → Cache Invalidation: purge cache khi deploy mới!
```

---

## §6. HTTP — Request/Response, Methods, Headers

```
HTTP REQUEST MESSAGE:
═══════════════════════════════════════════════════════════════

  ┌────────────────────────────────────────────────┐
  │ REQUEST LINE:                                   │
  │ GET /api/users?page=1 HTTP/1.1                  │
  │ ↑    ↑                  ↑                       │
  │ Method  URI             Version                 │
  ├────────────────────────────────────────────────┤
  │ HEADERS:                                        │
  │ Host: api.example.com                           │
  │ Accept: application/json                        │
  │ Content-Type: application/json                  │
  │ Authorization: Bearer eyJhbGciOi...             │
  │ Cache-Control: no-cache                         │
  │ Cookie: sessionId=abc123                        │
  │ User-Agent: Mozilla/5.0...                      │
  │ Accept-Encoding: gzip, deflate, br              │
  │ Connection: keep-alive                          │
  ├────────────────────────────────────────────────┤
  │ (Blank line)                                    │
  ├────────────────────────────────────────────────┤
  │ BODY (optional):                                │
  │ {"name": "Alice", "email": "alice@mail.com"}    │
  └────────────────────────────────────────────────┘

  HTTP RESPONSE MESSAGE:
  ┌────────────────────────────────────────────────┐
  │ STATUS LINE:                                    │
  │ HTTP/1.1 200 OK                                 │
  │           ↑   ↑                                 │
  │        Status  Reason Phrase                    │
  ├────────────────────────────────────────────────┤
  │ HEADERS:                                        │
  │ Content-Type: application/json; charset=utf-8   │
  │ Content-Length: 256                              │
  │ Set-Cookie: sessionId=xyz; HttpOnly; Secure     │
  │ Cache-Control: max-age=3600                     │
  │ Access-Control-Allow-Origin: *                  │
  │ ETag: "abc123"                                  │
  ├────────────────────────────────────────────────┤
  │ BODY:                                           │
  │ [{"id":1,"name":"Alice"},{"id":2,"name":"Bob"}] │
  └────────────────────────────────────────────────┘
```

```
HTTP METHODS:
═══════════════════════════════════════════════════════════════

  ┌─────────┬────────────┬────────┬─────────┬────────────────┐
  │ Method  │ Mục đích   │ Body?  │ Idempot.│ Safe?          │
  ├─────────┼────────────┼────────┼─────────┼────────────────┤
  │ GET     │ Lấy data   │ ❌     │ ✅     │ ✅ (read-only) │
  │ POST    │ Tạo mới    │ ✅     │ ❌     │ ❌             │
  │ PUT     │ Thay thế   │ ✅     │ ✅     │ ❌             │
  │ PATCH   │ Sửa 1 phần │ ✅     │ ❌     │ ❌             │
  │ DELETE  │ Xóa        │ ❌/✅  │ ✅     │ ❌             │
  │ HEAD    │ Như GET     │ ❌     │ ✅     │ ✅ (no body!)  │
  │         │ nhưng no   │        │         │                │
  │         │ response   │        │         │                │
  │         │ body       │        │         │                │
  │ OPTIONS │ Kiểm tra   │ ❌     │ ✅     │ ✅             │
  │         │ capabilities│       │         │ (CORS preflight)│
  └─────────┴────────────┴────────┴─────────┴────────────────┘

  Idempotent = Gọi N lần, kết quả GIỐNG gọi 1 lần!
  → GET /users/1: luôn trả user 1 (idempotent!)
  → POST /users: mỗi lần tạo user MỚI (KHÔNG idempotent!)
  → PUT /users/1: thay thế user 1, gọi 10 lần = 1 lần (idempotent!)
  → DELETE /users/1: lần 1 xóa, lần 2-N = 404 (vẫn idempotent!)

  GET vs POST:
  ┌──────────────────┬──────────────┬──────────────┐
  │                  │ GET          │ POST         │
  ├──────────────────┼──────────────┼──────────────┤
  │ Data             │ URL query    │ Body         │
  │ Length limit     │ ~2048 chars  │ Unlimited*   │
  │ Cache            │ ✅ Được     │ ❌ Mặc định  │
  │ Bookmark         │ ✅ Được     │ ❌ Không     │
  │ History          │ Lưu params  │ Không lưu body│
  │ Security         │ Kém (URL!)  │ Tốt hơn      │
  │ Encoding         │ URL encoded │ Nhiều loại   │
  │ Idempotent       │ ✅         │ ❌           │
  └──────────────────┴──────────────┴──────────────┘
```

```
COMMON REQUEST HEADERS:
═══════════════════════════════════════════════════════════════

  ┌──────────────────────────┬────────────────────────────────┐
  │ Header                   │ Ý nghĩa                        │
  ├──────────────────────────┼────────────────────────────────┤
  │ Host                     │ Domain đích (required HTTP/1.1)│
  │ Accept                   │ MIME types client chấp nhận    │
  │ Accept-Encoding          │ Compression: gzip, br, deflate │
  │ Accept-Language          │ Ngôn ngữ: vi, en-US, zh-CN    │
  │ Content-Type             │ MIME type của body             │
  │ Content-Length           │ Kích thước body (bytes)        │
  │ Authorization            │ Auth token: Bearer xxx         │
  │ Cookie                   │ Cookies → gửi kèm request     │
  │ User-Agent               │ Browser/OS info                │
  │ Referer                  │ Trang trước đó                 │
  │ Origin                   │ Origin (CORS!)                 │
  │ Cache-Control            │ Chính sách cache               │
  │ If-None-Match            │ ETag cũ → server check → 304?  │
  │ If-Modified-Since        │ Date cũ → server check → 304?  │
  │ Connection               │ keep-alive (HTTP/1.1 default)  │
  └──────────────────────────┴────────────────────────────────┘

  Content-Type PHỔ BIẾN:
  → application/json          — JSON data
  → application/x-www-form-urlencoded — Form data
  → multipart/form-data       — File upload
  → text/html                 — HTML page
  → text/plain                — Plain text
  → application/javascript    — JS file
  → image/png, image/jpeg     — Images
```

---

## §7. HTTP Status Codes — Toàn bộ ý nghĩa

```
STATUS CODES — 5 NHÓM:
═══════════════════════════════════════════════════════════════

  1xx: INFORMATIONAL (Thông tin)
  ┌──────┬─────────────────────────────────────────────────┐
  │ 100  │ Continue — Server nhận headers, client gửi body │
  │ 101  │ Switching Protocols — Upgrade to WebSocket!     │
  └──────┴─────────────────────────────────────────────────┘

  2xx: SUCCESS (Thành công)
  ┌──────┬─────────────────────────────────────────────────┐
  │ 200  │ OK — Thành công! Response có data              │
  │ 201  │ Created — Tạo mới thành công (POST)            │
  │ 204  │ No Content — Thành công, KHÔNG có body (DELETE) │
  │ 206  │ Partial Content — Trả 1 phần (Range request!)  │
  └──────┴─────────────────────────────────────────────────┘

  3xx: REDIRECTION (Chuyển hướng)
  ┌──────┬─────────────────────────────────────────────────┐
  │ 301  │ Moved Permanently — URL ĐỔI VĨNH VIỄN!        │
  │      │ → Browser cache redirect! SEO transfer!        │
  │ 302  │ Found — Chuyển hướng TẠM THỜI                  │
  │      │ → Không cache! Lần sau vẫn hỏi URL cũ         │
  │ 304  │ Not Modified — Cache còn FRESH!                │
  │      │ → If-None-Match/If-Modified-Since → không đổi  │
  │      │ → Dùng cache local! (không tải lại!)           │
  │ 307  │ Temporary Redirect — Như 302 nhưng GIỮ METHOD!  │
  │ 308  │ Permanent Redirect — Như 301 nhưng GIỮ METHOD!  │
  └──────┴─────────────────────────────────────────────────┘

  ⚠️ 301 vs 302: 301 → browser GHI NHỚ → SEO juice chuyển!
     302 → browser KHÔNG ghi nhớ → chỉ redirect tạm!
  ⚠️ 301/302 có thể đổi POST → GET! 307/308 GIỮ NGUYÊN method!

  4xx: CLIENT ERROR (Lỗi client)
  ┌──────┬─────────────────────────────────────────────────┐
  │ 400  │ Bad Request — Request sai format/thiếu data     │
  │ 401  │ Unauthorized — CHƯA XÁC THỰC! (cần login!)    │
  │ 403  │ Forbidden — ĐÃ xác thực, KHÔNG CÓ QUYỀN!      │
  │ 404  │ Not Found — Resource KHÔNG TỒN TẠI             │
  │ 405  │ Method Not Allowed — Method sai (PUT khi chỉ GET)│
  │ 408  │ Request Timeout — Server chờ quá lâu           │
  │ 409  │ Conflict — Xung đột (duplicate, version mismatch)│
  │ 413  │ Payload Too Large — Body quá lớn!              │
  │ 415  │ Unsupported Media Type — Content-Type sai      │
  │ 422  │ Unprocessable Entity — Data hợp lệ format      │
  │      │ nhưng KHÔNG hợp lệ logic (validation error!)   │
  │ 429  │ Too Many Requests — RATE LIMITED! Chờ!         │
  └──────┴─────────────────────────────────────────────────┘

  ⚠️ 401 vs 403:
  → 401: "Bạn là AI? Hãy LOGIN!" (Authentication!)
  → 403: "Tôi biết bạn rồi, nhưng bạn KHÔNG ĐƯỢC PHÉP!" (Authorization!)

  5xx: SERVER ERROR (Lỗi server)
  ┌──────┬─────────────────────────────────────────────────┐
  │ 500  │ Internal Server Error — Server LỖI chung       │
  │ 502  │ Bad Gateway — Proxy/LB nhận response lỗi từ    │
  │      │ upstream server (Nginx → backend crash!)       │
  │ 503  │ Service Unavailable — Server QUÁ TẢI hoặc     │
  │      │ đang bảo trì!                                  │
  │ 504  │ Gateway Timeout — Proxy/LB chờ upstream        │
  │      │ TIMEOUT! (backend quá chậm!)                   │
  └──────┴─────────────────────────────────────────────────┘

  ⚠️ 502 vs 504:
  → 502: backend TRẢ LỜI NHƯNG response LỖI (crash!)
  → 504: backend KHÔNG TRẢ LỜI (timeout — quá chậm!)
```

---

## §8. HTTP/1.1 → HTTP/2 — Những cải tiến

```
HTTP/1.1 VẤN ĐỀ:
═══════════════════════════════════════════════════════════════

  ① Head-of-Line Blocking (HOL):
     → 1 connection = 1 request/response tại 1 thời điểm
     → Request 2 PHẢI CHỜ request 1 xong!
     → Fix: mở 6-8 connections → vẫn limited!

  ② Text-based Protocol:
     → Headers là TEXT (không nén!) → lãng phí bandwidth!
     → Cookie headers gửi lặp lại MỖI request → 1-2KB mỗi lần!

  ③ No Server Push:
     → Client phải request TỪ TỪ: HTML → biết CSS → request CSS
     → Không thể gửi CSS TRƯỚC khi client request!

HTTP/2 CẢI TIẾN (2015):
═══════════════════════════════════════════════════════════════

  ① MULTIPLEXING (Ghép kênh):
     → 1 connection = NHIỀU request/response SONG SONG!
     → Streams: mỗi request = 1 stream, chia thành frames
     → Frames xen kẽ nhau trên 1 connection!
     → Giải quyết HOL blocking ở application layer!

  ┌───────── HTTP/1.1 ────────────────────────────────────┐
  │ Connection 1: [Request 1]──────[Response 1]            │
  │ Connection 2: [Request 2]──────[Response 2]            │
  │ Connection 3: [Request 3]──────[Response 3]            │
  └────────────────────────────────────────────────────────┘

  ┌───────── HTTP/2 ──────────────────────────────────────┐
  │ Single Connection:                                     │
  │ [Req1 Frame][Req2 Frame][Req3 Frame]                   │
  │ [Res2 Frame][Res1 Frame][Res3 Frame]                   │
  │ [Res1 Frame][Res3 Frame][Res2 Frame]                   │
  │ → Tất cả SONG SONG trên 1 connection! ⚡               │
  └────────────────────────────────────────────────────────┘

  ② HEADER COMPRESSION (HPACK):
     → Headers nén bằng HPACK algorithm
     → Static Table: 61 headers phổ biến (method, path, status...)
     → Dynamic Table: headers custom, index tham chiếu
     → Huffman encoding cho giá trị
     → Giảm header size 85-90%!

  ③ SERVER PUSH:
     → Server GỬI resource TRƯỚC KHI client request!
     → Client request HTML → Server push CSS + JS luôn!
     → Giảm round-trips!

  ④ BINARY PROTOCOL:
     → HTTP/1.1: text-based (dễ đọc, chậm parse)
     → HTTP/2: binary frames (khó đọc, NHANH parse!)
     → Mỗi frame: Length + Type + Flags + Stream ID + Payload

  ⑤ STREAM PRIORITIZATION:
     → Client đặt priority cho từng stream
     → CSS (high) trước images (low)!
     → Weight + Dependency tree

  ┌───────────────────┬──────────────┬──────────────┐
  │ Feature           │ HTTP/1.1     │ HTTP/2       │
  ├───────────────────┼──────────────┼──────────────┤
  │ Protocol          │ Text-based   │ Binary       │
  │ Multiplexing      │ ❌           │ ✅ Streams   │
  │ Header            │ Text (mỗi    │ HPACK nén!   │
  │                   │ request!)    │ 85-90% nhỏ!  │
  │ Server Push       │ ❌           │ ✅           │
  │ Connections       │ 6-8 per host │ 1 đủ rồi!    │
  │ HOL Blocking      │ ✅ Vẫn có   │ ❌ App layer │
  │                   │              │ (⚠️ TCP vẫn!)│
  │ Priority          │ ❌           │ ✅ Weights   │
  │ TLS required      │ ❌ Optional  │ ✅ Thực tế   │
  └───────────────────┴──────────────┴──────────────┘

  ⚠️ HTTP/2 vẫn bị TCP HOL Blocking!
  → 1 packet lost → TẤT CẢ streams chờ retransmit!
  → HTTP/3 (QUIC/UDP) giải quyết vấn đề này!
```

---

## §9. HTTPS — Nguyên lý mã hóa & Hijack

```
HTTPS = HTTP + TLS (Transport Layer Security):
═══════════════════════════════════════════════════════════════

  HTTP: plaintext → ai xen giữa ĐỌC ĐƯỢC hết! 💀
  HTTPS: encrypted → xen giữa chỉ thấy ciphertext!

  Port: HTTP = 80, HTTPS = 443
```

```
TLS HANDSHAKE — THIẾT LẬP MÃ HÓA:
═══════════════════════════════════════════════════════════════

  Client                                   Server
     │                                       │
     │ ① ClientHello                        │
     │──────────────────────────────────────→│
     │ TLS version, cipher suites, random    │
     │                                       │
     │ ② ServerHello                        │
     │←──────────────────────────────────────│
     │ Chosen cipher, random, CERTIFICATE    │
     │                                       │
     │ ③ Client verify certificate:          │
     │    → CA đáng tin? (Root CA chain!)    │
     │    → Domain match? (CN/SAN)           │
     │    → Hết hạn chưa? (expiry date)     │
     │    → Bị thu hồi? (CRL/OCSP)          │
     │                                       │
     │ ④ Key Exchange                       │
     │ ──────────────────────────────────── →│
     │ Pre-master secret (encrypted with     │
     │ server's PUBLIC KEY!)                 │
     │                                       │
     │ ⑤ Both compute SESSION KEY:          │
     │ session_key = f(pre-master, random_c,  │
     │                  random_s)             │
     │                                       │
     │ ⑥ Finished (encrypted!)              │
     │←──────────────────────────────────────│
     │                                       │
     │ ═══ MÃ HÓA ĐỐI XỨNG (AES) Bắt đầu ═══│
     │ ← Dùng session_key cho tất cả data → │

  MÃ HÓA:
  → Asymmetric (RSA/ECDH): chỉ dùng cho KEY EXCHANGE (chậm!)
  → Symmetric (AES): dùng cho DATA (nhanh!)
  → Kết hợp: asymmetric trao đổi key → symmetric mã hóa data!
```

```
CÁCH BẬT HTTPS:
═══════════════════════════════════════════════════════════════

  ① Lấy SSL/TLS Certificate:
     → Let's Encrypt (FREE!): certbot --nginx -d example.com
     → Paid CA: DigiCert, Comodo, GlobalSign

  ② Cấu hình Web Server:
     # Nginx:
     server {
         listen 443 ssl http2;
         ssl_certificate     /etc/letsencrypt/live/example.com/fullchain.pem;
         ssl_certificate_key /etc/letsencrypt/live/example.com/privkey.pem;
         ssl_protocols       TLSv1.2 TLSv1.3;
     }

  ③ Redirect HTTP → HTTPS:
     server {
         listen 80;
         return 301 https://$host$request_uri;
     }

  ④ HSTS Header (Force HTTPS!):
     add_header Strict-Transport-Security "max-age=31536000; includeSubDomains";

HTTPS CÓ THỂ BỊ HIJACK KHÔNG?
═══════════════════════════════════════════════════════════════

  ① MITM (Man-in-the-Middle):
     → Attacker xen giữa client ↔ server
     → NẾU client chấp nhận FAKE certificate → bị đọc!
     → Browser cảnh báo "Certificate not trusted!" → CẨN THẬN!
     → Dùng HSTS → enforce HTTPS!

  ② SSL Stripping:
     → Attacker chặn HTTP request (port 80)
     → Attacker kết nối HTTPS với server, HTTP với client!
     → Client nghĩ nói chuyện với server (nhưng qua attacker!)
     → FIX: HSTS + Preload list!

  ③ Fake CA Certificate:
     → Attacker cài ROOT CA trên máy victim
     → Tạo certificate cho bất kỳ domain nào!
     → Dùng trong: corporate proxies, Charles/Fiddler debugging
     → FIX: Certificate Pinning (mobile apps!)
```

---

## §10. WebSocket — So sánh với HTTP

```
WEBSOCKET:
═══════════════════════════════════════════════════════════════

  → Protocol cho FULL-DUPLEX COMMUNICATION
  → 1 connection DUY TRÌ liên tục → 2 chiều REAL-TIME!
  → Port: 80 (ws://) hoặc 443 (wss://)
  → Bắt đầu bằng HTTP Upgrade → switch sang WebSocket!

  UPGRADE HANDSHAKE:
  Client → Server (HTTP):
  GET /chat HTTP/1.1
  Host: server.com
  Upgrade: websocket              ← Yêu cầu upgrade!
  Connection: Upgrade
  Sec-WebSocket-Key: dGhlIHNhb...  ← Random key
  Sec-WebSocket-Version: 13

  Server → Client:
  HTTP/1.1 101 Switching Protocols  ← 101 = đồng ý!
  Upgrade: websocket
  Connection: Upgrade
  Sec-WebSocket-Accept: s3pPLM...   ← Hash(Key + Magic String)

  → SAU 101: HTTP connection → WebSocket connection!
  → 2 chiều, binary/text frames, KHÔNG CÓ request/response!
```

```javascript
// ═══ WEBSOCKET API ═══

// Client:
const ws = new WebSocket("wss://server.com/chat");

ws.onopen = () => {
  console.log("Connected!");
  ws.send("Hello Server!");
  ws.send(JSON.stringify({ type: "join", room: "general" }));
};

ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  console.log("Received:", data);
};

ws.onclose = (event) => {
  console.log("Closed:", event.code, event.reason);
  // Reconnect logic:
  setTimeout(() => reconnect(), 3000);
};

ws.onerror = (error) => {
  console.error("WebSocket error:", error);
};

// Gửi binary data:
ws.send(new Blob(["binary data"]));
ws.send(new ArrayBuffer(8));

// Đóng:
ws.close(1000, "Normal closure");
```

```
HTTP vs WEBSOCKET vs SSE:
═══════════════════════════════════════════════════════════════

  ┌──────────────────┬──────────────┬──────────────┬──────────┐
  │ Feature          │ HTTP         │ WebSocket    │ SSE      │
  ├──────────────────┼──────────────┼──────────────┼──────────┤
  │ Direction        │ Client → Srv │ Bidirectional│ Srv → Cli│
  │ Connection       │ Short-lived  │ Persistent   │ Persistent│
  │ Protocol         │ HTTP         │ WS (upgrade) │ HTTP     │
  │ Data format      │ Text/Binary  │ Text/Binary  │ Text only│
  │ Overhead         │ Headers mỗi  │ Frames nhẹ!  │ Nhẹ      │
  │                  │ request!     │ (2-14 bytes) │          │
  │ Use case         │ REST API     │ Chat, Games, │ Notif.,  │
  │                  │              │ Live data    │ Feed,    │
  │                  │              │              │ Progress │
  │ Reconnect        │ N/A          │ Manual       │ Auto!    │
  │ Browser support  │ ✅ All      │ ✅ All      │ ✅ (no IE)│
  └──────────────────┴──────────────┴──────────────┴──────────┘

  KHI NÀO DÙNG GÌ:
  → REST API, CRUD → HTTP
  → Real-time 2 chiều (chat, games, live trading) → WebSocket
  → Server notifications, live feed, progress → SSE
  → HTTP Polling (fallback) → setInterval + fetch (tốn tài nguyên!)
  → HTTP Long Polling → fetch hang cho đến có data (server giữ connection)
```

---

## §11. Tổng kết & Checklist phỏng vấn

```
MIND MAP:
═══════════════════════════════════════════════════════════════

  Network Protocol
  ├── TCP/IP: 4 layers (App → Transport → Internet → Network Access)
  │   ├── TCP vs UDP: reliable/ordered vs fast/unreliable
  │   ├── 3-Way Handshake: SYN → SYN+ACK → ACK (confirm both directions!)
  │   ├── 4-Way Handshake: FIN → ACK → FIN → ACK (full-duplex close)
  │   └── Reliable: SeqNum, ACK, Retransmit, Sliding Window, Congestion
  ├── DNS: domain → IP, recursive query through Root → TLD → Auth NS
  │   └── Optimize: dns-prefetch, reduce domains, CDN DNS
  ├── CDN: edge servers worldwide, cache static assets, origin fallback
  ├── HTTP: request/response messages, 9 methods, headers
  │   ├── Status: 1xx info, 2xx success, 3xx redirect, 4xx client, 5xx server
  │   ├── 301 vs 302: permanent (cache+SEO) vs temporary
  │   └── 401 vs 403: authentication vs authorization
  ├── HTTP/2: multiplexing, HPACK, server push, binary, priority
  ├── HTTPS: TLS handshake, asymmetric key exchange → symmetric data
  │   └── Hijack: MITM (fake cert), SSL strip (HSTS fix!), fake CA
  └── WebSocket: full-duplex, HTTP upgrade, persistent, low overhead
```

### Checklist

- [ ] **TCP/IP 4 layers**: Application (HTTP/DNS) → Transport (TCP/UDP) → Internet (IP) → Network Access (Ethernet)
- [ ] **Encapsulation**: mỗi layer bọc thêm header, nhận bên kia bóc ra theo thứ tự ngược
- [ ] **TCP vs UDP**: TCP = reliable/ordered/connection, UDP = fast/unreliable/connectionless
- [ ] **3-Way Handshake**: SYN(seq=x) → SYN+ACK(seq=y,ack=x+1) → ACK(ack=y+1); tại sao không 2 bước = tránh SYN cũ!
- [ ] **4-Way Handshake**: FIN → ACK → (server tiếp gửi) → FIN → ACK; TIME-WAIT = 2MSL đảm bảo ACK cuối!
- [ ] **TCP reliable**: Sequence Numbers, ACK, Retransmission (timeout + 3 dup ACK), Sliding Window, Congestion Control, Checksum
- [ ] **Sliding Window**: sender chỉ gửi tối đa window size chưa ACK, receiver báo window=0 → dừng!
- [ ] **DNS process**: Browser cache → OS cache → Router → ISP Resolver → Root NS → TLD NS → Auth NS → IP!
- [ ] **DNS optimize**: dns-prefetch link tag, ít domain, CDN DNS (CNAME), TTL tuning
- [ ] **CDN**: edge server gần user, cache hit → trả luôn, miss → fetch origin → cache → trả
- [ ] **HTTP message**: Request (method URI version + headers + body), Response (version status phrase + headers + body)
- [ ] **HTTP methods**: GET(read,idempotent), POST(create), PUT(replace,idempotent), PATCH(modify), DELETE(idempotent), HEAD, OPTIONS(CORS)
- [ ] **Status 301 vs 302**: 301 permanent (browser cache, SEO), 302 temporary (no cache); 307/308 giữ method!
- [ ] **Status 401 vs 403**: 401 = chưa login (authentication), 403 = đã login nhưng không quyền (authorization)
- [ ] **Status 502 vs 504**: 502 = backend trả response lỗi, 504 = backend không trả (timeout)
- [ ] **HTTP/2**: Multiplexing (1 connection, nhiều streams), HPACK (header nén 85-90%), Server Push, Binary protocol, Stream priority
- [ ] **HTTP/2 HOL**: giải quyết app-layer HOL nhưng TCP HOL vẫn còn → HTTP/3 dùng QUIC/UDP!
- [ ] **HTTPS TLS**: ClientHello → ServerHello+Cert → Verify cert (CA chain) → Key exchange (asymmetric) → Session key → Symmetric encryption (AES)
- [ ] **HTTPS hijack**: MITM (fake cert → browser warning!), SSL Stripping (fix: HSTS), Fake CA (fix: Certificate Pinning)
- [ ] **WebSocket**: HTTP upgrade (101), full-duplex, persistent, low overhead (2-14 bytes/frame), dùng cho chat/games/live data
- [ ] **WS vs HTTP vs SSE**: HTTP=request/response, WS=bidirectional persistent, SSE=server→client only + auto reconnect

---

_Nguồn: ConardLi — "Network Protocol" · Juejin_
_Cập nhật lần cuối: Tháng 2, 2026_
