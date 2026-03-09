# The Last Algorithms Course You'll Need — Phần 41: Depth First Find — "BST, left ≤ node < right, Binary Search on a Tree!"

> 📅 2026-03-09 · ⏱ 25 phút đọc
>
> Nguồn: Frontend Masters — ThePrimeagen
> Bài: Depth First Find — "BST intro, one rule (left ≤ node < right), find = binary search on tree, DFS with ordering, value ranges at each node!"
> Độ khó: ⭐️⭐️⭐️⭐️ | Core — Binary Search Tree concept, find algorithm, QuickSort parallel, dynamic searching!

---

## Mục Lục

| #   | Phần                                                 |
| --- | ---------------------------------------------------- |
| 1   | BST — "One Rule at Every Node!"                      |
| 2   | "Looks Like QuickSort!" — "Pivot = Node!"            |
| 3   | Find — "Binary Search on a Tree!"                    |
| 4   | Pseudocode — "Base Case, Compare, Go Left or Right!" |
| 5   | Value Ranges — "Each Node Has a Valid Range!"        |
| 6   | Why BST? — "Dynamic Add/Remove + Quick Find!"        |
| 7   | Tự Implement: BST Find                               |

---

## §1. BST — "One Rule at Every Node!"

> Prime: _"The one rule that has to apply at EVERY node: left side is less than or equal to, right side is greater than."_

```
BST RULE:
═══════════════════════════════════════════════════════════════

         (17)
        /    \
   ≤ 17      > 17
     ↓         ↓
   (15)      (50)
   /   \     /   \
 (4)  (16) (26)  (...)
            /
          (18)

  At EVERY node:
  • Left subtree: all values ≤ node!
  • Right subtree: all values > node!
  • This rule applies RECURSIVELY!
```

---

## §2. "Looks Like QuickSort!" — "Pivot = Node!"

> Prime: _"What algorithm does this already sound like? QuickSort! We have a point — everything on one side is smaller, everything on the other is greater."_

```
QUICKSORT vs BST:
═══════════════════════════════════════════════════════════════

  QuickSort:
  [...smaller...] [pivot] [...larger...]

  BST:
       (pivot/node)
      /             \
  [≤ node]       [> node]

  "It's IDENTICAL in some sort of sense,
   and has a lot of the same characteristics!" — Prime
```

---

## §3. Find — "Binary Search on a Tree!"

> Prime: _"Find is effectively doing a simplified version of binary search on an array. It's much EASIER because you don't have to manage this lo and hi business."_

```
FIND 16 in BST:
═══════════════════════════════════════════════════════════════

         (17)
        /    \
     (15)    (50)
     /  \    /  \
   (4) (16)(26)  (...)

  Step 1: at 17 → 16 < 17 → go LEFT!
  Step 2: at 15 → 16 > 15 → go RIGHT!
  Step 3: at 16 → 16 === 16 → FOUND! ✅

  Only 3 steps for the whole tree!
```

---

## §4. Pseudocode — "Base Case, Compare, Go Left or Right!"

```
find(node, value):
═══════════════════════════════════════════════════════════════

  if (!node) return false        ← base case: not found!
  if (node.value === v) return true  ← found it!
  if (node.value < v):
    return find(node.right, v)   ← go to larger side!
  else:
    return find(node.left, v)    ← go to smaller side!
```

### TypeScript!

```typescript
function find(node: BinaryNode<number> | null, value: number): boolean {
  if (!node) return false;

  if (node.value === value) return true;

  if (node.value < value) {
    return find(node.right, value); // too small, go right!
  }

  return find(node.left, value); // too big, go left!
}
```

---

## §5. Value Ranges — "Each Node Has a Valid Range!"

> Prime: _"This node can ONLY exist within the values 26 through 50. It can't be any other value."_

```
VALUE RANGES:
═══════════════════════════════════════════════════════════════

         (17)          range: -∞ to +∞
        /    \
     (15)    (50)      15: -∞ to 17  |  50: 17 to +∞
     /  \    /
   (4) (16)(26)        4: -∞ to 15  |  16: 15 to 17  |  26: 17 to 50
            /
          (18)         18: 17 to 26

  "Can we put a node here? Only if it's in the valid range!" — Prime
```

### Repeated values!

> Prime: _"Imagine you had all fives — you'd create effectively a linked list and call it a tree."_

```
  All 5s (worst case):
  (5) → (5) → (5) → (5) → (5)
  That's just a linked list! 💀
```

---

## §6. Why BST? — "Dynamic Add/Remove + Quick Find!"

> Student: _"What's the functional use for this?"_
> Prime: _"Quick finding! And if you have a DYNAMICALLY CHANGING list, you're still able to search at a reasonable rate."_

| Operation | Array (sorted) | BST (balanced) |
| --------- | -------------- | -------------- |
| Find      | O(log N)       | O(log N)       |
| Insert    | O(N) — shift!  | O(log N)       |
| Delete    | O(N) — shift!  | O(log N)       |

> Prime: _"Just like a linked list, you can add anywhere at constant rate. But there's traversal costs."_

---

## §7. Tự Implement: BST Find

```javascript
// ═══ BST — Depth First Find ═══

function find(node, value) {
  // Base case: reached null → not found!
  if (!node) return false;

  // Found it!
  if (node.value === value) return true;

  // Too small → go to larger side (right)!
  if (node.value < value) {
    return find(node.right, value);
  }

  // Too big → go to smaller side (left)!
  return find(node.left, value);
}

// Build BST
const bst = {
  value: 17,
  left: {
    value: 15,
    left: { value: 4, left: null, right: null },
    right: { value: 16, left: null, right: null },
  },
  right: {
    value: 50,
    left: {
      value: 26,
      left: { value: 18, left: null, right: null },
      right: null,
    },
    right: null,
  },
};

console.log("═══ BST — DEPTH FIRST FIND ═══\n");
console.log("BST:");
console.log("       (17)");
console.log("      /    \\");
console.log("   (15)    (50)");
console.log("   /  \\    /");
console.log(" (4) (16)(26)");
console.log("          /");
console.log("        (18)");

console.log("\nfind(16):", find(bst, 16)); // true
console.log("find(18):", find(bst, 18)); // true
console.log("find(17):", find(bst, 17)); // true
console.log("find(99):", find(bst, 99)); // false
console.log("find(1):", find(bst, 1)); // false

console.log("\n═══ BST RULE ═══");
console.log("Left subtree: all values ≤ node!");
console.log("Right subtree: all values > node!");
console.log("Find: compare → go left or right → O(log N) balanced!");
console.log("\n✅ Like binary search, but on a tree — no lo/hi needed!");
```

---

## Checklist

```
[ ] BST rule: left ≤ node < right, at EVERY node!
[ ] Looks like QuickSort: pivot = each node!
[ ] Find: base case (null=false), compare, go left or right!
[ ] Much simpler than binary search on array (no lo/hi!)
[ ] Value ranges constrain what each position can hold!
[ ] Why BST: dynamic add/remove + quick find!
[ ] Repeated values → risk of linked-list shape!
[ ] Balanced BST → O(log N) find/insert/delete!
TIẾP THEO → Phần 42: BST Insert/Delete (coming soon!)
```
