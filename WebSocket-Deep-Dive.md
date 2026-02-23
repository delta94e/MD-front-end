# WebSocket — Deep Dive!

> **Chủ đề**: WebSocket Protocol → Handshake → Full-Duplex → Heartbeat → Reconnect
> **Ngôn ngữ**: Tiếng Việt — giải thích cực kỳ chi tiết!
> **Phương châm**: Tự viết lại bằng tay — KHÔNG dùng thư viện!
> **Nguồn**: "A Comprehensive Guide to WebSocket Principles" — Juejin

---

## Mục Lục

1. [§1. Tổng Quan — WebSocket Là Gì?](#1)
2. [§2. Tại Sao Cần WebSocket? HTTP Không Đủ!](#2)
3. [§3. WebSocket vs HTTP — So Sánh Chi Tiết!](#3)
4. [§4. WebSocket Handshake — HTTP Upgrade!](#4)
5. [§5. Sec-WebSocket-Key — Xác Thực!](#5)
6. [§6. WebSocket Data Frame — Giao Tiếp!](#6)
7. [§7. Heartbeat — Nhịp Tim Giữ Kết Nối!](#7)
8. [§8. Reconnect — Tự Động Kết Nối Lại!](#8)
9. [§9. WebSocket API — Browser!](#9)
10. [§10. Ứng Dụng Thực Tế + Khi Nào KHÔNG Dùng!](#10)
11. [§11. Sơ Đồ Tự Vẽ](#11)
12. [§12. Tự Viết — WebSocketEngine](#12)
13. [§13. Câu Hỏi Luyện Tập](#13)

---

## §1. Tổng Quan — WebSocket Là Gì?

```
  WEBSOCKET:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  ĐỊNH NGHĨA:                                                  │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ WebSocket = protocol FULL-DUPLEX trên 1 TCP!       │    │
  │  │ → Server PUSH data chủ động đến client!           │    │
  │  │ → Client cũng GỬI data chủ động đến server!      │    │
  │  │ → 2 CHIỀU, BÌNH ĐẲNG! Song song!                 │    │
  │  │ → Chỉ cần 1 HANDSHAKE → kết nối VĨNH VIỄN!     │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  PROTOCOL STACK:                                               │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ ┌─────────────┐  ┌─────────────┐                    │    │
  │  │ │    HTTP      │  │  WebSocket  │  ← Application    │    │
  │  │ └──────┬───────┘  └──────┬──────┘    Layer!        │    │
  │  │        │                 │                           │    │
  │  │        └────────┬────────┘                           │    │
  │  │  ┌──────────────┴──────────────┐                    │    │
  │  │  │           TCP               │  ← Transport!     │    │
  │  │  └──────────────┬──────────────┘                    │    │
  │  │  ┌──────────────┴──────────────┐                    │    │
  │  │  │            IP               │  ← Network!       │    │
  │  │  └─────────────────────────────┘                    │    │
  │  │                                                      │    │
  │  │ → HTTP và WebSocket ĐỀU trên TCP!                 │    │
  │  │ → WebSocket handshake DÙNG HTTP!                    │    │
  │  │ → Sau handshake → PURE WebSocket!                  │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  ĐẶC ĐIỂM:                                                    │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ ① Dựa trên TCP — tin cậy!                         │    │
  │  │ ② Tương thích HTTP — port 80/443, qua proxy!      │    │
  │  │ ③ Data nhẹ — overhead thấp, hiệu suất cao!       │    │
  │  │ ④ Text hoặc Binary — cả 2!                        │    │
  │  │ ⑤ KHÔNG same-origin — kết nối bất kỳ server!     │    │
  │  │ ⑥ Protocol: ws:// hoặc wss:// (encrypted!)       │    │
  │  │ ⑦ RFC 6455 standard (2011!)                         │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```

---

## §2. Tại Sao Cần WebSocket? HTTP Không Đủ!

```
  VẤN ĐỀ CỦA HTTP:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  HTTP = MỘT CHIỀU!                                           │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ HTTP Problems:                                       │    │
  │  │ • One-way: CHỈ client hỏi, server trả lời!        │    │
  │  │ • Request/Response: luôn luôn 1 hỏi = 1 đáp!      │    │
  │  │ • Stateless: mỗi request ĐỘC LẬP!                │    │
  │  │ • Half-Duplex: chỉ 1 chiều tại 1 thời điểm!      │    │
  │  │                                                      │    │
  │  │ → Server KHÔNG THỂ chủ động push data!            │    │
  │  │ → Client muốn biết → phải HỎI liên tục!          │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  VÍ DỤ: CHAT ROOM!                                           │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ HTTP Polling:                                        │    │
  │  │  Client          Server                              │    │
  │  │    │─ Có tin mới?──→│                                │    │
  │  │    │←── Chưa! ─────│                                │    │
  │  │    │─ Có tin mới?──→│   ← Hỏi đi hỏi lại!       │    │
  │  │    │←── Chưa! ─────│   ← Tốn bandwidth!          │    │
  │  │    │─ Có tin mới?──→│   ← Tốn CPU!               │    │
  │  │    │←── CÓ! ───────│   ← Cuối cùng!             │    │
  │  │                                                      │    │
  │  │ → LÃNG PHÍ! Mỗi request có header ~800 bytes!    │    │
  │  │ → Server giữ hàng ngàn connections!                │    │
  │  │ → Delay: phải đợi đến lần poll tiếp!             │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  GIẢI PHÁP TRƯỚC WebSocket:                                   │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ ① Short Polling: hỏi mỗi 1-3s → tốn tài nguyên! │    │
  │  │ ② Long Polling: giữ request mở đến khi có data!  │    │
  │  │   → Tốt hơn nhưng VẪN giữ connection!            │    │
  │  │ ③ SSE (Server-Sent Events): server push 1 chiều!  │    │
  │  │   → Chỉ server → client! KHÔNG 2 chiều!          │    │
  │  │                                                      │    │
  │  │ → TẤT CẢ đều "hack" HTTP!                        │    │
  │  │ → WebSocket = GIẢI PHÁP ĐÚNG ĐẮN! ✅             │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  WEBSOCKET GIẢI QUYẾT:                                        │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │  Client          Server                              │    │
  │  │    │── Handshake ──→│   ← 1 LẦN!                  │    │
  │  │    │←─ Accepted! ──│                                │    │
  │  │    │                │                                │    │
  │  │    │←── Tin nhắn! ─│   ← Server PUSH!             │    │
  │  │    │── Tin trả lời→│   ← Client SEND!             │    │
  │  │    │←── Update! ───│   ← Bất kỳ lúc nào!         │    │
  │  │    │── Data ───────→│   ← 2 CHIỀU!                │    │
  │  │    │                │                                │    │
  │  │ → 1 connection, LUÔN MỞ!                           │    │
  │  │ → Header nhỏ (~2 bytes!)                            │    │
  │  │ → Real-time! Không delay!                           │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```

---

## §3. WebSocket vs HTTP — So Sánh!

```
  SO SÁNH:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  ┌──────────────────┬────────────────┬────────────────┐     │
  │  │                  │ HTTP           │ WebSocket      │     │
  │  ├──────────────────┼────────────────┼────────────────┤     │
  │  │ Giao tiếp       │ 1 chiều        │ 2 chiều ★     │     │
  │  │                  │ (request →     │ (full-duplex!) │     │
  │  │                  │  response)     │                │     │
  │  ├──────────────────┼────────────────┼────────────────┤     │
  │  │ Kết nối          │ Ngắn          │ Dài (persist!) │     │
  │  │                  │ (mỗi req mới) │ (1 handshake!) │     │
  │  ├──────────────────┼────────────────┼────────────────┤     │
  │  │ Server Push      │ ❌ Không!     │ ✅ Có!        │     │
  │  ├──────────────────┼────────────────┼────────────────┤     │
  │  │ Header overhead  │ ~800 bytes/req │ ~2 bytes/msg ★│     │
  │  ├──────────────────┼────────────────┼────────────────┤     │
  │  │ Protocol         │ http:// https: │ ws:// wss://   │     │
  │  ├──────────────────┼────────────────┼────────────────┤     │
  │  │ Port             │ 80 / 443       │ 80 / 443       │     │
  │  ├──────────────────┼────────────────┼────────────────┤     │
  │  │ Transport        │ TCP            │ TCP            │     │
  │  ├──────────────────┼────────────────┼────────────────┤     │
  │  │ Stateless?       │ ✅ Có!        │ ❌ Stateful!  │     │
  │  ├──────────────────┼────────────────┼────────────────┤     │
  │  │ Same-origin?     │ ✅ Bị giới hạn│ ❌ Không!     │     │
  │  ├──────────────────┼────────────────┼────────────────┤     │
  │  │ Use case         │ REST API,      │ Chat, game,   │     │
  │  │                  │ page load      │ real-time!    │     │
  │  └──────────────────┴────────────────┴────────────────┘     │
  │                                                              │
  │  GIỐNG NHAU:                                                   │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ → CẢ 2 đều dựa trên TCP!                          │    │
  │  │ → CẢ 2 đều application layer protocol!             │    │
  │  │ → CẢ 2 đều port 80/443!                           │    │
  │  │ → WebSocket handshake DÙNG HTTP!                    │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  CHÚ Ý:                                                       │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ → HTTP/2 có Server Push nhưng CHỈ static resources!│    │
  │  │ → WebSocket push BẤT KỲ data! ★                  │    │
  │  │ → HTTP/2 KHÔNG thay thế WebSocket!                  │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```

---

## §4. WebSocket Handshake — HTTP Upgrade!

```
  WEBSOCKET HANDSHAKE:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  QUY TRÌNH:                                                    │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ ① Client gửi HTTP request ĐẶC BIỆT!              │    │
  │  │ ② Server trả về HTTP 101 Switching Protocols!      │    │
  │  │ ③ Upgrade TCP connection → WebSocket!              │    │
  │  │ ④ Full-duplex communication bắt đầu!              │    │
  │  │                                                      │    │
  │  │ ★ Handshake = HTTP! Sau handshake = WebSocket!     │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  CLIENT REQUEST:                                               │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ GET /chat HTTP/1.1                                   │    │
  │  │ Host: server.example.com                             │    │
  │  │ Upgrade: websocket          ← ★ UPGRADE!          │    │
  │  │ Connection: Upgrade         ← ★ UPGRADE!          │    │
  │  │ Sec-WebSocket-Key: x3JJHMbDL1EzLkh9GBhXDw==       │    │
  │  │ Sec-WebSocket-Protocol: chat, superchat             │    │
  │  │ Sec-WebSocket-Version: 13                           │    │
  │  │ Origin: http://example.com                           │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  GIẢI THÍCH TỪNG HEADER:                                      │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ ① Upgrade: websocket                                │    │
  │  │   → "Tôi muốn NÂNG CẤP lên WebSocket!"           │    │
  │  │   → Không phải HTTP bình thường!                   │    │
  │  │                                                      │    │
  │  │ ② Connection: Upgrade                               │    │
  │  │   → "Đây là request UPGRADE connection!"           │    │
  │  │                                                      │    │
  │  │ ③ Sec-WebSocket-Key: x3JJHMbDL1EzLkh9GBhXDw==     │    │
  │  │   → Base64 encoded RANDOM value!                   │    │
  │  │   → Browser tạo ngẫu nhiên!                       │    │
  │  │   → Xác minh server THẬT SỰ hỗ trợ WebSocket!   │    │
  │  │   → "Đừng giả vờ, chứng minh đi!"               │    │
  │  │                                                      │    │
  │  │ ④ Sec-WebSocket-Protocol: chat, superchat          │    │
  │  │   → Sub-protocol mong muốn!                        │    │
  │  │   → User-defined! Phân biệt service!              │    │
  │  │   → "Tối nay tôi dùng service A!"                │    │
  │  │                                                      │    │
  │  │ ⑤ Sec-WebSocket-Version: 13                        │    │
  │  │   → Version WebSocket protocol!                     │    │
  │  │   → 13 = RFC 6455 final standard!                  │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  SERVER RESPONSE:                                              │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ HTTP/1.1 101 Switching Protocols  ← ★ 101!        │    │
  │  │ Upgrade: websocket               ← Confirmed!     │    │
  │  │ Connection: Upgrade               ← Confirmed!     │    │
  │  │ Sec-WebSocket-Accept: HSmrc0sMlYUkAGmm5OPpG2HaGWk=│    │
  │  │ Sec-WebSocket-Protocol: chat                        │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  GIẢI THÍCH:                                                   │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ ① 101 Switching Protocols:                          │    │
  │  │   → "OK! Chuyển đổi protocol THÀNH CÔNG!"         │    │
  │  │   → Từ HTTP → WebSocket!                           │    │
  │  │                                                      │    │
  │  │ ② Sec-WebSocket-Accept:                             │    │
  │  │   → Server xử lý Sec-WebSocket-Key:               │    │
  │  │   → Key + MAGIC_STRING → SHA1 → Base64!           │    │
  │  │   → Chứng minh server THẬT SỰ WebSocket!          │    │
  │  │   → "Đây, thẻ căn cước của tôi!"                 │    │
  │  │                                                      │    │
  │  │ ③ Sec-WebSocket-Protocol: chat                      │    │
  │  │   → Sub-protocol được chọn!                        │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  SAU HANDSHAKE:                                                │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ → HTTP XONG NHIỆM VỤ!                              │    │
  │  │ → TCP connection giữ MỞ!                           │    │
  │  │ → Giao tiếp hoàn toàn WebSocket protocol!          │    │
  │  │ → Full-duplex! 2 chiều! Real-time! ✅             │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```

---

## §5. Sec-WebSocket-Key — Xác Thực!

```
  SEC-WEBSOCKET-KEY:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  THUẬT TOÁN:                                                   │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ MAGIC_STRING = "258EAFA5-E914-47DA-95CA-C5AB0DC85B11"│   │
  │  │                                                      │    │
  │  │ ① Client gửi: Sec-WebSocket-Key (random Base64!)   │    │
  │  │    VD: "x3JJHMbDL1EzLkh9GBhXDw=="                  │    │
  │  │                                                      │    │
  │  │ ② Server xử lý:                                    │    │
  │  │    concatenated = Key + MAGIC_STRING                │    │
  │  │    hash = SHA1(concatenated)                         │    │
  │  │    accept = Base64(hash)                             │    │
  │  │                                                      │    │
  │  │ ③ Server trả về: Sec-WebSocket-Accept              │    │
  │  │    VD: "HSmrc0sMlYUkAGmm5OPpG2HaGWk="              │    │
  │  │                                                      │    │
  │  │ ④ Client verify: tính lại = so sánh!              │    │
  │  │    → MATCH? → Server thật! ✅                     │    │
  │  │    → KHÔNG MATCH? → Fake server! ❌               │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  MỤC ĐÍCH:                                                    │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ → KHÔNG phải bảo mật! (MAGIC_STRING là public!)    │    │
  │  │ → Xác minh server HIỂU WebSocket protocol!         │    │
  │  │ → Ngăn proxy/cache NHẦM → coi đây là HTTP!       │    │
  │  │ → Ngăn intermediate cache pollution attack!         │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```

---

## §6. WebSocket Data Frame!

```
  DATA FRAME:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  SAU HANDSHAKE → giao tiếp bằng DATA FRAMES!                │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │  0                   1                   2           │    │
  │  │  0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3   │    │
  │  │ +-+-+-+-+-------+-+-------------+-------+---------+  │    │
  │  │ |F|R|R|R| opcode|M| Payload len | Extended length |  │    │
  │  │ |I|S|S|S|  (4)  |A|    (7)      |   (16/64)       |  │    │
  │  │ |N|V|V|V|       |S|             |                  |  │    │
  │  │ | |1|2|3|       |K|             |                  |  │    │
  │  │ +-+-+-+-+-------+-+-------------+---------+--------+  │    │
  │  │ |     Masking-key (nếu MASK=1)           |          |  │    │
  │  │ +---------------------------------------+---------+  │    │
  │  │ |                Payload Data                     |  │    │
  │  │ +------------------------------------------------+  │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  GIẢI THÍCH:                                                   │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ FIN: 1 = frame cuối cùng! 0 = còn frame tiếp!    │    │
  │  │ opcode: loại data!                                  │    │
  │  │   0x0 = continuation frame                          │    │
  │  │   0x1 = text data (UTF-8!)                          │    │
  │  │   0x2 = binary data                                 │    │
  │  │   0x8 = close connection!                           │    │
  │  │   0x9 = ping!                                       │    │
  │  │   0xA = pong!                                       │    │
  │  │ MASK: 1 = có mask! Client → Server LUÔN mask!     │    │
  │  │       0 = không mask! Server → Client KHÔNG mask!  │    │
  │  │ Payload length: kích thước data!                    │    │
  │  │   ≤125: length = chính nó!                         │    │
  │  │   =126: đọc 2 bytes tiếp!                         │    │
  │  │   =127: đọc 8 bytes tiếp!                         │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  MASK — TẠI SAO?                                              │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ → Client → Server: LUÔN CÓ MASK!                  │    │
  │  │ → Server → Client: KHÔNG mask!                     │    │
  │  │ → Ngăn chặn "cache poisoning attack"!              │    │
  │  │ → Proxy GIỮA client-server có thể cache nhầm!    │    │
  │  │ → Mask = XOR data với random key!                  │    │
  │  │ → Proxy không nhận diện được pattern → KHÔNG cache│   │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  HEADER OVERHEAD — SO VỚI HTTP:                               │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ HTTP request header: ~800 bytes mỗi request!       │    │
  │  │ WebSocket frame header: ~2-14 bytes! ★             │    │
  │  │ → Tiết kiệm ~98% overhead!                        │    │
  │  │ → Đặc biệt quan trọng khi gửi tin nhắn NHỎ!     │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```

---

## §7. Heartbeat — Nhịp Tim Giữ Kết Nối!

```
  HEARTBEAT:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  VẤN ĐỀ:                                                     │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ → WebSocket connection = persistent!                │    │
  │  │ → Nhưng KHÔNG GỬI data lâu → có thể BỊ NGẮT!   │    │
  │  │                                                      │    │
  │  │ Nguyên nhân ngắt:                                   │    │
  │  │ ① Firewall tự ngắt connection idle!                │    │
  │  │ ② Load Balancer timeout!                            │    │
  │  │ ③ Nginx proxy timeout!                              │    │
  │  │ ④ NAT table timeout!                                │    │
  │  │ ⑤ Server crash!                                     │    │
  │  │ ⑥ Network interruption!                             │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  GIẢI PHÁP — HEARTBEAT:                                       │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ "Nhịp tim" = gửi packet NHỎ định kỳ!             │    │
  │  │ → Cho server biết: "Client VẪN SỐNG!"             │    │
  │  │ → Giữ connection LUÔN ACTIVE!                      │    │
  │  │ → Ngăn firewall/proxy ngắt connection!             │    │
  │  │                                                      │    │
  │  │ Client          Server                              │    │
  │  │   │── ping ─────→│  (mỗi 30 giây!)               │    │
  │  │   │←── pong ─────│  (server trả lời!)             │    │
  │  │   │── ping ─────→│                                 │    │
  │  │   │←── pong ─────│  ← Connection alive! ✅        │    │
  │  │   │── ping ─────→│                                 │    │
  │  │   │   (timeout!) │  ← Không pong? Server chết! ❌ │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  CÁCH PHÁT HIỆN ONLINE/OFFLINE:                               │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ ① Client gửi request + unique ID + timestamp!     │    │
  │  │ ② Server lưu ID + timestamp vào DB/cache!         │    │
  │  │ ③ Client gửi lại sau N giây!                      │    │
  │  │ ④ Server so sánh: now - lastTimestamp > threshold? │    │
  │  │   → < threshold: ONLINE! ✅                       │    │
  │  │   → > threshold: OFFLINE! ❌                      │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  IMPLEMENTATION:                                               │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ var heartCheck = {                                   │    │
  │  │   timeout: 30000,  // 30s!                          │    │
  │  │   timer: null,                                       │    │
  │  │   serverTimer: null,                                 │    │
  │  │                                                      │    │
  │  │   reset: function() {                                │    │
  │  │     clearTimeout(this.timer);                        │    │
  │  │     clearTimeout(this.serverTimer);                  │    │
  │  │     return this;                                     │    │
  │  │   },                                                 │    │
  │  │                                                      │    │
  │  │   start: function() {                                │    │
  │  │     var self = this;                                 │    │
  │  │     this.timer = setTimeout(function() {             │    │
  │  │       ws.send("ping"); // Gửi heartbeat!           │    │
  │  │       // Nếu server không trả pong:                │    │
  │  │       self.serverTimer = setTimeout(function() {     │    │
  │  │         ws.close(); // Server chết! Đóng!          │    │
  │  │       }, self.timeout);                              │    │
  │  │     }, this.timeout);                                │    │
  │  │   }                                                  │    │
  │  │ };                                                   │    │
  │  │                                                      │    │
  │  │ // Usage:                                            │    │
  │  │ ws.onopen = function() {                             │    │
  │  │   heartCheck.reset().start();                        │    │
  │  │ };                                                   │    │
  │  │ ws.onmessage = function() {                          │    │
  │  │   heartCheck.reset().start(); // Reset timer!       │    │
  │  │ };                                                   │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```

---

## §8. Reconnect — Tự Động Kết Nối Lại!

```
  RECONNECT:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  NGUYÊN NHÂN NGẮT KẾT NỐI:                                  │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ ① Timeout — không gửi data lâu!                   │    │
  │  │ ② Server crash/restart!                             │    │
  │  │ ③ Network interrupt! (chuyển WiFi, mất mạng!)     │    │
  │  │ ④ Phone screen off! (mobile!)                       │    │
  │  │ ⑤ Client error/exception!                           │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  CHIẾN LƯỢC RECONNECT:                                        │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ ① Exponential Backoff:                              │    │
  │  │   → Lần 1: đợi 1s!                                │    │
  │  │   → Lần 2: đợi 2s!                                │    │
  │  │   → Lần 3: đợi 4s!                                │    │
  │  │   → Lần 4: đợi 8s!                                │    │
  │  │   → Max: 30s!                                       │    │
  │  │   → Tránh tất cả client reconnect CÙNG LÚC!      │    │
  │  │                                                      │    │
  │  │ ② Max Retries:                                      │    │
  │  │   → Giới hạn số lần thử!                          │    │
  │  │   → Sau N lần: hiển thị lỗi cho user!            │    │
  │  │                                                      │    │
  │  │ ③ Jitter (Random Delay):                            │    │
  │  │   → Thêm delay ngẫu nhiên!                        │    │
  │  │   → Tránh "thundering herd" effect!                │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  IMPLEMENTATION:                                               │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ function reconnect(url) {                            │    │
  │  │   if (reconnecting) return; // Tránh gọi trùng!   │    │
  │  │   reconnecting = true;                               │    │
  │  │                                                      │    │
  │  │   setTimeout(function() {                            │    │
  │  │     createWebSocket(url);                            │    │
  │  │     reconnecting = false;                            │    │
  │  │   }, 2000); // Đợi 2s trước khi thử lại!         │    │
  │  │ }                                                    │    │
  │  │                                                      │    │
  │  │ ws.onclose = function() {                            │    │
  │  │   reconnect(url); // Auto reconnect!                │    │
  │  │ };                                                   │    │
  │  │ ws.onerror = function() {                            │    │
  │  │   reconnect(url); // Error → reconnect!            │    │
  │  │ };                                                   │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  NETWORK OFFLINE DETECTION:                                    │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ window.addEventListener('online', function() {       │    │
  │  │   // Network trở lại! Reconnect!                   │    │
  │  │   reconnect(url);                                    │    │
  │  │ });                                                  │    │
  │  │                                                      │    │
  │  │ window.addEventListener('offline', function() {      │    │
  │  │   // Mất mạng! Thông báo user!                    │    │
  │  │   console.log('Network offline!');                   │    │
  │  │ });                                                  │    │
  │  │                                                      │    │
  │  │ // navigator.onLine = true/false!                   │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```

---

## §9. WebSocket API — Browser!

```
  BROWSER API:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  TẠO CONNECTION:                                               │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ var ws = new WebSocket('ws://example.com/chat');     │    │
  │  │ // hoặc wss:// cho encrypted!                       │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  4 EVENT HANDLERS:                                             │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ ws.onopen = function(event) {                        │    │
  │  │   // Kết nối THÀNH CÔNG!                            │    │
  │  │   ws.send('Hello Server!');                          │    │
  │  │ };                                                   │    │
  │  │                                                      │    │
  │  │ ws.onmessage = function(event) {                     │    │
  │  │   // Nhận MESSAGE từ server!                       │    │
  │  │   console.log('Received:', event.data);              │    │
  │  │ };                                                   │    │
  │  │                                                      │    │
  │  │ ws.onclose = function(event) {                       │    │
  │  │   // Kết nối BỊ ĐÓNG!                              │    │
  │  │   console.log('Code:', event.code);                  │    │
  │  │   console.log('Reason:', event.reason);              │    │
  │  │ };                                                   │    │
  │  │                                                      │    │
  │  │ ws.onerror = function(event) {                       │    │
  │  │   // LỖI xảy ra!                                   │    │
  │  │   console.error('Error!', event);                    │    │
  │  │ };                                                   │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  METHODS + PROPERTIES:                                         │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ ws.send(data);       // Gửi data!                  │    │
  │  │ ws.close(code, reason); // Đóng connection!        │    │
  │  │                                                      │    │
  │  │ ws.readyState:                                       │    │
  │  │   0 = CONNECTING  (đang kết nối!)                  │    │
  │  │   1 = OPEN        (đã kết nối! ✅)                │    │
  │  │   2 = CLOSING     (đang đóng!)                     │    │
  │  │   3 = CLOSED      (đã đóng! ❌)                  │    │
  │  │                                                      │    │
  │  │ ws.bufferedAmount: // Bytes chưa gửi!              │    │
  │  │ ws.protocol:       // Sub-protocol đã chọn!        │    │
  │  │ ws.url:            // URL server!                    │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```

---

## §10. Ứng Dụng + Khi Nào KHÔNG Dùng!

```
  USE CASES:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  NÊN DÙNG WebSocket:                                         │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ ① Chat / Instant Messaging!                         │    │
  │  │ ② Multiplayer Games!                                │    │
  │  │ ③ Online Collaborative Editing (Google Docs!)       │    │
  │  │ ④ Real-time Data Stream (stock, crypto!)           │    │
  │  │ ⑤ Live Streaming / Sports Score!                    │    │
  │  │ ⑥ Real-time Map Location!                           │    │
  │  │ ⑦ IoT Device Monitoring!                            │    │
  │  │ ⑧ Notification System!                              │    │
  │  │                                                      │    │
  │  │ → Cần REAL-TIME! Data LIÊN TỤC!                  │    │
  │  │ → Server cần PUSH data!                             │    │
  │  │ → 2 chiều giao tiếp!                               │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  KHÔNG NÊN DÙNG WebSocket:                                    │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ ① Lấy data 1 lần (REST API đủ!)                   │    │
  │  │ ② Data cũ, không cần real-time!                    │    │
  │  │ ③ CRUD operations đơn giản!                        │    │
  │  │ ④ File download/upload!                             │    │
  │  │ ⑤ Static content!                                   │    │
  │  │                                                      │    │
  │  │ → HTTP/REST ĐỦ! WebSocket = overhead!             │    │
  │  │ → Connection persistent = tốn memory server!       │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```

---

## §11. Sơ Đồ Tự Vẽ!

### Sơ Đồ 1: HTTP vs WebSocket Lifecycle

```
  HTTP vs WEBSOCKET:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  HTTP:                            WebSocket:                 │
  │  ┌────────┐  ┌────────┐         ┌────────┐  ┌────────┐    │
  │  │ Client │  │ Server │         │ Client │  │ Server │    │
  │  └───┬────┘  └───┬────┘         └───┬────┘  └───┬────┘    │
  │      │           │                  │           │           │
  │      │─ Req 1 ──→│                  │── Handshake→│         │
  │      │←─ Res 1 ──│                  │←─ 101 OK ──│         │
  │      ├ conn end ─┤                  │            │         │
  │      │           │                  │←── Push! ──│         │
  │      │─ Req 2 ──→│                  │── Send! ──→│         │
  │      │←─ Res 2 ──│                  │←── Push! ──│         │
  │      ├ conn end ─┤                  │── Send! ──→│         │
  │      │           │                  │←── Push! ──│         │
  │      │─ Req 3 ──→│                  │            │         │
  │      │←─ Res 3 ──│                  │── Close ──→│         │
  │      ├ conn end ─┤                  ├─ conn end ─┤         │
  │      │           │                  │            │         │
  │  ↑ Mỗi request = connection mới!  ↑ 1 handshake = VĨNH   │
  │  ↑ Header 800 bytes mỗi lần!      VIỄN! Header 2 bytes!  │
  │  ↑ Server CHỈ response!           ↑ 2 chiều! Push! ★    │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```

### Sơ Đồ 2: WebSocket Handshake Flow

```
  HANDSHAKE FLOW:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  Client                              Server                  │
  │  ┌──────────────────┐               ┌──────────────────┐    │
  │  │ new WebSocket()  │               │ Listening...     │    │
  │  └─────────┬────────┘               └─────────┬────────┘    │
  │            │                                   │             │
  │            │ ① HTTP Upgrade Request!           │             │
  │            │ GET /chat HTTP/1.1                │             │
  │            │ Upgrade: websocket                │             │
  │            │ Connection: Upgrade               │             │
  │            │ Sec-WebSocket-Key: abc123==       │             │
  │            │ Sec-WebSocket-Version: 13         │             │
  │            │──────────────────────────────────→│             │
  │            │                                   │             │
  │            │         ② Server verify!          │             │
  │            │         Key + MAGIC_STRING        │             │
  │            │         → SHA1 → Base64!          │             │
  │            │                                   │             │
  │            │ ③ HTTP 101 Response!              │             │
  │            │ HTTP/1.1 101 Switching Protocols   │             │
  │            │ Upgrade: websocket                │             │
  │            │ Sec-WebSocket-Accept: xyz789=     │             │
  │            │←──────────────────────────────────│             │
  │            │                                   │             │
  │  ┌─────────────────────────────────────────────┐             │
  │  │ ④ TCP connection UPGRADE → WebSocket!      │             │
  │  │    HTTP xong nhiệm vụ!                     │             │
  │  │    Full-duplex communication! ✅            │             │
  │  └─────────────────────────────────────────────┘             │
  │            │                                   │             │
  │            │←──── data ────────────────────────│             │
  │            │────── data ──────────────────────→│             │
  │            │←──── data ────────────────────────│             │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```

### Sơ Đồ 3: Heartbeat Mechanism

```
  HEARTBEAT:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  Client                              Server                  │
  │    │                                   │                     │
  │    │══════ Connected! ════════════════│                     │
  │    │                                   │                     │
  │    │        (30s đợi...)              │                     │
  │    │── ping ──────────────────────────→│  ← Heartbeat!     │
  │    │←── pong ─────────────────────────│  ← Alive! ✅      │
  │    │   [reset timer!]                  │                     │
  │    │                                   │                     │
  │    │        (30s đợi...)              │                     │
  │    │── ping ──────────────────────────→│  ← Heartbeat!     │
  │    │←── pong ─────────────────────────│  ← Alive! ✅      │
  │    │   [reset timer!]                  │                     │
  │    │                                   │                     │
  │    │        (30s đợi...)              │                     │
  │    │── ping ──────────────────────────→│  ← Heartbeat!     │
  │    │   (30s timeout...)         ╳ Server│chết!             │
  │    │   KHÔNG có pong!                  │                     │
  │    │── ws.close() ──────────── ╳      │  ← Đóng! ❌      │
  │    │                                   │                     │
  │    │── reconnect() ──────────────────→│  ← Kết nối lại!  │
  │    │                                   │                     │
  └──────────────────────────────────────────────────────────────┘
```

### Sơ Đồ 4: Reconnect Strategy

```
  RECONNECT:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  Connection ngắt!                                             │
  │  ┌──────────┐                                                │
  │  │ onclose! │                                                │
  │  │ onerror! │                                                │
  │  └────┬─────┘                                                │
  │       │                                                      │
  │       ↓                                                      │
  │  ┌─── Retry 1 ────┐  1s delay                              │
  │  │ new WebSocket() │──→ FAIL? ──┐                           │
  │  └────────────────┘             │                           │
  │                                  ↓                           │
  │  ┌─── Retry 2 ────┐  2s delay                              │
  │  │ new WebSocket() │──→ FAIL? ──┐                           │
  │  └────────────────┘             │                           │
  │                                  ↓                           │
  │  ┌─── Retry 3 ────┐  4s delay (exponential!)               │
  │  │ new WebSocket() │──→ FAIL? ──┐                           │
  │  └────────────────┘             │                           │
  │                                  ↓                           │
  │  ┌─── Retry 4 ────┐  8s delay                              │
  │  │ new WebSocket() │──→ SUCCESS! ✅                         │
  │  └────────────────┘                                          │
  │       │                                                      │
  │       ↓                                                      │
  │  ┌──────────────────────┐                                    │
  │  │ heartCheck.start()! │                                    │
  │  │ Connection restored! │                                    │
  │  └──────────────────────┘                                    │
  │                                                              │
  │  Max retries?                                                │
  │  ┌──────────────────────┐                                    │
  │  │ "Không thể kết nối! │                                    │
  │  │  Vui lòng thử lại!" │                                    │
  │  └──────────────────────┘                                    │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```

### Sơ Đồ 5: WebSocket Data Frame

```
  DATA FRAME STRUCTURE:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  Byte 1:                                                     │
  │  ┌───┬───┬───┬───┬───┬───┬───┬───┐                         │
  │  │FIN│RS1│RS2│RS3│    OPCODE     │                         │
  │  │ 1 │ 0 │ 0 │ 0 │  0  0  0  1  │  ← 0x1 = TEXT!        │
  │  └───┴───┴───┴───┴───┴───┴───┴───┘                         │
  │                                                              │
  │  Byte 2:                                                     │
  │  ┌───┬───────────────────────────┐                           │
  │  │MSK│     PAYLOAD LENGTH       │                           │
  │  │ 1 │      0  0  0  0  1  0  1 │  ← 5 bytes! MASK=yes!  │
  │  └───┴───────────────────────────┘                           │
  │                                                              │
  │  Bytes 3-6: MASKING KEY (if MASK=1)                         │
  │  ┌───────────────────────────────┐                           │
  │  │  m0    m1    m2    m3        │  ← 4 byte random key!   │
  │  └───────────────────────────────┘                           │
  │                                                              │
  │  Remaining: PAYLOAD DATA                                     │
  │  ┌───────────────────────────────┐                           │
  │  │  "Hello" (XOR with mask!)   │  ← Actual data!          │
  │  └───────────────────────────────┘                           │
  │                                                              │
  │  OPCODE:    0x1=text  0x2=binary  0x8=close                 │
  │             0x9=ping  0xA=pong                               │
  │                                                              │
  │  Client → Server: MASK = 1! (always!)                       │
  │  Server → Client: MASK = 0! (never!)                        │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```

---

## §12. Tự Viết — WebSocketEngine!

```javascript
/**
 * WebSocketEngine — Mô phỏng WebSocket Protocol!
 * Tự viết bằng tay, KHÔNG dùng thư viện!
 */
var WebSocketEngine = (function () {

  var log = [];
  function reset() { log = []; }

  var MAGIC_STRING = '258EAFA5-E914-47DA-95CA-C5AB0DC85B11';

  // ═══════════════════════════════════
  // 1. SIMPLE SHA1 + BASE64 (simplified!)
  // ═══════════════════════════════════
  function simpleHash(str) {
    var hash = 0;
    for (var i = 0; i < str.length; i++) {
      var char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash).toString(36);
  }

  function toBase64(str) {
    // Simplified base64 simulation
    var chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghij' +
                'klmnopqrstuvwxyz0123456789+/';
    var result = '';
    for (var i = 0; i < str.length; i++) {
      result += chars[str.charCodeAt(i) % 64];
    }
    return result + '==';
  }

  // ═══════════════════════════════════
  // 2. GENERATE SEC-WEBSOCKET-KEY
  // ═══════════════════════════════════
  function generateKey() {
    var random = '';
    for (var i = 0; i < 16; i++) {
      random += String.fromCharCode(
        Math.floor(Math.random() * 256));
    }
    return toBase64(random);
  }

  function computeAccept(key) {
    var concatenated = key + MAGIC_STRING;
    var hash = simpleHash(concatenated);
    return toBase64(hash);
  }

  // ═══════════════════════════════════
  // 3. HANDSHAKE SIMULATION
  // ═══════════════════════════════════
  function simulateHandshake(url) {
    var domain = url.replace(/wss?:\/\//, '').split('/')[0];
    var path = '/' + url.replace(/wss?:\/\//, '')
                        .split('/').slice(1).join('/');

    log.push('=== WEBSOCKET HANDSHAKE ===');

    // Client request
    var key = generateKey();
    log.push('');
    log.push('[Client → Server] HTTP Upgrade Request:');
    log.push('  GET ' + path + ' HTTP/1.1');
    log.push('  Host: ' + domain);
    log.push('  Upgrade: websocket');
    log.push('  Connection: Upgrade');
    log.push('  Sec-WebSocket-Key: ' + key);
    log.push('  Sec-WebSocket-Protocol: chat');
    log.push('  Sec-WebSocket-Version: 13');

    // Server processing
    log.push('');
    log.push('[Server] Xử lý:');
    log.push('  Key = "' + key + '"');
    log.push('  + MAGIC = "' + MAGIC_STRING + '"');
    var accept = computeAccept(key);
    log.push('  → SHA1 → Base64 = "' + accept + '"');

    // Server response
    log.push('');
    log.push('[Server → Client] HTTP 101 Response:');
    log.push('  HTTP/1.1 101 Switching Protocols');
    log.push('  Upgrade: websocket');
    log.push('  Connection: Upgrade');
    log.push('  Sec-WebSocket-Accept: ' + accept);
    log.push('  Sec-WebSocket-Protocol: chat');

    // Verify
    log.push('');
    var clientComputed = computeAccept(key);
    var match = (clientComputed === accept);
    log.push('[Client Verify] Accept match? ' +
      (match ? '✅ YES! Server thật!' :
               '❌ NO! Fake server!'));

    log.push('');
    log.push('→ HTTP xong nhiệm vụ!');
    log.push('→ TCP connection UPGRADE → WebSocket!');
    log.push('→ Full-duplex! 2 chiều! ✅');

    return { key: key, accept: accept, verified: match };
  }

  // ═══════════════════════════════════
  // 4. DATA FRAME SIMULATION
  // ═══════════════════════════════════
  function createFrame(data, opcode, isMasked) {
    opcode = opcode || 0x1; // default text
    var opcodeNames = {
      0x0: 'continuation', 0x1: 'text',
      0x2: 'binary', 0x8: 'close',
      0x9: 'ping', 0xA: 'pong'
    };

    var frame = {
      fin: 1,
      opcode: opcode,
      opcodeName: opcodeNames[opcode] || 'unknown',
      mask: isMasked ? 1 : 0,
      payloadLength: data.length,
      maskingKey: isMasked ? [
        Math.floor(Math.random() * 256),
        Math.floor(Math.random() * 256),
        Math.floor(Math.random() * 256),
        Math.floor(Math.random() * 256)
      ] : null,
      payload: data
    };

    log.push('[Frame] FIN=' + frame.fin +
      ' opcode=0x' + opcode.toString(16) +
      ' (' + frame.opcodeName + ')' +
      ' MASK=' + frame.mask +
      ' len=' + frame.payloadLength +
      ' data="' + data + '"');

    return frame;
  }

  // ═══════════════════════════════════
  // 5. MASK/UNMASK
  // ═══════════════════════════════════
  function maskData(data, maskingKey) {
    var masked = '';
    for (var i = 0; i < data.length; i++) {
      var byte = data.charCodeAt(i) ^ maskingKey[i % 4];
      masked += String.fromCharCode(byte);
    }
    return masked;
  }

  // ═══════════════════════════════════
  // 6. HEARTBEAT SIMULATION
  // ═══════════════════════════════════
  function simulateHeartbeat() {
    log.push('=== HEARTBEAT ===');
    var timeout = 30000;
    var alive = true;

    log.push('[Heartbeat] timeout = ' + timeout + 'ms');

    // Round 1: alive
    log.push('');
    log.push('[Round 1] 30s elapsed...');
    log.push('[Client → Server] ping!');
    log.push('[Server → Client] pong! ✅');
    log.push('[Client] Reset timer!');

    // Round 2: alive
    log.push('');
    log.push('[Round 2] 30s elapsed...');
    log.push('[Client → Server] ping!');
    log.push('[Server → Client] pong! ✅');
    log.push('[Client] Reset timer!');

    // Round 3: server dead!
    log.push('');
    log.push('[Round 3] 30s elapsed...');
    log.push('[Client → Server] ping!');
    log.push('[Client] Waiting for pong...');
    log.push('[Client] 30s timeout! NO PONG!');
    log.push('[Client] → ws.close()! Server chết! ❌');
    log.push('[Client] → reconnect()!');

    return { rounds: 3, serverDied: true };
  }

  // ═══════════════════════════════════
  // 7. RECONNECT SIMULATION
  // ═══════════════════════════════════
  function simulateReconnect() {
    log.push('=== RECONNECT ===');

    var delays = [1000, 2000, 4000, 8000]; // exponential!
    var success = false;

    for (var i = 0; i < delays.length; i++) {
      log.push('');
      log.push('[Retry ' + (i + 1) + '] Delay: ' +
        delays[i] + 'ms');
      log.push('[Retry ' + (i + 1) +
        '] new WebSocket(url)...');

      if (i === delays.length - 1) {
        log.push('[Retry ' + (i + 1) +
          '] → SUCCESS! ✅');
        log.push('[Retry ' + (i + 1) +
          '] → heartCheck.start()!');
        success = true;
      } else {
        log.push('[Retry ' + (i + 1) +
          '] → FAILED! ❌');
      }
    }

    return { retries: delays.length, success: success };
  }

  // ═══════════════════════════════════
  // 8. HTTP vs WEBSOCKET COMPARISON
  // ═══════════════════════════════════
  function simulateComparison() {
    log.push('=== HTTP POLLING vs WEBSOCKET ===');

    // HTTP Polling: 10 messages
    log.push('');
    log.push('--- HTTP Polling (10 tin nhắn) ---');
    var httpOverhead = 0;
    for (var i = 0; i < 10; i++) {
      httpOverhead += 800; // header ~800 bytes
      log.push('[HTTP] Request ' + (i + 1) +
        ': header ~800 bytes, data ~20 bytes');
    }
    log.push('[HTTP] TỔNG overhead: ~' +
      httpOverhead + ' bytes!');

    // WebSocket: 10 messages
    log.push('');
    log.push('--- WebSocket (10 tin nhắn) ---');
    var wsOverhead = 0;
    log.push('[WS] Handshake: header ~200 bytes (1 LẦN!)');
    wsOverhead += 200;
    for (var j = 0; j < 10; j++) {
      wsOverhead += 6; // frame header ~2-6 bytes
      log.push('[WS] Frame ' + (j + 1) +
        ': header ~6 bytes, data ~20 bytes');
    }
    log.push('[WS] TỔNG overhead: ~' +
      wsOverhead + ' bytes!');

    log.push('');
    log.push('→ HTTP: ' + httpOverhead +
      ' bytes overhead!');
    log.push('→ WS:   ' + wsOverhead +
      ' bytes overhead!');
    log.push('→ WS tiết kiệm ' +
      Math.round((1 - wsOverhead / httpOverhead) * 100) +
      '% bandwidth! ★');
  }

  // ═══════════════════════════════════
  // DEMO
  // ═══════════════════════════════════
  function demo() {
    console.log('╔═══════════════════════════════════════════╗');
    console.log('║  WebSocket ENGINE — DEMO                    ║');
    console.log('╚═══════════════════════════════════════════╝');

    // 1. Handshake
    console.log('\n--- 1. HANDSHAKE ---');
    reset();
    simulateHandshake('ws://server.example.com/chat');
    log.forEach(function (l) { console.log('  ' + l); });

    // 2. Data Frames
    console.log('\n--- 2. DATA FRAMES ---');
    reset();
    log.push('Client → Server (MASKED!):');
    createFrame('Hello Server!', 0x1, true);
    log.push('');
    log.push('Server → Client (NOT masked!):');
    createFrame('Hello Client!', 0x1, false);
    log.push('');
    log.push('Ping/Pong:');
    createFrame('', 0x9, true);  // ping
    createFrame('', 0xA, false); // pong
    log.push('');
    log.push('Close:');
    createFrame('Goodbye!', 0x8, true);
    log.forEach(function (l) { console.log('  ' + l); });

    // 3. Mask/Unmask
    console.log('\n--- 3. MASK/UNMASK ---');
    reset();
    var key = [0x37, 0xfa, 0x21, 0x3d];
    var original = 'Hello!';
    var masked = maskData(original, key);
    var unmasked = maskData(masked, key);
    log.push('Original: "' + original + '"');
    log.push('Masked: (binary data, length=' +
      masked.length + ')');
    log.push('Unmasked: "' + unmasked + '"');
    log.push('Match? ' + (original === unmasked ?
      '✅' : '❌'));
    log.forEach(function (l) { console.log('  ' + l); });

    // 4. Heartbeat
    console.log('\n--- 4. HEARTBEAT ---');
    reset();
    simulateHeartbeat();
    log.forEach(function (l) { console.log('  ' + l); });

    // 5. Reconnect
    console.log('\n--- 5. RECONNECT ---');
    reset();
    simulateReconnect();
    log.forEach(function (l) { console.log('  ' + l); });

    // 6. Comparison
    console.log('\n--- 6. HTTP vs WEBSOCKET ---');
    reset();
    simulateComparison();
    log.forEach(function (l) { console.log('  ' + l); });

    console.log('\n╔═══════════════════════════════════════════╗');
    console.log('║  ✅ Demo Complete!                           ║');
    console.log('╚═══════════════════════════════════════════╝');
  }

  return {
    generateKey: generateKey,
    computeAccept: computeAccept,
    simulateHandshake: simulateHandshake,
    createFrame: createFrame,
    maskData: maskData,
    simulateHeartbeat: simulateHeartbeat,
    simulateReconnect: simulateReconnect,
    simulateComparison: simulateComparison,
    demo: demo, reset: reset
  };
})();

// Chạy: WebSocketEngine.demo();
```

---

## §13. Câu Hỏi Luyện Tập!

### ❓ Câu 1: WebSocket là gì? Khác HTTP thế nào?

**Trả lời:**

WebSocket = protocol **FULL-DUPLEX** trên 1 TCP connection!

| | HTTP | WebSocket |
|---|---|---|
| **Giao tiếp** | 1 chiều (req→res) | 2 chiều (full-duplex!) |
| **Kết nối** | Ngắn (mỗi req mới) | Dài (persistent!) |
| **Server Push** | ❌ Không | ✅ Có! |
| **Header** | ~800 bytes/req | ~2 bytes/frame! |
| **Protocol** | http:// / https:// | ws:// / wss:// |
| **Stateless** | ✅ | ❌ Stateful! |
| **Same-origin** | ✅ Bị giới hạn | ❌ Không giới hạn! |

**Giống**: đều trên TCP, đều application layer, đều port 80/443!

### ❓ Câu 2: Tại sao cần WebSocket? HTTP polling có vấn đề gì?

**Trả lời:**

HTTP có 4 vấn đề: **one-way**, **request/response**, **stateless**, **half-duplex**!

**Polling problems**:
- Server giữ hàng ngàn connections!
- Header ~800 bytes × N requests = **LÃNG PHÍ bandwidth**!
- Delay: phải đợi đến lần poll tiếp mới biết có data mới!
- Phần lớn response: "Chưa có data mới!" = **VÔ ÍCH**!

**WebSocket giải quyết**: 1 handshake → kết nối vĩnh viễn → 2 chiều → real-time!

### ❓ Câu 3: WebSocket handshake diễn ra thế nào?

**Trả lời:**

```
① Client gửi HTTP GET + "Upgrade: websocket"!
② Server trả HTTP 101 Switching Protocols!
③ TCP connection UPGRADE thành WebSocket!
④ Full-duplex communication bắt đầu!
```

**Key headers**:
- `Upgrade: websocket` — "Nâng cấp lên WebSocket!"
- `Connection: Upgrade` — "Đây là request upgrade!"
- `Sec-WebSocket-Key` — Random Base64, xác minh server!
- `Sec-WebSocket-Version: 13` — RFC 6455 standard!
- Server trả `Sec-WebSocket-Accept` = SHA1(Key + MAGIC_STRING) → Base64!

### ❓ Câu 4: Sec-WebSocket-Key dùng để làm gì?

**Trả lời:**

- Client gửi **random Base64** key!
- Server: Key + `"258EAFA5-E914-47DA-95CA-C5AB0DC85B11"` → **SHA1** → **Base64** = Accept!
- Client verify: tính lại, so sánh với Accept!
- **KHÔNG PHẢI** bảo mật! MAGIC_STRING là **public**!
- **Mục đích**: xác minh server HIỂU WebSocket protocol! Ngăn proxy/cache nhầm thành HTTP!

### ❓ Câu 5: WebSocket frame cấu trúc thế nào?

**Trả lời:**

- **FIN**: 1 = frame cuối, 0 = còn tiếp!
- **Opcode**: 0x1=text, 0x2=binary, 0x8=close, 0x9=ping, 0xA=pong!
- **MASK**: Client→Server LUÔN mask! Server→Client KHÔNG mask!
- **Payload length**: ≤125=chính nó, 126=2 bytes tiếp, 127=8 bytes tiếp!
- **Masking key**: 4 bytes random, XOR với data!
- **Header overhead**: chỉ **2-14 bytes** (vs HTTP ~800 bytes!)

**Tại sao MASK?** Ngăn **cache poisoning attack** — proxy trung gian không nhận diện được pattern → không cache nhầm!

### ❓ Câu 6: Heartbeat hoạt động thế nào?

**Trả lời:**

```
① Client gửi "ping" mỗi 30s!
② Server trả "pong"!
③ Client nhận pong → reset timer!
④ Không nhận pong sau 30s → ws.close()! Server chết!
⑤ Reconnect!
```

**Tại sao cần?** 
- Firewall/proxy/NAT tự ngắt connection idle!
- Không biết server chết nếu không heartbeat!
- TCP SO_KEEPALIVE = 2 giờ, quá chậm!

### ❓ Câu 7: Reconnect strategy?

**Trả lời:**

- **Exponential Backoff**: 1s → 2s → 4s → 8s → max 30s!
- **Max Retries**: giới hạn số lần thử!
- **Jitter**: random delay tránh thundering herd!
- **Network detection**: `navigator.onLine`, `online`/`offline` events!

```javascript
ws.onclose = function() { reconnect(url); };
ws.onerror = function() { reconnect(url); };
window.addEventListener('online', function() {
  reconnect(url);
});
```

---

> 🎯 **Tổng kết WebSocket:**
> - **WebSocket = full-duplex** trên 1 TCP! Server push! 2 chiều! Real-time!
> - **HTTP problems**: one-way, polling lãng phí, header 800 bytes/req!
> - **Handshake**: HTTP GET + Upgrade: websocket → 101 Switching Protocols!
> - **Sec-WebSocket-Key**: Key + MAGIC_STRING → SHA1 → Base64 → verify server!
> - **Data frame**: FIN, opcode, MASK, payload! Header chỉ 2-14 bytes!
> - **MASK**: Client→Server always! Ngăn cache poisoning attack!
> - **Heartbeat**: ping/pong mỗi 30s! Giữ connection alive!
> - **Reconnect**: exponential backoff + max retries + jitter!
> - **Use cases**: chat, game, real-time data, notification!
> - **KHÔNG dùng**: REST API, 1 lần lấy data, static content!
> - **WebSocketEngine** tự viết: handshake, frame, mask, heartbeat, reconnect!
> - **7 câu hỏi** luyện tập với đáp án chi tiết!
