# The Last Algorithms Course You'll Need — Phần 31: Linked List — Remove, Get, RemoveAt — "Rule of Three, removeNode(), getAt()!"

> 📅 2026-03-09 · ⏱ 25 phút đọc
>
> Nguồn: Frontend Masters — ThePrimeagen
> Bài: Doubly Linked List — remove, get, removeAt — "Walk to find, hop over to remove, getAt helper, removeNode generalized, Rule of Three refactor!"
> Độ khó: ⭐️⭐️⭐️⭐️ | Implementation — read/delete ops, generalized removal, refactoring linked list code!

---

## Mục Lục

| #   | Phần                                                      |
| --- | --------------------------------------------------------- |
| 1   | Remove by Value — "Walk Until Found, Then Delete!"        |
| 2   | The Deletion — "Hop Over, Break Links!"                   |
| 3   | Head/Tail Edge Cases — "Update If Removing Head or Tail!" |
| 4   | Get — "Walk to Index, Return Value!"                      |
| 5   | RemoveAt — "Get Node, Then Remove!"                       |
| 6   | Rule of Three — "getAt() + removeNode() Refactor!"        |
| 7   | Tự Implement: Complete Doubly Linked List                 |

---

## §1. Remove by Value — "Walk Until Found, Then Delete!"

> Prime: _"We have an item T in which we need to find in the list, then remove it. Walk until we find it."_

```typescript
remove(item: T): T | undefined {
  let curr = this.head;

  // Walk until we find the item!
  for (let i = 0; curr && i < this.length; i++) {
    if (curr.value === item) {
      break;  // found it!
    }
    curr = curr.next;
  }

  if (!curr) return undefined;  // not found!

  return this.removeNode(curr);
}
```

---

## §2. The Deletion — "Hop Over, Break Links!"

> Prime: _"Take whatever is pointing to the node and point OVER it. Then break the links."_

```
REMOVAL:
═══════════════════════════════════════════════════════════════

  Before:
  ... ⇄ (B) ⇄ (C) ⇄ (D) ⇄ ...
                ↑ remove this!

  Step 1: B.next = D        → hop over C!
  Step 2: D.prev = B        → hop back over C!
  Step 3: C.prev = undefined → break link!
  Step 4: C.next = undefined → break link!

  After:
  ... ⇄ (B) ⇄ (D) ⇄ ...
  (C) disconnected → garbage collected!
```

### Generalized removeNode!

```typescript
private removeNode(node: Node<T>): T {
  this.length--;

  // If list is now empty!
  if (this.length === 0) {
    const out = node.value;
    this.head = this.tail = undefined;
    return out;
  }

  // Hop over in both directions!
  if (node.prev) {
    node.prev.next = node.next;
  }
  if (node.next) {
    node.next.prev = node.prev;
  }

  // Update head/tail if needed!
  if (node === this.head) {
    this.head = node.next;
  }
  if (node === this.tail) {
    this.tail = node.prev;
  }

  // Break links (cleanup)!
  node.prev = node.next = undefined;
  return node.value;
}
```

---

## §3. Head/Tail Edge Cases — "Update If Removing Head or Tail!"

```
EDGE CASES:
═══════════════════════════════════════════════════════════════

  Removing HEAD:
  head → (A) ⇄ (B) ⇄ (C) ← tail
  → head = A.next = B!

  Removing TAIL:
  head → (A) ⇄ (B) ⇄ (C) ← tail
  → tail = C.prev = B!

  Removing LAST item (length becomes 0):
  head → (A) ← tail
  → head = tail = undefined!
```

---

## §4. Get — "Walk to Index, Return Value!"

```typescript
get(idx: number): T | undefined {
  return this.getAt(idx)?.value;
}
```

---

## §5. RemoveAt — "Get Node, Then Remove!"

```typescript
removeAt(idx: number): T | undefined {
  const node = this.getAt(idx);
  if (!node) return undefined;
  return this.removeNode(node);
}
```

---

## §6. Rule of Three — "getAt() + removeNode() Refactor!"

> Prime: _"Martin Fowler's Rule of Three is what I deal with. Since we have one walk here, one there, and one there — we can generalize."_

_"I wasn't planning on doing this, but it just FEELS RIGHT. Sometimes it's how I feel — I can't actually NOT do it."_

### Two helper functions!

```typescript
// Walk to index — shared by get, insertAt, removeAt!
private getAt(idx: number): Node<T> | undefined {
  let curr = this.head;
  for (let i = 0; i < idx && curr; i++) {
    curr = curr.next;
  }
  return curr;
}

// Remove a specific node — shared by remove, removeAt!
private removeNode(node: Node<T>): T {
  this.length--;

  if (this.length === 0) {
    this.head = this.tail = undefined;
    return node.value;
  }

  if (node.prev) node.prev.next = node.next;
  if (node.next) node.next.prev = node.prev;

  if (node === this.head) this.head = node.next;
  if (node === this.tail) this.tail = node.prev;

  node.prev = node.next = undefined;
  return node.value;
}
```

---

## §7. Tự Implement: Complete Doubly Linked List

```javascript
// ═══ Complete Doubly Linked List ═══

class DoublyLinkedList {
  #head = null;
  #tail = null;
  length = 0;

  // ──── HELPERS ────

  #getAt(idx) {
    let curr = this.#head;
    for (let i = 0; i < idx && curr; i++) {
      curr = curr.next;
    }
    return curr;
  }

  #removeNode(node) {
    this.length--;
    if (this.length === 0) {
      this.#head = this.#tail = null;
      return node.value;
    }
    if (node.prev) node.prev.next = node.next;
    if (node.next) node.next.prev = node.prev;
    if (node === this.#head) this.#head = node.next;
    if (node === this.#tail) this.#tail = node.prev;
    node.prev = node.next = null;
    return node.value;
  }

  // ──── WRITE OPS ────

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

    const curr = this.#getAt(idx);
    const node = { value: item, prev: null, next: null };

    node.next = curr;
    node.prev = curr.prev;
    curr.prev = node;
    if (node.prev) node.prev.next = node;

    this.length++;
  }

  // ──── READ OPS ────

  get(idx) {
    return this.#getAt(idx)?.value;
  }

  // ──── DELETE OPS ────

  remove(item) {
    let curr = this.#head;
    while (curr) {
      if (curr.value === item) {
        return this.#removeNode(curr);
      }
      curr = curr.next;
    }
    return undefined;
  }

  removeAt(idx) {
    const node = this.#getAt(idx);
    if (!node) return undefined;
    return this.#removeNode(node);
  }

  // ──── UTILITY ────

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
console.log("═══ COMPLETE DOUBLY LINKED LIST ═══\n");

const list = new DoublyLinkedList();
["A", "B", "C", "D", "E"].forEach((v) => list.append(v));
console.log("Initial:", list.print()); // A ⇄ B ⇄ C ⇄ D ⇄ E

// Get
console.log("\nGet:");
console.log("get(0):", list.get(0)); // A
console.log("get(2):", list.get(2)); // C
console.log("get(4):", list.get(4)); // E

// Remove by value
console.log("\nRemove by value:");
console.log("remove('C'):", list.remove("C")); // C
console.log("After:", list.print()); // A ⇄ B ⇄ D ⇄ E

// RemoveAt
console.log("\nRemoveAt:");
console.log("removeAt(0):", list.removeAt(0)); // A (head!)
console.log("After:", list.print()); // B ⇄ D ⇄ E

console.log("removeAt(2):", list.removeAt(2)); // E (tail!)
console.log("After:", list.print()); // B ⇄ D

// InsertAt
list.insertAt("X", 1);
console.log("\ninsertAt('X',1):", list.print()); // B ⇄ X ⇄ D

console.log("\nLength:", list.length); // 3

console.log("\n═══ COMPLEXITY ═══");
console.log("get(idx):    O(N) — walk!");
console.log("remove(val): O(N) — walk + O(1) delete!");
console.log("removeAt(i): O(N) — walk + O(1) delete!");
console.log("prepend:     O(1)!");
console.log("append:      O(1)!");
console.log("\n✅ Rule of Three: getAt() + removeNode() shared!");
```

---

## Checklist

```
[ ] Remove by value: walk to find, then removeNode()!
[ ] Deletion: hop over (prev.next = next, next.prev = prev)!
[ ] Head/tail: update if removing head or tail!
[ ] Length 0: head = tail = undefined!
[ ] Get: getAt(idx)?.value!
[ ] RemoveAt: getAt(idx), then removeNode()!
[ ] Rule of Three: getAt() + removeNode() refactored!
[ ] Break links after removal (cleanup for non-GC languages)!
[ ] "It's really not complicated and super complicated at the same time" — Prime
TIẾP THEO → Phần 32: Linked List Q&A!
```
