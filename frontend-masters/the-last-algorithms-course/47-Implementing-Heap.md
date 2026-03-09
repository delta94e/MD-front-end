# The Last Algorithms Course You'll Need — Phần 47: Implementing Heap — "heapifyUp/Down, Insert at Length, Delete Head, Classic Blunder!"

> 📅 2026-03-09 · ⏱ 25 phút đọc
>
> Nguồn: Frontend Masters — ThePrimeagen
> Bài: Implementing Heap — "private helpers (parent, leftChild, rightChild), heapifyUp recursive, heapifyDown with min child, insert/delete, forgot length-- classic blunder!"
> Độ khó: ⭐️⭐️⭐️⭐️⭐️ | Implementation — full min heap, the funnest data structure, first try almost!

---

## Mục Lục

| #   | Phần                                                      |
| --- | --------------------------------------------------------- |
| 1   | Setup — "Private Data + Length!"                          |
| 2   | Helper Functions — "parent(), leftChild(), rightChild()!" |
| 3   | heapifyUp — "Recursive, Compare with Parent!"             |
| 4   | heapifyDown — "Find Min Child, Swap if Larger!"           |
| 5   | Insert — "Add at Length, HeapifyUp, Length++!"            |
| 6   | Delete — "Swap Head with Last, Length--, HeapifyDown!"    |
| 7   | The Classic Blunder — "Forgot length-- in length===1!" 😂 |
| 8   | Running Time — "O(log N) Both, Always Complete!"          |
| 9   | Tự Implement: Complete MinHeap                            |

---

## §1. Setup — "Private Data + Length!"

```typescript
class MinHeap {
  public length: number;
  private data: number[];

  constructor() {
    this.data = [];
    this.length = 0;
  }
}
```

---

## §2. Helper Functions — "parent(), leftChild(), rightChild()!"

> Prime: _"We should make these into functions so we don't have 2\*index everywhere. If there's a problem, we'll be hunting all over our code."_

```typescript
private parent(idx: number): number {
  return Math.floor((idx - 1) / 2);
}

private leftChild(idx: number): number {
  return idx * 2 + 1;
}

private rightChild(idx: number): number {
  return idx * 2 + 2;
}
```

---

## §3. heapifyUp — "Recursive, Compare with Parent!"

> Prime: _"heapifyUp is easier than heapifyDown — we only have ONE value to look at: the parent."_

```typescript
private heapifyUp(idx: number): void {
  if (idx === 0) return;  // can't go higher!

  const p = this.parent(idx);
  const parentV = this.data[p];
  const v = this.data[idx];

  if (parentV > v) {
    // Parent is larger → swap! (min heap)
    this.data[idx] = parentV;
    this.data[p] = v;
    this.heapifyUp(p);  // keep bubbling up!
  }
}
```

```
heapifyUp FLOW:
═══════════════════════════════════════════════════════════════

  if idx === 0 → STOP!
  get parent value!
  if parent > me → SWAP + heapifyUp(parent)!
  if parent ≤ me → STOP! (we're in position!)
```

---

## §4. heapifyDown — "Find Min Child, Swap if Larger!"

> Prime: _"heapifyDown: first find the minimum child, then compare, then swap."_

```typescript
private heapifyDown(idx: number): void {
  const lIdx = this.leftChild(idx);
  const rIdx = this.rightChild(idx);

  if (lIdx >= this.length) return;  // no children!

  const lV = this.data[lIdx];
  const rV = this.data[rIdx];
  const v = this.data[idx];

  if (lV > rV && v > rV) {
    // Right is smaller AND we're bigger → swap right!
    this.data[idx] = rV;
    this.data[rIdx] = v;
    this.heapifyDown(rIdx);
  } else if (rV > lV && v > lV) {
    // Left is smaller AND we're bigger → swap left!
    this.data[idx] = lV;
    this.data[lIdx] = v;
    this.heapifyDown(lIdx);
  }
}
```

```
heapifyDown FLOW:
═══════════════════════════════════════════════════════════════

  if no left child → STOP! (no children at all!)
  find SMALLER child (min of left, right)!
  if me > smaller child → SWAP + heapifyDown(child)!
  if me ≤ smaller child → STOP!
```

---

## §5. Insert — "Add at Length, HeapifyUp, Length++!"

```typescript
insert(value: number): void {
  this.data[this.length] = value;
  this.heapifyUp(this.length);
  this.length++;
}
```

> Prime: _"It's literally that simple! Set the value at length, heapify up, increment length."_

---

## §6. Delete — "Swap Head with Last, Length--, HeapifyDown!"

> Prime: _"Do we reduce length THEN heapifyDown, or heapifyDown THEN reduce? Reduce first! heapifyDown considers length."_

```typescript
delete(): number | undefined {
  if (this.length === 0) return undefined;

  const out = this.data[0];
  this.length--;

  if (this.length === 0) {
    this.data = [];
    return out;
  }

  this.data[0] = this.data[this.length];
  this.heapifyDown(0);

  return out;
}
```

```
DELETE FLOW:
═══════════════════════════════════════════════════════════════

  1. Save head value (this.data[0])!
  2. length-- FIRST! (heapifyDown uses length!)
  3. Move last element to position 0!
  4. heapifyDown(0)!
  5. Return saved value!

  "Length is always exclusive. By removing one,
   we made it inclusive for a moment." — Prime
```

---

## §7. The Classic Blunder — "Forgot length-- in length===1!" 😂

> Prime: _"We didn't do it correct! Can we get an RIP in chat? We forgot to decrement length when length was 1."_

```
THE BUG:
═══════════════════════════════════════════════════════════════

  ❌ WRONG:
  if (this.length === 1) {
    this.data = [];
    return out;      // forgot length--! 💀
  }

  ✅ FIXED:
  if (this.length === 0) {  // already decremented above!
    this.data = [];
    return out;
  }

  "Classic blunder. If we would have simply done this,
   we would have been fine." — Prime 😂
```

---

## §8. Running Time — "O(log N) Both, Always Complete!"

> Prime: _"What's the worst case? You bubble all the way up or all the way down. The height is always log N because it's always a COMPLETE tree."_

| Operation | Time                    |
| --------- | ----------------------- |
| Insert    | O(log N) — bubble up!   |
| Delete    | O(log N) — bubble down! |
| Peek      | O(1) — just data[0]!    |

> Prime: _"Fibonacci heaps give even better solutions — mind-blowingly complicated. I still don't quite get how they work."_ 😂

---

## §9. Tự Implement: Complete MinHeap

```javascript
// ═══ MinHeap — Complete Implementation ═══

class MinHeap {
  #data = [];
  length = 0;

  // Index helpers!
  #parent(idx) {
    return Math.floor((idx - 1) / 2);
  }
  #leftChild(idx) {
    return idx * 2 + 1;
  }
  #rightChild(idx) {
    return idx * 2 + 2;
  }

  // HeapifyUp: bubble up if smaller than parent!
  #heapifyUp(idx) {
    if (idx === 0) return;

    const p = this.#parent(idx);
    const parentV = this.#data[p];
    const v = this.#data[idx];

    if (parentV > v) {
      this.#data[idx] = parentV;
      this.#data[p] = v;
      this.#heapifyUp(p);
    }
  }

  // HeapifyDown: bubble down, swap with smaller child!
  #heapifyDown(idx) {
    const lIdx = this.#leftChild(idx);
    const rIdx = this.#rightChild(idx);

    if (lIdx >= this.length) return;

    const lV = this.#data[lIdx];
    const rV = this.#data[rIdx];
    const v = this.#data[idx];

    if (lV > rV && v > rV) {
      this.#data[idx] = rV;
      this.#data[rIdx] = v;
      this.#heapifyDown(rIdx);
    } else if (rV > lV && v > lV) {
      this.#data[idx] = lV;
      this.#data[lIdx] = v;
      this.#heapifyDown(lIdx);
    }
  }

  insert(value) {
    this.#data[this.length] = value;
    this.#heapifyUp(this.length);
    this.length++;
  }

  delete() {
    if (this.length === 0) return undefined;

    const out = this.#data[0];
    this.length--;

    if (this.length === 0) {
      this.#data = [];
      return out;
    }

    this.#data[0] = this.#data[this.length];
    this.#heapifyDown(0);
    return out;
  }

  peek() {
    return this.length > 0 ? this.#data[0] : undefined;
  }
}

// Demo!
const heap = new MinHeap();
console.log("═══ IMPLEMENTING HEAP ═══\n");

[50, 71, 100, 101, 80, 200].forEach((v) => heap.insert(v));
console.log("Peek:", heap.peek()); // 50

heap.insert(3);
console.log("Insert 3, Peek:", heap.peek()); // 3

console.log("\nDelete sequence (should be sorted!):");
const sorted = [];
while (heap.length > 0) {
  sorted.push(heap.delete());
}
console.log("Result:", sorted); // [3,50,71,80,100,101,200]

console.log("\n═══ RUNNING TIME ═══");
console.log("Insert: O(log N)  Delete: O(log N)  Peek: O(1)");
console.log("Always complete → always O(log N) height!");

console.log("\n⚠️  Watch out: garbage in array past length!");
console.log("⚠️  length-- BEFORE heapifyDown!");
console.log("✅ The funnest data structure! — Prime");
```

---

## Checklist

```
[ ] Private helpers: parent(), leftChild(), rightChild()!
[ ] heapifyUp: recursive, compare with parent, swap if smaller!
[ ] heapifyDown: find min child, swap if larger!
[ ] Insert: data[length] = value, heapifyUp(length), length++!
[ ] Delete: save head, length--, move last to 0, heapifyDown(0)!
[ ] length-- BEFORE heapifyDown (it uses length!)
[ ] Check length===0 edge case (the classic blunder!)
[ ] O(log N) insert and delete, always complete!
[ ] Garbage: array may have stale values past length!
TIẾP THEO → Phần 48: Tries!
```
