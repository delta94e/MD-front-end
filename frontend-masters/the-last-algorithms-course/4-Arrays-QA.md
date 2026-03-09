# The Last Algorithms Course You'll Need — Phần 4: Arrays Q&A — "No Push, No Pop, Reallocation, Capacity Game!"

> 📅 2026-03-08 · ⏱ 15 phút đọc
>
> Nguồn: Frontend Masters — ThePrimeagen
> Bài: Arrays Q&A — "No insert/push/pop, size must be specified, reallocation, capacity tradeoff, JS underneath!"
> Độ khó: ⭐️⭐️ | Q&A — trả lời các câu hỏi về arrays!

---

## Mục Lục

| #   | Phần                                                        |
| --- | ----------------------------------------------------------- |
| 1   | Q: "No Insert, Push, Pop?" — "Technically No!"              |
| 2   | Q: "Must Specify Size?" — "Yes, Always!"                    |
| 3   | Q: "JS Creates Array Underneath?" — "Yes, But Complicated!" |
| 4   | Q: "How Big Is the Initial Buffer?" — "The Capacity Game!"  |
| 5   | 🔬 Deep Analysis — Static vs Dynamic                        |

---

## §1. Q: "No Insert, Push, Pop?" — "Technically No!"

> Student: _"So you're saying there is NO insert or push or pop in arrays?"_
> Prime: _"Technically no — not if it's a static array or traditional array. There are NO methods on it."_

### Older languages don't even have .length!

Prime: _"In some older languages, there's not even dot length. You have to pass the length AS WELL AS the pointer to the beginning."_

_"That's why when you look at any C program, the entry point is an array of strings AND how many strings there are."_

```c
// C entry point — array + length!
int main(int argc, char* argv[]) {
  // argc = HOW MANY strings
  // argv = pointer to the strings
  // No .length! You MUST pass the count!
}
```

_"It has to TELL YOU how to interpret these pieces of data."_

---

## §2. Q: "Must Specify Size?" — "Yes, Always!"

> Student: _"If an array doesn't grow, does its size and memory allocation have to be specified at initialization?"_
> Prime: _"If you use Rust and try to use an array, you will realize right away that you have to put in a SIZE."_

### Size = part of allocation!

Prime: _"It has to be a specified size. You can still create an array with N as its size — but it STILL has to be specified."_

_"There are also compile-time arrays where you actually have to say 'this thing is a 3, it's ALWAYS a 3.'"_

```
STATIC vs VARIABLE SIZE:
═══════════════════════════════════════════════════════════════

  Compile-time (fixed forever!):
  int a[3];  // ALWAYS 3! Can't change!

  Runtime (variable, but still fixed after creation!):
  int n = getUserInput();
  int a[n];  // Size = n, but once created, FIXED!

  "An array HAS TO have its size as part of
   its allocation. You CAN'T grow it." — Prime
```

### Reallocation!

Prime: _"You CAN reallocate — create a NEW array, take your old array, write it into the new one. You now have a bigger array, more room. But nonetheless, it is these FIXED sizes."_

---

## §3. Q: "JS Creates Array Underneath?" — "Yes, But Complicated!"

> Student: _"When creating an array in JavaScript, are you creating something that has an array underneath?"_
> Prime: _"In some sense, yes. There IS a literal array, a memory buffer at some point underneath. But we don't see it that way."_

### JS arrays = smart and complicated!

Prime: _"I'm sure they have — turn it into a MAP once you have too many items, or too sparse of an array. I'm sure they have a LOT of algorithms that make it 10 times more complicated."_

_"But for the most part, it OPERATES like an array."_

Then teases: _"I don't wanna give it away..."_ 😏

---

## §4. Q: "How Big Is the Initial Buffer?" — "The Capacity Game!"

> Student: _"How big is the array that you instantiate?"_
> Prime: _"That is part of OPTIMIZING."_

### Capacity = tradeoff!

Prime: _"In Rust, if you create a new vector, it's gonna create a memory buffer with size 5 underneath. As you push and pop, it has 5 units for you to play with."_

_"But is that efficient? How big do you need to create your underlying buffer to use that space without having to reallocate too much — or without NOT using it?"_

_"We could all create 10,000 units and never have to reallocate. But if they're big units, you're gonna use a LOT of memory just to have that there."_

```
CAPACITY GAME:
═══════════════════════════════════════════════════════════════

  Too small (capacity = 2):
  push, push → FULL! → reallocate! (expensive!)
  push, push → FULL! → reallocate! (again!)
  → Too many reallocations! 😤

  Too big (capacity = 10,000):
  push, push, push → using 3 of 10,000!
  → Wasting 9,997 slots of memory! 😤

  Just right (capacity = smart growth):
  Start with ~5, double when full!
  → 5 → 10 → 20 → 40 → ...
  → Amortized O(1) push! 🎯

  "It's a GAME people play." — Prime
```

---

## §5. 🔬 Deep Analysis — Static vs Dynamic

```
ARRAY TYPES:
═══════════════════════════════════════════════════════════════

  STATIC ARRAY (C, Rust [T; N]):
  ┌──────────────────────────────────────────────────────────┐
  │ Size fixed at compile time or creation!                │
  │ No methods! Pass length separately!                    │
  │ Must manage memory yourself!                           │
  └──────────────────────────────────────────────────────────┘

  DYNAMIC ARRAY (Vec<T>, ArrayList, std::vector):
  ┌──────────────────────────────────────────────────────────┐
  │ Static array UNDERNEATH!                               │
  │ Manages capacity + reallocation for you!               │
  │ Has push, pop, insert, etc.!                           │
  │ Grows by creating new array + copying!                 │
  └──────────────────────────────────────────────────────────┘

  JS "ARRAY" ([]):
  ┌──────────────────────────────────────────────────────────┐
  │ Even more complex! Smart morphing!                     │
  │ Might switch to hash map if sparse!                    │
  │ "10 times more complicated" — Prime                    │
  └──────────────────────────────────────────────────────────┘
```

---

## Checklist

```
[ ] No push/pop/insert on static arrays!
[ ] Older languages: no .length — pass count separately!
[ ] Size must be specified at creation!
[ ] Reallocation: create new array, copy old into new!
[ ] JS arrays: array underneath but "10x more complicated"!
[ ] Capacity game: too small = reallocate often, too big = waste memory!
[ ] Rust Vec: starts with ~5, grows as needed!
TIẾP THEO → Phần 5: Linear Search & Kata Setup!
```
