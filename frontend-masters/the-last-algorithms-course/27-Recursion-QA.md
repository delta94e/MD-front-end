# The Last Algorithms Course You'll Need — Phần 27: Recursion Q&A — "Backtracking, CSS Ordering Perf, Big O = O(N), Seen Prevents Loops!"

> 📅 2026-03-09 · ⏱ 15 phút đọc
>
> Nguồn: Frontend Masters — ThePrimeagen
> Bài: Recursion Q&A — "Backtracking via pop, seen prevents revisiting, direction order doesn't matter in general case, Big O = O(4N) → O(N)!"
> Độ khó: ⭐️⭐️⭐️ | Q&A — backtracking explained, performance analysis, Big O derivation!

---

## Mục Lục

| #   | Phần                                                       |
| --- | ---------------------------------------------------------- |
| 1   | Q: "Going Back on Own Path?" — "Seen Prevents It!"         |
| 2   | Backtracking Walkthrough — "Push, Recurse, Pop!"           |
| 3   | Q: "Does Direction Order Matter?" — "Not in General Case!" |
| 4   | Q: "What's the Big O?" — "O(4S) → O(N)!"                   |

---

## §1. Q: "Going Back on Own Path?" — "Seen Prevents It!"

> Student: _"If we're going somewhere and then have to go back — does it get mad that it's going back on its own path?"_

### The seen array saves us!

Prime: _"When we mark a square as seen = true, we can never visit it again. So when we try to go back, the seen check returns false immediately."_

```
BACKTRACKING:
═══════════════════════════════════════════════════════════════

  x0 (seen=true) → x1 (seen=true) → x2 (seen=true)
                                      ↓
                                   All 4 dirs fail:
                                   up=wall, right=wall,
                                   down=wall, left=SEEN!
                                      ↓
                                   path.pop(x2)
                                   return false!
                    ↓
                 x1 continues checking other dirs...
```

---

## §2. Backtracking Walkthrough — "Push, Recurse, Pop!"

> Prime draws the walkthrough step by step:

```
DETAILED BACKTRACKING:
═══════════════════════════════════════════════════════════════

  Start at x0:
    path = [x0], seen[x0] = true

  Try right → x1:
    path = [x0, x1], seen[x1] = true

  Try right → x2:
    path = [x0, x1, x2], seen[x2] = true
    up = wall ❌, right = wall ❌, down = wall ❌
    left = x1 → SEEN! ❌

  Dead end! POST: path.pop()
    path = [x0, x1]
    return false to x1

  x1 tries down: can't
  x1 tries left: x0 = SEEN!
  Dead end! POST: path.pop()
    path = [x0]
    return false to x0

  x0 tries down: SUCCESS!
    path = [x0, x3], seen[x3] = true
    ...continues until finds end!
```

---

## §3. Q: "Does Direction Order Matter?" — "Not in General Case!"

> Student: _"Is there any scenario where the order would make a performance difference?"_
> Prime: _"In the GENERAL CASE, no. In a SPECIFIC case, if we happened to choose down first, we'd walk straight to the exit."_

_"Since you don't know the graph ahead of time, you can't pick a direction that would make the most sense. You can't cheat the system."_

---

## §4. Q: "What's the Big O?" — "O(4S) → O(N)!"

> Student: _"What would be the Big O time?"_
> Prime: _"At most, we will check every single square FOUR times."_

```
BIG O:
═══════════════════════════════════════════════════════════════

  Each square can be visited from 4 directions:
       ↑
    ← [S] →
       ↓

  At MOST: 4 checks per square!

  Total: O(4 × S) where S = number of squares

  Drop constant: O(S) → O(N)!

  → EFFECTIVELY LINEAR! 🎯

  "Walls you only check once. If the wall is adjacent
   to the perimeter, the checks go down." — Prime
```

---

## Checklist

```
[ ] Seen array prevents revisiting → no infinite loops!
[ ] Backtracking: push on enter, pop on dead end!
[ ] Direction order: doesn't matter in general case!
[ ] Big O: O(4S) → drop constant → O(N) linear!
[ ] Each square checked at most 4 times!
[ ] "Base case is everything" — Prime
TIẾP THEO → Phần 28: Quick Sort!
```
