# The Last Algorithms Course You'll Need — Phần 45: Implement Depth First Search on BST — "search(), Two Base Cases, One Side Only, Easier Than Array!"

> 📅 2026-03-09 · ⏱ 15 phút đọc
>
> Nguồn: Frontend Masters — ThePrimeagen
> Bài: Implement DFS on BST — "search() helper, base case null=false + value=true, go left OR right (never both!), easier than binary search on array!"
> Độ khó: ⭐️⭐️⭐️ | Implementation — BST search, comparison with array binary search, only one side per step!

---

## Mục Lục

| #   | Phần                                                         |
| --- | ------------------------------------------------------------ |
| 1   | Setup — "search() Helper Function!"                          |
| 2   | Base Case 1 — "Null = Not Found!"                            |
| 3   | Base Case 2 — "Value = Found!"                               |
| 4   | Traverse — "One Side Only, Never Both!"                      |
| 5   | The Mental Trick — "Symbol Points the Way!"                  |
| 6   | BST Search vs Array Binary Search — "Much Easier on a Tree!" |
| 7   | Tự Implement: DFS on BST                                     |

---

## §1. Setup — "search() Helper Function!"

> Prime: _"We're gonna write a second function. Let's call it search."_

```typescript
function search(curr: BinaryNode<number> | null, needle: number): boolean {
  // base cases + traverse!
}

export default function dfs(head: BinaryNode<number>, needle: number): boolean {
  return search(head, needle);
}
```

---

## §2. Base Case 1 — "Null = Not Found!"

> Prime: _"If not current, return false. We've made it to the bottom. It's null, therefore our value is not there."_

```typescript
if (!curr) return false;
```

---

## §3. Base Case 2 — "Value = Found!"

> Prime: _"If current.value equals the needle, we've found the value. No need to keep traversing — it's always in the LAST place you looked."_ 😂

```typescript
if (curr.value === needle) return true;
```

---

## §4. Traverse — "One Side Only, Never Both!"

> Prime: _"Notice that we're NOT doing both sides — we're only doing ONE side or the other. That is the beauty of a binary search — we're reducing our search space by HALF every single step."_

```typescript
if (curr.value < needle) {
  return search(curr.right, needle); // go larger side!
}

return search(curr.left, needle); // go smaller side!
```

### Complete function!

```typescript
function search(curr: BinaryNode<number> | null, needle: number): boolean {
  if (!curr) return false;
  if (curr.value === needle) return true;

  if (curr.value < needle) {
    return search(curr.right, needle);
  }

  return search(curr.left, needle);
}
```

---

## §5. The Mental Trick — "Symbol Points the Way!"

> Prime: _"I always do this: write the value then the symbol — the symbol MATCHES the direction!"_

```
MENTAL TRICK:
═══════════════════════════════════════════════════════════════

  curr.value < needle
              ↑
              < points LEFT to code...
              but means "go RIGHT" (need larger!)

  Better way to think:

  if (curr.value < needle) → curr is too SMALL → go RIGHT!
  else                     → curr is too BIG   → go LEFT!
```

---

## §6. BST Search vs Array Binary Search — "Much Easier on a Tree!"

> Prime: _"Binary search was MUCH harder on an array. On a tree, it's easier — no lo/hi management!"_

```
COMPARISON:
═══════════════════════════════════════════════════════════════

  Array binary search:
  ┌──────────────────────────────┐
  │ lo=0  mid=4  hi=8            │
  │ arr[mid] < needle → lo=mid+1 │
  │ Managing lo, hi, mid manually│
  │ Edge cases: off by one!      │
  └──────────────────────────────┘

  BST search:
  ┌──────────────────────────────┐
  │ if (!curr) return false      │
  │ if (curr.value === needle)   │
  │   return true                │
  │ go left or go right!         │
  │ No lo/hi needed!             │
  └──────────────────────────────┘

  Array: guaranteed O(log N) — always perfect split!
  BST:   O(height) — depends on balance!

  "The node IS the midpoint. Lows and highs
   are predetermined for us." — Prime
```

---

## §7. Tự Implement: DFS on BST

```javascript
// ═══ DFS on BST — Implementation ═══

function search(curr, needle) {
  // Base case 1: null → not found!
  if (!curr) return false;

  // Base case 2: found it!
  if (curr.value === needle) return true;

  // Traverse: one side only!
  if (curr.value < needle) {
    return search(curr.right, needle); // go right (larger)!
  }

  return search(curr.left, needle); // go left (smaller)!
}

function dfs(head, needle) {
  return search(head, needle);
}

// Build BST
function insert(node, value) {
  if (!node) return { value, left: null, right: null };
  if (value > node.value) node.right = insert(node.right, value);
  else node.left = insert(node.left, value);
  return node;
}

let bst = null;
[17, 15, 50, 4, 16, 26, 100].forEach((v) => {
  bst = insert(bst, v);
});

console.log("═══ DFS ON BST ═══\n");
console.log("BST:");
console.log("       (17)");
console.log("      /    \\");
console.log("   (15)    (50)");
console.log("   /  \\    /   \\");
console.log(" (4)(16)(26) (100)");

console.log("\nSearch:");
console.log("dfs(16):", dfs(bst, 16)); // true
console.log("dfs(100):", dfs(bst, 100)); // true
console.log("dfs(4):", dfs(bst, 4)); // true
console.log("dfs(99):", dfs(bst, 99)); // false
console.log("dfs(0):", dfs(bst, 0)); // false

console.log("\n═══ KEY DIFFERENCES ═══");
console.log("Array binary search: manage lo/hi/mid manually!");
console.log("BST search: just go left or right — much simpler!");
console.log("Array: always O(log N) — perfect split!");
console.log("BST: O(height) — depends on balance!");
console.log("\n✅ Only ONE side per step — halving search space!");
```

---

## Checklist

```
[ ] search() helper: takes curr + needle → boolean!
[ ] Base case 1: null → false (not found!)
[ ] Base case 2: value match → true (found!)
[ ] Traverse: go right if curr < needle, else go left!
[ ] ONE side only — never both!
[ ] Easier than array binary search (no lo/hi!)
[ ] Array = O(log N) guaranteed. BST = O(height)!
[ ] "It's always in the last place you looked" — Prime 😂
TIẾP THEO → Phần 46: Heap — Weak Ordering!
```
