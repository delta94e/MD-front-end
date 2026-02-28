# HTTP/1.1 vs HTTP/2 vs HTTP/3 — Deep Dive!

> **Hiểu sâu sự tiến hóa của giao thức HTTP!**

---

## §1. Nhược Điểm HTTP/1.1!

```
  HTTP/1.1 — 4 NHƯỢC ĐIỂM CHÍNH:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  ① HEAD-OF-LINE BLOCKING (Tắc nghẽn đầu hàng!) ★          │
  │  ② STATELESS (Không trạng thái → Header khổng lồ!)       │
  │  ③ PLAINTEXT (Truyền văn bản thuần → Không an toàn!)     │
  │  ④ KHÔNG HỖ TRỢ SERVER PUSH!                                │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```

### 1.1 Head-of-Line Blocking!

```
  HEAD-OF-LINE BLOCKING:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  HTTP/1.1: MỖI TCP connection = 1 request tại 1 thời điểm!│
  │                                                              │
  │  TRƯỜNG HỢP BỊ BLOCK:                                         │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ TCP Connection 1:                                      │    │
  │  │ ┌────┐┌────┐┌────┐┌────┐                              │    │
  │  │ │Req1││Req2││Req3││Req4│ → XẾP HÀNG! ★              │    │
  │  │ └────┘└────┘└────┘└────┘                              │    │
  │  │   ↑                                                    │    │
  │  │   Req1 CHẬM → Req2,3,4 phải ĐỢI! ❌                │    │
  │  │                                                      │    │
  │  │ Chrome: tối đa 6 TCP connections / domain! ★           │    │
  │  │ → 10 requests cùng lúc → 4 cái phải đợi! ❌        │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  CÁC CÁCH WORKAROUND (HTTP/1.1):                               │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ ① Domain Sharding: chia tài nguyên ra nhiều domain!  │    │
  │  │    img1.cdn.com, img2.cdn.com → 6 conn mỗi domain! │    │
  │  │                                                      │    │
  │  │ ② Sprite Sheets: gộp nhiều ảnh nhỏ → 1 ảnh lớn!   │    │
  │  │    → Giảm số request!                                │    │
  │  │                                                      │    │
  │  │ ③ Inlining: nhúng ảnh vào CSS (data:base64...)!     │    │
  │  │    → 0 request thêm cho ảnh nhỏ!                    │    │
  │  │                                                      │    │
  │  │ ④ Bundling: webpack gộp JS → 1 file (concatenation!)│    │
  │  │    → Nhưng thay đổi 1 file = tải lại CẢ bundle! ❌│    │
  │  │                                                      │    │
  │  │ ★ Tất cả đều là HACK, không giải quyết gốc rễ!   │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```

### 1.2 Stateless & Header Khổng Lồ!

```
  STATELESS PROBLEM:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  HTTP = STATELESS → không nhớ trạng thái kết nối!         │
  │                                                              │
  │  HẬU QUẢ: HEADER CỰC LỚN!                                    │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ Mỗi request gửi KÈM:                                  │    │
  │  │ → User-Agent: Mozilla/5.0 (Windows...)  ~200 bytes!  │    │
  │  │ → Cookie: session=abc123; token=xyz...  ~500 bytes!  │    │
  │  │ → Accept: text/html, application/json...              │    │
  │  │ → Accept-Language, Accept-Encoding...                  │    │
  │  │ → Authorization: Bearer eyJhbGc...      ~300 bytes!  │    │
  │  │                                                      │    │
  │  │ HEADER: ~800-2000 bytes!                               │    │
  │  │ BODY:   ~50-200 bytes (GET request!)                   │    │
  │  │                                                      │    │
  │  │ ★ "Big-headed child" — đầu TO hơn thân! ★            │    │
  │  │ ★ Header TRÙNG LẶP giữa các request! LÃNG PHÍ! ❌  │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```

### 1.3 Plaintext & Không An Toàn!

```
  PLAINTEXT:
  ┌──────────────────────────────────────────────────────────────┐
  │  → HTTP/1.1 truyền DỮ LIỆU dạng VĂN BẢN THUẦN!          │
  │  → Ai cũng đọc được nếu bắt traffic! (Wireshark!)       │
  │  → KHÔNG xác minh danh tính client/server!                 │
  │  → Man-in-the-Middle attack có thể xảy ra! ❌             │
  │                                                              │
  │  Không hỗ trợ Server Push:                                     │
  │  → Client GỬI request → Server MỚI trả response!         │
  │  → Server KHÔNG THỂ chủ động gửi dữ liệu!              │
  │  → Client phải đoán & request TẤT CẢ resources! ❌       │
  └──────────────────────────────────────────────────────────────┘
```

---

## §2. SPDY — Tiền Thân HTTP/2!

```
  SPDY PROTOCOL (Google, 2009):
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  VỊ TRÍ TRONG PROTOCOL STACK:                                   │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │                                                      │    │
  │  │  ┌──────────────┐    ┌──────────────┐                │    │
  │  │  │   HTTP/1.x   │    │   HTTP/1.x   │                │    │
  │  │  └──────┬───────┘    └──────┬───────┘                │    │
  │  │         │                   │                          │    │
  │  │         │              ┌────▼─────┐                    │    │
  │  │         │              │  SPDY ★  │ ← LỚP MỚI!      │    │
  │  │         │              └────┬─────┘                    │    │
  │  │         │                   │                          │    │
  │  │    ┌────▼───────────────────▼────┐                    │    │
  │  │    │         SSL/TLS            │                    │    │
  │  │    └────────────┬────────────────┘                    │    │
  │  │                 │                                      │    │
  │  │    ┌────────────▼────────────────┐                    │    │
  │  │    │           TCP              │                    │    │
  │  │    └─────────────────────────────┘                    │    │
  │  │                                                      │    │
  │  │  ★ SPDY nằm GIỮA HTTP và SSL!                       │    │
  │  │  → Không thay đổi HTTP syntax!                       │    │
  │  │  → Chỉ thêm optimization layer!                      │    │
  │  │  → Tương thích HTTP/1.x cũ!                          │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  SPDY đã CHỨNG MINH khả thi → thành NỀN TẢNG HTTP/2! ★  │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```

---

## §3. HTTP/2 — Tính Năng Mới!

```
  HTTP/2 (2015) — RFC 7540:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  ★ KHÔNG viết lại HTTP! Giữ nguyên methods, status codes!   │
  │  ★ Chỉ 1 TCP connection cho toàn bộ domain! ★              │
  │  ★ Cải thiện 20-60% hiệu suất!                              │
  │                                                              │
  │  5 TÍNH NĂNG MỚI:                                              │
  │  ① Binary Framing (Truyền nhị phân!)                        │
  │  ② HPACK Header Compression (Nén header!)                   │
  │  ③ Multiplexing (Ghép kênh!)                                │
  │  ④ Server Push (Đẩy từ server!)                            │
  │  ⑤ Improved Security (Bảo mật tốt hơn!)                  │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```

### 3.1 Binary Framing!

```
  BINARY FRAMING:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  HTTP/1.1 (Text):            HTTP/2 (Binary): ★              │
  │  ┌──────────────────┐       ┌──────────────────┐            │
  │  │ GET /index HTTP/1│       │ HEADERS Frame    │            │
  │  │ Host: example.com│       │ ┌──────────────┐ │            │
  │  │ Accept: text/html│       │ │ Binary data  │ │            │
  │  │                  │       │ │ 01001010110  │ │            │
  │  │ <body content>   │       │ └──────────────┘ │            │
  │  └──────────────────┘       │ DATA Frame       │            │
  │                             │ ┌──────────────┐ │            │
  │                             │ │ Binary data  │ │            │
  │                             │ │ 11010100101  │ │            │
  │                             │ └──────────────┘ │            │
  │                             └──────────────────┘            │
  │                                                              │
  │  ★ Header+Body → HEADERS Frame + DATA Frame!               │
  │  ★ Binary phân tích NHANH hơn text!                         │
  │  ★ Chia nhỏ thành frames → gửi xen kẽ được! ★            │
  │                                                              │
  │  FRAME STRUCTURE:                                               │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ ┌─────────┬──────┬───────┬─────────┬──────────────┐ │    │
  │  │ │ Length  │ Type │ Flags │StreamID │  Payload     │ │    │
  │  │ │ 3 bytes│1 byte│1 byte │ 4 bytes │  N bytes     │ │    │
  │  │ └─────────┴──────┴───────┴─────────┴──────────────┘ │    │
  │  │                                                      │    │
  │  │ Type: HEADERS=0x1, DATA=0x0, SETTINGS=0x4...        │    │
  │  │ StreamID: stream nào frame này thuộc về! ★            │    │
  │  │ → Nhiều frames XEN KẼ → reassemble bằng StreamID!  │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```

### 3.2 HPACK Header Compression!

```
  HPACK — NÉN HEADER:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  CƠ CHẾ: Static Table + Dynamic Table + Huffman Coding! ★  │
  │                                                              │
  │  ① STATIC TABLE (61 entries cố định!):                       │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ Index │ Header Name        │ Header Value             │    │
  │  │ 1     │ :authority         │                          │    │
  │  │ 2     │ :method            │ GET                      │    │
  │  │ 3     │ :method            │ POST                     │    │
  │  │ 4     │ :path              │ /                        │    │
  │  │ ...   │ ...                │ ...                      │    │
  │  │ 61    │ www-authenticate   │                          │    │
  │  │                                                      │    │
  │  │ ★ :method GET chỉ cần gửi INDEX = 2! (1 byte!)      │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  ② DYNAMIC TABLE (Header đã gửi trước đó!):               │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ → Client & Server MỖI BÊN giữ 1 bảng giống nhau!   │    │
  │  │ → Header mới → thêm vào dynamic table!               │    │
  │  │ → Lần sau → chỉ gửi INDEX! ★                        │    │
  │  │                                                      │    │
  │  │ Request 1: Gửi ĐẦY ĐỦ tất cả headers!              │    │
  │  │ Request 2: CHỈ gửi headers KHÁC Request 1! ★         │    │
  │  │                                                      │    │
  │  │ VD: Cookie dài 500 bytes → lần 2 chỉ gửi 1 byte!   │    │
  │  │ → Nén 50% - 90%! ★                                    │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  ③ HUFFMAN CODING:                                            │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ → Mã hóa ký tự theo TẦN SUẤT xuất hiện!           │    │
  │  │ → Ký tự phổ biến = ít bits hơn! ★                  │    │
  │  │ → VD: 'e' = 5 bits, 'z' = 26 bits!                  │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```

### 3.3 Multiplexing!

```
  MULTIPLEXING — GHÉP KÊNH:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  HTTP/1.1:                    HTTP/2: ★                       │
  │  ┌─────────────────┐        ┌─────────────────┐             │
  │  │ Conn1: ──Req1──→│        │                 │             │
  │  │ Conn2: ──Req2──→│        │  1 Connection:  │             │
  │  │ Conn3: ──Req3──→│        │  ┌─┐┌─┐┌─┐┌─┐  │             │
  │  │ Conn4: ──Req4──→│        │  │1││3││2││1│  │             │
  │  │ Conn5: ──Req5──→│        │  └─┘└─┘└─┘└─┘  │             │
  │  │ Conn6: ──Req6──→│        │  ┌─┐┌─┐┌─┐┌─┐  │             │
  │  │ (max 6!)        │        │  │2││1││3││2│  │             │
  │  └─────────────────┘        │  └─┘└─┘└─┘└─┘  │             │
  │  6 TCP connections!         │  Frames xen kẽ! │             │
  │  6 slow-starts! ❌          └─────────────────┘             │
  │                              1 TCP! 1 slow-start! ✅        │
  │                                                              │
  │  ĐẶC ĐIỂM:                                                     │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ → 1 TCP connection cho TOÀN BỘ domain! ★            │    │
  │  │ → Không giới hạn số request song song!               │    │
  │  │ → Frames gửi XEN KẼ, không cần chờ! ★               │    │
  │  │ → Reassemble bằng Stream ID trong frame header!      │    │
  │  │ → Không blocking giữa các requests!                  │    │
  │  │ → Mỗi request có PRIORITY (31-bit, 0 = cao nhất!)   │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  STREAM, MESSAGE, FRAME:                                        │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ Connection: 1 TCP connection!                          │    │
  │  │   └── Stream 1: request/response đôi 1!             │    │
  │  │       ├── Message: HEADERS + DATA                      │    │
  │  │       │   ├── Frame: HEADERS (binary!)                │    │
  │  │       │   └── Frame: DATA (binary!)                   │    │
  │  │       └── Message: response                            │    │
  │  │   └── Stream 2: request/response đôi 2!             │    │
  │  │   └── Stream N: ...                                    │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```

### 3.4 Server Push!

```
  SERVER PUSH:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  HTTP/1.1:                                                      │
  │  Browser ──GET index.html──→ Server                          │
  │  Browser ←──index.html──── Server                            │
  │  Browser: "phải parse HTML → tìm CSS, JS..."              │
  │  Browser ──GET style.css──→ Server ← PHẢI ĐỢI! ❌         │
  │  Browser ──GET app.js────→ Server                            │
  │                                                              │
  │  HTTP/2 SERVER PUSH: ★                                         │
  │  Browser ──GET index.html──────→ Server                      │
  │  Browser ←──index.html─────── Server                        │
  │  Browser ←──PUSH style.css──── Server ← CHỦ ĐỘNG! ★       │
  │  Browser ←──PUSH app.js─────── Server ← KHÔNG CẦN REQ! ★  │
  │                                                              │
  │  ĐẶC ĐIỂM:                                                     │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ → Server CHỦ ĐỘNG push resources!                     │    │
  │  │ → Client có quyền TỪ CHỐI (RST_STREAM frame!)       │    │
  │  │ → Nếu đã CACHE → browser reject push! ★              │    │
  │  │ → Tuân thủ Same-Origin Policy!                        │    │
  │  │ → Giảm latency đáng kể!                              │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```

### 3.5 Bảo Mật HTTP/2!

```
  SECURITY:
  ┌──────────────────────────────────────────────────────────────┐
  │  → Về lý thuyết: HTTP/2 hỗ trợ CẢ plaintext + encrypted! │
  │  → Thực tế: Chrome, Firefox CHỈ hỗ trợ encrypted! ★      │
  │  → HTTP/2 "de facto" = HTTPS! ★                             │
  │                                                              │
  │  "h2"  = HTTP/2 encrypted (TLS!) ← phổ biến! ★             │
  │  "h2c" = HTTP/2 plaintext (clear!) ← hiếm dùng!           │
  └──────────────────────────────────────────────────────────────┘
```

---

## §4. Nhược Điểm HTTP/2!

```
  HTTP/2 VẪN CÒN VẤN ĐỀ — DO TCP!
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  ① TCP + TLS HANDSHAKE DELAY:                                  │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ TCP 3-way handshake:     1.5 RTT! ★                  │    │
  │  │ TLS handshake (1.2):     2 RTT!                        │    │
  │  │ TLS handshake (1.3):     1 RTT!                        │    │
  │  │ ─────────────────────────────────                      │    │
  │  │ TỔNG:                     3-4 RTT trước khi gửi data!│    │
  │  │                                                      │    │
  │  │ RTT = Round-Trip Time (thời gian đi-về!)             │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  ② TCP HEAD-OF-LINE BLOCKING VẪN CÒN!                        │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ HTTP/2: 1 TCP connection! ★                            │    │
  │  │ → 1 packet MẤT → TOÀN BỘ connection bị block! ❌   │    │
  │  │ → TCP phải đợi retransmit packet mất!                │    │
  │  │ → TẤT CẢ streams bị ảnh hưởng! ★                   │    │
  │  │                                                      │    │
  │  │ HTTP/1.1: 6 TCP connections!                            │    │
  │  │ → 1 packet mất → CHỈ 1 connection bị block!         │    │
  │  │ → 5 connections còn lại VẪN HOẠT ĐỘNG! ✅            │    │
  │  │                                                      │    │
  │  │ ★ HTTP/2 thực tế CÓ THỂ CHẬM HƠN HTTP/1.1           │    │
  │  │   khi mạng có tỉ lệ mất packet CAO! ★               │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  ③ MULTIPLEXING → QPS BURST:                                   │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ → Không giới hạn request song song!                   │    │
  │  │ → Short bursts → QPS tăng đột biến! ★                │    │
  │  │ → Server overload ngắn hạn!                          │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  ④ MULTIPLEXING → TIMEOUT:                                     │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ → Nhiều streams chia sẻ 1 connection!                │    │
  │  │ → Bandwidth bị CHIA ĐỀU cho mỗi stream!             │    │
  │  │ → Tất cả streams CHẬM → tất cả TIMEOUT! ❌         │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  ★ GỐC RỄ: TCP KHÔNG THỂ SỬA ĐƯỢC!                         │
  │  → TCP đã tồn tại quá lâu, cài trên MỌI thiết bị!       │
  │  → Nằm trong KERNEL OS → cập nhật không khả thi!         │
  │  → CẦN giao thức MỚI! → QUIC / HTTP/3! ★                  │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```

---

## §5. HTTP/3 & QUIC Protocol!

```
  HTTP/3 — QUIC (Google):
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  PROTOCOL STACK SO SÁNH:                                        │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │                                                      │    │
  │  │  HTTP/1.1      HTTP/2        HTTP/3 ★                 │    │
  │  │  ┌──────┐      ┌──────┐      ┌──────┐                │    │
  │  │  │ HTTP │      │ HTTP │      │ HTTP │                │    │
  │  │  └──┬───┘      └──┬───┘      └──┬───┘                │    │
  │  │     │              │              │                    │    │
  │  │     │              │         ┌────▼────┐              │    │
  │  │     │              │         │ QUIC ★  │              │    │
  │  │     │              │         │(TLS 1.3)│              │    │
  │  │     │              │         └────┬────┘              │    │
  │  │  ┌──▼───┐      ┌──▼───┐         │                    │    │
  │  │  │ TLS  │      │ TLS  │         │                    │    │
  │  │  └──┬───┘      └──┬───┘         │                    │    │
  │  │  ┌──▼───┐      ┌──▼───┐     ┌───▼──┐                │    │
  │  │  │ TCP  │      │ TCP  │     │ UDP ★│                │    │
  │  │  └──────┘      └──────┘     └──────┘                │    │
  │  │                                                      │    │
  │  │  ★ HTTP/3 chạy trên UDP thay vì TCP! ★              │    │
  │  │  ★ QUIC = Quick UDP Internet Connections!             │    │
  │  │  ★ TLS 1.3 TÍCH HỢP trong QUIC!                     │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```

### 5.1 QUIC — Tính Năng Mới!

```
  QUIC FEATURES:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  ① 0-RTT / 1-RTT HANDSHAKE! ★★★                              │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ TCP+TLS: 3-4 RTT trước khi gửi data! ❌              │    │
  │  │ QUIC:    0-1 RTT! ★                                    │    │
  │  │                                                      │    │
  │  │ Lần đầu kết nối:  1 RTT (full handshake!)            │    │
  │  │ Kết nối lại:       0 RTT! ★ (session resumption!)   │    │
  │  │ → Gửi data NGAY LẬP TỨC! ★                          │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  ② GIẢI QUYẾT HOÀN TOÀN HEAD-OF-LINE BLOCKING! ★★★         │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ TCP:  1 packet mất → BLOCK TẤT CẢ streams! ❌      │    │
  │  │ QUIC: 1 packet mất → CHỈ block stream ĐÓ! ★        │    │
  │  │       Các stream khác VẪN CHẠY BÌNH THƯỜNG! ✅       │    │
  │  │                                                      │    │
  │  │ QUIC Stream 1: ──────█──────→ (block!)                │    │
  │  │ QUIC Stream 2: ────────────→ (OK! ✅)                 │    │
  │  │ QUIC Stream 3: ────────────→ (OK! ✅)                 │    │
  │  │                  █ = lost packet                       │    │
  │  │ → Streams ĐỘC LẬP! Không ảnh hưởng lẫn nhau! ★  │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  ③ TLS 1.3 TÍCH HỢP:                                         │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ → TLS 1.3 NẰM TRONG QUIC! (không tách rời!)         │    │
  │  │ → Handshake kết hợp: transport + encryption!          │    │
  │  │ → 0-RTT session resumption! ★                          │    │
  │  │                                                      │    │
  │  │ ★ Nhưng 0-RTT không đảm bảo Forward Secrecy!        │    │
  │  │ → Giải pháp: Session Ticket Key hết hạn sau vài giờ!│    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  ④ CONNECTION MIGRATION! ★                                     │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ TCP: connection = {clientIP, clientPort,              │    │
  │  │                     serverIP, serverPort}              │    │
  │  │ → Đổi WiFi → 4-tuple thay đổi → MẤT connection! ❌ │    │
  │  │ → Phải reconnect! (TCP handshake lại!)               │    │
  │  │                                                      │    │
  │  │ QUIC: connection = Connection ID (64-bit!) ★           │    │
  │  │ → Đổi WiFi → Connection ID KHÔNG ĐỔI! ★             │    │
  │  │ → Connection VẪN GIỮ! Không cần reconnect! ✅        │    │
  │  │ → Session key giữ nguyên → mã hóa liên tục!        │    │
  │  │                                                      │    │
  │  │ VD: Đang xem video trên 4G → chuyển WiFi!           │    │
  │  │ TCP: video DỪNG → reconnect → buffer lại! ❌        │    │
  │  │ QUIC: video TIẾP TỤC mượt mà! ✅ ★                  │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  ⑤ PLUGGABLE CONGESTION CONTROL:                               │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ TCP: congestion control NẰM TRONG KERNEL!             │    │
  │  │ → Thay đổi = cập nhật OS! ❌ (không thực tế!)      │    │
  │  │                                                      │    │
  │  │ QUIC: congestion control Ở APPLICATION LEVEL! ★       │    │
  │  │ → Thay đổi thuật toán dễ dàng!                      │    │
  │  │ → Dùng BBR, CUBIC, hay custom! ✅                     │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```

---

## §6. Tổng Hợp So Sánh!

```
  BẢNG SO SÁNH HTTP/1.1 vs HTTP/2 vs HTTP/3:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  ┌──────────────┬──────────┬──────────┬──────────────┐      │
  │  │ TIÊU CHÍ      │ HTTP/1.1 │ HTTP/2   │ HTTP/3       │      │
  │  ├──────────────┼──────────┼──────────┼──────────────┤      │
  │  │ Transport     │ TCP      │ TCP      │ UDP+QUIC ★  │      │
  │  │ Encryption    │ Optional │ De facto │ Built-in ★   │      │
  │  │ Multiplexing  │ ❌       │ ✅       │ ✅ (tốt hơn)│      │
  │  │ Header Comp.  │ ❌       │ HPACK    │ QPACK        │      │
  │  │ Server Push   │ ❌       │ ✅       │ ✅           │      │
  │  │ HOL Blocking  │ TCP+HTTP │ TCP only │ ❌ Solved! ★ │      │
  │  │ Handshake     │ 3-4 RTT  │ 3-4 RTT  │ 0-1 RTT ★   │      │
  │  │ Conn. Migrate │ ❌       │ ❌       │ ✅ ★         │      │
  │  │ Binary        │ ❌ Text  │ ✅       │ ✅           │      │
  │  └──────────────┴──────────┴──────────┴──────────────┘      │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```

---

## §7. Tự Viết Mô Phỏng!

```javascript
// ═══════════════════════════════════════════════════════════
// MÔ PHỎNG: HTTP/1.1 vs HTTP/2 Multiplexing!
// ★ Tự viết, không dùng thư viện!
// ═══════════════════════════════════════════════════════════

// --- HTTP/1.1: Tuần tự, blocking! ---
async function http1Sequential(urls) {
  console.log("=== HTTP/1.1 (Sequential) ===");
  const start = Date.now();
  const results = [];

  // ★ MỖI request phải ĐỢI request trước hoàn thành!
  for (const url of urls) {
    const data = await fakeFetch(url); // BLOCKING! ❌
    results.push(data);
  }

  console.log(`Tổng thời gian: ${Date.now() - start}ms`);
  return results;
}

// --- HTTP/2: Song song, multiplexing! ---
async function http2Multiplexed(urls) {
  console.log("=== HTTP/2 (Multiplexed) ===");
  const start = Date.now();

  // ★ TẤT CẢ requests chạy SONG SONG!
  const results = await Promise.all(
    urls.map((url) => fakeFetch(url)), // PARALLEL! ✅
  );

  console.log(`Tổng thời gian: ${Date.now() - start}ms`);
  return results;
}

function fakeFetch(url) {
  const delay = Math.random() * 200 + 100; // 100-300ms
  return new Promise((resolve) => {
    setTimeout(() => resolve({ url, delay: Math.round(delay) }), delay);
  });
}

// ═══════════════════════════════════════════════════════════
// MÔ PHỎNG: HPACK Header Compression!
// ═══════════════════════════════════════════════════════════

class HPACKSimulator {
  constructor() {
    // Static table (simplified!)
    this.staticTable = {
      ":method GET": 2,
      ":method POST": 3,
      ":path /": 4,
      ":scheme https": 7,
      "accept-encoding gzip, deflate": 16,
    };
    this.dynamicTable = {}; // Header đã gửi!
    this.nextIndex = 62; // Dynamic bắt đầu từ 62!
  }

  encode(headers) {
    const encoded = [];

    for (const [key, value] of Object.entries(headers)) {
      const entry = `${key} ${value}`;

      // ① Kiểm tra static table!
      if (this.staticTable[entry]) {
        encoded.push({ type: "indexed", index: this.staticTable[entry] });
        // ★ Chỉ 1 byte! Thay vì cả chuỗi dài!
        continue;
      }

      // ② Kiểm tra dynamic table!
      if (this.dynamicTable[entry]) {
        encoded.push({ type: "indexed", index: this.dynamicTable[entry] });
        // ★ Header đã gửi trước đó → chỉ gửi index!
        continue;
      }

      // ③ Header MỚI → gửi đầy đủ + thêm vào dynamic table!
      this.dynamicTable[entry] = this.nextIndex++;
      encoded.push({ type: "literal", key, value });
    }

    return encoded;
  }

  getCompressionRatio(headers) {
    const original = JSON.stringify(headers).length;
    const compressed = JSON.stringify(this.encode(headers)).length;
    return Math.round((1 - compressed / original) * 100) + "%";
  }
}

// ═══════════════════════════════════════════════════════════
// MÔ PHỎNG: QUIC Connection Migration!
// ═══════════════════════════════════════════════════════════

class QUICConnectionSimulator {
  constructor() {
    this.connectionId = this.generateConnectionId();
    this.clientIP = null;
    this.sessionKey = this.generateSessionKey();
  }

  generateConnectionId() {
    // ★ 64-bit Connection ID (mô phỏng!)
    return Math.random().toString(36).substring(2, 18);
  }

  generateSessionKey() {
    return "sk_" + Math.random().toString(36).substring(2, 10);
  }

  connect(clientIP) {
    this.clientIP = clientIP;
    console.log(`Connected! IP: ${clientIP}`);
    console.log(`Connection ID: ${this.connectionId}`);
    console.log(`Session Key: ${this.sessionKey}`);
  }

  // ★ Đổi mạng! (WiFi → 4G!)
  migrateNetwork(newIP) {
    const oldIP = this.clientIP;
    this.clientIP = newIP;

    // TCP: connection MẤT! Phải reconnect! ❌
    // QUIC: Connection ID KHÔNG ĐỔI! ★
    console.log(`\nNetwork migration: ${oldIP} → ${newIP}`);
    console.log(`Connection ID: ${this.connectionId} (KHÔNG ĐỔI! ✅)`);
    console.log(`Session Key: ${this.sessionKey} (KHÔNG ĐỔI! ✅)`);
    console.log(`→ Connection vẫn hoạt động! Không cần reconnect!`);
  }
}
```

---

## §8. Câu Hỏi Phỏng Vấn!

```
  CÂU HỎI:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  ❓ 1: HTTP/2 khác HTTP/1.1 ở những điểm nào?                  │
  │  → Binary framing (nhị phân thay vì text!)                  │
  │  → HPACK header compression (nén 50-90%!)                   │
  │  → Multiplexing (1 connection, nhiều stream song song!)      │
  │  → Server Push (server chủ động gửi resources!)            │
  │  → De facto encrypted (h2 = HTTPS!)                          │
  │                                                              │
  │  ❓ 2: HTTP/2 vẫn còn vấn đề gì?                               │
  │  → TCP HOL blocking (1 packet mất = block tất cả!)         │
  │  → TCP+TLS handshake chậm (3-4 RTT!)                       │
  │  → Multiplexing gây QPS burst & timeout!                     │
  │  → Gốc rễ: TCP nằm trong kernel, không sửa được!          │
  │                                                              │
  │  ❓ 3: HTTP/3 giải quyết vấn đề gì?                            │
  │  → Dùng QUIC (trên UDP) thay TCP! ★                        │
  │  → HOL blocking HOÀN TOÀN giải quyết!                      │
  │  → 0-RTT handshake! (gửi data ngay lập tức!)              │
  │  → Connection Migration (đổi mạng không mất kết nối!)    │
  │  → TLS 1.3 tích hợp sẵn!                                   │
  │  → Pluggable congestion control!                              │
  │                                                              │
  │  ❓ 4: Tại sao QUIC dùng UDP mà không dùng TCP?                 │
  │  → TCP nằm trong kernel OS → không thể cập nhật!          │
  │  → UDP "sạch" → QUIC tự implement reliability!            │
  │  → QUIC ở application layer → dễ update/deploy!           │
  │                                                              │
  │  ❓ 5: Connection Migration hoạt động thế nào?                  │
  │  → TCP: 4-tuple (IP+Port) → đổi mạng = mất connection!   │
  │  → QUIC: 64-bit Connection ID → đổi mạng vẫn giữ! ★    │
  │  → Session key không đổi → mã hóa liên tục!              │
  │                                                              │
  │  ❓ 6: HPACK hoạt động thế nào?                                  │
  │  → Static table (61 entries phổ biến!)                      │
  │  → Dynamic table (header đã gửi → chỉ gửi index!)        │
  │  → Huffman coding (ký tự phổ biến = ít bits!)             │
  │  → Request 2 chỉ gửi KHÁC BIỆT so với Request 1! ★       │
  │                                                              │
  │  ❓ 7: 0-RTT có nhược điểm gì?                                  │
  │  → Không đảm bảo Forward Secrecy!                          │
  │  → Attacker có Session Ticket Key → giải mã được! ❌       │
  │  → Giải pháp: Key hết hạn sau vài giờ!                    │
  │  → Replay Attack có thể xảy ra!                              │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```
