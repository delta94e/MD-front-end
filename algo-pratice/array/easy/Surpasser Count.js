// ═══════════════════════════════════════════════════════════════
// Surpasser Count of Each Element in Array
// ═══════════════════════════════════════════════════════════════

// ─── Solution 1: Brute Force — O(n²) ──────────────────────────
function surpasserCountBrute(arr) {
  const n = arr.length;
  const res = new Array(n).fill(0);

  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      if (arr[j] > arr[i]) {
        res[i]++;
      }
    }
  }

  return res;
}

// ─── Helper: Upper Bound (binary search) ──────────────────────
function upperBound(sortedArr, target) {
  let lo = 0,
    hi = sortedArr.length;
  while (lo < hi) {
    const mid = (lo + hi) >> 1;
    if (sortedArr[mid] <= target) {
      lo = mid + 1;
    } else {
      hi = mid;
    }
  }
  return lo;
}

// ─── Solution 2: Right→Left + Binary Search — O(n²) / O(n log n) avg
function surpasserCountBinSearch(arr) {
  const n = arr.length;
  const res = new Array(n).fill(0);
  const sorted = [];

  for (let i = n - 1; i >= 0; i--) {
    const pos = upperBound(sorted, arr[i]);
    res[i] = sorted.length - pos;
    sorted.splice(pos, 0, arr[i]);
  }

  return res;
}

// ─── Tests ──────────────────────────────────────────────────────
const tests = [
  { arr: [2, 7, 5, 3, 8, 1], expected: [4, 1, 1, 1, 0, 0] },
  { arr: [4, 5, 1], expected: [1, 0, 0] },
  { arr: [1, 2, 3, 4, 5], expected: [4, 3, 2, 1, 0] },
  { arr: [5, 4, 3, 2, 1], expected: [0, 0, 0, 0, 0] },
  { arr: [1], expected: [0] },
  { arr: [3, 1], expected: [0, 0] },
  { arr: [1, 3], expected: [1, 0] },
  { arr: [10, 1, 2, 3, 15], expected: [1, 3, 2, 1, 0] },
];

const solutions = [
  { name: "Brute Force", fn: surpasserCountBrute },
  { name: "Right→Left + BinSearch", fn: surpasserCountBinSearch },
];

solutions.forEach(({ name, fn }) => {
  console.log(`\n=== ${name} ===`);
  tests.forEach(({ arr, expected }) => {
    const result = fn([...arr]);
    const pass = JSON.stringify(result) === JSON.stringify(expected);
    const status = pass ? "✅" : "❌";
    console.log(
      `${status} [${arr}] → [${result}] (expected [${expected}])`
    );
  });
});
