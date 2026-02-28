# Browser Garbage Collection — V8 GC Mechanism Deep Dive

> 📅 2026-02-11 · ⏱ 20 phút đọc
>
> Tài liệu chuyên sâu về V8 Garbage Collection: Generational GC,
> Young Generation (Scavenge / From-To), Old Generation (Mark-Sweep /
> Mark-Compact), Incremental & Concurrent Marking, Memory Spaces,
> và 4 nguyên nhân Memory Leak phổ biến.
> Độ khó: ⭐️⭐️⭐️⭐️⭐️ | Chủ đề: Browser Internals & V8 Engine

---

## Mục Lục

0. [V8 Garbage Collection — Tổng quan](#0-v8-garbage-collection--tổng-quan)
1. [Young Generation — Scavenge GC](#1-young-generation--scavenge-gc)
2. [Old Generation — Mark-Sweep & Mark-Compact](#2-old-generation--mark-sweep--mark-compact)
3. [V8 Memory Spaces (AllocationSpace)](#3-v8-memory-spaces-allocationspace)
4. [Incremental Marking & Concurrent Marking](#4-incremental-marking--concurrent-marking)
5. [Memory Leak — 4 nguyên nhân phổ biến](#5-memory-leak--4-nguyên-nhân-phổ-biến)
6. [Tóm Tắt & Câu Hỏi Phỏng Vấn](#6-tóm-tắt--câu-hỏi-phỏng-vấn)

---

## 0. V8 Garbage Collection — Tổng quan

> **🎯 V8 dùng Generational GC: chia heap thành Young + Old Generation**

```
V8 GARBAGE COLLECTION — TỔNG QUAN:
═══════════════════════════════════════════════════════════════

  V8 implement ACCURATE (chính xác) garbage collection
  Dùng GENERATIONAL GC — chia heap thành 2 phần:

  ┌──────────────────────────────────────────────────────────┐
  │                     V8 HEAP MEMORY                       │
  │                                                          │
  │  ┌─────────────────┐  ┌──────────────────────────────┐  │
  │  │ YOUNG GENERATION │  │      OLD GENERATION          │  │
  │  │                  │  │                              │  │
  │  │ → Object sống   │  │ → Object sống LÂU           │  │
  │  │   NGẮN HẠN      │  │ → Số lượng NHIỀU            │  │
  │  │ → Size NHỎ      │  │ → Size LỚN                  │  │
  │  │                  │  │                              │  │
  │  │ ALGORITHM:       │  │ ALGORITHMS:                  │  │
  │  │ Scavenge GC     │  │ ① Mark-Sweep                │  │
  │  │ (From ↔ To)     │  │ ② Mark-Compact              │  │
  │  └─────────────────┘  └──────────────────────────────┘  │
  │                                                          │
  └──────────────────────────────────────────────────────────┘

  TẠI SAO CHIA GENERATION?
  → Object ngắn hạn NHIỀU → cần GC NHANH (Scavenge)
  → Object dài hạn ÍT thay đổi → GC HIỂM KHI hơn
  → Tối ưu performance cho từng loại object
```

---

## 1. Young Generation — Scavenge GC

> **🎯 From Space ↔ To Space: copy sống, hủy chết, swap**

```
YOUNG GENERATION — SCAVENGE ALGORITHM:
═══════════════════════════════════════════════════════════════

  Memory được chia thành 2 phần BẰNG NHAU:
  → FROM SPACE: đang DÙNG (chứa objects)
  → TO SPACE: đang TRỐNG (free)

  ┌─── TRẠNG THÁI BAN ĐẦU ──────────────────────────────┐
  │                                                      │
  │  FROM SPACE (đang dùng)    TO SPACE (trống)          │
  │  ┌──┬──┬──┬──┬──┬──┐     ┌──┬──┬──┬──┬──┬──┐       │
  │  │A │B │C │D │E │F │     │  │  │  │  │  │  │       │
  │  │✅│💀│✅│💀│✅│💀│     │  │  │  │  │  │  │       │
  │  └──┴──┴──┴──┴──┴──┘     └──┴──┴──┴──┴──┴──┘       │
  │   ✅=sống  💀=chết                                   │
  └──────────────────────────────────────────────────────┘

  STEP-BY-STEP GC PROCESS:

  ① From Space ĐẦY → trigger Young Gen GC

  ② Kiểm tra objects trong From Space:
     → Object CÒN SỐNG (referenced) → COPY sang To Space
     → Object ĐÃ CHẾT (unreferenced) → HỦY

  ┌─── SAU KHI COPY ─────────────────────────────────────┐
  │                                                      │
  │  FROM SPACE                TO SPACE                  │
  │  ┌──┬──┬──┬──┬──┬──┐     ┌──┬──┬──┬──┬──┬──┐       │
  │  │  │  │  │  │  │  │     │A │C │E │  │  │  │       │
  │  │  │  │  │  │  │  │     │✅│✅│✅│  │  │  │       │
  │  └──┴──┴──┴──┴──┴──┘     └──┴──┴──┴──┴──┴──┘       │
  │   (đã clear)               (objects sống)            │
  └──────────────────────────────────────────────────────┘

  ③ SWAP: From ↔ To (đổi vai trò)

  ┌─── SAU KHI SWAP ─────────────────────────────────────┐
  │                                                      │
  │  FROM SPACE (mới)          TO SPACE (mới)            │
  │  ┌──┬──┬──┬──┬──┬──┐     ┌──┬──┬──┬──┬──┬──┐       │
  │  │A │C │E │  │  │  │     │  │  │  │  │  │  │       │
  │  │✅│✅│✅│  │  │  │     │  │  │  │  │  │  │       │
  │  └──┴──┴──┴──┴──┴──┘     └──┴──┴──┴──┴──┴──┘       │
  │   (đang dùng)              (trống, sẵn sàng)         │
  └──────────────────────────────────────────────────────┘

  ④ GC kết thúc → new objects được allocate vào From Space

  ĐẶC ĐIỂM:
  → Nhanh, hiệu quả cho objects NGẮN HẠN
  → Đánh đổi: dùng GẤP ĐÔI memory (From + To)
  → Phù hợp vì Young Gen thường NHỎ
```

---

## 2. Old Generation — Mark-Sweep & Mark-Compact

> **🎯 2 điều kiện promote → Old Gen; 2 algorithms GC**

### Khi nào object chuyển sang Old Generation?

```
PROMOTION: YOUNG GEN → OLD GEN:
═══════════════════════════════════════════════════════════════

  Object chuyển sang OLD GENERATION khi:

  ① ĐÃ QUA Scavenge algorithm rồi (sống sót qua 1 lần GC)
  ┌──────────────────────────────────────────────────────────┐
  │ Object trong Young Gen đã Scavenge 1 lần               │
  │ → SỐNG SÓT → chuyển sang Old Gen                      │
  │ (Nghĩa là object có lifespan ĐỦ DÀI)                  │
  └──────────────────────────────────────────────────────────┘

  ② To Space CHIẾM > 25% tổng size
  ┌──────────────────────────────────────────────────────────┐
  │ Nếu objects trong To Space > 25% tổng capacity         │
  │ → Chuyển sang Old Gen để KHÔNG ẢNH HƯỞNG              │
  │   memory allocation cho Young Gen                      │
  └──────────────────────────────────────────────────────────┘

  FLOW:
  ┌──────────┐  sống sót    ┌──────────┐  sống sót   ┌──────────┐
  │ New      │ Scavenge #1  │ Still in │ Scavenge #2 │ OLD      │
  │ Object   ├─────────────►│ Young Gen├────────────►│GENERATION│
  │ (From)   │              │ (To→From)│             │          │
  └──────────┘              └──────────┘             └──────────┘
                                 │ >25%
                                 └─────────────────►┌──────────┐
                                                    │ OLD GEN  │
                                                    └──────────┘
```

### Mark-Sweep (Đánh dấu - Quét)

```
MARK-SWEEP ALGORITHM:
═══════════════════════════════════════════════════════════════

  Khi nào kích hoạt Mark-Sweep?
  → Khi 1 space KHÔNG được chia thành blocks
  → Khi số objects trong space VƯỢT QUÁ giới hạn
  → Khi space KHÔNG ĐỦ chỗ cho objects từ Young Gen

  2 BƯỚC:

  ① MARK (Đánh dấu):
  → Duyệt TẤT CẢ objects trong heap
  → Object CÒN SỐNG → ĐÁNH DẤU ✅

  ② SWEEP (Quét):
  → Sau khi mark xong → HỦY tất cả objects KHÔNG được mark

  ┌─── TRƯỚC MARK-SWEEP ─────────────────────────────────┐
  │  ┌──┬──┬──┬──┬──┬──┬──┬──┬──┬──┐                    │
  │  │A │  │B │C │  │D │  │E │F │  │                    │
  │  │✅│  │💀│✅│  │💀│  │✅│💀│  │                    │
  │  └──┴──┴──┴──┴──┴──┴──┴──┴──┴──┘                    │
  └──────────────────────────────────────────────────────┘

  ┌─── SAU MARK-SWEEP ───────────────────────────────────┐
  │  ┌──┬──┬──┬──┬──┬──┬──┬──┬──┬──┐                    │
  │  │A │  │░░│C │  │░░│  │E │░░│  │                    │
  │  │✅│  │  │✅│  │  │  │✅│  │  │                    │
  │  └──┴──┴──┴──┴──┴──┴──┴──┴──┴──┘                    │
  │   ░░ = memory đã giải phóng (FRAGMENTED!)            │
  │                                                      │
  │   ⚠️ VẤN ĐỀ: Tạo ra MEMORY FRAGMENTATION!          │
  └──────────────────────────────────────────────────────┘
```

### Mark-Compact (Đánh dấu - Nén)

```
MARK-COMPACT ALGORITHM:
═══════════════════════════════════════════════════════════════

  Khi fragmentation VƯỢT QUÁ giới hạn → kích hoạt Compact

  → Di chuyển LIVE objects về MỘT ĐẦU
  → Cho tới khi tất cả live objects liền kề
  → Clean up memory CÒN LẠI (ở đầu kia)

  ┌─── TRƯỚC COMPACT ────────────────────────────────────┐
  │  ┌──┬──┬──┬──┬──┬──┬──┬──┬──┬──┐                    │
  │  │A │  │░░│C │  │░░│  │E │░░│  │  ← fragmented     │
  │  └──┴──┴──┴──┴──┴──┴──┴──┴──┴──┘                    │
  └──────────────────────────────────────────────────────┘

  ┌─── SAU COMPACT ──────────────────────────────────────┐
  │  ┌──┬──┬──┬──┬──┬──┬──┬──┬──┬──┐                    │
  │  │A │C │E │  │  │  │  │  │  │  │  ← compacted!     │
  │  └──┴──┴──┴──┴──┴──┴──┴──┴──┴──┘                    │
  │  ├─ live ─┤├──── free (liền mạch) ─────┤            │
  │                                                      │
  │  ✅ Không còn fragmentation!                         │
  │  ✅ Memory liền mạch → allocation nhanh hơn         │
  └──────────────────────────────────────────────────────┘
```

---

## 3. V8 Memory Spaces (AllocationSpace)

```
V8 MEMORY SPACES:
═══════════════════════════════════════════════════════════════

  ┌────────────────┬────────────────────────────────────────┐
  │ Space          │ Mô tả                                  │
  ├────────────────┼────────────────────────────────────────┤
  │ RO_SPACE       │ Read-Only: objects KHÔNG THAY ĐỔI     │
  │                │ (immutable objects)                     │
  ├────────────────┼────────────────────────────────────────┤
  │ NEW_SPACE      │ Young Gen: dùng cho Scavenge copy alg │
  │                │ (From + To spaces)                     │
  ├────────────────┼────────────────────────────────────────┤
  │ OLD_SPACE      │ Old Gen: objects THƯỜNG TRÚ (lâu dài) │
  ├────────────────┼────────────────────────────────────────┤
  │ CODE_SPACE     │ Old Gen: chứa CODE objects             │
  │                │ (compiled JavaScript)                   │
  ├────────────────┼────────────────────────────────────────┤
  │ MAP_SPACE      │ Old Gen: chứa MAP objects              │
  │                │ (hidden classes / shapes)               │
  ├────────────────┼────────────────────────────────────────┤
  │ LO_SPACE       │ Old Gen: objects có SIZE LỚN           │
  │                │ (Large Object Space)                    │
  ├────────────────┼────────────────────────────────────────┤
  │ NEW_LO_SPACE   │ Young Gen: objects SIZE LỚN            │
  │                │ (New Large Object Space)                │
  └────────────────┴────────────────────────────────────────┘

  PHÂN BỐ:
  ┌──────────────────────────────────────────────────────────┐
  │ Young Generation:                                        │
  │   NEW_SPACE (From + To) + NEW_LO_SPACE                  │
  │                                                          │
  │ Old Generation:                                          │
  │   OLD_SPACE + CODE_SPACE + MAP_SPACE + LO_SPACE         │
  │                                                          │
  │ Immutable:                                               │
  │   RO_SPACE                                               │
  └──────────────────────────────────────────────────────────┘
```

```c
// V8 Source Code — AllocationSpace enum
enum AllocationSpace {
  RO_SPACE,       // Immutable object space
  NEW_SPACE,      // Young gen — Scavenge copy algorithm
  OLD_SPACE,      // Old gen — long-lived objects
  CODE_SPACE,     // Old gen — compiled code objects
  MAP_SPACE,      // Old gen — map objects (hidden classes)
  LO_SPACE,       // Old gen — large objects
  NEW_LO_SPACE,   // Young gen — large objects

  FIRST_SPACE = RO_SPACE,
  LAST_SPACE = NEW_LO_SPACE,
  FIRST_GROWABLE_PAGED_SPACE = OLD_SPACE,
  LAST_GROWABLE_PAGED_SPACE = MAP_SPACE
};
```

---

## 4. Incremental Marking & Concurrent Marking

> **🎯 Giải quyết "stop-the-world" → marking không chặn JS execution**

```
MARKING EVOLUTION:
═══════════════════════════════════════════════════════════════

  ① STOP-THE-WORLD (trước 2011):
  ┌──────────────────────────────────────────────────────────┐
  │ JS: ████████████│          STOP          │████████████   │
  │ GC:             │██████████████████████ │               │
  │                  ↑ PAUSE AppLICATION ↑                  │
  │                                                          │
  │ ❌ Mark large heap → HÀNG TRĂM ms                      │
  │ ❌ App bị ĐỨNG HÌNH                                     │
  │ ❌ Performance issue nghiêm trọng                       │
  └──────────────────────────────────────────────────────────┘

  ② INCREMENTAL MARKING (2011):
  ┌──────────────────────────────────────────────────────────┐
  │ JS: ████│  │████│  │████│  │████│  │████│  │████       │
  │ GC:     │██│    │██│    │██│    │██│    │██│            │
  │          ↑ small  ↑ small  ↑ small  ↑ small             │
  │          modules  modules  modules  modules              │
  │                                                          │
  │ ✅ Chia marking thành NHIỀU MODULES NHỎ                │
  │ ✅ JS logic chạy XEN KẼ giữa các modules               │
  │ ✅ Tránh app pause DÀI                                  │
  │ ⚠️ Tổng thời gian GC CÓ THỂ dài hơn                  │
  └──────────────────────────────────────────────────────────┘

  ③ CONCURRENT MARKING (2018 — breakthrough!):
  ┌──────────────────────────────────────────────────────────┐
  │ JS:    ████████████████████████████████████████          │
  │                                                          │
  │ GC:    ████████████████████████████████████████          │
  │        (separate thread)                                 │
  │                                                          │
  │ ★ JS và GC chạy ĐỒNG THỜI (concurrent)                │
  │ ★ GC scan + mark objects trên THREAD RIÊNG             │
  │ ★ JS KHÔNG BỊ ẢNH HƯỞNG                               │
  │ ★ Performance tốt nhất!                                │
  └──────────────────────────────────────────────────────────┘

  TIMELINE:
  ┌──────────┬──────────────┬──────────────────────────────┐
  │ Năm      │ Technique    │ Đặc điểm                     │
  ├──────────┼──────────────┼──────────────────────────────┤
  │ < 2011   │ Stop-the-    │ JS DỪNG hoàn toàn khi GC   │
  │          │ world        │ Hàng trăm ms pause          │
  ├──────────┼──────────────┼──────────────────────────────┤
  │ 2011     │ Incremental  │ GC chia nhỏ, JS chạy xen kẽ│
  │          │ Marking      │ Giảm pause time             │
  ├──────────┼──────────────┼──────────────────────────────┤
  │ 2018     │ Concurrent   │ GC thread RIÊNG, JS + GC   │
  │          │ Marking ★   │ chạy ĐỒNG THỜI              │
  └──────────┴──────────────┴──────────────────────────────┘
```

---

## 5. Memory Leak — 4 nguyên nhân phổ biến

> **🎯 Variables không thể GC → memory tăng liên tục → leak**

```
4 NGUYÊN NHÂN MEMORY LEAK:
═══════════════════════════════════════════════════════════════

  ① UNDECLARED GLOBAL VARIABLE (biến toàn cục vô tình)
  ② setInterval QUÊN cancel
  ③ DOM REFERENCE sau khi element bị xóa
  ④ CLOSURE sử dụng không hợp lý
```

### ① Undeclared Global Variable

```javascript
// ❌ BAD: vô tình tạo global variable
function doSomething() {
  name = "hello"; // KHÔNG có var/let/const
  // → name trở thành window.name (GLOBAL!)
  // → Không bao giờ được GC cho tới khi page unload
}

// ✅ GOOD: khai báo đúng scope
function doSomething() {
  let name = "hello"; // local → GC khi function kết thúc
}

// ✅ GOOD: dùng 'use strict' để ngăn
("use strict");
function doSomething() {
  name = "hello"; // ReferenceError! (bắt lỗi ngay)
}
```

### ② setInterval quên cancel

```javascript
// ❌ BAD: setInterval reference external variable → never GC
let someData = getData();
setInterval(() => {
  var node = document.getElementById("Node");
  if (node) {
    node.innerHTML = JSON.stringify(someData);
    // someData KHÔNG BAO GIỜ được GC
    // vì interval vẫn reference nó
  }
}, 1000);
// Quên clearInterval → someData leak VĨNH VIỄN!

// ✅ GOOD: lưu ID và clear khi không cần
let intervalId = setInterval(() => {
  /* ... */
}, 1000);
// Khi không cần:
clearInterval(intervalId);
```

### ③ DOM Reference sau khi xóa

```javascript
// ❌ BAD: giữ reference tới DOM element đã bị xóa
let button = document.getElementById("myButton");
document.body.removeChild(button);
// button ĐÃ XÓA khỏi DOM
// NHƯNG variable button VẪN GIỮ reference
// → DOM node KHÔNG ĐƯỢC GC!

// ✅ GOOD: clear reference sau khi xóa
let button = document.getElementById("myButton");
document.body.removeChild(button);
button = null; // Clear reference → cho phép GC
```

### ④ Closure sử dụng không hợp lý

```javascript
// ❌ BAD: closure giữ reference tới biến không cần thiết
function outer() {
  let largeData = new Array(1000000).fill("x");

  return function inner() {
    // inner closure reference largeData
    // → largeData KHÔNG ĐƯỢC GC cho tới khi
    //   inner function bị hủy
    console.log(largeData.length);
  };
}
let leak = outer(); // largeData tồn tại trong memory
// leak = null;      // Phải clear để GC largeData

// ✅ GOOD: chỉ giữ data cần thiết
function outer() {
  let largeData = new Array(1000000).fill("x");
  let length = largeData.length; // Chỉ lấy giá trị cần

  return function inner() {
    console.log(length); // Không reference largeData
  };
  // largeData có thể được GC khi outer() kết thúc
}
```

```
MEMORY LEAK — TÓM TẮT:
═══════════════════════════════════════════════════════════════

  ┌─────┬──────────────────────┬─────────────────────────────┐
  │ #   │ Nguyên nhân          │ Cách phòng tránh            │
  ├─────┼──────────────────────┼─────────────────────────────┤
  │ ①  │ Undeclared global    │ Dùng let/const, 'use strict'│
  │     │ variable              │                             │
  ├─────┼──────────────────────┼─────────────────────────────┤
  │ ②  │ setInterval quên     │ Lưu ID, clearInterval()     │
  │     │ cancel               │ khi không cần               │
  ├─────┼──────────────────────┼─────────────────────────────┤
  │ ③  │ DOM reference sau    │ Set reference = null         │
  │     │ khi xóa element      │ sau khi remove              │
  ├─────┼──────────────────────┼─────────────────────────────┤
  │ ④  │ Closure không hợp lý │ Chỉ capture biến CẦN       │
  │     │                      │ Clear closure khi xong      │
  └─────┴──────────────────────┴─────────────────────────────┘
```

---

## 6. Tóm Tắt & Câu Hỏi Phỏng Vấn

### Quick Reference

```
V8 GARBAGE COLLECTION — QUICK REFERENCE:
═══════════════════════════════════════════════════════════════

  GENERATIONAL GC: Heap = Young Gen + Old Gen

  YOUNG GENERATION:
    Algorithm: Scavenge GC (From ↔ To space)
    Objects: ngắn hạn, size nhỏ
    Process: From đầy → copy sống sang To → swap

  OLD GENERATION:
    Promotion: Scavenge survivor + To > 25%
    Algorithms: Mark-Sweep + Mark-Compact
    Mark-Sweep: duyệt all → mark sống → hủy không mark
    Mark-Compact: di chuyển live objects → 1 đầu → free phần còn lại

  V8 SPACES: RO / NEW / OLD / CODE / MAP / LO / NEW_LO

  MARKING EVOLUTION:
    Stop-the-world → Incremental (2011) → Concurrent (2018)

  MEMORY LEAKS:
    ① Global var vô tình  ② setInterval quên cancel
    ③ DOM ref sau xóa     ④ Closure không hợp lý
```

### Câu Hỏi Phỏng Vấn Thường Gặp

**1. V8 GC hoạt động như thế nào?**

> V8 dùng **Generational GC**: chia heap thành **Young Generation** (object ngắn hạn, dùng Scavenge) và **Old Generation** (object lâu dài, dùng Mark-Sweep + Mark-Compact). Young Gen chia From/To space → copy sống → swap. Old Gen: mark objects sống → sweep objects chết → compact khi fragmentation nhiều.

**2. Scavenge algorithm hoạt động ra sao?**

> Young Gen memory chia 2: **From Space** (đang dùng) + **To Space** (trống). From đầy → GC bắt đầu → kiểm tra From → **copy objects sống sang To** → hủy objects chết → **swap From↔To** → GC kết thúc. Ưu: nhanh cho objects ngắn hạn. Nhược: dùng gấp đôi memory.

**3. Khi nào object chuyển từ Young Gen sang Old Gen?**

> 2 điều kiện: ① Object đã **sống sót qua** Scavenge algorithm (đã trải qua 1 lần GC). ② Objects trong To Space chiếm **>25%** tổng capacity → chuyển sang Old Gen để không ảnh hưởng memory allocation.

**4. Mark-Sweep vs Mark-Compact khác gì?**

> **Mark-Sweep**: duyệt tất cả objects → mark sống → hủy không mark. Vấn đề: tạo **memory fragmentation**. **Mark-Compact**: sau Mark-Sweep, khi fragmentation vượt giới hạn → di chuyển live objects về **1 đầu liền kề** → free memory phần còn lại → **không fragmentation**.

**5. Incremental Marking vs Concurrent Marking?**

> **Stop-the-world** (trước 2011): JS dừng hoàn toàn khi GC, hàng trăm ms. **Incremental** (2011): chia marking thành modules nhỏ, JS chạy xen kẽ, giảm pause. **Concurrent** (2018, breakthrough): GC chạy trên **thread riêng**, JS và GC chạy **đồng thời** → performance tốt nhất.

**6. 4 nguyên nhân Memory Leak phổ biến?**

> ① **Undeclared global variable**: quên var/let/const → biến global → never GC. ② **setInterval quên cancel**: interval reference biến ngoài → biến không GC. ③ **DOM reference sau khi xóa**: giữ reference JS tới DOM element đã remove. ④ **Closure không hợp lý**: closure capture biến lớn không cần thiết → biến tồn tại trong memory.

**7. Làm sao phòng tránh Memory Leak?**

> ① Dùng `let/const` + `'use strict'`. ② Lưu interval ID, `clearInterval()` khi không cần. ③ Set reference = `null` sau removeChild. ④ Closure chỉ capture biến CẦN THIẾT, clear closure reference khi xong. ⑤ Dùng Chrome DevTools **Memory panel** để detect leaks.

**8. V8 có những memory spaces nào?**

> 7 spaces: **RO_SPACE** (immutable), **NEW_SPACE** (Young Gen — Scavenge), **OLD_SPACE** (Old Gen — long-lived), **CODE_SPACE** (compiled code), **MAP_SPACE** (hidden classes), **LO_SPACE** (large objects), **NEW_LO_SPACE** (Young Gen large objects).

---

## Checklist Học Tập

- [ ] Hiểu V8 Generational GC (Young Gen + Old Gen)
- [ ] Biết Scavenge algorithm (From ↔ To swap)
- [ ] Biết 2 điều kiện promote Young → Old Gen
- [ ] Hiểu Mark-Sweep (mark sống, hủy không mark)
- [ ] Hiểu Mark-Compact (giải quyết fragmentation)
- [ ] Biết 7 V8 Memory Spaces (AllocationSpace)
- [ ] Hiểu evolution: Stop-the-world → Incremental → Concurrent
- [ ] Biết 4 nguyên nhân Memory Leak + cách phòng tránh
- [ ] Biết dùng Chrome DevTools Memory panel

---

_Cập nhật lần cuối: Tháng 2, 2026_
