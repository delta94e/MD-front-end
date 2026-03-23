# 📊 Binary Tree Vertical Order Traversal — LeetCode #314 (Hard)

> 📖 Code: [Binary Tree Vertical Order Traversal.js](./Binary%20Tree%20Vertical%20Order%20Traversal.js)

---

## R — Repeat & Clarify

🧠 *"BFS + column index. Mỗi node có column: left=col-1, right=col+1. BFS giữ thứ tự top→bottom."*

> 🎙️ *"Return nodes grouped by vertical column, from leftmost to rightmost. Within each column, nodes should be in top-to-bottom order."*

---

## E — Examples

```
       3
      / \         col -1: [9]
     9  20         col  0: [3, 15]
        / \        col  1: [20]
       15  7       col  2: [7]
       
  BFS order: 3(col 0), 9(col -1), 20(col 1), 15(col 0), 7(col 2)
  Group by column: [[-1,[9]], [0,[3,15]], [1,[20]], [2,[7]]]
  Output: [[9], [3,15], [20], [7]]
```

---

## A — Approach

> 🎙️ *"I use BFS (not DFS!) because BFS naturally gives top-to-bottom order. Each node is tagged with its column. I group by column using a Map, then output from min to max column."*

> 🎙️ *"Why BFS over DFS? In DFS, nodes at the same column but different depths might be visited in wrong order. BFS guarantees level-by-level = top-to-bottom!"*

```
DFS PROBLEM:

       3 (col 0)
      / \
     9   8 (col 1)
      \
       4 (col 0)... wait, 4 is at col -1+1=0
  
  DFS: visit 3(col 0), then 9(col -1), then 4(col 0)
  Column 0: [3, 4] ← correct! 3 before 4
  
  But if tree is different, DFS might visit deeper-left
  before shallower-right in same column!
  BFS: ALWAYS level-by-level → correct order guaranteed!
```

---

## C — Code

```javascript
function verticalOrder(root) {
  if (!root) return [];
  const map = new Map();
  const queue = [[root, 0]];   // [node, column]
  let minCol = 0, maxCol = 0;
  
  while (queue.length > 0) {
    const [node, col] = queue.shift();
    
    if (!map.has(col)) map.set(col, []);
    map.get(col).push(node.val);
    
    minCol = Math.min(minCol, col);
    maxCol = Math.max(maxCol, col);
    
    if (node.left) queue.push([node.left, col - 1]);
    if (node.right) queue.push([node.right, col + 1]);
  }
  
  // Output from leftmost column to rightmost
  const result = [];
  for (let c = minCol; c <= maxCol; c++) {
    result.push(map.get(c));
  }
  return result;
}
```

---

## O — Optimize

```
Time:  O(n) — visit each node once
Space: O(n) — map + queue
```

---

## 🗣️ Interview Script

> 🎙️ *"BFS with column tagging. Root = col 0, left = col-1, right = col+1. Group by column in a Map. BFS guarantees top-to-bottom order within each column. Output from minCol to maxCol. O(n)."*

### Follow-up: LeetCode #987 (Harder version)

> 🎙️ *"#987 adds a constraint: within the same column AND same row, sort by value. That requires tracking (col, row, val) and sorting per cell. More complex but same foundation."*
