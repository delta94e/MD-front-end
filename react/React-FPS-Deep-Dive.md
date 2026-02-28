# React: Từ Lưu Ảnh Võng Mạc Đến FPS, Refresh Rate, VSync & 16ms — Deep Dive!

> **Chủ đề**: Visual Persistence → FPS → Refresh Rate → GPU → VSync → 16ms → React
> **Ngôn ngữ**: Tiếng Việt — giải thích cực kỳ chi tiết!
> **Phương châm**: Tự viết lại bằng tay — KHÔNG dùng thư viện!
> **Nguồn**: "The story of React: from visual persistence to FPS, refresh rate, graphics card, vertical synchronization, and finally 16ms"

---

## Mục Lục

1. [§1. Lưu Ảnh Võng Mạc — Persistence of Vision](#1)
2. [§2. Frame — Khung Hình Tĩnh](#2)
3. [§3. FPS — Frame Per Second](#3)
4. [§4. Refresh Rate — Tần Số Quét (Hz)](#4)
5. [§5. FPS vs Hz — Content vs Screen](#5)
6. [§6. Screen Tearing — Xé Hình](#6)
7. [§7. GPU — Card Đồ Họa](#7)
8. [§8. Vertical Sync — Đồng Bộ Dọc](#8)
9. [§9. Phim 24fps vs Game 24fps](#9)
10. [§10. Browser 60Hz + 16ms + React 5ms](#10)
11. [§11. Life of a Frame — Chi Tiết](#11)
12. [§12. Sơ Đồ Tự Vẽ](#12)
13. [§13. Tự Viết — FrameTimingEngine](#13)
14. [§14. Câu Hỏi Luyện Tập](#14)

---

## §1. Lưu Ảnh Võng Mạc — Persistence of Vision!

```
  PERSISTENCE OF VISION:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  HIỆN TƯỢNG:                                                   │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ Khi nhìn vật thể:                                    │    │
  │  │ → Hình ảnh → Võng mạc → Thần kinh thị giác → Não│    │
  │  │                                                      │    │
  │  │ Khi vật thể BIẾN MẤT:                                │    │
  │  │ → Hình ảnh VẪN CÒN trên thần kinh thị giác!      │    │
  │  │ → Kéo dài 0.1 ~ 0.4 giây!                         │    │
  │  │ → = "LƯU ẢNH VÕNG MẠC" (Persistence of Vision!) │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  ỨNG DỤNG:                                                    │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ → Phim ảnh: 24 hình/giây → MẮT thấy chuyển động!│    │
  │  │ → TV: 30-60 hình/giây → mượt mà!                 │    │
  │  │ → Game: 60+ hình/giây → smooth!                   │    │
  │  │ → Browser: 60 hình/giây → animation smooth!       │    │
  │  │                                                      │    │
  │  │ ★ NỀN TẢNG của TẤT CẢ media chuyển động!        │    │
  │  │ ★ Nhờ lưu ảnh, chuỗi ảnh tĩnh → VIDEO!          │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  MINH HỌA:                                                    │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ Hình 1     Hình 2     Hình 3     Hình 4             │    │
  │  │ [●    ]    [ ●   ]    [  ●  ]    [   ● ]            │    │
  │  │   ↓ 0.1s    ↓ 0.1s    ↓ 0.1s    ↓                 │    │
  │  │   lưu ảnh!  lưu ảnh!  lưu ảnh!                     │    │
  │  │                                                      │    │
  │  │ MẮT thấy: ●──────────────────→ di chuyển!        │    │
  │  │ Thực tế:  4 ảnh TĨNH riêng biệt!                  │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```

---

## §2. Frame — Khung Hình Tĩnh!

```
  FRAME:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  ĐỊNH NGHĨA:                                                  │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ Video = chuỗi hình ảnh TĨNH!                       │    │
  │  │ Mỗi hình ảnh tĩnh = 1 FRAME (khung hình!)         │    │
  │  │                                                      │    │
  │  │ Nhờ lưu ảnh võng mạc → chuỗi frame → CHUYỂN ĐỘNG!│   │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  VÍ DỤ — 1 giây video:                                       │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ 24fps: [f1][f2][f3]...[f24]  = 24 frames!          │    │
  │  │ 30fps: [f1][f2][f3]...[f30]  = 30 frames!          │    │
  │  │ 60fps: [f1][f2][f3]...[f60]  = 60 frames!          │    │
  │  │ 120fps:[f1][f2][f3]...[f120] = 120 frames!         │    │
  │  │                                                      │    │
  │  │ Nhiều frame hơn = MƯỢT hơn (đến 1 giới hạn!)     │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  TRONG BROWSER:                                               │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ 1 frame = browser hoàn thành:                       │    │
  │  │ → Input events                                      │    │
  │  │ → JS execution                                      │    │
  │  │ → rAF callbacks                                     │    │
  │  │ → Layout calculation                                │    │
  │  │ → Paint                                             │    │
  │  │ → Composite                                         │    │
  │  │ = 1 HÌNH ẢNH hoàn chỉnh trên màn hình!           │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```

---

## §3. FPS — Frame Per Second!

```
  FPS:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  ĐỊNH NGHĨA:                                                  │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ FPS = Frames Per Second!                             │    │
  │  │ = Số KHUNG HÌNH hiển thị trong 1 giây!             │    │
  │  │ = Đo CONTENT hiển thị!                             │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  MỨC FPS:                                                     │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ < 24fps  → MẮT nhận ra từng frame! GIẬT! ❌      │    │
  │  │ 24fps    → Phim ảnh (có motion blur!) ✅           │    │
  │  │ 30fps    → Minimum cho game! Chấp nhận được!      │    │
  │  │ 60fps    → SMOOTH cơ bản! ✅ Browser standard!    │    │
  │  │ 120fps   → Rất mượt! High-end gaming!             │    │
  │  │ 144fps   → Competitive gaming!                     │    │
  │  │ > ~100fps → Mắt KHÓ phân biệt sự khác nhau!      │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  FRAME TIME:                                                   │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ FPS → Frame time (1 frame bao nhiêu ms?):          │    │
  │  │                                                      │    │
  │  │ 24fps  → 1000/24  = 41.67ms/frame                  │    │
  │  │ 30fps  → 1000/30  = 33.33ms/frame                  │    │
  │  │ 60fps  → 1000/60  = 16.67ms/frame ★ Browser!     │    │
  │  │ 120fps → 1000/120 = 8.33ms/frame                   │    │
  │  │ 144fps → 1000/144 = 6.94ms/frame                   │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  PS: Trong gaming, FPS cũng = First Person Shooter!         │
  │  (Call of Duty, Overwatch, Battlefield, PUBG...)             │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```

---

## §4. Refresh Rate — Tần Số Quét (Hz)!

```
  REFRESH RATE:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  ĐỊNH NGHĨA:                                                  │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ Refresh Rate = số lần MÀN HÌNH vẽ hình mới/giây! │    │
  │  │ Đơn vị: Hertz (Hz)!                                │    │
  │  │ = Đo SCREEN display!                               │    │
  │  │                                                      │    │
  │  │ Hz (Hertz): đơn vị tần số trong SI!                │    │
  │  │ = số sự kiện tuần hoàn xảy ra trong 1 giây!       │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  CÁC MỨC:                                                     │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ 60Hz   → Phổ biến (laptop, phone cũ!)             │    │
  │  │ 90Hz   → Phone mid-range!                          │    │
  │  │ 120Hz  → Phone cao cấp, iPad Pro!                  │    │
  │  │ 144Hz  → Gaming monitor!                           │    │
  │  │ 240Hz  → Competitive esports!                      │    │
  │  │ 360Hz  → Pro gaming!                               │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  ĐẶC ĐIỂM:                                                    │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ → Hz thường là TỐC ĐỘ CỐ ĐỊNH!                  │    │
  │  │ → KHÔNG thay đổi theo độ phức tạp scene!          │    │
  │  │ → 60Hz = luôn quét 60 lần/giây!                   │    │
  │  │ → Dù content đơn giản hay phức tạp!               │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```

---

## §5. FPS vs Hz — Content vs Screen!

```
  FPS vs Hz:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  SO SÁNH:                                                     │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │        FPS                    Hz                     │    │
  │  │ ┌──────────────┐    ┌──────────────┐               │    │
  │  │ │ CONTENT      │    │ SCREEN       │               │    │
  │  │ │ display!     │    │ display!     │               │    │
  │  │ │              │    │              │               │    │
  │  │ │ GPU tạo bao │    │ Màn hình quét│               │    │
  │  │ │ nhiêu frame/ │    │ bao nhiêu    │               │    │
  │  │ │ giây?        │    │ lần/giây?    │               │    │
  │  │ │              │    │              │               │    │
  │  │ │ BIẾN ĐỘNG!   │    │ CỐ ĐỊNH!   │               │    │
  │  │ │ Tùy scene!   │    │ Phần cứng!  │               │    │
  │  │ │              │    │              │               │    │
  │  │ │ Có thể vô   │    │ Giới hạn     │               │    │
  │  │ │ hạn!         │    │ bởi hardware!│               │    │
  │  │ └──────────────┘    └──────────────┘               │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  KEY INSIGHT:                                                  │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ → FPS có thể CAO vô hạn!                           │    │
  │  │ → Nhưng Hz QUYẾT ĐỊNH giới hạn display!           │    │
  │  │                                                      │    │
  │  │ VÍ DỤ:                                              │    │
  │  │ Video 60FPS trên phone 120Hz:                       │    │
  │  │ → Giống hệt trên phone 60Hz!                      │    │
  │  │ → Vì content chỉ có 60 frames/giây!               │    │
  │  │ → 120Hz phone hiển thị cùng frame 2 lần!          │    │
  │  │                                                      │    │
  │  │ Game 240FPS trên monitor 60Hz:                      │    │
  │  │ → Chỉ thấy 60 frames/giây!                        │    │
  │  │ → 180 frames bị BỎ QUA!                           │    │
  │  │ → Hz = GIỚI HẠN TRÊN!                             │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  FPS BIẾN ĐỘNG:                                                │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ Scene đơn giản:  GPU render nhanh → FPS CAO!      │    │
  │  │ Scene phức tạp:  GPU render chậm → FPS THẤP!     │    │
  │  │ Frame time KHÔNG đều giữa các frames!              │    │
  │  │                                                      │    │
  │  │ Hz CỐ ĐỊNH:                                         │    │
  │  │ 60Hz = luôn 16.67ms quét 1 lần, dù scene gì!     │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```

---

## §6. Screen Tearing — Xé Hình!

```
  SCREEN TEARING:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  HIỆN TƯỢNG:                                                   │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ Màn hình hiển thị 2+ frames CÙNG LÚC!             │    │
  │  │ → Hình ảnh bị "xé" ngang!                         │    │
  │  │ → Nửa trên = frame cũ, nửa dưới = frame mới!    │    │
  │  │                                                      │    │
  │  │ ┌──────────────────────┐                             │    │
  │  │ │ ████████████████████ │ ← Frame A (cũ!)          │    │
  │  │ │ ████████████████████ │                             │    │
  │  │ │ ████████████████████ │                             │    │
  │  │ │═════════════XÉ══════│ ← ĐƯỜNG XÉ!              │    │
  │  │ │ ░░░░░░░░░░░░░░░░░░░ │ ← Frame B (mới!)         │    │
  │  │ │ ░░░░░░░░░░░░░░░░░░░ │                             │    │
  │  │ └──────────────────────┘                             │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  KHI NÀO XẢY RA?                                              │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ ① FPS > Hz (GPU nhanh hơn monitor!):               │    │
  │  │   → GPU xong frame mới TRƯỚC khi monitor quét xong│    │
  │  │   → Monitor đang quét frame cũ, frame mới đến!   │    │
  │  │   → Quét nửa cũ + nửa mới → XÉ!                │    │
  │  │                                                      │    │
  │  │ ② FPS < Hz (GPU chậm hơn monitor!):               │    │
  │  │   → Monitor quét xong frame cũ, frame mới CHƯA có│    │
  │  │   → Monitor quét lại frame cũ!                     │    │
  │  │   → Giữa chừng frame mới đến → XÉ!              │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```

---

## §7. GPU — Card Đồ Họa!

```
  GPU:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  CARD ĐỒ HỌA (Video Card):                                   │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ → Phần cứng chịu trách nhiệm OUTPUT + DISPLAY!    │    │
  │  │ → Chip chính = GPU (Graphics Processing Unit!)     │    │
  │  │ → = Bộ xử lý đồ họa!                             │    │
  │  │                                                      │    │
  │  │ 2 nhà sản xuất chính:                               │    │
  │  │ → NVIDIA (Card N!) — GeForce, RTX                  │    │
  │  │ → AMD (Card A!) — Radeon, RX                       │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  GPU + MONITOR — QUY TRÌNH:                                    │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │                                                      │    │
  │  │  GPU TẠO HÌNH        MONITOR HIỂN THỊ               │    │
  │  │  ┌──────────┐        ┌──────────────┐               │    │
  │  │  │ Render   │ ─────→ │ Quét từ trên │               │    │
  │  │  │ frame!   │ buffer │ xuống dưới!  │               │    │
  │  │  │          │        │ từng dòng!   │               │    │
  │  │  └──────────┘        └──────────────┘               │    │
  │  │                                                      │    │
  │  │ QUÉT TỪNG DÒNG (Scanline):                          │    │
  │  │ ┌──────────────────┐                                │    │
  │  │ │→→→→→→→→→→→→→→→→│ dòng 1                        │    │
  │  │ │→→→→→→→→→→→→→→→→│ dòng 2                        │    │
  │  │ │→→→→→→→→→→→→→→→→│ dòng 3                        │    │
  │  │ │       ...        │                                │    │
  │  │ │→→→→→→→→→→→→→→→→│ dòng cuối                     │    │
  │  │ └──────────────────┘                                │    │
  │  │ ↑ Trên xuống dưới, trái sang phải!                │    │
  │  │                                                      │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  VẤN ĐỀ ĐỒNG BỘ:                                             │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ LÝ TƯỞNG:                                           │    │
  │  │ GPU xong frame → Monitor bắt đầu quét → HOÀN HẢO!│   │
  │  │                                                      │    │
  │  │ THỰC TẾ:                                            │    │
  │  │ GPU NHANH: frame mới đến khi monitor đang quét!   │    │
  │  │ GPU CHẬM: monitor chờ, quét lại frame cũ!         │    │
  │  │ → CẢ HAI → XÉ HÌNH!                              │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```

---

## §8. Vertical Sync — Đồng Bộ Dọc!

```
  VSYNC:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  GIẢI PHÁP CHO SCREEN TEARING:                                │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ Vertical Sync (VSync — Đồng bộ dọc!):              │    │
  │  │ → Ép monitor CHỜ quét XONG frame hiện tại!        │    │
  │  │ → Rồi mới quét frame MỚI từ GPU!                  │    │
  │  │ → KHÔNG bao giờ quét GIỮA CHỪNG!                  │    │
  │  │ → → Screen tearing: SOLVED! ✅                   │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  KHÔNG VSYNC:                                                  │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ GPU:     [Frame A][Frame B    ][Frame C]            │    │
  │  │ Monitor: [──quét A──][──quét──]                     │    │
  │  │                   ↑                                  │    │
  │  │           Frame B đến GIỮA CHỪNG!                   │    │
  │  │           → NỬA A + NỬA B = XÉ! ❌               │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  CÓ VSYNC:                                                    │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ GPU:     [Frame A][Frame B      ][Frame C]          │    │
  │  │ Monitor: [──quét A──][──quét B──][──quét C──]      │    │
  │  │                      ↑                               │    │
  │  │              CHỜ quét A xong → rồi quét B!          │    │
  │  │              → KHÔNG XÉ! ✅                        │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  NHƯỢC ĐIỂM VSYNC:                                            │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ GPU CHẬM + VSYNC:                                   │    │
  │  │ → Monitor quét xong frame A!                        │    │
  │  │ → Frame B CHƯA SẴN SÀNG!                          │    │
  │  │ → Monitor phải quét LẠI frame A! (chờ!)           │    │
  │  │ → Frame B đến giữa chừng quét A lần 2!           │    │
  │  │ → VSync: CHỜ quét xong A lần 2 → rồi quét B!   │    │
  │  │ → = THÊM 1 frame delay!                            │    │
  │  │ → Input lag TĂNG! Game competitive: BẤT LỢI! ❌  │    │
  │  │                                                      │    │
  │  │ NÊN:                                                 │    │
  │  │ → Competitive gaming: TẮT VSync (chấp nhận xé!)  │    │
  │  │ → Single player: BẬT VSync (visual quality!)      │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```

---

## §9. Phim 24fps vs Game 24fps!

```
  TẠI SAO PHIM 24fps MƯỢT NHƯNG GAME 24fps GIẬT?
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  LÝ DO 1: CÁCH TẠO HÌNH KHÁC NHAU!                          │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ PHIM:                                                │    │
  │  │ → Camera chụp 24 ảnh/giây!                         │    │
  │  │ → Mỗi ảnh có THỜI GIAN PHƠI SÁNG!                │    │
  │  │ → Vật di chuyển nhanh → NHÒE (motion blur!)      │    │
  │  │ → Giống cách MẮT thấy thực tế!                    │    │
  │  │ → Tự nhiên, mượt mà!                               │    │
  │  │                                                      │    │
  │  │ Pause phim hành động:                                │    │
  │  │ [████████░░░░░░░] ← hình NHÒE!                    │    │
  │  │                                                      │    │
  │  │ GAME:                                                │    │
  │  │ → GPU render từng frame SẮC NÉT!                  │    │
  │  │ → KHÔNG có motion blur tự nhiên!                   │    │
  │  │ → FPS thấp = nhảy từ vị trí A → B! GIẬT!       │    │
  │  │ → FPS cao = nhiều frame nét → não merge → mượt!  │    │
  │  │                                                      │    │
  │  │ Frame game:                                          │    │
  │  │ [████████████████] ← hình SẮC NÉT!                │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  LÝ DO 2: FPS ỔN ĐỊNH vs BIẾN ĐỘNG!                         │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ PHIM: 24fps ỔN ĐỊNH!                                │    │
  │  │ → Mỗi frame cách nhau ĐÚNG 41.67ms!               │    │
  │  │ → Đều đặn, não xử lý dễ dàng!                    │    │
  │  │                                                      │    │
  │  │ GAME: FPS BIẾN ĐỘNG!                                 │    │
  │  │ → Ví dụ "60fps" nhưng:                             │    │
  │  │   → 0.5s đầu: 59 frames (0.5ms/frame!)           │    │
  │  │   → 0.5s sau: 1 frame (500ms!)                    │    │
  │  │   → Trung bình = 60fps nhưng GIẬT!               │    │
  │  │   → 1 gap 0.1s → user ĐÃ CẢM NHẬN được!       │    │
  │  │                                                      │    │
  │  │ + GAME có user input!                                │    │
  │  │ → User nhấn nút → chờ phản hồi!                   │    │
  │  │ → FPS drop → delay phản hồi → CẢM GIÁC LAG!    │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```

---

## §10. Browser 60Hz + 16ms + React 5ms!

```
  BROWSER + 16ms + REACT:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  "16ms" CỦA REACT:                                            │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ THƯỜNG NGHE:                                          │    │
  │  │ "Browser refresh 60Hz, mỗi frame = 16.6ms,          │    │
  │  │  JS phải xong trong 16.6ms!"                         │    │
  │  │                                                      │    │
  │  │ CẦN LÀM RÕ MỘT SỐ ĐIỂM:                          │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  LÀM RÕ 1: BROWSER KHÔNG KIỂM SOÁT HARDWARE!                │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ → Browser = ỨNG DỤNG, không phải phần cứng!       │    │
  │  │ → Browser KHÔNG kiểm soát refresh rate!            │    │
  │  │ → Browser chỉ CỐ GẮNG cung cấp frame đúng lúc!  │    │
  │  │ → 60Hz vì: mắt người ít phân biệt > 60Hz!        │    │
  │  │ → Monitor 120Hz → browser cũng cố 120fps!        │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  LÀM RÕ 2: 16.6ms KHÔNG PHẢI CHO JS!                       │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ 16.67ms = TOÀN BỘ frame! Bao gồm:                 │    │
  │  │                                                      │    │
  │  │ [Input][JS][Begin Frame][rAF][Layout][Paint]        │    │
  │  │  ~1ms  ~5ms   ~1ms     ~1ms  ~3ms    ~3ms          │    │
  │  │        ↑                                             │    │
  │  │   JS CHỈ CÓ ~5ms! KHÔNG PHẢI 16.6ms!             │    │
  │  │                                                      │    │
  │  │ React: frameInterval = 5ms!                         │    │
  │  │ → React time slice = CHỈ 5ms! ★                   │    │
  │  │ → KHÔNG phải 16.6ms!                               │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  TÍNH TOÁN:                                                    │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ 16.67ms total frame budget:                         │    │
  │  │ - Input events:    ~1ms                              │    │
  │  │ - Begin frame:     ~1ms                              │    │
  │  │ - rAF callbacks:   ~1ms                              │    │
  │  │ - Layout:          ~3ms                              │    │
  │  │ - Paint:           ~3ms                              │    │
  │  │ - Compositing:     ~2ms                              │    │
  │  │ ─────────────────────                                │    │
  │  │ TỔNG overhead:     ~11ms                             │    │
  │  │ CÒN LẠI cho JS:   ~5-6ms! ★                       │    │
  │  │                                                      │    │
  │  │ → React: const frameInterval = 5; // 5ms!          │    │
  │  │ → shouldYieldToHost: elapsed >= 5ms → yield!       │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```

---

## §11. Life of a Frame — Chi Tiết!

```
  LIFE OF A FRAME:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  ← ─ ─ ─ ─ ─ ─ 16.67ms (60Hz) ─ ─ ─ ─ ─ ─ →            │
  │                                                              │
  │  ① Input Events:                                             │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ Blocking:        Non-blocking:                       │    │
  │  │ → touch          → click                            │    │
  │  │ → wheel          → keypress                         │    │
  │  │                                                      │    │
  │  │ Blocking = ĐỢI xử lý! (touch scroll!)             │    │
  │  │ Non-blocking = KHÔNG đợi!                           │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  ② JS (Timers):                                              │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ → setTimeout callbacks!                              │    │
  │  │ → setInterval callbacks!                              │    │
  │  │ → Promise microtasks!                                 │    │
  │  │ → Script execution!                                   │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  ③ Begin Frame (Per Frame Events):                           │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ → window resize events!                              │    │
  │  │ → scroll events!                                      │    │
  │  │ → media query changed!                                │    │
  │  │ → animation events (CSS!)                             │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  ④ rAF (requestAnimationFrame):                              │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ → requestAnimationFrame callbacks! ★               │    │
  │  │ → IntersectionObserver callbacks!                    │    │
  │  │ → CƠ HỘI CUỐI sửa style trước render!            │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  ⑤ Layout:                                                   │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ → Recalc style (tính toán CSS!)                     │    │
  │  │ → Update layout (tính vị trí + kích thước!)        │    │
  │  │ → ResizeObserver callbacks!                          │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  ⑥ Paint:                                                    │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ → Compositing update (ghép layers!)                 │    │
  │  │ → Paint invalidation (vẽ lại vùng thay đổi!)     │    │
  │  │ → Record (ghi nhận để composite!)                   │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  ⑦ Idle Period (nếu CÒN THỜI GIAN):                        │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ → requestIdleCallback chạy ĐÂY!                    │    │
  │  │ → Background tasks!                                  │    │
  │  │ → Low-priority work!                                  │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```

---

## §12. Sơ Đồ Tự Vẽ!

### Sơ Đồ 1: Persistence of Vision → Video

```
  PERSISTENCE OF VISION:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  THỰC TẾ (hình tĩnh):                                        │
  │  [●    ] [  ●  ] [    ●] [  ●  ] [●    ]                    │
  │   t=0ms   t=42ms  t=83ms  t=125ms t=167ms                   │
  │                                                              │
  │  MẮT THẤY (lưu ảnh):                                         │
  │  ●────────●────────●────────●────────●                      │
  │  ↑ hình trước CHƯA TAN khi hình sau ĐẾN!                  │
  │  → Não ghép nối → CHUYỂN ĐỘNG!                             │
  │                                                              │
  │  SỐ FRAME:                                                    │
  │  24fps: ●  ●  ●  ●  ●  ●  ●  ●  ... (phim!)              │
  │  60fps: ●●●●●●●●●●●●●●●●●●●●●●●●... (browser!)           │
  │         ↑ dày đặc hơn = MƯỢT hơn!                         │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```

### Sơ Đồ 2: FPS vs Hz

```
  FPS vs Hz:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  GPU (FPS)            MONITOR (Hz)          USER SEES        │
  │  ┌──────────┐        ┌──────────┐        ┌──────────┐      │
  │  │ Creates  │ ─────→ │ Displays │ ─────→ │ Perceives│      │
  │  │ frames!  │ buffer │ frames!  │ eyes   │ motion!  │      │
  │  └──────────┘        └──────────┘        └──────────┘      │
  │                                                              │
  │  CASE 1: FPS = Hz (lý tưởng!)                               │
  │  GPU: [A][B][C][D][E][F]                                    │
  │  Mon: [A][B][C][D][E][F]   → PERFECT! ✅                  │
  │                                                              │
  │  CASE 2: FPS > Hz (GPU nhanh!)                               │
  │  GPU: [A][B][C][D][E][F][G][H]                              │
  │  Mon: [A][C][E][G]         → Skip frames! XÉ! ❌          │
  │                                                              │
  │  CASE 3: FPS < Hz (GPU chậm!)                               │
  │  GPU: [A]    [B]    [C]                                      │
  │  Mon: [A][A][B][B][C][C]   → Repeat frames! XÉ! ❌        │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```

### Sơ Đồ 3: VSync On vs Off

```
  VSYNC:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  VSYNC OFF (xé hình!):                                       │
  │  GPU:     [Frame A][Frame B      ][Frame C  ]               │
  │  Monitor: [──A──][B arrives mid-scan!][──C──]                │
  │                   ↑                                          │
  │            [AAAA|BBBB] ← xé! ❌                             │
  │                                                              │
  │  VSYNC ON (chờ quét xong!):                                  │
  │  GPU:     [Frame A][Frame B      ][Frame C  ]               │
  │  Monitor: [──quét A──][──quét B──][──quét C──]              │
  │                       ↑                                      │
  │                CHỜ A xong → bắt đầu B! ✅                 │
  │                Nhưng: thêm 1 frame DELAY! ⚠️                │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```

### Sơ Đồ 4: Phim 24fps vs Game 24fps

```
  PHIM vs GAME:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  PHIM 24fps (MƯỢT!):                                         │
  │  Frame 1      Frame 2      Frame 3                          │
  │  [████░░░░]    [░░████░░]    [░░░░████]                      │
  │  ↑ motion blur! Nhòe tự nhiên!                             │
  │  ↑ FPS ổn định! 41.67ms đều!                               │
  │  ↑ Không user input!                                        │
  │                                                              │
  │  GAME 24fps (GIẬT!):                                         │
  │  Frame 1      Frame 2      Frame 3                          │
  │  [████████]    [████████]    [████████]                      │
  │  ↑ sắc nét! KHÔNG nhòe!                                   │
  │  ↑ FPS biến động! Có thể gap 500ms!                       │
  │  ↑ CÓ user input → lag phản hồi!                          │
  │                                                              │
  │  Game 24fps:                                                  │
  │  [Frame]            [Frm][Frm]...(59 frames)                │
  │  ← 500ms gap! →← 0.5s = 59 frames! →                     │
  │  User: "GIẬT!" 🔴    User: "Nhanh quá!" 🟡                 │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```

### Sơ Đồ 5: 16.67ms Frame Budget → React 5ms

```
  16.67ms FRAME BUDGET:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  ← ─ ─ ─ ─ ─ ─ 16.67ms total ─ ─ ─ ─ ─ ─ →              │
  │                                                              │
  │  ┌────┬─────┬──────┬────┬──────┬──────┬────┐              │
  │  │Inp │ JS  │Begin │rAF │Layout│ Paint│Idle│              │
  │  │    │ ★  │Frame │    │      │      │    │              │
  │  │1ms │5ms! │ 1ms  │1ms │ 3ms  │ 3ms  │2ms │              │
  │  └────┴─────┴──────┴────┴──────┴──────┴────┘              │
  │        ↑                                                     │
  │  React Time Slice = 5ms!                                     │
  │  const frameInterval = 5;                                    │
  │  shouldYieldToHost() = elapsed >= 5ms → yield!              │
  │                                                              │
  │  QUAN TRỌNG:                                                   │
  │  → 16.67ms ≠ thời gian cho JS!                             │
  │  → JS chỉ được ~5ms trong 16.67ms frame!                  │
  │  → Phần còn lại = input + layout + paint + composite!      │
  │  → React: frameInterval = 5ms! (KHÔNG phải 16ms!)         │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```

---

## §13. Tự Viết — FrameTimingEngine!

```javascript
/**
 * FrameTimingEngine — Mô phỏng Frame, FPS, Hz, VSync!
 * Tự viết bằng tay, KHÔNG dùng thư viện!
 */
var FrameTimingEngine = (function () {

  var log = [];
  function reset() { log = []; }

  // ═══════════════════════════════════
  // 1. FPS + FRAME TIME CALCULATOR
  // ═══════════════════════════════════
  function calculateFrameTime(fps) {
    return 1000 / fps;
  }

  function calculateFPS(frameTimeMs) {
    return 1000 / frameTimeMs;
  }

  // ═══════════════════════════════════
  // 2. FPS vs HZ SIMULATOR
  // ═══════════════════════════════════
  function simulateFpsVsHz(fps, hz, durationMs) {
    durationMs = durationMs || 1000;
    var gpuFrameTime = calculateFrameTime(fps);
    var monitorScanTime = calculateFrameTime(hz);

    var gpuFrames = [];
    var displayedFrames = [];
    var tearings = 0;

    // GPU produces frames
    var t = 0;
    var frameNum = 0;
    while (t < durationMs) {
      frameNum++;
      gpuFrames.push({ id: frameNum, readyAt: t });
      t += gpuFrameTime;
    }

    // Monitor scans at Hz rate
    t = 0;
    var lastDisplayedFrame = 0;
    while (t < durationMs) {
      // Find latest GPU frame ready by time t
      var latestFrame = 0;
      for (var i = 0; i < gpuFrames.length; i++) {
        if (gpuFrames[i].readyAt <= t) {
          latestFrame = gpuFrames[i].id;
        }
      }

      if (latestFrame !== lastDisplayedFrame && lastDisplayedFrame !== 0) {
        // Check if frame changed mid-scan (simplified tearing detection)
        var timeSinceReady = t - gpuFrames[latestFrame - 1].readyAt;
        if (timeSinceReady < monitorScanTime * 0.5) {
          tearings++;
        }
      }

      displayedFrames.push(latestFrame);
      lastDisplayedFrame = latestFrame;
      t += monitorScanTime;
    }

    return {
      fps: fps,
      hz: hz,
      gpuFramesProduced: gpuFrames.length,
      monitorScans: displayedFrames.length,
      possibleTearings: tearings,
      efficiency: Math.min(fps, hz) / Math.max(fps, hz)
    };
  }

  // ═══════════════════════════════════
  // 3. VSYNC SIMULATOR
  // ═══════════════════════════════════
  function simulateVSync(fps, hz, vsyncOn) {
    var gpuFrameTime = calculateFrameTime(fps);
    var scanTime = calculateFrameTime(hz);
    var durationMs = 500;
    var delays = [];
    var tearings = 0;

    var gpuTime = 0;
    var monitorTime = 0;
    var framesShown = 0;

    while (monitorTime < durationMs) {
      if (vsyncOn) {
        // VSync: wait for scan to complete before showing new frame
        if (gpuTime <= monitorTime) {
          // GPU frame ready, show at next scan boundary
          framesShown++;
          var delay = monitorTime - gpuTime;
          delays.push(delay);
          gpuTime += gpuFrameTime;
        }
        monitorTime += scanTime;
      } else {
        // No VSync: show immediately, may tear
        if (gpuTime <= monitorTime) {
          framesShown++;
          var midScan = (monitorTime % scanTime) / scanTime;
          if (midScan > 0.1 && midScan < 0.9) {
            tearings++;
          }
          gpuTime += gpuFrameTime;
        }
        monitorTime += scanTime;
      }
    }

    var avgDelay = 0;
    if (delays.length > 0) {
      for (var i = 0; i < delays.length; i++) avgDelay += delays[i];
      avgDelay /= delays.length;
    }

    return {
      vsync: vsyncOn,
      framesShown: framesShown,
      tearings: tearings,
      avgDelayMs: avgDelay.toFixed(2)
    };
  }

  // ═══════════════════════════════════
  // 4. FRAME BUDGET CALCULATOR
  // ═══════════════════════════════════
  function calculateBudget(hz) {
    var frameTime = calculateFrameTime(hz);
    var inputEvents = 1;
    var beginFrame = 1;
    var rAF = 1;
    var layout = 3;
    var paint = 3;
    var compositing = 2;
    var overhead = inputEvents + beginFrame + rAF +
      layout + paint + compositing;
    var jsTime = frameTime - overhead;

    return {
      hz: hz,
      totalFrameMs: frameTime.toFixed(2),
      overheadMs: overhead,
      jsAvailableMs: Math.max(0, jsTime).toFixed(2),
      reactTimeSlice: 5,
      breakdown: {
        inputEvents: inputEvents,
        beginFrame: beginFrame,
        rAF: rAF,
        layout: layout,
        paint: paint,
        compositing: compositing
      }
    };
  }

  // ═══════════════════════════════════
  // 5. MOVIE vs GAME COMPARATOR
  // ═══════════════════════════════════
  function compareMovieVsGame(fps) {
    var frameTime = calculateFrameTime(fps);

    // Movie: stable frame time
    var movieFrameTimes = [];
    for (var i = 0; i < 10; i++) {
      movieFrameTimes.push(frameTime);
    }

    // Game: variable frame time (same average!)
    var gameFrameTimes = [];
    var remaining = frameTime * 10; // total time
    for (var i = 0; i < 9; i++) {
      var variation = frameTime * (0.5 + Math.random());
      gameFrameTimes.push(variation);
      remaining -= variation;
    }
    gameFrameTimes.push(Math.max(1, remaining));

    // Calculate jitter (variance)
    var movieJitter = 0;
    var gameJitter = 0;
    for (var i = 1; i < 10; i++) {
      movieJitter += Math.abs(movieFrameTimes[i] - movieFrameTimes[i - 1]);
      gameJitter += Math.abs(gameFrameTimes[i] - gameFrameTimes[i - 1]);
    }

    return {
      fps: fps,
      movieJitter: (movieJitter / 9).toFixed(2),
      gameJitter: (gameJitter / 9).toFixed(2),
      movieSmooth: true,
      gameSmooth: gameJitter < frameTime
    };
  }

  // ═══════════════════════════════════
  // DEMO
  // ═══════════════════════════════════
  function demo() {
    console.log('╔═══════════════════════════════════════════╗');
    console.log('║  FRAME TIMING ENGINE — DEMO                 ║');
    console.log('╚═══════════════════════════════════════════╝');

    // 1. Frame Time Calculator
    console.log('\n--- 1. FRAME TIME ---');
    [24, 30, 60, 120, 144].forEach(function (fps) {
      console.log('  ' + fps + 'fps → ' +
        calculateFrameTime(fps).toFixed(2) + 'ms/frame');
    });

    // 2. FPS vs Hz
    console.log('\n--- 2. FPS vs Hz ---');
    var scenarios = [
      [60, 60], [120, 60], [30, 60], [60, 144]
    ];
    scenarios.forEach(function (s) {
      var r = simulateFpsVsHz(s[0], s[1]);
      console.log('  ' + s[0] + 'fps @ ' + s[1] + 'Hz: ' +
        'GPU=' + r.gpuFramesProduced + ' Monitor=' + r.monitorScans +
        ' Efficiency=' + (r.efficiency * 100).toFixed(0) + '%');
    });

    // 3. VSync
    console.log('\n--- 3. VSYNC ---');
    var vOff = simulateVSync(90, 60, false);
    var vOn = simulateVSync(90, 60, true);
    console.log('  90fps@60Hz VSync OFF: tearings=' + vOff.tearings);
    console.log('  90fps@60Hz VSync ON:  tearings=' + vOn.tearings +
      ' delay=' + vOn.avgDelayMs + 'ms');

    // 4. Frame Budget
    console.log('\n--- 4. FRAME BUDGET ---');
    [60, 120, 144].forEach(function (hz) {
      var b = calculateBudget(hz);
      console.log('  ' + hz + 'Hz: total=' + b.totalFrameMs +
        'ms overhead=' + b.overheadMs + 'ms JS=' + b.jsAvailableMs +
        'ms React=' + b.reactTimeSlice + 'ms');
    });

    // 5. Movie vs Game
    console.log('\n--- 5. MOVIE vs GAME ---');
    var cmp = compareMovieVsGame(24);
    console.log('  24fps Movie jitter: ' + cmp.movieJitter +
      'ms → Smooth: ' + cmp.movieSmooth);
    console.log('  24fps Game jitter:  ' + cmp.gameJitter +
      'ms → Smooth: ' + cmp.gameSmooth);

    console.log('\n╔═══════════════════════════════════════════╗');
    console.log('║  ✅ Demo Complete!                           ║');
    console.log('╚═══════════════════════════════════════════╝');
  }

  return {
    calculateFrameTime: calculateFrameTime,
    calculateFPS: calculateFPS,
    simulateFpsVsHz: simulateFpsVsHz,
    simulateVSync: simulateVSync,
    calculateBudget: calculateBudget,
    compareMovieVsGame: compareMovieVsGame,
    demo: demo
  };
})();

// Chạy: FrameTimingEngine.demo();
```

---

## §14. Câu Hỏi Luyện Tập!

### ❓ Câu 1: Lưu ảnh võng mạc là gì? Tại sao quan trọng?

**Trả lời:**

- Hình ảnh **CÒN LƯU** trên thần kinh thị giác **0.1-0.4 giây** sau khi vật biến mất!
- Nhờ hiện tượng này, chuỗi ảnh tĩnh → **CHUYỂN ĐỘNG**!
- Nền tảng của TẤT CẢ media: phim, TV, game, browser animation!
- 24 ảnh/giây → mắt ghép nối → cảm nhận di chuyển!

### ❓ Câu 2: FPS vs Hz khác nhau thế nào?

**Trả lời:**

| | FPS | Hz |
|---|---|---|
| Đo gì? | **Content** (GPU tạo) | **Screen** (monitor quét) |
| Tính chất | **BIẾN ĐỘNG** (tùy scene) | **CỐ ĐỊNH** (hardware) |
| Giới hạn | Vô hạn (GPU có thể) | Phần cứng quyết định |
| Ý nghĩa | Bao nhiêu frame/giây? | Bao nhiêu lần quét/giây? |

- Hz = **GIỚI HẠN TRÊN** của display!
- 240FPS + 60Hz = chỉ THẤY 60fps!

### ❓ Câu 3: Screen tearing xảy ra khi nào?

**Trả lời:**

- Khi **FPS ≠ Hz** → GPU và monitor KHÔNG đồng bộ!
- **FPS > Hz**: GPU gửi frame mới khi monitor đang quét frame cũ!
- **FPS < Hz**: Monitor quét lại frame cũ, frame mới đến giữa chừng!
- → Nửa screen = frame A, nửa screen = frame B = **XÉ!**

### ❓ Câu 4: VSync giải quyết gì? Nhược điểm?

**Trả lời:**

**Giải quyết**: Screen tearing! Ép monitor CHỜ quét xong → rồi quét frame mới!

**Nhược điểm**:
- **Input lag TĂNG**! GPU chậm → monitor quét lại frame cũ → chờ thêm 1 frame!
- **Competitive gaming**: delay phản hồi → BẤT LỢI!
- → Pro players thường TẮT VSync, chấp nhận xé hình!

### ❓ Câu 5: Phim 24fps mượt, game 24fps giật, tại sao?

**Trả lời:**

**2 lý do:**

1. **Motion blur**:
   - Phim: camera phơi sáng → vật nhanh = NHÒE → tự nhiên!
   - Game: GPU render SẮC NÉT → nhảy vị trí = GIẬT!

2. **FPS ổn định**:
   - Phim: 24fps ĐỀU ĐẶN (41.67ms/frame!)
   - Game: biến động! có thể 59 frames + 1 frame gap 500ms → GIẬT!
   - + User input trong game → lag phản hồi cảm nhận rõ hơn!

### ❓ Câu 6: 16ms cho JS đúng hay sai?

**Trả lời:**

**SAI!** 16.67ms = **TOÀN BỘ frame**, bao gồm:
- Input events (~1ms)
- Begin Frame (~1ms)
- rAF (~1ms)
- Layout (~3ms)
- Paint (~3ms)
- Compositing (~2ms)
- **JS chỉ được ~5-6ms!**

React: `frameInterval = 5ms` → shouldYieldToHost() yield sau 5ms!

### ❓ Câu 7: Tại sao browser "60Hz"?

**Trả lời:**

- Browser = **ỨNG DỤNG**, không kiểm soát hardware!
- Browser CỐ GẮNG cung cấp frame đúng refresh rate!
- 60Hz vì: **mắt người** khó phân biệt > 60Hz!
- Monitor 120Hz → browser cũng cố 120fps!
- "60Hz" = target MẶC ĐỊNH, không phải giới hạn cứng!

---

> 🎯 **Tổng kết Từ Lưu Ảnh → 16ms:**
> - **Lưu ảnh võng mạc**: 0.1-0.4s → chuỗi ảnh tĩnh = video!
> - **Frame**: 1 ảnh tĩnh trong chuỗi, browser frame = input→JS→rAF→layout→paint!
> - **FPS**: frames/giây (content, biến động) ≠ **Hz** (screen, cố định)!
> - **Hz = giới hạn trên** display, FPS có thể vô hạn!
> - **Screen tearing**: FPS ≠ Hz → nửa frame A + nửa B!
> - **GPU**: tạo hình → buffer → monitor quét từ trên xuống dưới!
> - **VSync**: chờ quét xong → không xé nhưng thêm delay!
> - **Phim 24fps mượt**: motion blur + FPS ổn định!
> - **Game 24fps giật**: sắc nét + FPS biến động + user input!
> - **16.67ms frame ≠ 16ms cho JS!** Overhead ~11ms → JS = ~5ms!
> - **React: frameInterval = 5ms!** (KHÔNG phải 16ms!)
> - **FrameTimingEngine** tự viết: FPS↔Hz, VSync, budget, movie vs game!
> - **7 câu hỏi** luyện tập với đáp án chi tiết!
