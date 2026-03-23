# 📊 Find Mode in BST — LeetCode #501 (Medium)

> 📖 Code: [Find Mode in BST.js](./Find%20Mode%20in%20BST.js)

---

## R — Repeat & Clarify

🧠 *"BST Inorder = sorted! Sorted → đếm liên tiếp. Pattern: inorder + prev + count."*

> 🎙️ *"Find the mode(s) — the most frequently occurring element(s) in a BST. There can be MULTIPLE modes."*

---

## E — Examples

```
     2
    / \
   1   2       Inorder: [1, 2, 2]
               Count: 1→1, 2→1, 2→2 (consecutive match!)
               Mode: [2] (appears 2 times)

     1
    / \
   1   2       Inorder: [1, 1, 2, 2]
  /     \      Count: 1→1, 1→2, 2→1, 2→2
 1       2     Modes: [1, 2] (both appear 2 times!)
```

---

## A — Approach

> 🎙️ *"Since BST inorder is sorted, equal values are CONSECUTIVE. I don't need a HashMap — just compare with the previous value!"*

> 🎙️ *"Three variables: prev, count, maxCount.*
> *- If current === prev: count++*
> *- Else: reset count = 1*
> *- If count > maxCount: new mode found! Reset modes array.*
> *- If count === maxCount: another mode at same frequency. Append."*

```
3 CASES WHEN UPDATING MODES:

  count > maxCount:  NEW CHAMPION! modes = [current], maxCount = count
  count = maxCount:  TIE! modes.push(current)
  count < maxCount:  LOSER! ignore
```

---

## C — Code

```javascript
function findMode(root) {
  let prev = null, count = 0, maxCount = 0;
  let modes = [];
  
  function inorder(node) {
    if (!node) return;
    inorder(node.left);
    
    // Count consecutive
    count = (prev !== null && node.val === prev) ? count + 1 : 1;
    prev = node.val;
    
    // Update modes
    if (count > maxCount) {
      maxCount = count;
      modes = [node.val];        // reset! new champion!
    } else if (count === maxCount) {
      modes.push(node.val);      // tie! add to modes!
    }
    
    inorder(node.right);
  }
  
  inorder(root);
  return modes;
}
```

> 🎙️ *"This is O(n) time with O(1) extra space (besides output). I leverage BST's sorted inorder to avoid a HashMap entirely!"*

### Trace:

```
  Inorder: [1, 1, 2, 2, 3]
  
  visit 1: count=1, maxCount=1, modes=[1]
  visit 1: count=2, maxCount=2, modes=[1]      ← new champion!
  visit 2: count=1               ← reset (≠prev)
  visit 2: count=2, maxCount=2, modes=[1, 2]   ← tie!
  visit 3: count=1
  
  Result: [1, 2] ✅
```

---

## O — Optimize

```
❌ HashMap: O(n) space — works for any tree
✅ Inorder+prev: O(1) extra space — BST only!
  (BST gives sorted → consecutive counting!)
```

---

## 🗣️ Interview Script

> 🎙️ *"BST inorder is sorted, so equal values are adjacent. I traverse inorder comparing with prev. count > maxCount → new modes array. count === maxCount → append. O(n) time, O(1) extra space."*

### Pattern — Same as #530!

```
INORDER + PREV: cùng skeleton, khác logic!

  #530: prev so sánh DIFF     → minDiff = min(diff)
  #501: prev so sánh EQUAL    → count++ hoặc reset
  #98:  prev so sánh GREATER  → valid BST?
```
