# The Last Algorithms Course You'll Need — Phần 12: Implementing Bubble Sort — "First Sorting Algorithm, First Try, Immutability = N³!"

> 📅 2026-03-08 · ⏱ 20 phút đọc
>
> Nguồn: Frontend Masters — ThePrimeagen
> Bài: Implementing Bubble Sort — "i/j loops, minus i for progressively smaller, swap with temp, first try, immutability Q&A!"
> Độ khó: ⭐️⭐️⭐️ | Implementation — translating bubble sort to TypeScript, Big O re-explanation!

---

## Mục Lục

| #   | Phần                                                          |
| --- | ------------------------------------------------------------- |
| 1   | Pseudocode Recap — "Two Loops, Compare, Swap!"                |
| 2   | Implementation — "i Loop, j Loop, -1 -i!"                     |
| 3   | The Swap — "Temp, Classic Three Lines!"                       |
| 4   | First Try! — "Michael Bubble 🎤"                              |
| 5   | Big O Re-explanation — "Constant Ops Inside, Loops Cause N²!" |
| 6   | Q: Immutability + Sorting? — "N³, Terrible Idea!"             |
| 7   | Recursion Teaser — "Can't Do Quicksort Yet!"                  |
| 8   | Tự Implement: Complete Bubble Sort                            |

---

## §1. Pseudocode Recap — "Two Loops, Compare, Swap!"

> Prime: _"We have an array from 0 to N. We start at 0 and go up to but not including N-1, because we compare i to i+1 — don't wanna go off the array."_

### The plan!

```
for i from 0 to N:
  for j from 0 to N - 1 - i:     // progressively smaller!
    if array[j] > array[j + 1]:
      swap(array[j], array[j + 1])
```

Prime: _"If you're using a traditional language and you go off the array — array out of bounds exception in Java. In C++, 'things happen.' I don't wanna be reading HTML here — that's the hacker's language."_ 😂

---

## §2. Implementation — "i Loop, j Loop, -1 -i!"

> Prime: _"Every single time we execute, the last element becomes the largest — we don't need to redo that. So we also minus i."_

### Why `j < arr.length - 1 - i`?

```
PROGRESSIVELY SMALLER:
═══════════════════════════════════════════════════════════════

  i=0: j goes 0 to N-1   (compare all adjacent!)
  i=1: j goes 0 to N-2   (last already sorted!)
  i=2: j goes 0 to N-3   (last 2 sorted!)
  ...
  i=N-1: j goes 0 to 0   (done!)

  The "-1": don't compare last element to j+1 (off array!)
  The "-i": skip already-sorted elements at end!
```

---

## §3. The Swap — "Temp, Classic Three Lines!"

> Prime: _"Swapping — const temp = arr[j], arr[j] = arr[j+1], arr[j+1] = temp. Simple swap. I should have just created a function — I don't know why I didn't."_

```typescript
const temp = arr[j];
arr[j] = arr[j + 1];
arr[j + 1] = temp;
```

---

## §4. First Try! — "Michael Bubble 🎤"

> Prime: _"npx jest bubble... That would have been so much better if I'd called the file 'Michael Bubble.' I'd have been great."_ 😂

### Complete code!

```typescript
function bubble_sort(arr: number[]): void {
  for (let i = 0; i < arr.length; i++) {
    for (let j = 0; j < arr.length - 1 - i; j++) {
      if (arr[j] > arr[j + 1]) {
        const tmp = arr[j];
        arr[j] = arr[j + 1];
        arr[j + 1] = tmp;
      }
    }
  }
}
```

Prime: _"It's really not that hard — an extremely simple algorithm. Probably SIMPLER than binary search. Binary search is significantly harder."_

---

## §5. Big O Re-explanation — "Constant Ops Inside, Loops Cause N²!"

> Student: _"We're comparing each element — it's kind of N² but I didn't understand the N(N+1)/2 formula."_

### Prime's re-explanation!

Prime: _"Everything INSIDE the inner loop is constant. Accessing array twice, comparing, swapping — all constant. It's really just the TWO LOOPS that cause the squared algorithm."_

```
BIG O BREAKDOWN:
═══════════════════════════════════════════════════════════════

  Inner operations:
  arr[j]        → O(1) constant!
  arr[j+1]      → O(1) constant!
  comparison    → O(1) constant!
  swap          → O(1) constant!

  What matters — THE LOOPS:
  i=0: j runs (N-1) times
  i=1: j runs (N-2) times
  i=2: j runs (N-3) times
  ...
  Total: (N-1) + (N-2) + ... + 1

  = N(N-1)/2 = (N² - N) / 2

  Drop constants + insignificant: O(N²)! 🎯
```

---

## §6. Q: Immutability + Sorting? — "N³, Terrible Idea!"

> Student: _"What's a good sorting algorithm for immutable arrays?"_
> Prime: _"If you create an immutable array, you have an EXCEPTIONALLY POOR performing data structure."_

### Immutability + sorting = disaster!

Prime: _"Worst case — reverse sorted array, every swap copies N elements. So it'd be somewhere in N³ if not higher."_

_"I would NEVER use immutability and sorting in the same sentence — that's a terrible idea for performance."_

---

## §7. Recursion Teaser — "Can't Do Quicksort Yet!"

> Prime: _"There are other sorting algorithms but they deal with RECURSION, and I haven't covered recursion yet. The problem with recursion IS recursion."_

_"You don't really understand it until you COMPLETELY understand it. There's no middle ground — you either get it or don't."_

---

## §8. Tự Implement: Complete Bubble Sort

```javascript
// ═══ Bubble Sort — Complete ═══

function bubbleSort(arr) {
  for (let i = 0; i < arr.length; i++) {
    for (let j = 0; j < arr.length - 1 - i; j++) {
      if (arr[j] > arr[j + 1]) {
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

const tests = [
  [5, 3, 8, 1, 2],
  [1, 2, 3, 4, 5], // already sorted!
  [5, 4, 3, 2, 1], // reverse sorted = worst case!
  [42], // single element
  [], // empty
];

tests.forEach((arr) => {
  const copy = [...arr];
  bubbleSort(copy);
  console.log(`[${arr.join(",")}] → [${copy.join(",")}]`);
});

// Operations counter
function bubbleSortCounted(arr) {
  let ops = 0;
  for (let i = 0; i < arr.length; i++) {
    for (let j = 0; j < arr.length - 1 - i; j++) {
      ops++;
      if (arr[j] > arr[j + 1]) {
        [arr[j], arr[j + 1]] = [arr[j + 1], arr[j]];
      }
    }
  }
  return ops;
}

console.log("\n═══ OPERATIONS COUNT ═══\n");
[5, 10, 50, 100, 500].forEach((n) => {
  const arr = Array.from({ length: n }, () => Math.floor(Math.random() * 1000));
  const ops = bubbleSortCounted(arr);
  const formula = (n * (n - 1)) / 2;
  console.log(`N=${n}: ops=${ops}, N(N-1)/2=${formula}, N²=${n * n}`);
});
```

---

## Checklist

```
[ ] Two nested loops: i (passes), j (comparisons)!
[ ] j < arr.length - 1 - i: progressively smaller!
[ ] Swap with temp variable (3 lines)!
[ ] Inner operations all O(1) — loops cause N²!
[ ] N(N-1)/2 → drop constants → O(N²)!
[ ] Immutability + sorting = O(N³) disaster!
[ ] In-place sort (no extra memory)!
[ ] First try pass! "Michael Bubble" 🎤 😂
TIẾP THEO → Phần 13: Linked List Data Structures!
```
