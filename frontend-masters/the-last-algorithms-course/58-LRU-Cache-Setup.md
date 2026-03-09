# The Last Algorithms Course You'll Need — Phần 58: LRU Cache Setup — "get() + update() Pseudocode, Check Capacity, Evict Tail!"

> 📅 2026-03-09 · ⏱ 15 phút đọc
>
> Nguồn: Frontend Masters — ThePrimeagen
> Bài: LRU Cache Setup — "get() = check cache → move to front → return value, update() = exists? update+move : insert+check capacity+evict, no separate insert function!"
> Độ khó: ⭐️⭐️⭐️⭐️ | Setup — pseudocode for get/update, capacity management, eviction logic!

---

## Mục Lục

| #   | Phần                                                     |
| --- | -------------------------------------------------------- |
| 1   | Interface — "get() + update(), No Insert!"               |
| 2   | get() Pseudocode — "Check, Move, Return!"                |
| 3   | update() Pseudocode — "Exists? Update : Insert + Evict!" |
| 4   | The Tricky Part — "update() Changes Value Too!"          |
| 5   | Tự Implement: LRU Cache                                  |

---

## §1. Interface — "get() + update(), No Insert!"

> Prime: _"Notice there's no insert. We just say 'update this thing.' If it's in there, move to front. If not, add to front."_

```typescript
class LRU<K, V> {
  get(key: K): V | undefined; // lookup + move to front!
  update(key: K, value: V): void; // insert or update!
}
```

---

## §2. get() Pseudocode — "Check, Move, Return!"

```
GET(key):
═══════════════════════════════════════════════════════════════

  1. Check cache for existence (HashMap lookup!)
  2. If not found → return undefined!
  3. Move node to front of list (most recently used!)
  4. Return value!
```

---

## §3. update() Pseudocode — "Exists? Update : Insert + Evict!"

```
UPDATE(key, value):
═══════════════════════════════════════════════════════════════

  Does key exist in cache?
  │
  ├── YES:
  │   1. Update the node's value!
  │   2. Move node to front of list!
  │
  └── NO:
      1. Create new node!
      2. Prepend to list (front)!
      3. Add to HashMap!
      4. length++
      5. Check capacity:
         └── If length > capacity:
             a. Remove TAIL node!
             b. Delete from HashMap!
             c. length--
```

---

## §4. The Tricky Part — "update() Changes Value Too!"

> Prime: _"In some LRUs, we only update position. For us, we're gonna update the CONTENTS of the cache as well."_

---

## §5. Tự Implement: LRU Cache

```javascript
// ═══ LRU Cache — HashMap + Doubly Linked List ═══

class LRUNode {
  constructor(key, value) {
    this.key = key;
    this.value = value;
    this.prev = null;
    this.next = null;
  }
}

class LRU {
  #capacity;
  #length = 0;
  #head = null;
  #tail = null;
  #lookup = new Map(); // key → Node!

  constructor(capacity) {
    this.#capacity = capacity;
  }

  // Get: lookup → move to front → return!
  get(key) {
    const node = this.#lookup.get(key);
    if (!node) return undefined;

    this.#detach(node);
    this.#prepend(node);
    return node.value;
  }

  // Update: exists? update : insert + evict!
  update(key, value) {
    let node = this.#lookup.get(key);

    if (node) {
      // EXISTS: update value + move to front!
      node.value = value;
      this.#detach(node);
      this.#prepend(node);
      return;
    }

    // NOT EXISTS: create + prepend!
    node = new LRUNode(key, value);
    this.#prepend(node);
    this.#lookup.set(key, node);
    this.#length++;

    // Check capacity + evict!
    if (this.#length > this.#capacity) {
      const tail = this.#tail;
      this.#detach(tail);
      this.#lookup.delete(tail.key);
      this.#length--;
    }
  }

  // Break node out of list (4 operations!)
  #detach(node) {
    if (node.prev) node.prev.next = node.next;
    if (node.next) node.next.prev = node.prev;

    if (this.#head === node) this.#head = node.next;
    if (this.#tail === node) this.#tail = node.prev;

    node.next = null;
    node.prev = null;
  }

  // Add node to front of list (3 operations!)
  #prepend(node) {
    if (!this.#head) {
      this.#head = this.#tail = node;
      return;
    }

    node.next = this.#head;
    this.#head.prev = node;
    this.#head = node;
  }
}

// Demo!
console.log("═══ LRU CACHE ═══\n");

const lru = new LRU(3); // capacity = 3!

lru.update("a", 1);
lru.update("b", 2);
lru.update("c", 3);
console.log("get('a'):", lru.get("a")); // 1 (moved to front!)
console.log("get('b'):", lru.get("b")); // 2 (moved to front!)

// Over capacity! 'c' is LRU → evicted!
lru.update("d", 4);
console.log("get('c'):", lru.get("c")); // undefined (evicted!)
console.log("get('d'):", lru.get("d")); // 4

// Update existing!
lru.update("a", 10);
console.log("get('a'):", lru.get("a")); // 10 (updated!)

console.log("\n═══ OPERATIONS ═══");
console.log("get:    O(1) — map lookup + detach + prepend!");
console.log("update: O(1) — map lookup + create/update + prepend!");
console.log("evict:  O(1) — detach tail + map.delete!");

console.log("\n✅ HashMap + Doubly Linked List = Superstructure!");
console.log("✅ All operations O(1)!");
```

---

## Checklist

```
[ ] get: map.get(key) → detach → prepend → return value!
[ ] update exists: update value → detach → prepend!
[ ] update not exists: create node → prepend → map.set!
[ ] Check capacity after insert → evict tail if over!
[ ] Evict: detach tail → map.delete(tail.key) → length--!
[ ] detach: 4 pointer operations (break out of list!)
[ ] prepend: 3 pointer operations (add to front!)
[ ] No separate insert — update handles both!
[ ] Store KEY in node (needed for map.delete on evict!)
TIẾP THEO → Phần 59: Implementing LRU Cache!
```
