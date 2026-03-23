# 🔄 Binary Tree Upside Down — LeetCode #156 (Medium)

> 📖 Code: [Binary Tree Upside Down.js](./Binary%20Tree%20Upside%20Down.js)

---

## R — Repeat & Clarify

🧠 *"Left-most leaf → new root. Rewire: left child becomes parent. Tricky pointer manipulation."*

> 🎙️ *"Flip the tree upside down — the leftmost leaf becomes the new root. For each original parent-left-right triple, the left child becomes the new parent, the right sibling becomes the new left child, and the old parent becomes the new right child."*

> 🎙️ *"Constraint: every right child is a leaf node (or null), and only the leftmost branch has non-leaf nodes."*

---

## E — Examples

```
  BEFORE:              AFTER:
     1                    4
    / \                  / \
   2   3      →        5   2
  / \                      / \
 4   5                    3   1

  Rules for each level:
  → Left child (2) becomes PARENT
  → Right sibling (3) becomes LEFT child of new parent
  → Old parent (1) becomes RIGHT child of new parent
  
  So: 2.left = 3 (old right sibling)
      2.right = 1 (old parent)
      4.left = 5 (old right sibling)
      4.right = 2 (old parent)
```

---

## C — Code

```javascript
function upsideDownBinaryTree(root) {
  if (!root || !root.left) return root;
  
  // Go to leftmost leaf → NEW ROOT!
  const newRoot = upsideDownBinaryTree(root.left);
  
  // Rewire: left child's left = right sibling, left child's right = parent
  root.left.left = root.right;   // right sibling → new left
  root.left.right = root;        // parent → new right
  
  // Clean up old pointers
  root.left = null;
  root.right = null;
  
  return newRoot;  // leftmost leaf = new root!
}
```

> 🎙️ *"Recursive: dive to leftmost leaf (new root). On the way BACK UP, rewire each node's left child. The left child adopts the right sibling as its left and the parent as its right."*

### Iterative Alternative:

```javascript
function upsideDownBinaryTree(root) {
  let curr = root, prev = null, prevRight = null;
  while (curr) {
    const next = curr.left;
    curr.left = prevRight;    // right sibling → new left
    prevRight = curr.right;
    curr.right = prev;        // parent → new right
    prev = curr;
    curr = next;
  }
  return prev;
}
```

> 🎙️ *"The iterative version is like reversing a linked list — go down the left chain, rewiring as you go."*

---

## O — Optimize

```
Time:  O(h) — only traverse left spine
Space: O(h) recursive, O(1) iterative
```

---

## 🗣️ Interview Script

> 🎙️ *"Recurse to leftmost leaf (new root). On the way back, each node's left child takes the right sibling as left, parent as right. Null out old pointers. Like reversing a linked list down the left spine. O(h) time."*
