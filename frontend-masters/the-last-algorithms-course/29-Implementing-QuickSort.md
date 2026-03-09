# The Last Algorithms Course You'll Need — Phần 29: Implementing QuickSort — "Partition + qs(), MIT Battlecode Story, First Try!"

> 📅 2026-03-09 · ⏱ 25 phút đọc
>
> Nguồn: Frontend Masters — ThePrimeagen
> Bài: Implementing QuickSort — "Two functions: partition (weak sort) + qs (recursion), lo-1 idx trick, MIT Battlecode stack-based QS story!"
> Độ khó: ⭐️⭐️⭐️⭐️⭐️ | Implementation — complete QuickSort, partition with idx trick, iterative variant story!

---

## Mục Lục

| #   | Phần                                                      |
| --- | --------------------------------------------------------- |
| 1   | Two Functions — "partition() + qs()!"                     |
| 2   | Partition — "Walk, Compare, Swap, Place Pivot!"           |
| 3   | QuickSort — "Base Case + Recurse Two Sides!"              |
| 4   | The lo-1 Trick — "Always Forget This One!" 😅             |
| 5   | MIT Battlecode Story — "10,000 Bytecode, Stack-Based QS!" |
| 6   | "First Try!" — "Complete Confidence!" 😂                  |
| 7   | Tự Implement: Complete QuickSort                          |

---

## §1. Two Functions — "partition() + qs()!"

> Prime: _"Often when you see QuickSort, it's split into two functions. Partition produces the pivot index and moves items. QuickSort does the bookkeeping — base case and recursion."_

```
TWO FUNCTIONS:
═══════════════════════════════════════════════════════════════

  sort(arr):
    qs(arr, 0, arr.length - 1)    ← inclusive high!

  qs(arr, lo, hi):
    if lo >= hi → return (base case!)
    pivotIdx = partition(arr, lo, hi)
    qs(arr, lo, pivotIdx - 1)     ← left side!
    qs(arr, pivotIdx + 1, hi)     ← right side!

  partition(arr, lo, hi):
    pivot = arr[hi]               ← pick last element!
    idx = lo - 1                  ← before the range!
    walk from lo to hi-1, swap smaller to front!
    place pivot at idx+1!
    return pivot index!
```

---

## §2. Partition — "Walk, Compare, Swap, Place Pivot!"

```typescript
function partition(arr: number[], lo: number, hi: number): number {
  const pivot = arr[hi]; // pick last element!
  let idx = lo - 1; // before the range!

  // Walk and weak sort!
  for (let i = lo; i < hi; i++) {
    if (arr[i] <= pivot) {
      idx++;
      // Swap arr[i] and arr[idx]!
      const tmp = arr[i];
      arr[i] = arr[idx];
      arr[idx] = tmp;
    }
  }

  // Place pivot in correct position!
  idx++;
  arr[hi] = arr[idx];
  arr[idx] = pivot;

  return idx; // pivot index!
}
```

### Walkthrough!

```
PARTITION WALKTHROUGH:
═══════════════════════════════════════════════════════════════

  arr = [8, 7, 6, 4, 5]   pivot = 5, idx = -1

  i=0: 8 > 5 → skip
  i=1: 7 > 5 → skip
  i=2: 6 > 5 → skip
  i=3: 4 ≤ 5 → idx=0, swap arr[0]↔arr[3]
       [4, 7, 6, 8, 5]

  Done! Place pivot:
  idx=1, swap arr[1]↔arr[4]
  [4, 5, 6, 8, 7]
       ↑ pivot at idx=1! ✅

  Left:  [4]     → all ≤ 5!
  Right: [6,8,7] → all > 5!
```

---

## §3. QuickSort — "Base Case + Recurse Two Sides!"

```typescript
function qs(arr: number[], lo: number, hi: number): void {
  // Base case: nothing to sort!
  if (lo >= hi) return;

  // Partition and get pivot index!
  const pivotIdx = partition(arr, lo, hi);

  // Recurse left (exclude pivot!)
  qs(arr, lo, pivotIdx - 1);

  // Recurse right (exclude pivot!)
  qs(arr, pivotIdx + 1, hi);
}

// Entry point!
function sort(arr: number[]): void {
  qs(arr, 0, arr.length - 1); // inclusive high!
}
```

---

## §4. The lo-1 Trick — "Always Forget This One!" 😅

> Prime: _"Most pseudocode creates index at negative one. But since we're doing sub-sorts on different spots within the array, we gotta go lo - 1. I ALWAYS forget to do that."_

```
THE TRICK:
═══════════════════════════════════════════════════════════════

  Full array partition: idx = -1    (= 0 - 1)
  Sub-array [5..9]:     idx = 4     (= 5 - 1)
  Sub-array [3..7]:     idx = 2     (= 3 - 1)

  Without lo-1 → items get placed at wrong positions!
  "That's one of the ones that got me multiple times." — Prime
```

---

## §5. MIT Battlecode Story — "10,000 Bytecode, Stack-Based QS!"

> Prime: _"I was on the first non-MIT team to make it to MIT's final finalist in Battlecode. You program simulation robots that fight — like StarCraft but for people that aren't smart."_

### The problem!

_"You only get 10,000 bytecode operations per turn. Within 5 elements, the robot would come out and just SIT THERE for 20 frames. Dead in the water."_

### The solution!

_"This is just a TREE filled with states. You don't have to do this recursively — you just need a STACK. Each turn: how much computation left? Below 1,000? Stop sorting, do other things."_

```
ITERATIVE QUICKSORT WITH STACK:
═══════════════════════════════════════════════════════════════

  stack = [(0, arr.length-1)]

  Per turn:
  while (stack not empty AND bytecodes > 1000):
    pop (lo, hi)
    pivotIdx = partition(arr, lo, hi)
    push (lo, pivotIdx-1)
    push (pivotIdx+1, hi)

  Next turn: continue from stack!

  "These things DO become useful." — Prime
```

_"We got 13th — which means we lost in the finals right away."_ 😂

---

## §6. "First Try!" — "Complete Confidence!" 😂

Prime: _"Do we feel like I've gotten this first try? Complete confidence. Look at that, we got it. First try."_

_"All programming eventually leads to trees. This is just a fact of life."_

---

## §7. Tự Implement: Complete QuickSort

```javascript
// ═══ QuickSort — Complete ═══

function partition(arr, lo, hi) {
  const pivot = arr[hi];
  let idx = lo - 1;

  for (let i = lo; i < hi; i++) {
    if (arr[i] <= pivot) {
      idx++;
      // Swap!
      const tmp = arr[i];
      arr[i] = arr[idx];
      arr[idx] = tmp;
    }
  }

  // Place pivot!
  idx++;
  arr[hi] = arr[idx];
  arr[idx] = pivot;

  return idx;
}

function qs(arr, lo, hi) {
  if (lo >= hi) return;

  const pivotIdx = partition(arr, lo, hi);
  qs(arr, lo, pivotIdx - 1);
  qs(arr, pivotIdx + 1, hi);
}

function quickSort(arr) {
  qs(arr, 0, arr.length - 1);
}

// Demo!
console.log("═══ QUICKSORT ═══\n");

const arr = [9, 3, 7, 4, 69, 420, 42, 1, 8, 2, 6, 5];
console.log("Before:", [...arr]);
quickSort(arr);
console.log("After: ", arr);

// Test edge cases
const tests = [
  { name: "Already sorted", arr: [1, 2, 3, 4, 5] },
  { name: "Reverse sorted", arr: [5, 4, 3, 2, 1] },
  { name: "Single element", arr: [42] },
  { name: "Empty", arr: [] },
  { name: "Duplicates", arr: [3, 1, 4, 1, 5, 9, 2, 6, 5, 3] },
];

console.log("\n═══ EDGE CASES ═══\n");
tests.forEach((t) => {
  const a = [...t.arr];
  quickSort(a);
  console.log(`${t.name}: [${t.arr}] → [${a}]`);
});

// Visualize partition
console.log("\n═══ PARTITION VISUALIZATION ═══\n");
const demo = [8, 7, 6, 4, 5];
console.log("Before:", [...demo]);
const pivotIdx = partition(demo, 0, demo.length - 1);
console.log("After: ", demo);
console.log("Pivot idx:", pivotIdx, "value:", demo[pivotIdx]);
console.log("Left (≤5):", demo.slice(0, pivotIdx));
console.log("Right (>5):", demo.slice(pivotIdx + 1));

console.log("\n✅ Best: O(N log N), Worst: O(N²)!");
console.log("✅ In-place sorting — no extra arrays!");
console.log("✅ Simpler to implement than MergeSort!");
```

---

## Checklist

```
[ ] Two functions: partition() + qs()!
[ ] Partition: pick last, walk, swap smaller to front!
[ ] idx = lo - 1 (not -1!) — sub-array trick!
[ ] Place pivot: idx++, swap with hi!
[ ] qs: base case lo >= hi, recurse two sides!
[ ] Exclude pivot from recursion (pivotIdx-1, pivotIdx+1)!
[ ] Inclusive high in this implementation!
[ ] MIT Battlecode: stack-based iterative variant!
[ ] "All programming eventually leads to trees" — Prime
TIẾP THEO → Phần 30: Trees!
```
