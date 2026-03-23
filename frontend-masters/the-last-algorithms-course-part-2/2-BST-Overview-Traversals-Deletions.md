# The Last Algorithms Course You'll Want (Part 2) — Phần 2: Binary Search Tree — Overview, Traversals, Deletions & Insertions

> 📅 2026-03-09 · ⏱ 45 phút đọc
>
> Nguồn: Frontend Masters — ThePrimeagen
> Bài: BST Overview + Traversals + Deletions & Insertions — "Full/Complete/Partial tree, logarithmic search, in-order sorted, 3 deletion cases, in-order successor/predecessor, degenerate tree = linked list!"
> Độ khó: ⭐⭐⭐ | Intermediate — Nền tảng cho AVL, Red-Black Tree!

---

## Mục Lục

| #   | Phần                                                                |
| --- | ------------------------------------------------------------------- |
| 1   | Binary Tree vs BST — "Full, Complete, Partial!"                     |
| 2   | BST Rule — "Left < Node < Right, ALWAYS!"                           |
| 3   | BST Search — "Logarithmic, Cut Half Each Step!"                     |
| 4   | Traversals — "Pre-order, In-order, Post-order!"                     |
| 5   | In-Order = Sorted — "That's Where the Name Comes From!"             |
| 6   | Tree Terminology — "Root, Parent, Uncle, Siblings!"                 |
| 7   | Deletion Case 1 — "No Children = Just Delete!"                      |
| 8   | Deletion Case 2 — "One Child = Promote Child!"                      |
| 9   | Deletion Case 3 — "Two Children = In-Order Successor/Predecessor!"  |
| 10  | Insertion — "Simple But Can Degenerate!"                            |
| 11  | Degenerate Tree — "Congratulations, You Built a Linked List!"       |
| 12  | Tự Code: BST Engine from Scratch (Search, Insert, Delete, Traverse) |
| 13  | Deep Dive: Tại Sao BST Deletion Là Nền Tảng Cho Mọi Thứ             |

---

## §1. Binary Tree vs BST — "Full, Complete, Partial!"

> Prime: _"If you're not familiar with binary trees, either you have zero children, one child, or two children, that is it."_

```
BINARY TREE — 3 LOẠI:
═══════════════════════════════════════════════════════════════

  1. FULL BINARY TREE (Đầy đủ nhất!):
  ─────────────────────────────────────
  "Every single possible node has two children
   and it is perfectly in, no extra levels.
   The levels completely filled." — Prime

          ●              ← Mọi node có ĐÚNG 2 con!
        /   \            ← Mọi level ĐẦY!
       ●     ●           ← Không thừa, không thiếu!
      / \   / \
     ●   ● ●   ●


  2. COMPLETE BINARY TREE (Hoàn chỉnh):
  ─────────────────────────────────────
  "A complete binary tree simply means that
   every single node has its max children." — Prime

          ●              ← Mọi node có MAX children!
        /   \
       ●     ●           ← Nhưng có thể thiếu level cuối!
      / \
     ●   ●

  ⚠️ "Kind of odd that a partial complete can have
      more nodes. Where a complete binary tree will
      have less nodes." — Prime


  3. PARTIAL COMPLETE BINARY TREE:
  ─────────────────────────────────────
  "If you have one missing this is called
   a partial complete binary tree." — Prime

          ●
        /   \
       ●     ●           ← Có node thiếu con!
      / \   /
     ●   ● ●             ← Không đầy ở level cuối!
```

### So Sánh Chi Tiết:

```
SO SÁNH 3 LOẠI:
═══════════════════════════════════════════════════════════════

  Loại              │ Mọi node │ Level cuối │ Số nodes
  ──────────────────┼──────────┼────────────┼──────────
  Full              │ 0 or 2   │ Đầy!       │ 2^h - 1
  Complete          │ Max      │ Có thể ≤   │ ≤ 2^h - 1
  Partial Complete  │ 0,1 or 2 │ Thiếu      │ Bất kỳ

  Full binary tree height h=3:
  → Nodes = 2³ - 1 = 7 nodes! (perfect!)

  "Full being the greatest binary tree possible." — Prime
```

---

## §2. BST Rule — "Left < Node < Right, ALWAYS!"

> Prime: _"On this side of the binary tree, everything is going to be less than whatever is in the middle. On this side, everything is going to be greater than."_

```
BST FUNDAMENTAL RULE:
═══════════════════════════════════════════════════════════════

  Tại MỌI node:
          Z
        /   \
       X     Y
       ↑     ↑
   X < Z   Y > Z

  → TẤT CẢ nodes bên TRÁI < node hiện tại!
  → TẤT CẢ nodes bên PHẢI > node hiện tại!
  → Không chỉ children trực tiếp — MỌI subtree!

  "The rest of the course will make literally no sense
   for the next two to three hours if you don't have
   this rule in your head." — Prime


  VÍ DỤ:
          10
        /    \
       8     20
      / \
     3   9

  ✅ 8 < 10 (left child < parent!)
  ✅ 20 > 10 (right child > parent!)
  ✅ 3 < 8 (left child < parent!)
  ✅ 9 > 8 BUT 9 < 10 (subtree rule!)
     → 9 ở bên trái của 10 → PHẢI < 10! ✅

  ❌ NẾU thay 3 = 28:
          10
        /    \
      8      20
     / \
   28   9     ← 28 > 8 → SAI! Phải ở bên phải 8!
              ← 28 > 10 → SAI! Phải ở bên phải 10!

  "Any sub tree has to follow the rules of its parents."
  — Prime

  "If 3 was 28, we would have a very lovely binary tree.
   It just wouldn't be a binary search tree." — Prime
```

### Duplicates:

```
DUPLICATES TRONG BST:
═══════════════════════════════════════════════════════════════

  "You CAN have duplicates, and there are algorithms
   that talk about having duplicates. But in general,
   when people are teaching, we never put duplicates." — Prime

  Common approaches:
  ├── Không cho duplicate (simplest!)
  ├── Duplicate đi bên trái (convention!)
  ├── Duplicate đi bên phải (also valid!)
  └── Node chứa count (best for practice!)

  "There are things with B+ trees in which there are
   duplicates, and there are certain ways you move
   things around." — Prime
```

---

## §3. BST Search — "Logarithmic, Cut Half Each Step!"

> Prime: _"Half of the binary tree just became completely invalid. We don't even have to look at that entire half side."_

```
BST SEARCH — STEP BY STEP:
═══════════════════════════════════════════════════════════════

  Tree:
          10
        /    \
       8     20
      / \   /  \
     3   9 15  25

  Tìm 15:

  Step 1: start at root (10)
  → 15 > 10 → go RIGHT!
  → LOẠI BỎ toàn bộ nửa trái! (8, 3, 9 = gone!)

          10
            \
             20         ← Chỉ cần xét nửa này!
            /  \
          15    25

  Step 2: at node 20
  → 15 < 20 → go LEFT!
  → LOẠI BỎ nửa phải! (25 = gone!)

             20
            /
          15            ← Chỉ cần xét nửa này!

  Step 3: at node 15
  → 15 == 15 → FOUND! ✅

  7 nodes, 3 checks! ← O(log n)!


TIME COMPLEXITY:
═══════════════════════════════════════════════════════════════

  "Even though there are seven unique values,
   it took us three checks to get to this point." — Prime

  Full binary tree:
  ┌─────────┬───────────┬────────────┐
  │ Nodes   │ Height    │ Max checks │
  ├─────────┼───────────┼────────────┤
  │ 7       │ 3         │ 3          │
  │ 15      │ 4         │ 4          │
  │ 31      │ 5         │ 5          │
  │ 63      │ 6         │ 6          │
  │ 1023    │ 10        │ 10         │
  │ 1048575 │ 20        │ 20         │
  └─────────┴───────────┴────────────┘

  "When we double the amount of nodes by having one more
   row, we can still do that cutting out in a really fast
   space. It only takes four checks for 15 nodes. It just
   grows really slow." — Prime

  Growth = LOGARITHMIC!
  → Search = O(log n) ← balanced tree!
  → Search = O(h) ← general — h = height!

  "Another way to put it, is that it takes the height
   of the tree amount of searching to find a node." — Prime
```

---

## §4. Traversals — "Pre-order, In-order, Post-order!"

> Prime: _"There's really just three operations you do in any search in a binary tree: go down the left, go down the right, or visit the node."_

```
3 TRAVERSAL TYPES:
═══════════════════════════════════════════════════════════════

  Tree:
          20
        /    \
       10    25
      / \   /  \
     3  15 23  27

  3 operations tại mỗi node:
  ├── Go LEFT (đi xuống trái!)
  ├── Go RIGHT (đi xuống phải!)
  └── VISIT (thêm vào kết quả!)

  Sự khác biệt = THỨ TỰ của VISIT!
```

### Post-order (Left → Right → Visit):

```
POST-ORDER: ĐI TRÁI → ĐI PHẢI → THĂM!
═══════════════════════════════════════════════════════════════

  Tree:
          20
        /    \
       10    25
      / \   /  \
     3  15 23  27

  Walkthrough:
  1. Start at 20 → go LEFT first!
  2. At 10 → go LEFT!
  3. At 3 → go LEFT (nothing!) → go RIGHT (nothing!)
     → VISIT 3! ✅ [3]

  4. Back at 10 → already went LEFT
     → go RIGHT → at 15 → LEFT (nothing!) → RIGHT (nothing!)
     → VISIT 15! ✅ [3, 15]

  5. Back at 10 → went LEFT ✓, went RIGHT ✓
     → VISIT 10! ✅ [3, 15, 10]

  6. Back at 20 → went LEFT ✓ → go RIGHT!
  7. At 25 → go LEFT → at 23 → L(∅) → R(∅)
     → VISIT 23! ✅ [3, 15, 10, 23]

  8. Back at 25 → go RIGHT → at 27 → L(∅) → R(∅)
     → VISIT 27! ✅ [3, 15, 10, 23, 27]

  9. Back at 25 → L ✓, R ✓
     → VISIT 25! ✅ [3, 15, 10, 23, 27, 25]

  10. Back at 20 → L ✓, R ✓
      → VISIT 20! ✅ [3, 15, 10, 23, 27, 25, 20]

  Result: [3, 15, 10, 23, 27, 25, 20]
  → Leaves first, root LAST!
  → "We visit last. This is called post-order." — Prime
```

### In-order (Left → Visit → Right):

```
IN-ORDER: ĐI TRÁI → THĂM → ĐI PHẢI!
═══════════════════════════════════════════════════════════════

  Tree:
          20
        /    \
       10    25
      / \   /  \
     3  15 23  27

  Walkthrough:
  1. Start at 20 → go LEFT!
  2. At 10 → go LEFT!
  3. At 3 → go LEFT (nothing!)
     → VISIT 3! ✅ [3]
     → go RIGHT (nothing!)

  4. Back at 10 → already went LEFT
     → VISIT 10! ✅ [3, 10]
     → go RIGHT → at 15 → L(∅)
     → VISIT 15! ✅ [3, 10, 15]
     → R(∅)

  5. Back at 20 → went LEFT ✓
     → VISIT 20! ✅ [3, 10, 15, 20]
     → go RIGHT!

  6. At 25 → go LEFT → at 23 → L(∅)
     → VISIT 23! ✅ [3, 10, 15, 20, 23]
     → R(∅)

  7. Back at 25
     → VISIT 25! ✅ [3, 10, 15, 20, 23, 25]
     → go RIGHT → at 27 → L(∅)
     → VISIT 27! ✅ [3, 10, 15, 20, 23, 25, 27]

  Result: [3, 10, 15, 20, 23, 25, 27]
  → SORTED! 🎯

  "Notice what happened with our numbers.
   Our numbers are in-order!" — Prime

  "If you have a binary search tree, it produces in order.
   You wanna guess where they got the term in-order
   traversal from?" — Prime 😂
```

### Pre-order (Visit → Left → Right):

```
PRE-ORDER: THĂM → ĐI TRÁI → ĐI PHẢI!
═══════════════════════════════════════════════════════════════

  Tree:
          20
        /    \
       10    25
      / \   /  \
     3  15 23  27

  Result: [20, 10, 3, 15, 25, 23, 27]
  → Root FIRST, then depth-first left, then right!

  "We're not gonna do pre-order traversal.
   I don't know any applications for pre-order,
   I just know it exists." — Prime 😂

  Thực tế pre-order hữu ích cho:
  → Serialize/deserialize tree!
  → Copy tree structure!
  → Print tree hierarchy (like file system!)
```

### Tại Sao In-Order = Sorted?

```
TẠI SAO IN-ORDER = SORTED?
═══════════════════════════════════════════════════════════════

  BST Rule: Left < Node < Right

  In-order: go LEFT → VISIT → go RIGHT

  → Luôn đi TRÁI đến hết (tìm node NHỎ NHẤT!)
  → Rồi thăm node (node tiếp theo lớn hơn!)
  → Rồi đi PHẢI (tìm node LỚN HƠN tiếp theo!)

  → Kết quả: từ NHỎ → LỚN = SORTED!

  Chứng minh bằng induction:
  1. Node nhỏ nhất = leftmost leaf → thăm đầu tiên! ✅
  2. Mỗi node thăm SAU khi toàn bộ subtree trái
     → tất cả giá trị nhỏ hơn đã được thăm! ✅
  3. Mỗi node thăm TRƯỚC subtree phải
     → tất cả giá trị lớn hơn chưa thăm! ✅
  → Output = sorted! QED! 🎯
```

---

## §5. Tree Terminology — "Root, Parent, Uncle, Siblings!"

> Prime: _"They describe it in familial terms. So it kind of mostly makes sense because we all understand a family."_

```
TREE TERMINOLOGY — GIA ĐÌNH CÂY:
═══════════════════════════════════════════════════════════════

  Tree:
          [Root]
         /      \
     [Parent]  [Uncle]
      /    \
  [Child] [Sibling]
     ↑       ↑
  "Children"  "Same level, same parent"


  Root:
  → Node cao nhất! Không có parent!
  → "This is just a node, no special designation." — Prime
  → "If you think about it, this [any node] is a root.
     It is the root of a subtree." — Prime

  Parent:
  → Node có children!

  Children:
  → Nodes connected bên dưới!

  Siblings:
  → "Same level, same parent child." — Prime

  Uncle:
  → Sibling của parent!

  Subtree:
  → Bất kỳ node nào + toàn bộ descendants = subtree!
  → "They're all the same thing." — Prime


  ⚠️ DIRECTED:
  "Typically people think of this as directed,
   meaning you never traverse back up a tree.
   You let recursion do the recusing back up." — Prime
```

---

## §6. Deletion Case 1 — "No Children = Just Delete!"

> Prime: _"There is no special handling required. When I delete this, well, it's just gone, there's no adjusting."_

```
DELETION CASE 1: LEAF NODE (no children!)
═══════════════════════════════════════════════════════════════

  TRƯỚC:
          10
        /    \
       8     20
      / \
     3   9   ← Delete 9!

  SAU:
          10
        /    \
       8     20
      /
     3       ← 9 gone! Nothing to adjust!

  Algorithm:
  1. Tìm node cần xoá (search!)
  2. Node không có children? → Simply delete!
  3. Set parent's pointer to null!
  4. Garbage collect the node!

  "Just simply delete the link and whatever reclamation
   you have to do for your node." — Prime

  "If this is Rust, it drops it automatically.
   If it's JavaScript, you'll collect it later with
   a nice garbage collection halt." — Prime
```

---

## §7. Deletion Case 2 — "One Child = Promote Child!"

> Prime: _"You erase, erase, down. It's pretty much straightforward when you only have one child."_

```
DELETION CASE 2: ONE CHILD
═══════════════════════════════════════════════════════════════

  General case — Delete A (has one child B!):

  TRƯỚC:                    SAU:
        X                         X
         \                         \
          A   ← DELETE!             B
         /                        / \
        B                       BL   BR
       / \
      BL   BR

  TẠI SAO ĐÚNG?

  Reasoning bằng BST rule:
  → BL < B (left subtree of B!)
  → BR > B (right subtree of B!)
  → B < A (B ở bên trái A!)
  → A > X (A ở bên phải X!)
  → Vì B < A và A > X → B > X! ✅
  → BL < B < A → BL > X! ✅
  → BR > B nhưng BR < A → BR > X! ✅

  → Toàn bộ subtree B vẫn hợp lệ khi promote lên! ✅

  "We don't have to move any of these nodes around.
   We know they're all still upholding the rules
   of a binary search tree." — Prime

  Algorithm:
  1. Tìm node A cần xoá!
  2. A có đúng 1 child (B)!
  3. Parent của A trỏ tới B thay vì A!
  4. Delete A!
  → B + toàn bộ subtree tự động maintain BST rule! ✅
```

---

## §8. Deletion Case 3 — "Two Children = In-Order Successor/Predecessor!"

> Prime: _"Kind of like the three-body problem, but not as long of a book."_ 😂

Đây là case phức tạp nhất và là **nền tảng** cho mọi balanced tree operation.

### In-Order Successor & Predecessor:

```
IN-ORDER SUCCESSOR & PREDECESSOR:
═══════════════════════════════════════════════════════════════

  Ví dụ in-order traversal:
  ... 10, 20, 30, ...

  Với node 20:
  → In-order PREDECESSOR = 10 (trước nó!)
  → In-order SUCCESSOR = 30 (sau nó!)

  Cách tìm:
  ┌──────────────────────────────────────────────────┐
  │ In-order SUCCESSOR:                              │
  │ → Đi PHẢI 1 bước                                │
  │ → Rồi đi TRÁI cho đến hết!                      │
  │ = Node NHỎ nhất trong subtree PHẢI!              │
  │                                                   │
  │ In-order PREDECESSOR:                            │
  │ → Đi TRÁI 1 bước                                │
  │ → Rồi đi PHẢI cho đến hết!                      │
  │ = Node LỚN nhất trong subtree TRÁI!              │
  └──────────────────────────────────────────────────┘

  "If we go to A and want to find the in-order successor,
   we go to the right and then find the smallest child
   in the larger hand branch." — Prime

  "The predecessor would be going to the left and then
   finding the largest item within the left branch." — Prime
```

### Deletion Algorithm:

```
DELETION CASE 3: TWO CHILDREN
═══════════════════════════════════════════════════════════════

  TRƯỚC — Delete A (has 2 children!):
            A       ← DELETE THIS!
          /   \
         B     C
        / \   / \
       BL BR CL  CR

  STRATEGY: Thay A bằng in-order predecessor HOẶC successor!
  (Chọn 1 trong 2, đều đúng!)

  ═══ Dùng IN-ORDER PREDECESSOR (largest in left subtree): ═══

  Step 1: Từ A, đi TRÁI → đến B
  Step 2: Từ B, đi PHẢI cho đến hết → tìm node LỚN NHẤT
          = "CL's left largest" hay node cuối bên phải của B

  Step 3: Swap node đó với A!
  Step 4: Giờ A ở vị trí mới → trở thành Case 1 hoặc Case 2!
  Step 5: Delete A (dễ rồi!)


  VÍ DỤ CỤ THỂ:
  TRƯỚC — Delete 100:
          100       ← DELETE!
         /    \
        50     ...
         \
         60
           \
           70
          /
        65

  Step 1: Đi trái → 50
  Step 2: Đi phải hết → 50 → 60 → 70 (hết!)
          → In-order predecessor = 70!

  Step 3: Swap 70 lên vị trí 100:
          70        ← PROMOTED!
         /    \
        50     ...
         \
         60
           \
          100      ← A giờ ở đây!
          /
        65

  Step 4: Delete 100 → Case 2! (có 1 child = 65!)
          → Promote 65 lên thay 100!

  KẾT QUẢ CUỐI:
          70
         /    \
        50     ...
         \
         60
           \
          65

  ✅ 65 < 70 (vì 65 ở subtree trái của 70!)
  ✅ 65 > 60 (vì 65 ở bên phải 60!)
  ✅ BST rule maintained! 🎯
```

### Tại Sao In-Order Successor/Predecessor Hoạt Động?

```
CHỨNG MINH — TẠI SAO ĐÚNG:
═══════════════════════════════════════════════════════════════

  Dùng IN-ORDER PREDECESSOR (node lớn nhất bên trái):

  1. Nó LỚN HƠN mọi node trong subtree trái!
     → Vì nó là LARGEST trong left subtree!
     → Khi promote lên, left subtree vẫn < nó! ✅

  2. Nó NHỎ HƠN mọi node trong subtree phải!
     → Vì nó nằm trong left subtree của node gốc
     → Tất cả left < node gốc < tất cả right
     → Predecessor < node gốc < mọi node right! ✅

  "What can we say about this one? This one is smaller
   than C, it's smaller than all of C's children on
   the left because it was the smallest child on the left.
   Therefore, if it goes into this place, it 100%
   upholds this." — Prime

  "You get to choose which one you want to pick." — Prime
  → Dùng predecessor hay successor đều được!
```

---

## §9. Insertion — "Simple But Can Degenerate!"

> Prime: _"Insertion is actually rather simple."_

```
BST INSERTION — STEP BY STEP:
═══════════════════════════════════════════════════════════════

  Insert 10, 20, 30, 40:

  Insert 10:     Insert 20:     Insert 30:     Insert 40:
    10             10             10             10
                     \              \              \
                     20             20             20
                                      \              \
                                      30             30
                                                       \
                                                       40

  Algorithm:
  1. Start at root!
  2. Value < current? → go LEFT!
  3. Value > current? → go RIGHT!
  4. Arrived at null? → INSERT HERE!

  "Which direction do we go, left or right?"
  "20 is larger than 10, goes down. 30 is larger than 10,
   30 is larger than 20, goes right again." — Prime
```

---

## §10. Degenerate Tree — "Congratulations, You Built a Linked List!"

> Prime: _"What has happened to our tree? Our tree sucks! If you really think about it, we just got done writing a very complicated linked list."_

```
DEGENERATE TREE = LINKED LIST!
═══════════════════════════════════════════════════════════════

  Inserting sorted data (10, 20, 30, 40):

  10                Linked List:
    \               10 → 20 → 30 → 40
    20
      \             GIỐNG NHAU! 💀
      30
        \
        40

  Search time:
  → Balanced BST: O(log n)!
  → Degenerate BST: O(n)! ← Same as linked list!

  "Our search time is not log n, it's technically h.
   In a well balanced tree that is log n,
   but in this tree h is n. And so that totally sucks." — Prime


WHY THIS MATTERS — H vs LOG N:
═══════════════════════════════════════════════════════════════

  BST search = O(h) ← height, NOT log n!

  Balanced tree (h = log n):
  → n = 1000 → h ≈ 10 → 10 checks! ✅

  Degenerate tree (h = n):
  → n = 1000 → h = 1000 → 1000 checks! 💀

  → Same data, VASTLY different performance!
  → THIS is why we need balanced trees (AVL, Red-Black!)

  "This is the introduction to the last algorithms course
   you'll ever want because hopefully by the end of it,
   you never wanna see a whiteboard or an algorithm again
   because this is gonna get slightly complicated." — Prime 😂
```

---

## §11. Từ Code Đến Concept — "Representation Is the First Step!"

> Prime: _"For me, representation usually is the first step to understanding a problem. As long as you know what shapes you're working with, the rest isn't too hard."_

```
NODE REPRESENTATION:
═══════════════════════════════════════════════════════════════

  "First thing you gotta think of is how do you
   represent a node?" — Prime

  class Node<T> {
    left: Node<T> | null;    ← potentially null!
    right: Node<T> | null;   ← potentially null!
    value: T;                ← whatever type!
  }

  "So long as you see that, the rest should become
   more and more obvious." — Prime

  Pre-order traversal:
  function preOrder(node) {
    visit(node);              ← VISIT first!
    preOrder(node.left);      ← then LEFT!
    preOrder(node.right);     ← then RIGHT!
  }

  "It keeps on doing that, when it's done,
   you call right, you keep on doing that,
   and you're kind of done." — Prime

  "Implementing data structures become EXCESSIVELY EASY
   as opposed to really, really hard, once you make
   that jump." — Prime
```

---

## §12. Tự Code: BST Engine from Scratch

```javascript
// ═══════════════════════════════════════════════════════════
// PHẦN 1: BST NODE + CORE STRUCTURE
// ═══════════════════════════════════════════════════════════

class BSTNode {
  constructor(value) {
    this.value = value;
    this.left = null;
    this.right = null;
  }
}

class BinarySearchTree {
  constructor() {
    this.root = null;
    this.size = 0;
  }

  // ═══ INSERT — O(h) ═══
  insert(value) {
    const node = new BSTNode(value);

    if (!this.root) {
      this.root = node;
      this.size++;
      return;
    }

    let current = this.root;

    while (current) {
      if (value < current.value) {
        // Go LEFT!
        if (!current.left) {
          current.left = node;
          this.size++;
          return;
        }
        current = current.left;
      } else if (value > current.value) {
        // Go RIGHT!
        if (!current.right) {
          current.right = node;
          this.size++;
          return;
        }
        current = current.right;
      } else {
        // Duplicate! Ignore (hoặc handle tuỳ design!)
        return;
      }
    }
  }

  // ═══ SEARCH — O(h) ═══
  search(value) {
    let current = this.root;
    let steps = 0;

    while (current) {
      steps++;
      if (value === current.value) {
        return { found: true, node: current, steps };
      }
      if (value < current.value) {
        current = current.left; // Cut right half!
      } else {
        current = current.right; // Cut left half!
      }
    }

    return { found: false, node: null, steps };
  }

  // ═══ FIND MIN — đi trái cho đến hết! O(h) ═══
  _findMin(node) {
    while (node.left) {
      node = node.left;
    }
    return node;
  }

  // ═══ FIND MAX — đi phải cho đến hết! O(h) ═══
  _findMax(node) {
    while (node.right) {
      node = node.right;
    }
    return node;
  }

  // ═══ DELETE — O(h) — 3 CASES! ═══
  delete(value) {
    this.root = this._deleteRecursive(this.root, value);
  }

  _deleteRecursive(node, value) {
    if (!node) return null; // Not found!

    if (value < node.value) {
      node.left = this._deleteRecursive(node.left, value);
      return node;
    }

    if (value > node.value) {
      node.right = this._deleteRecursive(node.right, value);
      return node;
    }

    // FOUND! node.value === value!

    // ═══ CASE 1: No children (leaf!) ═══
    if (!node.left && !node.right) {
      this.size--;
      return null; // Just remove!
    }

    // ═══ CASE 2: One child ═══
    if (!node.left) {
      this.size--;
      return node.right; // Promote right child!
    }
    if (!node.right) {
      this.size--;
      return node.left; // Promote left child!
    }

    // ═══ CASE 3: Two children ═══
    // Strategy: replace with IN-ORDER PREDECESSOR!
    // (largest value in left subtree!)
    const predecessor = this._findMax(node.left);
    node.value = predecessor.value; // Swap value!
    // Delete predecessor from left subtree (Case 1 or 2!)
    node.left = this._deleteRecursive(node.left, predecessor.value);
    this.size--;
    return node;
  }
}
```

```javascript
// ═══════════════════════════════════════════════════════════
// PHẦN 2: TRAVERSALS (cả 3 loại + BFS!)
// ═══════════════════════════════════════════════════════════

// Thêm vào class BinarySearchTree:

// ═══ PRE-ORDER: Visit → Left → Right ═══
function preOrder(node, result = []) {
  if (!node) return result;
  result.push(node.value); // ← VISIT TRƯỚC!
  preOrder(node.left, result);
  preOrder(node.right, result);
  return result;
}

// ═══ IN-ORDER: Left → Visit → Right (SORTED!) ═══
function inOrder(node, result = []) {
  if (!node) return result;
  inOrder(node.left, result);
  result.push(node.value); // ← VISIT Ở GIỮA!
  inOrder(node.right, result);
  return result;
}

// ═══ POST-ORDER: Left → Right → Visit ═══
function postOrder(node, result = []) {
  if (!node) return result;
  postOrder(node.left, result);
  postOrder(node.right, result);
  result.push(node.value); // ← VISIT CUỐI!
  return result;
}

// ═══ LEVEL-ORDER (BFS — dùng Queue!) ═══
function levelOrder(root) {
  if (!root) return [];
  const result = [];
  const queue = [root];

  while (queue.length > 0) {
    const node = queue.shift();
    result.push(node.value);
    if (node.left) queue.push(node.left);
    if (node.right) queue.push(node.right);
  }
  return result;
}

// ═══ Demo traversals ═══
const bst = new BinarySearchTree();
[20, 10, 25, 3, 15, 23, 27].forEach((v) => bst.insert(v));

console.log("Pre-order:", preOrder(bst.root));
// [20, 10, 3, 15, 25, 23, 27]

console.log("In-order:", inOrder(bst.root));
// [3, 10, 15, 20, 23, 25, 27] ← SORTED! ✅

console.log("Post-order:", postOrder(bst.root));
// [3, 15, 10, 23, 27, 25, 20]

console.log("Level-order:", levelOrder(bst.root));
// [20, 10, 25, 3, 15, 23, 27]
```

```javascript
// ═══════════════════════════════════════════════════════════
// PHẦN 3: DELETION DEMO — ALL 3 CASES!
// ═══════════════════════════════════════════════════════════

const tree = new BinarySearchTree();
[50, 30, 70, 20, 40, 60, 80, 35, 45, 65, 75].forEach((v) => tree.insert(v));

//          50
//        /    \
//      30      70
//     / \     / \
//   20  40  60  80
//       /\   \  /
//     35 45  65 75

console.log("Before:", inOrder(tree.root));
// [20, 30, 35, 40, 45, 50, 60, 65, 70, 75, 80]

// Case 1: Delete leaf (20 — no children!)
tree.delete(20);
console.log("After delete 20 (leaf):", inOrder(tree.root));
// [30, 35, 40, 45, 50, 60, 65, 70, 75, 80] ✅

// Case 2: Delete node with 1 child (60 — has right child 65!)
tree.delete(60);
console.log("After delete 60 (1 child):", inOrder(tree.root));
// [30, 35, 40, 45, 50, 65, 70, 75, 80] ✅

// Case 3: Delete node with 2 children (50 — root!)
tree.delete(50);
console.log("After delete 50 (2 children):", inOrder(tree.root));
// [30, 35, 40, 45, 65, 70, 75, 80] ✅
// 45 hoặc 65 replace 50 (predecessor hoặc successor!)
```

```javascript
// ═══════════════════════════════════════════════════════════
// PHẦN 4: BST UTILITIES (height, balance, validate!)
// ═══════════════════════════════════════════════════════════

// ═══ HEIGHT — O(n) ═══
function treeHeight(node) {
  if (!node) return 0;
  return 1 + Math.max(treeHeight(node.left), treeHeight(node.right));
}

// ═══ IS BALANCED — O(n) ═══
function isBalanced(node) {
  if (!node) return true;
  const leftH = treeHeight(node.left);
  const rightH = treeHeight(node.right);
  // Balanced = height difference <= 1 tại MỌI node!
  return (
    Math.abs(leftH - rightH) <= 1 &&
    isBalanced(node.left) &&
    isBalanced(node.right)
  );
}

// ═══ VALIDATE BST — O(n) ═══
function isValidBST(node, min = -Infinity, max = Infinity) {
  if (!node) return true;
  if (node.value <= min || node.value >= max) return false;
  return (
    isValidBST(node.left, min, node.value) &&
    isValidBST(node.right, node.value, max)
  );
}

// ═══ VISUAL PRINT — debug! ═══
function printTree(node, prefix = "", isLeft = true) {
  if (!node) return;
  printTree(node.right, prefix + (isLeft ? "│   " : "    "), false);
  console.log(prefix + (isLeft ? "└── " : "┌── ") + node.value);
  printTree(node.left, prefix + (isLeft ? "    " : "│   "), true);
}

// ═══ DEGENERATE TREE DEMO ═══
const degenerate = new BinarySearchTree();
[10, 20, 30, 40, 50].forEach((v) => degenerate.insert(v));

console.log("Height:", treeHeight(degenerate.root)); // 5 (= n!)
console.log("Balanced:", isBalanced(degenerate.root)); // false!
console.log("Valid BST:", isValidBST(degenerate.root)); // true!

// Search comparison:
const balanced = new BinarySearchTree();
[30, 20, 40, 10, 25, 35, 50].forEach((v) => balanced.insert(v));

console.log("Balanced search for 50:", balanced.search(50));
// { found: true, steps: 3 } ← O(log n)!

console.log("Degenerate search for 50:", degenerate.search(50));
// { found: true, steps: 5 } ← O(n)!

// "Our search time is not log n, it's technically h." — Prime
```

```javascript
// ═══════════════════════════════════════════════════════════
// PHẦN 5: IN-ORDER SUCCESSOR & PREDECESSOR FINDER
// ═══════════════════════════════════════════════════════════

// Tìm in-order successor:
// → Đi phải 1 bước, rồi trái hết!
function inOrderSuccessor(node) {
  if (!node || !node.right) return null;
  let current = node.right;
  while (current.left) {
    current = current.left;
  }
  return current;
}

// Tìm in-order predecessor:
// → Đi trái 1 bước, rồi phải hết!
function inOrderPredecessor(node) {
  if (!node || !node.left) return null;
  let current = node.left;
  while (current.right) {
    current = current.right;
  }
  return current;
}

// Demo:
const demo = new BinarySearchTree();
[50, 30, 70, 20, 40, 60, 80].forEach((v) => demo.insert(v));

//        50
//      /    \
//    30      70
//   / \     / \
//  20  40  60  80

const node50 = demo.root; // value = 50
console.log("Successor of 50:", inOrderSuccessor(node50).value);
// → 60 (go right to 70, then left to 60!)

console.log("Predecessor of 50:", inOrderPredecessor(node50).value);
// → 40 (go left to 30, then right to 40!)

// In-order: [20, 30, 40, **50**, 60, 70, 80]
//                         ↑
//               predecessor=40, successor=60!
```

---

## §13. Deep Dive: Tại Sao BST Deletion Là Nền Tảng Cho Mọi Thứ

### "This Is Where Things Get Intense"

Prime bắt đầu với deletion thay vì insertion vì lý do sư phạm:

> _"That is why I actually started with deletion as opposed to insertion, cuz insertion is actually rather simple."_

Deletion là nền tảng vì:

1. **AVL Tree rotations** — khi delete làm cây mất cân bằng, cần rotate!
2. **Red-Black Tree recoloring** — deletion trigger recoloring cascade!
3. **B-Tree merge/borrow** — deletion có thể underflow node!
4. **Heap extract** — remove root = phức tạp nhất!

### Từ BST Đến "Trees That Don't Suck"

```
BST PROBLEM → BALANCED TREE SOLUTIONS:
═══════════════════════════════════════════════════════════════

  Problem: BST CÓ THỂ degenerate thành linked list!
  → Insert sorted data? → Linked list! O(n) search! 💀

  Solutions (TẤT CẢ dựa trên BST deletion + insertion!):

  1. AVL TREE:
     → Self-balancing BST!
     → After insert/delete → check balance factor!
     → If |leftH - rightH| > 1 → ROTATE!
     → Guaranteed O(log n)! ✅

  2. RED-BLACK TREE:
     → Self-balancing BST!
     → Each node has COLOR (red/black!)
     → Rules ensure balance!
     → Used in: Java TreeMap, C++ std::map!

  3. B-TREE / B+ TREE:
     → Multi-way search tree!
     → Not binary (can have many children!)
     → Used in: databases, file systems!
     → "There are things with B+ trees in which
        there are duplicates." — Prime

  4. SPLAY TREE:
     → Self-adjusting BST!
     → Recently accessed nodes move to root!
     → Amortized O(log n)!

  → TẤT CẢ require understanding BST fundamentals!
  → TẤT CẢ build on Case 3 deletion logic!
```

### DOM = Just a Tree!

> _"Once you understand that, all of a sudden the DOM becomes a little bit easier."_ — Prime

```
DOM AS A TREE:
═══════════════════════════════════════════════════════════════

  HTML:
  <html>
    <head>
      <title>My Page</title>
    </head>
    <body>
      <div>
        <p>Hello</p>
        <p>World</p>
      </div>
    </body>
  </html>

  Tree:
       html
      /    \
   head    body
    |       |
   title   div
            / \
           p   p

  → Đây là GENERAL tree (nhiều children!)
  → Không phải BST (không có ordering rule!)
  → Nhưng traversal concepts GIỐNG NHAU!
  → DOM walking = tree traversal!

  "That's what the DOM is, it's just a tree
   with a bunch of children." — Prime
```

---

## Checklist

```
[ ] Binary tree: 0, 1, or 2 children! Full vs Complete vs Partial!
[ ] BST Rule: LEFT < NODE < RIGHT (always, all subtrees!)
[ ] BST Search: O(h) — balanced = O(log n), degenerate = O(n)!
[ ] "Half the tree becomes completely invalid" each step!
[ ] 3 Traversals: Pre(V→L→R), In(L→V→R), Post(L→R→V)!
[ ] In-order BST = SORTED output! "That's where the name comes from!"
[ ] Tree terms: root, parent, children, siblings, uncle!
[ ] "Root is just a node, no special designation" — Prime
[ ] Delete Case 1: Leaf → just remove!
[ ] Delete Case 2: One child → promote child!
[ ] Delete Case 3: Two children → in-order successor/predecessor!
[ ] In-order successor: go right, then left until end!
[ ] In-order predecessor: go left, then right until end!
[ ] "Reduces down to Case 1 or Case 2" after swap!
[ ] Insertion: simple binary search to find spot!
[ ] Degenerate tree: "We just built a linked list!" — Prime
[ ] h vs log n: "Search is technically h, not log n" — Prime
[ ] "Representation is the first step to understanding" — Prime
TIẾP THEO → Phần 3: [Self-Balancing Trees]!
```
