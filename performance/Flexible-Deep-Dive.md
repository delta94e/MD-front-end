# Taobao Flexible — Phân tích chuyên sâu — Deep Dive

> 📅 2026-02-12 · ⏱ 10 phút đọc
>
> Giải pháp mobile adaptation kinh điển của Taobao. Bao gồm:
> rem tính thế nào (chia 10 phần), DPR là gì (device pixel vs
> CSS pixel), viewport scale thay đổi ảnh hưởng gì, vấn đề 1px,
> version 0.3.2 vs 2.0, và tại sao ngày nay dùng vw thay thế.
> Độ khó: ⭐️⭐️⭐️⭐️ | Chủ đề: CSS / Mobile / Responsive

---

## Mục Lục

0. [Flexible là gì?](#0-flexible)
1. [rem tính thế nào?](#1-rem)
2. [DPR — Device Pixel Ratio](#2-dpr)
3. [Viewport Scale thay đổi → ảnh hưởng gì?](#3-viewport)
4. [Vấn đề 1px](#4-1px-problem)
5. [Version 0.3.2 vs 2.0](#5-versions)
6. [Flexible vs VW — Hiện đại](#6-flexible-vs-vw)
7. [Tóm Tắt & Câu Hỏi Phỏng Vấn](#7-tóm-tắt)

---

## 0. Flexible là gì?

```
FLEXIBLE — TỔNG QUAN:
═══════════════════════════════════════════════════════════════

  Flexible là giải pháp mobile adaptation của Taobao
  (淘宝) do đội ngũ "大漠" phát triển.

  MỤC TIÊU:
  → Một design (750px) chạy mượt trên MỌI thiết bị mobile
  → iPhone 4 (320px), iPhone 6 (375px), iPhone 6+ (414px)...
  → Tỉ lệ element giữ nguyên, chỉ scale theo màn hình

  Ý TƯỞNG CỐT LÕI:
  → Lấy cảm hứng từ vw (viewport width)
  → 100vw = device width, không phụ thuộc pixel cụ thể
  → Nhưng vw thời đó browser support kém
  → Dùng rem HACK lại hiệu ứng vw!

  FORMULA:
  ┌─────────────────────────────────────────────────────┐
  │ 1vw = clientWidth / 100                             │
  │                                                     │
  │ Flexible hack:                                      │
  │ 1rem = clientWidth / 10 = htmlFontSize              │
  │                                                     │
  │ → Set html font-size = clientWidth/10               │
  │ → Mọi element dùng rem → tự scale theo device!     │
  └─────────────────────────────────────────────────────┘
```

---

## 1. rem tính thế nào?

### Công thức cốt lõi

```javascript
var docEl = document.documentElement;
var rem = docEl.clientWidth / 10;
docEl.style.fontSize = rem + "px";
```

### Tại sao chia 10, không chia 100?

```
TẠI SAO CHIA 10?
═══════════════════════════════════════════════════════════════

  Nếu chia 100 (giống vw):
  → iPhone 4: clientWidth = 320px
  → 1rem = 320/100 = 3.2px
  → Nhưng hầu hết browser KHÔNG hỗ trợ font-size < 12px!
  → html font-size = 3.2px → browser tự round lên 12px
  → TOÀN BỘ layout vỡ!

  Tính toán: 320 / 12 = 26.67
  → Chia TỐI ĐA 26 phần mới đảm bảo font-size ≥ 12px
  → Chọn SỐ TRÒN dễ tính: 10!

  Kết quả khi chia 10:
  ┌──────────────┬──────────────┬──────────────┐
  │ Device       │ clientWidth  │ 1rem (÷10)   │
  ├──────────────┼──────────────┼──────────────┤
  │ iPhone 4     │ 320px        │ 32px         │
  │ iPhone 5     │ 320px        │ 32px         │
  │ iPhone 6     │ 375px        │ 37.5px       │
  │ iPhone 6+    │ 414px        │ 41.4px       │
  │ iPad         │ 768px        │ 76.8px       │
  └──────────────┴──────────────┴──────────────┘

  → Tất cả ≥ 12px → browser render đúng!
```

### Quy trình chuyển đổi design → code

```
DESIGN TO CODE:
═══════════════════════════════════════════════════════════════

  Design file: 750px (iPhone 6 @2x)

  Bước 1: Tính 1rem theo design
  → 1rem = 750 / 10 = 75px (trên design)

  Bước 2: Element trên design = 150px width
  → CSS: width = 150 / 75 = 2rem

  Bước 3: Browser render trên iPhone 6 (375px)
  → html font-size = 375 / 10 = 37.5px
  → 2rem = 2 × 37.5 = 75px ← ĐÚNG tỉ lệ!

  Bước 4: Browser render trên iPhone 4 (320px)
  → html font-size = 320 / 10 = 32px
  → 2rem = 2 × 32 = 64px ← VẪN ĐÚNG tỉ lệ!

  ┌────────────────────────────────────────────────────┐
  │ Design (750px):  element = 150px  = 150/750 = 20% │
  │ iPhone 6 (375px): element = 75px  =  75/375 = 20% │
  │ iPhone 4 (320px): element = 64px  =  64/320 = 20% │
  │                                                    │
  │ → TỈ LỆ LUÔN LÀ 20%! ← Đây là magic của rem!    │
  └────────────────────────────────────────────────────┘
```

---

## 2. DPR — Device Pixel Ratio

### Physical Pixel vs CSS Pixel

```
DPR — DEVICE PIXEL RATIO:
═══════════════════════════════════════════════════════════════

  TRƯỚC iPhone 4 (không Retina):
  → 1 device pixel = 1 CSS pixel
  → DPR = 1

  iPhone 3GS:
  ┌──────────────────────────────────────┐
  │ Physical pixels: 320 × 480          │
  │ CSS pixels:      320 × 480          │
  │ DPR = 320/320 = 1                   │
  └──────────────────────────────────────┘

  iPhone 4 (Retina!):
  ┌──────────────────────────────────────┐
  │ Physical pixels: 640 × 960          │
  │ CSS pixels:      320 × 480          │
  │ DPR = 640/320 = 2                   │
  └──────────────────────────────────────┘

  → CÙNG kích thước vật lý (3.5 inch)
  → Nhưng gấp ĐÔI số pixel!
  → 1 CSS pixel = 2×2 = 4 physical pixels
```

### Bảng DPR các thiết bị

```
DEVICE PIXEL TABLE:
  ┌────────────────┬───────────┬──────────┬───────────┬─────┐
  │ Device         │ Phys W px │ Phys H px│ CSS Width │ DPR │
  ├────────────────┼───────────┼──────────┼───────────┼─────┤
  │ iPhone 3GS     │ 320       │ 480      │ 320       │ 1   │
  │ iPhone 4/4S    │ 640       │ 960      │ 320       │ 2   │
  │ iPhone 5/5s    │ 640       │ 1136     │ 320       │ 2   │
  │ iPhone 6/6s    │ 750       │ 1334     │ 375       │ 2   │
  │ iPhone 6+      │ 1080      │ 1920     │ 414       │ ~3  │
  │ iPhone 7       │ 750       │ 1334     │ 375       │ 2   │
  └────────────────┴───────────┴──────────┴───────────┴─────┘

  LƯU Ý:
  → CSS Width = Physical Width / DPR
  → Website "nhìn thấy" CSS Width, KHÔNG phải Physical Width
  → iPhone 4 physical = 640px, nhưng website thấy 320px!
```

### Tại sao cần DPR?

```
VẤN ĐỀ TRƯỚC KHI CÓ DPR:
═══════════════════════════════════════════════════════════════

  Website thời đó thiết kế cho 320px:

  Trên iPhone 3GS (320px physical):
  ┌──────────────────────────┐
  │ Website 320px            │ ← VỪA KHÍT!
  │ ████████████████████████ │
  └──────────────────────────┘

  Trên iPhone 4 (640px physical) NẾU KHÔNG CÓ DPR:
  ┌──────────────────────────────────────────────────┐
  │ Website 320px    │                               │
  │ ████████████████ │        TRỐNG!                 │
  │                  │                               │
  └──────────────────────────────────────────────────┘
  → Chỉ chiếm NỬA màn hình! Rất kỳ lạ!

  GIẢI PHÁP CỦA APPLE:
  → DPR = 2 → mỗi CSS pixel = 2×2 physical pixels
  → iPhone 4 phóng to hiển thị ở tầng OS
  → Website vẫn "nhìn thấy" 320px
  → Nhưng MỖI pixel được render bằng 4 physical pixels
  → Hình ảnh sắc nét hơn trên cùng kích thước vật lý!
```

---

## 3. Viewport Scale

### clientWidth thay đổi khi scale

```
VIEWPORT SCALE vs clientWidth:
═══════════════════════════════════════════════════════════════

  iPhone 4 (physical: 640px, DPR: 2):

  scale = 1.0 (mặc định):
  ┌──────────────────────────────────────┐
  │ clientWidth = 320px                  │
  │ 1rem = 320/10 = 32px                │
  │ Browser "nhìn thấy" 320 CSS pixels  │
  └──────────────────────────────────────┘

  scale = 0.5 (Flexible v0.3.2 set cho DPR=2):
  ┌──────────────────────────────────────┐
  │ clientWidth = 640px                  │
  │ 1rem = 640/10 = 64px                │
  │ Browser "nhìn thấy" 640 CSS pixels  │
  └──────────────────────────────────────┘

  KEY INSIGHT:
  → Dù scale thay đổi, rem LUÔN = clientWidth / 10
  → Layout TỈ LỆ không thay đổi!
  → Nhưng clientWidth LỚN HƠN → chi tiết hơn
  → Đặc biệt: giải quyết vấn đề 1px!
```

### Tại sao thay đổi viewport?

```
LỢI ÍCH CỦA SCALE = 1/DPR:
═══════════════════════════════════════════════════════════════

  scale = 1/dpr → clientWidth = physical width

  iPhone 4, DPR=2, scale=0.5:
  → clientWidth = 640px (= physical width)
  → 1 CSS pixel = 1 physical pixel
  → border: 1px = ĐÚNG 1 physical pixel!

  → Giải quyết "vấn đề 1px" trên Retina!
```

---

## 4. Vấn đề 1px

```
VẤN ĐỀ 1PX:
═══════════════════════════════════════════════════════════════

  CSS: border: 1px solid #000;

  Trên non-Retina (DPR=1):
  → 1px CSS = 1px physical → MỎNG, đẹp ✅

  Trên Retina (DPR=2):
  → 1px CSS = 2px physical → DÀY GẤP ĐÔI! ❌
  → Border trông thô, không giống design

  Trên DPR=3:
  → 1px CSS = 3px physical → DÀY GẤP BA! ❌❌

  VISUAL:
  DPR=1:  ─────────────── (1 physical pixel, đúng design)
  DPR=2:  ═══════════════ (2 physical pixels, quá dày!)
  DPR=3:  ≡≡≡≡≡≡≡≡≡≡≡≡≡≡ (3 physical pixels, rất dày!)
```

### Flexible v0.3.2 giải quyết

```
V0.3.2 — GIẢI QUYẾT 1PX:
═══════════════════════════════════════════════════════════════

  Cách: scale = 1/dpr
  → DPR=2: scale = 0.5 → 1 CSS px = 1 physical px
  → DPR=3: scale = 1/3 → 1 CSS px = 1 physical px

  ✅ Border 1px = ĐÚNG 1 physical pixel trên mọi device!
  ❌ Nhưng: BREAK CSS media queries!
     → @media (max-width: 320px) không match đúng
     → Vì clientWidth = 640px khi scale=0.5 trên iPhone 4
```

### Flexible v2.0 giải quyết

```
V2.0 — GIẢI QUYẾT 1PX KHÁC:
═══════════════════════════════════════════════════════════════

  Bỏ dynamic scale → giữ scale = 1.0
  Thay bằng: detect 0.5px support + class "hairlines"
```

```javascript
// Detect 0.5px support
if (dpr >= 2) {
  var fakeBody = document.createElement("body");
  var testElement = document.createElement("div");
  testElement.style.border = ".5px solid transparent";
  fakeBody.appendChild(testElement);
  docEl.appendChild(fakeBody);

  if (testElement.offsetHeight === 1) {
    // Browser hỗ trợ 0.5px!
    docEl.classList.add("hairlines");
  }
  docEl.removeChild(fakeBody);
}
```

```css
/* CSS sử dụng hairlines class */
.border-bottom {
  border-bottom: 1px solid #ccc;
}

/* Thiết bị hỗ trợ 0.5px → dùng 0.5px thay thế */
.hairlines .border-bottom {
  border-bottom: 0.5px solid #ccc;
}
```

---

## 5. Version 0.3.2 vs 2.0

### v0.3.2 — Dynamic Scale

```javascript
// v0.3.2 — Tính scale theo DPR (chỉ iOS)
var isAndroid = win.navigator.appVersion.match(/android/gi);
var isIPhone = win.navigator.appVersion.match(/iphone/gi);
var devicePixelRatio = win.devicePixelRatio;

if (isIPhone) {
  // iOS: DPR 2,3 → dùng scale phù hợp
  if (devicePixelRatio >= 3 && (!dpr || dpr >= 3)) {
    dpr = 3;
  } else if (devicePixelRatio >= 2 && (!dpr || dpr >= 2)) {
    dpr = 2;
  } else {
    dpr = 1;
  }
} else {
  // Android: luôn DPR = 1 (không hỗ trợ hi-res)
  dpr = 1;
}
scale = 1 / dpr;
```

### Comparison

```
V0.3.2 vs V2.0:
═══════════════════════════════════════════════════════════════

  ┌──────────────────┬──────────────────┬──────────────────┐
  │                  │ v0.3.2           │ v2.0             │
  ├──────────────────┼──────────────────┼──────────────────┤
  │ Scale            │ Dynamic (1/dpr)  │ Fixed (1.0)      │
  ├──────────────────┼──────────────────┼──────────────────┤
  │ 1px solution     │ Scale viewport   │ 0.5px detect +   │
  │                  │                  │ hairlines class  │
  ├──────────────────┼──────────────────┼──────────────────┤
  │ Android hi-res   │ ❌ Không hỗ trợ  │ ✅ hairlines     │
  │                  │ (luôn DPR=1)     │ (nếu browser OK) │
  ├──────────────────┼──────────────────┼──────────────────┤
  │ CSS media query  │ ❌ Bị break      │ ✅ Hoạt động đúng│
  ├──────────────────┼──────────────────┼──────────────────┤
  │ Complexity       │ Phức tạp hơn     │ Đơn giản hơn     │
  └──────────────────┴──────────────────┴──────────────────┘
```

---

## 6. Flexible vs VW — Hiện đại

```
FLEXIBLE vs VW UNITS:
═══════════════════════════════════════════════════════════════

  Flexible (2015):
  → Hack rem để mô phỏng vw
  → Cần JavaScript runtime (tính font-size)
  → Phụ thuộc script load order
  → Giải pháp tận dụng lúc vw chưa được support tốt

  VW Units (hiện đại, 2020+):
  → Native CSS, KHÔNG cần JavaScript!
  → 1vw = 1% viewport width
  → Browser support đã rất tốt (>97% global)
  → Performance tốt hơn (no JS calculation)

  SO SÁNH:
  ┌──────────────────┬──────────────────┬──────────────────┐
  │                  │ Flexible (rem)   │ VW Units         │
  ├──────────────────┼──────────────────┼──────────────────┤
  │ Cần JS?          │ ✅ YES           │ ❌ NO            │
  ├──────────────────┼──────────────────┼──────────────────┤
  │ Browser support  │ Mọi browser      │ >97% (2020+)    │
  ├──────────────────┼──────────────────┼──────────────────┤
  │ Performance      │ JS tính toán     │ Native CSS       │
  ├──────────────────┼──────────────────┼──────────────────┤
  │ FOUC risk        │ Có (JS chưa load)│ Không            │
  ├──────────────────┼──────────────────┼──────────────────┤
  │ 1px problem      │ scale/hairlines  │ Cần giải pháp    │
  │                  │                  │ riêng            │
  ├──────────────────┼──────────────────┼──────────────────┤
  │ Status           │ Legacy           │ Recommended      │
  └──────────────────┴──────────────────┴──────────────────┘
```

### VW + Rem kết hợp (hiện đại)

```css
/* Cách hiện đại: vw + rem kết hợp */
html {
  /* 750px design: 1rem = 100px trên design */
  /* 100px / 750px = 13.333vw */
  font-size: 13.333vw;
}

/* Giới hạn max/min width */
@media (min-width: 750px) {
  html {
    font-size: 100px;
  }
}
@media (max-width: 320px) {
  html {
    font-size: 42.667px;
  } /* 320 × 13.333% */
}

/* Element: design = 150px → 150/100 = 1.5rem */
.element {
  width: 1.5rem;
  height: 0.8rem;
  font-size: 0.28rem;
}

/* → Không cần JavaScript!
   → rem vẫn dùng cho conversion simplicity
   → vw drive html font-size → auto responsive */
```

---

## 7. Tóm Tắt

### Quick Reference

```
TAOBAO FLEXIBLE — QUICK REFERENCE:
═══════════════════════════════════════════════════════════════

  CORE FORMULA:
    1rem = clientWidth / 10
    html.style.fontSize = (clientWidth / 10) + 'px'

  WHY ÷10 (NOT ÷100)?
    ÷100 → font-size < 12px → browser block!
    320/12 = 26.67 max parts → chọn số tròn 10

  DPR:
    Device Pixel Ratio = physical pixels / CSS pixels
    iPhone 4: 640/320 = DPR 2
    1 CSS px = DPR² physical pixels

  VIEWPORT SCALE:
    v0.3.2: scale = 1/dpr → clientWidth = physical width
    v2.0:   scale = 1.0 (fixed) + hairlines detect

  1PX PROBLEM:
    DPR=2 → 1px CSS = 2px physical (quá dày!)
    Fix: scale=1/dpr HOẶC 0.5px detect

  DESIGN TO CODE:
    Design 750px → 1rem = 75px
    Element 150px → 150/75 = 2rem

  MODERN ALTERNATIVE:
    vw units (no JS needed, >97% support)
```

### Câu Hỏi Phỏng Vấn

**1. Flexible hoạt động thế nào? rem tính ra sao?**

> Flexible chia viewport thành **10 phần**, set `html font-size = clientWidth/10`. Mọi element dùng **rem** → tự scale theo device width. VD: iPhone 6 (375px) → 1rem = 37.5px; iPhone 4 (320px) → 1rem = 32px. Design 750px → 1rem = 75px → element 150px trên design = 150/75 = **2rem**. Trên mọi device, 2rem đều chiếm **20% width** → giữ đúng tỉ lệ.

**2. Tại sao chia 10 phần, không chia 100?**

> Chia 100 giống vw, nhưng iPhone 4 (320px) → 1rem = 3.2px. **Browser không hỗ trợ font-size < 12px** → tự round lên → layout vỡ. Tính: 320/12 = 26.67 max parts. Chọn **10** (số tròn, dễ tính) → 1rem = 32px ≥ 12px → browser render đúng.

**3. DPR là gì? Tại sao cần?**

> **DPR = physical pixels / CSS pixels**. iPhone 4: 640 physical / 320 CSS = DPR 2. Trước Retina, website 320px. Trên iPhone 4 (640px) nếu không có DPR → website chỉ chiếm nửa màn. Apple giải quyết: **DPR=2 → 1 CSS px = 2×2 physical pixels** → website vẫn "nhìn thấy" 320px nhưng render sắc nét hơn trên cùng kích thước vật lý.

**4. Vấn đề 1px là gì? Flexible giải quyết thế nào?**

> `border: 1px` trên Retina (DPR=2) → **2 physical pixels** → trông dày gấp đôi design. **v0.3.2**: set viewport `scale=1/dpr` → clientWidth = physical width → 1 CSS px = 1 physical px → border mỏng đúng. Nhược: break CSS media queries. **v2.0**: giữ scale=1.0, detect browser hỗ trợ **0.5px** → thêm class `hairlines` → CSS override `border: 0.5px`.

**5. Flexible vs vw — ngày nay nên dùng gì?**

> Flexible là **giải pháp thời kỳ vw chưa được support** (2015). Cần JS runtime, có risk FOUC (flash of unstyled content), phụ thuộc script load order. **vw hiện đại**: native CSS, không cần JS, >97% browser support, performance tốt hơn. Ngày nay **dùng vw** (hoặc vw + rem kết hợp). Flexible là **legacy** nhưng quan trọng để hiểu lịch sử mobile adaptation.

**6. Design 750px, element 200px → viết CSS thế nào?**

> Với Flexible: 1rem = 750/10 = 75px → element = 200/75 ≈ **2.667rem**. Với vw: element = 200/750 × 100 = **26.667vw**. Với vw+rem kết hợp: html font-size = 13.333vw (= 100px trên 750px design) → element = 200/100 = **2rem**.

---

## Checklist Học Tập

- [ ] Flexible: 1rem = clientWidth / 10
- [ ] Chia 10 vì chia 100 → font-size < 12px → browser block
- [ ] DPR = physical pixels / CSS pixels
- [ ] iPhone 4: 640 physical, 320 CSS, DPR = 2
- [ ] 1 CSS pixel = DPR × DPR physical pixels
- [ ] Viewport scale = 1/dpr → clientWidth = physical width
- [ ] 1px problem: DPR=2 → 1px CSS = 2px physical (quá dày)
- [ ] v0.3.2: dynamic scale (1/dpr) → fix 1px, break media queries
- [ ] v2.0: fixed scale (1.0) + 0.5px detect + hairlines class
- [ ] Design to code: element px / (designWidth/10) = rem value
- [ ] Modern: dùng vw units (no JS, >97% support)
- [ ] vw + rem kết hợp: html font-size dùng vw, elements dùng rem

---

_Cập nhật lần cuối: Tháng 2, 2026_
