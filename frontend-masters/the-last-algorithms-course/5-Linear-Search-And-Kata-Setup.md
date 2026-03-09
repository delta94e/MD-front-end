# The Last Algorithms Course You'll Need — Phần 5: Linear Search & Kata Setup — "Simplest Algorithm, indexOf Underneath, O(N)!"

> 📅 2026-03-08 · ⏱ 25 phút đọc
>
> Nguồn: Frontend Masters — ThePrimeagen
> Bài: Linear Search & Kata Setup — "Whiteboard first → code, indexOf = linear search, O(N) worst case, kata machine setup!"
> Độ khó: ⭐️⭐️ | Beginner — first algorithm, linear search implementation, kata project!

---

## Mục Lục

| #   | Phần                                           |
| --- | ---------------------------------------------- |
| 1   | Phương Pháp — "Whiteboard First, Code Second!" |
| 2   | Linear Search — "The Simplest Search!"         |
| 3   | Big O Analysis — "Worst Case = O(N)!"          |
| 4   | Implementation — "indexOf Under the Hood!"     |
| 5   | Kata Machine Setup — "Practice Every Day!"     |
| 6   | Tự Implement: Linear Search                    |
| 7   | 🔬 Deep Analysis — Search Foundations          |

---

## §1. Phương Pháp — "Whiteboard First, Code Second!"

> Prime: _"We're gonna be VISUALIZING all the problems first — circles and arrows, boxes and arrows — and THEN we program it."_

### Core competency: abstraction → concreteness!

Prime: _"If you can get really good at visualizing, creating your problems on a whiteboard, then translating abstraction into concreteness — it's going to follow you for the REST OF YOUR LIFE."_

_"At this point, I can just think about it in my head in these terms and write out a program without the intermediate step."_

→ **Luôn vẽ trước, code sau!** Đây là skill quan trọng nhất!

---

## §2. Linear Search — "The Simplest Search!"

> Prime: _"We're gonna start with the SIMPLEST form of search — linear search. First thing we do is whiteboard this."_

### Concept!

Array từ 0 đến N, tìm value V:

- Bắt đầu từ index 0: _"X0, are you V?"_
- Nếu không → index 1: _"X1, are you V?"_
- Tiếp tục cho đến khi tìm thấy hoặc hết array!

Prime: _"Who in here hasn't used indexOf? Wanna guess what indexOf is probably doing underneath the hood? It's just walking LINEARLY until it finds the thing."_

→ **Linear search = indexOf!**

```
LINEAR SEARCH:
═══════════════════════════════════════════════════════════════

  Array: [3, 7, 2, 9, 5, 1, 8]
  Target: 5

  Step 1: [3] == 5? No!  →
  Step 2: [7] == 5? No!  →
  Step 3: [2] == 5? No!  →
  Step 4: [9] == 5? No!  →
  Step 5: [5] == 5? YES! ✅ Found at index 4!

  "We are literally implementing indexOf." — Prime
```

---

## §3. Big O Analysis — "Worst Case = O(N)!"

> Prime: _"What is the possible WORST CASE? If the value is not in the array, we go from 0 all the way to N and never find it."_

### Worst case analysis!

Prime applies 3 rules:

1. **Growth with respect to input**: Input doubles → search doubles!
2. **Drop constants**: Always!
3. **Worst case**: Value not in array = full scan!

Student: _"O(N)."_ → Prime: _"O(N), awesome!"_

_"As your input grows, so does the time it takes EQUIVALENTLY or linearly. If it grows by 10, you get 10 more cycles."_

```
O(N) — LINEAR:
═══════════════════════════════════════════════════════════════

  Array size → Max comparisons:
  N = 5       → 5 comparisons
  N = 50      → 50 comparisons
  N = 500     → 500 comparisons
  N = 5000    → 5000 comparisons

  → Grows LINEARLY with input!
  → Worst case: element NOT found = scan ALL!
```

---

## §4. Implementation — "indexOf Under the Hood!"

> Prime: _"This is as simple as it gets."_

### Code walkthrough!

```typescript
function linear_search(haystack: number[], needle: number): boolean {
  for (let i = 0; i < haystack.length; i++) {
    if (haystack[i] === needle) {
      return true;
    }
  }
  return false;
}
```

Prime: _"If we see it, we return true. If we don't, we return false. The SIMPLEST form of search."_

_"I normally do NOT return in the middle of a for loop. But for algorithms, I'm totally willing to make concessions on good programming techniques."_

```
FLOW:
═══════════════════════════════════════════════════════════════

  linear_search([3, 7, 2, 9, 5], 9):

  i=0: haystack[0]=3, 3===9? No!
  i=1: haystack[1]=7, 7===9? No!
  i=2: haystack[2]=2, 2===9? No!
  i=3: haystack[3]=9, 9===9? YES! → return true! ✅

  linear_search([3, 7, 2, 9, 5], 42):

  i=0: 3===42? No!
  i=1: 7===42? No!
  i=2: 2===42? No!
  i=3: 9===42? No!
  i=4: 5===42? No!
  → return false! ❌ (O(N) worst case!)
```

---

## §5. Kata Machine Setup — "Practice Every Day!"

> Prime: _"I created this little library to be able to do a bunch of algorithms. If you want to do them every day, it creates a way for you to do them as much as you want."_

### Kata = daily practice!

Prime's kata machine:

- Clone repo → `npm install` → `npm run generate`
- Each day generates fresh files for all algorithms!
- Test with: `npx jest Linear` → green = pass! ✅

Prime jokes: _"You could also just return true the first time and false the second time. And if you can keep state between the two tests, you will also win. Don't do that — actually program."_ 😂

Config in `ligma.config` (yes, "ligma" 😂): specify which algorithms to generate!

---

## §6. Tự Implement: Linear Search

```javascript
// ═══ Linear Search ═══

function linearSearch(haystack, needle) {
  for (let i = 0; i < haystack.length; i++) {
    if (haystack[i] === needle) {
      return true;
    }
  }
  return false;
}

// Demo
const arr = [3, 7, 2, 9, 5, 1, 8, 4, 6];

console.log("═══ LINEAR SEARCH ═══\n");

// Found!
console.log("Search 9:", linearSearch(arr, 9)); // true
console.log("Search 1:", linearSearch(arr, 1)); // true
console.log("Search 6:", linearSearch(arr, 6)); // true

// Not found!
console.log("Search 42:", linearSearch(arr, 42)); // false
console.log("Search 0:", linearSearch(arr, 0)); // false

// Count comparisons
function linearSearchVerbose(haystack, needle) {
  let comparisons = 0;
  for (let i = 0; i < haystack.length; i++) {
    comparisons++;
    if (haystack[i] === needle) {
      console.log(`  Found at index ${i}! (${comparisons} comparisons)`);
      return true;
    }
  }
  console.log(`  Not found! (${comparisons} comparisons = O(N))`);
  return false;
}

console.log("\n═══ VERBOSE ═══\n");
linearSearchVerbose(arr, 5); // found early
linearSearchVerbose(arr, 6); // found late
linearSearchVerbose(arr, 99); // not found = worst case!

console.log("\n✅ Linear search = indexOf underneath!");
console.log("✅ O(N) worst case!");
console.log("✅ Simplest algorithm possible!");
```

---

## §7. 🔬 Deep Analysis — Search Foundations

```
SEARCH FOUNDATIONS:
═══════════════════════════════════════════════════════════════

  LINEAR SEARCH:
  ┌──────────────────────────────────────────────────────────┐
  │ Input: any array (sorted or unsorted!)                 │
  │ Method: check every element one by one!                │
  │ Time: O(N) worst case!                                 │
  │ Best case: O(1) — first element!                       │
  │ Use case: unsorted data, small arrays!                 │
  └──────────────────────────────────────────────────────────┘

  COMING NEXT — BINARY SEARCH:
  ┌──────────────────────────────────────────────────────────┐
  │ Input: SORTED array only!                              │
  │ Method: halve search space each step!                  │
  │ Time: O(log N)!                                        │
  │ Much faster for large sorted arrays!                   │
  └──────────────────────────────────────────────────────────┘

  METHODOLOGY:
  1. Whiteboard first! (visualize!)
  2. Define worst case! (what makes it fail?)
  3. Apply Big O rules! (growth, drop constants, worst case!)
  4. Code it! (translate abstraction → concreteness!)

  "Visualizing then translating abstraction into
   concreteness — follows you for LIFE." — Prime 🎯
```

---

## Checklist

```
[ ] Methodology: whiteboard → code!
[ ] Linear search: check each element one by one!
[ ] indexOf = linear search underneath!
[ ] O(N) worst case (element not found)!
[ ] Implementation: for loop + early return!
[ ] Kata machine: daily algorithm practice!
[ ] ligma.config: specify which algorithms to generate 😂!
[ ] Test: npx jest Linear → green!
TIẾP THEO → Phần 6: Binary Search!
```
