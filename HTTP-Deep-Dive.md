# Frontend System Design: Tìm Hiểu Sâu về HTTP

> Tài liệu học tập toàn diện dành cho frontend engineer chuẩn bị phỏng vấn system design.

---

## Table of Contents

0. [Key Concepts & Glossary](#key-concepts--glossary)
1. [HTTP Fundamentals](#1-http-fundamentals)
2. [HTTP vs HTTPS](#2-http-vs-https)
3. [HTTP Methods](#3-http-methods)
4. [Status Codes](#4-status-codes)
5. [Headers](#5-headers)
6. [Caching](#6-caching)
7. [HTTP Versions](#7-http-versions)
8. [CORS](#8-cors)
9. [Authentication](#9-authentication)
10. [Connection Management](#10-connection-management)
11. [Optimization Patterns](#11-optimization-patterns)
12. [Error Handling](#12-error-handling)
13. [Security](#13-security)
14. [Performance Metrics](#14-performance-metrics)
15. [Interview Cheat Sheet](#15-interview-cheat-sheet)
16. [Tại Sao Một Số Công Ty Yêu Cầu Tất Cả API Đều Dùng POST?](#16-tại-sao-một-số-công-ty-yêu-cầu-tất-cả-api-đều-dùng-post)

---

## Key Concepts & Glossary

> Hiểu rõ các khái niệm cơ bản trước khi đi sâu vào chi tiết.

### Network Fundamentals

| Concept                   | Definition                                                                                 | Example                     |
| ------------------------- | ------------------------------------------------------------------------------------------ | --------------------------- |
| **RTT (Round-Trip Time)** | Thời gian để một packet đi từ client → server → client. Bao gồm thời gian truyền và xử lý. | Ping google.com: RTT = 20ms |
| **Latency**               | Độ trễ - thời gian chờ đợi trước khi data bắt đầu được truyền.                             | Network latency: 50ms       |
| **Bandwidth**             | Lượng data có thể truyền trong 1 đơn vị thời gian.                                         | 100 Mbps connection         |
| **Throughput**            | Lượng data thực tế được truyền (≤ bandwidth).                                              | Actual: 80 Mbps             |

### Protocol Concepts

| Concept         | Definition                                                                                  | Example                                                                   |
| --------------- | ------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------- |
| **Stateless**   | Mỗi request độc lập, server không nhớ request trước đó. Không có "memory" giữa các request. | HTTP là stateless - mỗi request phải gửi đầy đủ thông tin (cookies, auth) |
| **Stateful**    | Server nhớ trạng thái của client qua nhiều request.                                         | WebSocket connection, TCP connection                                      |
| **Idempotent**  | Thực hiện nhiều lần cho kết quả giống như thực hiện 1 lần. An toàn để retry.                | GET, PUT, DELETE là idempotent. POST thì không.                           |
| **Safe Method** | Method không thay đổi state của server (read-only).                                         | GET, HEAD, OPTIONS là safe. POST, PUT, DELETE thì không.                  |

### Connection Concepts

| Concept                                | Definition                                                                                                                 | Why It Matters                                         |
| -------------------------------------- | -------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------ |
| **Head-of-Line Blocking (HOL)**        | Khi 1 request bị block, tất cả request phía sau cũng bị block theo. Giống hàng đợi siêu thị - 1 người chậm làm cả hàng chờ | HTTP/1.1: có HOL. HTTP/2: giảm bớt. HTTP/3: không còn. |
| **Multiplexing**                       | Gửi nhiều request/response đồng thời trên 1 connection duy nhất, không cần chờ lần lượt.                                   | HTTP/2+ support multiplexing                           |
| **Persistent Connection (Keep-Alive)** | Giữ connection mở để tái sử dụng cho nhiều request, thay vì đóng sau mỗi request.                                          | Tránh overhead tạo connection mới                      |
| **Connection Pooling**                 | Duy trì tập hợp connections sẵn sàng để tái sử dụng.                                                                       | Browsers có connection pool                            |

### HTTP/2 & HTTP/3 Concepts

| Concept            | Definition                                                                              | Visual                                |
| ------------------ | --------------------------------------------------------------------------------------- | ------------------------------------- |
| **Stream**         | Kênh truyền 2 chiều độc lập trong 1 connection. Mỗi request/response là 1 stream riêng. | Connection có nhiều streams song song |
| **Frame**          | Đơn vị dữ liệu nhỏ nhất trong HTTP/2. Types: HEADERS, DATA, PRIORITY, RST_STREAM...     | 1 message = nhiều frames              |
| **Message**        | 1 request hoặc 1 response hoàn chỉnh, gồm nhiều frames.                                 | GET request = 1 message               |
| **Binary Framing** | Dữ liệu được encode dạng binary thay vì text. Hiệu quả hơn để parse.                    | HTTP/2+ dùng binary                   |
| **HPACK / QPACK**  | Thuật toán nén headers. HPACK cho HTTP/2, QPACK cho HTTP/3.                             | Giảm 90% header size                  |

### Security Concepts

| Concept                            | Definition                                                                    | Details                    |
| ---------------------------------- | ----------------------------------------------------------------------------- | -------------------------- |
| **TLS (Transport Layer Security)** | Giao thức mã hóa dữ liệu truyền trên network. Phiên bản mới của SSL.          | TLS 1.2, TLS 1.3           |
| **SSL (Secure Sockets Layer)**     | Giao thức mã hóa cũ, đã deprecated. Thường dùng "SSL" để chỉ chung TLS.       | SSL 3.0 → TLS 1.0          |
| **Handshake**                      | Quá trình thiết lập connection và trao đổi keys mã hóa giữa client-server.    | TLS handshake: 1-2 RTT     |
| **Certificate (Chứng chỉ số)**     | File chứa public key của server + thông tin xác thực, do CA cấp.              | example.com.crt            |
| **CA (Certificate Authority)**     | Tổ chức đáng tin cậy cấp certificates.                                        | Let's Encrypt, DigiCert    |
| **Forward Secrecy**                | Dù private key bị lộ trong tương lai, dữ liệu đã mã hóa trước đó vẫn an toàn. | TLS 1.3 có forward secrecy |
| **Man-in-the-Middle (MITM)**       | Attacker ở giữa client-server, có thể đọc/sửa data.                           | HTTPS ngăn chặn MITM       |

### Encryption Concepts

| Concept                   | Definition                                                           | Use Case                       |
| ------------------------- | -------------------------------------------------------------------- | ------------------------------ |
| **Symmetric Encryption**  | Dùng 1 key duy nhất cho cả encrypt và decrypt. Nhanh.                | AES - dùng cho data transfer   |
| **Asymmetric Encryption** | Dùng cặp public key (encrypt) + private key (decrypt). Chậm hơn.     | RSA - dùng cho key exchange    |
| **Public Key**            | Key có thể chia sẻ công khai. Dùng để encrypt hoặc verify signature. | Trong certificate              |
| **Private Key**           | Key phải giữ bí mật. Dùng để decrypt hoặc tạo signature.             | Lưu trên server                |
| **Session Key**           | Key tạm thời, tạo ra trong mỗi connection để encrypt data.           | Kết hợp symmetric + asymmetric |

### Caching Concepts

| Concept        | Definition                                                               | Example Header            |
| -------------- | ------------------------------------------------------------------------ | ------------------------- |
| **Fresh**      | Response vẫn còn hạn sử dụng, có thể dùng trực tiếp từ cache.            | max-age chưa hết          |
| **Stale**      | Response đã hết hạn, cần revalidate với server.                          | max-age đã qua            |
| **Revalidate** | Hỏi server xem cached response còn đúng không (dùng ETag/Last-Modified). | If-None-Match             |
| **Cache Hit**  | Tìm thấy response trong cache và dùng được.                              | Không cần network request |
| **Cache Miss** | Không tìm thấy trong cache, phải request từ server.                      | Full network request      |
| **ETag**       | Unique identifier của 1 version của resource. Như "fingerprint".         | ETag: "abc123"            |

### CORS Concepts

| Concept               | Definition                                                          | Example                         |
| --------------------- | ------------------------------------------------------------------- | ------------------------------- |
| **Origin**            | Protocol + Domain + Port. Định danh nguồn gốc của request.          | https://example.com:443         |
| **Same-Origin**       | 2 URLs có cùng protocol, domain, và port.                           | https://example.com/a và /b     |
| **Cross-Origin**      | 2 URLs khác nhau về protocol, domain, hoặc port.                    | example.com gọi api.example.com |
| **Preflight Request** | Request OPTIONS tự động gửi trước để kiểm tra CORS permissions.     | Với PUT, DELETE, custom headers |
| **Simple Request**    | Request đơn giản không cần preflight (GET/POST với simple headers). | GET với Accept header           |

### Performance Concepts

| Concept                            | Definition                                                        | Typical Values |
| ---------------------------------- | ----------------------------------------------------------------- | -------------- |
| **TTFB (Time to First Byte)**      | Thời gian từ lúc request đến lúc nhận byte đầu tiên của response. | < 200ms tốt    |
| **FCP (First Contentful Paint)**   | Thời gian để hiển thị nội dung đầu tiên (text, image).            | < 1.8s tốt     |
| **LCP (Largest Contentful Paint)** | Thời gian để hiển thị element lớn nhất trong viewport.            | < 2.5s tốt     |
| **DNS Lookup**                     | Phân giải domain name thành IP address.                           | 20-120ms       |
| **TCP Handshake**                  | 3-way handshake để thiết lập TCP connection.                      | 1 RTT          |
| **TLS Handshake**                  | Thiết lập encrypted connection.                                   | 1-2 RTT        |

### Transport Layer Concepts

| Concept         | TCP                                     | UDP                                |
| --------------- | --------------------------------------- | ---------------------------------- |
| **Reliability** | Guaranteed delivery, retransmit nếu mất | Best effort, không retransmit      |
| **Ordering**    | Đảm bảo thứ tự packets                  | Không đảm bảo thứ tự               |
| **Connection**  | Connection-oriented (handshake)         | Connectionless                     |
| **Speed**       | Chậm hơn (do overhead)                  | Nhanh hơn                          |
| **Use case**    | HTTP/1.1, HTTP/2                        | QUIC, HTTP/3, DNS, video streaming |

### QUIC/HTTP/3 Concepts

| Concept                  | Definition                                                                             |
| ------------------------ | -------------------------------------------------------------------------------------- |
| **0-RTT**                | Gửi data ngay lập tức trong lần connection đầu tiên, không cần chờ handshake hoàn tất. |
| **Connection Migration** | Giữ connection khi đổi network (WiFi → 4G) bằng Connection ID thay vì IP:Port.         |
| **Congestion Control**   | Thuật toán điều chỉnh tốc độ gửi data để tránh làm nghẽn network.                      |
| **Flow Control**         | Kiểm soát lượng data gửi để receiver không bị overwhelm.                               |

---

## 1. Kiến Thức Cơ Bản về HTTP

### HTTP là gì?

**HyperText Transfer Protocol** - Giao thức tầng ứng dụng dùng để truyền tải các tài liệu hypermedia theo mô hình **request-response** (yêu cầu-phản hồi).

### Cấu Trúc Message

> **Giải thích sơ đồ**: HTTP messages gồm 2 loại - **Request** (từ client gửi lên) và **Response** (từ server trả về). Mỗi message có 3 phần chính: **Start Line** (dòng đầu), **Headers** (thông tin bổ sung), và **Body** (nội dung - tùy chọn).

```
┌─────────────────────────────────────┐
│         REQUEST                     │
├─────────────────────────────────────┤
│ GET /api/users HTTP/1.1            │  ← Request Line: [Method] [Path] [Version]
│ Host: api.example.com              │  ← Headers: metadata của request
│ Accept: application/json           │     (cho server biết client muốn gì)
│ Authorization: Bearer xxx          │     (gửi thông tin xác thực)
│                                     │
│ { "name": "John" }                 │  ← Body: dữ liệu gửi kèm (JSON, form data...)
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│         RESPONSE                    │
├─────────────────────────────────────┤
│ HTTP/1.1 200 OK                    │  ← Status Line: [Version] [Code] [Message]
│ Content-Type: application/json     │  ← Headers: metadata của response
│ Cache-Control: max-age=3600        │     (cho client biết cách xử lý)
│                                     │
│ { "id": 1, "name": "John" }       │  ← Body: dữ liệu trả về (JSON, HTML, image...)
└─────────────────────────────────────┘
```

**Chi tiết từng phần:**

- **Request Line**: `GET` là method (lấy dữ liệu), `/api/users` là đường dẫn resource, `HTTP/1.1` là version giao thức
- **Headers**: Các cặp key-value cung cấp thông tin bổ sung (kiểu nội dung, xác thực, caching...)
- **Body**: Nội dung thực sự được truyền (GET thường không có body, POST/PUT thường có)

### Đặc Điểm Chính

| Thuộc Tính        | Mô Tả                                                        |
| ----------------- | ------------------------------------------------------------ |
| **Stateless**     | Mỗi request độc lập; server không lưu thông tin session      |
| **Text-based**    | Có thể đọc được (HTTP/1.x); Dạng binary frames trong HTTP/2+ |
| **Extensible**    | Có thể thêm custom headers và methods                        |
| **Client-Server** | Phân tách rõ ràng giữa client và server                      |

---

## 2. HTTP vs HTTPS

### Khái Niệm Cơ Bản

| Giao Thức | Mô Tả                                                                               |
| --------- | ----------------------------------------------------------------------------------- |
| **HTTP**  | HyperText Transfer Protocol - truyền dữ liệu dạng **plaintext** qua TCP port **80** |
| **HTTPS** | HTTP Secure - HTTP với mã hóa **SSL/TLS** qua TCP port **443**                      |

### Sự Khác Biệt Chính

| Khía Cạnh                | HTTP                         | HTTPS                                |
| ------------------------ | ---------------------------- | ------------------------------------ |
| **Port**                 | 80                           | 443                                  |
| **Bảo Mật**              | Plaintext (ai cũng đọc được) | Mã hóa (TLS/SSL)                     |
| **Toàn Vẹn Dữ Liệu**     | Không bảo vệ                 | Chống giả mạo                        |
| **Xác Thực**             | Không xác minh server        | Server được xác minh qua certificate |
| **SEO**                  | Xếp hạng thấp hơn            | Được Google ưu tiên                  |
| **Hiển Thị Trình Duyệt** | Cảnh báo "Not Secure"        | Biểu tượng khóa                      |

### Ưu Điểm & Nhược Điểm của HTTPS

| Ưu Điểm                                   | Nhược Điểm                             |
| ----------------------------------------- | -------------------------------------- |
| ✅ Mã hóa dữ liệu khi truyền              | ❌ Handshake chậm hơn (~50% thời gian) |
| ✅ Toàn vẹn dữ liệu (chống giả mạo)       | ❌ CPU sử dụng cao hơn (10-20%)        |
| ✅ Xác thực server                        | ❌ Chứng chỉ SSL tốn tiền              |
| ✅ Chống tấn công MITM                    | ❌ Caching kém hiệu quả hơn            |
| ✅ Bắt buộc cho HTTP/2 & HTTP/3           | ❌ Phải quản lý certificate            |
| ✅ Lợi ích SEO                            | ❌ Certificate phải gia hạn            |
| ✅ Người dùng tin tưởng (biểu tượng khóa) |                                        |

### Quy Trình TLS/SSL Handshake

```
Client                                                Server
   │                                                     │
   │ ──────────── 1. ClientHello ──────────────────────► │
   │    • Supported TLS versions                         │
   │    • Supported cipher suites                        │
   │    • Client random number                           │
   │                                                     │
   │ ◄─────────── 2. ServerHello ─────────────────────── │
   │    • Chosen TLS version                             │
   │    • Chosen cipher suite                            │
   │    • Server random number                           │
   │                                                     │
   │ ◄─────────── 3. Certificate ─────────────────────── │
   │    • Server's SSL certificate                       │
   │    • Certificate contains public key                │
   │                                                     │
   │ ◄─────────── 4. ServerHelloDone ──────────────────  │
   │                                                     │
   │ ──────────── 5. ClientKeyExchange ────────────────► │
   │    • Pre-master secret                              │
   │    • Encrypted with server's public key             │
   │                                                     │
   │  [Both derive session key from:                     │
   │   client random + server random + pre-master]       │
   │                                                     │
   │ ──────────── 6. ChangeCipherSpec ─────────────────► │
   │ ──────────── 7. Finished (encrypted) ─────────────► │
   │                                                     │
   │ ◄─────────── 8. ChangeCipherSpec ───────────────── │
   │ ◄─────────── 9. Finished (encrypted) ────────────  │
   │                                                     │
   │ ══════════ Encrypted Application Data ═════════════ │
```

### Cải Tiến TLS 1.3 (Handshake Nhanh Hơn)

```
TLS 1.2: 2 round trips (RTT) cho handshake
TLS 1.3: 1 round trip (RTT) cho handshake
         0 round trips khi kết nối lại (0-RTT)

┌────────────────────────────────────────────────────────┐
│ Lợi ích TLS 1.3                                      │
├────────────────────────────────────────────────────────┤
│ • Loại bỏ cipher suites yếu (RC4, DES, MD5)          │
│ • Handshake nhanh hơn (1-RTT thay vì 2-RTT)          │
│ • Kết nối lại 0-RTT cho người dùng quay lại           │
│ • Forward secrecy mặc định                           │
│ • Mã hóa handshake (ẩn SNI)                          │
└────────────────────────────────────────────────────────┘
```

### Các Loại SSL Certificate

| Loại                  | Xác Thực                | Thời Gian | Chi Phí    | Trường Hợp Sử Dụng            |
| --------------------- | ----------------------- | --------- | ---------- | ----------------------------- |
| **DV** (Domain)       | Chỉ quyền sở hữu domain | Vài phút  | Miễn phí   | Blog cá nhân, website nhỏ     |
| **OV** (Organization) | Xác minh công ty        | 1-3 ngày  | Trung bình | Website doanh nghiệp          |
| **EV** (Extended)     | Xác minh mở rộng        | 1-2 tuần  | Cao        | Ngân hàng, thương mại điện tử |

### Chuỗi Tin Cậy Certificate (Chain of Trust)

> **Giải thích sơ đồ**: Khi browser nhận certificate từ website, nó cần kiểm tra xem certificate đó có đáng tin cậy không. Điều này được thực hiện thông qua "chuỗi tin cậy" - một chuỗi các certificate liên kết với nhau bằng chữ ký số.

```
┌──────────────────────────┐
│     Root CA              │  ← Tầng cao nhất: Cài sẵn trong trình duyệt/OS
│   (Tự ký)                │     Ví dụ: DigiCert, Let's Encrypt
└───────────┬──────────────┘
            │ ký (chữ ký số xác nhận)
            ▼
┌──────────────────────────┐
│   Intermediate CA        │  ← Tầng trung gian: Được Root CA cấp
│                          │     Bảo vệ Root CA (nếu bị lộ, chỉ cần thu hồi)
└───────────┬──────────────┘
            │ ký (chữ ký số xác nhận)
            ▼
┌──────────────────────────┐
│   Server Certificate     │  ← Tầng thấp nhất: Certificate của website bạn
│   (example.com)          │     Chứa public key và thông tin domain
└──────────────────────────┘
```

**Quy trình kiểm tra:**

1. Browser nhận Server Certificate từ website
2. Kiểm tra ai ký nó → Tìm ra Intermediate CA
3. Kiểm tra ai ký Intermediate CA → Tìm ra Root CA
4. Root CA có trong danh sách tin cậy? → Nếu có, certificate hợp lệ!

### Checklist Triển Khai HTTPS

```
□ Lấy SSL certificate (Let's Encrypt = miễn phí)
□ Cài certificate lên server
□ Redirect HTTP → HTTPS (301 redirect)
□ Cập nhật các link nội bộ sang HTTPS
□ Thiết lập HSTS header (Strict-Transport-Security)
□ Bật secure cookies (Secure flag)
□ Kiểm tra với SSL Labs (ssllabs.com/ssltest)
```

### Các HTTPS Headers Phổ Biến

```http
# Bắt buộc HTTPS cho các request sau
Strict-Transport-Security: max-age=31536000; includeSubDomains; preload

# Tự động nâng cấp các request không an toàn
Content-Security-Policy: upgrade-insecure-requests

# Báo cáo vấn đề certificate
Expect-CT: max-age=86400, enforce, report-uri="https://example.com/report"
```

### Vấn Đề Mixed Content

```javascript
// ❌ VẤN ĐỀ: Tải resource HTTP trên trang HTTPS
<img src="http://example.com/image.jpg">  // Bị chặn!
<script src="http://example.com/script.js">  // Bị chặn!

// ✅ GIẢI PHÁP: Dùng HTTPS hoặc protocol-relative URLs
<img src="https://example.com/image.jpg">
<img src="//example.com/image.jpg">  // Kế thừa protocol của trang
```

### Điểm Chính Cho Phỏng Vấn

1. **Tại sao cần HTTPS?** → Mã hóa, toàn vẹn dữ liệu, xác thực
2. **TLS hoạt động thế nào?** → Trao đổi key bất đối xứng → Mã hóa đối xứng
3. **Ảnh hưởng hiệu suất?** → Handshake ban đầu chậm hơn, nhưng HTTP/2 yêu cầu nó
4. **Mục đích certificate?** → Chứng minh danh tính server, chứa public key
5. **Forward secrecy là gì?** → Nếu private key bị lộ, các session trước vẫn an toàn

---

## 3. Các HTTP Methods

> **Đọc bảng**: Mỗi method có đặc tính riêng. Hiểu 3 thuộc tính **Idempotent**, **Safe**, **Cacheable** là rất quan trọng khi thiết kế API và xử lý lỗi.

| Method    | Idempotent | Safe | Cacheable | Request Body | Trường Hợp Sử Dụng               |
| --------- | :--------: | :--: | :-------: | :----------: | -------------------------------- |
| `GET`     |     ✅     |  ✅  |    ✅     |      ❌      | Lấy resource                     |
| `POST`    |     ❌     |  ❌  |   ❌\*    |      ✅      | Tạo resource, gửi dữ liệu        |
| `PUT`     |     ✅     |  ❌  |    ❌     |      ✅      | Thay thế toàn bộ resource        |
| `PATCH`   |     ❌     |  ❌  |    ❌     |      ✅      | Cập nhật một phần                |
| `DELETE`  |     ✅     |  ❌  |    ❌     |      ❌      | Xóa resource                     |
| `HEAD`    |     ✅     |  ✅  |    ✅     |      ❌      | Chỉ lấy headers (không body)     |
| `OPTIONS` |     ✅     |  ✅  |    ❌     |      ❌      | CORS preflight, khám phá methods |

### Định Nghĩa Các Thuộc Tính

- **Idempotent** (Bất biến): Gọi 1 lần hay 100 lần đều cho kết quả giống nhau.
  - Ví dụ: `DELETE /users/123` - xóa user 123. Gọi nhiều lần vẫn là xóa user 123 (dù đã xóa rồi)
  - Ý nghĩa: An toàn để retry khi gặp lỗi mạng
- **Safe** (An toàn): Không thay đổi dữ liệu trên server, chỉ đọc.
  - Ví dụ: `GET /users` - chỉ lấy danh sách, không sửa gì
  - Ý nghĩa: Có thể cache và prefetch thoải mái
- **Cacheable** (Có thể cache): Response có thể lưu lại để dùng sau.
  - Ví dụ: `GET /products` - danh sách sản phẩm có thể cache
  - Ý nghĩa: Giảm tải server, tăng tốc độ

### So Sánh PUT vs PATCH vs POST

```javascript
// POST - Tạo resource mới (server tự gán ID)
POST /users
{ "name": "John", "email": "john@example.com" }
// Response: 201 Created, Location: /users/123

// PUT - Thay thế toàn bộ resource (client cung cấp đầy đủ dữ liệu)
PUT /users/123
{ "name": "John Updated", "email": "john@example.com", "age": 30 }

// PATCH - Cập nhật một phần (chỉ các field thay đổi)
PATCH /users/123
{ "name": "John Updated" }
```

---

## 4. Status Codes

> **Hướng dẫn đọc bảng**: Mỗi dải mã có ý nghĩa riêng. Nhớ quy tắc: **2xx = thành công**, **3xx = chuyển hướng**, **4xx = lỗi do client**, **5xx = lỗi do server**.

### Phân Loại

| Dải   | Danh Mục      | Mô Tả                                           | Ví Dụ Phổ Biến            |
| ----- | ------------- | ----------------------------------------------- | ------------------------- |
| `1xx` | Informational | Request đã nhận, đang xử lý                     | 101 Switching Protocols   |
| `2xx` | Success       | Request thành công                              | 200 OK, 201 Created       |
| `3xx` | Redirection   | Cần hành động thêm để hoàn thành request        | 301, 302 Redirect         |
| `4xx` | Client Error  | Request có lỗi cú pháp hoặc không thể thực hiện | 400 Bad, 401 Unauthorized |
| `5xx` | Server Error  | Server không thể thực hiện request hợp lệ       | 500 Internal, 503 Down    |

### Các Status Codes Quan Trọng Cho Frontend

> **Mẹo ghi nhớ**: Tập trung vào các codes thường gặp: **200** (thành công), **400/401/403/404** (lỗi client phổ biến), **500/502/503** (lỗi server). Bảng dưới chỉ rõ frontend cần xử lý thế nào với từng mã.

| Code    | Tên                   | Khi Nào Xảy Ra              | Frontend Cần Làm Gì         |
| ------- | --------------------- | --------------------------- | --------------------------- |
| **200** | OK                    | GET/PUT/PATCH thành công    | Hiển thị dữ liệu            |
| **201** | Created               | POST thành công             | Báo thành công, redirect    |
| **204** | No Content            | DELETE thành công           | Thành công im lặng          |
| **301** | Moved Permanently     | URL đã đổi vĩnh viễn        | Cập nhật bookmarks          |
| **302** | Found                 | Redirect tạm thời           | Theo redirect               |
| **304** | Not Modified          | Cache vẫn còn hợp lệ        | Dùng version đã cache       |
| **400** | Bad Request           | Request sai format          | Hiển lỗi validation         |
| **401** | Unauthorized          | Thiếu/sai authentication    | Redirect đến login          |
| **403** | Forbidden             | Auth đúng nhưng không quyền | Hiển "không có quyền"       |
| **404** | Not Found             | Resource không tồn tại      | Hiển trang 404              |
| **409** | Conflict              | Xung đột trạng thái         | Hiển giải quyết xung đột    |
| **422** | Unprocessable Entity  | Lỗi ngữ nghĩa               | Hiển lỗi validation         |
| **429** | Too Many Requests     | Vượt rate limit             | Chờ và thử lại              |
| **500** | Internal Server Error | Server lỗi                  | Hiển lỗi, cho thử lại       |
| **502** | Bad Gateway           | Lỗi server upstream         | Hiển lỗi, tự động thử lại   |
| **503** | Service Unavailable   | Server quá tải              | Hiển trang bảo trì          |
| **504** | Gateway Timeout       | Timeout upstream            | Thử lại với timeout dài hơn |

### Phân Biệt 401 vs 403

| 401 Unauthorized          | 403 Forbidden                             |
| ------------------------- | ----------------------------------------- |
| Không biết danh tính      | Biết danh tính                            |
| "Bạn là ai?"              | "Tôi biết bạn, nhưng không được truy cập" |
| Sửa: Cung cấp credentials | Sửa: Yêu cầu quyền từ admin               |

---

## 5. Headers

### Request Headers

```http
# Thương Lượng Nội Dung
Accept: application/json                    # Định dạng response mong muốn
Accept-Language: en-US,en;q=0.9            # Ngôn ngữ mong muốn (q=độ ưu tiên)
Accept-Encoding: gzip, deflate, br          # Thuật toán nén hỗ trợ

# Xác Thực
Authorization: Bearer eyJhbGciOiJIUzI1NiIs... # Xác thực bằng token
Cookie: session_id=abc123; user_pref=dark     # Xác thực bằng cookie

# Caching (Conditional Requests)
If-None-Match: "abc123"                     # ETag từ response trước
If-Modified-Since: Wed, 21 Oct 2025 07:28:00 GMT # Kiểm tra timestamp

# CORS
Origin: https://myapp.com                   # Nguồn gốc request cho CORS

# Ngữ Cảnh Request
Content-Type: application/json              # Định dạng body
Content-Length: 348                         # Kích thước body (bytes)
User-Agent: Mozilla/5.0...                  # Định danh client
Referer: https://myapp.com/dashboard        # URL trang trước
```

### Response Headers

```http
# Caching
Cache-Control: public, max-age=31536000     # Caching directives
ETag: "abc123def456"                        # Resource version identifier
Last-Modified: Wed, 21 Oct 2025 07:28:00 GMT # Last change timestamp
Expires: Thu, 01 Dec 2025 16:00:00 GMT      # Absolute expiration (legacy)
Vary: Accept-Encoding, Authorization         # Cache key variations

# Security
Strict-Transport-Security: max-age=31536000; includeSubDomains
Content-Security-Policy: default-src 'self'; script-src 'self'
X-Content-Type-Options: nosniff             # Prevent MIME sniffing
X-Frame-Options: DENY                       # Prevent clickjacking
X-XSS-Protection: 1; mode=block             # XSS filter (legacy)

# CORS
Access-Control-Allow-Origin: https://myapp.com
Access-Control-Allow-Methods: GET, POST, PUT, DELETE
Access-Control-Allow-Headers: Content-Type, Authorization
Access-Control-Allow-Credentials: true
Access-Control-Max-Age: 86400               # Preflight cache duration
Access-Control-Expose-Headers: X-Request-Id # Headers JS can read

# Content
Content-Type: application/json; charset=utf-8
Content-Encoding: gzip                      # Compression used
Content-Length: 1234                        # Body size
Transfer-Encoding: chunked                  # Streaming response

# Rate Limiting
X-RateLimit-Limit: 1000                     # Max requests allowed
X-RateLimit-Remaining: 999                  # Requests remaining
X-RateLimit-Reset: 1640000000               # Reset timestamp
Retry-After: 3600                           # Seconds until retry allowed
```

---

## 6. Caching

> **Tại sao cần caching?** Caching giúp giảm tải server, tăng tốc độ tải trang, và tiết kiệm băng thông. Hiểu các chỉ thị `Cache-Control` là kỹ năng quan trọng cho frontend developer.

### Các Chỉ Thị Cache-Control

> **Đọc bảng**: Mỗi chỉ thị cho browser/CDN biết cách xử lý cache. Tập trung vào: `max-age` (đặt thời hạn), `no-cache` (luôn kiểm tra), `no-store` (không lưu).

| Chỉ Thị                    | Mô Tả                                          | Ví Dụ Sử Dụng                       |
| -------------------------- | ---------------------------------------------- | ----------------------------------- |
| `public`                   | Bất kỳ cache nào đều có thể lưu (CDN, browser) | Tài nguyên tĩnh như JS, CSS, hình   |
| `private`                  | Chỉ browser lưu (dữ liệu riêng người dùng)     | Dữ liệu cá nhân, profile            |
| `max-age=N`                | Còn tươi trong N giây                          | `max-age=3600` = cache 1 giờ        |
| `s-maxage=N`               | Max age cho shared caches (CDN)                | CDN cache lâu hơn browser           |
| `no-cache`                 | Phải hỏi server trước khi dùng bản cache       | API data cần luôn kiểm tra          |
| `no-store`                 | Không bao giờ cache (dữ liệu nhạy cảm)         | Mật khẩu, thông tin ngân hàng       |
| `must-revalidate`          | Phải hỏi server khi hết hạn                    | Ko dùng bản cũ nếu ko kiểm tra được |
| `stale-while-revalidate=N` | Dùng bản cũ trong khi lấy bản mới (N giây)     | UX mượt hơn, ko chờ đợi             |
| `stale-if-error=N`         | Dùng bản cũ nếu server lỗi (N giây)            | Graceful degradation                |
| `immutable`                | Không bao giờ đổi, bỏ qua kiểm tra lại         | Assets có hash trong tên file       |

### Chiến Lược Caching

> **Giải thích code**: Mỗi trường hợp cần chiến lược caching khác nhau. Không có "one size fits all" - chọn dựa trên loại nội dung và yêu cầu business.

```http
# ✅ Assets tĩnh (JS, CSS, hình ảnh VỚI HASH trong tên file)
# Ví dụ: app.abc123.js, style.def456.css
# Tại sao? Nếu nội dung đổi, hash đổi, URL mới, cache mới
Cache-Control: public, max-age=31536000, immutable
#              ↑        ↑                 ↑
#              │        1 năm (s)         Không bao giờ kiểm tra lại
#              CDN và browser đều cache

# ✅ API responses (thay đổi thường xuyên, cần data mới)
Cache-Control: private, max-age=0, must-revalidate
#              ↑        ↑          ↑
#              Chỉ browser  Ko cache  Phải hỏi server

# ✅ Dữ liệu nhạy cảm (mật khẩu, token...)
Cache-Control: private, no-store
#              Ko lưu bất cứ đâu

# ✅ Trang HTML (CDN cache, browser lấy mới)
Cache-Control: public, s-maxage=86400, max-age=0
#                      CDN cache 1 ngày, browser luôn hỏi

# ✅ Progressive loading (UX mượt - hiển cũ, cập nhật ngầm)
Cache-Control: public, max-age=60, stale-while-revalidate=300
#              Dùng cache 60s, sau đó vẫn dùng cũ trong 5 phút
#              nhưng cập nhật ngầm phía sau
```

### Sơ Đồ Luồng Cache

> **Đọc sơ đồ**: Đây là quy trình browser quyết định có dùng cache hay không. Bắt đầu từ "Request arrives" và theo các nhánh Yes/No.

```
Request đến
       │
       ▼
┌─────────────────┐
│  Có trong cache?  │  ← Bước 1: Kiểm tra cache có bản copy ko
└────────┬────────┘
         │
    ┌────┴────┐
    │         │
  Không     Có
    │         │
    ▼         ▼
  Lấy từ   ┌───────────┐
  server   │  Còn tươi?  │  ← Bước 2: max-age hết chưa?
    │      └─────┬─────┘
    │           │
    │      ┌────┴────┐
    │      │         │
    │     Có        Không
    │      │         │
    │      ▼         ▼
    │   Trả về   ┌──────────────┐
    │   cache   │ Có ETag hoặc  │  ← Bước 3: Có cách kiểm tra ko?
    │    ✅     │Last-Modified?│
    │           └──────┬───────┘
    │                  │
    │             ┌────┴────┐
    │             │         │
    │            Có       Không
    │             │         │
    │             ▼         │
    │   Request hỏi        │
    │   server đã đổi chưa?│  ← Bước 4: Gửi If-None-Match/If-Modified-Since
    │         │            │
    │    ┌────┴────┐        │
    │    │         │        │
    │   304       200       │
    │ Ko đổi     Đã đổi     │
    │    │         │        │
    │    ▼         ▼        ▼
    │  Trả về   Cập nhật   Lấy từ
    │  cache   cache      server
    │   ✅       ✅          ✅
    │                       │
    └───────────────────────┘
```

**Tóm tắt:**

- **304 Not Modified**: Server nói "chưa đổi gì, dùng bản cũ đi" → Tiết kiệm băng thông
- **200 OK + data mới**: Server gửi nội dung mới → Cập nhật cache

### So Sánh ETag vs Last-Modified

| Tính Năng          | ETag                        | Last-Modified             |
| ------------------ | --------------------------- | ------------------------- |
| **Độ Chính Xác**   | Cấp byte (khớp chính xác)   | Độ chính xác 1 giây       |
| **Định Dạng**      | Chuỗi bất kỳ (hash/version) | HTTP-date timestamp       |
| **Request header** | `If-None-Match: "abc"`      | `If-Modified-Since: date` |
| **Thích Hợp Cho**  | Nội dung động, APIs         | File tĩnh                 |
| **Tạo Ra Từ**      | Hash nội dung, version ID   | mtime của file system     |

### Triển Khai Caching ở Frontend

```javascript
// Các chiến lược caching với Service Worker
// 1. Cache First (offline-first cho assets)
self.addEventListener("fetch", (event) => {
  event.respondWith(
    caches
      .match(event.request)
      .then((cached) => cached || fetch(event.request)),
  );
});

// 2. Network First (ưu tiên dữ liệu mới)
self.addEventListener("fetch", (event) => {
  event.respondWith(
    fetch(event.request).catch(() => caches.match(event.request)),
  );
});

// 3. Stale-While-Revalidate
self.addEventListener("fetch", (event) => {
  event.respondWith(
    caches.open("dynamic").then((cache) => {
      return cache.match(event.request).then((cached) => {
        const fetchPromise = fetch(event.request).then((response) => {
          cache.put(event.request, response.clone());
          return response;
        });
        return cached || fetchPromise;
      });
    }),
  );
});
```

---

## 7. Các Phiên Bản HTTP

### So Sánh Nhanh

| Tính Năng                 | HTTP/1.1 (1997)  | HTTP/2 (2015)      | HTTP/3 (2022)     |
| ------------------------- | ---------------- | ------------------ | ----------------- |
| **Transport**             | TCP              | TCP                | QUIC (UDP)        |
| **Connections**           | Nhiều (6/origin) | Đơn, multiplexed   | Đơn, multiplexed  |
| **Head-of-line blocking** | Có (TCP + HTTP)  | Một phần (chỉ TCP) | Không             |
| **Định dạng Header**      | Text, không nén  | Binary, HPACK      | Binary, QPACK     |
| **Server Push**           | Không            | Có                 | Có (deprecated)   |
| **Thiết lập connection**  | 1-3 RTT          | 1-3 RTT            | 0-1 RTT           |
| **Yêu cầu TLS**           | Không            | Thực tế là có      | Có (tích hợp sẵn) |

---

### Nhược Điểm HTTP/1.1

#### 1. Head-of-Line Blocking (HOL)

```
Connection: [Req1]──────►[Res1]──────►[Req2]──────►[Res2]──────►[Req3]...
                    ↑
            Nếu Req1 chậm, TẤT CẢ request sau phải chờ!
```

**Vấn đề**: Các request phải hoàn thành tuần tự. Một request chậm sẽ chặn tất cả phía sau.

**Các giải pháp HTTP/1.1** (giờ đã lỗi thời với HTTP/2):

| Giải Pháp                | Mô Tả                               | Nhược Điểm                        |
| ------------------------ | ----------------------------------- | --------------------------------- |
| **Domain Sharding**      | Phân bổ resources qua nhiều domains | Thêm DNS lookup, nhiều connection |
| **Sprite Sheets**        | Gộp nhiều hình thành 1 file         | Phức tạp, lãng phí bandwidth      |
| **CSS/JS Concatenation** | Bundle các file lại                 | Vấn đề cache invalidation         |
| **Inlining**             | Nhúng resources vào HTML/CSS        | Không cache được, file lớn hơn    |

#### 2. Stateless Với Headers Lớn

```http
# Mỗi request lặp lại các headers này (hàng trăm bytes)
User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36...
Cookie: session=abc123; preferences=dark_mode; tracking_id=xyz789...
Accept: text/html,application/xhtml+xml,application/xml;q=0.9,image/webp...
Accept-Language: en-US,en;q=0.9,vi;q=0.8
Accept-Encoding: gzip, deflate, br
```

**Vấn đề**: Headers có thể 500-800 bytes trong khi body chỉ 50 bytes ("big-headed child").

#### 3. Truyền Dạng Plaintext

**Vấn đề**: Không mã hóa, dễ bị tấn công MITM, nghe lén.

#### 4. Không Có Server Push

**Vấn đề**: Server chỉ có thể phản hồi request, không thể chủ động gửi resources.

---

### Giao Thức SPDY (2009-2015)

> **Giải thích sơ đồ**: SPDY là giao thức thử nghiệm của Google, thêm một lớp mới giữa HTTP và TLS. Nó giải quyết được nhiều vấn đề của HTTP/1.x và trở thành nền tảng cho HTTP/2.

```
┌─────────────────────────────────────┐
│           HTTP/1.x                  │  ← Tầng ứng dụng (cù pháp request/response)
├─────────────────────────────────────┤
│           SPDY                      │  ← Lớp mới (multiplexing, nén headers)
├─────────────────────────────────────┤
│           SSL/TLS                   │  ← Tầng bảo mật (mã hóa)
├─────────────────────────────────────┤
│           TCP                       │  ← Tầng vận chuyển (đảm bảo tin cậy)
└─────────────────────────────────────┘
```

**Các tính năng SPDY** (đã được kế thừa bởi HTTP/2):

- Multiplexed streams (luồng đa kênh)
- Ưu tiên hóa request
- Nén HTTP header
- Server push
- Bắt buộc HTTPS

---

### Các Tính Năng HTTP/2

#### 1. Binary Framing

> **Giải thích sơ đồ**: HTTP/1.x gửi text đọc được (GET /page...). HTTP/2 chia thành các **frames** nhỏ dạng binary - máy tính xử lý nhanh hơn nhiều.

```
HTTP/1.x (Text đọc được)          HTTP/2 (Binary)
┌──────────────────┐         ┌──────────────────┐
│ GET /page HTTP/1.1│         │ HEADERS Frame    │ ← Mã hóa binary
│ Host: example.com │   →     │ [Stream ID: 1]   │    (ko đọc được bằng mắt)
│ ...              │         ├──────────────────┤
│                  │         │ DATA Frame       │ ← Nội dung (body)
│ <body>           │         │ [Stream ID: 1]   │    cũng ở dạng binary
└──────────────────┘         └──────────────────┘
```

**Lợi ích**:

- Parse hiệu quả hơn (không cần quét text)
- Message nhỏ hơn
- Ít lỗi hơn

#### 2. Nén Header (HPACK)

```
Request 1:                    Request 2:
┌────────────────────────┐    ┌────────────────────────┐
│ :method: GET           │    │ :method: GET           │ ← Index 62 (đã cache)
│ :path: /index.html     │    │ :path: /about.html     │ ← Chỉ path thay đổi
│ :authority: example.com│    │ :authority: example.com│ ← Index 63 (đã cache)
│ user-agent: Chrome     │    │ user-agent: Chrome     │ ← Index 64 (đã cache)
│ cookie: session=abc    │    │ cookie: session=abc    │ ← Index 65 (đã cache)
└────────────────────────┘    └────────────────────────┘
        800 bytes                    ~50 bytes (nhỏ hơn 90%!)
```

**Cách HPACK hoạt động**:

- **Bảng tĩnh**: 61 headers phổ biến được định nghĩa sẵn
- **Bảng động**: Headers từ các request trước
- **Mã hóa Huffman**: Nén giá trị chuỗi
- **Đánh index**: Tham chiếu headers đã cache bằng số index

#### 3. Multiplexing

> **Giải thích sơ đồ**: HTTP/1.1 cần nhiều connections và xử lý tuần tự. HTTP/2 chỉ dùng 1 connection nhưng gửi xen kẽ nhiều requests cùng lúc (như nhiều người nói chuyện đồng thời trên 1 kênh).

```
HTTP/1.1 (Tuần tự)               HTTP/2 (Multiplexed)

│ Connection 1: [Req1]────[Res1] │
│ Connection 2: [Req2]────[Res2] │ →  Chỉ 1 Connection:
│ Connection 3: [Req3]────[Res3] │    [R1][R2][R3][R1][R2][R3]
│ 6 connections cùng lúc!        │    (frames xen kẽ nhau)
```

```
Đơn TCP Connection
═════════════════════════════════════════════════════►
     │              │              │
     ▼              ▼              ▼
  Stream 1      Stream 3      Stream 5
  [HEADERS]     [HEADERS]     [HEADERS]   ← Các request/response
  [DATA]        [DATA]        [DATA]         độc lập, song song
  [DATA]        [DATA]        [DATA]         trên cùng 1 kết nối
```

```
Single TCP Connection
═══════════════════════════════════════════════════►
     │              │              │
     ▼              ▼              ▼
  Stream 1      Stream 3      Stream 5
  [HEADERS]     [HEADERS]     [HEADERS]
  [DATA]        [DATA]        [DATA]
  [DATA]        [DATA]        [DATA]
```

**Khái niệm chính**:

- **Stream**: Chuỗi frames 2 chiều độc lập
- **Message**: Request hoặc response hoàn chỉnh
- **Frame**: Đơn vị nhỏ nhất (HEADERS, DATA, PRIORITY, v.v.)

**Lợi ích**:

- Chỉ cần 1 TCP connection cho mỗi origin
- Không có HOL blocking ở tầng HTTP
- Các request song song mà không cần thêm connection
- Ưu tiên hóa stream với giá trị 31-bit (0 = cao nhất)

#### 4. Server Push

```
Truyền thống:                    Với Server Push:

Browser          Server         Browser          Server
   │                │              │                │
   │──GET /page────►│              │──GET /page────►│
   │◄──HTML─────────│              │◄──HTML─────────│
   │                │              │◄──PUSH style.css│ ← Chủ động
   │──GET style.css►│              │◄──PUSH app.js──│ ← Chủ động
   │◄──CSS──────────│              │                │
   │──GET app.js───►│              │                │
   │◄──JS───────────│              │                │
```

**Quy tắc**:

- Server có thể push resources trước khi browser yêu cầu
- Client có thể từ chối bằng RST_STREAM frame (nếu đã cache)
- Phải tuân theo same-origin policy
- Resources được push vào browser cache

#### 5. ƪu Tiên Hóa Stream

```javascript
// Priority weight: 1-256 (cao hơn = quan trọng hơn)
// Dependencies: Stream có thể phụ thuộc stream khác

Stream 1 (HTML)        weight: 256
    ├── Stream 3 (CSS) weight: 220  ← Phụ thuộc Stream 1
    └── Stream 5 (JS)  weight: 220  ← Phụ thuộc Stream 1
Stream 7 (Image)       weight: 110  ← Ưu tiên thấp hơn
```

---

### Nhược Điểm HTTP/2

#### 1. Độ Trễ Kết Nối TCP + TLS

```
                  TCP Handshake    TLS Handshake    Truyền Dữ Liệu
                  ─────────────    ─────────────    ─────────────
HTTP/1.1 + TLS:   1.5 RTT    +     2 RTT       =   3.5 RTT trước khi truyền data
HTTP/2 + TLS:     1.5 RTT    +     2 RTT       =   3.5 RTT trước khi truyền data

RTT = Round-Trip Time (thường 50-200ms)
```

#### 2. TCP Head-of-Line Blocking (Vẫn Tồn Tại!)

```
HTTP/2 trên TCP:

Stream 1: [Packet 1][Packet 2][Packet 3]
Stream 2: [Packet 4][Packet 5][Packet 6]
Stream 3: [Packet 7][Packet 8][Packet 9]
                     ↓
          Đơn TCP Connection
                     ↓
         [1][2][3][4][5][6][7][8][9]
                  ↑
         Nếu Packet 3 mất, TCP chặn TẤT CẢ packets cho đến khi truyền lại!
         (Streams 2 & 3 chờ dù packets của chúng đã đến)
```

**Tại sao HTTP/2 có thể TỆ HƠN HTTP/1.1 khi mất gói**:

- HTTP/1.1: 6 connections → chỉ 1 bị ảnh hưởng
- HTTP/2: 1 connection → TẤT CẢ streams bị chặn

#### 3. Multiplexing Có Thể Quá Tải Server

```
HTTP/1.1:              HTTP/2:

[──────────][─────]    [ĐỘT BIẾN 100 requests!]
[──────────][─────]
[──────────][─────]    Đột biến QPS có thể làm server quá tải
```

#### 4. Vấn Đề Timeout

```
Với multiplexing, băng thông bị chia:

Stream 1: ████░░░░░░  (chia sẻ băng thông)
Stream 2: ████░░░░░░  (chia sẻ băng thông)
Stream 3: ████░░░░░░  (chia sẻ băng thông)
...
Stream N: ██░░░░░░░░  (có thể timeout!)

Tất cả streams bắt đầu cùng lúc nhưng có thể timeout cùng lúc.
```

---

### HTTP/3 và Giao Thức QUIC

#### Tại Sao Cần QUIC?

```
Vấn đề HTTP/2:              Giải pháp HTTP/3:

TCP (cấp OS)                 QUIC (cấp ứng dụng)
Khó sửa đổi            →     Cập nhật độc lập
HOL blocking           →     Kiểm soát luồng theo stream
Handshake chậm         →     Kết nối 0-RTT
```

#### Kiến Trúc QUIC

```
┌─────────────────────────────────────┐
│           HTTP/3                    │
├─────────────────────────────────────┤
│           QUIC                      │ ← Độ tin cậy, multiplexing, mã hóa
├─────────────────────────────────────┤
│           UDP                       │ ← Truyền không kết nối
├─────────────────────────────────────┤
│           IP                        │
└─────────────────────────────────────┘
```

#### Các Tính Năng QUIC

**1. Không Có Head-of-Line Blocking**

```
QUIC Streams (Độc lập):

Stream 1: [Pkt 1][Pkt 2][  MẤT  ][Pkt 4] → Chỉ truyền lại Stream 1
Stream 2: [Pkt 5][Pkt 6][Pkt 7][Pkt 8]    → Không bị chặn! ✅
Stream 3: [Pkt 9][Pkt 10][Pkt 11]         → Không bị chặn! ✅
```

**2. Kết Nối Nhanh Hơn (0-RTT)**

```
Kết nối lần đầu:
Client                          Server
   │──────── Initial ──────────►│    1-RTT
   │◄─────── Response ──────────│
   │◄═══════ Data ══════════════│

Kết nối lại (0-RTT):
Client                          Server
   │══════ Data + Initial ═════►│    0-RTT!
   │◄═════════ Data ════════════│
```

**3. Connection Migration**

```
TCP truyền thống:
WiFi Connection: [192.168.1.5:12345] ─────► Server
        ↓ (chuyển sang 4G)
4G Connection:   [10.0.0.1:54321] ─────► Server (KếT NỐI MỚI!)

QUIC:
WiFi Connection: [Connection ID: abc123] ─────► Server
        ↓ (chuyển sang 4G)
4G Connection:   [Connection ID: abc123] ─────► Server (VẪN KếT NỐI CŨ!)
```

**Lợi ích cho mobile**: Chuyển đổi liền mạch giữa WiFi/mạng di động.

**4. Tích Hợp Sẵn TLS 1.3**

```
QUIC:
┌─────────────────────────────────────┐
│ Mã hóa là bắt buộc                   │
│ Chỉ dùng TLS 1.3                    │
│ Handshake cũng được mã hóa           │
│ Forward secrecy mặc định             │
└─────────────────────────────────────┘
```

**5. Cải Thiện Kiểm Soát Tắc Nghẽ**

| Tính Năng    | TCP                        | QUIC                         |
| ------------ | -------------------------- | ---------------------------- |
| Triển khai   | Kernel (khó cập nhật)      | Userspace (dễ cập nhật)      |
| Thuật toán   | Hạn chế                    | Có thể thay đổi (BBR, Cubic) |
| Số gói       | Tái sử dụng sau truyền lại | Tăng đơn điệu                |
| Đo ACK delay | Không đo                   | Đo rõ ràng                   |

#### Định Danh Giao Thức

```
h2  = HTTP/2 qua TLS (mã hóa)
h2c = HTTP/2 cleartext (hiếm)
h3  = HTTP/3 qua QUIC (luôn mã hóa)
```

---

### Tối Ʈu Hóa Frontend Theo Phiên Bản HTTP

| Tối ƪu Hóa         |  HTTP/1.1  |   HTTP/2+    | Ghi Chú                          |
| ------------------ | :--------: | :----------: | -------------------------------- |
| Domain sharding    |   ✅ Cần   |  ❌ Có hại   | H2 dùng đơn connection           |
| Gộp CSS/JS         | ✅ Hữu ích | ⚠️ Tùy chọn  | H2 multiplexing xử lý nhiều file |
| Image sprites      | ✅ Hữu ích | ⚠️ Tùy chọn  | Hình riêng lẻ OK trong H2        |
| Inlining resources | ✅ Hữu ích | ❌ Lãng phí  | Phá vỡ caching trong H2          |
| Code splitting     | ⚠️ Hạn chế | ✅ Thiết yếu | Nhiều file nhỏ OK trong H2       |
| Preload/prefetch   | ✅ Hữu ích | ✅ Thiết yếu | Hints giúp tối ưu hóa thứ tự     |
| Lazy loading       | ✅ Hữu ích | ✅ Thiết yếu | Luôn là best practice            |

---

### Tóm Tắt: Quá Trình Tiến Hóa HTTP

```
HTTP/1.1 (1997)
├── Vấn đề: HOL blocking, headers lớn, không push, không an toàn
└── Giải pháp tạm: Domain sharding, sprites, gộp file

        ↓ Google tạo SPDY (2009)

HTTP/2 (2015)
├── Giải pháp: Binary framing, HPACK, multiplexing, server push
├── Vấn đề còn lại: TCP HOL blocking, độ trễ kết nối
└── Độ chấp nhận: 95%+ các website hàng đầu

        ↓ Google tạo QUIC (2012-2021)

HTTP/3 (2022)
├── Giải pháp: Dựa trên UDP, 0-RTT, connection migration, không HOL
├── Đánh đổi: CPU cao hơn (userspace), vấn đề firewall UDP
└── Độ chấp nhận: Tăng nhanh (Google, Facebook, Cloudflare)
```

### Câu Hỏi Phỏng Vấn: Sự khác biệt giữa HTTP/1.1, HTTP/2 và HTTP/3?

**Câu Trả Lời Mẫu**:

> HTTP/1.1 gặp vấn đề head-of-line blocking, headers lặp lại lớn, và không có multiplexing. HTTP/2 giải quyết những vấn đề này với binary framing, nén HPACK, và multiplexing trên một kết nối TCP duy nhất. Tuy nhiên, bản thân TCP vẫn có HOL blocking ở tầng transport. HTTP/3 sử dụng QUIC trên UDP để loại bỏ điều này, thêm kết nối lại 0-RTT, và hỗ trợ connection migration cho người dùng mobile. Đánh đổi là CPU sử dụng cao hơn vì QUIC chạy ở userspace thay vì kernel.

---

## 8. CORS

> **CORS là gì?** Cross-Origin Resource Sharing - cơ chế cho phép website A gọi API của website B. Thông thường, browser chặn các request cross-origin vì lý do bảo mật. CORS là cách server B "cho phép" website A truy cập.

### Chính Sách Same-Origin

> **Giải thích**: Browser chỉ cho phép JavaScript gọi API cùng "origin". Origin = Protocol + Host + Port. Khác một trong 3 thì là "cross-origin".

Hai URL có cùng origin nếu chia sẻ:

- **Protocol** (http vs https)
- **Host** (domain bao gồm subdomain)
- **Port** (rõ ràng hoặc ngầm định)

```
https://example.com/page    so sánh với:
                                          Protocol  Host          Port
                                          ↓         ↓             ↓
https://example.com/other   ✅ Cùng origin (https + example.com + 443)
http://example.com/page     ❌ Khác protocol (http ≠ https)
https://api.example.com     ❌ Khác subdomain (api.example.com ≠ example.com)
https://example.com:8080    ❌ Khác port (8080 ≠ 443)
https://example.org         ❌ Khác domain (.org ≠ .com)
```

### Các Loại CORS Request

#### Simple Requests (Không Cần Preflight)

> **Khi nào?** Nếu request "simple" thì browser gửi luon, ko cần hỏi trước.

Điều kiện (PHẢI đáp ứng TẤT CẢ):

- Method: `GET`, `HEAD`, hoặc `POST`
- Headers: Chỉ các headers trong CORS-safelisted
- Content-Type: `text/plain`, `multipart/form-data`, hoặc `application/x-www-form-urlencoded`

```
Browser (myapp.com)                           Server (api.example.com)
   │                                            │
   │  1. GET /api/data                          │
   │     Origin: https://myapp.com              │  ← Browser tự thêm Origin header
   │ ─────────────────────────────────────────►│
   │                                            │
   │  2. 200 OK                                 │
   │     Access-Control-Allow-Origin: *         │  ← Server cho phép tất cả
   │◄───────────────────────────────────────── │
   │                                            │
   │  3. Browser cho JS nhận data ✅            │
```

#### Preflighted Requests

> **Khi nào?** Nếu request "phức tạp" (custom headers, JSON body...), browser gửi OPTIONS trước để hỏi server có cho phép ko.

Kích hoạt khi:

- Methods: `PUT`, `DELETE`, `PATCH`, hoặc custom
- Custom headers: `Authorization`, `X-Custom-*`
- Content-Type: `application/json`

```
Browser (myapp.com)                           Server (api.example.com)
   │                                            │
   │  🔵 BƯỚC 1: PREFLIGHT (OPTIONS)               │
   │  OPTIONS /api/data                         │  ← Browser tự gửi trước
   │  Origin: https://myapp.com                 │     để "hỏi phép"
   │  Access-Control-Request-Method: PUT        │  ← "Tôi muốn dùng PUT"
   │  Access-Control-Request-Headers: X-Token   │  ← "và header này"
   │ ─────────────────────────────────────────►│
   │                                            │
   │  204 No Content                            │  ← Server trả lời:
   │  Access-Control-Allow-Origin: *            │     "OK, cho phép"
   │  Access-Control-Allow-Methods: PUT         │     "PUT được"
   │  Access-Control-Allow-Headers: X-Token     │     "X-Token được"
   │  Access-Control-Max-Age: 86400             │     "Cache 24h, ko cần hỏi lại"
   │◄───────────────────────────────────────── │
   │                                            │
   │  🟢 BƯỚC 2: ACTUAL REQUEST                   │
   │  PUT /api/data                             │  ← Giờ mới gửi request thật
   │  Origin: https://myapp.com                 │
   │  X-Token: abc123                           │
   │ ─────────────────────────────────────────►│
   │                                            │
   │  200 OK                                    │
   │  Access-Control-Allow-Origin: *            │
   │◄───────────────────────────────────────── │
```

**Tóm tắt**: Preflight = 2 requests (OPTIONS trước, thật sau). Tốn thêm 1 RTT nhưng đảm bảo bảo mật.

### Tham Chiếu CORS Headers

| Header                             | Hướng         | Mục Đích                  |
| ---------------------------------- | ------------- | ------------------------- |
| `Origin`                           | Request       | Origin đang yêu cầu       |
| `Access-Control-Request-Method`    | Preflight Req | Method dự định            |
| `Access-Control-Request-Headers`   | Preflight Req | Custom headers dự định    |
| `Access-Control-Allow-Origin`      | Response      | Origin(được) cho phép     |
| `Access-Control-Allow-Methods`     | Preflight Res | Methods được phép         |
| `Access-Control-Allow-Headers`     | Preflight Res | Headers được phép         |
| `Access-Control-Allow-Credentials` | Response      | Cho phép cookies/auth     |
| `Access-Control-Max-Age`           | Preflight Res | Thời gian cache preflight |
| `Access-Control-Expose-Headers`    | Response      | Headers JS có thể đọc     |

### Các Vấn Đề CORS Phổ Biến

```javascript
// ❌ VẤN ĐỀ: Wildcard với credentials
Access-Control-Allow-Origin: *
Access-Control-Allow-Credentials: true
// LỖI: Không thể dùng wildcard với credentials

// ✅ GIẢI PHÁP: Origin cụ thể
Access-Control-Allow-Origin: https://myapp.com
Access-Control-Allow-Credentials: true
```

```javascript
// Frontend: Gửi credentials
fetch("https://api.example.com/data", {
  credentials: "include", // Gửi cookies cross-origin
  headers: {
    "Content-Type": "application/json",
  },
});
```

---

## 9. Xác Thực (Authentication)

### Xác Thực Dựa Trên Cookie

```http
# Server thiết lập cookie sau khi đăng nhập
Set-Cookie: session_id=abc123;
  HttpOnly;        # Không truy cập được qua JavaScript (bảo vệ XSS)
  Secure;          # Chỉ gửi qua HTTPS
  SameSite=Strict; # Bảo vệ CSRF
  Path=/;          # Phạm vi cookie
  Max-Age=3600;    # Hết hạn (1 giờ)
  Domain=.example.com; # Bao gồm subdomains

# Browser tự động gửi mỗi request
Cookie: session_id=abc123
```

### Xác Thực Dựa Trên Token (JWT)

```javascript
// Cấu trúc JWT: header.payload.signature
const token =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9." + // Header
  "eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6Ikpv..." + // Payload
  "SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c"; // Signature

// Đính kèm thủ công vào requests
fetch("/api/data", {
  headers: {
    Authorization: `Bearer ${token}`,
  },
});
```

### So Sánh

| Khía Cạnh        | Cookies                  | JWT Tokens                        |
| ---------------- | ------------------------ | --------------------------------- |
| **Lưu trữ**      | Browser quản lý          | App quản lý (memory/localStorage) |
| **Gửi tự động**  | ✅ Có                    | ❌ Thủ công                       |
| **Dễ bị CSRF**   | ✅ Nếu không có SameSite | ❌ Không                          |
| **Dễ bị XSS**    | ❌ Với HttpOnly          | ✅ Trong localStorage             |
| **Cross-origin** | ❌ Hạn chế               | ✅ Dễ dàng                        |
| **Mobile**       | ❌ Hạn chế               | ✅ Hỗ trợ native                  |
| **Stateless**    | ❌ Session server        | ✅ Tự chứa thông tin              |
| **Thu hồi**      | ✅ Dễ (xóa session)      | ❌ Khó (chờ hết hạn)              |
| **Kích thước**   | Giới hạn (4KB)           | Lớn hơn (trong headers)           |

### Giá Trị SameSite Cookie

| Giá Trị  | Điều hướng cross-site | Subrequest cross-site | Phù hợp cho            |
| -------- | :-------------------: | :-------------------: | ---------------------- |
| `Strict` |          ❌           |          ❌           | Bảo mật tối đa         |
| `Lax`    |     ✅ (chỉ GET)      |          ❌           | Mặc định, cân bằng     |
| `None`   |          ✅           |          ✅           | Bên thứ 3 (cần Secure) |

### Best Practices (Thực Hành Tốt Nhất)

```javascript
// Store access token in memory (XSS safe)
let accessToken = null;

// Store refresh token in HttpOnly cookie (CSRF safe with SameSite)
// Server-side: Set-Cookie: refresh_token=xxx; HttpOnly; Secure; SameSite=Strict

// Refresh flow
async function refreshAccessToken() {
  const response = await fetch("/auth/refresh", {
    method: "POST",
    credentials: "include", // Send HttpOnly refresh cookie
  });
  const { accessToken: newToken } = await response.json();
  accessToken = newToken;
  return newToken;
}

// Attach token to requests
async function fetchWithAuth(url, options = {}) {
  const response = await fetch(url, {
    ...options,
    headers: {
      ...options.headers,
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (response.status === 401) {
    await refreshAccessToken();
    return fetchWithAuth(url, options); // Retry
  }

  return response;
}
```

---

## 10. Quản Lý Kết Nối

### Keep-Alive (HTTP/1.1)

```http
# Request
Connection: keep-alive
Keep-Alive: timeout=5, max=100

# Lợi ích:
# - Tái sử dụng TCP connection cho nhiều requests
# - Tránh overhead TCP handshake (1.5 RTT)
# - Tránh slow-start trên các kết nối mới
```

### Gợi Ý Kết Nối (Connection Hints)

```html
<!-- DNS Prefetch: Phân giải DNS sớm -->
<link rel="dns-prefetch" href="https://api.example.com" />

<!-- Preconnect: DNS + TCP + TLS handshake -->
<link rel="preconnect" href="https://api.example.com" />

<!-- Prefetch: Tải resource cho điều hướng tương lai -->
<link rel="prefetch" href="/next-page.js" />

<!-- Preload: Tải resource quan trọng cho trang hiện tại -->
<link rel="preload" href="/critical.css" as="style" />
<link rel="preload" href="/hero.jpg" as="image" />
```

### Chi Phí Kết Nối

```
DNS Lookup:     ~20-120ms
TCP Handshake:  ~1 RTT (Round Trip Time)
TLS Handshake:  ~2-3 RTT (HTTP/1.1), ~1 RTT (HTTP/2), ~0-1 RTT (HTTP/3)
First Byte:     Thay đổi (xử lý server + truyền)

Tổng kết nối HTTPS mới: 3-6 RTT trước khi data chạy
```

---

## 11. Các Mẫu Tối ƪu Hóa

### Gộp Request (Request Batching)

```javascript
// ❌ Nhiều requests
GET /api/user/1
GET /api/user/2
GET /api/user/3

// ✅ Request đã gộp
POST /api/users/batch
{ "ids": [1, 2, 3] }

// GraphQL batching
POST /graphql
{
  "queries": [
    { "query": "{ user(id: 1) { name } }" },
    { "query": "{ user(id: 2) { name } }" }
  ]
}
```

### Debouncing vs Throttling

```javascript
// Debounce: Thực thi sau khi dừng (input tìm kiếm)
function debounce(fn, delay) {
  let timeoutId;
  return (...args) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn(...args), delay);
  };
}

const debouncedSearch = debounce(async (query) => {
  const results = await fetch(`/api/search?q=${query}`);
  displayResults(results);
}, 300);

// Throttle: Thực thi tối đa một lần mỗi khoảng thời gian (scroll)
function throttle(fn, interval) {
  let lastTime = 0;
  return (...args) => {
    const now = Date.now();
    if (now - lastTime >= interval) {
      lastTime = now;
      fn(...args);
    }
  };
}

const throttledScroll = throttle((position) => {
  fetch("/api/log-scroll", { body: JSON.stringify({ position }) });
}, 1000);
```

### Hủy Request (Request Cancellation)

```javascript
// AbortController cho requests có thể hủy
const controller = new AbortController();

fetch("/api/data", { signal: controller.signal })
  .then((response) => response.json())
  .then((data) => console.log(data))
  .catch((err) => {
    if (err.name === "AbortError") {
      console.log("Đã hủy request");
    }
  });

// Hủy khi component unmount hoặc request mới
controller.abort();

// Mẫu React hook
function useAbortableFetch(url) {
  useEffect(() => {
    const controller = new AbortController();

    fetch(url, { signal: controller.signal })
      .then((res) => res.json())
      .then(setData);

    return () => controller.abort(); // Dọn dẹp
  }, [url]);
}
```

### Loại Bỏ Request Trùng Lặp (Deduplication)

```javascript
// Ngăn các request trùng lặp đang chạy
const pendingRequests = new Map();

async function deduplicatedFetch(url) {
  if (pendingRequests.has(url)) {
    return pendingRequests.get(url);
  }

  const promise = fetch(url)
    .then((r) => r.json())
    .finally(() => {
      pendingRequests.delete(url);
    });

  pendingRequests.set(url, promise);
  return promise;
}
```

### Ưu Tiên Hóa Request (Prioritization)

```javascript
// Priority hints (thử nghiệm)
fetch('/api/critical', { priority: 'high' });
fetch('/api/analytics', { priority: 'low' });

// Gợi ý resource trong HTML
<link rel="preload" href="/critical.js" as="script" fetchpriority="high">
<img src="/hero.jpg" fetchpriority="high">
<img src="/footer.jpg" fetchpriority="low" loading="lazy">
```

---

## 12. Xử Lý Lỗi (Error Handling)

### Exponential Backoff với Jitter

```javascript
async function fetchWithRetry(url, options = {}, maxRetries = 3) {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const response = await fetch(url, options);

      if (response.ok) return response;

      // Không retry lỗi client (4xx) ngoại trừ 429
      if (
        response.status >= 400 &&
        response.status < 500 &&
        response.status !== 429
      ) {
        throw new Error(`Lỗi client: ${response.status}`);
      }

      // Kiểm tra header Retry-After
      const retryAfter = response.headers.get("Retry-After");
      if (retryAfter) {
        await sleep(parseInt(retryAfter) * 1000);
        continue;
      }
    } catch (error) {
      if (attempt === maxRetries - 1) throw error;
    }

    // Exponential backoff với jitter
    const baseDelay = Math.pow(2, attempt) * 1000; // 1s, 2s, 4s
    const jitter = Math.random() * 1000; // 0-1s ngẫu nhiên
    await sleep(baseDelay + jitter);
  }
  throw new Error("Đã vượt quá số lần retry tối đa");
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
```

### Mẫu Circuit Breaker

```javascript
class CircuitBreaker {
  constructor(options = {}) {
    this.failureThreshold = options.failureThreshold || 5;
    this.resetTimeout = options.resetTimeout || 30000;
    this.failures = 0;
    this.lastFailure = null;
    this.state = "CLOSED"; // CLOSED, OPEN, HALF_OPEN
  }

  async execute(request) {
    if (this.state === "OPEN") {
      if (Date.now() - this.lastFailure > this.resetTimeout) {
        this.state = "HALF_OPEN";
      } else {
        throw new Error("Circuit breaker is OPEN");
      }
    }

    try {
      const result = await request();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  onSuccess() {
    this.failures = 0;
    this.state = "CLOSED";
  }

  onFailure() {
    this.failures++;
    this.lastFailure = Date.now();
    if (this.failures >= this.failureThreshold) {
      this.state = "OPEN";
    }
  }
}

// Sử dụng
const breaker = new CircuitBreaker({ failureThreshold: 3 });
try {
  const data = await breaker.execute(() => fetch("/api/data"));
} catch (error) {
  // Hiển thị UI dự phòng hoặc dữ liệu đã cache
}
```

### Xử Lý Response Lỗi

```javascript
async function handleApiResponse(response) {
  if (response.ok) {
    return response.json();
  }

  // Parse body lỗi nếu có
  let errorBody;
  try {
    errorBody = await response.json();
  } catch {
    errorBody = { message: response.statusText };
  }

  switch (response.status) {
    case 400:
      throw new ValidationError(errorBody.errors);
    case 401:
      await refreshToken();
      throw new AuthError("Session hết hạn");
    case 403:
      throw new ForbiddenError("Không có quyền truy cập");
    case 404:
      throw new NotFoundError("Không tìm thấy resource");
    case 429:
      const retryAfter = response.headers.get("Retry-After");
      throw new RateLimitError(retryAfter);
    case 500:
    case 502:
    case 503:
    case 504:
      throw new ServerError("Lỗi server, vui lòng thử lại");
    default:
      throw new ApiError(errorBody.message);
  }
}
```

---

## 13. Bảo Mật (Security)

### Headers Bảo Mật Thiết Yếu

```http
# Bắt buộc HTTPS cho tất cả requests tương lai
Strict-Transport-Security: max-age=31536000; includeSubDomains; preload

# Kiểm soát nguồn nội dung được phép
Content-Security-Policy:
  default-src 'self';
  script-src 'self' 'unsafe-inline' https://cdn.example.com;
  style-src 'self' 'unsafe-inline';
  img-src 'self' data: https:;
  connect-src 'self' https://api.example.com;
  frame-ancestors 'none';

# Ngăn MIME type sniffing
X-Content-Type-Options: nosniff

# Ngăn clickjacking
X-Frame-Options: DENY
# hoặc dùng CSP
Content-Security-Policy: frame-ancestors 'none';

# Kiểm soát thông tin referrer
Referrer-Policy: strict-origin-when-cross-origin

# Kiểm soát tính năng trình duyệt
Permissions-Policy:
  geolocation=(),
  microphone=(),
  camera=(),
  payment=(self)
```

### Bảo Vệ CSRF

```javascript
// 1. SameSite cookies (bảo vệ tự động)
Set-Cookie: session=abc; SameSite=Strict

// 2. CSRF tokens
// Server tạo token, nhúng vào form
<input type="hidden" name="_csrf" value="token-from-server">

// Hoặc trong meta tag cho SPA
<meta name="csrf-token" content="token-from-server">

// Frontend gửi cùng requests
fetch('/api/action', {
  method: 'POST',
  headers: {
    'X-CSRF-Token': document.querySelector('meta[name="csrf-token"]').content
  }
});

// 3. Mẫu double-submit cookie
// Đặt token trong cookie VÀ yêu cầu trong header
document.cookie = 'csrf=token123';
fetch('/api/action', {
  headers: { 'X-CSRF-Token': getCookie('csrf') }
});
```

### Ngăn XSS

```javascript
// 1. Escape output
function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

// 2. Dùng textContent thay vì innerHTML
element.textContent = userInput;  // An toàn
element.innerHTML = userInput;    // Nguy hiểm!

// 3. Content Security Policy
Content-Security-Policy: default-src 'self'; script-src 'self'

// 4. HttpOnly cookies cho dữ liệu nhạy cảm
Set-Cookie: session=abc; HttpOnly

// 5. Làm sạch rich text
import DOMPurify from 'dompurify';
element.innerHTML = DOMPurify.sanitize(userHtml);
```

---

## 14. Chỉ Số Hiệu Suất (Performance Metrics)

### Core Web Vitals

| Chỉ Số  | Tên Đầy Đủ                | Mục Tiêu | Tác Động HTTP                 |
| ------- | ------------------------- | -------- | ----------------------------- |
| **LCP** | Largest Contentful Paint  | < 2.5s   | Tối ưu hình, CDN, caching     |
| **INP** | Interaction to Next Paint | < 200ms  | Code splitting, thời gian API |
| **CLS** | Cumulative Layout Shift   | < 0.1    | Kích thước hình, tải font     |

### Các Chỉ Số Quan Trọng Khác

| Chỉ Số   | Mô Tả                  | Chiến Lược Cải Thiện                   |
| -------- | ---------------------- | -------------------------------------- |
| **TTFB** | Time to First Byte     | CDN, edge caching, tối ưu server       |
| **FCP**  | First Contentful Paint | CSS quan trọng, preload, giảm blocking |
| **TTI**  | Time to Interactive    | Code splitting, hoãn JS không cần      |
| **TBT**  | Total Blocking Time    | Chia nhỏ tasks, tối ưu JavaScript      |

### Đo Lường

```javascript
// Navigation Timing API
const timing = performance.getEntriesByType("navigation")[0];
console.log("TTFB:", timing.responseStart - timing.requestStart);
console.log("DOM Load:", timing.domContentLoadedEventEnd - timing.startTime);
console.log("Page Load:", timing.loadEventEnd - timing.startTime);

// Resource Timing API
const resources = performance.getEntriesByType("resource");
resources.forEach((r) => {
  console.log(r.name, "Thời gian:", r.duration);
  console.log("  DNS:", r.domainLookupEnd - r.domainLookupStart);
  console.log("  TCP:", r.connectEnd - r.connectStart);
  console.log("  Request:", r.responseStart - r.requestStart);
  console.log("  Response:", r.responseEnd - r.responseStart);
});

// Thư viện Web Vitals
import { onLCP, onINP, onCLS } from "web-vitals";
onLCP(console.log);
onINP(console.log);
onCLS(console.log);
```

---

## 15. Cheat Sheet Phỏng Vấn

### Tham Chiếu Nhanh

```
HTTP Methods:
  GET     → Đọc (an toàn, idempotent, cacheable)
  POST    → Tạo (không an toàn, không idempotent)
  PUT     → Thay thế (idempotent)
  PATCH   → Cập nhật một phần
  DELETE  → Xóa (idempotent)

Status Codes:
  2xx → Thành công (200 OK, 201 Created, 204 No Content)
  3xx → Chuyển hướng (301 Vĩnh viễn, 302 Tạm thời, 304 Not Modified)
  4xx → Lỗi Client (400 Bad, 401 Unauth, 403 Forbidden, 404 Not Found)
  5xx → Lỗi Server (500 Internal, 502 Bad Gateway, 503 Unavailable)

Caching:
  Cache-Control: max-age=N     → Cache trong N giây
  Cache-Control: no-cache      → Luôn xác thực lại
  Cache-Control: no-store      → Không bao giờ cache
  ETag + If-None-Match         → Xác thực cấp byte
  Last-Modified + If-Modified-Since → Xác thực theo thời gian

CORS:
  Simple requests → Không cần preflight
  Complex requests → OPTIONS preflight trước
  Access-Control-Allow-Origin → Các origin được phép
  Access-Control-Allow-Credentials → Cho phép cookies

HTTP Versions:
  HTTP/1.1 → 6 connections, head-of-line blocking
  HTTP/2   → Multiplexing, nén header, đơn connection
  HTTP/3   → QUIC (UDP), 0-RTT, không TCP blocking

Bảo Mật:
  HTTPS → Mã hóa transport
  HttpOnly → Bảo vệ cookies khỏi XSS
  SameSite → Bảo vệ khỏi CSRF
  CSP → Kiểm soát nguồn nội dung được phép
  HSTS → Bắt buộc HTTPS
```

### Câu Hỏi Phỏng Vấn Phổ Biến

1. **Điều gì xảy ra khi bạn gõ URL vào trình duyệt?**
   - DNS lookup → TCP handshake → TLS handshake → HTTP request → Response → Render

2. **Giải thích sự khác biệt giữa HTTP/1.1, HTTP/2, và HTTP/3**
   - Xem phần HTTP Versions ở trên

3. **Bạn sẽ tối ưu hiệu suất API như thế nào?**
   - Caching, nén, batching, CDN, connection pooling, lazy loading

4. **Giải thích CORS và cách xử lý**
   - Same-origin policy, preflight requests, server headers

5. **Cookie vs JWT cho xác thực?**
   - Cookies: tự động, rủi ro CSRF, stateful
   - JWT: thủ công, rủi ro XSS, stateless

6. **Bạn xử lý requests thất bại như thế nào?**
   - Retry với exponential backoff, circuit breaker, dữ liệu dự phòng

7. **Bạn sẽ sử dụng chiến lược caching nào?**
   - Cache-Control headers, ETags, service workers, CDN

### Các Cân Nhắc Thiết Kế Hệ Thống

```
Cân Bằng Tải (Load Balancing):
  └─ Phân phối requests qua các servers
  └─ Session affinity cho apps stateful

CDN (Content Delivery Network):
  └─ Cache assets tĩnh tại edge
  └─ Giảm độ trễ cho người dùng toàn cầu

Giới Hạn Tốc Độ (Rate Limiting):
  └─ Bảo vệ khỏi lạm dụng
  └─ Dùng status 429 với Retry-After

Nén (Compression):
  └─ gzip/brotli cho nội dung text
  └─ WebP/AVIF cho hình ảnh

Tối ƪu Kết Nối:
  └─ Kết nối Keep-alive
  └─ Preconnect đến origins quan trọng
  └─ HTTP/2 multiplexing
```

---

## 16. Tại Sao Một Số Công Ty Yêu Cầu Tất Cả API Đều Dùng POST?

### Tổng Quan

```
┌─────────────────────────────────────────────────────────────────┐
│  TẠI SAO MỌI API ĐỀU DÙNG POST?                                │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Hiện tượng: Nhiều công ty (đặc biệt nhỏ/startup/outsource)    │
│  quy định TẤT CẢ API phải dùng POST method                     │
│                                                                 │
│  Không phải vì team incompetent!                                │
│  Mà vì: giảm rủi ro + tiết kiệm chi phí quản lý               │
│                                                                 │
│  POST có thể làm MỌI THỨ mà GET làm được                       │
│  + làm thêm nhƯng thứ GET KHÔNG LÀM ĐƯỢC                       │
│                                                                 │
│  Trade-off: mất RESTful semantics                               │
│             nhưng ĐƯỢC consistency + ít bug hơn                 │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Tại Sao Quy Định Này Tồn Tại?

```
KHI NÀO QUY ĐỊNH NÀY HỢP LÝ?

Team chất lượng CAO:
┌─────────────────────────────────────────────┐
│  ✅ Top performers                          │
│  ✅ Team standards tốt                      │
│  ✅ Mọi người above average                 │
│  ✅ Có error correction mechanism            │
│  → KHÔNG CẦN quy định này                   │
│  → Dùng RESTful best practices bình thường  │
└─────────────────────────────────────────────┘

Team chất lượng KHÔNG ĐỀU:
┌─────────────────────────────────────────────┐
│  ⚠️ Skill levels khác nhau nhiều            │
│  ⚠️ Startup/small teams, không có standards │
│  ⚠️ Code quality phụ thuộc individual dev   │
│  ⚠️ Bắt tay vào làm ngay, không quy trình  │
│  → CẦN quy định POST-only                   │
│  → 1 rule giảm NHIỀU vấn đề                 │
└─────────────────────────────────────────────┘

PROBLEMS mà POST-only GIẢI QUYẾT:

① URL LENGTH LIMIT:
   GET gửi data qua URL → bị giới hạn độ dài
   • IE: 2,083 ký tự
   • Chrome: ~8,000 ký tự
   • Nginx default: 4,096 bytes
   POST gửi data trong body → KHÔNG giới hạn
   → Dev mới không cần lo "URL quá dài"

② CACHE MISUSE:
   GET requests mặc định ĐƯỢC cache
   → Dev quên set Cache-Control: no-cache
   → User thấy data CŨ, report bug
   → Debug mãi không ra vì "code đúng mà!"

   POST requests mặc định KHÔNG cache
   → Không bao giờ gặp vấn đề cache stale data

③ SENSITIVE DATA IN URL:
   GET /api/login?username=admin&password=123456
   → Password HIỆN trong:
     • Browser history
     • Server logs
     • Proxy logs
     • Bookmark
     • Referer header (gửi sang trang khác!)

   POST /api/login  body: {username, password}
   → Password KHÔNG trong URL → an toàn hơn

④ ENCODING ISSUES:
   GET URL chỉ support ASCII
   → Tiếng Việt, tiếng Trung, emoji phải encode
   → "Trần Văn A" → "Tr%E1%BA%A7n%20V%C4%83n%20A"
   → Dễ bug encoding

   POST body support UTF-8 thoải mái
   → Gửi gì cũng được, không cần encode URL

⑤ CONSISTENCY:
   Thay vì dev phải quyết định:
   "API này dùng GET hay POST?"
   "Cái này idempotent không?"
   "Truyền param qua URL hay body?"
   → Câu trả lời luôn là: POST + body
   → Giảm decision fatigue, giảm inconsistency

REAL STORY:
┌──────────────────────────────────────────────┐
│  Dev mới vào công ty → thấy rule POST-only   │
│  → "Công ty gì mà tệ vậy!"                  │
│  → Về group chat kể joke                     │
│  → Nhưng thực ra... CÓ LÝ DO CẢ             │
│                                               │
│  "凡事皆有因" — Mọi thứ đều có lý do         │
└──────────────────────────────────────────────┘

AI NỮA CŨNG DÙNG POST-ONLY?
• Outsourcing companies
• Companies cung cấp third-party interfaces
• Internal tools / back-office systems
→ Tất cả chỉ vì: TIỆN, ĐƠN GIẢN, ÍT BUG
```

### Best Practices: HTTP Methods Đúng Cách

```
════════════════════════════════════════════════════════════════════
1. GET — Lấy dữ liệu (Read-Only)
════════════════════════════════════════════════════════════════════

Dùng cho: Retrieve data từ server
Đặc tính: SAFE + IDEMPOTENT
→ Không thay đổi state trên server
→ Gọi bao nhiêu lần cũng cho kết quả GIỐNG NHAU
→ An toàn để retry khi network fail

Ví dụ:
  GET /api/users          → Lấy danh sách users
  GET /api/users/123      → Lấy user có id 123
  GET /api/products?q=abc → Tìm kiếm products

⚠️ Lưu ý:
  • KHÔNG dùng GET để thay đổi data
  • Data gửi qua URL (query string) → visible
  • Response có thể được cache tự động
  • Có giới hạn URL length

════════════════════════════════════════════════════════════════════
2. POST — Tạo mới / Gửi dữ liệu
════════════════════════════════════════════════════════════════════

Dùng cho: Tạo resource MỚI hoặc gửi dữ liệu
Đặc tính: KHÔNG SAFE + KHÔNG IDEMPOTENT
→ Thay đổi state trên server
→ Gọi 2 lần = tạo 2 resources (trùng nội dung, khác ID!)

Ví dụ:
  POST /api/users
  Body: { "name": "John", "email": "john@test.com" }
  → Tạo user mới, server gán ID

  POST /api/orders
  Body: { "product_id": 1, "quantity": 2 }
  → Tạo đơn hàng mới

⚠️ Lưu ý:
  • 2 identical POST = 2 resources → cần idempotency key
  • Response KHÔNG được cache mặc định
  • Data gửi trong body → không visible trong URL

════════════════════════════════════════════════════════════════════
3. PUT — Thay thế toàn bộ resource
════════════════════════════════════════════════════════════════════

Dùng cho: Update TOÀN BỘ resource (replace)
Đặc tính: KHÔNG SAFE + IDEMPOTENT
→ Gọi 1 lần hay 100 lần đều cho kết quả giống nhau
→ Phải gửi ĐẦY ĐỦ tất cả fields

Ví dụ:
  PUT /api/users/123
  Body: { "name": "John", "email": "new@test.com", "age": 30 }
  → REPLACE toàn bộ user 123

⚠️ Khác POST:
  • PUT idempotent → retry an toàn
  • PUT thay thế, POST tạo mới
  • PUT cần FULL resource, POST chỉ cần partial

════════════════════════════════════════════════════════════════════
4. DELETE — Xóa resource
════════════════════════════════════════════════════════════════════

Dùng cho: Xóa resource được chỉ định
Đặc tính: KHÔNG SAFE + IDEMPOTENT
→ Delete user/123: lần 1 → xóa, lần 2 → 404 (đã xóa rồi)
→ Kết quả cuối cùng GIỐNG nhau: user/123 không tồn tại

Ví dụ:
  DELETE /api/users/123
  → Xóa user có id 123

  DELETE /api/orders/456
  → Xóa đơn hàng 456
```

### So Sánh Tổng Hợp HTTP Methods

```
┌──────────────┬──────────┬──────────┬──────────┬──────────┐
│              │   GET    │   POST   │   PUT    │  DELETE  │
├──────────────┼──────────┼──────────┼──────────┼──────────┤
│ Request có   │          │          │          │          │
│ Body không?  │    ❌    │    ✅    │    ✅    │   có thể  │
├──────────────┼──────────┼──────────┼──────────┼──────────┤
│ Response có  │          │          │          │          │
│ Body không?  │    ✅    │    ✅    │    ❌    │   có thể  │
├──────────────┼──────────┼──────────┼──────────┼──────────┤
│ Safe?        │    ✅    │    ❌    │    ❌    │    ❌    │
│ (Read-only)  │          │          │          │          │
├──────────────┼──────────┼──────────┼──────────┼──────────┤
│ Idempotent?  │    ✅    │    ❌    │    ✅    │    ✅    │
│ (Retry safe) │          │          │          │          │
├──────────────┼──────────┼──────────┼──────────┼──────────┤
│ Cacheable?   │    ✅    │    ❌    │    ❌    │    ❌    │
├──────────────┼──────────┼──────────┼──────────┼──────────┤
│ HTML Form    │    ✅    │    ✅    │    ❌    │    ❌    │
│ support?     │          │          │          │          │
└──────────────┴──────────┴──────────┴──────────┴──────────┘

GIẢI THÍCH:
• Safe (An toàn): KHÔNG thay đổi state server → chỉ ĐỌC
• Idempotent (Bất biến): GỌI NHIỀU LẦN = GỌI 1 LẦN
  → An toàn để retry khi network fail
• Cacheable: Browser/CDN có thể lưu response để dùng lại
• HTML Form: <form> chỉ hỗ trợ GET và POST
  → PUT/DELETE phải dùng JavaScript (fetch/axios)
```

### POST-Only vs RESTful: Khi Nào Chọn Gì?

```
POST-ONLY API:
┌─────────────────────────────────────────────────┐
│  ✅ Ưu điểm:                                    │
│  • Đơn giản, consistent, dễ quản lý             │
│  • Không lo URL length limit                     │
│  • Không lo cache stale data                     │
│  • Sensitive data không leak qua URL             │
│  • Dev mới onboard nhanh hơn                     │
│  • Giảm decision fatigue                         │
│                                                   │
│  ❌ Nhược điểm:                                   │
│  • Mất RESTful semantics                         │
│  • Không tận dụng được HTTP caching              │
│  • Mất idempotency guarantees (GET/PUT/DELETE)   │
│  • API khó hiểu cho external consumers           │
│  • Không follow web standards                     │
│  • Browser prefetch không hoạt động (cần GET)    │
└─────────────────────────────────────────────────┘

RESTful API:
┌─────────────────────────────────────────────────┐
│  ✅ Ưu điểm:                                    │
│  • Theo đúng chuẩn HTTP semantics                │
│  • Tận dụng tối đa HTTP features (cache, retry)  │
│  • API self-documenting (GET = đọc, POST = tạo)  │
│  • Idempotent methods → retry an toàn            │
│  • Caching tự nhiên cho GET requests             │
│  • Industry standard, dễ integrate               │
│                                                   │
│  ❌ Nhược điểm:                                   │
│  • Dev phải hiểu HTTP methods + semantics         │
│  • Cần team standards + code review              │
│  • URL length limit cho GET                       │
│  • Cache có thể gây stale data nếu không cẩn thận│
└─────────────────────────────────────────────────┘

KHI NÀO CHỌN GÌ?
┌────────────────────────┬──────────────────────────┐
│  Chọn POST-ONLY khi:   │  Chọn RESTful khi:        │
├────────────────────────┼──────────────────────────┤
│  • Team nhỏ, skill đều │  • Team có standards tốt  │
│  • Startup, cần ship   │  • Public API / third-    │
│    nhanh               │    party integration      │
│  • Internal tools      │  • Cần performance (cache)│
│  • Outsourcing project │  • Long-term maintenance  │
│  • Không có code review│  • SEO-critical apps      │
│  • Third-party API     │  • Microservices arch     │
│    providers            │  • Mobile apps (offline)  │
└────────────────────────┴──────────────────────────┘
```

### Tổng Hợp: POST-Only APIs

```
┌─────────────────────────────────────────────────────────────────┐
│  POST-ONLY APIs — SUMMARY                                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Tồn tại vì: giảm rủi ro + tiết kiệm chi phí quản lý          │
│  POST làm được MỌI THỨ GET/PUT/DELETE làm được                  │
│                                                                 │
│  Giải quyết: URL length, cache misuse, sensitive data in URL,   │
│              encoding issues, inconsistency                     │
│                                                                 │
│  Best practice: RESTful (GET/POST/PUT/DELETE đúng semantics)    │
│  Thực tế: POST-only rất phổ biến trong small/startup teams      │
│                                                                 │
│  "凡事皆有因" — Mọi thứ đều có lý do                            │
│  Đừng vội judge, hãy hiểu context trước                        │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Quick Reference

```
POST-ONLY API:
  Tại sao? → Giảm rủi ro cho team chưa mature
  Khi nào? → Small team, startup, outsourcing, internal tools
  Vấn đề giải quyết:
    ① URL length limit (GET bị giới hạn)
    ② Cache misuse (GET auto-cache → stale data)
    ③ Sensitive data in URL (GET → visible)
    ④ Encoding issues (GET → ASCII only)
    ⑤ Inconsistency (mỗi dev chọn khác nhau)

HTTP METHODS:
  GET    → Read-only, safe, idempotent, cacheable
  POST   → Create, not safe, not idempotent, not cacheable
  PUT    → Replace, not safe, idempotent, not cacheable
  DELETE → Remove, not safe, idempotent, not cacheable

  Safe = không đổi server state
  Idempotent = gọi N lần = gọi 1 lần → retry an toàn
  Cacheable = browser/CDN lưu response

COMPARE:
  POST-only: simple + consistent + less bugs
  RESTful: semantic + cacheable + industry standard
  → Chọn theo CONTEXT, không chọn theo "đúng/sai"
```

### Câu Hỏi Phỏng Vấn: POST-Only APIs

```
Q1: Tại sao một số công ty quy định tất cả API đều dùng POST?
A: Vì giảm rủi ro: không lo URL length limit, cache misuse,
   sensitive data leak, encoding issues. 1 rule giảm nhiều
   vấn đề cho team có skill levels không đều.

Q2: POST có thể thay thế hoàn toàn GET không?
A: Về chức năng: CÓ — POST làm được mọi thứ GET làm.
   Về semantics: KHÔNG — mất cacheable, mất idempotent,
   mất safe, browser không prefetch được.

Q3: GET và POST khác nhau cơ bản ở đâu?
A: GET: read-only, safe, idempotent, cacheable, data qua URL.
   POST: write, not safe, not idempotent, not cacheable, data qua body.

Q4: Tại sao GET idempotent nhưng POST thì không?
A: GET /users → luôn trả danh sách users (cùng kết quả).
   POST /users → mỗi lần tạo 1 user MỚI (khác ID).
   → 2 lần POST = 2 resources, 100 lần GET = 1 kết quả.

Q5: Caching có gì nguy hiểm với GET?
A: GET auto-cached → Dev quên set no-cache → user thấy data cũ.
   Đặc biệt nguy hiểm khi GET response thay đổi thường xuyên
   (dashboard data, realtime stats, user balance...).

Q6: Tại sao HTML form chỉ hỗ trợ GET và POST?
A: Lịch sử: HTML form ra đời trước REST concept.
   GET: gửi data qua URL (search form).
   POST: gửi data qua body (login form).
   PUT/DELETE: phải dùng JavaScript (fetch/axios/XMLHttpRequest).
```

---

## Checklist Học Tập

- [ ] Hiểu cấu trúc HTTP message (requests/responses)
- [ ] Biết tất cả HTTP methods phổ biến và thuộc tính của chúng
- [ ] Thuộc các status codes quan trọng và khi nào sử dụng
- [ ] Thành thạo caching headers (Cache-Control, ETag, Last-Modified)
- [ ] Hiểu luồng CORS (simple vs preflight requests)
- [ ] So sánh HTTP/1.1 vs HTTP/2 vs HTTP/3
- [ ] Biết đánh đổi giữa xác thực cookie vs token
- [ ] Hiểu các security headers và mục đích của chúng
- [ ] Thực hành chiến lược retry (exponential backoff, circuit breaker)
- [ ] Biết Core Web Vitals và HTTP ảnh hưởng đến chúng như thế nào
- [ ] Hiểu tại sao POST-only API tồn tại và khi nào nên/không nên dùng
- [ ] Phân biệt Safe, Idempotent, Cacheable cho từng HTTP method
- [ ] So sánh POST-only vs RESTful API và trade-offs

---

_Cập nhật lần cuối: Tháng 2, 2026_
