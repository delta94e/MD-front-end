# The Last Algorithms Course You'll Need — Phần 21: ArrayList — "Array + Growth, Push/Pop O(1), Enqueue/Dequeue O(N)!"

> 📅 2026-03-09 · ⏱ 25 phút đọc
>
> Nguồn: Frontend Masters — ThePrimeagen
> Bài: ArrayList — "Array underneath, length vs capacity, push/pop O(1), enqueue/dequeue O(N) shifting, grow by doubling!"
> Độ khó: ⭐️⭐️⭐️ | Data Structure — dynamic array, capacity management, the basis for maps and ring buffers!

---

## Mục Lục

| #   | Phần                                           |
| --- | ---------------------------------------------- |
| 1   | "Can We Do Better?" — "Array Access + Growth!" |
| 2   | Length vs Capacity — "1 Item, 3 Slots!"        |
| 3   | Get — "Check Length Bounds!"                   |
| 4   | Push — "Write at Length, Increment, O(1)!"     |
| 5   | Pop — "Decrement Length, Return, O(1)!"        |
| 6   | Growing — "Double Capacity, Mem Copy!"         |
| 7   | Enqueue/Dequeue — "Shift Everything = O(N)!"   |
| 8   | Delete in Middle — "Also O(N)!"                |
| 9   | Cleanup — "To Null or Not to Null?"            |
| 10  | "It Depends!" — "ArrayList vs Linked List?"    |
| 11  | Tự Implement: ArrayList                        |

---

## §1. "Can We Do Better?" — "Array Access + Growth!"

> Prime: _"Can we have array ACCESS with the ability to GROW? The answer is YES."_

### What is an ArrayList?

Prime: _"An ArrayList — instead of having underlying CONTAINERS (nodes), we have an ARRAY of generic T. When we need to grow, we grow. It's the basis of maps, ring buffers..."_

---

## §2. Length vs Capacity — "1 Item, 3 Slots!"

```
LENGTH vs CAPACITY:
═══════════════════════════════════════════════════════════════

  Array: [2][ ][ ]
          ↑
       length = 1 (items we have!)
       capacity = 3 (slots available!)

  "We can store up to 3 numbers but have a length of 1." — Prime
```

---

## §3. Get — "Check Length Bounds!"

> Prime: _"If idx >= length, throw error or return undefined. You're accessing outside the bounds."_

```typescript
get(idx: number): T | undefined {
  if (idx >= this.length) return undefined;
  return this.data[idx];
}
```

---

## §4. Push — "Write at Length, Increment, O(1)!"

> Prime: _"Length — are you within my capacity? Awesome, push the value in, increment length."_

```
PUSH:
═══════════════════════════════════════════════════════════════

  Before: [2][3][ ]   length=2, capacity=3
  Push 5: [2][3][5]   length=3, capacity=3

  Step 1: data[length] = item   → write at position 2!
  Step 2: length++              → length is now 3!

  → O(1)! No traversal, no shifting!
```

> Student: _"What's the Big O of push?"_
> Prime: _"CONSTANT — none of those things depend on the input."_

---

## §5. Pop — "Decrement Length, Return, O(1)!"

```
POP:
═══════════════════════════════════════════════════════════════

  Before: [2][3][5]   length=3
  Pop:    [2][3][5]   length=2 (5 still there but ignored!)

  Step 1: value = data[length - 1]  → grab 5!
  Step 2: length--                   → length is now 2!

  "You don't actually have to zero out the data." — Prime
```

---

## §6. Growing — "Double Capacity, Mem Copy!"

> Prime: _"What happens when we exceed capacity? Create a new array of some longer length — say DOUBLE our capacity. Then mem copy all values over."_

```
GROW:
═══════════════════════════════════════════════════════════════

  Before: [2][3][5]   length=3, capacity=3
  Push 7: capacity exceeded!

  Step 1: Create new array, capacity = 6
         [ ][ ][ ][ ][ ][ ]

  Step 2: Copy values over
         [2][3][5][ ][ ][ ]

  Step 3: Now push 7!
         [2][3][5][7][ ][ ]   length=4, capacity=6

  "It's a GAME — least memory but least growing operations." — Prime
```

---

## §7. Enqueue/Dequeue — "Shift Everything = O(N)!"

> Prime: _"If you were to enqueue/dequeue on an ArrayList, you'd have to SHIFT over N elements. That's O(N)!"_

```
ENQUEUE (insert at front) = O(N)!
═══════════════════════════════════════════════════════════════

  Before: [2][3][5][ ][ ][ ]   length=3

  Insert 1 at front:
  Step 1: Shift everything right!
         [ ][2][3][5][ ][ ]   ← N shifts!

  Step 2: Write at position 0!
         [1][2][3][5][ ][ ]

  → O(N)! Every element must move!

DEQUEUE (remove from front) = O(N)!
═══════════════════════════════════════════════════════════════

  Before: [2][3][5]   length=3

  Remove from front:
  Step 1: Save data[0] = 2
  Step 2: Shift everything left!
         [3][5][ ]   ← N shifts!

  → O(N)! Every element must move!
```

---

## §8. Delete in Middle — "Also O(N)!"

> Prime: _"Same thing with the middle. If you delete at the 5th index, everything beyond needs to be shifted down."_

---

## §9. Cleanup — "To Null or Not to Null?"

> Prime: _"In Java — set to null to release pointer for GC. In primitive arrays — don't have to zero out. Understand YOUR environment."_

---

## §10. "It Depends!" — "ArrayList vs Linked List?"

> Prime: _"Google interviews — 'let's say we're inserting and removing millions of items.' I'm like, are you REALLY doing 100 million items on a single machine?"_

---

## §11. Tự Implement: ArrayList

```javascript
// ═══ ArrayList ═══

class ArrayList {
  #data;
  #capacity;
  length = 0;

  constructor(capacity = 4) {
    this.#capacity = capacity;
    this.#data = new Array(capacity);
  }

  // Push: O(1) amortized!
  push(item) {
    if (this.length === this.#capacity) this.#grow();
    this.#data[this.length] = item;
    this.length++;
  }

  // Pop: O(1)!
  pop() {
    if (this.length === 0) return undefined;
    this.length--;
    return this.#data[this.length];
  }

  // Get: O(1)!
  get(idx) {
    if (idx >= this.length) return undefined;
    return this.#data[idx];
  }

  // Enqueue (insert front): O(N)!
  enqueue(item) {
    if (this.length === this.#capacity) this.#grow();
    for (let i = this.length; i > 0; i--) {
      this.#data[i] = this.#data[i - 1];
    }
    this.#data[0] = item;
    this.length++;
  }

  // Dequeue (remove front): O(N)!
  dequeue() {
    if (this.length === 0) return undefined;
    const val = this.#data[0];
    for (let i = 0; i < this.length - 1; i++) {
      this.#data[i] = this.#data[i + 1];
    }
    this.length--;
    return val;
  }

  #grow() {
    this.#capacity *= 2;
    const newData = new Array(this.#capacity);
    for (let i = 0; i < this.length; i++) {
      newData[i] = this.#data[i];
    }
    this.#data = newData;
  }
}

// Demo
console.log("═══ ARRAYLIST ═══\n");

const al = new ArrayList(3);
[2, 3, 5].forEach((v) => al.push(v));
console.log("After push 2,3,5:");
for (let i = 0; i < al.length; i++) console.log(`  [${i}] = ${al.get(i)}`);

al.push(7); // triggers grow!
console.log("\nAfter push 7 (grew!):");
for (let i = 0; i < al.length; i++) console.log(`  [${i}] = ${al.get(i)}`);

console.log("\nPop:", al.pop()); // 7
console.log("Pop:", al.pop()); // 5
console.log("Length:", al.length); // 2

console.log("\n═══ OPERATIONS ═══");
console.log("push/pop: O(1)! ✅");
console.log("get: O(1)! ✅");
console.log("enqueue/dequeue: O(N)! ❌");
```

---

## Checklist

```
[ ] ArrayList = array underneath + length + capacity!
[ ] Push: write at length, increment → O(1)!
[ ] Pop: decrement length, return → O(1)!
[ ] Get: check bounds, return data[idx] → O(1)!
[ ] Grow: double capacity, mem copy → amortized O(1)!
[ ] Enqueue/dequeue: shift everything → O(N)!
[ ] Delete middle: shift everything → O(N)!
[ ] "It depends" — push/pop = fine, enqueue = bad!
TIẾP THEO → Phần 22: Ring Buffer (ArrayBuffer)!
```
