# React Min Heap — Deep Dive!

> **Chủ đề**: Min Heap trong React Scheduler — SchedulerMinHeap.js
> **Ngôn ngữ**: Tiếng Việt — giải thích cực kỳ chi tiết!
> **Phương châm**: Tự viết lại bằng tay — KHÔNG dùng thư viện!
> **Nguồn**: "React min heap" + hình minh họa gốc

---

## Mục Lục

1. [§1. Kiến Thức Nền — Binary Tree + Complete Binary Tree](#1)
2. [§2. Binary Heap + Min Heap](#2)
3. [§3. Min Heap ↔ Array Mapping](#3)
4. [§4. Tại Sao React Dùng Min Heap?](#4)
5. [§5. push + siftUp — Chèn Node](#5)
6. [§6. pop + siftDown — Xóa Root](#6)
7. [§7. peek + compare — Lấy Min](#7)
8. [§8. Toán Tử >>> — Unsigned Right Shift](#8)
9. [§9. halfLength — Tại Sao Chỉ So Sánh Nửa?](#9)
10. [§10. Sơ Đồ Tự Vẽ](#10)
11. [§11. Tự Viết — MinHeapEngine](#11)
12. [§12. Câu Hỏi Luyện Tập](#12)

---

## §1. Kiến Thức Nền — Binary Tree + Complete Binary Tree!

```
  BINARY TREE (CÂY NHỊ PHÂN):
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  ĐỊNH NGHĨA:                                                  │
  │  → Mỗi node có TỐI ĐA 2 nhánh con!                        │
  │  → Gọi là "left subtree" và "right subtree"!               │
  │  → Có thứ tự TRÁI-PHẢI, không được đảo!                    │
  │                                                              │
  │  VÍ DỤ:                                                       │
  │            (A)                                                │
  │           /   \                                               │
  │         (B)   (C)       ← Mỗi node tối đa 2 con!          │
  │        /  \     \                                             │
  │      (D)  (E)   (F)                                          │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘

  COMPLETE BINARY TREE (CÂY NHỊ PHÂN HOÀN CHỈNH):
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  ĐỊNH NGHĨA:                                                  │
  │  → Tất cả tầng (trừ tầng cuối) PHẢI ĐẦY ĐỦ!             │
  │  → Tầng cuối: hoặc đầy, hoặc thiếu MỘT SỐ node BÊN PHẢI!│
  │  → Node được điền TỪ TRÁI SANG PHẢI!                       │
  │                                                              │
  │  ✅ HOÀN CHỈNH:           ✅ HOÀN CHỈNH:                    │
  │        (1)                      (1)                          │
  │       /   \                    /   \                         │
  │     (2)   (3)                (2)   (3)                       │
  │    /  \                     /  \   /  \                      │
  │  (4)  (5)                 (4) (5)(6) (7)                     │
  │  → Tầng cuối thiếu phải  → Tầng cuối ĐẦY ĐỦ!            │
  │                                                              │
  │  ❌ KHÔNG HOÀN CHỈNH:                                        │
  │        (1)                                                    │
  │       /   \                                                   │
  │     (2)   (3)                                                 │
  │       \                                                       │
  │       (5)   ← Thiếu node BÊN TRÁI trước! ❌               │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```

---

## §2. Binary Heap + Min Heap!

```
  BINARY HEAP (ĐỐNG NHỊ PHÂN):
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  ĐỊNH NGHĨA:                                                  │
  │  → Là complete binary tree ĐẶCBIỆT!                        │
  │  → Thỏa mãn HEAP PROPERTY:                                  │
  │    → Cha LUÔN có quan hệ cố định với con!                  │
  │    → Trái và Phải đều là binary heap!                      │
  │                                                              │
  │  2 LOẠI:                                                      │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │                                                      │    │
  │  │  MAX HEAP:                MIN HEAP:                   │    │
  │  │  Cha >= Con!              Cha <= Con!                  │    │
  │  │                                                      │    │
  │  │       (25)                    (2)                     │    │
  │  │      /    \                  /   \                    │    │
  │  │    (17)   (12)             (7)   (5)                  │    │
  │  │   /  \    /               / \   / \                   │    │
  │  │ (7) (5) (3)            (12)(22)(17)(25)               │    │
  │  │                                                      │    │
  │  │ → Root = GIÁ TRỊ       → Root = GIÁ TRỊ           │    │
  │  │   LỚN NHẤT!              NHỎ NHẤT!                  │    │
  │  │                                                      │    │
  │  │ React dùng MIN HEAP! ← ĐÂY!                       │    │
  │  │                                                      │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```

---

## §3. Min Heap ↔ Array Mapping!

```
  MAPPING:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  CÂY:                                                         │
  │              (2)  index=0                                     │
  │             /   \                                             │
  │           (7)   (5)    index=1, index=2                      │
  │          / \    / \                                           │
  │       (12)(22)(17)(25)  index=3,4,5,6                        │
  │                                                              │
  │  MẢNG:                                                        │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ index:  0    1    2    3    4    5    6              │    │
  │  │ value: [2]  [7]  [5]  [12] [22] [17] [25]          │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  CÔNG THỨC:                                                    │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ Cho node tại index i:                                │    │
  │  │                                                      │    │
  │  │ Parent index  = (i - 1) >>> 1   (= ⌊(i-1)/2⌋)    │    │
  │  │ Left child    = (i + 1) * 2 - 1 (= 2i + 1)        │    │
  │  │ Right child   = (i + 1) * 2     (= 2i + 2)        │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  KIỂM TRA:                                                    │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ Node 7 (index=1):                                    │    │
  │  │   parent = (1-1)>>>1 = 0 → node 2 ✅               │    │
  │  │   left   = (1+1)*2-1 = 3 → node 12 ✅              │    │
  │  │   right  = (1+1)*2   = 4 → node 22 ✅              │    │
  │  │                                                      │    │
  │  │ Node 5 (index=2):                                    │    │
  │  │   parent = (2-1)>>>1 = 0 → node 2 ✅               │    │
  │  │   left   = (2+1)*2-1 = 5 → node 17 ✅              │    │
  │  │   right  = (2+1)*2   = 6 → node 25 ✅              │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```

---

## §4. Tại Sao React Dùng Min Heap?

```
  TẠI SAO MIN HEAP?
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  REACT TASK SYSTEM:                                           │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ → React chia update thành NHIỀU task nhỏ!           │    │
  │  │ → Mỗi task = { sortIndex, id, callback, ... }      │    │
  │  │ → sortIndex = expirationTime cho taskQueue!         │    │
  │  │ → expirationTime NHỎ → HẾT HẠN SỚM → URGENT!   │    │
  │  │ → Cần lấy task URGENT nhất = GIÁ TRỊ NHỎ NHẤT!  │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  MIN HEAP GIẢI QUYẾT:                                         │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ → peek() = O(1) → lấy min NGAY LẬP TỨC!          │    │
  │  │ → push() = O(log n) → thêm task nhanh!            │    │
  │  │ → pop()  = O(log n) → xóa min nhanh!              │    │
  │  │                                                      │    │
  │  │ SO SÁNH:                                             │    │
  │  │ ┌─────────────┬──────────┬──────────┬────────┐     │    │
  │  │ │ Thao tác    │ Min Heap │ Array    │ Sorted │     │    │
  │  │ ├─────────────┼──────────┼──────────┼────────┤     │    │
  │  │ │ Lấy min     │ O(1)     │ O(n)     │ O(1)   │     │    │
  │  │ │ Thêm        │ O(log n) │ O(1)     │ O(n)   │     │    │
  │  │ │ Xóa min     │ O(log n) │ O(n)     │ O(1)*  │     │    │
  │  │ └─────────────┴──────────┴──────────┴────────┘     │    │
  │  │                                                      │    │
  │  │ → Min Heap CÂN BẰNG tốt nhất cho cả 3 thao tác!  │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```

---

## §5. push + siftUp — Chèn Node!

```
  PUSH + SIFT UP:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  LOGIC:                                                       │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ 1. Thêm node vào CUỐI mảng (cuối cây!)             │    │
  │  │ 2. siftUp: so sánh với CHA, nếu NHỎ HƠN → SWAP! │    │
  │  │ 3. Tiếp tục đi LÊN cho đến khi cha NHỎ hơn!      │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  VÍ DỤ: Thêm node 1 vào heap [2, 7, 5, 12, 22, 17]:       │
  │                                                              │
  │  Bước 1: Thêm vào cuối:                                      │
  │              (2)                                              │
  │             /   \                                             │
  │           (7)   (5)                                           │
  │          / \    / \                                           │
  │       (12)(22)(17) [1] ← THÊM ĐÂY! index=6                │
  │                                                              │
  │  Bước 2: siftUp — so với cha (index=2, value=5):            │
  │  1 < 5? → YES! SWAP!                                        │
  │              (2)                                              │
  │             /   \                                             │
  │           (7)   [1] ← SWAP LÊN!                            │
  │          / \    / \                                           │
  │       (12)(22)(17)(5)                                         │
  │                                                              │
  │  Bước 3: siftUp — so với cha (index=0, value=2):            │
  │  1 < 2? → YES! SWAP!                                        │
  │             [1] ← ROOT MỚI!                                 │
  │             /   \                                             │
  │           (7)   (2)                                           │
  │          / \    / \                                           │
  │       (12)(22)(17)(5)                                         │
  │                                                              │
  │  Kết quả: [1, 7, 2, 12, 22, 17, 5]                          │
  │                                                              │
  │  SOURCE CODE:                                                 │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ function push(heap, node) {                          │    │
  │  │   const index = heap.length;                         │    │
  │  │   heap.push(node);           // Thêm cuối!         │    │
  │  │   siftUp(heap, node, index); // Nổi lên!           │    │
  │  │ }                                                    │    │
  │  │                                                      │    │
  │  │ function siftUp(heap, node, i) {                     │    │
  │  │   let index = i;                                     │    │
  │  │   while (index > 0) {                                │    │
  │  │     // Tìm cha: (index - 1) >>> 1                   │    │
  │  │     const parentIndex = (index - 1) >>> 1;           │    │
  │  │     const parent = heap[parentIndex];                │    │
  │  │     if (compare(parent, node) > 0) {                 │    │
  │  │       // Cha LỚN hơn → SWAP!                      │    │
  │  │       heap[parentIndex] = node;                      │    │
  │  │       heap[index] = parent;                          │    │
  │  │       index = parentIndex; // Tiếp tục lên!        │    │
  │  │     } else {                                         │    │
  │  │       return; // Cha NHỎ hơn → DỪNG!              │    │
  │  │     }                                                │    │
  │  │   }                                                  │    │
  │  │ }                                                    │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```

---

## §6. pop + siftDown — Xóa Root!

```
  POP + SIFT DOWN:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  LOGIC:                                                       │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ 1. Lấy node CUỐI (last) thay thế ROOT!             │    │
  │  │ 2. siftDown: so sánh với 2 CON!                    │    │
  │  │ 3. SWAP với con NHỎ NHẤT!                          │    │
  │  │ 4. Tiếp tục đi XUỐNG cho đến khi 2 con LỚN hơn! │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  VÍ DỤ: pop từ heap [2, 5, 7, 12, 22, 17, 25]:            │
  │                                                              │
  │  Bước 1: Lấy last=25, thay root=2:                           │
  │             [25] ← THAY ROOT!                                │
  │             /   \                                             │
  │           (5)   (7)                                           │
  │          / \    /                                              │
  │       (12)(22)(17)                                            │
  │                                                              │
  │  Bước 2: siftDown — so với 2 con (5 và 7):                  │
  │  → 5 < 7 → con nhỏ nhất = 5!                               │
  │  → 25 > 5? YES → SWAP!                                      │
  │              (5) ← ROOT MỚI!                                │
  │             /   \                                             │
  │          [25]   (7)                                           │
  │          / \    /                                              │
  │       (12)(22)(17)                                            │
  │                                                              │
  │  Bước 3: siftDown — so với 2 con (12 và 22):                │
  │  → 12 < 22 → con nhỏ nhất = 12!                            │
  │  → 25 > 12? YES → SWAP!                                     │
  │              (5)                                              │
  │             /   \                                             │
  │          (12)   (7)                                           │
  │          / \    /                                              │
  │       [25](22)(17)                                            │
  │                                                              │
  │  Bước 4: 25 là leaf → DỪNG!                                  │
  │  Kết quả: [5, 12, 7, 25, 22, 17]                            │
  │  Return: {sortIndex: 2} ← node đã pop!                     │
  │                                                              │
  │  SOURCE CODE:                                                 │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ function pop(heap) {                                 │    │
  │  │   if (heap.length === 0) return null;                │    │
  │  │   const first = heap[0];        // Root!            │    │
  │  │   const last = heap.pop();      // Last element!    │    │
  │  │   if (last !== first) {                              │    │
  │  │     heap[0] = last;             // Thay root!      │    │
  │  │     siftDown(heap, last, 0);    // Chìm xuống!     │    │
  │  │   }                                                  │    │
  │  │   return first;                                      │    │
  │  │ }                                                    │    │
  │  │                                                      │    │
  │  │ function siftDown(heap, node, i) {                   │    │
  │  │   let index = i;                                     │    │
  │  │   const length = heap.length;                        │    │
  │  │   const halfLength = length >>> 1; // ★ CHỈ NỬA! │    │
  │  │                                                      │    │
  │  │   while (index < halfLength) {                       │    │
  │  │     const leftIndex = (index + 1) * 2 - 1;          │    │
  │  │     const left = heap[leftIndex];                    │    │
  │  │     const rightIndex = leftIndex + 1;                │    │
  │  │     const right = heap[rightIndex];                  │    │
  │  │                                                      │    │
  │  │     if (compare(left, node) < 0) {                   │    │
  │  │       // Left < node!                                │    │
  │  │       if (rightIndex < length &&                     │    │
  │  │           compare(right, left) < 0) {                │    │
  │  │         // Right < Left → swap RIGHT!              │    │
  │  │         heap[index] = right;                         │    │
  │  │         heap[rightIndex] = node;                     │    │
  │  │         index = rightIndex;                          │    │
  │  │       } else {                                       │    │
  │  │         // Left nhỏ nhất → swap LEFT!              │    │
  │  │         heap[index] = left;                          │    │
  │  │         heap[leftIndex] = node;                      │    │
  │  │         index = leftIndex;                           │    │
  │  │       }                                              │    │
  │  │     } else if (rightIndex < length &&                │    │
  │  │                compare(right, node) < 0) {           │    │
  │  │       // Left >= node, nhưng Right < node!          │    │
  │  │       heap[index] = right;                           │    │
  │  │       heap[rightIndex] = node;                       │    │
  │  │       index = rightIndex;                            │    │
  │  │     } else {                                         │    │
  │  │       return; // Cả 2 con ĐỀU lớn hơn → DỪNG!   │    │
  │  │     }                                                │    │
  │  │   }                                                  │    │
  │  │ }                                                    │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```

---

## §7. peek + compare — Lấy Min!

```
  PEEK + COMPARE:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  peek — O(1)! Đơn giản nhất!                                │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ function peek(heap) {                                │    │
  │  │   return heap.length === 0 ? null : heap[0];         │    │
  │  │ }                                                    │    │
  │  │                                                      │    │
  │  │ → Root LUÔN là min! Lấy index 0 → XONG!           │    │
  │  │ → Không cần tìm kiếm!                              │    │
  │  │ → Đây là LÝ DO chính dùng Min Heap!               │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  compare — Tiêu chí so sánh!                                  │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ function compare(a, b) {                             │    │
  │  │   // Ưu tiên 1: sortIndex!                         │    │
  │  │   const diff = a.sortIndex - b.sortIndex;            │    │
  │  │   // Ưu tiên 2: id (tiebreaker!)                   │    │
  │  │   return diff !== 0 ? diff : a.id - b.id;           │    │
  │  │ }                                                    │    │
  │  │                                                      │    │
  │  │ → sortIndex giống nhau? → so sánh id!              │    │
  │  │ → id NHỎ hơn = tạo TRƯỚC = ưu tiên hơn!          │    │
  │  │ → FIFO cho cùng priority!                           │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  5 HÀM TỔNG KẾT:                                             │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ push(heap, node) → Chèn + siftUp      → O(log n) │    │
  │  │ pop(heap)         → Xóa root + siftDown → O(log n) │    │
  │  │ siftUp(heap,n,i)  → Nổi lên (swap cha)  → helper  │    │
  │  │ siftDown(heap,n,i)→ Chìm xuống (swap con)→ helper  │    │
  │  │ peek(heap)        → Lấy root             → O(1)   │    │
  │  │ compare(a,b)      → So sánh sortIndex+id → helper  │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```

---

## §8. Toán Tử >>> — Unsigned Right Shift!

```
  >>> (UNSIGNED RIGHT SHIFT):
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  CÁCH HOẠT ĐỘNG: x >>> 1 = DỊCH PHẢI 1 bit!               │
  │                                                              │
  │  VÍ DỤ: 5 >>> 1                                              │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ 5 = 00000000000000000000000000000101 (32 bits)       │    │
  │  │                                                      │    │
  │  │ Dịch phải 1 bit:                                     │    │
  │  │     00000000000000000000000000000010 ← bỏ bit cuối │    │
  │  │                                     ↑ thêm 0 đầu   │    │
  │  │ = 2                                                  │    │
  │  │ → 5 >>> 1 = 2                                       │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  VÍ DỤ: 4 >>> 1                                              │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ 4 = 00000000000000000000000000000100                 │    │
  │  │ →   00000000000000000000000000000010 = 2             │    │
  │  │ → 4 >>> 1 = 2                                       │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  BẢNG:                                                        │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ 1 >>> 1 = 0     (1/2 = 0.5 → 0)                    │    │
  │  │ 2 >>> 1 = 1     (2/2 = 1)                           │    │
  │  │ 3 >>> 1 = 1     (3/2 = 1.5 → 1)                    │    │
  │  │ 4 >>> 1 = 2     (4/2 = 2)                           │    │
  │  │ 5 >>> 1 = 2     (5/2 = 2.5 → 2)                    │    │
  │  │ 6 >>> 1 = 3     (6/2 = 3)                           │    │
  │  │ 7 >>> 1 = 3     (7/2 = 3.5 → 3)                    │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  KẾT LUẬN: x >>> 1 = Math.floor(x / 2)!                    │
  │  → NHANH hơn Math.floor vì là bitwise operation!           │
  │                                                              │
  │  DÙNG TRONG REACT:                                            │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ parentIndex = (index - 1) >>> 1                      │    │
  │  │ = Math.floor((index - 1) / 2)                       │    │
  │  │ = Tìm index CHA của node tại index!                │    │
  │  │                                                      │    │
  │  │ halfLength = length >>> 1                            │    │
  │  │ = Math.floor(length / 2)                             │    │
  │  │ = Nửa chiều dài mảng (cho siftDown!)              │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```

---

## §9. halfLength — Tại Sao Chỉ So Sánh Nửa?

```
  HALFENGTH:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  CÂU HỎI: Tại sao siftDown dùng halfLength thay vì length? │
  │                                                              │
  │  while (index < halfLength) thay vì while (index < length)  │
  │                                                              │
  │  GIẢI THÍCH:                                                  │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ → siftDown chỉ cần so sánh với PARENT nodes!      │    │
  │  │ → LEAF nodes KHÔNG CÓ CON → không cần so sánh!   │    │
  │  │ → Trong complete binary tree:                       │    │
  │  │   → PARENT nodes = nửa đầu mảng!                  │    │
  │  │   → LEAF nodes = nửa sau mảng!                    │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  CHỨNG MINH TOÁN HỌC:                                        │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ Parent index = x                                     │    │
  │  │ Left child = 2x + 1                                  │    │
  │  │ Right child = 2x + 2                                 │    │
  │  │                                                      │    │
  │  │ Mỗi lần siftDown: index = 2x + 1 hoặc 2x + 2     │    │
  │  │ → index TỐI ĐA = 2x + 2                           │    │
  │  │ → 2x + 2 <= length - 1 (phải trong mảng!)         │    │
  │  │ → x <= (length - 3) / 2                             │    │
  │  │ → x < length / 2 - 0.5                              │    │
  │  │ → x < length >>> 1 (= halfLength!)                 │    │
  │  │                                                      │    │
  │  │ → Nếu index >= halfLength → node là LEAF!         │    │
  │  │ → LEAF = không có con → DỪNG!                     │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  VÍ DỤ:                                                       │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ heap = [2, 7, 5, 12, 22, 17, 25]                    │    │
  │  │ length = 7                                           │    │
  │  │ halfLength = 7 >>> 1 = 3                             │    │
  │  │                                                      │    │
  │  │ index 0,1,2 → PARENT nodes (có con!)              │    │
  │  │ index 3,4,5,6 → LEAF nodes (KHÔNG có con!)        │    │
  │  │                                                      │    │
  │  │              (2)  i=0 ← parent                      │    │
  │  │             /   \                                    │    │
  │  │           (7)   (5)  i=1,2 ← parents               │    │
  │  │          / \    / \                                  │    │
  │  │       (12)(22)(17)(25) i=3,4,5,6 ← LEAVES!        │    │
  │  │                                                      │    │
  │  │ → Chỉ cần so sánh index 0,1,2 (< halfLength=3!)  │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  ★ Đây là optimization của React team (commit history!)     │
  │  → Trước đó dùng index < length → THỪA thao tác!          │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```

---

## §10. Sơ Đồ Tự Vẽ!

### Sơ Đồ 1: Push (siftUp) Step-by-Step

```
  PUSH NODE 1:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  TRƯỚC:                 THÊM 1:              siftUp #1:     │
  │       (2)                  (2)                  (2)          │
  │      /   \                /   \                /   \         │
  │    (7)   (5)            (7)   (5)            (7)  [1]        │
  │   / \    /             / \    / \            / \   / \        │
  │ (12)(22)(17)         (12)(22)(17)[1]       (12)(22)(17)(5)   │
  │                            ↑                   ↑             │
  │                     Thêm cuối!          1<5 → SWAP!         │
  │                                                              │
  │  siftUp #2:                                                   │
  │      [1]  ← 1<2 → SWAP! ROOT MỚI!                          │
  │      /   \                                                    │
  │    (7)   (2)                                                  │
  │   / \    / \                                                  │
  │ (12)(22)(17)(5)                                               │
  │                                                              │
  │  Array: [2,7,5,12,22,17] → [1,7,2,12,22,17,5]              │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```

### Sơ Đồ 2: Pop (siftDown) Step-by-Step

```
  POP ROOT:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  TRƯỚC:           THAY ROOT:         siftDown #1:           │
  │       (2)             [25]                (5)                │
  │      /   \            /   \              /   \               │
  │    (5)   (7)        (5)   (7)         [25]   (7)             │
  │   / \    / \       / \    /           / \    /               │
  │ (12)(22)(17)(25) (12)(22)(17)       (12)(22)(17)             │
  │                    ↑                   ↑                     │
  │               25 thay root!      5<7, 25>5 → SWAP left!    │
  │                                                              │
  │  siftDown #2:                                                 │
  │       (5)                                                     │
  │      /   \                                                    │
  │    (12)   (7)                                                 │
  │   / \    /                                                    │
  │ [25](22)(17)                                                  │
  │  ↑                                                           │
  │  12<22, 25>12 → SWAP left!                                  │
  │  25 là leaf → DỪNG!                                          │
  │                                                              │
  │  Array: [2,5,7,12,22,17,25] → [5,12,7,25,22,17]            │
  │  Return: {sortIndex: 2}                                      │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```

### Sơ Đồ 3: Parent/Leaf Boundary

```
  PARENT vs LEAF:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  heap = [2, 7, 5, 12, 22, 17, 25]  length=7                │
  │  halfLength = 7 >>> 1 = 3                                    │
  │                                                              │
  │  ┌─────────────────────────────────────────────────┐         │
  │  │  PARENTS (index < 3)  │  LEAVES (index >= 3)   │         │
  │  ├───────────────────────┼────────────────────────┤         │
  │  │  [0]=2  [1]=7  [2]=5  │  [3]=12 [4]=22         │         │
  │  │                       │  [5]=17 [6]=25          │         │
  │  │  ↓ CÓ CON!           │  ↓ KHÔNG CÓ CON!      │         │
  │  │  → Cần siftDown!    │  → DỪNG siftDown!      │         │
  │  └───────────────────────┴────────────────────────┘         │
  │                                                              │
  │  CÂY:                                                        │
  │       (2)  ← PARENT [0]                                     │
  │      /   \                                                    │
  │    (7)   (5)  ← PARENTS [1],[2]                             │
  │   / \    / \                                                  │
  │ (12)(22)(17)(25)  ← LEAVES [3],[4],[5],[6]                  │
  │  ═══════════════                                              │
  │  halfLength = 3 → ranh giới PARENT/LEAF!                    │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```

---

## §11. Tự Viết — MinHeapEngine!

```javascript
/**
 * MinHeapEngine — React SchedulerMinHeap.js viết lại!
 * Tự viết bằng tay, trace từng bước!
 */
var MinHeapEngine = (function () {

  // ═══════════════════════════════════
  // COMPARE
  // ═══════════════════════════════════
  function compare(a, b) {
    var diff = a.sortIndex - b.sortIndex;
    return diff !== 0 ? diff : (a.id || 0) - (b.id || 0);
  }

  // ═══════════════════════════════════
  // SIFT UP (nổi lên!)
  // ═══════════════════════════════════
  function siftUp(heap, node, i, trace) {
    var index = i;
    while (index > 0) {
      var parentIndex = (index - 1) >>> 1;
      var parent = heap[parentIndex];
      if (compare(parent, node) > 0) {
        // Parent LỚN hơn → SWAP!
        heap[parentIndex] = node;
        heap[index] = parent;
        if (trace) trace.push(
          'siftUp: SWAP [' + index + ']=' + node.sortIndex +
          ' ↔ [' + parentIndex + ']=' + parent.sortIndex
        );
        index = parentIndex;
      } else {
        if (trace) trace.push(
          'siftUp: STOP! parent[' + parentIndex + ']=' +
          parent.sortIndex + ' <= node=' + node.sortIndex
        );
        return;
      }
    }
    if (trace) trace.push('siftUp: REACHED ROOT!');
  }

  // ═══════════════════════════════════
  // SIFT DOWN (chìm xuống!)
  // ═══════════════════════════════════
  function siftDown(heap, node, i, trace) {
    var index = i;
    var length = heap.length;
    var halfLength = length >>> 1;

    if (trace) trace.push(
      'siftDown: length=' + length +
      ' halfLength=' + halfLength +
      ' (chỉ so sánh PARENT nodes!)'
    );

    while (index < halfLength) {
      var leftIndex = (index + 1) * 2 - 1;
      var left = heap[leftIndex];
      var rightIndex = leftIndex + 1;
      var right = heap[rightIndex];

      if (compare(left, node) < 0) {
        if (rightIndex < length && compare(right, left) < 0) {
          heap[index] = right;
          heap[rightIndex] = node;
          if (trace) trace.push(
            'siftDown: RIGHT[' + rightIndex + ']=' + right.sortIndex +
            ' smallest! SWAP with [' + index + ']'
          );
          index = rightIndex;
        } else {
          heap[index] = left;
          heap[leftIndex] = node;
          if (trace) trace.push(
            'siftDown: LEFT[' + leftIndex + ']=' + left.sortIndex +
            ' smallest! SWAP with [' + index + ']'
          );
          index = leftIndex;
        }
      } else if (rightIndex < length && compare(right, node) < 0) {
        heap[index] = right;
        heap[rightIndex] = node;
        if (trace) trace.push(
          'siftDown: RIGHT[' + rightIndex + ']=' + right.sortIndex +
          ' < node! SWAP with [' + index + ']'
        );
        index = rightIndex;
      } else {
        if (trace) trace.push(
          'siftDown: STOP! Both children >= node=' + node.sortIndex
        );
        return;
      }
    }
    if (trace) trace.push(
      'siftDown: index=' + index + ' >= halfLength=' + halfLength +
      ' → LEAF! STOP!'
    );
  }

  // ═══════════════════════════════════
  // PUSH (thêm node!)
  // ═══════════════════════════════════
  function push(heap, node, trace) {
    var index = heap.length;
    heap.push(node);
    if (trace) trace.push(
      'push: ADD node ' + node.sortIndex + ' at index ' + index
    );
    siftUp(heap, node, index, trace);
  }

  // ═══════════════════════════════════
  // POP (xóa root!)
  // ═══════════════════════════════════
  function pop(heap, trace) {
    if (heap.length === 0) return null;
    var first = heap[0];
    var last = heap.pop();
    if (last !== first) {
      heap[0] = last;
      if (trace) trace.push(
        'pop: REPLACE root=' + first.sortIndex +
        ' with last=' + last.sortIndex
      );
      siftDown(heap, last, 0, trace);
    }
    if (trace) trace.push('pop: RETURN ' + first.sortIndex);
    return first;
  }

  // ═══════════════════════════════════
  // PEEK
  // ═══════════════════════════════════
  function peek(heap) {
    return heap.length === 0 ? null : heap[0];
  }

  // ═══════════════════════════════════
  // UTILITIES
  // ═══════════════════════════════════
  function toArray(heap) {
    return heap.map(function(n) { return n.sortIndex; });
  }

  function drawTree(heap) {
    if (!heap.length) return '(empty)';
    var lines = [];
    var levels = Math.floor(Math.log2(heap.length)) + 1;
    var width = Math.pow(2, levels) * 3;

    for (var level = 0; level < levels; level++) {
      var start = Math.pow(2, level) - 1;
      var end = Math.min(Math.pow(2, level + 1) - 1, heap.length);
      var nodesInLevel = end - start;
      var spacing = Math.floor(width / (nodesInLevel + 1));
      var line = '';
      for (var i = start; i < end; i++) {
        var pad = spacing - String(heap[i].sortIndex).length;
        line += new Array(Math.max(1, pad)).join(' ') +
          '(' + heap[i].sortIndex + ')';
      }
      lines.push(line);
    }
    return lines.join('\n');
  }

  function isValidMinHeap(heap) {
    for (var i = 0; i < heap.length; i++) {
      var leftIndex = (i + 1) * 2 - 1;
      var rightIndex = leftIndex + 1;
      if (leftIndex < heap.length &&
          compare(heap[i], heap[leftIndex]) > 0) return false;
      if (rightIndex < heap.length &&
          compare(heap[i], heap[rightIndex]) > 0) return false;
    }
    return true;
  }

  // ═══════════════════════════════════
  // DEMO
  // ═══════════════════════════════════
  function demo() {
    console.log('╔═══════════════════════════════════════════╗');
    console.log('║  MIN HEAP ENGINE — DEMO                     ║');
    console.log('╚═══════════════════════════════════════════╝');

    var heap = [];
    var trace = [];

    // Push nodes like React does
    console.log('\n--- PUSH PHASE ---');
    var values = [17, 12, 22, 5, 7, 2, 25];
    for (var i = 0; i < values.length; i++) {
      push(heap, { sortIndex: values[i], id: i + 1 }, trace);
      console.log('After push(' + values[i] + '): ' +
        JSON.stringify(toArray(heap)) +
        ' valid=' + isValidMinHeap(heap));
    }

    console.log('\nTrace:');
    trace.forEach(function(t) { console.log('  ' + t); });

    // Tree view
    console.log('\nTree:');
    console.log(drawTree(heap));

    // Pop phase
    console.log('\n--- POP PHASE (sorted output!) ---');
    trace = [];
    var sorted = [];
    while (heap.length) {
      var node = pop(heap, trace);
      sorted.push(node.sortIndex);
      console.log('pop → ' + node.sortIndex +
        '  remaining: ' + JSON.stringify(toArray(heap)));
    }
    console.log('\nSorted: ' + JSON.stringify(sorted));

    console.log('\nPop trace:');
    trace.forEach(function(t) { console.log('  ' + t); });

    // >>> demo
    console.log('\n--- >>> OPERATOR ---');
    for (var x = 1; x <= 7; x++) {
      console.log(x + ' >>> 1 = ' + (x >>> 1) +
        '  (= Math.floor(' + x + '/2) = ' +
        Math.floor(x / 2) + ')');
    }

    console.log('\n╔═══════════════════════════════════════════╗');
    console.log('║  ✅ Demo Complete!                           ║');
    console.log('╚═══════════════════════════════════════════╝');
  }

  return {
    push: push, pop: pop, peek: peek,
    siftUp: siftUp, siftDown: siftDown,
    compare: compare, toArray: toArray,
    drawTree: drawTree, isValidMinHeap: isValidMinHeap,
    demo: demo
  };
})();

// Chạy: MinHeapEngine.demo();
```

---

## §12. Câu Hỏi Luyện Tập!

### ❓ Câu 1: Min Heap là gì?

**Trả lời:**

Min Heap = **Complete Binary Tree** + **Heap Property** (cha <= con)!
- Root = giá trị **NHỎ NHẤT** trong cây!
- Được biểu diễn bằng **ARRAY** (không phải linked nodes!)
- React dùng để lấy task **ưu tiên nhất** bằng O(1)!

### ❓ Câu 2: parentIndex = (index - 1) >>> 1 là gì?

**Trả lời:**

`>>> 1` = unsigned right shift 1 bit = `Math.floor(x / 2)`!
- `(index - 1) >>> 1` = **index CHA** của node tại `index`!
- Ví dụ: node index=5 → cha = (5-1)>>>1 = 4>>>1 = **2** ✅

### ❓ Câu 3: Tại sao siftDown dùng halfLength?

**Trả lời:**

`halfLength = length >>> 1` = **ranh giới** PARENT/LEAF!
- index < halfLength → **PARENT** (có con, cần so sánh!)
- index >= halfLength → **LEAF** (không có con, DỪNG!)
- **Optimization**: tránh so sánh thừa tại leaf nodes!
- Trước đây React dùng `index < length` → đã sửa!

### ❓ Câu 4: compare so sánh theo tiêu chí gì?

**Trả lời:**

```
1. sortIndex (ưu tiên 1!)
   → taskQueue: sortIndex = expirationTime!
   → timerQueue: sortIndex = startTime!

2. id (tiebreaker!)
   → id nhỏ hơn = tạo TRƯỚC = ưu tiên hơn!
   → Đảm bảo FIFO cho cùng priority!
```

### ❓ Câu 5: push() vs Array.push()?

**Trả lời:**

| | Array.push() | Min Heap push() |
|---|---|---|
| **Thêm** | Cuối mảng → XONG! | Cuối + **siftUp**! |
| **Sắp xếp** | KHÔNG! | CÓ! Min lên root! |
| **peek() sau push** | O(n) tìm min! | O(1) lấy heap[0]! |
| **Complexity** | O(1) | O(log n) |

### ❓ Câu 6: pop() làm gì cụ thể?

**Trả lời:**

1. Lấy `first = heap[0]` (root = min!)
2. `last = heap.pop()` (xóa phần tử CUỐI!)
3. `heap[0] = last` (thay root bằng last!)
4. `siftDown(heap, last, 0)` (last chìm xuống vị trí đúng!)
5. Return `first` (giá trị min đã lấy!)

→ Tại sao không xóa root trực tiếp? Vì xóa đầu mảng = O(n) shift! Last thay root + siftDown = O(log n)!

### ❓ Câu 7: Tại sao React dùng Min Heap mà không dùng sorted array?

**Trả lời:**

| Thao tác | Min Heap | Sorted Array |
|---|---|---|
| peek (lấy min) | O(1) | O(1) |
| push (thêm) | **O(log n)** | O(n) ← chèn đúng vị trí! |
| pop (xóa min) | **O(log n)** | O(1) hoặc O(n)* |

→ Sorted array push = O(n) vì phải shift elements!
→ Min Heap **CÂN BẰNG** tốt nhất cho push + pop + peek!

---

> 🎯 **Tổng kết React Min Heap:**
> - **Binary Tree** → Complete Binary Tree → Binary Heap → **Min Heap**!
> - React dùng Min Heap cho **taskQueue** và **timerQueue**!
> - **5 hàm**: push (siftUp), pop (siftDown), peek, compare!
> - **Array mapping**: parent=(i-1)>>>1, left=2i+1, right=2i+2!
> - **>>>**: unsigned right shift = Math.floor(x/2)!
> - **halfLength**: optimization, chỉ so sánh PARENT nodes!
> - **compare**: sortIndex trước, id sau (FIFO tiebreaker!)
> - **MinHeapEngine** tự viết: push/pop với trace + tree visualization!
> - **7 câu hỏi** luyện tập với đáp án chi tiết!
