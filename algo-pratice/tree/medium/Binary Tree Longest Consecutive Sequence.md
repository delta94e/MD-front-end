# 🔗 Binary Tree Longest Consecutive Sequence — LeetCode #298 (Medium)

> 📖 Code: [Binary Tree Longest Consecutive Sequence.js](./Binary%20Tree%20Longest%20Consecutive%20Sequence.js)

---

## R — Repeat & Clarify

🧠 *"Top-down DFS truyền length xuống. child.val = parent.val + 1? → length++. Else: reset."*

> 🎙️ *"Find the longest path of consecutive values (each value = parent + 1) going from parent to child in a binary tree."*

---

## E — Examples

```
     1
      \
       3        Longest = 3 (path 3→4→5)
      / \       Note: 1→3 is NOT consecutive (3≠1+1)!
     2   4
          \
           5

  1→3: 3≠1+1=2 → reset to 1
  3→2: 2≠3+1=4 → reset to 1
  3→4: 4=3+1 ✅ → length=2
  4→5: 5=4+1 ✅ → length=3 ← MAX!
```

---

## C — Code

```javascript
function longestConsecutive(root) {
  let maxLen = 0;
  
  function dfs(node, parent, length) {
    if (!node) return;
    
    // Consecutive? Continue! Otherwise reset!
    length = (parent && node.val === parent.val + 1) ? length + 1 : 1;
    maxLen = Math.max(maxLen, length);
    
    dfs(node.left, node, length);
    dfs(node.right, node, length);
  }
  
  dfs(root, null, 0);
  return maxLen;
}
```

> 🎙️ *"Top-down DFS: pass current consecutive length as parameter. At each node, check if value = parent + 1. If yes, extend. If no, start fresh at 1."*

---

## O — Optimize

```
Time:  O(n) — visit every node
Space: O(h) — recursion stack
```

---

## 🗣️ Interview Script

### Follow-up

**Q: "What about both increasing AND decreasing?" (#549)**

> 🎙️ *"LeetCode #549 allows both directions. I'd return TWO values from each node: increasing length and decreasing length. At each node, check if child = parent ± 1. The longest path could be increasing from one child + decreasing from the other, joined at THIS node."*

### Pattern

```
TOP-DOWN DFS WITH STATE:
  #298: pass length, check val = parent+1
  #988: pass path string, check at leaf
  #112: pass remaining sum, check at leaf
  All: parent passes info DOWN to children!
```
