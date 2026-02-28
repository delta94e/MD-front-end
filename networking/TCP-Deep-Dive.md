# TCP & UDP — Transport Layer Deep Dive

> 📅 2026-02-11 · ⏱ 30 phút đọc
>
> Tài liệu chuyên sâu về giao thức Transport Layer: TCP (Transmission Control Protocol)
> và UDP (User Datagram Protocol). Bao gồm: đặc điểm, so sánh, handshake,
> congestion control, flow control, retransmission, packet merging, và câu hỏi phỏng vấn.
> Độ khó: ⭐️⭐️⭐️⭐️ | Chủ đề: Network Protocol + Transport Layer

---

## Mục Lục

**PHẦN I — NỀN TẢNG**

0. [TCP và UDP — Khái Niệm & Đặc Điểm](#0-tcp-và-udp--khái-niệm--đặc-điểm)
1. [So Sánh TCP và UDP](#1-so-sánh-tcp-và-udp)

**PHẦN II — KẾT NỐI TCP**

2. [Sequence Number là gì?](#2-sequence-number-là-gì)
3. [TCP Three-Way Handshake](#3-tcp-three-way-handshake)
4. [TCP Four-Way Handshake](#4-tcp-four-way-handshake)

**PHẦN III — CƠ CHẾ NÂNG CAO**

5. [Cơ Chế Đảm Bảo Truyền Dữ Liệu Tin Cậy](#5-cơ-chế-đảm-bảo-truyền-dữ-liệu-tin-cậy)
6. [TCP Retransmission — Cơ Chế Truyền Lại](#6-tcp-retransmission--cơ-chế-truyền-lại)
7. [TCP Congestion Control — Kiểm Soát Tắc Nghẽn](#7-tcp-congestion-control--kiểm-soát-tắc-nghẽn)
8. [TCP Flow Control — Kiểm Soát Luồng](#8-tcp-flow-control--kiểm-soát-luồng)
9. [TCP Reliable Transmission — Truyền Tin Cậy (ARQ + Sliding Window)](#9-tcp-reliable-transmission--truyền-tin-cậy-arq--sliding-window)
10. [TCP Packet Merging — Dính Gói & Xử Lý](#10-tcp-packet-merging--dính-gói--xử-lý)
11. [Tại Sao UDP Không Bị Dính Gói?](#11-tại-sao-udp-không-bị-dính-gói)
12. [Tóm Tắt & Câu Hỏi Phỏng Vấn](#12-tóm-tắt--câu-hỏi-phỏng-vấn)

---

## 0. TCP và UDP — Khái Niệm & Đặc Điểm

> **🎯 Học xong phần này, bạn sẽ biết:**
>
> - TCP và UDP là gì, thuộc tầng nào trong mô hình OSI
> - 5 đặc điểm của UDP và 6 đặc điểm của TCP
> - Tại sao cần hai giao thức khác nhau

### Tổng quan

```
TRANSPORT LAYER — TẦNG GIAO VẬN:
═══════════════════════════════════════════════════════════════

  Cả TCP và UDP đều là giao thức TẦNG GIAO VẬN (Layer 4)
  trong bộ giao thức TCP/IP:

  ┌──────────────────────────────────────┐
  │       Application Layer              │  ← HTTP, FTP, DNS
  ├──────────────────────────────────────┤
  │       Transport Layer                │  ← TCP & UDP ở đây!
  ├──────────────────────────────────────┤
  │       Network Layer (IP)             │  ← Routing gói tin
  ├──────────────────────────────────────┤
  │       Data Link + Physical           │  ← Ethernet, Wi-Fi
  └──────────────────────────────────────┘

  NHIỆM VỤ CỦA TRANSPORT LAYER:
  ┌──────────────────────────────────────────────────────────┐
  │ → Cung cấp kênh truyền dữ liệu giữa 2 ứng dụng       │
  │ → Phân biệt các ứng dụng qua PORT NUMBER               │
  │ → TCP: truyền TIN CẬY | UDP: truyền NHANH              │
  └──────────────────────────────────────────────────────────┘
```

### (1) UDP — User Datagram Protocol

```
UDP = "GỬI THƯ KHÔNG CẦN HỒI ÂM":
═══════════════════════════════════════════════════════════════

  Sender ──── Bỏ thư vào hòm ────► Receiver
  (Không biết đã nhận chưa, không cần biết!)

  → Không cần thiết lập kết nối trước
  → Gửi xong là xong, không chờ xác nhận
  → Nhanh nhưng KHÔNG đảm bảo tin cậy
```

#### ① Connectionless — Không kết nối

```
UDP CONNECTIONLESS — QUY TRÌNH GỬI/NHẬN:
═══════════════════════════════════════════════════════════════

  ❌ KHÔNG CÓ handshake (không bắt tay trước)
  ❌ KHÔNG chia nhỏ hoặc ghép lại dữ liệu

  PHÍA GỬI (Sender):
  ┌──────────────────────────────────────────────────────────┐
  │                                                          │
  │  Application Layer                                       │
  │       │ truyền data xuống                                │
  │       ▼                                                  │
  │  Transport Layer (UDP)                                   │
  │       │ CHỈ thêm UDP header → xác định là UDP protocol  │
  │       │ KHÔNG chia nhỏ, KHÔNG ghép lại                  │
  │       ▼                                                  │
  │  Network Layer (IP)                                      │
  │       │ gửi đi                                           │
  │       ▼                                                  │
  │  ────────────► Mạng ─────────────►                      │
  │                                                          │
  └──────────────────────────────────────────────────────────┘

  PHÍA NHẬN (Receiver):
  ┌──────────────────────────────────────────────────────────┐
  │                                                          │
  │  Network Layer (IP)                                      │
  │       │ nhận data                                        │
  │       ▼                                                  │
  │  Transport Layer (UDP)                                   │
  │       │ CHỈ bỏ IP header → chuyển lên trên             │
  │       │ KHÔNG ghép nối, KHÔNG xử lý thêm               │
  │       ▼                                                  │
  │  Application Layer                                       │
  │       → Nhận nguyên vẹn datagram                        │
  │                                                          │
  └──────────────────────────────────────────────────────────┘
```

#### ② Unicast, Multicast, Broadcast — Hỗ trợ đa điểm

```
UDP HỖ TRỢ NHIỀU CHẾ ĐỘ TRUYỀN:
═══════════════════════════════════════════════════════════════

  ┌──────────────────────────────────────────────────────────┐
  │                                                          │
  │  UNICAST (1-to-1):                                       │
  │  Client A ────────────────► Server B                    │
  │                                                          │
  │  MULTICAST (1-to-many / many-to-many):                   │
  │  Client A ───┬──────────► Server B                      │
  │              ├──────────► Server C                      │
  │              └──────────► Server D                      │
  │                                                          │
  │  BROADCAST (1-to-all):                                   │
  │  Client A ═══════════════► TẤT CẢ trong mạng           │
  │                                                          │
  │  → TCP chỉ hỗ trợ Unicast (1-to-1)                     │
  │  → UDP hỗ trợ TẤT CẢ các chế độ trên!                  │
  │                                                          │
  └──────────────────────────────────────────────────────────┘
```

#### ③ Message-Oriented — Hướng thông điệp

```
UDP GIỮ NGUYÊN BIÊN GIỚI MESSAGE:
═══════════════════════════════════════════════════════════════

  Application gửi 3 messages riêng biệt:
  ┌──────┐  ┌──────────┐  ┌────┐
  │ MSG1 │  │   MSG2   │  │MSG3│
  └──────┘  └──────────┘  └────┘

  UDP xử lý:
  ┌───────────┐  ┌───────────────┐  ┌─────────┐
  │HDR + MSG1 │  │ HDR + MSG2    │  │HDR+MSG3 │
  └───────────┘  └───────────────┘  └─────────┘
  ↑ Mỗi message = 1 datagram RIÊNG BIỆT

  ❌ KHÔNG merge (gộp) nhiều messages thành 1
  ❌ KHÔNG split (chia) 1 message thành nhiều phần
  ✅ GIỮ NGUYÊN biên giới (boundary) của message

  ⚠️ Application phải tự chọn kích thước message phù hợp!
     (quá lớn → IP layer sẽ phải fragment)
```

#### ④ Unreliable — Không tin cậy

```
UDP KHÔNG ĐẢM BẢO GÌ CẢ:
═══════════════════════════════════════════════════════════════

  ┌──────────────────────────────────────────────────────────┐
  │                                                          │
  │  ① KHÔNG kết nối → gửi lúc nào cũng được               │
  │     → Không biết bên nhận có sẵn sàng không             │
  │                                                          │
  │  ② KHÔNG backup data → gửi xong là quên                 │
  │     → Không giữ bản sao để gửi lại                      │
  │     → Không quan tâm bên kia có nhận đúng không         │
  │                                                          │
  │  ③ KHÔNG có congestion control:                          │
  │     → Luôn gửi với TỐC ĐỘ KHÔNG ĐỔI                   │
  │     → Mạng tốt hay xấu → tốc độ VẪN VẬY               │
  │                                                          │
  │     NHƯỢC ĐIỂM: Mạng xấu → MẤT GÓI                    │
  │     ƯU ĐIỂM: Real-time apps cần tốc độ ổn định         │
  │     → Video call, game online, live streaming            │
  │     → PHẢI dùng UDP, KHÔNG THỂ dùng TCP                 │
  │                                                          │
  └──────────────────────────────────────────────────────────┘
```

#### ⑤ Low Header Overhead — Header nhẹ

```
UDP HEADER — CHỈ 8 BYTES:
═══════════════════════════════════════════════════════════════

  ┌────────────────────┬────────────────────┐
  │   Source Port      │ Destination Port   │  ← 2 × 16-bit ports
  │   (16 bits)        │  (16 bits)         │
  ├────────────────────┼────────────────────┤
  │     Length         │    Checksum        │  ← Tổng length + checksum
  │   (16 bits)        │  (16 bits)         │
  └────────────────────┴────────────────────┘
  = TỔNG CỘNG 8 BYTES

  SO SÁNH:
  ┌──────────────────────────────────────────────────────────┐
  │ UDP header:  8 bytes                                     │
  │ TCP header:  20-60 bytes (tối thiểu 20 bytes)           │
  │                                                          │
  │ → UDP overhead NHỎ hơn TCP ít nhất 2.5 lần!            │
  │ → Hiệu suất truyền data RẤT CAO                        │
  └──────────────────────────────────────────────────────────┘
```

### (2) TCP — Transmission Control Protocol

```
TCP = "GỌI ĐIỆN THOẠI CÓ XÁC NHẬN":
═══════════════════════════════════════════════════════════════

  → Kết nối trước, nói chuyện sau
  → Tin cậy, đúng thứ tự, không mất dữ liệu
  → Stream protocol = dòng dữ liệu liên tục
```

#### ① Connection-Oriented — Hướng kết nối

```
TCP KẾT NỐI TRƯỚC KHI TRUYỀN:
═══════════════════════════════════════════════════════════════

  ┌──────────┐                        ┌──────────┐
  │  Client  │                        │  Server  │
  └────┬─────┘                        └────┬─────┘
       │     ── SYN ──────────────────►    │  ← Bước 1
       │     ◄── SYN+ACK ────────────     │  ← Bước 2
       │     ── ACK ──────────────────►    │  ← Bước 3
       │                                    │
       │  ══ KẾT NỐI ESTABLISHED ═════     │
       │                                    │
       │     ── Data ─────────────────►    │
       │     ◄── ACK ────────────────     │
       │     ◄── Data ───────────────     │
       │     ── ACK ──────────────────►    │
       │                                    │
  → PHẢI "bắt tay 3 bước" (3-way handshake) TRƯỚC
  → Đảm bảo cả hai bên SẴN SÀNG truyền tin cậy
```

#### ② Unicast Only — Chỉ hỗ trợ 1-to-1

```
TCP CHỈ HỖ TRỢ POINT-TO-POINT:
═══════════════════════════════════════════════════════════════

  ✅ TCP:  Client ◄────────────► Server (1 kết nối = 2 đầu)
  ❌ TCP KHÔNG hỗ trợ multicast hay broadcast

  → Mỗi kết nối TCP chỉ có 2 endpoints
  → Muốn gửi cho nhiều người → mở NHIỀU kết nối riêng
```

#### ③ Byte-Stream Oriented — Hướng byte stream

```
TCP TRUYỀN THEO DÒNG BYTE:
═══════════════════════════════════════════════════════════════

  UDP (message-oriented):
  ┌──────┐  ┌──────────┐  ┌────┐
  │ MSG1 │  │   MSG2   │  │MSG3│   ← Mỗi msg ĐỘC LẬP
  └──────┘  └──────────┘  └────┘

  TCP (byte-stream oriented):
  ┌──────────────────────────────────────┐
  │ M S G 1 M S G 2 M S G 3             │  ← Tất cả = 1 DÒNG
  └──────────────────────────────────────┘
  ↑ KHÔNG giữ biên giới giữa các messages!

  → TCP xem data như một DÒNG BYTES liên tục
  → Không phân biệt message nào là message nào
  → Application phải TỰ định nghĩa protocol để tách messages
```

#### ④ Reliable Transmission — Truyền tin cậy

```
TCP ĐẢM BẢO DATA ĐẾN ĐÚNG & ĐỦ:
═══════════════════════════════════════════════════════════════

  ┌──────────────────────────────────────────────────────────┐
  │                                                          │
  │  SEQUENCE NUMBER:                                        │
  │  → Mỗi byte được ĐÁNH SỐ → đúng thứ tự khi nhận       │
  │                                                          │
  │  ACKNOWLEDGMENT (ACK):                                   │
  │  → Receiver GỬI LẠI xác nhận cho mỗi byte nhận được    │
  │                                                          │
  │  TIMEOUT & RETRANSMIT:                                   │
  │  → Không nhận ACK trong RTT → GỬI LẠI                  │
  │  → RTT = Round-Trip Time (thời gian khứ hồi)           │
  │                                                          │
  │  Sender ── data (seq=100) ──► Receiver                  │
  │        ◄── ACK (ack=200) ───                            │
  │  "Đã nhận bytes 100-199, gửi tiếp từ 200!"              │
  │                                                          │
  └──────────────────────────────────────────────────────────┘
```

#### ⑤ Congestion Control — Kiểm soát tắc nghẽn

```
TCP TỰ ĐIỀU CHỈNH TỐC ĐỘ THEO MẠNG:
═══════════════════════════════════════════════════════════════

  Mạng tốt → TCP tăng tốc độ gửi
  Mạng xấu → TCP GIẢM tốc độ gửi → tránh tắc nghẽn thêm

  ┌──────────────────────────────────────────────────────────┐
  │  Tốc độ ▲                                                │
  │         │      ╱╲                                        │
  │         │     ╱  ╲     ╱╲                                │
  │         │    ╱    ╲   ╱  ╲                               │
  │         │   ╱      ╲ ╱    ╲                              │
  │         │  ╱        ╳      ╲                             │
  │         │ ╱                  ╲                            │
  │         └──────────────────────────── Thời gian ►        │
  │           ↑ Slow Start  ↑ Congestion detected            │
  └──────────────────────────────────────────────────────────┘
```

#### ⑥ Full-Duplex — Hai chiều hoàn toàn

```
TCP CHO PHÉP 2 CHIỀU ĐỒNG THỜI:
═══════════════════════════════════════════════════════════════

  ┌──────────────────────────────────────────────────────────┐
  │                                                          │
  │  Client ════════════════════════════ Server              │
  │         ──── data ────────────────►                     │
  │         ◄──── data ───────────────                      │
  │         ──── data ────────────────►                     │
  │         ◄──── data ───────────────                      │
  │                                                          │
  │  → Cả 2 bên đều có BUFFER để lưu tạm data              │
  │  → Có thể gửi data BẤT KỲ LÚC NÀO (không chờ)        │
  │  → MSS (Maximum Segment Size) quyết định kích thước    │
  │    tối đa mỗi segment                                   │
  │                                                          │
  └──────────────────────────────────────────────────────────┘
```

---

## 1. So Sánh TCP và UDP

> **🎯 Học xong phần này, bạn sẽ biết:**
>
> - Sự khác biệt giữa TCP và UDP (7 tiêu chí)
> - Khi nào dùng TCP, khi nào dùng UDP
> - Tại sao UDP không tin cậy (4 lý do)

### Bảng so sánh chi tiết

```
TCP vs UDP — SO SÁNH TOÀN DIỆN:
═══════════════════════════════════════════════════════════════

  ┌──────────────────┬─────────────────────┬─────────────────────┐
  │    Tiêu chí      │       UDP           │       TCP            │
  ├──────────────────┼─────────────────────┼─────────────────────┤
  │ Kết nối?         │ ❌ Connectionless   │ ✅ Connection-       │
  │                  │                     │    oriented          │
  ├──────────────────┼─────────────────────┼─────────────────────┤
  │ Tin cậy?         │ ❌ Unreliable       │ ✅ Reliable          │
  │                  │ Không flow control  │ Flow + congestion    │
  │                  │ Không congestion    │ control              │
  ├──────────────────┼─────────────────────┼─────────────────────┤
  │ Số đầu kết nối   │ 1-to-1, 1-to-many  │ Chỉ 1-to-1          │
  │                  │ many-to-1,          │ (point-to-point)     │
  │                  │ many-to-many        │                      │
  ├──────────────────┼─────────────────────┼─────────────────────┤
  │ Phương thức      │ Message-oriented    │ Byte-stream          │
  │ truyền           │ (giữ boundary)      │ (dòng liên tục)     │
  ├──────────────────┼─────────────────────┼─────────────────────┤
  │ Header overhead  │ 8 bytes (nhẹ!)      │ 20-60 bytes (nặng)  │
  ├──────────────────┼─────────────────────┼─────────────────────┤
  │ Tốc độ           │ 🚀 Nhanh           │ 🐢 Chậm hơn         │
  │                  │ (không chờ ACK)     │ (chờ ACK, retransmit)│
  ├──────────────────┼─────────────────────┼─────────────────────┤
  │ Ứng dụng         │ Video call, game,   │ File transfer,       │
  │                  │ live streaming,     │ email, web (HTTP),   │
  │                  │ DNS, VoIP           │ remote login         │
  └──────────────────┴─────────────────────┴─────────────────────┘
```

### Use Cases — Khi nào dùng gì?

```
CHỌN TCP HAY UDP?
═══════════════════════════════════════════════════════════════

  ┌──────────────────────────────────────────────────────────┐
  │  TCP — Khi CẦN ĐỘ CHÍNH XÁC:                           │
  │                                                          │
  │  ✅ File transfer     → Mất 1 byte = file hỏng         │
  │  ✅ Email (SMTP/POP3) → Nội dung phải đầy đủ           │
  │  ✅ Web (HTTP/HTTPS)  → HTML phải load đúng             │
  │  ✅ Remote login (SSH)→ Command phải chính xác          │
  │  ✅ Database queries  → Data phải toàn vẹn              │
  │                                                          │
  │  → Chấp nhận CHẬM hơn, nhưng ĐÚNG & ĐỦ                │
  └──────────────────────────────────────────────────────────┘

  ┌──────────────────────────────────────────────────────────┐
  │  UDP — Khi CẦN TỐC ĐỘ & REAL-TIME:                     │
  │                                                          │
  │  ✅ Video call (Zoom)  → Mất 1 frame = OK, lag = KHÔNG │
  │  ✅ Online gaming      → Latency thấp = ưu tiên        │
  │  ✅ Live streaming     → Mượt quan trọng hơn chất lượng │
  │  ✅ VoIP               → Giọng nói không thể đợi       │
  │  ✅ DNS                → Query nhỏ, cần nhanh          │
  │  ✅ Broadcast          → Gửi cho nhiều node cùng lúc    │
  │                                                          │
  │  → Chấp nhận MẤT MÁT nhỏ, nhưng NHANH & REAL-TIME     │
  └──────────────────────────────────────────────────────────┘
```

### Tại sao UDP không tin cậy? (4 lý do)

```
4 LÝ DO UDP UNRELIABLE:
═══════════════════════════════════════════════════════════════

  ┌──────────────────────────────────────────────────────────┐
  │                                                          │
  │  ① KHÔNG đảm bảo giao hàng:                              │
  │     → Không confirmation, không retransmission           │
  │     → Không timeout → không biết đã mất gói chưa        │
  │                                                          │
  │  ② KHÔNG đảm bảo thứ tự:                                 │
  │     → Không đánh số thứ tự gói tin                       │
  │     → Không sắp xếp lại (reorder)                       │
  │     → Không bị head-of-line blocking                    │
  │                                                          │
  │  ③ KHÔNG theo dõi trạng thái kết nối:                    │
  │     → Không cần thiết lập connection                    │
  │     → Không cần restart state machine                   │
  │                                                          │
  │  ④ KHÔNG có congestion control:                           │
  │     → Không có cơ chế phản hồi từ client hay network    │
  │     → Mạng tắc → vẫn gửi cùng tốc độ → mất gói thêm   │
  │                                                          │
  │  TÓM LẠI:                                                │
  │  UDP = "Fire and forget" (bắn rồi quên)                 │
  │  TCP = "Guaranteed delivery" (đảm bảo giao hàng)        │
  │                                                          │
  └──────────────────────────────────────────────────────────┘
```

---

## 2. Sequence Number là gì?

> **Định nghĩa**: Sequence Number (seq) là một số 32-bit được gán cho mỗi byte dữ liệu trong TCP, dùng để đánh dấu vị trí của byte đó trong toàn bộ stream dữ liệu.

### Tại Sao Cần Sequence Number?

```
┌─────────────────────────────────────────────────────────────────┐
│                   VẤN ĐỀ CỦA MẠNG                               │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Khi gửi dữ liệu qua mạng, các gói tin có thể:                  │
│                                                                 │
│  1️⃣  ĐẾN KHÔNG THEO THỨ TỰ (Out-of-order)                       │
│      → Gói 3 đến trước gói 2                                    │
│                                                                 │
│  2️⃣  BỊ MẤT (Packet loss)                                       │
│      → Gói 2 không bao giờ đến                                  │
│                                                                 │
│  3️⃣  BỊ TRÙNG LẶP (Duplicate)                                   │
│      → Gói 1 được gửi lại nhưng bản gốc cũng đến                │
│                                                                 │
│  ⚠️  Không có Sequence Number → KHÔNG THỂ sắp xếp lại!          │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 3 Mục Đích Chính Của Sequence Number

```
┌─────────────────────────────────────────────────────────────────┐
│  1️⃣  SẮP XẾP LẠI ĐÚNG THỨ TỰ                                     │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Sender gửi:    [Seg1: seq=0] [Seg2: seq=100] [Seg3: seq=200]   │
│  Network:        Seg3 đến trước, Seg1 đến sau, Seg2 cuối cùng   │
│  Receiver nhận: [Seg3] [Seg1] [Seg2] → sắp xếp lại bằng seq     │
│  Kết quả:       [Seg1: seq=0] [Seg2: seq=100] [Seg3: seq=200]   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│  2️⃣  PHÁT HIỆN MẤT GÓI (Missing Segments)                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Receiver nhận: [seq=0] [seq=200] ← Thiếu seq=100!              │
│                                                                 │
│  → Receiver biết segment seq=100 bị mất                         │
│  → Gửi ACK cho seq=0, KHÔNG gửi ACK cho seq=200                 │
│  → Sender timeout và gửi lại seq=100                            │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│  3️⃣  LOẠI BỎ GÓI TRÙNG LẶP (Duplicate Detection)                │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Sender gửi lại vì timeout, nhưng gói gốc vẫn đến:              │
│  Receiver nhận: [seq=100] ... [seq=100] (lần 2)                 │
│                                                                 │
│  → Receiver thấy seq=100 đã nhận rồi                            │
│  → Bỏ qua gói trùng lặp, không gửi lên app 2 lần                │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Ví Dụ Cụ Thể

```
Ứng dụng muốn gửi: "HELLO WORLD" (11 bytes)

TCP chia thành segments và đánh số:
┌──────────────────────────────────────────────────────────────┐
│ Segment 1: seq=0,   data="HELLO" (5 bytes)   → bytes 0-4    │
│ Segment 2: seq=5,   data=" WOR"  (4 bytes)   → bytes 5-8    │
│ Segment 3: seq=9,   data="LD"    (2 bytes)   → bytes 9-10   │
└──────────────────────────────────────────────────────────────┘

📌 seq = vị trí byte đầu tiên của segment trong toàn bộ stream
   (KHÔNG PHẢI số thứ tự gói tin!)
```

### Initial Sequence Number (ISN)

```
┌─────────────────────────────────────────────────────────────────┐
│  TẠI SAO SỐ BẮT ĐẦU LÀ NGẪU NHIÊN?                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ISN = Initial Sequence Number (số seq ban đầu)                 │
│                                                                 │
│  ❌ Nếu luôn bắt đầu từ 0:                                      │
│     → Hacker có thể đoán được seq → TCP Hijacking attack        │
│     → Gói tin cũ từ connection trước có thể gây nhầm lẫn        │
│                                                                 │
│  ✅ Dùng số ngẫu nhiên (ISN):                                   │
│     → Khó đoán, bảo mật hơn                                     │
│     → Mỗi connection khác nhau → tránh nhầm lẫn gói cũ          │
│                                                                 │
│  Trong 3-way handshake:                                         │
│  • Client chọn ISN = j (ngẫu nhiên)                             │
│  • Server chọn ISN = k (ngẫu nhiên)                             │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Sequence Number vs Acknowledgment Number

| Field       | Ý Nghĩa                                     | Ví Dụ                           |
| ----------- | ------------------------------------------- | ------------------------------- |
| **seq**     | "Byte đầu tiên tôi gửi có vị trí này"       | seq=100                         |
| **ack**     | "Tôi đã nhận hết đến byte này, gửi tiếp đi" | ack=200                         |
| **seq+len** | Byte cuối = seq + data length - 1           | seq=100, len=50 → bytes 100-149 |

```
Sender                                          Receiver
   │                                               │
   │  seq=100, data=50 bytes (bytes 100-149)       │
   │ ─────────────────────────────────────────────►│
   │                                               │
   │ ◄───────────────── ack=150 ──────────────────│
   │  ("Đã nhận 100-149, gửi tiếp từ 150")         │
   │                                               │
   │  seq=150, data=30 bytes (bytes 150-179)       │
   │ ─────────────────────────────────────────────►│
   │                                               │
   │ ◄───────────────── ack=180 ──────────────────│
   │  ("Đã nhận đến 179, gửi tiếp từ 180")         │
```

### Tóm Tắt

| Câu Hỏi                    | Trả Lời                                                        |
| -------------------------- | -------------------------------------------------------------- |
| **Sequence Number là gì?** | Số 32-bit đánh dấu vị trí của byte trong data stream           |
| **Tại sao cần?**           | Sắp xếp thứ tự, phát hiện mất gói, loại bỏ trùng lặp           |
| **Tại sao ngẫu nhiên?**    | Bảo mật (chống TCP hijacking), tránh nhầm gói từ conn cũ       |
| **Khác ACK thế nào?**      | seq = "tôi gửi từ vị trí này", ack = "tôi nhận đến vị trí này" |

---

## 3. TCP Three-Way Handshake

> **Mục đích**: Thiết lập kết nối TCP giữa client và server, đồng bộ hóa sequence numbers và xác nhận cả hai bên sẵn sàng giao tiếp.

### Tổng Quan

```
Client                                          Server
   │                                               │
   │           Trạng thái: CLOSED                  │ Trạng thái: LISTEN
   │                                               │
   │ ────────── 1. SYN (seq=j) ──────────────────► │
   │           Trạng thái: SYN_SENT                │
   │                                               │
   │ ◄───────── 2. SYN+ACK (seq=k, ack=j+1) ────── │
   │                                               │ Trạng thái: SYN_RECV
   │                                               │
   │ ────────── 3. ACK (ack=k+1) ─────────────────►│
   │           Trạng thái: ESTABLISHED             │ Trạng thái: ESTABLISHED
   │                                               │
   │ ═══════════ Bắt đầu truyền dữ liệu ═══════════│
```

### Chi Tiết Từng Bước

#### Bước 1: Client → Server (SYN)

```
┌─────────────────────────────────────────────────────────────┐
│  Client gửi gói SYN đến Server                              │
├─────────────────────────────────────────────────────────────┤
│  • SYN = 1 (cờ đồng bộ)                                     │
│  • seq = j (sequence number ngẫu nhiên của client)          │
│  • Client chuyển sang trạng thái: SYN_SENT                  │
│  • Client chờ xác nhận từ server                            │
└─────────────────────────────────────────────────────────────┘

SYN = Synchronize Sequence Numbers
→ Mục đích: "Tôi muốn kết nối, sequence number của tôi bắt đầu từ j"
```

#### Bước 2: Server → Client (SYN + ACK)

```
┌─────────────────────────────────────────────────────────────┐
│  Server nhận SYN và phản hồi SYN+ACK                        │
├─────────────────────────────────────────────────────────────┤
│  • SYN = 1 (cờ đồng bộ - server cũng muốn đồng bộ)          │
│  • ACK = 1 (cờ xác nhận)                                    │
│  • seq = k (sequence number của server)                     │
│  • ack = j+1 (xác nhận đã nhận SYN của client)              │
│  • Server chuyển sang trạng thái: SYN_RECV                  │
└─────────────────────────────────────────────────────────────┘

→ Mục đích: "Tôi xác nhận yêu cầu của bạn (ack=j+1), và đây là
              sequence number của tôi (seq=k)"
```

#### Bước 3: Client → Server (ACK)

```
┌─────────────────────────────────────────────────────────────┐
│  Client xác nhận SYN của server                             │
├─────────────────────────────────────────────────────────────┤
│  • ACK = 1 (cờ xác nhận)                                    │
│  • ack = k+1 (xác nhận đã nhận SYN của server)              │
│  • Cả hai chuyển sang trạng thái: ESTABLISHED               │
│  • Kết nối TCP thiết lập thành công!                        │
└─────────────────────────────────────────────────────────────┘

→ Mục đích: "Tôi xác nhận sequence number của bạn, bắt đầu truyền data!"
```

### Lưu Ý Quan Trọng

> ⚠️ **Các gói tin trong quá trình handshake KHÔNG chứa dữ liệu thực tế.**  
> Chỉ sau khi hoàn thành 3 bước, client và server mới bắt đầu truyền dữ liệu.

### Bảng Tóm Tắt Trạng Thái

| Bước | Client State | Server State | Mô Tả                        |
| ---- | ------------ | ------------ | ---------------------------- |
| 0    | CLOSED       | LISTEN       | Server lắng nghe kết nối     |
| 1    | SYN_SENT     | LISTEN       | Client gửi SYN               |
| 2    | SYN_SENT     | SYN_RECV     | Server gửi SYN+ACK           |
| 3    | ESTABLISHED  | ESTABLISHED  | Client gửi ACK, kết nối xong |

---

## 4. TCP Four-Way Handshake

> **Mục đích**: Đóng kết nối TCP một cách graceful, đảm bảo cả hai bên đã gửi/nhận hết dữ liệu trước khi ngắt.

### Tổng Quan

```
Client                                          Server
   │                                               │
   │           Trạng thái: ESTABLISHED             │ Trạng thái: ESTABLISHED
   │                                               │
   │ ────────── 1. FIN (seq=u) ──────────────────► │
   │           Trạng thái: FIN-WAIT-1              │
   │                                               │
   │ ◄───────── 2. ACK (ack=u+1) ───────────────── │
   │           Trạng thái: FIN-WAIT-2              │ Trạng thái: CLOSE-WAIT
   │                                               │
   │                  [Server có thể tiếp tục      │
   │                   gửi dữ liệu còn lại]        │
   │                                               │
   │ ◄───────── 3. FIN (seq=w, ack=u+1) ────────── │
   │                                               │ Trạng thái: LAST-ACK
   │                                               │
   │ ────────── 4. ACK (ack=w+1) ─────────────────►│
   │           Trạng thái: TIME-WAIT               │ Trạng thái: CLOSED
   │                                               │
   │           [Chờ 2*MSL]                         │
   │           Trạng thái: CLOSED                  │
```

### Chi Tiết Từng Bước

#### Bước 1: Client → Server (FIN) - Yêu cầu đóng

```
┌─────────────────────────────────────────────────────────────┐
│  Client gửi gói FIN để yêu cầu đóng kết nối                 │
├─────────────────────────────────────────────────────────────┤
│  • FIN = 1 (cờ kết thúc)                                    │
│  • seq = u (= seq cuối của data + 1)                        │
│  • Client ngừng gửi dữ liệu                                 │
│  • Client chuyển sang trạng thái: FIN-WAIT-1                │
│                                                             │
│  ⚠️ Dù FIN không chứa data, nó vẫn tiêu tốn 1 sequence num  │
└─────────────────────────────────────────────────────────────┘

→ Ý nghĩa: "Tôi không còn dữ liệu để gửi nữa, muốn đóng kết nối"
```

#### Bước 2: Server → Client (ACK) - Xác nhận đã nhận FIN

```
┌─────────────────────────────────────────────────────────────┐
│  Server xác nhận đã nhận FIN của client                     │
├─────────────────────────────────────────────────────────────┤
│  • ACK = 1                                                  │
│  • ack = u+1 (xác nhận FIN của client)                      │
│  • seq = v (sequence number của server)                     │
│  • Server chuyển sang trạng thái: CLOSE-WAIT                │
│  • Client chuyển sang trạng thái: FIN-WAIT-2                │
│                                                             │
│  📌 Kết nối ở trạng thái HALF-CLOSED:                       │
│     - Client không gửi data nữa                             │
│     - Nhưng vẫn NHẬN được data từ server                    │
└─────────────────────────────────────────────────────────────┘

→ Ý nghĩa: "OK, tôi biết bạn muốn đóng. Nhưng chờ tôi gửi nốt data..."
```

#### Bước 3: Server → Client (FIN) - Server cũng đóng

```
┌─────────────────────────────────────────────────────────────┐
│  Server gửi FIN khi đã gửi xong dữ liệu còn lại             │
├─────────────────────────────────────────────────────────────┤
│  • FIN = 1                                                  │
│  • ack = u+1                                                │
│  • seq = w (có thể khác v vì server đã gửi thêm data)       │
│  • Server chuyển sang trạng thái: LAST-ACK                  │
│  • Server chờ ACK cuối cùng từ client                       │
└─────────────────────────────────────────────────────────────┘

→ Ý nghĩa: "Tôi cũng gửi xong rồi, đóng kết nối thôi"
```

#### Bước 4: Client → Server (ACK) - Xác nhận cuối cùng

```
┌─────────────────────────────────────────────────────────────┐
│  Client xác nhận FIN của server                             │
├─────────────────────────────────────────────────────────────┤
│  • ACK = 1                                                  │
│  • ack = w+1                                                │
│  • seq = u+1                                                │
│  • Client chuyển sang trạng thái: TIME-WAIT                 │
│                                                             │
│  ⏱️ Client phải chờ 2*MSL trước khi đóng hoàn toàn:         │
│     MSL = Maximum Segment Lifetime (thường 2 phút)          │
│     2*MSL = 4 phút (đảm bảo ACK được gửi thành công)        │
│                                                             │
│  • Sau 2*MSL, client chuyển sang: CLOSED                    │
└─────────────────────────────────────────────────────────────┘

→ Ý nghĩa: "OK, xác nhận. Chờ thêm chút để đảm bảo mọi thứ ổn..."
```

### Tại Sao Cần 4 Bước (Không Phải 3)?

```
┌─────────────────────────────────────────────────────────────┐
│  TCP là FULL-DUPLEX (hai chiều độc lập)                     │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Client ──────────────────► Server   (Chiều 1)              │
│  Client ◄────────────────── Server   (Chiều 2)              │
│                                                             │
│  Mỗi chiều cần đóng riêng:                                  │
│  • Bước 1-2: Đóng chiều Client → Server                     │
│  • Bước 3-4: Đóng chiều Server → Client                     │
│                                                             │
│  ⚠️ Không thể gộp vì sau bước 2, server có thể còn data!    │
└─────────────────────────────────────────────────────────────┘
```

### Bảng Tóm Tắt Trạng Thái

| Bước | Client State | Server State | Mô Tả                         |
| ---- | ------------ | ------------ | ----------------------------- |
| 0    | ESTABLISHED  | ESTABLISHED  | Kết nối đang hoạt động        |
| 1    | FIN-WAIT-1   | ESTABLISHED  | Client gửi FIN                |
| 2    | FIN-WAIT-2   | CLOSE-WAIT   | Server xác nhận, vẫn gửi data |
| 3    | FIN-WAIT-2   | LAST-ACK     | Server gửi FIN                |
| 4    | TIME-WAIT    | CLOSED       | Client xác nhận               |
| 5    | CLOSED       | -            | Sau 2\*MSL, client đóng       |

> 📌 **Server đóng kết nối TRƯỚC client** vì server không cần chờ TIME-WAIT.

---

## 5. Cơ Chế Đảm Bảo Truyền Dữ Liệu Tin Cậy

> **Câu hỏi phỏng vấn**: "TCP/IP đảm bảo truyền dữ liệu theo thứ tự và tin cậy như thế nào?"

### Các Cơ Chế Chính

```
┌─────────────────────────────────────────────────────────────┐
│           3 CƠ CHẾ ĐẢM BẢO TRUYỀN TIN CẬY                   │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  1️⃣  PHÂN ĐOẠN & ĐÁNH SỐ (Segmentation & Numbering)         │
│      → Chia byte stream thành segments, đánh số thứ tự      │
│                                                             │
│  2️⃣  XÁC NHẬN (ACK Reply)                                   │
│      → Receiver gửi ACK xác nhận đã nhận được data          │
│                                                             │
│  3️⃣  TIMEOUT & RETRANSMIT (Hết hạn & Gửi lại)              │
│      → Nếu không nhận ACK trong thời gian quy định, gửi lại │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Luồng Hoạt Động Chi Tiết

```
Sender                                          Receiver
   │                                               │
   │  1. Segment 1 (seq=0, data)                   │
   │     [Lưu vào buffer + bật timer]              │
   │ ─────────────────────────────────────────────►│
   │                                               │ 2. Kiểm tra CRC
   │                                               │    Nếu đúng → gửi cho app
   │ ◄───────────────────────────── ACK (ack=1) ───│ 3. Gửi ACK
   │  4. Nhận ACK → xóa buffer                     │
   │     [Dừng timer, giải phóng memory]           │
   │                                               │
   │  5. Segment 2 (seq=1, data)                   │
   │     [Lưu vào buffer + bật timer]              │
   │ ────────────────────────X (mất gói!)          │
   │                                               │
   │  [Timer hết hạn, không có ACK]                │
   │                                               │
   │  6. RETRANSMIT Segment 2                      │
   │ ─────────────────────────────────────────────►│
   │                                               │
   │ ◄───────────────────────── ACK (ack=2) ───────│
   │  7. Nhận ACK → xóa buffer                     │
```

### Quy Trình Ở Phía Sender

```javascript
// Pseudocode cho sender
function sendSegment(data, seqNum) {
  // 1. Lưu segment vào buffer (giữ lại để gửi lại nếu cần)
  buffer.save(seqNum, data);

  // 2. Bật timeout timer cho segment này
  timer.start(seqNum, TIMEOUT_DURATION);

  // 3. Gửi segment
  network.send({ seq: seqNum, data: data });
}

function onAckReceived(ackNum) {
  // 4. Nhận ACK → xóa buffer và dừng timer
  buffer.remove(ackNum - 1);
  timer.stop(ackNum - 1);
}

function onTimerExpired(seqNum) {
  // 5. Timeout → gửi lại segment
  retryCount++;
  if (retryCount <= MAX_RETRIES) {
    resend(seqNum);
  } else {
    abort("Max retries exceeded");
  }
}
```

### Quy Trình Ở Phía Receiver

```javascript
// Pseudocode cho receiver
function onSegmentReceived(segment) {
  // 1. Kiểm tra CRC (phát hiện lỗi bit)
  if (!crcCheck(segment)) {
    discard(segment); // Bỏ segment lỗi, không gửi ACK
    return;
  }

  // 2. Gửi data cho ứng dụng tầng trên
  application.deliver(segment.data);

  // 3. Gửi Cumulative ACK
  //    (xác nhận tất cả bytes đến segment này)
  send(ACK, segment.seq + 1);
}

// Piggybacking: Nếu receiver cũng có data gửi,
// ACK có thể gửi kèm trong data packet (tiết kiệm bandwidth)
function sendDataWithAck(data, ackNum) {
  send({ data: data, ACK: 1, ack: ackNum });
}
```

### Các Khái Niệm Quan Trọng

| Khái Niệm           | Giải Thích                                                    |
| ------------------- | ------------------------------------------------------------- |
| **Buffer**          | Bộ nhớ tạm lưu segments đã gửi, chờ ACK                       |
| **Timeout Timer**   | Đồng hồ đếm ngược cho mỗi segment                             |
| **Retransmit**      | Gửi lại segment khi timer hết mà chưa có ACK                  |
| **CRC Check**       | Kiểm tra lỗi bit trong segment bằng thuật toán CRC            |
| **Cumulative ACK**  | ACK xác nhận tất cả bytes đến vị trí đó (không phải từng gói) |
| **Piggybacking**    | Gửi ACK kèm trong gói data (tiết kiệm gói tin)                |
| **Sequence Number** | Số thứ tự để sắp xếp lại segments đúng thứ tự                 |
| **Maximum Retries** | Số lần gửi lại tối đa trước khi từ bỏ                         |

### Sơ Đồ Tổng Hợp

```
┌────────────────────────────────────────────────────────────────┐
│                    TCP RELIABLE DELIVERY                       │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│   SENDER SIDE                      RECEIVER SIDE               │
│  ┌─────────────┐                  ┌─────────────┐              │
│  │ Application │                  │ Application │              │
│  │    Data     │                  │    Data     │              │
│  └──────┬──────┘                  └──────▲──────┘              │
│         │                                │                     │
│         ▼                                │                     │
│  ┌─────────────┐                  ┌─────────────┐              │
│  │  Segment &  │    Network       │  CRC Check  │              │
│  │   Number    │ ───────────────► │  Reassemble │              │
│  └──────┬──────┘                  └──────┬──────┘              │
│         │                                │                     │
│         ▼                                │                     │
│  ┌─────────────┐                  ┌──────┴──────┐              │
│  │   Buffer    │ ◄──── ACK ────── │  Send ACK   │              │
│  │  + Timer    │                  │             │              │
│  └─────────────┘                  └─────────────┘              │
│         │                                                      │
│         ▼                                                      │
│  ┌─────────────┐                                               │
│  │ Timeout?    │                                               │
│  │ Retransmit! │                                               │
│  └─────────────┘                                               │
│                                                                │
└────────────────────────────────────────────────────────────────┘
```

---

## 6. TCP Retransmission — Cơ Chế Truyền Lại

> **🎯 Học xong phần này, bạn sẽ biết:**
>
> - TCP retransmit dựa trên 2 cơ chế: time-based và ACK-based
> - Khi nào TCP quyết định gửi lại gói tin

### TCP thấy gì mà phải gửi lại?

```
TẠI SAO CẦN RETRANSMISSION?
═══════════════════════════════════════════════════════════════

  Tầng Network (IP) bên dưới TCP CÓ THỂ:
  ┌──────────────────────────────────────────────────────────┐
  │ ① Mất gói (packet loss)     → Gói tin biến mất         │
  │ ② Bit lỗi (bit error)      → Nội dung bị sai          │
  │ ③ Đến sai thứ tự (reorder) → Gói 3 đến trước gói 2    │
  │ ④ Trùng lặp (duplicate)    → Gói tin bị copy           │
  └──────────────────────────────────────────────────────────┘

  → TCP phải TỰ XỬ LÝ tất cả các tình huống trên!
  → Dùng 2 CƠ CHẾ RETRANSMISSION:
```

### 2 Cơ chế Retransmission

```
CƠ CHẾ 1: DỰA TRÊN THỜI GIAN (Timer-Based):
═══════════════════════════════════════════════════════════════

  Sender                                    Receiver
     │                                          │
     │ ── Segment (seq=100) ──────────────►     │
     │    [BẬT TIMER ⏱️]                        │
     │                                          │
     │    ... chờ ... chờ ... TIMEOUT! ⏱️💥      │
     │    (Không nhận được ACK)                  │
     │                                          │
     │ ── RETRANSMIT (seq=100) ───────────►    │
     │    [BẬT TIMER mới, TĂNG GẤP ĐÔI timeout]│
     │                                          │
     │ ◄── ACK ────────────────────────────    │
     │    ✅ OK!                                 │

  QUY TẮC:
  → Gửi data → bật timer
  → Không có ACK trong timeout → GỬI LẠI
  → Mỗi lần retry → timeout NHÂN ĐÔI (exponential backoff)
  → Vượt quá số lần retry tối đa → TCP RESET (ngắt kết nối)


CƠ CHẾ 2: DỰA TRÊN ACK (Acknowledgment-Based / Fast Retransmit):
═══════════════════════════════════════════════════════════════

  Sender                                    Receiver
     │                                          │
     │ ── Seg 1 (seq=100) ───────────────►     │
     │ ── Seg 2 (seq=200) ─────── X MẤT!       │
     │ ── Seg 3 (seq=300) ───────────────►     │
     │ ── Seg 4 (seq=400) ───────────────►     │
     │                                          │
     │ ◄── ACK (ack=200) ──── "Cần seq=200"   │ ← Duplicate ACK #1
     │ ◄── ACK (ack=200) ──── "Vẫn cần 200"   │ ← Duplicate ACK #2
     │ ◄── ACK (ack=200) ──── "Vẫn cần 200!"  │ ← Duplicate ACK #3
     │                                          │
     │ ── FAST RETRANSMIT (seq=200) ───────►   │ ← Không chờ timeout!
     │                                          │
     │ ◄── ACK (ack=500) ─────────────────    │ ← Cumulative ACK

  QUY TẮC:
  → Nhận 3 DUPLICATE ACKs → GỬI LẠI NGAY
  → KHÔNG cần chờ timer hết hạn
  → Nhanh hơn timer-based rất nhiều!
```

---

## 7. TCP Congestion Control — Kiểm Soát Tắc Nghẽn

> **🎯 Học xong phần này, bạn sẽ biết:**
>
> - 4 thuật toán congestion control: Slow Start, Congestion Avoidance, Fast Retransmit, Fast Recovery
> - cwnd và ssthresh là gì và hoạt động ra sao

### Tổng quan 4 cơ chế

```
TCP CONGESTION CONTROL — 4 CƠ CHẾ:
═══════════════════════════════════════════════════════════════

  ┌──────────────────────────────────────────────────────────┐
  │                                                          │
  │  ① Slow Start          → Tăng TỐC ĐỘ từ nhỏ lên       │
  │  ② Congestion Avoidance→ Tăng CHẬM để tránh tắc        │
  │  ③ Fast Retransmit     → Gửi lại NHANH khi mất gói     │
  │  ④ Fast Recovery       → Hồi phục NHANH sau tắc nghẽn  │
  │                                                          │
  │  2 BIẾN SỐ QUAN TRỌNG:                                  │
  │  → cwnd (Congestion Window): kích thước cửa sổ tắc nghẽn│
  │  → ssthresh (Slow Start Threshold): ngưỡng slow start   │
  │                                                          │
  └──────────────────────────────────────────────────────────┘
```

### (1) Slow Start — Khởi đầu chậm

```
SLOW START — BẮT ĐẦU TỪ NHỎ, TĂNG GẤP ĐÔI:
═══════════════════════════════════════════════════════════════

  Ban đầu: cwnd = 1 MSS (Maximum Segment Size)

  ┌──────────────────────────────────────────────────────────┐
  │                                                          │
  │  RTT 1:  cwnd = 1   → Gửi 1 segment                    │
  │  RTT 2:  cwnd = 2   → Gửi 2 segments                   │
  │  RTT 3:  cwnd = 4   → Gửi 4 segments                   │
  │  RTT 4:  cwnd = 8   → Gửi 8 segments                   │
  │  RTT 5:  cwnd = 16  → Gửi 16 segments                  │
  │                                                          │
  │  → Tăng theo LŨY THỪA (exponential): 1, 2, 4, 8, 16... │
  │  → Gọi là "slow start" nhưng TĂNG RẤT NHANH!           │
  │  → "Slow" vì bắt đầu từ 1, không phải gửi ào ào       │
  │                                                          │
  └──────────────────────────────────────────────────────────┘

  CHUYỂN GIAI ĐOẠN:
  ┌──────────────────────────────────────────────────────────┐
  │  Khi cwnd < ssthresh  → Dùng Slow Start (tăng gấp đôi) │
  │  Khi cwnd = ssthresh  → Có thể dùng Slow Start hoặc    │
  │                         Congestion Avoidance             │
  │  Khi cwnd > ssthresh  → Dùng Congestion Avoidance       │
  └──────────────────────────────────────────────────────────┘
```

### (2) Congestion Avoidance — Tránh tắc nghẽn

```
CONGESTION AVOIDANCE — TĂNG TUYẾN TÍNH:
═══════════════════════════════════════════════════════════════

  Khi cwnd >= ssthresh:
  → Không tăng gấp đôi nữa (quá nhanh → tắc!)
  → Tăng TUYẾN TÍNH: mỗi RTT tăng thêm 1 MSS

  ┌──────────────────────────────────────────────────────────┐
  │                                                          │
  │  RTT 1:  cwnd = 16  (đã qua slow start)                 │
  │  RTT 2:  cwnd = 17                                       │
  │  RTT 3:  cwnd = 18                                       │
  │  RTT 4:  cwnd = 19                                       │
  │  ...                                                     │
  │  → Tăng DẦN DẦN, mạng ÍT bị tắc hơn                   │
  │                                                          │
  └──────────────────────────────────────────────────────────┘

  KHI PHÁT HIỆN TẮC NGHẼN (mất ACK = timeout):
  ┌──────────────────────────────────────────────────────────┐
  │  ① ssthresh = cwnd / 2  (giảm ngưỡng xuống 1 nửa)      │
  │  ② cwnd = 1             (reset về 1)                     │
  │  ③ Chạy lại Slow Start                                  │
  └──────────────────────────────────────────────────────────┘

  ĐỒ THỊ:
  cwnd ▲
       │            ╱ ssthresh
       │     ╱╱╱╱╱╱╱·····    ← Congestion Avoidance (tuyến tính)
       │    ╱        ·
       │   ╱         · ← Timeout! cwnd reset về 1
       │  ╱          ·
       │ ╱           ·  ╱╱╱╱╱╱╱····
       │╱            · ╱        ·
       └─────────────·──────────·──────► Thời gian
                     ↑           ↑
              Tắc nghẽn    Tắc nghẽn lần 2
```

### (3) Fast Retransmit — Truyền lại nhanh

```
FAST RETRANSMIT — KHÔNG CHỜ TIMEOUT:
═══════════════════════════════════════════════════════════════

  NGUYÊN TẮC:
  → Receiver nhận segment SẢI THỨ TỰ
  → GỬI NGAY duplicate ACK cho segment cuối cùng đúng thứ tự
  → Sender nhận 3 DUPLICATE ACKs → gửi lại NGAY

  Sender                                    Receiver
     │                                          │
     │ ── Seg 1 ──────────────────────────►    │
     │ ◄── ACK=2 ────────────────────────     │
     │ ── Seg 2 ─────── X (MẤT!)               │
     │ ── Seg 3 ──────────────────────────►    │
     │ ◄── ACK=2 (dup #1) ──────────────     │ ← "Tôi cần seg 2!"
     │ ── Seg 4 ──────────────────────────►    │
     │ ◄── ACK=2 (dup #2) ──────────────     │ ← "Vẫn cần seg 2!"
     │ ── Seg 5 ──────────────────────────►    │
     │ ◄── ACK=2 (dup #3) ──────────────     │ ← "VẪN CẦN SEG 2!"
     │                                          │
     │ ══ 3 Duplicate ACKs → FAST RETRANSMIT!══│
     │ ── Seg 2 (retransmit) ────────────►     │
     │ ◄── ACK=6 ────────────────────────     │ ← Cumulative ACK
     │                                          │

  ƯU ĐIỂM:
  → KHÔNG cần chờ timer timeout (có thể rất lâu)
  → Gửi lại NHANH hơn → tổng throughput CAO hơn
```

### (4) Fast Recovery — Hồi phục nhanh

```
FAST RECOVERY — KHÔNG RESET VỀ 1:
═══════════════════════════════════════════════════════════════

  KHI NHẬN 3 DUPLICATE ACKs:
  ┌──────────────────────────────────────────────────────────┐
  │                                                          │
  │  ① ssthresh = cwnd / 2  (giảm ngưỡng 1 nửa)            │
  │  ② cwnd = ssthresh      (KHÔNG reset về 1!)             │
  │  ③ Chạy Congestion Avoidance (tăng tuyến tính)         │
  │                                                          │
  │  LÝ DO: Nếu nhận được 3 duplicate ACKs                  │
  │  → Mạng VẪN HOẠT ĐỘNG (các segment khác đến được)      │
  │  → Không phải tắc nghẽn NẶNG → không cần reset về 1    │
  │                                                          │
  └──────────────────────────────────────────────────────────┘

  SO SÁNH 2 TÌNH HUỐNG:
  ┌──────────────────────────────────────────────────────────┐
  │                                                          │
  │  TIMEOUT (tắc nghẽn nặng):                               │
  │  → ssthresh = cwnd / 2                                   │
  │  → cwnd = 1  ← RESET!                                   │
  │  → Chạy Slow Start                                      │
  │                                                          │
  │  3 DUP ACKs (tắc nghẽn nhẹ):                            │
  │  → ssthresh = cwnd / 2                                   │
  │  → cwnd = ssthresh ← KHÔNG reset!                       │
  │  → Chạy Congestion Avoidance                            │
  │                                                          │
  └──────────────────────────────────────────────────────────┘
```

### Biểu đồ tổng hợp Congestion Control

```
TỔNG HỢP 4 CƠ CHẾ:
═══════════════════════════════════════════════════════════════

  cwnd ▲
   24  │                              ╱·
   22  │                             ╱ ·
   20  │                            ╱  ·
   18  │                    ╱╱╱╱╱╱╱╱   · ← ssthresh mới = 12
   16  │            ╱╱╱╱╱╱╱    ↑       ·
   14  │     ╱╱╱╱╱╱╱    CA    3dup     ·
   12  │ ╱╱╱╱ ↑                ACKs    · ╱╱╱╱╱╱╱╱
   10  │╱  ssthresh=12          ↓      ·╱    ↑
    8  ║                   ssthresh=12 ·  Fast Recovery
    6  ║                               · (cwnd=ssthresh)
    4  ║ ← Slow Start                  ·  + CA
    2  ║  (exponential)                ·
    1  ╠───────────────────────────────·──────────► RTT
       │    ↑                          ↑
       │  cwnd=1                  cwnd=ssthresh
       │  (ban đầu)              (KHÔNG reset!)

  LEGEND:
  ║ = Slow Start (exponential growth)
  ╱ = Congestion Avoidance (linear growth)
  · = Congestion event (packet loss detected)
```

---

## 8. TCP Flow Control — Kiểm Soát Luồng

> **🎯 Học xong phần này, bạn sẽ biết:**
>
> - Flow control dùng sliding window hoạt động thế nào
> - Zero window và window advertisement là gì

### Mục đích

```
FLOW CONTROL — TRÁNH SENDER GỬI QUÁ NHANH:
═══════════════════════════════════════════════════════════════

  VẤN ĐỀ: Sender nhanh, Receiver chậm
  ┌──────────────────────────────────────────────────────────┐
  │                                                          │
  │  Sender (máy mạnh)     →  Receiver (máy yếu)           │
  │  Gửi 1000 packets/s       Chỉ xử lý 100 packets/s      │
  │                                                          │
  │  → Buffer Receiver đầy → Packets bị DROP                │
  │  → Sender retransmit → Tốn bandwidth vô ích            │
  │                                                          │
  └──────────────────────────────────────────────────────────┘

  GIẢI PHÁP: SLIDING WINDOW (Cửa sổ trượt)
  → Receiver THÔNG BÁO cho Sender biết còn bao nhiêu chỗ
  → Sender chỉ gửi VỪA ĐỦ, không gửi quá
```

### Cơ chế hoạt động

```
SLIDING WINDOW FLOW CONTROL:
═══════════════════════════════════════════════════════════════

  Bước 1: Thiết lập kết nối
  ┌──────────────────────────────────────────────────────────┐
  │  Mỗi bên cấp phát BUFFER để lưu data đến                │
  │  Gửi kích thước buffer cho bên kia (window size)        │
  └──────────────────────────────────────────────────────────┘

  Bước 2: Truyền data bình thường
  ┌──────────────────────────────────────────────────────────┐
  │                                                          │
  │  Sender ── data (1000 bytes) ──► Receiver               │
  │         ◄── ACK + Window=5000 ──                        │
  │  "Tôi đã nhận, còn trống 5000 bytes"                    │
  │                                                          │
  │  Sender ── data (2000 bytes) ──► Receiver               │
  │         ◄── ACK + Window=3000 ──                        │
  │  "Còn trống 3000 bytes"                                  │
  │                                                          │
  │  → MỖI ACK đều kèm WINDOW SIZE (kích thước cửa sổ)    │
  │  → Đây gọi là WINDOW ADVERTISEMENT                      │
  │                                                          │
  └──────────────────────────────────────────────────────────┘

  Bước 3: Buffer đầy → Zero Window
  ┌──────────────────────────────────────────────────────────┐
  │                                                          │
  │  Sender ── data ──► Receiver (buffer gần đầy)           │
  │         ◄── ACK + Window=0 ──                           │
  │  "Buffer ĐẦY! NGỪNG GỬI!"                               │
  │                                                          │
  │  Sender: DỪNG gửi data                                  │
  │  ...chờ...                                               │
  │                                                          │
  │  (Receiver xử lý xong, giải phóng buffer)               │
  │         ◄── ACK + Window=4000 ──                        │
  │  "Có chỗ rồi, gửi tiếp đi!"                             │
  │                                                          │
  │  Sender: TIẾP TỤC gửi data                              │
  │                                                          │
  └──────────────────────────────────────────────────────────┘

  TÓM LẠI:
  ┌──────────────────────────────────────────────────────────┐
  │ ✅ App đọc nhanh → window TĂNG → Sender gửi NHANH hơn │
  │ ✅ App đọc chậm → window GIẢM → Sender gửi CHẬM lại   │
  │ ✅ Buffer đầy   → window = 0  → Sender DỪNG gửi       │
  │ ✅ Buffer trống → window > 0  → Sender GỬI TIẾP       │
  └──────────────────────────────────────────────────────────┘
```

---

## 9. TCP Reliable Transmission — Truyền Tin Cậy (ARQ + Sliding Window)

> **🎯 Học xong phần này, bạn sẽ biết:**
>
> - TCP dùng ARQ + Sliding Window thế nào cho reliable transmission
> - Sending window, cumulative ACK, và fast retransmit phối hợp ra sao

### Cơ chế chi tiết

```
TCP RELIABLE TRANSMISSION — SENDING WINDOW:
═══════════════════════════════════════════════════════════════

  SENDING WINDOW (Cửa sổ gửi) của Sender:
  ┌──────────────────────────────────────────────────────────┐
  │                                                          │
  │  ┌─────┬─────┬─────┬─────┬─────┬─────┬─────┬─────┐      │
  │  │  1  │  2  │  3  │  4  │  5  │  6  │  7  │  8  │      │
  │  └─────┴─────┴─────┴─────┴─────┴─────┴─────┴─────┘      │
  │  ╚═══╝  ╚═══════════════════╝  ╚═══════════════╝        │
  │  Đã gửi,  │                    │                         │
  │  đã ACK   │ SENDING WINDOW     │ Chưa được phép gửi     │
  │            │ ┌───────┬────────┐ │                         │
  │            │ │Đã gửi,│Được    │ │                         │
  │            │ │chưa   │phép gửi│ │                         │
  │            │ │ACK    │chưa gửi│ │                         │
  │            │ └───────┴────────┘ │                         │
  │            ╚════════════════════╝                         │
  │                                                          │
  └──────────────────────────────────────────────────────────┘

  QUY TRÌNH:
  ┌──────────────────────────────────────────────────────────┐
  │                                                          │
  │  ① Sender gửi TẤT CẢ segments trong window TUẦN TỰ     │
  │  ② BẬT TIMER cho segment gửi sớm nhất chưa có ACK      │
  │  ③ Khi nhận ACK → CỬA SỔ TRƯỢT sang phải              │
  │     → Header window di chuyển đến vị trí sau ACK        │
  │  ④ Nếu còn segments chưa ACK → RESET timer             │
  │  ⑤ Nếu tất cả đã ACK → TẮT timer                      │
  │  ⑥ Timer hết → RETRANSMIT tất cả chưa ACK              │
  │     + timeout NHÂN ĐÔI                                  │
  │  ⑦ Nhận 3 DUP ACKs → FAST RETRANSMIT                   │
  │     (gửi lại segment bị mất, KHÔNG chờ timeout)         │
  │                                                          │
  └──────────────────────────────────────────────────────────┘
```

### Receiver — Cumulative ACK

```
RECEIVER — CUMULATIVE ACKNOWLEDGMENT:
═══════════════════════════════════════════════════════════════

  ┌──────────────────────────────────────────────────────────┐
  │                                                          │
  │  IN-ORDER segment:                                       │
  │  → Gửi ACK cho segment đó                               │
  │  → ACK = "tôi nhận ĐẾN ĐÂY, gửi tiếp từ vị trí này"  │
  │                                                          │
  │  OUT-OF-ORDER segment:                                   │
  │  → BỎ QUA segment (hoặc cache — tùy implementation)     │
  │  → Gửi ACK cho segment CUỐI CÙNG đúng thứ tự           │
  │                                                          │
  │  Ví dụ:                                                  │
  │  Nhận: Seg1, Seg2, Seg4, Seg5 (thiếu Seg3)             │
  │  → ACK cho Seg1: ack=2                                  │
  │  → ACK cho Seg2: ack=3                                  │
  │  → ACK cho Seg4: ack=3 (DUP! vì Seg3 chưa đến)        │
  │  → ACK cho Seg5: ack=3 (DUP! vẫn cần Seg3)            │
  │                                                          │
  │  → Cumulative ACK đảm bảo: tất cả segments TRƯỚC       │
  │    ack number đã đến ĐẦY ĐỦ và đúng THỨ TỰ            │
  │                                                          │
  └──────────────────────────────────────────────────────────┘
```

### Kích thước Sending Window

```
SENDING WINDOW SIZE — AI QUYẾT ĐỊNH?
═══════════════════════════════════════════════════════════════

  ┌──────────────────────────────────────────────────────────┐
  │                                                          │
  │  Sending Window = min(rwnd, cwnd)                        │
  │                                                          │
  │  rwnd = Receiver Window (do Receiver thông báo)         │
  │  cwnd = Congestion Window (do thuật toán tắc nghẽn)     │
  │                                                          │
  │  → Window KHẢ BIẾN: thay đổi theo tình trạng mạng      │
  │    VÀ khả năng xử lý của Receiver                       │
  │                                                          │
  │  ĐẶC BIỆT:                                               │
  │  TCP thực tế = Sliding Window + Selective Repeat         │
  │  → Nhiều implementation CACHE out-of-order segments      │
  │  → Chỉ retransmit segment BỊ MẤT (không phải toàn bộ)  │
  │  → Hybrid approach hiệu quả hơn pure sliding window    │
  │                                                          │
  └──────────────────────────────────────────────────────────┘
```

---

## 10. TCP Packet Merging — Dính Gói & Xử Lý

> **🎯 Học xong phần này, bạn sẽ biết:**
>
> - TCP packet merging (dính gói) là gì và tại sao xảy ra
> - Nagle's Algorithm hoạt động thế nào
> - 3 giải pháp xử lý dính gói

### TCP Packet Merging là gì?

```
PACKET MERGING = DÍNH GÓI:
═══════════════════════════════════════════════════════════════

  Mặc định, TCP dùng NAGLE'S ALGORITHM:
  → Buffer data trước khi gửi
  → Gộp nhiều lần send() thành 1 packet lớn
  → Giảm I/O overhead → TĂNG hiệu suất

  VÍ DỤ:
  Sender gọi 2 lần send():
  ┌──────────────────────────────────────────────────────────┐
  │  send(data1);  // "Hello"                                │
  │  send(data2);  // "World"                                │
  └──────────────────────────────────────────────────────────┘

  4 KỊCH BẢN Ở RECEIVER:
  ┌──────────────────────────────────────────────────────────┐
  │                                                          │
  │  A. BÌNH THƯỜNG — nhận riêng biệt:                      │
  │     [data1] rồi [data2]                                  │
  │     → Dễ xử lý ✅                                       │
  │                                                          │
  │  B. DÍNH GÓI — phần đầu data1 + phần cuối:              │
  │     [data1_part1] rồi [data1_part2 + data2]             │
  │     → Khó tách! ❌                                       │
  │                                                          │
  │  C. DÍNH GÓI — data1 full + phần đầu data2:             │
  │     [data1 + data2_part1] rồi [data2_part2]             │
  │     → Khó tách! ❌                                       │
  │                                                          │
  │  D. DÍNH GÓI — nhận cả 2 cùng lúc:                      │
  │     [data1 + data2]                                      │
  │     → Khó tách! ❌                                       │
  │                                                          │
  │  B, C, D = PACKET MERGING (dính gói)                    │
  │                                                          │
  └──────────────────────────────────────────────────────────┘
```

### 3 Giải pháp xử lý dính gói

```
GIẢI PHÁP PACKET MERGING:
═══════════════════════════════════════════════════════════════

  ┌──────────────────────────────────────────────────────────┐
  │  GIẢI PHÁP 1: CHỜ TRƯỚC KHI GỬI                        │
  │                                                          │
  │  send(data1);                                            │
  │  await delay(100);  // chờ 100ms                         │
  │  send(data2);                                            │
  │                                                          │
  │  ✅ Đơn giản                                             │
  │  ❌ Chậm, không phù hợp high-frequency                  │
  │  → Chỉ dùng khi tần suất gửi RẤT THẤP                 │
  └──────────────────────────────────────────────────────────┘

  ┌──────────────────────────────────────────────────────────┐
  │  GIẢI PHÁP 2: TẮT NAGLE ALGORITHM                       │
  │                                                          │
  │  // Node.js:                                             │
  │  socket.setNoDelay(true);                                │
  │                                                          │
  │  → Mỗi send() → gửi NGAY, không buffer                 │
  │  ✅ Không bị dính gói phía sender                       │
  │  ❌ Vẫn có thể dính ở phía client (network issue)       │
  │  ❌ Tăng số lượng small packets → giảm hiệu suất       │
  │  → Phù hợp: data lớn, tần suất vừa phải               │
  └──────────────────────────────────────────────────────────┘

  ┌──────────────────────────────────────────────────────────┐
  │  GIẢI PHÁP 3: PACKET ENCAPSULATION (Đóng gói)          │
  │  ⭐ GIẢI PHÁP TỐT NHẤT — Dùng trong production        │
  │                                                          │
  │  Thêm HEADER/DELIMITER trước mỗi data packet:           │
  │                                                          │
  │  Cách 3a: LENGTH PREFIX (thêm độ dài trước data)        │
  │  ┌──────┬────────────┬──────┬────────────┐               │
  │  │len=5 │  Hello     │len=5 │  World     │               │
  │  └──────┴────────────┴──────┴────────────┘               │
  │  → Receiver đọc length → biết cần đọc bao nhiêu bytes  │
  │                                                          │
  │  Cách 3b: DELIMITER (thêm ký tự phân cách)              │
  │  ┌──────────────┬───┬──────────────┬───┐                 │
  │  │  Hello       │\n │  World       │\n │                 │
  │  └──────────────┴───┴──────────────┴───┘                 │
  │  → Receiver đọc cho đến khi gặp delimiter               │
  │                                                          │
  │  ✅ Hoạt động trong MỌI tình huống                      │
  │  ✅ Xử lý được cả poor network conditions               │
  │  → ĐÂY LÀ giải pháp chuẩn industry!                    │
  └──────────────────────────────────────────────────────────┘
```

---

## 11. Tại Sao UDP Không Bị Dính Gói?

> **🎯 Tóm tắt nhanh:**
>
> - TCP = stream → không giữ ranh giới → CÓ dính gói
> - UDP = message → giữ ranh giới → KHÔNG dính gói

```
UDP KHÔNG DÍNH GÓI — TẠI SAO?
═══════════════════════════════════════════════════════════════

  ┌──────────────────────────────────────────────────────────┐
  │                                                          │
  │  TCP = STREAM-ORIENTED (hướng dòng):                     │
  │  ┌────────────────────────────────────────┐               │
  │  │ HelloWorld (stream liên tục, KHÔNG     │               │
  │  │ có ranh giới giữa "Hello" và "World") │               │
  │  └────────────────────────────────────────┘               │
  │  → Receiver đọc ARBITRARY bytes                          │
  │  → Có thể đọc "Hel" rồi "loWorld"                       │
  │  → DÍNH GÓI!                                             │
  │                                                          │
  │  ─────────────────────────────────────────               │
  │                                                          │
  │  UDP = MESSAGE-ORIENTED (hướng thông điệp):              │
  │  ┌──────────────┐  ┌──────────────┐                      │
  │  │ HDR + Hello  │  │ HDR + World  │                      │
  │  └──────────────┘  └──────────────┘                      │
  │       ↑ Msg 1            ↑ Msg 2                         │
  │  → Mỗi send() = 1 DATAGRAM ĐỘC LẬP                    │
  │  → Receiver nhận TỪNG DATAGRAM RIÊNG BIỆT               │
  │  → KHÔNG BAO GIỜ dính gói!                              │
  │                                                          │
  └──────────────────────────────────────────────────────────┘

  UDP BẢO VỆ RANH GIỚI MESSAGE:
  ┌──────────────────────────────────────────────────────────┐
  │                                                          │
  │  Mỗi UDP packet CÓ HEADER riêng (source, port, length) │
  │  → Receiver DỄ DÀNG phân biệt từng message              │
  │                                                          │
  │  ⚠️ LƯU Ý:                                               │
  │  → Receiver chỉ nhận được 1 datagram mỗi lần recv()     │
  │  → Nếu buffer recv() < kích thước datagram → MẤT DATA  │
  │  → Data mất KHÔNG THỂ nhận lại ở lần recv() tiếp theo   │
  │  → Application phải cấp buffer ĐỦ LỚN!                 │
  │                                                          │
  └──────────────────────────────────────────────────────────┘
```

---

## 12. Tóm Tắt & Câu Hỏi Phỏng Vấn

### Quick Reference

```
TCP vs UDP:
  TCP: Connection-oriented, Reliable, Byte-stream, 20-60B header
  UDP: Connectionless, Unreliable, Message-oriented, 8B header

THREE-WAY HANDSHAKE (Thiết lập kết nối):
  1. Client → Server: SYN (seq=j)           [SYN_SENT]
  2. Server → Client: SYN+ACK (ack=j+1)     [SYN_RECV]
  3. Client → Server: ACK (ack=k+1)         [ESTABLISHED]

FOUR-WAY HANDSHAKE (Đóng kết nối):
  1. Client → Server: FIN (seq=u)           [FIN-WAIT-1]
  2. Server → Client: ACK (ack=u+1)         [CLOSE-WAIT, FIN-WAIT-2]
  3. Server → Client: FIN (seq=w)           [LAST-ACK]
  4. Client → Server: ACK (ack=w+1)         [TIME-WAIT → CLOSED]

CONGESTION CONTROL:
  Slow Start         → cwnd tăng exponential (×2 mỗi RTT)
  Congestion Avoid.  → cwnd tăng linear (+1 mỗi RTT)
  Fast Retransmit    → 3 dup ACKs → retransmit ngay
  Fast Recovery      → cwnd = ssthresh (không reset về 1)

FLOW CONTROL:
  Sliding Window     → Receiver thông báo rwnd
  Sending Window     → min(rwnd, cwnd)

RELIABLE DELIVERY:
  • Segmentation + Sequence Numbers → Đúng thứ tự
  • ACK Reply → Xác nhận đã nhận
  • Timeout + Retransmit → Không mất data
  • CRC Check → Phát hiện lỗi bit
```

### Câu Hỏi Phỏng Vấn Thường Gặp

**1. TCP và UDP khác nhau thế nào?**

> TCP: connection-oriented, reliable, byte-stream, flow/congestion control, chỉ unicast, header 20-60 bytes. UDP: connectionless, unreliable, message-oriented, hỗ trợ broadcast/multicast, header 8 bytes. TCP cho file transfer/web; UDP cho video call/gaming/DNS.

**2. Tại sao cần 3-way handshake mà không phải 2?**

> Để đảm bảo cả hai bên đều biết và đồng ý với sequence numbers của nhau. 2-way không đủ để xác nhận server đã nhận được xác nhận của client.

**3. Tại sao đóng kết nối cần 4 bước mà không gộp được?**

> Vì TCP là full-duplex. Sau khi client gửi FIN, server có thể vẫn còn data cần gửi. Phải đợi server gửi xong mới đóng chiều ngược lại.

**4. TIME-WAIT là gì và tại sao cần chờ 2\*MSL?**

> TIME-WAIT đảm bảo:
>
> - ACK cuối cùng được gửi thành công (nếu mất thì còn thời gian gửi lại)
> - Các gói tin cũ trong mạng hết hạn trước khi tái sử dụng port

**5. TCP có mấy cơ chế retransmission?**

> 2 cơ chế: (1) Timer-based — gửi lại khi timeout, mỗi lần retry × 2 timeout. (2) Fast Retransmit — nhận 3 duplicate ACKs thì gửi lại ngay, không chờ timer.

**6. Giải thích 4 thuật toán congestion control?**

> Slow Start: cwnd bắt đầu từ 1, tăng gấp đôi mỗi RTT. Congestion Avoidance: khi cwnd ≥ ssthresh, tăng tuyến tính +1/RTT. Fast Retransmit: 3 dup ACKs → gửi lại không chờ timeout. Fast Recovery: 3 dup ACKs → ssthresh = cwnd/2, cwnd = ssthresh (không reset về 1).

**7. Flow control vs Congestion control khác nhau thế nào?**

> Flow control: receiver bảo vệ bản thân, dùng window advertisement (rwnd) báo sender "tôi còn chỗ". Congestion control: bảo vệ mạng, dùng cwnd + thuật toán slow start/CA điều chỉnh tốc độ gửi theo tình trạng mạng.

**8. TCP packet merging là gì và xử lý thế nào?**

> Vì TCP là byte-stream, nhiều send() có thể được gộp thành 1 segment (Nagle's Algorithm). 3 giải pháp: (1) delay giữa các send(), (2) tắt Nagle bằng TCP_NODELAY, (3) **tốt nhất**: đóng gói data với length prefix hoặc delimiter.

**9. Tại sao UDP không bị dính gói?**

> UDP là message-oriented, mỗi send() = 1 datagram độc lập có header riêng (8 bytes). Receiver nhận từng datagram riêng biệt, ranh giới message được bảo toàn. TCP là stream-oriented nên không giữ ranh giới.

**10. Cumulative ACK là gì?**

> ACK xác nhận tất cả bytes đến vị trí đó. VD: ACK=100 nghĩa là "tôi đã nhận được tất cả bytes từ 0-99, gửi tiếp từ 100".

---

## Checklist Học Tập

- [ ] Hiểu 5 đặc điểm của UDP và 6 đặc điểm của TCP
- [ ] So sánh được TCP vs UDP (7 tiêu chí)
- [ ] Nêu được khi nào dùng TCP, khi nào dùng UDP
- [ ] Vẽ được sơ đồ 3-way handshake với đầy đủ trạng thái
- [ ] Vẽ được sơ đồ 4-way handshake, giải thích tại sao cần 4 bước
- [ ] Hiểu mục đích của TIME-WAIT và 2\*MSL
- [ ] Giải thích được 2 cơ chế retransmission (timer-based + fast retransmit)
- [ ] Nắm được 4 thuật toán congestion control (slow start, CA, fast retransmit, fast recovery)
- [ ] Hiểu flow control bằng sliding window + zero window
- [ ] Biết sending window = min(rwnd, cwnd)
- [ ] Giải thích được TCP packet merging + 3 giải pháp
- [ ] Giải thích tại sao UDP không bị dính gói
- [ ] Hiểu khái niệm Cumulative ACK và Piggybacking
- [ ] Biết phân biệt các trạng thái: SYN_SENT, SYN_RECV, ESTABLISHED, FIN-WAIT, CLOSE-WAIT, TIME-WAIT

---

_Cập nhật lần cuối: Tháng 2, 2026_
