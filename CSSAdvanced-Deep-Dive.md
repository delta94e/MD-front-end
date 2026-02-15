# CSS Advanced — Q91–Q100 — Deep Dive

> 📅 2026-02-12 · ⏱ 14 phút đọc
>
> Tổng hợp Q91–Q100: Hide elements (8 cách), BFC,
> browser compat, overflow, position+display+float,
> reflow vs repaint, px/em/rem.
> Độ khó: ⭐️⭐️⭐️⭐️ | Chủ đề: CSS / Rendering / Layout

---

## Mục Lục

0. [Hide Elements — 8 Ways (Q91)](#q91)
1. [BFC — Block Formatting Context (Q92)](#q92)
2. [Browser Compatibility (Q93)](#q93)
3. [Chrome < 12px Text (Q94)](#q94)
4. [LVHA Order (Q95)](#q95)
5. [overflow Property (Q96)](#q96)
6. [CSS Import Methods (Q97)](#q97)
7. [position + display + float (Q98)](#q98)
8. [Reflow vs Repaint (Q99)](#q99)
9. [px vs em vs rem (Q100)](#q100)
10. [Tóm Tắt & Checklist](#tóm-tắt)

---

## Q91. Hide Elements — 8 Ways

```
8 CÁCH ẨN ELEMENT:
═══════════════════════════════════════════════════════════════

  ┌─────────────────────┬────────┬────────┬────────┬─────────┐
  │ Method              │Keep    │ Click- │ Transi-│ Trigger │
  │                     │Space?  │ able?  │ tion?  │ Reflow? │
  ├─────────────────────┼────────┼────────┼────────┼─────────┤
  │ display: none       │ ❌     │ ❌     │ ❌     │ ✅ YES  │
  │ visibility: hidden  │ ✅     │ ❌     │ ✅     │ ❌ NO   │
  │ opacity: 0          │ ✅     │ ✅ ⚠️  │ ✅     │ ❌ NO   │
  │ position: absolute  │ ❌     │ ❌     │ ❌     │ ✅ YES  │
  │ + left: -9999px     │        │        │        │         │
  │ transform: scale(0) │ ✅     │ ❌     │ ✅     │ ❌ NO   │
  │ hidden attribute    │ ❌     │ ❌     │ ❌     │ ✅ YES  │
  │ height: 0 +         │ ❌     │ ❌     │ ✅     │ ✅ YES  │
  │ overflow: hidden    │        │        │        │         │
  │ filter: blur(999px) │ ✅     │ ✅ ⚠️  │ ✅     │ ❌ NO   │
  └─────────────────────┴────────┴────────┴────────┴─────────┘
```

```css
/* ① display: none — HOÀN TOÀN biến mất, không chiếm space */
.hidden-1 {
  display: none;
}

/* ② visibility: hidden — Ẩn nhưng VẪN chiếm space */
.hidden-2 {
  visibility: hidden;
}

/* ③ opacity: 0 — Trong suốt, VẪN chiếm space + VẪN clickable! */
.hidden-3 {
  opacity: 0;
}

/* ④ position off-screen */
.hidden-4 {
  position: absolute;
  left: -9999px;
}

/* ⑤ transform: scale(0) — Thu nhỏ = 0, VẪN chiếm space */
.hidden-5 {
  transform: scale(0);
}

/* ⑥ HTML5 hidden attribute — Giống display: none */
/* <div hidden="hidden">hidden</div> */

/* ⑦ height: 0 + overflow: hidden */
.hidden-7 {
  height: 0;
  overflow: hidden;
  border: none;
}

/* ⑧ filter: blur — Siêu mờ = mất hẳn */
.hidden-8 {
  filter: blur(999px);
}
```

```
CHỌN CÁCH NÀO?
═══════════════════════════════════════════════════════════════

  → Ẩn hẳn (DOM event cũng mất): display: none
  → Ẩn nhưng giữ layout space: visibility: hidden
  → Ẩn + transition animation: opacity: 0 (fade out)
  → Accessibility (screen reader): visibility: hidden
     hoặc aria-hidden="true" (KHÔNG dùng display:none)
```

---

## Q92. BFC — Block Formatting Context

```
BFC = "KHU VỰC CÁCH LY" cho layout:
═══════════════════════════════════════════════════════════════

  BFC = independent rendering context
  → Elements BÊN TRONG BFC không ảnh hưởng BÊN NGOÀI
  → Giải quyết: margin collapse, float clearfix, overlap

  6 QUY TẮC BFC:
  ① Internal boxes xếp VERTICAL (top→bottom)
  ② Vertical margin giữa 2 box cùng BFC → COLLAPSE
  ③ Margin-left của mỗi element = border-left của container
  ④ BFC KHÔNG overlap với float box
  ⑤ BFC = isolated container
  ⑥ Tính height BFC → FLOAT elements tham gia! (clearfix!)
```

### Cách tạo BFC

```
TRIGGER BFC:
═══════════════════════════════════════════════════════════════

  ┌──────────────────────────────────┬───────────────────────┐
  │ Root element                     │ <html>                │
  │ float                            │ ≠ none                │
  │ overflow                         │ ≠ visible (auto/hidden)│
  │ display                          │ inline-block          │
  │                                  │ table-cell            │
  │                                  │ table-caption         │
  │                                  │ flex / grid (2024+)   │
  │ position                         │ absolute / fixed      │
  └──────────────────────────────────┴───────────────────────┘
```

### BFC Use Cases

```
BFC — 3 USE CASES:
═══════════════════════════════════════════════════════════════

  ① CHỐNG MARGIN COLLAPSE:
  → 2 siblings cùng BFC → margin collapse
  → Bọc 1 trong 2 vào DIV với overflow: hidden (tạo BFC mới)
  → 2 KHÁC BFC → KHÔNG collapse!

  <div style="overflow: hidden"> ← BFC mới
      <p style="margin-bottom: 20px">A</p>
  </div>
  <p style="margin-top: 30px">B</p>
  → 20px + 30px = 50px (KHÔNG collapse)

  ② CLEARFIX (bao bọc float children):
  → Float child → parent height = 0 (collapsed!)
  → Parent overflow: hidden → parent thành BFC
  → BFC tính height = bao gồm float → FIXED!

  .parent { overflow: hidden; } /* hoặc display: flow-root */

  ③ CHỐNG FLOAT OVERLAP:
  → Float element overlap non-float sibling
  → Sibling overflow: hidden → tạo BFC → KHÔNG overlap!
```

---

## Q93. Browser Compatibility

```
BROWSER COMPAT — COMMON ISSUES:
═══════════════════════════════════════════════════════════════

  ① PNG24 transparency broken in IE
  → Giải pháp: Dùng PNG8

  ② Default margin/padding khác nhau giữa các browser
  → Giải pháp: CSS Reset * { margin: 0; padding: 0; }
  → Hoặc dùng normalize.css

  ③ IE custom attributes: el.prop hoặc el.getAttribute()
     Firefox: CHỈ el.getAttribute()
  → Giải pháp: Luôn dùng getAttribute() cho custom attrs

  ④ IE event: event.x, event.y (KHÔNG có pageX, pageY)
     Firefox: event.pageX, event.pageY (KHÔNG có x, y)
  → Giải pháp:
     const mx = event.x ?? event.pageX;
     const my = event.y ?? event.pageY;

  MODERN APPROACH (2024+):
  → Dùng autoprefixer (PostCSS) cho vendor prefixes
  → Dùng @supports cho feature detection
  → Dùng Polyfill cho missing APIs
  → Testing: BrowserStack, Sauce Labs
```

---

## Q94. Chrome < 12px Text

```
CHROME MIN FONT-SIZE = 12px:
═══════════════════════════════════════════════════════════════

  Problem: Chrome enforce minimum font-size: 12px
  → font-size: 10px → vẫn hiện 12px!

  Solution: transform: scale()
```

```css
.small-text {
  font-size: 12px; /* Base size */
  -webkit-transform: scale(0.8); /* 12 × 0.8 = 9.6px visual */
  transform: scale(0.8);
  display: inline-block; /* scale cần block/inline-block */
  transform-origin: left top; /* Giữ vị trí gốc */
}
```

```
⚠️ LƯU Ý:
→ scale() chỉ thay đổi VISUAL size, KHÔNG thay đổi layout
→ Element vẫn chiếm space 12px trong flow
→ Cần inline-block hoặc block để transform hoạt động
```

---

## Q95. LVHA — Link Pseudo-class Order

```
LVHA ORDER — "LoVe HAte":
═══════════════════════════════════════════════════════════════

  a:link      → Chưa visited (L)
  a:visited   → Đã visited (V)
  a:hover     → Mouse hover (H)
  a:active    → Đang click (A)

  MNemonic: "LOVE HATE" → L-V-H-A

  TẠI SAO ORDER QUAN TRỌNG?
  → CSS specificity: cùng specificity → last wins!
  → Nếu :hover SAU :visited → hover ghi đè visited ✅
  → Nếu :hover TRƯỚC :visited → visited ghi đè hover ❌

  a:link    { color: blue; }
  a:visited { color: purple; }
  a:hover   { color: red; }      /* Phải SAU visited */
  a:active  { color: orange; }   /* Phải SAU hover */
```

---

## Q96. overflow Property

```
OVERFLOW VALUES:
═══════════════════════════════════════════════════════════════

  ┌──────────────┬────────────────────────────────────────────┐
  │ visible      │ DEFAULT — nội dung tràn ra NGOÀI element  │
  │              │ Không clip, không scroll                   │
  ├──────────────┼────────────────────────────────────────────┤
  │ hidden       │ CẮT nội dung tràn — không scroll bar     │
  │              │ Tạo BFC!                                   │
  ├──────────────┼────────────────────────────────────────────┤
  │ scroll       │ LUÔN hiện scroll bars (dù content fit)     │
  │              │ Cả horizontal + vertical                   │
  ├──────────────┼────────────────────────────────────────────┤
  │ auto         │ Scroll bars CHỈ KHI content overflow       │
  │              │ Thường dùng nhất ⭐                         │
  └──────────────┴────────────────────────────────────────────┘

  overflow-x / overflow-y: Control từng chiều riêng
  → overflow-x: auto; overflow-y: hidden;
```

---

## Q97. CSS Import Methods

```
3 CÁCH IMPORT CSS:
═══════════════════════════════════════════════════════════════

  ┌──────────┬──────────────────────┬──────────────────────────┐
  │ Method   │ ƯU ĐIỂM              │ NHƯỢC ĐIỂM               │
  ├──────────┼──────────────────────┼──────────────────────────┤
  │ Inline   │ Specificity cao nhất │ KHÔNG tách structure/style│
  │ style="" │ Nhanh (no HTTP req)  │ Khó maintain, duplicate  │
  ├──────────┼──────────────────────┼──────────────────────────┤
  │ Internal │ Tách khỏi HTML tags  │ Chưa hoàn toàn tách      │
  │ <style>  │ Reusable trong page  │ Không cache riêng        │
  ├──────────┼──────────────────────┼──────────────────────────┤
  │ External │ ✅ Hoàn toàn tách    │ Extra HTTP request        │
  │ <link>   │ ✅ Browser cache     │ Phải link/import để dùng │
  │          │ ✅ Multi-page reuse  │                          │
  └──────────┴──────────────────────┴──────────────────────────┘

  RECOMMEND: External <link> (production) > Internal (prototyping)
             Inline chỉ dùng cho dynamic style (JS)
```

---

## Q98. position + display + float

```
POSITION + DISPLAY + FLOAT — ĐỘ ƯU TIÊN:
═══════════════════════════════════════════════════════════════

  3 properties có thể CONFLICT khi dùng cùng lúc:
  → display: kiểu box (block, inline, flex...)
  → position: vị trí (static, absolute, fixed...)
  → float: hướng float (left, right, none)

  QUY TẮC ƯU TIÊN:

  ① position: absolute / fixed
     → ƯU TIÊN CAO NHẤT!
     → float tự động = none (bị vô hiệu!)
     → display tự chuyển thành block (hoặc table)
     → Element thoát khỏi flow

  ② float: left / right
     → float + inline element → display auto = block!
     → float + inline-block → vẫn block

  ③ display: normal flow
     → Chỉ hoạt động khi KHÔNG có absolute/fixed/float

  TÓM TẮT:
  position(absolute/fixed) > float > display

  Nếu absolute/fixed → float bị ignore, display → block
  Nếu float → display → block (inline → block auto)
```

---

## Q99. Reflow vs Repaint

```
REFLOW (回流/重排) vs REPAINT (重绘):
═══════════════════════════════════════════════════════════════

  REFLOW (Layout):
  → Tính lại KÍCH THƯỚC + VỊ TRÍ của elements
  → Expensive! Ảnh hưởng TOÀN BỘ layout
  → Triggers:
     • Thêm/xóa visible DOM elements
     • Thay đổi position, size, margin, padding, border
     • Thay đổi window size (resize)
     • Thay đổi font size
     • Thay đổi content (text, image dimensions)
     • Query: offsetWidth, scrollTop, getComputedStyle()

  REPAINT (Paint):
  → Vẽ lại NGOẠI HÌNH (color, background, shadow, visibility)
  → KHÔNG thay đổi layout → nhanh hơn reflow
  → Triggers:
     • color, background-color, border-color
     • visibility, box-shadow, border-radius
     • outline, text-decoration

  ⚠️ REFLOW LUÔN kéo theo REPAINT!
  ⚠️ REPAINT KHÔNG kéo theo REFLOW!

  REFLOW → REPAINT (always)
  REPAINT → ❌ REFLOW (never)
```

### Tối ưu Reflow/Repaint

```
OPTIMIZATION — GIẢM REFLOW:
═══════════════════════════════════════════════════════════════

  ① BATCH DOM changes:
  → TRÁNH: el.style.width = '100px'; el.style.height = '50px';
  → NÊN: el.className = 'newClass'; (1 reflow thay 2)

  ② DocumentFragment:
  → Thay đổi off-DOM → insert 1 lần

  ③ TRÁNH query layout properties liên tục:
  → TRÁNH: for (...) { el.offsetWidth; el.style.left = ... }
  → NÊN: cache offsetWidth TRƯỚC loop

  ④ position: absolute/fixed cho animations:
  → Thoát flow → reflow KHÔNG ảnh hưởng siblings

  ⑤ will-change / transform cho animations:
  → GPU composite layer → KHÔNG trigger reflow!
  → transform: translateX() thay left: Xpx

  ⑥ display: none → change → display: block:
  → Hidden element reflow = FREE (0 cost)
```

---

## Q100. px vs em vs rem

```
px vs em vs rem:
═══════════════════════════════════════════════════════════════

  ┌──────┬──────────────┬──────────────────┬──────────────────┐
  │ Unit │ Reference    │ Calculation      │ Use case         │
  ├──────┼──────────────┼──────────────────┼──────────────────┤
  │ px   │ Screen pixel │ Fixed, absolute  │ Borders, shadows │
  │      │              │ 16px = 16px      │ fixed layout     │
  ├──────┼──────────────┼──────────────────┼──────────────────┤
  │ em   │ PARENT font  │ Parent 16px      │ Component-level  │
  │      │              │ 1.5em = 24px     │ relative sizing  │
  │      │              │ ⚠️ Cascading!    │ padding, margin  │
  ├──────┼──────────────┼──────────────────┼──────────────────┤
  │ rem  │ ROOT (<html>)│ Root 16px        │ Responsive layout│
  │      │              │ 1.5rem = 24px    │ Global scaling ⭐ │
  │      │              │ ✅ Predictable   │ font-size, width │
  └──────┴──────────────┴──────────────────┴──────────────────┘

  em PROBLEM — CASCADING:
  html { font-size: 16px; }
  .parent { font-size: 1.5em; }     /* 16 × 1.5 = 24px */
  .child  { font-size: 1.5em; }     /* 24 × 1.5 = 36px! (not 24!) */
  .grand  { font-size: 1.5em; }     /* 36 × 1.5 = 54px!! */
  → em tích lũy qua mỗi level → KHÓ dự đoán!

  rem SOLUTION — LUÔN tham chiếu ROOT:
  html { font-size: 16px; }
  .parent { font-size: 1.5rem; }    /* 16 × 1.5 = 24px */
  .child  { font-size: 1.5rem; }    /* 16 × 1.5 = 24px ✅ */
  .grand  { font-size: 1.5rem; }    /* 16 × 1.5 = 24px ✅ */
  → rem = predictable + consistent!
```

```
MODERN UNITS (bonus):
═══════════════════════════════════════════════════════════════

  ┌──────┬──────────────────────────────────────────────────┐
  │ vw   │ 1% of viewport WIDTH (100vw = full width)      │
  │ vh   │ 1% of viewport HEIGHT (100vh = full height)    │
  │ vmin │ 1% of smaller dimension                         │
  │ vmax │ 1% of larger dimension                          │
  │ %    │ Relative to parent element                      │
  │ ch   │ Width of '0' character in current font          │
  │ lh   │ Line-height of element                          │
  └──────┴──────────────────────────────────────────────────┘

  CHỌN UNIT NÀO?
  → Fixed elements (border, shadow): px
  → Responsive font/layout: rem ⭐
  → Component-relative spacing: em
  → Viewport-based layout: vw/vh
  → Typography width: ch (e.g. max-width: 60ch)
```

---

## Tóm Tắt

### Quick Reference

```
Q91-Q100 — QUICK REF:
═══════════════════════════════════════════════════════════════

  HIDE ELEMENTS:
  → display:none (mất hẳn) vs visibility:hidden (giữ space)
  → opacity:0 (giữ space + VẪN clickable!)
  → transform:scale(0) (giữ space, animation OK)

  BFC:
  → Trigger: overflow≠visible, float≠none, position:absolute/fixed,
     display:inline-block/flex/grid
  → Use: chống margin collapse, clearfix float, chống overlap

  BROWSER COMPAT: CSS reset, getAttribute(), event.x ?? event.pageX

  LVHA: Link → Visited → Hover → Active ("LOVE HATE")

  OVERFLOW: visible(tràn) / hidden(cắt+BFC) / scroll(luôn) / auto(khi cần)

  CSS IMPORT: external <link> ⭐ > internal <style> > inline style=""

  PRIORITY: position(abs/fixed) > float > display
  → abs/fixed → float=none, display→block

  REFLOW vs REPAINT:
  → Reflow: size+position change → expensive (layout)
  → Repaint: color+style change → cheaper (paint only)
  → Reflow → LUÔN kéo theo Repaint (nhưng ngược lại KHÔNG)
  → Optimize: batch DOM, DocumentFragment, cache layout props,
     transform thay left/top, will-change

  UNITS:
  → px: fixed | em: parent (cascading!) | rem: root (predictable ⭐)
  → vw/vh: viewport | ch: character width
```

### Checklist

- [ ] 8 cách hide element: display:none, visibility, opacity, position, scale, hidden, height:0, blur
- [ ] display:none (no space, no events) vs visibility:hidden (space, no events) vs opacity:0 (space + events!)
- [ ] BFC triggers: overflow≠visible, float≠none, absolute/fixed, inline-block/flex/grid
- [ ] BFC use: margin collapse fix, float clearfix, overlap prevention
- [ ] Browser compat: CSS reset, getAttribute(), feature detection
- [ ] Chrome <12px: transform:scale() + display:inline-block
- [ ] LVHA order: Link→Visited→Hover→Active ("LOVE HATE")
- [ ] overflow: visible(default) / hidden(clip+BFC) / scroll(always) / auto(when needed)
- [ ] CSS import priority: external link (best) > internal style > inline
- [ ] position(abs/fixed) overrides float → none, display → block
- [ ] Reflow = size+position (expensive) → always triggers Repaint
- [ ] Repaint = visual only (color, bg) → NEVER triggers Reflow
- [ ] Reflow optimize: batch, fragment, cache, transform, will-change
- [ ] px (fixed) vs em (parent, cascading!) vs rem (root, predictable ⭐)
- [ ] Modern units: vw/vh (viewport), ch (char width), % (parent)

---

_Cập nhật lần cuối: Tháng 2, 2026_
