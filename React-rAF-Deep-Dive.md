# React requestAnimationFrame — Deep Dive!

> **Chủ đề**: requestAnimationFrame API — Browser Animation Frame
> **Ngôn ngữ**: Tiếng Việt — giải thích cực kỳ chi tiết!
> **Phương châm**: Tự viết lại bằng tay — KHÔNG dùng thư viện!
> **Nguồn**: "Exploring the Execution Mechanism of React's requestAnimationFrame"

---

## Mục Lục

1. [§1. Tổng Quan — requestAnimationFrame](#1)
2. [§2. Cú Pháp + cancelAnimationFrame](#2)
3. [§3. Thời Điểm Thực Thi — Life of a Frame](#3)
4. [§4. rAF Override — Cùng Frame!](#4)
5. [§5. Nested rAF — Frame Tiếp Theo!](#5)
6. [§6. Tần Suất — 60fps + DOMHighResTimeStamp](#6)
7. [§7. High Refresh Rate — Chuẩn Hóa Speed](#7)
8. [§8. setTimeout vs rAF — Tại Sao Khác?](#8)
9. [§9. useAnimationFrame Hook — Tự Viết!](#9)
10. [§10. Sơ Đồ Tự Vẽ](#10)
11. [§11. Tự Viết — AnimationFrameEngine](#11)
12. [§12. Câu Hỏi Luyện Tập](#12)

---

## §1. Tổng Quan — requestAnimationFrame!

```
  requestAnimationFrame (rAF):
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  ĐỊNH NGHĨA (MDN):                                            │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ window.requestAnimationFrame(callback)               │    │
  │  │                                                      │    │
  │  │ → Nói browser: "Tôi muốn chạy animation!"         │    │
  │  │ → Browser gọi callback TRƯỚC khi repaint!          │    │
  │  │ → Callback được gọi ~60 lần/giây (60Hz!)          │    │
  │  │ → Tự động sync với refresh rate!                   │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  TẠI SAO CẦN rAF?                                             │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ setTimeout/setInterval:                              │    │
  │  │ → KHÔNG sync với refresh rate!                      │    │
  │  │ → Có thể chạy GIỮA 2 frames → lãng phí!         │    │
  │  │ → Có thể skip frames → GIẬT!                     │    │
  │  │                                                      │    │
  │  │ requestAnimationFrame:                                │    │
  │  │ → SYNC với refresh rate! 1 call = 1 frame!        │    │
  │  │ → Chạy TRƯỚC repaint → optimal!                   │    │
  │  │ → Browser TỐI ƯU → smooth animation!              │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  REACT + rAF:                                                 │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ → React v16.0: dùng rAF + postMessage!            │    │
  │  │ → React v16.2: BỎ rAF → MessageChannel!           │    │
  │  │ → React polyfill: rAF || setTimeout!               │    │
  │  │ → useAnimationFrame hook → custom hook!            │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```

---

## §2. Cú Pháp + cancelAnimationFrame!

```
  CÚ PHÁP:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  requestAnimationFrame:                                       │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ var handle = window.requestAnimationFrame(callback); │    │
  │  │                                                      │    │
  │  │ handle:                                              │    │
  │  │ → Long integer = request ID!                        │    │
  │  │ → Unique identifier trong callback list!            │    │
  │  │ → Dùng cho cancelAnimationFrame(handle)!            │    │
  │  │                                                      │    │
  │  │ callback(timestamp):                                  │    │
  │  │ → Gọi TRƯỚC repaint tiếp theo!                    │    │
  │  │ → Nhận DOMHighResTimeStamp parameter!               │    │
  │  │ → timestamp = thời điểm callback được trigger!     │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  cancelAnimationFrame:                                        │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ window.cancelAnimationFrame(handle);                 │    │
  │  │                                                      │    │
  │  │ → Hủy callback đã schedule!                        │    │
  │  │ → Dùng để DỪNG animation!                          │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  VÍ DỤ — Animation cơ bản:                                   │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ let count = 0;                                       │    │
  │  │ let cancelReq;                                       │    │
  │  │                                                      │    │
  │  │ function animation() {                               │    │
  │  │   if (count > 200) return;                           │    │
  │  │   test.style.marginLeft = count + 'px';              │    │
  │  │   count++;                                           │    │
  │  │   cancelReq = requestAnimationFrame(animation);      │    │
  │  │ }                                                    │    │
  │  │                                                      │    │
  │  │ // Start:                                            │    │
  │  │ animation();                                         │    │
  │  │                                                      │    │
  │  │ // Stop:                                             │    │
  │  │ cancelAnimationFrame(cancelReq);                     │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  FLOW:                                                        │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ Frame 1: animation() → marginLeft=0 → rAF(anim)   │    │
  │  │ Frame 2: animation() → marginLeft=1 → rAF(anim)   │    │
  │  │ Frame 3: animation() → marginLeft=2 → rAF(anim)   │    │
  │  │ ...                                                  │    │
  │  │ Frame 201: count > 200 → STOP!                     │    │
  │  │                                                      │    │
  │  │ → 200 frames ÷ 60fps = ~3.3 giây animation!       │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```

---

## §3. Thời Điểm Thực Thi — Life of a Frame!

```
  LIFE OF A FRAME:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  ← ─ ─ ─ ─ ─ ─ 16.67ms (60fps) ─ ─ ─ ─ ─ ─ →            │
  │                                                              │
  │  ┌────────┬────┬──────────┬─────┬────────┬──────┐         │
  │  │ Input  │ JS │ Begin    │ rAF │ Layout │ Paint │         │
  │  │ Events │    │ Frame    │     │        │       │         │
  │  │        │    │          │     │        │       │         │
  │  │Blocking│    │resize    │ ★  │Recalc  │Comp.  │         │
  │  │touch   │    │scroll    │ ★  │style   │update │         │
  │  │wheel   │    │media     │ ★  │Update  │Paint  │         │
  │  │Non-blk │    │animation │    │layout  │inv.   │         │
  │  │click   │    │events    │    │Resize  │Record │         │
  │  │keypress│    │          │    │Observer│       │         │
  │  └────────┴────┴──────────┴─────┴────────┴──────┘         │
  │                             ↑                                │
  │                     rAF RUNS HERE!                           │
  │                   TRƯỚC Layout + Paint!                      │
  │                                                              │
  │  THỨ TỰ:                                                     │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ ① Input Events (touch, click, keypress...)         │    │
  │  │ ② JS Execution (timers, callbacks...)               │    │
  │  │ ③ Begin Frame (resize, scroll, media, anim events) │    │
  │  │ ④ requestAnimationFrame callbacks ★★★             │    │
  │  │      + IntersectionObserver callbacks                │    │
  │  │ ⑤ Layout (recalc style, update layout, resize obs) │    │
  │  │ ⑥ Paint (compositing, paint, record)                │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  KEY INSIGHT:                                                  │
  │  → rAF chạy SAU JS, TRƯỚC Layout + Paint!                  │
  │  → = CƠ HỘI CUỐI CÙNG để sửa style trước render!         │
  │  → Style changes trong rAF được BATCH vào cùng frame!     │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```

---

## §4. rAF Override — Cùng Frame!

```
  rAF OVERRIDE:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  VÍ DỤ:                                                       │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ test.style.transform = 'translate(0, 0)';           │    │
  │  │                                                      │    │
  │  │ button.addEventListener('click', () => {             │    │
  │  │   // ① Set translate(400px)!                       │    │
  │  │   test.style.transform = 'translate(400px, 0)';     │    │
  │  │                                                      │    │
  │  │   requestAnimationFrame(() => {                      │    │
  │  │     // ② Set transition + translate(200px)!        │    │
  │  │     test.style.transition = 'transform 3s linear';  │    │
  │  │     test.style.transform = 'translate(200px, 0)';   │    │
  │  │   });                                                │    │
  │  │ });                                                  │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  CÂU HỎI: Element di chuyển sang PHẢI hay TRÁI?             │
  │                                                              │
  │  PHÂN TÍCH:                                                    │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ "Life of a Frame":                                   │    │
  │  │                                                      │    │
  │  │ [Input ][JS        ][Begin][rAF      ][Layout][Paint]│    │
  │  │  click   ①set 400px         ②set 200px                    │
  │  │                                                      │    │
  │  │ → ① và ② TỚI cùng 1 frame!                       │    │
  │  │ → ② OVERRIDE ① trước khi Layout!                 │    │
  │  │ → Browser chỉ thấy: translate(200px)!              │    │
  │  │ → Element: 0px → 200px = sang PHẢI! ✅            │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  PHẢN TRỰC GIÁC:                                               │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ Nhiều người nghĩ:                                    │    │
  │  │ → ① set 400px → render 400px!                     │    │
  │  │ → ② set 200px → transition từ 400 → 200 = TRÁI! │    │
  │  │                                                      │    │
  │  │ NHƯNG THỰC TẾ:                                      │    │
  │  │ → ① và ② cùng frame → CHƯA render ①!            │    │
  │  │ → Browser batch style: chỉ thấy 200px cuối cùng! │    │
  │  │ → Transition: 0 → 200px = sang PHẢI!              │    │
  │  │                                                      │    │
  │  │ ⚠️ Tuy nhiên, browser khác nhau có thể cho kết   │    │
  │  │   quả khác nhau! Chrome incognito = sang phải!     │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```

---

## §5. Nested rAF — Frame Tiếp Theo!

```
  NESTED rAF:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  QUY TẮC: rAF chỉ chạy 1 LẦN per frame!                   │
  │                                                              │
  │  MUỐN CHẠY Ở FRAME SAU? → NESTED rAF!                     │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ // Frame N:                                          │    │
  │  │ requestAnimationFrame(() => {                        │    │
  │  │   console.log('Frame 1!');                           │    │
  │  │                                                      │    │
  │  │   // Frame N+1:                                     │    │
  │  │   requestAnimationFrame(() => {                      │    │
  │  │     console.log('Frame 2!');                         │    │
  │  │                                                      │    │
  │  │     // Frame N+2:                                   │    │
  │  │     requestAnimationFrame(() => {                    │    │
  │  │       console.log('Frame 3!');                       │    │
  │  │     });                                              │    │
  │  │   });                                                │    │
  │  │ });                                                  │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  TIMELINE:                                                    │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ Frame N:   [rAF: "Frame 1!"][Layout][Paint]         │    │
  │  │ Frame N+1: [rAF: "Frame 2!"][Layout][Paint]         │    │
  │  │ Frame N+2: [rAF: "Frame 3!"][Layout][Paint]         │    │
  │  │                                                      │    │
  │  │ ★ Mỗi nested rAF = 1 frame SAU!                   │    │
  │  │ ★ React source code dùng pattern này để test!      │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  ỨNG DỤNG — Đảm bảo sang TRÁI:                              │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ // Muốn: set 400px → render → transition → 200px  │    │
  │  │ test.style.transform = 'translate(400px, 0)';       │    │
  │  │                                                      │    │
  │  │ requestAnimationFrame(() => {                        │    │
  │  │   // Frame N+1: 400px ĐÃ RENDER!                  │    │
  │  │   requestAnimationFrame(() => {                      │    │
  │  │     // Frame N+2: set 200px → transition! → TRÁI!│    │
  │  │     test.style.transition = 'transform 3s linear';  │    │
  │  │     test.style.transform = 'translate(200px, 0)';   │    │
  │  │   });                                                │    │
  │  │ });                                                  │    │
  │  │                                                      │    │
  │  │ Frame N:   [set 400px][render 400px]                │    │
  │  │ Frame N+1: [empty][render]                           │    │
  │  │ Frame N+2: [set 200px + transition][render]         │    │
  │  │ → 400px → 200px = sang TRÁI! ✅                   │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```

---

## §6. Tần Suất — 60fps + DOMHighResTimeStamp!

```
  TẦN SUẤT:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  MDN:                                                         │
  │  "Callback thường được gọi 60 lần/giây"                     │
  │  "...khớp với refresh rate của browser!"                     │
  │                                                              │
  │  DOMHighResTimeStamp:                                         │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ function animation(timestamp) {                      │    │
  │  │   // timestamp = DOMHighResTimeStamp!                │    │
  │  │   // = thời điểm callback được trigger!             │    │
  │  │                                                      │    │
  │  │   if (previousTimestamp) {                           │    │
  │  │     var elapsed = timestamp - previousTimestamp;     │    │
  │  │     console.log(elapsed);                            │    │
  │  │     // ~16.66ms → 60fps! ✅                        │    │
  │  │   }                                                  │    │
  │  │   previousTimestamp = timestamp;                     │    │
  │  │   requestAnimationFrame(animation);                  │    │
  │  │ }                                                    │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  KẾT QUẢ:                                                     │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ elapsed: 16.67ms                                     │    │
  │  │ elapsed: 16.65ms                                     │    │
  │  │ elapsed: 16.68ms                                     │    │
  │  │ elapsed: 16.66ms                                     │    │
  │  │ ...                                                  │    │
  │  │                                                      │    │
  │  │ → ~16.67ms = 1000ms / 60 = 60fps! ✅              │    │
  │  │ → rAF tự động SYNC với refresh rate!               │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  120Hz SCREEN:                                                │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ → elapsed: ~8.33ms                                  │    │
  │  │ → 1000ms / 120 = 8.33ms!                           │    │
  │  │ → rAF gọi 120 lần/giây!                           │    │
  │  │ → Animation chạy NHANH hơn trên 120Hz!            │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```

---

## §7. High Refresh Rate — Chuẩn Hóa Speed!

```
  VẤN ĐỀ HIGH REFRESH RATE:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  VẤN ĐỀ:                                                     │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ Animation: count++ mỗi frame, marginLeft = count px│    │
  │  │                                                      │    │
  │  │ 60Hz:  60 calls/s  → di chuyển 60px/giây!         │    │
  │  │ 120Hz: 120 calls/s → di chuyển 120px/giây!        │    │
  │  │ 144Hz: 144 calls/s → di chuyển 144px/giây!        │    │
  │  │                                                      │    │
  │  │ → CÙNG animation nhưng TỐC ĐỘ KHÁC NHAU!        │    │
  │  │ → 120Hz nhanh GẤP ĐÔI 60Hz! ❌                  │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  GIẢI PHÁP — Dùng elapsed time:                              │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ let previousTimestamp = 0;                           │    │
  │  │ let count = 0;                                       │    │
  │  │                                                      │    │
  │  │ function animation(timestamp) {                      │    │
  │  │   if (count > 200) return;                           │    │
  │  │                                                      │    │
  │  │   var elapsed = timestamp - previousTimestamp;       │    │
  │  │   if (elapsed > 30) {                                │    │
  │  │     // CHỈ thực thi khi đã qua 30ms!              │    │
  │  │     test.style.marginLeft = count + 'px';            │    │
  │  │     count++;                                         │    │
  │  │     previousTimestamp = timestamp;                   │    │
  │  │   }                                                  │    │
  │  │                                                      │    │
  │  │   requestAnimationFrame(animation);                  │    │
  │  │ }                                                    │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  KẾT QUẢ:                                                     │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ elapsed: 33ms (KHÔNG phải 30ms!)                    │    │
  │  │                                                      │    │
  │  │ TẠI SAO 33ms mà không phải 30ms?                   │    │
  │  │ → Vì rAF chạy theo FRAME!                          │    │
  │  │ → 1 frame = 16.67ms                                │    │
  │  │ → Frame 1: elapsed = 16.67ms < 30 → SKIP!        │    │
  │  │ → Frame 2: elapsed = 33.33ms > 30 → EXECUTE! ✅  │    │
  │  │ → Luôn khớp bội số của frame time!                │    │
  │  │                                                      │    │
  │  │ 60Hz:  2 frames = 33ms → execute!                  │    │
  │  │ 120Hz: 4 frames = 33ms → execute!                  │    │
  │  │ → CÙNG tốc độ trên MỌI refresh rate! ✅          │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```

---

## §8. setTimeout vs rAF — Tại Sao Khác?

```
  setTimeout vs rAF:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  THỰC NGHIỆM:                                                 │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ // setTimeout animation:                             │    │
  │  │ function animation() {                               │    │
  │  │   if (count > 200) return;                           │    │
  │  │   test.style.marginLeft = count + 'px';              │    │
  │  │   count++;                                           │    │
  │  │   setTimeout(animation, 0);                          │    │
  │  │ }                                                    │    │
  │  │                                                      │    │
  │  │ KẾT QUẢ: NHANH hơn rAF! ⚡                        │    │
  │  │ Interval: ~4ms thay vì ~16.67ms!                   │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  TẠI SAO NHANH HƠN?                                          │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ 60Hz frame = 16.67ms:                                │    │
  │  │                                                      │    │
  │  │ rAF:                                                 │    │
  │  │ [rAF callback][Layout][Paint] ← 1 call per frame! │    │
  │  │ 16.67ms → 1 style change → 1 render!              │    │
  │  │                                                      │    │
  │  │ setTimeout:                                           │    │
  │  │ [st][st][st][st][────── Layout ──── Paint]          │    │
  │  │ 4ms 4ms 4ms 4ms  ← 4 calls per frame!             │    │
  │  │ 16.67ms → 4 style changes → 1 render!             │    │
  │  │ → 4 changes batched into 1 render!                  │    │
  │  │ → Animation appear 4x FASTER!                      │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  PHÂN TÍCH:                                                    │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ setTimeout(fn, 0):                                   │    │
  │  │ → Minimum delay ~4ms!                               │    │
  │  │ → Trong 16.67ms frame: chạy 3-4 lần!              │    │
  │  │ → Browser batch TẤT CẢ style changes!             │    │
  │  │ → CHỈ render 1 LẦN cuối frame!                    │    │
  │  │ → Kết quả: "nhảy" vị trí, KHÔNG smooth!          │    │
  │  │                                                      │    │
  │  │ requestAnimationFrame:                                │    │
  │  │ → 1 call per frame = 1 style change per frame!     │    │
  │  │ → Mỗi change ĐƯỢC render!                         │    │
  │  │ → SMOOTH animation! ✅                             │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  Performance graph:                                           │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ ← ─ ─ ─ 16.7ms frame ─ ─ ─ →                     │    │
  │  │                                                      │    │
  │  │ setTimeout:                                           │    │
  │  │ [st][st][st][st]──────────[render]                  │    │
  │  │  ↑   ↑   ↑   ↑                                    │    │
  │  │  4 callbacks in 1 frame! → jump 4px mỗi render!  │    │
  │  │                                                      │    │
  │  │ rAF:                                                 │    │
  │  │ [rAF]──────────────[render]                         │    │
  │  │  ↑                                                   │    │
  │  │  1 callback = 1px per render → SMOOTH!             │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  REACT POLYFILL:                                               │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ const localRequestAnimationFrame =                   │    │
  │  │   typeof requestAnimationFrame === 'function'        │    │
  │  │     ? requestAnimationFrame                          │    │
  │  │     : scheduleTimeout;                               │    │
  │  │                                                      │    │
  │  │ → Nếu rAF không có → fallback setTimeout!         │    │
  │  │ → setTimeout KHÔNG lý tưởng nhưng works!          │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```

---

## §9. useAnimationFrame Hook — Tự Viết!

```
  useAnimationFrame HOOK:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  CÁCH DÙNG:                                                    │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ import useAnimationFrame from 'use-animation-frame'; │    │
  │  │                                                      │    │
  │  │ function Counter() {                                 │    │
  │  │   var [time, setTime] = useState(0);                 │    │
  │  │   useAnimationFrame(function(e) {                    │    │
  │  │     setTime(e.time); // tổng thời gian (giây!)    │    │
  │  │   });                                                │    │
  │  │   return <div>{time.toFixed(1)}s</div>;             │    │
  │  │ }                                                    │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  SOURCE CODE (tự viết lại!):                                  │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ function useAnimationFrame(cb) {                     │    │
  │  │   var cbRef = useRef();     // callback ref!        │    │
  │  │   var frame = useRef();     // rAF handle!          │    │
  │  │   var init = useRef(now()); // thời điểm bắt đầu! │    │
  │  │   var last = useRef(now()); // lần gọi trước!     │    │
  │  │                                                      │    │
  │  │   cbRef.current = cb; // Luôn latest callback!     │    │
  │  │                                                      │    │
  │  │   function animate(timestamp) {                      │    │
  │  │     cbRef.current({                                  │    │
  │  │       time: (timestamp - init.current) / 1000,       │    │
  │  │       // → tổng thời gian (giây!)                  │    │
  │  │       delta: (timestamp - last.current) / 1000       │    │
  │  │       // → delta kể từ lần gọi trước (giây!)     │    │
  │  │     });                                              │    │
  │  │     last.current = timestamp;                        │    │
  │  │     frame.current = requestAnimationFrame(animate);  │    │
  │  │   }                                                  │    │
  │  │                                                      │    │
  │  │   useLayoutEffect(function() {                       │    │
  │  │     frame.current = requestAnimationFrame(animate);  │    │
  │  │     return function() { // cleanup!                 │    │
  │  │       cancelAnimationFrame(frame.current);           │    │
  │  │     };                                               │    │
  │  │   }, []);                                            │    │
  │  │ }                                                    │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  KEY PATTERNS:                                                 │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ ① cbRef.current = cb:                               │    │
  │  │   → Luôn dùng LATEST callback!                     │    │
  │  │   → Tránh stale closure!                            │    │
  │  │                                                      │    │
  │  │ ② useLayoutEffect (không phải useEffect!):          │    │
  │  │   → Chạy TRƯỚC paint → start rAF sớm!            │    │
  │  │                                                      │    │
  │  │ ③ Cleanup: cancelAnimationFrame:                     │    │
  │  │   → Component unmount → HỦY animation!            │    │
  │  │   → Tránh memory leak!                              │    │
  │  │                                                      │    │
  │  │ ④ time + delta:                                      │    │
  │  │   → time = tổng thời gian (cho counter!)           │    │
  │  │   → delta = khoảng cách frames (cho animation!)    │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```

---

## §10. Sơ Đồ Tự Vẽ!

### Sơ Đồ 1: Life of a Frame

```
  LIFE OF A FRAME:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  ← ─ ─ ─ ─ ─ ─ ─ 16.67ms (60fps) ─ ─ ─ ─ ─ ─ ─ →       │
  │                                                              │
  │  ┌─────────┐ ┌──┐ ┌─────────┐ ┌─────┐ ┌──────┐ ┌─────┐  │
  │  │  Input  │ │JS│ │ Begin   │ │ rAF │ │Layout│ │Paint│  │
  │  │  Events │ │  │ │ Frame   │ │  ★  │ │      │ │     │  │
  │  │         │ │  │ │         │ │     │ │      │ │     │  │
  │  │ touch   │ │  │ │ resize  │ │anim │ │style │ │comp │  │
  │  │ click   │ │  │ │ scroll  │ │frame│ │layout│ │paint│  │
  │  │ keypress│ │  │ │ media   │ │inter│ │resize│ │     │  │
  │  └─────────┘ └──┘ └─────────┘ └─────┘ └──────┘ └─────┘  │
  │                                  ↑                          │
  │                          rAF = TRƯỚC render!                │
  │                    CƠ HỘI CUỐI sửa style!                  │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```

### Sơ Đồ 2: setTimeout vs rAF trong 1 Frame

```
  setTimeout vs rAF:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  ← ─ ─ ─ ─ ─ ─ 16.67ms frame ─ ─ ─ ─ ─ ─ →              │
  │                                                              │
  │  setTimeout(fn, 0):                                          │
  │  ┌────┬────┬────┬────┬──────────────────────┐              │
  │  │ st │ st │ st │ st │   Layout + Paint     │              │
  │  │ 1  │ 2  │ 3  │ 4  │                      │              │
  │  │4ms │4ms │4ms │4ms │                      │              │
  │  └────┴────┴────┴────┴──────────────────────┘              │
  │  ↑                                                          │
  │  4 callbacks! 4 style changes! 1 render!                    │
  │  → marginLeft: 0→1→2→3→4 → render 4px!                  │
  │  → NHẢY 4px mỗi render! → KHÔNG SMOOTH!                  │
  │                                                              │
  │  requestAnimationFrame:                                      │
  │  ┌──────────┬──────────────────────────────┐                │
  │  │   rAF    │    Layout + Paint            │                │
  │  │    1     │                              │                │
  │  │ ~1ms     │                              │                │
  │  └──────────┴──────────────────────────────┘                │
  │  ↑                                                          │
  │  1 callback! 1 style change! 1 render!                      │
  │  → marginLeft: 0→1 → render 1px!                          │
  │  → Di chuyển 1px mỗi render! → SMOOTH! ✅                │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```

### Sơ Đồ 3: rAF Override vs Nested rAF

```
  OVERRIDE vs NESTED:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  ① SINGLE rAF (Override — cùng frame!):                     │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ Frame N:                                             │    │
  │  │ [JS: set(400px)] → [rAF: set(200px)] → [render]   │    │
  │  │       ↑                    ↑              ↑         │    │
  │  │   set 400px          override 200px!  render 200px! │    │
  │  │                                                      │    │
  │  │ Kết quả: 0px → 200px = PHẢI! →→→                 │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  ② NESTED rAF (Separate frames!):                           │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ Frame N:                                             │    │
  │  │ [JS: set(400px)] → [render 400px] ✅               │    │
  │  │                                                      │    │
  │  │ Frame N+1:                                           │    │
  │  │ [rAF outer: empty]                                   │    │
  │  │                                                      │    │
  │  │ Frame N+2:                                           │    │
  │  │ [rAF inner: set(200px) + transition] → [render]    │    │
  │  │                                                      │    │
  │  │ Kết quả: 400px → 200px = TRÁI! ←←←              │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```

---

## §11. Tự Viết — AnimationFrameEngine!

```javascript
/**
 * AnimationFrameEngine — Mô phỏng requestAnimationFrame!
 * Tự viết bằng tay, KHÔNG dùng thư viện!
 */
var AnimationFrameEngine = (function () {

  // ═══════════════════════════════════
  // FAKE FRAME SYSTEM
  // ═══════════════════════════════════
  var fakeTime = 0;
  var frameRate = 60;
  var frameTime = 1000 / frameRate; // 16.67ms!
  var frameCount = 0;
  var callbacks = [];
  var nextCallbacks = [];
  var log = [];
  var cancelledIds = {};
  var nextId = 1;

  function reset() {
    fakeTime = 0;
    frameCount = 0;
    callbacks = [];
    nextCallbacks = [];
    log = [];
    cancelledIds = {};
    nextId = 1;
  }

  // ═══════════════════════════════════
  // requestAnimationFrame SIMULATION
  // ═══════════════════════════════════
  function requestAnimationFrame(callback) {
    var id = nextId++;
    nextCallbacks.push({ id: id, fn: callback });
    return id;
  }

  function cancelAnimationFrame(id) {
    cancelledIds[id] = true;
  }

  // ═══════════════════════════════════
  // TICK — Process 1 frame!
  // ═══════════════════════════════════
  function tick() {
    frameCount++;
    fakeTime += frameTime;

    // Move nextCallbacks → callbacks
    callbacks = nextCallbacks;
    nextCallbacks = [];

    var executed = 0;
    for (var i = 0; i < callbacks.length; i++) {
      var cb = callbacks[i];
      if (!cancelledIds[cb.id]) {
        cb.fn(fakeTime); // Pass DOMHighResTimeStamp!
        executed++;
      }
    }

    callbacks = [];

    log.push('Frame ' + frameCount + ' (t=' +
      fakeTime.toFixed(1) + 'ms): ' + executed + ' callbacks');

    return executed;
  }

  // ═══════════════════════════════════
  // RUN — Process multiple frames!
  // ═══════════════════════════════════
  function run(maxFrames) {
    maxFrames = maxFrames || 100;
    for (var i = 0; i < maxFrames; i++) {
      var executed = tick();
      if (executed === 0 && nextCallbacks.length === 0) {
        log.push('No more callbacks → STOP!');
        break;
      }
    }
    return frameCount;
  }

  // ═══════════════════════════════════
  // DEMOS
  // ═══════════════════════════════════

  // Demo 1: Basic animation
  function demoBasicAnimation() {
    console.log('\n--- Demo 1: Basic Animation ---');
    reset();

    var count = 0;
    var positions = [];

    function animation(timestamp) {
      if (count >= 5) return;
      positions.push(count);
      count++;
      requestAnimationFrame(animation);
    }

    requestAnimationFrame(animation);
    run(10);

    console.log('Positions:', JSON.stringify(positions));
    console.log('→ 1px per frame! SMOOTH!');
    log.forEach(function (l) { console.log('  ' + l); });
  }

  // Demo 2: setTimeout vs rAF speed
  function demoSetTimeoutVsRAF() {
    console.log('\n--- Demo 2: setTimeout vs rAF Speed ---');
    reset();

    // rAF: 1 call per frame
    var rafCalls = 0;
    var frames = 10;

    function rafAnim(timestamp) {
      rafCalls++;
      if (rafCalls < frames) requestAnimationFrame(rafAnim);
    }

    requestAnimationFrame(rafAnim);
    run(frames + 1);

    // setTimeout: ~4 calls per frame
    var stCalls = Math.floor(frames * (frameTime / 4));

    console.log('rAF: ' + rafCalls + ' calls in ' +
      frames + ' frames (' + (frames * frameTime).toFixed(0) + 'ms)');
    console.log('setTimeout: ~' + stCalls + ' calls in ' +
      (frames * frameTime).toFixed(0) + 'ms');
    console.log('→ setTimeout ' + Math.round(stCalls / rafCalls) +
      'x MORE calls! Faster but CHOPPY!');
  }

  // Demo 3: Nested rAF
  function demoNestedRAF() {
    console.log('\n--- Demo 3: Nested rAF ---');
    reset();
    log = [];

    requestAnimationFrame(function () {
      log.push('  → rAF Level 1: Frame ' + frameCount);

      requestAnimationFrame(function () {
        log.push('  → rAF Level 2: Frame ' + frameCount);

        requestAnimationFrame(function () {
          log.push('  → rAF Level 3: Frame ' + frameCount);
        });
      });
    });

    run(5);
    log.forEach(function (l) { console.log(l); });
    console.log('→ Each nested rAF = NEXT frame!');
  }

  // Demo 4: Cancel animation
  function demoCancelAnimation() {
    console.log('\n--- Demo 4: Cancel Animation ---');
    reset();
    log = [];

    var count = 0;
    var cancelReq;

    function animation() {
      count++;
      log.push('  Frame ' + frameCount + ': animation() count=' + count);
      cancelReq = requestAnimationFrame(animation);
    }

    requestAnimationFrame(animation);

    // Run 3 frames, then cancel!
    tick(); tick(); tick();
    cancelAnimationFrame(cancelReq);
    log.push('  ★ cancelAnimationFrame called!');
    tick(); tick();

    log.forEach(function (l) { console.log(l); });
    console.log('→ Animation stopped after cancel!');
  }

  // Demo 5: Elapsed time normalization
  function demoElapsedTime() {
    console.log('\n--- Demo 5: Elapsed Time ---');

    // Simulate 60Hz
    reset();
    var threshold = 30;
    var executions60 = 0;

    var prev60 = 0;
    function anim60(timestamp) {
      var elapsed = timestamp - prev60;
      if (elapsed > threshold) {
        executions60++;
        prev60 = timestamp;
      }
      if (frameCount < 10) requestAnimationFrame(anim60);
    }
    requestAnimationFrame(anim60);
    run(12);

    // Simulate 120Hz
    reset();
    frameTime = 1000 / 120; // 8.33ms!
    var executions120 = 0;

    var prev120 = 0;
    function anim120(timestamp) {
      var elapsed = timestamp - prev120;
      if (elapsed > threshold) {
        executions120++;
        prev120 = timestamp;
      }
      if (frameCount < 20) requestAnimationFrame(anim120);
    }
    requestAnimationFrame(anim120);
    run(22);

    console.log('60Hz:  ' + executions60 + ' executions in 10 frames');
    console.log('120Hz: ' + executions120 + ' executions in 20 frames');
    console.log('→ SAME speed on different refresh rates! ✅');

    // Reset frame time
    frameTime = 1000 / 60;
  }

  // Main demo
  function demo() {
    console.log('╔═══════════════════════════════════════════╗');
    console.log('║  ANIMATION FRAME ENGINE — DEMO              ║');
    console.log('╚═══════════════════════════════════════════╝');

    demoBasicAnimation();
    demoSetTimeoutVsRAF();
    demoNestedRAF();
    demoCancelAnimation();
    demoElapsedTime();

    console.log('\n╔═══════════════════════════════════════════╗');
    console.log('║  ✅ Demo Complete!                           ║');
    console.log('╚═══════════════════════════════════════════╝');
  }

  return {
    requestAnimationFrame: requestAnimationFrame,
    cancelAnimationFrame: cancelAnimationFrame,
    tick: tick, run: run, reset: reset, demo: demo
  };
})();

// Chạy: AnimationFrameEngine.demo();
```

---

## §12. Câu Hỏi Luyện Tập!

### ❓ Câu 1: requestAnimationFrame là gì?

**Trả lời:**

- Browser API cho phép chạy callback **TRƯỚC repaint**!
- Tự động sync với **refresh rate** (60Hz → 60 calls/giây!)
- Dùng cho **animation** — smooth, không giật!
- Return **handle** (ID) để `cancelAnimationFrame`!

### ❓ Câu 2: rAF chạy ở đâu trong frame lifecycle?

**Trả lời:**

```
[Input Events] → [JS] → [Begin Frame] → [rAF ★] → [Layout] → [Paint]
```

- **SAU** JS execution, Begin Frame!
- **TRƯỚC** Layout, Paint!
- = **CƠ HỘI CUỐI** sửa style trước render!
- Style changes trong JS + rAF được **BATCH** vào cùng frame!

### ❓ Câu 3: Tại sao set(400px) rồi rAF set(200px) → sang PHẢI?

**Trả lời:**

- `set(400px)` trong JS phase!
- `set(200px)` trong rAF phase!
- **CẢ HAI** diễn ra TRƯỚC Layout/Paint → **CÙNG frame**!
- Browser batch styles: chỉ thấy **200px cuối cùng**!
- Transition: 0px → 200px = **sang PHẢI!**
- Muốn sang TRÁI? → **Nested rAF** → 400px render trước → rồi transition → 200px!

### ❓ Câu 4: setTimeout(fn, 0) animation nhanh hơn rAF, tại sao?

**Trả lời:**

- setTimeout minimum delay = ~4ms!
- Trong 16.67ms frame (60Hz): setTimeout chạy **3-4 lần**!
- Browser batch TẤT CẢ style changes → render 1 lần!
- → Animation "nhảy" 3-4px mỗi render → appear NHANH hơn!
- → Nhưng **KHÔNG SMOOTH** — lack intermediate frames!
- rAF = 1 call/frame = 1px/render = **SMOOTH!** ✅

### ❓ Câu 5: elapsed > 30 nhưng in ra 33ms?

**Trả lời:**

- rAF chạy theo **FRAME** (16.67ms boundaries!)
- Frame 1: elapsed = 16.67ms < 30 → **SKIP!**
- Frame 2: elapsed = 33.33ms > 30 → **EXECUTE!**
- → Luôn là **BỘI SỐ** của frame time!
- → 33ms ≈ 2 × 16.67ms = 2 frames!
- → Đây là cách normalize speed trên khác refresh rates!

### ❓ Câu 6: useAnimationFrame hook dùng pattern gì?

**Trả lời:**

4 patterns quan trọng:

1. **cbRef.current = cb**: luôn dùng LATEST callback → tránh stale closure!
2. **useLayoutEffect** (không useEffect): start rAF TRƯỚC paint → sớm hơn!
3. **Cleanup cancelAnimationFrame**: unmount → hủy → tránh memory leak!
4. **time + delta**: time = tổng thời gian chạy, delta = khoảng cách giữa 2 frames!

### ❓ Câu 7: React từng dùng rAF thế nào?

**Trả lời:**

| Version | Approach |
|---|---|
| **v16.0** | rAF + postMessage → tính frameDeadline! |
| **v16.2** | BỎ rAF → MessageChannel (rAF bị pause background tab!) |
| **v18** | MessageChannel + Time Slicing (5ms!) |
| **Polyfill** | `typeof rAF === 'function' ? rAF : setTimeout` |

React bỏ rAF vì:
1. **Background tab**: rAF bị PAUSE → ảnh hưởng execution!
2. **Không cần đoán frame time** → message loop đơn giản hơn!

---

> 🎯 **Tổng kết requestAnimationFrame:**
> - **rAF**: callback TRƯỚC repaint, sync refresh rate!
> - **Life of a Frame**: Input → JS → Begin → **rAF** → Layout → Paint!
> - **1 call per frame**: smooth animation (khác setTimeout 4x faster nhưng choppy!)
> - **rAF override**: cùng frame → style batch → chỉ thấy LẦN CUỐI!
> - **Nested rAF**: mỗi nest = 1 frame SAU → tách render!
> - **DOMHighResTimeStamp**: tính elapsed → normalize speed trên mọi refresh rate!
> - **setTimeout vs rAF**: setTimeout 3-4 calls/frame → jump, rAF 1 call/frame → smooth!
> - **React**: dùng v16.0, bỏ v16.2 (background tab), thay MessageChannel!
> - **useAnimationFrame**: cbRef (avoid stale), useLayoutEffect, cleanup, time+delta!
> - **AnimationFrameEngine** tự viết: frame system, nested, cancel, speed normalize!
> - **7 câu hỏi** luyện tập với đáp án chi tiết!
