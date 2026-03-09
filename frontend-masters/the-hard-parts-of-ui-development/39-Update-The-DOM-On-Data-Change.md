# The Hard Parts of UI Development — Phần 39: Update the DOM on Data Change — "State Hook, updateName(), No More setInterval!"

> 📅 2026-03-08 · ⏱ 30 phút đọc
>
> Nguồn: Frontend Masters — Will Sentance
> Bài: Update the DOM on Data Change — "Performance problem, state hook concept, updateName wraps data change + updateDOM!"
> Độ khó: ⭐️⭐️⭐️⭐️⭐️ | Advanced — performance analysis, state hook birth, closure hint, diffing teaser!

---

## Mục Lục

| #   | Phần                                                 |
| --- | ---------------------------------------------------- |
| 1   | Performance Problem — "Untenable!"                   |
| 2   | Two Problems — "setInterval + Full Rebuild!"         |
| 3   | State Hook Concept — "Alexa: With a Function!"       |
| 4   | updateName — "Low-Key Runs updateDOM!"               |
| 5   | Restrict Team — "Only Change Data Through Function!" |
| 6   | Diffing Teaser — "Compare Old vs New VDOM!"          |
| 7   | Tự Implement: State Hook                             |
| 8   | 🔬 Deep Analysis — From setInterval to State Hook    |

---

## §1. Performance Problem — "Untenable!"

> Will: _"All of this becomes UNTENABLE in terms of performance. We are replacing ALL our DOM elements in C++ on EVERY change of data."_

### Chi phí quá cao!

Will: _"We managed to get semi-visual coding from JavaScript — the language that DOESN'T have anything that looks like what's gonna show up on the page — however, at a COST."_

Cost:

1. **Brand-new description** mỗi lần data thay đổi!
2. **Convert one-by-one** tất cả elements thành DOM elements!
3. **Replace ALL** children trên body!

_"Performance is a NIGHTMARE."_ 💀

```
PERFORMANCE PROBLEM:
═══════════════════════════════════════════════════════════════

  Data changes: name = "" → "Li"

  WHAT HAPPENS:
  ┌──────────────────────────────────────────────────────────┐
  │ 1. createVDOM() → brand new array! (all elements!)    │
  │ 2. VDOM.map(convert) → createElement for EVERY one!   │
  │ 3. replaceChildren(...) → replace ALL children!       │
  │                                                          │
  │ Even unchanged elements get RECREATED! 😤              │
  │ "Performance is a NIGHTMARE." — Will                   │
  └──────────────────────────────────────────────────────────┘
```

---

## §2. Two Problems — "setInterval + Full Rebuild!"

> Will: _"We're updating our DOM every 15 milliseconds. We do NOT need to run updateDOM 60 times a second where the user didn't even CHANGE the data — that was pretty SPURIOUS behavior."_

### Problem 1: setInterval chạy liên tục!

Will: _"That was super inefficient. We were recreating with every single time UNNECESSARILY."_

setInterval runs updateDOM 60+ times/second → hầu hết là **vô ích** vì data chưa thay đổi!

### Problem 2: Full DOM rebuild!

Ngay cả khi data thay đổi → rebuild TOÀN BỘ elements → cực kỳ lãng phí!

```
TWO PROBLEMS:
═══════════════════════════════════════════════════════════════

  PROBLEM 1: setInterval (runs always!):
  ┌──────────────────────────────────────────────────────────┐
  │ t=15ms: updateDOM() → no data change → WASTED!       │
  │ t=30ms: updateDOM() → no data change → WASTED!       │
  │ t=45ms: updateDOM() → no data change → WASTED!       │
  │ t=60ms: updateDOM() → DATA CHANGED! → useful! ✅     │
  │ t=75ms: updateDOM() → no data change → WASTED!       │
  │ → 80% wasted runs! 😤                                 │
  └──────────────────────────────────────────────────────────┘

  PROBLEM 2: Full rebuild (even when useful!):
  ┌──────────────────────────────────────────────────────────┐
  │ Only "name" changed → but ALL 3 elements recreated!   │
  │ Input: recreated! (only value changed!)               │
  │ Div "Hello": recreated! (only text changed!)          │
  │ Div "great job": recreated! (NOTHING changed!) 😤     │
  └──────────────────────────────────────────────────────────┘
```

---

## §3. State Hook Concept — "Alexa: With a Function!"

> Will: _"How do I wrap up two lines of code into a composite task?"_
> Alexa: _"With a FUNCTION."_

### Wrap data change + updateDOM into ONE function!

Will: _"There must be a way in which I could wrap up my changing of my data and a rerun of updateDOM into one COMPOSITE TASK."_

Will hỏi: _"How do I wrap up two lines of code, Alexa?"_

Alexa: _"With a function."_ ✅

Ý tưởng: thay vì:

```javascript
name = "Li"; // line 1: change data!
updateDOM(); // line 2: re-render!
```

→ Gộp vào 1 function:

```javascript
function updateName(newValue) {
  name = newValue; // change data!
  updateDOM(); // re-render! (low-key!)
}
```

---

## §4. updateName — "Low-Key Runs updateDOM!"

> Will: _"I'm gonna pass in 'Li', where I will assign Li to name and then run updateDOM. So now updateDOM runs WHENEVER my data is changing — but I'm not manually doing that."_

### "Low-key behind-the-scenes!"

Will: _"I'm gonna simulate, give the impression that all I'm doing is updating my name. But pass it through a function that updates name AND low-key behind-the-scenes runs updateDOM."_

_"As long as we restrict developers on our team to only change state through a function that also low-key runs updateDOM."_

```
updateName — STATE HOOK:
═══════════════════════════════════════════════════════════════

  BEFORE (manual, error-prone):
  ┌──────────────────────────────────────────────────────────┐
  │ name = "Li";   // change data... ✅                    │
  │ updateDOM();   // oops, FORGOT THIS! ❌                │
  │ → Page out of sync! 😱                                │
  └──────────────────────────────────────────────────────────┘

  AFTER (state hook, automatic!):
  ┌──────────────────────────────────────────────────────────┐
  │ function updateName(newVal) {                           │
  │   name = newVal;   // change data! ✅                  │
  │   updateDOM();     // LOW-KEY runs! ✅                 │
  │ }                                                        │
  │                                                          │
  │ updateName("Li");  // just call this! 🎯               │
  │ → Data changes AND page updates!                       │
  │ → Developer doesn't think about updateDOM!             │
  └──────────────────────────────────────────────────────────┘

  "Low-key behind-the-scenes!" — Will 😏
```

---

## §5. Restrict Team — "Only Change Data Through Function!"

> Will: _"We would do that via a CLOSURE that locks down access to our data and ensures you can only change it through a function."_

### Closure hint!

Will: _"As long as we RESTRICT developers on our team to only change data through a function. We would do that via a closure that LOCKS DOWN access to our data."_

→ Đây chính là hint cho **useState** hook!

- Closure locks data → only accessible via setter!
- Setter = function that changes data + triggers re-render!

```
CLOSURE — LOCK DOWN DATA:
═══════════════════════════════════════════════════════════════

  WITHOUT closure (anyone can mutate!):
  ┌──────────────────────────────────────────────────────────┐
  │ let name = "";                                           │
  │ name = "Li";     // anyone can change! ❌              │
  │ // Forgot updateDOM! → out of sync!                    │
  └──────────────────────────────────────────────────────────┘

  WITH closure (locked!):
  ┌──────────────────────────────────────────────────────────┐
  │ function useState(initial) {                             │
  │   let data = initial;  // CLOSED OVER! 🔒             │
  │   function setData(newVal) {                             │
  │     data = newVal;     // only way to change!          │
  │     updateDOM();       // auto re-render! ✅           │
  │   }                                                      │
  │   return [data, setData];                                │
  │ }                                                        │
  │ const [name, setName] = useState(""); // React! 🎯    │
  └──────────────────────────────────────────────────────────┘
```

---

## §6. Diffing Teaser — "Compare Old vs New VDOM!"

> Will: _"What if we used the actual DIFFERENCES between our JavaScript arrays to determine — not just wipe the whole thing — but only create elements from scratch on the FIRST displaying?"_

### Only change what actually changed!

Will: _"After that, just switch out the specific content changes as needed. We DON'T get to think about that though as developers — we just describe the relationship and write the handlers."_

_"We are going to be able to FIX our performance issues."_

Two solutions:

1. **State hook** → run updateDOM only when data changes! (Problem 1 ✅)
2. **Diffing algorithm** → compare old vs new VDOM, only update differences! (Problem 2 ✅)

```
TWO SOLUTIONS:
═══════════════════════════════════════════════════════════════

  PROBLEM 1 → SOLUTION: State Hook!
  ┌──────────────────────────────────────────────────────────┐
  │ No more setInterval!                                     │
  │ updateDOM only when data ACTUALLY changes!             │
  └──────────────────────────────────────────────────────────┘

  PROBLEM 2 → SOLUTION: Diffing!
  ┌──────────────────────────────────────────────────────────┐
  │ Archive old VDOM!                                        │
  │ Compare old vs new!                                      │
  │ Only update CHANGED elements!                           │
  │ "Not just wipe the whole thing!" — Will 🚀             │
  └──────────────────────────────────────────────────────────┘
```

---

## §7. Tự Implement: State Hook

```javascript
// ═══ State Hook — No More setInterval! ═══

let name = "";

// STATE HOOK: wrap data change + updateDOM!
function updateName(newVal) {
  name = newVal;
  console.log(`  updateName("${newVal}"): data changed!`);
  updateDOM(); // LOW-KEY! 😏
}

function createVDOM() {
  return [
    ["input", name, handle],
    ["div", `Hello, ${name}!`],
    ["div", "great job"],
  ];
}

function handle(e) {
  updateName(e.target.value); // NOT name = value!
}

function convert(node) {
  return { type: node[0], content: node[1] };
}

function updateDOM() {
  const VDOM = createVDOM();
  const elems = VDOM.map(convert);
  console.log("  updateDOM: re-render!");
  elems.forEach((el) =>
    console.log(`    <${el.type}>${el.content}</${el.type}>`),
  );
}

// Demo — NO setInterval!
console.log("═══ STATE HOOK ═══\n");

console.log("Initial render:");
updateDOM();

console.log("\nUser types 'Li' → updateName:");
updateName("Li"); // auto re-renders!

console.log("\nUser types 'Will' → updateName:");
updateName("Will"); // auto re-renders!

console.log("\n✅ No setInterval — only runs when data changes!");
console.log("✅ updateName = state hook (data + re-render)!");
console.log("✅ 'Low-key behind-the-scenes!' — Will");
```

---

## §8. 🔬 Deep Analysis — From setInterval to State Hook

```
EVOLUTION:
═══════════════════════════════════════════════════════════════

  v1: Manual updateDOM calls
  → Change data... remember to call updateDOM? 😤

  v2: setInterval(updateDOM, 15)
  → Auto but WASTEFUL — runs even when no change! 😤

  v3: State Hook (NOW!)
  → updateName = data change + updateDOM!
  → Runs ONLY when data changes! ✅
  → Developer just calls updateName("Li")!

  v4: React useState (NEXT!)
  → const [name, setName] = useState("")
  → Closure locks data! Only setName can change!
  → setName triggers re-render automatically!

  "There must be a BETTER WAY.
   Wrap two lines into one with a function!" — Will 🎯
```

---

## Checklist

```
[ ] Performance: replacing ALL DOM elements = nightmare!
[ ] Problem 1: setInterval runs 60x/sec even when no change!
[ ] Problem 2: full rebuild even for unchanged elements!
[ ] State hook: updateName = data change + updateDOM!
[ ] "Low-key behind-the-scenes!" — Will
[ ] Closure: lock data, only change via function!
[ ] Diffing teaser: compare old vs new VDOM!
[ ] "We DON'T think about re-rendering — we just describe!" — Will
TIẾP THEO → Phần 40: State Hook & Diffing!
```
