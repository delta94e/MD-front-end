# The Last Algorithms Course You'll Need — Phần 17: Queue Q&A — "No Tail on Deque, Peek Clarified, Tail.next Explained!"

> 📅 2026-03-09 · ⏱ 10 phút đọc
>
> Nguồn: Frontend Masters — ThePrimeagen
> Bài: Queue Q&A — "TypeScript gotchas, tail cleanup on deque, peek explained, tail.next = node explained!"
> Độ khó: ⭐️⭐️ | Q&A — implementation details and edge cases!

---

## Mục Lục

| #   | Phần                                                             |
| --- | ---------------------------------------------------------------- |
| 1   | Q: "No Tail, No Node at All?" — "Correct!"                       |
| 2   | Q: "Tail Cleanup on Deque?" — "length === 0 → tail = undefined!" |
| 3   | Q: "Clarify Peek?" — "Head Value Without Mutating!"              |
| 4   | Q: "Why tail.next = node?" — "Then Update Tail!"                 |

---

## §1. Q: "No Tail, No Node at All?" — "Correct!"

> Student: _"When there's no tail, is there one node or no node at all?"_
> Prime: _"There's NO node at all."_

### Empty queue = no tail and no head!

Prime would prefer `this.length === 0` but TypeScript can't narrow types from that, so we check `!this.tail` directly.

---

## §2. Q: "Tail Cleanup on Deque?" — "length === 0 → tail = undefined!"

> Prime: _"What about the tail? What happens when we remove? If this.length === 0, then this.tail should equal undefined. We need to make sure we forget about it at all points."_

### Implementation detail!

```typescript
deque(): T | undefined {
  if (!this.head) return undefined;
  this.length--;

  const head = this.head;
  this.head = this.head.next;

  // Don't forget to clean tail!
  if (this.length === 0) {
    this.tail = undefined;   // ← important!
  }

  head.next = undefined;
  return head.value;
}
```

---

## §3. Q: "Clarify Peek?" — "Head Value Without Mutating!"

> Student: _"Could you clarify the peek method?"_
> Prime: _"We want to see the next value returned WITHOUT MUTATING the state of the queue."_

_"The instantiator of the queue does NOT care about how the queue is bookkeept. It only cares about values it puts in and gets out."_

```typescript
peek(): T | undefined {
  return this.head?.value;
  // If head exists → return value!
  // If head undefined → return undefined!
  // NO mutation! Queue state unchanged!
}
```

---

## §4. Q: "Why tail.next = node?" — "Then Update Tail!"

> Student: _"Why are we setting this.tail.next to the new node?"_

### Two-step operation!

Prime draws it out again:

```
ENQUEUE — TWO STEPS:
═══════════════════════════════════════════════════════════════

  Before:
  head → (A) → (B) → (C) → (D) ← tail

  Step 1: this.tail.next = node
  → D now points to F!
  head → (A) → (B) → (C) → (D) → (F)
                                ← tail (still at D!)

  Step 2: this.tail = node
  → tail updated!
  head → (A) → (B) → (C) → (D) → (F) ← tail ✅

  "Tail should ALWAYS represent the end of the queue." — Prime
```

Prime then teases: _"What's the OPPOSITE of a queue? Stack. Obvious."_

---

## Checklist

```
[ ] Empty queue: no tail AND no head!
[ ] Deque must clean tail when length === 0!
[ ] Peek: read head without mutating state!
[ ] Enqueue: tail.next = node, THEN tail = node!
[ ] TypeScript: can't narrow from length check, use !this.tail!
TIẾP THEO → Phần 18: Stack!
```
