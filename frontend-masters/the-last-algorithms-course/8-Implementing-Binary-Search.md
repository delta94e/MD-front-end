# The Last Algorithms Course You'll Need — Phần 8: Implementing Binary Search — "First Try! 7 Lines! Google Docs Terror!"

> 📅 2026-03-08 · ⏱ 15 phút đọc
>
> Nguồn: Frontend Masters — ThePrimeagen
> Bài: Implementing Binary Search — "Pseudocode → TypeScript, Math.floor, don't forget /2, Google interview story!"
> Độ khó: ⭐️⭐️⭐️ | Implementation — direct translation from pseudocode!

---

## Mục Lục

| #   | Phần                                                |
| --- | --------------------------------------------------- |
| 1   | Translation — "Pseudocode → TypeScript!"            |
| 2   | "Don't Forget to Divide by 2!" — Prime's Bug!       |
| 3   | First Try! — "npx jest binary → GREEN!"             |
| 4   | Google Interview Story — "+1 -1 Issues Everywhere!" |
| 5   | Tự Implement: Complete Binary Search                |

---

## §1. Translation — "Pseudocode → TypeScript!"

> Prime: _"Now that we've written it on a whiteboard, we can implement it. Let's translate from pseudocode."_

### Direct translation!

```typescript
function binary_search(haystack: number[], needle: number): boolean {
  let lo = 0;
  let hi = haystack.length;

  do {
    const m = Math.floor(lo + (hi - lo) / 2);
    const value = haystack[m];

    if (value === needle) {
      return true;
    } else if (value > needle) {
      hi = m;
    } else {
      lo = m + 1;
    }
  } while (lo < hi);

  return false;
}
```

Prime: _"It's really only 7 lines of actual code. It's a pretty SIMPLE piece of code — it's just being able to focus and do this correctly."_

---

## §2. "Don't Forget to Divide by 2!" — Prime's Bug!

> Prime: _"Don't forget to divide by 2! When I programmed this, it took me THREE MINUTES to realize I had a bug because I forgot to divide by 2."_

### Common mistake!

```javascript
// ❌ WRONG — forgot /2!
const m = Math.floor(lo + (hi - lo)); // = hi! Not midpoint!

// ✅ CORRECT!
const m = Math.floor(lo + (hi - lo) / 2); // actual midpoint!
```

---

## §3. First Try! — "npx jest binary → GREEN!"

> Prime: _"npx jest binary — binary search actually WORKED, first try!"_

### Test passed! ✅

Prime also accidentally reveals the test list: _"Don't look at the second one, 'compare binary tree.' You're not supposed to see that yet. Let's pretend the man behind the curtain doesn't exist."_ 😂

---

## §4. Google Interview Story — "+1 -1 Issues Everywhere!"

> Prime: _"One of my first interviews at Google, they made me code binary search in Google Docs. It was TERRIBLE. I had +1 -1 issues ALL OVER the place."_

### Binary search = classic interview trap!

Prime: _"I didn't come into it with a really clean idea of exactly what needed to happen."_

**Lesson**: Come in with a **convention** (lo inclusive, hi exclusive) or the off-by-ones will destroy you!

```
GOOGLE INTERVIEW LESSON:
═══════════════════════════════════════════════════════════════

  Without convention:
  ┌──────────────────────────────────────────────────────────┐
  │ "Should mid be +1 or not?"                             │
  │ "Should hi be mid or mid-1?"                           │
  │ "Should loop be < or <=?"                              │
  │ → Panic! +1 -1 issues EVERYWHERE! 😱                  │
  └──────────────────────────────────────────────────────────┘

  With convention (lo inclusive, hi exclusive):
  ┌──────────────────────────────────────────────────────────┐
  │ needle > value → lo = mid + 1 (inclusive, skip mid!)  │
  │ needle < value → hi = mid (exclusive already!)        │
  │ loop: while lo < hi (exclusive = don't include!)      │
  │ → Clean, consistent, no panic! ✅                     │
  └──────────────────────────────────────────────────────────┘

  "Come in with a PLAN." — Prime
```

---

## §5. Tự Implement: Complete Binary Search

```javascript
// ═══ Complete Binary Search Implementation ═══

function binarySearch(haystack, needle) {
  let lo = 0;
  let hi = haystack.length; // exclusive!

  do {
    const m = Math.floor(lo + (hi - lo) / 2);
    const value = haystack[m];

    if (value === needle) return true;
    else if (value > needle) hi = m;
    else lo = m + 1;
  } while (lo < hi);

  return false;
}

// Also: return INDEX version!
function binarySearchIndex(haystack, needle) {
  let lo = 0;
  let hi = haystack.length;

  do {
    const m = Math.floor(lo + (hi - lo) / 2);
    const value = haystack[m];

    if (value === needle)
      return m; // return INDEX!
    else if (value > needle) hi = m;
    else lo = m + 1;
  } while (lo < hi);

  return -1; // sentinel value!
}

// Tests
const sorted = [1, 3, 5, 7, 9, 11, 13, 15, 17, 19, 21];

console.log("═══ BINARY SEARCH ═══\n");

// Boolean version
console.log("Boolean:");
console.log("  Search 9:", binarySearch(sorted, 9)); // true
console.log("  Search 20:", binarySearch(sorted, 20)); // false

// Index version
console.log("\nIndex:");
console.log("  Search 9:", binarySearchIndex(sorted, 9)); // 4
console.log("  Search 20:", binarySearchIndex(sorted, 20)); // -1

// Edge cases
console.log("\nEdge cases:");
console.log("  First element:", binarySearch(sorted, 1)); // true
console.log("  Last element:", binarySearch(sorted, 21)); // true
console.log("  Empty array:", binarySearch([], 5)); // false
console.log("  Single element:", binarySearch([5], 5)); // true
console.log("  Single wrong:", binarySearch([5], 3)); // false

// Performance comparison
console.log("\n═══ PERFORMANCE ═══\n");
const big = Array.from({ length: 1000000 }, (_, i) => i * 2);
const target = 999998;

let linearSteps = 0;
for (let i = 0; i < big.length; i++) {
  linearSteps++;
  if (big[i] === target) break;
}

let binarySteps = 0;
let lo = 0,
  hi = big.length;
do {
  binarySteps++;
  const m = Math.floor(lo + (hi - lo) / 2);
  if (big[m] === target) break;
  else if (big[m] > target) hi = m;
  else lo = m + 1;
} while (lo < hi);

console.log(`Array size: ${big.length.toLocaleString()}`);
console.log(`Linear search: ${linearSteps.toLocaleString()} steps`);
console.log(`Binary search: ${binarySteps} steps`);
console.log(`Speedup: ${Math.round(linearSteps / binarySteps)}x faster! 🚀`);
```

---

## Checklist

```
[ ] Direct pseudocode → TypeScript translation!
[ ] Math.floor for integer midpoint!
[ ] Don't forget /2! (Prime's 3-minute bug!)
[ ] 7 lines of actual code!
[ ] Google interview: +1 -1 issues without convention!
[ ] Convention saves: lo inclusive, hi exclusive!
[ ] Sentinel value -1 for not-found index!
[ ] First try pass! ✅
TIẾP THEO → Phần 9: Two Crystal Balls Problem!
```
