# ⚠️ Minimum Depth of Binary Tree — LeetCode #111 (Medium-think, Easy-rated)

> 📖 Code: [Minimum Depth of Binary Tree.js](./Minimum%20Depth%20of%20Binary%20Tree.js)

---

## R — Repeat & Clarify

🧠 *"BẪY KINH ĐIỂN! Không phải đổi max→min từ #104! null ≠ leaf!"*

> 🎙️ *"Find the minimum depth — the shortest path from root to the NEAREST LEAF node."*

> 🎙️ *"Critical clarification: minimum depth is to a LEAF node, not just any node. A null child is NOT a leaf — it means that side doesn't exist. If a node has only one child, I MUST go down that child's direction."*

---

## E — Examples

```
VÍ DỤ 1 — THE TRAP!
   1
    \
     2           
      \          Naive: min(left=0, right=...) = 0? ❌ SAI!
       3         Correct: must go right to leaf 3 → depth = 3
                 Node 1 chỉ có RIGHT → PHẢI đi right!
                 null bên left KHÔNG PHẢI leaf!

VÍ DỤ 2 — Normal:
      3
     / \
    9  20       min depth = 2 (path 3→9)
       / \      NOT 1 (node 3 is not a leaf!)
      15  7

VÍ DỤ 3: null → 0
VÍ DỤ 4: [1] → 1 (root is leaf)
```

```
⚠️ TẠI SAO BẪY?

  Max Depth (#104):  1 + max(left, right)  ← Đúng luôn!
  Min Depth (#111):  1 + min(left, right)  ← SAI nếu 1 child null!

  Vì null.depth = 0, min(..., 0) = 0 → nghĩ depth = 1
  Nhưng chỉ có 1 con → path PHẢI đi qua con đó!
  null KHÔNG PHẢI LEAF → không thể dừng ở null!
```

---

## A — Approach

> 🎙️ *"Three cases at each node:*
>
> *1. **No left child**: min depth = 1 + minDepth(right). I MUST go right.*
> *2. **No right child**: min depth = 1 + minDepth(left). I MUST go left.*
> *3. **Both children**: min depth = 1 + min(left, right). Take shorter path!"*

> 🎙️ *"I can also solve this with BFS — level-order traversal returns the first leaf found, which is guaranteed to be at the minimum depth. BFS is actually MORE EFFICIENT for skewed trees because it stops early!"*

```
DFS vs BFS:

  Skewed tree (1→2→3→...→1000, leaf at 1000):
  
  DFS: must explore ENTIRE tree! O(n) always
  BFS: finds first leaf at level that has one → O(n) worst
       BUT if first leaf at level 2: BFS stops at level 2! O(width)!

  Well-balanced tree (leaf early):
  BFS better — stops at first leaf!
  DFS — explores everything regardless!
```

---

## C — Code

### DFS (Recursive)

```javascript
function minDepth(root) {
  if (!root) return 0;
  
  // ⚠️ Only LEFT child → must go RIGHT!
  if (!root.left) return 1 + minDepth(root.right);
  
  // ⚠️ Only RIGHT child → must go LEFT!
  if (!root.right) return 1 + minDepth(root.left);
  
  // Both children → take minimum!
  return 1 + Math.min(minDepth(root.left), minDepth(root.right));
}
```

> 🎙️ *"The key: I handle the one-child cases FIRST, before the min. This prevents null being treated as depth 0."*

### BFS (Often Better!)

```javascript
function minDepthBFS(root) {
  if (!root) return 0;
  const queue = [root];
  let depth = 0;
  
  while (queue.length > 0) {
    depth++;
    const size = queue.length;
    for (let i = 0; i < size; i++) {
      const node = queue.shift();
      // First LEAF found = minimum depth!
      if (!node.left && !node.right) return depth;
      if (node.left) queue.push(node.left);
      if (node.right) queue.push(node.right);
    }
  }
}
```

> 🎙️ *"BFS is elegant: the first leaf I encounter in level-order IS the shallowest, guaranteed. I can return immediately!"*

### Trace DFS:

```
     1
      \
       2
        \
         3

  minDepth(1):
    root.left = null! → return 1 + minDepth(2)
  minDepth(2):
    root.left = null! → return 1 + minDepth(3)
  minDepth(3):
    leaf! left=null, right=null
    → both null checks trigger? NO!
    → !root.left → return 1 + minDepth(null) = 1 + 0 = 1
    Wait, that's wrong. Let me re-think...
    
  Actually: node 3 has NO left AND NO right.
  Check !root.left → true → return 1 + minDepth(null) = 1
  
  But IS that correct? Node 3 is a leaf, depth should be 1. ✅
  
  Back: minDepth(2) = 1 + 1 = 2
  Back: minDepth(1) = 1 + 2 = 3 ✅
```

---

## T — Test

| Test | Input | Expected | Trap |
|---|---|---|---|
| Balanced | `[3,9,20,null,null,15,7]` | 2 | Normal |
| Right-skewed | `[1,null,2,null,3]` | **3** | ⚠️ NOT 1! |
| Left-skewed | `[1,2,null,3]` | **3** | Same trap! |
| Null | null | 0 | Edge |
| Single | `[1]` | 1 | Leaf = root |

---

## O — Optimize

```
┌────────────┬──────────┬──────────┐
│            │ DFS      │ BFS      │
├────────────┼──────────┼──────────┤
│ Time       │ O(n)     │ O(n)     │
│ Best case  │ O(n)     │ O(1)!    │ BFS stops at first leaf!
│ Space      │ O(h)     │ O(w)     │ w = max width
└────────────┴──────────┴──────────┘
BFS is preferred for this problem!
```

---

## 🗣️ Interview Script

### 📌 Key Moment: Catching the Trap

> 🎙️ *"Wait — I can't just replace max with min from the max depth solution. If a node has only one child, the null side would give depth 0, and min would incorrectly pick that. A null is NOT a leaf — I have to actually traverse the existing child. Let me handle the one-child cases separately."*

🧠 *"Nói 'Wait — I can't just replace max with min' = show critical thinking, interviewer loves this!"*

### Follow-up

**Q: "When would you prefer BFS over DFS?"**

> 🎙️ *"BFS is better when the answer is NEAR THE ROOT — like minimum depth, or finding the first occurrence. It stops early. DFS is better when the answer is at the LEAVES or requires full traversal — like max depth or path sum."*

### Pattern

```
MIN DEPTH — TẠI SAO KHÓ HƠN MAX DEPTH:
═══════════════════════════════════════════════════════════════

  Max: max(0, something) = something   ← null = 0(0 never wins!)
  Min: min(0, something) = 0           ← null = 0 ALWAYS WINS! 
  
  → Max: null is harmless (never max!)
  → Min: null is DANGEROUS (always min!) 
  
  FIX: Handle one-child case separately!
  → "If only left: go left. If only right: go right."
```
