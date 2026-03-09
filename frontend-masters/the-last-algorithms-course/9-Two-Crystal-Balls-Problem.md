# The Last Algorithms Course You'll Need — Phần 9: Two Crystal Balls Problem — "√N Jump, Sub-Linear, The Interviewer Didn't Know!"

> 📅 2026-03-08 · ⏱ 25 phút đọc
>
> Nguồn: Frontend Masters — ThePrimeagen
> Bài: Two Crystal Balls Problem — "Linear fails, binary fails, √N jump = O(√N), interviewer didn't know the answer!"
> Độ khó: ⭐️⭐️⭐️⭐️ | Interview — classic problem, creative thinking, sub-linear search!

---

## Mục Lục

| #   | Phần                                                   |
| --- | ------------------------------------------------------ |
| 1   | The Problem — "100 Storey Building, 2 Balls!"          |
| 2   | Generalized — "Array of Falses Then Trues!"            |
| 3   | Linear Search? — "Didn't Use Our Constraint!"          |
| 4   | Binary Search? — "Ball Breaks, Walk N/2 = Still O(N)!" |
| 5   | √N Jump! — "The Breakthrough!"                         |
| 6   | Q: "Why Not Cube Root?" — "Approaches N!"              |
| 7   | Interview Story — "The Interviewer Didn't Know!"       |
| 8   | Tự Implement: Two Crystal Balls Concept                |
| 9   | 🔬 Deep Analysis — Why √N Is Optimal                   |

---

## §1. The Problem — "100 Storey Building, 2 Balls!"

> Prime: _"Given 2 crystal balls that will break if dropped from a high enough distance, determine the EXACT SPOT in which they'll break in the MOST OPTIMIZED way."_

### Classic interview question!

Prime: _"This was an interview question at my first job. I also had it in computational theory class."_

_"Often you'll hear: you're in a 100 storey building, 2 crystal balls, find out which floor they break."_

---

## §2. Generalized — "Array of Falses Then Trues!"

> Prime: _"When you really think about it, it's an array full of FALSES that at some point becomes TRUE and from there on out, it's true."_

### Generalized version!

```
THE ARRAY:
═══════════════════════════════════════════════════════════════

  [F, F, F, F, F, F, F, T, T, T, T, T, T]
                        ↑
                   Find this point!

  Before this point: ball doesn't break!
  After this point: ball ALWAYS breaks!

  Constraint: we only have 2 balls!
```

---

## §3. Linear Search? — "Didn't Use Our Constraint!"

> Prime: _"If we start at 0 and linearly walk, yes we will find it. But we're given a constraint — 2 crystal balls — and we didn't even USE it."_

### Linear = O(N), ignores the 2-ball constraint!

```javascript
// Linear: O(N) — works but wasteful!
for (let i = 0; i < breaks.length; i++) {
  if (breaks[i]) return i; // found!
}
// Only used 1 ball! Wasted the other!
```

---

## §4. Binary Search? — "Ball Breaks, Walk N/2 = Still O(N)!"

> Prime: _"We jump to the middle — hey Xi, are you true? YES. What just happened? One of our 2 crystal balls just BROKE."_

### Binary search FAILS here!

Nếu ball 1 vỡ ở midpoint → chỉ còn 1 ball → phải **linear walk** từ last known good point!

Walk N/2 → drop constant → **O(N)!** 😤

```
BINARY SEARCH FAILS:
═══════════════════════════════════════════════════════════════

  [F, F, F, F, F, F, T, T, T, T, T, T]
                       ↑
                    mid = TRUE!
                    Ball 1 BROKE! 💥

  Only 1 ball left! Must linear walk from 0:
  [F, F, F, F, F, F, ...]
   ↑→ ↑→ ↑→ ↑→ ↑→ ↑
   Walk N/2 = O(N/2) = O(N) 😤

  "Both our searches SUCK. Neither works." — Prime
```

---

## §5. √N Jump! — "The Breakthrough!"

> Prime: _"We have to jump in such a way that ISN'T some portion of N. We need to jump by a FUNDAMENTALLY DIFFERENT unit."_

### Jump by √N!

Prime: _"We jump √N, √N, √N... until it breaks. Walk back √N, then walk forward √N."_

**Worst case**: √N jumps (off the array) + √N walk back + √N walk forward = `2√N` → **O(√N)!** 🎉

```
√N JUMP:
═══════════════════════════════════════════════════════════════

  Array of 100 elements: √100 = 10

  Step 1: Jump to index 10 — safe? ✅
  Step 2: Jump to index 20 — safe? ✅
  Step 3: Jump to index 30 — BREAK! 💥 Ball 1 gone!

  Now: walk from index 20 forward (max 10 steps!)
  Index 21: safe ✅
  Index 22: safe ✅
  ...
  Index 27: BREAK! 💥 Ball 2 confirms!
  → Answer: index 27!

  Total: 3 jumps + 7 walks = 10 operations = √100 ✅
  Worst case: √N jumps + √N walks = 2√N → O(√N)! 🎯
```

```
WHY √N IS THE OPTIMAL JUMP:
═══════════════════════════════════════════════════════════════

  Jump by portion of N (e.g., N/10):
  → Walk back N/10 → O(N)! ❌

  Jump by √N:
  → Walk back √N → O(√N)! ✅

  "We need to jump by a FUNDAMENTALLY DIFFERENT
   unit — not some portion of N." — Prime
```

---

## §6. Q: "Why Not Cube Root?" — "Approaches N!"

> Student: _"Can we do cube root?"_
> Prime: _"Cube root is SMALLER than square root. Your jumps become progressively smaller. As you increase the root level, the closer you get to a LINEAR run."_

### Higher roots → worse!

```
ROOT COMPARISON:
═══════════════════════════════════════════════════════════════

  N = 1,000,000:
  √N    = 1,000 (good jump size!)
  ∛N    = 100   (too small!)
  ⁴√N   = ~31   (practically jumping by 1!)

  √N gives MAXIMUM jump distance
  while keeping walk distance sub-linear!

  Higher roots → smaller jumps → more jumps → approaches O(N)!
```

---

## §7. Interview Story — "The Interviewer Didn't Know!"

> Prime: _"During the interview, the interviewer did NOT know the generalized answer. When I said it, they said 'that's not the answer.' I said 'it IS the answer, and here's why.' It was so exciting."_

### One more trick in the bag!

Prime: _"I love these tricks — they expand my mind to use in other areas. It's always good to have one more trick inside the bag."_

---

## §8. Tự Implement: Two Crystal Balls Concept

```javascript
// ═══ Two Crystal Balls — Concept Demo ═══

function twoCrystalBallsConcept(breaks) {
  const n = breaks.length;
  const jump = Math.floor(Math.sqrt(n));

  console.log(`Array size: ${n}, Jump: ${jump}`);
  let steps = 0;

  // Phase 1: Jump √N at a time (Ball 1!)
  let i = jump;
  while (i < n) {
    steps++;
    console.log(`  Jump to ${i}: ${breaks[i] ? "BREAK! 💥" : "safe ✅"}`);
    if (breaks[i]) break;
    i += jump;
  }

  if (i >= n && !breaks[n - 1]) {
    console.log(`  Never broke! Returning -1`);
    return -1;
  }

  // Phase 2: Walk back √N
  i -= jump;
  console.log(`  Walk back to ${i}`);

  // Phase 3: Walk forward (Ball 2!)
  for (let j = 0; j <= jump && i < n; j++, i++) {
    steps++;
    console.log(`  Walk ${i}: ${breaks[i] ? "BREAK! 💥 Found!" : "safe ✅"}`);
    if (breaks[i]) {
      console.log(
        `  Total steps: ${steps} (√${n} ≈ ${Math.round(Math.sqrt(n))})`,
      );
      return i;
    }
  }

  return -1;
}

// Demo
const n = 25;
const breakPoint = 17;
const breaks = new Array(n).fill(false);
for (let i = breakPoint; i < n; i++) breaks[i] = true;

console.log("═══ TWO CRYSTAL BALLS ═══\n");
console.log(`Break point at index ${breakPoint}:`);
const result = twoCrystalBallsConcept(breaks);
console.log(`\nResult: ${result} ${result === breakPoint ? "✅" : "❌"}`);

// Compare approaches
console.log("\n═══ COMPARISON ═══\n");
const sizes = [100, 10000, 1000000];
sizes.forEach((size) => {
  console.log(`N = ${size.toLocaleString()}:`);
  console.log(`  Linear:  ${size.toLocaleString()} steps`);
  console.log(`  Binary:  still ${(size / 2).toLocaleString()} worst case`);
  console.log(`  √N:      ${Math.round(Math.sqrt(size))} steps! 🚀`);
});
```

---

## §9. 🔬 Deep Analysis — Why √N Is Optimal

```
WHY √N:
═══════════════════════════════════════════════════════════════

  The problem: 2 balls, find break point!
  Constraint: only 2 attempts!

  If we jump by J:
  - Worst case jumps: N/J (to reach the end)
  - Worst case walks: J (linear scan after break)
  - Total: N/J + J

  Minimize N/J + J:
  Take derivative: -N/J² + 1 = 0
  J² = N
  J = √N! 🎯

  Total = N/√N + √N = √N + √N = 2√N = O(√N)!

  SUMMARY:
  ┌──────────────────────────────────────────────────────────┐
  │ Linear search:     O(N)    — uses 1 ball               │
  │ Binary search:     O(N)    — ball breaks, walk N/2!    │
  │ √N jump search:    O(√N)   — uses BOTH balls! 🎯      │
  └──────────────────────────────────────────────────────────┘

  "You have one more trick in the bag." — Prime
```

---

## Checklist

```
[ ] Problem: 2 balls, find break point in sorted boolean array!
[ ] Linear: O(N) — doesn't use the 2-ball constraint!
[ ] Binary: ball breaks at mid → walk N/2 → still O(N)!
[ ] Key: jump by FUNDAMENTALLY DIFFERENT unit (not portion of N)!
[ ] √N jump: jump √N, break, walk back √N, walk forward √N!
[ ] Running time: 2√N → O(√N)! 🎉
[ ] Why not cube root: smaller jumps → approaches O(N)!
[ ] Interview story: interviewer didn't know the answer!
[ ] "One more trick in the bag!" — Prime
TIẾP THEO → Phần 10: Implementing Two Crystal Balls!
```
