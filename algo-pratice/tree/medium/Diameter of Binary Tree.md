# ⭕ Diameter of Binary Tree — LeetCode #543 (Medium)

> 📖 Code: [Diameter of Binary Tree.js](./Diameter%20of%20Binary%20Tree.js)

---

## R — Repeat & Clarify

🧠 *"Pattern quan trọng: RETURN 1 thứ cho cha, UPDATE 1 thứ khác global! 'Dual-tracking' pattern."*

> 🎙️ *"Find the diameter — the LONGEST path between any two nodes, measured in EDGES (not nodes)."*

> 🎙️ *"Key clarifications:*
>
> *1. **Edges, not nodes**: path 1→2→3 has 2 edges.*
>
> *2. **Doesn't have to pass through root!** The longest path might be entirely in a subtree.*
>
> *3. **Any two nodes**: not just leaves — any pair."*

---

## E — Examples

```
VÍ DỤ 1 — QUA ROOT:
       1
      / \
     2   3       Diameter = 3 (edges: 4→2→1→3, or 5→2→1→3)
    / \          
   4   5         left height of 1 = 2
                 right height of 1 = 1
                 diameter through 1 = 2 + 1 = 3 ✅

VÍ DỤ 2 — KHÔNG QUA ROOT!!! ⚠️
       1
      /
     2           Diameter = 3 (edges: 5→3→2→4, entirely in LEFT subtree!)
    / \          KHÔNG đi qua root 1!
   3   4
  /
 5

  height(3) = 2, height(4) = 1
  diameter through 2 = 2 + 1 = 3
  diameter through 1 = 3 + 0 = 3 (same, but right is 0)
  Answer = 3

VÍ DỤ 3: Single node → 0 (no edges)
VÍ DỤ 4: Two nodes → 1 (one edge)
```

---

## A — Approach

> 🎙️ *"At each node, the LONGEST PATH THROUGH IT is leftHeight + rightHeight. I compute heights recursively but at each node, I ALSO update a global diameter. This is the 'dual-tracking' pattern: return one thing (height), track another (diameter)."*

```
DUAL-TRACKING PATTERN:
═══════════════════════════════════════════════════════════════

  Tại mỗi node: CÁI CẦN? CÁI TRẢ VỀ?
  
  height(node):
    Compute:  left = height(left), right = height(right)
    RETURN:   1 + max(left, right)    ← height cho CHA!
    UPDATE:   diameter = max(diameter, left + right)  ← global!
    
  Tại sao không return diameter?
  → CHA cần HEIGHT để tính diameter CỦA NÓ!
  → Nếu return diameter, CHA không biết height!
  
  TL;DR: cha cần height, bạn cần diameter → track cả 2!
```

---

## C — Code

```javascript
function diameterOfBinaryTree(root) {
  let diameter = 0;
  
  function height(node) {
    if (!node) return 0;
    
    const left = height(node.left);    // height left subtree
    const right = height(node.right);  // height right subtree
    
    // UPDATE: longest path through THIS node
    diameter = Math.max(diameter, left + right);
    
    // RETURN: height for parent
    return 1 + Math.max(left, right);
  }
  
  height(root);
  return diameter;
}
```

> 🎙️ *"Every node does O(1) work: compute diameter through it and return height. The global variable captures the maximum diameter seen across ALL nodes."*

### Trace:

```
       1
      / \
     2   3
    / \
   4   5

  height(4) = 1, height(5) = 1
  
  height(2):
    left=1, right=1
    diameter = max(0, 1+1) = 2    ← path 4→2→5
    return 1+max(1,1) = 2
  
  height(3) = 1
  
  height(1):
    left=2, right=1
    diameter = max(2, 2+1) = 3    ← path 4→2→1→3 (or 5→2→1→3)
    return 1+max(2,1) = 3
  
  Answer: diameter = 3 ✅
```

---

## T — Test

| Test | Tree | Diameter | Trap |
|---|---|---|---|
| Through root | `[1,2,3,4,5]` | 3 | Normal |
| NOT through root | `[1,2,null,3,4,5]` | 3 | ⚠️ Must track global! |
| Single | `[1]` | 0 | No edges |
| Straight line | `[1,2,null,3]` | 2 | Skewed |
| Null | null | 0 | Edge |

---

## O — Optimize

```
┌────────────┬──────────────────────────────────┐
│ Time       │ O(n) — 1 DFS, visit all nodes   │
│ Space      │ O(h) — recursion stack           │
│ DFS passes │ 1 (not 2!)                       │
│ Optimal?   │ YES ✅                            │
└────────────┴──────────────────────────────────┘

❌ Naive: 2 passes (height + diameter separately) = O(n)
         nhưng 2 DFS = unnecessary! 1 DFS đủ!
```

---

## 🗣️ Interview Script

### 📌 Key Insight to Verbalize

> 🎙️ *"The trick is that height and diameter are RELATED. At each node, diameter = leftH + rightH, and height = 1 + max(leftH, rightH). Since both use the same values, I can compute BOTH in a single DFS. I return height for the parent's use, but update diameter globally for my answer."*

### Follow-up

**Q: "Can the diameter be computed without a global variable?"**

> 🎙️ *"Yes, I can return a tuple [height, maxDiameter] from each node:*
> ```javascript
> function dfs(node) {
>   if (!node) return [0, 0]; // [height, diameter]
>   const [lh, ld] = dfs(node.left);
>   const [rh, rd] = dfs(node.right);
>   const h = 1 + Math.max(lh, rh);
>   const d = Math.max(ld, rd, lh + rh);
>   return [h, d];
> }
> ```
> *This avoids the global variable — more functional style."*

### Pattern

```
"DUAL-TRACKING" PATTERN — XUẤT HIỆN RẤT NHIỀU!
═══════════════════════════════════════════════════════════════

  ┌────────────────────┬──────────────┬──────────────────┐
  │ Problem            │ Return       │ Track global     │
  ├────────────────────┼──────────────┼──────────────────┤
  │ #543 Diameter      │ height       │ diameter         │
  │ #563 Tilt          │ sum          │ tilt             │
  │ #124 Max Path Sum  │ max gain     │ max path sum     │
  │ #110 Balanced      │ height       │ isBalanced       │
  │ #333 Largest BST   │ [isBST,m,M] │ max size         │
  │ #250 Univalue      │ isUnival     │ count            │
  └────────────────────┴──────────────┴──────────────────┘

  Pattern: DFS returns one value UP to parent,
           but updates a DIFFERENT value globally!
```
