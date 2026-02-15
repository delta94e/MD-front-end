# Render 100,000 Data — Giải pháp tối ưu — Deep Dive

> 📅 2026-02-12 · ⏱ 12 phút đọc
>
> Backend trả 100,000 records, frontend render thế nào?
> Direct render (vấn đề), setTimeout time slicing (flicker),
> requestAnimationFrame + DocumentFragment (time slicing),
> Virtual List (ultimate solution). Event Loop, reflow, rAF.
> Độ khó: ⭐️⭐️⭐️⭐️⭐️ | Chủ đề: JavaScript / Performance / DOM

---

## Mục Lục

0. [Vấn đề — Direct Render](#0-vấn-đề)
1. [setTimeout Time Slicing](#1-settimeout)
2. [requestAnimationFrame + Fragment](#2-raf-fragment)
3. [Virtual List](#3-virtual-list)
4. [Tóm Tắt & Câu Hỏi Phỏng Vấn](#4-tóm-tắt)

---

## 0. Vấn đề — Direct Render

### Code trực tiếp

```html
<ul id="container"></ul>

<script>
  const total = 100000;
  let ul = document.getElementById("container");

  for (let i = 0; i < total; i++) {
    let li = document.createElement("li");
    li.innerHTML = ~~(Math.random() * total);
    ul.appendChild(li);
  }
</script>
```

### Đo thời gian — V8 vs Render

```javascript
let prevTime = Date.now();
const total = 100000;
let ul = document.getElementById("container");

for (let i = 0; i < total; i++) {
  let li = document.createElement("li");
  li.innerHTML = ~~(Math.random() * total);
  ul.appendChild(li);
}

console.log("V8 执行代码时间：", Date.now() - prevTime);
// → ~400ms (0.4s)

setTimeout(() => {
  console.log("页面渲染时间：", Date.now() - prevTime);
  // → ~3300ms (3.3s)
}, 0);
```

### Tại sao setTimeout đo được render time?

```
EVENT LOOP — TẠI SAO setTimeout ĐO ĐƯỢC RENDER TIME:
═══════════════════════════════════════════════════════════════

  ┌─────────────────────────────────────────────────────────┐
  │ ① Sync code (for loop)       → V8 execute (~0.4s)     │
  │ ② Microtasks (Promise...)    → chạy hết               │
  │ ③ ⭐ RENDER (Layout, Paint)  → browser render (~2.9s) │
  │ ④ Macrotask (setTimeout)     → callback chạy          │
  └─────────────────────────────────────────────────────────┘

  → Sync code (for loop) chạy xong
  → Browser CHECK: có cần render không? → CÓ (100k DOM mới)
  → RENDER page (tốn ~2.9s)
  → SAU ĐÓ mới chạy setTimeout callback
  → Nên thời gian in ra = V8 time + Render time!

  KẾT LUẬN:
  → V8 rất nhanh (~0.4s cho 100k operations)
  → BOTTLENECK nằm ở PAGE RENDERING (~2.9s)
  → 100,000 lần reflow = CỰC CHẬM!
```

### Vấn đề Direct Render

```
DIRECT RENDER — 3 VẤN ĐỀ:
═══════════════════════════════════════════════════════════════

  ❌ Page TRẮNG 3-4 giây (user chờ, bad UX)
  ❌ 100,000 lần appendChild = 100,000 lần REFLOW!
  ❌ Memory spike: 100k DOM nodes cùng lúc

  → User chỉ nhìn thấy ~20-30 items trên màn hình
  → Tại sao phải render 100,000 items cùng lúc?
```

---

## 1. setTimeout Time Slicing

### Ý tưởng

```
setTimeout TIME SLICING:
═══════════════════════════════════════════════════════════════

  Chia 100,000 items thành NHIỀU batch nhỏ
  → Mỗi batch render 20 items
  → Dùng setTimeout để "nhường" main thread
  → Page hiển thị NGAY batch đầu tiên (fast first paint)

  100,000 items ÷ 20 = 5,000 batches
  → Mỗi batch = 1 setTimeout callback
```

### Code

```javascript
const total = 100000;
let ul = document.getElementById("container");
let once = 20; // Mỗi lần render 20 items
let page = total / once; // 5000 batches

function loop(curTotal) {
  if (curTotal <= 0) return;

  let pageCount = Math.min(curTotal, once);

  setTimeout(() => {
    for (let i = 0; i < pageCount; i++) {
      let li = document.createElement("li");
      li.innerHTML = ~~(Math.random() * total);
      ul.appendChild(li);
    }
    loop(curTotal - pageCount); // Recursive
  }, 0);
}

loop(total);
```

### Vấn đề — Screen Flickering!

```
TẠI SAO BỊ FLICKER (NHẤp NHÁY)?
═══════════════════════════════════════════════════════════════

  Nguyên nhân 1: setTimeout KHÔNG ĐỒNG BỘ với screen refresh

  Màn hình 60Hz = refresh mỗi 16.7ms
  setTimeout(fn, 0) ≠ chạy ngay → có delay

  TIMELINE:
  ┌────────────────────────────────────────────────────────┐
  │ 0ms     16.7ms    33.4ms    50.1ms                    │
  │ ├────────├─────────├─────────├────────→ Screen refresh │
  │                                                        │
  │ setTimeout callbacks (không đều):                      │
  │ ├──┤  ├────┤    ├──┤   ├──────┤                       │
  │ 2ms  8ms   22ms  28ms  45ms                           │
  │                                                        │
  │ → Callback ở 22ms tạo li                              │
  │ → Screen refresh ở 33.4ms mới hiển thị               │
  │ → Khoảng trống 11ms → FLICKER!                       │
  └────────────────────────────────────────────────────────┘

  Nguyên nhân 2: Render queue blocking

  ┌────────────────────────────────────────────────────────┐
  │ Batch 1: tạo 20 li → appendChild → RENDER (tốn thời  │
  │          gian) → render xong                           │
  │ Batch 2: setTimeout callback phải ĐỢI render xong    │
  │          → MỚI chạy → tạo 20 li mới                  │
  │                                                        │
  │ → Giữa render batch 1 & tạo batch 2 = KHOẢNG TRỐNG  │
  │ → User thấy: hiện → trống → hiện → trống = FLICKER! │
  └────────────────────────────────────────────────────────┘

  VẪN CÒN VẤN ĐỀ:
  → 100,000 appendChild = 100,000 reflows (chưa giải quyết)
```

---

## 2. requestAnimationFrame + Fragment

### requestAnimationFrame (rAF) là gì?

```
requestAnimationFrame vs setTimeout:
═══════════════════════════════════════════════════════════════

  setTimeout(fn, 0):
  → Thời gian do MÌnH set (0ms, 16ms, v.v.)
  → KHÔNG đồng bộ với screen refresh
  → Có thể chạy GIỮA 2 frame → flicker!

  requestAnimationFrame(fn):
  → Thời gian do BROWSER quyết định
  → TỰ ĐỘNG đồng bộ với screen refresh rate!
  → 60Hz → mỗi 16.7ms
  → 120Hz → mỗi 8.3ms
  → Callback luôn chạy TRƯỚC mỗi frame render

  TIMELINE:
  ┌────────────────────────────────────────────────────────┐
  │ 0ms     16.7ms    33.4ms    50.1ms                    │
  │ ├────────├─────────├─────────├────────→ Screen refresh │
  │                                                        │
  │ rAF callbacks (đồng bộ với screen):                   │
  │ ├──┤    ├──┤      ├──┤      ├──┤                      │
  │ callback callback  callback  callback                  │
  │ + render + render  + render  + render                  │
  │                                                        │
  │ → Mỗi frame: callback tạo DOM → render → hiển thị    │
  │ → KHÔNG CÓ khoảng trống → KHÔNG FLICKER!             │
  └────────────────────────────────────────────────────────┘

  rAF là MACROTASK (macro task)
  → Chạy trước mỗi repaint
  → Interview hay hỏi!
```

### DocumentFragment là gì?

```
DOCUMENT FRAGMENT:
═══════════════════════════════════════════════════════════════

  Vấn đề: 20 appendChild = 20 reflows mỗi batch

  DocumentFragment = "VIRTUAL DOM fragment"
  → Tồn tại trong memory, KHÔNG ở DOM tree
  → appendChild vào fragment → KHÔNG reflow!
  → Khi mount fragment vào real DOM → CHỈ 1 reflow!

  KHÔNG CÓ Fragment (20 reflows/batch):
  ┌────────────────────────────────────────────────────────┐
  │ li₁ → ul.appendChild(li₁) → REFLOW ①                │
  │ li₂ → ul.appendChild(li₂) → REFLOW ②                │
  │ ...                                                    │
  │ li₂₀ → ul.appendChild(li₂₀) → REFLOW ⑳              │
  │ → 20 reflows per batch × 5000 batches = 100,000!     │
  └────────────────────────────────────────────────────────┘

  CÓ Fragment (1 reflow/batch):
  ┌────────────────────────────────────────────────────────┐
  │ fragment = createDocumentFragment()                    │
  │ li₁ → fragment.appendChild(li₁) → NO reflow          │
  │ li₂ → fragment.appendChild(li₂) → NO reflow          │
  │ ...                                                    │
  │ li₂₀ → fragment.appendChild(li₂₀) → NO reflow        │
  │ ul.appendChild(fragment) → REFLOW ① (duy nhất!)      │
  │ → 1 reflow per batch × 5000 batches = 5,000!         │
  │ → Giảm 20x số lần reflow!                            │
  └────────────────────────────────────────────────────────┘
```

### Code hoàn chỉnh

```javascript
const total = 100000;
let ul = document.getElementById("container");
let once = 20;

function loop(curTotal) {
  if (curTotal <= 0) return;

  let pageCount = Math.min(curTotal, once);

  window.requestAnimationFrame(() => {
    // Tạo virtual fragment
    let fragment = document.createDocumentFragment();

    for (let i = 0; i < pageCount; i++) {
      let li = document.createElement("li");
      li.innerHTML = ~~(Math.random() * total);
      fragment.appendChild(li); // Mount vào fragment (NO reflow)
    }

    ul.appendChild(fragment); // Mount fragment vào DOM (1 reflow)
    loop(curTotal - pageCount);
  });
}

loop(total);
```

### Đánh giá

```
rAF + FRAGMENT — ĐÁNH GIÁ:
═══════════════════════════════════════════════════════════════

  ✅ First paint CỰC NHANH (chỉ render 20 items đầu)
  ✅ Đồng bộ với screen refresh → ÍT flicker hơn setTimeout
  ✅ Fragment giảm reflow: 100,000 → 5,000
  ✅ Code đơn giản, dễ hiểu

  ❌ Scroll quá nhanh → VẪN có thể flicker
     (vì batch tiếp theo chưa render kịp)
  ❌ Sau khi chạy xong → VẪN CÓ 100,000 DOM nodes trong tree
  ❌ Memory vẫn lớn (100k nodes)
  ❌ Scroll performance kém (100k nodes trong DOM)

  → GIẢI PHÁP: ra đời VIRTUAL LIST!
```

---

## 3. Virtual List

### Ý tưởng cốt lõi

```
VIRTUAL LIST — CORE CONCEPT:
═══════════════════════════════════════════════════════════════

  CHỈ RENDER CÁI USER NHÌN THẤY!

  Total data: 100,000 items
  Visible area: ~10 items (tuỳ viewport height)
  Buffer: ~10 items trên + ~10 items dưới
  → Thực tế chỉ render ~30 DOM nodes!
  → Dù data có 1,000,000 → vẫn chỉ ~30 nodes!

  ┌─────────────────────────────────────────────────────┐
  │                                                     │
  │  ┌──── paddingTop (giả lập space phía trên) ────┐  │
  │  │     height = startIndex × itemHeight          │  │
  │  └───────────────────────────────────────────────┘  │
  │                                                     │
  │  ┌──── BUFFER ZONE (top) ───────────────────────┐  │
  │  │ item 91                                       │  │
  │  │ item 92                                       │  │
  │  │ ...                                           │  │
  │  └───────────────────────────────────────────────┘  │
  │                                                     │
  │  ┌═══════════════════════════════════════════════┐  │
  │  ║ VIEWPORT (user nhìn thấy)                    ║  │
  │  ║ item 101                                      ║  │
  │  ║ item 102                                      ║  │
  │  ║ ...                                           ║  │
  │  ║ item 110                                      ║  │
  │  ╚═══════════════════════════════════════════════╝  │
  │                                                     │
  │  ┌──── BUFFER ZONE (bottom) ────────────────────┐  │
  │  │ item 111                                      │  │
  │  │ item 112                                      │  │
  │  │ ...                                           │  │
  │  └───────────────────────────────────────────────┘  │
  │                                                     │
  │  ┌──── paddingBottom (giả lập space phía dưới) ─┐  │
  │  │     height = (total - endIndex) × itemHeight  │  │
  │  └───────────────────────────────────────────────┘  │
  │                                                     │
  └─────────────────────────────────────────────────────┘

  KEY: paddingTop + paddingBottom GIẢ LẬP chiều cao
  → Scrollbar hiển thị ĐÚNG tỉ lệ
  → User nghĩ có 100,000 items trong DOM
  → Thực tế chỉ có ~30 nodes!
```

### Các bước implement

```
VIRTUAL LIST — 5 BƯỚC:
═══════════════════════════════════════════════════════════════

  ① Tính số items vừa viewport
     itemNum = ~~(boxHeight / itemHeight) + 2
     (+2 vì top/bottom edge có thể hiện 1 nửa)

  ② Track startIndex khi scroll
     startIndex = ~~(scrollTop / itemHeight)

  ③ Tính endIndex (+ buffer)
     endIndex = startIndex + itemNum × 2
     (× 2 = buffer gấp đôi viewport cho smooth)

  ④ Slice data array
     currentList = allList.slice(startOffset, endIndex + 1)
     (startOffset có buffer phía trên)

  ⑤ Tính paddingTop / paddingBottom
     paddingTop = startOffset × itemHeight
     paddingBottom = (total - endIndex - 1) × itemHeight
     → Giả lập chiều cao tổng → scrollbar đúng
```

### Code hoàn chỉnh (Vue 3)

```html
<div id="app">
  <div class="v-scroll" @scroll="doScroll" ref="scrollBox">
    <ul :style="blankStyle">
      <li v-for="item in currentList" :key="item">{{ item }}</li>
    </ul>
  </div>
</div>

<script>
  const { createApp, ref, onMounted, computed } = Vue;

  createApp({
    setup() {
      // ① Data
      const allList = ref([]);
      function getAllList(count) {
        const length = allList.value.length;
        for (let i = 0; i < count; i++) {
          allList.value.push(`Mục ${length + i + 1}`);
        }
      }
      getAllList(100000); // 100k items

      // ② DOM ref + viewport height
      const scrollBox = ref(null);
      const boxHeight = ref(0);
      const itemHeight = ref(40); // Mỗi item cao 40px

      onMounted(() => {
        boxHeight.value = scrollBox.value.clientHeight;
        // clientHeight = content height (KHÔNG bao gồm border)
        // offsetHeight = content + border
        window.onresize = () => {
          boxHeight.value = scrollBox.value.clientHeight;
        };
      });

      // ③ Số items vừa viewport
      const itemNum = computed(() => {
        return ~~(boxHeight.value / itemHeight.value) + 2;
      });

      // ④ Start index (scroll event)
      const startIndex = ref(0);

      const doScroll = _.throttle(() => {
        const index = ~~(scrollBox.value.scrollTop / itemHeight.value);
        if (index === startIndex.value) return;
        startIndex.value = index;
      }, 200); // Throttle 200ms tối ưu performance

      // ⑤ End index (+ buffer = itemNum × 2)
      const endIndex = computed(() => {
        let index = startIndex.value + itemNum.value * 2;
        if (!allList.value[index]) {
          index = allList.value.length - 1; // Boundary check
        }
        return index;
      });

      // ⑥ Current visible list (with top buffer)
      const currentList = computed(() => {
        let index = 0;
        if (startIndex.value <= itemNum.value) {
          index = 0; // Đầu list, chưa cần buffer trên
        } else {
          index = startIndex.value - itemNum.value; // Buffer trên
        }
        return allList.value.slice(index, endIndex.value + 1);
      });

      // ⑦ Padding giả lập chiều cao
      const blankStyle = computed(() => {
        let index = 0;
        if (startIndex.value <= itemNum.value) {
          index = 0;
        } else {
          index = startIndex.value - itemNum.value;
        }
        return {
          paddingTop: index * itemHeight.value + "px",
          paddingBottom:
            (allList.value.length - endIndex.value - 1) * itemHeight.value +
            "px",
        };
      });

      return {
        currentList,
        scrollBox,
        doScroll,
        blankStyle,
      };
    },
  }).mount("#app");
</script>
```

### Giải thích chi tiết

```
VIRTUAL LIST — KEY DETAILS:
═══════════════════════════════════════════════════════════════

  clientHeight vs offsetHeight:
  ┌──────────────────────────────────────────────────────┐
  │ clientHeight = content + padding (KHÔNG border)     │
  │ offsetHeight = content + padding + border            │
  │ → Dùng clientHeight vì ta cần VISIBLE content area  │
  └──────────────────────────────────────────────────────┘

  Tại sao ~~(x) thay vì Math.floor(x)?
  ┌──────────────────────────────────────────────────────┐
  │ ~~ (double NOT bitwise) = NHANH HƠN Math.floor      │
  │ ~~(3.7) = 3                                         │
  │ ~~(400 / 40) = 10                                   │
  │ → Performance trick cho scroll handler (gọi liên tục)│
  └──────────────────────────────────────────────────────┘

  Tại sao buffer = itemNum × 2?
  ┌──────────────────────────────────────────────────────┐
  │ Viewport chứa ~10 items                              │
  │ Buffer trên: 10 items (pre-render)                   │
  │ Buffer dưới: 10 items (pre-render)                   │
  │ → Total DOM: ~30 items                               │
  │ → User scroll → items đã sẵn sàng → SMOOTH!         │
  │ → Không có buffer → scroll xuống → blank → lag!     │
  └──────────────────────────────────────────────────────┘

  paddingTop/Bottom giả lập:
  ┌──────────────────────────────────────────────────────┐
  │ Scrollbar cần biết TỔNG chiều cao để hiển thị đúng  │
  │ paddingTop  = items ĐÃ SCROLL QUA × itemHeight      │
  │ paddingBottom = items CHƯA ĐẾN × itemHeight         │
  │ → Tổng height = paddingTop + visible + paddingBottom │
  │ → = total × itemHeight (giống render 100k items!)   │
  │ → Scrollbar hiển thị ĐÚNG vị trí!                   │
  └──────────────────────────────────────────────────────┘

  Throttle scroll handler:
  ┌──────────────────────────────────────────────────────┐
  │ Scroll event fires RẤT NHIỀU (mỗi pixel)            │
  │ Không throttle → tính toán quá nhiều → lag!          │
  │ _.throttle(fn, 200) → tối đa 5 lần/giây             │
  │ → Performance tốt + user vẫn smooth                  │
  └──────────────────────────────────────────────────────┘
```

### Đánh giá

```
VIRTUAL LIST — ĐÁNH GIÁ:
═══════════════════════════════════════════════════════════════

  ✅ DOM nodes luôn ~30 (dù data 1 triệu)
  ✅ Memory thấp, scroll mượt mà
  ✅ First paint CỰC NHANH
  ✅ Không bao giờ lag, bất kể data size

  ❌ Phức tạp hơn time slicing
  ❌ Chỉ hoạt động với FIXED height items (biến thể
     có thể handle dynamic height nhưng phức tạp hơn)
  ❌ Cần tính toán padding chính xác
  ❌ Search/filter phải tính lại indices

  PRODUCTION LIBRARIES:
  → react-virtualized / react-window (React)
  → vue-virtual-scroller (Vue)
  → @tanstack/virtual (framework-agnostic)
```

---

## 4. Tóm Tắt

### So sánh 4 phương pháp

```
4 METHODS — COMPARISON:
═══════════════════════════════════════════════════════════════

  ┌────────────────┬──────────┬──────────┬──────────┬──────────┐
  │                │ Direct   │setTimeout│ rAF +    │ Virtual  │
  │                │ Render   │ Slicing  │ Fragment │ List     │
  ├────────────────┼──────────┼──────────┼──────────┼──────────┤
  │ First paint    │ ~3.3s ❌ │ Fast ✅  │ Fast ✅  │ Fast ✅  │
  ├────────────────┼──────────┼──────────┼──────────┼──────────┤
  │ DOM nodes      │ 100k ❌  │ 100k ❌  │ 100k ❌  │ ~30 ✅   │
  ├────────────────┼──────────┼──────────┼──────────┼──────────┤
  │ Reflows        │ 100k ❌  │ 100k ❌  │ 5k ⚠️    │ ~30 ✅   │
  ├────────────────┼──────────┼──────────┼──────────┼──────────┤
  │ Flicker        │ No       │ YES ❌   │ Mild ⚠️  │ No ✅    │
  ├────────────────┼──────────┼──────────┼──────────┼──────────┤
  │ Memory         │ High ❌  │ High ❌  │ High ❌  │ Low ✅   │
  ├────────────────┼──────────┼──────────┼──────────┼──────────┤
  │ Scroll perf    │ Bad ❌   │ Bad ❌   │ Bad ❌   │ Good ✅  │
  ├────────────────┼──────────┼──────────┼──────────┼──────────┤
  │ Complexity     │ ⭐       │ ⭐⭐      │ ⭐⭐      │ ⭐⭐⭐⭐   │
  ├────────────────┼──────────┼──────────┼──────────┼──────────┤
  │ Interview wow  │ ⭐       │ ⭐⭐      │ ⭐⭐⭐     │ ⭐⭐⭐⭐⭐  │
  └────────────────┴──────────┴──────────┴──────────┴──────────┘
```

### Quick Reference

```
100K DATA RENDER — QUICK REFERENCE:
═══════════════════════════════════════════════════════════════

  PROBLEM:
    Direct render 100k items → 3.3s blank, 100k reflows

  WHY SLOW?
    V8 execute = 0.4s (FAST)
    Page render = 2.9s (BOTTLENECK = reflow!)
    setTimeout đo render time vì event loop: sync → render → macro

  SOLUTION 1 — setTimeout Time Slicing:
    Chia batch 20 items, setTimeout recursive
    ❌ Flicker (timer + screen refresh không đồng bộ)

  SOLUTION 2 — rAF + Fragment:
    requestAnimationFrame = đồng bộ screen refresh
    DocumentFragment = batch DOM operations (1 reflow/batch)
    ❌ Vẫn tạo 100k DOM nodes cuối cùng

  SOLUTION 3 — Virtual List (BEST):
    Chỉ render items trong viewport + buffer
    paddingTop/Bottom giả lập total height
    Scroll → tính startIndex/endIndex → slice data
    ~30 DOM nodes dù 1 triệu data!

  INTERVIEW STRATEGY:
    Nói direct render → vấn đề → setTimeout → flicker →
    rAF + fragment → vẫn 100k nodes → virtual list!
```

### Câu Hỏi Phỏng Vấn

**1. Backend trả về 100,000 records, frontend render thế nào?**

> 3 giải pháp từ đơn giản đến tối ưu: ① **setTimeout time slicing** — chia thành batches 20 items, dùng setTimeout recursive, first paint nhanh nhưng bị flicker do timer không đồng bộ screen refresh. ② **rAF + Fragment** — dùng `requestAnimationFrame` thay setTimeout (đồng bộ 60Hz), dùng `DocumentFragment` giảm reflow từ 100k xuống 5k. ③ **Virtual list** — chỉ render items trong viewport (~30 DOM nodes), dùng padding giả lập chiều cao tổng, scroll → recalculate visible range → slice data. Virtual list là giải pháp tối ưu nhất.

**2. Tại sao setTimeout(fn, 0) trong đoạn đo thời gian đo được render time?**

> Do **Event Loop**: sync code chạy xong → microtasks → browser CHECK cần render không → **RENDER** → rồi mới chạy macrotask (setTimeout). Nên thời gian print ra trong setTimeout callback = V8 execution + render time. V8 chỉ tốn 0.4s, render tốn 2.9s → **bottleneck nằm ở rendering** (100k reflows), không phải JS execution.

**3. Tại sao setTimeout time slicing bị flicker?**

> Hai nguyên nhân: ① **Timer không đồng bộ screen refresh** — screen refresh 60Hz = 16.7ms, setTimeout(fn, 0) delay không đều, DOM update xảy ra giữa 2 frame → flicker. ② **Render queue blocking** — batch 1 render xong → setTimeout callback batch 2 mới chạy → khoảng trống giữa render và tạo DOM = blank frame.

**4. requestAnimationFrame khác setTimeout thế nào?**

> **setTimeout**: thời gian do dev set, không liên quan screen refresh, callback có thể chạy giữa 2 frame. **rAF**: thời gian do **browser quyết định**, tự động đồng bộ screen refresh rate (60Hz = 16.7ms, 120Hz = 8.3ms), callback chạy **trước mỗi frame render**. rAF là macrotask, đảm bảo DOM update luôn khớp screen refresh → không flicker.

**5. DocumentFragment là gì? Tại sao giảm reflow?**

> DocumentFragment = **virtual DOM fragment** tồn tại trong memory, **không thuộc DOM tree**. `appendChild` vào fragment → **không trigger reflow** vì chưa trong document. Khi mount fragment vào real DOM → **CHỈ 1 reflow**. 20 items/batch: không fragment = 20 reflows, có fragment = 1 reflow. 5000 batches: 100k reflows → 5k reflows (giảm 20x).

**6. Virtual list hoạt động thế nào? Giải thích chi tiết.**

> ① Tính `itemNum` = ~~(viewportHeight / itemHeight) + 2. ② Lắng nghe scroll → `startIndex` = ~~(scrollTop / itemHeight). ③ `endIndex` = startIndex + itemNum × 2 (buffer gấp đôi). ④ `currentList` = allData.slice(startOffset, endIndex + 1) (startOffset có buffer trên). ⑤ `paddingTop` + `paddingBottom` giả lập tổng chiều cao → scrollbar hiển thị đúng. Kết quả: dù 100k data → chỉ ~30 DOM nodes, scroll mượt, memory thấp.

**7. clientHeight vs offsetHeight khác nhau thế nào?**

> **clientHeight** = content + padding (KHÔNG bao gồm border, scrollbar). **offsetHeight** = content + padding + border + scrollbar. Virtual list dùng `clientHeight` vì cần biết **visible content area** (vùng thực sự hiển thị items), không tính border.

---

## Checklist Học Tập

- [ ] Direct render 100k → ~3.3s, bottleneck = rendering (không phải V8)
- [ ] setTimeout(fn, 0) đo render time nhờ event loop (sync → render → macro)
- [ ] setTimeout time slicing: chia batch, recursive, first paint nhanh
- [ ] Flicker do timer + screen refresh không đồng bộ (0ms vs 16.7ms)
- [ ] requestAnimationFrame: đồng bộ screen refresh, browser quyết định timing
- [ ] rAF là macrotask, callback chạy trước mỗi frame render
- [ ] DocumentFragment: virtual fragment, appendChild không reflow
- [ ] Fragment giảm reflow 100k → 5k (20x improvement)
- [ ] Virtual list: chỉ render viewport + buffer (~30 DOM nodes)
- [ ] paddingTop/Bottom giả lập tổng chiều cao cho scrollbar
- [ ] startIndex = ~~(scrollTop / itemHeight)
- [ ] ~~ (double NOT) = performance trick thay Math.floor
- [ ] Throttle scroll handler (~200ms) để tối ưu performance
- [ ] clientHeight = no border, offsetHeight = có border
- [ ] Production: react-window, vue-virtual-scroller, @tanstack/virtual

---

_Cập nhật lần cuối: Tháng 2, 2026_
