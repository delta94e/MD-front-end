# Throttle & Debounce — Tiết Lưu & Chống Rung Deep Dive

> 📅 2026-02-11 · ⏱ 15 phút đọc
>
> Tài liệu chuyên sâu về Throttle (tiết lưu) & Debounce (chống rung):
> Khái niệm, application scenarios, triển khai cơ bản (timestamp/timer),
> phiên bản nâng cao (leading/trailing, cancel, immediate),
> so sánh chi tiết, và visual timeline.
> Độ khó: ⭐️⭐️⭐️⭐️ | Chủ đề: Frontend Performance Optimization

---

## Mục Lục

0. [Debounce & Throttle — Khái niệm](#0-debounce--throttle--khái-niệm)
1. [Application Scenarios](#1-application-scenarios)
2. [Triển khai Debounce](#2-triển-khai-debounce)
3. [Triển khai Throttle](#3-triển-khai-throttle)
4. [Phiên bản nâng cao](#4-phiên-bản-nâng-cao)
5. [So sánh Debounce vs Throttle](#5-so-sánh-debounce-vs-throttle)
6. [Tóm Tắt & Câu Hỏi Phỏng Vấn](#6-tóm-tắt--câu-hỏi-phỏng-vấn)

---

## 0. Debounce & Throttle — Khái niệm

> **🎯 Debounce = chờ ngừng mới chạy; Throttle = mỗi khoảng chạy 1 lần**

```
DEBOUNCE (Chống rung / Anti-shake):
═══════════════════════════════════════════════════════════════

  Sau khi event trigger → CHỜ n giây → mới thực thi callback
  Nếu event trigger LẠI trong n giây → RESET TIMER

  → Chỉ thực thi LẦN CUỐI CÙNG khi user ngừng action

  VISUAL TIMELINE (delay = 300ms):
  ┌─────────────────────────────────────────────────────────┐
  │ Events:  ↓  ↓  ↓  ↓  ↓           ↓  ↓                │
  │ Time:    0  100 200 300 400       800 900               │
  │          ×  ×   ×   ×   ×         ×                     │
  │          │  │   │   │   │         │                     │
  │ Reset:   ←──←───←───←───┘         └──┘                  │
  │                      ↓                  ↓               │
  │ Execute:           700ms             1200ms             │
  │                   (400+300)          (900+300)           │
  │                                                         │
  │ → Chỉ chạy KHI NGỪNG trigger đủ 300ms                 │
  └─────────────────────────────────────────────────────────┘
```

```
THROTTLE (Tiết lưu / Bướm ga):
═══════════════════════════════════════════════════════════════

  Trong 1 KHOẢNG THỜI GIAN nhất định (n ms)
  → CHỈ 1 callback ĐƯỢC THỰC THI
  → Dù event trigger NHIỀU LẦN → chỉ 1 có hiệu lực

  VISUAL TIMELINE (interval = 300ms):
  ┌─────────────────────────────────────────────────────────┐
  │ Events:  ↓  ↓  ↓  ↓  ↓  ↓  ↓  ↓  ↓  ↓  ↓           │
  │ Time:    0  50 100 150 200 250 300 350 400 450 500     │
  │                                                         │
  │ Execute: ✅          ×   ×   ×  ✅          ×  ✅      │
  │          0ms                     300ms          600ms   │
  │                                                         │
  │ → Mỗi 300ms CHỈ CHẠY 1 LẦN, bất kể trigger bao nhiêu│
  └─────────────────────────────────────────────────────────┘
```

```
SO SÁNH NHANH:
═══════════════════════════════════════════════════════════════

  DEBOUNCE: giống thang máy — cửa đợi, có người vào → reset
  → Chỉ ĐÓNG CỬA khi KHÔNG AI VÀO trong n giây

  THROTTLE: giống vòi nước — mở van, nước chảy ĐỀU ĐẶN
  → Mỗi n giây CHẢY 1 LẦN, bất kể áp lực

  ┌──────────┬─────────────────────┬───────────────────────┐
  │          │ DEBOUNCE            │ THROTTLE              │
  ├──────────┼─────────────────────┼───────────────────────┤
  │ Khi nào  │ KHI NGỪNG (cuối)   │ MỖI KHOẢNG (đều đặn) │
  │ Reset?   │ CÓ (mỗi trigger)   │ KHÔNG                 │
  │ Số lần   │ 1 (lần cuối)       │ Nhiều (mỗi interval)  │
  └──────────┴─────────────────────┴───────────────────────┘
```

---

## 1. Application Scenarios

```
DEBOUNCE — USE CASES:
═══════════════════════════════════════════════════════════════

  ① BUTTON SUBMIT (chống spam click):
  ┌──────────────────────────────────────────────────────────┐
  │ User click nút submit NHIỀU LẦN liên tục               │
  │ → Chỉ gửi request LẦN CUỐI CÙNG                       │
  │ → Tránh gửi NHIỀU requests backend                     │
  └──────────────────────────────────────────────────────────┘

  ② SEARCH INPUT (search suggestion):
  ┌──────────────────────────────────────────────────────────┐
  │ User gõ liên tục trong search box                       │
  │ → Chỉ gửi API request khi NGỪNG GÕ                    │
  │ → Tránh gọi API MỖI keystroke                          │
  │ → VD: Google search suggestions                         │
  └──────────────────────────────────────────────────────────┘

  ③ FORM VALIDATION (server-side):
  ┌──────────────────────────────────────────────────────────┐
  │ Validate email/username cần request server              │
  │ → Chỉ validate khi user NGỪNG NHẬP                     │
  │ → lodash.debounce() recommended                         │
  └──────────────────────────────────────────────────────────┘
```

```
THROTTLE — USE CASES:
═══════════════════════════════════════════════════════════════

  ① SCROLL EVENT LISTENER:
  ┌──────────────────────────────────────────────────────────┐
  │ scroll event fires RẤT NHIỀU LẦN                       │
  │ → Chỉ execute mỗi n ms                                 │
  │ → VD: lazy loading images, infinite scroll              │
  └──────────────────────────────────────────────────────────┘

  ② DRAG-AND-DROP:
  ┌──────────────────────────────────────────────────────────┐
  │ mousemove liên tục khi drag                             │
  │ → Chỉ update position mỗi n ms                        │
  │ → Tránh quá nhiều position changes                     │
  └──────────────────────────────────────────────────────────┘

  ③ WINDOW RESIZE:
  ┌──────────────────────────────────────────────────────────┐
  │ resize event fires liên tục khi user kéo window        │
  │ → Chỉ tính layout mỗi n ms                            │
  │ → Tránh reflow/repaint quá nhiều                       │
  └──────────────────────────────────────────────────────────┘

  ④ ANIMATION:
  ┌──────────────────────────────────────────────────────────┐
  │ Tránh trigger animation NHIỀU LẦN trong thời gian ngắn │
  │ → Giới hạn tần suất → tránh performance issue          │
  └──────────────────────────────────────────────────────────┘
```

---

## 2. Triển khai Debounce

> **🎯 Timer version: clear timer cũ → set timer mới → chỉ chạy lần cuối**

### Debounce cơ bản

```javascript
// ===== DEBOUNCE — Cơ bản =====
function debounce(fn, wait) {
  var timer = null;

  return function () {
    var context = this,
      args = [...arguments];

    // Nếu timer đang chạy → CLEAR (reset timer)
    if (timer) {
      clearTimeout(timer);
      timer = null;
    }

    // Set timer MỚI → chờ wait ms → execute
    timer = setTimeout(() => {
      fn.apply(context, args);
    }, wait);
  };
}

// Sử dụng:
const handleSearch = debounce(function (query) {
  console.log("Search:", query);
  // Call API here
}, 300);

input.addEventListener("input", function (e) {
  handleSearch(e.target.value);
});
```

```
DEBOUNCE — FLOW:
═══════════════════════════════════════════════════════════════

  Lần 1: event trigger
  ┌───────────┐  setTimeout   ┌──────────┐
  │ trigger   │─────(300ms)──►│ execute? │
  └───────────┘               └──────────┘

  Lần 2 (trong 300ms): event trigger LẠI
  ┌───────────┐  clearTimeout!  ┌───────────┐ setTimeout
  │ trigger   │────────────────►│ trigger   │──(300ms)──►exec
  └───────────┘  cancel lần 1   └───────────┘

  → Chỉ execute KHI KHÔNG CÓ trigger mới trong 300ms
```

### Debounce + Immediate (leading edge)

```javascript
// ===== DEBOUNCE — Immediate (leading edge) =====
// Execute NGAY lần đầu, sau đó debounce
function debounce(fn, wait, immediate) {
  var timer = null;

  return function () {
    var context = this,
      args = [...arguments];

    if (timer) clearTimeout(timer);

    if (immediate) {
      // Nếu chưa có timer → execute NGAY
      var callNow = !timer;
      timer = setTimeout(() => {
        timer = null; // Reset sau wait ms
      }, wait);
      if (callNow) fn.apply(context, args);
    } else {
      // Standard: execute SAU wait ms
      timer = setTimeout(() => {
        fn.apply(context, args);
      }, wait);
    }
  };
}

// immediate = true: click → execute NGAY → ignore click tiếp trong 300ms
const handleSubmit = debounce(submitForm, 300, true);
```

---

## 3. Triển khai Throttle

> **🎯 2 cách: Timestamp version + Timer version**

### Throttle — Timestamp Version

```javascript
// ===== THROTTLE — Timestamp Version =====
// Execute NGAY lần đầu, sau đó mỗi delay ms
function throttle(fn, delay) {
  var preTime = Date.now();

  return function () {
    var context = this,
      args = [...arguments],
      nowTime = Date.now();

    // Nếu khoảng cách >= delay → EXECUTE
    if (nowTime - preTime >= delay) {
      preTime = Date.now();
      return fn.apply(context, args);
    }
  };
}

// Sử dụng:
window.addEventListener(
  "scroll",
  throttle(function () {
    console.log("Scroll position:", window.scrollY);
  }, 200),
);
```

```
TIMESTAMP — FLOW:
═══════════════════════════════════════════════════════════════

  preTime = 0

  Event 1 (t=0):    now - pre = 0 >= 200    → EXECUTE ✅
  Event 2 (t=50):   now - pre = 50 < 200    → SKIP ❌
  Event 3 (t=100):  now - pre = 100 < 200   → SKIP ❌
  Event 4 (t=200):  now - pre = 200 >= 200  → EXECUTE ✅
  Event 5 (t=250):  now - pre = 50 < 200    → SKIP ❌
  Event 6 (t=400):  now - pre = 200 >= 200  → EXECUTE ✅

  ✅ Execute NGAY lần đầu (leading)
  ❌ Không execute lần cuối nếu < delay (no trailing)
```

### Throttle — Timer Version

```javascript
// ===== THROTTLE — Timer Version =====
// Execute SAU delay ms, sau đó mỗi delay ms
function throttle(fn, wait) {
  let timeout = null;

  return function () {
    let context = this;
    let args = [...arguments];

    // Nếu CHƯA CÓ timer → set timer
    if (!timeout) {
      timeout = setTimeout(() => {
        fn.apply(context, args);
        timeout = null; // Reset → cho phép set lại
      }, wait);
    }
    // Nếu ĐÃ CÓ timer → SKIP (đợi timer hiện tại)
  };
}
```

```
TIMER — FLOW:
═══════════════════════════════════════════════════════════════

  Event 1 (t=0):    no timer → SET timer (200ms)
  Event 2 (t=50):   timer exists → SKIP ❌
  Event 3 (t=100):  timer exists → SKIP ❌
  --- t=200: timer fires → EXECUTE ✅, timer = null
  Event 4 (t=210):  no timer → SET timer (200ms)
  Event 5 (t=300):  timer exists → SKIP ❌
  --- t=410: timer fires → EXECUTE ✅, timer = null

  ❌ Không execute ngay lần đầu (no leading)
  ✅ Đảm bảo execute lần cuối (trailing)
```

```
TIMESTAMP vs TIMER:
═══════════════════════════════════════════════════════════════

  ┌──────────────────┬──────────────────┬────────────────────┐
  │                  │ Timestamp        │ Timer              │
  ├──────────────────┼──────────────────┼────────────────────┤
  │ Lần đầu (leading)│ EXECUTE ngay ✅  │ CHƯA execute ❌   │
  │ Lần cuối(trailing)│ Có thể miss ❌  │ Luôn execute ✅   │
  │ Cơ chế           │ So sánh time    │ setTimeout         │
  │ Accuracy         │ Cao (Date.now)  │ Phụ thuộc timer    │
  └──────────────────┴──────────────────┴────────────────────┘
```

---

## 4. Phiên bản nâng cao

### Throttle — Leading + Trailing (kết hợp cả 2)

```javascript
// ===== THROTTLE — Advanced (Leading + Trailing) =====
function throttle(fn, delay, options = {}) {
  let timer = null;
  let previous = 0;
  // options.leading: false → không execute ngay
  // options.trailing: false → không execute cuối

  return function () {
    let context = this;
    let args = [...arguments];
    let now = Date.now();

    // Nếu leading = false → không execute lần đầu
    if (!previous && options.leading === false) {
      previous = now;
    }

    let remaining = delay - (now - previous);

    if (remaining <= 0 || remaining > delay) {
      // Đủ thời gian → EXECUTE
      if (timer) {
        clearTimeout(timer);
        timer = null;
      }
      previous = now;
      fn.apply(context, args);
    } else if (!timer && options.trailing !== false) {
      // Trailing: set timer cho lần cuối
      timer = setTimeout(() => {
        previous = options.leading === false ? 0 : Date.now();
        timer = null;
        fn.apply(context, args);
      }, remaining);
    }
  };
}

// Cả leading LẪN trailing
window.addEventListener("scroll", throttle(handleScroll, 200));

// Chỉ leading (không trailing)
window.addEventListener(
  "scroll",
  throttle(handleScroll, 200, { trailing: false }),
);

// Chỉ trailing (không leading)
window.addEventListener(
  "scroll",
  throttle(handleScroll, 200, { leading: false }),
);
```

### Debounce + Cancel

```javascript
// ===== DEBOUNCE — With Cancel =====
function debounce(fn, wait, immediate) {
  let timer = null;

  function debounced() {
    let context = this;
    let args = [...arguments];

    if (timer) clearTimeout(timer);

    if (immediate) {
      let callNow = !timer;
      timer = setTimeout(() => {
        timer = null;
      }, wait);
      if (callNow) fn.apply(context, args);
    } else {
      timer = setTimeout(() => {
        fn.apply(context, args);
      }, wait);
    }
  }

  // Cancel method — hủy timer
  debounced.cancel = function () {
    clearTimeout(timer);
    timer = null;
  };

  return debounced;
}

// Sử dụng cancel:
const debouncedSave = debounce(saveData, 1000);
input.addEventListener("input", debouncedSave);

// Khi cần cancel (VD: component unmount):
debouncedSave.cancel();
```

---

## 5. So sánh Debounce vs Throttle

```
DEBOUNCE vs THROTTLE — SO SÁNH CHI TIẾT:
═══════════════════════════════════════════════════════════════

  ┌──────────────────┬───────────────────┬───────────────────┐
  │                  │ DEBOUNCE          │ THROTTLE          │
  ├──────────────────┼───────────────────┼───────────────────┤
  │ Khái niệm        │ Chờ n giây SAU   │ Mỗi n giây chạy  │
  │                  │ trigger CUỐI      │ TỐI ĐA 1 lần     │
  ├──────────────────┼───────────────────┼───────────────────┤
  │ Reset timer?     │ CÓ (mỗi trigger) │ KHÔNG             │
  ├──────────────────┼───────────────────┼───────────────────┤
  │ Tần suất execute │ 1 lần (cuối cùng)│ Đều đặn (mỗi n)  │
  ├──────────────────┼───────────────────┼───────────────────┤
  │ Ví von            │ Thang máy đợi    │ Vòi nước chảy đều│
  │                  │ người vào         │                   │
  ├──────────────────┼───────────────────┼───────────────────┤
  │ Use case         │ Search input      │ Scroll listener   │
  │                  │ Button submit     │ Window resize     │
  │                  │ Form validation   │ Drag-and-drop     │
  │                  │                   │ Animation         │
  ├──────────────────┼───────────────────┼───────────────────┤
  │ Server pressure  │ Giảm NHIỀU hơn   │ Giảm vừa phải    │
  │                  │ (chỉ 1 request)  │ (N/delay request) │
  ├──────────────────┼───────────────────┼───────────────────┤
  │ Responsiveness   │ Có delay cảm nhận│ Đáp ứng ĐỒNG ĐỀU│
  └──────────────────┴───────────────────┴───────────────────┘

  KHI NÀO DÙNG CÁI NÀO?

  → DEBOUNCE: khi chỉ cần KẾT QUẢ CUỐI CÙNG
    (search input, form submit, window resize end)

  → THROTTLE: khi cần PHẢN HỒI ĐỀU ĐẶN
    (scroll, drag, animation, game input)
```

```
VISUAL COMPARISON (delay = 300ms):
═══════════════════════════════════════════════════════════════

  Events:    ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓         ↓ ↓ ↓
  Time:      0           500         1000      1300

  DEBOUNCE:  × × × × × × × × × ×         × × ×
             └──────reset──────── ┘         └─reset─┘
                                  ↓                   ↓
  Execute:                      800ms              1600ms
             (chỉ 2 lần — khi NGỪNG)

  THROTTLE:  ✅× × ✅× × ✅× × ✅         ✅× ✅
             0    300   600  900          1200  1500
             (6 lần — mỗi 300ms)
```

---

## 6. Tóm Tắt & Câu Hỏi Phỏng Vấn

### Quick Reference

```
THROTTLE & DEBOUNCE — QUICK REFERENCE:
═══════════════════════════════════════════════════════════════

  DEBOUNCE: chờ n giây SAU trigger cuối → execute LẦN CUỐI
  → Reset timer mỗi trigger mới
  → Use: search input, button submit, form validation

  THROTTLE: mỗi n giây → tối đa 1 lần execute
  → Không reset, đều đặn
  → Use: scroll, resize, drag, animation

  DEBOUNCE impl: clearTimeout + setTimeout
  THROTTLE impl:
    Timestamp version: Date.now() so sánh (leading, no trailing)
    Timer version: setTimeout (no leading, trailing)

  NÂNG CAO:
    Debounce + immediate (leading edge)
    Throttle + leading + trailing (options)
    Cancel method
```

### Câu Hỏi Phỏng Vấn Thường Gặp

**1. Debounce là gì? Throttle là gì?**

> **Debounce**: sau khi event trigger → chờ **n giây** → mới execute callback. Nếu trigger lại trong n giây → **reset timer**. Chỉ execute **lần cuối** khi user ngừng. **Throttle**: trong 1 khoảng n giây → **chỉ 1 callback** được execute. Dù trigger nhiều lần → chỉ 1 có hiệu lực. Tần suất **đều đặn**.

**2. Application scenarios của mỗi loại?**

> **Debounce**: ① Button submit (chống spam click, chỉ gửi lần cuối). ② Search input (chỉ gọi API khi ngừng gõ). ③ Form validation (server-side, chỉ validate khi ngừng nhập). **Throttle**: ① Scroll event (giảm tần suất). ② Drag-and-drop (mỗi n ms update 1 lần). ③ Window resize. ④ Animation (tránh trigger quá nhiều).

**3. Viết hàm debounce?**

> Dùng **closure** + **setTimeout**: lưu timer → mỗi trigger → `clearTimeout` timer cũ → `setTimeout` mới → chỉ execute khi hết wait ms không có trigger mới. Nâng cao: thêm `immediate` flag để execute **ngay lần đầu** (leading edge).

**4. Viết hàm throttle? 2 cách khác gì?**

> **Timestamp**: so sánh `Date.now() - preTime >= delay`, execute **ngay lần đầu** (leading), có thể miss lần cuối (no trailing). **Timer**: `setTimeout`, **không** execute ngay (no leading), luôn execute **lần cuối** (trailing). Nâng cao: kết hợp cả 2 + options `{leading, trailing}`.

**5. Khi nào dùng Debounce, khi nào dùng Throttle?**

> **Debounce**: khi chỉ cần **kết quả cuối cùng** (search input → user gõ xong mới search). **Throttle**: khi cần **phản hồi đều đặn** (scroll → update position liên tục nhưng giới hạn tần suất). Rule: Debounce → giảm requests **nhiều nhất**. Throttle → cân bằng giữa responsiveness + performance.

**6. Tại sao cần cancel method?**

> Khi component **unmount** (React), nếu debounced timer vẫn chạy → callback reference **DOM đã bị destroy** → error. `cancel()` → clearTimeout + reset timer → tránh memory leaks + errors. Luôn cleanup trong `useEffect return` hoặc `componentWillUnmount`.

---

## Checklist Học Tập

- [ ] Hiểu Debounce (chờ ngừng → chạy lần cuối)
- [ ] Hiểu Throttle (mỗi khoảng chạy tối đa 1 lần)
- [ ] Biết application scenarios (debounce → search/submit, throttle → scroll/resize/drag)
- [ ] Viết được debounce (clearTimeout + setTimeout)
- [ ] Viết được throttle timestamp version (Date.now)
- [ ] Viết được throttle timer version (setTimeout)
- [ ] Biết khác biệt: leading vs trailing
- [ ] Hiểu phiên bản nâng cao (immediate, cancel, options)
- [ ] Phân biệt khi nào dùng debounce vs throttle

---

_Cập nhật lần cuối: Tháng 2, 2026_
