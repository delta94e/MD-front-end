# The Last Algorithms Course You'll Need — Phần 15: Queue — "FIFO, Brits Call It a Line, Enqueue Tail, Deque Head, O(1)!"

> 📅 2026-03-08 · ⏱ 25 phút đọc
>
> Nguồn: Frontend Masters — ThePrimeagen
> Bài: Queue — "FIFO structure, singly linked list, enqueue at tail, deque from head, peek, constrain for performance!"
> Độ khó: ⭐️⭐️⭐️ | Data Structure — queue on top of singly linked list, all ops O(1)!

---

## Mục Lục

| #   | Phần                                                   |
| --- | ------------------------------------------------------ |
| 1   | Queue = FIFO — "What the Brits Call a Line!"           |
| 2   | Singly Linked List — "Don't Even Need Doubly!"         |
| 3   | Enqueue (Push) — "Get in the Back of the Line!"        |
| 4   | Deque (Pop) — "Pop From the Head!"                     |
| 5   | ⚠️ Operation Ordering — "Don't Lose Your Values!"      |
| 6   | Peek — "Just Head.value!"                              |
| 7   | Constraining = Performance — "Reduce What You Can Do!" |
| 8   | Tự Implement: Queue Concept                            |
| 9   | 🔬 Deep Analysis — Queue Operations                    |

---

## §1. Queue = FIFO — "What the Brits Call a Line!"

> Prime: _"A queue is simply a FIFO structure — first in, first out. This is what the Brits call a LINE."_

### Real-world queue!

Prime: _"I had to shove video down into a decoder. The only way to buffer and make sure you insert in the correct order is FIFO. I was using it in C too — I felt a little smarter than everybody else."_

```
QUEUE = FIFO:
═══════════════════════════════════════════════════════════════

  Carnival line:
  [Person1] → [Person2] → [Person3] → [Person4]
   ↑ first in                          ↑ last in
   ↑ first OUT                         joins here

  Queue:
  head → (A) → (B) → (C) → (D) ← tail
          ↑                       ↑
       deque here            enqueue here
       (first out!)          (last in!)
```

---

## §2. Singly Linked List — "Don't Even Need Doubly!"

> Prime: _"Notice I'm using a SINGLY linked list. We don't even need a doubly linked list. We don't need that extra computation time or property storage."_

### Minimal structure!

- Enqueue at tail → only need `tail.next = newNode`!
- Deque from head → only need `head = head.next`!
- No need to walk backwards → **singly linked is enough!**

---

## §3. Enqueue (Push) — "Get in the Back of the Line!"

> Prime: _"If we wish to insert into a line, what do you do at a carnival? You get in the BACK of the line."_

### Add to tail!

```
ENQUEUE:
═══════════════════════════════════════════════════════════════

  Before:
  head → (A) → (B) → (C) → (D) ← tail

  Enqueue E:
  Step 1: this.tail.next = E     → D now points to E!
  Step 2: this.tail = E          → tail now points to E!

  After:
  head → (A) → (B) → (C) → (D) → (E) ← tail

  Two operations, both constant → O(1)! 🎯
```

---

## §4. Deque (Pop) — "Pop From the Head!"

> Prime: _"A popping operation — we don't pop from the tail. We pop from the HEAD."_

### Remove from head!

```
DEQUE:
═══════════════════════════════════════════════════════════════

  Before:
  head → (A) → (B) → (C) → (D) ← tail

  Deque:
  Step 1: const h = this.head    → save reference to A!
  Step 2: this.head = head.next  → head now points to B!
  Step 3: h.next = null          → clean up A!
  Step 4: return h.value         → return A's value!

  After:
  head → (B) → (C) → (D) ← tail
  (A) is disconnected → garbage collected!

  → O(1)! 🎯
```

---

## §5. ⚠️ Operation Ordering — "Don't Lose Your Values!"

> Prime: _"If I did it the other way around, we'd LOSE the value. Your whole queue would suck. Don't do that."_

### Save before overwriting!

```javascript
// ❌ WRONG ORDER:
this.head = this.head.next;  // lost reference to old head!
return ???.value;             // can't access it anymore! 💀

// ✅ CORRECT ORDER:
const h = this.head;          // save reference first!
this.head = this.head.next;   // then update!
h.next = null;                // clean up!
return h.value;               // return saved value!
```

---

## §6. Peek — "Just Head.value!"

> Prime: _"Peek — the ability to see what is my first element without popping it. That would just be head.value."_

### Simplest operation!

```javascript
peek(): T | undefined {
  return this.head?.value;
}
```

---

## §7. Constraining = Performance — "Reduce What You Can Do!"

> Prime: _"We have REDUCED what we can do and we've made sure that it's very fast. It performs a specific algorithm — FIFO."_

_"It IS technically a generalized linked list underneath. But you can only use it in a certain way."_

```
CONSTRAIN = PERFORMANCE:
═══════════════════════════════════════════════════════════════

  Linked List (general):
  ┌──────────────────────────────────────────────────────────┐
  │ Can insert anywhere!                                   │
  │ Can delete anywhere!                                   │
  │ Can traverse anywhere!                                 │
  │ → Flexible but complex!                                │
  └──────────────────────────────────────────────────────────┘

  Queue (constrained):
  ┌──────────────────────────────────────────────────────────┐
  │ Can ONLY enqueue at tail!                              │
  │ Can ONLY deque from head!                              │
  │ Can ONLY peek at head!                                 │
  │ → Simple AND fast! All O(1)! 🎯                       │
  └──────────────────────────────────────────────────────────┘
```

---

## §8. Tự Implement: Queue Concept

```javascript
// ═══ Queue — Singly Linked List ═══

class QueueNode {
  constructor(value) {
    this.value = value;
    this.next = null;
  }
}

class Queue {
  constructor() {
    this.head = null;
    this.tail = null;
    this.length = 0;
  }

  // Enqueue: add to tail — O(1)!
  enqueue(item) {
    const node = new QueueNode(item);
    this.length++;

    if (!this.tail) {
      this.head = this.tail = node;
      return;
    }

    this.tail.next = node; // old tail → new node!
    this.tail = node; // update tail pointer!
  }

  // Deque: remove from head — O(1)!
  deque() {
    if (!this.head) return undefined;

    this.length--;
    const h = this.head; // save reference!
    this.head = this.head.next; // update head!

    if (!this.head) this.tail = null; // empty!

    h.next = null; // clean up!
    return h.value;
  }

  // Peek: look at head — O(1)!
  peek() {
    return this.head?.value;
  }
}

// Demo
console.log("═══ QUEUE (FIFO) ═══\n");

const q = new Queue();
q.enqueue("A");
q.enqueue("B");
q.enqueue("C");
q.enqueue("D");
console.log("Enqueued: A, B, C, D");
console.log("Length:", q.length); // 4
console.log("Peek:", q.peek()); // A (first in!)

console.log("\nDeque order (FIFO!):");
while (q.length > 0) {
  console.log("  →", q.deque()); // A, B, C, D
}
console.log("Empty! Length:", q.length); // 0
console.log("Deque empty:", q.deque()); // undefined
```

---

## §9. 🔬 Deep Analysis — Queue Operations

```
QUEUE OPERATIONS:
═══════════════════════════════════════════════════════════════

  enqueue(item): add to tail  → O(1)!
  deque():   remove from head → O(1)!
  peek():    look at head     → O(1)!

  ALL operations are O(1)! 🎯

  Uses: singly linked list (no need for doubly!)
  Maintains: head + tail pointers!

  Real-world uses:
  - Video decoder buffer (Prime's example!)
  - Task scheduling!
  - BFS (breadth-first search!)
  - Print queue!
  - Message queues!

  "We CONSTRAIN what you can do, and in return
   you get very good performance." — Prime
```

---

## Checklist

```
[ ] Queue = FIFO = "what Brits call a line!"
[ ] Singly linked list underneath — no doubly needed!
[ ] Enqueue: add at tail = O(1)!
[ ] Deque: remove from head = O(1)!
[ ] Peek: look at head without removing = O(1)!
[ ] ⚠️ Save reference before updating pointers!
[ ] Constraining reduces flexibility but gains speed!
[ ] Real-world: video decoder, task scheduling, BFS!
TIẾP THEO → Phần 16: Implementing a Queue!
```
