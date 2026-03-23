# 🧵 Extract Kth Character From The Rope Tree — LeetCode #2689 (Medium)

> 📖 Code: [Extract Kth Character From The Rope Tree.js](./Extract%20Kth%20Character%20From%20The%20Rope%20Tree.js)

---

## R — Repeat & Clarify

🧠 *"Rope tree: strings ở leaves. Nối trái→phải = full string. Tìm ký tự thứ k."*

> 🎙️ *"A rope tree stores strings at its leaves. Concatenating all leaf strings left-to-right gives the full string. Find the k-th character."*

---

## E — Examples

```
      root (len=6)
      /    \
   (len=3)  (len=3)
    /  \      |
  "ab" "c"   "def"

  Full string = "ab" + "c" + "def" = "abcdef"
  k=4 → "abcdef"[3] = "d" ✅
```

---

## A — Approach

> 🎙️ *"Two approaches:*
>
> ***Basic O(n):** DFS collect all leaves → concatenate → index.*
>
> ***Optimized O(h):** Use `node.len` to navigate. If k ≤ left.len → go left. Else → go right with k -= left.len. Like a binary search on the rope!"*

---

## C — Code

### Basic: Collect all leaves

```javascript
function getKthCharacter(root, k) {
  let result = "";
  function dfs(node) {
    if (!node) return;
    if (node.val) { result += node.val; return; }
    dfs(node.left);
    dfs(node.right);
  }
  dfs(root);
  return result[k - 1];
}
```

### Optimized: Navigate by length

```javascript
function getKthCharacterOptimized(root, k) {
  let node = root;
  while (node) {
    if (node.val) return node.val[k - 1]; // leaf = has string!
    if (node.left && k <= node.left.len) {
      node = node.left;         // k is in left subtree
    } else {
      k -= node.left ? node.left.len : 0;
      node = node.right;        // k is in right subtree
    }
  }
}
```

---

## O — Optimize

```
Basic:     O(n) — collect all leaves
Optimized: O(h) — navigate by length, skip subtrees!
```

---

## 🗣️ Interview Script

> 🎙️ *"Rope tree = strings at leaves. Basic: DFS inorder, collect, index. Optimized: binary search using node.len — if k ≤ left.len, go left; else subtract and go right. O(h) vs O(n)."*
