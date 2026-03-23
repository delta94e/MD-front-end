# 🌳 Unique Binary Search Trees II (LeetCode #95)

> 📖 Code: [Unique Binary Search Trees II.js](./Unique%20Binary%20Search%20Trees%20II.js)

---

## 🧠 Bản chất bài toán — Hiểu để NHỚ, không chỉ để GIẢI

> ⚡ **Đọc phần này TRƯỚC. Nếu bạn chỉ nhớ 1 thứ, nhớ phần này.**

### 1️⃣ Analogy — Ví dụ đời thường

```
🏗️ XÂY NHÀ — Bạn có 3 viên gạch đánh số 1, 2, 3.
Xếp thành tháp sao cho: trái < giữa < phải (quy tắc BST).

Có bao nhiêu cách xếp?

  Cách 1:  1        Cách 2:  1       Cách 3:  2
            \                 \               / \
             2                 3             1   3
              \               /
               3             2

  Cách 4:  3        Cách 5:  3
          /                 /
         1                 2
          \               /
           2             1

  → 5 CÁCH! Mỗi cách = 1 BST khác nhau!
```

### 2️⃣ Cái khó — Tại sao bài này tricky?

```
KHÔNG CHỈ ĐẾM (bài #96) mà phải XÂY TẤT CẢ các cây!

  #96: "Có BAO NHIÊU cây?" → return 5 (chỉ 1 số!)
  #95: "TẠO TẤT CẢ các cây!" → return [cây1, cây2, ..., cây5]

  Phải thật sự BUILD TreeNode cho từng cây!
```

### 3️⃣ Key Insight — CHỌN ROOT → CHIA ĐÔI

```
💡 Với dãy số 1, 2, 3, ..., n:

  Chọn số i làm ROOT:
    → Bên TRÁI: các số 1...(i-1)   ← nhỏ hơn i → left subtree
    → Bên PHẢI: các số (i+1)...n   ← lớn hơn i → right subtree

  Ví dụ n=3, chọn root=2:
    → Trái: [1]     (1 cách xếp)
    → Phải: [3]     (1 cách xếp)
    → Kết quả: 1 × 1 = 1 cây

  Ví dụ n=3, chọn root=1:
    → Trái: []       (0 số → chỉ null, 1 cách)
    → Phải: [2, 3]   (2 cách xếp!)
    → Kết quả: 1 × 2 = 2 cây

  Tổng = 2 + 1 + 2 = 5 cây! ✅
```

```
CÔNG THỨC VÀNG:

  Với dãy [start, end]:
  ┌─────────────────────────────────────────────────┐
  │  THỬ MỖI SỐ i làm root (i = start → end):     │
  │                                                  │
  │    leftTrees  = build(start, i-1)   ← tất cả    │
  │    rightTrees = build(i+1, end)     ← tất cả    │
  │                                                  │
  │    Ghép MỖI left × MỖI right = các cây có root=i│
  └─────────────────────────────────────────────────┘

  Base case: start > end → return [null]
  (không còn số → cây rỗng, nhưng vẫn là 1 khả năng!)
```

### 4️⃣ Recipe — Code

```javascript
function generateTrees(n) {
  function build(start, end) {
    if (start > end) return [null];   // tập rỗng → [null]

    const allTrees = [];
    for (let i = start; i <= end; i++) {         // thử mỗi root
      const lefts = build(start, i - 1);          // tất cả cây trái
      const rights = build(i + 1, end);            // tất cả cây phải
      for (const L of lefts)                       // ghép mỗi L
        for (const R of rights)                    // với mỗi R
          allTrees.push(new TreeNode(i, L, R));
    }
    return allTrees;
  }
  return build(1, n);
}
```

### 5️⃣ Visual — Trace n=3

```
build(1, 3):    thử root = 1, 2, 3

═══════════════════════════════════════════════════
ROOT = 1:  trái = build(1,0) = [null]
           phải = build(2,3)
═══════════════════════════════════════════════════

  build(2, 3):  thử root = 2, 3

    root=2: trái=[null], phải=[TreeNode(3)]
      → Cây:  2
               \
                3

    root=3: trái=[TreeNode(2)], phải=[null]
      → Cây:  3
             /
            2

  → build(2,3) trả về 2 cây!

  Ghép: root=1 × trái=null × phải = 2 cây:

    1            1
     \            \
      2            3
       \          /
        3        2

═══════════════════════════════════════════════════
ROOT = 2:  trái = build(1,1) = [TreeNode(1)]
           phải = build(3,3) = [TreeNode(3)]
═══════════════════════════════════════════════════

  Ghép: 1 × 1 = 1 cây:

      2
     / \
    1   3

═══════════════════════════════════════════════════
ROOT = 3:  trái = build(1,2)
           phải = build(4,3) = [null]
═══════════════════════════════════════════════════

  build(1, 2):  thử root = 1, 2

    root=1: trái=[null], phải=[TreeNode(2)]
      → Cây:  1
               \
                2

    root=2: trái=[TreeNode(1)], phải=[null]
      → Cây:  2
             /
            1

  → build(1,2) trả về 2 cây!

  Ghép: root=3 × trái = 2 cây × phải=null:

      3          3
     /          /
    1          2
     \        /
      2      1

═══════════════════════════════════════════════════
TỔNG: 2 + 1 + 2 = 5 cây! ✅
═══════════════════════════════════════════════════
```

### 6️⃣ Tại sao base case return [null] chứ không return []?

```
❓ Rất nhiều người thắc mắc chỗ này!

return [] = "KHÔNG CÓ cây nào" → vòng for KHÔNG CHẠY → mất kết quả!
return [null] = "CÓ 1 cây rỗng" → vòng for CHẠY 1 lần → ghép được!

Ví dụ: root=1, trái rỗng, phải = [TreeNode(2)]

  Nếu trái = []:
    for (L of [])        ← KHÔNG CHẠY!
      for (R of rights)  ← không bao giờ đến đây!
    → allTrees = []      ← BỊ MẤT cây 1→2!

  Nếu trái = [null]:
    for (L of [null])    ← CHẠY 1 lần, L = null!
      for (R of rights)  ← R = TreeNode(2)
        TreeNode(1, null, TreeNode(2))  ← ĐÚNG!
    → allTrees = [cây 1→2]  ✅

  [null] = "tập rỗng NHƯNG vẫn là 1 khả năng hợp lệ!"
```

### 7️⃣ Flashcard — Tự kiểm tra

| ❓ Câu hỏi | ✅ Đáp án |
|---|---|
| Bài này khác #96 chỗ nào? | #96 ĐẾM, #95 XÂY tất cả cây |
| Idea chính? | Thử mỗi i làm root → chia [start,i-1] và [i+1,end] |
| Base case return gì? | `[null]` (KHÔNG phải `[]`!) |
| Tại sao [null] không phải []? | [] = vòng for không chạy → mất kết quả |
| Ghép left × right như thế nào? | 2 vòng for lồng: mỗi L × mỗi R |
| n=3 có mấy cây? | 5 (số Catalan thứ 3) |
| Số Catalan cho n=1,2,3,4,5? | 1, 2, 5, 14, 42 |
| Time complexity? | O(n × Catalan(n)) ≈ O(4ⁿ/√n) |
| Traversal loại gì? | Divide & Conquer (recursion) |
| Có thể memo không? | CÓ! memo theo key `${start}-${end}` |

### 8️⃣ Sai lầm phổ biến

```
❌ SAI LẦM #1: Base case return []

   if (start > end) return [];  // SAI!
   → Vòng for ghép sẽ KHÔNG CHẠY → mất cây!

   ✅ if (start > end) return [null];

─────────────────────────────────────────────────────

❌ SAI LẦM #2: Quên tạo NEW TreeNode mỗi lần ghép

   const root = new TreeNode(i);
   for (L of lefts)
     for (R of rights) {
       root.left = L;    // SAI! Cùng 1 root, ghi đè!
       root.right = R;
       allTrees.push(root);  // push cùng 1 reference!
     }

   ✅ allTrees.push(new TreeNode(i, L, R));  // MỚI mỗi lần!

─────────────────────────────────────────────────────

❌ SAI LẦM #3: Không hiểu vì sao cần 2 vòng for lồng

   Lefts = [cây1, cây2], Rights = [cây3]
   → Phải ghép: (cây1, cây3) VÀ (cây2, cây3)
   → 2 × 1 = 2 kết quả!
   → CẦN 2 vòng for lồng nhau!
```

### 9️⃣ Cách CHIA NHỎ bất kỳ bài Tree — 5 BƯỚC

> 🎯 **Đây là phần QUAN TRỌNG NHẤT! Áp dụng cho MỌI bài tree, không chỉ bài này.**

```
KHI GẶP BÀI TREE MỚI, ĐỪNG CỐ NGHĨ CODE NGAY!
Hãy đi qua 5 bước sau — CHẬM nhưng CHẮC:

  BƯỚC 1: Hiểu yêu cầu — đề bài muốn GÌ?
  BƯỚC 2: Thử tay với SIZE NHỎ NHẤT (n=1)
  BƯỚC 3: Tăng lên n=2 — thêm gì?
  BƯỚC 4: Tìm PATTERN lặp lại
  BƯỚC 5: Dịch pattern → code
```

**ÁP DỤNG VÀO BÀI NÀY:**

**BƯỚC 1: Đề muốn gì?**
```
"Tạo TẤT CẢ BST khác nhau với số 1 đến n"

Keyword quan trọng:
  "tất cả" → phải sinh ra mọi khả năng
  "BST"    → trái < root < phải
  "1 đến n" → dãy số liên tiếp
```

**BƯỚC 2: Thử n=1 (nhỏ nhất)**
```
Có 1 số: [1]

Chỉ 1 cách:   1

Quá dễ. Chưa thấy gì. Tăng lên!
```

**BƯỚC 3: Thử n=2**
```
Có 2 số: [1, 2]

Tôi thử từng số làm root:
  Root=1: "1 là root. Vì BST: nhỏ hơn 1 → trái, lớn hơn 1 → phải"
          → Trái: không có số nào < 1 → rỗng
          → Phải: 2 > 1 → bên phải
          → Cây:  1
                   \
                    2

  Root=2: "2 là root."
          → Trái: 1 < 2 → bên trái
          → Phải: không có số nào > 2 → rỗng
          → Cây:  2
                 /
                1

→ 2 cây!
```

**BƯỚC 4: Tìm PATTERN!** ⭐
```
🧠 Nhìn lại quá trình ở bước 3, tôi đã làm gì?

  1. THỬ TỪNG SỐ làm root (1, rồi 2)
  2. Tự động biết ai bên TRÁI (nhỏ hơn root)
  3. Tự động biết ai bên PHẢI (lớn hơn root)

🧠 Vậy n=3 thì sao?
  Thử root=1: trái=[], phải=[2,3]
  Thử root=2: trái=[1], phải=[3]
  Thử root=3: trái=[1,2], phải=[]

🧠 "Phải xếp [2,3]" → đây GIỐNG HỆT bài n=2 ở trên!
   "Phải xếp [1,2]" → CŨNG GIỐNG bài n=2!

💡 AHA! Bài n=3 CHỨA bài n=2 bên trong!
   → BÀI NHỎ HƠN nằm trong BÀI LỚN HƠN = ĐỆ QUY!

PATTERN:
  ┌──────────────────────────────────────────────┐
  │ Chọn root i →                                │
  │   trái = giải bài [start...i-1]  (bài nhỏ!) │
  │   phải = giải bài [i+1...end]    (bài nhỏ!) │
  │   ghép mỗi trái × mỗi phải = kết quả       │
  └──────────────────────────────────────────────┘
```

**BƯỚC 5: Dịch pattern → code**
```javascript
function build(start, end) {
  // Hết số → cây rỗng
  if (start > end) return [null];

  const allTrees = [];

  // BƯỚC 1 của pattern: thử từng root
  for (let i = start; i <= end; i++) {
    // BƯỚC 2: giải bài nhỏ bên trái
    const lefts = build(start, i - 1);
    // BƯỚC 3: giải bài nhỏ bên phải
    const rights = build(i + 1, end);
    // GHÉP
    for (const L of lefts)
      for (const R of rights)
        allTrees.push(new TreeNode(i, L, R));
  }
  return allTrees;
}
```

---

**CHỨNG MINH: 5 bước NÀY dùng cho BÀI KHÁC được!**

```
BÀI: Invert Binary Tree

  BƯỚC 1: Đề muốn gì? → Đảo trái↔phải ở mọi node
  BƯỚC 2: n=1 (1 node)? → Không thay đổi. Chưa thấy gì.
  BƯỚC 3: 2 tầng?
              4
             / \
            2   7   →  swap → 7   2. OK!
  BƯỚC 4: Pattern? → Tại mỗi node: swap, rồi LẶP LẠI cho con!
                    → ĐỆ QUY!
  BƯỚC 5: Code:
    if (!root) return null;
    [root.left, root.right] = [root.right, root.left];
    invertTree(root.left);
    invertTree(root.right);
    return root;
```

```
BÀI: Max Depth

  BƯỚC 1: Đề muốn gì? → Tìm đường dài nhất root→leaf
  BƯỚC 2: Cây rỗng? → 0. Cây 1 node? → 1.
  BƯỚC 3: 2 tầng?
              1        Depth = 2. Sao tính?
             /         → 1 (mình) + depth con = 1 + 1 = 2!
            2
  BƯỚC 4: Pattern?
    → depth = 1 + max(depth trái, depth phải)
    → CẦN kết quả con TRƯỚC → ĐỆ QUY (post-order)!
  BƯỚC 5: Code:
    if (!root) return 0;
    return 1 + Math.max(maxDepth(root.left), maxDepth(root.right));
```

```
📝 TÓM TẮT — GẶP BÀI TREE MỚI:

  BƯỚC 1: Đề muốn gì?        → đọc kỹ yêu cầu
  BƯỚC 2: Thử size nhỏ nhất  → n=0, n=1 (base case!)
  BƯỚC 3: Tăng lên n=2, n=3  → làm tay, ghi ra giấy!
  BƯỚC 4: Nhìn: "Tôi đã lặp lại thao tác nào?" → PATTERN!
  BƯỚC 5: Dịch sang code      → pattern = đệ quy!

  💡 ĐỪNG nhìn code trước!
  💡 LUÔN thử tay trước!
  💡 Pattern tự hiện ra khi bạn thử đủ ví dụ!
```

---

### 🔟 Cách TƯ DUY mọi bài tree — "Đứng tại node, hỏi con"

> 🎯 **Đây là BÍ QUYẾT giải mọi bài tree. Không cần nhớ code!**

```
MỌI bài tree đều bắt đầu từ 1 CÂU HỎI:

  ┌──────────────────────────────────────────────────┐
  │ "Tôi ĐỨNG TẠI 1 node.                           │
  │  Tôi KHÔNG THẤY toàn bộ cây.                    │
  │  Tôi CẦN HỎI con cái gì?                       │
  │  Tôi TRẢ LỜI parent bằng gì?"                   │
  └──────────────────────────────────────────────────┘
```

**5 bài — CÙNG 1 cách nghĩ, code TỰ RA:**

```
Bài 1: Đếm nodes
  Hỏi con: "bên mày mấy node?"
  Trả lời: 1 + trái + phải
  → return 1 + countNodes(left) + countNodes(right);

Bài 2: Tổng giá trị
  Hỏi con: "bên mày tổng bao nhiêu?"
  Trả lời: mình + trái + phải
  → return node.val + sum(left) + sum(right);

Bài 3: Giá trị lớn nhất
  Hỏi con: "bên mày max bao nhiêu?"
  Trả lời: max(mình, max trái, max phải)
  → return Math.max(node.val, maxVal(left), maxVal(right));

Bài 4: Max Depth
  Hỏi con: "bên mày sâu mấy?"
  Trả lời: 1 + max(trái, phải)
  → return 1 + Math.max(depth(left), depth(right));

Bài 5: Invert Tree
  KHÔNG CẦN hỏi con (pre-order!)
  Tự làm: swap left↔right, bảo con tự xử tiếp
```

```
💡 QUY TẮC:

  Bạn hỏi CÁI GÌ → quyết định HÀM trả về kiểu gì
  "mấy node?"     → return SỐ (count)
  "tổng?"         → return SỐ (sum)
  "max?"          → return SỐ (max)
  "depth?"        → return SỐ (depth)
  "tất cả cây?"   → return MẢNG CÂY (bài Unique BSTs!)
```

---

### 1️⃣1️⃣ Base Case — Return gì khi `null`?

```
┌──────────────┬──────────┬──────────────────────────────┐
│ Return       │ Khi nào? │ Tại sao?                     │
├──────────────┼──────────┼──────────────────────────────┤
│ return 0     │ Đếm      │ null = 0 nodes, 0 tổng       │
│              │ nodes,   │ Dùng nhiều nhất!              │
│              │ sum,     │                               │
│              │ height   │                               │
├──────────────┼──────────┼──────────────────────────────┤
│ return -1    │ Đếm      │ null = chưa có node,          │
│              │ EDGES    │ thiếu 1 so với đếm nodes     │
│              │          │ edges = nodes - 1             │
├──────────────┼──────────┼──────────────────────────────┤
│ return       │ Init     │ "giá trị tệ nhất, đừng chọn" │
│ -Infinity    │ globalMax│ Chỉ dùng cho BIẾN globalMax! │
│              │          │ KHÔNG dùng cho return depth!  │
│              │          │ Vì -Infinity + 1 = -Infinity  │
├──────────────┼──────────┼──────────────────────────────┤
│ return null  │ KHÔNG    │ null + số = NaN → BUG!        │
│              │ DÙNG!    │ Depth là SỐ, không phải null  │
├──────────────┼──────────┼──────────────────────────────┤
│ return [null]│ Sinh     │ "tập rỗng = 1 khả năng null" │
│              │ tất cả   │ Bài Unique BSTs!              │
│              │ cây      │ [] = mất kết quả, [null] = OK │
└──────────────┴──────────┴──────────────────────────────┘
```

```
KIỂM CHỨNG: return -1 vs return 0

  Cây:  5→3 (2 nodes, 1 edge)

  return -1 (edges):
    depth(null)=-1, depth(3)=0, depth(5)=1  ← 1 edge ✅

  return 0 (nodes):
    height(null)=0, height(3)=1, height(5)=2 ← 2 nodes ✅

  Luôn chênh đúng 1: edges = nodes - 1
```

---

### 1️⃣2️⃣ Bài tập — Diameter of Binary Tree (#543)

> Áp dụng framework "hỏi con, trả lời parent" + pattern globalMax!

```
Bài: Tìm đường đi DÀI NHẤT giữa 2 nodes bất kỳ (đếm edges)

      1
     / \
    2   3       Đường dài nhất: 4→2→1→3 = 3 edges
   / \
  4   5

Cách nghĩ:
  "Tôi đứng tại node 1."
  "Tôi hỏi con trái: height bên mày?"  → 2
  "Tôi hỏi con phải: height bên mày?"  → 1
  "Đường dài nhất QUA tôi = 2 + 1 = 3" → globalMax!
  "Tôi return cho parent: max(2,1) + 1 = 3" → chỉ 1 bên!
```

```javascript
// Cách ĐƠN GIẢN (return 0 = đếm nodes, không cần +2!)
function diameterOfBinaryTree(root) {
  let globalMax = 0;

  function height(node) {
    if (node === null) return 0;
    const left = height(node.left);
    const right = height(node.right);
    globalMax = Math.max(globalMax, left + right); // diameter qua node
    return Math.max(left, right) + 1;              // height cho parent
  }

  height(root);
  return globalMax;
}
```

```
💡 GIỐNG Max Path Sum ở chỗ:

  globalMax = cả 2 bên (đường KẾT THÚC tại node — hình chữ V)
  return    = chỉ 1 bên (đường CÒN ĐI TIẾP lên parent — thẳng)

  Max Path Sum:  globalMax = left + node.val + right
  Diameter:      globalMax = left + right
  
  Cùng pattern: "globalMax ≠ return"!
```

---

> 📚 **Phần dưới đây là GIẢI THÍCH CHI TIẾT + INTERVIEW SIMULATION.**

---

## R — Repeat & Clarify

💬 *"Cho số n, tạo TẤT CẢ các BST khác nhau chứa các số từ 1 đến n."*

### Câu hỏi cần hỏi interviewer:

1. **"Return dạng gì?"** → Mảng các TreeNode roots.
2. **"Thứ tự output có quan trọng?"** → KHÔNG, any order.
3. **"n = 0 thì sao?"** → Constraint: n ≥ 1, nhưng nên handle.
4. **"n tối đa?"** → n ≤ 8. Nhỏ → brute force chấp nhận được, vì Catalan(8) = 1430.

---

## E — Examples

```
n=1: [1]                    → 1 cây

n=2: [1,null,2], [2,1]      → 2 cây
      1          2
       \        /
        2      1

n=3: 5 cây (xem phần Visual ở trên)
n=4: 14 cây
n=5: 42 cây

SỐ CATALAN: 1, 1, 2, 5, 14, 42, 132, 429, 1430, ...
              C(0) C(1) C(2) C(3) C(4) C(5) ...
```

---

## A — Approach

```
DIVIDE & CONQUER:

  1. Thử MỖI số i từ start đến end làm ROOT
  2. Đệ quy: tất cả cây trái = build(start, i-1)
  3. Đệ quy: tất cả cây phải = build(i+1, end)
  4. GHÉP: mỗi left × mỗi right = 1 cây hoàn chỉnh

  Base case: start > end → [null]

Time:  O(n × Catalan(n))  — phải tạo tất cả cây
Space: O(n × Catalan(n))  — lưu tất cả cây trong memory
```

---

## C — Code

> 📖 Full code: [Unique Binary Search Trees II.js](./Unique%20Binary%20Search%20Trees%20II.js)

```javascript
function generateTrees(n) {
  function build(start, end) {
    if (start > end) return [null];

    const allTrees = [];
    for (let i = start; i <= end; i++) {
      const lefts = build(start, i - 1);
      const rights = build(i + 1, end);
      for (const L of lefts)
        for (const R of rights)
          allTrees.push(new TreeNode(i, L, R));
    }
    return allTrees;
  }
  return build(1, n);
}
```

---

## T — Test

```
n=1 → 1 cây   (Catalan C1)
n=2 → 2 cây   (Catalan C2)
n=3 → 5 cây   (Catalan C3) ✅
n=4 → 14 cây  (Catalan C4)
n=5 → 42 cây  (Catalan C5)
```

---

## O — Optimize

```
MEMOIZATION: memo theo key "${start}-${end}"

  build(1,2) có thể được gọi nhiều lần (từ parent khác nhau)
  → Cache kết quả → tránh tính lại!

  ⚠️ LƯU Ý: các cây trong memo CHIA SẺ nodes!
  → Nếu cần modify cây → phải deep clone!
  → Nếu chỉ READ → OK!
```

---

## 🗣️ Think Out Loud — Kịch Bản Interview Chi Tiết

> Format: 🎙️ = **NÓI TO** | 🧠 = **SUY NGHĨ THẦM**

---

### 📌 Phút 0–1: Nhận đề + Clarify

🧠 *"Generate all BSTs — bài classic. Divide & Conquer. n ≤ 8 nên brute force OK."*

> 🎙️ *"OK, so I need to generate all structurally unique BSTs with values 1 to n. A few questions:*
>
> *— The output is an array of TreeNode roots?*
> *(Interviewer: "Yes.")*
>
> *— Does the order of the output matter?*
> *(Interviewer: "No.")*
>
> *— n is at most 8 — so the number of trees is Catalan(8) = 1430. That's small enough for a brute-force generation approach."*

---

### 📌 Phút 1–3: DERIVE approach

> 🎙️ *"Let me think about this with n=3. I have numbers 1, 2, 3. Any of them could be the root.*
>
> *If I pick 2 as the root:*
> *— Left subtree has [1] — only one tree.*
> *— Right subtree has [3] — only one tree.*
> *— One combination total.*
>
> *If I pick 1 as the root:*
> *— Left subtree has [] — empty, which is [null].*
> *— Right subtree has [2,3] — I need to recursively generate all BSTs for [2,3].*
>
> *So the pattern is: for each possible root i, recursively build all left subtrees from [start, i-1] and all right subtrees from [i+1, end], then combine every left with every right."*

🧠 *"Cartesian product: mỗi L × mỗi R. 2 vòng for lồng nhau."*

> 🎙️ *"The key insight is that this is a divide-and-conquer problem. Each choice of root splits the numbers into two independent subproblems: numbers smaller than root go left, numbers larger go right."*

---

### 📌 Phút 3–5: Code + Narrate

> 🎙️ *"The base case is crucial: when start > end, the range is empty. I return [null], NOT an empty array. This is because null is a valid child — it means 'no subtree here'. If I returned [], the nested for loops wouldn't execute and I'd lose valid trees."*

> 🎙️ *"For each root value i, I get all possible left subtrees and all possible right subtrees, then combine them using a Cartesian product — every left paired with every right gives one complete BST."*

---

### 📌 Phút 5–6: Complexity

> 🎙️ *"The number of unique BSTs for n nodes is the nth Catalan number, which is approximately 4ⁿ/(n√n). For n=8, that's 1430 trees, which is very manageable."*
>
> *"Time and space are both O(n × Catalan(n)) since I need to generate and store every tree. Each tree has n nodes."*

---

### 📌 Khi interviewer hỏi thêm

**Q1: "How would you just COUNT the trees instead of generating them?"**

> 🎙️ *"That's problem #96! I'd use dynamic programming with the Catalan number formula:*
> ```
> dp[0] = 1, dp[1] = 1
> dp[n] = Σ dp[i-1] × dp[n-i]  for i = 1..n
> ```
> *Each root i has dp[i-1] left subtrees × dp[n-i] right subtrees."*

**Q2: "Can you add memoization?"**

> 🎙️ *"Yes! I memo by the key '${start}-${end}'. The same range can appear in different branches of the recursion — for example, build(1,2) generates the same set of trees regardless of which larger root led to it."*

**Q3: "What's the Catalan number?"**

> 🎙️ *"It's a sequence that appears in many combinatorial problems: the number of BSTs, the number of valid parenthesizations, the number of ways to triangulate a polygon. The formula is C(n) = (2n choose n) / (n+1). First few values: 1, 1, 2, 5, 14, 42, 132, 429, 1430."*

---

### 📌 Pattern Recognition

```
"CHỌN ROOT → CHIA TRÁI/PHẢI" PATTERN:
═══════════════════════════════════════════════════════════════

  ┌──────────────────────────┬────────────────────────────────┐
  │ Problem                  │ Khác gì?                       │
  ├──────────────────────────┼────────────────────────────────┤
  │ #95 Unique BSTs II       │ XÂY tất cả cây               │
  │ #96 Unique BSTs (count)  │ ĐẾM bằng DP (Catalan)        │
  │ #241 Diff Ways Compute   │ Thử mỗi operator làm "root"  │
  │ #894 All Full BTs        │ Tất cả cây nhị phân đầy đủ   │
  └──────────────────────────┴────────────────────────────────┘

  TEMPLATE:
  function generate(start, end) {
    if (start > end) return [null/base];
    const results = [];
    for (let i = start; i <= end; i++) {
      const lefts = generate(start, i - 1);
      const rights = generate(i + 1, end);
      for (L of lefts)
        for (R of rights)
          results.push(COMBINE(i, L, R));
    }
    return results;
  }
```
