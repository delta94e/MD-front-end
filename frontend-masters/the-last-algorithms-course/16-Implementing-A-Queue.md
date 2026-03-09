# The Last Algorithms Course You'll Need — Phần 16: Implementing a Queue — "TypeScript Generics, Constructor, Enqueue, Deque, Peek!"

> 📅 2026-03-08 · ⏱ 20 phút đọc
>
> Nguồn: Frontend Masters — ThePrimeagen
> Bài: Implementing a Queue — "QueueNode type, head/tail undefined, enqueue base case, deque save-first, peek optional chaining!"
> Độ khó: ⭐️⭐️⭐️ | Implementation — full TypeScript queue with generics!

---

## Mục Lục

| #   | Phần                                 |
| --- | ------------------------------------ |
| 1   | Type Definition — "QueueNode<T>!"    |
| 2   | Constructor — "Head, Tail, Length!"  |
| 3   | Peek — "Optional Chaining!"          |
| 4   | Deque — "Save, Update, Return!"      |
| 5   | Enqueue — "Base Case + Tail Update!" |
| 6   | Complete Code — "Not Too Hard!"      |
| 7   | Tự Implement: Full Queue             |

---

## §1. Type Definition — "QueueNode<T>!"

> Prime: _"We have a QueueNode generic over T. It has a value of type T and a next that may or may not exist."_

```typescript
type QueueNode<T> = {
  value: T;
  next?: QueueNode<T>; // optional — can be undefined!
};
```

Prime: _"If next ALWAYS existed, you'd create one of them and infinitely create memory forever — eventually blow up your system."_

---

## §2. Constructor — "Head, Tail, Length!"

> Prime: _"this.head = this.tail = undefined. Length = 0. We've pretty much done the hardest part about a queue."_ 😂

```typescript
class Queue<T> {
  public length: number;
  private head?: QueueNode<T>;
  private tail?: QueueNode<T>;

  constructor() {
    this.head = this.tail = undefined;
    this.length = 0;
  }
}
```

---

## §3. Peek — "Optional Chaining!"

> Prime: _"All we have to return is this.head?.value — that's a null coalescing operator. If head is not undefined, get value; otherwise return undefined."_

```typescript
peek(): T | undefined {
  return this.head?.value;
}
```

---

## §4. Deque — "Save, Update, Return!"

> Prime: _"First — do we even have a head? If not, return undefined."_

### Step by step!

```typescript
deque(): T | undefined {
  if (!this.head) return undefined;

  this.length--;

  const head = this.head;          // save reference!
  this.head = this.head.next;      // update head pointer!

  // Bookkeeping (cleanup)
  head.next = undefined;           // clean up old head!

  return head.value;               // return the value!
}
```

Prime: _"If using a traditional language without GC, you'd wanna do a FREE here. We just don't do that in JavaScript."_

---

## §5. Enqueue — "Base Case + Tail Update!"

> Prime: _"If there is no tail, we have an empty queue."_

### Base case: empty queue!

```typescript
enqueue(item: T): void {
  const node = { value: item } as QueueNode<T>;
  this.length++;

  if (!this.tail) {
    // Empty queue! Both head and tail point to new node!
    this.tail = this.head = node;
    return;
  }

  // Normal case: add to tail!
  this.tail.next = node;   // old tail → new node!
  this.tail = node;        // update tail pointer!
}
```

Prime: _"We took our tail and added a new one to the list. Then we point tail to the new node."_

---

## §6. Complete Code — "Not Too Hard!"

> Prime: _"Queues are fairly simple data structures. You're only managing ONE link. Just make sure you're updating or deleting that one link properly."_

```typescript
type QueueNode<T> = {
  value: T;
  next?: QueueNode<T>;
};

class Queue<T> {
  public length: number;
  private head?: QueueNode<T>;
  private tail?: QueueNode<T>;

  constructor() {
    this.head = this.tail = undefined;
    this.length = 0;
  }

  enqueue(item: T): void {
    const node = { value: item } as QueueNode<T>;
    this.length++;
    if (!this.tail) {
      this.tail = this.head = node;
      return;
    }
    this.tail.next = node;
    this.tail = node;
  }

  deque(): T | undefined {
    if (!this.head) return undefined;
    this.length--;
    const head = this.head;
    this.head = this.head.next;
    head.next = undefined;
    return head.value;
  }

  peek(): T | undefined {
    return this.head?.value;
  }
}
```

---

## §7. Tự Implement: Full Queue

```javascript
// ═══ Queue — Full Implementation ═══

class Queue {
  #head = null;
  #tail = null;
  length = 0;

  enqueue(item) {
    const node = { value: item, next: null };
    this.length++;

    if (!this.#tail) {
      this.#head = this.#tail = node;
      return;
    }

    this.#tail.next = node;
    this.#tail = node;
  }

  deque() {
    if (!this.#head) return undefined;

    this.length--;
    const h = this.#head;
    this.#head = this.#head.next;

    if (!this.#head) this.#tail = null;

    h.next = null;
    return h.value;
  }

  peek() {
    return this.#head?.value;
  }
}

// Tests
console.log("═══ QUEUE IMPLEMENTATION ═══\n");

const q = new Queue();

// Enqueue
["Alpha", "Bravo", "Charlie", "Delta", "Echo"].forEach((item) => {
  q.enqueue(item);
  console.log(`Enqueue "${item}" → length: ${q.length}, peek: "${q.peek()}"`);
});

// Deque
console.log("\nDeque (FIFO order!):");
while (q.length > 0) {
  console.log(`  Deque: "${q.deque()}" → length: ${q.length}`);
}

// Edge cases
console.log("\nEdge cases:");
console.log("Deque empty:", q.deque()); // undefined
console.log("Peek empty:", q.peek()); // undefined

// Re-enqueue after empty
q.enqueue("New");
console.log("After re-enqueue:", q.peek()); // "New"

console.log("\n✅ All operations O(1)!");
console.log("✅ Singly linked — minimal memory!");
console.log("✅ FIFO guaranteed!");
```

---

## Checklist

```
[ ] QueueNode<T>: { value: T, next?: QueueNode<T> }!
[ ] Constructor: head = tail = undefined, length = 0!
[ ] Peek: this.head?.value — optional chaining!
[ ] Deque: save head, update head, clean up, return value!
[ ] Enqueue base case: empty → head = tail = new node!
[ ] Enqueue normal: tail.next = node, tail = node!
[ ] length++ on enqueue, length-- on deque!
[ ] Clean up: head.next = undefined (GC-friendly)!
[ ] "We are now the array — we do the bookkeeping!" — Prime
TIẾP THEO → Phần 17: Stack!
```
