# 🌲 Min Height BST (AlgoExpert)

> 📖 Code: [Min Height BST.js](./Min%20Height%20BST.js)

---

## 🧠 Bản chất bài toán — Hiểu để NHỚ, không chỉ để GIẢI

> ⚡ **Đọc phần này TRƯỚC. Nếu bạn chỉ nhớ 1 thứ, nhớ phần này.**

### 1️⃣ Analogy — Ví dụ đời thường

```
📚 XẾP SÁCH LÊN KỆ — đây là TẤT CẢ bạn cần nhớ!

  Bạn có 9 cuốn sách đã XẾP THEO SỐ: [1, 2, 5, 7, 10, 13, 14, 15, 22]
  Muốn tổ chức thành cây tìm kiếm THẤP NHẤT có thể!

  Trick: Lấy cuốn Ở GIỮA làm gốc!
    → Cuốn giữa = 10 → làm ROOT!
    → Bên trái (nhỏ hơn): [1, 2, 5, 7]
    → Bên phải (lớn hơn): [13, 14, 15, 22]

  Rồi LÀM LẠI cho mỗi bên:
    → Giữa [1,2,5,7] = 2 → root trái!  
    → Giữa [13,14,15,22] = 14 → root phải!
    → Tiếp tục...

  Giống BINARY SEARCH! Luôn chia đôi → cây cân bằng!
```

### 2️⃣ Recipe — Pick Middle, Recurse

```
📝 RECIPE (3 bước — đệ quy!):

  Bước 1: Tìm phần tử GIỮA mảng → làm ROOT
  Bước 2: Nửa TRÁI → xây subtree trái (đệ quy!)
  Bước 3: Nửa PHẢI → xây subtree phải (đệ quy!)
  Base case: start > end → return null

  Tại sao min height? Vì mỗi lần chia ĐÔI!
  → Mỗi bên ≈ n/2 nodes → cây balanced → height = log(n)!
```

```javascript
// BẢN CHẤT — chỉ vài dòng:
function minHeightBst(array) {
  return build(array, 0, array.length - 1);
}

function build(array, start, end) {
  if (start > end) return null;
  const mid = Math.floor((start + end) / 2);
  const node = new BST(array[mid]);
  node.left = build(array, start, mid - 1);
  node.right = build(array, mid + 1, end);
  return node;
}
```

### 3️⃣ Visual — Hình ảnh ghi vào đầu

```
array = [1, 2, 5, 7, 10, 13, 14, 15, 22]

Bước 1: mid = 4 → root = 10
  [1, 2, 5, 7]  10  [13, 14, 15, 22]
      LEFT       ↑        RIGHT

Bước 2: LEFT [1,2,5,7] → mid=1 → root = 2
  [1]  2  [5, 7]

Bước 3: RIGHT [13,14,15,22] → mid=5 → root = 14
  [13]  14  [15, 22]

Tiếp tục:
  [5, 7] → mid = 5 → node = 5, right = 7
  [15, 22] → mid = 15 → node = 15, right = 22

Kết quả:
           10
          /  \
         2    14
        / \   / \
       1   5 13  15
            \     \
             7    22

Height = 3 (tối thiểu cho 9 nodes!) ✅
```

### 4️⃣ Tại sao lấy GIỮA?

```
❓ "Tại sao giữa cho min height?"

  Mảng sorted: [1, 2, 5, 7, 10, 13, 14, 15, 22]

  Nếu lấy ĐẦU (1):
    1 → 2 → 5 → 7 → ... → cây LỆCH phải! Height = 8!

  Nếu lấy GIỮA (10):
    10 → trái 4 nodes, phải 4 nodes → CÂN BẰNG! Height = 3!

  Phần tử giữa = chia mảng thành 2 NỬA BẰNG NHAU!
  → Mỗi subtree ≈ n/2 → height ≈ log₂(n)!
  → Giống Binary Search!
```

### 5️⃣ Flashcard — Tự kiểm tra

| ❓ Câu hỏi | ✅ Đáp án |
|---|---|
| Input cần gì? | Mảng **SORTED** + **DISTINCT** |
| Lấy phần tử nào làm root? | Phần tử **GIỮA**! |
| Base case? | `start > end` → return null |
| mid = ? | `Math.floor((start + end) / 2)` |
| Recursive call trái? | `build(array, start, mid - 1)` |
| Recursive call phải? | `build(array, mid + 1, end)` |
| Height tối thiểu? | **⌊log₂(n)⌋** |
| Time (cách tối ưu)? | **O(n)** — mỗi node tạo 1 lần |
| Space? | **O(n)** — n nodes |
| Giống thuật toán nào? | **Binary Search!** (chia đôi mỗi lần) |

### 6️⃣ Sai lầm phổ biến

```
❌ SAI LẦM #1: Dùng insert() = O(n log n)!

   Cách 1 (chậm): tìm mid → bst.insert(mid) 
   → Mỗi insert = O(log n), n lần = O(n log n)!

   Cách 2 (nhanh): tìm mid → node = new BST(mid)
   → node.left = recurse(left half)
   → Mỗi node tạo O(1), n lần = O(n)!

─────────────────────────────────────────────────────

❌ SAI LẦM #2: Quên mảng phải SORTED!

   Nếu không sorted: phần tử giữa KHÔNG chia đều giá trị!
   [7, 1, 10, 2, 5]: giữa = 10 → trái [7,1], phải [2,5]
   → Vi phạm BST! (7 > root nhưng ở bên trái!)

─────────────────────────────────────────────────────

❌ SAI LẦM #3: mid - 1 / mid + 1 nhầm!

   node.left = build(start, mid)     ← SAI! Bao gồm mid!
   node.left = build(start, mid - 1) ← ĐÚNG! Bỏ mid!
   node.right = build(mid + 1, end)  ← ĐÚNG!

─────────────────────────────────────────────────────

❌ SAI LẦM #4: Nhầm distinct vs non-distinct!

   Mảng [1, 10, 10, 10, 22]: giữa = 10
   Trái [1, 10]: 10 >= root → phải đi bên PHẢI!
   → Cây bị lệch → height KHÔNG min!
   → Bài YÊU CẦU distinct!
```

---

### 7️⃣ Cách TƯ DUY

```
🧠 Framework:

  ❶ "Sorted array → BST? → Giống Binary Search!"
  ❷ "Min height = balanced = chia ĐÔI mỗi lần"
  ❸ "Giữa → root, trái → subtree trái, phải → subtree phải"
  ❹ "Đệ quy! Base case: start > end → null"
```

**💡 Pattern:**

```
┌────────────────────────────────────────────────────┐
│  Binary Search:  tìm target trong sorted array     │
│  Min Height BST: XÂY CÂY từ sorted array          │
│                                                    │
│  CẢ HAI: chia đôi mỗi lần, dùng mid!              │
│  Binary Search: mid → so sánh → đi trái/phải      │
│  Min Height BST: mid → root → xây trái VÀ phải    │
└────────────────────────────────────────────────────┘
```

---

> 📚 **GIẢI THÍCH CHI TIẾT bên dưới.**

---

## R — Repeat & Clarify

💬 *"Cho sorted array of distinct integers. Xây BST với HEIGHT THẤP NHẤT."*

### Câu hỏi:

1. **"Array đã sorted?"** → CÓ! Đây là KEY!
2. **"Distinct?"** → CÓ! Không trùng!
3. **"Return gì?"** → Root node của BST.
4. **"Có insert method sẵn?"** → CÓ, nhưng dùng nó = O(n log n)!

---

## E — Examples

```
VÍ DỤ 1: [1, 2, 5, 7, 10, 13, 14, 15, 22]
           10
          /  \
         2    14        Height = 3 ✅
        / \   / \
       1   5 13  15
            \     \
             7    22

VÍ DỤ 2: [1, 2, 3]
      2
     / \      Height = 1 ✅
    1   3

VÍ DỤ 3: [1]
    1         Height = 0 ✅

VÍ DỤ 4: [1, 2]
    1
     \        Height = 1 ✅
      2
```

---

## A — Approach

```
┌──────────────────────────────────────────────────────────┐
│ APPROACH 1: Tìm mid + bst.insert()                      │
│ → Time: O(n log n) | Space: O(n)                        │
├──────────────────────────────────────────────────────────┤
│ APPROACH 2: Tìm mid + manual set left/right ⭐           │
│ → Time: O(n) | Space: O(n)                              │
└──────────────────────────────────────────────────────────┘
```

---

## C — Code

### Approach 1: Dùng insert() — O(n log n)

```javascript
function minHeightBstSlow(array) {
  return buildSlow(array, null, 0, array.length - 1);
}

function buildSlow(array, bst, start, end) {
  if (start > end) return bst;
  const mid = Math.floor((start + end) / 2);
  if (!bst) {
    bst = new BST(array[mid]); // tạo root
  } else {
    bst.insert(array[mid]); // O(log n) mỗi lần!
  }
  buildSlow(array, bst, start, mid - 1);
  buildSlow(array, bst, mid + 1, end);
  return bst;
}
```

```
Tại sao O(n log n)?
  → n nodes × O(log n) mỗi insert = O(n log n)!
  → insert() phải đi từ ROOT xuống đúng vị trí!
```

### Approach 2: Manual construction — O(n) ⭐

```javascript
function minHeightBst(array) {
  return build(array, 0, array.length - 1);
}

function build(array, start, end) {
  if (start > end) return null; // base case!
  const mid = Math.floor((start + end) / 2);
  const node = new BST(array[mid]); // tạo node O(1)!
  node.left = build(array, start, mid - 1); // trái
  node.right = build(array, mid + 1, end); // phải
  return node; // trả node cho cha!
}
```

```
Tại sao O(n)?
  → n nodes × O(1) tạo node = O(n)!
  → KHÔNG cần insert()! Gán left/right TRỰC TIẾP!
  → Cha nhận return value → gán vào left/right!
```

### Trace chi tiết:

```
array = [1, 2, 5, 7, 10, 13, 14, 15, 22]
         0  1  2  3   4   5   6   7   8

build(0, 8):
  mid = 4 → node(10)
  node.left = build(0, 3)
    mid = 1 → node(2)
    node.left = build(0, 0)
      mid = 0 → node(1)
      node.left = build(0, -1) → null
      node.right = build(1, 0) → null
      return node(1) ✅
    node.right = build(2, 3)
      mid = 2 → node(5)
      node.left = build(2, 1) → null
      node.right = build(3, 3)
        mid = 3 → node(7)
        return node(7) ✅
      return node(5, right=7) ✅
    return node(2, left=1, right=5) ✅
  node.right = build(5, 8)
    mid = 6 → node(14)
    node.left = build(5, 5)
      mid = 5 → node(13)
      return node(13) ✅
    node.right = build(7, 8)
      mid = 7 → node(15)
      node.right = build(8, 8)
        mid = 8 → node(22)
        return node(22) ✅
      return node(15, right=22) ✅
    return node(14, left=13, right=15) ✅
  return node(10, left=2, right=14) ✅
```

---

## T — Test

```
  ✅ [1,2,5,7,10,13,14,15,22] → height 3
  ✅ [1,2,3]                   → height 1
  ✅ [1]                       → height 0
  ✅ [1,2]                     → height 1
  ✅ [1,2,3,4,5,6,7]           → height 2 (perfect binary tree!)
```

---

## O — Optimize

```
┌─────────────────────────┬──────────────┬──────────────┐
│ Approach                 │ Time         │ Space        │
├─────────────────────────┼──────────────┼──────────────┤
│ insert() method          │ O(n log n)   │ O(n)         │
│ Manual set left/right ⭐ │ O(n)         │ O(n)         │
└─────────────────────────┴──────────────┴──────────────┘

  Cách 2 nhanh hơn vì skip insert() traversal!
  Space O(n) cả 2: phải tạo n nodes!
```

---

## 🧩 Pattern Recognition

```
Pattern: "SORTED ARRAY + CHIA ĐÔI → Binary Search family"

  Binary Search:    tìm target → O(log n)
  Min Height BST:   xây BST → O(n)
  Merge Sort:       chia đôi → sort → merge
  
  CHUNG: mid = (start + end) / 2, recurse trái + phải!

  Cũng liên quan:
  Inorder BST = sorted array!
  → Min Height BST = NGƯỢC LẠI inorder traversal!
```

---

## 🔗 Liên hệ

```
Min Height BST vs Balanced Tree (#110):
  Min Height BST: XÂY cây balanced từ sorted array
  Balanced Tree: KIỂM TRA cây có balanced không
  Ngược nhau!

Min Height BST vs Binary Search:
  Binary Search: tìm 1 phần tử → đi 1 hướng
  Min Height BST: xây cây → đi CẢ HAI hướng!
```

---

## 🗣️ Think Out Loud — Kịch Bản Interview

> Format: 🎙️ = **NÓI TO** | 🧠 = **SUY NGHĨ THẦM**

---

### 📌 Phút 0–2: Clarify

> 🎙️ *"Sorted array of distinct integers, construct BST with minimum height. Min height means the tree should be as balanced as possible — roughly equal nodes in left and right subtrees."*

---

### 📌 Phút 2–4: Approach

> 🎙️ *"Since the array is sorted, I know the middle element has equal smaller and larger values on each side. That's perfect for a BST root — it splits nodes evenly. I'll recursively pick the middle of each subarray."*

> 🎙️ *"This is essentially the reverse of an inorder traversal. And it's the same divide-and-conquer as binary search."*

---

### 📌 Phút 4–7: Code

> 🎙️ *"Base case: start > end returns null. Otherwise, find mid, create node, set left = recurse left half, right = recurse right half, return node. Each node is created in O(1), total O(n)."*

---

### 📌 Phút 7–9: Complexity

> 🎙️ *"O(n) time — each element becomes exactly one node, created in constant time. O(n) space — the n nodes we store. Note: if I used the BST insert method instead, each insert would take O(log n), making it O(n log n) total."*

---

### 📌 Follow-up Q&A

**Q1: "Why not just insert elements left to right?"**

> 🎙️ *"That creates a completely skewed tree with height n-1 — the worst case! We need to pick the middle to balance it."*

**Q2: "What if elements aren't distinct?"**

> 🎙️ *"Duplicates break the guarantee that the middle element splits values evenly. Equal values to the left could end up in the right subtree of the BST, causing imbalance."*

**Q3: "What's the minimum possible height for n nodes?"**

> 🎙️ *"⌊log₂(n)⌋. With 9 nodes: log₂(9) ≈ 3.17, so minimum height = 3."*

---

### 🧠 Tóm tắt

```
  KEY POINTS:
  ✅ Sorted array → lấy GIỮA làm root!
  ✅ Đệ quy: trái = build(start, mid-1), phải = build(mid+1, end)
  ✅ Base case: start > end → null
  ✅ ĐỪNG dùng insert() → O(n log n)! Gán trực tiếp → O(n)!
  ✅ Giống Binary Search: chia đôi mỗi lần!
  ✅ Cần SORTED + DISTINCT!
```
