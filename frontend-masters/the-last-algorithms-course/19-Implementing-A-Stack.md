# The Last Algorithms Course You'll Need — Phần 19: Implementing a Stack — "Previous Not Next, Math.max, TypeScript Battle, First Try!"

> 📅 2026-03-09 · ⏱ 15 phút đọc
>
> Nguồn: Frontend Masters — ThePrimeagen
> Bài: Implementing a Stack — "Node with prev, push/pop head only, Math.max for length, TypeScript type fights, first try (edited)!"
> Độ khó: ⭐️⭐️⭐️ | Implementation — full TypeScript stack, simpler than queue!

---

## Mục Lục

| #   | Phần                                                |
| --- | --------------------------------------------------- |
| 1   | Node Type — "Previous Instead of Next!"             |
| 2   | Constructor — "Head Only, No Tail!"                 |
| 3   | Peek — "head?.value!"                               |
| 4   | Push — "node.prev = head, head = node!"             |
| 5   | Pop — "Math.max(0, length-1), Save Head!"           |
| 6   | TypeScript Battles — "Can't Cast? Undefined Check!" |
| 7   | "First Try!" — "(We Can Edit That In Post)" 😂      |
| 8   | Tự Implement: Complete Stack                        |

---

## §1. Node Type — "Previous Instead of Next!"

> Prime: _"I'm gonna do PREVIOUS instead of next. It just makes it easier for me to visualize. We don't return this container to the outside world — you can represent it the way most convenient for YOU."_

```typescript
type Node<T> = {
  value: T;
  prev?: Node<T>; // previous, not next!
};
```

---

## §2. Constructor — "Head Only, No Tail!"

> Prime: _"We need to define where our head is. I just really like being explicit."_

```typescript
class Stack<T> {
  public length: number;
  private head?: Node<T>;

  constructor() {
    this.head = undefined;
    this.length = 0;
  }
}
```

Simpler than queue — **no tail pointer needed!**

---

## §3. Peek — "head?.value!"

```typescript
peek(): T | undefined {
  return this.head?.value;
}
```

---

## §4. Push — "node.prev = head, head = node!"

> Prime: _"If head is undefined, just set head to the node. If there IS a head, point new node to head, then update head."_

```typescript
push(item: T): void {
  const node = { value: item } as Node<T>;
  this.length++;

  if (!this.head) {
    this.head = node;
    return;
  }

  node.prev = this.head;   // new → old head!
  this.head = node;         // head = new!
}
```

---

## §5. Pop — "Math.max(0, length-1), Save Head!"

> Prime: _"We can't just decrement because we'll go into -1 territory if you keep popping."_

### Math.max trick!

```typescript
pop(): T | undefined {
  this.length = Math.max(0, this.length - 1);

  if (this.length === 0) {
    const head = this.head;
    this.head = undefined;
    return head?.value;
  }

  const head = this.head as Node<T>;
  this.head = head.prev;

  // Cleanup (in real languages: free!)
  head.prev = undefined;

  return head.value;
}
```

Prime on languages: _"In C++, you'd have to FREE it. If you're using Rust, you wouldn't program a linked list because it's too hard."_ 😂

---

## §6. TypeScript Battles — "Can't Cast? Undefined Check!"

> Prime had a TypeScript error on first run — accessing value on potentially undefined head.

Fix: Use `head?.value` instead of `head.value` when head could be undefined!

_"That's a TypeScript error, my fault."_

---

## §7. "First Try!" — "(We Can Edit That In Post)" 😂

> Prime: After fixing the TypeScript issue → _"Look at that, FIRST TRY! We got it very first try. We can edit that in post, right? Definitely got this first try."_ 😂

### Stack = easier than queue!

Prime: _"The steps are actually MORE SIMPLE than a queue. You're really only focusing on a single pointer — head. It's the easiest data structure to implement. Only difficult part: drawing backwards."_

---

## §8. Tự Implement: Complete Stack

```javascript
// ═══ Stack — Complete Implementation ═══

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

    node.prev = this.#head;
    this.#head = node;
  }

  pop() {
    if (!this.#head) return undefined;

    this.length = Math.max(0, this.length - 1);
    const h = this.#head;

    if (this.length === 0) {
      this.#head = null;
    } else {
      this.#head = h.prev;
    }

    h.prev = null;
    return h.value;
  }

  peek() {
    return this.#head?.value;
  }
}

// Tests
console.log("═══ STACK IMPLEMENTATION ═══\n");

const stack = new Stack();

// Push
console.log("Push:");
["A", "B", "C", "D", "E"].forEach((item) => {
  stack.push(item);
  console.log(
    `  Push "${item}" → peek: "${stack.peek()}", len: ${stack.length}`,
  );
});

// Pop (LIFO!)
console.log("\nPop (LIFO!):");
while (stack.length > 0) {
  console.log(`  Pop: "${stack.pop()}" → len: ${stack.length}`);
}

// Edge: pop empty
console.log("\nEdge cases:");
console.log("Pop empty:", stack.pop()); // undefined
console.log("Pop again:", stack.pop()); // undefined
console.log("Length:", stack.length); // 0 (not -1!)

// Re-push after empty
stack.push("New");
console.log("After push:", stack.peek()); // "New"
console.log("Length:", stack.length); // 1

console.log("\n✅ Push/Pop/Peek all O(1)!");
console.log("✅ Simpler than queue — head only!");
console.log("✅ Math.max prevents negative length!");
```

---

## Checklist

```
[ ] Node: { value, prev } — not next!
[ ] Constructor: head = undefined, length = 0, NO tail!
[ ] Peek: head?.value — optional chaining!
[ ] Push: node.prev = head, head = node! O(1)!
[ ] Pop: Math.max(0, length - 1) — prevent negative!
[ ] Pop: save head, update to prev, clean up, return value!
[ ] TypeScript: handle undefined carefully!
[ ] Simpler than queue — only one pointer (head)!
[ ] "First try! We can edit that in post." — Prime 😂
TIẾP THEO → Phần 20: Arrays vs Linked Lists!
```
