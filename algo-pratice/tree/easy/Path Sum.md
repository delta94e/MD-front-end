# 🎯 Path Sum — LeetCode #112 (Easy)

> 📖 Code: [Path Sum.js](./Path%20Sum.js)

---

## R — Repeat & Clarify

🧠 *"DFS trừ dần. Check ở leaf. Root-to-leaf path, không phải bất kỳ path nào."*

> 🎙️ *"Given a binary tree and a target sum, I need to determine if the tree has a root-to-leaf path where the sum of node values equals the target."*

> 🎙️ *"Let me clarify:*
>
> *1. **Root-to-LEAF only?** — Yes, the path must end at a leaf. Stopping at an internal node doesn't count.*
>
> *2. **Negative values?** — Node values can be negative, so I can't prune early.*
>
> *3. **Empty tree with target 0?** — Should return false (no path exists in empty tree)."*

🧠 *"Câu hỏi 'empty tree, target 0' = BẪY phổ biến. Null tree = KHÔNG CÓ path = false!"*

---

## E — Examples

```
VÍ DỤ 1:
       5
      / \
     4   8         targetSum = 22
    /   / \
   11  13  4       Paths:
  / \       \      5→4→11→7 = 27 ❌
 7   2       1     5→4→11→2 = 22 ✅ FOUND!
                   5→8→13   = 26 ❌
                   5→8→4→1  = 18 ❌

VÍ DỤ 2: root = [1,2,3], target = 5
     1
    / \           1+2 = 3 ❌
   2   3          1+3 = 4 ❌
                  → false

VÍ DỤ 3: root = null, target = 0 → false
  (no tree = no path!)

VÍ DỤ 4: root = [-2, null, -3], target = -5
    -2
      \          -2 + (-3) = -5 ✅ (negative values work!)
      -3
```

---

## A — Approach

> 🎙️ *"I see two ways to think about this:*
>
> ***Approach 1: Running sum (add up)** — Pass the current running sum down. At leaf, check if sum === target.*
>
> ***Approach 2: Remaining sum (subtract down)** — Subtract node value from target each step. At leaf, check if node.val === remaining.*
>
> *Approach 2 is cleaner — I only need to pass ONE parameter (remaining) instead of two (current sum + target)."*

```
SUBTRACT TRICK — TẠI SAO HAY HƠN?

  Target = 22, Path = 5→4→11→2

  Cách 1 (cộng):  sum=5, sum=9, sum=20, sum=22, 22===22 ✅
    → Phải truyền target VÀ sum!

  Cách 2 (trừ):   rem=22, rem=17, rem=13, rem=2, 2===2 ✅
    → Chỉ truyền remaining!
    → Ngắn hơn, ít parameter hơn!
```

---

## C — Code

```javascript
function hasPathSum(root, targetSum) {
  if (!root) return false;
  
  // Là LEAF? Check giá trị còn lại!
  if (!root.left && !root.right) {
    return root.val === targetSum;
  }
  
  // Trừ đi giá trị hiện tại, đi tiếp!
  const remaining = targetSum - root.val;
  return hasPathSum(root.left, remaining) || hasPathSum(root.right, remaining);
}
```

> 🎙️ *"Three key decisions:*
>
> *1. **Base case null → false**: empty tree has no path.*
>
> *2. **Leaf check**: both children are null → this is a leaf. Check if the node's value equals the remaining target.*
>
> *3. **OR not AND**: I only need ONE valid path. If left subtree has it, I'm done. Short-circuit evaluation means right subtree isn't even explored if left returns true."*

🧠 *"Nói 'short-circuit' = show mình hiểu runtime optimization!"*

### Trace:

```
hasPathSum(5, 22):  remaining = 22-5 = 17
  hasPathSum(4, 17):  remaining = 17-4 = 13
    hasPathSum(11, 13): remaining = 13-11 = 2
      hasPathSum(7, 2):  leaf! 7 === 2? NO → false
      hasPathSum(2, 2):  leaf! 2 === 2? YES → TRUE! ✅
    → true (short-circuit, skip right)
  → true
→ true ✅
```

---

## T — Test

| Test | Input | Target | Expected | Trap |
|---|---|---|---|---|
| Normal | `[5,4,8,11,null,13,4,7,2,null,null,null,1]` | 22 | true | Main case |
| No path | `[1,2,3]` | 5 | false | No valid path |
| Empty | null | 0 | **false** | ⚠️ Empty = no path! |
| Single match | `[1]` | 1 | true | Leaf = root |
| Single no match | `[1]` | 2 | false | Leaf ≠ target |
| Negative | `[-2,null,-3]` | -5 | true | Negative values |
| Internal sum | `[1,2]` | 1 | **false** | ⚠️ 1 matches but NOT leaf! |

🧠 *"Test 'Internal sum' = BẪY! Sum=1 tại root, nhưng root có con → KHÔNG PHẢI leaf!"*

---

## O — Optimize

```
┌────────────┬──────────┐
│ Time       │ O(n)     │ Visit each node at most once
│ Space      │ O(h)     │ Call stack depth
│ Best case  │ O(1)     │ Root is leaf with matching value
│ Optimal?   │ YES ✅    │ Must visit nodes to check paths
└────────────┴──────────┘
```

---

## 🗣️ Interview Script

### 📌 Follow-up Questions

**Q1: "What if you need ALL paths, not just true/false?" (LeetCode #113)**

> 🎙️ *"I'd collect paths using backtracking:*
> ```javascript
> function pathSum(root, target) {
>   const result = [], path = [];
>   function dfs(node, remaining) {
>     if (!node) return;
>     path.push(node.val);
>     if (!node.left && !node.right && node.val === remaining) {
>       result.push([...path]);  // copy path!
>     }
>     dfs(node.left, remaining - node.val);
>     dfs(node.right, remaining - node.val);
>     path.pop();  // BACKTRACK!
>   }
>   dfs(root, target);
>   return result;
> }
> ```
> *Key difference: I need to BACKTRACK (pop from path array). Strings auto-backtrack because they're immutable, but arrays are mutable!"*

**Q2: "What if the path can start/end anywhere?" (LeetCode #437)**

> 🎙️ *"That's Path Sum III. Much harder — I'd use prefix sum with a hash map. For each node, I compute the running sum and check if (runningSum - target) exists in my prefix map. O(n) time."*

### Pattern Recognition

```
PATH SUM FAMILY:
═══════════════════════════════════════════════════════════════

  ┌──────────────┬──────────────┬──────────────────────┐
  │ Problem      │ Constraint   │ Technique            │
  ├──────────────┼──────────────┼──────────────────────┤
  │ #112 (Easy)  │ root→leaf    │ DFS subtract         │
  │ #113 (Med)   │ ALL paths    │ DFS + backtrack      │
  │ #437 (Med)   │ ANY→ANY      │ Prefix sum + hashmap │
  │ #124 (Hard)  │ Max path sum │ DFS + global max     │
  └──────────────┴──────────────┴──────────────────────┘
```
