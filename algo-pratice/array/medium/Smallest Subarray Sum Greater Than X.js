// ═══════════════════════════════════════════════════════════════
// Smallest Subarray with Sum Greater Than X
// ═══════════════════════════════════════════════════════════════

// ─── Solution 1: Brute Force — O(n²) ──────────────────────────
function smallestSubarrayBrute(arr, x) {
  const n = arr.length;
  let minLen = n + 1;

  for (let start = 0; start < n; start++) {
    let sum = 0;
    for (let end = start; end < n; end++) {
      sum += arr[end];
      if (sum > x) {
        minLen = Math.min(minLen, end - start + 1);
        break;
      }
    }
  }

  return minLen > n ? 0 : minLen;
}

// ─── Solution 2: Sliding Window — O(n) ⭐ ─────────────────────
function smallestSubarraySum(arr, x) {
  const n = arr.length;
  let start = 0;
  let sum = 0;
  let minLen = n + 1;

  for (let end = 0; end < n; end++) {
    sum += arr[end]; // EXPAND

    while (sum > x) {
      // SHRINK
      minLen = Math.min(minLen, end - start + 1);
      sum -= arr[start];
      start++;
    }
  }

  return minLen > n ? 0 : minLen;
}

// ─── Tests ──────────────────────────────────────────────────────
const tests = [
  { arr: [1, 4, 45, 6, 0, 19], x: 51, expected: 3 },
  { arr: [1, 10, 5, 2, 7], x: 100, expected: 0 },
  { arr: [100], x: 50, expected: 1 },
  { arr: [1, 2, 3, 4, 5], x: 11, expected: 3 },
  { arr: [5, 1, 3, 5, 10, 7, 4, 9, 2, 8], x: 15, expected: 2 },
  { arr: [1, 1, 1, 1, 1], x: 3, expected: 4 },
  { arr: [0, 0, 0, 0], x: 0, expected: 0 },
  { arr: [10, 20, 30], x: 5, expected: 1 },
  { arr: [1, 2, 3, 4, 5], x: 15, expected: 0 },
  { arr: [1, 2, 3, 4, 5], x: 14, expected: 5 },
];

const solutions = [
  { name: "Brute Force", fn: smallestSubarrayBrute },
  { name: "Sliding Window ⭐", fn: smallestSubarraySum },
];

solutions.forEach(({ name, fn }) => {
  console.log(`\n=== ${name} ===`);
  tests.forEach(({ arr, x, expected }) => {
    const result = fn([...arr], x);
    const pass = result === expected;
    const status = pass ? "✅" : "❌";
    console.log(
      `${status} arr=[${arr}], x=${x} → ${result} (expected ${expected})`
    );
  });
});
