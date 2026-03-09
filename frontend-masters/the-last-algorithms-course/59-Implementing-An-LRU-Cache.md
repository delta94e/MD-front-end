# The Last Algorithms Course You'll Need — Phần 59: Implementing an LRU Cache — "detach, prepend, trimCache, reverseLookup, First Try!"

> 📅 2026-03-09 · ⏱ 25 phút đọc
>
> Nguồn: Frontend Masters — ThePrimeagen
> Bài: Implementing an LRU Cache — "Node type, head/tail, lookup + reverseLookup maps, detach (break links + head/tail check), prepend (add to front), trimCache (evict tail + clean maps), get/update, got it first try!"
> Độ khó: ⭐️⭐️⭐️⭐️⭐️ | Implementation — full LRU, doubly linked list + two maps, Netflix production code!

---

## Mục Lục

| #   | Phần                                                   |
| --- | ------------------------------------------------------ |
| 1   | Node Type — "value, next, prev!"                       |
| 2   | Setup — "head, tail, lookup, reverseLookup, capacity!" |
| 3   | Why reverseLookup? — "Clean Up on Eviction!"           |
| 4   | detach() — "Break Links, Check Head/Tail!"             |
| 5   | prepend() — "Add to Front!"                            |
| 6   | trimCache() — "Over Capacity → Evict Tail!"            |
| 7   | get() — "Lookup → Detach → Prepend → Return!"          |
| 8   | update() — "Exists? Move : Create + Trim!"             |
| 9   | "Got It First Try!" — 69420 in the Test!               |
| 10  | Tự Implement: Complete LRU Cache                       |

---

## §1. Node Type — "value, next, prev!"

```typescript
type Node<T> = {
  value: T;
  next?: Node<T>;
  prev?: Node<T>;
};
```

---

## §2. Setup — "head, tail, lookup, reverseLookup, capacity!"

```typescript
class LRU<K, V> {
  private length: number = 0;
  private head?: Node<V>;
  private tail?: Node<V>;
  private lookup: Map<K, Node<V>>; // key → node!
  private reverseLookup: Map<Node<V>, K>; // node → key!
  private capacity: number;

  constructor(capacity: number = 10) {
    this.head = this.tail = undefined;
    this.lookup = new Map();
    this.reverseLookup = new Map();
    this.capacity = capacity;
  }
}
```

---

## §3. Why reverseLookup? — "Clean Up on Eviction!"

> Prime: _"What happens when we evict? We know the NODE to remove (tail), but we don't know what KEY is associated with it. Without reverseLookup, our lookup map will infinitely leak memory!"_

```
EVICTION PROBLEM:
═══════════════════════════════════════════════════════════════

  lookup:        "a" → NodeA, "b" → NodeB, "c" → NodeC
  reverseLookup: NodeA → "a", NodeB → "b", NodeC → "c"

  Evict tail (NodeC):
  1. reverseLookup.get(NodeC) → "c"   ← find the key!
  2. lookup.delete("c")               ← clean lookup!
  3. reverseLookup.delete(NodeC)       ← clean reverse!
  4. detach(NodeC)                     ← remove from list!

  Without reverseLookup → memory leak! 💀
```

---

## §4. detach() — "Break Links, Check Head/Tail!"

```typescript
private detach(node: Node<V>): void {
  // Update neighbors!
  if (node.prev) node.prev.next = node.next;
  if (node.next) node.next.prev = node.prev;

  // Update head/tail if needed!
  if (this.head === node) this.head = node.next;
  if (this.tail === node) this.tail = node.prev;

  // Break our own links!
  node.next = undefined;
  node.prev = undefined;
}
```

> Prime: _"If length is 1, head.next is undefined, tail.prev is undefined. So we don't even need a special check — it just works!"_

```
DETACH STEP BY STEP:
═══════════════════════════════════════════════════════════════

  Before: [A] ↔ [B] ↔ [C]    (detach B)

  1. A.next = B.next (C)       → [A] → [C],  [B] ↔ [C]
  2. C.prev = B.prev (A)       → [A] ↔ [C],  [B] → [C]
  3. if head===B → head=B.next (not head, skip!)
  4. if tail===B → tail=B.prev (not tail, skip!)
  5. B.next = undefined        → [A] ↔ [C],  [B]
  6. B.prev = undefined        → [A] ↔ [C],  [B] (detached!)
```

---

## §5. prepend() — "Add to Front!"

```typescript
private prepend(node: Node<V>): void {
  if (!this.head) {
    this.head = this.tail = node;
    return;
  }

  node.next = this.head;
  this.head.prev = node;
  this.head = node;
}
```

```
PREPEND:
═══════════════════════════════════════════════════════════════

  Before: HEAD→[A] ↔ [B] ↔ [C]←TAIL
  Prepend Z:

  1. Z.next = A         → [Z] → [A] ↔ [B] ↔ [C]
  2. A.prev = Z         → [Z] ↔ [A] ↔ [B] ↔ [C]
  3. head = Z           → HEAD→[Z] ↔ [A] ↔ [B] ↔ [C]←TAIL
```

---

## §6. trimCache() — "Over Capacity → Evict Tail!"

```typescript
private trimCache(): void {
  if (this.length <= this.capacity) return;

  const tail = this.tail!;
  this.detach(tail);

  const key = this.reverseLookup.get(tail)!;
  this.lookup.delete(key);
  this.reverseLookup.delete(tail);
  this.length--;
}
```

---

## §7. get() — "Lookup → Detach → Prepend → Return!"

```typescript
get(key: K): V | undefined {
  const node = this.lookup.get(key);
  if (!node) return undefined;

  // Move to front (most recently used!)
  this.detach(node);
  this.prepend(node);

  return node.value;
}
```

---

## §8. update() — "Exists? Move : Create + Trim!"

```typescript
update(key: K, value: V): void {
  let node = this.lookup.get(key);

  if (node) {
    // EXISTS: update value + move to front!
    node.value = value;
    this.detach(node);
    this.prepend(node);
    return;
  }

  // NOT EXISTS: create + insert!
  node = createNode(value);
  this.length++;
  this.prepend(node);
  this.lookup.set(key, node);
  this.reverseLookup.set(node, key);
  this.trimCache();
}
```

---

## §9. "Got It First Try!" — 69420 in the Test!

> Prime: _"My goodness, we got it first try! The test has 69420s in there, all sorts of stuff going on. I have impressed myself."_ 😂

---

## §10. Tự Implement: Complete LRU Cache

```javascript
// ═══ LRU CACHE — Complete Implementation ═══
// HashMap + Doubly Linked List = Superstructure!

class LRUNode {
  constructor(value) {
    this.value = value;
    this.next = null;
    this.prev = null;
  }
}

class LRUCache {
  #length = 0;
  #head = null;
  #tail = null;
  #lookup = new Map(); // key → node
  #reverseLookup = new Map(); // node → key (for eviction!)
  #capacity;

  constructor(capacity = 10) {
    this.#capacity = capacity;
  }

  get(key) {
    const node = this.#lookup.get(key);
    if (!node) return undefined;

    this.#detach(node);
    this.#prepend(node);
    return node.value;
  }

  update(key, value) {
    let node = this.#lookup.get(key);

    if (node) {
      node.value = value;
      this.#detach(node);
      this.#prepend(node);
      return;
    }

    node = new LRUNode(value);
    this.#length++;
    this.#prepend(node);
    this.#lookup.set(key, node);
    this.#reverseLookup.set(node, key);
    this.#trimCache();
  }

  #detach(node) {
    if (node.prev) node.prev.next = node.next;
    if (node.next) node.next.prev = node.prev;

    if (this.#head === node) this.#head = node.next;
    if (this.#tail === node) this.#tail = node.prev;

    node.next = null;
    node.prev = null;
  }

  #prepend(node) {
    if (!this.#head) {
      this.#head = this.#tail = node;
      return;
    }
    node.next = this.#head;
    this.#head.prev = node;
    this.#head = node;
  }

  #trimCache() {
    if (this.#length <= this.#capacity) return;

    const tail = this.#tail;
    this.#detach(tail);

    const key = this.#reverseLookup.get(tail);
    this.#lookup.delete(key);
    this.#reverseLookup.delete(tail);
    this.#length--;
  }
}

// Demo!
console.log("═══ IMPLEMENTING LRU CACHE ═══\n");

const lru = new LRUCache(3);

lru.update("a", 1);
lru.update("b", 2);
lru.update("c", 3);
console.log("get('a'):", lru.get("a")); // 1
console.log("get('b'):", lru.get("b")); // 2

lru.update("d", 4); // evicts 'c' (LRU!)
console.log("get('c'):", lru.get("c")); // undefined (evicted!)
console.log("get('d'):", lru.get("d")); // 4

lru.update("a", 69420);
console.log("get('a'):", lru.get("a")); // 69420

lru.update("e", 5); // evicts 'b' (LRU!)
console.log("get('b'):", lru.get("b")); // undefined (evicted!)

console.log("\n═══ TWO MAPS ═══");
console.log("lookup:        key → Node  (O(1) access!)");
console.log("reverseLookup: Node → key  (O(1) eviction cleanup!)");

console.log("\n✅ Got it first try! — Prime");
console.log("✅ Map + Doubly Linked List = Superstructure!");
console.log("✅ Used at Netflix on TV platform for years!");
```

---

## Checklist

```
[ ] Node: value, next?, prev? (doubly linked list!)
[ ] Setup: head, tail, lookup, reverseLookup, capacity!
[ ] reverseLookup: node → key (needed for eviction cleanup!)
[ ] detach: break links, check head/tail, clear pointers!
[ ] prepend: add to front, handle empty list!
[ ] trimCache: over capacity → detach tail, clean both maps!
[ ] get: lookup → detach → prepend → return value!
[ ] update exists: value=new, detach, prepend!
[ ] update new: create node, length++, prepend, set maps, trim!
[ ] "These data structures are things you WILL run into" — Prime
TIẾP THEO → Phần 60: Wrapping Up!
```
