# 🌳 Maximum Depth of N-ary Tree — LeetCode #559 (Easy)

> 📖 Code: [Maximum Depth of N-ary Tree.js](./Maximum%20Depth%20of%20N-ary%20Tree.js)

---

## R — Repeat & Clarify

🧠 *"Giống #104 Max Depth nhưng N-ary: mỗi node có NHIỀU con, không chỉ left/right."*

> 🎙️ *"Find the maximum depth of an N-ary tree — each node can have any number of children, not just two."*

---

## E — Examples

```
VÍ DỤ 1:
       1
      /|\
     3 2 4       maxDepth = 3 (path 1→3→5 or 1→3→6)
     |
     5
     |
     6           Wait: 1→3→5→6? Let me recount
                 If 5 is child of 3, and 6 is child of 5:
                 depth = 4 (1→3→5→6)

VÍ DỤ 2: Single node → depth = 1
VÍ DỤ 3: null → depth = 0
```

---

## A — Approach

> 🎙️ *"Same formula as binary tree: depth = 1 + max(all children depths). Only difference: instead of max(left, right), I loop through ALL children."*

---

## C — Code

```javascript
function maxDepth(root) {
  if (!root) return 0;
  if (root.children.length === 0) return 1;  // leaf!
  
  let maxChild = 0;
  for (const child of root.children) {
    maxChild = Math.max(maxChild, maxDepth(child));
  }
  return 1 + maxChild;
}
```

> 🎙️ *"One-liner version with reduce:*
> ```javascript
> return root ? 1 + Math.max(0, ...root.children.map(c => maxDepth(c))) : 0;
> ```
> *The `0` in Math.max handles empty children (leaf node)."*

### BFS Alternative:

```javascript
function maxDepthBFS(root) {
  if (!root) return 0;
  const queue = [root];
  let depth = 0;
  while (queue.length > 0) {
    depth++;
    const size = queue.length;
    for (let i = 0; i < size; i++) {
      const node = queue.shift();
      for (const child of node.children) queue.push(child);
    }
  }
  return depth;
}
```

---

## O — Optimize

```
Time:  O(n) — visit each node once
Space: O(h) recursive, O(w) BFS
Same as binary tree! Just loop children instead of L/R.
```

---

## 🗣️ Interview Script

> 🎙️ *"Identical to binary tree max depth. The only change: loop through root.children instead of checking root.left and root.right. O(n) time, O(h) space."*

**Q: "What if a node has millions of children?"**

> 🎙️ *"The algorithm still works — I loop through all children. Time is still O(n) total since each node is visited once. But the branching factor affects space: BFS queue could hold up to n/2 nodes for a wide tree."*

### Pattern

```
BINARY → N-ARY CONVERSION:
  max(left, right) → max(...children)
  for (const child of [left, right]) → for (const child of node.children)
  
  Áp dụng cho: Max Depth, Min Depth, Level Order, Serialize, etc.
```
