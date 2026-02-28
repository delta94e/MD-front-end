# Frontend Countdown Timer — Sai số & Giải pháp — Deep Dive

> 📅 2026-02-12 · ⏱ 10 phút đọc
>
> Tại sao countdown bị sai? setTimeout drift (1000ms → 1002ms),
> background tab throttling (10s → 15s thực tế), 3 giải pháp:
> visibilitychange correction, self-correcting timer, Web Worker.
> Độ khó: ⭐️⭐️⭐️⭐️ | Chủ đề: JavaScript / Timer / Performance

---

## Mục Lục

0. [Vấn đề — Countdown bị sai](#0-vấn-đề)
1. [Nguyên nhân gốc rễ](#1-nguyên-nhân)
2. [Solution 1 — visibilitychange](#2-solution-1)
3. [Solution 2 — Self-Correcting Timer](#3-solution-2)
4. [Solution 3 — Web Worker](#4-solution-3)
5. [So sánh & Tóm Tắt](#5-tóm-tắt)

---

## 0. Vấn đề

### Countdown cơ bản

```javascript
const [count, setCount] = useState(0);
let total = 10; // Đếm ngược 10s

const countDown = () => {
  if (total > 0) {
    setCount(total);
    total--;
    setTimeout(countDown, 1000);
  }
};
```

### 2 loại sai số

```
SAI SỐ COUNTDOWN:
═══════════════════════════════════════════════════════════════

  ① SAI SỐ NHỎ — Normal operation (tab đang active)
  ┌─────────────────────────────────────────────────────┐
  │ Expected:  1000ms mỗi lần                          │
  │ Actual:    1001ms, 1002ms, thỉnh thoảng 1001ms     │
  │ Sai số:    ~2ms mỗi lần → CHẤP NHẬN ĐƯỢC          │
  │                                                     │
  │ trigger time: 11:28:55  间隔: 0                     │
  │ trigger time: 11:28:56  间隔: 1001                  │
  │ trigger time: 11:28:57  间隔: 1002                  │
  │ trigger time: 11:28:58  间隔: 1002                  │
  │ ...                                                 │
  │ 总共耗时: 10012ms (sai 12ms cho 10s countdown)     │
  └─────────────────────────────────────────────────────┘

  ② SAI SỐ LỚN — Background tab (chuyển tab / minimize)
  ┌─────────────────────────────────────────────────────┐
  │ Countdown 10s nhưng THỰC TẾ mất 15s!               │
  │ → Sai số 5 GIÂY!                                   │
  │                                                     │
  │ trigger time: 11:47:15  间隔: 0                     │
  │ trigger time: 11:47:16  间隔: 1001                  │
  │ trigger time: 11:47:17  间隔: 1681  ← chuyển tab!  │
  │ trigger time: 11:47:19  间隔: 1998                  │
  │ trigger time: 11:47:22  间隔: 1999                  │
  │ trigger time: 11:47:24  间隔: 2000  ← bị throttle! │
  │ ...                                                 │
  │ 总共耗时: 15265ms (sai 5 GIÂY!)                    │
  └─────────────────────────────────────────────────────┘
```

---

## 1. Nguyên nhân

### Sai số nhỏ — setTimeout không chính xác

```
TẠI SAO setTimeout(fn, 1000) KHÔNG CHÍNH XÁC 1000ms?
═══════════════════════════════════════════════════════════════

  JavaScript là SINGLE-THREADED.
  setTimeout callback đặt vào EVENT QUEUE.

  ① Phải XẾP HÀNG chờ (queue)
     → Nếu có task trước đang chạy → phải đợi
     → Task trước chạy lâu → delay lớn hơn

  ② Task lấy từ call stack + execute tốn thời gian
     → Overheard nhỏ nhưng TÍCH LŨY

  ③ Browser minimum delay
     → Dù set setTimeout(fn, 0)
     → Vẫn có MINIMUM 4ms delay (spec requirement)

  TIMELINE:
  ┌────────────────────────────────────────────────────────┐
  │ setTimeout(fn, 1000)                                   │
  │                                                        │
  │ 0ms        1000ms   1002ms                             │
  │ ├──────────┤←──────→├──→ fn() chạy                    │
  │ set timer  timer    thực tế chạy                       │
  │            hết hạn  (chờ queue + execute overhead)    │
  │                                                        │
  │ → Sai 2ms mỗi lần                                     │
  │ → 10 lần = tích lũy ~10-20ms                          │
  └────────────────────────────────────────────────────────┘
```

### Sai số lớn — Background Tab Throttling

```
BACKGROUND TAB THROTTLING:
═══════════════════════════════════════════════════════════════

  Khi user CHUYỂN TAB hoặc MINIMIZE browser:
  → Browser giảm tần suất timer để TIẾT KIỆM TÀI NGUYÊN

  ┌─────────────────────────────────────────────────────┐
  │ ACTIVE TAB:     setTimeout interval ≈ 1000ms       │
  │ BACKGROUND TAB: setTimeout interval ≥ 1000ms       │
  │                 (thường ~2000ms trên nhiều browser) │
  │                                                     │
  │ Chrome/Edge:    ≥ 1000ms (minimum 1s)              │
  │ Firefox:        ≥ 1000ms (có thể cao hơn)          │
  │ Safari:         Aggressive throttling               │
  └─────────────────────────────────────────────────────┘

  VÍ DỤ:
  Countdown 10s, user chuyển tab ở giây thứ 2.
  → 8 giây còn lại, mỗi tick bị stretch thành 2s
  → 8 ticks × 2s = 16s thay vì 8s
  → Tổng: 2s + 16s = 18s (sai 8 giây!)

  → Countdown vẫn CHẠY nhưng chậm hơn thực tế
  → User quay lại → countdown đáng lẽ đã hết
    nhưng vẫn còn đang đếm!
```

---

## 2. Solution 1 — visibilitychange

### Ý tưởng

```
SOLUTION 1 — VISIBILITYCHANGE:
═══════════════════════════════════════════════════════════════

  CHIẾN LƯỢC: "Sửa lỗi đậm" (Major Revision)
  → Lắng nghe sự kiện page visibility
  → Khi user QUAY LẠI tab → TÍNH LẠI thời gian đúng
  → Xóa timer cũ, tạo timer mới với thời gian chính xác

  FLOW:
  ┌────────────────────────────────────────────────────────┐
  │ User đang countdown (10s)                              │
  │     ↓                                                  │
  │ User chuyển tab (document.visibilityState = 'hidden') │
  │     ↓                                                  │
  │ Timer bị throttle → countdown sai                      │
  │     ↓                                                  │
  │ User quay lại (document.visibilityState = 'visible')  │
  │     ↓                                                  │
  │ ⚡ TRIGGER: visibilitychange event                     │
  │     ↓                                                  │
  │ Tính: remainTime = totalTime - (now - startTime)      │
  │ Clear timer cũ → set timer mới với remainTime         │
  │ Update UI ngay lập tức                                │
  └────────────────────────────────────────────────────────┘
```

### Code

```javascript
// Lắng nghe page visibility
useEffect(() => {
  const handleVisibilityChange = () => {
    if (document.visibilityState === "visible") {
      updateCount(); // Sửa countdown khi quay lại
    }
  };

  document.addEventListener("visibilitychange", handleVisibilityChange);
  return () => {
    document.removeEventListener("visibilitychange", handleVisibilityChange);
  };
}, []);

// Hàm sửa countdown
const updateCount = () => {
  clearTimeout(timer); // Xóa timer cũ (đang sai)

  const nowStamp = Date.now();
  const pastTime = nowStamp - firstStamp; // Thời gian đã trôi
  const remainTime = totalSeconds * 1000 - pastTime; // Thời gian còn lại

  if (remainTime > 0) {
    setCount(Math.floor(remainTime / 1000));
    total = Math.floor(remainTime / 1000);
    // remainTime % 1000 = thời gian chờ đến tick tiếp theo
    timer = setTimeout(countDown, remainTime % 1000);
  } else {
    setCount(0); // Đã hết thời gian!
  }
};
```

### Ưu nhược điểm

```
SOLUTION 1 — ĐÁNH GIÁ:
  ┌──────────┬──────────────────────────────────────────┐
  │ ✅ Ưu    │ Đơn giản, dễ implement                  │
  │          │ Sửa đúng khi user quay lại              │
  ├──────────┼──────────────────────────────────────────┤
  │ ❌ Nhược │ SKIP một số time points khi ở background│
  │          │ Có thể miss key event triggers          │
  │          │ User đi lâu → countdown vẫn chạy sai   │
  │          │ Chỉ sửa KHI quay lại, không sửa realtime│
  └──────────┴──────────────────────────────────────────┘
```

---

## 3. Solution 2 — Self-Correcting Timer

### Ý tưởng

```
SOLUTION 2 — SELF-CORRECTING:
═══════════════════════════════════════════════════════════════

  CHIẾN LƯỢC: "Sửa lỗi nhỏ" (Minor Modification)
  → MỖI LẦN callback chạy → tự kiểm tra & sửa thời gian
  → So sánh thời gian THỰC TẾ vs thời gian MONG MUỐN
  → Adjust timeout cho lần tiếp theo

  KEY IDEA:
  ┌────────────────────────────────────────────────────────┐
  │ nextTime = startTime + (totalSeconds - remaining) × 1000│
  │ gap = nextTime - Date.now()                            │
  │                                                        │
  │ if gap < 1:                                            │
  │   → Đã đến lúc tick → execute ngay + schedule next    │
  │ else:                                                  │
  │   → Chưa đến → setTimeout(countDown, gap)             │
  │   → gap có thể < 1000ms để BÙ thời gian bị trễ      │
  └────────────────────────────────────────────────────────┘
```

### Code

```javascript
const countDown = () => {
  const nowDate = new Date();
  const nowStamp = nowDate.getTime();
  firstStamp = firstStamp || nowStamp;
  lastStamp = lastStamp || nowStamp;

  // Thời điểm ĐÚNG RA tick tiếp theo nên xảy ra
  const nextTime = firstStamp + (CountSeconds - total) * 1000;
  // Khoảng cách đến thời điểm đó
  const gap = nextTime - nowStamp;

  if (gap < 1) {
    // ĐÃ ĐẾN hoặc ĐÃ QUA thời điểm tick!
    clearTimeout(timer);

    if (total === 0) {
      setCount(0);
      console.log("Hoàn tất! Tổng:", nowStamp - firstStamp, "ms");
    } else {
      console.log("left", total, "间隔:", nowStamp - lastStamp);
      lastStamp = nowStamp;
      setCount(total);
      total--;
      countDown(); // Gọi lại ngay (recursive, tự điều chỉnh)
    }
  } else {
    // CHƯA ĐẾN thời điểm → đợi đúng khoảng gap
    timer = setTimeout(countDown, gap);
  }
};
```

### Cơ chế tự sửa

```
SELF-CORRECTING MECHANISM:
═══════════════════════════════════════════════════════════════

  Normal case (no drift):
  ┌────────────────────────────────────────────────────────┐
  │ firstStamp = 1000                                      │
  │ total = 9 (đã tick 1 lần)                              │
  │ nextTime = 1000 + (10-9) × 1000 = 2000                │
  │ now = 2001                                             │
  │ gap = 2000 - 2001 = -1 → gap < 1 → TICK!             │
  │ → setTimeout(countDown, ???)                           │
  │ nextTime cho total=8: 1000 + 2×1000 = 3000            │
  │ gap = 3000 - 2001 = 999 → setTimeout(fn, 999)        │
  │ → BÙ 1ms bị trễ! ← TỰ SỬA!                          │
  └────────────────────────────────────────────────────────┘

  Background tab case (large drift):
  ┌────────────────────────────────────────────────────────┐
  │ firstStamp = 1000                                      │
  │ total = 15 (đã tick 5 lần)                             │
  │ nextTime = 1000 + 5×1000 = 6000                       │
  │ now = 8000 (bị delay 2s do throttle)                  │
  │ gap = 6000 - 8000 = -2000 → gap < 1                  │
  │ → TICK ngay! total=14                                  │
  │ → Gọi countDown() lại                                 │
  │ nextTime = 1000 + 6×1000 = 7000                       │
  │ gap = 7000 - 8000 = -1000 → gap < 1                  │
  │ → TICK ngay! total=13                                  │
  │ → Gọi countDown() lại                                 │
  │ nextTime = 1000 + 7×1000 = 8000                       │
  │ gap = 8000 - 8000 = 0 → gap < 1                      │
  │ → TICK ngay! total=12                                  │
  │ → BẮT KỊP! 3 ticks liên tiếp để bù thời gian        │
  └────────────────────────────────────────────────────────┘
```

### Ưu nhược điểm

```
SOLUTION 2 — ĐÁNH GIÁ:
  ┌──────────┬──────────────────────────────────────────┐
  │ ✅ Ưu    │ Trigger MỌI time point (không skip)     │
  │          │ Tự sửa liên tục, không cần event riêng  │
  │          │ Chính xác hơn Solution 1                 │
  │          │ Quay lại → bắt kịp ngay (multi-tick)    │
  ├──────────┼──────────────────────────────────────────┤
  │ ❌ Nhược │ Vẫn phụ thuộc Date.now()                │
  │          │ User đổi system time → VỠ!              │
  │          │ Background vẫn bị throttle               │
  │          │ Edge browser: min interval = 1000ms      │
  └──────────┴──────────────────────────────────────────┘

  ⚠️ LƯU Ý: Date.now() phụ thuộc system clock!
  → User chỉnh giờ máy → countdown sai hoàn toàn
  → Giải pháp: dùng performance.now() (relative time)
  → Nhưng performance.now() reset khi reload page
```

---

## 4. Solution 3 — Web Worker

### Ý tưởng

```
SOLUTION 3 — WEB WORKER:
═══════════════════════════════════════════════════════════════

  CHIẾN LƯỢC: "Không cần sửa" (No Modification Needed)
  → Dùng THREAD RIÊNG cho timing
  → Web Worker chạy ở BACKGROUND THREAD
  → KHÔNG bị browser throttle khi chuyển tab!
  → Timer luôn chính xác, bất kể tab state

  ┌────────────────────────────────────────────────────────┐
  │                                                        │
  │  MAIN THREAD (bị throttle khi background)             │
  │  ┌──────────────────────────────┐                      │
  │  │ UI rendering, React state   │                      │
  │  │ Nhận message từ Worker      │                      │
  │  │ Update countdown display    │                      │
  │  └──────────┬───────────────────┘                      │
  │             ↕ postMessage                              │
  │  ┌──────────────────────────────┐                      │
  │  │ WEB WORKER (separate thread)│                      │
  │  │ setInterval(countDown, 1000)│                      │
  │  │ KHÔNG bị throttle!          │                      │
  │  │ Timer luôn ≈ 1000ms         │                      │
  │  └──────────────────────────────┘                      │
  │                                                        │
  │  WORKER THREAD (chạy độc lập)                          │
  │                                                        │
  └────────────────────────────────────────────────────────┘
```

### Code — Worker file

```javascript
// worker.js — chạy ở separate thread
let intervalId;
let count = 0;

self.onmessage = function (event) {
  count = event.data; // Nhận total seconds từ main thread
  console.log("Worker received:", count);
  intervalId = setInterval(countDown, 1000);
};

function countDown() {
  count--;
  self.postMessage(count); // Gửi kết quả về main thread
  if (count === 0) {
    clearInterval(intervalId);
  }
}
```

### Code — Main thread (React)

```javascript
const [count, setCount] = useState(0);
const [worker, setWorker] = useState(null);

useEffect(() => {
  // Khởi tạo Web Worker
  const myWorker = new Worker(new URL("./worker.js", import.meta.url));

  // Lắng nghe message từ Worker
  myWorker.onmessage = (event) => {
    const left = event.data;
    const nowStamp = Date.now();

    if (left > 0) {
      const gap = nowStamp - lastStamp;
      console.log("left", left, "间隔:", gap);
      lastStamp = nowStamp;
      setCount(left);
    } else {
      setCount(0);
      console.log("Hoàn tất! Tổng:", nowStamp - firstStamp);
    }
  };

  setWorker(myWorker);

  // Cleanup: terminate Worker
  return () => {
    myWorker.terminate();
  };
}, []);

// Bắt đầu countdown
const startCountdown = () => {
  firstStamp = Date.now();
  lastStamp = firstStamp;
  worker.postMessage(20); // Đếm ngược 20s
};
```

### Kết quả Web Worker

```
WEB WORKER RESULTS:
═══════════════════════════════════════════════════════════════

  Worker received: 10
  left 9  time: 21:51:02  间隔: 1003
  left 8  time: 21:51:03  间隔: 1000
  Page is visible: hidden          ← CHUYỂN TAB!
  left 7  time: 21:51:04  间隔: 999   ← VẪN CHÍNH XÁC!
  left 6  time: 21:51:05  间隔: 1004
  left 5  time: 21:51:06  间隔: 996
  left 4  time: 21:51:07  间隔: 999
  left 3  time: 21:51:08  间隔: 1002
  left 2  time: 21:51:09  间隔: 1000
  Page is visible: visible         ← QUAY LẠI!
  left 1  time: 21:51:10  间隔: 999
  总共耗时: 10004ms                ← GẦN NHƯ HOÀN HẢO!

  → Dù chuyển tab, Worker timer vẫn ≈ 1000ms!
  → Không cần correction logic!
```

### Ưu nhược điểm

```
SOLUTION 3 — ĐÁNH GIÁ:
  ┌──────────┬──────────────────────────────────────────┐
  │ ✅ Ưu    │ Chính xác NHẤT                          │
  │          │ KHÔNG bị background throttle             │
  │          │ Không cần correction logic               │
  │          │ Không phụ thuộc visibility state         │
  ├──────────┼──────────────────────────────────────────┤
  │ ❌ Nhược │ Cần file Worker riêng                   │
  │          │ Không access DOM trực tiếp              │
  │          │ Communication qua postMessage (async)   │
  │          │ Overhead tạo Worker thread              │
  │          │ Cần cleanup (terminate)                 │
  └──────────┴──────────────────────────────────────────┘
```

---

## 5. Tóm Tắt

### So sánh 3 Solutions

```
3 SOLUTIONS — COMPARISON:
═══════════════════════════════════════════════════════════════

  ┌──────────────┬────────────────┬───────────────┬──────────────┐
  │              │ Sol 1          │ Sol 2         │ Sol 3        │
  │              │ visibility     │ Self-correct  │ Web Worker   │
  ├──────────────┼────────────────┼───────────────┼──────────────┤
  │ Chiến lược   │ Sửa đậm       │ Sửa nhẹ      │ Không sửa    │
  │              │ (khi quay lại)│ (mỗi tick)   │ (chính xác)  │
  ├──────────────┼────────────────┼───────────────┼──────────────┤
  │ Complexity   │ ⭐ Đơn giản    │ ⭐⭐ Trung bình │ ⭐⭐ Trung bình│
  ├──────────────┼────────────────┼───────────────┼──────────────┤
  │ Accuracy     │ Tốt (khi      │ Rất tốt      │ Xuất sắc     │
  │              │ user quay lại)│ (mọi tick)    │ (mọi lúc)    │
  ├──────────────┼────────────────┼───────────────┼──────────────┤
  │ Background   │ ❌ Skip ticks  │ ⚠️ Bù khi    │ ✅ Không ảnh  │
  │ behavior     │               │ quay lại      │ hưởng        │
  ├──────────────┼────────────────┼───────────────┼──────────────┤
  │ System time  │ ❌ Phụ thuộc   │ ❌ Phụ thuộc  │ ❌ Phụ thuộc  │
  │ dependency   │ Date.now()    │ Date.now()    │ (nhưng tốt   │
  │              │               │               │ hơn nhiều)   │
  ├──────────────┼────────────────┼───────────────┼──────────────┤
  │ Use case     │ Simple timer, │ Precise timer │ Critical     │
  │              │ not critical  │ UI countdown  │ countdown    │
  └──────────────┴────────────────┴───────────────┴──────────────┘
```

### Bonus — performance.now()

```
DATE.NOW() vs PERFORMANCE.NOW():
═══════════════════════════════════════════════════════════════

  Date.now()
  → System clock (wall clock)
  → Bị ảnh hưởng khi user CHỈNH GIỜ MÁY
  → Có thể nhảy forward/backward

  performance.now()
  → Monotonic clock (chỉ đi lên, không bao giờ lùi)
  → KHÔNG bị ảnh hưởng khi chỉnh giờ
  → Relative to page load (reset khi reload)
  → Độ chính xác cao hơn (microsecond)

  → Dùng performance.now() cho countdown nếu muốn
    tránh user chỉnh giờ máy
  → Nhưng: reset khi reload → cần kết hợp server time
    cho countdown quan trọng (flash sale, exam timer)
```

### Quick Reference

```
COUNTDOWN ERROR — QUICK REFERENCE:
═══════════════════════════════════════════════════════════════

  WHY INACCURATE?
    ① JS single-threaded → queue delay (~2ms/tick)
    ② setTimeout min delay 4ms (even with 0)
    ③ Background tab → browser throttle (≥1000ms)

  3 SOLUTIONS:
    S1: visibilitychange → sửa khi quay lại
    S2: Self-correcting  → tự bù mỗi tick
    S3: Web Worker        → thread riêng, không throttle

  RECOMMENDATION:
    Simple UI timer → Solution 1 (visibilitychange)
    Important timer → Solution 2 (self-correcting)
    Critical timer  → Solution 3 (Web Worker)
    Mission-critical→ Server-side countdown + sync
```

### Câu Hỏi Phỏng Vấn

**1. Tại sao countdown frontend bị sai? Có mấy nguyên nhân?**

> Hai nguyên nhân chính: ① **JS single-threaded** — setTimeout/setInterval callback đặt vào event queue, phải đợi task trước hoàn thành → mỗi tick trễ ~1-2ms, tích lũy dần. Dù set timeout = 0 vẫn có min 4ms delay. ② **Background tab throttling** — browser giảm tần suất timer khi page ở background để tiết kiệm tài nguyên. Chrome/Edge set minimum interval ≥ 1000ms, nhiều trường hợp stretch lên 2000ms → countdown 10s mất 15s thực tế.

**2. Nêu 3 cách giải quyết sai số countdown?**

> **S1: visibilitychange** — lắng nghe event page visibility, khi user quay lại tab → tính lại thời gian đúng dựa trên Date.now() vs startTime → clear timer cũ, set timer mới. Đơn giản nhưng skip ticks khi background. **S2: Self-correcting** — mỗi tick tự so sánh thời gian thực tế vs mong muốn → adjust timeout tiếp theo (có thể < 1000ms để bù). Chính xác hơn, trigger mọi time point. **S3: Web Worker** — dùng separate thread cho timing, không bị browser throttle → timer luôn ≈ 1000ms dù chuyển tab. Chính xác nhất nhưng cần file Worker riêng.

**3. Web Worker tại sao không bị throttle?**

> Web Worker chạy ở **background thread riêng**, không phải main thread. Browser throttle policy chỉ áp dụng cho **main thread timers** (vì lý do tiết kiệm rendering/CPU cho tab không visible). Worker thread không liên quan đến rendering → browser **không giảm tần suất** timer trong Worker. Đây là lý do Worker timer vẫn ≈ 1000ms dù page ở background.

**4. Date.now() vs performance.now() — khác nhau thế nào?**

> **Date.now()** dùng system clock (wall clock) — bị ảnh hưởng khi user chỉnh giờ máy, có thể nhảy forward/backward. **performance.now()** dùng monotonic clock — chỉ đi lên, không bao giờ lùi, không bị ảnh hưởng khi chỉnh giờ, độ chính xác microsecond. Nhưng performance.now() reset khi reload page → countdown quan trọng (flash sale, exam) nên dùng **server-side time**.

**5. Countdown mission-critical (flash sale, exam) nên xử lý thế nào?**

> Không nên chỉ dùng frontend timer! Nên: ① **Server time** làm source of truth (API trả timestamp) ② **Web Worker** cho client-side tick ③ **Periodic sync** với server (mỗi 30s-60s) để sửa drift ④ **requestAnimationFrame** cho UI update mượt ⑤ Backend validate thời gian kết thúc, không tin client.

---

## Checklist Học Tập

- [ ] JS single-threaded → setTimeout callback phải queue → delay
- [ ] setTimeout(fn, 0) vẫn có minimum 4ms delay
- [ ] Background tab → browser throttle timers (≥1000ms interval)
- [ ] Solution 1: visibilitychange → sửa khi quay lại tab
- [ ] Solution 2: Self-correcting → tự bù gap mỗi tick
- [ ] Solution 3: Web Worker → separate thread, không bị throttle
- [ ] Worker thread không bị throttle vì không liên quan rendering
- [ ] Date.now() = system clock (bị ảnh hưởng khi chỉnh giờ)
- [ ] performance.now() = monotonic clock (không bị ảnh hưởng)
- [ ] Mission-critical countdown → server time + periodic sync

---

_Cập nhật lần cuối: Tháng 2, 2026_
