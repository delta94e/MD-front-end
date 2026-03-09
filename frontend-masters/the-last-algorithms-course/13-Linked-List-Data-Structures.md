# The Last Algorithms Course You'll Need — Phần 13: Linked List Data Structures — "Nodes, Pointers, O(1) Insert/Delete, First Real Data Structure!"

> 📅 2026-03-08 · ⏱ 35 phút đọc
>
> Nguồn: Frontend Masters — ThePrimeagen
> Bài: Linked List Data Structures — "Node-based, singly vs doubly, insert/delete O(1), no index, operation ordering matters!"
> Độ khó: ⭐️⭐️⭐️⭐️ | Core — linked lists, nodes, pointers, insert/delete at a node, singly vs doubly!

---

## Mục Lục

| #   | Phần                                               |
| --- | -------------------------------------------------- |
| 1   | JS [] Is NOT an Array — The Reveal!                |
| 2   | What Sucks About Arrays? — "No Delete, No Insert!" |
| 3   | Linked List — "First REAL Data Structure!"         |
| 4   | Node — "Container for Your Data!"                  |
| 5   | Singly vs Doubly — "Can You Walk Back?"            |
| 6   | Insertion — "Break 4 Links, Set 4 Links, O(1)!"    |
| 7   | Deletion — "Operation Ordering is CRUCIAL!"        |
| 8   | No Index! — "Traverse to Get There!"               |
| 9   | Tự Implement: Linked List Node                     |
| 10  | 🔬 Deep Analysis — Array vs Linked List            |

---

## §1. JS [] Is NOT an Array — The Reveal!

> Prime: _"We have a solid definition of an array now. Is this thing an array? It's NOT. You've got push — you can GROW it. Something's happening ON TOP of an array."_

### JavaScript [] = more than an array!

Prime: _"You can insert, delete, and all the indices are being adjusted. If I shift, the first element becomes the zeroth. Something more than just an array is happening — some sort of organizational structure."_

Prime's hot takes: _"HTML is not a programming language. Neovim is the greatest editor. Rust is the greatest language. Linux is the only machine you should develop on."_ 😂

---

## §2. What Sucks About Arrays? — "No Delete, No Insert!"

> Prime: _"What sucks about an array? Deletion — you can't really delete, just zero out. Insertion — you can't really insert. It's ungrowable. Remember Fred? F's in chat."_

### Arrays = limited!

- ❌ Can't delete (only zero out)!
- ❌ Can't insert (only overwrite)!
- ❌ Can't grow (Fred dies)!

→ Need something better → **Linked List!**

---

## §3. Linked List — "First REAL Data Structure!"

> Prime: _"This is really our FIRST real data structure. They call this a NODE-BASED data structure. This was the first algorithm that BLEW MY MIND."_

_"You can see us allocating and walking memory. I thought this was the COOLEST THING. This is the coolest moment in all my programming career that I can tangibly remember."_

### How it works!

Series of nodes, each pointing to the next:

```
LINKED LIST:
═══════════════════════════════════════════════════════════════

  head
   ↓
  (A) → (B) → (C) → (D) → null

  Each node contains:
  - value: the actual data!
  - next: pointer to next node!

  To get element at index 3:
  (A) → (B) → (C) → (D) → got it!
   0      1      2      3

  "We literally go 1, 2, 3 — got the 4th item!" — Prime
```

---

## §4. Node — "Container for Your Data!"

> Prime: _"It's a CONTAINER item. You hand me a value T, and I put something around it."_

### Node type definition!

```typescript
type Node<T> = {
  value: T;
  next?: Node<T>; // singly linked!
  prev?: Node<T>; // doubly linked!
};
```

Prime: _"A node contains a VALUE and a REFERENCE to another node. You can walk this daisy chain of nodes which contain values."_

---

## §5. Singly vs Doubly — "Can You Walk Back?"

> Prime: _"A points to B, B points to C, C points to D — you CAN'T walk backwards. The moment you go forward, if you don't have a reference to what's behind you, you've LOST IT FOREVER."_

### Singly linked = one direction!

```
SINGLY LINKED:
═══════════════════════════════════════════════════════════════

  (A) → (B) → (C) → (D) → null

  Can walk: A → B → C → D ✅
  Can't walk: D → C → B → A ❌

  "If I take head and point to B, no one can access A.
   It's just GONE." — Prime
```

### Doubly linked = both directions!

```
DOUBLY LINKED:
═══════════════════════════════════════════════════════════════

  null ← (A) ⇄ (B) ⇄ (C) ⇄ (D) → null

  Can walk forward:  A → B → C → D ✅
  Can walk backward: D → C → B → A ✅

  Each node has: value, next, AND prev!
```

Prime on GC: _"JavaScript GC is so advanced it can tell that though A references data that's still alive, A itself has no references left — therefore dead."_

---

## §6. Insertion — "Break 4 Links, Set 4 Links, O(1)!"

> Prime: _"One cool property about linked lists — insertion can be very, very fast."_

### Insert F between A and B (doubly linked)!

```
INSERTION (doubly linked):
═══════════════════════════════════════════════════════════════

  Before:
  (A) ⇄ (B) ⇄ (C) ⇄ (D)

  Insert F between A and B:

  Step 1: A.next = F         (A now points to F!)
  Step 2: F.prev = A         (F points back to A!)
  Step 3: F.next = B         (F points forward to B!)
  Step 4: B.prev = F         (B points back to F!)

  After:
  (A) ⇄ (F) ⇄ (B) ⇄ (C) ⇄ (D)

  Operations: 4 pointer sets = CONSTANT!
  → O(1)! 🎯
```

Prime: _"We set 2 nexts and 2 previouses. Are any of those operations based on how many nodes are in the list? NO. Setting next is CONSTANT. Therefore, inserting in a linked list at a given position is O(1)."_

---

## §7. Deletion — "Operation Ordering is CRUCIAL!"

> Prime: _"We have C and we want to delete it."_

### Delete C from A ⇄ B ⇄ C ⇄ D!

```
DELETION (doubly linked):
═══════════════════════════════════════════════════════════════

  Before:
  (A) ⇄ (B) ⇄ (C) ⇄ (D)

  Delete C — we HAVE access to node C:

  Step 1: B.next = C.next    → B now points to D!
          (B.next = D)
  Step 2: D.prev = C.prev    → D now points back to B!
          (D.prev = B)
  Step 3: C.prev = null      → clean up C!
  Step 4: C.next = null      → clean up C!
  Step 5: return C.value     → return the deleted value!

  After:
  (A) ⇄ (B) ⇄ (D)

  C is disconnected: (C) → garbage collected!

  Operations: 4 pointer sets = CONSTANT!
  → O(1)! 🎯
```

### ⚠️ Operation ordering matters!

> Prime: _"If I set C.next = undefined FIRST, could we ever access D again? NO. D is GONE, we can no longer ever access it. Operation ordering is EXTREMELY important."_

```
⚠️ ORDER MATTERS:
═══════════════════════════════════════════════════════════════

  ❌ WRONG ORDER:
  C.next = null          → D is LOST FOREVER! 💀
  B.next = C.next        → B.next = null! BROKEN!

  ✅ CORRECT ORDER:
  B.next = C.next        → save reference to D first!
  D.prev = C.prev        → save reference to B first!
  THEN clean up C!

  "ALWAYS save references before breaking links!" — Prime
```

---

## §8. No Index! — "Traverse to Get There!"

> Student: _"Linked list, there's no index?"_
> Prime: _"CORRECT. There is no index. You have access to a node from which you can TRAVERSE to get to the node you desire."_

### Get by index = O(N)!

```
GET BY INDEX — O(N):
═══════════════════════════════════════════════════════════════

  Array:  arr[3] → address + (3 × width) → O(1)! 🚀

  Linked List: get(3) →
    head → node1 → node2 → node3 → O(N)! 🐢

  "You can't just get the 8th structure.
   You literally have to go 1, 2, 3..." — Prime
```

---

## §9. Tự Implement: Linked List Node

```javascript
// ═══ Linked List Node — Basic Structure ═══

class Node {
  constructor(value) {
    this.value = value;
    this.next = null; // singly: next only!
    this.prev = null; // doubly: + prev!
  }
}

// Demonstrate insertion!
function insertAfter(nodeA, newNode) {
  const nodeB = nodeA.next;

  // Set forward links
  nodeA.next = newNode; // A → F
  newNode.next = nodeB; // F → B

  // Set backward links (doubly)
  newNode.prev = nodeA; // A ← F
  if (nodeB) nodeB.prev = newNode; // F ← B

  return newNode;
}

// Demonstrate deletion!
function deleteNode(node) {
  const prev = node.prev;
  const next = node.next;

  // Bridge the gap!
  if (prev) prev.next = next; // B → D (skip C!)
  if (next) next.prev = prev; // B ← D (skip C!)

  // Clean up
  node.prev = null;
  node.next = null;

  return node.value;
}

// Demo
const a = new Node("A");
const b = new Node("B");
const c = new Node("C");
const d = new Node("D");

// Build: A ⇄ B ⇄ C ⇄ D
a.next = b;
b.prev = a;
b.next = c;
c.prev = b;
c.next = d;
d.prev = c;

function printList(head) {
  let curr = head;
  const values = [];
  while (curr) {
    values.push(curr.value);
    curr = curr.next;
  }
  return values.join(" ⇄ ");
}

console.log("═══ LINKED LIST ═══\n");
console.log("Initial:", printList(a)); // A ⇄ B ⇄ C ⇄ D

// Insert F after A
const f = new Node("F");
insertAfter(a, f);
console.log("Insert F after A:", printList(a)); // A ⇄ F ⇄ B ⇄ C ⇄ D

// Delete C
const deleted = deleteNode(c);
console.log(`Delete C (got "${deleted}"):`, printList(a)); // A ⇄ F ⇄ B ⇄ D

console.log("\n✅ Insert = O(1)! Just set pointers!");
console.log("✅ Delete = O(1)! Just re-link neighbors!");
console.log("✅ Get by index = O(N)! Must traverse!");
```

---

## §10. 🔬 Deep Analysis — Array vs Linked List

```
ARRAY vs LINKED LIST:
═══════════════════════════════════════════════════════════════

  Operation      | Array  | Linked List
  ───────────────|────────|─────────────
  Get by index   | O(1)   | O(N)         ← array wins!
  Insert at pos  | N/A    | O(1)*        ← linked list wins!
  Delete at pos  | N/A    | O(1)*        ← linked list wins!
  Prepend        | N/A    | O(1)         ← linked list wins!
  Append         | N/A    | O(1)**       ← linked list wins!
  Memory         | contig.| scattered    ← array more cache-friendly!

  * = IF you already have the node! Getting there = O(N)!
  ** = IF you have a tail pointer!

  KEY INSIGHT:
  ┌──────────────────────────────────────────────────────────┐
  │ Arrays: great for READING (random access O(1))!        │
  │ Linked Lists: great for WRITING (insert/delete O(1))!  │
  │ → Different tools for different problems!               │
  └──────────────────────────────────────────────────────────┘

  "This was the first algorithm that BLEW MY MIND.
   The coolest moment in all my programming career." — Prime 🎯
```

---

## Checklist

```
[ ] JS [] ≠ array! Has push, grow, shift = something more!
[ ] Arrays suck: no delete, no insert, no grow!
[ ] Linked list = node-based, heap-allocated!
[ ] Node: { value, next, prev? }!
[ ] Singly: can only walk forward!
[ ] Doubly: can walk both directions!
[ ] Insertion (at node): set 4 pointers = O(1)!
[ ] Deletion (at node): re-link neighbors = O(1)!
[ ] ⚠️ Operation ordering: save refs before breaking links!
[ ] No index! Get by index = O(N), must traverse!
[ ] "Coolest moment in my career!" — Prime
TIẾP THEO → Phần 14: Linked List Complexity & Q&A!
```
