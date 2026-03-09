# The Last Algorithms Course You'll Need — Phần 22: Ring Buffer (ArrayBuffer) — "Modulo Magic, All O(1), Log Batcher, Object Pool!"

> 📅 2026-03-09 · ⏱ 20 phút đọc
>
> Nguồn: Frontend Masters — ThePrimeagen
> Bài: Ring Buffer — "index-based head/tail, modulo wraps around, push/pop/shift/unshift ALL O(1), resize when tail meets head!"
> Độ khó: ⭐️⭐️⭐️⭐️ | Data Structure — ring buffer, modulo operator, the best of both worlds!

---

## Mục Lục

| #   | Phần                                                     |
| --- | -------------------------------------------------------- |
| 1   | "One More List!" — "My Favorite, I Use It All the Time!" |
| 2   | How It Works — "Index-Based Head and Tail!"              |
| 3   | Modulo — "The Ring!"                                     |
| 4   | All Operations O(1)! — "Push, Pop, Shift, Unshift!"      |
| 5   | Resize — "When Tail Meets Head!"                         |
| 6   | Use Cases — "Log Batcher, Object Pool!"                  |
| 7   | Tự Implement: Ring Buffer Concept                        |
| 8   | 🔬 Deep Analysis — ArrayList vs Ring Buffer              |

---

## §1. "One More List!" — "My Favorite, I Use It All the Time!"

> Prime: _"I know you feel like you've had enough lists, but there's ONE more. I think it's very fantastic — I use it ALL the time. I've created bajillions of these."_

_"I tried to make a PR once to an open source library that wasn't using one. It would cause terrible performance. They didn't accept my PR, but I was right."_

---

## §2. How It Works — "Index-Based Head and Tail!"

> Prime: _"Think the exact same thing as an ArrayList. The only difference — we're not using 0 as our head and length as our tail. Instead, we have INDEX-BASED head and tail."_

```
RING BUFFER:
═══════════════════════════════════════════════════════════════

  ArrayList:
  [used][used][used][ ][ ][ ]
   ↑ head=0          ↑ tail=length

  Ring Buffer:
  [ ][ ][used][used][used][ ]
         ↑ head=2         ↑ tail=5

  Head and tail can be ANYWHERE in the array!

  Remove from front: head++ → O(1)! No shifting! 🎯
  Add to back: tail++ → O(1)!
```

---

## §3. Modulo — "The Ring!"

> Prime: _"What if you go off the edge? That's why they're called RING BUFFERS — the modulo operator! tail % length gives you your index."_

### The ring wraps around!

```
MODULO RING:
═══════════════════════════════════════════════════════════════

  Array size: 10  (indices 0-9)

  tail = 12  → 12 % 10 = 2  → index 2!
  head = 24  → 24 % 10 = 4  → index 4!

  Visualization:
       0   1   2   3   4   5   6   7   8   9
      [ ] [ ] [T] [ ] [H] [x] [x] [x] [x] [x]
              tail    head ──── used ────────→

  It WRAPS AROUND like a ring! 🔄

  "5 modulo 2 is 1. Most languages don't convert
   integers to floats without your permission.
   TypeScript rots your brain." — Prime 😂
```

---

## §4. All Operations O(1)! — "Push, Pop, Shift, Unshift!"

> Prime: _"Pushing, popping, shifting, unshifting — ALL are O(1) operations. Fantastic!"_

```
ALL O(1):
═══════════════════════════════════════════════════════════════

  Push (add to tail):    tail++, write → O(1)!
  Pop (remove from tail): tail--, read → O(1)!
  Shift (remove from head): head++, read → O(1)! 🎯
  Unshift (add to head): head--, write → O(1)! 🎯

  Compare to ArrayList:
  Push: O(1) ✅ same!
  Pop: O(1) ✅ same!
  Shift: O(1) 🎯 vs O(N) ❌ ← HUGE WIN!
  Unshift: O(1) 🎯 vs O(N) ❌ ← HUGE WIN!
```

---

## §5. Resize — "When Tail Meets Head!"

> Prime: _"The only problem: when your tail exceeds your head. You need to resize."_

```
RESIZE:
═══════════════════════════════════════════════════════════════

  Full! Tail caught up to head:
  [x][x][T/H][x][x][x][x][x][x][x]
        ↑ tail = head → must resize!

  Resize steps:
  1. Create new larger array
  2. Start at head, go length items
  3. Write into new array in order
  4. head = 0, tail = length

  Order is MAINTAINED! → Ring buffers preserve order!
```

---

## §6. Use Cases — "Log Batcher, Object Pool!"

> Prime: _"A log batcher — batch logs and write them. Logs need to maintain ORDER. Every so often, flush 50, 100 logs."_

### Object pooling!

Prime: _"If you have a service that creates a user for every request — thousands upon thousands — why recreate this object over and over? Have an object pool. Set new values, use it, hand it back."_

_"Your memory doesn't go like this 📈, instead it goes like that ➡️."_

---

## §7. Tự Implement: Ring Buffer Concept

```javascript
// ═══ Ring Buffer ═══

class RingBuffer {
  #data;
  #head = 0;
  #tail = 0;
  #capacity;
  length = 0;

  constructor(capacity = 8) {
    this.#capacity = capacity;
    this.#data = new Array(capacity);
  }

  // Push (add to tail): O(1)!
  push(item) {
    if (this.length === this.#capacity) this.#grow();
    this.#data[this.#tail % this.#capacity] = item;
    this.#tail++;
    this.length++;
  }

  // Pop (remove from tail): O(1)!
  pop() {
    if (this.length === 0) return undefined;
    this.#tail--;
    this.length--;
    return this.#data[this.#tail % this.#capacity];
  }

  // Unshift (add to head): O(1)!
  unshift(item) {
    if (this.length === this.#capacity) this.#grow();
    this.#head--;
    this.#data[
      ((this.#head % this.#capacity) + this.#capacity) % this.#capacity
    ] = item;
    this.length++;
  }

  // Shift (remove from head): O(1)!
  shift() {
    if (this.length === 0) return undefined;
    const idx =
      ((this.#head % this.#capacity) + this.#capacity) % this.#capacity;
    const val = this.#data[idx];
    this.#head++;
    this.length--;
    return val;
  }

  // Get: O(1)!
  get(index) {
    if (index >= this.length) return undefined;
    const realIdx =
      (((this.#head + index) % this.#capacity) + this.#capacity) %
      this.#capacity;
    return this.#data[realIdx];
  }

  #grow() {
    const newCap = this.#capacity * 2;
    const newData = new Array(newCap);
    for (let i = 0; i < this.length; i++) {
      const realIdx =
        (((this.#head + i) % this.#capacity) + this.#capacity) % this.#capacity;
      newData[i] = this.#data[realIdx];
    }
    this.#data = newData;
    this.#head = 0;
    this.#tail = this.length;
    this.#capacity = newCap;
  }
}

// Demo
console.log("═══ RING BUFFER ═══\n");

const rb = new RingBuffer(4);
rb.push(1);
rb.push(2);
rb.push(3);
console.log("Push 1,2,3:");
for (let i = 0; i < rb.length; i++) console.log(`  [${i}] = ${rb.get(i)}`);

console.log("\nShift:", rb.shift()); // 1 — O(1)!
console.log("Shift:", rb.shift()); // 2 — O(1)!

rb.push(4);
rb.push(5);
console.log("\nAfter shifts + push 4,5:");
for (let i = 0; i < rb.length; i++) console.log(`  [${i}] = ${rb.get(i)}`);

rb.unshift(0);
console.log("\nUnshift 0:");
for (let i = 0; i < rb.length; i++) console.log(`  [${i}] = ${rb.get(i)}`);

console.log("\n✅ Push/Pop: O(1)!");
console.log("✅ Shift/Unshift: O(1)! ← RING BUFFER WINS!");
console.log("✅ Get: O(1)!");
```

---

## §8. 🔬 Deep Analysis — ArrayList vs Ring Buffer

```
ARRAYLIST vs RING BUFFER:
═══════════════════════════════════════════════════════════════

  Operation   | ArrayList | Ring Buffer
  ────────────|───────────|────────────
  Push        | O(1)      | O(1)
  Pop         | O(1)      | O(1)
  Shift       | O(N) ❌   | O(1) ✅
  Unshift     | O(N) ❌   | O(1) ✅
  Get         | O(1)      | O(1)
  Resize      | O(N)      | O(N) (reorder)

  Ring Buffer = best of both worlds! 🏆

  "I always was curious why JS didn't use a
   double-ended ring buffer. I'm sure there's
   a great reason. I just don't know why." — Prime
```

---

## Checklist

```
[ ] Ring buffer = array with index-based head/tail!
[ ] Modulo operator: tail % capacity = real index!
[ ] Push/pop/shift/unshift ALL O(1)!
[ ] Wraps around like a ring!
[ ] Resize: when tail meets head, reorder into new array!
[ ] Maintains order (important for queues!)
[ ] Use cases: log batcher, object pool!
[ ] "I've created bajillions of these!" — Prime
TIẾP THEO → Phần 23: Data Structures Q&A!
```
