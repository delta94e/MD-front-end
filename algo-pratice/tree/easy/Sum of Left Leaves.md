# 🍃 Sum of Left Leaves — LeetCode #404 (Easy)

> 📖 Code: [Sum of Left Leaves.js](./Sum%20of%20Left%20Leaves.js)

---

## R — Repeat & Clarify

🧠 *"Left LEAF, không phải left node! Leaf = no children. CHA phải check, node KHÔNG tự biết mình left/right!"*

> 🎙️ *"I need to find the sum of all LEFT LEAVES. A left leaf is a leaf node that is the LEFT child of its parent."*

> 🎙️ *"Important distinction: a LEFT NODE is any node that is a left child. A LEFT LEAF is a left node that has NO children. I only want leaves, not internal left nodes."*

---

## E — Examples

```
VÍ DỤ 1:
     3
    / \
   9  20       Left leaves: 9 (left child of 3, no children ✅)
      / \                  15 (left child of 20, no children ✅)
     15  7     
               Right leaf 7: leaf nhưng là RIGHT → SKIP!
               Sum = 9 + 15 = 24

VÍ DỤ 2:
     1         No children → root is NOT a left leaf!
               Sum = 0

VÍ DỤ 3:
     1
    /          Node 2 is left child BUT has child 3 → NOT a leaf!
   2           Node 3 is left child AND has no children → left leaf!
  /
 3             Sum = 3
```

---

## A — Approach

> 🎙️ *"The key insight: a node CANNOT know if it's a left or right child. Only its PARENT knows! So at each node, I check: 'Is my LEFT child a leaf?' If yes, add its value."*

```
TẠI SAO CHA PHẢI CHECK?

  Node structure: { val, left, right }
  → Không có field "isLeftChild"!
  → CHA biết root.left = left child
  → Node 9 không biết mình là "left" hay "right"!

  Vậy CHA phải hỏi:
  "Con trái của tôi (root.left) có phải LEAF không?"
  LEAF = root.left.left === null && root.left.right === null
```

---

## C — Code

```javascript
function sumOfLeftLeaves(root) {
  if (!root) return 0;
  let sum = 0;
  
  // Con trái là LEAF?
  if (root.left && !root.left.left && !root.left.right) {
    sum += root.left.val;           // YES → add value!
  } else {
    sum += sumOfLeftLeaves(root.left);   // NO → recurse!
  }
  
  sum += sumOfLeftLeaves(root.right);    // Always recurse right!
  return sum;
}
```

> 🎙️ *"Alternative: pass an `isLeft` flag to simplify:*
> ```javascript
> function sumOfLeftLeaves(root) {
>   let sum = 0;
>   function dfs(node, isLeft) {
>     if (!node) return;
>     if (!node.left && !node.right && isLeft) {
>       sum += node.val;  // left leaf!
>       return;
>     }
>     dfs(node.left, true);    // going LEFT
>     dfs(node.right, false);   // going RIGHT
>   }
>   dfs(root, false);
>   return sum;
> }
> ```
> *The flag approach is cleaner — each node knows if it's a left child."*

### Trace:

```
     3
    / \
   9  20
      / \
     15  7

  sumOfLeftLeaves(3):
    root.left=9: leaf? 9.left=null, 9.right=null → YES! sum += 9
    sumOfLeftLeaves(20):
      root.left=15: leaf? 15.left=null, 15.right=null → YES! sum += 15
      sumOfLeftLeaves(7): root.left=null → sum += 0
    Sum = 9 + 15 = 24 ✅
```

---

## T — Test

| Test | Input | Expected | Trap |
|---|---|---|---|
| Normal | `[3,9,20,null,null,15,7]` | 24 | Main case |
| Single | `[1]` | **0** | ⚠️ Root is NOT a left leaf! |
| All left | `[1,2,null,3]` | 3 | Only deepest is leaf |
| Right leaf | `[1,null,2]` | 0 | Right leaf doesn't count! |

---

## O — Optimize

```
Time:  O(n) — visit each node once
Space: O(h) — recursion stack
```

---

## 🗣️ Interview Script

> 🎙️ *"A node can't know if it's a left or right child — the parent must check. At each node, I check if root.left is a leaf (both children null). If yes, add its value directly. If not, recurse into it. Always recurse into right subtree. O(n) time."*

### Pattern

```
PARENT-CHECKS-CHILD PATTERN:
═══════════════════════════════════════════════════════════════

  Khi nào dùng? Khi node KHÔNG TỰ BIẾT thuộc tính từ CHA!
  
  ┌────────────────────────┬──────────────────────────────┐
  │ Problem                │ Parent checks what?          │
  ├────────────────────────┼──────────────────────────────┤
  │ #404 Sum Left Leaves   │ Is my left child a leaf?     │
  │ #1469 Lonely Nodes     │ Do I have exactly 1 child?   │
  │ Right Side View        │ Is this the last node in     │
  │                        │ the level?                   │
  └────────────────────────┴──────────────────────────────┘
  
  Alternative: Pass flag (isLeft, isRight, depth...)
```
