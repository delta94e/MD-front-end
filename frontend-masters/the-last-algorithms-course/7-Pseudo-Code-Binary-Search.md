# The Last Algorithms Course You'll Need — Phần 7: Pseudo-code Binary Search — "lo, hi, Midpoint, 3 Conditions, Off-by-One!"

> 📅 2026-03-08 · ⏱ 25 phút đọc
>
> Nguồn: Frontend Masters — ThePrimeagen
> Bài: Pseudo-code Binary Search — "lo/hi pointers, midpoint formula, 3 conditions, lo inclusive hi exclusive, off-by-one terror!"
> Độ khó: ⭐️⭐️⭐️⭐️ | Core — pseudocode design, boundary conventions, the classic off-by-one!

---

## Mục Lục

| #   | Phần                                              |
| --- | ------------------------------------------------- |
| 1   | Function Signature — "lo, hi, the Search Space!"  |
| 2   | Loop Condition — "When lo and hi Cross!"          |
| 3   | Midpoint Formula — "lo + (hi - lo) / 2!"          |
| 4   | 3 Conditions — "Equal, Greater, Less!"            |
| 5   | lo Inclusive, hi Exclusive — "Off-by-One Terror!" |
| 6   | Q: "Shouldn't It Be <=?" — "NO!"                  |
| 7   | Q: "Array Must Be Sorted?" — "Absolutely!"        |
| 8   | Tự Implement: Pseudocode → Code                   |

---

## §1. Function Signature — "lo, hi, the Search Space!"

> Prime: _"We could have a function search that takes an array, and maybe it has a lo and a hi — this is the SPACE in which you need to look."_

### lo and hi define the search window!

```
search(array, lo, hi, needle):
  lo = start of search space (inclusive!)
  hi = end of search space (exclusive!)
  needle = value we're looking for!
```

---

## §2. Loop Condition — "When lo and hi Cross!"

> Student: _"Comparing to the low..."_ → Prime: _"Yeah, exactly! When lo and hi effectively become each other, we're done. We've halved our space to the point where we can no longer halve."_

### Loop until lo >= hi!

`do...while (lo < hi)` → keep going until pointers cross!

Prime: _"They're gonna always keep getting closer to each other. We'll know that will eventually happen."_

---

## §3. Midpoint Formula — "lo + (hi - lo) / 2!"

> Prime: _"Midpoint is lo + (hi - lo) / 2 — we're getting the middle point with the offset."_

### Tại sao không dùng (lo + hi) / 2?

- `(lo + hi) / 2` → có thể **integer overflow** nếu lo và hi lớn!
- `lo + (hi - lo) / 2` → an toàn hơn! Luôn dùng cách này!

```
MIDPOINT FORMULA:
═══════════════════════════════════════════════════════════════

  ❌ Naive (overflow risk!):
  mid = (lo + hi) / 2

  ✅ Safe:
  mid = lo + Math.floor((hi - lo) / 2)

  Example: lo = 3, hi = 9
  mid = 3 + floor((9 - 3) / 2) = 3 + 3 = 6 ✅
```

---

## §4. 3 Conditions — "Equal, Greater, Less!"

> Prime: _"Does anyone know what the three conditions are?"_

### Ba trường hợp tại midpoint!

```
3 CONDITIONS:
═══════════════════════════════════════════════════════════════

  value = array[midpoint]

  1. value === needle → FOUND! Return true! 🎉

  2. value < needle → needle is on the RIGHT side!
     → lo = midpoint + 1 (skip midpoint!)
     → Search right half!

  3. value > needle → needle is on the LEFT side!
     → hi = midpoint (exclude midpoint!)
     → Search left half!
```

Prime: _"We don't need to consider the midpoint — we already know it's not the right value. So we adjust and put it right in front."_

---

## §5. lo Inclusive, hi Exclusive — "Off-by-One Terror!"

> Prime: _"I always do: lo is INCLUSIVE, hi is EXCLUSIVE. Always have these in your head or else this +1 is gonna eat your lunch."_

### Convention cứu mạng!

```
BOUNDARY CONVENTION:
═══════════════════════════════════════════════════════════════

  lo is INCLUSIVE:  we DO look at index lo!
  hi is EXCLUSIVE:  we do NOT look at index hi!

  [lo, hi)  ← half-open interval!

  Why this matters:
  - value < needle → lo = mid + 1 (skip mid, inclusive!)
  - value > needle → hi = mid (exclude mid, exclusive!)

  "Always come in with a PLAN or else it DESTROYS you." — Prime ⚠️
```

### Complete pseudocode!

```
function search(array, needle):
  lo = 0
  hi = array.length          // exclusive!

  do:
    mid = lo + floor((hi - lo) / 2)
    value = array[mid]

    if value === needle:
      return true             // found!
    else if value > needle:
      hi = mid                // search left (exclusive!)
    else:
      lo = mid + 1            // search right (inclusive!)

  while lo < hi

  return false                // not found!
```

---

## §6. Q: "Shouldn't It Be <=?" — "NO!"

> Student: _"Shouldn't it be less than or equal to hi?"_
> Prime: _"We DON'T want to do less than or equal to."_

### lo < hi, NOT lo <= hi!

Prime: _"lo is INCLUDED but hi should NOT be included. If we include 1 but should exclude 1, what does that mean? It means our pointers are actually BEHIND each other — a fundamentally broken state."_

```
WHY lo < hi (NOT <=):
═══════════════════════════════════════════════════════════════

  When lo === hi:
  [lo/hi)  ← empty range! Nothing to search!
  → Stop! We're done!

  When lo < hi:
  [lo .... hi)  ← there's still space!
  → Keep searching!

  When lo > hi:
  BROKEN STATE! This shouldn't happen!

  "If you include hi when it should be excluded,
   your pointers are in a BROKEN STATE." — Prime
```

---

## §7. Q: "Array Must Be Sorted?" — "Absolutely!"

> Student: _"This is all under the assumption the array is sorted?"_
> Prime: _"You can NEVER do this on a non-sorted array."_

### Sorted = prerequisite!

Prime: _"When you come to these two conditions — if I am larger than the current element, then the rest of the LEFT side is ALL lower. I know that for a FACT. It reduces your search space by half because you can make that single value statement."_

---

## §8. Tự Implement: Pseudocode → Code

```javascript
// ═══ Binary Search — Pseudocode → Code ═══

function binarySearch(haystack, needle) {
  let lo = 0; // inclusive!
  let hi = haystack.length; // exclusive!

  do {
    const mid = lo + Math.floor((hi - lo) / 2);
    const value = haystack[mid];

    if (value === needle) {
      return true; // FOUND!
    } else if (value > needle) {
      hi = mid; // search LEFT (exclusive!)
    } else {
      lo = mid + 1; // search RIGHT (inclusive!)
    }
  } while (lo < hi);

  return false; // NOT FOUND!
}

// Demo
const sorted = [1, 3, 5, 7, 9, 11, 13, 15, 17, 19];

console.log("═══ BINARY SEARCH ═══\n");
console.log("Array:", sorted.join(", "));

[1, 9, 15, 19, 4, 20].forEach((target) => {
  const found = binarySearch(sorted, target);
  console.log(`Search ${target}: ${found ? "✅ Found!" : "❌ Not found!"}`);
});

// Verbose version
function binarySearchVerbose(haystack, needle) {
  let lo = 0,
    hi = haystack.length,
    steps = 0;
  do {
    steps++;
    const mid = lo + Math.floor((hi - lo) / 2);
    const value = haystack[mid];
    console.log(`  Step ${steps}: lo=${lo} hi=${hi} mid=${mid} value=${value}`);
    if (value === needle) {
      console.log(`  → FOUND in ${steps} steps!`);
      return true;
    } else if (value > needle) hi = mid;
    else lo = mid + 1;
  } while (lo < hi);
  console.log(`  → NOT FOUND in ${steps} steps!`);
  return false;
}

console.log("\n═══ VERBOSE ═══\n");
console.log("Search 13:");
binarySearchVerbose(sorted, 13);
console.log("\nSearch 4 (not in array):");
binarySearchVerbose(sorted, 4);
```

---

## Checklist

```
[ ] lo/hi = search space boundaries!
[ ] Midpoint: lo + floor((hi - lo) / 2) — safe formula!
[ ] 3 conditions: equal (found!), greater (go left), less (go right)!
[ ] lo INCLUSIVE, hi EXCLUSIVE = convention!
[ ] lo = mid + 1 (don't re-check mid!)
[ ] hi = mid (already exclusive!)
[ ] Loop: while lo < hi (NOT <=!)
[ ] "Off-by-one will EAT YOUR LUNCH!" — Prime ⚠️
[ ] Prerequisite: sorted array ONLY!
TIẾP THEO → Phần 8: Implementing Binary Search!
```
