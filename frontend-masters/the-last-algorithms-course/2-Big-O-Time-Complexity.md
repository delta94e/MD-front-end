# The Last Algorithms Course You'll Need — Phần 2: Big O Time Complexity — "Growth with Respect to Input, Drop Constants, Worst Case!"

> 📅 2026-03-08 · ⏱ 30 phút đọc
>
> Nguồn: Frontend Masters — ThePrimeagen
> Bài: Big O Time Complexity — "Categorize algorithm by time/memory, look for loops, drop constants, worst case only!"
> Độ khó: ⭐️⭐️ | Fundamental — Big O notation, 3 core concepts, common complexities!

---

## Mục Lục

| #   | Phần                                                           |
| --- | -------------------------------------------------------------- |
| 1   | Big O Là Gì? — "Categorize, Not Exact!"                        |
| 2   | Concept #1 — "Growth with Respect to Input!"                   |
| 3   | Look for Loops — "Simplest Trick!"                             |
| 4   | Concept #2 — "Always Drop Constants!"                          |
| 5   | Practical vs Theoretical — "Insertion Sort Faster on Small N!" |
| 6   | Concept #3 — "Worst Case!"                                     |
| 7   | Common Complexities — "O(1) to O(n!)!"                         |
| 8   | Space Complexity — "The Final Frontier!"                       |
| 9   | Prime's Favorites — "Quicksort + Ring Buffer!"                 |
| 10  | Tự Implement: Big O Examples                                   |
| 11  | 🔬 Deep Analysis — Big O Cheat Sheet                           |

---

## §1. Big O Là Gì? — "Categorize, Not Exact!"

> Prime: _"Big O is the easiest way to put it — it CATEGORIZES your algorithm on time or memory based on the input. It's NOT meant to be an exact measurement."_

### Phân loại, không phải đo chính xác!

Prime: _"Someone's not gonna say your algorithm is gonna take 450 CPU units. Instead it's a GENERALIZED way to understand how your algorithm will react as your input GROWS."_

_"If someone says this is O(N), they mean your algorithm GROWS LINEARLY based on input."_

```
BIG O — WHAT IT IS:
═══════════════════════════════════════════════════════════════

  ❌ NOT this:
  "Your algorithm takes 450 CPU units."
  → "What's a CPU unit? How did you get that number?"

  ✅ THIS:
  "Your algorithm is O(N) — grows LINEARLY."
  → As input doubles, time doubles!
  → As input 10x, time 10x!

  "It's a GENERALIZED way to understand how
   your algorithm reacts as input GROWS." — Prime
```

### Tại sao dùng Big O?

Prime: _"It helps us make decisions on why you should or should not use a specific data structure."_

_"Data structures progressively make constraints to become more and more performant. But if you use them INCORRECTLY, they become massively in-performance."_

---

## §2. Concept #1 — "Growth with Respect to Input!"

> Prime: _"Number ONE: growth is with respect to input. Put that in your head."_

### Mọi thứ đều relative theo input!

Prime shows function nhận string `n`:

_"Notice it's a string — it has a LENGTH and a series of characters. Strings are effectively arrays."_

_"The for loop has to execute the LENGTH of the string. If our string grows by 50%, how much slower is our function? 50%. It grows LINEARLY."_

_"For every one more unit of string, there is one more loop."_

```javascript
// O(N) — linear!
function sumCharCodes(n: string): number {
  let sum = 0;
  for (let i = 0; i < n.length; i++) {  // ← loop = N!
    sum += n.charCodeAt(i);
  }
  return sum;
}
```

```
GROWTH:
═══════════════════════════════════════════════════════════════

  Input size → Time:
  n = 10     → 10 iterations
  n = 100    → 100 iterations    (10x input = 10x time!)
  n = 1000   → 1000 iterations   (100x input = 100x time!)

  → O(N): LINEAR growth! 📈
```

---

## §3. Look for Loops — "Simplest Trick!"

> Prime: _"Simplest trick in all of it — just LOOK FOR LOOPS. Where do you loop over the input? Easiest way to tell the Big O complexity."_

### Đếm loops = biết Big O!

Prime: _"For those who did not see that — it's not very obvious. But for me, that's O(N), and you can see it right away."_

Trick: **Đếm số lần loop qua input** → đó là Big O!

- 1 loop qua input → O(N)
- 2 loops liên tiếp → O(2N) → **drop constant** → O(N)!
- 2 loops lồng nhau → O(N²)!

---

## §4. Concept #2 — "Always Drop Constants!"

> Prime: _"Second most important concept — you ALWAYS drop constants."_

### Constants không quan trọng ở scale lớn!

Prime shows function loop 2 lần:

```javascript
function sumCharCodes(n: string): number {
  let sum = 0;
  for (let i = 0; i < n.length; i++) {  // loop 1
    sum += n.charCodeAt(i);
  }
  for (let i = 0; i < n.length; i++) {  // loop 2
    sum += n.charCodeAt(i);
  }
  return sum;
}
```

Student: _"O(N)."_ → Prime: _"Okay, we got one O(N). Anything else? I was hoping someone would say O(2N)."_

**Answer**: O(2N) → **drop constant** → **O(N)**!

### Tại sao drop constants?

Prime: _"If you had 10N versus N², you'd clearly see N² gets MASSIVELY larger. It grows disproportionately fast compared to ANY constant in front of linear N."_

```
DROP CONSTANTS — WHY:
═══════════════════════════════════════════════════════════════

  N = 10:     10N = 100      N² = 100      (same!)
  N = 100:    10N = 1,000    N² = 10,000   (10x bigger!)
  N = 1000:   10N = 10,000   N² = 1,000,000 (100x bigger!)
  N = 10000:  10N = 100,000  N² = 100,000,000 (1000x bigger!)

  → At scale, constants DON'T MATTER!
  → The SHAPE of growth matters, not the constant!

  "We're not trying to get exact time.
   It's HOW DOES IT GROW?" — Prime
```

---

## §5. Practical vs Theoretical — "Insertion Sort Faster on Small N!"

> Prime: _"Practically speaking, sometimes things that are O(N²) are FASTER than O(N log N) — because your N is sufficiently small."_

### Constants DO matter in practice!

Prime: _"Just like in sorting, often it will use INSERTION SORT for smaller subsets of data. Though slower in theoretical terms (N²), it's actually FASTER than quicksort (N log N) for small datasets."_

_"Because practically speaking, the constant that is dropped is large enough that it makes REAL impact."_

```
PRACTICAL vs THEORETICAL:
═══════════════════════════════════════════════════════════════

  THEORETICAL:
  O(N²) > O(N log N) → N² always "worse"!

  PRACTICAL (small N):
  Insertion Sort (N²) with small constant
  can BEAT Quicksort (N log N) with large constant!

  → Why? Because N is small enough that constants matter!
  → Real-world algorithms use HYBRID approaches!

  "Practically speaking, sometimes N² is faster
   than N log N for small datasets." — Prime
```

---

## §6. Concept #3 — "Worst Case!"

> Prime: _"Often we consider WORST CASE. In interviews, you're gonna pretty much exclusively describe worst case."_

### Early return doesn't change Big O!

```javascript
function sumCharCodes(n: string): number {
  let sum = 0;
  for (let i = 0; i < n.length; i++) {
    const charCode = n.charCodeAt(i);
    if (charCode === 69) return sum;  // Early return on 'E'!
    sum += charCode;
  }
  return sum;
}
```

Student: _"O(N)."_ → Prime: _"O(N) would be correct!"_

Prime: _"A string without a capital E — how much do you go through? ALL of it. A string with E at the end? O(N - 2). Well, that's just N — we drop constants."_

_"If it's one-half N, still just N."_

### Ba concepts tổng kết!

1. **Growth with respect to input** → how does it grow?
2. **Constants are always dropped** → O(2N) = O(N)!
3. **Worst case** → assume input has no shortcut!

---

## §7. Common Complexities — "O(1) to O(n!)!"

> Prime: _"O(1) means constant time. Doesn't matter how big the input — same operations every time. Effectively instant."_

### Bảng common complexities!

```
COMMON COMPLEXITIES:
═══════════════════════════════════════════════════════════════

  O(1)       → Constant! Same time regardless of input!
  O(log N)   → Logarithmic! Halving each step!
  O(N)       → Linear! Proportional to input!
  O(N log N) → Linearithmic! Common in sorting!
  O(N²)      → Quadratic! Nested loops!
  O(N³)      → Cubic! Triple nested! (matrix multiply)
  O(2ⁿ)      → Exponential! Can't run on computers! 😱
  O(N!)      → Factorial! Traveling salesman! 😱😱

  And the rare one:
  O(√N)      → "Squirt of N" 😂 — Prime loves this one!
```

### Loop counting!

```javascript
// O(N²) — nested loops!
for (let i = 0; i < n.length; i++) {
  for (let j = 0; j < n.length; j++) {
    // N × N = N²!
  }
}

// O(N³) — triple nested!
for (let i = 0; i < n.length; i++) {
  for (let j = 0; j < n.length; j++) {
    for (let k = 0; k < n.length; k++) {
      // N × N × N = N³!
    }
  }
}
```

Prime: _"N² is like computing the AREA of a square — N by N."_

_"N³ is like multiplying matrices — painful."_

### O(N log N) — halving inside a loop!

Prime: _"For every time, you go over half the amount of space you need to search, but you search the whole space once. So N characters, then halve what you need to do."_

### O(√N) — rarest!

Prime: _"The craziest of all runtimes — I've only seen it in ONE problem. Very excited about it. √N = squirt of N."_ 😂

---

## §8. Space Complexity — "The Final Frontier!"

> Prime: _"Space, the final frontier. We're not gonna really be talking much about it. It's just less interesting."_

### Space = memory growth!

Prime: _"I've gotten it once or twice in an interview."_

Then jokes about React: _"People do THIS in React — which emotionally BRUISES me. So I assume people don't care about space or time sometimes."_ 😂

---

## §9. Prime's Favorites — "Quicksort + Ring Buffer!"

> Prime: _"My favorite algorithm to implement is probably QUICKSORT. Practically speaking, I think a RING BUFFER is just — it's always awesome."_

_"You can replace a ring buffer with an array list if you don't need first-in-first-out behavior. By the end of the course, you will AGREE with me."_

---

## §10. Tự Implement: Big O Examples

```javascript
// ═══ Big O Examples ═══

// O(1) — Constant!
function getFirst(arr: number[]): number {
  return arr[0];  // Same time regardless of array size!
}

// O(N) — Linear!
function sum(arr: number[]): number {
  let total = 0;
  for (let i = 0; i < arr.length; i++) {  // 1 loop!
    total += arr[i];
  }
  return total;
}

// O(N) — NOT O(2N)! Drop constants!
function sumTwice(arr: number[]): number {
  let sum1 = 0;
  for (let i = 0; i < arr.length; i++) sum1 += arr[i];  // loop 1
  let sum2 = 0;
  for (let i = 0; i < arr.length; i++) sum2 += arr[i];  // loop 2
  return sum1 + sum2;
  // O(2N) → drop constant → O(N)!
}

// O(N) — Worst case! (early return doesn't help)
function findE(str: string): number {
  let sum = 0;
  for (let i = 0; i < str.length; i++) {
    if (str.charCodeAt(i) === 69) return sum;  // E found!
    sum += str.charCodeAt(i);
  }
  return sum;
  // Worst case: no E → full loop → O(N)!
}

// O(N²) — Nested loops!
function allPairs(arr: number[]): number {
  let count = 0;
  for (let i = 0; i < arr.length; i++) {
    for (let j = 0; j < arr.length; j++) {
      count++;  // N × N = N²!
    }
  }
  return count;
}

// Demo
const arr = [1, 2, 3, 4, 5];
console.log("O(1):", getFirst(arr));           // instant!
console.log("O(N):", sum(arr));                // 5 ops
console.log("O(N) not O(2N):", sumTwice(arr)); // 10 ops → still O(N)!
console.log("O(N²):", allPairs(arr));          // 25 ops (5²)!

console.log("\n✅ 3 concepts:");
console.log("  1. Growth with respect to input!");
console.log("  2. Drop constants! O(2N) = O(N)!");
console.log("  3. Worst case! Early return doesn't help!");
```

---

## §11. 🔬 Deep Analysis — Big O Cheat Sheet

```
BIG O CHEAT SHEET:
═══════════════════════════════════════════════════════════════

  TRICK: Count the loops!
  ┌──────────────────────────────────────────────────────────┐
  │ No loop over input         → O(1)                      │
  │ 1 loop, halving each time  → O(log N)                  │
  │ 1 loop over input          → O(N)                      │
  │ 1 loop + halving inside    → O(N log N)                │
  │ 2 nested loops over input  → O(N²)                     │
  │ 3 nested loops             → O(N³)                     │
  └──────────────────────────────────────────────────────────┘

  3 RULES:
  ┌──────────────────────────────────────────────────────────┐
  │ 1. Growth with respect to INPUT!                       │
  │ 2. ALWAYS drop constants!                              │
  │ 3. Consider WORST CASE!                                │
  └──────────────────────────────────────────────────────────┘

  GRAPH (left = fast, right = slow):
  O(1) < O(log N) < O(N) < O(N log N) < O(N²) < O(N³) < O(2ⁿ) < O(N!)
   🟢     🟢        🟡      🟡           🔴      🔴      💀      💀

  "Long as you keep these 3 concepts,
   you'll do well in an interview." — Prime 🎯
```

---

## Checklist

```
[ ] Big O = categorize, NOT exact measurement!
[ ] Concept 1: growth with respect to INPUT!
[ ] Look for loops = simplest Big O trick!
[ ] Concept 2: ALWAYS drop constants! O(2N) = O(N)!
[ ] Practical: insertion sort beats quicksort on small N!
[ ] Concept 3: consider WORST CASE!
[ ] Common: O(1), O(log N), O(N), O(N log N), O(N²), O(N³)!
[ ] Rare: O(√N) = "squirt of N" 😂!
[ ] Space complexity: less common in interviews!
[ ] Prime's favorites: quicksort + ring buffer!
TIẾP THEO → Phần 3: Arrays!
```
