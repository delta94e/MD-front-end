# TCP vs UDP — Phân Tích Chuyên Sâu!

> **Hiểu sâu sự khác biệt giữa TCP và UDP!**
> Giao thức tầng Transport, 3-way handshake, 4-way teardown, tự viết mô phỏng!

---

## §1. Mô Hình TCP/IP!

```
  TCP/IP — 4 TẦNG:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ Tầng 4: APPLICATION LAYER (Ứng dụng!)               │    │
  │  │ → HTTP, HTTPS, FTP, SMTP, DNS, SSH, Telnet...        │    │
  │  │ → Cung cấp dịch vụ cho ứng dụng người dùng!       │    │
  │  └────────────────────┬─────────────────────────────────┘    │
  │                       │ data                                  │
  │  ┌────────────────────▼─────────────────────────────────┐    │
  │  │ Tầng 3: TRANSPORT LAYER (Giao vận!) ★                │    │
  │  │ → TCP, UDP                                            │    │
  │  │ → Đóng gói, phân mảnh, tái lắp ráp segment!       │    │
  │  │ → TCP: tin cậy! UDP: nhanh! ★                        │    │
  │  └────────────────────┬─────────────────────────────────┘    │
  │                       │ segment                               │
  │  ┌────────────────────▼─────────────────────────────────┐    │
  │  │ Tầng 2: NETWORK LAYER (Mạng!)                        │    │
  │  │ → IP, ICMP, ARP                                       │    │
  │  │ → Định tuyến, gửi packet đến đích!                 │    │
  │  └────────────────────┬─────────────────────────────────┘    │
  │                       │ packet                                │
  │  ┌────────────────────▼─────────────────────────────────┐    │
  │  │ Tầng 1: LINK LAYER (Liên kết dữ liệu!)           │    │
  │  │ → Ethernet, Wi-Fi                                      │    │
  │  │ → Đóng gói/mở gói IP, gửi ARP/RARP!               │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                       │ frame                                 │
  │                                                              │
  │  QUÁ TRÌNH ĐÓNG GÓI (ENCAPSULATION):                         │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │                                                      │    │
  │  │ GỬI:  Data → [TCP/UDP Header + Data]                 │    │
  │  │             → [IP Header + Segment]                   │    │
  │  │             → [Eth Header + Packet + Eth Trailer]     │    │
  │  │                                                      │    │
  │  │ NHẬN: Frame → bóc Eth → bóc IP → bóc TCP/UDP       │    │
  │  │             → Data gốc! ★                            │    │
  │  │                                                      │    │
  │  │ ★ Mỗi tầng THÊM header riêng khi gửi!              │    │
  │  │ ★ Mỗi tầng BÓC header riêng khi nhận!              │    │
  │  │ ★ Giao tiếp NGANG HÀNG (peer-to-peer giữa 2 bên!) │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```

---

## §2. UDP — User Datagram Protocol!

```
  UDP — GIAO THỨC KHÔNG KẾT NỐI:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  5 ĐẶC ĐIỂM CHÍNH:                                             │
  │                                                              │
  │  ① CONNECTIONLESS (Không kết nối!):                           │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ → KHÔNG cần bắt tay 3 bước! ★                       │    │
  │  │ → Muốn gửi = gửi NGAY LẬP TỨC!                    │    │
  │  │ → Chỉ thêm UDP header → chuyển xuống IP layer!      │    │
  │  │                                                      │    │
  │  │ BÊN GỬI:                                               │    │
  │  │ App data → [UDP Header + Data] → IP Layer!           │    │
  │  │ ★ KHÔNG chia nhỏ, KHÔNG nối, KHÔNG sắp xếp!       │    │
  │  │                                                      │    │
  │  │ BÊN NHẬN:                                               │    │
  │  │ IP Layer → bóc IP Header → Data → App Layer!         │    │
  │  │ ★ KHÔNG nối các packet lại! Giữ nguyên ranh giới!  │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  ② UNICAST + MULTICAST + BROADCAST:                            │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ → 1:1 (unicast!)     → Gửi cho 1 máy!              │    │
  │  │ → 1:N (multicast!)   → Gửi cho 1 nhóm!             │    │
  │  │ → 1:ALL (broadcast!) → Gửi cho TẤT CẢ!            │    │
  │  │ → N:N (many-to-many!) ★                               │    │
  │  │ ★ TCP chỉ có 1:1! UDP linh hoạt hơn!               │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  ③ MESSAGE-ORIENTED (Hướng thông điệp!):                    │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ → Ứng dụng gửi gì → UDP gửi NGUYÊN VẸN!           │    │
  │  │ → KHÔNG gộp (merge) nhiều message!                   │    │
  │  │ → KHÔNG tách (split) message!                         │    │
  │  │ → GIỮ NGUYÊN ranh giới message! ★                    │    │
  │  │ → App phải chọn kích thước packet phù hợp!          │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  ④ UNRELIABLE (Không tin cậy!):                               │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ → KHÔNG kết nối → gửi bất cứ lúc nào!              │    │
  │  │ → KHÔNG backup dữ liệu đã gửi!                    │    │
  │  │ → KHÔNG biết bên nhận có nhận được không! ★          │    │
  │  │ → KHÔNG có congestion control! ★                      │    │
  │  │ → Mạng tệ? VẪN GỬI CÙNG TỐC ĐỘ! ★                │    │
  │  │                                                      │    │
  │  │ NHƯỢC ĐIỂM: Mất packet khi mạng tệ! ❌              │    │
  │  │ ƯU ĐIỂM: Realtime! (video call, game!) ✅             │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  ⑤ HEADER NHỎ — CHỈ 8 BYTES! ★                                │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │                                                      │    │
  │  │  UDP HEADER (8 bytes!):                                │    │
  │  │  ┌─────────────────┬─────────────────┐                │    │
  │  │  │ Source Port     │ Dest Port       │ ← 2+2 bytes!  │    │
  │  │  │ (16 bits)       │ (16 bits)       │                │    │
  │  │  ├─────────────────┼─────────────────┤                │    │
  │  │  │ Length          │ Checksum        │ ← 2+2 bytes!  │    │
  │  │  │ (16 bits)       │ (16 bits)       │                │    │
  │  │  └─────────────────┴─────────────────┘                │    │
  │  │                                                      │    │
  │  │  ★ Chỉ 8 bytes! So với TCP ≥ 20 bytes!              │    │
  │  │  → Overhead thấp → truyền hiệu quả hơn!            │    │
  │  │  → Source Port: optional (có thể bỏ!)               │    │
  │  │  → Checksum: phát hiện lỗi header + data!            │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```

---

## §3. TCP — Transmission Control Protocol!

```
  TCP — GIAO THỨC KẾT NỐI TIN CẬY:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  ĐẶC ĐIỂM CHÍNH:                                                │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ → Connection-oriented (hướng kết nối!)              │    │
  │  │ → Reliable (tin cậy!)                                 │    │
  │  │ → Byte-stream (luồng byte!)                          │    │
  │  │ → Full-duplex (song công!)                           │    │
  │  │ → Unicast only (chỉ 1:1!)                            │    │
  │  │ → Congestion control (kiểm soát tắc nghẽn!)        │    │
  │  │ → Flow control (kiểm soát luồng!)                   │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  TCP HEADER (tối thiểu 20 bytes!):                            │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │  0       4       8      12      16      20     24  31│    │
  │  │  ┌───────────────────────┬───────────────────────┐    │    │
  │  │  │ Source Port (16)      │ Dest Port (16)        │    │    │
  │  │  ├───────────────────────┴───────────────────────┤    │    │
  │  │  │ Sequence Number (32)                          │    │    │
  │  │  ├───────────────────────────────────────────────┤    │    │
  │  │  │ Acknowledgment Number (32)                    │    │    │
  │  │  ├────┬──────┬──────────┬────────────────────────┤    │    │
  │  │  │Off │Rsrvd │ Flags    │ Window Size (16)       │    │    │
  │  │  │(4) │(3)   │(9 bits)  │                        │    │    │
  │  │  │    │      │SYN ACK   │                        │    │    │
  │  │  │    │      │FIN RST...│                        │    │    │
  │  │  ├────┴──────┴──────────┼────────────────────────┤    │    │
  │  │  │ Checksum (16)        │ Urgent Pointer (16)    │    │    │
  │  │  ├──────────────────────┴────────────────────────┤    │    │
  │  │  │ Options (0-40 bytes, variable!)               │    │    │
  │  │  └───────────────────────────────────────────────┘    │    │
  │  │                                                      │    │
  │  │  ★ Tối thiểu 20 bytes! Tối đa 60 bytes!             │    │
  │  │  → Sequence Number: đánh số thứ tự byte! ★          │    │
  │  │  → ACK Number: byte tiếp theo mong đợi nhận! ★     │    │
  │  │  → Flags: SYN, ACK, FIN, RST, PSH, URG!              │    │
  │  │  → Window Size: flow control (bao nhiêu byte OK!)    │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```

---

## §4. TCP 3-Way Handshake (Bắt Tay 3 Bước!)

```
  3-WAY HANDSHAKE — THIẾT LẬP KẾT NỐI:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  CLIENT                              SERVER                  │
  │  ┌──────┐                            ┌──────┐               │
  │  │      │                            │      │               │
  │  │      │ ① SYN (seq=x)              │      │               │
  │  │      │ ──────────────────────────→ │      │               │
  │  │      │ "Tôi muốn kết nối!"       │      │               │
  │  │ SYN- │                            │ SYN- │               │
  │  │ SENT │ ② SYN+ACK (seq=y, ack=x+1)│ RCVD │               │
  │  │      │ ←────────────────────────── │      │               │
  │  │      │ "OK! Tôi cũng sẵn sàng!"│      │               │
  │  │      │                            │      │               │
  │  │      │ ③ ACK (ack=y+1)            │      │               │
  │  │      │ ──────────────────────────→ │      │               │
  │  │ EST- │ "Xác nhận! Bắt đầu!"    │ EST- │               │
  │  │ ABLI-│                            │ ABLI-│               │
  │  │ SHED │ ← ĐÃ KẾT NỐI! ★ →        │ SHED │               │
  │  └──────┘                            └──────┘               │
  │                                                              │
  │  TẠI SAO CẦN 3 BƯỚC, KHÔNG PHẢI 2?                            │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ ★ TRÁNH KẾT NỐI GIẢ (invalid/stale connection!)    │    │
  │  │                                                      │    │
  │  │ NẾU CHỈ 2 BƯỚC:                                       │    │
  │  │ → Client gửi SYN cũ (bị delay trong mạng!)          │    │
  │  │ → Server nhận SYN cũ → tưởng mới → gửi SYN+ACK!   │    │
  │  │ → Server ESTABLISHED! (nhưng Client không biết!) ❌  │    │
  │  │ → Server LÃNG PHÍ tài nguyên cho kết nối "ma"! ❌ │    │
  │  │                                                      │    │
  │  │ VỚI 3 BƯỚC:                                            │    │
  │  │ → Server gửi SYN+ACK → đợi ACK từ Client!          │    │
  │  │ → Client nhận SYN+ACK cũ → KHÔNG gửi ACK! ★        │    │
  │  │ → Server không nhận ACK → KHÔNG ESTABLISHED! ✅      │    │
  │  │ → Tránh kết nối "ma"! ★                             │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```

---

## §5. TCP 4-Way Teardown (Ngắt Kết Nối 4 Bước!)

```
  4-WAY TEARDOWN — NGẮT KẾT NỐI:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  ★ TCP là FULL-DUPLEX → mỗi hướng ngắt RIÊNG!            │
  │  → Cần 4 bước (2 FIN + 2 ACK!)                              │
  │                                                              │
  │  CLIENT (A)                          SERVER (B)              │
  │  ┌──────┐                            ┌──────┐               │
  │  │      │ ① FIN (seq=u)              │      │               │
  │  │      │ ──────────────────────────→ │      │               │
  │  │ FIN- │ "Tôi gửi xong rồi!"      │      │               │
  │  │ WAIT │                            │      │               │
  │  │ -1   │ ② ACK (ack=u+1)            │CLOSE-│               │
  │  │      │ ←────────────────────────── │WAIT  │               │
  │  │ FIN- │ "OK, tôi biết rồi!"      │      │               │
  │  │ WAIT │                            │      │               │
  │  │ -2   │     (B vẫn có thể GỬI     │      │               │
  │  │      │      dữ liệu tiếp!) ★    │      │               │
  │  │      │                            │      │               │
  │  │      │ ③ FIN (seq=w)              │LAST- │               │
  │  │      │ ←────────────────────────── │ACK   │               │
  │  │      │ "Tôi cũng gửi xong!"    │      │               │
  │  │      │                            │      │               │
  │  │ TIME-│ ④ ACK (ack=w+1)            │      │               │
  │  │ WAIT │ ──────────────────────────→ │CLOSED│               │
  │  │      │ "OK! Tạm biệt!"          │      │               │
  │  │      │                            └──────┘               │
  │  │      │ ← Đợi 2MSL! ★                                    │
  │  │CLOSED│                                                    │
  │  └──────┘                                                    │
  │                                                              │
  │  TẠI SAO CẦN 4 BƯỚC, KHÔNG PHẢI 2?                            │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ ★ FULL-DUPLEX! Mỗi hướng ĐỘC LẬP!                  │    │
  │  │ → Bước ①②: A ngắt hướng A→B!                        │    │
  │  │   (A không gửi nữa, nhưng B VẪN CÓ THỂ gửi!)      │    │
  │  │ → Bước ③④: B ngắt hướng B→A!                        │    │
  │  │   (B gửi xong dữ liệu còn lại → rồi mới ngắt!)   │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  TẠI SAO CẦN TIME-WAIT (2MSL)?                                  │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ MSL = Maximum Segment Lifetime (thời gian sống!)     │    │
  │  │ 2MSL thường = 60 giây (RFC 793!)                     │    │
  │  │                                                      │    │
  │  │ LÝ DO 1: Đảm bảo ACK cuối đến được B! ★           │    │
  │  │ → Nếu ACK mất → B gửi lại FIN! → A gửi lại ACK!  │    │
  │  │                                                      │    │
  │  │ LÝ DO 2: Chờ packet cũ "chết"! ★                    │    │
  │  │ → Nếu CLOSED ngay → kết nối mới cùng port!         │    │
  │  │ → Packet cũ delay → nhận lẫn vào kết nối mới! ❌ │    │
  │  │ → Đợi 2MSL → packet cũ chắc chắn đã hết hạn! ✅ │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```

---

## §6. TCP Reliable Transmission (Truyền Tin Cậy!)

```
  CƠ CHẾ TIN CẬY CỦA TCP:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  ① SEQUENCE NUMBER + ACK:                                      │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ → Mỗi BYTE có 1 sequence number! ★                  │    │
  │  │ → Bên nhận gửi ACK = seq tiếp theo mong đợi!       │    │
  │  │                                                      │    │
  │  │ Sender: [SEQ=1, 100 bytes] ────→ Receiver             │    │
  │  │ Sender: ←──── [ACK=101] "Tôi nhận xong byte 100!"  │    │
  │  │ Sender: [SEQ=101, 200 bytes] ──→ Receiver             │    │
  │  │ Sender: ←──── [ACK=301] "Nhận xong byte 300!"      │    │
  │  │                                                      │    │
  │  │ ★ Packet sắp xếp ĐÚNG THỨ TỰ bằng seq number!     │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  ② RETRANSMISSION (Truyền lại!):                              │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ → Gửi packet → bật timer!                            │    │
  │  │ → Timeout (RTO) mà chưa nhận ACK → GỬI LẠI! ★     │    │
  │  │ → RTO = dynamic! (tính từ RTT của connection!)       │    │
  │  │                                                      │    │
  │  │ Sender: [SEQ=1] ────→ ❌ (mất packet!)                │    │
  │  │ Sender: (timeout!)                                     │    │
  │  │ Sender: [SEQ=1] ────→ Receiver ✅ (gửi lại!)        │    │
  │  │ Sender: ←──── [ACK=101]                                │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  ③ FLOW CONTROL (Kiểm soát luồng!):                          │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ → Receiver thông báo WINDOW SIZE! ★                   │    │
  │  │ → "Tôi chỉ nhận được N bytes nữa thôi!"           │    │
  │  │ → Sender KHÔNG gửi quá window size!                  │    │
  │  │ → Tránh receiver bị overwhelm! ★                      │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  ④ CONGESTION CONTROL (Kiểm soát tắc nghẽn!):               │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ → Slow Start: bắt đầu chậm, tăng dần! ★            │    │
  │  │ → Congestion Avoidance: tăng tuyến tính!             │    │
  │  │ → Fast Retransmit: nhận 3 duplicate ACK → gửi lại! │    │
  │  │ → Fast Recovery: giảm window, không về 0!            │    │
  │  │                                                      │    │
  │  │ Cwnd: 1 → 2 → 4 → 8 → 16 (slow start!)              │    │
  │  │      16 → 17 → 18 → 19... (congestion avoidance!)    │    │
  │  │       ❌ packet loss! → Cwnd giảm! ★                  │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```

---

## §7. So Sánh TCP vs UDP!

```
  BẢNG SO SÁNH:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  ┌──────────────────┬──────────────┬──────────────────┐      │
  │  │ TIÊU CHÍ          │ UDP          │ TCP              │      │
  │  ├──────────────────┼──────────────┼──────────────────┤      │
  │  │ Kết nối          │ Không ★      │ Có (3-way!) ★    │      │
  │  │ Tin cậy          │ Không ★      │ Có (SEQ+ACK!) ★  │      │
  │  │ Thứ tự           │ Không đảm bảo│ Đảm bảo ★      │      │
  │  │ Flow control      │ Không        │ Có (Window!) ★   │      │
  │  │ Congestion ctrl   │ Không ★      │ Có (Slow start!) │      │
  │  │ Kiểu truyền     │ Message ★    │ Byte stream       │      │
  │  │ Số endpoint      │ 1:1, 1:N ★  │ Chỉ 1:1           │      │
  │  │ Header size       │ 8 bytes ★   │ 20-60 bytes       │      │
  │  │ Tốc độ          │ Nhanh ★      │ Chậm hơn         │      │
  │  │ Full-duplex       │ Không        │ Có ★              │      │
  │  │ Ứng dụng        │ Video, Game  │ File, Email, Web  │      │
  │  └──────────────────┴──────────────┴──────────────────┘      │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```

---

## §8. Giao Thức Tầng Ứng Dụng!

```
  PROTOCOL TRÊN TCP vs UDP:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  CHẠY TRÊN TCP:                                                  │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │  HTTP    — Web browsing! ★                            │    │
  │  │  HTTPS   — Secure web! (HTTP + TLS!)                   │    │
  │  │  FTP     — File transfer!                               │    │
  │  │  SMTP    — Gửi email!                                  │    │
  │  │  POP3    — Nhận email!                                 │    │
  │  │  SSH     — Secure shell! (thay TELNET!)                │    │
  │  │  TELNET  — Terminal login!                               │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  CHẠY TRÊN UDP:                                                  │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │  BOOTP   — Boot Protocol (thiết bị không disk!)      │    │
  │  │  NTP     — Network Time Protocol (đồng bộ giờ!)     │    │
  │  │  DHCP    — Dynamic Host Config (cấp IP tự động!)    │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  CHẠY TRÊN CẢ HAI:                                              │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │  DNS     — Domain Name System! ★                       │    │
  │  │           → Query nhỏ: UDP (nhanh!) ★                 │    │
  │  │           → Zone transfer: TCP (tin cậy!)              │    │
  │  │  SNMP    — Network management!                          │    │
  │  │  DHCP    — IP config (chủ yếu UDP!)                   │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```

---

## §9. Tự Viết Mô Phỏng!

```javascript
// ═══════════════════════════════════════════════════════════
// MÔ PHỎNG: TCP 3-Way Handshake — TỰ VIẾT!
// ═══════════════════════════════════════════════════════════

class TCPHandshakeSimulator {
  constructor() {
    this.clientState = "CLOSED";
    this.serverState = "LISTEN";
    this.clientSeq = Math.floor(Math.random() * 1000); // ISN ngẫu nhiên!
    this.serverSeq = Math.floor(Math.random() * 1000);
  }

  // ★ BƯỚC 1: Client gửi SYN!
  step1_ClientSendSYN() {
    this.clientState = "SYN-SENT";
    const segment = {
      SYN: true,
      ACK: false,
      seq: this.clientSeq, // Initial Sequence Number!
      ack: 0,
    };
    console.log(`[Client → Server] SYN seq=${segment.seq}`);
    console.log(`  Client state: ${this.clientState}`);
    return segment;
  }

  // ★ BƯỚC 2: Server gửi SYN+ACK!
  step2_ServerSendSYNACK(synSegment) {
    this.serverState = "SYN-RECEIVED";
    const segment = {
      SYN: true,
      ACK: true,
      seq: this.serverSeq, // Server's ISN!
      ack: synSegment.seq + 1, // ★ Client seq + 1!
    };
    console.log(
      `[Server → Client] SYN+ACK seq=${segment.seq} ack=${segment.ack}`,
    );
    console.log(`  Server state: ${this.serverState}`);
    return segment;
  }

  // ★ BƯỚC 3: Client gửi ACK!
  step3_ClientSendACK(synAckSegment) {
    this.clientState = "ESTABLISHED";
    const segment = {
      SYN: false,
      ACK: true,
      seq: this.clientSeq + 1, // ★ seq tăng!
      ack: synAckSegment.seq + 1, // ★ Server seq + 1!
    };
    console.log(`[Client → Server] ACK seq=${segment.seq} ack=${segment.ack}`);
    this.serverState = "ESTABLISHED"; // ★ Server cũng ESTABLISHED!
    console.log(`  Client: ${this.clientState}, Server: ${this.serverState}`);
    console.log(`  ★ KẾT NỐI THÀNH CÔNG!`);
    return segment;
  }

  // Chạy full handshake!
  run() {
    console.log("=== TCP 3-WAY HANDSHAKE ===");
    const syn = this.step1_ClientSendSYN();
    const synAck = this.step2_ServerSendSYNACK(syn);
    this.step3_ClientSendACK(synAck);
  }
}

// ═══════════════════════════════════════════════════════════
// MÔ PHỎNG: TCP 4-Way Teardown!
// ═══════════════════════════════════════════════════════════

class TCPTeardownSimulator {
  constructor() {
    this.clientState = "ESTABLISHED";
    this.serverState = "ESTABLISHED";
  }

  step1_ClientSendFIN() {
    this.clientState = "FIN-WAIT-1";
    console.log(`[Client → Server] FIN "Tôi gửi xong rồi!"`);
    console.log(`  Client: ${this.clientState}`);
  }

  step2_ServerSendACK() {
    this.serverState = "CLOSE-WAIT";
    this.clientState = "FIN-WAIT-2";
    console.log(`[Server → Client] ACK "OK, tôi biết rồi!"`);
    console.log(`  Server: ${this.serverState} (vẫn có thể gửi data!)`);
    console.log(`  Client: ${this.clientState}`);
  }

  step3_ServerSendFIN() {
    this.serverState = "LAST-ACK";
    console.log(`[Server → Client] FIN "Tôi cũng gửi xong!"`);
    console.log(`  Server: ${this.serverState}`);
  }

  step4_ClientSendACK() {
    this.clientState = "TIME-WAIT";
    console.log(`[Client → Server] ACK "OK! Tạm biệt!"`);
    console.log(`  Client: ${this.clientState} (đợi 2MSL...)`);

    // Sau 2MSL → CLOSED!
    setTimeout(() => {
      this.clientState = "CLOSED";
      this.serverState = "CLOSED";
      console.log(`  ★ 2MSL hết! Client: CLOSED, Server: CLOSED`);
    }, 2000); // Mô phỏng 2 giây!
  }

  run() {
    console.log("=== TCP 4-WAY TEARDOWN ===");
    this.step1_ClientSendFIN();
    this.step2_ServerSendACK();
    this.step3_ServerSendFIN();
    this.step4_ClientSendACK();
  }
}

// ═══════════════════════════════════════════════════════════
// MÔ PHỎNG: TCP Reliable Transmission!
// ═══════════════════════════════════════════════════════════

class TCPReliableTransmitter {
  constructor() {
    this.seq = 0;
    this.sent = []; // Packets đã gửi!
    this.acked = []; // Packets đã ACK!
    this.retransmitted = []; // Packets gửi lại!
    this.rto = 1000; // Retransmission Timeout (ms!)
  }

  send(data) {
    const packet = { seq: this.seq, data, timestamp: Date.now() };
    this.sent.push(packet);
    console.log(`[SEND] seq=${this.seq}, data="${data}"`);

    // ★ Mô phỏng: 20% xác suất mất packet!
    const lost = Math.random() < 0.2;
    if (lost) {
      console.log(`  ❌ PACKET LOST! seq=${this.seq}`);
      // Timer sẽ trigger retransmit!
      setTimeout(() => this.retransmit(packet), this.rto);
    } else {
      // ★ Bên nhận gửi ACK!
      const ack = this.seq + data.length;
      this.acked.push(ack);
      console.log(`  ✅ ACK=${ack} received!`);
    }

    this.seq += data.length;
  }

  retransmit(packet) {
    console.log(`[RETRANSMIT] seq=${packet.seq}, data="${packet.data}" ★`);
    this.retransmitted.push(packet);
    // Giả sử lần này thành công!
    const ack = packet.seq + packet.data.length;
    this.acked.push(ack);
    console.log(`  ✅ ACK=${ack} received (after retransmit!)`);
  }
}

// ═══════════════════════════════════════════════════════════
// MÔ PHỎNG: UDP — Fire and Forget!
// ═══════════════════════════════════════════════════════════

class UDPTransmitter {
  send(data, destPort) {
    const datagram = {
      srcPort: Math.floor(Math.random() * 65535),
      destPort,
      length: 8 + data.length, // 8 byte header + data!
      checksum: this.calculateChecksum(data),
      data,
    };

    console.log(`[UDP SEND] to port ${destPort}: "${data}"`);
    console.log(`  Header: ${8} bytes, Total: ${datagram.length} bytes`);

    // ★ UDP: GỬI VÀ QUÊN! Không cần ACK!
    // Không biết bên nhận có nhận được không!
    const lost = Math.random() < 0.2;
    if (lost) {
      console.log(`  ❌ LOST! (UDP không biết, không quan tâm!) ★`);
    } else {
      console.log(`  ✅ Delivered! (nhưng UDP không xác nhận!)`);
    }

    return datagram;
  }

  calculateChecksum(data) {
    let sum = 0;
    for (let i = 0; i < data.length; i++) {
      sum = (sum + data.charCodeAt(i)) & 0xffff;
    }
    return sum;
  }
}
```

---

## §10. Câu Hỏi Phỏng Vấn!

```
  CÂU HỎI:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  ❓ 1: TCP vs UDP khác nhau thế nào?                             │
  │  → TCP: kết nối, tin cậy, byte stream, 1:1, header 20B+!  │
  │  → UDP: không kết nối, không tin cậy, message, 1:N, 8B!   │
  │                                                              │
  │  ❓ 2: Tại sao TCP cần 3-way handshake?                          │
  │  → Tránh kết nối "ma" từ SYN cũ bị delay! ★              │
  │  → Xác nhận CẢ HAI bên đều sẵn sàng!                    │
  │  → 2 bước: server ESTABLISHED sai → lãng phí tài nguyên!│
  │                                                              │
  │  ❓ 3: Tại sao ngắt kết nối cần 4 bước?                        │
  │  → Full-duplex: mỗi hướng ngắt RIÊNG!                    │
  │  → Bên B có thể VẪN CÒN DATA chưa gửi xong!             │
  │  → Bước ①②: ngắt A→B. Bước ③④: ngắt B→A!              │
  │                                                              │
  │  ❓ 4: TIME-WAIT (2MSL) để làm gì?                              │
  │  → Đảm bảo ACK cuối đến được server!                     │
  │  → Chờ packet cũ "chết" → tránh nhầm lẫn kết nối mới! │
  │                                                              │
  │  ❓ 5: TCP đảm bảo tin cậy bằng cách nào?                      │
  │  → Seq number + ACK! (đánh số, xác nhận!)                 │
  │  → Retransmission! (timeout gửi lại!)                       │
  │  → Flow control! (Window Size!)                               │
  │  → Congestion control! (Slow Start, AIMD!)                   │
  │  → Checksum! (phát hiện lỗi!)                               │
  │                                                              │
  │  ❓ 6: Khi nào dùng UDP thay TCP?                                │
  │  → Realtime: video call, game online, live stream! ★        │
  │  → Broadcast/Multicast: gửi cho nhiều máy!                 │
  │  → DNS query: nhỏ, nhanh, không cần kết nối!              │
  │  → IoT: thiết bị hạn chế tài nguyên!                     │
  │                                                              │
  │  ❓ 7: DNS dùng TCP hay UDP?                                     │
  │  → Query thông thường: UDP (port 53! nhanh!) ★             │
  │  → Zone transfer: TCP (dữ liệu lớn, cần tin cậy!)       │
  │  → Response > 512 bytes: TCP (UDP không đủ!) ★             │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```
