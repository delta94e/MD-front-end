# 🎯 Closest Binary Search Tree Value — LeetCode #270 (Easy)

> 📖 Code: [Closest Binary Search Tree Value.js](./Closest%20Binary%20Search%20Tree%20Value.js)

---

## R — Repeat & Clarify

🧠 *"BST + target → Binary Search! O(h) không O(n). Giống tìm kiếm nhị phân trên cây."*

> 🎙️ *"Given a BST and a target float value, find the node value closest to target."*

> 🎙️ *"Let me clarify:*
>
> *1. **What's the BST property?** — For every node: left < node < right. This means I can binary search!*
>
> *2. **Target is float?** — Yes, target = 3.7 can be BETWEEN two node values. No node might match exactly.*
>
> *3. **Can there be ties?** — If two nodes are equally close, return the smaller one.*
>
> *4. **Can the tree be empty?** — No, guaranteed at least 1 node.*
>
> *5. **Return the VALUE, not the node?** — Yes, return integer value."*

💡 **Tại sao bài này quan trọng?**
```
Bài này teach BST SEARCH PATTERN — nền tảng cho:
→ #700 Search in BST (tìm exact value)
→ #701 Insert into BST (tìm vị trí insert)
→ #285 Inorder Successor (tìm next value)
→ #272 Closest K Values (mở rộng thành K)
→ Binary Search nói chung! BST ≈ Binary Search on sorted data

Pattern: while (node) → kiểm tra → đi trái hoặc phải
```

---

## E — Examples

> 🎙️ *"Let me trace through examples to build intuition:"*

```
VÍ DỤ 1 — TARGET GIỮA HAI NODES:
     4
    / \
   2   5       target = 3.7
  / \
 1   3

  node=4: |4 - 3.7| = 0.3 → closest=4 (first node!)
  3.7 < 4 → go LEFT (các node bên phải đều > 4 → xa hơn!)
  
  node=2: |2 - 3.7| = 1.7 → 1.7 > 0.3 → KHÔNG cập nhật
  3.7 > 2 → go RIGHT (target lớn hơn 2)
  
  node=3: |3 - 3.7| = 0.7 → 0.7 > 0.3 → KHÔNG cập nhật
  3.7 > 3 → go RIGHT → null → STOP!
  
  Answer: 4 (distance 0.3) ✅
  
  ⚠️ SURPRISE! node 4 (đầu tiên thăm) lại là closest!
  Không phải lúc nào closest cũng ở CUỐI path!

VÍ DỤ 2 — TARGET TRÙNG EXACT:
     4
    / \
   2   5       target = 2.0
  / \
 1   3

  node=4: |4-2| = 2 → closest=4
  2 < 4 → go LEFT
  node=2: |2-2| = 0 → closest=2 (EXACT MATCH!)
  2 ≥ 2 → go RIGHT
  node=3: |3-2| = 1 → no update
  3 > 2... → go RIGHT → null → STOP!
  
  Answer: 2 ✅ (distance = 0, exact!)
  
  ⚠️ Khi exact match, KHÔNG cần continue! Nhưng code VẪN chạy.
  Optimization: if (distance === 0) return node.val; → early exit!

VÍ DỤ 3 — TARGET NHỎ HƠN MỌI NODE:
     4
    / \
   2   5       target = 0.5
  / \
 1   3

  node=4: |4-0.5| = 3.5 → closest=4
  0.5 < 4 → LEFT
  node=2: |2-0.5| = 1.5 → closest=2 (gần hơn!)
  0.5 < 2 → LEFT
  node=1: |1-0.5| = 0.5 → closest=1 (gần hơn nữa!)
  0.5 < 1 → LEFT → null → STOP!
  
  Answer: 1 ✅ (target < min → closest = min node)

VÍ DỤ 4 — TARGET LỚN HƠN MỌI NODE:
     4
    / \
   2   5       target = 100
  / \
 1   3

  node=4: closest=4
  100 > 4 → RIGHT
  node=5: |5-100| = 95 < |4-100| = 96 → closest=5
  100 > 5 → RIGHT → null → STOP!
  
  Answer: 5 ✅ (target > max → closest = max node)

VÍ DỤ 5 — SINGLE NODE:
  [1]  target = 999
  → closest = 1 (only option!)

VÍ DỤ 6 — SKEWED TREE:
  1
   \
    2       target = 2.8
     \
      3
       \
        4
  
  node=1: closest=1, target>1 → RIGHT
  node=2: closest=2... wait, |2-2.8|=0.8 < |1-2.8|=1.8 → closest=2
  target>2 → RIGHT
  node=3: |3-2.8|=0.2 < 0.8 → closest=3
  target<3 → LEFT → null → STOP!
  
  Answer: 3 ✅
  ⚠️ Skewed: O(n) vì h = n!
```

🧠 *"Observation: closest LUÔN CẬP NHẬT khi đi ĐÚNG HƯỚNG về target. Nhưng node gần nhất có thể ở BẤT KỲ ĐÂU trên path!"*

---

## CHIA NHỎ BÀI TOÁN — Tại sao Binary Search trên BST?

### BST ≈ Sorted Array

```
BST:          Sorted Array:
     4         [1, 2, 3, 4, 5]
    / \              ↑
   2   5        Binary Search tìm vị trí gần nhất
  / \
 1   3

Inorder BST: [1, 2, 3, 4, 5] = sorted!
→ Tìm closest trong sorted array = Binary Search!
→ Tìm closest trong BST = BST search (same idea!)

BST SEARCH = BINARY SEARCH cùng ý tưởng:
  Sorted Array: left, right pointers → mid = (left+right)/2
  BST:          node → go left or go right (node LÀ mid!)
```

### Tại sao Skip nguyên nhánh?

```
═══════════════════════════════════════════════════════════════
    TẠI SAO O(h) KHÔNG O(n) — PROOF BY BST PROPERTY
═══════════════════════════════════════════════════════════════

  Target = 3.7, node = 4

  BST property: MỌI node bên PHẢI > 4
  → 5, 6, 7, 8, ... đều > 4
  → Khoảng cách đến target:
    |4-3.7| = 0.3
    |5-3.7| = 1.3 > 0.3
    |6-3.7| = 2.3 > 0.3
    ...
  → TẤT CẢ bên phải XA HƠN 4! → SKIP TOÀN BỘ!

  ┌─────────────────────────────────────────────────────────┐
  │                                                         │
  │   target = 3.7    node = 4                              │
  │                   ↓                                     │
  │   ... 1   2   3 │ 4 │ 5   6   7 ...                    │
  │   ← closer ←    │   │ → farther →                      │
  │   go LEFT!       │   │ skip RIGHT!                      │
  │                                                         │
  │   Nếu target < node: tất cả bên phải ≥ node > target   │
  │   → khoảng cách bên phải ≥ |node - target|             │
  │   → node HOẶC bên trái = gần hơn → go LEFT!            │
  │                                                         │
  └─────────────────────────────────────────────────────────┘

  The exact reasoning:
  
  For any node R in right subtree: R ≥ node.val
  Distance: |R - target| = R - target  (since R > target)
                         ≥ node.val - target
                         = |node.val - target|
  
  → Mọi node bên phải CÓ khoảng cách ≥ node hiện tại
  → KHÔNG BAO GIỜ gần hơn node hiện tại!
  → SAFE to skip! ✅

  Ngược lại:
  target > node → tất cả bên trái ≤ node < target → skip LEFT!
```

### So sánh với Brute Force

```
═══════════════════════════════════════════════════════════════

BRUTE FORCE: Traverse TẤT CẢ nodes, tìm min distance
  → O(n) time, O(h) space (recursion)
  → Không tận dụng BST property!

BST SEARCH: Đi 1 đường root → node → null
  → O(h) time, O(1) space (iterative!)
  → Balanced: O(log n) — MUCH BETTER!
  → Skewed: O(n) — same as brute force (worst case)

Brute force code:
  function closestBrute(root, target) {
    let closest = root.val;
    function dfs(node) {
      if (!node) return;
      if (Math.abs(node.val - target) < Math.abs(closest - target))
        closest = node.val;
      dfs(node.left);
      dfs(node.right);
    }
    dfs(root);
    return closest;
  }
  → Thăm TẤT CẢ nodes! O(n)

BST search: skip nửa cây mỗi bước → O(h)!
```

---

## A — Approach

> 🎙️ *"I'll do a BST binary search — at each node:*
>
> *Step 1: Is this node CLOSER than my current best? If yes, update.*
> *Step 2: Navigate. target < node? Go left (closer values are smaller). target > node? Go right (closer values are larger).*
> *Step 3: Reach null? My best is the answer."*

```
ALGORITHM VISUAL:

  Target = 3.7
       
       4 ← |4-3.7|=0.3 closest=4 ✅
      ↙ (3.7 < 4 → LEFT)
     2 ← |2-3.7|=1.7 > 0.3 → no update
      ↘ (3.7 > 2 → RIGHT)
       3 ← |3-3.7|=0.7 > 0.3 → no update
        ↘ (3.7 > 3 → RIGHT)
         null → STOP! Return closest = 4 ✅
         
  Path: 4 → 2 → 3 → null (chỉ 3 nodes, không phải toàn bộ 5!)
```

---

## C — Code

> 📖 Full code: [Closest Binary Search Tree Value.js](./Closest%20Binary%20Search%20Tree%20Value.js)

### Approach 1: Iterative — RECOMMENDED

```javascript
function closestValue(root, target) {
  let closest = root.val;   // initialize với root
  let node = root;
  
  while (node) {
    // Step 1: Update closest nếu node gần hơn
    if (Math.abs(node.val - target) < Math.abs(closest - target)) {
      closest = node.val;
    }
    
    // Step 2: BST navigation
    node = target < node.val ? node.left : node.right;
  }
  
  return closest;
}
```

> 🎙️ *"Let me explain EVERY design decision:"*

```
DECISION 1: Tại sao `closest = root.val` không phải `Infinity`?

  ✅ closest = root.val:
  → Luôn có ít nhất 1 node (guarantee!)
  → closest bắt đầu = 1 giá trị THỰC TẾ trong cây
  
  ✅ closest = Infinity cũng OK:
  → |Infinity - target| = Infinity → node đầu tiên sẽ win
  → Nhưng dùng root.val rõ ràng hơn

DECISION 2: Tại sao `<` không `<=` trong comparison?

  if (Math.abs(node.val - target) < Math.abs(closest - target))
                                   ↑
  `<` : chỉ update khi STRICTLY closer
  → Nếu tie (bằng distance): GIỮ GIÁ TRỊ CŨ (first encountered)
  
  `<=`: update cả khi tie
  → Nếu tie: LẤY GIÁ TRỊ MỚI (last encountered)
  
  ⚠️ Nếu bài yêu cầu "return SMALLER value khi tie":
  → Dùng `<` VÀ handle tie riêng:
  if (dist < closestDist || (dist === closestDist && node.val < closest))

DECISION 3: Tại sao `target < node.val ? left : right`?

  → target < node.val: target NẰM BÊN TRÁI node
    → MỌI node bên phải ≥ node.val → xa hơn → skip!
    → go LEFT để tìm gần hơn
    
  → target ≥ node.val: target NẰM BÊN PHẢI node
    → MỌI node bên trái ≤ node.val → xa hơn → skip!
    → go RIGHT để tìm gần hơn
    
  → target === node.val: EXACT MATCH!
    → dist = 0, closest = node.val
    → go RIGHT (vì ≥), nhưng sẽ không tìm thấy gì gần hơn 0!
    → Could early return: if (node.val === target) return target;

DECISION 4: Tại sao WHILE không RECURSION?

  ITERATIVE (while):     RECURSIVE:
  → O(1) space ✅         → O(h) stack space
  → Simpler code          → More "elegant"
  → NO stack overflow     → Could overflow for skewed tree
  
  → ITERATIVE WINS for this problem!
```

### Approach 2: Recursive

```javascript
function closestValue(root, target) {
  let closest = root.val;
  
  function dfs(node) {
    if (!node) return;
    if (Math.abs(node.val - target) < Math.abs(closest - target)) {
      closest = node.val;
    }
    // Only recurse into ONE child (BST navigation!)
    if (target < node.val) {
      dfs(node.left);
    } else {
      dfs(node.right);
    }
  }
  
  dfs(root);
  return closest;
}
```

> 🎙️ *"Recursive version: same logic, but uses O(h) stack space. Note: I only recurse into ONE child — this is BST search, not full tree traversal!"*

### Approach 3: With Early Exit

```javascript
function closestValue(root, target) {
  let closest = root.val;
  let node = root;
  
  while (node) {
    // Early exit: exact match!
    if (node.val === target) return target;
    
    if (Math.abs(node.val - target) < Math.abs(closest - target)) {
      closest = node.val;
    }
    node = target < node.val ? node.left : node.right;
  }
  
  return closest;
}
```

> 🎙️ *"Early exit optimization: if I find an exact match, distance = 0, nothing can be closer. Return immediately."*

---

### Trace Chi Tiết — Step by Step

```
BST:     4
        / \
       2   5       target = 3.714
      / \
     1   3

═══════════════════════════════════════════════════════════════
STEP 1: node = 4
═══════════════════════════════════════════════════════════════

  closest = 4 (initialized)
  
  Distance: |4 - 3.714| = 0.286
  |0.286| < |4 - 3.714| = 0.286 → NOT strictly less, no update
  (But closest already IS 4, so no change needed!)
  
  Navigate: 3.714 < 4 → go LEFT
  
  ★ Reasoning: "Target is LESS than 4. All nodes RIGHT of 4
     are ≥ 5. |5-3.714|=1.286 > 0.286. So right is GUARANTEED
     farther. Go left!"

═══════════════════════════════════════════════════════════════
STEP 2: node = 2
═══════════════════════════════════════════════════════════════

  Distance: |2 - 3.714| = 1.714
  1.714 > 0.286 → NO UPDATE (4 is still closer!)
  closest = 4
  
  Navigate: 3.714 > 2 → go RIGHT
  
  ★ Reasoning: "Target is GREATER than 2. All nodes LEFT of 2
     are ≤ 1. |1-3.714|=2.714 > 1.714. Left is farther. Go right!"

═══════════════════════════════════════════════════════════════
STEP 3: node = 3
═══════════════════════════════════════════════════════════════

  Distance: |3 - 3.714| = 0.714
  0.714 > 0.286 → NO UPDATE (4 is STILL closer!)
  closest = 4
  
  Navigate: 3.714 > 3 → go RIGHT → null!
  
  ★ Reasoning: "Target > 3. If 3 had a right child (say 3.5),
     |3.5-3.714|=0.214 < 0.286 → would be closer! But no right
     child → null → STOP."

═══════════════════════════════════════════════════════════════
STEP 4: node = null → STOP!
═══════════════════════════════════════════════════════════════

  return closest = 4 ✅ (distance = 0.286)
  
  Total nodes visited: 3 out of 5 → O(h) not O(n)!
  Skipped: node 1 (left of 2) and node 5 (right of 4)
```

```
SECOND TRACE — target NẰNG GIỮA, CLOSEST UPDATE NHIỀU LẦN:

BST:     4(2(1,3), 5), target = 2.5

═══════════════════════════════════════════════════════════════

  node=4: |4-2.5|=1.5 → closest=4.          2.5<4 → LEFT
  node=2: |2-2.5|=0.5 → 0.5<1.5 → UPDATE! closest=2.  2.5>2 → RIGHT
  node=3: |3-2.5|=0.5 → 0.5=0.5 → TIE! < is false → NO UPDATE.
           closest vẫn = 2 (giữ first encountered khi tie!)
  3.714... no, 2.5<3 → LEFT → null → STOP!
  
  Answer: 2 ✅ (when tie, keeps first = smaller value 2 over 3!)

═══════════════════════════════════════════════════════════════

  Nếu dùng `<=` thay `<`:
  node=3: 0.5 ≤ 0.5 → UPDATE! closest=3.
  Answer: 3 (last encountered wins!)
  
  → `<` vs `<=` determines TIE-BREAKING behavior!
```

---

## ❌ Common Mistakes

### Mistake 1: Traverse TOÀN BỘ cây (O(n) thay vì O(h))

```javascript
// ❌ SAI — Visit ALL nodes (wastes BST property!)
function dfs(node) {
  if (!node) return;
  if (Math.abs(node.val - target) < Math.abs(closest - target))
    closest = node.val;
  dfs(node.left);    // ← đi CẢ LEFT
  dfs(node.right);   // ← VÀ RIGHT = O(n)!
}

// ✅ ĐÚNG — Only visit ONE child per level
node = target < node.val ? node.left : node.right;  // CHỈ 1 hướng!
```

### Mistake 2: Quên update closest TRƯỚC navigate

```javascript
// ❌ SAI — Navigate trước, quên check node hiện tại!
while (node) {
  node = target < node.val ? node.left : node.right; // navigate
  if (node && Math.abs(node.val - target) < ...) closest = node.val;
  // SKIP node đầu tiên (root)!
}

// ✅ ĐÚNG — Check TRƯỚC, navigate SAU
while (node) {
  if (Math.abs(node.val - target) < ...) closest = node.val; // check!
  node = target < node.val ? node.left : node.right; // then navigate
}
```

### Mistake 3: Dùng node.val thay vì Math.abs

```javascript
// ❌ SAI — Quên absolute value!
if (node.val - target < closest - target) ...
// Nếu node.val < target: diff ÂM → luôn "nhỏ hơn"!

// ✅ ĐÚNG — LUÔN dùng Math.abs!
if (Math.abs(node.val - target) < Math.abs(closest - target)) ...
```

### Mistake 4: Return node thay vì node.val

```javascript
// ❌ SAI
return closest;  // nếu closest = NODE object → sai type!

// ✅ ĐÚNG
closest = node.val;  // store VALUE, not node!
return closest;      // return VALUE!
```

---

## T — Test

> 🎙️ *"Let me check edge cases:"*

| # | Test | Target | BST | Expected | Tại sao? |
|---|---|---|---|---|---|
| 1 | Between nodes | 3.7 | `[4,2,5,1,3]` | 4 | |4-3.7|=0.3 smallest |
| 2 | Exact match | 2 | `[4,2,5,1,3]` | 2 | Distance = 0! |
| 3 | Below min | 0.5 | `[4,2,5,1,3]` | 1 | Closest to bottom |
| 4 | Above max | 100 | `[4,2,5,1,3]` | 5 | Closest to top |
| 5 | Single node | 999 | `[1]` | 1 | Only option |
| 6 | Tie | 2.5 | `[4,2,5,1,3]` | 2 | Tie: 2 and 3.  < keeps first |
| 7 | Negative | -1 | `[4,2,5,1,3]` | 1 |Distance 2 |
| 8 | Exact float | 3.0 | `[4,2,5,1,3]` | 3 | |3-3|=0 |
| 9 | Skewed | 2.8 | `[1,n,2,n,3,n,4]` | 3 | O(n) path |

---

## O — Optimize

```
═══════════════════════════════════════════════════════════════
                COMPLEXITY ANALYSIS
═══════════════════════════════════════════════════════════════

┌──────────────┬──────────────────────────────────────────┐
│ Time         │ O(h) — follow 1 root→leaf path          │
│              │ Balanced: O(log n) ✅                     │
│              │ Skewed: O(n)                              │
├──────────────┼──────────────────────────────────────────┤
│ Space        │ O(1) — iterative, no recursion! ✅        │
│              │ Recursive: O(h) stack frames             │
├──────────────┼──────────────────────────────────────────┤
│ Brute force  │ O(n) time — traverse ALL nodes           │
│              │ Không tận dụng BST property               │
├──────────────┼──────────────────────────────────────────┤
│ Optimal?     │ YES ✅ — must visit O(h) to reach answer  │
│              │ Can't skip levels without missing answer  │
└──────────────┴──────────────────────────────────────────┘

TẠI SAO O(h) LÀ OPTIMAL?

  Closest value có thể ở BẤT KỲ ĐÂU trên path root→leaf.
  → PHẢI đi từ root xuống tới null để chắc chắn.
  → Mỗi bước skip 1 nửa cây → O(h) tổng.
  → Không thể làm tốt hơn O(h)!
```

---

## 🗣️ Think Out Loud — Interview Script Chi Tiết

### 📌 Phút 0–1: Nhận đề + Clarify

> 🎙️ *"Find the node in a BST closest to a target value. Since it's a BST, I can exploit the sorted property to do this in O(h) instead of O(n)."*

> 🎙️ *"A few clarifications: is it guaranteed non-empty? Can target be a float between node values? What if two values are equally close — return the smaller one?"*

### 📌 Phút 1–2: Intuition

> 🎙️ *"In a BST, inorder traversal gives sorted values. Finding the closest value in a sorted list is binary search — I narrow down to the region around the target.  On a BST, I do the same thing by navigating left or right based on the BST property. At each node, I check if it's closer than my current best, then move toward the target."*

### 📌 Phút 2–4: Code

> 🎙️ *"I'll use an iterative approach for O(1) space. Initialize closest with root.val. While node exists: update closest if this node is closer, then navigate left or right based on target comparison."*
>
> *(Writes code, explaining each line)*

### 📌 Phút 4–5: Trace

> 🎙️ *"For BST [4,2,5,1,3] and target 3.7: node 4, distance 0.3, closest=4, go left. Node 2, distance 1.7, no update, go right. Node 3, distance 0.7, no update, go right, null, stop. Answer: 4."*

### 📌 Phút 5–6: Complexity

> 🎙️ *"Time: O(h) — I visit at most h+1 nodes along one root-to-leaf path. For a balanced BST, h = log n.  Space: O(1) since I use iterative approach with just two variables."*

---

### Follow-up Questions

**Q1: "What if there are two equally close values?"**

> 🎙️ *"My code uses strict `<`, so the first encountered value wins in a tie. Since BST search goes from root to leaf, which value is 'first' depends on tree structure. To guarantee the SMALLER value: add a tie-breaker:*
> ```javascript
> if (dist < closestDist || (dist === closestDist && node.val < closest))
> ```
> *Or simply change `<` to `<=` to prefer the LATER encountered value."*

**Q2: "What about K closest values?" (LeetCode #272)**

> 🎙️ *"Three approaches:*
>
> ***O(n + k·log k)**: Inorder → sorted array → two pointers from the insertion point → collect K closest.*
>
> ***O(n)**: Inorder → sliding window of size K → minimize total distance.*
>
> ***O(h + k)**: Two stacks — one for predecessors (going smaller), one for successors (going larger). Pop from whichever stack has the closer value. This is optimal!"*

**Q3: "Can you solve this recursively?"**

> 🎙️ *"Yes:*
> ```javascript
> function closestValue(root, target) {
>   if (!root) return Infinity;
>   const child = target < root.val 
>     ? closestValue(root.left, target)
>     : closestValue(root.right, target);
>   return Math.abs(root.val - target) <= Math.abs(child - target)
>     ? root.val : child;
> }
> ```
> *Each call returns the closest value in its subtree. Parent compares itself with child's answer. O(h) time, O(h) space."*

**Q4: "What if the tree is NOT a BST?"**

> 🎙️ *"Without the BST property, I can't skip subtrees. I'd need to traverse ALL nodes — brute force O(n) DFS."*

---

### 🔀 TREE DFS vs GRAPH DFS — BST Search Pattern

```
═══════════════════════════════════════════════════════════════
  BST SEARCH PATTERN — Cùng 1 skeleton, khác "what to track"
═══════════════════════════════════════════════════════════════

  while (node) {
    // DO SOMETHING at this node (problem-specific!)
    node = CONDITION ? node.left : node.right;
  }

  ┌──────────────────────┬──────────────────────────────────┐
  │ Problem              │ "DO SOMETHING"                   │
  ├──────────────────────┼──────────────────────────────────┤
  │ #270 Closest Value   │ Update closest if |val-t| < best │
  │ #700 Search BST      │ Return node if val === target    │
  │ #701 Insert BST      │ When null → create new node      │
  │ #285 Successor       │ Update candidate when going LEFT │
  │ #450 Delete BST      │ Find node, then restructure      │
  └──────────────────────┴──────────────────────────────────┘
  
  All: O(h) time! Follow ONE root→leaf path!

═══════════════════════════════════════════════════════════════
  SO SÁNH BST SEARCH vs BINARY SEARCH ON ARRAY
═══════════════════════════════════════════════════════════════

  Binary Search (Array):
    while (left <= right) {
      mid = (left + right) / 2;
      if (target < arr[mid]) right = mid - 1;
      else left = mid + 1;
    }
    
  BST Search:
    while (node) {
      if (target < node.val) node = node.left;
      else node = node.right;
    }
    
  → SAME STRUCTURE! node = mid, left = node.left, right = node.right
  → BST IS a binary search tree BECAUSE it enables binary search!
```

---

## 📊 VISUAL SUMMARY — Cheat Sheet

```
═══════════════════════════════════════════════════════════════
    CLOSEST BST VALUE #270 — CHEAT SHEET
═══════════════════════════════════════════════════════════════

📌 BÀI TOÁN: Tìm node GẦN NHẤT target trong BST
📌 PATTERN:  BST binary search + track closest
📌 TRICK:    Skip nửa cây mỗi bước → O(h) not O(n)!

═══════════════════════════════════════════════════════════════

📌 ALGORITHM:
  closest = root.val
  while (node):
    1. UPDATE closest if |node.val - target| < |closest - target|
    2. NAVIGATE: target < node.val → LEFT, else → RIGHT
  return closest

═══════════════════════════════════════════════════════════════

📌 KEY INSIGHT:
  BST: left < node < right
  → skip right if target < node (all right ≥ node > target)
  → skip left  if target > node (all left ≤ node < target)
  → Binary search on a tree!

═══════════════════════════════════════════════════════════════

📌 COMPLEXITY:
  Time: O(h) — O(log n) balanced, O(n) skewed
  Space: O(1) iterative ✅

📌 TRAPS:
  ❌ Traverse all nodes → O(n)
  ❌ Forget Math.abs → negative diff bugs
  ❌ < vs <= → tie-breaking behavior changes

📌 FOLLOW-UPS:
  → K closest values? Two stacks O(h+k) #272
  → Equally close? Tie-breaker logic
  → Not BST? Must brute force O(n)

═══════════════════════════════════════════════════════════════
```

---

## 🔢 NUMBER LINE — Hình dung BST Search trên trục số

> Mỗi bước BST search THU HẸP vùng tìm kiếm trên trục số!

```
═══════════════════════════════════════════════════════════════
  BST: 4(2(1,3), 5)    Target = 3.7
═══════════════════════════════════════════════════════════════

TRỤC SỐ (number line):

  0    1    2    3    4    5    6
  |────|────|────|────|────|────|
                      ↑ target = 3.7

STEP 1: node = 4
  Vùng tìm kiếm: [−∞, +∞]    (toàn bộ cây!)
  
  0    1    2    3    4    5    6
  |────|────|────|────|────|────|
  [========================★====]  ★node=4, dist=0.3
                      ↑ t=3.7
  
  3.7 < 4 → Closest chỉ CÓ THỂ ở BÊN TRÁI (≤ 4)
  Thu hẹp: [−∞, 4]
  Skip: (4, +∞) gồm node 5 → LOẠI!

STEP 2: node = 2
  Vùng tìm kiếm: [−∞, 4]
  
  0    1    2    3    4    5    6
  |────|────|────|────|────|────|
  [=========★===========]          ★node=2, dist=1.7
                      ↑ t=3.7
  
  3.7 > 2 → Closest chỉ CÓ THỂ ở BÊN PHẢI (≥ 2)
  Thu hẹp: [2, 4]
  Skip: [−∞, 2) gồm node 1 → LOẠI!

STEP 3: node = 3
  Vùng tìm kiếm: [2, 4]
  
  0    1    2    3    4    5    6
  |────|────|────|────|────|────|
            [====★======]          ★node=3, dist=0.7
                      ↑ t=3.7
  
  3.7 > 3 → go RIGHT → null → STOP!
  
  Final: closest = 4 (dist 0.3) ✅

═══════════════════════════════════════════════════════════════
  MỖI BƯỚC THU HẸP NỬA VÙNG TÌM KIẾM!
  [−∞,+∞] → [−∞,4] → [2,4] → [3,4] → null
  
  Giống Binary Search: left,right → thu hẹp → tìm ra!
═══════════════════════════════════════════════════════════════
```

```
═══════════════════════════════════════════════════════════════
  VÍ DỤ 2: Target = 1.3
═══════════════════════════════════════════════════════════════

STEP 1: node=4, dist=2.7, closest=4, 1.3<4 → LEFT
  0    1    2    3    4    5    6
  [========================★====]  → thu hẹp [−∞,4]
            ↑ t=1.3

STEP 2: node=2, dist=0.7, 0.7<2.7 → closest=2!, 1.3<2 → LEFT
  0    1    2    3    4
  [=========★===========]  → thu hẹp [−∞,2]
            ↑ t=1.3

STEP 3: node=1, dist=0.3, 0.3<0.7 → closest=1!, 1.3>1 → RIGHT → null
  0    1    2
  [====★====]  → RIGHT → null → STOP!
            ↑ t=1.3

  Answer: 1 ✅ (dist=0.3)
  
  Path trên trục số: [−∞,+∞] → [−∞,4] → [−∞,2] → [1,2] → null
  Mỗi bước loại BỎ ≥1 node!
```

---

## 🎯 PREDECESSOR / SUCCESSOR — Khái niệm Floor & Ceil

> Target nằm GIỮA 2 node values → closest là 1 trong 2 "hàng xóm"!

```
═══════════════════════════════════════════════════════════════
  FLOOR & CEIL TRONG BST
═══════════════════════════════════════════════════════════════

  BST values: [1, 2, 3, 4, 5]
  Target = 3.7
  
  ... 1 ... 2 ... 3 ... ↑ ... 4 ... 5 ...
                     target=3.7
                    ↗         ↖
               FLOOR=3      CEIL=4
  
  FLOOR = giá trị LỚN NHẤT ≤ target (predecessor)
  CEIL  = giá trị NHỎ NHẤT ≥ target (successor)
  
  Closest = FLOOR hoặc CEIL, tùy cái nào GẦN HƠN!
  |3 - 3.7| = 0.7
  |4 - 3.7| = 0.3  ← closer! → answer = 4

═══════════════════════════════════════════════════════════════

  BST SEARCH TỰ NHIÊN TÌM FLOOR VÀ CEIL:
  
  Khi đi LEFT (target < node):
    node = CEIL candidate (node > target → có thể là ceil!)
    → Lưu lại! Có thể là closest!
    
  Khi đi RIGHT (target > node):
    node = FLOOR candidate (node < target → có thể là floor!)
    → Lưu lại! Có thể là closest!
    
  Khi kết thúc: closest = min(|floor-target|, |ceil-target|)
  → Code KHÔNG CẦN tách riêng floor/ceil — chỉ cần track closest!

═══════════════════════════════════════════════════════════════

  VÍ DỤ TARGET = 2.5:
  
  ... 1 ... 2 ... ↑ ... 3 ... 4 ... 5 ...
               target=2.5
              ↗         ↖
         FLOOR=2      CEIL=3
  
  |2 - 2.5| = 0.5
  |3 - 2.5| = 0.5  ← TIE!
  
  → Dùng `<` → giữ 2 (first encountered)
  → Dùng `<=` → update 3 (last encountered)
  → Muốn smaller? → return 2 (chọn floor khi tie!)
```

---

## 📸 DFS STEP-BY-STEP — Tree State tại từng bước

> ★ = đang xét. ✓ = đã thăm. ✗ = bị skip. ◯ = chưa thăm.

```
BST: 4(2(1,3), 5)    target = 3.7

═══════════════════════════════════════════════════════════════
STEP 1: Visit node 4
═══════════════════════════════════════════════════════════════

     ★4              closest = 4, dist = 0.3
    / \               3.7 < 4 → go LEFT
   ◯2  ◯5             → RIGHT subtree (5) SKIPPED! ✗
  / \
 ◯1 ◯3

═══════════════════════════════════════════════════════════════
STEP 2: Visit node 2
═══════════════════════════════════════════════════════════════

      4              dist = |2-3.7| = 1.7
     / \              1.7 > 0.3 → NO UPDATE, closest vẫn = 4
   ★2  ✗5             3.7 > 2 → go RIGHT
   / \                → LEFT subtree (1) SKIPPED! ✗
  ◯1 ◯3

═══════════════════════════════════════════════════════════════
STEP 3: Visit node 3
═══════════════════════════════════════════════════════════════

      4              dist = |3-3.7| = 0.7
     / \              0.7 > 0.3 → NO UPDATE, closest vẫn = 4
    2  ✗5             3.7 > 3 → go RIGHT → null
   / \
  ✗1 ★3

═══════════════════════════════════════════════════════════════
STEP 4: null → STOP!
═══════════════════════════════════════════════════════════════

      ✓4              
     / \               return closest = 4 ✅
    ✓2  ✗5             
   / \                 Visited: 3 nodes (4, 2, 3)
  ✗1 ✓3                Skipped: 2 nodes (1, 5)
                       Total: 3/5 = O(h) not O(n)!
```

```
═══════════════════════════════════════════════════════════════
VÍ DỤ 2 — CLOSEST UPDATE NHIỀU LẦN: target = 1.3
═══════════════════════════════════════════════════════════════

STEP 1:  ★4  dist=2.7 → closest=4,     1.3<4 → LEFT
STEP 2:  ★2  dist=0.7 → closest=2! ✅  1.3<2 → LEFT
STEP 3:  ★1  dist=0.3 → closest=1! ✅  1.3>1 → RIGHT → null

      ✓4              Visited: 4, 2, 1
     / \               Skipped: 3, 5
    ✓2  ✗5             closest cập nhật 3 lần: 4→2→1
   / \
  ✓1 ✗3                → Khi target < tất cả: closest CHỈ UPDATE!
                          (luôn tìm được gần hơn khi đi về phía target)
```

---

## 🔄 CODE VARIATIONS — 5 Style khác nhau

### Variation 1: Iterative — CLASSIC (recommended)

```javascript
function closestValue(root, target) {
  let closest = root.val;
  let node = root;
  while (node) {
    if (Math.abs(node.val - target) < Math.abs(closest - target)) {
      closest = node.val;
    }
    node = target < node.val ? node.left : node.right;
  }
  return closest;
}
// Time: O(h), Space: O(1) ✅
```

### Variation 2: Recursive — CLEAN

```javascript
function closestValue(root, target) {
  let closest = root.val;
  function dfs(node) {
    if (!node) return;
    if (Math.abs(node.val - target) < Math.abs(closest - target))
      closest = node.val;
    dfs(target < node.val ? node.left : node.right);
  }
  dfs(root);
  return closest;
}
// Time: O(h), Space: O(h)
```

### Variation 3: Pure Recursive — NO global variable

```javascript
function closestValue(root, target) {
  if (!root) return Infinity;
  const child = target < root.val
    ? closestValue(root.left, target)
    : closestValue(root.right, target);
  return Math.abs(root.val - target) <= Math.abs(child - target)
    ? root.val : child;
}
// Time: O(h), Space: O(h)
// ✅ No mutation! Each call returns the closest in its subtree.
```

> 🎙️ *"Pure recursive: mỗi call trả về closest trong subtree. Cha so sánh chính nó vs con trả về. Elegant nhưng khó trace."*

```
Trace pure recursive: target=3.7, BST: 4(2(1,3),5)

  closestValue(4, 3.7)
    3.7 < 4 → child = closestValue(2, 3.7)
      3.7 > 2 → child = closestValue(3, 3.7)
        3.7 > 3 → child = closestValue(null, 3.7) = Infinity
        |3-3.7|=0.7 vs |Inf-3.7|=Inf → return 3
      |2-3.7|=1.7 vs |3-3.7|=0.7 → return 3 (child wins!)
    |4-3.7|=0.3 vs |3-3.7|=0.7 → return 4 (root wins!) ✅
```

### Variation 4: Track Distance — AVOID RECOMPUTATION

```javascript
function closestValue(root, target) {
  let closest = root.val;
  let minDist = Math.abs(root.val - target);
  let node = root;
  
  while (node) {
    const dist = Math.abs(node.val - target);
    if (dist < minDist) {
      minDist = dist;
      closest = node.val;
    }
    if (dist === 0) return node.val;  // exact match!
    node = target < node.val ? node.left : node.right;
  }
  return closest;
}
// Avoids recalculating |closest - target| each iteration
// + includes early exit for exact match!
```

### Variation 5: Floor/Ceil — EXPLICIT predecessor/successor

```javascript
function closestValue(root, target) {
  let floor = -Infinity;   // largest value ≤ target
  let ceil = Infinity;     // smallest value ≥ target
  let node = root;
  
  while (node) {
    if (node.val === target) return target;
    if (node.val < target) {
      floor = node.val;     // potential floor
      node = node.right;    // look for closer floor
    } else {
      ceil = node.val;      // potential ceil
      node = node.left;     // look for closer ceil
    }
  }
  
  // Compare floor and ceil distances
  return Math.abs(floor - target) <= Math.abs(ceil - target)
    ? floor : ceil;
}
```

> 🎙️ *"Floor/Ceil explicit: tracks predecessor AND successor. At the end, picks the closer one. This makes tie-breaking crystal clear — `<=` returns floor (smaller), `<` returns ceil."*

```
Trace floor/ceil: target=3.7, BST: 4(2(1,3),5)

  node=4: 4>3.7 → ceil=4, go LEFT
  node=2: 2<3.7 → floor=2, go RIGHT
  node=3: 3<3.7 → floor=3, go RIGHT → null
  
  floor=3, ceil=4
  |3-3.7|=0.7  vs  |4-3.7|=0.3
  → ceil WINS! return 4 ✅
  
  ⚠️ NOTE: floor LUÔN đi RIGHT (tìm lớn hơn ≤ target)
           ceil  LUÔN đi LEFT  (tìm nhỏ hơn ≥ target)
           Matches BST search direction!
```

```
═══════════════════════════════════════════════════════════════
              SO SÁNH 5 VARIATIONS
═══════════════════════════════════════════════════════════════

┌──────────────┬────────┬───────┬──────────────────────────┐
│ Variation    │ Time   │ Space │ Best for                 │
├──────────────┼────────┼───────┼──────────────────────────┤
│ 1. Iterative │ O(h)   │ O(1)  │ Interview DEFAULT ✅      │
│ 2. Recursive │ O(h)   │ O(h)  │ Quick write              │
│ 3. Pure Rec. │ O(h)   │ O(h)  │ Functional style         │
│ 4. Track Dist│ O(h)   │ O(1)  │ Optimized + early exit   │
│ 5. Floor/Ceil│ O(h)   │ O(1)  │ Explicit tie-break ✅     │
└──────────────┴────────┴───────┴──────────────────────────┘
```

---

## 🧪 DERIVE FROM FIRST PRINCIPLES

> 🎙️ *"Nếu chưa bao giờ thấy bài này, đây là cách tự derive:"*

### Bước 1: Nhận diện keywords

```
"BST" + "closest" + "target"
  ↓
BST → có thể binary search! (sorted property)
closest → track khoảng cách → update khi tìm thấy gần hơn
target → float → có thể GIỮA 2 node values

→ Pattern: BST Search + track min distance
```

### Bước 2: Brute force trước

```
Brute force: traverse ALL nodes, track closest
  → O(n) time, works but ignores BST!

function brute(root, target) {
  let closest = root.val;
  function dfs(node) {
    if (!node) return;
    if (|node.val - target| < |closest - target|) closest = node.val;
    dfs(node.left);   // ← visit ALL left
    dfs(node.right);  // ← visit ALL right
  }
  dfs(root);
  return closest;
}
```

### Bước 3: Optimize bằng BST property

```
Insight: BST → left < node < right

Nếu target < node:
  → Mọi node bên RIGHT ≥ node > target
  → |right - target| ≥ |node - target|
  → RIGHT xa hơn hoặc bằng node → SKIP!
  → Chỉ cần tìm bên LEFT!

Nếu target > node:
  → Symmetric → SKIP LEFT!

→ Mỗi bước chỉ đi 1 hướng → O(h)!
→ Thay dfs(left) + dfs(right) bằng CHỈ 1 cái!
```

### Bước 4: Iterative vs Recursive

```
BST search chỉ đi 1 hướng → tail recursion!
→ Tail recursion = đơn giản hóa thành while loop!
→ while (node) { update; navigate; }
→ O(1) space!
```

### Bước 5: Handle edge cases

```
1. Exact match: dist=0 → optimal! Early return.
2. Target < all nodes: go ALL LEFT → closest = min node
3. Target > all nodes: go ALL RIGHT → closest = max node
4. Tie: |floor-target| = |ceil-target| → depends on < vs <=
5. Single node: closest = root.val (only option)
```

### Bước 6: Code!

```
Pseudocode → Real code:
  "track closest"  →  let closest = root.val
  "each node"      →  while (node)
  "update if closer"→  if (|val-target| < |closest-target|)
  "BST navigate"   →  node = target < val ? left : right
  "return"          →  return closest
  
→ ĐÂY CHÍNH LÀ CODE CUỐI CÙNG!
```

---

## 🧠 DEEP DIVE — Tại sao algorithm ĐÚNG? (Correctness Proof)

```
═══════════════════════════════════════════════════════════════
  INVARIANT: closest luôn = node GẦN NHẤT trong các node ĐÃ THĂM
═══════════════════════════════════════════════════════════════

  Proof by induction:
  
  Base: closest = root.val → đúng (chỉ thăm root)
  
  Step: giả sử trước node k, closest đúng cho nodes đã thăm.
    → Check node k: nếu gần hơn → update → closest đúng cho k+1 nodes
    → Nếu không gần hơn → closest vẫn đúng
    → Navigate: skip subtree CHÍNH XÁC là subtree 
      MÀ MỌI NODE XA HƠN node hiện tại (BST property!)
    → Closest = min trên toàn bộ path root→null
    
  End: khi null, đã thăm tất cả "candidates" (nodes trên path)
    → Nodes bị skip KHÔNG BAO GIỜ gần hơn nodes trên path
    → closest = answer! ✅

═══════════════════════════════════════════════════════════════
  TẠI SAO NODES BỊ SKIP KHÔNG GẦN HƠN?
═══════════════════════════════════════════════════════════════

  Khi skip RIGHT (vì target < node):
    Mọi R trong right subtree: R ≥ node.val
    
    Distance(R, target) = |R - target|
                        = R - target        (vì R > target)
                        ≥ node.val - target (vì R ≥ node.val)
                        = |node.val - target|
                        = Distance(node, target)
    
    → R có distance ≥ node → R KHÔNG GẦN HƠN node!
    → node ĐÃ ĐƯỢC CHECK → closest ≥ tốt bằng node
    → R KHÔNG THỂ tốt hơn closest → SAFE to skip! ✅
    
  Khi skip LEFT: chứng minh tương tự (symmetric)
```

