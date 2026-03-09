# The Hard Parts of UI Development — Phần 41: Performance Gains Using Diffing — "findDiff, JSON.stringify, Only Change What Changed!"

> 📅 2026-03-08 · ⏱ 30 phút đọc
>
> Nguồn: Frontend Masters — Will Sentance
> Bài: Performance Gains Using Diffing — "Archive VDOM, findDiff loop, JSON.stringify comparison, skip unchanged!"
> Độ khó: ⭐️⭐️⭐️⭐️⭐️ | Advanced — diffing concept, findDiff algorithm, JSON.stringify comparison, preliminary code!

---

## Mục Lục

| #   | Phần                                      |
| --- | ----------------------------------------- |
| 1   | Recap — "Two Problems, One Solved!"       |
| 2   | The Waste — "Full Rebuild Every Time!"    |
| 3   | The Insight — "Archive + Compare!"        |
| 4   | findDiff — "Loop, Compare, Only Change!"  |
| 5   | JSON.stringify — "Easy Array Comparison!" |
| 6   | Example — "VDOM1 vs VDOM2!"               |
| 7   | Tự Implement: findDiff Algorithm          |
| 8   | 🔬 Deep Analysis — Diffing Architecture   |

---

## §1. Recap — "Two Problems, One Solved!"

> Will: _"We managed to prevent rerunning updateDOM every single time by introducing this HOOK code."_

### Problem 1: ✅ Solved by state hook!

No more setInterval → updateDOM only runs when data actually changes!

### Problem 2: ❌ Still unsolved!

Full DOM rebuild every time → even unchanged elements get recreated!

_"We then just proceeded to map through each element and recreate them from scratch every time. Was that really NECESSARY?"_

---

## §2. The Waste — "Full Rebuild Every Time!"

> Will: _"Only SOME of our elements need recreating from scratch. Couldn't we recreate our VDOM from scratch for composition, but then write an ALGORITHM to check what actually differs?"_

### createVDOM vẫn cần chạy (for composition!)

Will: _"All the benefit of composition — moving around elements in JavaScript memory, visually represented, one single description, one-to-one. Very descriptive, very declarative, very composable — but DANGEROUSLY INEFFICIENT."_

Key insight: **createVDOM luôn chạy lại** (để giữ composition) — nhưng **convert chỉ cần chạy cho elements thay đổi**!

```
THE WASTE:
═══════════════════════════════════════════════════════════════

  Data: name = "" → "Will"

  createVDOM (MUST re-run — for composition!):
  VDOM1 = [["input","",handle], ["div","Hello, !"], ["div","great job"]]
  VDOM2 = [["input","Will",handle], ["div","Hello, Will!"], ["div","great job"]]

  BEFORE (wasteful):
  ┌──────────────────────────────────────────────────────────┐
  │ convert(VDOM2[0]) → new input! (value changed ✅)     │
  │ convert(VDOM2[1]) → new div! (text changed ✅)        │
  │ convert(VDOM2[2]) → new div! (NOTHING changed! ❌)    │
  │ → 3 elements recreated, but only 2 needed change!     │
  └──────────────────────────────────────────────────────────┘

  AFTER (efficient — with diffing!):
  ┌──────────────────────────────────────────────────────────┐
  │ VDOM2[0] ≠ VDOM1[0] → UPDATE input! ✅               │
  │ VDOM2[1] ≠ VDOM1[1] → UPDATE div! ✅                 │
  │ VDOM2[2] = VDOM1[2] → SKIP! No change! 🚀            │
  └──────────────────────────────────────────────────────────┘
```

---

## §3. The Insight — "Archive + Compare!"

> Will: _"We have that JavaScript intermediate representation of what's to show up on the page. We have the PREVIOUS one based on the last data. Use that to compare how they actually changed."_

### VDOM = diffable archive!

Will: _"There's no other stuff on the page that could otherwise have shown up — it's ALL through that description in JavaScript."_

→ Vì **one-way data binding** → VDOM = **complete truth** → so sánh 2 VDOM = biết CHÍNH XÁC thay đổi gì!

_"Based on that, make the INCISIVE actual changes to the real C++ DOM."_

```
ARCHIVE + COMPARE:
═══════════════════════════════════════════════════════════════

  ONE-WAY DATA BINDING guarantees:
  ┌──────────────────────────────────────────────────────────┐
  │ VDOM = FULL description of page!                        │
  │ No other content can appear!                             │
  │ → Comparing 2 VDOMs = EXACT diff! 🎯                  │
  └──────────────────────────────────────────────────────────┘

  FLOW:
  VDOM_old → VDOM_new → findDiff → only update changes!
```

---

## §4. findDiff — "Loop, Compare, Only Change!"

> Will: _"We're gonna loop through one by one. When i is 0, look at the 0th element of VDOM1 and compare it to VDOM2. If they're not the same, write code to change the actual DOM element."_

### findDiff algorithm!

```javascript
function findDiff(oldVDOM, newVDOM) {
  for (let i = 0; i < oldVDOM.length; i++) {
    if (JSON.stringify(oldVDOM[i]) !== JSON.stringify(newVDOM[i])) {
      // DIFFERENT! → update real DOM element!
    }
    // SAME → skip! No DOM change needed!
  }
}
```

Will: _"Someone had to create the elements in the FIRST PLACE. But NEXT TIME we check — has the data led to an actual change such that we need to edit the real C++ DOM?"_

---

## §5. JSON.stringify — "Easy Array Comparison!"

> Will: _"We're gonna use JSON.stringify as our tool for easily comparing arrays and their content."_

### Arrays can't be compared with ===!

`["input", "", handle] === ["input", "", handle]` → **false**! (different references!)

Solution: JSON.stringify converts to string → compare strings!

Will: _"JSON.stringify will turn ['input', '', handle] into the string 'input, function handle'. Then we compare the two strings."_

```
JSON.stringify — COMPARISON:
═══════════════════════════════════════════════════════════════

  ❌ Direct comparison (won't work!):
  ["input","",handle] === ["input","",handle]  → FALSE!
  (different array references!)

  ✅ JSON.stringify (works!):
  JSON.stringify(["input","",handle])
  = '"input","","function handle"'

  JSON.stringify(["input","Will",handle])
  = '"input","Will","function handle"'

  Are they equal? NO! → element changed! Update DOM! ✅

  "JSON.stringify as our tool for EASILY comparing." — Will
```

---

## §6. Example — "VDOM1 vs VDOM2!"

> Will: _"For index 2: will 'div, great job' and 'div, great job' be the same? You BET they will. So will we go and change any actual DOM elements? NO, we won't even need to."_

### Full walkthrough!

| i   | VDOM1[i]              | VDOM2[i]                  | Same?  | Action   |
| --- | --------------------- | ------------------------- | ------ | -------- |
| 0   | ["input", "", handle] | ["input", "Will", handle] | ❌ NO  | UPDATE!  |
| 1   | ["div", "Hello, !"]   | ["div", "Hello, Will!"]   | ❌ NO  | UPDATE!  |
| 2   | ["div", "great job"]  | ["div", "great job"]      | ✅ YES | SKIP! 🚀 |

Will: _"They'll be exactly the same. So will we go and change any actual DOM elements? No, we won't even need to."_ 🎉

```
DIFFING RESULT:
═══════════════════════════════════════════════════════════════

  3 elements in VDOM, but only 2 actually changed!
  → Skip 1 element = 33% less DOM work! 🚀

  With 100 elements and 1 change:
  → Skip 99 elements = 99% less DOM work! 🚀🚀🚀

  "Couldn't we check what ACTUALLY differs
   and only change those?" — Will 🎯
```

---

## §7. Tự Implement: findDiff Algorithm

```javascript
// ═══ findDiff Algorithm ═══

let name = "";

function createVDOM() {
  return [
    ["input", name, "handle"],
    ["div", `Hello, ${name}!`],
    ["div", "great job"],
  ];
}

function findDiff(oldVDOM, newVDOM) {
  const changes = [];
  for (let i = 0; i < Math.max(oldVDOM.length, newVDOM.length); i++) {
    const oldStr = JSON.stringify(oldVDOM[i]);
    const newStr = JSON.stringify(newVDOM[i]);
    if (oldStr !== newStr) {
      changes.push({ index: i, old: oldVDOM[i], new: newVDOM[i] });
      console.log(`  [${i}] CHANGED! "${oldStr}" → "${newStr}"`);
    } else {
      console.log(`  [${i}] same — SKIP! 🚀`);
    }
  }
  return changes;
}

// Demo
console.log("═══ DIFFING ═══\n");

const VDOM1 = createVDOM();
console.log(
  "VDOM1 (name=''):",
  VDOM1.map((a) => `[${a[0]}, "${a[1]}"]`).join(", "),
);

name = "Will";
const VDOM2 = createVDOM();
console.log(
  "VDOM2 (name='Will'):",
  VDOM2.map((a) => `[${a[0]}, "${a[1]}"]`).join(", "),
);

console.log("\nDiff:");
const changes = findDiff(VDOM1, VDOM2);
console.log(`\n${changes.length} of ${VDOM2.length} elements need updating!`);
console.log(`${VDOM2.length - changes.length} elements SKIPPED! 🚀`);

// Larger example
console.log("\n═══ 10 ELEMENTS ═══\n");
function createBigVDOM(n) {
  const arr = [["input", n, "handle"]];
  for (let i = 0; i < 9; i++) arr.push(["div", `Post ${i}`]);
  return arr;
}
const big1 = createBigVDOM("");
const big2 = createBigVDOM("Li");
console.log("Diff (10 elements, only input changed):");
const bigChanges = findDiff(big1, big2);
console.log(
  `\n${bigChanges.length}/10 changed → ${10 - bigChanges.length} SKIPPED! 🚀`,
);
```

---

## §8. 🔬 Deep Analysis — Diffing Architecture

```
DIFFING ARCHITECTURE:
═══════════════════════════════════════════════════════════════

  WITHOUT diffing:
  data → createVDOM → map(convert) ALL → replaceChildren ALL
  → O(n) DOM operations for n elements! 😤

  WITH diffing:
  data → createVDOM → findDiff(old, new) → update ONLY changed!
  → O(k) DOM operations for k changes! (k << n) 🚀

  PREREQUISITES:
  1. One-way data binding (VDOM = full truth!)
  2. Archive old VDOM (for comparison!)
  3. JSON.stringify (for array comparison!)

  "Very descriptive, very declarative, very composable,
   but DANGEROUSLY INEFFICIENT.
   So we introduce DIFFING." — Will 🎯
```

---

## Checklist

```
[ ] Problem: full rebuild = dangerously inefficient!
[ ] createVDOM STILL re-runs (keeps composition!)
[ ] Archive old VDOM → compare with new!
[ ] One-way binding guarantees VDOM = complete truth!
[ ] findDiff: loop through, JSON.stringify compare!
[ ] Same? → SKIP! Different? → UPDATE!
[ ] "div, great job" same both times → skip! 🚀
[ ] JSON.stringify: arrays can't use === directly!
TIẾP THEO → Phần 42: Full Diffing Implementation!
```
