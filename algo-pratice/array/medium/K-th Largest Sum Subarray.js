// ═══════════════════════════════════════════════════════════════
// K-th Largest Sum Contiguous Subarray
// ═══════════════════════════════════════════════════════════════

// ─── MinHeap implementation ────────────────────────────────────
class MinHeap {
  constructor() {
    this.heap = [];
  }

  get size() {
    return this.heap.length;
  }

  get top() {
    return this.heap[0];
  }

  push(val) {
    this.heap.push(val);
    this._bubbleUp(this.heap.length - 1);
  }

  pop() {
    const top = this.heap[0];
    const last = this.heap.pop();
    if (this.heap.length > 0) {
      this.heap[0] = last;
      this._sinkDown(0);
    }
    return top;
  }

  _bubbleUp(i) {
    while (i > 0) {
      const parent = Math.floor((i - 1) / 2);
      if (this.heap[parent] <= this.heap[i]) break;
      [this.heap[parent], this.heap[i]] = [this.heap[i], this.heap[parent]];
      i = parent;
    }
  }

  _sinkDown(i) {
    const n = this.heap.length;
    while (true) {
      let smallest = i;
      const left = 2 * i + 1;
      const right = 2 * i + 2;
      if (left < n && this.heap[left] < this.heap[smallest]) smallest = left;
      if (right < n && this.heap[right] < this.heap[smallest]) smallest = right;
      if (smallest === i) break;
      [this.heap[smallest], this.heap[i]] = [this.heap[i], this.heap[smallest]];
      i = smallest;
    }
  }
}

// ─── Solution 1: Sort all sums — O(n² log n) ──────────────────
function kthLargestSumSort(arr, k) {
  const n = arr.length;
  const sums = [];

  for (let i = 0; i < n; i++) {
    let sum = 0;
    for (let j = i; j < n; j++) {
      sum += arr[j];
      sums.push(sum);
    }
  }

  sums.sort((a, b) => b - a);
  return sums[k - 1];
}

// ─── Solution 2: Min-Heap size k — O(n² log k) ⭐ ─────────────
function kthLargestSumHeap(arr, k) {
  const n = arr.length;
  const heap = new MinHeap();

  for (let i = 0; i < n; i++) {
    let sum = 0;
    for (let j = i; j < n; j++) {
      sum += arr[j];

      if (heap.size < k) {
        heap.push(sum);
      } else if (sum > heap.top) {
        heap.pop();
        heap.push(sum);
      }
    }
  }

  return heap.top;
}

// ─── Tests ──────────────────────────────────────────────────────
const tests = [
  { arr: [20, -5, -1], k: 3, expected: 14 },
  { arr: [10, -10, 20, -40], k: 6, expected: -10 },
  { arr: [1, 2, 3], k: 1, expected: 6 },
  { arr: [1, 2, 3], k: 6, expected: 1 },
  { arr: [5], k: 1, expected: 5 },
  { arr: [-1, -2, -3], k: 1, expected: -1 },
  { arr: [3, -2, 5], k: 2, expected: 5 },
  { arr: [1, -1, 1], k: 3, expected: 1 },
];

const solutions = [
  { name: "Sort all sums", fn: kthLargestSumSort },
  { name: "Min-Heap size k ⭐", fn: kthLargestSumHeap },
];

solutions.forEach(({ name, fn }) => {
  console.log(`\n=== ${name} ===`);
  tests.forEach(({ arr, k, expected }) => {
    const result = fn([...arr], k);
    const pass = result === expected;
    const status = pass ? "✅" : "❌";
    console.log(
      `${status} arr=[${arr}], k=${k} → ${result} (expected ${expected})`
    );
  });
});
