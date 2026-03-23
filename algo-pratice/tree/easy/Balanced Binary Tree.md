# 🌳 Balanced Binary Tree (LeetCode #110)

> 📖 Code: [Balanced Binary Tree.js](./Balanced%20Binary%20Tree.js)

---

## 🧠 Bản chất bài toán — Hiểu để NHỚ, không chỉ để GIẢI

> ⚡ **Đọc phần này TRƯỚC. Nếu bạn chỉ nhớ 1 thứ, nhớ phần này.**

### 1️⃣ Analogy — Ví dụ đời thường

```
⚖️ CÂN BẰNG — đây là TẤT CẢ bạn cần nhớ!

  Tưởng tượng 1 CÂY THẬT trong vườn:
  → Nếu nhánh TRÁI dài 5m, nhánh PHẢI dài 3m → CHÊNH 2m → NGHIÊNG!
  → Nếu nhánh TRÁI dài 3m, nhánh PHẢI dài 3m → CHÊNH 0m → CÂN BẰNG!
  → Nếu nhánh TRÁI dài 4m, nhánh PHẢI dài 3m → CHÊNH 1m → VẪN OK!

  QUY TẮC: Chênh lệch chiều cao ≤ 1 = CÂN BẰNG!
           Chênh lệch > 1 = KHÔNG CÂN BẰNG!

  VÀ phải kiểm tra Ở MỌI NODE, không chỉ root!

  ĐÓ LÀ TẤT CẢ. Không có gì phức tạp hơn.
```

### 2️⃣ Recipe — 3 bước, ghi nhớ MÃI MÃI

```
📝 RECIPE (3 bước — viết đi viết lại cho đến khi thuộc):

  Bước 1: Nếu node === null → return chiều cao 0 (cây rỗng = balanced!)
  Bước 2: Hỏi con TRÁI chiều cao bao nhiêu? Con PHẢI bao nhiêu?
  Bước 3: Nếu CHÊNH > 1 → return -1 (báo lỗi!)
           Nếu CHÊNH ≤ 1 → return chiều cao = 1 + max(trái, phải)

  Trick: dùng -1 làm "tín hiệu lỗi" → phát hiện lỗi thì truyền lên!
```

```javascript
// Đây là BẢN CHẤT — hàm helper trả về height HOẶC -1 nếu mất cân bằng:
function isBalanced(root) {
  function height(node) {
    if (node === null) return 0; // Bước 1: DỪNG
    const left = height(node.left); // Bước 2: hỏi trái
    const right = height(node.right); //         hỏi phải
    if (left === -1 || right === -1) return -1; // con đã lỗi → truyền lên!
    if (Math.abs(left - right) > 1) return -1; // Bước 3: chênh > 1 → lỗi!
    return 1 + Math.max(left, right); //         OK → trả chiều cao
  }
  return height(root) !== -1;
}
```

### 3️⃣ Visual — Hình ảnh ghi vào đầu

```
CÂN BẰNG ✅:             KHÔNG CÂN BẰNG ❌:

      3                        1
     / \                      /
    9   20                   2
       / \                  /
      15  7                3
                          /
                         4

  Mỗi node:               Node 1:
  3: trái=1, phải=2        trái=3, phải=0
     chênh=1 ✅ OK!        chênh=3 ❌ QUÁ CHÊNH!

  Nhớ: kiểm tra MỌI node, không chỉ root!
```

### 4️⃣ Tại sao recursion?

```
❓ "Tại sao dùng recursion cho bài này?"

Vì muốn biết chiều cao → PHẢI hỏi CON trước!

      3
     / \
    9   20       Muốn biết chiều cao tại 3?
       / \       → Phải biết chiều cao tại 9 VÀ 20 trước!
      15  7      → Muốn biết 20? Phải biết 15 VÀ 7 trước!

  Thông tin đi TỪ DƯỚI LÊN (post-order!)
  → Con trả kết quả cho cha → cha tính tiếp → RECURSION!
```

### 5️⃣ Flashcard — Tự kiểm tra

> Che cột bên phải, trả lời rồi mở ra check!

| ❓ Câu hỏi | ✅ Đáp án |
|---|---|
| Balanced tree nghĩa là gì? | Mọi node: chênh lệch chiều cao trái-phải ≤ 1 |
| Base case là gì? | `if (node === null) return 0` (height = 0) |
| -1 nghĩa là gì? | Tín hiệu "mất cân bằng" — truyền lên cho cha! |
| Pre-order hay Post-order? | **Post-order!** Phải biết con trước, rồi tính cha! |
| Time complexity? | **O(n)** — mỗi node visit 1 lần |
| Space complexity? | **O(h)** — h = height, do call stack |
| Balanced tree: space? | **O(log n)** |
| Skewed tree: space? | **O(n)** — cây thành linked list |
| Cây rỗng (null) balanced không? | **CÓ!** return true |
| Cây 1 node balanced không? | **CÓ!** trái=0, phải=0, chênh=0 |

### 6️⃣ Sai lầm phổ biến — ĐỪNG mắc!

```
❌ SAI LẦM #1: Chỉ check ROOT, quên check subtrees!

   Root: trái=2, phải=2 → chênh 0 → "balanced!"
   NHƯNG bên trong subtree trái MẤT CÂN BẰNG!

       1          ← root OK (trái=2, phải=2, chênh=0)
      / \
     2   3        ← node 2 OK
    /     \
   4       5      ← node 3: trái=0, phải=1, OK
    \
     6             ← node 4: trái=0, phải=1, OK

   Phải check TẤT CẢ nodes!

─────────────────────────────────────────────────────

❌ SAI LẦM #2: Tính height riêng, check riêng → O(n²)!

   // CHẬM! O(n²)
   function isBalanced(root) {
     if (!root) return true;
     return Math.abs(getHeight(root.left) - getHeight(root.right)) <= 1
       && isBalanced(root.left)
       && isBalanced(root.right);
   }

   → Mỗi node gọi getHeight → duyệt lại subtree → O(n²)!
   → Dùng trick -1 để gộp height + check vào 1 lần duyệt!

─────────────────────────────────────────────────────

❌ SAI LẦM #3: Quên check con đã -1 chưa!

   const left = height(node.left);
   const right = height(node.right);
   // ← QUÊN check: if (left === -1 || right === -1) return -1
   // → Không truyền lỗi lên → kết quả SAI!

─────────────────────────────────────────────────────

❌ SAI LẦM #4: Nhầm height với depth!

   Height = đếm TỪ DƯỚI LÊN (lá = 0 hoặc 1)
   Depth  = đếm TỪ TRÊN XUỐNG (root = 0)
   Bài này dùng HEIGHT!
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
  → "Base case là gì?" (null → return 0)
  → "Mỗi node làm gì?" (hỏi height trái phải, check chênh > 1?)
  → "Lỗi trả gì?" (-1, truyền lên!)
  → "Complexity?" (O(n) time, O(h) space)
```

---

### 8️⃣ Cách TƯ DUY để tự giải — Gặp lại vẫn làm được!

> 🎯 **Mục tiêu:** Không phải nhớ code, mà nhớ **CÁCH NGHĨ**.
> Khi gặp lại bài này (hoặc bài tương tự), bạn tự SUY RA được lời giải.

**Bước 1: Đọc đề → Hỏi "Mỗi node cần làm gì?"**

```
Đề: "Check if a binary tree is height-balanced"

🧠 Tự hỏi: "Nếu mình chỉ ĐỨNG TẠI 1 NODE, mình cần biết gì?"

  Trả lời: Cần biết CHIỀU CAO bên trái và bên phải!
           Rồi check: |trái - phải| ≤ 1?

  → Đây là CÔNG VIỆC TẠI MỖI NODE.
  → Cần thông tin TỪ CON → POST-ORDER recursion!
```

**Bước 2: Hỏi "Khi nào DỪNG?"**

```
🧠 Tự hỏi: "Khi nào không cần tính nữa?"

  Trả lời: Khi node === null → height = 0 → balanced!

  → Đây là BASE CASE.
```

**Bước 3: Hỏi "Trả về gì?"**

```
🧠 Tự hỏi: "Hàm height nên return gì?"

  Trả lời:
    → Nếu balanced: height thật (1 + max(trái, phải))
    → Nếu mất cân bằng: -1 (TÍN HIỆU LỖI!)

  → Cha nhận -1 → biết con lỗi → truyền -1 tiếp → nhanh!
```

**Bước 4: Ghép lại → thành code**

```
🧠 Ghép 3 câu trả lời:

  "Nếu null → return 0.
   Hỏi trái, hỏi phải.
   Nếu con lỗi (-1) → return -1.
   Nếu chênh > 1 → return -1.
   Nếu OK → return 1 + max(trái, phải)."

  → KHÔNG CẦN NHỚ CODE! Chỉ cần trả lời 3 câu hỏi!
```

**💡 Framework chung — So sánh với bài khác:**

```
┌──────────────────────────────────────────────────────┐
│  3 CÂU HỎI VÀNG cho mọi bài tree recursion:        │
│                                                      │
│  ❶ "Mỗi node cần làm gì?"                           │
│     → Balanced: check |heightL - heightR| ≤ 1       │
│     → Max Depth: return 1 + max(left, right)         │
│     → Invert: swap left↔right                       │
│                                                      │
│  ❷ "Khi nào DỪNG?" (base case)                      │
│     → Hầu hết: node === null                         │
│                                                      │
│  ❸ "Cần kết quả từ con không?"                      │
│     → CÓ (post-order): Balanced, Max Depth          │
│     → KHÔNG (pre-order): Invert Tree                │
│                                                      │
│  Trả lời 3 câu này → TỰ VIẾT ĐƯỢC CODE!            │
└──────────────────────────────────────────────────────┘
```

---

> 📚 **Phần dưới đây là GIẢI THÍCH CHI TIẾT.** Đọc khi muốn hiểu SÂU hơn.
> Nếu bạn đã hiểu phần trên → bạn đã nắm 80% bài này rồi!

---

## R — Repeat & Clarify (Nhắc lại + Hỏi rõ)

💬 *"Bài này yêu cầu kiểm tra xem binary tree có CÂN BẰNG CHIỀU CAO không — tức mọi node đều có |height(left) - height(right)| ≤ 1."*

### Câu hỏi cần hỏi interviewer:

1. **"Tree có thể rỗng (null) không?"** → CÓ! `null → return true` (cây rỗng = balanced!)
2. **"Balanced nghĩa là chỉ root hay MỌI node?"** → MỌI node! Subtrees cũng phải balanced!
3. **"Height tính theo edges hay nodes?"** → Thường edges (leaf = 0). Nhưng cả 2 cách đều OK!
4. **"Node chỉ có 1 child?"** → Vẫn check! `height(null) = 0`, height(child) ≥ 1, chênh có thể > 1!

```
CÂN BẰNG ✅:                    KHÔNG CÂN BẰNG ❌:

        3                              1
       / \                            / \
      9   20         →               2   2
         / \                        / \
        15  7                      3   3
                                  / \
                                 4   4

  Mọi node: |h_left - h_right| ≤ 1    Node 2: |h_left=2 - h_right=0| = 2 > 1!
```

---

## E — Examples (Ví dụ)

```
VÍ DỤ 1 — Balanced:
Input:        3           Output: true
             / \
            9   20        Kiểm tra:
               / \          3: |1-2| = 1 ≤ 1 ✅
              15  7          9: |0-0| = 0 ≤ 1 ✅
                            20: |1-1| = 0 ≤ 1 ✅

VÍ DỤ 2 — Không balanced:
Input:     1              Output: false
          / \
         2   2            Node 2 (trái): |2-0| = 2 > 1 ❌
        / \
       3   3
      / \
     4   4

VÍ DỤ 3 — Empty:     null → true  (cây rỗng = balanced!)
VÍ DỤ 4 — Single:    [1]  → true  (1 node, không con)

VÍ DỤ 5 — Tricky (root OK nhưng subtree không!):
Input:      1             Output: false
           / \
          2   3           Root 1: |2-1| = 1 ✅ (trông OK!)
         /     \          NHƯNG node 2: |1-0| = 1 ✅
        4       5         VÀ node 3: |0-1| = 1 ✅
       /         \        VÀ node 4: |1-0| = 1 ✅
      6           7       Hmm, cái này thực ra balanced!
                          → Phải TRACE cẩn thận!
```

---

## A — Approach (Cách tiếp cận)

```
┌──────────────────────────────────────────────────────────┐
│ APPROACH 1: BRUTE FORCE — O(n²)                          │
│ → Mỗi node: tính height riêng → check chênh lệch       │
│ → Mỗi height() duyệt lại subtree → O(n) × n = O(n²)!   │
│ → Time: O(n²) | Space: O(h)                              │
├──────────────────────────────────────────────────────────┤
│ APPROACH 2: OPTIMAL — O(n) dùng trick -1                 │
│ → Gộp tính height + check balanced vào 1 hàm!           │
│ → Return -1 nếu unbalanced → truyền lên ngay!           │
│ → Time: O(n) | Space: O(h)                               │
└──────────────────────────────────────────────────────────┘
```

💬 *"Tôi chọn Approach 2 vì gộp height + check vào 1 pass, tránh tính lại height O(n²)."*

### Tại sao -1?

```
Vấn đề: hàm height() cần return 2 thứ:
  1. Chiều cao (số)
  2. Có balanced không (true/false)

Nhưng hàm chỉ return ĐƯỢC 1 THỨ!

Giải pháp: dùng -1 làm "mã lỗi":
  → -1 = "mất cân bằng rồi, đừng tính nữa!"
  → Số ≥ 0 = chiều cao thật, vẫn balanced!

  Chiều cao không bao giờ < 0 → -1 an toàn!
```

---

## C — Code

> 📖 Full code: [Balanced Binary Tree.js](./Balanced%20Binary%20Tree.js)

### Approach 1: Brute Force — O(n²)

```javascript
function isBalancedBrute(root) {
  if (root === null) return true;

  function getHeight(node) {
    if (node === null) return 0;
    return 1 + Math.max(getHeight(node.left), getHeight(node.right));
  }

  // Check root + recurse vào cả 2 con
  return (
    Math.abs(getHeight(root.left) - getHeight(root.right)) <= 1 &&
    isBalancedBrute(root.left) &&
    isBalancedBrute(root.right)
  );
}
```

```
Tại sao O(n²)?

  Mỗi node gọi getHeight → duyệt subtree bên dưới
  Node root: getHeight duyệt n nodes
  Node con: getHeight duyệt n/2 nodes
  ...
  Tổng: n + n/2 + n/4 + ... ≈ O(n²) với skewed tree!
```

### Approach 2: Optimal — O(n) dùng -1

```javascript
function isBalanced(root) {
  function height(node) {
    if (node === null) return 0; // cây rỗng, height = 0

    const left = height(node.left); // hỏi con trái
    if (left === -1) return -1; // con trái lỗi → truyền lên!

    const right = height(node.right); // hỏi con phải
    if (right === -1) return -1; // con phải lỗi → truyền lên!

    if (Math.abs(left - right) > 1) return -1; // chênh > 1 → lỗi!

    return 1 + Math.max(left, right); // OK → trả height thật
  }

  return height(root) !== -1;
}
```

### Trace ví dụ BALANCED:

```
Tree:       3
           / \
          9   20
             / \
            15  7

height(3):
  height(9):
    height(null) → 0 (trái)
    height(null) → 0 (phải)
    |0-0| = 0 ≤ 1 ✅
    return 1 + max(0,0) = 1
  left = 1

  height(20):
    height(15):
      height(null) → 0, height(null) → 0
      return 1
    height(7):
      height(null) → 0, height(null) → 0
      return 1
    |1-1| = 0 ≤ 1 ✅
    return 1 + max(1,1) = 2
  right = 2

  |1-2| = 1 ≤ 1 ✅
  return 1 + max(1,2) = 3

height(root) = 3 ≠ -1 → return true ✅
```

### Trace ví dụ KHÔNG BALANCED:

```
Tree:     1
         /
        2
       /
      3

height(1):
  height(2):
    height(3):
      height(null) → 0, height(null) → 0
      |0-0| = 0 ✅
      return 1
    left = 1

    height(null) → 0
    right = 0

    |1-0| = 1 ≤ 1 ✅ (node 2 vẫn OK!)
    return 1 + max(1,0) = 2
  left = 2

  height(null) → 0
  right = 0

  |2-0| = 2 > 1 ❌ → return -1!    ← Node 1 MẤT CÂN BẰNG!

height(root) = -1 → return false ❌
```

---

## T — Test (Kiểm thử)

```
TEST CASES:

  ✅ Balanced:        [3,9,20,null,null,15,7] → true
  ❌ Unbalanced:      [1,2,2,3,3,null,null,4,4] → false
  ✅ Empty:           null → true
  ✅ Single node:     [1] → true
  ❌ Skewed left:     [1,2,null,3] → false
  ❌ Skewed right:    [1,null,2,null,3] → false
  ✅ Perfect:         [1,2,3,4,5,6,7] → true
  ✅ 1 child:         [1,2] → true (chênh = 1)
```

---

## O — Optimize (Tối ưu)

```
┌─────────────────┬──────────────┬──────────────┐
│ Approach         │ Time         │ Space        │
├─────────────────┼──────────────┼──────────────┤
│ Brute Force     │ O(n²)        │ O(h)         │
│ Optimal (-1)    │ O(n)         │ O(h)         │
└─────────────────┴──────────────┴──────────────┘

  Optimal NHANH hơn vì:
  1. Mỗi node chỉ visit 1 LẦN (không tính height lại!)
  2. Phát hiện lỗi → return -1 NGAY → bỏ qua phần còn lại!

  Không thể nhanh hơn O(n) vì PHẢI xem mọi node!
```

---

## 🧩 Pattern Recognition — Bài tương tự

```
Pattern: "POST-ORDER + trả kết quả TỪ DƯỚI LÊN"

  Balanced Tree (#110)     → return height hoặc -1
  Maximum Depth (#104)     → return 1 + max(left, right)
  Diameter of Tree (#543)  → return depth, cập nhật global max
  Binary Tree Max Path (#124) → return max path, cập nhật global

  CHUNG: hỏi con → tính tại node → trả cho cha!
```

---

## 🔗 Liên hệ với bài đã học

```
Balanced Tree vs Max Depth:
  Max Depth:     return 1 + max(left, right)         ← CHỈ tính height
  Balanced Tree: return 1 + max(left, right) HOẶC -1 ← tính height + CHECK!

Balanced Tree vs Invert Tree:
  Invert:    pre-order  (xử lý root TRƯỚC, rồi đi xuống)
  Balanced:  post-order (đi xuống TRƯỚC, rồi xử lý root!)

  Tại sao?
  Invert: swap left↔right KHÔNG CẦN biết gì về con → pre-order OK!
  Balanced: PHẢI biết height con TRƯỚC → post-order bắt buộc!
```

---

## 🗣️ Think Out Loud — Kịch Bản Interview Chi Tiết

> Đây là **KỊCH BẢN MẪU** cho interview, nói to từng suy nghĩ.
> Interviewer đánh giá **quá trình tư duy** chứ không chỉ kết quả!
>
> Format: 🎙️ = **NÓI TO** (interviewer nghe) | 🧠 = **SUY NGHĨ THẦM** (trong đầu)

---

### 📌 Phút 0–2: Nhận đề + Clarify

🧠 *Suy nghĩ thầm: "Balanced binary tree — bài classic post-order! Mình biết trick -1 rồi, nhưng ĐỪNG vội. Phải show process. Interviewer muốn thấy CÁCH NGHĨ."*

> 🎙️ *"OK, so the problem asks me to determine if a binary tree is height-balanced. Let me make sure I understand the definition correctly."*

> 🎙️ *"A height-balanced binary tree is one where, for EVERY node in the tree, the absolute difference between the heights of its left and right subtrees is at most 1. This condition must hold at every node, not just the root. Is that correct?"*

🧠 *"Nhấn mạnh 'every node' = cho thấy mình hiểu gotcha — chỉ check root thì SAI."*

> 🎙️ *"Before I start, a few clarifying questions:"*

> 🎙️ *"**First** — can the tree be empty? I assume null should return true, since an empty tree is trivially balanced."*
>
> *(Interviewer: "Yes, return true for null.")*

> 🎙️ *"**Second** — how do we define height? The number of edges on the longest path from a node to a leaf? So a leaf node has height 0, and null has height... I'll treat it as 0 for consistency."*
>
> *(Interviewer: "That works.")*

> 🎙️ *"**Third** — I just want to confirm: a tree where the root is balanced but a subtree is NOT — that should return false, right? The condition is global, not just at the root."*
>
> *(Interviewer: "Correct.")*

💡 **Tại sao phải hỏi — PHÂN TÍCH SÂU:**
- Hỏi "every node" = cho thấy bạn biết **SAI LẦM #1** phổ biến (chỉ check root).
- Hỏi "height definition" = show **precision** — edges vs nodes cho kết quả khác.
- Hỏi về subtree = show bạn **anticipate tricky cases** trước khi code.

---

### 📌 Phút 2–4: Vẽ ví dụ + Trace tay

🧠 *"Vẽ 2 ví dụ: 1 balanced, 1 NOT. Dùng lại để trace code sau."*

> 🎙️ *"Let me draw out two examples — one balanced and one not — to solidify my understanding."*

> *(Vẽ ví dụ 1: Balanced)*
> ```
>       3
>      / \
>     9   20
>        / \
>       15  7
> ```

> 🎙️ *"This tree is balanced. Let me verify: node 3 has left subtree height 1, right subtree height 2 — difference is 1, OK. Node 20 has left and right heights both 1 — difference is 0. All other nodes are leaves. So every node satisfies the condition."*

> *(Vẽ ví dụ 2: NOT balanced)*
> ```
>       1
>      / \
>     2   2
>    / \
>   3   3
>  / \
> 4   4
> ```

> 🎙️ *"This tree is NOT balanced. At node 2 (left child of root), left subtree height is 2, right subtree height is 0 — difference is 2, which exceeds 1. Even though the root itself has balanced heights, the subtree violates the condition."*

> 🎙️ *"Edge cases I'm thinking about:*
> *1. **Null tree** → return true.*
> *2. **Single node** → height 0, trivially balanced.*
> *3. **Skewed tree** (1→2→3) → unbalanced at root: left height 2, right height 0."*

💡 **Tại sao ví dụ 2 quan trọng:**
- Cho thấy "root balanced NHƯNG subtree không" → bắt được **gotcha** mà nhiều người mắc.
- Interviewer thấy bạn **test trường hợp TRICKY**, không chỉ happy path.

---

### 📌 Phút 4–7: Nói Approach

🧠 *"Có 2 cách: brute force O(n²) và optimal O(n). Nói BRUTE trước, rồi optimize → show thinking process."*

> 🎙️ *"I see two approaches here. Let me start with the straightforward one, then optimize."*

> 🎙️ *"**Approach 1 — Brute Force:** At each node, I compute the heights of its left and right subtrees using a separate getHeight function, check if the difference is at most 1, then recurse into both children. This works, but it's O(n²) in the worst case because getHeight traverses the subtree at every node — the same nodes get visited repeatedly."*

🧠 *"Nói brute force TRƯỚC + nhận ra nó chậm = show problem-solving progression, không chỉ nhảy vào optimal."*

> 🎙️ *"**Approach 2 — Optimal:** I can do better by combining the height calculation and balance check into a SINGLE function. The key insight is: instead of computing height separately, I write a helper function that returns the height if balanced, or -1 if any subtree is unbalanced. This -1 acts as an early termination signal — as soon as I detect imbalance, I propagate -1 upward without computing anything else."*

> 🎙️ *"This is a post-order traversal — I need to know the heights of the children BEFORE I can check the current node. Each node is visited exactly once, giving us O(n) time."*

> 🎙️ *"For space, it's O(h) where h is the tree height — just the recursion call stack. O(log n) for balanced trees, O(n) worst case for skewed trees."*

> 🎙️ *"I'll implement the optimal approach since it's only slightly more complex but much more efficient."*

💡 **Tại sao nói brute force trước — PHÂN TÍCH SÂU:**
- Show **progression**: brute → realize redundancy → optimize = đây là cách engineer THẬT suy nghĩ.
- Interviewer thấy bạn **hiểu trade-off**, không chỉ memorize optimal.
- Nếu interviewer MUỐ brute force → bạn đã sẵn sàng!

---

### 📌 Phút 7–10: Code + Narrate từng dòng

🧠 *"Code. NHỚ: nói MỖI dòng khi viết. Đừng im lặng!"*

> 🎙️ *"Alright, let me code the optimal approach."*

```javascript
function isBalanced(root) {
```

> 🎙️ *"I'll define a helper function called height. It returns the actual height if the subtree is balanced, or -1 if it's not. Using -1 as a sentinel value works because valid heights are always non-negative."*

```javascript
  function height(node) {
```

> 🎙️ *"Base case: an empty tree has height 0 and is trivially balanced."*

```javascript
    if (node === null) return 0;
```

> 🎙️ *"I recursively get the left subtree's height. Critically, if it returns -1, that means some subtree below is already unbalanced — I immediately propagate -1 upward without doing any more work. This is the early termination optimization."*

```javascript
    const left = height(node.left);
    if (left === -1) return -1;
```

> 🎙️ *"Same for the right subtree."*

```javascript
    const right = height(node.right);
    if (right === -1) return -1;
```

> 🎙️ *"Now I check the current node: if the height difference exceeds 1, I return -1 to signal imbalance."*

```javascript
    if (Math.abs(left - right) > 1) return -1;
```

> 🎙️ *"If everything's fine, I return the actual height: 1 plus the max of left and right heights."*

```javascript
    return 1 + Math.max(left, right);
  }
```

> 🎙️ *"Finally, the main function just checks whether height returned -1 or not."*

```javascript
  return height(root) !== -1;
}
```

> 🎙️ *"The entire solution is about 10 lines. The -1 sentinel pattern is very powerful for tree problems where you want to combine validation with computation."*

💡 **Tại sao narrate từng dòng — PHÂN TÍCH SÂU:**
- Giải thích **"early termination"** = show bạn hiểu TẠI SAO nó nhanh, không chỉ biết code.
- Mention **"sentinel value"** = CS terminology, show technical vocabulary.

---

### 📌 Phút 10–12: Trace code với ví dụ

🧠 *"Trace ví dụ UNBALANCED — thú vị hơn vì thấy -1 propagation."*

> 🎙️ *"Let me trace through the unbalanced example to verify my code."*

> 🎙️ *"Tree:*
> ```
>     1
>    / \
>   2   2
>  / \
> 3   3
> / \
> 4  4
> ```

> 🎙️ *"**height(1):***
> *→ height(2-left):*
> *→→ height(3):*
> *→→→ height(4): left=0, right=0. |0-0|=0 ✅. Return 1.*
> *→→→ height(4): Return 1.*
> *→→ left=1, right=1. |1-1|=0 ✅. Return 2.*
> *→→ height(3): Return 1.*
> *→ left=2, right=1. |2-1|=1 ✅. Return 3.*
>
> *→ height(2-right): left=0, right=0. Return 1.*
>
> *left=3, right=1. |3-1| = **2 > 1 ❌ → return -1!***"*

> 🎙️ *"height returns -1, so isBalanced returns false. The imbalance is detected at the ROOT — left subtree height 3 vs right subtree height 1, difference 2. ✅"*

> 🎙️ *"Let me also check the balanced example: [3,9,20,null,null,15,7]. heights propagate up as 1, 1, 2, and at the root |1-2|=1 ≤ 1, so it returns 3 ≠ -1 → true. ✅"*

---

### 📌 Phút 12–14: Complexity Analysis

> 🎙️ *"**Time complexity: O(n)** — each node is visited exactly once. At each node, I do constant-time work: two comparisons and a max operation."*

> 🎙️ *"Is this optimal? Yes — any correct algorithm must examine every node at least once, because a single deep subtree could make the tree unbalanced. So O(n) is a tight lower bound."*

> 🎙️ *"Compare this with the brute force approach: it's O(n²) in the worst case because at each of the n nodes, getHeight traverses up to n nodes below it. Total work: n + (n-1) + (n-2) + ... = n(n-1)/2."*

> 🎙️ *"**Space complexity: O(h)** for the recursion stack, where h is the tree height."*
>
> *"— **Balanced tree**: h = log₂(n), so O(log n) space.*
> *— **Skewed tree**: h = n, so O(n) space. This is the worst case."*

> 🎙️ *"The early termination with -1 is a nice bonus — if the tree is unbalanced deep down, we skip computing heights for the rest of the tree. But the worst-case complexity remains O(n) since we might need to check every node."*

💡 **Tại sao compare brute vs optimal — PHÂN TÍCH SÂU:**
- Show bạn biết CẢ HAI approaches + hiểu **WHY** one is better.
- Derive n(n-1)/2 cụ thể = **mathematical rigor**, không chỉ nói "O(n²)".

---

### 📌 Phút 14–15: Alternative + Follow-up sẵn sàng

> 🎙️ *"The -1 sentinel pattern is a specific case of a more general technique: using the return value to encode BOTH a result AND an error signal. An alternative is to use a tuple or an object — return {balanced: true, height: 3} — but that's more verbose. The -1 trick works because height is always ≥ 0."*

> 🎙️ *"I'd also note that this same post-order pattern — 'compute something from children, then decide at current node' — appears in many tree problems: diameter, maximum path sum, subtree sums. Recognizing this pattern makes those problems much easier."*

---

### 📌 Khi bạn BÍ — Emergency Phrases

```
KHI ĐANG NGHĨ (chưa có idea):
═══════════════════════════════════════════════════════════════

  🎙️ "Let me think about what information I need at each node
      to determine if the tree is balanced..."
  🎙️ "I need the HEIGHT of each subtree. The question is:
      can I compute height and check balance simultaneously?"
  🎙️ "Let me start with a naive approach and then optimize..."

KHI CÓ IDEA NHƯNG CHƯA CHẮC:
═══════════════════════════════════════════════════════════════

  🎙️ "I'm thinking of using the return value to signal both
      the height AND whether the tree is balanced.
      If I return -1 for unbalanced..."
  🎙️ "This is a post-order problem because I need to know
      the children's heights before I can check the parent..."

KHI VIẾT CODE BỊ KẸT:
═══════════════════════════════════════════════════════════════

  🎙️ "Wait, do I check for -1 before or after computing
      both children? Let me think... I should check left
      BEFORE computing right — early termination!"
  🎙️ "Let me trace my code with a small example to make
      sure the -1 propagates correctly..."
```

---

### 📌 Nếu interviewer hỏi thêm — Full Script

**Q1: "Why not just compute height and check balance separately?"**

> 🎙️ *"That's the brute force approach — compute height with a separate function, then recurse to check balance. It works, but it's O(n²) because height() traverses every node below, and we call it at every node. The -1 trick combines both operations in one traversal — O(n)."*

**Q2: "Can you solve this iteratively?"**

> 🎙️ *"Yes, but it's more complex. I'd use a post-order iterative traversal with a stack, plus a hash map to store heights. For each node, after processing both children, I look up their heights, check the balance condition, and store the current node's height. It's O(n) time and O(n) space for the hash map."*

> 🎙️ *"Honestly, the recursive solution is much cleaner for this problem. I'd only go iterative if the tree is extremely deep and I'm worried about stack overflow."*

**Q3: "What's the difference between this and Maximum Depth (#104)?"**

> 🎙️ *"Maximum Depth is a simpler version — it ONLY computes height: return 1 + max(left, right). Balanced Tree ADDS a validation layer on top: at each node, check |left - right| ≤ 1, and use -1 as an early exit. Think of Balanced Tree as Maximum Depth + validation."*

**Q4: "Could the -1 trick cause issues with certain trees?"**

> 🎙️ *"No, because -1 can never be a valid height. Heights are always ≥ 0 (null = 0, leaf = 1, etc.), so -1 is a safe sentinel. If heights could be negative, we'd need a different approach — like returning a tuple {height, isBalanced}."*

**Q5: "How would you test this function?"**

> 🎙️ *"I'd cover these test categories:*
> *1. **Base cases**: null tree, single node*
> *2. **Balanced trees**: perfect binary tree, complete tree*
> *3. **Unbalanced trees**: skewed left, skewed right, deep imbalance*
> *4. **Tricky case**: root balanced but subtree unbalanced*
> *5. **Property test**: every balanced tree's left and right subtrees should also be balanced — recursive property!"*

---

### 🧠 Nguyên tắc Think Out Loud — Balanced Tree

```
TÓM TẮT:

  📌 Phút 0-2:  Clarify "every node, not just root" + edge cases
  📌 Phút 2-4:  Vẽ 2 ví dụ (balanced + tricky unbalanced)
  📌 Phút 4-7:  Nói BRUTE trước → nhận ra chậm → optimize bằng -1
  📌 Phút 7-10: Code + narrate: sentinel -1, early termination
  📌 Phút 10-12: Trace ví dụ unbalanced (thấy -1 propagate)
  📌 Phút 12-14: Complexity: O(n) vs O(n²) + tại sao optimal
  📌 Phút 14-15: Pattern recognition + alternative

  KEY POINTS cần nói:
  ✅ "Every node" — không chỉ root!
  ✅ Brute force O(n²) → optimize O(n)
  ✅ -1 sentinel = height + validation gộp 1 hàm
  ✅ Post-order vì cần kết quả con TRƯỚC
  ✅ Early termination: thấy -1 → dừng ngay!
```
