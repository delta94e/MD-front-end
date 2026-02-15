# Reflow & Redraw (Repaint) — Deep Dive

> 📅 2026-02-11 · ⏱ 15 phút đọc
>
> Tài liệu chuyên sâu về Reflow & Redraw: Khái niệm,
> điều kiện trigger, phạm vi ảnh hưởng (Global/Local),
> 8 biện pháp tối ưu, Rendering Queue, Animation optimization,
> DocumentFragment, và code examples.
> Độ khó: ⭐️⭐️⭐️⭐️⭐️ | Chủ đề: Browser Rendering & Performance

---

## Mục Lục

0. [Reflow & Redraw — Khái niệm](#0-reflow--redraw--khái-niệm)
1. [Điều kiện trigger Reflow vs Redraw](#1-điều-kiện-trigger-reflow-vs-redraw)
2. [Cách tránh Reflow & Redraw](#2-cách-tránh-reflow--redraw)
3. [Rendering Queue — Browser Optimization](#3-rendering-queue--browser-optimization)
4. [Tối ưu Animation](#4-tối-ưu-animation)
5. [DocumentFragment](#5-documentfragment)
6. [Tóm Tắt & Câu Hỏi Phỏng Vấn](#6-tóm-tắt--câu-hỏi-phỏng-vấn)

---

## 0. Reflow & Redraw — Khái niệm

> **🎯 Reflow = tính lại LAYOUT; Redraw = vẽ lại STYLE (không layout)**

```
REFLOW (Reflux / Layout):
═══════════════════════════════════════════════════════════════

  Khi SIZE, STRUCTURE hoặc PROPERTIES của 1 phần / toàn bộ
  elements trong Render Tree THAY ĐỔI → browser RE-RENDER
  1 phần hoặc toàn bộ document → gọi là REFLOW

  → Tính toán lại GEOMETRY (vị trí, kích thước) các elements
  → ẢNH HƯỞNG layout xung quanh (do fluid layout)

  PHẠM VI ẢNH HƯỞNG:
  ┌──────────────────────────────────────────────────────────┐
  │ ① GLOBAL SCOPE:                                         │
  │ → Bắt đầu từ ROOT NODE                                 │
  │ → TOÀN BỘ render tree bị rearrange                     │
  │ → VD: thay đổi font-size trên <html>                   │
  │                                                          │
  │ ② LOCAL SCOPE:                                           │
  │ → Chỉ rearrange 1 PHẦN render tree                     │
  │ → VD: element có vị trí absolute/fixed                  │
  │ → Ít tốn kém hơn                                        │
  └──────────────────────────────────────────────────────────┘
```

```
REDRAW (Repaint):
═══════════════════════════════════════════════════════════════

  Khi STYLE (appearance) của element thay đổi
  NHƯNG KHÔNG ảnh hưởng POSITION trong document flow
  → Browser VẼ LẠI element → gọi là REDRAW

  → Chỉ thay đổi VISUAL (màu sắc, viền, shadow...)
  → KHÔNG tính toán lại geometry/layout
  → Nhẹ hơn reflow
```

```
MỐI QUAN HỆ:
═══════════════════════════════════════════════════════════════

  ⚠️ QUY TẮC QUAN TRỌNG:

  ┌───────────────────────────────────────┐
  │ REFLOW → LUÔN trigger REDRAW         │
  │ REDRAW → KHÔNG NHẤT THIẾT → REFLOW   │
  └───────────────────────────────────────┘

  Reflow > Redraw (về chi phí performance)

  ┌─────────┐   luôn    ┌─────────┐
  │ REFLOW  │──────────►│ REDRAW  │
  │ (layout)│  trigger  │ (paint) │
  └─────────┘           └─────────┘
       ↑                      │
       │    KHÔNG nhất thiết  │
       └──────────── ✗ ───────┘
```

---

## 1. Điều kiện trigger Reflow vs Redraw

### Reflow Triggers (8 loại)

```
REFLOW TRIGGERS:
═══════════════════════════════════════════════════════════════

  ① FIRST RENDER — Rendering trang lần đầu

  ② WINDOW RESIZE — Thay đổi kích thước window
     → window.resize event

  ③ ELEMENT CONTENT CHANGES — Nội dung element thay đổi
     → Text, images, form fields...

  ④ ELEMENT SIZE/POSITION CHANGES
     → width, height, margin, padding, border
     → top, left, right, bottom (positioned elements)

  ⑤ FONT SIZE CHANGES
     → font-size, font-family, line-height thay đổi

  ⑥ ACTIVATE CSS PSEUDO-CLASSES
     → :hover, :focus, :active...

  ⑦ QUERY PROPERTIES / CALL METHODS
     → offsetTop, offsetLeft, offsetWidth, scrollTop
     → getComputedStyle(), getBoundingClientRect()
     → (Browser buộc phải reflow để trả giá trị chính xác)

  ⑧ ADD/REMOVE VISIBLE DOM ELEMENTS
     → appendChild(), removeChild(), insertBefore()
     → display: none ↔ block
```

### Redraw Triggers

```
REDRAW TRIGGERS (KHÔNG ảnh hưởng layout):
═══════════════════════════════════════════════════════════════

  → Chỉ thay đổi APPEARANCE, không thay đổi GEOMETRY

  ┌────────────────────────┬────────────────────────────────┐
  │ Thuộc tính             │ Mô tả                          │
  ├────────────────────────┼────────────────────────────────┤
  │ background-color       │ Màu nền                        │
  │ background-image       │ Hình nền                       │
  │ color                  │ Màu chữ                        │
  │ outline-color          │ Màu outline                    │
  │ outline-width          │ Độ rộng outline                │
  │ text-decoration        │ Trang trí text                 │
  │ border-radius          │ Bo góc                         │
  │ visibility             │ Hiển thị (vẫn giữ space)      │
  │ box-shadow             │ Đổ bóng                       │
  │ opacity                │ Độ trong suốt                  │
  └────────────────────────┴────────────────────────────────┘

  ⚠️ LƯU Ý:
  → visibility: hidden → REDRAW (vẫn giữ space)
  → display: none → REFLOW (mất space, layout thay đổi)
```

```
SO SÁNH REFLOW vs REDRAW:
═══════════════════════════════════════════════════════════════

  ┌──────────────────┬──────────────────┬────────────────────┐
  │                  │ REFLOW           │ REDRAW             │
  ├──────────────────┼──────────────────┼────────────────────┤
  │ Thay đổi         │ Size/Position/   │ Color/Background/  │
  │                  │ Structure        │ Shadow/Visibility  │
  ├──────────────────┼──────────────────┼────────────────────┤
  │ Ảnh hưởng        │ LAYOUT (geometry)│ APPEARANCE (visual)│
  ├──────────────────┼──────────────────┼────────────────────┤
  │ Tính toán lại    │ CÓ (position,    │ KHÔNG              │
  │                  │ size tất cả)     │                    │
  ├──────────────────┼──────────────────┼────────────────────┤
  │ Chi phí          │ CAO ❌           │ THẤP hơn ✅       │
  ├──────────────────┼──────────────────┼────────────────────┤
  │ Trigger redraw?  │ LUÔN LUÔN ✅     │ —                  │
  ├──────────────────┼──────────────────┼────────────────────┤
  │ Trigger reflow?  │ —                │ KHÔNG ❌           │
  └──────────────────┴──────────────────┴────────────────────┘
```

---

## 2. Cách tránh Reflow & Redraw

> **🎯 8 biện pháp giảm reflow + redraw**

```
8 BIỆN PHÁP TỐI ƯU:
═══════════════════════════════════════════════════════════════

  ① DOM THẤP NHẤT CÓ THỂ:
  ┌──────────────────────────────────────────────────────────┐
  │ Thao tác trên DOM nodes CẤP THẤP nhất                  │
  │ → Giảm phạm vi ảnh hưởng (local scope)                │
  │ → VD: thay đổi <span> thay vì <div> cha               │
  └──────────────────────────────────────────────────────────┘

  ② TRÁNH table LAYOUT:
  ┌──────────────────────────────────────────────────────────┐
  │ <table> layout: 1 thay đổi NHỎ → rearrange TOÀN BỘ   │
  │ → Dùng flexbox / grid thay thế                         │
  └──────────────────────────────────────────────────────────┘

  ③ TRÁNH CSS EXPRESSION:
  ┌──────────────────────────────────────────────────────────┐
  │ CSS expressions bị đánh giá lại LIÊN TỤC               │
  │ → Gây reflow không cần thiết                            │
  └──────────────────────────────────────────────────────────┘

  ④ MODIFY CLASS, KHÔNG MODIFY STYLE:
  ┌──────────────────────────────────────────────────────────┐
  │ Tránh thay đổi style property NHIỀU LẦN                │
  │ → Gộp tất cả thay đổi vào 1 CLASS → toggle class      │
  └──────────────────────────────────────────────────────────┘

  ⑤ DÙNG absolute / fixed:
  ┌──────────────────────────────────────────────────────────┐
  │ Element đưa ra KHỎI document flow                       │
  │ → Thay đổi KHÔNG ẢNH HƯỞNG elements khác              │
  │ → Reflow chỉ ở LOCAL SCOPE                             │
  └──────────────────────────────────────────────────────────┘

  ⑥ DÙNG documentFragment:
  ┌──────────────────────────────────────────────────────────┐
  │ Tạo fragment → thao tác DOM trên fragment               │
  │ → Cuối cùng APPEND fragment vào document 1 lần         │
  │ → Thay vì append từng element → nhiều reflow           │
  └──────────────────────────────────────────────────────────┘

  ⑦ DÙNG display: none:
  ┌──────────────────────────────────────────────────────────┐
  │ Set display: none → thao tác DOM → set display: block  │
  │ → Thao tác trên element "ẩn" KHÔNG trigger reflow     │
  │ → Chỉ trigger 2 lần (ẩn + hiện)                       │
  └──────────────────────────────────────────────────────────┘

  ⑧ BATCH READ/WRITE OPERATIONS:
  ┌──────────────────────────────────────────────────────────┐
  │ KHÔNG xen kẽ read + write                               │
  │ → Gộp NHIỀU reads → rồi gộp NHIỀU writes              │
  │ → Tận dụng RENDERING QUEUE mechanism                   │
  └──────────────────────────────────────────────────────────┘
```

### Code Examples

```javascript
// ===== ④ Modify CLASS thay vì STYLE =====

// ❌ BAD: nhiều style changes → nhiều reflow
element.style.width = "100px";
element.style.height = "100px";
element.style.margin = "10px";
element.style.padding = "5px";

// ✅ GOOD: 1 class toggle → 1 reflow
// CSS: .new-style { width:100px; height:100px; margin:10px; padding:5px; }
element.className = "new-style";
// hoặc
element.classList.add("new-style");
```

```javascript
// ===== ⑥ documentFragment =====

// ❌ BAD: 1000 lần reflow
for (let i = 0; i < 1000; i++) {
  let li = document.createElement("li");
  li.textContent = `Item ${i}`;
  list.appendChild(li); // reflow MỖI LẦN!
}

// ✅ GOOD: 1 lần reflow
const fragment = document.createDocumentFragment();
for (let i = 0; i < 1000; i++) {
  let li = document.createElement("li");
  li.textContent = `Item ${i}`;
  fragment.appendChild(li); // KHÔNG reflow (fragment)
}
list.appendChild(fragment); // 1 lần reflow duy nhất!
```

```javascript
// ===== ⑦ display: none trick =====

// ❌ BAD: mỗi thay đổi → reflow
element.style.width = "100px";
element.style.height = "200px";
element.style.border = "1px solid red";

// ✅ GOOD: 2 lần reflow (ẩn + hiện)
element.style.display = "none"; // reflow 1
element.style.width = "100px"; // KHÔNG reflow
element.style.height = "200px"; // KHÔNG reflow
element.style.border = "1px solid red"; // KHÔNG reflow
element.style.display = "block"; // reflow 2
```

```javascript
// ===== ⑧ Batch read/write =====

// ❌ BAD: xen kẽ read/write → flush rendering queue mỗi lần
let h1 = el1.offsetHeight; // read → flush
el1.style.height = h1 + 10 + "px"; // write
let h2 = el2.offsetHeight; // read → flush (reflow!)
el2.style.height = h2 + 10 + "px"; // write

// ✅ GOOD: batch reads → batch writes
let h1 = el1.offsetHeight; // read
let h2 = el2.offsetHeight; // read (cùng batch)
el1.style.height = h1 + 10 + "px"; // write
el2.style.height = h2 + 10 + "px"; // write (cùng batch)
```

---

## 3. Rendering Queue — Browser Optimization

> **🎯 Browser tự gộp nhiều reflows → 1 reflow duy nhất**

```
RENDERING QUEUE:
═══════════════════════════════════════════════════════════════

  Browser tự tối ưu reflow + redraw bằng RENDERING QUEUE

  ┌──────────────────────────────────────────────────────────┐
  │ Browser đặt TẤT CẢ reflow/redraw operations vào QUEUE │
  │                                                          │
  │ Khi 1 trong 2 điều kiện sau đạt:                        │
  │ → Queue đạt đến SỐ LƯỢNG nhất định                    │
  │ → Đạt KHOẢNG THỜI GIAN nhất định                      │
  │                                                          │
  │ → Browser BATCH PROCESS toàn bộ queue                   │
  │ → NHIỀU reflows/redraws → 1 reflow/redraw duy nhất    │
  └──────────────────────────────────────────────────────────┘

  FLOW:
  ┌──────┐  ┌──────┐  ┌──────┐  ┌──────┐
  │ Op 1 │→│ Op 2 │→│ Op 3 │→│ Op 4 │→  ... queue
  └──────┘  └──────┘  └──────┘  └──────┘
                                     │
                              đủ số lượng/thời gian
                                     │
                                     ▼
                              ┌────────────┐
                              │ BATCH      │ → 1 reflow
                              │ PROCESS    │   duy nhất!
                              └────────────┘

  ⚠️ NHƯNG: Khi bạn READ layout properties
  (offsetTop, scrollTop, getComputedStyle()...)
  → Browser BUỘC FLUSH QUEUE ngay lập tức
  → Để trả giá trị CHÍNH XÁC
  → Gây reflow KHÔNG MONG MUỐN!

  ┌──────┐  ┌──────┐  ┌──────────┐
  │ Op 1 │→│ Op 2 │→│ READ     │→ FLUSH! → reflow ngay
  └──────┘  └──────┘  │offsetTop │
                       └──────────┘

  → Đây là lý do phải BATCH reads và writes riêng biệt!
```

---

## 4. Tối ưu Animation

> **🎯 Dùng absolute/fixed để tách animation khỏi document flow**

```
ANIMATION OPTIMIZATION:
═══════════════════════════════════════════════════════════════

  VẤN ĐỀ:
  → Animation thường thao tác DOM LIÊN TỤC (60fps = 60 lần/s)
  → Mỗi frame → reflow → performance issue

  GIẢI PHÁP: Dùng position: absolute hoặc fixed
  ┌──────────────────────────────────────────────────────────┐
  │ Element ra KHỎI document flow                           │
  │ → Reflow chỉ ảnh hưởng CHÍNH element đó               │
  │ → KHÔNG gây rearrange toàn bộ page                     │
  │ → Local scope reflow thay vì global scope               │
  └──────────────────────────────────────────────────────────┘
```

```css
/* ❌ BAD: animation trên element TRONG document flow */
.animated-element {
  position: relative; /* vẫn trong flow */
  animation: slide 1s infinite;
}
/* → Mỗi frame animation → reflow TOÀN BỘ page! */

/* ✅ GOOD: đưa ra khỏi document flow */
.animated-element {
  position: absolute; /* ra khỏi flow */
  /* hoặc: position: fixed; */
  animation: slide 1s infinite;
}
/* → Reflow chỉ ảnh hưởng element này */
```

```
CÁC KỸ THUẬT TỐI ƯU ANIMATION KHÁC:
═══════════════════════════════════════════════════════════════

  ① DÙng CSS transform thay vì top/left:
  ┌──────────────────────────────────────────────────────────┐
  │ transform: translateX() → KHÔNG gây REFLOW              │
  │ → Chạy trên GPU (Compositor thread)                    │
  │ → top/left → GÂY REFLOW mỗi frame                     │
  └──────────────────────────────────────────────────────────┘

  ② DÙNG will-change:
  ┌──────────────────────────────────────────────────────────┐
  │ will-change: transform, opacity                         │
  │ → Báo browser chuẩn bị riêng LAYER cho element        │
  │ → Animation mượt hơn nhờ GPU acceleration              │
  └──────────────────────────────────────────────────────────┘

  ③ DÙNG requestAnimationFrame:
  ┌──────────────────────────────────────────────────────────┐
  │ Thay vì setTimeout/setInterval                          │
  │ → rAF đồng bộ với REFRESH RATE browser (60fps)        │
  │ → Không bị frame drop                                   │
  └──────────────────────────────────────────────────────────┘
```

```javascript
// ===== requestAnimationFrame =====

// ❌ BAD: setTimeout → không đồng bộ refresh rate
setInterval(() => {
  element.style.left = pos++ + "px"; // reflow mỗi lần!
}, 16);

// ✅ GOOD: requestAnimationFrame + transform
function animate() {
  pos++;
  element.style.transform = `translateX(${pos}px)`; // NO reflow
  requestAnimationFrame(animate);
}
requestAnimationFrame(animate);
```

---

## 5. DocumentFragment

> **🎯 "Lightweight Document" — thao tác DOM không trigger reflow**

```
DOCUMENTFRAGMENT — ĐỊNH NGHĨA:
═══════════════════════════════════════════════════════════════

  DocumentFragment = MINIMAL DOCUMENT OBJECT, không có parent

  → Lightweight version of Document
  → Lưu trữ document structure (gồm các nodes)
  → Giống standard document NHƯNG:

  ┌──────────────────────────────────────────────────────────┐
  │ ★ KHÔNG thuộc actual DOM tree                           │
  │ ★ Thay đổi trên nó KHÔNG trigger DOM re-render        │
  │ ★ KHÔNG gây performance issues                          │
  └──────────────────────────────────────────────────────────┘

  Khi INSERT fragment vào document tree:
  → KHÔNG insert DocumentFragment BẢN THÂN
  → Chỉ insert TẤT CẢ descendant nodes của nó
```

```
SO SÁNH: TRỰC TIẾP DOM vs DOCUMENTFRAGMENT:
═══════════════════════════════════════════════════════════════

  TRỰC TIẾP DOM:
  ┌──────────────────────────────────────────────────────────┐
  │ for loop → appendChild x N lần                          │
  │ → N lần REFLOW + REDRAW                                 │
  │ → Performance issue với N lớn                           │
  └──────────────────────────────────────────────────────────┘

  DOCUMENTFRAGMENT:
  ┌──────────────────────────────────────────────────────────┐
  │ for loop → appendChild lên FRAGMENT (không reflow)     │
  │ → Cuối cùng: fragment → document (1 lần reflow)       │
  │ → Chỉ 1 lần REFLOW duy nhất!                          │
  └──────────────────────────────────────────────────────────┘

  ┌──────────────────┬──────────────────┬────────────────────┐
  │                  │ Trực tiếp DOM    │ DocumentFragment   │
  ├──────────────────┼──────────────────┼────────────────────┤
  │ Reflow count     │ N lần ❌         │ 1 lần ✅           │
  │ Performance      │ CHẬM ❌          │ NHANH ✅           │
  │ Memory           │ Trực tiếp DOM   │ In-memory          │
  │ Trigger render   │ MỖI appendChild │ CHỈ khi insert     │
  │                  │                  │ vào document       │
  │ Use case         │ 1-2 elements    │ NHIỀU elements    │
  └──────────────────┴──────────────────┴────────────────────┘
```

```javascript
// ===== DocumentFragment — Practical Example =====

// Tạo 10,000 items hiệu quả
function addItems() {
  const fragment = document.createDocumentFragment();
  const list = document.getElementById("myList");

  for (let i = 0; i < 10000; i++) {
    const li = document.createElement("li");
    li.textContent = `Item ${i + 1}`;
    li.className = "list-item";
    fragment.appendChild(li); // append lên fragment (NO reflow)
  }

  list.appendChild(fragment); // 1 reflow duy nhất!
  // fragment giờ EMPTY (đã move tất cả nodes)
}
```

---

## 6. Tóm Tắt & Câu Hỏi Phỏng Vấn

### Quick Reference

```
REFLOW & REDRAW — QUICK REFERENCE:
═══════════════════════════════════════════════════════════════

  REFLOW: Size/Position/Structure thay đổi → tính lại LAYOUT
  REDRAW: Color/Background/Shadow thay đổi → vẽ lại STYLE
  REFLOW → luôn trigger REDRAW (nhưng không ngược lại)

  REFLOW TRIGGERS: first render, window resize, element size,
    content change, font size, CSS pseudo, query props, DOM add/rm

  REDRAW TRIGGERS: background-color/image, color, outline,
    text-decoration, border-radius, visibility, box-shadow, opacity

  8 BIỆN PHÁP TỐI ƯU:
    ① DOM cấp thấp  ② Tránh table  ③ Tránh CSS expr
    ④ Modify class  ⑤ absolute/fixed  ⑥ documentFragment
    ⑦ display:none  ⑧ Batch read/write

  RENDERING QUEUE: Browser gộp operations → batch process
  ⚠️ Read layout props → FLUSH queue → reflow!

  ANIMATION: absolute/fixed + transform (GPU) + will-change + rAF
  DOCUMENTFRAGMENT: lightweight doc, không trigger reflow
```

### Câu Hỏi Phỏng Vấn Thường Gặp

**1. Reflow vs Redraw khác nhau thế nào?**

> **Reflow** (reflow/layout): khi size, position, structure thay đổi → browser **tính toán lại geometry** toàn bộ/1 phần render tree. Chi phí **cao**. **Redraw** (repaint): khi appearance thay đổi (color, background, shadow) nhưng **không ảnh hưởng layout** → chỉ vẽ lại visual. Chi phí **thấp hơn**. Reflow **luôn trigger** redraw, nhưng redraw **không trigger** reflow.

**2. Kể ra các nguyên nhân gây Reflow?**

> 8 loại: ① First render. ② Window resize. ③ Element content thay đổi. ④ Element size/position thay đổi. ⑤ Font-size thay đổi. ⑥ Activate CSS pseudo-classes (:hover). ⑦ Query layout properties (offsetTop, scrollTop, getComputedStyle, getBoundingClientRect). ⑧ Add/remove visible DOM elements.

**3. Liệt kê 8 biện pháp giảm reflow/redraw?**

> ① Thao tác DOM **cấp thấp** nhất. ② Tránh **table** layout. ③ Tránh CSS expressions. ④ Modify **class** thay vì style properties. ⑤ Dùng **absolute/fixed** (ra khỏi document flow). ⑥ Dùng **documentFragment** (batch DOM operations). ⑦ **display:none** → thao tác → display:block. ⑧ **Batch read/write** (tận dụng rendering queue).

**4. Rendering Queue là gì? Tại sao quan trọng?**

> Browser đặt tất cả reflow/redraw operations vào **queue**. Khi đạt số lượng/thời gian nhất định → **batch process** → nhiều operations → 1 reflow. ⚠️ Nhưng khi **read layout properties** (offsetTop, scrollTop...) → browser **flush queue ngay** để trả giá trị chính xác → gây reflow không mong muốn. Vì vậy phải **gộp reads riêng, writes riêng**.

**5. Tại sao transform tốt hơn top/left cho animation?**

> `top/left` thay đổi → gây **reflow** mỗi frame (tính toán lại layout). `transform: translate()` → **không gây reflow**, chạy trên **GPU** (Compositor thread), browser tối ưu riêng. Kết hợp **will-change** → browser chuẩn bị layer riêng → animation **mượt 60fps**.

**6. DocumentFragment là gì? Khác gì trực tiếp DOM?**

> DocumentFragment = **minimal document** object, **không thuộc DOM tree**. Thay đổi trên nó **không trigger reflow/redraw**. Khi insert vào document → chỉ insert **descendant nodes** (không phải fragment). So với DOM: thao tác N elements trực tiếp = **N reflows**, qua fragment = **1 reflow** duy nhất.

**7. Cách tối ưu animation để giảm reflow?**

> ① Dùng **position: absolute/fixed** (ra khỏi document flow → reflow local scope). ② Dùng **CSS transform** thay vì top/left (GPU, không reflow). ③ Dùng **will-change** (browser chuẩn bị layer). ④ Dùng **requestAnimationFrame** thay setTimeout (đồng bộ refresh rate, không frame drop).

---

## Checklist Học Tập

- [ ] Hiểu Reflow (layout) vs Redraw (repaint)
- [ ] Biết mối quan hệ: Reflow luôn trigger Redraw
- [ ] Biết 8 nguyên nhân gây Reflow
- [ ] Biết Redraw triggers (color, background, shadow, visibility...)
- [ ] Hiểu phạm vi: Global scope vs Local scope
- [ ] Biết 8 biện pháp tối ưu reflow/redraw
- [ ] Hiểu Rendering Queue + tại sao read props flush queue
- [ ] Biết tối ưu animation (absolute, transform, will-change, rAF)
- [ ] Hiểu DocumentFragment + so sánh vs trực tiếp DOM
- [ ] Biết batch read/write pattern

---

_Cập nhật lần cuối: Tháng 2, 2026_
