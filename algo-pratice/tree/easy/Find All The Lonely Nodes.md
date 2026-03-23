# 😢 Find All The Lonely Nodes — LeetCode #1469 (Easy)

> 📖 Code: [Find All The Lonely Nodes.js](./Find%20All%20The%20Lonely%20Nodes.js)

---

## R — Repeat & Clarify

🧠 *"Lonely = con MỘT. Cha chỉ có 1 con → con đó lonely. Pattern giống #404."*

> 🎙️ *"A lonely node is a node that is the ONLY child of its parent — the parent has exactly one child. Root is never lonely since it has no parent."*

---

## E — Examples

```
VÍ DỤ 1:
     1
    / \
   2   3       Node 2: parent(1) có 2 con → NOT lonely
    \   \      Node 3: parent(1) có 2 con → NOT lonely  
     4   6     Node 4: parent(2) chỉ có RIGHT → LONELY! ✅
               Node 6: parent(3) chỉ có RIGHT → LONELY! ✅
               Output: [4, 6]

VÍ DỤ 2:
     7
    / \
   1   4       Node 6: parent(1) chỉ có LEFT → LONELY!
  /     \      Node 5: parent(4) chỉ có RIGHT → LONELY!
 6       5     Output: [6, 5]

VÍ DỤ 3:
     11         
    / \        Node 99: parent(77) chỉ có LEFT → LONELY!
   77  63      Node 55: parent(77... wait, 77 has child 99 only) 
  /     \      
 99      55    Check: 11 has 2 children → not lonely
               77 has only left(99) → 99 lonely!
               63 has only right(55) → 55 lonely!
               Output: [99, 55]
```

---

## C — Code

```javascript
function getLonelyNodes(root) {
  const result = [];
  
  function dfs(node) {
    if (!node) return;
    
    // Cha chỉ có 1 con? Con đó lonely!
    if (node.left && !node.right) {
      result.push(node.left.val);   // only left child → lonely
    }
    if (node.right && !node.left) {
      result.push(node.right.val);  // only right child → lonely
    }
    // Nếu CẢ 2 con → không ai lonely!
    // Nếu 0 con (leaf) → không có con nào!
    
    dfs(node.left);
    dfs(node.right);
  }
  
  dfs(root);
  return result;
}
```

> 🎙️ *"At each node, I check if it has EXACTLY one child. If only left: left child is lonely. If only right: right child is lonely. If both or neither: no one is lonely."*

### Alternative: Flag approach

```javascript
function getLonelyNodes(root) {
  const result = [];
  function dfs(node, isOnly) {
    if (!node) return;
    if (isOnly) result.push(node.val);
    
    const hasLeft = node.left !== null;
    const hasRight = node.right !== null;
    dfs(node.left, hasLeft && !hasRight);   // lonely if sibling missing
    dfs(node.right, hasRight && !hasLeft);
  }
  dfs(root, false);
  return result;
}
```

---

## O — Optimize

```
Time:  O(n)
Space: O(h) recursion + O(k) result where k = number of lonely nodes
```

---

## 🗣️ Interview Script

> 🎙️ *"Same parent-checks-child pattern as Sum of Left Leaves. At each node, if it has exactly one child, that child is lonely. O(n) time. Note: root is NEVER lonely."*

### Pattern

```
PARENT-CHECKS-CHILD — REUSE!

  #404:  "Is my LEFT child a LEAF?"
  #1469: "Do I have EXACTLY ONE child?"
  
  Same structure, different condition!
```
