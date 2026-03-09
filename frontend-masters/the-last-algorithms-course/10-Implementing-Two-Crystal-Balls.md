# The Last Algorithms Course You'll Need — Phần 10: Implementing Two Crystal Balls — "√N Jump, Walk Back, Walk Forward, First Try!"

> 📅 2026-03-08 · ⏱ 15 phút đọc
>
> Nguồn: Frontend Masters — ThePrimeagen
> Bài: Implementing Two Crystal Balls — "Math.floor(Math.sqrt(N)), jump loop, walk back, linear forward, first try!"
> Độ khó: ⭐️⭐️⭐️ | Implementation — translating √N concept to code!

---

## Mục Lục

| #   | Phần                                           |
| --- | ---------------------------------------------- |
| 1   | Setup — "Math.floor(Math.sqrt(N))!"            |
| 2   | Phase 1 — "Jump √N Until Break!"               |
| 3   | Phase 2 — "Walk Back √N!"                      |
| 4   | Phase 3 — "Walk Forward √N!"                   |
| 5   | First Try! — "It Worked!"                      |
| 6   | Q: "Why Not Cube Root?" — "Jump Approaches 1!" |
| 7   | Tự Implement: Complete Two Crystal Balls       |

---

## §1. Setup — "Math.floor(Math.sqrt(N))!"

> Prime: _"Const jump amount = Math.floor(Math.sqrt(breaks.length)). Let's assume the array is big enough to have a square root."_

### Calculate jump amount!

```typescript
const jumpAmount = Math.floor(Math.sqrt(breaks.length));
// √3 = 1.73... → floor → 1
// √16 = 4 → floor → 4
// √100 = 10 → floor → 10
```

---

## §2. Phase 1 — "Jump √N Until Break!"

> Prime: _"We use our first crystal ball to see where does it break."_

### Ball 1: jump forward!

```typescript
let i = jumpAmount;
for (; i < breaks.length; i += jumpAmount) {
  if (breaks[i]) break; // Ball 1 broke! 💥
}
```

Jump `√N` each time → if `breaks[i]` is true → **ball broke!** Stop jumping!

---

## §3. Phase 2 — "Walk Back √N!"

> Prime: _"We jump back √N."_

### Simple subtraction!

```typescript
i -= jumpAmount; // Go back to last known good position!
```

---

## §4. Phase 3 — "Walk Forward √N!"

> Prime: _"Now we linearly walk forward at most √N until we find a break."_

### Ball 2: linear walk!

```typescript
for (let j = 0; j < jumpAmount && i < breaks.length; j++, i++) {
  if (breaks[i]) return i; // Found the exact break point!
}
return -1; // Not found!
```

---

## §5. First Try! — "It Worked!"

> Prime: _"My goodness, it worked out again!"_

### Complete code!

```typescript
function two_crystal_balls(breaks: boolean[]): number {
  const jumpAmount = Math.floor(Math.sqrt(breaks.length));

  // Phase 1: Jump √N (Ball 1)
  let i = jumpAmount;
  for (; i < breaks.length; i += jumpAmount) {
    if (breaks[i]) break;
  }

  // Phase 2: Walk back √N
  i -= jumpAmount;

  // Phase 3: Walk forward √N (Ball 2)
  for (let j = 0; j < jumpAmount && i < breaks.length; j++, i++) {
    if (breaks[i]) return i;
  }

  return -1;
}
```

```
3 PHASES:
═══════════════════════════════════════════════════════════════

  Array: [F,F,F,F,F,F,F,F,F,F,F,F,T,T,T,T]  (N=16, √N=4)

  Phase 1 — Jump √N (Ball 1):
  [F,F,F,F,F,F,F,F,F,F,F,F,T,T,T,T]
           ↑           ↑
          i=4         i=8        i=12 → BREAK! 💥

  Phase 2 — Walk back √N:
  i = 12 - 4 = 8

  Phase 3 — Walk forward (Ball 2):
  [F,F,F,F,F,F,F,F,F,F,F,F,T,T,T,T]
                   ↑ ↑ ↑ ↑ ↑
                  8 9 10 11 12 → BREAK! 💥
                  → return 12! ✅

  Total steps: 3 jumps + 4 walks = 7 ≈ √16 = 4 🎯
```

---

## §6. Q: "Why Not Cube Root?" — "Jump Approaches 1!"

> Student: _"Why square root and not having like before?"_
> Prime: _"If you jump to middle and ball breaks, you need to walk N/2 — that's O(N). With √N, you walk at most √N."_

> Student: _"What if we go more than square root?"_
> Prime: _"As you increase the root level, the closer you get to linear. Quad root — you're practically jumping by 1."_

### √N = sweet spot!

```
ROOT COMPARISON (N = 10,000):
═══════════════════════════════════════════════════════════════

  √N      = 100   → 100 jumps + 100 walks = 200 → O(√N) ✅
  ∛N      ≈ 21    → 476 jumps + 21 walks   = 497 → slower!
  ⁴√N     = 10    → 1000 jumps + 10 walks  = 1010 → much slower!
  ⁵√N     ≈ 6     → 1666 jumps + 6 walks   = 1672 → approaching N!

  "√N gives MAXIMUM jump with minimum walk!" — Prime
```

---

## §7. Tự Implement: Complete Two Crystal Balls

```javascript
// ═══ Two Crystal Balls — Complete Implementation ═══

function twoCrystalBalls(breaks) {
  const jumpAmount = Math.floor(Math.sqrt(breaks.length));

  // Phase 1: Jump √N (Ball 1)
  let i = jumpAmount;
  for (; i < breaks.length; i += jumpAmount) {
    if (breaks[i]) break;
  }

  // Phase 2: Walk back √N
  i -= jumpAmount;

  // Phase 3: Walk forward √N (Ball 2)
  for (let j = 0; j < jumpAmount && i < breaks.length; j++, i++) {
    if (breaks[i]) return i;
  }

  return -1;
}

// Helper: create test array
function createBreaks(size, breakPoint) {
  const arr = new Array(size).fill(false);
  for (let i = breakPoint; i < size; i++) arr[i] = true;
  return arr;
}

// Tests
console.log("═══ TWO CRYSTAL BALLS ═══\n");

const tests = [
  { size: 16, breakAt: 12 },
  { size: 100, breakAt: 37 },
  { size: 100, breakAt: 0 }, // breaks at start
  { size: 100, breakAt: 99 }, // breaks at end
  { size: 100, breakAt: -1 }, // never breaks (-1 = no break)
];

tests.forEach(({ size, breakAt }) => {
  const breaks =
    breakAt >= 0 ? createBreaks(size, breakAt) : new Array(size).fill(false);
  const result = twoCrystalBalls(breaks);
  const expected = breakAt >= 0 ? breakAt : -1;
  const pass = result === expected;
  console.log(
    `Size=${size}, Break=${breakAt}: got ${result} ${pass ? "✅" : "❌"}`,
  );
});

// Performance
console.log("\n═══ PERFORMANCE ═══\n");
const bigSize = 1000000;
const bigBreak = 750000;
const bigBreaks = createBreaks(bigSize, bigBreak);

const start = performance.now();
const result = twoCrystalBalls(bigBreaks);
const time = performance.now() - start;

console.log(`Size: ${bigSize.toLocaleString()}`);
console.log(`Break at: ${bigBreak.toLocaleString()}`);
console.log(`Found: ${result.toLocaleString()}`);
console.log(`Time: ${time.toFixed(3)}ms`);
console.log(`√N = ${Math.round(Math.sqrt(bigSize))} steps!`);
```

---

## Checklist

```
[ ] Math.floor(Math.sqrt(N)) = jump amount!
[ ] Phase 1: jump √N at a time (Ball 1)!
[ ] Phase 2: walk back √N (to last known good)!
[ ] Phase 3: walk forward √N max (Ball 2)!
[ ] Return index or -1 (sentinel value)!
[ ] Guard: i < breaks.length in both loops!
[ ] First try pass! ✅
[ ] √N = optimal — higher roots approach O(N)!
[ ] "One more trick in the bag!" — Prime
TIẾP THEO → Phần 11: Bubble Sort!
```
