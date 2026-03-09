# The Last Algorithms Course You'll Need — Phần 18: Stack — "LIFO, Backwards Arrows, Push/Pop From Head, Stack Trace!"

> 📅 2026-03-09 · ⏱ 20 phút đọc
>
> Nguồn: Frontend Masters — ThePrimeagen
> Bài: Stack — "LIFO, singly linked list, push/pop from head only, stack of plates, stack trace, Uber interview log N story!"
> Độ khó: ⭐️⭐️⭐️ | Data Structure — stack concept, backwards arrows, O(1) all operations!

---

## Mục Lục

| #   | Phần                                                              |
| --- | ----------------------------------------------------------------- |
| 1   | Stack = LIFO — "Stack of Plates!"                                 |
| 2   | "Draw Backwards!" — "Arrows Point to Previous!"                   |
| 3   | Push — "Point New to Head, Update Head!"                          |
| 4   | Pop — "Save Head, Update to Previous, Return!"                    |
| 5   | Peek — "Same as Queue!"                                           |
| 6   | Stack Trace = Stack! — "Functions on a Stack!"                    |
| 7   | Uber Interview — "Property Access is log N? Everything is log N!" |
| 8   | Tự Implement: Stack Concept                                       |
| 9   | 🔬 Deep Analysis — Queue vs Stack                                 |

---

## §1. Stack = LIFO — "Stack of Plates!"

> Prime: _"Stack — the opposite of a queue. You can think about this like a STACK OF PLATES."_

### LIFO = Last In, First Out!

```
STACK = LIFO:
═══════════════════════════════════════════════════════════════

  Stack of plates:
  ┌───────┐
  │   D   │  ← last in, FIRST OUT! (top)
  ├───────┤
  │   C   │
  ├───────┤
  │   B   │
  ├───────┤
  │   A   │  ← first in, LAST OUT! (bottom)
  └───────┘

  Push D → D is on top!
  Pop → D comes off! (last in, first out!)
```

---

## §2. "Draw Backwards!" — "Arrows Point to Previous!"

> Prime: _"I always draw it backwards because it's SO MUCH EASIER. You don't have to draw it backwards — for me it's a lot easier."_

### Why backwards?

```
BACKWARDS ARROWS:
═══════════════════════════════════════════════════════════════

  head
   ↓
  (D) → (C) → (B) → (A) → null

  Arrows point to PREVIOUS (what's below in the stack!)
  Head = top of the stack!

  Push: add in FRONT of head!
  Pop: remove head!

  "A stack is a singly linked list in which you only
   add and remove from the HEAD." — Prime
```

---

## §3. Push — "Point New to Head, Update Head!"

> Prime: _"We take E and point to head. Then update head to point to E. Two-step operation."_

### Push = prepend!

```
PUSH:
═══════════════════════════════════════════════════════════════

  Before:
  head → (D) → (C) → (B) → (A)

  Push E:
  Step 1: E.prev = head     → E points to D!
  Step 2: head = E          → head now points to E!

  After:
  head → (E) → (D) → (C) → (B) → (A)

  "Do these operations BACKWARDS, you lose all your data.
   You'll never find it again." — Prime ⚠️
```

---

## §4. Pop — "Save Head, Update to Previous, Return!"

> Prime: _"Save off this. Update head to point to next/previous. Return E. Break it off from the graph — just the opposite, inverse."_

### Pop = remove head!

```
POP:
═══════════════════════════════════════════════════════════════

  Before:
  head → (E) → (D) → (C) → (B) → (A)

  Pop:
  Step 1: saved = head          → save E!
  Step 2: head = head.prev      → head now points to D!
  Step 3: saved.prev = null     → disconnect E!
  Step 4: return saved.value    → return E's value!

  After:
  head → (D) → (C) → (B) → (A)
  (E) disconnected → garbage collected!
```

---

## §5. Peek — "Same as Queue!"

> Prime: _"Take the head. If there is a value, return it. Otherwise don't return anything."_

```typescript
peek(): T | undefined {
  return this.head?.value;
}
```

---

## §6. Stack Trace = Stack! — "Functions on a Stack!"

> Prime: _"If you have an error in your code, you get a STACK TRACE. You wanna guess what a stack trace is? It's the stack of functions that you've called up until this point."_

_"When you call a function, it IS actually on something like a stack. The memory it uses is CALLED the stack for a reason — it only goes up and down."_

```
STACK TRACE:
═══════════════════════════════════════════════════════════════

  main() calls foo()
  foo() calls bar()
  bar() throws Error!

  Stack trace:
  ┌─────────────────┐
  │ bar()  ← ERROR  │  ← top (last called)
  ├─────────────────┤
  │ foo()           │
  ├─────────────────┤
  │ main()          │  ← bottom (first called)
  └─────────────────┘

  Unwind: bar pops, foo pops, main pops!
```

---

## §7. Uber Interview — "Property Access is log N?"

> Prime: _"I had an interview at Uber. The person made me add log N to EVERYTHING because 'accessing properties in JavaScript is log N.' It was the longest, most drawn-out interview."_

_"Typically, we just don't do that."_ 😤

---

## §8. Tự Implement: Stack Concept

```javascript
// ═══ Stack — LIFO ═══

class Stack {
  #head = null;
  length = 0;

  push(item) {
    const node = { value: item, prev: null };
    this.length++;

    if (!this.#head) {
      this.#head = node;
      return;
    }

    node.prev = this.#head; // new points to old head!
    this.#head = node; // head = new!
  }

  pop() {
    if (!this.#head) return undefined;

    this.length = Math.max(0, this.length - 1);
    const h = this.#head;
    this.#head = this.#head.prev;

    h.prev = null; // disconnect!
    return h.value;
  }

  peek() {
    return this.#head?.value;
  }
}

// Demo
console.log("═══ STACK (LIFO) ═══\n");

const s = new Stack();
["A", "B", "C", "D"].forEach((item) => {
  s.push(item);
  console.log(`Push "${item}" → peek: "${s.peek()}", length: ${s.length}`);
});

console.log("\nPop order (LIFO!):");
while (s.length > 0) {
  console.log(`  Pop: "${s.pop()}" → length: ${s.length}`);
}
// D, C, B, A — reverse order!

console.log("\n═══ QUEUE vs STACK ═══");
console.log("Queue (FIFO): A,B,C,D → deque → A,B,C,D");
console.log("Stack (LIFO): A,B,C,D → pop   → D,C,B,A");
```

---

## §9. 🔬 Deep Analysis — Queue vs Stack

```
QUEUE vs STACK:
═══════════════════════════════════════════════════════════════

  QUEUE (FIFO):               STACK (LIFO):
  ─────────────               ─────────────
  Enqueue → tail              Push → head
  Deque ← head                Pop ← head
  "Back of the line!"         "Top of the pile!"
  Uses: BFS, scheduling       Uses: DFS, recursion, undo

  Both:
  - Singly linked list!
  - All operations O(1)!
  - Constrained for performance!

  ACCESS PATTERN:
  Queue: head ← ... ← tail    Stack: head → ... → null
         (deque)    (enqueue)         (push/pop)

  "A stack is almost SO MUCH like a queue, it's
   very easy to get them confused." — Prime
```

---

## Checklist

```
[ ] Stack = LIFO = last in, first out!
[ ] Singly linked, head only (no tail needed)!
[ ] Draw backwards: arrows point to previous!
[ ] Push: new.prev = head, head = new! O(1)!
[ ] Pop: save head, head = head.prev, return! O(1)!
[ ] Peek: head?.value! O(1)!
[ ] Stack trace = stack of function calls!
[ ] "The memory is CALLED the stack for a reason!"
[ ] Simpler than queue — only focus on head!
TIẾP THEO → Phần 19: Implementing a Stack!
```
