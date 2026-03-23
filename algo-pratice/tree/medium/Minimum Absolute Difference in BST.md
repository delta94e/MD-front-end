# 📏 Minimum Absolute Difference in BST — LeetCode #530 (Medium)

> 📖 Code: [Minimum Absolute Difference in BST.js](./Minimum%20Absolute%20Difference%20in%20BST.js)

---

## R — Repeat & Clarify

🧠 *"BST + Inorder = SORTED! Min diff trong sorted = chỉ check KỀ NHAU! Pattern: inorder + prev."*

> 🎙️ *"Find the minimum absolute difference between values of any two nodes in a BST."*

> 🎙️ *"Since it's a BST, inorder traversal gives sorted order. In a sorted sequence, the minimum difference ALWAYS occurs between CONSECUTIVE elements — I never need to check non-adjacent pairs."*

```
TẠI SAO CHỈ CHECK KỀ NHAU?

  Sorted: [1, 3, 6, 10]
  
  1-3  = 2 ✅
  3-6  = 3
  6-10 = 4
  1-6  = 5    ← LUÔN > min(1-3, 3-6) vì 1-6 = (1-3) + (3-6)!
  1-10 = 9    ← LUÔN lớn hơn!
  
  Chứng minh: a < b < c
  c - a = (c - b) + (b - a) ≥ 2 * min(c-b, b-a)
  → Khoảng cách xa LUÔN ≥ khoảng cách gần!
```

---

## E — Examples

```
     4
    / \
   2   6       Inorder: [1, 2, 3, 4, 6]
  / \
 1   3

  1-2 = 1, 2-3 = 1, 3-4 = 1, 4-6 = 2
  Min = 1 ✅
```

---

## C — Code

```javascript
function getMinimumDifference(root) {
  let prev = null, minDiff = Infinity;
  
  function inorder(node) {
    if (!node) return;
    inorder(node.left);     // left first (smallest)
    
    // Compare with PREVIOUS (consecutive in sorted!)
    if (prev !== null) {
      minDiff = Math.min(minDiff, node.val - prev);
    }
    prev = node.val;        // update prev!
    
    inorder(node.right);    // right (larger)
  }
  
  inorder(root);
  return minDiff;
}
```

> 🎙️ *"node.val - prev (not abs!) because inorder of BST is sorted ascending — current is always ≥ prev. No absolute value needed!"*

🧠 *"Nói 'no absolute value needed' = show mình hiểu BST property sâu!"*

### Trace:

```
     4(2(1,3), 6)    Inorder: [1, 2, 3, 4, 6]
     
  visit 1: prev=null → skip. prev=1
  visit 2: 2-1=1, minDiff=1. prev=2
  visit 3: 3-2=1, minDiff=1. prev=3
  visit 4: 4-3=1, minDiff=1. prev=4
  visit 6: 6-4=2, minDiff=1. prev=6
  
  Answer: 1 ✅
```

---

## O — Optimize

```
Time:  O(n) — visit each node once
Space: O(h) — recursion (no extra array!)

❌ Naive: collect all values → sort → compare → O(n log n)
✅ Ours:  inorder = already sorted → compare in-place → O(n)
```

---

## 🗣️ Interview Script

> 🎙️ *"BST inorder gives sorted order. Minimum difference in sorted sequence is always between consecutive elements. I do one inorder pass, comparing each node with prev. O(n) time, O(h) space. No need for abs() since BST guarantees ascending order."*

### Pattern

```
INORDER + PREV PATTERN:
═══════════════════════════════════════════════════════════════

  ┌──────────────────────┬──────────────────────────────┐
  │ Problem              │ Compare WHAT with prev?      │
  ├──────────────────────┼──────────────────────────────┤
  │ #530 Min Abs Diff    │ current - prev = diff        │
  │ #501 Find Mode       │ current === prev → count++   │
  │ #98 Validate BST     │ current > prev? (monotonic)  │
  │ #99 Recover BST      │ current < prev → swap found! │
  └──────────────────────┴──────────────────────────────┘

  All use: inorder + prev = sorted sequence analysis!
```
