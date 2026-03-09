# The Last Algorithms Course You'll Need — Phần 11: Bubble Sort — "3 Lines of Code, Plane Crashing, Gauss's Story, O(N²)!"

> 📅 2026-03-08 · ⏱ 30 phút đọc
>
> Nguồn: Frontend Masters — ThePrimeagen
> Bài: Bubble Sort — "Simplest sort, largest bubbles to end, progressively smaller iterations, Gauss formula, O(N²)!"
> Độ khó: ⭐️⭐️⭐️ | Sorting — bubble sort visualization, Gauss story, Big O derivation!

---

## Mục Lục

| #   | Phần                                                    |
| --- | ------------------------------------------------------- |
| 1   | "Write Bubble Sort on a Crashing Plane!" — Ray Babcock  |
| 2   | Sorted Array Definition — "Xi ≤ Xi+1!"                  |
| 3   | How Bubble Sort Works — "Am I Larger? Swap!"            |
| 4   | Walkthrough — "Largest Bubbles to the End!"             |
| 5   | Progressively Smaller — "N, N-1, N-2, ... 1!"           |
| 6   | Gauss's Story — "The Asshole in Third Grade!"           |
| 7   | Big O Derivation — "N(N+1)/2 → O(N²)!"                  |
| 8   | Tự Implement: Bubble Sort                               |
| 9   | 🔬 Deep Analysis — Why N² and Drop Insignificant Values |

---

## §1. "Write Bubble Sort on a Crashing Plane!" — Ray Babcock

> Prime: _"Ray Babcock once said — if an airplane was going down, stewardess kicks the curtain between first class and economy, and she said 'Quickly, we need someone that can write a sorting algorithm or this plane will crash.' You could write bubble sort under a plane crashing. It is THAT simple."_

### 3 lines of code!

Prime: _"Bubble sort is not only really easy to visualize, it's also THREE LINES OF CODE. An extremely simple algorithm."_

_"Normally it starts with insertion sort — but the example always sucks, it's like a card deck. I still don't know how to sort cards."_

---

## §2. Sorted Array Definition — "Xi ≤ Xi+1!"

> Prime: _"The mathy definition — any Xi is going to be ≤ any Xi+1. This is true for the ENTIRE array. That's how you know an array is sorted."_

### Formal definition!

```
SORTED ARRAY:
═══════════════════════════════════════════════════════════════

  For ALL i: array[i] ≤ array[i + 1]

  ✅ Sorted:      [1, 2, 3, 4, 5]
     1≤2 ✅  2≤3 ✅  3≤4 ✅  4≤5 ✅

  ❌ Unsorted:    [1, 3, 7, 4, 2]
     1≤3 ✅  3≤7 ✅  7≤4 ❌  → NOT sorted!
```

---

## §3. How Bubble Sort Works — "Am I Larger? Swap!"

> Prime: _"It starts at the zeroth position, goes to the end. It says: hey person next to me, if I'm LARGER than you, we SWAP positions. That's the ENTIRETY of the algorithm."_

### Thuật toán!

Với mỗi element, so sánh với element kế tiếp:

- Nếu current > next → **swap!**
- Nếu current ≤ next → skip!

Lặp lại cho đến khi sorted!

---

## §4. Walkthrough — "Largest Bubbles to the End!"

> Prime: _"By a singular iteration, what happens? The LARGEST item is at the END."_

### Step-by-step!

```
BUBBLE SORT WALKTHROUGH:
═══════════════════════════════════════════════════════════════

  Start: [1, 3, 7, 4, 2]

  ── Iteration 1 (compare up to index 4): ──
  1 vs 3: 1 < 3 → no swap         [1, 3, 7, 4, 2]
  3 vs 7: 3 < 7 → no swap         [1, 3, 7, 4, 2]
  7 vs 4: 7 > 4 → SWAP!           [1, 3, 4, 7, 2]
  7 vs 2: 7 > 2 → SWAP!           [1, 3, 4, 2, 7] ← 7 at end! ✅

  ── Iteration 2 (compare up to index 3): ──
  1 vs 3: no swap                  [1, 3, 4, 2, 7]
  3 vs 4: no swap                  [1, 3, 4, 2, 7]
  4 vs 2: 4 > 2 → SWAP!           [1, 3, 2, 4, 7] ← 4 sorted! ✅

  ── Iteration 3 (compare up to index 2): ──
  1 vs 3: no swap                  [1, 3, 2, 4, 7]
  3 vs 2: 3 > 2 → SWAP!           [1, 2, 3, 4, 7] ← 3 sorted! ✅

  ── Iteration 4 (compare up to index 1): ──
  1 vs 2: no swap                  [1, 2, 3, 4, 7] ← DONE! ✅

  "A singular iteration will always produce the
   LARGEST item in the last spot." — Prime
```

---

## §5. Progressively Smaller — "N, N-1, N-2, ... 1!"

> Prime: _"The next time we do bubble sort, we only have to go up to but NOT INCLUDING the last position — it's already sorted."_

### Mỗi iteration ngắn hơn!

```
PROGRESSIVELY SMALLER:
═══════════════════════════════════════════════════════════════

  Iteration 1: compare N elements     (full array!)
  Iteration 2: compare N-1 elements   (last sorted!)
  Iteration 3: compare N-2 elements
  ...
  Iteration N-1: compare 2 elements
  Iteration N:   compare 1 element    (always sorted!)

  "An array of ONE element is ALWAYS sorted." — Prime
```

---

## §6. Gauss's Story — "The Asshole in Third Grade!"

> Prime: _"There's this asshole in third grade named Gauss. His teacher said: kids, add numbers from 1 to 100. Gauss did it in TEN SECONDS."_

### Gauss's trick!

Prime: _"1 + 100 = 101. 2 + 99 = 101. 3 + 98 = 101... all the way to 50 + 51 = 101. So 101 × 50 = 5050!"_

```
GAUSS'S FORMULA:
═══════════════════════════════════════════════════════════════

     1 +  2 +  3 + ... + 98 + 99 + 100
     ↓    ↓                  ↓    ↓
   (1+100) = 101
   (2+99)  = 101
   (3+98)  = 101
   ...
   (50+51) = 101

   50 pairs × 101 = 5,050! ✅

   Formula: N × (N + 1) / 2

   "My math teacher told me this story, and I always
    remembered it because of that." — Prime
```

---

## §7. Big O Derivation — "N(N+1)/2 → O(N²)!"

> Prime: _"If we look at this pattern: N, N-1, N-2, ... 1 — that's Gauss's formula reversed!"_

### From operations count to Big O!

```
BIG O DERIVATION:
═══════════════════════════════════════════════════════════════

  Total comparisons:
  N + (N-1) + (N-2) + ... + 2 + 1

  That's 1 + 2 + 3 + ... + N reversed!

  Gauss: N × (N + 1) / 2

  Expand: (N² + N) / 2

  Drop constants: N² + N

  Drop insignificant values: N²

  → O(N²)! 🎯

  "Drop non-significant values. As N goes up,
   insignificant polynomials go down.
   N² at 10,000 = 100 MILLION.
   The +N is nothing compared to that." — Prime
```

### Drop insignificant values!

Prime: _"Imagine input at 10,000 — N² is 100 million. The +N (10,000) is so insignificant, it eventually goes to zero as N grows."_

---

## §8. Tự Implement: Bubble Sort

```javascript
// ═══ Bubble Sort ═══

function bubbleSort(arr) {
  // Outer loop: progressively smaller!
  for (let i = 0; i < arr.length; i++) {
    // Inner loop: compare adjacent, bubble largest to end!
    for (let j = 0; j < arr.length - 1 - i; j++) {
      if (arr[j] > arr[j + 1]) {
        // Swap!
        const tmp = arr[j];
        arr[j] = arr[j + 1];
        arr[j + 1] = tmp;
      }
    }
  }
  return arr;
}

// Demo
console.log("═══ BUBBLE SORT ═══\n");

const arr = [1, 3, 7, 4, 2];
console.log("Input:", arr.join(", "));
console.log("Sorted:", bubbleSort([...arr]).join(", "));

// Verbose version
function bubbleSortVerbose(arr) {
  const a = [...arr];
  let totalSwaps = 0;
  for (let i = 0; i < a.length; i++) {
    let swaps = 0;
    for (let j = 0; j < a.length - 1 - i; j++) {
      if (a[j] > a[j + 1]) {
        [a[j], a[j + 1]] = [a[j + 1], a[j]];
        swaps++;
        totalSwaps++;
      }
    }
    console.log(`  Iteration ${i + 1}: [${a.join(", ")}] (${swaps} swaps)`);
  }
  console.log(`  Total swaps: ${totalSwaps}`);
  return a;
}

console.log("\n═══ VERBOSE ═══\n");
bubbleSortVerbose([5, 3, 8, 1, 2]);

// Gauss formula verification
console.log("\n═══ GAUSS FORMULA ═══\n");
[10, 100, 1000].forEach((n) => {
  const gauss = (n * (n + 1)) / 2;
  let manual = 0;
  for (let i = 1; i <= n; i++) manual += i;
  console.log(
    `1+2+...+${n} = ${gauss} (verified: ${manual === gauss ? "✅" : "❌"})`,
  );
});

// Big O comparison
console.log("\n═══ OPERATIONS COUNT ═══\n");
[10, 100, 1000, 10000].forEach((n) => {
  const ops = (n * (n + 1)) / 2;
  const nSquared = n * n;
  console.log(
    `N=${n}: ops=${ops.toLocaleString()}, N²=${nSquared.toLocaleString()}, ratio=${(ops / nSquared).toFixed(2)}`,
  );
});
```

---

## §9. 🔬 Deep Analysis — Why N² and Drop Insignificant Values

```
BUBBLE SORT ANALYSIS:
═══════════════════════════════════════════════════════════════

  HOW IT WORKS:
  1. Compare adjacent elements
  2. Swap if out of order
  3. Largest "bubbles" to the end each pass
  4. Progressively smaller search space

  TIME COMPLEXITY:
  Best case:  O(N)   — already sorted (with optimization!)
  Worst case: O(N²)  — reverse sorted!
  Average:    O(N²)

  SPACE: O(1) — in-place! No extra memory!
  STABLE: Yes — equal elements keep relative order!

  DROP INSIGNIFICANT VALUES:
  ┌──────────────────────────────────────────────────────────┐
  │ N = 10:      N² = 100,      +N = 10     (10%)         │
  │ N = 100:     N² = 10,000,   +N = 100    (1%)          │
  │ N = 1,000:   N² = 1,000,000, +N = 1,000 (0.1%)       │
  │ N = 10,000:  N² = 100,000,000, +N = 10,000 (0.01%)   │
  │ → "+N approaches ZERO as N grows!" — Prime            │
  └──────────────────────────────────────────────────────────┘

  "You could write bubble sort under a plane crashing.
   It is THAT simple." — Ray Babcock via Prime ✈️
```

---

## Checklist

```
[ ] Sorted definition: Xi ≤ Xi+1 for all i!
[ ] Bubble sort: compare adjacent, swap if larger!
[ ] Each pass: largest "bubbles" to the end!
[ ] Progressively smaller: N, N-1, N-2, ... 1!
[ ] Gauss story: 1+2+...+100 = 50 × 101 = 5050!
[ ] Formula: N(N+1)/2!
[ ] Big O: N(N+1)/2 → N² + N → drop N → O(N²)!
[ ] Drop insignificant values!
[ ] In-place, stable, 3 lines of code!
TIẾP THEO → Phần 12: Implementing Bubble Sort!
```
