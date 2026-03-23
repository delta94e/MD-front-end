# 🌲 Convert Sorted Array to BST — LeetCode #108 (Easy)

> 📖 Code: [Convert Sorted Array to BST.js](./Convert%20Sorted%20Array%20to%20BST.js)

---

## R — Repeat & Clarify

🧠 *"Sorted array → BST balanced. Giống Min Height BST. Pattern: pick middle, recurse."*

> 🎙️ *"The problem asks me to convert a sorted array into a height-balanced binary search tree. A height-balanced BST means the depth of the two subtrees of every node never differs by more than 1."*

> 🎙️ *"Let me clarify:*
>
> *1. **Sorted in ascending order?** — Yes, the array is already sorted.*
>
> *2. **Multiple valid BSTs?** — Yes, there can be multiple valid answers. Any height-balanced BST is acceptable.*
>
> *3. **Can the array be empty?** — I'll handle that as a base case returning null.*
>
> *4. **Duplicates?** — I'll assume no duplicates since it's a BST.*
>
> *5. **Can array have 1 element?** — Yes, return a single node.*
>
> *6. **What if even length?** — Middle is ambiguous. Chọn left-mid hoặc right-mid đều valid."*

🧠 *"Hỏi 'multiple valid answers' = show mình hiểu bài. Có thể chọn mid trái hoặc mid phải khi array chẵn."*

💡 **Tại sao bài này quan trọng?**
```
Bài này teach DIVIDE & CONQUER trên sorted data:
→ #109 Sorted Linked List → BST (no random access!)
→ #1382 Balance a BST (inorder → sorted → rebuild)
→ Min Height BST (AlgoExpert — identical!)
→ Binary Search (REVERSE: tìm vs build!)
→ Merge Sort (CÙNG recursion structure!)

Pattern: pick middle = root, recurse 2 nửa!
Nếu hiểu bài 108 → hiểu Divide & Conquer nói chung!
```

---

## E — Examples

> 🎙️ *"Let me trace a few examples to build intuition:"*

```
VÍ DỤ 1 — ODD LENGTH: nums = [-10, -3, 0, 5, 9]
═══════════════════════════════════════════════════════════════

  Index:  0    1    2    3    4
  Value: -10  -3   0    5    9
                   ↑ mid=2 → root!
  
  mid = floor((0+4)/2) = 2 → root = nums[2] = 0
  Left half:  [0..1] = [-10, -3]
  Right half: [3..4] = [5, 9]

  Tiếp tục chọn middle mỗi nửa:
  
  Left [0..1]: mid=0 → node=-10
    Left [0..-1]: null (start > end!)
    Right [1..1]: mid=1 → node=-3

  Right [3..4]: mid=3 → node=5
    Left [3..2]: null
    Right [4..4]: mid=4 → node=9

  Result:        0
               /   \
             -10    5
               \     \
               -3     9

  BST? -10 < 0 ✅, -3 < 0 AND -3 > -10 ✅, 5 > 0 ✅, 9 > 5 ✅
  Balanced? Left height=2, Right height=2 ✅

VÍ DỤ 2 — EVEN LENGTH: nums = [1, 3, 5, 7]
═══════════════════════════════════════════════════════════════

  Index: 0  1  2  3
  Value: 1  3  5  7
            ↑ mid=1 (floor)
  
  mid = floor((0+3)/2) = 1 → root = 3

  Left [0..0]: mid=0 → node=1
  Right [2..3]: mid=2 → node=5
    Right [3..3]: mid=3 → node=7

  Result:    3
            / \
           1   5       ← Left height=1, Right height=2
                \         Diff = 1 ≤ 1 → BALANCED! ✅
                 7

  ⚠️ Nếu dùng CEIL thay FLOOR:
  mid = ceil((0+3)/2) = 2 → root = 5
  
  Result:    5
            / \
           3   7       ← Different tree, CŨNG balanced!
          /
         1
  
  → CẢ 2 ĐỀU ĐÚNG! Đây là 1 trong NHIỀU valid answers!

VÍ DỤ 3 — PERFECT TREE: nums = [1, 2, 3, 4, 5, 6, 7]
═══════════════════════════════════════════════════════════════

  7 nodes = 2³ - 1 → perfect binary tree!
  
         4
        / \
       2   6
      / \ / \
     1  3 5  7

  Mọi level đầy! Height = log₂(7+1) = 3 ✅

VÍ DỤ 4 — EDGE CASES:
═══════════════════════════════════════════════════════════════

  nums = []    → null ✅
  nums = [42]  → TreeNode(42) ✅ (root = leaf!)
  nums = [1,3] → root=1, right=3 (hoặc root=3, left=1) ✅
```

🧠 *"Observation: CHỌN MIDDLE = chia đều = balanced! Giống binary search chia đôi search space."*

---

## CHIA NHỎ BÀI TOÁN — Xây dựng intuition từ cây nhỏ

### Bước 1: 1 element → 1 node

```
  nums = [5]
  
  Chỉ 1 phần tử → nó LÀ root → không có con!
  
       5      ← leaf node, height = 1
  
  build(0, 0): mid=0, node=5
    left = build(0, -1) = null   (start > end!)
    right = build(1, 0) = null   (start > end!)
  return node(5)
```

### Bước 2: 2 elements → cây lệch 1

```
  nums = [1, 3]
  mid = floor((0+1)/2) = 0 → root = 1
  
     1        Left: null
      \       Right: [1..1] → node=3
       3
       
  Balanced? Height left=0, right=1 → diff=1 ≤ 1 ✅

  ⚠️ Nếu dùng ceil: mid = ceil((0+1)/2) = 1 → root=3
     3
    /
   1          Cũng balanced, tree mirror!
```

### Bước 3: 3 elements → perfect tree

```
  nums = [1, 2, 3]
  mid = floor((0+2)/2) = 1 → root = 2

     2        Left:  [0..0] → node=1
    / \       Right: [2..2] → node=3
   1   3

  PERFECT TREE! Height left = right = 1 ✅
  
  ĐÂY LÀ BEST CASE: odd length → middle chia ĐÚNG đều!
```

### Bước 4: 5 elements → xem ĐỆ QUY hoạt động

```
  nums = [1, 2, 3, 4, 5]
  
  STEP 1: build(0,4) → mid=2, root=3
  
  Array:  [1, 2, 3, 4, 5]
                ↑ ROOT
          ↗         ↖
       LEFT         RIGHT
       [1,2]        [4,5]

  STEP 2: build LEFT [0,1] → mid=0, root=1
  
  [1, 2] → root=1, right=2
     1
      \
       2

  STEP 3: build RIGHT [3,4] → mid=3, root=4
  
  [4, 5] → root=4, right=5
     4
      \
       5

  COMBINE:
       3
      / \
     1   4
      \   \
       2   5
  
  BST? 1<3 ✅, 2>1 AND 2<3 ✅, 4>3 ✅, 5>4 ✅
  Balanced? left h=2, right h=2 ✅
```

---

## A — Approach

🧠 *"Chỉ 1 approach chính. Nhưng giải thích TẠI SAO nó work là quan trọng hơn."*

> 🎙️ *"I see this is essentially a Divide and Conquer problem — very similar to Binary Search but in reverse.*
>
> *In Binary Search, I start with a sorted array and repeatedly pick the middle to narrow down my search range.*
>
> *Here, I start with a sorted array and repeatedly pick the middle to BUILD a tree. Each middle element becomes the root of its subtree.*
>
> *Why does this guarantee balance? Because picking the middle divides the array into two halves that differ in size by at most 1. Recursively, every subtree also picks its middle, so the depth difference is always ≤ 1."*

```
═══════════════════════════════════════════════════════════════
  TẠI SAO CHỌN MIDDLE? — 3 lý do
═══════════════════════════════════════════════════════════════

LÝ DO 1: Middle chia ĐỀU (balance!)

  nums = [1, 2, 3, 4, 5]

  Chọn ĐẦU (1):        Chọn GIỮA (3):
  1                          3
   \                        / \
    2                      1   4
     \                      \   \
      3                      2   5
       \
        4                ← Balanced! h=3
         \
          5              ← Skewed! h=5

  Chọn đầu: left=0, right=4 → LỆCH!
  Chọn giữa: left=2, right=2 → ĐỀU!

LÝ DO 2: Sorted + middle → BST TỰ NHIÊN!

  Array SORTED: [1, 2, 3, 4, 5]
  Middle = 3
  
  Left half:  [1, 2] → TẤT CẢ < 3 ✅
  Right half: [4, 5] → TẤT CẢ > 3 ✅
  → BST property THOẢ MÃN tự nhiên!

LÝ DO 3: Recursion TỰ GIỐNG (self-similar!)

  build([1,2,3,4,5]) → pick 3, recurse [1,2] và [4,5]
  build([1,2])        → pick 1, recurse [] và [2]
  build([4,5])        → pick 4, recurse [] và [5]
  
  CẤU TRÚC GIỐNG NHAU ở mọi level = DIVIDE & CONQUER!
```

```
═══════════════════════════════════════════════════════════════
  BINARY SEARCH vs BUILD BST — Cùng 1 coin, 2 mặt!
═══════════════════════════════════════════════════════════════

  Binary Search:    [1,2,3,4,5,6,7] → TÌM 5
    mid=4, 5>4 → right [5,6,7]
    mid=6, 5<6 → left  [5]
    mid=5, FOUND! → return 5

  Build BST:        [1,2,3,4,5,6,7] → BUILD tree
    mid=4 → root=4
    left [1,2,3]:  mid=2 → root=2, left [1], right [3]
    right [5,6,7]: mid=6 → root=6, left [5], right [7]

  ┌──────────────┬──────────────────┬────────────────────┐
  │              │ Binary Search    │ Build BST          │
  ├──────────────┼──────────────────┼────────────────────┤
  │ Input        │ Sorted array     │ Sorted array       │
  │ Output       │ 1 element        │ n nodes (tree)     │
  │ Each step    │ Pick mid         │ Pick mid           │
  │ Next step    │ Go 1 side only   │ Go BOTH sides!     │
  │ Time         │ O(log n)         │ O(n)               │
  │ # of mids    │ O(log n)         │ O(n) (all elements)│
  └──────────────┴──────────────────┴────────────────────┘
  
  KEY DIFFERENCE: Binary Search đi 1 hướng → O(log n)
                  Build BST đi CẢ 2 → O(n) (visit all!)
```

---

## C — Code

> 📖 Full code: [Convert Sorted Array to BST.js](./Convert%20Sorted%20Array%20to%20BST.js)

```javascript
function sortedArrayToBST(nums) {
  return build(nums, 0, nums.length - 1);
}

function build(nums, start, end) {
  if (start > end) return null;              // 1. empty subarray

  const mid = Math.floor((start + end) / 2); // 2. pick middle
  const node = new TreeNode(nums[mid]);      // 3. create root

  node.left = build(nums, start, mid - 1);   // 4. build left
  node.right = build(nums, mid + 1, end);    // 5. build right

  return node;                                // 6. return!
}
```

> 🎙️ *"Let me explain EVERY design decision:"*

```
═══════════════════════════════════════════════════════════════
  5 DESIGN DECISIONS
═══════════════════════════════════════════════════════════════

DECISION 1: TẠI SAO dùng INDICES (start, end) thay vì SLICE?

  ❌ SLICE:  build(nums.slice(0, mid))
    → Tạo array MỚI mỗi lần → O(n) per call!
    → Total: O(n) × O(log n) levels = O(n log n) 😰
    
  ✅ INDEX: build(nums, start, end)
    → Chỉ truyền 2 số → O(1) per call!
    → Total: O(n) × O(1) = O(n) 🎉
    
  EXAMPLE:
    nums = [1,2,3,4,5,6,7]
    
    SLICE cách:
      build([1,2,3,4,5,6,7])     ← copy 7 elements
        build([1,2,3])            ← copy 3 elements
          build([1])              ← copy 1 element
        build([5,6,7])            ← copy 3 elements
      Total copies: 7+3+3+1+1+1+1 = 17 copies!
    
    INDEX cách:
      build(nums, 0, 6)          ← just 2 numbers
        build(nums, 0, 2)        ← just 2 numbers
          build(nums, 0, 0)      ← just 2 numbers
        build(nums, 4, 6)        ← just 2 numbers
      Total copies: 0 copies!

DECISION 2: TẠI SAO `start > end` không phải `start >= end`?

  start > end:  subarray EMPTY → return null ✅
  start === end: subarray has 1 ELEMENT → vẫn cần xử lý!
  
  Ví dụ: build(nums, 3, 3) → mid=3 → node=nums[3]
    left = build(3, 2) → null (3>2)
    right = build(4, 3) → null (4>3)
    return node ← 1 LEAF NODE!
    
  Nếu dùng `start >= end`? → miss single element! ❌
  
  ⚠️ NGOẠI TRỪ: nếu `start >= end` VÀ xử lý `start === end` riêng:
    if (start > end) return null;
    if (start === end) return new TreeNode(nums[start]);
    // ... OK nhưng THỪA code! start > end đã đủ!

DECISION 3: TẠI SAO `Math.floor` không `Math.ceil`?

  Array chẵn [1, 2, 3, 4]:
  
  floor: mid = floor((0+3)/2) = 1 → root=2
       2
      / \
     1   3
          \
           4
  
  ceil: mid = ceil((0+3)/2) = 2 → root=3
       3
      / \
     2   4
    /
   1

  CẢ 2 ĐỀU ĐÚNG! Chỉ tạo tree KHÁC NHAU.
  LeetCode accepts cả 2!
  
  Convention: floor = chọn LEFT-of-center (phổ biến hơn)

DECISION 4: TẠI SAO `mid-1` và `mid+1`?

  mid = root đã được dùng → LOẠI khỏi cả 2 nửa!
  
  [start, ..., mid-1, MID, mid+1, ..., end]
   ↑──── LEFT ────↑   ↑   ↑──── RIGHT ────↑
   
  Nếu KHÔNG loại mid:
  build(start, mid) → mid lại được chọn → INFINITE LOOP! ❌

DECISION 5: TẠI SAO return NODE?

  Mỗi call tạo 1 node → gán vào parent.left hoặc parent.right
  → BOTTOM-UP construction: leaves built first, root last!
  → Final return = root of ENTIRE tree!
```

---

## 🌳 RECURSION CALL TREE — Toàn bộ lời gọi hàm

```
nums = [-10, -3, 0, 5, 9]
Index:   0    1   2  3  4

═══════════════════════════════════════════════════════════════
                RECURSION TREE
═══════════════════════════════════════════════════════════════

                build(0, 4)
               mid=2, node=0
              /              \
      build(0, 1)         build(3, 4)
     mid=0, node=-10      mid=3, node=5
     /         \           /         \
  build(0,-1) build(1,1) build(3,2) build(4,4)
   → null    mid=1,node=-3  → null  mid=4,node=9
             /        \             /        \
         build(1,0) build(2,1) build(4,3) build(5,4)
          → null     → null    → null     → null

═══════════════════════════════════════════════════════════════

  📋 Thứ tự THỰC HIỆN (post-order — leaves trước!):
  
  ① build(0,-1) → null
  ② build(1,0)  → null  
  ③ build(2,1)  → null
  ④ build(1,1)  → node(-3), left=null, right=null ← LEAF!
  ⑤ build(0,1)  → node(-10), left=null, right=-3
  ⑥ build(3,2)  → null
  ⑦ build(4,3)  → null
  ⑧ build(5,4)  → null
  ⑨ build(4,4)  → node(9), left=null, right=null ← LEAF!
  ⑩ build(3,4)  → node(5), left=null, right=9
  ⑪ build(0,4)  → node(0), left=-10, right=5 ← ROOT!

  → BOTTOM-UP: leaves tạo trước, root tạo CUỐI CÙNG!
  → 11 calls total: 5 node calls + 6 null calls

═══════════════════════════════════════════════════════════════

  TREE ĐƯỢC XÂY TỪ DƯỚI LÊN:

  Step ④: -3 (leaf)
  Step ⑤: -10 → -3 (attach right)
  Step ⑨: 9 (leaf)
  Step ⑩: 5 → 9 (attach right)
  Step ⑪: 0 → (-10, 5) (attach both!)

  Final:       0
             /   \
           -10    5
             \     \
             -3     9
```

---

## 📸 STEP-BY-STEP — Xây dựng cây từng bước

```
nums = [1, 2, 3, 4, 5, 6, 7]

═══════════════════════════════════════════════════════════════
STEP 1: build(0,6) → mid=3, CREATE node(4)
═══════════════════════════════════════════════════════════════

  Array: [1, 2, 3, 4, 5, 6, 7]
                    ↑ ROOT

  Tree so far:     4
                  / \
                 ?   ?

═══════════════════════════════════════════════════════════════
STEP 2: build(0,2) → mid=1, CREATE node(2)
═══════════════════════════════════════════════════════════════

  Array: [1, 2, 3]  |  [5, 6, 7]
             ↑ root     (pending)

  Tree:        4
              / \
             2   ?
            / \
           ?   ?

═══════════════════════════════════════════════════════════════
STEP 3: build(0,0) → mid=0, CREATE node(1) — LEAF!
═══════════════════════════════════════════════════════════════

  Array: [1]
          ↑ leaf

  Tree:        4
              / \
             2   ?
            / \
           1   ?

═══════════════════════════════════════════════════════════════
STEP 4: build(2,2) → mid=2, CREATE node(3) — LEAF!
═══════════════════════════════════════════════════════════════

  Tree:        4
              / \
             2   ?
            / \
           1   3    ← Left subtree COMPLETE!

═══════════════════════════════════════════════════════════════
STEP 5: build(4,6) → mid=5, CREATE node(6)
═══════════════════════════════════════════════════════════════

  Array: [5, 6, 7]
             ↑ root right subtree

  Tree:        4
              / \
             2   6
            / \ / \
           1  3 ?  ?

═══════════════════════════════════════════════════════════════
STEP 6: build(4,4) → node(5), build(6,6) → node(7) — LEAVES!
═══════════════════════════════════════════════════════════════

  Tree:        4
              / \
             2   6
            / \ / \
           1  3 5  7    ← PERFECT TREE! DONE! ✅

  Height = 3 = ceil(log₂(8))
  Every level full!
  BST: verify 1<2<3<4<5<6<7 ✅ (inorder = sorted!)
```

---

## ❌ Common Mistakes

### Mistake 1: Dùng Array.slice() thay vì Index

```javascript
// ❌ SAI — O(n) mỗi lần slice!
function build(nums) {
  if (nums.length === 0) return null;
  const mid = Math.floor(nums.length / 2);
  const node = new TreeNode(nums[mid]);
  node.left = build(nums.slice(0, mid));     // O(mid) copy!
  node.right = build(nums.slice(mid + 1));   // O(n-mid) copy!
  return node;
}
// Total: O(n log n) thay vì O(n)! 😰

// ✅ ĐÚNG — O(1) per call
function build(nums, start, end) {
  // ...chỉ truyền indices!
}
```

### Mistake 2: Base case `start >= end`

```javascript
// ❌ SAI — miss single element!
if (start >= end) return null;  // khi start=end, có 1 element → BỊ SKIP!

// ✅ ĐÚNG — chỉ empty mới null
if (start > end) return null;   // start=end → 1 element → create node!
```

### Mistake 3: Không loại mid khỏi recursive calls

```javascript
// ❌ SAI — mid nằm trong cả 2 nửa!
node.left = build(nums, start, mid);    // mid INCLUDED → vô hạn loop!
node.right = build(nums, mid, end);     // mid INCLUDED!

// ✅ ĐÚNG — loại mid
node.left = build(nums, start, mid - 1);  // exclude mid!
node.right = build(nums, mid + 1, end);   // exclude mid!
```

### Mistake 4: Overflow khi tính mid

```javascript
// ⚠️ POTENTIAL ISSUE (trong C++/Java, KHÔNG PHẢI JS):
const mid = (start + end) / 2;  
// nếu start + end > INT_MAX → OVERFLOW!

// ✅ SAFE VERSION:
const mid = start + Math.floor((end - start) / 2);
// hoặc: const mid = (start + end) >>> 1;  // unsigned right shift
// JavaScript: Numbers là float64 → không overflow, nhưng good habit!
```

---

## T — Test

| # | Test | Input | Expected | Tại sao? |
|---|---|---|---|---|
| 1 | Normal odd | `[-10,-3,0,5,9]` | Height ≤ 3, balanced BST | Core case |
| 2 | Even | `[1,3,5,7]` | Height ≤ 3 | Mid ambiguity |
| 3 | Single | `[42]` | TreeNode(42) | Base case |
| 4 | Empty | `[]` | null | Edge case |
| 5 | Two | `[1,3]` | Height ≤ 2 | Smallest non-trivial |
| 6 | Perfect | `[1..7]` | Perfect tree h=3 | 2^k-1 nodes |
| 7 | Large | `[1..1000]` | Height ≤ 10 | Performance |
| 8 | Negative | `[-5,-3,-1]` | BST with negatives | Value edge |

---

## O — Optimize

```
═══════════════════════════════════════════════════════════════
                COMPLEXITY ANALYSIS
═══════════════════════════════════════════════════════════════

TIME: O(n)
  → Tạo đúng n nodes → n calls tạo node
  → Mỗi call: O(1) work (compute mid, create node)
  → n+1 null calls = O(1) each
  → Total: O(n) + O(n+1) = O(n)
  
  TẠI SAO O(n) LÀ OPTIMAL?
  → Phải tạo n nodes, mỗi node O(1) → minimum O(n)
  → KHÔNG THỂ làm tốt hơn O(n)! ✅

SPACE: O(n) output + O(log n) stack
  → O(n) cho tree output (n nodes)
  → O(log n) cho recursion stack
    (tree balanced → depth = log n → max stack depth = log n)
  → Nếu không tính output: O(log n) ← excellent!

┌────────────────┬──────────────┬────────────────────────┐
│                │ Index-based  │ Slice-based            │
├────────────────┼──────────────┼────────────────────────┤
│ Time           │ O(n) ✅       │ O(n log n) ❌          │
│ Space (stack)  │ O(log n)     │ O(n log n) copies ❌   │
│ Per call       │ O(1)         │ O(n) slice             │
│ Total calls    │ 2n+1         │ 2n+1                   │
└────────────────┴──────────────┴────────────────────────┘

TẠI SAO SLICE LÀ O(n log n)?
  Level 0: 1 call × slice n elements = n
  Level 1: 2 calls × slice n/2 each  = n
  Level 2: 4 calls × slice n/4 each  = n
  ...
  Level k: 2^k × n/2^k = n
  
  Total levels = log n → Total = n × log n = O(n log n)!
```

---

## 🗣️ Think Out Loud — Interview Script Chi Tiết

### 📌 Phút 0–1: Nhận đề + Clarify

🧠 *"Sorted array → BST. Classic! Nhưng đừng vội — hỏi clarifying questions."*

> 🎙️ *"I need to convert a sorted integer array into a height-balanced BST. Let me clarify: the array is sorted in ascending order? No duplicates? And any balanced BST is acceptable — there may be multiple valid answers?"*
>
> *(Interviewer: Yes)*

### 📌 Phút 1–3: Vẽ ví dụ + DERIVE

> 🎙️ *"Let me start small. For [1, 2, 3]:*
> ```
>    2
>   / \
>  1   3
> ```
> *The middle element 2 is the root. Left half [1] becomes left child, right half [3] becomes right child. This is a valid balanced BST."*

> 🎙️ *"For [1, 2, 3, 4, 5, 6, 7]:*
> ```
>        4
>       / \
>      2   6
>     / \ / \
>    1  3 5  7
> ```
> *The middle 4 is root. Each half recursively picks its middle. This gives a perfect tree."*

> 🎙️ *"I see the pattern: this is Binary Search in reverse. In Binary Search, I pick middles to SEARCH. Here, I pick middles to BUILD. Same divide-and-conquer structure."*

### 📌 Phút 3–5: Code

> 🎙️ *"I'll use a helper with start/end indices to avoid array slicing:*
> ```javascript
> function build(nums, start, end) {
>   if (start > end) return null;
>   const mid = Math.floor((start + end) / 2);
>   const node = new TreeNode(nums[mid]);
>   node.left = build(nums, start, mid - 1);
>   node.right = build(nums, mid + 1, end);
>   return node;
> }
> ```
> *Using indices instead of slicing makes each call O(1)."*

### 📌 Phút 5–6: Trace

> 🎙️ *"For [-10,-3,0,5,9]: build(0,4), mid=2, root=0. Left build(0,1), mid=0, node=-10, right child=-3. Right build(3,4), mid=3, node=5, right child=9. Tree is balanced with height 2 on both sides."*

### 📌 Phút 6–7: Complexity

> 🎙️ *"Time O(n) — create n nodes, O(1) per call. Space O(n) for tree, O(log n) recursion stack since tree is balanced. This is optimal — can't create n nodes in less than O(n)."*

---

### Follow-up Questions

**Q1: "What if the array is NOT sorted?"**

> 🎙️ *"Sort first — O(n log n). Or insert elements into a self-balancing BST (AVL/Red-Black). Sorted array approach is better: O(n) and perfectly balanced."*

**Q2: "Can you do this iteratively?"**

> 🎙️ *"Yes! Use a queue with tuples (node, start, end). Process each: compute mid, create children, enqueue them. BFS-style construction:*
> ```javascript
> function sortedArrayToBST(nums) {
>   if (!nums.length) return null;
>   const mid = Math.floor((nums.length - 1) / 2);
>   const root = new TreeNode(nums[mid]);
>   const queue = [[root, 0, mid - 1, 'left'], [root, mid + 1, nums.length - 1, 'right']];
>   while (queue.length) {
>     const [parent, s, e, side] = queue.shift();
>     if (s > e) continue;
>     const m = Math.floor((s + e) / 2);
>     const node = new TreeNode(nums[m]);
>     parent[side] = node;
>     queue.push([node, s, m - 1, 'left'], [node, m + 1, e, 'right']);
>   }
>   return root;
> }
> ```
> *Same time/space, just harder to read."*

**Q3: "What about a sorted LINKED LIST?" (→ #109)**

> 🎙️ *"No random access → can't jump to middle! Three approaches:*
>
> *1. Convert to array first → O(n) extra space.*
> *2. Slow/fast pointer to find middle → O(n log n) time.*
> *3. Inorder simulation: build in-order, advancing list pointer → O(n) time, O(log n) space! This is the gold approach:*
> ```javascript
> function sortedListToBST(head) {
>   const size = getSize(head);
>   let curr = head;
>   function build(start, end) {
>     if (start > end) return null;
>     const mid = Math.floor((start + end) / 2);
>     const left = build(start, mid - 1);  // build left FIRST
>     const node = new TreeNode(curr.val);  // current = mid!
>     curr = curr.next;                     // advance pointer
>     node.left = left;
>     node.right = build(mid + 1, end);
>     return node;
>   }
>   return build(0, size - 1);
> }
> ```
> *The trick: build LEFT subtree first (inorder!), then current node IS the middle. No need to find middle!"*

**Q4: "Prove this produces a balanced tree."**

> 🎙️ *"By strong induction:*
>
> *Base: 0 elements → null (balanced, height 0). 1 element → single node (balanced, height 1).*
>
> *Inductive step: n elements. Pick middle → left half has ⌊(n-1)/2⌋ elements, right half has ⌈(n-1)/2⌉. They differ by at most 1.*
>
> *By induction, left subtree has height h_L = ⌈log₂(left_size+1)⌉, right has h_R = ⌈log₂(right_size+1)⌉. Since sizes differ by at most 1, h_L and h_R differ by at most 1. Therefore the root's tree is balanced. QED."*

---

### 📌 Pattern Recognition

```
═══════════════════════════════════════════════════════════════
  "SORTED → BALANCED BST" PATTERN
═══════════════════════════════════════════════════════════════

  Thuộc nhóm: DIVIDE AND CONQUER on sorted data
  Core trick:  PICK MIDDLE = ROOT, recurse hai nửa!

  ┌──────────────────────────┬──────────────────────────────┐
  │ Problem                  │ Variation                    │
  ├──────────────────────────┼──────────────────────────────┤
  │ #108 Sorted Array → BST │ Random access → O(n) ✅       │
  │ #109 Sorted List → BST  │ No random access → inorder   │
  │ #1382 Balance a BST     │ Inorder → array → rebuild!   │
  │ Min Height BST (AE)     │ Identical to #108!           │
  │ Binary Search            │ REVERSE: find vs build      │
  │ Merge Sort build         │ Same recursion structure!    │
  └──────────────────────────┴──────────────────────────────┘

  KEY INSIGHT: Binary Search và Build BST là 2 MẶT
  của CÙNG 1 đồng xu — chia đôi sorted data!
  
  RECURSION STRUCTURE COMPARISON:
  
  Merge Sort:  split → recurse → COMBINE (merge)
  Build BST:   pick mid → recurse → COMBINE (attach children)
  Binary Search: pick mid → recurse ONE SIDE
  
  → Build BST = Merge Sort WITHOUT the merge step!
```

---

### 📌 Khi bạn BÍ — Emergency Phrases

```
KHI ĐANG NGHĨ:
═══════════════════════════════════════════════════════════════

  🎙️ "The array is sorted... that reminds me of 
      Binary Search. What if I apply the same 
      divide-and-conquer strategy?"
  🎙️ "If I pick the middle element as root, the left
      half is all smaller, right half all larger...
      that's a BST by definition!"
  🎙️ "To guarantee balance, I need roughly equal
      elements on each side... middle gives me that!"

KHI CODE BỊ KẸT:
═══════════════════════════════════════════════════════════════

  "start > end hay start >= end?"
  → start > end! Vì start=end = 1 element = cần xử lý!
  
  "Slice hay index?"
  → Index! Slice = O(n) mỗi lần → O(n log n) total!
  
  "Floor hay ceil?"
  → Cả 2 đều hợp lệ! Floor = convention phổ biến.
  
  "mid-1 hay mid?"
  → mid-1 và mid+1! Loại mid khỏi cả 2 nửa!
```

---

## 📊 VISUAL SUMMARY — Cheat Sheet

```
═══════════════════════════════════════════════════════════════
    CONVERT SORTED ARRAY TO BST #108 — CHEAT SHEET
═══════════════════════════════════════════════════════════════

📌 BÀI TOÁN: Sorted array → height-balanced BST
📌 PATTERN:  Divide & Conquer (pick middle = root)
📌 TRICK:    Reverse Binary Search — build thay vì tìm!

═══════════════════════════════════════════════════════════════

📌 ALGORITHM (6 bước):
  1. if (start > end) return null;
  2. mid = floor((start + end) / 2)
  3. node = new TreeNode(nums[mid])
  4. node.left = build(start, mid - 1)
  5. node.right = build(mid + 1, end)
  6. return node

═══════════════════════════════════════════════════════════════

📌 KEY INSIGHT:
  Sorted + pick middle = BST automatically!
  Left half < middle < Right half = BST property!
  Left/Right sizes differ ≤ 1 = balanced!

═══════════════════════════════════════════════════════════════

📌 COMPLEXITY:
  Time:  O(n) — create n nodes ✅
  Space: O(n) output + O(log n) stack
  Optimal? YES — must create n nodes!

📌 TRAPS:
  ❌ Array.slice → O(n log n)
  ❌ start >= end → miss single element
  ❌ build(start, mid) → infinite loop
  ❌ (start + end) overflow → use start + (end-start)/2

📌 FOLLOW-UPS:
  → Sorted linked list? Inorder simulation #109
  → Not sorted? Sort first O(n log n)
  → Iterative? Queue-based BFS construction
  → Multiple answers? floor vs ceil for mid

═══════════════════════════════════════════════════════════════
```
