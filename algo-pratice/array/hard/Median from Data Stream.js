// ═══════════════════════════════════════════════════════════════
// Find Median from Running Data Stream
// ═══════════════════════════════════════════════════════════════

// ─── MinHeap Implementation ───────────────────────────────────
class MinHeap {
  constructor() { this.data = []; }
  size() { return this.data.length; }
  peek() { return this.data[0]; }

  push(val) {
    this.data.push(val);
    let i = this.data.length - 1;
    while (i > 0) {
      const p = (i - 1) >> 1;
      if (this.data[p] <= this.data[i]) break;
      [this.data[p], this.data[i]] = [this.data[i], this.data[p]];
      i = p;
    }
  }

  pop() {
    const top = this.data[0];
    const last = this.data.pop();
    if (this.data.length > 0) {
      this.data[0] = last;
      let i = 0;
      while (true) {
        let s = i, l = 2*i+1, r = 2*i+2;
        if (l < this.data.length && this.data[l] < this.data[s]) s = l;
        if (r < this.data.length && this.data[r] < this.data[s]) s = r;
        if (s === i) break;
        [this.data[s], this.data[i]] = [this.data[i], this.data[s]];
        i = s;
      }
    }
    return top;
  }
}

// ─── MaxHeap via negated MinHeap ──────────────────────────────
class MaxHeap {
  constructor() { this.heap = new MinHeap(); }
  size() { return this.heap.size(); }
  peek() { return -this.heap.peek(); }
  push(val) { this.heap.push(-val); }
  pop() { return -this.heap.pop(); }
}

// ─── Solution: Two Heaps — O(log n) per insert ⭐ ─────────────
function findMedianStream(arr) {
  const maxH = new MaxHeap(); // Lower half
  const minH = new MinHeap(); // Upper half
  const result = [];

  for (const num of arr) {
    maxH.push(num);
    minH.push(maxH.pop());
    if (minH.size() > maxH.size()) {
      maxH.push(minH.pop());
    }

    if (maxH.size() > minH.size()) {
      result.push(maxH.peek());
    } else {
      result.push((maxH.peek() + minH.peek()) / 2);
    }
  }

  return result;
}

// ─── Tests ──────────────────────────────────────────────────────
const tests = [
  { arr: [5, 15, 1, 3, 2, 8], expected: [5, 10, 5, 4, 3, 4] },
  { arr: [2, 2, 2, 2], expected: [2, 2, 2, 2] },
  { arr: [1], expected: [1] },
  { arr: [1, 2], expected: [1, 1.5] },
  { arr: [3, 1, 2], expected: [3, 2, 2] },
  { arr: [5, 4, 3, 2, 1], expected: [5, 4.5, 4, 3.5, 3] },
  { arr: [1, 2, 3, 4, 5], expected: [1, 1.5, 2, 2.5, 3] },
];

console.log("=== Median from Data Stream ===\n");
tests.forEach(({ arr, expected }) => {
  const result = findMedianStream([...arr]);
  const pass = JSON.stringify(result) === JSON.stringify(expected);
  const status = pass ? "✅" : "❌";
  console.log(`${status} [${arr}] → [${result}] (expected [${expected}])`);
});
