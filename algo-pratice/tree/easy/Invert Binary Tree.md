# 🌳 Invert Binary Tree (LeetCode #226)

> 📖 Code: [Invert Binary Tree.js](./Invert%20Binary%20Tree.js)

---

## 🧠 Bản chất bài toán — Hiểu để NHỚ, không chỉ để GIẢI

> ⚡ **Đọc phần này TRƯỚC. Nếu bạn chỉ nhớ 1 thứ, nhớ phần này.**

### 1️⃣ Analogy — Ví dụ đời thường

```
🪞 GƯƠNG SOI — đây là TẤT CẢ bạn cần nhớ!

  Bạn đứng trước gương:
  → Tay TRÁI trong gương = tay PHẢI ngoài đời
  → Tay PHẢI trong gương = tay TRÁI ngoài đời

  Invert tree = SOI GƯƠNG cho cây:
  → Con TRÁI thành con PHẢI
  → Con PHẢI thành con TRÁI
  → Ở MỌI tầng, MỌI node — không chỉ root!

  ĐÓ LÀ TẤT CẢ. Không có gì phức tạp hơn.
```

### 2️⃣ Recipe — 3 bước, ghi nhớ MÃI MÃI

```
📝 RECIPE (3 bước — viết đi viết lại cho đến khi thuộc):

  Bước 1: Nếu node === null → DỪNG (return null)
  Bước 2: SWAP left ↔ right tại node hiện tại
  Bước 3: LẶP LẠI cho cả left VÀ right

  Chỉ 3 bước. Không hơn, không kém.
```

```javascript
// Đây là BẢN CHẤT — 3 dòng code = 3 bước ở trên:
function invertTree(root) {
  if (root === null) return null;           // Bước 1: DỪNG
  [root.left, root.right] = [root.right, root.left]; // Bước 2: SWAP
  invertTree(root.left);                    // Bước 3: LẶP LẠI
  invertTree(root.right);                   //         cho cả 2 bên
  return root;
}
```

### 3️⃣ Visual — Hình ảnh ghi vào đầu

```
TRƯỚC:          SAU:
    4               4           ← Root KHÔNG đổi!
   / \             / \
  2   7    →     7   2          ← Tầng 1: swap 2↔7
 / \ / \        / \ / \
1  3 6  9      9  6 3  1        ← Tầng 2: swap trong từng nhóm

Cách nhớ: GẬP ĐÔI tờ giấy theo đường dọc giữa root!
→ Bên trái lật sang phải, bên phải lật sang trái
→ Chữ viết bị NGƯỢC (mirror!)
```

### 4️⃣ Tại sao recursion?

```
❓ "Tại sao dùng recursion cho bài này?"

Vì cây có TÍNH CHẤT ĐỆ QUY TỰ NHIÊN:

    Mỗi subtree cũng là 1 cây!
    
        4               Cây gốc tại 4
       / \
      2   7             2 là GỐC của cây con trái
     / \ / \            7 là GỐC của cây con phải
    1  3 6  9           Mỗi cây con cũng cần invert!

    Invert cây tại 4 = swap(2,7) + invert cây tại 7 + invert cây tại 2
    Invert cây tại 7 = swap(6,9) + invert cây tại 9 + invert cây tại 6
    Invert cây tại 9 = null children → DỪNG!
    
    → Công việc LẶP LẠI Y HỆT ở mỗi tầng → RECURSION!
```

### 5️⃣ Flashcard — Tự kiểm tra

> Che cột bên phải, trả lời rồi mở ra check!

| ❓ Câu hỏi | ✅ Đáp án |
|---|---|
| Invert tree nghĩa là gì? | Swap left↔right ở MỌI node (soi gương!) |
| Base case là gì? | `if (root === null) return null` |
| Code recursive có mấy dòng logic? | **3 dòng**: null check, swap, recurse×2 |
| Time complexity? | **O(n)** — mỗi node được visit 1 lần |
| Space complexity? | **O(h)** — h = height, do call stack |
| Balanced tree: space? | **O(log n)** |
| Skewed tree: space? | **O(n)** — cây thành linked list |
| Pre-order hay Post-order? | **Cả 2 đều đúng!** (avoid in-order!) |
| Tại sao in-order SAI? | Sau swap, "right" là left cũ → xử lý 2 lần! |
| BFS dùng data structure gì? | **Queue** — xử lý level-by-level |
| `[root.left, root.right] = [root.right, root.left]` là gì? | **Destructuring swap** — không cần biến temp! |

### 6️⃣ Sai lầm phổ biến — ĐỪNG mắc!

```
❌ SAI LẦM #1: Swap VALUES thay vì swap POINTERS!

   ❌ root.left.val ↔ root.right.val
   → SAI! Phải swap CẢ SUBTREE, không chỉ giá trị root!
   → Nếu swap value, con cháu không đổi chỗ!

   ✅ root.left ↔ root.right
   → Đúng! Swap POINTER = di chuyển TOÀN BỘ nhánh!

─────────────────────────────────────────────────────

❌ SAI LẦM #2: Dùng in-order traversal!

   invertTree(root.left);      // xử lý left
   swap(root.left, root.right); // swap
   invertTree(root.right);     // ← BUG! đây là left CŨ!

   → Sau swap, root.right = left cũ (đã xử lý)
   → root.left = right cũ (chưa xử lý) → BỎ SÓT!

─────────────────────────────────────────────────────

❌ SAI LẦM #3: Quên return root!

   function invertTree(root) {
     if (!root) return null;
     [root.left, root.right] = [root.right, root.left];
     invertTree(root.left);
     invertTree(root.right);
     // ← QUÊN return root! Caller không nhận được kết quả!
   }

─────────────────────────────────────────────────────

❌ SAI LẦM #4: Quên base case!

   → Không check null → crash khi gọi null.left!
   → LUÔN check null TRƯỚC mọi thao tác!
```

### 7️⃣ Luyện tập — Spaced Repetition

```
📅 LỊCH LUYỆN TẬP (viết code trên giấy, KHÔNG nhìn!):

  Ngày 1: Đọc hiểu → viết code nhìn tài liệu
  Ngày 2: Viết code KHÔNG NHÌN → check → sửa
  Ngày 4: Viết lại + giải thích bằng lời (như interview)
  Ngày 7: Viết + trace ví dụ + nói complexity
  Ngày 14: Full mock: clarify → draw → approach → code → trace
  Ngày 30: Viết lại lần cuối → nếu đúng = ĐÃ THUỘC!

  💡 Mỗi lần viết, tự hỏi:
  → "Base case là gì?" (null → return null)
  → "Mỗi node làm gì?" (swap left↔right)  
  → "Sau đó?" (recurse cả 2 bên)
  → "Complexity?" (O(n) time, O(h) space)
```

---

### 8️⃣ Cách TƯ DUY để tự giải — Gặp lại vẫn làm được!

> 🎯 **Mục tiêu:** Không phải nhớ code, mà nhớ **CÁCH NGHĨ**.
> Khi gặp lại bài này (hoặc bài tương tự), bạn tự SUY RA được lời giải.

**Bước 1: Đọc đề → Hỏi "Mỗi node cần làm gì?"**

```
Đề: "Invert a binary tree"

🧠 Tự hỏi: "Nếu mình chỉ ĐỨNG TẠI 1 NODE, mình cần làm gì?"

  Trả lời: Swap left ↔ right. Chỉ vậy thôi!

  → Đây là CÔNG VIỆC TẠI MỖI NODE.
  → Nếu mỗi node đều làm giống nhau → RECURSION!
```

**Bước 2: Hỏi "Khi nào DỪNG?"**

```
🧠 Tự hỏi: "Khi nào không cần làm gì nữa?"

  Trả lời: Khi node === null → không có gì để swap → DỪNG!

  → Đây là BASE CASE.
```

**Bước 3: Ghép lại → thành code**

```
🧠 Ghép 2 câu trả lời:

  "Nếu null → dừng.
   Nếu không → swap left↔right, rồi làm tiếp cho cả 2 con."

  → Dịch sang code:

  function invertTree(root) {
    if (root === null) return null;      // Khi nào dừng?
    [root.left, root.right] = [root.right, root.left]; // Làm gì?
    invertTree(root.left);               // Làm tiếp!
    invertTree(root.right);
    return root;
  }
```

**💡 Framework chung — ÁP DỤNG CHO MỌI BÀI TREE:**

```
┌─────────────────────────────────────────────────────┐
│  3 CÂU HỎI VÀNG cho mọi bài tree recursion:       │
│                                                     │
│  ❶ "Mỗi node cần làm gì?"                          │
│     → Invert: swap left↔right                      │
│     → Max Depth: return 1 + max(left, right)        │
│     → Same Tree: check val bằng nhau?               │
│                                                     │
│  ❷ "Khi nào DỪNG?" (base case)                     │
│     → Hầu hết: node === null                        │
│                                                     │
│  ❸ "Cần kết quả từ con không?"                     │
│     → CÓ (post-order): Max Depth, Balanced Tree    │
│     → KHÔNG (pre-order): Invert Tree               │
│                                                     │
│  Trả lời 3 câu này → TỰ VIẾT ĐƯỢC CODE!           │
└─────────────────────────────────────────────────────┘
```

**Ví dụ áp dụng framework cho bài KHÁC:**

```
Bài: "Check if two trees are the same" (#100)

❶ Mỗi node làm gì? → So sánh val của 2 node
❷ Khi nào dừng?     → Cả 2 null → true. 1 null → false.
❸ Cần kết quả con?  → CÓ! Cả left VÀ right phải giống.

→ Code TỰ SUY RA:
function isSameTree(p, q) {
  if (!p && !q) return true;          // ❷ cả 2 null
  if (!p || !q) return false;         // ❷ 1 null
  return p.val === q.val              // ❶ so sánh
    && isSameTree(p.left, q.left)     // ❸ recurse
    && isSameTree(p.right, q.right);
}

→ KHÔNG CẦN NHỚ CODE! Chỉ cần trả lời 3 câu hỏi!
```

---

### 9️⃣ Tự xây dựng CTDL — TreeNode từ đầu

> 🎯 Hiểu **CẤU TRÚC DỮ LIỆU** trước khi giải bài. Nếu không biết TreeNode trông thế nào, không thể giải bài tree!

**Bước 1: Hiểu — 1 Node là gì?**

```
Tưởng tượng 1 node = 1 HỘP có 3 NGĂN:

  ┌─────────┬─────────┬─────────┐
  │  left   │   val   │  right  │
  │ (mũi ← │ (giá trị│ (mũi → │
  │  tên chỉ│  chứa   │  tên chỉ│
  │  con    │  trong  │  con    │
  │  trái)  │  hộp)   │  phải)  │
  └────┬────┴─────────┴────┬────┘
       ↓                    ↓
    node con              node con
    bên trái             bên phải
    (hoặc null)          (hoặc null)

val   = giá trị node chứa (số, string, gì cũng được)
left  = POINTER chỉ đến node con bên trái (hoặc null)
right = POINTER chỉ đến node con bên phải (hoặc null)
```

**Bước 2: Code — TreeNode class**

```javascript
// ĐÂY LÀ TẤT CẢ! Chỉ cần class này là đủ để build mọi binary tree!

class TreeNode {
  constructor(val, left = null, right = null) {
    this.val = val;      // giá trị
    this.left = left;    // con trái (mặc định null = không có)
    this.right = right;  // con phải (mặc định null = không có)
  }
}

// left = null, right = null → node LÁ (leaf) — không có con!
```

**Bước 3: Tạo tree bằng tay**

```javascript
// Tạo từng node riêng lẻ, rồi NỐI lại:

// Cách 1: Tạo từng node, nối sau
const node1 = new TreeNode(1);
const node3 = new TreeNode(3);
const node6 = new TreeNode(6);
const node9 = new TreeNode(9);
const node2 = new TreeNode(2, node1, node3);  // 2 → left:1, right:3
const node7 = new TreeNode(7, node6, node9);  // 7 → left:6, right:9
const root  = new TreeNode(4, node2, node7);  // 4 → left:2, right:7

// Cách 2: Viết gọn hơn — nested constructors:
const root2 = new TreeNode(4,
  new TreeNode(2, new TreeNode(1), new TreeNode(3)),
  new TreeNode(7, new TreeNode(6), new TreeNode(9))
);

// Cả 2 cách tạo ra cây GIỐNG NHAU:
//
//        4
//       / \
//      2   7
//     / \ / \
//    1  3 6  9
```

```
Quá trình NỐI — visualize:

Bước 1: Tạo các LÁ (không có con)
  [1]  [3]  [6]  [9]

Bước 2: Tạo tầng giữa, nối vào lá
  [2] → left:[1], right:[3]
  [7] → left:[6], right:[9]

      2       7
     / \     / \
    1   3   6   9

Bước 3: Tạo root, nối vào tầng giữa
  [4] → left:[2], right:[7]

        4
       / \
      2   7
     / \ / \
    1  3 6  9

→ TẠO TỪ DƯỚI LÊN! (leaves trước, root sau)
```

**Bước 4: Tạo tree từ array — HƯỚNG DẪN CHI TIẾT**

```
💡 LeetCode cho input dạng array: [4, 2, 7, 1, 3, 6, 9]
   Làm sao biến array này thành tree?

BƯỚC 4.1: Hiểu array LeetCode sắp xếp thế nào

   Array chứa các node theo thứ tự BFS (level-by-level, trái→phải):

   Level 0:  [4]              → chỉ có root
   Level 1:  [2, 7]           → con của 4
   Level 2:  [1, 3, 6, 9]     → con của 2 và 7

   Ghép lại:  [4, 2, 7, 1, 3, 6, 9]
               ↑  ↑  ↑  ↑  ↑  ↑  ↑
          index: 0  1  2  3  4  5  6

   Tương đương cây:
        4          (index 0)
       / \
      2   7        (index 1, 2)
     / \ / \
    1  3 6  9      (index 3, 4, 5, 6)
```

```
BƯỚC 4.2: Quy tắc vàng — TÌM CON từ index

   Node tại index i:
     → Con TRÁI  = index 2×i + 1
     → Con PHẢI  = index 2×i + 2

   Ví dụ:
   ┌────────┬───────┬──────────────┬──────────────┐
   │ Node   │ Index │ Left (2i+1)  │ Right (2i+2) │
   ├────────┼───────┼──────────────┼──────────────┤
   │ val=4  │   0   │ 2×0+1 = 1 ✅ │ 2×0+2 = 2 ✅ │
   │ val=2  │   1   │ 2×1+1 = 3 ✅ │ 2×1+2 = 4 ✅ │
   │ val=7  │   2   │ 2×2+1 = 5 ✅ │ 2×2+2 = 6 ✅ │
   │ val=1  │   3   │ 2×3+1 = 7 ❌ │ 2×3+2 = 8 ❌ │
   │        │       │ (out of arr!)│ (out of arr!)│
   └────────┴───────┴──────────────┴──────────────┘

   → index 3 tìm con ở 7, 8 — vượt array length (7) → KHÔNG CÓ CON → leaf!
```

```
BƯỚC 4.3: Trace — Xây tree từng bước

  Array: [4, 2, 7, 1, 3, 6, 9]

  Phase 1: TẠO tất cả nodes (chưa nối!)
  ─────────────────────────────────────
    nodes[0] = TreeNode(4)    nodes[1] = TreeNode(2)
    nodes[2] = TreeNode(7)    nodes[3] = TreeNode(1)
    nodes[4] = TreeNode(3)    nodes[5] = TreeNode(6)
    nodes[6] = TreeNode(9)

    Hiện tại: 7 hộp rời rạc, chưa ai nối với ai:
    [4]  [2]  [7]  [1]  [3]  [6]  [9]

  Phase 2: NỐI parent → children
  ─────────────────────────────
    Vòng lặp i = 0:
      nodes[0] = 4
      left  = nodes[2×0+1] = nodes[1] = 2
      right = nodes[2×0+2] = nodes[2] = 7
      → 4.left = 2, 4.right = 7

          4
         / \
        2   7        [1] [3] [6] [9] vẫn rời

    Vòng lặp i = 1:
      nodes[1] = 2
      left  = nodes[2×1+1] = nodes[3] = 1
      right = nodes[2×1+2] = nodes[4] = 3
      → 2.left = 1, 2.right = 3

          4
         / \
        2   7
       / \
      1   3          [6] [9] vẫn rời

    Vòng lặp i = 2:
      nodes[2] = 7
      left  = nodes[2×2+1] = nodes[5] = 6
      right = nodes[2×2+2] = nodes[6] = 9
      → 7.left = 6, 7.right = 9

          4
         / \
        2   7        ← HOÀN THÀNH!
       / \ / \
      1  3 6  9

    Vòng lặp i = 3,4,5,6:
      2×i+1 > 6 → vượt array → KHÔNG NỐI gì
      → Đây là các LÁ (leaves)!
```

```
BƯỚC 4.4: Xử lý NULL — cây KHÔNG đầy đủ

  LeetCode dùng null cho vị trí TRỐNG:

  Array: [1, 2, 3, null, null, 4]

    nodes[0] = TreeNode(1)
    nodes[1] = TreeNode(2)
    nodes[2] = TreeNode(3)
    nodes[3] = null           ← TRỐNG!
    nodes[4] = null           ← TRỐNG!
    nodes[5] = TreeNode(4)

    Vòng lặp i=0: 1.left = nodes[1](=2), 1.right = nodes[2](=3)
    Vòng lặp i=1: 2.left = nodes[3](=null!), 2.right = nodes[4](=null!)
    → 2 là LÁ (cả 2 con đều null)
    Vòng lặp i=2: 3.left = nodes[5](=4), 3.right = vượt array → null
    Vòng lặp i=3: nodes[3] === null → SKIP!
    Vòng lặp i=4: nodes[4] === null → SKIP!
    Vòng lặp i=5: 4 → con ở index 11,12 → vượt array → lá!

    Kết quả:
        1
       / \
      2   3
         /
        4
```

**Code buildTree — có comment từng dòng:**

```javascript
function buildTree(arr) {
  // Array trống → không có tree!
  if (!arr || arr.length === 0) return null;

  // Phase 1: Tạo TẤT CẢ nodes từ array
  // null trong array → null trong nodes (vị trí trống!)
  const nodes = arr.map(val =>
    val !== null ? new TreeNode(val) : null
  );

  // Phase 2: NỐI từng parent với children
  for (let i = 0; i < nodes.length; i++) {
    // Nếu vị trí này là null → skip (không có node ở đây)
    if (nodes[i] === null) continue;

    const leftIndex = 2 * i + 1;    // Công thức tìm con trái
    const rightIndex = 2 * i + 2;   // Công thức tìm con phải

    // Nếu index con nằm trong array → nối!
    if (leftIndex < nodes.length)  nodes[i].left = nodes[leftIndex];
    if (rightIndex < nodes.length) nodes[i].right = nodes[rightIndex];
  }

  // nodes[0] = node đầu tiên = ROOT!
  return nodes[0];
}
```

```javascript
// === TEST ===
const tree1 = buildTree([4, 2, 7, 1, 3, 6, 9]);
//        4
//       / \
//      2   7
//     / \ / \
//    1  3 6  9

const tree2 = buildTree([1, 2, 3, null, null, 4]);
//      1
//     / \
//    2   3
//       /
//      4

const tree3 = buildTree([1]);
//    1            (chỉ root, không con)

const tree4 = buildTree([]);
//    null         (cây rỗng!)
```

```
📝 TÓM TẮT — Nhớ 2 thứ:

  ❶ Array LeetCode = BFS order (level-by-level)
  ❷ Con trái = 2i+1, Con phải = 2i+2

  Chỉ cần 2 dòng kiến thức này
  → TỰ VIẾT ĐƯỢC buildTree()!
```


**Bước 5: In tree ra console (để debug)**

```javascript
// Helper: in tree dạng visual (xoay ngang)
function printTree(node, prefix = '', isLeft = true) {
  if (node === null) return;
  
  printTree(node.right, prefix + (isLeft ? '│   ' : '    '), false);
  console.log(prefix + (isLeft ? '└── ' : '┌── ') + node.val);
  printTree(node.left, prefix + (isLeft ? '    ' : '│   '), true);
}

// Dùng:
printTree(tree);
// Output:
//     ┌── 9
// ┌── 7
// │   └── 6
// 4
// │   ┌── 3
// └── 2
//     └── 1
```

**Bước 6: Test Invert Tree!**

```javascript
// Ghép tất cả lại:
const tree = buildTree([4, 2, 7, 1, 3, 6, 9]);

console.log('TRƯỚC invert:');
printTree(tree);

invertTree(tree);    // ← Hàm bạn tự viết!

console.log('\nSAU invert:');
printTree(tree);

// TRƯỚC:              SAU:
//     ┌── 9               ┌── 1
// ┌── 7               ┌── 2
// │   └── 6           │   └── 3
// 4                   4
// │   ┌── 3           │   ┌── 6
// └── 2               └── 7
//     └── 1               └── 9
```

**📝 Tóm tắt — Cần nhớ gì?**

```
CTDL BINARY TREE — CHỈ CẦN NHỚ 3 THỨ:
═══════════════════════════════════════════════════════════════

❶ TreeNode = { val, left, right }
   → 1 class, 3 properties, xong!

❷ Tạo tree = new TreeNode(val, left, right)
   → Nested constructors hoặc buildTree([...])

❸ Con trái = index 2i+1, con phải = index 2i+2
   → Quy tắc chuyển array ↔ tree
```

---

> 📚 **Phần dưới đây là GIẢI THÍCH CHI TIẾT.** Đọc khi muốn hiểu SÂU hơn.
> Nếu bạn đã hiểu phần trên → bạn đã nắm 80% bài này rồi!

---



## R — Repeat & Clarify (Nhắc lại + Hỏi rõ)

💬 *"Bài này yêu cầu đảo ngược (mirror) một binary tree — hoán đổi left và right subtree ở MỌI node."*

### Câu hỏi cần hỏi interviewer:

1. **"Tree có thể rỗng (null) không?"** → CÓ! `null → return null` (base case!)
2. **"Invert IN-PLACE hay return tree mới?"** → Thường in-place (swap pointers!)
3. **"Node chỉ có 1 child thì sao?"** → Vẫn swap! `left → right`, `right(null) → left`!
4. **"Giá trị node có ảnh hưởng?"** → KHÔNG! Ta swap SUBTREES, không phải values!

```
TRƯỚC invert:          SAU invert:
      4                     4
     / \                   / \
    2   7        →       7   2
   / \ / \               / \ / \
  1  3 6  9             9  6 3  1

→ Mỗi node: left ↔ right HOÁN ĐỔI!
→ Giống GƯƠNG SOI (mirror)!
```

---

## E — Examples (Ví dụ)

```
VÍ DỤ 1 — Normal tree:
Input:        4            Output:       4
             / \                        / \
            2   7          →           7   2
           / \ / \                    / \ / \
          1  3 6  9                  9  6 3  1

VÍ DỤ 2 — Empty:   null → null
VÍ DỤ 3 — Single:  [1] → [1] (không đổi!)

VÍ DỤ 4 — Unbalanced:
Input:    1              Output:    1
         /                           \
        2          →                  2
       /                               \
      3                                 3

💬 "Node chỉ có left child → sau invert chỉ có right child!"
```

---

## A — Approach (Cách tiếp cận)

```
┌──────────────────────────────────────────────────────────┐
│ APPROACH 1: RECURSIVE DFS                                │
│ → Swap left/right ở mỗi node → recurse!                 │
│ → 3 dòng code! Đơn giản nhất!                           │
│ → Time: O(n) | Space: O(h) call stack!                  │
├──────────────────────────────────────────────────────────┤
│ APPROACH 2: ITERATIVE BFS (Queue)                        │
│ → Level-by-level, mỗi node: swap → enqueue children!    │
│ → Time: O(n) | Space: O(n) queue!                       │
├──────────────────────────────────────────────────────────┤
│ APPROACH 3: ITERATIVE DFS (Stack)                        │
│ → Giống BFS nhưng stack (LIFO) thay queue (FIFO)!       │
│ → Time: O(n) | Space: O(n) stack!                       │
└──────────────────────────────────────────────────────────┘
```

💬 *"Tôi chọn recursive vì binary tree → recursion is NATURAL, 3 dòng code. Sau đó code BFS alternative."*

### Recursive pattern — Swap ở mỗi node:

```
        4             4
       / \    swap   / \
      2   7   →     7   2     ← swap tại root!
     / \ / \       / \ / \
    1  3 6  9     6  9 1  3   ← recurse vào children!

    Rồi recurse tiếp:
        7             7            2             2
       / \    swap   / \          / \    swap   / \
      6   9   →     9   6       1   3   →     3   1

    Base case: node === null → return! DỪNG!
```

---

## C — Code

> 📖 Full code: [Invert Binary Tree.js](./Invert%20Binary%20Tree.js)

### Approach 1: Recursive DFS (Pre-order)

```javascript
function invertTree(root) {
  if (root === null) return null;

  // SWAP left và right! (destructuring!)
  [root.left, root.right] = [root.right, root.left];

  // Recurse vào CẢ HAI subtrees!
  invertTree(root.left);
  invertTree(root.right);

  return root;
}
```

### Trace qua ví dụ:

```
invertTree(4):
  swap: 4.left(2) ↔ 4.right(7)
  → invertTree(7):         ← (đã swap, giờ là left)
      swap: 7.left(6) ↔ 7.right(9)
      → invertTree(9): null children → return
      → invertTree(6): null children → return
  → invertTree(2):
      swap: 2.left(1) ↔ 2.right(3)
      → invertTree(3): return
      → invertTree(1): return
  return root(4)

Kết quả:       4
              / \
             7   2
            / \ / \
           9  6 3  1  ✅
```

### Approach 1B: Recursive (Post-order)

```javascript
function invertTreePostOrder(root) {
  if (root === null) return null;

  const left = invertTreePostOrder(root.left);
  const right = invertTreePostOrder(root.right);

  root.left = right;   // swap!
  root.right = left;

  return root;
}
```

💬 *"Cả Pre-order và Post-order đều đúng! Mỗi node chỉ swap 1 lần, thứ tự không ảnh hưởng kết quả."*

```
┌───────────────────────┬──────────────────────┐
│ Pre-order (swap trước)│ Post-order (swap sau)│
├───────────────────────┼──────────────────────┤
│ Swap → recurse        │ Recurse → swap       │
│ Xử lý root trước!    │ Xử lý leaves trước!  │
│ Cả hai cho KẾT QUẢ GIỐNG NHAU!             │
└───────────────────────┴──────────────────────┘
```

### Approach 2: Iterative BFS (Queue)

```javascript
function invertTreeBFS(root) {
  if (root === null) return null;

  const queue = [root];

  while (queue.length > 0) {
    const node = queue.shift();   // dequeue!
    [node.left, node.right] = [node.right, node.left];

    if (node.left) queue.push(node.left);
    if (node.right) queue.push(node.right);
  }

  return root;
}
```

### Trace BFS:

```
Queue: [4]
→ Dequeue 4. Swap: left(2)↔right(7). Enqueue 7, 2.
Queue: [7, 2]
→ Dequeue 7. Swap: left(6)↔right(9). Enqueue 9, 6.
Queue: [2, 9, 6]
→ Dequeue 2. Swap: left(1)↔right(3). Enqueue 3, 1.
Queue: [9, 6, 3, 1]
→ All leaf nodes, no children. Queue empty → DONE! ✅
```

### Approach 3: Iterative DFS (Stack)

```javascript
function invertTreeDFS(root) {
  if (root === null) return null;

  const stack = [root];

  while (stack.length > 0) {
    const node = stack.pop();   // pop (LIFO!)
    [node.left, node.right] = [node.right, node.left];

    if (node.left) stack.push(node.left);
    if (node.right) stack.push(node.right);
  }

  return root;
}
```

💬 *"Giống BFS nhưng `pop()` (LIFO) thay `shift()` (FIFO) → DFS order!"*

---

## T — Test

> 📖 Test code: [Invert Binary Tree.js](./Invert%20Binary%20Tree.js)

| Test | Input | Expected | Kiểm tra |
|---|---|---|---|
| Normal tree | `[4,2,7,1,3,6,9]` | `[4,7,2,9,6,3,1]` | Full swap! |
| Empty | `null` | `null` | Base case! |
| Single node | `[42]` | `[42]` | Không đổi! |
| Unbalanced | `[1,2,null,3]` | `[1,null,2,null,3]` | Left→Right! |
| BFS approach | `[4,2,7,1,3,6,9]` | `[4,7,2,9,6,3,1]` | Same result! |

---

## O — Optimize (Phân tích Complexity)

```
┌────────────────┬──────────┬──────────┬──────────┐
│                │ Recursive│ BFS      │ DFS Stack│
├────────────────┼──────────┼──────────┼──────────┤
│ Time           │ O(n)     │ O(n)     │ O(n)     │
│ Space          │ O(h)     │ O(n)     │ O(n)     │
│ h = height     │ call     │ queue    │ stack    │
│                │ stack    │ max width│ max depth│
├────────────────┼──────────┼──────────┼──────────┤
│ Balanced h     │ O(log n) │ O(n)     │ O(log n) │
│ Skewed h       │ O(n)     │ O(n)     │ O(n)     │
└────────────────┴──────────┴──────────┴──────────┘
```

- **Time O(n)** = optimal — PHẢI visit mỗi node ít nhất 1 lần!
- **Space O(h)** recursive = TỐT NHẤT cho balanced tree (O(log n))
- **BFS** luôn O(n) worst case do queue chứa cả 1 level (n/2 nodes)

### Khi nào dùng cái nào?

- **Recursive**: DEFAULT! 3 dòng, clean, chỉ lo stack overflow nếu tree > 10000 levels
- **BFS**: Khi cần tránh stack overflow, hoặc interviewer yêu cầu iterative
- **DFS Stack**: Alternative iterative, giống recursive nhưng explicit stack

---

## 🎤 Interview Cheat Sheet

```
⏱ TIMELINE (15 phút):
├── 0-2 phút:  Nhắc lại bài + hỏi clarification!
├── 2-4 phút:  Vẽ ví dụ + trace tay!
├── 4-6 phút:  Nói approach (recursive swap!)
├── 6-9 phút:  Code recursive solution!
├── 9-11 phút: Trace lại code với ví dụ!
├── 11-13 phút: Phân tích complexity!
└── 13-15 phút: Code BFS alternative!

💡 KEY TALKING POINTS:
→ "Swap left/right ở MỖI node, đệ quy xuống!"
→ "Pre-order và post-order CẢ HAI đúng!"
→ "Time O(n) — visit mỗi node 1 lần!"
→ "Space O(h) — recursive call stack!"
→ "Destructuring swap: [a, b] = [b, a]!"

🎯 ĐIỂM CỘNG:
→ Show CẢ recursive VÀ iterative!
→ Mention pre-order vs post-order!
→ Analyze balanced vs skewed tree!
→ Mention stack overflow risk!

⚠ SAI LẦM PHỔ BIẾN:
→ Quên base case (null check!)
→ Swap VALUES thay vì SUBTREES!
→ Chỉ swap 1 level (quên recurse!)

🔗 RELATED PROBLEMS:
→ Symmetric Tree (#101) — check mirror!
→ Same Tree (#100) — compare 2 trees!
→ Maximum Depth (#104) — DFS depth!
→ Level Order Traversal (#102) — BFS!
```

---

## 🗣️ Think Out Loud — Kịch Bản Interview Chi Tiết

> Đây là **KỊCH BẢN MẪU** cho interview, nói to từng suy nghĩ.
> Interviewer đánh giá **quá trình tư duy** chứ không chỉ kết quả!
>
> Format: 🎙️ = **NÓI TO** (interviewer nghe) | 🧠 = **SUY NGHĨ THẦM** (trong đầu)

---

### 📌 Phút 0–2: Nhận đề + Clarify

🧠 *Suy nghĩ thầm: "Invert binary tree — bài classic! Mình biết cách giải rồi, nhưng ĐỪNG vội. Phải show process, hỏi clarification, vẽ ví dụ trước. Interviewer đánh giá PROCESS, không chỉ answer."*

> 🎙️ *"OK, so the problem is asking me to invert a binary tree. Let me make sure I understand the requirement correctly."*

> 🎙️ *"Inverting a binary tree means swapping the left and right children at EVERY node, recursively throughout the entire tree. The result should be a mirror image — like looking at the tree in a mirror. Is my understanding correct?"*

🧠 *"Tốt, nhắc lại bài bằng ngôn ngữ riêng cho thấy mình HIỂU, không chỉ đọc đề."*

> 🎙️ *"Before I dive into the solution, I'd like to clarify a few things:"*

> 🎙️ *"**First** — can the input be null? An empty tree? I want to make sure I handle that edge case."*
>
> *(Interviewer: "Yes, the tree can be empty.")*

> 🎙️ *"**Second** — should I invert the tree in-place by modifying the existing nodes, or should I create and return a new tree? In-place is more memory efficient since we don't allocate new nodes."*
>
> *(Interviewer: "In-place is fine.")*

> 🎙️ *"**Third** — what about nodes with only one child? For example, if a node only has a left child and no right child. I assume I'd still swap — the left child becomes the right child, and left becomes null."*
>
> *(Interviewer: "Yes, that's correct.")*

> 🎙️ *"**Last question** — are we swapping the subtree POINTERS, not the node values, right? So the entire left subtree moves to the right side, and vice versa."*
>
> *(Interviewer: "Correct.")*

🧠 *"Tốt! 4 câu hỏi = cho thấy mình careful. Giờ vẽ ví dụ."*

💡 **Tại sao phải hỏi — PHÂN TÍCH SÂU:**
- Interviewer **MUỐN** bạn hỏi. Im lặng rồi code ngay = 🚩 red flag.
- Mỗi câu hỏi cho thấy bạn **anticipate edge cases** (null, single child).
- Hỏi "in-place vs new tree" cho thấy bạn nghĩ về **memory trade-off** = senior thinking.
- Hỏi "pointers vs values" cho thấy bạn hiểu **data structure internals**.
- Nếu interviewer trả lời khác expectation → bạn **tiết kiệm** 10 phút code sai!

---

### 📌 Phút 2–4: Vẽ ví dụ + Trace tay

🧠 *"Luôn vẽ ví dụ TRƯỚC khi code. 2 lý do: (1) confirm hiểu đúng, (2) dùng để trace code sau."*

> 🎙️ *"Let me draw out an example to solidify my understanding and I'll use this later to verify my code."*

> *(Cầm bút, vẽ lên whiteboard)*

> 🎙️ *"Let's take this tree..."*
>
> *(Vẽ chậm, rõ ràng — ĐỪNG vẽ vội!)*
>
> ```
>       4
>      / \
>     2   7
>    / \ / \
>   1  3 6  9
> ```

> 🎙️ *"After inverting, I expect every node's children to be swapped. So at level 1, nodes 2 and 7 switch positions. At level 2, within what was the subtree rooted at 2, nodes 1 and 3 swap. And within subtree rooted at 7, nodes 6 and 9 swap."*

> *(Vẽ kết quả bên cạnh, nối bằng mũi tên →)*
>
> ```
>       4
>      / \
>     7   2
>    / \ / \
>   9  6 3  1
> ```

> 🎙️ *"So the result is the mirror image of the original tree. I can verify this visually — if I fold the tree vertically down the middle, corresponding nodes would overlap."*

🧠 *"Giờ nghĩ edge cases. Interviewer sẽ hỏi nếu mình không tự nói."*

> 🎙️ *"Let me also think through some edge cases before I start coding:*
>
> *1. **Empty tree (null)** — should just return null. This will be my base case.*
>
> *2. **Single node** — no children to swap, tree stays the same. But my code should still handle it gracefully — swapping null with null is fine.*
>
> *3. **Unbalanced tree** — say a left-skewed tree like 1→2→3. After inversion, it becomes right-skewed: 1→null on left, 2 on right, then 2→null on left, 3 on right. The tree's shape completely flips."*
>
> *(Vẽ nhanh:)*
> ```
> Before:    1          After:    1
>           /                      \
>          2                        2
>         /                          \
>        3                            3
> ```

> 🎙️ *"4. **Nodes with one child** — a node with only a left child becomes a node with only a right child. Important to NOT skip this case."*

💡 **Tại sao trace tay chi tiết — PHÂN TÍCH SÂU:**
- Vẽ **CHẬM và RÕ RÀN** → interviewer theo dõi được, thấy bạn organized.
- Vẽ edge cases **TỰ NGUYỆN** → interviewer không cần hỏi → bạn thể hiện proactive thinking.
- Ví dụ này sẽ dùng lại ở phần **trace code** → tiết kiệm thời gian, story liền mạch.
- Vẽ **input VÀ output** cạnh nhau → dễ so sánh, dễ verify.

---

### 📌 Phút 4–6: Nói Approach

🧠 *"Mình thấy pattern: mỗi node swap children + recurse. Tree → recursion. Nhưng phải GIẢI THÍCH tại sao chọn, không chỉ nói 'dùng recursion'."*

> 🎙️ *"OK, looking at this problem, I'm immediately seeing a recursive structure. Let me explain my thinking..."*

> 🎙️ *"The key insight is that the inversion of a tree can be broken down into a SUBPROBLEM: at any node, I need to (1) swap its left and right children, and (2) independently invert both subtrees. This is a classic divide-and-conquer pattern — the solution for the whole tree is composed of solutions for the subtrees."*

🧠 *"Show rằng mình nhận ra pattern — 'divide and conquer', 'recursive substructure'. Đây là ngôn ngữ interviewer muốn nghe."*

> 🎙️ *"For the base case, when I hit a null node — meaning an empty subtree or beyond a leaf node — I simply return null. There's nothing to invert."*

> 🎙️ *"Now, for the traversal order, I have a choice:*
> - *Pre-order: swap first, then recurse into children*
> - *Post-order: recurse into children first, then swap*
> - *In-order: recurse left, swap, recurse right*
>
> *Both pre-order and post-order work correctly. Pre-order is the most intuitive — I process the current node right away, then let recursion handle the rest. I'll go with pre-order."*

🧠 *"Mention in-order pitfall = bonus points! Interviewer loves khi bạn biết cái nào KHÔNG nên dùng."*

> 🎙️ *"I'll avoid in-order traversal here because it has a subtle bug: after swapping at a node, when I recurse into what I think is the 'right' child, it's actually the ORIGINAL left child that just got moved. So I'd end up processing the original left subtree twice and missing the right subtree entirely. Pre-order avoids this because we swap before recursing, and just pass both children down."*

> 🎙️ *"In terms of complexity, before I code:*
> - ***Time: O(n)** — I'll visit each of the n nodes exactly once, performing a constant-time swap at each.*
> - ***Space: O(h)** — for the recursion call stack, where h is the tree's height. For a balanced tree, h = log(n), giving us O(log n) space. For a degenerate tree — essentially a linked list — h = n, so worst case O(n) space."*

> 🎙️ *"I want to note that there's also an iterative approach using BFS with a queue, which is useful if we're worried about stack overflow on very deep trees. The time complexity is the same O(n), but the space becomes O(n) since the queue can hold up to an entire level at once. I'll code the recursive version first since it's cleaner, and if we have time, I'll show the iterative one."*

💡 **Tại sao nói approach trước — PHÂN TÍCH SÂU:**
- Cho interviewer **cơ hội redirect**: nếu họ muốn iterative, bạn biết TRƯỚC khi đã code 5 phút recursion.
- Mention **in-order pitfall** = hiểu SÂU, không chỉ biết 1 cách. Đây là dấu hiệu **strong hire**.
- Nói complexity **TRƯỚC khi code** = cho thấy bạn plan ahead, không chỉ "code xong mới tính".
- Mention **alternative approach** tự nguyện = thể hiện breadth of knowledge.

---

### 📌 Phút 6–9: Code + Narrate từng dòng

🧠 *"Giờ code. NHỚ: nói MỖI dòng khi viết. Đừng im lặng!"*

> 🎙️ *"Alright, let me write the code. I'll start with the function signature."*

```javascript
function invertTree(root) {
```

> 🎙️ *"First, my base case. If the root is null, we've reached beyond a leaf node or the tree is empty, so there's nothing to invert. I'll return null."*

🧠 *"Giải thích TẠI SAO return null, không chỉ nói 'check null'. Interviewer muốn nghe REASONING."*

```javascript
  if (root === null) return null;
```

> 🎙️ *"Now for the core logic. I need to swap the left and right children. I'll use JavaScript's destructuring assignment — it lets me swap two values in a single line without needing a temporary variable. This is essentially doing: temp = left, left = right, right = temp, but in a more elegant way."*

🧠 *"Giải thích destructuring = show language knowledge. Nhiều người DÙNG nhưng không HIỂU."*

```javascript
  [root.left, root.right] = [root.right, root.left];
```

> 🎙️ *"Now I recursively invert both subtrees. After the swap, root.left HOLDS what was originally root.right — but that doesn't matter. The recursion will correctly invert whatever subtree is there, regardless of where it came from."*

🧠 *"Đây là subtle point — nhiều người lo 'swap rồi recurse sai thứ tự'. Giải thích = remove doubt."*

```javascript
  invertTree(root.left);   // invert left subtree (was originally right!)
  invertTree(root.right);  // invert right subtree (was originally left!)
```

> 🎙️ *"Finally, I return the root node. This is important for two reasons: (1) it allows the caller to chain operations, and (2) it matches the function contract — we receive a root and return the inverted tree's root, which is the same node since we're doing this in-place."*

```javascript
  return root;
}
```

> 🎙️ *"So the complete function is just 5 lines. The beauty of recursive solutions on trees — the code mirrors the problem structure perfectly."*

💡 **Tại sao narrate từng dòng — PHÂN TÍCH SÂU:**
- Mỗi dòng code → 1 câu giải thích **TẠI SAO**, không chỉ **CÁI GÌ**.
- Im lặng code = interviewer KHÔNG BIẾT bạn đang nghĩ gì → họ lo lắng "does this person actually understand?"
- Mention "destructuring swap" = show **language mastery**.
- Giải thích "swap trước recurse" subtle point = show **deep understanding**.
- *"The code mirrors the problem structure"* = thể hiện **software engineering aesthetics**.

---

### 📌 Phút 9–11: Trace code với ví dụ

🧠 *"QUAN TRỌNG: trace code với ví dụ đã vẽ ở đầu. Chứng minh code ĐÚNG."*

> 🎙️ *"Let me walk through my code with the example I drew earlier to make sure it's correct."*

> 🎙️ *"I'll track the call stack and the state of each node:*
>
> ***Call 1: invertTree(4)***
> *— root = 4, not null, so we proceed.*
> *— Swap: node 4's left was 2, right was 7. After swap: left = 7, right = 2.*
> *— Recurse into node 4's new left, which is 7...*
>
> ***Call 2: invertTree(7)***
> *— root = 7, not null.*
> *— Swap: node 7's left was 6, right was 9. After swap: left = 9, right = 6.*
> *— Recurse into node 7's new left, which is 9...*
>
> ***Call 3: invertTree(9)***
> *— root = 9. Both children are null. Swap null ↔ null — no effect. Return 9.*
>
> ***Call 4: invertTree(6)***
> *— Same — leaf node, swap null ↔ null. Return 6.*
>
> ***Back to Call 2: Done with node 7's children. Return 7.***
>
> ***Call 5: invertTree(2)***
> *— root = 2, not null.*
> *— Swap: node 2's left was 1, right was 3. After swap: left = 3, right = 1.*
> *— Recurse into 3 and 1 — both leaves, return immediately.*
>
> ***Back to Call 1: Done with node 4's children. Return 4.***"

> 🎙️ *"So the final tree is:*
> ```
>       4
>      / \
>     7   2
>    / \ / \
>   9  6 3  1
> ```
> *Which matches my expected output from earlier! ✅"*

> 🎙️ *"Let me also quickly verify edge cases mentally:*
> - *invertTree(null): hits base case immediately, returns null. ✅*
> - *invertTree(42) — a single node: swap null ↔ null, no change. Returns the same node. ✅*
> - *A left-skewed tree 1→2→3: at node 1, swap left(2) with right(null). Now node 1 has right=2, left=null. At node 2, swap left(3) with right(null). Now node 2 has right=3, left=null. Result is right-skewed. ✅"*

💡 **Tại sao trace chi tiết — PHÂN TÍCH SÂU:**
- Trace = **CHỨNG MINH** code đúng. Interviewer thấy bạn **verify own work**.
- Dùng **call stack tracking** (Call 1, 2, 3...) → thể hiện bạn hiểu **execution model**.
- Check edge cases **tự nguyện** → interviewer không cần hỏi → bạn **save time**.
- So sánh kết quả với ví dụ **đã vẽ từ đầu** → story **NHẤT QUÁN** từ đầu tới cuối.

---

### 📌 Phút 11–13: Complexity Analysis

> 🎙️ *"Now let me analyze the time and space complexity rigorously."*

> 🎙️ *"**Time complexity: O(n)** where n is the total number of nodes in the tree."*
> *"Let me break this down: my function visits each node exactly once. At each node, I do three O(1) operations: a null check, a swap, and two recursive calls. The total work is proportional to the number of nodes, giving us O(n)."*
>
> *"Is this optimal? Yes — we can't do better than O(n) because we MUST visit every node at least once to swap its children. Any correct algorithm needs to touch all n nodes. So O(n) is a tight lower bound."*

🧠 *"Nói 'lower bound' = show CS theory knowledge. Không chỉ biết câu trả lời mà biết TẠI SAO không thể tốt hơn."*

> 🎙️ *"**Space complexity: O(h)** where h is the height of the tree, for the recursion call stack."*
>
> *"This is an important distinction — the space doesn't directly depend on n, but on the tree's shape:*
>
> - ***Best case — balanced tree**: height h = log₂(n). Space is O(log n). For example, a perfect binary tree with 1 million nodes has height ~20, so only 20 stack frames.*
>
> - ***Worst case — completely skewed tree**: height h = n. This happens when every node has only one child — like a linked list. The recursion goes n levels deep, so space is O(n). For 1 million nodes, that's 1 million stack frames — likely a stack overflow!"*
>
> *"Average case for a random binary tree: h ≈ O(√n), which falls between the two extremes."*

🧠 *"Mention average case √n = advanced knowledge. Most candidates chỉ biết best/worst."*

> 🎙️ *"This leads to a practical consideration: for very deep trees, the recursive approach could cause a stack overflow. In production, if I know the tree could be deep — say more than 10,000 levels — I'd switch to an iterative approach with an explicit stack or queue to avoid that risk."*

💡 **Tại sao complexity analysis chi tiết — PHÂN TÍCH SÂU:**
- Nói **"lower bound"** = chứng minh optimal = CS fundamentals.
- Phân tích **best / worst / average** = completeness. Most candidates chỉ nói 1 case.
- Cho **con số cụ thể** (1 million nodes → 20 stack frames) = make abstract **CONCRETE** = convincing.
- Mention **production concern** (stack overflow) = senior engineer thinking, không chỉ academic.

---

### 📌 Phút 13–15: Alternative + Show Depth

> 🎙️ *"If we have time, I'd like to show an alternative iterative solution using BFS. This demonstrates that I can solve the same problem with different paradigms."*

> 🎙️ *"Instead of recursion, I use a queue. I start by enqueuing the root. Then in a loop: dequeue a node, swap its children, and enqueue the non-null children. This processes nodes level by level."*

```javascript
function invertTreeBFS(root) {
  if (root === null) return null;
  const queue = [root];
  while (queue.length > 0) {
    const node = queue.shift();
    [node.left, node.right] = [node.right, node.left];
    if (node.left) queue.push(node.left);
    if (node.right) queue.push(node.right);
  }
  return root;
}
```

> 🎙️ *"Same O(n) time — still visiting every node once. But the space profile is different:"*
>
> *"The queue holds at most one entire level of nodes at a time. For a complete binary tree, the widest level — the leaves — has about n/2 nodes. So worst case space is O(n), even for balanced trees."*
>
> *"Interesting trade-off:*
> | Tree Shape | Recursive Space | BFS Space |
> |---|---|---|
> | Balanced | O(log n) ✅ | O(n) |
> | Skewed | O(n) | O(1) ✅ |
>
> *For balanced trees, recursion is BETTER on space. For skewed trees, BFS is BETTER because the queue never holds more than one node at a time (each level has exactly 1 node)."*

🧠 *"So sánh trade-off bằng bảng = instant clarity. Interviewer thấy bạn analysis skill STRONG."*

> 🎙️ *"If I had to choose for production: recursive version for 99% of cases since it's cleaner code and most trees are reasonably balanced. Iterative BFS if I know the tree could be pathologically deep — like a tree built from sorted input without balancing."*

---

### 📌 Khi bạn BÍ — Emergency Phrases

> Đây là các câu nói khi bạn **KHÔNG biết làm gì tiếp**, giúp **câu giờ** trong khi suy nghĩ:

```
KHI ĐANG NGHĨ (chưa có idea):
═══════════════════════════════════════════════════════════════

  🎙️ "Let me think about this for a moment..."
  🎙️ "I'm considering a few approaches..."
  🎙️ "Let me draw this out to visualize the problem..."
  🎙️ "Before I code, let me think about what data structure
      would be most appropriate here..."

KHI CÓ IDEA NHƯNG CHƯA CHẮC:
═══════════════════════════════════════════════════════════════

  🎙️ "I have an intuition that recursion would work well here
      because the tree has a naturally recursive structure.
      Let me think through whether that holds..."
  🎙️ "My initial thought is to use DFS, but let me consider
      whether BFS might be more appropriate..."
  🎙️ "I think I can do this in O(n) time. Let me reason
      about whether that's achievable..."

KHI VIẾT CODE BỊ KẸT:
═══════════════════════════════════════════════════════════════

  🎙️ "Hmm, let me reconsider. I think the issue is..."
  🎙️ "Wait, I need to think about what happens when..."
  🎙️ "Let me go back to my example and trace through
      what this code would do..."
  🎙️ "I think there might be an edge case I'm missing.
      Let me check with a null input..."

KHI HOÀN TOÀN BLANK:
═══════════════════════════════════════════════════════════════

  🎙️ "Let me start with what I know for sure:
      I need to visit every node. So at minimum,
      I need some form of traversal..."
  🎙️ "Let me work through the smallest non-trivial example
      to see if a pattern emerges..."
  🎙️ "Can I break this into smaller subproblems?
      What if I only had a tree with 3 nodes?"
```

---

### 📌 Nếu interviewer hỏi thêm — Full Script

**Q1: "Can you solve this without recursion?"**

> 🎙️ *"Absolutely! I can use an iterative approach with either a queue (BFS) or a stack (DFS). The idea is the same — visit each node, swap its children — but instead of the call stack managing my traversal, I use an explicit data structure."*
>
> *"With BFS, I process level by level. With a stack, I get DFS behavior similar to my recursive solution but without the risk of stack overflow."*
>
> *"Let me code the BFS version..."* *(code ở phần trên)*
>
> *"The stack version is almost identical — I just change queue.shift() to stack.pop(). The difference is traversal ORDER — BFS goes level by level, stack-based goes depth-first. But for this problem, the final result is the same regardless of traversal order."*

**Q2: "What about in-order traversal? Would that work?"**

> 🎙️ *"Great question. In-order traversal has a subtle bug here. Let me walk through why..."*
>
> *"In-order means: process left subtree, then current node, then right subtree."*
> ```
> function invertInOrder(root) {
>   if (!root) return null;
>   invertInOrder(root.left);      // step 1: recurse left
>   [root.left, root.right] = [root.right, root.left]; // step 2: swap
>   invertInOrder(root.right);     // step 3: recurse right ← BUG!
> }
> ```
> *"The problem is at step 3: after swapping, root.right is now the ORIGINAL left subtree that I already processed in step 1! So I'd be processing the original left subtree TWICE and never touching the original right subtree."*
>
> *"A fix is to recurse into root.LEFT again at step 3 — since after swapping, root.left holds the original right subtree:"*
> ```
> invertInOrder(root.left);   // step 1: process original left
> [root.left, root.right] = [root.right, root.left]; // swap
> invertInOrder(root.left);   // step 3: process original right (now on left!)
> ```
> *"This works but is confusing — so pre-order or post-order is cleaner."*

**Q3: "Can you create a NEW inverted tree instead of in-place?"**

> 🎙️ *"Yes! Instead of modifying the existing tree, I create new nodes at each step:*
> ```javascript
> function invertTreeNew(root) {
>   if (root === null) return null;
>   return new TreeNode(
>     root.val,
>     invertTreeNew(root.right),  // right becomes new left!
>     invertTreeNew(root.left)    // left becomes new right!
>   );
> }
> ```
> *"This preserves the original tree — useful in functional programming or when you need the original tree for comparison. The trade-off is O(n) extra space for the new nodes, on top of the O(h) stack space."*

**Q4: "What if the tree has millions of nodes?"**

> 🎙️ *"Several practical considerations:*
>
> *1. **Stack overflow**: For very deep trees, recursion could overflow. I'd use the iterative BFS approach.*
>
> *2. **Memory**: Each node is visited once, so memory access is O(n). For cache efficiency, BFS (level-by-level) might perform better than DFS because it accesses memory more sequentially if the tree is stored in a breadth-first layout.*
>
> *3. **Parallelism**: Since inverting the left subtree is completely independent of inverting the right subtree, this could theoretically be parallelized. In practice, for a tree in memory, the overhead of threading would likely outweigh the benefits."*
>
> *"But honestly, for millions of nodes — even O(n) at, say, 10 million — on a modern machine doing just a pointer swap per node, that's milliseconds. The bottleneck would be I/O (loading the tree into memory), not the inversion itself."*

**Q5: "What's the relationship to checking if a tree is symmetric?"**

> 🎙️ *"A tree is symmetric (a mirror of itself) if and only if it equals its own inversion. So one approach to check symmetry is: invert a copy, then compare the original and inverted trees node by node."*
>
> *"But that's actually less efficient than the direct approach for LeetCode #101 (Symmetric Tree), where you compare the left subtree with the mirrored right subtree simultaneously in O(n) time without creating a copy."*
>
> *"Still, understanding inversion gives you the intuition: symmetric = isMirror(root.left, root.right), where isMirror compares a node in one subtree with the corresponding node in the other."*

**Q6: "How would you test this function?"**

> 🎙️ *"I'd write tests at multiple levels:*
>
> ***Unit tests — cover all shapes:***
> *— Empty tree (null)*
> *— Single node (no children)*
> *— Complete binary tree (all levels full)*
> *— Left-skewed tree (linked list going left)*
> *— Right-skewed tree (linked list going right)*
> *— Trees with mixed children (some nodes have 1 child)*
> *— Tree with only 2 nodes*
>
> ***Property-based test:***
> *— invertTree(invertTree(tree)) should equal the original tree. Double inversion = identity!*
> *— This is actually a great invariant to test because it catches subtle bugs."*

**Q7: "What's the time complexity of your BFS approach using queue.shift()?"**

🧠 *"Cẩn thận! Câu hỏi bẫy! queue.shift() trong JS array = O(n)!"*

> 🎙️ *"Ah, good catch. In JavaScript, Array.shift() is O(n) because it needs to re-index all remaining elements. So my BFS loop doing shift() n times gives O(n²) total, not O(n)!"*
>
> *"In a real interview, I'd mention this and say: for true O(n) BFS, I'd either use a proper Queue implementation with a linked list, or use an index pointer instead of shift():"*
> ```javascript
> let head = 0;
> while (head < queue.length) {
>   const node = queue[head++];   // O(1) instead of shift()!
>   ...
> }
> ```
> *"Or I'd note that for this problem size, the O(n²) from shift() is unlikely to matter in practice, but I'm aware of the issue."*

---

### 📌 Pattern Recognition — Nhận diện bài tương tự

```
KHI NÀO SỬ DỤNG PATTERN NÀY:
═══════════════════════════════════════════════════════════════

  "Swap children + recurse" pattern áp dụng khi:

  1. Cần BIẾN ĐỔI cấu trúc tree (không chỉ đọc!)
  2. Mỗi node cần xử lý INDEPENDENTLY
  3. Thuộc dạng "mirror/flip/reverse" tree

  BÀI TƯƠNG TỰ:

  ┌────────────────────────────────┬───────────────────────┐
  │ Problem                       │ Khác gì Invert Tree?  │
  ├────────────────────────────────┼───────────────────────┤
  │ #101 Symmetric Tree            │ COMPARE thay vì SWAP  │
  │ → isMirror(left, right)        │ Read-only!            │
  ├────────────────────────────────┼───────────────────────┤
  │ #100 Same Tree                 │ COMPARE 2 trees       │
  │ → check val + left + right     │ Read-only!            │
  ├────────────────────────────────┼───────────────────────┤
  │ #104 Maximum Depth             │ AGGREGATE thay vì SWAP│
  │ → 1 + max(left, right)        │ Return number!        │
  ├────────────────────────────────┼───────────────────────┤
  │ #572 Subtree of Another Tree   │ SEARCH + COMPARE      │
  │ → find node + isSameTree       │ Two-pass!             │
  ├────────────────────────────────┼───────────────────────┤
  │ #951 Flip Equivalent Trees     │ OPTIONAL swap         │
  │ → swap OR don't swap at each   │ Decision per node!    │
  │   node to make trees equal     │                       │
  └────────────────────────────────┴───────────────────────┘

  TEMPLATE CHUNG cho Tree Recursion:

  function solve(root) {
    if (root === null) return BASE_CASE;

    // Option A: process TRƯỚC recurse (pre-order)
    doSomething(root);
    solve(root.left);
    solve(root.right);

    // Option B: process SAU recurse (post-order)
    const leftResult = solve(root.left);
    const rightResult = solve(root.right);
    return combine(root, leftResult, rightResult);
  }
```

---

### 🧠 Nguyên tắc Think Out Loud — Chi tiết

```
6 NGUYÊN TẮC VÀNG:
═══════════════════════════════════════════════════════════════

  1. KHÔNG BAO GIỜ im lặng > 15 giây!

     Interviewer không biết bạn đang:
     → Suy nghĩ sâu? → TỐT
     → Hoàn toàn bí? → XẤU
     Họ KHÔNG phân biệt được!

     Fix: NÓI những gì bạn đang nghĩ:
     ❌ (im lặng 20 giây)
     ✅ "I'm thinking about whether pre-order or
         post-order would be more appropriate here..."

  ─────────────────────────────────────────────────────

  2. NÓI TRƯỚC khi code!

     Mỗi block code, announce ý định TRƯỚC:
     ❌ (im lặng viết 5 dòng) "OK done"
     ✅ "I'm going to start with my base case,
         checking for null..." (rồi mới viết)

     Interviewer cần CONTEXT để theo dõi code bạn.
     Không có context = họ bị lạc = đánh giá thấp.

  ─────────────────────────────────────────────────────

  3. NÓI TẠI SAO, không chỉ CÁI GÌ!

     ❌ "I'll use recursion."
        → Interviewer: "OK...nhưng tại sao?"

     ✅ "I'll use recursion because this problem has
         optimal substructure — inverting a tree is
         equivalent to swapping children at the root
         and independently inverting both subtrees.
         This naturally maps to a recursive solution."
        → Interviewer: "This person GETS IT."

  ─────────────────────────────────────────────────────

  4. Thừa nhận trade-offs TRƯỚC khi hỏi!

     ❌ Chờ interviewer hỏi weakness
     ✅ Tự nói: "The recursive approach is clean and
         concise, but the trade-off is O(h) stack space,
         which could be problematic for very deep trees.
         The iterative BFS approach avoids this at the
         cost of more verbose code."

     Self-aware about limitations = senior signal!

  ─────────────────────────────────────────────────────

  5. Edge cases NÓI SỚM + TỰ NGUYỆN!

     ❌ Chờ interviewer: "What about null?"
        → Reactive = junior

     ✅ Tự nói ở phần clarify: "I should handle
         several edge cases: null tree, single node,
         unbalanced trees, and nodes with one child."
        → Proactive = senior

  ─────────────────────────────────────────────────────

  6. VERIFY code SAU KHI viết — LUÔN LUÔN!

     ❌ "I think this is correct." (không check)
        → Interviewer không tin

     ✅ "Let me trace through my code with the
         example to verify: invertTree(4) — root is
         4, not null. Swap: left becomes 7, right
         becomes 2..." (trace từng bước)
        → Interviewer thấy BẠN TỰ KIỂM TRA = trustworthy

     Bonus: check 2-3 edge cases sau khi trace!
```

```
NGÔN NGỮ CƠ THỂ (nếu interview trực tiếp):
═══════════════════════════════════════════════════════════════

  ✅ Eye contact khi GIẢI THÍCH
  ✅ Nhìn code/whiteboard khi VIẾT
  ✅ Point vào diagram khi TRACE
  ✅ Gật đầu khi interviewer nói
  ✅ Viết rõ ràng, chữ to (whiteboard)

  ❌ Cúi đầu vào code suốt
  ❌ Nói nhỏ, lí nhí
  ❌ Viết code bé xíu trên whiteboard
  ❌ Không bao giờ nhìn interviewer
```

