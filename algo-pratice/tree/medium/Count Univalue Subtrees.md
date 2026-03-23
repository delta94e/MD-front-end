# 🔢 Count Univalue Subtrees — LeetCode #250 (Medium)

> 📖 Code: [Count Univalue Subtrees.js](./Count%20Univalue%20Subtrees.js)

---

## R — Repeat & Clarify

🧠 *"Univalue = tất cả nodes cùng giá trị. Post-order: con báo cáo → cha check."*

> 🎙️ *"Count how many subtrees have all nodes with the same value."*

> 🎙️ *"A univalue subtree means EVERY node in that subtree has the same value. Leaves are always univalue (only 1 node). An internal node is univalue if both children's subtrees are univalue AND both children's values equal the current node's value."*

---

## E — Examples

```
       5
      / \
     1   5       Univalue subtrees: ① 5(bottom-left) ② 5(bottom-right)
    / \   \      ③ 5(right child + its child 5) ④ 5(right-right leaf)
   5   5   5     Wait let me re-trace:
   
  Leaves: 5(left-left) ✅, 5(left-right) ✅, 5(right-right) ✅ → 3
  Node 1: children are 5,5 but 5≠1 → NOT univalue
  Node 5(right): child = 5, value = 5 → unival! → 4
  Node 5(root): left subtree NOT unival → NOT unival
  
  Count = 4 ✅
```

---

## A — Approach

> 🎙️ *"Post-order DFS. Each node returns whether its subtree is univalue. Check: both children univalue? Both children values match mine? If so, I'm univalue → increment count."*

> 🎙️ *"Dual-tracking again: RETURN isUnival (boolean) to parent, UPDATE count globally."*

---

## C — Code

```javascript
function countUnivalSubtrees(root) {
  let count = 0;
  
  function isUnival(node) {
    if (!node) return true;  // null = univalue (vacuously true)
    
    const left = isUnival(node.left);
    const right = isUnival(node.right);
    
    if (!left || !right) return false; // child NOT unival → I'm not!
    if (node.left && node.left.val !== node.val) return false;
    if (node.right && node.right.val !== node.val) return false;
    
    count++;     // I AM univalue!
    return true;
  }
  
  isUnival(root);
  return count;
}
```

> 🎙️ *"⚠️ Important: I call BOTH left and right BEFORE checking results. Don't short-circuit! Even if left is false, I still need to evaluate right to get the correct count for children of right subtree."*

```
WHY NO SHORT-CIRCUIT?

  ❌ BAD:  if (!isUnival(left)) return false;  ← skips right!
  ✅ GOOD: const l = isUnival(left);           ← ALWAYS evaluates both!
           const r = isUnival(right);
           if (!l || !r) return false;
```

---

## O — Optimize

```
Time: O(n) — each node visited once
Space: O(h) — recursion stack
```

---

## 🗣️ Interview Script

> 🎙️ *"Post-order DFS returning boolean isUnival. At each node, check both children are unival AND their values match mine. If so, increment count and return true. Must evaluate both children — no short-circuit!"*

### Pattern: Same dual-tracking family

```
Return BOOLEAN, track COUNT:
  #250: return isUnival, track count of unival subtrees
  #110: return isBalanced, track... well, also boolean but same idea
```
