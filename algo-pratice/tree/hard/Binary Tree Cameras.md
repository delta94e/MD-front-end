# 📷 Binary Tree Cameras — LeetCode #968 (Hard)

> 📖 Code: [Binary Tree Cameras.js](./Binary%20Tree%20Cameras.js)

---

## R — Repeat & Clarify

🧠 *"Greedy: đặt camera ở CHA leaf = tối ưu. 3 states: 0=uncovered, 1=covered, 2=has camera."*

> 🎙️ *"Place the minimum number of cameras on nodes to monitor every node. A camera covers: itself, its parent, and its children."*

---

## E — Examples

```
VÍ DỤ 1:
       0
      /
     📷          1 camera covers all 3 nodes!
    / \          Answer: 1
   0   0

VÍ DỤ 2:
       0
      /
     📷          2 cameras needed
    / \
   0   0
  /
 📷
  \
   0

  Bottom camera covers: itself, parent, child
  But grandparent not covered → need another camera!
```

---

## A — Approach

> 🎙️ *"GREEDY from bottom up. The key insight: placing cameras at PARENTS of leaves is MORE EFFICIENT than at leaves themselves. A leaf covers nothing below it. Its parent covers the leaf + grandparent + siblings."*

> 🎙️ *"Three states for each node:*
> *- **State 0**: NOT COVERED → parent MUST place a camera here!*
> *- **State 1**: COVERED (by a child's camera) → safe, no action needed*
> *- **State 2**: HAS A CAMERA → covers self + parent + children"*

> 🎙️ *"For null nodes: return state 1 (covered). This prevents leaves from 'needing' cameras for their non-existent children."*

```
WHY NULL = COVERED (State 1)?

  If null = 0 (uncovered): leaves would HAVE to place cameras
  → cameras at every leaf = WASTEFUL!

  If null = 1 (covered): leaves return 0 (uncovered)
  → leaf's PARENT places camera → covers leaf + siblings + grandparent
  → MUCH more efficient!

  null = 1 is the GREEDY ENABLER!
```

---

## C — Code

```javascript
function minCameraCover(root) {
  let cameras = 0;
  
  function dfs(node) {
    if (!node) return 1;  // null = "covered" → 
    
    const left = dfs(node.left);
    const right = dfs(node.right);
    
    // Child NOT covered → I MUST place camera!
    if (left === 0 || right === 0) {
      cameras++;
      return 2;  // I have camera!
    }
    
    // Child HAS camera → I'm covered!
    if (left === 2 || right === 2) {
      return 1;  // covered by child!
    }
    
    // Both children covered (state 1) but neither has camera
    // → I'm NOT covered! Parent must handle me!
    return 0;
  }
  
  // If root is uncovered, place one more camera!
  if (dfs(root) === 0) cameras++;
  return cameras;
}
```

> 🎙️ *"Post-order: children report their states to parent. Parent reacts:*
> *1. Child uncovered → EMERGENCY! Place camera!*
> *2. Child has camera → I'm safe.*
> *3. Both covered, no camera → I'm uncovered, pass to MY parent."*

### Trace:

```
       0                  State:
      / \                      0(root)
     0   0                   / \
    / \                     0   0
   0   0                  / \
                          0   0 (leaves)

  Leaves: return 0 (null children return 1, leaves return... 
  Wait: leaves have null children → both return 1 (covered)
  Both covered, no camera → leaf returns 0 (uncovered!)
  
  Parent of leaves: child returns 0 → PLACE CAMERA! cameras++, return 2
  Root: children return 2 → covered! return 1
  
  Root returns 1 (covered) → no extra camera needed
  Answer depends on tree structure!
```

---

## O — Optimize

```
Time:  O(n)
Space: O(h)
Greedy: proven optimal for this tree structure!
```

---

## 🗣️ Interview Script

> 🎙️ *"Greedy DFS bottom-up with 3 states. Null returns 1 (covered) — this forces cameras to be placed at parents of leaves, which is optimal. If any child is state 0, place camera. If any child is state 2, I'm covered. Otherwise, I'm uncovered — propagate to parent. Check root at the end. O(n)."*

### Why is greedy correct?

> 🎙️ *"Placing at parents of leaves is provably optimal: a camera at a leaf covers 1-2 directions (up and possibly sibling). A camera at the leaf's parent covers 3 directions (up, down-left, down-right). Formal proof: exchange argument — replacing any leaf camera with its parent covers at least as many nodes."*
