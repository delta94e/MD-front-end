# The Last Algorithms Course You'll Need — Phần 46: Heap — "Priority Queue, Min/Max, Array-Backed Tree, 2i+1/2i+2, HeapifyUp/Down!"

> 📅 2026-03-09 · ⏱ 30 phút đọc
>
> Nguồn: Frontend Masters — ThePrimeagen
> Bài: Heap — "Binary heap = priority queue, min/max heap, weak ordering, array-backed tree (no nodes!), index math (2i+1, 2i+2, (i-1)/2), heapify up/down, self-balancing, always complete!"
> Độ khó: ⭐️⭐️⭐️⭐️⭐️ | Core — heap data structure, array representation, insertion/deletion, the funnest data structure!

---

## Mục Lục

| #   | Phần                                                 |
| --- | ---------------------------------------------------- |
| 1   | "Just Say Priority Queue, I'll Hire You!"            |
| 2   | Min Heap vs Max Heap — "Weak Ordering!"              |
| 3   | Heap Condition — "Every Child ≥ Parent (Min)!"       |
| 4   | Insert — "Add at End, Bubble UP!"                    |
| 5   | Delete — "Remove Top, Put Last at Top, Bubble DOWN!" |
| 6   | Array-Backed Tree — "No Nodes, Just Math!"           |
| 7   | Index Formulas — "2i+1, 2i+2, (i-1)/2!"              |
| 8   | Always Complete — "Self-Balancing, No Gaps!"         |
| 9   | Update — "Change Value, Bubble Up or Down!"          |
| 10  | Tự Implement: Min Heap                               |

---

## §1. "Just Say Priority Queue, I'll Hire You!"

> Prime: _"If you just say the word 'priority queue', I'm gonna hire you in an interview. I know it's a joke, but it's not a joke, but it's definitely not really a joke."_ 😂

---

## §2. Min Heap vs Max Heap — "Weak Ordering!"

> Prime: _"A heap is a binary tree where every child or grandchild is smaller (max heap) or larger (min heap) than the current node."_

|             | Min Heap              | Max Heap              |
| ----------- | --------------------- | --------------------- |
| Root        | Smallest value!       | Largest value!        |
| Children    | ≥ parent!             | ≤ parent!             |
| Get min/max | O(1) — it's the root! | O(1) — it's the root! |

```
MIN HEAP:
═══════════════════════════════════════════════════════════════

          (50)         ← smallest at top!
         /    \
       (71)   (100)    ← both > 50! ✅
       / \    /
    (101)(80)(200)     ← all > their parents! ✅

  "It's NOT perfectly ordered (80 > 101 on same level).
   It's WEAK ordering — rule at every node, not globally sorted!" — Prime
```

---

## §3. Heap Condition — "Every Child ≥ Parent (Min)!"

```
HEAP CONDITION (min heap):
═══════════════════════════════════════════════════════════════

  At EVERY node: all descendants ≥ this node!

  ✅ Valid:           ❌ Invalid:
     (3)                 (3)
    /   \               /   \
  (50)  (71)          (50)  (71)
                      /
                    (2)  ← 2 < 3! VIOLATED!
```

---

## §4. Insert — "Add at End, Bubble UP!"

> Prime: _"We go to the final spot in our tree and add the node. Then we bubble up."_

```
INSERT 3 INTO MIN HEAP:
═══════════════════════════════════════════════════════════════

  Before:
          (50)
         /    \
       (71)   (100)
       / \    /
    (101)(80)(200)

  Step 1: Add 3 at next available spot!
          (50)
         /    \
       (71)   (100)
       / \    /   \
    (101)(80)(200) (3) ← added here!

  Step 2: Bubble UP! (3 < 100?)
          (50)
         /    \
       (71)   (3)   ← swapped!
       / \    /   \
    (101)(80)(200)(100)

  Step 3: Bubble UP! (3 < 50?)
          (3)        ← swapped! New root!
         /    \
       (71)   (50)
       / \    /   \
    (101)(80)(200)(100)

  ✅ Heap condition restored!
```

---

## §5. Delete — "Remove Top, Put Last at Top, Bubble DOWN!"

> Prime: _"We remove the top, take our very last node, put it at the top, then heapify DOWN."_

```
DELETE MIN FROM HEAP:
═══════════════════════════════════════════════════════════════

  Before:
          (3)
         /    \
       (71)   (50)
       / \    /   \
    (101)(80)(200)(100)

  Step 1: Remove 3 (return it!), put LAST node (100) at top!
          (100)  ← last node moved up!
         /    \
       (71)   (50)
       / \    /
    (101)(80)(200)

  Step 2: Heapify DOWN! Compare with SMALLER child!
  min(71, 50) = 50. Is 100 > 50? YES → swap!
          (50)
         /    \
       (71)   (100)
       / \    /
    (101)(80)(200)

  Step 3: min(200, ∅) = 200. Is 100 > 200? NO → STOP!
  ✅ Heap condition restored!
```

---

## §6. Array-Backed Tree — "No Nodes, Just Math!"

> Prime: _"Let's put an index on each node... that sounds a lot like an ARRAY."_

```
ARRAY-BACKED TREE:
═══════════════════════════════════════════════════════════════

  Tree with indices:
          (50)₀
         /    \
      (71)₁   (100)₂
       / \      /
   (101)₃(80)₄(200)₅

  Array: [50, 71, 100, 101, 80, 200]
  Index:   0   1    2    3   4    5

  "There's no next, no previous, no left, no right,
   no parent — just an ARRAY with math!" — Prime

  Backing data structure: ArrayList (growable!)
```

---

## §7. Index Formulas — "2i+1, 2i+2, (i-1)/2!"

```
INDEX MATH:
═══════════════════════════════════════════════════════════════

  Left child:  2i + 1
  Right child: 2i + 2
  Parent:      floor((i - 1) / 2)

  Example (i = 2, node = 100):
  Left child:  2(2)+1 = 5 → arr[5] = 200 ✅
  Right child: 2(2)+2 = 6 → arr[6] = (next insert!)

  Example (i = 5, node = 200):
  Parent: floor((5-1)/2) = floor(2) = 2 → arr[2] = 100 ✅

  Example (i = 6, checking both children go to parent 2):
  floor((6-1)/2) = floor(2.5) = 2 ✅
  floor((5-1)/2) = floor(2) = 2 ✅

  "Both children point to the SAME parent!
   We just math our way into the tree!" — Prime
```

> ⚠️ JavaScript note: integer division doesn't floor automatically! Use `Math.floor((i-1)/2)`!

---

## §8. Always Complete — "Self-Balancing, No Gaps!"

> Prime: _"A heap is always a FULL or COMPLETE tree. Every node is filled from left to right, always tree level. There are no gaps, no holes."_

```
ALWAYS COMPLETE:
═══════════════════════════════════════════════════════════════

  ✅ Valid heap shape:       ❌ Invalid (gap!):
      (3)                        (3)
     /   \                      /   \
   (50)  (71)                (50)    (71)
   /                                /
  (80)                            (80)
                              ← missing left child of 50!

  "Self-balancing! Always add at length index,
   always delete from top + move last to top." — Prime
```

---

## §9. Update — "Change Value, Bubble Up or Down!"

> Prime: _"If you want to UPDATE a node, you need a hash map of value-to-index. Change the value, then bubble up or down. This makes some algorithms WAY faster."_

---

## §10. Tự Implement: Min Heap

```javascript
// ═══ Min Heap — Array-Backed Priority Queue ═══

class MinHeap {
  #data = [];
  length = 0;

  // Insert: add at end, bubble up!
  insert(value) {
    this.#data[this.length] = value;
    this.#heapifyUp(this.length);
    this.length++;
  }

  // Delete: remove top, put last at top, bubble down!
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

  // Peek: get min without removing!
  peek() {
    return this.length > 0 ? this.#data[0] : undefined;
  }

  // Bubble UP: compare with parent, swap if smaller!
  #heapifyUp(idx) {
    if (idx === 0) return;

    const parentIdx = Math.floor((idx - 1) / 2);

    if (this.#data[parentIdx] > this.#data[idx]) {
      // Swap!
      const tmp = this.#data[idx];
      this.#data[idx] = this.#data[parentIdx];
      this.#data[parentIdx] = tmp;

      this.#heapifyUp(parentIdx);
    }
  }

  // Bubble DOWN: compare with smaller child, swap if larger!
  #heapifyDown(idx) {
    const leftIdx = 2 * idx + 1;
    const rightIdx = 2 * idx + 2;

    if (leftIdx >= this.length) return; // no children!

    // Find smaller child!
    let smallerIdx = leftIdx;
    if (rightIdx < this.length && this.#data[rightIdx] < this.#data[leftIdx]) {
      smallerIdx = rightIdx;
    }

    // Swap if parent > smaller child!
    if (this.#data[idx] > this.#data[smallerIdx]) {
      const tmp = this.#data[idx];
      this.#data[idx] = this.#data[smallerIdx];
      this.#data[smallerIdx] = tmp;

      this.#heapifyDown(smallerIdx);
    }
  }

  // Debug: show array!
  toArray() {
    return this.#data.slice(0, this.length);
  }
}

// Demo!
console.log("═══ MIN HEAP ═══\n");

const heap = new MinHeap();
[50, 71, 100, 101, 80, 200].forEach((v) => heap.insert(v));
console.log("After inserts:", heap.toArray());
console.log("Peek (min):", heap.peek()); // 50

heap.insert(3);
console.log("Insert 3:", heap.toArray()); // 3 bubbles to top!
console.log("Peek:", heap.peek()); // 3

console.log("\nDelete min:");
console.log("delete():", heap.delete()); // 3
console.log("delete():", heap.delete()); // 50
console.log("delete():", heap.delete()); // 71
console.log("Remaining:", heap.toArray());

console.log("\n═══ INDEX FORMULAS ═══");
console.log("Left child:  2i + 1");
console.log("Right child: 2i + 2");
console.log("Parent:      floor((i-1) / 2)");

console.log("\n═══ COMPLEXITY ═══");
console.log("Insert:  O(log N) — bubble up!");
console.log("Delete:  O(log N) — bubble down!");
console.log("Peek:    O(1) — just arr[0]!");

console.log("\n✅ Self-balancing, always complete!");
console.log("✅ Array-backed — no node pointers!");
console.log("✅ 'The funnest data structure!' — Prime");
```

---

## Checklist

```
[ ] Heap = priority queue = binary tree with weak ordering!
[ ] Min heap: root = smallest. Max heap: root = largest!
[ ] Heap condition: every child ≥ parent (min) or ≤ parent (max)!
[ ] Insert: add at end, heapify UP! O(log N)!
[ ] Delete: remove top, move last to top, heapify DOWN! O(log N)!
[ ] Array-backed: no nodes/pointers — just index math!
[ ] Left child = 2i+1, Right child = 2i+2, Parent = floor((i-1)/2)!
[ ] Always complete: no gaps, left-to-right filling!
[ ] Self-balancing: always perfectly balanced binary tree!
[ ] Update: need value→index hash map for O(log N) update!
[ ] "Just say priority queue, I'll hire you" — Prime 😂
TIẾP THEO → Phần 47: Implementing Heap!
```
