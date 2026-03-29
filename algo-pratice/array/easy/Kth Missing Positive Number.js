// ═══════════════════════════════════════════════════════════════
// Kth Missing Positive Number in a Sorted Array
// ═══════════════════════════════════════════════════════════════

// ─── Solution 1: Linear Scan — O(n + k) ───────────────────────
function findKthMissingLinear(arr, k) {
  let missing = 0;
  let current = 1;
  let idx = 0;

  while (true) {
    if (idx < arr.length && arr[idx] === current) {
      idx++;
    } else {
      missing++;
      if (missing === k) return current;
    }
    current++;
  }
}

// ─── Solution 2: Binary Search — O(log n) ⭐ ──────────────────
function findKthMissing(arr, k) {
  let lo = 0,
    hi = arr.length;

  while (lo < hi) {
    const mid = (lo + hi) >> 1;
    const missingBefore = arr[mid] - (mid + 1);

    if (missingBefore < k) {
      lo = mid + 1;
    } else {
      hi = mid;
    }
  }

  return k + lo;
}

// ─── Tests ──────────────────────────────────────────────────────
const tests = [
  { arr: [2, 3, 4, 7, 11], k: 5, expected: 9 },
  { arr: [1, 2, 3], k: 2, expected: 5 },
  { arr: [3, 5, 9, 10, 11, 12], k: 2, expected: 2 },
  { arr: [1], k: 1, expected: 2 },
  { arr: [2], k: 1, expected: 1 },
  { arr: [1, 2, 3, 4], k: 2, expected: 6 },
  { arr: [5, 6, 7, 8], k: 4, expected: 4 },
  { arr: [1, 3], k: 1, expected: 2 },
];

const solutions = [
  { name: "Linear Scan", fn: findKthMissingLinear },
  { name: "Binary Search ⭐", fn: findKthMissing },
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
