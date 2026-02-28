# Frontend Performance — Ba Phương Pháp Lazy Loading Hình Ảnh

> Phân tích chi tiết 3 cách triển khai lazy loading hình ảnh: Scroll + OffsetTop, getBoundingClientRect, và IntersectionObserver. Từ nguyên lý cốt lõi, hiệu năng, đến best practices trong production.
> Độ khó: ⭐️⭐️ | Thời gian đọc: ~12 phút

---

## Mục Lục

1. [Tại Sao Cần Lazy Loading?](#1-tại-sao-cần-lazy-loading)
2. [Nguyên Lý Cốt Lõi](#2-nguyên-lý-cốt-lõi)
3. [Phương Án 1 — Scroll + OffsetTop](#3-phương-án-1--scroll--offsettop)
4. [Phương Án 2 — getBoundingClientRect](#4-phương-án-2--getboundingclientrect)
5. [Phương Án 3 — IntersectionObserver (Tối Ưu)](#5-phương-án-3--intersectionobserver-tối-ưu)
6. [So Sánh Ba Phương Án](#6-so-sánh-ba-phương-án)
7. [Bổ Sung & Best Practices](#7-bổ-sung--best-practices)
8. [Câu Hỏi Phỏng Vấn](#8-câu-hỏi-phỏng-vấn)

---

## 1. Tại Sao Cần Lazy Loading?

```
VẤN ĐỀ VỚI ỨNG DỤNG NHIỀU HÌNH ẢNH:
═══════════════════════════════════════════════════════════════

  E-commerce, social media, news feeds...
  → Hàng chục / hàng trăm hình ảnh trên 1 trang

  ┌──────────────────────────────────────────────────────────┐
  │                                                          │
  │  NẾU LOAD TẤT CẢ CÙNG LÚC:                              │
  │                                                          │
  │  ① FP (First Paint) rất chậm → màn hình trắng lâu      │
  │  ② Tốn bandwidth → user mobile mất nhiều data           │
  │  ③ Hàng chục HTTP requests đồng thời                     │
  │  ④ Memory usage cao → tab có thể crash                   │
  │  ⑤ Nhiều ảnh user KHÔNG BAO GIỜ cuộn đến xem            │
  │     → Load LÃNG PHÍ hoàn toàn!                          │
  │                                                          │
  └──────────────────────────────────────────────────────────┘

  GIẢI PHÁP — LAZY LOADING:
  ┌──────────────────────────────────────────────────────────┐
  │                                                          │
  │  "Load on demand" — CHỈ load khi ảnh sắp hiển thị      │
  │                                                          │
  │  ┌──────────────────────────────────┐                   │
  │  │    Visible Area (Viewport)       │                   │
  │  │  ┌────┐ ┌────┐ ┌────┐           │                   │
  │  │  │ ✅ │ │ ✅ │ │ ✅ │  ← Loaded  │                   │
  │  │  └────┘ └────┘ └────┘           │                   │
  │  └──────────────────────────────────┘                   │
  │  ┌──────────────────────────────────┐                   │
  │  │    Below Viewport (chưa thấy)    │                   │
  │  │  ┌────┐ ┌────┐ ┌────┐           │                   │
  │  │  │ ⏸️ │ │ ⏸️ │ │ ⏸️ │  ← Chưa load│                  │
  │  │  └────┘ └────┘ └────┘           │                   │
  │  │  ┌────┐ ┌────┐ ┌────┐           │                   │
  │  │  │ ⏸️ │ │ ⏸️ │ │ ⏸️ │  ← Chưa load│                  │
  │  │  └────┘ └────┘ └────┘           │                   │
  │  └──────────────────────────────────┘                   │
  │                                                          │
  │  → User cuộn xuống → ảnh vào viewport → BẮT ĐẦU load  │
  │                                                          │
  └──────────────────────────────────────────────────────────┘

═══════════════════════════════════════════════════════════════
```

---

## 2. Nguyên Lý Cốt Lõi

```
3 BƯỚC CỦA LAZY LOADING:
═══════════════════════════════════════════════════════════════

  BƯỚC 1: PLACEHOLDER IMAGE
  ┌──────────────────────────────────────────────────────────┐
  │                                                          │
  │  Ban đầu, src trỏ đến placeholder nhỏ:                  │
  │                                                          │
  │  <img src="placeholder.gif"                             │
  │       data-src="real-image.jpg"                          │
  │       alt="Product" />                                   │
  │                                                          │
  │  → src = placeholder (base64, 1x1px, hoặc loading gif) │
  │  → data-src = URL thật (chưa load)                      │
  │  → Browser CHỈ tải placeholder nhỏ                      │
  │                                                          │
  └──────────────────────────────────────────────────────────┘

  BƯỚC 2: DETECT VỊ TRÍ
  ┌──────────────────────────────────────────────────────────┐
  │                                                          │
  │  JS lắng nghe sự thay đổi vị trí:                       │
  │  → Scroll event listener                                │
  │  → HOẶC IntersectionObserver                             │
  │                                                          │
  │  Khi ảnh VÀO hoặc SẮP VÀO viewport → trigger!          │
  │                                                          │
  └──────────────────────────────────────────────────────────┘

  BƯỚC 3: SWAP SRC
  ┌──────────────────────────────────────────────────────────┐
  │                                                          │
  │  img.src = img.dataset.src;                              │
  │  // data-src → src                                       │
  │  // Browser bắt đầu tải ảnh thật                        │
  │                                                          │
  │  img.removeAttribute('data-src');                        │
  │  // Xóa data-src → tránh load lại lần sau               │
  │                                                          │
  └──────────────────────────────────────────────────────────┘

═══════════════════════════════════════════════════════════════
```

---

## 3. Phương Án 1 — Scroll + OffsetTop

```
CÁCH TIẾP CẬN CỔ ĐIỂN NHẤT:
═══════════════════════════════════════════════════════════════

  CÔNG THỨC:
  ┌──────────────────────────────────────────────────────────┐
  │                                                          │
  │  window.innerHeight + scrollTop > element.offsetTop     │
  │  ───────┬────────   ───┬──────   ──────┬──────────      │
  │         │              │               │                 │
  │    Chiều cao      Đã cuộn      Khoảng cách              │
  │    viewport       xuống bao    element đến               │
  │                   nhiêu        TOP của page              │
  │                                                          │
  │  Nếu TRUE → element ĐÃ XUẤT HIỆN trong viewport        │
  │                                                          │
  └──────────────────────────────────────────────────────────┘

  TRỰC QUAN:
  ┌──────────────────────────────────────────────────────────┐
  │                                                          │
  │  ┌──────────── Page ─────────────────┐                  │
  │  │  ← scrollTop (đã cuộn qua) →     │                  │
  │  │  ┌───────────────────────────────┐│                  │
  │  │  │        (đã cuộn qua)         ││                  │
  │  │  └───────────────────────────────┘│                  │
  │  │  ════════ TOP VIEWPORT ═══════════│                  │
  │  │  ┌───────────────────────────────┐│                  │
  │  │  │      Viewport (thấy được)    ││ innerHeight      │
  │  │  │                               ││                  │
  │  │  │  ┌────┐ ← img.offsetTop      ││                  │
  │  │  │  │ IMG│   (tính từ top page) ││                  │
  │  │  │  └────┘                       ││                  │
  │  │  └───────────────────────────────┘│                  │
  │  │  ════════ BOTTOM VIEWPORT ════════│                  │
  │  │  ┌───────────────────────────────┐│                  │
  │  │  │      (chưa cuộn đến)         ││                  │
  │  │  └───────────────────────────────┘│                  │
  │  └──────────────────────────────────┘                   │
  │                                                          │
  └──────────────────────────────────────────────────────────┘

═══════════════════════════════════════════════════════════════
```

### Code Implementation

```javascript
function lazyLoad() {
  const images = document.querySelectorAll("img[data-src]");
  const clientHeight = window.innerHeight;
  const scrollTop =
    document.documentElement.scrollTop || document.body.scrollTop;

  images.forEach((img) => {
    // Ảnh đã vào viewport?
    if (clientHeight + scrollTop > img.offsetTop) {
      img.src = img.dataset.src;
      img.removeAttribute("data-src"); // Tránh load lại
    }
  });
}

// ⚠️ BẮT BUỘC phải throttle — scroll fire hàng trăm lần/giây!
window.addEventListener("scroll", throttle(lazyLoad, 200));

// Gọi 1 lần khi page load (cho ảnh đã trong viewport)
lazyLoad();
```

```
⚠️ VẤN ĐỀ CỦA PHƯƠNG ÁN 1:
┌──────────────────────────────────────────────────────────┐
│                                                          │
│  ① scroll event fire CỰC NHIỀU → PHẢI throttle          │
│  ② offsetTop gây REFLOW mỗi lần truy cập                │
│     → Browser phải tính lại layout                       │
│     → Đặc biệt chậm khi có nhiều ảnh                    │
│  ③ offsetTop tính từ positioned parent                   │
│     → Nếu có nested positioned elements → tính SAI!      │
│  ④ querySelectorAll('img[data-src]') mỗi lần scroll      │
│     → O(n) scan mỗi lần                                  │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

---

## 4. Phương Án 2 — getBoundingClientRect

```
CẢI TIẾN — VỊ TRÍ TƯƠNG ĐỐI VỚI VIEWPORT:
═══════════════════════════════════════════════════════════════

  getBoundingClientRect() trả về vị trí element
  SO VỚI VIEWPORT (không phải so với page):

  ┌──────────────────────────────────────────────────────────┐
  │                                                          │
  │  const rect = img.getBoundingClientRect();               │
  │                                                          │
  │  rect = {                                                │
  │    top:    50,   ← khoảng cách đến TOP viewport        │
  │    bottom: 250,  ← khoảng cách đến BOTTOM viewport     │
  │    left:   10,                                           │
  │    right:  210,                                          │
  │    width:  200,                                          │
  │    height: 200                                           │
  │  }                                                       │
  │                                                          │
  │  ĐIỀU KIỆN: ảnh trong viewport khi:                      │
  │  rect.top >= 0  &&  rect.top < window.innerHeight       │
  │                                                          │
  └──────────────────────────────────────────────────────────┘

  SO VỚI PHƯƠNG ÁN 1:
  ┌──────────────────────────────────────────────────────────┐
  │                                                          │
  │  OffsetTop:                                              │
  │  → Tính tuyệt đối từ top PAGE                           │
  │  → Cần tự cộng scrollTop + innerHeight                  │
  │  → Dễ sai nếu có nested positioned parents              │
  │                                                          │
  │  getBoundingClientRect:                                  │
  │  → Tính tương đối từ VIEWPORT                            │
  │  → Đơn giản hơn: chỉ cần so rect.top vs innerHeight    │
  │  → Chính xác hơn: không phụ thuộc DOM structure         │
  │                                                          │
  └──────────────────────────────────────────────────────────┘

═══════════════════════════════════════════════════════════════
```

### Code Implementation

```javascript
function handleScroll() {
  const images = document.querySelectorAll("img[data-src]");
  const viewHeight =
    window.innerHeight || document.documentElement.clientHeight;

  images.forEach((img) => {
    const rect = img.getBoundingClientRect();

    // Element top nằm trong viewport
    if (rect.top >= 0 && rect.top < viewHeight) {
      img.src = img.dataset.src;
      img.removeAttribute("data-src");
    }
  });
}

window.addEventListener("scroll", throttle(handleScroll, 200));
handleScroll(); // Initial check
```

```
⚠️ VẤN ĐỀ CỦA PHƯƠNG ÁN 2:
┌──────────────────────────────────────────────────────────┐
│                                                          │
│  ① Vẫn cần scroll listener + throttle                    │
│  ② getBoundingClientRect() CŨNG gây REFLOW               │
│     → Browser phải recalculate layout                    │
│     → Gọi trong loop (nhiều ảnh) = nhiều reflows        │
│  ③ Cải tiến so với PA1 nhưng BẢN CHẤT vẫn giống:        │
│     → Synchronous → block main thread                   │
│     → Tính toán thủ công                                 │
│                                                          │
│  → Cần giải pháp HOÀN TOÀN KHÁC → IntersectionObserver  │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

---

## 5. Phương Án 3 — IntersectionObserver (Tối Ưu)

```
GIẢI PHÁP TỐI ƯU — ASYNCHRONOUS, KHÔNG REFLOW:
═══════════════════════════════════════════════════════════════

  IntersectionObserver = API native của browser
  → ASYNCHRONOUS: không block main thread
  → KHÔNG cần scroll listener
  → KHÔNG gây reflow
  → Browser engine tự tính visibility

  ┌──────────────────────────────────────────────────────────┐
  │                                                          │
  │  Phương án 1 & 2:                                        │
  │  scroll → throttle → tính position → check → load      │
  │  (synchronous, block main thread, gây reflow)            │
  │                                                          │
  │  Phương án 3:                                            │
  │  observe(img) → browser tự track → callback khi visible │
  │  (asynchronous, không block, không reflow)               │
  │                                                          │
  └──────────────────────────────────────────────────────────┘

  API SYNTAX:
  ┌──────────────────────────────────────────────────────────┐
  │                                                          │
  │  const observer = new IntersectionObserver(              │
  │    callback,  // Gọi khi visibility thay đổi            │
  │    options    // Config (optional)                       │
  │  );                                                      │
  │                                                          │
  │  OPTIONS:                                                 │
  │  ┌────────────────┬──────────────────────────────────┐  │
  │  │ root           │ Element gốc (default: viewport)  │  │
  │  │ rootMargin     │ Margin quanh root                │  │
  │  │                │ "0px 0px 50px 0px"               │  │
  │  │                │ → load SỚM HƠN 50px!            │  │
  │  │ threshold      │ Tỷ lệ intersect để trigger      │  │
  │  │                │ 0.1 = 10% hiện = trigger         │  │
  │  └────────────────┴──────────────────────────────────┘  │
  │                                                          │
  │  CALLBACK(entries, observer):                            │
  │  ┌────────────────────────────────────────────────────┐ │
  │  │ entries = array of IntersectionObserverEntry      │ │
  │  │                                                    │ │
  │  │ entry.isIntersecting → true/false                  │ │
  │  │ entry.intersectionRatio → 0.0 đến 1.0             │ │
  │  │ entry.target → element đang observe                │ │
  │  │ entry.boundingClientRect → vị trí element         │ │
  │  └────────────────────────────────────────────────────┘ │
  │                                                          │
  │  METHODS:                                                │
  │  observer.observe(el)   → bắt đầu theo dõi             │
  │  observer.unobserve(el) → dừng theo dõi 1 element      │
  │  observer.disconnect()  → dừng tất cả                   │
  │                                                          │
  └──────────────────────────────────────────────────────────┘

═══════════════════════════════════════════════════════════════
```

### Code Implementation

```javascript
const observerOptions = {
  root: null, // Mặc định = browser viewport
  rootMargin: "0px 0px 50px 0px", // Load sớm hơn 50px → UX mượt hơn
  threshold: 0.1, // Trigger khi 10% ảnh xuất hiện
};

const handleIntersection = (entries, observer) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      const img = entry.target;
      img.src = img.dataset.src;
      img.removeAttribute("data-src");

      // ⭐ Dừng observe element này — đã load xong
      observer.unobserve(img);
    }
  });
};

const observer = new IntersectionObserver(handleIntersection, observerOptions);

// Observe tất cả ảnh có data-src
document.querySelectorAll("img[data-src]").forEach((img) => {
  observer.observe(img);
});
```

```
TẠI SAO PHƯƠNG ÁN 3 TỐI ƯU:
┌──────────────────────────────────────────────────────────┐
│                                                          │
│  ① KHÔNG scroll listener → không throttle/debounce      │
│  ② ASYNCHRONOUS → không block main thread               │
│  ③ KHÔNG gây reflow → browser engine tính nội bộ        │
│  ④ KHÔNG loop querySelectorAll mỗi lần scroll           │
│  ⑤ unobserve() → tự cleanup sau khi load                │
│  ⑥ rootMargin → pre-load trước khi user thấy            │
│     → Ảnh đã sẵn sàng KHI cuộn đến → UX mượt           │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

---

## 6. So Sánh Ba Phương Án

```
BẢNG SO SÁNH TOÀN DIỆN:
═══════════════════════════════════════════════════════════════

  ┌──────────────────┬──────────────┬──────────────┬──────────────┐
  │ Tiêu chí          │ PA1          │ PA2          │ PA3          │
  │                  │ OffsetTop    │ BoundingRect │ Intersection │
  ├──────────────────┼──────────────┼──────────────┼──────────────┤
  │ Độ phức tạp       │ Cao          │ Trung bình   │ Rất thấp     │
  │ tính toán         │ (tính cumul. │ (rect API)   │ (native)     │
  │                  │  height)     │              │              │
  ├──────────────────┼──────────────┼──────────────┼──────────────┤
  │ Performance      │ ❌ Cao       │ ❌ Cao       │ ✅ Thấp      │
  │ (main thread)    │ (sync reflow)│ (sync reflow)│ (async)      │
  ├──────────────────┼──────────────┼──────────────┼──────────────┤
  │ Scroll listener  │ ✅ Cần       │ ✅ Cần       │ ❌ Không cần │
  │                  │ + throttle   │ + throttle   │              │
  ├──────────────────┼──────────────┼──────────────┼──────────────┤
  │ Reflow           │ ❌ Gây       │ ❌ Gây       │ ✅ Không     │
  │                  │ (offsetTop)  │ (getRect)    │              │
  ├──────────────────┼──────────────┼──────────────┼──────────────┤
  │ Tương thích      │ ✅ Tất cả    │ ✅ IE9+      │ ⚠️ Modern   │
  │                  │ browsers     │              │ (IE cần      │
  │                  │              │              │  polyfill)   │
  ├──────────────────┼──────────────┼──────────────┼──────────────┤
  │ Pre-loading      │ ❌ Phải code │ ❌ Phải code │ ✅ rootMargin│
  │                  │ thủ công     │ thủ công     │ (native)     │
  ├──────────────────┼──────────────┼──────────────┼──────────────┤
  │ Khuyến nghị      │ Legacy only  │ Hiếm dùng   │ ⭐ PRODUCTION│
  └──────────────────┴──────────────┴──────────────┴──────────────┘

  TẠI SAO PA1 & PA2 GÂY REFLOW:
  ┌──────────────────────────────────────────────────────────┐
  │                                                          │
  │  Khi truy cập offsetTop hoặc getBoundingClientRect():   │
  │  → Browser BUỘC phải recalculate layout                 │
  │  → Đặc biệt trong loop (nhiều ảnh):                    │
  │                                                          │
  │    images.forEach(img => {                               │
  │      img.offsetTop;       // ← REFLOW #1                │
  │    });                                                   │
  │    // hoặc                                               │
  │    images.forEach(img => {                               │
  │      img.getBoundingClientRect(); // ← REFLOW #N        │
  │    });                                                   │
  │                                                          │
  │  → N ảnh = có thể N reflows mỗi scroll event!          │
  │  → Long list (100+ ảnh) → frame drops → jank           │
  │                                                          │
  │  PA3 KHÔNG bị vì:                                        │
  │  → Browser engine track visibility nội bộ                │
  │  → Async callback → không block rendering pipeline      │
  │                                                          │
  └──────────────────────────────────────────────────────────┘

═══════════════════════════════════════════════════════════════
```

---

## 7. Bổ Sung & Best Practices

```
BỔ SUNG VÀ KINH NGHIỆM THỰC TẾ:
═══════════════════════════════════════════════════════════════

  ① NATIVE LAZY LOADING (Chrome 76+):
  ┌──────────────────────────────────────────────────────────┐
  │                                                          │
  │  <img src="image.jpg" loading="lazy" alt="Product" />  │
  │                                                          │
  │  → CHỈ 1 attribute HTML → browser TỰ lazy load!        │
  │  → Không cần JavaScript                                 │
  │  → Chrome, Edge, Firefox, Safari 15.4+ support          │
  │                                                          │
  │  3 giá trị:                                              │
  │  loading="lazy"  → Lazy load                             │
  │  loading="eager" → Load ngay (default behavior)         │
  │  loading="auto"  → Browser tự quyết                     │
  │                                                          │
  │  ⚠️ Hạn chế:                                            │
  │  → Không custom threshold/rootMargin                    │
  │  → Browser tự quyết timing → ít kiểm soát              │
  │  → Đủ cho simple cases, phức tạp hơn → PA3             │
  │                                                          │
  └──────────────────────────────────────────────────────────┘

  ② TRÁNH LAYOUT SHIFT (CLS):
  ┌──────────────────────────────────────────────────────────┐
  │                                                          │
  │  ⚠️ VẤN ĐỀ NGHIÊM TRỌNG:                               │
  │  → Trước khi load, ảnh có height = 0                    │
  │  → Khi load xong, ảnh expand → page "nhảy"!             │
  │  → CLS (Cumulative Layout Shift) tăng → UX tệ          │
  │  → Core Web Vitals bị ảnh hưởng                         │
  │                                                          │
  │  GIẢI PHÁP:                                               │
  │  ┌────────────────────────────────────────────────────┐ │
  │  │  /* CSS aspect-ratio */                            │ │
  │  │  img {                                              │ │
  │  │    aspect-ratio: 16 / 9;                           │ │
  │  │    width: 100%;                                     │ │
  │  │    object-fit: cover;                               │ │
  │  │    background-color: #f0f0f0; /* placeholder */    │ │
  │  │  }                                                  │ │
  │  │                                                    │ │
  │  │  /* Hoặc dùng width + height attributes */         │ │
  │  │  <img width="800" height="450"                     │ │
  │  │       data-src="real.jpg" />                       │ │
  │  │  → Browser reserve space TRƯỚC KHI load            │ │
  │  └────────────────────────────────────────────────────┘ │
  │                                                          │
  └──────────────────────────────────────────────────────────┘

  ③ THROTTLE FUNCTION (cho PA1 & PA2):
  ┌──────────────────────────────────────────────────────────┐
  │                                                          │
  │  function throttle(fn, delay) {                          │
  │    let lastTime = 0;                                     │
  │    return function(...args) {                            │
  │      const now = Date.now();                             │
  │      if (now - lastTime >= delay) {                     │
  │        lastTime = now;                                   │
  │        fn.apply(this, args);                             │
  │      }                                                   │
  │    };                                                    │
  │  }                                                       │
  │                                                          │
  │  → Giới hạn scroll handler chạy tối đa 1 lần / 200ms  │
  │  → Không throttle = hàng trăm calls/giây → LAG         │
  │                                                          │
  └──────────────────────────────────────────────────────────┘

  ④ PRODUCTION CHECKLIST:
  ┌──────────────────────────────────────────────────────────┐
  │  ✅ Dùng IntersectionObserver (PA3) cho production       │
  │  ✅ Set width/height hoặc aspect-ratio cho ảnh          │
  │  ✅ Thêm background-color placeholder                   │
  │  ✅ rootMargin pre-load (50-200px)                       │
  │  ✅ unobserve sau khi load xong                          │
  │  ✅ Polyfill cho IE nếu cần                              │
  │  ✅ loading="lazy" cho ảnh below-the-fold đơn giản      │
  │  ✅ loading="eager" cho ảnh LCP (hero image)            │
  │  ❌ ĐỪNG lazy load ảnh above-the-fold / hero image!     │
  └──────────────────────────────────────────────────────────┘

═══════════════════════════════════════════════════════════════
```

---

## 8. Câu Hỏi Phỏng Vấn

### Q1: Lazy loading hình ảnh hoạt động thế nào? Nguyên lý cốt lõi?

```
TRẢ LỜI:
┌──────────────────────────────────────────────────────────────┐
│                                                              │
│  Nguyên lý "load on demand" — 3 bước:                       │
│                                                              │
│  ① Placeholder: src trỏ đến ảnh nhỏ/base64                │
│     Lưu URL thật vào data-src                               │
│                                                              │
│  ② Detect: JS theo dõi position của ảnh                    │
│     Khi ảnh vào/sắp vào viewport → trigger                 │
│                                                              │
│  ③ Swap: data-src → src, browser bắt đầu tải ảnh thật    │
│     Xóa data-src để tránh load lại                         │
│                                                              │
│  3 cách detect:                                              │
│  → Scroll + offsetTop (cổ điển, gây reflow)                │
│  → getBoundingClientRect (cải tiến, vẫn reflow)            │
│  → IntersectionObserver (tối ưu, async, không reflow)      │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

### Q2: So sánh 3 phương pháp lazy loading? Production nên dùng cái nào?

```
TRẢ LỜI:
┌──────────────────────────────────────────────────────────────┐
│                                                              │
│  ┌────────────┬──────────────┬────────────┬──────────────┐  │
│  │            │ OffsetTop    │ BoundRect  │ Intersection │  │
│  ├────────────┼──────────────┼────────────┼──────────────┤  │
│  │ Sync/Async │ Sync         │ Sync       │ Async        │  │
│  │ Reflow     │ ❌ Gây       │ ❌ Gây     │ ✅ Không     │  │
│  │ Listener   │ Cần scroll   │ Cần scroll │ Không cần    │  │
│  │ Compat     │ Tất cả       │ IE9+       │ Modern       │  │
│  │ Perf       │ Thấp         │ Thấp       │ ⭐ Cao       │  │
│  └────────────┴──────────────┴────────────┴──────────────┘  │
│                                                              │
│  Production: IntersectionObserver (PA3)                      │
│  → Async, không block main thread                           │
│  → Không gây reflow                                          │
│  → rootMargin pre-load → UX mượt                            │
│  → Polyfill cho IE nếu cần support                          │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

### Q3: Tại sao offsetTop và getBoundingClientRect gây performance issues?

```
TRẢ LỜI:
┌──────────────────────────────────────────────────────────────┐
│                                                              │
│  Cả hai đều buộc browser phải RECALCULATE LAYOUT (reflow): │
│                                                              │
│  → Khi JS truy cập offsetTop hoặc getBoundingClientRect()  │
│  → Browser PHẢI tính lại vị trí của element                 │
│  → Trong loop (nhiều ảnh) = N reflows mỗi scroll event    │
│  → Scroll fire hàng trăm lần/giây (dù có throttle)        │
│  → N ảnh × many scroll events = HÀNG NGHÌN reflows        │
│                                                              │
│  Hậu quả: frame drops, jank, UI lag                         │
│                                                              │
│  IntersectionObserver không bị vì:                           │
│  → Browser engine track nội bộ, ASYNC                       │
│  → Không reflow                                              │
│  → Callback chạy ngoài rendering pipeline                   │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

### Q4: IntersectionObserver rootMargin dùng để làm gì?

```
TRẢ LỜI:
┌──────────────────────────────────────────────────────────────┐
│                                                              │
│  rootMargin mở rộng "vùng trigger" ra ngoài viewport:       │
│                                                              │
│  rootMargin: '0px 0px 50px 0px'                             │
│  → bottom margin 50px                                        │
│  → Trigger khi ảnh còn CÁCH viewport 50px                   │
│  → Ảnh BẮT ĐẦU load TRƯỚC KHI user nhìn thấy              │
│  → Khi cuộn đến → ảnh ĐÃ SẴN SÀNG → UX mượt              │
│                                                              │
│  Nếu không có rootMargin:                                    │
│  → Load đúng lúc ảnh vào viewport                           │
│  → User thấy placeholder → chờ load → rồi mới thấy ảnh    │
│  → Trải nghiệm "giật"                                       │
│                                                              │
│  Best practice: 50px - 200px tùy tốc độ cuộn               │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

### Q5: Lazy loading có thể gây CLS không? Cách fix?

```
TRẢ LỜI:
┌──────────────────────────────────────────────────────────────┐
│                                                              │
│  CÓ — Cumulative Layout Shift (CLS):                        │
│                                                              │
│  Vấn đề:                                                     │
│  → Trước load: ảnh height = 0 (hoặc placeholder nhỏ)       │
│  → Sau load: ảnh expand ra full size                         │
│  → Nội dung bên dưới bị ĐẨY XUỐNG → page "nhảy"            │
│  → CLS score tăng → Core Web Vitals xấu                    │
│                                                              │
│  Fix:                                                        │
│  ① Set width + height attributes trên <img>                │
│     → Browser reserve space trước                            │
│                                                              │
│  ② CSS aspect-ratio:                                         │
│     img { aspect-ratio: 16/9; width: 100%; }                │
│                                                              │
│  ③ Background-color cho placeholder:                        │
│     img { background: #f0f0f0; }                            │
│     → User thấy khung xám thay vì trống                    │
│                                                              │
│  ④ KHÔNG lazy load hero image (above-the-fold)              │
│     → Dùng loading="eager" hoặc không lazy load             │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

### Q6: `<img loading="lazy">` native khác gì IntersectionObserver?

```
TRẢ LỜI:
┌──────────────────────────────────────────────────────────────┐
│                                                              │
│  loading="lazy" (HTML attribute):                            │
│  → Không cần JavaScript                                     │
│  → Browser TỰ quyết khi nào load                           │
│  → Không custom threshold/rootMargin                        │
│  → Chrome 76+, Firefox 75+, Safari 15.4+                   │
│  → Phù hợp cho simple cases                                 │
│                                                              │
│  IntersectionObserver (JavaScript API):                      │
│  → Full control: rootMargin, threshold                      │
│  → Custom callback (animations, analytics...)               │
│  → Có thể observe bất kỳ element (không chỉ img)           │
│  → Polyfill cho IE                                          │
│  → Phù hợp cho complex cases, custom UX                    │
│                                                              │
│  Production recommendation:                                  │
│  → Simple: loading="lazy" (đủ dùng, zero JS)               │
│  → Complex: IntersectionObserver (full control)             │
│  → Có thể KẾT HỢP cả hai (fallback strategy)              │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```
