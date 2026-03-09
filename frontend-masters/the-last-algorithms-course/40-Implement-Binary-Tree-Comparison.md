# The Last Algorithms Course You'll Need — Phần 40: Implement Binary Tree Comparison — "3 Base Cases, Recurse Left && Right, Structural + Value!"

> 📅 2026-03-09 · ⏱ 20 phút đọc
>
> Nguồn: Frontend Masters — ThePrimeagen
> Bài: Implement Binary Tree Comparison — "3 base cases (both null=true, one null=false, values differ=false), recurse left && right, structural vs value check!"
> Độ khó: ⭐️⭐️⭐️⭐️ | Implementation — complete tree comparison, bubbling true/false back up, any node is a subtree!

---

## Mục Lục

| #   | Phần                                                              |
| --- | ----------------------------------------------------------------- |
| 1   | Signature — "This One Matches Recursion!"                         |
| 2   | Base Case 1 — "Both Null = Structurally Equal!"                   |
| 3   | Base Case 2 — "One Null = Structurally Different!"                |
| 4   | Base Case 3 — "Values Differ = Not Equal!"                        |
| 5   | Recurse — "compare(a.left, b.left) && compare(a.right, b.right)!" |
| 6   | Bubbling Up — "true && false = false, All The Way Up!"            |
| 7   | Why Two Null Checks? — "Structural vs Value!"                     |
| 8   | Tự Implement: Complete Tree Comparison                            |

---

## §1. Signature — "This One Matches Recursion!"

> Prime: _"The signature actually matches up with what you'd want to do in recursion. So I'm keeping this — I know I'm breaking from tradition."_

```typescript
function compare(
  a: BinaryNode<number> | null,
  b: BinaryNode<number> | null,
): boolean {
  // base cases + recurse step!
}
```

---

## §2. Base Case 1 — "Both Null = Structurally Equal!"

> Prime: _"If they're both null, we are currently EQUAL. We don't have to solve for the entire tree — that's what all of recursion combined is for."_

```typescript
// Both null → we arrived at the same empty spot together!
if (a === null && b === null) return true;
```

```
BOTH NULL = EQUAL:
═══════════════════════════════════════════════════════════════

  Tree A:        Tree B:
    (5)            (5)
   /   \          /   \
 null  null     null  null
  ↑                ↑
  Both null → true! ✅

  "We both cannot recurse any further.
   Structurally, we are the EXACT same." — Prime
```

---

## §3. Base Case 2 — "One Null = Structurally Different!"

> Prime: _"If just ONE of them is null — you are no longer equal because one of you is null and the other is hexadecimal 45."_

```typescript
// One null, one not → structural mismatch!
if (a === null || b === null) return false;
```

```
ONE NULL = DIFFERENT:
═══════════════════════════════════════════════════════════════

  Tree A:        Tree B:
    (5)            (5)
   /   \          /   \
 (3)  null      null  (3)
  ↑                ↑
  One is node, other is null → false! ❌

  "We traversed to the same point
   and have DIFFERENT structure." — Prime
```

---

## §4. Base Case 3 — "Values Differ = Not Equal!"

```typescript
// Values don't match!
if (a.value !== b.value) return false;
```

---

## §5. Recurse — "compare(a.left, b.left) && compare(a.right, b.right)!"

> Prime: _"We don't need to check if they're nulls — that's what our BASE CASES are for."_

```typescript
return compare(a.left, b.left) && compare(a.right, b.right);
```

### Complete function!

```typescript
function compare(
  a: BinaryNode<number> | null,
  b: BinaryNode<number> | null,
): boolean {
  // Structural check: both null!
  if (a === null && b === null) return true;

  // Structural check: one null!
  if (a === null || b === null) return false;

  // Value check!
  if (a.value !== b.value) return false;

  // Recurse both sides!
  return compare(a.left, b.left) && compare(a.right, b.right);
}
```

---

## §6. Bubbling Up — "true && false = false, All The Way Up!"

> Prime: _"So long as we only hit 'return true', it keeps bubbling back up as true all the way."_

```
BUBBLING UP TRUE/FALSE:
═══════════════════════════════════════════════════════════════

  Tree A:           Tree B:
      (7)               (7)
     /   \             /   \
   (7)   (9)        (7)   (9)
          \                 \
         (14)              (16)  ← different value!

  compare(7, 7):
    left: compare(7, 7):
      left: compare(null, null) → true ✅
      right: compare(null, null) → true ✅
      true && true = true ✅
    right: compare(9, 9):
      left: compare(null, null) → true ✅
      right: compare(14, 16) → values differ → false ❌
      true && false = false ❌
    true && false = false ❌

  "One subtree is false → makes the entire tree false!" — Prime
```

---

## §7. Why Two Null Checks? — "Structural vs Value!"

> Prime: _"I wanted to make it obvious: the first check is STRUCTURAL, the second is structural, the third is a VALUE check."_

```
THREE BASE CASES:
═══════════════════════════════════════════════════════════════

  1. a===null && b===null → STRUCTURAL ✅ (same empty spot!)
  2. a===null || b===null → STRUCTURAL ❌ (different shape!)
  3. a.value !== b.value  → VALUE ❌ (different data!)

  "In JavaScript, we COULD use optional chaining:
   a?.value === b?.value
   This handles both structural and value at once.
   But I wanted to make it EXPLICIT." — Prime
```

> Prime: _"Any node is in itself a tree. Because it's a point which has children. That's what makes this so useful."_

---

## §8. Tự Implement: Complete Tree Comparison

```javascript
// ═══ Binary Tree Comparison ═══

function compare(a, b) {
  // Base case 1: both null → structurally equal here!
  if (a === null && b === null) return true;

  // Base case 2: one null → structural mismatch!
  if (a === null || b === null) return false;

  // Base case 3: values differ!
  if (a.value !== b.value) return false;

  // Recurse: check both subtrees!
  return compare(a.left, b.left) && compare(a.right, b.right);
}

// Tree A
const treeA = {
  value: 7,
  left: {
    value: 7,
    left: null,
    right: null,
  },
  right: {
    value: 9,
    left: null,
    right: { value: 14, left: null, right: null },
  },
};

// Tree B — same!
const treeB = {
  value: 7,
  left: {
    value: 7,
    left: null,
    right: null,
  },
  right: {
    value: 9,
    left: null,
    right: { value: 14, left: null, right: null },
  },
};

// Tree C — different value!
const treeC = {
  value: 7,
  left: {
    value: 7,
    left: null,
    right: null,
  },
  right: {
    value: 9,
    left: null,
    right: { value: 16, left: null, right: null },
  },
};

// Tree D — different structure!
const treeD = {
  value: 7,
  left: {
    value: 7,
    left: null,
    right: null,
  },
  right: {
    value: 9,
    left: { value: 14, left: null, right: null },
    right: null,
  },
};

console.log("═══ TREE COMPARISON ═══\n");
console.log("A vs B (same):", compare(treeA, treeB)); // true
console.log("A vs C (diff value):", compare(treeA, treeC)); // false
console.log("A vs D (diff struct):", compare(treeA, treeD)); // false
console.log("null vs null:", compare(null, null)); // true
console.log("A vs null:", compare(treeA, null)); // false

console.log("\n═══ 3 BASE CASES ═══");
console.log("1. Both null → true (structural match!)");
console.log("2. One null → false (structural mismatch!)");
console.log("3. Values differ → false!");
console.log("4. Recurse: left && right!");

console.log("\n✅ DFS comparison preserves shape!");
console.log("✅ Any node is a subtree in itself!");
```

---

## Checklist

```
[ ] Base case 1: both null → true (same empty spot!)
[ ] Base case 2: one null → false (structural mismatch!)
[ ] Base case 3: values differ → false!
[ ] Recurse: compare(a.left,b.left) && compare(a.right,b.right)!
[ ] true && false = false → bubbles all the way up!
[ ] Two null checks = structural, value check = separate!
[ ] Any node is itself a tree (subtree!)
[ ] "Base case solves the simple problem, recursion handles the rest" — Prime
TIẾP THEO → Phần 41: Binary Search Tree (BST)!
```
