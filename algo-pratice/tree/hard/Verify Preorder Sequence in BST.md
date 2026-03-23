# ✅ Verify Preorder Sequence in BST — LeetCode #255 (Hard)

> 📖 Code: [Verify Preorder Sequence in BST.js](./Verify%20Preorder%20Sequence%20in%20BST.js)

---

## R — Repeat & Clarify

🧠 *"Monotonic decreasing stack + lower bound. Khi pop = chuyển sang RIGHT subtree."*

> 🎙️ *"Given an array of integers, determine if it could be the preorder traversal of a BST."*

> 🎙️ *"Preorder visits root first, then left subtree (all smaller), then right subtree (all larger). So the sequence has a pattern: decreasing (going left), then suddenly increasing (switching to right subtree)."*

---

## E — Examples

```
  [5, 2, 1, 3, 6] → TRUE ✅
  
       5
      / \
     2   6       Preorder: 5→2→1→3→6
    / \
   1   3

  [5, 2, 6, 1, 3] → FALSE ❌
  
  After 6 (going right of 5), everything must be > 5
  But 1 < 5 → IMPOSSIBLE in a BST!
```

---

## A — Approach

> 🎙️ *"I use a monotonic stack and a lower bound. The stack simulates going DOWN the left side (values decrease). When I encounter something LARGER, I pop elements off — this means I'm transitioning from a left subtree to a right subtree. Each popped value becomes a new LOWER BOUND — nothing in the right subtree can be smaller than the popped root."*

```
VISUALIZATION:

  Preorder: [5, 2, 1, 3, 6]
  
  val=5: stack=[5], lb=-∞       Going LEFT (5 is root)
  val=2: 2<5 → still left.     stack=[5,2], lb=-∞
  val=1: 1<2 → still left.     stack=[5,2,1], lb=-∞
  val=3: 3>1 → SWITCHING RIGHT!
         pop 1 (lb=1)          → 3 must be > 1 ✅
         3>2 → pop 2 (lb=2)   → 3 must be > 2 ✅
         3<5 → stop pop        stack=[5,3], lb=2
  val=6: 6>3 → pop 3 (lb=3)   → 6 must be > 3 ✅
         6>5 → pop 5 (lb=5)   → 6 must be > 5 ✅
         stack=[6], lb=5
  
  No violations → TRUE ✅
```

```
  Preorder: [5, 2, 6, 1, 3]
  
  val=5: stack=[5], lb=-∞
  val=2: stack=[5,2], lb=-∞
  val=6: pop 2(lb=2), pop 5(lb=5). stack=[6], lb=5
  val=1: 1 < lb(5) → VIOLATION! → FALSE ❌
         (1 would be in right subtree of 5, but 1 < 5!)
```

---

## C — Code

```javascript
function verifyPreorder(preorder) {
  let lowerBound = -Infinity;
  const stack = [];
  
  for (const val of preorder) {
    // Violation? Value in right subtree but smaller than root!
    if (val < lowerBound) return false;
    
    // Pop everything smaller → transitioning to right subtree
    while (stack.length > 0 && stack[stack.length - 1] < val) {
      lowerBound = stack.pop();  // new lower bound!
    }
    
    stack.push(val);
  }
  return true;
}
```

> 🎙️ *"The stack maintains a decreasing sequence (left subtree path). When we see something larger, we pop to transition to right subtrees, setting lower bounds. Any future value below a lower bound is invalid."*

---

## O — Optimize

```
Time:  O(n) — each element pushed/popped at most once
Space: O(n) stack
       O(1) if modifying input array as stack!
```

---

## 🗣️ Interview Script

> 🎙️ *"Monotonic decreasing stack. Push values going down-left. When value > top, pop all smaller elements — each popped value sets a new lower bound (entering right subtree). Any value below the lower bound → invalid. O(n) time, amortized — each element enters and leaves the stack once."*

### Pattern

```
MONOTONIC STACK IN TREES:
  #255: verify preorder → decreasing stack + lower bound
  #739: daily temperatures → decreasing stack
  #84:  largest histogram → increasing stack
  Key: stack tracks "unresolved" elements waiting for resolution!
```
