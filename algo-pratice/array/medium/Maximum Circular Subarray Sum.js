// ═══════════════════════════════════════════════════════════════
// Maximum Circular Subarray Sum
// ═══════════════════════════════════════════════════════════════

// ─── Solution 1: Brute Force — O(n²) ───────────────────────────
function maxCircularSubarraySumBrute(arr) {
  const n = arr.length;
  let maxSum = -Infinity;

  for (let i = 0; i < n; i++) {
    let currentSum = 0;
    for (let j = 0; j < n; j++) {
      currentSum += arr[(i + j) % n]; // % n để wrap around!
      maxSum = Math.max(maxSum, currentSum);
    }
  }
  return maxSum;
}

// ─── Solution 2: Kadane's max + min — O(n) ⭐ ──────────────────
function maxCircularSubarraySum(arr) {
  const n = arr.length;

  // Bước 1: Tính totalSum
  let totalSum = 0;
  for (let i = 0; i < n; i++) {
    totalSum += arr[i];
  }

  // Bước 2: Kadane's MAX (Case 1 — không wrap)
  let maxEndingHere = arr[0];
  let maxNormal = arr[0];
  for (let i = 1; i < n; i++) {
    maxEndingHere = Math.max(arr[i], maxEndingHere + arr[i]);
    maxNormal = Math.max(maxNormal, maxEndingHere);
  }

  // Bước 3: Kadane's MIN (cho Case 2 — wrap)
  let minEndingHere = arr[0];
  let minSubarray = arr[0];
  for (let i = 1; i < n; i++) {
    minEndingHere = Math.min(arr[i], minEndingHere + arr[i]);
    minSubarray = Math.min(minSubarray, minEndingHere);
  }

  // Bước 4: Tính maxWrap
  const maxWrap = totalSum - minSubarray;

  // Bước 5: Edge case — toàn âm!
  if (totalSum === minSubarray) {
    return maxNormal;
  }

  // Bước 6: Đáp án
  return Math.max(maxNormal, maxWrap);
}

// ─── Solution 3: Gọn — 1 vòng for duy nhất ────────────────────
function maxCircularSubarraySumOnePass(arr) {
  let totalSum = arr[0];
  let maxEndHere = arr[0],
    maxNormal = arr[0];
  let minEndHere = arr[0],
    minSub = arr[0];

  for (let i = 1; i < arr.length; i++) {
    totalSum += arr[i];

    // Kadane's max
    maxEndHere = Math.max(arr[i], maxEndHere + arr[i]);
    maxNormal = Math.max(maxNormal, maxEndHere);

    // Kadane's min
    minEndHere = Math.min(arr[i], minEndHere + arr[i]);
    minSub = Math.min(minSub, minEndHere);
  }

  if (totalSum === minSub) return maxNormal;
  return Math.max(maxNormal, totalSum - minSub);
}

// ─── Tests ──────────────────────────────────────────────────────
const tests = [
  { input: [8, -8, 9, -9, 10, -11, 12], expected: 22 },
  { input: [4, -1, -2, 3], expected: 7 },
  { input: [5, -2, 3, 4], expected: 12 },
  { input: [-3, -2, -1], expected: -1 },
  { input: [1, 2, 3], expected: 6 },
  { input: [5], expected: 5 },
  { input: [-1], expected: -1 },
  { input: [3, -1, 2, -1], expected: 4 },
];

console.log("=== Brute Force ===");
tests.forEach(({ input, expected }) => {
  const result = maxCircularSubarraySumBrute(input);
  const status = result === expected ? "✅" : "❌";
  console.log(`${status} [${input}] → ${result} (expected ${expected})`);
});

console.log("\n=== Kadane's max + min ===");
tests.forEach(({ input, expected }) => {
  const result = maxCircularSubarraySum(input);
  const status = result === expected ? "✅" : "❌";
  console.log(`${status} [${input}] → ${result} (expected ${expected})`);
});

console.log("\n=== One Pass ===");
tests.forEach(({ input, expected }) => {
  const result = maxCircularSubarraySumOnePass(input);
  const status = result === expected ? "✅" : "❌";
  console.log(`${status} [${input}] → ${result} (expected ${expected})`);
});
