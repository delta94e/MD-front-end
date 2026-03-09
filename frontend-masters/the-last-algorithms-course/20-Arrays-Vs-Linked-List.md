# The Last Algorithms Course You'll Need — Phần 20: Arrays vs Linked List — "Trade-offs, Async Queue, Netflix Interview, It Depends!"

> 📅 2026-03-09 · ⏱ 20 phút đọc
>
> Nguồn: Frontend Masters — ThePrimeagen
> Bài: Arrays vs Linked List — "O(1) access vs O(1) insert/delete, no binary search on LL, async request queue, it depends!"
> Độ khó: ⭐️⭐️⭐️ | Comparison — understanding when to use which data structure!

---

## Mục Lục

| #   | Phần                                                       |
| --- | ---------------------------------------------------------- |
| 1   | Arrays — "O(1) Everything, But No Insert!"                 |
| 2   | Linked Lists — "O(1) Insert/Delete, But No Random Access!" |
| 3   | Memory — "Upfront vs On-Demand!"                           |
| 4   | No Binary Search on Linked List!                           |
| 5   | Async Request Queue — "Netflix Interview Question!"        |
| 6   | "It Depends!" — "Always Say It Depends!"                   |
| 7   | How to Traverse a Linked List?                             |
| 8   | 🔬 Deep Analysis — Complete Comparison                     |

---

## §1. Arrays — "O(1) Everything, But No Insert!"

> Prime: _"Something really nice about an array is you get O(1) accessing. You're able to just set any value. The understanding of what's happening underneath the hood is pretty straightforward."_

### Pros!

- Get by index → O(1)!
- Write/overwrite → O(1)!
- Contiguous memory → cache-friendly!

### Cons!

- No literal insert (must shift manually)!
- No literal delete (must shift manually)!
- Fixed size (must allocate upfront)!

---

## §2. Linked Lists — "O(1) Insert/Delete, But No Random Access!"

> Prime: _"If you wanted to get an item out of the list, you have to traverse each item. It's ALWAYS a linear search. There is no such thing as a binary search on a linked list."_

### Pros!

- Insert/delete at node → O(1)!
- Push/pop from head/tail → O(1)!
- Grows dynamically, uses only what it needs!

### Cons!

- Get by index → O(N)! Must traverse!
- No binary search possible!
- No random access!

---

## §3. Memory — "Upfront vs On-Demand!"

> Prime: _"With an array, if you want to store 1000 items, you allocate ALL that memory upfront. Maybe you'll use all thousand, maybe only a few."_

_"A linked list has NOTHING to begin with. Insert one thing — one node. Insert two — two nodes. Memory usage is more optimized."_

```
MEMORY:
═══════════════════════════════════════════════════════════════

  Array (capacity 1000):
  [used][used][used][ ][ ][ ]...[ ][ ][ ]
   ↑ 3 used                   ↑ 997 wasted!

  Linked List (3 items):
  (A) → (B) → (C) → null
   ↑ 3 nodes, 3 items, no waste!

  BUT: array memory already retrieved = fast access!
       linked list = heap allocation each time = slower!
```

---

## §4. No Binary Search on Linked List!

> Prime: _"There is NO SUCH THING as a binary search on a linked list. You can't hop into the middle — you have to walk the whole thing. Linear search is your ONLY option."_

---

## §5. Async Request Queue — "Netflix Interview Question!"

> Prime: _"At Netflix I used to ask: implement an async request queue where only 3 requests can be out at any one time."_

_"When they use an array, I'd say — if you have a MILLION items, do you still use brackets? They say yeah. They haven't thought about the fact that when you remove or add to the front, you have to shift EVERYTHING."_

_"I want to hear these words out of their mouth — you UNDERSTAND what you are and aren't doing."_

---

## §6. "It Depends!" — "Always Say It Depends!"

> Student: _"Which one is better?"_
> Prime: _"It's always IT DEPENDS. Whenever someone asks that in an interview, say it depends."_

### Trade-off summary!

- Push/pop from end → **both work!**
- Random access → **ArrayList wins!**
- Remove from front → **Linked List wins!**
- Scan/search → **ArrayList wins!** (cache-friendly)

---

## §7. How to Traverse a Linked List?

> Student: _"How would you traverse a linked list?"_

```typescript
get(index: number): T | undefined {
  let curr = this.head;
  for (let i = 0; i < index && curr; i++) {
    curr = curr.next;
  }
  return curr?.value;
}
```

Prime: _"We literally walk forward one at a time. That's why it's a LINEAR operation."_

---

## §8. 🔬 Deep Analysis — Complete Comparison

```
ARRAY vs LINKED LIST:
═══════════════════════════════════════════════════════════════

  Operation       | Array       | Linked List
  ────────────────|─────────────|──────────────
  Get by index    | O(1) ✅     | O(N) ❌
  Write at index  | O(1) ✅     | O(N) ❌
  Insert at front | O(N) ❌     | O(1) ✅
  Insert at end   | N/A*        | O(1) ✅
  Delete at front | O(N) ❌     | O(1) ✅
  Delete at end   | N/A*        | O(1) ✅
  Binary search   | O(log N) ✅ | N/A ❌
  Memory          | upfront     | on-demand
  Cache           | friendly ✅ | unfriendly ❌

  * arrays can't grow!

  WHEN TO USE:
  ┌──────────────────────────────────────────────────────────┐
  │ Array: random access, scanning, binary search!         │
  │ Linked List: push/pop from ends, queue/stack!          │
  │ "Understand what you DO and AREN'T doing." — Prime     │
  └──────────────────────────────────────────────────────────┘
```

---

## Checklist

```
[ ] Array: O(1) get/write, no insert/delete, upfront memory!
[ ] Linked list: O(1) insert/delete at node, O(N) get!
[ ] No binary search on linked list — must walk!
[ ] Memory: array upfront waste vs LL on-demand!
[ ] Netflix interview: async queue with brackets = bad!
[ ] "It depends" — always the right answer!
TIẾP THEO → Phần 21: ArrayList!
```
