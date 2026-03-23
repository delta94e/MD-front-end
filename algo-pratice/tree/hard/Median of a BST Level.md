# 📊 Median of a Binary Search Tree Level — LeetCode #3831 (Hard)

> 📖 Code: [Median of a BST Level.js](./Median%20of%20a%20BST%20Level.js)

---

## R — Repeat & Clarify

🧠 *"BFS level-by-level → thu thập mỗi level → sort → tìm median."*

> 🎙️ *"For each level of a BST, find the median value."*

---

## E — Examples

```
       5
      / \
     3   8       Level 0: [5] → median = 5
    / \   \      Level 1: [3, 8] → median = (3+8)/2 = 5.5
   2   4   10    Level 2: [2, 4, 10] → median = 4 (middle of sorted)
```

---

## A — Approach

> 🎙️ *"BFS with levelSize trick. At each level, collect all values, sort them, compute median:*
> *- Odd count: middle element*
> *- Even count: average of two middle elements"*

```
MEDIAN COMPUTATION:

  [2, 4, 10]  (sorted, len=3, mid=1)
  → odd: values[1] = 4 ✅

  [3, 8]  (sorted, len=2, mid=1)
  → even: (values[0] + values[1]) / 2 = 5.5 ✅
```

---

## C — Code

```javascript
function medianOfLevels(root) {
  if (!root) return [];
  const result = [];
  const queue = [root];
  
  while (queue.length > 0) {
    const size = queue.length;
    const level = [];
    
    for (let i = 0; i < size; i++) {
      const node = queue.shift();
      level.push(node.val);
      if (node.left) queue.push(node.left);
      if (node.right) queue.push(node.right);
    }
    
    level.sort((a, b) => a - b);
    const mid = Math.floor(level.length / 2);
    
    if (level.length % 2 === 1) {
      result.push(level[mid]);              // odd → middle
    } else {
      result.push((level[mid - 1] + level[mid]) / 2);  // even → avg
    }
  }
  
  return result;
}
```

> 🎙️ *"Note: even though it's a BST, nodes at the same level are NOT necessarily sorted in the queue (they come from different subtrees). Sorting per level is necessary."*

---

## O — Optimize

```
Time:  O(n log k) — n nodes, sort each level (max width k)
Space: O(w) — max width for queue

Optimization: for BST, could use inorder to get sorted within each level
without explicit sorting. But the simple approach is sufficient.
```

---

## 🗣️ Interview Script

> 🎙️ *"BFS level-order. Collect values per level, sort, compute median. Can't skip sorting even for BST — same-level nodes aren't BFS-ordered by value. O(n log k) where k = max level width."*
