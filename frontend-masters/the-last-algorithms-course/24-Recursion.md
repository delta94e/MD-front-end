# The Last Algorithms Course You'll Need — Phần 24: Recursion — "Base Case, Pre/Recurse/Post, Stack of Functions, foo(5) Walkthrough!"

> 📅 2026-03-09 · ⏱ 30 phút đọc
>
> Nguồn: Frontend Masters — ThePrimeagen
> Bài: Recursion — "Function calls itself until base case, return address + value + arguments, pre/recurse/post steps, sum walkthrough!"
> Độ khó: ⭐️⭐️⭐️⭐️ | Core — recursion fundamentals, call stack, base case, three steps of recurse!

---

## Mục Lục

| #   | Phần                                                         |
| --- | ------------------------------------------------------------ |
| 1   | Google Recursion Bug — "Did You Mean Recursion?" 😂          |
| 2   | Definition — "Function Calls Itself Until Base Case!"        |
| 3   | The Simplest Recursion — "Sum 1 to N!"                       |
| 4   | What Happens Under the Hood — "Return Address, Value, Args!" |
| 5   | Walkthrough foo(5) — "Down the Stack, Up the Stack!"         |
| 6   | Three Steps of Recurse — "Pre, Recurse, Post!"               |
| 7   | Stack Overflow — "Not the Website!" 😂                       |
| 8   | When to Use Recursion? — "Branching Factor, No For Loop!"    |
| 9   | Tự Implement: Recursive Sum                                  |

---

## §1. Google Recursion Bug — "Did You Mean Recursion?" 😂

> Prime: _"If you type recursion and hit Enter, Google says 'Did you mean recursion?' and if you click it, it says it again. FOREVER."_

_"But if you MISSPELL it — it doesn't do the joke. I busted Google!"_

---

## §2. Definition — "Function Calls Itself Until Base Case!"

> Prime: _"A function that calls itself — this keeps happening until it reaches something known as a BASE CASE. At that point, the function no longer calls itself."_

### Two parts!

1. **Base case** — when to STOP recursing!
2. **Recurse** — call yourself with different arguments!

Prime: _"Recursion was my personal HARDEST one. It's honestly the hardest topic for me. Either you get it or you don't — there's no middle ground."_

---

## §3. The Simplest Recursion — "Sum 1 to N!"

```typescript
function foo(n: number): number {
  // BASE CASE: we know the answer!
  if (n === 1) return 1;

  // RECURSE: n + everything below!
  return n + foo(n - 1);
}

// foo(5) = 5 + foo(4)
//        = 5 + 4 + foo(3)
//        = 5 + 4 + 3 + foo(2)
//        = 5 + 4 + 3 + 2 + foo(1)
//        = 5 + 4 + 3 + 2 + 1
//        = 15!
```

Prime: _"If n === 1, the sum of 1 is 1. We KNOW it. That's our base case."_

---

## §4. What Happens Under the Hood — "Return Address, Value, Args!"

> Prime: _"Every time you call a function, three things are stored: RETURN ADDRESS (where to go back), RETURN VALUE (what to give back), ARGUMENTS (what was passed in)."_

```
FUNCTION CALL STACK:
═══════════════════════════════════════════════════════════════

  Each function call stores:
  ┌─────────────────────────────────────┐
  │ Return Address: who called me?     │
  │ Return Value:   what do I return?  │
  │ Arguments:      what was I given?  │
  └─────────────────────────────────────┘

  This is literally the STACK we learned about!
  Push on call, pop on return!
```

---

## §5. Walkthrough foo(5) — "Down the Stack, Up the Stack!"

```
foo(5) WALKTHROUGH:
═══════════════════════════════════════════════════════════════

  ──── GOING DOWN (recursing) ────

  foo(5): return = 5 + ???, arg = 5  → calls foo(4)
  foo(4): return = 4 + ???, arg = 4  → calls foo(3)
  foo(3): return = 3 + ???, arg = 3  → calls foo(2)
  foo(2): return = 2 + ???, arg = 2  → calls foo(1)
  foo(1): BASE CASE! return = 1      → STOP! ✅

  ──── GOING UP (unwinding) ────

  foo(1) → returns 1  to foo(2)
  foo(2) → 2 + 1 = 3  → returns 3  to foo(3)
  foo(3) → 3 + 3 = 6  → returns 6  to foo(4)
  foo(4) → 4 + 6 = 10 → returns 10 to foo(5)
  foo(5) → 5 + 10 = 15 → returns 15! 🎯

  "It goes DOWN the stack, then UP the stack.
   That's really important to see." — Prime
```

---

## §6. Three Steps of Recurse — "Pre, Recurse, Post!"

> Prime: _"The recurse can actually be broken into THREE steps. This becomes exceedingly important in later data structures, especially PATHING."_

### Pre → Recurse → Post!

```
THREE STEPS:
═══════════════════════════════════════════════════════════════

  function foo(n) {
    if (n === 1) return 1;   // base case!

    // PRE: do something BEFORE recursing!
    const result = n + foo(n - 1);
                       ↑
    // RECURSE: call yourself!

    // POST: do something AFTER recursing!
    console.log(n);   // logs: 1, 2, 3, 4, 5!

    return result;
  }

  PRE:     happens on the way DOWN! ↓
  POST:    happens on the way UP!   ↑
  RECURSE: the actual function call!
```

Prime: _"If we logged in the POST step, we'd see 1, 2, 3, 4, 5 — because post happens as we UNWIND the stack."_

---

## §7. Stack Overflow — "Not the Website!" 😂

> Prime: _"We store return address, return value, and arguments — so you'd run out of memory just calling it over and over. That's what a STACK OVERFLOW is."_

_"It's not the website where you ask a question and someone berates you. It's what actually happens on a computer."_

---

## §8. When to Use Recursion? — "Branching Factor, No For Loop!"

> Prime: _"When I can't concretely use a for loop — especially if there's a BRANCHING FACTOR. The maze has a branching factor of 4 (four possible directions). How do you do a for loop for that? You CAN'T."_

### Rule of thumb!

- **Can see the end? Simple loop?** → For loop!
- **Branching factor? No clear terminus?** → Recursion!

Prime: _"If you write recursion correctly, it becomes aggressively SIMPLE. If you write base cases within your recurse step, it becomes aggressively COMPLICATED."_

---

## §9. Tự Implement: Recursive Sum

```javascript
// ═══ Recursion — Sum ═══

function sum(n) {
  // Base case!
  if (n === 1) return 1;
  // Recurse!
  return n + sum(n - 1);
}

// Demo
console.log("═══ RECURSION ═══\n");
console.log("sum(5) =", sum(5)); // 15
console.log("sum(10) =", sum(10)); // 55
console.log("sum(100) =", sum(100)); // 5050 (Gauss!)

// Visualize the stack!
function sumVerbose(n, depth = 0) {
  const indent = "  ".repeat(depth);
  console.log(`${indent}↓ sum(${n})`);

  if (n === 1) {
    console.log(`${indent}↑ return 1 (BASE CASE!)`);
    return 1;
  }

  const result = n + sumVerbose(n - 1, depth + 1);
  console.log(`${indent}↑ return ${n} + ... = ${result}`);
  return result;
}

console.log("\n═══ STACK VISUALIZATION ═══\n");
sumVerbose(5);

// Pre vs Post
function prePost(n) {
  if (n === 0) return;
  process.stdout.write(`PRE:${n} `); // on the way DOWN!
  prePost(n - 1);
  process.stdout.write(`POST:${n} `); // on the way UP!
}

console.log("\n\n═══ PRE vs POST ═══\n");
prePost(4);
// PRE:4 PRE:3 PRE:2 PRE:1 POST:1 POST:2 POST:3 POST:4
console.log("\n\n✅ Pre = going DOWN, Post = going UP!");
```

---

## Checklist

```
[ ] Recursion = function calls itself!
[ ] Base case = when to STOP! (crucial!)
[ ] Three things stored: return address, value, args!
[ ] Goes DOWN the stack, then UP the stack!
[ ] Three steps: Pre, Recurse, Post!
[ ] Pre = on the way down, Post = on the way up!
[ ] Stack overflow = ran out of memory from recursion!
[ ] Use recursion when branching factor, can't use for loop!
[ ] "Base case is EXTREMELY important" — Prime (5x!)
TIẾP THEO → Phần 25: Path Finding — Base Case!
```
