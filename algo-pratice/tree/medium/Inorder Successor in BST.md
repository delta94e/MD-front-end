# ➡️ Inorder Successor in BST — LeetCode #285 (Medium)

> 📖 Code: [Inorder Successor in BST.js](./Inorder%20Successor%20in%20BST.js)

---

## R — Repeat & Clarify

🧠 *"Successor = số LỚN HƠN GẦN NHẤT trong BST. O(h) binary search + candidate."*

> 🎙️ *"Find the inorder successor of a given node in a BST — the node with the SMALLEST value GREATER than the given node."*

---

## E — Examples

```
       5
      / \
     3   7
    / \
   2   4

  Successor(3) = 4  (next larger after 3)
  Successor(4) = 5  (next larger after 4)
  Successor(5) = 7  (next larger after 5)
  Successor(7) = null (no larger node!)
```

---

## A — Approach

> 🎙️ *"Binary search with candidate tracking. At each node:*
>
> *If p < node: this node is LARGER than p → it's a CANDIDATE for successor! But maybe there's something smaller that's still > p → go LEFT.*
>
> *If p ≥ node: this node is too small → go RIGHT.*
>
> *When I reach null, my last saved candidate is the answer!"*

```
WHY IT WORKS:

  Target: successor(3) in BST above

  node=5: 3<5 → 5 is candidate! Maybe something smaller? Go LEFT
  node=3: 3≥3 → too small. Go RIGHT
  node=4: 3<4 → 4 is better candidate! Go LEFT
  node=null → STOP! Answer = 4 ✅

  Every time I go LEFT, I found something LARGER (candidate).
  Every time I go RIGHT, I found something SMALLER (skip).
  Last candidate = CLOSEST larger value = successor!
```

---

## C — Code

```javascript
function inorderSuccessor(root, p) {
  let successor = null;
  let node = root;
  
  while (node) {
    if (p.val < node.val) {
      successor = node;      // candidate! 
      node = node.left;      // look for closer candidate
    } else {
      node = node.right;     // too small, go right
    }
  }
  return successor;
}
```

> 🎙️ *"O(h) time, O(1) space. Same structure as #270 Closest Value — navigate BST, track candidate."*

---

## 🗣️ Interview Script

### Follow-up

**Q: "What about predecessor?"**

> 🎙️ *"Mirror! If p > node → candidate (it's smaller than p). Go right for closer. If p ≤ node → too big, go left."*

```javascript
function inorderPredecessor(root, p) {
  let predecessor = null;
  let node = root;
  while (node) {
    if (p.val > node.val) {
      predecessor = node;    // candidate (smaller than p!)
      node = node.right;     // closer?
    } else {
      node = node.left;      // too big
    }
  }
  return predecessor;
}
```

**Q: "What if you have a parent pointer?"**

> 🎙️ *"Two cases:*
> *1. Node has RIGHT child → successor = leftmost node in right subtree.*
> *2. No right child → go UP until you find an ancestor where current is in LEFT subtree."*

### Pattern

```
BST CANDIDATE TRACKING:
  #270: track closest (by distance)
  #285: track successor (go-left = candidate)
  Predecessor: track predecessor (go-right = candidate)
  All O(h) times!
```
