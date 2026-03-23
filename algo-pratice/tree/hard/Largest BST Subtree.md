# 🏆 Largest BST Subtree — LeetCode #333 (Hard)

> 📖 Code: [Largest BST Subtree.js](./Largest%20BST%20Subtree.js)

---

## R — Repeat & Clarify

🧠 *"Post-order: con báo cáo [isBST, min, max, size]. Cha kiểm tra: leftMax < me < rightMin?"*

> 🎙️ *"Given a binary tree (NOT necessarily a BST), find the largest subtree which IS a BST. Return the number of nodes in that subtree."*

---

## E — Examples

```
       10
      /  \
     5    15        Subtree rooted at 5: BST! [1,5,8] nodes=3
    / \     \       Subtree rooted at 15: NOT BST (7<15 wrong side!)
   1   8     7      Subtree rooted at 10: left BST but right not → NOT BST
                    
  Largest BST = subtree(5) with 3 nodes ✅
```

---

## A — Approach

> 🎙️ *"Post-order DFS. Each node returns a 4-tuple: [isBST, min, max, size].*
>
> *A subtree is BST if:*
> *1. Both children are BSTs.*
> *2. leftMax < node.val (everything left is smaller).*
> *3. node.val < rightMin (everything right is larger).*
>
> *If BST: size = left.size + right.size + 1. Track global max.*
>
> *Null nodes: [true, Infinity, -Infinity, 0] — sentinel values that never violate conditions."*

```
WHY Infinity/-Infinity FOR NULL?

  null.min = Infinity   → any node.val < Infinity ✅ (rightMin check passes)
  null.max = -Infinity  → any node.val > -Infinity ✅ (leftMax check passes)
  
  This avoids special-casing null children!
```

---

## C — Code

```javascript
function largestBSTSubtree(root) {
  let maxSize = 0;
  
  // Returns [isBST, min, max, size]
  function dfs(node) {
    if (!node) return [true, Infinity, -Infinity, 0];
    
    const [lb, lMin, lMax, lSize] = dfs(node.left);
    const [rb, rMin, rMax, rSize] = dfs(node.right);
    
    // Check: both BST + leftMax < me < rightMin?
    if (lb && rb && lMax < node.val && node.val < rMin) {
      const size = lSize + rSize + 1;
      maxSize = Math.max(maxSize, size);
      return [
        true,
        Math.min(lMin, node.val),   // subtree min
        Math.max(rMax, node.val),   // subtree max
        size
      ];
    }
    
    return [false, 0, 0, 0];  // not BST — values don't matter
  }
  
  dfs(root);
  return maxSize;
}
```

> 🎙️ *"Each node: O(1) work (compare + arithmetic). Total O(n). One DFS, bottom-up validation."*

### Trace:

```
       10(5(1,8), 15(null,7))
       
  dfs(1):  [true, 1, 1, 1]
  dfs(8):  [true, 8, 8, 1]
  dfs(5):  lb✅, rb✅, 1<5<8 → BST! size=3, maxSize=3
           return [true, 1, 8, 3]
  dfs(7):  [true, 7, 7, 1]
  dfs(15): lb=null(true), rb✅, -∞<15? YES, but 15<7? NO! 15>7!
           → NOT BST! return [false, ...]
  dfs(10): right NOT BST → NOT BST
  
  maxSize = 3 ✅
```

---

## O — Optimize

```
❌ Naive: for each node, validate BST + count → O(n²)
✅ Ours:  post-order 4-tuple → O(n) single pass!
```

---

## 🗣️ Interview Script

> 🎙️ *"Post-order DFS returning [isBST, min, max, size]. Each node checks: both children BSTs? leftMax < me < rightMin? If yes, it's BST — merge sizes. Track global max. O(n). The sentinel values for null (Infinity, -Infinity) elegantly handle base cases."*

### Pattern

```
POST-ORDER MULTI-VALUE RETURN:
  #333: [isBST, min, max, size]     ← 4 values!
  #250: [isUnival]                   ← 1 boolean
  #543: [height] + global diameter   ← 1 value + global
  
  General template:
  dfs(node) → returns SUMMARY of subtree for parent to use
```
