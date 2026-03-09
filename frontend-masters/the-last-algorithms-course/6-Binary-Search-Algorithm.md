# The Last Algorithms Course You'll Need — Phần 6: Binary Search Algorithm — "Half the Input = O(log N), Deriving from Scratch!"

> 📅 2026-03-08 · ⏱ 30 phút đọc
>
> Nguồn: Frontend Masters — ThePrimeagen
> Bài: Binary Search Algorithm — "Is it ordered? Jump 10% fails, halving works, N/2^k = 1, log N derivation, 4096 = 12 steps!"
> Độ khó: ⭐️⭐️⭐️ | Core — binary search derivation, logarithm proof, O(log N)!

---

## Mục Lục

| #   | Phần                                            |
| --- | ----------------------------------------------- |
| 1   | "Is It Ordered?" — "New Advantages!"            |
| 2   | Jump 10% — "Emotionally Defeating, Still O(N)!" |
| 3   | Jump to Middle! — "Halving!"                    |
| 4   | Derivation — "N/2^k = 1 → log N!"               |
| 5   | 4096 Example — "12 Steps!"                      |
| 6   | Big O Trick — "Halving Input = log N!"          |
| 7   | Tự Implement: Binary Search Concept             |
| 8   | 🔬 Deep Analysis — Linear vs Binary             |

---

## §1. "Is It Ordered?" — "New Advantages!"

> Prime: _"An IMPORTANT question you should always ask yourself when it comes to your data set — IS IT ORDERED? If it is, you have new advantages."_

### Sorted data unlocks better algorithms!

Với unsorted data → chỉ có thể linear search (O(N))!
Với sorted data → có thể **halve** search space! 🚀

---

## §2. Jump 10% — "Emotionally Defeating, Still O(N)!"

> Prime: _"Jump 10% of N — hey Xi, are you equal to V? If not, jump 10% more. If larger, walk back and linear search."_

### Ý tưởng đầu tiên: nhảy 10%!

Worst case: nhảy 10 lần + scan 10% cuối = `10 + 0.1N` = **vẫn O(N)!**

Prime: _"Isn't that just EMOTIONALLY DEFEATING? It's still way more efficient practically, but theoretically — from 10,000 to a million, your algorithm is gonna be 100x slower. We didn't IMPROVE the algorithm."_

```
JUMP 10% — STILL O(N):
═══════════════════════════════════════════════════════════════

  10 jumps + 0.1N scan = 10 + 0.1N

  Drop constants: O(0.1N + 10) → O(N) 😤

  "We just improved it PRACTICALLY speaking.
   But theoretically, it's still N." — Prime
```

---

## §3. Jump to Middle! — "Halving!"

> Prime: _"What happens if we just jump to the MIDDLE? If our value is larger, we only look on one half. Then half AGAIN."_

### Halving = the key insight!

- Array N → jump to middle → check!
- Not found, value larger → **only search right half!** (N/2)
- Jump to middle of right half → check!
- Not found → **only search one quarter!** (N/4)
- Keep going...

_"We keep halving until either there's no half left or we find our value."_

```
HALVING:
═══════════════════════════════════════════════════════════════

  [1, 3, 5, 7, 9, 11, 13, 15]  Target: 11
   ↑                        ↑
   lo                       hi

  Step 1: mid = 7, 11 > 7 → search right half!
  [9, 11, 13, 15]
   ↑           ↑

  Step 2: mid = 11, 11 == 11 → FOUND! ✅

  Only 2 steps instead of 6 (linear)!
```

---

## §4. Derivation — "N/2^k = 1 → log N!"

> Prime: _"This is the most MATHY part of the whole course."_

### Chứng minh O(log N)!

Mỗi step, chia đôi:

- N → N/2 → N/4 → N/8 → N/16 → ... → 1

Tổng quát: **N / 2^k = 1** (k = số lần chia)

```
DERIVATION:
═══════════════════════════════════════════════════════════════

  N / 2^k = 1          (halving k times reaches 1)

  Multiply both sides by 2^k:
  N = 2^k

  Take log base 2:
  log₂(N) = k          (k = number of halvings!)

  → Running time = O(log N)! 🎯

  "Log base 2 of N = k. Our running time is log N." — Prime
```

---

## §5. 4096 Example — "12 Steps!"

> Prime: _"If our array was 4096 and we half it..."_

### 4096 → 12 halvings!

```
4096 → 2048 → 1024 → 512 → 256 → 128 → 64 → 32 → 16 → 8 → 4 → 2 → 1

Steps: 12!
log₂(4096) = 12! ✅

Compare to linear: 4096 steps! 😱
Binary search: 12 steps! 🚀
→ 341x faster!
```

---

## §6. Big O Trick — "Halving Input = log N!"

> Prime: _"When you HALVE the input at each step, it's either log N or N log N — depending if you're scanning that input or not."_

### Rule of thumb!

- **Halving + looking at one value** → O(log N)! (binary search)
- **Halving + scanning remaining** → O(N log N)! (quicksort)

---

## §7. Tự Implement: Binary Search Concept

```javascript
// ═══ Binary Search Derivation ═══

function demonstrateHalving(n) {
  let steps = 0;
  let current = n;
  const history = [current];

  while (current > 1) {
    current = Math.floor(current / 2);
    steps++;
    history.push(current);
  }

  console.log(`N = ${n}`);
  console.log(`Halvings: ${history.join(" → ")}`);
  console.log(`Steps: ${steps}`);
  console.log(`log₂(${n}) = ${Math.log2(n)}`);
  console.log(`Match: ${steps === Math.log2(n) ? "✅" : "≈"}\n`);
}

console.log("═══ HALVING DEMONSTRATION ═══\n");
demonstrateHalving(8); // 3 steps
demonstrateHalving(16); // 4 steps
demonstrateHalving(256); // 8 steps
demonstrateHalving(4096); // 12 steps!
demonstrateHalving(1048576); // 20 steps for 1 million!

console.log("═══ LINEAR vs BINARY ═══\n");
const sizes = [100, 1000, 10000, 100000, 1000000];
sizes.forEach((n) => {
  console.log(
    `N = ${n.toLocaleString()}: Linear = ${n.toLocaleString()} steps, Binary = ${Math.ceil(Math.log2(n))} steps`,
  );
});
```

---

## §8. 🔬 Deep Analysis — Linear vs Binary

```
LINEAR vs BINARY:
═══════════════════════════════════════════════════════════════

  N          | Linear O(N) | Binary O(log N) | Speedup
  -----------|-------------|-----------------|--------
  10         | 10          | ~3              | 3x
  100        | 100         | ~7              | 14x
  1,000      | 1,000       | ~10             | 100x
  10,000     | 10,000      | ~13             | 769x
  1,000,000  | 1,000,000   | ~20             | 50,000x!
  1 Billion  | 1,000,000,000 | ~30           | 33,000,000x!!

  PREREQUISITE: Array MUST be sorted!
  TRICK: Halving input = log N or N log N!

  "Binary — either this side or that side.
   You're always splitting in half." — Prime 🎯
```

---

## Checklist

```
[ ] "Is it ordered?" — first question to ask!
[ ] Jump 10% = still O(N)! "Emotionally defeating!"
[ ] Halving each step = the key insight!
[ ] N/2^k = 1 → N = 2^k → log₂(N) = k → O(log N)!
[ ] 4096 elements = only 12 steps!
[ ] Trick: halving + look = log N, halving + scan = N log N!
[ ] Prerequisite: SORTED array only!
TIẾP THEO → Phần 7: Pseudo-code Binary Search!
```
