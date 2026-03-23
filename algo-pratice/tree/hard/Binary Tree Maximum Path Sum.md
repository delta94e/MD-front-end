# 🌳 Binary Tree Maximum Path Sum (LeetCode #124)

> 📖 Code: [Binary Tree Maximum Path Sum.js](./Binary%20Tree%20Maximum%20Path%20Sum.js)

---

## 🧠 Bản chất bài toán — Hiểu để NHỚ, không chỉ để GIẢI

> ⚡ **Đọc phần này TRƯỚC. Nếu bạn chỉ nhớ 1 thứ, nhớ phần này.**

### 1️⃣ Analogy — Ví dụ đời thường

```
🏢 CÔNG TY — Tìm NHÓM có doanh thu cao nhất!

  Mỗi node = 1 người trong công ty (có thể lời HOẶC lỗ!)
  Path = 1 ĐƯỜNG THẲNG nối các người liền kề
  
  CEO (-10 triệu — lỗ!)
   /         \
  PM (9tr)   CTO (20tr)
              / \
         Dev1(15tr) Dev2(7tr)

  Nhóm có tổng doanh thu cao nhất?
  → Dev1 + CTO + Dev2 = 15 + 20 + 7 = 42 triệu!
  → BỎ QUA CEO vì CEO lỗ (-10), kéo tổng xuống!

  Đó là TẤT CẢ bài này hỏi.
```

### 2️⃣ Cái khó — TẠI SAO bài này hard?

```
BÀI DỄ: "Tìm path sum TỪ ROOT đến leaf"
  → Chỉ đi 1 chiều: xuống
  → Dễ! DFS từ root đi xuống.

BÀI NÀY: "Tìm path sum BẤT KỲ"
  → Path có thể ĐI QUA 1 node (hình chữ V!)
  → Path KHÔNG CẦN qua root!
  → Path có thể chỉ là 1 NODE!
  → Có SỐ ÂM → phải quyết định BỎ QUA hay LẤY!

    15 → 20 → 7   = 42 ← đi qua 20, lấy CẢ 2 bên
    15             = 15 ← chỉ 1 node
    9→(-10)→20→15  = 34 ← đi qua root, nhưng root ÂM!
```

### 3️⃣ Key Insight — Mỗi node có 2 CÂU HỎI

```
💡 ĐÂY LÀ ĐIỀU QUAN TRỌNG NHẤT CỦA BÀI NÀY!

Tại MỖI node, hỏi 2 câu KHÁC NHAU:

╔══════════════════════════════════════════════════════════╗
║ CÂU 1: "Path TỐT NHẤT đi qua tôi = bao nhiêu?"       ║
║                                                          ║
║   → Lấy CẢ 2 nhánh: left + tôi + right                 ║
║   → Hình chữ V — path KẾT THÚC tại tôi                 ║
║   → Dùng để cập nhật ĐÁP ÁN (globalMax)                ║
║                                                          ║
║        left ← node → right                              ║
╠══════════════════════════════════════════════════════════╣
║ CÂU 2: "Tôi ĐÓNG GÓP cho parent bao nhiêu?"           ║
║                                                          ║
║   → Chỉ chọn 1 nhánh: tôi + max(left, right)           ║
║   → Đường THẲNG — path CÒN ĐI TIẾP lên parent         ║
║   → Dùng để RETURN cho parent                           ║
║                                                          ║
║        parent                                            ║
║          |                                               ║
║        node                                              ║
║        / \                                               ║
║     chọn 1 bên!                                          ║
╚══════════════════════════════════════════════════════════╝

Tại sao chỉ 1 nhánh cho parent?
→ Vì path phải là ĐƯỜNG THẲNG!
→ Nếu lấy cả 2 → RẼ NHÁNH tại node → không hợp lệ!
```

### 4️⃣ Recipe — Code chỉ có 7 dòng

```javascript
function maxPathSum(root) {
  let globalMax = -Infinity;           // CÂU 1: đáp án

  function dfs(node) {
    if (node === null) return 0;       // base case
    const left = Math.max(dfs(node.left), 0);   // nhánh âm → bỏ!
    const right = Math.max(dfs(node.right), 0);
    globalMax = Math.max(globalMax, left + node.val + right); // CÂU 1
    return node.val + Math.max(left, right);     // CÂU 2
  }

  dfs(root);
  return globalMax;                    // trả ĐÁP ÁN, KHÔNG trả dfs!
}
```

### 5️⃣ Visual — 2 câu hỏi tại node 20

```
        -10
        /  \
       9    20
            / \
          15    7

TẠI NODE 20:

  CÂU 1 (globalMax): lấy CẢ 2 bên
    15 + 20 + 7 = 42  → cập nhật globalMax = 42!
    Path: 15 ← 20 → 7 (hình chữ V, kết thúc tại 20)

  CÂU 2 (return): chọn 1 bên cho parent (-10)
    20 + max(15, 7) = 35  → return 35
    "Nếu -10 muốn dùng tôi, tôi mang theo 35"
    Vì path lên -10 phải THẲNG: -10 → 20 → 15 (không thể rẽ)
```

### 6️⃣ Trick — `Math.max(_, 0)` nghĩa gì?

```
Nếu nhánh con có tổng ÂM → BỎ (lấy 0 thay vì số âm!)

  node = 20, left = -5, right = 7

  Lấy left:  -5 + 20 + 7 = 22
  Bỏ left:    0 + 20 + 7 = 27  ← TỐT HƠN!

  Math.max(-5, 0) = 0 → "nhánh âm thì coi như KHÔNG CÓ"
```

### 7️⃣ Flashcard — Tự kiểm tra

| ❓ Câu hỏi | ✅ Đáp án |
|---|---|
| Path có cần qua root không? | **KHÔNG!** Bất kỳ đâu |
| Mỗi node hỏi mấy câu? | **2**: globalMax (2 nhánh) + return (1 nhánh) |
| Tại sao return chỉ 1 nhánh? | Path phải THẲNG, không rẽ nhánh |
| `Math.max(_, 0)` là gì? | Nhánh âm → bỏ, không lấy |
| Traversal loại gì? | **Post-order** (cần kết quả con trước!) |
| Base case? | `null → return 0` |
| Time? | **O(n)** — mỗi node visit 1 lần |
| Space? | **O(h)** — call stack |
| Tại sao `globalMax = -Infinity`? | Vì tất cả node có thể ÂM! |
| `return globalMax` hay `return dfs(root)`? | **globalMax!** dfs chỉ trả đóng góp |

### 8️⃣ Sai lầm phổ biến — ĐỪNG mắc!

```
❌ SAI LẦM #1: Quên Math.max(_, 0)

   const left = dfs(node.left);     // có thể ÂM!
   pathThru = left + node.val + right;  // bị kéo xuống!
   
   ✅ const left = Math.max(dfs(node.left), 0);  // âm → bỏ!

─────────────────────────────────────────────────────

❌ SAI LẦM #2: Return CẢ 2 nhánh cho parent

   return node.val + left + right;  // rẽ nhánh! SAI!
   
   ✅ return node.val + Math.max(left, right);  // chỉ 1 nhánh!

─────────────────────────────────────────────────────

❌ SAI LẦM #3: globalMax = 0 ban đầu

   let globalMax = 0;  // SAI nếu tất cả node âm! [-3,-2,-1]
   
   ✅ let globalMax = -Infinity;  // luôn đúng!

─────────────────────────────────────────────────────

❌ SAI LẦM #4: Return globalMax từ dfs

   function dfs(node) { ... return globalMax; }  // SAI!
   
   ✅ dfs return ĐÓNG GÓP cho parent
   ✅ maxPathSum return globalMax
```

### 9️⃣ Cách TƯ DUY — Framework 3 câu hỏi

```
❶ "Mỗi node cần làm gì?"
   → Tính path tốt nhất đi qua mình (2 nhánh) → cập nhật globalMax
   → Tính đóng góp cho parent (1 nhánh) → return

❷ "Khi nào DỪNG?"
   → node === null → return 0

❸ "Cần kết quả từ con không?"
   → CÓ! Cần sum nhánh trái + nhánh phải
   → POST-ORDER!
```

---

> 📚 **Phần dưới đây là GIẢI THÍCH CHI TIẾT + INTERVIEW SIMULATION.**

---

## R — Repeat & Clarify

💬 *"Tìm path có tổng lớn nhất trong binary tree. Path là chuỗi nodes NỐI LIỀN, KHÔNG cần qua root, có thể đi qua bất kỳ node nào."*

### Câu hỏi cần hỏi interviewer:

1. **"Path có cần bắt đầu từ root?"** → KHÔNG! Bất kỳ đâu.
2. **"Có số ÂM không?"** → CÓ! Node val từ -1000 đến 1000.
3. **"Path tối thiểu mấy node?"** → Ít nhất 1 node!
4. **"Path có thể rẽ nhánh?"** → KHÔNG! Phải là ĐƯỜNG THẲNG (sequence).

---

## E — Examples

```
VÍ DỤ 1 — Simple:
      1
     / \
    2   3       Path: 2→1→3 = 6 ✅

VÍ DỤ 2 — Có số âm:
       -15
       /  \
     10    20
           / \
         15    5
         /
       -5

    Path: 15→20→5 = 40 ✅ (bỏ -15, bỏ -5!)

VÍ DỤ 3 — Single: [5] → 5
VÍ DỤ 4 — All negative: [-3,-2,-1] → -1 (pick LEAST negative!)
VÍ DỤ 5 — Skip child: [2, -1] → 2 (bỏ -1 vì kéo tổng xuống!)
```

---

## A — Approach

```
POST-ORDER — cần kết quả con TRƯỚC!

Tại mỗi node:
  1. Lấy đóng góp từ con trái (max 0 — bỏ nếu âm)
  2. Lấy đóng góp từ con phải (max 0)
  3. Cập nhật globalMax = left + node + right (2 nhánh)
  4. Return node + max(left, right) cho parent (1 nhánh)

Time: O(n) — mỗi node 1 lần
Space: O(h) — call stack, h = height
```

---

## C — Code

> 📖 Full code: [Binary Tree Maximum Path Sum.js](./Binary%20Tree%20Maximum%20Path%20Sum.js)

```javascript
function maxPathSum(root) {
  let globalMax = -Infinity;

  function dfs(node) {
    if (node === null) return 0;

    const left = Math.max(dfs(node.left), 0);   // âm → bỏ
    const right = Math.max(dfs(node.right), 0);

    // CÂU 1: path đẹp nhất QUA node (2 nhánh → globalMax)
    globalMax = Math.max(globalMax, left + node.val + right);

    // CÂU 2: đóng góp cho parent (1 nhánh → return)
    return node.val + Math.max(left, right);
  }

  dfs(root);
  return globalMax;
}
```

### Trace ví dụ 2:

```
       -15
       /  \
     10    20
           / \
         15    5
         /
       -5

dfs(-5):
  left=0, right=0
  pathThru = 0+(-5)+0 = -5  → globalMax = -5
  return -5+0 = -5

dfs(15):
  left = max(-5, 0) = 0     ← -5 ÂM → BỎ!
  right = 0
  pathThru = 0+15+0 = 15    → globalMax = 15
  return 15+0 = 15

dfs(5):
  left=0, right=0
  pathThru = 0+5+0 = 5      → globalMax = 15 (5<15)
  return 5

dfs(20):
  left = max(15, 0) = 15
  right = max(5, 0) = 5
  pathThru = 15+20+5 = 40   → globalMax = 40! ✅
  return 20+max(15,5) = 35

dfs(10):
  left=0, right=0
  pathThru = 0+10+0 = 10    → globalMax = 40
  return 10

dfs(-15):
  left = max(10, 0) = 10
  right = max(35, 0) = 35
  pathThru = 10+(-15)+35 = 30 → globalMax = 40 (30<40)
  return -15+max(10,35) = 20

Answer: globalMax = 40 ✅ (path 15→20→5)
```

---

## T — Test

```
[1, 2, 3]                      → 6   (2→1→3)
[-15,10,20,null,null,15,5,-5]   → 40  (15→20→5)
[1]                             → 1   (single node)
[-3]                            → -3  (single negative)
[2, -1]                         → 2   (skip negative child)
[-1, -2, -3]                    → -1  (least negative!)
```

---

## O — Optimize

```
┌──────────────┬──────────────┬──────────────┐
│              │ Time         │ Space        │
├──────────────┼──────────────┼──────────────┤
│ Recursive    │ O(n) ✅      │ O(h)         │
│ (dfs+global) │ optimal!     │ call stack   │
├──────────────┼──────────────┼──────────────┤
│ Balanced h   │ O(n)         │ O(log n) ✅  │
│ Skewed h     │ O(n)         │ O(n)         │
└──────────────┴──────────────┴──────────────┘

Time O(n) is OPTIMAL — phải visit mọi node vì max path
có thể ở bất kỳ đâu.
```

---

## 🗣️ Think Out Loud — Kịch Bản Interview Chi Tiết

> Format: 🎙️ = **NÓI TO** | 🧠 = **SUY NGHĨ THẦM**

---

### 📌 Phút 0–1: Nhận đề + Clarify

🧠 *"Max path sum — HARD problem. Path có thể rẽ qua 1 node. Phải hỏi kỹ!"*

> 🎙️ *"OK, so I need to find the maximum path sum in a binary tree. Let me clarify a few things:*
>
> *— The path doesn't need to go through the root, correct?*
> *(Interviewer: "Correct.")*
>
> *— Can node values be negative?*
> *(Interviewer: "Yes, between -1000 and 1000.")*
>
> *— A path is a sequence of connected nodes, and it can't revisit a node — so it's essentially a simple path in the tree?"*
> *(Interviewer: "Yes.")*
>
> *— And the path must contain at least one node?"*
> *(Interviewer: "Correct.")*

🧠 *"Negative values = phải handle case 'bỏ nhánh'. At least 1 node = all-negative tree, answer là số âm lớn nhất."*

💡 **Tại sao hỏi "at least 1 node":**
- Nếu allowed empty path → answer ≥ 0 (empty path = sum 0)
- Phải ≥ 1 node → all-negative tree, answer VẪN ÂM!
- Ảnh hưởng: `globalMax = -Infinity` thay vì `globalMax = 0`

---

### 📌 Phút 1–3: Vẽ ví dụ + DERIVE insight

> 🎙️ *"Let me draw an example and think about what makes this problem tricky."*
>
> ```
>        -10
>        /  \
>       9    20
>            / \
>          15    7
> ```
>
> *"The maximum path sum is 42: path 15→20→7. This path does NOT go through the root because -10 would reduce the sum."*

> 🎙️ *"What makes this hard is that the path can 'bend' through a node — taking both left and right children. So at node 20, the path goes left to 15 AND right to 7."*

🧠 *"Giờ DERIVE insight. Tại mỗi node, ĐỨNG tại đó, tôi biết gì?"*

> 🎙️ *"Let me think about this from each node's perspective. At any node, I can form a path in several ways:*
>
> *1. Just this node alone*
> *2. This node + best path going left*
> *3. This node + best path going right*
> *4. Best left path + this node + best right path (bending through this node!)*
>
> *Option 4 is the key — the path ENDS at this node by taking both sides.*
>
> *But if a parent wants to USE this node, it can only extend in ONE direction — we can't send a V-shaped path upward."*

> 🎙️ *"So I see TWO things I need at each node:*
>
> *First, the best path THROUGH this node (for updating the global answer) — this can take both children.*
>
> *Second, the best path FROM this node going ONE direction (for the parent to extend) — this can only take the better child."*

🧠 *"Đây là KEY INSIGHT. 2 concepts khác nhau. Phải tách riêng."*

---

### 📌 Phút 3–5: Code + Narrate

> 🎙️ *"This is a post-order traversal — I need results from both subtrees before processing the current node."*

```javascript
function maxPathSum(root) {
  let globalMax = -Infinity;
```

> 🎙️ *"I initialize globalMax to negative infinity, not zero, because all values could be negative."*

```javascript
  function dfs(node) {
    if (node === null) return 0;
```

> 🎙️ *"Base case: null node contributes 0 to any path."*

```javascript
    const left = Math.max(dfs(node.left), 0);
    const right = Math.max(dfs(node.right), 0);
```

> 🎙️ *"I get the best contribution from each child. Crucially, I take max with 0 — if a subtree's contribution is negative, I'm better off not including it at all."*

```javascript
    globalMax = Math.max(globalMax, left + node.val + right);
```

> 🎙️ *"This is the first question: what's the best path THROUGH this node? I take both sides and update globalMax. This path ends here — it won't go up to the parent."*

```javascript
    return node.val + Math.max(left, right);
  }
```

> 🎙️ *"This is the second question: if the parent wants to use me, how much do I contribute? I can only offer ONE direction — whichever child gives more — because the path must stay linear to extend upward."*

```javascript
  dfs(root);
  return globalMax;
}
```

> 🎙️ *"The final answer is globalMax, NOT the return value of dfs. The dfs return is only used internally for parent calculations."*

---

### 📌 Phút 5–7: Complexity

> 🎙️ *"**Time: O(n)** — each node is visited exactly once, doing O(1) work."*
>
> *"**Space: O(h)** — recursion call stack. O(log n) balanced, O(n) skewed."*
>
> *"O(n) time is optimal — the maximum path could be anywhere, so we must examine every node."*

---

### 📌 Khi interviewer hỏi thêm

**Q1: "Can you solve this without a global variable?"**

> 🎙️ *"Yes! I can return a tuple [globalMax, contribution] from each call:"*
> ```javascript
> function dfs(node) {
>   if (!node) return [-Infinity, 0];
>   const [leftMax, leftC] = dfs(node.left);
>   const [rightMax, rightC] = dfs(node.right);
>   const left = Math.max(leftC, 0);
>   const right = Math.max(rightC, 0);
>   const pathThru = left + node.val + right;
>   return [Math.max(leftMax, rightMax, pathThru),
>           node.val + Math.max(left, right)];
> }
> ```

**Q2: "What if I want the actual path, not just the sum?"**

> 🎙️ *"I'd store the nodes in the path when updating globalMax. At each node, I'd track the path that contributed to the best sum, and when I update globalMax, I'd save that path."*

**Q3: "How is this related to the Diameter problem (#543)?"**

> 🎙️ *"Same structure! Diameter also uses post-order with globalMax + return:*
> - *Diameter: globalMax = leftHeight + rightHeight (edges)*
> - *Max Path Sum: globalMax = leftSum + node.val + rightSum*
>
> *Both need 'best through this node' (global) vs 'best from this node going one way' (return)."*

---

### 📌 Pattern Recognition

```
"globalMax + return KHÁC NHAU" PATTERN:
═══════════════════════════════════════════════════════════════

  Khi bài yêu cầu path KHÔNG CẦN đi qua root:

  ┌──────────────────────────┬────────────────────────────────┐
  │ Problem                  │ globalMax vs return            │
  ├──────────────────────────┼────────────────────────────────┤
  │ #124 Max Path Sum        │ L+node+R vs node+max(L,R)     │
  │ #543 Diameter            │ L+R vs max(L,R)               │
  │ #687 Longest Univalue    │ L+R vs max(L,R) (same val!)   │
  └──────────────────────────┴────────────────────────────────┘

  TEMPLATE:
  function solve(root) {
    let globalMax = INIT;
    function dfs(node) {
      if (!node) return 0;
      const left = dfs(node.left);
      const right = dfs(node.right);
      globalMax = Math.max(globalMax, f(left, node, right)); // 2 nhánh
      return g(node, left, right);                           // 1 nhánh
    }
    dfs(root);
    return globalMax;
  }
```

---

### 🧠 Nguyên tắc Think Out Loud

```
BÀI NÀY CẦN NÓI RÕ:
═══════════════════════════════════════════════════════════════

  ✅ "Path can BEND through a node — taking both children"
     → Show bạn hiểu cái gì khó

  ✅ "I need TWO things: global answer vs parent contribution"
     → Show bạn thấy KEY INSIGHT

  ✅ "max(_, 0) to skip negative subtrees"
     → Show bạn handle edge case

  ✅ "globalMax = -Infinity because all values could be negative"
     → Show bạn nghĩ all-negative case

  ✅ "Return value ≠ answer — globalMax is the answer"
     → Show bạn hiểu SÂU mechanism
```
