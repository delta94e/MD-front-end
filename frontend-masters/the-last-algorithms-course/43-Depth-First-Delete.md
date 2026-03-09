# The Last Algorithms Course You'll Need — Phần 43: Depth First Delete — "4 Cases, Find Largest on Small Side, Linked List Operations!"

> 📅 2026-03-09 · ⏱ 25 phút đọc
>
> Nguồn: Frontend Masters — ThePrimeagen
> Bài: Depth First Delete — "4 deletion cases: no child, one child, two children (largest on small side OR smallest on large side), height-based choice!"
> Độ khó: ⭐️⭐️⭐️⭐️⭐️ | Hard — BST deletion, 4 cases, pointer manipulation, tree shrinking strategy!

---

## Mục Lục

| #   | Phần                                                 |
| --- | ---------------------------------------------------- |
| 1   | "By Far the Hardest Part!" — 4 Cases!                |
| 2   | Case 1: No Child — "Just Delete!"                    |
| 3   | Case 2: One Child — "Set Parent to Child!"           |
| 4   | Case 3: Two Children — "Find Largest on Small Side!" |
| 5   | Why It Works — "Largest on Small = Fits Both Sides!" |
| 6   | The Guarantee — "Only 0 or 1 Child!"                 |
| 7   | Which Side? — "Choose by Height!"                    |
| 8   | Tự Implement: BST Delete                             |

---

## §1. "By Far the Hardest Part!" — 4 Cases!

> Prime: _"Deletion is by far the hardest part to all of this."_

| Case | Condition       | Action                                 |
| ---- | --------------- | -------------------------------------- |
| 1    | No child (leaf) | Just delete!                           |
| 2    | One child       | Set parent → child (linked list!)      |
| 3    | Two children    | Find replacement node!                 |
| 4    | (Variant of 3)  | Largest on small OR smallest on large! |

---

## §2. Case 1: No Child — "Just Delete!"

```
CASE 1 — NO CHILD:
═══════════════════════════════════════════════════════════════

  Before:                After:
      (17)                  (17)
     /    \                /    \
   (15)   (50)           (15)   (50)
   /                     /
  (4)  ← delete!       null

  "No children → just remove it.
   Tree is still valid!" — Prime
```

---

## §3. Case 2: One Child — "Set Parent to Child!"

> Prime: _"This is a lot like a LINKED LIST operation. Breaking the parent, setting the pointer."_

```
CASE 2 — ONE CHILD:
═══════════════════════════════════════════════════════════════

  Before:                After:
      (17)                  (17)
     /    \                /    \
   (15)   (50)          (4)    (50)
   /
  (4)

  Delete 15 (has one child: 4):
  → Parent (17) now points to child (4)!
  → Just like removing a node from a linked list!
```

---

## §4. Case 3: Two Children — "Find Largest on Small Side!"

> Prime: _"If we can reduce our case to case 1 or 2, we've already solved it!"_

```
CASE 3 — TWO CHILDREN:
═══════════════════════════════════════════════════════════════

  Delete node (51):
          (51)  ← delete this!
         /    \
       (25)   (100)
       / \
     (7) (37)

  ❌ WRONG: Point parent to left child (25)
  → 100 is LOST! Entire right subtree gone! 💀

  ✅ CORRECT: Find LARGEST on SMALL side!
  → Go LEFT (small side): 25
  → Go RIGHT until null: 25 → 37
  → 37 is the LARGEST on the small side!
  → Replace 51 with 37!

  After:
          (37)  ← replaced!
         /    \
       (25)   (100)
       /
     (7)

  Everything left of 37: ≤ 37 ✅
  Everything right of 37: > 37 ✅ (100 > 37)
```

### OR: Find SMALLEST on LARGE side!

```
  Alternative: go RIGHT (100), go LEFT until null
  → 100 has no left child → 100 is smallest on large side!
  → Replace 51 with 100!

  After:
          (100)  ← replaced!
         /
       (25)
       / \
     (7) (37)

  Both are valid BSTs! Different shapes!
```

---

## §5. Why It Works — "Largest on Small = Fits Both Sides!"

```
WHY IT WORKS:
═══════════════════════════════════════════════════════════════

  Largest on small side (37):
  • 37 > everything else on left subtree ✅
    (because it's the LARGEST on that side!)
  • 37 < everything on right subtree ✅
    (because it was ON the small side!)

  Smallest on large side (100):
  • 100 < everything else on right subtree ✅
    (because it's the SMALLEST on that side!)
  • 100 > everything on left subtree ✅
    (because it was ON the large side!)

  "Both preserve the BST property!" — Prime
```

---

## §6. The Guarantee — "Only 0 or 1 Child!"

> Prime: _"When we go down and keep going right, we can GUARANTEE: it will either have only one or zero children."_

```
THE GUARANTEE:
═══════════════════════════════════════════════════════════════

  Find largest on small side:
  Go LEFT once, then go RIGHT until null!

       (51)
      /
    (25)
    / \
  (7) (37)  ← can't go right anymore!
      /       has 0 or 1 LEFT child only!
    (32)

  37 has no right child (that's why we stopped!)
  37 might have a left child (32) → Case 2!
  → We already know how to handle Case 2!

  "We reduce Case 3 to Case 1 or 2!" — Prime
```

---

## §7. Which Side? — "Choose by Height!"

> Prime: _"Why choose one over the other? Think HEIGHT. If you kept height info in each node, you could choose the TALLER side to shrink."_

```
HEIGHT-BASED CHOICE:
═══════════════════════════════════════════════════════════════

  Left height = 4       Right height = 2
       ↓                      ↓
  Go LEFT, find largest!  → Shrinks the taller side!
  → Tree becomes more balanced!

  "If you do your deletes right,
   you could shrink back up your tree." — Prime
```

---

## §8. Tự Implement: BST Delete

```javascript
// ═══ BST — Depth First Delete ═══

function findMin(node) {
  while (node.left) node = node.left;
  return node;
}

function findMax(node) {
  while (node.right) node = node.right;
  return node;
}

function deleteNode(node, value) {
  if (!node) return null;

  // Find the node to delete
  if (value > node.value) {
    node.right = deleteNode(node.right, value);
  } else if (value < node.value) {
    node.left = deleteNode(node.left, value);
  } else {
    // FOUND the node to delete!

    // Case 1: No child (leaf)
    if (!node.left && !node.right) {
      return null; // just remove!
    }

    // Case 2: One child
    if (!node.left) return node.right; // only right child!
    if (!node.right) return node.left; // only left child!

    // Case 3: Two children!
    // Find largest on small side (in-order predecessor)
    const replacement = findMax(node.left);
    node.value = replacement.value;
    node.left = deleteNode(node.left, replacement.value);
  }

  return node;
}

// Build BST
function insert(node, value) {
  if (!node) return { value, left: null, right: null };
  if (value > node.value) node.right = insert(node.right, value);
  else node.left = insert(node.left, value);
  return node;
}

function inOrder(node, r = []) {
  if (!node) return r;
  inOrder(node.left, r);
  r.push(node.value);
  inOrder(node.right, r);
  return r;
}

let bst = null;
[51, 25, 100, 7, 37, 75].forEach((v) => {
  bst = insert(bst, v);
});

console.log("═══ BST DELETE ═══\n");
console.log("Initial:", inOrder(bst)); // [7,25,37,51,75,100]

// Case 1: delete leaf
bst = deleteNode(bst, 7);
console.log("Delete 7 (leaf):", inOrder(bst)); // [25,37,51,75,100]

// Case 2: delete one child
bst = deleteNode(bst, 75);
console.log("Delete 75 (1 child):", inOrder(bst)); // [25,37,51,100]

// Case 3: delete two children (root!)
bst = deleteNode(bst, 51);
console.log("Delete 51 (2 children):", inOrder(bst)); // [25,37,100]

console.log("\n═══ 4 CASES ═══");
console.log("Case 1: No child → return null!");
console.log("Case 2: One child → return that child!");
console.log("Case 3: Two children → find replacement!");
console.log("  Option A: largest on small side!");
console.log("  Option B: smallest on large side!");
console.log("\n✅ Always reduces to Case 1 or 2!");
```

---

## Checklist

```
[ ] Case 1: no child → just delete (return null!)
[ ] Case 2: one child → parent points to child (linked list op!)
[ ] Case 3: two children → find replacement!
[ ] Option A: largest on small side (go left, then right until null!)
[ ] Option B: smallest on large side (go right, then left until null!)
[ ] Replacement node guaranteed 0 or 1 child!
[ ] Reduces Case 3 to Case 1 or 2!
[ ] Choose side by HEIGHT → shrinks taller subtree!
[ ] "By far the hardest part" — Prime
TIẾP THEO → Phần 44: Binary Search Tree Q&A!
```
