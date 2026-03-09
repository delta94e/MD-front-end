# The Last Algorithms Course You'll Need — Phần 30: Linked List — Prepend, InsertAt, Append — "Attach First, Break Links Second!"

> 📅 2026-03-09 · ⏱ 25 phút đọc
>
> Nguồn: Frontend Masters — ThePrimeagen
> Bài: Doubly Linked List — prepend, insertAt, append — "Create node, attach to position, break old links, bookkeeping!"
> Độ khó: ⭐️⭐️⭐️⭐️ | Implementation — doubly linked list write operations, head/tail management, edge cases!

---

## Mục Lục

| #   | Phần                                                |
| --- | --------------------------------------------------- |
| 1   | Setup — "Constructor, Head, Tail, Length!"          |
| 2   | Prepend — "G → A, A → G, head = G!"                 |
| 3   | Append — "node → tail, tail → node, tail = node!"   |
| 4   | InsertAt — "Walk, Attach New, Break Old!"           |
| 5   | Golden Rule — "Attach First, Break Links Second!"   |
| 6   | Edge Cases — "Empty List, Index 0, Index = Length!" |
| 7   | Bookkeeping — "Always The Worst!" 😂                |
| 8   | Tự Implement: Prepend, InsertAt, Append             |

---

## §1. Setup — "Constructor, Head, Tail, Length!"

> Prime: _"I like to explicitly set things in the constructor."_

```typescript
type Node<T> = {
  value: T;
  prev?: Node<T>;
  next?: Node<T>;
};

class DoublyLinkedList<T> {
  public length: number;
  private head?: Node<T>;
  private tail?: Node<T>;

  constructor() {
    this.length = 0;
    this.head = undefined;
    this.tail = undefined;
  }
}
```

---

## §2. Prepend — "G → A, A → G, head = G!"

> Prime: _"G points to A first. Then A points to G. Then head points to G. We don't want to lose A in memory."_

```
PREPEND:
═══════════════════════════════════════════════════════════════

  Before:
  head → (A) ⇄ (B) ⇄ (C) ⇄ (D) ← tail

  Prepend G:
  Step 1: G.next = head (A)     → G points to A!
  Step 2: A.prev = G            → A points back to G!
  Step 3: head = G              → head updated!

  After:
  head → (G) ⇄ (A) ⇄ (B) ⇄ (C) ⇄ (D) ← tail
```

### Code!

```typescript
prepend(item: T): void {
  const node = { value: item } as Node<T>;
  this.length++;

  if (!this.head) {
    this.head = this.tail = node;
    return;
  }

  node.next = this.head;      // G → A!
  this.head.prev = node;      // A → G!
  this.head = node;           // head = G!
}
```

---

## §3. Append — "node → tail, tail → node, tail = node!"

> Prime: _"Attach to D, D attaches to Z, tail updates to Z."_

```
APPEND:
═══════════════════════════════════════════════════════════════

  Before:
  head → (A) ⇄ (B) ⇄ (C) ⇄ (D) ← tail

  Append Z:
  Step 1: Z.prev = tail (D)     → Z points back to D!
  Step 2: D.next = Z            → D points to Z!
  Step 3: tail = Z              → tail updated!

  After:
  head → (A) ⇄ (B) ⇄ (C) ⇄ (D) ⇄ (Z) ← tail
```

### Code!

```typescript
append(item: T): void {
  const node = { value: item } as Node<T>;
  this.length++;

  if (!this.tail) {
    this.head = this.tail = node;
    return;
  }

  node.prev = this.tail;       // Z → D!
  this.tail.next = node;       // D → Z!
  this.tail = node;            // tail = Z!
}
```

---

## §4. InsertAt — "Walk, Attach New, Break Old!"

> Prime: _"First, attach the new node. Second, break the old links. Do it in that order, you won't goof anything up."_

```
INSERT AT (insert F before C):
═══════════════════════════════════════════════════════════════

  Before:
  ... ⇄ (B) ⇄ (C) ⇄ (D) ⇄ ...

  Insert F before index of C:
  Step 1: F.next = C           → F points forward to C!
  Step 2: F.prev = B           → F points back to B!
  Step 3: C.prev = F           → C now points back to F!
  Step 4: B.next = F           → B now points forward to F!

  After:
  ... ⇄ (B) ⇄ (F) ⇄ (C) ⇄ (D) ⇄ ...

  "Attach the new node, THEN break the old links!" — Prime
```

### Edge cases before walking!

```typescript
insertAt(item: T, idx: number): void {
  if (idx > this.length) {
    throw new Error("out of bounds!");
  }

  if (idx === this.length) {
    this.append(item);     // inserting at the end = append!
    return;
  }

  if (idx === 0) {
    this.prepend(item);    // inserting at start = prepend!
    return;
  }

  // Walk to the target index!
  let curr = this.head;
  for (let i = 0; i < idx && curr; i++) {
    curr = curr.next;
  }

  curr = curr as Node<T>;
  const node = { value: item } as Node<T>;

  // Attach the new node!
  node.next = curr;              // F → C!
  node.prev = curr.prev;         // F → B!

  // Break old links!
  curr.prev = node;              // C ← F!
  if (node.prev) {
    node.prev.next = node;       // B → F!
  }

  this.length++;
}
```

> Prime: _"curr.prev.next needs to point to F instead. Current's previous, next — you just have to run that triangle for a second."_

---

## §5. Golden Rule — "Attach First, Break Links Second!"

```
GOLDEN RULE:
═══════════════════════════════════════════════════════════════

  ✅ CORRECT ORDER:
  1. Create new node!
  2. Set new node's pointers (next, prev)!
  3. Update old nodes' pointers!

  ❌ WRONG ORDER:
  1. Break old links first → LOSE REFERENCES!
  2. Try to set new node → can't find neighbors!

  "Do these operations BACKWARDS, you lose all your data.
   You'll never find it again." — Prime
```

---

## §6. Edge Cases — "Empty List, Index 0, Index = Length!"

| Edge Case                 | Handle With          |
| ------------------------- | -------------------- |
| Empty list (no head/tail) | `head = tail = node` |
| Index 0                   | Call `prepend()`     |
| Index = length            | Call `append()`      |
| Index > length            | Throw error!         |

> Prime: _"This is where a circular linked list would avoid this kind of conditioning. But we won't worry about that."_

---

## §7. Bookkeeping — "Always The Worst!" 😂

> Prime: _"See, I just forgot bookkeeping! It's so easy to forget. Bookkeeping — always just the worst, never liked it."_

**Always remember:**

- `this.length++` on every insert!
- Update `this.head` when prepending!
- Update `this.tail` when appending!
- Set BOTH `head` and `tail` when first item added!

---

## §8. Tự Implement: Prepend, InsertAt, Append

```javascript
// ═══ Doubly Linked List — Write Operations ═══

class DoublyLinkedList {
  #head = null;
  #tail = null;
  length = 0;

  // Prepend: add to front! O(1)!
  prepend(item) {
    const node = { value: item, prev: null, next: null };
    this.length++;

    if (!this.#head) {
      this.#head = this.#tail = node;
      return;
    }

    node.next = this.#head;
    this.#head.prev = node;
    this.#head = node;
  }

  // Append: add to end! O(1)!
  append(item) {
    const node = { value: item, prev: null, next: null };
    this.length++;

    if (!this.#tail) {
      this.#head = this.#tail = node;
      return;
    }

    node.prev = this.#tail;
    this.#tail.next = node;
    this.#tail = node;
  }

  // InsertAt: add at index! O(N)!
  insertAt(item, idx) {
    if (idx > this.length) throw new Error("Out of bounds!");
    if (idx === this.length) {
      this.append(item);
      return;
    }
    if (idx === 0) {
      this.prepend(item);
      return;
    }

    // Walk to target
    let curr = this.#head;
    for (let i = 0; i < idx && curr; i++) {
      curr = curr.next;
    }

    const node = { value: item, prev: null, next: null };

    // Attach new node!
    node.next = curr;
    node.prev = curr.prev;

    // Break old links!
    curr.prev = node;
    if (node.prev) node.prev.next = node;

    this.length++;
  }

  // Helper: print list
  print() {
    const items = [];
    let curr = this.#head;
    while (curr) {
      items.push(curr.value);
      curr = curr.next;
    }
    return items.join(" ⇄ ");
  }
}

// Demo!
console.log("═══ DOUBLY LINKED LIST — WRITE OPS ═══\n");

const list = new DoublyLinkedList();

// Append
list.append("A");
list.append("B");
list.append("C");
console.log("Append A,B,C:", list.print()); // A ⇄ B ⇄ C

// Prepend
list.prepend("Z");
console.log("Prepend Z:   ", list.print()); // Z ⇄ A ⇄ B ⇄ C

// InsertAt
list.insertAt("F", 2);
console.log("InsertAt(F,2):", list.print()); // Z ⇄ A ⇄ F ⇄ B ⇄ C

list.insertAt("G", 0);
console.log("InsertAt(G,0):", list.print()); // G ⇄ Z ⇄ A ⇄ F ⇄ B ⇄ C

list.insertAt("X", list.length);
console.log("InsertAt end: ", list.print()); // G ⇄ Z ⇄ A ⇄ F ⇄ B ⇄ C ⇄ X

console.log("Length:", list.length); // 7

console.log("\n═══ COMPLEXITY ═══");
console.log("Prepend: O(1) ✅");
console.log("Append:  O(1) ✅");
console.log("InsertAt: O(N) — must walk to index!");
console.log("\n✅ Golden Rule: attach first, break links second!");
```

---

## Checklist

```
[ ] Constructor: head, tail, length — all start undefined/0!
[ ] Prepend: new.next = head, head.prev = new, head = new! O(1)!
[ ] Append: new.prev = tail, tail.next = new, tail = new! O(1)!
[ ] InsertAt: walk to idx, attach new, break old links! O(N)!
[ ] Edge: empty list → head = tail = node!
[ ] Edge: idx=0 → prepend, idx=length → append!
[ ] Golden rule: attach new node FIRST, break old links SECOND!
[ ] Bookkeeping: this.length++ every time!
[ ] "Java is cool if you like money" — Prime 😂
TIẾP THEO → Phần 31: Linked List — Remove, Get, RemoveAt!
```
