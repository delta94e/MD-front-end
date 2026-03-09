# The Last Algorithms Course You'll Need — Phần 28: QuickSort Algorithm — "Divide & Conquer, Pivot, Weak Sort, N log N to N²!"

> 📅 2026-03-09 · ⏱ 30 phút đọc
>
> Nguồn: Frontend Masters — ThePrimeagen
> Bài: QuickSort Algorithm — "Divide and conquer, pick pivot, weak sort, partition, N log N best case, N² worst case (reverse sorted!)"
> Độ khó: ⭐️⭐️⭐️⭐️⭐️ | Algorithm — divide and conquer, pivot partitioning, Big O analysis, one of Prime's favorites!

---

## Mục Lục

| #   | Phần                                               |
| --- | -------------------------------------------------- |
| 1   | Divide and Conquer — "Split Input, Solve Smaller!" |
| 2   | QuickSort — "Pick a Pivot, Weak Sort!"             |
| 3   | How Pivot Works — "Two Pointers, Swap Smaller!"    |
| 4   | The Tree of Recursion — "Halving Until Sorted!"    |
| 5   | Big O — "N log N Best, N² Worst!"                  |
| 6   | Why N²? — "Reverse Sorted = Worst Case!"           |
| 7   | Pivot Strategy — "Pick Middle, Not Last!"          |
| 8   | Inclusive High — "Unusual But Easier!"             |
| 9   | 🔬 Deep Analysis — QuickSort vs MergeSort          |

---

## §1. Divide and Conquer — "Split Input, Solve Smaller!"

> Prime: _"Divide and conquering is to split your input into chunks, go over those smaller subsets and solve things faster. You resplit again and again until you get to some fundamental unit."_

### Algorithm strategies!

- **Greedy**: linear search — find first, done!
- **Divide & Conquer**: split, solve halves, combine!
- **Dynamic Programming**: _"until you really get it, it's really really hard"_ 😤

Prime: _"An array of ONE element is always sorted. That would be the fundamental unit."_

---

## §2. QuickSort — "Pick a Pivot, Weak Sort!"

> Prime: _"QuickSort is a fantastic algorithm. It's shockingly simple and at the same time shockingly BRILLIANT. I don't think I could come up with it by myself."_

### How it works!

```
QUICKSORT:
═══════════════════════════════════════════════════════════════

  1. Pick an element → PIVOT (p)!
  2. Everything ≤ p → LEFT side!
  3. Everything > p → RIGHT side!
  4. Pivot is now in its CORRECT position! (weak sort!)
  5. Repeat on left side and right side!

  Array: [3, 7, 1, 8, 5, 2, 6, 4]
  Pivot = 4 (last element)

  After partition:
  [3, 1, 2] [4] [7, 8, 5, 6]
   ≤ 4       ↑     > 4
           sorted!

  "This is referred to as a WEAK SORT." — Prime
```

---

## §3. How Pivot Works — "Two Pointers, Swap Smaller!"

```
PARTITIONING:
═══════════════════════════════════════════════════════════════

  Array: [8, 7, 6, 4, 5]   pivot = 5 (last element)
  idx = -1 (before array)

  i=0: arr[0]=8 > 5  → skip
  i=1: arr[1]=7 > 5  → skip
  i=2: arr[2]=6 > 5  → skip
  i=3: arr[3]=4 ≤ 5  → idx++, swap arr[idx] ↔ arr[i]
       idx=0, swap 8 ↔ 4 → [4, 7, 6, 8, 5]

  Done scanning! Now put pivot in place:
  idx++, swap arr[idx] ↔ arr[hi]
  idx=1, swap 7 ↔ 5 → [4, 5, 6, 8, 7]
                         ↑
                       pivot at idx=1!

  Return pivot index = 1!
```

---

## §4. The Tree of Recursion — "Halving Until Sorted!"

```
QUICKSORT TREE (best case — pivot always middle):
═══════════════════════════════════════════════════════════════

              [0 ────────────── 31]          ← scan N
              /                    \
        [0 ── 15]              [17 ── 31]    ← scan N
        /        \             /        \
    [0 ─ 7]  [9 ─ 15]    [17 ─ 23] [25 ─ 31] ← scan N
    /    \    /    \       /    \     /    \
  [0-3][5-7][9-11][13-15]...                  ← scan N
   ...     ...     ...                        ← scan N
    1   1   1   1   1   1   1   1  ...        ← sorted!

  Height of tree: log₂(N) levels!
  Each level scans: N elements!
  Total: N × log N! 🎯
```

---

## §5. Big O — "N log N Best, N² Worst!"

> Prime: _"N over 2^k = 1 → k = log N. We scan N times, we do log N levels. So N log N!"_

| Case    | Running Time | When?                |
| ------- | ------------ | -------------------- |
| Best    | O(N log N)   | Pivot always middle! |
| Average | O(N log N)   | Random data!         |
| Worst   | O(N²)        | Reverse sorted!      |

---

## §6. Why N²? — "Reverse Sorted = Worst Case!"

> Student: _"What if you don't get the middle?"_
> Prime: _"BOOM, that is exactly it. QuickSort doesn't always sort quickly. Very deceiving name."_

```
WORST CASE — REVERSE SORTED:
═══════════════════════════════════════════════════════════════

  Array: [10, 9, 8, 7, 6, 5, 4, 3, 2, 1]
  Pick last (1) as pivot!

  Partition: [1] [10, 9, 8, 7, 6, 5, 4, 3, 2]
              ↑
           pivot is 1! Only removed ONE element!

  Next: pick 2 → [1] [2] [10, 9, 8, 7, 6, 5, 4, 3]
  Next: pick 3 → ...

  N levels × N scans = N²! 💀

  "The third grader formula:
   N(N+1)/2 = N²/2 + N/2 → O(N²)!" — Prime
```

---

## §7. Pivot Strategy — "Pick Middle, Not Last!"

> Prime: _"One big strategy — always pick the MIDDLE element. If it's reverse sorted, you get perfect bisecting. If it's sorted, zero swaps."_

---

## §8. Inclusive High — "Unusual But Easier!"

> Prime: _"My high is gonna be INCLUSIVE. Very unusual — most algorithms don't do this. It removes some plus ones that can make things tricksy."_

_"That's Gollum for tricky."_ 😂

---

## §9. 🔬 Deep Analysis — QuickSort vs MergeSort

```
QUICKSORT vs MERGESORT:
═══════════════════════════════════════════════════════════════

  Feature       | QuickSort        | MergeSort
  ──────────────|──────────────────|──────────────
  Best case     | O(N log N)       | O(N log N)
  Worst case    | O(N²) ❌         | O(N log N) ✅
  Space         | O(1) in-place ✅ | O(N) extra ❌
  Constant      | Small ✅         | Large ❌
  Stability     | Unstable         | Stable
  Practice      | Usually faster   | Guaranteed time

  "The constant in front of MergeSort is rather LARGE
   because it has to do array copying.
   QuickSort is often the one reached for." — Prime

  → QuickSort: gamble on speed, risk of N²!
  → MergeSort: guaranteed N log N, more memory!
```

---

## Checklist

```
[ ] Divide and conquer: split into halves, solve smaller!
[ ] Pivot: pick element, weak sort around it!
[ ] Partition: two pointers, swap smaller to front!
[ ] Pivot ends up in its CORRECT position!
[ ] Recurse on left side and right side (exclude pivot!)
[ ] Best case: N log N (pivot always middle!)
[ ] Worst case: N² (reverse sorted, pivot always extreme!)
[ ] Strategy: pick middle element instead of last!
[ ] Inclusive high — makes code simpler!
TIẾP THEO → Phần 29: Implementing QuickSort!
```
