# The Last Algorithms Course You'll Need — Phần 42: Depth First Insert — "Find Your Spot, Create Node, O(height)!"

> 📅 2026-03-09 · ⏱ 20 phút đọc
>
> Nguồn: Frontend Masters — ThePrimeagen
> Bài: Depth First Insert — "BST insert = find + create node at null, running time O(height) = O(log N) to O(N), AVL & Red-Black Trees balance!"
> Độ khó: ⭐️⭐️⭐️⭐️ | Core — BST insertion, running time analysis, balancing trees, mixing base case with recursion!

---

## Mục Lục

| #   | Phần                                                |
| --- | --------------------------------------------------- |
| 1   | Running Time of Find — "O(height), Not O(log N)!"   |
| 2   | Insert — "Find + Create Node at Null!"              |
| 3   | Insertion Walkthrough — "17 Into BST with Root 17!" |
| 4   | Pseudocode — "Check, Traverse or Insert!"           |
| 5   | The Goofy Part — "Base Case Mixed with Recursion!"  |
| 6   | AVL & Red-Black Trees — "Printer Colors!" 😂        |
| 7   | Tự Implement: BST Insert                            |

---

## §1. Running Time of Find — "O(height), Not O(log N)!"

> Prime: _"Your gut instinct is to say O(log N). It's not quite accurate. We measure it in O(height)."_

```
RUNNING TIME = O(height):
═══════════════════════════════════════════════════════════════

  BALANCED tree (height = log N):
         (17)
        /    \
     (15)    (50)         Find = O(log N)!
     /  \    /  \
   (4)(16)(26)(75)

  DEGENERATE tree (height = N):
  (4)
    \
    (15)                  Find = O(N)! 💀
      \
     (16)
       \
      (17)

  "Just like QuickSort went from N log N to N²,
   BST find goes from log N to N." — Prime
```

---

## §2. Insert — "Find + Create Node at Null!"

> Prime: _"Insertion is a version of find — we do the same traversal, we just keep going until we hit a point which is null."_

```
INSERT = FIND + CREATE:
═══════════════════════════════════════════════════════════════

  1. Start at root!
  2. Compare: go left or right!
  3. Keep going until you hit null!
  4. Create node at that null spot!

  "We DO NOT replace existing nodes.
   We always insert at a LEAF position!" — Prime
```

---

## §3. Insertion Walkthrough — "17 Into BST with Root 17!"

```
INSERT 17 into BST:
═══════════════════════════════════════════════════════════════

         (17)  ← root is 17!
        /    \
     (15)    (50)
     /  \    /
   (4)(16)(26)

  Step 1: at 17 → 17 ≤ 17 → go LEFT!
  Step 2: at 15 → 17 > 15 → go RIGHT!
  Step 3: at 16 → 17 > 16 → go RIGHT!
  Step 4: null! → CREATE NODE (17) here!

  After:
         (17)
        /    \
     (15)    (50)
     /  \    /
   (4)(16)(26)
         \
        (17)  ← inserted!

  "Long as we adhere to the principles,
   we can just insert it." — Prime
```

### Insert 18!

```
INSERT 18:
═══════════════════════════════════════════════════════════════

  Step 1: at 17 → 18 > 17 → go RIGHT!
  Step 2: at 50 → 18 < 50 → go LEFT!
  Step 3: at 26 → 18 < 26 → go LEFT!
  Step 4: null! → CREATE NODE (18) here!

  After: 18 is left child of 26!
```

---

## §4. Pseudocode — "Check, Traverse or Insert!"

```
insert(node, value):
═══════════════════════════════════════════════════════════════

  if node.value < value:         ← need to go RIGHT!
    if not node.right:
      node.right = createNode(value)  ← INSERT!
    else:
      insert(node.right, value)  ← keep traversing!

  else:                          ← need to go LEFT!
    if not node.left:
      node.left = createNode(value)   ← INSERT!
    else:
      insert(node.left, value)   ← keep traversing!
```

---

## §5. The Goofy Part — "Base Case Mixed with Recursion!"

> Prime: _"You have to mix the base case with the recursion step. You don't really like it — it gets more complicated. That's why this gets hairy really fast."_

```
THE GOOFY PART:
═══════════════════════════════════════════════════════════════

  Normal recursion:
  1. Base case (stop!)
  2. Recurse step (keep going!)
  → Clean separation!

  BST insert:
  1. Check direction (left or right?)
  2. Is next spot null? → INSERT (base case!)
  3. Not null? → RECURSE (keep going!)
  → Base case is INSIDE the recurse decision! 😵

  "It causes this goofiness that's harder to do." — Prime
```

---

## §6. AVL & Red-Black Trees — "Printer Colors!" 😂

> Prime: _"Red-Black Trees — the reason it's called that is because printers back in the 70s printed red and black PHENOMENALLY, and nothing else good. Getting named by legacy just hurts."_ 😂

| Tree Type     | Balance Strategy                             |
| ------------- | -------------------------------------------- |
| **AVL**       | Strict balance — height diff ≤ 1!            |
| **Red-Black** | Color rules — less strict but faster insert! |

> Prime: _"You could do a whole three-hour thing on different ways to balance a tree."_

---

## §7. Tự Implement: BST Insert

```javascript
// ═══ BST — Depth First Insert ═══

function insert(node, value) {
  // Going RIGHT (value is larger)!
  if (value > node.value) {
    if (!node.right) {
      node.right = { value, left: null, right: null };
    } else {
      insert(node.right, value);
    }
  }
  // Going LEFT (value is smaller or equal)!
  else {
    if (!node.left) {
      node.left = { value, left: null, right: null };
    } else {
      insert(node.left, value);
    }
  }
}

// Start with root
const bst = { value: 17, left: null, right: null };

// Insert values
[15, 50, 4, 16, 26].forEach((v) => insert(bst, v));

// Print tree (in-order = sorted!)
function inOrder(node, result = []) {
  if (!node) return result;
  inOrder(node.left, result);
  result.push(node.value);
  inOrder(node.right, result);
  return result;
}

console.log("═══ BST INSERT ═══\n");
console.log("Inserted: 17, 15, 50, 4, 16, 26");
console.log("In-order (sorted!):", inOrder(bst)); // [4,15,16,17,26,50]

// Insert duplicate
insert(bst, 17);
console.log("\nAfter insert 17 again:");
console.log("In-order:", inOrder(bst)); // [4,15,16,17,17,26,50]

// Insert 18
insert(bst, 18);
console.log("\nAfter insert 18:");
console.log("In-order:", inOrder(bst)); // [4,15,16,17,17,18,26,50]

// Find
function find(node, value) {
  if (!node) return false;
  if (node.value === value) return true;
  if (value > node.value) return find(node.right, value);
  return find(node.left, value);
}

console.log("\n═══ FIND ═══");
console.log("find(18):", find(bst, 18)); // true
console.log("find(99):", find(bst, 99)); // false

console.log("\n═══ RUNNING TIME ═══");
console.log("Find:   O(height) → O(log N) to O(N)!");
console.log("Insert: O(height) → O(log N) to O(N)!");
console.log("Balanced → O(log N), Degenerate → O(N)!");
console.log("\n✅ Insert = find + create node at null leaf!");
```

---

## Checklist

```
[ ] Find running time = O(height), NOT O(log N)!
[ ] O(height) = O(log N) balanced, O(N) degenerate!
[ ] Insert = find + create node at null!
[ ] Always insert at leaf position (never replace!)
[ ] Base case mixed with recursion step (goofy!)
[ ] Duplicates: go left (≤) — can create linked list!
[ ] AVL: strict balance. Red-Black: color rules!
[ ] "Printers in the 70s printed red and black phenomenally" — Prime 😂
TIẾP THEO → Phần 43: BST Delete / Depth First Delete!
```
