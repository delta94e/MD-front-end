# 🔢 Count Complete Tree Nodes — LeetCode #222 (Medium)

> 📖 Code: [Count Complete Tree Nodes.js](./Count%20Complete%20Tree%20Nodes.js)

---

## R — Repeat & Clarify

🧠 *"O(n) thì ai cũng làm được. O(log²n) mới hay — tận dụng 'complete tree'!"*

> 🎙️ *"Count nodes in a COMPLETE binary tree. The challenge: do it in less than O(n)."*

> 🎙️ *"Complete tree: all levels full except possibly the last, which is filled left-to-right. This gives us a KEY property: at least ONE subtree is always a PERFECT tree."*

```
COMPLETE vs PERFECT:

  Complete:          Perfect:
       1                1
      / \              / \
     2   3            2   3
    / \  /           / \ / \
   4  5 6           4  5 6  7

  Complete: last level filled LEFT-TO-RIGHT (node 6, no 7)
  Perfect: ALL levels full → 2^h - 1 nodes exactly
  
  KEY: In a complete tree, either LEFT or RIGHT subtree is PERFECT!
```

---

## E — Examples

```
       1
      / \
     2   3       leftHeight = 3 (1→2→4), rightHeight = 2 (1→3→6)
    / \  /       Heights DIFFER → NOT perfect tree overall
   4  5 6        BUT: left subtree IS complete, right subtree IS complete
                 At least ONE is perfect!

       1
      / \
     2   3       leftHeight = 3, rightHeight = 3
    / \ / \      Heights SAME → PERFECT tree!
   4  5 6  7     Count = 2^3 - 1 = 7
```

---

## A — Approach

> 🎙️ *"At each node, I check left height (go all the way left) and right height (go all the way right).* 
>
> *If left height === right height → the tree is PERFECT. Count = 2^h - 1.*
>
> *If they differ → NOT perfect. Recurse on both children. But HERE'S THE MAGIC: at least one child IS a perfect tree (in a complete tree), so one recursive call terminates in O(1)!*
>
> *Total: O(log n) recursive calls, each doing O(log n) height check = O(log²n)!"*

```
TẠI SAO O(log²n)?

  Tại mỗi level, tôi gọi 2 height = O(log n)
  Nhưng CHỈ ĐI XUỐNG 1 NHÁNH (nhánh kia = perfect → O(1))
  → O(log n) levels × O(log n) height check = O(log²n)
```

---

## C — Code

```javascript
function countNodes(root) {
  if (!root) return 0;
  
  // Check height going LEFT and RIGHT
  let leftH = 0, rightH = 0;
  let l = root, r = root;
  while (l) { leftH++; l = l.left; }
  while (r) { rightH++; r = r.right; }
  
  // Perfect tree? Formula!
  if (leftH === rightH) {
    return Math.pow(2, leftH) - 1;  // 2^h - 1
  }
  
  // Not perfect? Recurse both sides
  return 1 + countNodes(root.left) + countNodes(root.right);
}
```

> 🎙️ *"leftH goes all way LEFT = tallest path. rightH goes all way RIGHT = shortest path (in complete tree). If equal, it's perfect."*

### Trace:

```
       1
      / \
     2   3
    / \  /
   4  5 6

  countNodes(1): leftH=3(1→2→4), rightH=2(1→3→6). 3≠2 → recurse
    countNodes(2): leftH=2(2→4), rightH=2(2→5). 2===2 → PERFECT! 2²-1 = 3
    countNodes(3): leftH=2(3→6), rightH=1(3). 2≠1 → recurse
      countNodes(6): leftH=1, rightH=1. 1===1 → PERFECT! 2¹-1 = 1
      countNodes(null): 0
    countNodes(3) = 1 + 1 + 0 = 2
  countNodes(1) = 1 + 3 + 2 = 6 ✅
```

---

## O — Optimize

```
┌──────────────┬───────────────────────────────────┐
│ Naive        │ O(n) — traverse all nodes         │
│ Optimized    │ O(log²n) — exploit complete tree! │
│ Binary search│ O(log²n) — alt approach           │
└──────────────┴───────────────────────────────────┘

log²n: for n=1M nodes, log²n = 20² = 400 vs 1,000,000!
```

---

## 🗣️ Interview Script

> 🎙️ *"In a complete tree, I check left height vs right height. If equal → perfect → 2^h-1. If not → recurse. At least one subtree is always perfect, so one call terminates immediately. O(log²n)."*

### Follow-up

**Q: "Why not binary search on the last level?"**

> 🎙️ *"That works too! Count full levels = 2^(h-1) - 1 nodes. Then binary search the last level to find how many nodes exist. O(log²n) same complexity, but more complex to code."*
