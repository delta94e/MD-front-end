# ⚖️ Binary Tree Tilt — LeetCode #563 (Medium)

> 📖 Code: [Binary Tree Tilt.js](./Binary%20Tree%20Tilt.js)

---

## R — Repeat & Clarify

🧠 *"Return SUM cho cha, update TILT global. Dual-tracking giống #543 Diameter!"*

> 🎙️ *"Tilt of a node = |sum(left subtree) - sum(right subtree)|. Return the TOTAL tilt of all nodes."*

---

## E — Examples

```
VÍ DỤ 1:
     1
    / \
   2   3       tilt(2) = |0-0| = 0 (leaf)
               tilt(3) = |0-0| = 0 (leaf)
               tilt(1) = |2-3| = 1
               Total = 0+0+1 = 1

VÍ DỤ 2:
     4
    / \
   2   9       tilt(3) = 0, tilt(5) = 0
  / \   \      tilt(2) = |3-5| = 2
 3   5   7     tilt(7) = 0
               tilt(9) = |0-7| = 7
               tilt(4) = |(2+3+5) - (9+7)| = |10-16| = 6
               Total = 0+0+2+0+7+6 = 15
```

---

## A — Approach

> 🎙️ *"Exact same dual-tracking pattern as Diameter:*
>
> *Diameter: return HEIGHT, track DIAMETER*
> *Tilt: return SUM, track TILT*
>
> *At each node, I compute the subtree sum (needed by parent for its tilt), but I also update the global total tilt."*

---

## C — Code

```javascript
function findTilt(root) {
  let totalTilt = 0;
  
  function sumTree(node) {
    if (!node) return 0;
    const left = sumTree(node.left);      // sum of left subtree
    const right = sumTree(node.right);    // sum of right subtree
    
    totalTilt += Math.abs(left - right);  // UPDATE tilt!
    
    return node.val + left + right;        // RETURN sum for parent!
  }
  
  sumTree(root);
  return totalTilt;
}
```

> 🎙️ *"Return value: subtree SUM (parent needs this to compute its own tilt). Side effect: add this node's tilt to global total. Classic dual-tracking."*

---

## O — Optimize

```
Time:  O(n) — visit each node once
Space: O(h) — recursion stack
One DFS does everything!
```

---

## 🗣️ Interview Script

> 🎙️ *"Post-order DFS returning subtree sum. At each node, tilt = |leftSum - rightSum|, added to global total. Same dual-tracking pattern as Diameter — return sum, track tilt. O(n)."*

### Pattern Match

```
DUAL-TRACKING: return X, track Y
  #543: return height, track diameter
  #563: return sum, track tilt       ← THIS PROBLEM!
  #124: return max gain, track max path sum
```
